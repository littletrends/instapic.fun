(function () {
  function qs(sel) {
    return document.querySelector(sel);
  }

  function initGuestLogout() {
    const page = document.body?.dataset?.page || "";
    if (page !== "my-instapic") return;

    const btn = qs("#guest-logout-btn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      try {
        window.InstapicGuestIdentity?.clear?.();
      } catch (_) {}
      window.location.href = "save.html";
    });
  }

  document.addEventListener("DOMContentLoaded", initGuestLogout);
})();
