const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'qa-screenshots', 'final');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        protocolTimeout: 120000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('\n--- 1. Desktop 1440x900 After Screenshots at Scroll 0 & 300 ---');
    const dPage = await browser.newPage();
    await dPage.setViewport({ width: 1440, height: 900 });
    await dPage.goto('http://localhost:8000/', { waitUntil: 'domcontentloaded' });
    await dPage.waitForFunction(() => !document.getElementById('xb-loader') || document.getElementById('xb-loader').classList.contains('xb-hide'), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // Scroll 0
    await dPage.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 200));
    await dPage.screenshot({ path: path.join(OUT_DIR, 'desktop-1440-index-scroll-0-after.png') });
    console.log('Saved after scroll 0');

    // Scroll 300
    await dPage.evaluate(() => window.scrollTo(0, 300));
    await new Promise(r => setTimeout(r, 300));
    await dPage.screenshot({ path: path.join(OUT_DIR, 'desktop-1440-index-scroll-300-after.png') });
    console.log('Saved after scroll 300');
    await dPage.close();

    console.log('\n--- 2. Keyboard Navigation (Tab through pill & Enter on links) ---');
    const kbPage = await browser.newPage();
    await kbPage.setViewport({ width: 1440, height: 900 });
    await kbPage.goto('http://localhost:8000/', { waitUntil: 'domcontentloaded' });
    await kbPage.waitForFunction(() => !document.getElementById('xb-loader') || document.getElementById('xb-loader').classList.contains('xb-hide'), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // Focus into main nav
    await kbPage.evaluate(() => {
        const firstLink = document.querySelector('#main-nav a');
        if (firstLink) firstLink.focus();
    });

    const activeElText = await kbPage.evaluate(() => document.activeElement ? document.activeElement.innerText : null);
    console.log('Keyboard focus on first pill link:', activeElText);

    // Tab through all items
    const focusedItems = [];
    for (let i = 0; i < 6; i++) {
        const text = await kbPage.evaluate(() => document.activeElement ? document.activeElement.innerText.trim() : null);
        focusedItems.push(text);
        await kbPage.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 50));
    }
    console.log('Tabbed through pill items:', focusedItems);
    await kbPage.close();

    console.log('\n--- 3. Testing Compact Viewports (390x844, 768x1024, 844x390, 1024x768) ---');
    const compactViewports = [
        { width: 390, height: 844, name: '390x844' },
        { width: 768, height: 1024, name: '768x1024' },
        { width: 844, height: 390, name: '844x390' },
        { width: 1024, height: 768, name: '1024x768' }
    ];

    const compactResults = [];

    for (const vp of compactViewports) {
        console.log(`\nTesting ${vp.name}...`);
        const context = await browser.createBrowserContext();
        
        // Test Home Page
        const homePage = await context.newPage();
        await homePage.setCacheEnabled(false);
        await homePage.setViewport({
            width: vp.width,
            height: vp.height,
            isMobile: true,
            hasTouch: true
        });

        const networkRequests = [];
        let totalBytes = 0;
        const consoleErrors = [];
        const cspViolations = [];

        homePage.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        homePage.on('request', req => {
            networkRequests.push(req.url());
        });

        homePage.on('response', async res => {
            try {
                const buf = await res.buffer();
                totalBytes += buf.length;
            } catch (e) {}
        });

        const startTime = Date.now();
        await homePage.goto('http://localhost:8000/', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 600));

        // Check if frames or loader requested
        const frameRequests = networkRequests.filter(url => url.includes('/frames/') || url.includes('/frames_phone/') || url.includes('/frames_tablet/'));
        
        const homeChecks = await homePage.evaluate(() => {
            const isCompact = document.documentElement.classList.contains('is-compact');
            const xbSkip = document.documentElement.classList.contains('xb-skip');
            const loader = document.getElementById('xb-loader');
            const loaderDisplay = loader ? window.getComputedStyle(loader).display : 'none';
            const bodyScrollLock = document.body.style.overflow === 'hidden' || document.documentElement.classList.contains('xb-loading');
            
            // Canvas display
            const canvas = document.getElementById('animation-canvas');
            const canvasDisplay = canvas ? window.getComputedStyle(canvas).display : 'none';
            
            // Background style
            const bodyBeforeStyle = window.getComputedStyle(document.body, '::before');
            const bgImage = bodyBeforeStyle.backgroundImage;
            const bgColor = window.getComputedStyle(document.body).backgroundColor;

            return {
                isCompact,
                xbSkip,
                loaderDisplay,
                bodyScrollLock,
                canvasDisplay,
                bgImage,
                bgColor
            };
        });

        // Test Menu / Drawer
        const drawerTest = await homePage.evaluate(() => {
            const menuBtn = document.getElementById('mobile-menu-btn');
            const drawer = document.getElementById('mobile-drawer');
            const backdrop = document.getElementById('mobile-drawer-backdrop');
            const closeBtn = document.getElementById('drawer-close-btn');

            if (!menuBtn || !drawer) return 'Missing elements';

            menuBtn.click();
            const opened = drawer.classList.contains('open');
            if (closeBtn) closeBtn.click();
            const closed = !drawer.classList.contains('open');

            menuBtn.click();
            const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(event);
            const escClosed = !drawer.classList.contains('open');

            return (opened && closed && escClosed) ? 'Working (Open/Close/Escape)' : 'Partial';
        });

        // Screenshot of Index
        await homePage.screenshot({ path: path.join(OUT_DIR, `index-${vp.name}.png`) });

        // Capture Services for Tone Comparison
        const servPage = await context.newPage();
        await servPage.setCacheEnabled(false);
        await servPage.setViewport({
            width: vp.width,
            height: vp.height,
            isMobile: true,
            hasTouch: true
        });
        await servPage.goto('http://localhost:8000/services.html', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 600));

        const servChecks = await servPage.evaluate(() => {
            const bodyBeforeStyle = window.getComputedStyle(document.body, '::before');
            const bgImage = bodyBeforeStyle.backgroundImage;
            const bgColor = window.getComputedStyle(document.body).backgroundColor;
            return { bgImage, bgColor };
        });

        await servPage.screenshot({ path: path.join(OUT_DIR, `services-${vp.name}.png`) });

        compactResults.push({
            viewport: vp.name,
            totalBytes: `${(totalBytes / 1024).toFixed(1)} KB`,
            frameRequestsCount: frameRequests.length,
            frameRequests: frameRequests,
            loaderShown: homeChecks.loaderDisplay !== 'none' && !homeChecks.xbSkip,
            scrollLocked: homeChecks.bodyScrollLock,
            canvasHidden: homeChecks.canvasDisplay === 'none',
            homeBgImage: homeChecks.bgImage,
            servBgImage: servChecks.bgImage,
            homeBgColor: homeChecks.bgColor,
            servBgColor: servChecks.bgColor,
            drawerStatus: drawerTest,
            consoleErrors: consoleErrors.length > 0 ? consoleErrors.join('; ') : 'None',
            cspViolations: cspViolations.length > 0 ? cspViolations.join('; ') : 'None'
        });

        await context.close();
    }

    fs.writeFileSync(path.join(OUT_DIR, 'compact-final-results.json'), JSON.stringify(compactResults, null, 2));
    console.log('\nCompact Final Results:', JSON.stringify(compactResults, null, 2));

    await browser.close();
}

main().catch(console.error);
