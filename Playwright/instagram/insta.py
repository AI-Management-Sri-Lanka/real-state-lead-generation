import asyncio
import re
import time
import random
import datetime
import os
import json

from playwright.async_api import async_playwright


OUTPUT_FILE = "insta_data.json"
HEADLESS = False
MAX_POSTS_PER_TAG = 10  # You can change this

SCROLL_PAUSE = (4, 7)

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
    "phone": re.compile(r"(?<!\d)(\+?[\d\s\-().]{7,16}\d)(?!\d)"),
    "email": re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),
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
        "phones": list(set(PATTERNS["phone"].findall(text))),
        "emails": list(set(PATTERNS["email"].findall(text))),
        "websites": list(set(PATTERNS["website"].findall(text))),
    }


def save_json(rows):
    if not rows:
        print("No leads found")
        return

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=4)

    print(f"\nSaved {len(rows)} leads -> {OUTPUT_FILE}")


class InstaScraper:

    async def start(self):
        self.pw = await async_playwright().start()

        self.browser = await self.pw.chromium.launch(
            headless=HEADLESS,
            slow_mo=200
        )

        if os.path.exists("ig_session.json"):
            self.ctx = await self.browser.new_context(storage_state="ig_session.json")
        else:
            self.ctx = await self.browser.new_context()

        self.page = await self.ctx.new_page()

    async def close(self):
        await self.browser.close()
        await self.pw.stop()

    async def login(self, username, password):

        await self.page.goto(
            "https://www.instagram.com/accounts/login/",
            wait_until="domcontentloaded"
        )

        sleep(5, 8)

        if "challenge" in self.page.url or "recaptcha" in self.page.url:
            print("\nInstagram blocked login.")
            input("Solve manually then press ENTER...")

        try:
            await self.page.wait_for_selector('input[name="username"]', timeout=60000)
        except:
            input("Login manually then press ENTER...")
            return

        await self.page.fill('input[name="username"]', username)
        sleep(1, 2)

        await self.page.fill('input[name="password"]', password)
        sleep(1, 2)

        await self.page.click('button[type="submit"]')

        input("\nFinish login (2FA if needed), then press ENTER...")

        await self.ctx.storage_state(path="ig_session.json")
        print("Session saved.")

    async def collect_urls(self, tag):

        url = f"https://www.instagram.com/explore/tags/{tag}/"

        print(f"\n#{tag}")

        await self.page.goto(url, wait_until="domcontentloaded")
        sleep(5, 7)

        urls = set()
        last = 0

        for _ in range(12):

            links = await self.page.query_selector_all("a")

            for l in links:
                href = await l.get_attribute("href")
                if href and "/p/" in href:
                    urls.add("https://www.instagram.com" + href.split("?")[0])

            print("Collected:", len(urls))

            if len(urls) >= MAX_POSTS_PER_TAG:
                break

            if len(urls) == last:
                break

            last = len(urls)

            await self.page.mouse.wheel(0, 4000)
            sleep(*SCROLL_PAUSE)

        return list(urls)[:MAX_POSTS_PER_TAG]

    async def scrape_post(self, url, tag, city):

        page = await self.ctx.new_page()

        try:
            await page.goto(url, wait_until="domcontentloaded")
            sleep(3, 5)

            caption = ""

            meta = await page.query_selector('meta[property="og:description"]')
            if meta:
                caption = await meta.get_attribute("content") or ""

            if not caption:
                spans = await page.query_selector_all("span")
                for s in spans:
                    txt = await s.inner_text()
                    if len(txt) > 40:
                        caption = txt
                        break

            if not caption:
                return None

            if not is_lead(caption):
                return None

            username = ""
            el = await page.query_selector("header a")
            if el:
                username = await el.inner_text()

            contacts = extract_contacts(caption)

            return {
                "post_url": url,
                "username": username,
                "caption": caption[:300].replace("\n", " "),
                "contacts": {
                    "phones": contacts["phones"],
                    "emails": contacts["emails"],
                    "websites": contacts["websites"]
                },
                "hashtag": tag,
                "city": city,
                "scraped_at": datetime.datetime.now().isoformat()
            }

        finally:
            await page.close()


async def main():

    print("=" * 50)
    print("Instagram Scraper (JSON Version)")
    print("=" * 50)

    city = input("City: ").strip()
    user = input("IG username: ").strip()
    pw = input("IG password: ").strip()

    scraper = InstaScraper()
    await scraper.start()

    try:
        await scraper.login(user, pw)

        hashtags = build_hashtags(city)

        all_urls = {}

        print("\nCollecting posts...")

        for t in hashtags:
            urls = await scraper.collect_urls(t)
            for u in urls:
                all_urls[u] = t

        print("\nTotal posts:", len(all_urls))

        results = []

        for i, (url, tag) in enumerate(all_urls.items(), 1):

            print(f"[{i}/{len(all_urls)}] {url}")

            data = await scraper.scrape_post(url, tag, city)

            if data:
                results.append(data)
                print("Lead:", data["username"])

            sleep(3, 6)

        save_json(results)

    finally:
        await scraper.close()
        print("Done.")


if __name__ == "__main__":
    asyncio.run(main())