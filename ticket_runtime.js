(function () {
  function qs(sel) {
    return document.querySelector(sel);
  }

  function getCodeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("code") || "").trim();
  }

  function showFlash(message) {
    const flash = qs("#flash");
    if (!flash) return;
    flash.hidden = false;
    flash.textContent = message;
  }

  function makeCodeCardDataUrl(code) {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1600;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0c0914";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#ff5fa2");
    gradient.addColorStop(0.5, "#ff2f6c");
    gradient.addColorStop(1, "#ffbf5f");

    ctx.fillStyle = gradient;
    ctx.fillRect(120, 220, 960, 720);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 52px Arial";
    ctx.textAlign = "center";
    ctx.fillText("YOUR INSTAPIC BOOTH CODE", 600, 340);

    ctx.fillStyle = "#130d16";
    ctx.font = "900 180px Arial";
    ctx.fillText(code || "------", 600, 620);

    ctx.fillStyle = "#ffffff";
    ctx.font = "500 42px Arial";
    ctx.fillText("Save this code before leaving the page", 600, 760);

    ctx.fillStyle = "#ffffff";
    ctx.font = "500 34px Arial";
    ctx.fillText("Use this 6-digit code at the booth and later for session access", 600, 980);

    return canvas.toDataURL("image/png");
  }

  async function downloadCodeImage(code) {
    const dataUrl = makeCodeCardDataUrl(code);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `instapic_code_${code || "session"}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function initTicketPage() {
    const page = document.body?.dataset?.page || "";
    if (page !== "ticket") return;

    const code = getCodeFromUrl();
    const codeEl = qs("#ticket-code");
    const copyBtn = qs("#copy-code");
    const shareBtn = qs("#share-code");
    const downloadBtn = qs("#download-code");

    if (!code) {
      showFlash("Missing booth code.");
      return;
    }

    if (codeEl) {
      codeEl.textContent = code;
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", async function () {
        try {
          await navigator.clipboard.writeText(code);
          showFlash("Booth code copied.");
        } catch (err) {
          showFlash("Could not copy booth code.");
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener("click", async function () {
        const shareText = `My Instapic booth code is ${code}. Save this for the booth and later session access.`;
        try {
          if (navigator.share) {
            await navigator.share({
              title: "My Instapic Booth Code",
              text: shareText,
              url: window.location.href
            });
          } else {
            await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
            showFlash("Code and ticket link copied for sharing.");
          }
        } catch (err) {
          showFlash("Share cancelled or unavailable.");
        }
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener("click", async function () {
        try {
          await downloadCodeImage(code);
          showFlash("Code card downloaded.");
        } catch (err) {
          showFlash("Could not download code card.");
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", initTicketPage);
})();
