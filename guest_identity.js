(function () {
  const KEY = "instapic_guest_identity";
  const API_BASE = "https://motherpc.taild1a44c.ts.net";
  const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour, sliding while Penny Fever saves succeed
  const SESSION_CAP_MS = 12 * 60 * 60 * 1000; // never more than 12 hours from sign-in (matches motherpc.py)

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
      return {};
    }
  }

  function activeRecord(current) {
    return !!(
      current &&
      current.verified &&
      current.session_token &&
      current.email &&
      current.session_expires_at &&
      Date.now() < Number(current.session_expires_at)
    );
  }

  function write(data) {
    const current = read();
    const merged = {
      ...current,
      ...(data || {}),
    };

    if (String(current.email || "").toLowerCase() !== String(merged.email || "").toLowerCase() && !data?.session_token) {
      delete merged.session_token;
      delete merged.session_started_at;
      delete merged.session_expires_at;
    }

    localStorage.setItem(KEY, JSON.stringify(merged));
  }

  /** Slide the session after a successful server save. untilMs comes from motherpc (already capped at 12 h). */
  function extendSession(untilMs) {
    const current = read();
    if (!activeRecord(current)) return false;
    const start = Number(current.session_started_at) || (Number(current.session_expires_at) - SESSION_TTL_MS);
    const target = Number(untilMs);
    if (!Number.isFinite(target) || target <= Date.now()) return false;
    const next = Math.min(target, start + SESSION_CAP_MS);
    if (next > Number(current.session_expires_at)) {
      current.session_started_at = start;
      current.session_expires_at = next;
      localStorage.setItem(KEY, JSON.stringify(current));
    }
    return true;
  }

  function clear() {
    const token = read().session_token;
    if (token) window.fetch(`${API_BASE}/api/guest/logout`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, keepalive: true
    }).catch(() => {});
    localStorage.removeItem(KEY);
  }

  function isVerifiedSessionActive() {
    return activeRecord(read());
  }

  window.InstapicGuestIdentity = {
    API_BASE,
    read,
    write,
    clear,
    isVerifiedSessionActive,
    extendSession
  };

  // Existing game callers share this wrapper. Never forward credentials to
  // another origin, a redirect, or an unrelated MotherPC API.
  const originalFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url, location.href);
    const current = read();
    if (url.origin === API_BASE && /^\/api\/(guest\/|penny-fever\/)/.test(url.pathname) && activeRecord(current)) {
      const options = { ...(init || {}) };
      const headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
      headers.set("Authorization", `Bearer ${current.session_token}`);
      options.headers = headers;
      options.redirect = "error";
      return originalFetch(input, options);
    }
    return originalFetch(input, init);
  };
})();
