const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const pages = ['index', 'services', 'career-navigator'];
  const outDir = path.join(__dirname, 'qa-screenshots', 'compact');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const p of pages) {
    const url = `http://localhost:8000/${p === 'index' ? '' : p + '.html'}`;
    await page.goto(url, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    const outPath = path.join(outDir, `desktop-1440-${p}-before.png`);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Saved before screenshot: ${outPath}`);
  }

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
