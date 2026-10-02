// script.js - Smooth, Glitch-Free 30fps Scroll Animation Engine for Xenoi Biotech
(function () {
    const canvas = document.getElementById('animation-canvas');
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: false });

    // Enable high quality image smoothing
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

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

    // Array of decoded ImageBitmaps or HTMLImageElements
    const frames = new Array(frameCount);
    const loadingSet = new Set();
    let loadedCount = 0;
    let initialDrawDone = false;
    let lastDrawnFrame = -1;

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

    // High performance progressive decoding using Image() and decode()
    async function loadFrame(index) {
        const arrayIdx = index - 1;
        if (frames[arrayIdx] || loadingSet.has(index)) return;
        loadingSet.add(index);

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
            loadingSet.delete(index);
        }
    }

    // Progressive loader:
    // 1. Immediate first frame
    // 2. Coarse pass (every 10th frame) in batches of 8
    // 3. Fine pass (filling gaps) in batches of 8
    async function preloadFrames() {
        // Step 1: Immediately load target initial frame (or frame 1)
        const firstFrame = Math.max(1, Math.min(frameCount, Math.round(targetFrame)));
        await loadFrame(firstFrame);
        if (firstFrame !== 1) {
            await loadFrame(1);
        }

        // Step 2: Coarse pass - every 10th frame across the entire sequence
        const coarseIndices = [];
        for (let i = 1; i <= frameCount; i += 10) {
            if (!frames[i - 1] && !loadingSet.has(i)) {
                coarseIndices.push(i);
            }
        }
        if (!frames[frameCount - 1] && !loadingSet.has(frameCount)) {
            coarseIndices.push(frameCount);
        }

        for (let i = 0; i < coarseIndices.length; i += 8) {
            const batch = coarseIndices.slice(i, i + 8);
            await Promise.all(batch.map(idx => loadFrame(idx)));
        }

        // Step 3: Populate remaining frames in batches of 8
        const remaining = [];
        for (let i = 1; i <= frameCount; i++) {
            if (!frames[i - 1] && !loadingSet.has(i)) {
                remaining.push(i);
            }
        }

        // Prioritize frames closest to current view position
        remaining.sort((a, b) => Math.abs(a - targetFrame) - Math.abs(b - targetFrame));

        for (let i = 0; i < remaining.length; i += 8) {
            const batch = remaining.slice(i, i + 8);
            await Promise.all(batch.map(idx => loadFrame(idx)));
        }
    }

    // High-DPI Canvas Resizing
    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(window.innerWidth * dpr);
        const h = Math.round(window.innerHeight * dpr);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            lastDrawnFrame = -1; // Trigger redraw
        }
    }
    window.addEventListener('resize', resizeCanvas, { passive: true });

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

    // Scroll mapping
    function updateScrollTarget() {
        const html = document.documentElement;
        const maxScroll = Math.max(1, html.scrollHeight - window.innerHeight);
        const scrollFraction = Math.min(1, Math.max(0, window.scrollY / maxScroll));
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
