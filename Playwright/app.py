

import asyncio
import csv
import re
import time
import random
import datetime
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout




OUTPUT_FILE = "data.csv"
HEADLESS = False  
MAX_POSTS_PER_TAG = 10
SCROLL_PAUSE = (2, 4)

REALESTATE_SUFFIXES = [
    "realestate",
    "property",
    "properties",
    "house",
    "houseforsale",
    "apartment",
    "apartmentforsale",
    "land",
    "landforsale",
    "forsale",
    "forrent",
    "rent",
    "realtor",
    "investment",
]

LEAD_KEYWORDS = [
    "sale",
    "rent",
    "lease",
    "let",
    "buy",
    "sell",
    "bedroom",
    "bed",
    "bath",
    "sqft",
    "sq ft",
    "perch",
    "property",
    "house",
    "apartment",
    "villa",
    "land",
    "plot",
    "contact",
    "call",
    "whatsapp",
    "wa.me",
    "email",
    "dm",
    "price",
    "lkr",
    "usd",
    "million",
    "negotiate",
    "agent",
    "realtor",
    "broker",
    "developer",
    "location",
    "view",
    "available",
]

PATTERNS = {
    "phone": re.compile(r"(?<!\d)(\+?[\d\s\-().]{7,16}\d)(?!\d)"),
    "email": re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),
    "whatsapp": re.compile(r"(?:wa\.me/|whatsapp[:\s]+)(\+?[\d\s\-]{7,15})", re.I),
    "website": re.compile(r"https?://[^\s,\"'<>]+|www\.[^\s,\"'<>]+", re.I),
}




def build_hashtags(city: str) -> list[str]:
    c = city.replace(" ", "").lower()
    seen, tags = set(), []
    for suffix in REALESTATE_SUFFIXES:
        tag = c + suffix
        if tag not in seen:
            seen.add(tag)
            tags.append(tag)
    return tags


def extract_contacts(text: str) -> dict:
    result = {"phones": [], "emails": [], "whatsapp": [], "websites": []}
    if not text:
        return result
    result["emails"] = list(set(PATTERNS["email"].findall(text)))
    result["whatsapp"] = list(set(PATTERNS["whatsapp"].findall(text)))
    result["websites"] = list(
        set(m for m in PATTERNS["website"].findall(text) if "instagram.com" not in m)
    )
    raw = PATTERNS["phone"].findall(text)
    result["phones"] = list(
        set(p.strip() for p in raw if 7 <= len(re.sub(r"\D", "", p)) <= 15)
    )
    return result


def is_realestate_lead(text: str) -> bool:
    lower = text.lower()
    return sum(1 for kw in LEAD_KEYWORDS if kw in lower) >= 2


def rand_sleep(lo=None, hi=None):
    time.sleep(random.uniform(lo or SCROLL_PAUSE[0], hi or SCROLL_PAUSE[1]))


def wait_for_user(msg: str):
    """Blocking input - keeps the script alive until user presses Enter."""
    input(msg)


def save_csv(records: list[dict]):
    if not records:
        print("\n⚠  No leads found.")
        return
    fields = [
        "post_url",
        "username",
        "caption_snippet",
        "phones",
        "emails",
        "whatsapp",
        "websites",
        "hashtag",
        "city",
        "scraped_at",
    ]
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(records)
    print(f"\n  Saved {len(records)} real estate leads → {OUTPUT_FILE}")





