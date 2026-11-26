import asyncio
import os
import shutil
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\T420-2\.gemini\antigravity\brain\8d7ddc6e-ac1a-4e88-bdb6-c7ff0bd12965"

async def test_copilot_auth():
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

        # 1. Check Floating button exists and has lock icon
        btn_text = await page.locator("#btnOpenCopilot .copilot-btn-text").inner_text()
        print("Floating Copilot Button Text:", btn_text)

        # 2. Click floating button to open AI Copilot
        print("2. Clicking #btnOpenCopilot...")
        await page.locator("#btnOpenCopilot").click()
        await asyncio.sleep(1)

        # Verify #copilotAuthModal is visible and #copilotModal is hidden
        auth_visible = await page.locator("#copilotAuthModal").is_visible()
        copilot_visible = await page.locator("#copilotModal").is_visible()
        print(f"Auth Modal Visible: {auth_visible}, Copilot Modal Visible: {copilot_visible}")
        assert auth_visible == True, "copilotAuthModal should be visible"
        assert copilot_visible == False, "copilotModal should NOT be visible before PIN"

        # 3. Enter WRONG PIN (e.g. 1234)
        print("3. Testing wrong PIN 1234...")
        await page.locator("#copilotPinInput").fill("1234")
        await page.locator("#btnSubmitCopilotPin").click()
        await asyncio.sleep(1)

        error_visible = await page.locator("#copilotPinErrorMsg").is_visible()
        error_text = await page.locator("#copilotPinErrorMsg").inner_text()
        print(f"Wrong PIN Error Visible: {error_visible}, Text: '{error_text}'")
        assert error_visible == True, "Error message should be visible on wrong PIN"
        assert await page.locator("#copilotModal").is_visible() == False, "Copilot drawer must stay closed on wrong PIN"

        # Screenshot of wrong PIN error
        s1 = "verified_copilot_auth_gate_wrong.png"
        await page.screenshot(path=s1)
        shutil.copy(s1, os.path.join(ARTIFACT_DIR, s1))
        print(f"Saved {s1}")

        # 4. Enter CORRECT PIN (6547)
        print("4. Testing correct PIN 6547...")
        await page.locator("#copilotPinInput").fill("6547")
        await page.locator("#btnSubmitCopilotPin").click()
        await asyncio.sleep(1.5)

        auth_visible_after = await page.locator("#copilotAuthModal").is_visible()
        copilot_visible_after = await page.locator("#copilotModal").is_visible()
        print(f"After correct PIN: Auth Modal Visible: {auth_visible_after}, Copilot Modal Visible: {copilot_visible_after}")
        assert auth_visible_after == False, "copilotAuthModal should be hidden after correct PIN"
        assert copilot_visible_after == True, "copilotModal should be open after correct PIN 6547"

        # Verify welcome message in chat
        chat_text = await page.locator("#copilotMessages").inner_text()
        print(f"Copilot Chat Initial Greeting: {chat_text[:80]}...")

        # Screenshot of unlocked AI Copilot drawer
        s2 = "verified_copilot_unlocked.png"
        await page.screenshot(path=s2)
        shutil.copy(s2, os.path.join(ARTIFACT_DIR, s2))
        print(f"Saved {s2}")

        # 5. Test Lock Session button (#btnLockCopilot)
        print("5. Clicking #btnLockCopilot to lock session...")
        await page.locator("#btnLockCopilot").click()
        await asyncio.sleep(1)
        copilot_visible_locked = await page.locator("#copilotModal").is_visible()
        print(f"After Lock: Copilot Modal Visible: {copilot_visible_locked}")
        assert copilot_visible_locked == False, "Copilot drawer must be closed after locking"

        # 6. Test Sidebar menu item (#menuAiCopilot) asks for PIN again
        print("6. Clicking #menuAiCopilot from sidebar...")
        await page.locator("#menuAiCopilot").click()
        await asyncio.sleep(1)
        auth_visible_recheck = await page.locator("#copilotAuthModal").is_visible()
        print(f"After Sidebar Click: Auth Modal Visible: {auth_visible_recheck}")
        assert auth_visible_recheck == True, "copilotAuthModal must appear when clicked from sidebar"

        # Screenshot of re-locked gate
        s3 = "verified_copilot_relocked.png"
        await page.screenshot(path=s3)
        shutil.copy(s3, os.path.join(ARTIFACT_DIR, s3))
        print(f"Saved {s3}")

        print("\nAll Copilot Passcode 6547 Security checks PASSED successfully!")
        if console_errors:
            print("Console Errors:", console_errors)
        else:
            print("Zero console errors!")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_copilot_auth())
