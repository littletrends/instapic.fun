(function () {
  let selectedPackageId = null;
  let selectedAmountCents = 0;
  let selectedLabel = "";
  let payments = null;
  let card = null;
  let applePay = null;
  let cardMounted = false;

  function qs(sel) {
    return document.querySelector(sel);
  }

  function qsa(sel) {
    return Array.from(document.querySelectorAll(sel));
  }

  function setStatus(message) {
    const el = qs("#payment-status");
    if (el) el.textContent = message || "";
  }

  function packageLabel(packageId, amountCents) {
    const dollars = `$${(Number(amountCents || 0) / 100).toFixed(2).replace(/\.00$/, "")}`;
    const labels = {
      P1_STRIP: `${dollars} Strip`,
      P2_STRIP_GIF: `${dollars} Strip + GIF`,
      P3_STRIP_GIF: `${dollars} Premium`,
    };
    return labels[packageId] || `${packageId} — ${dollars}`;
  }

  function explainTokenizeFailure(result, label) {
    const errors = (result && result.errors) || [];
    const msg = errors.map((e) => e.message).filter(Boolean).join(" | ");
    return msg || `${label} tokenization failed`;
  }

  function ensureApplePayButton() {
    function styleApplePayButton(btn) {
      btn.type = "button";
      btn.hidden = true;
      btn.style.display = "none";

      btn.style.webkitAppearance = "-apple-pay-button";
      btn.style.setProperty("-webkit-appearance", "-apple-pay-button");
      btn.style.setProperty("-apple-pay-button-type", "buy");
      btn.style.setProperty("-apple-pay-button-style", "white-outline");

      btn.style.appearance = "none";
      btn.style.width = "100%";
      btn.style.maxWidth = "320px";
      btn.style.minHeight = "48px";
      btn.style.border = "0";
      btn.style.borderRadius = "12px";
      btn.style.margin = "0 0 16px 0";
      btn.style.cursor = "pointer";
      btn.style.padding = "0";
      btn.style.backgroundColor = "black";
      return btn;
    }

    let btn = qs("#apple-pay-button");
    if (btn) return styleApplePayButton(btn);

    const paymentPanel = qs("#payment-panel");
    const cardContainer = qs("#card-container");
    if (!paymentPanel || !cardContainer || !cardContainer.parentNode) return null;

    btn = document.createElement("button");
    btn.id = "apple-pay-button";

    styleApplePayButton(btn);
    cardContainer.parentNode.insertBefore(btn, cardContainer);
    return btn;
  }

  function buildPaymentRequest() {
    if (!payments || !selectedAmountCents) return null;

    return payments.paymentRequest({
      countryCode: "AU",
      currencyCode: "AUD",
      total: {
        amount: (selectedAmountCents / 100).toFixed(2),
        label: selectedLabel || "Instapic session"
      }
    });
  }

  async function ensureSquareCard(panel) {
    if (cardMounted && card) return card;

    const appId = panel?.dataset?.squareApplicationId || "";
    const locationId = panel?.dataset?.squareLocationId || "";

    if (!window.Square) {
      throw new Error("Square.js did not load");
    }
    if (!appId || !locationId) {
      throw new Error("Square app ID or location ID missing from page");
    }

    payments = window.Square.payments(appId, locationId);

    card = await payments.card();
    await card.attach("#card-container");
    cardMounted = true;
    return card;
  }

  async function setupApplePayForCurrentSelection() {
    const btn = ensureApplePayButton();
    if (!btn || !payments || !selectedAmountCents) return;

    btn.hidden = true;
    btn.style.display = "none";
    applePay = null;

    try {
      const paymentRequest = buildPaymentRequest();
      if (!paymentRequest) return;

      applePay = await payments.applePay(paymentRequest);

      btn.hidden = false;
      btn.style.display = "block";
      btn.style.visibility = "visible";
      btn.style.opacity = "1";
      setStatus("Apple Pay is available for this device/browser.");
    } catch (err) {
      applePay = null;
      btn.hidden = true;
      btn.style.display = "none";
      const msg = err && err.message ? err.message : String(err);
      setStatus("Apple Pay unavailable: " + msg);
      console.error("[ApplePay] unavailable:", err);
    }
  }

  async function postPayment(sourceId, sourceType, verificationToken) {
    const core = window.InstapicCore;
    return core.payAndCreateTicket({
      package_id: selectedPackageId,
      amount_cents: selectedAmountCents,
      source_id: sourceId,
      source_type: sourceType || "card",
      verification_token: verificationToken || null,
    });
  }

  function showTicketAndRedirect(data) {
    const ticketResult = qs("#ticket-result");
    const ticketCode = qs("#ticket-code");

    if (ticketCode) ticketCode.textContent = data.code;
    if (ticketResult) ticketResult.hidden = false;

    setStatus("Payment approved. Creating your booth code…");

    setTimeout(() => {
      window.location.href = `ticket.html?code=${encodeURIComponent(data.code)}`;
    }, 1200);
  }

  async function payByCard(event) {
    event.preventDefault();

    const core = window.InstapicCore;
    const paymentPanel = qs("#payment-panel");
    const payButton = qs("#card-pay-button");

    if (!selectedPackageId || !selectedAmountCents) {
      core.showFlash("Choose a package first.", "error");
      return;
    }

    try {
      const activeCard = await ensureSquareCard(paymentPanel);

      if (payButton) {
        payButton.disabled = true;
        payButton.style.opacity = "0.7";
      }
      setStatus("Processing payment…");

      const result = await activeCard.tokenize();

      if (result.status !== "OK") {
        throw new Error(explainTokenizeFailure(result, "Card"));
      }

      const data = await postPayment(
        result.token,
        "website_card",
        result.verificationToken || null
      );

      showTicketAndRedirect(data);
    } catch (err) {
      setStatus("");
      core.showFlash(`Payment failed: ${err.message}`, "error");
    } finally {
      if (payButton) {
        payButton.disabled = false;
        payButton.style.opacity = "1";
      }
    }
  }

  async function payByApplePay(event) {
    event.preventDefault();

    const core = window.InstapicCore;

    if (!selectedPackageId || !selectedAmountCents) {
      core.showFlash("Choose a package first.", "error");
      return;
    }
    if (!applePay) {
      core.showFlash("Apple Pay is not available on this device/browser.", "error");
      return;
    }

    try {
      setStatus("Processing Apple Pay…");

      const result = await applePay.tokenize();

      if (result.status !== "OK") {
        throw new Error(explainTokenizeFailure(result, "Apple Pay"));
      }

      const data = await postPayment(
        result.token,
        "website_apple_pay",
        result.verificationToken || null
      );

      showTicketAndRedirect(data);
    } catch (err) {
      setStatus("");
      core.showFlash(`Apple Pay failed: ${err.message}`, "error");
    }
  }

  async function selectPackage(btn) {
    const core = window.InstapicCore;
    const flash = qs("#flash");
    const ticketResult = qs("#ticket-result");
    const paymentPanel = qs("#payment-panel");
    const selectedPackageLabel = qs("#selected-package-label");

    if (flash) flash.hidden = true;
    if (ticketResult) ticketResult.hidden = true;
    setStatus("");

    selectedPackageId = String(btn.dataset.packageId || "").trim();
    selectedAmountCents = Number(btn.dataset.amountCents || "0");
    selectedLabel = packageLabel(selectedPackageId, selectedAmountCents);

    if (!selectedPackageId || !selectedAmountCents) {
      core.showFlash("Package details are missing.", "error");
      return;
    }

    if (paymentPanel) {
      paymentPanel.hidden = false;
      paymentPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (selectedPackageLabel) {
      selectedPackageLabel.textContent = `Selected: ${selectedLabel}`;
    }

    try {
      setStatus("Loading secure payment form…");
      await ensureSquareCard(paymentPanel);
      await setupApplePayForCurrentSelection();
      if (!applePay) {
        setStatus("Card payment is ready.");
      }
    } catch (err) {
      setStatus("");
      core.showFlash(`Could not load payment form: ${err.message}`, "error");
    }
  }

  function initPayPage() {
    const core = window.InstapicCore;
    if (!core || core.dataPage() !== "pay") return;

    qsa(".package-portal").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectPackage(btn);
      });
    });

    const payButton = qs("#card-pay-button");
    if (payButton) {
      payButton.addEventListener("click", payByCard);
    }

    const appleBtn = ensureApplePayButton();
    if (appleBtn) {
      appleBtn.addEventListener("click", payByApplePay);
    }
  }

  document.addEventListener("DOMContentLoaded", initPayPage);
})();
