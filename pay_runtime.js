(function () {
  const core = window.InstapicCore;
  let payments = null;
  let card = null;
  let applePay = null;
  let googlePay = null;
  let selectedPackage = null;
  let walletRefreshSeq = 0;

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

  function packageAmount() {
    return (Number(selectedPackage?.amount_cents || 0) / 100).toFixed(2);
  }

  function buildPaymentRequest() {
    return payments.paymentRequest({
      countryCode: "AU",
      currencyCode: "AUD",
      total: {
        amount: packageAmount(),
        label: "Instapic"
      }
    });
  }

  function updateWalletChrome() {
    const wrap = qs("#google-pay-wrap");
    const divider = qs("#payment-or-divider");
    const appleBtn = qs("#apple-pay-button");
    const appleVisible = !!(appleBtn && !appleBtn.hidden && appleBtn.style.display !== "none");
    const googleVisible = !!(wrap && !wrap.hidden);

    if (divider) {
      divider.hidden = !(appleVisible || googleVisible);
    }

    const parts = [];
    if (appleVisible) parts.push("Apple Pay");
    if (googleVisible) parts.push("Google Pay");
    if (parts.length) {
      setStatus(parts.join(" and ") + " available on this device.");
    } else if (selectedPackage) {
      setStatus("Pay securely by card below.");
    }
  }

  function ensureApplePayButton() {
    function styleApplePayButton(btn) {
      btn.type = "button";
      btn.hidden = true;
      btn.style.display = "none";
      btn.classList.add("apple-pay-button");
      btn.setAttribute("lang", "en");
      btn.setAttribute("aria-label", "Pay with Apple Pay");

      // Official Safari / WebKit Apple Pay button:
      // type "pay" renders "Pay with Pay" (not plain text "Apple Pay")
      btn.style.setProperty("-webkit-appearance", "-apple-pay-button");
      btn.style.setProperty("-apple-pay-button-type", "pay");
      // White button reads well on our dark pay page
      btn.style.setProperty("-apple-pay-button-style", "white");

      btn.style.width = "100%";
      btn.style.maxWidth = "320px";
      btn.style.height = "48px";
      btn.style.minHeight = "48px";
      btn.style.border = "0";
      btn.style.borderRadius = "12px";
      btn.style.margin = "0";
      btn.style.padding = "0";
      btn.style.cursor = "pointer";
      btn.style.overflow = "hidden";

      // System button draws its own logo/label — clear any leftover plain text
      btn.textContent = "";

      // Fallback if the browser ignores -apple-pay-button appearance
      // (real Apple Pay still only works on Apple devices / Safari)
      if (!CSS.supports || !CSS.supports("-webkit-appearance", "-apple-pay-button")) {
        btn.classList.add("apple-pay-button-fallback");
        btn.innerHTML =
          '<span class="apple-pay-fallback-label">' +
          '<svg class="apple-pay-mark" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
          '<path fill="currentColor" d="M16.365 12.23c-.03-2.22 1.81-3.29 1.89-3.34-1.03-1.51-2.64-1.72-3.21-1.74-1.37-.14-2.67.8-3.36.8-.7 0-1.77-.78-2.91-.76-1.5.02-2.88.87-3.65 2.21-1.56 2.7-.4 6.7 1.12 8.89.74 1.07 1.62 2.27 2.78 2.23 1.12-.05 1.54-.72 2.89-.72 1.34 0 1.72.72 2.9.7 1.2-.02 1.96-1.09 2.69-2.17.85-1.24 1.2-2.44 1.22-2.5-.03-.01-2.33-.89-2.36-3.6zm-2.2-6.5c.62-.75 1.04-1.79.92-2.83-.89.04-1.97.59-2.61 1.34-.57.66-1.07 1.72-.94 2.73 1 .08 2.02-.51 2.63-1.24z"/>' +
          "</svg>" +
          "Pay with&nbsp;<strong>Apple&nbsp;Pay</strong></span>";
      }

      return btn;
    }

    let btn = qs("#apple-pay-button");
    if (btn) return styleApplePayButton(btn);

    const wrap = qs(".apple-pay-wrap");
    const cardContainer = qs("#card-container");
    btn = document.createElement("button");
    btn.id = "apple-pay-button";
    if (wrap) {
      wrap.appendChild(btn);
    } else if (cardContainer && cardContainer.parentNode) {
      cardContainer.parentNode.insertBefore(btn, cardContainer);
    } else {
      return null;
    }
    return styleApplePayButton(btn);
  }

  async function destroyGooglePay() {
    const wrap = qs("#google-pay-wrap");
    const mount = qs("#google-pay-button");
    if (googlePay && typeof googlePay.destroy === "function") {
      try {
        await googlePay.destroy();
      } catch (err) {
        console.warn("Google Pay destroy failed", err);
      }
    }
    googlePay = null;
    if (mount) mount.innerHTML = "";
    if (wrap) wrap.hidden = true;
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
  }

  async function refreshApplePay() {
    const btn = ensureApplePayButton();
    if (!btn || !payments || !selectedPackage) return false;

    btn.hidden = true;
    btn.style.display = "none";
    applePay = null;

    try {
      applePay = await payments.applePay(buildPaymentRequest());
      btn.hidden = false;
      // Official system button uses block; fallback pill uses flex for centering
      btn.style.display = btn.classList.contains("apple-pay-button-fallback") ? "flex" : "block";
      btn.style.visibility = "visible";
      btn.style.opacity = "1";
      return true;
    } catch (err) {
      applePay = null;
      console.warn("Apple Pay availability error", err);
      return false;
    }
  }

  async function refreshGooglePay() {
    const wrap = qs("#google-pay-wrap");
    const mount = qs("#google-pay-button");
    if (!wrap || !mount || !payments || !selectedPackage) return false;

    await destroyGooglePay();

    try {
      // Official Google Pay logo button via Square Web Payments SDK
      googlePay = await payments.googlePay(buildPaymentRequest());
      await googlePay.attach("#google-pay-button", {
        buttonColor: "white",
        buttonType: "long",
        buttonSizeMode: "fill"
      });
      wrap.hidden = false;
      return true;
    } catch (err) {
      googlePay = null;
      wrap.hidden = true;
      if (mount) mount.innerHTML = "";
      console.warn("Google Pay availability error", err);
      return false;
    }
  }

  async function refreshDigitalWallets() {
    if (!payments || !selectedPackage) return;
    const seq = ++walletRefreshSeq;

    setStatus("Checking wallet options…");
    await refreshApplePay();
    if (seq !== walletRefreshSeq) return;
    await refreshGooglePay();
    if (seq !== walletRefreshSeq) return;
    updateWalletChrome();
  }

  function selectPackage(pkg) {
    selectedPackage = pkg;
    const panel = qs("#payment-panel");
    const label = qs("#selected-package-label");
    if (panel) panel.hidden = false;
    if (label) {
      label.textContent = `${pkg.name} — $${(Number(pkg.amount_cents || 0) / 100).toFixed(2)}`;
    }
    refreshDigitalWallets();

    if (panel) {
      setTimeout(() => {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
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

  async function payByGooglePay() {
    if (!googlePay || !selectedPackage) {
      setStatus("Google Pay is not ready.");
      return;
    }

    setStatus("Processing Google Pay...");

    const tokenResult = await googlePay.tokenize();
    console.log("Google Pay tokenize result", tokenResult);

    if (tokenResult.status !== "OK") {
      const msg =
        tokenResult.errors?.map(e => e.message).filter(Boolean).join("; ") ||
        tokenResult.status ||
        "Google Pay tokenization failed";
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

    // Google Pay button is injected by Square into #google-pay-button;
    // listen on the mount for clicks (capture so we get the logo button).
    const googleMount = qs("#google-pay-button");
    if (googleMount) {
      googleMount.addEventListener("click", async function (ev) {
        if (!googlePay) return;
        ev.preventDefault();
        try {
          await payByGooglePay();
        } catch (err) {
          console.error("Google Pay error", err);
          setStatus("Google Pay failed: " + describeError(err));
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", initPayPage);
})();
