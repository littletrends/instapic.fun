(() => {
  const STORAGE_KEY = "pennyFeverGameFiles";
  const DB_NAME = "pennyFeverGameMedia";
  const form = document.getElementById("redeem-form");
  const input = document.getElementById("game-code");
  const status = document.getElementById("bonus-status");
  const sessionBlock = document.getElementById("session-block");
  const sessionCodeEl = document.getElementById("session-code");
  const codePattern = /^PF-[A-HJ-NP-Z]{6}$/;
  let renderCleanups = [];

  const variants = [
    { id: "collage", label: "Collage Video", exportLabel: "Download collage (WebM)", w: 720, h: 1440, frame: [186, 418, 349, 480], seconds: 28, frameId: "collage-frame", actionsId: "collage-actions" },
    { id: "gif", label: "GIF", exportLabel: "Download GIF (WebM)", w: 752, h: 1392, frame: [111, 102, 560, 1135], seconds: 5.5, frameId: "gif-frame", actionsId: "gif-actions" },
    { id: "boomerang", label: "Boomerang", exportLabel: "Download boomerang (WebM)", w: 752, h: 1376, frame: [111, 100, 560, 1240], seconds: 8, frameId: "boomerang-frame", actionsId: "boomerang-actions" },
  ];
  const photoFrames = [
    [67, 68, 207, 326], [443, 68, 207, 326], [67, 922, 207, 326], [443, 922, 207, 326],
  ];

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function readFiles() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data.filter((file) => file && codePattern.test(String(file.code || ""))) : [];
    } catch (_) { return []; }
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

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function loadVideo(url) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.loop = true;
      video.onloadeddata = () => resolve(video);
      video.onerror = () => reject(new Error("Could not load session video"));
      video.src = url;
    });
  }

  function bonusSrc(kind) {
    return "backgrounds/carnival/bonus/pf-felix_" + kind + ".jpg?v=carnival-5-bonus-1";
  }

  function drawCover(ctx, image, x, y, w, h) {
    const sw = image.videoWidth || image.naturalWidth;
    const sh = image.videoHeight || image.naturalHeight;
    if (!sw || !sh) return;
    const scale = Math.max(w / sw, h / sh);
    const cropW = w / scale;
    const cropH = h / scale;
    ctx.drawImage(image, (sw - cropW) / 2, (sh - cropH) / 2, cropW, cropH, x, y, w, h);
  }

  function livePhotos(photos) {
    return (photos || []).filter(Boolean);
  }

  function stillFor(photos, elapsed, kind) {
    const live = livePhotos(photos);
    if (!live.length) return null;
    if (kind === "gif") return live[Math.floor(elapsed / 0.35) % live.length];
    if (kind === "boomerang") {
      const seq = live.concat(live.slice(1, -1).reverse());
      return seq[Math.floor(elapsed / 0.4) % seq.length];
    }
    return live[Math.floor(elapsed / 1.2) % live.length];
  }

  function drawBonus(ctx, variant, background, photos, video, elapsed) {
    ctx.clearRect(0, 0, variant.w, variant.h);
    ctx.drawImage(background, 0, 0, variant.w, variant.h);
    const hasVideo = video && video.readyState >= 2 && (video.videoWidth || 0) > 0;
    if (hasVideo) drawCover(ctx, video, ...variant.frame);
    else {
      const still = stillFor(photos, elapsed, variant.id);
      if (still) drawCover(ctx, still, ...variant.frame);
    }
    if (variant.id === "collage") {
      photos.forEach((photo, index) => {
        if (photo) drawCover(ctx, photo, ...photoFrames[index]);
      });
    }
  }

  function recordCanvas(canvas, seconds, filename, button) {
    if (!canvas.captureStream || !window.MediaRecorder) {
      setStatus("This browser can preview the bonus but cannot export a composed video.");
      return;
    }
    let stream;
    try {
      stream = canvas.captureStream(20);
      const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported?.(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      button.disabled = true;
      button.textContent = "Rendering video…";
      recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
      recorder.onerror = () => { button.disabled = false; button.textContent = button.dataset.idleLabel; };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename.replace(/\.[^.]+$/, "") + ".webm";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        button.disabled = false;
        button.textContent = "Download again";
      };
      recorder.start(500);
      setTimeout(() => { if (recorder.state !== "inactive") recorder.stop(); }, seconds * 1000);
    } catch (_) {
      stream?.getTracks().forEach((track) => track.stop());
      button.disabled = false;
      button.textContent = button.dataset.idleLabel;
      setStatus("Video export could not start in this browser.");
    }
  }

  function addVideoDownload(canvas, label, filename, seconds) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn";
    button.textContent = label;
    button.dataset.idleLabel = label;
    button.addEventListener("click", () => recordCanvas(canvas, seconds, filename, button));
    return button;
  }

  function addStillDownload(canvas, filename) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn alt";
    button.textContent = "Download still";
    button.addEventListener("click", () => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename + ".jpg";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }, "image/jpeg", 0.92);
    });
    return button;
  }

  function putMedia(frame, node) {
    frame.replaceChildren(node);
  }

  function clearActions(id) {
    const el = document.getElementById(id);
    if (el) el.replaceChildren();
  }

  async function renderSession(session, code, number) {
    const media = await getMedia(session.mediaId).catch(() => null);
    const photos = await Promise.all((media?.photos || []).slice(0, 4).map((src) => loadImage(src).catch(() => null)));
    const stripFrame = document.getElementById("strip-frame");
    const stripActions = document.getElementById("strip-actions");
    stripFrame.replaceChildren();
    stripActions.replaceChildren();
    if (session.strip) {
      const img = document.createElement("img");
      img.src = session.strip;
      img.alt = "Your Penny Fever photo strip";
      stripFrame.append(img);
      const a = document.createElement("a");
      a.className = "btn";
      a.href = session.strip;
      a.download = `penny-fever-${code}-strip-${number}.jpg`;
      a.textContent = "Download strip";
      stripActions.append(a);
    }

    const stills = document.getElementById("stills-grid");
    stills.replaceChildren();
    photos.forEach((photo, i) => {
      if (!photo) return;
      const card = document.createElement("article");
      card.className = "card freeze-card";
      const wrap = document.createElement("div");
      wrap.className = "media-wrap";
      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = "Freeze " + (i + 1);
      wrap.append(img);
      const actions = document.createElement("div");
      actions.className = "actions";
      const a = document.createElement("a");
      a.className = "btn";
      a.href = photo.src;
      a.download = `penny-fever-${code}-freeze-${i + 1}.jpg`;
      a.textContent = "Download";
      actions.append(a);
      card.append(wrap, actions);
      stills.append(card);
    });

    let video = null;
    let videoUrl = "";
    if (media?.video) {
      videoUrl = URL.createObjectURL(media.video);
      try { video = await loadVideo(videoUrl); } catch (_) { video = null; }
    }

    const start = performance.now();
    const cards = [];
    for (const variant of variants) {
      const background = await loadImage(bonusSrc(variant.id));
      const canvas = document.createElement("canvas");
      canvas.width = variant.w;
      canvas.height = variant.h;
      canvas.setAttribute("aria-label", variant.label);
      putMedia(document.getElementById(variant.frameId), canvas);
      const actions = document.getElementById(variant.actionsId);
      actions.replaceChildren();
      const stem = `penny-fever-${code}-session-${number}-${variant.id}`;
      actions.append(
        addVideoDownload(canvas, variant.exportLabel, stem, variant.seconds),
        addStillDownload(canvas, stem)
      );
      cards.push({ variant, background, canvas, ctx: canvas.getContext("2d") });
    }

    if (videoUrl) {
      const srcBtn = document.createElement("a");
      srcBtn.className = "btn alt";
      srcBtn.href = videoUrl;
      srcBtn.download = `penny-fever-${code}-session-${number}-camera.${media.videoExt || "webm"}`;
      srcBtn.textContent = "Download original session video";
      document.getElementById("collage-actions").append(srcBtn);
    }

    let frameId = 0;
    const duration = Math.max(0.1, video?.duration || 28);
    const tick = (now) => {
      const elapsed = (now - start) / 1000;
      cards.forEach(({ variant, background, canvas, ctx }) => {
        if (video && video.readyState >= 2) {
          if (variant.id === "gif") {
            const local = elapsed % variant.seconds;
            const burst = Math.min(3, Math.floor(local / (variant.seconds / 4)));
            const inBurst = local % (variant.seconds / 4);
            const target = Math.min(duration - 0.08, (duration / 4) * burst + inBurst * 0.5);
            if (Math.abs(video.currentTime - target) > 0.3) video.currentTime = target;
          } else if (variant.id === "boomerang") {
            const forward = Math.min(4, duration);
            const phase = elapsed % variant.seconds;
            const t = phase <= forward ? phase : Math.max(0, forward - (phase - forward));
            if (Math.abs(video.currentTime - t) > 0.25) video.currentTime = t;
          } else if (video.paused) {
            video.play().catch(() => {});
          }
        }
        drawBonus(ctx, variant, background, photos, video, elapsed);
      });
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    renderCleanups.push(() => {
      cancelAnimationFrame(frameId);
      if (video) { video.pause(); video.removeAttribute("src"); video.load(); }
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    });
  }

  async function showCode(raw) {
    const value = String(raw || "").trim().toUpperCase();
    const code = codePattern.test(value) ? value : "";
    renderCleanups.forEach((cleanup) => cleanup());
    renderCleanups = [];
    sessionBlock.hidden = true;
    sessionCodeEl.hidden = true;
    variants.forEach((v) => {
      document.getElementById(v.frameId).innerHTML = '<div class="empty-note">Loading…</div>';
      clearActions(v.actionsId);
    });
    document.getElementById("stills-grid").replaceChildren();
    if (!code) {
      setStatus("Enter PF- followed by six letters. The letters I and O are not used.");
      return;
    }
    const file = readFiles().find((item) => item.code === code);
    if (!file) {
      setStatus("That game code was not found in this browser. Real Instapic codes are not checked here.");
      return;
    }
    const sessions = (Array.isArray(file.sessions) ? file.sessions : []).filter((session) =>
      typeof session?.strip === "string" && session.strip.startsWith("data:image/")
    );
    if (!sessions.length) {
      setStatus("This game code has no saved photo sessions.");
      return;
    }
    const session = sessions[sessions.length - 1];
    const number = sessions.length;
    sessionCodeEl.hidden = false;
    sessionCodeEl.textContent = code;
    sessionBlock.hidden = false;
    setStatus(`${sessions.length} game ${sessions.length === 1 ? "session" : "sessions"} opened. Showing the latest.`);
    try {
      await renderSession(session, code, number);
    } catch (err) {
      console.warn("game bonus", err);
      setStatus("The matching game bonus previews could not be loaded on this browser.");
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
