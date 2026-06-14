import asyncio
import os
from playwright.async_api import async_playwright
from dotenv import load_dotenv

load_dotenv()

FB_USERNAME = os.getenv("FB_USERNAME")
FB_PASSWORD = os.getenv("FB_PASSWORD")
SESSION_FILE = "fb_session.json"


async def main():
    pw = await async_playwright().start()

    browser = await pw.chromium.launch(
        headless=False,
        slow_mo=80,
        args=["--disable-blink-features=AutomationControlled"],
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

    print("\nOpening Facebook login...")
    await page.goto("https://www.facebook.com/login", wait_until="domcontentloaded")

    # Auto-fill credentials if available in .env
    try:
        await page.wait_for_selector('input[name="email"]', timeout=15000)
        if FB_USERNAME and FB_PASSWORD:
            await page.wait_for_timeout(800)
            await page.fill('input[name="email"]', FB_USERNAME)  # FB's field accepts username or email
            await page.wait_for_timeout(500)
            await page.fill('input[name="pass"]', FB_PASSWORD)
            await page.wait_for_timeout(500)
            await page.click('button[name="login"]')
            print("Credentials submitted.")
        else:
            print("No credentials in .env — please log in manually in the browser.")
    except Exception as e:
        print(f"Auto-fill failed ({e}). Please log in manually.")

    # Keep browser alive while user completes login / solves CAPTCHA
    print("\n" + "=" * 50)
    print("INSTRUCTIONS:")
    print("  1. Complete login (including any CAPTCHA / 2FA)")
    print("  2. Wait until you can see the Facebook HOME FEED")
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

    # Dismiss common pop-ups before saving
    for btn_text in ["Allow all cookies", "Accept All", "Close", "Not Now"]:
        try:
            btn = page.locator(f'button:has-text("{btn_text}")')
            if await btn.count() > 0:
                await btn.first.click()
                await page.wait_for_timeout(600)
        except Exception:
            pass

    await ctx.storage_state(path=SESSION_FILE)
    print(f"\n✔ Session saved → {SESSION_FILE}")
    print("Now run:  python fb.py")

    await page.wait_for_timeout(1000)
    await browser.close()
    await pw.stop()


if __name__ == "__main__":
    asyncio.run(main())