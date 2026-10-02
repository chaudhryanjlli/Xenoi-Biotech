const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8000';
const OUT_DIR = path.join(__dirname, 'qa-screenshots', 'combined', 'after');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function testTabBars() {
    console.log('=== TEST SUITE 1: TAB BARS & DESKTOP SECONDARY PAGES ===');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const baselineData = JSON.parse(fs.readFileSync(path.join(__dirname, 'qa-screenshots', 'combined', 'before', 'baseline-metrics.json'), 'utf8'));
    const desktopViewports = [
        { name: '1100x700', width: 1100, height: 700 },
        { name: '1280x720', width: 1280, height: 720 },
        { name: '1366x768', width: 1366, height: 768 },
        { name: '1440x900', width: 1440, height: 900 },
        { name: '1920x1080', width: 1920, height: 1080 },
        { name: '2560x1440', width: 2560, height: 1440 }
    ];

    const tabPages = ['career-navigator', 'internships', 'collaboration'];
    const results = [];

    for (const vp of desktopViewports) {
        for (const pageName of tabPages) {
            const page = await browser.newPage();
            const consoleErrors = [];
            page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
            page.on('pageerror', err => consoleErrors.push(err.message));

            await page.setViewport({ width: vp.width, height: vp.height, isMobile: false, hasTouch: false });
            await page.goto(`${BASE_URL}/${pageName}.html`, { waitUntil: 'networkidle0' });
            await new Promise(r => setTimeout(r, 200));

            const afterMetrics = await page.evaluate(() => {
                const el = document.querySelector('.segmented-control');
                const tab = document.querySelector('.segmented-tab');
                const header = document.querySelector('.site-header');
                const headerRect = header ? header.getBoundingClientRect() : { bottom: 0 };
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                const tabStyle = tab ? window.getComputedStyle(tab) : null;
                return {
                    width: rect.width,
                    height: rect.height,
                    top: rect.top,
                    right: rect.right,
                    left: rect.left,
                    fontSize: tabStyle ? tabStyle.fontSize : null,
                    padding: tabStyle ? tabStyle.padding : null,
                    gap: style.gap,
                    halfVw: window.innerWidth * 0.5,
                    rightLE50vw: rect.right <= window.innerWidth * 0.5,
                    notUnderHeader: rect.top >= headerRect.bottom
                };
            });

            // Find baseline
            const baseItem = baselineData.tabs.find(t => t.vp === vp.name && t.page === pageName);
            const baseMetrics = baseItem ? baseItem.metrics : null;

            const heightRatio = baseMetrics ? (afterMetrics.height / baseMetrics.height).toFixed(3) : 'N/A';
            const fontRatio = (baseMetrics && baseMetrics.fontSize && afterMetrics.fontSize) ? 
                (parseFloat(afterMetrics.fontSize) / parseFloat(baseMetrics.fontSize)).toFixed(3) : 'N/A';
            const widthRatio = baseMetrics ? (afterMetrics.width / baseMetrics.width).toFixed(3) : 'N/A';

            // Test Real Click on Next Tab
            const nextTabSelector = pageName === 'career-navigator' ? 'a.segmented-tab[href="internships.html"]' : 'a.segmented-tab[href="career-navigator.html"]';
            const nextTab = await page.$(nextTabSelector);
            let clickNavigated = false;
            if (nextTab) {
                const box = await nextTab.boundingBox();
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
                clickNavigated = page.url().includes(pageName === 'career-navigator' ? 'internships.html' : 'career-navigator.html');
            }

            // Keyboard navigation check
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');

            await page.screenshot({ path: path.join(OUT_DIR, `tab-${pageName}-${vp.name}.png`) });

            results.push({
                vp: vp.name,
                page: pageName,
                baseMetrics,
                afterMetrics,
                heightRatio,
                fontRatio,
                widthRatio,
                rightLE50vw: afterMetrics.rightLE50vw,
                notUnderHeader: afterMetrics.notUnderHeader,
                clickNavigated,
                consoleErrors: consoleErrors.length
            });

            console.log(`[TAB] ${pageName} @ ${vp.name}: H=${afterMetrics.height}px (ratio ${heightRatio}), W=${afterMetrics.width.toFixed(1)}px (ratio ${widthRatio}), Font=${afterMetrics.fontSize} (ratio ${fontRatio}), Right=${afterMetrics.right.toFixed(1)}px <= ${afterMetrics.halfVw}px (${afterMetrics.rightLE50vw}), Click=${clickNavigated}`);

            await page.close();
        }
    }

    fs.writeFileSync(path.join(OUT_DIR, 'tab-test-results.json'), JSON.stringify(results, null, 2));
    await browser.close();
}

testTabBars().catch(err => { console.error(err); process.exit(1); });
