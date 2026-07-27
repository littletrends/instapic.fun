(function () {
  function showFlash(message) {
    const flash = document.getElementById("flash");
    if (!flash) return;
    flash.hidden = false;
    flash.textContent = message;
    try {
      flash.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (_) {}
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

  function focusPasswordSignIn(email) {
    const passEmail = document.getElementById("guest_email_password");
    const passField = document.getElementById("guest_password");
    const block = document.getElementById("password-sign-in-block");
    showAuthPanel("password-sign-in-block");
    if (passEmail && email) {
      passEmail.value = email;
    }
    if (block) {
      try {
        block.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (_) {}
    }
    if (passField) {
      setTimeout(() => {
        try { passField.focus(); } catch (_) {}
      }, 150);
    }
  }

  function showAuthPanel(panelId) {
    ["password-sign-in-block", "email-sign-in-block"].forEach((id) => {
      const panel = document.getElementById(id);
      if (panel) panel.hidden = id !== panelId;
    });
    document.querySelectorAll(".guest-auth-tab").forEach((tab) => {
      const active = tab.dataset.guestPanel === panelId;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function initAuthSwitch() {
    document.querySelectorAll(".guest-auth-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        showAuthPanel(tab.dataset.guestPanel || "password-sign-in-block");
      });
    });
    showAuthPanel("email-sign-in-block");
  }

  async function profileLookup(apiBase, email) {
    try {
      const res = await fetch(`${apiBase}/api/guest/profile/${encodeURIComponent(email)}`);
      if (res.status === 404) {
        return { exists: false, has_password: false };
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        return { exists: false, has_password: false, error: true };
      }
      return {
        exists: true,
        has_password: !!data.has_password,
        email: data.email || email
      };
    } catch (_) {
      return { exists: false, has_password: false, error: true };
    }
  }

  function initSavePage() {
    const page = document.body?.dataset?.page || "";
    if (page !== "save") return;

    const params = new URLSearchParams(window.location.search);
    const ticketCode = String(params.get("ticket_code") || "").replace(/\D+/g, "").slice(0, 6);

    if (params.get("logged_out") === "1") {
      try { window.InstapicGuestIdentity?.clear?.(); } catch (_) {}
    }

    if (window.InstapicGuestIdentity?.isVerifiedSessionActive?.()) {
      const next = ticketCode
        ? `my-instapic.html?ticket_code=${encodeURIComponent(ticketCode)}`
        : "my-instapic.html";
      window.location.href = next;
      return;
    }

    clearSaveFields();
    initAuthSwitch();
    window.addEventListener("pageshow", clearSaveFields);
    setTimeout(clearSaveFields, 50);
    setTimeout(clearSaveFields, 250);
    setTimeout(clearSaveFields, 750);

    // If user insists on email code after a password prompt, second submit may force-send
    let forceEmailCode = false;

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

        if (!forceEmailCode) {
          const lookup = await profileLookup(apiBase, email);
          if (lookup.exists && lookup.has_password) {
            showFlash(
              "This email already has a Guest Area password. Sign in with your password above — or submit the email form again to get a new 4-digit code anyway."
            );
            focusPasswordSignIn(lookup.email || email);
            forceEmailCode = true;
            const btn = document.getElementById("email-code-submit");
            if (btn) btn.textContent = "Send email code anyway";
            return;
          }
          if (lookup.exists && !lookup.has_password) {
            showFlash(
              "This email is already registered. We’ll email a 4-digit code so you can sign in (you can set a password after)."
            );
          }
        }

        const res = await fetch(`${apiBase}/api/guest/start-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || data.error || `HTTP ${res.status}`);
        }

        window.InstapicGuestIdentity.write({
          email: data.email,
          verification_started: true,
          verified: false
        });

        const next = ticketCode
          ? `verify.html?ticket_code=${encodeURIComponent(ticketCode)}`
          : "verify.html";
        window.location.href = next;
      } catch (err) {
        showFlash(`Could not start verification: ${err.message}`);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initSavePage);
})();
