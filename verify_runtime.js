(function () {
  function initVerifyPage() {
    const page = document.body?.dataset?.page || "";
    if (page !== "verify") return;

    const form = document.getElementById("verify-form");
    const flash = document.getElementById("flash");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const codeInput = document.getElementById("verify_code");
      const code = String(codeInput?.value || "").trim();

      if (!/^\d{4,6}$/.test(code)) {
        if (flash) {
          flash.hidden = false;
          flash.textContent = "Enter a valid verification code.";
        }
        return;
      }

      const current = window.InstapicGuestIdentity.read();
      window.InstapicGuestIdentity.write({
        ...current,
        verified: true,
        verify_code: code
      });

      window.location.href = "my-instapic.html";
    });
  }

  document.addEventListener("DOMContentLoaded", initVerifyPage);
})();
