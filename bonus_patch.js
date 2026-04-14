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
    shuffleAll: "🔀 Shuffle All"
  };

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
      gif: { frameId: "gif-frame" }
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
      try {
        data = await res.json();
      } catch (_) {}

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
    if (!actions) return;
    if (actions.querySelector(".regen-btn")) return;

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

      if (a || b) {
        patchShareButtons();
        btn.textContent = "Done";
      } else {
        btn.textContent = "Failed";
      }

      setTimeout(() => {
        btn.textContent = old;
        btn.disabled = false;
      }, 1400);
    });

    wrap.appendChild(btn);
    motionGrid.parentNode.insertBefore(wrap, motionGrid);
  }

  function injectRegenerateButtons() {
    addRegenerateButton("boomerang-actions", "boomerang");
    addRegenerateButton("gif-actions", "gif");
    addShuffleAllButton();
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
  setTimeout(injectRegenerateButtons, 1200);
  setTimeout(patchShareButtons, 1800);
})();