class RealEstateScraper:
    async def launch(self):
        self._pw = await async_playwright().start()
        self.browser = await self._pw.chromium.launch(
            headless=HEADLESS,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        self.ctx = await self.browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="en-US",
        )
        await self.ctx.add_init_script(
            "Object.defineProperty(navigator,'webdriver',{get:()=>undefined})"
        )
        self.page = await self.ctx.new_page()

    async def close(self):
        try:
            await self.browser.close()
            await self._pw.stop()
        except Exception:
            pass


    async def login(self) -> bool:
        print("\n" + "=" * 58)
        print("  STEP 1: Log in to Instagram in the browser window")
        print("=" * 58)
        print("\n    A Chrome browser window has opened.")
        print("    Log in to Instagram normally in that window.")
        print("    Complete any verification codes or 2FA steps.")
        print("    Wait until you can SEE the Instagram home feed.")
        print()

        await self.page.goto(
            "https://www.instagram.com/accounts/login/",
            wait_until="load",
            timeout=60000,
        )

        
        try:
            await self.page.wait_for_selector(
                'input[name="username"]', timeout=8000, state="visible"
            )
            
            try:
                btn = self.page.get_by_role(
                    "button", name=re.compile(r"allow|accept all", re.I)
                )
                await btn.first.click(timeout=3000)
                rand_sleep(1, 2)
            except Exception:
                pass

            print("    Auto-filling credentials…")
            await self.page.fill('input[name="username"]', self._username)
            rand_sleep(0.5, 1)
            await self.page.fill('input[name="password"]', self._password)
            rand_sleep(0.5, 1)
            await self.page.click('button[type="submit"]')
            print("  ↳  Credentials submitted. Waiting…")
            rand_sleep(4, 6)
        except PlaywrightTimeout:
            print("  ↳  Could not auto-fill. Please log in manually in the browser.")

        
        print()
        print("  ─────────────────────────────────────────────────────")
        wait_for_user(
            "    Press ENTER here ONLY after you see the Instagram home feed: "
        )
        print("  ─────────────────────────────────────────────────────")
        rand_sleep(2, 3)

        
        for label in ["Not Now", "Not now", "Skip", "Cancel"]:
            try:
                await self.page.get_by_role("button", name=label).first.click(
                    timeout=2000
                )
                rand_sleep(1, 1.5)
            except Exception:
                pass

        print("\n  Login confirmed. Starting scrape…")
        return True

    

    async def collect_urls(self, hashtag: str) -> list[str]:
        url = f"https://www.instagram.com/explore/tags/{hashtag}/"
        print(f"\n    #{hashtag}")
        try:
            await self.page.goto(url, wait_until="networkidle", timeout=30000)
        except PlaywrightTimeout:
            await self.page.goto(url, wait_until="load", timeout=30000)
        rand_sleep(2, 3)

        urls: set[str] = set()
        attempts = 0

        while len(urls) < MAX_POSTS_PER_TAG and attempts < 8:
            links = await self.page.eval_on_selector_all(
                "a[href*='/p/']", "els => els.map(e => e.href)"
            )
            for lnk in links:
                if "/p/" in lnk:
                    urls.add(lnk.split("?")[0])
            if len(urls) >= MAX_POSTS_PER_TAG:
                break
            await self.page.evaluate("window.scrollBy(0, window.innerHeight * 2)")
            rand_sleep(*SCROLL_PAUSE)
            attempts += 1

        result = list(urls)[:MAX_POSTS_PER_TAG]
        print(f"    ↳ {len(result)} posts collected.")
        return result

    

    async def scrape_post(self, url: str, hashtag: str, city: str) -> dict | None:
        try:
            await self.page.goto(url, wait_until="domcontentloaded", timeout=20000)
            rand_sleep(1.5, 3)

            caption = ""
            for sel in [
                "div[data-testid='post-comment-root'] span",
                "article div._a9zs span",
                "h1._aacl",
            ]:
                try:
                    el = await self.page.query_selector(sel)
                    if el:
                        caption = await el.inner_text()
                        if caption:
                            break
                except Exception:
                    pass
            if not caption:
                try:
                    caption = (
                        await self.page.get_attribute(
                            'meta[name="description"]', "content"
                        )
                        or ""
                    )
                except Exception:
                    pass

            username = ""
            try:
                el = await self.page.query_selector("article header a")
                if el:
                    username = (await el.inner_text()).strip()
            except Exception:
                pass
            if not username:
                try:
                    m = re.search(r"@([\w.]+)", await self.page.title())
                    username = m.group(1) if m else ""
                except Exception:
                    pass

            bio_link = ""
            if username:
                try:
                    await self.page.goto(
                        f"https://www.instagram.com/{username.lstrip('@')}/",
                        wait_until="domcontentloaded",
                        timeout=15000,
                    )
                    rand_sleep(1, 2)
                    el = await self.page.query_selector('a[rel*="nofollow"]')
                    if el:
                        bio_link = await el.get_attribute("href") or ""
                except Exception:
                    pass

            if not is_realestate_lead(caption):
                return None

            contacts = extract_contacts(caption)
            if bio_link and bio_link not in contacts["websites"]:
                contacts["websites"].append(bio_link)

            return {
                "post_url": url,
                "username": username,
                "caption_snippet": caption[:300].replace("\n", " "),
                "phones": " | ".join(contacts["phones"]),
                "emails": " | ".join(contacts["emails"]),
                "whatsapp": " | ".join(contacts["whatsapp"]),
                "websites": " | ".join(contacts["websites"]),
                "hashtag": hashtag,
                "city": city,
                "scraped_at": datetime.datetime.now().isoformat(timespec="seconds"),
            }

        except PlaywrightTimeout:
            print(f"      Timeout — {url}")
            return None
        except Exception as e:
            print(f"      Error — {e}")
            return None





async def main():
    print("=" * 58)
    print("  Instagram Real Estate Lead Scraper")
    print("=" * 58)

    city = input("\n  Enter city (e.g. colombo): ").strip()
    ig_user = input("  Instagram username: ").strip()
    ig_pass = input("  Instagram password: ").strip()

    if not all([city, ig_user, ig_pass]):
        print("All fields are required.")
        return

    hashtags = build_hashtags(city)
    print(f"\n   Will search {len(hashtags)} hashtags:")
    for tag in hashtags:
        print(f"     #{tag}")

    scraper = RealEstateScraper()
    scraper._username = ig_user
    scraper._password = ig_pass

    await scraper.launch()

    try:
        await scraper.login()

        all_urls: dict[str, str] = {}

        print("\n  Phase 1: Collecting post URLs…")
        for tag in hashtags:
            urls = await scraper.collect_urls(tag)
            for u in urls:
                if u not in all_urls:
                    all_urls[u] = tag
            rand_sleep(2, 4)

        total = len(all_urls)
        print(f"\n  Total unique posts: {total}")

        if total == 0:
            print("No posts found. Try a different city name.")
            return

        print("\n  Phase 2: Extracting lead data…\n")
        records = []
        for i, (url, tag) in enumerate(all_urls.items(), 1):
            print(f"  [{i}/{total}] {url}")
            rec = await scraper.scrape_post(url, tag, city)
            if rec:
                records.append(rec)
                print(
                    f"    ✓  @{rec['username']} | "
                    f" {rec['phones'] or '—'} | "
                    f" {rec['emails'] or '—'} | "
                    f" {rec['websites'][:40] or '—'}"
                )
            else:
                print("    –  Not a real estate lead, skipped.")
            rand_sleep(2, 5)

        save_csv(records)
        print(f"\n  Done! Found {len(records)} real estate leads from '{city}'.")

    finally:
        print("\n  Closing browser…")
        await scraper.close()


if __name__ == "__main__":
    asyncio.run(main())
