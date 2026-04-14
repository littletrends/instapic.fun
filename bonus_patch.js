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
    freezeSectionTitle: "Freeze Frames"
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

  function addRegenerateButton(actionsId, type) {
    const actions = document.getElementById(actionsId);
    if (!actions) return;
    if (actions.querySelector(".regen-btn")) return;

    const btn = document.createElement("button");
    btn.className = "btn alt regen-btn";
    btn.type = "button";
    btn.textContent = "🔁 Regenerate";

    btn.addEventListener("click", async () => {
      const core = window.InstapicCore;
      const code = core?.getCodeFromUrl?.();
      if (!code || !core?.API_BASE) return;

      btn.textContent = "Regenerating...";
      btn.disabled = true;

      try {
        const res = await fetch(
          `${core.API_BASE}/api/regenerate/${encodeURIComponent(code)}?type=${encodeURIComponent(type)}`,
          { method: "POST" }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        setTimeout(() => {
          window.location.reload();
        }, 900);
      } catch (err) {
        console.error("regen failed", err);
        btn.textContent = "Failed";
        setTimeout(() => {
          btn.textContent = "🔁 Regenerate";
          btn.disabled = false;
        }, 1500);
      }
    });

    actions.appendChild(btn);
  }

  function injectRegenerateButtons() {
    addRegenerateButton("boomerang-actions", "boomerang");
    addRegenerateButton("gif-actions", "gif");
  }

  function initPatch() {
    removeSessionVideoSection();
    applyCopy();
    tightenFreezeButtonsOnMobile();
    polishCards();
  }

  document.addEventListener("DOMContentLoaded", initPatch);
  window.addEventListener("load", initPatch);
  setTimeout(initPatch, 600);
  setTimeout(initPatch, 1600);
  setTimeout(injectRegenerateButtons, 1200);
})();
