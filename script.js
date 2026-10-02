// script.js - Smooth, Glitch-Free 30fps Scroll Animation Engine for Xenoi Biotech
(function () {
    const canvas = document.getElementById('animation-canvas');
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: false });

    // Enable medium quality image smoothing for optimal performance
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'medium';

    // Auto-detect mobile device for optimized bandwidth and memory footprint
    const isMobile = Math.min(screen.width, screen.height) < 900;
    const pathName = window.location.pathname.toLowerCase();
    const isMainPage = pathName.endsWith('index.html') || 
                       pathName.endsWith('/') || 
                       pathName.split('/').pop() === '' || 
                       pathName.split('/').pop() === 'index.html';

    // Home page: 298 AVIF frames (frames/). Secondary pages: 240 AVIF frames (frames_compact/).
    // Phones get the 1280px set, larger screens the 1920px set.
    const frameBase = (document.querySelector('meta[name="frame-base"]') || {}).content || '';
    const setName = isMobile ? 'mobile-1280/' : 'desktop-1920/';
    const defaultFrameConfig = isMainPage ? {
        frameCount: 298,
        framePath: frameBase + 'frames/' + setName,
        extension: 'avif'
    } : {
        frameCount: 240,
        framePath: frameBase + 'frames_compact/' + setName,
        extension: 'avif'
    };

    const config = Object.assign(
        defaultFrameConfig,
        window.ANIMATION_CONFIG || {}
    );

    const frameCount = config.frameCount;
    const currentFrameSrc = index => (
        `${config.framePath}frame_${String(index).padStart(4, '0')}.${config.extension}`
    );

    // Array of decoded Image elements
    const frames = new Array(frameCount);
    const inFlightSet = new Set();
    const coarseSet = new Set();
    for (let i = 1; i <= frameCount; i += 10) coarseSet.add(i);
    coarseSet.add(frameCount);

    let loadedCount = 0;
    let initialDrawDone = false;
    let lastDrawnFrame = -1;
    let scrollDirection = 1; // 1 = forward/down, -1 = backward/up
    let lastScrollY = window.scrollY;

    // Session Frame Persistence across page transitions (isolated per frame sequence)
    const storageKey = 'savedFrame_' + config.framePath.replace(/[^a-zA-Z0-9]/g, '_');
    const savedFrame = sessionStorage.getItem(storageKey);
    let currFrame = (window.scrollY === 0) ? 1 : (savedFrame ? parseFloat(savedFrame) : 1);
    if (isNaN(currFrame) || currFrame < 1 || currFrame > frameCount) {
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
                `Loaded frames: ${loadedCount}/${frameCount} | In-flight: ${inFlightSet.size} | Current frame: ${currFrame.toFixed(2)} | Time between draws: ${timeBetweenDraws.toFixed(2)}ms`
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
        for (let i = targetIdx + 1; i < frameCount; i++) {
            if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
                return frames[i];
            }
        }
        return null;
    }

    // Dynamic frame picker: coarse pass first, then closest to currFrame preferring scroll direction
    function getNextFrame() {
        const c = Math.max(1, Math.min(frameCount, Math.round(currFrame)));
        const dir = scrollDirection;

        function getScore(idx) {
            const dist = Math.abs(idx - c);
            const isAhead = (dir >= 0) ? (idx >= c) : (idx <= c);
            return isAhead ? dist : dist + 1000;
        }

        // 1. Coarse pass first (every 10th frame)
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

        for (let idx = 1; idx <= frameCount; idx++) {
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
        const firstFrame = Math.max(1, Math.min(frameCount, Math.round(targetFrame)));
        coarseSet.delete(firstFrame);
        await loadFrame(firstFrame);
        if (firstFrame !== 1 && !frames[0]) {
            coarseSet.delete(1);
            await loadFrame(1);
        }

        // Step 2: Maintain 6 workers picking dynamically
        const WORKER_COUNT = 6;
        async function worker() {
            while (loadedCount < frameCount) {
                const nextIdx = getNextFrame();
                if (!nextIdx) {
                    if (loadedCount >= frameCount || inFlightSet.size === 0) break;
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
        targetFrame = 1 + scrollFraction * (frameCount - 1);

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

    // Make the banner visually invisible while keeping its exact working functionality:
    // Content scrolls up naturally without vanishing mid-screen, and each item smoothly
    // diminishes as it enters the invisible banner zone so it NEVER touches or overlaps the logo.
    function updateHeaderDiminish() {
        if (document.body.classList.contains('inner')) return;
        const header = document.querySelector('.header');
        const isMobile = window.innerWidth <= 768;
        const bannerBottom = header ? header.getBoundingClientRect().bottom : (isMobile ? 65 : 82);
        // Cutoff height where elements reach 0 opacity before reaching the logo center/button
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

        // 2. All individual content elements across sections and subpages:
        // By targeting individual child elements (headings, paragraphs, badges, buttons, cards),
        // each element stays 100% visible throughout the entire viewport, and only diminishes
        // as that specific element enters the invisible banner boundary.
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
                // Below the invisible banner: 100% visible, fully interactive
                item.style.removeProperty('opacity');
                item.style.removeProperty('pointer-events');
                item.style.removeProperty('transition');
                item.classList.remove('banner-diminished');
            } else if (rect.top <= cutoff) {
                // Inside the top logo safety zone: 0 opacity, non-interactive
                item.style.opacity = '0';
                item.style.pointerEvents = 'none';
                item.style.transition = 'none';
                item.classList.add('banner-diminished');
            } else {
                // Smoothly diminishing within the invisible banner zone (between bannerBottom and cutoff)
                const progress = (rect.top - cutoff) / fadeRange;
                const eased = progress * progress * (3 - 2 * progress); // smoothstep
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

        // "Cover" math
        const scale = Math.max(cw / imgW, ch / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const offsetX = (cw - drawW) / 2;
        const offsetY = (ch - drawH) / 2;

        context.drawImage(img, offsetX, offsetY, drawW, drawH);
    }

    function forceRedraw() {
        const frameIdx = Math.max(0, Math.min(frameCount - 1, Math.round(currFrame) - 1));
        const frame = getRenderableFrame(frameIdx);
        if (frame) {
            drawImageCover(frame);
            recordDraw();
            lastDrawnFrame = frameIdx;
        }
    }

    // Main 60/120fps Animation Loop with Easing and Frame Deduplication
    function render() {
        // Smooth lerp (0.13 gives fluid inertia without sluggish lag)
        const diff = targetFrame - currFrame;
        if (Math.abs(diff) > 0.001) {
            currFrame += diff * 0.13;
            updateHeaderDiminish();
        } else {
            currFrame = targetFrame;
        }

        const frameIdx = Math.max(0, Math.min(frameCount - 1, Math.round(currFrame) - 1));

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
                // When scrolling to the footer at the bottom of the page, keep Section 5 visible to prevent jitter
                if (entry.target.closest('#about') && window.scrollY > (document.documentElement.scrollHeight - window.innerHeight - 350)) {
                    return;
                }
                // Only remove visible when element is below the viewport, NOT while passing upwards underneath the banner
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
