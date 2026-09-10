/* id=lookup · Celeste · Starlight observatory locked as the booth game (2026-09-09).
 * Alley sign stays "Star-Gazing Tent" until the later rename. Old 3D lantern flight
 * is in .local-backups/lookup-stargaze-2026-09-09.tgz. PF only. Never booth/port 6000. */
(function boot() {
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) {
    requestAnimationFrame(boot);
    return;
  }

  const SRC = "experiments/celestes-starlight/";

  function frame() {
    return document.getElementById("lookupStarlightFrame");
  }
  function note() {
    return document.getElementById("lookupStarlightNote");
  }
  function setNote(text, showBack) {
    const el = note();
    if (!el) return;
    const copy = el.querySelector("[data-starlight-status]");
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
      setNote("The observatory stage is missing. Step back to the alley.", true);
      return;
    }
    setNote("Opening Celeste’s observatory…", true);
    el.onload = () => {
      const loaded = !!(el.src && !el.src.endsWith("about:blank"));
      if (loaded) setNote("", false);
      try { if (loaded) el.contentWindow.focus(); } catch (_) { /* same origin */ }
    };
    el.onerror = () => {
      setNote("The observatory could not open. Step back to the alley and try again.", true);
    };
    el.src = SRC;
  }

  PF.registerVendor({
    id: "lookup",
    playKey: "lookup",
    chalk: "Celeste’s Starlight — turn the glasses, guide the night home.",
    defaults: { bestLookupTiers: 0, bestLookupScore: 0 },
    onShow() { load(); },
    onLeave() { unload(); },
    onReset() {
      const el = frame();
      if (!el) return load();
      setNote("Opening Celeste’s observatory…", true);
      el.src = SRC + "?reset=" + Date.now();
    },
  });
})();
