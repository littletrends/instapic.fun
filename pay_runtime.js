(function () {
  let selectedPackageId = null;
  let selectedAmountCents = 0;
  let card = null;
  let payments = null;
  let cardMounted = false;

  function packageLabel(packageId, amountCents) {
    const dollars = `$${(Number(amountCents || 0) / 100).toFixed(2).replace(/\.00$/, "")}`;
    const labels = {
      P1_STRIP: `${dollars} Strip`,
      P2_STRIP_GIF: `${dollars} Strip + GIF`,
      P3_STRIP_GIF: `${dollars} Premium`,
    };
    return labels[packageId] || `${packageId} — ${dollars}`;
  }

  function setStatus(el, message) {
    if (el) el.textContent = message || "";
  }

  async function ensureSquareCard(panel, statusEl) {
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
    setStatus(statusEl, "Card form ready.");
    return card;
  }

  function initPayPage() {
    const core = window.InstapicCore;
    if (!core || core.dataPage() !== "pay") return;

    const flash = core.qs("#flash");
    const ticketResult = core.qs("#ticket-result");
    const ticketCode = core.qs("#ticket-code");
    const paymentPanel = core.qs("#payment-panel");
    const selectedLabel = core.qs("#selected-package-label");
    const paymentStatus = core.qs("#payment-status");
    const payButton = core.qs("#card-pay-button");

    function resetState() {
      if (flash) flash.hidden = true;
      if (ticketResult) ticketResult.hidden = true;
      setStatus(paymentStatus, "");
    }

    core.qsa(".package-portal").forEach((btn) => {
      btn.addEventListener("click", async () => {
        resetState();

        selectedPackageId = String(btn.dataset.packageId || "").trim();
        selectedAmountCents = Number(btn.dataset.amountCents || "0");

        if (!selectedPackageId || !selectedAmountCents) {
          core.showFlash("Package details are missing.", "error");
          return;
        }

        if (paymentPanel) {
          paymentPanel.hidden = false;
          paymentPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        if (selectedLabel) {
          selectedLabel.textContent = `Selected: ${packageLabel(selectedPackageId, selectedAmountCents)}`;
        }

        setStatus(paymentStatus, "Loading secure payment form…");

        try {
          await ensureSquareCard(paymentPanel, paymentStatus);
        } catch (err) {
          core.showFlash(`Could not load payment form: ${err.message}`, "error");
          setStatus(paymentStatus, "");
        }
      });
    });

    if (!payButton) return;

    payButton.addEventListener("click", async () => {
      resetState();

      if (!selectedPackageId || !selectedAmountCents) {
        core.showFlash("Choose a package first.", "error");
        return;
      }

      try {
        const activeCard = await ensureSquareCard(paymentPanel, paymentStatus);

        payButton.disabled = true;
        payButton.style.opacity = "0.7";
        setStatus(paymentStatus, "Processing payment…");

        const tokenResult = await activeCard.tokenize();

        if (tokenResult.status !== "OK") {
          const msg = (tokenResult.errors || [])
            .map((e) => e.message)
            .filter(Boolean)
            .join(" | ") || "Card tokenization failed";
          throw new Error(msg);
        }

        const result = await core.payAndCreateTicket({
          package_id: selectedPackageId,
          amount_cents: selectedAmountCents,
          source_id: tokenResult.token,
          verification_token: tokenResult.verificationToken || null,
        });

        if (ticketCode) ticketCode.textContent = result.code;
        if (ticketResult) ticketResult.hidden = false;

        setStatus(paymentStatus, "Payment approved. Creating your booth code…");

        setTimeout(() => {
          window.location.href = `ticket.html?code=${encodeURIComponent(result.code)}`;
        }, 1200);
      } catch (err) {
        setStatus(paymentStatus, "");
        core.showFlash(`Payment failed: ${err.message}`, "error");
      } finally {
        payButton.disabled = false;
        payButton.style.opacity = "1";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initPayPage);
})();
