(() => {
  const shots = [];
  let stream = null;
  let collageTimer = null;
  const video = document.getElementById("live-video");
  const canvas = document.getElementById("capture-canvas");
  const stripImg = document.getElementById("strip-preview");
  const collage = document.getElementById("collage-canvas");
  const liveStatus = document.getElementById("live-status");
  const liveCount = document.getElementById("live-count");
  const snapBtn = document.getElementById("snap-btn");

  function show(name) {
    document.querySelectorAll(".screen").forEach((el) => {
      el.classList.toggle("active", el.dataset.screen === name);
    });
    if (name !== "live") stopCamera();
    if (name !== "bonus") stopCollage();
    if (name === "bonus") startCollage();
  }

  function stopCamera() {
    if (!stream) return;
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
    if (video) video.srcObject = null;
  }

  async function startCamera() {
    stopCamera();
    shots.length = 0;
    liveStatus.textContent = "Look at the camera · 2 sample photos";
    liveCount.hidden = true;
    snapBtn.disabled = false;
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play().catch(() => {});
  }

  function grabFrame() {
    const w = video.videoWidth || 720;
    const h = video.videoHeight || 1280;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.86);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function stampSample(ctx, w, h) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.45);
    ctx.font = `700 ${Math.floor(w / 7)}px Arial`;
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.textAlign = "center";
    ctx.fillText("SAMPLE", 0, 0);
    ctx.restore();
    ctx.font = "700 22px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("instapic.fun", 18, h - 18);
  }

  async function buildStrip() {
    const photos = await Promise.all(shots.map(loadImage));
    const w = 420;
    const h = 1180;
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#1a1020";
    ctx.fillRect(0, 0, w, h);
    const slotH = 250;
    const gap = 12;
    const x = 28;
    photos.forEach((img, i) => {
      const y = 24 + i * (slotH + gap);
      ctx.fillStyle = "#000";
      ctx.fillRect(x, y, w - 56, slotH);
      const scale = Math.max((w - 56) / img.width, slotH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, x + ((w - 56) - dw) / 2, y + (slotH - dh) / 2, dw, dh);
    });
    ctx.fillStyle = "#fff";
    ctx.font = "700 20px Arial";
    ctx.fillText("instapic", 28, h - 48);
    ctx.font = "16px Arial";
    ctx.fillText("Moments Made Magical", 28, h - 24);
    stampSample(ctx, w, h);
    stripImg.src = out.toDataURL("image/jpeg", 0.9);
    const frame = document.getElementById("bonus-strip-frame");
    frame.replaceChildren();
    const copy = document.createElement("img");
    copy.alt = "Sample strip";
    copy.src = stripImg.src;
    frame.append(copy);
  }

  function stopCollage() {
    if (collageTimer) {
      clearInterval(collageTimer);
      collageTimer = null;
    }
  }

  async function startCollage() {
    stopCollage();
    if (!shots.length || !collage) return;
    const photos = await Promise.all(shots.map(loadImage));
    const ctx = collage.getContext("2d");
    let i = 0;
    const paint = () => {
      const img = photos[i % photos.length];
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, collage.width, collage.height);
      const scale = Math.max(collage.width / img.width, collage.height / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (collage.width - dw) / 2, (collage.height - dh) / 2, dw, dh);
      stampSample(ctx, collage.width, collage.height);
    };
    paint();
    collageTimer = setInterval(() => {
      i += 1;
      paint();
    }, 5000);
  }

  async function countdownAndSnap() {
    snapBtn.disabled = true;
    liveCount.hidden = false;
    for (const n of [3, 2, 1]) {
      liveCount.textContent = String(n);
      await new Promise((r) => setTimeout(r, 700));
    }
    liveCount.textContent = "★";
    shots.push(grabFrame());
    liveStatus.textContent = shots.length === 1 ? "One more" : "Nice. Building your sample…";
    await new Promise((r) => setTimeout(r, 400));
    liveCount.hidden = true;
    if (shots.length >= 2) {
      stopCamera();
      await buildStrip();
      show("print");
      return;
    }
    snapBtn.disabled = false;
  }

  document.getElementById("kiosk").addEventListener("click", async (event) => {
    const go = event.target.closest("[data-go]")?.dataset.go;
    if (!go) return;
    event.preventDefault();
    if (go === "pay-note") {
      const onBonus = document.querySelector('[data-screen="bonus"]').classList.contains("active");
      const note = document.getElementById(onBonus ? "bonus-pay-note" : "pay-note");
      if (note) note.hidden = false;
      if (!onBonus) show("payment");
      return;
    }
    if (go === "live") {
      show("live");
      try {
        await startCamera();
      } catch (_) {
        liveStatus.textContent = "Camera needs permission for Try mode.";
      }
      return;
    }
    show(go);
  });

  snapBtn.addEventListener("click", () => {
    countdownAndSnap().catch(() => {
      liveStatus.textContent = "Could not take that snap. Try again.";
      snapBtn.disabled = false;
    });
  });

  window.addEventListener("pagehide", stopCamera);

  if (window.parent !== window) {
    const ribbon = document.querySelector(".dev-ribbon");
    if (ribbon) ribbon.textContent = "Felix · Instapic · Try · game only";
    document.querySelector(".top")?.setAttribute("hidden", "");
  }
})();
