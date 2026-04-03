(function () {
  function qs(sel) {
    return document.querySelector(sel);
  }

  function showFlash(message) {
    const flash = qs("#flash");
    if (!flash) return;
    flash.hidden = false;
    flash.textContent = message || "";
  }

  async function postJson(path, payload) {
    const apiBase = window.InstapicGuestIdentity?.API_BASE;
    const res = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.message || data.error || `HTTP ${res.status}`);
    }
    return data;
  }

  function writeVerifiedGuest(email, guestProfile) {
    window.InstapicGuestIdentity.write({
      email,
      verified: true,
      verification_started: false,
      guest_profile: guestProfile || {}
    });
  }

  function clearPasswordLoginFields() {
    const emailInput = qs("#guest_email_password");
    const passwordInput = qs("#guest_password");
    if (emailInput) {
      emailInput.value = "";
      emailInput.setAttribute("value", "");
    }
    if (passwordInput) {
      passwordInput.value = "";
      passwordInput.setAttribute("value", "");
    }
  }

  function initSavePasswordLogin() {
    const page = document.body?.dataset?.page || "";
    if (page !== "save") return;

    // === carry ticket_code forward ===
    const params = new URLSearchParams(window.location.search);
    const ticketCode = params.get("ticket_code");


    clearPasswordLoginFields();
    window.addEventListener("pageshow", clearPasswordLoginFields);
    setTimeout(clearPasswordLoginFields, 50);
    setTimeout(clearPasswordLoginFields, 250);
    setTimeout(clearPasswordLoginFields, 750);

    const form = qs("#password-login-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const email = String(qs("#guest_email_password")?.value || "").trim();
      const password = String(qs("#guest_password")?.value || "").trim();

      if (!email) {
        showFlash("Enter your email address first.");
        return;
      }
      if (!password) {
        showFlash("Enter your password first.");
        return;
      }

      try {
        const data = await postJson("/api/guest/password-login", { email, password });
        writeVerifiedGuest(data.email, data.guest_profile);
        
const next = ticketCode
  ? `my-instapic.html?ticket_code=${encodeURIComponent(ticketCode)}`
  : "my-instapic.html";
window.location.href = next;

      } catch (err) {
        showFlash(`Could not sign in with password: ${err.message}`);
      }
    });
  }

  function initMyInstapicPasswordSet() {
    const page = document.body?.dataset?.page || "";
    if (page !== "my-instapic") return;

    const form = qs("#guest-password-set-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const guest = window.InstapicGuestIdentity?.read?.() || {};
      const email = String(guest.email || "").trim();
      const password = String(qs("#guest_new_password")?.value || "").trim();

      if (!email || !guest.verified) {
        showFlash("Please sign in to your guest area first.");
        return;
      }
      if (!password) {
        showFlash("Enter a password first.");
        return;
      }

      try {
        const data = await postJson("/api/guest/set-password", { email, password });
        writeVerifiedGuest(data.email, data.guest_profile);
        showFlash("Password saved. Next time you can sign in with email and password.");
        const input = qs("#guest_new_password");
        if (input) input.value = "";
      } catch (err) {
        showFlash(`Could not save password: ${err.message}`);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSavePasswordLogin();
    initMyInstapicPasswordSet();
  });
})();
