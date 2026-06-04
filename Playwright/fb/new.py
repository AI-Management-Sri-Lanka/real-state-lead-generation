import asyncio
import re
import datetime
import os
import json
from playwright.async_api import async_playwright

OUTPUT_FILE = "facebook_data.json"

HEADLESS = False
MAX_POSTS = 20

LEAD_KEYWORDS = [
    "sale", "rent", "buy", "sell", "property", "house",
    "apartment", "villa", "land", "contact", "call",
    "whatsapp", "price", "agent",
]

PATTERNS = {
    "phone": re.compile(r"(?<!\d)(\+?[\d\s\-().]{7,16}\d)(?!\d)"),
    "email": re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),
    "website": re.compile(r"https?://[^\s\"'<>]+|www\.[^\s\"'<>]+", re.I),
}


def build_pages(city):
    city = city.strip().lower()
    return [
        f"https://www.facebook.com/search/pages/?q={city}%20real%20estate",
        f"https://www.facebook.com/search/pages/?q={city}%20property",
        f"https://www.facebook.com/search/pages/?q={city}%20house%20for%20sale",
        f"https://www.facebook.com/search/pages/?q={city}%20apartment",
    ]


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

    data = {
        "total": len(rows),
        "scraped_at": datetime.datetime.now().isoformat(),
        "results": rows
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"\nSaved {len(rows)} rows -> {OUTPUT_FILE}")


class FacebookScraper:
    async def start(self):
        self.pw = await async_playwright().start()

        self.browser = await self.pw.chromium.launch(
            headless=HEADLESS,
            slow_mo=150
        )

        self.ctx = await self.browser.new_context()
        self.page = await self.ctx.new_page()

    async def close(self):
        await self.browser.close()
        await self.pw.stop()

    async def login(self):
        await self.page.goto("https://www.facebook.com/login")

        print("\n Login manually in the browser")

       
        
        for i in range(120):
            await asyncio.sleep(1)

           
            if "login" not in self.page.url:
                break

        
        await self.page.wait_for_timeout(5000)

        if "login" in self.page.url:
            print("Login not completed (or CAPTCHA not solved)")
            input("Solve CAPTCHA / login manually then press ENTER...")

        await self.ctx.storage_state(path="fb_session.json")
        print("Session saved")

    async def scrape_page_posts(self, page_url):
        print(f"\nScraping: {page_url}")

        await self.page.goto(page_url)

        
        await self.page.wait_for_timeout(10000)

        results = []

        for _ in range(6):

            text = await self.page.locator("body").inner_text()

            if text and len(text) > 100 and is_lead(text):
                contacts = extract_contacts(text)

                results.append({
                    "post_url": page_url,
                    "caption": text[:500].replace("\n", " "),
                    "phones": contacts["phones"],
                    "emails": contacts["emails"],
                    "websites": contacts["websites"],
                    "scraped_at": datetime.datetime.now().isoformat(),
                })

            
            await self.page.mouse.wheel(0, 2500)
            await asyncio.sleep(6)

        return results


async def main():
    city = input("Enter city: ")

    pages = build_pages(city)

    scraper = FacebookScraper()
    await scraper.start()

    try:
        await scraper.login()

        all_results = []

        for page in pages:
            data = await scraper.scrape_page_posts(page)
            all_results.extend(data)

        print(f"\nTotal leads found: {len(all_results)}")

        save_json(all_results)

    finally:
        await scraper.close()
        print("Done")


if __name__ == "__main__":
    asyncio.run(main())