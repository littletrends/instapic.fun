/* Fairy Floss Wheel — 3D sugar cyclone. Desktop Grok owns this file.
 * PF only. Never booth/port 6000. Never Imagine downloads.
 * Circle-to-wind on touch. Snap is death. Sugar height = depth.
 * One coin = one run. Family-safe carnival. Aura locked look. */
import * as THREE from "../world/lib/three.module.min.js";

const GAME_ID = "fairyfloss";
const TAU = Math.PI * 2;
const DEATH_HOLD_MS = 760;
const AUTHORED_COUNT = 8;
const CODA_ENABLED = true;
const SCORE_PER_TENTH = 20;
const CLEAR_BONUS = 250;
const RIBBON_N = 12;
const PUFF_N = 10;
const CLOUD_N = 48;
const SPARK_N = 90;
const REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const TUB = { x: 0, y: 1.08, z: -0.12 };
const HEAT_R = 0.46;
const RING_R = 1.08;
const SPEED_REF = 6.4;
const PRESS_GRACE = 0.32;

const AURA_LINES = {
  snap: "Aura: You got greedy with the spin.",
  snapDeep: (m) => `Aura: FLOSS ${m}m snapped. Cloud wanted slower hands.`,
  clear: "Aura: Metres locked. Tub spins meaner.",
  deep: (n) => `Aura: ${n}m. That sugar web trusts you — barely.`,
  leave: "Aura: Walked off mid-cloud. The web sagged.",
  shallow: "Aura: Not a metre. The cloud wanted a slower hand.",
  souvenir: "Aura: Sugar Edge souvenir. The cloud let you walk.",
  sag: "Aura: The cloud drooped. Keep the circle.",
};

const AUTHORED = [
  {
    id: 1, title: "Soft Cloud", kind: "teach",
    metresNeeded: 3, bandH: 40, bandMid: 0.44,
    tubRpm: 0.42, snapLimit: 1, metrePerSecInBand: 0.55,
    catchR: 0.58, flyLife: 3.4, spawnMs: 1400, maxLive: 2, flySpin: 1.35, flyR: 1.22, flyH: 0.42,
    snapMs: 520, sagNoGain: true,
    barker: "Drag a circle around the wheel. Sugar grows taller. One snap and you’re done.",
  },
  {
    id: 2, title: "Twin Strand", kind: "dualNeedle",
    metresNeeded: 4, bandH: 30, bandMid: 0.46,
    tubRpm: 0.52, snapLimit: 1, metrePerSecInBand: 0.5,
    catchR: 0.5, flyLife: 3.1, spawnMs: 1100, maxLive: 3, flySpin: 1.5, flyR: 1.28, flyH: 0.48,
    snapMs: 420, sagNoGain: true, dualNeedle: true,
    barker: "Speed AND orbit radius must sit sweet. Stay on the glowing ring.",
  },
  {
    id: 3, title: "Gust Stall", kind: "gust",
    metresNeeded: 5, bandH: 24, bandMid: 0.47,
    tubRpm: 0.64, snapLimit: 1, metrePerSecInBand: 0.42,
    catchR: 0.46, flyLife: 2.8, spawnMs: 1000, maxLive: 3, flySpin: 1.7, flyR: 1.35, flyH: 0.55,
    snapMs: 340, sagNoGain: true, gust: true, gustEveryMs: 2600, gustMs: 520, gustJump: 0.22,
    barker: "Gusts shove the ribbons. Ride the jump or miss the catch.",
  },
  {
    id: 4, title: "Reverse Wind", kind: "invertDrag",
    metresNeeded: 5, bandH: 22, bandMid: 0.47,
    tubRpm: 0.72, snapLimit: 1, metrePerSecInBand: 0.4,
    catchR: 0.44, flyLife: 2.7, spawnMs: 980, maxLive: 3, flySpin: 1.85, flyR: 1.32, flyH: 0.5,
    snapMs: 320, sagNoGain: true, invertDrag: true,
    barker: "REVERSE — circle the other way. Muscle memory lies.",
  },
  {
    id: 5, title: "Fake Snap Tent", kind: "fakeSnap",
    metresNeeded: 6, bandH: 16, bandMid: 0.52,
    tubRpm: 0.8, snapLimit: 1, metrePerSecInBand: 0.44,
    catchR: 0.42, flyLife: 2.55, spawnMs: 920, maxLive: 3, flySpin: 2.0, flyR: 1.38, flyH: 0.52,
    snapMs: 300, sagNoGain: true, fakeSnap: true, fakeSnapCount: 3,
    barker: "Booth audio lies. Three fake snaps. Ignore them. Keep winding.",
  },
  {
    id: 6, title: "Sag Trap Shelf", kind: "sagTrap",
    metresNeeded: 6, bandH: 16, bandMid: 0.5,
    tubRpm: 0.86, snapLimit: 1, metrePerSecInBand: 0.44,
    catchR: 0.4, flyLife: 2.45, spawnMs: 880, maxLive: 3, flySpin: 2.1, flyR: 1.4, flyH: 0.5,
    snapMs: 280, sagNoGain: true, sagEats: true, sagCatchMs: 520,
    barker: "Stop circling and the cloud melts. Catch up after the droop.",
  },
  {
    id: 7, title: "Pulse Tub", kind: "pulseTub",
    metresNeeded: 7, bandH: 14, bandMid: 0.5,
    tubRpm: 0.95, snapLimit: 1, metrePerSecInBand: 0.46,
    catchR: 0.38, flyLife: 2.3, spawnMs: 820, maxLive: 4, flySpin: 2.2, flyR: 1.42, flyH: 0.58,
    snapMs: 260, sagNoGain: true, pulse: true,
    barker: "Tub pulses. Sync the wind to the sine.",
  },
  {
    id: 8, title: "Fever Sugar Opera", kind: "comboFinale",
    metresNeeded: 7, bandH: 12, bandMid: 0.5,
    tubRpm: 1.05, snapLimit: 1, metrePerSecInBand: 0.46,
    catchR: 0.36, flyLife: 2.2, spawnMs: 760, maxLive: 4, flySpin: 2.35, flyR: 1.46, flyH: 0.62,
    snapMs: 250, sagNoGain: true, dualNeedle: true, gustOnce: true, fakeSnapOnce: true,
    reversePulseMid: true, pulse: true, fakeSnapCount: 1, gustMs: 500, gustJump: 0.18,
    barker: "Twin ring, one gust, one fake snap, reverse pulse. Gauntlet.",
  },
];

const P0_MOUNT = {
  engine: "Custom",
  displayName: "Fairy Floss Wheel",
  depthUnit: "Metres",
  sheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
  codaEnabled: CODA_ENABLED,
  authoredCount: AUTHORED_COUNT,
};

const DEPTH_COPY = {
  tag: "DEPTH RUN · sugar HEIGHT is your depth · circle to wind · one SNAP kills",
  body: "Drag a circle around the copper wheel with your finger. Sugar winds onto the cone and grows taller — that height is your depth. Soft Cloud → Twin Strand → Gust Stall → Reverse Wind → Fake Snap Tent → Sag Trap Shelf → Pulse Tub → Fever Sugar Opera → ENDLESS Sugar Edge. Too slow sags. Too fast SNAPS — and snap is death.",
  status: "Depth run · START · 1 demo coin · circle to wind · height is depth",
  machine: "Sugar stall · 1 demo coin · height = depth · SNAP = death",
  punch: "Depth run — press START. Drag a circle around the wheel. One snap kills the cloud.",
};

const CAM_PLAY = new THREE.Vector3(0, 2.7, 6.45);
const LOOK_PLAY = new THREE.Vector3(0, 1.08, -0.08);

function applyBand(p) {
  const mid = p.bandMid != null ? p.bandMid : 0.5;
  const half = (p.bandH / 100) * 0.5;
  p.lo = Math.max(0.1, Math.min(0.78, mid - half));
  p.hi = Math.max(0.24, Math.min(0.94, mid + half));
  return p;
}

function fairyflossMountParams(n) {
  const t = n - 1;
  if (n <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[n - 1]);
  return {
    id: n, title: "Sugar Edge", metresNeeded: 7 + t, bandH: Math.max(6, 11 - 0.5 * t),
    tubRpm: Math.min(2.2, 1.1 + 0.12 * t), snapLimit: 1,
    metrePerSecInBand: Math.min(0.62, 0.46 + 0.02 * t),
    catchR: Math.max(0.22, 0.36 - 0.01 * t), flyLife: Math.max(1.5, 2.1 - 0.04 * t),
    spawnMs: Math.max(480, 720 - 18 * t), maxLive: 4, flySpin: Math.min(3.2, 2.4 + 0.08 * t),
    flyR: 1.5, flyH: 0.64, sagNoGain: true,
  };
}

function fairyflossCoda(n) {
  const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
  const mount = fairyflossMountParams(stage);
  return applyBand(Object.assign({}, mount, {
    id: stage, title: `Sugar Edge ${stage}`, kind: "coda",
    bandMid: 0.62, snapMs: Math.max(170, 250 - 8 * (stage - AUTHORED_COUNT)),
    wander: true, pulse: true, coda: true,
    barker: `ENDLESS — Sugar Edge ${stage}. Ring shrinks. Tub climbs.`,
  }));
}

function fairyflossStageParams(n) {
  const stage = Math.max(1, n | 0);
  if (stage <= AUTHORED_COUNT) return applyBand(Object.assign({}, AUTHORED[stage - 1]));
  if (!CODA_ENABLED) return null;
  return fairyflossCoda(stage);
}

function boot() {
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) {
    requestAnimationFrame(boot);
    return;
  }
  initVendor(PF);
}
boot();

