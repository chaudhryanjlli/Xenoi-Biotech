/* loader.js: Xenoi Biotech full-screen loader (loaded with defer on index.html only).
   script.js reports progress with:
     window.dispatchEvent(new CustomEvent('xb:frames', { detail: { progress: 0..1 } }));
   progress = 1 means "enough frames are ready, open the site". */
(function () {
  var root = document.getElementById('xb-loader');
  var h = document.documentElement;
  if (!root || h.classList.contains('xb-skip')) { if (root) root.remove(); return; }

  var canvas = document.getElementById('xb-spiral');
  var wordmark = document.getElementById('xb-wordmark');
  var pctEl = document.getElementById('xb-pct');
  var labelEl = document.getElementById('xb-label');
  var S = 300;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MAX_WAIT_MS = 8000;
  var MIN_SHOW_MS = 700;
  var startTime = performance.now();

  var target = 0, shown = 0, finished = false, lastDrawn = -1;
  var ctx = canvas.getContext('2d');
  canvas.width = S; canvas.height = S;

  var base = null, U = null, useFallback = false;
  var img = new Image();
  img.onload = function () {
    try {
      var o = document.createElement('canvas'); o.width = S; o.height = S;
      var oc = o.getContext('2d'); oc.drawImage(img, 0, 0, S, S);
      base = oc.getImageData(0, 0, S, S);
      U = new Float32Array(S * S);
      var c = S / 2;
      for (var y = 0; y < S; y++) {
        for (var x = 0; x < S; x++) {
          var dx = x - c, dy = y - c;
          var r = Math.min(1, Math.sqrt(dx * dx + dy * dy) / c);
          var a = Math.atan2(dy, dx) + Math.PI / 2;
          if (a < 0) a += 2 * Math.PI;
          a /= 2 * Math.PI;
          U[y * S + x] = 0.5 * r + 0.5 * a;
        }
      }
    } catch (e) { useFallback = true; }
    draw(shown, true);
  };
  img.onerror = function () { useFallback = true; };
  img.src = 'xenoi-icon.png';

  function draw(p, force) {
    var q = Math.round(p * 200);
    if (!force && q === lastDrawn) return;
    lastDrawn = q;
    if (useFallback || !base) {
      ctx.clearRect(0, 0, S, S);
      ctx.globalAlpha = 0.10 + 0.90 * p;
      if (img.complete) ctx.drawImage(img, 0, 0, S, S);
      ctx.globalAlpha = 1;
      return;
    }
    var out = ctx.createImageData(S, S), w = 0.14, d = base.data, o = out.data;
    for (var i = 0; i < S * S; i++) {
      var j = i * 4, al = d[j + 3];
      if (!al) continue;
      var f = (p * (1 + w) - U[i]) / w;
      f = f < 0 ? 0 : f > 1 ? 1 : f;
      var edge = p >= 1 ? 0 : Math.sin(Math.PI * f) * 0.6;
      o[j]     = d[j]     + (176 - d[j])     * edge;
      o[j + 1] = d[j + 1] + (252 - d[j + 1]) * edge;
      o[j + 2] = d[j + 2] + (219 - d[j + 2]) * edge;
      o[j + 3] = al * (0.10 + 0.90 * f);
    }
    ctx.putImageData(out, 0, 0);
  }

  function paint() {
    draw(shown);
    var pct = Math.round(shown * 100);
    pctEl.textContent = pct + '%';
    wordmark.style.opacity = (0.25 + 0.75 * Math.min(1, shown / 0.87)).toFixed(3);
  }

  function finish() {
    if (finished) return;
    finished = true;
    labelEl.textContent = 'Ready';
    try { sessionStorage.setItem('xb-loaded', '1'); } catch (e) {}

    var elapsed = performance.now() - startTime;
    var remaining = Math.max(0, MIN_SHOW_MS - elapsed);

    setTimeout(function () {
      root.style.pointerEvents = 'none';
      root.classList.add('xb-hide');
      h.classList.remove('xb-loading');
      setTimeout(function () {
        if (root && root.parentNode) root.remove();
      }, reduce ? 0 : 450);
    }, remaining);
  }

  function tick() {
    if (finished) return;
    var step = reduce ? 1 : 0.06;
    shown += (target - shown) * step;
    if (Math.abs(target - shown) < 0.002) shown = target;
    paint();
    if (shown >= 1) { finish(); return; }
    requestAnimationFrame(tick);
  }

  window.addEventListener('xb:frames', function (e) {
    var p = e && e.detail && typeof e.detail.progress === 'number' ? e.detail.progress : 0;
    if (p > target) target = Math.min(1, p);
  });

  setTimeout(function () { target = 1; }, MAX_WAIT_MS); // never block the site for long
  requestAnimationFrame(tick);
})();
