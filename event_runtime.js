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
    const roll = qs("#strip-roll");
    if (!roll) return;
    roll.innerHTML = "";

    const withStrip = sessions.filter((s) => s.strip_url);
    if (!withStrip.length) {
      roll.innerHTML = '<div class="strip-empty">No photostrips yet — they appear here as sessions finish.</div>';
      return;
    }

    withStrip.forEach((s) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "strip-card" + (s.ticket_code === selectedCode ? " is-selected" : "");
      card.dataset.code = s.ticket_code;
      card.innerHTML = `
        <img src="${mediaUrl(s.strip_url)}" alt="Strip ${s.ticket_code}" loading="lazy">
        <div class="strip-code">${s.starred ? '<span class="strip-star">★</span> ' : ""}${s.ticket_code}</div>
      `;
      card.addEventListener("click", () => selectSession(s.ticket_code));
      roll.appendChild(card);
    });

    startRoll();
  }

  function startRoll() {
    stopRoll();
    const roll = qs("#strip-roll");
    if (!roll || roll.scrollWidth <= roll.clientWidth + 8) return;

    rollTimer = window.setInterval(() => {
      if (!roll || roll.matches(":hover")) return;
      const max = roll.scrollWidth - roll.clientWidth;
      if (max <= 0) return;
      const next = roll.scrollLeft + 130;
      if (next >= max - 4) {
        roll.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        roll.scrollTo({ left: next, behavior: "smooth" });
      }
    }, 3200);
  }

  function stopRoll() {
    if (rollTimer) {
      clearInterval(rollTimer);
      rollTimer = null;
    }
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
    qs("#strip-roll")?.querySelectorAll(".strip-card").forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.code === selectedCode);
    });

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
