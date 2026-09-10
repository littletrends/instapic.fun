/* Digger’s Vault — Desktop Grok owns this doorway.
 * PF only. Never booth/port 6000. Never Imagine.
 * FULL 3D GAME (not a shelf list, not a 2D timing bar):
 *   Steer a brass claw over a descending velvet vault. Drop on a glowing curio.
 *   Catch one to unlock the next floor. Miss both drops and the fog keeps you.
 *   Cash out anytime after a catch — or greed the stairs.
 *   7 authored floors then ENDLESS. One coin = one run.
 * Aura lock: pigtails, yellow crown + heart, green pinafore, black shoes.
 * Family-safe. No casino. No Mirror Crew.
 */
import * as THREE from "../world/lib/three.module.min.js";

(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const GAME_ID = "curios";
  const AUTHORED_COUNT = 7;
  const CODA_ENABLED = true;
  const PIT_X = 2.15;
  const PIT_Z = 1.55;
  const HANG = 2.38;
  const PIT_Y = 0.46;
  const REDUCE = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  const SKIN = 0xe8c4a8;
  const HAIR = 0x3b2218;
  const CROWN = 0xf2c75c;
  const HEART = 0xc41e3a;
  const PINAFORE = 0x2f6b38;
  const BLOUSE = 0xf3ead8;
  const SHOES = 0x111111;

  const AURA = {
    cash: "Aura: Smart pocket. The claw likes a guest who walks.",
    cashDeep: (n) => `Aura: Floor ${n} and you left with the velvet still on. I noticed.`,
    miss: "Aura: Empty pit. The vault kept the night — and your pocket.",
    decoy: "Aura: That one was glass. The warm one was real.",
    ghost: "Aura: You grabbed the reflection. Rude of the mirror.",
    greed: "Aura: You had a pocket. You wanted stairs. Empty pit.",
    stairs: "Aura: You hesitated. The stairs took you.",
    souvenir: "Aura: Heart Chamber survived. Souvenir — the vault bowed.",
    coda: "Aura: Authored vaults are over. ENDLESS — fog climbs.",
    leave: "Aura: You stepped out mid-drop. The curios stay.",
    catch: "Aura: Not filed yet. Walk with it — or risk the whole pocket.",
    heart: "Aura: That’s my heart. Don’t drop it on the stairs.",
  };

  const P0_MOUNT = {
    engine: "GreedFloor",
    displayName: "Digger’s Vault",
    depthUnit: "Floor",
    sheet: "GOBLIN_BATCH06_BUILD_SHEETS.md",
    cashOut: true,
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · DRAG · DROP · CASH OUT OR RISK THE POCKET",
    body: "A 3D claw, not a shelf list. Drag to aim. Hit DROP. Catch files nothing until you cash out. Descend and miss an empty pit — the vault eats every curio you were carrying.",
    status: "Drag to aim. DROP to grab. Cash out keeps the pocket. Empty pit is death.",
    punch: "Depth run — press START. No one-tap prize.",
  };

  const LOOT = [
    { id: "ticket_stub", name: "Ticket stub", shelf: "alley", kind: "ticket", color: 0xf0d09a, pts: 80 },
    { id: "pressed_heart", name: "Pressed heart", shelf: "alley", kind: "heart", color: 0xc41e3a, pts: 140 },
    { id: "lucky_match", name: "Lucky match", shelf: "alley", kind: "vial", color: 0xf2c75c, pts: 90 },
    { id: "whisper_charm", name: "Whisper charm", shelf: "alley", kind: "ribbon", color: 0x7b9ec9, pts: 90 },
    { id: "mirror_shard", name: "Mirror shard", shelf: "alley", kind: "shard", color: 0xc5d4e0, pts: 100 },
    { id: "showman_ribbon", name: "Showman ribbon", shelf: "alley", kind: "ribbon", color: 0xc41e3a, pts: 110 },
    { id: "mercury_bead", name: "Mercury bead", shelf: "guts", kind: "penny", color: 0x9aa8b0, pts: 100 },
    { id: "gyro_ghost", name: "Gyro ghost", shelf: "guts", kind: "reel", color: 0x8ec8c8, pts: 110 },
    { id: "shutter_click", name: "Shutter click", shelf: "guts", kind: "reel", color: 0xd4a45a, pts: 90 },
    { id: "sweet_heat", name: "Sweet heat", shelf: "guts", kind: "vial", color: 0xe07a9a, pts: 110 },
    { id: "coin_slot", name: "Coin slot", shelf: "guts", kind: "slot", color: 0xb08948, pts: 80 },
    { id: "marquee_bulb", name: "Marquee bulb", shelf: "guts", kind: "bulb", color: 0xffe08a, pts: 90 },
  ];

  const AUTHORED = [
    { id: 1, name: "Glass Nursery", kind: "nursery", catchR: 0.62, fog: 0.012, attempts: 2, spin: 0, hitch: 0, decoy: false, mirror: false, aura: false, prizes: 3, bob: 0.03, light: "warm", barker: "MOVE the claw over a prize. DROP to grab it. Fat gold, slow pit — learn the ring." },
    { id: 2, name: "Velvet Carousel", kind: "carousel", catchR: 0.48, fog: 0.018, attempts: 2, spin: 0.7, hitch: 0, decoy: false, mirror: false, aura: false, prizes: 4, bob: 0.05, light: "rose", barker: "The shelf turns. Lead the prize. Drop when gold kisses the ring." },
    { id: 3, name: "Twin Reliquary", kind: "decoy", catchR: 0.42, fog: 0.022, attempts: 2, spin: 0, hitch: 0, decoy: true, mirror: false, aura: false, prizes: 2, bob: 0.04, light: "split", barker: "Two pedestals. The COLD one bites. Take the WARM heart." },
    { id: 4, name: "Fog Cellar", kind: "fog", catchR: 0.4, fog: 0.06, attempts: 2, spin: 0.18, hitch: 0, decoy: false, mirror: false, aura: false, prizes: 3, bob: 0.16, light: "teal", barker: "Fog eats the pit. Trust the gold ring, not your eyes." },
    { id: 5, name: "Gantry Jolt", kind: "hitch", catchR: 0.36, fog: 0.028, attempts: 2, spin: 0, hitch: 1, decoy: false, mirror: false, aura: false, prizes: 3, bob: 0.05, light: "flicker", barker: "The rail SLIPS. Don’t drop on the stutter." },
    { id: 6, name: "Mirror Vault", kind: "mirror", catchR: 0.34, fog: 0.03, attempts: 2, spin: 0.14, hitch: 0, decoy: false, mirror: true, aura: false, prizes: 1, bob: 0.05, light: "silver", barker: "One prize is glass. Drop on the BRIGHT one." },
    { id: 7, name: "Heart Chamber", kind: "heart", catchR: 0.3, fog: 0.02, attempts: 2, spin: 0.1, hitch: 0, decoy: false, mirror: false, aura: true, prizes: 1, bob: 0.1, light: "gold", rare: true, barker: "Aura’s watching. The heart is shy. Make it count." },
  ];

  let world = null;
  let worldFailed = false;
  let run = null;
  let raf = 0;
  let lastTs = 0;
  let bound = false;
  let idleRoom = 1;
  let idleClock = 0;
  const keys = { n: false, s: false, w: false, e: false };
  const aim = { x: 0, z: 0, tx: 0, tz: 0, touch: false };
  const drag = { id: null, moved: false, sx: 0, sy: 0, touch: false };
  let toastT = 0;
  const _ray = new THREE.Raycaster();
  const _ndc = new THREE.Vector2();
  const _hit = new THREE.Vector3();
  const _pitPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.16);

  const geo = {
    box: new THREE.BoxGeometry(1, 1, 1),
    sphere: new THREE.SphereGeometry(1, 16, 12),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 14),
    cone: new THREE.ConeGeometry(1, 1, 8),
  };

  function el(id) { return $(id); }
  function card() { return el("curiosCard"); }
  function rk() { return PF.runKit || null; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function setText(id, t) { const n = el(id); if (n) n.textContent = t; }
  function cabinetOn() {
    const c = el("cabinet-curios");
    return !!(c && !c.hidden);
  }

  function codaOn() {
    const row = rk() && ((rk().declared && rk().declared[GAME_ID]) || (rk().p0 && rk().p0[GAME_ID]));
    if (row && typeof row.codaEnabled === "boolean") return !!row.codaEnabled;
    return CODA_ENABLED;
  }
  function codaFloor(n) {
    const t = Math.max(0, n - AUTHORED_COUNT);
    return {
      id: n, name: `Greed Coda ${n}`, kind: "coda",
      catchR: Math.max(0.18, 0.3 - t * 0.018), fog: Math.min(0.11, 0.04 + t * 0.01),
      attempts: 2, spin: 0.5 + (t % 3) * 0.12, hitch: t % 2 === 0 ? 1 : 0,
      decoy: t % 3 === 1, mirror: t % 3 === 2, aura: t % 4 === 0, prizes: 4, bob: 0.12,
      light: "coda", coda: true, barker: "ENDLESS — fog climbs. Cash out or the vault keeps you.",
    };
  }
  function floorSpec(n) {
    const floor = Math.max(1, n | 0);
    if (floor <= AUTHORED_COUNT) return Object.assign({ floor, coda: false }, AUTHORED[floor - 1]);
    if (!codaOn()) return null;
    return Object.assign({ floor }, codaFloor(floor));
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    const spec = Object.assign({
      authored: AUTHORED, authoredCount: AUTHORED_COUNT, cashOut: true,
      codaEnabled: CODA_ENABLED, codaParams: codaFloor, level: floorSpec, stageParams: floorSpec,
    }, P0_MOUNT);
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, spec); } catch (_) {}
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.declared = kitRun.declared || {};
    kitRun.mounted = kitRun.mounted || {};
    kitRun.p0[GAME_ID] = spec;
    kitRun.declared[GAME_ID] = spec;
    kitRun.mounted[GAME_ID] = true;
  }

  function mat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.55, metalness: 0.14 }, extra || {}));
  }
  function mesh(g, material, sx, sy, sz, x, y, z) {
    const m = new THREE.Mesh(g, material);
    m.scale.set(sx, sy, sz);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = !REDUCE;
    m.receiveShadow = true;
    return m;
  }
  function texPaint(w, h, paint) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    paint(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = mat(SKIN, { roughness: 0.55 });
    const cloth = mat(PINAFORE, { roughness: 0.7, emissive: 0x0a2010, emissiveIntensity: 0.22 });
    const blouse = mat(BLOUSE);
    const hairM = mat(HAIR, { roughness: 0.72 });
    const shoeM = mat(SHOES, { metalness: 0.55, roughness: 0.28 });
    const gold = mat(CROWN, { metalness: 0.72, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.5 });
    const heartM = mat(HEART, { emissive: HEART, emissiveIntensity: 0.65 });
    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.28, 12), blouse);
    torso.position.y = 0.28;
    hip.add(torso);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.14, 0.34, 12), cloth);
    skirt.position.y = 0.08;
    hip.add(skirt);
    const head = new THREE.Group();
    head.position.y = 0.62;
    hip.add(head);
    head.add(mesh(geo.sphere, skin, 0.18, 0.18, 0.18, 0, 0.02, 0));
    head.add(mesh(geo.sphere, hairM, 0.2, 0.2, 0.2, 0, 0.06, -0.03));
    [-1, 1].forEach((s) => {
      head.add(mesh(geo.sphere, hairM, 0.1, 0.1, 0.1, s * 0.18, -0.05, 0.04));
      head.add(mesh(geo.sphere, heartM, 0.04, 0.04, 0.04, s * 0.18, 0.05, 0.06));
      head.add(mesh(geo.sphere, mat(0xf7f2ea), 0.035, 0.04, 0.02, s * 0.055, 0.03, 0.15));
      head.add(mesh(geo.sphere, mat(0x2a1810), 0.018, 0.018, 0.018, s * 0.055, 0.03, 0.168));
    });
    const crown = new THREE.Group();
    crown.position.y = 0.22;
    head.add(crown);
    crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 16), gold));
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, h, 6), gold);
      spike.position.set(x, h * 0.45, 0);
      crown.add(spike);
    });
    const gem = mesh(geo.box, heartM, 0.055, 0.055, 0.025, 0, 0.02, 0.11);
    gem.rotation.z = Math.PI / 4;
    crown.add(gem);
    const heart = mesh(geo.box, heartM, 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    heart.rotation.z = Math.PI / 4;
    hip.add(heart);
    function limb(side, arm) {
      const p = new THREE.Group();
      p.position.set(side * (arm ? 0.16 : 0.08), arm ? 0.36 : 0, 0);
      const len = arm ? 0.28 : 0.34;
      const bone = new THREE.Mesh(new THREE.CylinderGeometry(arm ? 0.035 : 0.042, arm ? 0.035 : 0.042, len, 10), arm ? skin : cloth);
      bone.position.y = -len / 2;
      p.add(bone);
      if (!arm) p.add(mesh(geo.box, shoeM, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03));
      else p.add(mesh(geo.sphere, skin, 0.04, 0.04, 0.04, 0, -len, 0));
      hip.add(p);
      return p;
    }
    const armR = limb(1, true);
    limb(-1, true); limb(-1, false); limb(1, false);
    g.userData = { hip, head, armR, t: 0 };
    return g;
  }

  function prizeMesh(loot, decoy, ghost) {
    const g = new THREE.Group();
    const col = decoy ? 0x4a6270 : ghost ? 0xb8c4cc : loot.color;
    const extra = {
      emissive: decoy ? 0x102028 : col,
      emissiveIntensity: decoy ? 0.08 : ghost ? 0.18 : 0.5,
      transparent: !!ghost, opacity: ghost ? 0.4 : 1,
      roughness: decoy ? 0.85 : 0.4, metalness: ghost ? 0.7 : 0.28,
    };
    const m = mat(col, extra);
    const k = loot.kind;
    if (k === "heart") {
      g.add(mesh(geo.sphere, m, 0.16, 0.16, 0.16, -0.09, 0.08, 0));
      g.add(mesh(geo.sphere, m, 0.16, 0.16, 0.16, 0.09, 0.08, 0));
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.28, 8), m);
      tip.rotation.x = Math.PI; tip.position.y = -0.1; g.add(tip);
    } else if (k === "vial") {
      const vial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.32, 12), m);
      vial.position.y = 0.06; g.add(vial);
      g.add(mesh(geo.sphere, m, 0.1, 0.1, 0.1, 0, 0.24, 0));
    } else if (k === "penny") {
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 20), m);
      coin.rotation.x = Math.PI / 2; g.add(coin);
    } else if (k === "reel") {
      g.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 16), m));
    } else if (k === "ticket") {
      g.add(mesh(geo.box, m, 0.34, 0.02, 0.2, 0, 0.04, 0));
    } else if (k === "bulb") {
      g.add(mesh(geo.sphere, m, 0.14, 0.14, 0.14, 0, 0.08, 0));
    } else if (k === "ribbon") {
      g.add(new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 8, 16), m));
    } else if (k === "shard") {
      const sh = mesh(geo.box, m, 0.12, 0.28, 0.04, 0, 0.08, 0); sh.rotation.z = 0.4; g.add(sh);
    } else if (k === "slot") {
      g.add(mesh(geo.box, m, 0.28, 0.2, 0.12, 0, 0.06, 0));
    } else g.add(mesh(geo.sphere, m, 0.16, 0.16, 0.16, 0, 0.08, 0));
    return g;
  }

  function makeWorld() {
    const canvas = el("curiosCanvas");
    if (!canvas) return null;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !REDUCE, alpha: false, powerPreference: "high-performance", failIfMajorPerformanceCaveat: false });
    } catch (_) { return null; }
    if (!renderer.getContext || !renderer.getContext()) return null;
    renderer.setClearColor(0x070406, 1);
    if (renderer.outputColorSpace && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !REDUCE;
    if (THREE.PCFSoftShadowMap) renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x12080c, 0.016);
    const camera = new THREE.PerspectiveCamera(54, 1, 0.08, 60);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    camera.position.set(0, 3.55, 7.6);

    const velvet = mat(0x4a1830, {
      map: texPaint(256, 256, (ctx, w, h) => {
        ctx.fillStyle = "#4a1830"; ctx.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 18) { ctx.fillStyle = x % 36 ? "#3a1226" : "#5c2040"; ctx.fillRect(x, 0, 8, h); }
      }),
      roughness: 0.92, metalness: 0.04,
    });
    const wood = mat(0x5a3822, { roughness: 0.78 });
    const brass = mat(0xc4a05a, { metalness: 0.78, roughness: 0.28, emissive: 0x4a3008, emissiveIntensity: 0.22 });
    const dark = mat(0x1a0c10, { roughness: 0.7 });
    const glass = mat(0x88a0b4, { transparent: true, opacity: 0.12, roughness: 0.12, metalness: 0.35, depthWrite: false });
    const gold = mat(CROWN, { metalness: 0.7, roughness: 0.3, emissive: 0x6a4808, emissiveIntensity: 0.45 });

    const root = new THREE.Group();
    scene.add(root);
    root.add(mesh(geo.box, wood, 16, 0.18, 14, 0, -0.2, 0.4));
    root.add(mesh(geo.box, velvet, 0.35, 7.2, 12, -6.4, 3.2, -0.4));
    root.add(mesh(geo.box, velvet, 0.35, 7.2, 12, 6.4, 3.2, -0.4));
    root.add(mesh(geo.box, velvet, 14, 7.2, 0.35, 0, 3.2, -5.6));
    root.add(mesh(geo.box, velvet, 14, 0.28, 12, 0, 6.4, -0.2));
    for (let i = 0; i < 7; i += 1) {
      const penn = mesh(geo.cone, i % 2 ? gold : mat(HEART, { emissive: HEART, emissiveIntensity: 0.25 }), 0.22, 0.55, 0.22, (i - 3) * 1.15, 5.85, 2.4);
      penn.rotation.x = Math.PI; root.add(penn);
    }

    const cabinet = new THREE.Group();
    root.add(cabinet);
    cabinet.add(mesh(geo.box, wood, 6.4, 3.6, 4.6, 0, 1.7, -0.15));
    cabinet.add(mesh(geo.box, velvet, 5.2, 2.4, 0.12, 0, 1.15, -2.15));
    cabinet.add(mesh(geo.box, velvet, 0.12, 2.4, 3.8, -2.55, 1.15, -0.2));
    cabinet.add(mesh(geo.box, velvet, 0.12, 2.4, 3.8, 2.55, 1.15, -0.2));
    cabinet.add(mesh(geo.box, dark, 5.1, 0.12, 3.7, 0, 0.08, -0.2));
    const gf = mesh(geo.box, glass, 5.15, 2.55, 0.06, 0, 1.55, 2.12); gf.castShadow = false; cabinet.add(gf);
    const signTex = texPaint(512, 160, (ctx, w, h) => {
      ctx.fillStyle = "#1a0c10"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#d4a45a"; ctx.lineWidth = 10; ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.fillStyle = "#f2c75c"; ctx.font = "bold 48px Georgia, serif"; ctx.textAlign = "center";
      ctx.fillText("DIGGER’S VAULT", w / 2, 78);
      ctx.fillStyle = "#f0d09a"; ctx.font = "22px Georgia, serif";
      ctx.fillText("MOVE · DROP · CASH OUT OR DESCEND", w / 2, 118);
    });
    cabinet.add(mesh(geo.box, mat(0x1a0c10, { map: signTex, roughness: 0.55 }), 3.6, 0.7, 0.08, 0, 4.15, 2.28));

    const gantry = new THREE.Group();
    gantry.position.set(0, 3.52, -0.15);
    cabinet.add(gantry);
    gantry.add(mesh(geo.box, brass, 0.85, 0.16, 4.1, 0, 0, 0));
    const cable = mesh(geo.cyl, mat(0x2a2018, { metalness: 0.4 }), 0.025, 1, 0.025, 0, -0.55, 0);
    gantry.add(cable);
    const claw = new THREE.Group();
    claw.position.y = -1.1;
    gantry.add(claw);
    claw.add(mesh(geo.sphere, brass, 0.16, 0.12, 0.16, 0, 0, 0));
    const jaws = [];
    for (let i = 0; i < 3; i += 1) {
      const jaw = new THREE.Group();
      jaw.rotation.y = (i * Math.PI * 2) / 3;
      const finger = mesh(geo.box, brass, 0.05, 0.42, 0.08, 0.16, -0.22, 0);
      finger.rotation.z = 0.35;
      jaw.add(finger); claw.add(jaw); jaws.push(finger);
    }

    const reticle = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 8, 24), mat(CROWN, {
      emissive: CROWN, emissiveIntensity: 0.85, transparent: true, opacity: 0.92,
    }));
    reticle.rotation.x = Math.PI / 2;
    reticle.position.set(0, 0.16, -0.15);
    cabinet.add(reticle);

    const prizeGroup = new THREE.Group();
    prizeGroup.position.set(0, 0.22, -0.15);
    cabinet.add(prizeGroup);

    const bulbs = [];
    for (let i = 0; i < 6; i += 1) {
      const b = mesh(geo.sphere, mat(0xffe08a, { emissive: 0xffc878, emissiveIntensity: 0.7 }), 0.09, 0.09, 0.09, (i - 2.5) * 1.05, 5.55, 2.15);
      b.castShadow = false; root.add(b);
      const L = new THREE.PointLight(0xffd4a0, 0.32, 6, 2);
      L.position.copy(b.position); root.add(L);
      bulbs.push({ mesh: b, light: L });
    }

    const ambient = new THREE.AmbientLight(0x2a1820, 0.45);
    const key = new THREE.DirectionalLight(0xffd4a0, 1.15);
    key.position.set(3.4, 7.2, 5.5);
    key.castShadow = !REDUCE;
    const fill = new THREE.PointLight(0x3d8a8a, 0.55, 14, 2);
    fill.position.set(-2.4, 2.2, 2.2);
    const pit = new THREE.PointLight(0xf2c75c, 0.9, 7, 2);
    pit.position.set(0, 1.6, -0.2);
    const clawSpot = new THREE.SpotLight(0xfff1c8, 1.15, 8, 0.38, 0.4, 1.4);
    clawSpot.position.set(0, 3.6, 0);
    clawSpot.target.position.set(0, 0.2, -0.15);
    scene.add(ambient, key, fill, pit, clawSpot, clawSpot.target);

    const dustN = REDUCE ? 36 : 80;
    const dustPos = new Float32Array(dustN * 3);
    for (let i = 0; i < dustN; i += 1) {
      dustPos[i * 3] = (Math.random() - 0.5) * 8;
      dustPos[i * 3 + 1] = Math.random() * 5.5;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xf0d09a, size: 0.035, transparent: true, opacity: 0.4, depthWrite: false }));
    scene.add(dust);

    const aura = makeAura();
    aura.position.set(2.85, 0, 1.35);
    aura.rotation.y = -0.7;
    root.add(aura);

    return {
      renderer, scene, camera, root, cabinet, gantry, cable, claw, jaws, reticle,
      prizeGroup, prizes: [], aura, bulbs, dust, dustPos,
      lights: { key, fill, pit, claw: clawSpot },
      shake: 0, dip: 0, descend: 0, fovPunch: 0, time: 0, dropY: HANG, jawsOpen: 0.22,
    };
  }

  function resizeWorld() {
    if (!world) return;
    const stage = el("curiosStage");
    const canvas = el("curiosCanvas");
    if (!stage || !canvas) return;
    const w = Math.max(280, stage.clientWidth || 960);
    const h = Math.max(320, stage.clientHeight || 720);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    world.renderer.setPixelRatio(dpr);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / Math.max(1, h);
    world.camera.updateProjectionMatrix();
  }

  function ensureWorld() {
    if (worldFailed) return null;
    if (world) return world;
    world = makeWorld();
    if (!world) {
      worldFailed = true;
      const fail = el("curiosWebglFail");
      if (fail) fail.hidden = false;
      return null;
    }
    const fail = el("curiosWebglFail");
    if (fail) fail.hidden = true;
    resizeWorld();
    return world;
  }

  function pickLoot(spec, i) {
    if (spec.rare || spec.kind === "heart") return LOOT[1];
    if (spec.decoy && i === 0) return LOOT[1];
    return LOOT[(i + (spec.id || 1) * 3) % LOOT.length];
  }
  function clearPrizes() {
    if (!world) return;
    while (world.prizeGroup.children.length) world.prizeGroup.remove(world.prizeGroup.children[0]);
    world.prizes = [];
  }
  function layoutPrizes(spec) {
    clearPrizes();
    if (!world || !spec) return;
    const n = spec.prizes || 3;
    for (let i = 0; i < n; i += 1) {
      const loot = pickLoot(spec, i);
      const decoy = !!(spec.decoy && i === n - 1);
      const meshG = prizeMesh(loot, decoy, false);
      let x = 0, z = 0;
      if (spec.spin || spec.kind === "carousel") {
        const a = (i / n) * Math.PI * 2;
        x = Math.cos(a) * 1.15; z = Math.sin(a) * 0.85;
      } else if (n === 1) { x = 0; z = 0; }
      else if (n === 2) { x = i ? 1.15 : -1.15; z = 0; }
      else { x = (i - (n - 1) / 2) * 1.2; z = i % 2 ? -0.35 : 0.15; }
      meshG.position.set(x, 0.12, z);
      world.prizeGroup.add(meshG);
      world.prizes.push({ group: meshG, loot, decoy, ghost: false, caught: false, x, z, baseY: 0.12, catchR: spec.catchR || 0.4 });
    }
    if (spec.mirror && world.prizes[0]) {
      const real = world.prizes[0];
      const ghost = prizeMesh(real.loot, false, true);
      ghost.position.set(-real.x, 0.12, real.z);
      world.prizeGroup.add(ghost);
      world.prizes.push({ group: ghost, loot: real.loot, decoy: false, ghost: true, caught: false, x: -real.x, z: real.z, baseY: 0.12, catchR: spec.catchR || 0.4 });
    }
    world.prizeGroup.rotation.y = 0;
  }
  function applyLights(spec) {
    if (!world) return;
    const table = {
      warm: [0xffd4a0, 1.2, 0xf2c75c, 0.9],
      rose: [0xffb0c8, 1.05, 0xe07a9a, 0.8],
      split: [0xf0d09a, 0.9, 0x3d8a8a, 1.1],
      teal: [0x8ec8c8, 0.7, 0x3d8a8a, 1.25],
      flicker: [0xffe08a, 1.0, 0xd4a45a, 0.7],
      silver: [0xc5d4e0, 0.95, 0xb8c4cc, 0.85],
      gold: [0xffe08a, 1.35, 0xf2c75c, 1.2],
      coda: [0xc45a6a, 0.85, 0x3d8a8a, 1.0],
    };
    const row = table[(spec && spec.light) || "warm"] || table.warm;
    world.lights.key.color.setHex(row[0]); world.lights.key.intensity = row[1];
    world.lights.pit.color.setHex(row[2]); world.lights.pit.intensity = row[3];
    if (world.scene.fog) world.scene.fog.density = spec && spec.fog != null ? spec.fog : 0.016;
  }

  function isLive() { return !!(run && !run.done && run.kitRun && run.kitRun.alive !== false); }

  function toast(msg, good) {
    const n = el("curiosToast");
    if (!n) return;
    n.hidden = false;
    n.textContent = msg;
    n.classList.add("is-on");
    n.classList.toggle("is-good", !!good);
    n.classList.toggle("is-bad", !good);
    toastT = 1.4;
  }
  function paintHud() {
    const spec = (run && !run.done && run.spec) || floorSpec(idleRoom);
    const floorEl = el("curiosHudFloor");
    if (floorEl) {
      floorEl.textContent = spec
        ? (spec.coda ? `ENDLESS · FLOOR ${spec.floor} · ${spec.name}` : `FLOOR ${spec.floor} · ${spec.name}`)
        : "FLOOR";
    }
    const score = el("curiosHudScore");
    if (score) {
      if (run && !run.done) {
        const left = "●".repeat(run.attempts) + "○".repeat(Math.max(0, (run.spec.attempts || 2) - run.attempts));
        score.textContent = `POCKET ${run.loot.length} · DROPS ${left}`;
      } else score.textContent = "POCKET 0 · DROPS ●●";
    }
    const hint = el("curiosHudHint");
    if (hint) hint.textContent = (spec && spec.barker) || DEPTH_COPY.status;
  }
  function showDropFab(on) {
    const fab = el("curiosDropFab");
    if (fab) fab.hidden = !on;
  }
  function setCardFlag(name, on) {
    const c = card();
    if (c) c.classList.toggle(name, !!on);
  }
  function setGreed(on, line) {
    const box = el("curiosGreed");
    if (box) box.hidden = !on;
    if (line) setText("curiosGreedLine", line);
    const cash = el("curiosCash");
    if (cash) { cash.hidden = !on; cash.disabled = !on; cash.classList.toggle("cash-scream", on); }
    const drop = el("curiosDrop");
    if (drop) drop.hidden = on || !isLive();
    showDropFab(isLive() && !on && run && run.phase === "aim");
    setCardFlag("is-decide", on);
    const fill = el("curiosGreedFill");
    if (fill && on && run && run.greedMax) fill.style.width = "100%";
  }
  function overlayStart(show) {
    const o = el("curiosStartOverlay");
    if (o) o.hidden = !show;
  }

  function fileCurio(loot) {
    if (!loot) return false;
    const state = PF.getState();
    if (!state) return false;
    state.curios = state.curios || {};
    if (state.curios[loot.id]) return false;
    state.curios[loot.id] = { shelf: loot.shelf || "alley", at: Date.now() };
    if (typeof PF.saveState === "function") PF.saveState();
    return true;
  }

  function prizeWorld(p) {
    const v = new THREE.Vector3();
    p.group.getWorldPosition(v);
    return v;
  }
  function hotTarget() {
    if (!world) return null;
    let best = null, bestD = 99;
    world.prizes.forEach((p) => {
      if (p.caught) return;
      const pos = prizeWorld(p);
      const dx = pos.x - world.gantry.position.x;
      const dz = pos.z - (world.gantry.position.z);
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < bestD) { bestD = d; best = p; }
    });
    return best && bestD < (best.catchR + 0.12) ? best : null;
  }
  function tryGrab() {
    let hit = null, hitD = 99;
    const gx = world.gantry.position.x;
    const gz = world.gantry.position.z;
    world.prizes.forEach((p) => {
      if (p.caught) return;
      const pos = prizeWorld(p);
      const d = Math.sqrt((pos.x - gx) ** 2 + (pos.z - gz) ** 2);
      if (d < p.catchR && d < hitD) { hitD = d; hit = p; }
    });
    if (!hit) return { ok: false, reason: "miss" };
    if (hit.decoy) return { ok: false, reason: "decoy", prize: hit };
    if (hit.ghost) return { ok: false, reason: "ghost", prize: hit };
    hit.caught = true;
    run.caughtThis = hit;
    run.loot.push(hit.loot);
    run.score += (hit.loot.pts || 80) + (run.spec.rare ? 80 : 0);
    run.floorSurvived = Math.max(run.floorSurvived, run.spec.floor);
    return { ok: true, prize: hit };
  }
  function bankPocket() {
    if (!run || run.banked) return;
    (run.loot || []).forEach((loot) => fileCurio(loot));
    run.banked = true;
  }

  function dropNow() {
    if (!isLive() || run.phase !== "aim") return;
    run.phase = "drop";
    showDropFab(false);
    world.dip = 0.22;
    world.fovPunch = 6;
    world.jawsOpen = 0.18;
    if (kit && kit.sfx) kit.sfx("drop");
    setText("curiosStatus", "Claw falling…");
  }

  function afterDrop(result) {
    if (result.ok) {
      if (kit && kit.sfx) kit.sfx("tray");
      if (PF.setAura) PF.setAura("celebrate");
      world.shake = 0.12;
      run.phase = "rise";
      run.riseWith = result.prize;
      toast(`Caught ${result.prize.loot.name}`, true);
      setText("curiosStatus", `${result.prize.loot.name} — caught.`);
    } else {
      if (kit && kit.sfx) kit.sfx("miss");
      world.shake = 0.28;
      run.attempts -= 1;
      if (rk() && run.kitRun && typeof rk().reportStrike === "function") {
        try { rk().reportStrike(run.kitRun, result.reason); } catch (_) {}
      }
      run.phase = "rise";
      run.riseWith = null;
      run.failReason = result.reason;
      const line = result.reason === "decoy" ? AURA.decoy : result.reason === "ghost" ? AURA.ghost : "Miss. Fog licked the prongs.";
      toast(run.attempts <= 0 ? "EMPTY PIT" : (result.reason === "miss" ? "Miss" : result.reason), false);
      setText("curiosStatus", run.attempts <= 0 ? "Empty pit. The vault is taking the pocket." : line);
    }
    paintHud();
    PF.refreshDepth && PF.refreshDepth();
  }

  function greedPrompt() {
    const n = run.loot.length;
    const pts = scoreFor(true);
    const next = floorSpec(run.spec.floor + 1);
    const nextName = next ? next.name : "the dark";
    const tease = el("curiosGreedTease");
    if (tease) tease.textContent = next ? `NEXT FLOOR · ${nextName}` : "NO FLOOR LEFT · WALK";
    const cashBtn = el("curiosGreedCash");
    if (cashBtn) cashBtn.textContent = `CASH OUT · KEEP ${n}`;
    const downBtn = el("curiosDescend");
    if (downBtn) downBtn.textContent = next ? "DESCEND · RISK ALL" : "CASH OUT";
    const timer = el("curiosGreedTimer");
    const sweat = (run.spec.floor | 0) >= 2;
    run.greedMax = sweat ? 7000 : 0;
    run.greedMs = sweat ? 7000 : null;
    if (timer) {
      timer.hidden = !sweat;
      timer.textContent = sweat ? "The stairs are pulling. Hesitate and they take you." : "";
    }
    const line = n === 1
      ? `1 curio · ${pts} pts in the pocket. Walk — or risk it all on ${nextName}.`
      : `${n} curios · ${pts} pts in the pocket. Walk — or risk every last one on ${nextName}.`;
    return run.spec.kind === "heart" ? `${AURA.heart} ${line}` : line;
  }

  function emptyPitDeath(reason) {
    if (!run || run.done || run.phase === "empty") return;
    run.phase = "empty";
    run.emptyT = 0;
    run.emptyReason = reason || "miss";
    run.lost = run.loot.length;
    setGreed(false);
    showDropFab(false);
    setCardFlag("is-empty", true);
    const stamp = el("curiosEmpty");
    if (stamp) stamp.hidden = false;
    const lost = run.lost;
    setText("curiosEmptyLine", lost
      ? `The vault ate ${lost} curio${lost === 1 ? "" : "s"} you refused to walk with.`
      : "Nothing in the pocket. The pit is empty. You are too.");
    toast("EMPTY PIT", false);
    setText("curiosStatus", "EMPTY PIT — the vault keeps the night.");
    if (kit && kit.sfx) kit.sfx("bury");
    dumpPocketIntoPit();
    if (PF.setAura) PF.setAura("badLuck");
  }

  function goDecide() {
    if (run.riseWith && world) {
      world.cabinet.attach(run.riseWith.group);
      const slot = Math.max(0, run.loot.length - 1);
      run.riseWith.group.position.set(-2.05 + (slot % 3) * 0.38, 0.78, 2.22);
      run.riseWith.group.scale.setScalar(0.72);
      run.riseWith = null;
    }
    world.jawsOpen = 0.22;
    if (run.caughtThis) {
      run.phase = "decide";
      setGreed(true, greedPrompt());
      setText("curiosStatus", AURA.catch);
      if (PF.setAura) PF.setAura("give");
      return;
    }
    if (run.attempts <= 0) {
      emptyPitDeath(run.failReason === "decoy" ? "decoy" : (run.failReason === "ghost" ? "ghost" : "miss"));
      return;
    }
    run.phase = "aim";
    showDropFab(true);
    setText("curiosStatus", `Still ${run.attempts} drop${run.attempts === 1 ? "" : "s"}. Drag, then DROP.`);
  }

  function enterFloor(spec, fromFloor) {
    run.spec = spec;
    run.attempts = spec.attempts || 2;
    run.phase = "aim";
    run.caughtThis = null;
    run.riseWith = null;
    world.dropY = HANG;
    layoutPrizes(spec);
    applyLights(spec);
    if (fromFloor != null) run.floorSurvived = Math.max(run.floorSurvived, fromFloor);
    if (run.kitRun && rk() && typeof rk().reportDepth === "function") {
      try { rk().reportDepth(run.kitRun, spec.floor, { name: spec.name, coda: !!spec.coda }); } catch (_) {}
    }
    setGreed(false);
    showDropFab(true);
    setCardFlag("is-empty", false);
    const stamp = el("curiosEmpty");
    if (stamp) stamp.hidden = true;
    paintHud();
    setText("curiosStatus", spec.barker);
    const barker = card() && card().querySelector(".barker-call");
    if (barker) barker.textContent = spec.barker;
    toast(spec.name, true);
  }

  function descend() {
    if (!isLive() || run.phase !== "decide") return;
    const floorNow = run.spec.floor;
    if (floorNow >= AUTHORED_COUNT && !run.spec.coda && !codaOn()) { finish("souvenir"); return; }
    const next = floorSpec(floorNow + 1);
    if (!next) { finish("souvenir"); return; }
    run.greedMs = null;
    if (kit && kit.sfx) kit.sfx("chapter");
    run.phase = "descend";
    run.descendFrom = floorNow;
    run.descendTo = next;
    run.descendT = 0;
    world.descend = 1;
    setGreed(false);
    setText("curiosStatus", next.coda ? AURA.coda : `Descending to ${next.name}…`);
    if (PF.setAura) PF.setAura("think");
  }

  function beginKitRun() {
    if (typeof PF.spendDemoCoin === "function") {
      if (!PF.spendDemoCoin(GAME_ID)) return null;
    }
    if (rk() && typeof rk().startRun === "function") {
      try {
        const ctx = rk().startRun({ gameId: GAME_ID, coinCost: 1, feverNode: true });
        if (ctx) return ctx;
      } catch (_) {}
    }
    return { gameId: GAME_ID, startedAt: Date.now(), feverNode: true, feverGate: null, depth: 0, score: 0, strikes: 0, alive: true };
  }
  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try { return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false }); } catch (_) {}
    }
    if (kit && kit.persistRun) kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }
  function persistDepth(partial) {
    const state = PF.getState();
    const payload = { depth: partial.depth | 0, score: partial.score | 0, deathReason: partial.deathReason || "fog", cashedOut: !!partial.cashedOut, meta: partial.meta || {} };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestCurioFloor = Math.max(state.bestCurioFloor || 0, payload.depth);
      if (partial.loot != null) state.bestCurioLoot = Math.max(state.bestCurioLoot || 0, partial.loot | 0);
    }
    closeKitRun(payload);
    if (kit && kit.persistRun) kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }
  function scoreFor(cashed) {
    let pts = run.score + run.floorSurvived * 200;
    if (cashed && run.floorSurvived >= 4) pts = Math.round(pts * 1.15);
    return pts;
  }
  function auraFor(reason, cashed) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (run.spec && run.spec.coda && cashed) return AURA.coda;
    if (cashed && run.floorSurvived >= 5) return AURA.cashDeep(run.floorSurvived);
    if (cashed) return AURA.cash;
    if (reason === "decoy") return AURA.decoy;
    if (reason === "ghost") return AURA.ghost;
    if (reason === "greed" || reason === "stairs") return AURA.greed;
    if (run.floorSurvived >= 1 && (run.lost || (run.loot && run.loot.length))) return AURA.greed;
    return AURA.miss;
  }
  function challengeLine(n) {
    if (rk() && typeof rk().challengeText === "function") return rk().challengeText("Digger Vault floor", n | 0, GAME_ID);
    return `Beat my Digger Vault floor ${n | 0} on Penny Fever`;
  }

  function revealResult(shot) {
    const startBtn = el("curiosStart");
    if (startBtn) { startBtn.disabled = false; startBtn.hidden = false; startBtn.textContent = "DROP AGAIN · 1 demo coin"; }
    const go = el("curiosGo");
    if (go) { go.disabled = false; go.textContent = "DROP AGAIN · 1 demo coin"; }
    overlayStart(true);
    if (el("curiosDrop")) el("curiosDrop").hidden = true;
    if (el("curiosCash")) { el("curiosCash").hidden = true; el("curiosCash").disabled = true; }
    setGreed(false);
    if (PF.focusCard) PF.focusCard("curiosCard", false);
    if (kit && kit.setMode) kit.setMode(card(), "result");
    const cashed = shot.cashed;
    const line = cashed
      ? `FLOOR ${shot.floor} · KEPT ${shot.loot} · SCORE ${shot.score}`
      : `EMPTY PIT · LOST ${shot.lost || 0} · FLOOR ${shot.floor}`;
    const verdict = el("curiosVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = cashed ? `Walked away. ${line}.` : shot.reason === "leave" ? `Left the vault · ${line}` : line;
    }
    if (kit && kit.fillResult) {
      kit.fillResult({
        root: "curiosResult", depth: "curiosResultDepth", score: "curiosResultScore",
        aura: "curiosResultAura", copied: "curiosCopied",
      }, {
        depthLine: cashed ? `FLOOR ${shot.floor} · WALKED` : `FLOOR ${shot.floor} · EMPTY PIT`,
        scoreLine: cashed ? `SCORE ${shot.score} · kept ${shot.loot}` : `SCORE ${shot.score} · lost ${shot.lost || 0}`,
        auraLine: shot.aura,
      });
    }
    setText("curiosResultReason", cashed ? "Cashed the pocket. The vault didn’t get a bite." : "EMPTY PIT. Greed fed the fog.");
    setText("curiosChallengeText", challengeLine(shot.floor));
    if (PF.setTier) PF.setTier("curiosTier", cashed ? `FLOOR ${shot.floor}` : "EMPTY PIT", cashed ? "perfect" : "miss");
    setText("curiosStatus", cashed ? "Cashed the vault. Pocket is yours." : "EMPTY PIT — the vault kept your greed.");
    const ok = cashed || shot.loot > 0 || shot.floor > 0;
    if (ok) {
      if (PF.award) PF.award(Math.max(cashed ? 12 : 8, Math.floor(shot.score / 8)), true, cashed ? "Vault cash-out" : "Vault");
      if (PF.setAura) PF.setAura(cashed ? "celebrate" : "laugh");
      if (shot.reason !== "leave" && PF.showBanner) PF.showBanner(cashed, cashed ? `FLOOR ${shot.floor}` : "EMPTY PIT", cashed ? `kept ${shot.loot} · ${shot.aura}` : `lost ${shot.lost || 0} · ${shot.aura}`);
    } else {
      if (PF.award) PF.award(0, false, "Empty pit");
      if (PF.setAura) PF.setAura("badLuck");
      if (shot.reason !== "leave" && PF.showBanner) PF.showBanner(false, "EMPTY PIT", shot.aura);
    }
    if (PF.refreshNightBoard) PF.refreshNightBoard();
    if (PF.refreshDepth) PF.refreshDepth();
    paintHud();
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.phase = reason === "cash" || reason === "souvenir" ? "cash" : "dead";
    const cashed = reason === "cash" || reason === "souvenir";
    if (cashed) bankPocket();
    if (kit && kit.sfx && reason !== "miss" && reason !== "decoy" && reason !== "ghost") {
      kit.sfx(cashed ? "cash" : (reason === "leave" ? "miss" : "bury"));
    }
    if (!cashed && world && world.scene.fog) world.scene.fog.density = Math.min(0.18, world.scene.fog.density + 0.08);
    const lost = cashed ? 0 : (run.lost != null ? run.lost : run.loot.length);
    const shot = {
      reason, cashed, floor: run.floorSurvived,
      loot: cashed ? run.loot.length : 0,
      lost,
      score: cashed ? scoreFor(true) : Math.max(0, (run.floorSurvived | 0) * 20),
      aura: auraFor(reason === "stairs" ? "greed" : reason, cashed),
    };
    persistDepth({
      depth: shot.floor, score: shot.score, loot: shot.loot,
      deathReason: reason === "souvenir" ? "souvenir" : (cashed ? "cashed_out" : (reason === "leave" ? "leave" : "empty_pit")),
      cashedOut: cashed,
      meta: { room: run.spec && run.spec.name, coda: !!(run.spec && run.spec.coda), loot: shot.loot, lost },
    });
    showDropFab(false);
    setCardFlag("is-decide", false);
    if (reason === "leave" || cashed) revealResult(shot);
    else setTimeout(() => revealResult(shot), 80);
  }
  function cashOut() {
    if (!isLive() || run.phase !== "decide") return;
    run.greedMs = null;
    finish("cash");
  }

  function start() {
    if (run && !run.done) return;
    if (!ensureWorld()) {
      setText("curiosStatus", "The vault lamps won’t light in this browser.");
      return;
    }
    declareP0();
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("curiosStatus", "Out of demo coins · grant a pass");
      if (PF.refreshNightBoard) PF.refreshNightBoard();
      return;
    }
    const spec = floorSpec(1);
    run = {
      done: false, kitRun, spec, loot: [], score: 0, floorSurvived: 0, banked: false, lost: 0,
      attempts: spec.attempts, phase: "aim", caughtThis: null, riseWith: null, failReason: "",
      greedMs: null, greedMax: 0,
    };
    setCardFlag("is-empty", false);
    const stamp = el("curiosEmpty");
    if (stamp) stamp.hidden = true;
    const startBtn = el("curiosStart");
    if (startBtn) { startBtn.disabled = true; startBtn.hidden = true; }
    overlayStart(false);
    if (el("curiosVerdict")) el("curiosVerdict").hidden = true;
    if (kit && kit.hideResult) kit.hideResult("curiosResult");
    if (PF.setTier) PF.setTier("curiosTier", "", "");
    if (kit && kit.setMode) kit.setMode(card(), "play");
    if (el("curiosDrop")) el("curiosDrop").hidden = false;
    enterFloor(spec, null);
    if (PF.focusCard) PF.focusCard("curiosCard", true);
    if (PF.setAura) PF.setAura("think");
    const canvas = el("curiosCanvas");
    if (canvas && canvas.focus) try { canvas.focus(); } catch (_) {}
    startLoop();
  }

  function dumpPocketIntoPit() {
    if (!world) return;
    world.prizes.forEach((p) => {
      if (p.group.parent !== world.cabinet) world.cabinet.attach(p.group);
      p.sinking = true;
    });
    world.shake = 0.55;
  }

  function pointerToPit(ev) {
    const canvas = el("curiosCanvas");
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const nx = ((ev.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    const ny = -(((ev.clientY - r.top) / Math.max(1, r.height)) * 2 - 1);
    if (world && world.camera) {
      _ndc.set(nx, ny);
      _ray.setFromCamera(_ndc, world.camera);
      if (_ray.ray.intersectPlane(_pitPlane, _hit)) {
        aim.tx = clamp(_hit.x, -PIT_X, PIT_X);
        aim.tz = clamp(_hit.z + 0.15, -PIT_Z, PIT_Z);
        return;
      }
    }
    aim.tx = clamp(nx * PIT_X, -PIT_X, PIT_X);
    aim.tz = clamp(-ny * PIT_Z, -PIT_Z, PIT_Z);
  }
  function isTouchPtr(ev) {
    return ev.pointerType === "touch" || ev.pointerType === "pen";
  }

  function step(dt) {
    if (!world) return;
    const spec = (run && !run.done && run.spec) || floorSpec(idleRoom);
    const live = isLive();
    world.time += dt * 0.001;
    if (toastT > 0) {
      toastT -= dt * 0.001;
      if (toastT <= 0) {
        const n = el("curiosToast");
        if (n) n.classList.remove("is-on");
      }
    }
    if (world.aura && world.aura.userData) {
      const u = world.aura.userData;
      u.t += dt * 0.001;
      u.armR.rotation.z = -0.15 + Math.sin(u.t * 3.2) * 0.55;
      u.head.rotation.y = Math.sin(u.t * 1.4) * 0.12;
      if (live && spec && spec.aura) {
        world.aura.visible = true;
        world.aura.position.set(0.15, 0.05, -2.55);
        world.aura.rotation.y = 0;
      } else if (!live) {
        world.aura.visible = true;
        world.aura.position.set(2.85, 0, 1.35);
        world.aura.rotation.y = -0.7;
      } else world.aura.visible = false;
    }
    if (world.dustPos) {
      for (let i = 0; i < world.dustPos.length / 3; i += 1) {
        world.dustPos[i * 3 + 1] += dt * 0.00018;
        if (world.dustPos[i * 3 + 1] > 5.8) world.dustPos[i * 3 + 1] = 0.2;
      }
      world.dust.geometry.attributes.position.needsUpdate = true;
    }
    world.bulbs.forEach((b, i) => {
      b.light.intensity = spec && spec.light === "flicker"
        ? 0.4 + Math.abs(Math.sin(world.time * 14 + i)) * 0.7
        : 0.62 + Math.sin(world.time * 2.2 + i) * 0.12;
    });
    if (spec && spec.spin) world.prizeGroup.rotation.y += spec.spin * dt * 0.001;
    world.prizes.forEach((p, i) => {
      if (p.sinking) {
        p.group.position.y -= dt * 0.0032;
        p.group.position.x += (0 - p.group.position.x) * 0.05;
        p.group.position.z += (-0.2 - p.group.position.z) * 0.05;
        p.group.rotation.x += dt * 0.004;
        p.group.scale.multiplyScalar(0.982);
        return;
      }
      if (p.caught && run && run.riseWith === p) { p.group.position.set(0, 0.02, 0); return; }
      if (p.caught) return;
      p.group.position.y = p.baseY + Math.sin(world.time * 2.4 + i) * ((spec && spec.bob) || 0);
      p.group.rotation.y += dt * 0.0008;
    });

    const speed = 0.0042;
    if (keys.w) aim.tx -= dt * speed * PIT_X;
    if (keys.e) aim.tx += dt * speed * PIT_X;
    if (keys.n) aim.tz -= dt * speed * PIT_Z;
    if (keys.s) aim.tz += dt * speed * PIT_Z;
    aim.tx = clamp(aim.tx, -PIT_X, PIT_X);
    aim.tz = clamp(aim.tz, -PIT_Z, PIT_Z);

    if (live && spec && spec.hitch && run.phase === "aim") {
      if (Math.random() < 0.012) {
        aim.tx += (Math.random() - 0.5) * 0.55;
        aim.tz += (Math.random() - 0.5) * 0.4;
        toast("RAIL SLIP", false);
      }
    }

    if (!live) {
      aim.tx = Math.sin(world.time * 0.55) * 1.35;
      aim.tz = Math.cos(world.time * 0.4) * 0.7;
      idleClock += dt;
      if (idleClock > 4200 && !(run && run.done)) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        const next = floorSpec(idleRoom);
        layoutPrizes(next);
        applyLights(next);
        paintHud();
      }
    }

    const follow = (live && (run.phase === "drop" || run.phase === "rise" || run.phase === "decide" || run.phase === "empty"))
      ? 0.04
      : (aim.touch ? 0.32 : 0.16);
    aim.x += (aim.tx - aim.x) * follow;
    aim.z += (aim.tz - aim.z) * follow;
    if (run && (run.phase === "drop" || run.phase === "rise" || run.phase === "decide")) {
      /* freeze gantry xz while dropping */
    } else {
      world.gantry.position.x = aim.x;
      world.gantry.position.z = -0.15 + aim.z;
    }

    if (live && run.phase === "drop") {
      world.dropY -= dt * 0.0048;
      if (world.dropY <= PIT_Y) {
        world.dropY = PIT_Y;
        world.jawsOpen = 0.55;
        afterDrop(tryGrab());
      }
    } else if (live && run.phase === "rise") {
      world.dropY += dt * 0.0042;
      if (run.riseWith) {
        run.riseWith.group.position.set(0, 0.02, 0);
        world.claw.add(run.riseWith.group);
      }
      if (world.dropY >= HANG) {
        world.dropY = HANG;
        if (run.riseWith) world.prizeGroup.attach(run.riseWith.group);
        goDecide();
      }
    } else if (live && run.phase === "decide") {
      world.dropY = HANG;
      world.jawsOpen += (0.22 - world.jawsOpen) * 0.08;
    } else {
      world.dropY = HANG;
      world.jawsOpen = 0.22;
    }

    if (live && run.phase === "decide" && run.greedMs != null) {
      run.greedMs -= dt;
      const fill = el("curiosGreedFill");
      if (fill && run.greedMax) fill.style.width = `${Math.max(0, 100 * run.greedMs / run.greedMax)}%`;
      if (run.greedMs <= 0) {
        run.greedMs = null;
        toast("THE STAIRS TOOK YOU", false);
        descend();
      }
    }

    if (live && run.phase === "empty") {
      run.emptyT += dt;
      if (world.scene.fog) world.scene.fog.density = Math.min(0.2, (world.scene.fog.density || 0.02) + dt * 0.00014);
      world.lights.pit.intensity = Math.max(0.05, world.lights.pit.intensity * 0.985);
      world.lights.key.intensity = Math.max(0.15, world.lights.key.intensity * 0.99);
      world.camera.position.y -= dt * 0.0011;
      if (run.emptyT > 1500) finish(run.emptyReason || "miss");
    }

    if (live && run.phase === "descend") {
      run.descendT += dt;
      world.descend = 1 - Math.min(1, run.descendT / 900);
      if (run.descendT > 900) {
        enterFloor(run.descendTo, run.descendFrom);
        world.descend = 0;
      }
    }

    world.cable.scale.y = Math.max(0.4, HANG - world.dropY + 1.05);
    world.cable.position.y = -world.cable.scale.y / 2 - 0.08;
    world.claw.position.y = -(HANG - world.dropY + 1.1);
    world.jaws.forEach((j) => { j.rotation.z = world.jawsOpen; });
    world.reticle.position.x = world.gantry.position.x;
    world.reticle.position.z = world.gantry.position.z;
    const hot = hotTarget();
    world.reticle.material.emissiveIntensity = hot ? 1.45 : 0.55;
    world.reticle.material.color.setHex(hot ? 0xf2c75c : 0x8a6230);
    world.reticle.scale.setScalar(hot ? 1.18 : 1);
    world.lights.claw.position.set(world.gantry.position.x, 3.55, world.gantry.position.z);
    world.lights.claw.target.position.set(world.gantry.position.x, 0.2, world.gantry.position.z);

    world.shake *= 0.86;
    world.dip *= 0.9;
    world.fovPunch *= 0.88;
    const descendY = (run && run.phase === "descend") ? Math.sin(Math.min(1, run.descendT / 900) * Math.PI) * 1.15 : 0;
    const idleOrbit = (!live && !REDUCE) ? Math.sin(world.time * 0.28) * 0.35 : 0;
    world.camera.position.x = idleOrbit + world.gantry.position.x * 0.12 + (world.shake ? (Math.random() - 0.5) * world.shake : 0);
    world.camera.position.y = 3.5 - world.dip * 0.7 - descendY * 0.45;
    world.camera.position.z = 7.5 + (live ? 0 : Math.cos(world.time * 0.22) * 0.18);
    world.camera.fov = 46 + world.fovPunch;
    world.camera.updateProjectionMatrix();
    world.camera.lookAt(world.gantry.position.x * 0.35, 0.58 - descendY * 0.4, -0.2);
  }

  function loop(now) {
    if (!cabinetOn() && !(run && !run.done)) { raf = 0; return; }
    if (!lastTs) lastTs = now;
    const dt = Math.min(48, now - lastTs);
    lastTs = now;
    step(dt);
    if (world) world.renderer.render(world.scene, world.camera);
    if (run && !run.done && PF.refreshDepth) PF.refreshDepth();
    raf = requestAnimationFrame(loop);
  }
  function startLoop() {
    if (raf) return;
    lastTs = 0;
    raf = requestAnimationFrame(loop);
  }

  function stampDepthCopy() {
    const host = card();
    if (!host) return;
    const num = host.querySelector(".machine-number");
    if (num) num.textContent = "Velvet claw · 1 demo coin · 7 authored FLOORS then ENDLESS";
    const tag = host.querySelector("[data-pf-depth-tag]");
    if (tag) tag.textContent = DEPTH_COPY.tag;
    const copy = host.querySelector("[data-pf-depth-copy]");
    if (copy) copy.textContent = DEPTH_COPY.body;
  }

  function bind() {
    if (bound) return;
    bound = true;
    declareP0();
    const go = () => start();
    const startBtn = el("curiosStart");
    if (startBtn) startBtn.addEventListener("click", go);
    const goBtn = el("curiosGo");
    if (goBtn) goBtn.addEventListener("click", go);
    const cash = el("curiosCash");
    if (cash) cash.addEventListener("click", cashOut);
    const greedCash = el("curiosGreedCash");
    if (greedCash) greedCash.addEventListener("click", cashOut);
    const desc = el("curiosDescend");
    if (desc) desc.addEventListener("click", descend);
    const drop = el("curiosDrop");
    if (drop) drop.addEventListener("click", () => { if (!isLive()) start(); else dropNow(); });
    const fab = el("curiosDropFab");
    if (fab) fab.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!isLive()) start();
      else dropNow();
    });
    const canvas = el("curiosCanvas");
    if (canvas) {
      canvas.addEventListener("pointerdown", (ev) => {
        if (!isLive()) { go(); return; }
        if (run.phase !== "aim") return;
        ev.preventDefault();
        try { canvas.setPointerCapture(ev.pointerId); } catch (_) {}
        drag.id = ev.pointerId;
        drag.moved = false;
        drag.sx = ev.clientX;
        drag.sy = ev.clientY;
        drag.touch = isTouchPtr(ev);
        aim.touch = drag.touch;
        pointerToPit(ev);
      });
      canvas.addEventListener("pointermove", (ev) => {
        if (!isLive()) { pointerToPit(ev); return; }
        if (run.phase !== "aim") return;
        if (drag.id != null && ev.pointerId !== drag.id && drag.touch) return;
        if (Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) > 10) drag.moved = true;
        pointerToPit(ev);
      });
      const endDrag = (ev) => {
        if (drag.id !== ev.pointerId) return;
        try { canvas.releasePointerCapture(ev.pointerId); } catch (_) {}
        const tapDrop = !drag.touch && !drag.moved && isLive() && run.phase === "aim";
        drag.id = null;
        if (tapDrop) dropNow();
      };
      canvas.addEventListener("pointerup", endDrag);
      canvas.addEventListener("pointercancel", endDrag);
    }
    window.addEventListener("keydown", (ev) => {
      if (!cabinetOn()) return;
      if (ev.code === "KeyW" || ev.code === "ArrowUp") keys.n = true;
      if (ev.code === "KeyS" || ev.code === "ArrowDown") keys.s = true;
      if (ev.code === "KeyA" || ev.code === "ArrowLeft") keys.w = true;
      if (ev.code === "KeyD" || ev.code === "ArrowRight") keys.e = true;
      if (ev.code === "Space") {
        ev.preventDefault();
        if (!isLive()) start();
        else dropNow();
      }
      if (ev.key === "c" || ev.key === "C") cashOut();
      if (ev.code === "Enter") descend();
    });
    window.addEventListener("keyup", (ev) => {
      if (ev.code === "KeyW" || ev.code === "ArrowUp") keys.n = false;
      if (ev.code === "KeyS" || ev.code === "ArrowDown") keys.s = false;
      if (ev.code === "KeyA" || ev.code === "ArrowLeft") keys.w = false;
      if (ev.code === "KeyD" || ev.code === "ArrowRight") keys.e = false;
    });
    const copyBtn = el("curiosChallenge");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const n = (PF.getState().lastRun && PF.getState().lastRun.game === GAME_ID)
          ? PF.getState().lastRun.depth
          : (PF.getState().bestCurioFloor || 0);
        const text = challengeLine(n);
        kit.copyText(text, () => { const c = el("curiosCopied"); if (c) c.hidden = false; setText("curiosStatus", "Copied — send it"); }, () => setText("curiosStatus", text));
      });
    }
    window.addEventListener("resize", () => { if (cabinetOn()) resizeWorld(); });
    if (typeof ResizeObserver !== "undefined" && el("curiosStage")) {
      new ResizeObserver(() => { if (cabinetOn()) resizeWorld(); }).observe(el("curiosStage"));
    }
    stampDepthCopy();
    setText("curiosStatus", DEPTH_COPY.status);
  }

  PF.registerVendor({
    id: "curios",
    playKey: "curios",
    chalk: "Drag the claw. DROP. Cash out — or greed the stairs and lose the pocket.",
    defaults: { bestCurioFloor: 0, bestCurioLoot: 0 },
    bind,
    onLeave() {
      if (run && !run.done) finish("leave");
      keys.n = keys.s = keys.w = keys.e = false;
    },
    onShow() {
      declareP0();
      stampDepthCopy();
      bind();
      const hash = (location.hash || "").replace(/^#/, "");
      if (hash === "cabinet/curios/result" && run && run.done) {
        if (kit && kit.setMode) kit.setMode(card(), "result");
      } else if (!(run && isLive())) {
        if (kit && kit.setMode) kit.setMode(card(), "vestibule");
        setText("curiosStatus", DEPTH_COPY.status);
        overlayStart(true);
        const startBtn = el("curiosStart");
        if (startBtn) { startBtn.disabled = false; startBtn.hidden = false; startBtn.textContent = "START · 1 demo coin"; }
        const goBtn = el("curiosGo");
        if (goBtn) { goBtn.disabled = false; goBtn.textContent = "START · 1 demo coin"; }
      }
      ensureWorld();
      if (world && !worldFailed) {
        const spec = floorSpec(idleRoom);
        layoutPrizes(spec);
        applyLights(spec);
      }
      paintHud();
      startLoop();
      requestAnimationFrame(() => resizeWorld());
    },
    onReset() {
      if (run && !run.done) finish("leave");
      run = null;
      if (el("curiosVerdict")) el("curiosVerdict").hidden = true;
      if (kit && kit.hideResult) kit.hideResult("curiosResult");
      overlayStart(true);
      const startBtn = el("curiosStart");
      if (startBtn) { startBtn.disabled = false; startBtn.hidden = false; startBtn.textContent = "START · 1 demo coin"; }
      if (el("curiosDrop")) el("curiosDrop").hidden = true;
      if (el("curiosCash")) { el("curiosCash").hidden = true; el("curiosCash").disabled = true; }
      setGreed(false);
      showDropFab(false);
      setCardFlag("is-empty", false);
      const stamp = el("curiosEmpty");
      if (stamp) stamp.hidden = true;
      if (kit && kit.setMode) kit.setMode(card(), "vestibule");
      stampDepthCopy();
    },
    refreshDepth(state) {
      const spec = run && !run.done ? run.spec : null;
      setText("depthCurioFloor", spec ? String(spec.floor) : "0");
      setText("depthCurioLoot", String((run && !run.done) ? run.loot.length : 0));
      const best = el("depthCurioBest");
      if (best) best.textContent = (state.bestCurioFloor || (state.bestDepth && state.bestDepth.curios))
        ? `Floor ${state.bestCurioFloor || state.bestDepth.curios}` : "—";
      const bl = el("depthCurioBestLoot");
      if (bl) bl.textContent = state.bestCurioLoot ? String(state.bestCurioLoot) : "—";
      paintHud();
    },
  });
})();
