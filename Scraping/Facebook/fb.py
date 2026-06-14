import asyncio
import json
import re
import datetime
import os
import random
import time

from playwright.async_api import async_playwright
from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
SESSION_FILE   = "fb_session.json"
OUTPUT_FILE    = "facebook_data.json"
HEADLESS       = True                   # True = fully automatic, no window
MAX_POSTS      = 20
SCROLL_PAUSE   = (4, 7)                 # random seconds between scrolls

# ── Keywords / patterns ───────────────────────────────────────────────────────
LEAD_KEYWORDS = [
    "sale", "rent", "buy", "sell", "property",
    "house", "apartment", "villa", "land",
    "contact", "call", "whatsapp", "price", "agent",
]

PATTERNS = {
    "phone":   re.compile(r"(?<!\d)(\+?[\d\s\-().]{7,16}\d)(?!\d)"),
    "email":   re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),
    "website": re.compile(r"https?://[^\s\"'<>]+|www\.[^\s\"'<>]+", re.I),
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def sleep(a=2, b=5):
    time.sleep(random.uniform(a, b))


def build_search_urls(city: str) -> list[str]:
    city = city.strip().lower().replace(" ", "%20")
    return [
        f"https://www.facebook.com/search/pages/?q={city}%20real%20estate",
        f"https://www.facebook.com/search/pages/?q={city}%20property",
        f"https://www.facebook.com/search/pages/?q={city}%20house%20for%20sale",
        f"https://www.facebook.com/search/pages/?q={city}%20apartment",
    ]


def is_lead(text: str) -> bool:
    text = text.lower()
    return sum(1 for k in LEAD_KEYWORDS if k in text) >= 2


def extract_contacts(text: str) -> dict:
    return {
        "phones":   list(set(PATTERNS["phone"].findall(text))),
        "emails":   list(set(PATTERNS["email"].findall(text))),
        "websites": list(set(PATTERNS["website"].findall(text))),
    }


def save_json(rows: list[dict]):
    if not rows:
        print("No leads found.")
        return
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    print(f"\n✔ Saved {len(rows)} leads → {OUTPUT_FILE}")


# ── Scraper ───────────────────────────────────────────────────────────────────
class FacebookScraper:

    async def start(self):
        if not os.path.exists(SESSION_FILE):
            print("[ERROR] No session file found.")
            print("  → Run  python save_session.py  first.")
            raise SystemExit(1)

        self.pw = await async_playwright().start()
        self.browser = await self.pw.chromium.launch(
            headless=HEADLESS,
            slow_mo=80,
            args=["--disable-blink-features=AutomationControlled"],
        )

        print("[Session] Reusing saved session — no login needed.")
        self.ctx = await self.browser.new_context(
            storage_state=SESSION_FILE,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
            locale="en-US",
        )
        self.page = await self.ctx.new_page()

    async def close(self):
        # Refresh session before closing (keeps it alive longer)
        try:
            await self.ctx.storage_state(path=SESSION_FILE)
        except Exception:
            pass
        await self.browser.close()
        await self.pw.stop()

    # Step 1: collect page URLs from search results
    async def collect_page_urls(self, search_url: str) -> list[str]:
        print(f"\n  Searching: {search_url}")
        await self.page.goto(search_url, wait_until="domcontentloaded", timeout=60000)
        await self.page.wait_for_timeout(5000)

        urls = set()
        last = 0

        for _ in range(6):
            # Grab all profile/page links from search results
            hrefs = await self.page.evaluate("""
                () => Array.from(document.querySelectorAll('a[href*="facebook.com/"]'))
                          .map(a => a.href)
            """)
            for href in hrefs:
                # Filter to actual FB pages (not /search, not /help, etc.)
                if re.search(r"facebook\.com/[^/?]+/?$", href):
                    urls.add(href.split("?")[0].rstrip("/"))

            print(f"    Found {len(urls)} pages so far...")

            if len(urls) == last:
                break
            last = len(urls)

            await self.page.mouse.wheel(0, 4000)
            await self.page.wait_for_timeout(random.randint(4000, 7000))

        return list(urls)

    # Step 2: visit a FB page and scrape posts for leads
    async def scrape_fb_page(self, page_url: str) -> list[dict]:
        page = await self.ctx.new_page()
        results = []

        try:
            print(f"\n  Scraping page: {page_url}")
            await page.goto(page_url, wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(5000)

            # Get page name from title or header
            page_name = ""
            try:
                title_el = await page.query_selector("h1")
                if title_el:
                    page_name = (await title_el.inner_text()).strip()
            except Exception:
                pass

            seen_texts: set[str] = set()

            for scroll_i in range(8):
                # Try to get individual post text blocks
                post_elements = await page.query_selector_all(
                    '[data-ad-preview="message"], [dir="auto"] > div > span, '
                    'div[data-testid="post_message"] span'
                )

                for el in post_elements:
                    try:
                        text = await el.inner_text()
                        if len(text) < 30 or text in seen_texts:
                            continue
                        seen_texts.add(text)

                        if not is_lead(text):
                            continue

                        contacts = extract_contacts(text)
                        post_url = page.url   # best approximation; no permalink available from feed

                        results.append({
                            "post_url":   page_url,
                            "page_name":  page_name,
                            "caption":    text[:500].replace("\n", " "),
                            "phones":     " | ".join(contacts["phones"]),
                            "emails":     " | ".join(contacts["emails"]),
                            "websites":   " | ".join(contacts["websites"]),
                            "scraped_at": datetime.datetime.now().isoformat(),
                        })

                    except Exception:
                        continue

                if len(results) >= MAX_POSTS:
                    break

                await page.mouse.wheel(0, 5000)
                await page.wait_for_timeout(random.randint(*[int(x * 1000) for x in SCROLL_PAUSE]))

            print(f"    → {len(results)} leads found")

        except Exception as e:
            print(f"    [WARN] Failed to scrape {page_url}: {e}")
        finally:
            await page.close()

        return results


# ── Entry point ───────────────────────────────────────────────────────────────
async def main():
    print("=" * 50)
    print("Facebook Lead Scraper  (automatic)")
    print("=" * 50)

    city = input("City: ").strip()
    if not city:
        print("[ERROR] City cannot be empty.")
        return

    search_urls = build_search_urls(city)
    print(f"\nCity   : {city}")
    print(f"Queries: {len(search_urls)}")

    scraper = FacebookScraper()
    await scraper.start()

    try:
        # Step 1 — Collect FB page URLs from all search queries
        all_page_urls: set[str] = set()
        print("\n[Step 1] Collecting Facebook page URLs from search...")
        for url in search_urls:
            found = await scraper.collect_page_urls(url)
            all_page_urls.update(found)

        print(f"\nTotal unique pages: {len(all_page_urls)}")

        if not all_page_urls:
            print("\n[WARN] 0 pages found. Try:")
            print("  1. Run save_session.py again (session may have expired)")
            print("  2. Wait 30 min if Facebook is rate-limiting you")
            return

        # Step 2 — Scrape each page for real estate leads
        all_results: list[dict] = []
        print("\n[Step 2] Scraping pages for leads...")

        for i, page_url in enumerate(all_page_urls, 1):
            print(f"\n  [{i}/{len(all_page_urls)}] {page_url}")
            data = await scraper.scrape_fb_page(page_url)
            all_results.extend(data)
            sleep(3, 6)   # polite delay between pages

        print(f"\nTotal leads found: {len(all_results)}")
        save_json(all_results)

    finally:
        await scraper.close()
        print("Done.")


if __name__ == "__main__":
    asyncio.run(main())