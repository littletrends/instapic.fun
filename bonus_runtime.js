(function () {
  function asFullUrl(path) {
    return `${window.InstapicCore.API_BASE}${path}`;
  }

  function looksLikeVideo(url) {
    return /\.(mp4|webm|gif)($|\?)/i.test(url);
  }

  function guessExtension(url) {
    const m = String(url).match(/\.([a-zA-Z0-9]+)($|\?)/);
    return m ? m[1] : "jpg";
  }

  async function forceDownload(url, filename) {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) {
      throw new Error(`Download failed (${res.status})`);
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || "instapic_file";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  }

  function createMediaCard(url, index, code) {
    const card = document.createElement("div");
    card.className = "bonus-card";

    const label = document.createElement("div");
    label.className = "hero-label";
    label.textContent = `Bonus ${index + 1}`;

    if (looksLikeVideo(url)) {
      const video = document.createElement("video");
      video.src = url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.className = "bonus-media";
      card.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = url;
      img.alt = `Bonus ${index + 1}`;
      img.className = "bonus-media";
      card.appendChild(img);
    }

    card.appendChild(label);

    const actions = document.createElement("div");
    actions.className = "bonus-card-actions";

    const downloadBtn = document.createElement("button");
    downloadBtn.type = "button";
    downloadBtn.className = "btn bonus-download-btn";
    downloadBtn.textContent = "Download";
    downloadBtn.addEventListener("click", async () => {
      try {
        const ext = guessExtension(url);
        await forceDownload(url, `instapic_bonus_${code}_${index + 1}.${ext}`);
      } catch (err) {
        alert(`Could not download this file: ${err.message}`);
      }
    });

    actions.appendChild(downloadBtn);
    card.appendChild(actions);

    return card;
  }

  async function initBonusPage() {
    const core = window.InstapicCore;
    if (!core || core.dataPage() !== "bonus") return;

    const code = core.getCodeFromUrl();
    if (!code) {
      core.showFlash("Missing code.", "error");
      return;
    }

    const heroEl = core.qs("#bonus-hero");
    const heroLabel = core.qs("#bonus-hero-label");
    const gridEl = core.qs("#bonus-grid");
    const downloadBtn = core.qs("#download-all");
    const shareBtn = core.qs("#share-magic");
    const statusGif = core.qs("#status-gif");
    const statusCollage = core.qs("#status-collage");

    try {
      const data = await core.getBonus(code);
      const files = Array.isArray(data.bonus_files) ? data.bonus_files : [];
      const full = files.map(asFullUrl);

      if (!full.length) {
        core.showFlash("Your bonus page is unlocked, but files are not ready yet.", "error");
        return;
      }

      if (heroEl && full[0]) {
        if (looksLikeVideo(full[0])) {
          const video = document.createElement("video");
          video.id = "bonus-hero";
          video.src = full[0];
          video.autoplay = true;
          video.loop = true;
          video.muted = true;
          video.playsInline = true;
          video.className = "hero-strip";
          heroEl.replaceWith(video);
        } else {
          heroEl.src = full[0];
        }
      }

      if (heroLabel) {
        heroLabel.textContent = `Featured Bonus • ${data.bg_id || "Instapic"}`;
      }

      if (gridEl) {
        gridEl.innerHTML = "";
        full.forEach((url, idx) => {
          gridEl.appendChild(createMediaCard(url, idx, code));
        });
      }

      if (statusGif) {
        const hasMotion = full.some(looksLikeVideo);
        statusGif.querySelector("p").textContent = hasMotion
          ? "Motion media is now available in this session."
          : "Video/GIF style media will appear here when recording is connected.";
      }

      if (statusCollage) {
        const extraBonus = full.some((u) => /\/bonus\//.test(u));
        statusCollage.querySelector("p").textContent = extraBonus
          ? "Background-set bonus files are connected for this session."
          : "Enhanced freeze bonuses are live now. Template media can be added next.";
      }

      if (downloadBtn) {
        downloadBtn.addEventListener("click", async () => {
          try {
            for (let idx = 0; idx < full.length; idx += 1) {
              const url = full[idx];
              const ext = guessExtension(url);
              await forceDownload(url, `instapic_bonus_${code}_${idx + 1}.${ext}`);
            }
          } catch (err) {
            alert(`Could not download all files: ${err.message}`);
          }
        });
      }

      if (shareBtn) {
        shareBtn.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            alert("Bonus page link copied.");
          } catch (_) {
            alert("Share flow coming next.");
          }
        });
      }
    } catch (err) {
      console.error("bonus load failed", err);
      core.showFlash(`Could not load your bonus files: ${err.message}`, "error");
    }
  }

  document.addEventListener("DOMContentLoaded", initBonusPage);
})();
