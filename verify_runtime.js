(function () {
  function showFlash(message) {
    const flash = document.getElementById("flash");
    if (!flash) return;
    flash.hidden = false;
    flash.textContent = message;
  }

  async function initVerifyPage() {
    const page = document.body?.dataset?.page || "";
    if (page !== "verify") return;

    const form = document.getElementById("verify-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const codeInput = document.getElementById("verify_code");
      const code = String(codeInput?.value || "").trim();
      const current = window.InstapicGuestIdentity.read();
      const phone = String(current.phone || "").trim();

      if (!phone) {
        showFlash("Phone number missing. Start again.");
        return;
      }

      if (!/^\d{4,6}$/.test(code)) {
        showFlash("Enter a valid verification code.");
        return;
      }

      try {
        const apiBase = window.InstapicGuestIdentity.API_BASE;
        const res = await fetch(`${apiBase}/api/guest/verify-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code })
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        window.InstapicGuestIdentity.write({
          phone: data.phone,
          verified: true,
          guest_profile: data.guest_profile || {}
        });

        window.location.href = "my-instapic.html";
      } catch (err) {
        showFlash(`Could not verify code: ${err.message}`);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initVerifyPage);
})();
