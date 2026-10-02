/* loader-init.js: tiny synchronous script, loaded in <head> of index.html (NO defer).
   Decides before first paint whether the loader shows. */
(function () {
  var h = document.documentElement;
  var isCompact = false;
  try {
    isCompact = Math.min(screen.width, screen.height) < 1100 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  } catch (e) {}

  if (isCompact) {
    h.classList.add('is-compact');
    h.classList.add('xb-skip');
    return;
  }

  try {
    if (sessionStorage.getItem('xb-loaded') === '1') { h.classList.add('xb-skip'); return; }
  } catch (e) {}
  h.classList.add('xb-loading');
})();
