const puppeteer = require('puppeteer-core');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto('http://localhost:8000/', { waitUntil: 'networkidle2' });
    
    // Wait for loader to be dismissed
    await page.waitForFunction(() => {
        const loader = document.getElementById('xb-loader');
        return !loader || loader.classList.contains('xb-hide') || getComputedStyle(loader).display === 'none';
    }, { timeout: 15000 });
    await new Promise(r => setTimeout(r, 600));
    
    const info = await page.evaluate(() => {
        const el = document.querySelector('#main-nav a[href="services.html"]');
        const r = el.getBoundingClientRect();
        const topEl = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
            topElTag: topEl ? topEl.tagName : null,
            topElClass: topEl ? topEl.className : null,
            isHit: topEl && (el.contains(topEl) || topEl === el)
        };
    });
    console.log('Element info:', info);
    
    const [response] = await Promise.all([
        page.waitForNavigation({ timeout: 5000 }).catch(e => e.message),
        page.mouse.click(info.x, info.y)
    ]);
    console.log('Nav result:', response, 'Current URL:', page.url());
    await browser.close();
})();
