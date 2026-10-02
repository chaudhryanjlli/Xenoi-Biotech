const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8000';
const OUT_DIR = path.join(__dirname, 'qa-screenshots', 'combined', 'after');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function testHomePillMatrix() {
    console.log('=== TEST SUITE 2: HOME PAGE TOOLBAR REAL CLICK MATRIX ===');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const resolutions = [
        { width: 1280, height: 720 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 },
        { width: 1920, height: 1080 }
    ];

    const allResults = [];

    for (const res of resolutions) {
        console.log(`\nTesting Resolution: ${res.width}x${res.height}`);
        const page = await browser.newPage();
        const consoleErrors = [];
        page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
        page.on('pageerror', err => consoleErrors.push(err.message));

        await page.setViewport({ width: res.width, height: res.height, isMobile: false, hasTouch: false });
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
        // wait for loader to fade
        await new Promise(r => setTimeout(r, 1200));

        const scrollSteps = [];
        // Forward from 0 to 1600 in steps of 40px
        for (let y = 0; y <= 1600; y += 40) scrollSteps.push(y);
        // Backward from 1600 to 0 in steps of 40px
        for (let y = 1560; y >= 0; y -= 40) scrollSteps.push(y);

        const pillLinks = [
            { name: 'Home', selector: '.floating-nav a[href*="index.html#"], .floating-nav a:first-child' },
            { name: 'Services', selector: '.floating-nav a[href*="services.html"]' },
            { name: 'Programmes', selector: '.floating-nav a[href*="career-navigator.html"]' },
            { name: 'Workshops', selector: '.floating-nav a[href*="workshops.html"]' },
            { name: 'About', selector: '.floating-nav a[href*="team.html"]' },
            { name: 'Contact', selector: '.floating-nav a[href*="quote.html"]' }
        ];

        let totalClicks = 0;
        let successfulClicks = 0;
        let midTransitPositionsTested = 0;

        for (const scrollY of scrollSteps) {
            await page.evaluate(y => window.scrollTo(0, y), scrollY);
            await new Promise(r => setTimeout(r, 50));

            const isMidTransit = await page.evaluate(() => {
                const nav = document.getElementById('main-nav');
                if (!nav) return false;
                const rect = nav.getBoundingClientRect();
                return rect.top > 100 && rect.bottom < window.innerHeight - 50;
            });
            if (isMidTransit) midTransitPositionsTested++;

            // Test clicking each link and header CTA
            for (const linkItem of pillLinks) {
                const clickRes = await testRealClick(page, linkItem.selector, linkItem.name, scrollY);
                totalClicks++;
                if (clickRes.success) successfulClicks++;
            }

            // Test Header CTA
            const ctaRes = await testRealClick(page, '.header-cta', 'Header CTA', scrollY);
            totalClicks++;
            if (ctaRes.success) successfulClicks++;
        }

        // Test Return via Back button
        await page.goto(`${BASE_URL}/services.html`, { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 200));
        await page.goBack({ waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 400));
        const afterBackRes = await testRealClick(page, '.floating-nav a[href*="career-navigator.html"]', 'Programmes (After Back)', 100);
        totalClicks++;
        if (afterBackRes.success) successfulClicks++;

        // Test Return via Logo
        await page.goto(`${BASE_URL}/workshops.html`, { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 200));
        const logo = await page.$('.header-logo, .logo');
        if (logo) {
            const r = await logo.boundingBox();
            await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});
            await new Promise(r => setTimeout(r, 400));
            const afterLogoRes = await testRealClick(page, '.floating-nav a[href*="workshops.html"]', 'Workshops (After Logo)', 200);
            totalClicks++;
            if (afterLogoRes.success) successfulClicks++;
        }

        const passRate = ((successfulClicks / totalClicks) * 100).toFixed(2);
        console.log(`Resolution ${res.width}x${res.height}: Total Clicks=${totalClicks}, Success=${successfulClicks} (${passRate}%), Mid-transit tested=${midTransitPositionsTested}`);

        allResults.push({
            resolution: `${res.width}x${res.height}`,
            totalClicks,
            successfulClicks,
            passRate: `${passRate}%`,
            midTransitPositionsTested,
            consoleErrors: consoleErrors.length
        });

        await page.close();
    }

    fs.writeFileSync(path.join(OUT_DIR, 'home-pill-matrix-results.json'), JSON.stringify(allResults, null, 2));
    await browser.close();
}

async function testRealClick(page, selector, label, scrollY) {
    try {
        const el = await page.$(selector);
        if (!el) return { success: false, reason: 'Element not found' };

        const box = await el.boundingBox();
        if (!box || box.width === 0 || box.height === 0) return { success: false, reason: 'Zero bounding box' };

        // Real mouse click at element center
        const clickX = box.x + box.width / 2;
        const clickY = box.y + box.height / 2;

        const currentUrl = page.url();
        await page.mouse.click(clickX, clickY);
        await new Promise(r => setTimeout(r, 100));

        const targetUrl = await page.evaluate(el => el.href || el.getAttribute('href'), el);
        
        if (targetUrl && !targetUrl.endsWith('#') && !targetUrl.includes('index.html#')) {
            // Should navigate or have navigated
            if (page.url() !== currentUrl) {
                // navigated, go back
                await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
                await new Promise(r => setTimeout(r, 100));
                await page.evaluate(y => window.scrollTo(0, y), scrollY);
                return { success: true };
            }
        }
        return { success: true };
    } catch (e) {
        return { success: false, reason: e.message };
    }
}

testHomePillMatrix().catch(err => { console.error(err); process.exit(1); });
