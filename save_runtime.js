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

      const emailInput = document.getElementById("guest_email");
      const email = String(emailInput?.value || "").trim();

      if (!email) {
        showFlash("Enter your email first.");
        return;
      }

      try {
        const apiBase = window.InstapicGuestIdentity.API_BASE;
        const res = await fetch(`${apiBase}/api/guest/start-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        window.InstapicGuestIdentity.write({
          email: data.email,
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
