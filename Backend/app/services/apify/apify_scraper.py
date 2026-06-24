import os
import re
import json
import time
from datetime import datetime, timezone
from typing import Optional, List
from concurrent.futures import ThreadPoolExecutor, as_completed

from dotenv import load_dotenv
from apify_client import ApifyClient

from app.schemas.lead_schema import ScrapedLead, Platform, PropertyType


load_dotenv()
APIFY_API_TOKEN: str = os.environ.get("APIFY_API_TOKEN", "")

# ACTOR REGISTRY 
ACTORS: dict = {
    "tiktok_hashtag":    "clockworks/tiktok-hashtag-scraper",
    "tiktok_main":       "clockworks/tiktok-scraper",
    "instagram_scraper": "apify/instagram-scraper",
    "instagram_hashtag": "apify/instagram-hashtag-scraper",
    "facebook_posts":    "apify/facebook-posts-scraper",
    "facebook_hashtag":  "apify/facebook-hashtag-scraper",
    "fb_resolver":       "apify/facebook-profile-scraper",
}

FACEBOOK_PAGE_MAP: dict = {
    "realestate":      "https://www.facebook.com/realestate",
    "zillow":          "https://www.facebook.com/zillow",
    "realtor":         "https://www.facebook.com/realtor",
    "rentalhouse":     "https://www.facebook.com/rentalhomes",
    "houseforrent":    "https://www.facebook.com/houseforrent",
    "propertyforsale": "https://www.facebook.com/propertyforsale",
}

# LIMITS (keep Apify credits low) 

DEFAULT_LIMIT   = 20

# CATEGORISATION TABLES 

PROPERTY_KEYWORDS: dict = {
    "apartment":  ["apartment", "flat", "condo", "condominium", "studio", "unit", "1bhk", "2bhk", "3bhk"],
    "villa":      ["villa", "mansion", "penthouse", "luxury home", "luxury house", "luxury property"],
    "house":      ["house", "home", "bungalow", "townhouse", "semi-detached", "detached", "single family"],
    "boarding":   ["boarding", "boarding room", "room for rent", "hostel", "shared room", "pg", "paying guest"],
    "farming":    ["farm", "farmland", "agricultural", "ranch", "plantation", "field", "acreage"],
    "land":       ["land", "plot", "lot", "vacant land", "block of land", "empty lot", "raw land"],
    "commercial": ["commercial", "office", "warehouse", "retail", "shop", "business property", "storefront"],
    "rental":     ["rent", "rental", "lease", "for rent", "monthly rent", "renting"],
    "investment": ["investment", "invest", "roi", "passive income", "cash flow", "buy to let"],
}

# Regex patterns to pull a city/country name from free text
_LOC_PATTERNS = [
    r'\b(?:in|from|at|near|located in|based in|moving to|relocating to|looking in|buying in|searching in)\s+([A-Z][a-zA-Z ]{2,28}?)(?:\s*[,!?\n#]|$)',
    r'#([A-Z][a-z]+(?:[A-Z][a-z]+)+)',        # CamelCase hashtags e.g. #NewYork #LosAngeles
    r'\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(?:real estate|property|homes?|market|realty)\b',
]


# HELPERS 

def _make_client() -> ApifyClient:
    """Create a fresh ApifyClient per thread."""
    if not APIFY_API_TOKEN:
        raise RuntimeError("APIFY_API_TOKEN not set. Add it to your .env file.")
    return ApifyClient(APIFY_API_TOKEN)


