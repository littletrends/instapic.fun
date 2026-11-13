(() => {
  const LAST_KEY = "instapic.lastScreens.v1";
  const SHOW_KEY = "pennyFever.tradeshowLook.v1";
  const TRADESHOW = "/penny-fever/index.html?style=paper&rail=paper&tradeshow=1#aura-tradeshow";
  let skipRecord = false;

  function localUrl(raw) {
    const s = String(raw || "");
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

  function here() {
    return location.pathname + location.search + location.hash;
  }

  function samePlace(a, b) {
    const ua = localUrl(a);
    const ub = localUrl(b);
    if (!ua || !ub) return false;
    return ua.pathname.replace(/\/index\.html$/, "/") === ub.pathname.replace(/\/index\.html$/, "/")
      && ua.search === ub.search
      && ua.hash === ub.hash;
  }

  function isHome(href) {
    const url = localUrl(href);
    if (!url) return false;
    const path = url.pathname.replace(/\/index\.html$/, "/") || "/";
    return (path === "/" || path === "/index.html") && !url.search && !url.hash;
  }

  function isPennyFever(href) {
    const url = localUrl(href);
    return !!(url && url.pathname.indexOf("/penny-fever/") === 0);
  }

  function isTradeshow(href) {
    const url = localUrl(href);
    if (!url || url.pathname.indexOf("/penny-fever/") !== 0) return false;
    return url.hash === "#aura-tradeshow" || url.searchParams.get("tradeshow") === "1";
  }

  function readStack() {
    try {
      const list = JSON.parse(sessionStorage.getItem(LAST_KEY) || "[]");
      return Array.isArray(list) ? list.filter((item) => localUrl(item)) : [];
    } catch (_) {
      return [];
    }
  }

  function writeStack(list) {
    try { sessionStorage.setItem(LAST_KEY, JSON.stringify(list.slice(-12))); } catch (_) {}
  }

  function previousHref() {
    const stack = readStack();
    const now = here();
    for (let i = stack.length - 1; i >= 0; i--) {
      if (!samePlace(stack[i], now)) return stack[i];
    }
    try {
      if (document.referrer) {
        const ref = new URL(document.referrer);
        if (ref.origin === location.origin) {
          const href = ref.pathname + ref.search + ref.hash;
          if (href && !samePlace(href, now)) return href;
        }
      }
    } catch (_) {}
    return "";
  }

  function rememberHere() {
    if (skipRecord) return;
    if (isPennyFever(here())) return;
    const stack = readStack();
    const now = here();
    if (!now || samePlace(stack[stack.length - 1], now)) return;
    stack.push(now);
    writeStack(stack);
  }

  function readShow() {
    try {
      const data = JSON.parse(sessionStorage.getItem(SHOW_KEY) || "null");
      if (data && isTradeshow(data.href)) return data.href;
    } catch (_) {}
    return "";
  }

  function hrefOf(url) {
    return url.pathname + url.search + url.hash;
  }

  function rememberShow(raw) {
    const url = localUrl(raw);
    const href = url && isTradeshow(hrefOf(url)) ? hrefOf(url) : TRADESHOW;
    try { sessionStorage.setItem(SHOW_KEY, JSON.stringify({ v: 1, href, at: Date.now() })); } catch (_) {}
    return href;
  }

  function detectShow() {
    const params = new URLSearchParams(location.search);
    const ret = localUrl(params.get("return") || "");
    if (ret && isTradeshow(hrefOf(ret))) rememberShow(hrefOf(ret));
    if (readShow()) return;
    try {
      if (document.referrer) {
        const ref = new URL(document.referrer);
        if (ref.origin === location.origin && isTradeshow(hrefOf(ref))) rememberShow(hrefOf(ref));
      }
    } catch (_) {}
  }

  function row() {
    let el = document.querySelector(".page-back");
    if (el) return el;
    el = document.createElement("p");
    el.className = "page-back";
    const start = document.createElement("a");
    start.className = "btn";
    start.href = "index.html";
    start.textContent = "Back to start";
    el.append(start);
    const footer = document.querySelector(".site-footer");
    if (footer && footer.parentNode) footer.parentNode.insertBefore(el, footer);
    else (document.querySelector("main") || document.body).append(el);
    return el;
  }

  function addPill(host, kind, href, label) {
    if (host.querySelector(`[data-page-${kind}]`)) return;
    const a = document.createElement("a");
    a.className = "btn";
    a.setAttribute("data-page-" + kind, "true");
    a.href = href;
    a.textContent = label;
    a.addEventListener("click", (event) => {
      if (kind === "last") {
        event.preventDefault();
        skipRecord = true;
        const stack = readStack();
        const now = here();
        while (stack.length && samePlace(stack[stack.length - 1], now)) stack.pop();
        const prev = stack.pop() || href;
        writeStack(stack);
        try {
          const ref = document.referrer ? new URL(document.referrer) : null;
          if (ref && ref.origin === location.origin
              && samePlace(ref.pathname + ref.search + ref.hash, prev)
              && history.length > 1) {
            history.back();
            return;
          }
        } catch (_) {}
        location.assign(prev || "index.html");
      }
    });
    const start = host.querySelector('a[href="index.html"], a[href="/index.html"], a[href="/"]');
    if (start) host.insertBefore(a, start);
    else host.append(a);
  }

  function paint() {
    if (isPennyFever(here()) || isHome(here())) return;
    detectShow();
    const prev = previousHref();
    const show = readShow() || (isTradeshow(prev) ? prev : "");
    const hosts = document.querySelectorAll(".page-back");
    const list = hosts.length ? hosts : [row()];
    list.forEach((host) => {
      const termsBack = host.querySelector("#terms-history-back");
      if (prev && !isHome(prev) && !samePlace(prev, here()) && !(show && isTradeshow(prev))) {
        addPill(host, "last", prev, "Back to last screen");
        if (termsBack) termsBack.hidden = true;
      }
      if (show && !isTradeshow(here())) {
        addPill(host, "tradeshow", show, "Back to tradeshow");
      }
    });
  }

  function boot() {
    paint();
    window.addEventListener("pagehide", rememberHere);
    window.addEventListener("pageshow", () => {
      skipRecord = false;
      paint();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