function initVendor(PF) {
  const { $, kit } = PF;

  let run = null;
  let world = null;
  let raf = 0;
  let lastT = 0;
  let idleRoom = 1;
  let idleClock = 0;
  let intro = 0;
  let toastUntil = 0;
  let bound = false;
  let simT = 0;

  const input = { x: TUB.x, z: TUB.z + RING_R, aimX: TUB.x, aimZ: TUB.z + RING_R, down: false, steer: false, ang: Math.PI / 2, lastAng: Math.PI / 2, speed: 0, speedSigned: 0, grace: 0 };
  const look = LOOK_PLAY.clone();
  const punch = { t: 0, mag: 0 };
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const _v = new THREE.Vector3();
  const _v2 = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);

  const GEO = {
    sphere: new THREE.SphereGeometry(1, 12, 10),
    sphereHi: new THREE.SphereGeometry(1, 16, 12),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 14),
    cone: new THREE.ConeGeometry(1, 1, 12),
    box: new THREE.BoxGeometry(1, 1, 1),
    torus: new THREE.TorusGeometry(1, 0.04, 8, 40),
    plane: new THREE.PlaneGeometry(1, 1),
  };

  function el(id) { return $(id); }
  function setText(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }
  function rk() { return PF.runKit || null; }
  function card() { return el("fairyFlossCard"); }
  function cabinetOn() {
    const node = document.getElementById("cabinet-fairy-floss");
    return !!(node && !node.hidden);
  }
  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }
  function liveSpec() {
    return (run && run.spec) || fairyflossStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }
  function clamp(n, a, b) { return kit ? kit.clamp(n, a, b) : Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function wrapAng(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function mat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.72, metalness: 0.08,
    }, extra || {}));
  }
  function mesh(geo, material, sx, sy, sz, x, y, z) {
    const m = new THREE.Mesh(geo, material);
    m.scale.set(sx, sy, sz);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }
  function canvasTex(w, h, draw, rx, ry) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx || 1, ry || 1);
    return t;
  }
  function sfx(name) {
    if (kit && typeof kit.sfx === "function") kit.sfx(name);
  }

  function showToast(title, sub, ms, kind) {
    const node = el("fairyFlossToast");
    if (!node) return;
    node.hidden = false;
    node.className = "ff-toast" + (kind ? " is-" + kind : "");
    node.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ""}`;
    toastUntil = performance.now() + (ms || 1180);
  }
  function hideToastIfDue(now) {
    if (!toastUntil) return;
    if (now >= toastUntil) {
      toastUntil = 0;
      const node = el("fairyFlossToast");
      if (node) {
        node.hidden = true;
        node.className = "ff-toast";
      }
    }
  }
  function setCall(text) {
    const n = el("fairyFlossCall");
    if (n) n.textContent = text;
  }

  function liveBand(spec, t) {
    const s = spec || fairyflossStageParams(1);
    let lo = s.lo;
    let hi = s.hi;
    if (s.wander) {
      const mid = (lo + hi) / 2;
      const half = (hi - lo) / 2;
      const drift = Math.sin((t || 0) * 0.9) * 0.12;
      lo = clamp(mid + drift - half, 0.1, 0.74);
      hi = clamp(mid + drift + half, 0.26, 0.94);
    }
    if (s.pulse) {
      const mid = (lo + hi) / 2;
      const half = ((hi - lo) / 2) * (1 + 0.28 * Math.sin((t || 0) * 3.2));
      lo = clamp(mid - half, 0.1, 0.74);
      hi = clamp(mid + half, 0.26, 0.94);
    }
    if (run && run.gustUntil > (run.t || 0)) {
      const jump = (run.gustSign || 1) * 0.08;
      lo = clamp(lo + jump, 0.1, 0.74);
      hi = clamp(hi + jump, 0.26, 0.94);
    }
    return { lo, hi };
  }

  function invertActive(spec) {
    if (!spec) return false;
    if (spec.invertDrag) return true;
    if (run && run.invertUntil > (run.t || 0)) return true;
    return false;
  }

  function heightOf(runObj) {
    return (runObj && runObj.totalMetres) || 0;
  }
  function heightDepth(runObj) {
    return Math.floor(heightOf(runObj));
  }
  function hudLine(spec, playing) {
    const m = heightOf(run);
    const label = `${m.toFixed(1)}m`;
    if (!spec) return `HEIGHT ${label}`;
    if (spec.coda) return `ENDLESS · HEIGHT ${label} · ${spec.title}`;
    return `HEIGHT ${label} · ${spec.title}`;
  }

  function roomTell(spec) {
    if (!spec) return "HOLD AND CIRCLE — HEIGHT IS DEPTH";
    if (spec.kind === "coda") return "ENDLESS — RING SHRINKS";
    if (spec.kind === "comboFinale") return "TWIN RING + GUST + FAKE SNAP + REVERSE PULSE";
    if (spec.invertDrag) return "CIRCLE THE OTHER WAY";
    if (spec.gust) return "GUSTS SHOVE THE RIBBONS";
    if (spec.dualNeedle) return "SPEED AND RADIUS MUST BOTH SIT SWEET";
    if (spec.fakeSnap) return "FAKE SNAPS — IGNORE THE LIE";
    if (spec.sagEats) return "IDLE MELTS THE CLOUD";
    if (spec.pulse) return "TUB PULSES — SYNC THE WIND";
    return "HOLD AND CIRCLE — HEIGHT IS DEPTH";
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = mat(0xf0c4a8, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const hair = mat(0x3d2418, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });
    const gold = mat(0xe8b84a, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const heart = mat(0xd22b3a, { emissive: 0xd22b3a, emissiveIntensity: 0.65, roughness: 0.35 });
    const dress = mat(0x1e6b3c, { emissive: 0x0a2010, emissiveIntensity: 0.25 });
    const blouse = mat(0xf5f0ea, { emissive: 0x3a3028, emissiveIntensity: 0.18 });
    const shoe = mat(0x141414, { roughness: 0.22, metalness: 0.45 });

    const hip = new THREE.Group();
    hip.position.y = 0.55;
    g.add(hip);
    hip.add(mesh(GEO.cyl, blouse, 0.14, 0.28, 0.14, 0, 0.3, 0));
    const pinafore = mesh(GEO.cyl, dress, 0.24, 0.38, 0.24, 0, 0.06, 0);
    pinafore.scale.set(1, 1, 0.85);
    hip.add(pinafore);
    const gem = mesh(GEO.box, heart, 0.08, 0.08, 0.035, 0, 0.22, 0.16);
    gem.rotation.z = Math.PI / 4;
    hip.add(gem);

    const head = new THREE.Group();
    head.position.y = 0.62;
    hip.add(head);
    head.add(mesh(GEO.sphere, skin, 0.18, 0.18, 0.18, 0, 0.02, 0));
    head.add(mesh(GEO.sphere, hair, 0.2, 0.12, 0.2, 0, 0.1, -0.02));
    [-1, 1].forEach((side) => {
      head.add(mesh(GEO.sphere, hair, 0.1, 0.1, 0.1, side * 0.18, -0.04, 0.04));
      head.add(mesh(GEO.sphere, heart, 0.04, 0.04, 0.04, side * 0.18, 0.05, 0.06));
      head.add(mesh(GEO.sphere, mat(0xf7f2ea), 0.036, 0.042, 0.018, side * 0.055, 0.03, 0.16));
      head.add(mesh(GEO.sphere, mat(0x2a1810), 0.02, 0.02, 0.02, side * 0.055, 0.03, 0.175));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.007, 6, 10, Math.PI), mat(0xc45a6a));
    smile.position.set(0, -0.04, 0.165);
    smile.rotation.x = 2.55;
    head.add(smile);

    const crown = new THREE.Group();
    crown.position.y = 0.22;
    head.add(crown);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold);
    band.rotation.x = Math.PI / 2;
    crown.add(band);
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      const spike = new THREE.Mesh(GEO.cone, gold);
      spike.scale.set(0.035, h, 0.035);
      spike.position.set(x, h * 0.45, 0);
      crown.add(spike);
    });
    const heartGem = mesh(GEO.box, heart, 0.05, 0.05, 0.025, 0, 0.02, 0.12);
    heartGem.rotation.z = Math.PI / 4;
    crown.add(heartGem);

    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.18 : 0.08), arm ? 0.38 : 0.0, 0);
      const len = arm ? 0.3 : 0.36;
      const bone = mesh(GEO.cyl, arm ? skin : dress, arm ? 0.035 : 0.045, len, arm ? 0.035 : 0.045, 0, -len / 2, 0);
      pivot.add(bone);
      if (arm) pivot.add(mesh(GEO.sphere, skin, 0.04, 0.04, 0.04, 0, -len, 0));
      else pivot.add(mesh(GEO.box, shoe, 0.08, 0.05, 0.13, 0, -len - 0.02, 0.03));
      hip.add(pivot);
      return pivot;
    }
    const armL = limb(-1, true);
    const armR = limb(1, true);
    limb(-1, false);
    limb(1, false);
    const spare = makeConeMesh(0.85);
    spare.position.set(0, -0.42, 0.02);
    spare.rotation.z = 0.4;
    armR.add(spare);

    g.userData = { hip, head, armL, armR, mood: "idle", moodT: 0 };
    g.scale.setScalar(1.12);
    g.position.set(2.42, 0, 1.15);
    g.rotation.y = -1.05;
    g.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
    return g;
  }

  function makeConeMesh(scale) {
    const g = new THREE.Group();
    const paper = mat(0xf4e6d0, { roughness: 0.55, emissive: 0x3a2418, emissiveIntensity: 0.08 });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 14, 1, true), paper);
    cone.position.y = 0.11;
    cone.rotation.x = Math.PI;
    g.add(cone);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.006, 6, 16), mat(0xfff4ea, { roughness: 0.45 }));
    rim.position.y = 0.0;
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    g.scale.setScalar(scale || 1);
    return g;
  }

  function makeRibbon(puffMat) {
    const g = new THREE.Group();
    const puffs = [];
    for (let i = 0; i < PUFF_N; i += 1) {
      const m = new THREE.Mesh(GEO.sphere, puffMat.clone());
      m.scale.setScalar(0.045 + i * 0.007);
      g.add(m);
      puffs.push(m);
    }
    g.visible = false;
    return {
      mesh: g, puffs, alive: false, caught: false, age: 0, life: 2.6,
      a0: 0, wind: 0, yieldM: 0.85, flash: 0,
    };
  }

  function buildWorld(canvas) {
    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: false, powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.ACESFilmicToneMapping != null) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
    }
    renderer.setClearColor(0x140810, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a0812, 0.045);
    scene.background = new THREE.Color(0x140810);

    const camera = new THREE.PerspectiveCamera(56, 1.5, 0.08, 60);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    camera.position.copy(CAM_PLAY);

    const stripe = canvasTex(256, 256, (ctx) => {
      for (let i = 0; i < 12; i += 1) {
        ctx.fillStyle = i % 2 ? "#f3b6cc" : "#fff4ec";
        ctx.fillRect(i * 22, 0, 22, 256);
      }
      ctx.fillStyle = "rgba(90,20,40,0.12)";
      for (let i = 0; i < 18; i += 1) ctx.fillRect(0, i * 14, 256, 2);
    }, 4, 2);
    const wood = canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#2a1a12";
      ctx.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 28) {
        ctx.fillStyle = y % 56 ? "#3a2418" : "#2e1c12";
        ctx.fillRect(0, y, 256, 26);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, y + 25, 256, 2);
        ctx.fillStyle = "rgba(255,196,90,0.08)";
        ctx.fillRect(20 + (y % 40), y + 8, 90, 3);
      }
    }, 2, 4);
    const signTex = canvasTex(512, 160, (ctx) => {
      ctx.fillStyle = "#6a2038";
      ctx.fillRect(0, 0, 512, 160);
      ctx.strokeStyle = "#e8b84a";
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, 496, 144);
      ctx.fillStyle = "#ffe6f2";
      ctx.font = "bold 52px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("FAIRY FLOSS", 256, 72);
      ctx.fillStyle = "#f4a0c0";
      ctx.font = "22px Georgia, serif";
      ctx.fillText("CIRCLE · HEIGHT · SNAP KILLS", 256, 118);
    }, 1, 1);
    signTex.wrapS = signTex.wrapT = THREE.ClampToEdgeWrapping;

    scene.add(new THREE.HemisphereLight(0xffd0e8, 0x1a0c10, 0.78));
    const sun = new THREE.DirectionalLight(0xffe0c4, 0.58);
    sun.position.set(2.6, 5.4, 3.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 16;
    sun.shadow.camera.left = -5;
    sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5;
    sun.shadow.camera.bottom = -5;
    scene.add(sun);
    const tubLight = new THREE.PointLight(0xff6aa8, 2.6, 7, 1.35);
    tubLight.position.set(TUB.x, TUB.y + 0.28, TUB.z);
    scene.add(tubLight);
    const lanternL = new THREE.PointLight(0xffc878, 0.95, 6, 1.5);
    lanternL.position.set(-1.8, 2.55, 0.7);
    scene.add(lanternL);
    const lanternR = new THREE.PointLight(0xff9ec8, 0.85, 6, 1.5);
    lanternR.position.set(1.9, 2.6, 0.3);
    scene.add(lanternR);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(5.2, 40),
      mat(0x3a2418, { map: wood, roughness: 0.84 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const tentMat = mat(0xf4c4d4, {
      map: stripe, roughness: 0.86, metalness: 0.02,
      side: THREE.DoubleSide, transparent: true, opacity: 0.94,
    });
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(4.05, 4.25, 3.5, 24, 1, true, Math.PI * 0.18, Math.PI * 1.64),
      tentMat
    );
    wall.position.y = 1.75;
    wall.receiveShadow = true;
    scene.add(wall);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.45, 1.75, 18, 1, true), tentMat);
    roof.position.y = 4.25;
    scene.add(roof);
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(14, 16, 10), mat(0x1a1020, { roughness: 0.95, side: THREE.BackSide })));

    for (let i = 0; i < 14; i += 1) {
      const a = (i / 14) * TAU;
      const bulb = mesh(
        GEO.sphere,
        mat(i % 2 ? 0xffe08a : 0xff9ec8, { emissive: i % 2 ? 0xffc050 : 0xff6aa8, emissiveIntensity: 1.45, roughness: 0.3 }),
        0.05, 0.05, 0.05,
        Math.sin(a) * 2.85, 2.85, Math.cos(a) * 2.85 - 0.2
      );
      scene.add(bulb);
    }

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.35, 0.7),
      mat(0xffffff, { map: signTex, roughness: 0.5, emissive: 0x3a1020, emissiveIntensity: 0.28 })
    );
    sign.position.set(0, 2.72, -2.85);
    scene.add(sign);

    const cart = new THREE.Mesh(
      new THREE.CylinderGeometry(1.92, 2.02, 0.78, 28),
      mat(0x3a2418, { map: wood, roughness: 0.7 })
    );
    cart.position.set(0, 0.39, 0);
    cart.castShadow = true;
    cart.receiveShadow = true;
    scene.add(cart);
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(1.96, 1.96, 0.07, 28),
      mat(0x5a3a24, { roughness: 0.42 })
    );
    top.position.set(0, 0.8, 0);
    top.receiveShadow = true;
    scene.add(top);

    const copper = mat(0xb87333, { metalness: 0.86, roughness: 0.28, emissive: 0x4a1808, emissiveIntensity: 0.22 });
    const tubGroup = new THREE.Group();
    tubGroup.position.set(TUB.x, TUB.y, TUB.z);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.5, 0.24, 32, 1, true), copper);
    basin.castShadow = true;
    tubGroup.add(basin);
    const basinBot = new THREE.Mesh(new THREE.CircleGeometry(0.5, 28), copper);
    basinBot.rotation.x = -Math.PI / 2;
    basinBot.position.y = -0.12;
    tubGroup.add(basinBot);
    const rimC = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.032, 8, 32), copper);
    rimC.rotation.x = Math.PI / 2;
    rimC.position.y = 0.12;
    tubGroup.add(rimC);
    const sugar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.46, 0.07, 24),
      mat(0xff8ec4, { emissive: 0xff4aa0, emissiveIntensity: 1.2, roughness: 0.32, transparent: true, opacity: 0.92 })
    );
    sugar.position.y = 0.02;
    tubGroup.add(sugar);
    const spinner = new THREE.Group();
    spinner.add(mesh(GEO.cyl, mat(0xd4a45a, { metalness: 0.8, roughness: 0.25, emissive: 0xff6aa8, emissiveIntensity: 0.55 }), 0.09, 0.16, 0.09, 0, 0.08, 0));
    spinner.add(mesh(GEO.sphere, mat(0xffb0d0, { emissive: 0xff5aa0, emissiveIntensity: 1.5, roughness: 0.28 }), 0.09, 0.09, 0.09, 0, 0.2, 0));
    for (let i = 0; i < 3; i += 1) {
      const arm = mesh(GEO.box, copper, 0.34, 0.03, 0.05, 0.2, 0.14, 0);
      arm.rotation.y = (i / 3) * TAU;
      spinner.add(arm);
    }
    tubGroup.add(spinner);
    scene.add(tubGroup);

    const sweetRing = new THREE.Mesh(
      new THREE.TorusGeometry(RING_R, 0.028, 10, 64),
      mat(0xff9ec8, { emissive: 0xff6aa8, emissiveIntensity: 0.95, transparent: true, opacity: 0.78, roughness: 0.28 })
    );
    sweetRing.rotation.x = Math.PI / 2;
    sweetRing.position.set(TUB.x, TUB.y + 0.02, TUB.z);
    scene.add(sweetRing);

    const heatRing = new THREE.Mesh(
      new THREE.TorusGeometry(HEAT_R, 0.016, 8, 40),
      mat(0xc41e3a, { emissive: 0xff2244, emissiveIntensity: 0.4, transparent: true, opacity: 0.35, roughness: 0.4 })
    );
    heatRing.rotation.x = Math.PI / 2;
    heatRing.position.set(TUB.x, TUB.y + 0.01, TUB.z);
    scene.add(heatRing);

    const arrows = new THREE.Group();
    const arrowMat = mat(0xffe08a, { emissive: 0xe8b84a, emissiveIntensity: 0.7, roughness: 0.35 });
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * TAU;
      const chev = mesh(GEO.cone, arrowMat, 0.05, 0.12, 0.05, Math.cos(a) * RING_R, TUB.y + 0.08, Math.sin(a) * RING_R);
      chev.rotation.z = -Math.PI / 2;
      chev.rotation.y = -a;
      arrows.add(chev);
    }
    scene.add(arrows);

    const hitPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    );
    hitPlane.rotation.x = -Math.PI / 2;
    hitPlane.position.y = TUB.y;
    scene.add(hitPlane);

    const puffMat = mat(0xff9ec8, { emissive: 0xff5aa0, emissiveIntensity: 1.15, roughness: 0.35, transparent: true, opacity: 0.92 });
    const ribbons = [];
    const ribbonGroup = new THREE.Group();
    scene.add(ribbonGroup);
    for (let i = 0; i < RIBBON_N; i += 1) {
      const r = makeRibbon(puffMat);
      ribbonGroup.add(r.mesh);
      ribbons.push(r);
    }

    const cone = makeConeMesh(1.35);
    cone.position.set(RING_R, TUB.y + 0.12, 0.2);
    scene.add(cone);
    const cloud = new THREE.Group();
    cone.add(cloud);
    const cloudMat = mat(0xffb0d4, { emissive: 0xff6aa8, emissiveIntensity: 0.85, roughness: 0.4, transparent: true, opacity: 0.92 });
    for (let i = 0; i < CLOUD_N; i += 1) {
      const p = new THREE.Mesh(GEO.sphereHi, cloudMat.clone());
      const u = i / CLOUD_N;
      p.position.set(Math.sin(i * 2.2) * (0.04 + u * 0.08), 0.2 + u * 0.55, Math.cos(i * 1.7) * (0.04 + u * 0.08));
      p.scale.setScalar(0.055 + u * 0.08);
      p.visible = false;
      p.userData = { vx: 0, vy: 0, vz: 0, scatter: 0, home: p.position.clone() };
      cloud.add(p);
    }

    const strandGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const strand = new THREE.Line(strandGeo, new THREE.LineBasicMaterial({
      color: 0xff9ec8, transparent: true, opacity: 0.0,
    }));
    scene.add(strand);

    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(SPARK_N * 3);
    const sparkVel = [];
    for (let i = 0; i < SPARK_N; i += 1) {
      sparkPos[i * 3] = 0;
      sparkPos[i * 3 + 1] = -8;
      sparkPos[i * 3 + 2] = 0;
      sparkVel.push({ vx: 0, vy: 0, vz: 0, life: 0 });
    }
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
    const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
      color: 0xffc0dc, size: 0.055, transparent: true, opacity: 0.9, depthWrite: false,
    }));
    scene.add(sparks);

    const motesGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(56 * 3);
    for (let i = 0; i < 56; i += 1) {
      motePos[i * 3] = (Math.random() - 0.5) * 7;
      motePos[i * 3 + 1] = 0.5 + Math.random() * 3.6;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    motesGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
    const motes = new THREE.Points(motesGeo, new THREE.PointsMaterial({
      color: 0xffc0dc, size: 0.04, transparent: true, opacity: 0.42, depthWrite: false,
    }));
    scene.add(motes);

    const gustStreaks = new THREE.Group();
    for (let i = 0; i < 7; i += 1) {
      const s = mesh(
        GEO.box,
        mat(0xfff4ea, { transparent: true, opacity: 0, emissive: 0xffe6f2, emissiveIntensity: 0.4 }),
        0.04, 0.02, 0.55, -1.2 + i * 0.35, TUB.y + 0.35, 0.4
      );
      gustStreaks.add(s);
    }
    scene.add(gustStreaks);

    const jars = new THREE.Group();
    [0xff9ec8, 0xffe08a, 0xc8f0e8].forEach((col, i) => {
      const jar = mesh(GEO.cyl, mat(col, { transparent: true, opacity: 0.55, roughness: 0.2, emissive: col, emissiveIntensity: 0.25 }), 0.1, 0.18, 0.1, -1.55 + i * 0.28, 0.98, 1.15);
      jars.add(jar);
    });
    scene.add(jars);
    for (let i = 0; i < 5; i += 1) {
      const spare = makeConeMesh(0.7);
      spare.position.set(-1.55 + i * 0.12, 0.9, 1.42);
      spare.rotation.z = 0.15 * (i % 2 ? 1 : -1);
      scene.add(spare);
    }

    const aura = makeAura();
    scene.add(aura);

    const wash = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ color: 0xff6aa8, transparent: true, opacity: 0, depthTest: false })
    );
    wash.renderOrder = 20;
    camera.add(wash);
    wash.position.z = -0.35;
    scene.add(camera);

    return {
      renderer, scene, camera, hitPlane, tubGroup, spinner, sugar, sweetRing, heatRing,
      arrows, cone, cloud, ribbons, strand, sparks, sparkVel, motes, gustStreaks,
      aura, tubLight, wash, sign,
    };
  }

  function burstSparks(x, y, z, n, speed) {
    if (!world) return;
    const pos = world.sparks.geometry.attributes.position;
    let spawned = 0;
    for (let i = 0; i < SPARK_N && spawned < n; i += 1) {
      const v = world.sparkVel[i];
      if (v.life > 0) continue;
      v.life = 0.55 + Math.random() * 0.4;
      const s = (speed || 1.4) * (0.5 + Math.random());
      const a = Math.random() * TAU;
      v.vx = Math.cos(a) * s;
      v.vy = 0.6 + Math.random() * 1.6;
      v.vz = Math.sin(a) * s;
      pos.setXYZ(i, x, y, z);
      spawned += 1;
    }
    pos.needsUpdate = true;
  }

  function setAuraMood(mood) {
    if (!world || !world.aura) return;
    world.aura.userData.mood = mood;
    world.aura.userData.moodT = 0.95;
  }

  function updateAura(dt, t) {
    const a = world && world.aura;
    if (!a) return;
    const ud = a.userData;
    ud.moodT = Math.max(0, ud.moodT - dt);
    const sway = REDUCE ? 0 : Math.sin(t * 1.4) * 0.05;
    ud.hip.rotation.y = sway;
    ud.head.rotation.y = sway * 0.55 - 0.2;
    if (ud.mood === "cheer" && ud.moodT > 0) {
      ud.armL.rotation.z = 2.15;
      ud.armR.rotation.z = -1.8;
    } else if (ud.mood === "point" && ud.moodT > 0) {
      ud.armR.rotation.z = -0.15;
      ud.armR.rotation.x = -0.95;
      ud.armL.rotation.z = 0.28;
    } else {
      ud.armL.rotation.z = 0.32 + Math.sin(t * 2.1) * 0.12;
      ud.armR.rotation.z = -0.5 + Math.sin(t * 1.6) * 0.08;
      ud.armR.rotation.x = -0.22;
    }
    if (ud.moodT <= 0) ud.mood = "idle";
  }

  function coneRadius() {
    return Math.hypot(input.x - TUB.x, input.z - TUB.z);
  }

  function clampPlay(x, z) {
    const dx = x - TUB.x;
    const dz = z - TUB.z;
    const r = Math.hypot(dx, dz) || 0.001;
    const nr = clamp(r, 0.32, 1.82);
    return { x: TUB.x + (dx / r) * nr, z: TUB.z + (dz / r) * nr };
  }

  function projectPointer(ev) {
    if (!world) return null;
    const canvas = world.renderer.domElement;
    const r = canvas.getBoundingClientRect();
    const t = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]) || ev;
    const sx = t.clientX - r.left;
    const sy = t.clientY - r.top;
    _v.set(TUB.x, TUB.y, TUB.z).project(world.camera);
    const tx = (_v.x * 0.5 + 0.5) * r.width;
    const ty = (-_v.y * 0.5 + 0.5) * r.height;
    const dx = sx - tx;
    const dy = sy - ty;
    const distPx = Math.hypot(dx, dy);
    if (distPx < 36) return { x: input.aimX, z: input.aimZ, skip: true };
    const ang = Math.atan2(dy, dx);
    const spec = liveSpec();
    let rad = RING_R;
    if (spec && spec.dualNeedle) {
      _v2.set(TUB.x + RING_R, TUB.y, TUB.z).project(world.camera);
      const rx = (_v2.x * 0.5 + 0.5) * r.width;
      const ry = (-_v2.y * 0.5 + 0.5) * r.height;
      const ringPx = Math.max(48, Math.hypot(rx - tx, ry - ty));
      rad = clamp(RING_R * (distPx / ringPx), 0.62, 1.78);
    }
    return {
      x: TUB.x + Math.cos(ang) * rad,
      z: TUB.z + Math.sin(ang) * rad,
      ang,
    };
  }

  function resize() {
    if (!world) return;
    const canvas = world.renderer.domElement;
    const host = canvas.parentElement || canvas;
    const w = Math.max(1, host.clientWidth || window.innerWidth);
    const h = Math.max(1, host.clientHeight || window.innerHeight);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.fov = w < 560 ? 54 : 46;
    world.camera.updateProjectionMatrix();
  }

  function killRibbon(rib) {
    rib.alive = false;
    rib.caught = false;
    rib.age = 0;
    rib.wind = 0;
    rib.mesh.visible = false;
  }

  function spawnRibbon(spec, forceAng) {
    if (!world) return null;
    const rib = world.ribbons.find((r) => !r.alive);
    if (!rib) return null;
    rib.alive = true;
    rib.caught = false;
    rib.age = 0;
    rib.wind = 0;
    rib.life = spec.flyLife || 2.6;
    rib.a0 = forceAng != null ? forceAng : Math.random() * TAU;
    rib.yieldM = 0.7 + Math.random() * 0.35;
    rib.flash = 0;
    rib.mesh.visible = true;
    rib.puffs.forEach((p) => { p.material.opacity = 0.92; p.material.emissiveIntensity = 1.15; });
    return rib;
  }

  function liveCount() {
    if (!world) return 0;
    let n = 0;
    for (let i = 0; i < world.ribbons.length; i += 1) if (world.ribbons[i].alive) n += 1;
    return n;
  }

  function caughtCount() {
    if (!world) return 0;
    let n = 0;
    for (let i = 0; i < world.ribbons.length; i += 1) if (world.ribbons[i].alive && world.ribbons[i].caught) n += 1;
    return n;
  }

  function ribbonPos(rib, i, spec, t) {
    const u = i / (PUFF_N - 1);
    if (rib.caught) {
      const wrap = rib.wind * 10 + u * 6 + t * 8;
      const cr = 0.05 + u * 0.05 + rib.wind * 0.04;
      return {
        x: input.x + Math.cos(wrap) * cr,
        y: TUB.y + 0.14 + u * 0.22 + rib.wind * 0.12,
        z: input.z + Math.sin(wrap) * cr,
      };
    }
    const age = rib.age;
    const spin = (spec.flySpin || 1.5) * (invertActive(spec) ? -1 : 1);
    const expand = (spec.flyR || 1.25);
    let rad = lerp(0.18, expand, Math.min(1, age / rib.life));
    if (run && run.gustUntil > (run.t || 0)) rad += (run.gustSign || 1) * (spec.gustJump || 0.18);
    const ang = rib.a0 + age * spin + u * 1.15;
    const rise = (spec.flyH || 0.45) * Math.sin(Math.min(1, age / rib.life) * Math.PI) * (1 - u * 0.25);
    return {
      x: TUB.x + Math.cos(ang) * rad,
      y: TUB.y + 0.16 + rise,
      z: TUB.z + Math.sin(ang) * rad,
    };
  }

  function tensionOf() {
    const spec = liveSpec();
    const band = liveBand(spec, simT);
    let lo = band.lo;
    let hi = band.hi;
    if (run && run.wasInBand) {
      lo = Math.max(0.08, lo - 0.07);
      hi = Math.min(0.92, hi + 0.08);
    }
    const speed = clamp(input.speed / SPEED_REF, 0, 1);
    const r = coneRadius();
    const radiusN = clamp((r - 0.34) / 1.55, 0, 1);
    const tooClose = r < HEAT_R;
    const invertOn = invertActive(spec) && isLive();
    const invertFail = invertOn && input.speedSigned > 0.45;
    const dirOk = !invertOn || input.speedSigned < -0.1;
    const inSpeed = !tooClose && speed >= lo && speed <= hi && dirOk && !invertFail;
    const inRad = !tooClose && radiusN >= lo && radiusN <= hi;
    const dual = !!(spec && spec.dualNeedle);
    const inBand = dual ? (inSpeed && inRad) : inSpeed;
    const over = !tooClose && (speed > hi || invertFail);
    const sag = tooClose || (!over && speed < lo);
    if (run) run.wasInBand = !!(inBand && input.down);
    return { lo: band.lo, hi: band.hi, speed, radiusN, tooClose, inBand, inSpeed, inRad, dual, over, sag, invertFail };
  }

  function paintGauges(st) {
    const n = el("fairyFlossNeedle");
    const n2 = el("fairyFlossNeedle2");
    const b = el("fairyFlossBand");
    const b2 = el("fairyFlossBand2");
    const rad = el("fairyFlossRadius");
    if (n) n.style.left = `${clamp(st.speed, 0, 1) * 100}%`;
    if (b) {
      b.style.left = `${st.lo * 100}%`;
      b.style.width = `${Math.max(4, (st.hi - st.lo) * 100)}%`;
    }
    if (rad) rad.hidden = !st.dual;
    if (st.dual) {
      if (n2) n2.style.left = `${clamp(st.radiusN, 0, 1) * 100}%`;
      if (b2) {
        b2.style.left = `${st.lo * 100}%`;
        b2.style.width = `${Math.max(4, (st.hi - st.lo) * 100)}%`;
      }
    }
  }

  function paintNeed() {
    if (!run || !run.spec) {
      setText("fairyFlossNeed", "0 / 0m");
      setText("fairyFlossMetresLive", "0.0m");
      return;
    }
    setText("fairyFlossMetresLive", `${run.totalMetres.toFixed(1)}m`);
    setText("fairyFlossNeed", `${run.totalMetres.toFixed(1)} / ${run.spec.metresNeeded}m`);
  }

  function addMetres(amount) {
    if (!isLive() || amount <= 0 || run.stageHold > 0) return;
    const before = run.totalMetres;
    run.totalMetres += amount;
    const tenths = Math.floor(run.totalMetres * 10) - Math.floor(before * 10);
    if (tenths > 0) run.score += tenths * SCORE_PER_TENTH;
    run.depth = heightDepth(run);
    if (run.kitRun) {
      run.kitRun.score = run.score;
      run.kitRun.depth = run.depth;
    }
    paintNeed();
    ensureHud();
    if (Math.floor(run.totalMetres) !== Math.floor(before)) {
      tellDepth(run.depth);
      if (typeof PF.refreshDepth === "function") PF.refreshDepth();
    }
    if (run.totalMetres >= run.spec.metresNeeded) clearStage();
  }

  function catchRibbon(rib, spec) {
    rib.caught = true;
    rib.flash = 1;
    sfx("tray");
    burstSparks(input.x, TUB.y + 0.2, input.z, 12, 0.9);
    punch.t = 0.7;
    punch.mag = 0.05;
    setAuraMood("cheer");
    if (!run.taughtCatch) {
      run.taughtCatch = true;
      showToast("ON THE CONE", "Keep circling — height is depth", 1100, "wind");
    }
    setText("fairyFlossStatus", `Winding. Height ${run.totalMetres.toFixed(1)}m. One snap kills.`);
  }

  function dropRibbon(rib, ate) {
    burstSparks(rib.puffs[0].position.x, rib.puffs[0].position.y, rib.puffs[0].position.z, 8, 0.6);
    killRibbon(rib);
    sfx("drop");
    if (ate && isLive() && run.spec.sagEats) {
      run.totalMetres = Math.max(0, run.totalMetres - 0.35);
      paintNeed();
    }
  }

  function doSnap(reason) {
    if (!isLive()) return;
    const spec = run.spec;
    if (run.fakeLeft > 0 && reason === "snap") {
      run.fakeLeft -= 1;
      showToast("FAKE SNAP", "Ignore the lie — keep winding", 900, "fake");
      punch.t = 0.4;
      punch.mag = 0.04;
      if (world) world.wash.material.opacity = 0.12;
      sfx("spit");
      return;
    }
    run.snaps += 1;
    tellStrike("snap");
    ensurePips(1);
    burstSparks(input.x, TUB.y + 0.25, input.z, 28, 1.8);
    punch.t = 1;
    punch.mag = 0.16;
    if (world) world.wash.material.opacity = 0.38;
    setAuraMood("point");
    scatterCloud();
    world.ribbons.forEach((r) => { if (r.caught) killRibbon(r); });
    sfx("stamp");
    showToast("SNAP", "The cloud died. Too fast.", 1100);
    setText("fairyFlossStatus", `SNAP — death at ${run.totalMetres.toFixed(1)}m.`);
    beginDeath("snap");
  }

  function scatterCloud() {
    if (!world) return;
    world.cloud.children.forEach((p) => {
      if (!p.visible) return;
      p.userData.scatter = 0.8;
      p.userData.vx = (Math.random() - 0.5) * 2.4;
      p.userData.vy = 0.8 + Math.random() * 1.6;
      p.userData.vz = (Math.random() - 0.5) * 2.4;
    });
  }

  function updateCloud(dt, t) {
    if (!world) return;
    const metres = run ? run.totalMetres : 0.4;
    const height = 0.28 + metres * 0.34;
    const want = metres > 0.04
      ? clamp(4 + Math.floor(metres * 4.2), 4, CLOUD_N)
      : (isLive() ? 2 : 5);
    world.cloud.children.forEach((p, i) => {
      const ud = p.userData;
      const u = i / Math.max(1, CLOUD_N - 1);
      const y = 0.2 + u * height;
      const rad = 0.045 + u * (0.07 + Math.min(0.16, metres * 0.012));
      const spin = t * 0.85 + i * 0.65;
      ud.home.set(Math.sin(spin) * rad, y, Math.cos(spin * 0.92) * rad);
      if (ud.scatter > 0) {
        ud.scatter -= dt;
        p.position.x += ud.vx * dt;
        p.position.y += ud.vy * dt;
        p.position.z += ud.vz * dt;
        ud.vy -= 2.8 * dt;
        p.material.opacity = Math.max(0, ud.scatter);
        if (ud.scatter <= 0) {
          p.visible = false;
          p.position.copy(ud.home);
          p.material.opacity = 0.92;
        }
        return;
      }
      p.visible = i < want;
      if (!p.visible) return;
      p.position.copy(ud.home);
      const s = 0.055 + u * 0.1 + Math.min(0.07, metres * 0.005) + Math.sin(t * 4 + i) * (REDUCE ? 0 : 0.008);
      p.scale.setScalar(s);
    });
  }

  function tickRibbons(dt, t, spec) {
    if (!world) return;
    const live = isLive() && run.stageHold <= 0;
    if (live) {
      run.spawnCd -= dt;
      if (run.spawnCd <= 0 && liveCount() < (spec.maxLive || 3)) {
        spawnRibbon(spec);
        run.spawnCd = (spec.spawnMs || 1000) / 1000;
      }
    } else if (!run || run.done) {
      if (liveCount() < 2 && Math.random() < dt * 0.8) spawnRibbon(spec);
    }

    const st = tensionOf();
    const catchR = (spec.catchR || 0.45) * (input.down ? 1.2 : 1);
    let winding = false;
    for (let i = 0; i < world.ribbons.length; i += 1) {
      const rib = world.ribbons[i];
      if (!rib.alive) continue;
      if (!rib.caught) {
        rib.age += dt;
        if (rib.age > rib.life) {
          killRibbon(rib);
          continue;
        }
        if (live) {
          const lead = ribbonPos(rib, 2, spec, t);
          const d = Math.hypot(lead.x - input.x, lead.z - input.z);
          const dy = Math.abs(lead.y - (TUB.y + 0.16));
          if (d < catchR && dy < 0.55) catchRibbon(rib, spec);
        }
      } else if (live && input.down && st.inBand) {
        rib.wind = Math.min(1, rib.wind + dt * 0.55);
        if (rib.wind >= 1) {
          burstSparks(input.x, TUB.y + 0.28, input.z, 10, 0.7);
          killRibbon(rib);
        }
      }
      for (let p = 0; p < rib.puffs.length; p += 1) {
        const pos = ribbonPos(rib, p, spec, t);
        rib.puffs[p].position.set(pos.x, pos.y, pos.z);
        const near = Math.hypot(pos.x - input.x, pos.z - input.z) < (catchR + 0.12);
        rib.puffs[p].material.emissiveIntensity = rib.caught ? 1.6 : (near ? 1.55 : 1.05);
        rib.puffs[p].material.opacity = rib.caught ? 0.96 : clamp(1.05 - rib.age / rib.life, 0.25, 0.95);
      }
    }
    if (live && input.down && st.inBand) {
      winding = true;
      run.overMs = 0;
      run.sagMs = 0;
      addMetres(dt * (spec.metrePerSecInBand || 0.4));
      if (!run.taughtWind) {
        run.taughtWind = true;
        showToast("WINDING", "Sugar climbs. Height is depth. Snap kills.", 1100, "wind");
      }
    } else if (live && input.down && input.grace <= 0 && (st.over || st.tooClose)) {
      run.overMs = (run.overMs || 0) + dt * 1000;
      if (run.overMs >= (spec.snapMs || 280)) {
        run.overMs = 0;
        doSnap("snap");
      }
    } else if (live && st.inBand) {
      run.overMs = 0;
      run.sagMs = 0;
    } else if (live && !input.down) {
      run.overMs = 0;
      run.sagMs = (run.sagMs || 0) + dt * 1000;
      if (run.sagMs >= 480) {
        run.sagMs = 0;
        world.ribbons.forEach((r) => { if (r.alive && r.caught) dropRibbon(r, true); });
      }
    }
    if (live && input.down && input.grace <= 0 && st.tooClose) {
      run.heatMs = (run.heatMs || 0) + dt * 1000;
      if (run.heatMs >= (spec.snapMs || 280)) {
        run.heatMs = 0;
        doSnap("snap");
      }
    } else run.heatMs = 0;

    if (live && spec.sagEats && !winding && caughtCount() === 0) {
      run.idleMs = (run.idleMs || 0) + dt * 1000;
      if (run.idleMs >= (spec.sagCatchMs || 520) && run.totalMetres > 0) {
        run.idleMs = 0;
        run.totalMetres = Math.max(0, run.totalMetres - 0.12);
        paintNeed();
        setCall("SAG EATS");
      }
    } else run.idleMs = 0;

    const pos = world.strand.geometry.attributes.position;
    pos.setXYZ(0, TUB.x, TUB.y + 0.18, TUB.z);
    pos.setXYZ(1, input.x, TUB.y + 0.16, input.z);
    pos.needsUpdate = true;
    world.strand.material.opacity = winding ? 0.7 : (caughtCount() ? 0.35 : 0.08);
  }

  function tickFx(dt, t, spec, st) {
    const rpm = (spec.tubRpm || 0.5) * (spec.pulse ? 1 + 0.42 * Math.sin(t * 3.2) : 1);
    world.spinner.rotation.y += dt * rpm * TAU * (invertActive(spec) ? -1 : 1);
    world.sugar.rotation.y += dt * rpm * 2.2;
    const inBand = st.inBand;
    world.sweetRing.material.emissiveIntensity = inBand ? 1.6 : (st.over ? 0.3 : 0.7);
    world.sweetRing.material.color.setHex(inBand ? 0x8ee08a : (st.over ? 0xff6a7a : 0xff9ec8));
    world.sweetRing.material.emissive.setHex(inBand ? 0x3aaa50 : (st.over ? 0xc41e3a : 0xff6aa8));
    world.heatRing.material.opacity = st.tooClose ? 0.85 : 0.28;
    world.heatRing.material.emissiveIntensity = st.tooClose ? 1.4 : 0.35;
    world.tubLight.intensity = 2.2 + Math.sin(t * 6) * 0.35 + (inBand ? 0.6 : 0);
    world.sweetRing.scale.setScalar(1);

    const dir = invertActive(spec) ? -1 : 1;
    world.arrows.rotation.y += dt * 1.2 * dir;
    world.arrows.visible = true;
    world.arrows.children.forEach((c) => {
      c.material.emissiveIntensity = invertActive(spec) ? 1.2 : 0.55;
      c.material.color.setHex(invertActive(spec) ? 0x8ee0d8 : 0xffe08a);
    });

    const gustOn = !!(run && run.gustUntil > (run.t || 0));
    world.gustStreaks.children.forEach((s, i) => {
      s.material.opacity = gustOn ? 0.4 : 0;
      s.position.x = -1.4 + ((t * 2.4 + i * 0.35) % 2.8);
    });

    const mote = world.motes.geometry.attributes.position;
    for (let i = 0; i < mote.count; i += 1) {
      let y = mote.getY(i) + dt * 0.14;
      if (y > 4.4) y = 0.4;
      mote.setY(i, y);
    }
    mote.needsUpdate = true;

    const pos = world.sparks.geometry.attributes.position;
    for (let i = 0; i < SPARK_N; i += 1) {
      const v = world.sparkVel[i];
      if (v.life <= 0) continue;
      v.life -= dt;
      v.vy -= 2.2 * dt;
      pos.setX(i, pos.getX(i) + v.vx * dt);
      pos.setY(i, pos.getY(i) + v.vy * dt);
      pos.setZ(i, pos.getZ(i) + v.vz * dt);
      if (v.life <= 0) pos.setY(i, -8);
    }
    pos.needsUpdate = true;

    if (world.wash.material.opacity > 0) world.wash.material.opacity *= 0.88;
    punch.t = Math.max(0, punch.t - dt * 3.1);
    updateCloud(dt, t);
  }

  function tickCamera(dt, t, st) {
    const metres = run ? run.totalMetres : 0;
    const want = CAM_PLAY.clone();
    want.y += Math.min(1.15, metres * 0.06);
    want.z += Math.min(1.7, metres * 0.09);
    if (intro < 1 && !REDUCE) {
      intro = Math.min(1, intro + dt * 0.55);
      const e = intro * intro * (3 - 2 * intro);
      world.camera.position.set(0, 1.55 + (want.y - 1.55) * e, 7.2 + (want.z - 7.2) * e);
    } else {
      world.camera.position.lerp(want, 0.08);
    }
    const hx = isLive() ? (input.x - TUB.x) * 0.18 : Math.sin(t * 0.32) * 0.22;
    look.lerp(_v2.set(hx, 1.08 + Math.min(1.15, metres * 0.08) + (run && run.dying ? -0.12 : 0), -0.08 + (input.z - TUB.z) * 0.08), 0.1);
    world.camera.position.x += hx * 0.35;
    if (punch.t > 0) {
      world.camera.position.x += (Math.random() - 0.5) * punch.mag * punch.t;
      world.camera.position.y += (Math.random() - 0.5) * punch.mag * punch.t;
    }
    if (!REDUCE) {
      world.camera.position.x += Math.sin(t * 0.7) * 0.03;
      world.camera.position.y += Math.sin(t * 1.05) * 0.016;
    }
    world.camera.lookAt(look);
  }

  function seatCone(ang) {
    const a = ang != null ? ang : Math.PI / 2;
    input.x = TUB.x + Math.cos(a) * RING_R;
    input.z = TUB.z + Math.sin(a) * RING_R;
    input.aimX = input.x;
    input.aimZ = input.z;
    input.ang = a;
    input.lastAng = a;
    input.speed = 0;
    input.speedSigned = 0;
  }

  function applyCone(dt, t) {
    if (input.grace > 0) input.grace = Math.max(0, input.grace - dt);
    if (!isLive() && !input.steer) {
      const a = t * 0.42;
      input.aimX = TUB.x + Math.cos(a) * RING_R;
      input.aimZ = TUB.z + Math.sin(a) * RING_R;
    }
    const a0 = Math.atan2(input.z - TUB.z, input.x - TUB.x);
    if (isLive() && !input.down) {
      input.speedSigned *= Math.pow(0.08, dt * 6);
      if (Math.abs(input.speedSigned) < 0.06) input.speedSigned = 0;
      input.speed = Math.abs(input.speedSigned);
    } else {
      const r0 = Math.max(0.62, coneRadius());
      const r1 = clamp(Math.hypot(input.aimX - TUB.x, input.aimZ - TUB.z), 0.62, 1.78);
      const a1 = Math.atan2(input.aimZ - TUB.z, input.aimX - TUB.x);
      const da = wrapAng(a1 - a0);
      const maxTurn = 6.8 * Math.max(dt, 0.008);
      const step = clamp(da, -maxTurn, maxTurn);
      const r = lerp(r0, r1, 0.5);
      const ang = a0 + step;
      input.x = TUB.x + Math.cos(ang) * r;
      input.z = TUB.z + Math.sin(ang) * r;
      const raw = step / Math.max(dt, 0.008);
      input.speedSigned = lerp(input.speedSigned || 0, raw, 0.42);
      input.speed = Math.abs(input.speedSigned);
      input.lastAng = ang;
      input.ang = ang;
    }
    const ang = Math.atan2(input.z - TUB.z, input.x - TUB.x);
    const r = coneRadius();
    const spin = input.down && input.speed > 0.4 ? t * 10 : t * 5;
    world.cone.position.set(input.x, TUB.y + 0.14 + Math.sin(t * 6) * 0.012, input.z);
    world.cone.rotation.y = ang + Math.PI / 2;
    world.cone.rotation.z = Math.sin(spin) * 0.08;
    world.cone.scale.setScalar(r < HEAT_R ? 1.05 : 1.35);
  }

  function tickEvents(dt, spec) {
    if (!isLive() || run.stageHold > 0) return;
    run.t = (run.t || 0) + dt;
    if (spec.gust || (spec.gustOnce && !run.gustDone)) {
      run.gustCd = (run.gustCd || 0) - dt;
      if (run.gustCd <= 0) {
        run.gustUntil = run.t + ((spec.gustMs || 500) / 1000);
        run.gustSign = Math.random() < 0.5 ? 1 : -1;
        run.gustCd = (spec.gustEveryMs || 2800) / 1000;
        if (spec.gustOnce) run.gustDone = true;
        showToast("GUST", "Ribbons shove — stay with them", 800, "gust");
        sfx("spit");
      }
    }
    if (spec.reversePulseMid && !run.revDone && run.totalMetres >= spec.metresNeeded * 0.45) {
      run.revDone = true;
      run.invertUntil = run.t + 4.2;
      showToast("REVERSE", "Circle the other way", 1000, "reverse");
    }
    if ((spec.fakeSnap || spec.fakeSnapOnce) && run.fakeArmed && run.t > run.fakeAt) {
      run.fakeArmed = false;
      doSnap("snap");
    }
  }

  function clearStage() {
    if (!isLive() || run.stageHold > 0) return;
    run.depth = heightDepth(run);
    run.score += CLEAR_BONUS;
    if (run.kitRun) {
      run.kitRun.depth = run.depth;
      run.kitRun.score = run.score;
    }
    tellDepth(run.depth);
    sfx("chapter");
    setAuraMood("cheer");
    PF.setAura("celebrate");
    const next = run.stage + 1;
    const nxt = fairyflossStageParams(next);
    if (!nxt) {
      beginDeath("souvenir");
      return;
    }
    showToast(run.spec.title, `${run.totalMetres.toFixed(1)}m LOCKED — TUB CLIMBS`, 900, "wind");
    setText("fairyFlossStatus", AURA_LINES.clear);
    run.stageHold = 0.9;
    run.pendingNext = next;
  }

  function beginDeath(reason) {
    if (!run || run.dying || run.done) return;
    run.dying = true;
    run.deathNote = reason;
    run.deathAt = performance.now();
    sfx("stamp");
    setAuraMood("point");
    PF.setAura(reason === "souvenir" ? "celebrate" : "badLuck");
    if (world) world.wash.material.opacity = reason === "souvenir" ? 0.1 : 0.42;
    if (reason === "snap") scatterCloud();
  }

  function enterStage(n) {
    const spec = fairyflossStageParams(n);
    if (!spec) {
      beginDeath("souvenir");
      return;
    }
    run.stage = n;
    run.spec = spec;
    run.spawnCd = 0.35;
    run.overMs = 0;
    run.sagMs = 0;
    run.heatMs = 0;
    run.idleMs = 0;
    run.gustUntil = 0;
    run.gustCd = (spec.gustEveryMs || 2600) / 1000;
    run.gustDone = false;
    run.revDone = false;
    run.invertUntil = 0;
    run.fakeLeft = spec.fakeSnap ? (spec.fakeSnapCount || 3) : (spec.fakeSnapOnce ? 1 : 0);
    run.fakeArmed = run.fakeLeft > 0;
    run.fakeAt = 1.8 + Math.random() * 1.4;
    run.t = 0;
    run.t0 = performance.now();
    input.grace = PRESS_GRACE;
    input.down = false;
    seatCone(Math.PI / 2);
    if (world) world.ribbons.forEach(killRibbon);
    ensureHud();
    ensurePips(spec.snapLimit);
    paintNeed();
    tellDepth(heightDepth(run));
    showToast(spec.coda ? "ENDLESS SUGAR" : "AUTHORED STAGE", `${spec.title} — ${roomTell(spec)}`, 1300);
    setCall("CIRCLE THE WHEEL — HEIGHT IS DEPTH");
    setText("fairyFlossStatus", spec.barker || `${spec.title} — drag a circle. Snap kills.`);
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
  }

  function ensureHud() {
    const hud = document.querySelector(`[data-runkit-hud="${GAME_ID}"]`);
    if (!hud) return;
    if (isLive() || (run && run.dying)) {
      hud.textContent = hudLine(liveSpec(), run.stage | 0);
      hud.hidden = false;
    } else {
      hud.textContent = "HEIGHT 0.0m";
      hud.hidden = true;
    }
  }

  function ensurePips(count) {
    const span = document.querySelector(`[data-runkit-strikes="${GAME_ID}"]`);
    if (!span) return;
    const n = Math.max(1, count || 1);
    if (span.querySelectorAll("i").length !== n) {
      span.innerHTML = Array.from({ length: n }, () => "<i></i>").join("");
    }
    const lit = run ? (run.snaps | 0) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < lit));
  }

  function resetPips() {
    const span = document.querySelector(`[data-runkit-strikes="${GAME_ID}"]`);
    if (!span) return;
    span.querySelectorAll("i").forEach((n) => n.classList.remove("on"));
  }

  function tellDepth(n) {
    if (run && run.kitRun && rk() && typeof rk().reportDepth === "function") {
      const spec = liveSpec();
      try { rk().reportDepth(run.kitRun, n | 0, { name: spec.title, coda: !!spec.coda }); } catch (_) { /* hud */ }
    }
    ensureHud();
  }

  function tellStrike(reason) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportStrike !== "function") return;
    try { rk().reportStrike(run.kitRun, reason); } catch (_) { /* pips */ }
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall through */ }
    }
    if (kit && typeof kit.persistRun === "function") kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "snap",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    const metres = payload.meta.totalMetres || 0;
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestFairyFloss = Math.max(state.bestFairyFloss || 0, payload.depth, Math.floor(metres));
      state.bestFairyFlossScore = Math.max(state.bestFairyFlossScore || 0, payload.score);
      state.bestFairyFlossMetres = Math.max(state.bestFairyFlossMetres || 0, metres);
    }
    closeKitRun(payload);
    if (kit && typeof kit.persistRun === "function") kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function lastDepth() {
    const state = PF.getState() || {};
    const keyed = state.lastRun && state.lastRun[GAME_ID];
    if (keyed && keyed.depth != null) return keyed.depth | 0;
    const last = state.lastRun;
    if (last && (last.game === GAME_ID || last.gameId === GAME_ID)) return last.depth | 0;
    return Math.max(state.bestFairyFloss || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }

  function challengeLine(n) {
    if (rk() && typeof rk().challengeText === "function") {
      try { return rk().challengeText("Fairy Floss", n, GAME_ID); } catch (_) { /* local */ }
    }
    return `Beat my Fairy Floss ${n}m on Penny Fever`;
  }

  function auraLine(reason, depth, metres) {
    if (reason === "leave") return AURA_LINES.leave;
    if (reason === "souvenir") return AURA_LINES.souvenir;
    if (depth <= 0) return AURA_LINES.shallow;
    if (depth >= 6) return AURA_LINES.deep(depth);
    if (metres >= 8) return AURA_LINES.snapDeep(metres.toFixed(1));
    return AURA_LINES.snap;
  }

  function stampDepthCopy() {
    const host = card();
    if (!host) return;
    const num = host.querySelector(".machine-number");
    if (num) num.textContent = DEPTH_COPY.machine;
    host.querySelectorAll("[data-pf-depth-copy]").forEach((p) => { p.textContent = DEPTH_COPY.body; });
    ensureHud();
    ensurePips();
    if (!isLive() && (!run || run.done)) setText("fairyFlossStatus", DEPTH_COPY.status);
  }

  function punchStart() {
    stampDepthCopy();
    setText("fairyFlossStatus", DEPTH_COPY.punch);
    const btn = el("fairyFlossStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
    }
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("fairyfloss")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function start() {
    if (isLive()) return;
    if (!ensureWorld()) {
      const fail = el("fairyFlossGlFail");
      if (fail) fail.hidden = false;
      setText("fairyFlossStatus", "This sugar wheel wants a WebGL tent.");
      showToast("NO WEBGL", "This tent needs a WebGL browser", 1600);
      return;
    }
    const fail = el("fairyFlossGlFail");
    if (fail) fail.hidden = true;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("fairyFlossStatus", "Out of demo coins · grant a pass");
      return;
    }
    run = {
      kitRun, stage: 1, depth: 0, score: 0, snaps: 0, totalMetres: 0,
      spec: null, done: false, dying: false, t0: performance.now(),
      stageHold: 0, pendingNext: 0, taughtCatch: false, taughtWind: false,
      wasInBand: false,
    };
    const startBtn = el("fairyFlossStart");
    if (startBtn) startBtn.disabled = true;
    const verdict = el("fairyFlossVerdict");
    if (verdict) verdict.hidden = true;
    if (kit && kit.hideResult) kit.hideResult("fairyFlossResult");
    PF.setTier("fairyFlossTier", "", "");
    kit.setMode(card(), "play");
    const hud = el("fairyFlossHud");
    const gauges = el("fairyFlossGauges");
    if (hud) hud.hidden = false;
    if (gauges) gauges.hidden = false;
    PF.focusCard("fairyFlossCard", true);
    enterStage(1);
    sfx("chapter");
    setAuraMood("cheer");
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    const metres = run.totalMetres || 0;
    run.depth = heightDepth(run);
    const depth = run.depth | 0;
    const score = run.score | 0;
    const death = reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : (run.deathNote || "snap"));
    persistDepth({
      depth, score, deathReason: death, cashedOut: death === "souvenir",
      meta: { stage: run.spec && run.spec.id, totalMetres: metres, height: metres, snaps: run.snaps, kind: run.spec && run.spec.kind },
    });
    stampDepthCopy();
    const startBtn = el("fairyFlossStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "WIND AGAIN · 1 demo coin";
    }
    PF.focusCard("fairyFlossCard", false);
    kit.setMode(card(), "result");
    const hud = el("fairyFlossHud");
    const gauges = el("fairyFlossGauges");
    if (hud) hud.hidden = true;
    if (gauges) gauges.hidden = true;
    const line = `HEIGHT ${metres.toFixed(1)}m · SCORE ${score}`;
    const aura = auraLine(reason, depth, metres);
    const challenge = challengeLine(Math.max(depth, Math.floor(metres)));
    const verdict = el("fairyFlossVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = reason === "leave" ? `Left the stall · ${line}` : `${aura} ${line}`;
    }
    kit.fillResult({
      root: "fairyFlossResult",
      depth: "fairyFlossResultDepth",
      score: "fairyFlossResultScore",
      aura: "fairyFlossResultAura",
      copied: "fairyFlossCopied",
    }, {
      depthLine: `HEIGHT ${metres.toFixed(1)}m`,
      scoreLine: `SCORE ${score} · ${death.replace(/_/g, " ").toUpperCase()}`,
      auraLine: aura,
    });
    setText("fairyFlossChallengeText", challenge);
    PF.setTier("fairyFlossTier", metres > 0 ? `${metres.toFixed(1)}m` : "HEIGHT", metres >= 3 ? "perfect" : "miss");
    setText("fairyFlossStatus", reason === "leave" ? "Left the stall." : (reason === "souvenir" ? "Sugar souvenir. Cloud keeps." : "Cloud snapped."));
    if (metres >= 1) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Fairy floss");
      PF.setAura(metres >= 6 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `${metres.toFixed(1)}m`, aura);
    } else {
      PF.award(0, false, "Fairy floss miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "FLOSS", aura);
    }
    PF.refreshNightBoard();
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
    showToast(reason === "souvenir" ? "SOUVENIR CLOUD" : "CLOUD SNAPPED", aura, 1600);
    setCall(reason === "souvenir" ? "SOUVENIR CLOUD" : "CLOUD SNAPPED");
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave" || reason === "souvenir") sealResult(reason);
    else beginDeath(reason);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!world || !cabinetOn()) return;
    const t = now * 0.001;
    simT = t;
    const dt = Math.min(0.033, lastT ? (now - lastT) / 1000 : 0.016);
    lastT = now;
    hideToastIfDue(now);

    const spec = liveSpec();
    if (run && run.stageHold > 0) {
      run.stageHold -= dt;
      if (run.stageHold <= 0 && run.pendingNext) {
        const n = run.pendingNext;
        run.pendingNext = 0;
        enterStage(n);
      }
    }
    if (run && run.dying && !run.done) {
      if (now - run.deathAt >= DEATH_HOLD_MS) sealResult(run.deathNote || "snap");
    }

    idleClock += dt;
    if (!isLive() && idleClock > 4.2) {
      idleClock = 0;
      idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
    }

    applyCone(dt, t);
    const st = tensionOf();
    paintGauges(st);
    tickRibbons(dt, t, spec);
    if (isLive()) tickEvents(dt, spec);
    updateAura(dt, t);
    tickFx(dt, t, spec, st);
    tickCamera(dt, t, st);

    if (isLive()) {
      let call = input.down ? "CIRCLE THE WHEEL" : "HOLD AND CIRCLE THE WHEEL";
      if (st.tooClose) call = "TOO CLOSE — BACK OFF THE HEATER";
      else if (st.invertFail) call = "REVERSE — OTHER WAY";
      else if (input.down && st.over) call = "EASE UP — SNAP IS DEATH";
      else if (!input.down) call = "HOLD AND CIRCLE — HEIGHT IS DEPTH";
      else if (st.dual && !st.inRad) call = "STAY ON THE GLOWING RING";
      else if (st.inBand) call = `WINDING — ${run.totalMetres.toFixed(1)}m`;
      setCall(call);
    } else if (run && run.done) {
      setCall(run.deathNote === "souvenir" ? "SOUVENIR CLOUD" : "CLOUD SNAPPED");
    } else {
      setCall("CIRCLE TO WIND · SNAP KILLS");
    }

    world.renderer.render(world.scene, world.camera);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function startLoop() {
    if (raf) return;
    lastT = 0;
    raf = requestAnimationFrame(loop);
  }

  function ensureWorld() {
    const canvas = el("fairyFlossCanvas");
    if (!canvas) return null;
    if (world) return world;
    try {
      world = buildWorld(canvas);
      resize();
      spawnRibbon(fairyflossStageParams(1));
      intro = 0;
    } catch (err) {
      setText("fairyFlossStatus", "This sugar wheel wants a WebGL tent.");
      const fail = el("fairyFlossGlFail");
      if (fail) fail.hidden = false;
      world = null;
    }
    return world;
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun || typeof kitRun.declare !== "function") return;
    try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already */ }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: fairyflossStageParams,
      codaParams: fairyflossCoda,
      mountParams: fairyflossMountParams,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function onPointerDown(ev) {
    if (!world) return;
    if (run && (run.dying || run.done)) return;
    if (!isLive()) {
      punchStart();
      return;
    }
    ev.preventDefault();
    const canvas = el("fairyFlossCanvas");
    try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
    input.down = true;
    input.steer = true;
    input.grace = PRESS_GRACE;
    const p = projectPointer(ev);
    if (p && !p.skip) {
      const a = Math.atan2(p.z - TUB.z, p.x - TUB.x);
      const rad = clamp(Math.hypot(p.x - TUB.x, p.z - TUB.z), 0.62, 1.78);
      input.x = TUB.x + Math.cos(a) * rad;
      input.z = TUB.z + Math.sin(a) * rad;
      input.aimX = input.x;
      input.aimZ = input.z;
      input.ang = a;
      input.lastAng = a;
      input.speed = 0;
      input.speedSigned = 0;
    }
  }

  function onPointerMove(ev) {
    if (!world) return;
    const p = projectPointer(ev);
    if (!p) return;
    input.steer = true;
    if (!isLive()) {
      input.aimX = p.x;
      input.aimZ = p.z;
      return;
    }
    if (!input.down) return;
    ev.preventDefault();
    if (p.skip) return;
    input.aimX = p.x;
    input.aimZ = p.z;
  }

  function onPointerUp() {
    input.down = false;
  }

  PF.registerVendor({
    id: "fairy-floss",
    playKey: "fairyfloss",
    chalk: "Circle the wheel. Sugar height is depth. Snap kills.",
    defaults: { bestFairyFloss: 0, bestFairyFlossScore: 0, bestFairyFlossMetres: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopLoop();
    },
    onShow() {
      stampDepthCopy();
      ensureWorld();
      resize();
      intro = REDUCE ? 1 : 0;
      startLoop();
    },
    onReset() {
      run = null;
      input.steer = false;
      const verdict = el("fairyFlossVerdict");
      if (verdict) verdict.hidden = true;
      if (kit && kit.hideResult) kit.hideResult("fairyFlossResult");
      const startBtn = el("fairyFlossStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      const hud = el("fairyFlossHud");
      const gauges = el("fairyFlossGauges");
      if (hud) hud.hidden = true;
      if (gauges) gauges.hidden = true;
      resetPips();
      stampDepthCopy();
      showToast("", "", 0);
      setCall("CIRCLE TO WIND · SNAP KILLS");
      if (world) world.ribbons.forEach(killRibbon);
      startLoop();
    },
    refreshDepth(state) {
      const nowM = isLive() || (run && run.dying) ? run.totalMetres : 0;
      setText("depthFlossNow", nowM ? nowM.toFixed(1) : "0");
      setText("depthFlossMetres", nowM ? `${nowM.toFixed(1)}m` : "0m");
      const bestM = Math.max(state.bestFairyFlossMetres || 0, (state.bestDepth && state.bestDepth.fairyfloss) || 0, state.bestFairyFloss || 0);
      setText("depthFlossBest", bestM ? Number(bestM).toFixed(1) : "—");
      setText("depthFlossBestM", bestM ? `${Number(bestM).toFixed(1)}m` : "—");
      const door = el("fairyFlossDoorBest");
      if (door) door.textContent = bestM ? `Height ${Number(bestM).toFixed(1)}m` : "Height —";
    },
    bind() {
      if (bound) return;
      bound = true;
      declareP0();
      ensureHud();
      ensurePips();
      const startBtn = el("fairyFlossStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = el("fairyFlossCanvas");
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
        canvas.addEventListener("pointermove", onPointerMove, { passive: false });
        canvas.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointercancel", onPointerUp);
        canvas.addEventListener("lostpointercapture", onPointerUp);
      }
      const copyBtn = el("fairyFlossChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = lastDepth();
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("fairyFlossCopied");
            if (copied) copied.hidden = false;
            setText("fairyFlossStatus", "Copied — send it");
          }, () => {
            setText("fairyFlossStatus", text);
          });
        });
      }
      stampDepthCopy();
      window.addEventListener("resize", () => { if (world && cabinetOn()) resize(); });
      if (cabinetOn()) {
        ensureWorld();
        startLoop();
      }
    },
  });
}
