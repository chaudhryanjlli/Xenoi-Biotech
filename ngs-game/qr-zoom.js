// Click the join QR code to enlarge it in the centre of the screen with the page blurred behind it.
(function () {
  var overlay = null;
  function onKey(e) { if (e.key === "Escape") close(); }
  function close() {
    if (overlay) { overlay.remove(); overlay = null; document.removeEventListener("keydown", onKey); }
  }
  function open(src) {
    close();
    overlay = document.createElement("div");
    overlay.className = "qr-zoom-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Enlarged QR code. Click anywhere or press Escape to close.");
    var box = document.createElement("div");
    box.className = "qr-zoom-box";
    var img = document.createElement("img");
    img.src = src;
    img.alt = "Enlarged QR code to join the game";
    var hint = document.createElement("p");
    hint.textContent = "Scan to join · click anywhere or press Esc to close";
    box.appendChild(img);
    box.appendChild(hint);
    overlay.appendChild(box);
    overlay.addEventListener("click", close);
    document.body.appendChild(overlay);
    document.addEventListener("keydown", onKey);
  }
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!(t instanceof Element)) return;
    var img = t.closest(".qrpanel img");
    if (img && img.src) { e.preventDefault(); open(img.src); }
  });
})();
