import asyncio
import csv
import re
import datetime
import os
from playwright.async_api import async_playwright

OUTPUT_FILE = "facebook_data.csv"

HEADLESS = False
MAX_POSTS = 20  # We can edit this as we want.


LEAD_KEYWORDS = [
    "sale",
    "rent",
    "buy",
    "sell",
    "property",
    "house",
    "apartment",
    "villa",
    "land",
    "contact",
    "call",
    "whatsapp",
    "price",
    "agent",
]

PATTERNS = {
    "phone": re.compile(r"(?<!\d)(\+?[\d\s\-().]{7,16}\d)(?!\d)"),
    "email": re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),
    "website": re.compile(r"https?://[^\s\"'<>]+|www\.[^\s\"'<>]+", re.I),
}


def build_pages(city):
    city = city.strip().lower()

    # Here we can add more
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


def save_csv(rows):
    if not rows:
        print("No leads found")
        return

    fields = ["post_url", "caption", "phones", "emails", "websites", "scraped_at"]

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nSaved {len(rows)} rows -> {OUTPUT_FILE}")


class FacebookScraper:
    async def start(self):
        self.pw = await async_playwright().start()

        self.browser = await self.pw.chromium.launch(headless=HEADLESS, slow_mo=100)

        if os.path.exists("fb_session.json"):
            self.ctx = await self.browser.new_context(storage_state="fb_session.json")
        else:
            self.ctx = await self.browser.new_context()

        self.page = await self.ctx.new_page()

    async def close(self):
        await self.browser.close()
        await self.pw.stop()

    async def login(self):
        await self.page.goto("https://www.facebook.com/login")
        print("\n Login manually")
        input("Press ENTER after login is complete...")

        await self.page.wait_for_timeout(5000)

        if "login" in self.page.url:
            print("Login failed")
            return

        await self.ctx.storage_state(path="fb_session.json")
        print("Session saved")

    async def scrape_page_posts(self, page_url):

        print(f"\nScraping: {page_url}")

        await self.page.goto(page_url)
        await asyncio.sleep(10)

        results = []

        for _ in range(6):
            text = await self.page.locator("body").inner_text()

            if text and len(text) > 100 and is_lead(text):
                contacts = extract_contacts(text)

                results.append(
                    {
                        "post_url": page_url,
                        "caption": text[:500].replace("\n", " "),
                        "phones": " | ".join(contacts["phones"]),
                        "emails": " | ".join(contacts["emails"]),
                        "websites": " | ".join(contacts["websites"]),
                        "scraped_at": datetime.datetime.now().isoformat(),
                    }
                )

            await self.page.mouse.wheel(0, 8000)
            await asyncio.sleep(5)

        return results


async def main():

    city = input("Enter city: ")

    FACEBOOK_PAGES = build_pages(city)

    scraper = FacebookScraper()
    await scraper.start()

    try:
        await scraper.login()

        all_results = []

        for page in FACEBOOK_PAGES:
            data = await scraper.scrape_page_posts(page)
            all_results.extend(data)

        print(f"\nTotal leads found: {len(all_results)}")

        save_csv(all_results)

    finally:
        await scraper.close()
        print("Done")


if __name__ == "__main__":
    asyncio.run(main())
