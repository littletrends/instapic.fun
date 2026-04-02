(function () {
  const core = window.InstapicCore;
  let payments = null;
  let card = null;
  let applePay = null;
  let selectedPackage = null;

  function qs(sel) {
    return document.querySelector(sel);
  }

  function setStatus(message) {
    const el = qs("#payment-status");
    if (el) el.textContent = message || "";
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
      if (res.ok && data.ok) {
        window.InstapicGuestIdentity.write({
          ...guest,
          email: data.email || email,
          verified: true,
          guest_profile: data.guest_profile || guest.guest_profile || {}
        });
      }
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
  }

  function moneyLabel(cents) {
    return `$${(Number(cents || 0) / 100).toFixed(2)}`;
  }

  async function refreshApplePay() {
    const btn = ensureApplePayButton();
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

      applePay = await payments.applePay(paymentRequest);

      btn.hidden = false;
      btn.style.display = "block";
      btn.style.visibility = "visible";
      btn.style.opacity = "1";
      setStatus("Apple Pay is available for this device/browser.");
    } catch (err) {
      applePay = null;
      setStatus("Apple Pay unavailable: " + (err?.message || err));
    }
  }

  function selectPackage(pkg) {
    selectedPackage = pkg;
    const panel = qs("#payment-panel");
    const label = qs("#selected-package-label");
    if (panel) panel.hidden = false;
    if (label) {
      label.textContent = `${pkg.name} — ${moneyLabel(pkg.amount_cents)}`;
    }
    refreshApplePay();
  }

  async function payWithCard() {
    if (!card || !selectedPackage) {
      setStatus("Choose a package first.");
      return;
    }

    setStatus("Processing card payment...");

    const tokenResult = await card.tokenize();
    if (tokenResult.status !== "OK") {
      throw new Error("Card tokenization failed");
    }

    const result = await core.payAndCreateTicket({
      package_id: selectedPackage.package_id,
      amount_cents: selectedPackage.amount_cents,
      source_id: tokenResult.token,
      verification_token: tokenResult.verificationToken || null
    });

    await showTicketAndRedirect(result);
  }

  async function payByApplePay() {
    if (!applePay || !selectedPackage) {
      setStatus("Apple Pay is not ready.");
      return;
    }

    setStatus("Processing Apple Pay...");

    const result = await applePay.tokenize();
    if (result.status !== "OK") {
      throw new Error("Apple Pay tokenization failed");
    }

    const payResult = await core.payAndCreateTicket({
      package_id: selectedPackage.package_id,
      amount_cents: selectedPackage.amount_cents,
      source_id: result.token,
      verification_token: result.verificationToken || null
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
          setStatus("Card payment failed: " + (err?.message || err));
        }
      });
    }

    const appleBtn = ensureApplePayButton();
    if (appleBtn) {
      appleBtn.addEventListener("click", async function () {
        try {
          await payByApplePay();
        } catch (err) {
          setStatus("Apple Pay failed: " + (err?.message || err));
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", initPayPage);
})();
