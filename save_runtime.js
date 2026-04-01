(function () {
  function initSavePage() {
    const page = document.body?.dataset?.page || "";
    if (page !== "save") return;

    const form = document.getElementById("save-form");
    const flash = document.getElementById("flash");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const phoneInput = document.getElementById("guest_phone");
      const phone = String(phoneInput?.value || "").trim();

      if (!phone) {
        if (flash) {
          flash.hidden = false;
          flash.textContent = "Enter your mobile number first.";
        }
        return;
      }

      window.InstapicGuestIdentity.write({
        phone: phone,
        verified: false
      });

      window.location.href = "verify.html";
    });
  }

  document.addEventListener("DOMContentLoaded", initSavePage);
})();
