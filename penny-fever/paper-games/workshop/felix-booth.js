(() => {
  const Screen = {
    ATTRACT: "ATTRACT",
    AWAKE: "AWAKE",
    PAYMENT: "PAYMENT",
    PREPAID: "PREPAID",
    CASHIN: "CASHIN",
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

  const FREE_BGS = ["bg_1", "bg_3", "bg_11", "bg_17", "bg_30", "bg_43"];
  const TRY_SAMPLE_ID = "bg_11";
  const LIVE_AUTOSTART_MS = 400;
  const MAX_RETAKES_PER_SESSION = 2;
  // Square hosted checkout Payment Links (public URLs only — no access tokens).
  // Honor-based unlock on redirect until a server webhook verifies.
  const SQUARE_LINKS = {
    P2: { url: "https://square.link/u/1XR6t22j", credits: 1, label: "$7 · 2 strips" },
    P4: { url: "https://square.link/u/mJbnOorC", credits: 2, label: "$13 · 4 strips" },
    P6: { url: "https://square.link/u/9idvZ3go", credits: 3, label: "$18 · 6 strips" },
  };
  const PRICE = {
    sessionTickets: 1,
    sessionPennies: 5,
    unlockPennies: 2,
    unlockTickets: 1,
  };
  const CASHIN_CREDITS = { p2: 1, p4: 2, p6: 3 };
  const LS = {
    pennies: "felixBooth.pennies",
    tickets: "felixBooth.tickets",
    unlocks: "felixBooth.unlockedBgs",
    credits: "felixBooth.sessionCredits",
  };
  // Default Instapic double-strip slots (left half), mirrored to the right.
  const DEFAULT_SLOT_BOXES = [
    { x: 94, y: 12, w: 248, h: 278 },
    { x: 94, y: 286, w: 248, h: 278 },
    { x: 94, y: 642, w: 248, h: 282 },
    { x: 94, y: 920, w: 248, h: 282 },
  ];

  const screens = [...document.querySelectorAll(".screen")];
  const videoLayer = document.getElementById("video-layer");
  const liveVideo = document.getElementById("liveVideo");
  const captureCanvas = document.getElementById("captureCanvas");
  const countdownOverlay = document.getElementById("countdownOverlay");
  const countdownNumber = document.getElementById("countdownNumber");
  const liveOverlayTop = document.getElementById("liveOverlayTop");
  const lookUpOverlay = document.getElementById("lookUpOverlay");
  const noCameraPanel = document.getElementById("noCameraPanel");
  const noCameraFile = document.getElementById("noCameraFile");
  const noCameraPoseHint = document.getElementById("noCameraPoseHint");
  const noCameraTitle = document.getElementById("noCameraTitle");
  const noCameraSubtitle = document.getElementById("noCameraSubtitle");
  const noCameraErrorEl = document.getElementById("noCameraError");
  const cameraEnablePanel = document.getElementById("cameraEnablePanel");
  const cameraEnableHint = document.getElementById("cameraEnableHint");
  const templateBackground = document.getElementById("templateBackground");
  const slotImages = [0, 1, 2, 3].map((i) => document.getElementById("slotImage" + i));
  const selectedPhotoPreview = document.getElementById("selectedPhotoPreview");
  const poseNumberLabel = document.getElementById("poseNumberLabel");
  const poseTotalLabel = document.getElementById("poseTotalLabel");
  const finalStripPreview = document.getElementById("finalStripPreview");
  const digitalStripPreview = document.getElementById("digitalStripPreview");
  const prepaidInput = document.getElementById("prepaidCodeInput");
  const prepaidError = document.getElementById("prepaidError");
  const cashinInput = document.getElementById("cashinCodeInput");
  const cashinError = document.getElementById("cashinError");
  const cashinSubtitle = document.getElementById("cashinSubtitle");
  const thankyouCountdownEl = document.getElementById("thankyouCountdown");
  const errorBanner = document.getElementById("errorMessage");
  const sessionCodeDisplay = document.getElementById("sessionCodeDisplay");
  const printPreviewNote = document.querySelector(".instapic-print-preview-note");
  const printBtn = document.querySelector('[data-action="print-now"]');
  const boothStage = document.getElementById("booth-stage");
  const payBanner = document.getElementById("pay-banner");
  const walletTicketsEl = document.getElementById("felix-wallet-tickets");
  const walletPenniesEl = document.getElementById("felix-wallet-pennies");
  const walletCreditsEl = document.getElementById("felix-wallet-credits");
  const payCreditBtn = document.getElementById("payCreditBtn");
  const bonusLink = document.getElementById("bonusLink");
  const bonusLinkDigital = document.getElementById("bonusLinkDigital");

  let currentScreen = Screen.ATTRACT;
  let isTrySession = false;
  let hasCommitted = false;
  let videoStream = null;
  let cameraAvailable = null; // null=unknown, true=ready, false=failed/denied
  let cameraErrorName = "";
  let cameraRequestInFlight = false;
  let cueStepTimeout = null;
  let liveAutoSnapTimer = null;
  let reviewIdleTimer = null;
  let printTimer = null;
  let thankyouTimer = null;
  let digitalIdleTimer = null;
  let isCaptureInProgress = false;
  let backgrounds = [];
  let allBackgroundIds = [];
  let slotBoxes = DEFAULT_SLOT_BOXES.slice();
  let currentBackground = null;
  let totalPoses = 4;
  let currentPoseIndex = 0;
  let capturedPhotos = [null, null, null, null];
  let totalRetakesUsed = 0;
  let reviewMode = false;
  let selectedSlotIndex = 0;
  let lastCompositeUrl = null;
  let localSessionCode = "";
  let pendingCashinPkg = "p2";
  let unlockedBgs = loadUnlocks();

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

  function setPayBanner(msg) {
    if (payBanner) payBanner.textContent = msg || "";
  }

  /* ---- wallet: PennyFever parent when available, else localStorage ---- */
  function fever() {
    try {
      if (window.parent && window.parent !== window) return window.parent.PennyFever || null;
    } catch (_) {}
    return null;
  }

  function readLS(key, fallback) {
    try {
      const n = Number(JSON.parse(localStorage.getItem(key) || "null"));
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
    } catch {
      return fallback;
    }
  }
  function writeLS(key, n) {
    try { localStorage.setItem(key, JSON.stringify(Math.max(0, Math.floor(n)))); } catch (_) {}
    return Math.max(0, Math.floor(n));
  }

  function getPennies() {
    const PF = fever();
    if (PF) {
      const n = Number(PF.pennies?.() ?? PF.getState?.()?.demoCoins);
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }
    return readLS(LS.pennies, 24);
  }
  function getTickets() {
    const PF = fever();
    if (PF) {
      const n = Number(PF.tickets?.() ?? PF.getState?.()?.playTickets);
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }
    return readLS(LS.tickets, 3);
  }
  function getCredits() {
    return readLS(LS.credits, 0);
  }
  function spendPennies(amount) {
    const PF = fever();
    if (PF?.spendPennies) return !!PF.spendPennies(amount);
    const have = getPennies();
    if (have < amount) return false;
    writeLS(LS.pennies, have - amount);
    return true;
  }
  function spendTicket(kind) {
    const PF = fever();
    if (PF?.spendTicket) return !!PF.spendTicket(kind || "snap");
    const have = getTickets();
    if (have < 1) return false;
    writeLS(LS.tickets, have - 1);
    return true;
  }
  function addCredits(n) {
    return writeLS(LS.credits, getCredits() + n);
  }
  function spendCredit() {
    const have = getCredits();
    if (have < 1) return false;
    writeLS(LS.credits, have - 1);
    return true;
  }
  function creditPennies(n) {
    const PF = fever();
    if (PF?.addDemoCoins) {
      PF.addDemoCoins(n);
      return getPennies();
    }
    return writeLS(LS.pennies, getPennies() + n);
  }

  function loadUnlocks() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS.unlocks) || "[]");
      return new Set(Array.isArray(raw) ? raw.filter((id) => /^bg_\d+$/.test(id)) : []);
    } catch {
      return new Set();
    }
  }
  function saveUnlocks() {
    try { localStorage.setItem(LS.unlocks, JSON.stringify([...unlockedBgs])); } catch (_) {}
  }
  function isFreeBg(id) {
    return FREE_BGS.includes(id);
  }
  function isUnlocked(id) {
    return isFreeBg(id) || unlockedBgs.has(id);
  }

  function refreshWalletUi() {
    if (walletTicketsEl) walletTicketsEl.textContent = getTickets() + " tickets";
    if (walletPenniesEl) walletPenniesEl.textContent = getPennies() + " pennies";
    if (walletCreditsEl) walletCreditsEl.textContent = getCredits() + " booth credits";
    if (payCreditBtn) payCreditBtn.hidden = getCredits() < 1;
  }

  function resetPhotoState() {
    capturedPhotos = Array.from({ length: totalPoses }, () => null);
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
    const id = card.dataset.backgroundId;
    const bg = {
      id,
      poses: 4,
      src: card.querySelector("img").src,
      element: card,
      locked: card.classList.contains("is-locked"),
    };
    backgrounds.push(bg);
    card.addEventListener("click", () => {
      if (bg.locked) {
        tryUnlockBackground(bg);
        return;
      }
      selectBackground(bg);
    });
    if (card.classList.contains("selected") && !bg.locked) selectBackground(bg);
    return bg;
  }

  function tryUnlockBackground(bg) {
    const penniesOk = getPennies() >= PRICE.unlockPennies;
    const ticketsOk = getTickets() >= PRICE.unlockTickets;
    if (!penniesOk && !ticketsOk) {
      setPayBanner("Need 2 pennies or 1 ticket to unlock " + bg.id.toUpperCase() + ".");
      showError("Need 2 pennies or 1 ticket to unlock.");
      return;
    }
    let paid = false;
    if (penniesOk) paid = spendPennies(PRICE.unlockPennies);
    else paid = spendTicket("unlock-" + bg.id);
    if (!paid) {
      showError("Could not spend from your wallet.");
      return;
    }
    unlockedBgs.add(bg.id);
    saveUnlocks();
    refreshWalletUi();
    bg.locked = false;
    bg.element.classList.remove("is-locked");
    const badge = bg.element.querySelector(".bg-lock-badge");
    if (badge) badge.remove();
    const free = document.createElement("div");
    free.className = "bg-free-badge";
    free.textContent = "UNLOCKED";
    bg.element.appendChild(free);
    selectBackground(bg);
    setPayBanner("Unlocked " + bg.id.toUpperCase() + ".");
    showError("");
  }

  async function loadLayoutAndBackgrounds() {
    try {
      const layout = await fetch("felix-layout.json?v=camera-sq-1").then((r) => r.json());
      if (Array.isArray(layout.slot_boxes) && layout.slot_boxes.length === 4) {
        slotBoxes = layout.slot_boxes.map((b) => ({
          x: Number(b.x) || 0,
          y: Number(b.y) || 0,
          w: Number(b.w) || 1,
          h: Number(b.h) || 1,
        }));
      }
    } catch (_) {}
    let ids = [];
    try {
      ids = await fetch("backgrounds.json?v=pass-2b").then((r) => r.json());
    } catch (_) {
      ids = FREE_BGS.slice();
    }
    allBackgroundIds = (Array.isArray(ids) ? ids : []).filter((id) => /^bg_\d+$/.test(String(id)));
    if (!allBackgroundIds.length) allBackgroundIds = FREE_BGS.slice();
    // Free set first, then locked.
    const ordered = [
      ...FREE_BGS.filter((id) => allBackgroundIds.includes(id)),
      ...allBackgroundIds.filter((id) => !isFreeBg(id)),
    ];
    rebuildBackgroundGrid(ordered);
  }

  function rebuildBackgroundGrid(ids) {
    const grid = document.getElementById("backgroundGrid");
    const template = grid.querySelector(".background-card");
    backgrounds = [];
    grid.replaceChildren();
    let firstOpen = null;
    ids.forEach((id) => {
      const locked = !isUnlocked(id);
      const card = template ? template.cloneNode(true) : document.createElement("div");
      card.className = "background-card" + (locked ? " is-locked" : "");
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
      card.querySelectorAll(".bg-lock-badge, .bg-free-badge").forEach((el) => el.remove());
      if (locked) {
        const badge = document.createElement("div");
        badge.className = "bg-lock-badge";
        badge.textContent = "🔒 2¢ / 1 ticket";
        card.appendChild(badge);
      } else if (isFreeBg(id)) {
        const badge = document.createElement("div");
        badge.className = "bg-free-badge";
        badge.textContent = "FREE";
        card.appendChild(badge);
      }
      grid.appendChild(card);
      const bg = bindCard(card);
      if (!locked && !firstOpen) {
        firstOpen = bg;
        card.classList.add("selected");
      }
    });
    grid.style.display = "flex";
    grid.style.flexWrap = "nowrap";
    grid.style.overflowX = "auto";
    grid.style.gap = "1.5rem";
    if (firstOpen) selectBackground(firstOpen);
  }

  loadLayoutAndBackgrounds();

  function sampleBackground() {
    const hit = backgrounds.find((bg) => bg.id === TRY_SAMPLE_ID && !bg.locked);
    if (hit) return hit;
    const free = backgrounds.find((bg) => !bg.locked);
    return free || {
      id: TRY_SAMPLE_ID,
      poses: 4,
      src: "backgrounds/" + TRY_SAMPLE_ID + ".jpg",
      element: null,
      locked: false,
    };
  }

  function startPaidSession(code) {
    isTrySession = false;
    hasCommitted = true;
    totalPoses = 4;
    localSessionCode = code || String(Math.floor(100000 + Math.random() * 900000));
    resetPhotoState();
    const ordered = [
      ...FREE_BGS.filter((id) => allBackgroundIds.includes(id)),
      ...allBackgroundIds.filter((id) => !isFreeBg(id)),
    ];
    rebuildBackgroundGrid(ordered.length ? ordered : FREE_BGS.slice());
    updateBonusLinks();
    showScreen(Screen.BACKGROUNDS);
  }

  function startTrySession() {
    isTrySession = true;
    hasCommitted = false;
    totalPoses = 2;
    localSessionCode = "";
    resetPhotoState();
    const ordered = [
      ...FREE_BGS.filter((id) => allBackgroundIds.includes(id)),
      ...allBackgroundIds.filter((id) => !isFreeBg(id)),
    ];
    rebuildBackgroundGrid(ordered.length ? ordered : FREE_BGS.slice());
    if (!currentBackground || currentBackground.locked) selectBackground(sampleBackground());
    updateBonusLinks();
    showScreen(Screen.BACKGROUNDS);
  }

  function updateBonusLinks() {
    const code = localSessionCode || "";
    const url = code
      ? "https://instapic.fun/bonus.html?code=" + encodeURIComponent(code)
      : "https://instapic.fun/bonus.html";
    if (bonusLink) bonusLink.href = url;
    if (bonusLinkDigital) bonusLinkDigital.href = url;
  }

  function makeSilhouetteDataUrl(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#fff6e4");
    g.addColorStop(1, "#e7d0a8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(90, 60, 35, 0.28)";
    // soft papercut bust silhouette
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.38, w * 0.18, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.95);
    ctx.quadraticCurveTo(w * 0.22, h * 0.55, w / 2, h * 0.52);
    ctx.quadraticCurveTo(w * 0.78, h * 0.55, w * 0.78, h * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(59, 42, 26, 0.55)";
    ctx.font = "700 " + Math.floor(w / 14) + "px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Instapic", w / 2, h * 0.12);
    return c.toDataURL("image/jpeg", 0.92);
  }

  function attachStream(stream) {
    videoStream = stream;
    liveVideo.setAttribute("playsinline", "");
    liveVideo.setAttribute("webkit-playsinline", "");
    liveVideo.muted = true;
    liveVideo.playsInline = true;
    liveVideo.srcObject = stream;
    return liveVideo.play().catch(() => {});
  }

  async function getUserMediaLoose() {
    if (!navigator.mediaDevices?.getUserMedia) {
      const err = new Error("mediaDevices.getUserMedia missing");
      err.name = "UnsupportedError";
      throw err;
    }
    const attempts = [
      {
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
        audio: false,
      },
      { video: { facingMode: { ideal: "user" } }, audio: false },
      { video: true, audio: false },
    ];
    let lastErr = null;
    for (const constraints of attempts) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        lastErr = err;
        // Keep trying looser constraints for Overconstrained / NotFound.
        // Do NOT treat NotAllowed as retryable — user denied.
        if (err && (err.name === "NotAllowedError" || err.name === "SecurityError")) throw err;
      }
    }
    throw lastErr || new Error("getUserMedia failed");
  }

  function describeCameraError(err) {
    const name = (err && err.name) || "Error";
    cameraErrorName = name;
    if (name === "NotAllowedError" || name === "SecurityError") {
      return "Camera permission denied (" + name + "). Allow camera for instapic.fun in your phone settings, then tap Turn on camera again — or use a photo from your phone.";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return "No camera found (" + name + "). Use a photo from your phone instead.";
    }
    if (name === "NotReadableError" || name === "TrackStartError") {
      return "Camera is busy in another app (" + name + "). Close it and try again, or use a photo from your phone.";
    }
    if (name === "OverconstrainedError") {
      return "Camera could not match the requested settings (" + name + "). Try again, or use a photo from your phone.";
    }
    if (name === "UnsupportedError" || name === "TypeError") {
      return "This browser cannot open a camera (" + name + "). Use a photo from your phone instead.";
    }
    return "Camera could not start (" + name + "). " + ((err && err.message) || "") + " Use a photo from your phone, or tap Turn on camera again.";
  }

  function showCameraEnable(msg) {
    hideNoCamera();
    if (!cameraEnablePanel) return;
    cameraEnablePanel.classList.remove("hidden");
    if (cameraEnableHint) {
      cameraEnableHint.textContent =
        msg ||
        "Phones need a tap before the camera opens. Allow the permission when asked — we wait for your answer.";
    }
    stopLiveAutoSnapTimer();
    clearCaptureSequenceTimers();
    hideLiveCaptureCues();
  }
  function hideCameraEnable() {
    cameraEnablePanel?.classList.add("hidden");
  }

  async function requestCameraFromGesture() {
    if (cameraRequestInFlight) return false;
    if (videoStream && cameraAvailable) {
      hideCameraEnable();
      hideNoCamera();
      videoLayer.classList.remove("hidden");
      return true;
    }
    cameraRequestInFlight = true;
    hideNoCamera();
    if (cameraEnableHint) cameraEnableHint.textContent = "Asking for camera… tap Allow when your phone asks.";
    try {
      const stream = await getUserMediaLoose();
      await attachStream(stream);
      cameraAvailable = true;
      cameraErrorName = "";
      hideCameraEnable();
      hideNoCamera();
      videoLayer.classList.remove("hidden");
      if (currentScreen === Screen.LIVE && !isCaptureInProgress) {
        hideLiveCaptureCues();
        startLiveAutoSnapTimer();
      }
      return true;
    } catch (err) {
      cameraAvailable = false;
      const detail = describeCameraError(err);
      hideCameraEnable();
      showNoCamera(detail);
      return false;
    } finally {
      cameraRequestInFlight = false;
    }
  }

  async function startCamera() {
    // Never call getUserMedia from a timer/auto path — iOS Safari needs a user gesture.
    // If we already have a live stream, reuse it. Otherwise show the Turn on camera gate.
    if (videoStream && cameraAvailable) {
      videoLayer.classList.remove("hidden");
      hideNoCamera();
      hideCameraEnable();
      return true;
    }
    showCameraEnable();
    return false;
  }

  function stopCamera() {
    if (videoStream) {
      videoStream.getTracks().forEach((t) => t.stop());
      videoStream = null;
    }
    liveVideo.srcObject = null;
    videoLayer.classList.add("hidden");
    // Drop sticky "ready" so the next LIVE visit re-attaches cleanly.
    if (cameraAvailable === true) cameraAvailable = null;
  }

  function showNoCamera(detailMsg) {
    if (!noCameraPanel) return;
    hideCameraEnable();
    noCameraPanel.classList.remove("hidden");
    if (noCameraTitle) {
      noCameraTitle.textContent =
        cameraErrorName === "NotAllowedError" || cameraErrorName === "SecurityError"
          ? "Camera blocked"
          : "Camera unavailable";
    }
    if (noCameraSubtitle) {
      noCameraSubtitle.textContent =
        detailMsg ||
        "Pick a photo from your phone, or use a cream silhouette so the booth still finishes.";
    }
    if (noCameraErrorEl) {
      noCameraErrorEl.textContent = cameraErrorName ? "Error: " + cameraErrorName : "";
      noCameraErrorEl.classList.toggle("hidden", !cameraErrorName);
    }
    if (noCameraPoseHint) {
      noCameraPoseHint.textContent = "Pose " + (currentPoseIndex + 1) + " of " + totalPoses;
    }
    stopLiveAutoSnapTimer();
    clearCaptureSequenceTimers();
    hideLiveCaptureCues();
  }
  function hideNoCamera() {
    noCameraPanel?.classList.add("hidden");
  }

  function hideLiveCaptureCues() {
    liveOverlayTop?.classList.add("hidden");
    lookUpOverlay?.classList.add("hidden");
    countdownOverlay?.classList.add("hidden");
    countdownOverlay?.classList.remove("is-ready");
    document.querySelectorAll(".live-snap-flash").forEach((el) => el.remove());
  }

  function showCenterCue(text, asReady) {
    liveOverlayTop?.classList.add("hidden");
    lookUpOverlay?.classList.add("hidden");
    if (countdownNumber) countdownNumber.textContent = text;
    countdownOverlay?.classList.toggle("is-ready", !!asReady);
    countdownOverlay?.classList.remove("hidden");
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
    if (cameraAvailable === false) return;
    liveAutoSnapTimer = setTimeout(() => {
      liveAutoSnapTimer = null;
      if (currentScreen === Screen.LIVE && !isCaptureInProgress && cameraAvailable) {
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
    if (!cameraAvailable) {
      showNoCamera();
      return;
    }
    isCaptureInProgress = true;
    stopLiveAutoSnapTimer();
    clearCaptureSequenceTimers();
    const isFirstPose = capturedPhotos.filter(Boolean).length === 0;
    const steps = [];
    if (isFirstPose) steps.push({ kind: "settle", ms: 1200 });
    steps.push({ kind: "ready", ms: 1200 });
    steps.push({ kind: "lookup", ms: 1600 });
    steps.push({ kind: "count", value: 3, ms: 700 });
    steps.push({ kind: "count", value: 2, ms: 700 });
    steps.push({ kind: "count", value: 1, ms: 700 });
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
        liveOverlayTop?.classList.remove("hidden");
        lookUpOverlay?.classList.add("hidden");
        countdownOverlay?.classList.add("hidden");
        cueStepTimeout = setTimeout(runNext, step.ms);
        return;
      }
      if (step.kind === "lookup") {
        liveOverlayTop?.classList.add("hidden");
        countdownOverlay?.classList.add("hidden");
        lookUpOverlay?.classList.remove("hidden");
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
        countdownOverlay?.classList.add("hidden");
        capturePhoto();
      }, 80);
    };
    runNext();
  }

  function capturePhoto() {
    const w = liveVideo.videoWidth || 720;
    const h = liveVideo.videoHeight || 1280;
    // Guard: empty/black video → silhouette instead of a black box.
    if (!liveVideo.videoWidth || liveVideo.readyState < 2) {
      acceptPhotoDataUrl(makeSilhouetteDataUrl(720, 1280));
      return;
    }
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
    // Detect near-black frame
    try {
      const sample = ctx.getImageData(0, 0, Math.min(40, captureCanvas.width), Math.min(40, captureCanvas.height)).data;
      let sum = 0;
      for (let i = 0; i < sample.length; i += 4) sum += sample[i] + sample[i + 1] + sample[i + 2];
      const avg = sum / ((sample.length / 4) * 3);
      if (avg < 8) {
        acceptPhotoDataUrl(makeSilhouetteDataUrl(720, 1280));
        return;
      }
    } catch (_) {}
    acceptPhotoDataUrl(captureCanvas.toDataURL("image/jpeg", 0.9));
  }

  function acceptPhotoDataUrl(dataUrl) {
    capturedPhotos[currentPoseIndex] = dataUrl;
    updateTemplateSlots();
    liveVideo.classList.add("hidden");
    const freeze = document.createElement("img");
    freeze.id = "freezeFrame";
    freeze.src = dataUrl;
    freeze.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:3;";
    videoLayer.appendChild(freeze);
    videoLayer.classList.remove("hidden");
    hideNoCamera();
    setTimeout(() => {
      freeze.remove();
      liveVideo.classList.remove("hidden");
      afterCapture();
    }, 700);
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
      if (filled >= totalPoses) {
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
      const slot = img.closest(".template-slot");
      const used = i < totalPoses;
      if (slot) slot.classList.toggle("is-unused", !used);
      if (!used) {
        img.src = makeSilhouetteDataUrl(240, 320);
        img.style.opacity = "0.45";
        return;
      }
      const src = capturedPhotos[i];
      img.src = src || makeSilhouetteDataUrl(240, 320);
      img.style.opacity = src ? "1" : "0.55";
    });
    if (selectedPhotoPreview) {
      selectedPhotoPreview.src = capturedPhotos[selectedSlotIndex] || makeSilhouetteDataUrl(360, 480);
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

  function drawPhotoInBox(ctx, photo, box) {
    const { x, y, w, h } = box;
    const scale = Math.max(w / photo.width, h / photo.height);
    const dw = photo.width * scale;
    const dh = photo.height * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(photo, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    ctx.restore();
  }

  async function buildStrip() {
    const bg = await loadImage(currentBackground?.src || "backgrounds/" + TRY_SAMPLE_ID + ".jpg");
    // Always fill all 4 strip windows so unused poses are cream placeholders,
    // not empty see-through holes in the template.
    const photoSrcs = [];
    for (let i = 0; i < 4; i++) {
      if (i < totalPoses) {
        photoSrcs.push(capturedPhotos[i] || makeSilhouetteDataUrl(720, 1280));
      } else {
        photoSrcs.push(makeSilhouetteDataUrl(720, 1280));
      }
    }
    const photos = await Promise.all(photoSrcs.map((src) => loadImage(src)));
    const out = document.createElement("canvas");
    out.width = bg.width;
    out.height = bg.height;
    const ctx = out.getContext("2d");
    ctx.drawImage(bg, 0, 0);

    const scaleX = bg.width / 832;
    const scaleY = bg.height / 1232;
    const half = Math.floor(bg.width / 2);

    for (let i = 0; i < 4; i++) {
      const photo = photos[i];
      if (!photo) continue;
      const raw = slotBoxes[i] || DEFAULT_SLOT_BOXES[i];
      const leftBox = {
        x: Math.round(raw.x * scaleX),
        y: Math.round(raw.y * scaleY),
        w: Math.round(raw.w * scaleX),
        h: Math.round(raw.h * scaleY),
      };
      const rightBox = { ...leftBox, x: leftBox.x + half };
      drawPhotoInBox(ctx, photo, leftBox);
      drawPhotoInBox(ctx, photo, rightBox);
    }

    if (isTrySession) stampSample(ctx, out.width, out.height);
    lastCompositeUrl = out.toDataURL("image/jpeg", 0.92);
    if (finalStripPreview) finalStripPreview.src = lastCompositeUrl;
    if (digitalStripPreview) digitalStripPreview.src = lastCompositeUrl;
  }

  function adjustPrintScreenForMode() {
    const screen = document.querySelector('[data-screen="PRINT"]');
    const title = screen?.querySelector(".title-main");
    const subtitle = screen?.querySelector(".subtitle");
    if (printBtn) {
      printBtn.style.display = "";
      printBtn.classList.remove("hidden");
      printBtn.textContent = isTrySession ? "BACK TO PAYMENT" : "CONTINUE";
    }
    if (isTrySession) {
      if (title) title.textContent = "Sample Preview";
      if (subtitle) subtitle.textContent = "Try strip — " + totalPoses + " poses. Save or share below. Printing stays off in Try Mode.";
      if (printPreviewNote) printPreviewNote.hidden = true;
    } else {
      if (title) title.textContent = "Your Photo Strip";
      if (subtitle) subtitle.textContent = "Save, share, or open the Instapic bonus page.";
      if (printPreviewNote) printPreviewNote.hidden = false;
    }
  }

  function startPrintTimer() {
    stopPrintTimer();
    // Don't auto-bounce while the guest may still be saving/sharing.
  }
  function stopPrintTimer() {
    if (printTimer) clearTimeout(printTimer);
    printTimer = null;
  }

  function startReviewIdleTimer() {
    stopReviewIdleTimer();
    reviewIdleTimer = setTimeout(() => {
      if (currentScreen === Screen.REVIEW) showScreen(Screen.PRINT);
    }, 20000);
  }
  function stopReviewIdleTimer() {
    if (reviewIdleTimer) clearTimeout(reviewIdleTimer);
    reviewIdleTimer = null;
  }

  function startDigitalIdleTimer() {
    stopDigitalIdleTimer();
  }
  function stopDigitalIdleTimer() {
    if (digitalIdleTimer) clearTimeout(digitalIdleTimer);
    digitalIdleTimer = null;
  }

  function startThankyouTimer() {
    let remaining = 8;
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

  async function saveStrip() {
    if (!lastCompositeUrl) {
      try { await buildStrip(); } catch (_) {}
    }
    if (!lastCompositeUrl) return;
    const a = document.createElement("a");
    a.href = lastCompositeUrl;
    a.download = "instapic-felix-" + (localSessionCode || "sample") + ".jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function shareStrip() {
    if (!lastCompositeUrl) {
      try { await buildStrip(); } catch (_) {}
    }
    if (!lastCompositeUrl) return;
    try {
      const res = await fetch(lastCompositeUrl);
      const blob = await res.blob();
      const file = new File([blob], "instapic-felix-" + (localSessionCode || "sample") + ".jpg", {
        type: "image/jpeg",
      });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          files: [file],
          title: "My Instapic strip",
          text: "Moments Made Magical — instapic.fun",
        });
        return;
      }
    } catch (_) {}
    await saveStrip();
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
    if (name === Screen.PAYMENT) refreshWalletUi();
    if (name === Screen.LIVE) {
      startCamera().then((ok) => {
        if (ok && !isCaptureInProgress) {
          hideLiveCaptureCues();
          startLiveAutoSnapTimer();
        }
      });
    } else {
      hideNoCamera();
      hideCameraEnable();
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
      updateBonusLinks();
    } else {
      stopPrintTimer();
    }
    if (name === Screen.DIGITAL) {
      if (sessionCodeDisplay) sessionCodeDisplay.textContent = localSessionCode;
      if (lastCompositeUrl && digitalStripPreview) digitalStripPreview.src = lastCompositeUrl;
      startDigitalIdleTimer();
      updateBonusLinks();
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
      const idx = Number(slot.dataset.slotIndex) || 0;
      if (idx >= totalPoses) return;
      selectedSlotIndex = idx;
      updateTemplateSlots();
    });
  });

  function bindPhotoFileInput(input) {
    if (!input) return;
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        isCaptureInProgress = true;
        acceptPhotoDataUrl(String(reader.result || ""));
        input.value = "";
      };
      reader.readAsDataURL(file);
    });
  }
  bindPhotoFileInput(noCameraFile);
  bindPhotoFileInput(document.getElementById("enableCameraFile"));

  document.addEventListener(
    "touchstart",
    (ev) => {
      const target = ev.target.closest("[data-action]");
      if (!target) return;
      if (target.closest(".keypad-grid") || target.closest(".keypad-key")) return;
      if (target.closest("label.no-camera-file-label")) return;
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

    if (action === "pay-tickets") {
      refreshWalletUi();
      if (getTickets() < PRICE.sessionTickets) {
        setPayBanner("Need 1 ticket. Buy a strip from Aura, or cash five pennies for a ticket.");
        return;
      }
      if (!spendTicket("snap")) {
        setPayBanner("Could not spend a ticket.");
        return;
      }
      refreshWalletUi();
      setPayBanner("Ticket accepted.");
      return startPaidSession();
    }
    if (action === "pay-pennies") {
      refreshWalletUi();
      if (getPennies() < PRICE.sessionPennies) {
        setPayBanner("Need 5 pennies for a booth session.");
        return;
      }
      if (!spendPennies(PRICE.sessionPennies)) {
        setPayBanner("Could not spend pennies.");
        return;
      }
      refreshWalletUi();
      setPayBanner("5 pennies accepted.");
      return startPaidSession();
    }
    if (action === "pay-credit") {
      if (!spendCredit()) {
        setPayBanner("No booth credits left.");
        refreshWalletUi();
        return;
      }
      refreshWalletUi();
      setPayBanner("Booth credit used.");
      return startPaidSession();
    }
    if (action === "square-p2" || action === "square-p4" || action === "square-p6") {
      const pkg = action.replace("square-", "").toUpperCase();
      const link = SQUARE_LINKS[pkg];
      if (!link?.url) {
        setPayBanner("Square link missing for " + pkg + ".");
        return;
      }
      try {
        sessionStorage.setItem("felixBooth.pendingPay", pkg);
      } catch (_) {}
      setPayBanner(
        "Opening Square for " +
          link.label +
          ". After you pay, come back here — credits unlock on return (honor-based until webhook verifies)."
      );
      const opened = window.open(link.url, "_blank", "noopener,noreferrer");
      if (!opened) {
        // Popup blocked — navigate same tab.
        location.href = link.url;
      }
      return;
    }
    if (action === "cashin-p2" || action === "cashin-p4" || action === "cashin-p6") {
      // Kept for deep-links / older UI; prefer Square buttons above.
      pendingCashinPkg = action.replace("cashin-", "");
      const credits = CASHIN_CREDITS[pendingCashinPkg] || 1;
      if (cashinInput) cashinInput.value = "";
      if (cashinError) cashinError.textContent = "";
      if (cashinSubtitle) {
        cashinSubtitle.textContent =
          "Enter a 6-digit Instapic code from a $" +
          ({ p2: "7", p4: "13", p6: "18" }[pendingCashinPkg] || "?") +
          " package. Grants " +
          credits +
          " booth credit(s). Prefer Square pay above for a new purchase.";
      }
      return showScreen(Screen.CASHIN);
    }
    if (action === "cashin-back") return showScreen(Screen.PAYMENT);
    if (action === "cashin-continue") {
      const code = (cashinInput?.value || "").trim();
      if (!/^\d{6}$/.test(code)) {
        if (cashinError) cashinError.textContent = "STUB: code must be 6 digits.";
        return;
      }
      const credits = CASHIN_CREDITS[pendingCashinPkg] || 1;
      addCredits(credits);
      // Also drop a few pennies so unlocks work after cash-in on standalone.
      creditPennies(credits * 2);
      refreshWalletUi();
      setPayBanner("STUB granted " + credits + " booth credit(s) for code " + code + ".");
      return showScreen(Screen.PAYMENT);
    }

    if (action === "prepaid-back" || action === "prepaid-exit") return showScreen(Screen.PAYMENT);
    if (action === "prepaid-continue") {
      const code = (prepaidInput.value || "").trim();
      if (!/^\d{6}$/.test(code)) {
        prepaidError.textContent = "Code should be 6 digits. (STUB — format only.)";
        return;
      }
      prepaidError.textContent = "";
      // Treat prepaid as a stub cash-in of 1 credit then start.
      addCredits(1);
      spendCredit();
      startPaidSession(code);
      return;
    }
    if (action === "backgrounds-next") {
      if (!currentBackground || currentBackground.locked) {
        currentBackground = sampleBackground();
      }
      if (currentBackground?.locked) {
        showError("Pick a free or unlocked background first.");
        return;
      }
      resetPhotoState();
      return showScreen(Screen.LIVE);
    }
    if (action === "bg-scroll-left" || action === "bg-scroll-right") {
      const grid = document.getElementById("backgroundGrid");
      grid.scrollBy({ left: action === "bg-scroll-left" ? -220 : 220, behavior: "smooth" });
      return;
    }
    if (action === "enable-camera" || action === "retry-camera") {
      requestCameraFromGesture();
      return;
    }
    if (action === "use-silhouette") {
      isCaptureInProgress = true;
      acceptPhotoDataUrl(makeSilhouetteDataUrl(720, 1280));
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
    if (action === "save-strip") {
      saveStrip();
      return;
    }
    if (action === "share-strip") {
      shareStrip();
      return;
    }
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

  function consumePaidReturn() {
    try {
      const params = new URLSearchParams(location.search);
      const paid = String(params.get("paid") || "").toUpperCase();
      if (!paid || !SQUARE_LINKS[paid]) return false;
      const link = SQUARE_LINKS[paid];
      const credits = Math.max(1, Number(params.get("credits")) || link.credits || 1);
      addCredits(credits);
      creditPennies(credits * 2);
      refreshWalletUi();
      try {
        sessionStorage.removeItem("felixBooth.pendingPay");
      } catch (_) {}
      const url = new URL(location.href);
      url.searchParams.delete("paid");
      url.searchParams.delete("credits");
      const cleaned = url.pathname + (url.search || "") + (url.hash || "");
      try {
        history.replaceState({}, "", cleaned);
      } catch (_) {}
      setPayBanner(
        "Square return for " +
          link.label +
          ": +" +
          credits +
          " booth credit(s). Honor-based until a webhook verifies the payment."
      );
      showScreen(Screen.PAYMENT);
      return true;
    } catch (_) {
      return false;
    }
  }

  window.addEventListener("pagehide", stopCamera);
  refreshWalletUi();
  if (!consumePaidReturn()) showScreen(Screen.ATTRACT);
})();
