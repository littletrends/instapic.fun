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
  let guestEditsLocked = false;
  let hostCanManageLock = false;
  let hostPin = "";

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
    // Social share menu is owned by bonus_runtime.js (Share… / X / Facebook / Copy).
    // Do not rebind .share-btn here — that would collapse the multi-target menu.
  }

  async function runRegenerate(type, btn) {
    if (guestEditsLocked) {
      notifyLocked();
      return false;
    }
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
        if (data.error === "guest_edits_locked") {
          guestEditsLocked = true;
          applyEditLockUi();
          notifyLocked();
        }
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      refreshMediaInPlace(type);

      if (btn) {
        btn.textContent = "Done";
        setTimeout(() => {
          btn.textContent = oldLabel;
          btn.disabled = false;
          applyEditLockUi();
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
          applyEditLockUi();
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

  function notifyLocked() {
    const msg = "Host has locked this session — edits are off until they unlock.";
    if (window.InstapicCore?.showFlash) {
      window.InstapicCore.showFlash(msg, "error");
    } else {
      console.warn(msg);
    }
  }

  function applyEditLockUi() {
    const locked = !!guestEditsLocked;
    document.body.classList.toggle("bonus-edits-locked", locked);

    qsa(".freeze-adjust-row button, #apply-freeze-btn, .regen-btn, #shuffle-all-btn").forEach((btn) => {
      if (!btn) return;
      btn.disabled = locked;
      btn.style.opacity = locked ? "0.45" : "";
      btn.title = locked ? "Edits locked by host" : "";
    });

    const banner = qs("#bonus-edit-lock-banner");
    if (banner) {
      banner.hidden = !locked;
      banner.textContent = locked
        ? "🔒 Host locked edits — view & download only until unlocked."
        : "";
    }

    const hostBtn = qs("#host-edit-lock-btn");
    if (hostBtn) {
      hostBtn.hidden = !hostCanManageLock;
      hostBtn.textContent = locked ? "🔓 Unlock guest edits" : "🔒 Lock guest edits";
    }
  }

  function refreshHostLockContext() {
    const host = window.__instapicHostContext || {};
    const meta = window.__instapicBonusMeta || {};
    hostPin = String(host.pin || "").replace(/\D/g, "");
    // Host lock only for real private-event sessions while host is logged in
    // (from event portal). Regular / main sessions never get the button.
    hostCanManageLock = !!(
      host.loggedIn &&
      host.fromEvent &&
      hostPin &&
      meta.is_event &&
      meta.event_code
    );
    guestEditsLocked = !!meta.guest_edits_locked;
    applyEditLockUi();
    // Hide whole wrap when neither host tools nor locked banner needed
    const wrap = qs("#host-edit-lock-wrap");
    if (wrap) {
      wrap.hidden = !(hostCanManageLock || guestEditsLocked);
      wrap.style.display = wrap.hidden ? "none" : "flex";
    }
  }

  async function setGuestEditLock(locked) {
    const core = window.InstapicCore;
    const code = core?.getCodeFromUrl?.();
    if (!code || !core?.API_BASE || !hostPin) return false;

    const res = await fetch(
      `${core.API_BASE}/api/session-edit-lock/${encodeURIComponent(code)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: !!locked, pin: hostPin }),
      }
    );
    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok || data.ok === false) {
      throw new Error(data.message || data.error || `HTTP ${res.status}`);
    }
    guestEditsLocked = !!data.guest_edits_locked;
    if (window.__instapicBonusMeta) {
      window.__instapicBonusMeta.guest_edits_locked = guestEditsLocked;
    }
    applyEditLockUi();
    return true;
  }

  function ensureHostLockControls() {
    if (qs("#host-edit-lock-wrap")) {
      refreshHostLockContext();
      return;
    }

    const head = qs(".bonus-head");
    if (!head) return;

    const wrap = document.createElement("div");
    wrap.id = "host-edit-lock-wrap";
    wrap.hidden = true;
    wrap.style.display = "none";
    wrap.style.flexDirection = "column";
    wrap.style.alignItems = "center";
    wrap.style.gap = "8px";
    wrap.style.marginTop = "12px";

    const banner = document.createElement("div");
    banner.id = "bonus-edit-lock-banner";
    banner.hidden = true;
    banner.style.padding = "8px 12px";
    banner.style.borderRadius = "10px";
    banner.style.background = "rgba(255,80,120,0.18)";
    banner.style.border = "1px solid rgba(255,120,160,0.35)";
    banner.style.color = "#ffd0e0";
    banner.style.fontSize = "0.9rem";
    banner.style.textAlign = "center";
    banner.style.maxWidth = "28rem";

    const btn = document.createElement("button");
    btn.id = "host-edit-lock-btn";
    btn.type = "button";
    btn.className = "btn alt";
    btn.hidden = true;
    btn.style.minWidth = "180px";
    btn.addEventListener("click", async () => {
      const next = !guestEditsLocked;
      const old = btn.textContent;
      btn.disabled = true;
      btn.textContent = next ? "Locking…" : "Unlocking…";
      try {
        await setGuestEditLock(next);
        if (window.InstapicCore?.showFlash) {
          window.InstapicCore.showFlash(
            next ? "Guest edits locked for this session." : "Guest edits unlocked.",
            "ok"
          );
        }
      } catch (err) {
        console.error("edit lock failed", err);
        btn.textContent = "Failed";
        if (window.InstapicCore?.showFlash) {
          window.InstapicCore.showFlash(err.message || "Could not change lock", "error");
        }
        setTimeout(() => {
          btn.textContent = old;
          btn.disabled = false;
          applyEditLockUi();
        }, 1400);
        return;
      }
      btn.disabled = false;
    });

    wrap.appendChild(banner);
    wrap.appendChild(btn);
    head.appendChild(wrap);
    refreshHostLockContext();
  }

  async function previewFreeze(index) {
    if (guestEditsLocked) {
      notifyLocked();
      return;
    }
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
        if (data.error === "guest_edits_locked") {
          guestEditsLocked = true;
          applyEditLockUi();
          notifyLocked();
          return;
        }
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      // Keep orientation as returned — never CSS flip/rotate portrait freezes
      img.style.transform = "none";
      img.src = cacheBust(`${core.API_BASE}${data.url}`);
    } catch (err) {
      console.error("preview freeze failed", index + 1, err);
    }
  }

  async function bestNearbyFreeze(index, btn) {
    if (guestEditsLocked) {
      notifyLocked();
      return;
    }
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
        if (data.error === "guest_edits_locked") {
          guestEditsLocked = true;
          applyEditLockUi();
          notifyLocked();
          throw new Error("guest_edits_locked");
        }
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      freezeOffsets[index] = Number(data.offset || 0);
      updateFreezeOffsetLabels();

      const card = qsa("#stills-grid .card")[index];
      const img = card ? qs("img", card) : null;
      if (img) {
        // Portrait camera is permanent — never flip/rotate on replace
        img.style.transform = "none";
        img.style.aspectRatio = "3 / 4";
        img.style.objectFit = "cover";
        img.src = cacheBust(`${core.API_BASE}${data.url}`);
      }

      btn.textContent = "Done";
      setTimeout(() => {
        btn.textContent = old;
        btn.disabled = false;
        applyEditLockUi();
      }, 1200);
    } catch (err) {
      console.error("best nearby failed", index + 1, err);
      btn.textContent = err && err.message === "guest_edits_locked" ? "Locked" : "Failed";
      setTimeout(() => {
        btn.textContent = old;
        btn.disabled = false;
        applyEditLockUi();
      }, 1400);
    }
  }

  function addFreezeAdjustControls() {
    const cards = qsa("#stills-grid .card");
    if (!cards.length) return;

    cards.forEach((card, idx) => {
      if (qs(".freeze-adjust-row", card)) return;

      // Freeze cards no longer always have .actions (download/share removed).
      // Mount controls after the media wrap, or at end of the card.
      const mountAfter = qs(".media-wrap", card) || qs(".actions", card);

      const row = document.createElement("div");
      row.className = "freeze-adjust-row";
      row.style.display = "flex";
      row.style.gap = "6px";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.padding = "0 16px 12px 16px";
      row.style.flexWrap = "nowrap";

      const back = document.createElement("button");
      back.className = "btn alt";
      back.type = "button";
      back.textContent = "◀";

      const label = document.createElement("div");
      label.className = "freeze-adjust-readout";
      label.style.minWidth = "56px";
      label.style.textAlign = "center";
      label.style.fontSize = "13px";
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
        if (guestEditsLocked) { notifyLocked(); return; }
        freezeOffsets[idx] = Math.max(-2.5, (freezeOffsets[idx] || 0) - 0.2);
        updateFreezeOffsetLabels();
        await previewFreeze(idx);
      });

      fwd.addEventListener("click", async () => {
        if (guestEditsLocked) { notifyLocked(); return; }
        freezeOffsets[idx] = Math.min(2.5, (freezeOffsets[idx] || 0) + 0.2);
        updateFreezeOffsetLabels();
        await previewFreeze(idx);
      });

      magic.addEventListener("click", async () => {
        if (guestEditsLocked) { notifyLocked(); return; }
        await bestNearbyFreeze(idx, magic);
      });

      row.appendChild(back);
      row.appendChild(label);
      row.appendChild(fwd);
      row.appendChild(magic);

      if (mountAfter && mountAfter.parentNode === card) {
        if (mountAfter.nextSibling) {
          card.insertBefore(row, mountAfter.nextSibling);
        } else {
          card.appendChild(row);
        }
      } else {
        card.appendChild(row);
      }
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
      if (guestEditsLocked) {
        notifyLocked();
        return;
      }
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
          if (data.error === "guest_edits_locked") {
            guestEditsLocked = true;
            applyEditLockUi();
            notifyLocked();
          }
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        refreshMediaInPlace("strip");
        refreshMediaInPlace("collage");
        refreshFreezeImages();

        btn.textContent = "Done";
        setTimeout(() => {
          btn.textContent = old;
          btn.disabled = false;
          applyEditLockUi();
        }, 1400);
      } catch (err) {
        console.error("freeze update failed", err);
        btn.textContent = "Failed";
        setTimeout(() => {
          btn.textContent = old;
          btn.disabled = false;
          applyEditLockUi();
        }, 1600);
      }
    });

    wrap.appendChild(btn);
    // Sit directly under freeze frames, above footer nav (if present)
    const foot = qs(".bonus-foot");
    if (foot && foot.parentNode === grid.parentNode) {
      grid.parentNode.insertBefore(wrap, foot);
    } else if (grid.nextSibling) {
      grid.parentNode.insertBefore(wrap, grid.nextSibling);
    } else {
      grid.parentNode.appendChild(wrap);
    }
  }

  function injectButtons() {
    addRegenerateButton("boomerang-actions", "boomerang");
    addRegenerateButton("gif-actions", "gif");
    addShuffleAllButton();
    addFreezeAdjustControls();
    addApplyFreezeChangesButton();
    ensureHostLockControls();
    applyEditLockUi();
  }

  function initPatch() {
    removeSessionVideoSection();
    applyCopy();
    tightenFreezeButtonsOnMobile();
    polishCards();
    patchShareButtons();
    ensureHostLockControls();
    refreshHostLockContext();
  }

  document.addEventListener("instapic:bonus-meta", () => {
    ensureHostLockControls();
    refreshHostLockContext();
  });

  document.addEventListener("DOMContentLoaded", () => {
    initPatch();
  });
  window.addEventListener("load", () => {
    initPatch();
    injectButtons();
  });
  setTimeout(initPatch, 600);
  setTimeout(initPatch, 1600);
  setTimeout(injectButtons, 1200);
  setTimeout(injectButtons, 2500);
  setTimeout(injectButtons, 4500);
  setTimeout(patchShareButtons, 1800);
  setTimeout(refreshHostLockContext, 2000);
})();
