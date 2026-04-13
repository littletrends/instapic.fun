(function () {
  function initPayPage() {
    const core = window.InstapicCore;
    if (!core || core.dataPage() !== "pay") return;

    const flash = core.qs("#flash");
    const ticketResult = core.qs("#ticket-result");
    const ticketCode = core.qs("#ticket-code");

    function resetState() {
      if (flash) flash.hidden = true;
      if (ticketResult) ticketResult.hidden = true;
    }

    core.qsa(".package-portal").forEach((btn) => {
      btn.addEventListener("click", async () => {
        resetState();

        const packageId = btn.dataset.packageId;
        const amountCents = Number(btn.dataset.amountCents || "0");
        const oldDisabled = btn.disabled;

        btn.disabled = true;
        btn.style.opacity = "0.7";

        try {
          const result = await core.createTicket(packageId, amountCents, "website_test_bypass");

          if (ticketCode) ticketCode.textContent = result.code;
          if (ticketResult) ticketResult.hidden = false;

          setTimeout(() => {
            window.location.href = `ticket.html?code=${encodeURIComponent(result.code)}`;
          }, 1200);
        } catch (err) {
          core.showFlash(`Could not create code: ${err.message}`, "error");
        } finally {
          btn.disabled = oldDisabled;
          btn.style.opacity = "1";
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initPayPage);
})();
