(function () {
  function safeReturn(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";
    if (/^[a-z]+:/i.test(s) || s.startsWith("//") || s.includes("\\") || s.includes("..")) return "";
    if (!(s.startsWith("/") || s.startsWith("penny-fever/") || s.startsWith("./penny-fever") || s.startsWith("my-instapic"))) {
      return "";
    }
    return s;
  }

  function loginNext(fallback) {
    const params = new URLSearchParams(window.location.search);
    const ret = safeReturn(params.get("return"));
    if (ret) return ret;
    const ticket = String(params.get("ticket_code") || "").replace(/\D+/g, "").slice(0, 6);
    const base = fallback || "my-instapic.html";
    if (ticket) return base + (base.includes("?") ? "&" : "?") + "ticket_code=" + encodeURIComponent(ticket);
    return base;
  }

  function withReturn(path) {
    const params = new URLSearchParams(window.location.search);
    const next = new URL(path, window.location.href);
    ["ticket_code", "return"].forEach((key) => {
      const value = params.get(key);
      if (value) next.searchParams.set(key, value);
    });
    return next.pathname.replace(/^\//, "") + next.search + next.hash;
  }

  window.InstapicVipReturn = { safeReturn, loginNext, withReturn };
})();
