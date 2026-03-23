(function () {
  function initKeypad() {
    const input = document.getElementById("ticket_code");
    const keypad = document.querySelector(".keypad");
    if (!input || !keypad) return;

    keypad.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-key], button[data-action]");
      if (!btn) return;

      const key = btn.getAttribute("data-key");
      const action = btn.getAttribute("data-action");

      if (key) {
        if (input.value.length < 6) input.value += key;
        return;
      }

      if (action === "clear") {
        input.value = "";
      } else if (action === "back") {
        input.value = input.value.slice(0, -1);
      }
    });
  }

  function initSessionPage() {
    const core = window.InstapicCore;
    if (!core || core.dataPage() !== "session") return;

    const form = core.qs("#session-form");
    const input = core.qs("#ticket_code");
    const processing = core.qs("#processing");

    initKeypad();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      core.hideFlash();
      if (processing) processing.hidden = false;

      const code = (input.value || "").trim();

      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        core.showFlash("Please enter a valid 6-digit code", "error");
        if (processing) processing.hidden = true;
        return;
      }

      try {
        await core.getBonus(code);
        window.location.href = `bonus.html?code=${encodeURIComponent(code)}`;
      } catch (err) {
        core.showFlash(err.message, "error");
        if (processing) processing.hidden = true;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initSessionPage);
})();
