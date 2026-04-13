(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getCodeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get("code") || params.get("ticket") || "").trim();
    return code;
  }

  function setStatus(text) {
    const el = $("bonus-status");
    if (el) el.textContent = text;
  }

  function fileUrl(code, relPath) {
    const safeCode = encodeURIComponent(code);
    return `/sessions/${safeCode}/${relPath}`;
  }

  function createDownloadButton(url, filename, label) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "";
    a.className = "btn";
    a.textContent = label;
    return a;
  }

  function createShareButton(url, title) {
    const btn = document.createElement("button");
    btn.className = "btn alt";
    btn.type = "button";
    btn.textContent = "Share";
    btn.addEventListener("click", async () => {
      try {
        if (navigator.share) {
          await navigator.share({ title, url });
        } else {
          await navigator.clipboard.writeText(url);
          btn.textContent = "Link Copied";
          setTimeout(() => { btn.textContent = "Share"; }, 1500);
        }
      } catch (_) {}
    });
    return btn;
  }

  function showVideo(frameId, actionsId, url, downloadName, label, opts) {
    const frame = $(frameId);
    const actions = $(actionsId);
    if (!frame || !actions) return;

    frame.innerHTML = "";
    actions.innerHTML = "";

    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    if (opts?.autoplay) {
      video.autoplay = true;
      video.muted = true;
      video.loop = !!opts.loop;
    }
    frame.appendChild(video);

    actions.appendChild(createDownloadButton(url, downloadName, `Download ${label}`));
    actions.appendChild(createShareButton(url, `Instapic ${label}`));
  }

  function showImage(frameId, actionsId, url, downloadName, label) {
    const frame = $(frameId);
    const actions = $(actionsId);
    if (!frame || !actions) return;

    frame.innerHTML = "";
    actions.innerHTML = "";

    const img = document.createElement("img");
    img.src = url;
    img.alt = label;
    frame.appendChild(img);

    actions.appendChild(createDownloadButton(url, downloadName, `Download ${label}`));
    actions.appendChild(createShareButton(url, `Instapic ${label}`));
  }

  function showStills(code) {
    const grid = $("stills-grid");
    if (!grid) return;

    grid.innerHTML = "";

    for (let i = 1; i <= 4; i += 1) {
      const url = fileUrl(code, `assets/freezes/freeze_${i}.jpg`);
      const card = document.createElement("section");
      card.className = "card";

      card.innerHTML = `
        <div class="card-head">
          <h3>Photo ${i}</h3>
          <p>Your captured freeze frame.</p>
        </div>
        <div class="media-wrap">
          <div class="media-frame">
            <img src="${escapeHtml(url)}" alt="Freeze ${i}">
          </div>
        </div>
      `;

      const actions = document.createElement("div");
      actions.className = "actions";
      actions.appendChild(createDownloadButton(url, `freeze_${i}.jpg`, `Download Photo ${i}`));
      actions.appendChild(createShareButton(url, `Instapic Photo ${i}`));

      card.appendChild(actions);
      grid.appendChild(card);
    }
  }

  async function init() {
    const code = getCodeFromUrl();

    if (!code) {
      setStatus("No booth code found in the page URL.");
      return;
    }

    setStatus(`Loading session ${code}…`);

    let data;
    try {
      if (window.InstapicCore && typeof window.InstapicCore.getBonus === "function") {
        data = await window.InstapicCore.getBonus(code);
      } else {
        const res = await fetch(`/api/get-bonus/${encodeURIComponent(code)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      }
    } catch (err) {
      console.error("[bonus] load failed", err);
      setStatus("Could not load your bonus session.");
      return;
    }

    const stripUrl = fileUrl(code, "bonus/strip_web.png");
    const collageUrl = fileUrl(code, "bonus/collage.mp4");
    const boomerangUrl = fileUrl(code, "bonus/boomerang.mp4");
    const gifUrl = fileUrl(code, "bonus/gif.gif");
    const sessionVideoUrl = fileUrl(code, "assets/video/session_video.mp4");

    showVideo("collage-frame", "collage-actions", collageUrl, "collage.mp4", "Collage", { autoplay: true, loop: true });
    showImage("strip-frame", "strip-actions", stripUrl, "strip_web.png", "Strip");
    showVideo("boomerang-frame", "boomerang-actions", boomerangUrl, "boomerang.mp4", "Boomerang", { autoplay: true, loop: true });
    showImage("gif-frame", "gif-actions", gifUrl, "gif.gif", "GIF");
    showVideo("session-video-frame", "session-video-actions", sessionVideoUrl, "session_video.mp4", "Session Video", { autoplay: false, loop: false });

    showStills(code);

    const manifestReady = data && typeof data === "object";
    if (manifestReady) {
      setStatus(`Session ${code} loaded.`);
    } else {
      setStatus(`Session ${code} loaded.`);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
