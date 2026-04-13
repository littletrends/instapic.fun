(function () {
  function showFlash(message) {
    const flash = document.getElementById("flash");
    if (!flash) return;
    flash.hidden = false;
    flash.textContent = message;
  }

  function initVerifyPage() {
    const page = document.body?.dataset?.page || "";
    if (page !== "verify") return;

    const params = new URLSearchParams(window.location.search);
    const ticketCode = String(params.get("ticket_code") || "").replace(/\D+/g, "").slice(0, 6);

    const form = document.getElementById("verify-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const codeInput = document.getElementById("verify_code");
      const code = String(codeInput?.value || "").trim();
      const current = window.InstapicGuestIdentity.read();
      const email = String(current.email || "").trim();

      if (!email) {
        showFlash("Email missing. Start again from the email page.");
        return;
      }

      if (!/^\d{4}$/.test(code)) {
        showFlash("Enter your 4-digit email sign-in code.");
        return;
      }

      try {
        const apiBase = window.InstapicGuestIdentity.API_BASE;
        const res = await fetch(`${apiBase}/api/guest/verify-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code })
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || data.error || `HTTP ${res.status}`);
        }

        window.InstapicGuestIdentity.write({
          email: data.email,
          verified: true,
          verification_started: false,
          guest_profile: data.guest_profile || {}
        });

        const next = ticketCode
          ? `my-instapic.html?ticket_code=${encodeURIComponent(ticketCode)}`
          : "my-instapic.html";
        window.location.href = next;
      } catch (err) {
        showFlash(`Could not verify code: ${err.message}`);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initVerifyPage);
})();
