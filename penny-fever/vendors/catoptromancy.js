/* Catoptromancy — Mercury Gallery. Desktop Grok owns this doorway.
 * PF only. Never booth/port 6000. Never Imagine. No Mirror Crew.
 * Full 3D tent game (not KEEP/BURN/DOUBLE, not a UI slider).
 * Aim ON the matching glass. Hold the gaze. Look away = death.
 * Liars crack. Fog lies. Aura locked look if she appears.
 * 8 authored rooms then ENDLESS. One coin = one run. Family-safe carnival. */
import * as THREE from "../world/lib/three.module.min.js";

function boot() {
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) {
    requestAnimationFrame(boot);
    return;
  }
  mountStall(PF);
}
boot();

function mountStall(PF) {
  "use strict";
  const { $, kit } = PF;

  const GAME_ID = "catoptromancy";
  const CABINET_ID = "cabinet-catoptromancy";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const DEATH_HOLD_MS = 820;
  const ARRIVE_MS = 380;
  const SWITCH_GRACE_MS = 920;
  const STICKY_R = 0.72;
  const STRIKE_LIMIT = 3;
  const TRUE_SCORE = 260;
  const ROOM_BONUS = 380;
  const COMBO = 90;
  const ORB_R = 0.08;
  const RING_R = 2.28;
  const CAM_DIST = 5.85;
  const CAM_Y = 1.92;
  const REDUCE = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;
  const SHOE = 0x141414;
  const BRASS = 0xd4a45a;

  const SIGILS = [
    { id: "moon", name: "Moon", glyph: "☽", hex: "#9ab0c8" },
    { id: "heart", name: "Heart", glyph: "♥", hex: "#e8a0b8" },
    { id: "crown", name: "Crown", glyph: "♛", hex: "#f4d078" },
    { id: "rose", name: "Rose", glyph: "❀", hex: "#c45a6a" },
    { id: "eye", name: "Eye", glyph: "◎", hex: "#7ee0c0" },
    { id: "moth", name: "Moth", glyph: "✧", hex: "#b48cff" },
    { id: "key", name: "Key", glyph: "⚷", hex: "#d4a45a" },
    { id: "star", name: "Star", glyph: "★", hex: "#f0e6d0" },
  ];

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Catoptromancy Mercury Gallery",
    depthUnit: "Room",
    sheet: "GOBLIN_AUTHORED_LEVELS_B03.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const AUTHORED = [
    {
      id: 1, title: "First Gaze", kind: "teach",
      count: 3, trues: 1, waitMs: 2100, breakLimitMs: 1400, orbit: 0, flickerMs: 0, spin: 0,
      fog: false, decoy: false, auraHint: false, candles: true, altar: false,
      barker: "Point at the matching glass. HOLD on it. Look away after you start and the glass takes you.",
    },
    {
      id: 2, title: "Carousel Chamber", kind: "orbit",
      count: 5, trues: 1, waitMs: 2300, breakLimitMs: 1100, orbit: 0.16, flickerMs: 0, spin: 0,
      fog: false, decoy: false, auraHint: false, candles: true, altar: false,
      barker: "The glass waltzes. Track it with your pointer. Looking away still kills.",
    },
    {
      id: 3, title: "Twin Pane", kind: "twin",
      count: 6, trues: 2, waitMs: 2000, breakLimitMs: 1000, orbit: 0.12, flickerMs: 0, spin: 0,
      fog: false, decoy: false, auraHint: false, candles: true, altar: false,
      barker: "Two true panes. Open one, then the other. A short grace — then don’t look away.",
    },
    {
      id: 4, title: "Lie Flicker", kind: "flicker",
      count: 5, trues: 1, waitMs: 2500, breakLimitMs: 920, orbit: 0.11, flickerMs: 1400, spin: 0,
      fog: false, decoy: false, auraHint: false, candles: true, altar: false,
      barker: "The eye flashes a lie. Hold through. Flinching off the glass is looking away.",
    },
    {
      id: 5, title: "Turning Glass", kind: "spin",
      count: 6, trues: 1, waitMs: 2400, breakLimitMs: 980, orbit: 0.09, flickerMs: 0, spin: 0.82,
      fog: false, decoy: false, auraHint: false, candles: false, altar: false,
      barker: "Only the face counts as a look. The back is already looking away.",
    },
    {
      id: 6, title: "Hazy Choir", kind: "haze",
      count: 7, trues: 2, waitMs: 2300, breakLimitMs: 880, orbit: 0.18, flickerMs: 0, spin: 0,
      fog: true, decoy: false, auraHint: false, candles: true, altar: false,
      barker: "Fog hides the glow. Read the glyph and stay on it. Two trues.",
    },
    {
      id: 7, title: "Aura’s Glance", kind: "hint",
      count: 6, trues: 1, waitMs: 2200, breakLimitMs: 840, orbit: 0.2, flickerMs: 0, spin: 0,
      fog: false, decoy: false, auraHint: true, candles: true, altar: false,
      barker: "Aura points — then walks off. Stay on the glass she named.",
    },
    {
      id: 8, title: "Burner’s Altar", kind: "altar",
      count: 8, trues: 2, waitMs: 2400, breakLimitMs: 780, orbit: 0.22, flickerMs: 1600, spin: 0.28,
      fog: false, decoy: true, auraHint: false, candles: true, altar: true,
      barker: "Decoy flash is a liar. Two trues. Looking away is still death.",
    },
  ];

  const AURA_LINE = {
    teach: "Aura: First glass. You found the matching eye.",
    liar: "Aura: That pane lied. The basin already told you the sigil.",
    spent: "Aura: Gazes gone and the eye still shut. The wait is over — you spent them.",
    looked: "Aura: You looked away. The glass noticed.",
    lookedShallow: "Aura: Not one room. The wait is the game.",
    strike: "Aura: Three liars. The gallery closed its faces.",
    flicker: "Aura: You shot the old eye. The sigil had already jumped.",
    spin: "Aura: You kissed the back of the glass. Faces only.",
    haze: "Aura: Fog isn’t a skip. The glyph was still there.",
    decoy: "Aura: Pretty flash. Wrong pane.",
    shallow: "Aura: Not one room. The gallery noticed.",
    mid: "Aura: Cute rooms. The glass still wants a statue who can aim.",
    deep: "Aura: You read the glass like a local. Dangerous.",
    coda: "Aura: Authored glass is done. ENDLESS haze. Keep reading.",
    souvenir: "Aura: Authored gallery locked. Souvenir — the wait was the fortune.",
    leave: "Aura: Walking off mid-gaze? Colour stays in the tent.",
    twin: "Aura: Twin pane. You left one eye dark.",
    hint: "Aura: I pointed. You looked at the fire instead.",
  };

  let run = null;
  let world = null;
  let raf = 0;
  let lastTs = 0;
  let visible = false;
  let pointerNdc = { x: 0, y: 0 };
  let pointerOver = false;
  let pointerHeld = false;
  const pointerIds = new Set();
  let lookHeld = 0;
  let keys = { l: false, r: false };
  const _v = new THREE.Vector3();
  const _v2 = new THREE.Vector3();
  const _n = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.52);

  function rk() { return PF.runKit || null; }
  function el(id) { return $(id); }
  function setText(id, text) {
    const n = el(id);
    if (n) n.textContent = text;
  }
  function card() { return el("catopCard"); }
  function cabinetOn() {
    const n = document.getElementById(CABINET_ID);
    return !!(n && !n.hidden);
  }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function hexInt(hex) { return parseInt(String(hex).replace("#", ""), 16); }
  function sigilById(id) { return SIGILS.find((s) => s.id === id) || SIGILS[0]; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sfx(name) { try { if (kit && kit.sfx) kit.sfx(name); } catch (_) { /* */ } }

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function stageParams(n) {
    const room = Math.max(1, n | 0);
    if (room <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[room - 1]);
    if (!CODA_ENABLED) return null;
    const t = room - AUTHORED_COUNT;
    return {
      id: room, title: `Hazy Oracle ${room}`, kind: "coda",
      count: Math.min(10, 6 + ((t / 2) | 0)),
      trues: t % 3 === 0 ? 3 : 2,
      waitMs: Math.min(4200, 2500 + 140 * t),
      breakLimitMs: Math.max(420, 760 - 18 * t),
      orbit: Math.min(0.48, 0.2 + t * 0.028),
      flickerMs: t % 2 === 0 ? Math.max(900, 1600 - t * 80) : 0,
      spin: t % 3 === 0 ? 0.9 + t * 0.04 : (t % 2 === 0 ? 0.35 : 0),
      fog: t % 4 === 0, decoy: t > 1, auraHint: t % 5 === 0,
      candles: true, altar: t % 2 === 1, coda: true,
      barker: "ENDLESS haze. Hold the matching glass. Looking away still kills.",
    };
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function texFromCanvas(canvas, repeat) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    if (repeat) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
    }
    tex.needsUpdate = true;
    return tex;
  }
  function makeMat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.62, metalness: 0.08,
    }, extra || {}));
  }
  function meshOf(geo, mat, x, y, z, sx, sy, sz) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (sx != null) m.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
    return m;
  }

  function tentCanvas() {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");
    g.fillStyle = "#1a0c18";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 16; i++) {
      g.fillStyle = i % 2 ? "#2a1428" : "#140810";
      g.fillRect(i * 32, 0, 32, 512);
    }
    g.fillStyle = "rgba(212,164,90,0.2)";
    for (let i = 0; i < 16; i++) g.fillRect(i * 32 + 30, 0, 2, 512);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(240,208,154,${0.08 + Math.random() * 0.22})`;
      g.fillRect((Math.random() * 512) | 0, (Math.random() * 512) | 0, 2, 2);
    }
    return c;
  }
  function woodCanvas() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#2a1810";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 12; i++) {
      g.fillStyle = i % 2 ? "#3a2418" : "#24140c";
      g.fillRect(0, i * 22, 256, 20);
      g.fillStyle = "rgba(212,164,90,0.08)";
      g.fillRect(0, i * 22 + 18, 256, 1);
    }
    return c;
  }
  function rugCanvas() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    grd.addColorStop(0, "#5a2040");
    grd.addColorStop(0.55, "#3a1428");
    grd.addColorStop(1, "#12080c");
    g.fillStyle = grd;
    g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#d4a45a"; g.lineWidth = 6;
    g.beginPath(); g.arc(128, 128, 118, 0, Math.PI * 2); g.stroke();
    return c;
  }

  function paintGlass(ctx, o) {
    const W = 256; const H = 256;
    ctx.fillStyle = "#0c1016";
    ctx.fillRect(0, 0, W, H);
    const shown = o.open ? 1 : (o.fill != null ? o.fill : (o.lit ? 0.55 : 0.22));
    const hex = o.hex || "#c8d4dc";
    const base = ctx.createRadialGradient(128, 108, 6, 128, 128, 140);
    base.addColorStop(0, o.lit ? hex : "#7a8894");
    base.addColorStop(0.42, o.lit ? "#3a4450" : "#2a3038");
    base.addColorStop(1, "#080a10");
    ctx.fillStyle = base;
    ctx.beginPath(); ctx.arc(128, 128, 126, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 7; i++) {
      const r = 20 + i * 14 + Math.sin((o.t || 0) * 1.1 + i) * 4;
      ctx.strokeStyle = `rgba(210,224,232,${0.04 + i * 0.012})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(128, 128, r, 0, Math.PI * 2); ctx.stroke();
    }
    const irisR = 12 + shown * 78;
    const ig = ctx.createRadialGradient(128, 116, 4, 128, 128, irisR);
    ig.addColorStop(0, hex);
    ig.addColorStop(0.45, hex);
    ig.addColorStop(1, "rgba(8,8,12,0)");
    ctx.fillStyle = ig;
    ctx.beginPath(); ctx.arc(128, 128, irisR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = o.lit ? "rgba(255,248,236,0.92)" : "rgba(220,210,190,0.38)";
    ctx.font = "bold 84px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = o.lit ? hex : "transparent";
    ctx.shadowBlur = o.lit ? 18 : 0;
    ctx.fillText(o.glyph || "◎", 128, 136);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath(); ctx.ellipse(104, 96, 18, 9, -0.6, 0, Math.PI * 2); ctx.fill();
    if (o.fog) {
      ctx.fillStyle = "rgba(186,196,206,0.38)";
      ctx.fillRect(0, 0, W, H);
    }
    if (o.flash) {
      ctx.fillStyle = `rgba(255,248,236,${Math.min(1, o.flash)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (o.crack) {
      ctx.strokeStyle = "rgba(8,4,10,0.92)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(128, 14); ctx.lineTo(112, 96); ctx.lineTo(164, 150); ctx.lineTo(98, 248);
      ctx.moveTo(112, 96); ctx.lineTo(44, 176);
      ctx.moveTo(164, 150); ctx.lineTo(222, 214);
      ctx.stroke();
    }
    if (o.back) {
      ctx.fillStyle = "rgba(10,8,12,0.72)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  function paintBasin(ctx, o) {
    const W = 256; const H = 256;
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
    g.addColorStop(0, o.hex || "#c8d4dc");
    g.addColorStop(0.45, "#4a6070");
    g.addColorStop(1, "#0a1016");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff6e4";
    ctx.font = "bold 110px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = o.hex || "#c8d4dc";
    ctx.shadowBlur = 22;
    ctx.fillText(o.glyph || "◎", 128, 140);
    ctx.shadowBlur = 0;
    const t = o.t || 0;
    ctx.strokeStyle = "rgba(232,220,190,0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(128, 128, 96 + Math.sin(t * 2) * 4, 0, Math.PI * 2); ctx.stroke();
  }

  function makeMercuryDisc() {
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext("2d");
    paintGlass(ctx, { t: 0, lit: false, glyph: "◎", hex: "#c8d4dc" });
    const tex = texFromCanvas(canvas);
    const mat = new THREE.MeshStandardMaterial({
      map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.28,
      metalness: 0.72, roughness: 0.22, side: THREE.DoubleSide,
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 28), mat);
    disc.scale.set(0.7, 1.02, 1);
    const hit = new THREE.Mesh(
      new THREE.CircleGeometry(1.45, 16),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    );
    disc.add(hit);
    return { canvas, ctx, tex, mat, disc, hit };
  }

  function makeStandingGlass(merc, accent) {
    const g = new THREE.Group();
    const brass = makeMat(BRASS, { metalness: 0.82, roughness: 0.28, emissive: 0x4a3008, emissiveIntensity: 0.22 });
    const dark = makeMat(0x1a1014, { metalness: 0.4, roughness: 0.5 });
    const gem = makeMat(accent || HEART, { emissive: accent || HEART, emissiveIntensity: 0.55, roughness: 0.3 });
    g.add(meshOf(world.geos.cyl, dark, 0, 0.08, 0, 0.38, 0.1, 0.38));
    g.add(meshOf(world.geos.cyl, brass, 0, 0.46, 0, 0.08, 0.72, 0.08));
    g.add(meshOf(world.geos.box, brass, 0, 0.84, 0, 0.5, 0.06, 0.1));
    const frame = new THREE.Mesh(world.geos.torus, brass);
    frame.position.set(0, 1.52, 0);
    frame.scale.set(0.7, 1.05, 0.7);
    g.add(frame);
    merc.disc.position.set(0, 1.52, 0.02);
    g.add(merc.disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.02, 8, 28), new THREE.MeshBasicMaterial({
      color: 0xe8a0b8, transparent: true, opacity: 0.15,
    }));
    ring.position.set(0, 1.52, 0.12);
    ring.scale.set(0.86, 1.22, 1);
    g.add(ring);
    const gemL = meshOf(world.geos.sphere, gem, -0.4, 2.2, 0, 0.05);
    const gemR = meshOf(world.geos.sphere, gem, 0.4, 2.2, 0, 0.05);
    g.add(gemL); g.add(gemR);
    g.userData.ring = ring;
    g.userData.mercury = merc;
    return g;
  }

  function makeAura() {
    const g = new THREE.Group();
    const geos = world.geos;
    const skin = makeMat(SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const blouse = makeMat(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.18 });
    const dress = makeMat(DRESS, { emissive: 0x0a2010, emissiveIntensity: 0.28 });
    const hairM = makeMat(HAIR, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });
    const gold = makeMat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const heart = makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.65, roughness: 0.35 });
    const shoe = makeMat(SHOE, { metalness: 0.55, roughness: 0.22 });
    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(meshOf(geos.cyl, blouse, 0, 0.28, 0, 0.13, 0.28, 0.13));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.13, 0.34, 12), dress);
    skirt.position.y = 0.06;
    hip.add(skirt);
    const heartGem = meshOf(geos.box, heart, 0, 0.22, 0.15, 0.09, 0.09, 0.04);
    heartGem.rotation.z = Math.PI / 4;
    hip.add(heartGem);
    const head = new THREE.Group();
    head.position.y = 0.62;
    hip.add(head);
    head.add(meshOf(geos.sphere, skin, 0, 0.02, 0, 0.2));
    const eyeW = makeMat(0xf7f2ea);
    const eyeD = makeMat(0x2a1810);
    [-1, 1].forEach((side) => {
      const w = meshOf(geos.sphere, eyeW, side * 0.06, 0.03, 0.16, 0.038);
      w.scale.set(0.038, 0.046, 0.02);
      head.add(w);
      head.add(meshOf(geos.sphere, eyeD, side * 0.06, 0.03, 0.175, 0.02));
    });
    head.add(meshOf(geos.sphere, hairM, 0, 0.06, -0.02, 0.22));
    [-1, 1].forEach((side) => {
      head.add(meshOf(geos.sphere, hairM, side * 0.2, -0.05, 0.04, 0.11));
      head.add(meshOf(geos.sphere, heart, side * 0.2, 0.05, 0.06, 0.045));
    });
    head.add(meshOf(geos.box, hairM, 0, 0.14, 0.16, 0.28, 0.07, 0.1));
    const crown = new THREE.Group();
    crown.position.y = 0.24;
    head.add(crown);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold);
    hoop.rotation.x = Math.PI / 2;
    crown.add(hoop);
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, h, 6), gold);
      spike.position.set(x, h * 0.45, 0);
      crown.add(spike);
    });
    const gem = meshOf(geos.box, heart, 0, 0.02, 0.11, 0.055, 0.055, 0.025);
    gem.rotation.z = Math.PI / 4;
    crown.add(gem);
    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.17 : 0.08), arm ? 0.38 : 0.0, 0);
      const len = arm ? 0.28 : 0.34;
      const bone = meshOf(geos.cyl, arm ? skin : dress, 0, -len / 2, 0, arm ? 0.035 : 0.042, len, arm ? 0.035 : 0.042);
      pivot.add(bone);
      if (!arm) pivot.add(meshOf(geos.box, shoe, 0, -len - 0.02, 0.03, 0.08, 0.05, 0.12));
      else pivot.add(meshOf(geos.sphere, skin, 0, -len, 0, 0.04));
      hip.add(pivot);
      return pivot;
    }
    g.userData = {
      kind: "aura", head, hip,
      armL: limb(-1, true), armR: limb(1, true),
      legL: limb(-1, false), legR: limb(1, false),
    };
    g.scale.setScalar(1.12);
    return g;
  }

  function makeLantern() {
    const g = new THREE.Group();
    const brass = makeMat(BRASS, { metalness: 0.85, roughness: 0.25, emissive: 0x5a3808, emissiveIntensity: 0.35 });
    g.add(meshOf(world.geos.cyl, brass, 0, 0.08, 0, 0.16, 0.06, 0.16));
    g.add(meshOf(world.geos.box, brass, 0, 0.28, 0, 0.22, 0.32, 0.22));
    const glass = new THREE.Mesh(world.geos.box, new THREE.MeshStandardMaterial({
      color: 0xffe2a0, emissive: 0xffc878, emissiveIntensity: 0.9, transparent: true, opacity: 0.7,
    }));
    glass.position.y = 0.28;
    glass.scale.set(0.16, 0.26, 0.16);
    g.add(glass);
    g.add(meshOf(world.geos.cyl, brass, 0, 0.5, 0, 0.12, 0.05, 0.12));
    const flame = meshOf(world.geos.sphere, new THREE.MeshBasicMaterial({ color: 0xffe2a0 }), 0, 0.3, 0, 0.07);
    g.add(flame);
    g.userData.flame = flame;
    g.userData.glass = glass;
    return g;
  }

  function makeCandle(flameMat) {
    const g = new THREE.Group();
    g.add(meshOf(world.geos.cyl, makeMat(0xf0e6d0, { emissive: 0x3a3020, emissiveIntensity: 0.15 }), 0, 0.12, 0, 0.035, 0.24, 0.035));
    const flame = meshOf(world.geos.sphere, flameMat, 0, 0.28, 0, 0.04);
    g.add(flame);
    g.userData.flame = flame;
    return g;
  }

  function buildWorld(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: (window.devicePixelRatio || 1) < 1.6, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.setClearColor(0x0a0610, 1);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0610);
    scene.fog = new THREE.FogExp2(0x0a0610, 0.036);
    const camera = new THREE.PerspectiveCamera(48, 1, 0.08, 48);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    camera.position.set(0, CAM_Y, CAM_DIST);
    camera.lookAt(0, 1.38, -0.85);

    scene.add(new THREE.AmbientLight(0x3a2848, 0.4));
    scene.add(new THREE.HemisphereLight(0x6a5088, 0x1a1008, 0.62));
    const moon = new THREE.DirectionalLight(0xa8c4e8, 0.34);
    moon.position.set(-4, 6, 3);
    scene.add(moon);
    const key = new THREE.PointLight(0xffc878, 1.55, 12, 1.5);
    key.position.set(0.1, 2.7, 1.4);
    scene.add(key);
    const glassGlow = new THREE.PointLight(0xb48cff, 1.4, 8, 1.6);
    glassGlow.position.set(0, 1.4, -0.2);
    scene.add(glassGlow);
    const fireLight = new THREE.PointLight(0xff6a22, 0, 7, 1.5);
    fireLight.position.set(0, 0.8, -0.15);
    scene.add(fireLight);
    const lanternLight = new THREE.PointLight(0xffe2a0, 1.8, 6, 1.8);
    lanternLight.position.set(0, 1.2, 2.2);
    scene.add(lanternLight);

    const geos = {
      box: new THREE.BoxGeometry(1, 1, 1),
      sphere: new THREE.SphereGeometry(1, 16, 12),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
      torus: new THREE.TorusGeometry(1, 0.07, 10, 28),
    };
    world = { geos };

    const tentTex = texFromCanvas(tentCanvas(), 2);
    tentTex.wrapS = tentTex.wrapT = THREE.RepeatWrapping;
    tentTex.repeat.set(3, 1);
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(5.6, 5.6, 4.8, 28, 1, true),
      new THREE.MeshStandardMaterial({ map: tentTex, side: THREE.BackSide, roughness: 0.9, metalness: 0.02 })
    );
    wall.position.y = 2.25;
    scene.add(wall);
    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(5.65, 5.65, 0.05, 32),
      new THREE.MeshStandardMaterial({
        map: texFromCanvas(woodCanvas(), 4), color: 0x5a3a2a, roughness: 0.96, metalness: 0,
      })
    );
    floor.position.y = -0.025;
    scene.add(floor);
    const rug = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.55, 0.03, 28),
      new THREE.MeshStandardMaterial({ map: texFromCanvas(rugCanvas()), roughness: 0.85, metalness: 0 })
    );
    rug.position.y = 0.02;
    scene.add(rug);
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(5.75, 1.7, 28, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x140810, side: THREE.DoubleSide, roughness: 0.9 })
    );
    canopy.position.y = 5.35;
    scene.add(canopy);

    const dais = meshOf(geos.cyl, makeMat(0x2a1814, { roughness: 0.7 }), 0, 0.08, 0, 1.05, 0.16, 1.05);
    scene.add(dais);

    const basin = new THREE.Group();
    basin.add(meshOf(geos.cyl, makeMat(BRASS, { metalness: 0.82, roughness: 0.28 }), 0, 0.42, 0, 0.62, 0.12, 0.62));
    basin.add(meshOf(geos.cyl, makeMat(0x1a1014), 0, 0.22, 0, 0.1, 0.4, 0.1));
    const basinCanvas = document.createElement("canvas");
    basinCanvas.width = 256; basinCanvas.height = 256;
    const basinCtx = basinCanvas.getContext("2d");
    paintBasin(basinCtx, { glyph: "◎", hex: "#c8d4dc", t: 0 });
    const basinTex = texFromCanvas(basinCanvas);
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.52, 24), new THREE.MeshStandardMaterial({
      map: basinTex, emissiveMap: basinTex, emissive: 0xffffff, emissiveIntensity: 0.55,
      metalness: 0.9, roughness: 0.08,
    }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.5;
    basin.add(water);
    scene.add(basin);

    const lantern = makeLantern();
    lantern.position.set(0, 0.78, 2.18);
    scene.add(lantern);

    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffc878 });
    const candles = new THREE.Group();
    [
      [-1.85, 0, 0.55], [1.85, 0, 0.6], [-2.35, 0, 1.7], [2.25, 0, 1.75],
      [-1.2, 0, -1.55], [1.25, 0, -1.6], [-2.55, 0, -0.35], [2.6, 0, -0.28],
      [0, 0, -2.05], [-0.75, 0, 2.05], [0.8, 0, 2.1],
    ].forEach((p, i) => {
      const c = makeCandle(flameMat);
      c.position.set(p[0], p[1], p[2]);
      c.visible = i < 6;
      candles.add(c);
    });
    scene.add(candles);

    const altar = new THREE.Group();
    altar.add(meshOf(geos.box, makeMat(0x2a2018, { roughness: 0.8 }), 0, 0.28, -0.15, 0.95, 0.4, 0.5));
    const fireBall = meshOf(geos.sphere, new THREE.MeshBasicMaterial({ color: 0xff7a28, transparent: true, opacity: 0.9 }), 0, 0.7, -0.15, 0.18);
    altar.add(fireBall);
    altar.visible = false;
    altar.userData.fire = fireBall;
    scene.add(altar);

    const aura = makeAura();
    aura.position.set(1.55, 0, 1.15);
    aura.rotation.y = -0.85;
    scene.add(aura);

    const moteGeo = new THREE.BufferGeometry();
    const moteCount = 110;
    const pos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 1] = Math.random() * 4.4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    moteGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
      color: 0xf0d09a, size: 0.038, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    scene.add(motes);

    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffe2a0 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      scene.add(meshOf(geos.sphere, lanternMat, Math.cos(a) * 2.55, 3.45, Math.sin(a) * 2.55, 0.08));
    }

    const orb = meshOf(geos.sphere, new THREE.MeshBasicMaterial({ color: 0xe8f4ff }), 0, 1.2, 3.5, ORB_R);
    orb.visible = false;
    scene.add(orb);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
      color: 0xd4f0ff, transparent: true, opacity: 0.7,
    }));
    scene.add(trail);

    const aimGeo = new THREE.BufferGeometry();
    aimGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const aimLine = new THREE.Line(aimGeo, new THREE.LineDashedMaterial({
      color: 0xf0d09a, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.55,
    }));
    scene.add(aimLine);

    const sparks = [];
    for (let i = 0; i < 28; i++) {
      const s = meshOf(geos.sphere, new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0 }), 0, 0, 0, 0.03);
      s.visible = false;
      scene.add(s);
      sparks.push({ mesh: s, vx: 0, vy: 0, vz: 0, life: 0 });
    }

    const panes = [];
    for (let i = 0; i < 10; i++) {
      const merc = makeMercuryDisc();
      const group = makeStandingGlass(merc, i % 2 ? HEART : 0x3d8a8a);
      group.visible = false;
      scene.add(group);
      panes.push({
        group, merc, ring: group.userData.ring,
        sigil: SIGILS[0], trueGlass: false, lit: false, cracked: false,
        open: false, flash: 0, theta: 0, spin: 0, hit: false,
      });
    }

    return {
      THREE, renderer, scene, camera, geos,
      panes, aura, candles, altar, motes, lantern, basin, water, basinCtx, basinTex,
      orb, trail, aimLine, sparks, key, glassGlow, fireLight, lanternLight,
      look: new THREE.Vector3(0, 1.38, -0.85),
      yaw: 0, punch: 0, flash: 0, w: 0, h: 0, running: false, last: 0,
    };
  }

  function resizeWorld() {
    if (!world) return;
    const theater = el("catopTheater") || (el("catopCanvas") && el("catopCanvas").parentNode);
    if (!theater) return;
    const w = Math.max(16, theater.clientWidth | 0);
    const h = Math.max(16, theater.clientHeight | 0);
    if (w === world.w && h === world.h) return;
    world.w = w; world.h = h;
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function burst(pos, color, n) {
    if (!world) return;
    let used = 0;
    world.sparks.forEach((s) => {
      if (used >= n) return;
      if (s.life > 0) return;
      s.life = 0.45 + Math.random() * 0.35;
      s.vx = (Math.random() - 0.5) * 3.4;
      s.vy = 1.2 + Math.random() * 2.4;
      s.vz = (Math.random() - 0.5) * 3.4;
      s.mesh.visible = true;
      s.mesh.position.copy(pos);
      s.mesh.material.color.setHex(color);
      s.mesh.material.opacity = 1;
      used++;
    });
  }

  function lanternMouth() {
    if (!world) return _v.set(0, 1.22, 3.52);
    world.lantern.updateWorldMatrix(true, false);
    return _v2.set(0, 0.32, 0).applyMatrix4(world.lantern.matrixWorld);
  }

  function paneFromObject(obj) {
    let n = obj;
    while (n) {
      const found = world.panes.find((p) => p.merc.disc === n || p.merc.hit === n || p.group === n);
      if (found) return found;
      n = n.parent;
    }
    return null;
  }

  function stickyOnLock() {
    if (!run || !run.lockPane || run.lockPane.hit || !pointerHeld) return false;
    const p = run.lockPane;
    if (run.spec && run.spec.spin && !facingUs(p)) return false;
    p.merc.disc.updateWorldMatrix(true, false);
    const wp = new THREE.Vector3();
    p.merc.disc.getWorldPosition(wp);
    ndc.set(pointerNdc.x, pointerNdc.y);
    raycaster.setFromCamera(ndc, world.camera);
    const dist = raycaster.ray.distanceToPoint(wp);
    if (dist < STICKY_R) {
      p._hitPoint = raycaster.ray.closestPointToPoint(wp, new THREE.Vector3());
      return true;
    }
    return false;
  }

  function glassUnderAim() {
    if (!world || !pointerOver) return null;
    ndc.set(pointerNdc.x, pointerNdc.y);
    raycaster.setFromCamera(ndc, world.camera);
    const discs = [];
    world.panes.forEach((p) => {
      if (!p.group.visible || p.hit) return;
      if (run && run.spec && run.spec.spin && !facingUs(p)) return;
      discs.push(p.merc.disc);
      if (p.merc.hit) discs.push(p.merc.hit);
    });
    if (discs.length) {
      const hits = raycaster.intersectObjects(discs, true);
      if (hits.length) {
        const p = paneFromObject(hits[0].object);
        if (p) {
          p._hitPoint = hits[0].point;
          return p;
        }
      }
    }
    if (stickyOnLock()) return run.lockPane;
    return null;
  }

  function aimPoint() {
    if (!world) return new THREE.Vector3(0, 1.4, -2);
    const over = glassUnderAim();
    if (over && over._hitPoint) return over._hitPoint.clone();
    ndc.set(pointerNdc.x, pointerNdc.y);
    raycaster.setFromCamera(ndc, world.camera);
    const out = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(aimPlane, out)) return out;
    return raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 8);
  }

  function updateAimLine() {
    if (!world) return;
    const playing = isLive() && run.phase === "aim";
    const locking = !!(run && run.holding && run.lockPane);
    world.aimLine.visible = playing && pointerOver;
    if (playing && pointerOver) {
      const a = lanternMouth();
      const b = (run && run.lockPane && run.lockPane._hitPoint) || aimPoint();
      const arr = world.aimLine.geometry.attributes.position.array;
      arr[0] = a.x; arr[1] = a.y; arr[2] = a.z;
      arr[3] = b.x; arr[4] = b.y; arr[5] = b.z;
      world.aimLine.geometry.attributes.position.needsUpdate = true;
      world.aimLine.computeLineDistances();
    }
    if (world.orb) {
      if (locking && run.lockPane && run.lockPane._hitPoint) {
        world.orb.visible = true;
        world.orb.position.copy(run.lockPane._hitPoint);
        world.orb.scale.setScalar(0.7 + Math.sin((run.waitFill || 0) * 0.02) * 0.15);
      } else {
        world.orb.visible = false;
      }
    }
    const cross = el("catopCrosshair");
    if (cross) {
      const theater = el("catopTheater");
      if (theater) {
        const r = theater.getBoundingClientRect();
        const x = (pointerNdc.x * 0.5 + 0.5) * r.width;
        const y = (-pointerNdc.y * 0.5 + 0.5) * r.height;
        cross.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        cross.hidden = !playing || !pointerOver;
        cross.classList.toggle("is-on-glass", !!(run && run.hoverPane));
        cross.classList.toggle("is-holding", !!locking);
      }
    }
  }

  function dressRoom(spec) {
    if (!world) return;
    const n = spec ? spec.count : 5;
    world.altar.visible = !!(spec && spec.altar);
    world.fireLight.intensity = world.altar.visible ? 2.2 : 0;
    world.candles.children.forEach((c, i) => { c.visible = !spec || spec.candles ? i < (spec && spec.fog ? 8 : 6) : i < 3; });
    if (world.scene.fog) world.scene.fog.density = spec && spec.fog ? 0.13 : 0.048;
    const host = card();
    if (host) host.classList.toggle("is-hazy", !!(spec && spec.fog));
    world.panes.forEach((p, i) => {
      p.group.visible = i < n;
      p.cracked = false;
      p.hit = false;
      p.open = false;
      p.flash = 0;
      p.spin = 0;
    });
  }

  function layoutPanes(t, dt) {
    if (!world) return;
    const spec = run && run.spec;
    const n = spec ? spec.count : 5;
    const orbit = spec ? spec.orbit : 0.08;
    const spinSpd = spec ? spec.spin : 0;
    const base = (run ? run.orbitT : t * 0.12);
    for (let i = 0; i < world.panes.length; i++) {
      const p = world.panes[i];
      if (i >= n) { p.group.visible = false; continue; }
      p.group.visible = true;
      const spread = Math.min(1.85, 0.7 + n * 0.16);
      const u = n <= 1 ? 0 : (i - (n - 1) / 2) / Math.max(1, n - 1);
      const sway = orbit ? Math.sin(base) * Math.min(0.5, 0.22 + orbit * 0.4) : 0;
      const a = Math.PI + u * spread + sway;
      p.theta = a;
      const x = Math.sin(a) * RING_R;
      const z = Math.cos(a) * RING_R;
      p.group.position.set(x, 0, z);
      if (spinSpd) {
        p.spin += spinSpd * (dt || 0.016);
        p.group.rotation.y = a + Math.PI + p.spin;
      } else {
        const dx = world.camera.position.x - x;
        const dz = world.camera.position.z - z;
        p.group.rotation.set(0, Math.atan2(dx, dz), 0);
      }
    }
  }

  function assignSigils() {
    if (!run || !world) return;
    const spec = run.spec;
    const n = spec.count;
    const need = spec.trues;
    const call = run.call;
    const others = SIGILS.filter((s) => s.id !== call.id);
    const trueIdx = [];
    const used = {};
    while (trueIdx.length < need) {
      const i = (Math.random() * n) | 0;
      if (used[i]) continue;
      used[i] = 1;
      trueIdx.push(i);
    }
    run.trueIdx = trueIdx;
    for (let i = 0; i < n; i++) {
      const p = world.panes[i];
      const isTrue = trueIdx.indexOf(i) >= 0;
      p.trueGlass = isTrue;
      p.sigil = isTrue ? call : pick(others);
      p.lit = isTrue;
      p.hit = false;
      p.cracked = false;
      p.open = false;
      p.flash = 0;
    }
    run.truesLeft = need;
    paintAllPanes(0);
    paintBasinNow(0);
  }

  function flickerSwap() {
    if (!run || !world || !run.spec.flickerMs) return;
    const n = run.spec.count;
    const live = [];
    for (let i = 0; i < n; i++) {
      const p = world.panes[i];
      if (!p.hit && !p.cracked) live.push(i);
    }
    if (live.length < 2) return;
    const currentTrue = live.filter((i) => world.panes[i].trueGlass);
    const currentFalse = live.filter((i) => !world.panes[i].trueGlass);
    if (!currentTrue.length || !currentFalse.length) return;
    const a = pick(currentTrue);
    const b = pick(currentFalse);
    const pa = world.panes[a];
    const pb = world.panes[b];
    const ts = pa.trueGlass;
    pa.trueGlass = pb.trueGlass;
    pb.trueGlass = ts;
    const sg = pa.sigil;
    pa.sigil = pb.sigil;
    pb.sigil = sg;
    pa.lit = pa.trueGlass;
    pb.lit = pb.trueGlass;
    pa.flash = 0.85;
    pb.flash = 0.85;
    world.flash = 0.35;
    sfx("flip");
    setText("catopStatus", "Lie flicker — the true sigil jumped. Wait for the match.");
  }

  function decoyPulse() {
    if (!run || !world || !run.spec.decoy) return;
    const n = run.spec.count;
    const liars = [];
    for (let i = 0; i < n; i++) {
      const p = world.panes[i];
      if (!p.trueGlass && !p.hit && !p.cracked) liars.push(p);
    }
    if (!liars.length) return;
    const p = pick(liars);
    p.flash = 1;
    p.lit = true;
    p._decoy = true;
    setTimeout(() => {
      if (!p.hit) { p.lit = false; p._decoy = false; }
    }, 420);
    setText("catopStatus", "Decoy flash — pretty, and a liar.");
  }

  function facingUs(p) {
    p.group.updateWorldMatrix(true, false);
    _n.set(0, 0, 1).transformDirection(p.group.matrixWorld);
    _v.set(
      world.camera.position.x - p.group.position.x,
      0,
      world.camera.position.z - p.group.position.z
    ).normalize();
    return _n.dot(_v) > 0.28;
  }

  function paintAllPanes(t) {
    if (!world) return;
    const fog = !!(run && run.spec && run.spec.fog);
    world.panes.forEach((p) => {
      if (!p.group.visible) return;
      const back = !!(run && run.spec && run.spec.spin && !facingUs(p));
      const locking = !!(run && run.lockPane === p);
      const fill = p.open ? 1 : (locking ? Math.min(1, (run.waitFill || 0) / Math.max(1, run.waitMs || 1)) : (p.lit && !back ? 0.42 : 0.16));
      paintGlass(p.merc.ctx, {
        t, lit: (p.lit || locking) && !back, open: p.open, fill,
        glyph: p.sigil.glyph, hex: p.sigil.hex,
        fog, flash: p.flash, crack: p.cracked, back,
      });
      p.merc.tex.needsUpdate = true;
      if (p.ring && p.ring.material) {
        p.ring.material.color.setHex(hexInt(p.sigil.hex));
        const hover = !!(run && run.hoverPane === p);
        p.ring.material.opacity = p.cracked ? 0.08 : (locking ? 0.55 + fill * 0.45 : (hover ? 0.7 : (p.lit && !back ? 0.55 : 0.16)));
      }
    });
  }

  function paintBasinNow(t) {
    if (!world) return;
    const call = (run && run.call) || SIGILS[4];
    paintBasin(world.basinCtx, { glyph: call.glyph, hex: call.hex, t });
    world.basinTex.needsUpdate = true;
    world.glassGlow.color.setHex(hexInt(call.hex));
  }

  function hudLine(spec, room) {
    if (!spec) return "ROOM 0";
    if (spec.coda) return `ENDLESS · ROOM ${room} · ${spec.title}`;
    return `ROOM ${room} · ${spec.title}`;
  }

  function tellDepth() {
    if (!run) return;
    if (run.kitRun && rk() && typeof rk().reportDepth === "function") {
      try {
        rk().reportDepth(run.kitRun, run.depth | 0, {
          name: run.spec && run.spec.title,
          coda: !!(run.spec && run.spec.coda),
        });
      } catch (_) { /* */ }
      run.kitRun.depth = run.depth | 0;
      run.kitRun.score = run.score | 0;
    }
    setText("catopHudLine", run.spec ? hudLine(run.spec, run.room) : "ROOM 0");
    const fillPct = run.holding ? Math.round(Math.min(1, (run.waitFill || 0) / Math.max(1, run.waitMs || 1)) * 100) : 0;
    setText("catopFill", run.holding ? `${fillPct}%` : "—");
    setText("catopGazes", run.holding ? `${fillPct}%` : "—");
    setText("catopStrikes", `${run.strikes | 0}/${STRIKE_LIMIT}`);
    const call = el("catopCall");
    if (call && run.call) {
      call.hidden = false;
      call.style.setProperty("--catop-fill", run.call.hex);
      setText("catopCallGlyph", run.call.glyph);
      setText("catopCallName", `HOLD THE ${run.call.name.toUpperCase()}`);
    }
    const pips = el("catopStrikePips");
    if (pips) {
      pips.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < (run.strikes | 0)));
    }
    const meter = el("catopFillBar");
    if (meter) {
      meter.style.setProperty("--catop-p", String(fillPct));
      if (run.call) meter.style.setProperty("--catop-fill", run.call.hex);
    }
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
  }

  function setPlayChrome() {
    const live = isLive() || !!(run && run.dying);
    const vest = el("catopVestibule");
    const actions = el("catopActions");
    const call = el("catopCall");
    const cross = el("catopCrosshair");
    if (vest) vest.hidden = !!(run && !run.done);
    if (actions) actions.hidden = true;
    if (call) call.hidden = !live || !!(run && (run.done || !run.call));
    if (cross) cross.hidden = !live || !pointerOver || !!(run && run.done);
    const host = card();
    if (host) {
      host.classList.toggle("is-aiming", !!(run && isLive() && run.phase === "aim"));
      host.classList.toggle("is-holding", !!(run && run.holding));
    }
  }

  function arrived() {
    if (!run) return false;
    if (run.arriveAt) return (Date.now() - run.arriveAt) >= ARRIVE_MS;
    return (run.arriveMs || 0) >= ARRIVE_MS;
  }

  function openRoom(n) {
    run.room = n;
    run.spec = stageParams(n);
    if (!run.spec) { finish("souvenir"); return; }
    run.phase = "aim";
    run.arriveMs = 0;
    run.arriveAt = Date.now();
    run.orbitT = Math.random() * Math.PI * 2;
    run.flickerT = 0;
    run.decoyT = 0;
    run.hintT = 0;
    run.hintOn = false;
    run.combo = 0;
    run.orb = null;
    run.lockPane = null;
    run.hoverPane = null;
    run.seenHold = false;
    run.holding = false;
    run.waitFill = 0;
    run.breakMs = 0;
    run.switchGrace = 0;
    run.waitMs = run.spec.waitMs || 3200;
    run.breakLimitMs = run.spec.breakLimitMs || 900;
    run.call = pick(SIGILS);
    dressRoom(run.spec);
    assignSigils();
    layoutPanes(0, 0.016);
    world.flash = 0;
    setPlayChrome();
    tellDepth();
    setTimeout(() => { if (run && !run.done) setPlayChrome(); }, ARRIVE_MS + 40);
    const extra = run.spec.coda ? " ENDLESS." : "";
    setText("catopStatus", (run.spec.barker || `Room ${n}.`) + extra);
    PF.setAura("think");
    sfx("drop");
    if (run.spec.auraHint) run.hintT = 400;
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("catoptromancy")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  async function start() {
    if (isLive()) return;
    if (!ensureWorld()) {
      setText("catopStatus", "The parlor couldn’t light. Try another lantern.");
      return;
    }
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("catopStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      return;
    }
    run = {
      done: false, dying: false, deathHold: 0, deathNote: "", kitRun,
      room: 1, depth: 0, score: 0, strikes: 0,
      spec: stageParams(1), call: SIGILS[0], phase: "aim",
      arriveMs: 0, orbitT: 0, flickerT: 0, decoyT: 0, hintT: 0, hintOn: false,
      combo: 0, orb: null, lockPane: null, hoverPane: null,
      seenHold: false, holding: false, waitFill: 0, breakMs: 0, switchGrace: 0,
      waitMs: 2100, breakLimitMs: 1400,
      trueIdx: [], truesLeft: 1, deathReason: "",
    };
    const verdict = el("catopVerdict");
    if (verdict) verdict.hidden = true;
    if (kit && kit.hideResult) kit.hideResult("catopResult");
    PF.setTier("catopTier", "", "");
    kit.setMode(card(), "play");
    openRoom(1);
    playWorld();
  }

  function beginGaze(p) {
    if (!p || p.hit) return;
    run.lockPane = p;
    run.seenHold = true;
    run.holding = true;
    run.waitFill = 0;
    run.breakMs = 0;
    run.flickerFired = false;
    world.lanternLight.intensity = 3.0;
    world.punch = 0.04;
    sfx("drop");
    if (navigator.vibrate) navigator.vibrate(8);
    PF.setAura("point");
    setText("catopStatus", "Holding the glass. Don’t look away.");
    setPlayChrome();
    tellDepth();
  }

  function stepGaze(dt) {
    if (!isLive() || run.phase !== "aim") return;
    const over = glassUnderAim();
    run.hoverPane = over;
    if (run.switchGrace > 0) {
      run.switchGrace = Math.max(0, run.switchGrace - dt * 1000);
    }
    const canLock = arrived() && run.switchGrace <= 0;
    if (!run.seenHold) {
      if (canLock && pointerHeld && over && !over.hit) beginGaze(over);
      return;
    }
    const lock = run.lockPane;
    const onLock = !!(pointerHeld && over === lock && lock && !lock.hit);
    if (onLock) {
      run.holding = true;
      run.breakMs = 0;
      run.waitFill += dt * 1000;
      const spec = run.spec || {};
      if (spec.kind === "flicker" && !run.flickerFired && run.waitFill > run.waitMs * 0.42) {
        run.flickerFired = true;
        world.flash = 1;
        sfx("flip");
        setText("catopStatus", "Lie flicker — keep looking. Looking away still breaks.");
      }
      if (run.waitFill >= run.waitMs) {
        run.holding = false;
        run.seenHold = false;
        run.lockPane = null;
        run.waitFill = run.waitMs;
        if (lock.trueGlass && lock.lit) resolveTrue(lock);
        else resolveLiar(lock);
      }
    } else {
      run.holding = false;
      run.breakMs += dt * 1000;
      if (run.breakMs > 90 && run.breakMs < run.breakLimitMs) {
        setText("catopStatus", "Gaze broke. Look back at the glass before it forgets you.");
      }
      if (run.breakMs > run.breakLimitMs) finish("looked away");
    }
  }

  function paneHit(p, pos, prev) {
    if (!p.group.visible || p.hit) return false;
    p.merc.disc.updateWorldMatrix(true, false);
    const local = p.merc.disc.worldToLocal(pos.clone());
    const prevL = p.merc.disc.worldToLocal(prev.clone());
    const dz = local.z - prevL.z;
    if (Math.abs(dz) < 1e-6 && Math.abs(local.z) > 0.18) return false;
    let ix = local.x;
    let iy = local.y;
    const crossed = (prevL.z >= 0 && local.z <= 0.16) || (prevL.z <= 0 && local.z >= -0.16);
    if (crossed && Math.abs(dz) > 1e-6) {
      const u = prevL.z / (prevL.z - local.z);
      if (u < -0.15 || u > 1.15) return false;
      ix = prevL.x + (local.x - prevL.x) * u;
      iy = prevL.y + (local.y - prevL.y) * u;
    } else if (Math.abs(local.z) > 0.18) {
      return false;
    }
    return (ix * ix + iy * iy) <= 1.12;
  }

  function resolveTrue(p) {
    p.hit = true;
    p.open = true;
    p.lit = true;
    p.flash = 1;
    run.truesLeft -= 1;
    run.combo += 1;
    const add = TRUE_SCORE + (run.room | 0) * 18 + (run.combo > 1 ? COMBO : 0);
    run.score += add;
    if (run.kitRun) run.kitRun.score = run.score;
    const pos = new THREE.Vector3();
    p.merc.disc.getWorldPosition(pos);
    burst(pos, hexInt(p.sigil.hex), 10);
    world.flash = 0.55;
    world.punch = 0.12;
    sfx("chapter");
    if (navigator.vibrate) navigator.vibrate(14);
    PF.setAura(run.truesLeft <= 0 ? "celebrate" : "point");
    setText("catopStatus", run.truesLeft > 0
      ? `${p.sigil.name} lights. ${run.truesLeft} true pane${run.truesLeft > 1 ? "s" : ""} still dark.`
      : `${p.sigil.name} — gallery sings. Room ${run.room} clears.`);
    if (run.truesLeft <= 0) clearRoom();
    else {
      run.switchGrace = SWITCH_GRACE_MS;
      run.seenHold = false;
      run.holding = false;
      run.lockPane = null;
      run.waitFill = 0;
      run.breakMs = 0;
      setText("catopStatus", `${p.sigil.name} lights. ${run.truesLeft} true pane${run.truesLeft > 1 ? "s" : ""} still dark — find it. Don’t look away once you hold.`);
      tellDepth();
    }
  }

  function resolveLiar(p) {
    p.hit = true;
    p.cracked = true;
    p.lit = false;
    p.flash = 0.4;
    run.combo = 0;
    run.strikes += 1;
    if (run.kitRun && rk() && typeof rk().reportStrike === "function") {
      try { rk().reportStrike(run.kitRun, p._decoy ? "decoy" : "liar"); } catch (_) { /* */ }
    }
    const pos = new THREE.Vector3();
    p.merc.disc.getWorldPosition(pos);
    burst(pos, 0xc41e3a, 8);
    world.flash = 0.28;
    world.punch = 0.16;
    sfx("spit");
    if (navigator.vibrate) navigator.vibrate(22);
    PF.setAura("laugh");
    const why = p._decoy ? "Decoy flash — liar." : (run.spec && run.spec.spin && !facingUs(p) ? "Back of the glass." : "Wrong sigil.");
    setText("catopStatus", `${why} Strike ${run.strikes}/${STRIKE_LIMIT}.`);
    if (run.strikes >= STRIKE_LIMIT) {
      finish(p._decoy ? "decoy" : "strike");
      return;
    }
    run.switchGrace = SWITCH_GRACE_MS;
    run.seenHold = false;
    run.holding = false;
    run.lockPane = null;
    run.waitFill = 0;
    run.breakMs = 0;
    tellDepth();
  }

  function clearRoom() {
    run.score += ROOM_BONUS;
    if (run.kitRun) run.kitRun.score = run.score;
    run.depth += 1;
    sfx("cash");
    PF.setAura("celebrate");
    const next = (run.room | 0) + 1;
    const spec = stageParams(next);
    if (!spec) { finish("souvenir"); return; }
    setText("catopStatus", `Room ${run.depth} banked. Next glass — hold the match. Don’t look away.`);
    openRoom(next);
  }

  function stepOrb(dt) {
    const o = run.orb;
    if (!o) {
      if (world) world.orb.visible = false;
      return;
    }
    const prev = new THREE.Vector3(o.x, o.y, o.z);
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.z += o.vz * dt;
    o.life += dt;
    o.hist.push(o.x, o.y, o.z);
    if (o.hist.length > 24 * 3) o.hist.splice(0, 3);
    world.orb.visible = true;
    world.orb.position.set(o.x, o.y, o.z);
    const pulse = 0.85 + Math.sin(o.life * 18) * 0.18;
    world.orb.scale.setScalar(pulse);
    const arr = world.trail.geometry.attributes.position.array;
    arr.fill(0);
    for (let i = 0; i < o.hist.length && i < arr.length; i++) arr[i] = o.hist[i];
    if (o.hist.length >= 6) {
      world.trail.geometry.setDrawRange(0, (o.hist.length / 3) | 0);
      world.trail.geometry.attributes.position.needsUpdate = true;
    }
    const pos = world.orb.position;
    const spec = run.spec || {};
    for (let i = 0; i < (spec.count || 0); i++) {
      const p = world.panes[i];
      if (paneHit(p, pos, prev)) {
        run.orb = null;
        world.orb.visible = false;
        if (spec.spin && !facingUs(p)) {
          resolveLiar(p);
          p._spinBack = true;
          return;
        }
        if (p.trueGlass && p.lit) resolveTrue(p);
        else resolveLiar(p);
        return;
      }
    }
    if (o.y < 0.08) {
      burst(pos.clone(), 0x9ab0c8, 6);
      run.orb = null;
      world.orb.visible = false;
      resolveMiss("Gaze kissed the boards. Aim at a glass.");
      return;
    }
    if (o.life > 1.55 || Math.abs(o.x) > 6.2 || Math.abs(o.z) > 6.2 || o.y > 5.4) {
      run.orb = null;
      world.orb.visible = false;
      resolveMiss("The gaze faded in the tent-dark.");
    }
  }

  function tickAura(t) {
    if (!world || !world.aura) return;
    const ud = world.aura.userData;
    const idleY = Math.sin(t * 1.5) * 0.012;
    const home = { x: 1.55, z: 1.15, rot: -0.85 };
    let tx = home.x, tz = home.z, rot = home.rot;
    if (run && run.dying) {
      ud.head.rotation.x = 0.28;
      ud.armL.rotation.z = 1.15;
      ud.armR.rotation.z = -1.15;
      world.aura.position.y = idleY;
      return;
    }
    ud.head.rotation.x = 0;
    if (run && isLive() && run.spec && run.spec.auraHint) {
      const trueP = world.panes.find((p) => p.trueGlass && p.group.visible && !p.hit);
      if (trueP && (run.hintOn || (run.hintT || 0) > 0)) {
        tx = trueP.group.position.x * 0.55 + 0.8;
        tz = trueP.group.position.z * 0.55 + 1.1;
        rot = Math.atan2(trueP.group.position.x - tx, trueP.group.position.z - tz);
        ud.armR.rotation.z = -1.05;
        ud.armL.rotation.z = 0.2;
        ud.head.rotation.y = 0.15;
      } else {
        ud.armR.rotation.z = Math.sin(t * 1.15) * 0.14;
        ud.armL.rotation.z = Math.sin(t * 1.15 + 1) * 0.12;
        ud.head.rotation.y = Math.sin(t * 0.7) * 0.18;
      }
    } else if (run && isLive() && run.phase === "aim") {
      ud.head.rotation.y = Math.sin(t * 0.7) * 0.18;
      ud.armR.rotation.z = -0.55 + Math.sin(t * 2.1) * 0.08;
      ud.armL.rotation.z = 0.12;
    } else {
      ud.head.rotation.y = Math.sin(t * 0.7) * 0.18;
      ud.armR.rotation.z = Math.sin(t * 1.15) * 0.14;
      ud.armL.rotation.z = Math.sin(t * 1.15 + 1) * 0.12;
    }
    world.aura.position.x += (tx - world.aura.position.x) * 0.04;
    world.aura.position.z += (tz - world.aura.position.z) * 0.04;
    world.aura.position.y = idleY;
    world.aura.rotation.y += (rot - world.aura.rotation.y) * 0.06;
  }

  function tickProps(t, dt) {
    if (!world) return;
    world.candles.children.forEach((c, i) => {
      const fl = c.userData.flame;
      if (!fl) return;
      const s = 0.85 + Math.sin(t * 9 + i) * 0.18;
      fl.scale.setScalar(s);
      fl.position.y = 0.28 + Math.sin(t * 11 + i) * 0.012;
    });
    if (world.altar.visible && world.altar.userData.fire) {
      const f = world.altar.userData.fire;
      f.scale.setScalar(0.9 + Math.sin(t * 8) * 0.22);
      f.position.y = 0.7 + Math.sin(t * 10) * 0.04;
      world.fireLight.intensity = 2.1 + Math.sin(t * 9) * 0.6;
    }
    if (world.lantern && world.lantern.userData.flame) {
      const fl = world.lantern.userData.flame;
      fl.scale.setScalar(0.9 + Math.sin(t * 11) * 0.16);
      world.lanternLight.intensity += (1.8 - world.lanternLight.intensity) * 0.08;
    }
    const attr = world.motes.geometry.getAttribute("position");
    for (let i = 0; i < attr.count; i++) {
      let y = attr.getY(i) + 0.004;
      if (y > 4.4) y = 0.1;
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
    if (world.water) world.water.rotation.z = Math.sin(t * 0.8) * 0.04;
    world.sparks.forEach((s) => {
      if (s.life <= 0) { s.mesh.visible = false; return; }
      s.life -= dt;
      s.vy -= 4.2 * dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      s.mesh.material.opacity = Math.max(0, s.life * 2.2);
      s.mesh.visible = s.mesh.material.opacity > 0.02;
    });
    world.panes.forEach((p) => {
      if (p.flash > 0) p.flash = Math.max(0, p.flash - dt * 1.8);
    });
  }

  function tickCamera(t, dt) {
    if (!world) return;
    const sway = REDUCE ? 0 : 1;
    let yaw = world.yaw || 0;
    const want = ((keys.l || lookHeld < 0) ? 1 : 0) - ((keys.r || lookHeld > 0) ? 1 : 0);
    if (isLive()) yaw = clamp(yaw + want * dt * 1.35, -0.72, 0.72);
    else yaw += (Math.sin(t * 0.22) * 0.12 * sway - yaw) * 0.02;
    world.yaw = yaw;
    const dist = CAM_DIST;
    let tx = Math.sin(yaw) * dist;
    let tz = Math.cos(yaw) * dist;
    let ty = CAM_Y;
    let lx = 0, ly = 1.38, lz = -0.85;
    if (isLive() && run.lockPane && run.lockPane.group) {
      lx = run.lockPane.group.position.x * 0.28;
      lz = run.lockPane.group.position.z * 0.12 - 0.7;
    }
    if (run && run.dying) {
      tz += 0.45; ty = 1.85;
      tx += (Math.random() - 0.5) * 0.08;
    } else if (isLive() && run.orb) {
      tz -= 0.15;
    } else if (!isLive()) {
      tx += Math.sin(t * 0.31) * 0.08 * sway;
      ty += Math.sin(t * 0.47) * 0.03 * sway;
    }
    if (world.punch) {
      tz += world.punch * 4;
      world.punch = Math.max(0, world.punch - dt * 2.8);
    }
    const k = 1 - Math.exp(-dt * 8);
    const cam = world.camera;
    cam.position.x += (tx - cam.position.x) * k;
    cam.position.y += (ty - cam.position.y) * k;
    cam.position.z += (tz - cam.position.z) * k;
    world.look.x += (lx - world.look.x) * k;
    world.look.y += (ly - world.look.y) * k;
    world.look.z += (lz - world.look.z) * k;
    cam.lookAt(world.look);
  }

  function step(dt) {
    if (!run) return;
    if (run.dying) {
      run.deathHold = Math.max(0, (run.deathHold || 0) - dt * 1000);
      if (run.deathHold <= 0) sealResult(run.deathNote || "looked away");
      return;
    }
    if (!isLive()) return;
    run.arriveMs += dt * 1000;
    setPlayChrome();
    if (run.spec && run.spec.orbit) run.orbitT += run.spec.orbit * dt;
    if (run.spec && run.spec.flickerMs && run.phase === "aim") {
      run.flickerT = (run.flickerT || 0) + dt * 1000;
      if (run.flickerT >= run.spec.flickerMs) {
        run.flickerT = 0;
        if (run.arriveMs > ARRIVE_MS + 400) {
          if (run.holding && run.lockPane) {
            run.lockPane.flash = 1;
            world.flash = 0.7;
            sfx("flip");
            setText("catopStatus", "Lie flicker — keep looking. Looking away still breaks.");
          } else flickerSwap();
        }
      }
    }
    if (run.spec && run.spec.decoy && run.phase === "aim") {
      run.decoyT = (run.decoyT || 0) + dt * 1000;
      if (run.decoyT >= 2200) {
        run.decoyT = 0;
        if (run.arriveMs > ARRIVE_MS + 500) decoyPulse();
      }
    }
    if (run.spec && run.spec.auraHint) {
      run.hintT = (run.hintT || 0) + dt * 1000;
      run.hintOn = run.hintT < 2400;
    }
    stepGaze(dt);
  }

  function loop(now) {
    if (!world || !world.running) return;
    raf = requestAnimationFrame(loop);
    if (!cabinetOn()) return;
    const dt = Math.min(0.033, (now - (lastTs || now)) / 1000);
    lastTs = now;
    const t = now * 0.001;
    resizeWorld();
    if (run && !run.done) step(dt);
    if (world.flash > 0) {
      world.flash = Math.max(0, world.flash - dt * 2.4);
      const host = card();
      if (host) host.classList.toggle("is-flash", world.flash > 0.16);
    }
    layoutPanes(t, dt);
    if ((run && run.holding) || ((now / 16 | 0) % 2 === 0)) paintAllPanes(t);
    if ((now / 16 | 0) % 3 === 0) paintBasinNow(t);
    tickProps(t, dt);
    tickAura(t);
    tickCamera(t, dt);
    updateAimLine();
    world.renderer.render(world.scene, world.camera);
    if (run && !run.done && typeof PF.refreshDepth === "function") PF.refreshDepth();
  }

  function playWorld() {
    if (!world) return;
    world.running = true;
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function pauseWorld() {
    if (!world) return;
    world.running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function ensureWorld() {
    if (world) return world;
    const canvas = el("catopCanvas");
    if (!canvas) return null;
    try {
      world = buildWorld(canvas);
      resizeWorld();
      layoutPanes(0, 0.016);
      paintAllPanes(0);
      paintBasinNow(0);
      world.camera.lookAt(world.look);
      world.renderer.render(world.scene, world.camera);
      window.__catopSnap = () => {
        const toScreen = (mesh) => {
          const v = new THREE.Vector3();
          mesh.getWorldPosition(v);
          v.project(world.camera);
          return { nx: +v.x.toFixed(3), ny: +v.y.toFixed(3), ok: v.z < 1 && Math.abs(v.x) < 1.4 && Math.abs(v.y) < 1.4 };
        };
        return {
          cam: world.camera.position.toArray().map((n) => +n.toFixed(2)),
          room: run && run.room,
          depth: run && run.depth,
          score: run && run.score,
          holding: !!(run && run.holding),
          seenHold: !!(run && run.seenHold),
          fill: run ? Math.round(run.waitFill || 0) : 0,
          waitMs: run ? run.waitMs : 0,
          breakMs: run ? Math.round(run.breakMs || 0) : 0,
          breakLimit: run ? run.breakLimitMs : 0,
          call: run && run.call && run.call.id,
          dying: !!(run && run.dying),
          done: !!(run && run.done),
          death: run && run.deathReason,
          hover: !!(run && run.hoverPane),
          panes: world.panes.filter((p) => p.group.visible).map((p) => ({
            x: +p.group.position.x.toFixed(2),
            z: +p.group.position.z.toFixed(2),
            trueGlass: !!p.trueGlass,
            sigil: p.sigil && p.sigil.id,
            hit: !!p.hit,
            open: !!p.open,
            screen: toScreen(p.merc.disc),
          })),
        };
      };
      playWorld();
    } catch (err) {
      setText("catopStatus", "The parlor couldn’t light. Try another lantern.");
      world = null;
    }
    return world;
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0, score: partial.score | 0,
      deathReason: partial.deathReason || "looked away",
      cashedOut: !!partial.cashedOut, meta: partial.meta || {},
    };
    if (state) {
      state.bestCatopRooms = Math.max(state.bestCatopRooms || 0, payload.depth);
      state.bestCatopScore = Math.max(state.bestCatopScore || 0, payload.score);
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
    }
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try { rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, payload), { navigate: false }); } catch (_) { /* */ }
    }
    if (kit && kit.persistRun) kit.persistRun(state, GAME_ID, payload);
    if (state) {
      const keyed = Object.assign({ gameId: GAME_ID, at: Date.now() }, payload);
      const prev = (state.lastRun && typeof state.lastRun === "object" && !Array.isArray(state.lastRun)) ? state.lastRun : {};
      state.lastRun = Object.assign({}, prev, {
        game: GAME_ID, gameId: GAME_ID, depth: payload.depth, score: payload.score,
        deathReason: payload.deathReason, cashedOut: payload.cashedOut, at: keyed.at,
      });
      state.lastRun[GAME_ID] = keyed;
    }
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function lastDepth() {
    const state = PF.getState() || {};
    const keyed = state.lastRun && state.lastRun[GAME_ID];
    if (keyed && keyed.depth != null) return keyed.depth | 0;
    const last = state.lastRun;
    if (last && (last.game === GAME_ID || last.gameId === GAME_ID)) return last.depth | 0;
    return Math.max(state.bestCatopRooms || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }
  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") return rk().challengeText("Catoptromancy room", depth, GAME_ID);
    return `Beat my Catoptromancy room ${depth} on Penny Fever`;
  }
  function auraLine(reason, depth) {
    if (reason === "leave") return AURA_LINE.leave;
    if (reason === "souvenir") return AURA_LINE.souvenir;
    if (reason === "decoy") return AURA_LINE.decoy;
    if (reason === "strike" || reason === "liar") {
      if (run && run.spec && run.spec.kind === "flicker") return AURA_LINE.flicker;
      if (run && run.spec && run.spec.kind === "spin") return AURA_LINE.spin;
      if (run && run.spec && run.spec.kind === "haze") return AURA_LINE.haze;
      return AURA_LINE.strike;
    }
    if (reason === "looked away" || reason === "looked_away") {
      if (run && run.spec && run.spec.kind === "flicker") return AURA_LINE.flicker;
      if (run && run.spec && run.spec.kind === "spin") return AURA_LINE.spin;
      return depth <= 0 ? AURA_LINE.lookedShallow : AURA_LINE.looked;
    }
    if (reason === "spent") {
      if (run && run.spec && run.spec.kind === "twin") return AURA_LINE.twin;
      if (run && run.spec && run.spec.kind === "hint") return AURA_LINE.hint;
      return depth <= 0 ? AURA_LINE.shallow : AURA_LINE.spent;
    }
    if (depth >= AUTHORED_COUNT) return AURA_LINE.coda;
    if (depth >= 6) return AURA_LINE.deep;
    if (depth >= 3) return AURA_LINE.mid;
    return AURA_LINE.teach;
  }
  function deathReasonOf(reason) {
    if (reason === "leave") return "leave";
    if (reason === "souvenir") return "souvenir";
    if (reason === "strike" || reason === "liar" || reason === "decoy") return "strike";
    if (reason === "looked away" || reason === "looked_away") return "looked away";
    return "looked away";
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave") { sealResult(reason); return; }
    if (run.dying) return;
    run.dying = true;
    run.phase = "dead";
    run.orb = null;
    run.holding = false;
    run.seenHold = false;
    run.lockPane = null;
    pointerHeld = false;
    pointerIds.clear();
    run.deathNote = reason;
    run.deathReason = deathReasonOf(reason);
    run.deathHold = DEATH_HOLD_MS;
    if (world) {
      world.flash = 0.4;
      world.orb.visible = false;
    }
    sfx("stamp");
    setPlayChrome();
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    run.phase = "dead";
    run.deathReason = deathReasonOf(reason);
    if (world) world.orb.visible = false;
    const depth = run.depth | 0;
    const score = run.score;
    persistDepth({
      depth, score, deathReason: run.deathReason, cashedOut: reason === "souvenir",
      meta: { room: run.room, call: run.call && run.call.id, kind: run.spec && run.spec.kind },
    });
    kit.setMode(card(), "result");
    setPlayChrome();
    const aura = auraLine(reason, depth);
    const challenge = challengeLine(depth);
    const verdict = el("catopVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = reason === "souvenir"
        ? `SOUVENIR · ROOM ${depth} · SCORE ${score}`
        : `ROOM ${depth} · SCORE ${score} · ${aura}`;
    }
    kit.fillResult({
      root: "catopResult", depth: "catopResultDepth", score: "catopResultScore",
      aura: "catopResultAura", copied: "catopCopied",
    }, {
      depthLine: reason === "souvenir" ? `SOUVENIR · ROOM ${depth}` : `ROOM ${depth}`,
      scoreLine: `SCORE ${score} · ${String(run.deathReason).toUpperCase()}`,
      auraLine: aura,
    });
    setText("catopChallengeText", challenge);
    const ok = depth > 0 || reason === "souvenir";
    PF.setTier("catopTier", ok
      ? (depth > AUTHORED_COUNT ? `ENDLESS · ROOM ${depth}` : `ROOM ${depth}`)
      : (run.deathReason === "strike" ? "LIAR" : "LOOKED AWAY"), ok ? "perfect" : "miss");
    setText("catopStatus", reason === "leave" ? "Stepped off the glass." : (reason === "souvenir" ? "Souvenir — authored glass locked." : "You looked away. The gallery closed."));
    if (ok) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Catoptromancy");
      PF.setAura(depth >= 4 || reason === "souvenir" ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `ROOM ${depth}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Catoptromancy miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, run.deathReason === "strike" ? "LIAR" : "LOOKED AWAY", aura);
    }
    PF.refreshNightBoard();
    const replay = el("catopReplay");
    if (replay) replay.hidden = false;
    const call = el("catopCall");
    if (call) call.hidden = true;
  }

  function resetToVestibule() {
    run = null;
    lookHeld = 0;
    keys.l = keys.r = false;
    const verdict = el("catopVerdict");
    if (verdict) verdict.hidden = true;
    if (kit && kit.hideResult) kit.hideResult("catopResult");
    const startBtn = el("catopStart");
    if (startBtn) { startBtn.disabled = false; startBtn.hidden = false; startBtn.textContent = "START · 1 demo coin"; }
    kit.setMode(card(), "vestibule");
    if (world) {
      world.flash = 0;
      world.orb.visible = false;
      dressRoom(null);
    }
    setText("catopStatus", "HOLD the matching glass · look away and the glass takes you");
    setText("catopHudLine", "ROOM 0");
    pointerHeld = false;
    pointerIds.clear();
    setText("catopGazes", "—");
    setText("catopFill", "—");
    setText("catopStrikes", "0/3");
    const call = el("catopCall");
    if (call) call.hidden = true;
    const actions = el("catopActions");
    if (actions) actions.hidden = true;
    const vest = el("catopVestibule");
    if (vest) vest.hidden = false;
    const cross = el("catopCrosshair");
    if (cross) cross.hidden = true;
  }

  function punchStart() {
    setText("catopStatus", "Depth run — press START. Hold the matching glass. Don’t look away.");
    const btn = el("catopStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* */ }
    }
  }

  function pointerFromEvent(ev) {
    const canvas = el("catopCanvas");
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const t = (ev.touches && ev.touches[0]) || ev;
    pointerNdc.x = ((t.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    pointerNdc.y = -(((t.clientY - r.top) / Math.max(1, r.height)) * 2 - 1);
  }

  PF.registerVendor({
    id: "catoptromancy",
    playKey: "catoptromancy",
    chalk: "Hold the matching glass. Don’t look away.",
    defaults: { bestCatopRooms: 0, bestCatopScore: 0 },
    onLeave() {
      visible = false;
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      pauseWorld();
    },
    onShow() {
      visible = true;
      declareP0();
      ensureWorld();
      playWorld();
      requestAnimationFrame(() => resizeWorld());
    },
    onReset() { resetToVestibule(); },
    refreshDepth(state) {
      const playing = isLive() || !!(run && run.dying);
      setText("depthCatopNow", playing ? `Room ${run.room}` : "Room 0");
      const bestN = Math.max(state.bestCatopRooms || 0, (state.bestDepth && state.bestDepth.catoptromancy) || 0);
      setText("depthCatopBest", bestN ? `Room ${bestN}` : "—");
      setText("depthCatopScore", playing ? String(run.score) : "0");
      setText("depthCatopBestScore", state.bestCatopScore ? String(state.bestCatopScore) : "—");
      const door = el("catopDoorBest");
      if (door) door.textContent = bestN ? `Room ${bestN}` : "Room —";
    },
    bind() {
      declareP0();
      const startBtn = el("catopStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const replay = el("catopReplay");
      if (replay) replay.addEventListener("click", start);
      const setHold = (id, on) => {
        if (on) pointerIds.add(id);
        else pointerIds.delete(id);
        pointerHeld = pointerIds.size > 0;
      };
      const canvas = el("catopCanvas");
      if (canvas) {
        canvas.addEventListener("pointermove", (ev) => {
          pointerOver = true;
          pointerFromEvent(ev);
        });
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) { punchStart(); return; }
          if (run.phase !== "aim") return;
          ev.preventDefault();
          pointerOver = true;
          pointerFromEvent(ev);
          try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* */ }
          setHold(ev.pointerId, true);
          if (arrived() && !run.seenHold) {
            const over = glassUnderAim();
            if (over) beginGaze(over);
          }
        });
        const up = (ev) => { setHold(ev.pointerId, false); };
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("pointercancel", up);
        canvas.addEventListener("lostpointercapture", up);
        canvas.addEventListener("pointerenter", () => { pointerOver = true; });
        canvas.addEventListener("pointerleave", () => { if (!pointerHeld) pointerOver = false; });
        canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());
      }
      window.addEventListener("keydown", (ev) => {
        if (!cabinetOn()) return;
        if (ev.code === "ArrowLeft" || ev.code === "KeyA") keys.l = true;
        if (ev.code === "ArrowRight" || ev.code === "KeyD") keys.r = true;
        if (!isLive()) return;
        if (ev.code === "Space" || ev.key === " ") {
          ev.preventDefault();
          setHold("kbd", true);
        }
      });
      window.addEventListener("keyup", (ev) => {
        if (ev.code === "ArrowLeft" || ev.code === "KeyA") keys.l = false;
        if (ev.code === "ArrowRight" || ev.code === "KeyD") keys.r = false;
        if (ev.code === "Space" || ev.key === " ") setHold("kbd", false);
      });
      window.addEventListener("blur", () => {
        keys.l = keys.r = false; lookHeld = 0;
        pointerIds.clear(); pointerHeld = false; pointerOver = false;
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          pointerIds.clear(); pointerHeld = false; pointerOver = false;
        }
      });
      const copyBtn = el("catopChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = lastDepth();
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("catopCopied");
            if (copied) copied.hidden = false;
            setText("catopStatus", "Challenge copied");
          }, () => { setText("catopStatus", text); });
        });
      }
      window.addEventListener("resize", resizeWorld);
      ensureWorld();
    },
  });
}
