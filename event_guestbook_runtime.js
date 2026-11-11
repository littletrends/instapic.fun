/**
 * Host portal: guest video guestbook.
 * Locked until Instapic admin unlocks OR 24h after the event ends (auto).
 * Host PIN cannot unlock early.
 */
(function () {
  const core = window.InstapicCore;
  const panel = document.getElementById("event-guestbook-panel");
  const summary = document.getElementById("event-guestbook-summary");
  const list = document.getElementById("event-guestbook-list");
  const status = document.getElementById("event-guestbook-status");
  const unlockBtn = document.getElementById("event-guestbook-unlock");
  const refreshBtn = document.getElementById("event-guestbook-refresh");

  let eventCode = "";
  let pin = "";
  let countdownTimer = null;

  async function readJson(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }
    return data;
  }

  function mediaUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const base = (core && (core.API_BASE || core.BASE)) || "";
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }

  function formatDuration(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function formatWhen(unix) {
    if (!unix) return "";
    try {
      return new Date(Number(unix) * 1000).toLocaleString();
    } catch (_) {
      return "";
    }
  }

  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function render(data) {
    if (!panel) return;
    panel.hidden = false;
    const count = Number(data.count || 0);
    const locked = data.locked !== false;
    const autoAt = data.auto_unlock_at_unix || null;
    let secs = data.seconds_until_auto_unlock;
    if (secs == null && autoAt) {
      secs = Math.max(0, Math.floor(autoAt - Date.now() / 1000));
    }

    // Host never gets an early-unlock button — admin only (or auto 24h)
    if (unlockBtn) {
      unlockBtn.hidden = true;
      unlockBtn.disabled = true;
    }

    if (summary) {
      if (count === 0) {
        summary.textContent =
          "No guest video messages yet. Guests use the slim button on the Magic Mirror event portal.";
      } else if (locked) {
        const when = formatWhen(autoAt);
        summary.textContent =
          `${count} guest message${count === 1 ? "" : "s"} waiting. ` +
          `Locked for now — they open for you automatically 24 hours after the event ends` +
          (when ? ` (${when})` : "") +
          `. Instapic can unlock earlier if needed.`;
      } else {
        const by = data.unlocked_by === "admin" ? " (unlocked by Instapic)" : "";
        summary.textContent = `${count} guest message${count === 1 ? "" : "s"} ready to watch${by}.`;
      }
    }

    if (!list) return;
    list.replaceChildren();
    stopCountdown();

    if (locked) {
      if (count > 0) {
        const p = document.createElement("p");
        p.className = "muted";
        p.style.textAlign = "center";
        p.id = "event-guestbook-countdown";
        if (autoAt || secs != null) {
          p.textContent = `Unlocks in ${formatDuration(secs)}`;
          list.appendChild(p);
          countdownTimer = setInterval(() => {
            const left = autoAt
              ? Math.max(0, Math.floor(autoAt - Date.now() / 1000))
              : 0;
            const el = document.getElementById("event-guestbook-countdown");
            if (!el) {
              stopCountdown();
              return;
            }
            if (left <= 0) {
              stopCountdown();
              el.textContent = "Unlocking…";
              refresh();
              return;
            }
            el.textContent = `Unlocks in ${formatDuration(left)}`;
          }, 30000);
        } else {
          p.textContent =
            "Messages stay locked until 24 hours after the event ends (or Instapic unlocks them).";
          list.appendChild(p);
        }
      }
      return;
    }

    const messages = data.messages || [];
    if (!messages.length) return;

    messages.forEach((m) => {
      const card = document.createElement("div");
      card.style.cssText =
        "padding:.75rem;border-radius:14px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.1)";
      const meta = document.createElement("div");
      meta.className = "muted";
      meta.style.fontSize = "0.85rem";
      meta.style.marginBottom = "0.4rem";
      meta.textContent = [
        m.created_at ? new Date(m.created_at).toLocaleString() : "",
        m.booth_id || "",
        m.target_label ? `for ${m.target_label}` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      card.appendChild(meta);
      if (m.url) {
        const video = document.createElement("video");
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.src = mediaUrl(m.url);
        video.style.cssText =
          "width:100%;max-height:360px;border-radius:12px;background:#000";
        card.appendChild(video);
      }
      list.appendChild(card);
    });
  }

  async function refresh() {
    if (!eventCode || !core) return;
    try {
      if (status) status.textContent = "";
      const res = await fetch(
        `${core.API_BASE}/api/event-guestbook/${encodeURIComponent(eventCode)}?pin=${encodeURIComponent(pin)}`,
        { cache: "no-store" }
      );
      const data = await readJson(res);
      render(data);
    } catch (err) {
      if (status) status.textContent = "Guest messages unavailable right now.";
    }
  }

  document.addEventListener("instapic:event-portal-loaded", (event) => {
    eventCode = event.detail?.event?.event_code || "";
    pin = event.detail?.pin || "";
    const gb = event.detail?.guestbook || event.detail?.portal?.guestbook;
    if (gb) render(gb);
    refresh();
  });

  refreshBtn?.addEventListener("click", refresh);
  // Unlock button intentionally not wired for hosts
})();
