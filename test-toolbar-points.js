const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] });
    
    const results = [];

    for (const res of [
        { width: 1440, height: 900 },
        { width: 1024, height: 768 },
        { width: 768, height: 1024 },
        { width: 390, height: 844 }
    ]) {
        const page = await browser.newPage();
        await page.setViewport(res);
        await page.goto('http://localhost:8000', { waitUntil: 'domcontentloaded' });
        
        // 1. Check during loader
        const during = await page.evaluate(() => {
            const logo = document.querySelector('.header-logo');
            const menuBtn = document.querySelector('.mobile-menu-btn');
            const cta = document.querySelector('.header-cta');
            
            function inspect(el) {
                if (!el || window.getComputedStyle(el).display === 'none') return null;
                const r = el.getBoundingClientRect();
                const elem = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
                return {
                    targetTag: el.tagName,
                    targetClass: el.className,
                    hitTag: elem ? elem.tagName : null,
                    hitId: elem ? elem.id : null,
                    hitClass: elem ? elem.className : null
                };
            }
            return {
                logo: inspect(logo),
                menuBtn: inspect(menuBtn),
                cta: inspect(cta)
            };
        });
        
        // 2. Wait for loader to completely disappear and remove
        await page.waitForFunction(() => !document.getElementById('xb-loader') || document.getElementById('xb-loader').classList.contains('xb-hide'), { timeout: 10000 });
        await new Promise(r => setTimeout(r, 600)); // wait for transition and remove
        
        // 3. Check after loader
        const after = await page.evaluate(() => {
            function hit(selector) {
                const el = document.querySelector(selector);
                if (!el || window.getComputedStyle(el).display === 'none') return null;
                const r = el.getBoundingClientRect();
                const elem = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
                return {
                    selector,
                    hitTag: elem ? elem.tagName : null,
                    hitId: elem ? elem.id : null,
                    hitClass: elem ? elem.className : null,
                    isClickable: !!(elem && (el.contains(elem) || elem === el))
                };
            }
            return {
                logo: hit('.header-logo'),
                menuBtn: hit('.mobile-menu-btn'),
                cta: hit('.header-cta')
            };
        });
        
        // 4. Scroll to 50% and check
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.5));
        await new Promise(r => setTimeout(r, 400));
        
        const afterScroll = await page.evaluate(() => {
            function hit(selector) {
                const el = document.querySelector(selector);
                if (!el || window.getComputedStyle(el).display === 'none') return null;
                const r = el.getBoundingClientRect();
                const elem = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
                return {
                    selector,
                    hitTag: elem ? elem.tagName : null,
                    hitId: elem ? elem.id : null,
                    hitClass: elem ? elem.className : null,
                    isClickable: !!(elem && (el.contains(elem) || elem === el))
                };
            }
            return {
                logo: hit('.header-logo'),
                menuBtn: hit('.mobile-menu-btn'),
                cta: hit('.header-cta')
            };
        });
        
        results.push({
            resolution: `${res.width}x${res.height}`,
            during,
            after,
            afterScroll
        });
        
        await page.close();
    }
    
    fs.writeFileSync(path.join(__dirname, 'qa-screenshots', 'compact', 'toolbar-button-results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
    await browser.close();
}

main().catch(console.error);
