(function () {
  const COPY = {
    pageTitle: "Your Instapic Bonus",
    pageSubtitle: "Your strip, collage, motion extras, and freeze frames.",
    collageTitle: "Collage Video",
    collageText: "Your main bonus feature built from the session.",
    stripTitle: "Photo Strip",
    stripText: "Your web-ready single strip.",
    boomerangTitle: "Boomerang",
    boomerangText: "A looping motion moment from your session.",
    gifTitle: "GIF",
    gifText: "A quick animated moment from your session.",
    freezeSectionTitle: "Freeze Frames",
    shuffleAll: "🔀 Shuffle All",
    applyFreezeChanges: "Apply Freeze Changes"
  };

  let freezeOffsets = [0, 0, 0, 0];

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function setText(selector, text) {
    const el = qs(selector);
    if (el && typeof text === "string") el.textContent = text;
  }

  function cardTitle(card) {
    const h = qs(".card-head h2", card) || qs(".card-head h3", card);
    return (h?.textContent || "").trim();
  }

  function cardBody(card) {
    return qs(".card-head p", card);
  }

  function removeSessionVideoSection() {
    const headings = qsa(".section-title");
    const sessionHeading = headings.find(el =>
      (el.textContent || "").trim().toLowerCase() === "session video"
    );
    if (!sessionHeading) return;
    const next = sessionHeading.nextElementSibling;
    if (next) next.remove();
    sessionHeading.remove();
  }

  function applyCopy() {
    setText(".bonus-head h1", COPY.pageTitle);
    setText(".bonus-head p", COPY.pageSubtitle);

    qsa(".card").forEach((card) => {
      const title = cardTitle(card);
      const h = qs(".card-head h2", card) || qs(".card-head h3", card);
      const p = cardBody(card);
      if (!h || !p) return;

      if (title === "Collage Video") {
        h.textContent = COPY.collageTitle;
        p.textContent = COPY.collageText;
      } else if (title === "Photo Strip") {
        h.textContent = COPY.stripTitle;
        p.textContent = COPY.stripText;
      } else if (title === "Boomerang") {
        h.textContent = COPY.boomerangTitle;
        p.textContent = COPY.boomerangText;
      } else if (title === "GIF") {
        h.textContent = COPY.gifTitle;
        p.textContent = COPY.gifText;
      }
    });

    const freezeHeading = qsa(".section-title").find(el =>
      (el.textContent || "").trim().toLowerCase() === "freeze frames"
    );
    if (freezeHeading) freezeHeading.textContent = COPY.freezeSectionTitle;
  }

  function tightenFreezeButtonsOnMobile() {
    if (window.innerWidth > 700) return;
    qsa("#stills-grid .actions").forEach((actions) => {
      actions.style.flexDirection = "column";
      actions.style.alignItems = "stretch";
    });
  }

  function polishCards() {
    qsa(".card").forEach((card) => {
      card.style.borderColor = "rgba(255,255,255,0.12)";
    });
  }

  function cacheBust(url) {
    const u = new URL(url, window.location.href);
    u.searchParams.set("v", Date.now().toString());
    return u.toString();
  }

  function refreshMediaInPlace(type) {
    const map = {
      boomerang: { frameId: "boomerang-frame" },
      gif: { frameId: "gif-frame" },
      collage: { frameId: "collage-frame" },
      strip: { frameId: "strip-frame" }
    };
    const item = map[type];
    if (!item) return;

    const frame = document.getElementById(item.frameId);
    if (!frame) return;

    const video = frame.querySelector("video");
    const img = frame.querySelector("img");

    if (video) {
      const nextUrl = cacheBust(video.currentSrc || video.src);
      video.src = nextUrl;
      video.load();
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
      return;
    }

    if (img) {
      img.src = cacheBust(img.currentSrc || img.src);
    }
  }

  function refreshFreezeImages() {
    qsa("#stills-grid img").forEach((img) => {
      img.src = cacheBust(img.currentSrc || img.src);
    });
  }

  function getGuestShareUrl() {
    const code = window.InstapicCore?.getCodeFromUrl?.() || "";
    const u = new URL(window.location.href);
    u.search = "";
    u.hash = "";
    u.pathname = u.pathname.replace(/\/[^/]*$/, "/bonus.html");
    u.searchParams.set("code", code);
    return u.toString();
  }

  function patchShareButtons() {
    qsa(".actions").forEach((actions) => {
      const buttons = qsa("button, a", actions);
      buttons.forEach((el) => {
        const txt = (el.textContent || "").trim().toLowerCase();
        if (txt === "share") {
          el.onclick = null;
          el.addEventListener("click", async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();

            const shareUrl = getGuestShareUrl();

            try {
              if (navigator.share) {
                await navigator.share({
                  title: "Instapic Bonus",
                  url: shareUrl
                });
              } else {
                await navigator.clipboard.writeText(shareUrl);
                const old = el.textContent;
                el.textContent = "Link Copied";
                setTimeout(() => { el.textContent = old; }, 1400);
              }
            } catch (_) {}
          }, { once: false });
        }
      });
    });
  }

  async function runRegenerate(type, btn) {
    const core = window.InstapicCore;
    const code = core?.getCodeFromUrl?.();
    if (!code || !core?.API_BASE) return false;

    const oldLabel = btn ? btn.textContent : "";
    if (btn) {
      btn.textContent = "Regenerating...";
      btn.disabled = true;
    }

    try {
      const res = await fetch(
        `${core.API_BASE}/api/regenerate/${encodeURIComponent(code)}?type=${encodeURIComponent(type)}`,
        { method: "POST" }
      );

      let data = {};
      try { data = await res.json(); } catch (_) {}

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      refreshMediaInPlace(type);

      if (btn) {
        btn.textContent = "Done";
        setTimeout(() => {
          btn.textContent = oldLabel;
          btn.disabled = false;
        }, 1200);
      }
      return true;
    } catch (err) {
      console.error("regen failed", type, err);
      if (btn) {
        btn.textContent = "Failed";
        setTimeout(() => {
          btn.textContent = oldLabel;
          btn.disabled = false;
        }, 1500);
      }
      return false;
    }
  }

  function addRegenerateButton(actionsId, type) {
    const actions = document.getElementById(actionsId);
    if (!actions || actions.querySelector(".regen-btn")) return;

    const btn = document.createElement("button");
    btn.className = "btn alt regen-btn";
    btn.type = "button";
    btn.textContent = "🔁 Regenerate";

    btn.addEventListener("click", async () => {
      await runRegenerate(type, btn);
      patchShareButtons();
    });

    actions.appendChild(btn);
  }

  function addShuffleAllButton() {
    const motionGrid = qs(".motion-grid");
    if (!motionGrid || qs("#shuffle-all-btn")) return;

    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.justifyContent = "center";
    wrap.style.margin = "0 0 18px 0";

    const btn = document.createElement("button");
    btn.id = "shuffle-all-btn";
    btn.className = "btn";
    btn.type = "button";
    btn.textContent = COPY.shuffleAll;

    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const old = btn.textContent;
      btn.textContent = "Shuffling...";

      const a = await runRegenerate("boomerang");
      const b = await runRegenerate("gif");

      btn.textContent = (a || b) ? "Done" : "Failed";
      setTimeout(() => {
        btn.textContent = old;
        btn.disabled = false;
      }, 1400);
    });

    wrap.appendChild(btn);
    motionGrid.parentNode.insertBefore(wrap, motionGrid);
  }

  function updateFreezeOffsetLabels() {
    qsa(".freeze-adjust-readout").forEach((el, idx) => {
      const v = freezeOffsets[idx] || 0;
      el.textContent = `${v >= 0 ? "+" : ""}${v.toFixed(1)}s`;
    });
  }

  async function previewFreeze(index) {
    const core = window.InstapicCore;
    const code = core?.getCodeFromUrl?.();
    if (!code || !core?.API_BASE) return;

    const card = qsa("#stills-grid .card")[index];
    if (!card) return;
    const img = qs("img", card);
    if (!img) return;

    const offset = freezeOffsets[index] || 0;

    try {
      const res = await fetch(
        `${core.API_BASE}/api/preview-freeze/${encodeURIComponent(code)}?index=${index + 1}&offset=${encodeURIComponent(offset)}`
      );
      let data = {};
      try { data = await res.json(); } catch (_) {}
      if (!res.ok || data.ok === false || !data.url) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      img.src = cacheBust(`${core.API_BASE}${data.url}`);
    } catch (err) {
      console.error("preview freeze failed", index + 1, err);
    }
  }

  async function bestNearbyFreeze(index, btn) {
    const core = window.InstapicCore;
    const code = core?.getCodeFromUrl?.();
    if (!code || !core?.API_BASE) return;

    const old = btn.textContent;
    btn.textContent = "Finding...";
    btn.disabled = true;

    try {
      const offset = freezeOffsets[index] || 0;
      const res = await fetch(
        `${core.API_BASE}/api/best-nearby-freeze/${encodeURIComponent(code)}?index=${index + 1}&offset=${encodeURIComponent(offset)}`
      );
      let data = {};
      try { data = await res.json(); } catch (_) {}

      if (!res.ok || data.ok === false || !data.url) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      freezeOffsets[index] = Number(data.offset || 0);
      updateFreezeOffsetLabels();

      const card = qsa("#stills-grid .card")[index];
      const img = card ? qs("img", card) : null;
      if (img) {
        img.src = cacheBust(`${core.API_BASE}${data.url}`);
      }

      btn.textContent = "Done";
      setTimeout(() => {
        btn.textContent = old;
        btn.disabled = false;
      }, 1200);
    } catch (err) {
      console.error("best nearby failed", index + 1, err);
      btn.textContent = "Failed";
      setTimeout(() => {
        btn.textContent = old;
        btn.disabled = false;
      }, 1400);
    }
  }

  function addFreezeAdjustControls() {
    const cards = qsa("#stills-grid .card");
    if (!cards.length) return;

    cards.forEach((card, idx) => {
      if (qs(".freeze-adjust-row", card)) return;

      const actions = qs(".actions", card);
      if (!actions) return;

      const row = document.createElement("div");
      row.className = "freeze-adjust-row";
      row.style.display = "flex";
      row.style.gap = "8px";
      row.style.alignItems = "center";
      row.style.justifyContent = "center";
      row.style.padding = "0 16px 12px 16px";
      row.style.flexWrap = "wrap";

      const back = document.createElement("button");
      back.className = "btn alt";
      back.type = "button";
      back.textContent = "◀";

      const label = document.createElement("div");
      label.className = "freeze-adjust-readout";
      label.style.minWidth = "56px";
      label.style.textAlign = "center";
      label.style.fontSize = "14px";
      label.style.color = "rgba(255,255,255,0.86)";
      label.textContent = "+0.0s";

      const fwd = document.createElement("button");
      fwd.className = "btn alt";
      fwd.type = "button";
      fwd.textContent = "▶";

      const magic = document.createElement("button");
      magic.className = "btn alt";
      magic.type = "button";
      magic.textContent = "✨ Best Nearby";

      back.addEventListener("click", async () => {
        freezeOffsets[idx] = Math.max(-2.5, (freezeOffsets[idx] || 0) - 0.2);
        updateFreezeOffsetLabels();
        await previewFreeze(idx);
      });

      fwd.addEventListener("click", async () => {
        freezeOffsets[idx] = Math.min(2.5, (freezeOffsets[idx] || 0) + 0.2);
        updateFreezeOffsetLabels();
        await previewFreeze(idx);
      });

      magic.addEventListener("click", async () => {
        await bestNearbyFreeze(idx, magic);
      });

      row.appendChild(back);
      row.appendChild(label);
      row.appendChild(fwd);
      row.appendChild(magic);

      actions.parentNode.insertBefore(row, actions);
    });

    updateFreezeOffsetLabels();
  }

  function addApplyFreezeChangesButton() {
    const grid = qs("#stills-grid");
    if (!grid || qs("#apply-freeze-btn")) return;

    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.justifyContent = "center";
    wrap.style.margin = "18px 0 0 0";

    const btn = document.createElement("button");
    btn.id = "apply-freeze-btn";
    btn.className = "btn";
    btn.type = "button";
    btn.textContent = COPY.applyFreezeChanges;

    btn.addEventListener("click", async () => {
      const core = window.InstapicCore;
      const code = core?.getCodeFromUrl?.();
      if (!code || !core?.API_BASE) return;

      const old = btn.textContent;
      btn.textContent = "Applying...";
      btn.disabled = true;

      try {
        const res = await fetch(
          `${core.API_BASE}/api/update-freezes/${encodeURIComponent(code)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ offsets: freezeOffsets })
          }
        );

        let data = {};
        try { data = await res.json(); } catch (_) {}

        if (!res.ok || data.ok === false) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        refreshMediaInPlace("strip");
        refreshMediaInPlace("collage");
        refreshFreezeImages();

        btn.textContent = "Done";
        setTimeout(() => {
          btn.textContent = old;
          btn.disabled = false;
        }, 1400);
      } catch (err) {
        console.error("freeze update failed", err);
        btn.textContent = "Failed";
        setTimeout(() => {
          btn.textContent = old;
          btn.disabled = false;
        }, 1600);
      }
    });

    wrap.appendChild(btn);
    grid.parentNode.appendChild(wrap);
  }

  function injectButtons() {
    addRegenerateButton("boomerang-actions", "boomerang");
    addRegenerateButton("gif-actions", "gif");
    addShuffleAllButton();
    addFreezeAdjustControls();
    addApplyFreezeChangesButton();
  }

  function initPatch() {
    removeSessionVideoSection();
    applyCopy();
    tightenFreezeButtonsOnMobile();
    polishCards();
    patchShareButtons();
  }

  document.addEventListener("DOMContentLoaded", initPatch);
  window.addEventListener("load", initPatch);
  setTimeout(initPatch, 600);
  setTimeout(initPatch, 1600);
  setTimeout(injectButtons, 1200);
  setTimeout(patchShareButtons, 1800);
})();
