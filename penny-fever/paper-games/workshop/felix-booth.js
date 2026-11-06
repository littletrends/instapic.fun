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
  // The game mock uses its local strip artwork and keepsakes only.
  function bgThumb(id) { return "backgrounds/strips/thumbs/" + id + ".jpg"; }
  function bgFull(id) { return "backgrounds/strips/" + id + ".jpg"; }
  const TRY_SAMPLE_ID = "bg_11";
  // Felix strip layout's left column on the 784×1186 design grid.
  const STRIP_SLOTS_LEFT = [
    [100, 18, 208, 252],
    [100, 272, 208, 256],
    [100, 624, 208, 260],
    [100, 888, 208, 272],
  ];
  const SLOT_REF = { w: 416, h: 1232 }; // left half of current 832×1232 dual
  const FREEZE_PORTRAIT = { w: 1024, h: 1280 };
  const LIVE_AUTOSTART_MS = 400;
  const TRY_PREVIEW_MS = 8000;
  const MAX_RETAKES_PER_SESSION = 2;
  const GAME_FILES_KEY = "pennyFeverGameFiles";
  const GAME_MEDIA_DB = "pennyFeverGameMedia";
  const PRICE = {
    sessionTickets: 1,
    unlockPennies: 2,
  };
  // Game portals spend Penny Fever pennies for local photo sessions.
  const PORTAL_PACKS = {
    "pay-p2": { pkg: "FELIX_P1_STRIP", pennies: 10, sessions: 2, dollars: "$5", label: "Pair pack" },
    "pay-p4": { pkg: "FELIX_P2_STRIP_GIF", pennies: 16, sessions: 4, dollars: "$8", label: "Fun pack" },
    "pay-p6": { pkg: "FELIX_P3_STRIP_GIF", pennies: 20, sessions: 6, dollars: "$10", label: "Crew pack" },
  };
  let pendingPennyPack = null;
  let pendingUnlockBg = null;
  // Booth-style session video (same contract as the Magic Mirror
  // video_capture_patch.js: one continuous upright clip, field "video",
  // file session_video.mp4|webm, max 32 s). Phone-friendly size.
  const REC_MAX_MS = 32000;
  const REC_LONG_SIDE = 960;
  const REC_FPS = 24;
  const REC_BPS = 1200000;
  const REC_MIME_CHAIN = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  const LS = {
    pennies: "felixBooth.pennies",
    tickets: "felixBooth.tickets",
    unlocks: "felixBooth.unlockedBgs",
    credits: "felixBooth.sessionCredits",
  };
  function slotsForStripSize(W, H) {
    // strip_web is left half of dual (2W×H). Scale design grid like bonus_pipeline.
    const sx = (W * 2) / 784;
    const sy = H / 1186;
    return STRIP_SLOTS_LEFT.map(([x, y, w, h]) => ({
      x: Math.round(x * sx),
      y: Math.round(y * sy),
      w: Math.max(1, Math.round(w * sx)),
      h: Math.max(1, Math.round(h * sy)),
    }));
  }
  // Default strip slot geometry at 416×1232.
  const DEFAULT_SLOT_BOXES = slotsForStripSize(SLOT_REF.w, SLOT_REF.h);

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
  const reviewStripPreview = document.getElementById("reviewStripPreview");
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
  const requestedGameCode = String(new URLSearchParams(location.search).get("gameCode") || "").trim().toUpperCase();
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
  let slotRef = { w: SLOT_REF.w, h: SLOT_REF.h };
  let currentBackground = null;
  let totalPoses = 4;
  let currentPoseIndex = 0;
  let capturedPhotos = [null, null, null, null];
  let totalRetakesUsed = 0;
  let reviewMode = false;
  let selectedSlotIndex = 0;
  let lastCompositeUrl = null;
  let localSessionCode = /^PF-[A-HJ-NP-Z]{6}$/.test(requestedGameCode) ? requestedGameCode : "";
  let bonusState = "idle"; // idle | working | ready | failed
  let bonusSessionKey = "";
  // { no, total, left } for multi-session codes ($5/$8/$10 packages).
  let sessionInfo = null;
  let rec = null; // active MediaRecorder state
  let recPromise = null; // resolves to { blob, mime, ext } | null for this session
  let unlockedBgs = loadUnlocks();

  function fitStage() {
    if (!boothStage) return;
    // Real booth is 1080×1920. Scale that canvas to the phone / alley iframe
    // so kiosk fonts and layout stay in proportion.
    const vw = Math.max(1, window.innerWidth || 390);
    const vh = Math.max(1, window.innerHeight || 844);
    const scale = vw / 1080;
    const designH = Math.max(1920, Math.ceil(vh / scale));
    boothStage.style.width = "1080px";
    boothStage.style.height = designH + "px";
    boothStage.style.transformOrigin = "center center";
    boothStage.style.transform = "scale(" + scale + ")";
  }
  fitStage();
  window.addEventListener("resize", fitStage);
  window.addEventListener("orientationchange", fitStage);
  window.__felixTest = {
    setPhotos(urls) {
      for (let i = 0; i < 4; i++) capturedPhotos[i] = urls[i] || null;
      totalPoses = 4;
    },
    setBackground(id, src) {
      const found = backgrounds.find((b) => b.id === id);
      currentBackground = found
        ? Object.assign({}, found, src ? { src: src } : {})
        : { id: id, src: src || bgFull(id), poses: 4 };
    },
    buildStrip: () => buildStrip(),
    getComposite: () => lastCompositeUrl,
    slotsFor: (w, h) => slotsForStripSize(w, h),
  };

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

  const FEVER_STORE_KEY = "pennyFever.restyle.v1";

  function readLs(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      // Missing key must use fallback — JSON.parse("null") → null → Number(null) === 0
      // used to hide the fallback and show a fake empty wallet.
      if (raw == null || raw === "") return fallback;
      const n = Number(JSON.parse(raw));
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
    } catch {
      return fallback;
    }
  }
  function writeLS(key, n) {
    try { localStorage.setItem(key, JSON.stringify(Math.max(0, Math.floor(n)))); } catch (_) {}
    return Math.max(0, Math.floor(n));
  }

  function readFeverStore() {
    try {
      const raw = localStorage.getItem(FEVER_STORE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s && typeof s === "object" && !Array.isArray(s) ? s : null;
    } catch (_) {
      return null;
    }
  }
  function writeFeverStoreField(field, value) {
    try {
      const s = readFeverStore() || {};
      s[field] = Math.max(0, Math.floor(Number(value) || 0));
      localStorage.setItem(FEVER_STORE_KEY, JSON.stringify(s));
      return true;
    } catch (_) {
      return false;
    }
  }

  function getPennies() {
    const PF = fever();
    if (PF) {
      const n = Number(PF.pennies?.() ?? PF.getState?.()?.demoCoins);
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }
    const store = readFeverStore();
    if (store && store.demoCoins != null) {
      const n = Number(store.demoCoins);
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }
    // No invented starter credit — missing key means 0.
    return readLs(LS.pennies, 0);
  }
  function getTickets() {
    const PF = fever();
    if (PF) {
      const n = Number(PF.tickets?.() ?? PF.getState?.()?.playTickets);
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }
    const store = readFeverStore();
    if (store && store.playTickets != null) {
      const n = Number(store.playTickets);
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }
    return readLs(LS.tickets, 0);
  }
  function readGameFiles() {
    try {
      const files = JSON.parse(localStorage.getItem(GAME_FILES_KEY) || "[]");
      return Array.isArray(files)
        ? files.filter((file) => file && /^PF-[A-HJ-NP-Z]{6}$/.test(String(file.code || "")))
        : [];
    } catch (_) {
      return [];
    }
  }
  function writeGameFiles(files) {
    try {
      localStorage.setItem(GAME_FILES_KEY, JSON.stringify(files));
      return true;
    } catch (_) {
      showError("This browser is out of space. Download your strip, then clear old game keepsakes.");
      return false;
    }
  }
  function openGameMediaDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
      const request = indexedDB.open(GAME_MEDIA_DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("sessions")) db.createObjectStore("sessions", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open game media storage"));
    });
  }
  async function saveGameMedia(record) {
    const db = await openGameMediaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("sessions", "readwrite");
      tx.objectStore("sessions").put(record);
      tx.oncomplete = () => { db.close(); resolve(record.id); };
      tx.onerror = () => { db.close(); reject(tx.error || new Error("Could not save game media")); };
      tx.onabort = () => { db.close(); reject(tx.error || new Error("Game media save was cancelled")); };
    });
  }
  function findGameFile(code) {
    const normalized = String(code || "").trim().toUpperCase();
    return readGameFiles().find((file) => file.code === normalized) || null;
  }
  function generateGameCode() {
    const existing = new Set(readGameFiles().map((file) => file.code));
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const values = new Uint32Array(6);
      if (window.crypto?.getRandomValues) window.crypto.getRandomValues(values);
      else for (let i = 0; i < values.length; i += 1) values[i] = Math.floor(Math.random() * 0x100000000);
      const code = "PF-" + Array.from(values, (value) => letters[value % letters.length]).join("");
      if (!existing.has(code)) return code;
    }
    return "PF-" + Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  }
  function getLocalSessions() {
    return readLs(LS.credits, 0);
  }
  function addLocalSessions(n) {
    const add = Math.max(0, Math.floor(Number(n) || 0));
    return writeLS(LS.credits, getLocalSessions() + add);
  }
  function spendLocalSession() {
    const have = getLocalSessions();
    if (have < 1) return false;
    writeLS(LS.credits, have - 1);
    return true;
  }
  function getCredits() {
    return getLocalSessions();
  }
  function spendPennies(amount) {
    const PF = fever();
    if (PF?.spendPennies) return !!PF.spendPennies(amount);
    const have = getPennies();
    if (have < amount) return false;
    const next = have - amount;
    const store = readFeverStore();
    if (store && store.demoCoins != null) writeFeverStoreField("demoCoins", next);
    writeLS(LS.pennies, next);
    return true;
  }
  function spendTicket(kind) {
    const PF = fever();
    if (PF?.spendTicket) return !!PF.spendTicket(kind || "snap");
    const have = getTickets();
    if (have < 1) return false;
    const next = have - 1;
    const store = readFeverStore();
    if (store && store.playTickets != null) writeFeverStoreField("playTickets", next);
    writeLS(LS.tickets, next);
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
    const tickets = getTickets();
    const pennies = getPennies();
    const credits = getCredits();
    if (walletTicketsEl) walletTicketsEl.textContent = tickets + " tickets";
    if (walletPenniesEl) walletPenniesEl.textContent = pennies + " pennies";
    if (walletCreditsEl) walletCreditsEl.textContent = credits + (credits === 1 ? " photo session" : " photo sessions");
    const purse = document.getElementById("bgPurseNote");
    if (purse) purse.textContent = pennies + (pennies === 1 ? " penny in your purse" : " pennies in your purse");
    if (payCreditBtn) {
      payCreditBtn.hidden = false;
      payCreditBtn.textContent =
        credits === 1 ? "1 session left" : credits + " sessions left";
    }

    const ticketBtn = document.querySelector('[data-action="pay-tickets"]');
    const canTicket = tickets >= PRICE.sessionTickets;
    if (ticketBtn) {
      ticketBtn.disabled = !canTicket;
      ticketBtn.classList.toggle("is-disabled", !canTicket);
      ticketBtn.setAttribute("aria-disabled", String(!canTicket));
      ticketBtn.title = canTicket ? "" : "Need 1 ticket — earn these in Penny Fever";
    }
    // Portals stay enabled: enough pennies → confirm spend; short → Aura penny top-up.
    Object.keys(PORTAL_PACKS).forEach((action) => {
      const pack = PORTAL_PACKS[action];
      const btn = document.querySelector('[data-action="' + action + '"]');
      if (!btn) return;
      const ok = pennies >= pack.pennies;
      btn.classList.toggle("can-afford", ok);
      btn.classList.toggle("needs-topup", !ok);
      btn.title = ok
        ? "Spend " + pack.pennies + " pennies for " + pack.sessions + " sessions"
        : "Need " + pack.pennies + " pennies — tap to top up at Aura's booth";
    });
    const note = document.getElementById("felix-scrip-note");
    if (note) {
      if (!canTicket && credits < 1 && pennies < 10) {
        note.hidden = false;
        note.textContent = "Earn pennies on the midway, or tap a circle to top up at Aura's booth.";
      } else if (!canTicket) {
        note.hidden = false;
        note.textContent = "Tickets: need 1 for a single session. Circles spend pennies for multi-packs.";
      } else {
        note.hidden = true;
        note.textContent = "";
      }
    }
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


  function applyTemplateSlotCss(naturalW, naturalH) {
    const refW = naturalW || (templateBackground && templateBackground.naturalWidth) || slotRef.w || SLOT_REF.w;
    const refH = naturalH || (templateBackground && templateBackground.naturalHeight) || slotRef.h || SLOT_REF.h;
    const boxes = slotsForStripSize(refW, refH);
    slotBoxes = boxes;
    slotRef = { w: refW, h: refH };
    boxes.forEach((box, i) => {
      const el = document.querySelector(".template-slot.slot-" + (i + 1));
      if (!el || !box) return;
      el.style.left = ((box.x / refW) * 100).toFixed(3) + "%";
      el.style.top = ((box.y / refH) * 100).toFixed(3) + "%";
      el.style.width = ((box.w / refW) * 100).toFixed(3) + "%";
      el.style.height = ((box.h / refH) * 100).toFixed(3) + "%";
      el.style.transform = "none";
    });
  }

  // Pillow ImageOps.fit(..., centering=(0.5,0.5)) — cover crop, centered.
  function coverCropToCanvas(photo, w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    const scale = Math.max(w / photo.width, h / photo.height);
    const dw = photo.width * scale;
    const dh = photo.height * scale;
    ctx.drawImage(photo, (w - dw) / 2, (h - dh) / 2, dw, dh);
    return c;
  }

  function selectBackground(bg) {
    hideUnlockConfirm();
    currentBackground = bg;
    if (bg && bg.id) {
      try { sessionStorage.setItem("felix_bg_id", bg.id); } catch (_) {}
    }
    document.querySelectorAll(".background-card").forEach((card) => {
      card.classList.toggle("selected", bg && card === bg.element);
    });
    if (templateBackground && bg) {
      const full = bg.src || bgFull(bg.id);
      templateBackground.onload = () => applyTemplateSlotCss();
      templateBackground.src = full;
      applyTemplateSlotCss();
      // Warm the full-res single strip when guest picks a card (thumbs stay lazy).
      const warm = new Image();
      warm.decoding = "async";
      warm.src = full;
    }
  }

  function bindCard(card) {
    const id = card.dataset.backgroundId;
    const img = card.querySelector("img");
    const bg = {
      id,
      poses: 4,
      src: (img && img.dataset.fullSrc) || bgFull(id),
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

  function hideUnlockConfirm() {
    pendingUnlockBg = null;
    const box = document.getElementById("felix-unlock-confirm");
    if (box) box.hidden = true;
  }

  function showUnlockConfirm(bg) {
    pendingUnlockBg = bg;
    const box = document.getElementById("felix-unlock-confirm");
    const text = document.getElementById("felix-unlock-confirm-text");
    if (text) {
      text.textContent =
        "Unlock " + bg.id.toUpperCase() + " for " + PRICE.unlockPennies +
        " pennies? Taken from your purse.";
    }
    if (box) box.hidden = false;
  }

  function tryUnlockBackground(bg) {
    hideUnlockConfirm();
    if (getPennies() < PRICE.unlockPennies) {
      showError("Need " + PRICE.unlockPennies + " pennies in your purse to unlock this template.");
      return;
    }
    showUnlockConfirm(bg);
  }

  function confirmUnlockBackground() {
    const bg = pendingUnlockBg;
    hideUnlockConfirm();
    if (!bg) return;
    if (getPennies() < PRICE.unlockPennies) {
      showError("Need " + PRICE.unlockPennies + " pennies in your purse to unlock this template.");
      return;
    }
    if (!spendPennies(PRICE.unlockPennies)) {
      showError("Could not spend pennies from your purse.");
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
    setPayBanner("Unlocked " + bg.id.toUpperCase() + " for " + PRICE.unlockPennies + " pennies.");
    showError("");
  }

  async function loadLayoutAndBackgrounds() {
    try {
      const layout = await fetch("felix-layout.json?v=strip-web-4").then((r) => r.json());
      // Locked 06/11/2026 Mother strip_web template — slots always from design_slots_left math.
      if (layout.locked && Array.isArray(layout.design_slots_left) && layout.design_slots_left.length === 4) {
        for (let i = 0; i < 4; i++) {
          STRIP_SLOTS_LEFT[i] = layout.design_slots_left[i].map(Number);
        }
      }
      if (layout.slot_ref && layout.slot_ref.w && layout.slot_ref.h) {
        slotRef = { w: Number(layout.slot_ref.w) || SLOT_REF.w, h: Number(layout.slot_ref.h) || SLOT_REF.h };
      }
      // Prefer live scale from strip size; fall back to locked slot_boxes at slot_ref.
      slotBoxes = slotsForStripSize(slotRef.w, slotRef.h);
      applyTemplateSlotCss();
    } catch (_) {}
    let ids = [];
    try {
      ids = await fetch("backgrounds.json?v=strip-web-4").then((r) => r.json());
    } catch (_) {
      ids = FREE_BGS.slice();
    }
    allBackgroundIds = (Array.isArray(ids) ? ids : []).filter((id) => /^bg_\d+$/.test(String(id)));
    if (!allBackgroundIds.length) allBackgroundIds = FREE_BGS.slice();
    // Intentionally do NOT rebuild the grid here — building 96 <img> tags on
    // ATTRACT floods phones. Grid is built when a session reaches BACKGROUNDS.
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
      const poseCount = isTrySession ? 2 : 4;
      card.dataset.poses = String(poseCount);
      card.style.display = "";
      const img = card.querySelector("img") || card.appendChild(document.createElement("img"));
      img.loading = "lazy";
      img.decoding = "async";
      img.dataset.fullSrc = bgFull(id);
      img.src = bgFull(id);
      img.alt = id.toUpperCase();
      let label = card.querySelector(".bg-label");
      if (!label) {
        label = document.createElement("div");
        label.className = "bg-label";
        card.appendChild(label);
      }
      label.textContent = id.toUpperCase() + " – " + poseCount + " poses";
      card.querySelectorAll(".bg-lock-badge, .bg-free-badge").forEach((el) => el.remove());
      if (locked) {
        const badge = document.createElement("div");
        badge.className = "bg-lock-badge";
        badge.textContent = "🔒 2 pennies";
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
      src: bgFull(TRY_SAMPLE_ID),
      element: null,
      locked: false,
    };
  }

  function startPaidSession(code, info) {
    resetRecording();
    sessionInfo = info || null;
    isTrySession = false;
    hasCommitted = true;
    totalPoses = 4;
    const requested = String(code || localSessionCode || requestedGameCode || "").trim().toUpperCase();
    localSessionCode = /^PF-[A-HJ-NP-Z]{6}$/.test(requested) && findGameFile(requested) ? requested : "";
    // Issue the separate game code when the paid game session starts, then
    // attach the finished strip to this same file on the DIGITAL screen.
    prepareGameCode();
    bonusState = "idle";
    bonusSessionKey = String(Date.now());
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
    resetRecording();
    sessionInfo = null;
    isTrySession = true;
    hasCommitted = false;
    totalPoses = 2;
    localSessionCode = "";
    bonusState = "idle";
    resetPhotoState();
    const ordered = [
      ...FREE_BGS.filter((id) => allBackgroundIds.includes(id)),
      ...allBackgroundIds.filter((id) => !isFreeBg(id)),
    ];
    rebuildBackgroundGrid(ordered.length ? ordered : FREE_BGS.slice());
    selectBackground(sampleBackground());
    updateBonusLinks();
    showScreen(Screen.LIVE);
  }

  // Game keepsakes stay in this browser and use PF-prefixed codes that the
  // real booth's six-digit ticket system cannot redeem.
  function hasGameCode() {
    return /^PF-[A-HJ-NP-Z]{6}$/.test(String(localSessionCode || ""));
  }

  function prepareGameCode() {
    if (!hasGameCode()) localSessionCode = generateGameCode();
    const files = readGameFiles();
    if (!files.some((file) => file.code === localSessionCode)) {
      files.unshift({ code: localSessionCode, sessions: [], savedAt: new Date().toISOString() });
      if (!writeGameFiles(files)) {
        console.warn("Felix game code could not be saved yet; it will retry on the final screen.");
      }
    }
    return localSessionCode;
  }

  function setBonusUi(state, msg) {
    bonusState = state;
    const btn = document.getElementById("goBonusBtn");
    const retry = document.getElementById("retryBonusBtn");
    const status = document.getElementById("bonusStatus");
    const row = document.querySelector(".felix-bonus-row");
    const hide = state === "none" || !hasGameCode();
    if (status) status.textContent = hide ? "" : (msg || "");
    if (row) row.hidden = hide;
    if (btn) {
      const ready = state === "ready" && hasGameCode();
      btn.hidden = hide;
      btn.classList.toggle("is-disabled", !ready);
      btn.setAttribute("aria-disabled", String(!ready));
      btn.href = ready ? "bonus.html?code=" + encodeURIComponent(localSessionCode) : "#";
      btn.textContent = ready ? "OPEN GAME BONUS" : "SAVING GAME BONUS\u2026";
    }
    if (retry) retry.hidden = hide || state !== "failed";
  }

  async function makeBonusPack() {
    if (isTrySession) {
      setBonusUi("none", "");
      return;
    }
    if (bonusState === "working" || bonusState === "ready") {
      setBonusUi(bonusState, bonusState === "ready" ? "Bonus pack ready." : "Making your bonus pack\u2026");
      return;
    }
    // Show the game-only code before doing image work. Strip rendering can
    // take a moment on phones; the guest should still see the code if preview
    // composition is slow or fails.
    const code = prepareGameCode();
    if (sessionCodeDisplay) sessionCodeDisplay.textContent = code;
    adjustDigitalScreenForMode();
    paintDigitalQr();
    paintDigitalVipJoin();
    updateBonusLinks();
    setBonusUi("working", "Saving your game keepsake\u2026");
    try {
      const files = readGameFiles();
      let file = files.find((item) => item.code === code);
      if (!file) {
        file = { code, sessions: [], savedAt: new Date().toISOString() };
        files.unshift(file);
      }
      if (!Array.isArray(file.sessions)) file.sessions = [];
      const session = {
        id: bonusSessionKey,
        strip: "",
        bonus: "",
        bgId: currentBackground?.id || TRY_SAMPLE_ID,
        savedAt: new Date().toISOString(),
      };
      file.sessions.push(session);
      file.savedAt = new Date().toISOString();
      if (!writeGameFiles(files)) throw new Error("local game storage unavailable");
      if (!lastCompositeUrl) await buildStrip();
      session.strip = lastCompositeUrl;
      const recorded = await waitForSessionVideo(12000);
      const mediaId = code + "|" + bonusSessionKey;
      await saveGameMedia({
        id: mediaId,
        code,
        sessionId: bonusSessionKey,
        bgId: session.bgId,
        photos: capturedPhotos.slice(0, 4),
        video: recorded?.blob || null,
        videoMime: recorded?.mime || "",
        videoExt: recorded?.ext || "",
        savedAt: new Date().toISOString(),
      });
      session.mediaId = mediaId;
      session.savedAt = new Date().toISOString();
      file.savedAt = session.savedAt;
      if (!writeGameFiles(files)) throw new Error("local game storage unavailable");
      if (sessionCodeDisplay) sessionCodeDisplay.textContent = code;
      adjustDigitalScreenForMode();
      paintDigitalQr();
      paintDigitalVipJoin();
      updateBonusLinks();
      setBonusUi("ready", recorded?.blob
        ? "Game code " + code + " saved with your photos and session video in this browser. It cannot open a real booth session."
        : "Game code " + code + " and photos saved in this browser. Video capture was unavailable; it cannot open a real booth session.");
    } catch (err) {
      console.warn("Felix bonus", err);
      setBonusUi("failed", "Couldn't save the game keepsake. Keep this page open and try again.");
    }
  }

  function updateBonusLinks() {
    const code = localSessionCode || "";
    const showBonus = !isTrySession && hasGameCode();
    const url = showBonus
      ? "bonus.html?code=" + encodeURIComponent(code)
      : "#";
    if (bonusLink) {
      bonusLink.href = showBonus ? url : "#";
      bonusLink.hidden = !showBonus;
      bonusLink.setAttribute("aria-hidden", String(!showBonus));
      if (!showBonus) bonusLink.removeAttribute("target");
      else bonusLink.setAttribute("target", "_blank");
    }
    const bonusRow = document.getElementById("bonusLinkRow");
    if (bonusRow) bonusRow.hidden = !showBonus;
    if (bonusLinkDigital) {
      bonusLinkDigital.href = showBonus ? url : "#";
      bonusLinkDigital.hidden = !showBonus;
    }
  }

  function renderSessionCount() {
    const el = document.getElementById("sessionCountNote");
    if (!el) return;
    if (!sessionInfo || sessionInfo.total < 2) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent =
      "Game session " + sessionInfo.no + " of " + sessionInfo.total + " \u00b7 " +
      (sessionInfo.left > 0
        ? sessionInfo.left + (sessionInfo.left === 1 ? " game session" : " game sessions") + " left"
        : "last game session in this pack");
  }

  // ---- Session video (booth-style MediaRecorder) ----
  function pickRecMime() {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return "";
    for (const t of REC_MIME_CHAIN) {
      try { if (MediaRecorder.isTypeSupported(t)) return t; } catch (_) {}
    }
    return "";
  }
  function recExt(mime) {
    return /mp4/i.test(mime || "") ? "mp4" : "webm";
  }
  function drawRecFrame() {
    if (!rec || !rec.ctx) return;
    const w = liveVideo.videoWidth;
    const h = liveVideo.videoHeight;
    if (!w || !h || liveVideo.readyState < 2) return;
    bakeLiveFrame(rec.ctx, rec.canvas, liveVideo);
  }
  function startRecording(attempt) {
    try {
      if (isTrySession || rec || recPromise) return;
      if (!window.MediaRecorder || !videoStream) return;
      const w = liveVideo.videoWidth;
      const h = liveVideo.videoHeight;
      if (!w || !h) {
        if ((attempt || 0) < 15) setTimeout(() => startRecording((attempt || 0) + 1), 200);
        return;
      }
      const scale = Math.min(1, REC_LONG_SIDE / Math.max(w, h));
      const even = (n) => Math.max(2, Math.round(n / 2) * 2);
      const canvas = document.createElement("canvas");
      // Same swap as video_capture_patch.js: canvas is portrait (sensor h × w).
      const turn = w > h;
      canvas.width = even((turn ? h : w) * scale);
      canvas.height = even((turn ? w : h) * scale);
      const ctx = canvas.getContext("2d", { alpha: false });
      let stream = null;
      if (canvas.captureStream) stream = canvas.captureStream(REC_FPS);
      if (!stream) stream = videoStream; // fallback: raw camera, unmirrored
      const mime = pickRecMime();
      let recorder;
      try {
        recorder = new MediaRecorder(stream, Object.assign(mime ? { mimeType: mime } : {}, { videoBitsPerSecond: REC_BPS }));
      } catch (_) {
        recorder = new MediaRecorder(stream);
      }
      rec = { recorder, chunks: [], canvas, ctx, stream, drawTimer: null, stopTimer: null, mime };
      const mine = rec;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawRecFrame();
      rec.drawTimer = setInterval(drawRecFrame, Math.round(1000 / REC_FPS));
      recPromise = new Promise((resolve) => {
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) mine.chunks.push(ev.data);
        };
        recorder.onstop = () => {
          if (mine.drawTimer) clearInterval(mine.drawTimer);
          const type = recorder.mimeType || mine.mime || (mine.chunks[0] && mine.chunks[0].type) || "video/webm";
          const blob = new Blob(mine.chunks, { type });
          try { if (mine.stream !== videoStream) mine.stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
          const out = blob.size > 0 ? { blob, mime: type, ext: recExt(type) } : null;
          window.__felixSessionVideo = out ? { size: blob.size, mime: type, ext: out.ext } : { size: 0 };
          if (rec === mine) rec = null;
          resolve(out);
        };
        recorder.onerror = () => {
          try { recorder.stop(); } catch (_) {}
        };
      });
      recorder.start(1000);
      rec.stopTimer = setTimeout(() => stopRecording("timeout"), REC_MAX_MS);
      window.__felixSessionVideo = { recording: true, mime: recorder.mimeType || mime };
    } catch (err) {
      console.warn("Felix rec start failed", err);
      rec = null;
      recPromise = null;
    }
  }
  function stopRecording(reason) {
    if (!rec) return;
    try {
      if (rec.stopTimer) clearTimeout(rec.stopTimer);
      rec.stopTimer = null;
      if (rec.recorder.state !== "inactive") {
        try { rec.recorder.requestData(); } catch (_) {}
        rec.recorder.stop();
      }
    } catch (err) {
      console.warn("Felix rec stop", reason, err);
    }
  }
  function resetRecording() {
    if (rec) {
      const r = rec;
      rec = null;
      try { if (r.drawTimer) clearInterval(r.drawTimer); } catch (_) {}
      try { if (r.stopTimer) clearTimeout(r.stopTimer); } catch (_) {}
      try { if (r.recorder.state !== "inactive") r.recorder.stop(); } catch (_) {}
    }
    recPromise = null;
    window.__felixSessionVideo = null;
  }
  function waitForSessionVideo(maxMs) {
    if (!recPromise) return Promise.resolve(null);
    return Promise.race([recPromise, new Promise((r) => setTimeout(() => r(null), maxMs || 7000))]);
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
    // Soft cream silhouette only — no brand word (Try Mode no longer uses these
    // for empty slots; paid unused slots stay tidy).
    return c.toDataURL("image/jpeg", 0.92);
  }

  // Booth sensor is landscape (needs the −90° turn); a phone selfie cam is portrait.
  function camIsLandscape(video) {
    return (video.videoWidth || 0) > (video.videoHeight || 0);
  }
  function syncCamOrientation() {
    if (!liveVideo.videoWidth) return;
    liveVideo.classList.toggle("cam-portrait", !camIsLandscape(liveVideo));
  }

  function bakeLiveFrame(ctx, canvas, video) {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    // flow.js capturePhoto + video_capture_patch drawPortraitMirroredFrame
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (!camIsLandscape(video)) {
      // Phone front camera is already portrait: no −90° turn, mirror only.
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      return;
    }
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.scale(1, -1);
    ctx.drawImage(video, -canvas.height / 2, -canvas.width / 2, canvas.height, canvas.width);
    ctx.restore();
  }

  function attachStream(stream) {
    videoStream = stream;
    liveVideo.setAttribute("playsinline", "");
    liveVideo.setAttribute("webkit-playsinline", "");
    liveVideo.muted = true;
    liveVideo.playsInline = true;
    liveVideo.srcObject = stream;
    liveVideo.addEventListener("loadedmetadata", syncCamOrientation);
    liveVideo.addEventListener("resize", syncCamOrientation);
    try { screen.orientation?.lock?.("portrait"); } catch (_) {}
    return liveVideo.play().catch(() => {});
  }

  async function getUserMediaLoose() {
    if (!navigator.mediaDevices?.getUserMedia) {
      const err = new Error("mediaDevices.getUserMedia missing");
      err.name = "UnsupportedError";
      throw err;
    }
    const attempts = [
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
        if (!isTrySession && currentPoseIndex === 0) startRecording();
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
    stopRecording("camera-off");
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
    // Start the session video with the first pose (booth: LIVE up -> record).
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
    if (!isTrySession && currentPoseIndex === 0) startRecording();
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
      acceptPhotoDataUrl(makeSilhouetteDataUrl(FREEZE_PORTRAIT.w, FREEZE_PORTRAIT.h));
      return;
    }
    const ctx = captureCanvas.getContext("2d");
    // Rotate into portrait — same as magic_mirror_v1/static/js/flow.js
    const turn = w > h;
    captureCanvas.width = turn ? h : w;
    captureCanvas.height = turn ? w : h;
    bakeLiveFrame(ctx, captureCanvas, liveVideo);
    // Detect near-black frame
    try {
      const sample = ctx.getImageData(0, 0, Math.min(40, captureCanvas.width), Math.min(40, captureCanvas.height)).data;
      let sum = 0;
      for (let i = 0; i < sample.length; i += 4) sum += sample[i] + sample[i + 1] + sample[i + 2];
      const avg = sum / ((sample.length / 4) * 3);
      if (avg < 8) {
        acceptPhotoDataUrl(makeSilhouetteDataUrl(FREEZE_PORTRAIT.w, FREEZE_PORTRAIT.h));
        return;
      }
    } catch (_) {}
    acceptPhotoDataUrl(captureCanvas.toDataURL("image/jpeg", 0.9));
  }

  async function normalizeFreezePortrait(dataUrl) {
    const img = await loadImage(dataUrl);
    const fitted = coverCropToCanvas(img, FREEZE_PORTRAIT.w, FREEZE_PORTRAIT.h);
    return fitted.toDataURL("image/jpeg", 0.9);
  }

  function showFreezeFlash(dataUrl) {
    liveVideo.classList.add("hidden");
    const freeze = document.createElement("img");
    freeze.id = "freezeFrame";
    freeze.src = dataUrl;
    freeze.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:3;transform:scaleX(-1);";
    videoLayer.appendChild(freeze);
    videoLayer.classList.remove("hidden");
    hideNoCamera();
    setTimeout(() => {
      freeze.remove();
      liveVideo.classList.remove("hidden");
      afterCapture();
    }, 700);
  }

  function acceptPhotoDataUrl(dataUrl) {
    // Keep portraits consistent for this game's strip layout.
    Promise.resolve(normalizeFreezePortrait(dataUrl))
      .then((portrait) => {
        capturedPhotos[currentPoseIndex] = portrait;
        updateTemplateSlots();
        showFreezeFlash(portrait);
      })
      .catch(() => {
        capturedPhotos[currentPoseIndex] = dataUrl;
        updateTemplateSlots();
        showFreezeFlash(dataUrl);
      });
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
        stopRecording("session-complete");
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
    if (currentScreen === Screen.REVIEW || currentScreen === Screen.PRINT || currentScreen === Screen.DIGITAL) {
      buildStrip().catch(() => {});
    }
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

  async function loadSessionPhotos() {
    // Always fill all 4 locked strip windows. In Try Mode (2 poses) repeat the
    // captured photos so the sample strip looks complete — no Instapic placeholders.
    const photoSrcs = [];
    const cream = () => makeSilhouetteDataUrl(FREEZE_PORTRAIT.w, FREEZE_PORTRAIT.h);
    for (let i = 0; i < 4; i++) {
      if (isTrySession) {
        const cycle = Math.max(totalPoses, 1);
        const src = capturedPhotos[i % cycle] || capturedPhotos[0] || cream();
        photoSrcs.push(src);
      } else if (i < totalPoses) {
        photoSrcs.push(capturedPhotos[i] || cream());
      } else {
        photoSrcs.push(cream());
      }
    }
    return Promise.all(photoSrcs.map((src) => loadImage(src)));
  }

  // Guest-facing strip preview for the game mock.
  async function buildStrip() {
    const bgId = currentBackground?.id || TRY_SAMPLE_ID;
    const bg = await loadImage(currentBackground?.src || bgFull(bgId));
    const photos = await loadSessionPhotos();
    const out = document.createElement("canvas");
    out.width = bg.width;
    out.height = bg.height;
    const ctx = out.getContext("2d");
    ctx.drawImage(bg, 0, 0);

    const boxes = slotsForStripSize(out.width, out.height);
    slotBoxes = boxes;
    slotRef = { w: out.width, h: out.height };
    for (let i = 0; i < 4; i++) {
      const photo = photos[i];
      if (!photo) continue;
      const box = boxes[i];
      const fitted = coverCropToCanvas(photo, box.w, box.h);
      ctx.drawImage(fitted, box.x, box.y);
    }

    if (isTrySession) stampSample(ctx, out.width, out.height);
    lastCompositeUrl = out.toDataURL("image/jpeg", 0.92);
    applyCompositeToPreviews();
    return lastCompositeUrl;
  }

  function applyCompositeToPreviews() {
    if (!lastCompositeUrl) return;
    if (finalStripPreview) finalStripPreview.src = lastCompositeUrl;
    if (digitalStripPreview) digitalStripPreview.src = lastCompositeUrl;
    if (reviewStripPreview) reviewStripPreview.src = lastCompositeUrl;
  }

  function adjustPrintScreenForMode() {
    const screen = document.querySelector('[data-screen="PRINT"]');
    const title = screen?.querySelector(".title-main");
    const subtitle = screen?.querySelector(".subtitle");
    const saveRow = screen?.querySelector(".felix-save-row");
    const bonusRow = document.getElementById("bonusLinkRow");
    if (printBtn) {
      printBtn.style.display = "";
      printBtn.classList.remove("hidden");
      printBtn.textContent = isTrySession ? "EXIT TRY MODE" : "CONTINUE";
    }
    if (saveRow) saveRow.hidden = isTrySession;
    if (bonusRow) bonusRow.hidden = isTrySession;
    if (isTrySession) {
      if (title) title.textContent = "Sample Preview";
      if (subtitle) subtitle.textContent = "Two-photo sample. This preview closes in a few seconds.";
      if (printPreviewNote) printPreviewNote.hidden = true;
    } else if (!hasGameCode()) {
      if (title) title.textContent = "Your Penny Fever Strip";
      if (subtitle) subtitle.textContent = "Finish your Penny Fever game session to create a game-only code and keepsake.";
      if (printPreviewNote) printPreviewNote.hidden = true;
    } else {
      if (title) title.textContent = "Your Penny Fever Strip";
      if (subtitle) subtitle.textContent = "Save, share, or open your game bonus.";
      if (printPreviewNote) printPreviewNote.hidden = false;
    }
    updateBonusLinks();
  }

  function sessionCodeNow() {
    return /^PF-[A-HJ-NP-Z]{6}$/.test(String(localSessionCode || "")) ? localSessionCode : "";
  }

  function paintDigitalQr() {
    const placeholder = document.getElementById("qrPlaceholder");
    const code = sessionCodeNow();
    if (sessionCodeDisplay) sessionCodeDisplay.textContent = code || "————";
    if (!placeholder) return;
    placeholder.hidden = false;
    placeholder.classList.add("has-qr");
    let img = placeholder.querySelector("img");
    if (!img) {
      img = document.createElement("img");
      img.className = "qr-image-instapic instapic-digital-qr";
      placeholder.prepend(img);
    }
    img.hidden = false;
    img.src = "img/instapic_logo.jpg";
    img.alt = "Penny Fever game keepsake";
    let hint = placeholder.querySelector(".qr-hint-instapic");
    if (!hint) {
      hint = document.createElement("div");
      hint.className = "qr-hint-instapic";
      placeholder.appendChild(hint);
    }
    hint.textContent = code
      ? "This game code is stored in Penny Fever Game VIP on this browser."
      : "Your Penny Fever game code is being saved.";
  }

  function paintDigitalVipJoin() {
    const a = document.getElementById("felixVipJoin");
    if (!a) return;
    const code = sessionCodeNow();
    a.href = code
      ? "penny-fever-game-vip.html?code=" + encodeURIComponent(code)
      : "penny-fever-game-vip.html";
    a.textContent = code ? "OPEN GAME VIP · " + code : "OPEN PENNY FEVER GAME VIP";
  }

  function adjustDigitalScreenForMode() {
    const coded = hasGameCode();
    const screen = document.querySelector('[data-screen="DIGITAL"]');
    const title = screen?.querySelector(".title-main");
    const subtitle = screen?.querySelector(":scope > .screen-content > .subtitle");
    const codeGroup = screen?.querySelector(".digital-code-group");
    const qrGroup = screen?.querySelector(".digital-qr-group");
    if (title) title.textContent = coded ? "Your Penny Fever Game Code" : "Saving Your Game Keepsake";
    if (subtitle) {
      subtitle.textContent = coded
        ? "This PF code opens your game bonus in Penny Fever Game VIP. It cannot unlock a real booth session."
        : "Your game-only code and strip are being saved in this browser.";
    }
    if (codeGroup) codeGroup.hidden = false;
    if (qrGroup) qrGroup.hidden = false;
    paintDigitalQr();
    paintDigitalVipJoin();
    if (!coded) setBonusUi("none", "");
  }

  function startPrintTimer() {
    stopPrintTimer();
    if (isTrySession) {
      printTimer = setTimeout(() => {
        if (currentScreen === Screen.PRINT && isTrySession) finishTrySession();
      }, TRY_PREVIEW_MS);
    }
  }
  function stopPrintTimer() {
    if (printTimer) clearTimeout(printTimer);
    printTimer = null;
  }

  function finishTrySession() {
    if (!isTrySession) return;
    stopPrintTimer();
    isTrySession = false;
    hasCommitted = false;
    totalPoses = 4;
    sessionInfo = null;
    localSessionCode = "";
    bonusState = "idle";
    resetPhotoState();
    showScreen(Screen.PAYMENT);
  }

  function goToAfterReview() {
    if (isTrySession) {
      showScreen(Screen.PRINT);
      return;
    }
    showScreen(Screen.DIGITAL);
  }

  function startReviewIdleTimer() {
    stopReviewIdleTimer();
    reviewIdleTimer = setTimeout(() => {
      if (currentScreen === Screen.REVIEW) goToAfterReview();
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

  function leftoverCredits() {
    return getCredits();
  }

  function startNextLeftoverSession() {
    refreshWalletUi();
    if (!spendLocalSession()) {
      setPayBanner("No game photo sessions yet. Earn Penny Fever pennies to get a session.");
      return Promise.resolve(false);
    }
    const left = getLocalSessions();
    setPayBanner("Game session started." + (left > 0 ? " " + left + " session" + (left === 1 ? "" : "s") + " left." : ""));
    startPaidSession(localSessionCode || requestedGameCode, { no: 1, total: left + 1, left, source: "game-pennies" });
    return Promise.resolve(true);
  }

  function paintThankyou() {
    const left = leftoverCredits();
    const copy = document.getElementById("thankyouCopy");
    const row = document.getElementById("thankyouNextRow");
    if (row) row.hidden = left < 1;
    const nextBtn = document.querySelector('[data-action="thankyou-next"]');
    if (nextBtn) {
      nextBtn.textContent =
        left === 1 ? "START LAST SESSION" : "START NEXT SESSION · " + left + " LEFT";
    }
    if (copy) {
      copy.innerHTML =
        left > 0
          ? "Save your strip if you want it.<br>" +
            left +
            (left === 1 ? " photo session left" : " photo sessions left") +
            " on this pack. Next one in <span id=\"thankyouCountdown\">8</span> seconds."
          : "Save your strip if you want it.<br>Returning to Felix in <span id=\"thankyouCountdown\">8</span> seconds.";
    }
  }

  function leaveThankyou() {
    stopThankyouTimer();
    if (leftoverCredits() >= 1) {
      refreshWalletUi();
      const n = leftoverCredits();
      setPayBanner(
        n +
          (n === 1 ? " photo session left" : " photo sessions left") +
          " — tap " +
          (n === 1 ? "1 SESSION LEFT" : n + " SESSIONS LEFT") +
          " to keep going."
      );
      return showScreen(Screen.PAYMENT);
    }
    return showScreen(Screen.ATTRACT);
  }

  function startThankyouTimer() {
    paintThankyou();
    let remaining = 8;
    const tickEl = () => document.getElementById("thankyouCountdown");
    if (tickEl()) tickEl().textContent = remaining;
    if (thankyouTimer) clearInterval(thankyouTimer);
    thankyouTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(thankyouTimer);
        thankyouTimer = null;
        leaveThankyou();
      } else if (tickEl()) {
        tickEl().textContent = remaining;
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
          title: "My Penny Fever strip",
          text: "My Penny Fever photo strip",
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
    if (name === Screen.PAYMENT || name === Screen.BACKGROUNDS) refreshWalletUi();
    if (name !== Screen.BACKGROUNDS) hideUnlockConfirm();
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
      startReviewIdleTimer();
    } else {
      stopReviewIdleTimer();
    }
    if (name === Screen.PRINT) {
      buildStrip().then(applyCompositeToPreviews).catch(() => {});
      adjustPrintScreenForMode();
      startPrintTimer();
      updateBonusLinks();
    } else {
      stopPrintTimer();
    }
    if (name === Screen.DIGITAL) {
      const displayCode = isTrySession ? "" : prepareGameCode();
      if (sessionCodeDisplay) sessionCodeDisplay.textContent = displayCode || "————";
      renderSessionCount();
      adjustDigitalScreenForMode();
      buildStrip().then(applyCompositeToPreviews).catch(() => applyCompositeToPreviews());
      makeBonusPack();
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
        const letter = btn.dataset.key;
        if (letter) {
          if (prepaidInput.value.length >= 9) return;
          prepaidInput.value += letter;
          return;
        }
        if (btn.dataset.action === "clear") prepaidInput.value = "PF-";
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


  function hidePennyConfirm() {
    pendingPennyPack = null;
    const box = document.getElementById("felix-penny-confirm");
    if (box) box.hidden = true;
  }
  function showPennyConfirm(pack) {
    pendingPennyPack = pack;
    const box = document.getElementById("felix-penny-confirm");
    const text = document.getElementById("felix-penny-confirm-text");
    if (text) {
      text.textContent =
        "Spend " + pack.pennies + " pennies for " + pack.sessions +
        " game photo sessions (" + pack.label + ")? This only spends Penny Fever game pennies.";
    }
    if (box) box.hidden = false;
  }
  function buyPortalWithPennies(pack) {
    if (!pack) return;
    if (getPennies() < pack.pennies) {
      setPayBanner("Not enough game pennies. Earn more in Penny Fever.");
      hidePennyConfirm();
      return;
    }
    if (!spendPennies(pack.pennies)) {
      setPayBanner("Could not spend pennies.");
      return;
    }
    addLocalSessions(pack.sessions);
    hidePennyConfirm();
    refreshWalletUi();
    setPayBanner(
      pack.pennies + " game pennies → " + pack.sessions + " game photo sessions."
    );
    if (!spendLocalSession()) {
      setPayBanner("Sessions saved — tap USE MY PHOTO SESSION.");
      return;
    }
    refreshWalletUi();
    startPaidSession("", { no: 1, total: pack.sessions, left: pack.sessions - 1, source: "pennies" });
  }

  function onFelixStartPaid() {
    refreshWalletUi();
    if (getCredits() < 1) {
      setPayBanner("No game sessions yet. Earn Penny Fever pennies to get a session.");
      return showScreen(Screen.PAYMENT);
    }
    startNextLeftoverSession();
  }

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
      if (prepaidInput) prepaidInput.value = "PF-";
      if (prepaidError) prepaidError.textContent = "";
      return showScreen(Screen.PREPAID);
    }
    if (action === "enter-paynow") return showScreen(Screen.PRIVATE_EVENT);
    if (action === "payment-exit" || action === "pay-cancel") return showScreen(Screen.ATTRACT);
    if (action === "event-paid") {
      setPayBanner("Private event purchases are not part of this game mock.");
      return showScreen(Screen.PAYMENT);
    }
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
    if (action === "pay-credit") {
      setPayBanner("Checking your photo sessions\u2026");
      startNextLeftoverSession();
      return;
    }
    if (action === "unlock-confirm-yes") {
      confirmUnlockBackground();
      return;
    }
    if (action === "unlock-confirm-no") {
      hideUnlockConfirm();
      return;
    }
    if (action === "penny-confirm-yes") {
      const pack = pendingPennyPack;
      hidePennyConfirm();
      if (pack) buyPortalWithPennies(pack);
      return;
    }
    if (action === "penny-confirm-no") {
      hidePennyConfirm();
      setPayBanner("");
      return;
    }
    if (action === "top-up-aura") {
      setPayBanner("This game mock cannot open the real payment till. Earn game pennies in Penny Fever.");
      return;
    }
    if (
      action === "square-p2" ||
      action === "square-p4" ||
      action === "square-p6" ||
      action === "pay-p2" ||
      action === "pay-p4" ||
      action === "pay-p6"
    ) {
      // Circles only spend in-game pennies in this mock.
      const pack =
        PORTAL_PACKS[action] ||
        Object.values(PORTAL_PACKS).find((p) => p.pkg === (btn && btn.dataset && btn.dataset.pkg)) ||
        null;
      if (!pack) {
        setPayBanner("This game mock does not open the real payment till.");
        return;
      }
      refreshWalletUi();
      if (getPennies() >= pack.pennies) {
        showPennyConfirm(pack);
        setPayBanner("Confirm spending " + pack.pennies + " pennies for " + pack.sessions + " sessions.");
        return;
      }
      setPayBanner("Need " + pack.pennies + " game pennies (you have " + getPennies() + "). Earn more in Penny Fever.");
      return;
    }
    if (action === "cashin-p2" || action === "cashin-p4" || action === "cashin-p6") {
      if (cashinInput) cashinInput.value = "";
      if (cashinError) cashinError.textContent = "";
      if (cashinSubtitle) cashinSubtitle.textContent = "Enter a PF game code to open its game bonus. Real Instapic codes are never checked here.";
      return showScreen(Screen.CASHIN);
    }
    if (action === "cashin-back") return showScreen(Screen.PAYMENT);
    if (action === "cashin-continue" || action === "prepaid-continue") {
      const input = action === "cashin-continue" ? cashinInput : prepaidInput;
      const errEl = action === "cashin-continue" ? cashinError : prepaidError;
      const raw = String(input?.value || "").trim().toUpperCase();
      const code = /^PF-[A-HJ-NP-Z]{6}$/.test(raw) ? raw : "";
      if (!code) {
        if (errEl) errEl.textContent = "Enter PF- followed by six letters.";
        return;
      }
      if (!findGameFile(code)) {
        if (errEl) errEl.textContent = "No game bonus with that code is saved in this browser. Real Instapic codes are not checked.";
        return;
      }
      location.href = "bonus.html?code=" + encodeURIComponent(code);
      return;
    }

    if (action === "prepaid-back" || action === "prepaid-exit") return showScreen(Screen.PAYMENT);
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
      acceptPhotoDataUrl(makeSilhouetteDataUrl(FREEZE_PORTRAIT.w, FREEZE_PORTRAIT.h));
      return;
    }
    if (action === "retake-photo") {
      if (totalRetakesUsed >= MAX_RETAKES_PER_SESSION) return goToAfterReview();
      totalRetakesUsed += 1;
      capturedPhotos[selectedSlotIndex] = null;
      currentPoseIndex = selectedSlotIndex;
      return showScreen(Screen.LIVE);
    }
    if (action === "keep-photo") return goToAfterReview();
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
        return finishTrySession();
      }
      return showScreen(Screen.DIGITAL);
    }
    if (action === "digital-done") return showScreen(Screen.THANKYOU);
    if (action === "thankyou-next") {
      stopThankyouTimer();
      refreshWalletUi();
      if (leftoverCredits() < 1) return showScreen(Screen.PAYMENT);
      setPayBanner("Starting your next session\u2026");
      startNextLeftoverSession().then((ok) => {
        if (!ok) showScreen(Screen.PAYMENT);
      });
      return;
    }
    if (action === "retry-bonus") {
      bonusState = "idle";
      makeBonusPack();
      return;
    }
    if (action === "error-retry") return showScreen(Screen.PAYMENT);
    if (action === "error-to-attract") return showScreen(Screen.ATTRACT);
  });

  window.addEventListener("pagehide", stopCamera);
  refreshWalletUi();
  showScreen(Screen.ATTRACT);
})();
