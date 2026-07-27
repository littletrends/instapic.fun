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

  function guessMime(filename, blobType) {
    if (blobType && blobType !== "application/octet-stream") return blobType;
    const n = (filename || "").toLowerCase();
    if (n.endsWith(".mp4")) return "video/mp4";
    if (n.endsWith(".webm")) return "video/webm";
    if (n.endsWith(".gif")) return "image/gif";
    if (n.endsWith(".png")) return "image/png";
    if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
    return blobType || "application/octet-stream";
  }

  async function fetchMediaFile(fileUrl) {
    const res = await fetch(fileUrl, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const name = (fileUrl.split("/").pop() || "instapic_media").split("?")[0];
    const type = guessMime(name, blob.type);
    return new File([blob], name, { type });
  }

  async function downloadViaBlob(url, filename) {
    // Cross-origin <a download> is ignored by mobile browsers — force blob download.
    const file = await fetchMediaFile(url);
    const objectUrl = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename || file.name || "instapic_download";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
  }

  function createDownloadButton(url, filename, label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = label;
    btn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const old = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        await downloadViaBlob(url, filename);
        btn.textContent = "Saved";
        setTimeout(() => {
          btn.textContent = old;
          btn.disabled = false;
        }, 1200);
      } catch (err) {
        console.error("[bonus] download failed", err);
        // last resort: open media (user can long-press / share from player)
        window.open(url, "_blank", "noopener,noreferrer");
        btn.textContent = old;
        btn.disabled = false;
      }
    });
    return btn;
  }

  async function tryNativeShare({ title, text, url, fileUrl }) {
    if (!navigator.share) return { ok: false, reason: "no_share_api" };
    try {
      if (fileUrl) {
        try {
          const file = await fetchMediaFile(fileUrl);
          const payload = { title, text, files: [file] };
          if (!navigator.canShare || navigator.canShare(payload)) {
            await navigator.share(payload);
            return { ok: true, mode: "file" };
          }
        } catch (fileErr) {
          console.warn("[bonus] file share failed, trying link", fileErr);
        }
      }
      await navigator.share({ title, text, url });
      return { ok: true, mode: "link" };
    } catch (err) {
      if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) {
        return { ok: true, mode: "cancelled" };
      }
      console.error("[bonus] share failed", err);
      return { ok: false, reason: String(err && err.message || err) };
    }
  }

  function closeShareSheet() {
    document.querySelectorAll(".share-sheet, .share-sheet-backdrop").forEach((el) => el.remove());
  }

  function openShareMenu(anchorBtn, { mediaUrl, label }) {
    closeShareSheet();

    const pageUrl = getGuestShareUrl();
    const text = shareCaption(label);
    const encUrl = encodeURIComponent(pageUrl);
    const encText = encodeURIComponent(text);
    const isCollage = /collage/i.test(label);

    const backdrop = document.createElement("div");
    backdrop.className = "share-sheet-backdrop";

    const sheet = document.createElement("div");
    sheet.className = "share-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-label", `Share ${label}`);

    const title = document.createElement("div");
    title.className = "share-sheet-title";
    title.textContent = isCollage
      ? "Share your branded collage"
      : `Share ${label}`;
    sheet.appendChild(title);

    const sub = document.createElement("div");
    sub.className = "share-sheet-sub";
    sub.textContent = isCollage
      ? "Shares the collage video (with Instapic branding) — not the raw session video."
      : "Share via your phone apps, or post a link to your bonus pack.";
    sheet.appendChild(sub);

    const status = document.createElement("div");
    status.className = "share-sheet-status";
    status.hidden = true;
    sheet.appendChild(status);

    function setStatus(msg) {
      status.hidden = !msg;
      status.textContent = msg || "";
    }

    const items = [
      {
        label: isCollage ? "Share collage video…" : "Share file / to apps…",
        hint: "Instagram, Snapchat, Messages, Camera Roll apps",
        primary: true,
        action: async () => {
          setStatus("Preparing…");
          const res = await tryNativeShare({
            title: `Instapic ${label}`,
            text,
            url: pageUrl,
            fileUrl: mediaUrl,
          });
          if (res.ok && res.mode !== "cancelled") {
            closeShareSheet();
            return;
          }
          if (res.ok && res.mode === "cancelled") {
            setStatus("");
            return;
          }
          // Fallback: save file then prompt
          try {
            setStatus("Saving file so you can share from Photos…");
            await downloadViaBlob(mediaUrl, (mediaUrl.split("/").pop() || "instapic").split("?")[0]);
            setStatus("Saved. Open Photos / Files and share from there.");
          } catch (_) {
            setStatus("Could not prepare file. Try Download, then share from Photos.");
          }
        },
      },
      {
        label: "X / Twitter",
        action: () => {
          window.open(
            `https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}`,
            "_blank",
            "noopener,noreferrer"
          );
          closeShareSheet();
        },
      },
      {
        label: "Facebook",
        action: () => {
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encUrl}&quote=${encText}`,
            "_blank",
            "noopener,noreferrer"
          );
          closeShareSheet();
        },
      },
      {
        label: "Copy bonus link",
        action: async () => {
          try {
            await navigator.clipboard.writeText(`${text}\n${pageUrl}`);
            setStatus("Link copied!");
            setTimeout(closeShareSheet, 900);
          } catch (_) {
            setStatus("Could not copy link");
          }
        },
      },
      {
        label: "Cancel",
        action: () => closeShareSheet(),
      },
    ];

    items.forEach((item) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "share-sheet-item" + (item.primary ? " share-sheet-item-primary" : "");
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
      sheet.appendChild(b);
    });

    backdrop.addEventListener("click", (ev) => {
      ev.preventDefault();
      closeShareSheet();
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
  }

  function createShareButton(mediaUrl, label) {
    const btn = document.createElement("button");
    btn.className = "btn alt share-btn";
    btn.type = "button";
    btn.textContent = "Share";
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (typeof ev.stopImmediatePropagation === "function") ev.stopImmediatePropagation();
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

    // Do not contact MotherPC for video data until the guest asks for it.
    // Multiple autoplay players made the bonus page compete for bandwidth and
    // video decoding on phones. The photo strip still loads immediately.
    const loadButton = document.createElement("button");
    loadButton.className = "btn";
    loadButton.type = "button";
    loadButton.textContent = `Tap to load ${label}`;
    loadButton.addEventListener("click", () => {
      const video = document.createElement("video");
      video.src = url;
      video.controls = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.preload = "metadata";
      video.autoplay = true;
      video.muted = true;
      video.loop = !!opts?.loop;

      frame.replaceChildren(video);
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    });

    frame.appendChild(loadButton);
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

    // No download/share on freezes — guests download strip/collage/GIF/boom products only.
    card.appendChild(head);
    card.appendChild(wrap);
    grid.appendChild(card);
  }

  function fullUrl(core, relPath) {
    if (!relPath) return "";
    if (/^https?:\/\//i.test(relPath)) return relPath;
    const base = core.API_BASE || core.BASE || "";
    // Cache-bust so phone/desktop don't keep old sideways GIF/boom after rebuild.
    // Prefer server pack stamp when present; else one stamp per page load.
    const meta = window.__instapicBonusMeta || {};
    const stamp =
      meta.bonus_stamp ||
      meta.updated_at ||
      window.__instapicBonusStamp ||
      (window.__instapicBonusStamp = String(Date.now()));
    const joiner = String(relPath).indexOf("?") >= 0 ? "&" : "?";
    return `${base}${relPath}${joiner}v=${encodeURIComponent(stamp)}`;
  }

  function firstByRegex(paths, regex) {
    return paths.find((p) => regex.test(p)) || "";
  }

  function preferMatch(paths, primary, secondary) {
    return firstByRegex(paths, primary) || firstByRegex(paths, secondary || /$a/);
  }

  const EVENT_HOST_STORAGE_KEY = "instapic_event_portal_v1";

  function loadHostPortalSession() {
    try {
      const raw = sessionStorage.getItem(EVENT_HOST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function isHostLoggedIn(pin) {
    const clean = String(pin || "").replace(/\D/g, "");
    if (!/^\d{3,6}$/.test(clean)) return false;
    const saved = loadHostPortalSession();
    if (!saved || !saved.pin) return false;
    return String(saved.pin).replace(/\D/g, "") === clean;
  }

  function wireEventPortalReturn() {
    // Back to event portal: hosts only, and only while still logged in
    // (sessionStorage set by event.html unlock; cleared on Lock / log out).
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("from") !== "event") return;
      const pin = (params.get("pin") || "").replace(/\D/g, "");
      if (!pin || !isHostLoggedIn(pin)) {
        document.querySelectorAll("#bonus-back-event, .bonus-back-event-foot").forEach((a) => {
          a.hidden = true;
        });
        return;
      }
      const href = `event.html?pin=${encodeURIComponent(pin)}`;
      document.querySelectorAll("#bonus-back-event, .bonus-back-event-foot").forEach((a) => {
        a.hidden = false;
        a.href = href;
      });
      // Expose for host edit-lock tools on bonus_patch.js
      window.__instapicHostContext = {
        fromEvent: true,
        pin,
        loggedIn: true,
      };
    } catch (_) {}
  }

  async function init() {
    const core = window.InstapicCore;
    if (!core) {
      console.error("[bonus] InstapicCore missing");
      setStatus("Bonus page core not loaded.");
      return;
    }

    wireEventPortalReturn();

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
      // Surface lock/event flags for host tools (bonus_patch.js)
      window.__instapicBonusMeta = {
        ticket_code: data.ticket_code || code,
        event_code: data.event_code || "",
        is_event: !!data.is_event,
        guest_edits_locked: !!data.guest_edits_locked,
        bonus_stamp: data.bonus_stamp || String(Date.now()),
      };
      window.__instapicBonusStamp = window.__instapicBonusMeta.bonus_stamp;
      try {
        document.dispatchEvent(new CustomEvent("instapic:bonus-meta", { detail: window.__instapicBonusMeta }));
      } catch (_) {}
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

    // Only match real collage files — never fall back to "any mp4" (was stealing gif/boomerang).
    const collagePath = preferMatch(
      uniqueFiles,
      /collage\.(mp4|webm|mov)$/i,
      /collage[^/]*\.(mp4|webm|mov)$/i
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
