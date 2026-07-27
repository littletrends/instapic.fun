// Private-event website bond-first payment hook.
(function () {
  const core = window.InstapicCore;
  let payments = null;
  let card = null;
  let state = null;
  let busy = false;

  function qs(selector) {
    return document.querySelector(selector);
  }

  function money(cents) {
    return "$" + (Number(cents || 0) / 100).toFixed(2);
  }

  function status(message) {
    const node = qs("#event-payment-status");
    if (node) node.textContent = message || "";
  }

  async function readJson(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const err = new Error(data.message || data.error || `HTTP ${response.status}`);
      err.payload = data;
      throw err;
    }
    return data;
  }

  async function initSquare() {
    if (payments && card) return;
    const panel = qs("#event-payment-panel");
    const appId = panel?.dataset.squareApplicationId;
    const locationId = panel?.dataset.squareLocationId;
    if (!window.Square || !appId || !locationId) {
      throw new Error("Square is not configured");
    }
    payments = window.Square.payments(appId, locationId);
    card = await payments.card();
    await card.attach("#event-card-container");
  }

  function render() {
    if (!state) return;
    const bond = state.security_bond || {};
    const hire = state.hire_payment || {};
    const bondSummary = qs("#event-bond-summary");
    const hireSummary = qs("#event-hire-summary");
    const form = qs("#event-payment-form");
    const bondButton = qs("#event-authorise-bond");
    const hireButton = qs("#event-pay-hire");

    const bondSatisfied =
      bond.required === false ||
      ["WAIVED", "HELD", "CAPTURED", "CAPTURED_PENDING_RETURN", "PARTIALLY_REFUNDED"].includes(bond.status);
    const hireSatisfied = ["COMPLETED", "NOT_REQUIRED", "WAIVED"].includes(hire.status);

    if (bondSummary) {
      if (bond.status === "HELD") {
        bondSummary.textContent =
          `${money(bond.amount_cents)} authorised—not charged` +
          (bond.expires_at ? ` · valid until ${new Date(bond.expires_at).toLocaleString()}` : "");
      } else if (bond.status === "RELEASED") {
        bondSummary.textContent = "Released by Instapic";
      } else if (bond.status === "REFUNDED") {
        bondSummary.textContent = "Captured bond refunded";
      } else if (bond.required === false || bond.status === "WAIVED") {
        bondSummary.textContent = "Not required";
      } else {
        bondSummary.textContent = `${money(bond.amount_cents)} authorisation required`;
      }
    }

    if (hireSummary) {
      const priceDetail = state.totalPriceCents
        ? `Total ${money(state.totalPriceCents)} · deposit ${money(state.depositCents)} · `
        : "";
      hireSummary.textContent = priceDetail + (
        hireSatisfied
          ? (hire.status === "COMPLETED" ? `${money(hire.amount_cents)} balance paid ✅` : "No balance due")
          : `${money(hire.amount_cents)} balance due`
      );
    }

    if (form) form.hidden = bondSatisfied && hireSatisfied;
    if (bondButton) {
      bondButton.hidden = bondSatisfied;
      bondButton.textContent = `Authorise ${money(bond.amount_cents)} security bond`;
    }
    if (hireButton) {
      hireButton.hidden = !bondSatisfied || hireSatisfied;
      hireButton.textContent = `Pay ${money(hire.amount_cents)} event hire`;
    }
    if (bondSatisfied && hireSatisfied) {
      status("Event payment complete — ready for booth activation ✅");
    } else if (bondSatisfied) {
      status("Security bond held. Complete the hire payment below.");
    } else {
      status("The security bond must be authorised before the hire payment.");
    }
  }

  async function refresh() {
    if (!state?.eventCode || !state?.pin) return;
    const data = await readJson(await fetch(
      `${core.API_BASE}/api/event-bond/status/${encodeURIComponent(state.eventCode)}` +
      `?pin=${encodeURIComponent(state.pin)}`,
      { cache: "no-store" }
    ));
    state.security_bond = data.security_bond || {};
    state.hire_payment = data.hire_payment || {};
    state.payment_ready = !!data.payment_ready;
    render();
  }

  async function tokenize() {
    await initSquare();
    const result = await card.tokenize();
    if (result.status !== "OK" || !result.token) {
      const message = result.errors?.map((e) => e.message).filter(Boolean).join("; ");
      throw new Error(message || result.status || "Card tokenisation failed");
    }
    return result;
  }

  function termsAccepted() {
    if (qs("#event-terms-accepted")?.checked) return true;
    status("Please accept the event hire and security terms first.");
    return false;
  }

  async function authoriseBond() {
    if (busy || !termsAccepted()) return;
    busy = true;
    try {
      status("Authorising the security bond…");
      const token = await tokenize();
      await readJson(await fetch(`${core.API_BASE}/api/event-bond/authorise-online`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_code: state.eventCode,
          pin: state.pin,
          source_id: token.token,
          verification_token: token.verificationToken || null,
          request_key: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        }),
      }));
      status("Security bond authorised ✅");
      await refresh();
    } catch (err) {
      status("Security bond was not approved: " + String(err?.message || err));
    } finally {
      busy = false;
    }
  }

  async function payHire() {
    if (busy || !termsAccepted()) return;
    busy = true;
    try {
      await refresh();
      if (state.security_bond?.required !== false && state.security_bond?.status !== "HELD") {
        throw new Error("Security bond must be held first");
      }
      status("Processing the event hire payment…");
      const token = await tokenize();
      await readJson(await fetch(`${core.API_BASE}/api/event-hire/pay-online`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_code: state.eventCode,
          pin: state.pin,
          source_id: token.token,
          verification_token: token.verificationToken || null,
          request_key: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        }),
      }));
      status("Event hire payment completed ✅");
      await refresh();
    } catch (err) {
      status("Hire payment failed: " + String(err?.message || err));
    } finally {
      busy = false;
    }
  }

  document.addEventListener("instapic:event-portal-loaded", async (event) => {
    const detail = event.detail || {};
    state = {
      pin: detail.pin,
      eventCode: detail.event?.event_code,
      totalPriceCents: Number(detail.event?.price_cents || 0),
      depositCents: Number(detail.event?.booking_deposit_cents || 0),
      security_bond: detail.security_bond || {},
      hire_payment: detail.hire_payment || {},
      payment_ready: !!detail.payment_ready,
    };
    render();
    try {
      await initSquare();
      await refresh();
    } catch (err) {
      status("Payment service unavailable: " + String(err?.message || err));
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    qs("#event-authorise-bond")?.addEventListener("click", authoriseBond);
    qs("#event-pay-hire")?.addEventListener("click", payHire);
  });
})();
