(function () {
  const API_BASE = "https://motherpc.taild1a44c.ts.net";

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function dataPage() {
    return document.body?.dataset?.page || "";
  }

  function showFlash(message, level = "error") {
    const el = qs("#flash");
    if (!el) {
      console.warn("[InstapicCore flash]", level, message);
      return;
    }
    el.hidden = false;
    el.textContent = message;
    el.className = `flash flash-${level}`;
  }

  async function readJson(res) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Invalid server response (${res.status})`);
    }
  }

  async function createTicket(packageId, amountCents, source = "website_test_bypass") {
    const res = await fetch(`${API_BASE}/api/create-ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        package_id: packageId,
        amount_cents: amountCents,
        source: source
      })
    });

    const data = await readJson(res);

    if (!res.ok || data.ok === false) {
      throw new Error(data.error || data.reason || `HTTP ${res.status}`);
    }

    const code = data.ticket_code || data.code || data.ticketCode;
    if (!code) {
      throw new Error("No code returned from MotherPC");
    }

    return {
      ok: true,
      code: String(code)
    };
  }

  async function getBonus(code) {
    const clean = String(code || "").trim();
    if (!/^\d{6}$/.test(clean)) {
      throw new Error("Enter a valid 6-digit code");
    }

    const res = await fetch(`${API_BASE}/api/get-bonus/${encodeURIComponent(clean)}`);
    const data = await readJson(res);

    if (!res.ok || data.ok === false) {
      throw new Error(data.error || data.reason || `HTTP ${res.status}`);
    }

    return data;
  }

  window.InstapicCore = {
    API_BASE,
    qs,
    qsa,
    dataPage,
    showFlash,
    createTicket,
    getBonus
  };
})();
