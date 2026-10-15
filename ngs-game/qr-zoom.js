// Click the join QR code or the final podium to enlarge it in the centre of the screen,
// with the rest of the page blurred behind it. Click anywhere or press Esc to close.
(function () {
  var overlay = null;
  function onKey(e) { if (e.key === "Escape") close(); }
  function close() {
    if (overlay) { overlay.remove(); overlay = null; document.removeEventListener("keydown", onKey); }
  }
  function show(content, label, hintText, extraClass) {
    close();
    overlay = document.createElement("div");
    overlay.className = "qr-zoom-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", label + " Click anywhere or press Escape to close.");
    var box = document.createElement("div");
    box.className = "qr-zoom-box" + (extraClass ? " " + extraClass : "");
    box.appendChild(content);
    var hint = document.createElement("p");
    hint.className = "qr-zoom-hint";
    hint.textContent = hintText;
    box.appendChild(hint);
    overlay.appendChild(box);
    overlay.addEventListener("click", close);
    document.body.appendChild(overlay);
    document.addEventListener("keydown", onKey);
  }
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!(t instanceof Element) || t.closest(".qr-zoom-overlay")) return;
    var qr = t.closest(".qrpanel img");
    if (qr && qr.src) {
      e.preventDefault();
      var img = document.createElement("img");
      img.src = qr.src;
      img.alt = "Enlarged QR code to join the game";
      show(img, "Enlarged QR code.", "Scan to join · click anywhere or press Esc to close", "");
      return;
    }
    var podium = t.closest(".podium");
    if (podium) {
      e.preventDefault();
      var copy = podium.cloneNode(true);
      copy.removeAttribute("id");
      show(copy, "Enlarged podium.", "Click anywhere or press Esc to close", "podium-box");
    }
  });
})();
