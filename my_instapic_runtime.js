(function () {
  function initMyInstapicPage() {
    const page = document.body?.dataset?.page || "";
    if (page !== "my-instapic") return;

    const summary = document.getElementById("guest-summary");
    const flash = document.getElementById("flash");
    const guest = window.InstapicGuestIdentity?.read?.() || {};

    if (!guest.verified) {
      if (flash) {
        flash.hidden = false;
        flash.textContent = "You are viewing the guest area shell. Verification and saved-session storage will be connected next.";
      }
      return;
    }

    if (summary && guest.phone) {
      summary.textContent = `Signed in as ${guest.phone}. Your saved Instapic sessions and tickets will appear here.`;
    }
  }

  document.addEventListener("DOMContentLoaded", initMyInstapicPage);
})();
