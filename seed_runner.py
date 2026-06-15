import asyncio
from playwright.async_api import async_playwright

async def seed():
    async with async_playwright() as pw:
        browser = await pw.chromium.connect_over_cdp('http://127.0.0.1:9222')
        print('Connected to browser')
        context = browser.contexts[0]
        page = None
        for p in context.pages:
            if 'localhost:5001' in p.url:
                page = p
                break
        if not page:
            page = await context.new_page()
            await page.goto('http://localhost:5001/index.html', timeout=15000)
        print('Page URL:', page.url)
        await page.wait_for_timeout(3000)
        await page.add_script_tag(path='C:/Users/v-aalsadi/Downloads/my test/diyarona/seed-data.js')
        await page.wait_for_timeout(1000)
        await page.evaluate('window.seedFirestoreData(true)')
        print('Seeding properties...')
        await page.wait_for_timeout(6000)
        await page.evaluate('window.seedAdminAuth()')
        print('Admin auth seeded')
        await page.wait_for_timeout(3000)
        js_code = """
            db.collection('properties').get().then(function(s){return s.size})
        """
        count = await page.evaluate(js_code)
        print('Properties count:', count)

asyncio.run(seed())
