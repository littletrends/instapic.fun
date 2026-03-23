(function () {
  function prettyError(message) {
    const raw = String(message || "").trim();
    const lower = raw.toLowerCase();

    if (!raw) return "We couldn’t check that code right now. Please try again.";
    if (lower.includes("valid 6-digit")) return "Please enter a valid 6-digit code.";
    if (lower.includes("unknown") || lower.includes("not found") || lower.includes("invalid")) {
      return "This code is not valid. Please check it and try again.";
    }
    if (lower.includes("redeemed") || lower.includes("already used") || lower.includes("already redeemed")) {
      return "This code has already been used.";
    }
    if (lower.includes("not ready") || lower.includes("pending") || lower.includes("uploading") || lower.includes("preparing")) {
      return "Your gallery isn’t ready yet. Please try again in a moment.";
    }
    return raw;
  }

  function initSessionPage() {
    const core = window.InstapicCore;
    if (!core || core.dataPage() !== "session") return;

    const form = core.qs("#session-form");
    const input = core.qs("#ticket_code");
    const processing = core.qs("#processing");

    if (!form || !input) return;

    input.value = "";
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", "false");

    function clearFlash() {
      const flash = core.qs("#flash");
      if (flash) {
        flash.hidden = true;
        flash.textContent = "";
      }
    }

    function normalizeInput() {
      input.value = (input.value || "").replace(/\D+/g, "").slice(0, 6);
    }

    document.querySelectorAll(".keypad-key").forEach((btn) => {
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearFlash();

        const key = btn.dataset.key;
        const action = btn.dataset.action;

        if (action === "clear") {
          input.value = "";
        } else if (action === "back") {
          input.value = input.value.slice(0, -1);
        } else if (key && input.value.length < 6) {
          input.value += key;
        }

        normalizeInput();
        input.focus({ preventScroll: true });
      });
    });

    input.addEventListener("input", () => {
      clearFlash();
      normalizeInput();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFlash();
      normalizeInput();

      const code = input.value.trim();
      if (!/^\d{6}$/.test(code)) {
        core.showFlash("Please enter a valid 6-digit code.", "error");
        return;
      }

      if (processing) processing.hidden = false;

      try {
        await core.getBonus(code);
        window.location.href = `bonus.html?code=${encodeURIComponent(code)}`;
      } catch (err) {
        core.showFlash(prettyError(err.message), "error");
      } finally {
        if (processing) processing.hidden = true;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initSessionPage);
})();
