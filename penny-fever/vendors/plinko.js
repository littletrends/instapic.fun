/* Plinko Pegboard — 3D Breath Board tent. Desktop Grok owns this doorway.
 * PF only. Never booth/port 6000. Never Imagine downloads.
 * Custom engine · depthUnit Drop · one coin · authored rooms then ENDLESS.
 * Family carnival prize pockets — not a casino. */
import * as THREE from "../world/lib/three.module.min.js";

(function bootPlinko() {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) {
    if (bootPlinko.tries > 80) return;
    bootPlinko.tries = (bootPlinko.tries || 0) + 1;
    setTimeout(bootPlinko, 40);
    return;
  }

  const { $, kit } = PF;
  const GAME_ID = "plinko";
  const TAU = Math.PI * 2;
  const DEATH_HOLD_MS = 760;
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const ROWS = 9;
  const SLOTS = 10;
  const CHIP_R = 0.078;
  const PEG_R = 0.05;
  const BOARD_W = 2.24;
  const BOARD_TOP = 3.48;
  const BOARD_BOT = 0.62;
  const DROP_Y = 3.42;
  const GRAV = 2.72;
  const REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const PRIZES = ["LINT", "BUTTON", "STUB", "TICKET", "RIBBON", "STAR", "CROWN", "HEART", "FEVER", "AURA"];
  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;

  let run = null;
  let world = null;
  let hoverLane = 2;
  let idleRoom = 1;
  let idleClock = 0;
  let pointer = { x: 0, y: 0, inside: false };
  let playerTilt = 0;
  let tiltHeld = 0;
  let dragState = { on: false, x: 0, dragging: false };

  const AURA = {
    exhaust: "Aura: Three pennies, no souvenir. You let the board breathe without you.",
    deadpeg: "Aura: That peg ate your penny. That’s the house.",
    funnel: "Aura: The funnel looked like a prize highway. It spat you wide.",
    gate: "Aura: The gate was shut. You dropped the closed beat.",
    twin: "Aura: One ribbon isn’t a contract. Need two souvenirs.",
    mirror: "Aura: You picked left. It fell right.",
    cheat: "Aura: The pegs lunged. You didn’t lean against them.",
    shallow: "Aura: Not a single souvenir. Lean while it falls.",
    mid: "Aura: Cute pockets. The pegs still cheat mid-drop.",
    deep: (n) => `Aura: Drop ${n}. You leaned through the lunge.`,
    coda: (n) => `Aura: ENDLESS drop ${n}. You leaned with the lie.`,
    leave: "Aura: You walked mid-drop. Pennies stay in the house.",
    clear: "Aura: Souvenir pocket. Leftover pennies stay in the house.",
    souvenir: "Aura: Eight drops locked. Souvenir — the board salutes.",
  };

  const AUTHORED = [
    {
      id: 1, name: "Soft Breath Board", kind: "teach", targetSlotMin: 3, chips: 3,
      tiltAmp: 0.09, tiltHz: 0.32, dropLanes: 5, deadPegEveryNthRow: 0,
      biasFromEntry: true, funnelLie: false, slideGate: false, twinNeed: 0,
      mirror: false, golden: false, teachPulse: true,
      barker: "LEAN while it falls. Soft house-breath. Pegs telegraph a lunge. Need TICKET+.",
    },
    {
      id: 2, name: "Mid Tide", kind: "tide", targetSlotMin: 4, chips: 3,
      tiltAmp: 0.16, tiltHz: 0.4, dropLanes: 5, deadPegEveryNthRow: 0,
      biasFromEntry: true, funnelLie: false, slideGate: false, twinNeed: 0,
      mirror: false, golden: false, teachPulse: false,
      barker: "House breath fights harder. KEEP leaning. Need RIBBON+.",
    },
    {
      id: 3, name: "Funnel Lie", kind: "funnel", targetSlotMin: 5, chips: 3,
      tiltAmp: 0.16, tiltHz: 0.42, dropLanes: 5, deadPegEveryNthRow: 0,
      biasFromEntry: true, funnelLie: true, slideGate: false, twinNeed: 0,
      mirror: false, golden: false, teachPulse: false,
      barker: "Looks like a souvenir highway. Bottom kicks you wide. Need STAR+.",
    },
    {
      id: 4, name: "Dead Peg Gallery", kind: "dead", targetSlotMin: 5, chips: 3,
      tiltAmp: 0.16, tiltHz: 0.45, dropLanes: 5, deadPegEveryNthRow: 3,
      biasFromEntry: true, funnelLie: false, slideGate: false, twinNeed: 0,
      mirror: false, golden: false, teachPulse: false,
      barker: "Every third row swallows. Pegs still lunge. Need STAR+.",
    },
    {
      id: 5, name: "Gate Row", kind: "gate", targetSlotMin: 6, chips: 3,
      tiltAmp: 0.18, tiltHz: 0.45, dropLanes: 5, deadPegEveryNthRow: 0,
      biasFromEntry: true, funnelLie: false, slideGate: true, gateMs: 1600,
      twinNeed: 0, mirror: false, golden: false, teachPulse: false,
      barker: "Gate + lunging pegs. Lean through the gap. Need CROWN+.",
    },
    {
      id: 6, name: "Twin Slot Contract", kind: "twin", targetSlotMin: 5, chips: 3,
      tiltAmp: 0.16, tiltHz: 0.45, dropLanes: 5, deadPegEveryNthRow: 0,
      biasFromEntry: true, funnelLie: false, slideGate: false, twinNeed: 2,
      mirror: false, golden: false, teachPulse: false,
      barker: "Two souvenirs STAR+. One ribbon isn’t a contract.",
    },
    {
      id: 7, name: "Mirror Drop", kind: "mirror", targetSlotMin: 6, chips: 3,
      tiltAmp: 0.26, tiltHz: 0.5, dropLanes: 5, deadPegEveryNthRow: 0,
      biasFromEntry: true, funnelLie: false, slideGate: false, twinNeed: 0,
      mirror: true, golden: false, teachPulse: false,
      barker: "Pick left, it falls right. Pegs lunge the other way. Need CROWN+.",
    },
    {
      id: 8, name: "Fever Peg Opera", kind: "fever", targetSlotMin: 7, chips: 3,
      tiltAmp: 0.28, tiltHz: 0.52, dropLanes: 5, deadPegEveryNthRow: 3,
      biasFromEntry: true, funnelLie: true, slideGate: true, gateMs: 1500,
      twinNeed: 0, mirror: false, golden: true, teachPulse: false,
      barker: "Funnel + swallows + gate. Pegs lunge fast. Golden peg is a friend. Need HEART+.",
    },
  ];

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Plinko Pegboard",
    depthUnit: "Drop",
    sheet: "GOBLIN_AUTHORED_LEVELS_B03.md",
    batchSheet: "GOBLIN_BATCH03_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · LEAN THE FALL · pegs cheat mid-drop",
    body: "One coin. Lean the tower the whole time the penny falls. Pegs telegraph a lunge — glow, then shove. Lean against them. Souvenir pockets are carnival prizes, not a payout. Leftovers stay in Aura’s till.",
    status: "Lean while it falls · pegs cheat mid-drop · souvenir pockets",
    machine: "Breath Board · 1 demo coin · lean is the verb",
    punch: "PLAY NOW — hold LEAN through the fall. Pegs lunge. Counter-lean.",
  };

  function rk() { return PF.runKit || null; }
  function el(id) { return $(id); }
  function setText(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function card() { return el("plinkoCard"); }
  function cabinetOn() {
    const node = document.getElementById("cabinet-plinko");
    return !!(node && !node.hidden);
  }
  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }
  function canGL() {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch (_) {
      return false;
    }
  }

  function plinkoCoda(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const t = stage - AUTHORED_COUNT;
    return {
      id: stage,
      name: `Dead Peg Rows ${stage}`,
      title: `Dead Peg Rows ${stage}`,
      kind: "coda",
      targetSlotMin: Math.min(8, 6 + Math.floor(t / 2)),
      chips: 3,
      tiltAmp: 0.28,
      tiltHz: Math.min(0.7, 0.5 + 0.02 * t),
      dropLanes: 5,
      deadPegEveryNthRow: 3,
      biasFromEntry: true,
      funnelLie: true,
      slideGate: t % 2 === 0,
      gateMs: 1500,
      twinNeed: 0,
      mirror: false,
      golden: t % 3 === 0,
      teachPulse: false,
      coda: true,
      barker: "ENDLESS — swallows, funnel, lunging pegs. Lean the whole fall.",
    };
  }

  function plinkoStageParams(n) {
    const stage = Math.max(1, n | 0);
    let spec;
    if (stage <= AUTHORED_COUNT) spec = Object.assign({ coda: false }, AUTHORED[stage - 1]);
    else if (!CODA_ENABLED) return null;
    else spec = plinkoCoda(stage);
    spec.title = spec.name;
    return spec;
  }

  function prizeNeed(spec) {
    const i = spec && spec.targetSlotMin != null ? spec.targetSlotMin | 0 : 3;
    return (PRIZES[i] || "TICKET") + "+";
  }

  function roomTell(spec) {
    if (!spec) return "LEAN WHILE IT FALLS";
    if (spec.coda) return "ENDLESS · PEGS LUNGE · KEEP LEANING";
    if (spec.kind === "funnel" || spec.funnelLie) {
      return spec.kind === "fever" ? "LUNGE + FUNNEL + GATE · LEAN THROUGH" : "HIGHWAY LIE · PEGS KICK WIDE";
    }
    if (spec.kind === "dead") return "SWALLOW PEGS · OTHERS LUNGE MID-DROP";
    if (spec.kind === "gate" || spec.slideGate) return "GATE + LUNGING PEGS · LEAN THE GAP";
    if (spec.kind === "twin") return "TWO SOUVENIRS · PEGS STILL CHEAT";
    if (spec.kind === "mirror") return "PICK LEFT · FALLS RIGHT · LUNGE FLIPS";
    if (spec.kind === "tide") return "HOUSE BREATH FIGHTS · KEEP LEANING";
    return "LEAN THE WHOLE FALL · PEGS TELEGRAPH A LUNGE";
  }

  function boardTilt(spec, tMs) {
    const hz = spec && spec.tiltHz != null ? spec.tiltHz : 0.35;
    const amp = spec && spec.tiltAmp != null ? spec.tiltAmp : 0.08;
    return Math.sin((tMs / 1000) * hz * TAU) * amp;
  }

  function houseMix(spec) {
    if (!spec) return 0.35;
    if (spec.houseMix != null) return spec.houseMix;
    if (spec.kind === "teach") return 0.16;
    if (spec.coda) return 0.84;
    if (spec.kind === "fever" || spec.kind === "mirror") return 0.7;
    return clamp(0.28 + (spec.id || 1) * 0.05, 0.2, 0.8);
  }

  function liveTilt(spec, tMs) {
    const house = boardTilt(spec, tMs);
    if (!isLive()) return house;
    return clamp(playerTilt + house * houseMix(spec), -0.48, 0.48);
  }

  function stepPlayerTilt(dt) {
    const target = tiltHeld * 0.38;
    playerTilt = lerp(playerTilt, target, clamp(dt * 7.6, 0, 1));
    if (Math.abs(playerTilt) < 0.002 && !tiltHeld) playerTilt = 0;
  }

  function slotW() { return BOARD_W / SLOTS; }
  function slotX(i) { return -BOARD_W / 2 + (i + 0.5) * slotW(); }
  function slotFromX(x) {
    return clamp(Math.floor((x + BOARD_W / 2) / slotW()), 0, SLOTS - 1);
  }
  function laneX(lane, lanes) {
    const n = lanes || 5;
    const i = clamp(lane | 0, 0, n - 1);
    const inner = BOARD_W * 0.72;
    if (n <= 1) return 0;
    return -inner / 2 + i * (inner / (n - 1));
  }

  function gateState(spec, tMs) {
    if (!spec || !spec.slideGate) return null;
    const period = spec.gateMs || 1600;
    const phase = (tMs % period) / period;
    const open = phase > 0.3 && phase < 0.72;
    const telegraph = phase > 0.18 && phase < 0.3;
    const y = BOARD_BOT + (BOARD_TOP - BOARD_BOT) * 0.48;
    const gapX = Math.sin(tMs * 0.0018) * BOARD_W * 0.28;
    return { y, open, telegraph, gapX, gapW: open ? 0.46 : 0.1, h: 0.1 };
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: plinkoStageParams,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      codaParams: plinkoCoda,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function canvasTex(w, h, draw, repeatX, repeatY) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX || 1, repeatY || 1);
    t.anisotropy = 4;
    t.needsUpdate = true;
    return t;
  }

  function mat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color,
      roughness: 0.72,
      metalness: 0.08,
    }, extra || {}));
  }

  function meshBox(material, w, h, d, x, y, z) {
    const m = new THREE.Mesh(world.geo.box, material);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    return m;
  }

  function meshSphere(material, r, x, y, z) {
    const m = new THREE.Mesh(world.geo.sphere, material);
    m.scale.setScalar(r);
    m.position.set(x, y, z);
    return m;
  }

  function meshCyl(material, rTop, rBot, h, x, y, z) {
    const m = new THREE.Mesh(world.geo.cyl, material);
    m.scale.set(rTop, h, rBot);
    m.position.set(x, y, z);
    return m;
  }

  function woodTex() {
    return canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 18; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${0.04 + (i % 3) * 0.03})`;
        ctx.fillRect(i * 14 + 4, 0, 3, 256);
      }
      ctx.strokeStyle = "rgba(212,164,90,0.18)";
      ctx.lineWidth = 1.2;
      for (let y = 8; y < 256; y += 17) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(80, y + 6, 160, y - 5, 256, y + 3);
        ctx.stroke();
      }
    }, 3, 3);
  }

  function stripeTex() {
    return canvasTex(128, 128, (ctx) => {
      for (let i = 0; i < 8; i += 1) {
        ctx.fillStyle = i % 2 ? "#1a4a4a" : "#f0e2c4";
        ctx.fillRect(i * 16, 0, 16, 128);
      }
    }, 6, 2);
  }

  function plankTex() {
    return canvasTex(512, 512, (ctx) => {
      ctx.fillStyle = "#16110c";
      ctx.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 512; y += 40) {
        ctx.fillStyle = y % 80 ? "#2a2118" : "#20180f";
        ctx.fillRect(0, y, 512, 36);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, y + 35, 512, 2);
        ctx.fillStyle = "rgba(255,196,90,0.10)";
        ctx.fillRect(50 + (y % 90), y + 10, 160, 5);
      }
    }, 1, 6);
  }

  function pennyTex() {
    return canvasTex(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(46, 42, 8, 64, 64, 62);
      g.addColorStop(0, "#f7e2b0");
      g.addColorStop(0.55, "#d4a45a");
      g.addColorStop(1, "#8a6230");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = "#5a3a18";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(64, 64, 56, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "#3a2418";
      ctx.font = "bold 44px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("1¢", 64, 68);
    });
  }

  function slotTex(label, pay) {
    return canvasTex(128, 64, (ctx) => {
      ctx.fillStyle = pay ? "#1a4a48" : "#1a1010";
      ctx.fillRect(0, 0, 128, 64);
      ctx.strokeStyle = pay ? "#7ad4c8" : "#8a6230";
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, 120, 56);
      ctx.fillStyle = pay ? "#f0d09a" : "#8a6a58";
      ctx.font = "bold 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 64, 34);
    });
  }

  function signTex(title, sub) {
    return canvasTex(512, 160, (ctx) => {
      ctx.fillStyle = "#1a0c10";
      ctx.fillRect(0, 0, 512, 160);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, 496, 144);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "700 42px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(title, 256, 72);
      ctx.fillStyle = "#7ad4c8";
      ctx.font = "22px Georgia, serif";
      ctx.fillText(sub, 256, 118);
    });
  }

  function makePenny() {
    const g = new THREE.Group();
    const face = new THREE.MeshStandardMaterial({
      map: world.tex.penny,
      roughness: 0.38,
      metalness: 0.55,
      emissive: 0x3a2810,
      emissiveIntensity: 0.18,
    });
    const rim = mat(0xd4a45a, { metalness: 0.62, roughness: 0.32 });
    const disk = new THREE.Mesh(new THREE.CircleGeometry(1, 22), face);
    disk.position.z = 0.06;
    const diskB = disk.clone();
    diskB.position.z = -0.06;
    diskB.rotation.y = Math.PI;
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.12, 22, 1, true), rim);
    edge.rotation.x = Math.PI / 2;
    g.add(disk, diskB, edge);
    g.scale.setScalar(CHIP_R);
    return g;
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = mat(SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const blouse = mat(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.2 });
    const dress = mat(DRESS, { emissive: 0x0a2010, emissiveIntensity: 0.25 });
    const dark = mat(0x141414, { metalness: 0.72, roughness: 0.22 });
    g.scale.setScalar(1.12);

    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(meshCyl(blouse, 0.12, 0.15, 0.28, 0, 0.28, 0));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.12, 0.36, 12), dress);
    skirt.position.y = 0.06;
    hip.add(skirt);
    const heart = meshBox(mat(HEART, { emissive: HEART, emissiveIntensity: 0.55, roughness: 0.4 }), 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    heart.rotation.z = Math.PI / 4;
    hip.add(heart);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 16), blouse);
    collar.position.y = 0.44;
    collar.rotation.x = Math.PI / 2;
    hip.add(collar);

    const head = new THREE.Group();
    head.position.y = 0.64;
    hip.add(head);
    head.add(meshSphere(skin, 0.22, 0, 0.02, 0));
    const eyeW = mat(0xf7f2ea);
    const eyeD = mat(0x2a1810);
    [-1, 1].forEach((side) => {
      const white = meshSphere(eyeW, 0.05, side * 0.07, 0.03, 0.19);
      white.scale.set(0.05, 0.058, 0.02);
      head.add(white);
      head.add(meshSphere(eyeD, 0.026, side * 0.07, 0.03, 0.21));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), mat(0xc45a6a));
    smile.position.set(0, -0.05, 0.2);
    smile.rotation.x = 2.6;
    head.add(smile);

    const hairM = mat(HAIR, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });
    head.add(meshSphere(hairM, 0.23, 0, 0.06, -0.02));
    [-1, 1].forEach((side) => {
      head.add(meshSphere(hairM, 0.11, side * 0.2, -0.04, 0.04));
      head.add(meshSphere(mat(HEART, { emissive: HEART, emissiveIntensity: 0.6 }), 0.045, side * 0.2, 0.06, 0.06));
    });
    head.add(meshBox(hairM, 0.28, 0.07, 0.1, 0, 0.14, 0.16));

    const crown = new THREE.Group();
    crown.position.y = 0.24;
    head.add(crown);
    const gold = mat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold));
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, h, 6), gold);
      spike.position.set(x, h * 0.45, 0);
      crown.add(spike);
    });
    const gem = meshBox(mat(HEART, { emissive: HEART, emissiveIntensity: 0.7 }), 0.055, 0.055, 0.025, 0, 0.02, 0.11);
    gem.rotation.z = Math.PI / 4;
    crown.add(gem);

    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0.0, 0);
      const len = arm ? 0.28 : 0.34;
      const rad = arm ? 0.035 : 0.042;
      pivot.add(meshCyl(arm ? skin : dress, rad, rad, len, 0, -len / 2, 0));
      if (!arm) pivot.add(meshBox(dark, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03));
      else pivot.add(meshSphere(skin, 0.04, 0, -len, 0));
      hip.add(pivot);
      return pivot;
    }

    g.userData = {
      kind: "aura",
      t: 0,
      pose: "idle",
      armL: limb(-1, true),
      armR: limb(1, true),
      legL: limb(-1, false),
      legR: limb(1, false),
      head,
      hip,
    };
    return g;
  }

  function poseAura(dt) {
    if (!world || !world.aura) return;
    const u = world.aura.userData;
    const mode = (run && run.auraPose) || (isLive() ? "watch" : "idle");
    const speed = mode === "cheer" ? 10 : mode === "watch" ? 3.2 : 2.4;
    u.t += dt * speed;
    u.hip.position.y = 0.42 + Math.sin(u.t) * (mode === "cheer" ? 0.03 : 0.014);
    u.head.rotation.y = Math.sin(u.t * 0.35) * 0.16;
    if (mode === "cheer") {
      u.armL.rotation.z = 2.05;
      u.armR.rotation.z = -2.05;
      u.armL.rotation.x = -0.15 + Math.sin(u.t * 2.2) * 0.18;
      u.armR.rotation.x = -0.15 + Math.cos(u.t * 2.2) * 0.18;
      u.head.rotation.x = -0.12;
    } else if (mode === "watch") {
      u.armL.rotation.z = 0.12;
      u.armR.rotation.z = -0.12;
      u.armL.rotation.x = -0.45;
      u.armR.rotation.x = -0.35;
      u.head.rotation.x = 0.18;
      u.head.rotation.y = 0.22 + Math.sin(u.t * 0.4) * 0.08;
    } else if (mode === "miss") {
      u.armR.rotation.x = -1.35;
      u.armR.rotation.z = -0.4;
      u.armL.rotation.x = 0.2;
      u.head.rotation.x = 0.38;
    } else if (mode === "swallow") {
      u.head.rotation.y = -0.45;
      u.armL.rotation.z = 0.8;
      u.armR.rotation.z = -0.8;
    } else {
      const swing = Math.sin(u.t * 0.5) * 0.08;
      u.armL.rotation.x = swing;
      u.armR.rotation.z = -0.85 + Math.sin(u.t * 1.6) * 0.4;
      u.armR.rotation.x = -0.15;
      u.head.rotation.x = 0;
    }
    u.legL.rotation.x = -0.04;
    u.legR.rotation.x = 0.04;
  }

  function makeTent() {
    const tent = new THREE.Group();
    const stripe = new THREE.MeshStandardMaterial({
      map: world.tex.stripe,
      roughness: 0.86,
      metalness: 0.02,
    });
    const plank = new THREE.MeshStandardMaterial({ map: world.tex.plank, roughness: 0.9 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), plank);
    floor.rotation.x = -Math.PI / 2;
    tent.add(floor);

    const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 5.4), stripe);
    back.position.set(0, 2.6, -3.15);
    tent.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(10, 5.4), stripe);
    left.position.set(-5.4, 2.6, 0.4);
    left.rotation.y = Math.PI / 2;
    tent.add(left);
    const right = left.clone();
    right.position.x = 5.4;
    right.rotation.y = -Math.PI / 2;
    tent.add(right);

    const roofL = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 6.2), stripe);
    roofL.position.set(-2.1, 5.1, -0.2);
    roofL.rotation.set(Math.PI / 2.6, 0, 0.42);
    tent.add(roofL);
    const roofR = roofL.clone();
    roofR.position.x = 2.1;
    roofR.rotation.z = -0.42;
    tent.add(roofR);

    const poleM = mat(0x5a3a18);
    tent.add(meshCyl(poleM, 0.07, 0.07, 5.2, -4.6, 2.6, -2.8));
    tent.add(meshCyl(poleM, 0.07, 0.07, 5.2, 4.6, 2.6, -2.8));
    tent.add(meshCyl(poleM, 0.08, 0.08, 5.6, 0, 2.8, -3.0));

    world.lanterns = [];
    for (let i = 0; i < 8; i += 1) {
      const x = -3.4 + i * 0.97;
      const bulb = meshSphere(mat(0xf0d09a, { emissive: 0xf0d09a, emissiveIntensity: 0.9 }), 0.07, x, 4.05, -1.4);
      tent.add(bulb);
      const light = new THREE.PointLight(0xffd090, 0.55, 4.8, 2);
      light.position.set(x, 3.9, -1.1);
      tent.add(light);
      world.lanterns.push({ bulb, light, phase: i * 0.7 });
    }

    const motes = new THREE.BufferGeometry();
    const pos = new Float32Array(180);
    for (let i = 0; i < 60; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 1] = 0.3 + Math.random() * 4.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    motes.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(motes, new THREE.PointsMaterial({
      color: 0xf0d09a, size: 0.035, transparent: true, opacity: 0.42, depthWrite: false,
    }));
    tent.add(dust);
    world.dust = dust;

    const poster = new THREE.Mesh(
      world.geo.box,
      new THREE.MeshBasicMaterial({ map: world.tex.poster || world.tex.wood })
    );
    poster.scale.set(1.05, 1.45, 0.04);
    poster.position.set(4.55, 1.85, -0.2);
    poster.rotation.y = -Math.PI / 2;
    tent.add(poster);

    return tent;
  }

  function makeTill() {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ map: world.tex.wood, roughness: 0.7 });
    g.add(meshBox(wood, 0.7, 0.55, 0.5, 0, 0.28, 0));
    g.add(meshBox(mat(0x1a1010), 0.42, 0.04, 0.12, 0, 0.58, 0.08));
    const sign = new THREE.Mesh(world.geo.box, new THREE.MeshBasicMaterial({ map: signTex("HOUSE TILL", "leftovers stay") }));
    sign.scale.set(0.62, 0.2, 0.02);
    sign.position.set(0, 0.78, 0.18);
    g.add(sign);
    g.position.set(-2.55, 0, 1.85);
    g.rotation.y = 0.55;
    return g;
  }

  function makeShelf() {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ map: world.tex.wood, roughness: 0.7 });
    g.add(meshBox(wood, 0.9, 1.4, 0.28, 0, 0.7, 0));
    const star = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.28, 5), mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.35 }));
    star.position.set(0, 1.28, 0.18);
    g.add(star);
    world.prizeStar = star;
    const ribbon = meshBox(mat(0xc41e3a, { emissive: 0x401018, emissiveIntensity: 0.2 }), 0.22, 0.08, 0.04, 0.18, 0.55, 0.16);
    g.add(ribbon);
    g.position.set(2.55, 0, 0.55);
    g.rotation.y = -0.4;
    return g;
  }

  function makeMachine() {
    const machine = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ map: world.tex.wood, roughness: 0.62 });
    const dark = mat(0x1a100c);
    const brass = mat(0xd4a45a, { metalness: 0.58, roughness: 0.32, emissive: 0x3a2808, emissiveIntensity: 0.12 });

    machine.add(meshBox(wood, 2.82, 4.22, 0.78, 0, 2.12, -0.12));
    machine.add(meshBox(dark, 2.36, 3.28, 0.08, 0, 2.02, 0.22));
    machine.add(meshBox(wood, 0.12, 3.3, 0.42, -1.18, 2.02, 0.32));
    machine.add(meshBox(wood, 0.12, 3.3, 0.42, 1.18, 2.02, 0.32));
    machine.add(meshBox(wood, 2.5, 0.16, 0.42, 0, 3.62, 0.32));
    machine.add(meshBox(wood, 2.5, 0.22, 0.5, 0, 0.42, 0.28));

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.28, 3.18),
      new THREE.MeshStandardMaterial({
        color: 0x88c8c4, transparent: true, opacity: 0.07, roughness: 0.12, metalness: 0.15,
      })
    );
    glass.position.set(0, 2.02, 0.52);
    machine.add(glass);

    const marquee = new THREE.Mesh(world.geo.box, new THREE.MeshBasicMaterial({ map: world.tex.marquee }));
    marquee.scale.set(2.5, 0.42, 0.06);
    marquee.position.set(0, 4.28, 0.28);
    machine.add(marquee);
    world.marqueeMesh = marquee;

    world.bulbs = [];
    for (let i = 0; i < 11; i += 1) {
      const b = meshSphere(mat(0xf0d09a, { emissive: 0xf0d09a, emissiveIntensity: 0.8 }), 0.045, -1.15 + i * 0.23, 4.52, 0.36);
      machine.add(b);
      world.bulbs.push(b);
    }

    const boardRoot = new THREE.Group();
    boardRoot.position.set(0, 0, 0.28);
    machine.add(boardRoot);
    world.boardRoot = boardRoot;

    const felt = meshBox(mat(0x14302c, { roughness: 0.9 }), BOARD_W + 0.06, BOARD_TOP - BOARD_BOT + 0.2, 0.04, 0, (BOARD_TOP + BOARD_BOT) / 2, -0.08);
    boardRoot.add(felt);

    world.pegs = [];
    const pegGeo = new THREE.CylinderGeometry(1, 1, 1, 10);
    for (let i = 0; i < 120; i += 1) {
      const peg = new THREE.Mesh(pegGeo, brass.clone());
      peg.rotation.x = Math.PI / 2;
      peg.scale.set(PEG_R, 0.16, PEG_R);
      peg.visible = false;
      boardRoot.add(peg);
      world.pegs.push(peg);
    }

    world.slots = [];
    for (let i = 0; i < SLOTS; i += 1) {
      const pocket = new THREE.Group();
      const body = meshBox(mat(0x1a1010), slotW() * 0.92, 0.28, 0.22, 0, 0, 0);
      pocket.add(body);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(slotW() * 0.88, 0.2), new THREE.MeshBasicMaterial({ map: slotTex(PRIZES[i], i >= 3) }));
      face.position.z = 0.12;
      pocket.add(face);
      pocket.position.set(slotX(i), BOARD_BOT - 0.02, 0.06);
      pocket.userData = { body, face, i, pop: 0 };
      boardRoot.add(pocket);
      world.slots.push(pocket);
    }

    world.cups = [];
    for (let i = 0; i < 5; i += 1) {
      const cup = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.16, 10, 1, true),
        mat(0xd4a45a, { metalness: 0.45, roughness: 0.4, side: THREE.DoubleSide, emissive: 0x3a8a8a, emissiveIntensity: 0 })
      );
      cup.position.set(laneX(i, 5), DROP_Y + 0.12, 0.08);
      cup.userData = { lane: i };
      boardRoot.add(cup);
      world.cups.push(cup);
    }

    const funnelL = meshBox(brass, 0.06, 1.7, 0.08, -0.62, 2.35, 0.05);
    funnelL.rotation.z = 0.28;
    const funnelR = funnelL.clone();
    funnelR.position.x = 0.62;
    funnelR.rotation.z = -0.28;
    boardRoot.add(funnelL, funnelR);
    world.funnelL = funnelL;
    world.funnelR = funnelR;

    const gate = new THREE.Group();
    const barL = meshBox(mat(0x8a2030, { emissive: 0x400810, emissiveIntensity: 0.25 }), 0.9, 0.1, 0.08, -0.7, 0, 0.08);
    const barR = meshBox(mat(0x8a2030, { emissive: 0x400810, emissiveIntensity: 0.25 }), 0.9, 0.1, 0.08, 0.7, 0, 0.08);
    gate.add(barL, barR);
    gate.position.y = BOARD_BOT + (BOARD_TOP - BOARD_BOT) * 0.48;
    gate.userData = { barL, barR };
    boardRoot.add(gate);
    world.gate = gate;

    const mirror = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.85),
      new THREE.MeshStandardMaterial({
        color: 0xc8e8e4, transparent: true, opacity: 0.22, roughness: 0.08, metalness: 0.55,
        emissive: 0x3a8a8a, emissiveIntensity: 0.15,
      })
    );
    mirror.position.set(0, DROP_Y - 0.15, 0.14);
    boardRoot.add(mirror);
    world.mirrorGlass = mirror;

    const payLine = meshBox(mat(0xc41e3a, { emissive: 0xc41e3a, emissiveIntensity: 0.35, transparent: true, opacity: 0.35 }), 0.02, 2.6, 0.02, 0, 2.0, 0.02);
    boardRoot.add(payLine);
    world.payLine = payLine;

    const pendulum = new THREE.Group();
    pendulum.position.set(0, 3.92, 0.55);
    const rod = meshCyl(brass, 0.012, 0.012, 0.55, 0, -0.28, 0);
    const bob = meshSphere(mat(0xe8a0b8, { emissive: 0xe8a0b8, emissiveIntensity: 0.55 }), 0.07, 0, -0.58, 0);
    pendulum.add(rod, bob);
    machine.add(pendulum);
    world.pendulum = pendulum;

    const crank = new THREE.Group();
    crank.position.set(1.48, 1.7, 0.15);
    crank.add(meshCyl(brass, 0.16, 0.16, 0.05, 0, 0, 0));
    crank.add(meshBox(brass, 0.04, 0.28, 0.04, 0, 0.14, 0));
    machine.add(crank);
    world.crank = crank;

    world.chipMesh = makePenny();
    world.chipMesh.visible = false;
    boardRoot.add(world.chipMesh);
    world.ghostMesh = makePenny();
    world.ghostMesh.traverse((n) => {
      if (n.material) {
        n.material = n.material.clone();
        n.material.transparent = true;
        n.material.opacity = 0.38;
      }
    });
    world.ghostMesh.visible = false;
    boardRoot.add(world.ghostMesh);

    world.pickGhost = makePenny();
    world.pickGhost.traverse((n) => {
      if (n.material) {
        n.material = n.material.clone();
        n.material.transparent = true;
        n.material.opacity = 0.22;
      }
    });
    boardRoot.add(world.pickGhost);

    return machine;
  }

  function layoutBoard(spec) {
    if (!world || !spec) return;
    const every = spec.deadPegEveryNthRow | 0;
    const inner = BOARD_W - 0.18;
    const spacing = inner / (SLOTS - 1);
    const y0 = BOARD_TOP - 0.42;
    const ySpan = y0 - (BOARD_BOT + 0.38);
    let goldPlaced = false;
    let used = 0;
    world.pegData = [];
    for (let r = 0; r < ROWS; r += 1) {
      const odd = r % 2 === 1;
      const count = odd ? SLOTS : SLOTS - 1;
      const offset = odd ? 0 : spacing / 2;
      const y = y0 - (r / (ROWS - 1)) * ySpan;
      const deadRow = every > 0 && ((r + 1) % every === 0);
      const deadCol = deadRow ? ((r * 3 + 2) % count) : -1;
      for (let c = 0; c < count; c += 1) {
        const peg = world.pegs[used];
        used += 1;
        if (!peg) continue;
        const dead = c === deadCol;
        const golden = !!(spec.golden && !goldPlaced && !dead && r === 4 && c === Math.min(count - 1, count - 2));
        if (golden) goldPlaced = true;
        const x = -BOARD_W / 2 + 0.09 + offset + c * spacing;
        peg.visible = true;
        peg.position.set(x, y, 0.02);
        peg.rotation.z = 0;
        peg.userData = { x, y, r: PEG_R, dead, golden, row: r, punch: 0, cheat: 0, lunge: 0 };
        if (dead) {
          peg.material.color.setHex(0x6a1018);
          peg.material.emissive.setHex(0xc41e3a);
          peg.material.emissiveIntensity = 0.45;
          peg.material.metalness = 0.15;
        } else if (golden) {
          peg.material.color.setHex(0xf0d09a);
          peg.material.emissive.setHex(0xf0d09a);
          peg.material.emissiveIntensity = 0.7;
          peg.material.metalness = 0.7;
        } else {
          peg.material.color.setHex(0xd4a45a);
          peg.material.emissive.setHex(0x3a2808);
          peg.material.emissiveIntensity = 0.12;
          peg.material.metalness = 0.58;
        }
        peg.userData.baseEm = peg.material.emissive.getHex();
        peg.userData.baseInt = peg.material.emissiveIntensity;
        world.pegData.push(peg);
      }
    }
    for (let i = used; i < world.pegs.length; i += 1) world.pegs[i].visible = false;

    const need = spec.targetSlotMin | 0;
    world.slots.forEach((slot, i) => {
      const pay = i >= need;
      slot.userData.face.material.map = slotTex(PRIZES[i], pay);
      slot.userData.face.material.needsUpdate = true;
      slot.userData.body.material.color.setHex(pay ? 0x1a4a48 : 0x1a1010);
      slot.userData.body.material.emissive.setHex(pay ? 0x3a8a8a : 0x000000);
      slot.userData.body.material.emissiveIntensity = pay ? 0.22 : 0;
    });
    world.payLine.position.x = -BOARD_W / 2 + need * slotW();
    world.funnelL.visible = world.funnelR.visible = !!spec.funnelLie;
    world.gate.visible = !!spec.slideGate;
    world.mirrorGlass.visible = !!spec.mirror;
    const n = spec.dropLanes || 5;
    world.cups.forEach((cup, i) => {
      cup.visible = i < n;
      if (i < n) cup.position.x = laneX(i, n);
    });
    paintMarquee(spec);
  }

  function paintMarquee(spec) {
    if (!world || !world.marqueeMesh) return;
    const title = spec && spec.name ? spec.name.toUpperCase() : "THE BREATH BOARD";
    const sub = spec ? roomTell(spec) : "DROP WITH THE BREATH";
    world.marqueeMesh.material.map = signTex(title, sub);
    world.marqueeMesh.material.needsUpdate = true;
  }

  function buildWorld() {
    const canvas = el("plinkoCanvas");
    if (!canvas || world) return world;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: (window.devicePixelRatio || 1) < 1.6, powerPreference: "high-performance" });
    } catch (err) {
      setText("plinkoStatus", "This tent needs a 3D lantern (WebGL).");
      return null;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.15;
    renderer.setClearColor(0x070b10, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1014, 0.045);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    camera.position.set(0.25, 2.95, 8.5);

    world = {
      renderer, scene, camera,
      geo: {
        box: new THREE.BoxGeometry(1, 1, 1),
        sphere: new THREE.SphereGeometry(1, 14, 12),
        cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
      },
      tex: {},
      tmpV: new THREE.Vector3(),
      tmpV2: new THREE.Vector3(),
      raycaster: new THREE.Raycaster(),
      ndc: new THREE.Vector2(),
      camPos: new THREE.Vector3(1.85, 2.15, 6.15),
      camLook: new THREE.Vector3(-0.35, 1.55, 0.25),
      lookAt: new THREE.Vector3(-0.35, 1.55, 0.25),
      shake: 0,
      sparks: [],
      confetti: [],
      houseFly: [],
      raf: 0,
      last: 0,
      t: 0,
      ghost: null,
      ghostPause: 0,
    };

    world.tex.wood = woodTex();
    world.tex.stripe = stripeTex();
    world.tex.plank = plankTex();
    world.tex.penny = pennyTex();
    world.tex.marquee = signTex("THE BREATH BOARD", "DROP WITH THE LEAN");
    try {
      const loader = new THREE.TextureLoader();
      world.tex.poster = loader.load("assets/prepared/night-carnival-exterior.webp");
      world.tex.poster.colorSpace = THREE.SRGBColorSpace;
    } catch (_) { world.tex.poster = world.tex.wood; }

    scene.add(new THREE.AmbientLight(0x4a382c, 0.85));
    scene.add(new THREE.HemisphereLight(0x8aa4cc, 0x2a1810, 0.7));
    const key = new THREE.SpotLight(0xffe2b0, 2.4, 14, 0.42, 0.45, 1.2);
    key.position.set(0.4, 5.4, 4.2);
    key.target.position.set(0, 1.8, 0.2);
    scene.add(key, key.target);
    world.spot = key;
    const rim = new THREE.DirectionalLight(0x3a8a8a, 0.55);
    rim.position.set(-4, 3.2, -2);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffc090, 0.45);
    fill.position.set(3.2, 2.8, 4);
    scene.add(fill);

    scene.add(makeTent());
    const machine = makeMachine();
    machine.position.set(0, 0, 0);
    scene.add(machine);
    world.machine = machine;

    const aura = makeAura();
    aura.position.set(-2.15, 0, 1.35);
    aura.rotation.y = 0.62;
    scene.add(aura);
    world.aura = aura;

    scene.add(makeTill());
    world.till = scene.children[scene.children.length - 1];
    scene.add(makeShelf());

    const sparkMat = mat(0xf0d09a, { emissive: 0xf0d09a, emissiveIntensity: 0.9 });
    for (let i = 0; i < 28; i += 1) {
      const s = meshSphere(sparkMat, 0.025, 0, 0, 0);
      s.visible = false;
      scene.add(s);
      world.sparks.push({ mesh: s, life: 0, vx: 0, vy: 0, vz: 0 });
    }
    for (let i = 0; i < 36; i += 1) {
      const c = meshBox(mat([0xc41e3a, 0x3a8a8a, GOLD, 0xe8a0b8][i % 4], { emissive: 0x221008, emissiveIntensity: 0.2 }), 0.05, 0.08, 0.01, 0, 0, 0);
      c.visible = false;
      scene.add(c);
      world.confetti.push({ mesh: c, life: 0, vx: 0, vy: 0, vz: 0, spin: 0 });
    }

    layoutBoard(plinkoStageParams(1));
    resize();
    if (typeof ResizeObserver !== "undefined") {
      world.ro = new ResizeObserver(resize);
      world.ro.observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }
    return world;
  }

  function resize() {
    if (!world) return;
    const canvas = el("plinkoCanvas");
    if (!canvas) return;
    const w = Math.max(64, canvas.clientWidth || (canvas.parentElement && canvas.parentElement.clientWidth) || 640);
    const h = Math.max(64, canvas.clientHeight || (canvas.parentElement && canvas.parentElement.clientHeight) || 520);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width === bw && canvas.height === bh) return;
    world.renderer.setPixelRatio(dpr);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function spawnSparks(x, y, z, n, color) {
    if (!world) return;
    let spawned = 0;
    for (let i = 0; i < world.sparks.length && spawned < n; i += 1) {
      const s = world.sparks[i];
      if (s.life > 0) continue;
      s.life = 0.28 + Math.random() * 0.22;
      s.vx = (Math.random() - 0.5) * 1.8;
      s.vy = Math.random() * 1.4 + 0.2;
      s.vz = (Math.random() - 0.5) * 1.2;
      s.mesh.position.set(x, y, z);
      s.mesh.visible = true;
      if (color) s.mesh.material.color.set(color);
      spawned += 1;
    }
  }

  function spawnConfetti() {
    if (!world) return;
    world.confetti.forEach((c, i) => {
      c.life = 0.8 + Math.random() * 0.6;
      c.vx = (Math.random() - 0.5) * 2.4;
      c.vy = 1.6 + Math.random() * 1.8;
      c.vz = (Math.random() - 0.4) * 1.6;
      c.spin = (Math.random() - 0.5) * 8;
      c.mesh.position.set((Math.random() - 0.5) * 1.4, 2.4, 0.8);
      c.mesh.visible = true;
      c.mesh.rotation.set(Math.random(), Math.random(), Math.random());
    });
  }

  function stepFx(dt) {
    if (!world) return;
    world.sparks.forEach((s) => {
      if (s.life <= 0) { s.mesh.visible = false; return; }
      s.life -= dt;
      s.vy -= 2.8 * dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      s.mesh.scale.setScalar(Math.max(0.2, s.life * 4));
    });
    world.confetti.forEach((c) => {
      if (c.life <= 0) { c.mesh.visible = false; return; }
      c.life -= dt;
      c.vy -= 3.4 * dt;
      c.mesh.position.x += c.vx * dt;
      c.mesh.position.y += c.vy * dt;
      c.mesh.position.z += c.vz * dt;
      c.mesh.rotation.z += c.spin * dt;
    });
    if (world.houseFly) {
      world.houseFly = world.houseFly.filter((f) => {
        f.life -= dt;
        const till = world.till.position;
        f.mesh.position.lerp(world.tmpV.set(till.x, till.y + 0.6, till.z), 0.045);
        f.mesh.rotation.z += dt * 6;
        if (f.life <= 0) {
          world.scene.remove(f.mesh);
          return false;
        }
        return true;
      });
    }
    world.shake *= 0.86;
    if (world.prizeStar) world.prizeStar.rotation.y += dt * 0.8;
    world.lanterns.forEach((L) => {
      const pulse = 0.7 + Math.sin(world.t * 2.2 + L.phase) * 0.28;
      L.light.intensity = pulse;
      L.bulb.material.emissiveIntensity = 0.6 + pulse * 0.5;
    });
    world.bulbs.forEach((b, i) => {
      b.material.emissiveIntensity = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(world.t * 5 + i * 0.6));
    });
    if (world.dust) {
      const arr = world.dust.geometry.attributes.position.array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] += dt * 0.08;
        if (arr[i] > 4.6) arr[i] = 0.2;
      }
      world.dust.geometry.attributes.position.needsUpdate = true;
    }
  }

  function bounceOffPeg(chip, peg, spec, tilt) {
    const dx = chip.x - peg.userData.x;
    const dy = chip.y - peg.userData.y;
    const d = Math.hypot(dx, dy) || 0.0001;
    const nx = dx / d;
    const ny = dy / d;
    const minD = CHIP_R + PEG_R + 0.006;
    chip.x = peg.userData.x + nx * minD;
    chip.y = peg.userData.y + ny * minD;
    const cheat = peg.userData.cheat || 0;
    let dir;
    if (cheat && (peg.userData.lunge || 0) > 0.22) {
      const opposed = tilt * cheat < -0.04;
      dir = opposed ? -cheat : cheat;
      chip.cheated = !opposed;
      if (run && !chip.ghost) {
        toast(opposed ? "YOU LEANED THROUGH THE LUNGE" : (cheat < 0 ? "PEGS LUNGED LEFT" : "PEGS LUNGED RIGHT"), 720);
        if (!opposed) run.cheatHits = (run.cheatHits || 0) + 1;
      }
    } else {
      const pRight = clamp(0.5 + tilt * 3.1 + nx * 0.1, spec.kind === "teach" ? 0.42 : 0.22, spec.kind === "teach" ? 0.9 : 0.86);
      dir = Math.random() < pRight ? 1 : -1;
    }
    if (spec.funnelLie && chip.y < BOARD_BOT + (BOARD_TOP - BOARD_BOT) * 0.45) dir = chip.x >= 0 ? 1 : -1;
    const kick = spec.kind === "teach" ? 0.34 + Math.random() * 0.14 : 0.42 + Math.random() * 0.18;
    chip.vx = dir * kick + tilt * 0.92;
    chip.vy = Math.min(-0.25, -Math.abs(chip.vy) * 0.22 - 0.35);
    chip.vz = (chip.vz || 0) + (Math.random() - 0.5) * 1.15;
    peg.userData.punch = 1;
    const wp = peg.getWorldPosition(world.tmpV);
    if (peg.userData.golden) {
      chip.vx += 0.85;
      chip.goldNudge = true;
      spawnSparks(wp.x, wp.y, wp.z, 10, "#f0d09a");
      if (kit) kit.sfx("tray");
      toast("GOLDEN PEG · NUDGE TOWARD SOUVENIRS", 720);
    } else {
      spawnSparks(wp.x, wp.y, wp.z, cheat ? 8 : 4, cheat ? "#c45a3a" : "#f0d09a");
    }
    world.shake = Math.max(world.shake, cheat ? 0.028 : 0.012);
  }

  function cheatDirFor(spec) {
    if (spec && spec.mirror) return 1;
    return -1;
  }

  function updateCheatPegs(chip, spec, dt) {
    if (!world || !world.pegData) return;
    let any = 0;
    const dir = cheatDirFor(spec);
    const speed = spec && spec.kind === "teach" ? 0.95 : spec && (spec.kind === "fever" || spec.coda) ? 3.4 : 2.05;
    const minAge = spec && spec.kind === "teach" ? 0.28 : 0.1;
    world.pegData.forEach((peg) => {
      const u = peg.userData;
      if (u.dead || u.golden) return;
      const teachSkip = spec && spec.kind === "teach" && (u.row % 2 === 0);
      const approaching = !teachSkip && chip && chip.age > minAge && chip.y > u.y && chip.y < u.y + 0.78 && Math.abs(chip.x - u.x) < 0.68;
      if (approaching) {
        u.cheat = dir;
        u.lunge = Math.min(1, (u.lunge || 0) + dt * speed);
        any += 1;
      } else {
        u.cheat = 0;
        u.lunge = Math.max(0, (u.lunge || 0) - dt * 5);
      }
      peg.rotation.z = dir * 0.62 * (u.lunge || 0);
      if ((u.lunge || 0) > 0.12) {
        peg.material.emissive.setHex(0xc45a3a);
        peg.material.emissiveIntensity = 0.2 + u.lunge * 0.85;
        peg.scale.set(PEG_R * (1 + u.lunge * 0.35), 0.16, PEG_R * (1 + u.lunge * 0.35));
      } else {
        peg.material.emissive.setHex(u.baseEm || 0x3a2808);
        peg.material.emissiveIntensity = u.baseInt != null ? u.baseInt : 0.12;
        peg.rotation.z = 0;
      }
    });
    if (run && chip && any) {
      run.cheatTell = dir < 0 ? "PEGS LUNGE LEFT — LEAN RIGHT" : "PEGS LUNGE RIGHT — LEAN LEFT";
    } else if (run) {
      run.cheatTell = "";
    }
    const tell = el("plinkoCheatTell");
    if (tell) {
      tell.hidden = !(run && run.cheatTell);
      if (run && run.cheatTell) tell.textContent = run.cheatTell;
    }
  }

  function stepChip(chip, spec, tilt, dtSec, scoring) {
    if (!chip || chip.absorbed) {
      if (chip && chip.absorbed) {
        chip.absorbing = (chip.absorbing || 0.36) - dtSec;
        const peg = chip.lastPeg;
        if (peg) {
          chip.x += (peg.userData.x - chip.x) * 8 * dtSec;
          chip.y += (peg.userData.y - chip.y) * 8 * dtSec;
        }
        chip.scale = Math.max(0.15, (chip.scale || 1) - dtSec * 2.2);
        if (chip.absorbing <= 0) return "absorb";
      }
      return "live";
    }
    chip.age = (chip.age || 0) + dtSec;
    chip.spin = (chip.spin || 0) + 9 * dtSec;
    if (chip.age > 7.2) return "land";

    const steps = Math.max(1, Math.ceil(dtSec / (1 / 120)));
    const h = dtSec / steps;
    chip.ignore = Math.max(0, (chip.ignore || 0) - dtSec);
    for (let s = 0; s < steps; s += 1) {
      chip.vx += tilt * (spec.kind === "fever" || spec.coda || spec.kind === "mirror" ? 2.35 : spec.kind === "teach" ? 1.85 : 2.05) * h;
      chip.vx *= Math.pow(0.42, h);
      chip.vx = clamp(chip.vx, -1.55, 1.55);
      chip.vy -= GRAV * h;
      chip.vz = (chip.vz || 0) - ((chip.z || 0.06) - 0.07) * 18 * h;
      chip.vz *= 0.985;
      chip.x += chip.vx * h;
      chip.y += chip.vy * h;
      chip.z = clamp((chip.z || 0.06) + chip.vz * h, 0.02, 0.2);
      if (spec.funnelLie && chip.y < BOARD_BOT + (BOARD_TOP - BOARD_BOT) * 0.45) {
        chip.vx += (chip.x >= 0 ? 1 : -1) * 1.15 * h;
      }
      const left = -BOARD_W / 2 + CHIP_R + 0.04;
      const right = BOARD_W / 2 - CHIP_R - 0.04;
      if (chip.x < left) { chip.x = left; chip.vx = Math.abs(chip.vx) * 0.55; }
      else if (chip.x > right) { chip.x = right; chip.vx = -Math.abs(chip.vx) * 0.55; }

      const gate = gateState(spec, (run ? run.t : world.t * 1000));
      if (gate && chip.y < gate.y + gate.h && chip.y > gate.y - gate.h) {
        const gl = gate.gapX - gate.gapW / 2;
        const gr = gate.gapX + gate.gapW / 2;
        if (chip.x < gl || chip.x > gr) {
          if (chip.x < gate.gapX) { chip.x = gl - CHIP_R; chip.vx = -Math.abs(chip.vx) * 0.5 - 0.45; }
          else { chip.x = gr + CHIP_R; chip.vx = Math.abs(chip.vx) * 0.5 + 0.45; }
          chip.vy = -Math.abs(chip.vy) * 0.4 - 0.2;
          if (scoring && kit && !chip.gateHit) kit.sfx("spit");
          chip.gateHit = true;
          if (scoring) toast("GATE SHUT — bounced aside", 640);
        }
      }

      if (chip.ignore <= 0 && world.pegData) {
        for (let i = 0; i < world.pegData.length; i += 1) {
          const peg = world.pegData[i];
          if (peg === chip.lastPeg) continue;
          const dx = chip.x - peg.userData.x;
          const dy = chip.y - peg.userData.y;
          const lim = CHIP_R + PEG_R;
          if (dx * dx + dy * dy >= lim * lim) continue;
          if (peg.userData.dead) {
            chip.absorbed = true;
            chip.lastPeg = peg;
            chip.absorbing = 0.36;
            const wp = peg.getWorldPosition(world.tmpV);
            spawnSparks(wp.x, wp.y, wp.z, 14, "#c41e3a");
            world.shake = 0.04;
            if (scoring && kit) kit.sfx("bury");
            if (scoring) {
              toast("SWALLOW — vacuum", 720);
              setText("plinkoStatus", "Swallow peg vacuumed the penny. That’s the house.");
              if (run) run.auraPose = "swallow";
            }
            return "live";
          }
          bounceOffPeg(chip, peg, spec, tilt);
          chip.lastPeg = peg;
          chip.ignore = 0.045;
          if (scoring && kit) kit.sfx("drop");
          break;
        }
      }
      if (chip.y <= BOARD_BOT + CHIP_R * 0.2) return "land";
    }
    return "live";
  }

  function syncChipMesh(mesh, chip, ghost) {
    if (!mesh) return;
    if (!chip) { mesh.visible = false; return; }
    mesh.visible = true;
    mesh.position.set(chip.x, chip.y, chip.z != null ? chip.z : 0.06);
    mesh.rotation.z = chip.spin || 0;
    mesh.rotation.x = (chip.vz || 0) * 0.4;
    const sc = (chip.scale || 1) * (ghost ? 0.92 : 1);
    mesh.scale.setScalar(CHIP_R * sc);
  }

  function toast(text, ms) {
    if (!run) return;
    run.toast = text;
    run.toastMs = ms;
  }

  function paintLean(tilt, spec) {
    const bob = el("plinkoLeanBob");
    if (bob) bob.style.transform = `rotate(${(-tilt * 220).toFixed(1)}deg)`;
    let breath = "LEAN THE CABINET";
    if (run && run.chip && run.cheatTell) breath = run.cheatTell;
    else if (run && run.chip) breath = tilt > 0.02 ? "KEEP LEANING → SOUVENIRS" : tilt < -0.02 ? "← LEANING AWAY FROM SOUVENIRS" : "KEEP LEANING";
    else if (spec && spec.mirror) breath = "MIRROR · PICK LEFT FALLS RIGHT";
    else if (spec && spec.slideGate) {
      const g = gateState(spec, run ? run.t : world.t * 1000);
      breath = g && g.telegraph ? "GATE CLOSING" : (g && g.open ? "GATE OPEN · LEAN THROUGH" : "GATE SHUT");
    } else if (isLive() && tilt > 0.02) breath = "LEANING → SOUVENIRS";
    else if (isLive() && tilt < -0.02) breath = "← LEANING AWAY";
    else if (!isLive()) breath = "HOUSE BREATH · YOU STEER THE FALL";
    setText("plinkoBreath", breath);
    if (world && world.pendulum) world.pendulum.rotation.z = -tilt * 2.6;
    if (world && world.crank) world.crank.rotation.z = world.t * 1.6;
    if (world && world.boardRoot) {
      const mul = spec && (spec.kind === "fever" || spec.coda) ? 1.45 : spec && spec.kind === "teach" ? 0.9 : 1.15;
      world.boardRoot.rotation.z = -tilt * mul;
      world.boardRoot.rotation.y = playerTilt * 0.22;
      world.boardRoot.rotation.x = isLive() ? -0.05 : 0;
    }
    const n = (spec && spec.dropLanes) || 5;
    const pick = isLive() ? clamp(run.lane, 0, n - 1) : hoverLane;
    if (world && world.cups) {
      world.cups.forEach((cup, i) => {
        const hot = i === pick && cup.visible;
        cup.material.emissiveIntensity = hot ? 0.7 + Math.sin(world.t * 8) * 0.2 : 0.05;
        cup.scale.setScalar(hot ? 1.18 : 1);
      });
    }
    if (world && world.pickGhost) {
      const fall = spec && spec.mirror ? n - 1 - pick : pick;
      if (isLive() && !run.chip && run.chipsLeft > 0) {
        world.pickGhost.visible = true;
        world.pickGhost.position.set(laneX(fall, n), DROP_Y + Math.sin(world.t * 4) * 0.03, 0.08);
      } else if (!isLive()) {
        world.pickGhost.visible = true;
        world.pickGhost.position.set(laneX(hoverLane, n), DROP_Y, 0.08);
      } else world.pickGhost.visible = false;
    }
    if (world && world.pegData) {
      const pulse = ((world.t * 4) | 0) % 2 === 0;
      world.pegData.forEach((peg) => {
        if ((peg.userData.lunge || 0) > 0.12) return;
        if (peg.userData.punch > 0) {
          peg.userData.punch *= 0.82;
          peg.scale.set(PEG_R * (1 + peg.userData.punch * 0.8), 0.16, PEG_R * (1 + peg.userData.punch * 0.8));
        } else peg.scale.set(PEG_R, 0.16, PEG_R);
        if (peg.userData.dead) peg.material.emissiveIntensity = pulse ? 0.7 : 0.3;
      });
    }
    if (world && world.gate && world.gate.visible) {
      const g = gateState(spec, run ? run.t : world.t * 1000);
      if (g) {
        const half = BOARD_W / 2;
        const gl = g.gapX - g.gapW / 2;
        const gr = g.gapX + g.gapW / 2;
        const leftW = Math.max(0.08, gl + half);
        const rightW = Math.max(0.08, half - gr);
        world.gate.userData.barL.scale.x = leftW;
        world.gate.userData.barL.position.x = -half + leftW / 2;
        world.gate.userData.barR.scale.x = rightW;
        world.gate.userData.barR.position.x = half - rightW / 2;
        const col = g.open ? 0x3a8a8a : 0x8a2030;
        world.gate.userData.barL.material.color.setHex(col);
        world.gate.userData.barR.material.color.setHex(col);
      }
    }
    if (world && world.slots) {
      world.slots.forEach((slot) => {
        if (slot.userData.pop > 0) {
          slot.userData.pop -= 0.04;
          slot.scale.setScalar(1 + slot.userData.pop * 0.18);
        } else slot.scale.setScalar(1);
      });
    }
  }

  function cameraFor(spec, tilt) {
    const aim = isLive() && run && !run.chip && !run.dying;
    const follow = isLive() && run && run.chip;
    const result = run && (run.done || run.dying);
    let tx = 2.45, ty = 2.12, tz = 5.7;
    let lx = 0, ly = 1.55, lz = 0.15;
    if (REDUCE) {
      tx = 0.15; ty = 2.35; tz = 5.4;
    } else if (result) {
      tx = 1.85; ty = 1.75; tz = 5.15;
      lx = -0.55; ly = 1.25; lz = 0.4;
    } else if (follow && world.chipMesh) {
      world.chipMesh.getWorldPosition(world.tmpV);
      tx = world.tmpV.x * 0.42 + 0.15;
      ty = world.tmpV.y + 0.58;
      tz = 3.55;
      lx = world.tmpV.x * 0.22;
      ly = world.tmpV.y;
      lz = world.tmpV.z;
    } else if (aim) {
      tx = 0.08 + tilt * 0.4;
      ty = 3.22;
      tz = 4.15;
      lx = 0;
      ly = 3.05;
      lz = 0.15;
    } else {
      const t = world.t * 0.18;
      tx = 1.9 + Math.sin(t) * 0.55;
      ty = 2.12 + Math.sin(t * 0.7) * 0.1;
      tz = 6.15 + Math.cos(t) * 0.32;
      lx = -0.35;
      ly = 1.55;
    }
    const k = follow ? 0.11 : 0.045;
    world.camPos.x = lerp(world.camPos.x, tx, k);
    world.camPos.y = lerp(world.camPos.y, ty, k);
    world.camPos.z = lerp(world.camPos.z, tz, k);
    world.lookAt.x = lerp(world.lookAt.x, lx, k);
    world.lookAt.y = lerp(world.lookAt.y, ly, k);
    world.lookAt.z = lerp(world.lookAt.z, lz, k);
    world.camera.position.copy(world.camPos);
    if (world.shake > 0.002) {
      world.camera.position.x += (Math.random() - 0.5) * world.shake;
      world.camera.position.y += (Math.random() - 0.5) * world.shake;
    }
    world.camera.lookAt(world.lookAt);
  }

  function showRoomCard(spec) {
    const node = el("plinkoRoomCard");
    if (!node || !spec) return;
    setText("plinkoRoomKicker", spec.coda ? "ENDLESS DROP" : "AUTHORED DROP");
    setText("plinkoRoomName", spec.name);
    setText("plinkoRoomTell", roomTell(spec));
    node.hidden = false;
    if (run) run.roomCardMs = spec.id === 1 ? 1280 : 1100;
  }

  function hideRoomCard() {
    const node = el("plinkoRoomCard");
    if (node) node.hidden = true;
  }

  function ensureHud() {
    const host = card();
    const hud = host && host.querySelector(".plinko-hud");
    if (!hud) return null;
    let line = hud.querySelector(`[data-runkit-hud="${GAME_ID}"]`);
    if (!line) {
      line = document.createElement("p");
      line.className = "depth-hud";
      line.dataset.runkitHud = GAME_ID;
      line.setAttribute("aria-live", "polite");
      hud.appendChild(line);
    }
    let span = hud.querySelector(`[data-runkit-strikes="${GAME_ID}"]`);
    if (!span) {
      span = document.createElement("span");
      span.className = "strike-pips";
      span.dataset.runkitStrikes = GAME_ID;
      span.setAttribute("aria-hidden", "true");
      span.innerHTML = "<i></i><i></i><i></i>";
      hud.appendChild(span);
    }
    if (isLive() || (run && run.dying)) {
      const spec = run.spec || plinkoStageParams(Math.max(1, (run.depth | 0) + 1));
      const playing = spec.id || Math.max(1, (run.depth | 0) + 1);
      line.textContent = spec.coda ? `ENDLESS · DROP ${playing} · ${spec.name}` : `DROP ${playing} · ${spec.name}`;
      line.hidden = false;
    } else {
      line.textContent = "DROP 0";
      line.hidden = true;
    }
    const spec = (run && run.spec) || plinkoStageParams(1);
    const max = spec.chips || 3;
    const used = isLive() || (run && run.dying) ? Math.max(0, max - (run.chipsLeft | 0)) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < used));
    return line;
  }

  function stampDepthCopy() {
    const host = card();
    if (!host) return;
    const num = host.querySelector(".machine-number");
    if (num) num.textContent = DEPTH_COPY.machine;
    host.querySelectorAll("[data-pf-depth-copy]").forEach((p) => { p.textContent = DEPTH_COPY.body; });
    ensureHud();
    if (!isLive() && el("plinkoStatus") && (!run || run.done)) {
      el("plinkoStatus").textContent = DEPTH_COPY.status;
    }
  }

  function punchStart() {
    stampDepthCopy();
    setText("plinkoStatus", DEPTH_COPY.punch);
    const btn = el("plinkoStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
    }
  }

  function challengeLine(n) {
    const kitRun = rk();
    if (kitRun && typeof kitRun.challengeText === "function") {
      try { return kitRun.challengeText("Plinko drop", n | 0, GAME_ID); } catch (_) { /* authored */ }
    }
    return `Beat my Plinko drop ${n | 0} on Penny Fever`;
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try { return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false }); } catch (_) { /* fall through */ }
    }
    kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "chips exhausted",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestPlinko = Math.max(state.bestPlinko || 0, payload.depth);
      state.bestPlinkoScore = Math.max(state.bestPlinkoScore || 0, payload.score);
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function tellDepth(n) {
    const depth = n | 0;
    if (run && run.kitRun) run.kitRun.depth = depth;
    const spec = (run && run.spec) || plinkoStageParams(Math.max(1, depth));
    if (run && run.kitRun && rk() && typeof rk().reportDepth === "function") {
      try { rk().reportDepth(run.kitRun, depth, { name: spec.name, coda: !!spec.coda }); } catch (_) { /* optional */ }
    }
    ensureHud();
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("plinko")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function landChip(slot, absorbed) {
    const value = absorbed ? 0 : slot;
    run.score += value * 10;
    run.slotSum += value;
    run.lastSlot = absorbed ? -1 : slot;
    const qualify = !absorbed && slot >= run.spec.targetSlotMin;
    run.lastOk = qualify;
    if (qualify) run.qualifyCount = (run.qualifyCount || 0) + 1;
    const need = (run.spec.twinNeed | 0) > 0 ? (run.spec.twinNeed | 0) : 1;
    if (run.qualifyCount >= need) run.stageHit = true;
    if (run.kitRun) run.kitRun.score = run.score;
    run.chip = null;
    run.pause = absorbed ? 0.82 : 0.64;
    if (world && world.slots[slot]) world.slots[slot].userData.pop = 1;
    if (absorbed) {
      if (kit) kit.sfx("pit");
      if (run.kitRun && rk() && typeof rk().reportStrike === "function") {
        try { rk().reportStrike(run.kitRun, "dead peg"); } catch (_) { /* pips */ }
      }
      run.auraPose = "swallow";
      setText("plinkoStatus", "Dead peg. Penny swallowed.");
    } else if (run.lastOk) {
      if (kit) kit.sfx("tray");
      PF.setAura("celebrate");
      run.auraPose = "cheer";
      spawnConfetti();
      if (need > 1 && !run.stageHit) {
        setText("plinkoStatus", `Souvenir ${run.qualifyCount}/${need} · ${PRIZES[slot]}. One ribbon isn’t a contract.`);
      } else {
        setText("plinkoStatus", `${PRIZES[slot]} pocket — souvenir landed. Leftovers stay in the house.`);
      }
    } else {
      if (kit) kit.sfx("miss");
      run.auraPose = "miss";
      if (run.kitRun && rk() && typeof rk().reportStrike === "function") {
        try { rk().reportStrike(run.kitRun, "low slot"); } catch (_) { /* pips */ }
      }
      setText("plinkoStatus", `${PRIZES[slot]} pocket · need ${prizeNeed(run.spec)}. Lean harder next fall.`);
    }
  }

  function flyHouseChips(leftover) {
    if (!world || leftover <= 0) return;
    const n = run.spec.dropLanes || 5;
    for (let i = 0; i < leftover; i += 1) {
      const mesh = makePenny();
      const lane = clamp((run.lane | 0) + i, 0, n - 1);
      world.boardRoot.localToWorld(world.tmpV.set(laneX(lane, n), DROP_Y, 0.08));
      mesh.position.copy(world.tmpV);
      world.scene.add(mesh);
      world.houseFly.push({ mesh, life: 1.1 });
    }
  }

  function resolveStageEnd() {
    if (run.stageHit) {
      const leftover = run.chipsLeft | 0;
      run.score += 300;
      run.depth += 1;
      if (run.kitRun) {
        run.kitRun.depth = run.depth;
        run.kitRun.score = run.score;
      }
      if (leftover > 0) {
        run.houseChips = (run.houseChips || 0) + leftover;
        flyHouseChips(leftover);
        run.chipsLeft = 0;
      }
      tellDepth(run.depth);
      PF.refreshDepth();
      if (kit) kit.sfx("rack");
      PF.setAura("point");
      run.auraPose = "cheer";
      setText("plinkoStatus", leftover > 0 ? `${AURA.clear} HOUSE keeps ${leftover}.` : AURA.clear);
      startStage(run.depth + 1);
      return;
    }
    run.deathNote = "chips exhausted";
    finish("chips exhausted");
  }

  function startStage(n) {
    const spec = plinkoStageParams(n);
    if (!spec) {
      finish("souvenir");
      return;
    }
    run.spec = spec;
    run.lane = clamp(run.lane, 0, (spec.dropLanes || 5) - 1);
    hoverLane = run.lane;
    run.chipsLeft = spec.chips;
    run.chip = null;
    run.stageHit = false;
    run.qualifyCount = 0;
    run.lastSlot = -1;
    run.lastOk = false;
    run.pause = 0;
    layoutBoard(spec);
    tellDepth(run.depth);
    ensureHud();
    showRoomCard(spec);
    if (spec.id > 1 && kit) kit.sfx("chapter");
    setText("plinkoStatus", `${spec.name} — ${spec.barker}`);
    run.auraPose = "watch";
  }

  function start() {
    if (isLive()) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("plinkoStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      stampDepthCopy();
      return;
    }
    run = {
      done: false,
      dying: false,
      kitRun,
      t: 0,
      depth: 0,
      score: 0,
      lane: hoverLane,
      spec: plinkoStageParams(1),
      chipsLeft: 3,
      chip: null,
      stageHit: false,
      qualifyCount: 0,
      lastSlot: -1,
      lastOk: false,
      pause: 0,
      closedStamp: false,
      deathHold: 0,
      deathReason: "",
      deathNote: "",
      slotSum: 0,
      houseChips: 0,
      roomCardMs: 1280,
      toast: "",
      toastMs: 0,
      auraPose: "watch",
      cheatHits: 0,
      cheatTell: "",
    };
    playerTilt = 0;
    tiltHeld = 0;
    tellDepth(0);
    const startBtn = el("plinkoStart");
    if (startBtn) startBtn.disabled = true;
    const dropBtn = el("plinkoDrop");
    if (dropBtn) dropBtn.hidden = false;
    const verdict = el("plinkoVerdict");
    if (verdict) verdict.hidden = true;
    const stamp = el("plinkoHouseStamp");
    if (stamp) stamp.hidden = true;
    kit.hideResult("plinkoResult");
    PF.setTier("plinkoTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    startStage(1);
    PF.focusCard("plinkoCard", true);
    PF.setAura("think");
    if (world) world.ghost = null;
    playerTilt = 0;
  }

  function drop() {
    if (!isLive() || run.chip || run.pause > 0) return;
    if (run.chipsLeft <= 0) return;
    const spec = run.spec;
    const tilt = liveTilt(spec, run.t);
    const n = spec.dropLanes || 5;
    const pick = clamp(run.lane, 0, n - 1);
    const lane = spec.mirror ? (n - 1 - pick) : pick;
    const x = laneX(lane, n);
    const entry = (lane / Math.max(1, n - 1) - 0.5) * 0.28;
    run.chipsLeft -= 1;
    run.chip = {
      x, y: DROP_Y, z: 0.08, vx: tilt * 1.4 + entry * 0.9, vy: -0.15, vz: 0.2,
      absorbed: false, age: 0, spin: 0, laneBias: spec.biasFromEntry ? entry : 0,
      lastPeg: null, ignore: 0, scale: 1,
    };
    if (kit) kit.sfx("shove");
    ensureHud();
    PF.refreshDepth();
    run.auraPose = "watch";
    hideRoomCard();
    let lean;
    if (spec.mirror) lean = `MIRROR — picked ${pick + 1}, fell ${lane + 1}`;
    else if (spec.slideGate) {
      const g = gateState(spec, run.t);
      lean = g && g.open ? "through an OPEN gate" : "at a SHUT gate";
    } else if (spec.funnelLie) lean = "into the highway lie";
    else lean = tilt > 0.02 ? "with the pay lean" : tilt < -0.02 ? "against the pay lean" : "flat breath";
    setText("plinkoStatus", `Dropped cup ${pick + 1} ${lean} · ${run.chipsLeft} penn${run.chipsLeft === 1 ? "y" : "ies"} left`);
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.deathReason = reason === "souvenir" ? "souvenir" : (run.deathNote || reason);
    run.closedStamp = reason !== "souvenir";
    run.deathHold = DEATH_HOLD_MS / 1000;
    if (run.closedStamp && kit) kit.sfx("stamp");
    const stamp = el("plinkoHouseStamp");
    if (stamp) stamp.hidden = !run.closedStamp;
    run.auraPose = reason === "souvenir" ? "cheer" : "miss";
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "dead peg") return AURA.deadpeg;
    if (run && (run.cheatHits | 0) >= 2) return AURA.cheat;
    if (run && run.spec && run.spec.kind === "twin") return AURA.twin;
    if (run && run.spec && run.spec.kind === "mirror") return AURA.mirror;
    if (run && run.spec && run.spec.slideGate) return AURA.gate;
    if (run && run.spec && run.spec.funnelLie) return AURA.funnel;
    if (depth <= 0) return AURA.shallow;
    if (run && run.spec && run.spec.coda) return AURA.coda(depth);
    if (depth >= 8) return AURA.coda(depth);
    if (depth >= 5) return AURA.deep(depth);
    if (depth >= 2) return AURA.mid;
    return AURA.exhaust;
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    run.closedStamp = reason !== "leave" && reason !== "souvenir";
    const depth = run.depth;
    const score = run.score;
    persistDepth({
      depth,
      score,
      deathReason: reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : (run.deathNote || reason)),
      cashedOut: reason === "souvenir",
      meta: {
        stage: run.spec && run.spec.id,
        room: run.spec && run.spec.name,
        slotSum: run.slotSum,
        houseChips: run.houseChips || 0,
        coda: !!(run.spec && run.spec.coda),
      },
    });
    stampDepthCopy();
    const startBtn = el("plinkoStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "DROP AGAIN · 1 demo coin";
    }
    const dropBtn = el("plinkoDrop");
    if (dropBtn) dropBtn.hidden = true;
    PF.focusCard("plinkoCard", false);
    kit.setMode(card(), "result");
    hideRoomCard();
    const death = reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : (run.deathNote || reason || "chips exhausted"));
    const line = `DROP ${depth} · SCORE ${score}`;
    const aura = auraLine(reason, depth);
    const challenge = challengeLine(depth);
    const verdict = el("plinkoVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = reason === "leave"
        ? `Left the pegboard · ${line}`
        : reason === "souvenir"
          ? `Souvenir. ${line}.`
          : `Pennies exhausted. ${line} · ${death}.`;
    }
    kit.fillResult({
      root: "plinkoResult",
      depth: "plinkoResultDepth",
      score: "plinkoResultScore",
      aura: "plinkoResultAura",
      copied: "plinkoCopied",
    }, {
      depthLine: `DROP ${depth}${run.spec && run.spec.name ? " · " + run.spec.name : ""}`,
      scoreLine: `SCORE ${score} · pockets ${run.slotSum | 0} · ${death}`,
      auraLine: aura,
    });
    const reasonNode = el("plinkoResultReason");
    if (reasonNode) reasonNode.textContent = String(death).replace(/_/g, " ").toUpperCase();
    setText("plinkoChallengeText", challenge);
    PF.setTier("plinkoTier", depth > 0 ? `DROP ${depth}` : "HOUSE", depth > 0 ? "perfect" : "miss");
    setText("plinkoStatus", reason === "leave" ? "Left the pegboard." : reason === "souvenir" ? "Souvenir — authored drops cleared." : "House stamped the board.");
    const ok = depth > 0;
    if (ok) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Plinko");
      PF.setAura(depth >= 4 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `DROP ${depth}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Plinko miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "HOUSE", aura);
    }
    PF.refreshNightBoard();
  }

  function pointerLane(ev) {
    if (!world) return hoverLane;
    const canvas = el("plinkoCanvas");
    if (!canvas) return hoverLane;
    const r = canvas.getBoundingClientRect();
    const t = (ev.touches && ev.touches[0]) || ev;
    world.ndc.set(((t.clientX - r.left) / Math.max(1, r.width)) * 2 - 1, -((t.clientY - r.top) / Math.max(1, r.height)) * 2 + 1);
    world.raycaster.setFromCamera(world.ndc, world.camera);
    const hits = world.raycaster.intersectObjects(world.cups.filter((c) => c.visible), false);
    if (hits.length) return hits[0].object.userData.lane | 0;
    const spec = run && run.spec ? run.spec : plinkoStageParams(1);
    const n = spec.dropLanes || 5;
    return clamp(Math.round((world.ndc.x * 0.5 + 0.5) * (n - 1)), 0, n - 1);
  }

  function idleGhost(dt, spec, tilt) {
    if (!world) return;
    if (isLive()) {
      world.ghost = null;
      world.ghostMesh.visible = false;
      return;
    }
    world.ghostPause = Math.max(0, (world.ghostPause || 0) - dt);
    if (!world.ghost && world.ghostPause <= 0) {
      const n = spec.dropLanes || 5;
      const lane = (Math.random() * n) | 0;
      world.ghost = {
        x: laneX(lane, n), y: DROP_Y, vx: tilt * 1.1, vy: -0.12,
        absorbed: false, age: 0, spin: 0, laneBias: 0, lastPeg: null, ignore: 0, scale: 1,
        ghost: true,
      };
      updateCheatPegs(world.ghost, spec, 0.016);
    }
    if (world.ghost) {
      const res = stepChip(world.ghost, spec, tilt, dt, false);
      if (res !== "live") {
        world.ghost = null;
        world.ghostPause = 1.6;
      }
    }
    syncChipMesh(world.ghostMesh, world.ghost, true);
  }

  function tick(now) {
    if (!world) return;
    if (!cabinetOn()) {
      world.raf = 0;
      return;
    }
    if (!world.last) world.last = now;
    const dtMs = Math.min(32, now - world.last);
    world.last = now;
    const dt = dtMs / 1000;
    world.t += dt;
    resize();
    stepPlayerTilt(dt);
    const spec = run && !run.done ? run.spec : plinkoStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
    const tMs = run && !run.done ? run.t : world.t * 1000;
    const tilt = liveTilt(spec, tMs);

    if (!isLive()) {
      idleClock += dtMs;
      if (idleClock > 3800) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        layoutBoard(plinkoStageParams(idleRoom));
      }
    }

    if (run && !run.done) {
      run.t += dtMs;
      run.toastMs = Math.max(0, (run.toastMs || 0) - dtMs);
      run.roomCardMs = Math.max(0, (run.roomCardMs || 0) - dtMs);
      if (run.roomCardMs <= 0) hideRoomCard();
      if (run.dying) {
        run.deathHold -= dt;
        if (run.deathHold <= 0) sealResult(run.deathReason);
      } else if (run.pause > 0) {
        run.pause -= dt;
        if (run.pause <= 0 && !run.chip) {
          if (run.stageHit || run.chipsLeft <= 0) resolveStageEnd();
        }
      } else if (run.chip) {
        updateCheatPegs(run.chip, spec, dt);
        const res = stepChip(run.chip, spec, tilt, dt, true);
        if (res === "absorb") landChip(0, true);
        else if (res === "land") landChip(slotFromX(run.chip.x), false);
      } else {
        updateCheatPegs(null, spec, dt);
      }
      PF.refreshDepth();
    }

    syncChipMesh(world.chipMesh, run && run.chip, false);
    idleGhost(dt, spec, tilt);
    paintLean(tilt, spec);
    poseAura(dt);
    stepFx(dt);
    cameraFor(spec, tilt);
    world.renderer.render(world.scene, world.camera);
    world.raf = requestAnimationFrame(tick);
  }

  function ensureLoop() {
    if (!world) buildWorld();
    if (!world) return;
    resize();
    if (world.raf) return;
    world.last = 0;
    world.raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (world && world.raf) cancelAnimationFrame(world.raf);
    if (world) world.raf = 0;
  }

  PF.registerVendor({
    id: "plinko",
    playKey: "plinko",
    chalk: "Lean while it falls. Pegs cheat mid-drop.",
    defaults: { bestPlinko: 0, bestPlinkoScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopLoop();
    },
    onShow() {
      stampDepthCopy();
      ensureLoop();
      requestAnimationFrame(() => { resize(); });
    },
    onReset() {
      run = null;
      const verdict = el("plinkoVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("plinkoResult");
      const stamp = el("plinkoHouseStamp");
      if (stamp) stamp.hidden = true;
      hideRoomCard();
      const startBtn = el("plinkoStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "PLAY NOW · 1 demo coin";
      }
      const dropBtn = el("plinkoDrop");
      if (dropBtn) dropBtn.hidden = true;
      kit.setMode(card(), "vestibule");
      stampDepthCopy();
      if (world) layoutBoard(plinkoStageParams(1));
      ensureLoop();
    },
    refreshDepth(state) {
      setText("depthPlinkoNow", isLive() || (run && run.dying) ? String(run.depth) : "0");
      const bestN = Math.max(state.bestPlinko || 0, (state.bestDepth && state.bestDepth.plinko) || 0);
      setText("depthPlinkoBest", bestN ? String(bestN) : "—");
      setText("depthPlinkoScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("depthPlinkoBestScore", state.bestPlinkoScore ? String(state.bestPlinkoScore) : "—");
      const doorBest = el("plinkoDoorBest");
      if (doorBest) doorBest.textContent = bestN ? `Best drop ${bestN}` : "Drops —";
    },
    bind() {
      declareP0();
      buildWorld();
      const startBtn = el("plinkoStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const dropBtn = el("plinkoDrop");
      if (dropBtn) {
        dropBtn.addEventListener("click", (ev) => {
          ev.preventDefault();
          if (!isLive()) {
            if (!run || run.done) punchStart();
            return;
          }
          drop();
        });
      }
      const canvas = el("plinkoCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            if (!run || run.done) punchStart();
            return;
          }
          dragState = { on: true, x: ev.clientX, dragging: false };
          try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
        });
        canvas.addEventListener("pointermove", (ev) => {
          pointer.inside = true;
          hoverLane = pointerLane(ev);
          if (isLive() && !run.chip && !dragState.dragging) run.lane = hoverLane;
          if (isLive() && dragState.on) {
            const dx = ev.clientX - dragState.x;
            if (Math.abs(dx) > 8) dragState.dragging = true;
            if (dragState.dragging) {
              playerTilt = clamp(playerTilt + dx * 0.0024, -0.4, 0.4);
              dragState.x = ev.clientX;
            }
          }
        });
        canvas.addEventListener("pointerup", (ev) => {
          if (!isLive()) { dragState.on = false; return; }
          if (!dragState.dragging) {
            run.lane = pointerLane(ev);
            hoverLane = run.lane;
            drop();
          }
          dragState = { on: false, x: 0, dragging: false };
        });
        canvas.addEventListener("pointerleave", () => { pointer.inside = false; });
      }
      function holdTilt(dir, on) {
        if (on) tiltHeld = dir;
        else if (tiltHeld === dir) tiltHeld = 0;
      }
      const tiltL = el("plinkoTiltL");
      const tiltR = el("plinkoTiltR");
      if (tiltL) {
        tiltL.addEventListener("pointerdown", (ev) => { ev.preventDefault(); holdTilt(-1, true); });
        tiltL.addEventListener("pointerup", () => holdTilt(-1, false));
        tiltL.addEventListener("pointerleave", () => holdTilt(-1, false));
      }
      if (tiltR) {
        tiltR.addEventListener("pointerdown", (ev) => { ev.preventDefault(); holdTilt(1, true); });
        tiltR.addEventListener("pointerup", () => holdTilt(1, false));
        tiltR.addEventListener("pointerleave", () => holdTilt(1, false));
      }
      window.addEventListener("keydown", (ev) => {
        if (!cabinetOn()) return;
        if (!isLive()) return;
        const n = (run.spec && run.spec.dropLanes) || 5;
        if (ev.code === "KeyA") { ev.preventDefault(); tiltHeld = -1; }
        if (ev.code === "KeyD") { ev.preventDefault(); tiltHeld = 1; }
        if (ev.code === "ArrowLeft") {
          ev.preventDefault();
          run.lane = clamp(run.lane - 1, 0, n - 1);
          hoverLane = run.lane;
        }
        if (ev.code === "ArrowRight") {
          ev.preventDefault();
          run.lane = clamp(run.lane + 1, 0, n - 1);
          hoverLane = run.lane;
        }
        if (ev.code === "Space" || ev.key === " " || ev.code === "Enter") {
          ev.preventDefault();
          drop();
        }
        const digit = ev.key >= "1" && ev.key <= "5" ? (ev.key | 0) - 1 : -1;
        if (digit >= 0) {
          ev.preventDefault();
          run.lane = clamp(digit, 0, n - 1);
          hoverLane = run.lane;
          drop();
        }
      });
      window.addEventListener("keyup", (ev) => {
        if (ev.code === "KeyA" && tiltHeld === -1) tiltHeld = 0;
        if (ev.code === "KeyD" && tiltHeld === 1) tiltHeld = 0;
      });
      const copyBtn = el("plinkoChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const last = PF.getState().lastRun;
          const n = (last && (last.game === GAME_ID || last.gameId === GAME_ID))
            ? last.depth
            : (PF.getState().bestPlinko || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("plinkoCopied");
            if (copied) {
              copied.hidden = false;
              copied.textContent = "Copied — send it";
            }
            setText("plinkoStatus", "Copied — send it");
          }, () => setText("plinkoStatus", text));
        });
      }
      stampDepthCopy();
      if (cabinetOn()) ensureLoop();
    },
  });
})();
