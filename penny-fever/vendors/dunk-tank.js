/* Dunk the Barker — Desktop Grok owns this doorway. PF only.
 * Never booth/port 6000. Never Imagine downloads.
 * 3D dunk tent: Three.js camera, tank, plate cheats, splash juice.
 * 8 authored SEATS then ENDLESS. One coin = one run. Keep it cute. */
import * as THREE from "../world/lib/three.module.min.js";

(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor || !PF.kit) return;
  const { $, kit } = PF;

  const GAME_ID = "dunk";
  const BALLS_PER_SEAT = 3;
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const GRAVITY = 9.8;
  const BALL_R = 0.11;
  const TEE = { x: 0, y: 1.08, z: -4.95 };
  const DUNK_MS = 1920;
  const LIE_LAG_MS = 460;
  const DUNK_SCORE = 400;
  const DEATH_HOLD_MS = 860;
  const PULL_MAX_FRAC = 0.46;

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;
  const WOOD = 0x3a2418;
  const WOOD_DARK = 0x1a100c;
  const BRASS = 0xd4a45a;
  const TEAL = 0x3d8a8a;
  const CARNIVAL_RED = 0xc41e3a;

  const geoBox = new THREE.BoxGeometry(1, 1, 1);
  const geoSphere = new THREE.SphereGeometry(1, 16, 12);
  const geoCyl = new THREE.CylinderGeometry(1, 1, 1, 12);
  const geoCone = new THREE.ConeGeometry(1, 1, 8);
  const geoTorus = new THREE.TorusGeometry(1, 0.12, 8, 20);
  const geoPlane = new THREE.PlaneGeometry(1, 1, 1, 1);
  const _v = new THREE.Vector3();
  const _look = new THREE.Vector3();
  const _tmp = new THREE.Vector3();

  let run = null;
  let loopRaf = 0;
  let idleRoom = 1;
  let idleClock = 0;
  let world = null;
  let toastTimer = 0;
  let ro = null;

  const AURA = {
    miss_seat: "Aura: Three balls. Plate danced away.",
    dunk: "Aura: Soaked. Next seat cheats different.",
    playful: "Aura: Splash! Keep it cute — seats climb.",
    deep: (n) => `Aura: Dunks ${n}. Crown is dripping for you.`,
    leave: "Aura: Walking off mid-seat? Tank keeps the splash.",
    shallow: "Aura: Dry as a ticket stub. Plate still swinging.",
    souvenir: "Aura: Fever Dunk Opera soaked. Souvenir — crown still dripping, still cute.",
  };

  const AUTHORED = [
    {
      id: 1, name: "Soft Splash Seat", title: "Soft Splash Seat", kind: "swaySoft",
      plateScale: 1.0, swing: "slow", swingSpeed: 0.32, hitR: 50, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: false, fakeSplash: false, dualPlate: false, armThenDunk: false, shield: false, invertLob: false,
      barker: "Soft Splash. Slow sway. Big plate. Lead the ghost. Three balls. Keep it cute.",
    },
    {
      id: 2, name: "Side-Sway Seat", title: "Side-Sway Seat", kind: "sideSway",
      plateScale: 1.0, swing: "+", swingSpeed: 0.48, hitR: 40, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: true, fakeSplash: false, dualPlate: false, armThenDunk: false, shield: false, invertLob: false,
      barker: "Plate rides a RAIL left-right — not a pendulum hang. Throw the track.",
    },
    {
      id: 3, name: "Fake Splash", title: "Fake Splash", kind: "fakeSplash",
      plateScale: 1.0, swing: "+", swingSpeed: 0.5, hitR: 38, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: false, fakeSplash: true, dualPlate: false, armThenDunk: false, shield: false, invertLob: false,
      barker: "Near-miss plays a FAKE dunk. No depth. Real hit still needed.",
    },
    {
      id: 4, name: "Twin Plate", title: "Twin Plate", kind: "dualPlate",
      plateScale: 1.0, swing: "+", swingSpeed: 0.48, hitR: 32, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: false, fakeSplash: false, dualPlate: true, armThenDunk: false, shield: false, invertLob: false,
      barker: "TWO plates. Either dunks. The middle wall is dead bounce.",
    },
    {
      id: 5, name: "Double-Tap Plate", title: "Double-Tap Plate", kind: "armThenDunk",
      plateScale: 1.0, swing: "+", swingSpeed: 0.5, hitR: 34, ballsPerSeat: 4,
      sideSway: false, fakeSplash: false, dualPlate: false, armThenDunk: true, shield: false, invertLob: false,
      barker: "First hit ARMS the plate. Second dunks. Four balls this seat.",
    },
    {
      id: 6, name: "Shield Barker", title: "Shield Barker", kind: "shield",
      plateScale: 1.0, swing: "+", swingSpeed: 0.52, hitR: 34, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: false, fakeSplash: false, dualPlate: false, armThenDunk: false, shield: true, invertLob: false,
      barker: "A paddle SHIELDS the plate. Telegraph, then throw the open window.",
    },
    {
      id: 7, name: "Reverse Lob", title: "Reverse Lob", kind: "invertLob",
      plateScale: 1.0, swing: "slow", swingSpeed: 0.45, hitR: 36, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: false, fakeSplash: false, dualPlate: false, armThenDunk: false, shield: false, invertLob: true,
      barker: "REVERSE — a short pull throws LONG. Remap the lob. Keep it cute.",
    },
    {
      id: 8, name: "Fever Dunk Opera", title: "Fever Dunk Opera", kind: "comboFinale",
      plateScale: 1.0, swing: "++", swingSpeed: 0.6, hitR: 32, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: true, fakeSplash: true, dualPlate: false, armThenDunk: false, shield: true, invertLob: false,
      auraSeat: true,
      barker: "Finale: Aura takes the plank. Rail + shield + fake splash. Soak the crown.",
    },
  ];

  const P0_MOUNT = {
    engine: "SlingAim",
    displayName: "Dunk the Barker",
    depthUnit: "Dunks",
    sheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
    authoredSheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
    codaSheet: "GOBLIN_BATCH04_MOUNT_CONFIGS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored SEATS then ENDLESS · dunk is a checkpoint · layout cheats, not smaller plates",
    body: "Authored seats, not a smaller-plate loop: Soft Splash → Side-Sway rail → Fake Splash (near-miss lie) → Twin Plate → Double-Tap (arm then dunk, 4 balls) → Shield Barker → Reverse Lob → Fever Dunk Opera → ENDLESS Nastier Seat. Hit = dunk, depth++, next seat. Miss the seat and the tank stamps DRY. Keep it cute — never mean.",
    status: "Depth run · START · 1 demo coin · 8 authored SEATS then ENDLESS",
    machine: "Dunk tent · 1 demo coin · authored SEATS",
    punch: "Depth run — press START. Soak the crown.",
  };

  function rk() {
    return PF.runKit || null;
  }

  function el(id) {
    return $(id);
  }

  function setText(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }

  function dunkCoda(n) {
    const t = Math.max(1, (n | 0) - AUTHORED_COUNT);
    return {
      id: n,
      name: `Nastier Seat ${n}`,
      title: `Nastier Seat ${n}`,
      kind: "coda",
      plateScale: Math.max(0.45, 0.9 - 0.04 * t),
      swing: "+++",
      swingSpeed: Math.min(1.8, 0.7 + 0.1 * t),
      hitR: Math.max(14, 30 - t),
      ballsPerSeat: BALLS_PER_SEAT,
      sideSway: true,
      fakeSplash: t % 2 === 0,
      dualPlate: t % 3 === 0,
      armThenDunk: false,
      shield: true,
      invertLob: t % 4 === 0,
      hitch: t % 2 === 1,
      hitchDwell: 0.42,
      bob: 8 + Math.min(12, t * 2),
      figure8: true,
      wind: true,
      coda: true,
      auraSeat: t % 2 === 0,
      barker: `ENDLESS Nastier Seat ${n} — still cute. Plate fibs more. Three balls.`,
    };
  }

  function dunkStageParams(n) {
    const seat = Math.max(1, n | 0);
    if (seat <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[seat - 1]);
    if (!CODA_ENABLED) return null;
    return dunkCoda(seat);
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun || typeof kitRun.declare !== "function") return;
    try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: dunkStageParams,
      codaParams: dunkCoda,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function card() {
    return el("dunkCard");
  }

  function cabinetOn() {
    const node = document.getElementById("cabinet-dunk-tank");
    return !!(node && !node.hidden);
  }

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function liveSpec() {
    if (run && run.spec) return run.spec;
    return dunkStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function stageEl() {
    return card();
  }

  function setHowTo(spec) {
    const ol = el("dunkHowTo");
    const hint = el("dunkPlayHint");
    const lines = [
      "<li><b>DRAG</b> on the tent to aim</li>",
      "<li><b>PULL</b> farther = more power</li>",
      "<li><b>RELEASE</b> to throw the softball</li>",
      "<li>Hit the glowing <b>RED HIT</b> plate</li>",
      "<li>Three balls a seat · the pale plate is a <b>LIE</b></li>",
    ];
    if (spec && spec.invertLob) lines[1] = "<li><b>REVERSE</b> — a short pull flies FAR</li>";
    if (spec && spec.shield) lines[3] = "<li>Wait for the <b>OPEN</b> — shield paddle eats hits</li>";
    if (spec && spec.dualPlate) lines[3] = "<li>Hit <b>EITHER</b> red HIT · the middle post is dead</li>";
    if (spec && spec.armThenDunk) lines[3] = "<li>First hit <b>ARMS</b> · second dunks</li>";
    if (spec && spec.fakeSplash) lines[4] = "<li>Pale <b>LIE</b> plate + fake splash · soak the real HIT</li>";
    if (spec && spec.sideSway) lines[3] = "<li>Plate rides a <b>RAIL</b> — throw the track, not the ghost</li>";
    if (ol) ol.innerHTML = lines.join("");
    if (hint) {
      if (!isLive()) hint.textContent = "TAP START · DRAG to throw · 3 balls · RED HIT is real";
      else if (spec && spec.invertLob) hint.textContent = "REVERSE LOB · short pull = long throw · hit the RED PLATE";
      else if (spec && spec.shield) hint.textContent = "DRAG · RELEASE · throw when the SHIELD opens";
      else if (spec && spec.fakeSplash) hint.textContent = "Pale plate is a LIE · throw the glowing RED HIT";
      else hint.textContent = "DRAG to throw · 3 balls · RED HIT is real · the trail fibs";
    }
  }

  function cheatLabel(spec) {
    if (!spec) return "";
    if (spec.kind === "coda") return "ENDLESS · NASTIER SEAT";
    if (spec.kind === "comboFinale") return "AURA ON THE PLANK · RAIL + SHIELD + FAKE";
    if (spec.kind === "invertLob" || spec.invertLob) return "REVERSE — SHORT PULL = LONG";
    if (spec.kind === "shield" || spec.shield) return "SHIELD PADDLE — THROW THE OPEN";
    if (spec.kind === "armThenDunk" || spec.armThenDunk) return "ARM THEN DUNK — TWO HITS";
    if (spec.kind === "dualPlate" || spec.dualPlate) return "TWIN PLATES — MIDDLE IS DEAD";
    if (spec.kind === "fakeSplash" || spec.fakeSplash) return "PALE PLATE IS A LIE — THROW THE RED HIT";
    if (spec.kind === "sideSway" || spec.sideSway) return "RAIL SWAY — THROW THE TRACK, NOT THE GHOST";
    return "RED HIT IS REAL — THE TRAIL IS A FIB";
  }

  function hudLine(spec, playing) {
    if (!spec) return "SEAT 0";
    const name = spec.name || spec.title || "Seat";
    if (spec.coda) return `ENDLESS · SEAT ${playing} · ${name}`;
    return `SEAT ${playing} · ${name}`;
  }

  function worldR(spec) {
    return Math.max(0.14, (spec && spec.hitR ? spec.hitR : 36) * 0.0092) * (spec && spec.plateScale ? spec.plateScale : 1);
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

  function makeMat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color,
      roughness: 0.72,
      metalness: 0.08,
    }, extra || {}));
  }

  function meshBox(mat, w, h, d, x, y, z) {
    const m = new THREE.Mesh(geoBox, mat);
    m.scale.set(w, h, d);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function meshSphere(mat, r, x, y, z) {
    const m = new THREE.Mesh(geoSphere, mat);
    m.scale.setScalar(r);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function meshCyl(mat, rTop, rBot, h, x, y, z) {
    const m = new THREE.Mesh(
      rTop === rBot ? geoCyl : new THREE.CylinderGeometry(rTop, rBot, h, 12),
      mat
    );
    if (rTop === rBot) m.scale.set(rTop, h, rTop);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function makePerson(opts) {
    const g = new THREE.Group();
    const chibi = !!opts.chibi;
    const skin = makeMat(opts.skin || SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const cloth = makeMat(opts.cloth || 0x3a3040);
    const dark = makeMat(opts.shoes || 0x1a1a1a);
    g.scale.setScalar(opts.scale || 1);

    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(meshCyl(cloth, chibi ? 0.12 : 0.13, chibi ? 0.15 : 0.16, 0.28, 0, 0.28, 0));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(chibi ? 0.26 : 0.22, 0.12, chibi ? 0.36 : 0.32, 12), cloth);
    skirt.position.y = 0.06;
    hip.add(skirt);

    const head = new THREE.Group();
    head.position.y = chibi ? 0.64 : 0.58;
    hip.add(head);
    head.add(meshSphere(skin, chibi ? 0.22 : 0.175, 0, 0.02, 0));
    const eyeW = makeMat(0xf7f2ea);
    const eyeD = makeMat(0x2a1810);
    [-1, 1].forEach((side) => {
      const white = meshSphere(eyeW, 0.038, side * (chibi ? 0.07 : 0.055), 0.03, chibi ? 0.19 : 0.15);
      white.scale.set(chibi ? 0.05 : 0.038, chibi ? 0.058 : 0.044, 0.02);
      head.add(white);
      head.add(meshSphere(eyeD, chibi ? 0.026 : 0.02, side * (chibi ? 0.07 : 0.055), 0.03, chibi ? 0.21 : 0.168));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), makeMat(0xc45a6a));
    smile.position.set(0, -0.05, chibi ? 0.2 : 0.16);
    smile.rotation.x = 2.6;
    head.add(smile);

    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0.0, 0);
      const len = arm ? 0.28 : 0.34;
      const rad = arm ? 0.035 : 0.042;
      pivot.add(meshCyl(arm ? skin : cloth, rad, rad, len, 0, -len / 2, 0));
      if (!arm) pivot.add(meshBox(dark, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03));
      else pivot.add(meshSphere(skin, 0.04, 0, -len, 0));
      hip.add(pivot);
      return pivot;
    }

    const armL = limb(-1, true);
    const armR = limb(1, true);
    const legL = limb(-1, false);
    const legR = limb(1, false);
    g.userData = { kind: opts.kind || "guest", t: Math.random() * 10, armL, armR, legL, legR, head, hip, wave: false };
    return g;
  }

  function dressAura(g) {
    const hip = g.userData.hip;
    const head = g.userData.head;
    const blouse = makeMat(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.2 });
    const dress = makeMat(DRESS, { emissive: 0x0a2010, emissiveIntensity: 0.25 });
    hip.children[0].material = blouse;
    hip.children[1].material = dress;
    const heart = meshBox(makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.55, roughness: 0.4 }), 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    heart.rotation.z = Math.PI / 4;
    hip.add(heart);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 16), blouse);
    collar.position.y = 0.44;
    collar.rotation.x = Math.PI / 2;
    hip.add(collar);

    const hairM = makeMat(HAIR, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });
    head.add(meshSphere(hairM, 0.23, 0, 0.06, -0.02));
    [-1, 1].forEach((side) => {
      head.add(meshSphere(hairM, 0.11, side * 0.2, -0.04, 0.04));
      head.add(meshSphere(makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.6 }), 0.045, side * 0.2, 0.06, 0.06));
    });
    head.add(meshBox(hairM, 0.28, 0.07, 0.1, 0, 0.14, 0.16));

    const crown = new THREE.Group();
    crown.position.y = 0.24;
    head.add(crown);
    const gold = makeMat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold));
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      const spike = new THREE.Mesh(geoCone, gold);
      spike.scale.set(0.035, h, 0.035);
      spike.position.set(x, h * 0.45, 0);
      crown.add(spike);
    });
    const gem = meshBox(makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.7 }), 0.055, 0.055, 0.025, 0, 0.02, 0.11);
    gem.rotation.z = Math.PI / 4;
    crown.add(gem);
    g.userData.kind = "aura";
    g.userData.crown = crown;
  }

  function dressBarker(g) {
    const stripe = canvasTex(64, 64, (ctx) => {
      ctx.fillStyle = "#f3e6d0";
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = "#c41e3a";
      for (let i = 0; i < 8; i += 1) ctx.fillRect(i * 8, 0, 4, 64);
    }, 2, 1);
    const jacket = new THREE.MeshStandardMaterial({
      map: stripe, roughness: 0.55, metalness: 0.04, emissive: 0x2a080c, emissiveIntensity: 0.12,
    });
    g.userData.hip.children[0].material = jacket;
    g.userData.hip.children[1].material = makeMat(0x2a3048);
    const hat = new THREE.Group();
    hat.add(meshCyl(makeMat(0xc4a05a, { roughness: 0.85 }), 0.2, 0.2, 0.03, 0, 0.18, 0));
    hat.add(meshCyl(makeMat(0x3a2418), 0.11, 0.13, 0.1, 0, 0.24, 0));
    g.userData.head.add(hat);
    g.userData.kind = "barker";
  }

  function poseSit(p) {
    if (!p || !p.userData) return;
    p.userData.legL.rotation.x = 1.18;
    p.userData.legR.rotation.x = 1.26;
    p.userData.armL.rotation.z = 0.55;
    p.userData.armR.rotation.z = -0.72;
    p.userData.armR.rotation.x = -0.35;
    p.userData.sitting = true;
  }

  function poseStand(p) {
    if (!p || !p.userData) return;
    p.userData.legL.rotation.x = 0;
    p.userData.legR.rotation.x = 0;
    p.userData.armL.rotation.z = 0.18;
    p.userData.armR.rotation.z = -0.18;
    p.userData.armL.rotation.x = 0;
    p.userData.armR.rotation.x = 0;
    p.userData.sitting = false;
  }

  function animatePerson(p, t, dunkFall) {
    if (!p || !p.userData) return;
    const u = p.userData;
    u.t += 0.016;
    if (dunkFall) return;
    if (u.sitting) {
      u.armR.rotation.z = -0.55 + Math.sin(t * 0.003 + u.t) * 0.25;
      u.head.rotation.y = Math.sin(t * 0.0018) * 0.18;
      u.hip.position.y = 0.42 + Math.sin(t * 0.0022) * 0.012;
    } else {
      u.armR.rotation.z = -0.2 + Math.sin(t * 0.005 + u.t) * 0.55;
      u.armL.rotation.z = 0.15 + Math.cos(t * 0.004) * 0.12;
      u.head.rotation.y = Math.sin(t * 0.0015) * 0.22;
    }
  }

  function starTex() {
    return canvasTex(512, 512, (ctx) => {
      ctx.fillStyle = "#071018";
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 220; i += 1) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const s = Math.random() * 1.6 + 0.3;
        ctx.fillStyle = `rgba(255,246,236,${0.25 + Math.random() * 0.7})`;
        ctx.fillRect(x, y, s, s);
      }
      const g = ctx.createRadialGradient(256, 420, 10, 256, 420, 220);
      g.addColorStop(0, "rgba(58,106,170,0.35)");
      g.addColorStop(1, "rgba(7,16,24,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
    });
  }

  function woodTex() {
    return canvasTex(128, 128, (ctx) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 12; i += 1) {
        ctx.fillStyle = i % 2 ? "rgba(90,58,32,0.35)" : "rgba(26,16,12,0.28)";
        ctx.fillRect(i * 11, 0, 9, 128);
      }
      ctx.fillStyle = "rgba(212,164,90,0.08)";
      for (let i = 0; i < 8; i += 1) ctx.fillRect(0, i * 16, 128, 1);
    }, 3, 2);
  }

  function tentTex() {
    return canvasTex(128, 128, (ctx) => {
      ctx.fillStyle = "#5a1830";
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = "#f0d09a";
      for (let i = 0; i < 8; i += 1) ctx.fillRect(i * 16, 0, 8, 128);
    }, 4, 1);
  }

  function signTex() {
    return canvasTex(512, 256, (ctx) => {
      ctx.fillStyle = "#1b3a28";
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 10;
      ctx.strokeRect(12, 12, 488, 232);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "700 52px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("SOAK THE CROWN", 256, 118);
      ctx.fillStyle = "#b8e8e0";
      ctx.font = "28px Georgia, serif";
      ctx.fillText("3 BALLS  ·  1 COIN  ·  KEEP IT CUTE", 256, 178);
    });
  }

  function hitchPhase(t, spec) {
    const w = 0.00105 * (spec.swingSpeed || 0.5) * Math.PI * 2;
    const raw = t * w;
    if (!spec.hitch) return raw;
    const seg = Math.PI;
    const i = Math.floor(raw / seg);
    const f = raw / seg - i;
    const dwell = spec.hitchDwell != null ? spec.hitchDwell : 0.46;
    const lo = 0.5 - dwell / 2;
    const hi = 0.5 + dwell / 2;
    let ff;
    if (f <= lo) ff = (f / lo) * lo;
    else if (f >= hi) ff = hi + ((f - hi) / Math.max(0.0001, 1 - hi)) * (1 - hi);
    else ff = 0.5 - 0.03 + ((f - lo) / dwell) * 0.06;
    return (i + ff) * seg;
  }

  function railSwing(t, spec) {
    const period = 1800 / Math.max(0.35, spec.swingSpeed || 0.5);
    const u = (t % (period * 2)) / period;
    return u < 1 ? u * 2 - 1 : 3 - u * 2;
  }

  function shieldCovering(spec, t) {
    if (!spec || !spec.shield) return false;
    return Math.sin(t * 0.00235) > 0.38;
  }

  function platesOf(spec, t) {
    const r = worldR(spec);
    const amp = 0.64 + (1 - (spec.plateScale || 1)) * 0.2;
    const y0 = 1.96;
    const z0 = 1.38;
    if (spec && (spec.dualPlate || spec.kind === "dualPlate")) {
      const phase = hitchPhase(t, spec);
      return [
        { x: -0.92 + Math.sin(phase) * 0.14, y: y0, z: z0, r, side: "L", covering: false },
        { x: 0.92 + Math.sin(phase + Math.PI) * 0.14, y: y0, z: z0, r, side: "R", covering: false },
      ];
    }
    let x;
    let y = y0;
    let z = z0;
    const covering = shieldCovering(spec, t);
    if (spec.sideSway || spec.kind === "sideSway" || spec.kind === "comboFinale") {
      x = railSwing(t, spec) * amp * 1.18;
      y = 1.9;
    } else {
      const phase = hitchPhase(t, spec);
      x = Math.sin(phase) * amp;
      if (spec.bob) y += Math.sin(phase * 1.7) * spec.bob * 0.012;
      if (spec.figure8) {
        y += Math.sin(phase * 2) * 0.12;
        z += Math.sin(phase * 2) * 0.22;
      }
    }
    if (spec.wind) z += Math.sin(t * 0.0018) * 0.08;
    return [{ x, y, z, r, covering, side: "C" }];
  }

  function liePos(spec, t, lagMs) {
    const lagged = platesOf(spec, Math.max(0, t - lagMs));
    return lagged[0] || null;
  }

  function throwVelocity(power, yaw, pitchTrim, spec, t) {
    let p = spec && spec.invertLob ? 1 - kit.clamp(power, 0, 1) : kit.clamp(power, 0, 1);
    p = kit.clamp(p, 0.08, 1);
    const speed = 10.4 + p * 5.2;
    const origin = TEE;
    const nowT = t != null ? t : 0;
    const leadMs = spec && spec.sideSway ? 280 : 320;
    const leadBlend = spec && spec.coda ? 0.28 : (spec && spec.kind === "comboFinale" ? 0.32 : 0.45);
    const now = (platesOf(spec || {}, nowT)[0]) || { x: 0, y: 1.96, z: 1.38 };
    const lead = (platesOf(spec || {}, nowT + leadMs)[0]) || now;
    const tx = now.x * (1 - leadBlend) + lead.x * leadBlend;
    const ty = now.y * (1 - leadBlend) + lead.y * leadBlend;
    const tz = now.z * (1 - leadBlend) + lead.z * leadBlend;
    const dx = tx - origin.x;
    const dy = ty - origin.y;
    const dz = tz - origin.z;
    const distXZ = Math.max(0.4, Math.hypot(dx, dz));
    const refSpeed = 12.6;
    const k = (GRAVITY * distXZ * distXZ) / (2 * refSpeed * refSpeed);
    const a = k;
    const b = -distXZ;
    const c = dy + k;
    const disc = b * b - 4 * a * c;
    let pitch;
    if (a < 1e-6 || disc < 0) pitch = 0.4;
    else pitch = Math.atan((-b - Math.sqrt(disc)) / (2 * a));
    pitch = kit.clamp(pitch + pitchTrim, 0.12, 0.95);
    const aimYaw = Math.atan2(dx, dz) + yaw;
    return {
      vx: Math.sin(aimYaw) * speed * Math.cos(pitch),
      vy: speed * Math.sin(pitch),
      vz: Math.cos(aimYaw) * speed * Math.cos(pitch),
      power: p,
      speed,
      pitch,
      yaw: aimYaw,
    };
  }

  function predictArc(vel, n) {
    const pts = [];
    let x = TEE.x;
    let y = TEE.y;
    let z = TEE.z;
    let vx = vel.vx;
    let vy = vel.vy;
    let vz = vel.vz;
    const dt = 0.045;
    for (let i = 0; i < (n || 18); i += 1) {
      vy -= GRAVITY * dt;
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      pts.push({ x, y, z });
      if (y < 0.05 || z > 4.2) break;
    }
    return pts;
  }

  function bootWorld() {
    if (world) return world;
    const canvas = el("dunkCanvas");
    if (!canvas) return null;
    let gl = true;
    try {
      const probe = document.createElement("canvas");
      gl = !!(probe.getContext("webgl2") || probe.getContext("webgl"));
    } catch (_) { gl = false; }
    if (!gl) {
      setText("dunkStatus", "This dunk tent needs WebGL.");
      return null;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: (window.devicePixelRatio || 1) < 1.6,
      powerPreference: "high-performance",
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.42;
    renderer.setClearColor(0x071018, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1520, 0.018);
    const camera = new THREE.PerspectiveCamera(56, 1, 0.08, 80);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    camera.position.set(0, 2.15, -8.45);

    scene.add(new THREE.AmbientLight(0x6a5040, 1.05));
    scene.add(new THREE.HemisphereLight(0x8aa4cc, 0x2a1810, 0.95));
    const moon = new THREE.DirectionalLight(0xc0d4ff, 0.55);
    moon.position.set(-6, 10, -4);
    scene.add(moon);
    const key = new THREE.DirectionalLight(0xffd0a0, 1.15);
    key.position.set(2.4, 5.2, -4.2);
    scene.add(key);
    const spot = new THREE.SpotLight(0xffe2a8, 7.4, 22, 0.62, 0.4, 1.05);
    spot.position.set(0.4, 5.6, -2.4);
    spot.target.position.set(0, 1.35, 1.7);
    scene.add(spot);
    scene.add(spot.target);
    const tankGlow = new THREE.PointLight(0x5ec4c0, 3.6, 9, 1.35);
    tankGlow.position.set(0, 1.55, 1.55);
    scene.add(tankGlow);
    const plateLight = new THREE.PointLight(0xff6a4a, 2.8, 6.5, 1.5);
    plateLight.position.set(0, 2.2, 1.05);
    scene.add(plateLight);
    const fill = new THREE.PointLight(0xffc090, 2.6, 11, 1.4);
    fill.position.set(0, 2.2, -2.2);
    scene.add(fill);

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(42, 24, 16),
      new THREE.MeshBasicMaterial({ map: starTex(), side: THREE.BackSide })
    );
    scene.add(sky);

    const wood = woodTex();
    const woodMat = new THREE.MeshStandardMaterial({
      map: wood, roughness: 0.82, metalness: 0.04, color: 0xffffff,
    });
    const darkWood = makeMat(WOOD_DARK, { roughness: 0.88 });
    const brassMat = makeMat(BRASS, { metalness: 0.55, roughness: 0.35, emissive: 0x4a3010, emissiveIntensity: 0.18 });

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 28),
      new THREE.MeshStandardMaterial({ color: 0x2a1c14, roughness: 0.95, map: wood })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const lane = meshBox(woodMat, 2.2, 0.06, 8.4, 0, 0.04, -1.6);
    scene.add(lane);

    const tentMat = new THREE.MeshStandardMaterial({
      map: tentTex(), roughness: 0.78, metalness: 0.02, side: THREE.DoubleSide,
    });
    const tent = new THREE.Group();
    const wallL = new THREE.Mesh(new THREE.PlaneGeometry(14, 6.2), tentMat);
    wallL.position.set(-4.6, 3.1, 0.4);
    wallL.rotation.y = Math.PI / 2;
    tent.add(wallL);
    const wallR = wallL.clone();
    wallR.position.x = 4.6;
    wallR.rotation.y = -Math.PI / 2;
    tent.add(wallR);
    const wallB = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 6.2), tentMat);
    wallB.position.set(0, 3.1, 4.6);
    tent.add(wallB);
    const valance = meshBox(makeMat(CARNIVAL_RED, { roughness: 0.7 }), 9.4, 0.55, 0.18, 0, 5.9, -3.4);
    tent.add(valance);
    [-4.2, -1.4, 1.4, 4.2].forEach((x) => {
      tent.add(meshCyl(darkWood, 0.08, 0.09, 6.2, x, 3.1, -3.5));
    });
    scene.add(tent);

    const bulbs = [];
    for (let i = 0; i < 14; i += 1) {
      const u = i / 13;
      const x = (u - 0.5) * 8.2;
      const y = 5.15 - Math.abs(u - 0.5) * 0.55;
      const bulb = meshSphere(new THREE.MeshBasicMaterial({ color: 0xffe2a0 }), 0.07, x, y, -3.15);
      tent.add(bulb);
      bulbs.push(bulb);
    }
    const stringLight = new THREE.PointLight(0xffd090, 1.8, 10, 1.8);
    stringLight.position.set(0, 4.8, -2.2);
    scene.add(stringLight);

    const tank = new THREE.Group();
    tank.position.set(0, 0, 2.12);
    tank.add(meshBox(darkWood, 2.5, 0.1, 1.5, 0, 0.06, 0));
    tank.add(meshBox(woodMat, 2.55, 0.52, 0.12, 0, 0.36, -0.72));
    tank.add(meshBox(woodMat, 2.55, 1.08, 0.12, 0, 0.58, 0.72));
    tank.add(meshBox(woodMat, 0.12, 1.08, 1.52, -1.22, 0.58, 0));
    tank.add(meshBox(woodMat, 0.12, 1.08, 1.52, 1.22, 0.58, 0));
    tank.add(meshBox(brassMat, 2.58, 0.06, 1.58, 0, 0.9, 0));
    [-1, 1].forEach((s) => {
      tank.add(meshCyl(brassMat, 0.05, 0.05, 1.05, s * 1.24, 0.58, 0.7));
      tank.add(meshCyl(brassMat, 0.05, 0.05, 1.05, s * 1.24, 0.58, -0.68));
    });
    scene.add(tank);

    const waterUniforms = {
      uTime: { value: 0 },
      uSplash: { value: 0 },
    };
    const waterMat = new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: [
        "uniform float uTime;",
        "uniform float uSplash;",
        "varying vec2 vUv;",
        "void main(){",
        "  vUv = uv;",
        "  vec3 p = position;",
        "  float r = length(p.xy);",
        "  p.z += sin(p.x * 9.0 + uTime * 2.6) * 0.018;",
        "  p.z += sin(p.y * 7.0 - uTime * 2.1) * 0.014;",
        "  p.z += uSplash * sin(r * 14.0 - uTime * 9.0) * 0.07;",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);",
        "}",
      ].join("\n"),
      fragmentShader: [
        "varying vec2 vUv;",
        "uniform float uTime;",
        "uniform float uSplash;",
        "void main(){",
        "  vec3 deep = vec3(0.07, 0.26, 0.34);",
        "  vec3 lite = vec3(0.42, 0.78, 0.74);",
        "  float w = 0.5 + 0.5 * sin(vUv.x * 16.0 + uTime * 1.8);",
        "  vec3 col = mix(deep, lite, w);",
        "  col += vec3(0.15, 0.22, 0.2) * uSplash;",
        "  float rim = smoothstep(0.02, 0.18, vUv.y) * smoothstep(0.98, 0.82, vUv.y);",
        "  gl_FragColor = vec4(col, 0.78 * rim + 0.55);",
        "}",
      ].join("\n"),
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(2.28, 1.32, 24, 16), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.72, 2.12);
    scene.add(water);

    const ladder = new THREE.Group();
    ladder.position.set(1.55, 0, 2.55);
    ladder.add(meshBox(woodMat, 0.08, 1.7, 0.08, -0.22, 0.85, 0));
    ladder.add(meshBox(woodMat, 0.08, 1.7, 0.08, 0.22, 0.85, 0));
    for (let i = 0; i < 5; i += 1) ladder.add(meshBox(woodMat, 0.5, 0.05, 0.08, 0, 0.28 + i * 0.28, 0));
    scene.add(ladder);

    const seatPivot = new THREE.Group();
    seatPivot.position.set(0, 1.28, 2.48);
    const plank = meshBox(woodMat, 0.78, 0.08, 0.9, 0, 0.0, -0.42);
    seatPivot.add(plank);
    const occupant = new THREE.Group();
    occupant.position.set(0, 0.04, -0.55);
    occupant.rotation.y = Math.PI;
    seatPivot.add(occupant);
    scene.add(seatPivot);

    const barker = makePerson({ cloth: CARNIVAL_RED, scale: 1.22, kind: "barker" });
    dressBarker(barker);
    poseSit(barker);
    occupant.add(barker);

    const aura = makePerson({ cloth: DRESS, scale: 1.02, chibi: true, kind: "aura" });
    dressAura(aura);
    poseStand(aura);
    aura.position.set(-2.25, 0, 0.35);
    aura.rotation.y = Math.PI * 0.55;
    scene.add(aura);

    const till = meshBox(woodMat, 0.7, 0.7, 0.7, -2.25, 0.35, 0.85);
    scene.add(till);

    const frame = new THREE.Group();
    frame.add(meshBox(woodMat, 0.1, 2.6, 0.1, -1.55, 1.4, 1.38));
    frame.add(meshBox(woodMat, 0.1, 2.6, 0.1, 1.55, 1.4, 1.38));
    frame.add(meshBox(woodMat, 3.2, 0.1, 0.1, 0, 2.68, 1.38));
    scene.add(frame);

    const rail = meshBox(brassMat, 3.1, 0.06, 0.06, 0, 1.9, 1.38);
    rail.visible = false;
    scene.add(rail);

    const deadWall = meshBox(makeMat(CARNIVAL_RED, { roughness: 0.55 }), 0.16, 1.55, 0.16, 0, 1.55, 1.38);
    deadWall.visible = false;
    scene.add(deadWall);

    const plateMat = makeMat(CARNIVAL_RED, { metalness: 0.2, roughness: 0.38, emissive: 0xc41e3a, emissiveIntensity: 0.55 });
    const plateCore = makeMat(GOLD, { metalness: 0.5, roughness: 0.32, emissive: 0x6a4808, emissiveIntensity: 0.25 });
    const hitMap = canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#c41e3a";
      ctx.beginPath();
      ctx.arc(128, 128, 124, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f0d09a";
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.fillStyle = "#fff6ec";
      ctx.font = "bold 86px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("HIT", 128, 136);
    });
    function makePlate() {
      const g = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.08, 28), plateMat.clone());
      disc.rotation.x = Math.PI / 2;
      g.add(disc);
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 20), plateCore.clone());
      core.rotation.x = Math.PI / 2;
      g.add(core);
      const face = new THREE.Mesh(
        new THREE.CircleGeometry(0.92, 28),
        new THREE.MeshBasicMaterial({ map: hitMap, side: THREE.DoubleSide })
      );
      face.position.z = -0.055;
      g.add(face);
      const cord = meshCyl(makeMat(BRASS, { metalness: 0.4 }), 0.012, 0.012, 0.9, 0, 0.55, 0);
      g.add(cord);
      g.userData = { disc, core, cord, face };
      return g;
    }
    const plateA = makePlate();
    const plateB = makePlate();
    plateB.visible = false;
    scene.add(plateA);
    scene.add(plateB);

    const shield = new THREE.Group();
    shield.add(meshBox(makeMat(0xe8a0b8, { roughness: 0.5, emissive: 0x5a2030, emissiveIntensity: 0.2 }), 0.18, 0.55, 0.08, 0, 0, -0.22));
    shield.visible = false;
    scene.add(shield);

    const ballMesh = meshSphere(makeMat(CARNIVAL_RED, {
      roughness: 0.45, metalness: 0.12, emissive: 0x3a080c, emissiveIntensity: 0.2,
    }), BALL_R, TEE.x, TEE.y, TEE.z);
    const stitch = meshSphere(new THREE.MeshBasicMaterial({ color: 0xfff6ec }), 0.025, TEE.x - 0.03, TEE.y + 0.04, TEE.z + 0.04);
    scene.add(ballMesh);
    scene.add(stitch);

    const trail = [];
    for (let i = 0; i < 10; i += 1) {
      const ghost = meshSphere(new THREE.MeshBasicMaterial({
        color: 0xc41e3a, transparent: true, opacity: 0.28,
      }), BALL_R * (0.7 - i * 0.04), 0, -8, 0);
      ghost.visible = false;
      scene.add(ghost);
      trail.push(ghost);
    }

    const arcDots = [];
    for (let i = 0; i < 16; i += 1) {
      const d = meshSphere(new THREE.MeshBasicMaterial({
        color: 0xb8e8e0, transparent: true, opacity: 0.55,
      }), 0.035, 0, -8, 0);
      d.visible = false;
      scene.add(d);
      arcDots.push(d);
    }

    const droplets = [];
    for (let i = 0; i < 86; i += 1) {
      const foam = i % 5 === 0;
      const drop = meshSphere(new THREE.MeshBasicMaterial({
        color: foam ? 0xfff6ec : 0xb8e8e0, transparent: true, opacity: 0.9,
      }), (foam ? 0.07 : 0.035) + Math.random() * 0.06, 0, -10, 0);
      drop.visible = false;
      drop.userData = { vx: 0, vy: 0, vz: 0, life: 0, foam };
      scene.add(drop);
      droplets.push(drop);
    }

    const columns = [];
    for (let i = 0; i < 4; i += 1) {
      const col = meshSphere(new THREE.MeshBasicMaterial({
        color: 0xd8fff8, transparent: true, opacity: 0,
      }), 0.18, 0, -10, 0);
      col.scale.set(0.45, 1.4, 0.45);
      col.visible = false;
      col.userData = { life: 0 };
      scene.add(col);
      columns.push(col);
    }

    const ripples = [];
    for (let i = 0; i < 6; i += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.022, 6, 28),
        new THREE.MeshBasicMaterial({ color: 0xb8e8e0, transparent: true, opacity: 0.0 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.74, 2.12);
      ring.visible = false;
      scene.add(ring);
      ripples.push(ring);
    }

    const duck = new THREE.Group();
    duck.add(meshSphere(makeMat(0xf0d09a), 0.09, 0, 0, 0));
    duck.add(meshSphere(makeMat(0xf0d09a), 0.055, 0.08, 0.04, 0.04));
    duck.add(meshBox(makeMat(0xc45a3a), 0.07, 0.025, 0.04, 0.13, 0.03, 0.05));
    duck.position.set(-0.7, 0.8, 2.25);
    scene.add(duck);

    const sign = new THREE.Mesh(geoBox, new THREE.MeshBasicMaterial({ map: signTex() }));
    sign.scale.set(2.6, 1.15, 0.06);
    sign.position.set(0, 3.55, 3.55);
    scene.add(sign);
    const signCrown = new THREE.Group();
    signCrown.position.set(0, 4.28, 3.55);
    signCrown.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 16), makeMat(GOLD, {
      metalness: 0.7, roughness: 0.25, emissive: GOLD, emissiveIntensity: 0.45,
    })));
    const gem = meshBox(makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.8 }), 0.08, 0.08, 0.04, 0, 0.02, 0.12);
    gem.rotation.z = Math.PI / 4;
    signCrown.add(gem);
    scene.add(signCrown);

    const crate = meshBox(woodMat, 0.55, 0.4, 0.55, 1.85, 0.22, -4.6);
    scene.add(crate);
    for (let i = 0; i < 3; i += 1) {
      scene.add(meshSphere(makeMat(CARNIVAL_RED), 0.09, 1.7 + i * 0.12, 0.5, -4.55));
    }

    const streamers = [];
    [-3.6, 3.6].forEach((x) => {
      const s = meshBox(makeMat(0xb8e8e0, { transparent: true, opacity: 0.75 }), 0.05, 1.1, 0.01, x, 4.4, -2.8);
      scene.add(s);
      streamers.push(s);
    });

    const leadGhost = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.018, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0xf0d09a, transparent: true, opacity: 0.55 })
    );
    leadGhost.rotation.x = Math.PI / 2;
    leadGhost.visible = false;
    scene.add(leadGhost);

    const lieMap = canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#e8a0b8";
      ctx.beginPath();
      ctx.arc(128, 128, 124, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff6ec";
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#3a2418";
      ctx.font = "bold 84px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("LIE", 128, 136);
    });
    function makeLieDisc(opacity) {
      const g = new THREE.Group();
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(0.92, 24),
        new THREE.MeshBasicMaterial({
          map: lieMap, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false,
        })
      );
      disc.position.z = -0.04;
      g.add(disc);
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.92, 0.04, 6, 24),
        new THREE.MeshBasicMaterial({ color: 0xe8a0b8, transparent: true, opacity: opacity * 0.85 })
      );
      g.add(rim);
      g.userData = { disc, rim };
      g.visible = false;
      scene.add(g);
      return g;
    }
    const liePlate = makeLieDisc(0.78);
    const afterimages = [makeLieDisc(0.28), makeLieDisc(0.18), makeLieDisc(0.1)];

    world = {
      renderer, scene, camera, spot, plateLight, tankGlow, stringLight,
      water, waterUniforms, seatPivot, occupant, plank, barker, aura, till,
      rail, deadWall, plateA, plateB, shield, ballMesh, stitch, trail, arcDots,
      droplets, columns, ripples, duck, signCrown, streamers, leadGhost, bulbs, sky,
      liePlate, afterimages, baseFov: 52,
      lastW: 0, lastH: 0, ready: true, auraOnSeat: false, occupantKind: "barker",
    };
    resize();
    applySeatVisual(liveSpec(), 0);
    return world;
  }

  function resize() {
    if (!world) return;
    const stage = stageEl();
    const canvas = el("dunkCanvas");
    if (!stage || !canvas) return;
    const w = Math.max(16, stage.clientWidth || window.innerWidth || 320);
    const h = Math.max(16, stage.clientHeight || window.innerHeight || 420);
    if (w === world.lastW && h === world.lastH) return;
    world.lastW = w;
    world.lastH = h;
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function placeOccupant(spec) {
    if (!world) return;
    const wantAura = !!(spec && spec.auraSeat);
    if (wantAura === world.auraOnSeat) {
      if (wantAura) poseSit(world.aura);
      else poseSit(world.barker);
      return;
    }
    world.auraOnSeat = wantAura;
    world.occupant.attach(world.aura);
    world.occupant.attach(world.barker);
    if (wantAura) {
      world.scene.add(world.barker);
      world.barker.position.set(1.85, 0, 0.45);
      world.barker.rotation.y = Math.PI + 0.45;
      poseStand(world.barker);
      world.occupant.add(world.aura);
      world.aura.position.set(0, 0, 0);
      world.aura.rotation.y = 0;
      poseSit(world.aura);
      world.occupantKind = "aura";
    } else {
      world.scene.add(world.aura);
      world.aura.position.set(-2.25, 0, 0.35);
      world.aura.rotation.y = Math.PI * 0.55;
      poseStand(world.aura);
      world.occupant.add(world.barker);
      world.barker.position.set(0, 0, 0);
      world.barker.rotation.y = 0;
      poseSit(world.barker);
      world.occupantKind = "barker";
    }
  }

  function applySeatVisual(spec) {
    if (!world || !spec) return;
    world.rail.visible = !!(spec.sideSway || spec.kind === "sideSway" || spec.kind === "comboFinale");
    world.deadWall.visible = !!(spec.dualPlate || spec.kind === "dualPlate");
    world.shield.visible = !!spec.shield;
    world.plateB.visible = !!(spec.dualPlate || spec.kind === "dualPlate");
    world.plateA.userData.cord.visible = !world.rail.visible;
    world.plateB.userData.cord.visible = !world.rail.visible;
    placeOccupant(spec);
    const armed = !!(run && run.armed);
    [world.plateA, world.plateB].forEach((p) => {
      p.userData.disc.material.color.setHex(armed ? TEAL : CARNIVAL_RED);
      p.userData.disc.material.emissive.setHex(armed ? TEAL : CARNIVAL_RED);
      p.userData.disc.material.emissiveIntensity = armed ? 0.7 : 0.55;
      if (p.userData.face) p.userData.face.visible = !armed;
    });
  }

  function syncPlates(spec, t) {
    if (!world) return platesOf(spec, t);
    const plates = platesOf(spec, t);
    const nodes = [world.plateA, world.plateB];
    nodes.forEach((node, i) => {
      const p = plates[i];
      if (!p) {
        node.visible = false;
        return;
      }
      node.visible = true;
      const s = p.r;
      node.scale.set(s, s, s);
      node.position.set(p.x, p.y, p.z);
      node.userData.cord.scale.set(1 / s, 0.9 / s, 1 / s);
      node.userData.cord.position.y = 0.55;
    });
    if (spec.shield && plates[0]) {
      world.shield.visible = true;
      const a = t * 0.00235;
      const p = plates[0];
      world.shield.position.set(p.x, p.y, p.z);
      world.shield.rotation.y = a;
      world.shield.rotation.z = Math.sin(a) * 0.4;
      const covering = shieldCovering(spec, t);
      world.shield.children[0].material.opacity = 1;
      world.shield.children[0].material.color.setHex(covering ? 0xe8a0b8 : 0xf0d09a);
      world.shield.children[0].material.emissiveIntensity = covering ? 0.45 : 0.12;
    } else {
      world.shield.visible = false;
    }
    if (world.afterimages) {
      world.afterimages.forEach((ghost, i) => {
        const lag = liePos(spec, t, 120 + i * 130);
        if (!lag || spec.dualPlate) {
          ghost.visible = false;
          return;
        }
        ghost.visible = true;
        const s = lag.r * (0.92 - i * 0.08);
        ghost.scale.set(s, s, s);
        ghost.position.set(lag.x, lag.y, lag.z);
        ghost.userData.disc.material.opacity = 0.22 - i * 0.06;
      });
    }
    if (world.liePlate) {
      const fib = !!(spec.fakeSplash || spec.kind === "fakeSplash" || spec.kind === "comboFinale");
      const lag = fib ? liePos(spec, t, LIE_LAG_MS) : null;
      if (!lag || spec.dualPlate) {
        world.liePlate.visible = false;
      } else {
        world.liePlate.visible = true;
        const s = lag.r * 1.02;
        world.liePlate.scale.set(s, s, s);
        world.liePlate.position.set(lag.x, lag.y, lag.z + 0.02);
        world.liePlate.userData.disc.material.opacity = 0.72 + Math.sin(t * 0.008) * 0.1;
      }
    }
    return plates;
  }

  function burstSplash(heavy) {
    if (!world) return;
    const n = heavy ? world.droplets.length : 22;
    for (let i = 0; i < n; i += 1) {
      const d = world.droplets[i];
      d.visible = true;
      d.position.set((Math.random() - 0.5) * 1.15, 0.78, 2.05 + (Math.random() - 0.5) * 0.7);
      const towardCam = heavy && i % 3 === 0;
      d.userData.vx = (Math.random() - 0.5) * (heavy ? 3.4 : 1.5);
      d.userData.vy = (d.userData.foam ? 3.4 : 2.1) + Math.random() * (heavy ? 5.2 : 2.2);
      d.userData.vz = towardCam ? -2.2 - Math.random() * 2.4 : (Math.random() - 0.5) * 1.8;
      d.userData.life = (heavy ? 0.95 : 0.55) + Math.random() * 0.55;
      d.material.opacity = 0.95;
    }
    if (world.columns) {
      world.columns.forEach((col, i) => {
        col.visible = !!heavy;
        col.position.set((i - 1.5) * 0.28, 0.85, 2.08 + (i % 2) * 0.12);
        col.scale.set(0.35 + Math.random() * 0.15, 0.4, 0.35);
        col.userData.life = 0.55 + i * 0.08;
        col.material.opacity = 0.55;
      });
    }
    world.ripples.forEach((ring, i) => {
      ring.visible = true;
      ring.scale.setScalar(0.18);
      ring.userData.age = -i * 0.09;
      ring.material.opacity = heavy ? 0.85 : 0.45;
    });
    world.waterUniforms.uSplash.value = heavy ? 1.35 : 0.4;
    if (heavy) world.camera.fov = (world.baseFov || 52) - 9;
    const stage = stageEl();
    if (stage) {
      stage.classList.add("is-splash");
      if (heavy) stage.classList.add("is-soak");
      setTimeout(() => {
        stage.classList.remove("is-splash");
        stage.classList.remove("is-soak");
      }, heavy ? 720 : 280);
    }
  }

  function stepDroplets(dt) {
    if (!world) return;
    const k = dt / 1000;
    world.droplets.forEach((d) => {
      if (!d.visible) return;
      d.userData.life -= k;
      d.userData.vy -= GRAVITY * k;
      d.position.x += d.userData.vx * k;
      d.position.y += d.userData.vy * k;
      d.position.z += d.userData.vz * k;
      d.material.opacity = Math.max(0, d.userData.life);
      if (d.userData.life <= 0 || d.position.y < 0.7) d.visible = false;
    });
    world.ripples.forEach((ring) => {
      if (!ring.visible) return;
      ring.userData.age = (ring.userData.age || 0) + k;
      if (ring.userData.age < 0) return;
      const a = ring.userData.age;
      ring.scale.setScalar(0.35 + a * 2.4);
      ring.material.opacity = Math.max(0, 0.65 - a * 0.7);
      if (a > 1) ring.visible = false;
    });
    world.waterUniforms.uSplash.value *= 0.9;
    if (world.columns) {
      world.columns.forEach((col) => {
        if (!col.visible) return;
        col.userData.life -= k;
        col.position.y += 2.8 * k;
        col.scale.y += 4.5 * k;
        col.scale.x *= 0.985;
        col.scale.z *= 0.985;
        col.material.opacity = Math.max(0, col.userData.life * 1.1);
        if (col.userData.life <= 0) col.visible = false;
      });
    }
  }

  function showToast(text, fake) {
    const node = el("dunkToast");
    if (!node) return;
    node.hidden = false;
    node.textContent = text;
    node.classList.toggle("is-fake", !!fake);
    toastTimer = fake ? 720 : 980;
  }

  function hideToast() {
    const node = el("dunkToast");
    if (node) node.hidden = true;
  }

  function setStamp(on) {
    const stage = stageEl();
    if (!stage) return;
    let stamp = stage.querySelector(".dunk-stamp");
    if (on) {
      if (!stamp) {
        stamp = document.createElement("p");
        stamp.className = "dunk-stamp";
        stamp.textContent = "DRY";
        stage.appendChild(stamp);
      }
      stamp.hidden = false;
    } else if (stamp) stamp.hidden = true;
  }

  function ensureHud() {
    const stage = stageEl();
    if (!stage) return null;
    let hud = stage.querySelector(`[data-runkit-hud="${GAME_ID}"]`);
    if (!hud) {
      hud = document.createElement("p");
      hud.className = "depth-hud";
      hud.dataset.runkitHud = GAME_ID;
      hud.setAttribute("aria-live", "polite");
      stage.appendChild(hud);
    }
    if (isLive() || (run && run.dying)) {
      hud.textContent = hudLine(liveSpec(), run.seat | 0);
      hud.hidden = false;
    } else {
      hud.textContent = "SEAT 0";
      hud.hidden = true;
    }
    const banner = el("dunkSeatBanner");
    if (banner) {
      const spec = liveSpec();
      const cheat = cheatLabel(spec);
      if (isLive() || (run && run.dying)) {
        banner.hidden = false;
        banner.textContent = cheat || spec.title;
      } else {
        banner.hidden = true;
      }
    }
    return hud;
  }

  function paintPips() {
    const stage = stageEl();
    if (!stage) return;
    const spec = liveSpec();
    const max = (spec && spec.ballsPerSeat) || BALLS_PER_SEAT;
    let span = stage.querySelector("[data-runkit-strikes]");
    if (!span) {
      span = document.createElement("span");
      span.className = "strike-pips";
      span.dataset.runkitStrikes = GAME_ID;
      span.setAttribute("aria-hidden", "true");
      stage.appendChild(span);
    }
    if (span.childElementCount !== max) {
      span.innerHTML = new Array(max).fill("<i></i>").join("");
    }
    const used = (isLive() || (run && run.dying)) ? Math.max(0, max - (run.ballsLeft | 0)) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < used));
    const hud = el("dunkHud");
    if (hud) hud.hidden = !(isLive() || (run && run.dying));
    setText("dunkBallsHud", isLive() || (run && run.dying) ? String(run.ballsLeft | 0) : String(max));
    setText("dunkDepthHud", isLive() || (run && run.dying) ? String(run.depth | 0) : "0");
  }

  function resetPips() {
    const host = card();
    const pips = (host && host.querySelector("[data-runkit-strikes]")) || document.querySelector("[data-runkit-strikes=\"dunk\"]");
    if (!pips) return;
    pips.querySelectorAll("i").forEach((n) => n.classList.remove("on"));
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall through */ }
    }
    kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "miss_seat",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestDunk = Math.max(state.bestDunk || 0, payload.depth);
      state.bestDunkScore = Math.max(state.bestDunkScore || 0, payload.score);
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (state) {
      const keyed = Object.assign({ gameId: GAME_ID, at: Date.now() }, payload);
      const prev = (state.lastRun && typeof state.lastRun === "object" && !Array.isArray(state.lastRun))
        ? state.lastRun
        : {};
      state.lastRun = Object.assign({}, prev, {
        game: GAME_ID,
        gameId: GAME_ID,
        depth: payload.depth,
        score: payload.score,
        deathReason: payload.deathReason,
        cashedOut: payload.cashedOut,
        at: keyed.at,
      });
      state.lastRun[GAME_ID] = keyed;
    }
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("dunk")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") {
      return rk().challengeText("Dunk seats", depth, GAME_ID);
    }
    return `Beat my Dunk seats ${depth} on Penny Fever`;
  }

  function tellDepth(n) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportDepth !== "function") return;
    const spec = liveSpec();
    try {
      rk().reportDepth(run.kitRun, n | 0, { name: spec.title, coda: !!spec.coda });
    } catch (_) { /* hud */ }
    ensureHud();
  }

  function lastDepth() {
    const state = PF.getState() || {};
    const keyed = state.lastRun && state.lastRun[GAME_ID];
    if (keyed && keyed.depth != null) return keyed.depth | 0;
    const last = state.lastRun;
    if (last && (last.game === GAME_ID || last.gameId === GAME_ID)) return last.depth | 0;
    return Math.max(state.bestDunk || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }

  function tellStrike(reason) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportStrike !== "function") return;
    try { rk().reportStrike(run.kitRun, reason); } catch (_) { /* pips */ }
  }

  function punchStart() {
    stampDepthCopy();
    setText("dunkStatus", DEPTH_COPY.punch);
    const btn = el("dunkStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function stampDepthCopy() {
    const host = card();
    if (!host) return;
    const num = host.querySelector(".machine-number");
    if (num) num.textContent = DEPTH_COPY.machine;
    let tag = host.querySelector("[data-pf-depth-tag]");
    if (!tag) {
      tag = document.createElement("p");
      tag.dataset.pfDepthTag = "1";
      tag.className = "pf-depth-tag vendor-vestibule-only";
      tag.setAttribute("role", "status");
      const readout = host.querySelector(".depth-readout");
      if (readout && readout.parentNode) readout.parentNode.insertBefore(tag, readout);
      else host.appendChild(tag);
    }
    tag.textContent = DEPTH_COPY.tag;
    host.querySelectorAll("[data-pf-depth-copy]").forEach((p) => {
      p.textContent = DEPTH_COPY.body;
    });
    ensureHud();
    paintPips();
    const canvas = el("dunkCanvas");
    if (canvas) {
      canvas.style.touchAction = "none";
      canvas.classList.toggle("is-locked", !isLive());
    }
    if (!isLive() && (!run || run.done)) setText("dunkStatus", DEPTH_COPY.status);
  }

  function powerUi(on, amt) {
    const bar = el("dunkPower");
    const fill = el("dunkPowerFill");
    if (!bar) return;
    bar.hidden = !on;
    if (fill) fill.style.height = `${Math.round(kit.clamp(amt || 0, 0, 1) * 100)}%`;
  }

  function hintGone() {
    const hint = el("dunkAimHint");
    if (hint) hint.classList.add("is-gone");
  }

  function resetHint() {
    const hint = el("dunkAimHint");
    if (hint) hint.classList.remove("is-gone");
  }

  function parkBall() {
    if (!world) return;
    world.ballMesh.position.set(TEE.x, TEE.y, TEE.z);
    world.stitch.position.set(TEE.x - 0.03, TEE.y + 0.04, TEE.z + 0.04);
    world.ballMesh.visible = true;
    world.stitch.visible = true;
    world.trail.forEach((g) => { g.visible = false; });
    world.arcDots.forEach((d) => { d.visible = false; });
    world.leadGhost.visible = false;
  }

  function cameraTick(dt, spec, plates) {
    if (!world) return;
    const cam = world.camera;
    const t = run ? run.t : performance.now();
    const shake = (run && run.shake) || 0;
    let tx = Math.sin(t * 0.00018) * 0.08;
    let ty = 2.15 + Math.sin(t * 0.00015) * 0.03;
    let tz = -8.45;
    _look.set(0, 1.62, 1.45);
    if (run && run.aim) {
      tz = -8.15;
      ty = 2.05;
      _look.set(plates[0] ? plates[0].x * 0.55 : 0, 1.7, 1.38);
    }
    if (run && run.ball) {
      const b = run.ball;
      _look.lerp(_tmp.set(b.x, b.y, b.z), 0.42);
      tz = -5.55;
    }
    if (run && run.dunking) {
      const u = kit.clamp(run.dunking / 900, 0, 1);
      _look.set(0, 1.05 - u * 0.22, 2.05);
      ty = 1.62;
      tz = -4.95 + u * 0.4;
    }
    if (run && run.dying) {
      ty = 1.7;
      tz = -6.45;
    }
    cam.position.x += (tx - cam.position.x) * Math.min(1, dt * 0.006);
    cam.position.y += (ty - cam.position.y) * Math.min(1, dt * 0.006);
    cam.position.z += (tz - cam.position.z) * Math.min(1, dt * 0.006);
    if (shake > 0.2) {
      cam.position.x += (Math.random() - 0.5) * shake * 0.012;
      cam.position.y += (Math.random() - 0.5) * shake * 0.008;
    }
    cam.lookAt(_look);
    const wantFov = world.baseFov || 52;
    cam.fov += (wantFov - cam.fov) * Math.min(1, dt * 0.008);
    cam.updateProjectionMatrix();
    if (world.plateLight && plates[0]) {
      world.plateLight.position.set(plates[0].x, plates[0].y + 0.35, plates[0].z - 0.4);
    }
  }

  function drawAim(spec, t) {
    if (!world || !run || !run.aim) {
      if (world) {
        world.arcDots.forEach((d) => { d.visible = false; });
        world.leadGhost.visible = false;
      }
      return;
    }
    const vel = throwVelocity(run.aim.power, run.aim.yaw, run.aim.pitchTrim, spec, run.t);
    const arc = predictArc(vel, 16);
    world.arcDots.forEach((d, i) => {
      const p = arc[i];
      if (!p) { d.visible = false; return; }
      d.visible = true;
      d.position.set(p.x, p.y, p.z);
      d.scale.setScalar(0.7 + run.aim.power * 0.8);
    });
    const lead = platesOf(spec, t + 320)[0];
    if (lead && !lead.covering) {
      world.leadGhost.visible = true;
      world.leadGhost.position.set(lead.x, lead.y, lead.z);
      world.leadGhost.scale.setScalar(lead.r / 0.32);
    } else {
      world.leadGhost.visible = false;
    }
  }

  function tickWorld(dt) {
    if (!world) return;
    const spec = liveSpec();
    const t = run ? run.t : performance.now();
    world.waterUniforms.uTime.value = t * 0.001;
    world.sky.rotation.y += dt * 0.000012;
    world.duck.position.y = 0.8 + Math.sin(t * 0.003) * 0.03;
    world.duck.rotation.y = Math.sin(t * 0.001) * 0.4;
    world.streamers.forEach((s, i) => {
      s.rotation.z = Math.sin(t * 0.004 + i) * (spec.wind ? 0.55 : 0.18);
    });
    world.bulbs.forEach((b, i) => {
      const on = 0.65 + 0.35 * Math.sin(t * 0.006 + i * 0.7);
      b.material.color.setRGB(1, 0.88 * on, 0.55 * on);
    });
    world.stringLight.intensity = 1.5 + Math.sin(t * 0.004) * 0.35;
    world.signCrown.rotation.y = Math.sin(t * 0.0012) * 0.15;
    const drip = (run && run.depth) ? Math.min(1, run.depth / 6) : 0;
    world.signCrown.children[0].material.emissiveIntensity = 0.45 + drip * 0.7;

    const dunkT = run && run.dunking ? run.dunking : 0;
    const plates = dunkT > 0 ? [] : syncPlates(spec, t);
    if (dunkT > 0) {
      world.plateA.visible = false;
      world.plateB.visible = false;
      world.shield.visible = false;
      if (world.liePlate) world.liePlate.visible = false;
      if (world.afterimages) world.afterimages.forEach((g) => { g.visible = false; });
      const u = kit.clamp(dunkT / 820, 0, 1);
      const ease = u * u;
      world.seatPivot.rotation.x = ease * 1.42;
      const who = world.occupantKind === "aura" ? world.aura : world.barker;
      if (who && who.userData) {
        who.userData.armL.rotation.x = -ease * 0.8;
        who.userData.armR.rotation.x = -ease * 1.1;
      }
    } else {
      world.seatPivot.rotation.x += (0 - world.seatPivot.rotation.x) * 0.12;
      animatePerson(world.barker, t, false);
      animatePerson(world.aura, t, false);
    }

    if (run && run.ball && world.ballMesh) {
      world.ballMesh.visible = dunkT <= 0;
      world.stitch.visible = dunkT <= 0;
      world.ballMesh.position.set(run.ball.x, run.ball.y, run.ball.z);
      world.stitch.position.set(run.ball.x - 0.03, run.ball.y + 0.04, run.ball.z + 0.04);
      world.ballMesh.rotation.x += dt * 0.012;
      world.trail.forEach((g, i) => {
        const prev = run.trail && run.trail[i];
        if (!prev) { g.visible = false; return; }
        g.visible = true;
        g.position.set(prev.x, prev.y, prev.z);
        g.material.opacity = 0.32 - i * 0.028;
      });
    } else if (!run || !run.aim) {
      parkBall();
    } else {
      world.ballMesh.position.set(TEE.x, TEE.y, TEE.z);
      world.stitch.position.set(TEE.x - 0.03, TEE.y + 0.04, TEE.z + 0.04);
    }

    drawAim(spec, t);
    stepDroplets(dt);
    cameraTick(dt, spec, plates);
    if (run) run.shake = Math.max(0, (run.shake || 0) * 0.86);
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) hideToast();
    }
  }

  function render() {
    if (!world || !cabinetOn()) return;
    resize();
    try { world.renderer.render(world.scene, world.camera); } catch (_) { /* context */ }
  }

  function stopLoop() {
    if (loopRaf) cancelAnimationFrame(loopRaf);
    loopRaf = 0;
  }

  function startLoop() {
    if (!cabinetOn()) return;
    bootWorld();
    if (loopRaf) return;
    let last = 0;
    const tick = (now) => {
      if (!cabinetOn()) {
        loopRaf = 0;
        return;
      }
      if (!last) last = now;
      const dt = Math.min(34, now - last);
      last = now;
      if (!isLive() && (!run || run.done)) {
        idleClock += dt;
        if (idleClock > 2800) {
          idleClock = 0;
          idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
          applySeatVisual(liveSpec());
        }
      }
      if (run && !run.done) {
        if (!run.last) run.last = now;
        run.t += dt;
        if (run.dying) {
          tickWorld(dt);
          render();
          run.deathHold -= dt;
          if (run.deathHold <= 0) {
            sealResult(run.deathNote);
            loopRaf = requestAnimationFrame(tick);
            return;
          }
        } else {
          step(dt);
          tickWorld(dt);
          render();
          PF.refreshDepth();
        }
      } else {
        tickWorld(dt);
        render();
      }
      loopRaf = requestAnimationFrame(tick);
    };
    loopRaf = requestAnimationFrame(tick);
  }

  function startSeat(n) {
    const spec = dunkStageParams(n);
    if (!spec) return;
    run.seat = spec.id;
    run.spec = spec;
    run.ballsLeft = spec.ballsPerSeat;
    run.ball = null;
    run.aim = null;
    run.dunking = 0;
    run.fakeSplash = 0;
    run.armed = false;
    run.plateFlash = 0;
    run.trail = [];
    if (run.kitRun) run.kitRun.strikes = 0;
    if (world) world.seatPivot.rotation.x = 0;
    applySeatVisual(spec);
    parkBall();
    tellDepth(run.depth);
    ensureHud();
    paintPips();
    setHowTo(spec);
    powerUi(false, 0);
    setText("dunkStatus", spec.barker || `${spec.title} — ${spec.ballsPerSeat} balls. Hit the plate. Keep it cute.`);
  }

  function start() {
    if (isLive()) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("dunkStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      stampDepthCopy();
      return;
    }
    bootWorld();
    run = {
      done: false,
      dying: false,
      kitRun,
      t: 0,
      last: 0,
      depth: 0,
      seat: 1,
      score: 0,
      spec: dunkStageParams(1),
      ballsLeft: BALLS_PER_SEAT,
      ball: null,
      aim: null,
      dunking: 0,
      fakeSplash: 0,
      armed: false,
      plateFlash: 0,
      trail: [],
      shake: 0,
      closedStamp: false,
      deathHold: 0,
      deathNote: "miss_seat",
    };
    resetPips();
    setStamp(false);
    hideToast();
    resetHint();
    tellDepth(0);
    const startBtn = el("dunkStart");
    if (startBtn) startBtn.disabled = true;
    const verdict = el("dunkVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("dunkResult");
    PF.setTier("dunkTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    startSeat(1);
    PF.focusCard("dunkCard", true);
    PF.setAura("think");
    startLoop();
    resize();
  }

  function splashDunk() {
    run.dunking = 1;
    run.score += DUNK_SCORE;
    run.depth += 1;
    run.ball = null;
    run.aim = null;
    run.armed = false;
    run.shake = 14;
    if (run.kitRun) {
      run.kitRun.depth = run.depth;
      run.kitRun.score = run.score;
      run.kitRun.strikes = 0;
    }
    tellDepth(run.depth);
    burstSplash(true);
    if (run.spec && run.spec.kind === "comboFinale") {
      setTimeout(() => { if (run && run.dunking) burstSplash(true); }, 220);
    }
    kit.sfx("rack");
    kit.sfx("sink");
    kit.sfx("tray");
    PF.setAura("celebrate");
    const opera = run.spec && run.spec.kind === "comboFinale";
    showToast(opera ? "DOUBLE SPLASH!" : "SPLASH!", false);
    const vo = run.depth >= 6 ? AURA.deep(run.depth) : (run.depth % 2 === 0 ? AURA.dunk : AURA.playful);
    setText("dunkStatus", vo);
  }

  function armPlate() {
    run.armed = true;
    run.ball = null;
    run.plateFlash = 320;
    run.shake = 6;
    applySeatVisual(run.spec);
    kit.sfx("sink");
    showToast("ARMED", false);
    setText("dunkStatus", `Plate ARMED. Second hit dunks. ${run.ballsLeft} left.`);
    PF.setAura("point");
  }

  function playFakeSplash() {
    run.fakeSplash = 780;
    run.shake = 5;
    burstSplash(false);
    kit.sfx("sink");
    PF.setAura("laugh");
    showToast("FIB SPLASH!", true);
    setText("dunkStatus", "Aura: Cute fib. That splash wasn’t a dunk — throw the red HIT.");
  }

  function missBall(note) {
    run.ball = null;
    tellStrike("miss_seat");
    paintPips();
    kit.sfx("miss");
    const left = `Still cute. ${run.ballsLeft} ball${run.ballsLeft === 1 ? "" : "s"} left this seat.`;
    setText("dunkStatus", note ? `${note} ${left}` : left);
    if (run.ballsLeft <= 0) finish("miss_seat");
  }

  function pointerAim(ev) {
    const canvas = el("dunkCanvas");
    if (!canvas) return { x: 0, y: 0, w: 1, h: 1 };
    const r = canvas.getBoundingClientRect();
    const t = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]) || ev;
    return {
      x: t.clientX - r.left,
      y: t.clientY - r.top,
      w: Math.max(1, r.width),
      h: Math.max(1, r.height),
    };
  }

  function beginAim(ev) {
    if (!isLive() || run.ball || run.dunking) return;
    if (run.ballsLeft <= 0) return;
    const p = pointerAim(ev);
    run.aim = { x0: p.x, y0: p.y, x: p.x, y: p.y, power: 0, yaw: 0, pitchTrim: 0, w: p.w, h: p.h };
    const stage = stageEl();
    if (stage) stage.classList.add("is-aiming");
    powerUi(true, 0);
    hintGone();
  }

  function updateAim(ev) {
    if (!run || !run.aim) return;
    const p = pointerAim(ev);
    const dx = p.x - run.aim.x0;
    const dy = p.y - run.aim.y0;
    const pull = kit.clamp(Math.hypot(dx, dy) / (p.h * PULL_MAX_FRAC), 0, 1);
    run.aim.x = p.x;
    run.aim.y = p.y;
    run.aim.power = pull;
    run.aim.yaw = kit.clamp(dx / (p.w * 0.48), -0.7, 0.7);
    run.aim.pitchTrim = kit.clamp(-dy / p.h * 0.22, -0.12, 0.28);
    powerUi(true, run.spec && run.spec.invertLob ? 1 - pull : pull);
  }

  function releaseAim() {
    const stage = stageEl();
    if (stage) stage.classList.remove("is-aiming");
    if (!run || !run.aim || run.done || run.dying || run.ball || run.dunking) {
      if (run) run.aim = null;
      powerUi(false, 0);
      return;
    }
    const pull = run.aim.power;
    if (pull < 0.1) {
      run.aim = null;
      powerUi(false, 0);
      setText("dunkStatus", "Pull farther — that’s the throw.");
      return;
    }
    const spec = run.spec;
    const plates = platesOf(spec, run.t);
    const vel = throwVelocity(pull, run.aim.yaw, run.aim.pitchTrim, spec, run.t);
    run.ballsLeft -= 1;
    paintPips();
    run.ball = {
      x: TEE.x, y: TEE.y, z: TEE.z,
      vx: vel.vx, vy: vel.vy, vz: vel.vz,
      life: 0, r: BALL_R,
    };
    run.trail = [];
    run.aim = null;
    powerUi(false, 0);
    kit.sfx("throw");
    if (spec.invertLob) setText("dunkStatus", pull < 0.45 ? "Reverse lob — short pull flies long." : "Reverse — that long pull is a dink.");
  }

  function step(dt) {
    const k = dt / 1000;
    run.plateFlash = Math.max(0, (run.plateFlash || 0) - dt);
    run.fakeSplash = Math.max(0, (run.fakeSplash || 0) - dt);
    if (run.dunking > 0) {
      run.dunking += dt;
      if (run.dunking > DUNK_MS) {
        run.dunking = 0;
        const next = dunkStageParams(run.depth + 1);
        if (!next) {
          finish("souvenir");
          return;
        }
        startSeat(run.depth + 1);
      }
      return;
    }
    const ball = run.ball;
    if (!ball) return;
    ball.vy -= GRAVITY * k;
    if (run.spec.wind || run.spec.figure8) {
      ball.vx += Math.sin(run.t * 0.0042) * 0.55 * k;
    }
    ball.x += ball.vx * k;
    ball.y += ball.vy * k;
    ball.z += ball.vz * k;
    ball.life += dt;
    run.trail = [{ x: ball.x, y: ball.y, z: ball.z }].concat(run.trail || []).slice(0, 10);

    if (run.spec.dualPlate && Math.abs(ball.x) < 0.18 && ball.z > 1.15 && ball.z < 1.7 && ball.y > 0.85 && ball.y < 2.35) {
      missBall("Dead wall — pick a plate.");
      return;
    }

    const plates = platesOf(run.spec, run.t);
    let nearest = Infinity;
    let hitPlate = null;
    plates.forEach((p) => {
      const d = Math.hypot(ball.x - p.x, ball.y - p.y, ball.z - p.z);
      if (d < nearest) nearest = d;
      const slop = (run.spec && run.spec.id === 1) ? 1.28 : 1.18;
      if (d < p.r + ball.r * slop) hitPlate = p;
    });
    const lie = (run.spec.fakeSplash || run.spec.kind === "fakeSplash" || run.spec.kind === "comboFinale")
      ? liePos(run.spec, run.t, LIE_LAG_MS)
      : null;
    if (lie && !hitPlate) {
      const ld = Math.hypot(ball.x - lie.x, ball.y - lie.y, ball.z - lie.z);
      if (ld < lie.r + ball.r * 1.05) {
        playFakeSplash();
        missBall("Pale plate fibbed — throw the glowing HIT.");
        return;
      }
    }
    if (hitPlate) {
      if (hitPlate.covering || shieldCovering(run.spec, run.t)) {
        run.plateFlash = 180;
        run.shake = 5;
        missBall("Shield paddle ate it — wait the open. Still cute.");
        return;
      }
      run.plateFlash = 240;
      run.shake = 8;
      if (run.spec.armThenDunk && !run.armed) {
        armPlate();
        return;
      }
      splashDunk();
      return;
    }

    const inWater = ball.y < 0.82 && ball.y > 0.4
      && Math.abs(ball.x) < 1.12 && ball.z > 1.45 && ball.z < 2.85;
    const near = nearest < ((plates[0] && plates[0].r) || 0.3) * 2.15;
    if (inWater) {
      burstSplash(false);
      if (near && run.spec.fakeSplash) playFakeSplash();
      missBall(near
        ? (run.spec.fakeSplash ? "Fib splash! Still dry — throw the red HIT." : "Tank splash — plate danced past. Cute miss.")
        : "Tank splash. Plate’s still dry. Keep it cute.");
      return;
    }
    const off = ball.y < 0.08 || ball.z > 5.4 || ball.z < -6.4 || Math.abs(ball.x) > 5 || ball.life > 2400;
    if (off) {
      if (near && run.spec.fakeSplash) playFakeSplash();
      missBall(near
        ? (run.spec.fakeSplash ? "Fib splash! Plate still dry — cute try." : "Near miss — plate danced past. Still cute.")
        : "");
    }
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (depth <= 0) return AURA.shallow;
    if (rk() && typeof rk().auraDeathLine === "function") {
      const line = rk().auraDeathLine(GAME_ID, depth, reason || "miss_seat");
      if (line) return `Aura: ${String(line).replace(/^Aura:\s*/i, "")}`;
    }
    if (depth >= 6) return AURA.deep(depth);
    return AURA.miss_seat;
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave" || reason === "souvenir") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.aim = null;
    run.deathNote = reason || "miss_seat";
    run.closedStamp = true;
    run.deathHold = DEATH_HOLD_MS;
    setStamp(true);
    kit.sfx("stamp");
    run.shake = 8;
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    run.closedStamp = reason !== "leave" && reason !== "souvenir";
    const depth = run.depth;
    const score = run.score;
    const death = reason === "leave" ? "leave" : reason === "souvenir" ? "souvenir" : "miss_seat";
    persistDepth({
      depth,
      score,
      deathReason: death,
      cashedOut: reason === "souvenir",
      meta: { seat: run.spec && run.spec.id, kind: run.spec && run.spec.kind, coda: !!(run.spec && run.spec.coda) },
    });
    stampDepthCopy();
    const startBtn = el("dunkStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "TOSS AGAIN · 1 demo coin";
    }
    PF.focusCard("dunkCard", false);
    kit.setMode(card(), "result");
    const line = `DUNKS ${depth} · SCORE ${score}`;
    const aura = auraLine(reason, depth);
    const challenge = challengeLine(depth);
    const verdict = el("dunkVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = reason === "leave"
        ? `Left the seat · ${line}`
        : reason === "souvenir"
          ? `Souvenir. ${line}.`
          : `Missed the seat. ${line}.`;
    }
    kit.fillResult({
      root: "dunkResult",
      depth: "dunkResultDepth",
      score: "dunkResultScore",
      aura: "dunkResultAura",
      copied: "dunkCopied",
    }, {
      depthLine: `DUNKS ${depth}`,
      scoreLine: `SCORE ${score} · ${death.replace(/_/g, " ").toUpperCase()}`,
      auraLine: aura,
    });
    const reasonNode = el("dunkResultReason");
    if (reasonNode) reasonNode.textContent = death.replace(/_/g, " ").toUpperCase();
    setText("dunkChallengeText", challenge);
    PF.setTier("dunkTier", depth > 0 ? `DUNKS ${depth}` : "DRY", depth > 0 || reason === "souvenir" ? "perfect" : "miss");
    setText("dunkStatus", reason === "leave" ? "Left the seat." : reason === "souvenir" ? "Crown still dripping. Still cute." : "Tank stamped DRY.");
    if (depth > 0 || reason === "souvenir") {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Dunk tank");
      PF.setAura(depth >= 3 || reason === "souvenir" ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, reason === "souvenir" ? "SOUVENIR" : `DUNKS ${depth}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Dunk miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "DRY", aura);
    }
    PF.refreshNightBoard();
    powerUi(false, 0);
    if (reason === "leave") setStamp(false);
    applySeatVisual(dunkStageParams(1));
    parkBall();
  }

  PF.registerVendor({
    id: "dunk-tank",
    playKey: "dunk",
    chalk: "Soak the crown. How many seats?",
    defaults: { bestDunk: 0, bestDunkScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopLoop();
      const stage = stageEl();
      if (stage) stage.classList.remove("is-aiming", "is-splash");
    },
    onShow() {
      declareP0();
      stampDepthCopy();
      setHowTo(liveSpec());
      bootWorld();
      startLoop();
      resize();
    },
    onReset() {
      run = null;
      const verdict = el("dunkVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("dunkResult");
      const startBtn = el("dunkStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      resetPips();
      setStamp(false);
      hideToast();
      resetHint();
      powerUi(false, 0);
      stampDepthCopy();
      if (world) {
        applySeatVisual(dunkStageParams(1));
        parkBall();
      }
      if (cabinetOn()) startLoop();
    },
    refreshDepth(state) {
      setText("depthDunkNow", isLive() || (run && run.dying) ? String(run.depth) : "0");
      const bestN = Math.max(state.bestDunk || 0, (state.bestDepth && state.bestDepth.dunk) || 0);
      setText("depthDunkBest", bestN ? String(bestN) : "—");
      setText("depthDunkScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("depthDunkBestScore", state.bestDunkScore ? String(state.bestDunkScore) : "—");
      setText("dunkDoorBest", bestN ? `Best seats ${bestN}` : "Seats —");
    },
    bind() {
      declareP0();
      ensureHud();
      paintPips();
      const startBtn = el("dunkStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = el("dunkCanvas");
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("pointerdown", (ev) => {
          if (run && (run.dying || run.done)) return;
          if (!isLive()) start();
          if (!isLive()) return;
          ev.preventDefault();
          try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
          beginAim(ev);
        });
        canvas.addEventListener("pointermove", (ev) => {
          if (!run || !run.aim) return;
          ev.preventDefault();
          updateAim(ev);
        });
        const up = (ev) => {
          if (!run || !run.aim) return;
          ev.preventDefault();
          updateAim(ev);
          releaseAim();
        };
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("lostpointercapture", up);
        canvas.addEventListener("pointercancel", up);
      }
      const copyBtn = el("dunkChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = lastDepth();
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("dunkCopied");
            if (copied) copied.hidden = false;
            setText("dunkStatus", "Copied — send it");
          }, () => {
            setText("dunkStatus", text);
          });
        });
      }
      if (typeof ResizeObserver === "function") {
        const stage = stageEl();
        if (stage) {
          ro = new ResizeObserver(() => resize());
          ro.observe(stage);
        }
      }
      window.addEventListener("resize", resize);
      stampDepthCopy();
      setHowTo(liveSpec());
      bootWorld();
    },
  });
})();
