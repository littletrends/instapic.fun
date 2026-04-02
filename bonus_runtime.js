(function () {
  function asFullUrl(path) {
    return `${window.InstapicCore.API_BASE}${path}`;
  }

  function basename(url) {
    return String(url).split("/").pop().split("?")[0].toLowerCase();
  }

  function looksLikeVideo(url) {
    return /\.(mp4|webm|mov)($|\?)/i.test(url);
  }

  function looksLikeGif(url) {
    return /\.gif($|\?)/i.test(url);
  }

  function guessExtension(url) {
    const m = String(url).match(/\.([a-zA-Z0-9]+)($|\?)/);
    return m ? m[1] : "jpg";
  }

  function classifyFile(url) {
    const name = basename(url);

    if (name.includes("strip_web")) return "strip";
    if (name.includes("strip")) return "strip";
    if (name.includes("gif")) return "gif";
    if (name.includes("collage")) return "collage";
    if (name.includes("boomerang")) return "boomerang";
    if (name.includes("video")) return "boomerang";
    if (name.includes("freeze")) return "freezes";

    if (looksLikeGif(url)) return "gif";
    if (looksLikeVideo(url)) return "boomerang";

    return "freezes";
  }

  async function forceDownload(url, filename) {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);

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

  function createMediaCard(url, index, code, label) {
    const card = document.createElement("div");
    card.className = "bonus-card";

    if (looksLikeVideo(url) || looksLikeGif(url)) {
      const video = document.createElement(looksLikeGif(url) ? "img" : "video");
      if (looksLikeGif(url)) {
        video.src = url;
        video.alt = label || `Bonus ${index + 1}`;
      } else {
        video.src = url;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
      }
      video.className = "bonus-media";
      card.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = url;
      img.alt = label || `Bonus ${index + 1}`;
      img.className = "bonus-media";
      card.appendChild(img);
    }

    const labelEl = document.createElement("div");
    labelEl.className = "hero-label";
    labelEl.textContent = label || `Bonus ${index + 1}`;
    card.appendChild(labelEl);

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

  function renderDeliverable(groupId, files, code, labels) {
    const block = document.getElementById(`deliverable-${groupId}`);
    const grid = document.getElementById(`deliverable-${groupId}-grid`);
    if (!block || !grid || !files.length) return;

    block.hidden = false;
    grid.innerHTML = "";

    files.forEach((url, idx) => {
      const label = labels?.[idx] || null;
      grid.appendChild(createMediaCard(url, idx, code, label));
    });
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

      const grouped = {
        strip: [],
        gif: [],
        collage: [],
        boomerang: [],
        freezes: [],
      };

      full.forEach((url) => {
        grouped[classifyFile(url)].push(url);
      });

      const heroChoice =
        grouped.strip[0] ||
        grouped.gif[0] ||
        grouped.collage[0] ||
        grouped.boomerang[0] ||
        grouped.freezes[0];

      if (heroEl && heroChoice) {
        if (looksLikeVideo(heroChoice)) {
          const video = document.createElement("video");
          video.id = "bonus-hero";
          video.src = heroChoice;
          video.autoplay = true;
          video.loop = true;
          video.muted = true;
          video.playsInline = true;
          video.className = "hero-strip";
          heroEl.replaceWith(video);
        } else {
          heroEl.src = heroChoice;
        }
      }

      if (heroLabel) {
        heroLabel.textContent = `Featured Bonus • ${data.bg_id || "Instapic Set"}`;
      }

      renderDeliverable("strip", grouped.strip, code, grouped.strip.map(() => "Photo Strip"));
      renderDeliverable("gif", grouped.gif, code, grouped.gif.map(() => "GIF"));
      renderDeliverable("collage", grouped.collage, code, grouped.collage.map(() => "Collage"));
      renderDeliverable("boomerang", grouped.boomerang, code, grouped.boomerang.map((u) => looksLikeVideo(u) ? "Boomerang / Video" : "Boomerang"));
      renderDeliverable("freezes", grouped.freezes, code, grouped.freezes.map((_, i) => `Bonus Still ${i + 1}`));

      if (statusGif) {
        const hasMotion = grouped.gif.length || grouped.boomerang.length;
        statusGif.querySelector("p").textContent = hasMotion
          ? "Your motion bonus files are ready."
          : "No motion bonus was found for this session.";
      }

      if (statusCollage) {
        const hasSetFiles = grouped.strip.length || grouped.collage.length || grouped.freezes.length;
        statusCollage.querySelector("p").textContent = hasSetFiles
          ? "Your template set bonus files are ready."
          : "No template-set extras were found for this session.";
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
