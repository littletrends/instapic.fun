(() => {
  const STORAGE_KEY = "pennyFeverGameFiles";
  const DB_NAME = "pennyFeverGameMedia";
  const form = document.getElementById("redeem-form");
  const input = document.getElementById("game-code");
  const status = document.getElementById("status");
  const results = document.getElementById("bonus-results");
  const template = document.getElementById("session-template");
  const codePattern = /^PF-[A-HJ-NP-Z]{6}$/;
  let renderCleanups = [];
  const variants = [
    { id: "collage", label: "Collage movie", w: 720, h: 1440, frame: [186, 418, 349, 480], seconds: 28 },
    { id: "gif", label: "GIF-style animation", w: 752, h: 1392, frame: [111, 102, 560, 1135], seconds: 5.5 },
    { id: "boomerang", label: "Boomerang", w: 752, h: 1376, frame: [111, 100, 560, 1240], seconds: 8 },
  ];
  const photoFrames = [
    [67, 68, 207, 326], [443, 68, 207, 326], [67, 922, 207, 326], [443, 922, 207, 326],
  ];

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

  function drawCover(ctx, image, x, y, w, h) {
    const sw = image.videoWidth || image.naturalWidth;
    const sh = image.videoHeight || image.naturalHeight;
    if (!sw || !sh) return;
    const scale = Math.max(w / sw, h / sh);
    const cropW = w / scale;
    const cropH = h / scale;
    ctx.drawImage(image, (sw - cropW) / 2, (sh - cropH) / 2, cropW, cropH, x, y, w, h);
  }

  function drawBonus(ctx, variant, background, photos, video) {
    ctx.clearRect(0, 0, variant.w, variant.h);
    ctx.drawImage(background, 0, 0, variant.w, variant.h);
    if (video.readyState >= 2) drawCover(ctx, video, ...variant.frame);
    if (variant.id === "collage") {
      photos.forEach((photo, index) => {
        if (photo) drawCover(ctx, photo, ...photoFrames[index]);
      });
    }
  }

  function addDownload(canvas, label, filename, seconds) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Save " + label + " video";
    button.addEventListener("click", () => recordCanvas(canvas, seconds, filename, button));
    return button;
  }

  function addImageDownload(canvas, label, filename) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Save " + label + " image";
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

  function recordCanvas(canvas, seconds, filename, button) {
    if (!canvas.captureStream || !window.MediaRecorder) {
      status.textContent = "This browser can preview the bonus but cannot export a composed video.";
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
      recorder.onerror = () => { button.disabled = false; button.textContent = "Save video"; };
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
        button.textContent = "Save video again";
      };
      recorder.start(500);
      setTimeout(() => { if (recorder.state !== "inactive") recorder.stop(); }, seconds * 1000);
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      button.disabled = false;
      button.textContent = "Save video";
      status.textContent = "Video export could not start in this browser.";
    }
  }

  async function renderProducts(container, session, code, number) {
    const media = await getMedia(session.mediaId);
    const bgId = /^bg_\d+$/.test(String(media?.bgId || session.bgId || "")) ? (media?.bgId || session.bgId) : "bg_1";
    const productGrid = document.createElement("div");
    productGrid.className = "product-grid";
    container.append(productGrid);
    if (!media?.video) {
      const note = document.createElement("p");
      note.className = "muted";
      note.textContent = "This session has its matching bonus designs and strip, but no session video was saved.";
      productGrid.append(note);
      return;
    }

    const videoUrl = URL.createObjectURL(media.video);
    const stills = await Promise.all((media.photos || []).slice(0, 4).map((src) => loadImage(src).catch(() => null)));
    const videoNodes = await Promise.all(variants.map(() => loadVideo(videoUrl)));
    const durations = [Math.max(0.1, videoNodes[0].duration || 28), Math.max(0.1, videoNodes[1].duration || 28), Math.max(0.1, videoNodes[2].duration || 28)];
    const start = performance.now();
    const cards = [];

    for (let index = 0; index < variants.length; index += 1) {
      const variant = variants[index];
      const background = await loadImage(`backgrounds/bonuses/${bgId}_${variant.id}.jpg`);
      const article = document.createElement("article");
      article.className = "asset";
      const heading = document.createElement("h3");
      heading.textContent = variant.label;
      const mark = document.createElement("p");
      mark.className = "watermark";
      mark.textContent = `PENNY FEVER GAME · ${bgId.toUpperCase()}`;
      const canvas = document.createElement("canvas");
      canvas.width = variant.w;
      canvas.height = variant.h;
      canvas.setAttribute("aria-label", `${variant.label} using ${bgId} template`);
      const filename = `penny-fever-${code}-session-${number}-${variant.id}`;
      const imageDownload = addImageDownload(canvas, variant.label, filename);
      const download = addDownload(canvas, variant.label, `penny-fever-${code}-session-${number}-${variant.id}`, variant.seconds);
      article.append(heading, mark, canvas, imageDownload, download);
      productGrid.append(article);
      cards.push({ variant, background, video: videoNodes[index], canvas, ctx: canvas.getContext("2d") });
    }

    let frameId = 0;
    const tick = (now) => {
      cards.forEach(({ variant, background, video, canvas, ctx }, index) => {
        if (index === 1) {
          const duration = durations[index];
          const local = ((now - start) / 1000) % variant.seconds;
          const burst = Math.min(3, Math.floor(local / (variant.seconds / 4)));
          const inBurst = local % (variant.seconds / 4);
          const target = Math.min(duration - 0.08, (duration / 4) * burst + inBurst * 0.5);
          if (Math.abs(video.currentTime - target) > 0.3 && video.readyState >= 2) video.currentTime = target;
        } else if (index === 2) {
          const duration = Math.min(4, durations[index]);
          const phase = ((now - start) / 1000) % variant.seconds;
          const t = phase <= duration ? phase : Math.max(0, duration - (phase - duration));
          if (Math.abs(video.currentTime - t) > 0.25 && video.readyState >= 2) video.currentTime = t;
        } else if (video.paused) {
          video.play().catch(() => {});
        }
        drawBonus(ctx, variant, background, stills, video);
      });
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    renderCleanups.push(() => {
      cancelAnimationFrame(frameId);
      videoNodes.forEach((video) => { video.pause(); video.removeAttribute("src"); video.load(); });
      URL.revokeObjectURL(videoUrl);
    });

    const sourceDownload = document.createElement("a");
    sourceDownload.href = videoUrl;
    sourceDownload.download = `penny-fever-${code}-session-${number}-camera.${media.videoExt || "webm"}`;
    sourceDownload.textContent = "Download original session video";
    sourceDownload.className = "source-download";
    productGrid.append(sourceDownload);
  }

  async function showCode(raw) {
    const value = String(raw || "").trim().toUpperCase();
    const code = codePattern.test(value) ? value : "";
    renderCleanups.forEach((cleanup) => cleanup());
    renderCleanups = [];
    results.replaceChildren();
    if (!code) {
      status.textContent = "Enter PF- followed by six letters. The letters I and O are not used.";
      return;
    }
    const file = readFiles().find((item) => item.code === code);
    if (!file) {
      status.textContent = "That game code was not found in this browser. Real Instapic codes are not checked here.";
      return;
    }
    const sessions = (Array.isArray(file.sessions) ? file.sessions : []).filter((session) =>
      typeof session?.strip === "string" && session.strip.startsWith("data:image/")
    );
    if (!sessions.length) {
      status.textContent = "This game code has no saved photo sessions.";
      return;
    }
    status.textContent = `${sessions.length} game ${sessions.length === 1 ? "session" : "sessions"} opened.`;
    for (const [index, session] of sessions.slice().reverse().entries()) {
      const number = sessions.length - index;
      const node = template.content.cloneNode(true);
      node.querySelector(".session-label").textContent = `GAME SESSION ${number}`;
      node.querySelector(".session-code").textContent = code;
      const saved = session.savedAt ? new Date(session.savedAt) : null;
      node.querySelector(".saved-date").textContent = saved && !Number.isNaN(saved.valueOf()) ? `Saved ${saved.toLocaleString()}` : "Saved Penny Fever game session";
      node.querySelector(".strip").src = session.strip;
      node.querySelector(".strip-download").href = session.strip;
      node.querySelector(".strip-download").download = `penny-fever-${code}-strip-${number}.jpg`;
      const products = node.querySelector(".products");
      results.append(node);
      try {
        await renderProducts(products, session, code, number);
      } catch (error) {
        const note = document.createElement("p");
        note.className = "muted";
        note.textContent = "The matching game bonus previews could not be loaded on this browser.";
        products.append(note);
      }
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
