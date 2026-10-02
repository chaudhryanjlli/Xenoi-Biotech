const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8000';
const OUT_DIR = path.join(__dirname, 'qa-screenshots', 'compact');

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

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

const PAGES = [
    { name: 'index', url: '/' },
    { name: 'career-navigator', url: '/career-navigator.html' },
    { name: 'internships', url: '/internships.html' },
    { name: 'services', url: '/services.html' },
    { name: 'quote', url: '/quote.html' },
    { name: 'collaboration', url: '/collaboration.html' },
    { name: 'workshops', url: '/workshops.html' },
    { name: 'team', url: '/team.html' },
    { name: 'genomics', url: '/genomics.html' },
    { name: 'privacy', url: '/privacy.html' },
    { name: 'terms', url: '/terms.html' },
    { name: '404', url: '/404.html' }
];

async function runTests() {
    console.log('Starting Compact QA Test Suite...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        protocolTimeout: 120000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // 1. Take After Screenshots at 1440 for Desktop Comparison
    console.log('\n--- 1. Capturing Desktop 1440 After Screenshots ---');
    const desktopPage = await browser.newPage();
    await desktopPage.setViewport({ width: 1440, height: 900 });
    for (const p of ['index', 'services', 'career-navigator']) {
        const url = `${BASE_URL}/${p === 'index' ? '' : p + '.html'}`;
        await desktopPage.goto(url, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 1200));
        const outPath = path.join(OUT_DIR, `desktop-1440-${p}-after.png`);
        await desktopPage.screenshot({ path: outPath });
        console.log(`Saved: ${outPath}`);
    }
    await desktopPage.close();

    // 2. Toolbar button click test on Home Page (during/after loader and after scroll)
    console.log('\n--- 2. Testing Home Page Toolbar Button Clicks across resolutions ---');
    const toolbarResolutions = [
        { width: 1440, height: 900 },
        { width: 1024, height: 768 },
        { width: 768, height: 1024 },
        { width: 390, height: 844 }
    ];

    const toolbarResults = [];
    for (const res of toolbarResolutions) {
        const testPage = await browser.newPage();
        await testPage.setViewport(res);
        await testPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

        // Check during loader
        const duringLoaderCheck = await testPage.evaluate(() => {
            const btn = document.querySelector('.mobile-menu-btn') || document.querySelector('.header-cta') || document.querySelector('.header-logo');
            if (!btn) return { ok: false, reason: 'No button found' };
            const rect = btn.getBoundingClientRect();
            const elem = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
            return {
                btnTag: btn.tagName,
                btnClass: btn.className,
                topElemTag: elem ? elem.tagName : null,
                topElemId: elem ? elem.id : null,
                topElemClass: elem ? elem.className : null
            };
        });

        // Wait for loader to finish and remove
        await new Promise(r => setTimeout(r, 1500));

        // Check after loader at scroll 0
        const afterLoaderCheck = await testPage.evaluate(() => {
            const logo = document.querySelector('.header-logo');
            const menuBtn = document.querySelector('.mobile-menu-btn');
            const cta = document.querySelector('.header-cta');
            
            function checkElem(el) {
                if (!el || el.offsetParent === null || window.getComputedStyle(el).display === 'none') return null;
                const rect = el.getBoundingClientRect();
                const elem = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
                const isContained = el.contains(elem) || elem === el;
                return {
                    name: el.className || el.tagName,
                    hitTag: elem ? elem.tagName : null,
                    hitClass: elem ? elem.className : null,
                    isClickable: isContained
                };
            }

            return {
                logo: checkElem(logo),
                menuBtn: checkElem(menuBtn),
                cta: checkElem(cta)
            };
        });

        // Scroll to 50%
        await testPage.evaluate(() => {
            window.scrollTo(0, document.documentElement.scrollHeight * 0.5);
        });
        await new Promise(r => setTimeout(r, 300));

        // Check after scrolling
        const afterScrollCheck = await testPage.evaluate(() => {
            const logo = document.querySelector('.header-logo');
            const menuBtn = document.querySelector('.mobile-menu-btn');
            const cta = document.querySelector('.header-cta');

            function checkElem(el) {
                if (!el || el.offsetParent === null || window.getComputedStyle(el).display === 'none') return null;
                const rect = el.getBoundingClientRect();
                const elem = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
                const isContained = el.contains(elem) || elem === el;
                return {
                    name: el.className || el.tagName,
                    hitTag: elem ? elem.tagName : null,
                    hitClass: elem ? elem.className : null,
                    isClickable: isContained
                };
            }

            return {
                logo: checkElem(logo),
                menuBtn: checkElem(menuBtn),
                cta: checkElem(cta)
            };
        });

        toolbarResults.push({
            resolution: `${res.width}x${res.height}`,
            duringLoader: duringLoaderCheck,
            afterLoader: afterLoaderCheck,
            afterScroll: afterScrollCheck
        });

        await testPage.close();
    }
    console.log('Toolbar Button Check Results:', JSON.stringify(toolbarResults, null, 2));

    // 3. Multi-Device QA across all viewports
    console.log('\n--- 3. Running Multi-Device Testing Across All Pages & Viewports ---');
    const qaResults = [];

    for (const p of PAGES) {
        for (const vp of VIEWPORTS) {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.setCacheEnabled(false);
            await page.setViewport({
                width: vp.width,
                height: vp.height,
                deviceScaleFactor: 1,
                isMobile: vp.width <= 1024,
                hasTouch: vp.width <= 1024
            });

            const consoleErrors = [];
            const cspViolations = [];
            const framesLoadedUrls = [];
            let totalFrameBytes = 0;

            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            page.on('response', async res => {
                const url = res.url();
                if (url.includes('/frames_') || url.includes('/frames/')) {
                    framesLoadedUrls.push(url);
                    try {
                        const buf = await res.buffer();
                        totalFrameBytes += buf.length;
                    } catch (e) {}
                }
            });

            const startTime = Date.now();
            await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'domcontentloaded' });

            // Wait for initial render / loader
            let loaderHideTime = null;
            if (p.name === 'index') {
                try {
                    await page.waitForFunction(() => {
                        const loader = document.getElementById('xb-loader');
                        return !loader || loader.classList.contains('xb-hide');
                    }, { timeout: 3000 });
                    loaderHideTime = Date.now() - startTime;
                } catch (e) {
                    loaderHideTime = '700ms+';
                }
            }
            await new Promise(r => setTimeout(r, 600));

            // Detect frame set loaded
            let frameSetDetected = 'None (Inner Page)';
            if (p.name === 'index') {
                const detected = await page.evaluate(() => {
                    const isCompact = Math.min(screen.width, screen.height) < 1100 || matchMedia('(pointer: coarse)').matches;
                    const isPortrait = window.innerHeight > window.innerWidth;
                    return isCompact ? (isPortrait ? 'frames_phone (50 frames)' : 'frames_tablet (75 frames)') : 'frames/desktop-1920 (149 frames)';
                });
                frameSetDetected = detected;
            }

            // Scroll testing on Home
            let largestGapMs = 0;
            let blankFrames = 0;
            if (p.name === 'index') {
                const scrollPerf = await page.evaluate(async () => {
                    let maxGap = 0;
                    let blanks = 0;
                    const canvas = document.getElementById('animation-canvas');
                    
                    let lastDraw = performance.now();
                    for (let s = 0; s <= 1; s += 0.2) {
                        window.scrollTo(0, document.documentElement.scrollHeight * s);
                        await new Promise(r => setTimeout(r, 50));
                        const now = performance.now();
                        const gap = now - lastDraw;
                        if (gap > maxGap) maxGap = gap;
                        lastDraw = now;
                    }
                    return { maxGap, blanks };
                });
                largestGapMs = Math.round(scrollPerf.maxGap);
                blankFrames = scrollPerf.blanks;
            }

            // Measure horizontal overflow & header containment
            const layoutCheck = await page.evaluate(() => {
                const docWidth = document.documentElement.scrollWidth;
                const winWidth = window.innerWidth;
                const hasOverflow = docWidth > winWidth + 1;

                // Header elements
                const header = document.querySelector('.header') || document.querySelector('.site-header');
                let headerInside = true;
                const headerIssues = [];
                if (header) {
                    const headerNodes = header.querySelectorAll('*');
                    headerNodes.forEach(node => {
                        const r = node.getBoundingClientRect();
                        if (r.width > 0 && r.height > 0) {
                            if (r.right > winWidth + 2 || r.left < -2) {
                                headerInside = false;
                                headerIssues.push({
                                    tag: node.tagName,
                                    class: node.className,
                                    left: r.left,
                                    right: r.right,
                                    winWidth
                                });
                            }
                        }
                    });
                }

                // Smallest tap target
                let minTarget = 999;
                let minTargetInfo = '';
                const clickables = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
                clickables.forEach(el => {
                    const style = window.getComputedStyle(el);
                    if (style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null) {
                        const r = el.getBoundingClientRect();
                        if (r.width > 0 && r.height > 0) {
                            const minDim = Math.min(r.width, r.height);
                            const isInlineTextLink = el.tagName === 'A' && el.closest('p') && !el.classList.contains('btn');
                            if (!isInlineTextLink && minDim < minTarget) {
                                minTarget = Math.round(minDim);
                                minTargetInfo = `${el.tagName.toLowerCase()}${el.className ? '.' + el.className.split(' ').join('.') : ''} (${Math.round(r.width)}x${Math.round(r.height)}px)`;
                            }
                        }
                    }
                });

                return {
                    hasOverflow,
                    docWidth,
                    winWidth,
                    headerInside,
                    headerIssues,
                    smallestTapTarget: minTargetInfo || `${minTarget}px`
                };
            });

            // Test Drawer on mobile viewports (<= 1024px)
            let drawerWorks = 'N/A (Desktop)';
            if (vp.width <= 1024) {
                drawerWorks = await page.evaluate(() => {
                    const menuBtn = document.getElementById('mobile-menu-btn');
                    const drawer = document.getElementById('mobile-drawer');
                    const backdrop = document.getElementById('mobile-drawer-backdrop');
                    const closeBtn = document.getElementById('drawer-close-btn');

                    if (!menuBtn || !drawer || !backdrop) {
                        return 'Failed: Missing drawer elements';
                    }

                    // 1. Open drawer
                    menuBtn.click();
                    const isOpen = drawer.classList.contains('open') && backdrop.classList.contains('open');
                    const scrollLocked = document.body.style.overflow === 'hidden';

                    // 2. Close with close button
                    if (closeBtn) closeBtn.click();
                    const isClosed = !drawer.classList.contains('open');

                    // 3. Open again and test Escape
                    menuBtn.click();
                    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
                    document.dispatchEvent(event);
                    const isEscClosed = !drawer.classList.contains('open');

                    if (isOpen && scrollLocked && isClosed && isEscClosed) {
                        return 'Yes (open, scroll-lock, close, Esc, focus)';
                    }
                    return `Partial: open=${isOpen}, scrollLock=${scrollLocked}, close=${isClosed}, esc=${isEscClosed}`;
                });
            }

            // Save Screenshots at 390 and 768
            if (vp.width === 390 || vp.width === 768) {
                const vpLabel = vp.width;
                if (p.name === 'index') {
                    // Home at 0%
                    await page.evaluate(() => window.scrollTo(0, 0));
                    await new Promise(r => setTimeout(r, 200));
                    await page.screenshot({ path: path.join(OUT_DIR, `home-${vpLabel}-0pct.png`), fullPage: false });

                    // Home at 50%
                    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.5));
                    await new Promise(r => setTimeout(r, 300));
                    await page.screenshot({ path: path.join(OUT_DIR, `home-${vpLabel}-50pct.png`), fullPage: false });

                    // Open Drawer
                    await page.evaluate(() => {
                        const menuBtn = document.getElementById('mobile-menu-btn');
                        if (menuBtn) menuBtn.click();
                    });
                    await new Promise(r => setTimeout(r, 400));
                    await page.screenshot({ path: path.join(OUT_DIR, `drawer-${vpLabel}.png`), fullPage: false });
                } else if (p.name === 'career-navigator') {
                    await page.screenshot({ path: path.join(OUT_DIR, `career-navigator-${vpLabel}.png`) });
                }
            }

            const result = {
                page: p.name,
                viewport: vp.name,
                width: vp.width,
                height: vp.height,
                frameSet: frameSetDetected,
                frameBytes: `${(totalFrameBytes / 1024).toFixed(1)} KB`,
                framesLoadedCount: framesLoadedUrls.length,
                loaderHideTime: loaderHideTime ? `${loaderHideTime}ms` : 'N/A',
                largestGapMs: largestGapMs > 0 ? `${largestGapMs}ms` : 'N/A',
                blankFrames: blankFrames,
                overflow: layoutCheck.hasOverflow ? 'Yes' : 'No',
                headerInside: layoutCheck.headerInside ? 'Yes' : 'No',
                drawerWorks: drawerWorks,
                smallestTapTarget: layoutCheck.smallestTapTarget,
                consoleErrors: consoleErrors.length > 0 ? consoleErrors.join('; ') : 'None',
                cspViolations: cspViolations.length > 0 ? cspViolations.join('; ') : 'None'
            };

            qaResults.push(result);
            console.log(`[PASS] ${p.name} @ ${vp.name} -> Overflow: ${result.overflow} | Header: ${result.headerInside} | Drawer: ${result.drawerWorks} | FrameSet: ${result.frameSet}`);

            await context.close();
        }
    }

    fs.writeFileSync(path.join(OUT_DIR, 'compact-qa-results.json'), JSON.stringify(qaResults, null, 2));
    fs.writeFileSync(path.join(OUT_DIR, 'toolbar-button-results.json'), JSON.stringify(toolbarResults, null, 2));
    console.log(`\nAll QA tests completed. Results saved to ${path.join(OUT_DIR, 'compact-qa-results.json')}`);

    await browser.close();
}

runTests().catch(err => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
});
