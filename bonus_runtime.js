(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(text) {
    const el = $("bonus-status");
    if (el) el.textContent = text;
  }

  function looksLikeVideo(url) {
    return /\.(mp4|webm|mov)($|\?)/i.test(url);
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
    if (!frame || !actions || !url) return;

    frame.innerHTML = "";
    actions.innerHTML = "";

    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";

    if (opts && opts.autoplay) {
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
    if (!frame || !actions || !url) return;

    frame.innerHTML = "";
    actions.innerHTML = "";

    const img = document.createElement("img");
    img.src = url;
    img.alt = label;
    frame.appendChild(img);

    actions.appendChild(createDownloadButton(url, downloadName, `Download ${label}`));
    actions.appendChild(createShareButton(url, `Instapic ${label}`));
  }

  function renderStillCard(grid, url, i) {
    const card = document.createElement("section");
    card.className = "card";

    const head = document.createElement("div");
    head.className = "card-head";
    head.innerHTML = `
      <h3>Photo ${i}</h3>
      <p>Your captured freeze frame.</p>
    `;

    const wrap = document.createElement("div");
    wrap.className = "media-wrap";

    const frame = document.createElement("div");
    frame.className = "media-frame";

    const img = document.createElement("img");
    img.src = url;
    img.alt = `Freeze ${i}`;

    frame.appendChild(img);
    wrap.appendChild(frame);

    const actions = document.createElement("div");
    actions.className = "actions";
    actions.appendChild(createDownloadButton(url, `freeze_${i}.jpg`, `Download Photo ${i}`));
    actions.appendChild(createShareButton(url, `Instapic Photo ${i}`));

    card.appendChild(head);
    card.appendChild(wrap);
    card.appendChild(actions);
    grid.appendChild(card);
  }

  function firstMatch(files, pattern) {
    return files.find((p) => pattern.test(p)) || "";
  }

  function fullUrl(core, relPath) {
    if (!relPath) return "";
    if (/^https?:\/\//i.test(relPath)) return relPath;
    return `${core.BASE}${relPath}`;
  }

  async function init() {
    const core = window.InstapicCore;
    if (!core) {
      console.error("[bonus] InstapicCore missing");
      setStatus("Bonus page core not loaded.");
      return;
    }

    const code = (core.getCodeFromUrl() || "").trim();
    if (!code) {
      setStatus("No booth code found in the page URL.");
      return;
    }

    setStatus(`Loading session ${code}…`);

    let data;
    try {
      data = await core.getBonus(code);
    } catch (err) {
      console.error("[bonus] load failed", err);
      setStatus(`Could not load your bonus session: ${err.message}`);
      if (core.showFlash) {
        core.showFlash(`Could not load your bonus files: ${err.message}`, "error");
      }
      return;
    }

    const rawFiles = [];
    if (Array.isArray(data.bonus_files)) rawFiles.push(...data.bonus_files);
    if (Array.isArray(data.files)) rawFiles.push(...data.files);

    const uniqueFiles = [...new Set(rawFiles)].filter(Boolean);

    const stripPath = firstMatch(uniqueFiles, /strip_web\.(png|jpg|jpeg)$/i);
    const collagePath = firstMatch(uniqueFiles, /collage\.(mp4|webm|mov)$/i);
    const boomerangPath = firstMatch(uniqueFiles, /boomerang\.(mp4|webm|mov)$/i);
    const gifPath = firstMatch(uniqueFiles, /gif\.(gif|mp4|webm)$/i);
    const sessionVideoPath = firstMatch(uniqueFiles, /session_video\.(mp4|webm|mov)$/i);

    const freezePaths = uniqueFiles.filter((p) => /freeze_[1-4]\.(jpg|jpeg|png)$/i.test(p));

    const stripUrl = fullUrl(core, stripPath);
    const collageUrl = fullUrl(core, collagePath);
    const boomerangUrl = fullUrl(core, boomerangPath);
    const gifUrl = fullUrl(core, gifPath);
    const sessionVideoUrl = fullUrl(core, sessionVideoPath);

    if (collageUrl) {
      showVideo("collage-frame", "collage-actions", collageUrl, "collage.mp4", "Collage", {
        autoplay: true,
        loop: true
      });
    }

    if (stripUrl) {
      showImage("strip-frame", "strip-actions", stripUrl, "strip_web.png", "Strip");
    }

    if (boomerangUrl) {
      showVideo("boomerang-frame", "boomerang-actions", boomerangUrl, "boomerang.mp4", "Boomerang", {
        autoplay: true,
        loop: true
      });
    }

    if (gifUrl) {
      if (looksLikeVideo(gifUrl)) {
        showVideo("gif-frame", "gif-actions", gifUrl, "gif.mp4", "GIF", {
          autoplay: true,
          loop: true
        });
      } else {
        showImage("gif-frame", "gif-actions", gifUrl, "gif.gif", "GIF");
      }
    }

    if (sessionVideoUrl) {
      showVideo("session-video-frame", "session-video-actions", sessionVideoUrl, "session_video.mp4", "Session Video", {
        autoplay: false,
        loop: false
      });
    }

    const stillsGrid = $("stills-grid");
    if (stillsGrid) {
      stillsGrid.innerHTML = "";
      freezePaths
        .sort()
        .forEach((relPath, idx) => renderStillCard(stillsGrid, fullUrl(core, relPath), idx + 1));
    }

    const loadedAnything =
      !!stripUrl || !!collageUrl || !!boomerangUrl || !!gifUrl || !!sessionVideoUrl || freezePaths.length > 0;

    setStatus(
      loadedAnything
        ? `Session ${code} loaded.`
        : `Session ${code} found, but no published bonus files were returned.`
    );
  }

  document.addEventListener("DOMContentLoaded", init);
})();
