(() => {
  const Screen = {
    ATTRACT: "ATTRACT",
    AWAKE: "AWAKE",
    PAYMENT: "PAYMENT",
    PREPAID: "PREPAID",
    PRIVATE_EVENT: "PRIVATE_EVENT",
    TRY_INFO: "TRY_INFO",
    BACKGROUNDS: "BACKGROUNDS",
    LIVE: "LIVE",
    REVIEW: "REVIEW",
    PRINT: "PRINT",
    DIGITAL: "DIGITAL",
    THANKYOU: "THANKYOU",
    ERROR: "ERROR",
  };

  const TRY_SAMPLE_ID = "bg_11";
  const LIVE_AUTOSTART_MS = 400;
  const MAX_RETAKES_PER_SESSION = 2;
  const SLOTS = [
    [0.325, 0.10, 0.35, 0.18],
    [0.325, 0.32, 0.35, 0.18],
    [0.325, 0.54, 0.35, 0.18],
    [0.325, 0.76, 0.35, 0.18],
  ];

  const screens = [...document.querySelectorAll(".screen")];
  const videoLayer = document.getElementById("video-layer");
  const liveVideo = document.getElementById("liveVideo");
  const captureCanvas = document.getElementById("captureCanvas");
  const countdownOverlay = document.getElementById("countdownOverlay");
  const countdownNumber = document.getElementById("countdownNumber");
  const liveOverlayTop = document.getElementById("liveOverlayTop");
  const lookUpOverlay = document.getElementById("lookUpOverlay");
  const templateBackground = document.getElementById("templateBackground");
  const slotImages = [0, 1, 2, 3].map((i) => document.getElementById("slotImage" + i));
  const selectedPhotoPreview = document.getElementById("selectedPhotoPreview");
  const poseNumberLabel = document.getElementById("poseNumberLabel");
  const poseTotalLabel = document.getElementById("poseTotalLabel");
  const finalStripPreview = document.getElementById("finalStripPreview");
  const digitalStripPreview = document.getElementById("digitalStripPreview");
  const prepaidInput = document.getElementById("prepaidCodeInput");
  const prepaidError = document.getElementById("prepaidError");
  const thankyouCountdownEl = document.getElementById("thankyouCountdown");
  const errorBanner = document.getElementById("errorMessage");
  const sessionCodeDisplay = document.getElementById("sessionCodeDisplay");
  const printPreviewNote = document.querySelector(".instapic-print-preview-note");
  const printBtn = document.querySelector('[data-action="print-now"]');
  const boothStage = document.getElementById("booth-stage");

  let currentScreen = Screen.ATTRACT;
  let isTrySession = false;
  let hasCommitted = false;
  let videoStream = null;
  let cueStepTimeout = null;
  let liveAutoSnapTimer = null;
  let reviewIdleTimer = null;
  let printTimer = null;
  let thankyouTimer = null;
  let digitalIdleTimer = null;
  let isCaptureInProgress = false;
  let backgrounds = [];
  let paidBackgroundIds = [];
  let currentBackground = null;
  let totalPoses = 4;
  let currentPoseIndex = 0;
  let capturedPhotos = [null, null, null, null];
  let totalRetakesUsed = 0;
  let reviewMode = false;
  let selectedSlotIndex = 0;
  let lastCompositeUrl = null;
  let localSessionCode = "";

  function fitStage() {
    if (!boothStage) return;
    const scale = Math.min(window.innerWidth / 1080, window.innerHeight / 1920);
    boothStage.style.transform = "scale(" + scale + ")";
  }
  fitStage();
  window.addEventListener("resize", fitStage);
  window.addEventListener("orientationchange", fitStage);

  function showError(msg) {
    if (!errorBanner) return;
    errorBanner.textContent = msg || "";
    errorBanner.classList.toggle("hidden", !msg);
  }

  function resetPhotoState() {
    capturedPhotos = isTrySession
      ? [null, null]
      : [null, null, null, null];
    currentPoseIndex = 0;
    totalRetakesUsed = 0;
    reviewMode = false;
    selectedSlotIndex = 0;
    lastCompositeUrl = null;
    isCaptureInProgress = false;
  }

  function selectBackground(bg) {
    currentBackground = bg;
    if (bg && bg.id) {
      try { sessionStorage.setItem("felix_bg_id", bg.id); } catch (_) {}
    }
    document.querySelectorAll(".background-card").forEach((card) => {
      card.classList.toggle("selected", bg && card === bg.element);
    });
    if (templateBackground && bg) templateBackground.src = bg.src;
  }

  function bindCard(card) {
    const bg = {
      id: card.dataset.backgroundId,
      poses: 4,
      src: card.querySelector("img").src,
      element: card,
    };
    backgrounds.push(bg);
    const pick = () => selectBackground(bg);
    card.addEventListener("click", pick);
    if (card.classList.contains("selected")) selectBackground(bg);
    return bg;
  }

  async function loadPaidBackgrounds() {
    let ids = [];
    try {
      const res = await fetch("backgrounds.json?v=replica-1");
      ids = await res.json();
    } catch (_) {
      ids = [TRY_SAMPLE_ID];
    }
    paidBackgroundIds = (Array.isArray(ids) ? ids : []).filter((id) => /^bg_\d+$/.test(String(id)));
    if (!paidBackgroundIds.length) paidBackgroundIds = [TRY_SAMPLE_ID];
    rebuildBackgroundGrid(paidBackgroundIds);
  }

  function rebuildBackgroundGrid(ids) {
    const grid = document.getElementById("backgroundGrid");
    const template = grid.querySelector(".background-card");
    backgrounds = [];
    grid.replaceChildren();
    ids.forEach((id, index) => {
      const card = template ? template.cloneNode(true) : document.createElement("div");
      card.className = "background-card" + (index === 0 ? " selected" : "");
      card.dataset.backgroundId = id;
      card.dataset.poses = "4";
      card.style.display = "";
      const img = card.querySelector("img") || card.appendChild(document.createElement("img"));
      img.src = "backgrounds/" + id + ".jpg";
      img.alt = id.toUpperCase();
      let label = card.querySelector(".bg-label");
      if (!label) {
        label = document.createElement("div");
        label.className = "bg-label";
        card.appendChild(label);
      }
      label.textContent = id.toUpperCase() + " – 4 poses";
      grid.appendChild(card);
      bindCard(card);
    });
    grid.style.display = "flex";
    grid.style.flexWrap = "nowrap";
    grid.style.overflowX = "auto";
    grid.style.gap = "1.5rem";
    if (backgrounds[0]) selectBackground(backgrounds[0]);
  }

  loadPaidBackgrounds();

  function sampleBackground() {
    const hit = backgrounds.find((bg) => bg.id === TRY_SAMPLE_ID);
    if (hit) return hit;
    return {
      id: TRY_SAMPLE_ID,
      poses: 4,
      src: "backgrounds/" + TRY_SAMPLE_ID + ".jpg",
      element: null,
    };
  }

  function startPaidSession(code) {
    isTrySession = false;
    hasCommitted = true;
    totalPoses = 4;
    localSessionCode = code || String(Math.floor(100000 + Math.random() * 900000));
    resetPhotoState();
    rebuildBackgroundGrid(paidBackgroundIds.length ? paidBackgroundIds : [TRY_SAMPLE_ID]);
    showScreen(Screen.BACKGROUNDS);
  }

  function startTrySession() {
    isTrySession = true;
    hasCommitted = false;
    totalPoses = 2;
    localSessionCode = "";
    resetPhotoState();
    selectBackground(sampleBackground());
    showScreen(Screen.LIVE);
  }

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
      showError("Camera unavailable.");
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
    }, LIVE_AUTOSTART_MS);
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
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(liveVideo, 0, 0, w, h);
      ctx.restore();
    } else {
      captureCanvas.width = h;
      captureCanvas.height = w;
      ctx.save();
      ctx.translate(h / 2, w / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.scale(1, -1);
      ctx.drawImage(liveVideo, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    capturedPhotos[currentPoseIndex] = captureCanvas.toDataURL("image/jpeg", 0.9);
    updateTemplateSlots();
    liveVideo.classList.add("hidden");
    const freeze = document.createElement("img");
    freeze.id = "freezeFrame";
    freeze.src = capturedPhotos[currentPoseIndex];
    freeze.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;";
    videoLayer.appendChild(freeze);
    setTimeout(() => {
      freeze.remove();
      liveVideo.classList.remove("hidden");
      afterCapture();
    }, 1000);
  }

  function firstEmptySlot() {
    for (let i = 0; i < totalPoses; i++) {
      if (!capturedPhotos[i]) return i;
    }
    return -1;
  }

  function afterCapture() {
    isCaptureInProgress = false;
    if (isTrySession) {
      const filled = capturedPhotos.filter(Boolean).length;
      if (filled >= 2) {
        showScreen(Screen.PRINT);
      } else {
        currentPoseIndex = firstEmptySlot();
        showScreen(Screen.LIVE);
      }
      return;
    }
    if (!reviewMode) {
      const next = firstEmptySlot();
      if (next === -1) {
        reviewMode = true;
        selectedSlotIndex = 0;
        showScreen(Screen.REVIEW);
      } else {
        currentPoseIndex = next;
        showScreen(Screen.LIVE);
      }
    } else {
      showScreen(Screen.REVIEW);
    }
  }

  function updateTemplateSlots() {
    slotImages.forEach((img, i) => {
      if (!img) return;
      const src = capturedPhotos[i];
      img.src = src || "";
      img.style.opacity = src ? "1" : "0.2";
    });
    if (selectedPhotoPreview) {
      selectedPhotoPreview.src = capturedPhotos[selectedSlotIndex] || "";
    }
    if (poseNumberLabel) poseNumberLabel.textContent = selectedSlotIndex + 1;
    if (poseTotalLabel) poseTotalLabel.textContent = totalPoses;
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
    ctx.font = "700 " + Math.floor(w / 8) + "px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.textAlign = "center";
    ctx.fillText("SAMPLE", 0, 0);
    ctx.restore();
  }

  async function buildStrip() {
    const bg = await loadImage(currentBackground?.src || "backgrounds/" + TRY_SAMPLE_ID + ".jpg");
    const photos = await Promise.all(capturedPhotos.map((src) => (src ? loadImage(src) : null)));
    const out = document.createElement("canvas");
    out.width = bg.width;
    out.height = bg.height;
    const ctx = out.getContext("2d");
    ctx.drawImage(bg, 0, 0);
    photos.forEach((photo, i) => {
      if (!photo) return;
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
    if (isTrySession) stampSample(ctx, out.width, out.height);
    lastCompositeUrl = out.toDataURL("image/jpeg", 0.9);
    finalStripPreview.src = lastCompositeUrl;
    if (digitalStripPreview) digitalStripPreview.src = lastCompositeUrl;
  }

  function adjustPrintScreenForMode() {
    const screen = document.querySelector('[data-screen="PRINT"]');
    const title = screen.querySelector(".title-main");
    const subtitle = screen.querySelector(".subtitle");
    const printRow = printBtn ? printBtn.closest(".button-row") : null;
    if (printBtn) {
      printBtn.style.display = "none";
      printBtn.classList.add("hidden");
    }
    if (printRow) printRow.style.display = "none";
    if (isTrySession) {
      if (title) title.textContent = "Sample Preview";
      if (subtitle) {
        subtitle.textContent = "This is a sample preview only. Printing is disabled in Try Mode.";
      }
      if (printPreviewNote) printPreviewNote.hidden = true;
    } else {
      if (title) title.textContent = "Ready to Print";
      if (subtitle) subtitle.textContent = "Checkout your photo strip below!";
      if (printPreviewNote) printPreviewNote.hidden = false;
    }
  }

  function startPrintTimer() {
    stopPrintTimer();
    if (isTrySession) {
      printTimer = setTimeout(() => {
        isTrySession = false;
        showScreen(Screen.PAYMENT);
      }, 5000);
      return;
    }
    printTimer = setTimeout(() => showScreen(Screen.DIGITAL), 10000);
  }

  function stopPrintTimer() {
    if (printTimer) clearTimeout(printTimer);
    printTimer = null;
  }

  function startReviewIdleTimer() {
    stopReviewIdleTimer();
    reviewIdleTimer = setTimeout(() => {
      if (currentScreen === Screen.REVIEW) showScreen(Screen.PRINT);
    }, 15000);
  }

  function stopReviewIdleTimer() {
    if (reviewIdleTimer) clearTimeout(reviewIdleTimer);
    reviewIdleTimer = null;
  }

  function startDigitalIdleTimer() {
    stopDigitalIdleTimer();
    digitalIdleTimer = setTimeout(() => {
      if (currentScreen === Screen.DIGITAL) showScreen(Screen.THANKYOU);
    }, 12000);
  }

  function stopDigitalIdleTimer() {
    if (digitalIdleTimer) clearTimeout(digitalIdleTimer);
    digitalIdleTimer = null;
  }

  function startThankyouTimer() {
    let remaining = 10;
    if (thankyouCountdownEl) thankyouCountdownEl.textContent = remaining;
    if (thankyouTimer) clearInterval(thankyouTimer);
    thankyouTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(thankyouTimer);
        thankyouTimer = null;
        showScreen(Screen.ATTRACT);
      } else if (thankyouCountdownEl) {
        thankyouCountdownEl.textContent = remaining;
      }
    }, 1000);
  }

  function stopThankyouTimer() {
    if (thankyouTimer) clearInterval(thankyouTimer);
    thankyouTimer = null;
  }

  function showScreen(name) {
    const same = currentScreen === name;
    currentScreen = name;
    showError("");
    if (!same) {
      screens.forEach((section) => {
        section.classList.toggle("active", section.dataset.screen === name);
      });
    }
    if (name === Screen.LIVE) {
      startCamera().then(() => {
        if (!isCaptureInProgress) {
          hideLiveCaptureCues();
          startLiveAutoSnapTimer();
        }
      });
    } else {
      stopCamera();
      stopLiveAutoSnapTimer();
      clearCaptureSequenceTimers();
      hideLiveCaptureCues();
    }
    if (name === Screen.REVIEW) {
      updateTemplateSlots();
      if (templateBackground && currentBackground) templateBackground.src = currentBackground.src;
      startReviewIdleTimer();
    } else {
      stopReviewIdleTimer();
    }
    if (name === Screen.PRINT) {
      buildStrip().catch(() => {});
      adjustPrintScreenForMode();
      startPrintTimer();
    } else {
      stopPrintTimer();
    }
    if (name === Screen.DIGITAL) {
      if (sessionCodeDisplay) sessionCodeDisplay.textContent = localSessionCode;
      if (lastCompositeUrl && digitalStripPreview) digitalStripPreview.src = lastCompositeUrl;
      startDigitalIdleTimer();
    } else {
      stopDigitalIdleTimer();
    }
    if (name === Screen.THANKYOU) startThankyouTimer();
    else stopThankyouTimer();
    if (name === Screen.ATTRACT) {
      isTrySession = false;
      hasCommitted = false;
    }
  }

  function initPrepaidKeypad() {
    if (!prepaidInput) return;
    document.querySelectorAll(".keypad-key").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const digit = btn.dataset.key;
        if (digit) {
          if (prepaidInput.value.length >= 6) return;
          prepaidInput.value += digit;
          return;
        }
        if (btn.dataset.action === "clear") prepaidInput.value = "";
      });
    });
  }
  initPrepaidKeypad();

  document.querySelectorAll(".template-slot").forEach((slot) => {
    slot.addEventListener("click", () => {
      selectedSlotIndex = Number(slot.dataset.slotIndex) || 0;
      updateTemplateSlots();
    });
  });

  document.addEventListener(
    "touchstart",
    (ev) => {
      const target = ev.target.closest("[data-action]");
      if (!target) return;
      if (target.closest(".keypad-grid") || target.closest(".keypad-key")) return;
      ev.preventDefault();
      target.click();
    },
    { passive: false }
  );

  document.body.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "wake-mirror") return showScreen(Screen.AWAKE);
    if (action === "enter-mirror") return showScreen(Screen.PAYMENT);
    if (action === "enter-try-info") return showScreen(Screen.TRY_INFO);
    if (action === "try-info-back" || action === "try-info-exit") return showScreen(Screen.PAYMENT);
    if (action === "enter-try-mode") return startTrySession();
    if (action === "enter-prepaid") {
      if (prepaidInput) prepaidInput.value = "";
      if (prepaidError) prepaidError.textContent = "";
      return showScreen(Screen.PREPAID);
    }
    if (action === "enter-paynow") return showScreen(Screen.PRIVATE_EVENT);
    if (action === "payment-exit" || action === "pay-cancel") return showScreen(Screen.ATTRACT);
    if (action === "event-paid") return startPaidSession();
    if (action === "event-back" || action === "event-exit") return showScreen(Screen.PAYMENT);
    if (action === "pay-p2" || action === "pay-p4" || action === "pay-p6") return startPaidSession();
    if (action === "prepaid-back" || action === "prepaid-exit") return showScreen(Screen.PAYMENT);
    if (action === "prepaid-continue") {
      const code = (prepaidInput.value || "").trim();
      if (!/^\d{6}$/.test(code)) {
        prepaidError.textContent = "Code should be 6 digits.";
        return;
      }
      prepaidError.textContent = "";
      startPaidSession(code);
      return;
    }
    if (action === "backgrounds-next") {
      if (!currentBackground) currentBackground = backgrounds[0] || sampleBackground();
      resetPhotoState();
      return showScreen(Screen.LIVE);
    }
    if (action === "bg-scroll-left" || action === "bg-scroll-right") {
      const grid = document.getElementById("backgroundGrid");
      grid.scrollBy({ left: action === "bg-scroll-left" ? -220 : 220, behavior: "smooth" });
      return;
    }
    if (action === "retake-photo") {
      if (totalRetakesUsed >= MAX_RETAKES_PER_SESSION) return showScreen(Screen.PRINT);
      totalRetakesUsed += 1;
      capturedPhotos[selectedSlotIndex] = null;
      currentPoseIndex = selectedSlotIndex;
      return showScreen(Screen.LIVE);
    }
    if (action === "keep-photo") return showScreen(Screen.PRINT);
    if (action === "print-now") {
      if (isTrySession) {
        isTrySession = false;
        return showScreen(Screen.PAYMENT);
      }
      return showScreen(Screen.DIGITAL);
    }
    if (action === "digital-done") return showScreen(Screen.THANKYOU);
    if (action === "error-retry") return showScreen(Screen.PAYMENT);
    if (action === "error-to-attract") return showScreen(Screen.ATTRACT);
  });

  window.addEventListener("pagehide", stopCamera);
  showScreen(Screen.ATTRACT);
})();
