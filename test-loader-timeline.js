const puppeteer = require('puppeteer-core');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto('http://localhost:8000/', { waitUntil: 'domcontentloaded' });
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 500));
        const state = await page.evaluate(() => {
            const h = document.documentElement;
            const loader = document.getElementById('xb-loader');
            return {
                hClass: h.className,
                hasLoader: !!loader,
                loaderDisplay: loader ? getComputedStyle(loader).display : null,
                loaderClass: loader ? loader.className : null
            };
        });
        console.log(`Time ${(i+1)*500}ms:`, state);
    }
    await browser.close();
})();
