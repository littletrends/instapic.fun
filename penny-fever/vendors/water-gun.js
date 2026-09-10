/* id=water-gun · Marina · Pocket Harbour test (2026-09-09).
 * Alley sign stays "Water Gun Duel" until the later rename. Old 3D duel is in
 * .local-backups/water-gun-duel-2026-09-09.tgz. PF only. Never booth/port 6000. */
(function boot() {
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) {
    requestAnimationFrame(boot);
    return;
  }

  const SRC = "vendors/water-gun/play/";

  function frame() {
    return document.getElementById("waterGunHarbourFrame");
  }
  function note() {
    return document.getElementById("waterGunHarbourNote");
  }
  function setNote(text, showBack) {
    const el = note();
    if (!el) return;
    const copy = el.querySelector("[data-harbour-status]");
    if (copy) copy.textContent = text;
    el.hidden = !text;
    const back = el.querySelector("[data-back-arcade]");
    if (back) back.hidden = !showBack;
  }
  function unload() {
    const el = frame();
    if (!el) return;
    el.onload = null;
    el.onerror = null;
    if (el.src && el.src !== "about:blank") el.src = "about:blank";
  }
  function load() {
    const el = frame();
    if (!el) {
      setNote("The harbour stage is missing. Step back to the alley.", true);
      return;
    }
    setNote("Opening Marina’s harbour…", true);
    el.onload = () => {
      const loaded = !!(el.src && !el.src.endsWith("about:blank"));
      if (loaded) setNote("", false);
      try { if (loaded) el.contentWindow.focus(); } catch (_) { /* cross-origin not expected */ }
    };
    el.onerror = () => {
      setNote("The harbour could not open. Step back to the alley and try again.", true);
    };
    el.src = SRC;
  }

  PF.registerVendor({
    id: "water-gun",
    playKey: "watergun",
    chalk: "Marina’s Paper Harbour — a little voyage, not a race.",
    defaults: { bestWaterGun: 0, bestWaterGunScore: 0 },
    onShow() { load(); },
    onLeave() { unload(); },
    onReset() {
      const el = frame();
      if (!el) return load();
      setNote("Opening Marina’s harbour…", true);
      el.src = SRC + "?reset=" + Date.now();
    },
  });
})();
