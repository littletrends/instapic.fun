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

    // Prefer explicit MotherPC template-set naming
    if (name.includes("_strip_web")) return "strip_web";
    if (name.includes("_strip")) return "strip";
    if (name.includes("_gif")) return "gif";
    if (name.includes("_boomerang")) return "boomerang";
    if (name.includes("_collage")) return "collage";

    // Current generated bonus/fallback names
    if (name.includes("boomerang")) return "boomerang";
    if (name.includes("collage")) return "collage";
    if (name.includes("gif")) return "gif";
    if (name.includes("strip")) return "strip";

    // Session motion / freezes
    if (name.includes("session_video")) return "boomerang";
    if (name.includes("freeze_")) return "freezes";

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

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function createMediaCard(url, index, code, label) {
    const card = document.createElement("div");
    card.className = "bonus-card";

    if (looksLikeVideo(url)) {
      const video = document.createElement("video");
      video.src = url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.controls = true;
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
        core.showFlash("Your session is still being prepared. Check back in a moment — your bonus will appear here automatically.", "error");
        return;
      }

      const grouped = {
        strip_web: [],
        strip: [],
        gif: [],
        collage: [],
        boomerang: [],
        freezes: [],
      };

      full.forEach((url) => {
        grouped[classifyFile(url)].push(url);
      });

      // Hero priority:
      // 1. strip_web
      // 2. gif
      // 3. collage
      // 4. boomerang
      // 5. strip
      // 6. freezes
      const heroChoice =
        grouped.strip_web[0] ||
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
          video.controls = false;
          video.className = "hero-strip";
          video.addEventListener("click", () => {
            video.controls = true;
          }, { once: true });
          heroEl.replaceWith(video);
        } else {
          heroEl.src = heroChoice;
        }
      }

      if (heroLabel) {
        heroLabel.textContent = `Featured Bonus • ${data.bg_id || "Instapic Set"}`;
      }

      document.body.classList.add("bonus-loaded");

      renderDeliverable(
        "strip",
        [...grouped.strip_web, ...grouped.strip],
        code,
        [...grouped.strip_web.map(() => "Web Strip"), ...grouped.strip.map(() => "Photo Strip")]
      );

      renderDeliverable(
        "gif",
        grouped.gif,
        code,
        grouped.gif.map(() => "GIF")
      );

      renderDeliverable(
        "collage",
        grouped.collage,
        code,
        grouped.collage.map(() => "Collage")
      );

      renderDeliverable(
        "boomerang",
        grouped.boomerang,
        code,
        grouped.boomerang.map((u) => basename(u).includes("boomerang") ? "Boomerang" : "Session Video")
      );

      renderDeliverable(
        "freezes",
        grouped.freezes,
        code,
        grouped.freezes.map((_, i) => `Bonus Still ${i + 1}`)
      );

      if (statusGif) {
        const hasMotion = grouped.gif.length || grouped.boomerang.length;
        statusGif.querySelector("p").textContent = hasMotion
          ? "Your GIF and motion bonus files are ready."
          : "No motion bonus was found for this session.";
      }

      if (statusCollage) {
        const hasSetFiles =
          grouped.strip_web.length ||
          grouped.strip.length ||
          grouped.collage.length ||
          grouped.freezes.length;

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
              await sleep(250);
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
