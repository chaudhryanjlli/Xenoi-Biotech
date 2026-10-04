// script.js - Smooth, Glitch-Free Scroll Animation Engine for Xenoi Biotech
(function () {
    // Inner pages use static background and have zero animation/frame requests
    if (document.body.classList.contains('inner')) return;

    const isCompact = document.documentElement.classList.contains('is-compact');

    // Setup intersection observer for text animations (runs on both desktop and compact)
    const observerOptions = {
        root: null,
        rootMargin: '120px 0px 0px 0px',
        threshold: 0.05
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                if (entry.target.closest('#about') && window.scrollY > (document.documentElement.scrollHeight - window.innerHeight - 350)) {
                    return;
                }
                if (entry.boundingClientRect.top > 0) {
                    entry.target.classList.remove('visible');
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.text-block').forEach(block => {
        observer.observe(block);
    });

    // Make the banner visually invisible while keeping its exact working functionality
    function updateHeaderDiminish() {
        if (document.body.classList.contains('inner')) return;
        const header = document.querySelector('.header');
        const isMobile = window.innerWidth <= 768;
        const bannerBottom = header ? header.getBoundingClientRect().bottom : (isMobile ? 65 : 82);
        const cutoff = isMobile ? 26 : 36;
        const fadeRange = bannerBottom - cutoff;

        // 1. Page 1 Hero scroll indicator: gently fades out as user begins scrolling
        const heroBottom = document.querySelector('.hero-bottom');
        let heroOpacity = null;
        let heroPointerEvents = null;
        if (heroBottom) {
            const scrollY = window.scrollY;
            if (scrollY <= 0) {
                heroOpacity = '1';
                heroPointerEvents = '';
            } else if (scrollY >= 100) {
                heroOpacity = '0';
                heroPointerEvents = 'none';
            } else {
                heroOpacity = (1 - (scrollY / 100)).toFixed(3);
                heroPointerEvents = '';
            }
        }

        // 2. All individual content elements across sections
        const selector = [
            '.hero-container > *',
            '.page:not(.page-1) .text-block > *',
            '.page-container > :not(.services-grid):not(.team-grid):not(.workshop-grid):not(.genomics-grid)',
            '.services-grid > *',
            '.team-grid > *',
            '.workshop-grid > *',
            '.genomics-grid > *',
            '.quote-container > :not(.quote-form)',
            '.quote-form > *',
            '.cta-card > *'
        ].join(', ');

        const items = document.querySelectorAll(selector);
        // READ PHASE: gather all measurements first to avoid layout thrashing
        const rects = new Array(items.length);
        for (let i = 0; i < items.length; i++) {
            rects[i] = items[i].getBoundingClientRect();
        }

        // WRITE PHASE: update styles after all reads have completed
        if (heroBottom && heroOpacity !== null) {
            heroBottom.style.opacity = heroOpacity;
            heroBottom.style.pointerEvents = heroPointerEvents;
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const rect = rects[i];

            if (rect.top >= bannerBottom) {
                item.style.removeProperty('opacity');
                item.style.removeProperty('pointer-events');
                item.style.removeProperty('transition');
                item.classList.remove('banner-diminished');
            } else if (rect.top <= cutoff) {
                item.style.opacity = '0';
                item.style.pointerEvents = 'none';
                item.style.transition = 'none';
                item.classList.add('banner-diminished');
            } else {
                const progress = (rect.top - cutoff) / fadeRange;
                const eased = progress * progress * (3 - 2 * progress);
                item.style.opacity = eased.toFixed(3);
                item.style.pointerEvents = progress < 0.15 ? 'none' : '';
                item.style.transition = 'none';
                item.classList.remove('banner-diminished');
            }
        }
    }

    // Scroll target mapping for floating nav
    function updateScrollTargetCommon() {
        const navContainer = document.getElementById('main-nav');
        if (navContainer) {
            if (window.scrollY > window.innerHeight * 0.4) {
                navContainer.classList.add('nav-fixed-top');
            } else {
                navContainer.classList.remove('nav-fixed-top');
            }
        }
        updateHeaderDiminish();
    }

    let headerDiminishRaf = null;
    function requestHeaderDiminishUpdate() {
        if (headerDiminishRaf !== null) return;
        headerDiminishRaf = requestAnimationFrame(() => {
            headerDiminishRaf = null;
            updateScrollTargetCommon();
        });
    }

    window.addEventListener('scroll', requestHeaderDiminishUpdate, { passive: true });
    window.addEventListener('resize', requestHeaderDiminishUpdate, { passive: true });
    updateScrollTargetCommon();

    // If is-compact: do nothing further for frames (no canvas, no requests, no workers)
    if (isCompact) {
        return;
    }

    // --- DESKTOP ANIMATION ENGINE (Unchanged) ---
    const canvas = document.getElementById('animation-canvas');
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: false });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'medium';

    const frameBase = (document.querySelector('meta[name="frame-base"]') || {}).content || '';
    const setName = 'frames/desktop-1920-v2/';
    const rawFrameCount = 298;
    const FRAME_STRIDE = 2;

    const effectiveFrames = [];
    for (let i = 1; i <= rawFrameCount; i += FRAME_STRIDE) {
        effectiveFrames.push(i);
    }
    const effectiveFrameCount = effectiveFrames.length;

    const config = Object.assign(
        {
            frameCount: effectiveFrameCount,
            framePath: frameBase + setName,
            extension: 'avif'
        },
        window.ANIMATION_CONFIG || {}
    );

    const currentFrameSrc = (effectiveIdx) => {
        const rawIdx = effectiveFrames[effectiveIdx - 1];
        return `${config.framePath}frame_${String(rawIdx).padStart(4, '0')}.${config.extension}`;
    };

    const frames = new Array(effectiveFrameCount);
    const inFlightSet = new Set();
    const coarseSet = new Set();
    const isCoarseFrame = (idx) => (idx - 1) % 5 === 0 || idx === effectiveFrameCount;

    for (let i = 1; i <= effectiveFrameCount; i += 5) {
        coarseSet.add(i);
    }
    coarseSet.add(effectiveFrameCount);
    const coarseCount = coarseSet.size;

    let consecutiveFailures = 0;
    let fallbackTriggered = false;

    function fallbackToCompact() {
        if (fallbackTriggered) return;
        fallbackTriggered = true;
        document.documentElement.classList.add('is-compact');
        window.dispatchEvent(new CustomEvent('xb:frames', {
            detail: {
                progress: 1,
                ready: true,
                loaded: effectiveFrameCount,
                total: effectiveFrameCount
            }
        }));
    }

    function manageMemory(center) {
        const minWin = center - 40;
        const maxWin = center + 40;

        for (let i = 1; i <= effectiveFrameCount; i++) {
            if ((i < minWin || i > maxWin) && !isCoarseFrame(i) && frames[i - 1]) {
                frames[i - 1] = null;
            }
        }

        const needed = [];
        const start = Math.max(1, minWin);
        const end = Math.min(effectiveFrameCount, maxWin);
        for (let i = start; i <= end; i++) {
            if (!frames[i - 1] && !inFlightSet.has(i)) {
                needed.push(i);
            }
        }
        needed.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));

        for (let j = 0; j < needed.length; j++) {
            if (inFlightSet.size >= 6) break;
            loadFrame(needed[j]);
        }
    }

    const threshold = Math.max(coarseCount, Math.ceil(effectiveFrameCount * 0.25));

    function reportLoaderProgress() {
        const progress = Math.min(1, loadedCount / effectiveFrameCount);
        let isReady = progress >= 0.90;
        if (!isReady && coarseSet.size === 0) {
            const center = Math.max(1, Math.min(effectiveFrameCount, Math.round(currFrame)));
            const winMin = Math.max(1, center - 30);
            const winMax = Math.min(effectiveFrameCount, center + 30);
            let winLoaded = 0;
            for (let k = winMin; k <= winMax; k++) {
                if (frames[k - 1]) winLoaded++;
            }
            const winTotal = winMax - winMin + 1;
            if (winTotal > 0 && (winLoaded / winTotal) >= 0.90) {
                isReady = true;
            }
        }
        window.dispatchEvent(new CustomEvent('xb:frames', {
            detail: {
                progress: progress,
                ready: isReady,
                loaded: loadedCount,
                total: effectiveFrameCount
            }
        }));
    }

    let loadedCount = 0;
    let initialDrawDone = false;
    let lastDrawnFrame = -1;
    let scrollDirection = 1;
    let lastScrollY = window.scrollY;

    const storageKey = 'savedFrame_' + config.framePath.replace(/[^a-zA-Z0-9]/g, '_');
    const savedFrame = sessionStorage.getItem(storageKey);
    let currFrame = (window.scrollY === 0) ? 1 : (savedFrame ? parseFloat(savedFrame) : 1);
    if (isNaN(currFrame) || currFrame < 1 || currFrame > effectiveFrameCount) {
        currFrame = 1;
    }
    let targetFrame = currFrame;

    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem(storageKey, currFrame.toFixed(2));
    });

    let lastDrawTime = 0;
    let timeBetweenDraws = 0;

    function getRenderableFrame(targetIdx) {
        if (frames[targetIdx] && frames[targetIdx].complete && frames[targetIdx].naturalWidth > 0) {
            return frames[targetIdx];
        }
        for (let i = targetIdx - 1; i >= 0; i--) {
            if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
                return frames[i];
            }
        }
        for (let i = targetIdx + 1; i < effectiveFrameCount; i++) {
            if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
                return frames[i];
            }
        }
        return null;
    }

    function getNextFrame() {
        const c = Math.max(1, Math.min(effectiveFrameCount, Math.round(currFrame)));
        const dir = scrollDirection;

        function getScore(idx) {
            const dist = Math.abs(idx - c);
            const isAhead = (dir >= 0) ? (idx >= c) : (idx <= c);
            return isAhead ? dist : dist + 1000;
        }

        if (coarseSet.size > 0) {
            let bestIdx = null;
            let bestScore = Infinity;

            for (const idx of coarseSet) {
                if (frames[idx - 1] || inFlightSet.has(idx)) {
                    coarseSet.delete(idx);
                    continue;
                }
                const score = getScore(idx);
                if (score < bestScore) {
                    bestScore = score;
                    bestIdx = idx;
                }
            }

            if (bestIdx !== null) {
                coarseSet.delete(bestIdx);
                inFlightSet.add(bestIdx);
                return bestIdx;
            }
        }

        let bestIdx = null;
        let bestScore = Infinity;

        for (let idx = 1; idx <= effectiveFrameCount; idx++) {
            if (!frames[idx - 1] && !inFlightSet.has(idx) && Math.abs(idx - c) <= 40) {
                const score = getScore(idx);
                if (score < bestScore) {
                    bestScore = score;
                    bestIdx = idx;
                }
            }
        }

        if (bestIdx !== null) {
            inFlightSet.add(bestIdx);
            return bestIdx;
        }

        return null;
    }

    const loadedOnceSet = new Set();
    async function loadFrame(index) {
        if (fallbackTriggered) return;
        const arrayIdx = index - 1;
        if (frames[arrayIdx]) {
            inFlightSet.delete(index);
            return;
        }
        inFlightSet.add(index);

        const src = currentFrameSrc(index);
        const img = new Image();
        img.src = src;

        try {
            if ('decode' in img) {
                await img.decode();
            } else {
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });
            }
            if (img.complete && img.naturalWidth > 0) {
                frames[arrayIdx] = img;
                consecutiveFailures = 0;
                if (!loadedOnceSet.has(index)) {
                    loadedOnceSet.add(index);
                    loadedCount++;
                    reportLoaderProgress();
                }
                if (!initialDrawDone) {
                    initialDrawDone = true;
                    resizeCanvas();
                    forceRedraw();
                }
            }
        } catch (err) {
            console.warn(`Failed loading frame ${index}:`, err);
            consecutiveFailures++;
            if (consecutiveFailures >= 3 && loadedCount === 0) {
                fallbackToCompact();
            }
        } finally {
            inFlightSet.delete(index);
        }
    }

    async function preloadFrames() {
        const firstFrame = Math.max(1, Math.min(effectiveFrameCount, Math.round(targetFrame)));
        coarseSet.delete(firstFrame);
        await loadFrame(firstFrame);
        if (fallbackTriggered) return;
        if (firstFrame !== 1 && !frames[0]) {
            coarseSet.delete(1);
            await loadFrame(1);
        }

        const WORKER_COUNT = 6;
        async function worker() {
            while (loadedCount < effectiveFrameCount && !fallbackTriggered) {
                const nextIdx = getNextFrame();
                if (!nextIdx) {
                    if (loadedCount >= effectiveFrameCount || inFlightSet.size === 0) break;
                    await new Promise(r => setTimeout(r, 20));
                    continue;
                }
                await loadFrame(nextIdx);
            }
        }

        for (let i = 0; i < WORKER_COUNT; i++) {
            worker();
        }
    }

    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const w = Math.round(window.innerWidth * dpr);
        const h = Math.round(window.innerHeight * dpr);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            lastDrawnFrame = -1;
        }
    }
    window.addEventListener('resize', resizeCanvas, { passive: true });

    function updateDesktopScrollTarget() {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY) {
            scrollDirection = 1;
        } else if (currentScrollY < lastScrollY) {
            scrollDirection = -1;
        }
        lastScrollY = currentScrollY;

        const html = document.documentElement;
        const maxScroll = Math.max(1, html.scrollHeight - window.innerHeight);
        const scrollFraction = Math.min(1, Math.max(0, currentScrollY / maxScroll));
        targetFrame = 1 + scrollFraction * (effectiveFrameCount - 1);
    }
    window.addEventListener('scroll', updateDesktopScrollTarget, { passive: true });

    function recordDraw() {
        const now = performance.now();
        if (lastDrawTime > 0) {
            timeBetweenDraws = now - lastDrawTime;
        }
        lastDrawTime = now;
    }

    function drawImageCover(img) {
        if (!img || !img.complete || img.naturalWidth <= 0) return;
        const cw = canvas.width;
        const ch = canvas.height;
        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;
        if (!imgW || !imgH) return;

        const scale = Math.max(cw / imgW, ch / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const offsetX = (cw - drawW) / 2;
        const offsetY = (ch - drawH) / 2;

        context.drawImage(img, offsetX, offsetY, drawW, drawH);
    }

    function forceRedraw() {
        const frameIdx = Math.max(0, Math.min(effectiveFrameCount - 1, Math.round(currFrame) - 1));
        const frame = getRenderableFrame(frameIdx);
        if (frame) {
            drawImageCover(frame);
            recordDraw();
            lastDrawnFrame = frameIdx;
        }
    }

    function render() {
        if (fallbackTriggered) return;
        const diff = targetFrame - currFrame;
        if (Math.abs(diff) > 0.001) {
            currFrame += diff * 0.13;
        } else {
            currFrame = targetFrame;
        }

        const frameIdx = Math.max(0, Math.min(effectiveFrameCount - 1, Math.round(currFrame) - 1));

        if (frameIdx !== lastDrawnFrame) {
            const frame = getRenderableFrame(frameIdx);
            if (frame) {
                drawImageCover(frame);
                recordDraw();
                lastDrawnFrame = frameIdx;
            }
            manageMemory(frameIdx + 1);
        }

        requestAnimationFrame(render);
    }

    resizeCanvas();
    updateDesktopScrollTarget();
    preloadFrames();
    requestAnimationFrame(render);
})();
