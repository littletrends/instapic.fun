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
  // Guests SEE the Set single strip (bg_N_strip_web). Dual print art stays in
  // backgrounds/bg_N.jpg only for MotherPC upload parity with the real booth.
  function bgThumb(id) { return "backgrounds/strips/thumbs/" + id + ".jpg"; }
  function bgFull(id) { return "backgrounds/strips/" + id + ".jpg"; }
  function bgDualPrint(id) { return "backgrounds/" + id + ".jpg"; }
  const TRY_SAMPLE_ID = "bg_11";
  // MotherPC bonus_pipeline STRIP_SLOTS left column on 784×1186 design grid.
  const STRIP_SLOTS_LEFT = [
    [100, 18, 208, 252],
    [100, 272, 208, 256],
    [100, 624, 208, 260],
    [100, 888, 208, 272],
  ];
  const SLOT_REF = { w: 416, h: 1232 }; // left half of current 832×1232 dual
  const FREEZE_PORTRAIT = { w: 1024, h: 1280 };
  const LIVE_AUTOSTART_MS = 400;
  const MAX_RETAKES_PER_SESSION = 2;
  // MotherPC (existing Instapic backend, via its Tailscale Funnel). Felix only
  // CALLS existing endpoints: redeem-ticket, commit-used, create-ticket,
  // receive-assets. Real money is taken at Aura's booth (world/ticket-till.js).
  const API_BASE = "https://motherpc.taild1a44c.ts.net";
  const PHOTO_CODES_KEY = "pf-photo-codes"; // shared with Aura's till
  // Legacy Payment Links — no longer used by Felix (kept for reference only).
  const SQUARE_LINKS = {
    P2: { url: "https://square.link/u/1XR6t22j", credits: 2, label: "$5 · 10 pennies · 2 sessions" },
    P4: { url: "https://square.link/u/mJbnOorC", credits: 4, label: "$8 · 16 pennies · 4 sessions" },
    P6: { url: "https://square.link/u/9idvZ3go", credits: 6, label: "$10 · 20 pennies · 6 sessions" },
  };
  const PRICE = {
    sessionTickets: 1,
    unlockPennies: 2,
    unlockTickets: 1,
  };
  // Portal circles = penny purchase. Short purse → Aura penny top-up (PF_ROLL), not Square photo.
  // Square photo packs use Felix-only MotherPC ids (FELIX_*), 500/800/1000¢.
  const PORTAL_PACKS = {
    "pay-p2": { pkg: "FELIX_P1_STRIP", pennies: 10, sessions: 2, dollars: "$5", label: "Quick & Simple" },
    "pay-p4": { pkg: "FELIX_P2_STRIP_GIF", pennies: 16, sessions: 4, dollars: "$8", label: "Most Popular" },
    "pay-p6": { pkg: "FELIX_P3_STRIP_GIF", pennies: 20, sessions: 6, dollars: "$10", label: "Best for Groups" },
  };
  const PENNY_TOPUP_PACK = "PF_ROLL"; // Aura's $5 · 10 pennies
  let pendingPennyPack = null;
  const CASHIN_CREDITS = { p2: 2, p4: 4, p6: 6 };
  // Lorie (05/11/2026): $7 = 2 Felix sessions, $13 = 4, $18 = 6. Keyed by the
  // Instapic package_id MotherPC stores on the code (WEBSITE_PACKAGES).
  const SESSIONS_BY_PKG = {
    FELIX_P1_STRIP: 2,
    FELIX_P2_STRIP_GIF: 4,
    FELIX_P3_STRIP_GIF: 6,
    // Fallback if an old deep-link still sends website/real-booth ids.
    P1_STRIP: 2,
    P2_STRIP_GIF: 4,
    P3_STRIP_GIF: 6,
  };
  // Booth-style session video (same contract as the Magic Mirror
  // video_capture_patch.js: one continuous upright clip, field "video",
  // file session_video.mp4|webm, max 40 s). Phone-friendly size.
  const REC_MAX_MS = 40000;
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
  // Default = MotherPC slots for 416×1232 strip_web (left half of 832 dual).
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
  let localSessionCode = "";
  // Real Instapic code for this session once MotherPC has approved it.
  let serverCode = "";
  let bonusState = "idle"; // idle | working | ready | failed
  let bonusSessionKey = "";
  let pendingCashinPkg = "p2";
  // { no, total, left } for multi-session codes ($5/$8/$10 packages).
  let sessionInfo = null;
  let rec = null; // active MediaRecorder state
  let recPromise = null; // resolves to { blob, mime, ext } | null for this session
  let unlockedBgs = loadUnlocks();

  function fitStage() {
    if (!boothStage) return;
    // Portrait phones are taller than the 1080×1920 kiosk aspect, so min-fit
    // left big black bars and bunched UI. Fill width, grow design height so
    // after scale the stage covers the whole viewport (no empty margins).
    const vw = Math.max(1, window.innerWidth || 390);
    const vh = Math.max(1, window.innerHeight || 844);
    const scale = vw / 1080;
    const designH = Math.max(1920, Math.ceil(vh / scale));
    boothStage.style.width = "1080px";
    boothStage.style.height = designH + "px";
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
  function photoCodes() {
    try {
      const list = JSON.parse(localStorage.getItem(PHOTO_CODES_KEY) || "[]");
      return Array.isArray(list) ? list.filter((r) => r && /^\d{6}$/.test(String(r.code))) : [];
    } catch (_) {
      return [];
    }
  }
  function savePhotoCodes(list) {
    try { localStorage.setItem(PHOTO_CODES_KEY, JSON.stringify(list)); } catch (_) {}
  }
  // Booth credits = Square-approved Instapic codes bought at Aura's booth.
  function sessionsForPkg(pkg) {
    return SESSIONS_BY_PKG[String(pkg || "").toUpperCase()] || 1;
  }
  function codeTotal(r) {
    const n = Number(r && r.total);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : sessionsForPkg(r && r.pkg);
  }
  function codeLeft(r) {
    const n = Number(r && r.left);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : codeTotal(r);
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
    return photoCodes().reduce((sum, r) => sum + codeLeft(r), 0) + getLocalSessions();
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
  async function api(path, body) {
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }
  // Server check: only an ISSUED Instapic code becomes a session.
  async function redeemCode(code) {
    const { res, data } = await api("/api/redeem-ticket", { ticket_code: code });
    if (res.ok && data.ok) return { ok: true, ticket: data.ticket || {} };
    if (res.status === 409) return { ok: false, used: true, status: data.status || "" };
    if (res.status === 404) return { ok: false, missing: true };
    return { ok: false, error: data.error || "HTTP " + res.status };
  }
  // One Instapic code = N Felix sessions (2/4/6 by package). MotherPC's
  // redeem-ticket is single-shot (ISSUED -> REDEEMED), so the first session
  // redeems on the server and later sessions on the same code run from this
  // wallet record; commit-used / receive-assets accept a USED code again.
  async function useCreditCode(onlyCode) {
    const list = photoCodes();
    const idx = onlyCode ? list.findIndex((r) => String(r.code) === String(onlyCode)) : list.findIndex((r) => codeLeft(r) > 0);
    const rec = list[idx];
    if (!rec || codeLeft(rec) < 1) return { ok: false, error: "none" };
    let check;
    try {
      check = await redeemCode(rec.code);
    } catch (_) {
      return { ok: false, error: "offline" };
    }
    const status = check.status || "";
    const okFirst = check.ok;
    // Already redeemed by this wallet (earlier session) or an interrupted first run.
    const okAgain = check.used && (status === "REDEEMED" || (rec.redeemed && status === "USED"));
    if (okFirst || okAgain) {
      if (okFirst && check.ticket && check.ticket.package_id) rec.pkg = String(check.ticket.package_id);
      const total = codeTotal(rec);
      const left = codeLeft(rec);
      rec.total = total;
      rec.left = left - 1;
      rec.redeemed = true;
      const rest = list.filter((_, i) => i !== idx);
      savePhotoCodes(rec.left > 0 ? [rec, ...rest] : rest);
      return { ok: true, code: rec.code, info: { no: total - left + 1, total, left: rec.left } };
    }
    if (check.used || check.missing) savePhotoCodes(list.filter((_, i) => i !== idx));
    return { ok: false, error: check.used ? "used" : check.missing ? "missing" : check.error };
  }
  // A code typed in by hand: first redeem decides how many sessions it holds.
  function rememberTypedCode(code, ticket) {
    const pkg = String((ticket && ticket.package_id) || "");
    const total = sessionsForPkg(pkg);
    const info = { no: 1, total, left: total - 1 };
    if (info.left > 0) {
      const list = photoCodes().filter((r) => String(r.code) !== String(code));
      list.unshift({ code, pkg, total, left: info.left, redeemed: true, source: "typed", ts: Date.now() });
      savePhotoCodes(list);
    }
    return info;
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
    if (payCreditBtn) {
      payCreditBtn.hidden = credits < 1;
      payCreditBtn.textContent =
        credits < 1
          ? "USE MY PHOTO SESSION"
          : credits === 1
            ? "1 SESSION LEFT"
            : credits + " SESSIONS LEFT";
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
    serverCode = code && /^\d{6}$/.test(code) ? code : "";
    localSessionCode = serverCode;
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
    serverCode = "";
    bonusState = "idle";
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

  // ---- Bonus pack: hand the session to MotherPC's existing pipeline ----
  // Same path the Magic Mirror kiosks use: commit-used -> receive-assets with
  // freeze_1..4.jpg (+ dual print strip). Display uses Set bg_N_strip_web;
  // MotherPC still keys the bonus pack off bg_id bg_N → Set_N.
  function hasInstapicCode() {
    return /^\d{6}$/.test(String(serverCode || localSessionCode || ""));
  }

  function setBonusUi(state, msg) {
    bonusState = state;
    const btn = document.getElementById("goBonusBtn");
    const retry = document.getElementById("retryBonusBtn");
    const status = document.getElementById("bonusStatus");
    const row = document.querySelector(".felix-bonus-row");
    const hide = state === "none" || !hasInstapicCode();
    if (status) status.textContent = hide ? "" : (msg || "");
    if (row) row.hidden = hide;
    if (btn) {
      const ready = state === "ready" && hasInstapicCode();
      btn.hidden = hide;
      btn.classList.toggle("is-disabled", !ready);
      btn.setAttribute("aria-disabled", String(!ready));
      btn.href = ready ? "https://instapic.fun/bonus.html?code=" + encodeURIComponent(serverCode) : "#";
      btn.textContent = ready ? "GO TO MY BONUS" : "MAKING YOUR BONUS\u2026";
    }
    if (retry) retry.hidden = hide || state !== "failed";
  }

  function dataUrlToBlob(dataUrl) {
    return fetch(dataUrl).then((r) => r.blob());
  }

  async function freezeBlob(i) {
    const src = capturedPhotos[i] || makeSilhouetteDataUrl(FREEZE_PORTRAIT.w, FREEZE_PORTRAIT.h);
    const img = await loadImage(src);
    const c = document.createElement("canvas");
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    c.getContext("2d").drawImage(img, 0, 0);
    return new Promise((resolve) => c.toBlob(resolve, "image/jpeg", 0.92));
  }

  async function makeBonusPack() {
    if (isTrySession || !hasInstapicCode()) {
      setBonusUi("none", "");
      return;
    }
    if (bonusState === "working" || bonusState === "ready") {
      setBonusUi(bonusState, bonusState === "ready" ? "Bonus pack ready." : "Making your bonus pack\u2026");
      return;
    }
    setBonusUi("working", "Making your bonus pack\u2026");
    try {
      const bgId = currentBackground?.id || TRY_SAMPLE_ID;
      const commit = await api("/api/commit-used", { ticket_code: serverCode, bg_id: bgId });
      if (!commit.res.ok || !commit.data.ok) throw new Error("commit " + (commit.data.error || commit.res.status));
      if (!lastCompositeUrl) await buildStrip();
      // Real booth uploads the dual print strip (booth_print_strip.jpg). Match that
      // contract; guests still only see the single strip_web composite on screen.
      const dualUrl = await buildDualStripForUpload();
      const form = new FormData();
      form.append("ticket_code", serverCode);
      form.append("bg_id", bgId);
      form.append("booth_id", "FELIX");
      for (let i = 0; i < 4; i++) {
        const blob = await freezeBlob(i);
        if (blob) form.append("freeze_" + (i + 1), blob, "freeze_" + (i + 1) + ".jpg");
      }
      if (dualUrl) {
        const dualBlob = await dataUrlToBlob(dualUrl);
        form.append("strip", dualBlob, "felix_strip.jpg");
        form.append("booth_print_strip.jpg", dualBlob, "booth_print_strip.jpg");
      }
      // Booth contract: MotherPC builds collage / GIF / boomerang from
      // assets/video/session_video.(mp4|webm).
      stopRecording("pre-upload");
      const vid = await waitForSessionVideo(7000);
      if (vid && vid.blob && vid.blob.size > 1000) {
        form.append("video", vid.blob, "session_video." + vid.ext);
      }
      const up = await fetch(API_BASE + "/api/receive-assets", { method: "POST", body: form });
      const upData = await up.json().catch(() => ({}));
      if (!up.ok || !upData.ok) throw new Error("upload " + (upData.error || up.status));
      if (sessionCodeDisplay) sessionCodeDisplay.textContent = serverCode;
      setBonusUi("ready", "Bonus pack ready. Your code is " + serverCode + "." + sessionNoteSuffix());
    } catch (err) {
      console.warn("Felix bonus", err);
      setBonusUi("failed", "Couldn't make the bonus pack just now. Your strip is safe \u2014 tap Try again.");
    }
  }

  function updateBonusLinks() {
    const code = localSessionCode || "";
    const showBonus = !isTrySession && hasInstapicCode();
    const url = showBonus
      ? "https://instapic.fun/bonus.html?code=" + encodeURIComponent(code)
      : "https://instapic.fun/bonus.html";
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

  function sessionNoteSuffix() {
    if (!sessionInfo || sessionInfo.total < 2) return "";
    return " Your bonus page shows your latest session \u2014 save each strip.";
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
      "Session " + sessionInfo.no + " of " + sessionInfo.total + " \u00b7 " +
      (sessionInfo.left > 0
        ? sessionInfo.left + (sessionInfo.left === 1 ? " session" : " sessions") + " left on this code"
        : "last session on this code");
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
    const c = rec.canvas;
    const ctx = rec.ctx;
    ctx.save();
    if (rec.portrait) {
      // Mirrored like the freezes (capturePhoto).
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(liveVideo, 0, 0, c.width, c.height);
    } else {
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.scale(1, -1);
      ctx.drawImage(liveVideo, -c.height / 2, -c.width / 2, c.height, c.width);
    }
    ctx.restore();
  }
  function startRecording(attempt) {
    try {
      if (isTrySession || !serverCode || rec || recPromise) return;
      if (!window.MediaRecorder || !videoStream) return;
      const w = liveVideo.videoWidth;
      const h = liveVideo.videoHeight;
      if (!w || !h) {
        if ((attempt || 0) < 15) setTimeout(() => startRecording((attempt || 0) + 1), 200);
        return;
      }
      const portrait = h >= w;
      const scale = Math.min(1, REC_LONG_SIDE / Math.max(w, h));
      const even = (n) => Math.max(2, Math.round(n / 2) * 2);
      const canvas = document.createElement("canvas");
      // Upright portrait pixels, as the booth bakes them.
      canvas.width = even((portrait ? w : h) * scale);
      canvas.height = even((portrait ? h : w) * scale);
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
      rec = { recorder, chunks: [], canvas, ctx, portrait, stream, drawTimer: null, stopTimer: null, mime };
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
    if (cameraAvailable && capturedPhotos.filter(Boolean).length === 0) startRecording();
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
      acceptPhotoDataUrl(makeSilhouetteDataUrl(FREEZE_PORTRAIT.w, FREEZE_PORTRAIT.h));
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

  function acceptPhotoDataUrl(dataUrl) {
    // Booth freezes are portrait 1024×1280; cover-crop to match MotherPC inputs.
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

  // Guest-facing composite: left half of dual (same as MotherPC strip_web.jpg).
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

  // MotherPC / real-booth contract: dual 832×1232 print strip (static/backgrounds
  // bg_N.jpg == Set bg_N_strip). Uploaded as the strip asset; bonus still keyed by bg_id.
  async function buildDualStripForUpload() {
    const bgId = currentBackground?.id || TRY_SAMPLE_ID;
    const bg = await loadImage(bgDualPrint(bgId));
    const photos = await loadSessionPhotos();
    const out = document.createElement("canvas");
    out.width = bg.width;
    out.height = bg.height;
    const ctx = out.getContext("2d");
    ctx.drawImage(bg, 0, 0);
    // Same as bonus_pipeline._scale_strip_geometry on the dual master.
    const sx = out.width / 784;
    const sy = out.height / 1186;
    const leftDesign = STRIP_SLOTS_LEFT;
    const rightDesign = STRIP_SLOTS_LEFT.map(([x, y, w, h]) => [x + 399, y, w, h]);
    const all = leftDesign.concat(rightDesign);
    const cycle = photos.concat(photos);
    for (let i = 0; i < 8; i++) {
      const photo = cycle[i];
      if (!photo) continue;
      const [x, y, w, h] = all[i];
      const box = {
        x: Math.round(x * sx),
        y: Math.round(y * sy),
        w: Math.max(1, Math.round(w * sx)),
        h: Math.max(1, Math.round(h * sy)),
      };
      const fitted = coverCropToCanvas(photo, box.w, box.h);
      ctx.drawImage(fitted, box.x, box.y);
    }
    if (isTrySession) stampSample(ctx, out.width, out.height);
    return out.toDataURL("image/jpeg", 0.92);
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
      if (subtitle) subtitle.textContent = "Try strip — " + totalPoses + " poses (repeated to fill the strip). Save or share below.";
      if (printPreviewNote) printPreviewNote.hidden = true;
    } else if (!hasInstapicCode()) {
      if (title) title.textContent = "Your Photo Strip";
      if (subtitle) subtitle.textContent = "Save or share your strip. An Instapic bonus page comes with Square photo sessions.";
      if (printPreviewNote) printPreviewNote.hidden = true;
    } else {
      if (title) title.textContent = "Your Photo Strip";
      if (subtitle) subtitle.textContent = "Save, share, or open the Instapic bonus page.";
      if (printPreviewNote) printPreviewNote.hidden = false;
    }
    updateBonusLinks();
  }

  function adjustDigitalScreenForMode() {
    const coded = hasInstapicCode();
    const screen = document.querySelector('[data-screen="DIGITAL"]');
    const title = screen?.querySelector(".title-main");
    const subtitle = screen?.querySelector(":scope > .screen-content > .subtitle");
    const codeGroup = screen?.querySelector(".digital-code-group");
    const qrGroup = screen?.querySelector(".digital-qr-group");
    if (title) title.textContent = coded ? "Your Instapic Code" : "Your Photo Strip";
    if (subtitle) {
      subtitle.textContent = coded
        ? "Your code is printed on your strip. Scan the QR anytime for free bonus pics on instapic.fun."
        : "Ticket and penny sessions stay in Penny Fever. Save or share your strip here.";
    }
    if (codeGroup) codeGroup.hidden = !coded;
    if (qrGroup) qrGroup.hidden = !coded;
    if (!coded) setBonusUi("none", "");
  }

  function startPrintTimer() {
    stopPrintTimer();
    // Don't auto-bounce while the guest may still be saving/sharing.
  }
  function stopPrintTimer() {
    if (printTimer) clearTimeout(printTimer);
    printTimer = null;
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
    return useCreditCode().then((r) => {
      refreshWalletUi();
      if (r.ok) {
        setPayBanner(
          "Approved code " +
            r.code +
            "." +
            (r.info && r.info.total > 1 ? " Session " + r.info.no + " of " + r.info.total + "." : "")
        );
        startPaidSession(r.code, r.info);
        return true;
      }
      if (r.error === "none" && spendLocalSession()) {
        refreshWalletUi();
        const left = getLocalSessions();
        setPayBanner(
          "Penny-pack session started." +
            (left > 0 ? " " + left + " local session" + (left === 1 ? "" : "s") + " left." : "") +
            " Bonus code comes with Square packages only."
        );
        startPaidSession("", { no: 1, total: left + 1, left: left, source: "pennies" });
        return true;
      }
      if (r.error === "none") {
        setPayBanner("No photo sessions yet. Tap a circle to spend pennies, or top up at Aura's booth.");
      } else if (r.error === "offline") {
        setPayBanner("Can't reach Instapic right now. Your session is kept \u2014 try again.");
      } else {
        setPayBanner(
          r.error === "used"
            ? "That code was already used, so it was removed."
            : r.error === "missing"
              ? "That code isn't valid, so it was removed."
              : "Couldn't check your code. Try again."
        );
      }
      return false;
    });
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
      if (sessionCodeDisplay) sessionCodeDisplay.textContent = hasInstapicCode() ? localSessionCode : "";
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


  // ---- Aura till (Square) opened from package portals ----
  // Same-origin overlay so Apple Pay / Google Pay / card work on instapic.fun.
  // Money logic stays in ticket-till.js (credits only after COMPLETED).
  let auraTillLoading = null;
  function ensureTillCss() {
    if (document.querySelector("link[data-pf-till-css]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/penny-fever/world/ticket-till.css?v=pay-pennies-1";
    link.dataset.pfTillCss = "1";
    document.head.appendChild(link);
  }
  async function openAuraTill(packId, banner) {
    const pkg = String(packId || PENNY_TOPUP_PACK);
    try {
      sessionStorage.setItem("pf-till-from-felix", "1");
      sessionStorage.setItem(
        "pf-till-return-url",
        location.pathname + location.search + location.hash
      );
    } catch (_) {}
    ensureTillCss();
    try {
      if (!auraTillLoading) {
        auraTillLoading = import("/penny-fever/world/ticket-till.js?v=pay-pennies-1");
      }
      const mod = await auraTillLoading;
      if (typeof mod.mountTill === "function") mod.mountTill({});
      await mod.openTill({
        pack: pkg,
        focusPay: true,
        fromFelix: true,
        pin: true,
      });
      if (banner) setPayBanner(banner);
    } catch (err) {
      console.warn("[felix] till open failed", err);
      const ret = encodeURIComponent(
        "/penny-fever/paper-games/workshop/felix-booth.html?v=leftover-1"
      );
      const isPhoto = /^FELIX_P|^P[123]_STRIP/.test(pkg);
      location.href =
        "/penny-fever/?till=" + (isPhoto ? "photo" : "scrip") +
        "&pkg=" + encodeURIComponent(pkg) +
        "&return=" + ret +
        "&style=paper&rail=paper";
    }
  }
  function openAuraTillForPackage(pkgId) {
    const pkg = String(pkgId || "FELIX_P1_STRIP");
    const tip = {
      FELIX_P1_STRIP: "$5 · 10 pennies · 2 sessions",
      FELIX_P2_STRIP_GIF: "$8 · 16 pennies · 4 sessions",
      FELIX_P3_STRIP_GIF: "$10 · 20 pennies · 6 sessions",
      P1_STRIP: "$5 · 10 pennies · 2 sessions",
      P2_STRIP_GIF: "$8 · 16 pennies · 4 sessions",
      P3_STRIP_GIF: "$10 · 20 pennies · 6 sessions",
    }[pkg];
    return openAuraTill(
      pkg,
      (tip || "Felix photo package") +
        " — pay with Apple Pay, Google Pay or card. Credits only after Square approves."
    );
  }
  function openAuraTillForPennyTopUp(needPennies) {
    const need = Math.max(0, Math.floor(Number(needPennies) || 0));
    return openAuraTill(
      PENNY_TOPUP_PACK,
      "Need " + need + " more pennies. Aura's penny pack is $5 for 10 pennies — then come back to Felix."
    );
  }
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
        " photo sessions (" + pack.label + ")? No Instapic bonus code — that comes with Square.";
    }
    if (box) box.hidden = false;
  }
  function buyPortalWithPennies(pack) {
    if (!pack) return;
    if (getPennies() < pack.pennies) {
      setPayBanner("Not enough pennies — opening Aura's penny top-up.");
      hidePennyConfirm();
      openAuraTillForPennyTopUp(pack.pennies - getPennies());
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
      pack.pennies + " pennies → " + pack.sessions + " sessions. Bonus code comes with Square only."
    );
    if (!spendLocalSession()) {
      setPayBanner("Sessions saved — tap USE MY PHOTO SESSION.");
      return;
    }
    refreshWalletUi();
    startPaidSession("", { no: 1, total: pack.sessions, left: pack.sessions - 1, source: "pennies" });
  }

  function onPhotoCodeFromTill(ev) {
    refreshWalletUi();
    const code = (ev && ev.detail && ev.detail.code) || "";
    const left = getCredits();
    setPayBanner(
      code
        ? "Code " +
          code +
          " approved. " +
          left +
          (left === 1 ? " photo session" : " photo sessions") +
          " ready — tap USE MY PHOTO SESSION, or Back to Felix — start session in the till."
        : "Photo sessions ready — tap USE MY PHOTO SESSION."
    );
  }

  function onFelixStartPaid() {
    refreshWalletUi();
    if (getCredits() < 1) {
      setPayBanner("No photo sessions yet. Buy one at Aura's till.");
      return showScreen(Screen.PAYMENT);
    }
    useCreditCode().then((r) => {
      refreshWalletUi();
      if (r.ok) {
        setPayBanner(
          "Code " +
            r.code +
            " approved." +
            (r.info && r.info.total > 1
              ? " Session " + r.info.no + " of " + r.info.total + "."
              : "")
        );
        startPaidSession(r.code, r.info);
      } else {
        setPayBanner("Could not start the session. Try USE MY PHOTO SESSION.");
        showScreen(Screen.PAYMENT);
      }
    });
  }

  window.addEventListener("pf-photo-code", onPhotoCodeFromTill);
  window.addEventListener("pf-felix-start-paid", onFelixStartPaid);
  window.addEventListener("pf-till-closed", () => {
    refreshWalletUi();
    // Cancel / close Aura till: stay on Felix payment screen (Magic Mirror Screen 3).
    if (document.querySelector('[data-screen="PAYMENT"]')) showScreen(Screen.PAYMENT);
  });

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
    if (action === "event-paid") {
      setPayBanner("Private event sessions need an approved code. Use 'I have an Instapic code'.");
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
      setPayBanner("Opening Aura's penny top-up…");
      openAuraTillForPennyTopUp(10);
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
      // Circles: spend pennies when the purse covers it; otherwise Aura penny top-up.
      // (Square photo package is available from Aura after top-up / separately — not the short-purse path.)
      const pack =
        PORTAL_PACKS[action] ||
        Object.values(PORTAL_PACKS).find((p) => p.pkg === (btn && btn.dataset && btn.dataset.pkg)) ||
        null;
      if (!pack) {
        openAuraTillForPennyTopUp(10);
        return;
      }
      refreshWalletUi();
      if (getPennies() >= pack.pennies) {
        showPennyConfirm(pack);
        setPayBanner("Confirm spending " + pack.pennies + " pennies for " + pack.sessions + " sessions.");
        return;
      }
      setPayBanner(
        "Need " + pack.pennies + " pennies (you have " + getPennies() + "). Opening Aura's penny pack…"
      );
      openAuraTillForPennyTopUp(pack.pennies - getPennies());
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
          ({ p2: "5", p4: "8", p6: "10" }[pendingCashinPkg] || "?") +
          " package. Gives " +
          credits +
          " Felix photo sessions.";
      }
      return showScreen(Screen.CASHIN);
    }
    if (action === "cashin-back") return showScreen(Screen.PAYMENT);
    if (action === "cashin-continue" || action === "prepaid-continue") {
      const input = action === "cashin-continue" ? cashinInput : prepaidInput;
      const errEl = action === "cashin-continue" ? cashinError : prepaidError;
      const code = (input?.value || "").trim();
      if (!/^\d{6}$/.test(code)) {
        if (errEl) errEl.textContent = "Code should be 6 digits.";
        return;
      }
      if (errEl) errEl.textContent = "Checking your code\u2026";
      // Code already in this wallet with sessions left -> next session on it.
      if (photoCodes().some((r) => String(r.code) === code && codeLeft(r) > 0)) {
        useCreditCode(code).then((r) => {
          refreshWalletUi();
          if (r.ok) {
            if (errEl) errEl.textContent = "";
            setPayBanner("Code " + code + " approved. Session " + r.info.no + " of " + r.info.total + ".");
            startPaidSession(code, r.info);
          } else if (errEl) {
            errEl.textContent = r.error === "offline" ? "Couldn't reach Instapic. Try again." : "That code has no sessions left.";
          }
        });
        return;
      }
      redeemCode(code)
        .then((r) => {
          if (r.ok) {
            if (errEl) errEl.textContent = "";
            const info = rememberTypedCode(code, r.ticket);
            refreshWalletUi();
            setPayBanner("Code " + code + " approved." + (info.total > 1 ? " " + info.total + " sessions on this code." : ""));
            startPaidSession(code, info);
          } else if (errEl) {
            errEl.textContent = r.used
              ? "That code has already been used."
              : r.missing
                ? "We couldn't find that code."
                : "Couldn't check the code right now. Try again.";
          }
        })
        .catch(() => {
          if (errEl) errEl.textContent = "Couldn't reach Instapic. Try again.";
        });
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
        isTrySession = false;
        return showScreen(Screen.PAYMENT);
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

  // Square return: NEVER grant credits from URL params. Credits only after a
  // server-side check confirms the Square payment is COMPLETED (verifyPayment).
  function consumePaidReturn() {
    try {
      const params = new URLSearchParams(location.search);
      const paid = String(params.get("paid") || "").toUpperCase();
      let pending = "";
      try {
        pending = sessionStorage.getItem("felixBooth.pendingPay") || "";
      } catch (_) {}
      if (!paid && !pending) return false;
      const url = new URL(location.href);
      url.searchParams.delete("paid");
      url.searchParams.delete("credits");
      try {
        history.replaceState({}, "", url.pathname + (url.search || "") + (url.hash || ""));
      } catch (_) {}
      showScreen(Screen.PAYMENT);
      setPayBanner("Checking your payment…");
      verifyPayment(paid || pending);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Server-side verification hook. Until a verify endpoint is live, nothing is granted.
  function verifyPayment(pkg) {
    const link = SQUARE_LINKS[pkg];
    setPayBanner(
      "Checking your payment… " +
        (link ? link.label + ". " : "") +
        "Credits are only added once Square approves the payment. If you were charged, show staff your Square receipt."
    );
  }

  window.addEventListener("pagehide", stopCamera);
  refreshWalletUi();
  if (!consumePaidReturn()) showScreen(Screen.ATTRACT);
})();
