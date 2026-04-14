(function () {
  const COPY = {
    pageTitle: "Your Instapic Bonus",
    pageSubtitle: "Your strip, collage, motion extras, and freeze frames.",
    statusPrefixLoaded: "Session",
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

  function removeFullSessionSection() {
    const heading = qsa(".section-title").find(el =>
      (el.textContent || "").trim().toLowerCase() === "session video"
    );
    if (!heading) return;

    const extrasGrid = heading.nextElementSibling;
    if (extrasGrid) extrasGrid.remove();
    heading.remove();
  }

  function applyCopy() {
    setText(".bonus-head h1", COPY.pageTitle);
    setText(".bonus-head p", COPY.pageSubtitle);

    const cards = qsa(".card");
    cards.forEach((card) => {
      const h2 = qs(".card-head h2", card);
      const h3 = qs(".card-head h3", card);
      const p = qs(".card-head p", card);
      const title = (h2 || h3)?.textContent?.trim();

      if (title === "Collage Video") {
        if (h2) h2.textContent = COPY.collageTitle;
        if (h3) h3.textContent = COPY.collageTitle;
        if (p) p.textContent = COPY.collageText;
      }
      if (title === "Photo Strip") {
        if (h2) h2.textContent = COPY.stripTitle;
        if (h3) h3.textContent = COPY.stripTitle;
        if (p) p.textContent = COPY.stripText;
      }
      if (title === "Boomerang") {
        if (h2) h2.textContent = COPY.boomerangTitle;
        if (h3) h3.textContent = COPY.boomerangTitle;
        if (p) p.textContent = COPY.boomerangText;
      }
      if (title === "GIF") {
        if (h2) h2.textContent = COPY.gifTitle;
        if (h3) h3.textContent = COPY.gifTitle;
        if (p) p.textContent = COPY.gifText;
      }
    });

    const sectionTitles = qsa(".section-title");
    const freezeHeading = sectionTitles.find(el =>
      (el.textContent || "").trim().toLowerCase() === "freeze frames"
    );
    if (freezeHeading) freezeHeading.textContent = COPY.freezeSectionTitle;
  }

  function cleanLoadedStatus() {
    const status = qs("#bonus-status");
    if (!status) return;

    const txt = (status.textContent || "").trim();
    const m = txt.match(/^Session\s+(\d{6})\s+loaded\.?$/i);
    if (m) {
      status.textContent = `${COPY.statusPrefixLoaded} ${m[1]} loaded.`;
    }
  }

  function initPatch() {
    removeFullSessionSection();
    applyCopy();
    cleanLoadedStatus();
  }

  document.addEventListener("DOMContentLoaded", initPatch);
  window.addEventListener("load", initPatch);
})();
