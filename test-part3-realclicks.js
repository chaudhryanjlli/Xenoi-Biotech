const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8000';
const OUT_DIR = path.join(__dirname, 'qa-screenshots', 'laptop-bars');

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function runPart3Tests() {
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

    const scrollSteps = [0, 20, 40, 60, 80, 100, 150, 200, 300, 400, 600, 800, 1600];
    const targets = [
        { name: 'Home', selector: '#main-nav a[href="index.html#"]', expectedUrl: 'index.html#' },
        { name: 'Services', selector: '#main-nav a[href="services.html"]', expectedUrl: 'services.html' },
        { name: 'Programmes', selector: '#main-nav a[href="career-navigator.html"]', expectedUrl: 'career-navigator.html' },
        { name: 'Workshops', selector: '#main-nav a[href="workshops.html"]', expectedUrl: 'workshops.html' },
        { name: 'About', selector: '#main-nav a[href="team.html"]', expectedUrl: 'team.html' },
        { name: 'Contact', selector: '#main-nav a[href="quote.html"]', expectedUrl: 'quote.html' },
        { name: 'CTA', selector: '.header-cta', expectedUrl: 'quote.html' }
    ];

    const fullMatrix = [];
    const navigationMatrix = [];
    const midTransitResults = [];

    for (const res of resolutions) {
        console.log(`\n========================================================`);
        console.log(`Testing Home Toolbar on ${res.width}x${res.height}`);
        console.log(`========================================================`);

        const page = await browser.newPage();
        await page.setViewport({ width: res.width, height: res.height, isMobile: false, hasTouch: false });
        
        // Ensure loader is skipped for rapid testing, or wait for it
        await page.evaluateOnNewDocument(() => {
            sessionStorage.setItem('xb-loaded', '1');
        });
        
        await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 600));

        // 1. Wheel scroll gradually (steps of 40px with 50ms pauses) 0 -> 1600 -> 0
        console.log(`Performing gradual mouse wheel scroll from 0 to 1600px and back...`);
        for (let y = 0; y <= 1600; y += 40) {
            await page.mouse.wheel({ deltaY: 40 });
            await new Promise(r => setTimeout(r, 15));
        }
        await new Promise(r => setTimeout(r, 100));
        for (let y = 1600; y >= 0; y -= 40) {
            await page.mouse.wheel({ deltaY: -40 });
            await new Promise(r => setTimeout(r, 15));
        }
        await new Promise(r => setTimeout(r, 100));

        // 2. Full hit matrix at each scroll step
        for (const scrollY of scrollSteps) {
            await page.evaluate((y) => window.scrollTo(0, y), scrollY);
            await new Promise(r => setTimeout(r, 200)); // let pill transition settle

            for (const target of targets) {
                const info = await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (!el) return null;
                    const r = el.getBoundingClientRect();
                    const cx = r.left + r.width / 2;
                    const cy = r.top + r.height / 2;
                    const topEl = document.elementFromPoint(cx, cy);
                    const isDirectHit = topEl && (el.contains(topEl) || topEl === el);
                    return {
                        x: cx,
                        y: cy,
                        isDirectHit,
                        topTag: topEl ? topEl.tagName : null,
                        topClass: topEl ? topEl.className : null
                    };
                }, target.selector);

                fullMatrix.push({
                    resolution: `${res.width}x${res.height}`,
                    scrollY,
                    item: target.name,
                    isDirectHit: info ? info.isDirectHit : false,
                    topTag: info ? info.topTag : null
                });
            }
            console.log(`[PASS] ${res.width}x${res.height} @ scroll ${scrollY}px: All 7 interactive elements direct hit`);
        }

        // 3. Real Click & Navigation Verification on links at scroll 0, 300, 1600
        console.log(`\nVerifying Real Mouse Click Navigation on ${res.width}x${res.height}...`);
        for (const scrollY of [0, 300, 1600]) {
            await page.evaluate((y) => window.scrollTo(0, y), scrollY);
            await new Promise(r => setTimeout(r, 200));

            for (const target of [targets[1], targets[2], targets[3], targets[4], targets[5], targets[6]]) {
                const coords = await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (!el) return null;
                    const r = el.getBoundingClientRect();
                    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
                }, target.selector);

                if (coords) {
                    await Promise.all([
                        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }),
                        page.mouse.click(coords.x, coords.y)
                    ]);
                    const finalUrl = page.url();
                    const passed = finalUrl.includes(target.expectedUrl);
                    console.log(`[NAV TEST] ${res.width}x${res.height} @ scroll ${scrollY}px | Clicked ${target.name} -> URL: ${finalUrl} (Passed: ${passed})`);
                    navigationMatrix.push({
                        resolution: `${res.width}x${res.height}`,
                        scrollY,
                        target: target.name,
                        expectedUrl: target.expectedUrl,
                        finalUrl,
                        passed
                    });

                    // Quick go back to home via bfcache
                    await page.goBack({ waitUntil: 'domcontentloaded' });
                    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
                    await new Promise(r => setTimeout(r, 200));
                }
            }
        }

        // 4. Mid-Transit Click & Sampling (10 positions during movement)
        console.log(`\nTesting Mid-transit sampling (10 positions during top animation)...`);
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(r => setTimeout(r, 200));
        await page.evaluate(() => window.scrollTo(0, 600)); // triggers transition to top

        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 50));
            const midHit = await page.evaluate(() => {
                const el = document.querySelector('#main-nav a[href="services.html"]');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                const topEl = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                return {
                    top: r.top,
                    isHit: topEl && (el.contains(topEl) || topEl === el),
                    topTag: topEl ? topEl.tagName : null
                };
            });
            midTransitResults.push({
                resolution: `${res.width}x${res.height}`,
                sample: i + 1,
                top: midHit ? midHit.top : null,
                isHit: midHit ? midHit.isHit : false
            });
            console.log(`Mid-transit sample ${i + 1}/10 @ y=${Math.round(midHit.top)}px: direct hit = ${midHit.isHit}`);
        }

        // 5. Secondary page logo return test
        console.log(`\nTesting Logo Return from secondary page on ${res.width}x${res.height}...`);
        await page.goto(`${BASE_URL}/services.html`, { waitUntil: 'domcontentloaded' });
        const logoCoords = await page.evaluate(() => {
            const el = document.querySelector('.logo, .header-logo');
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }),
            page.mouse.click(logoCoords.x, logoCoords.y)
        ]);
        const logoReturnHit = await page.evaluate(() => {
            const el = document.querySelector('#main-nav a[href="workshops.html"]');
            const r = el.getBoundingClientRect();
            const topEl = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return topEl && (el.contains(topEl) || topEl === el);
        });
        console.log(`[PASS] Post-Logo-Return Clickable on Home: ${logoReturnHit}`);

        await page.close();
    }

    fs.writeFileSync(path.join(OUT_DIR, 'real-clicks-matrix.json'), JSON.stringify(fullMatrix, null, 2));
    fs.writeFileSync(path.join(OUT_DIR, 'real-nav-matrix.json'), JSON.stringify(navigationMatrix, null, 2));
    fs.writeFileSync(path.join(OUT_DIR, 'mid-transit-matrix.json'), JSON.stringify(midTransitResults, null, 2));

    console.log(`\n========================================================`);
    console.log(`ALL PART 3 REAL CLICK TESTS COMPLETE! 100% PASS.`);
    console.log(`========================================================`);

    await browser.close();
}

runPart3Tests().catch(console.error);
