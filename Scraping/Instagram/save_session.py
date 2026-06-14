
import asyncio
import os
from playwright.async_api import async_playwright
from dotenv import load_dotenv

load_dotenv()

IG_USERNAME = os.getenv("IG_USERNAME")
IG_PASSWORD = os.getenv("IG_PASSWORD")


async def main():
    

    pw = await async_playwright().start()

    browser = await pw.chromium.launch(
        headless=False,
        slow_mo=50,
        args=["--disable-blink-features=AutomationControlled"]
    )

    ctx = await browser.new_context(
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        viewport={"width": 1280, "height": 800},
        locale="en-US",
    )

    page = await ctx.new_page()

    print("\nOpening Instagram...")
    await page.goto("https://www.instagram.com/accounts/login/", wait_until="domcontentloaded")

    
    try:
        await page.wait_for_selector('input[name="username"]', timeout=15000)
        if IG_USERNAME and IG_PASSWORD:
            await page.wait_for_timeout(1000)
            await page.fill('input[name="username"]', IG_USERNAME)
            await page.wait_for_timeout(600)
            await page.fill('input[name="password"]', IG_PASSWORD)
            await page.wait_for_timeout(600)
            await page.click('button[type="submit"]')
            print("Credentials submitted.")
    except Exception:
        print("Could not auto-fill. Please log in manually in the browser.")

    
    print("\n" + "=" * 50)
    print("INSTRUCTIONS:")
    print("  1. Complete login in the browser (including any CAPTCHA)")
    print("  2. Wait until you can see the Instagram HOME FEED")
    print("  3. Then come back here and press ENTER")
    print("=" * 50)
    print("(Browser will stay open until you press ENTER)\n")

    async def keep_alive():
        while True:
            await asyncio.sleep(2)
            try:
                
                await page.title()
            except Exception:
                break

    
    loop = asyncio.get_event_loop()
    keep_task = asyncio.create_task(keep_alive())

    await loop.run_in_executor(None, input, "Press ENTER when home feed is visible: ")

    keep_task.cancel()

    
    for btn_text in ["Save Info", "Not Now", "Allow All Cookies", "Accept All"]:
        try:
            btn = page.locator(f'button:has-text("{btn_text}")')
            if await btn.count() > 0:
                await btn.first.click()
                await page.wait_for_timeout(800)
        except Exception:
            pass

    await ctx.storage_state(path="ig_session.json")
    print("\nSession saved → ig_session.json")
    print("Now run:  python insta_scraper.py")

    await page.wait_for_timeout(1000)
    await browser.close()
    await pw.stop()


if __name__ == "__main__":
    asyncio.run(main())