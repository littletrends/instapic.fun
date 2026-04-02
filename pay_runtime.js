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

      btn.style.webkitAppearance = "-apple-pay-button";
      btn.style.setProperty("-webkit-appearance", "-apple-pay-button");
      btn.style.setProperty("-apple-pay-button-type", "buy");
      btn.style.setProperty("-apple-pay-button-style", "black");

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
      package_id: selectedPackage.package_id,
      amount_cents: selectedPackage.amount_cents,
      source_id: sourceId,
      source_type: sourceType || "card",
      verification_token: verificationToken || null
    });
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
    if (!applePay || !selectedPackage) {
      setStatus("Apple Pay is not ready.");
      return;
    }

    setStatus("Processing Apple Pay...");

    const tokenResult = await applePay.tokenize();
    console.log("Apple Pay tokenize result", tokenResult);

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
      appleBtn.addEventListener("click", async function () {
        try {
          await payByApplePay();
        } catch (err) {
          console.error("Apple Pay error", err);
          setStatus("Apple Pay failed: " + describeError(err));
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", initPayPage);
})();
