(function () {
  const SRC = "felix-booth-text.json?v=felix-text-2";

  function familyFromFile(file) {
    return String(file || "").replace(/\.[a-z0-9]+$/i, "") || "sans-serif";
  }

  function familyName(spot) {
    return String(spot.family || familyFromFile(spot.font)).replace(/"/g, '\\"');
  }

  function injectFonts(spots) {
    const files = [...new Set((spots || []).map((row) => row.font).filter(Boolean))];
    if (!files.length) return;
    let style = document.getElementById("felix-text-fonts");
    if (!style) {
      style = document.createElement("style");
      style.id = "felix-text-fonts";
      document.head.appendChild(style);
    }
    style.textContent = files.map((file) => {
      const spot = (spots || []).find((row) => row.font === file) || { font: file };
      const family = familyName(spot);
      const path = "fonts/" + encodeURIComponent(file).replace(/%20/g, " ");
      return `@font-face{font-family:"${family}";src:url("${path}");font-display:swap;}`;
    }).join("\n");
  }

  function applySpot(spot) {
    const node = document.querySelector(spot.selector);
    if (!node) return;
    const skipText = spot.id === "thankyou.copy";
    if (!skipText && spot.text != null) {
      const raw = String(spot.text);
      if (spot.html || raw.includes("\n")) {
        node.innerHTML = raw
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br>");
      } else {
        node.textContent = raw;
      }
    }
    if (spot.font) {
      node.style.setProperty("font-family", `"${familyName(spot)}", sans-serif`, "important");
    }
    if (Number(spot.size) > 0) {
      node.style.setProperty("font-size", `${Number(spot.size)}px`, "important");
    }
    const x = Number(spot.x) || 0;
    const y = Number(spot.y) || 0;
    if (x || y) node.style.transform = `translate(${x}px, ${y}px)`;
  }

  async function boot() {
    try {
      const response = await fetch(SRC, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const spots = data.spots || [];
      injectFonts(spots);
      spots.forEach(applySpot);
    } catch (error) {
      /* booth keeps HTML defaults */
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
