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

  function getGuestShareUrl() {
    try {
      const code = (window.InstapicCore && window.InstapicCore.getCodeFromUrl)
        ? window.InstapicCore.getCodeFromUrl()
        : "";
      const u = new URL(window.location.href);
      u.search = "";
      u.hash = "";
      u.pathname = u.pathname.replace(/\/[^/]*$/, "/bonus.html");
      if (code) u.searchParams.set("code", code);
      return u.toString();
    } catch (_) {
      return window.location.href;
    }
  }

  function shareCaption(label) {
    return `My Instapic ${label} ✨ Moments Made Magical — instapic.fun`;
  }

  async function tryNativeShare({ title, text, url, fileUrl }) {
    if (!navigator.share) return false;
    try {
      // Prefer sharing the file when the browser allows (mobile Safari/Chrome)
      if (fileUrl && navigator.canShare) {
        try {
          const res = await fetch(fileUrl, { mode: "cors" });
          if (res.ok) {
            const blob = await res.blob();
            const name = (fileUrl.split("/").pop() || "instapic").split("?")[0];
            const file = new File([blob], name, { type: blob.type || "application/octet-stream" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ title, text, files: [file] });
              return true;
            }
          }
        } catch (_) {
          // fall through to URL share
        }
      }
      await navigator.share({ title, text, url });
      return true;
    } catch (err) {
      // user cancel is fine
      if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) return true;
      return false;
    }
  }

  function openShareMenu(anchorBtn, { mediaUrl, label }) {
    // remove existing menus
    document.querySelectorAll(".share-menu").forEach((el) => el.remove());

    const pageUrl = getGuestShareUrl();
    const text = shareCaption(label);
    const encUrl = encodeURIComponent(pageUrl);
    const encText = encodeURIComponent(text);

    const menu = document.createElement("div");
    menu.className = "share-menu";
    menu.setAttribute("role", "menu");

    const items = [
      {
        id: "native",
        label: "Share… (Instagram / Snapchat / Messages)",
        hint: "Opens your phone share sheet — best for IG & Snap",
        action: async () => {
          const ok = await tryNativeShare({
            title: `Instapic ${label}`,
            text,
            url: pageUrl,
            fileUrl: mediaUrl,
          });
          if (!ok) {
            await navigator.clipboard.writeText(`${text}\n${pageUrl}`);
            flashMenu(menu, "Link copied — paste into the app");
          } else {
            menu.remove();
          }
        },
      },
      {
        id: "x",
        label: "X / Twitter",
        action: () => {
          window.open(
            `https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}`,
            "_blank",
            "noopener,noreferrer"
          );
          menu.remove();
        },
      },
      {
        id: "fb",
        label: "Facebook",
        action: () => {
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encUrl}&quote=${encText}`,
            "_blank",
            "noopener,noreferrer"
          );
          menu.remove();
        },
      },
      {
        id: "copy",
        label: "Copy link",
        action: async () => {
          try {
            await navigator.clipboard.writeText(`${text}\n${pageUrl}`);
            flashMenu(menu, "Copied!");
          } catch (_) {
            flashMenu(menu, "Could not copy");
          }
        },
      },
    ];

    items.forEach((item) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "share-menu-item";
      b.textContent = item.label;
      if (item.hint) {
        const hint = document.createElement("span");
        hint.className = "share-menu-hint";
        hint.textContent = item.hint;
        b.appendChild(document.createElement("br"));
        b.appendChild(hint);
      }
      b.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        item.action();
      });
      menu.appendChild(b);
    });

    // position under button
    const wrap = anchorBtn.parentElement || document.body;
    wrap.style.position = wrap.style.position || "relative";
    menu.style.position = "absolute";
    menu.style.zIndex = "40";
    menu.style.left = "0";
    menu.style.top = "100%";
    menu.style.marginTop = "8px";
    wrap.appendChild(menu);

    const closer = (ev) => {
      if (!menu.contains(ev.target) && ev.target !== anchorBtn) {
        menu.remove();
        document.removeEventListener("click", closer, true);
      }
    };
    setTimeout(() => document.addEventListener("click", closer, true), 0);
  }

  function flashMenu(menu, msg) {
    const note = document.createElement("div");
    note.className = "share-menu-flash";
    note.textContent = msg;
    menu.appendChild(note);
    setTimeout(() => menu.remove(), 1400);
  }

  function createShareButton(mediaUrl, label) {
    const btn = document.createElement("button");
    btn.className = "btn alt share-btn";
    btn.type = "button";
    btn.textContent = "Share";
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      openShareMenu(btn, { mediaUrl, label });
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

    if (opts?.autoplay) {
      video.autoplay = true;
      video.muted = true;
      video.loop = !!opts.loop;
    }

    frame.appendChild(video);
    actions.appendChild(createDownloadButton(url, downloadName, `Download ${label}`));
    actions.appendChild(createShareButton(url, label));
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
    actions.appendChild(createShareButton(url, label));
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
    actions.appendChild(createShareButton(url, `Photo ${i}`));

    card.appendChild(head);
    card.appendChild(wrap);
    card.appendChild(actions);
    grid.appendChild(card);
  }

  function fullUrl(core, relPath) {
    if (!relPath) return "";
    if (/^https?:\/\//i.test(relPath)) return relPath;
    const base = core.API_BASE || core.BASE || "";
    return `${base}${relPath}`;
  }

  function firstByRegex(paths, regex) {
    return paths.find((p) => regex.test(p)) || "";
  }

  function preferMatch(paths, primary, secondary) {
    return firstByRegex(paths, primary) || firstByRegex(paths, secondary || /$a/);
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
      console.log("[bonus] getBonus data", data);
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
    console.log("[bonus] uniqueFiles", uniqueFiles);

    const stripPath = preferMatch(
      uniqueFiles,
      /strip_web\.(png|jpg|jpeg)$/i,
      /strip\.(png|jpg|jpeg)$/i
    );

    const collagePath = preferMatch(
      uniqueFiles,
      /collage\.(mp4|webm|mov)$/i,
      /\/bonus\/.*\.(mp4|webm|mov)$/i
    );

    const boomerangPath = preferMatch(
      uniqueFiles,
      /boomerang\.(mp4|webm|mov)$/i,
      /boomerang.*\.(mp4|webm|mov)$/i
    );

    // Prefer gif.mp4 for reliable browser playback; large animated GIFs often fail to decode.
    const gifPath = preferMatch(
      uniqueFiles,
      /(?:^|\/)gif\.(mp4|webm)$/i,
      /(?:^|\/)gif\.gif$/i
    );

    // Raw session video intentionally not shown/downloadable (branded collage only).
    const freezePaths = uniqueFiles
      .filter((p) => /freeze_[1-4]\.(jpg|jpeg|png)$/i.test(p))
      .sort();

    const stripUrl = fullUrl(core, stripPath);
    const collageUrl = fullUrl(core, collagePath);
    const boomerangUrl = fullUrl(core, boomerangPath);
    const gifUrl = fullUrl(core, gifPath);

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

    const stillsGrid = $("stills-grid");
    if (stillsGrid) {
      stillsGrid.innerHTML = "";
      freezePaths.forEach((relPath, idx) => {
        renderStillCard(stillsGrid, fullUrl(core, relPath), idx + 1);
      });
    }

    const loadedAnything =
      !!stripUrl || !!collageUrl || !!boomerangUrl || !!gifUrl || freezePaths.length > 0;

    setStatus(
      loadedAnything
        ? `Session ${code} loaded.`
        : `Session ${code} found, but no published bonus files were returned.`
    );
  }

  document.addEventListener("DOMContentLoaded", init);
})();
