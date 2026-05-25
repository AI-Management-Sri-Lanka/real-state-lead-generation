"""
debug_facebook.py
==================
Run this FIRST before anything else to see exactly what fields
the Facebook actors return. This tells us why leads are missing.

Run: python debug_facebook.py
"""
import json
from apify_client import ApifyClient
from config import APIFY_API_TOKEN, ACTORS

client = ApifyClient(APIFY_API_TOKEN)


def debug_facebook_hashtag():
    print("=" * 60)
    print("DEBUG: facebook-hashtag-scraper")
    print("=" * 60)

    run_input = {
        "keywordList":  ["realestate"],   # just 1 tag, small run
        "resultsLimit": 3,                # just 3 items to inspect
    }

    run   = client.actor(ACTORS["facebook_hashtag"]).call(run_input=run_input)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

    print(f"\nTotal items returned: {len(items)}\n")

    for i, item in enumerate(items[:3]):
        print(f"\n--- ITEM {i+1} ---")
        print("ALL FIELD NAMES:", list(item.keys()))
        print("\nKEY VALUES:")
        for key in ["username","pageId","userId","profileId","name","title",
                    "pageName","url","pageUrl","postUrl","link","about",
                    "description","text","email","website","likes",
                    "followers","followersCount","user"]:
            val = item.get(key)
            if val is not None:
                display = str(val)[:120] if not isinstance(val, dict) else json.dumps(val)[:120]
                print(f"  {key}: {display}")
        print()


def debug_facebook_posts():
    print("=" * 60)
    print("DEBUG: facebook-posts-scraper")
    print("=" * 60)

    run_input = {
        "startUrls":          [{"url": "https://www.facebook.com/zillow"}],
        "maxPostCount":       3,
        "includeAbout":       True,
        "includePosts":       True,
        "includePhotos":      False,
        "includeVideos":      False,
        "includeReviews":     False,
        "scrapeReactions":    False,
        "scrapeShares":       False,
        "scrapeComments":     False,
        "proxyConfiguration": {"useApifyProxy": True},
    }

    run   = client.actor(ACTORS["facebook_posts"]).call(run_input=run_input)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

    print(f"\nTotal items returned: {len(items)}\n")

    for i, item in enumerate(items[:3]):
        print(f"\n--- ITEM {i+1} ---")
        print("ALL FIELD NAMES:", list(item.keys()))
        print("\nKEY VALUES:")
        for key in ["username","pageId","userId","profileId","name","title",
                    "pageName","url","pageUrl","postUrl","link","about",
                    "description","text","email","website","likes",
                    "followers","followersCount","user"]:
            val = item.get(key)
            if val is not None:
                display = str(val)[:120] if not isinstance(val, dict) else json.dumps(val)[:120]
                print(f"  {key}: {display}")
        print()


if __name__ == "__main__":
    print("\nStep 1: Checking what facebook-hashtag-scraper returns...")
    debug_facebook_hashtag()
    print("\nStep 2: Checking what facebook-posts-scraper returns...")
    debug_facebook_posts()
    print("\nDone. Share the output above so we can fix the normalizer.")