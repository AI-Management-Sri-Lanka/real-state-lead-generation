import asyncio
import json
import re
import time
import random
import datetime
import os

from playwright.async_api import async_playwright
from dotenv import load_dotenv

load_dotenv()


IG_USERNAME       = os.getenv("IG_USERNAME")
IG_PASSWORD       = os.getenv("IG_PASSWORD")

HEADLESS          = True
MAX_POSTS_PER_TAG = 10 #we can change this
SCROLL_PAUSE      = (4, 7)
SESSION_FILE      = "ig_session.json"

REALESTATE_SUFFIXES = [
    "realestate", "property", "houseforsale",
    "apartmentforsale", "landforsale", "forsale",
    "forrent", "realtor"
]

LEAD_KEYWORDS = [
    "sale", "rent", "buy", "sell", "property",
    "house", "apartment", "villa", "land",
    "contact", "call", "whatsapp", "price", "agent"
]

PATTERNS = {
    "phone":   re.compile(r"(?<!\d)(\+?[\d\s\-().]{7,16}\d)(?!\d)"),
    "email":   re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),
    "website": re.compile(r"https?://[^\s\"'<>]+|www\.[^\s\"'<>]+", re.I),
}


def sleep(a=2, b=5):
    time.sleep(random.uniform(a, b))

def build_hashtags(city):
    city = city.replace(" ", "").lower()
    return [city + s for s in REALESTATE_SUFFIXES]

def is_lead(text):
    text = text.lower()
    return sum(1 for k in LEAD_KEYWORDS if k in text) >= 2

def extract_contacts(text):
    return {
        "phones":   list(set(PATTERNS["phone"].findall(text))),
        "emails":   list(set(PATTERNS["email"].findall(text))),
        "websites": list(set(PATTERNS["website"].findall(text))),
    }

def save_json(rows, city):
    if not rows:
        print("No leads found.")
        return
    filename = f"insta_{city}_{datetime.date.today()}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    print(f"\n✔ Saved {len(rows)} leads → {filename}")



class InstaScraper:

    async def start(self):
        self.pw = await async_playwright().start()
        self.browser = await self.pw.chromium.launch(
            headless=HEADLESS,
            slow_mo=100,
            args=["--disable-blink-features=AutomationControlled"]
        )

        if not os.path.exists(SESSION_FILE):
            print("[ERROR] No session file found.")
            print("  → Run  python save_session.py  first.")
            raise SystemExit(1)

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
        try:
            await self.ctx.storage_state(path=SESSION_FILE)
        except Exception:
            pass
        await self.browser.close()
        await self.pw.stop()

    #collect post urls
    async def collect_urls(self, tag):
        url = f"https://www.instagram.com/explore/tags/{tag}/"
        print(f"\n  #{tag}")

        
        await self.page.goto(url, wait_until="domcontentloaded", timeout=60000)

        # give js time to render posts
        await self.page.wait_for_timeout(5000)

        # try waiting for post links to appear
        try:
            await self.page.wait_for_selector('a[href*="/p/"]', timeout=10000)
        except Exception:
            print("    No posts rendered — skipping.")
            return []

        urls = set()
        last = 0

        for _ in range(12):
            hrefs = await self.page.evaluate("""
                () => Array.from(document.querySelectorAll('a[href*="/p/"]'))
                          .map(a => a.getAttribute('href'))
            """)

            for href in hrefs:
                if href:
                    clean = href.split("?")[0]
                    urls.add("https://www.instagram.com" + clean)

            print(f"    Collected: {len(urls)}")

            if len(urls) >= MAX_POSTS_PER_TAG or len(urls) == last:
                break

            last = len(urls)
            await self.page.mouse.wheel(0, 3000)
            await self.page.wait_for_timeout(random.randint(4000, 7000))

        return list(urls)[:MAX_POSTS_PER_TAG]

    
    async def scrape_post(self, url, tag, city):
        page = await self.ctx.new_page()
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(3000)

            caption = ""

            
            meta = await page.query_selector('meta[property="og:description"]')
            if meta:
                caption = await meta.get_attribute("content") or ""

           
            if not caption:
                spans = await page.query_selector_all("span")
                for s in spans:
                    try:
                        txt = await s.inner_text()
                        if len(txt) > len(caption):
                            caption = txt
                    except Exception:
                        pass

            if not caption or not is_lead(caption):
                return None

            username = ""
            try:
                el = await page.query_selector("header a")
                if el:
                    username = await el.inner_text()
            except Exception:
                pass

            contacts = extract_contacts(caption)

            return {
                "post_url":   url,
                "username":   username,
                "caption":    caption[:500].replace("\n", " "),
                "phones":     contacts["phones"],
                "emails":     contacts["emails"],
                "websites":   contacts["websites"],
                "hashtag":    tag,
                "city":       city,
                "scraped_at": datetime.datetime.now().isoformat(),
            }

        finally:
            await page.close()


#entry point
async def main():
    print("=" * 50)
    print("Instagram Lead Scraper")
    print("=" * 50)

    CITY = input("City: ").strip()
    if not CITY:
        print("[ERROR] City cannot be empty.")
        return

    print(f"\nCity    : {CITY}")
    print(f"Account : {IG_USERNAME or '(from session)'}")

    scraper = InstaScraper()
    await scraper.start()

    try:
        hashtags = build_hashtags(CITY)
        all_urls = {}

        print("\n[Step 1] Collecting post URLs...")
        for tag in hashtags:
            urls = await scraper.collect_urls(tag)
            for u in urls:
                all_urls[u] = tag

        print(f"\nTotal unique posts: {len(all_urls)}")

        if not all_urls:
            print("\n[WARN] 0 posts collected. Try:")
            print("  1. Run save_session.py again")
            print("  2. Wait 30 min if Instagram is rate-limiting you")
            return

        results = []
        print("\n[Step 2] Scraping posts for leads...")

        for i, (url, tag) in enumerate(all_urls.items(), 1):
            print(f"  [{i}/{len(all_urls)}] {url}")
            data = await scraper.scrape_post(url, tag, CITY)
            if data:
                results.append(data)
                print(f"  Lead: @{data['username']}")
            sleep(3, 6)

        save_json(results, CITY)

    finally:
        await scraper.close()
        print("Done.")


if __name__ == "__main__":
    asyncio.run(main())