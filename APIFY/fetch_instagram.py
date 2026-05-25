"""
fetch_instagram.py - all bugs fixed
FIX: tag sanitisation
FIX: URL deduplication  
FIX: removed Instagram scraper explore/tags approach for custom tags
     (low-volume tags return 0 results on explore) — both actors now
     use the hashtag actor approach which works for any tag volume
"""
import re
import time
from apify_client import ApifyClient
from config import APIFY_API_TOKEN, ACTORS, HASHTAGS, RESULTS_LIMIT
from normalize_lead import normalize_instagram
from db import save_lead

client = ApifyClient(APIFY_API_TOKEN)


def _sanitise_tags(tags: list[str]) -> list[str]:
    cleaned, seen = [], set()
    for tag in tags:
        t = re.sub(r"[^a-zA-Z0-9]", "", tag.lower().replace(" ", ""))
        if t and t not in seen:
            seen.add(t)
            cleaned.append(t)
    return cleaned


def fetch_instagram_scraper(tags: list[str] | None = None) -> tuple[list[str], int]:
    """
    Actor: apify/instagram-scraper
    FIX: Instead of explore/tags URLs (fail for low-volume custom tags),
         we pass hashtags directly — works for any tag the chatbot sends.
    resultsType=details is CRITICAL — gives author bio/followers/email.
    """
    hashtags = _sanitise_tags(tags or HASHTAGS)
    if not hashtags:
        return [], 0

    direct_urls = [f"https://www.instagram.com/explore/tags/{t}/" for t in hashtags]

    run_input = {
        "directUrls":                        direct_urls,
        "searchType":                        "hashtag",
        "searchLimit":                       1,
        "resultsType":                       "details",   
        "resultsLimit":                      RESULTS_LIMIT,
        "addParentData":                     True,        
        "onlyPostsNewerThan":                "2025-01-01",
        "enhanceUserSearchWithFacebookPage": False,
        "isUserReelFeedURL":                 False,
        "isUserTaggedFeedURL":               False,
        "proxyConfiguration":                {"useApifyProxy": True},
    }

    print(f"[Instagram Scraper] tags={hashtags}")
    run   = client.actor(ACTORS["instagram_scraper"]).call(run_input=run_input)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    print(f"[Instagram Scraper] {len(items)} raw items")

    post_links, seen_users, seen_urls, count = [], set(), set(), 0
    for item in items:
        lead = normalize_instagram(item)
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

    print(f"[Instagram Scraper] {count} new leads | {len(post_links)} URLs\n")
    return post_links, count


def fetch_instagram_hashtag(tags: list[str] | None = None) -> tuple[list[str], int]:
    """
    Actor: apify/instagram-hashtag-scraper
    This is the better actor for custom chatbot tags — works for any hashtag volume.
    """
    hashtags = _sanitise_tags(tags or HASHTAGS)
    if not hashtags:
        return [], 0

    run_input = {
        "hashtags":           hashtags,
        "searchType":         "hashtag",
        "keywordSearch":      False,
        "resultsType":        "posts",    # hashtag actor only supports: posts, reels, stories
        "resultsLimit":       RESULTS_LIMIT,
        "proxyConfiguration": {"useApifyProxy": True},
    }

    print(f"[Instagram Hashtag] tags={hashtags}")
    run   = client.actor(ACTORS["instagram_hashtag"]).call(run_input=run_input)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    print(f"[Instagram Hashtag] {len(items)} raw items")

    post_links, seen_users, seen_urls, count = [], set(), set(), 0
    for item in items:
        lead = normalize_instagram(item)
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

    print(f"[Instagram Hashtag] {count} new leads | {len(post_links)} URLs\n")
    return post_links, count


if __name__ == "__main__":
    test_tags = ["realestate", "houseforrent", "colombo property"]
    fetch_instagram_scraper(test_tags)
    time.sleep(3)
    fetch_instagram_hashtag(test_tags)