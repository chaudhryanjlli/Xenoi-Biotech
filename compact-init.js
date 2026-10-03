/* compact-init.js: synchronous detection script in <head> of secondary pages.
   Adds .is-compact before first paint on touch devices and iPads. */
(function () {
  var h = document.documentElement;
  var isCompact = false;
  try {
    isCompact = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
                Math.min(screen.width, screen.height) < 600 ||
                (navigator.maxTouchPoints && navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  } catch (e) {}

  if (isCompact) {
    h.classList.add('is-compact');
  }
})();
