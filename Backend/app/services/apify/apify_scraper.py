import os
import json
import time
from datetime import datetime, timezone
from apify_client import ApifyClient

#  CONFIG

APIFY_API_TOKEN = os.environ.get("APIFY_API_TOKEN")

ACTORS = {
    "tiktok_hashtag":    "clockworks/tiktok-hashtag-scraper",
    "tiktok_main":       "clockworks/tiktok-scraper",
    "instagram_scraper": "apify/instagram-scraper",
    "instagram_hashtag": "apify/instagram-hashtag-scraper",
    "facebook_posts":    "apify/facebook-posts-scraper",
    "facebook_hashtag":  "apify/facebook-hashtag-scraper",
    "fb_resolver":       "apify/facebook-profile-scraper",
}

FACEBOOK_PAGE_MAP = {
    "realestate":      "https://www.facebook.com/realestate",
    "zillow":          "https://www.facebook.com/zillow",
    "realtor":         "https://www.facebook.com/realtor",
    "rentalhouse":     "https://www.facebook.com/rentalhomes",
    "houseforrent":    "https://www.facebook.com/houseforrent",
    "propertyforsale": "https://www.facebook.com/propertyforsale",
}

client = ApifyClient(APIFY_API_TOKEN)

#  NORMALIZE  —  raw Apify output → standard schema

def _parse_ts(ts) -> str:
    try:
        return datetime.fromtimestamp(int(ts), tz=timezone.utc).strftime("%Y-%m-%d")
    except Exception:
        return str(ts)


def _normalize_tiktok(item: dict) -> dict:
    author   = item.get("authorMeta", {})
    username = author.get("name", "") or item.get("author", "")
    video_id = item.get("id", "")
    ts       = item.get("createTime", "")
    return {
        "userId":      username,
        "name":        author.get("nickName", "") or username,
        "email":       "",
        "post_link":   f"https://www.tiktok.com/@{username}/video/{video_id}" if username and video_id else "",
        "date":        _parse_ts(ts) if ts else "",
        "description": item.get("text", "") or item.get("desc", ""),
        "platform":    "tiktok",
    }


def _normalize_instagram(item: dict) -> dict:
    username   = (item.get("ownerUsername") or item.get("username")
                  or item.get("owner", {}).get("username", ""))
    short_code = item.get("shortCode") or item.get("shortcode", "")
    ts         = item.get("timestamp") or item.get("takenAtTimestamp", "")
    return {
        "userId":      username,
        "name":        (item.get("ownerFullName") or item.get("fullName")
                        or item.get("owner", {}).get("fullName", "") or username),
        "email":       (item.get("businessEmail") or item.get("email")
                        or item.get("owner", {}).get("businessEmail", "") or ""),
        "post_link":   (f"https://www.instagram.com/p/{short_code}/" if short_code
                        else item.get("url", "") or item.get("postUrl", "")),
        "date":        _parse_ts(ts) if ts else item.get("takenAt", ""),
        "description": (item.get("caption") or item.get("alt")
                        or item.get("biography") or item.get("description", "")),
        "platform":    "instagram",
    }


def _normalize_facebook(item: dict, resolved: dict = None) -> dict:
    r    = resolved or {}
    date = item.get("date") or item.get("time") or item.get("createdTime", "")
    if date and "T" in date:
        date = date.split("T")[0]
    return {
        "userId":      (r.get("username") or item.get("pageId")
                        or item.get("userId") or item.get("profileId", "")),
        "name":        r.get("name") or item.get("title") or item.get("pageName", ""),
        "email":       r.get("email", "") or item.get("email", ""),
        "post_link":   item.get("url") or item.get("postUrl") or r.get("url", ""),
        "date":        date,
        "description": (item.get("text") or item.get("message")
                        or item.get("description") or r.get("about", "")),
        "platform":    "facebook",
    }


#  FACEBOOK PROFILE RESOLVE

def _resolve_fb_profile(fb_id: str) -> dict:
    try:
        run   = client.actor(ACTORS["fb_resolver"]).call(
            run_input={"startUrls": [{"url": f"https://www.facebook.com/{fb_id}"}],
                       "maxPosts": 0, "maxPostComments": 0, "maxReviews": 0},
            timeout_secs=60,
        )
        items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
        return items[0] if items else {}
    except Exception as e:
        print(f"  [FB Resolver] Failed for {fb_id}: {e}")
        return {}


def _fb_normalize_all(items, seen_ids: set) -> list:
    results = []
    for item in items:
        fb_id = (item.get("pageId") or item.get("userId")
                 or item.get("profileId") or item.get("user", {}).get("id", ""))
        resolved = {}
        if fb_id and fb_id not in seen_ids:
            seen_ids.add(fb_id)
            resolved = _resolve_fb_profile(fb_id)
            time.sleep(1)

        lead = _normalize_facebook(item, resolved)
        if lead["userId"] or lead["name"]:
            results.append(lead)
    return results


#  PLATFORM SCRAPERS

