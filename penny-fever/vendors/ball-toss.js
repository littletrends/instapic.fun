/* Barely-Fit Toss — Desktop Grok owns this tent. PF only. Never booth/port 6000. Never Imagine.
 * Reinvented 3D toss ALLEY (not a flat board): hanging hoops, sliding buckets, clown mouth,
 * cluster cans, spin wheel, decoy crate, keyhole door. One coin = one run. */
import * as THREE from "../world/lib/three.module.min.js";

function boot() {
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor || !PF.kit) {
    requestAnimationFrame(boot);
    return;
  }
  mountStall(PF);
}
boot();

function mountStall(PF) {
  "use strict";
  const { $, kit } = PF;
  const GAME_ID = "balltoss";
  const CODA_ENABLED = true;
  const AUTHORED_COUNT = 8;
  const BALL_R = 0.068;
  const GRAVITY = -7.15;
  const SINK_BASE = 10.6;
  const TEE = { x: 0, y: 0.84, z: 2.62 };
  const REDUCE = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;

  let run = null;
  let world = null;
  let raf = 0;
  let idleRoom = 1;
  let idleClock = 0;
  let lastTs = 0;
  let visible = false;

  const AURA = {
    oval: "Aura: That oval ate you.",
    spit: "Aura: Too hot on the throw — the hoop spat you out.",
    decoy: "Aura: That crate isn’t a hole.",
    keyhole: "Aura: The keyhole wanted a needle, not a prayer.",
    closed: "Aura: Three misses. The alley closed on you.",
    shallow: "Aura: Three misses. Not a single hoop.",
    mid: "Aura: Cute racks. The oval’s still hungry.",
    deep: "Aura: Barely-fit and you still threaded it. Dangerous.",
    souvenir: "Aura: Warp Keyhole survived. Souvenir — the alley tipped its hat.",
    coda: "Aura: Authored racks done. ENDLESS — the crate still lies.",
    leave: "Aura: Walking off mid-rack? Coward’s stamp.",
  };

  const AUTHORED_RACKS = [
    { id: 1, name: "Honest Hoops", kind: "triangle", holeScale: 1, spitSpeed: 1.15, sway: 0, rotate: 0, rotateAmp: 0, spd: 0, barker: "Three hanging brass hoops. Soft thread. Heaters spit." },
    { id: 2, name: "Pendulum Hoops", kind: "pendulum", holeScale: 0.96, spitSpeed: 1.16, sway: 0, rotate: 0, rotateAmp: 0, spd: 0.00165, barker: "Each hoop swings on its own string. Lead the one you want." },
    { id: 3, name: "Sway Buckets", kind: "diamond", holeScale: 1, spitSpeed: 1.15, sway: 1, rotate: 0, rotateAmp: 0, spd: 0.00115, barker: "Four buckets on one sliding rail. Time the whole shelf — not a pendulum." },
    { id: 4, name: "Oval Mouth", kind: "ovalLiar", holeScale: 1, spitSpeed: 1.15, sway: 0, rotate: 0, rotateAmp: 0, spd: 0, barker: "Three hoops and a clown. Only the painted pink corridor of the oval sinks." },
    { id: 5, name: "Cluster Cans", kind: "cluster", holeScale: 1, spitSpeed: 1.18, sway: 0, rotate: 0, rotateAmp: 0, spd: 0, clusterRims: true, barker: "Fist of five can mouths. Side walls are dead plywood." },
    { id: 6, name: "Spin Wheel", kind: "spinFive", holeScale: 0.88, spitSpeed: 1.15, sway: 0, rotate: 1, rotateAmp: 12 * Math.PI / 180, spd: 0.00095, barker: "Wagon wheel rocks ±12°. Lead the spoke — not a slide." },
    { id: 7, name: "Decoy Crate", kind: "decoyFive", holeScale: 1, spitSpeed: 1.15, sway: 0, rotate: 0, rotateAmp: 0, spd: 0, decoyDent: true, barker: "Six juicy buckets. They all look honest." },
    { id: 8, name: "Warp Keyhole", kind: "warpKeyhole", holeScale: 1, spitSpeed: 1.12, sway: 0.5, rotate: 0.5, rotateAmp: 0.09, spd: 0.0009, barker: "Hoop, oval corridor, keyhole slot, tiny far ring. Four aim verbs." },
  ];

  const P0_MOUNT = {
    engine: "SlingAim",
    displayName: "Barely-Fit Toss",
    depthUnit: "Rack",
    sheet: "GOBLIN_BATCH01_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const geoBox = new THREE.BoxGeometry(1, 1, 1);
  const geoSphere = new THREE.SphereGeometry(1, 16, 12);
  const geoCyl = new THREE.CylinderGeometry(1, 1, 1, 12);
  const _v = new THREE.Vector3();
  const _v2 = new THREE.Vector3();
  const _v3 = new THREE.Vector3();
  const _q = new THREE.Quaternion();
  const _q2 = new THREE.Quaternion();
  const _ndc = new THREE.Vector2();
  const _ray = new THREE.Raycaster();
  const _plane = new THREE.Plane();
  const _hit = new THREE.Vector3();

  function rk() { return PF.runKit || null; }
  function card() { return $("ballTossCard"); }

  function codaOn() {
    const kitRun = rk();
    const row = kitRun && ((kitRun.declared && kitRun.declared[GAME_ID]) || (kitRun.p0 && kitRun.p0[GAME_ID]));
    if (row && typeof row.codaEnabled === "boolean") return !!row.codaEnabled;
    return !!P0_MOUNT.codaEnabled;
  }

  function codaRack(n) {
    const t = Math.max(0, n - AUTHORED_COUNT - 1);
    return {
      id: n,
      name: `Warp Coda ${n}`,
      kind: "codaFive",
      holeScale: Math.max(0.55, 0.72 - t * 0.02),
      spitSpeed: 1.24,
      sway: 1,
      rotate: 1,
      rotateAmp: 0.14,
      spd: 0.0016,
      decoyDent: n % 2 === 1,
      coda: true,
      barker: "ENDLESS — sway, spin, and the crate still lies.",
    };
  }

  function balltossStage(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) {
      return Object.assign({ missesToDeath: 3, coda: false }, AUTHORED_RACKS[stage - 1]);
    }
    if (!codaOn()) return null;
    return Object.assign({ missesToDeath: 3 }, codaRack(stage));
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    const spec = Object.assign({
      authored: AUTHORED_RACKS,
      authoredCount: AUTHORED_COUNT,
      codaEnabled: CODA_ENABLED,
      codaParams: codaRack,
      level: balltossStage,
      stageParams: balltossStage,
    }, P0_MOUNT);
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, spec); } catch (_) { /* already */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = spec;
    kitRun.declared = kitRun.declared || {};
    kitRun.declared[GAME_ID] = spec;
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function stageSpec(n) {
    const stage = Math.max(1, n | 0);
    const p = balltossStage(stage);
    if (!p) return null;
    return {
      stage,
      id: p.id || stage,
      name: p.name,
      kind: p.kind,
      scale: Math.max(0.55, p.holeScale != null ? p.holeScale : 1),
      sway: p.sway || 0,
      rotate: p.rotate || 0,
      rotateAmp: p.rotateAmp || 0,
      decoy: p.decoyDent ? 1 : 0,
      spd: p.spd || 0,
      spitSpeed: p.spitSpeed,
      missesToDeath: p.missesToDeath || 3,
      clusterRims: !!p.clusterRims || p.kind === "cluster",
      coda: !!p.coda,
      barker: p.barker || "",
    };
  }

  function T(kind, x, y, z, rx, ry, extra) {
    return Object.assign({
      kind, x, y, z, rx, ry: ry || rx, rot: 0,
      hit: false,
      decoy: kind === "decoy",
      oval: kind === "oval",
      keyhole: kind === "keyhole",
      tiny: kind === "tiny",
      spitFlash: 0,
      lock: 0,
      exposed: false,
      prevZ: null,
    }, extra || {});
  }

  function layoutTargets(spec) {
    const r = 0.114 * spec.scale;
    const kind = spec.kind;
    if (kind === "triangle") {
      return [
        T("hoop", 0, 1.46, -0.82, r),
        T("hoop", -0.44, 1.08, -0.82, r),
        T("hoop", 0.44, 1.08, -0.82, r),
      ];
    }
    if (kind === "pendulum") {
      return [
        T("hoop", 0, 1.46, -0.82, r, r, { phase: 0 }),
        T("hoop", -0.48, 1.1, -0.82, r, r, { phase: 2.2 }),
        T("hoop", 0.48, 1.1, -0.82, r, r, { phase: 4.4 }),
      ];
    }
    if (kind === "diamond") {
      return [
        T("bucket", 0, 1.58, -0.95, r * 1.05),
        T("bucket", -0.62, 1.18, -0.95, r * 1.05),
        T("bucket", 0.62, 1.18, -0.95, r * 1.05),
        T("bucket", 0, 0.82, -0.95, r * 1.05),
      ];
    }
    if (kind === "ovalLiar") {
      return [
        T("hoop", -0.78, 1.48, -0.55, r * 0.92),
        T("hoop", 0.78, 1.52, -0.55, r * 0.92),
        T("hoop", -0.72, 0.82, -0.55, r * 0.92),
        T("oval", 0.08, 1.18, -1.45, r * 3.2, r * 0.95, { rot: -0.12 }),
      ];
    }
    if (kind === "cluster") {
      const out = [];
      const rad = 0.2;
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
        out.push(T("can", Math.cos(a) * rad, 1.18 + Math.sin(a) * rad * 0.9, -0.92, r * 0.8, r * 0.74));
      }
      return out;
    }
    if (kind === "spinFive") {
      const out = [];
      const rad = 0.5;
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
        out.push(T("hoop", Math.cos(a) * rad, 1.2 + Math.sin(a) * rad * 0.82, -1.05, r, r * 0.92));
      }
      return out;
    }
    if (kind === "decoyFive") {
      return [
        T("bucket", -0.72, 1.52, -0.88, r),
        T("bucket", 0, 1.62, -0.88, r),
        T("bucket", 0.72, 1.52, -0.88, r),
        T("bucket", -0.68, 0.82, -0.88, r),
        T("bucket", 0.68, 0.82, -0.88, r),
        T("decoy", 0, 1.16, -0.7, r, r),
      ];
    }
    if (kind === "warpKeyhole") {
      return [
        T("hoop", -0.72, 1.22, -0.55, r),
        T("hoop", 0.72, 1.16, -0.55, r),
        T("oval", 0.04, 1.58, -1.15, r * 2.2, r * 0.8, { rot: -0.1 }),
        T("keyhole", -0.42, 0.92, -1.7, r * 0.5, r * 2.05),
        T("tiny", 0.62, 0.82, -1.95, r * 0.46, r * 0.42),
      ];
    }
    const out = [];
    const rad = 0.48;
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const oval = spec.coda && i === 1;
      out.push(T(
        oval ? "oval" : "hoop",
        Math.cos(a) * rad,
        1.18 + Math.sin(a) * rad * 0.78,
        -1.0,
        oval ? r * 1.5 : r,
        oval ? r * 0.46 : r * 0.9,
        oval ? { rot: -0.14 } : {}
      ));
    }
    if (spec.decoy) out.push(T("decoy", 0, 1.18, -0.78, r * 0.95, r * 0.88));
    return out;
  }

  function makePack(stage) {
    const spec = stageSpec(stage);
    if (!spec) return null;
    return { spec, targets: layoutTargets(spec) };
  }

  function liveTargets(list) { return list.filter((t) => !t.decoy); }

  function hudRack(spec) {
    if (!spec) return "RACK";
    if (spec.coda) return `ENDLESS · RACK ${spec.stage} · ${spec.name}`;
    return `RACK ${spec.stage} · ${spec.name}`;
  }

  function roomTell(spec) {
    if (!spec) return "HOLES THAT BARELY FIT";
    if (spec.kind === "triangle") return "THREE HANGING BRASS HOOPS";
    if (spec.kind === "pendulum") return "EACH HOOP SWINGS — LEAD IT";
    if (spec.kind === "diamond") return "THE WHOLE RAIL SLIDES — TIME IT";
    if (spec.kind === "ovalLiar") return "OVAL WANTS THE PINK CORRIDOR";
    if (spec.kind === "cluster") return "CAN FIST · WALLS ARE DEAD";
    if (spec.kind === "spinFive") return "WHEEL TURNS ±12° · LEAD THE SPOKE";
    if (spec.kind === "decoyFive") {
      const lied = run && run.targets && run.targets.some((t) => t.decoy && t.exposed);
      return lied ? "PLYWOOD LIE — THAT BUCKET WAS A DENT" : "SIX JUICY BUCKETS";
    }
    if (spec.kind === "warpKeyhole") return "HOOP · OVAL · KEYHOLE · TINY";
    if (spec.coda) return "ENDLESS · SWAY + SPIN + CRATE";
    return "HOLES THAT BARELY FIT";
  }

  function challengeLine(n) { return `Beat my Ball Toss rack ${n | 0} on Penny Fever`; }

  function auraLine(reason, racks, lastNote) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "coda" || (run && run.spec && run.spec.coda && racks >= AUTHORED_COUNT)) return AURA.coda;
    if (lastNote === "oval") return AURA.oval;
    if (lastNote === "keyhole") return AURA.keyhole;
    if (lastNote === "decoy") return AURA.decoy;
    if (lastNote === "spit") return AURA.spit;
    if (racks <= 0) return AURA.shallow;
    if (racks >= 7) return AURA.deep;
    if (racks >= 3) return AURA.mid;
    return AURA.closed;
  }

  function isLive() {
    return !!(run && !run.done && run.kitRun && run.kitRun.alive !== false);
  }

  function canGL() {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch (_) { return false; }
  }

  function canvasTex(w, h, draw, rx, ry) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx || 1, ry || 1);
    t.anisotropy = 4;
    t.needsUpdate = true;
    return t;
  }

  function makeMat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.72, metalness: 0.08 }, extra || {}));
  }

  function meshBox(mat, sx, sy, sz, x, y, z) {
    const m = new THREE.Mesh(geoBox, mat);
    m.scale.set(sx, sy, sz);
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
    const m = new THREE.Mesh(rTop === rBot ? geoCyl : new THREE.CylinderGeometry(rTop, rBot, h, 12), mat);
    if (rTop === rBot) m.scale.set(rTop, h, rBot);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function woodTex(tint) {
    return canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = tint || "#4a2c1c";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 22; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${0.04 + (i % 3) * 0.03})`;
        ctx.fillRect(i * 12 + 3, 0, 3, 256);
      }
    }, 2, 2);
  }

  function stripeTex() {
    return canvasTex(256, 256, (ctx) => {
      for (let i = 0; i < 8; i += 1) {
        ctx.fillStyle = i % 2 ? "#7a1c2e" : "#f3d6b0";
        ctx.fillRect(i * 32, 0, 32, 256);
      }
    }, 3, 2);
  }

  function sawdustTex() {
    return canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 80; i += 1) {
        ctx.fillStyle = i % 2 ? "rgba(212,164,90,0.18)" : "rgba(20,10,8,0.2)";
        ctx.fillRect((i * 37) % 256, (i * 53) % 256, 18, 3);
      }
    }, 4, 4);
  }

  const brass = () => makeMat(0xd4a45a, { metalness: 0.55, roughness: 0.32, emissive: 0x4a3010, emissiveIntensity: 0.22 });
  const wellMat = () => makeMat(0x080406, { roughness: 1, metalness: 0, transparent: true, opacity: 0.55, side: THREE.DoubleSide });

  function inEllipse(px, py, rx, ry) {
    const nx = px / Math.max(0.001, rx);
    const ny = py / Math.max(0.001, ry);
    return nx * nx + ny * ny <= 1;
  }

  function ovalLocal(px, py, rot) {
    const c = Math.cos(-(rot || 0));
    const s = Math.sin(-(rot || 0));
    return { lx: px * c - py * s, ly: px * s + py * c };
  }

  function inStadium(px, py, rx, ry, rot) {
    const loc = ovalLocal(px, py, rot);
    const cr = Math.min(ry, rx * 0.48);
    const mid = Math.max(0, rx - cr);
    if (Math.abs(loc.lx) <= mid) return Math.abs(loc.ly) <= ry;
    const ex = Math.abs(loc.lx) - mid;
    return ex * ex + loc.ly * loc.ly <= cr * cr;
  }

  function ovalCorridor(t, px, py) {
    const loc = ovalLocal(px, py, t.rot);
    const axis = Math.max(0.028, Math.min(t.ry * 0.34, BALL_R * 0.78));
    return Math.abs(loc.ly) <= axis && Math.abs(loc.lx) <= t.rx * 0.92;
  }

  function inKeyhole(t, px, py) {
    const headR = Math.max(0.048, t.rx * 1.55);
    const headY = t.ry * 0.38;
    const inHead = Math.hypot(px, py - headY) <= headR;
    const slotW = t.rx * 0.82;
    const slotTop = headY - headR * 0.42;
    const inSlot = Math.abs(px) <= slotW && py <= slotTop && py >= -t.ry * 0.98;
    return inHead || inSlot;
  }

  function covers(t, lx, ly) {
    if (t.keyhole) return inKeyhole(t, lx, ly);
    if (t.oval) return inStadium(lx, ly, t.rx, t.ry, t.rot);
    return inEllipse(lx, ly, t.rx, t.ry);
  }

  function makePerson(opts) {
    const g = new THREE.Group();
    const skin = makeMat(opts.skin || SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const cloth = makeMat(opts.cloth || 0x3a3040);
    const dark = makeMat(opts.shoes || 0x1a1a1a);
    g.scale.setScalar(opts.scale || 1.12);
    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(meshCyl(cloth, 0.13, 0.15, 0.28, 0, 0.28, 0));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.12, 0.34, 12), cloth);
    skirt.position.y = 0.06;
    hip.add(skirt);
    const head = new THREE.Group();
    head.position.y = 0.62;
    hip.add(head);
    head.add(meshSphere(skin, 0.185, 0, 0.02, 0));
    const eyeW = makeMat(0xf7f2ea);
    const eyeD = makeMat(0x2a1810);
    [-1, 1].forEach((side) => {
      const white = meshSphere(eyeW, 0.038, side * 0.055, 0.03, 0.15);
      white.scale.set(0.038, 0.044, 0.02);
      head.add(white);
      head.add(meshSphere(eyeD, 0.02, side * 0.055, 0.03, 0.168));
      head.add(meshSphere(makeMat(0xffffff), 0.01, side * 0.048, 0.045, 0.18));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), makeMat(0xc45a6a));
    smile.position.set(0, -0.05, 0.16);
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
    g.userData = { t: Math.random() * 10, armL: limb(-1, true), armR: limb(1, true), head, hip, mood: "wave" };
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
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, h, 6), gold);
      spike.position.set(x, h * 0.45, 0);
      crown.add(spike);
    });
    const gem = meshBox(makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.7 }), 0.055, 0.055, 0.025, 0, 0.02, 0.11);
    gem.rotation.z = Math.PI / 4;
    crown.add(gem);
  }

  function disposeObj(obj) {
    if (!obj) return;
    obj.traverse((child) => {
      if (child.geometry && child.geometry.dispose && child.geometry !== geoBox && child.geometry !== geoSphere && child.geometry !== geoCyl) {
        child.geometry.dispose();
      }
      const mat = child.material;
      if (!mat) return;
      (Array.isArray(mat) ? mat : [mat]).forEach((m) => {
        if (m.map && m.map.dispose) m.map.dispose();
        if (m.dispose) m.dispose();
      });
    });
  }

  function makeHoop(t) {
    const g = new THREE.Group();
    const torus = new THREE.Mesh(new THREE.TorusGeometry(t.rx, 0.018, 8, 22), brass());
    g.add(torus);
    const well = new THREE.Mesh(new THREE.CircleGeometry(t.rx * 0.9, 18), wellMat());
    g.add(well);
    const rope = meshCyl(makeMat(0x3a2418), 0.007, 0.007, 0.85, 0, t.rx + 0.42, 0);
    g.add(rope);
    t.rim = torus;
    return g;
  }

  function makeBucket(t) {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ map: woodTex("#6a4024"), roughness: 0.78 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(t.rx * 1.05, t.rx * 0.92, 0.28, 14, 1, true), wood);
    body.rotation.x = Math.PI / 2;
    body.position.z = -0.14;
    g.add(body);
    const back = new THREE.Mesh(new THREE.CircleGeometry(t.rx * 0.92, 14), makeMat(0x2a1810));
    back.position.z = -0.28;
    g.add(back);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(t.rx, 0.016, 8, 18), brass());
    g.add(rim);
    const well = new THREE.Mesh(new THREE.CircleGeometry(t.rx * 0.9, 16), wellMat());
    g.add(well);
    t.rim = rim;
    t.well = well;
    return g;
  }

  function makeCan(t) {
    const g = new THREE.Group();
    const tin = makeMat(0xc0c4cc, { metalness: 0.45, roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(t.rx, t.rx * 0.95, 0.2, 12, 1, true), tin);
    body.rotation.x = Math.PI / 2;
    body.position.z = -0.1;
    g.add(body);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(t.rx, 0.012, 8, 16), brass());
    g.add(rim);
    const well = new THREE.Mesh(new THREE.CircleGeometry(t.rx * 0.88, 14), wellMat());
    g.add(well);
    t.rim = rim;
    return g;
  }

  function makeOval(t) {
    const g = new THREE.Group();
    g.rotation.z = t.rot || 0;
    const head = meshSphere(makeMat(0xf0c4a8, { roughness: 0.65 }), 0.42, 0, 0.08, -0.22);
    g.add(head);
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.38, 8), makeMat(0xc41e3a));
    hat.position.set(0, 0.52, -0.18);
    g.add(hat);
    const pom = meshSphere(makeMat(0xffe6a6), 0.07, 0, 0.72, -0.18);
    g.add(pom);
    [-1, 1].forEach((s) => g.add(meshSphere(makeMat(0x2a1810), 0.045, s * 0.12, 0.16, 0.12)));
    const mouth = new THREE.Mesh(new THREE.TorusGeometry((t.rx + t.ry) * 0.42, 0.02, 8, 24), makeMat(0xe8a0b8, { emissive: 0x6a2038, emissiveIntensity: 0.45 }));
    mouth.scale.set(t.rx / 0.28, t.ry / 0.12, 1);
    g.add(mouth);
    const well = new THREE.Mesh(new THREE.CircleGeometry(1, 20), wellMat());
    well.scale.set(t.rx, t.ry, 1);
    g.add(well);
    const corridor = meshBox(makeMat(0xe8a0b8, { emissive: 0xe8a0b8, emissiveIntensity: 0.7 }), t.rx * 1.72, Math.max(0.016, t.ry * 0.28), 0.012, 0, 0, 0.02);
    g.add(corridor);
    t.rim = mouth;
    t.well = well;
    return g;
  }

  function makeKeyhole(t) {
    const g = new THREE.Group();
    const door = meshBox(new THREE.MeshStandardMaterial({ map: woodTex("#3a2418") }), 0.7, 1.35, 0.08, 0, 0.1, -0.05);
    g.add(door);
    const plate = meshBox(brass(), 0.22, 0.55, 0.03, 0, 0.02, 0.02);
    g.add(plate);
    const well = meshBox(makeMat(0x080406), t.rx * 1.6, t.ry * 1.6, 0.04, 0, 0, 0.04);
    g.add(well);
    const head = new THREE.Mesh(new THREE.CircleGeometry(Math.max(0.05, t.rx * 1.5), 12), wellMat());
    head.position.y = t.ry * 0.38;
    g.add(head);
    t.rim = plate;
    return g;
  }

  function makeTiny(t) {
    const g = makeHoop(t);
    return g;
  }

  function makeDecoy(t) {
    const g = makeBucket(t);
    const plug = new THREE.Group();
    plug.visible = false;
    const ply = new THREE.Mesh(new THREE.CircleGeometry(t.rx * 0.92, 16), new THREE.MeshStandardMaterial({ map: woodTex("#6a3a18"), color: 0x8a5628 }));
    ply.position.z = 0.012;
    plug.add(ply);
    const slash = makeMat(0xc41e3a, { emissive: 0xc41e3a, emissiveIntensity: 0.85 });
    const a = meshBox(slash, t.rx * 1.35, 0.018, 0.02, 0, 0, 0.02);
    a.rotation.z = 0.55;
    const b = meshBox(slash, t.rx * 1.35, 0.018, 0.02, 0, 0, 0.02);
    b.rotation.z = -0.55;
    plug.add(a);
    plug.add(b);
    g.add(plug);
    t.plug = plug;
    t.fake = ply;
    return g;
  }

  function exposeDecoy(t) {
    t.exposed = true;
    if (t.well) {
      t.well.material = new THREE.MeshStandardMaterial({ map: woodTex("#6a3a18"), color: 0x8a5628, roughness: 0.85 });
    }
    if (t.plug) t.plug.visible = true;
    if (t.rim) {
      t.rim.material.color.setHex(0xc41e3a);
      t.rim.material.emissive = new THREE.Color(0xc41e3a);
      t.rim.material.emissiveIntensity = 1.35;
    }
    paintHud();
  }

  function meshFor(t) {
    if (t.kind === "bucket") return makeBucket(t);
    if (t.kind === "can") return makeCan(t);
    if (t.kind === "oval") return makeOval(t);
    if (t.kind === "keyhole") return makeKeyhole(t);
    if (t.kind === "tiny") return makeTiny(t);
    if (t.kind === "decoy") return makeDecoy(t);
    return makeHoop(t);
  }

  function wrapText(ctx, text, x, y, max, lh) {
    const words = (text || "").split(" ");
    let line = "";
    let yy = y;
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > max) {
        ctx.fillText(line, x, yy);
        line = w;
        yy += lh;
      } else line = test;
    });
    if (line) ctx.fillText(line, x, yy);
  }

  function paintSign(spec) {
    if (!world || !world.signTex) return;
    const ctx = world.signCtx;
    ctx.fillStyle = "#1b3a28";
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 492, 236);
    ctx.fillStyle = "#f0d09a";
    ctx.font = "700 28px Georgia, serif";
    ctx.fillText(spec ? hudRack(spec) : "BARELY-FIT TOSS", 28, 64);
    ctx.fillStyle = "#e8f0d8";
    ctx.font = "20px Georgia, serif";
    wrapText(ctx, spec ? spec.barker : "Holes that barely fit.", 28, 108, 456, 28);
    world.signTex.needsUpdate = true;
  }

  function rebuildRig(spec, targets) {
    if (!world) return;
    if (world.rig) {
      world.scene.remove(world.rig);
      disposeObj(world.rig);
    }
    const rig = new THREE.Group();
    world.scene.add(rig);
    world.rig = rig;
    if (spec.kind === "spinFive" || spec.kind === "codaFive") {
      const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.06, 22), new THREE.MeshStandardMaterial({ map: woodTex("#5a341f") }));
      disk.rotation.x = Math.PI / 2;
      disk.position.set(0, 1.2, -1.12);
      rig.add(disk);
      const spoke = meshBox(makeMat(0xe8a0b8, { emissive: 0x6a2038, emissiveIntensity: 0.4 }), 0.04, 0.7, 0.03, 0, 1.48, -1.08);
      rig.add(spoke);
    }
    if (spec.kind === "cluster") {
      const dead = makeMat(0x1a100c);
      const L = meshBox(dead, 0.12, 2.2, 1.4, -0.95, 1.2, -0.9);
      const R = meshBox(dead, 0.12, 2.2, 1.4, 0.95, 1.2, -0.9);
      rig.add(L);
      rig.add(R);
      world.deadL = L;
      world.deadR = R;
    } else {
      world.deadL = null;
      world.deadR = null;
    }
    targets.forEach((t) => {
      const mesh = meshFor(t);
      mesh.position.set(t.x, t.y, t.z);
      rig.add(mesh);
      t.group = mesh;
      t.prevZ = null;
    });
    paintSign(spec);
  }

  function currentTargets() {
    if (run && run.targets) return run.targets;
    return (world && world.idleTargets) || [];
  }

  function applyRigXform(t, spec) {
    if (!world || !world.rig || !spec) return;
    const kind = spec.kind;
    if (kind === "pendulum") {
      world.rig.position.x = 0;
      world.rig.rotation.z = 0;
      currentTargets().forEach((tgt) => {
        if (!tgt.group) return;
        const swing = Math.sin(t * (spec.spd || 0.00165) + (tgt.phase || 0)) * 0.2;
        tgt.group.position.x = tgt.x + swing;
        tgt.group.rotation.z = swing * 0.55;
      });
      return;
    }
    const swayAmt = kind === "spinFive" ? 0 : (spec.sway ? Math.sin(t * (spec.spd || 0.0012)) * (0.28 * spec.sway) : 0);
    const amp = spec.rotateAmp || 0;
    const rot = kind === "diamond" ? 0 : (spec.rotate ? Math.sin(t * (spec.spd || 0.0012) * (kind === "spinFive" ? 1 : 0.85) + 0.4) * amp : 0);
    world.rig.position.x = swayAmt;
    world.rig.rotation.z = rot;
  }

  function plush(color, x, y, z) {
    const g = new THREE.Group();
    const fur = makeMat(color, { roughness: 0.9 });
    g.add(meshSphere(fur, 0.1, 0, 0.08, 0));
    g.add(meshSphere(fur, 0.06, -0.07, 0.15, 0.02));
    g.add(meshSphere(fur, 0.06, 0.07, 0.15, 0.02));
    g.position.set(x, y, z);
    return g;
  }

  function buildTent(scene) {
    const tent = new THREE.Group();
    const stripe = stripeTex();
    const canvasMat = new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.86, metalness: 0.02, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 9.2), new THREE.MeshStandardMaterial({ map: sawdustTex(), roughness: 0.95 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0.4);
    tent.add(floor);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3.8), canvasMat);
    back.position.set(0, 1.9, -3.45);
    tent.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 3.8), canvasMat.clone());
    left.position.set(-3.5, 1.9, 0.2);
    left.rotation.y = Math.PI / 2;
    tent.add(left);
    const right = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 3.8), canvasMat.clone());
    right.position.set(3.5, 1.9, 0.2);
    right.rotation.y = -Math.PI / 2;
    tent.add(right);
    const roofL = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 4.4), canvasMat.clone());
    roofL.position.set(-1.6, 3.55, 0.2);
    roofL.rotation.set(0.15, 0, 0.42);
    tent.add(roofL);
    const roofR = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 4.4), canvasMat.clone());
    roofR.position.set(1.6, 3.55, 0.2);
    roofR.rotation.set(0.15, 0, -0.42);
    tent.add(roofR);
    const post = makeMat(0x3a2418);
    tent.add(meshBox(post, 0.14, 2.8, 0.14, -1.5, 1.4, -0.4));
    tent.add(meshBox(post, 0.14, 2.8, 0.14, 1.5, 1.4, -0.4));
    tent.add(meshBox(post, 3.2, 0.1, 0.1, 0, 2.72, -0.4));
    const counter = meshBox(new THREE.MeshStandardMaterial({ map: woodTex("#4a2e1c"), roughness: 0.7 }), 2.4, 0.16, 0.7, 0, 0.7, 2.58);
    tent.add(counter);
    tent.add(meshCyl(makeMat(0x2a1810), 0.05, 0.07, 0.08, TEE.x, TEE.y - 0.08, TEE.z));
    const shelf = meshBox(new THREE.MeshStandardMaterial({ map: woodTex("#5a3a22") }), 2.2, 0.08, 0.36, 0, 2.42, -2.55);
    tent.add(shelf);
    const plushes = [];
    [[-0.7, 0xc45a3a], [-0.22, 0xe8c45a], [0.22, 0x3a8a6a], [0.7, 0x3a6aaa]].forEach((row, i) => {
      const p = plush(row[1], row[0], 2.54, -2.55);
      p.userData.baseY = 2.54;
      p.userData.phase = i * 0.9;
      tent.add(p);
      plushes.push(p);
    });
    const marquee = canvasTex(768, 192, (ctx) => {
      ctx.fillStyle = "#3a1018";
      ctx.fillRect(0, 0, 768, 192);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, 752, 176);
      ctx.fillStyle = "#ffe6a6";
      ctx.font = "700 64px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("BARELY-FIT TOSS", 384, 88);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "26px Georgia, serif";
      ctx.fillText("HOOPS · BUCKETS · A MOUTH THAT LIES", 384, 140);
    });
    const sign = new THREE.Mesh(geoBox, new THREE.MeshBasicMaterial({ map: marquee }));
    sign.scale.set(2.5, 0.58, 0.06);
    sign.position.set(0, 3.05, -2.5);
    tent.add(sign);
    const chalk = document.createElement("canvas");
    chalk.width = 512;
    chalk.height = 256;
    const signTex = new THREE.CanvasTexture(chalk);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(geoBox, new THREE.MeshBasicMaterial({ map: signTex }));
    board.scale.set(1.15, 0.58, 0.04);
    board.position.set(1.9, 1.55, -0.35);
    board.rotation.y = -0.55;
    tent.add(board);
    const net = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8, 8, 6), new THREE.MeshBasicMaterial({ color: 0x3d8a8a, transparent: true, opacity: 0.22, wireframe: true }));
    net.position.set(0, 0.55, -2.7);
    tent.add(net);
    const bulbMat = makeMat(0xffe2a0, { emissive: 0xffc878, emissiveIntensity: 0.9 });
    const bulbs = [];
    for (let i = 0; i < 14; i += 1) {
      const u = i / 13;
      const b = meshSphere(bulbMat, 0.045, (u - 0.5) * 5.6, 3.15 + Math.sin(u * Math.PI) * 0.18, -2.9);
      tent.add(b);
      bulbs.push(b);
    }
    tent.add(meshBox(new THREE.MeshStandardMaterial({ map: woodTex("#4a2a18") }), 0.42, 0.28, 0.42, -1.55, 0.14, 0.15));
    const aura = makePerson({ scale: 1.18 });
    dressAura(aura);
    aura.position.set(-1.55, 0.28, 0.15);
    aura.rotation.y = 0.85;
    tent.add(aura);
    const motesGeo = new THREE.BufferGeometry();
    const motes = new Float32Array(70 * 3);
    for (let i = 0; i < 70; i += 1) {
      motes[i * 3] = (Math.random() - 0.5) * 6;
      motes[i * 3 + 1] = 0.4 + Math.random() * 3;
      motes[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    motesGeo.setAttribute("position", new THREE.BufferAttribute(motes, 3));
    const motePts = new THREE.Points(motesGeo, new THREE.PointsMaterial({ color: 0xf0d09a, size: 0.035, transparent: true, opacity: 0.45, depthWrite: false }));
    tent.add(motePts);
    scene.add(tent);
    return { tent, aura, plushes, bulbs, motePts, signTex, signCtx: chalk.getContext("2d") };
  }

  function makeBallMesh() {
    const mat = makeMat(0xc41e3a, { roughness: 0.38, metalness: 0.12, emissive: 0x4a0810, emissiveIntensity: 0.18 });
    const m = meshSphere(mat, BALL_R, TEE.x, TEE.y, TEE.z);
    m.add(meshSphere(makeMat(0xfff6ec, { roughness: 0.2 }), 0.018, -0.02, 0.02, 0.03));
    return m;
  }

  function makeTrail() {
    const mats = [];
    const meshes = [];
    for (let i = 0; i < 12; i += 1) {
      const mat = makeMat(0xc41e3a, { transparent: true, opacity: 0.18, roughness: 0.5 });
      const m = meshSphere(mat, BALL_R * (0.55 - i * 0.03), 0, -10, 0);
      m.visible = false;
      mats.push(mat);
      meshes.push(m);
    }
    return { meshes, mats };
  }

  function makeConfetti(scene) {
    const bits = [];
    const colors = [0xc41e3a, 0xe8c45a, 0x3d8a8a, 0xe8a0b8, 0xf0d09a];
    for (let i = 0; i < 36; i += 1) {
      const m = meshBox(makeMat(colors[i % colors.length], { emissive: colors[i % colors.length], emissiveIntensity: 0.25 }), 0.04, 0.01, 0.06, 0, -4, 0);
      m.visible = false;
      m.userData.v = new THREE.Vector3();
      scene.add(m);
      bits.push(m);
    }
    return bits;
  }

  function makeSparks(scene) {
    const bits = [];
    for (let i = 0; i < 22; i += 1) {
      const m = meshSphere(makeMat(0xff6a3a, { emissive: 0xff3310, emissiveIntensity: 1.2 }), 0.018, 0, -6, 0);
      m.visible = false;
      m.userData.v = new THREE.Vector3();
      scene.add(m);
      bits.push(m);
    }
    return bits;
  }

  function tickSparks(dt) {
    if (!world || !world.sparks) return;
    world.sparks.forEach((s) => {
      if (!s.visible) return;
      s.userData.life -= dt;
      if (s.userData.life <= 0) { s.visible = false; return; }
      s.userData.v.y += GRAVITY * dt * 0.4;
      s.position.addScaledVector(s.userData.v, dt);
      s.scale.setScalar(Math.max(0.2, s.userData.life * 3));
    });
  }

  function flashSpitLabel(kind) {
    const el = $("ballTossSpit");
    if (!el) return;
    el.hidden = false;
    el.textContent = kind === "decoy" ? "PLYWOOD" : "SPIT";
    el.classList.toggle("is-lie", kind === "decoy");
    clearTimeout(world.spitHide);
    world.spitHide = setTimeout(() => { el.hidden = true; }, kind === "decoy" ? 980 : 560);
  }

  function burstSpit(origin, towardCam) {
    if (!world || !world.sparks) return;
    world.sparks.forEach((s) => {
      s.visible = true;
      s.position.copy(origin);
      s.userData.v.set((Math.random() - 0.5) * 2.4, 0.6 + Math.random() * 2.2, (towardCam ? 2.4 : 0.4) + Math.random() * 1.6);
      s.userData.life = 0.28 + Math.random() * 0.22;
    });
  }

  function makeArcLine() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xf0d09a, transparent: true, opacity: 0.85 }));
    line.frustumCulled = false;
    line.visible = false;
    return line;
  }

  function ensureWorld() {
    if (world) return world;
    const canvas = $("ballTossCanvas");
    if (!canvas || !canGL()) return null;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: (window.devicePixelRatio || 1) < 1.6,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x14080c, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x14080c, 0.042);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.08, 40);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    camera.position.set(0.2, 1.95, 6.7);
    camera.lookAt(0, 1.2, -1.0);
    scene.add(new THREE.AmbientLight(0x4a3028, 0.7));
    scene.add(new THREE.HemisphereLight(0x8aa4cc, 0x2a1410, 0.55));
    const lantern = new THREE.PointLight(0xffc090, 2.4, 10, 1.6);
    lantern.position.set(-1.6, 2.4, 0.8);
    scene.add(lantern);
    const key = new THREE.SpotLight(0xffd0a0, 3.2, 14, 0.55, 0.45, 1.2);
    key.position.set(0.4, 3.1, 3.2);
    key.target.position.set(0, 1.2, -1.0);
    scene.add(key);
    scene.add(key.target);
    const fill = new THREE.PointLight(0x3d8a8a, 0.7, 8, 2);
    fill.position.set(1.6, 1.8, 1.2);
    scene.add(fill);
    const built = buildTent(scene);
    const ball = makeBallMesh();
    scene.add(ball);
    const trail = makeTrail();
    trail.meshes.forEach((m) => scene.add(m));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 22), makeMat(0x7ad4c8, { emissive: 0x3d8a8a, emissiveIntensity: 0.8, transparent: true, opacity: 0.9 }));
    ring.visible = false;
    scene.add(ring);
    const arc = makeArcLine();
    scene.add(arc);
    world = {
      renderer, scene, camera, ball, trail, ring, arc,
      confetti: makeConfetti(scene),
      sparks: makeSparks(scene),
      rig: null, lastSpec: null, shake: 0, camPunch: 0,
      ...built,
    };
    const pack = makePack(1);
    rebuildRig(pack.spec, pack.targets);
    world.lastSpec = pack.spec;
    world.idleTargets = pack.targets;
    resize();
    if (!world.ro && typeof ResizeObserver !== "undefined") {
      const stage = $("ballTossStage");
      world.ro = new ResizeObserver(() => resize());
      if (stage) world.ro.observe(stage);
    }
    return world;
  }

  function resize() {
    if (!world) return;
    const stage = $("ballTossStage") || $("ballTossCanvas");
    const canvas = $("ballTossCanvas");
    if (!stage || !canvas) return;
    const w = Math.max(280, stage.clientWidth || 340);
    const h = Math.max(320, stage.clientHeight || 440);
    world.renderer.setPixelRatio(Math.min(1.85, window.devicePixelRatio || 1));
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function setAuraMood(mood) {
    if (world && world.aura) world.aura.userData.mood = mood || "wave";
  }

  function tickAura(dt, t) {
    if (!world || !world.aura) return;
    const u = world.aura.userData;
    u.t += dt;
    u.hip.position.y = 0.42 + (REDUCE ? 0 : Math.sin(u.t * 3.1) * 0.012);
    u.armL.rotation.z = 0.15;
    u.armR.rotation.z = -0.15;
    u.armR.rotation.x = 0;
    u.head.rotation.x = 0;
    u.head.rotation.y = 0;
    u.head.rotation.z = 0;
    if (u.mood === "wave") u.armR.rotation.z = -0.35 + Math.sin(u.t * 5.5) * 0.75;
    else if (u.mood === "point") { u.armR.rotation.z = -1.15; u.armR.rotation.x = -0.45; u.head.rotation.y = 0.35; }
    else if (u.mood === "cheer") { u.armL.rotation.z = 1.25; u.armR.rotation.z = -1.25; }
    else if (u.mood === "sad") { u.head.rotation.x = 0.28; }
    else if (u.mood === "laugh") { u.head.rotation.z = Math.sin(u.t * 10) * 0.08; u.armR.rotation.z = -0.8; }
    world.plushes.forEach((p) => {
      p.position.y = p.userData.baseY + (REDUCE ? 0 : Math.abs(Math.sin(t * 0.002 + p.userData.phase)) * 0.03);
      p.rotation.y = Math.sin(t * 0.001 + p.userData.phase) * 0.15;
    });
    if (world.bulbs[0]) world.bulbs[0].material.emissiveIntensity = 0.7 + Math.sin(t * 0.004) * 0.3;
    const pos = world.motePts.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      let y = pos.getY(i) + dt * (0.04 + (i % 5) * 0.01);
      if (y > 3.4) y = 0.3;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  }

  function burstConfetti() {
    if (!world) return;
    world.confetti.forEach((m, i) => {
      m.visible = true;
      m.position.set((Math.random() - 0.5) * 1.4, 1.7, -0.6);
      m.userData.v.set((Math.random() - 0.5) * 1.8, 1.6 + Math.random() * 1.4, (Math.random() - 0.4) * 1.2);
      m.userData.life = 0.9 + Math.random() * 0.4;
      m.rotation.set(Math.random(), Math.random(), i * 0.2);
    });
  }

  function tickConfetti(dt) {
    if (!world) return;
    world.confetti.forEach((m) => {
      if (!m.visible) return;
      m.userData.life -= dt;
      if (m.userData.life <= 0) { m.visible = false; return; }
      m.userData.v.y += GRAVITY * dt * 0.55;
      m.position.addScaledVector(m.userData.v, dt);
      m.rotation.x += dt * 4;
    });
  }

  function setTrailFrom(ball) {
    if (!world) return;
    if (!ball) { world.trail.meshes.forEach((m) => { m.visible = false; }); return; }
    if (!ball.hist) ball.hist = [];
    ball.hist.push({ x: ball.x, y: ball.y, z: ball.z });
    if (ball.hist.length > 12) ball.hist.shift();
    world.trail.meshes.forEach((m, i) => {
      const p = ball.hist[ball.hist.length - 1 - i];
      if (!p) { m.visible = false; return; }
      m.visible = true;
      m.position.set(p.x, p.y, p.z);
      world.trail.mats[i].opacity = 0.28 - i * 0.02;
    });
  }

  function pointerToAim(ev) {
    const canvas = $("ballTossCanvas");
    if (!canvas || !world) return null;
    const r = canvas.getBoundingClientRect();
    const pt = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]) || ev;
    _ndc.set(((pt.clientX - r.left) / Math.max(1, r.width)) * 2 - 1, -((pt.clientY - r.top) / Math.max(1, r.height)) * 2 + 1);
    _ray.setFromCamera(_ndc, world.camera);
    const list = currentTargets();
    let best = null;
    let bestScore = Infinity;
    for (let i = 0; i < list.length; i += 1) {
      const tgt = list[i];
      if (!tgt.group) continue;
      const n = _v.set(0, 0, 1).applyQuaternion(tgt.group.getWorldQuaternion(_q));
      const p = tgt.group.getWorldPosition(_v2);
      _plane.setFromNormalAndCoplanarPoint(n, p);
      if (!_ray.ray.intersectPlane(_plane, _hit)) continue;
      const local = tgt.group.worldToLocal(_hit.clone());
      const radial = Math.hypot(local.x, local.y);
      const holeR = Math.max(tgt.rx, tgt.ry);
      if (radial > holeR * 2.6) continue;
      const d = _ray.ray.origin.distanceTo(_hit);
      const score = d + (covers(tgt, local.x, local.y) ? 0 : 0.4);
      if (score < bestScore) {
        bestScore = score;
        best = _hit.clone();
      }
    }
    if (best) return best;
    _plane.setFromNormalAndCoplanarPoint(_v.set(0, 0, 1), _v2.set(0, 1.18, -1.05));
    if (_ray.ray.intersectPlane(_plane, _hit)) return _hit.clone();
    return new THREE.Vector3(0, 1.2, -1.0);
  }

  function pullPower(ev, aim) {
    const canvas = $("ballTossCanvas");
    const r = canvas.getBoundingClientRect();
    const pt = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]) || ev;
    const dx = pt.clientX - aim.sx;
    const dy = pt.clientY - aim.sy;
    const power = kit.clamp(Math.hypot(dx, dy) / Math.max(110, r.height * 0.22), 0, 1);
    const nudge = kit.clamp(dx / Math.max(140, r.width * 0.35), -0.28, 0.28);
    const loft = kit.clamp(-dy / Math.max(180, r.height * 0.34), -0.12, 0.16);
    return { power, nudge, loft };
  }

  function throwSpeed(power) { return 5.7 + power * 5.9; }

  function velTo(from, to, speed) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const dist = Math.hypot(dx, dz);
    const g = Math.abs(GRAVITY);
    const v2 = speed * speed;
    const disc = v2 * v2 - g * (g * dist * dist + 2 * dy * v2);
    let pitch = disc < 0 || dist < 0.15 ? 0.52 : Math.atan((v2 - Math.sqrt(Math.max(0, disc))) / (g * Math.max(0.2, dist)));
    pitch = kit.clamp(pitch, 0.18, 0.72);
    const yaw = Math.atan2(dx, -dz);
    const cp = Math.cos(pitch);
    return { vx: Math.sin(yaw) * cp * speed, vy: Math.sin(pitch) * speed, vz: -Math.cos(yaw) * cp * speed };
  }

  function predictArc(from, vel) {
    const pts = [];
    let x = from.x; let y = from.y; let z = from.z;
    let vx = vel.vx; let vy = vel.vy; let vz = vel.vz;
    for (let i = 0; i < 24; i += 1) {
      vy += GRAVITY * 0.045;
      x += vx * 0.045; y += vy * 0.045; z += vz * 0.045;
      pts.push({ x, y, z });
      if (y < 0.05 || z < -3.2) break;
    }
    return pts;
  }

  function showAimViz(aim) {
    if (!world || !aim) { hideAimViz(); return; }
    const vel = velTo(TEE, aim.target, throwSpeed(aim.power));
    const pts = predictArc(TEE, vel);
    const pos = world.arc.geometry.attributes.position;
    for (let i = 0; i < 24; i += 1) {
      const p = pts[i] || pts[pts.length - 1] || TEE;
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    pos.needsUpdate = true;
    world.arc.geometry.setDrawRange(0, Math.max(2, pts.length));
    world.arc.visible = true;
    world.ring.position.copy(aim.target);
    world.ring.lookAt(world.camera.position);
    let color = 0xf0d09a;
    const list = (run && run.targets) || (world.idleTargets || []);
    for (const t of list) {
      if (!t.group) continue;
      const local = t.group.worldToLocal(_v.copy(aim.target));
      if (Math.abs(local.z) < 0.35 && covers(t, local.x, local.y)) {
        color = (t.decoy && t.exposed) ? 0xc41e3a : t.oval ? 0xe8a0b8 : t.keyhole ? 0xb8e8e0 : 0x7ad4c8;
        break;
      }
    }
    world.ring.material.color.setHex(color);
    world.ring.material.emissive.setHex(color);
    world.ring.visible = true;
    const bar = $("ballTossPower");
    if (bar) { bar.hidden = false; bar.style.setProperty("--power", String(aim.power)); }
  }

  function hideAimViz() {
    if (world) { world.ring.visible = false; world.arc.visible = false; }
    const bar = $("ballTossPower");
    if (bar) bar.hidden = true;
    const canvas = $("ballTossCanvas");
    if (canvas) canvas.classList.remove("is-pulling");
  }

  function paintHud() {
    const spec = run && !run.done ? run.spec : world && world.lastSpec;
    const room = $("ballTossRoomCard");
    if (room) {
      const live = isLive();
      room.hidden = !live;
      if (live && spec) {
        const kicker = $("ballTossRoomKicker");
        const title = $("ballTossHudRack");
        const tell = $("ballTossHudTell");
        if (kicker) kicker.textContent = spec.coda ? "ENDLESS" : "AUTHORED RACK";
        if (title) title.textContent = hudRack(spec);
        if (tell) tell.textContent = roomTell(spec);
      }
    }
    const pips = $("ballTossPips");
    if (pips) {
      const n = run && !run.done ? run.misses : 0;
      pips.querySelectorAll("i").forEach((el, i) => el.classList.toggle("is-miss", i < n));
    }
    const hint = $("ballTossHint");
    if (hint) hint.hidden = !(isLive() && run && !run.ball && !run.aim);
    const stamp = $("ballTossStamp");
    if (stamp) stamp.hidden = !(run && run.closedStamp);
  }

  function status(text) {
    const el = $("ballTossStatus");
    if (el) el.textContent = text;
  }

  function beginKitRun() {
    if (typeof PF.spendDemoCoin === "function") {
      if (!PF.spendDemoCoin(GAME_ID)) return null;
    }
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      try {
        const ctx = PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1, feverNode: true });
        if (ctx) return ctx;
      } catch (_) { /* local */ }
    }
    return { gameId: GAME_ID, startedAt: Date.now(), feverNode: true, feverGate: null, depth: 0, score: 0, strikes: 0, alive: true };
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try { return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false }); } catch (_) { /* persist */ }
    }
    kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = { depth: partial.depth | 0, score: partial.score | 0, deathReason: partial.deathReason || "miss", cashedOut: !!partial.cashedOut, meta: partial.meta || {} };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestBallToss = Math.max(state.bestBallToss || 0, payload.depth);
      state.bestBallTossScore = Math.max(state.bestBallTossScore || 0, payload.score);
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function qaStartAt() {
    const kitRun = rk();
    const n = kitRun && kitRun._qaStart && (kitRun._qaStart[GAME_ID] | 0);
    if (kitRun && kitRun._qaStart) kitRun._qaStart[GAME_ID] = 0;
    return n >= 1 ? n : 1;
  }

  function resetTee() {
    if (!world) return;
    world.ball.visible = true;
    world.ball.scale.setScalar(1);
    world.ball.position.set(TEE.x, TEE.y, TEE.z);
    if (world.ball.material) {
      world.ball.material.emissive = new THREE.Color(0x4a0810);
      world.ball.material.emissiveIntensity = 0.18;
    }
    setTrailFrom(null);
  }

  function enterRack(n) {
    const pack = makePack(n);
    if (!pack) return false;
    run.spec = pack.spec;
    run.targets = pack.targets;
    run.misses = 0;
    rebuildRig(pack.spec, pack.targets);
    world.lastSpec = pack.spec;
    status(`${hudRack(run.spec)} — ${run.spec.barker}`);
    paintHud();
    setAuraMood("point");
    return true;
  }

  function start() {
    if (run && !run.done) return;
    declareP0();
    if (!ensureWorld()) { status("This tent needs a 3D lantern (WebGL)."); return; }
    const kitRun = beginKitRun();
    if (!kitRun) { status("Out of demo coins · grant a pass"); PF.refreshNightBoard(); return; }
    const pack = makePack(qaStartAt());
    if (!pack) return;
    run = {
      done: false, kitRun, t: 0, racks: 0, hits: 0, misses: 0, score: 0, combo: 1,
      spec: pack.spec, targets: pack.targets, ball: null, aim: null,
      closedStamp: false, lastNote: "", doomed: "", resolving: false,
    };
    rebuildRig(pack.spec, pack.targets);
    world.lastSpec = pack.spec;
    resetTee();
    const canvas = $("ballTossCanvas");
    if (canvas) canvas.classList.remove("is-locked");
    if (rk() && typeof rk().reportDepth === "function") {
      try { rk().reportDepth(kitRun, pack.spec.stage, { name: pack.spec.name, coda: !!pack.spec.coda }); } catch (_) { /* hud */ }
    }
    const startBtn = $("ballTossStart");
    if (startBtn) { startBtn.disabled = true; startBtn.hidden = true; }
    const verdict = $("ballTossVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("ballTossResult");
    PF.setTier("ballTossTier", "", "");
    const stamp = $("ballTossStamp");
    if (stamp) stamp.hidden = true;
    const spitEl = $("ballTossSpit");
    if (spitEl) spitEl.hidden = true;
    kit.setMode(card(), "play");
    status(`${hudRack(run.spec)} — ${run.spec.barker}`);
    paintHud();
    PF.focusCard("ballTossCard", true);
    PF.setAura("think");
    setAuraMood("point");
    loopOn();
  }

  function awardSink(t) {
    const gained = Math.round(100 * run.combo);
    run.score += gained;
    if (run.kitRun) run.kitRun.score = run.score;
    run.hits += 1;
    run.combo = Math.min(2, run.combo * 1.1);
    t.hit = true;
    if (t.rim) { t.rim.material.emissive = new THREE.Color(0x7ad4c8); t.rim.material.emissiveIntensity = 1.2; }
    run.ball = null;
    run.doomed = "";
    resetTee();
    kit.sfx("sink");
    if (navigator.vibrate) navigator.vibrate(18);
    world.camPunch = 0.08;
    setAuraMood("cheer");
    PF.setAura("celebrate");
    status(t.keyhole ? `Keyhole threaded. +${gained}.` : t.oval ? `The oval took it. +${gained}.` : `Barely in. +${gained}. Combo ×${run.combo.toFixed(1)}`);
    if (liveTargets(run.targets).every((x) => x.hit)) clearRack();
    paintHud();
  }

  function clearRack() {
    const stage = run.spec.stage;
    const bonus = 500 + 50 * stage;
    run.score += bonus;
    if (run.kitRun) run.kitRun.score = run.score;
    run.racks += 1;
    run.misses = 0;
    kit.sfx("rack");
    burstConfetti();
    PF.setAura("celebrate");
    setAuraMood("cheer");
    if (stage >= AUTHORED_COUNT && !run.spec.coda) {
      if (!codaOn()) {
        status(`RACK ${run.racks} CLEAR · +${bonus}. Authored ride over.`);
        if (run.kitRun && PF.runKit && typeof PF.runKit.reportDepth === "function") {
          PF.runKit.reportDepth(run.kitRun, run.racks, { name: run.spec.name, coda: false });
        }
        finish("souvenir");
        return;
      }
      status(`RACK ${run.racks} CLEAR · +${bonus}. ENDLESS — the alley keeps lying.`);
    }
    if (!enterRack(stage + 1)) { finish("souvenir"); return; }
    if (run.kitRun && PF.runKit && typeof PF.runKit.reportDepth === "function") {
      PF.runKit.reportDepth(run.kitRun, run.spec.stage, { name: run.spec.name, coda: !!run.spec.coda });
    }
    if (!run.spec.coda) status(`${hudRack(run.spec)} CLEAR bonus +${bonus}. ${run.spec.barker}`);
  }

  function registerMiss(note) {
    if (!run || run.done || run.resolving) return;
    run.resolving = true;
    run.misses += 1;
    if (run.kitRun && rk() && typeof rk().reportStrike === "function") {
      try { rk().reportStrike(run.kitRun, note || "miss"); } catch (_) { /* pips */ }
    }
    run.combo = 1;
    run.ball = null;
    run.doomed = "";
    run.lastNote = note || "miss";
    kit.sfx(note === "spit" ? "spit" : "miss");
    resetTee();
    setAuraMood(note === "decoy" ? "laugh" : "sad");
    status(note === "spit" ? `SPIT ${run.misses}/3 — too fast.` : note === "decoy" ? `Plywood lie. Miss ${run.misses}/3.` : `Miss ${run.misses}/3.`);
    run.resolving = false;
    paintHud();
    if (run.misses >= (run.spec.missesToDeath || 3)) finish("miss");
  }

  function bounceFrom(t, spit) {
    const q = t.group.getWorldQuaternion(_q);
    const local = _v.set(run.ball.vx, run.ball.vy, run.ball.vz).applyQuaternion(_q2.copy(q).conjugate());
    local.z = Math.abs(local.z) * (spit ? 0.72 : 0.4) + (spit ? 1.7 : 0.8);
    local.x *= 0.55;
    local.y = Math.abs(local.y) * 0.28 + (spit ? 0.58 : 0.32);
    const worldV = local.applyQuaternion(q);
    run.ball.vx = worldV.x;
    run.ball.vy = worldV.y;
    run.ball.vz = worldV.z;
    t.spitFlash = t.decoy ? 900 : 640;
    t.lock = t.decoy ? 420 : 280;
    if (t.rim) { t.rim.material.emissive = new THREE.Color(0xc41e3a); t.rim.material.emissiveIntensity = spit ? 1.8 : 1.1; }
    if (world.ball.material) {
      world.ball.material.emissive = new THREE.Color(spit ? 0xff3318 : 0xc41e3a);
      world.ball.material.emissiveIntensity = spit ? 1.6 : 0.7;
    }
    run.doomed = spit ? (t.keyhole ? "keyhole" : t.oval ? "oval" : "spit") : (t.decoy ? "decoy" : t.oval ? "oval" : "miss");
    run.lastNote = run.doomed;
    world.shake = spit ? 0.16 : 0.07;
    world.camPunch = spit ? 0.18 : 0.07;
    const origin = t.group.getWorldPosition(_v3);
    burstSpit(origin, !!(spit || t.decoy));
    if (spit || t.decoy) flashSpitLabel(t.decoy ? "decoy" : "spit");
    kit.sfx("spit");
    if (navigator.vibrate) navigator.vibrate(spit ? 32 : 18);
    setAuraMood("laugh");
    status(t.decoy
      ? "PLYWOOD LIE — that bucket wasn’t a hole."
      : spit
        ? (t.keyhole ? "SPIT — keyhole wants a needle." : t.oval ? "SPIT — too hot for the corridor." : "SPIT — too hot. The hole spat you out.")
        : t.oval
          ? "Oval wants the pink corridor."
          : t.keyhole ? "Keyhole rim." : "Rim.");
  }

  function hitDeadWall(ball) {
    if (!world.deadL || !run.spec || run.spec.kind !== "cluster") return false;
    if (ball.x < -0.82 && ball.z < 0.2 && ball.z > -1.8) {
      ball.vx = Math.abs(ball.vx) * 0.45 + 1.2;
      ball.vz *= 0.4;
      world.shake = 0.04;
      status("Dead plywood — only the can fist is live.");
      return true;
    }
    if (ball.x > 0.82 && ball.z < 0.2 && ball.z > -1.8) {
      ball.vx = -Math.abs(ball.vx) * 0.45 - 1.2;
      ball.vz *= 0.4;
      world.shake = 0.04;
      status("Dead plywood — only the can fist is live.");
      return true;
    }
    return false;
  }

  function stepBall(dt) {
    const ball = run.ball;
    if (!ball) return;
    ball.vy += GRAVITY * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.z += ball.vz * dt;
    ball.life += dt;
    world.ball.position.set(ball.x, ball.y, ball.z);
    world.ball.rotation.x += ball.vz * dt * 8;
    world.ball.rotation.z -= ball.vx * dt * 8;
    setTrailFrom(ball);
    if (ball.sinking) {
      ball.sinkT += dt;
      world.ball.scale.setScalar(Math.max(0.15, 1 - ball.sinkT * 3.2));
      if (ball.sinkT > 0.22) awardSink(ball.sinkHole);
      return;
    }
    if (ball.y < 0.07) {
      ball.y = 0.07;
      if (Math.abs(ball.vy) > 1.4) { ball.vy *= -0.28; ball.vx *= 0.62; ball.vz *= 0.62; }
      else { registerMiss(run.doomed || run.lastNote || "miss"); return; }
    }
    hitDeadWall(ball);
    const speed = Math.hypot(ball.vx, ball.vy, ball.vz);
    for (const t of run.targets) {
      if (!t.group || t.lock > 0) continue;
      t.group.updateWorldMatrix(true, false);
      const local = t.group.worldToLocal(_v.set(ball.x, ball.y, ball.z));
      const prev = t.prevZ == null ? local.z + 0.2 : t.prevZ;
      t.prevZ = local.z;
      if (!(prev > 0.07 && local.z <= 0.07 && local.z > -0.22)) continue;
      if (!covers(t, local.x, local.y)) {
        const rim = Math.hypot(local.x, local.y) < (Math.max(t.rx, t.ry) + BALL_R + 0.04);
        if (rim && !t.decoy) { bounceFrom(t, false); return; }
        continue;
      }
      if (t.hit) { bounceFrom(t, false); return; }
      if (t.decoy) {
        exposeDecoy(t);
        bounceFrom(t, false);
        return;
      }
      if (t.oval && !ovalCorridor(t, local.x, local.y)) {
        bounceFrom(t, false);
        run.doomed = "oval";
        run.lastNote = "oval";
        return;
      }
      if (t.keyhole && Math.abs(local.x) > Math.max(0.03, t.rx * 0.9)) {
        bounceFrom(t, false);
        run.doomed = "keyhole";
        run.lastNote = "keyhole";
        return;
      }
      const spitMul = run.spec.spitSpeed || 1.15;
      const sinkNeed = (SINK_BASE * (t.tiny ? Math.max(0.88, run.spec.scale) : run.spec.scale)) / spitMul;
      if (speed <= sinkNeed) {
        run.lastNote = t.keyhole ? "keyhole" : t.oval ? "oval" : "sink";
        ball.sinking = true;
        ball.sinkT = 0;
        ball.sinkHole = t;
        ball.vx *= 0.2;
        ball.vy = -1.5;
        ball.vz *= 0.15;
        return;
      }
      bounceFrom(t, true);
      return;
    }
    run.targets.forEach((t) => {
      t.lock = Math.max(0, t.lock - dt * 1000);
      t.spitFlash = Math.max(0, t.spitFlash - dt * 1000);
      if (t.rim && t.spitFlash <= 0 && !t.hit) t.rim.material.emissiveIntensity = 0.22;
    });
    if (ball.z < -3.6 || ball.z > 5.2 || ball.x < -3.6 || ball.x > 3.6 || ball.life > 3.6) {
      registerMiss(run.doomed || run.lastNote || "miss");
    }
  }

  function beginAim(ev) {
    if (!isLive() || run.ball || !world) return;
    const target = pointerToAim(ev);
    const pt = (ev.touches && ev.touches[0]) || ev;
    run.aim = { sx: pt.clientX, sy: pt.clientY, power: 0, target: target || new THREE.Vector3(0, 1.2, -0.9), locked: (target || new THREE.Vector3()).clone() };
    const canvas = $("ballTossCanvas");
    if (canvas) canvas.classList.add("is-pulling");
    showAimViz(run.aim);
  }

  function updateAim(ev) {
    if (!run || !run.aim) return;
    const pull = pullPower(ev, run.aim);
    run.aim.power = pull.power;
    const nudged = run.aim.locked.clone();
    nudged.x += pull.nudge;
    nudged.y += pull.loft * 0.22;
    run.aim.target = nudged;
    showAimViz(run.aim);
  }

  function releaseAim() {
    if (!run || !run.aim || run.done || run.ball) {
      if (run) run.aim = null;
      hideAimViz();
      return;
    }
    if (run.aim.power < 0.12) {
      run.aim = null;
      hideAimViz();
      status("Pull back — that’s the throw.");
      return;
    }
    const vel = velTo(TEE, run.aim.target, throwSpeed(run.aim.power));
    const noise = 1 + (Math.random() * 0.04 - 0.02);
    run.ball = { x: TEE.x, y: TEE.y, z: TEE.z, vx: vel.vx * noise, vy: vel.vy * noise, vz: vel.vz * noise, life: 0, hist: [] };
    run.targets.forEach((t) => { t.prevZ = null; });
    run.aim = null;
    run.doomed = "";
    hideAimViz();
    kit.sfx("throw");
    if (navigator.vibrate) navigator.vibrate(10);
    setAuraMood("point");
    const hint = $("ballTossHint");
    if (hint) hint.hidden = true;
  }

  function revealResult(shot) {
    const startBtn = $("ballTossStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.hidden = false;
      startBtn.textContent = "TOSS AGAIN · 1 demo coin";
    }
    const canvas = $("ballTossCanvas");
    if (canvas) canvas.classList.add("is-locked");
    PF.focusCard("ballTossCard", false);
    kit.setMode(card(), "result");
    const line = `RACK ${shot.racks} · SCORE ${shot.score}`;
    const aura = auraLine(shot.reason, shot.racks, shot.lastNote);
    const verdictEl = $("ballTossVerdict");
    if (verdictEl) {
      verdictEl.hidden = false;
      verdictEl.textContent = shot.reason === "souvenir" ? `Souvenir. ${line}.` : `${line} · ${aura}`;
    }
    kit.fillResult({
      root: "ballTossResult",
      depth: "ballTossResultDepth",
      score: "ballTossResultScore",
      aura: "ballTossResultAura",
      copied: "ballTossCopied",
    }, {
      depthLine: shot.reason === "souvenir" ? `RACK ${shot.racks} · SOUVENIR` : `RACK ${shot.racks}`,
      scoreLine: `SCORE ${shot.score}`,
      auraLine: aura,
    });
    const ch = $("ballTossChallengeText");
    if (ch) ch.textContent = challengeLine(shot.racks);
    PF.setTier("ballTossTier", shot.racks > 0 ? `RACK ${shot.racks}` : "CLOSED", shot.racks > 0 ? "perfect" : "miss");
    status(shot.reason === "leave" ? "Stepped off the stall." : shot.reason === "souvenir" ? "Authored ride over." : "Board stamped CLOSED.");
    const ok = shot.racks > 0 || shot.hits > 0;
    if (ok) {
      PF.award(Math.max(8, Math.floor(shot.score / 12)), true, "Ball toss");
      PF.setAura(shot.racks >= 5 ? "celebrate" : "point");
      if (shot.reason !== "leave") PF.showBanner(true, `RACK ${shot.racks}`, `${shot.score} · ${aura}`);
    } else {
      PF.award(0, false, "Ball toss miss");
      PF.setAura("badLuck");
      if (shot.reason !== "leave") PF.showBanner(false, "CLOSED", aura);
    }
    PF.refreshNightBoard();
    paintHud();
    setAuraMood(shot.racks >= 5 ? "cheer" : "sad");
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.closedStamp = reason !== "leave" && reason !== "souvenir";
    if (run.closedStamp) kit.sfx("stamp");
    if (reason === "souvenir") kit.sfx("rack");
    hideAimViz();
    const stamp = $("ballTossStamp");
    if (stamp) {
      stamp.hidden = !run.closedStamp;
      stamp.textContent = reason === "souvenir" ? "SOUVENIR" : "CLOSED";
    }
    const shot = { reason, racks: run.racks, score: run.score, hits: run.hits, lastNote: run.lastNote };
    persistDepth({
      depth: shot.racks,
      score: shot.score,
      deathReason: reason === "leave" ? "leave" : reason === "souvenir" ? "souvenir" : (shot.lastNote || "miss"),
      cashedOut: reason === "souvenir",
      meta: { room: run.spec && run.spec.name, coda: !!(run.spec && run.spec.coda) },
    });
    paintHud();
    if (reason === "leave" || reason === "souvenir") revealResult(shot);
    else setTimeout(() => revealResult(shot), 720);
  }

  function tickCamera(dt, t) {
    if (!world) return;
    const cam = world.camera;
    const live = isLive();
    let tx = 0.08; let ty = 1.95; let tz = 6.55;
    let lx = 0; let ly = 1.2; let lz = -1.0;
    if (!live) {
      const u = t * 0.00022;
      tx = Math.sin(u) * 1.2;
      ty = 2.05 + Math.sin(u * 1.3) * 0.08;
      tz = 6.45 + Math.cos(u * 0.8) * 0.5;
    } else if (run.aim) {
      tz = 6.65 + run.aim.power * 0.2;
      ty = 1.9;
      cam.fov += (56 - cam.fov) * 0.08;
    } else if (run.ball) {
      tx = run.ball.x * 0.18;
      ty = kit.lerp(1.95, run.ball.y + 0.65, 0.28);
      tz = kit.lerp(6.55, run.ball.z + 2.55, 0.22);
      lx = run.ball.x; ly = run.ball.y; lz = run.ball.z;
      cam.fov += (58 - cam.fov) * 0.08;
    } else cam.fov += (58 - cam.fov) * 0.08;
    if (world.camPunch) { ty -= world.camPunch; world.camPunch *= 0.82; if (world.camPunch < 0.002) world.camPunch = 0; }
    if (world.shake) {
      tx += (Math.random() - 0.5) * world.shake;
      ty += (Math.random() - 0.5) * world.shake;
      world.shake *= 0.84;
      if (world.shake < 0.002) world.shake = 0;
    }
    const k = 1 - Math.pow(0.001, dt);
    cam.position.x += (tx - cam.position.x) * k;
    cam.position.y += (ty - cam.position.y) * k;
    cam.position.z += (tz - cam.position.z) * k;
    cam.lookAt(lx, ly, lz);
    cam.updateProjectionMatrix();
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!world || !visible) return;
    if (!lastTs) lastTs = now;
    const dt = Math.min(0.033, (now - lastTs) / 1000);
    lastTs = now;
    if (isLive()) {
      run.t += dt * 1000;
      applyRigXform(run.t, run.spec);
      if (run.ball) stepBall(dt);
    } else {
      idleClock += dt * 1000;
      if (idleClock > 3800) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        const pack = makePack(idleRoom);
        if (pack) {
          rebuildRig(pack.spec, pack.targets);
          world.lastSpec = pack.spec;
          world.idleTargets = pack.targets;
        }
      }
      applyRigXform(now, world.lastSpec);
      setAuraMood("wave");
    }
    tickAura(dt, now);
    tickConfetti(dt);
    tickSparks(dt);
    tickCamera(dt, now);
    world.renderer.render(world.scene, world.camera);
    if (typeof PF.refreshDepth === "function" && isLive()) PF.refreshDepth();
  }

  function loopOn() {
    visible = true;
    if (!raf) { lastTs = 0; raf = requestAnimationFrame(frame); }
  }

  function loopOff() {
    visible = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function punchStart() {
    const btn = $("ballTossStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    status("Depth run — press START. Point, pull, throw.");
  }

  PF.registerVendor({
    id: "ball-toss",
    playKey: "balltoss",
    chalk: "Holes that barely fit. Drag back. How many racks?",
    defaults: { bestBallToss: 0, bestBallTossScore: 0 },
    onLeave() {
      if (run && !run.done) finish("leave");
      loopOff();
    },
    onShow() {
      declareP0();
      ensureWorld();
      resize();
      paintHud();
      loopOn();
      const canvas = $("ballTossCanvas");
      if (canvas) canvas.classList.toggle("is-locked", !isLive());
    },
    onReset() {
      if (run && !run.done) finish("leave");
      run = null;
      hideAimViz();
      if ($("ballTossVerdict")) $("ballTossVerdict").hidden = true;
      kit.hideResult("ballTossResult");
      const stamp = $("ballTossStamp");
      if (stamp) stamp.hidden = true;
      const spitEl = $("ballTossSpit");
      if (spitEl) spitEl.hidden = true;
      if ($("ballTossStart")) {
        $("ballTossStart").disabled = false;
        $("ballTossStart").hidden = false;
        $("ballTossStart").textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      resetTee();
      paintHud();
      loopOn();
    },
    refreshDepth(state) {
      const nowEl = $("depthTossNow");
      if (nowEl) nowEl.textContent = (run && !run.done) ? (run.spec.coda ? `ENDLESS ${run.spec.stage}` : `RACK ${run.spec.stage}`) : "0";
      const best = $("depthTossBest");
      const bestN = Math.max(state.bestBallToss || 0, (state.bestDepth && state.bestDepth.balltoss) || 0);
      if (best) best.textContent = bestN ? String(bestN) : "—";
      const sc = $("depthTossScore");
      if (sc) sc.textContent = run && !run.done ? String(run.score) : "0";
      const bs = $("depthTossBestScore");
      if (bs) bs.textContent = state.bestBallTossScore ? String(state.bestBallTossScore) : "—";
    },
    bind() {
      declareP0();
      const startBtn = $("ballTossStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = $("ballTossCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) { punchStart(); return; }
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
        canvas.addEventListener("pointercancel", () => { if (run) run.aim = null; hideAimViz(); });
      }
      const copyBtn = $("ballTossChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = (PF.getState().lastRun && PF.getState().lastRun.game === GAME_ID) ? PF.getState().lastRun.depth : (PF.getState().bestBallToss || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const el = $("ballTossCopied");
            if (el) el.hidden = false;
            status("Copied — send it");
          }, () => { status(text); });
        });
      }
      window.addEventListener("resize", resize);
      if (document.getElementById("cabinet-ball-toss") && !document.getElementById("cabinet-ball-toss").hidden) {
        ensureWorld();
        loopOn();
      }
    },
  });
}
