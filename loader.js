/* loader.js: Xenoi Biotech full-screen loader (loaded with defer on index.html only).
   script.js reports progress with:
     window.dispatchEvent(new CustomEvent('xb:frames', { detail: { progress: 0..1, ready: boolean } }));
*/
(function () {
  var root = document.getElementById('xb-loader');
  var h = document.documentElement;
  if (!root || h.classList.contains('xb-skip') || h.classList.contains('is-compact')) {
    if (root && root.parentNode) root.remove();
    h.classList.remove('xb-loading');
    return;
  }

  var barFill = document.getElementById('xb-bar-fill');
  var textEl = document.getElementById('xb-loader-text');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MAX_WAIT_MS = 20000;
  var MIN_SHOW_MS = 700;
  var startTime = performance.now();

  var targetProgress = 0;
  var displayProgress = 0;
  var isReady = false;
  var finished = false;
  var safetyTimer = null;

  function updateVisuals(p) {
    if (barFill) {
      barFill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    if (textEl) {
      var pct = Math.min(100, Math.max(0, Math.round(p * 100)));
      textEl.textContent = 'LOADING  ' + pct + '%';
    }
  }

  function unlockScroll() {
    h.classList.remove('xb-loading');
  }

  function finish() {
    if (finished) return;
    finished = true;
    if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
    try { sessionStorage.setItem('xb-loaded', '1'); } catch (e) {}

    var elapsed = performance.now() - startTime;
    var remaining = Math.max(0, MIN_SHOW_MS - elapsed);

    setTimeout(function () {
      if (root) {
        root.style.pointerEvents = 'none';
        root.classList.add('xb-hide');
      }
      unlockScroll();
      setTimeout(function () {
        if (root && root.parentNode) root.remove();
      }, reduce ? 0 : 450);
    }, remaining);
  }

  function forceFinish() {
    if (finished) return;
    targetProgress = 1;
    displayProgress = 1;
    updateVisuals(1);
    finish();
  }

  function tick() {
    if (finished) return;

    if (reduce) {
      displayProgress = isReady ? 1 : targetProgress;
    } else {
      var target = isReady ? 1 : targetProgress;
      var diff = target - displayProgress;
      if (diff > 0.0005) {
        displayProgress += diff * 0.12;
      } else if (isReady) {
        displayProgress = 1;
      }
    }

    // Never go backwards
    displayProgress = Math.min(1, Math.max(0, displayProgress));
    updateVisuals(displayProgress);

    if (isReady && displayProgress >= 0.999) {
      updateVisuals(1);
      finish();
      return;
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener('xb:frames', function (e) {
    if (!e || !e.detail) return;
    var p = typeof e.detail.progress === 'number' ? e.detail.progress : 0;
    if (p > targetProgress) {
      targetProgress = Math.min(1, p);
    }
    if (e.detail.ready || targetProgress >= 0.90) {
      isReady = true;
    }
  });

  safetyTimer = setTimeout(forceFinish, MAX_WAIT_MS);

  // Safeguard: if any unhandled error occurs, ensure scroll unlock
  window.addEventListener('error', function () {
    setTimeout(unlockScroll, 1000);
  });

  updateVisuals(0);
  requestAnimationFrame(tick);
})();
