(function () {
  const BASE = "https://motherpc.taild1a44c.ts.net";

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function getCodeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("code") || "";
  }

  function showFlash(message, type = "error") {
    const flash = qs("#flash");
    if (!flash) return;
    flash.innerHTML = `<div class="flash-${type}">${message}</div>`;
    flash.hidden = false;
  }

  function hideFlash() {
    const flash = qs("#flash");
    if (!flash) return;
    flash.hidden = true;
    flash.innerHTML = "";
  }

  async function postJSON(path, payload) {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {}

    return { res, data };
  }

  async function getJSON(path) {
    const res = await fetch(`${BASE}${path}`);
    let data = {};
    try {
      data = await res.json();
    } catch (_) {}
    return { res, data };
  }

  async function createTicket(packageId, amountCents, source = "website_test_bypass") {
    const { res, data } = await postJSON("/api/create-ticket", {
      package_id: packageId,
      amount_cents: amountCents,
      source
    });

    if (!res.ok) {
      throw new Error(data.error || `Server error (${res.status})`);
    }

    const code = data.ticket_code || data.code || "";
    if (!code) {
      throw new Error("MotherPC did not return a ticket code");
    }

    return { code, raw: data };
  }

  async function getBonus(code) {
    const { res, data } = await getJSON(`/api/get-bonus/${encodeURIComponent(code)}`);
    if (!res.ok || !data.ok) {
      throw new Error(data.error || `Server error (${res.status})`);
    }
    return data;
  }

  function dataPage() {
    return document.body.getAttribute("data-page") || "";
  }

  window.InstapicCore = {
    BASE,
    qs,
    qsa,
    getCodeFromUrl,
    showFlash,
    hideFlash,
    createTicket,
    getBonus,
    dataPage
  };

  console.log("[core] site_core.js loaded");
})();
