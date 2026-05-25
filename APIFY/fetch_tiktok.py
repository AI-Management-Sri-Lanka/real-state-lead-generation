"""
fetch_tiktok.py
FIX: tag sanitisation — removes spaces/special chars that break actor inputs.
FIX: deduplication of post_links across both actor runs.
"""
import re
import time
from apify_client import ApifyClient
from config import APIFY_API_TOKEN, ACTORS, HASHTAGS
from normalize_lead import normalize_tiktok
from db import save_lead

client = ApifyClient(APIFY_API_TOKEN)


def _sanitise_tags(tags: list[str]) -> list[str]:
    """
    FIX: Hashtags cannot contain spaces or special chars.
    'house for rent' → 'houseforrent'
    'real-estate' → 'realestate'
    Deduplicates and removes empty strings.
    """
    cleaned = []
    seen = set()
    for tag in tags:
        t = re.sub(r"[^a-zA-Z0-9]", "", tag.lower().replace(" ", ""))
        if t and t not in seen:
            seen.add(t)
            cleaned.append(t)
    return cleaned


def fetch_tiktok_hashtag(tags: list[str] | None = None) -> tuple[list[str], int]:
    """Actor: clockworks/tiktok-hashtag-scraper"""
    hashtags = _sanitise_tags(tags or HASHTAGS)
    if not hashtags:
        print("[TikTok Hashtag] No valid tags after sanitisation, skipping.")
        return [], 0

    run_input = {
        "hashtags":                      hashtags,
        "resultsPerPage":                20,
        "shouldDownloadVideos":          False,
        "shouldDownloadCovers":          False,
        "shouldDownloadSlideshowImages": False,
        "shouldDownloadSubtitles":       False,
    }

    print(f"[TikTok Hashtag] tags={hashtags}")
    run   = client.actor(ACTORS["tiktok_hashtag"]).call(run_input=run_input)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    print(f"[TikTok Hashtag] {len(items)} raw items")

    post_links, seen_users, seen_urls, count = [], set(), set(), 0
    for item in items:
        lead = normalize_tiktok(item)
        if not lead["username"] or lead["username"] in seen_users:
            continue
        seen_users.add(lead["username"])
        for url in [lead["social_url"], lead["profile_url"]]:
            if url and url not in seen_urls:
                seen_urls.add(url)
                post_links.append(url)
        if save_lead(lead):
            count += 1
            print(f"  ✓ @{lead['username']} | {lead['followers']:,} followers")

    print(f"[TikTok Hashtag] {count} new leads | {len(post_links)} URLs\n")
    return post_links, count


def fetch_tiktok_main(tags: list[str] | None = None) -> tuple[list[str], int]:
    """Actor: clockworks/tiktok-scraper"""
    hashtags = _sanitise_tags(tags or HASHTAGS)
    if not hashtags:
        print("[TikTok Main] No valid tags after sanitisation, skipping.")
        return [], 0

    run_input = {
        "hashtags":                      hashtags,
        "resultsPerPage":                20,
        "proxyCountryCode":              "None",
        "profileScrapeSections":         ["videos"],
        "profileSorting":                "latest",
        "scrapeRelatedVideos":           False,
        "shouldDownloadVideos":          False,
        "shouldDownloadCovers":          False,
        "shouldDownloadSlideshowImages": False,
        "shouldDownloadSubtitles":       False,
        "shouldDownloadAvatars":         False,
        "shouldDownloadMusicCovers":     False,
    }

    print(f"[TikTok Main] tags={hashtags}")
    run   = client.actor(ACTORS["tiktok_main"]).call(run_input=run_input)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    print(f"[TikTok Main] {len(items)} raw items")

    post_links, seen_users, seen_urls, count = [], set(), set(), 0
    for item in items:
        lead = normalize_tiktok(item)
        if not lead["username"] or lead["username"] in seen_users:
            continue
        seen_users.add(lead["username"])
        for url in [lead["social_url"], lead["profile_url"]]:
            if url and url not in seen_urls:
                seen_urls.add(url)
                post_links.append(url)
        if save_lead(lead):
            count += 1
            print(f"  ✓ @{lead['username']} | {lead['followers']:,} followers")

    print(f"[TikTok Main] {count} new leads | {len(post_links)} URLs\n")
    return post_links, count


if __name__ == "__main__":
    test_tags = ["house for rent", "realestate", "property investment"]  
    print(f"Input tags: {test_tags}")
    print(f"Sanitised: {_sanitise_tags(test_tags)}")
    fetch_tiktok_hashtag(test_tags)
    time.sleep(3)
    fetch_tiktok_main(test_tags)