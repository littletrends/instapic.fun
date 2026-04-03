(function () {
  function showFlash(message) {
    const flash = document.getElementById("flash");
    if (!flash) return;
    flash.hidden = false;
    flash.textContent = message;
  }

  function clearSaveFields() {
    const ids = ["guest_email", "guest_email_password", "guest_password"];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      try {
        el.value = "";
        el.setAttribute("value", "");
      } catch (_) {}
    });
  }

  async function initSavePage() {
    const page = document.body?.dataset?.page || "";
    if (page !== "save") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("logged_out") === "1") {
      try { window.InstapicGuestIdentity?.clear?.(); } catch (_) {}
    }

    if (window.InstapicGuestIdentity?.isVerifiedSessionActive?.()) {
      window.location.href = "my-instapic.html";
      return;
    }

    clearSaveFields();
    window.addEventListener("pageshow", clearSaveFields);
    setTimeout(clearSaveFields, 50);
    setTimeout(clearSaveFields, 250);
    setTimeout(clearSaveFields, 750);

    const form = document.getElementById("save-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const emailInput = document.getElementById("guest_email");
      const email = String(emailInput?.value || "").trim();

      if (!email) {
        showFlash("Enter your email address first.");
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
          verification_started: true,
          verified: false
        });

        window.location.href = "verify.html";
      } catch (err) {
        showFlash(`Could not start verification: ${err.message}`);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initSavePage);
})();
