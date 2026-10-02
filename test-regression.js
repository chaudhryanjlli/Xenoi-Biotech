const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8000';
const OUT_DIR = path.join(__dirname, 'qa-screenshots', 'regression');

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

const LAPTOP_VIEWPORTS = [
    { width: 1366, height: 768, name: '1366x768' },
    { width: 1536, height: 864, name: '1536x864' },
    { width: 1440, height: 900, name: '1440x900' },
    { width: 1920, height: 1080, name: '1920x1080' },
    { width: 1280, height: 720, name: '1280x720' }
];

const COMPACT_VIEWPORTS = [
    { width: 390, height: 844, name: 'phone_390x844' },
    { width: 360, height: 800, name: 'phone_360x800' },
    { width: 768, height: 1024, name: 'tablet_768x1024' },
    { width: 1024, height: 768, name: 'tablet_1024x768' }
];

const SECONDARY_PAGES = [
    { name: 'services', url: '/services.html' },
    { name: 'genomics', url: '/genomics.html' },
    { name: 'workshops', url: '/workshops.html' },
    { name: 'team', url: '/team.html' },
    { name: 'quote', url: '/quote.html' },
    { name: 'career-navigator', url: '/career-navigator.html' },
    { name: 'internships', url: '/internships.html' },
    { name: 'collaboration', url: '/collaboration.html' },
    { name: 'privacy', url: '/privacy.html' },
    { name: 'terms', url: '/terms.html' },
    { name: '404', url: '/404.html' }
];

const SCROLL_POSITIONS = [0, 20, 40, 60, 80, 100, 150, 200, 300, 400, 600, 800, 1600];

