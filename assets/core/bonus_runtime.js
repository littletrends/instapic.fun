(function () {
  function asFullUrl(path) {
    return `${window.InstapicCore.BASE}${path}`;
  }

  function setImage(el, src, alt) {
    if (!el || !src) return;
    el.outerHTML = `<img id="${el.id}" src="${src}" alt="${alt}" class="bonus-media">`;
  }

  function setVideo(el, src) {
    if (!el || !src) return;
    el.outerHTML = `<video id="${el.id}" src="${src}" autoplay loop muted playsinline class="bonus-media"></video>`;
  }

  function looksLikeVideo(url) {
    return /\.mp4($|\?)/i.test(url) || /\.webm($|\?)/i.test(url) || /\.gif($|\?)/i.test(url);
  }

  function mapFiles(files) {
    const full = files.map(asFullUrl);

    const strip = full[0] || "";
    const collage = full[1] || "";
    const gif = full[2] || "";
    const boomerang = full[3] || "";

    return { strip, collage, gif, boomerang, all: full };
  }

  async function initBonusPage() {
    const core = window.InstapicCore;
    if (!core || core.dataPage() !== "bonus") return;

    const code = core.getCodeFromUrl();
    if (!code) {
      alert("Missing code.");
      return;
    }

    const stripEl = core.qs("#bonus-strip");
    const collageEl = core.qs("#bonus-collage");
    const gifEl = core.qs("#bonus-gif");
    const boomerangEl = core.qs("#bonus-boomerang");
    const downloadBtn = core.qs("#download-all");
    const shareBtn = core.qs("#share-magic");

    try {
      const data = await core.getBonus(code);
      const files = Array.isArray(data.bonus_files) ? data.bonus_files : [];

      if (!files.length) {
        alert("Your bonus page is unlocked, but files are not ready yet.");
        return;
      }

      const mapped = mapFiles(files);

      if (mapped.strip) stripEl.src = mapped.strip;

      if (mapped.collage) {
        if (looksLikeVideo(mapped.collage)) setVideo(collageEl, mapped.collage);
        else setImage(collageEl, mapped.collage, "Bonus Still 2");
      }

      if (mapped.gif) {
        if (looksLikeVideo(mapped.gif)) setVideo(gifEl, mapped.gif);
        else setImage(gifEl, mapped.gif, "Bonus Still 3");
      }

      if (mapped.boomerang) {
        if (looksLikeVideo(mapped.boomerang)) setVideo(boomerangEl, mapped.boomerang);
        else setImage(boomerangEl, mapped.boomerang, "Bonus Still 4");
      }

      if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
          mapped.all.forEach((url, idx) => {
            const a = document.createElement("a");
            a.href = url;
            a.download = `instapic_bonus_${code}_${idx + 1}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
          });
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
      alert(`Could not load your bonus files: ${err.message}`);
    }
  }

  document.addEventListener("DOMContentLoaded", initBonusPage);
})();
