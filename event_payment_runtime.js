// Private-event website bond-first payment hook.
(function () {
  const core = window.InstapicCore;
  let payments = null;
  let card = null;
  let googlePay = null;
  let applePay = null;
  let walletActionKey = "";
  let squareInitPromise = null;
  let walletInitPromise = null;
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
    if (squareInitPromise) return squareInitPromise;
    squareInitPromise = (async () => {
      const panel = qs("#event-payment-panel");
      const appId = panel?.dataset.squareApplicationId;
      const locationId = panel?.dataset.squareLocationId;
      if (!window.Square || !appId || !locationId) {
        throw new Error("Square is not configured");
      }
      payments = window.Square.payments(appId, locationId);
      card = await payments.card();
      await card.attach("#event-card-container");
    })();
    try {
      await squareInitPromise;
    } catch (err) {
      squareInitPromise = null;
      throw err;
    }
  }

  function nextPayment() {
    const bond = state?.security_bond || {};
    const hire = state?.hire_payment || {};
    const bondSatisfied =
      bond.required === false ||
      ["WAIVED", "HELD", "CAPTURED", "CAPTURED_PENDING_RETURN", "PARTIALLY_REFUNDED"].includes(bond.status);
    const hireSatisfied = ["COMPLETED", "NOT_REQUIRED", "WAIVED"].includes(hire.status);
    if (!bondSatisfied) return { action: "bond", amountCents: Number(bond.amount_cents || 0) };
    if (!hireSatisfied) return { action: "hire", amountCents: Number(hire.amount_cents || 0) };
    return null;
  }

  async function initWallets() {
    if (walletInitPromise) return walletInitPromise;
    walletInitPromise = initWalletsOnce();
    try {
      await walletInitPromise;
    } finally {
      walletInitPromise = null;
    }
  }

  async function initWalletsOnce() {
    await initSquare();
    const due = nextPayment();
    const googleTarget = qs("#event-google-pay");
    const appleButton = qs("#event-apple-pay");
    const options = qs("#event-wallet-options");
    if (!due || due.amountCents <= 0) {
      if (options) options.hidden = true;
      return;
    }
    if (options) options.hidden = false;
    const key = `${due.action}:${due.amountCents}`;
    if (walletActionKey === key) return;

    if (googlePay) {
      try { await googlePay.destroy(); } catch (_) {}
      googlePay = null;
    }
    applePay = null;
    if (googleTarget) googleTarget.replaceChildren();
    if (appleButton) appleButton.hidden = true;

    const request = payments.paymentRequest({
      countryCode: "AU",
      currencyCode: "AUD",
      total: {
        amount: (due.amountCents / 100).toFixed(2),
        label: due.action === "bond" ? "Instapic security bond" : "Instapic event hire",
      },
    });

    try {
      googlePay = await payments.googlePay(request);
      await googlePay.attach("#event-google-pay", {
        buttonColor: "black",
        buttonSizeMode: "fill",
        buttonType: "long",
      });
    } catch (err) {
      googlePay = null;
      console.info("Google Pay is unavailable on this device", err);
    }

    try {
      applePay = await payments.applePay(request);
      if (appleButton) {
        appleButton.hidden = false;
        appleButton.style.display = "block";
        appleButton.style.visibility = "visible";
      }
    } catch (err) {
      applePay = null;
      console.info("Apple Pay is unavailable on this device", err);
    }
    walletActionKey = key;
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
    const agreementLink = qs("#event-view-agreement");

    const bondSatisfied =
      bond.required === false ||
      ["WAIVED", "HELD", "CAPTURED", "CAPTURED_PENDING_RETURN", "PARTIALLY_REFUNDED"].includes(bond.status);
    const hireSatisfied = ["COMPLETED", "NOT_REQUIRED", "WAIVED"].includes(hire.status);
    if (agreementLink) {
      const agreementUrl = String(state.agreementUrl || "");
      const validAgreement = agreementUrl.startsWith(
        "https://instapic.fun/event-contract.html?token="
      );
      agreementLink.hidden = !validAgreement;
      if (validAgreement) agreementLink.href = agreementUrl;
    }

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
    initWallets().catch((err) => console.info("Digital wallets unavailable", err));
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

  async function tokenize(method = card) {
    await initSquare();
    const result = await method.tokenize();
    if (result.status !== "OK" || !result.token) {
      const message = result.errors?.map((e) => e.message).filter(Boolean).join("; ");
      throw new Error(message || result.status || "Card tokenisation failed");
    }
    return result;
  }

  async function authoriseBond(method = card) {
    if (busy) return;
    busy = true;
    try {
      status("Authorising the security bond…");
      const token = await tokenize(method);
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

  async function payHire(method = card) {
    if (busy) return;
    busy = true;
    try {
      await refresh();
      if (state.security_bond?.required !== false && state.security_bond?.status !== "HELD") {
        throw new Error("Security bond must be held first");
      }
      status("Processing the event hire payment…");
      const token = await tokenize(method);
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
      agreementUrl: detail.event?.booking_agreement_url || "",
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
    qs("#event-authorise-bond")?.addEventListener("click", () => authoriseBond(card));
    qs("#event-pay-hire")?.addEventListener("click", () => payHire(card));
    qs("#event-google-pay")?.addEventListener("click", () => {
      const due = nextPayment();
      if (!googlePay || !due) return;
      if (due.action === "bond") authoriseBond(googlePay);
      else payHire(googlePay);
    });
    qs("#event-apple-pay")?.addEventListener("click", () => {
      const due = nextPayment();
      if (!applePay || !due) return;
      if (due.action === "bond") authoriseBond(applePay);
      else payHire(applePay);
    });
  });
})();
