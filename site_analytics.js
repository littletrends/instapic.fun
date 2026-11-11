(function () {
  "use strict";
  const API = "https://motherpc.taild1a44c.ts.net/api/site-analytics";
  const STORAGE_KEY = "instapic.analytics.visitor.v1";
  const EXCLUDE_KEY = "instapic.analytics.excluded.v1";
  const ROTATE_MS = 30 * 24 * 60 * 60 * 1000;

  const controls = new URLSearchParams(location.search);
  const analyticsControl = controls.get("instapic_analytics");
  try {
    if (analyticsControl === "exclude") localStorage.setItem(EXCLUDE_KEY, "true");
    if (analyticsControl === "include") localStorage.removeItem(EXCLUDE_KEY);
  } catch (_) {}
  if (analyticsControl) {
    controls.delete("instapic_analytics");
    const cleanQuery = controls.toString();
    history.replaceState(null, "", `${location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}${location.hash}`);
  }
  let excluded = false;
  try { excluded = localStorage.getItem(EXCLUDE_KEY) === "true"; } catch (_) {}
  if (excluded) {
    window.InstapicAnalytics = { track: function () {} };
    return;
  }

  function visitorId() {
    const now = Date.now();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && saved.id && now - Number(saved.created || 0) < ROTATE_MS) return saved.id;
      const id = (crypto.randomUUID ? crypto.randomUUID() : `${now}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, created: now }));
      return id;
    } catch (_) {
      return `session-${now}-${Math.random().toString(36).slice(2)}`;
    }
  }

  const visitor = visitorId();
  const page = location.pathname.split("/").pop() || "index.html";

  function track(event, extra) {
    const payload = Object.assign({ event, page }, extra || {});
    const body = JSON.stringify(payload);
    fetch(API, {
      method: "POST",
      mode: "cors",
      keepalive: true,
      headers: { "Content-Type": "application/json", "X-Instapic-Visitor": visitor },
      body
    }).catch(() => {});
  }

  window.InstapicAnalytics = { track };
  track("page_view");

  document.addEventListener("click", function (event) {
    const control = event.target.closest("a,button,[role='button']");
    if (!control) return;
    const href = control.getAttribute("href") || "";
    const cleanTarget = href ? href.split("?")[0].split("#")[0] : "";
    const label = (control.getAttribute("aria-label") || control.textContent || control.id || "button")
      .replace(/\s+/g, " ").trim().slice(0, 100);
    let kind = "click";
    if (control.hasAttribute("download") || /download/i.test(label)) kind = "download";
    else if (/share|instagram|facebook|\bx\b/i.test(label)) kind = "share";
    track(kind, { label, target: cleanTarget });
  }, true);
})();
