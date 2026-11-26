import asyncio
import os
import shutil
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\T420-2\.gemini\antigravity\brain\8d7ddc6e-ac1a-4e88-bdb6-c7ff0bd12965"

async def test_instant_auto_unlock():
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

        auth_visible = await page.locator("#copilotAuthModal").is_visible()
        print(f"Copilot Auth Modal Visible: {auth_visible}")
        assert auth_visible == True

        # 2. Type wrong PIN "1234" character-by-character to trigger input event
        print("2. Typing wrong PIN 1234 without clicking button...")
        pin_input = page.locator("#copilotPinInput")
        await pin_input.press_sequentially("1234", delay=100)
        await asyncio.sleep(1)

        # Verify auto-checked: error shown without clicking submit button
        error_visible = await page.locator("#copilotPinErrorMsg").is_visible()
        print(f"Error Visible immediately on 4th digit: {error_visible}")
        assert error_visible == True, "Error must show automatically on 4 digits"
        assert await page.locator("#copilotModal").is_visible() == False

        # 3. Type correct PIN "6547" character-by-character
        print("3. Typing correct PIN 6547 without clicking button...")
        await pin_input.press_sequentially("6547", delay=100)
        await asyncio.sleep(1.5)

        # Verify auto-unlocked: modal opened immediately without clicking submit button
        auth_visible_after = await page.locator("#copilotAuthModal").is_visible()
        copilot_visible_after = await page.locator("#copilotModal").is_visible()
        print(f"Instant Auto-Unlock: Auth Modal Visible={auth_visible_after}, Copilot Modal Visible={copilot_visible_after}")
        assert auth_visible_after == False, "copilotAuthModal should hide immediately"
        assert copilot_visible_after == True, "copilotModal should open immediately upon typing 6547"

        # Screenshot of auto-unlocked Copilot
        s1 = "verified_copilot_instant_unlocked.png"
        await page.screenshot(path=s1)
        shutil.copy(s1, os.path.join(ARTIFACT_DIR, s1))
        print(f"Saved {s1}")

        # 4. Lock session
        print("4. Locking session...")
        await page.locator("#btnLockCopilot").click()
        await asyncio.sleep(1)
        assert await page.locator("#copilotModal").is_visible() == False

        # 5. Test Executive Speech Synthesizer modal auto-unlock
        print("5. Testing Executive Speech Synthesizer auto-unlock...")
        await page.locator("#openExecutiveSpeechBtn").click()
        await asyncio.sleep(1)
        speech_auth_visible = await page.locator("#executiveSpeechAuthModal").is_visible()
        print(f"Speech Auth Modal Visible: {speech_auth_visible}")
        assert speech_auth_visible == True

        # Type 6547
        print("Typing 6547 in speech PIN input without clicking button...")
        await page.locator("#executivePinInput").press_sequentially("6547", delay=100)
        await asyncio.sleep(1.5)

        speech_auth_visible_after = await page.locator("#executiveSpeechAuthModal").is_visible()
        speech_modal_visible = await page.locator("#executiveSpeechModal").is_visible()
        print(f"Speech Instant Unlock: Auth Modal={speech_auth_visible_after}, Speech Modal={speech_modal_visible}")
        assert speech_auth_visible_after == False
        assert speech_modal_visible == True

        # Screenshot of auto-unlocked Speech Modal
        s2 = "verified_speech_instant_unlocked.png"
        await page.screenshot(path=s2)
        shutil.copy(s2, os.path.join(ARTIFACT_DIR, s2))
        print(f"Saved {s2}")

        print("\nALL Instant Auto-Unlock checks PASSED with 100% SUCCESS!")
        if console_errors:
            print("Console Errors:", console_errors)
        else:
            print("Zero console errors!")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_instant_auto_unlock())
