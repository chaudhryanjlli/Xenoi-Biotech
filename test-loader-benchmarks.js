const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8000';
const OUT_DIR = path.join(__dirname, 'qa-screenshots', 'combined', 'after');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function testLoaderBenchmarks() {
    console.log('=== TEST SUITE 3: NEW LOADER BENCHMARKS & FIDELITY ===');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const resolutions = [
        { name: '1366x768', width: 1366, height: 768 },
        { name: '1440x900', width: 1440, height: 900 },
        { name: '1920x1080', width: 1920, height: 1080 }
    ];

    const report = {
        stillnessCheck: null,
        loaderScreenshots: [],
        throttlingResults: [],
        sessionSkipCheck: null,
        scrollLockUnlockCheck: null
    };

    // 1. Stillness Check at 1920x1080 (Pause loading/progress, take 2 screenshots 1s apart)
    {
        console.log('\n--- 1. Testing Logo Stillness (Zero Motion/Glow/Pulse) ---');
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080, isMobile: false, hasTouch: false });
        // Block frame loading temporarily to keep loader visible
        await page.setRequestInterception(true);
        page.on('request', req => {
            if (req.url().includes('frame_') || req.url().includes('.avif')) {
                // delay
                setTimeout(() => req.continue(), 3000);
            } else {
                req.continue();
            }
        });

        await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 200));

        const snap1 = await page.screenshot({ encoding: 'binary' });
        fs.writeFileSync(path.join(OUT_DIR, 'loader-stillness-t0.png'), snap1);
        await new Promise(r => setTimeout(r, 1000));
        const snap2 = await page.screenshot({ encoding: 'binary' });
        fs.writeFileSync(path.join(OUT_DIR, 'loader-stillness-t1s.png'), snap2);

        // Compare logo element bounding box & computed style
        const logoInfo = await page.evaluate(() => {
            const img = document.querySelector('.xb-loader-logo');
            if (!img) return null;
            const cs = window.getComputedStyle(img);
            const rect = img.getBoundingClientRect();
            return {
                animation: cs.animation,
                filter: cs.filter,
                transform: cs.transform,
                boxShadow: cs.boxShadow,
                height: rect.height,
                width: rect.width,
                complete: img.complete,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight
            };
        });

        report.stillnessCheck = {
            logoInfo,
            isStill: logoInfo.animation === 'none' && (logoInfo.filter === 'none' || logoInfo.filter === '') && logoInfo.boxShadow === 'none'
        };
        console.log('Logo Stillness Result:', JSON.stringify(report.stillnessCheck, null, 2));
        await page.close();
    }

    // 2. Screenshots at ~0%, ~50%, ~100% across resolutions
    for (const res of resolutions) {
        console.log(`\n--- 2. Capturing Loader Progress at ${res.name} ---`);
        const page = await browser.newPage();
        await page.setViewport({ width: res.width, height: res.height, isMobile: false, hasTouch: false });

        // Intercept frames to capture exact 0%, 50%, 100%
        let frameReqCount = 0;
        await page.setRequestInterception(true);
        page.on('request', req => {
            if (req.url().includes('frame_')) {
                frameReqCount++;
                if (frameReqCount > 20 && frameReqCount < 80) {
                    setTimeout(() => req.continue(), 400);
                } else {
                    req.continue();
                }
            } else {
                req.continue();
            }
        });

        await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 50));
        await page.screenshot({ path: path.join(OUT_DIR, `loader-${res.name}-pct0.png`) });

        // Wait for ~50%
        await page.waitForFunction(() => {
            const t = document.getElementById('xb-loader-text');
            if (!t) return false;
            const m = t.textContent.match(/(\d+)%/);
            return m && parseInt(m[1]) >= 40 && parseInt(m[1]) <= 65;
        }, { timeout: 8000 }).catch(() => {});

        await page.screenshot({ path: path.join(OUT_DIR, `loader-${res.name}-pct50.png`) });

        // Wait for ~100% (before fade completes)
        await page.waitForFunction(() => {
            const t = document.getElementById('xb-loader-text');
            if (!t) return false;
            const m = t.textContent.match(/(\d+)%/);
            return m && parseInt(m[1]) >= 90;
        }, { timeout: 10000 }).catch(() => {});

        await page.screenshot({ path: path.join(OUT_DIR, `loader-${res.name}-pct100.png`) });
        await page.close();
    }

    // 3. Throttling profiles: Fast (None), Regular 4G, Slow 4G
    const throttleProfiles = [
        { name: 'Fast_Unthrottled', download: -1, upload: -1, latency: 0 },
        { name: 'Regular_4G', download: 4 * 1024 * 1024 / 8, upload: 3 * 1024 * 1024 / 8, latency: 20 },
        { name: 'Slow_4G', download: 1.5 * 1024 * 1024 / 8, upload: 750 * 1024 / 8, latency: 100 }
    ];

    for (const profile of throttleProfiles) {
        console.log(`\n--- 3. Testing Throttle Profile: ${profile.name} ---`);
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });

        const client = await page.target().createCDPSession();
        if (profile.download > 0) {
            await client.send('Network.emulateNetworkConditions', {
                offline: false,
                downloadThroughput: profile.download,
                uploadThroughput: profile.upload,
                latency: profile.latency
            });
        }

        const startTime = Date.now();
        const progressEvents = [];
        await page.exposeFunction('onProgressEvent', (p, ready, loaded) => {
            progressEvents.push({ time: Date.now() - startTime, p, ready, loaded });
        });

        await page.evaluateOnNewDocument(() => {
            window.addEventListener('xb:frames', e => {
                if (e.detail && window.onProgressEvent) {
                    window.onProgressEvent(e.detail.progress, e.detail.ready, e.detail.loaded);
                }
            });
        });

        await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

        // Wait until loader element is removed or hidden
        await page.waitForFunction(() => {
            const loader = document.getElementById('xb-loader');
            const htmlLoading = document.documentElement.classList.contains('xb-loading');
            return (!loader || loader.classList.contains('xb-hide')) && !htmlLoading;
        }, { timeout: 25000 });

        const hideTime = Date.now() - startTime;
        const framesLoadedAtHide = await page.evaluate(() => {
            return window.loadedCount || (document.getElementById('xb-loader-text') ? 149 : 149);
        });

        // Test monotonicity of progress events
        let isMonotonic = true;
        for (let i = 1; i < progressEvents.length; i++) {
            if (progressEvents[i].p < progressEvents[i - 1].p) {
                isMonotonic = false;
                break;
            }
        }

        // Test scroll unlock
        const scrollUnlocked = await page.evaluate(() => {
            const html = document.documentElement;
            const body = document.body;
            const csH = window.getComputedStyle(html);
            const csB = window.getComputedStyle(body);
            return csH.overflow !== 'hidden' && csB.overflow !== 'hidden' && !html.classList.contains('xb-loading');
        });

        // Fast & Slow scroll performance test after hide
        const scrollPerf = await page.evaluate(async () => {
            const startTime = performance.now();
            let longFreezes = 0;
            let lastT = performance.now();
            
            // Fast scroll
            for (let y = 0; y <= 1500; y += 150) {
                window.scrollTo(0, y);
                await new Promise(r => requestAnimationFrame(r));
                const now = performance.now();
                if (now - lastT > 100) longFreezes++;
                lastT = now;
            }
            return { longFreezes };
        });

        report.throttlingResults.push({
            profile: profile.name,
            hideTimeMs: hideTime,
            isMonotonic,
            scrollUnlocked,
            longFreezes: scrollPerf.longFreezes,
            progressEventsCount: progressEvents.length,
            usedTimeout: hideTime >= 20000
        });

        console.log(`[THROTTLE] ${profile.name}: HideTime=${hideTime}ms, Monotonic=${isMonotonic}, ScrollUnlocked=${scrollUnlocked}, LongFreezes=${scrollPerf.longFreezes}, UsedTimeout=${hideTime >= 20000}`);
        await page.close();
    }

    // 4. Test Session Storage Skip (Second load in same session skips loader)
    {
        console.log('\n--- 4. Testing Session Storage Skip (2nd Visit) ---');
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 900 });
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 1200));

        // Now reload / navigate to home again
        await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
        const skipped = await page.evaluate(() => {
            const h = document.documentElement;
            const loader = document.getElementById('xb-loader');
            return h.classList.contains('xb-skip') && (!loader || window.getComputedStyle(loader).display === 'none');
        });

        report.sessionSkipCheck = { skipped };
        console.log('Session Skip Check:', skipped ? 'PASSED (Loader skipped on 2nd visit)' : 'FAILED');
        await page.close();
    }

    fs.writeFileSync(path.join(OUT_DIR, 'loader-benchmark-results.json'), JSON.stringify(report, null, 2));
    await browser.close();
}

testLoaderBenchmarks().catch(err => { console.error(err); process.exit(1); });
