import asyncio
import os
from playwright.async_api import async_playwright

async def export():
    html_path = os.path.abspath("banner_designer.html")
    file_url = f"file:///{html_path.replace(os.sep, '/')}"
    print(f"Loading: {file_url}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # device_scale_factor=2 gives high-DPI crystal clear banners!
        context = await browser.new_context(viewport={"width": 1400, "height": 1800}, device_scale_factor=2)
        page = await context.new_page()
        
        await page.goto(file_url, wait_until="networkidle")
        # Ensure fonts are ready
        await page.evaluate("document.fonts.ready")
        await asyncio.sleep(1) # Extra stability for font rendering
        
        banners = [
            ("banner800", "banner_dmc_hub_800x250.png"),
            ("banner1200", "banner_dmc_hub_1200x400.png"),
            ("banner400", "banner_dmc_hub_400x150.png")
        ]
        
        for elem_id, out_file in banners:
            loc = page.locator(f"#{elem_id}")
            await loc.screenshot(path=out_file)
            print(f"Exported: {out_file} (Size: {os.path.getsize(out_file):,} bytes)")
            
        await browser.close()
        print("All banners exported successfully!")

if __name__ == "__main__":
    asyncio.run(export())
