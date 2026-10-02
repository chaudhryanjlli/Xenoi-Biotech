// script.js - Smooth, Glitch-Free Scroll Animation Engine for Xenoi Biotech
(function () {
    // Inner pages use static background and have zero animation/frame requests
    if (document.body.classList.contains('inner')) return;

    const canvas = document.getElementById('animation-canvas');
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: false });

    // Enable medium quality image smoothing for optimal performance
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'medium';

    // Auto-detect mobile device for optimized bandwidth and memory footprint
    const isMobile = Math.min(screen.width, screen.height) < 900;
    const frameBase = (document.querySelector('meta[name="frame-base"]') || {}).content || '';
    const setName = isMobile ? 'mobile-1280/' : 'desktop-1920/';

    // Frame configuration with FRAME_STRIDE = 2
    const FRAME_STRIDE = 2;
    const rawFrameCount = 298;
    const effectiveFrames = [];
    for (let i = 1; i <= rawFrameCount; i += FRAME_STRIDE) {
        effectiveFrames.push(i);
    }
    const effectiveFrameCount = effectiveFrames.length; // 149 frames (1, 3, ..., 297)

    const config = Object.assign(
        {
            frameCount: effectiveFrameCount,
            framePath: frameBase + 'frames/' + setName,
            extension: 'avif'
        },
        window.ANIMATION_CONFIG || {}
    );

    const currentFrameSrc = (effectiveIdx) => {
        const rawIdx = effectiveFrames[effectiveIdx - 1];
        return `${config.framePath}frame_${String(rawIdx).padStart(4, '0')}.${config.extension}`;
    };

    // Array of decoded Image elements
    const frames = new Array(effectiveFrameCount);
    const inFlightSet = new Set();
    const coarseSet = new Set();

    // Coarse pass: every 5th effective frame plus the final frame
    for (let i = 1; i <= effectiveFrameCount; i += 5) {
        coarseSet.add(i);
    }
    coarseSet.add(effectiveFrameCount);
    const coarseCount = coarseSet.size;

    // Loader threshold calculation (Requirement 12)
    const threshold = Math.max(coarseCount, Math.ceil(effectiveFrameCount * 0.25));

    // Loader progress hook from script-hook.js.txt
    function reportLoaderProgress(loaded, thresh, coarseDone) {
        let p = Math.min(1, loaded / thresh);
        if (!coarseDone) p = Math.min(p, 0.98); // never hit 100% before the coarse pass is done
        window.dispatchEvent(new CustomEvent('xb:frames', { detail: { progress: p } }));
    }

    let loadedCount = 0;
    let initialDrawDone = false;
    let lastDrawnFrame = -1;
    let scrollDirection = 1; // 1 = forward/down, -1 = backward/up
    let lastScrollY = window.scrollY;

    // Session Frame Persistence across page transitions (isolated per frame sequence)
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

    // Performance & Debug tracking
    let lastDrawTime = 0;
    let timeBetweenDraws = 0;
    const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';

    if (isDebug) {
        setInterval(() => {
            console.log(
                `Loaded frames: ${loadedCount}/${effectiveFrameCount} | In-flight: ${inFlightSet.size} | Current frame: ${currFrame.toFixed(2)} | Time between draws: ${timeBetweenDraws.toFixed(2)}ms`
            );
        }, 1000);
    }

    // Helper: Find nearest ready frame so canvas is NEVER blank or glitchy
    function getRenderableFrame(targetIdx) {
        if (frames[targetIdx] && frames[targetIdx].complete && frames[targetIdx].naturalWidth > 0) {
            return frames[targetIdx];
        }
        // Search backwards (closest loaded earlier frame)
        for (let i = targetIdx - 1; i >= 0; i--) {
            if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
                return frames[i];
            }
        }
        // Search forwards if no earlier frame is loaded yet
        for (let i = targetIdx + 1; i < effectiveFrameCount; i++) {
            if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
                return frames[i];
            }
        }
        return null;
    }

    // Dynamic frame picker: coarse pass first, then closest to currFrame preferring scroll direction
    function getNextFrame() {
        const c = Math.max(1, Math.min(effectiveFrameCount, Math.round(currFrame)));
        const dir = scrollDirection;

        function getScore(idx) {
            const dist = Math.abs(idx - c);
            const isAhead = (dir >= 0) ? (idx >= c) : (idx <= c);
            return isAhead ? dist : dist + 1000;
        }

        // 1. Coarse pass first (every 5th effective frame)
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

        // 2. Fine pass - dynamically select nearest unassigned frame
        let bestIdx = null;
        let bestScore = Infinity;

        for (let idx = 1; idx <= effectiveFrameCount; idx++) {
            if (!frames[idx - 1] && !inFlightSet.has(idx)) {
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

    // High performance decoding using Image() and decode()
    async function loadFrame(index) {
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
                loadedCount++;
                reportLoaderProgress(loadedCount, threshold, coarseSet.size === 0);
                if (!initialDrawDone) {
                    initialDrawDone = true;
                    resizeCanvas();
                    forceRedraw();
                }
            }
        } catch (err) {
            console.warn(`Failed loading frame ${index}:`, err);
        } finally {
            inFlightSet.delete(index);
        }
    }

    // Worker pool queue: exactly 6 downloads/decodes in flight at all times
    async function preloadFrames() {
        // Step 1: Immediately load target initial frame (and frame 1)
        const firstFrame = Math.max(1, Math.min(effectiveFrameCount, Math.round(targetFrame)));
        coarseSet.delete(firstFrame);
        await loadFrame(firstFrame);
        if (firstFrame !== 1 && !frames[0]) {
            coarseSet.delete(1);
            await loadFrame(1);
        }

        // Step 2: Maintain 6 workers picking dynamically
        const WORKER_COUNT = 6;
        async function worker() {
            while (loadedCount < effectiveFrameCount) {
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

    // High-DPI Canvas Resizing capped at 1.5 dpr
    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const w = Math.round(window.innerWidth * dpr);
        const h = Math.round(window.innerHeight * dpr);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            lastDrawnFrame = -1; // Trigger redraw
        }
    }
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Scroll mapping
    function updateScrollTarget() {
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

        // Navigation bar transition
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
        if (heroBottom) {
            const scrollY = window.scrollY;
            if (scrollY <= 0) {
                heroBottom.style.opacity = '1';
                heroBottom.style.pointerEvents = '';
            } else if (scrollY >= 100) {
                heroBottom.style.opacity = '0';
                heroBottom.style.pointerEvents = 'none';
            } else {
                heroBottom.style.opacity = (1 - (scrollY / 100)).toFixed(3);
                heroBottom.style.pointerEvents = '';
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
        items.forEach(item => {
            const rect = item.getBoundingClientRect();

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
        });
    }

    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('scroll', updateHeaderDiminish, { passive: true });
    window.addEventListener('resize', updateHeaderDiminish, { passive: true });

    function recordDraw() {
        const now = performance.now();
        if (lastDrawTime > 0) {
            timeBetweenDraws = now - lastDrawTime;
        }
        lastDrawTime = now;
    }

    // Direct cover draw - NO clearRect to completely prevent white/black flashes
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

    // Main 60/120fps Animation Loop with Easing and Frame Deduplication
    function render() {
        const diff = targetFrame - currFrame;
        if (Math.abs(diff) > 0.001) {
            currFrame += diff * 0.13;
            updateHeaderDiminish();
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
        }

        requestAnimationFrame(render);
    }

    // Setup intersection observer for text animations
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

    // Initialize
    resizeCanvas();
    updateScrollTarget();
    preloadFrames();
    requestAnimationFrame(render);
})();
