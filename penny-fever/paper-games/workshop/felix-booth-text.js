(function () {
  const SRC = "felix-booth-text.json?v=carnival-2";

  function familyFromFile(file) {
    return String(file || "").replace(/\.[a-z0-9]+$/i, "") || "sans-serif";
  }

  function familyName(spot) {
    return String((spot && (spot.family || familyFromFile(spot.font))) || "sans-serif").replace(/"/g, '\\"');
  }

  function fontUrl(file) {
    return "fonts/" + encodeURIComponent(file);
  }

  function fontFormat(file) {
    const ext = String(file || "").split(".").pop().toLowerCase();
    if (ext === "otf") return "opentype";
    if (ext === "woff2") return "woff2";
    if (ext === "woff") return "woff";
    return "truetype";
  }

  function injectFonts(spots, extras) {
    const byFile = new Map();
    (spots || []).forEach((row) => {
      if (row && row.font) byFile.set(row.font, row);
    });
    (extras || []).forEach((row) => {
      if (row && row.font && !byFile.has(row.font)) byFile.set(row.font, row);
    });
    if (!byFile.size) return;
    let style = document.getElementById("felix-text-fonts");
    if (!style) {
      style = document.createElement("style");
      style.id = "felix-text-fonts";
      document.head.appendChild(style);
    }
    style.textContent = [...byFile.values()].map((spot) => {
      const family = familyName(spot);
      const file = spot.font;
      const woff2 = String(file).replace(/\.[a-z0-9]+$/i, ".woff2");
      const src = `url("${fontUrl(woff2)}") format("woff2"), url("${fontUrl(file)}") format("${fontFormat(file)}")`;
      return [
        `@font-face{font-family:"${family}";src:${src};font-weight:100 900;font-style:normal;font-display:swap;}`,
        `@font-face{font-family:"${family}";src:${src};font-weight:400;font-style:normal;font-display:swap;}`,
        `@font-face{font-family:"${family}";src:${src};font-weight:800;font-style:normal;font-display:swap;}`,
      ].join("\n");
    }).join("\n");
  }

  function setBoothFonts(ui, title) {
    const root = document.documentElement;
    const uiStack = ui ? `"${familyName(ui)}", system-ui, sans-serif` : "system-ui, sans-serif";
    const titleStack = title ? `"${familyName(title)}", ${uiStack}` : uiStack;
    root.style.setProperty("--instapic-ui-font", uiStack);
    root.style.setProperty("--instapic-title-font", titleStack);
    root.style.setProperty("--instapic-subtitle-font", titleStack);
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
      node.style.setProperty("font-weight", "normal", "important");
      node.style.setProperty("font-synthesis", "none", "important");
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
      const ui = { font: data.ui_font || "Unique.ttf", family: data.ui_family || "Unique" };
      const title = { font: data.title_font || "Subotype Steady.otf", family: data.title_family || "Subotype Steady" };
      injectFonts(spots, [ui, title]);
      setBoothFonts(ui, title);
      spots.forEach(applySpot);
    } catch (error) {
      /* booth keeps HTML defaults */
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
