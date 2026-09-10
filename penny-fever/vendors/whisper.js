/* Gossip Booth — Desktop Grok owns this file. PF only. Never booth/port 6000. Never Imagine.
 * 3D velvet parlor. YOU wield a brass ear-trumpet.
 * Verb: ONE THUMB — drag trumpet, tap/hold to SNAP rose-gold fibs. Cream truths pass.
 * Colour-lock: ROSE-GOLD = fib, CREAM = truth. No mic. No text field.
 * Depth = secrets held. 1 coin = 1 run. 8 authored salons then ENDLESS.
 * Engine: Custom · depthUnit: Secrets · gameId: whisper · codaEnabled hybrid.
 * Aura lock: pigtails, yellow crown+heart, green pinafore, black shoes. */
import * as THREE from "../world/lib/three.module.min.js";

(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { kit } = PF;

  const GAME_ID = "whisper";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const DEATH_HOLD_MS = 820;
  const INTRO_MS = 520;
  const POP_MS = 560;
  const FIB_SCORE = 120;
  const SET_BONUS = 400;
  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;
  const FIB_COL = 0xc45a6a;
  const FIB_GLOW = 0xe8b84a;
  const TRUTH_COL = 0xf4ead8;
  const TRUTH_RIM = 0xe8d8c0;
  const MOTH_COL = 0xc8b070;
  const DWELL_SNAP_S = 0.11;
  const AIM_Y0 = 1.08;
  const REDUCE = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Gossip Booth",
    depthUnit: "Secrets",
    sheet: "GOBLIN_BATCH06_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored SALONS · ENDLESS gossip · one thumb · colour-lock",
    body: "One thumb. Drag the brass ear-trumpet. Tap to SNAP. Colour is the lock: ROSE-GOLD is a fib, CREAM is a truth. First Lean teaches the drag-tap → Cross Talk mixes cream → Smile Fib grins but stays rose-gold → Close Whisper crowds the bell → Two Tongues wants both rose-golds → Moth Noise is not a colour → Seat Swap moves the mouths → Curtain Voice is embroidery. Then ENDLESS. No mic. No typing. Depth is secrets held.",
    status: "Depth run · START · 1 demo coin · 8 authored salons then ENDLESS · one thumb · colour-lock",
    machine: "3D parlor · one thumb · colour-lock · 1 demo coin · authored SALONS",
    idleHud: ["ONE THUMB · DRAG TO AIM · TAP ROSE-GOLD", "START · 1 demo coin — rose-gold lies, cream tells the truth"],
    punch: "Depth run — press START. One thumb. Snap the rose-gold.",
  };

  const AUTHORED = [
    { id: 1, title: "First Lean", kind: "teach", fibN: 1, trueN: 0, mothN: 0, timeLimit: 16, flight: 4.4, stagger: 0, radius: 0.72, grace: true, swap: false, decoy: false, close: false, smile: false, barker: "ONE THUMB: drag onto ROSE-GOLD. Tap to SNAP. That’s a fib." },
    { id: 2, title: "Cross Talk", kind: "cross", fibN: 1, trueN: 1, mothN: 0, timeLimit: 13, flight: 3.3, stagger: 0.7, radius: 0.58, grace: false, swap: false, decoy: false, close: false, smile: false, barker: "Colour-lock: ROSE-GOLD = fib. CREAM = truth — let cream pass." },
    { id: 3, title: "Smile Fib", kind: "smile", fibN: 1, trueN: 1, mothN: 0, timeLimit: 12, flight: 2.8, stagger: 0.5, radius: 0.52, grace: false, swap: false, decoy: false, close: false, smile: true, barker: "It grins. Colour is still the lock — snap ROSE-GOLD only." },
    { id: 4, title: "Close Whisper", kind: "close", fibN: 1, trueN: 2, mothN: 0, timeLimit: 11, flight: 2.55, stagger: 0.36, radius: 0.46, grace: false, swap: false, decoy: false, close: true, smile: false, barker: "They overlap. Stay on rose-gold. Cream is still a truth." },
    { id: 5, title: "Two Tongues", kind: "two", fibN: 2, trueN: 1, mothN: 0, timeLimit: 11, flight: 2.7, stagger: 0.55, radius: 0.5, grace: false, swap: false, decoy: false, close: false, smile: true, barker: "Two rose-gold fibs. Catch both. Cream still passes." },
    { id: 6, title: "Moth Noise", kind: "moths", fibN: 1, trueN: 1, mothN: 2, timeLimit: 10, flight: 2.45, stagger: 0.38, radius: 0.48, grace: false, swap: false, decoy: false, close: false, smile: false, barker: "Moths are dusty, not rose-gold. Don’t snap them." },
    { id: 7, title: "Seat Swap", kind: "swap", fibN: 2, trueN: 1, mothN: 1, timeLimit: 10, flight: 2.35, stagger: 0.45, radius: 0.46, grace: false, swap: true, decoy: false, close: false, smile: true, barker: "Chairs trade. Track the rose-gold. Cream is still truth." },
    { id: 8, title: "Curtain Voice", kind: "decoy", fibN: 2, trueN: 1, mothN: 1, timeLimit: 9.5, flight: 2.2, stagger: 0.34, radius: 0.44, grace: false, swap: true, decoy: true, close: true, smile: false, barker: "Embroidery isn’t rose-gold. The fib still flies rose-gold." },
  ];

  const TRUES = [
    "The kettle pops twice before it means it.",
    "Aura’s crown is yellow on purpose.",
    "Brass charms keep secrets, not luck.",
    "The barker always leans on his left foot.",
    "Fairy floss snaps if you show off.",
    "Pennies pitch better when you don’t stare.",
    "Velvet curtains remember who leaned first.",
    "Star-gazing works with shoes on the ground.",
    "The milk bottles on the bottom are lead.",
    "A charm is just a word that sat still.",
    "Boardwalk bulbs blink in threes.",
    "Stillness opens more tents than hurry.",
    "Aura’s pinafore is carnival green.",
    "The charm press stamps brass, not luck.",
    "Skee-ball wax starts mid-stage.",
    "The night board keeps a streak, not a wager.",
  ];
  const FIBS = [
    "Aura’s crown is actually a lemon tart.",
    "The kettle never pops. That’s just applause.",
    "Pennies grow on the pitch cloth overnight.",
    "The dunk tank is filled with lemonade.",
    "Moths here pay rent in gossip.",
    "Milk bottles are hollow marshmallows.",
    "The alley is uphill both ways after dusk.",
    "Fairy floss is spun from fog and compliments.",
    "The barker has six left feet.",
    "Brass charms hatch into tickets at noon.",
    "Boardwalk bulbs are fireflies in union.",
    "Skee-ball lanes are made of warm butter.",
    "Ducks vote on their own colour.",
    "Aura’s shoes are painted river stones.",
    "Every rumor here comes with a receipt.",
    "The table is a sleeping carousel horse.",
  ];

  const AURA_VO = {
    fib: "Aura: Caught it. Keep the trumpet up.",
    both: "Aura: Both tongues. The parlor likes you.",
    deep: (n) => `Aura: Secret ${n}. You’re living in my parlor.`,
    believed: "Aura: You believed a truth. The curtain noticed.",
    timeout: "Aura: Too slow. Gossip doesn’t wait.",
    missed: "Aura: It flew past your ear. Lean sooner.",
    moth: "Aura: That was a moth, sugar. Not a secret.",
    leave: "Aura: Walking off mid-lean? Secrets stay.",
    shallow: "Aura: Not one secret. The fib was in the air.",
    grace: "Aura: Not that one. Rose-gold is the fib. Try the snap again.",
    decoy: "Aura: That’s embroidery. The fib is still flying.",
    coda: "Aura: Authored salons done. ENDLESS gossip. Don’t you dare believe.",
    souvenir: "Aura: Authored salons locked. Souvenir — the parlor salutes.",
    slam: "Aura: Curtain drop. Aim better next coin.",
  };

  const SEAT_HOMES = [
    { x: -1.28, z: 0.22, name: "left" },
    { x: -1.08, z: -0.92, name: "back-left" },
    { x: 1.08, z: -0.92, name: "back-right" },
    { x: 1.28, z: 0.22, name: "right" },
  ];
  const GOSSIP_STYLES = [
    { coat: 0x6a2038, hat: "boater", hatColor: 0xf0e0c8, pants: 0x2a1814 },
    { coat: 0x243868, hat: "bowler", pants: 0x1a1420 },
    { coat: 0x6a3a18, hat: "feather", pants: 0x3a2010 },
    { coat: 0x3a4a38, hat: "cap", pants: 0x243018 },
  ];

  let run = null;
  let world = null;
  let raf = 0;
  let lastTs = 0;
  let shown = false;
  let usedTrue = [];
  let usedFib = [];
  const pointer = { x: 0, y: 0, on: false, px: 0, py: 0, down: false, downX: 0, downY: 0, downAt: 0, drag: 0, id: null };
  const keys = Object.create(null);
  const tmp = new THREE.Vector3();
  const bellW = new THREE.Vector3();

  function el(id) { return PF.$(id); }
  function card() { return el("whisperCard"); }
  function rk() { return PF.runKit || null; }
  function setText(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }
  function sfx(name) {
    try { if (kit && kit.sfx) kit.sfx(name); } catch (_) { /* optional */ }
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function take(pool, n, used) {
    let avail = pool.filter((x) => used.indexOf(x) === -1);
    if (avail.length < n) {
      used.length = 0;
      avail = pool.slice();
    }
    const picked = shuffle(avail).slice(0, n);
    picked.forEach((p) => used.push(p));
    return picked;
  }
  function canGL() {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch (_) { return false; }
  }
  function isLive() { return !!(run && run.alive && !run.dying && !run.done); }

  function codaParams(n) {
    const k = Math.max(0, n - AUTHORED_COUNT);
    return {
      id: n,
      title: "Endless Gossip " + n,
      kind: "coda",
      fibN: Math.min(4, 2 + ((k / 3) | 0)),
      trueN: Math.min(3, 1 + ((k / 2) | 0)),
      mothN: Math.min(3, 1 + ((k / 2) | 0)),
      timeLimit: Math.max(6.8, 9.0 - k * 0.14),
      flight: Math.max(1.55, 2.2 - k * 0.045),
      stagger: Math.max(0.18, 0.38 - k * 0.012),
      radius: Math.max(0.32, 0.44 - k * 0.008),
      grace: false,
      swap: k % 2 === 0,
      decoy: k % 2 === 1,
      close: k % 3 !== 0,
      smile: true,
      coda: true,
      barker: "ENDLESS. Colour-lock holds: rose-gold fibs, cream truths. One thumb.",
    };
  }
  function specFor(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[stage - 1]);
    if (!CODA_ENABLED) return null;
    return codaParams(stage);
  }
  function hudLine(spec) {
    if (!spec) return "SECRET 0";
    if (spec.coda) return `ENDLESS · SECRET ${spec.id} · ${spec.title}`;
    return `SECRET ${spec.id} · ${spec.title.toUpperCase()}`;
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
      engine: "Custom",
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function stampDepthCopy() {
    const copy = document.querySelector("#cabinet-whisper [data-pf-depth-copy]");
    if (copy) copy.textContent = DEPTH_COPY.body;
    const machine = el("whisperMachine");
    if (machine && !(run && (run.alive || run.dying))) machine.textContent = DEPTH_COPY.machine;
    if (!(run && (run.alive || run.dying))) {
      setText("whisperStatus", DEPTH_COPY.status);
      setText("whisperBarker", DEPTH_COPY.idleHud[0]);
      setText("whisperHudBarker", DEPTH_COPY.idleHud[0]);
      setText("whisperHudRoom", "SECRET 0");
    }
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall through */ }
    }
    if (kit && kit.persistRun) kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  function std(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.72, metalness: 0.08,
    }, extra || {}));
  }
  function wrapText(ctx, text, maxW) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((w) => {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = test;
    });
    if (line) lines.push(line);
    return lines.slice(0, 4);
  }
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
  function meshAt(geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
  }

  function noteTex(text, kind) {
    return canvasTex(512, 256, (ctx) => {
      ctx.clearRect(0, 0, 512, 256);
      const fib = kind === "fib";
      const moth = kind === "moth";
      ctx.fillStyle = fib ? "rgba(92, 22, 36, 0.94)" : moth ? "rgba(40, 28, 12, 0.9)" : "rgba(244, 234, 216, 0.94)";
      roundRect(ctx, 16, 16, 480, 200, 24);
      ctx.fill();
      ctx.strokeStyle = fib ? "#e8b84a" : moth ? "rgba(200, 176, 112, 0.55)" : "#e8d8c0";
      ctx.lineWidth = 8;
      roundRect(ctx, 16, 16, 480, 200, 24);
      ctx.stroke();
      ctx.fillStyle = fib ? "#c45a6a" : moth ? "#6a5430" : "#e8d8c0";
      roundRect(ctx, 16, 16, 480, 44, 24);
      ctx.fill();
      ctx.fillRect(16, 36, 480, 24);
      ctx.fillStyle = fib ? "#2a0810" : moth ? "#f0d09a" : "#3a2418";
      ctx.font = "800 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(fib ? "ROSE-GOLD · FIB" : moth ? "MOTH · NOISE" : "CREAM · TRUTH", 256, 38);
      ctx.fillStyle = fib ? "#f6dcc0" : moth ? "#f0e0b0" : "#3a2418";
      ctx.font = "700 26px Georgia, serif";
      const label = moth ? "PSST — moth" : text;
      const lines = wrapText(ctx, label, 430);
      const startY = 128 - (lines.length - 1) * 16;
      lines.forEach((ln, i) => ctx.fillText(ln, 256, startY + i * 32));
    });
  }
  function signTex(title) {
    return canvasTex(512, 160, (ctx) => {
      ctx.fillStyle = "#1a0c10";
      ctx.fillRect(0, 0, 512, 160);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, 492, 140);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "700 44px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(title, 256, 80);
    });
  }
  function velvetTex() {
    return canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#4a1a28";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 40; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${0.04 + (i % 5) * 0.02})`;
        ctx.fillRect(i * 6, 0, 2, 256);
      }
      ctx.fillStyle = "rgba(212,164,90,0.08)";
      for (let y = 8; y < 256; y += 22) ctx.fillRect(0, y, 256, 1);
    });
  }
  function woodTex() {
    return canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#2a1810";
      ctx.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 28) {
        ctx.fillStyle = y % 56 ? "#3a2418" : "#24140e";
        ctx.fillRect(0, y, 256, 24);
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(0, y + 23, 256, 2);
      }
    });
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = std(SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const blouse = std(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.2 });
    const dress = std(DRESS, { emissive: 0x0a2010, emissiveIntensity: 0.28 });
    const hairM = std(HAIR, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });
    const gold = std(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const heart = std(HEART, { emissive: HEART, emissiveIntensity: 0.62, roughness: 0.4 });
    const shoe = std(0x141414, { roughness: 0.22, metalness: 0.4 });
    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(meshAt(new THREE.CylinderGeometry(0.12, 0.15, 0.28, 12), blouse, 0, 0.28, 0));
    hip.add(meshAt(new THREE.CylinderGeometry(0.24, 0.12, 0.34, 12), dress, 0, 0.05, 0));
    hip.add(meshAt(new THREE.BoxGeometry(0.18, 0.16, 0.04), dress, 0, 0.3, 0.12));
    const heartGem = meshAt(new THREE.BoxGeometry(0.08, 0.08, 0.035), heart, 0, 0.24, 0.16);
    heartGem.rotation.z = Math.PI / 4;
    hip.add(heartGem);
    const head = new THREE.Group();
    head.position.y = 0.6;
    hip.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 12), skin));
    const eyeW = std(0xf7f2ea);
    const eyeD = std(0x2a1810);
    [-1, 1].forEach((side) => {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), eyeW);
      white.scale.set(1, 1.15, 0.55);
      white.position.set(side * 0.055, 0.03, 0.15);
      head.add(white);
      head.add(meshAt(new THREE.SphereGeometry(0.02, 8, 8), eyeD, side * 0.055, 0.03, 0.168));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), std(0xc45a6a));
    smile.position.set(0, -0.05, 0.16);
    smile.rotation.x = 2.6;
    head.add(smile);
    head.add(meshAt(new THREE.SphereGeometry(0.2, 12, 10), hairM, 0, 0.08, -0.1));
    [-1, 1].forEach((side) => {
      head.add(meshAt(new THREE.SphereGeometry(0.11, 10, 8), hairM, side * 0.2, -0.05, 0.02));
      head.add(meshAt(new THREE.SphereGeometry(0.045, 8, 8), heart, side * 0.2, 0.05, 0.05));
    });
    head.add(meshAt(new THREE.BoxGeometry(0.26, 0.06, 0.08), hairM, 0, 0.12, 0.14));
    const crown = new THREE.Group();
    crown.position.y = 0.24;
    head.add(crown);
    crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold));
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      crown.add(meshAt(new THREE.ConeGeometry(0.035, h, 6), gold, x, h * 0.45, 0));
    });
    const gem = meshAt(new THREE.BoxGeometry(0.055, 0.055, 0.025), heart, 0, 0.02, 0.11);
    gem.rotation.z = Math.PI / 4;
    crown.add(gem);
    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0.0, 0);
      const len = arm ? 0.28 : 0.34;
      const rad = arm ? 0.035 : 0.042;
      const bone = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 8), arm ? skin : dress);
      bone.position.y = -len / 2;
      pivot.add(bone);
      if (arm) pivot.add(meshAt(new THREE.SphereGeometry(0.04, 8, 8), skin, 0, -len, 0));
      else {
        const boot = meshAt(new THREE.BoxGeometry(0.08, 0.05, 0.12), shoe, 0, -len - 0.02, 0.03);
        pivot.add(boot);
      }
      hip.add(pivot);
      return pivot;
    }
    const armL = limb(-1, true);
    const armR = limb(1, true);
    const legL = limb(-1, false);
    const legR = limb(1, false);
    armL.rotation.x = -0.95; armR.rotation.x = -0.88;
    armL.rotation.z = 0.22; armR.rotation.z = -0.22;
    legL.rotation.x = -1.12; legR.rotation.x = -1.08;
    g.userData = { hip, head, armL, armR, smile, t: 0 };
    g.scale.setScalar(1.18);
    return g;
  }

  function makeGossiper(opt) {
    const g = new THREE.Group();
    const coat = std(opt.coat, { roughness: 0.7 });
    const skin = std(SKIN);
    const hip = new THREE.Group();
    hip.position.y = 0.5;
    g.add(hip);
    hip.add(meshAt(new THREE.CylinderGeometry(0.11, 0.14, 0.3, 10), coat, 0, 0.22, 0));
    const head = meshAt(new THREE.SphereGeometry(0.125, 12, 10), skin, 0, 0.46, 0);
    hip.add(head);
    if (opt.hat === "boater") {
      hip.add(meshAt(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 14), std(opt.hatColor || 0xf0e0c8), 0, 0.56, 0));
      hip.add(meshAt(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), std(opt.hatColor || 0xf0e0c8), 0, 0.61, 0));
    } else if (opt.hat === "bowler") {
      const b = meshAt(new THREE.SphereGeometry(0.12, 10, 8), std(0x1a1210), 0, 0.58, 0);
      b.scale.y = 0.7;
      hip.add(b);
    } else if (opt.hat === "feather") {
      hip.add(meshAt(new THREE.CylinderGeometry(0.14, 0.12, 0.06, 12), std(0x6a2030), 0, 0.56, 0));
      const f = meshAt(new THREE.ConeGeometry(0.03, 0.22, 6), std(GOLD), 0.08, 0.68, 0);
      f.rotation.z = -0.6;
      hip.add(f);
    } else {
      hip.add(meshAt(new THREE.CylinderGeometry(0.12, 0.13, 0.08, 12), std(0x2a4060), 0, 0.56, 0));
    }
    [-1, 1].forEach((side) => {
      const arm = meshAt(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8), coat, side * 0.16, 0.12, 0.1);
      arm.rotation.x = -1.05;
      hip.add(arm);
      const leg = meshAt(new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8), std(opt.pants || 0x2a1810), side * 0.07, -0.08, 0.12);
      leg.rotation.x = Math.PI / 2;
      hip.add(leg);
    });
    const mouth = new THREE.Object3D();
    mouth.position.set(0, 0.44, 0.12);
    hip.add(mouth);
    g.userData = { hip, head, mouth, t: Math.random() * 8, home: new THREE.Vector3(), talking: 0 };
    return g;
  }

  function makeChair() {
    const g = new THREE.Group();
    const wood = std(0x3a2418, { roughness: 0.62 });
    g.add(meshAt(new THREE.BoxGeometry(0.32, 0.06, 0.32), wood, 0, 0.46, 0));
    g.add(meshAt(new THREE.BoxGeometry(0.32, 0.42, 0.05), wood, 0, 0.68, -0.14));
    [[-0.12, 0.23, -0.12], [0.12, 0.23, -0.12], [-0.12, 0.23, 0.12], [0.12, 0.23, 0.12]].forEach((p) => {
      g.add(meshAt(new THREE.BoxGeometry(0.045, 0.46, 0.045), wood, p[0], p[1], p[2]));
    });
    return g;
  }

  function makeTrumpet() {
    const g = new THREE.Group();
    const brass = std(0xd4a45a, { metalness: 0.72, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.28 });
    const bell = new THREE.Mesh(
      new THREE.ConeGeometry(0.26, 0.44, 18, 1, true),
      std(0xd4a45a, { metalness: 0.72, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.28, side: THREE.DoubleSide })
    );
    bell.rotation.x = Math.PI / 2;
    bell.position.z = -0.06;
    g.add(bell);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.4, 10), brass);
    tube.rotation.x = Math.PI / 2;
    tube.position.z = 0.24;
    g.add(tube);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.3, 8), brass);
    handle.position.set(0.12, -0.14, 0.3);
    handle.rotation.z = 0.72;
    g.add(handle);
    g.add(meshAt(new THREE.TorusGeometry(0.07, 0.018, 8, 14), brass, 0, -0.02, 0.2));
    const glow = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.28, 22),
      new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    glow.position.z = -0.3;
    g.add(glow);
    const bellCenter = new THREE.Object3D();
    bellCenter.position.set(0, 0, -0.26);
    g.add(bellCenter);
    g.userData = { bell, glow, bellCenter, punch: 0 };
    return g;
  }

  function makeNoteMesh() {
    const g = new THREE.Group();
    const paper = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.28, 0.016),
      std(TRUTH_COL, { roughness: 0.5, emissive: 0x4a2818, emissiveIntensity: 0.22 })
    );
    g.add(paper);
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.32, 0.01),
      new THREE.MeshBasicMaterial({ color: TRUTH_RIM })
    );
    rim.position.z = -0.012;
    g.add(rim);
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.07, 0.02),
      new THREE.MeshBasicMaterial({ color: TRUTH_RIM })
    );
    band.position.y = 0.125;
    g.add(band);
    const grin = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI),
      new THREE.MeshBasicMaterial({ color: GOLD })
    );
    grin.rotation.x = 2.5;
    grin.position.set(0, -0.04, 0.02);
    grin.visible = false;
    g.add(grin);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
    sprite.position.y = 0.28;
    sprite.scale.set(1.35, 0.62, 1);
    g.add(sprite);
    const wing = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.12),
      new THREE.MeshBasicMaterial({ color: 0xf4e0b0, side: THREE.DoubleSide, transparent: true, opacity: 0.88 })
    );
    wing.visible = false;
    g.add(wing);
    g.visible = false;
    g.userData = {
      paper, grin, sprite, wing, rim, band, kind: "truth", t: 0, flight: 1, live: false, caught: false, text: "",
      from: new THREE.Vector3(), to: new THREE.Vector3(), ctrl: new THREE.Vector3(),
      sx: 0.5, sy: 0.18, ex: 0.5, ey: 0.78,
    };
    return g;
  }

  function faceCenter(obj) {
    obj.rotation.y = Math.atan2(-obj.position.x, -obj.position.z);
  }

  function boot3d(canvas) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x14080e);
    scene.fog = new THREE.Fog(0x14080e, 6.2, 12);
    const camera = new THREE.PerspectiveCamera(56, 16 / 10, 0.08, 60);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    camera.position.set(0, 1.78, 5.5);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const velvet = std(0x4a1a28, { map: velvetTex(), roughness: 0.86 });
    velvet.side = THREE.BackSide;
    const walls = new THREE.Mesh(new THREE.CylinderGeometry(3.55, 3.55, 3.6, 32, 1, true), velvet);
    walls.position.y = 1.6;
    scene.add(walls);
    const ceilMat = std(0x5a2230, { map: velvetTex(), roughness: 0.9 });
    ceilMat.side = THREE.BackSide;
    scene.add(meshAt(new THREE.ConeGeometry(3.8, 1.55, 24, 1, true), ceilMat, 0, 3.62, 0));
    const floor = new THREE.Mesh(new THREE.CircleGeometry(3.55, 36), std(0x2a1810, { map: woodTex(), roughness: 0.8 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const inlay = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.18, 32), std(GOLD, { metalness: 0.7, roughness: 0.32, emissive: 0x6a4808, emissiveIntensity: 0.2 }));
    inlay.rotation.x = -Math.PI / 2;
    inlay.position.y = 0.012;
    scene.add(inlay);

    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.9, 0.08, 28), std(0x3a2418, { roughness: 0.55, metalness: 0.12 }));
    table.position.set(0, 0.74, -0.18);
    scene.add(table);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.03, 8, 28), std(GOLD, { metalness: 0.7, roughness: 0.28 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 0.79, -0.18);
    scene.add(rim);
    const susan = new THREE.Group();
    susan.position.set(0, 0.79, -0.18);
    scene.add(susan);
    susan.add(meshAt(new THREE.CylinderGeometry(0.34, 0.34, 0.02, 20), std(0x5a2030, { roughness: 0.6 }), 0, 0.01, 0));
    [[-0.22, 0.18], [0.22, 0.18], [0, -0.22]].forEach((p) => {
      const cup = meshAt(new THREE.CylinderGeometry(0.045, 0.038, 0.06, 10), std(0xf0e8d8), p[0], 0.05, p[1]);
      susan.add(cup);
    });

    const press = new THREE.Group();
    press.position.set(0, 0.84, -0.18);
    scene.add(press);
    press.add(meshAt(new THREE.CylinderGeometry(0.12, 0.14, 0.08, 12), std(GOLD, { metalness: 0.7, roughness: 0.3 }), 0, 0.04, 0));
    press.add(meshAt(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 10), std(0x8a6230, { metalness: 0.45 }), 0, 0.18, 0));
    const disc = meshAt(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16), std(GOLD, { metalness: 0.8, roughness: 0.22, emissive: GOLD, emissiveIntensity: 0.35 }), 0, 0.08, 0);
    disc.visible = false;
    press.add(disc);

    const lamp = new THREE.Group();
    lamp.position.set(0, 2.58, -0.1);
    scene.add(lamp);
    lamp.add(meshAt(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8), std(0x2a1810), 0, 0.2, 0));
    lamp.add(meshAt(new THREE.ConeGeometry(0.24, 0.2, 12), std(0x3a1818, { emissive: 0x6a3020, emissiveIntensity: 0.45 }), 0, -0.22, 0));

    scene.add(new THREE.HemisphereLight(0xffe2c4, 0x2a1020, 0.58));
    scene.add(new THREE.AmbientLight(0x3a1822, 0.34));
    const spot = new THREE.SpotLight(0xffd8a8, 2.5, 9, 0.58, 0.42, 1);
    spot.position.set(0, 2.45, 0.55);
    spot.target.position.set(0, 0.9, -0.25);
    scene.add(spot); scene.add(spot.target);
    const brassL = new THREE.PointLight(0xe8b84a, 1.15, 5.5, 2);
    brassL.position.set(0.7, 1.55, 0.9);
    scene.add(brassL);
    const rose = new THREE.PointLight(0xc45a6a, 0.95, 6, 2);
    rose.position.set(-0.85, 1.7, -1.35);
    scene.add(rose);
    const trumpetLight = new THREE.PointLight(0xe8b84a, 0.15, 2.4, 2);
    trumpetLight.position.set(0, 1.2, 1.4);
    scene.add(trumpetLight);

    const aura = makeAura();
    aura.position.set(0, 0.02, -1.22);
    aura.userData.hip.rotation.x = 0.32;
    scene.add(aura);

    const gossipers = [];
    const chairs = [];
    SEAT_HOMES.forEach((seat, i) => {
      const chair = makeChair();
      chair.position.set(seat.x, 0, seat.z);
      faceCenter(chair);
      scene.add(chair);
      chairs.push(chair);
      const person = makeGossiper(GOSSIP_STYLES[i]);
      person.position.set(seat.x, 0, seat.z);
      person.userData.home.set(seat.x, 0, seat.z);
      faceCenter(person);
      scene.add(person);
      gossipers.push(person);
    });

    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), new THREE.MeshBasicMaterial({ map: signTex("GOSSIP BOOTH") }));
    sign.position.set(0, 2.48, -2.38);
    scene.add(sign);
    const how = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.28), new THREE.MeshBasicMaterial({ map: signTex("SNAP THE FIB") }));
    how.position.set(0, 2.18, -2.36);
    scene.add(how);

    const curtainMat = std(0x6a2030, { map: velvetTex(), roughness: 0.78, side: THREE.DoubleSide });
    const curtainL = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 3.3), curtainMat);
    const curtainR = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 3.3), curtainMat.clone());
    curtainL.position.set(-1.95, 1.55, 2.02);
    curtainR.position.set(1.95, 1.55, 2.02);
    scene.add(curtainL, curtainR);

    const decoy = new THREE.Mesh(
      new THREE.PlaneGeometry(1.05, 0.4),
      new THREE.MeshBasicMaterial({ map: noteTex("The curtain stitched this fib itself.", "truth"), transparent: true, opacity: 0.0 })
    );
    decoy.position.set(-1.62, 1.72, 2.03);
    decoy.visible = false;
    scene.add(decoy);

    const trumpet = makeTrumpet();
    trumpet.scale.setScalar(0.58);
    trumpet.position.set(0, AIM_Y0, 1.58);
    trumpet.rotation.x = -0.42;
    scene.add(trumpet);

    const notes = [];
    for (let i = 0; i < 14; i += 1) {
      const n = makeNoteMesh();
      scene.add(n);
      notes.push(n);
    }

    const moths = [];
    const mothMat = new THREE.MeshBasicMaterial({ color: 0xf4e0b0 });
    for (let i = 0; i < 18; i += 1) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), mothMat);
      m.userData = { t: Math.random() * 12, r: rand(0.8, 2.5), y: rand(0.9, 2.45), s: rand(0.4, 1.15) };
      scene.add(m);
      moths.push(m);
    }
    const letters = [];
    "PSST".split("").forEach((ch, i) => {
      const tex = canvasTex(64, 64, (ctx) => {
        ctx.clearRect(0, 0, 64, 64);
        ctx.fillStyle = "rgba(240,208,154,0.75)";
        ctx.font = "700 42px Georgia, serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ch, 32, 34);
      });
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.5, depthWrite: false }));
      sp.scale.set(0.22, 0.22, 1);
      sp.userData = { t: i * 0.9, r: rand(1.1, 2.2) };
      scene.add(sp);
      letters.push(sp);
    });

    const fx = [];
    for (let i = 0; i < 28; i += 1) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshBasicMaterial({ color: GOLD }));
      p.visible = false;
      p.userData = { v: new THREE.Vector3(), life: 0 };
      scene.add(p);
      fx.push(p);
    }

    const shelf = [];
    for (let i = 0; i < 8; i += 1) {
      const d = meshAt(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 14), std(GOLD, { metalness: 0.7, roughness: 0.35, emissive: GOLD, emissiveIntensity: 0 }), -1.15 + i * 0.33, 2.05, -2.28);
      d.rotation.x = Math.PI / 2;
      scene.add(d);
      shelf.push(d);
    }

    return {
      mode: "3d", scene, camera, renderer, aura, gossipers, chairs, trumpet, notes, moths, letters, fx,
      curtainL, curtainR, decoy, disc, susan, brassL: brassL, rose, spot, trumpetLight, shelf,
      cam: { x: 0, y: 1.28, z: 3.35 }, look: { x: 0, y: 1.02, z: -0.22 },
    };
  }

  function boot2d(canvas) {
    return { mode: "2d", canvas, ctx: canvas.getContext("2d"), notes: [], w: 640, h: 440 };
  }

  function ensureWorld() {
    if (world) return world;
    const canvas = el("whisperCanvas");
    if (!canvas) return null;
    try {
      if (canGL()) world = boot3d(canvas);
      else world = boot2d(canvas);
    } catch (err) {
      console.warn("whisper 3d", err);
      world = boot2d(canvas);
    }
    resize();
    const stage = el("whisperStage");
    if (stage) stage.dataset.whisperMode = world.mode;
    return world;
  }

  function resize() {
    const canvas = el("whisperCanvas");
    const stage = el("whisperStage");
    if (!canvas || !stage || !world) return;
    const w = Math.max(320, stage.clientWidth || 640);
    const h = Math.max(280, stage.clientHeight || 440);
    if (world.mode === "3d" && world.renderer) {
      world.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      world.renderer.setSize(w, h, false);
      world.camera.aspect = w / h;
      world.camera.updateProjectionMatrix();
    } else {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (world.ctx) world.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      world.w = w; world.h = h;
    }
  }

  function burst(x, y, z, hex) {
    if (!world || world.mode !== "3d") return;
    let n = 0;
    world.fx.forEach((p) => {
      if (n > 12) return;
      if (p.visible && p.userData.life > 0) return;
      p.visible = true;
      p.position.set(x, y, z);
      p.material.color.setHex(hex || GOLD);
      p.userData.life = 1;
      p.userData.v.set(rand(-1.5, 1.5), rand(0.7, 2.4), rand(-1.3, 1.3));
      n += 1;
    });
  }

  function paintNote(mesh, kind) {
    if (!mesh || !mesh.userData) return;
    const paper = mesh.userData.paper;
    const band = mesh.userData.band;
    const rim = mesh.userData.rim;
    if (kind === "fib") {
      paper.material.color.setHex(FIB_COL);
      paper.material.emissive.setHex(FIB_GLOW);
      paper.material.emissiveIntensity = 0.62;
      if (band) { band.material.color.setHex(FIB_GLOW); band.visible = true; }
      if (rim) rim.material.color.setHex(FIB_GLOW);
    } else if (kind === "truth") {
      paper.material.color.setHex(TRUTH_COL);
      paper.material.emissive.setHex(0x4a4038);
      paper.material.emissiveIntensity = 0.06;
      if (band) { band.material.color.setHex(TRUTH_RIM); band.visible = true; }
      if (rim) rim.material.color.setHex(TRUTH_RIM);
    } else {
      paper.material.color.setHex(MOTH_COL);
      paper.material.emissive.setHex(0x3a3018);
      paper.material.emissiveIntensity = 0.12;
      if (band) { band.material.color.setHex(0x6a5430); band.visible = true; }
      if (rim) rim.material.color.setHex(0x8a7040);
    }
  }

  function setNoteLabel(mesh, text, kind) {
    const sprite = mesh.userData.sprite;
    if (sprite.material.map) sprite.material.map.dispose();
    sprite.material.map = noteTex(text, kind);
    sprite.material.needsUpdate = true;
  }

  function freeNoteMesh() {
    if (!world || world.mode !== "3d") return null;
    return world.notes.find((n) => !n.visible) || null;
  }

  function planVolley(spec) {
    const fibs = take(FIBS, spec.fibN, usedFib);
    const trues = take(TRUES, spec.trueN, usedTrue);
    const events = [];
    let delay = 0.35;
    const seats = shuffle([0, 1, 2, 3]);
    let si = 0;
    function nextSeat() {
      const s = seats[si % seats.length];
      si += 1;
      return s;
    }
    fibs.forEach((text) => {
      events.push({ kind: "fib", text, seat: nextSeat(), delay, smile: !!spec.smile });
      delay += spec.stagger;
    });
    trues.forEach((text) => {
      events.push({ kind: "truth", text, seat: nextSeat(), delay, smile: false });
      delay += spec.stagger * 0.85;
    });
    for (let i = 0; i < (spec.mothN || 0); i += 1) {
      events.push({ kind: "moth", text: "PSST", seat: nextSeat(), delay, smile: false });
      delay += spec.stagger * 0.7;
    }
    return shuffle(events).map((ev, i) => Object.assign({}, ev, { delay: 0.28 + i * spec.stagger }));
  }

  function launch(ev, spec) {
    if (!run) return;
    const flight = spec.flight || 2.4;
    const note = {
      kind: ev.kind,
      text: ev.text,
      smile: !!ev.smile,
      t: 0,
      flight,
      live: true,
      caught: false,
      mesh: null,
      from: new THREE.Vector3(),
      to: new THREE.Vector3(),
      ctrl: new THREE.Vector3(),
      sx: 0.2 + Math.random() * 0.6,
      sy: 0.12 + Math.random() * 0.08,
      ex: 0.22 + Math.random() * 0.56,
      ey: 0.78,
    };
    if (world && world.mode === "3d") {
      const goss = world.gossipers[ev.seat % world.gossipers.length];
      goss.updateMatrixWorld(true);
      if (goss.userData.mouth) goss.userData.mouth.getWorldPosition(note.from);
      else note.from.set(goss.position.x, 1.12, goss.position.z);
      goss.userData.talking = 1;
      const teach = spec.kind === "teach" || spec.grace;
      const catchZ = spec.close ? 1.42 : 1.52;
      if (teach) {
        note.to.set(rand(-0.08, 0.08), AIM_Y0 + rand(-0.04, 0.06), catchZ);
      } else {
        const spread = spec.close ? 0.38 : 0.7;
        note.to.set(rand(-spread, spread), AIM_Y0 + rand(-0.12, 0.18), catchZ);
      }
      note.ctrl.set(
        (note.from.x + note.to.x) * 0.45,
        Math.max(note.from.y, note.to.y) + rand(0.22, 0.48),
        (note.from.z + note.to.z) * 0.5
      );
      const mesh = freeNoteMesh();
      if (mesh) {
        mesh.userData.kind = ev.kind;
        mesh.userData.live = true;
        mesh.userData.caught = false;
        mesh.userData.t = 0;
        mesh.userData.flight = flight;
        mesh.userData.text = ev.text;
        mesh.userData.from.copy(note.from);
        mesh.userData.to.copy(note.to);
        mesh.userData.ctrl.copy(note.ctrl);
        mesh.position.copy(note.from);
        mesh.scale.setScalar(0.2);
        mesh.visible = true;
        mesh.userData.grin.visible = ev.kind === "fib" && (ev.smile || spec.smile);
        mesh.userData.wing.visible = ev.kind === "moth";
        mesh.userData.paper.visible = ev.kind !== "moth";
        if (mesh.userData.band) mesh.userData.band.visible = ev.kind !== "moth";
        if (mesh.userData.rim) mesh.userData.rim.visible = ev.kind !== "moth";
        paintNote(mesh, ev.kind);
        setNoteLabel(mesh, ev.text, ev.kind);
        note.mesh = mesh;
      }
    } else {
      if (ev.kind === "fib") note.sx = 0.28 + Math.random() * 0.2;
      else if (ev.kind === "truth") note.sx = 0.52 + Math.random() * 0.2;
      note.ex = note.sx + rand(-0.12, 0.12);
    }
    run.notes.push(note);
    sfx("tray");
  }

  function launchDecoy() {
    if (!world || world.mode !== "3d" || !world.decoy) return;
    world.decoy.visible = true;
    world.decoy.material.opacity = 0.92;
    run.decoyOn = true;
  }

  function hideDecoy() {
    if (world && world.decoy) {
      world.decoy.visible = false;
      world.decoy.material.opacity = 0;
    }
    if (run) run.decoyOn = false;
  }

  function bezier(out, a, b, c, t) {
    const u = 1 - t;
    out.set(
      u * u * a.x + 2 * u * t * b.x + t * t * c.x,
      u * u * a.y + 2 * u * t * b.y + t * t * c.y,
      u * u * a.z + 2 * u * t * b.z + t * t * c.z
    );
  }

  function noteWorldPos(note, out) {
    if (note.mesh) {
      out.copy(note.mesh.position);
      return out;
    }
    bezier(out, note.from, note.ctrl, note.to, clamp(note.t, 0, 1));
    return out;
  }

  function catchRadius() {
    return (run && run.spec && run.spec.radius) || 0.5;
  }

  function catchDist(px, py, pz, bell) {
    const dx = px - bell.x;
    const dy = py - bell.y;
    const dz = (pz - bell.z) * 0.72;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function noteCatchable(note) {
    return !!(note && note.live && !note.caught && note.t >= 0.2 && note.t <= 0.92);
  }

  function trumpetBell() {
    if (world && world.mode === "3d" && world.trumpet) {
      world.trumpet.userData.bellCenter.getWorldPosition(bellW);
      return bellW;
    }
    return null;
  }

  function inBell() {
    if (!run) return null;
    const r = catchRadius();
    if (world && world.mode === "3d") {
      const bell = trumpetBell();
      if (!bell) return null;
      let best = null;
      let bestD = r;
      let bestFib = null;
      let bestFibD = r;
      run.notes.forEach((note) => {
        if (!noteCatchable(note)) return;
        noteWorldPos(note, tmp);
        const d = catchDist(tmp.x, tmp.y, tmp.z, bell);
        if (d < bestD) { bestD = d; best = note; }
        if (note.kind === "fib" && d < bestFibD) { bestFibD = d; bestFib = note; }
      });
      if (bestFib) return bestFib;
      if (!best && run.decoyOn && world.decoy && world.decoy.visible) {
        const ddx = Math.abs(world.trumpet.position.x - world.decoy.position.x);
        const ddy = Math.abs(world.trumpet.position.y - world.decoy.position.y);
        if (ddx < 0.7 && ddy < 0.55 && world.trumpet.position.x < -0.85) {
          return { kind: "decoy", decoy: true };
        }
      }
      return best;
    }
    const canvas = el("whisperCanvas");
    const W = (world && world.w) || (canvas && canvas.clientWidth) || 640;
    const H = (world && world.h) || (canvas && canvas.clientHeight) || 440;
    const tx = run.tx * W;
    const ty = run.ty * H;
    let best = null;
    let bestD = 84;
    let bestFib = null;
    let bestFibD = 84;
    run.notes.forEach((note) => {
      if (!noteCatchable(note)) return;
      const x = lerp(note.sx, note.ex, note.t) * W;
      const y = lerp(note.sy, note.ey, note.t) * H;
      const d = Math.hypot(x - tx, y - ty);
      if (d < bestD) { bestD = d; best = note; }
      if (note.kind === "fib" && d < bestFibD) { bestFibD = d; bestFib = note; }
    });
    return bestFib || best;
  }

  function setRangeHud(kind) {
    const n = el("whisperRange");
    if (!n) return;
    if (!kind) { n.hidden = true; return; }
    n.hidden = false;
    n.classList.toggle("is-truth", kind === "truth");
    n.classList.toggle("is-moth", kind === "moth");
    n.textContent = kind === "fib" ? "ROSE-GOLD FIB — TAP TO SNAP"
      : kind === "truth" ? "CREAM TRUTH — LET IT PASS"
        : kind === "decoy" ? "EMBROIDERY — NOT ROSE-GOLD"
          : "MOTH — DON’T SNAP";
  }

  function setTimer(frac) {
    const fill = el("whisperTimerFill");
    const bar = el("whisperTimer");
    if (bar) bar.hidden = !isLive() || (run.phase !== "volley" && run.phase !== "intro");
    if (fill) fill.style.transform = "scaleX(" + clamp(frac, 0, 1).toFixed(3) + ")";
    if (bar) bar.classList.toggle("is-late", frac < 0.28);
  }

  function flash(bad) {
    const n = el("whisperFlash");
    if (!n) return;
    n.hidden = false;
    n.classList.toggle("is-bad", !!bad);
    window.setTimeout(() => { n.hidden = true; }, 140);
  }

  function reportHud() {
    if (!run) return;
    const spec = run.spec;
    setText("whisperHudRoom", hudLine(spec));
    setText("whisperHudBarker", spec ? spec.barker : DEPTH_COPY.idleHud[0]);
    setText("whisperBarker", spec ? spec.barker : DEPTH_COPY.idleHud[0]);
    setText("depthWhisperCount", String(run.depth | 0));
    setText("depthWhisperScore", String(run.score | 0));
    if (rk() && run.kitRun && typeof rk().reportDepth === "function") {
      try { rk().reportDepth(run.kitRun, run.depth, { name: spec && spec.title, coda: !!(spec && spec.coda) }); } catch (_) { /* */ }
    }
  }

  function popNote(note, good) {
    if (!note || note.caught) return;
    note.caught = true;
    note.live = false;
    if (note.mesh) {
      burst(note.mesh.position.x, note.mesh.position.y, note.mesh.position.z, good ? GOLD : 0xc45a6a);
      note.mesh.visible = false;
      note.mesh.userData.live = false;
    }
    sfx(good ? "cash" : "miss");
  }

  function catchFib(note) {
    popNote(note, true);
    run.remainingFibs -= 1;
    run.score += FIB_SCORE;
    if (run.kitRun) run.kitRun.score = run.score;
    const state = PF.getState();
    if (state) {
      state.whisperCodex = state.whisperCodex || [];
      state.whisperCodex.push({ text: note.text, at: Date.now() });
      if (state.whisperCodex.length > 80) state.whisperCodex.splice(0, 20);
    }
    if (world && world.disc) {
      world.disc.visible = true;
      world.disc.position.y = 0.08;
      world.disc.userData.rise = 1;
    }
    flash(false);
    if (world && world.shelf) {
      const d = world.shelf[Math.min(world.shelf.length - 1, run.depth)];
      if (d) d.material.emissiveIntensity = 0.55;
    }
    if (run.remainingFibs > 0) {
      setText("whisperStatus", "One fib down. Catch the other rose-gold.");
      setText("whisperHudBarker", "One more rose-gold fib still in the air.");
      sfx("tray");
      return;
    }
    run.notes.forEach((n) => {
      if (n.live && n.kind !== "fib") {
        n.live = false;
        if (n.mesh) n.mesh.visible = false;
      }
    });
    run.depth += 1;
    if (run.depth % 5 === 0) run.score += SET_BONUS;
    if (run.kitRun) {
      run.kitRun.depth = run.depth;
      run.kitRun.score = run.score;
    }
    run.phase = "pop";
    run.phaseT = 0;
    reportHud();
    const vo = run.depth >= AUTHORED_COUNT ? AURA_VO.coda : (run.spec.fibN > 1 ? AURA_VO.both : AURA_VO.fib);
    setText("whisperStatus", vo);
    setText("whisperHudBarker", vo);
    if (PF.setAura) PF.setAura(run.depth >= 4 ? "celebrate" : "point");
    sfx("chapter");
  }

  function warnOrDie(reason) {
    if (run.spec && run.spec.grace && !run.graceUsed && run.depth === 0) {
      run.graceUsed = true;
      sfx("flip");
      setText("whisperStatus", AURA_VO.grace);
      setText("whisperHudBarker", AURA_VO.grace);
      beginRound(1);
      return;
    }
    slam(reason);
  }

  function slam(reason) {
    if (!run || run.dying || run.done) return;
    run.dying = true;
    run.alive = false;
    run.phase = "slam";
    run.phaseT = 0;
    run.deathReason = reason;
    sfx("stamp");
    sfx("miss");
    flash(true);
    const slamEl = el("whisperSlam");
    if (slamEl) slamEl.hidden = false;
    const line = reason === "timeout" ? AURA_VO.timeout
      : reason === "missed" ? AURA_VO.missed
        : reason === "moth" ? AURA_VO.moth
          : AURA_VO.believed;
    setText("whisperHudBarker", line);
    if (PF.setAura) PF.setAura("badLuck");
  }

  function finish(reason, cashed) {
    if (!run || run.done) return;
    run.done = true;
    run.alive = false;
    run.dying = false;
    hideDecoy();
    const depth = run.depth | 0;
    const score = run.score | 0;
    const deathReason = reason || run.deathReason || "curtain";
    closeKitRun({
      depth, score, deathReason, cashedOut: !!cashed,
      meta: { secrets: depth, salon: run.spec && run.spec.title },
    });
    const state = PF.getState();
    if (state) {
      state.bestWhisperSecrets = Math.max(state.bestWhisperSecrets || 0, depth);
      state.bestWhisperScore = Math.max(state.bestWhisperScore || 0, score);
      if (typeof PF.saveState === "function") PF.saveState();
    }
    const slamEl = el("whisperSlam");
    if (slamEl && reason === "leave") slamEl.hidden = true;
    const aura = deathReason === "leave" ? AURA_VO.leave
      : deathReason === "souvenir" ? AURA_VO.souvenir
        : deathReason === "timeout" ? AURA_VO.timeout
          : deathReason === "missed" ? AURA_VO.missed
            : deathReason === "moth" ? AURA_VO.moth
              : depth === 0 ? AURA_VO.shallow
                : depth >= AUTHORED_COUNT ? AURA_VO.deep(depth)
                  : AURA_VO.slam;
    const challenge = `Beat my Gossip Booth secrets ${depth} on Penny Fever`;
    if (kit && kit.setMode) kit.setMode(card(), "result");
    const startBtn = el("whisperStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.hidden = false;
      startBtn.textContent = "LEAN AGAIN · 1 demo coin";
    }
    const verdict = el("whisperVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = deathReason === "leave"
        ? `Left the parlor · SECRET ${depth}`
        : (deathReason === "souvenir" ? `SOUVENIR · SECRET ${depth}` : `SECRETS ${depth} · “${aura}”`);
    }
    if (kit && kit.fillResult) {
      kit.fillResult({
        root: "whisperResult",
        depth: "whisperResultDepth",
        score: "whisperResultScore",
        aura: "whisperResultAura",
        copied: "whisperCopied",
      }, {
        depthLine: deathReason === "souvenir" ? `SOUVENIR · SECRET ${depth}` : `SECRETS ${depth}`,
        scoreLine: `SCORE ${score} · ${String(deathReason).toUpperCase()}`,
        auraLine: aura,
      });
    }
    setText("whisperChallengeText", challenge);
    if (PF.setTier) PF.setTier("whisperTier", depth > 0 ? (run.spec && run.spec.coda ? `ENDLESS · SECRET ${depth}` : `SECRET ${depth}`) : (deathReason === "souvenir" ? "SOUVENIR" : "DROP"), depth > 0 || deathReason === "souvenir" ? "perfect" : "miss");
    setText("whisperStatus", deathReason === "leave" ? "Left the parlor." : (deathReason === "souvenir" ? "Souvenir — authored salons locked." : "Curtain stamped DROP."));
    const ok = depth > 0 || deathReason === "souvenir";
    if (ok) {
      if (PF.award) PF.award(Math.max(8, Math.floor(score / 12)), true, "Gossip");
      if (PF.setAura) PF.setAura(depth >= 4 || deathReason === "souvenir" ? "celebrate" : "point");
      if (reason !== "leave" && PF.showBanner) PF.showBanner(true, `SECRET ${depth}`, aura);
    } else {
      if (PF.award) PF.award(0, false, "Gossip drop");
      if (PF.setAura) PF.setAura("badLuck");
      if (reason !== "leave" && PF.showBanner) PF.showBanner(false, "CURTAIN DROP", aura);
    }
    if (PF.refreshNightBoard) PF.refreshNightBoard();
    if (world && world.mode === "3d") {
      world.cam.z = 3.35; world.cam.y = 1.42;
    }
    setRangeHud(null);
  }

  function beginRound(n) {
    const spec = specFor(n);
    if (!spec) {
      finish("souvenir", true);
      return;
    }
    hideDecoy();
    run.spec = spec;
    run.phase = "intro";
    run.phaseT = 0;
    run.spawnT = 0;
    run.snapCd = 0;
    run.swapped = false;
    run.queue = planVolley(spec);
    run.notes = [];
    run.remainingFibs = spec.fibN;
    run.startedAt = 0;
    run.aimX = 0;
    run.aimY = AIM_Y0;
    if (world && world.mode === "3d") {
      world.notes.forEach((o) => { o.visible = false; o.userData.live = false; });
      world.cam.z = spec.close ? 2.72 : 3.08;
      world.cam.y = spec.close ? 1.28 : 1.36;
    }
    reportHud();
    setText("whisperStatus", spec.barker);
    setText("whisperHover", spec.fibN > 1 ? `${spec.fibN} rose-gold fibs this salon` : "");
    sfx("drop");
  }

  function start() {
    if (isLive()) return;
    const slamEl = el("whisperSlam");
    if (slamEl) slamEl.hidden = true;
    if (kit && kit.hideResult) kit.hideResult("whisperResult");
    const verdict = el("whisperVerdict");
    if (verdict) verdict.hidden = true;
    if (typeof PF.spendDemoCoin === "function" && !PF.spendDemoCoin("whisper")) {
      setText("whisperStatus", "Out of demo coins · grant a pass");
      if (PF.refreshNightBoard) PF.refreshNightBoard();
      return;
    }
    let kitRun = null;
    if (rk() && typeof rk().startRun === "function") {
      try { kitRun = rk().startRun({ gameId: GAME_ID, coinCost: 1, feverNode: true }); } catch (_) { kitRun = null; }
    }
    run = {
      alive: true, dying: false, done: false,
      depth: 0, score: 0,
      spec: null, notes: [], queue: [], remainingFibs: 0,
      graceUsed: false, kitRun, phase: "intro", phaseT: 0,
      spawnT: 0, snapCd: 0, swapped: false, decoyOn: false, dwellT: 0, creamWarn: false, mothWarn: false,
      deathReason: "", tx: 0.5, ty: 0.55, aimX: 0, aimY: AIM_Y0,
    };
    if (world && world.shelf) world.shelf.forEach((d) => { d.material.emissiveIntensity = 0; });
    if (kit && kit.setMode) kit.setMode(card(), "play");
    if (PF.focusCard) PF.focusCard("whisperCard", true);
    const startBtn = el("whisperStart");
    if (startBtn) { startBtn.disabled = true; startBtn.hidden = true; startBtn.blur(); }
    const canvas = el("whisperCanvas");
    if (canvas && canvas.focus) {
      try { canvas.focus({ preventScroll: true }); } catch (_) { canvas.focus(); }
    }
    beginRound(1);
    sfx("rack");
  }

  function snap() {
    if (!isLive() || run.phase !== "volley") return;
    if (run.snapCd > 0) return;
    run.snapCd = 0.12;
    if (world && world.mode === "3d" && world.trumpet) world.trumpet.userData.punch = 1;
    const hit = inBell();
    if (!hit) {
      sfx("flip");
      return;
    }
    if (hit.decoy || hit.kind === "decoy") {
      setText("whisperHover", AURA_VO.decoy);
      setText("whisperStatus", AURA_VO.decoy);
      sfx("flip");
      return;
    }
    if (hit.kind === "fib") catchFib(hit);
    else if (hit.kind === "truth") {
      if (!run.creamWarn) {
        run.creamWarn = true;
        sfx("flip");
        setText("whisperHover", "CREAM is a truth. Let it pass.");
        setText("whisperStatus", "Colour-lock: cream = truth. Snap rose-gold only.");
        setText("whisperHudBarker", "CREAM = TRUTH — let it pass. ROSE-GOLD = FIB.");
        return;
      }
      popNote(hit, false);
      warnOrDie("believed");
    } else if (hit.kind === "moth") {
      if (!run.mothWarn) {
        run.mothWarn = true;
        sfx("flip");
        setText("whisperHover", "Moth — noise. Not rose-gold.");
        setText("whisperHudBarker", "Moths are dusty. Snap rose-gold only.");
        return;
      }
      popNote(hit, false);
      warnOrDie("moth");
    }
  }

  function tickNotes(dt) {
    if (!run || run.phase !== "volley") return;
    run.spawnT += dt;
    while (run.queue.length && run.spawnT >= run.queue[0].delay) {
      launch(run.queue.shift(), run.spec);
    }
    const spec = run.spec;
    run.notes.forEach((note) => {
      if (!note.live || note.caught) return;
      note.t += dt / Math.max(0.4, note.flight);
      const t = clamp(note.t, 0, 1);
      if (note.mesh) {
        bezier(tmp, note.from, note.ctrl, note.to, t);
        note.mesh.position.copy(tmp);
        const sc = (t < 0.1 ? t / 0.1 : 1) * 1.22;
        note.mesh.scale.setScalar(sc);
        note.mesh.rotation.z = Math.sin(t * 9 + note.flight) * 0.35;
        note.mesh.rotation.y = Math.sin(t * 5) * 0.4;
        if (note.kind === "fib" && note.mesh.userData.paper) {
          note.mesh.userData.paper.material.emissiveIntensity = 0.5 + Math.sin(performance.now() * 0.01) * 0.22;
        }
        if (note.kind === "moth" && note.mesh.userData.wing) {
          note.mesh.userData.wing.rotation.z = Math.sin(performance.now() * 0.02) * 0.7;
        }
      }
      if (note.t >= 1) {
        note.live = false;
        if (note.mesh) note.mesh.visible = false;
        if (note.kind === "fib" && !note.caught) warnOrDie("missed");
      }
    });
    if (spec && spec.swap && !run.swapped && run.phaseT > spec.timeLimit * 0.38) {
      run.swapped = true;
      if (world && world.gossipers) {
        const homes = world.gossipers.map((g) => g.userData.home.clone());
        const sh = shuffle(homes);
        world.gossipers.forEach((g, i) => g.userData.home.copy(sh[i]));
        sfx("shove");
      }
    }
  }

  function tickGame(dt) {
    if (!run || run.done) return;
    run.phaseT += dt;
    if (run.snapCd > 0) run.snapCd -= dt;
    if (run.phase === "intro") {
      setTimer(1);
      if (run.phaseT >= INTRO_MS / 1000) {
        run.phase = "volley";
        run.phaseT = 0;
        run.spawnT = 0;
        run.startedAt = performance.now();
        if (run.spec && run.spec.decoy) launchDecoy();
      }
      return;
    }
    if (run.phase === "volley" && run.alive) {
      tickNotes(dt);
      if (pointer.down) {
        const held = inBell();
        if (held && held.kind === "fib") {
          run.dwellT = (run.dwellT || 0) + dt;
          if (run.dwellT >= DWELL_SNAP_S) {
            run.dwellT = 0;
            snap();
          }
        } else run.dwellT = 0;
      } else run.dwellT = 0;
      const limit = run.spec.timeLimit || 10;
      const left = 1 - run.phaseT / limit;
      setTimer(left);
      if (left <= 0 && run.remainingFibs > 0) {
        const inflight = run.notes.some((n) => n.live && !n.caught && n.kind === "fib");
        const queued = run.queue.some((e) => e.kind === "fib");
        if (!inflight && !queued) warnOrDie("timeout");
      }
      return;
    }
    if (run.phase === "pop") {
      setTimer(0);
      setRangeHud(null);
      if (run.phaseT >= POP_MS / 1000) {
        const next = specFor(run.depth + 1);
        if (!next) finish("souvenir", true);
        else beginRound(run.depth + 1);
      }
      return;
    }
    if (run.phase === "slam") {
      setTimer(0);
      setRangeHud(null);
      if (run.phaseT >= DEATH_HOLD_MS / 1000) finish(run.deathReason || "curtain");
    }
  }

  function moveTrumpet(dt) {
    if (!run) return;
    const speed = 2.6;
    if (keys.a || keys.arrowleft) run.aimX -= speed * dt;
    if (keys.d || keys.arrowright) run.aimX += speed * dt;
    if (keys.w || keys.arrowup) run.aimY += speed * dt;
    if (keys.s || keys.arrowdown) run.aimY -= speed * dt;
    if (pointer.on) {
      run.aimX = lerp(run.aimX, pointer.x * 1.35, 1 - Math.pow(0.0002, dt));
      run.aimY = lerp(run.aimY, AIM_Y0 + pointer.y * 0.42, 1 - Math.pow(0.0002, dt));
      run.tx = (pointer.x + 1) * 0.5;
      run.ty = (1 - pointer.y) * 0.5;
    } else {
      run.tx = clamp(0.5 + run.aimX * 0.28, 0.08, 0.92);
      run.ty = clamp(0.55 - (run.aimY - AIM_Y0) * 0.5, 0.16, 0.9);
    }
    run.aimX = clamp(run.aimX, -1.45, 1.45);
    run.aimY = clamp(run.aimY, 0.68, 1.52);
    if (world && world.mode === "3d" && world.trumpet) {
      const punch = world.trumpet.userData.punch || 0;
      world.trumpet.userData.punch = Math.max(0, punch - dt * 5);
      const z = (run.spec && run.spec.close ? 1.42 : 1.58) - punch * 0.22;
      world.trumpet.position.x = lerp(world.trumpet.position.x, run.aimX, 1 - Math.pow(0.00008, dt));
      world.trumpet.position.y = lerp(world.trumpet.position.y, run.aimY, 1 - Math.pow(0.00008, dt));
      world.trumpet.position.z = lerp(world.trumpet.position.z, z, 1 - Math.pow(0.012, dt));
      world.trumpet.rotation.z = -run.aimX * 0.14;
      world.trumpet.rotation.x = -0.42 + (AIM_Y0 - run.aimY) * 0.22;
      if (world.trumpetLight) world.trumpetLight.position.copy(world.trumpet.position);
    }
  }

  function animateAura(dt) {
    if (!world || world.mode !== "3d" || !world.aura) return;
    const u = world.aura.userData;
    u.t += dt * (isLive() ? 3.2 : 2.2);
    u.hip.position.y = 0.42 + Math.sin(u.t) * 0.012;
    u.hip.rotation.x = 0.32;
    u.head.rotation.y = Math.sin(u.t * 0.6) * 0.18;
    u.head.rotation.x = -0.22;
    if (isLive()) {
      u.armR.rotation.z = -0.55 + Math.sin(u.t * 2.1) * 0.18;
      u.armR.rotation.x = -0.7;
    } else {
      u.armR.rotation.z = -0.22;
      u.armR.rotation.x = -0.88;
    }
  }

  function tick3d(dt) {
    const w = world;
    const t = performance.now() * 0.001;
    const targetZ = (isLive() && run.spec && run.spec.close) ? 2.78 : (isLive() ? 3.12 : 3.35);
    const targetY = isLive() ? 1.22 : 1.28;
    w.cam.z = lerp(w.cam.z, targetZ, 1 - Math.pow(0.05, dt));
    w.cam.y = lerp(w.cam.y, targetY, 1 - Math.pow(0.06, dt));
    const sway = REDUCE ? 0 : (isLive() ? 0.018 : 0.045);
    const lookX = isLive() && run ? run.aimX * 0.12 : 0;
    w.camera.position.set(w.cam.x + Math.sin(t * 0.45) * sway, w.cam.y, w.cam.z);
    w.camera.lookAt(w.look.x + lookX, w.look.y + Math.sin(t * 0.7) * 0.02, w.look.z);
    const open = !(run && run.phase === "slam");
    const wantL = open ? -1.95 : -0.18;
    const wantR = open ? 1.95 : 0.18;
    const slamK = 1 - Math.exp(-(open ? 5 : 14) * dt);
    w.curtainL.position.x = lerp(w.curtainL.position.x, wantL, slamK);
    w.curtainR.position.x = lerp(w.curtainR.position.x, wantR, slamK);
    if (w.spot) w.spot.intensity = 2.15 + Math.sin(t * 3.2) * 0.22;
    if (w.brassL) w.brassL.intensity = 1.0 + Math.sin(t * 5.1) * 0.15;
    if (w.susan) w.susan.rotation.y += dt * (isLive() ? 0.25 : 0.12);
    animateAura(dt);
    w.gossipers.forEach((g, i) => {
      const u = g.userData;
      u.t += dt;
      g.position.x = lerp(g.position.x, u.home.x, 1 - Math.pow(0.08, dt));
      g.position.z = lerp(g.position.z, u.home.z, 1 - Math.pow(0.08, dt));
      faceCenter(g);
      u.hip.position.y = 0.5 + Math.sin(u.t * 2.2 + i) * 0.012;
      u.head.rotation.y = Math.sin(u.t * 1.4 + i) * 0.15;
      if (u.talking > 0) {
        u.talking -= dt;
        u.head.rotation.x = -0.18;
      } else u.head.rotation.x = 0;
    });
    const mothBoost = (run && run.spec && run.spec.mothN) ? 1.8 : 1;
    w.moths.forEach((m, i) => {
      const u = m.userData;
      u.t += dt * u.s * mothBoost;
      m.position.set(Math.cos(u.t + i) * u.r, u.y + Math.sin(u.t * 1.7) * 0.18, Math.sin(u.t * 0.8 + i) * u.r * 0.6 - 0.2);
    });
    w.letters.forEach((sp, i) => {
      const u = sp.userData;
      u.t += dt * 0.35;
      sp.position.set(Math.cos(u.t + i) * u.r, 1.65 + Math.sin(u.t * 1.3 + i) * 0.45, Math.sin(u.t + i * 0.4) * 1.1);
      sp.material.opacity = isLive() ? 0.2 : 0.5;
    });
    w.fx.forEach((p) => {
      if (!p.visible) return;
      p.userData.life -= dt * 1.6;
      p.position.addScaledVector(p.userData.v, dt);
      p.userData.v.y -= 2.4 * dt;
      p.scale.setScalar(Math.max(0.01, p.userData.life));
      if (p.userData.life <= 0) p.visible = false;
    });
    if (w.disc && w.disc.userData.rise) {
      w.disc.userData.rise -= dt;
      w.disc.position.y = 0.08 + (1 - Math.max(0, w.disc.userData.rise)) * 0.22;
      w.disc.rotation.y += dt * 4;
      if (w.disc.userData.rise <= 0) { w.disc.userData.rise = 0; w.disc.visible = false; }
    }
    if (isLive()) moveTrumpet(dt);
    else if (w.trumpet) {
      w.trumpet.position.x = Math.sin(t * 0.6) * 0.12;
      w.trumpet.position.y = AIM_Y0 + Math.sin(t * 1.1) * 0.03;
      w.trumpet.position.z = 1.58;
      w.trumpet.rotation.x = -0.42;
    }
    const glow = w.trumpet && w.trumpet.userData.glow;
    let rangeKind = "";
    if (isLive() && run.phase === "volley") {
      const hit = inBell();
      rangeKind = hit ? (hit.kind || (hit.decoy ? "decoy" : "")) : "";
      if (hit && hit.kind === "fib") setText("whisperHover", "ROSE-GOLD · FIB");
      else if (hit && hit.kind === "truth") setText("whisperHover", "CREAM · TRUTH — let pass");
      else if (hit && hit.kind === "moth") setText("whisperHover", "MOTH · noise");
      else if (hit && hit.decoy) setText("whisperHover", "EMBROIDERY — not rose-gold");
      else setText("whisperHover", run.spec && run.spec.fibN > 1 ? `${run.remainingFibs} rose-gold fib${run.remainingFibs === 1 ? "" : "s"} left` : "");
    } else if (!(run && run.phase === "intro")) setText("whisperHover", "");
    setRangeHud(isLive() && run.phase === "volley" ? rangeKind : "");
    if (glow) {
      if (rangeKind === "fib") {
        glow.material.color.setHex(FIB_COL);
        glow.material.opacity = 0.78;
      } else if (rangeKind === "truth") {
        glow.material.color.setHex(TRUTH_COL);
        glow.material.opacity = 0.5;
      } else if (rangeKind === "moth" || rangeKind === "decoy") {
        glow.material.color.setHex(0xe8c878);
        glow.material.opacity = 0.35;
      } else {
        glow.material.opacity = lerp(glow.material.opacity, isLive() ? 0.12 : 0.06, 0.2);
        glow.material.color.setHex(GOLD);
      }
    }
    if (w.trumpetLight) w.trumpetLight.intensity = rangeKind === "fib" ? 1.6 : 0.2;
    w.renderer.render(w.scene, w.camera);
  }

  function tick2d() {
    const canvas = el("whisperCanvas");
    if (!canvas || !world.ctx) return;
    const ctx = world.ctx;
    const W = world.w || canvas.clientWidth;
    const H = world.h || canvas.clientHeight;
    ctx.fillStyle = "#14080e";
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H * 0.35, 20, W / 2, H * 0.4, H * 0.7);
    g.addColorStop(0, "#4a1a28");
    g.addColorStop(1, "#14080e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#2a1810";
    ctx.beginPath();
    ctx.ellipse(W / 2, H * 0.78, W * 0.38, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1e6b3c";
    ctx.beginPath(); ctx.ellipse(W / 2, H * 0.46, 34, 50, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f0c4a8";
    ctx.beginPath(); ctx.arc(W / 2, H * 0.32, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e8b84a";
    ctx.beginPath(); ctx.arc(W / 2, H * 0.25, 12, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#d22b3a";
    ctx.fillRect(W / 2 - 4, H * 0.24, 8, 8);
    ctx.fillStyle = "#3d2418";
    ctx.beginPath(); ctx.arc(W / 2 - 18, H * 0.36, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W / 2 + 18, H * 0.36, 8, 0, Math.PI * 2); ctx.fill();
    const tx = (run ? run.tx : 0.5) * W;
    const ty = (run ? run.ty : 0.62) * H;
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(tx, ty, 46, 32, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx + 40, ty + 10);
    ctx.lineTo(tx + 70, ty + 38);
    ctx.stroke();
    if (run && run.notes) {
      run.notes.forEach((it) => {
        if (!it.live) return;
        const x = lerp(it.sx, it.ex, clamp(it.t, 0, 1)) * W;
        const y = lerp(it.sy, it.ey, clamp(it.t, 0, 1)) * H;
        ctx.fillStyle = it.kind === "fib" ? "#c45a6a" : it.kind === "moth" ? "rgba(40,28,12,0.88)" : "#f4ead8";
        roundRect(ctx, x - 88, y - 28, 176, 56, 12);
        ctx.fill();
        ctx.strokeStyle = it.kind === "fib" ? "#e8b84a" : it.kind === "moth" ? "#8a7040" : "#e8d8c0";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = it.kind === "fib" ? "#2a0810" : it.kind === "moth" ? "#f0d09a" : "#3a2418";
        ctx.font = "800 14px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(it.kind === "moth" ? "MOTH" : (it.kind === "fib" ? "ROSE-GOLD FIB" : "CREAM TRUTH"), x, y + 4);
      });
    }
    const open = !(run && run.phase === "slam");
    ctx.fillStyle = "#6a2030";
    ctx.fillRect(0, 0, open ? 28 : W * 0.46, H);
    ctx.fillRect(open ? W - 28 : W * 0.54, 0, open ? 28 : W * 0.46, H);
    if (isLive()) moveTrumpet(0.016);
    const hit = isLive() && run.phase === "volley" ? inBell() : null;
    setRangeHud(hit ? hit.kind : "");
  }

  function frame(ts) {
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    tickGame(dt);
    if (world && world.mode === "3d") tick3d(dt);
    else tick2d(dt);
    if (shown) raf = requestAnimationFrame(frame);
  }

  function startLoop() {
    shown = true;
    ensureWorld();
    resize();
    if (!raf) {
      lastTs = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  function stopLoop() {
    shown = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function ndcFromEvent(ev) {
    const canvas = el("whisperCanvas");
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const tch = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]) || ev;
    pointer.x = ((tch.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    pointer.y = -((tch.clientY - r.top) / Math.max(1, r.height)) * 2 + 1;
    pointer.on = true;
    pointer.px = tch.clientX - r.left;
    pointer.py = tch.clientY - r.top;
  }

  function onPointerMove(ev) {
    ndcFromEvent(ev);
    if (pointer.down) {
      pointer.drag = Math.hypot(pointer.px - pointer.downX, pointer.py - pointer.downY);
    }
  }
  function onPointerDown(ev) {
    if (ev.target && ev.target.id === "whisperSnap") return;
    ndcFromEvent(ev);
    if (!isLive()) {
      if (card() && (card().classList.contains("is-vestibule") || card().classList.contains("is-result"))) start();
      return;
    }
    if (run.dying || run.done) return;
    ev.preventDefault();
    pointer.down = true;
    pointer.drag = 0;
    pointer.id = ev.pointerId;
    pointer.downX = pointer.px;
    pointer.downY = pointer.py;
    pointer.downAt = performance.now();
    if (run) run.dwellT = 0;
    try {
      if (ev.currentTarget && ev.currentTarget.setPointerCapture) ev.currentTarget.setPointerCapture(ev.pointerId);
    } catch (_) { /* */ }
  }
  function onPointerUp(ev) {
    if (!pointer.down) return;
    const drag = pointer.drag;
    pointer.down = false;
    pointer.id = null;
    try {
      if (ev.currentTarget && ev.currentTarget.releasePointerCapture && ev.pointerId != null) {
        ev.currentTarget.releasePointerCapture(ev.pointerId);
      }
    } catch (_) { /* */ }
    if (!isLive()) return;
    ndcFromEvent(ev);
    if (drag < 28) {
      ev.preventDefault();
      snap();
    }
  }

  function onKeyDown(ev) {
    if (!shown) return;
    const k = ev.key.toLowerCase();
    keys[k] = true;
    if (k === "arrowleft") keys.arrowleft = true;
    if (k === "arrowright") keys.arrowright = true;
    if (k === "arrowup") keys.arrowup = true;
    if (k === "arrowdown") keys.arrowdown = true;
    if ([" ", "enter", "arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"].indexOf(k) !== -1 || ev.key === " ") {
      ev.preventDefault();
    }
    if (!isLive() && (ev.key === "Enter" || ev.key === " ")) {
      start();
      return;
    }
    if (!isLive()) return;
    if (ev.key === " " || k === "enter") snap();
  }
  function onKeyUp(ev) {
    const k = ev.key.toLowerCase();
    keys[k] = false;
    if (k === "arrowleft") keys.arrowleft = false;
    if (k === "arrowright") keys.arrowright = false;
    if (k === "arrowup") keys.arrowup = false;
    if (k === "arrowdown") keys.arrowdown = false;
  }

  PF.registerVendor({
    id: "whisper",
    playKey: "whisper",
    chalk: "ONE THUMB — DRAG THE TRUMPET · TAP ROSE-GOLD",
    defaults: { bestWhisperSecrets: 0, bestWhisperScore: 0, whisperCodex: [] },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopLoop();
    },
    onShow() {
      declareP0();
      stampDepthCopy();
      startLoop();
      const canvas = el("whisperCanvas");
      if (canvas && canvas.focus) {
        try { canvas.focus({ preventScroll: true }); } catch (_) { canvas.focus(); }
      }
    },
    onReset() {
      if (run && !run.done && (run.alive || run.dying)) finish("leave");
      run = null;
      const verdict = el("whisperVerdict");
      if (verdict) verdict.hidden = true;
      if (kit && kit.hideResult) kit.hideResult("whisperResult");
      const slamEl = el("whisperSlam");
      if (slamEl) slamEl.hidden = true;
      const startBtn = el("whisperStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.hidden = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      if (kit && kit.setMode) kit.setMode(card(), "vestibule");
      stampDepthCopy();
      if (shown) startLoop();
    },
    refreshDepth(state) {
      const playing = isLive() || !!(run && run.dying);
      setText("depthWhisperCount", playing ? String(run.depth | 0) : "0");
      setText("depthWhisperScore", playing ? String(run.score | 0) : "0");
      const bestN = Math.max(state.bestWhisperSecrets || 0, (state.bestDepth && state.bestDepth.whisper) || 0);
      const bestS = state.bestWhisperScore || 0;
      setText("depthWhisperBest", bestN ? String(bestN) : "—");
      setText("depthWhisperBestScore", bestS ? String(bestS) : "—");
    },
    bind() {
      declareP0();
      const startBtn = el("whisperStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const snapBtn = el("whisperSnap");
      if (snapBtn) {
        snapBtn.addEventListener("pointerdown", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          ndcFromEvent(ev);
          snap();
        });
      }
      const stage = el("whisperStage");
      const canvas = el("whisperCanvas");
      if (canvas) canvas.style.touchAction = "none";
      const surface = stage || canvas;
      if (surface) {
        surface.style.touchAction = "none";
        surface.addEventListener("pointermove", onPointerMove);
        surface.addEventListener("pointerdown", onPointerDown);
        surface.addEventListener("pointerup", onPointerUp);
        surface.addEventListener("pointercancel", onPointerUp);
      }
      const challenge = el("whisperChallenge");
      if (challenge) {
        challenge.addEventListener("click", () => {
          const text = (el("whisperChallengeText") && el("whisperChallengeText").textContent) || "Beat my Gossip Booth on Penny Fever";
          if (kit && kit.copyText) {
            kit.copyText(text, () => { const c = el("whisperCopied"); if (c) c.hidden = false; });
          }
        });
      }
      if (stage && window.ResizeObserver) {
        new ResizeObserver(() => resize()).observe(stage);
      }
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      stampDepthCopy();
    },
  });

  window.__whisperDbg = function whisperDbg() {
    const bell = trumpetBell();
    const notes = (run && run.notes) ? run.notes.filter((n) => n.live && !n.caught).map((n) => {
      const p = n.mesh ? n.mesh.position : n.to;
      const d = bell ? catchDist(p.x, p.y, p.z, bell) : null;
      return { kind: n.kind, t: +n.t.toFixed(2), x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), d: d == null ? null : +d.toFixed(2) };
    }) : [];
    return {
      phase: run && run.phase,
      depth: run && (run.depth | 0),
      remaining: run && run.remainingFibs,
      alive: isLive(),
      dying: !!(run && run.dying),
      radius: catchRadius(),
      aim: run ? { x: +run.aimX.toFixed(2), y: +run.aimY.toFixed(2) } : null,
      bell: bell ? { x: +bell.x.toFixed(2), y: +bell.y.toFixed(2), z: +bell.z.toFixed(2) } : null,
      notes,
    };
  };
  window.__whisperAim = function whisperAim(x, y) {
    if (!run) return;
    run.aimX = clamp(x, -1.45, 1.45);
    run.aimY = clamp(y, 0.68, 1.52);
    pointer.on = false;
  };
  window.__whisperSnap = snap;
})();
