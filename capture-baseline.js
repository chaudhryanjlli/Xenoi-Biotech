const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8000';
const OUT_DIR = path.join(__dirname, 'qa-screenshots', 'combined', 'before');

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

async function capture() {
    console.log('Capturing baseline screenshots...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const baselineData = {
        tabs: [],
        timestamp: new Date().toISOString()
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
            await page.setViewport(vp);
            const url = pageName === 'index' ? `${BASE_URL}/` : `${BASE_URL}/${pageName}.html`;
            await page.goto(url, { waitUntil: 'networkidle0' });
            await new Promise(r => setTimeout(r, 400));
            await page.screenshot({ path: path.join(OUT_DIR, `mobile-${pageName}-${vp.name}.png`), fullPage: false });
            await page.close();
        }
    }

    // 2. Desktop Tab Pages Measurements (career-navigator, internships, collaboration)
    const desktopViewports = [
        { name: '1100x700', width: 1100, height: 700 },
        { name: '1280x720', width: 1280, height: 720 },
        { name: '1366x768', width: 1366, height: 768 },
        { name: '1440x900', width: 1440, height: 900 },
        { name: '1920x1080', width: 1920, height: 1080 },
        { name: '2560x1440', width: 2560, height: 1440 }
    ];

    const tabPages = ['career-navigator', 'internships', 'collaboration'];
    for (const vp of desktopViewports) {
        for (const pageName of tabPages) {
            const page = await browser.newPage();
            await page.setViewport({ width: vp.width, height: vp.height, isMobile: false, hasTouch: false });
            await page.goto(`${BASE_URL}/${pageName}.html`, { waitUntil: 'networkidle0' });
            await new Promise(r => setTimeout(r, 300));

            const metrics = await page.evaluate(() => {
                const el = document.querySelector('.segmented-control');
                const tab = document.querySelector('.segmented-tab');
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
                    rightLE50vw: rect.right <= window.innerWidth * 0.5
                };
            });

            baselineData.tabs.push({ vp: vp.name, page: pageName, metrics });
            await page.screenshot({ path: path.join(OUT_DIR, `tab-${pageName}-${vp.name}.png`) });
            await page.close();
        }
    }

    // 3. Desktop Secondary pages top bar screenshots & Home page
    for (const vp of [{ name: '1366x768', width: 1366, height: 768 }, { name: '1440x900', width: 1440, height: 900 }, { name: '1920x1080', width: 1920, height: 1080 }]) {
        for (const pageName of ALL_PAGES) {
            const page = await browser.newPage();
            await page.setViewport({ width: vp.width, height: vp.height, isMobile: false, hasTouch: false });
            const url = pageName === 'index' ? `${BASE_URL}/` : `${BASE_URL}/${pageName}.html`;
            await page.goto(url, { waitUntil: 'networkidle0' });
            await new Promise(r => setTimeout(r, 1200)); // wait for loader to fade on home
            await page.screenshot({ path: path.join(OUT_DIR, `desktop-${pageName}-${vp.name}-scroll0.png`) });
            await page.evaluate(() => window.scrollTo(0, 300));
            await new Promise(r => setTimeout(r, 300));
            await page.screenshot({ path: path.join(OUT_DIR, `desktop-${pageName}-${vp.name}-scroll300.png`) });
            await page.close();
        }
    }

    fs.writeFileSync(path.join(OUT_DIR, 'baseline-metrics.json'), JSON.stringify(baselineData, null, 2));
    console.log('Baseline captured successfully!');
    await browser.close();
}

capture().catch(err => { console.error(err); process.exit(1); });
