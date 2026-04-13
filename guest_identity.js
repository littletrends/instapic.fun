(function () {
  const KEY = "instapic_guest_identity";
  const API_BASE = "https://motherpc.taild1a44c.ts.net";
  const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
      return {};
    }
  }

  function write(data) {
    const current = read();
    const merged = {
      ...current,
      ...(data || {}),
    };

    if (merged.verified) {
      merged.session_expires_at = Date.now() + SESSION_TTL_MS;
    }

    localStorage.setItem(KEY, JSON.stringify(merged));
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function isVerifiedSessionActive() {
    const current = read();
    return !!(
      current &&
      current.verified &&
      current.email &&
      current.session_expires_at &&
      Date.now() < Number(current.session_expires_at)
    );
  }

  window.InstapicGuestIdentity = {
    API_BASE,
    read,
    write,
    clear,
    isVerifiedSessionActive
  };
})();
