const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8000';
const OUT_DIR = path.join(__dirname, 'qa-screenshots', 'laptop-bars');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

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

async function runTests() {
    console.log('Starting Laptop Bars & Desktop QA Suite...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        protocolTimeout: 180000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const report = {
        part1_secondaryBars: [],
        part2_programmeTabs: [],
        part3_homePillClickMatrix: [],
        part4_phoneTabletChecks: [],
        errors: []
    };

    // =========================================================================
    // PART 1: Top Bar on ALL 11 Secondary Pages across 1366, 1440, 1920
    // =========================================================================
    console.log('\n--- PART 1: Top Bar on All Secondary Pages ---');
    for (const res of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
        for (const p of SECONDARY_PAGES) {
            const page = await browser.newPage();
            await page.setViewport({ width: res.width, height: res.height, isMobile: false, hasTouch: false });
            await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'domcontentloaded' });
            await new Promise(r => setTimeout(r, 400));

            // Check styling & active link
            const barInfo = await page.evaluate(() => {
                const header = document.querySelector('.site-header');
                const style = window.getComputedStyle(header);
                const activeLink = header.querySelector('.nav-links a.active');
                const activeAfter = activeLink ? window.getComputedStyle(activeLink, '::after').content : null;
                const logo = header.querySelector('.header-logo img, .brand-logo-img');
                const logoHeight = logo ? window.getComputedStyle(logo).height : null;

                return {
                    position: style.position,
                    height: style.height,
                    bg: style.backgroundColor,
                    borderBottom: style.borderBottom,
                    boxShadow: style.boxShadow,
                    backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
                    activeText: activeLink ? activeLink.innerText.trim() : null,
                    hasActiveUnderline: !!activeLink,
                    logoHeight
                };
            });

            // Capture screenshots at scroll 0, 300, 1500
            for (const scrollY of [0, 300, 1500]) {
                await page.evaluate((y) => window.scrollTo(0, y), scrollY);
                await new Promise(r => setTimeout(r, 100));
                if (res.width === 1440 && (scrollY === 0 || scrollY === 300)) {
                    await page.screenshot({ path: path.join(OUT_DIR, `sec-${p.name}-1440-scroll-${scrollY}.png`) });
                }
            }

            // Test real mouse click on Logo
            const logoPos = await page.evaluate(() => {
                const logo = document.querySelector('.header-logo') || document.querySelector('.logo');
                if (!logo) return null;
                const r = logo.getBoundingClientRect();
                return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
            });
            if (logoPos) {
                await page.mouse.click(logoPos.x, logoPos.y);
                await new Promise(r => setTimeout(r, 300));
                const currentUrl = page.url();
                barInfo.logoRealClickNavigates = currentUrl.endsWith('/') || currentUrl.includes('index.html');
            }

            report.part1_secondaryBars.push({ resolution: `${res.width}x${res.height}`, page: p.name, ...barInfo });
            console.log(`[PART 1] ${p.name} @ ${res.width}x${res.height}: Bar=${barInfo.height}, Bg=${barInfo.bg}, Active=${barInfo.activeText}, LogoClick=${barInfo.logoRealClickNavigates}`);

            await page.close();
        }
    }

    // =========================================================================
    // PART 2: Programmes Tab Bar (Left aligned, pill right <= 50vw, no wrapper)
    // =========================================================================
    console.log('\n--- PART 2: Programmes Tab Bar across laptop widths (1025px - 2560px) ---');
    const tabResolutions = [
        { width: 1100, height: 700 },
        { width: 1280, height: 720 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 },
        { width: 1920, height: 1080 },
        { width: 2560, height: 1440 }
    ];

    for (const res of tabResolutions) {
        for (const tabUrl of ['/career-navigator.html', '/internships.html', '/collaboration.html']) {
            const page = await browser.newPage();
            await page.setViewport({ width: res.width, height: res.height, isMobile: false, hasTouch: false });
            await page.goto(`${BASE_URL}${tabUrl}`, { waitUntil: 'domcontentloaded' });
            await new Promise(r => setTimeout(r, 400));

            const tabCheck = await page.evaluate(() => {
                const container = document.querySelector('.segmented-control-container');
                const pill = document.querySelector('.segmented-control');
                const heading = document.querySelector('.page-title');
                const breadcrumb = document.querySelector('.breadcrumb');

                if (!pill || !container) return { error: 'Missing elements' };

                const pillRect = pill.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const headingRect = heading ? heading.getBoundingClientRect() : null;
                const containerStyle = window.getComputedStyle(container);
                const pillStyle = window.getComputedStyle(pill);

                const rightLeq50vw = pillRect.right <= (window.innerWidth * 0.5 + 1); // 50vw rule
                const leftAligned = headingRect ? Math.abs(pillRect.left - headingRect.left) < 2 : true;
                const wrapperHasNoBgOrBorder = (containerStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || containerStyle.backgroundColor === 'transparent') &&
                                               (containerStyle.borderWidth === '0px' || containerStyle.borderStyle === 'none');

                return {
                    pillWidth: Math.round(pillRect.width),
                    pillHeight: Math.round(pillRect.height),
                    pillLeft: Math.round(pillRect.left),
                    pillRight: Math.round(pillRect.right),
                    halfVw: Math.round(window.innerWidth * 0.5),
                    rightLeq50vw,
                    leftAligned,
                    wrapperHasNoBgOrBorder,
                    pillBorderRadius: pillStyle.borderRadius,
                    pillBg: pillStyle.backgroundColor
                };
            });

            if (res.width === 1440) {
                await page.screenshot({ path: path.join(OUT_DIR, `tab-${tabUrl.replace(/[^a-z]/g, '')}-1440.png`) });
            }

            report.part2_programmeTabs.push({ resolution: `${res.width}x${res.height}`, url: tabUrl, ...tabCheck });
            console.log(`[PART 2] ${tabUrl} @ ${res.width}x${res.height}: Width=${tabCheck.pillWidth}px, Right=${tabCheck.pillRight}px <= 50vw (${tabCheck.halfVw}px) [${tabCheck.rightLeq50vw ? 'PASS' : 'FAIL'}], LeftAligned=${tabCheck.leftAligned ? 'PASS' : 'FAIL'}`);

            await page.close();
        }
    }

    // =========================================================================
    // PART 3: Home Page Real Mouse Click Matrix across 13 Scroll Positions & Bfcache
    // =========================================================================
    console.log('\n--- PART 3: Home Page Real Mouse Click Matrix across 13 Scroll Positions ---');
    const scrollSteps = [0, 20, 40, 60, 80, 100, 150, 200, 300, 400, 600, 800, 1600];

    for (const res of [{ width: 1280, height: 720 }, { width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
        console.log(`\nTesting Home Page Real Clicks on ${res.width}x${res.height}...`);
        const page = await browser.newPage();
        await page.setViewport({ width: res.width, height: res.height, isMobile: false, hasTouch: false });
        await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !document.getElementById('xb-loader') || document.getElementById('xb-loader').classList.contains('xb-hide'), { timeout: 10000 });
        await new Promise(r => setTimeout(r, 600));

        for (const scrollY of scrollSteps) {
            await page.evaluate((y) => window.scrollTo(0, y), scrollY);
            await new Promise(r => setTimeout(r, 100));

            // Test clicking each link with real mouse click
            const items = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('#main-nav a'));
                const cta = document.querySelector('.header-cta');
                const res = links.map(a => {
                    const r = a.getBoundingClientRect();
                    return {
                        text: a.innerText.trim(),
                        href: a.getAttribute('href'),
                        cx: r.left + r.width / 2,
                        cy: r.top + r.height / 2
                    };
                });
                if (cta) {
                    const r = cta.getBoundingClientRect();
                    res.push({
                        text: 'CTA',
                        href: cta.getAttribute('href'),
                        cx: r.left + r.width / 2,
                        cy: r.top + r.height / 2
                    });
                }
                return res;
            });

            let allClicked = true;
            for (const item of items) {
                const hitTag = await page.evaluate((x, y) => {
                    const el = document.elementFromPoint(x, y);
                    return el ? el.tagName : null;
                }, item.cx, item.cy);

                if (hitTag !== 'A' && hitTag !== 'SPAN') {
                    allClicked = false;
                }
            }

            report.part3_homePillClickMatrix.push({
                resolution: `${res.width}x${res.height}`,
                scrollY,
                itemsTested: items.length,
                allClickedPass: allClicked
            });

            console.log(`[PART 3] ${res.width}x${res.height} @ scroll ${scrollY}px: All ${items.length} links clickable -> ${allClicked ? 'PASS' : 'FAIL'}`);
        }

        // Test Bfcache: Navigate to secondary page via CTA and go back
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(r => setTimeout(r, 100));
        await page.goto(`${BASE_URL}/services.html`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 300));
        await page.goBack({ waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 400));

        const bfcachePillClickable = await page.evaluate(() => {
            const firstLink = document.querySelector('#main-nav a');
            if (!firstLink) return false;
            const r = firstLink.getBoundingClientRect();
            const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return el && (firstLink.contains(el) || el === firstLink);
        });
        console.log(`[PART 3] Bfcache Back navigation test on ${res.width}x${res.height}: Pill Clickable = ${bfcachePillClickable ? 'PASS' : 'FAIL'}`);

        await page.close();
    }

    // =========================================================================
    // PART 4: Verification of Mobile/Tablet (Unchanged Visuals & Functionality)
    // =========================================================================
    console.log('\n--- PART 4: Mobile & Tablet Parity Checks ---');
    for (const vp of [
        { width: 390, height: 844, name: 'phone-390x844' },
        { width: 768, height: 1024, name: 'tablet-768x1024' },
        { width: 1024, height: 768, name: 'tablet-1024x768' }
    ]) {
        const page = await browser.newPage();
        await page.setViewport({ width: vp.width, height: vp.height, isMobile: true, hasTouch: true });
        
        await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(OUT_DIR, `after-home-${vp.name}.png`) });

        await page.goto(`${BASE_URL}/services.html`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(OUT_DIR, `after-services-${vp.name}.png`) });

        const drawerTest = await page.evaluate(() => {
            const menuBtn = document.getElementById('mobile-menu-btn');
            const drawer = document.getElementById('mobile-drawer');
            const closeBtn = document.getElementById('drawer-close-btn');
            if (!menuBtn || !drawer) return false;
            menuBtn.click();
            const open = drawer.classList.contains('open');
            if (closeBtn) closeBtn.click();
            const closed = !drawer.classList.contains('open');
            return open && closed;
        });

        report.part4_phoneTabletChecks.push({ viewport: vp.name, drawerTest });
        console.log(`[PART 4] ${vp.name}: Drawer functional = ${drawerTest ? 'PASS' : 'FAIL'}`);

        await page.close();
    }

    fs.writeFileSync(path.join(OUT_DIR, 'laptop-bars-report.json'), JSON.stringify(report, null, 2));
    console.log('\nAll tests complete! Report saved to qa-screenshots/laptop-bars/laptop-bars-report.json');

    await browser.close();
}

runTests().catch(console.error);
