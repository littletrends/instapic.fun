/* Weighted Bottles — 3D tent. PF only. Never booth/port 6000. Never Imagine downloads.
 * One doorway: milk-bottles. Three.js tent, custom camera, stacked physics, juice.
 * Inspiration: 7 authored pyramids then ENDLESS. Bottom row is lead. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const GAME_ID = "milk";
  const AUTHORED_COUNT = 7;
  const CODA_ENABLED = true;
  const STAMP_MS = 780;
  const TABLE_Y = 0.78;
  const BALL_R = 0.052;
  const BOTTLE_R = 0.068;
  const BOTTLE_H = 0.36;
  const GRAVITY = 11.6;
  const HERE = (document.currentScript && document.currentScript.src) || "";

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;

  const AURA = {
    throws: "Aura: Three softballs. That bottom row is concrete, sugar.",
    incomplete: "Aura: Pyramid still standing. The heavy ones laughed.",
    clear: "Aura: Spill complete. Next pyramid fights dirtier.",
    souvenir: "Aura: Pyramid seven locked. Souvenir — the lead salutes.",
    coda: "Aura: Authored ride’s over. ENDLESS — concrete keeps climbing.",
    deep: (n) => `Aura: Pyramid ${n}. You're arguing with gravity and winning.`,
    welcome: "Aura: Heels are lead. Cream on top is a liar. Three throws.",
  };

  const MILK_LEVELS = [
    {
      id: 1, name: "Fairground Six", kind: "classic", layout: "3-2-1",
      topMass: 0.78, midMass: 1.15, bottomMass: 3.05, gap: 0.155, rise: 0.33,
      windDrift: 0, glueBottomCorner: false, stuckBottle: false,
      barker: "Classic six. Aim the base — the cream on top is a liar.",
    },
    {
      id: 2, name: "Heavy Heels", kind: "heavyHeels", layout: "3-2-1",
      topMass: 0.62, midMass: 1.0, bottomMass: 3.65, gap: 0.155, rise: 0.33,
      windDrift: 0, glueBottomCorner: false, stuckBottle: false,
      barker: "Same silhouette. Bottoms are concrete. Tops fly if you let them.",
    },
    {
      id: 3, name: "Wide Shoulders", kind: "wideShoulders", layout: "4-3-2-1",
      topMass: 0.8, midMass: 1.55, bottomMass: 3.2, gap: 0.162, rise: 0.322,
      windDrift: 0, glueBottomCorner: false, stuckBottle: false,
      barker: "Ten pins. New silhouette. Mid row fights back too.",
    },
    {
      id: 4, name: "Glue Corner", kind: "glueCorner", layout: "3-2-1",
      topMass: 0.8, midMass: 1.2, bottomMass: 3.15, gap: 0.15, rise: 0.33,
      windDrift: 0, glueBottomCorner: true, stuckBottle: false,
      barker: "Left heel is glued. Plan the second shot.",
    },
    {
      id: 5, name: "Split Stack", kind: "splitStack", layout: "3+3", stacks: 2,
      topMass: 0.78, midMass: 1.15, bottomMass: 3.25, gap: 0.148, rise: 0.33,
      windDrift: 0, glueBottomCorner: false, stuckBottle: false,
      barker: "Two boards. Both must fall. Center aisle is dead air.",
    },
    {
      id: 6, name: "Wind Shelf", kind: "windShelf", layout: "3-2-1",
      topMass: 0.75, midMass: 1.2, bottomMass: 3.4, gap: 0.148, rise: 0.33,
      windDrift: 0.55, glueBottomCorner: false, stuckBottle: false,
      barker: "Lateral wind on the ball. Lead the throw into the gust.",
    },
    {
      id: 7, name: "Stuck Pin Atelier", kind: "stuckPin", layout: "3-2-1",
      topMass: 0.72, midMass: 1.25, bottomMass: 3.9, gap: 0.145, rise: 0.33,
      windDrift: 0, glueBottomCorner: false, stuckBottle: true,
      barker: "Dark pin is stuck. Scout it, then strike. Bottoms are lead.",
    },
  ];

  const P0_MOUNT = {
    engine: "SlingAim",
    displayName: "Weighted Milk Bottles",
    depthUnit: "Pyramid",
    sheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  let THREE = null;
  let world = null;
  let run = null;
  let raf = 0;
  let visible = false;
  let idleRoom = 1;
  let idleClock = 0;
  let loadP = null;
  let lastTs = 0;

  function rk() {
    return PF.runKit || null;
  }

  function card() {
    return $("milkCard");
  }

  function milkCodaParams(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const t = stage - AUTHORED_COUNT;
    return {
      id: stage,
      name: `Concrete Row ${stage}`,
      title: `Concrete Row ${stage}`,
      kind: "coda",
      coda: true,
      layout: t % 2 ? "4-3-2-1" : "3-2-1",
      throwsPerPyramid: 3,
      topMass: 0.7,
      midMass: 1.35,
      bottomMass: Math.min(4.8, 3.8 + 0.18 * t),
      gap: 0.142,
      windDrift: Math.min(0.85, 0.28 + t * 0.06),
      glueBottomCorner: t % 3 === 0,
      stuckBottle: true,
      rise: 0.328,
      stacks: 1,
      barker: "ENDLESS — concrete keeps climbing.",
    };
  }

  function milkLevel(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) {
      const L = MILK_LEVELS[stage - 1];
      return Object.assign({
        throwsPerPyramid: 3,
        coda: false,
        stacks: 1,
      }, L, { id: stage, title: L.name, name: L.name });
    }
    if (!CODA_ENABLED) return null;
    return milkCodaParams(stage);
  }

  function hudStageLine(spec, cleared) {
    if (!spec) return `PYRAMID ${cleared | 0}`;
    if (spec.coda) return `ENDLESS · PYRAMID ${spec.id} · ${spec.name}`;
    return `PYRAMID ${spec.id} · ${spec.name}`;
  }

  function roomTell(spec) {
    if (!spec) return "BOTTOM ROW IS LEAD";
    if (spec.kind === "splitStack") return "TWO BOARDS · BOTH MUST FALL";
    if (spec.kind === "glueCorner") return "LEFT HEEL IS GLUED · TWO THROWS";
    if (spec.kind === "stuckPin") return "SCOUT THE DARK PIN · THEN STRIKE";
    if (spec.kind === "windShelf") return "WIND ON THE BALL · LEAD THE GUST";
    if (spec.kind === "wideShoulders") return "TEN PINS · 4–3–2–1 WIDE BASE";
    if (spec.kind === "heavyHeels") return "SAME SIX · HEELS ARE CONCRETE";
    if (spec.coda) return "ENDLESS · CONCRETE ROW";
    return "BOTTOM ROW IS LEAD";
  }

  function layoutSlots(spec) {
    if (spec.kind === "wideShoulders" || spec.layout === "4-3-2-1") {
      return [
        { col: 0, row: 0 },
        { col: -0.62, row: 1 }, { col: 0.62, row: 1 },
        { col: -1.24, row: 2 }, { col: 0, row: 2 }, { col: 1.24, row: 2 },
        { col: -1.92, row: 3 }, { col: -0.64, row: 3 }, { col: 0.64, row: 3 }, { col: 1.92, row: 3 },
      ];
    }
    if (spec.kind === "splitStack" || spec.layout === "3+3") {
      return [
        { col: -3.15, row: 0, stack: 0 },
        { col: -3.72, row: 1, stack: 0 },
        { col: -2.58, row: 1, stack: 0 },
        { col: 3.15, row: 0, stack: 1 },
        { col: 2.58, row: 1, stack: 1 },
        { col: 3.72, row: 1, stack: 1 },
      ];
    }
    return [
      { col: 0, row: 0 },
      { col: -0.5, row: 1 }, { col: 0.5, row: 1 },
      { col: -1, row: 2 }, { col: 0, row: 2 }, { col: 1, row: 2 },
    ];
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function sfx(name) {
    try { if (kit && kit.sfx) kit.sfx(name); } catch (_) {}
  }

  function isLive() {
    return !!(run && !run.done && run.kitRun && run.kitRun.alive !== false);
  }

  function threeUrl() {
    if (HERE) return new URL("../world/lib/three.module.min.js", HERE).href;
    return new URL("world/lib/three.module.min.js", location.href).href;
  }

  function loadThree() {
    if (loadP) return loadP;
    loadP = import(threeUrl()).then((mod) => {
      THREE = mod;
      return mod;
    }).catch((err) => {
      console.warn("[milk-bottles] Three.js failed", err);
      THREE = null;
      return null;
    });
    return loadP;
  }

  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
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
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function meshSphere(material, r, x, y, z) {
    const m = new THREE.Mesh(world.geo.sphere, material);
    m.scale.setScalar(r);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function meshCyl(material, rTop, rBot, h, x, y, z) {
    const m = new THREE.Mesh(world.geo.cyl, material);
    m.scale.set(rTop, h, rBot);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    const spec = Object.assign({
      authored: MILK_LEVELS,
      authoredCount: AUTHORED_COUNT,
      codaEnabled: CODA_ENABLED,
      codaParams: milkCodaParams,
      level: milkLevel,
      stageParams: milkLevel,
      milkStageParams: milkLevel,
    }, P0_MOUNT);
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, spec); } catch (_) {}
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = spec;
    kitRun.declared = kitRun.declared || {};
    kitRun.declared[GAME_ID] = spec;
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function paintHud(spec) {
    const host = card();
    if (!host) return;
    const hud = host.querySelector(".milk-rk-hud");
    if (hud) {
      if (!spec || !run || run.done) hud.textContent = "";
      else hud.textContent = hudStageLine(spec, run.pyramids);
    }
    const barker = $("milkBarker") || host.querySelector(".barker-call");
    if (barker) {
      barker.textContent = spec && spec.barker
        ? `${spec.name.toUpperCase()} — ${spec.barker}`
        : "KNOCK ’EM ALL — THE BOTTOM ONES FIGHT BACK";
    }
    const throws = $("milkThrows");
    if (throws) {
      const left = run && !run.done ? run.balls : 3;
      const pips = throws.querySelectorAll("i");
      pips.forEach((el, i) => el.classList.toggle("is-spent", i >= left));
    }
    setPower(run && run.aim ? run.aim.power : 0, !!(run && run.aim));
  }

  function setPower(n, on) {
    const bar = $("milkPower");
    const fill = $("milkPowerFill");
    if (!bar) return;
    bar.hidden = !on;
    if (fill) fill.style.width = `${Math.round(clamp(n, 0.08, 1) * 100)}%`;
  }

  function setTaught(on) {
    const host = card();
    if (host) host.classList.toggle("is-taught", !!on);
  }

  function setStatus(text) {
    const el = $("milkStatus");
    if (el) el.textContent = text;
  }

  function saveLiveDepth() {
    if (!run) return;
    const state = PF.getState();
    if (!state) return;
    const depth = run.pyramids | 0;
    const score = run.score | 0;
    state.bestMilkPyramids = Math.max(state.bestMilkPyramids || 0, depth);
    state.bestMilkScore = Math.max(state.bestMilkScore || 0, score);
    state.bestDepth = state.bestDepth || {};
    state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, depth);
    if (run.kitRun) {
      run.kitRun.depth = depth;
      run.kitRun.score = score;
    }
    if (typeof PF.saveState === "function") PF.saveState();
    if (typeof PF.refreshDepth === "function") {
      try { PF.refreshDepth(); } catch (_) {}
    }
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) {}
    }
    return kit.persistRun(PF.getState(), GAME_ID, partial);
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "throws",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestMilkPyramids = Math.max(state.bestMilkPyramids || 0, payload.depth);
      state.bestMilkScore = Math.max(state.bestMilkScore || 0, payload.score);
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
    }
    closeKitRun(payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  /* ——— 3D world ——— */

  function bootWorld() {
    if (world || !THREE) return world;
    const canvas = $("milkCanvas");
    if (!canvas) return null;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: (window.devicePixelRatio || 1) < 1.6,
        powerPreference: "high-performance",
        alpha: false,
        failIfMajorPerformanceCaveat: false,
      });
    } catch (err) {
      console.warn("[milk-bottles] WebGL unavailable", err);
      setStatus("This tent wants a WebGL lantern.");
      return null;
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.05;
    renderer.setClearColor(0x14080c, 1);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a0c12, 7.5, 16);
    const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.08, 40);
    camera.position.set(0, 1.42, 2.72);

    world = {
      scene,
      camera,
      renderer,
      geo: {
        box: new THREE.BoxGeometry(1, 1, 1),
        sphere: new THREE.SphereGeometry(1, 14, 12),
        cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
        cone: new THREE.ConeGeometry(1, 1, 8),
      },
      tex: {},
      mats: {},
      bottles: [],
      leadTags: [],
      particles: [],
      traj: [],
      stringLights: [],
      flaps: [],
      cam: {
        mode: "enter",
        t: 0,
        shake: 0,
        punch: 0,
        yaw: 0,
        pitch: 0,
        pull: 0,
      },
      reduced: !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches),
      crateZ: -0.82,
      time: 0,
      fan: null,
      aura: null,
      handBall: null,
      stamp: null,
      gluePool: null,
      nailRing: null,
      banner: null,
      crate: null,
      crate2: null,
      aisleMark: null,
      lanterns: [],
      windVec: new THREE.Vector3(),
      tmp: new THREE.Vector3(),
      tmp2: new THREE.Vector3(),
      look: new THREE.Vector3(0, 0.96, -1.5),
    };

    buildTextures();
    buildTent();
    buildAura();
    buildHand();
    buildTrajectory();
    buildStamp();
    resize();
    setRoomDress(milkLevel(1));
    spawnPyramid(milkLevel(1), true);
    return world;
  }

  function buildTextures() {
    world.tex.wood = canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 22; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${0.05 + (i % 3) * 0.03})`;
        ctx.fillRect(i * 12 + 3, 0, 3, 256);
        ctx.fillStyle = `rgba(212,164,90,${0.04 + (i % 4) * 0.02})`;
        ctx.fillRect(i * 12 + 8, 0, 1, 256);
      }
    });
    world.tex.wood.repeat.set(2, 2);

    world.tex.floor = canvasTex(512, 512, (ctx) => {
      ctx.fillStyle = "#2a1810";
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 900; i += 1) {
        ctx.fillStyle = `rgba(${90 + (i % 40)},${50 + (i % 30)},${20},0.${3 + (i % 4)})`;
        ctx.fillRect((i * 47) % 512, (i * 91) % 512, 3 + (i % 5), 1);
      }
    });
    world.tex.floor.repeat.set(6, 6);

    world.tex.canvas = canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#7a2438";
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "#f0d8b0";
      for (let x = 0; x < 256; x += 32) ctx.fillRect(x, 0, 16, 256);
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let y = 0; y < 256; y += 18) ctx.fillRect(0, y, 256, 2);
    });
    world.tex.canvas.repeat.set(4, 2);

    world.tex.creamLabel = canvasTex(128, 128, (ctx) => {
      ctx.fillStyle = "#f4ead4";
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = "#7b2743";
      ctx.fillRect(8, 8, 112, 112);
      ctx.fillStyle = "#ffe6a6";
      ctx.font = "bold 28px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("MILK", 64, 58);
      ctx.font = "15px Georgia, serif";
      ctx.fillText("CREAM", 64, 86);
    });
    world.tex.creamLabel.wrapS = world.tex.creamLabel.wrapT = THREE.ClampToEdgeWrapping;
    world.tex.leadLabel = canvasTex(128, 128, (ctx) => {
      ctx.fillStyle = "#2a2c30";
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = "#6a6e74";
      ctx.fillRect(8, 8, 112, 112);
      ctx.strokeStyle = "#c8ccd0";
      ctx.lineWidth = 4;
      ctx.strokeRect(12, 12, 104, 104);
      ctx.fillStyle = "#e8eaee";
      ctx.font = "bold 30px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("LEAD", 64, 62);
      ctx.font = "14px Georgia, serif";
      ctx.fillText("WEIGHTED", 64, 88);
    });
    world.tex.leadLabel.wrapS = world.tex.leadLabel.wrapT = THREE.ClampToEdgeWrapping;
    world.tex.leadTag = canvasTex(256, 64, (ctx) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = "#d4a45a";
      ctx.font = "bold 28px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("LEAD", 128, 42);
    });
    world.tex.leadTag.wrapS = world.tex.leadTag.wrapT = THREE.ClampToEdgeWrapping;

    const bannerCanvas = document.createElement("canvas");
    bannerCanvas.width = 512;
    bannerCanvas.height = 128;
    world.tex.bannerCanvas = bannerCanvas;
    world.tex.banner = new THREE.CanvasTexture(bannerCanvas);
    world.tex.banner.colorSpace = THREE.SRGBColorSpace;
    world.tex.banner.wrapS = world.tex.banner.wrapT = THREE.ClampToEdgeWrapping;
    paintBanner({ name: "WEIGHTED BOTTLES" });

    world.mats.wood = mat(0xffffff, { map: world.tex.wood, roughness: 0.86 });
    world.mats.floor = mat(0xffffff, { map: world.tex.floor, roughness: 0.95 });
    world.mats.canvas = mat(0xffffff, {
      map: world.tex.canvas,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    world.mats.pole = mat(0x2a1810, { roughness: 0.7 });
    world.mats.brass = mat(GOLD, { metalness: 0.65, roughness: 0.32, emissive: 0x4a3008, emissiveIntensity: 0.35 });
    world.mats.glass = mat(0xf4f0e8, { roughness: 0.22, metalness: 0.12, transparent: true, opacity: 0.92 });
    world.mats.milk = mat(0xf7f2e6, { roughness: 0.55, emissive: 0x3a3020, emissiveIntensity: 0.12 });
    world.mats.cap = mat(0xb02030, { roughness: 0.4, metalness: 0.2 });
    world.mats.lead = mat(0x6a6e74, { metalness: 0.8, roughness: 0.35, emissive: 0x222428, emissiveIntensity: 0.2 });
    world.mats.leadGlass = mat(0x6e7278, { roughness: 0.28, metalness: 0.45, emissive: 0x2a2c30, emissiveIntensity: 0.18 });
    world.mats.leadSlug = mat(0x4a4e54, { metalness: 0.92, roughness: 0.22, emissive: 0x3a3c40, emissiveIntensity: 0.35 });
    world.mats.leadFill = mat(0x9aa0a8, { roughness: 0.5, metalness: 0.25 });
    world.mats.darkGlass = mat(0x3a3034, { roughness: 0.3, metalness: 0.18 });
    world.mats.softball = mat(0xf0e0c0, { roughness: 0.78 });
    world.mats.stitch = mat(0xb02030, { roughness: 0.5 });
    world.mats.shadow = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    world.mats.glow = new THREE.MeshBasicMaterial({ color: 0xffe6a6 });
    world.mats.glue = mat(0xd4a45a, { roughness: 0.4, transparent: true, opacity: 0.7, emissive: 0x6a4010, emissiveIntensity: 0.25 });
  }

  function bottleGeo() {
    if (world.geo.bottle) return world.geo.bottle;
    const pts = [
      new THREE.Vector2(0.001, 0),
      new THREE.Vector2(0.064, 0.0),
      new THREE.Vector2(0.07, 0.022),
      new THREE.Vector2(0.062, 0.13),
      new THREE.Vector2(0.056, 0.22),
      new THREE.Vector2(0.034, 0.27),
      new THREE.Vector2(0.024, 0.318),
      new THREE.Vector2(0.03, 0.35),
      new THREE.Vector2(0.001, 0.36),
    ];
    world.geo.bottle = new THREE.LatheGeometry(pts, 14);
    return world.geo.bottle;
  }

  function buildTent() {
    const { scene } = world;
    const hem = new THREE.HemisphereLight(0xffd8b0, 0x1a080c, 0.55);
    scene.add(hem);
    const dir = new THREE.DirectionalLight(0xffe2c0, 0.55);
    dir.position.set(2.2, 5.4, 3.2);
    scene.add(dir);
    const spot = new THREE.SpotLight(0xffe6c4, 2.4, 14, 0.55, 0.45, 1.1);
    spot.position.set(0, 4.2, 1.4);
    spot.target.position.set(0, TABLE_Y, world.crateZ);
    scene.add(spot);
    scene.add(spot.target);
    world.spot = spot;

    const lanternA = new THREE.PointLight(0xffb060, 1.15, 7, 1.6);
    lanternA.position.set(-1.8, 2.4, 0.4);
    scene.add(lanternA);
    const lanternB = new THREE.PointLight(0xff8860, 0.85, 6, 1.6);
    lanternB.position.set(1.9, 2.2, -0.6);
    scene.add(lanternB);
    world.lanterns = [lanternA, lanternB];

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), world.mats.floor);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const walls = [
      { pos: [0, 1.7, -4.2], rot: [0, 0, 0], scale: [9.2, 3.6, 1] },
      { pos: [-4.5, 1.7, 0], rot: [0, Math.PI / 2, 0], scale: [8.6, 3.6, 1] },
      { pos: [4.5, 1.7, 0], rot: [0, -Math.PI / 2, 0], scale: [8.6, 3.6, 1] },
    ];
    walls.forEach((w) => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), world.mats.canvas);
      p.position.set(w.pos[0], w.pos[1], w.pos[2]);
      p.rotation.set(w.rot[0], w.rot[1], w.rot[2]);
      p.scale.set(w.scale[0], w.scale[1], w.scale[2]);
      scene.add(p);
    });

    const roof = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 9.2), world.mats.canvas);
    roof.position.set(0, 3.55, -0.3);
    roof.rotation.x = Math.PI / 2;
    scene.add(roof);
    const peakL = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 4.2), world.mats.canvas);
    peakL.position.set(-1.8, 3.85, -1.4);
    peakL.rotation.set(0.38, 0, 0.48);
    scene.add(peakL);
    const peakR = peakL.clone();
    peakR.position.set(1.8, 3.85, -1.4);
    peakR.rotation.set(0.38, 0, -0.48);
    scene.add(peakR);

    [-3.8, 3.8].forEach((x) => {
      [-3.4, 2.6].forEach((z) => {
        scene.add(meshCyl(world.mats.pole, 0.07, 0.08, 3.4, x, 1.7, z));
      });
    });

    const counter = meshBox(world.mats.wood, 3.4, 0.72, 0.55, 0, 0.36, 2.08);
    scene.add(counter);
    scene.add(meshBox(world.mats.brass, 3.42, 0.03, 0.56, 0, 0.73, 2.08));

    const crate = meshBox(world.mats.wood, 1.15, 0.16, 0.52, 0, TABLE_Y - 0.08, world.crateZ);
    scene.add(crate);
    world.crate = crate;
    const crate2 = meshBox(world.mats.wood, 0.62, 0.16, 0.46, 0.72, TABLE_Y - 0.08, world.crateZ);
    crate2.visible = false;
    scene.add(crate2);
    world.crate2 = crate2;

    const aisle = meshBox(mat(0x1a0c10, { roughness: 0.9 }), 0.42, 0.02, 0.7, 0, 0.02, world.crateZ);
    aisle.visible = false;
    scene.add(aisle);
    world.aisleMark = aisle;

    const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.52), new THREE.MeshBasicMaterial({
      map: world.tex.banner,
    }));
    banner.position.set(0, 2.55, -3.95);
    scene.add(banner);
    world.banner = banner;

    const chalk = canvasTex(512, 320, (ctx) => {
      ctx.fillStyle = "#1b3a28";
      ctx.fillRect(0, 0, 512, 320);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, 492, 300);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "bold 32px Georgia, serif";
      ctx.fillText("HOUSE RULES", 36, 64);
      ctx.font = "22px Georgia, serif";
      ctx.fillStyle = "#e8f0d8";
      ["Three throws a pyramid.", "Heels are lead. Cream lies.", "Glue wants a second kiss.", "Wind will steal a lazy toss.", "Knock every bottle. No almost."].forEach((line, i) => {
        ctx.fillText(line, 36, 112 + i * 36);
      });
    });
    chalk.wrapS = chalk.wrapT = THREE.ClampToEdgeWrapping;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.96), new THREE.MeshBasicMaterial({ map: chalk }));
    board.position.set(-3.95, 1.55, -1.1);
    board.rotation.y = Math.PI / 2;
    scene.add(board);

    const prizeMat = mat(0xc45a3a, { roughness: 0.6 });
    const shelf = meshBox(world.mats.wood, 2.2, 0.08, 0.28, 2.9, 1.55, -3.7);
    scene.add(shelf);
    [-0.7, 0, 0.7].forEach((x, i) => {
      const bear = new THREE.Group();
      bear.add(meshSphere(prizeMat, 0.09, 0, 0.16, 0));
      bear.add(meshSphere(prizeMat, 0.07, 0, 0.28, 0.02));
      bear.add(meshSphere(mat(GOLD), 0.03, 0, 0.22, 0.08));
      bear.position.set(2.9 + x, 1.59, -3.7);
      bear.rotation.y = i * 0.3;
      scene.add(bear);
    });

    const basket = meshCyl(mat(0x4a3020), 0.22, 0.18, 0.16, -0.95, 0.86, 1.88);
    scene.add(basket);
    for (let i = 0; i < 4; i += 1) {
      const b = makeSoftball();
      b.position.set(-0.95 + (i % 2) * 0.1 - 0.05, 0.94 + (i > 1 ? 0.07 : 0), 1.88 + (i % 3) * 0.04);
      scene.add(b);
    }

    const colors = [0xc4303a, 0xf0d09a, 0x2a6b3c, 0x3a6aaa];
    for (let i = 0; i < 14; i += 1) {
      const flag = meshBox(mat(colors[i % colors.length]), 0.16, 0.2, 0.01, -2.2 + i * 0.34, 2.85, -3.6);
      flag.rotation.x = 0.2;
      scene.add(flag);
    }

    for (let i = 0; i < 12; i += 1) {
      const bulb = meshSphere(world.mats.glow, 0.035, -2.4 + i * 0.44, 3.05, -2.2 + (i % 3) * 0.4);
      scene.add(bulb);
      world.stringLights.push(bulb);
    }

    const fan = new THREE.Group();
    fan.position.set(-2.6, 1.55, -1.2);
    const hub = meshCyl(world.mats.lead, 0.05, 0.05, 0.08, 0, 0, 0);
    hub.rotation.z = Math.PI / 2;
    fan.add(hub);
    for (let i = 0; i < 4; i += 1) {
      const blade = meshBox(mat(0xc8d0d8, { metalness: 0.4, roughness: 0.35 }), 0.08, 0.42, 0.01, 0, 0.18, 0);
      blade.rotation.z = (i * Math.PI) / 2;
      fan.add(blade);
    }
    fan.visible = false;
    scene.add(fan);
    world.fan = fan;

    for (let i = 0; i < 3; i += 1) {
      const flap = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.6), world.mats.canvas);
      flap.position.set(3.9, 1.4, -0.4 + i * 0.7);
      flap.rotation.y = -Math.PI / 2;
      scene.add(flap);
      world.flaps.push(flap);
    }

    world.gluePool = meshCyl(world.mats.glue, 0.09, 0.11, 0.02, 0, TABLE_Y + 0.01, world.crateZ);
    world.gluePool.visible = false;
    scene.add(world.gluePool);

    world.nailRing = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 16), world.mats.lead);
    world.nailRing.rotation.x = Math.PI / 2;
    world.nailRing.visible = false;
    scene.add(world.nailRing);

    const night = new THREE.Mesh(
      new THREE.SphereGeometry(18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x14081c, side: THREE.BackSide })
    );
    night.position.y = -0.2;
    scene.add(night);
  }

  function makeSoftball() {
    const g = new THREE.Group();
    g.add(meshSphere(world.mats.softball, BALL_R, 0, 0, 0));
    const stitch = new THREE.Mesh(new THREE.TorusGeometry(BALL_R * 0.72, 0.004, 6, 16), world.mats.stitch);
    stitch.rotation.y = 0.6;
    g.add(stitch);
    return g;
  }

  function makeBottleMesh(opts) {
    const g = new THREE.Group();
    const heavy = !!opts.heavy;
    const bodyMat = opts.stuck ? world.mats.darkGlass : (heavy ? world.mats.leadGlass : world.mats.glass);
    const body = new THREE.Mesh(bottleGeo(), bodyMat);
    g.add(body);
    const fill = meshCyl(
      heavy ? world.mats.leadFill : world.mats.milk,
      heavy ? 0.054 : 0.05,
      heavy ? 0.06 : 0.054,
      heavy ? 0.14 : 0.2,
      0,
      heavy ? 0.08 : 0.12,
      0
    );
    g.add(fill);
    const cap = meshCyl(heavy ? world.mats.lead : world.mats.cap, 0.03, 0.03, 0.034, 0, 0.35, 0);
    g.add(cap);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.1), new THREE.MeshBasicMaterial({
      map: heavy ? world.tex.leadLabel : world.tex.creamLabel,
    }));
    label.position.set(0, heavy ? 0.2 : 0.16, 0.062);
    g.add(label);
    if (heavy) {
      const slug = meshCyl(world.mats.leadSlug, 0.074, 0.076, 0.09, 0, 0.045, 0);
      g.add(slug);
      const belt = meshCyl(world.mats.lead, 0.078, 0.078, 0.028, 0, 0.09, 0);
      g.add(belt);
      g.userData.slug = slug;
    }
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(heavy ? 0.09 : 0.068, 12), world.mats.shadow);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.002;
    g.add(shadow);
    g.userData.shadow = shadow;
    g.userData.body = body;
    g.userData.heavy = heavy;
    return g;
  }

  function buildAura() {
    const g = new THREE.Group();
    const skin = mat(SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const blouse = mat(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.2 });
    const dress = mat(DRESS, { emissive: 0x0a2010, emissiveIntensity: 0.25 });
    const hairM = mat(HAIR, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });
    const gold = mat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const heartM = mat(HEART, { emissive: HEART, emissiveIntensity: 0.65, roughness: 0.4 });
    const shoeM = mat(0x111111, { roughness: 0.35, metalness: 0.15 });

    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(meshCyl(blouse, 0.13, 0.16, 0.28, 0, 0.28, 0));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.32, 12), dress);
    skirt.position.y = 0.06;
    hip.add(skirt);
    const heart = meshBox(heartM, 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    heart.rotation.z = Math.PI / 4;
    hip.add(heart);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 16), blouse);
    collar.position.y = 0.44;
    collar.rotation.x = Math.PI / 2;
    hip.add(collar);

    const head = new THREE.Group();
    head.position.y = 0.58;
    hip.add(head);
    head.add(meshSphere(skin, 0.175, 0, 0.02, 0));
    const eyeW = mat(0xf7f2ea);
    const eyeD = mat(0x2a1810);
    [-1, 1].forEach((side) => {
      const white = meshSphere(eyeW, 0.038, side * 0.055, 0.03, 0.15);
      white.scale.set(0.038, 0.044, 0.02);
      head.add(white);
      head.add(meshSphere(eyeD, 0.02, side * 0.055, 0.03, 0.168));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), mat(0xc45a6a));
    smile.position.set(0, -0.05, 0.16);
    smile.rotation.x = 2.6;
    head.add(smile);
    head.add(meshSphere(hairM, 0.188, 0, 0.07, -0.08));
    [-1, 1].forEach((side) => {
      head.add(meshSphere(hairM, 0.1, side * 0.19, -0.05, 0.02));
      head.add(meshSphere(heartM, 0.042, side * 0.19, 0.05, 0.05));
    });
    head.add(meshBox(hairM, 0.26, 0.06, 0.08, 0, 0.15, 0.12));
    const crown = new THREE.Group();
    crown.position.y = 0.24;
    head.add(crown);
    crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold));
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      const spike = new THREE.Mesh(world.geo.cone, gold);
      spike.scale.set(0.035, h, 0.035);
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
      const bone = meshCyl(arm ? skin : dress, arm ? 0.035 : 0.042, arm ? 0.035 : 0.042, len, 0, -len / 2, 0);
      pivot.add(bone);
      if (!arm) pivot.add(meshBox(shoeM, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03));
      else pivot.add(meshSphere(skin, 0.04, 0, -len, 0));
      hip.add(pivot);
      return pivot;
    }
    const armL = limb(-1, true);
    const armR = limb(1, true);
    const legL = limb(-1, false);
    const legR = limb(1, false);

    g.position.set(1.05, 0, 0.15);
    g.rotation.y = 0.18;
    g.scale.setScalar(1.18);
    g.userData = { hip, head, armL, armR, legL, legR, t: 0, mood: "wave" };
    world.scene.add(g);
    world.aura = g;
  }

  function buildHand() {
    const ball = makeSoftball();
    world.scene.add(ball);
    world.handBall = ball;
    const sling = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 1, 6),
      new THREE.MeshBasicMaterial({ color: 0xc4303a })
    );
    sling.visible = false;
    world.scene.add(sling);
    world.sling = sling;
  }

  function buildTrajectory() {
    const m = new THREE.MeshBasicMaterial({ color: 0xffe6a6, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 14; i += 1) {
      const d = meshSphere(m, 0.018 - i * 0.0008, 0, 0, 0);
      d.visible = false;
      world.scene.add(d);
      world.traj.push(d);
    }
  }

  function buildStamp() {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 512, 256);
    ctx.strokeStyle = "rgba(196,30,58,0.95)";
    ctx.lineWidth = 14;
    ctx.strokeRect(28, 28, 456, 200);
    ctx.fillStyle = "rgba(196,30,58,0.18)";
    ctx.fillRect(28, 28, 456, 200);
    ctx.fillStyle = "rgba(196,30,58,0.96)";
    ctx.font = "bold 92px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("LEAD", 256, 160);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.55), new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
    }));
    mesh.visible = false;
    world.scene.add(mesh);
    world.stamp = mesh;
  }

  function setRoomDress(spec) {
    if (!world) return;
    const split = spec && spec.kind === "splitStack";
    const wind = spec && (spec.kind === "windShelf" || (spec.coda && spec.windDrift));
    const wide = spec && spec.kind === "wideShoulders";
    world.crate.scale.set(split ? 0.55 : wide ? 1.55 : 1, 1, 1);
    world.crate.position.set(split ? -0.72 : 0, TABLE_Y - 0.08, world.crateZ);
    world.crate2.visible = !!split;
    world.crate2.position.set(0.72, TABLE_Y - 0.08, world.crateZ);
    world.aisleMark.visible = !!split;
    if (world.fan) world.fan.visible = !!wind;
    const col = spec && spec.coda ? 0xff6688 : spec && spec.kind === "stuckPin" ? 0xffc0a0 : 0xffe6c4;
    if (world.spot) world.spot.color.setHex(col);
    paintBanner(spec);
  }

  function paintBanner(spec) {
    if (!world || !world.tex.bannerCanvas) return;
    const ctx = world.tex.bannerCanvas.getContext("2d");
    ctx.fillStyle = spec && spec.coda ? "#4a1020" : "#5a1830";
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 500, 116);
    ctx.fillStyle = "#ffe6a6";
    ctx.font = "bold 36px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText((spec && spec.name || "WEIGHTED BOTTLES").toUpperCase(), 256, 58);
    ctx.font = "20px Georgia, serif";
    ctx.fillStyle = "#e8c48a";
    ctx.fillText(roomTell(spec), 256, 96);
    if (world.tex.banner) world.tex.banner.needsUpdate = true;
  }

  function clearBottles() {
    if (!world) return;
    world.bottles.forEach((b) => {
      if (b.mesh && b.mesh.parent) b.mesh.parent.remove(b.mesh);
    });
    world.bottles = [];
    (world.leadTags || []).forEach((t) => {
      if (t.parent) t.parent.remove(t);
    });
    world.leadTags = [];
    if (world.gluePool) world.gluePool.visible = false;
    if (world.nailRing) world.nailRing.visible = false;
  }

  function spawnPyramid(spec, attract) {
    if (!world) return;
    clearBottles();
    const slots = layoutSlots(spec);
    let bottomRow = 0;
    slots.forEach((s) => { if (s.row > bottomRow) bottomRow = s.row; });
    const bottomSlots = slots.filter((s) => s.row === bottomRow);
    let gluePick = null;
    if (spec.glueBottomCorner && bottomSlots.length) {
      gluePick = bottomSlots[0];
      bottomSlots.forEach((s) => { if (s.col < gluePick.col) gluePick = s; });
    }
    let stuckSlot = -1;
    if (spec.stuckBottle) {
      const midTop = [];
      slots.forEach((s, i) => { if (s.row !== bottomRow) midTop.push(i); });
      stuckSlot = midTop.length ? midTop[(Math.random() * midTop.length) | 0] : 0;
    }
    const gap = spec.gap || 0.13;
    const rise = spec.rise || 0.275;
    slots.forEach((s, i) => {
      const heavy = s.row === bottomRow;
      const glued = !!(gluePick && s === gluePick);
      const stuck = i === stuckSlot;
      let mass = spec.topMass;
      if (s.row > 0 && s.row < bottomRow) mass = spec.midMass;
      if (heavy) mass = spec.bottomMass;
      if (stuck) mass += 0.85;
      const x = s.col * gap;
      const y = TABLE_Y + (bottomRow - s.row) * rise;
      const z = world.crateZ + (s.stack ? 0 : 0) + (s.row - bottomRow) * 0.01;
      const mesh = makeBottleMesh({ heavy, stuck });
      mesh.position.set(x, attract ? y + 0.35 : y, z);
      world.scene.add(mesh);
      const body = {
        mesh,
        x, y, z,
        homeX: x, homeY: y, homeZ: z,
        vx: 0, vy: 0, vz: 0,
        tiltX: 0, tiltZ: 0, avx: 0, avz: 0, spinY: 0,
        mass, r: BOTTLE_R, h: BOTTLE_H,
        com: heavy ? 0.05 : 0.17,
        seated: true,
        fallen: false,
        glued, stuck, heavy,
        hits: 0,
        needHits: (glued || stuck) ? 2 : 1,
        row: s.row,
        stack: s.stack || 0,
        bottomRow,
        wobble: 0,
        flash: 0,
        spawn: attract ? 0.35 + i * 0.04 : 0,
      };
      world.bottles.push(body);
      if (heavy) {
        const tag = new THREE.Mesh(
          new THREE.PlaneGeometry(0.11, 0.028),
          new THREE.MeshBasicMaterial({ map: world.tex.leadTag })
        );
        tag.position.set(x, TABLE_Y + 0.014, z + 0.09);
        tag.rotation.x = -0.55;
        world.scene.add(tag);
        world.leadTags.push(tag);
      }
      if (glued && world.gluePool) {
        world.gluePool.visible = true;
        world.gluePool.position.set(x, TABLE_Y + 0.012, z);
      }
      if (stuck && world.nailRing) {
        world.nailRing.visible = true;
        world.nailRing.position.set(x, y + 0.04, z);
      }
    });
  }

  function bottles() {
    return world ? world.bottles : [];
  }

  function standingCount(list) {
    return list.reduce((n, b) => n + (b.fallen ? 0 : 1), 0);
  }

  function hasSupport(b, list) {
    if (b.row === b.bottomRow) return true;
    const reach = ((run && run.spec && run.spec.gap) || 0.13) * 1.15;
    for (let i = 0; i < list.length; i += 1) {
      const o = list[i];
      if (o === b || o.fallen || !o.seated) continue;
      if ((o.stack || 0) !== (b.stack || 0)) continue;
      if (o.row === b.row + 1 && Math.hypot(o.x - b.x, o.z - b.z) < reach) return true;
    }
    return false;
  }

  function markFallen(b) {
    if (b.fallen) return;
    b.fallen = true;
    b.seated = false;
    b.flash = 0.28;
    if (run && !run.done) {
      run.knocked += 1;
      run.score += Math.round(16 * b.mass + (b.heavy ? 24 : 10));
      saveLiveDepth();
    }
    juiceKnock(b, b.heavy ? "leadDown" : "cream");
    sfx(b.heavy ? "pit" : "spit");
  }

  function burst(x, y, z, color, n, opt) {
    if (!world) return;
    const o = opt || {};
    const useSphere = !!o.sphere;
    const m = mat(color, { roughness: 0.35, emissive: color, emissiveIntensity: 0.55 });
    const spread = o.spread || 2.4;
    const up = o.up || 2.2;
    for (let i = 0; i < n; i += 1) {
      const p = useSphere
        ? meshSphere(m, 0.018 + Math.random() * 0.012, x, y, z)
        : meshBox(m, 0.028, 0.028, 0.028, x, y, z);
      world.scene.add(p);
      world.particles.push({
        mesh: p,
        vx: (Math.random() - 0.5) * spread,
        vy: 1.1 + Math.random() * up,
        vz: (Math.random() - 0.5) * spread,
        life: 0.5 + Math.random() * 0.45,
      });
    }
  }

  function juiceKnock(b, kind) {
    if (!world) return;
    const x = b.x, y = b.y + 0.16, z = b.z;
    if (kind === "cream") {
      burst(x, y, z, 0xf7f2e6, 16, { sphere: true, spread: 3.1, up: 3.2 });
      burst(x, y + 0.08, z, 0xffe6a6, 6, { sphere: true, spread: 2.2, up: 2.4 });
      world.cam.shake = Math.max(world.cam.shake || 0, 0.16);
      world.cam.punch = Math.max(world.cam.punch || 0, 0.12);
    } else if (kind === "leadThud") {
      burst(x, y * 0.4 + TABLE_Y, z, 0x9aa0a8, 7, { spread: 1.6, up: 1.1 });
      world.cam.shake = Math.max(world.cam.shake || 0, 0.1);
    } else {
      burst(x, y, z, 0x9aa0a8, 14, { spread: 2.8, up: 2.0 });
      burst(x, y, z, 0xd4a45a, 5, { spread: 1.8, up: 1.6 });
      world.cam.shake = Math.max(world.cam.shake || 0, 0.28);
      world.cam.punch = Math.max(world.cam.punch || 0, 0.18);
    }
    if (b.mesh) b.mesh.scale.setScalar(1.12);
  }

  function confetti() {
    burst(0, 1.6, world.crateZ, 0xe8b84a, 10);
    burst(-0.3, 1.4, world.crateZ, 0xd22b3a, 8);
    burst(0.3, 1.5, world.crateZ, 0x1e6b3c, 8);
  }

  function windGust(t) {
    const spec = run && run.spec;
    const drift = spec && spec.windDrift;
    if (!drift) return 0;
    const wave = Math.sin(t * 1.7) * 0.55 + Math.sin(t * 4.1) * 0.25;
    return drift * (wave > 0.2 ? 1.35 : 0.45);
  }

  function throwOrigin() {
    return { x: 0, y: 1.18, z: 1.92 };
  }

  function aimVelocity(aim) {
    const power = aim.power;
    const yaw = aim.yaw;
    const pitch = aim.pitch;
    const speed = 6.4 + power * 7.8;
    return {
      vx: Math.sin(yaw) * Math.cos(pitch) * speed,
      vy: Math.sin(pitch) * speed + 0.35,
      vz: -Math.cos(yaw) * Math.cos(pitch) * speed,
    };
  }

  function predict(aim) {
    const o = throwOrigin();
    const v = aimVelocity(aim);
    const pts = [];
    let x = o.x, y = o.y, z = o.z;
    let vx = v.vx, vy = v.vy, vz = v.vz;
    const dt = 0.032;
    const t0 = world ? world.time : 0;
    for (let i = 0; i < 28; i += 1) {
      vy -= GRAVITY * dt;
      vx += windGust(t0 + i * dt) * dt;
      vx *= 0.997;
      vz *= 0.997;
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      pts.push({ x, y, z });
      if (y < 0.05 || z < -4.4) break;
    }
    return pts;
  }

  function showTraj(aim) {
    if (!world) return;
    const pts = predict(aim);
    world.traj.forEach((d, i) => {
      if (pts[i]) {
        d.visible = true;
        d.position.set(pts[i].x, pts[i].y, pts[i].z);
        d.material.opacity = 0.75 - i * 0.04;
      } else d.visible = false;
    });
  }

  function hideTraj() {
    if (!world) return;
    world.traj.forEach((d) => { d.visible = false; });
  }

  function launchBall(aim) {
    if (!world || !run || run.ball) return;
    const o = throwOrigin();
    const v = aimVelocity(aim);
    const mesh = makeSoftball();
    mesh.position.set(o.x, o.y, o.z);
    world.scene.add(mesh);
    run.ball = {
      mesh,
      x: o.x, y: o.y, z: o.z,
      vx: v.vx, vy: v.vy, vz: v.vz,
      r: BALL_R,
      mass: 0.2,
      life: 0,
      dead: false,
    };
    run.balls -= 1;
    run.settle = 0.55;
    paintHud(run.spec);
    hideTraj();
    setPower(0, false);
    if (world.sling) world.sling.visible = false;
    if (world.handBall) world.handBall.visible = false;
    setTaught(true);
    sfx("throw");
    world.cam.shake = 0.08;
    world.cam.mode = "throw";
  }

  function killBall() {
    if (!run || !run.ball) return;
    const b = run.ball;
    if (b.mesh && b.mesh.parent) b.mesh.parent.remove(b.mesh);
    run.ball = null;
    if (world && world.handBall && run.balls > 0) world.handBall.visible = true;
    world.cam.mode = isLive() ? "play" : world.cam.mode;
  }

  function hitBottle(ball, b) {
    const cx = b.x;
    const cy = b.y + b.h * 0.42;
    const cz = b.z;
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const dz = ball.z - cz;
    const dist = Math.hypot(dx, dy, dz);
    const min = ball.r + b.r + 0.01;
    if (dist >= min || dist < 1e-4) return false;
    const nx = dx / dist, ny = dy / dist, nz = dz / dist;
    const rel = ball.vx * nx + ball.vy * ny + ball.vz * nz;
    if (rel > 0) return false;
    const inv = 1 / ball.mass + 1 / b.mass;
    const j = -(1.18) * rel / inv;
    ball.vx += (j / ball.mass) * nx;
    ball.vy += (j / ball.mass) * ny;
    ball.vz += (j / ball.mass) * nz;
    let impulse = j * 0.9;
    b.hits += 1;
    b.flash = 0.22;
    const locked = (b.glued || b.stuck) && b.hits < b.needHits && impulse < (b.stuck ? 0.72 : 0.55);
    const leadNeed = b.heavy ? 0.48 : 0.07;
    if (locked || (b.heavy && impulse < leadNeed)) {
      b.wobble = b.heavy ? 0.08 : 0.35;
      b.tiltX += (Math.random() - 0.5) * (b.heavy ? 0.03 : 0.08);
      b.tiltZ += (Math.random() - 0.5) * (b.heavy ? 0.03 : 0.08);
      ball.vx = -ball.vx * (b.heavy ? 0.62 : 0.28) + nx * 0.4;
      ball.vy *= 0.45;
      ball.vz = -ball.vz * (b.heavy ? 0.55 : 0.25);
      juiceKnock(b, b.heavy ? "leadThud" : "cream");
      sfx(b.heavy ? "miss" : "bumper");
      if (b.heavy) setStatus("Lead laughed. Cream flies — heels don't.");
      if (b.glued && b.hits < b.needHits) setStatus("Glue held. One more on the heel.");
      if (b.stuck && b.hits < b.needHits) setStatus("Stuck pin laughed. Scout it, then strike.");
      return true;
    }
    if (!b.heavy) impulse *= 1.65;
    b.seated = false;
    b.wobble = 0.7;
    const fly = b.heavy ? 1.35 : 3.15;
    b.vx -= (impulse / b.mass) * nx * fly;
    b.vy -= (impulse / b.mass) * ny * (b.heavy ? 1.1 : 2.4);
    b.vz -= (impulse / b.mass) * nz * fly;
    if (!b.heavy) b.vy += 1.15;
    const hitH = (ball.y - (b.y + b.com));
    const tip = b.heavy ? 7 : 22;
    b.avx += nz * impulse * hitH * tip / b.mass;
    b.avz -= nx * impulse * hitH * tip / b.mass;
    b.spinY += (Math.random() - 0.5) * (b.heavy ? 3 : 9);
    if (b.glued && world.gluePool) world.gluePool.visible = false;
    if (b.stuck && world.nailRing) world.nailRing.visible = false;
    sfx(b.heavy ? "shove" : "bumper");
    juiceKnock(b, b.heavy ? "leadDown" : "cream");
    return true;
  }

  function collideBottles(list, dt) {
    for (let i = 0; i < list.length; i += 1) {
      const a = list[i];
      if (a.fallen && a.y < 0.2) continue;
      for (let k = i + 1; k < list.length; k += 1) {
        const b = list[k];
        const dx = b.x - a.x;
        const dy = (b.y + b.h * 0.4) - (a.y + a.h * 0.4);
        const dz = b.z - a.z;
        const dist = Math.hypot(dx, dy, dz);
        const min = a.r + b.r;
        if (dist >= min || dist < 1e-4) continue;
        const nx = dx / dist, ny = dy / dist, nz = dz / dist;
        const overlap = min - dist;
        const slop = overlap * 0.5;
        if (!a.seated) { a.x -= nx * slop; a.y -= ny * slop; a.z -= nz * slop; }
        if (!b.seated) { b.x += nx * slop; b.y += ny * slop; b.z += nz * slop; }
        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny + (b.vz - a.vz) * nz;
        if (rel > 0) continue;
        const j = -rel * 0.7;
        const ma = 1 / a.mass, mb = 1 / b.mass;
        a.vx -= nx * j * ma; a.vy -= ny * j * ma; a.vz -= nz * j * ma;
        b.vx += nx * j * mb; b.vy += ny * j * mb; b.vz += nz * j * mb;
        if (a.seated && !b.seated) {
          const need = a.heavy ? 0.62 : 0.1;
          if (j > need && !((a.glued || a.stuck) && a.hits < a.needHits) && !(a.heavy && !b.heavy)) {
            a.seated = false;
          }
        }
        if (b.seated && !a.seated) {
          const need = b.heavy ? 0.62 : 0.1;
          if (j > need && !((b.glued || b.stuck) && b.hits < b.needHits) && !(b.heavy && !a.heavy)) {
            b.seated = false;
          }
        }
      }
    }
  }

  function stepPhysics(dt) {
    if (!world) return;
    const list = bottles();
    const ball = run && run.ball;
    if (ball && !ball.dead) {
      ball.life += dt;
      ball.vy -= GRAVITY * dt;
      ball.vx += windGust(world.time) * dt;
      ball.vx *= 0.996;
      ball.vz *= 0.996;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.z += ball.vz * dt;
      if (ball.y < ball.r) {
        ball.y = ball.r;
        ball.vy *= -0.28;
        ball.vx *= 0.72;
        ball.vz *= 0.72;
        sfx("drop");
      }
      const crateHalf = (run.spec && run.spec.kind === "wideShoulders") ? 0.9 : 0.58;
      if (ball.y < TABLE_Y + ball.r + 0.02 && ball.y > TABLE_Y - 0.05
        && Math.abs(ball.x) < crateHalf + (run.spec && run.spec.kind === "splitStack" ? 1.1 : 0)
        && Math.abs(ball.z - world.crateZ) < 0.3) {
        ball.y = TABLE_Y + ball.r + 0.01;
        ball.vy *= -0.22;
        ball.vx *= 0.8;
        ball.vz *= 0.8;
      }
      list.forEach((b) => { if (!b.fallen || b.y > TABLE_Y - 0.2) hitBottle(ball, b); });
      ball.mesh.position.set(ball.x, ball.y, ball.z);
      ball.mesh.rotation.x += dt * 8;
      const slow = Math.hypot(ball.vx, ball.vy, ball.vz) < 0.55 && ball.life > 0.7;
      if (ball.y < 0.04 || ball.z < -5 || ball.z > 4.8 || Math.abs(ball.x) > 5 || ball.life > 2.9 || slow) {
        killBall();
      }
    }

    list.forEach((b) => {
      if (b.spawn > 0) {
        b.spawn = Math.max(0, b.spawn - dt);
        const t = 1 - b.spawn / 0.4;
        b.mesh.position.set(b.x, lerp(b.homeY + 0.35, b.homeY, clamp(t, 0, 1)), b.z);
        return;
      }
      if (b.flash > 0) b.flash -= dt;
      if (b.fallen || !b.seated) {
        /* falling */
      } else if (!((b.glued || b.stuck) && b.hits < b.needHits) && !hasSupport(b, list)) {
        b.seated = false;
        b.vy += 0.4;
        b.vx += (b.x < 0 ? -0.35 : 0.35);
      }
      if (b.seated && !b.fallen) {
        const idle = !b.heavy;
        b.wobble *= 0.92;
        const w = idle
          ? Math.sin(world.time * 2.6 + b.x * 8) * 0.095
          : (b.heavy ? 0 : b.wobble * Math.sin(world.time * 18) * 0.06);
        b.mesh.position.set(b.x, b.y, b.z);
        b.mesh.rotation.set(w, 0, -w * 0.65);
        if (b.mesh.scale.x > 1.002) {
          const s = lerp(b.mesh.scale.x, 1, 0.2);
          b.mesh.scale.setScalar(s);
        }
        if (b.stuck && world.nailRing && world.nailRing.visible) {
          world.nailRing.position.set(b.x, b.y + 0.04, b.z);
        }
        return;
      }
      if (!b.fallen) {
        b.avx += 1.1 * dt * (b.tiltX || (b.vx >= 0 ? 1 : -1));
        b.avz += 0.9 * dt * (b.tiltZ || (b.vz >= 0 ? 1 : -1));
      }
      b.vy -= GRAVITY * dt * 0.92;
      b.vx *= 0.985;
      b.vz *= 0.985;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.avx *= 0.992;
      b.avz *= 0.992;
      b.tiltX += b.avx * dt;
      b.tiltZ += b.avz * dt;
      const tilt = Math.hypot(b.tiltX, b.tiltZ);
      if (tilt > 0.55) {
        const extra = (tilt - 0.55) * 2.8 * dt;
        b.tiltX += Math.sign(b.tiltX || 1) * extra;
        b.tiltZ += Math.sign(b.tiltZ || 1) * extra;
      }
      if (b.y < 0.02) {
        b.y = 0.02;
        b.vy *= -0.15;
        b.vx *= 0.8;
        b.vz *= 0.8;
      }
      if (b.y < TABLE_Y + 0.02 && Math.abs(b.z - world.crateZ) < 0.32 && Math.abs(b.x) < 1.2 && b.vy < 0) {
        b.y = TABLE_Y + 0.01;
        b.vy *= -0.08;
        b.vx *= 0.84;
        b.vz *= 0.84;
        if (Math.abs(b.vx) < 0.4) b.vx += (b.x < 0 ? -0.55 : 0.55);
      }
      b.mesh.position.set(b.x, b.y, b.z);
      b.mesh.rotation.set(b.tiltX, b.spinY * 0.2, b.tiltZ);
      if (b.mesh.scale.x > 1.002) {
        b.mesh.scale.setScalar(lerp(b.mesh.scale.x, 1, 0.18));
      }
      if (!b.fallen && (tilt > 0.85 || b.y < 0.16 || Math.hypot(b.x - b.homeX, b.z - b.homeZ) > 0.2)) {
        markFallen(b);
      }
    });
    collideBottles(list, dt);

    for (let i = world.particles.length - 1; i >= 0; i -= 1) {
      const p = world.particles[i];
      p.life -= dt;
      p.vy -= 9 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += dt * 6;
      if (p.life <= 0) {
        if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
        world.particles.splice(i, 1);
      }
    }
  }

  function animateAura(dt) {
    const a = world && world.aura;
    if (!a) return;
    const u = a.userData;
    u.t += dt * (u.mood === "cheer" ? 7 : 2.6);
    const bob = Math.sin(u.t) * 0.012;
    u.hip.position.y = 0.42 + bob;
    if (u.mood === "cheer") {
      u.armL.rotation.z = 0.9 + Math.sin(u.t * 2.2) * 0.35;
      u.armR.rotation.z = -0.9 + Math.sin(u.t * 2.2 + 1) * 0.35;
      u.armL.rotation.x = -0.4;
      u.armR.rotation.x = -0.4;
    } else if (u.mood === "laugh") {
      u.head.rotation.z = Math.sin(u.t * 3) * 0.12;
      u.armL.rotation.z = 0.2;
      u.armR.rotation.z = -0.15;
    } else {
      u.armR.rotation.z = -0.85 + Math.sin(u.t * 2.4) * 0.4;
      u.armR.rotation.x = -0.15;
      u.armL.rotation.z = 0.12;
      u.head.rotation.z = 0;
    }
  }

  function updateCamera(dt) {
    const cam = world.cam;
    const camera = world.camera;
    cam.t += dt;
    let x = 0, y = 1.42, z = 2.72;
    let lx = 0, ly = 0.9, lz = world.crateZ + 0.12;
    if (cam.mode === "enter") {
      const t = clamp(cam.t / 1.35, 0, 1);
      const e = 1 - Math.pow(1 - t, 3);
      x = lerp(0, 0, e);
      y = lerp(1.22, 1.42, e);
      z = lerp(4.8, 2.72, e);
      if (t >= 1) cam.mode = isLive() ? "play" : "idle";
    } else if (cam.mode === "idle") {
      const sw = world.reduced ? 0 : Math.sin(cam.t * 0.32) * 0.32;
      x = sw;
      z = 2.82 + Math.cos(cam.t * 0.26) * 0.14;
      y = 1.4 + Math.sin(cam.t * 0.4) * 0.03;
    } else if (cam.mode === "aim" && run && run.aim) {
      x = run.aim.yaw * 0.28;
      y = 1.4 + run.aim.power * 0.06;
      z = 2.78 + run.aim.power * 0.28;
      lx = Math.sin(run.aim.yaw) * 0.45;
      ly = 0.86 + run.aim.pitch * 0.22;
    } else if (cam.mode === "throw" && run && run.ball) {
      x = lerp(camera.position.x, run.ball.x * 0.2, 0.08);
      y = lerp(camera.position.y, 1.32 + run.ball.y * 0.1, 0.08);
      z = lerp(camera.position.z, 2.35, 0.06);
      lx = run.ball.x * 0.3;
      ly = run.ball.y;
      lz = run.ball.z;
    } else if (cam.mode === "clear") {
      x = Math.sin(cam.t * 0.8) * 0.22;
      y = 1.52;
      z = 2.55;
      ly = 1.02;
    } else if (cam.mode === "dead") {
      y = 1.28;
      z = 2.45;
      ly = 0.7;
    } else {
      x = 0;
      y = 1.42;
      z = 2.72;
    }
    if (cam.shake > 0.001) {
      x += (Math.random() - 0.5) * cam.shake;
      y += (Math.random() - 0.5) * cam.shake;
      cam.shake *= 0.86;
    }
    if (cam.punch > 0.001) {
      z -= cam.punch;
      cam.punch *= 0.8;
    }
    camera.position.set(x, y, z);
    camera.lookAt(lx, ly, lz);
    if (world.stamp && world.stamp.visible) {
      world.stamp.position.copy(camera.position);
      world.tmp.set(0, 0, -1.35).applyQuaternion(camera.quaternion);
      world.stamp.position.add(world.tmp);
      world.stamp.quaternion.copy(camera.quaternion);
    }
  }

  function stepGame(dt) {
    if (!run || run.done) return;
    if (run.pause > 0) {
      run.pause -= dt;
      if (run.pause <= 0 && run.pendingNext !== undefined) applyNextPyramid();
      return;
    }
    const list = bottles();
    if (standingCount(list) === 0 && list.length) {
      clearPyramid();
      return;
    }
    if (!run.ball && run.balls <= 0 && !run.aim) {
      const flying = list.some((b) => !b.fallen && !b.seated);
      if (flying) return;
      run.settle -= dt;
      if (run.settle <= 0) finish("throws");
    }
  }

  function clearPyramid() {
    const cleared = run.spec;
    run.pyramids += 1;
    run.score += 400 + 80 * (cleared && cleared.id ? cleared.id : run.pyramids);
    saveLiveDepth();
    if (rk() && typeof rk().reportDepth === "function") {
      const shown = milkLevel(run.pyramids + 1) || cleared;
      rk().reportDepth(run.kitRun, shown ? shown.id : run.pyramids, {
        name: shown && shown.name,
        coda: !!(shown && shown.coda),
      });
    }
    sfx("rack");
    confetti();
    if (world.aura) world.aura.userData.mood = "cheer";
    world.cam.mode = "clear";
    const next = milkLevel(run.pyramids + 1);
    run.pendingNext = next;
    run.pause = 1.05;
    run.ball = null;
    run.aim = null;
    hideTraj();
    if (!next) setStatus(AURA.souvenir);
    else if (next.coda && run.pyramids === AUTHORED_COUNT) setStatus(AURA.coda);
    else setStatus(AURA.clear);
    try { PF.setAura("celebrate"); } catch (_) {}
    PF.refreshDepth();
  }

  function applyNextPyramid() {
    const next = run.pendingNext;
    run.pendingNext = undefined;
    if (!next) {
      setStatus(AURA.souvenir);
      try { PF.setAura("celebrate"); } catch (_) {}
      finish("souvenir");
      return;
    }
    run.spec = next;
    setRoomDress(next);
    spawnPyramid(next, true);
    run.balls = next.throwsPerPyramid;
    run.ball = null;
    run.aim = null;
    run.settle = 0;
    if (world.handBall) world.handBall.visible = true;
    world.cam.mode = "play";
    if (world.aura) world.aura.userData.mood = "wave";
    paintHud(next);
    if (rk() && typeof rk().reportDepth === "function") {
      rk().reportDepth(run.kitRun, next.id, { name: next.name, coda: !!next.coda });
    }
    if (next.coda && run.pyramids === AUTHORED_COUNT) setStatus(AURA.coda);
    else setStatus(`${hudStageLine(next, run.pyramids)} — ${next.barker || AURA.clear}`);
    try { PF.setAura("celebrate"); } catch (_) {}
    PF.refreshDepth();
  }

  function auraLine(reason, pyramids) {
    if (reason === "souvenir") return AURA.souvenir;
    if (pyramids >= 6) return AURA.deep(pyramids);
    if (reason === "incomplete") return AURA.incomplete;
    if (reason === "throws") return AURA.throws;
    const kitRun = rk();
    if (kitRun && typeof kitRun.auraDeathLine === "function") {
      return `Aura: ${kitRun.auraDeathLine(GAME_ID, pyramids, reason)}`;
    }
    return AURA.throws;
  }

  function challengeLine(n) {
    const kitRun = rk();
    if (kitRun && typeof kitRun.challengeText === "function") {
      return kitRun.challengeText("Milk Bottles pyramid", n | 0, GAME_ID);
    }
    return `Beat my Milk Bottles pyramid ${n | 0} on Penny Fever`;
  }

  function revealMilkResult(reason) {
    kit.setMode(card(), "result");
    const n = run ? run.pyramids : 0;
    const score = run ? run.score : 0;
    kit.fillResult({
      root: "milkResult",
      depth: "milkResultDepth",
      score: "milkResultScore",
      aura: "milkResultAura",
    }, {
      depthLine: `PYRAMID ${n}`,
      scoreLine: `SCORE ${score}`,
      auraLine: auraLine(reason, n),
    });
    const ch = $("milkChallengeText");
    if (ch) ch.textContent = challengeLine(n);
    const start = $("milkStart");
    if (start) {
      start.disabled = false;
      start.textContent = "PLAY AGAIN · 1 demo coin";
      start.style.display = "";
    }
    try { PF.refreshNightBoard(); } catch (_) {}
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    hideTraj();
    if (run.ball) killBall();
    const deathReason = reason === "souvenir" ? "souvenir"
      : reason === "incomplete" ? "incomplete" : "throws";
    run.closedStamp = deathReason === "throws";
    if (run.closedStamp) {
      sfx("stamp");
      if (world && world.stamp) world.stamp.visible = true;
      world.cam.mode = "dead";
      if (world.aura) world.aura.userData.mood = "laugh";
      try { PF.setAura("laugh"); } catch (_) {}
    }
    persistDepth({
      depth: run.pyramids,
      score: run.score,
      deathReason,
      cashedOut: deathReason === "souvenir",
      meta: {
        knocked: run.knocked,
        stage: run.spec && run.spec.id,
        room: run.spec && run.spec.name,
        kind: run.spec && run.spec.kind,
        coda: !!(run.spec && run.spec.coda),
      },
    });
    PF.refreshNightBoard();
    if (run.closedStamp) setTimeout(() => revealMilkResult(deathReason), STAMP_MS);
    else revealMilkResult(deathReason);
  }

  function beginKitRun() {
    let feverNode = false;
    if (typeof PF.spendDemoCoin === "function") {
      if (!PF.spendDemoCoin(GAME_ID)) return null;
      feverNode = true;
    }
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      try {
        const ctx = PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1, feverNode });
        if (ctx) return ctx;
      } catch (_) {}
    }
    return {
      gameId: GAME_ID,
      startedAt: Date.now(),
      feverNode,
      depth: 0,
      score: 0,
      strikes: 0,
      alive: true,
    };
  }

  function start() {
    if (run && !run.done) return;
    if (!THREE || !world) {
      setStatus("Lighting the tent…");
      loadThree().then(() => {
        try { ensureWorld(); } catch (err) {
          console.warn("[milk-bottles] boot", err);
        }
        if (!THREE || !world) {
          setStatus("This tent wants a WebGL lantern.");
          return;
        }
        start();
      }).catch((err) => {
        console.warn("[milk-bottles] three", err);
        setStatus("This tent wants a WebGL lantern.");
      });
      return;
    }
    const kitRun = beginKitRun();
    if (!kitRun) {
      setStatus("Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      return;
    }
    ensureWorld();
    const spec = milkLevel(1);
    run = {
      done: false,
      kitRun,
      pyramids: 0,
      knocked: 0,
      score: 0,
      balls: spec.throwsPerPyramid,
      spec,
      ball: null,
      aim: null,
      settle: 0,
      pause: 0,
      pendingNext: undefined,
      closedStamp: false,
    };
    const startBtn = $("milkStart");
    if (startBtn) startBtn.disabled = true;
    if ($("milkVerdict")) $("milkVerdict").hidden = true;
    kit.hideResult("milkResult");
    if (world && world.stamp) world.stamp.visible = false;
    PF.setTier("milkTier", "", "");
    kit.setMode(card(), "play");
    setTaught(false);
    setRoomDress(spec);
    spawnPyramid(spec, true);
    if (world.handBall) world.handBall.visible = true;
    world.cam.mode = "play";
    world.cam.t = 0;
    if (world.aura) world.aura.userData.mood = "wave";
    paintHud(spec);
    if (kitRun) {
      kitRun.depth = 0;
      kitRun.score = 0;
    }
    if (rk() && typeof rk().reportDepth === "function") {
      rk().reportDepth(kitRun, spec.id, { name: spec.name, coda: !!spec.coda });
    }
    setStatus(`PYRAMID 1 · ${spec.name} — ${spec.barker}`);
    const hint = $("milkHint");
    if (hint) hint.textContent = "DRAG to aim · PULL toward you · LET GO to throw";
    try { PF.focusCard("milkCard", true); } catch (_) {}
    try { PF.setAura("think"); } catch (_) {}
    startLoop();
  }

  function pointerAim(ev) {
    const canvas = $("milkCanvas");
    if (!canvas) return { yaw: 0, pitch: 0.28, power: 0.45 };
    const r = canvas.getBoundingClientRect();
    const t = ev.touches ? ev.touches[0] || ev.changedTouches[0] : ev;
    const nx = (t.clientX - r.left) / Math.max(1, r.width);
    const ny = (t.clientY - r.top) / Math.max(1, r.height);
    return { nx, ny };
  }

  function onPointerDown(ev) {
    if (!isLive()) {
      if (card() && (card().classList.contains("is-vestibule") || card().classList.contains("is-result"))) {
        start();
      }
      if (!isLive()) return;
    }
    if (run.ball || run.pause > 0) return;
    if (run.balls <= 0) return;
    ev.preventDefault();
    const p = pointerAim(ev);
    run.aim = {
      ox: p.nx,
      oy: p.ny,
      yaw: 0,
      pitch: 0.28,
      power: 0.35,
    };
    world.cam.mode = "aim";
    try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch (_) {}
  }

  function onPointerMove(ev) {
    if (!isLive() || !run.aim) return;
    const p = pointerAim(ev);
    run.aim.yaw = clamp((p.nx - 0.5) * 1.25, -0.62, 0.62);
    const pull = p.ny - run.aim.oy;
    run.aim.power = clamp(0.22 + pull * 1.45, 0.16, 1);
    run.aim.pitch = clamp(0.38 - pull * 0.55 + (0.5 - p.ny) * 0.15, 0.06, 0.72);
    showTraj(run.aim);
    setPower(run.aim.power, true);
  }

  function onPointerUp(ev) {
    if (!isLive() || !run.aim) return;
    ev.preventDefault();
    const aim = run.aim;
    run.aim = null;
    setPower(0, false);
    if (world && world.sling) world.sling.visible = false;
    launchBall(aim);
  }

  function resize() {
    if (!world) return;
    const stage = $("milkStage") || $("milkCanvas");
    const canvas = $("milkCanvas");
    if (!stage || !canvas) return;
    const w = Math.max(320, stage.clientWidth || canvas.clientWidth || 640);
    const h = Math.max(320, stage.clientHeight || canvas.clientHeight || 480);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function tick(now) {
    raf = 0;
    if (!visible || !world) return;
    if (!lastTs) lastTs = now;
    const dt = Math.min(0.033, (now - lastTs) / 1000);
    lastTs = now;
    world.time += dt;

    if ((!run || run.done) && visible) {
      idleClock += dt;
      if (idleClock > 4.4) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        const spec = milkLevel(idleRoom);
        setRoomDress(spec);
        spawnPyramid(spec, true);
        paintHud(null);
        const barker = $("milkBarker");
        if (barker && spec) barker.textContent = `${spec.name.toUpperCase()} — ${spec.barker}`;
        setStatus(`${hudStageLine(spec, 0)} — ${spec.barker}`);
      }
    }

    stepPhysics(dt);
    stepGame(dt);
    animateAura(dt);
    updateCamera(dt);

    if (world.mats.leadSlug) {
      world.mats.leadSlug.emissiveIntensity = 0.28 + Math.sin(world.time * 3.4) * 0.22;
    }
    if (world.fan && world.fan.visible) world.fan.rotation.x += dt * 10;
    world.flaps.forEach((f, i) => {
      f.rotation.z = Math.sin(world.time * 3.2 + i) * 0.18;
    });
    world.stringLights.forEach((b, i) => {
      const pulse = 0.65 + Math.sin(world.time * 3 + i * 0.7) * 0.35;
      b.scale.setScalar(0.035 * (0.85 + pulse * 0.3));
    });
    world.lanterns.forEach((l, i) => {
      l.intensity = 0.8 + Math.sin(world.time * 2.1 + i) * 0.18;
    });
    if (world.handBall && world.handBall.visible) {
      const o = throwOrigin();
      if (run && run.aim) {
        world.handBall.position.set(
          o.x + run.aim.yaw * 0.25,
          o.y - run.aim.power * 0.18,
          o.z + run.aim.power * 0.22
        );
        if (world.sling) {
          const hx = world.handBall.position.x;
          const hy = world.handBall.position.y;
          const hz = world.handBall.position.z;
          const dx = hx - o.x, dy = hy - o.y, dz = hz - o.z;
          const len = Math.max(0.08, Math.hypot(dx, dy, dz));
          world.sling.visible = true;
          world.sling.position.set((o.x + hx) * 0.5, (o.y + hy) * 0.5, (o.z + hz) * 0.5);
          world.sling.scale.set(1, len, 1);
          world.sling.lookAt(hx, hy, hz);
          world.sling.rotateX(Math.PI / 2);
        }
      } else {
        world.handBall.position.set(o.x, o.y + Math.sin(world.time * 2) * 0.02, o.z);
        if (world.sling) world.sling.visible = false;
      }
    }

    world.renderer.render(world.scene, world.camera);
    raf = requestAnimationFrame(tick);
  }

  function startLoop() {
    visible = true;
    if (!raf) {
      lastTs = 0;
      raf = requestAnimationFrame(tick);
    }
  }

  function stopLoop() {
    visible = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function ensureWorld() {
    if (world) {
      resize();
      return world;
    }
    if (!THREE) return null;
    bootWorld();
    resize();
    return world;
  }

  function onShow() {
    visible = true;
    idleClock = 0;
    loadThree().then(() => {
      try { ensureWorld(); } catch (err) {
        console.warn("[milk-bottles] boot", err);
        setStatus("This tent wants a WebGL lantern.");
        return;
      }
      if (!run || run.done) {
        if (world) {
          world.cam.mode = "enter";
          world.cam.t = 0;
          if (world.stamp) world.stamp.visible = false;
          const spec = milkLevel(idleRoom);
          setRoomDress(spec);
          spawnPyramid(spec, true);
          const barker = $("milkBarker");
          if (barker && spec) barker.textContent = `${spec.name.toUpperCase()} — ${spec.barker}`;
          setStatus(AURA.welcome);
        }
        kit.setMode(card(), "vestibule");
      }
      startLoop();
    });
  }

  function onLeave() {
    if (run && !run.done) finish("incomplete");
    stopLoop();
  }

  function onReset() {
    if (run && !run.done) finish("incomplete");
    run = null;
    if ($("milkVerdict")) $("milkVerdict").hidden = true;
    kit.hideResult("milkResult");
    if (world && world.stamp) world.stamp.visible = false;
    const startBtn = $("milkStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "PLAY · 1 demo coin";
    }
    kit.setMode(card(), "vestibule");
    setTaught(false);
    setPower(0, false);
    if (world) {
      world.cam.mode = "idle";
      spawnPyramid(milkLevel(1), true);
    }
  }

  PF.registerVendor({
    id: "milk-bottles",
    playKey: "milk",
    chalk: "Bottom row doesn’t dance. That’s lead.",
    defaults: { bestMilkPyramids: 0, bestMilkScore: 0 },
    onLeave,
    onShow,
    onReset,
    refreshDepth(state) {
      const now = $("depthMilkNow");
      if (now) now.textContent = run && !run.done ? String(run.pyramids) : "0";
      const best = $("depthMilkBest");
      const bestN = Math.max(state.bestMilkPyramids || 0, (state.bestDepth && state.bestDepth.milk) || 0);
      if (best) best.textContent = bestN ? String(bestN) : "—";
      const sc = $("depthMilkScore");
      if (sc) sc.textContent = run && !run.done ? String(run.score) : "0";
      const bs = $("depthMilkBestScore");
      if (bs) bs.textContent = state.bestMilkScore ? String(state.bestMilkScore) : "—";
    },
    bind() {
      declareP0();
      loadThree();
      const startBtn = $("milkStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = $("milkCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointercancel", onPointerUp);
        canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());
      }
      const ch = $("milkChallenge");
      if (ch) {
        ch.addEventListener("click", () => {
          const text = ($("milkChallengeText") && $("milkChallengeText").textContent) || challengeLine(0);
          kit.copyText(text, () => {
            const copied = $("milkCopied");
            if (copied) copied.hidden = false;
          });
        });
      }
      window.addEventListener("resize", resize);
      const stage = $("milkStage");
      if (stage && window.ResizeObserver) {
        new ResizeObserver(() => resize()).observe(stage);
      }
    },
  });
})();
