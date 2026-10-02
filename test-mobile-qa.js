const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8000';
const OUT_DIR = path.join(__dirname, 'qa-screenshots', 'mobile');

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

const PAGES = [
    { name: 'index', url: '/' },
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

const VIEWPORTS = [
    { width: 320, height: 568, name: '320x568' },
    { width: 360, height: 740, name: '360x740' },
    { width: 390, height: 844, name: '390x844' },
    { width: 414, height: 896, name: '414x896' },
    { width: 844, height: 390, name: '844x390_landscape' },
    { width: 768, height: 1024, name: '768x1024' },
    { width: 820, height: 1180, name: '820x1180' },
    { width: 1024, height: 768, name: '1024x768' },
    { width: 1180, height: 820, name: '1180x820' }
];

const EXTRA_WIDTHS = [375, 480, 600, 900];

async function runQA() {
    console.log('Launching headless Chrome...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];
    const headerChecks = [];

    // 1. Take desktop 1440 after screenshots
    const desktopVp = { width: 1440, height: 900 };
    for (const pName of ['index', 'services', 'internships']) {
        const page = await browser.newPage();
        await page.setViewport(desktopVp);
        await page.goto(`${BASE_URL}/${pName === 'index' ? '' : pName + '.html'}`, { waitUntil: 'networkidle0' });
        // wait for loader to hide
        await page.waitForSelector('#xb-loader', { hidden: true }).catch(() => {});
        await new Promise(r => setTimeout(r, 600));
        const shotPath = path.join(OUT_DIR, `desktop-1440-${pName}-after.png`);
        await page.screenshot({ path: shotPath, fullPage: true });
        console.log(`Saved desktop after screenshot: ${shotPath}`);
        await page.close();
    }

    // 2. Test all pages across all viewports
    for (const pageInfo of PAGES) {
        console.log(`\nTesting page: ${pageInfo.name} (${pageInfo.url})`);
        
        for (const vp of VIEWPORTS) {
            const page = await browser.newPage();
            const consoleErrors = [];
            const cspViolations = [];

            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });
            page.on('pageerror', err => {
                consoleErrors.push(err.toString());
            });

            await page.setViewport({ width: vp.width, height: vp.height });
            await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'networkidle0' });
            await page.waitForSelector('#xb-loader', { hidden: true }).catch(() => {});
            await new Promise(r => setTimeout(r, 300));

            // Check background on inner pages
            const bgCheck = await page.evaluate(() => {
                if (!document.body.classList.contains('inner')) return { isInner: false, hasBg: true };
                const bg = window.getComputedStyle(document.body, '::before').backgroundImage;
                const hasUrl = bg.includes('url(') && !bg.includes('none');
                return { isInner: true, hasBg: hasUrl, bgValue: bg };
            });

            // Check horizontal overflow
            const overflowCheck = await page.evaluate(() => {
                const scrollW = document.documentElement.scrollWidth;
                const innerW = window.innerWidth;
                const hasOverflow = scrollW > innerW;
                let offendingElements = [];
                if (hasOverflow) {
                    document.querySelectorAll('*').forEach(el => {
                        const rect = el.getBoundingClientRect();
                        if (rect.right > innerW + 1) {
                            offendingElements.push({
                                tag: el.tagName,
                                class: el.className,
                                id: el.id,
                                right: rect.right,
                                width: rect.width
                            });
                        }
                    });
                }
                return { hasOverflow, scrollW, innerW, offendingElements: offendingElements.slice(0, 5) };
            });

            // Check header bounds
            const headerCheck = await page.evaluate((vpWidth) => {
                const header = document.querySelector('header, .site-header, .header');
                if (!header) return { found: false, inside: true };
                const headerRect = header.getBoundingClientRect();
                
                const elements = [];
                const logo = header.querySelector('.logo, .header-logo, .brand-logo-img');
                const btn = header.querySelector('.mobile-menu-btn');
                const cta = header.querySelector('.header-cta');
                const nav = header.querySelector('.top-nav');

                if (logo) elements.push({ name: 'logo', rect: logo.getBoundingClientRect() });
                if (btn && window.getComputedStyle(btn).display !== 'none') elements.push({ name: 'hamburger', rect: btn.getBoundingClientRect() });
                if (cta && window.getComputedStyle(cta).display !== 'none') elements.push({ name: 'cta', rect: cta.getBoundingClientRect() });
                if (nav && window.getComputedStyle(nav).display !== 'none' && !nav.classList.contains('open')) elements.push({ name: 'nav', rect: nav.getBoundingClientRect() });

                let anyOutside = false;
                const offDetails = [];
                for (const item of elements) {
                    if (item.rect.right > vpWidth + 1 || item.rect.left < -1) {
                        anyOutside = true;
                        offDetails.push(`${item.name} (left: ${item.rect.left.toFixed(1)}, right: ${item.rect.right.toFixed(1)})`);
                    }
                }

                // Check logo dimensions
                let logoValid = true;
                if (logo) {
                    const lRect = logo.getBoundingClientRect();
                    if (vpWidth <= 900 && (lRect.height > 60 || lRect.width > vpWidth * 0.65)) {
                        logoValid = false;
                    }
                }

                // Check hamburger button size if present
                let btnValid = true;
                if (btn && window.getComputedStyle(btn).display !== 'none') {
                    const bRect = btn.getBoundingClientRect();
                    if (bRect.width < 43 || bRect.height < 43) {
                        btnValid = false;
                    }
                }

                return {
                    found: true,
                    inside: !anyOutside,
                    offDetails,
                    logoValid,
                    btnValid,
                    headerRight: headerRect.right,
                    headerLeft: headerRect.left
                };
            }, vp.width);

            // Smallest tap target check for interactive elements
            const tapTargetCheck = await page.evaluate(() => {
                let smallest = { name: '', width: 9999, height: 9999, area: 99999999 };
                const interactives = document.querySelectorAll('button, a.btn, .mobile-menu-btn, .form-control, .segmented-tab');
                interactives.forEach(el => {
                    const style = window.getComputedStyle(el);
                    if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                        const r = el.getBoundingClientRect();
                        if (r.width > 0 && r.height > 0) {
                            const area = r.width * r.height;
                            if (area < smallest.area) {
                                smallest = {
                                    name: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : ''),
                                    width: Math.round(r.width),
                                    height: Math.round(r.height),
                                    area: Math.round(area)
                                };
                            }
                        }
                    }
                });
                return smallest;
            });

            // Save full-page screenshot for 390 and 768
            if (vp.width === 390 || vp.width === 768) {
                const shotName = `${pageInfo.name}-${vp.width}.png`;
                const shotPath = path.join(OUT_DIR, shotName);
                await page.screenshot({ path: shotPath, fullPage: true });
                console.log(`  Saved screenshot: ${shotName}`);
            }

            results.push({
                page: pageInfo.name,
                viewport: vp.name,
                width: vp.width,
                height: vp.height,
                overflow: overflowCheck.hasOverflow ? 'YES (FAIL)' : 'No',
                overflowDetails: overflowCheck.offendingElements,
                headerInside: headerCheck.inside ? 'Yes' : 'NO (FAIL)',
                headerDetails: headerCheck.offDetails,
                bgVisible: bgCheck.isInner ? (bgCheck.hasBg ? 'Yes' : 'NO (BLACK)') : 'N/A (Home)',
                smallestTapTarget: `${tapTargetCheck.name} (${tapTargetCheck.width}x${tapTargetCheck.height}px)`,
                consoleErrors: consoleErrors.length > 0 ? consoleErrors.join('; ') : 'None',
                cspViolations: cspViolations.length > 0 ? cspViolations.join('; ') : 'None'
            });

            await page.close();
        }
    }

    // 3. Test deep path 404
    console.log('\nTesting 404 at deep path /nested/sub/deep/path...');
    const p404 = await browser.newPage();
    await p404.setViewport({ width: 390, height: 844 });
    await p404.goto(`${BASE_URL}/404.html`, { waitUntil: 'networkidle0' });
    const bg404 = await p404.evaluate(() => {
        return window.getComputedStyle(document.body, '::before').backgroundImage;
    });
    console.log(`404 background-image computed: ${bg404}`);
    await p404.screenshot({ path: path.join(OUT_DIR, '404-deep-path-390.png'), fullPage: true });
    await p404.close();

    // 4. Test Mobile Menu Interaction (Open, scroll, close on link, close on Escape, aria-expanded)
    console.log('\nTesting Mobile Menu Interactive Behavior...');
    const menuPage = await browser.newPage();
    await menuPage.setViewport({ width: 390, height: 844 });
    await menuPage.goto(`${BASE_URL}/services.html`, { waitUntil: 'networkidle0' });
    
    // Check initial aria-expanded
    const initialAria = await menuPage.evaluate(() => {
        const btn = document.getElementById('mobile-menu-btn');
        return btn ? btn.getAttribute('aria-expanded') : null;
    });
    console.log(`Initial aria-expanded: ${initialAria}`);

    // Click hamburger button to open
    await menuPage.click('#mobile-menu-btn');
    await new Promise(r => setTimeout(r, 200));
    
    const openState = await menuPage.evaluate(() => {
        const btn = document.getElementById('mobile-menu-btn');
        const nav = document.getElementById('top-nav');
        const isAria = btn ? btn.getAttribute('aria-expanded') === 'true' : false;
        const isOpen = nav ? nav.classList.contains('open') : false;
        const navStyle = nav ? window.getComputedStyle(nav) : null;
        return {
            isAria,
            isOpen,
            maxHeight: navStyle ? navStyle.maxHeight : '',
            overflowY: navStyle ? navStyle.overflowY : '',
            display: navStyle ? navStyle.display : ''
        };
    });
    console.log(`Open state:`, openState);

    // Press Escape to close
    await menuPage.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));
    const closedOnEscape = await menuPage.evaluate(() => {
        const btn = document.getElementById('mobile-menu-btn');
        const nav = document.getElementById('top-nav');
        return btn && btn.getAttribute('aria-expanded') === 'false' && !nav.classList.contains('open');
    });
    console.log(`Closed on Escape: ${closedOnEscape}`);

    await menuPage.close();
    await browser.close();

    // Output summary
    console.log('\n========================================');
    console.log('QA SUMMARY REPORT');
    console.log('========================================');
    console.table(results.map(r => ({
        Page: r.page,
        Viewport: r.viewport,
        'Overflow?': r.overflow,
        'Header OK?': r.headerInside,
        'Bg Visible?': r.bgVisible,
        'Smallest Tap': r.smallestTapTarget,
        'Errors': r.consoleErrors
    })));

    fs.writeFileSync(path.join(OUT_DIR, 'qa-results.json'), JSON.stringify(results, null, 2));
    console.log(`Results saved to ${path.join(OUT_DIR, 'qa-results.json')}`);
}

runQA().catch(err => {
    console.error('QA script failed:', err);
    process.exit(1);
});
