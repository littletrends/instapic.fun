(() => {
  const Screen = {
    ATTRACT: "ATTRACT",
    AWAKE: "AWAKE",
    PAYMENT: "PAYMENT",
    TRY_INFO: "TRY_INFO",
    BACKGROUNDS: "BACKGROUNDS",
    LIVE: "LIVE",
    PRINT: "PRINT",
    BONUS: "BONUS",
  };

  const liveVideo = document.getElementById("liveVideo");
  const captureCanvas = document.getElementById("captureCanvas");
  const videoLayer = document.getElementById("video-layer");
  const liveOverlayTop = document.getElementById("liveOverlayTop");
  const lookUpOverlay = document.getElementById("lookUpOverlay");
  const countdownOverlay = document.getElementById("countdownOverlay");
  const countdownNumber = document.getElementById("countdownNumber");
  const finalStripPreview = document.getElementById("finalStripPreview");
  const bonusStrip = document.getElementById("bonusStrip");
  const collageCanvas = document.getElementById("collageCanvas");

  const screens = [...document.querySelectorAll(".screen")];
  const backgrounds = [];
  let currentScreen = Screen.ATTRACT;
  let currentBackground = null;
  let capturedPhotos = [null, null];
  let currentPoseIndex = 0;
  let videoStream = null;
  let isCaptureInProgress = false;
  let liveAutoSnapTimer = null;
  let cueStepTimeout = null;
  let collageTimer = null;

  const SLOTS = [
    [100 / 784, 18 / 1186, 208 / 784, 252 / 1186],
    [100 / 784, 272 / 1186, 208 / 784, 256 / 1186],
  ];

  function showScreen(name) {
    currentScreen = name;
    screens.forEach((section) => {
      section.classList.toggle("active", section.dataset.screen === name);
    });
    if (name === Screen.LIVE) {
      startCamera().then(() => {
        if (!isCaptureInProgress) startLiveAutoSnapTimer();
      });
    } else {
      stopCamera();
      stopLiveAutoSnapTimer();
      clearCaptureSequenceTimers();
      hideLiveCaptureCues();
    }
    if (name === Screen.BONUS) startCollage();
    else stopCollage();
  }

  document.querySelectorAll(".background-card").forEach((card) => {
    const bg = {
      id: card.dataset.backgroundId,
      poses: 2,
      src: card.querySelector("img").src,
      element: card,
    };
    backgrounds.push(bg);
    const pick = () => {
      currentBackground = bg;
      document.querySelectorAll(".background-card").forEach((el) => {
        el.classList.toggle("selected", el === card);
      });
    };
    card.addEventListener("click", pick);
    if (card.classList.contains("selected")) currentBackground = bg;
  });

  async function startCamera() {
    if (videoStream) {
      videoLayer.classList.remove("hidden");
      return;
    }
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 1280 },
          aspectRatio: { ideal: 0.75 },
        },
        audio: false,
      });
      liveVideo.srcObject = videoStream;
      await liveVideo.play().catch(() => {});
      videoLayer.classList.remove("hidden");
    } catch (_) {
      window.alert("Camera needs permission for Try mode.");
    }
  }

  function stopCamera() {
    if (!videoStream) return;
    videoStream.getTracks().forEach((t) => t.stop());
    videoStream = null;
    liveVideo.srcObject = null;
    videoLayer.classList.add("hidden");
  }

  function hideLiveCaptureCues() {
    liveOverlayTop.classList.add("hidden");
    lookUpOverlay.classList.add("hidden");
    countdownOverlay.classList.add("hidden");
    countdownOverlay.classList.remove("is-ready");
    document.querySelectorAll(".live-snap-flash").forEach((el) => el.remove());
  }

  function showCenterCue(text, asReady) {
    liveOverlayTop.classList.add("hidden");
    lookUpOverlay.classList.add("hidden");
    countdownNumber.textContent = text;
    countdownOverlay.classList.toggle("is-ready", !!asReady);
    countdownOverlay.classList.remove("hidden");
  }

  function fireSnapFlash() {
    const flash = document.createElement("div");
    flash.className = "live-snap-flash";
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 320);
  }

  function clearCaptureSequenceTimers() {
    if (cueStepTimeout) {
      clearTimeout(cueStepTimeout);
      cueStepTimeout = null;
    }
  }

  function startLiveAutoSnapTimer() {
    stopLiveAutoSnapTimer();
    liveAutoSnapTimer = setTimeout(() => {
      liveAutoSnapTimer = null;
      if (currentScreen === Screen.LIVE && !isCaptureInProgress) {
        startCountdownAndCapture();
      }
    }, 400);
  }

  function stopLiveAutoSnapTimer() {
    if (liveAutoSnapTimer) {
      clearTimeout(liveAutoSnapTimer);
      liveAutoSnapTimer = null;
    }
  }

  function startCountdownAndCapture() {
    if (isCaptureInProgress) return;
    isCaptureInProgress = true;
    stopLiveAutoSnapTimer();
    clearCaptureSequenceTimers();
    const isFirstPose = capturedPhotos.filter(Boolean).length === 0;
    const steps = [];
    if (isFirstPose) steps.push({ kind: "settle", ms: 1800 });
    steps.push({ kind: "ready", ms: 1600 });
    steps.push({ kind: "lookup", ms: 3000 });
    steps.push({ kind: "count", value: 3, ms: 900 });
    steps.push({ kind: "count", value: 2, ms: 900 });
    steps.push({ kind: "count", value: 1, ms: 900 });
    steps.push({ kind: "snap" });
    let i = 0;
    const runNext = () => {
      if (currentScreen !== Screen.LIVE) {
        clearCaptureSequenceTimers();
        hideLiveCaptureCues();
        isCaptureInProgress = false;
        return;
      }
      const step = steps[i++];
      if (!step) return;
      if (step.kind === "settle") {
        liveOverlayTop.classList.remove("hidden");
        lookUpOverlay.classList.add("hidden");
        countdownOverlay.classList.add("hidden");
        cueStepTimeout = setTimeout(runNext, step.ms);
        return;
      }
      if (step.kind === "lookup") {
        liveOverlayTop.classList.add("hidden");
        countdownOverlay.classList.add("hidden");
        lookUpOverlay.classList.remove("hidden");
        cueStepTimeout = setTimeout(runNext, step.ms);
        return;
      }
      if (step.kind === "ready") {
        showCenterCue("ARE YOU READY?", true);
        cueStepTimeout = setTimeout(runNext, step.ms);
        return;
      }
      if (step.kind === "count") {
        showCenterCue(String(step.value), false);
        cueStepTimeout = setTimeout(runNext, step.ms);
        return;
      }
      showCenterCue("SNAP!", false);
      fireSnapFlash();
      cueStepTimeout = setTimeout(() => {
        countdownOverlay.classList.add("hidden");
        capturePhoto();
      }, 80);
    };
    runNext();
  }

  function capturePhoto() {
    const w = liveVideo.videoWidth || 720;
    const h = liveVideo.videoHeight || 1280;
    const ctx = captureCanvas.getContext("2d");
    const portrait = h >= w;
    if (portrait) {
      captureCanvas.width = w;
      captureCanvas.height = h;
      ctx.drawImage(liveVideo, 0, 0, w, h);
    } else {
      captureCanvas.width = h;
      captureCanvas.height = w;
      ctx.save();
      ctx.translate(h / 2, w / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(liveVideo, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    capturedPhotos[currentPoseIndex] = captureCanvas.toDataURL("image/jpeg", 0.9);
    isCaptureInProgress = false;
    const filled = capturedPhotos.filter(Boolean).length;
    if (filled >= 2) {
      buildStrip().then(() => showScreen(Screen.PRINT));
      return;
    }
    currentPoseIndex = filled;
    showScreen(Screen.LIVE);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function stampSample(ctx, w, h) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.45);
    ctx.font = `700 ${Math.floor(w / 8)}px Arial`;
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.textAlign = "center";
    ctx.fillText("SAMPLE", 0, 0);
    ctx.restore();
    ctx.font = `700 ${Math.max(18, Math.floor(w / 22))}px Arial`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("instapic.fun", Math.floor(w * 0.04), h - Math.floor(h * 0.03));
  }

  async function buildStrip() {
    const bg = await loadImage(currentBackground?.src || "backgrounds/bg_11.jpg");
    const photos = await Promise.all(
      capturedPhotos.filter(Boolean).map(loadImage)
    );
    const out = document.createElement("canvas");
    out.width = bg.width;
    out.height = bg.height;
    const ctx = out.getContext("2d");
    ctx.drawImage(bg, 0, 0);
    photos.forEach((photo, i) => {
      const [nx, ny, nw, nh] = SLOTS[i] || SLOTS[0];
      const x = nx * bg.width;
      const y = ny * bg.height;
      const tw = nw * bg.width;
      const th = nh * bg.height;
      const scale = Math.max(tw / photo.width, th / photo.height);
      const dw = photo.width * scale;
      const dh = photo.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, tw, th);
      ctx.clip();
      ctx.drawImage(photo, x + (tw - dw) / 2, y + (th - dh) / 2, dw, dh);
      ctx.restore();
    });
    stampSample(ctx, out.width, out.height);
    const url = out.toDataURL("image/jpeg", 0.9);
    finalStripPreview.src = url;
    bonusStrip.src = url;
  }

  function stopCollage() {
    if (collageTimer) {
      clearInterval(collageTimer);
      collageTimer = null;
    }
  }

  async function startCollage() {
    stopCollage();
    const shots = capturedPhotos.filter(Boolean);
    if (!shots.length) return;
    const photos = await Promise.all(shots.map(loadImage));
    const ctx = collageCanvas.getContext("2d");
    let i = 0;
    const paint = () => {
      const img = photos[i % photos.length];
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, collageCanvas.width, collageCanvas.height);
      const scale = Math.max(
        collageCanvas.width / img.width,
        collageCanvas.height / img.height
      );
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(
        img,
        (collageCanvas.width - dw) / 2,
        (collageCanvas.height - dh) / 2,
        dw,
        dh
      );
      stampSample(ctx, collageCanvas.width, collageCanvas.height);
    };
    paint();
    collageTimer = setInterval(() => {
      i += 1;
      paint();
    }, 5000);
  }

  function resetTry() {
    capturedPhotos = [null, null];
    currentPoseIndex = 0;
    isCaptureInProgress = false;
  }

  document.getElementById("ui-layer").addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    event.preventDefault();
    if (action === "wake-mirror") return showScreen(Screen.AWAKE);
    if (action === "enter-mirror") return showScreen(Screen.PAYMENT);
    if (action === "payment-exit") return showScreen(Screen.ATTRACT);
    if (action === "enter-try-info") return showScreen(Screen.TRY_INFO);
    if (action === "try-info-back") return showScreen(Screen.PAYMENT);
    if (action === "enter-try-mode") {
      resetTry();
      if (!currentBackground) currentBackground = backgrounds[0];
      return showScreen(Screen.BACKGROUNDS);
    }
    if (action === "backgrounds-next") {
      if (!currentBackground) currentBackground = backgrounds[0];
      resetTry();
      return showScreen(Screen.LIVE);
    }
    if (action === "see-bonus") return showScreen(Screen.BONUS);
    if (action === "pay-note") {
      const note = document.getElementById(
        currentScreen === Screen.BONUS ? "bonus-pay-note" : "pay-note"
      );
      if (note) note.hidden = false;
      if (currentScreen !== Screen.BONUS) showScreen(Screen.PAYMENT);
    }
  });

  window.addEventListener("pagehide", stopCamera);
})();
