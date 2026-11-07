(() => {
  const STORAGE_KEY = "pennyFeverGameFiles";
  const DB_NAME = "pennyFeverGameMedia";
  const API_BASE = "https://motherpc.taild1a44c.ts.net";
  const form = document.getElementById("redeem-form");
  const input = document.getElementById("game-code");
  const status = document.getElementById("bonus-status");
  const sessionBlock = document.getElementById("session-block");
  const sessionCodeEl = document.getElementById("session-code");
  const codePattern = /^PF-[A-HJ-NP-Z]{6}$/;
  let renderCleanups = [];

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function absUrl(path) {
    if (!path) return "";
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    return API_BASE + path;
  }

  function readFiles() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data.filter((file) => file && codePattern.test(String(file.code || ""))) : [];
    } catch (_) {
      return [];
    }
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("sessions")) db.createObjectStore("sessions", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open game media"));
    });
  }

  async function getMedia(id) {
    if (!id) return null;
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("sessions", "readonly");
      const request = tx.objectStore("sessions").get(id);
      request.onsuccess = () => { db.close(); resolve(request.result || null); };
      request.onerror = () => { db.close(); reject(request.error || new Error("Could not load game media")); };
    });
  }

  async function fetchUsb(code) {
    try {
      const res = await fetch(API_BASE + "/api/penny-fever/felix-session/" + encodeURIComponent(code), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data && data.ok ? data : null;
    } catch (_) {
      return null;
    }
  }

  function usbToMedia(data) {
    return {
      photos: (data.photos || []).map(absUrl),
      collage: absUrl(data.collage),
      gifFrames: (data.gif_frames || []).map(absUrl),
      boomFrames: (data.boom_frames || []).map(absUrl),
      videoUrl: absUrl(data.video),
      strip: absUrl(data.strip),
    };
  }

  function actionBtn(label, extraClass) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = extraClass ? "btn " + extraClass : "btn";
    btn.textContent = label;
    return btn;
  }

  function downloadUrl(href, name, label, extraClass) {
    const btn = actionBtn(label, extraClass);
    btn.addEventListener("click", async () => {
      const old = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        const res = await fetch(href);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
        btn.textContent = "Saved";
        setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 1200);
      } catch (_) {
        window.open(href, "_blank", "noopener,noreferrer");
        btn.textContent = old;
        btn.disabled = false;
      }
    });
    return btn;
  }

  function shareBtn(label, href) {
    const btn = actionBtn("Share " + label, "alt");
    btn.addEventListener("click", async () => {
      const payload = {
        title: "My Penny Fever " + label,
        text: "My Instapic Penny Fever SNAP ✨ Moments Made Magical — instapic.fun",
        url: location.href,
      };
      try {
        if (navigator.share) {
          await navigator.share(payload);
          return;
        }
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
      try {
        await navigator.clipboard.writeText(payload.url);
        btn.textContent = "Link copied";
        setTimeout(() => { btn.textContent = "Share " + label; }, 1200);
      } catch (_) {
        window.open(href || payload.url, "_blank", "noopener,noreferrer");
      }
    });
    return btn;
  }

  function put(id, node) {
    const el = document.getElementById(id);
    el.replaceChildren(node);
  }

  function playFlip(img, frames, pingpong, ms) {
    const live = (frames || []).filter(Boolean);
    if (!live.length) return () => {};
    if (live.length === 1) {
      img.src = live[0];
      return () => {};
    }
    const seq = pingpong ? live.concat(live.slice(1, -1).reverse()) : live;
    let i = 0;
    img.src = seq[0];
    const timer = setInterval(() => {
      i = (i + 1) % seq.length;
      img.src = seq[i];
    }, ms);
    return () => clearInterval(timer);
  }

  async function ensureBaked(media) {
    media = media || {};
    const hasGif = (media.gifFrames || []).filter(Boolean).length;
    const hasBoom = (media.boomFrames || []).filter(Boolean).length;
    const hasCollage = !!media.collage;
    if (hasGif && hasBoom && hasCollage) return media;
    const photos = media.photos || [];
    if (!photos.length || !window.PfBonus) return media;
    try {
      const baked = await PfBonus.bake(photos);
      return Object.assign({}, media, {
        collage: media.collage || baked.collage,
        gifFrames: hasGif ? media.gifFrames : (baked.gifFrames || []),
        boomFrames: hasBoom ? media.boomFrames : (baked.boomFrames || []),
      });
    } catch (err) {
      console.warn("bonus bake", err);
      return media;
    }
  }

  const blobCache = Object.create(null);
  async function fetchBlobUrl(src) {
    if (!src) return "";
    if (/^(blob:|data:)/i.test(src)) return src;
    if (blobCache[src]) return blobCache[src];
    try {
      const res = await fetch(src, { mode: "cors", credentials: "omit" });
      if (!res.ok) throw new Error("fetch " + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      blobCache[src] = url;
      renderCleanups.push(() => {
        URL.revokeObjectURL(url);
        delete blobCache[src];
      });
      return url;
    } catch (_) {
      return src;
    }
  }

  function bindVideo(video, src) {
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.loop = true;
    video.preload = "auto";
    video.autoplay = true;
    video.src = src;
  }

  function loadVideoEl(src) {
    if (!src) return Promise.resolve(null);
    return fetchBlobUrl(src).then((url) => new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const video = document.createElement("video");
      bindVideo(video, url);
      const ready = () => {
        if (video.videoWidth && video.readyState >= 2) finish(video);
      };
      video.addEventListener("loadeddata", ready);
      video.addEventListener("playing", ready);
      video.addEventListener("error", () => finish(null), { once: true });
      setTimeout(() => finish(video.videoWidth ? video : null), 8000);
    }));
  }

  async function playCollageVideo(frame, photos, videoSrc, collageSrc) {
    if (!window.PfBonus) return false;
    const layout = await PfBonus.loadLayout();
    const [W, H] = layout.size || [1080, 1920];
    const boxes = layout.collage?.photos || [];
    const blobUrl = videoSrc ? await fetchBlobUrl(videoSrc) : "";
    if (blobUrl && boxes.length) {
      const stage = document.createElement("div");
      stage.className = "collage-live";
      stage.setAttribute("aria-label", "SNAP collage video");
      const bg = document.createElement("img");
      bg.className = "collage-live-bg";
      bg.alt = "SNAP collage";
      bg.src = collageSrc || PfBonus.SRC.collage;
      stage.appendChild(bg);
      const videos = [];
      boxes.forEach((box) => {
        const hole = document.createElement("div");
        hole.className = "collage-live-hole";
        hole.style.left = (box[0] / W) * 100 + "%";
        hole.style.top = (box[1] / H) * 100 + "%";
        hole.style.width = (box[2] / W) * 100 + "%";
        hole.style.height = (box[3] / H) * 100 + "%";
        const video = document.createElement("video");
        bindVideo(video, blobUrl);
        hole.appendChild(video);
        stage.appendChild(hole);
        videos.push(video);
      });
      frame.replaceChildren(stage);
      const kick = () => {
        const lead = videos[0];
        videos.forEach((video) => {
          try {
            if (lead && video !== lead && Number.isFinite(lead.currentTime)) {
              video.currentTime = lead.currentTime;
            }
          } catch (_) {}
          const play = video.play();
          if (play && play.catch) play.catch(() => {});
        });
      };
      kick();
      stage.addEventListener("click", kick);
      renderCleanups.push(() => {
        videos.forEach((video) => {
          try { video.pause(); video.removeAttribute("src"); video.load(); } catch (_) {}
        });
      });
      return true;
    }
    if (collageSrc) {
      const img = document.createElement("img");
      img.src = collageSrc;
      img.alt = "SNAP collage";
      frame.replaceChildren(img);
      return true;
    }
    if (!boxes.length) return false;
    const background = await PfBonus.loadImage(PfBonus.SRC.collage);
    const photoImgs = await Promise.all(
      (photos || []).slice(0, 4).map((src) => (src ? PfBonus.loadImage(src).catch(() => null) : Promise.resolve(null)))
    );
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    PfBonus.drawCollageFrame(canvas.getContext("2d"), background, layout, photoImgs, null);
    frame.replaceChildren(canvas);
    return photoImgs.some(Boolean);
  }

  function grabVideoFrame(video, time) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (value) => {
        if (done) return;
        done = true;
        resolve(value);
      };
      const shoot = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 720;
        canvas.height = 900;
        const ctx = canvas.getContext("2d");
        if (window.PfBonus) window.PfBonus.drawCover(ctx, video, 0, 0, canvas.width, canvas.height);
        else ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL("image/jpeg", 0.86));
      };
      const onSeek = () => {
        video.removeEventListener("seeked", onSeek);
        shoot();
      };
      video.addEventListener("seeked", onSeek);
      setTimeout(() => {
        video.removeEventListener("seeked", onSeek);
        shoot();
      }, 700);
      try {
        video.pause();
        video.currentTime = Math.max(0, Math.min(time, (video.duration || time) - 0.05));
      } catch (_) {
        video.removeEventListener("seeked", onSeek);
        finish("");
      }
    });
  }

  function renderFreezeCard(grid, src, index, video, stem) {
    const card = document.createElement("section");
    card.className = "card";
    card.innerHTML = '<div class="card-head"><h3>Photo ' + (index + 1) + '</h3><p>Your captured freeze frame.</p></div>';
    const wrap = document.createElement("div");
    wrap.className = "media-wrap";
    const frame = document.createElement("div");
    frame.className = "media-frame";
    const img = document.createElement("img");
    img.src = src;
    img.alt = "SNAP " + (index + 1);
    frame.appendChild(img);
    wrap.appendChild(frame);
    card.appendChild(wrap);

    let offset = 0;
    const row = document.createElement("div");
    row.className = "freeze-adjust-row";
    const back = actionBtn("◀", "alt");
    const readout = document.createElement("div");
    readout.className = "freeze-adjust-readout";
    readout.textContent = "+0.0s";
    const fwd = actionBtn("▶", "alt");
    const applyOffset = async (delta) => {
      if (!video || !Number.isFinite(video.duration)) return;
      offset = Math.max(-2.5, Math.min(2.5, offset + delta));
      readout.textContent = (offset >= 0 ? "+" : "") + offset.toFixed(1) + "s";
      const base = ((index + 0.55) / 4) * video.duration;
      const next = await grabVideoFrame(video, base + offset);
      if (next) img.src = next;
    };
    back.addEventListener("click", () => applyOffset(-0.2));
    fwd.addEventListener("click", () => applyOffset(0.2));
    if (video) {
      row.append(back, readout, fwd);
      card.appendChild(row);
    }
    grid.appendChild(card);
  }

  async function renderSession(session, code, number, mediaIn) {
    const media = await ensureBaked(mediaIn || await getMedia(session.mediaId).catch(() => null));
    const stem = "penny-fever-" + code + "-session-" + number + "-";
    const stripSrc = media?.strip || session.strip || "";
    const stripFrame = document.getElementById("strip-frame");
    const stripActions = document.getElementById("strip-actions");
    stripActions.replaceChildren();
    if (stripSrc) {
      const img = document.createElement("img");
      img.src = stripSrc;
      img.alt = "Penny Fever photo strip";
      stripFrame.replaceChildren(img);
      stripActions.append(downloadUrl(stripSrc, stem + "strip.jpg", "Download strip"), shareBtn("strip", stripSrc));
    } else {
      stripFrame.innerHTML = '<div class="empty-note">No strip saved.</div>';
    }

    const collageSrc = media?.collage || "";
    const collageFrame = document.getElementById("collage-frame");
    const collageActions = document.getElementById("collage-actions");
    collageActions.replaceChildren();
    const videoHref = media?.videoUrl || (media?.video ? URL.createObjectURL(media.video) : "");
    if (media?.video && !media?.videoUrl) renderCleanups.push(() => URL.revokeObjectURL(videoHref));
    const played = await playCollageVideo(collageFrame, media?.photos || [], videoHref, collageSrc).catch(() => false);
    if (!played) {
      collageFrame.innerHTML = '<div class="empty-note">Collage could not be built.</div>';
    }
    if (collageSrc) collageActions.append(downloadUrl(collageSrc, stem + "collage.jpg", "Download collage"), shareBtn("collage", collageSrc));
    if (videoHref) collageActions.append(downloadUrl(videoHref, stem + "session.mp4", "Download session video", "alt"));

    const gifImg = document.createElement("img");
    gifImg.alt = "SNAP GIF";
    put("gif-frame", gifImg);
    const gifActions = document.getElementById("gif-actions");
    gifActions.replaceChildren();
    const gifFrames = (media?.gifFrames || []).filter(Boolean);
    if (gifFrames.length) {
      renderCleanups.push(playFlip(gifImg, gifFrames, false, 380));
      gifActions.append(downloadUrl(gifFrames[0], stem + "gif-still.jpg", "Download GIF"), shareBtn("GIF", gifFrames[0]));
    } else {
      gifImg.replaceWith(Object.assign(document.createElement("div"), { className: "empty-note", textContent: "GIF could not be built." }));
    }

    const boomImg = document.createElement("img");
    boomImg.alt = "SNAP boomerang";
    put("boomerang-frame", boomImg);
    const boomActions = document.getElementById("boomerang-actions");
    boomActions.replaceChildren();
    const boomFrames = (media?.boomFrames || []).filter(Boolean);
    if (boomFrames.length) {
      renderCleanups.push(playFlip(boomImg, boomFrames, true, 280));
      boomActions.append(downloadUrl(boomFrames[0], stem + "boomerang-still.jpg", "Download boomerang"), shareBtn("boomerang", boomFrames[0]));
    } else {
      boomImg.replaceWith(Object.assign(document.createElement("div"), { className: "empty-note", textContent: "Boomerang could not be built." }));
    }

    const stills = document.getElementById("stills-grid");
    stills.replaceChildren();
    const freezeVideo = videoHref ? await loadVideoEl(videoHref) : null;
    if (freezeVideo) renderCleanups.push(() => { try { freezeVideo.pause(); } catch (_) {} });
    (media?.photos || []).forEach((src, i) => {
      if (!src) return;
      renderFreezeCard(stills, src, i, freezeVideo, stem);
    });
  }

  async function showCode(raw) {
    const value = String(raw || "").trim().toUpperCase();
    const code = codePattern.test(value) ? value : "";
    renderCleanups.forEach((fn) => fn());
    renderCleanups = [];
    sessionBlock.hidden = true;
    sessionCodeEl.hidden = true;
    if (!code) {
      setStatus("Enter PF- followed by six letters. I and O are not used.");
      return;
    }
    const usb = await fetchUsb(code);
    if (usb && (usb.collage || usb.strip || (usb.photos || []).length)) {
      sessionCodeEl.hidden = false;
      sessionCodeEl.textContent = code;
      sessionBlock.hidden = false;
      setStatus("Loaded from Felix photo booth.");
      try {
        await renderSession({ strip: absUrl(usb.strip), mediaId: "" }, code, 1, usbToMedia(usb));
      } catch (err) {
        console.warn("game bonus", err);
        setStatus("The SNAP keepsake could not be opened.");
      }
      return;
    }
    const file = readFiles().find((item) => item.code === code);
    if (!file) {
      setStatus("That PF code is not on Felix photo booth yet. Run the SNAP session, then open bonuses with the same code.");
      return;
    }
    const sessions = (Array.isArray(file.sessions) ? file.sessions : []).filter((session) => session && (session.usb || session.mediaId || (typeof session.strip === "string" && session.strip.startsWith("data:image/"))));
    if (!sessions.length) {
      setStatus("This game code has no saved photo sessions yet.");
      return;
    }
    const session = sessions[sessions.length - 1];
    sessionCodeEl.hidden = false;
    sessionCodeEl.textContent = code;
    sessionBlock.hidden = false;
    setStatus(sessions.length + " SNAP " + (sessions.length === 1 ? "session" : "sessions") + " found on this browser. Showing the latest.");
    try {
      await renderSession(session, code, sessions.length);
    } catch (err) {
      console.warn("game bonus", err);
      setStatus("The SNAP keepsake could not be opened on this browser.");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showCode(input.value);
  });
  const queryCode = new URLSearchParams(location.search).get("code") || "";
  if (queryCode) {
    input.value = queryCode;
    showCode(queryCode);
  }
})();
