const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'qa-screenshots', 'laptop-bars');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function captureBefore() {
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] });
    
    // 1. Mobile & tablet before screenshots
    for (const vp of [
        { width: 390, height: 844, name: 'phone-390x844' },
        { width: 768, height: 1024, name: 'tablet-768x1024' },
        { width: 1024, height: 768, name: 'tablet-1024x768' }
    ]) {
        const page = await browser.newPage();
        await page.setViewport({ width: vp.width, height: vp.height, isMobile: true, hasTouch: true });
        
        await page.goto('http://localhost:8000/', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(OUT_DIR, `before-home-${vp.name}.png`) });

        await page.goto('http://localhost:8000/services.html', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(OUT_DIR, `before-services-${vp.name}.png`) });

        await page.close();
    }

    // 2. Laptop home before screenshots
    const lapPage = await browser.newPage();
    await lapPage.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });
    await lapPage.goto('http://localhost:8000/', { waitUntil: 'domcontentloaded' });
    await lapPage.waitForFunction(() => !document.getElementById('xb-loader') || document.getElementById('xb-loader').classList.contains('xb-hide'), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    await lapPage.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 200));
    await lapPage.screenshot({ path: path.join(OUT_DIR, 'before-laptop-home-scroll-0.png') });

    await lapPage.evaluate(() => window.scrollTo(0, 300));
    await new Promise(r => setTimeout(r, 300));
    await lapPage.screenshot({ path: path.join(OUT_DIR, 'before-laptop-home-scroll-300.png') });

    await lapPage.close();
    await browser.close();
    console.log('Saved all before screenshots to qa-screenshots/laptop-bars/');
}
captureBefore().catch(console.error);
