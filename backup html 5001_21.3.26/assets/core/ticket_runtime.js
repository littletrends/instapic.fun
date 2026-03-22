(function () {
  function initTicketPage() {
    const core = window.InstapicCore;
    if (!core || core.dataPage() !== "ticket") return;

    const code = core.getCodeFromUrl() || "------";
    const display = core.qs("#code-display");
    if (display) display.textContent = code;
  }

  document.addEventListener("DOMContentLoaded", initTicketPage);
})();
