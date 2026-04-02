(function () {
  const core = window.InstapicCore;
  let payments = null;
  let card = null;
  let applePay = null;
  let selectedPackage = null;
  let debugLines = [];

  function qs(sel) {
    return document.querySelector(sel);
  }

  function renderStatus(message) {
    const el = qs("#payment-status");
    if (!el) return;
    const lines = [];
    if (message) lines.push(String(message));
    if (debugLines.length) {
      lines.push("");
      lines.push("--- debug ---");
      lines.push(...debugLines.slice(-12));
    }
    el.textContent = lines.join("\n");
  }

  function setStatus(message) {
    renderStatus(message || "");
  }

  function appendDebug(message) {
    debugLines.push(String(message || ""));
    renderStatus(qs("#payment-status")?.textContent?.split("\n\n--- debug ---\n")[0] || "");
  }

  function describeError(err) {
    if (!err) return "Unknown error";
    if (typeof err === "string") return err;
    if (err.message) return err.message;
    if (err.error) return err.error;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }

  function ensureApplePayButton() {
    function styleApplePayButton(btn) {
      btn.type = "button";
      btn.hidden = true;
      btn.style.display = "none";

      btn.style.webkitAppearance = "none";
      btn.style.setProperty("-webkit-appearance", "none");
      btn.style.appearance = "none";

      btn.style.width = "100%";
      btn.style.maxWidth = "320px";
      btn.style.minHeight = "52px";
      btn.style.border = "1px solid rgba(255,255,255,0.18)";
      btn.style.borderRadius = "14px";
      btn.style.margin = "0";
      btn.style.cursor = "pointer";
      btn.style.padding = "0 18px";
      btn.style.background = "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))";
      btn.style.backgroundColor = "rgba(255,255,255,0.06)";
      btn.style.color = "#ffffff";
      btn.style.fontSize = "1rem";
      btn.style.fontWeight = "700";
      btn.style.letterSpacing = "0.04em";
      btn.style.textTransform = "none";
      btn.style.boxShadow = "inset 0 0 12px rgba(255,255,255,0.06), 0 6px 18px rgba(0,0,0,0.28)";
      btn.textContent = "Apple Pay";
      btn.setAttribute("aria-label", "Apple Pay");
      return btn;
    }

    let btn = qs("#apple-pay-button");
    if (btn) return styleApplePayButton(btn);

    const cardContainer = qs("#card-container");
    if (!cardContainer || !cardContainer.parentNode) return null;

    btn = document.createElement("button");
    btn.id = "apple-pay-button";
    cardContainer.parentNode.insertBefore(btn, cardContainer);
    return styleApplePayButton(btn);
  }

  async function attachTicketIfGuestVerified(ticketCode) {
    try {
      const guest = window.InstapicGuestIdentity?.read?.() || {};
      const email = String(guest.email || "").trim();
      const verified = !!guest.verified;

      if (!email || !verified || !ticketCode) return;

      const apiBase = window.InstapicGuestIdentity.API_BASE;
      const res = await fetch(`${apiBase}/api/guest/attach-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ticket_code: ticketCode })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        console.warn("attach-ticket failed", { status: res.status, data });
        return;
      }

      window.InstapicGuestIdentity.write({
        ...guest,
        email: data.email || email,
        verified: true,
        guest_profile: data.guest_profile || guest.guest_profile || {}
      });
    } catch (err) {
      console.warn("attach ticket failed", err);
    }
  }

  async function showTicketAndRedirect(data) {
    const code = data.ticket_code || data.code;
    const ticketResult = qs("#ticket-result");
    const ticketCode = qs("#ticket-code");

    if (!code) {
      throw new Error("Missing booth code from payment response");
    }

    if (ticketResult) ticketResult.hidden = false;
    if (ticketCode) ticketCode.textContent = code;

    await attachTicketIfGuestVerified(code);
    window.location.href = `ticket.html?code=${encodeURIComponent(code)}`;
  }

  async function initSquare() {
    const panel = qs("#payment-panel");
    if (!panel) return;

    const appId = panel.dataset.squareApplicationId;
    const locationId = panel.dataset.squareLocationId;

    if (!window.Square || !appId || !locationId) {
      setStatus("Square is not configured.");
      return;
    }

    payments = window.Square.payments(appId, locationId);
    card = await payments.card();
    await card.attach("#card-container");
    appendDebug(`DBG initSquare ok appId=${appId ? "yes" : "no"} locationId=${locationId ? "yes" : "no"}`);
  }

  function moneyLabel(cents) {
    return `$${(Number(cents || 0) / 100).toFixed(2)}`;
  }

  async function refreshApplePay() {
    const btn = ensureApplePayButton();
    appendDebug(`DBG refreshApplePay start btn=${!!btn} payments=${!!payments} pkg=${selectedPackage ? selectedPackage.package_id : "none"}`);
    if (!btn || !payments || !selectedPackage) return;

    btn.hidden = true;
    btn.style.display = "none";
    applePay = null;

    try {
      const paymentRequest = payments.paymentRequest({
        countryCode: "AU",
        currencyCode: "AUD",
        total: {
          amount: moneyLabel(selectedPackage.amount_cents),
          label: "Instapic"
        }
      });

      appendDebug(`DBG paymentRequest amount=${moneyLabel(selectedPackage.amount_cents)}`);
      applePay = await payments.applePay(paymentRequest);
      appendDebug("DBG applePay object created");
      btn.hidden = false;
      btn.style.display = "block";
      btn.style.visibility = "visible";
      btn.style.opacity = "1";
      setStatus("Apple Pay is available for this device/browser.");
      appendDebug("DBG apple button shown");
    } catch (err) {
      applePay = null;
      console.error("Apple Pay availability error", err);
      setStatus("Apple Pay unavailable: " + describeError(err));
      appendDebug("DBG applePay create failed: " + describeError(err));
    }
  }

  function selectPackage(pkg) {
    selectedPackage = pkg;
    appendDebug(`DBG package selected id=${pkg.package_id} cents=${pkg.amount_cents}`);
    const panel = qs("#payment-panel");
    const label = qs("#selected-package-label");
    if (panel) panel.hidden = false;
    if (label) {
      label.textContent = `${pkg.name} — ${moneyLabel(pkg.amount_cents)}`;
    }
    refreshApplePay();
  }

  async function payAndCreate(payload) {
    const result = await core.payAndCreateTicket(payload);
    if (!result || !result.ok) {
      throw new Error(result?.error || "Payment bridge failed");
    }
    return result;
  }

  async function payWithCard() {
    if (!card || !selectedPackage) {
      setStatus("Choose a package first.");
      return;
    }

    setStatus("Processing card payment...");

    const tokenResult = await card.tokenize();
    console.log("Card tokenize result", tokenResult);

    if (tokenResult.status !== "OK") {
      const msg =
        tokenResult.errors?.map(e => e.message).filter(Boolean).join("; ") ||
        tokenResult.status ||
        "Card tokenization failed";
      throw new Error(msg);
    }

    const result = await payAndCreate({
      package_id: selectedPackage.package_id,
      amount_cents: selectedPackage.amount_cents,
      source_id: tokenResult.token,
      verification_token: tokenResult.verificationToken || null
    });

    await showTicketAndRedirect(result);
  }

  async function payByApplePay() {
    appendDebug(`DBG payByApplePay enter applePay=${!!applePay} pkg=${selectedPackage ? selectedPackage.package_id : "none"}`);
    if (!applePay || !selectedPackage) {
      setStatus("Apple Pay is not ready.");
      appendDebug("DBG payByApplePay early return");
      return;
    }

    setStatus("Processing Apple Pay...");
    appendDebug("DBG before tokenize");
    appendDebug("DBG origin=" + window.location.origin);
    appendDebug("DBG href=" + window.location.href);
    appendDebug("DBG ua=" + navigator.userAgent);
    appendDebug("DBG ApplePaySession=" + (!!window.ApplePaySession));
    try {
      if (window.ApplePaySession && typeof window.ApplePaySession.canMakePayments === "function") {
        appendDebug("DBG canMakePayments=" + window.ApplePaySession.canMakePayments());
      }
    } catch (e) {
      appendDebug("DBG canMakePayments err=" + (e?.message || String(e)));
    }

    let tokenResult;
    try {
      tokenResult = await applePay.tokenize();
    } catch (err) {
      appendDebug("DBG tokenize threw");
      appendDebug("DBG tokenize err name=" + (err?.name || "none"));
      appendDebug("DBG tokenize err msg=" + (err?.message || String(err)));
      appendDebug("DBG tokenize err code=" + (err?.code || "none"));
      try {
        appendDebug("DBG tokenize err json=" + JSON.stringify(err));
      } catch (_) {
        appendDebug("DBG tokenize err json=unserializable");
      }
      throw err;
    }

    console.log("Apple Pay tokenize result", tokenResult);
    appendDebug(`DBG tokenize status=${tokenResult?.status || "unknown"}`);
    appendDebug(`DBG tokenize token=${tokenResult?.token ? "yes" : "no"}`);
    appendDebug(`DBG tokenize errors=${tokenResult?.errors?.map(e => e.message).join(" | ") || "none"}`);

    if (tokenResult.status !== "OK") {
      const msg =
        tokenResult.errors?.map(e => e.message).filter(Boolean).join("; ") ||
        tokenResult.status ||
        "Apple Pay tokenization failed";
      throw new Error(msg);
    }

    const payResult = await payAndCreate({
      package_id: selectedPackage.package_id,
      amount_cents: selectedPackage.amount_cents,
      source_id: tokenResult.token,
      verification_token: tokenResult.verificationToken || null
    });

    await showTicketAndRedirect(payResult);
  }

  async function initPayPage() {
    const page = document.body?.dataset?.page || "";
    if (page !== "pay") return;

    await initSquare();

    const pkgButtons = Array.from(document.querySelectorAll(".package-card[data-package-id]"));
    pkgButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        appendDebug(`DBG pkg button click dom=${btn.dataset.packageId}`);
        selectPackage({
          package_id: btn.dataset.packageId,
          amount_cents: Number(btn.dataset.amountCents || 0),
          name: btn.querySelector(".pkg-name")?.textContent?.trim() || "Instapic Package"
        });
      });
    });

    const cardBtn = qs("#card-pay-button");
    if (cardBtn) {
      cardBtn.addEventListener("click", async function () {
        try {
          await payWithCard();
        } catch (err) {
          console.error("Card payment error", err);
          setStatus("Card payment failed: " + describeError(err));
        }
      });
    }

    const appleBtn = ensureApplePayButton();
    if (appleBtn) {
      ["click","touchstart","pointerdown"].forEach((evt) => {
        appleBtn.addEventListener(evt, function () {
          appendDebug("DBG apple btn event=" + evt);
        }, { passive: true });
      });

      appleBtn.addEventListener("click", async function () {
        appendDebug("DBG apple button click");
        try {
          await payByApplePay();
        } catch (err) {
          console.error("Apple Pay error", err);
          setStatus("Apple Pay failed: " + describeError(err));
          appendDebug("DBG apple click catch: " + describeError(err));
        }
      });
      appendDebug("DBG apple button listener attached");
    } else {
      appendDebug("DBG apple button missing at init");
    }
  }

  document.addEventListener("DOMContentLoaded", initPayPage);
})();