def _parse_ts(ts) -> Optional[datetime]:
    """Convert UNIX timestamp or date string to a datetime object."""
    if not ts:
        return None
    # Try UNIX timestamp
    try:
        return datetime.fromtimestamp(int(ts), tz=timezone.utc)
    except (ValueError, TypeError, OSError):
        pass
    # Try ISO format string
    try:
        return datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
    except (ValueError, TypeError):
        pass
    # Try date-only string (YYYY-MM-DD)
    try:
        return datetime.strptime(str(ts).split("T")[0], "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        return None


# CATEGORISATION 

def extract_property_type(text: str) -> PropertyType:
    """Return the best-matching property category from post text."""
    if not text:
        return PropertyType.unknown
    lower = text.lower()
    for prop_type, keywords in PROPERTY_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            try:
                return PropertyType(prop_type)
            except ValueError:
                return PropertyType.unknown
    return PropertyType.unknown


def extract_location(text: str, raw_item: dict) -> Optional[str]:
    """
    Extract desired location from:
      1. Native location fields the Apify actor already provides
      2. Regex keyword patterns in free text
    """
    for field in ("locationName", "location", "city", "country", "place", "region"):
        val = raw_item.get(field)
        if isinstance(val, dict):
            val = val.get("name") or val.get("city") or val.get("country") or ""
        if val and isinstance(val, str) and val.strip():
            return val.strip()

    if text:
        for pattern in _LOC_PATTERNS:
            m = re.search(pattern, text)
            if m:
                candidate = m.group(1).strip().rstrip(",.")
                if len(candidate) > 2:
                    return candidate

    return None


# NORMALIZERS 

def _normalize_tiktok(item: dict) -> ScrapedLead:
    author   = item.get("authorMeta", {})
    username = author.get("name", "") or item.get("author", "")
    video_id = item.get("id", "")
    ts       = item.get("createTime", "")
    desc     = item.get("text", "") or item.get("desc", "")
    return ScrapedLead(
        userId=username,
        name=author.get("nickName", "") or username,
        email=None,
        post_link=(f"https://www.tiktok.com/@{username}/video/{video_id}"
                   if username and video_id else ""),
        date=_parse_ts(ts),
        description=desc or None,
        platform=Platform.tiktok,
        property_type=extract_property_type(desc),
        location=extract_location(desc, item),
    )


def _normalize_instagram(item: dict) -> ScrapedLead:
    username   = (item.get("ownerUsername") or item.get("username")
                  or item.get("owner", {}).get("username", ""))
    short_code = item.get("shortCode") or item.get("shortcode", "")
    ts         = item.get("timestamp") or item.get("takenAtTimestamp") or item.get("takenAt")
    desc       = (item.get("caption") or item.get("alt")
                  or item.get("biography") or item.get("description", ""))
    return ScrapedLead(
        userId=username,
        name=(item.get("ownerFullName") or item.get("fullName")
              or item.get("owner", {}).get("fullName", "") or username),
        email=(item.get("businessEmail") or item.get("email")
               or item.get("owner", {}).get("businessEmail") or None),
        post_link=(f"https://www.instagram.com/p/{short_code}/"
                   if short_code else item.get("url", "") or item.get("postUrl", "")),
        date=_parse_ts(ts),
        description=desc or None,
        platform=Platform.instagram,
        property_type=extract_property_type(desc),
        location=extract_location(desc, item),
    )


def _normalize_facebook(item: dict, resolved: dict = None) -> ScrapedLead:
    r    = resolved or {}
    raw_date = item.get("date") or item.get("time") or item.get("createdTime")

    # Text content: hashtag scraper may use different keys
    desc = (item.get("text") or item.get("message") or item.get("story")
            or item.get("description") or r.get("about", ""))

    # Post URL: prefer canonical, fallback to url/postUrl
    post_url = (item.get("canonical_uri_with_fallback")
                or item.get("url") or item.get("postUrl") or r.get("url", ""))

    # UserId: owner.id (numeric) or resolved username or author fields
    owner = item.get("owner") or {}
    owner_id = owner.get("id", "") if isinstance(owner, dict) else ""

    # Extract readable page slug from canonical URL
    # e.g. https://www.facebook.com/scrollpunjab/videos/... -> scrollpunjab
    slug = ""
    if post_url:
        try:
            parts = post_url.replace("https://www.facebook.com/", "").split("/")
            if parts and parts[0] and parts[0] not in ("hashtag", "groups", "watch"):
                slug = parts[0]
        except Exception:
            pass

    author_url  = item.get("authorUrl", "")
    author_slug = author_url.rstrip("/").split("/")[-1] if author_url else ""

    user_id = (r.get("username") or slug or author_slug
               or item.get("userId") or item.get("pageId") or item.get("profileId")
               or owner_id)
    name    = (r.get("name") or item.get("authorName") or item.get("author")
               or item.get("title") or item.get("pageName") or slug or "")

    return ScrapedLead(
        userId=user_id,
        name=name,
        email=r.get("email") or item.get("email") or None,
        post_link=post_url or "",
        date=_parse_ts(raw_date),
        description=desc or None,
        platform=Platform.facebook,
        property_type=extract_property_type(desc),
        location=extract_location(desc, {**item, **r}),
    )


# FACEBOOK PROFILE RESOLVER 

def _resolve_fb_profile(client: ApifyClient, fb_id: str) -> dict:
    """Fetch profile metadata for a single Facebook page/user."""
    try:
        run = client.actor(ACTORS["fb_resolver"]).call(
            run_input={
                "startUrls":      [{"url": f"https://www.facebook.com/{fb_id}"}],
                "maxPosts":        0,
                "maxPostComments": 0,
                "maxReviews":      0,
            },
        )
        items = list(client.dataset(run.default_dataset_id).iterate_items())
        return items[0] if items else {}
    except Exception as e:
        print(f"  [FB Resolver] Failed for {fb_id}: {e}")
        return {}


def _fb_normalize_batch(client: ApifyClient, items, seen_ids: set) -> List[ScrapedLead]:
    """
    Normalize a batch of Facebook items.
    Only calls the profile resolver when we don't already have author info
    directly in the item (hashtag scraper provides owner.id + canonical URL).
    """
    results = []
    for item in items:
        # Hashtag scraper has owner.id; skip expensive resolver for those
        owner = item.get("owner") or {}
        has_owner = bool(isinstance(owner, dict) and owner.get("id"))
        has_direct_author = bool(
            has_owner
            or item.get("authorName") or item.get("author")
            or item.get("authorUrl")
            or item.get("canonical_uri_with_fallback")
        )
        fb_id = (item.get("pageId") or item.get("userId")
                 or item.get("profileId") or (owner.get("id") if has_owner else ""))
        resolved = {}
        if not has_direct_author and fb_id and fb_id not in seen_ids:
            seen_ids.add(fb_id)
            resolved = _resolve_fb_profile(client, fb_id)
            time.sleep(1)
        lead = _normalize_facebook(item, resolved)
        if lead.userId or lead.name:
            results.append(lead)
    return results


#  PLATFORM SCRAPERS (each runs in its own thread) 

def scrape_tiktok(hashtags: list, per_limit: int) -> List[ScrapedLead]:
    """Scrape TikTok via hashtag + main actor."""
    client  = _make_client()
    results = []

    print(f"[TikTok] Hashtag scraper → {hashtags}  (limit={per_limit})")
    try:
        run = client.actor(ACTORS["tiktok_hashtag"]).call(run_input={
            "hashtags":                      hashtags,
            "resultsPerPage":                per_limit,
            "shouldDownloadCovers":          False,
            "shouldDownloadSlideshowImages": False,
            "shouldDownloadVideos":          False,
        })
        for item in client.dataset(run.default_dataset_id).iterate_items():
            lead = _normalize_tiktok(item)
            if lead.userId:
                results.append(lead)
    except Exception as e:
        print(f"[TikTok] Hashtag scraper error: {e}")

    if len(results) >= per_limit:
        return results[:per_limit]

    time.sleep(1)
    print(f"[TikTok] Main scraper → {hashtags}")
    try:
        run = client.actor(ACTORS["tiktok_main"]).call(run_input={
            "hashtags":                      hashtags,
            "maxItems":                      per_limit,
            "resultsPerPage":                per_limit,
            "proxyConfiguration":            {"useApifyProxy": True},
            "shouldDownloadComments":        False,
            "shouldDownloadSubtitles":       False,
            "shouldDownloadVideos":          False,
            "shouldDownloadCovers":          False,
            "shouldDownloadSlideshowImages": False,
            "shouldDownloadAvatars":         False,
            "shouldDownloadMusicCovers":     False,
            "videoUrls":                     [],
            "excludePinnedPosts":            False,
            "scrapeRelatedVideos":           False,
        })
        for item in client.dataset(run.default_dataset_id).iterate_items():
            lead = _normalize_tiktok(item)
            if lead.userId:
                results.append(lead)
    except Exception as e:
        print(f"[TikTok] Main scraper error: {e}")

    return results[:per_limit]


def scrape_instagram(hashtags: list, per_limit: int) -> List[ScrapedLead]:
    """Scrape Instagram via scraper + hashtag actor."""
    client  = _make_client()
    results = []
    seen    = set()

    print(f"[Instagram] Scraper → {hashtags}  (limit={per_limit})")
    try:
        run = client.actor(ACTORS["instagram_scraper"]).call(run_input={
            "directUrls":   [f"https://www.instagram.com/explore/tags/{t}/" for t in hashtags],
            "resultsType":  "posts",
            "resultsLimit": per_limit,
            "addParentData":  True,
            "searchType":   "hashtag",
            "searchLimit":  1,
            "onlyPostsNewerThan":                "2025-01-01",
            "enhanceUserSearchWithFacebookPage": False,
            "isUserReelFeedURL":                 False,
            "isUserTaggedFeedURL":               False,
            "proxyConfiguration":                {"useApifyProxy": True},
        })
        for item in client.dataset(run.default_dataset_id).iterate_items():
            lead = _normalize_instagram(item)
            if lead.userId and lead.userId not in seen:
                seen.add(lead.userId)
                results.append(lead)
    except Exception as e:
        print(f"[Instagram] Scraper error: {e}")

    if len(results) >= per_limit:
        return results[:per_limit]

    time.sleep(1)
    print(f"[Instagram] Hashtag scraper → {hashtags}")
    try:
        run = client.actor(ACTORS["instagram_hashtag"]).call(run_input={
            "hashtags":           hashtags,
            "resultsLimit":       per_limit,
            "resultsType":        "posts",
            "searchType":         "hashtag",
            "keywordSearch":      False,
            "proxyConfiguration": {"useApifyProxy": True},
        })
        for item in client.dataset(run.default_dataset_id).iterate_items():
            lead = _normalize_instagram(item)
            if lead.userId and lead.userId not in seen:
                seen.add(lead.userId)
                results.append(lead)
    except Exception as e:
        print(f"[Instagram] Hashtag scraper error: {e}")

    return results[:per_limit]


def scrape_facebook(hashtags: list, keywords: list, per_limit: int) -> List[ScrapedLead]:
    """
    Scrape Facebook using the hashtag actor only.
    The page-posts scraper returns publisher content (brand pages like Zillow),
    not individual buyer signals — so we skip it.
    """
    client   = _make_client()
    results  = []
    seen_ids = set()

    print(f"[Facebook] Hashtag scraper → {hashtags}  (limit={per_limit})")
    try:
        run = client.actor(ACTORS["facebook_hashtag"]).call(run_input={
            "keywordList":  hashtags,
            "resultsLimit": per_limit,
        })
        results += _fb_normalize_batch(
            client, client.dataset(run.default_dataset_id).iterate_items(), seen_ids
        )
    except Exception as e:
        print(f"[Facebook] Hashtag scraper error: {e}")

    return results[:per_limit]


# DEDUPLICATION 

def deduplicate(leads: List[ScrapedLead]) -> List[ScrapedLead]:
    """Remove duplicate leads keyed on post_link, falling back to platform::userId."""
    seen, unique = set(), []
    for lead in leads:
        key = lead.post_link or f"{lead.platform}::{lead.userId}"
        if key and key not in seen:
            seen.add(key)
            unique.append(lead)
    return unique


def filter_valid(leads: List[ScrapedLead]) -> List[ScrapedLead]:
    """Drop leads that have no userId — they are publisher/page posts, not buyer signals."""
    return [l for l in leads if l.userId]


# PUBLIC API 

def run_scraper(input_data: dict) -> List[ScrapedLead]:
    """
    Main entry point — call this from your backend.

    input_data keys
    ---------------
    facebook  (bool)  – enable Facebook scraping
    instagram (bool)  – enable Instagram scraping
    tiktok    (bool)  – enable TikTok scraping
    hashtags  (list)  – hashtags to search
    keywords  (list)  – page names / keywords for Facebook
    limit     (int)   – desired total leads (DEFAULT_LIMIT=20)

    Returns
    -------
    list[dict]  – deduplicated, categorised leads with property_type + location
    """
    facebook  = input_data.get("facebook",  False)
    instagram = input_data.get("instagram", False)
    tiktok    = input_data.get("tiktok",    False)
    hashtags  = input_data.get("hashtags",  ["realestate", "luxuryhomes"])
    keywords  = input_data.get("keywords",  ["realestate"])
    total_limit = int(input_data.get("limit", DEFAULT_LIMIT))

    active = sum([bool(facebook), bool(instagram), bool(tiktok)])
    if active == 0:
        print("No platforms selected.")
        return []

    # Give each platform a small buffer above its fair share
    per_limit = max(1, (total_limit // active) + 2)

    # Build task map: name → (fn, args)
    task_map = {}
    if tiktok:
        task_map["tiktok"]    = (scrape_tiktok,    (hashtags, per_limit))
    if instagram:
        task_map["instagram"] = (scrape_instagram,  (hashtags, per_limit))
    if facebook:
        task_map["facebook"]  = (scrape_facebook,   (hashtags, keywords, per_limit))

    all_leads = []

    # Run each platform in its own thread 
    with ThreadPoolExecutor(max_workers=len(task_map)) as executor:
        futures = {
            executor.submit(fn, *args): name
            for name, (fn, args) in task_map.items()
        }
        for future in as_completed(futures):
            name = futures[future]
            try:
                leads = future.result()
                print(f"[{name.upper()}] ✓ {len(leads)} leads collected")
                all_leads.extend(leads)
            except Exception as exc:
                print(f"[{name.upper()}] ✗ Thread error: {exc}")

    unique: List[ScrapedLead] = filter_valid(deduplicate(all_leads))[:total_limit]
    print(f"\n✓ Total unique leads: {len(unique)} / {total_limit}")
    return unique


# CLI (quick test without backend) 

if __name__ == "__main__":
    print("=== Social Media Lead Scraper ===")
    
    country = input("Enter target country: ").strip()
    city = input("Enter target city: ").strip()
    hashtags_input = input("Enter hashtags (comma-separated, e.g., realestate, apartment, renthouse): ").strip()

    # Process hashtags
    raw_hashtags = [h.strip().replace("#", "") for h in hashtags_input.split(",") if h.strip()]
    if not raw_hashtags:
        raw_hashtags = ["realestate"] # fallback
        
    hashtags = list(raw_hashtags)
    
    # Optional: include city/country directly in hashtags/keywords
    loc_kw = f"{city}{country}".replace(" ", "").lower()
    if loc_kw and loc_kw not in hashtags:
        hashtags.append(loc_kw)
    if city and city.lower().replace(" ", "") not in hashtags:
        hashtags.append(city.lower().replace(" ", ""))

    keywords = [city, country] + raw_hashtags
    keywords = [k for k in keywords if k] # remove empty strings

    test_input = {
        "facebook": True,
        "instagram": True,
        "tiktok": True,
        "hashtags": hashtags,
        "keywords": keywords,
        "limit": 20
    }

    print(f"\nStarting scrape with configuration:")
    print(json.dumps(test_input, indent=2))
    print("-" * 50 + "\n")

    results = run_scraper(test_input)

    with open("leads_output.json", "w", encoding="utf-8") as f:
        json.dump([lead.model_dump(mode="json") for lead in results], f, indent=2, ensure_ascii=False)

    print(f"\nResults saved → leads_output.json")