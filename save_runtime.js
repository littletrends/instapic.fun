(function () {
  function showFlash(message) {
    const flash = document.getElementById("flash");
    if (!flash) return;
    flash.hidden = false;
    flash.textContent = message;
  }

  async function initSavePage() {
    const page = document.body?.dataset?.page || "";
    if (page !== "save") return;

    const form = document.getElementById("save-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const phoneInput = document.getElementById("guest_phone");
      const phone = String(phoneInput?.value || "").trim();

      if (!phone) {
        showFlash("Enter your mobile number first.");
        return;
      }

      try {
        const apiBase = window.InstapicGuestIdentity.API_BASE;
        const res = await fetch(`${apiBase}/api/guest/start-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone })
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        window.InstapicGuestIdentity.write({
          phone: data.phone,
          verification_started: true
        });

        window.location.href = "verify.html";
      } catch (err) {
        showFlash(`Could not start verification: ${err.message}`);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initSavePage);
})();
