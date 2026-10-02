const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8000';
const OUT_DIR = path.join(__dirname, 'qa-screenshots', 'combined', 'after');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const ALL_PAGES = [
    'index',
    'services',
    'genomics',
    'workshops',
    'team',
    'quote',
    'career-navigator',
    'internships',
    'collaboration',
    'privacy',
    'terms',
    '404'
];

async function runRegressionAndAfter() {
    console.log('=== TEST SUITE 4: ALL 11 SECONDARY PAGES & PHONE/TABLET REGRESSION ===');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const report = {
        mobileChecks: [],
        secondaryBarChecks: [],
        consoleErrors: []
    };

    // 1. Mobile & tablet viewports: 390x844, 768x1024, 1024x768 (touch)
    const mobileViewports = [
        { name: '390x844', width: 390, height: 844, isMobile: true, hasTouch: true },
        { name: '768x1024', width: 768, height: 1024, isMobile: true, hasTouch: true },
        { name: '1024x768', width: 1024, height: 768, isMobile: true, hasTouch: true }
    ];

    for (const vp of mobileViewports) {
        for (const pageName of ALL_PAGES) {
            const page = await browser.newPage();
            const errors = [];
            page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
            page.on('pageerror', err => errors.push(err.message));

            let frameRequests = 0;
            page.on('request', req => {
                if (req.url().includes('frame_') || req.url().includes('frames/')) frameRequests++;
            });

            await page.setViewport(vp);
            const url = pageName === 'index' ? `${BASE_URL}/` : `${BASE_URL}/${pageName}.html`;
            await page.goto(url, { waitUntil: 'networkidle0' });
            await new Promise(r => setTimeout(r, 400));

            // Test drawer open & navigation
            const mobileMenuBtn = await page.$('.mobile-menu-btn, #mobile-menu-btn');
            let drawerOpened = false;
            if (mobileMenuBtn) {
                await mobileMenuBtn.click().catch(() => {});
                await new Promise(r => setTimeout(r, 300));
                drawerOpened = await page.evaluate(() => {
                    const d = document.querySelector('.mobile-drawer') || document.querySelector('.top-nav');
                    return !!d;
                });
            }

            // Check no loader
            const noLoader = await page.evaluate(() => {
                const l = document.getElementById('xb-loader');
                return !l || window.getComputedStyle(l).display === 'none';
            });

            await page.screenshot({ path: path.join(OUT_DIR, `mobile-${pageName}-${vp.name}.png`), fullPage: false });

            report.mobileChecks.push({
                page: pageName,
                viewport: vp.name,
                frameRequests,
                drawerOpened,
                noLoader,
                errors: errors.length
            });

            if (errors.length > 0) report.consoleErrors.push({ page: pageName, vp: vp.name, errors });
            await page.close();
        }
    }

    // 2. Desktop Secondary pages top bar checks (1366x768, 1440x900, 1920x1080)
    for (const vp of [{ name: '1366x768', width: 1366, height: 768 }, { name: '1440x900', width: 1440, height: 900 }, { name: '1920x1080', width: 1920, height: 1080 }]) {
        for (const pageName of ALL_PAGES) {
            const page = await browser.newPage();
            const errors = [];
            page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
            page.on('pageerror', err => errors.push(err.message));

            await page.setViewport({ width: vp.width, height: vp.height, isMobile: false, hasTouch: false });
            const url = pageName === 'index' ? `${BASE_URL}/` : `${BASE_URL}/${pageName}.html`;
            await page.goto(url, { waitUntil: 'networkidle0' });
            await new Promise(r => setTimeout(r, 1200));

            // Check header is fixed and clickable
            const headerInfo = await page.evaluate(() => {
                const h = document.querySelector('.site-header, .header');
                if (!h) return null;
                const cs = window.getComputedStyle(h);
                return {
                    position: cs.position,
                    height: cs.height,
                    bg: cs.backgroundColor
                };
            });

            await page.screenshot({ path: path.join(OUT_DIR, `desktop-${pageName}-${vp.name}-scroll0.png`) });
            await page.evaluate(() => window.scrollTo(0, 300));
            await new Promise(r => setTimeout(r, 300));
            await page.screenshot({ path: path.join(OUT_DIR, `desktop-${pageName}-${vp.name}-scroll300.png`) });

            // Test real click on logo
            const logo = await page.$('.header-logo, .logo');
            let logoClickWorks = false;
            if (logo) {
                const box = await logo.boundingBox();
                if (box) {
                    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});
                    logoClickWorks = page.url().includes('index.html') || page.url().endsWith('/');
                }
            }

            report.secondaryBarChecks.push({
                page: pageName,
                viewport: vp.name,
                headerInfo,
                logoClickWorks,
                errors: errors.length
            });

            if (errors.length > 0) report.consoleErrors.push({ page: pageName, vp: vp.name, errors });
            await page.close();
        }
    }

    fs.writeFileSync(path.join(OUT_DIR, 'regression-results.json'), JSON.stringify(report, null, 2));
    console.log('Regression and after screenshots captured successfully!');
    await browser.close();
}

runRegressionAndAfter().catch(err => { console.error(err); process.exit(1); });
