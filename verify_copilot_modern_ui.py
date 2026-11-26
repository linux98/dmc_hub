import asyncio
import os
import shutil
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\T420-2\.gemini\antigravity\brain\8d7ddc6e-ac1a-4e88-bdb6-c7ff0bd12965"

async def test_modern_copilot_ui():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1600, 'height': 1050})

        console_errors = []
        page.on("pageerror", lambda err: console_errors.append(str(err)))
        page.on("console", lambda msg: console_errors.append(f"CONSOLE {msg.type}: {msg.text}") if msg.type == "error" else None)

        file_url = f"file:///{os.path.abspath('index.html').replace(os.sep, '/')}"
        print(f"Loading {file_url}...")
        await page.goto(file_url, wait_until="networkidle")
        await asyncio.sleep(2)

        # 1. Click #btnOpenCopilot
        print("1. Opening Copilot...")
        await page.locator("#btnOpenCopilot").click()
        await asyncio.sleep(1)

        # 2. Type 6547 to auto-unlock
        print("2. Auto-unlocking with 6547...")
        await page.locator("#copilotPinInput").press_sequentially("6547", delay=80)
        await asyncio.sleep(1.5)

        assert await page.locator("#copilotModal").is_visible() == True
        print("Copilot Modal is open.")

        # 3. Check modern UI elements
        title_text = await page.locator(".copilot-title").inner_text()
        badge_text = await page.locator(".copilot-badge-live").inner_text()
        print(f"Header: Title='{title_text}', Badge='{badge_text}'")

        # 4. Click a suggestion chip: 5 เสาหลักยุทธศาสตร์
        print("4. Clicking suggestion chip...")
        chip = page.locator(".copilot-chip", has_text="5 เสาหลักยุทธศาสตร์")
        await chip.click()
        await asyncio.sleep(2)

        # Verify bot replied with .copilot-msg-card
        msg_count = await page.locator(".copilot-msg").count()
        print(f"Total messages count: {msg_count}")
        assert msg_count >= 3 # Initial bot, User chip, Bot answer

        # 5. Test copy button
        print("5. Testing copy button...")
        copy_btn = page.locator(".copilot-msg.bot:last-child .btn-copy-bubble")
        await copy_btn.click()
        await asyncio.sleep(0.5)
        copy_text = await copy_btn.inner_text()
        print(f"Copy button feedback: '{copy_text}'")

        # 6. Type a custom query in input
        print("6. Typing custom question...")
        await page.locator("#copilotInput").fill("โรงเรียนขนาดกลางมีกี่แห่ง")
        await page.locator("#copilotForm .copilot-send-btn").click()
        await asyncio.sleep(2)

        # Capture screenshot of modern drawer
        s1 = "verified_copilot_modern_ui.png"
        await page.screenshot(path=s1)
        shutil.copy(s1, os.path.join(ARTIFACT_DIR, s1))
        print(f"Saved {s1}")

        # Also capture focused drawer screenshot
        drawer_el = page.locator(".copilot-drawer")
        s2 = "verified_copilot_drawer_card.png"
        await drawer_el.screenshot(path=s2)
        shutil.copy(s2, os.path.join(ARTIFACT_DIR, s2))
        print(f"Saved {s2}")

        # 7. Test Clear chat history button
        print("7. Testing Clear Chat History...")
        await page.locator("#btnClearChatHistory").click()
        await asyncio.sleep(1)
        cleared_count = await page.locator(".copilot-msg").count()
        print(f"Messages count after clear: {cleared_count}")
        assert cleared_count == 1

        s3 = "verified_copilot_modern_cleared.png"
        await drawer_el.screenshot(path=s3)
        shutil.copy(s3, os.path.join(ARTIFACT_DIR, s3))
        print(f"Saved {s3}")

        print("\nALL Modern Copilot UX/UI tests PASSED successfully!")
        if console_errors:
            print("Console Errors:", console_errors)
        else:
            print("Zero console errors!")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_modern_copilot_ui())
