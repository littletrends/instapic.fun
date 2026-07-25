(function () {
  const core = window.InstapicCore;
  if (!core) {
    console.error("[event_runtime] InstapicCore missing");
    return;
  }

  const STORAGE_KEY = "instapic_event_portal_v1";
  let portalState = null; // { pin, event, sessions }
  let selectedCode = "";
  let rollTimer = null;
  let carouselItems = []; // sessions with strips
  let carouselIndex = 0;
  let carouselWired = false;
  let timerHandle = null;
  let portalTimer = null; // { ends_at_unix, started_at_unix, state, ... }
  let portalExtras = { background_previews: [] };

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function setGateStatus(msg) {
    const el = qs("#event-status");
    if (el) el.textContent = msg || "";
  }

  function setPortalStatus(msg) {
    const el = qs("#portal-status");
    if (el) el.textContent = msg || "";
  }

  function apiUrl(path) {
    return `${core.API_BASE}${path}`;
  }

  function mediaUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${core.API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  }

  function saveSession(pin, eventCode) {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ pin, event_code: eventCode, at: Date.now() })
      );
    } catch (_) {}
  }

  function loadSaved() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function clearSaved() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

  function showGate() {
    const gate = qs("#event-gate");
    const portal = qs("#event-portal");
    if (gate) gate.hidden = false;
    if (portal) portal.hidden = true;
    stopRoll();
    stopCountdown();
  }

  function showPortal() {
    const gate = qs("#event-gate");
    const portal = qs("#event-portal");
    if (gate) gate.hidden = true;
    if (portal) portal.hidden = false;
  }

  async function fetchPortalByPin(pin, date) {
    let path = `/api/event-portal-by-pin/${encodeURIComponent(pin)}`;
    if (date) path += `?date=${encodeURIComponent(date)}`;
    const res = await fetch(apiUrl(path));
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const err = new Error(data.message || data.error || `HTTP ${res.status}`);
      err.payload = data;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function formatCountdown(totalSec) {
    if (totalSec == null || totalSec < 0) return "—";
    const s = Math.floor(totalSec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(r).padStart(2, "0")}s left`;
    if (m > 0) return `${m}m ${String(r).padStart(2, "0")}s left`;
    return `${r}s left`;
  }

  function stopCountdown() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  function paintCountdown() {
    const el = qs("#event-countdown");
    if (!el) return;
    const t = portalTimer || {};
    const ends = t.ends_at_unix;
    const started = t.started_at_unix;

    if (t.state === "finished") {
      el.textContent = "Event finished";
      el.classList.add("is-finished");
      stopCountdown();
      return;
    }

    // Only tick when booth Activate wrote a real running window (not a website-only demo)
    if (t.state === "running" && ends && started && ends > started) {
      const left = Math.max(0, ends - Date.now() / 1000);
      el.classList.remove("is-finished");
      if (left <= 0) {
        el.textContent = "Event finished";
        el.classList.add("is-finished");
        stopCountdown();
        return;
      }
      el.textContent = "Live on booth · " + formatCountdown(left);
      return;
    }

    // Kiosk still in regular session mode
    const mins =
      t.duration_minutes ||
      portalState?.event?.duration_minutes ||
      (portalState?.event?.hours ? portalState.event.hours * 60 : null);
    el.classList.remove("is-finished");
    if (mins) {
      el.textContent =
        mins + " min planned · booth not in event mode — Activate in admin to start countdown";
    } else {
      el.textContent = "Timer starts when you Activate this event on the booth";
    }
  }

  function startCountdown() {
    stopCountdown();
    paintCountdown();
    // Only poll every second while the booth event is actually running
    if (portalTimer && portalTimer.state === "running") {
      timerHandle = window.setInterval(paintCountdown, 1000);
    }
  }

  function renderHeader(event) {
    const nameEl = qs("#event-name");
    const metaEl = qs("#event-meta");
    // Single display name from admin → MotherPC event_name (not brand twice)
    const displayName = event.event_name || event.event_portal_title || "Private Event";
    if (nameEl) nameEl.textContent = displayName;

    const bits = [];
    if (event.host_name) bits.push(`Host: ${event.host_name}`);
    const bgs = event.allowed_backgrounds || [];
    if (bgs.length) bits.push(`Backgrounds: ${bgs.join(", ")}`);
    bits.push(`${(portalState?.sessions || []).length} session(s)`);
    // Only show brand if different from the display name
    const brand = String(event.brand_label || "").trim();
    if (brand && brand.toLowerCase() !== String(displayName).toLowerCase()) {
      bits.unshift(`Strip brand: ${brand}`);
    }
    if (metaEl) metaEl.textContent = bits.join(" · ");

    // Real background previews (from admin allowed_backgrounds via MotherPC)
    const row = qs("#bg-preview-row");
    if (row) {
      row.innerHTML = "";
      const previews = portalExtras.background_previews || [];
      if (!previews.length && bgs.length) {
        bgs.forEach((id) => {
          previews.push({ id, url: `/api/background-preview/${id}` });
        });
      }
      previews.forEach((p) => {
        const card = document.createElement("div");
        card.className = "bg-preview-card";
        card.innerHTML = `
          <img src="${mediaUrl(p.url)}" alt="${p.id}" loading="lazy"
            onerror="this.style.opacity=0.25;this.alt='missing';">
          <div class="bg-id">${p.id}</div>
        `;
        row.appendChild(card);
      });
      if (!previews.length) {
        row.innerHTML = '<p class="muted" style="margin:0;font-size:0.9rem;">No backgrounds locked on this event yet (set them in admin).</p>';
      }
    }
  }

  function renderSessionSide(sessions) {
    const chips = qs("#session-chips");
    const select = qs("#session-select");
    if (chips) chips.innerHTML = "";
    if (select) {
      select.innerHTML = '<option value="">Select…</option>';
    }

    if (!sessions.length) {
      if (chips) {
        const empty = document.createElement("span");
        empty.className = "muted";
        empty.style.fontSize = "0.85rem";
        empty.textContent = "No sessions yet";
        chips.appendChild(empty);
      }
      return;
    }

    sessions.forEach((s) => {
      const code = s.ticket_code;
      if (select) {
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = (s.starred ? "★ " : "") + code;
        select.appendChild(opt);
      }
      if (chips) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "session-chip" + (code === selectedCode ? " is-selected" : "");
        btn.dataset.code = code;
        btn.draggable = true;
        btn.textContent = (s.starred ? "★ " : "") + code;
        btn.title = s.bonus_ready ? "Ready" : "Processing";
        btn.addEventListener("click", () => selectSession(code));
        btn.addEventListener("dragstart", (ev) => {
          ev.dataTransfer.setData("text/plain", code);
          ev.dataTransfer.effectAllowed = "copy";
        });
        chips.appendChild(btn);
      }
    });
    if (select && selectedCode) select.value = selectedCode;
  }

  function renderStripRoll(sessions) {
    const stage = qs("#carousel-stage");
    const dots = qs("#carousel-dots");
    if (!stage) return;

    carouselItems = sessions.filter((s) => s.strip_url);
    stage.innerHTML = "";
    if (dots) dots.innerHTML = "";

    if (!carouselItems.length) {
      stage.innerHTML = '<div class="strip-empty">No photostrips yet — strips appear here as sessions finish.</div>';
      stopRoll();
      return;
    }

    // Prefer selected session as centre when possible
    if (selectedCode) {
      const idx = carouselItems.findIndex((s) => s.ticket_code === selectedCode);
      if (idx >= 0) carouselIndex = idx;
    }
    carouselIndex = ((carouselIndex % carouselItems.length) + carouselItems.length) % carouselItems.length;

    carouselItems.forEach((s, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "carousel-card";
      card.dataset.code = s.ticket_code;
      card.dataset.index = String(i);
      card.innerHTML = `
        <div class="carousel-card-inner">
          <img src="${mediaUrl(s.strip_url)}" alt="Strip ${s.ticket_code}" loading="lazy" draggable="false">
          <div class="strip-code">${s.starred ? '<span class="strip-star">★</span> ' : ""}${s.ticket_code}</div>
        </div>
      `;
      card.addEventListener("click", () => {
        carouselIndex = i;
        layoutCarousel();
        selectSession(s.ticket_code);
        openStripLightbox(s);
      });
      stage.appendChild(card);

      if (dots) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Go to strip " + s.ticket_code);
        dot.addEventListener("click", () => {
          carouselIndex = i;
          layoutCarousel();
          selectSession(s.ticket_code);
        });
        dots.appendChild(dot);
      }
    });

    layoutCarousel();
    startRoll();
  }

  function layoutCarousel() {
    const n = carouselItems.length;
    if (!n) return;
    carouselIndex = ((carouselIndex % n) + n) % n;

    const cards = qs("#carousel-stage")?.querySelectorAll(".carousel-card") || [];
    const dots = qs("#carousel-dots")?.querySelectorAll("button") || [];
    const radius = Math.min(210, 42 + n * 12);

    cards.forEach((card) => {
      const i = Number(card.dataset.index || 0);
      let offset = i - carouselIndex;
      // shortest path around ring for nicer spacing when many items
      if (offset > n / 2) offset -= n;
      if (offset < -n / 2) offset += n;

      const angle = offset * (Math.PI / 7); // ~25.7° steps
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius - radius;
      const rotY = offset * -18;
      const scale = Math.max(0.62, 1 - Math.abs(offset) * 0.1);
      const opacity = Math.max(0.28, 1 - Math.abs(offset) * 0.18);
      const zIndex = 100 - Math.abs(offset);

      card.style.transform =
        `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`;
      card.style.left = "50%";
      card.style.top = "50%";
      card.style.opacity = String(opacity);
      card.style.zIndex = String(zIndex);
      card.style.filter = Math.abs(offset) > 2 ? "brightness(0.72)" : "none";
      card.classList.toggle("is-center", offset === 0);
      card.classList.toggle("is-selected", card.dataset.code === selectedCode);
      // Hide cards far behind for cleanliness
      card.style.visibility = Math.abs(offset) > 4 ? "hidden" : "visible";
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === carouselIndex);
    });
  }

  function startRoll() {
    stopRoll();
    if (carouselItems.length < 2) return;
    rollTimer = window.setInterval(() => {
      const wrap = qs("#carousel-wrap");
      if (wrap && (wrap.matches(":hover") || wrap.matches(":focus-within"))) return;
      carouselIndex = (carouselIndex + 1) % carouselItems.length;
      layoutCarousel();
    }, 3400);
  }

  function stopRoll() {
    if (rollTimer) {
      clearInterval(rollTimer);
      rollTimer = null;
    }
  }

  function openMediaLightbox(opts) {
    const box = qs("#strip-lightbox");
    const mediaHost = qs("#strip-lightbox-media");
    const code = qs("#strip-lightbox-code");
    const inner = qs("#strip-lightbox-inner");
    if (!box || !mediaHost || !opts || !opts.src) return;

    mediaHost.innerHTML = "";
    const kind = opts.kind || "image";
    if (kind === "video") {
      if (inner) inner.classList.add("is-wide");
      const v = document.createElement("video");
      v.src = opts.src;
      v.controls = true;
      v.playsInline = true;
      v.autoplay = true;
      v.loop = !!opts.loop;
      v.muted = opts.muted !== false;
      mediaHost.appendChild(v);
    } else {
      if (inner) inner.classList.remove("is-wide");
      const img = document.createElement("img");
      img.src = opts.src;
      img.alt = opts.label || "Media";
      mediaHost.appendChild(img);
    }
    if (code) code.textContent = opts.label || "";
    box.hidden = false;
  }

  function openStripLightbox(session) {
    if (!session || !session.strip_url) return;
    openMediaLightbox({
      kind: "image",
      src: mediaUrl(session.strip_url),
      label: "Strip " + session.ticket_code + (session.starred ? " ★" : ""),
    });
  }

  function closeStripLightbox() {
    const box = qs("#strip-lightbox");
    const mediaHost = qs("#strip-lightbox-media");
    if (mediaHost) {
      mediaHost.querySelectorAll("video").forEach((v) => {
        try { v.pause(); } catch (_) {}
      });
      mediaHost.innerHTML = "";
    }
    if (box) box.hidden = true;
  }

  function wireMediaControls(videoEl, controlsEl, openOpts) {
    if (!videoEl || !controlsEl) return;
    controlsEl.hidden = false;
    controlsEl.innerHTML = "";

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.textContent = "Play";
    playBtn.addEventListener("click", () => {
      if (videoEl.paused) {
        videoEl.play().catch(() => {});
        playBtn.textContent = "Pause";
      } else {
        videoEl.pause();
        playBtn.textContent = "Play";
      }
    });
    videoEl.addEventListener("play", () => { playBtn.textContent = "Pause"; });
    videoEl.addEventListener("pause", () => { playBtn.textContent = "Play"; });

    const muteBtn = document.createElement("button");
    muteBtn.type = "button";
    muteBtn.textContent = videoEl.muted ? "Unmute" : "Mute";
    muteBtn.addEventListener("click", () => {
      videoEl.muted = !videoEl.muted;
      muteBtn.textContent = videoEl.muted ? "Unmute" : "Mute";
    });

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.textContent = "Open large";
    openBtn.addEventListener("click", () => openMediaLightbox(openOpts));

    controlsEl.appendChild(playBtn);
    controlsEl.appendChild(muteBtn);
    controlsEl.appendChild(openBtn);
  }

  function mountVideo(slotSel, controlsSel, url, openLabel, loop, autoplay) {
    const slot = qs(slotSel);
    const controls = qs(controlsSel);
    if (!slot) return null;
    slot.innerHTML = "";
    // clone node to drop old click handlers
    const fresh = slot.cloneNode(false);
    slot.parentNode.replaceChild(fresh, slot);
    const v = document.createElement("video");
    v.className = "viewer-media";
    v.src = url;
    v.playsInline = true;
    v.muted = true;
    v.loop = !!loop;
    v.preload = "metadata";
    // no native controls on the picture — bar sits underneath
    v.controls = false;
    fresh.appendChild(v);
    fresh.addEventListener("click", () => {
      openMediaLightbox({
        kind: "video",
        src: url,
        label: openLabel,
        loop: !!loop,
        muted: true,
      });
    });
    wireMediaControls(v, controls, {
      kind: "video",
      src: url,
      label: openLabel,
      loop: !!loop,
      muted: false,
    });
    if (autoplay) {
      v.play().catch(() => {});
    }
    return v;
  }

  function wireCarouselControls() {
    if (carouselWired) return;
    carouselWired = true;
    qs("#carousel-prev")?.addEventListener("click", () => {
      if (!carouselItems.length) return;
      carouselIndex = (carouselIndex - 1 + carouselItems.length) % carouselItems.length;
      layoutCarousel();
      const s = carouselItems[carouselIndex];
      if (s) selectSession(s.ticket_code);
    });
    qs("#carousel-next")?.addEventListener("click", () => {
      if (!carouselItems.length) return;
      carouselIndex = (carouselIndex + 1) % carouselItems.length;
      layoutCarousel();
      const s = carouselItems[carouselIndex];
      if (s) selectSession(s.ticket_code);
    });

    // Swipe on carousel
    const wrap = qs("#carousel-wrap");
    if (wrap) {
      let startX = 0;
      wrap.addEventListener("pointerdown", (ev) => {
        startX = ev.clientX;
      });
      wrap.addEventListener("pointerup", (ev) => {
        const dx = ev.clientX - startX;
        if (Math.abs(dx) < 40 || !carouselItems.length) return;
        if (dx < 0) carouselIndex = (carouselIndex + 1) % carouselItems.length;
        else carouselIndex = (carouselIndex - 1 + carouselItems.length) % carouselItems.length;
        layoutCarousel();
        const s = carouselItems[carouselIndex];
        if (s) selectSession(s.ticket_code);
      });
    }

    qs("#strip-lightbox-close")?.addEventListener("click", closeStripLightbox);
    qs("#strip-lightbox")?.addEventListener("click", (ev) => {
      if (ev.target && ev.target.id === "strip-lightbox") closeStripLightbox();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") closeStripLightbox();
    });
  }

  function setSlot(id, html) {
    const el = qs(id);
    if (el) el.innerHTML = html;
  }

  function renderViewer(session) {
    const drop = qs("#drop-zone");
    ["#collage-controls", "#gif-controls", "#boomerang-controls"].forEach((id) => {
      const c = qs(id);
      if (c) {
        c.hidden = true;
        c.innerHTML = "";
      }
    });

    if (!session) {
      if (drop) {
        drop.textContent = "Drop a session code here — or pick from the list";
        drop.classList.remove("is-selected");
      }
      setSlot("#collage-slot", '<div class="viewer-placeholder">No session selected</div>');
      setSlot("#gif-slot", '<div class="viewer-placeholder">—</div>');
      setSlot("#boomerang-slot", '<div class="viewer-placeholder">—</div>');
      return;
    }

    if (drop) {
      drop.textContent = "Session " + session.ticket_code;
      drop.classList.add("is-selected");
    }

    // Full-width stack, auto-start muted
    if (session.collage_url) {
      mountVideo(
        "#collage-slot",
        "#collage-controls",
        mediaUrl(session.collage_url),
        "Collage " + session.ticket_code,
        true,
        true
      );
    } else {
      setSlot("#collage-slot", '<div class="viewer-placeholder">Collage not ready yet</div>');
    }

    if (session.gif_url) {
      const g = session.gif_url.toLowerCase();
      if (g.endsWith(".gif")) {
        const slot = qs("#gif-slot");
        const controls = qs("#gif-controls");
        if (slot) {
          const url = mediaUrl(session.gif_url);
          const fresh = slot.cloneNode(false);
          slot.parentNode.replaceChild(fresh, slot);
          fresh.innerHTML = `<img class="viewer-media" src="${url}" alt="GIF ${session.ticket_code}">`;
          fresh.addEventListener("click", () => openMediaLightbox({
            kind: "image",
            src: url,
            label: "GIF " + session.ticket_code,
          }));
        }
        if (controls) {
          controls.hidden = false;
          controls.innerHTML = "";
          const openBtn = document.createElement("button");
          openBtn.type = "button";
          openBtn.textContent = "Open large";
          openBtn.addEventListener("click", () => openMediaLightbox({
            kind: "image",
            src: mediaUrl(session.gif_url),
            label: "GIF " + session.ticket_code,
          }));
          controls.appendChild(openBtn);
        }
      } else {
        mountVideo(
          "#gif-slot",
          "#gif-controls",
          mediaUrl(session.gif_url),
          "GIF " + session.ticket_code,
          true,
          true
        );
      }
    } else {
      setSlot("#gif-slot", '<div class="viewer-placeholder">GIF not ready</div>');
    }

    if (session.boomerang_url) {
      mountVideo(
        "#boomerang-slot",
        "#boomerang-controls",
        mediaUrl(session.boomerang_url),
        "Boomerang " + session.ticket_code,
        true,
        true
      );
    } else {
      setSlot("#boomerang-slot", '<div class="viewer-placeholder">Boomerang not ready</div>');
    }

    const openBonus = qs("#btn-open-bonus");
    if (openBonus) {
      openBonus.disabled = !session.ticket_code;
      openBonus.onclick = () => {
        window.open(`bonus.html?code=${encodeURIComponent(session.ticket_code)}`, "_blank");
      };
    }
  }

  function selectSession(code) {
    selectedCode = String(code || "").trim();
    const sessions = portalState?.sessions || [];
    const session = sessions.find((s) => s.ticket_code === selectedCode) || null;

    const select = qs("#session-select");
    if (select) select.value = selectedCode || "";

    qs("#session-chips")?.querySelectorAll(".session-chip").forEach((chip) => {
      chip.classList.toggle("is-selected", chip.dataset.code === selectedCode);
    });
    const carIdx = carouselItems.findIndex((s) => s.ticket_code === selectedCode);
    if (carIdx >= 0) {
      carouselIndex = carIdx;
      layoutCarousel();
    } else {
      qs("#carousel-stage")?.querySelectorAll(".carousel-card").forEach((card) => {
        card.classList.toggle("is-selected", card.dataset.code === selectedCode);
      });
    }

    renderViewer(session);
    if (session) {
      setPortalStatus(
        `Showing ${session.ticket_code}` +
          (session.bonus_ready ? "" : " (still processing)")
      );
    }
  }

  function applyPortalPayload(data, pin) {
    portalState = {
      pin,
      event: data.event || {},
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
    };
    portalExtras = {
      background_previews: Array.isArray(data.background_previews) ? data.background_previews : [],
    };
    portalTimer = data.timer || null;
    // Prefer live server remaining if present
    if (portalTimer && portalTimer.ends_at_unix && portalTimer.server_now_unix) {
      const skew = Date.now() / 1000 - portalTimer.server_now_unix;
      // keep ends_at as absolute unix; paint uses client clock ≈ ok
      void skew;
    }

    saveSession(pin, portalState.event.event_code);
    renderHeader(portalState.event);
    renderSessionSide(portalState.sessions);
    renderStripRoll(portalState.sessions);
    startCountdown();
    showPortal();

    if (selectedCode && portalState.sessions.some((s) => s.ticket_code === selectedCode)) {
      selectSession(selectedCode);
    } else if (portalState.sessions.length) {
      // Auto-select first ready session so media auto-starts
      const first = portalState.sessions.find((s) => s.collage_url || s.strip_url) || portalState.sessions[0];
      selectSession(first.ticket_code);
    } else {
      selectedCode = "";
      renderViewer(null);
      const openBonus = qs("#btn-open-bonus");
      if (openBonus) openBonus.disabled = true;
    }

    setPortalStatus(
      portalState.sessions.length
        ? `${portalState.sessions.length} session(s) · carousel or chips to switch · media auto-plays muted`
        : "Portal open — waiting for the first session to finish"
    );
  }

  async function unlockWithPin(pin, date) {
    const clean = String(pin || "").replace(/\D/g, "");
    if (!/^\d{4,6}$/.test(clean)) {
      throw new Error("Enter a 4–6 digit host PIN");
    }
    setGateStatus("Unlocking event…");
    const data = await fetchPortalByPin(clean, date);
    applyPortalPayload(data, clean);
    setGateStatus("");
  }

  async function refreshPortal() {
    if (!portalState?.pin) return;
    setPortalStatus("Refreshing…");
    try {
      const data = await fetchPortalByPin(portalState.pin);
      applyPortalPayload(data, portalState.pin);
    } catch (err) {
      setPortalStatus("Refresh failed: " + (err.message || err));
    }
  }

  function wireDropZone() {
    wireCarouselControls();
    const zone = qs("#drop-zone");
    if (!zone) return;

    ["dragenter", "dragover"].forEach((name) => {
      zone.addEventListener(name, (ev) => {
        ev.preventDefault();
        zone.classList.add("is-over");
      });
    });
    ["dragleave", "drop"].forEach((name) => {
      zone.addEventListener(name, (ev) => {
        ev.preventDefault();
        zone.classList.remove("is-over");
      });
    });
    zone.addEventListener("drop", (ev) => {
      const code = (ev.dataTransfer.getData("text/plain") || "").trim();
      if (/^\d{6}$/.test(code)) selectSession(code);
    });
  }

  function wireUi() {
    const form = qs("#event-pin-form");
    if (form) {
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const pin = qs("#event_pin")?.value || "";
        try {
          await unlockWithPin(pin);
        } catch (err) {
          console.error(err);
          setGateStatus(err.message || "Could not unlock event");
          if (core.showFlash) core.showFlash(err.message || "Unlock failed", "error");
        }
      });
    }

    qs("#session-select")?.addEventListener("change", (ev) => {
      selectSession(ev.target.value);
    });

    qs("#btn-refresh")?.addEventListener("click", () => refreshPortal());
    qs("#btn-lock")?.addEventListener("click", () => {
      portalState = null;
      selectedCode = "";
      clearSaved();
      showGate();
      setGateStatus("Portal locked.");
      const pinInput = qs("#event_pin");
      if (pinInput) pinInput.value = "";
    });

    wireDropZone();
  }

  async function init() {
    if (document.body?.dataset?.page !== "event") return;
    wireUi();
    showGate();

    const params = new URLSearchParams(window.location.search);
    const urlPin = (params.get("pin") || "").replace(/\D/g, "");
    const urlDate = (params.get("date") || "").trim();

    if (urlPin) {
      const pinInput = qs("#event_pin");
      if (pinInput) pinInput.value = urlPin;
      try {
        await unlockWithPin(urlPin, urlDate || undefined);
        return;
      } catch (err) {
        setGateStatus(err.message || "PIN from link failed");
      }
    }

    const saved = loadSaved();
    if (saved?.pin) {
      try {
        await unlockWithPin(saved.pin);
      } catch (_) {
        clearSaved();
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
