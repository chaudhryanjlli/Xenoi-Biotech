/* loader-init.js: tiny synchronous script, loaded in <head> of index.html (NO defer).
   Decides before first paint whether the loader shows. */
(function () {
  var h = document.documentElement;
  try {
    if (sessionStorage.getItem('xb-loaded') === '1') { h.classList.add('xb-skip'); return; }
  } catch (e) {}
  h.classList.add('xb-loading');
})();
