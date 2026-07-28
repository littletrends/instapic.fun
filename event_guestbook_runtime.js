/**
 * Host portal: guest video guestbook count + unlock (messages stay locked until host unlocks).
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

  function moneyless() {}

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

  function render(data) {
    if (!panel) return;
    panel.hidden = false;
    const count = Number(data.count || 0);
    const locked = data.locked !== false;
    if (summary) {
      if (count === 0) {
        summary.textContent =
          "No guest video messages yet. Guests use the slim button on the Magic Mirror event portal.";
      } else if (locked) {
        summary.textContent = `${count} guest message${count === 1 ? "" : "s"} waiting. Locked until you unlock (usually next day).`;
      } else {
        summary.textContent = `${count} guest message${count === 1 ? "" : "s"} unlocked for this event.`;
      }
    }
    if (unlockBtn) {
      unlockBtn.hidden = !locked || count === 0;
      unlockBtn.disabled = false;
    }
    if (!list) return;
    list.replaceChildren();
    const messages = data.messages || [];
    // Host with PIN gets message URLs even while locked (host preview)
    if (!messages.length) {
      if (locked && count > 0) {
        const p = document.createElement("p");
        p.className = "muted";
        p.style.textAlign = "center";
        p.textContent =
          "Messages are locked. Use Unlock messages, or re-enter host PIN and Refresh to preview.";
        list.appendChild(p);
      }
      return;
    }
    if (locked && data.host_preview) {
      const note = document.createElement("p");
      note.className = "muted";
      note.style.textAlign = "center";
      note.style.fontSize = "0.9rem";
      note.textContent =
        "Host preview — guests still cannot open these until you Unlock messages.";
      list.appendChild(note);
    }
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
        video.style.cssText = "width:100%;max-height:360px;border-radius:12px;background:#000";
        card.appendChild(video);
      }
      list.appendChild(card);
    });
  }

  async function refresh() {
    if (!eventCode || !core) return;
    try {
      if (status) status.textContent = "";
      // Prefer payload from portal load if present
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

  async function unlock() {
    if (!eventCode || !pin || !core) return;
    if (!confirm("Unlock guest video messages for this event?")) return;
    unlockBtn.disabled = true;
    try {
      const res = await fetch(
        `${core.API_BASE}/api/event-guestbook/${encodeURIComponent(eventCode)}/unlock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin }),
        }
      );
      await readJson(res);
      if (status) status.textContent = "Messages unlocked.";
      await refresh();
    } catch (err) {
      if (status) status.textContent = `Unlock failed: ${err.message || err}`;
      unlockBtn.disabled = false;
    }
  }

  document.addEventListener("instapic:event-portal-loaded", (event) => {
    eventCode = event.detail?.event?.event_code || "";
    pin = event.detail?.pin || "";
    // Use guestbook from payload if included
    const gb = event.detail?.guestbook || event.detail?.portal?.guestbook;
    if (gb) render(gb);
    refresh();
  });

  refreshBtn?.addEventListener("click", refresh);
  unlockBtn?.addEventListener("click", unlock);
})();
