"""
main.py  –  CLI pipeline runner (uses default hashtags from config.py)
For dynamic tag_list use the API:  uvicorn api:app --reload
"""
import time
from db import init_db, get_stats
from fetch_tiktok import fetch_tiktok_hashtag, fetch_tiktok_main
from fetch_instagram import fetch_instagram_scraper, fetch_instagram_hashtag
from fetch_facebook import fetch_facebook_posts, fetch_facebook_hashtag


def main():
    print("=" * 55)
    print("   Real Estate Lead Generation Pipeline")
    print("=" * 55)
    init_db()

    total = 0
    for fn in [
        fetch_tiktok_hashtag, fetch_tiktok_main,
        fetch_instagram_scraper, fetch_instagram_hashtag,
        fetch_facebook_posts, fetch_facebook_hashtag,
    ]:
        _, n = fn()  
        total += n
        time.sleep(3)

    stats = get_stats()
    print("\n" + "=" * 55)
    print(f"  Pipeline complete — {total} new leads this run")
    print(f"  Total in DB : {stats['total']}")
    for plat, cnt in stats["by_platform"].items():
        print(f"    {plat:<12} {cnt}")
    print(f"  With email  : {stats['with_email']}")
    print(f"  With website: {stats['with_website']}")
    print("=" * 55)
    print("  Export : python export_leads.py")
    print("  API    : uvicorn api:app --reload")
    print("=" * 55)


if __name__ == "__main__":
    main()