def _scrape_tiktok(hashtags: list, limit: int) -> list:
    results = []

    print(f"[TikTok] Hashtag scraper → {hashtags}")
    try:
        run = client.actor(ACTORS["tiktok_hashtag"]).call(run_input={
            "hashtags":                      hashtags,
            "resultsPerPage":                limit,
            "shouldDownloadCovers":          False,
            "shouldDownloadSlideshowImages": False,
            "shouldDownloadVideos":          False,
        })
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            lead = _normalize_tiktok(item)
            if lead["userId"]:
                results.append(lead)
    except Exception as e:
        print(f"[TikTok] Hashtag scraper error: {e}")

    time.sleep(2)

    print(f"[TikTok] Main scraper → {hashtags}")
    try:
        run = client.actor(ACTORS["tiktok_main"]).call(run_input={
            "hashtags":                      hashtags,
            "maxItems":                      limit,
            "resultsPerPage":                limit,
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
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            lead = _normalize_tiktok(item)
            if lead["userId"]:
                results.append(lead)
    except Exception as e:
        print(f"[TikTok] Main scraper error: {e}")

    return results


def _scrape_instagram(hashtags: list, limit: int) -> list:
    results = []
    seen    = set()

    print(f"[Instagram] Scraper → {hashtags}")
    try:
        run = client.actor(ACTORS["instagram_scraper"]).call(run_input={
            "directUrls":                        [f"https://www.instagram.com/explore/tags/{t}/" for t in hashtags],
            "resultsType":                       "details",
            "resultsLimit":                      limit,
            "addParentData":                     True,
            "searchType":                        "hashtag",
            "searchLimit":                       1,
            "onlyPostsNewerThan":                "2025-01-01",
            "enhanceUserSearchWithFacebookPage": False,
            "isUserReelFeedURL":                 False,
            "isUserTaggedFeedURL":               False,
            "proxyConfiguration":                {"useApifyProxy": True},
        })
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            lead = _normalize_instagram(item)
            if lead["userId"] and lead["userId"] not in seen:
                seen.add(lead["userId"])
                results.append(lead)
    except Exception as e:
        print(f"[Instagram] Scraper error: {e}")

    time.sleep(2)

    print(f"[Instagram] Hashtag scraper → {hashtags}")
    try:
        run = client.actor(ACTORS["instagram_hashtag"]).call(run_input={
            "hashtags":           hashtags,
            "resultsLimit":       limit,
            "resultsType":        "details",
            "searchType":         "hashtag",
            "keywordSearch":      False,
            "proxyConfiguration": {"useApifyProxy": True},
        })
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            lead = _normalize_instagram(item)
            if lead["userId"] and lead["userId"] not in seen:
                seen.add(lead["userId"])
                results.append(lead)
    except Exception as e:
        print(f"[Instagram] Hashtag scraper error: {e}")

    return results


def _scrape_facebook(hashtags: list, keywords: list, limit: int) -> list:
    results  = []
    seen_ids = set()

    print(f"[Facebook] Posts scraper → {keywords}")
    try:
        run = client.actor(ACTORS["facebook_posts"]).call(run_input={
            "startUrls": [
                {"url": FACEBOOK_PAGE_MAP.get(kw.lower(), f"https://www.facebook.com/{kw}")}
                for kw in keywords
            ],
            "includeAbout":           True,
            "includePosts":           True,
            "includePhotos":          True,
            "includeVideos":          True,
            "includeReviews":         False,
            "maxPostCount":           limit,
            "resultsLimit":           limit,
            "scrapeComments":         False,
            "scrapeReactions":        True,
            "scrapeShares":           True,
            "scrapeVideoTranscripts": False,
            "captionText":            False,
            "proxyConfiguration":     {"useApifyProxy": True},
        })
        results += _fb_normalize_all(
            client.dataset(run["defaultDatasetId"]).iterate_items(), seen_ids
        )
    except Exception as e:
        print(f"[Facebook] Posts scraper error: {e}")

    time.sleep(2)

    print(f"[Facebook] Hashtag scraper → {hashtags}")
    try:
        run = client.actor(ACTORS["facebook_hashtag"]).call(run_input={
            "keywordList":  hashtags,
            "resultsLimit": limit,
        })
        results += _fb_normalize_all(
            client.dataset(run["defaultDatasetId"]).iterate_items(), seen_ids
        )
    except Exception as e:
        print(f"[Facebook] Hashtag scraper error: {e}")

    return results


#  run_scraper()  —  THE ONLY FUNCTION BACKEND NEEDS TO CALL

def run_scraper(input_data: dict) -> list[dict]:
    """
    Called by Backend/app/services/ai/router.py
    
    input_data keys:
        facebook  (bool)  — scrape Facebook
        instagram (bool)  — scrape Instagram
        tiktok    (bool)  — scrape TikTok
        hashtags  (list)  — hashtags to search
        keywords  (list)  — keywords / page slugs for Facebook
        limit     (int)   — max results per scraper call

    returns: list of lead dicts with keys:
        userId, name, email, post_link, date, description, platform
    """
    facebook  = input_data.get("facebook",  False)
    instagram = input_data.get("instagram", False)
    tiktok    = input_data.get("tiktok",    False)
    hashtags  = input_data.get("hashtags",  ["realestate", "luxuryhomes"])
    keywords  = input_data.get("keywords",  ["realestate"])
    limit     = int(input_data.get("limit", 50))

    all_leads = []

    if tiktok:
        all_leads += _scrape_tiktok(hashtags, limit)
        time.sleep(2)

    if instagram:
        all_leads += _scrape_instagram(hashtags, limit)
        time.sleep(2)

    if facebook:
        all_leads += _scrape_facebook(hashtags, keywords, limit)

    # Deduplicate by post_link, fallback to platform::userId
    seen, unique = set(), []
    for lead in all_leads:
        key = lead.get("post_link") or f"{lead['platform']}::{lead['userId']}"
        if key and key not in seen:
            seen.add(key)
            unique.append(lead)

    print(f"\n✓ Total unique leads scraped: {len(unique)}")
    return unique


#  CLI  —  local test only, backend never runs this block

if __name__ == "__main__":
    with open("input.json", "r", encoding="utf-8") as f:
        test_input = json.load(f)

    print(f"Loaded input: {test_input}")
    results = run_scraper(test_input)

    with open("leads_output.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"Results saved to leads_output.json")