async function runRegressionSuite() {
    console.log('Starting Regression QA Test Suite...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        protocolTimeout: 120000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const report = {
        test1_laptops: [],
        test2_secondaryPages: [],
        test3_laptopHomePill: [],
        test4_compact: [],
        test5_errors: []
    };

    // ==========================================
    // TEST 1: Laptop Detection & Frame Animation
    // ==========================================
    console.log('\n--- TEST 1: Laptop Home Page Animation & Loader ---');
    for (const vp of LAPTOP_VIEWPORTS) {
        const context = await browser.createBrowserContext();
        const page = await context.newPage();
        await page.setCacheEnabled(false);
        await page.setViewport({
            width: vp.width,
            height: vp.height,
            isMobile: false,
            hasTouch: false
        });

        const frameRequests = [];
        const consoleErrors = [];
        page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
        page.on('request', req => {
            const url = req.url();
            if (url.includes('/frames/')) frameRequests.push(url);
        });

        await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
        
        // Wait for loader
        let loaderShown = false;
        try {
            loaderShown = await page.evaluate(() => {
                const loader = document.getElementById('xb-loader');
                return !!loader && window.getComputedStyle(loader).display !== 'none';
            });
            await page.waitForFunction(() => !document.getElementById('xb-loader') || document.getElementById('xb-loader').classList.contains('xb-hide'), { timeout: 10000 });
        } catch (e) {}

        await new Promise(r => setTimeout(r, 600));

        const checks = await page.evaluate(() => {
            const isCompactClass = document.documentElement.classList.contains('is-compact');
            const canvas = document.getElementById('animation-canvas');
            const canvasVisible = canvas && window.getComputedStyle(canvas).display !== 'none';
            const bodyBg = window.getComputedStyle(document.body).backgroundImage;
            return { isCompactClass, canvasVisible, bodyBg };
        });

        const screenPath = path.join(OUT_DIR, `laptop-home-${vp.name}.png`);
        await page.screenshot({ path: screenPath });

        const result = {
            viewport: vp.name,
            isCompactAbsent: !checks.isCompactClass,
            canvasVisible: checks.canvasVisible,
            framesCount: frameRequests.length,
            loaderShownOnce: loaderShown,
            consoleErrors: consoleErrors.length > 0 ? consoleErrors.join('; ') : 'None'
        };
        report.test1_laptops.push(result);
        console.log(`[TEST 1] ${vp.name}: isCompactAbsent=${result.isCompactAbsent}, canvasVisible=${result.canvasVisible}, framesLoaded=${result.framesCount}, loaderShown=${result.loaderShownOnce}`);

        await context.close();
    }

    // ==========================================
    // TEST 2: Laptop Secondary Pages Top-Nav & Logo
    // ==========================================
    console.log('\n--- TEST 2: Laptop Secondary Pages Header Clickability ---');
    const laptopVp = { width: 1440, height: 900 };
    const secContext = await browser.createBrowserContext();

    for (const p of SECONDARY_PAGES) {
        const page = await secContext.newPage();
        await page.setCacheEnabled(false);
        await page.setViewport({ width: laptopVp.width, height: laptopVp.height, isMobile: false, hasTouch: false });
        
        const consoleErrors = [];
        page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

        await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 400));

        const clickCheck = await page.evaluate(() => {
            function checkHit(selector) {
                const el = document.querySelector(selector);
                if (!el || window.getComputedStyle(el).display === 'none') return { found: false };
                const r = el.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                const topElem = document.elementFromPoint(cx, cy);
                const isClickable = topElem && (el.contains(topElem) || topElem === el);
                return {
                    found: true,
                    tag: topElem ? topElem.tagName : null,
                    className: topElem ? topElem.className : null,
                    isClickable
                };
            }

            const logo = checkHit('.header-logo') || checkHit('.logo');
            const cta = checkHit('.header-cta');
            const links = Array.from(document.querySelectorAll('.top-nav a, .nav-links a'))
                .filter(a => {
                    const style = window.getComputedStyle(a);
                    const r = a.getBoundingClientRect();
                    return style.display !== 'none' && style.visibility !== 'hidden' && r.width > 0 && r.height > 0;
                })
                .map(a => {
                    const r = a.getBoundingClientRect();
                    const cx = r.left + r.width / 2;
                    const cy = r.top + r.height / 2;
                    const topElem = document.elementFromPoint(cx, cy);
                    return {
                        text: a.innerText.trim(),
                        href: a.getAttribute('href'),
                        isClickable: topElem && (a.contains(topElem) || topElem === a)
                    };
                });

            return { logo, cta, links };
        });

        const allLinksClickable = clickCheck.links.length > 0 && clickCheck.links.every(l => l.isClickable);
        const passed = clickCheck.logo.isClickable && (!clickCheck.cta.found || clickCheck.cta.isClickable) && allLinksClickable;

        report.test2_secondaryPages.push({
            page: p.name,
            logoClickable: clickCheck.logo.isClickable,
            ctaClickable: clickCheck.cta.found ? clickCheck.cta.isClickable : 'N/A',
            navLinksClickable: allLinksClickable ? 'All Clickable' : 'Failed',
            passed
        });
        console.log(`[TEST 2] ${p.name}: Logo=${clickCheck.logo.isClickable}, Links=${allLinksClickable ? 'PASS' : 'FAIL'}, CTA=${clickCheck.cta.isClickable}`);

        await page.close();
    }
    await secContext.close();

    // ==========================================
    // TEST 3: Laptop Home Floating Pill Navigation
    // ==========================================
    console.log('\n--- TEST 3: Laptop Home Pill Toolbar Click Matrix across 13 Scroll Positions ---');
    const pillContext = await browser.createBrowserContext();
    const pillPage = await pillContext.newPage();
    await pillPage.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });
    await pillPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await pillPage.waitForFunction(() => !document.getElementById('xb-loader') || document.getElementById('xb-loader').classList.contains('xb-hide'), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    for (const scrollY of SCROLL_POSITIONS) {
        await pillPage.evaluate((y) => window.scrollTo(0, y), scrollY);
        await new Promise(r => setTimeout(r, 120));

        const check = await pillPage.evaluate((scrollY) => {
            const items = Array.from(document.querySelectorAll('#main-nav a'));
            const cta = document.querySelector('.header-cta');
            
            const itemResults = items.map(el => {
                const r = el.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                const topEl = document.elementFromPoint(cx, cy);
                return {
                    text: el.innerText.trim(),
                    isClickable: topEl && (el.contains(topEl) || topEl === el)
                };
            });

            let ctaClickable = true;
            if (cta) {
                const r = cta.getBoundingClientRect();
                const topEl = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                ctaClickable = topEl && (cta.contains(topEl) || topEl === cta);
            }

            return {
                scrollY,
                allPillClickable: itemResults.every(i => i.isClickable),
                ctaClickable
            };
        }, scrollY);

        report.test3_laptopHomePill.push(check);
        console.log(`[TEST 3] Scroll ${scrollY}px: Pill=${check.allPillClickable ? 'PASS' : 'FAIL'}, CTA=${check.ctaClickable ? 'PASS' : 'FAIL'}`);
    }
    await pillContext.close();

    // ==========================================
    // TEST 4: Phone & Tablet Stills, Drawer, Secondary Pages
    // ==========================================
    console.log('\n--- TEST 4: Compact Devices (Phones & Tablets) ---');
    for (const vp of COMPACT_VIEWPORTS) {
        const compactCtx = await browser.createBrowserContext();
        
        // 4a: Home Page check
        const homePage = await compactCtx.newPage();
        await homePage.setCacheEnabled(false);
        await homePage.setViewport({
            width: vp.width,
            height: vp.height,
            isMobile: true,
            hasTouch: true
        });

        const frameReqs = [];
        homePage.on('request', req => {
            const url = req.url();
            if (url.includes('/frames/') || url.includes('/frames_phone/') || url.includes('/frames_tablet/')) {
                frameReqs.push(url);
            }
        });

        await homePage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 400));

        const homeState = await homePage.evaluate(() => {
            const isCompact = document.documentElement.classList.contains('is-compact');
            const loader = document.getElementById('xb-loader');
            const loaderVisible = loader && window.getComputedStyle(loader).display !== 'none';
            const canvas = document.getElementById('animation-canvas');
            const canvasHidden = !canvas || window.getComputedStyle(canvas).display === 'none';
            const bodyBg = window.getComputedStyle(document.body, '::before').backgroundImage;
            return { isCompact, loaderVisible, canvasHidden, bodyBg };
        });

        // Test Drawer on Home
        const homeDrawer = await homePage.evaluate(() => {
            const menuBtn = document.getElementById('mobile-menu-btn');
            const drawer = document.getElementById('mobile-drawer');
            const closeBtn = document.getElementById('drawer-close-btn');

            if (!menuBtn || !drawer) return false;
            menuBtn.click();
            const opened = drawer.classList.contains('open');
            if (closeBtn) closeBtn.click();
            const closed = !drawer.classList.contains('open');
            return opened && closed;
        });

        const homeShot = path.join(OUT_DIR, `compact-home-${vp.name}.png`);
        await homePage.screenshot({ path: homeShot });
        await homePage.close();

        // 4b: Test Secondary page (e.g. Services) for Drawer and Logo navigation
        const secPage = await compactCtx.newPage();
        await secPage.setViewport({ width: vp.width, height: vp.height, isMobile: true, hasTouch: true });
        await secPage.goto(`${BASE_URL}/services.html`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 400));

        const secDrawerAndLogo = await secPage.evaluate(() => {
            const logo = document.querySelector('.header-logo');
            let logoClickable = false;
            if (logo) {
                const r = logo.getBoundingClientRect();
                const elem = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                logoClickable = elem && (logo.contains(elem) || elem === logo);
            }

            const menuBtn = document.getElementById('mobile-menu-btn');
            const drawer = document.getElementById('mobile-drawer');
            const closeBtn = document.getElementById('drawer-close-btn');

            let drawerWorks = false;
            if (menuBtn && drawer) {
                menuBtn.click();
                const opened = drawer.classList.contains('open');
                if (closeBtn) closeBtn.click();
                const closed = !drawer.classList.contains('open');
                drawerWorks = opened && closed;
            }

            return { logoClickable, drawerWorks };
        });

        const secShot = path.join(OUT_DIR, `compact-services-${vp.name}.png`);
        await secPage.screenshot({ path: secShot });
        await secPage.close();

        report.test4_compact.push({
            viewport: vp.name,
            isCompact: homeState.isCompact,
            framesRequested: frameReqs.length,
            noLoader: !homeState.loaderVisible,
            canvasHidden: homeState.canvasHidden,
            homeDrawer: homeDrawer,
            secondaryLogoClickable: secDrawerAndLogo.logoClickable,
            secondaryDrawer: secDrawerAndLogo.drawerWorks
        });

        console.log(`[TEST 4] ${vp.name}: isCompact=${homeState.isCompact}, frames=${frameReqs.length}, loaderShown=${homeState.loaderVisible}, homeDrawer=${homeDrawer}, secLogo=${secDrawerAndLogo.logoClickable}, secDrawer=${secDrawerAndLogo.drawerWorks}`);

        await compactCtx.close();
    }

    fs.writeFileSync(path.join(OUT_DIR, 'regression-report.json'), JSON.stringify(report, null, 2));
    console.log('\nAll Regression Tests Finished! Report saved to qa-screenshots/regression/regression-report.json');

    await browser.close();
}

runRegressionSuite().catch(console.error);
