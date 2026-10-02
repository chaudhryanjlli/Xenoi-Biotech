const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCROLL_POSITIONS = [0, 20, 40, 60, 80, 100, 150, 200, 300, 400, 600, 800, 1600];
const RESOLUTIONS = [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 }
];

async function main() {
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] });
    const allResults = [];

    for (const res of RESOLUTIONS) {
        console.log(`\n=== Testing Resolution ${res.width}x${res.height} ===`);
        const page = await browser.newPage();
        await page.setViewport(res);
        await page.goto('http://localhost:8000/', { waitUntil: 'domcontentloaded' });
        
        // Wait for loader to be gone
        await page.waitForFunction(() => !document.getElementById('xb-loader') || document.getElementById('xb-loader').classList.contains('xb-hide'), { timeout: 10000 });
        await new Promise(r => setTimeout(r, 600));

        for (const scrollY of SCROLL_POSITIONS) {
            await page.evaluate((y) => window.scrollTo(0, y), scrollY);
            // wait for transition/scroll
            await new Promise(r => setTimeout(r, 150));
            
            const check = await page.evaluate((scrollY) => {
                const nav = document.getElementById('main-nav');
                const cta = document.querySelector('.header-cta');
                const heroContainer = document.querySelector('.hero-container');
                const header = document.querySelector('.site-header') || document.querySelector('.header');
                
                const items = Array.from(document.querySelectorAll('#main-nav a'));
                const navStyles = window.getComputedStyle(nav);
                const headerStyles = header ? window.getComputedStyle(header) : null;
                const heroStyles = heroContainer ? window.getComputedStyle(heroContainer) : null;
                
                const itemResults = items.map(el => {
                    const r = el.getBoundingClientRect();
                    const cx = r.left + r.width / 2;
                    const cy = r.top + r.height / 2;
                    const elem = document.elementFromPoint(cx, cy);
                    const isHit = elem && (el.contains(elem) || elem === el);
                    return {
                        text: el.innerText.trim(),
                        cx: Math.round(cx),
                        cy: Math.round(cy),
                        hitTag: elem ? elem.tagName : null,
                        hitId: elem ? elem.id : null,
                        hitClass: elem ? elem.className : null,
                        isHit
                    };
                });
                
                let ctaResult = null;
                if (cta) {
                    const r = cta.getBoundingClientRect();
                    const cx = r.left + r.width / 2;
                    const cy = r.top + r.height / 2;
                    const elem = document.elementFromPoint(cx, cy);
                    const isHit = elem && (cta.contains(elem) || elem === cta);
                    ctaResult = {
                        text: 'Start a conversation',
                        cx: Math.round(cx),
                        cy: Math.round(cy),
                        hitTag: elem ? elem.tagName : null,
                        hitId: elem ? elem.id : null,
                        hitClass: elem ? elem.className : null,
                        isHit
                    };
                }
                
                return {
                    scrollY,
                    navTop: navStyles.top,
                    navZ: navStyles.zIndex,
                    navPointerEvents: navStyles.pointerEvents,
                    headerZ: headerStyles ? headerStyles.zIndex : null,
                    headerPointerEvents: headerStyles ? headerStyles.pointerEvents : null,
                    heroPointerEvents: heroStyles ? heroStyles.pointerEvents : null,
                    itemResults,
                    ctaResult
                };
            }, scrollY);
            
            allResults.push({ resolution: `${res.width}x${res.height}`, ...check });
            
            const failing = check.itemResults.filter(i => !i.isHit);
            if (failing.length > 0 || (check.ctaResult && !check.ctaResult.isHit)) {
                console.log(`[FAIL @ scroll ${scrollY}px]: navTop=${check.navTop}`, JSON.stringify(failing), JSON.stringify(check.ctaResult));
            } else {
                console.log(`[PASS @ scroll ${scrollY}px]: navTop=${check.navTop}, all items clickable`);
            }
        }
        await page.close();
    }
    
    fs.writeFileSync(path.join(__dirname, 'reproduce-pill-results.json'), JSON.stringify(allResults, null, 2));
    await browser.close();
}

main().catch(console.error);
