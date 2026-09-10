/* Bent Ring Pegs — Crooked Hook Garden. Desktop Grok owns this file.
 * PF only. Never booth/port 6000. Never Imagine.
 * Full 3D tent: sidestep the rail, spin the ring to match bent hooks,
 * drag-throw while pegs lean AFTER release. Ghosts show the cheat.
 * Engine: SlingAim (declared) · depthUnit: Board · gameId: bentring
 * 8 authored + ENDLESS coda. One coin = one run. Family-safe. No casino.
 * Aura lock: pigtails, yellow crown+heart, green pinafore, black shoes. */
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

  const GAME_ID = "bentring";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const DEATH_HOLD_MS = 760;
  const LEAN_LERP_MS = 180;
  const SNAP_LERP_MS = 70;
  const GRAVITY = 9.2;
  const PEG_H = 0.58;
  const PEG_R = 0.032;
  const RING_R = 0.128;
  const RING_TUBE = 0.02;
  const RAIL_MIN = -1.62;
  const RAIL_MAX = 1.62;
  const TEE_Y = 1.18;
  const TEE_Z = 3.22;
  const BOARD_POS = new THREE.Vector3(0, 0.92, -1.72);
  const TAU = Math.PI * 2;
  const STEP_SPEED = 2.85;
  const SPIN_SPEED = 2.4;

  const AURA = {
    miss: "Aura: Out of rings. The pegs leaned. You saw it.",
    shallow: "Aura: Not a single board. They duck on purpose.",
    mid: "Aura: Cute sticks. They still lean mid-flight.",
    deep: "Aura: You threw where they’ll be. Dangerous.",
    decoy: "Aura: That peg was a decoy. It never holds.",
    hook: "Aura: Straight pegs spit. Hooks are the only necks.",
    spin: "Aura: Tilt was wrong. Spin the ring to the hook.",
    snap: "Aura: Late snap. You committed before the shudder finished.",
    coda: "Aura: Authored boards done. ENDLESS lean. Aim the cheat.",
    leave: "Aura: Left rings on the dirt.",
    near: "Aura: Near miss. The neck spat you. That’s the tent.",
    spit: "Aura: SPIT. Close isn’t stuck. The neck bounced you.",
    late: "Aura: Back row ducked late. Dual clocks, one throw.",
    souvenir: "Aura: Eight boards locked. Souvenir — the pegs salute.",
  };

  const AUTHORED = [
    {
      id: 1, name: "Soft Hook Lane", kind: "tri", pegs: 3, need: 2, leanDeg: 8, delayMs: 300,
      rings: 4, tiltTol: 1.15, ringScale: 1,
      barker: "Three pegs. Flat rings. Mild lean after you throw. Need two. Red ghosts = the duck.",
    },
    {
      id: 2, name: "Cross Crook", kind: "crosslean", pegs: 3, need: 3, leanDeg: 14, delayMs: 260,
      rings: 5, tiltTol: 0.58, ringScale: 0.98,
      barker: "Three hooks, three tilts. SPIN to match the color on the neck. Need all three.",
    },
    {
      id: 3, name: "Late Snap Grove", kind: "latesnap", pegs: 4, need: 3, leanDeg: 18, delayMs: 520,
      rings: 5, tiltTol: 0.62, ringScale: 0.96, snap: true,
      barker: "Long shudder, then they SNAP. Need three of four. Commit to the ghost, not the now.",
    },
    {
      id: 4, name: "Decoy Willow", kind: "decoy", pegs: 5, need: 3, leanDeg: 16, delayMs: 240,
      rings: 5, tiltTol: 0.55, ringScale: 0.95, decoyIndex: 2,
      barker: "Four reals plus a red DECOY that never holds. Need three reals. Step off the fake.",
    },
    {
      id: 5, name: "Spin Peg Circus", kind: "spin", pegs: 4, need: 3, leanDeg: 14, delayMs: 240,
      rings: 5, tiltTol: 0.5, ringScale: 0.94, spin: true,
      barker: "The plate turns. Lean still fires mid-flight. Throw the moving ghosts. Need three.",
    },
    {
      id: 6, name: "Hook Only Lane", kind: "hook", pegs: 5, need: 3, leanDeg: 12, delayMs: 230,
      rings: 5, tiltTol: 0.48, ringScale: 0.93,
      hookMask: [true, false, true, false, true],
      barker: "Only HOOK necks hold. Straight pegs SPIT. Spin to the hook. Need three.",
    },
    {
      id: 7, name: "Twin Delay Forest", kind: "twindelay", pegs: 5, need: 4, leanDeg: 16, delayMs: 160,
      rings: 6, tiltTol: 0.46, ringScale: 0.92,
      twinDelay: true, frontDelayMs: 80, backDelayMs: 380,
      barker: "Two rows. Front leans early, back leans late. Dual clocks, one throw. Need four.",
    },
    {
      id: 8, name: "Warp Hook Finale", kind: "warp", pegs: 5, need: 4, leanDeg: 18, delayMs: 400,
      rings: 6, tiltTol: 0.42, ringScale: 0.9,
      spin: true, snap: true, decoyIndex: 4, hookMask: [true, false, true, false, false],
      twinDelay: true, frontDelayMs: 60, backDelayMs: 360,
      barker: "Two hooks, two straight, one decoy. Micro-spin, late snap, cross leans. Need four.",
    },
  ];

  const P0_MOUNT = {
    engine: "SlingAim",
    displayName: "Bent Ring Pegs",
    depthUnit: "Board",
    sheet: "GOBLIN_AUTHORED_LEVELS_B03.md",
    batchSheet: "GOBLIN_BATCH03_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored BOARDS then ENDLESS · they lean mid-flight",
    body: "One coin. Eight authored boards, then ENDLESS. Step the rail. Spin the ring to match a bent hook. Drag to throw. After release they lean — red ghosts tell. Stick enough before rings run out. Leftover rings stay in the house.",
    status: "Depth run · PLAY NOW · 1 demo coin · 8 authored BOARDS then ENDLESS",
    machine: "Crooked hook garden · 1 demo coin · authored BOARDS",
    punch: "Depth run — play now. No one-tap prize.",
  };

  let run = null;
  let shown = false;
  let raf = 0;
  let THREE_OK = true;
  let renderer = null;
  let scene = null;
  let camera = null;
  let clock = null;
  let world = null;
  let canvas = null;
  let resizeObs = null;
  let actx = null;
  let keys = { left: false, right: false, spinL: false, spinR: false, throw: false };
  const _v = new THREE.Vector3();
  const _v2 = new THREE.Vector3();
  const _v3 = new THREE.Vector3();

  function rk() { return PF.runKit || null; }
  function el(id) { return $(id); }
  function setText(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }
  function card() { return el("bentRingCard"); }
  function clamp(n, a, b) { return kit && kit.clamp ? kit.clamp(n, a, b) : Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function bentringCoda(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const t = stage - AUTHORED_COUNT;
    return {
      id: stage, name: `Mean Lean ${stage}`, title: `Mean Lean ${stage}`, kind: "coda",
      pegs: 5, need: 4, leanDeg: Math.min(35, 20 + 2 * t), delayMs: 200,
      rings: 5, tiltTol: Math.max(0.28, 0.44 - t * 0.02), ringScale: 0.88,
      spin: t % 2 === 0, snap: t % 3 === 0, hookMask: [true, true, false, true, true], coda: true,
      barker: "ENDLESS — five pegs, meaner lean, tighter tilt. Ghosts still tell. Need four.",
    };
  }

  function bentringStageParams(n) {
    const stage = Math.max(1, n | 0);
    let spec;
    if (stage <= AUTHORED_COUNT) spec = Object.assign({}, AUTHORED[stage - 1]);
    else if (!CODA_ENABLED) return null;
    else spec = bentringCoda(stage);
    spec.title = spec.name;
    spec.ringsPerStage = spec.rings || Math.max(3, spec.need + 1);
    spec.tiltTol = spec.tiltTol == null ? 0.7 : spec.tiltTol;
    return spec;
  }

  function roomTell(spec) {
    if (!spec) return "GHOSTS = WHERE THEY DUCK";
    if (spec.kind === "tri") return "FLAT RINGS · MILD LEAN · NEED TWO";
    if (spec.kind === "crosslean") return "SPIN TO MATCH · THREE HOOKS";
    if (spec.kind === "latesnap") return "LONG SHUDDER THEN SNAP";
    if (spec.kind === "decoy") return "DECOY NEVER HOLDS · NEED THREE REALS";
    if (spec.kind === "spin") return "PLATE SPINS · THROW THE MOVING GHOSTS";
    if (spec.kind === "hook") return "HOOKS HOLD · STRAIGHT PEGS SPIT";
    if (spec.kind === "twindelay") return "FRONT EARLY · BACK LATE";
    if (spec.kind === "warp") return "HOOKS + DECOY + SPIN + LATE SNAP";
    if (spec.coda) return "ENDLESS · MEAN LEAN · TIGHTER TILT";
    return "GHOSTS = WHERE THEY DUCK";
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: bentringStageParams,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      codaParams: bentringCoda,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function sfx(name) {
    if (kit && kit.sfx) kit.sfx(name);
  }

  function beep(f0, f1, dur, type, vol) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    if (!actx) actx = new Ctor();
    if (actx.state === "suspended") actx.resume().catch(() => {});
    const o = actx.createOscillator();
    const g = actx.createGain();
    const t = actx.currentTime;
    o.type = type || "sine";
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    g.gain.setValueAtTime(vol || 0.04, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function mat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.62, metalness: 0.08,
    }, extra || {}));
  }

  function canvasTex(draw, w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }

  function makeGeos() {
    return {
      box: new THREE.BoxGeometry(1, 1, 1),
      sphere: new THREE.SphereGeometry(1, 16, 12),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
      cone: new THREE.ConeGeometry(1, 1, 8),
      plane: new THREE.PlaneGeometry(1, 1),
      torus: new THREE.TorusGeometry(1, 0.18, 8, 20),
      ring: new THREE.TorusGeometry(RING_R, RING_TUBE, 10, 28),
      peg: new THREE.CylinderGeometry(PEG_R * 0.85, PEG_R, PEG_H, 12),
      hook: new THREE.TorusGeometry(0.058, 0.015, 8, 16, Math.PI * 1.2),
      disk: new THREE.CylinderGeometry(1, 1, 0.06, 28),
      spark: new THREE.SphereGeometry(1, 6, 6),
    };
  }

  function addMesh(parent, geo, material, x, y, z, sx, sy, sz) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x || 0, y || 0, z || 0);
    if (sx != null) m.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
    m.castShadow = false;
    m.receiveShadow = false;
    parent.add(m);
    return m;
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = mat(0xe8b89a, { roughness: 0.55 });
    const hair = mat(0x3a2218, { roughness: 0.7 });
    const gold = mat(0xf2c75c, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.5 });
    const heart = mat(0xc41e3a, { emissive: 0xc41e3a, emissiveIntensity: 0.55, roughness: 0.4 });
    const dress = mat(0x2f6a3a, { roughness: 0.55, emissive: 0x0a2010, emissiveIntensity: 0.18 });
    const blouse = mat(0xf3e6d0, { roughness: 0.6 });
    const shoes = mat(0x111111, { roughness: 0.22, metalness: 0.45 });
    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    addMesh(hip, world.geo.cyl, blouse, 0, 0.28, 0, 0.13, 0.28, 0.13);
    addMesh(hip, world.geo.cyl, dress, 0, 0.06, 0, 0.24, 0.34, 0.24);
    const heartM = addMesh(hip, world.geo.box, heart, 0, 0.22, 0.15, 0.09, 0.09, 0.04);
    heartM.rotation.z = Math.PI / 4;
    const head = new THREE.Group();
    head.position.y = 0.64;
    hip.add(head);
    addMesh(head, world.geo.sphere, skin, 0, 0.02, 0, 0.2);
    addMesh(head, world.geo.sphere, hair, 0, 0.08, -0.02, 0.21);
    [-1, 1].forEach((s) => {
      addMesh(head, world.geo.sphere, hair, s * 0.18, -0.02, 0.04, 0.1);
      addMesh(head, world.geo.sphere, heart, s * 0.18, 0.07, 0.06, 0.042);
      addMesh(head, world.geo.sphere, mat(0xf7f2ea), s * 0.065, 0.03, 0.175, 0.038, 0.05, 0.018);
      addMesh(head, world.geo.sphere, mat(0x2a1810), s * 0.065, 0.03, 0.19, 0.022);
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.007, 6, 10, Math.PI), mat(0xc45a6a));
    smile.position.set(0, -0.04, 0.18);
    smile.rotation.x = 2.6;
    head.add(smile);
    const crown = new THREE.Group();
    crown.position.y = 0.22;
    head.add(crown);
    const band = new THREE.Mesh(world.geo.torus, gold);
    band.scale.set(0.12, 0.12, 0.12);
    band.rotation.x = Math.PI / 2;
    crown.add(band);
    [-0.08, 0, 0.08].forEach((x, i) => {
      const h = i === 1 ? 0.13 : 0.085;
      addMesh(crown, world.geo.cone, gold, x, h * 0.45, 0, 0.032, h, 0.032);
    });
    const gem = addMesh(crown, world.geo.box, heart, 0, 0.02, 0.1, 0.05, 0.05, 0.022);
    gem.rotation.z = Math.PI / 4;
    addMesh(head, world.geo.box, hair, 0, 0.14, 0.14, 0.26, 0.06, 0.08);
    function limb(side, arm) {
      const p = new THREE.Group();
      p.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0, 0);
      hip.add(p);
      const len = arm ? 0.28 : 0.34;
      addMesh(p, world.geo.cyl, arm ? skin : dress, 0, -len / 2, 0, arm ? 0.035 : 0.042, len, arm ? 0.035 : 0.042);
      if (arm) addMesh(p, world.geo.sphere, skin, 0, -len, 0, 0.04);
      else addMesh(p, world.geo.box, shoes, 0, -len - 0.02, 0.03, 0.08, 0.05, 0.12);
      return p;
    }
    g.userData = { hip, head, armL: limb(-1, true), armR: limb(1, true), t: Math.random() * 8, kind: "aura" };
    g.scale.setScalar(1.08);
    return g;
  }

  function makeBarker() {
    const g = new THREE.Group();
    const skin = mat(0xe0b090);
    const cloth = mat(0x7b2743);
    const cream = mat(0xf3e6d0);
    const dark = mat(0x1a1010);
    const hip = new THREE.Group();
    hip.position.y = 0.44;
    g.add(hip);
    addMesh(hip, world.geo.cyl, cream, 0, 0.3, 0, 0.14, 0.3, 0.14);
    addMesh(hip, world.geo.cyl, cloth, 0, 0.05, 0, 0.2, 0.36, 0.2);
    const head = new THREE.Group();
    head.position.y = 0.62;
    hip.add(head);
    addMesh(head, world.geo.sphere, skin, 0, 0.02, 0, 0.17);
    addMesh(head, world.geo.cyl, dark, 0, 0.2, 0, 0.12, 0.08, 0.16);
    addMesh(head, world.geo.cyl, dark, 0, 0.16, 0, 0.2, 0.03, 0.2);
    g.userData = { hip, head, t: 2 };
    return g;
  }

  function makeTent() {
    const root = new THREE.Group();
    const wood = canvasTex((ctx, w, h) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < w; i += 14) {
        ctx.fillStyle = i % 28 === 0 ? "#4a2e1c" : "#2a1810";
        ctx.fillRect(i, 0, 3, h);
      }
      ctx.fillStyle = "rgba(212,164,90,0.08)";
      for (let y = 0; y < h; y += 22) ctx.fillRect(0, y, w, 1);
    }, 256, 256);
    wood.repeat.set(4, 4);
    const stripe = canvasTex((ctx, w, h) => {
      for (let i = 0; i < w; i += 28) {
        ctx.fillStyle = (i / 28) % 2 === 0 ? "#8a2545" : "#f3e6d0";
        ctx.fillRect(i, 0, 28, h);
      }
    }, 280, 64);
    stripe.repeat.set(6, 2);
    const sawdust = canvasTex((ctx, w, h) => {
      ctx.fillStyle = "#4a3218";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 420; i += 1) {
        ctx.fillStyle = i % 3 === 0 ? "#6a4a22" : "#3a2410";
        ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 1);
      }
    }, 256, 256);
    sawdust.repeat.set(8, 10);

    const woodM = mat(0x6a4a28, { map: wood, roughness: 0.82 });
    const canvasM = new THREE.MeshStandardMaterial({
      map: stripe, roughness: 0.9, metalness: 0.02, side: THREE.DoubleSide,
    });
    const floorM = mat(0x5a3a18, { map: sawdust, roughness: 0.95 });

    const floor = addMesh(root, world.geo.box, floorM, 0, -0.04, 0.6, 9.6, 0.08, 14.2);
    floor.receiveShadow = true;
    addMesh(root, world.geo.box, canvasM, -4.25, 1.95, 0.4, 0.08, 4.0, 13.0);
    addMesh(root, world.geo.box, canvasM, 4.25, 1.95, 0.4, 0.08, 4.0, 13.0);
    addMesh(root, world.geo.box, canvasM, 0, 1.95, -5.6, 8.6, 4.0, 0.08);
    const roofL = addMesh(root, world.geo.box, canvasM, -2.1, 4.28, 0.2, 4.5, 0.08, 13.2);
    roofL.rotation.z = 0.42;
    const roofR = addMesh(root, world.geo.box, canvasM, 2.1, 4.28, 0.2, 4.5, 0.08, 13.2);
    roofR.rotation.z = -0.42;
    [-3.7, 3.7].forEach((x) => {
      [-4.8, 5.6].forEach((z) => addMesh(root, world.geo.cyl, woodM, x, 2.05, z, 0.09, 4.2, 0.09));
    });

    const rail = addMesh(root, world.geo.box, woodM, 0, 0.92, 3.58, 3.7, 0.14, 0.46);
    addMesh(root, world.geo.box, woodM, 0, 0.52, 3.62, 3.5, 0.72, 0.32);
    addMesh(root, world.geo.box, mat(0xd4a45a, { metalness: 0.45, roughness: 0.35 }), 0, 1.0, 3.4, 3.4, 0.025, 0.1);
    world.railPads = [];
    for (let i = 0; i < 5; i += 1) {
      const x = lerp(-1.45, 1.45, i / 4);
      const pad = addMesh(root, world.geo.box, mat(0x3a2418, { emissive: 0xd4a45a, emissiveIntensity: 0.08 }), x, 1.02, 3.42, 0.42, 0.04, 0.22);
      world.railPads.push(pad);
    }

    const crate = addMesh(root, world.geo.box, woodM, -2.55, 0.28, 2.45, 0.72, 0.55, 0.55);
    world.houseBasket = crate;
    world.houseStack = [];
    for (let i = 0; i < 6; i += 1) {
      const r = new THREE.Mesh(world.geo.ring, world.mats.ringIdle);
      r.position.set(-2.55 + (i % 2) * 0.08, 0.58 + i * 0.045, 2.45);
      r.rotation.x = Math.PI / 2;
      r.rotation.z = i * 0.4;
      r.scale.setScalar(0.7);
      root.add(r);
      world.houseStack.push(r);
    }

    addMesh(root, world.geo.box, woodM, 3.45, 1.15, -0.35, 0.22, 1.7, 2.5);
    [0x7b2743, 0x3d8a8a, 0xd4a45a, 0x2f6a3a].forEach((c, i) => {
      addMesh(root, world.geo.sphere, mat(c, { roughness: 0.7 }), 3.22, 0.55 + i * 0.38, -0.55 + i * 0.16, 0.15);
    });

    const chalk = canvasTex((ctx, w, h) => {
      ctx.fillStyle = "#1b3a28";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 10;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "700 36px Georgia, serif";
      ctx.fillText("THE CHEAT", 40, 78);
      ctx.fillStyle = "#e8f0d8";
      ctx.font = "24px Georgia, serif";
      ctx.fillText("Pegs lean AFTER you throw.", 40, 132);
      ctx.fillText("Aim the red ghosts.", 40, 172);
      ctx.fillText("SPIN the ring to the hook.", 40, 212);
      ctx.fillText("STEP the rail to line up.", 40, 252);
      ctx.fillText("Close isn’t stuck. SPIT.", 40, 292);
      ctx.fillText("1 coin · go deep.", 40, 338);
    }, 512, 380);
    chalk.repeat.set(1, 1);
    const sign = addMesh(root, world.geo.box, new THREE.MeshBasicMaterial({ map: chalk }), -4.05, 1.75, 0.55, 0.04, 1.25, 1.85);
    sign.rotation.y = Math.PI / 2;

    world.lanterns = [];
    [-1.8, 0, 1.8].forEach((x, i) => {
      const lamp = new THREE.Group();
      lamp.position.set(x, 3.22, -1.05 + i * 0.12);
      addMesh(lamp, world.geo.sphere, mat(0xffe2a0, { emissive: 0xffc878, emissiveIntensity: 0.9, roughness: 0.3 }), 0, 0, 0, 0.13);
      addMesh(lamp, world.geo.cyl, mat(0x3a2418), 0, 0.18, 0, 0.03, 0.24, 0.03);
      const light = new THREE.PointLight(0xffb060, 2.7, 10, 1.5);
      light.position.set(0, -0.05, 0);
      lamp.add(light);
      root.add(lamp);
      world.lanterns.push({ lamp, light, phase: i * 1.7 });
    });

    world.stringLights = [];
    for (let i = 0; i < 20; i += 1) {
      const col = i % 3 === 0 ? 0xc41e3a : i % 3 === 1 ? 0xf2c75c : 0xf7ebe0;
      const bulb = addMesh(root, world.geo.sphere, mat(col, { emissive: col, emissiveIntensity: 0.7 }),
        (i / 19 - 0.5) * 7.4, 3.62 + Math.sin(i * 0.7) * 0.09, -0.35, 0.048);
      world.stringLights.push(bulb);
    }

    const dustGeo = new THREE.BufferGeometry();
    const n = 110;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 7.4;
      pos[i * 3 + 1] = 0.4 + Math.random() * 3.4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 11;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: 0xffe0b0, size: 0.038, transparent: true, opacity: 0.38,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    root.add(dust);
    world.dust = dust;

    const bannerTex = canvasTex((ctx, w, h) => {
      ctx.fillStyle = "#3a1020";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "700 36px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("BENT RING PEGS", w / 2, 58);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "22px Georgia, serif";
      ctx.fillText("they lean after you throw", w / 2, 96);
    }, 512, 128);
    bannerTex.repeat.set(1, 1);
    world.banner = addMesh(root, world.geo.box, new THREE.MeshBasicMaterial({ map: bannerTex }), 0, 2.62, -5.12, 2.8, 0.72, 0.04);
    world.bannerTex = bannerTex;
    world.bannerCtx = world.bannerTex.image.getContext("2d");

    return root;
  }

  function paintBanner(spec) {
    const ctx = world && world.bannerCtx;
    const tex = world && world.bannerTex;
    if (!ctx || !tex) return;
    const w = 512;
    const h = 128;
    ctx.fillStyle = spec && spec.coda ? "#2a1020" : "#3a1020";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = spec && spec.coda ? "#e8a0b8" : "#d4a45a";
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = "#f0d09a";
    ctx.font = "700 28px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(spec && spec.coda ? "ENDLESS BENT PEGS" : "AUTHORED BOARD", w / 2, 42);
    ctx.fillStyle = "#fff6ec";
    ctx.font = "700 32px Georgia, serif";
    ctx.fillText(spec ? spec.name : "BENT RING PEGS", w / 2, 82);
    ctx.fillStyle = "#e8a0b8";
    ctx.font = "18px Georgia, serif";
    ctx.fillText(roomTell(spec), w / 2, 110);
    tex.needsUpdate = true;
  }

  function pegLayout(spec) {
    const n = spec.pegs;
    const kind = spec.kind || "tri";
    const spots = [];
    if (kind === "tri") {
      spots.push({ x: -0.58, z: 0.28, front: true });
      spots.push({ x: 0, z: -0.34, front: false });
      spots.push({ x: 0.58, z: 0.28, front: true });
    } else if (kind === "crosslean") {
      spots.push({ x: -0.62, z: 0.1, front: true });
      spots.push({ x: 0, z: -0.22, front: false });
      spots.push({ x: 0.62, z: 0.1, front: true });
    } else if (kind === "spin" || kind === "warp" || kind === "coda") {
      const r = kind === "warp" ? 0.52 : 0.56;
      for (let i = 0; i < n; i += 1) {
        const a = -Math.PI / 2 + (i / n) * TAU;
        spots.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, front: Math.sin(a) > 0 });
      }
    } else {
      const frontCount = Math.ceil(n / 2);
      const backCount = n - frontCount;
      for (let i = 0; i < n; i += 1) {
        const front = i < frontCount;
        const col = front ? i : i - frontCount;
        const cols = front ? frontCount : Math.max(1, backCount);
        const u = cols === 1 ? 0.5 : col / (cols - 1);
        spots.push({
          x: lerp(-0.78, 0.78, u),
          z: front ? 0.32 : -0.28,
          front,
        });
      }
    }
    return spots;
  }

  function wantTiltFor(spec, i, n) {
    const kind = spec.kind || "tri";
    if (kind === "tri") return 0;
    if (kind === "crosslean") return i === 0 ? -0.78 : i === 2 ? 0.78 : 0;
    if (kind === "hook" || kind === "warp") {
      const mask = spec.hookMask || [];
      if (!mask[i]) return 0;
      return i % 2 === 0 ? -0.7 : 0.7;
    }
    if (kind === "decoy") return i === 0 ? -0.55 : i === n - 1 ? 0.55 : 0;
    if (kind === "spin" || kind === "coda") return (i % 3 === 0 ? -0.62 : i % 3 === 1 ? 0.62 : 0);
    if (kind === "latesnap") return i < 2 ? 0 : (i % 2 ? -0.5 : 0.5);
    if (kind === "twindelay") return i < 3 ? (i === 0 ? -0.45 : i === 2 ? 0.45 : 0) : (i === 3 ? -0.7 : 0.7);
    return (i % 3 - 1) * 0.5;
  }

  function ghostLeanAmt(p, spec) {
    if (p && p.still) return 0;
    const deg = (spec && spec.leanDeg ? spec.leanDeg : 8) * (p && p.decoy ? 1.85 : 1);
    return deg * Math.PI / 180;
  }

  function applyPegPose(p, spec) {
    const a = p.lean;
    p.group.rotation.z = 0;
    p.group.rotation.x = 0;
    if (p.back) p.group.rotation.x = -a;
    else p.group.rotation.z = -a * (p.sign || 0);
    if (p.ghost) {
      const gA = ghostLeanAmt(p, spec);
      p.ghost.rotation.z = p.back ? 0 : -gA * (p.sign || 0);
      p.ghost.rotation.x = p.back ? -gA : 0;
      p.ghost.position.copy(p.group.position);
      p.ghost.visible = !p.stuck && !p.still && Math.abs(gA) > 0.01;
    }
  }

  function clearPlate() {
    if (!world || !world.plate) return;
    const keep = world.plateMesh;
    const dump = [];
    world.plate.children.forEach((ch) => { if (ch !== keep) dump.push(ch); });
    dump.forEach((ch) => world.plate.remove(ch));
    if (world.furniture) {
      world.boardRoot.remove(world.furniture);
      world.furniture = null;
    }
  }

  function tiltColor(want) {
    if (Math.abs(want) < 0.18) return 0xb8e8e0;
    return want < 0 ? 0xf2c75c : 0xe8a0b8;
  }

  function tiltLabel(want, p, spec) {
    if (p.decoy) return "DECOY";
    if (spec && (spec.kind === "hook" || spec.kind === "warp") && !p.hook) return "SPIT";
    if (p.hook && Math.abs(want) >= 0.18) return want < 0 ? "SPIN L" : "SPIN R";
    if (Math.abs(want) >= 0.18) return want < 0 ? "SPIN L" : "SPIN R";
    if (p.hook) return "HOOK";
    return "FLAT";
  }

  function makePegGroup(p, spec, ghost) {
    const g = new THREE.Group();
    const shaftMat = ghost
      ? world.mats.ghost
      : p.decoy ? world.mats.decoy : p.hook ? mat(tiltColor(p.wantTilt), { metalness: 0.42, roughness: 0.32 })
        : (p.still ? world.mats.still : world.mats.peg);
    const shaft = new THREE.Mesh(world.geo.peg, shaftMat);
    shaft.position.y = PEG_H / 2;
    g.add(shaft);
    const tip = new THREE.Mesh(world.geo.sphere, ghost ? world.mats.ghost : (p.decoy ? world.mats.decoyTip : world.mats.tip));
    tip.position.y = PEG_H;
    tip.scale.setScalar(0.044);
    g.add(tip);
    if (p.hook && !p.decoy) {
      const hk = new THREE.Mesh(world.geo.hook, ghost ? world.mats.ghost : world.mats.hook);
      hk.position.set(Math.sin(p.hookYaw) * 0.05, PEG_H - 0.05, Math.cos(p.hookYaw) * 0.05);
      hk.rotation.y = p.hookYaw;
      hk.rotation.z = p.wantTilt * 0.45;
      g.add(hk);
    }
    if (!ghost) {
      const label = makeLabel(tiltLabel(p.wantTilt, p, spec), p.decoy ? "#c41e3a" : (Math.abs(p.wantTilt) < 0.18 ? "#b8e8e0" : (p.wantTilt < 0 ? "#f2c75c" : "#e8a0b8")));
      label.position.set(0, 0.1, 0.1);
      g.add(label);
    }
    g.position.set(p.homeX, 0, p.homeZ);
    return g;
  }

  function makeLabel(text, color) {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 40;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(12,6,9,0.78)";
    ctx.fillRect(0, 0, 160, 40);
    ctx.fillStyle = color;
    ctx.font = "bold 22px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 80, 20);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    spr.scale.set(0.38, 0.095, 1);
    return spr;
  }

  function rebuildBoard(spec) {
    if (!world) return;
    clearPlate();
    const furniture = new THREE.Group();
    world.boardRoot.add(furniture);
    world.furniture = furniture;
    const kind = spec.kind || "tri";
    const wood = world.mats.wood;
    if (kind === "spin" || kind === "warp" || kind === "coda") {
      const plate = new THREE.Mesh(world.geo.disk, wood);
      plate.scale.set(0.86, 1, 0.86);
      furniture.add(plate);
      const rim = new THREE.Mesh(world.geo.torus, world.mats.hook);
      rim.rotation.x = Math.PI / 2;
      rim.scale.set(0.82, 0.82, 0.18);
      rim.position.y = 0.04;
      furniture.add(rim);
      world.plateMesh.scale.set(0.78, 1, 0.78);
      world.plateMesh.visible = true;
    } else if (kind === "tri") {
      world.plateMesh.visible = false;
      addMesh(furniture, world.geo.box, wood, 0, -0.04, 0, 1.7, 0.12, 1.28);
      addMesh(furniture, world.geo.cyl, world.mats.hook, 0, -0.01, 0, 0.08, 0.08, 0.08);
    } else if (kind === "twindelay" || kind === "latesnap" || kind === "hook" || kind === "decoy") {
      world.plateMesh.visible = false;
      addMesh(furniture, world.geo.box, wood, 0, -0.04, 0.32, 1.9, 0.1, 0.48);
      addMesh(furniture, world.geo.box, wood, 0, -0.04, -0.28, 1.9, 0.1, 0.48);
    } else {
      world.plateMesh.visible = false;
      addMesh(furniture, world.geo.box, wood, 0, -0.04, 0, 1.85, 0.12, 1.15);
    }

    const spots = pegLayout(spec);
    const hookMask = spec.hookMask || null;
    const pegs = [];
    for (let i = 0; i < spots.length; i += 1) {
      let sign = i % 2 === 0 ? 1 : -1;
      let back = false;
      if (spec.kind === "crosslean" || spec.kind === "warp") {
        if (i === 0) sign = -1;
        else if (i === spots.length - 1 || (spec.kind === "crosslean" && i === 2)) sign = 1;
        else { sign = 0; back = true; }
      }
      if (spec.kind === "tri") sign = i === 1 ? 0 : (i === 0 ? -1 : 1);
      const front = spots[i].front != null ? spots[i].front : true;
      let delayExtra = 0;
      if (spec.twinDelay || spec.kind === "twindelay" || spec.kind === "warp") {
        delayExtra = front ? (spec.frontDelayMs || 80) : (spec.backDelayMs || 380);
      }
      if (spec.kind === "latesnap" && !front) delayExtra = 40;
      const decoy = spec.decoyIndex != null && i === spec.decoyIndex;
      const hook = hookMask ? !!hookMask[i] : (spec.kind !== "hook" && spec.kind !== "warp");
      const wantTilt = wantTiltFor(spec, i, spots.length);
      const p = {
        homeX: spots[i].x, homeZ: spots[i].z,
        lean: 0, targetLean: 0, sign, stuck: false, flash: 0, wobble: i * 0.9,
        delayExtra, front, still: spec.kind === "tri" && i === 1, back, decoy,
        hook: decoy ? false : hook, leanStart: 0, wantTilt,
        hookYaw: wantTilt * 1.1,
      };
      if (p.still) p.sign = 0;
      p.targetLean = ghostLeanAmt(p, spec);
      p.group = makePegGroup(p, spec, false);
      p.ghost = makePegGroup(p, spec, true);
      world.plate.add(p.group);
      world.plate.add(p.ghost);
      applyPegPose(p, spec);
      pegs.push(p);
    }
    world.pegs = pegs;
    world.plate.rotation.y = 0;
    paintBanner(spec);
    if (run) run.pegs = pegs;
    return pegs;
  }

  function makeFlyingRing() {
    const mesh = new THREE.Mesh(world.geo.ring, world.mats.ring.clone());
    mesh.rotation.x = Math.PI / 2;
    mesh.visible = false;
    scene.add(mesh);
    const shadow = addMesh(scene, world.geo.disk, world.mats.blob, 0, 0.03, 0, 0.16, 1, 0.16);
    shadow.visible = false;
    return { mesh, shadow, pos: new THREE.Vector3(), vel: new THREE.Vector3(), flying: false, stuckOn: null, spin: 0, scale: 1, tilt: 0 };
  }

  function failGl() {
    THREE_OK = false;
    renderer = null;
    world = null;
    scene = null;
    camera = null;
    setText("bentRingStatus", "This tent needs WebGL.");
    return false;
  }

  function bootWorld() {
    canvas = el("bentRingCanvas");
    if (!canvas) return false;
    if (!THREE_OK) return false;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: window.devicePixelRatio < 1.6, powerPreference: "high-performance", alpha: false });
      const gl = renderer.getContext();
      if (!gl) return failGl();
    } catch (err) {
      return failGl();
    }
    try {
    renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x14080e, 1);
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x14080e, 8.2, 17);
    camera = new THREE.PerspectiveCamera(56, 16 / 9, 0.08, 60);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    clock = new THREE.Clock();
    world = { geo: makeGeos(), mats: {}, pegs: [], pathDots: [], stock: [], railX: 0, ringTilt: 0 };
    world.mats.wood = mat(0x6a4a28, { roughness: 0.82 });
    world.mats.peg = mat(0xd4a45a, { metalness: 0.45, roughness: 0.35, emissive: 0x3a2a10, emissiveIntensity: 0.15 });
    world.mats.tip = mat(0xf0d09a, { metalness: 0.5, roughness: 0.3 });
    world.mats.hookPeg = mat(0xb8e8e0, { metalness: 0.4, roughness: 0.32 });
    world.mats.hook = mat(0xf0d09a, { metalness: 0.55, roughness: 0.28 });
    world.mats.still = mat(0xb8e8e0, { metalness: 0.3, roughness: 0.4 });
    world.mats.decoy = mat(0xc41e3a, { metalness: 0.2, roughness: 0.4, emissive: 0x5a1018, emissiveIntensity: 0.25 });
    world.mats.decoyTip = mat(0xe8a0b8, { emissive: 0xc41e3a, emissiveIntensity: 0.3 });
    world.mats.ghost = new THREE.MeshBasicMaterial({ color: 0xc41e3a, transparent: true, opacity: 0.3, depthWrite: false });
    world.mats.ring = mat(0xb4232c, { roughness: 0.42, metalness: 0.18, emissive: 0x4a1014, emissiveIntensity: 0.12 });
    world.mats.ringIdle = mat(0x8a3030, { roughness: 0.5 });
    world.mats.ringStuck = mat(0x3d8a8a, { metalness: 0.35, roughness: 0.35, emissive: 0x1a4040, emissiveIntensity: 0.2 });
    world.mats.blob = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false });
    world.mats.trail = new THREE.MeshBasicMaterial({ color: 0xf0d09a, transparent: true, opacity: 0.28, depthWrite: false });

    scene.add(new THREE.AmbientLight(0x3a2418, 0.58));
    scene.add(new THREE.HemisphereLight(0xffc8a0, 0x2a1810, 0.74));
    const rim = new THREE.DirectionalLight(0x6a80b0, 0.32);
    rim.position.set(2.2, 3.2, 6);
    scene.add(rim);
    const key = new THREE.SpotLight(0xffe0a0, 3.6, 15, 0.72, 0.45, 1.15);
    key.position.set(0, 4.4, 2.4);
    key.target.position.copy(BOARD_POS);
    scene.add(key);
    scene.add(key.target);

    const tent = makeTent();
    scene.add(tent);
    world.tent = tent;

    world.boardRoot = new THREE.Group();
    world.boardRoot.position.copy(BOARD_POS);
    scene.add(world.boardRoot);
    world.plate = new THREE.Group();
    world.boardRoot.add(world.plate);
    world.plateMesh = new THREE.Mesh(world.geo.disk, world.mats.wood);
    world.plateMesh.scale.set(0.78, 1, 0.78);
    world.plate.add(world.plateMesh);

    world.aura = makeAura();
    world.aura.position.set(2.15, 0, -1.05);
    world.aura.rotation.y = -0.42;
    scene.add(world.aura);
    world.barker = makeBarker();
    world.barker.position.set(-2.15, 0, -0.72);
    world.barker.rotation.y = 0.5;
    scene.add(world.barker);

    world.liveRing = makeFlyingRing();
    world.pathDots = [];
    for (let i = 0; i < 18; i += 1) {
      const d = addMesh(scene, world.geo.sphere, mat(0xf0d09a, { emissive: 0xd4a45a, emissiveIntensity: 0.7 }), 0, 0, 0, 0.02);
      d.visible = false;
      world.pathDots.push(d);
    }
    world.trails = [];
    for (let i = 0; i < 8; i += 1) {
      const t = new THREE.Mesh(world.geo.ring, world.mats.trail.clone());
      t.visible = false;
      t.scale.setScalar(0.72);
      scene.add(t);
      world.trails.push(t);
    }
    world.sparks = [];
    for (let i = 0; i < 36; i += 1) {
      const m = new THREE.Mesh(world.geo.spark, mat(0xf0d09a, { emissive: 0xf2c75c, emissiveIntensity: 0.8 }));
      m.visible = false;
      m.scale.setScalar(0.03);
      scene.add(m);
      world.sparks.push({ mesh: m, pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0 });
    }
    world.sparkI = 0;
    const bandGeo = new THREE.BufferGeometry();
    const bandPos = new Float32Array(6);
    bandGeo.setAttribute("position", new THREE.BufferAttribute(bandPos, 3));
    world.band = new THREE.Line(bandGeo, new THREE.LineBasicMaterial({ color: 0xd4a45a, transparent: true, opacity: 0.85 }));
    world.band.visible = false;
    scene.add(world.band);

    world.cam = { mode: "orbit", yaw: 0.4, punch: 0, look: new THREE.Vector3(0, 1.15, -1.5) };
    rebuildBoard(bentringStageParams(1));
    resize();
    return true;
    } catch (err) {
      return failGl();
    }
  }

  function burst(pos, color, n) {
    if (!world) return;
    for (let i = 0; i < n; i += 1) {
      const p = world.sparks[world.sparkI % world.sparks.length];
      world.sparkI += 1;
      p.pos.copy(pos);
      p.vel.set((Math.random() - 0.5) * 3.4, 1.1 + Math.random() * 3.2, (Math.random() - 0.5) * 3.4);
      p.life = 0.38 + Math.random() * 0.32;
      p.mesh.visible = true;
      p.mesh.material.color.setHex(color);
      if (p.mesh.material.emissive) p.mesh.material.emissive.setHex(color);
      p.mesh.position.copy(pos);
    }
  }

  function resize() {
    if (!renderer || !camera || !canvas) return;
    const w = Math.max(1, canvas.clientWidth || canvas.parentElement && canvas.parentElement.clientWidth || 640);
    const h = Math.max(1, canvas.clientHeight || canvas.parentElement && canvas.parentElement.clientHeight || 480);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function ensureWorld() {
    if (world && renderer && THREE_OK) return true;
    if (!THREE_OK) return false;
    return bootWorld();
  }

  function stuckCount() {
    if (!run || !run.pegs) return 0;
    return run.pegs.reduce((n, p) => n + (p.stuck ? 1 : 0), 0);
  }

  function pegHolds(p, spec) {
    if (!p || p.decoy) return false;
    if (spec && (spec.kind === "hook" || spec.kind === "warp") && !p.hook) return false;
    return true;
  }

  function teePos() {
    const x = world ? world.railX : 0;
    return { x, y: TEE_Y, z: TEE_Z };
  }

  function throwSpeed(power) {
    return 7.2 + power * 3.6;
  }

  function aimLoft(power, extra) {
    return clamp(0.46 - power * 0.07 + (extra || 0), 0.3, 0.52);
  }

  function aimFromDrag(dx, dy) {
    const pullY = Math.max(0, dy);
    const power = clamp(Math.hypot(dx, pullY) / 140, 0.16, 1);
    const yaw = clamp(dx * 0.0028, -0.48, 0.48);
    const extra = clamp(Math.max(0, -dy) * 0.0006, 0, 0.06);
    return { power, yaw, loft: aimLoft(power, extra) };
  }

  function cookHoldPower(power) {
    if (power < 0.45) return 0.68;
    return power;
  }

  function aimVelocity(aim) {
    const speed = throwSpeed(aim.power);
    return {
      x: Math.sin(aim.yaw) * speed * 0.92,
      y: speed * aim.loft * 0.7,
      z: -Math.cos(aim.yaw) * speed,
    };
  }

  function predictArc(aim) {
    const v = aimVelocity(aim);
    const tee = teePos();
    const pts = [];
    let x = tee.x;
    let y = tee.y;
    let z = tee.z;
    let vx = v.x;
    let vy = v.y;
    let vz = v.z;
    const h = 0.03;
    for (let i = 0; i < 22; i += 1) {
      vy -= GRAVITY * h;
      x += vx * h;
      y += vy * h;
      z += vz * h;
      pts.push({ x, y, z });
      if (y < 0.1 || z < -5.6) break;
    }
    return pts;
  }

  function showPath(pts, on) {
    if (!world) return;
    world.pathDots.forEach((d, i) => {
      if (!on || !pts[i]) { d.visible = false; return; }
      d.visible = true;
      d.position.set(pts[i].x, pts[i].y, pts[i].z);
      const u = i / Math.max(1, pts.length);
      d.scale.setScalar(1.15 - u * 0.55);
    });
  }

  function setBand(from, to, on) {
    if (!world || !world.band) return;
    world.band.visible = !!on;
    if (!on) return;
    const pos = world.band.geometry.attributes.position;
    pos.setXYZ(0, from.x, from.y, from.z);
    pos.setXYZ(1, to.x, to.y, to.z);
    pos.needsUpdate = true;
  }

  function toast(msg, ms) {
    const n = el("bentRingToast");
    if (!n) return;
    if (!msg) { n.hidden = true; return; }
    n.textContent = msg;
    n.hidden = false;
    if (run) run.toastMs = ms || 780;
  }

  function showRoomCard(spec, ms) {
    const node = el("bentRingRoomCard");
    if (!node || !spec) return;
    setText("bentRingRoomKind", spec.coda ? "ENDLESS BENT PEGS" : "AUTHORED BOARD");
    setText("bentRingRoomName", spec.name);
    setText("bentRingRoomTell", roomTell(spec));
    node.hidden = false;
    if (run) run.roomCardMs = ms || 1280;
  }

  function paintTiltHud() {
    const pip = el("bentRingTiltPip");
    if (!pip) return;
    const tilt = world ? world.ringTilt : 0;
    pip.style.transform = `rotate(${tilt * 48}deg)`;
  }

  function paintPips() {
    const spec = (run && run.spec) || bentringStageParams(1);
    const max = spec.ringsPerStage || 3;
    const span = card() && card().querySelector(`[data-runkit-strikes="${GAME_ID}"]`);
    if (!span) return;
    if (span.childElementCount !== max) span.innerHTML = new Array(max).fill("<i></i>").join("");
    const used = isLive() || (run && run.dying) ? Math.max(0, max - (run.rings | 0)) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < used));
  }

  function ensureHud() {
    const hud = card() && card().querySelector(`[data-runkit-hud="${GAME_ID}"]`);
    const spec = (run && run.spec) || bentringStageParams(Math.max(1, ((run && run.stages) | 0) + 1));
    const playing = spec.id || Math.max(1, ((run && run.stages) | 0) + 1);
    if (hud) {
      hud.textContent = spec.coda
        ? `ENDLESS · BOARD ${playing} · ${spec.name}`
        : `BOARD ${playing} · ${spec.name}`;
    }
    const need = el("bentRingNeed");
    if (need) {
      const have = stuckCount();
      need.textContent = isLive() || (run && run.dying)
        ? `STICK ${have} / ${spec.need} · RINGS ${run.rings | 0}`
        : "STICK —";
    }
    paintPips();
    paintTiltHud();
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
    return hud;
  }

  function stampDepthCopy() {
    const host = card();
    if (!host) return;
    const num = host.querySelector(".machine-number");
    if (num) num.textContent = DEPTH_COPY.machine;
    host.querySelectorAll("[data-pf-depth-copy]").forEach((p) => { p.textContent = DEPTH_COPY.body; });
    if (!isLive() && el("bentRingStatus") && (!run || run.done)) {
      el("bentRingStatus").textContent = DEPTH_COPY.status;
    }
    ensureHud();
  }

  function challengeLine(n) {
    const kitRun = rk();
    if (kitRun && typeof kitRun.challengeText === "function") {
      try { return kitRun.challengeText("Bent Rings board", n | 0, GAME_ID); } catch (_) { /* authored */ }
    }
    return `Beat my Bent Rings board ${n | 0} on Penny Fever`;
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try { return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false }); } catch (_) { /* fall */ }
    }
    kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "out of rings",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestBentRing = Math.max(state.bestBentRing || 0, payload.depth);
      state.bestBentRingScore = Math.max(state.bestBentRingScore || 0, payload.score);
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function tellDepth(n) {
    const stages = n | 0;
    if (run && run.kitRun) run.kitRun.depth = stages;
    const spec = (run && run.spec) || bentringStageParams(Math.max(1, stages));
    if (run && run.kitRun && rk() && typeof rk().reportDepth === "function") {
      try { rk().reportDepth(run.kitRun, stages, { name: spec.name, coda: !!spec.coda }); } catch (_) { /* optional */ }
    }
    ensureHud();
  }

  function tellStrike(reason) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportStrike !== "function") return;
    try { rk().reportStrike(run.kitRun, reason); } catch (_) { /* pips */ }
    paintPips();
  }

  function auraLine(reason, stages) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "decoy") return AURA.decoy;
    if (reason === "hook") return AURA.hook;
    if (reason === "spin") return AURA.spin;
    if (stages >= 8) return AURA.deep;
    if (stages >= 5) return AURA.spin;
    if (stages >= 3) return AURA.mid;
    if (stages <= 0) return AURA.shallow;
    return AURA.miss;
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("bentring")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function applyRingPose(ring, tilt) {
    ring.mesh.rotation.x = Math.PI / 2 - tilt * 0.72;
    ring.mesh.rotation.z = tilt * 0.35;
  }

  function resetRingHome() {
    const ring = world && world.liveRing;
    if (!ring || !scene) return;
    if (ring.mesh.parent !== scene) scene.add(ring.mesh);
    ring.mesh.material = world.mats.ring;
    ring.flying = false;
    ring.stuckOn = null;
    ring.spitUntil = 0;
    ring.spitPeg = -1;
    const tee = teePos();
    ring.pos.set(tee.x, tee.y, tee.z);
    ring.vel.set(0, 0, 0);
    ring.tilt = world.ringTilt || 0;
    ring.mesh.position.copy(ring.pos);
    applyRingPose(ring, ring.tilt);
    ring.mesh.visible = isLive();
    ring.mesh.scale.setScalar((run && run.spec && run.spec.ringScale) || 1);
    if (ring.shadow) ring.shadow.visible = false;
    (world.trails || []).forEach((t) => { t.visible = false; });
  }

  function holdCtl(id, on) {
    const n = el(id);
    if (n) n.classList.toggle("is-held", !!on);
  }

  function showGate(on) {
    const gate = el("bentRingGate");
    if (gate) gate.hidden = !on;
  }

  function start() {
    if (isLive()) return;
    if (!ensureWorld() || !world || !world.cam) {
      try { if (kit) kit.setMode(card(), "vestibule"); } catch (_) { /* kit optional */ }
      showGate(true);
      setText("bentRingStatus", "This tent needs WebGL.");
      return;
    }
    const ctx = beginKitRun();
    if (!ctx) {
      kit.setMode(card(), "vestibule");
      showGate(true);
      setText("bentRingStatus", "No demo coins left — the pegs wait.");
      const startBtn = el("bentRingStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "PLAY NOW · 1 demo coin";
      }
      return;
    }
    const spec = bentringStageParams(1);
    if (world) {
      world.railX = 0;
      world.ringTilt = 0;
    }
    run = {
      kitRun: ctx, done: false, dying: false, t: 0, stages: 0, score: 0, rings: spec.ringsPerStage,
      spec, pegs: null, ring: null, aim: null, leaning: false, leanAt: 0, settle: 0,
      toastMs: 0, roomCardMs: 0, shake: 0, houseRings: 0, lastNote: "",
      charge: 0, charging: false,
    };
    kit.hideResult("bentRingResult");
    const verdict = el("bentRingVerdict");
    if (verdict) verdict.hidden = true;
    showGate(false);
    kit.setMode(card(), "play");
    const howto = el("bentRingHowTo");
    if (howto) howto.classList.remove("is-compact");
    rebuildBoard(spec);
    run.pegs = (world && world.pegs) || [];
    resetRingHome();
    if (world && world.cam) {
      world.cam.mode = "play";
      world.cam.punch = 0;
    }
    showRoomCard(spec, 1400);
    toast(spec.barker, 1500);
    setText("bentRingStatus", spec.barker);
    setText("bentRingBarker", spec.barker);
    setText("bentRingHint", "DRAG BACK TO THROW · GOLD POWER LANDS");
    tellDepth(0);
    ensureHud();
    PF.setAura && PF.setAura("point");
    sfx("chapter");
    beep(392, 784, 0.18, "sine", 0.03);
  }

  function beginAim(clientX, clientY) {
    if (!isLive() || !run || run.settle > 0) return;
    if (!world || !world.liveRing) return;
    if (run.ring && run.ring.flying) return;
    if (run.rings <= 0) return;
    if (run.charging) {
      run.charging = false;
      run.charge = 0;
    }
    resetRingHome();
    run.aim = { x0: clientX, y0: clientY, x: clientX, y: clientY };
    card() && card().classList.add("is-aiming");
    canvas && canvas.classList.add("is-pulling");
    const power = el("bentRingPower");
    if (power) power.hidden = false;
  }

  function updateAim(clientX, clientY) {
    if (!run || !run.aim) return;
    if (!world || !world.liveRing) return;
    run.aim.x = clientX;
    run.aim.y = clientY;
    const dx = run.aim.x0 - clientX;
    const dy = clientY - run.aim.y0;
    const aim = aimFromDrag(dx, dy);
    const ring = world.liveRing;
    const tee = teePos();
    ring.pos.set(
      tee.x - Math.sin(aim.yaw) * aim.power * 0.45,
      tee.y - aim.power * 0.12,
      tee.z + aim.power * 0.55
    );
    ring.mesh.position.copy(ring.pos);
    ring.mesh.visible = true;
    ring.tilt = world.ringTilt;
    applyRingPose(ring, ring.tilt);
    setBand(tee, ring.pos, true);
    showPath(predictArc(aim), true);
    const fill = el("bentRingPowerFill");
    if (fill) fill.style.width = `${Math.round(aim.power * 100)}%`;
  }

  function launchRing(aim) {
    if (!isLive() || !run) return;
    if (!world || !world.liveRing) return;
    if (run.ring && run.ring.flying) return;
    if (run.rings <= 0) return;
    if (aim.power < 0.18) {
      resetRingHome();
      setText("bentRingStatus", "Pull farther — or hold THROW longer.");
      return;
    }
    run.rings -= 1;
    const ring = world.liveRing;
    const v = aimVelocity(aim);
    const tee = teePos();
    ring.pos.set(tee.x, tee.y, tee.z);
    ring.flying = true;
    ring.stuckOn = null;
    ring.spitUntil = 0;
    ring.spitPeg = -1;
    ring.vel.set(v.x, v.y, v.z);
    ring.spin = 8 + aim.power * 10;
    ring.tilt = world.ringTilt;
    ring.mesh.position.copy(ring.pos);
    ring.mesh.visible = true;
    applyRingPose(ring, ring.tilt);
    run.ring = ring;
    run.leaning = false;
    run.leanAt = run.t + (run.spec.delayMs || 280);
    run.pegs.forEach((p) => { if (!p.stuck) { p.lean = 0; p.leanStart = 0; } });
    card() && card().classList.add("is-flying");
    world.cam.mode = "follow";
    paintPips();
    ensureHud();
    sfx("throw");
    beep(210, 90, 0.08, "square", 0.035);
    setText("bentRingStatus", "In the air — they haven’t leaned yet. Ghosts already tell.");
    burst(ring.pos, 0xf0d09a, 8);
    const howto = el("bentRingHowTo");
    if (howto) howto.classList.add("is-compact");
  }

  function releaseAim() {
    if (!run || !run.aim || !isLive()) return;
    const dx = run.aim.x0 - run.aim.x;
    const dy = run.aim.y - run.aim.y0;
    const aim = aimFromDrag(dx, dy);
    run.aim = null;
    card() && card().classList.remove("is-aiming");
    canvas && canvas.classList.remove("is-pulling");
    const powerEl = el("bentRingPower");
    if (powerEl) powerEl.hidden = true;
    const tee = teePos();
    setBand(tee, tee, false);
    showPath([], false);
    launchRing(aim);
  }

  function beginCharge() {
    if (!isLive() || !run || run.settle > 0) return;
    if (run.ring && run.ring.flying) return;
    if (run.aim) return;
    if (run.rings <= 0) return;
    run.charging = true;
    run.charge = 0.42;
    const power = el("bentRingPower");
    if (power) power.hidden = false;
    holdCtl("bentRingThrow", true);
  }

  function releaseCharge() {
    if (!run || !run.charging) {
      holdCtl("bentRingThrow", false);
      return;
    }
    const power = cookHoldPower(run.charge);
    run.charging = false;
    run.charge = 0;
    holdCtl("bentRingThrow", false);
    const powerEl = el("bentRingPower");
    if (powerEl) powerEl.hidden = true;
    showPath([], false);
    launchRing({ power, yaw: 0, loft: aimLoft(power, 0) });
  }

  function spitRing(ring, p, i, hit, note, toastMsg, status) {
    _v.copy(ring.pos).sub(hit).normalize();
    if (!isFinite(_v.x)) _v.set(0, 1, 0.2);
    ring.vel.addScaledVector(_v, 2.6);
    ring.vel.y = Math.abs(ring.vel.y) * 0.34 + 1.4;
    ring.spitPeg = i;
    ring.spitUntil = run.t + 340;
    p.flash = 220;
    run.lastNote = note || "spit";
    world.cam.punch = 0.12;
    toast(toastMsg || "SPIT — close isn’t stuck", 760);
    sfx("spit");
    beep(160, 64, 0.11, "sawtooth", 0.045);
    setText("bentRingStatus", status || "SPIT. The neck bounced you. Stick is inner, not the kiss.");
    if (world.aura) world.aura.userData.wave = 0.6;
    burst(ring.pos, 0xc41e3a, 10);
  }

  function tryStick(ring) {
    if (!run || ring.stuckOn != null) return false;
    const spec = run.spec;
    const scale = spec.ringScale || 1;
    const inner = (RING_R - RING_TUBE) * scale * 1.08;
    const outer = (RING_R + RING_TUBE) * scale + PEG_R + 0.012;
    const spitLock = ring.spitUntil && run.t < ring.spitUntil;
    world.boardRoot.updateMatrixWorld(true);
    const holeAxis = _v3.set(0, 0, 1).applyQuaternion(ring.mesh.quaternion);
    for (let i = 0; i < run.pegs.length; i += 1) {
      const p = run.pegs[i];
      if (p.stuck) continue;
      if (spitLock && ring.spitPeg === i) continue;
      p.group.updateMatrixWorld(true);
      p.group.localToWorld(_v.set(0, 0, 0));
      p.group.localToWorld(_v2.set(0, PEG_H, 0));
      const bx = _v.x;
      const by = _v.y;
      const bz = _v.z;
      const sx = _v2.x - bx;
      const sy = _v2.y - by;
      const sz = _v2.z - bz;
      const slen2 = sx * sx + sy * sy + sz * sz || 1;
      const rx = ring.pos.x - bx;
      const ry = ring.pos.y - by;
      const rz = ring.pos.z - bz;
      const along = clamp((rx * sx + ry * sy + rz * sz) / slen2, 0, 1);
      const hx = bx + sx * along;
      const hy = by + sy * along;
      const hz = bz + sz * along;
      const d = Math.hypot(ring.pos.x - hx, ring.pos.y - hy, ring.pos.z - hz);
      const slen = Math.sqrt(slen2);
      const align = Math.abs(holeAxis.x * sx + holeAxis.y * sy + holeAxis.z * sz) / slen;
      if (d > outer || along < 0.18) continue;
      _v2.set(hx, hy, hz);
      if (p.decoy) {
        spitRing(ring, p, i, _v2, "decoy", "DECOY — never holds", "Decoy peg. It leans off-board on purpose.");
        return false;
      }
      if (!pegHolds(p, spec)) {
        spitRing(ring, p, i, _v2, "hook", "STRAIGHT — HOOKS ONLY", "Straight peg spat you. Only hooks hold.");
        return false;
      }
      const tiltErr = Math.abs((ring.tilt || 0) - (p.wantTilt || 0));
      if (tiltErr > (spec.tiltTol || 0.7) && Math.abs(p.wantTilt) >= 0.18) {
        spitRing(ring, p, i, _v2, "spin", "SPIN THE RING — match the hook", "Wrong tilt. SPIN until the dial matches the peg’s color.");
        return false;
      }
      if (d < inner && along > 0.18 && along < 1.04 && align > 0.26 && ring.vel.y < 2.8) {
        p.stuck = true;
        p.flash = 280;
        ring.stuckOn = i;
        ring.flying = false;
        ring.mesh.visible = false;
        if (ring.shadow) ring.shadow.visible = false;
        const kept = ring.mesh.clone();
        kept.material = world.mats.ringStuck;
        kept.visible = true;
        kept.position.set(0, PEG_H * 0.72, 0);
        kept.rotation.set(Math.PI / 2, 0, 0);
        p.group.add(kept);
        run.score += 80;
        if (run.kitRun) run.kitRun.score = run.score;
        world.cam.punch = 0.2;
        world.cam.mode = "play";
        sfx("sink");
        beep(540, 240, 0.1, "sine", 0.05);
        toast("STUCK", 520);
        setText("bentRingStatus", `Stuck ${stuckCount()}/${spec.need} · rings ${run.rings}.`);
        PF.setAura && PF.setAura("celebrate");
        if (world.aura) world.aura.userData.wave = 1;
        card() && card().classList.remove("is-flying");
        burst(_v2, 0x3d8a8a, 16);
        ensureHud();
        return true;
      }
      if (d < outer && along > 0.2) {
        spitRing(ring, p, i, _v2, "spit", "SPIT — close isn’t stuck", "SPIT. The neck bounced you. Stick is inner, not the kiss.");
        return false;
      }
    }
    return false;
  }

  function killRing(note) {
    if (!run) return;
    const ring = run.ring;
    if (ring && ring.stuckOn == null) {
      ring.flying = false;
      ring.mesh.visible = false;
      if (ring.shadow) ring.shadow.visible = false;
    }
    run.ring = null;
    run.lastNote = note || "miss";
    run.settle = 280;
    tellStrike("miss");
    paintPips();
    sfx("miss");
    beep(120, 52, 0.13, "triangle", 0.04);
    card() && card().classList.remove("is-flying");
    world.cam.mode = "play";
    const have = stuckCount();
    setText("bentRingStatus", `Miss. Stuck ${have}/${run.spec.need} · rings ${run.rings}.`);
    ensureHud();
    if (run.rings <= 0 && have < run.spec.need) beginDeath("out of rings");
    else if (run.rings > 0) resetRingHome();
  }

  function addHouseRing() {
    if (!world || !world.houseBasket) return;
    const r = new THREE.Mesh(world.geo.ring, world.mats.ringIdle);
    const n = world.houseStack.length;
    r.position.set(-2.55 + (n % 2) * 0.08, 0.58 + n * 0.045, 2.45);
    r.rotation.x = Math.PI / 2;
    r.rotation.z = n * 0.4;
    r.scale.setScalar(0.7);
    world.tent.add(r);
    world.houseStack.push(r);
  }

  function clearStage() {
    run.stages += 1;
    run.score += 350;
    if (run.kitRun) {
      run.kitRun.depth = run.stages;
      run.kitRun.score = run.score;
    }
    tellDepth(run.stages);
    paintPips();
    sfx("rack");
    sfx("chapter");
    beep(392, 784, 0.2, "sine", 0.045);
    PF.setAura && PF.setAura("celebrate");
    const leftover = run.rings;
    if (leftover > 0) {
      run.houseRings = (run.houseRings || 0) + leftover;
      for (let i = 0; i < leftover; i += 1) addHouseRing();
    }
    toast(leftover > 0 ? `BOARD ${run.stages} · leftover stays in the house` : `BOARD ${run.stages} CLEAR`, 900);
    const next = bentringStageParams(run.stages + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    run.spec = next;
    run.rings = next.ringsPerStage;
    run.ring = null;
    run.aim = null;
    run.leaning = false;
    run.settle = 420;
    rebuildBoard(next);
    run.pegs = world.pegs;
    resetRingHome();
    showRoomCard(next, 1280);
    setText("bentRingStatus", `BOARD ${run.stages} CLEAR · +350. ${next.name} — ${next.barker}`);
    setText("bentRingBarker", next.barker);
    world.cam.mode = "play";
    burst(BOARD_POS.clone().setY(1.4), 0xf2c75c, 18);
    ensureHud();
  }

  function beginDeath(reason) {
    if (!run || run.dying || run.done) return;
    run.dying = true;
    run.deathReason = reason;
    run.deathAt = run.t + DEATH_HOLD_MS;
    world.cam.mode = "death";
    world.cam.punch = 0.22;
    toast("OUT OF RINGS", 800);
    sfx("stamp");
    setText("bentRingStatus", "Board stamped MISS.");
    PF.setAura && PF.setAura("badLuck");
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    run.aim = null;
    run.charging = false;
    card() && card().classList.remove("is-aiming", "is-flying");
    showPath([], false);
    const tee = teePos();
    setBand(tee, tee, false);
    const powerEl = el("bentRingPower");
    if (powerEl) powerEl.hidden = true;
    holdCtl("bentRingThrow", false);
    const stages = run.stages;
    const score = run.score;
    persistDepth({
      depth: stages,
      score,
      deathReason: reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : "out of rings"),
      cashedOut: reason === "souvenir",
      meta: { boards: stages, houseRings: run.houseRings || 0, lastNote: run.lastNote },
    });
    ["bentRingStart", "bentRingAgain", "bentRingStartPlay"].forEach((id) => {
      const btn = el(id);
      if (btn) {
        btn.disabled = false;
        btn.hidden = id === "bentRingStartPlay";
        if (id !== "bentRingStartPlay") btn.textContent = "TOSS AGAIN · 1 demo coin";
      }
    });
    PF.focusCard && PF.focusCard("bentRingCard", false);
    showGate(false);
    kit.setMode(card(), "result");
    const death = reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : "out of rings");
    const aura = auraLine(run.lastNote === "spin" ? "spin" : (run.lastNote === "decoy" ? "decoy" : (run.lastNote === "hook" ? "hook" : reason)), stages);
    const challenge = challengeLine(stages);
    const verdict = el("bentRingVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = `BOARD ${stages} · SCORE ${score} · ${death} · ${aura}`;
    }
    kit.fillResult({
      root: "bentRingResult",
      depth: "bentRingResultDepth",
      score: "bentRingResultScore",
      aura: "bentRingResultAura",
      copied: "bentRingCopied",
    }, {
      depthLine: `BOARD ${stages}${run.spec && run.spec.name ? " · " + run.spec.name : ""}`,
      scoreLine: `SCORE ${score} · ${String(death).replace(/_/g, " ").toUpperCase()}`,
      auraLine: aura,
    });
    const reasonNode = el("bentRingResultReason");
    if (reasonNode) reasonNode.textContent = String(death).replace(/_/g, " ").toUpperCase();
    setText("bentRingChallengeText", challenge);
    PF.setTier && PF.setTier("bentRingTier", stages > 0 ? `BOARD ${stages}` : "MISS", stages > 0 ? "perfect" : "miss");
    setText("bentRingStatus", reason === "leave" ? "Stepped off the stall." : reason === "souvenir" ? "Souvenir — authored boards cleared." : "Board stamped MISS.");
    if (stages > 0) {
      PF.award && PF.award(Math.max(8, Math.floor(score / 12)), true, "Bent rings");
      PF.setAura && PF.setAura(stages >= 3 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner && PF.showBanner(true, `BOARD ${stages}`, `${score} · ${aura}`);
    } else {
      PF.award && PF.award(0, false, "Bent rings miss");
      PF.setAura && PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner && PF.showBanner(false, "MISS", aura);
    }
    PF.refreshNightBoard && PF.refreshNightBoard();
    ensureHud();
    if (world && world.cam) world.cam.mode = "orbit";
  }

  function stepPegs(dt) {
    if (!run || !run.pegs || !world) return;
    const spec = run.spec;
    const flying = !!(run.ring && run.ring.flying);
    if (world.mats.ghost) world.mats.ghost.opacity = flying ? 0.62 : 0.4;
    if (spec.spin || spec.kind === "spin" || spec.kind === "warp" || spec.kind === "coda") {
      const rate = spec.kind === "warp" ? 0.32 : 0.68;
      world.plate.rotation.y += rate * dt * (spec.kind === "coda" ? 0.55 : 1);
    }
    run.pegs.forEach((p) => {
      p.flash = Math.max(0, p.flash - dt * 1000);
    });
    if (flying && !run.leaning && run.t < run.leanAt) {
      const remain = Math.max(0, run.leanAt - run.t);
      const twitch = 1 - remain / Math.max(1, spec.delayMs || 280);
      const snap = !!(spec.snap || spec.kind === "latesnap");
      run.pegs.forEach((p) => {
        if (p.stuck || p.still) return;
        const ghost = p.targetLean || ghostLeanAmt(p, spec);
        p.lean = ghost * (snap ? 0.34 : 0.22) * twitch * Math.sin(run.t * (snap ? 0.055 : 0.03) + p.wobble);
        applyPegPose(p, spec);
      });
    }
    if (flying && !run.leaning && run.t >= run.leanAt) {
      run.leaning = true;
      run.pegs.forEach((p) => { if (!p.stuck) p.leanStart = run.t + (p.delayExtra || 0); });
      const snap = !!(spec.snap || spec.kind === "latesnap");
      const leanLine = spec.kind === "spin"
        ? "PLATE SPINS — throw was already gone."
        : snap ? "THEY SNAP — throw was already gone." : "THEY LEAN — throw was already gone.";
      setText("bentRingStatus", leanLine);
      toast(snap ? "SNAP" : (spec.kind === "spin" ? "SPIN" : "THEY LEAN"), 640);
      world.cam.punch = snap ? 0.16 : 0.1;
      sfx("stamp");
      beep(180, 90, 0.12, "triangle", 0.04);
      PF.setAura && PF.setAura("laugh");
    }
    if (run.leaning) {
      const lerpMs = (spec.snap || spec.kind === "latesnap") ? SNAP_LERP_MS : LEAN_LERP_MS;
      run.pegs.forEach((p) => {
        if (p.stuck || !p.leanStart) { applyPegPose(p, spec); return; }
        if (p.still) { p.lean = 0; applyPegPose(p, spec); return; }
        const u = clamp((run.t - p.leanStart) / lerpMs, 0, 1);
        const over = spec.snap || spec.kind === "latesnap"
          ? u
          : (u < 0.7 ? (u / 0.7) * 1.22 : 1.22 - ((u - 0.7) / 0.3) * 0.22);
        p.lean = p.targetLean * over;
        applyPegPose(p, spec);
      });
    } else if (!flying) {
      run.pegs.forEach((p) => applyPegPose(p, spec));
    }
  }

  function stepRing(dt) {
    const ring = run && run.ring;
    if (!world || !ring || !ring.flying) return;
    const steps = 2;
    const h = dt / steps;
    for (let s = 0; s < steps; s += 1) {
      ring.vel.y -= GRAVITY * h;
      ring.pos.addScaledVector(ring.vel, h);
      ring.mesh.position.copy(ring.pos);
      applyRingPose(ring, ring.tilt);
      ring.mesh.rotation.y += ring.spin * h;
      if (ring.shadow) {
        ring.shadow.visible = ring.pos.y > 0.05;
        ring.shadow.position.set(ring.pos.x, 0.025, ring.pos.z);
        const sc = clamp(0.22 + (1.4 - ring.pos.y) * 0.08, 0.12, 0.32);
        ring.shadow.scale.set(sc, 1, sc);
      }
      (world.trails || []).forEach((t, i) => {
        const u = (i + 1) / (world.trails.length + 1);
        t.visible = true;
        t.position.lerpVectors(t.position, ring.pos, 0.18 + u * 0.2);
        t.rotation.copy(ring.mesh.rotation);
        t.material.opacity = 0.22 * (1 - u);
        t.scale.setScalar(0.9 - u * 0.25);
      });
      if (tryStick(ring)) {
        if (stuckCount() >= run.spec.need) {
          run.settle = 360;
          run.pendingClear = true;
        } else if (run.rings <= 0) {
          beginDeath("out of rings");
        } else {
          run.settle = 180;
          run.pendingReset = true;
        }
        return;
      }
      if (ring.pos.y < 0.12 || ring.pos.z < -5.8 || ring.pos.z > 6.2 || Math.abs(ring.pos.x) > 4.6 || ring.pos.y > 7) {
        killRing("miss");
        return;
      }
    }
  }

  function stepIdle(t, dt) {
    if (!world) return;
    const spec = bentringStageParams(((Math.floor(t / 4.2) % AUTHORED_COUNT) + 1));
    if (!world.idleKind || world.idleKind !== spec.kind) {
      world.idleKind = spec.kind;
      rebuildBoard(spec);
    }
    const u = (Math.sin(t * 1.3) + 1) / 2;
    (world.pegs || []).forEach((p) => {
      if (p.still) p.lean = 0;
      else p.lean = p.targetLean * u;
      applyPegPose(p, spec);
    });
    if (spec.spin || spec.kind === "spin" || spec.kind === "warp") {
      world.plate.rotation.y += 0.35 * dt;
    }
  }

  function stepPeople(t) {
    if (!world) return;
    [world.aura, world.barker].forEach((who) => {
      if (!who || !who.userData || !who.userData.hip) return;
      const bob = Math.sin(t * 2.2 + who.userData.t) * 0.02;
      who.userData.hip.position.y = 0.42 + bob;
      if (who.userData.head) who.userData.head.rotation.y = Math.sin(t * 0.8 + who.userData.t) * 0.18;
      if (who.userData.armR) {
        const wave = who.userData.wave || 0;
        who.userData.armR.rotation.z = -0.4 - Math.sin(t * (wave > 0 ? 8 : 2)) * (wave > 0 ? 0.7 : 0.08);
        who.userData.wave = Math.max(0, wave - 0.016);
      }
    });
  }

  function stepFx(t, dt) {
    if (!world) return;
    (world.lanterns || []).forEach((L) => {
      L.light.intensity = 2.35 + Math.sin(t * 3.1 + L.phase) * 0.5;
    });
    (world.stringLights || []).forEach((b, i) => {
      const m = b.material;
      if (m) m.emissiveIntensity = 0.45 + Math.sin(t * 4 + i) * 0.28;
    });
    if (world.dust) {
      world.dust.rotation.y += dt * 0.04;
      const pos = world.dust.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        let y = pos.getY(i) + dt * 0.07;
        if (y > 3.6) y = 0.3;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }
    (world.sparks || []).forEach((p) => {
      if (p.life <= 0) { p.mesh.visible = false; return; }
      p.life -= dt;
      p.vel.y -= 6 * dt;
      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);
      p.mesh.scale.setScalar(0.018 + p.life * 0.05);
      p.mesh.visible = p.life > 0;
    });
    (world.railPads || []).forEach((pad, i) => {
      const x = lerp(-1.45, 1.45, i / 4);
      const d = Math.abs((world.railX || 0) - x);
      pad.material.emissiveIntensity = d < 0.28 ? 0.55 : 0.08;
    });
  }

  function stepInput(dt) {
    if (!world) return;
    const live = isLive();
    const flying = !!(run && run.ring && run.ring.flying);
    if (live && !flying) {
      let dx = 0;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;
      if (dx) world.railX = clamp(world.railX + dx * STEP_SPEED * dt, RAIL_MIN, RAIL_MAX);
      if (keys.spinL) world.ringTilt = clamp(world.ringTilt - SPIN_SPEED * dt, -1.05, 1.05);
      if (keys.spinR) world.ringTilt = clamp(world.ringTilt + SPIN_SPEED * dt, -1.05, 1.05);
      if (run && run.charging) {
        run.charge = clamp(run.charge + dt * 1.15, 0.16, 1);
        const fill = el("bentRingPowerFill");
        if (fill) fill.style.width = `${Math.round(run.charge * 100)}%`;
        const p = cookHoldPower(run.charge);
        showPath(predictArc({ power: p, yaw: 0, loft: aimLoft(p, 0) }), true);
      }
      if (!run.aim && !run.charging) {
        const ring = world.liveRing;
        if (ring && !ring.flying) {
          const tee = teePos();
          ring.pos.set(tee.x, tee.y, tee.z);
          ring.mesh.position.copy(ring.pos);
          ring.tilt = world.ringTilt;
          applyRingPose(ring, ring.tilt);
          ring.mesh.visible = true;
        }
      }
    }
    paintTiltHud();
    holdCtl("bentRingStepL", keys.left);
    holdCtl("bentRingStepR", keys.right);
    holdCtl("bentRingSpinL", keys.spinL);
    holdCtl("bentRingSpinR", keys.spinR);
  }

  function stepCamera(dt, t) {
    if (!world || !camera) return;
    const c = world.cam;
    c.punch *= 0.86;
    const rail = world.railX || 0;
    let tx = rail * 0.36;
    let ty = 1.5;
    let tz = 4.55;
    let lx = rail * 0.22;
    let ly = 1.06;
    let lz = -1.72;
    if (c.mode === "orbit" || !isLive()) {
      c.yaw += dt * 0.18;
      tx = Math.sin(c.yaw) * 5.2;
      tz = Math.cos(c.yaw) * 4.5 + 0.15;
      ty = 1.9 + Math.sin(t * 0.35) * 0.12;
      lx = 0; ly = 1.15; lz = -1.35;
    } else if (c.mode === "follow" && run && run.ring && run.ring.flying) {
      const p = run.ring.pos;
      tx = lerp(rail * 0.3, p.x * 0.22, 0.35);
      ty = lerp(1.52, p.y + 0.42, 0.28);
      tz = lerp(4.5, p.z + 2.15, 0.32);
      lx = p.x * 0.55; ly = lerp(1.08, p.y, 0.4); lz = lerp(-1.7, p.z, 0.45);
    } else if (c.mode === "death") {
      tx = 0.35; ty = 1.32; tz = 4.15;
      lx = 0; ly = 0.95; lz = -1.9;
    } else {
      const pull = run && run.aim ? clamp(Math.hypot(run.aim.x0 - run.aim.x, run.aim.y - run.aim.y0) / 170, 0, 1) : (run && run.charging ? run.charge : 0);
      tz = 4.55 + pull * 0.4;
      ty = 1.5 + pull * 0.06;
    }
    camera.position.x = lerp(camera.position.x, tx, 0.09);
    camera.position.y = lerp(camera.position.y, ty, 0.09);
    camera.position.z = lerp(camera.position.z, tz, 0.09);
    c.look.x = lerp(c.look.x, lx, 0.12);
    c.look.y = lerp(c.look.y, ly, 0.12);
    c.look.z = lerp(c.look.z, lz, 0.12);
    if (c.punch > 0.002) {
      camera.position.x += (Math.random() - 0.5) * c.punch;
      camera.position.y += (Math.random() - 0.5) * c.punch;
    }
    camera.lookAt(c.look);
  }

  function stepGame(dt) {
    if (!run || run.done) return;
    const ms = dt * 1000;
    run.t += ms;
    if (run.settle > 0) run.settle = Math.max(0, run.settle - ms);
    if (run.toastMs > 0) {
      run.toastMs = Math.max(0, run.toastMs - ms);
      if (run.toastMs === 0) toast("");
    }
    if (run.roomCardMs > 0) {
      run.roomCardMs = Math.max(0, run.roomCardMs - ms);
      if (run.roomCardMs === 0) {
        const n = el("bentRingRoomCard");
        if (n) n.hidden = true;
      }
    }
    stepPegs(dt);
    stepRing(dt);
    if (run.pendingClear && run.settle <= 0) {
      run.pendingClear = false;
      clearStage();
    } else if (run.pendingReset && run.settle <= 0) {
      run.pendingReset = false;
      resetRingHome();
    }
    if (run.dying && run.t >= run.deathAt) finish(run.deathReason || "out of rings");
  }

  function loop() {
    if (!shown) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
    if (!renderer || !scene || !camera) return;
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    stepInput(dt);
    stepFx(t, dt);
    stepPeople(t);
    if (isLive() || (run && (run.dying || run.settle > 0) && !run.done)) stepGame(dt);
    else stepIdle(t, dt);
    stepCamera(dt, t);
    renderer.render(scene, camera);
  }

  function startLoop() {
    if (raf) return;
    if (clock) clock.getDelta();
    raf = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function onPointerDown(ev) {
    if (!isLive()) {
      if (!run || run.done) start();
      return;
    }
    ev.preventDefault();
    try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
    beginAim(ev.clientX, ev.clientY);
  }
  function onPointerMove(ev) {
    if (!run || !run.aim) return;
    ev.preventDefault();
    updateAim(ev.clientX, ev.clientY);
  }
  function onPointerUp(ev) {
    if (!run || !run.aim) return;
    ev.preventDefault();
    updateAim(ev.clientX, ev.clientY);
    releaseAim();
  }

  function bindHold(id, key, alsoCharge) {
    const n = el(id);
    if (!n) return;
    const down = (ev) => {
      ev.preventDefault();
      try { n.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
      keys[key] = true;
      if (alsoCharge) beginCharge();
    };
    const up = (ev) => {
      ev.preventDefault();
      keys[key] = false;
      if (alsoCharge) releaseCharge();
    };
    const leave = () => {
      if (alsoCharge) return;
      keys[key] = false;
    };
    n.addEventListener("pointerdown", down);
    n.addEventListener("pointerup", up);
    n.addEventListener("pointerleave", leave);
    n.addEventListener("pointercancel", up);
  }

  function onKeyDown(ev) {
    if (!shown) return;
    const k = ev.key.toLowerCase();
    if (k === "a" || k === "arrowleft") { keys.left = true; ev.preventDefault(); }
    if (k === "d" || k === "arrowright") { keys.right = true; ev.preventDefault(); }
    if (k === "q") { keys.spinL = true; ev.preventDefault(); }
    if (k === "e") { keys.spinR = true; ev.preventDefault(); }
    if (k === " " || k === "enter") {
      if (!keys.throw) { keys.throw = true; beginCharge(); }
      ev.preventDefault();
    }
  }
  function onKeyUp(ev) {
    if (!shown) return;
    const k = ev.key.toLowerCase();
    if (k === "a" || k === "arrowleft") keys.left = false;
    if (k === "d" || k === "arrowright") keys.right = false;
    if (k === "q") keys.spinL = false;
    if (k === "e") keys.spinR = false;
    if (k === " " || k === "enter") {
      keys.throw = false;
      releaseCharge();
    }
  }

  function tryAutoStart() {
    if (!shown) return;
    if (isLive()) return;
    if (run && run.dying && !run.done) return;
    if (run && !run.done) return;
    const hash = (location.hash || "").replace(/^#/, "");
    if (/\/result(?:\/|$)/.test(hash)) return;
    start();
  }

  PF.registerVendor({
    id: "bent-rings",
    playKey: "bentring",
    chalk: "Ring a bent peg — if it stays bent.",
    defaults: { bestBentRing: 0, bestBentRingScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      shown = false;
      keys.left = keys.right = keys.spinL = keys.spinR = keys.throw = false;
      stopLoop();
    },
    onShow() {
      shown = true;
      stampDepthCopy();
      showGate(false);
      kit.setMode(card(), "play");
      ensureWorld();
      resize();
      startLoop();
      tryAutoStart();
      requestAnimationFrame(() => {
        resize();
        startLoop();
        tryAutoStart();
      });
    },
    onReset() {
      run = null;
      const verdict = el("bentRingVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("bentRingResult");
      const startBtn = el("bentRingStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "PLAY NOW · 1 demo coin";
      }
      const again = el("bentRingAgain");
      if (again) again.textContent = "TOSS AGAIN · 1 demo coin";
      kit.setMode(card(), "vestibule");
      stampDepthCopy();
      if (world) world.cam.mode = "orbit";
    },
    refreshDepth(state) {
      setText("depthBentNow", isLive() || (run && run.dying) ? String(run.stages) : "0");
      const bestN = Math.max(state.bestBentRing || 0, (state.bestDepth && state.bestDepth.bentring) || 0);
      setText("depthBentBest", bestN ? String(bestN) : "—");
      setText("depthBentScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("depthBentBestScore", state.bestBentRingScore ? String(state.bestBentRingScore) : "—");
      const door = el("bentRingDoorBest");
      if (door) door.textContent = bestN ? `Best board ${bestN}` : "Boards —";
    },
    bind() {
      declareP0();
      const startBtn = el("bentRingStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const startPlay = el("bentRingStartPlay");
      if (startPlay) startPlay.addEventListener("click", start);
      const again = el("bentRingAgain");
      if (again) again.addEventListener("click", start);
      canvas = el("bentRingCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointercancel", () => {
          if (run) run.aim = null;
          canvas.classList.remove("is-pulling");
        });
      }
      bindHold("bentRingStepL", "left");
      bindHold("bentRingStepR", "right");
      bindHold("bentRingSpinL", "spinL");
      bindHold("bentRingSpinR", "spinR");
      bindHold("bentRingThrow", "throw", true);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("resize", resize);
      if (window.ResizeObserver && el("bentRingStage")) {
        resizeObs = new ResizeObserver(resize);
        resizeObs.observe(el("bentRingStage"));
      }
      const copyBtn = el("bentRingChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const last = PF.getState().lastRun;
          const n = (last && (last.game === GAME_ID || last.gameId === GAME_ID))
            ? last.depth
            : (PF.getState().bestBentRing || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("bentRingCopied");
            if (copied) {
              copied.hidden = false;
              copied.textContent = "Copied — send it";
            }
            setText("bentRingStatus", "Copied — send it");
          }, () => setText("bentRingStatus", text));
        });
      }
      stampDepthCopy();
    },
  });
}
