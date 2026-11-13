(function () {
  const RETURN_PATHS = new Set([
    "/my-instapic.html",
    "/penny-fever/",
    "/penny-fever/index.html"
  ]);

  function localUrl(raw) {
    const s = String(raw || "");
    // Check before URL parsing: browsers discard tabs/newlines in URLs.
    if (!s || /[\u0000-\u0020\u007f\\]/.test(s)
        || /^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith("//")) return null;
    try {
      const url = new URL(s, new URL("/", window.location.href));
      if (url.origin !== window.location.origin || url.username || url.password) return null;
      return url;
    } catch (_) {
      return null;
    }
  }

  function safeReturn(raw) {
    const url = localUrl(raw);
    if (!url || !RETURN_PATHS.has(url.pathname)) return "";
    return url.pathname + url.search + url.hash;
  }

  function loginNext(fallback) {
    const params = new URLSearchParams(window.location.search);
    const ret = safeReturn(params.get("return"));
    if (ret) return ret;
    const ticket = String(params.get("ticket_code") || "").replace(/\D+/g, "").slice(0, 6);
    const base = safeReturn(fallback) || "/my-instapic.html";
    const next = new URL(base, window.location.href);
    if (ticket) next.searchParams.set("ticket_code", ticket);
    return next.pathname + next.search + next.hash;
  }

  function withReturn(path) {
    const params = new URLSearchParams(window.location.search);
    const candidate = localUrl(path);
    const next = candidate?.pathname === "/verify.html"
      ? candidate : new URL("/verify.html", window.location.href);
    // Do not carry unchecked return values into the email-code page.
    next.searchParams.delete("return");
    next.searchParams.delete("ticket_code");
    const ret = safeReturn(params.get("return"));
    const ticket = String(params.get("ticket_code") || "").replace(/\D+/g, "").slice(0, 6);
    if (ret) next.searchParams.set("return", ret);
    if (ticket) next.searchParams.set("ticket_code", ticket);
    return next.pathname + next.search + next.hash;
  }

  window.InstapicVipReturn = { safeReturn, loginNext, withReturn };
})();
