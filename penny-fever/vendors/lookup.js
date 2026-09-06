/* Star-Gazing Tent — Desktop Grok owns this file. PF only. Never booth/port 6000.
 * id=lookup · Custom · Sky Tier · 8 authored skies then ENDLESS coda.
 * Wish-lantern flight through a 3D planetarium. Thread gold gates. Skip rose. Dodge meteors.
 * Not the old 2D memory demo. Aura lock: pigtails, yellow crown+heart, green pinafore, black shoes. */
import * as THREE from "../world/lib/three.module.min.js";

(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { kit } = PF;

  const GAME_ID = "lookup";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const DEATH_HOLD_MS = 820;
  const TAU = Math.PI * 2;
  const PASS_R = 1.05;
  const ROSE_R = 0.7;
  const METEOR_R = 0.52;
  const PLAY_R = 6.15;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const AURA = {
    wrong: "Aura: You flew past the gold. The sky noticed.",
    timeout: "Aura: The dome forgot you. Pulse sooner, darling.",
    decoy: "Aura: Rose is a liar. Gold is the path.",
    meteor: "Aura: That one was a meteor. Lanterns are not umbrellas.",
    leave: "Aura: Walking off mid-sky? The lantern keeps the last shape.",
    shallow: "Aura: Not a single gate. Look up next coin.",
    mid: "Aura: Cute flight. Deeper skies get meaner.",
    deep: "Aura: You kept the map. Dangerous.",
    souvenir: "Aura: Authored skies locked. Souvenir — the dome salutes.",
    coda: "Aura: Authored skies done. ENDLESS. Don’t you dare guess.",
    clear: "Aura: Locked. Next sky tells a different lie.",
    wall: "Aura: The canvas is not a gate. Steer back in.",
  };

  const AUTHORED = [
    {
      id: 1, name: "First Light", kind: "teach",
      gold: [[0, 2.85, -0.9], [0.08, 3.75, -2.35], [0.12, 4.7, -3.7]],
      rose: [], meteors: 0, speed: 1.62, time: 24, grace: 2, drift: 0,
      mirrorAfter: 0, blink: false, auraShow: true,
      barker: "Look with drag or WASD. The lantern flies itself. Thread the open GOLD hoop.",
    },
    {
      id: 2, name: "Dipper Lane", kind: "dipper",
      gold: [
        [-2.4, 2.9, -0.6], [-3.35, 3.5, -1.55], [-3.05, 4.35, -2.55],
        [-1.85, 4.2, -2.15], [-0.85, 5.05, -1.35], [0.15, 5.85, -0.55],
      ],
      rose: [], meteors: 0, speed: 1.82, time: 26, grace: 1, drift: 0,
      mirrorAfter: 0, blink: false, auraShow: true,
      barker: "A dipper off to the left. Steer the lantern through every gold gate.",
    },
    {
      id: 3, name: "Wanderer's Waltz", kind: "drift",
      gold: [[2.4, 2.8, -0.8], [1.1, 3.7, -2.6], [-1.3, 4.6, -2.4], [-2.2, 5.7, -0.6]],
      rose: [], meteors: 0, speed: 1.95, time: 24, grace: 1, drift: 0.26,
      mirrorAfter: 0, blink: false, auraShow: true,
      barker: "They waltz. Chase the moving gold. Pulse if they slip away.",
    },
    {
      id: 4, name: "Twin Skies", kind: "decoy",
      gold: [[1.5, 2.6, -0.5], [2.2, 3.6, -1.7], [1.7, 4.6, -2.9], [0.6, 5.5, -3.4], [-0.4, 6.3, -2.6]],
      rose: [[-1.5, 2.7, -0.5], [-2.2, 3.7, -1.7], [-1.6, 4.7, -2.9], [-0.5, 5.6, -3.3]],
      meteors: 0, speed: 2.08, time: 24, grace: 0, drift: 0,
      mirrorAfter: 0, blink: false, auraShow: true,
      barker: "Open GOLD hoops are true. Barred ROSE is a liar. Do not fly the X.",
    },
    {
      id: 5, name: "Meteor Rain", kind: "meteor",
      gold: [[0.2, 2.7, -1.0], [-1.4, 3.6, -2.2], [0.3, 4.5, -3.1], [1.6, 5.4, -2.2], [0.2, 6.4, -1.0]],
      rose: [], meteors: 3, speed: 2.18, time: 23, grace: 0, drift: 0,
      mirrorAfter: 0, blink: false, auraShow: true,
      barker: "Gold still counts. Ice-white streaks smash the lantern. Dodge them.",
    },
    {
      id: 6, name: "Mirror Dome", kind: "mirror",
      gold: [[-1.8, 2.8, -1.2], [-0.6, 3.7, -2.4], [0.7, 4.4, -2.4], [1.9, 5.3, -1.3], [0.4, 6.2, -0.4]],
      rose: [[0.0, 4.9, 2.4]], meteors: 1, speed: 2.22, time: 22, grace: 0, drift: 0,
      mirrorAfter: 2, blink: false, auraShow: true,
      barker: "After two gates the rest of the sky flips. Fly the new gold, not the old.",
    },
    {
      id: 7, name: "Blink Canvas", kind: "blink",
      gold: [
        [0.0, 2.6, -0.8], [1.6, 3.4, -1.8], [0.2, 4.2, -2.8],
        [-1.7, 5.0, -2.2], [-0.2, 5.8, -1.1], [1.3, 6.6, -0.3],
      ],
      rose: [[2.6, 4.6, 0.8]], meteors: 1, speed: 2.28, time: 23, grace: 0, drift: 0.08,
      mirrorAfter: 0, blink: true, auraShow: true,
      barker: "Mid-flight the gold blinks out. Keep the map. The compass still knows.",
    },
    {
      id: 8, name: "Aura's Crown", kind: "crown",
      gold: [
        [-1.55, 4.7, -2.15], [-0.75, 6.05, -2.35], [0.0, 5.15, -2.45],
        [0.75, 6.05, -2.35], [1.55, 4.7, -2.15], [-0.32, 3.85, -1.85], [0.32, 3.85, -1.85],
      ],
      rose: [], meteors: 2, speed: 2.35, time: 26, grace: 0, drift: 0,
      mirrorAfter: 0, blink: false, auraShow: true,
      barker: "Crown, then heart. Aura is looking up with you. Thread her sky.",
    },
  ];

  let run = null;
  let raf = 0;
  let bootPromise = null;
  let shown = false;
  let lastTs = 0;
  let juiceThread = 0;
  let juicePulse = 0;

  const gfx = {
    renderer: null,
    scene: null,
    camera: null,
    lookTarget: new THREE.Vector3(0, 4.2, -1),
    lantern: null,
    flame: null,
    light: null,
    chevron: null,
    aura: null,
    dial: null,
    lanterns: [],
    field: null,
    firePos: null,
    fireGeo: null,
    trailGeo: null,
    trailPos: null,
    gateGroup: null,
    pathGroup: null,
    meteorGroup: null,
    shared: null,
    ready: false,
  };

  const steer = { yaw: 0, pitch: 0.42, tYaw: 0, tPitch: 0.42, shake: 0 };
  const ptr = { down: false, x: 0, y: 0, sx: 0, sy: 0, moved: false };
  const keys = Object.create(null);

  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const tmpC = new THREE.Vector3();
  const upY = new THREE.Vector3(0, 1, 0);
  const heading = new THREE.Vector3(0, 0.2, -1);

  function $(id) { return PF.$(id); }
  function card() { return $("lookupCard"); }
  function section() { return $("cabinet-lookup"); }
  function canvas() { return $("lookupCanvas"); }
  function setText(id, t) {
    const n = $(id);
    if (n) n.textContent = t;
  }
  function rk() { return PF.runKit; }
  function sfx(name) {
    if (kit && typeof kit.sfx === "function") kit.sfx(name);
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - (1 - t) * (1 - t); }

  function seedRand(n) {
    let s = (n * 9973 + 13) >>> 0;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function setHeadingFromSteer() {
    const cp = Math.cos(steer.pitch);
    heading.set(Math.sin(steer.yaw) * cp, Math.sin(steer.pitch), Math.cos(steer.yaw) * cp);
    if (heading.lengthSq() < 0.0001) heading.set(0, 0.2, -1);
    heading.normalize();
    return heading;
  }

  function aimAt(x, y, z) {
    tmpA.set(x, y, z);
    const dir = tmpB.copy(tmpA).sub(gfx.lantern.position);
    if (dir.lengthSq() < 0.0001) return;
    dir.normalize();
    steer.tPitch = clamp(Math.asin(clamp(dir.y, -1, 1)), -0.72, 1.22);
    steer.tYaw = Math.atan2(dir.x, dir.z);
    steer.pitch = steer.tPitch;
    steer.yaw = steer.tYaw;
    setHeadingFromSteer();
  }

  function codaGold(n) {
    const extra = n - AUTHORED_COUNT;
    const count = 5 + (extra >> 1);
    const rnd = seedRand(n * 17 + 9);
    const gold = [];
    let y = 2.3;
    let yaw = rnd() * TAU;
    for (let i = 0; i < count; i++) {
      yaw += 0.55 + rnd() * 0.7;
      y += 0.45 + rnd() * 0.55;
      if (y > 7.6) y = 2.4 + rnd() * 0.4;
      const r = 2.1 + rnd() * 2.4;
      gold.push([Math.sin(yaw) * r, y, Math.cos(yaw) * r]);
    }
    return gold;
  }

  function stageParams(n) {
    if (n <= AUTHORED_COUNT) return AUTHORED[n - 1];
    const extra = n - AUTHORED_COUNT;
    const gold = codaGold(n);
    const rose = extra >= 1
      ? [[-gold[0][0] * 0.8, gold[0][1] + 0.4, -gold[0][2] * 0.8]]
      : [];
    if (extra >= 3 && gold[2]) rose.push([-gold[2][0], gold[2][1] + 0.2, -gold[2][2]]);
    return {
      id: n,
      name: `Endless Sky ${n}`,
      kind: "coda",
      gold,
      rose,
      meteors: 1 + (extra % 3),
      speed: Math.min(3.6, 2.4 + extra * 0.07),
      time: Math.max(14, 22 - extra * 0.4),
      grace: extra < 2 ? 1 : 0,
      drift: 0.12 + extra * 0.02,
      mirrorAfter: extra % 4 === 3 ? 2 : 0,
      blink: extra % 5 === 4,
      auraShow: extra % 3 === 0,
      coda: true,
      barker: "ENDLESS sky. Thread the gold. The dome gets meaner.",
    };
  }

  function declareP0() {
    if (rk() && typeof rk().declare === "function") {
      rk().declare(GAME_ID, {
        engine: "Custom",
        displayName: "Star-Gazing Tent",
        depthUnit: "Sky Tier",
        sheet: "GOBLIN_BATCH06_BUILD_SHEETS.md",
        codaEnabled: CODA_ENABLED,
        authoredCount: AUTHORED_COUNT,
      });
    }
  }

  function beginKitRun() {
    if (rk() && typeof rk().startRun === "function") {
      return rk().startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("lookup")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall through */ }
    }
    if (kit && typeof kit.persistRun === "function") {
      kit.persistRun(PF.getState(), GAME_ID, partial);
    }
    return null;
  }

  function canvasTex(draw, wrapS, wrapT) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.wrapS = wrapS || THREE.RepeatWrapping;
    t.wrapT = wrapT || THREE.RepeatWrapping;
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function tentCanvas() {
    return canvasTex((g) => {
      g.fillStyle = "#5a1d32";
      g.fillRect(0, 0, 256, 256);
      for (let x = 0; x < 256; x += 22) {
        g.fillStyle = x % 44 === 0 ? "#4a1628" : "#6a243c";
        g.fillRect(x, 0, 11, 256);
      }
      g.fillStyle = "rgba(212,164,90,0.14)";
      for (let y = 18; y < 256; y += 36) g.fillRect(0, y, 256, 2);
      g.fillStyle = "rgba(20,8,12,0.18)";
      for (let i = 0; i < 40; i++) g.fillRect((i * 37) % 256, (i * 53) % 256, 3, 18);
    });
  }

  function woodTex() {
    return canvasTex((g) => {
      g.fillStyle = "#3a2418";
      g.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 18) {
        g.fillStyle = y % 36 === 0 ? "#2a1810" : "#4a3020";
        g.fillRect(0, y, 256, 16);
        g.fillStyle = "rgba(212,164,90,0.08)";
        g.fillRect(0, y + 2, 256, 1);
      }
    });
  }

  function skyTex() {
    return canvasTex((g) => {
      const grd = g.createRadialGradient(128, 28, 8, 128, 128, 180);
      grd.addColorStop(0, "#24305a");
      grd.addColorStop(0.35, "#10182e");
      grd.addColorStop(1, "#05060e");
      g.fillStyle = grd;
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = "#f7f0d8";
      for (let i = 0; i < 110; i++) {
        const x = (i * 47) % 256;
        const y = (i * 89) % 256;
        g.globalAlpha = 0.22 + (i % 5) * 0.14;
        g.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
      }
      g.globalAlpha = 0.18;
      g.fillStyle = "#9ab4e8";
      g.beginPath();
      g.ellipse(128, 150, 110, 18, -0.4, 0, TAU);
      g.fill();
      g.globalAlpha = 1;
    });
  }

  function lanternTex() {
    return canvasTex((g) => {
      const grd = g.createLinearGradient(0, 0, 0, 256);
      grd.addColorStop(0, "#fff1c4");
      grd.addColorStop(0.45, "#f2c75c");
      grd.addColorStop(1, "#c47a28");
      g.fillStyle = grd;
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = "rgba(120, 40, 10, 0.18)";
      for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 6, 256);
      g.fillStyle = "rgba(255, 240, 180, 0.28)";
      g.fillRect(0, 20, 256, 8);
      g.fillRect(0, 228, 256, 8);
    });
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ color: 0xe8c4a8 });
    const hair = new THREE.MeshLambertMaterial({ color: 0x3a2218 });
    const crownM = new THREE.MeshLambertMaterial({ color: 0xf2c75c, emissive: 0x6a4810, emissiveIntensity: 0.35 });
    const heartM = new THREE.MeshLambertMaterial({ color: 0xc41e3a, emissive: 0x5a1018, emissiveIntensity: 0.3 });
    const pina = new THREE.MeshLambertMaterial({ color: 0x2f7a44 });
    const dress = new THREE.MeshLambertMaterial({ color: 0x1e4d32 });
    const shoe = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 90, specular: 0x555555 });

    const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.42, 12), dress);
    skirt.position.y = 0.46;
    g.add(skirt);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.4, 10), pina);
    torso.position.y = 0.74;
    g.add(torso);
    const bib = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.06), pina);
    bib.position.set(0, 0.86, 0.12);
    g.add(bib);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 12), skin);
    head.position.y = 1.08;
    g.add(head);
    const bang = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), hair);
    bang.scale.set(1.05, 0.5, 1);
    bang.position.set(0, 1.16, 0.02);
    g.add(bang);
    const pigL = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), hair);
    pigL.position.set(-0.17, 1.02, -0.02);
    g.add(pigL);
    const pigR = pigL.clone();
    pigR.position.x = 0.17;
    g.add(pigR);
    const cr = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.13, 5), crownM);
    cr.position.set(0, 1.28, 0);
    g.add(cr);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.016, 6, 14), crownM);
    band.rotation.x = Math.PI / 2;
    band.position.y = 1.22;
    g.add(band);
    const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), heartM);
    h1.position.set(-0.024, 1.36, 0.05);
    g.add(h1);
    const h2 = h1.clone();
    h2.position.x = 0.024;
    g.add(h2);
    const h3 = new THREE.Mesh(new THREE.ConeGeometry(0.046, 0.065, 4), heartM);
    h3.rotation.x = Math.PI;
    h3.position.set(0, 1.315, 0.05);
    g.add(h3);
    const armGeo = new THREE.CylinderGeometry(0.032, 0.028, 0.4, 7);
    const armL = new THREE.Mesh(armGeo, skin);
    armL.position.set(-0.24, 0.76, 0.02);
    armL.rotation.z = 0.45;
    g.add(armL);
    const armR = new THREE.Mesh(armGeo, skin);
    armR.position.set(0.2, 0.95, 0.1);
    armR.rotation.z = -1.15;
    armR.rotation.x = -0.55;
    g.add(armR);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), skin);
    hand.position.set(0.08, 1.18, 0.28);
    g.add(hand);
    const legGeo = new THREE.CylinderGeometry(0.038, 0.032, 0.3, 7);
    const legL = new THREE.Mesh(legGeo, skin);
    legL.position.set(-0.09, 0.26, 0);
    g.add(legL);
    const legR = legL.clone();
    legR.position.x = 0.09;
    g.add(legR);
    const shoeL = new THREE.Mesh(new THREE.SphereGeometry(0.068, 8, 6), shoe);
    shoeL.scale.set(1, 0.52, 1.4);
    shoeL.position.set(-0.09, 0.07, 0.05);
    g.add(shoeL);
    const shoeR = shoeL.clone();
    shoeR.position.x = 0.09;
    g.add(shoeR);
    g.userData.pointArm = armR;
    g.userData.hand = hand;
    g.userData.head = head;
    return g;
  }

  function makeLantern() {
    const g = new THREE.Group();
    const paper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.17, 0.26, 12, 1, true),
      new THREE.MeshLambertMaterial({
        map: lanternTex(),
        color: 0xffe2a8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      })
    );
    paper.position.y = 0.02;
    g.add(paper);
    const goldM = new THREE.MeshPhongMaterial({ color: 0xf2c75c, shininess: 80, emissive: 0x5a3a10, emissiveIntensity: 0.25 });
    const top = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018, 8, 16), goldM);
    top.rotation.x = Math.PI / 2;
    top.position.y = 0.15;
    g.add(top);
    const bot = top.clone();
    bot.position.y = -0.12;
    g.add(bot);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.15, 0.08, 10), goldM);
    cap.position.y = 0.2;
    g.add(cap);
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 6, 12), goldM);
    loop.position.y = 0.28;
    g.add(loop);
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff4c8 })
    );
    flame.position.y = 0.02;
    g.add(flame);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xf2c75c, transparent: true, opacity: 0.28, depthWrite: false })
    );
    glow.position.y = 0.02;
    g.add(glow);
    const tassel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.02, 0.16, 6),
      new THREE.MeshLambertMaterial({ color: 0x7b2743 })
    );
    tassel.position.y = -0.22;
    g.add(tassel);
    const light = new THREE.PointLight(0xffcc88, 1.35, 8.5, 2);
    light.position.y = 0.05;
    g.add(light);
    gfx.flame = flame;
    gfx.light = light;
    g.userData.glow = glow;
    return g;
  }

  function boot() {
    if (gfx.ready) return Promise.resolve(true);
    if (bootPromise) return bootPromise;
    bootPromise = Promise.resolve().then(() => {
      const cv = canvas();
      if (!cv) return false;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: cv,
          antialias: !REDUCE,
          alpha: false,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        });
      } catch (err) {
        setText("lookupStatus", "This tent needs WebGL. The sky stayed shy.");
        return false;
      }
      renderer.setClearColor(0x05060e, 1);
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      else if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x070814, 0.028);
      const camera = new THREE.PerspectiveCamera(64, 1, 0.08, 90);

      scene.add(new THREE.HemisphereLight(0x8899cc, 0x1a1014, 0.75));
      scene.add(new THREE.AmbientLight(0x3a3048, 0.48));
      const moonLight = new THREE.DirectionalLight(0xc8d4ff, 0.55);
      moonLight.position.set(-6.5, 12, -8);
      scene.add(moonLight);

      const sky = new THREE.Mesh(
        new THREE.SphereGeometry(32, 24, 16),
        new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide })
      );
      scene.add(sky);

      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(1.15, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xf0e6c8 })
      );
      moon.position.set(-6.5, 11.5, -10);
      scene.add(moon);
      const moonGlow = new THREE.Mesh(
        new THREE.SphereGeometry(1.7, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0xc8d4ff, transparent: true, opacity: 0.18, depthWrite: false })
      );
      moonGlow.position.copy(moon.position);
      scene.add(moonGlow);

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(7.5, 40),
        new THREE.MeshLambertMaterial({ map: woodTex(), color: 0xc8a078 })
      );
      floor.rotation.x = -Math.PI / 2;
      scene.add(floor);

      const rug = new THREE.Mesh(
        new THREE.CircleGeometry(1.8, 28),
        new THREE.MeshLambertMaterial({ color: 0x5b2743 })
      );
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(0, 0.02, 1.2);
      scene.add(rug);

      const wallTex = tentCanvas();
      wallTex.repeat.set(8, 2);
      const walls = new THREE.Mesh(
        new THREE.CylinderGeometry(7.45, 7.45, 2.7, 32, 1, true),
        new THREE.MeshLambertMaterial({ map: wallTex, side: THREE.BackSide, color: 0xffd0c8 })
      );
      walls.position.y = 1.35;
      scene.add(walls);

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(7.45, 40, 22, 0, TAU, 0, Math.PI * 0.48),
        new THREE.MeshLambertMaterial({
          color: 0x14182c,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.55,
        })
      );
      dome.position.y = 2.7;
      scene.add(dome);

      const oculus = new THREE.Mesh(
        new THREE.RingGeometry(0.7, 1.05, 28),
        new THREE.MeshBasicMaterial({ color: 0xf2c75c, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
      );
      oculus.rotation.x = Math.PI / 2;
      oculus.position.y = 9.85;
      scene.add(oculus);
      gfx.dial = oculus;

      const poles = new THREE.Group();
      gfx.lanterns = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        const x = Math.sin(a) * 6.55;
        const z = Math.cos(a) * 6.55;
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.07, 2.5, 6),
          new THREE.MeshLambertMaterial({ color: 0x3a2418 })
        );
        pole.position.set(x, 1.25, z);
        poles.add(pole);
        const lamp = new THREE.Group();
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.14, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xffd08a })
        );
        lamp.add(bulb);
        const shade = new THREE.Mesh(
          new THREE.ConeGeometry(0.2, 0.16, 8, 1, true),
          new THREE.MeshLambertMaterial({ color: 0x7b2743, side: THREE.DoubleSide })
        );
        shade.position.y = 0.08;
        lamp.add(shade);
        lamp.position.set(x, 2.45, z);
        const light = new THREE.PointLight(0xffcc88, 0.7, 7.2, 2);
        lamp.add(light);
        poles.add(lamp);
        gfx.lanterns.push(lamp);
      }
      scene.add(poles);

      const chaise = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.22, 1.8),
        new THREE.MeshLambertMaterial({ color: 0x6a3a28 })
      );
      chaise.position.set(0, 0.22, 1.35);
      scene.add(chaise);
      const cushion = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.1, 0.7),
        new THREE.MeshLambertMaterial({ color: 0x7b2743 })
      );
      cushion.position.set(0, 0.38, 1.7);
      scene.add(cushion);

      const scope = new THREE.Group();
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 1.3, 10),
        new THREE.MeshPhongMaterial({ color: 0xb08a3a, shininess: 60 })
      );
      tube.rotation.z = 0.7;
      tube.rotation.x = -0.35;
      tube.position.set(0, 0.85, 0);
      scope.add(tube);
      const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.08, 0.9, 6),
        new THREE.MeshLambertMaterial({ color: 0x3a2418 })
      );
      stand.position.y = 0.45;
      scope.add(stand);
      scope.position.set(-2.5, 0, 2.6);
      scene.add(scope);

      const fieldCount = REDUCE ? 280 : 720;
      const fPos = new Float32Array(fieldCount * 3);
      for (let i = 0; i < fieldCount; i++) {
        const theta = Math.random() * 1.05;
        const phi = Math.random() * TAU;
        const rr = 8.2 + Math.random() * 6;
        fPos[i * 3] = Math.sin(theta) * Math.sin(phi) * rr;
        fPos[i * 3 + 1] = Math.cos(theta) * rr + 2.4;
        fPos[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * rr;
      }
      const fieldGeo = new THREE.BufferGeometry();
      fieldGeo.setAttribute("position", new THREE.BufferAttribute(fPos, 3));
      const field = new THREE.Points(
        fieldGeo,
        new THREE.PointsMaterial({
          color: 0xe8f0ff,
          size: 0.05,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        })
      );
      scene.add(field);
      gfx.field = field;

      const fireN = REDUCE ? 28 : 56;
      const firePos = new Float32Array(fireN * 3);
      for (let i = 0; i < fireN; i++) {
        firePos[i * 3] = (Math.random() - 0.5) * 10;
        firePos[i * 3 + 1] = 0.4 + Math.random() * 5.5;
        firePos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      }
      const fireGeo = new THREE.BufferGeometry();
      fireGeo.setAttribute("position", new THREE.BufferAttribute(firePos, 3));
      scene.add(new THREE.Points(
        fireGeo,
        new THREE.PointsMaterial({
          color: 0xf2c75c,
          size: 0.055,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        })
      ));
      gfx.firePos = firePos;
      gfx.fireGeo = fireGeo;

      const trailN = REDUCE ? 40 : 72;
      const trailPos = new Float32Array(trailN * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
      const trail = new THREE.Line(
        trailGeo,
        new THREE.LineBasicMaterial({ color: 0xf2c75c, transparent: true, opacity: 0.7 })
      );
      scene.add(trail);
      gfx.trailGeo = trailGeo;
      gfx.trailPos = trailPos;

      const gateGroup = new THREE.Group();
      scene.add(gateGroup);
      const pathGroup = new THREE.Group();
      scene.add(pathGroup);
      const meteorGroup = new THREE.Group();
      scene.add(meteorGroup);

      const torus = new THREE.TorusGeometry(0.68, 0.058, 10, 28);
      const roseTorus = new THREE.TorusGeometry(0.56, 0.08, 8, 20);
      const disc = new THREE.CircleGeometry(0.58, 22);
      const roseFill = new THREE.CircleGeometry(0.5, 18);
      const goldStar = new THREE.OctahedronGeometry(0.1, 0);
      const roseBar = new THREE.BoxGeometry(0.11, 0.92, 0.07);
      const meteorHead = new THREE.ConeGeometry(0.13, 0.34, 8);
      const meteorBlob = new THREE.SphereGeometry(0.07, 8, 6);
      gfx.shared = {
        torus,
        roseTorus,
        disc,
        roseFill,
        goldStar,
        roseBar,
        meteorHead,
        meteorBlob,
        goldMat: new THREE.MeshBasicMaterial({ color: 0xffe08a }),
        goldStarMat: new THREE.MeshBasicMaterial({ color: 0xfff6c8 }),
        goldGlow: new THREE.MeshBasicMaterial({
          color: 0xfff1b0,
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
        roseMat: new THREE.MeshBasicMaterial({ color: 0xff3a6e }),
        roseBarMat: new THREE.MeshBasicMaterial({ color: 0xffd0dc }),
        roseGlow: new THREE.MeshBasicMaterial({
          color: 0xc41e3a,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
        rodMat: new THREE.MeshBasicMaterial({ color: 0xf2c75c, transparent: true, opacity: 0.0, depthWrite: false }),
        meteorMat: new THREE.MeshBasicMaterial({ color: 0xf4fbff }),
        meteorTail: new THREE.MeshBasicMaterial({ color: 0x7ed7ff, transparent: true, opacity: 0.72, depthWrite: false }),
      };

      const lantern = makeLantern();
      lantern.position.set(0.2, 0.78, 1.05);
      scene.add(lantern);

      const chevron = new THREE.Mesh(
        new THREE.ConeGeometry(0.07, 0.16, 4),
        new THREE.MeshBasicMaterial({ color: 0xfff1c0 })
      );
      scene.add(chevron);

      const aura = makeAura();
      aura.position.set(0.55, 0.12, 1.85);
      aura.lookAt(0, 3.4, -1);
      scene.add(aura);

      gfx.renderer = renderer;
      gfx.scene = scene;
      gfx.camera = camera;
      gfx.lantern = lantern;
      gfx.chevron = chevron;
      gfx.aura = aura;
      gfx.gateGroup = gateGroup;
      gfx.pathGroup = pathGroup;
      gfx.meteorGroup = meteorGroup;

      const legend = new THREE.Group();
      const demoGold = addGate([-1.55, 2.45, -0.85], "gold", -1);
      const demoRose = addGate([1.6, 2.4, -0.7], "rose", -2);
      gfx.gateGroup.remove(demoGold);
      gfx.gateGroup.remove(demoRose);
      legend.add(demoGold);
      legend.add(demoRose);
      const demoMeteor = new THREE.Group();
      demoMeteor.add(new THREE.Mesh(gfx.shared.meteorHead, gfx.shared.meteorMat));
      for (let i = 1; i <= 8; i++) {
        const blob = new THREE.Mesh(gfx.shared.meteorBlob, gfx.shared.meteorTail);
        blob.position.y = -i * 0.18;
        blob.scale.setScalar(1.15 - i * 0.1);
        demoMeteor.add(blob);
      }
      legend.add(demoMeteor);
      scene.add(legend);
      gfx.legend = legend;
      gfx.demoGold = demoGold;
      gfx.demoRose = demoRose;
      gfx.demoMeteor = demoMeteor;
      gfx.ready = true;
      restLantern();
      resize();
      return true;
    });
    return bootPromise;
  }

  function resetTrail() {
    if (!gfx.trailPos || !gfx.lantern) return;
    const p = gfx.lantern.position;
    for (let i = 0; i < gfx.trailPos.length; i += 3) {
      gfx.trailPos[i] = p.x;
      gfx.trailPos[i + 1] = p.y;
      gfx.trailPos[i + 2] = p.z;
    }
    gfx.trailGeo.attributes.position.needsUpdate = true;
  }

  function restLantern() {
    if (!gfx.lantern) return;
    gfx.lantern.position.set(0.2, 0.78, 1.05);
    gfx.lantern.rotation.set(0.12, 0.4, 0.08);
    if (gfx.chevron) gfx.chevron.visible = false;
    resetTrail();
  }

  function resize() {
    if (!gfx.ready) return;
    const cv = canvas();
    const world = $("lookupWorld");
    const w = (world && world.clientWidth) || (cv && cv.clientWidth) || 1;
    const h = (world && world.clientHeight) || (cv && cv.clientHeight) || 1;
    gfx.camera.aspect = w / Math.max(1, h);
    gfx.camera.updateProjectionMatrix();
    gfx.renderer.setSize(w, h, false);
  }

  function clearGroup(g) {
    if (!g) return;
    while (g.children.length) {
      const ch = g.children[0];
      g.remove(ch);
      ch.traverse((o) => {
        if (!o.geometry || !gfx.shared) return;
        const sh = gfx.shared;
        const keep = o.geometry === sh.torus || o.geometry === sh.roseTorus || o.geometry === sh.disc
          || o.geometry === sh.roseFill || o.geometry === sh.goldStar || o.geometry === sh.roseBar
          || o.geometry === sh.meteorHead || o.geometry === sh.meteorBlob;
        if (!keep) o.geometry.dispose();
      });
    }
  }

  function placeRod(mesh, a, b, t) {
    tmpA.copy(b).sub(a);
    const len = tmpA.length() * t;
    tmpB.copy(a).addScaledVector(tmpA.normalize(), len * 0.5);
    mesh.position.copy(tmpB);
    mesh.scale.set(1, Math.max(0.02, len), 1);
    mesh.quaternion.setFromUnitVectors(upY, tmpC.copy(b).sub(a).normalize());
  }

  function addGate(pos, kind, index) {
    const g = new THREE.Group();
    const gold = kind === "gold";
    let ring;
    let glow;
    if (gold) {
      ring = new THREE.Mesh(gfx.shared.torus, gfx.shared.goldMat);
      glow = new THREE.Mesh(gfx.shared.disc, gfx.shared.goldGlow.clone());
      g.add(ring);
      g.add(glow);
      for (let i = 0; i < 5; i++) {
        const star = new THREE.Mesh(gfx.shared.goldStar, gfx.shared.goldStarMat);
        const a = (i / 5) * TAU;
        star.position.set(Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0);
        star.rotation.z = a;
        g.add(star);
      }
    } else {
      ring = new THREE.Mesh(gfx.shared.roseTorus, gfx.shared.roseMat);
      glow = new THREE.Mesh(gfx.shared.roseFill, gfx.shared.roseGlow.clone());
      g.add(glow);
      g.add(ring);
      const barA = new THREE.Mesh(gfx.shared.roseBar, gfx.shared.roseBarMat);
      barA.rotation.z = 0.72;
      const barB = barA.clone();
      barB.rotation.z = -0.72;
      g.add(barA);
      g.add(barB);
      g.userData.bars = [barA, barB];
    }
    g.position.set(pos[0], pos[1], pos[2]);
    g.userData = Object.assign(g.userData, {
      kind,
      index,
      home: new THREE.Vector3(pos[0], pos[1], pos[2]),
      ring,
      glow,
      near: false,
      hit: false,
    });
    gfx.gateGroup.add(g);
    return g;
  }

  function buildSky(spec) {
    clearGroup(gfx.gateGroup);
    clearGroup(gfx.pathGroup);
    clearGroup(gfx.meteorGroup);
    const gold = spec.gold.map((p, i) => addGate(p, "gold", i));
    const rose = (spec.rose || []).map((p, i) => addGate(p, "rose", 100 + i));
    const rods = [];
    for (let i = 0; i < gold.length - 1; i++) {
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 1, 6),
        gfx.shared.rodMat.clone()
      );
      gfx.pathGroup.add(rod);
      rods.push(rod);
    }
    gold.forEach((gate, i) => {
      const from = i === 0
        ? tmpA.copy(gate.position).add(new THREE.Vector3(0, -0.4, 1.4))
        : gold[i - 1].position;
      gate.lookAt(from);
    });
    rose.forEach((gate) => {
      gate.lookAt(0, 1.2, 1.2);
    });
    return { gold, rose, rods, meteors: [] };
  }

  function driftedHome(gate, spec, tSec) {
    tmpA.copy(gate.userData.home);
    if (spec.drift) {
      const a = spec.drift * tSec;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const x = tmpA.x * c - tmpA.z * s;
      const z = tmpA.x * s + tmpA.z * c;
      tmpA.x = x;
      tmpA.z = z;
    }
    if (run && run.mirrored && gate.userData.kind === "gold" && gate.userData.index >= (spec.mirrorAfter || 99)) {
      tmpA.x *= -1;
    }
    return tmpA;
  }

  function spawnMeteor() {
    if (!gfx.ready || !run) return;
    const g = new THREE.Group();
    const head = new THREE.Mesh(gfx.shared.meteorHead, gfx.shared.meteorMat);
    g.add(head);
    for (let i = 1; i <= 8; i++) {
      const t = new THREE.Mesh(gfx.shared.meteorBlob, gfx.shared.meteorTail);
      t.position.y = -i * 0.18;
      t.scale.setScalar(1.15 - i * 0.1);
      g.add(t);
    }
    const yaw = Math.random() * TAU;
    const y = 2.2 + Math.random() * 5.4;
    const from = new THREE.Vector3(Math.sin(yaw) * 6.6, y, Math.cos(yaw) * 6.6);
    const to = new THREE.Vector3(-from.x * 0.55, y + (Math.random() - 0.5) * 2.2, -from.z * 0.55);
    g.position.copy(from);
    gfx.meteorGroup.add(g);
    const vel = to.clone().sub(from).normalize().multiplyScalar(4.8 + Math.random() * 2.2);
    g.quaternion.setFromUnitVectors(upY, tmpA.copy(vel).normalize());
    run.sky.meteors.push({ mesh: g, vel, life: 3.2 });
  }

  function paintHud() {
    if (!run) {
      setText("depthLookupNow", "0");
      setText("depthLookupDrawn", "0");
      setText("depthLookupScore", "0");
      return;
    }
    const spec = run.spec;
    setText("depthLookupNow", String(spec.id));
    setText("depthLookupDrawn", String(run.nextIndex));
    setText("depthLookupScore", String(run.score));
    const hud = document.querySelector('[data-runkit-hud="lookup"]');
    if (hud) {
      hud.textContent = spec.coda
        ? `ENDLESS · SKY TIER ${spec.id} · ${spec.name}`
        : `SKY TIER ${spec.id} · ${spec.name}`;
    }
    if (rk() && run.kitRun && typeof rk().reportDepth === "function") {
      rk().reportDepth(run.kitRun, Math.max(run.depth, spec.id), { name: spec.name, coda: !!spec.coda });
    }
    const pips = document.querySelectorAll("#lookupTrace i");
    pips.forEach((el, i) => {
      el.classList.toggle("on", i < run.nextIndex && !run.missed[i]);
      el.classList.toggle("miss", !!run.missed[i]);
    });
    const strikeRoot = document.querySelector('[data-runkit-strikes="lookup"]');
    if (strikeRoot) {
      strikeRoot.querySelectorAll("i").forEach((el, i) => el.classList.toggle("on", i < run.strikes));
    }
    const timer = $("lookupTimer");
    const fill = $("lookupTimerFill");
    if (timer && fill) {
      const show = run.phase === "fly";
      timer.hidden = !show;
      if (show) {
        const left = clamp(1 - run.phaseT / spec.time, 0, 1);
        fill.style.transform = `scaleX(${left})`;
      }
    }
  }

  function buildTrace(n) {
    const root = $("lookupTrace");
    if (!root) return;
    root.innerHTML = "";
    for (let i = 0; i < n; i++) root.appendChild(document.createElement("i"));
  }

  function setPhase(name, copy) {
    const el = $("lookupPhase");
    if (el) {
      el.textContent = name;
      el.classList.toggle("is-lift", name === "LIFT");
      el.classList.toggle("is-fly", name === "FLY");
    }
    if (copy) setText("lookupStatus", copy);
  }

  function isLive() {
    return !!(run && !run.done && !run.dying);
  }

  function approachPoint(spec) {
    const g0 = spec.gold[0];
    const g1 = spec.gold[1] || [g0[0], g0[1] + 0.4, g0[2] - 1];
    tmpA.set(g0[0] - g1[0], g0[1] - g1[1], g0[2] - g1[2]);
    if (tmpA.lengthSq() < 0.01) tmpA.set(0, -0.2, 1.4);
    tmpA.normalize();
    return new THREE.Vector3(g0[0], g0[1], g0[2]).addScaledVector(tmpA, 2.45);
  }

  function enterRoom(n, fromStart) {
    const spec = stageParams(n);
    run.spec = spec;
    run.nextIndex = 0;
    run.phase = fromStart ? "lift" : "fly";
    run.phaseT = 0;
    run.roomT = 0;
    run.mirrored = false;
    run.blinkOff = false;
    run.pulseT = 0;
    run.pulseCd = 0;
    run.meteorAcc = 0;
    run.missed = [];
    run.pendingNext = 0;
    run.pendingFinish = null;
    run.sky = buildSky(spec);
    buildTrace(spec.gold.length);
    const ap = approachPoint(spec);
    run.liftFrom = gfx.lantern.position.clone();
    run.liftTo = ap;
    if (run.liftTo.y < 1.3) run.liftTo.y = 1.3;
    if (!fromStart) {
      gfx.lantern.position.copy(ap);
      aimAt(spec.gold[0][0], spec.gold[0][1], spec.gold[0][2]);
    } else {
      gfx.lantern.position.set(0.2, 0.78, 1.05);
    }
    gfx.chevron.visible = true;
    if (gfx.aura) gfx.aura.visible = true;
    setText("lookupBarker", spec.barker);
    setPhase(run.phase === "lift" ? "LIFT" : "FLY", spec.barker);
    const pulseBtn = $("lookupPulse");
    if (pulseBtn) pulseBtn.hidden = false;
    paintHud();
    sfx("chapter");
  }

  function start() {
    if (isLive() || (run && run.dying)) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("lookupStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      return;
    }
    kit.hideResult("lookupResult");
    const verdict = $("lookupVerdict");
    if (verdict) {
      verdict.hidden = true;
      verdict.textContent = "";
    }
    const tier = $("lookupTier");
    if (tier) {
      tier.hidden = true;
      tier.textContent = "";
    }
    const startBtn = $("lookupStart");
    if (startBtn) startBtn.disabled = true;
    kit.setMode(card(), "play");
    const sec = section();
    if (sec) sec.classList.add("is-playing");
    const pulseBtn = $("lookupPulse");
    if (pulseBtn) {
      pulseBtn.hidden = false;
      pulseBtn.disabled = false;
    }
    steer.shake = 0;
    run = {
      kitRun,
      spec: null,
      sky: null,
      depth: 0,
      score: 0,
      strikes: 0,
      nextIndex: 0,
      phase: "lift",
      phaseT: 0,
      roomT: 0,
      last: performance.now(),
      dying: false,
      done: false,
      deathHold: 0,
      deathReason: "",
      mirrored: false,
      blinkOff: false,
      pulseT: 0,
      pulseCd: 0,
      meteorAcc: 0,
      missed: [],
      liftFrom: null,
      liftTo: null,
    };
    enterRoom(1, true);
    const cv = canvas();
    if (cv && cv.focus) cv.focus();
  }

  function auraLine(reason, depth) {
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "leave") return AURA.leave;
    if (reason === "decoy") return AURA.decoy;
    if (reason === "meteor") return AURA.meteor;
    if (reason === "timeout") return AURA.timeout;
    if (reason === "wall") return AURA.wall;
    if (depth >= 6) return AURA.deep;
    if (depth >= 3) return AURA.mid;
    if (depth <= 0) return AURA.shallow;
    return AURA.wrong;
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.dying = true;
    run.deathReason = reason;
    const depth = run.depth | 0;
    const score = run.score | 0;
    const spec = run.spec || stageParams(1);
    const cashed = reason === "souvenir";
    const payload = {
      depth,
      score,
      deathReason: reason,
      cashedOut: cashed,
      meta: { room: spec.name, drawn: run.nextIndex },
    };
    const state = PF.getState();
    if (state) {
      state.bestLookupTiers = Math.max(state.bestLookupTiers || 0, depth);
      state.bestLookupScore = Math.max(state.bestLookupScore || 0, score);
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, depth);
    }
    closeKitRun(payload);
    if (kit && typeof kit.persistRun === "function") kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();

    const aura = auraLine(reason, depth);
    const challenge = (rk() && typeof rk().challengeText === "function")
      ? rk().challengeText("Sky Tier", depth, GAME_ID)
      : `Beat my Sky Tier ${depth} on Penny Fever`;
    kit.fillResult({
      root: "lookupResult",
      depth: "lookupResultDepth",
      score: "lookupResultScore",
      aura: "lookupResultAura",
      copied: "lookupCopied",
    }, {
      depthLine: cashed ? `SOUVENIR · SKY TIER ${depth}` : `SKY TIER ${depth}`,
      scoreLine: `SCORE ${score} · ${String(reason).toUpperCase()}`,
      auraLine: aura,
    });
    setText("lookupChallengeText", challenge);
    if (typeof PF.setTier === "function") {
      PF.setTier(
        "lookupTier",
        depth > 0 ? (spec.coda ? `ENDLESS · ${depth}` : `SKY TIER ${depth}`) : (cashed ? "SOUVENIR" : "SHY SKY"),
        depth > 0 || cashed ? "perfect" : "miss"
      );
    }
    setText("lookupStatus", reason === "leave" ? "Left the tent." : (cashed ? "Souvenir — authored skies locked." : "The dome stamped SHY SKY."));
    const ok = depth > 0 || cashed;
    if (ok) {
      PF.award(Math.max(8, Math.floor(score / 10)), true, "Star-Gazing");
      PF.setAura(depth >= 4 || cashed ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `SKY TIER ${depth}`, aura);
    } else {
      PF.award(0, false, "Star-Gazing miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "SHY SKY", aura);
    }
    PF.refreshNightBoard();
    const startBtn = $("lookupStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.hidden = false;
      startBtn.textContent = "LIFT THE LANTERN · 1 demo coin";
    }
    const pulseBtn = $("lookupPulse");
    if (pulseBtn) pulseBtn.hidden = true;
    kit.setMode(card(), "result");
    const sec = section();
    if (sec) sec.classList.remove("is-playing");
    card() && card().classList.remove("is-dying", "is-pulse", "is-thread");
    const compass = $("lookupCompass");
    if (compass) compass.hidden = true;
    const timer = $("lookupTimer");
    if (timer) timer.hidden = true;
    run.done = true;
    run.dying = false;
    restLantern();
    paintBest();
  }

  function kill(reason) {
    if (!isLive()) return;
    run.dying = true;
    run.deathReason = reason;
    run.deathHold = DEATH_HOLD_MS;
    steer.shake = 1.25;
    card() && card().classList.add("is-dying");
    setPhase("SHY SKY", auraLine(reason, run.depth));
    sfx("stamp");
  }

  function strikeOrKill(reason) {
    const spec = run.spec;
    const grace = spec.grace | 0;
    if (run.strikes < grace) {
      run.strikes += 1;
      if (run.kitRun) run.kitRun.strikes = run.strikes;
      if (rk() && run.kitRun && typeof rk().reportStrike === "function") rk().reportStrike(run.kitRun, reason);
      steer.shake = 0.7;
      sfx("miss");
      setText("lookupStatus", "The dome forgave that. Once.");
      paintHud();
      return false;
    }
    kill(reason);
    return true;
  }

  function clearRoom() {
    const spec = run.spec;
    const remain = Math.max(0, spec.time - run.phaseT);
    const bonus = 80 + Math.floor(remain * 18) + (run.strikes === 0 ? 30 : 0);
    run.score += bonus;
    run.depth = spec.id;
    if (run.kitRun) {
      run.kitRun.score = run.score;
      run.kitRun.depth = run.depth;
    }
    sfx("cash");
    setPhase("LOCKED", spec.coda ? AURA.coda : AURA.clear);
    steer.shake = 0.28;
    juiceThread = 1;
    paintHud();
    const next = spec.id + 1;
    if (!CODA_ENABLED && spec.id >= AUTHORED_COUNT) {
      run.phase = "celebrate";
      run.phaseT = 0;
      run.pendingFinish = "souvenir";
      return;
    }
    run.phase = "celebrate";
    run.phaseT = 0;
    run.pendingNext = next;
  }

  function threadGate(gate) {
    if (!gate || gate.userData.hit) return;
    gate.userData.hit = true;
    run.nextIndex += 1;
    run.score += 80 + (run.pulseT > 0 ? 12 : 0);
    if (run.kitRun) run.kitRun.score = run.score;
    sfx("drop");
    juiceThread = 1;
    card() && card().classList.add("is-thread");
    setTimeout(() => { card() && card().classList.remove("is-thread"); }, 220);
    if (run.spec.mirrorAfter && run.nextIndex === run.spec.mirrorAfter && !run.mirrored) {
      run.mirrored = true;
      setText("lookupStatus", "The dome flipped. Fly the new gold.");
      sfx("spinner");
    }
    paintHud();
    if (run.nextIndex >= run.spec.gold.length) clearRoom();
    else setText("lookupStatus", run.spec.barker);
  }

  function missGate(index) {
    run.missed[index] = true;
    run.nextIndex += 1;
    paintHud();
    const dead = strikeOrKill("wrong");
    if (!dead && run.nextIndex >= run.spec.gold.length) clearRoom();
  }

  function pulse() {
    if (!isLive() || run.phase !== "fly") return;
    if (run.pulseCd > 0) return;
    run.pulseT = 0.32;
    run.pulseCd = 0.72;
    juicePulse = 1;
    steer.shake = Math.max(steer.shake, 0.25);
    sfx("tray");
    card() && card().classList.add("is-pulse");
    setTimeout(() => { card() && card().classList.remove("is-pulse"); }, 280);
  }

  function updateTrail() {
    if (!gfx.trailPos) return;
    const pos = gfx.trailPos;
    for (let i = pos.length - 3; i >= 3; i -= 3) {
      pos[i] = pos[i - 3];
      pos[i + 1] = pos[i - 2];
      pos[i + 2] = pos[i - 1];
    }
    pos[0] = gfx.lantern.position.x;
    pos[1] = gfx.lantern.position.y;
    pos[2] = gfx.lantern.position.z;
    gfx.trailGeo.attributes.position.needsUpdate = true;
  }

  function updateCompass() {
    const el = $("lookupCompass");
    const needle = $("lookupCompassNeedle");
    if (!el || !needle) return;
    if (!isLive() || run.phase !== "fly" || !run.sky) {
      el.hidden = true;
      return;
    }
    const gate = run.sky.gold[run.nextIndex];
    if (!gate) {
      el.hidden = true;
      return;
    }
    tmpA.copy(gate.position).project(gfx.camera);
    if (tmpA.z > 1) {
      tmpA.x = -tmpA.x;
      tmpA.y = -tmpA.y;
    }
    const onScreen = Math.abs(tmpA.x) < 0.7 && Math.abs(tmpA.y) < 0.62 && tmpA.z < 1;
    el.hidden = onScreen;
    if (!onScreen) {
      const ang = Math.atan2(tmpA.x, tmpA.y);
      needle.style.transform = `rotate(${ang}rad)`;
    }
  }

  function updateGates(spec, tSec) {
    if (!run || !run.sky) return;
    const vis = run.blinkOff ? 0.08 : 1;
    run.sky.gold.forEach((gate, i) => {
      const p = driftedHome(gate, spec, tSec);
      gate.position.copy(p);
      const next = i === run.nextIndex;
      const done = i < run.nextIndex;
      const pulse = 1 + Math.sin(tSec * 5 + i) * (next ? 0.12 : 0.04);
      const s = (done ? 0.55 : next ? 1.18 : 0.92) * pulse;
      gate.scale.setScalar(lerp(gate.scale.x, s, 0.18));
      gate.userData.glow.material.opacity = vis * (done ? 0.08 : next ? 0.55 : 0.32);
      gate.visible = vis > 0.05 || done;
      const from = i === 0
        ? (run.liftTo || tmpB.set(p.x, p.y - 0.4, p.z + 1.4))
        : run.sky.gold[i - 1].position;
      gate.lookAt(from);
    });
    run.sky.rose.forEach((gate, i) => {
      const p = driftedHome(gate, spec, tSec);
      gate.position.copy(p);
      const pulse = 1 + Math.sin(tSec * 6 + i) * 0.06;
      gate.scale.setScalar(1.02 * pulse);
      gate.userData.glow.material.opacity = vis * 0.58;
      gate.visible = vis > 0.05;
      gate.lookAt(gfx.lantern.position);
      if (gate.userData.bars) {
        gate.userData.bars[0].rotation.z = 0.72 + tSec * 1.4;
        gate.userData.bars[1].rotation.z = -0.72 + tSec * 1.4;
      }
    });
    run.sky.rods.forEach((rod, i) => {
      const a = run.sky.gold[i];
      const b = run.sky.gold[i + 1];
      if (!a || !b) return;
      placeRod(rod, a.position, b.position, 1);
      const show = i < run.nextIndex;
      rod.material.opacity = show ? 0.85 : (run.blinkOff ? 0.04 : 0.18);
      rod.visible = rod.material.opacity > 0.03;
    });
  }

  function collideGates() {
    if (!isLive() || run.phase !== "fly" || !run.sky) return;
    const lp = gfx.lantern.position;
    const next = run.sky.gold[run.nextIndex];
    if (next && !next.userData.hit) {
      const dist = lp.distanceTo(next.position);
      if (dist < PASS_R) {
        threadGate(next);
        return;
      }
      if (dist < 2.05) next.userData.near = true;
      const prev = run.sky.gold[run.nextIndex - 1];
      if (prev) tmpA.copy(next.position).sub(prev.position);
      else if (run.liftTo) tmpA.copy(next.position).sub(run.liftTo);
      else tmpA.set(0, 0.3, -1);
      if (tmpA.lengthSq() < 0.0001) tmpA.set(0, 0.3, -1);
      tmpA.normalize();
      const along = tmpB.copy(lp).sub(next.position).dot(tmpA);
      if (next.userData.near && along > 0.82 && dist > PASS_R) {
        missGate(run.nextIndex);
        return;
      }
    }
    for (let i = 0; i < run.sky.rose.length; i++) {
      const rose = run.sky.rose[i];
      if (lp.distanceTo(rose.position) < ROSE_R) {
        kill("decoy");
        return;
      }
    }
  }

  function collideMeteors(dt) {
    if (!run || !run.sky) return;
    const lp = gfx.lantern.position;
    const list = run.sky.meteors;
    for (let i = list.length - 1; i >= 0; i--) {
      const m = list[i];
      m.life -= dt;
      m.mesh.position.addScaledVector(m.vel, dt);
      m.mesh.quaternion.setFromUnitVectors(upY, tmpA.copy(m.vel).normalize());
      if (isLive() && run.phase === "fly" && m.mesh.position.distanceTo(lp) < METEOR_R) {
        kill("meteor");
        return;
      }
      if (m.life <= 0 || m.mesh.position.length() > 14) {
        gfx.meteorGroup.remove(m.mesh);
        list.splice(i, 1);
      }
    }
  }

  function steerInput(dt) {
    const turn = 2.15;
    const pit = 1.55;
    if (keys.KeyW || keys.ArrowUp) steer.tPitch += pit * dt;
    if (keys.KeyS || keys.ArrowDown) steer.tPitch -= pit * dt;
    if (keys.KeyA || keys.ArrowLeft) steer.tYaw -= turn * dt;
    if (keys.KeyD || keys.ArrowRight) steer.tYaw += turn * dt;
    steer.tPitch = clamp(steer.tPitch, -0.78, 1.25);
    steer.pitch = lerp(steer.pitch, steer.tPitch, REDUCE ? 1 : 0.24);
    steer.yaw = lerp(steer.yaw, steer.tYaw, REDUCE ? 1 : 0.24);
    setHeadingFromSteer();
  }

  function flyLantern(dt) {
    const spec = run.spec;
    steerInput(dt);
    let spd = spec.speed;
    const next = run.sky && run.sky.gold[run.nextIndex];
    let align = 1;
    if (next) {
      tmpA.copy(next.position).sub(gfx.lantern.position);
      const dist = tmpA.length();
      if (dist > 0.001) {
        tmpA.multiplyScalar(1 / dist);
        align = clamp(heading.dot(tmpA), -1, 1);
        if (align > 0.45 && dist < 2.35) {
          gfx.lantern.position.addScaledVector(tmpA, (2.35 - dist) * 0.55 * dt);
        }
      }
    }
    const forward = 0.38 + 0.62 * Math.pow(Math.max(0, align), 1.35);
    spd *= forward;
    if (run.pulseT > 0) {
      run.pulseT -= dt;
      spd *= 1.55;
    }
    run.pulseCd = Math.max(0, run.pulseCd - dt);
    gfx.lantern.position.addScaledVector(heading, spd * dt);

    const p = gfx.lantern.position;
    const r = Math.hypot(p.x, p.z);
    if (r > PLAY_R) {
      const n = PLAY_R / r;
      p.x *= n;
      p.z *= n;
      steer.shake = Math.max(steer.shake, 0.45);
    }
    if (p.y < 1.08) {
      p.y = 1.08;
      steer.tPitch = Math.max(steer.tPitch, 0.18);
      steer.shake = Math.max(steer.shake, 0.3);
    }
    if (p.y > 9.2) {
      p.y = 9.2;
      steer.tPitch = Math.min(steer.tPitch, 0.2);
    }
    gfx.lantern.quaternion.setFromUnitVectors(upY, tmpA.set(heading.x, heading.y + 1.1, heading.z).normalize());
  }

  function applyCam(tSec) {
    if (run && !run.done && (run.phase === "fly" || run.phase === "lift" || run.phase === "celebrate" || run.dying)) {
      const h = heading;
      const back = run.phase === "lift" ? -4.2 : -3.55;
      tmpA.copy(gfx.lantern.position).addScaledVector(h, back);
      tmpA.y += run.phase === "lift" ? 1.35 : 1.18;
      gfx.camera.position.lerp(tmpA, REDUCE ? 1 : 0.18);
      tmpB.copy(gfx.lantern.position).addScaledVector(h, 4.1);
      tmpB.y += 0.22;
      if (run.sky && run.sky.gold[run.nextIndex] && run.phase !== "lift") {
        tmpB.lerp(run.sky.gold[run.nextIndex].position, 0.28);
      }
      gfx.lookTarget.lerp(tmpB, REDUCE ? 1 : 0.22);
      gfx.camera.lookAt(gfx.lookTarget);
      const wantFov = run.pulseT > 0 ? 74 : 64;
      gfx.camera.fov += (wantFov - gfx.camera.fov) * 0.14;
      gfx.camera.updateProjectionMatrix();
    } else {
      const yaw = Math.sin(tSec * 0.17) * 0.35;
      tmpA.set(Math.sin(yaw) * 1.6, 1.72, 3.55 + Math.cos(yaw) * 0.35);
      gfx.camera.position.lerp(tmpA, REDUCE ? 1 : 0.04);
      gfx.lookTarget.set(0.15, 2.4 + Math.sin(tSec * 0.28) * 0.35, -0.4);
      gfx.camera.lookAt(gfx.lookTarget);
      gfx.camera.fov += (64 - gfx.camera.fov) * 0.08;
      gfx.camera.updateProjectionMatrix();
    }
    if (steer.shake > 0.01) {
      gfx.camera.position.x += (Math.random() - 0.5) * steer.shake * 0.06;
      gfx.camera.position.y += (Math.random() - 0.5) * steer.shake * 0.04;
    }
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (!gfx.ready) return;
    const dt = Math.min(0.05, (now - (lastTs || now)) / 1000);
    lastTs = now;
    const tSec = now * 0.001;
    steer.shake *= 0.9;
    juiceThread *= 0.9;
    juicePulse *= 0.9;

    if (gfx.dial) gfx.dial.rotation.z = tSec * 0.15;
    gfx.lanterns.forEach((lamp, i) => {
      lamp.position.y = 2.45 + Math.sin(tSec * 1.4 + i) * 0.04;
    });
    if (gfx.firePos) {
      for (let i = 0; i < gfx.firePos.length; i += 3) {
        gfx.firePos[i + 1] += 0.0035 * (1 + (i % 5) * 0.15);
        if (gfx.firePos[i + 1] > 6.2) gfx.firePos[i + 1] = 0.3;
        gfx.firePos[i] += Math.sin(tSec + i) * 0.002;
      }
      gfx.fireGeo.attributes.position.needsUpdate = true;
    }
    if (gfx.field) gfx.field.rotation.y = tSec * 0.01;
    if (gfx.flame) {
      const s = 1 + Math.sin(tSec * 11) * 0.12 + (run && run.pulseT > 0 ? 0.55 : 0);
      gfx.flame.scale.setScalar(s);
      if (gfx.lantern.userData.glow) gfx.lantern.userData.glow.scale.setScalar(0.9 + s * 0.25);
      if (gfx.light) gfx.light.intensity = 1.2 + Math.sin(tSec * 9) * 0.2 + (run && run.pulseT > 0 ? 1.1 : 0);
    }
    if (gfx.aura) {
      const arm = gfx.aura.userData.pointArm;
      if (arm) arm.rotation.z = -1.15 + Math.sin(tSec * 1.6) * 0.08;
      gfx.aura.position.y = 0.12 + Math.sin(tSec * 1.2) * 0.02;
      if (gfx.lantern && run && !run.done) {
        gfx.aura.lookAt(gfx.lantern.position.x, gfx.lantern.position.y, gfx.lantern.position.z);
      }
    }

    if (!run || run.done) {
      gfx.lantern.rotation.y = 0.4 + Math.sin(tSec * 0.7) * 0.12;
      gfx.lantern.position.y = 0.78 + Math.sin(tSec * 1.4) * 0.03;
      if (gfx.legend) gfx.legend.visible = true;
      if (gfx.demoGold) gfx.demoGold.lookAt(gfx.camera.position);
      if (gfx.demoRose) {
        gfx.demoRose.lookAt(gfx.camera.position);
        if (gfx.demoRose.userData.bars) {
          gfx.demoRose.userData.bars[0].rotation.z = 0.72 + tSec * 1.4;
          gfx.demoRose.userData.bars[1].rotation.z = -0.72 + tSec * 1.4;
        }
      }
      if (gfx.demoMeteor) {
        const u = (tSec * 0.22) % 1;
        gfx.demoMeteor.position.set(-3.2 + u * 6.6, 3.6 + Math.sin(tSec * 2.2) * 0.25, -1.4);
        gfx.demoMeteor.quaternion.setFromUnitVectors(upY, tmpA.set(1, 0.08, 0.05).normalize());
        gfx.demoMeteor.visible = true;
      }
      applyCam(tSec);
      gfx.renderer.render(gfx.scene, gfx.camera);
      return;
    }
    if (gfx.legend) gfx.legend.visible = false;

    run.roomT += dt;
    run.phaseT += dt;
    const spec = run.spec;

    if (run.dying) {
      run.deathHold -= dt * 1000;
      updateGates(spec, run.roomT);
      applyCam(tSec);
      gfx.renderer.render(gfx.scene, gfx.camera);
      if (run.deathHold <= 0) finish(run.deathReason || "wrong");
      return;
    }

    if (run.phase === "lift") {
      const u = easeOut(clamp(run.phaseT / 0.62, 0, 1));
      gfx.lantern.position.lerpVectors(run.liftFrom, run.liftTo, u);
      aimAt(spec.gold[0][0], spec.gold[0][1], spec.gold[0][2]);
      updateGates(spec, run.roomT);
      setPhase("LIFT", spec.barker);
      if (run.phaseT >= 0.62) {
        run.phase = "fly";
        run.phaseT = 0;
        setPhase("FLY", spec.barker);
        sfx("rack");
      }
    } else if (run.phase === "fly") {
      run.blinkOff = !!(spec.blink && run.phaseT > spec.time * 0.38 && run.phaseT < spec.time * 0.38 + 1.15);
      flyLantern(dt);
      updateGates(spec, run.roomT);
      collideGates();
      if (spec.meteors) {
        run.meteorAcc += dt;
        const every = Math.max(1.15, 2.4 - spec.meteors * 0.2);
        if (run.meteorAcc > every && run.sky.meteors.length < spec.meteors + 1) {
          run.meteorAcc = 0;
          spawnMeteor();
        }
      }
      collideMeteors(dt);
      const left = Math.max(0, spec.time - run.phaseT);
      setPhase(run.blinkOff ? "BLINK" : `FLY · ${Math.ceil(left)}s`, run.blinkOff ? "The canvas blinked. Keep flying the gold path." : spec.barker);
      if (run.phaseT >= spec.time) kill("timeout");
    } else if (run.phase === "celebrate") {
      updateGates(spec, run.roomT);
      gfx.lantern.position.y += Math.sin(tSec * 8) * 0.004;
      if (run.phaseT > 0.78) {
        if (run.pendingFinish) finish(run.pendingFinish);
        else if (run.pendingNext) enterRoom(run.pendingNext, false);
      }
    }

    if (gfx.chevron && run.sky && run.sky.gold[run.nextIndex] && (run.phase === "fly" || run.phase === "lift")) {
      const gate = run.sky.gold[run.nextIndex];
      tmpA.copy(gate.position).sub(gfx.lantern.position);
      const d = tmpA.length();
      if (d > 0.001) tmpA.multiplyScalar(1 / d);
      else tmpA.set(0, 0.2, -1);
      gfx.chevron.visible = true;
      gfx.chevron.position.copy(gfx.lantern.position).addScaledVector(tmpA, 0.55);
      gfx.chevron.quaternion.setFromUnitVectors(upY, tmpA);
      gfx.chevron.scale.setScalar(0.9 + Math.sin(tSec * 8) * 0.12);
    } else if (gfx.chevron) {
      gfx.chevron.visible = false;
    }

    updateTrail();
    updateCompass();
    paintHud();
    applyCam(tSec);
    gfx.renderer.render(gfx.scene, gfx.camera);
  }

  function startLoop() {
    if (raf) return;
    lastTs = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function paintBest() {
    const state = PF.getState() || {};
    const best = Math.max(state.bestLookupTiers || 0, (state.bestDepth && state.bestDepth.lookup) || 0);
    setText("depthLookupBest", best ? String(best) : "—");
    const door = $("lookupDoorBest");
    if (door) door.textContent = best ? `Sky Tier ${best}` : "Sky Tier —";
  }

  function bindPointer() {
    const cv = canvas();
    if (!cv || cv.dataset.bound) return;
    cv.dataset.bound = "1";
    cv.addEventListener("pointerdown", (ev) => {
      if (ev.button != null && ev.button !== 0) return;
      ptr.down = true;
      ptr.moved = false;
      ptr.x = ev.clientX;
      ptr.y = ev.clientY;
      ptr.sx = ev.clientX;
      ptr.sy = ev.clientY;
      try { cv.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
      cv.classList.add("is-dragging");
    });
    cv.addEventListener("pointermove", (ev) => {
      if (!ptr.down) return;
      const dx = ev.clientX - ptr.x;
      const dy = ev.clientY - ptr.y;
      ptr.x = ev.clientX;
      ptr.y = ev.clientY;
      if (Math.abs(ev.clientX - ptr.sx) + Math.abs(ev.clientY - ptr.sy) > 8) ptr.moved = true;
      if (isLive() && (run.phase === "fly" || run.phase === "lift")) {
        steer.tYaw += dx * 0.0055;
        steer.tPitch -= dy * 0.0042;
        steer.tPitch = clamp(steer.tPitch, -0.78, 1.25);
      }
    });
    const up = (ev) => {
      if (!ptr.down) return;
      ptr.down = false;
      cv.classList.remove("is-dragging");
      try { cv.releasePointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
      if (!ptr.moved) {
        if (!run || run.done) start();
        else pulse();
      }
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
  }

  function onKeyDown(ev) {
    if (!shown) return;
    keys[ev.code] = true;
    if (ev.code === "Space" || ev.code === "Enter" || ev.code.indexOf("Arrow") === 0) ev.preventDefault();
    if (!run || run.done) {
      if (ev.code === "Space" || ev.code === "Enter") start();
      return;
    }
    if (ev.code === "Space") pulse();
  }
  function onKeyUp(ev) {
    keys[ev.code] = false;
  }

  PF.registerVendor({
    id: "lookup",
    playKey: "lookup",
    chalk: "FLY THE LANTERN — THREAD THE GOLD",
    defaults: { bestLookupTiers: 0, bestLookupScore: 0 },
    onLeave() {
      shown = false;
      if (run && !run.done) finish("leave");
      stopLoop();
      const sec = section();
      if (sec) sec.classList.remove("is-playing");
    },
    onShow() {
      shown = true;
      declareP0();
      paintBest();
      boot().then((ok) => {
        if (!ok) return;
        resize();
        startLoop();
      });
    },
    onReset() {
      if (run && !run.done) finish("leave");
      run = null;
      kit.hideResult("lookupResult");
      const verdict = $("lookupVerdict");
      if (verdict) verdict.hidden = true;
      const startBtn = $("lookupStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.hidden = false;
        startBtn.textContent = "LIFT THE LANTERN · 1 demo coin";
      }
      const pulseBtn = $("lookupPulse");
      if (pulseBtn) pulseBtn.hidden = true;
      kit.setMode(card(), "vestibule");
      restLantern();
      setText("lookupStatus", "Open GOLD hoops are the path. Barred ROSE is a liar. Ice-white streaks smash. Drag or WASD to steer. Space to pulse.");
      setText("lookupBarker", "FLY THE LANTERN · THREAD THE GOLD");
      setPhase("LOOK UP");
      paintBest();
    },
    refreshDepth(state) {
      const playing = isLive() || !!(run && run.dying);
      setText("depthLookupNow", playing && run.spec ? String(run.spec.id) : "0");
      setText("depthLookupDrawn", playing ? String(run.nextIndex) : "0");
      setText("depthLookupScore", playing ? String(run.score) : "0");
      const bestN = Math.max(
        (state && state.bestLookupTiers) || 0,
        (state && state.bestDepth && state.bestDepth.lookup) || 0
      );
      setText("depthLookupBest", bestN ? String(bestN) : "—");
      const door = $("lookupDoorBest");
      if (door) door.textContent = bestN ? `Sky Tier ${bestN}` : "Sky Tier —";
    },
    bind() {
      declareP0();
      const startBtn = $("lookupStart");
      if (startBtn) {
        startBtn.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopImmediatePropagation();
          boot().then((ok) => { if (ok) start(); });
        }, true);
      }
      const pulseBtn = $("lookupPulse");
      if (pulseBtn) {
        pulseBtn.addEventListener("pointerdown", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          pulse();
        });
      }
      const ch = $("lookupChallenge");
      if (ch) ch.addEventListener("click", () => {
        const text = ($("lookupChallengeText") && $("lookupChallengeText").textContent) || "";
        kit.copyText(text, () => { const c = $("lookupCopied"); if (c) c.hidden = false; });
      });
      bindPointer();
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("blur", () => { Object.keys(keys).forEach((k) => { keys[k] = false; }); });
      window.addEventListener("resize", resize);
      if (window.ResizeObserver && $("lookupWorld")) {
        new ResizeObserver(resize).observe($("lookupWorld"));
      }
      paintBest();
    },
  });
})();
