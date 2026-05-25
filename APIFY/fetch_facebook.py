"""
fetch_facebook.py — v3
Key fixes:
  - Uses correct dedup key from normalizer (_dedup_key field)
  - Strips _dedup_key before saving to DB
  - facebook-posts-scraper: uses only real page URLs (not /hashtag/ URLs
    which this actor doesn't support — those need the hashtag actor)
  - Added print of raw item keys on first item so you can see what came back
"""
import re
import time
from apify_client import ApifyClient
from config import APIFY_API_TOKEN, ACTORS, HASHTAGS, FACEBOOK_SEED_URLS, RESULTS_LIMIT
from normalize_lead import normalize_facebook
from db import save_lead

client = ApifyClient(APIFY_API_TOKEN)


def _sanitise_tags(tags: list[str]) -> list[str]:
    cleaned, seen = [], set()
    for tag in tags:
        t = re.sub(r"[^a-zA-Z0-9]", "", tag.lower().replace(" ", ""))
        if t and t not in seen:
            seen.add(t); cleaned.append(t)
    return cleaned


def _save(lead: dict) -> bool:
    """Strip internal debug key before saving."""
    lead.pop("_dedup_key", None)
    return save_lead(lead)


def fetch_facebook_posts(tags: list[str] | None = None) -> tuple[list[str], int]:
    """
    Actor: apify/facebook-posts-scraper
    Scrapes posts + about info from real Facebook page URLs.
    NOTE: This actor does NOT support /hashtag/ URLs — only real page URLs.
    """
    # Use seed pages from config (real Facebook pages)
    # Don't use /hashtag/ URLs here — wrong actor for that
    run_input = {
        "startUrls":          FACEBOOK_SEED_URLS,
        "onlyPostsNewerThan": "2025-01-01",
        "maxPostCount":       50,
        "includeAbout":       True,   # pageName, about, email, website, likes
        "includePosts":       True,
        "includePhotos":      False,
        "includeVideos":      False,
        "includeReviews":     False,
        "scrapeReactions":    False,
        "scrapeShares":       False,
        "scrapeComments":     False,
        "proxyConfiguration": {"useApifyProxy": True},
    }

    print(f"[Facebook Posts] {len(FACEBOOK_SEED_URLS)} seed pages")
    run   = client.actor(ACTORS["facebook_posts"]).call(run_input=run_input)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    print(f"[Facebook Posts] {len(items)} raw items returned")

    if items:
        print(f"[Facebook Posts] First item keys: {list(items[0].keys())}")

    post_links, seen_keys, seen_urls, count = [], set(), set(), 0
    for item in items:
        lead = normalize_facebook(item)
        key  = lead.pop("_dedup_key", None) or lead["username"] or lead["full_name"]
        if not key or key in seen_keys:
            continue
        seen_keys.add(key)
        for url in [lead["social_url"], lead["profile_url"]]:
            if url and url not in seen_urls:
                seen_urls.add(url)
                post_links.append(url)
        if save_lead(lead):
            count += 1
            print(f"  ✓ {lead['full_name'] or lead['username']} | {lead['followers']:,} followers")

    print(f"[Facebook Posts] {count} new leads | {len(post_links)} URLs\n")
    return post_links, count


def fetch_facebook_hashtag(tags: list[str] | None = None) -> tuple[list[str], int]:
    """
    Actor: apify/facebook-hashtag-scraper
    Searches public FB posts by keyword.
    Returns: authorName, authorUrl, postUrl, message, likes
    """
    hashtags = _sanitise_tags(tags or HASHTAGS)
    if not hashtags:
        return [], 0

    run_input = {
        "keywordList":  hashtags,
        "resultsLimit": RESULTS_LIMIT,
    }

    print(f"[Facebook Hashtag] tags={hashtags}")
    run   = client.actor(ACTORS["facebook_hashtag"]).call(run_input=run_input)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    print(f"[Facebook Hashtag] {len(items)} raw items returned")

    if items:
        print(f"[Facebook Hashtag] First item keys: {list(items[0].keys())}")
        print(f"[Facebook Hashtag] First item sample: { {k:str(v)[:60] for k,v in list(items[0].items())[:8]} }")

    post_links, seen_keys, seen_urls, count = [], set(), set(), 0
    for item in items:
        lead = normalize_facebook(item)
        key  = lead.pop("_dedup_key", None) or lead["username"] or lead["full_name"]
        if not key or key in seen_keys:
            continue
        seen_keys.add(key)
        for url in [lead["social_url"], lead["profile_url"]]:
            if url and url not in seen_urls:
                seen_urls.add(url)
                post_links.append(url)
        if save_lead(lead):
            count += 1
            print(f"  ✓ {lead['full_name'] or lead['username']} | {lead['followers']:,} followers")

    print(f"[Facebook Hashtag] {count} new leads | {len(post_links)} URLs\n")
    return post_links, count


if __name__ == "__main__":
    fetch_facebook_posts()
    time.sleep(3)
    fetch_facebook_hashtag(["realestate", "houseforrent"])