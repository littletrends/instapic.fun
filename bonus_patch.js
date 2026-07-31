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
    applyFreezeChanges: "Create My New Bonus Set"
  };

  let freezeOffsets = [0, 0, 0, 0];
  let gifStart = 0;
  let boomerangStart = 0;
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

    qsa(".freeze-adjust-row button, #apply-freeze-btn, #shuffle-all-btn, .motion-choice input").forEach((btn) => {
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

      row.appendChild(back);
      row.appendChild(label);
      row.appendChild(fwd);

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

  async function loadMotionPreviewInfo(type, ui) {
    if (guestEditsLocked) {
      notifyLocked();
      return;
    }
    const core = window.InstapicCore;
    const code = core?.getCodeFromUrl?.();
    if (!code || !core?.API_BASE) return;

    ui.readout.textContent = "Loading…";
    try {
      const res = await fetch(
        `${core.API_BASE}/api/motion-preview-info/${encodeURIComponent(code)}`
      );
      let data = {};
      try { data = await res.json(); } catch (_) {}
      if (!res.ok || data.ok === false || !data.url) {
        if (data.error === "guest_edits_locked") {
          guestEditsLocked = true;
          applyEditLockUi();
          notifyLocked();
        }
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      ui.slider.max = String(Number(data.max_start || 0));
      ui.slider.value = String(Number(data.max_start || 0) / 2);
      const sliderSelected = Number(ui.slider.value);
      ui.readout.textContent = `${sliderSelected.toFixed(1)}s`;
      ui.videoUrl = `${core.API_BASE}${data.url}`;
      if (type === "gif") gifStart = sliderSelected;
      if (type === "boomerang") boomerangStart = sliderSelected;
    } catch (err) {
      console.error("motion preview info failed", type, err);
      ui.readout.textContent = "Preview failed";
    }
  }

  function playMotionPreview(type, ui) {
    if (guestEditsLocked) {
      notifyLocked();
      return;
    }
    if (!ui.videoUrl) return;

    const selected = Number(ui.slider.value);
    if (type === "gif") gifStart = selected;
    if (type === "boomerang") boomerangStart = selected;

    window.clearTimeout(ui.stopTimer);
    ui.playRequest += 1;
    const playRequest = ui.playRequest;

    let video = ui.frame.querySelector("video.motion-source-preview");
    if (!video) {
      video = document.createElement("video");
      video.className = "motion-source-preview";
      video.src = ui.videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.preload = "metadata";
      video.controls = true;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      ui.frame.replaceChildren(video);
      video.load();
      video.addEventListener("timeupdate", () => {
        if (Number.isFinite(ui.stopAt) && video.currentTime >= ui.stopAt) {
          video.pause();
          window.clearTimeout(ui.stopTimer);
        }
      });
    }

    const start = Math.max(0, selected);
    // The Boomerang generator turns four seconds forward into eight seconds
    // (four forward + the same four reversed). The direct preview shows the
    // four source seconds without asking MotherPC to render while sliding.
    const clipLength = type === "boomerang" ? 4.0 : 5.5;
    ui.stopAt = start + clipLength;
    const startPlayback = () => {
      if (playRequest !== ui.playRequest) return;
      try { video.currentTime = start; } catch (_) {}
      const playSelectedClip = () => {
        if (playRequest !== ui.playRequest) return;
        const promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(() => {});
        }
        window.clearTimeout(ui.stopTimer);
        ui.stopTimer = window.setTimeout(() => {
          if (playRequest === ui.playRequest) video.pause();
        }, (clipLength * 1000) + 180);
      };
      if (Math.abs(video.currentTime - start) < 0.08) playSelectedClip();
      else video.addEventListener("seeked", playSelectedClip, { once: true });
    };
    if (video.readyState >= 1) startPlayback();
    else video.addEventListener("loadedmetadata", startPlayback, { once: true });
  }

  function addMotionChoice(type, frameId) {
    const frame = qs(`#${frameId}`);
    const card = frame?.closest(".card");
    if (!card || qs(`.motion-choice[data-type="${type}"]`, card)) return;

    const wrap = document.createElement("div");
    wrap.className = "motion-choice";
    wrap.dataset.type = type;
    wrap.style.padding = "0 16px 14px";

    const title = document.createElement("div");
    title.textContent = `Choose ${type === "gif" ? "GIF" : "Boomerang"} moment`;
    title.style.fontWeight = "700";
    title.style.marginBottom = "8px";

    // The generated motion and selected still share one portrait viewer.
    // This avoids showing GIF/Boomerang twice on the same card.
    frame.style.aspectRatio = "752 / 1376";
    frame.style.height = "auto";
    frame.style.overflow = "hidden";

    const controls = document.createElement("div");
    controls.style.display = "grid";
    controls.style.gridTemplateColumns = "1fr 52px";
    controls.style.alignItems = "center";
    controls.style.gap = "10px";
    controls.style.marginTop = "9px";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "30";
    slider.step = "0.2";
    slider.value = "0";
    slider.setAttribute("aria-label", `Choose ${type} moment`);

    const readout = document.createElement("div");
    readout.style.textAlign = "right";
    readout.style.fontVariantNumeric = "tabular-nums";
    readout.textContent = "Loading…";

    const hint = document.createElement("div");
    hint.textContent = `Slide to choose where the ${type === "gif" ? "GIF" : "Boomerang"} starts. A short preview will play automatically.`;
    hint.style.fontSize = "12px";
    hint.style.opacity = "0.78";
    hint.style.marginTop = "6px";

    controls.appendChild(slider);
    controls.appendChild(readout);
    wrap.appendChild(title);
    wrap.appendChild(controls);
    wrap.appendChild(hint);

    const actions = qs(".actions", card);
    if (actions) card.insertBefore(wrap, actions);
    else card.appendChild(wrap);

    const ui = {
      slider,
      readout,
      frame,
      videoUrl: "",
      stopAt: Number.NaN,
      previewTimer: 0,
      stopTimer: 0,
      playRequest: 0
    };
    slider.addEventListener("input", () => {
      readout.textContent = `${Number(slider.value).toFixed(1)}s`;
      window.clearTimeout(ui.previewTimer);
      ui.previewTimer = window.setTimeout(() => playMotionPreview(type, ui), 140);
    });
    slider.addEventListener("change", () => {
      window.clearTimeout(ui.previewTimer);
      playMotionPreview(type, ui);
    });
    // Initialise the cursor without replacing the current generated motion.
    // Moving it seeks and autoplays directly from the existing session video.
    loadMotionPreviewInfo(type, ui);
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
          `${core.API_BASE}/api/update-bonus-choices/${encodeURIComponent(code)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              offsets: freezeOffsets,
              gif_start: gifStart,
              boomerang_start: boomerangStart
            })
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

        btn.textContent = "Done";
        setTimeout(() => {
          window.location.reload();
        }, 800);
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
    addShuffleAllButton();
    addMotionChoice("boomerang", "boomerang-frame");
    addMotionChoice("gif", "gif-frame");
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
