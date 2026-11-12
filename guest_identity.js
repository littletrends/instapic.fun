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

    if (merged.verified) {
      const now = Date.now();
      // A fresh sign-in (code or password) starts a new 12 h window; other writes keep the original start.
      const fresh = !activeRecord(current)
        || String(current.email || "").toLowerCase() !== String(merged.email || "").toLowerCase()
        || (data && data.verified === true && data.verification_started === false && !("session_started_at" in data));
      if (fresh || !Number(merged.session_started_at)) merged.session_started_at = now;
      merged.session_expires_at = Math.min(now + SESSION_TTL_MS, Number(merged.session_started_at) + SESSION_CAP_MS);
    }

    localStorage.setItem(KEY, JSON.stringify(merged));
  }

  /** Slide the session after a successful server save. untilMs comes from motherpc (already capped at 12 h). */
  function extendSession(untilMs) {
    const current = read();
    if (!activeRecord(current)) return false;
    const start = Number(current.session_started_at) || (Number(current.session_expires_at) - SESSION_TTL_MS);
    const target = Number(untilMs) || (Date.now() + SESSION_TTL_MS);
    const next = Math.min(target, start + SESSION_CAP_MS);
    if (next > Number(current.session_expires_at)) {
      current.session_started_at = start;
      current.session_expires_at = next;
      localStorage.setItem(KEY, JSON.stringify(current));
    }
    return true;
  }

  function clear() {
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
})();
