/* Coin Pusher Shelf — 3D Penny Cascade Pavilion. PF only. Never booth/port 6000.
 * Own design: three-tier brass cascade, sliding hopper, prize tokens, greed cash-out.
 * GreedFloor · depthUnit Floor · 7 authored rooms + ENDLESS coda. Family-safe. No casino.
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

  const GAME_ID = "coinpusher";
  const CODA_ENABLED = true;
  const AUTHORED_COUNT = 7;
  const MAX_COINS = 70;
  const COIN_R = 0.055;
  const COIN_H = 0.012;
  const REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;
  const WOOD = 0x3a2418;
  const WOOD_DARK = 0x1a100c;
  const BRASS = 0xd4a45a;
  const VELVET = 0x4a1a28;
  const FELT = 0x1a4a38;

  const AURA = {
    cash: "Aura: Smart jingle. Depth sticks.",
    cashDeep: (n) => `Aura: Floor ${n} and you walked. Barker respects that.`,
    buried: "Aura: The cascade ate your night. Greedy.",
    empty: "Aura: You watched it all fall in the pit.",
    greed: "Aura: One more drop, you said.",
    souvenir: "Aura: Avalanche Gallery walked. Souvenir — the glass salutes.",
    coda: "Aura: Authored greed’s over. ENDLESS — pit widens.",
    leave: "Aura: Left the glass. The pennies stay.",
  };

  const P0_MOUNT = {
    engine: "GreedFloor",
    displayName: "Coin Pusher Shelf",
    depthUnit: "Floor",
    sheet: "GOBLIN_BATCH01_BUILD_SHEETS.md",
    authoredSheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
    cashOut: true,
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const AUTHORED_FLOORS = [
    { id: 1, name: "Glass Nursery", kind: "nursery", tiers: 2, bankTarget: 18, pusherSpeed: 0.78, pitW: 0.16, seamW: 0, lipHang: 0, vHalf: 0, buried: false, doublePush: false, avalanche: 0, seam: false, overhang: false, vMouth: false, trapdoor: false, kickers: false, prizes: false, travel: 0.5, barker: "Slide the hopper. TAP to drop. Brass shoves the pile. Velvet tray is the win." },
    { id: 2, name: "Split Shelf", kind: "split", tiers: 3, bankTarget: 14, pusherSpeed: 0.52, pitW: 0.22, seamW: 0.3, lipHang: 0, vHalf: 0, buried: true, doublePush: false, avalanche: 0, seam: true, overhang: false, vMouth: false, trapdoor: false, kickers: false, prizes: false, travel: 0.5, barker: "Middle shelf splits. Center seam eats coins." },
    { id: 3, name: "Overhang Tease", kind: "overhang", tiers: 3, bankTarget: 14, pusherSpeed: 0.52, pitW: 0.24, seamW: 0, lipHang: 0.18, vHalf: 0, buried: true, doublePush: false, avalanche: 0, seam: false, overhang: true, vMouth: false, trapdoor: false, kickers: false, prizes: true, travel: 0.55, barker: "Bottom lip hangs past the tray. Near-falls tease." },
    { id: 4, name: "Double Sweep", kind: "doublesweep", tiers: 3, bankTarget: 14, pusherSpeed: 0.55, pitW: 0.24, seamW: 0, lipHang: 0, vHalf: 0, buried: true, doublePush: true, avalanche: 0, seam: false, overhang: false, vMouth: false, trapdoor: false, kickers: false, prizes: true, travel: 0.28, barker: "Two short pushes. Decide faster." },
    { id: 5, name: "Pit Mouth", kind: "pitmouth", tiers: 3, bankTarget: 14, pusherSpeed: 0.55, pitW: 0.16, seamW: 0, lipHang: 0, vHalf: 0.56, buried: true, doublePush: false, avalanche: 0, seam: false, overhang: false, vMouth: true, trapdoor: false, kickers: false, prizes: true, travel: 0.52, barker: "V-mouth under center. Sides are safer." },
    { id: 6, name: "Trapdoor Floor", kind: "trapdoor", tiers: 3, bankTarget: 14, pusherSpeed: 0.55, pitW: 0.24, seamW: 0, lipHang: 0, vHalf: 0, buried: true, doublePush: false, avalanche: 0, seam: false, overhang: false, vMouth: false, trapdoor: true, kickers: false, prizes: true, travel: 0.52, barker: "Hatch marks a lane. It shivers. The lid lifts. Cash or watch." },
    { id: 7, name: "Avalanche Gallery", kind: "avalanche", tiers: 3, bankTarget: 16, pusherSpeed: 0.58, pitW: 0.3, seamW: 0, lipHang: 0.1, vHalf: 0, buried: true, doublePush: false, avalanche: 0.38, seam: false, overhang: true, vMouth: false, trapdoor: false, kickers: true, prizes: true, travel: 0.62, barker: "Tall cascade. Kickers. Stars and hearts. Greed peak." },
  ];

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 7 authored FLOORS · ENDLESS coda · cash out or greed",
    body: "Three brass shelves. Slide the hopper. Drop. Cascade. Tray jingled? Walk — or go deeper.",
    status: "Slide · DROP · watch the cascade · cash out or get buried",
    punch: "Depth run — press DROP IN. No one-tap prize.",
  };

  let world = null;
  let run = null;
  let raf = 0;
  let bootPromise = null;
  let starting = false;
  let visible = false;
  let lastTs = 0;
  let idleClock = 0;
  let idleRoom = 1;
  let shake = 0;
  let camMode = "idle";
  let camBlend = 1;
  let marqueePulse = 0;
  let aimX = 0;
  let keys = { L: false, R: false };

  const _v = { a: null, b: null, ray: null, ndc: null, hit: null, plane: null };

  function rk() { return PF.runKit || null; }
  function card() { return $("pusherCard"); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function setText(id, t) { const el = $(id); if (el) el.textContent = t; }

  function codaOn() {
    const kitRun = rk();
    const row = kitRun && ((kitRun.declared && kitRun.declared[GAME_ID]) || (kitRun.p0 && kitRun.p0[GAME_ID]));
    if (row && typeof row.codaEnabled === "boolean") return !!row.codaEnabled;
    return !!P0_MOUNT.codaEnabled;
  }

  function codaFloor(n) {
    const t = Math.max(0, n - AUTHORED_COUNT);
    return {
      id: n, name: `Greed Coda ${n}`, kind: "coda", tiers: 3,
      bankTarget: 22 + t * 4, pusherSpeed: 0.58,
      pitW: Math.min(0.68, 0.32 + t * 0.05), seamW: t % 3 === 1 ? 0.26 : 0,
      lipHang: 0.1, vHalf: t % 3 === 2 ? 0.6 : 0,
      buried: true, doublePush: t % 2 === 1, avalanche: 0.4,
      seam: t % 3 === 1, overhang: true, vMouth: t % 3 === 2,
      trapdoor: t % 2 === 0, kickers: true, prizes: true,
      travel: t % 2 === 1 ? 0.3 : 0.6, coda: true,
      barker: "ENDLESS — pit widens. Avalanche on. Cash out or get buried.",
    };
  }

  function pusherFloor(n) {
    const floor = Math.max(1, n | 0);
    if (floor <= AUTHORED_COUNT) return Object.assign({ coda: false }, AUTHORED_FLOORS[floor - 1]);
    if (!codaOn()) return null;
    return codaFloor(floor);
  }

  function floorSpec(n) {
    const f = Math.max(1, n | 0);
    const p = pusherFloor(f);
    if (!p) return null;
    return {
      floor: f, id: p.id || f, name: p.name, title: p.name, kind: p.kind,
      tiers: p.tiers || 3, bank: p.bankTarget,
      speed: Math.min(0.0046, 0.0022 * (p.pusherSpeed || 0.52)),
      pitW: p.pitW != null ? p.pitW : 0.22,
      seamW: p.seamW || (p.seam ? 0.3 : 0),
      lipHang: p.lipHang || (p.overhang ? 0.18 : 0),
      vHalf: p.vHalf || (p.vMouth ? 0.56 : 0),
      doublePush: !!p.doublePush,
      avalanche: typeof p.avalanche === "number" ? p.avalanche : 0,
      seam: !!p.seam, overhang: !!p.overhang, vMouth: !!p.vMouth,
      trapdoor: !!p.trapdoor, kickers: !!p.kickers, prizes: !!p.prizes,
      buried: p.buried !== false, travel: p.travel || 0.5,
      coda: !!p.coda, barker: p.barker || "",
    };
  }

  function makeShelves(spec) {
    const hang = spec.lipHang || 0;
    const w = 2.02;
    function lastTravel(z0, z1) {
      return Math.max(0.32, (z1 - z0) - 0.38);
    }
    if ((spec.tiers || 3) === 2) {
      const z0 = -0.06, z1 = 0.72 + hang;
      return [
        { i: 0, y: 1.58, z0: -0.5, z1: 0.22, half: w * 0.42, pusher: true, travel: spec.travel },
        { i: 1, y: 1.08, z0, z1, half: w * 0.48, pusher: true, travel: lastTravel(z0, z1), last: true },
      ];
    }
    const z0 = 0.04, z1 = 0.78 + hang;
    return [
      { i: 0, y: 1.78, z0: -0.6, z1: 0.08, half: w * 0.4, pusher: true, travel: spec.travel },
      { i: 1, y: 1.38, z0: -0.26, z1: 0.38, half: w * 0.45, pusher: true, travel: spec.travel * 0.88, seam: spec.seam },
      { i: 2, y: 0.98, z0, z1, half: w * 0.5, pusher: true, travel: lastTravel(z0, z1), last: true, vMouth: spec.vMouth, trapdoor: spec.trapdoor },
    ];
  }

  function trayHalf(spec) {
    const pit = spec && spec.pitW != null ? spec.pitW : 0.22;
    return Math.max(0.26, 1.02 - pit - 0.08);
  }

  function sitY(sh) {
    return (sh ? sh.y : 1.08) + 0.024 + COIN_H / 2;
  }

  function hudFloor(spec) {
    if (!spec) return "FLOOR";
    if (spec.coda) return `ENDLESS · FLOOR ${spec.floor} · ${spec.name}`;
    return `FLOOR ${spec.floor} · ${spec.name}`;
  }

  function roomTell(spec) {
    if (!spec) return "GREED VS THE PIT";
    if (spec.kind === "nursery") return "NURSERY · TWO TIERS";
    if (spec.seam) return "SEAM EATS THE MIDDLE";
    if (spec.kickers) return "KICKERS · AVALANCHE";
    if (spec.overhang) return "LIP HANGS PAST SAFE";
    if (spec.doublePush) return "TWO SHORT PUSHES";
    if (spec.vMouth) return "V-MOUTH · SIDES SAFER";
    if (spec.trapdoor) return "HATCH · SHUDDER · DUMP";
    if (spec.coda) return "ENDLESS · PIT WIDENS";
    return "THREE-TIER CASCADE";
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    const spec = Object.assign({
      authored: AUTHORED_FLOORS,
      authoredCount: AUTHORED_COUNT,
      cashOut: true,
      codaEnabled: CODA_ENABLED,
      codaParams: codaFloor,
      level: pusherFloor,
      stageParams: pusherFloor,
      PUSHER_LEVELS: AUTHORED_FLOORS,
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

  function isLive() {
    return !!(run && !run.done && run.kitRun && run.kitRun.alive !== false);
  }

  function canGL() {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch (_) {
      return false;
    }
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

  function woodTex(tint) {
    return canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 18; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${0.04 + (i % 3) * 0.03})`;
        ctx.fillRect(i * 14 + 4, 0, 3, 256);
      }
      ctx.strokeStyle = "rgba(20,8,4,0.28)";
      ctx.lineWidth = 1.2;
      for (let y = 8; y < 256; y += 17) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(80, y + 6, 160, y - 5, 256, y + 3);
        ctx.stroke();
      }
    }, 3, 2);
  }

  function stripeTex() {
    return canvasTex(128, 256, (ctx) => {
      const bands = ["#7a2038", "#f3e2c4", "#7a2038", "#d4a45a"];
      for (let i = 0; i < 8; i += 1) {
        ctx.fillStyle = bands[i % bands.length];
        ctx.fillRect(i * 16, 0, 16, 256);
      }
    }, 6, 1);
  }

  function feltTex() {
    return canvasTex(128, 128, (ctx) => {
      ctx.fillStyle = "#1a4a38";
      ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 80; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${0.06 + Math.random() * 0.08})`;
        ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
      }
    }, 4, 3);
  }

  function pennyFace(kind) {
    const pal = kind === 1
      ? { a: "#ffe6a6", b: "#d4a45a", c: "#8a5a18", glyph: "★" }
      : kind === 2
        ? { a: "#f0b0b8", b: "#d22b3a", c: "#7a1820", glyph: "♥" }
        : { a: "#e8c878", b: "#c48a28", c: "#7a5010", glyph: "1¢" };
    return canvasTex(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(48, 44, 8, 64, 64, 62);
      g.addColorStop(0, pal.a);
      g.addColorStop(0.55, pal.b);
      g.addColorStop(1, pal.c);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(64, 64, 62, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(40,20,8,0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(64, 64, 48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(40,18,6,0.7)";
      ctx.font = kind ? "bold 44px Georgia, serif" : "bold 28px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pal.glyph, 64, 66);
    });
  }

  function makeMat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.72, metalness: 0.08,
    }, extra || {}));
  }

  function meshBox(mat, w, h, d, x, y, z) {
    const m = new THREE.Mesh(world.geo.box, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    m.receiveShadow = true;
    return m;
  }

  function meshSphere(mat, r, x, y, z) {
    const m = new THREE.Mesh(world.geo.sphere, mat);
    m.scale.setScalar(r);
    m.position.set(x, y, z);
    return m;
  }

  function meshCyl(mat, rTop, rBot, h, x, y, z) {
    const m = new THREE.Mesh(world.geo.cyl, mat);
    m.scale.set(rTop, h, rBot);
    m.position.set(x, y, z);
    return m;
  }

  function addBox(parent, mat, w, h, d, x, y, z) {
    const m = meshBox(mat, w, h, d, x, y, z);
    parent.add(m);
    return m;
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = makeMat(SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const blouse = makeMat(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.2 });
    const dress = makeMat(DRESS, { emissive: 0x0a2010, emissiveIntensity: 0.25 });
    const dark = makeMat(0x111111, { roughness: 0.28, metalness: 0.45 });
    const gold = makeMat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const heartM = makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.6, roughness: 0.4 });
    const hairM = makeMat(HAIR, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });

    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(meshCyl(blouse, 0.13, 0.16, 0.28, 0, 0.28, 0));
    const pinafore = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.13, 0.36, 12), dress);
    pinafore.position.y = 0.08;
    hip.add(pinafore);
    hip.add(meshBox(dress, 0.2, 0.16, 0.04, 0, 0.3, 0.14));
    const heart = meshBox(heartM, 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    heart.rotation.z = Math.PI / 4;
    hip.add(heart);

    const head = new THREE.Group();
    head.position.y = 0.6;
    hip.add(head);
    head.add(meshSphere(skin, 0.175, 0, 0.02, 0));
    const eyeW = makeMat(0xf7f2ea);
    const eyeD = makeMat(0x2a1810);
    [-1, 1].forEach((side) => {
      const white = meshSphere(eyeW, 0.038, side * 0.055, 0.03, 0.15);
      white.scale.set(0.038, 0.044, 0.02);
      head.add(white);
      head.add(meshSphere(eyeD, 0.02, side * 0.055, 0.03, 0.168));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), makeMat(0xc45a6a));
    smile.position.set(0, -0.05, 0.16);
    smile.rotation.x = 2.6;
    head.add(smile);
    head.add(meshSphere(hairM, 0.23, 0, 0.06, -0.02));
    head.add(meshBox(hairM, 0.28, 0.07, 0.1, 0, 0.14, 0.16));
    [-1, 1].forEach((side) => {
      head.add(meshSphere(hairM, 0.11, side * 0.2, -0.04, 0.04));
      head.add(meshSphere(heartM, 0.045, side * 0.2, 0.06, 0.06));
    });
    const crown = new THREE.Group();
    crown.position.y = 0.24;
    head.add(crown);
    crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold));
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, h, 6), gold);
      spike.position.set(x, h * 0.45, 0);
      crown.add(spike);
    });
    const gem = meshBox(heartM, 0.055, 0.055, 0.025, 0, 0.02, 0.11);
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
    const armL = limb(-1, true);
    const armR = limb(1, true);
    g.userData = { kind: "aura", t: 0, armL, armR, head, hip, mood: "idle" };
    g.scale.setScalar(1.12);
    return g;
  }

  function animateAura(dt) {
    if (!world || !world.aura) return;
    const u = world.aura.userData;
    u.t += dt * (u.mood === "cheer" ? 8 : 2.2);
    const bob = Math.sin(u.t) * (u.mood === "cheer" ? 0.04 : 0.012);
    u.hip.position.y = 0.42 + bob;
    if (u.mood === "cheer") {
      u.armL.rotation.z = 0.9 + Math.sin(u.t * 1.4) * 0.25;
      u.armR.rotation.z = -0.9 + Math.sin(u.t * 1.4 + 1) * 0.25;
      u.armL.rotation.x = -0.4;
      u.armR.rotation.x = -0.4;
    } else if (u.mood === "point") {
      u.armR.rotation.x = -1.15;
      u.armR.rotation.z = -0.35;
      u.armL.rotation.x = Math.sin(u.t * 0.45) * 0.1;
    } else if (u.mood === "sad") {
      u.head.rotation.x = 0.28;
      u.armL.rotation.x = 0.35;
      u.armR.rotation.x = 0.35;
    } else {
      u.head.rotation.x = u.mood === "watch" ? -0.12 : 0;
      const wave = u.mood === "idle" && Math.sin(u.t * 0.35) > 0.72;
      u.armR.rotation.x = wave ? -1.6 : Math.sin(u.t * 0.5) * 0.12;
      u.armR.rotation.z = wave ? -0.55 : 0.08;
      u.armL.rotation.x = Math.sin(u.t * 0.45) * 0.1;
    }
    u.head.rotation.y = Math.sin(u.t * 0.4) * 0.18 - 0.35;
    world.aura.rotation.y = -0.7 + Math.sin(u.t * 0.25) * 0.08;
  }

  function setAuraMood(mood) {
    if (world && world.aura) world.aura.userData.mood = mood || "idle";
  }

  function makeMarquee() {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 192;
    const ctx = c.getContext("2d");
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({
      map: tex, emissive: 0x6a4010, emissiveIntensity: 0.85, roughness: 0.4,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 0.44), mat);
    mesh.position.set(0, 2.38, 0.74);
    world.marquee = { canvas: c, ctx, tex, mesh };
    paintMarquee(null);
    return mesh;
  }

  function paintMarquee(spec) {
    if (!world || !world.marquee) return;
    const { ctx, canvas, tex } = world.marquee;
    ctx.fillStyle = "#2a1018";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.fillStyle = "#ffe6a6";
    ctx.font = "700 46px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const title = spec ? (spec.coda ? "ENDLESS GREED" : spec.name.toUpperCase()) : "PENNY CASCADE";
    ctx.fillText(title, canvas.width / 2, 78);
    ctx.fillStyle = "#e8a0b8";
    ctx.font = "26px Georgia, serif";
    ctx.fillText(spec ? roomTell(spec) : "SLIDE · DROP · CASH OUT", canvas.width / 2, 138);
    tex.needsUpdate = true;
  }

  function makeSparks() {
    const geo = new THREE.SphereGeometry(0.018, 8, 6);
    const mat = makeMat(0xffe6a6, { emissive: 0xffc878, emissiveIntensity: 1.2, roughness: 0.3 });
    const list = [];
    for (let i = 0; i < 32; i += 1) {
      const m = new THREE.Mesh(geo, mat);
      m.visible = false;
      world.scene.add(m);
      list.push({ mesh: m, life: 0, vx: 0, vy: 0, vz: 0 });
    }
    return list;
  }

  function burstSparks(x, y, z, n) {
    if (!world) return;
    let used = 0;
    world.sparks.forEach((s) => {
      if (s.life > 0 || used >= (n || 8)) return;
      s.life = 0.45 + Math.random() * 0.25;
      s.vx = (Math.random() - 0.5) * 1.4;
      s.vy = 1.2 + Math.random() * 1.6;
      s.vz = (Math.random() - 0.5) * 1.2;
      s.mesh.position.set(x, y, z);
      s.mesh.visible = true;
      used += 1;
    });
  }

  function stepSparks(dt) {
    if (!world) return;
    world.sparks.forEach((s) => {
      if (s.life <= 0) return;
      s.life -= dt;
      s.vy -= 6 * dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      s.mesh.scale.setScalar(Math.max(0.2, s.life * 2.2));
      if (s.life <= 0) s.mesh.visible = false;
    });
  }

  function buildTent() {
    const tent = new THREE.Group();
    const woodM = makeMat(WOOD, { map: world.tex.wood, roughness: 0.82 });
    const darkM = makeMat(WOOD_DARK, { map: world.tex.woodDark, roughness: 0.86 });
    const stripeM = makeMat(0xffffff, { map: world.tex.stripe, roughness: 0.9 });
    const velvetM = makeMat(VELVET, { roughness: 0.92 });
    const brassM = makeMat(BRASS, { metalness: 0.72, roughness: 0.32, emissive: 0x4a3010, emissiveIntensity: 0.18 });

    tent.add(meshBox(darkM, 9.6, 0.08, 8.4, 0, -0.04, 0.2));
    tent.add(meshBox(velvetM, 4.4, 0.02, 3.6, 0, 0.01, 0.45));
    tent.add(meshBox(stripeM, 8.8, 4.4, 0.08, 0, 2.15, -2.45));
    tent.add(meshBox(stripeM, 0.08, 4.4, 7.4, -4.4, 2.15, 0.2));
    tent.add(meshBox(stripeM, 0.08, 4.4, 7.4, 4.4, 2.15, 0.2));
    const roofL = meshBox(stripeM, 4.6, 0.1, 7.6, -2.15, 4.35, 0.15);
    roofL.rotation.z = 0.22;
    tent.add(roofL);
    const roofR = meshBox(stripeM, 4.6, 0.1, 7.6, 2.15, 4.35, 0.15);
    roofR.rotation.z = -0.22;
    tent.add(roofR);
    [-3.2, 0, 3.2].forEach((x) => {
      tent.add(meshCyl(woodM, 0.09, 0.09, 4.2, x, 2.1, -2.28));
    });
    [-3.4, 3.4].forEach((x) => {
      tent.add(meshCyl(woodM, 0.09, 0.09, 4.2, x, 2.1, 2.55));
    });
    for (let i = 0; i < 14; i += 1) {
      const bulb = meshSphere(makeMat(0xffe6a6, { emissive: 0xffc878, emissiveIntensity: 0.9 }), 0.045, -3.4 + i * 0.52, 3.62, -2.2);
      tent.add(bulb);
      world.bulbs.push(bulb);
    }
    for (let i = 0; i < 11; i += 1) {
      const tri = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 3), i % 2 ? brassM : makeMat(0x7a2038));
      tri.rotation.x = Math.PI;
      tri.position.set(-2.4 + i * 0.48, 3.32, 2.4);
      tent.add(tri);
    }
    tent.add(meshBox(woodM, 0.72, 0.44, 0.52, -2.45, 0.22, 1.85));
    tent.add(meshBox(brassM, 0.24, 0.04, 0.24, -2.45, 0.46, 1.85));
    return tent;
  }

  function buildCabinet() {
    const cab = new THREE.Group();
    const woodM = makeMat(WOOD, { map: world.tex.wood, roughness: 0.7 });
    const darkM = makeMat(WOOD_DARK, { map: world.tex.woodDark, roughness: 0.78 });
    const brassM = makeMat(BRASS, { metalness: 0.78, roughness: 0.28, emissive: 0x3a2808, emissiveIntensity: 0.22 });
    const velvetM = makeMat(VELVET, { roughness: 0.9 });
    const glassM = new THREE.MeshStandardMaterial({
      color: 0xa8d0e0, transparent: true, opacity: 0.11, roughness: 0.08, metalness: 0.18, depthWrite: false,
    });

    addBox(cab, woodM, 2.78, 0.62, 1.92, 0, 0.31, 0);
    addBox(cab, woodM, 2.78, 0.08, 1.92, 0, 2.22, 0);
    addBox(cab, brassM, 2.82, 0.04, 1.96, 0, 0.64, 0);
    addBox(cab, brassM, 2.82, 0.04, 1.96, 0, 2.16, 0);
    addBox(cab, woodM, 0.09, 1.5, 1.78, -1.36, 1.4, 0);
    addBox(cab, woodM, 0.09, 1.5, 1.78, 1.36, 1.4, 0);
    addBox(cab, makeMat(0x5a3024, { map: world.tex.wood, roughness: 0.78, emissive: 0x2a140c, emissiveIntensity: 0.28 }), 2.6, 1.5, 0.08, 0, 1.4, -0.88);
    const poster = makeWordLabel("CASCADE", "#ffe6a6");
    poster.scale.set(4.2, 3.2, 1);
    poster.position.set(0, 1.55, -0.82);
    cab.add(poster);
    const glass = new THREE.Mesh(world.geo.box, glassM);
    glass.scale.set(2.55, 1.42, 0.03);
    glass.position.set(0, 1.42, 0.9);
    cab.add(glass);

    const tray = addBox(cab, velvetM, 1.22, 0.08, 0.46, 0, 0.58, 1.16);
    tray.rotation.x = -0.16;
    world.trayMesh = tray;
    addBox(cab, brassM, 1.28, 0.05, 0.08, 0, 0.62, 1.34);
    const trayLbl = makeWordLabel("TRAY", "#ffe6a6");
    trayLbl.position.set(0, 0.72, 1.32);
    cab.add(trayLbl);

    addBox(cab, darkM, 0.58, 0.4, 0.5, -1.08, 0.32, 1.04);
    addBox(cab, darkM, 0.58, 0.4, 0.5, 1.08, 0.32, 1.04);
    const pitM = makeMat(0x5a1020, { emissive: 0x3a0810, emissiveIntensity: 0.5 });
    world.pitGlow = [
      addBox(cab, pitM, 0.5, 0.02, 0.44, -1.08, 0.14, 1.04),
      addBox(cab, pitM.clone(), 0.5, 0.02, 0.44, 1.08, 0.14, 1.04),
    ];
    const pitL = makeWordLabel("PIT", "#e8a0b8");
    pitL.position.set(-1.08, 0.58, 1.22);
    cab.add(pitL);
    const pitR = makeWordLabel("PIT", "#e8a0b8");
    pitR.position.set(1.08, 0.58, 1.22);
    cab.add(pitR);

    const rail = addBox(cab, brassM, 2.15, 0.04, 0.08, 0, 2.02, 0.55);
    world.hopperRail = rail;
    cab.add(makeMarquee());
    return cab;
  }

  function makeWordLabel(text, color) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 48;
    const ctx = c.getContext("2d");
    ctx.fillStyle = color;
    ctx.font = "bold 28px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 64, 26);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    return new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.1), mat);
  }

  function makeHopper() {
    const g = new THREE.Group();
    const brassM = world.mat.brass;
    g.add(meshBox(brassM, 0.22, 0.16, 0.18, 0, 0, 0));
    g.add(meshBox(makeMat(0x1a100c), 0.14, 0.04, 0.12, 0, -0.08, 0.02));
    const coin = new THREE.Mesh(world.geo.coin, world.mat.coinSide[0]);
    coin.position.set(0, 0.04, 0.02);
    g.add(coin);
    g.position.set(0, 2.12, 0.55);
    return g;
  }

  function clearGroup(g) {
    if (!g) return;
    while (g.children.length) g.remove(g.children[0]);
  }

  function rebuildPlayfield(spec) {
    if (!world) return;
    const g = world.playfield;
    clearGroup(g);
    const shelves = makeShelves(spec);
    world.shelfGeom = shelves;
    world.pushers = [];
    world.trapdoor = null;
    world.trapdoorLid = null;
    const feltM = world.mat.felt;
    const darkM = world.mat.shelfDark;
    const brassM = world.mat.brass;
    const warnM = world.mat.warn;
    const pitM = world.mat.pit;

    shelves.forEach((sh) => {
      const depth = sh.z1 - sh.z0;
      const midZ = (sh.z1 + sh.z0) / 2;
      if (sh.seam && spec.seamW) {
        const ledge = (sh.half * 2 - spec.seamW) / 2;
        addBox(g, feltM, ledge, 0.04, depth, -sh.half + ledge / 2, sh.y, midZ);
        addBox(g, feltM, ledge, 0.04, depth, sh.half - ledge / 2, sh.y, midZ);
        addBox(g, darkM, spec.seamW, 0.42, depth + 0.08, 0, sh.y - 0.22, midZ);
        addBox(g, warnM, 0.02, 0.1, depth, -spec.seamW / 2, sh.y + 0.05, midZ);
        addBox(g, warnM, 0.02, 0.1, depth, spec.seamW / 2, sh.y + 0.05, midZ);
      } else {
        addBox(g, feltM, sh.half * 2, 0.04, depth, 0, sh.y, midZ);
      }
      addBox(g, brassM, sh.half * 2 + 0.06, 0.03, 0.05, 0, sh.y + 0.02, sh.z1);
      addBox(g, darkM, 0.05, 0.14, depth, -sh.half - 0.02, sh.y + 0.07, midZ);
      addBox(g, darkM, 0.05, 0.14, depth, sh.half + 0.02, sh.y + 0.07, midZ);
      if (sh.overhang || (sh.last && spec.lipHang)) {
        addBox(g, warnM, sh.half * 1.92, 0.01, 0.1 + spec.lipHang, 0, sh.y + 0.026, sh.z1 - 0.02);
      }
      if (sh.vMouth && spec.vHalf) {
        const v = new THREE.Mesh(new THREE.ConeGeometry(spec.vHalf, 0.62, 3), pitM);
        v.rotation.x = Math.PI;
        v.rotation.y = Math.PI;
        v.position.set(0, sh.y - 0.1, sh.z1 - 0.1);
        g.add(v);
      }
      if (sh.pusher) {
        const pusher = addBox(g, world.mat.pusher, sh.half * 1.84, 0.13, 0.26, 0, sh.y + 0.1, sh.z0 + 0.18);
        addBox(pusher, brassM, 1, 0.1, 0.08, 0, 0.06, 0.4);
        world.pushers.push({ mesh: pusher, shelf: sh.i, z: sh.z0 + 0.18, travel: sh.travel || spec.travel });
      }
      if (spec.kickers && sh.last) {
        const kL = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 4), world.mat.pusher);
        kL.rotation.z = 0.9;
        kL.position.set(-0.88, sh.y + 0.1, sh.z0 + 0.28);
        g.add(kL);
        const kR = kL.clone();
        kR.rotation.z = -0.9;
        kR.position.x = 0.88;
        g.add(kR);
      }
      if (sh.trapdoor) {
        const hatch = new THREE.Group();
        const lid = addBox(hatch, warnM, 0.3, 0.02, 0.38, 0, 0, 0);
        hatch.position.set(0, sh.y + 0.028, (sh.z0 + sh.z1) * 0.45);
        g.add(hatch);
        world.trapdoor = hatch;
        world.trapdoorLid = lid;
        world.trapdoorShelf = sh.i;
      }
    });
  }

  function coinValue(kind) {
    if (kind === 1) return 5;
    if (kind === 2) return 8;
    return 1;
  }

  function makeCoinMesh(kind) {
    const face = world.tex.penny[kind % 3];
    const side = world.mat.coinSide[kind % 3];
    const faceM = new THREE.MeshStandardMaterial({
      map: face, roughness: 0.34, metalness: 0.62, emissive: 0x6a4808, emissiveIntensity: 0.38,
    });
    let mesh;
    if (kind === 1) {
      mesh = new THREE.Mesh(new THREE.OctahedronGeometry(COIN_R * 1.05, 0), makeMat(GOLD, { metalness: 0.65, roughness: 0.26, emissive: 0x6a4808, emissiveIntensity: 0.7 }));
    } else if (kind === 2) {
      mesh = new THREE.Mesh(world.geo.coin, [side, faceM, faceM]);
      mesh.scale.setScalar(1.12);
    } else {
      mesh = new THREE.Mesh(world.geo.coin, [side, faceM, faceM]);
    }
    mesh.visible = false;
    world.coinsRoot.add(mesh);
    return mesh;
  }

  function allocCoin(kind) {
    let c = world.coinPool.pop();
    if (!c) {
      const k = kind != null ? kind : 0;
      c = {
        mesh: makeCoinMesh(k), kind: k, x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0,
        r: COIN_R, shelf: 0, land: 0, falling: false, gone: "", flash: 0, live: false,
      };
    } else if (kind != null && c.kind !== kind) {
      c.mesh.visible = false;
      world.coinsRoot.remove(c.mesh);
      c.mesh = makeCoinMesh(kind);
      c.kind = kind;
    }
    c.live = true;
    c.gone = "";
    c.falling = false;
    c.vx = 0;
    c.vz = 0;
    c.vy = 0;
    c.flash = 0;
    c.mesh.visible = true;
    return c;
  }

  function freeCoin(c) {
    c.live = false;
    c.mesh.visible = false;
    world.coinPool.push(c);
  }

  function liveCoins() {
    return world ? world.coins.filter((c) => c.live && !c.gone) : [];
  }

  function placeCoinMesh(c) {
    c.mesh.position.set(c.x, c.y, c.z);
    if (c.gone || c.falling) c.mesh.rotation.x += 0.18;
    else c.mesh.rotation.x = c.flash > 0 ? 0.18 : 0;
    c.mesh.scale.setScalar(c.flash > 0 ? 1.08 : (c.kind === 2 ? 1.12 : 1));
  }

  function bootWorld() {
    if (world) return world;
    const canvas = $("pusherCanvas");
    if (!canvas) return null;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.setClearColor(0x0a0608, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x12080c, 8.5, 16);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.08, 40);

    world = {
      renderer, scene, camera, canvas,
      geo: {
        box: new THREE.BoxGeometry(1, 1, 1),
        sphere: new THREE.SphereGeometry(1, 14, 12),
        cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
        coin: new THREE.CylinderGeometry(COIN_R, COIN_R, COIN_H, 20),
      },
      tex: {
        wood: woodTex("#3a2418"),
        woodDark: woodTex("#1a100c"),
        stripe: stripeTex(),
        felt: feltTex(),
        penny: [pennyFace(0), pennyFace(1), pennyFace(2)],
      },
      mat: {},
      bulbs: [],
      coins: [],
      coinPool: [],
      sparks: [],
      playfield: new THREE.Group(),
      coinsRoot: new THREE.Group(),
      pushers: [],
      shelfGeom: [],
      hopper: null,
      aura: null,
      marquee: null,
      pitGlow: [],
    };
    world.mat.felt = makeMat(0x2f7a58, { map: world.tex.felt, roughness: 0.82, emissive: 0x0c2a1c, emissiveIntensity: 0.22 });
    world.mat.shelfDark = makeMat(0x14080c, { roughness: 0.9 });
    world.mat.brass = makeMat(BRASS, { metalness: 0.78, roughness: 0.28, emissive: 0x3a2808, emissiveIntensity: 0.2 });
    world.mat.pusher = makeMat(0x6a4a28, { map: world.tex.wood, metalness: 0.2, roughness: 0.45 });
    world.mat.warn = makeMat(0xc41e3a, { emissive: 0x5a0810, emissiveIntensity: 0.55 });
    world.mat.pit = makeMat(0x1a0708, { roughness: 1 });
    world.mat.coinSide = [
      makeMat(0xc48a28, { metalness: 0.55, roughness: 0.38, emissive: 0x4a3008, emissiveIntensity: 0.28 }),
      makeMat(0xd4a45a, { metalness: 0.55, roughness: 0.38, emissive: 0x5a4008, emissiveIntensity: 0.32 }),
      makeMat(0xb86848, { metalness: 0.55, roughness: 0.38, emissive: 0x4a1808, emissiveIntensity: 0.28 }),
    ];

    scene.add(new THREE.HemisphereLight(0xffe6c8, 0x1a0c14, 0.95));
    scene.add(new THREE.AmbientLight(0x4a3020, 0.48));
    const spot = new THREE.SpotLight(0xffe0b0, 3.1, 14, 0.7, 0.4, 1);
    spot.position.set(0.2, 4.6, 4.1);
    spot.target.position.set(0, 1.2, 0.15);
    scene.add(spot);
    scene.add(spot.target);
    const fill = new THREE.DirectionalLight(0xffd8a8, 0.85);
    fill.position.set(-1.4, 3.2, 4.2);
    scene.add(fill);
    const cabLight = new THREE.PointLight(0xffc878, 2.2, 5.2, 1.15);
    cabLight.position.set(0, 2.05, 1.15);
    scene.add(cabLight);
    world.cabLight = cabLight;
    const inner = new THREE.PointLight(0xffe0b0, 1.8, 3.2, 1.2);
    inner.position.set(0, 1.55, 0.15);
    scene.add(inner);
    const auraLight = new THREE.PointLight(0x88c878, 0.9, 3.8, 1.4);
    auraLight.position.set(1.55, 1.6, 1.45);
    scene.add(auraLight);

    scene.add(buildTent());
    const cab = buildCabinet();
    scene.add(cab);
    cab.add(world.playfield);
    scene.add(world.coinsRoot);
    world.hopper = makeHopper();
    cab.add(world.hopper);

    const ghost = new THREE.Mesh(
      world.geo.coin,
      new THREE.MeshStandardMaterial({
        color: 0xffe6a6, transparent: true, opacity: 0.42,
        emissive: 0xd4a45a, emissiveIntensity: 0.8, depthWrite: false,
      })
    );
    ghost.scale.setScalar(1.2);
    world.ghost = ghost;
    scene.add(ghost);

    world.aura = makeAura();
    world.aura.position.set(1.42, 0, 1.55);
    scene.add(world.aura);
    world.sparks = makeSparks();
    camera.position.set(0.0, 1.88, 3.72);
    camera.lookAt(0.08, 1.18, 0.18);

    _v.a = new THREE.Vector3();
    _v.ray = new THREE.Raycaster();
    _v.ndc = new THREE.Vector2();
    _v.hit = new THREE.Vector3();
    _v.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -2.12);

    for (let i = 0; i < 28; i += 1) {
      world.coinPool.push({
        mesh: makeCoinMesh(i % 3 === 0 ? 0 : i % 5 === 0 ? 1 : 0),
        kind: i % 3 === 0 ? 0 : i % 5 === 0 ? 1 : 0,
        x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0, r: COIN_R,
        shelf: 0, land: 0, falling: false, gone: "", flash: 0, live: false,
      });
    }
    rebuildPlayfield(floorSpec(1));
    seedIdleCoins();
    resizeRenderer();
    if (typeof ResizeObserver !== "undefined") {
      world.ro = new ResizeObserver(() => resizeRenderer());
      world.ro.observe(canvas.parentElement || canvas);
    }
    window.addEventListener("resize", resizeRenderer);
    return world;
  }

  function resizeRenderer() {
    if (!world) return;
    const host = world.canvas.parentElement || card();
    const w = Math.max(320, (host && host.clientWidth) || window.innerWidth);
    const h = Math.max(360, (host && host.clientHeight) || window.innerHeight);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function seedIdleCoins() {
    if (!world) return;
    world.coins.forEach(freeCoin);
    world.coins.length = 0;
    const spec = floorSpec(((idleRoom - 1) % AUTHORED_COUNT) + 1);
    rebuildPlayfield(spec);
    paintMarquee(spec);
    const shelves = world.shelfGeom;
    for (let i = 0; i < 16; i += 1) {
      const sh = shelves[i % shelves.length];
      const c = allocCoin(spec.prizes && i % 7 === 0 ? 1 : 0);
      c.shelf = sh.i;
      c.land = sh.i;
      c.x = (Math.random() * 2 - 1) * (sh.half - 0.08);
      c.z = sh.z0 + 0.28 + Math.random() * Math.max(0.12, sh.z1 - sh.z0 - 0.4);
      c.y = sitY(sh);
      world.coins.push(c);
      placeCoinMesh(c);
    }
  }

  function inSeam(c, spec, sh) {
    if (!spec.seam || !sh || !sh.seam) return false;
    return Math.abs(c.x) < spec.seamW / 2;
  }

  function inVMouth(c, spec, sh) {
    if (!spec.vMouth || !sh || !sh.last) return false;
    const t = clamp((c.z - (sh.z1 - 0.5)) / 0.5, 0, 1);
    return Math.abs(c.x) < spec.vHalf * t && c.z > sh.z1 - 0.5;
  }

  function destFor(c, spec, sh) {
    if (inSeam(c, spec, sh)) return "pit";
    if (spec.vMouth && sh && sh.last) {
      if (inVMouth(c, spec, sh)) return Math.random() < 0.96 ? "pit" : "tray";
      return Math.random() < 0.05 ? "pit" : "tray";
    }
    const half = trayHalf(spec);
    if (Math.abs(c.x) > half) return "pit";
    const hanging = spec.lipHang && sh && c.z > sh.z1 - 0.1;
    return Math.random() < (hanging ? 0.28 : 0.06) ? "pit" : "tray";
  }

  function startFall(c, spec, sh, forceDest) {
    if (c.gone) return;
    c.gone = forceDest || destFor(c, spec, sh);
    c.falling = false;
    c.shelf = -1;
    c.vy = 0.04;
    c.flash = 160;
    if (run && isLive()) {
      if (c.gone === "tray") {
        const v = coinValue(c.kind);
        run.banked += v;
        run.strokeRescued += v;
        kit.sfx("tray");
        burstSparks(c.x * 0.25, 0.7, 1.12, c.kind ? 12 : 7);
        paintLiveHud();
      } else {
        run.strokeLost += 1;
        kit.sfx("pit");
      }
    }
  }

  function collideCoins() {
    const byShelf = {};
    liveCoins().forEach((c) => {
      if (c.falling || c.shelf < 0) return;
      (byShelf[c.shelf] || (byShelf[c.shelf] = [])).push(c);
    });
    Object.keys(byShelf).forEach((k) => {
      const list = byShelf[k];
      const minD = COIN_R * 2.02;
      const minD2 = minD * minD;
      for (let i = 0; i < list.length; i += 1) {
        const a = list[i];
        for (let j = i + 1; j < list.length; j += 1) {
          const b = list[j];
          const dx = b.x - a.x;
          const dz = b.z - a.z;
          const d2 = dx * dx + dz * dz;
          if (d2 >= minD2 || d2 < 1e-8) continue;
          const d = Math.sqrt(d2);
          const push = (minD - d) * 0.5;
          const nx = dx / d;
          const nz = dz / d;
          a.x -= nx * push;
          a.z -= nz * push;
          b.x += nx * push;
          b.z += nz * push;
          const rel = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
          if (rel < 0) {
            a.vx += nx * rel * 0.42;
            a.vz += nz * rel * 0.42;
            b.vx -= nx * rel * 0.42;
            b.vz -= nz * rel * 0.42;
          }
        }
      }
    });
  }

  function shoveFromPusher(spec, p, pusherVz) {
    const sh = world.shelfGeom[p.shelf];
    if (!sh) return;
    const front = p.z + 0.14;
    liveCoins().forEach((c) => {
      if (c.shelf !== p.shelf) return;
      if (Math.abs(c.x) > sh.half * 0.92) return;
      if (c.z - c.r < front && c.z + c.r > p.z - 0.16) {
        if (pusherVz > 0) {
          c.z = Math.max(c.z, front + c.r);
          c.vz = Math.max(c.vz, pusherVz * 1.55);
          c.flash = 40;
        }
      }
      if (spec.kickers && sh.last && c.z < sh.z0 + 0.5) {
        if (c.x < -0.7) { c.vx += 0.85; c.vz += 0.32; }
        if (c.x > 0.7) { c.vx -= 0.85; c.vz += 0.32; }
      }
    });
  }

  function stepCoins(dt, spec) {
    const shelves = world.shelfGeom;
    liveCoins().forEach((c) => {
      if (c.flash > 0) c.flash -= dt * 1000;
      if (c.gone) {
        const tx = c.gone === "tray" ? 0 : Math.sign(c.x || 1) * 1.08;
        const tz = c.gone === "tray" ? 1.14 : 1.02;
        c.vy -= 14 * dt;
        c.y += c.vy * dt;
        c.x += (tx - c.x) * 0.12;
        c.z += (tz - c.z) * 0.1;
        c.mesh.rotation.x += 8 * dt;
        if (c.y < 0.22) {
          if (c.gone === "tray") burstSparks(tx, 0.64, tz, 5);
          freeCoin(c);
        } else placeCoinMesh(c);
        return;
      }
      if (c.falling) {
        c.vy -= 16 * dt;
        c.y += c.vy * dt;
        c.x += c.vx * dt;
        c.z += c.vz * dt;
        const land = shelves[c.land];
        if (land && c.y <= sitY(land)) {
          c.y = sitY(land);
          c.vy = 0;
          c.falling = false;
          c.shelf = land.i;
          c.vx *= 0.55;
          c.vz = Math.max(c.vz * 0.7, 0.12);
          if (isLive()) kit.sfx("drop");
          if (inSeam(c, spec, land)) startFall(c, spec, land);
        }
        placeCoinMesh(c);
        return;
      }
      const sh = shelves[c.shelf];
      if (!sh) return;
      c.x += c.vx * dt;
      c.z += c.vz * dt;
      const slide = Math.exp(-1.8 * dt);
      c.vx *= slide;
      c.vz *= slide;
      const wall = sh.half - c.r - 0.04;
      if (c.x < -wall) { c.x = -wall; c.vx *= -0.22; }
      if (c.x > wall) { c.x = wall; c.vx *= -0.22; }
      if (c.z < sh.z0 + 0.2) { c.z = sh.z0 + 0.2; c.vz = Math.max(0, c.vz); }
      const teeter = sh.last && spec.lipHang && c.z > sh.z1 - 0.12;
      c.y = sitY(sh) - (teeter ? (c.z - (sh.z1 - 0.12)) * 0.4 : 0);
      if (teeter) c.flash = Math.max(c.flash, 70);
      if (inSeam(c, spec, sh)) startFall(c, spec, sh);
      else if (inVMouth(c, spec, sh) && c.z > sh.z1 - 0.18) startFall(c, spec, sh);
      else if (c.z + c.r >= sh.z1) {
        if (teeter && c.z < sh.z1 + spec.lipHang * 0.55) {
          placeCoinMesh(c);
          return;
        }
        if (sh.last) {
          startFall(c, spec, sh);
          if (run && isLive() && run.didShove) run.strokePending = true;
        } else {
          c.falling = true;
          c.shelf = -1;
          c.land = sh.i + 1;
          c.vy = 0.04;
          c.vz *= 0.5;
        }
      }
      placeCoinMesh(c);
    });
    world.coins = world.coins.filter((c) => c.live);
    collideCoins();
    liveCoins().forEach(placeCoinMesh);
  }

  function pusherZNow(p, spec, phase, sweepT) {
    const sh = world.shelfGeom[p.shelf];
    const back = (sh ? sh.z0 : -0.5) + 0.16;
    const travel = p.travel || spec.travel || 0.5;
    if (spec.doublePush) {
      const cycle = 2400;
      const t = (sweepT || 0) % cycle;
      let u = 0;
      if (t < 520) u = t / 520;
      else if (t < 760) u = 1;
      else if (t < 1080) u = 1 - ((t - 760) / 320) * 0.58;
      else if (t < 1600) u = 0.42 + ((t - 1080) / 520) * 0.58;
      else if (t < 1840) u = 1;
      else u = 1 - (t - 1840) / 560;
      return back + clamp(u, 0, 1) * travel;
    }
    const u = (Math.sin(phase) + 1) / 2;
    return back + u * travel;
  }

  function trapdoorThreatening() {
    return !!(run && !run.done && (run.trapdoorPhase === "mark" || run.trapdoorPhase === "wait" || run.trapdoorPhase === "shudder"));
  }

  function paintScream() {
    const on = !!(run && (run.awaiting || trapdoorThreatening()));
    const cash = $("pusherCash");
    if (cash) cash.classList.toggle("cash-scream", on);
    const greedCash = $("pusherGreedCash");
    if (greedCash) greedCash.classList.toggle("cash-scream", on);
  }

  function setGreed(on, rescued) {
    const el = $("pusherGreed");
    if (!el) return;
    el.hidden = !on;
    setText("pusherGreedN", String(rescued || 0));
    const cash = $("pusherCash");
    if (cash) cash.disabled = !run || run.done || (run.busy && !on && !trapdoorThreatening());
    const drop = $("pusherDrop");
    if (drop) drop.disabled = !run || run.done || run.busy || on;
    paintScream();
  }

  function armTrapdoor() {
    if (!run) return;
    if (!run.spec.trapdoor || !world.trapdoor) {
      run.trapdoorLane = 0;
      run.trapdoorDone = true;
      run.trapdoorPhase = "off";
      paintScream();
      return;
    }
    const sh = world.shelfGeom[world.trapdoorShelf] || world.shelfGeom[world.shelfGeom.length - 1];
    run.trapdoorX = (Math.random() * 2 - 1) * (sh.half * 0.55);
    run.trapdoorT = 0;
    run.trapdoorArm = 1100;
    run.trapdoorDone = false;
    run.trapdoorPhase = "mark";
    world.trapdoor.position.x = run.trapdoorX;
    world.trapdoor.visible = true;
    shake = Math.max(shake, 0.05);
    setText("pusherStatus", `${hudFloor(run.spec)} — hatch MARKED. It will shiver. CASH OUT if you want.`);
    paintScream();
  }

  function openTrapdoor() {
    run.trapdoorPhase = "open";
    run.trapdoorDone = true;
    shake = 0.26;
    let dumped = 0;
    const shI = world.trapdoorShelf != null ? world.trapdoorShelf : world.shelfGeom.length - 1;
    liveCoins().forEach((c) => {
      if (c.shelf !== shI) return;
      if (Math.abs(c.x - run.trapdoorX) > 0.2) return;
      startFall(c, run.spec, world.shelfGeom[shI], "pit");
      dumped += 1;
    });
    kit.sfx("pit");
    paintScream();
    setText("pusherStatus", dumped ? "TRAPDOOR — the hatch dumped the pit." : "TRAPDOOR — the hatch yawned empty.");
    if (!run.awaiting) run.strokePending = true;
  }

  function tickTrapdoor(dt) {
    if (!run || run.trapdoorDone || run.trapdoorPhase === "off") return;
    if (world.trapdoor) {
      const j = run.trapdoorPhase === "shudder" ? Math.sin(performance.now() / 22) * 0.04 : 0;
      world.trapdoor.position.x = (run.trapdoorX || 0) + j;
      if (world.trapdoorLid) {
        const u = run.trapdoorPhase === "open" ? 1 : (run.trapdoorPhase === "shudder" ? 1 - clamp(run.trapdoorT / 1600, 0, 1) : 0);
        world.trapdoorLid.rotation.x = u * 1.15;
      }
    }
    if (run.trapdoorPhase === "mark") {
      run.trapdoorArm -= dt;
      if (run.trapdoorArm > 0) return;
      run.trapdoorPhase = "wait";
      run.trapdoorT = 1800;
      paintScream();
      setText("pusherStatus", "Hatch is live. CASH OUT before it shivers.");
      return;
    }
    if (run.trapdoorPhase === "wait") {
      run.trapdoorT -= dt;
      if (run.trapdoorT > 0) return;
      run.trapdoorPhase = "shudder";
      run.trapdoorT = 1600;
      shake = 0.16;
      kit.sfx("shove");
      setText("pusherStatus", "The lid is lifting. CASH OUT or watch it dump.");
      return;
    }
    if (run.trapdoorPhase !== "shudder") return;
    run.trapdoorT -= dt;
    if (run.trapdoorT > 0) return;
    openTrapdoor();
  }

  function busyNow() {
    return world.coins.some((c) => c.live && (c.falling || c.gone));
  }

  function paintLiveHud() {
    if (!run) return;
    setText("depthPusherCoins", String(run.banked));
    setText("depthPusherM", hudFloor(run.spec));
  }

  function showToast(text, ms) {
    const el = $("pusherToast");
    if (!el) return;
    el.hidden = false;
    el.textContent = text;
    if (run) run.toastMs = ms || 1400;
  }

  function resolveStroke() {
    if (!run || run.done) return;
    const rescued = run.strokeRescued;
    const after = liveCoins().length;
    const floorNow = run.spec.floor;
    if (rescued > 0) run.floorSurvived = Math.max(run.floorSurvived, floorNow);
    if (run.kitRun && rk() && typeof rk().reportDepth === "function") {
      rk().reportDepth(run.kitRun, run.floorSurvived, { name: run.spec.name, coda: !!run.spec.coda });
    }
    setText("pusherStatus", rescued
      ? `Tray +${rescued}. ${hudFloor(run.spec)}. Greed, or walk?`
      : after
        ? `Sweeper missed the tray. ${hudFloor(run.spec)}.`
        : "Shelves empty. The pit is grinning.");
    if (run.spec.buried && after === 0 && rescued === 0) {
      finish("buried");
      return;
    }
    if (!run.spec.buried && after === 0) restockTowardBank();
    run.strokeRescued = 0;
    run.strokeLost = 0;
    if (rescued > 0) {
      run.awaiting = true;
      run.pendingAdvance = true;
      run.lastRescue = rescued;
      setGreed(true, rescued);
      setAuraMood("point");
      PF.setAura("point");
      return;
    }
    restockTowardBank();
  }

  function restockTowardBank() {
    if (!run || !world) return;
    const have = liveCoins().length;
    const add = Math.max(0, Math.min(5, run.spec.bank - have));
    for (let i = 0; i < add && liveCoins().length < MAX_COINS; i += 1) dropOnto(pickShelf(), true);
  }

  function pickShelf() {
    const n = world.shelfGeom.length;
    return n > 1 ? 1 + ((Math.random() * (n - 1)) | 0) : 0;
  }

  function seedBank(n) {
    const want = Math.min(MAX_COINS, n);
    const spec = run.spec;
    const shelves = world.shelfGeom;
    const last = shelves[shelves.length - 1];
    const nLast = Math.max(8, Math.ceil(want * 0.72));
    const gap = COIN_R * 2.06;
    const cols = Math.max(5, Math.min(9, Math.floor((last.half * 1.7) / gap)));
    for (let i = 0; i < want; i += 1) {
      const onLast = i < nLast;
      const sh = onLast ? last : shelves[i % Math.max(1, shelves.length - 1)];
      const kind = spec.prizes && onLast && i % 9 === 0 ? (Math.random() < 0.4 ? 2 : 1) : 0;
      const c = allocCoin(kind);
      c.shelf = sh.i;
      c.land = sh.i;
      if (onLast) {
        const col = (i % cols) - (cols - 1) / 2;
        const row = Math.floor(i / cols);
        c.x = clamp(col * gap + (Math.random() - 0.5) * 0.01, -sh.half + 0.08, sh.half - 0.08);
        c.z = clamp(sh.z1 - 0.12 - row * gap - (Math.random() * 0.01), sh.z0 + 0.24, sh.z1 - 0.09);
        if (spec.seam && sh.seam && Math.abs(c.x) < spec.seamW * 0.55) c.x += c.x < 0 ? -0.2 : 0.2;
      } else {
        c.x = (Math.random() * 2 - 1) * (sh.half - 0.12);
        c.z = sh.z0 + 0.26 + Math.random() * 0.18;
      }
      c.y = sitY(sh);
      world.coins.push(c);
      placeCoinMesh(c);
    }
  }

  function dropOnto(shelfI, restock) {
    const sh = world.shelfGeom[shelfI] || world.shelfGeom[0];
    const c = allocCoin(0);
    c.x = (Math.random() * 2 - 1) * (sh.half * 0.6);
    c.z = sh.z0 + 0.3;
    c.y = sh.y + 0.42;
    c.falling = true;
    c.shelf = -1;
    c.land = sh.i;
    c.vy = -0.15;
    world.coins.push(c);
    placeCoinMesh(c);
    if (!restock) kit.sfx("drop");
    return c;
  }

  function hopperRange() {
    const sh = world && world.shelfGeom && world.shelfGeom[0];
    return sh ? sh.half - 0.12 : 0.72;
  }

  function dropNow() {
    if (!isLive() || run.awaiting || run.dropCool > 0) return;
    if (liveCoins().length >= MAX_COINS) {
      setText("pusherStatus", "Glass packed. Cash out or wait for the shove.");
      return;
    }
    const top = world.shelfGeom[0];
    const c = allocCoin(0);
    c.x = clamp(aimX, -hopperRange(), hopperRange()) + (Math.random() - 0.5) * 0.012;
    c.z = top.z0 + 0.32;
    c.y = top.y + 0.52;
    c.falling = true;
    c.shelf = -1;
    c.land = 0;
    c.vy = -0.35;
    c.vz = 0.28;
    world.coins.push(c);
    placeCoinMesh(c);
    run.dropCool = 160;
    run.hopperKick = 1;
    kit.sfx("drop");
    setText("pusherStatus", "Penny away. The brass is coming.");
    flashKey("pusherKeyDrop");
    if (run.spec.avalanche && Math.random() < run.spec.avalanche) {
      shake = 0.2;
      setText("pusherStatus", "Avalanche! The cascade shudders.");
      liveCoins().forEach((coin) => {
        if (coin.shelf < 0) return;
        if (coin.z > 0.02) coin.vz += 0.5 + Math.random() * 0.35;
      });
    }
    setAuraMood("watch");
  }

  function flashKey(id) {
    const el = $(id);
    if (!el) return;
    el.classList.add("is-hot");
    setTimeout(() => el.classList.remove("is-hot"), 140);
  }

  function cameraTargets() {
    if (camMode === "play") {
      return { pos: [aimX * 0.2 - 0.15, 1.88, 3.72], look: [0.08, 1.18, 0.18] };
    }
    if (camMode === "greed") {
      return { pos: [0.12, 1.62, 2.85], look: [0, 0.82, 0.85] };
    }
    if (camMode === "result") {
      return { pos: [1.72, 1.7, 3.15], look: [0.15, 1.15, 0.12] };
    }
    const t = REDUCE ? 0 : idleClock * 0.00022;
    const yaw = 0.48 + Math.sin(t) * 0.32;
    const dist = 3.45;
    return {
      pos: [Math.sin(yaw) * dist, 1.78 + Math.sin(t * 0.7) * 0.1, Math.cos(yaw) * dist + 0.35],
      look: [0.1, 1.12, 0.12],
    };
  }

  function stepCamera(dt) {
    if (!world) return;
    camBlend = Math.min(1, camBlend + dt * 1.35);
    const tgt = cameraTargets();
    const cam = world.camera;
    const k = REDUCE ? 1 : lerp(0.1, 1, camBlend);
    cam.position.x = lerp(cam.position.x, tgt.pos[0], k);
    cam.position.y = lerp(cam.position.y, tgt.pos[1], k);
    cam.position.z = lerp(cam.position.z, tgt.pos[2], k);
    _v.a.set(tgt.look[0], tgt.look[1], tgt.look[2]);
    cam.lookAt(_v.a);
    if (shake > 0.002 && !REDUCE) {
      cam.position.x += (Math.random() - 0.5) * shake;
      cam.position.y += (Math.random() - 0.5) * shake * 0.6;
      shake *= 0.86;
    } else shake = 0;
  }

  function updateHopper(dt) {
    if (!world || !world.hopper) return;
    const playing = isLive() && !run.awaiting;
    const half = hopperRange();
    if (keys.L) aimX = clamp(aimX - 1.6 * dt, -half, half);
    if (keys.R) aimX = clamp(aimX + 1.6 * dt, -half, half);
    world.hopper.position.x = lerp(world.hopper.position.x, aimX, 0.28);
    if (run && run.hopperKick) {
      run.hopperKick = Math.max(0, run.hopperKick - dt * 4);
      world.hopper.rotation.x = run.hopperKick * 0.45;
    } else world.hopper.rotation.x = 0;
    if (world.ghost) {
      world.ghost.visible = playing;
      if (playing) {
        const top = world.shelfGeom[0];
        world.ghost.position.set(world.hopper.position.x, top.y + 0.42 + Math.sin(performance.now() * 0.006) * 0.03, top.z0 + 0.32);
        world.ghost.rotation.y += 0.04;
      }
    }
    const hint = $("pusherAimHint");
    if (hint) {
      hint.hidden = !playing;
      if (playing) {
        const t = clamp((aimX + half) / (half * 2), 0, 1);
        hint.textContent = t < 0.33 ? "Hopper left" : t > 0.67 ? "Hopper right" : "Hopper center";
      }
    }
  }

  function aimFromPointer(ev) {
    if (!world) return;
    const rect = world.canvas.getBoundingClientRect();
    const t = (ev.touches && ev.touches[0]) || ev;
    const nx = ((t.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const ny = -(((t.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
    _v.ndc.set(nx, ny);
    _v.ray.setFromCamera(_v.ndc, world.camera);
    const hit = _v.ray.ray.intersectPlane(_v.plane, _v.hit);
    const half = hopperRange();
    if (hit) aimX = clamp(_v.hit.x, -half, half);
    else aimX = clamp(nx * half, -half, half);
  }

  function beginKitRun() {
    if (typeof PF.spendDemoCoin === "function") {
      if (!PF.spendDemoCoin(GAME_ID)) return null;
    }
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      try {
        const ctx = PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1, feverNode: true });
        if (ctx) return ctx;
      } catch (_) { /* fall */ }
    }
    return { gameId: GAME_ID, startedAt: Date.now(), feverNode: true, feverGate: null, depth: 0, score: 0, strikes: 0, alive: true };
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try { return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false }); } catch (_) { /* */ }
    }
    kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "buried",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestPusherM = Math.max(state.bestPusherM || 0, payload.depth);
      state.bestPusherFloor = Math.max(state.bestPusherFloor || 0, payload.depth);
      if (partial.banked != null) state.bestPusherCoins = Math.max(state.bestPusherCoins || 0, partial.banked | 0);
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function scoreFor(cashed) {
    let pts = run.banked * 10 + run.floorSurvived * 200;
    if (cashed && run.floorSurvived >= 5) pts = Math.round(pts * 1.15);
    return pts;
  }

  function auraFor(reason, cashed) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (run.spec && run.spec.coda && cashed) return AURA.coda;
    if (cashed && run.floorSurvived >= 5) return AURA.cashDeep(run.floorSurvived);
    if (cashed) return AURA.cash;
    if (run.banked === 0) return AURA.empty;
    if (run.floorSurvived >= 4) return AURA.greed;
    return AURA.buried;
  }

  function challengeLine(n) {
    return `Beat my Coin Pusher floor ${n | 0} on Penny Fever`;
  }

  function qaStartAt() {
    const kitRun = rk();
    const n = kitRun && kitRun._qaStart && (kitRun._qaStart[GAME_ID] | 0);
    if (kitRun && kitRun._qaStart) kitRun._qaStart[GAME_ID] = 0;
    return n >= 1 ? n : 1;
  }

  function stampDepthCopy() {
    const host = card();
    if (!host) return;
    const tag = host.querySelector("[data-pf-depth-tag]");
    if (tag) tag.textContent = DEPTH_COPY.tag;
    const copy = host.querySelector("[data-pf-depth-copy]");
    if (copy) copy.textContent = DEPTH_COPY.body;
    const hud = document.querySelector(".pusher-rk-hud");
    if (hud) hud.textContent = run && !run.done && run.spec ? hudFloor(run.spec) : "";
    if ((!run || run.done) && host.classList.contains("is-vestibule")) setText("pusherStatus", DEPTH_COPY.status);
  }

  function revealResult(shot) {
    const { reason, cashed, floor, banked, score, aura } = shot;
    $("pusherStart").disabled = false;
    $("pusherStart").hidden = false;
    $("pusherStart").textContent = "PLAY AGAIN · 1 demo coin";
    PF.focusCard("pusherCard", false);
    kit.setMode(card(), "result");
    camMode = "result";
    camBlend = 0;
    setAuraMood(cashed ? "cheer" : "sad");
    const line = `FLOOR ${floor} · ${banked} BANKED · SCORE ${score}`;
    $("pusherVerdict").hidden = false;
    $("pusherVerdict").textContent = cashed
      ? `Walked away. ${line}.`
      : reason === "leave" ? `Left the glass · ${line}` : `Buried. ${line}.`;
    kit.fillResult({
      root: "pusherResult", depth: "pusherResultDepth", score: "pusherResultScore",
      aura: "pusherResultAura", copied: "pusherCopied",
    }, {
      depthLine: cashed ? `FLOOR ${floor} · WALKED` : `FLOOR ${floor} · BURIED`,
      scoreLine: `SCORE ${score} · ${banked} banked`,
      auraLine: aura,
    });
    setText("pusherChallengeText", challengeLine(floor));
    PF.setTier("pusherTier", cashed ? `FLOOR ${floor}` : "BURIED", cashed ? "perfect" : "miss");
    setText("pusherStatus", cashed ? "Cashed the cascade." : "The ledge keeps your greed.");
    const ok = cashed || banked > 0 || floor > 0;
    if (ok) {
      PF.award(Math.max(cashed ? 12 : 8, Math.floor(score / 8)), true, cashed ? "Pusher cash-out" : "Pusher");
      PF.setAura(cashed ? "celebrate" : "laugh");
      if (reason !== "leave") PF.showBanner(cashed, cashed ? `FLOOR ${floor}` : "BURIED", `${banked} banked · ${aura}`);
    } else {
      PF.award(0, false, "Pusher miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "BURIED", aura);
    }
    PF.refreshNightBoard();
    stampDepthCopy();
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.awaiting = false;
    setGreed(false);
    const cashed = reason === "cash" || reason === "souvenir";
    if (cashed) kit.sfx("cash");
    else if (reason !== "leave") kit.sfx("bury");
    const floor = run.floorSurvived;
    const banked = run.banked;
    const score = scoreFor(cashed);
    if (cashed && banked > 0 && typeof PF.addDemoCoins === "function") {
      PF.addDemoCoins(banked);
    }
    const shot = { reason, cashed, floor, banked, score, aura: auraFor(reason, cashed) };
    persistDepth({
      depth: floor, score, banked,
      deathReason: reason === "souvenir" ? "souvenir" : (cashed ? "cashed_out" : (reason === "leave" ? "leave" : "buried")),
      cashedOut: cashed,
      meta: { room: run.spec && run.spec.name, coda: !!(run.spec && run.spec.coda) },
    });
    stampDepthCopy();
    if (reason === "leave" || cashed) {
      revealResult(shot);
      return;
    }
    setTimeout(() => revealResult(shot), 720);
  }

  function cashOut() {
    if (!isLive()) return;
    finish("cash");
  }

  function enterFloor(next, fromFloor) {
    run.spec = next;
    rebuildPlayfield(next);
    liveCoins().forEach((c) => {
      const sh = world.shelfGeom[Math.min(c.shelf, world.shelfGeom.length - 1)] || world.shelfGeom[0];
      c.shelf = sh.i;
      c.land = sh.i;
      c.x = clamp(c.x, -sh.half + 0.08, sh.half - 0.08);
      if (next.seam && sh.seam && Math.abs(c.x) < next.seamW * 0.5) {
        c.x += c.x < 0 ? -0.22 : 0.22;
      }
      c.y = sitY(sh);
      c.z = clamp(c.z, sh.z0 + 0.22, sh.z1 - 0.12);
      placeCoinMesh(c);
    });
    run.floorSurvived = Math.max(run.floorSurvived, fromFloor);
    if (run.kitRun && rk() && typeof rk().reportDepth === "function") {
      rk().reportDepth(run.kitRun, next.floor, { name: next.name, coda: !!next.coda });
    }
    armTrapdoor();
    restockTowardBank();
    run.sweepT = 0;
    run.sweepPunch = 0;
    run.phase = -Math.PI / 2;
    paintMarquee(next);
    paintLiveHud();
    showToast(hudFloor(next), 1500);
  }

  function dropAgain() {
    if (!run || run.done) return;
    run.awaiting = false;
    setGreed(false);
    setAuraMood("watch");
    camMode = "play";
    camBlend = 0;
    if (run.pendingAdvance) {
      run.pendingAdvance = false;
      const floorNow = run.spec.floor;
      if (floorNow >= AUTHORED_COUNT && !run.spec.coda && !codaOn()) {
        finish("souvenir");
        return;
      }
      const next = floorSpec(floorNow + 1);
      if (!next) {
        finish("souvenir");
        return;
      }
      enterFloor(next, floorNow);
      if (next.coda && floorNow === AUTHORED_COUNT) {
        setText("pusherStatus", `${hudFloor(next)} — ${next.barker}`);
        PF.setAura("think");
        return;
      }
    }
    setText("pusherStatus", `${hudFloor(run.spec)} — ${run.spec.barker}`);
    PF.setAura("think");
  }

  function start() {
    if (starting || (run && !run.done)) return;
    starting = true;
    declareP0();
    ensureWorld().then(() => {
      try {
        if (!world) {
          setText("pusherStatus", "This shelf needs WebGL glass.");
          return;
        }
        const kitRun = beginKitRun();
        if (!kitRun) {
          setText("pusherStatus", "Out of demo coins · grant a pass");
          PF.refreshNightBoard();
          stampDepthCopy();
          return;
        }
        const spec = floorSpec(qaStartAt());
        if (!spec) {
          stampDepthCopy();
          return;
        }
        world.coins.forEach(freeCoin);
        world.coins.length = 0;
        rebuildPlayfield(spec);
        aimX = 0;
        run = {
          done: false, kitRun, spec, banked: 0, floorSurvived: 0,
          phase: -Math.PI / 2, didShove: false, dropCool: 0, busy: false,
          awaiting: false, strokeRescued: 0, strokeLost: 0, strokePending: false,
          lastRescue: 0, pendingAdvance: false, trapdoorX: 0, trapdoorT: 0,
          trapdoorDone: true, trapdoorPhase: "off", trapdoorArm: 0,
          sweepT: 0, sweepPunch: 0, hopperKick: 0, toastMs: 0,
        };
        if (rk() && typeof rk().reportDepth === "function") {
          try { rk().reportDepth(kitRun, spec.floor, { name: spec.name, coda: !!spec.coda }); } catch (_) { /* */ }
        }
        seedBank(spec.bank);
        $("pusherStart").disabled = true;
        $("pusherStart").hidden = true;
        if ($("pusherVerdict")) $("pusherVerdict").hidden = true;
        kit.hideResult("pusherResult");
        PF.setTier("pusherTier", "", "");
        kit.setMode(card(), "play");
        camMode = "play";
        camBlend = 0;
        setAuraMood("watch");
        stampDepthCopy();
        setGreed(false);
        armTrapdoor();
        paintMarquee(spec);
        paintLiveHud();
        setText("pusherStatus", `${hudFloor(spec)} — ${spec.barker}`);
        showToast(hudFloor(spec), 900);
        PF.focusCard("pusherCard", true);
        PF.setAura("think");
      } finally {
        starting = false;
      }
    }).catch(() => { starting = false; });
  }

  function stepRun(dtMs) {
    if (!run || run.done) return;
    const dt = dtMs;
    const spec = run.spec;
    run.dropCool = Math.max(0, run.dropCool - dt);
    if (run.toastMs > 0) {
      run.toastMs -= dt;
      if (run.toastMs <= 0 && $("pusherToast")) $("pusherToast").hidden = true;
    }
    tickTrapdoor(dt);
    const dtSec = dt / 1000;
    if (spec.doublePush) {
      run.sweepT = (run.sweepT || 0) + dt;
      world.pushers.forEach((p) => {
        const prev = p.z;
        p.z = pusherZNow(p, spec, run.phase, run.sweepT);
        p.mesh.position.z = p.z;
        if (p.z > prev + 0.0005) shoveFromPusher(spec, p, (p.z - prev) / Math.max(0.008, dtSec));
      });
      const t = run.sweepT % 2400;
      const punch = t < 760 ? 1 : t < 1840 ? 2 : 0;
      if (punch && punch !== run.sweepPunch) {
        run.sweepPunch = punch;
        run.didShove = true;
        kit.sfx("shove");
        shake = punch === 2 ? 0.12 : 0.08;
        setText("pusherStatus", punch === 1 ? `${hudFloor(spec)} — first sweep.` : `${hudFloor(spec)} — second sweep. Decide.`);
      }
      if (punch === 0) {
        if (run.didShove && !run.strokePending) run.strokePending = true;
        run.didShove = false;
        run.sweepPunch = 0;
      }
    } else {
      run.phase += dt * spec.speed;
      world.pushers.forEach((p) => {
        const prev = p.z;
        p.z = pusherZNow(p, spec, run.phase, 0);
        p.mesh.position.z = p.z;
        if (p.z > prev + 0.0005) shoveFromPusher(spec, p, (p.z - prev) / Math.max(0.008, dtSec));
      });
      const wave = Math.sin(run.phase);
      if (wave > 0.92 && !run.didShove) {
        run.didShove = true;
        kit.sfx("shove");
        shake = 0.07;
      }
      if (run.didShove && wave < 0.55 && !run.strokePending) run.strokePending = true;
      if (wave < -0.72) run.didShove = false;
    }
    stepCoins(dtSec, spec);
    run.busy = busyNow();
    if (run.strokePending && !run.busy) {
      run.strokePending = false;
      resolveStroke();
    }
    camMode = run.awaiting ? "greed" : "play";
    const cash = $("pusherCash");
    const drop = $("pusherDrop");
    if (cash) cash.disabled = !!run.done;
    if (drop) drop.disabled = !!run.awaiting;
    paintScream();
    if (typeof window !== "undefined") {
      window.__pusherDebug = {
        live: liveCoins().length,
        banked: run.banked,
        awaiting: !!run.awaiting,
        busy: !!run.busy,
        floor: run.spec.floor,
        status: ($("pusherStatus") || {}).textContent || "",
      };
    }
  }

  function stepIdle(dtMs) {
    idleClock += dtMs;
    if (idleClock > 4200) {
      idleClock = 0;
      idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
      seedIdleCoins();
    }
    const spec = floorSpec(((idleRoom - 1) % AUTHORED_COUNT) + 1);
    if (!world || !spec) return;
    const phase = idleClock * spec.speed * 0.9;
    world.pushers.forEach((p) => {
      const prev = p.z;
      p.z = pusherZNow(p, spec, phase, idleClock);
      p.mesh.position.z = p.z;
      if (p.z > prev) shoveFromPusher(spec, p, (p.z - prev) / 0.016);
    });
    stepCoins(dtMs / 1000, spec);
    if (liveCoins().length < 10) dropOnto(pickShelf(), true);
  }

  function tick(now) {
    const cab = $("cabinet-coin-pusher");
    if (!visible) {
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
    if (cab && cab.hidden) return;
    if (!world) return;
    if (!lastTs) lastTs = now;
    const dt = Math.min(32, now - lastTs);
    lastTs = now;
    if (isLive()) stepRun(dt);
    else stepIdle(dt);
    animateAura(dt / 1000);
    stepSparks(dt / 1000);
    updateHopper(dt / 1000);
    stepCamera(dt / 1000);
    marqueePulse += dt;
    if (world.cabLight) world.cabLight.intensity = 1.45 + Math.sin(marqueePulse * 0.004) * 0.25;
    world.bulbs.forEach((b, i) => {
      const on = REDUCE ? 0.7 : 0.45 + Math.sin(marqueePulse * 0.006 + i * 0.7) * 0.45;
      b.material.emissiveIntensity = 0.4 + on;
    });
    if (typeof PF.refreshDepth === "function" && isLive()) PF.refreshDepth();
    world.renderer.render(world.scene, world.camera);
  }

  function startLoop() {
    if (raf) return;
    lastTs = 0;
    raf = requestAnimationFrame(tick);
  }

  function pauseLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function ensureWorld() {
    if (world) return Promise.resolve(world);
    if (bootPromise) return bootPromise;
    if (!canGL()) {
      setText("pusherStatus", "This shelf needs WebGL glass.");
      return Promise.resolve(null);
    }
    bootPromise = Promise.resolve().then(() => {
      bootWorld();
      startLoop();
      return world;
    }).catch(() => {
      setText("pusherStatus", "The glass fogged. WebGL failed to light.");
      return null;
    });
    return bootPromise;
  }

  function onPointerDown(ev) {
    if (!isLive()) {
      if (ev.button === 0 && (!run || run.done)) {
        const c = card();
        if (c && c.classList.contains("is-vestibule")) start();
      }
      return;
    }
    ev.preventDefault();
    aimFromPointer(ev);
    dropNow();
  }

  function onPointerMove(ev) {
    aimFromPointer(ev);
    if (keys.L) flashKey("pusherKeyL");
    if (keys.R) flashKey("pusherKeyR");
  }

  function onKey(ev) {
    const cab = $("cabinet-coin-pusher");
    if (!cab || cab.hidden) return;
    if (ev.key === "Enter" && (!run || run.done)) {
      start();
      return;
    }
    if (!isLive()) return;
    if (ev.key === "c" || ev.key === "C") { ev.preventDefault(); cashOut(); return; }
    if (ev.key === " " || ev.key === "Enter") { ev.preventDefault(); dropNow(); return; }
    if (ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "A") {
      ev.preventDefault();
      keys.L = true;
      flashKey("pusherKeyL");
    }
    if (ev.key === "ArrowRight" || ev.key === "d" || ev.key === "D") {
      ev.preventDefault();
      keys.R = true;
      flashKey("pusherKeyR");
    }
  }

  function onKeyUp(ev) {
    if (ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "A") keys.L = false;
    if (ev.key === "ArrowRight" || ev.key === "d" || ev.key === "D") keys.R = false;
  }

  PF.registerVendor({
    id: "coin-pusher",
    playKey: "pusher",
    chalk: "Greed is the game. Cash out or go deeper.",
    defaults: { bestPusherM: 0, bestPusherCoins: 0, bestPusherFloor: 0 },
    onLeave() {
      visible = false;
      if (run && !run.done) finish("leave");
      requestAnimationFrame(() => {
        const el = $("cabinet-coin-pusher");
        if (el && el.hidden) pauseLoop();
      });
    },
    onShow() {
      visible = true;
      declareP0();
      stampDepthCopy();
      function kickStart() {
        if (!visible) return;
        const c = card();
        if (c && c.classList.contains("is-result")) return;
        startLoop();
        if (!isLive()) start();
      }
      ensureWorld().then(() => {
        resizeRenderer();
        kickStart();
      });
      setTimeout(kickStart, 240);
      setTimeout(kickStart, 800);
    },
    onReset() {
      if (run && !run.done) run.done = true;
      run = null;
      if ($("pusherVerdict")) $("pusherVerdict").hidden = true;
      kit.hideResult("pusherResult");
      if ($("pusherStart")) {
        $("pusherStart").disabled = false;
        $("pusherStart").hidden = false;
        $("pusherStart").textContent = "DROP IN · 1 demo coin";
      }
      setGreed(false);
      kit.setMode(card(), "vestibule");
      camMode = "idle";
      camBlend = 0;
      setAuraMood("idle");
      stampDepthCopy();
      if (world) seedIdleCoins();
    },
    refreshDepth(state) {
      if (run && !run.done) {
        setText("depthPusherM", hudFloor(run.spec));
        setText("depthPusherCoins", String(run.banked));
      } else if (!card() || !card().classList.contains("is-playing")) {
        setText("depthPusherM", "FLOOR 0");
        setText("depthPusherCoins", "0");
      }
      const bm = $("depthPusherBestM");
      if (bm) {
        bm.textContent = (state.bestPusherFloor || state.bestPusherM)
          ? `Floor ${state.bestPusherFloor || Math.floor(state.bestPusherM)}`
          : "—";
      }
      const bc = $("depthPusherBestC");
      if (bc) bc.textContent = state.bestPusherCoins ? String(state.bestPusherCoins) : "—";
    },
    bind() {
      declareP0();
      const startBtn = $("pusherStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const cash = $("pusherCash");
      if (cash) cash.addEventListener("click", cashOut);
      const drop = $("pusherDrop");
      if (drop) drop.addEventListener("click", dropNow);
      const again = $("pusherDropAgain");
      if (again) again.addEventListener("click", dropAgain);
      const greedCash = $("pusherGreedCash");
      if (greedCash) greedCash.addEventListener("click", cashOut);
      const canvas = $("pusherCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
      }
      window.addEventListener("keydown", onKey);
      window.addEventListener("keyup", onKeyUp);
      const copyBtn = $("pusherChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = (PF.getState().lastRun && PF.getState().lastRun.game === GAME_ID)
            ? PF.getState().lastRun.depth
            : (PF.getState().bestPusherFloor || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const el = $("pusherCopied");
            if (el) el.hidden = false;
            setText("pusherStatus", "Copied — send it");
          }, () => setText("pusherStatus", text));
        });
      }
    },
  });
}
