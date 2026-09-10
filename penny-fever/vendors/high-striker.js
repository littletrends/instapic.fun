/* High Striker — 3D smash tent. Desktop Grok owns this doorway.
 * PF only. Never booth/port 6000. Never Imagine.
 * HOLD to wind. RELEASE on the gold beat — timing is the joke, not hold-length.
 * Bell = checkpoint, not the ending. 3 strikes stamp SLIP. Depth = towers.
 * Family-safe carnival. No casino. No Mirror Crew.
 * Aura lock: brunette pigtails, yellow crown + red heart, green pinafore, black shoes. */
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

  const GAME_ID = "highstriker";
  const DEATH_HOLD_MS = 780;
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const TOWER_H = 8.2;
  const TOWER_BASE = 0.5;
  const RAIL_LIMIT = 0.34;
  const GRAVITY = 16.4;
  const STRIKES_TO_DEATH = 3;

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;
  const WOOD = 0x3a2418;
  const WOOD_DARK = 0x1a100c;
  const BRASS = 0xd4a45a;

  let run = null;
  let raf = 0;
  let idleClock = 0;
  let world = null;
  let reduceMotion = false;
  let holdCanvas = false;
  let holdBtn = false;
  let holdSpace = false;
  let pointerX = 0.5;

  const AURA = {
    late: "Aura: Paint sits early. True gold is late.",
    fake: "Aura: That gold was a decoy. Follow the live band.",
    reverse: "Aura: Needle ran backwards. You kept the old beat.",
    second: "Aura: First gold is a liar pass. Release on the next.",
    shrink: "Aura: Gold shrank. You swung the old size.",
    miss: "Aura: Needle wasn’t in the gold. Timing, not mash.",
    air: "Aura: You let go of air. Wait for the gold.",
    shallow: "Aura: Not a single bell. The mallet is laughing.",
    mid: "Aura: Cute bells. Checkpoint — keep climbing.",
    deep: "Aura: You rang it and kept climbing. Dangerous.",
    coda: "Aura: Authored towers done. ENDLESS sky. Don’t mash.",
    leave: "Aura: Walking off mid-smash? Coward’s stamp.",
    souvenir: "Aura: Eight towers locked. The bell salutes.",
    slip: "Aura: Three late releases. The paint lied and you believed it.",
  };

  const AUTHORED = [
    {
      id: 1, name: "Soft Gold", kind: "teach",
      bell: 0.50, zoneH: 0.24, speed: 0.55, sweet: 0.55, lateLie: 0,
      reverse: false, fakeAt: 0, secondPass: false, shrinkAfter: false,
      barker: "HOLD to wind. RELEASE when the needle is in the gold. Bell is a checkpoint.",
      tell: "RELEASE IN THE GOLD · BELL ISN’T THE END",
    },
    {
      id: 2, name: "Faster Pulse", kind: "fast",
      bell: 0.58, zoneH: 0.18, speed: 0.68, sweet: 0.56, lateLie: 0,
      reverse: false, fakeAt: 0, secondPass: false, shrinkAfter: false,
      barker: "Same joke, quicker beat. Stay in the gold. Ding, then keep climbing.",
      tell: "FASTER NEEDLE · STILL THE GOLD",
    },
    {
      id: 3, name: "Late Paint", kind: "late",
      bell: 0.64, zoneH: 0.16, speed: 0.64, sweet: 0.44, lateLie: 0.20,
      reverse: false, fakeAt: 0, secondPass: false, shrinkAfter: false,
      barker: "The paint sits early. True clang is LATE. Don’t trust the pale mark.",
      tell: "PAINT LIES EARLY · RELEASE LATE",
    },
    {
      id: 4, name: "Fake Flash", kind: "fake",
      bell: 0.68, zoneH: 0.15, speed: 0.66, sweet: 0.60, lateLie: 0,
      reverse: false, fakeAt: 0.24, secondPass: false, shrinkAfter: false,
      barker: "A decoy gold winks low. Live gold is the bright band. Ignore the ghost.",
      tell: "DECOY GOLD IS A LIAR · HIT THE LIVE BAND",
    },
    {
      id: 5, name: "Reverse Beat", kind: "reverse",
      bell: 0.72, zoneH: 0.15, speed: 0.70, sweet: 0.52, lateLie: 0,
      reverse: true, fakeAt: 0, secondPass: false, shrinkAfter: false,
      barker: "Needle runs the other way. Don’t keep the old beat.",
      tell: "NEEDLE RUNS BACKWARDS",
    },
    {
      id: 6, name: "Shrink Gold", kind: "shrink",
      bell: 0.74, zoneH: 0.16, speed: 0.68, sweet: 0.55, lateLie: 0,
      reverse: false, fakeAt: 0, secondPass: false, shrinkAfter: true,
      barker: "Miss, and the next gold shrinks. Don’t swing the old size.",
      tell: "MISS SHRINKS THE GOLD",
    },
    {
      id: 7, name: "Second Pass", kind: "second",
      bell: 0.76, zoneH: 0.16, speed: 0.62, sweet: 0.54, lateLie: 0,
      reverse: false, fakeAt: 0, secondPass: true, shrinkAfter: false,
      barker: "First gold pass is a liar. Hold through it. Release on the NEXT pass.",
      tell: "SKIP THE FIRST GOLD · RELEASE ON THE NEXT",
    },
    {
      id: 8, name: "Fever Night", kind: "fever",
      bell: 0.80, zoneH: 0.13, speed: 0.76, sweet: 0.42, lateLie: 0.18,
      reverse: true, fakeAt: 0.24, secondPass: false, shrinkAfter: true,
      barker: "Late paint, reverse, decoy, shrink. True gold is late. Bell still isn’t the end.",
      tell: "LATE · REVERSE · DECOY · KEEP CLIMBING",
    },
  ];

  const P0_MOUNT = {
    engine: "TimingTap",
    displayName: "High Striker",
    depthUnit: "Tower",
    sheet: "GOBLIN_AUTHORED_LEVELS_B03.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "RELEASE ON GOLD · paint can lie · bell is a checkpoint · 3 strikes",
    body: "HOLD to wind the mallet. RELEASE when the needle is in the true gold — timing is the joke, not how long you hold. The paint can sit early. A decoy gold can wink. Bell is a checkpoint, not the ending. Three misses stamp SLIP.",
    status: "Hold to wind · release on gold · 1 demo coin · 8 towers then ENDLESS",
    machine: "Strength tower · 1 demo coin · release timing",
  };

  function rk() { return PF.runKit || null; }
  function el(id) { return $(id); }
  function setText(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function card() { return el("highStrikerCard"); }
  function cabinetOn() {
    const node = document.getElementById("cabinet-high-striker");
    return !!(node && !node.hidden);
  }
  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }
  function holding() { return !!(holdCanvas || holdBtn || holdSpace); }

  function highstrikerCoda(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const t = stage - AUTHORED_COUNT;
    return {
      id: stage,
      name: `Sky Peg ${stage}`,
      kind: "sky",
      coda: true,
      bell: clamp(0.76 + t * 0.01, 0.76, 0.88),
      zoneH: Math.max(0.10, 0.14 - t * 0.004),
      speed: Math.min(1.05, 0.76 + t * 0.025),
      sweet: 0.5,
      lateLie: t % 2 === 0 ? 0.14 : 0.08,
      reverse: t % 3 === 0,
      fakeAt: t % 2 === 0 ? 0.24 : 0,
      secondPass: t % 4 === 0,
      shrinkAfter: true,
      barker: "ENDLESS sky. Gold gets thinner. Paint still lies late. Keep climbing.",
      tell: "ENDLESS · RELEASE ON TRUE GOLD",
    };
  }

  function highstrikerStageParams(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) return Object.assign({ coda: false, title: AUTHORED[stage - 1].name }, AUTHORED[stage - 1]);
    if (!CODA_ENABLED) return null;
    const spec = highstrikerCoda(stage);
    spec.title = spec.name;
    return spec;
  }

  function liveSpec() {
    const spec = (run && run.spec) ? Object.assign({}, run.spec) : highstrikerStageParams(1);
    if (run && run.hitShrink) spec.zoneH = Math.max(0.10, (spec.zoneH || 0.14) * run.hitShrink);
    return spec;
  }

  function needlePos(t, spec) {
    const rate = Math.max(0.2, spec && spec.speed != null ? spec.speed : 0.55);
    const reverse = !!(spec && spec.reverse);
    const u = ((t / 1000) * rate) % 2;
    const tri = u < 1 ? u : 2 - u;
    return reverse ? 1 - tri : tri;
  }

  function trueWindow(spec) {
    const h = spec.zoneH || 0.16;
    const mid = clamp((spec.sweet || 0.55) + (spec.lateLie || 0), 0.16, 0.9);
    return { lo: clamp(mid - h / 2, 0.04, 0.9), hi: clamp(mid + h / 2, 0.1, 0.98), mid };
  }

  function paintWindow(spec) {
    const h = spec.zoneH || 0.16;
    const mid = clamp(spec.sweet || 0.55, 0.16, 0.9);
    return { lo: clamp(mid - h / 2, 0.04, 0.9), hi: clamp(mid + h / 2, 0.1, 0.98), mid };
  }

  function timingQuality(pos, spec) {
    const w = trueWindow(spec);
    if (pos < w.lo || pos > w.hi) return 0;
    const half = Math.max(0.02, (w.hi - w.lo) / 2);
    const dist = Math.abs(pos - w.mid) / half;
    return clamp(1 - dist * 0.45, 0.55, 1);
  }

  function inFakeGold(pos, spec) {
    if (!spec || !spec.fakeAt) return false;
    const h = Math.max(0.08, (spec.zoneH || 0.14) * 0.9);
    return pos >= spec.fakeAt - h / 2 && pos <= spec.fakeAt + h / 2;
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: highstrikerStageParams,
      codaParams: highstrikerCoda,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function pegY(unit) {
    return TOWER_BASE + 0.22 + clamp(unit, 0, 1.05) * (TOWER_H - 0.4);
  }

  function launchSpeed(quality, spec) {
    const g = spec.gravity || GRAVITY;
    const full = Math.sqrt(2 * g * TOWER_H * 1.02);
    const q = clamp(quality, 0, 1);
    return (0.48 + q * 0.58) * full;
  }

  function predictPeak(quality, spec) {
    const g = spec.gravity || GRAVITY;
    const vy = launchSpeed(quality, spec);
    return clamp((vy * vy) / (2 * g) / TOWER_H, 0, 1.08);
  }

  /* ——— Three.js pavilion ——— */

  function canvasTex(draw, w, h, repeat) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    if (repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
    }
    return t;
  }

  function mat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.72, metalness: 0.08,
    }, extra || {}));
  }

  function meshBox(m, w, h, d, x, y, z) {
    const mesh = new THREE.Mesh(world.geo.box, m);
    mesh.scale.set(w, h, d);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function meshCyl(m, rt, rb, h, x, y, z, seg) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 10), m);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function meshSphere(m, r, x, y, z, seg) {
    const s = seg || 12;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, s, Math.max(8, s - 2)), m);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function makePerson(opts) {
    const g = new THREE.Group();
    const chibi = !!opts.chibi;
    const skin = mat(opts.skin || SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const cloth = mat(opts.cloth || 0x3a3040);
    const dark = mat(opts.shoes || 0x1a1a1a, { roughness: 0.28, metalness: 0.35 });
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
    const eyeW = mat(0xf7f2ea);
    const eyeD = mat(0x2a1810);
    [-1, 1].forEach((side) => {
      const white = meshSphere(eyeW, 0.038, side * (chibi ? 0.07 : 0.055), 0.03, chibi ? 0.19 : 0.15);
      white.scale.set(chibi ? 0.05 : 0.038, chibi ? 0.058 : 0.044, 0.02);
      head.add(white);
      head.add(meshSphere(eyeD, chibi ? 0.026 : 0.02, side * (chibi ? 0.07 : 0.055), 0.03, chibi ? 0.21 : 0.168));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), mat(0xc45a6a));
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
    g.userData = {
      hip, head,
      armL: limb(-1, true), armR: limb(1, true),
      legL: limb(-1, false), legR: limb(1, false),
      t: Math.random() * 10,
    };
    return g;
  }

  function dressAura(g) {
    const hip = g.userData.hip;
    const head = g.userData.head;
    const blouse = mat(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.2 });
    const dress = mat(DRESS, { emissive: 0x0a2010, emissiveIntensity: 0.25 });
    hip.children[0].material = blouse;
    hip.children[1].material = dress;
    const heart = meshBox(mat(HEART, { emissive: HEART, emissiveIntensity: 0.55, roughness: 0.4 }), 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    heart.rotation.z = Math.PI / 4;
    hip.add(heart);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 16), blouse);
    collar.position.y = 0.44;
    collar.rotation.x = Math.PI / 2;
    hip.add(collar);
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
    g.userData.kind = "aura";
  }

  function dressBarker(g) {
    const hip = g.userData.hip;
    const head = g.userData.head;
    hip.children[0].material = mat(0xf3e6d0);
    hip.children[1].material = mat(0x8a2030);
    hip.add(meshBox(mat(0xc41e3a), 0.22, 0.18, 0.04, 0, 0.28, 0.14));
    head.add(meshCyl(mat(0x1a1010), 0.12, 0.16, 0.08, 0, 0.22, 0));
    head.add(meshCyl(mat(0x1a1010), 0.22, 0.22, 0.02, 0, 0.17, 0));
    head.add(meshBox(mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.35 }), 0.08, 0.03, 0.06, 0, 0.16, 0.16));
    g.userData.kind = "barker";
  }

  function buildWorld() {
    const canvas = el("highStrikerCanvas");
    if (!canvas || world) return world;
    reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: (window.devicePixelRatio || 1) < 1.6,
        powerPreference: "high-performance",
        alpha: false,
      });
    } catch (_) {
      setText("highStrikerStatus", "This tent wants WebGL. The alley still loves you.");
      return null;
    }
    if (!renderer.getContext()) {
      setText("highStrikerStatus", "This tent wants WebGL. The alley still loves you.");
      return null;
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x08050c, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0812, 0.026);
    const camera = new THREE.PerspectiveCamera(56, 1, 0.12, 80);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    camera.position.set(6.6, 4.1, 10.4);

    world = {
      renderer, scene, camera,
      geo: { box: new THREE.BoxGeometry(1, 1, 1) },
      sparks: [],
      camPos: new THREE.Vector3(5.4, 3.3, 8.1),
      camLook: new THREE.Vector3(0, 3.1, 0),
      shake: 0,
      bellCam: 0,
      built: true,
    };

    scene.add(new THREE.AmbientLight(0x4a382c, 0.88));
    scene.add(new THREE.HemisphereLight(0x8aa4cc, 0x2a1810, 0.7));
    const moon = new THREE.DirectionalLight(0xc0d4ff, 0.4);
    moon.position.set(-6, 10, 4);
    scene.add(moon);
    const fill = new THREE.DirectionalLight(0xffc090, 0.58);
    fill.position.set(4, 6, 8);
    scene.add(fill);

    const woodTex = canvasTex((ctx, w, h) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = i % 2 ? "rgba(90,50,28,0.35)" : "rgba(212,164,90,0.08)";
        ctx.fillRect(i * (w / 18), 0, 3, h);
      }
    }, 256, 256, [2, 4]);
    const sawdustTex = canvasTex((ctx, w, h) => {
      ctx.fillStyle = "#2a1a10";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 800; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? "#5a3a22" : "#3a2818";
        ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1);
      }
    }, 256, 256, [8, 8]);
    const stripeTex = canvasTex((ctx, w, h) => {
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 ? "#7a2038" : "#f0d09a";
        ctx.fillRect(0, i * (h / 10), w, h / 10);
      }
    }, 64, 256, [1, 3]);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), mat(0x2a1a12, { map: sawdustTex, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(36, 20, 14),
      new THREE.MeshBasicMaterial({
        map: canvasTex((ctx, w, h) => {
          const g = ctx.createLinearGradient(0, 0, 0, h);
          g.addColorStop(0, "#0a1020");
          g.addColorStop(0.55, "#1a0c18");
          g.addColorStop(1, "#120810");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = "#fff6ec";
          for (let i = 0; i < 110; i++) {
            const s = Math.random() * 1.6;
            ctx.globalAlpha = 0.35 + Math.random() * 0.65;
            ctx.fillRect(Math.random() * w, Math.random() * h * 0.7, s, s);
          }
        }, 512, 256),
        side: THREE.BackSide,
      })
    );
    scene.add(sky);

    const tent = new THREE.Group();
    scene.add(tent);
    world.tent = tent;
    const canvasMat = mat(0xc45a6a, { map: stripeTex, roughness: 0.86, side: THREE.DoubleSide });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 7.2), canvasMat);
    back.position.set(0, 3.6, -4.4);
    tent.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(9, 7.2), canvasMat);
    left.position.set(-5.6, 3.6, 0);
    left.rotation.y = Math.PI / 2.4;
    tent.add(left);
    const right = new THREE.Mesh(new THREE.PlaneGeometry(9, 7.2), canvasMat);
    right.position.set(5.6, 3.6, 0);
    right.rotation.y = -Math.PI / 2.4;
    tent.add(right);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7.4, 3.2, 4), canvasMat);
    roof.position.y = 8.5;
    roof.rotation.y = Math.PI / 4;
    tent.add(roof);
    world.tentRoof = roof;
    tent.add(meshCyl(mat(WOOD, { map: woodTex }), 0.08, 0.09, 6.4, -4.6, 3.2, 3.2));
    tent.add(meshCyl(mat(WOOD, { map: woodTex }), 0.08, 0.09, 6.4, 4.6, 3.2, 3.2));

    const lanternMat = mat(0xffe2a0, { emissive: 0xffc878, emissiveIntensity: 0.9 });
    world.lanterns = [];
    [[-3.8, 5.6, 2.4], [3.8, 5.6, 2.4], [0, 7.1, -2.2]].forEach((p) => {
      tent.add(meshSphere(lanternMat, 0.16, p[0], p[1], p[2], 10));
      const light = new THREE.PointLight(0xffc878, 1.55, 9, 2);
      light.position.set(p[0], p[1], p[2]);
      scene.add(light);
      world.lanterns.push(light);
    });

    const tower = new THREE.Group();
    scene.add(tower);
    world.tower = tower;
    tower.add(meshBox(mat(WOOD_DARK, { map: woodTex }), 2.3, 0.4, 2.3, 0, 0.2, 0));
    tower.add(meshBox(mat(WOOD, { map: woodTex, roughness: 0.78 }), 0.42, TOWER_H, 0.42, 0, TOWER_BASE + TOWER_H / 2, 0));
    tower.add(meshBox(mat(BRASS, { metalness: 0.7, roughness: 0.32 }), 0.07, TOWER_H - 0.35, 0.07, 0, TOWER_BASE + TOWER_H / 2, 0.24));
    for (let i = 0; i < 16; i++) {
      const y = TOWER_BASE + 0.3 + (i / 15) * (TOWER_H - 0.9);
      const peg = meshCyl(mat(BRASS, { metalness: 0.65, roughness: 0.35 }), 0.045, 0.045, 0.22, 0.28, y, 0.08, 8);
      peg.rotation.z = Math.PI / 2;
      tower.add(peg);
    }

    const thermo = meshBox(mat(0x1a1010), 0.16, TOWER_H - 0.6, 0.08, -0.62, TOWER_BASE + TOWER_H / 2, 0.12);
    tower.add(thermo);
    const fillBar = meshBox(mat(0xc41e3a, { emissive: 0xc41e3a, emissiveIntensity: 0.7 }), 0.12, 0.2, 0.09, -0.62, TOWER_BASE + 0.3, 0.16);
    tower.add(fillBar);
    world.thermoFill = fillBar;
    const goldBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.045, 8, 22),
      mat(GOLD, { emissive: GOLD, emissiveIntensity: 1.7, metalness: 0.4, roughness: 0.28, transparent: true, opacity: 0.95 })
    );
    goldBand.rotation.x = Math.PI / 2;
    goldBand.position.set(-0.62, pegY(0.55), 0.18);
    tower.add(goldBand);
    world.goldBand = goldBand;
    const paintMark = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.03, 8, 20),
      mat(0xe8c8a0, { emissive: 0x6a4820, emissiveIntensity: 0.35, transparent: true, opacity: 0.45 })
    );
    paintMark.rotation.x = Math.PI / 2;
    paintMark.position.set(-0.62, pegY(0.46), 0.16);
    tower.add(paintMark);
    world.paintMark = paintMark;
    const fakeMark = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.03, 8, 18),
      mat(0xb8c8e0, { emissive: 0x6a88b0, emissiveIntensity: 0.6, transparent: true, opacity: 0.4 })
    );
    fakeMark.rotation.x = Math.PI / 2;
    fakeMark.visible = false;
    tower.add(fakeMark);
    world.fakeMark = fakeMark;
    const needle = meshSphere(mat(0xffe8a0, { emissive: 0xffc040, emissiveIntensity: 2.4 }), 0.1, -0.62, pegY(0.2), 0.28, 12);
    tower.add(needle);
    world.needle = needle;

    const pad = new THREE.Group();
    pad.position.set(0.55, 0.62, 1.15);
    pad.add(meshBox(mat(WOOD, { map: woodTex }), 0.7, 0.12, 0.42, 0, 0, 0));
    pad.add(meshBox(mat(0xc41e3a, { emissive: 0x5a1018, emissiveIntensity: 0.35 }), 0.55, 0.08, 0.28, 0, 0.08, 0.02));
    tower.add(pad);
    world.pad = pad;

    const puck = meshCyl(mat(0xc41e3a, { metalness: 0.45, roughness: 0.32, emissive: 0x5a1018, emissiveIntensity: 0.4 }), 0.2, 0.2, 0.14, 0, pegY(0), 0.28, 14);
    tower.add(puck);
    world.puck = puck;

    const ghost = meshCyl(mat(0xf0d09a, { transparent: true, opacity: 0.35, emissive: GOLD, emissiveIntensity: 0.4 }), 0.16, 0.16, 0.1, 0, pegY(0.4), 0.28, 10);
    ghost.visible = false;
    tower.add(ghost);
    world.ghost = ghost;

    const bell = new THREE.Group();
    bell.position.set(0, TOWER_BASE + TOWER_H + 0.18, 0);
    const brass = mat(GOLD, { metalness: 0.72, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.45 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.6), brass);
    dome.rotation.x = Math.PI;
    bell.add(dome);
    bell.add(new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 8, 18), brass));
    bell.add(meshCyl(mat(0x2a1810, { metalness: 0.4 }), 0.03, 0.05, 0.28, 0, -0.22, 0, 8));
    tower.add(bell);
    world.bell = bell;
    world.bellLight = new THREE.PointLight(0xffe08a, 0.45, 7, 1.8);
    world.bellLight.position.set(0, TOWER_BASE + TOWER_H + 0.2, 0.4);
    scene.add(world.bellLight);

    const liarBell = new THREE.Group();
    liarBell.position.set(0.55, pegY(0.52), 0.15);
    liarBell.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.6), mat(0xb0a090, { metalness: 0.5, roughness: 0.45 })));
    liarBell.visible = false;
    tower.add(liarBell);
    world.liarBell = liarBell;

    const mallet = new THREE.Group();
    mallet.position.set(1.05, 1.02, 2.05);
    mallet.add(meshCyl(mat(WOOD, { map: woodTex }), 0.035, 0.045, 1.35, 0, 0.2, 0, 8));
    mallet.add(meshBox(mat(0x2a1810, { roughness: 0.55 }), 0.18, 0.18, 0.32, 0, 0.92, 0));
    scene.add(mallet);
    world.mallet = mallet;

    const flag = new THREE.Group();
    flag.position.set(-1.7, 2.4, 1.1);
    flag.add(meshCyl(mat(WOOD), 0.025, 0.025, 2.2, 0, 1.1, 0, 6));
    const cloth = meshBox(mat(0xf0d09a, { side: THREE.DoubleSide }), 0.7, 0.38, 0.02, 0.38, 1.85, 0);
    flag.add(cloth);
    scene.add(flag);
    world.windFlag = cloth;

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 0.72),
      new THREE.MeshBasicMaterial({
        map: canvasTex((ctx, w, h) => {
          ctx.fillStyle = "#3a1810";
          ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = "#d4a45a";
          ctx.lineWidth = 8;
          ctx.strokeRect(8, 8, w - 16, h - 16);
          ctx.fillStyle = "#f0d09a";
          ctx.font = "bold 34px Georgia, serif";
          ctx.textAlign = "center";
          ctx.fillText("TEST YOUR STRENGTH", w / 2, 46);
          ctx.font = "22px Georgia, serif";
          ctx.fillStyle = "#e8a0b8";
          ctx.fillText("HOLD · SMASH · KEEP CLIMBING", w / 2, 88);
        }, 512, 128),
      })
    );
    sign.position.set(0, 7.55, -2.2);
    scene.add(sign);

    const aura = makePerson({ chibi: true, scale: 1.05, cloth: DRESS });
    dressAura(aura);
    aura.position.set(2.5, 0, 1.55);
    aura.rotation.y = -0.55;
    scene.add(aura);
    world.aura = aura;

    const barker = makePerson({ chibi: false, scale: 1.08, cloth: 0x8a2030 });
    dressBarker(barker);
    barker.position.set(-2.55, 0, 1.7);
    barker.rotation.y = 0.7;
    scene.add(barker);
    world.barker = barker;

    world.hitLight = new THREE.PointLight(0xffc878, 0, 6.5, 2);
    world.hitLight.position.set(0.5, 1.2, 1.4);
    scene.add(world.hitLight);

    for (let i = 0; i < 40; i++) {
      const m = meshSphere(mat(0xffe08a, { emissive: 0xffc040, emissiveIntensity: 2, transparent: true, opacity: 1 }), 0.035, 0, 0, 0, 6);
      m.visible = false;
      scene.add(m);
      world.sparks.push({ mesh: m, vx: 0, vy: 0, vz: 0, life: 0 });
    }

    const moteGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(160 * 3);
    for (let i = 0; i < 160; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 12;
      motePos[i * 3 + 1] = Math.random() * 8;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
    world.motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
      color: 0xf0d09a, size: 0.045, transparent: true, opacity: 0.32, depthWrite: false,
    }));
    scene.add(world.motes);

    resizeWorld();
    return world;
  }

  function resizeWorld() {
    if (!world) return;
    const canvas = el("highStrikerCanvas");
    const stage = el("highStrikerStage") || (canvas && canvas.parentElement);
    if (!canvas || !stage) return;
    const w = Math.max(1, stage.clientWidth || canvas.clientWidth || window.innerWidth || 320);
    const h = Math.max(1, stage.clientHeight || canvas.clientHeight || window.innerHeight || 480);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function spawnSparks(x, y, z, n, color) {
    if (!world) return;
    let left = n;
    world.sparks.forEach((s) => {
      if (left <= 0 || s.life > 0) return;
      s.life = 380 + Math.random() * 260;
      s.vx = (Math.random() - 0.5) * 0.03;
      s.vy = 0.01 + Math.random() * 0.03;
      s.vz = (Math.random() - 0.5) * 0.03;
      s.mesh.position.set(x, y, z);
      s.mesh.visible = true;
      if (color) s.mesh.material.color.set(color);
      left -= 1;
    });
  }

  function stepSparks(dt) {
    if (!world) return;
    world.sparks.forEach((s) => {
      if (s.life <= 0) return;
      s.life -= dt;
      s.vy -= 0.00005 * dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      s.mesh.material.opacity = clamp(s.life / 380, 0, 1);
      if (s.life <= 0) s.mesh.visible = false;
    });
  }

  function posePerson(g, t, mode) {
    if (!g) return;
    const u = g.userData;
    u.hip.position.y = 0.42 + Math.sin(t * 0.003 + u.t) * 0.03;
    u.head.rotation.y = Math.sin(t * 0.0016 + u.t) * 0.18;
    if (mode === "cheer") {
      u.armL.rotation.x = -2.2 + Math.sin(t * 0.012) * 0.2;
      u.armR.rotation.x = -2.3 + Math.sin(t * 0.013 + 1) * 0.2;
      u.hip.position.y = 0.5 + Math.abs(Math.sin(t * 0.01)) * 0.08;
    } else if (mode === "facepalm") {
      u.armR.rotation.x = -1.6;
      u.armL.rotation.x = -0.2;
      u.head.rotation.x = 0.35;
    } else {
      u.armL.rotation.x = -0.4 + Math.sin(t * 0.004 + u.t) * 0.25;
      u.armR.rotation.x = u.kind === "barker" ? -1.6 + Math.sin(t * 0.006) * 0.5 : -0.35 + Math.sin(t * 0.0045 + u.t + 1) * 0.35;
      u.head.rotation.x = 0;
    }
  }

  function paintPower(needle, spec) {
    const bar = el("highStrikerPowerBar");
    const lab = el("highStrikerPowerLabel");
    const wrap = el("highStrikerPowerWrap");
    const gold = el("highStrikerGoldZone");
    const paint = el("highStrikerPaintZone");
    const n = clamp(needle, 0, 1);
    if (bar) {
      bar.style.width = "0.42rem";
      bar.style.left = (n * 100) + "%";
    }
    const tw = trueWindow(spec || liveSpec());
    const pw = paintWindow(spec || liveSpec());
    if (gold) {
      gold.style.left = (tw.lo * 100) + "%";
      gold.style.width = ((tw.hi - tw.lo) * 100) + "%";
    }
    if (paint) {
      const late = !!(spec && spec.lateLie);
      paint.hidden = !late;
      paint.style.left = (pw.lo * 100) + "%";
      paint.style.width = ((pw.hi - pw.lo) * 100) + "%";
    }
    const q = timingQuality(n, spec || liveSpec());
    if (lab) lab.textContent = q > 0 ? "GOLD" : "WAIT";
    if (wrap) wrap.hidden = !isLive();
    const btn = el("highStrikerTap");
    if (btn) btn.classList.toggle("is-holding", holding() && isLive());
  }

  function syncScene(dt, now) {
    if (!world) return;
    const spec = liveSpec();
    const t = isLive() ? run.t : idleClock;
    const needle = needlePos(t, spec);
    const qNow = timingQuality(needle, spec);
    const puckU = isLive() || (run && run.dying) ? (run.puckU || 0) : (0.08 + Math.abs(Math.sin(idleClock * 0.0008)) * 0.5);

    world.puck.position.y = pegY(puckU);
    world.puck.position.x = isLive() ? (run.puckX || 0) : 0;
    world.puck.rotation.y += dt * 0.004;

    const thermoH = Math.max(0.16, needle * (TOWER_H - 0.75));
    world.thermoFill.scale.y = thermoH;
    world.thermoFill.position.y = TOWER_BASE + 0.22 + thermoH / 2;
    world.thermoFill.material.color.set(qNow > 0 ? 0xf0d09a : 0xc41e3a);
    world.thermoFill.material.emissiveIntensity = qNow > 0 ? 1.1 : 0.45;

    if (world.needle) world.needle.position.y = pegY(needle);
    const tw = trueWindow(spec);
    if (world.goldBand) {
      world.goldBand.position.y = pegY(tw.mid);
      const thick = clamp(spec.zoneH * 5.5, 0.7, 1.6);
      world.goldBand.scale.set(1, 1, thick);
      world.goldBand.material.emissiveIntensity = qNow > 0 ? 2.8 : 1.15;
      world.goldBand.material.opacity = 0.95;
    }
    const pw = paintWindow(spec);
    if (world.paintMark) {
      const lie = !!(spec.lateLie);
      world.paintMark.visible = lie;
      world.paintMark.position.y = pegY(pw.mid);
    }
    if (world.fakeMark) {
      world.fakeMark.visible = !!(spec.fakeAt);
      if (spec.fakeAt) world.fakeMark.position.set(-0.62, pegY(spec.fakeAt), 0.18);
    }

    const peak = predictPeak(qNow, spec);
    world.ghost.visible = !!(isLive() && qNow > 0 && (run.phase === "charging" || run.phase === "idle"));
    if (world.ghost.visible) world.ghost.position.y = pegY(peak);

    let malletX = -0.5;
    if (isLive() && run.phase === "charging") malletX = -2.05;
    else if (isLive() && run.phase === "swinging") malletX = lerp(-2.2, 0.85, 1 - (run.swingT || 0) / 90);
    else malletX = -0.5 + Math.sin(t * 0.002) * 0.06;
    world.mallet.rotation.x = malletX;
    world.mallet.rotation.y = 0;
    world.mallet.rotation.z = 0.05;

    if (world.pad) {
      const dip = (run && run.padDip) || 0;
      world.pad.rotation.x = dip * 0.55;
    }

    const bellShake = (run && run.bellShake) || 0;
    world.bell.rotation.z = Math.sin(t * 0.04) * (bellShake > 0 ? 0.35 : 0.04);
    world.bell.scale.setScalar(bellShake > 0 ? 1.08 : 1);
    world.bellLight.intensity = bellShake > 0 ? 3.4 : 0.45;
    world.liarBell.visible = !!(spec.fakeAt);
    world.liarBell.position.y = pegY(spec.fakeAt || 0.26);
    if (run && run.liarFlash > 0) world.liarBell.rotation.z = Math.sin(t * 0.08) * 0.5;

    world.tower.rotation.z = 0;
    if (world.tentRoof) world.tentRoof.visible = !spec.coda;
    if (world.windFlag) {
      world.windFlag.rotation.y = Math.sin(t * 0.008) * 0.22;
      world.windFlag.material.color.set(qNow > 0 ? 0xf0d09a : 0xc41e3a);
    }
    world.lanterns.forEach((L, i) => { L.intensity = 1.3 + Math.sin(t * 0.003 + i) * 0.3; });
    if (world.motes) world.motes.rotation.y += dt * 0.00004;

    const auraMode = (run && run.bellFlash > 0) ? "cheer" : (run && run.missFlash > 0) ? "facepalm" : "idle";
    posePerson(world.aura, t, auraMode);
    posePerson(world.barker, t, run && run.bellFlash > 0 ? "cheer" : "idle");
    world.hitLight.intensity = Math.max(0, ((run && run.hitFlash) || 0) / 70);
    stepSparks(dt);

    let wantPos;
    let wantLook;
    if (world.bellCam > 0) {
      wantPos = new THREE.Vector3(0.7, 8.2, 4.6);
      wantLook = new THREE.Vector3(0, 8.0, 0);
    } else if (isLive() && (run.phase === "flying" || run.phase === "swinging")) {
      wantPos = new THREE.Vector3(2.6, 1.6 + puckU * 4.2, 6.6);
      wantLook = new THREE.Vector3(run.puckX || 0, pegY(puckU), 0);
    } else if (isLive()) {
      wantPos = new THREE.Vector3(3.2, 2.9, 7.1);
      wantLook = new THREE.Vector3(-0.25, 3.5, 0.15);
    } else if (reduceMotion) {
      wantPos = new THREE.Vector3(5.2, 3.5, 8.0);
      wantLook = new THREE.Vector3(0, 3.3, 0);
    } else {
      const a = idleClock * 0.00022;
      wantPos = new THREE.Vector3(Math.sin(a) * 8.2, 3.5, Math.cos(a) * 8.2);
      wantLook = new THREE.Vector3(0, 3.3, 0);
    }
    const k = Math.min(1, dt * (world.bellCam > 0 ? 0.008 : 0.0048));
    world.camPos.lerp(wantPos, k);
    world.camLook.lerp(wantLook, k);
    world.camera.position.copy(world.camPos);
    if (world.shake > 0.05) {
      world.camera.position.x += (Math.random() - 0.5) * world.shake * 0.04;
      world.camera.position.y += (Math.random() - 0.5) * world.shake * 0.03;
    }
    world.camera.lookAt(world.camLook);
    world.shake *= 0.86;
    if (world.bellCam > 0) world.bellCam -= dt;
    if (world.scene.fog) world.scene.fog.density = spec.coda ? 0.012 : 0.026;
    world.renderer.render(world.scene, world.camera);
  }

  function toast(msg, ms) {
    if (!run) return;
    run.toast = msg;
    run.toastMs = ms || 800;
    const n = el("highStrikerToast");
    if (n) { n.hidden = false; n.textContent = msg; }
  }

  function showRoomCard(spec) {
    const cardEl = el("highStrikerRoomCard");
    if (!cardEl || !spec) return;
    setText("highStrikerRoomKind", spec.coda ? "ENDLESS SKY PEG" : "AUTHORED TOWER");
    setText("highStrikerRoomName", spec.name);
    setText("highStrikerRoomTell", spec.tell || "HOLD · RELEASE · SMASH");
    cardEl.hidden = false;
    if (run) run.roomCardMs = 1000;
  }

  function ensureHud() {
    const hud = document.querySelector(`[data-runkit-hud="${GAME_ID}"]`);
    if (!hud) return;
    const spec = (run && run.spec) || highstrikerStageParams(1);
    const towers = (run && (run.towers | 0)) || 0;
    hud.textContent = spec.coda
      ? `ENDLESS · TOWER ${spec.id} · ${spec.name}`
      : `TOWER ${towers} · ${spec.name}`;
  }

  function paintPips() {
    const span = document.querySelector(`[data-runkit-strikes="${GAME_ID}"]`);
    if (!span) return;
    const n = isLive() || (run && run.dying) ? (run.strikes | 0) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < n));
  }

  function challengeLine(n) {
    const kitRun = rk();
    if (kitRun && typeof kitRun.challengeText === "function") {
      try { return kitRun.challengeText("High Striker tower", n | 0, GAME_ID); } catch (_) { /* */ }
    }
    return `Beat my High Striker towers ${n | 0} on Penny Fever`;
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try { return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false }); } catch (_) { /* */ }
    }
    if (kit && typeof kit.persistRun === "function") kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "weak swing",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestHighStriker = Math.max(state.bestHighStriker || 0, payload.depth);
      state.bestHighStrikerScore = Math.max(state.bestHighStrikerScore || 0, payload.score);
    }
    closeKitRun(payload);
    if (kit && typeof kit.persistRun === "function") kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function tellDepth(n) {
    const towers = n | 0;
    if (run && run.kitRun) run.kitRun.depth = towers;
    const spec = (run && run.spec) || highstrikerStageParams(Math.max(1, towers));
    if (run && run.kitRun && rk() && typeof rk().reportDepth === "function") {
      try { rk().reportDepth(run.kitRun, towers, { name: spec.name, coda: !!spec.coda }); } catch (_) { /* */ }
    }
    ensureHud();
  }

  function tellStrike(reason) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportStrike !== "function") return;
    try { rk().reportStrike(run.kitRun, reason); } catch (_) { /* */ }
    paintPips();
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    if (typeof PF.spendDemoCoin === "function" && PF.spendDemoCoin() === false) return null;
    return { gameId: GAME_ID, startedAt: Date.now(), depth: 0, score: 0, strikes: 0, alive: true };
  }

  function stampDepthCopy() {
    const host = card();
    if (!host) return;
    const num = host.querySelector(".machine-number");
    if (num) num.textContent = DEPTH_COPY.machine;
    host.querySelectorAll("[data-pf-depth-copy]").forEach((p) => { p.textContent = DEPTH_COPY.body; });
    ensureHud();
    paintPips();
    if (!isLive() && el("highStrikerStatus") && (!run || run.done)) {
      el("highStrikerStatus").textContent = DEPTH_COPY.status;
    }
  }

  function dingBell(heavy) {
    if (kit) {
      kit.sfx("rack");
      if (heavy) kit.sfx("chapter");
    }
  }

  function ringBell(label) {
    run.score += 220;
    if (run.kitRun) run.kitRun.score = run.score;
    run.bellFlash = 820;
    run.bellShake = 520;
    if (world) {
      world.bellCam = 780;
      world.shake = 8;
      spawnSparks(0, pegY(1), 0.2, 18, "#f0d09a");
    }
    dingBell(true);
    toast(label || "BELL — checkpoint. KEEP CLIMBING.", 1200);
    PF.setAura("celebrate");
  }

  function enterTower(next) {
    run.spec = next;
    run.puckU = 0;
    run.puckX = 0;
    run.puckVy = 0;
    run.puckVx = 0;
    run.phase = "idle";
    run.charge = 0;
    run.aim = 0;
    run.rung = false;
    run.liarDone = false;
    run.boosted = false;
    run.goldSeen = 0;
    run.inGold = false;
    run.hitShrink = 1;
    showRoomCard(next);
    if (kit) kit.sfx("chapter");
    toast(next.coda ? `ENDLESS · ${next.name}` : next.name, 900);
    setText("highStrikerStatus", `${next.coda ? "ENDLESS · " : ""}${next.name} — ${next.barker}`);
    setText("highStrikerBarker", next.barker);
    tellDepth(run.towers);
    const howto = el("highStrikerHowTo");
    if (howto) {
      const extra = howto.querySelector(".hs-tower-hint");
      if (extra) extra.textContent = next.tell;
    }
  }

  function clearTower() {
    run.towers += 1;
    ringBell(`${run.spec.name.toUpperCase()} CLEAR — keep climbing`);
    if (run.kitRun) run.kitRun.depth = run.towers;
    tellDepth(run.towers);
    paintPips();
    PF.refreshDepth();
    const next = highstrikerStageParams(run.towers + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    run.phase = "idle";
    enterTower(next);
  }

  function strike(reason) {
    run.strikes += 1;
    run.missFlash = 420;
    if (world) {
      world.shake = 6;
      spawnSparks(0.5, 1.1, 1.3, 8, "#c41e3a");
    }
    tellStrike(reason);
    paintPips();
    if (kit) kit.sfx("miss");
    PF.setAura("laugh");
    const left = STRIKES_TO_DEATH - run.strikes;
    setText("highStrikerStatus", `${reason.toUpperCase()} · ${run.strikes}/${STRIKES_TO_DEATH} · ${run.spec.name}`);
    toast(`${reason} — ${left} left`, 900);
    run.lastNote = reason;
    if (run.strikes >= STRIKES_TO_DEATH) finish(reason);
    else {
      run.phase = "idle";
      run.puckU = 0;
      run.puckX = 0;
      run.puckVy = 0;
      run.puckVx = 0;
      run.rung = false;
      run.boosted = false;
      run.goldSeen = 0;
      run.inGold = false;
      if (run.spec && run.spec.shrinkAfter) run.hitShrink = Math.max(0.72, (run.hitShrink || 1) * 0.86);
    }
  }

  function beginCharge() {
    if (!isLive()) return;
    if (run.phase !== "idle") return;
    run.phase = "charging";
    const spec0 = liveSpec();
    run.inGold = timingQuality(needlePos(run.t, spec0), spec0) > 0;
    run.goldSeen = run.inGold ? 1 : 0;
    setText("highStrikerStatus", spec0.secondPass
      ? "Wound. Skip the first gold. Release on the NEXT pass."
      : "Wound. Release when the needle is in the gold.");
  }

  function releaseSmash() {
    if (!isLive() || run.phase !== "charging") return;
    const spec = liveSpec();
    const pos = needlePos(run.t, spec);
    let quality = timingQuality(pos, spec);
    let note = "";
    if (spec.secondPass && quality > 0 && (run.goldSeen || 0) < 2) {
      quality = 0;
      note = "second";
      toast("TOO EARLY — that’s the liar pass", 900);
    } else if (quality <= 0 && inFakeGold(pos, spec)) {
      note = "fake";
      toast("DECOY GOLD — live band is brighter", 900);
    } else if (quality <= 0 && spec.lateLie && pos >= paintWindow(spec).lo && pos <= paintWindow(spec).hi) {
      note = "late";
      toast("PAINT LIES EARLY — true gold is late", 900);
    } else if (quality <= 0 && spec.reverse) {
      note = "reverse";
    }
    run.phase = "swinging";
    run.swingT = 90;
    run.pendingQuality = quality;
    run.lastNote = note;
    if (kit) kit.sfx("sling");
  }

  function impact() {
    const spec = liveSpec();
    const quality = run.pendingQuality || 0;
    run.padDip = 1;
    run.hitFlash = 240;
    if (world) {
      world.shake = 4 + quality * 6;
      spawnSparks(0.55, 0.8, 1.15, 8 + Math.floor(quality * 12), quality > 0 ? "#f0d09a" : "#c41e3a");
    }
    if (kit) kit.sfx("sink");
    if (quality <= 0) {
      run.phase = "idle";
      strike(run.lastNote || "miss");
      return;
    }
    run.phase = "flying";
    run.puckU = 0.02;
    run.puckX = 0;
    run.puckVy = launchSpeed(quality, spec);
    run.puckVx = 0;
    run.rung = false;
    run.liarDone = false;
    run.peakThis = 0;
    setText("highStrikerStatus", quality >= 0.85 ? "Clean gold. Watch the bell." : "Edge of gold. Might be short.");
  }

  function stepPuck(dt) {
    const spec = liveSpec();
    const sec = dt / 1000;
    const g = spec.gravity || GRAVITY;
    run.puckVy -= g * sec;
    run.puckU += (run.puckVy / TOWER_H) * sec;
    run.peakThis = Math.max(run.peakThis || 0, run.puckU);
    run.peak = Math.max(run.peak || 0, run.puckU);

    if (!run.rung && run.puckU >= spec.bell && run.puckVy > 0) {
      run.rung = true;
      run.score += 80;
      if (run.kitRun) run.kitRun.score = run.score;
    }

    if (run.puckU >= 1.02) {
      run.puckU = 1.02;
      run.puckVy = Math.min(run.puckVy, 0);
    }

    if (run.puckU <= 0 && run.puckVy <= 0) {
      run.puckU = 0;
      run.puckVy = 0;
      run.puckVx = 0;
      if (run.rung) {
        run.score += 40;
        clearTower();
      } else {
        strike(run.lastNote || "miss");
      }
    }
  }

  function auraLine(reason, towers) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "late" || (run && run.lastNote === "late")) return AURA.late;
    if (reason === "fake" || (run && run.lastNote === "fake")) return AURA.fake;
    if (reason === "reverse" || (run && run.lastNote === "reverse")) return AURA.reverse;
    if (reason === "second" || (run && run.lastNote === "second")) return AURA.second;
    if (reason === "shrink" || (run && run.spec && run.spec.shrinkAfter && run.hitShrink < 1)) return AURA.shrink;
    if (reason === "air") return AURA.air;
    if (reason === "miss") return AURA.miss;
    if (towers <= 0) return AURA.shallow;
    if (run && run.spec && run.spec.coda) return AURA.coda;
    if (towers >= 8) return AURA.coda;
    if (towers >= 5) return AURA.deep;
    if (towers >= 2) return AURA.mid;
    return AURA.slip;
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.deathReason = reason === "souvenir" ? "souvenir" : (reason || "weak swing");
    run.deathHold = DEATH_HOLD_MS;
    if (reason !== "souvenir" && kit) kit.sfx("stamp");
    if (world) world.shake = 8;
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    holdCanvas = holdBtn = holdSpace = false;
    const towers = run.towers | 0;
    const score = run.score;
    const death = reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : (reason || "weak swing"));
    persistDepth({
      depth: towers,
      score,
      deathReason: death,
      cashedOut: reason === "souvenir",
      meta: { tower: run.spec && run.spec.id, room: run.spec && run.spec.name, kind: run.spec && run.spec.kind, coda: !!(run.spec && run.spec.coda) },
    });
    stampDepthCopy();
    const startBtn = el("highStrikerStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "SMASH AGAIN · 1 demo coin";
    }
    const tapBtn = el("highStrikerTap");
    if (tapBtn) tapBtn.hidden = true;
    paintPower(0);
    PF.focusCard("highStrikerCard", false);
    if (kit) kit.setMode(card(), "result");
    const aura = auraLine(death, towers);
    const challenge = challengeLine(towers);
    const verdict = el("highStrikerVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = `TOWER ${towers} · SCORE ${score} · ${death} · ${aura}`;
    }
    if (kit) {
      kit.fillResult({
        root: "highStrikerResult",
        depth: "highStrikerResultDepth",
        score: "highStrikerResultScore",
        aura: "highStrikerResultAura",
        copied: "highStrikerCopied",
      }, {
        depthLine: `TOWER ${towers}${run.spec && run.spec.name ? " · " + run.spec.name : ""}`,
        scoreLine: `SCORE ${score} · ${String(death).replace(/_/g, " ")}`,
        auraLine: aura,
      });
    }
    const reasonNode = el("highStrikerResultReason");
    if (reasonNode) reasonNode.textContent = String(death).replace(/_/g, " ").toUpperCase();
    setText("highStrikerChallengeText", challenge);
    PF.setTier("highStrikerTier", towers > 0 ? `TOWER ${towers}` : "SLIP", towers > 0 ? "perfect" : "miss");
    setText("highStrikerStatus", reason === "leave" ? "Stepped off the stall." : reason === "souvenir" ? "Souvenir — authored towers cleared." : "Tower stamped SLIP.");
    if (towers > 0) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "High striker");
      PF.setAura("celebrate");
      if (reason !== "leave") PF.showBanner(true, `TOWER ${towers}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "High striker miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "SLIP", aura);
    }
    PF.refreshNightBoard();
  }

  function tickFx(dt) {
    if (!run) return;
    run.bellFlash = Math.max(0, (run.bellFlash || 0) - dt);
    run.bellShake = Math.max(0, (run.bellShake || 0) - dt);
    run.liarFlash = Math.max(0, (run.liarFlash || 0) - dt);
    run.hitFlash = Math.max(0, (run.hitFlash || 0) - dt);
    run.missFlash = Math.max(0, (run.missFlash || 0) - dt);
    run.padDip = Math.max(0, (run.padDip || 0) - dt * 0.006);
    run.toastMs = Math.max(0, (run.toastMs || 0) - dt);
    run.roomCardMs = Math.max(0, (run.roomCardMs || 0) - dt);
    const toastEl = el("highStrikerToast");
    if (toastEl) toastEl.hidden = !(run.toastMs > 0);
    const room = el("highStrikerRoomCard");
    if (room) room.hidden = !(run.roomCardMs > 80);
  }

  function step(dt) {
    tickFx(dt);
    const spec = liveSpec();
    const pos = needlePos(run.t, spec);
    const inGold = timingQuality(pos, spec) > 0;
    if (run.phase === "charging") {
      if (inGold && !run.inGold) run.goldSeen = (run.goldSeen || 0) + 1;
      run.inGold = inGold;
    }
    if (run.phase === "charging") {
      paintPower(pos, spec);
      if (!holding()) releaseSmash();
    } else {
      paintPower(pos, spec);
    }
    if (run.phase === "swinging") {
      run.swingT -= dt;
      if (run.swingT <= 0) impact();
    }
    if (run.phase === "flying") stepPuck(dt);
  }

  function loop(now) {
    if (!cabinetOn()) { raf = 0; return; }
    if (!world) buildWorld();
    const last = loop._last || now;
    const dt = Math.min(32, now - last);
    loop._last = now;
    idleClock += dt;
    if (isLive() || (run && run.dying)) {
      if (!run.last) run.last = now;
      run.t += dt;
      if (run.dying) {
        tickFx(dt);
        syncScene(dt, now);
        run.deathHold -= dt;
        if (run.deathHold <= 0) sealResult(run.deathReason);
      } else {
        step(dt);
        syncScene(dt, now);
        PF.refreshDepth();
      }
    } else {
      syncScene(dt, now);
    }
    raf = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (raf) return;
    loop._last = 0;
    raf = requestAnimationFrame(loop);
  }
  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function punchStart() {
    stampDepthCopy();
    setText("highStrikerStatus", "Press START. Then HOLD to wind — RELEASE to smash.");
    const btn = el("highStrikerStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* */ }
    }
  }

  function start() {
    if (isLive()) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("highStrikerStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      stampDepthCopy();
      return;
    }
    buildWorld();
    const spec0 = highstrikerStageParams(1);
    run = {
      done: false, dying: false, kitRun, t: 0, last: 0,
      spec: spec0, towers: 0, score: 0, strikes: 0, peak: 0,
      phase: "idle", puckU: 0, puckX: 0, puckVy: 0, puckVx: 0,
      swingT: 0, pendingQuality: 0, rung: false, liarDone: false,
      goldSeen: 0, inGold: false, hitShrink: 1,
      bellFlash: 0, bellShake: 0, hitFlash: 0, missFlash: 0, padDip: 0,
      toast: "", toastMs: 0, roomCardMs: 1400, lastNote: "", deathHold: 0, deathReason: "",
    };
    tellDepth(0);
    paintPips();
    const startBtn = el("highStrikerStart");
    if (startBtn) startBtn.disabled = true;
    const verdict = el("highStrikerVerdict");
    if (verdict) verdict.hidden = true;
    const tapBtn = el("highStrikerTap");
    if (tapBtn) {
      tapBtn.hidden = false;
      tapBtn.textContent = "HOLD · RELEASE ON GOLD";
    }
    if (kit) kit.hideResult("highStrikerResult");
    PF.setTier("highStrikerTier", "", "");
    if (kit) kit.setMode(card(), "play");
    stampDepthCopy();
    setText("highStrikerStatus", `${spec0.name} — ${spec0.barker}`);
    setText("highStrikerBarker", spec0.barker);
    showRoomCard(spec0);
    paintPower(0);
    PF.focusCard("highStrikerCard", true);
    PF.setAura("think");
    startLoop();
  }

  function pointerFrac(ev) {
    const canvas = el("highStrikerCanvas");
    if (!canvas) return 0.5;
    const r = canvas.getBoundingClientRect();
    const t = (ev.touches && ev.touches[0]) || ev;
    return clamp((t.clientX - r.left) / Math.max(1, r.width), 0, 1);
  }

  PF.registerVendor({
    id: "high-striker",
    playKey: "highstriker",
    chalk: "Hold to wind. Smash the pad. The bell is a checkpoint.",
    defaults: { bestHighStriker: 0, bestHighStrikerScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      holdCanvas = holdBtn = holdSpace = false;
      stopLoop();
    },
    onShow() {
      stampDepthCopy();
      buildWorld();
      resizeWorld();
      requestAnimationFrame(() => { resizeWorld(); startLoop(); });
    },
    onReset() {
      run = null;
      holdCanvas = holdBtn = holdSpace = false;
      const verdict = el("highStrikerVerdict");
      if (verdict) verdict.hidden = true;
      if (kit) kit.hideResult("highStrikerResult");
      const startBtn = el("highStrikerStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      const tapBtn = el("highStrikerTap");
      if (tapBtn) tapBtn.hidden = true;
      paintPower(0);
      if (kit) kit.setMode(card(), "vestibule");
      stampDepthCopy();
      startLoop();
    },
    refreshDepth(state) {
      setText("depthStrikerNow", isLive() || (run && run.dying) ? String(run.towers) : "0");
      const bestN = Math.max(state.bestHighStriker || 0, (state.bestDepth && state.bestDepth.highstriker) || 0);
      setText("depthStrikerBest", bestN ? String(bestN) : "—");
      setText("depthStrikerScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("depthStrikerBestScore", state.bestHighStrikerScore ? String(state.bestHighStrikerScore) : "—");
      const door = el("highStrikerDoorBest");
      if (door) door.textContent = bestN ? `Best tower ${bestN}` : "Towers —";
    },
    bind() {
      declareP0();
      const startBtn = el("highStrikerStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const tapBtn = el("highStrikerTap");
      if (tapBtn) {
        tapBtn.addEventListener("pointerdown", (ev) => {
          ev.preventDefault();
          if (!isLive()) { if (!run || run.done) punchStart(); return; }
          holdBtn = true;
          beginCharge();
        });
        tapBtn.addEventListener("pointerup", (ev) => {
          ev.preventDefault();
          holdBtn = false;
          if (isLive()) releaseSmash();
        });
        tapBtn.addEventListener("pointerleave", () => {
          if (holdBtn) { holdBtn = false; if (isLive()) releaseSmash(); }
        });
        tapBtn.addEventListener("click", (ev) => ev.preventDefault());
      }
      const canvas = el("highStrikerCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) { if (!run || run.done) punchStart(); return; }
          ev.preventDefault();
          pointerX = pointerFrac(ev);
          holdCanvas = true;
          try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* */ }
          beginCharge();
        });
        canvas.addEventListener("pointermove", (ev) => {
          pointerX = pointerFrac(ev);
        });
        canvas.addEventListener("pointerup", (ev) => {
          holdCanvas = false;
          if (isLive()) releaseSmash();
        });
        canvas.addEventListener("pointercancel", () => {
          holdCanvas = false;
          if (isLive()) releaseSmash();
        });
      }
      window.addEventListener("keydown", (ev) => {
        if (!cabinetOn()) return;
        if (ev.code === "Space" || ev.key === " ") {
          ev.preventDefault();
          if (!isLive()) { if (!run || run.done) punchStart(); return; }
          if (!holdSpace) {
            holdSpace = true;
            beginCharge();
          }
        }
      });
      window.addEventListener("keyup", (ev) => {
        if (!cabinetOn()) return;
        if (ev.code === "Space" || ev.key === " ") {
          ev.preventDefault();
          holdSpace = false;
          if (isLive()) releaseSmash();
        }
      });
      const copyBtn = el("highStrikerChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const last = PF.getState().lastRun;
          const n = (last && (last.game === GAME_ID || last.gameId === GAME_ID))
            ? last.depth
            : (PF.getState().bestHighStriker || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("highStrikerCopied");
            if (copied) { copied.hidden = false; copied.textContent = "Copied — send it"; }
            setText("highStrikerStatus", "Copied — send it");
          }, () => setText("highStrikerStatus", text));
        });
      }
      window.addEventListener("resize", () => { if (cabinetOn()) resizeWorld(); });
      if (typeof ResizeObserver !== "undefined") {
        const stage = el("highStrikerStage");
        if (stage) {
          const ro = new ResizeObserver(() => { if (cabinetOn()) resizeWorld(); });
          ro.observe(stage);
        }
      }
      stampDepthCopy();
    },
  });
}
