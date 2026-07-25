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

  function renderHeader(event) {
    const nameEl = qs("#event-name");
    const metaEl = qs("#event-meta");
    if (nameEl) nameEl.textContent = event.event_name || "Private Event";
    const bits = [];
    if (event.brand_label) bits.push(`Brand: ${event.brand_label}`);
    if (event.duration_minutes) bits.push(`${event.duration_minutes} min`);
    else if (event.hours) bits.push(`${event.hours}h`);
    if (event.host_name) bits.push(`Host: ${event.host_name}`);
    const bgs = event.allowed_backgrounds || [];
    if (bgs.length) bits.push(`BG: ${bgs.join(", ")}`);
    bits.push(`${(portalState?.sessions || []).length} session(s)`);
    if (metaEl) metaEl.textContent = bits.join(" · ");

    const thumb = qs("#event-template-thumb");
    if (thumb) {
      // Site-local plate preview (pipeline uses MotherPC copy later)
      thumb.src = "assets/img/event_templates/dual_4up_scifi_plate.jpg";
      thumb.alt = `${event.event_name || "Event"} strip plate template`;
    }
  }

  function renderSessionSide(sessions) {
    const select = qs("#session-select");
    const list = qs("#session-list");
    if (!select || !list) return;

    select.innerHTML = '<option value="">Select a session…</option>';
    list.innerHTML = "";

    if (!sessions.length) {
      const li = document.createElement("li");
      li.textContent = "No sessions yet";
      li.style.cursor = "default";
      li.style.letterSpacing = "0";
      list.appendChild(li);
      return;
    }

    sessions.forEach((s) => {
      const code = s.ticket_code;
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = `${s.starred ? "★ " : ""}${code}${s.bonus_ready ? "" : " (processing)"}`;
      select.appendChild(opt);

      const li = document.createElement("li");
      li.draggable = true;
      li.dataset.code = code;
      li.className = code === selectedCode ? "is-selected" : "";
      li.innerHTML = `<span>${s.starred ? "★ " : ""}${code}</span><span class="muted" style="letter-spacing:0;font-size:0.75rem;">${s.bonus_ready ? "ready" : "…"}</span>`;

      li.addEventListener("click", () => selectSession(code));
      li.addEventListener("dragstart", (ev) => {
        li.classList.add("dragging");
        ev.dataTransfer.setData("text/plain", code);
        ev.dataTransfer.effectAllowed = "copy";
      });
      li.addEventListener("dragend", () => li.classList.remove("dragging"));

      list.appendChild(li);
    });

    if (selectedCode) select.value = selectedCode;
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

  function openStripLightbox(session) {
    if (!session || !session.strip_url) return;
    const box = qs("#strip-lightbox");
    const img = qs("#strip-lightbox-img");
    const code = qs("#strip-lightbox-code");
    if (!box || !img) return;
    img.src = mediaUrl(session.strip_url);
    img.alt = "Photostrip " + session.ticket_code;
    if (code) code.textContent = session.ticket_code + (session.starred ? " ★" : "");
    box.hidden = false;
  }

  function closeStripLightbox() {
    const box = qs("#strip-lightbox");
    if (box) box.hidden = true;
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
    if (!session) {
      if (drop) drop.textContent = "Drop a session code here — or pick from the list";
      setSlot("#collage-slot", '<div class="viewer-placeholder">No session selected</div>');
      setSlot("#gif-slot", '<div class="viewer-placeholder">—</div>');
      setSlot("#boomerang-slot", '<div class="viewer-placeholder">—</div>');
      return;
    }

    if (drop) drop.textContent = `Session ${session.ticket_code} selected`;

    // Collage: one video, muted by default (party / mobile friendly)
    if (session.collage_url) {
      setSlot(
        "#collage-slot",
        `<video class="viewer-media" src="${mediaUrl(session.collage_url)}" controls playsinline muted loop preload="metadata"></video>`
      );
    } else {
      setSlot("#collage-slot", '<div class="viewer-placeholder">Collage not ready yet</div>');
    }

    if (session.gif_url) {
      const g = session.gif_url.toLowerCase();
      if (g.endsWith(".gif")) {
        setSlot("#gif-slot", `<img class="viewer-media" src="${mediaUrl(session.gif_url)}" alt="GIF">`);
      } else {
        setSlot(
          "#gif-slot",
          `<video class="viewer-media" src="${mediaUrl(session.gif_url)}" controls playsinline muted loop preload="metadata"></video>`
        );
      }
    } else {
      setSlot("#gif-slot", '<div class="viewer-placeholder">GIF not ready</div>');
    }

    if (session.boomerang_url) {
      setSlot(
        "#boomerang-slot",
        `<video class="viewer-media" src="${mediaUrl(session.boomerang_url)}" controls playsinline muted loop preload="metadata"></video>`
      );
    } else {
      setSlot("#boomerang-slot", '<div class="viewer-placeholder">Boomerang not ready</div>');
    }
  }

  function selectSession(code) {
    selectedCode = String(code || "").trim();
    const sessions = portalState?.sessions || [];
    const session = sessions.find((s) => s.ticket_code === selectedCode) || null;

    const select = qs("#session-select");
    if (select) select.value = selectedCode || "";

    qs("#session-list")?.querySelectorAll("li").forEach((li) => {
      li.classList.toggle("is-selected", li.dataset.code === selectedCode);
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
    saveSession(pin, portalState.event.event_code);
    renderHeader(portalState.event);
    renderSessionSide(portalState.sessions);
    renderStripRoll(portalState.sessions);
    showPortal();

    if (selectedCode && portalState.sessions.some((s) => s.ticket_code === selectedCode)) {
      selectSession(selectedCode);
    } else {
      selectedCode = "";
      renderViewer(null);
    }

    setPortalStatus(
      portalState.sessions.length
        ? `${portalState.sessions.length} session(s) · pick one for collage / GIF / boomerang`
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
