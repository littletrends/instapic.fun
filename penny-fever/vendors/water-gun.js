/* Water Gun Duel — 3D tent. PF only. Never booth/port 6000. Never Imagine.
 * id=water-gun · gameId=watergun · Custom hold-spray · Heat · 7 authored maps + ENDLESS coda.
 * Lane Lesson → Sine Smile → Feint Clown → Twin Mouth → Zigzag Duel → Fake-Open Fair → Mirror Lane.
 * One coin = one run. Ghost never blinks. Stall or ghost-fill stamps DRY. */
import * as THREE from "../world/lib/three.module.min.js";

(function boot() {
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) {
    requestAnimationFrame(boot);
    return;
  }
  const { $, kit } = PF;
  const GAME_ID = "watergun";
  const AUTHORED_COUNT = 7;
  const CODA_ENABLED = true;
  const RATE_MS = 0.02;
  const STAMP_MS = 720;
  const YOU_X = -1.22;
  const GHOST_X = 1.22;
  const MOUTH_Y = 1.34;
  const MOUTH_Z = 6.42;
  const PX = 0.011;
  function px(n) { return (n || 0) * PX; }
  const ZIG_PTS = [
    [-1, -1], [0.95, -0.12], [-0.92, 0.42], [1, 1], [-0.15, 0.88], [0.72, -0.95],
  ];

  const AURA = {
    ghostWin: "Aura: Ghost filled first. Mouth dodged you cold.",
    stall: "Aura: Stream dry. Clown mouth wandered off.",
    clear: "Aura: Heat won. Wrist hotter.",
    souvenir: "Aura: Heat seven locked. Souvenir — the ghost tips its hat.",
    coda: "Aura: Authored ride's over. ENDLESS — mouths keep lying.",
    deep: (n) => `Aura: Heat ${n}. Lane B felt that spray.`,
    leave: "Aura: Left the lane. Ghost still filling.",
  };
  const DEPTH_COPY = {
    tag: "DEPTH RUN · 7 authored HEATS · ENDLESS coda · 3D duel tent",
    body: "Authored duel maps, not a faster ghost: Lane Lesson → Sine Smile → Feint Clown → Twin Mouth Map → Zigzag Duel → Fake-Open Fair → Mirror Lane. After 7, ENDLESS coda. Ghost wins — or you stall — and the night stamps DRY.",
    status: "Depth run · START · 1 demo coin · 7 authored HEATS then ENDLESS",
    machine: "Spray lane · 1 demo coin · 3D authored HEATS",
    punch: "Depth run — press START. No one-tap prize.",
  };
  const WATER_LEVELS = [
    { id: 1, name: "Lane Lesson", kind: "straight", path: "horizontal", hitbox: "big", youR: 22, mouthSpeed: 0.4, yourRate: 1.0, ghostRate: 0.55, fillMax: 100, mouthFeints: false, fakeOpenChance: 0, twinMouths: false, mirrorAim: false, youAmp: 18, ghostAmp: 10, sineRise: 0, stallLimitMs: 2200, barker: "Straight lane. Hold the mouth. Ghost is slow." },
    { id: 2, name: "Sine Smile", kind: "sine", path: "sine", hitbox: "big", youR: 22, mouthSpeed: 0.52, yourRate: 1.0, ghostRate: 0.7, fillMax: 100, mouthFeints: false, fakeOpenChance: 0, twinMouths: false, mirrorAim: false, youAmp: 42, ghostAmp: 22, sineRise: 44, stallLimitMs: 2000, barker: "The mouth rides a sine. Lead the wave." },
    { id: 3, name: "Feint Clown", kind: "feint", path: "sine", hitbox: "mid", youR: 16.5, mouthSpeed: 0.62, yourRate: 1.0, ghostRate: 0.78, fillMax: 110, mouthFeints: true, fakeOpenChance: 0, twinMouths: false, mirrorAim: false, youAmp: 24, ghostAmp: 14, sineRise: 26, stallLimitMs: 1800, barker: "It fakes a dodge. Don't chase the feint." },
    { id: 4, name: "Twin Mouth Map", kind: "twinMouth", path: "twin", hitbox: "mid", youR: 16.5, mouthSpeed: 0.72, yourRate: 1.0, ghostRate: 0.82, fillMax: 110, mouthFeints: false, fakeOpenChance: 0, twinMouths: true, mirrorAim: false, youAmp: 12, ghostAmp: 10, stallLimitMs: 1700, twinPeriodMs: 2200, twinSpread: 44, twinRise: 38, barker: "Two mouths. Only the live one fills." },
    { id: 5, name: "Zigzag Duel", kind: "zigzag", path: "zigzag", hitbox: "small", youR: 12.2, mouthSpeed: 0.88, yourRate: 0.95, ghostRate: 0.95, fillMax: 120, mouthFeints: false, fakeOpenChance: 0, twinMouths: false, mirrorAim: false, youAmp: 38, ghostAmp: 22, zigAmp: 64, stallLimitMs: 1500, barker: "Diagonal zigzag. Drag the stream onto the map." },
    { id: 6, name: "Fake-Open Fair", kind: "fakeOpen", path: "sine", hitbox: "small", youR: 12.8, mouthSpeed: 0.9, yourRate: 1.22, ghostRate: 1.05, fillMax: 120, mouthFeints: false, fakeOpenChance: 0.2, twinMouths: false, mirrorAim: false, youAmp: 28, ghostAmp: 16, sineRise: 30, stallLimitMs: 1400, barker: "Sometimes the mouth lies. Fake-open is no credit. Ghost pressure high." },
    { id: 7, name: "Mirror Lane", kind: "mirror", path: "sine", hitbox: "mid", youR: 15.5, mouthSpeed: 0.78, yourRate: 0.95, ghostRate: 0.9, fillMax: 120, mouthFeints: true, fakeOpenChance: 0, twinMouths: false, mirrorAim: true, youAmp: 26, ghostAmp: 16, sineRise: 28, stallLimitMs: 1300, barker: "Your stream flips. Aim the other way." },
  ];
  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Water Gun Duel",
    depthUnit: "Heat",
    sheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
    batchSheet: "GOBLIN_BATCH02_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  let run = null;
  let holding = false;
  const keys = { left: false, right: false, up: false, down: false };
  let loopOn = false;
  let raf = 0;
  let lastTick = 0;
  let idleRoom = 1;
  let idleClock = 0;
  let hissAt = 0;
  let hitSfxAt = 0;
  const pointer = { x: 0, y: 0, over: false };
  const tmpV = new THREE.Vector3();
  const tmpV2 = new THREE.Vector3();
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const dummy = new THREE.Object3D();
  const world = { ready: false };

  function rk() { return PF.runKit || null; }
  function card() { return $("waterGunCard"); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function isLive() { return !!(run && !run.done && run.kitRun && run.kitRun.alive !== false); }

  function hitboxR(hitbox) {
    return hitbox === "big" ? 22 : hitbox === "mid" ? 16.5 : 12.2;
  }
  function waterCodaParams(n) {
    const heat = Math.max(AUTHORED_COUNT + 1, n | 0);
    const t = heat - AUTHORED_COUNT;
    const youR = Math.max(9.5, hitboxR("small") - t * 0.35);
    return {
      id: heat, name: `Inferno Lane ${heat}`, title: `Inferno Lane ${heat}`,
      kind: "coda", coda: true, path: "sine", hitbox: "small", youR,
      ghostR: youR + 5.5, mouthSpeed: Math.min(1.8, 1.05 + 0.1 * t),
      yourRate: 1.05, ghostRate: Math.min(1.55, 1.05 + 0.05 * t), fillMax: 120,
      mouthFeints: true, fakeOpenChance: 0.2, twinMouths: false, mirrorAim: false,
      stallLimitMs: Math.max(900, 1300 - t * 40), youAmp: 30 + t * 2, ghostAmp: 16 + t,
      sineRise: Math.min(44, 32 + t * 1.2), zigAmp: 28, streamWeave: 3.4 + t * 0.4,
      ghostTrack: Math.min(0.055, 0.034 + t * 0.002), ghostWobble: Math.max(1.8, 4.2 - t * 0.2),
      barker: "ENDLESS — mouths keep lying.",
    };
  }
  function waterLevel(n) {
    const heat = Math.max(1, n | 0);
    if (heat <= AUTHORED_COUNT) {
      const L = WATER_LEVELS[heat - 1];
      const youR = L.youR != null ? L.youR : hitboxR(L.hitbox);
      return Object.assign({
        coda: false, ghostR: youR + 5.5, streamWeave: 2.6 + heat * 0.35,
        ghostTrack: L.kind === "zigzag" ? 0.055 : L.kind === "twinMouth" ? 0.05 : L.kind === "straight" ? 0.03 : 0.032,
        ghostWobble: L.kind === "straight" ? 1.1 : L.kind === "zigzag" ? 2.8 : Math.max(2.4, 5.2 - heat * 0.28),
        zigAmp: L.zigAmp != null ? L.zigAmp : 64, sineRise: L.sineRise != null ? L.sineRise : 0,
        twinPeriodMs: L.twinPeriodMs || 2200, twinRise: L.twinRise != null ? L.twinRise : 38,
      }, L, { id: heat, title: L.name, name: L.name, youR, ghostR: youR + 5.5 });
    }
    if (!P0_MOUNT.codaEnabled) return null;
    return waterCodaParams(heat);
  }
  function hudStageLine(spec, won) {
    if (!spec) return `HEAT ${won | 0}`;
    if (spec.coda) return `ENDLESS · HEAT ${spec.id} · ${spec.name}`;
    return `HEAT ${spec.id} · ${spec.name}`;
  }
  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    const spec = Object.assign({
      authored: WATER_LEVELS, authoredCount: AUTHORED_COUNT, codaEnabled: CODA_ENABLED,
      codaParams: waterCodaParams, level: waterLevel, stageParams: waterLevel, watergunStageParams: waterLevel,
    }, P0_MOUNT);
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, spec); } catch (_) { /* already declared */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = spec;
    kitRun.declared = kitRun.declared || {};
    kitRun.declared[GAME_ID] = spec;
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function zigzagNorm(t, spd, phase) {
    const n = ZIG_PTS.length;
    const u = t * spd * 0.00205 + (phase || 0);
    const wrapped = ((u % n) + n) % n;
    const i = wrapped | 0;
    const f = wrapped - i;
    const a = ZIG_PTS[i];
    const b = ZIG_PTS[(i + 1) % n];
    return { nx: a[0] + (b[0] - a[0]) * f, ny: a[1] + (b[1] - a[1]) * f };
  }
  function mouthPos(spec, laneX, t, extra) {
    const amp = extra && extra.amp != null ? extra.amp : spec.youAmp;
    const spd = spec.mouthSpeed;
    const feint = (extra && extra.feint) || 0;
    const phase = (extra && extra.phase) || 0;
    const kind = spec.kind;
    const path = spec.path;
    let x = laneX;
    let y = MOUTH_Y;
    if (kind === "zigzag" || path === "zigzag") {
      const z = zigzagNorm(t, spd, phase);
      x = laneX + z.nx * px(amp) + px(feint);
      y = MOUTH_Y + z.ny * px(spec.zigAmp || 64) * 0.85;
    } else if (kind === "twinMouth" || path === "twin") {
      x = laneX + Math.sin(t * spd * 0.0024 + phase) * px(amp) * 0.35 + px(feint);
    } else if (kind === "straight" || path === "horizontal") {
      const u = (t * spd * 0.0018 + phase) % 2;
      const tri = u < 1 ? u * 2 - 1 : 3 - u * 2;
      x = laneX + tri * px(amp) * 0.7 + px(feint);
    } else {
      const wt = t * spd * 0.0048 + phase;
      const u = Math.sin(wt);
      const rise = spec.sineRise != null ? spec.sineRise : amp * 0.9;
      x = laneX + u * px(amp) + px(feint);
      y = MOUTH_Y + (1 - Math.cos(wt)) * 0.5 * px(rise);
    }
    const zLean = (kind === "zigzag" || path === "zigzag")
      ? Math.sin(t * spd * 0.0032 + phase) * 0.28
      : Math.sin(t * spd * 0.0022 + phase) * 0.08;
    return { x, y, z: MOUTH_Z + zLean };
  }
  function twinPair(spec, laneX, t, ghost) {
    const period = spec.twinPeriodMs || 2200;
    const active = Math.floor(t / period) % 2;
    const spread = px(spec.twinSpread != null ? spec.twinSpread : 44);
    const rise = px(spec.twinRise != null ? spec.twinRise : 38);
    const wob = Math.sin(t * 0.0022) * 0.04;
    return [
      { x: laneX - spread + wob, y: MOUTH_Y + rise, z: MOUTH_Z, active: active === 0, ghost },
      { x: laneX + spread - wob, y: MOUTH_Y - rise, z: MOUTH_Z, active: active === 1, ghost },
    ];
  }

  function texCanvas(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  function std(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.58, metalness: 0.08,
    }, extra || {}));
  }
  function makeGeo() {
    return {
      box: new THREE.BoxGeometry(1, 1, 1),
      sphere: new THREE.SphereGeometry(1, 18, 14),
      sphereLo: new THREE.SphereGeometry(1, 10, 8),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
      cone: new THREE.ConeGeometry(1, 1, 10),
      torus: new THREE.TorusGeometry(1, 0.18, 8, 16),
      plane: new THREE.PlaneGeometry(1, 1),
    };
  }
  function meshBox(mat, w, h, d, x, y, z) {
    const m = new THREE.Mesh(world.G.box, mat);
    m.scale.set(w, h, d);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  function meshSphere(mat, r, x, y, z) {
    const m = new THREE.Mesh(world.G.sphere, mat);
    m.scale.setScalar(r);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    return m;
  }
  function meshCyl(mat, r, h, x, y, z) {
    const m = new THREE.Mesh(world.G.cyl, mat);
    m.scale.set(r, h, r);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function woodTex() {
    return texCanvas(256, 256, (ctx) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = i % 2 ? "rgba(90,58,32,0.35)" : "rgba(212,164,90,0.08)";
        ctx.fillRect(i * 14, 0, 10, 256);
      }
      ctx.fillStyle = "rgba(20,10,6,0.25)";
      for (let i = 0; i < 12; i++) {
        ctx.fillRect(0, 18 + i * 20, 256, 2);
      }
    });
  }
  function stripeTex() {
    const t = texCanvas(256, 256, (ctx) => {
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? "#7a1830" : "#f0d4a8";
        ctx.fillRect(0, i * 32, 256, 32);
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 3);
    return t;
  }
  function waterTex() {
    const t = texCanvas(256, 256, (ctx) => {
      ctx.fillStyle = "#163a48";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 40; i++) {
        ctx.strokeStyle = `rgba(120,210,230,${0.08 + Math.random() * 0.18})`;
        ctx.beginPath();
        const y = Math.random() * 256;
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(80, y + 10, 160, y - 12, 256, y + 4);
        ctx.stroke();
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  function clownFaceTex(ghost) {
    return texCanvas(256, 256, (ctx) => {
      ctx.fillStyle = ghost ? "#c8e8ec" : "#fff4e6";
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = ghost ? "rgba(80,180,180,0.4)" : "rgba(232,90,120,0.5)";
      ctx.beginPath(); ctx.arc(78, 158, 30, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(178, 158, 30, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#1a1010";
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(52, 86); ctx.lineTo(110, 102); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(204, 86); ctx.lineTo(146, 102); ctx.stroke();
      ctx.strokeStyle = ghost ? "#2a5a5a" : "#c41e3a";
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(128, 168, 46, 0.2, Math.PI - 0.2); ctx.stroke();
    });
  }
  function signTex(title, sub, w, h) {
    return texCanvas(w || 512, h || 160, (ctx) => {
      const W = w || 512;
      const H = h || 160;
      ctx.fillStyle = "#1a1014";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.fillStyle = "#ffe6a6";
      ctx.font = "700 42px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(title, W / 2, H * 0.48);
      ctx.fillStyle = "#9ee8de";
      ctx.font = "22px Georgia, serif";
      ctx.fillText(sub || "", W / 2, H * 0.78);
    });
  }

  function makeGun(ghost) {
    const g = new THREE.Group();
    const brass = std(ghost ? 0x8ec8c4 : 0xc4a05a, { metalness: 0.72, roughness: 0.28, emissive: ghost ? 0x143838 : 0x3a2808, emissiveIntensity: 0.22 });
    const dark = std(0x1a1410, { roughness: 0.4, metalness: 0.2 });
    const barrel = meshCyl(brass, 0.045, 0.62, 0, 0.02, -0.22);
    barrel.rotation.x = -Math.PI / 2;
    g.add(barrel);
    g.add(meshBox(brass, 0.12, 0.1, 0.22, 0, -0.02, 0.02));
    const grip = meshBox(dark, 0.07, 0.18, 0.08, 0, -0.14, 0.08);
    grip.rotation.x = -0.35;
    g.add(grip);
    g.add(meshCyl(brass, 0.07, 0.04, 0, 0.04, 0.08));
    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.02, -0.54);
    g.add(muzzle);
    g.userData.muzzle = muzzle;
    g.userData.ghost = ghost;
    return g;
  }

  function makeClown(ghost) {
    const g = new THREE.Group();
    const skin = std(ghost ? 0xc8e8ec : 0xf6e4d0, {
      map: clownFaceTex(ghost),
      roughness: 0.52,
      transparent: ghost,
      opacity: ghost ? 0.78 : 1,
      emissive: ghost ? 0x1a4040 : 0x000000,
      emissiveIntensity: ghost ? 0.18 : 0,
    });
    const paint = std(ghost ? 0x3d8a8a : 0xc45a6a, { roughness: 0.45, transparent: ghost, opacity: ghost ? 0.8 : 1 });
    const gold = std(ghost ? 0xa8d8d4 : 0xd4a45a, { metalness: 0.5, roughness: 0.32 });
    const stand = meshCyl(std(0x3a2418), 0.08, 1.1, 0, 0.55, 0);
    g.add(stand);
    g.add(meshBox(std(0x5a2030), 0.55, 0.12, 0.28, 0, 0.08, 0));
    const body = meshCyl(paint, 0.16, 0.42, 0, 1.05, 0);
    g.add(body);
    const ruff = new THREE.Mesh(world.G.torus, gold);
    ruff.scale.set(0.2, 0.2, 0.12);
    ruff.rotation.x = Math.PI / 2;
    ruff.position.y = 1.28;
    g.add(ruff);
    const head = new THREE.Group();
    head.position.y = 1.52;
    g.add(head);
    const skull = meshSphere(skin, 0.28, 0, 0, 0);
    skull.material = skin;
    head.add(skull);
    const hat = new THREE.Mesh(world.G.cone, paint);
    hat.scale.set(0.2, 0.38, 0.2);
    hat.position.y = 0.4;
    head.add(hat);
    head.add(meshSphere(gold, 0.05, 0, 0.58, 0));
    const nose = meshSphere(std(ghost ? 0x5aa0a0 : 0xc41e3a, { emissive: ghost ? 0x245858 : 0x5a1020, emissiveIntensity: 0.35 }), 0.07, 0, -0.02, 0.26);
    head.add(nose);
    const eyeW = std(0xf7f2ea);
    const eyeD = std(0x1a1010);
    [-1, 1].forEach((s) => {
      head.add(meshSphere(eyeW, 0.05, s * 0.09, 0.04, 0.24));
      const pupil = meshSphere(eyeD, 0.024, s * 0.09, 0.04, 0.28);
      head.add(pupil);
      g.userData["pupil" + (s < 0 ? "L" : "R")] = pupil;
    });
    const mouth = new THREE.Group();
    mouth.position.set(0, -0.1, 0.27);
    head.add(mouth);
    const hole = meshCyl(std(0x14080c), 0.09, 0.08, 0, 0, 0);
    hole.rotation.x = Math.PI / 2;
    mouth.add(hole);
    const lip = new THREE.Mesh(world.G.torus, std(ghost ? 0x4a8888 : 0xa02038));
    lip.scale.set(0.1, 0.1, 0.07);
    mouth.add(lip);
    g.userData.head = head;
    g.userData.mouth = mouth;
    g.userData.ghost = ghost;
    g.userData.baseY = 0;
    return g;
  }

  function makeBalloon(ghost) {
    const g = new THREE.Group();
    const mat = std(ghost ? 0x6ad4c8 : 0xe85a7a, {
      roughness: 0.32, metalness: 0.14,
      emissive: ghost ? 0x1a5858 : 0x4a1020, emissiveIntensity: ghost ? 0.55 : 0.28,
    });
    const ball = meshSphere(mat, ghost ? 0.26 : 0.22, 0, 0, 0);
    g.add(ball);
    const knot = meshSphere(mat, 0.04, 0, ghost ? -0.26 : -0.22, 0);
    g.add(knot);
    const string = meshCyl(std(0xf0d09a), 0.008, 0.9, 0, -0.68, 0);
    g.add(string);
    g.userData.ball = ball;
    g.userData.mat = mat;
    g.userData.ghost = !!ghost;
    g.userData.base = ghost ? 0x6ad4c8 : 0xe85a7a;
    return g;
  }

  function makeTube(ghost) {
    const g = new THREE.Group();
    const glass = std(0x88c8d8, { transparent: true, opacity: 0.28, roughness: 0.12, metalness: 0.4 });
    const glassR = ghost ? 0.12 : 0.09;
    g.add(meshCyl(glass, glassR, 1.05, 0, 0.52, 0));
    const water = meshCyl(std(ghost ? 0x4ef0dc : 0x3a88c8, {
      transparent: true, opacity: ghost ? 0.95 : 0.82,
      emissive: ghost ? 0x1a8878 : 0x123050, emissiveIntensity: ghost ? 0.7 : 0.35,
    }), ghost ? 0.1 : 0.07, 1, 0, 0.5, 0);
    g.add(water);
    g.userData.water = water;
    g.userData.ghost = !!ghost;
    return g;
  }

  function makeFillTag(ghost) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    const m = new THREE.Mesh(world.G.plane, mat);
    m.scale.set(0.78, 0.39, 1);
    m.userData = { canvas, ctx, tex, ghost: !!ghost, last: -1 };
    paintFillTag(m, 0);
    return m;
  }

  function paintFillTag(tag, pct) {
    if (!tag || !tag.userData || !tag.userData.ctx) return;
    const n = Math.floor(clamp(pct, 0, 1) * 100);
    if (tag.userData.last === n) return;
    tag.userData.last = n;
    const ctx = tag.userData.ctx;
    const W = 256;
    const H = 128;
    const ghost = tag.userData.ghost;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = ghost ? "rgba(8, 36, 38, 0.88)" : "rgba(40, 12, 18, 0.88)";
    ctx.fillRect(6, 6, W - 12, H - 12);
    ctx.strokeStyle = ghost ? "#7ef0e0" : "#ffd08a";
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, W - 12, H - 12);
    ctx.fillStyle = ghost ? "#7ef0e0" : "#ffe6a6";
    ctx.textAlign = "center";
    ctx.font = "700 32px Georgia, serif";
    ctx.fillText(ghost ? "GHOST FILL" : "YOU FILL", W / 2, 44);
    ctx.font = "700 56px Georgia, serif";
    ctx.fillText(n + "%", W / 2, 108);
    tag.userData.tex.needsUpdate = true;
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = std(0xf0c4a8, { roughness: 0.55, emissive: 0x3a2018, emissiveIntensity: 0.1 });
    const hair = std(0x3d2418, { roughness: 0.7 });
    const dress = std(0x1e6b3c, { roughness: 0.48, emissive: 0x0a2010, emissiveIntensity: 0.22 });
    const blouse = std(0xf5f0ea, { roughness: 0.55 });
    const gold = std(0xe8b84a, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.5 });
    const heart = std(0xd22b3a, { emissive: 0xd22b3a, emissiveIntensity: 0.6, roughness: 0.4 });
    const shoes = std(0x111111, { roughness: 0.32, metalness: 0.25 });
    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(meshCyl(blouse, 0.13, 0.28, 0, 0.28, 0));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.12, 0.34, 12), dress);
    skirt.position.y = 0.06;
    hip.add(skirt);
    const gem = meshBox(heart, 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    gem.rotation.z = Math.PI / 4;
    hip.add(gem);
    const head = new THREE.Group();
    head.position.y = 0.62;
    hip.add(head);
    head.add(meshSphere(skin, 0.18, 0, 0.02, 0));
    const eyeW = std(0xf7f2ea);
    const eyeD = std(0x2a1810);
    [-1, 1].forEach((s) => {
      head.add(meshSphere(eyeW, 0.038, s * 0.055, 0.03, 0.15));
      head.add(meshSphere(eyeD, 0.02, s * 0.055, 0.03, 0.168));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), std(0xc45a6a));
    smile.position.set(0, -0.05, 0.16);
    smile.rotation.x = 2.6;
    head.add(smile);
    head.add(meshSphere(hair, 0.2, 0, 0.06, -0.02));
    [-1, 1].forEach((s) => {
      head.add(meshSphere(hair, 0.1, s * 0.18, -0.04, 0.04));
      head.add(meshSphere(heart, 0.04, s * 0.18, 0.05, 0.06));
    });
    head.add(meshBox(hair, 0.26, 0.06, 0.1, 0, 0.14, 0.14));
    const crown = new THREE.Group();
    crown.position.y = 0.22;
    head.add(crown);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold);
    crown.add(band);
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      const spike = new THREE.Mesh(world.G.cone, gold);
      spike.scale.set(0.035, h, 0.035);
      spike.position.set(x, h * 0.45, 0);
      crown.add(spike);
    });
    const crownGem = meshBox(heart, 0.055, 0.055, 0.025, 0, 0.02, 0.11);
    crownGem.rotation.z = Math.PI / 4;
    crown.add(crownGem);
    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0.0, 0);
      const len = arm ? 0.28 : 0.34;
      const bone = meshCyl(arm ? skin : dress, arm ? 0.035 : 0.042, len, 0, -len / 2, 0);
      pivot.add(bone);
      if (!arm) pivot.add(meshBox(shoes, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03));
      else pivot.add(meshSphere(skin, 0.04, 0, -len, 0));
      hip.add(pivot);
      return pivot;
    }
    g.userData = { hip, head, armL: limb(-1, true), armR: limb(1, true), mood: "idle" };
    g.scale.setScalar(1.05);
    return g;
  }

  function makeStream(ghost) {
    const n = ghost ? 28 : 40;
    const mat = new THREE.MeshBasicMaterial({
      color: ghost ? 0x7ef0e0 : 0x7ec8ff,
      transparent: true,
      opacity: ghost ? 0.55 : 0.8,
      depthWrite: false,
    });
    const mesh = new THREE.InstancedMesh(world.G.sphereLo, mat, n);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    const arr = new Float32Array(12 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: ghost ? 0xb8fff4 : 0xd8f4ff, transparent: true, opacity: 0.85,
    }));
    const group = new THREE.Group();
    group.add(mesh);
    group.add(line);
    group.userData = { mesh, line, n, ghost };
    return group;
  }

  function makeReticle(ghost) {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.012, 8, 24),
      new THREE.MeshBasicMaterial({ color: ghost ? 0x7ef0e0 : 0xffe6a6, transparent: true, opacity: 0.9 })
    );
    m.rotation.x = Math.PI / 2;
    return m;
  }

  function paintMarquee(title, sub) {
    if (!world.marquee) return;
    const tex = signTex(title, sub, 640, 180);
    world.marquee.material.map = tex;
    world.marquee.material.needsUpdate = true;
    if (world.marquee.userData.old) {
      world.marquee.userData.old.dispose();
    }
    world.marquee.userData.old = tex;
  }

  function buildWorld() {
    const canvas = $("waterGunCanvas");
    if (!canvas) return false;
    world.G = makeGeo();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1218);
    scene.fog = new THREE.Fog(0x0a1218, 7.5, 16);
    const camera = new THREE.PerspectiveCamera(52, 16 / 10, 0.08, 40);
    camera.position.set(-0.48, 1.58, 0.08);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const hemi = new THREE.HemisphereLight(0xffc8a0, 0x1a3040, 0.55);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe2c4, 0.85);
    sun.position.set(-2.2, 6.4, 3.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 18;
    sun.shadow.camera.left = -6;
    sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6;
    sun.shadow.camera.bottom = -6;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x2a2030, 0.28));

    const wood = std(0x3a2418, { map: woodTex(), roughness: 0.78 });
    wood.map.wrapS = wood.map.wrapT = THREE.RepeatWrapping;
    wood.map.repeat.set(4, 6);
    const floor = new THREE.Mesh(world.G.box, wood);
    floor.scale.set(9.4, 0.08, 12);
    floor.position.set(0, -0.04, 4.2);
    floor.receiveShadow = true;
    scene.add(floor);

    const tentMat = std(0xc45a6a, { map: stripeTex(), roughness: 0.72 });
    const wallL = new THREE.Mesh(world.G.plane, tentMat);
    wallL.scale.set(12, 5.2, 1);
    wallL.position.set(-4.3, 2.5, 4.5);
    wallL.rotation.y = Math.PI / 2;
    scene.add(wallL);
    const wallR = wallL.clone();
    wallR.position.x = 4.3;
    wallR.rotation.y = -Math.PI / 2;
    scene.add(wallR);
    const back = new THREE.Mesh(world.G.plane, std(0x2a1018, { roughness: 0.7 }));
    back.scale.set(8.8, 4.6, 1);
    back.position.set(0, 2.2, 8.9);
    scene.add(back);
    const ceil = new THREE.Mesh(world.G.plane, tentMat);
    ceil.scale.set(9, 12, 1);
    ceil.position.set(0, 4.6, 4.4);
    ceil.rotation.x = Math.PI / 2;
    scene.add(ceil);

    const bulbs = [];
    for (let i = 0; i < 7; i++) {
      const x = -3 + i * 1.0;
      const z = 1.2 + (i % 2) * 0.35;
      const bulb = meshSphere(std(0xffe0a0, { emissive: 0xffcc88, emissiveIntensity: 0.9, roughness: 0.3 }), 0.06, x, 4.15, z + 2.4);
      bulb.castShadow = false;
      scene.add(bulb);
      const pl = new THREE.PointLight(0xffcc88, 0.28, 5.5);
      pl.position.set(x, 4.0, z + 2.4);
      scene.add(pl);
      bulbs.push({ mesh: bulb, light: pl, phase: i * 0.7 });
    }

    const counter = meshBox(wood, 4.4, 0.16, 0.85, 0, 0.9, 0.55);
    scene.add(counter);
    scene.add(meshBox(std(0x2a1810), 4.4, 0.9, 0.7, 0, 0.45, 0.5));
    const rail = std(0xd4a45a, { metalness: 0.7, roughness: 0.3 });
    scene.add(meshCyl(rail, 0.03, 4.2, 0, 1.02, 0.18)).rotation.z = Math.PI / 2;

    const wtex = waterTex();
    const troughMat = std(0x1a5060, { map: wtex, roughness: 0.18, metalness: 0.55, emissive: 0x0a2838, emissiveIntensity: 0.2 });
    const trough = meshBox(troughMat, 3.6, 0.08, 4.4, 0, 0.28, 3.4);
    trough.castShadow = false;
    scene.add(trough);
    const troughLight = new THREE.PointLight(0x3aa0c8, 0.55, 7);
    troughLight.position.set(0, 0.7, 3.4);
    scene.add(troughLight);
    world.waterMap = wtex;

    const board = meshBox(std(0x5a2030), 5.4, 2.6, 0.12, 0, 1.7, 7.85);
    scene.add(board);
    const youLane = meshBox(std(0xc45a6a, { emissive: 0x3a1020, emissiveIntensity: 0.15 }), 1.7, 0.04, 5.6, YOU_X, 0.34, 3.5);
    scene.add(youLane);
    const ghostLane = meshBox(std(0x3a8a8a, { emissive: 0x102828, emissiveIntensity: 0.2 }), 1.7, 0.04, 5.6, GHOST_X, 0.34, 3.5);
    scene.add(ghostLane);

    const marquee = new THREE.Mesh(world.G.box, new THREE.MeshBasicMaterial({ map: signTex("WATER GUN DUEL", "1¢ A HEAT") }));
    marquee.scale.set(2.6, 0.7, 0.08);
    marquee.position.set(0, 3.55, 8.55);
    scene.add(marquee);
    world.marquee = marquee;

    const poster = new THREE.Mesh(world.G.plane, new THREE.MeshBasicMaterial({ color: 0x888888 }));
    poster.scale.set(1.5, 1.05, 1);
    poster.position.set(-3.55, 2.15, 6.2);
    poster.rotation.y = Math.PI / 2;
    scene.add(poster);
    new THREE.TextureLoader().load("assets/prepared/water-gun-duel.webp", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      poster.material.map = tex;
      poster.material.needsUpdate = true;
    });

    const youGun = makeGun(false);
    youGun.position.set(YOU_X + 0.15, 1.02, 0.72);
    scene.add(youGun);
    const ghostGun = makeGun(true);
    ghostGun.position.set(GHOST_X - 0.1, 1.02, 0.72);
    scene.add(ghostGun);

    const youClown = makeClown(false);
    youClown.position.set(YOU_X, 0, MOUTH_Z);
    scene.add(youClown);
    const youClownB = makeClown(false);
    youClownB.position.set(YOU_X + 0.45, 0, MOUTH_Z);
    youClownB.visible = false;
    scene.add(youClownB);
    const ghostClown = makeClown(true);
    ghostClown.position.set(GHOST_X, 0, MOUTH_Z);
    scene.add(ghostClown);
    const ghostClownB = makeClown(true);
    ghostClownB.position.set(GHOST_X - 0.45, 0, MOUTH_Z);
    ghostClownB.visible = false;
    scene.add(ghostClownB);
    const decoy = makeClown(false);
    decoy.traverse((o) => {
      if (o.material && o.material.color) {
        o.material = o.material.clone();
        o.material.transparent = true;
        o.material.opacity = 0.38;
        o.material.emissive = new THREE.Color(0x4a1020);
        o.material.emissiveIntensity = 0.35;
      }
    });
    decoy.visible = false;
    scene.add(decoy);

    const railMat = std(0xc4a05a, { metalness: 0.72, roughness: 0.28, emissive: 0x3a2808, emissiveIntensity: 0.18 });
    const youRail = meshCyl(railMat, 0.03, 2.2, YOU_X, MOUTH_Y, MOUTH_Z + 0.22);
    youRail.rotation.z = Math.PI / 2;
    scene.add(youRail);
    const ghostRail = meshCyl(railMat, 0.03, 2.2, GHOST_X, MOUTH_Y, MOUTH_Z + 0.22);
    ghostRail.rotation.z = Math.PI / 2;
    scene.add(ghostRail);
    const liveGlow = new THREE.PointLight(0xffe6a6, 0.15, 2.4);
    scene.add(liveGlow);
    const howSign = new THREE.Mesh(world.G.plane, new THREE.MeshBasicMaterial({
      map: signTex("HOLD TO SPRAY", "MOVE TO AIM · FILL FIRST", 640, 180),
    }));
    howSign.scale.set(1.55, 0.44, 1);
    howSign.position.set(0, 0.62, 2.15);
    howSign.rotation.x = -0.35;
    scene.add(howSign);

    const youBalloon = makeBalloon(false);
    youBalloon.position.set(YOU_X, 2.55, 7.35);
    scene.add(youBalloon);
    const ghostBalloon = makeBalloon(true);
    ghostBalloon.position.set(GHOST_X, 2.55, 7.35);
    scene.add(ghostBalloon);
    const youTube = makeTube(false);
    youTube.position.set(YOU_X + 0.42, 0.55, 7.35);
    scene.add(youTube);
    const ghostTube = makeTube(true);
    ghostTube.position.set(GHOST_X - 0.42, 0.55, 7.35);
    scene.add(ghostTube);
    const youNear = makeTube(false);
    youNear.position.set(-0.72, 0.42, 1.72);
    youNear.scale.set(1.15, 0.72, 1.15);
    scene.add(youNear);
    const ghostNear = makeTube(true);
    ghostNear.position.set(0.82, 0.42, 1.72);
    ghostNear.scale.set(1.35, 0.85, 1.35);
    scene.add(ghostNear);
    const youTag = makeFillTag(false);
    youTag.position.set(-0.72, 1.22, 1.85);
    scene.add(youTag);
    const ghostTag = makeFillTag(true);
    ghostTag.position.set(0.82, 1.32, 1.85);
    scene.add(ghostTag);

    const aura = makeAura();
    aura.position.set(2.55, 0, 1.45);
    aura.rotation.y = -0.7;
    scene.add(aura);

    const youStream = makeStream(false);
    scene.add(youStream);
    const ghostStream = makeStream(true);
    scene.add(ghostStream);
    const youRet = makeReticle(false);
    scene.add(youRet);
    const ghostRet = makeReticle(true);
    scene.add(ghostRet);

    const aimPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 4),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    );
    aimPlane.position.set(0, 1.3, MOUTH_Z);
    scene.add(aimPlane);

    const stampTex = signTex("DRY", "GHOST WINS", 512, 220);
    const stamp = new THREE.Mesh(world.G.plane, new THREE.MeshBasicMaterial({ map: stampTex, transparent: true }));
    stamp.scale.set(1.8, 0.78, 1);
    stamp.position.set(-0.2, 1.55, 4.2);
    stamp.visible = false;
    scene.add(stamp);

    const youSpot = new THREE.PointLight(0x9ad8ff, 0, 4.5);
    scene.add(youSpot);
    const ghostSpot = new THREE.PointLight(0x7ef0e0, 0.4, 4.2);
    scene.add(ghostSpot);

    const pool = [];
    const splashMat = new THREE.MeshBasicMaterial({ color: 0xa8e0ff, transparent: true, opacity: 0.85, depthWrite: false });
    for (let i = 0; i < 56; i++) {
      const m = new THREE.Mesh(world.G.sphereLo, splashMat.clone());
      m.scale.setScalar(0.03);
      m.visible = false;
      scene.add(m);
      pool.push({ mesh: m, vel: new THREE.Vector3(), life: 0, alive: false });
    }
    let poolI = 0;

    const youLabel = new THREE.Mesh(world.G.plane, new THREE.MeshBasicMaterial({ map: signTex("YOU", "LANE A", 256, 96) }));
    youLabel.scale.set(0.7, 0.26, 1);
    youLabel.position.set(YOU_X, 0.98, 0.12);
    youLabel.rotation.x = -0.4;
    scene.add(youLabel);
    const ghostLabel = new THREE.Mesh(world.G.plane, new THREE.MeshBasicMaterial({ map: signTex("GHOST", "LANE B", 256, 96) }));
    ghostLabel.scale.set(0.7, 0.26, 1);
    ghostLabel.position.set(GHOST_X, 0.98, 0.12);
    ghostLabel.rotation.x = -0.4;
    scene.add(ghostLabel);

    const prizes = new THREE.Group();
    prizes.position.set(3.35, 1.35, 5.2);
    scene.add(prizes);
    [0xe85a7a, 0x5ad4c8, 0xf0d09a, 0x7a4ac8].forEach((c, i) => {
      const teddy = meshSphere(std(c, { roughness: 0.7 }), 0.12, (i % 2) * 0.28, (i >> 1) * 0.28, 0);
      prizes.add(teddy);
    });

    world.ready = true;
    world.scene = scene;
    world.camera = camera;
    world.renderer = renderer;
    world.youGun = youGun;
    world.ghostGun = ghostGun;
    world.youClown = youClown;
    world.youClownB = youClownB;
    world.ghostClown = ghostClown;
    world.ghostClownB = ghostClownB;
    world.decoy = decoy;
    world.youBalloon = youBalloon;
    world.ghostBalloon = ghostBalloon;
    world.youTube = youTube;
    world.ghostTube = ghostTube;
    world.youNear = youNear;
    world.ghostNear = ghostNear;
    world.youTag = youTag;
    world.ghostTag = ghostTag;
    world.aura = aura;
    world.youStream = youStream;
    world.ghostStream = ghostStream;
    world.youRet = youRet;
    world.ghostRet = ghostRet;
    world.aimPlane = aimPlane;
    world.stamp = stamp;
    world.youSpot = youSpot;
    world.ghostSpot = ghostSpot;
    world.troughLight = troughLight;
    world.bulbs = bulbs;
    world.pool = pool;
    world.poolI = () => poolI;
    world.emit = (x, y, z, color, n, power) => {
      for (let i = 0; i < n; i++) {
        const p = pool[poolI++ % pool.length];
        p.alive = true;
        p.life = 280 + Math.random() * 420;
        p.mesh.visible = true;
        p.mesh.position.set(x, y, z);
        p.mesh.material.color.setHex(color);
        p.mesh.material.opacity = 0.9;
        p.vel.set((Math.random() - 0.5) * power, Math.random() * power, (Math.random() - 0.5) * power);
      }
    };
    world.look = new THREE.Vector3(0.12, 1.22, 6.3);
    world.toYou = new THREE.Vector3();
    world.toGhost = new THREE.Vector3();
    world.liveGlow = liveGlow;
    world.howSign = howSign;
    resize();
    return true;
  }

  function resize() {
    if (!world.ready) return;
    const canvas = $("waterGunCanvas");
    if (!canvas) return;
    const w = Math.max(2, canvas.clientWidth || 960);
    const h = Math.max(2, canvas.clientHeight || 540);
    const pr = Math.min(2, window.devicePixelRatio || 1);
    world.renderer.setPixelRatio(pr);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function placeStream(bundle, from, to, on, t) {
    const { mesh, line, n } = bundle.userData;
    const sag = 0.28;
    const pos = line.geometry.attributes.position;
    const lineN = pos.count;
    for (let i = 0; i < n; i++) {
      const u = i / Math.max(1, n - 1);
      if (!on) dummy.scale.setScalar(0.0001);
      else {
        dummy.position.lerpVectors(from, to, u);
        dummy.position.y -= sag * 4 * u * (1 - u);
        dummy.position.x += Math.sin(t * 0.042 + i * 0.7) * 0.012;
        dummy.scale.setScalar(0.028 + (1 - u) * 0.034);
      }
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = on;
    line.visible = on;
    if (on) {
      for (let i = 0; i < lineN; i++) {
        const u = i / Math.max(1, lineN - 1);
        dummy.position.lerpVectors(from, to, u);
        dummy.position.y -= sag * 4 * u * (1 - u);
        pos.setXYZ(i, dummy.position.x, dummy.position.y, dummy.position.z);
      }
      pos.needsUpdate = true;
    }
  }

  function setFillVisual(balloon, tube, pct, t) {
    const p = clamp(pct, 0, 1);
    const ghost = !!(balloon && balloon.userData && balloon.userData.ghost);
    const s = (ghost ? 0.7 : 0.55) + p * (ghost ? 1.55 : 1.35) + Math.sin(t * 0.008) * 0.03 * (0.4 + p);
    balloon.userData.ball.scale.setScalar(s);
    balloon.position.y = 2.35 + p * 0.55;
    balloon.rotation.y = t * 0.0004;
    balloon.userData.mat.emissiveIntensity = (ghost ? 0.45 : 0.2) + p * (ghost ? 1.15 : 0.55);
    const wh = 0.08 + p * 0.92;
    tube.userData.water.scale.y = wh;
    tube.userData.water.position.y = wh * 0.5;
    if (tube.userData.water.material) {
      tube.userData.water.material.emissiveIntensity = (ghost ? 0.55 : 0.3) + p * 0.9;
    }
    const near = ghost ? world.ghostNear : world.youNear;
    if (near && near.userData.water) {
      near.userData.water.scale.y = wh;
      near.userData.water.position.y = wh * 0.5;
      if (near.userData.water.material) {
        near.userData.water.material.emissiveIntensity = (ghost ? 0.7 : 0.4) + p * 1.1;
      }
    }
    paintFillTag(ghost ? world.ghostTag : world.youTag, p);
  }

  function tickAura(t, dt, mood) {
    const u = world.aura.userData;
    u.hip.rotation.y = Math.sin(t * 0.0011) * 0.1;
    u.head.rotation.y = Math.sin(t * 0.0016) * 0.16;
    u.head.rotation.z = Math.sin(t * 0.0013) * 0.04;
    if (mood === "cheer") {
      u.armR.rotation.z = -1.15 + Math.sin(t * 0.014) * 0.45;
      u.armL.rotation.z = 0.35;
    } else if (mood === "sad") {
      u.armR.rotation.z = 0.15;
      u.armL.rotation.z = -0.15;
      u.head.rotation.x = 0.22;
    } else {
      u.armR.rotation.z = -0.28 + Math.sin(t * 0.002) * 0.12;
      u.armL.rotation.z = 0.28;
      u.head.rotation.x = 0;
    }
    world.aura.userData.mood = mood;
  }

  function tickPool(dt) {
    for (let i = 0; i < world.pool.length; i++) {
      const p = world.pool[i];
      if (!p.alive) continue;
      p.life -= dt;
      p.vel.y -= 0.0024 * dt;
      p.mesh.position.addScaledVector(p.vel, dt * 0.055);
      p.mesh.material.opacity = Math.max(0, p.life / 500);
      if (p.life <= 0 || p.mesh.position.y < 0.12) {
        p.alive = false;
        p.mesh.visible = false;
      }
    }
  }

  function aimFromPointer() {
    if (!world.ready || !pointer.over) return;
    const canvas = $("waterGunCanvas");
    const r = canvas.getBoundingClientRect();
    ndc.x = ((pointer.x - r.left) / Math.max(1, r.width)) * 2 - 1;
    ndc.y = -((pointer.y - r.top) / Math.max(1, r.height)) * 2 + 1;
    ray.setFromCamera(ndc, world.camera);
    const hits = ray.intersectObject(world.aimPlane);
    if (!hits.length) return;
    const p = hits[0].point;
    if (!run) return;
    run.aimX = clamp(p.x, YOU_X - 0.92, YOU_X + 0.92);
    run.aimY = clamp(p.y, 0.72, 2.18);
  }

  function paintKitHud(spec) {
    const host = card();
    if (!host) return;
    const hud = host.querySelector(".watergun-rk-hud");
    if (!hud) return;
    if (!spec || !run || run.done) {
      hud.textContent = "";
      return;
    }
    hud.textContent = hudStageLine(spec, run.won);
  }
  function paintVestibuleCheat(spec) {
    const host = card();
    if (!host) return;
    if (!spec) spec = (run && !run.done && run.tun) ? run.tun : waterLevel(((idleRoom - 1) % AUTHORED_COUNT) + 1);
    const barker = host.querySelector(".barker-call");
    if (barker) {
      barker.textContent = spec && spec.barker
        ? `${spec.name.toUpperCase()} — ${spec.barker}`
        : "FILL IT FIRST — DON'T MISS THE MOUTH";
    }
    if (run && !run.done) return;
    const status = $("waterGunStatus");
    if (status && spec) status.textContent = `${hudStageLine(spec, 0)} — ${spec.barker || DEPTH_COPY.status}`;
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
    let copy = host.querySelector("[data-pf-depth-copy]");
    if (!copy) {
      copy = document.createElement("p");
      copy.className = "vendor-vestibule-only";
      copy.dataset.pfDepthCopy = "1";
      if (tag.parentNode) tag.parentNode.insertBefore(copy, tag.nextSibling);
      else host.appendChild(copy);
    }
    copy.textContent = DEPTH_COPY.body;
    paintKitHud(run && run.tun);
    const canvas = $("waterGunCanvas");
    if (canvas) {
      canvas.style.pointerEvents = "auto";
      canvas.classList.toggle("is-locked", !isLive());
    }
    if ((!run || run.done) && $("waterGunStatus")) paintVestibuleCheat(waterLevel(idleRoom));
  }

  function setToast(text, ms) {
    if (!run) return;
    run.toast = text;
    run.toastMs = ms;
    const el = $("waterGunToast");
    if (el) {
      el.hidden = !text;
      el.textContent = text || "";
    }
  }
  function paintOverlay() {
    const live = isLive();
    const tun = run && run.tun;
    const youPct = live && tun ? Math.floor((run.youFill / tun.fillMax) * 100) : 0;
    const ghostPct = live && tun ? Math.floor((run.ghostFill / tun.fillMax) * 100) : 0;
    const yb = $("waterGunYouFill");
    const gb = $("waterGunGhostFill");
    const yp = $("waterGunYouPct");
    const gp = $("waterGunGhostPct");
    if (yb) yb.style.width = youPct + "%";
    if (gb) gb.style.width = ghostPct + "%";
    if (yp) yp.textContent = youPct + "%";
    if (gp) gp.textContent = ghostPct + "%";
    const stall = $("waterGunStall");
    const stallFill = $("waterGunStallFill");
    const stallPct = live && tun && tun.stallLimitMs ? clamp(run.stallMs / tun.stallLimitMs, 0, 1) : 0;
    const stallWarn = live && !run.youOn && run.ghostOn && stallPct > 0.08;
    if (stall) stall.hidden = !stallWarn;
    if (stallFill) stallFill.style.width = Math.floor(stallPct * 100) + "%";
    const ghostMeter = document.querySelector("#waterGunCard .watergun-meter--ghost");
    if (ghostMeter) ghostMeter.classList.toggle("is-filling", !!(live && run.ghostOn));
    const youMeter = document.querySelector("#waterGunCard .watergun-meter--you");
    if (youMeter) youMeter.classList.toggle("is-filling", !!(live && run.youOn));
    const count = $("waterGunCount");
    if (count) {
      if (live && run.cd > 0) {
        count.hidden = false;
        count.textContent = run.cd > 450 ? hudStageLine(tun, run.won) : "SPRAY!";
      } else if (live && run.pause > 0) {
        count.hidden = false;
        count.textContent = tun && tun.coda && run.won === AUTHORED_COUNT ? "ENDLESS — ghost reloads" : "HEAT WON — balloon popped";
      } else if (!live) {
        count.hidden = false;
        count.textContent = "HOLD TO PLAY";
      } else {
        count.hidden = true;
      }
    }
    const toast = $("waterGunToast");
    if (toast) {
      const show = !!(run && run.toast && run.toastMs > 0);
      toast.hidden = !show;
      if (show) toast.textContent = run.toast;
    }
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
      } catch (_) { /* local */ }
    }
    return { gameId: GAME_ID, startedAt: Date.now(), feverNode, feverGate: null, depth: 0, score: 0, strikes: 0, alive: true };
  }
  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall */ }
    }
    return kit.persistRun(PF.getState(), GAME_ID, partial);
  }
  function saveLiveDepth() {
    if (!run) return;
    const state = PF.getState();
    if (!state) return;
    const depth = run.won | 0;
    const score = run.score | 0;
    state.bestWaterGun = Math.max(state.bestWaterGun || 0, depth);
    state.bestWaterGunScore = Math.max(state.bestWaterGunScore || 0, score);
    state.bestDepth = state.bestDepth || {};
    state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, depth);
    if (run.kitRun) { run.kitRun.depth = depth; run.kitRun.score = score; }
    if (typeof PF.saveState === "function") PF.saveState();
    if (typeof PF.refreshDepth === "function") {
      try { PF.refreshDepth(); } catch (_) {}
    }
  }
  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0, score: partial.score | 0,
      deathReason: partial.deathReason || "ghost_win",
      cashedOut: !!partial.cashedOut, meta: partial.meta || {},
    };
    if (state) {
      state.bestWaterGun = Math.max(state.bestWaterGun || 0, payload.depth);
      state.bestWaterGunScore = Math.max(state.bestWaterGunScore || 0, payload.score);
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
    }
    closeKitRun(payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function startHeat(heat) {
    const tun = waterLevel(heat);
    if (!tun) {
      $("waterGunStatus").textContent = AURA.souvenir;
      PF.setAura("celebrate");
      finish("souvenir");
      return;
    }
    run.heat = heat;
    run.tun = tun;
    run.youFill = 0;
    run.ghostFill = 0;
    run.youOn = false;
    run.ghostOn = false;
    run.aimX = YOU_X;
    run.aimY = MOUTH_Y;
    run.streamX = YOU_X;
    run.streamY = MOUTH_Y;
    run.ghostAimX = GHOST_X;
    run.ghostAimY = MOUTH_Y;
    run.feintDecoy = null;
    run.feintMs = tun.mouthFeints ? 900 : 0;
    run.feintFlash = 0;
    run.fakeOpen = false;
    run.fakeMs = 0;
    run.stallMs = 0;
    run.toast = "";
    run.toastMs = 0;
    run.cd = 900;
    run.pause = 0;
    run.popMs = 0;
    paintKitHud(tun);
    if (rk() && typeof rk().reportDepth === "function") {
      rk().reportDepth(run.kitRun, tun.id, { name: tun.name, coda: !!tun.coda });
    }
    $("waterGunStatus").textContent = tun.coda && heat === AUTHORED_COUNT + 1
      ? AURA.coda
      : `${hudStageLine(tun, run.won)} — ${tun.barker}`;
    paintVestibuleCheat(tun);
    paintMarquee(tun.name.toUpperCase(), tun.coda ? "ENDLESS" : `HEAT ${tun.id}`);
    if (world.youClownB) world.youClownB.visible = !!tun.twinMouths;
    if (world.ghostClownB) world.ghostClownB.visible = !!tun.twinMouths;
  }

  function start() {
    if (run && !run.done) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      $("waterGunStatus").textContent = "Out of demo coins · grant a pass";
      PF.refreshNightBoard();
      return;
    }
    ensureWorld();
    const tun = waterLevel(1);
    run = {
      done: false, kitRun, t: 0, heat: 1, won: 0, score: 0, tun,
      youFill: 0, ghostFill: 0, youOn: false, ghostOn: false,
      aimX: YOU_X, aimY: MOUTH_Y, streamX: YOU_X, streamY: MOUTH_Y,
      ghostAimX: GHOST_X, ghostAimY: MOUTH_Y,
      feintDecoy: null, feintMs: 0, feintFlash: 0,
      fakeOpen: false, fakeMs: 0, stallMs: 0, cd: 900, pause: 0,
      toast: "", toastMs: 0, closedStamp: false, popMs: 0, mood: "idle",
    };
    holding = false;
    keys.left = keys.right = keys.up = keys.down = false;
    const startBtn = $("waterGunStart");
    if (startBtn) { startBtn.disabled = true; }
    if ($("waterGunVerdict")) $("waterGunVerdict").hidden = true;
    kit.hideResult("waterGunResult");
    const resultRoot = $("waterGunResult");
    if (resultRoot) {
      resultRoot.classList.remove("is-stall", "is-ghost");
    }
    PF.setTier("waterGunTier", "", "");
    kit.setMode(card(), "play");
    setHoldLock(true);
    if (world.ghostBalloon) world.ghostBalloon.visible = true;
    if (world.youTag) world.youTag.userData.last = -1;
    if (world.ghostTag) world.ghostTag.userData.last = -1;
    stampDepthCopy();
    kitRun.depth = 0;
    kitRun.score = 0;
    startHeat(1);
    PF.focusCard("waterGunCard", true);
    PF.setAura("think");
    if (world.stamp) world.stamp.visible = false;
    resize();
  }

  function step(dt) {
    const tun = run.tun;
    if (keys.left) run.aimX -= 0.0016 * dt;
    if (keys.right) run.aimX += 0.0016 * dt;
    if (keys.up) run.aimY += 0.0016 * dt;
    if (keys.down) run.aimY -= 0.0016 * dt;
    aimFromPointer();
    run.aimX = clamp(run.aimX, YOU_X - 0.92, YOU_X + 0.92);
    run.aimY = clamp(run.aimY, 0.72, 2.18);

    const heatLive = run.pause <= 0 && run.cd <= 0;
    if (heatLive && tun.mouthFeints) {
      run.feintMs -= dt;
      if (run.feintDecoy) {
        run.feintDecoy.ms -= dt;
        if (run.feintDecoy.ms <= 0) run.feintDecoy = null;
      } else if (run.feintMs <= 0) {
        const real = mouthPos(tun, YOU_X, run.t, { amp: tun.youAmp, phase: 0.4 });
        const jump = (Math.random() < 0.5 ? 1 : -1) * (0.42 + tun.id * 0.02);
        run.feintDecoy = {
          x: clamp(real.x + jump, YOU_X - 0.85, YOU_X + 0.85),
          y: clamp(real.y + 0.08, 0.85, 2.0),
          z: MOUTH_Z, ms: 720, r: px(tun.youR),
        };
        run.feintMs = 1500 + Math.random() * 900;
        run.feintFlash = 320;
        setToast("FEINT — don't chase", 640);
        $("waterGunStatus").textContent = "Feint — that's a fake. Stay on the live mouth.";
      }
    }
    if (run.feintFlash > 0) run.feintFlash -= dt;
    if (run.toastMs > 0) run.toastMs -= dt;
    else run.toast = "";

    if (heatLive && tun.fakeOpenChance > 0) {
      run.fakeMs -= dt;
      if (run.fakeMs <= 0) {
        run.fakeOpen = Math.random() < tun.fakeOpenChance;
        run.fakeMs = run.fakeOpen ? 640 : 2200 + Math.random() * 900;
        if (run.fakeOpen) {
          setToast("FAKE-OPEN — no credit", 720);
          $("waterGunStatus").textContent = "Fake-open — no credit, sugar.";
        }
      }
    }

    const youPos = mouthPos(tun, YOU_X, run.t, { amp: tun.youAmp, phase: 0.4 });
    const ghostPos = mouthPos(tun, GHOST_X, run.t, { amp: tun.ghostAmp, phase: 2.1 });
    let youTarget = youPos;
    let ghostTarget = ghostPos;
    if (tun.twinMouths) {
      const yours = twinPair(tun, YOU_X, run.t, false);
      const ghosts = twinPair(tun, GHOST_X, run.t, true);
      youTarget = yours.find((m) => m.active) || yours[0];
      ghostTarget = ghosts.find((m) => m.active) || ghosts[0];
    }
    const track = 1 - Math.exp(-tun.ghostTrack * dt);
    run.ghostAimX += (ghostTarget.x - run.ghostAimX) * track;
    run.ghostAimY += (ghostTarget.y - run.ghostAimY) * track;
    const weave = Math.sin(run.t * 0.01) * px(tun.streamWeave) * 0.85;
    let sx = run.aimX + weave;
    if (tun.mirrorAim) sx = YOU_X * 2 - sx;
    run.streamX = clamp(sx, YOU_X - 0.95, YOU_X + 0.95);
    run.streamY = run.aimY;
    run.youMouth = youTarget;
    run.ghostMouth = ghostTarget;

    if (run.pause > 0) {
      run.pause -= dt;
      if (run.pause <= 0) startHeat(run.heat + 1);
      return;
    }
    if (run.cd > 0) {
      run.cd -= dt;
      return;
    }

    const zOff = ((youTarget.z != null ? youTarget.z : MOUTH_Z) - MOUTH_Z);
    const youDist = Math.hypot(run.streamX - youTarget.x, run.streamY - youTarget.y, zOff * 0.85);
    const hitR = px(tun.youR) * 1.15;
    const onMouth = holding && youDist <= hitR;
    let chasingFeint = false;
    if (run.feintDecoy && holding) {
      const fd = Math.hypot(run.streamX - run.feintDecoy.x, run.streamY - run.feintDecoy.y);
      if (fd <= (run.feintDecoy.r || hitR) * 1.3 && fd + 0.05 < youDist) {
        chasingFeint = true;
        setToast("FEINT — that's a fake", 360);
        $("waterGunStatus").textContent = "Feint — that's a fake.";
      }
    }
    run.youOn = onMouth && !run.fakeOpen && !chasingFeint;
    if (tun.twinMouths && holding) {
      const yours = twinPair(tun, YOU_X, run.t, false);
      const shut = yours.find((m) => !m.active);
      if (shut) {
        const shutDist = Math.hypot(run.streamX - shut.x, run.streamY - shut.y);
        if (shutDist <= hitR && !onMouth) {
          setToast("WRONG MOUTH — only LIVE fills", 360);
          $("waterGunStatus").textContent = "Wrong mouth — only the live one fills.";
        }
      }
      const period = tun.twinPeriodMs || 2200;
      const left = period - (run.t % period);
      if (left < 420 && left > 40) setToast("SWAP", 180);
    }
    const ghostDist = Math.hypot(run.ghostAimX - ghostTarget.x, run.ghostAimY - ghostTarget.y);
    run.ghostOn = ghostDist <= px(tun.ghostR) * 1.05;
    if (run.youOn) {
      run.youFill = Math.min(tun.fillMax, run.youFill + tun.yourRate * RATE_MS * dt);
      if (run.t > hitSfxAt) {
        kit.sfx("sink");
        hitSfxAt = run.t + 160;
        world.emit(youTarget.x, youTarget.y, youTarget.z + 0.12, 0xa8e8ff, 3, 0.035);
      }
    } else if (onMouth && run.fakeOpen) {
      setToast("FAKE-OPEN — no credit", 280);
      $("waterGunStatus").textContent = "Fake-open — no credit, sugar.";
    }
    if (run.ghostOn) {
      run.ghostFill = Math.min(tun.fillMax, run.ghostFill + tun.ghostRate * RATE_MS * dt);
    }
    if (holding && run.t > hissAt) {
      kit.sfx("spit");
      hissAt = run.t + 90;
    }

    const covering = run.youOn || (onMouth && run.fakeOpen) || chasingFeint;
    if (covering) run.stallMs = 0;
    else if (run.ghostOn) {
      run.stallMs += dt;
      if (run.stallMs >= tun.stallLimitMs) {
        finish("stall");
        return;
      }
    }

    if (run.youFill >= tun.fillMax && run.youFill >= run.ghostFill) {
      const leftover = Math.max(0, Math.floor(run.youFill - run.ghostFill));
      run.won += 1;
      run.score += 300 + leftover;
      run.youFill = tun.fillMax;
      saveLiveDepth();
      if (rk() && typeof rk().reportDepth === "function") {
        rk().reportDepth(run.kitRun, run.won, { name: tun.name, coda: !!tun.coda });
      }
      kit.sfx("rack");
      PF.setAura("celebrate");
      run.mood = "cheer";
      world.emit(YOU_X, 2.7, 7.35, 0xffd08a, 18, 0.08);
      world.emit(YOU_X, 2.7, 7.35, 0xe85a7a, 10, 0.06);
      const next = waterLevel(run.heat + 1);
      if (!next) {
        $("waterGunStatus").textContent = AURA.souvenir;
        finish("souvenir");
        return;
      }
      $("waterGunStatus").textContent = next.coda && run.won === AUTHORED_COUNT ? AURA.coda : AURA.clear;
      run.pause = 780;
      return;
    }
    if (run.ghostFill >= tun.fillMax) finish("ghost_win");
  }

  function auraLine(reason, won) {
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "leave") return AURA.leave;
    if (won >= 6) return AURA.deep(won);
    if (reason === "stall") return AURA.stall;
    if (reason === "ghost_win") return AURA.ghostWin;
    const kitRun = rk();
    if (kitRun && typeof kitRun.auraDeathLine === "function") {
      return `Aura: ${kitRun.auraDeathLine(GAME_ID, won, reason)}`;
    }
    return AURA.ghostWin;
  }
  function challengeLine(n) {
    const kitRun = rk();
    if (kitRun && typeof kitRun.challengeText === "function") {
      return kitRun.challengeText("Water Gun heat", n | 0, GAME_ID);
    }
    return `Beat my Water Gun heat ${n | 0} on Penny Fever`;
  }
  function revealWaterResult(deathReason) {
    if (!run) return;
    const won = run.won;
    const heat = run.heat;
    const score = run.score;
    stampDepthCopy();
    const startBtn = $("waterGunStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "SPRAY AGAIN · 1 demo coin";
    }
    PF.focusCard("waterGunCard", false);
    kit.setMode(card(), "result");
    paintKitHud(null);
    const roomName = (run.tun && run.tun.name) || "";
    const line = `HEAT ${won}${roomName ? " · " + roomName : ""} · SCORE ${score}`;
    const aura = auraLine(deathReason, won);
    const challenge = challengeLine(won);
    $("waterGunVerdict").hidden = false;
    $("waterGunVerdict").textContent = deathReason === "souvenir"
      ? `Souvenir clear. ${line} · authored ride done.`
      : deathReason === "leave"
        ? `Stepped off the lane · ${line}`
        : deathReason === "stall"
          ? `STALL. Stream dry while ghost kept filling. ${line} · fell on heat ${heat}.`
          : `GHOST WINS. Lane B filled first. ${line} · fell on heat ${heat}.`;
    kit.fillResult({
      root: "waterGunResult",
      depth: "waterGunResultDepth",
      score: "waterGunResultScore",
      aura: "waterGunResultAura",
      copied: "waterGunCopied",
    }, {
      depthLine: `HEAT ${won}${roomName ? " · " + roomName : ""}`,
      scoreLine: deathReason === "stall"
        ? `SCORE ${score} · STALL`
        : deathReason === "ghost_win"
          ? `SCORE ${score} · GHOST WINS`
          : `SCORE ${score} · ${deathReason}`,
      auraLine: aura,
    });
    const ch = $("waterGunChallengeText");
    if (ch) ch.textContent = challenge;
    const reasonEl = $("waterGunResultReason");
    const resultRoot = $("waterGunResult");
    if (resultRoot) {
      resultRoot.classList.toggle("is-stall", deathReason === "stall");
      resultRoot.classList.toggle("is-ghost", deathReason === "ghost_win");
    }
    if (reasonEl) {
      reasonEl.textContent = deathReason === "stall"
        ? "STALL — stream dry while the ghost advanced"
        : deathReason === "ghost_win"
          ? "GHOST WINS — lane B filled first"
          : deathReason === "souvenir"
            ? "SOUVENIR — authored heats cleared"
            : deathReason === "leave"
              ? "LEFT THE LANE"
              : "";
    }
    const tierLabel = deathReason === "stall" ? "STALL"
      : deathReason === "ghost_win" ? "GHOST WINS"
        : won > 0 ? `HEATS ${won}` : "DRY";
    PF.setTier("waterGunTier", tierLabel, won > 0 && deathReason !== "stall" && deathReason !== "ghost_win" ? "perfect" : "miss");
    $("waterGunStatus").textContent = deathReason === "souvenir"
      ? "Souvenir — authored heats cleared."
      : deathReason === "leave"
        ? "Left the lane."
        : deathReason === "stall"
          ? "STALL — you stopped hitting while the ghost kept filling."
          : "GHOST WINS — lane B filled first.";
    const ok = won > 0 || deathReason === "souvenir";
    if (ok) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Water gun");
      PF.setAura(won >= 4 ? "celebrate" : "point");
      if (deathReason !== "leave") PF.showBanner(true, `HEATS ${won}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Water gun miss");
      PF.setAura("badLuck");
      if (deathReason !== "leave") {
        PF.showBanner(false, deathReason === "stall" ? "STALL" : "GHOST WINS", aura);
      }
    }
    PF.refreshNightBoard();
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    holding = false;
    keys.left = keys.right = keys.up = keys.down = false;
    const deathReason = reason === "souvenir" ? "souvenir"
      : reason === "leave" ? "leave"
        : (reason === "stall" ? "stall" : "ghost_win");
    run.closedStamp = deathReason !== "leave" && deathReason !== "souvenir";
    run.deathFx = deathReason;
    run.mood = run.closedStamp ? "sad" : "cheer";
    if (run.closedStamp) kit.sfx("stamp");
    if (deathReason === "ghost_win" && world.ready && world.ghostBalloon) {
      const gp = world.ghostBalloon.position;
      world.emit(gp.x, gp.y, gp.z, 0x7ef0e0, 22, 0.1);
      world.emit(gp.x, gp.y, gp.z, 0xe8fff8, 10, 0.06);
      world.ghostBalloon.visible = false;
    }
    if (deathReason === "stall" && world.ready && world.youBalloon && world.youBalloon.userData.mat) {
      world.youBalloon.userData.mat.emissiveIntensity = 0.06;
    }
    if (run.closedStamp) showDeathStamp(deathReason);
    else if (world.stamp) world.stamp.visible = false;
    setHoldLock(false);
    persistDepth({
      depth: run.won, score: run.score, deathReason,
      cashedOut: deathReason === "souvenir",
      meta: {
        heat: run.heat, room: run.tun && run.tun.name, coda: !!(run.tun && run.tun.coda),
        youFill: run.youFill, ghostFill: run.ghostFill,
      },
    });
    if (run.closedStamp) setTimeout(() => revealWaterResult(deathReason), STAMP_MS);
    else revealWaterResult(deathReason);
  }

  function punchStart() {
    start();
  }

  function showDeathStamp(kind) {
    if (!world.stamp) return;
    const stall = kind === "stall";
    const title = stall ? "STALL" : "GHOST WINS";
    const sub = stall ? "STREAM DRY — YOU STOPPED HITTING" : "LANE B FILLED FIRST";
    const tex = signTex(title, sub, 640, 220);
    if (world.stamp.userData.old) {
      try { world.stamp.userData.old.dispose(); } catch (_) { /* ignore */ }
    }
    world.stamp.material.map = tex;
    world.stamp.material.needsUpdate = true;
    world.stamp.userData.old = tex;
    world.stamp.visible = true;
    const toast = $("waterGunToast");
    if (toast) {
      toast.hidden = false;
      toast.textContent = stall ? "STALL — STREAM DRY" : "GHOST FILLED FIRST";
      toast.classList.toggle("is-stall", stall);
      toast.classList.toggle("is-ghost", !stall);
    }
  }

  function setHoldLock(on) {
    const cab = document.getElementById("cabinet-water-gun");
    if (cab) cab.classList.toggle("is-hold-lock", !!on);
  }

  function syncScene(t, dt) {
    if (!world.ready) return;
    const tun = (run && run.tun) || waterLevel(((idleRoom - 1) % AUTHORED_COUNT) + 1);
    const playing = isLive();
    const youFill = playing ? run.youFill / tun.fillMax : 0.28 + Math.sin(t * 0.0012) * 0.08;
    const ghostFill = playing ? run.ghostFill / tun.fillMax : 0.34 + Math.cos(t * 0.001) * 0.1;
    const youTarget = playing && run.youMouth
      ? run.youMouth
      : mouthPos(tun, YOU_X, t, { amp: tun.youAmp, phase: 0.4 });
    const ghostTarget = playing && run.ghostMouth
      ? run.ghostMouth
      : mouthPos(tun, GHOST_X, t, { amp: tun.ghostAmp, phase: 2.1 });

    if (tun.twinMouths) {
      const yours = twinPair(tun, YOU_X, playing ? run.t : t, false);
      const ghosts = twinPair(tun, GHOST_X, playing ? run.t : t, true);
      world.youClown.visible = true;
      world.youClownB.visible = true;
      world.ghostClown.visible = true;
      world.ghostClownB.visible = true;
      world.youClown.position.set(yours[0].x, yours[0].y - 1.42, yours[0].z || MOUTH_Z);
      world.youClownB.position.set(yours[1].x, yours[1].y - 1.42, yours[1].z || MOUTH_Z);
      world.ghostClown.position.set(ghosts[0].x, ghosts[0].y - 1.42, ghosts[0].z || MOUTH_Z);
      world.ghostClownB.position.set(ghosts[1].x, ghosts[1].y - 1.42, ghosts[1].z || MOUTH_Z);
      world.youClown.userData.mouth.scale.setScalar(yours[0].active && !(playing && run.fakeOpen) ? 1 : 0.35);
      world.youClownB.userData.mouth.scale.setScalar(yours[1].active && !(playing && run.fakeOpen) ? 1 : 0.35);
    } else {
      world.youClownB.visible = false;
      world.ghostClownB.visible = false;
      world.youClown.visible = true;
      world.ghostClown.visible = true;
      world.youClown.position.set(youTarget.x, youTarget.y - 1.42, youTarget.z != null ? youTarget.z : MOUTH_Z);
      world.ghostClown.position.set(ghostTarget.x, ghostTarget.y - 1.42, ghostTarget.z != null ? ghostTarget.z : MOUTH_Z);
      const open = !(playing && run.fakeOpen);
      world.youClown.userData.mouth.scale.setScalar(open ? 1 : 0.22);
    }
    if (world.liveGlow) {
      const glowOn = !(playing && run.fakeOpen);
      world.liveGlow.position.set(
        world.youClown.position.x,
        world.youClown.position.y + 1.42,
        world.youClown.position.z + 0.2
      );
      world.liveGlow.intensity = glowOn ? (playing && run.youOn ? 1.8 : 0.85) : 0.12;
      world.liveGlow.color.setHex(playing && run.youOn ? 0x7ef0a0 : 0xffe6a6);
    }
    if (world.howSign) world.howSign.visible = !playing;

    if (playing && run.feintDecoy) {
      world.decoy.visible = true;
      world.decoy.position.set(run.feintDecoy.x, run.feintDecoy.y - 1.42, MOUTH_Z);
    } else world.decoy.visible = false;

    const streamOn = playing ? holding && run.cd <= 0 && run.pause <= 0 : true;
    const ghostOn = !playing || (run.cd <= 0 && run.pause <= 0);
    const toYouX = playing ? run.streamX : youTarget.x;
    const toYouY = playing ? run.streamY : youTarget.y;
    world.youGun.position.set(YOU_X + 0.12, 1.02, 0.72);
    if (streamOn) world.youGun.position.z += Math.sin(t * 0.06) * 0.012;
    if (streamOn) world.youGun.lookAt(toYouX, toYouY, MOUTH_Z);
    else world.youGun.lookAt(YOU_X, MOUTH_Y, MOUTH_Z);
    world.youGun.updateMatrixWorld();
    world.youGun.userData.muzzle.getWorldPosition(tmpV2);

    const gAimX = playing ? run.ghostAimX : ghostTarget.x;
    const gAimY = playing ? run.ghostAimY : ghostTarget.y;
    world.ghostGun.lookAt(gAimX, gAimY, MOUTH_Z);
    world.ghostGun.updateMatrixWorld();
    world.ghostGun.userData.muzzle.getWorldPosition(tmpV);
    placeStream(world.youStream, tmpV2, world.toYou.set(toYouX, toYouY, MOUTH_Z), streamOn, t);
    placeStream(world.ghostStream, tmpV, world.toGhost.set(gAimX, gAimY, MOUTH_Z), ghostOn, t + 200);

    world.youRet.position.set(playing ? run.streamX : youTarget.x, playing ? run.streamY : youTarget.y, MOUTH_Z + 0.02);
    world.youRet.material.color.setHex(playing && run.youOn ? 0x7ef0a0 : (playing && run.fakeOpen ? 0xc41e3a : 0xffe6a6));
    world.ghostRet.position.set(gAimX, gAimY, MOUTH_Z + 0.02);
    world.youSpot.position.copy(tmpV2);
    world.youSpot.intensity = streamOn ? 1.35 : 0;
    world.ghostSpot.position.copy(tmpV);
    world.ghostSpot.intensity = ghostOn ? 0.55 : 0.15;

    setFillVisual(world.youBalloon, world.youTube, youFill, t);
    setFillVisual(world.ghostBalloon, world.ghostTube, ghostFill, t);
    const deathFx = run && run.deathFx;
    if (world.ghostBalloon) world.ghostBalloon.visible = deathFx !== "ghost_win";
    if (world.youTag && world.camera) world.youTag.lookAt(world.camera.position);
    if (world.ghostTag && world.camera) world.ghostTag.lookAt(world.camera.position);
    const stallSputter = deathFx === "stall";
    if (stallSputter && world.youStream) {
      placeStream(world.youStream, tmpV2, world.toYou, false, t);
    }

    const mood = playing ? (run.mood || (run.youOn ? "cheer" : "idle")) : "idle";
    tickAura(t, dt, mood);
    tickPool(dt);

    world.bulbs.forEach((b) => {
      const pulse = 0.7 + Math.sin(t * 0.003 + b.phase) * 0.3;
      b.light.intensity = 0.18 + pulse * 0.16;
      b.mesh.material.emissiveIntensity = 0.6 + pulse * 0.5;
    });
    if (world.waterMap) world.waterMap.offset.x = (t * 0.00008) % 1;
    world.troughLight.intensity = 0.4 + (streamOn ? 0.35 : 0) + Math.sin(t * 0.004) * 0.08;
    world.stamp.visible = !!(run && run.closedStamp);

    const cam = world.camera;
    const base = playing
      ? { x: -0.48, y: 1.56, z: 0.1 }
      : { x: -0.35 + Math.sin(t * 0.00035) * 0.22, y: 1.62, z: 0.05 + Math.cos(t * 0.00028) * 0.12 };
    cam.position.x = lerp(cam.position.x, base.x, 0.06);
    cam.position.y = lerp(cam.position.y, base.y, 0.06);
    cam.position.z = lerp(cam.position.z, base.z, 0.06);
    if (streamOn) cam.position.z += Math.sin(t * 0.05) * 0.01;
    const lookX = playing ? lerp(-0.15, 0.35, clamp((run.aimX - YOU_X) / 1.6 + 0.5, 0, 1)) : 0.12;
    const lookY = playing ? 1.18 + (run.aimY - MOUTH_Y) * 0.18 : 1.22;
    world.look.x = lerp(world.look.x, lookX, 0.08);
    world.look.y = lerp(world.look.y, lookY, 0.08);
    cam.lookAt(world.look.x, world.look.y, 6.3);
  }

  function loop(now) {
    if (!loopOn) return;
    if (!lastTick) lastTick = now;
    const dt = Math.min(32, now - lastTick);
    lastTick = now;
    if (isLive()) {
      run.t += dt;
      step(dt);
      if (typeof PF.refreshDepth === "function") PF.refreshDepth();
    } else {
      idleClock += dt;
      if (idleClock > 4200) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        paintVestibuleCheat(waterLevel(idleRoom));
        if (!run || run.done) paintMarquee(waterLevel(idleRoom).name.toUpperCase(), "STEP INSIDE");
      }
    }
    syncScene(isLive() ? run.t : now, dt);
    paintOverlay();
    if (world.ready) world.renderer.render(world.scene, world.camera);
    raf = requestAnimationFrame(loop);
  }
  function startLoop() {
    if (loopOn) return;
    loopOn = true;
    lastTick = 0;
    raf = requestAnimationFrame(loop);
  }
  function stopLoop() {
    loopOn = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function ensureWorld() {
    if (world.ready) { resize(); return true; }
    try {
      return buildWorld();
    } catch (err) {
      const st = $("waterGunStatus");
      if (st) st.textContent = "Tent lights flickered. Spray anyway — or step back into the alley.";
      return false;
    }
  }

  PF.registerVendor({
    id: "water-gun",
    playKey: "watergun",
    chalk: "First to fill. The ghost lane never blinks.",
    defaults: { bestWaterGun: 0, bestWaterGunScore: 0 },
    onLeave() {
      if (run && !run.done) finish("leave");
      setHoldLock(false);
      stopLoop();
    },
    onShow() {
      stampDepthCopy();
      ensureWorld();
      startLoop();
      resize();
    },
    onReset() {
      if (run && !run.done) finish("leave");
      run = null;
      holding = false;
      keys.left = keys.right = keys.up = keys.down = false;
      setHoldLock(false);
      if ($("waterGunVerdict")) $("waterGunVerdict").hidden = true;
      kit.hideResult("waterGunResult");
      if ($("waterGunStart")) {
        $("waterGunStart").disabled = false;
        $("waterGunStart").textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      if (world.stamp) world.stamp.visible = false;
      stampDepthCopy();
      startLoop();
    },
    refreshDepth(state) {
      const now = $("depthGunNow");
      if (now) now.textContent = run && !run.done ? String(run.won) : "0";
      const best = $("depthGunBest");
      const bestN = Math.max(state.bestWaterGun || 0, (state.bestDepth && state.bestDepth.watergun) || 0);
      if (best) best.textContent = bestN ? String(bestN) : "—";
      const sc = $("depthGunScore");
      if (sc) sc.textContent = run && !run.done ? String(run.score) : "0";
      const bs = $("depthGunBestScore");
      if (bs) bs.textContent = state.bestWaterGunScore ? String(state.bestWaterGunScore) : "—";
    },
    bind() {
      declareP0();
      const startBtn = $("waterGunStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = $("waterGunCanvas");
      const stage = $("waterGunStage") || (canvas && canvas.parentNode);
      if (canvas) {
        const armHold = (clientX, clientY) => {
          pointer.over = true;
          if (clientX != null) pointer.x = clientX;
          if (clientY != null) pointer.y = clientY;
          if (!isLive()) {
            punchStart();
            if (!isLive()) return false;
          }
          holding = true;
          setHoldLock(true);
          aimFromPointer();
          return true;
        };
        canvas.addEventListener("pointerdown", (ev) => {
          ev.preventDefault();
          armHold(ev.clientX, ev.clientY);
          try { canvas.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
        });
        canvas.addEventListener("pointermove", (ev) => {
          if (holding) ev.preventDefault();
          pointer.over = true;
          pointer.x = ev.clientX;
          pointer.y = ev.clientY;
          if (isLive()) aimFromPointer();
        });
        canvas.addEventListener("pointerenter", () => { pointer.over = true; });
        canvas.addEventListener("pointerleave", () => { pointer.over = false; });
        const release = () => { holding = false; };
        canvas.addEventListener("pointerup", release);
        canvas.addEventListener("pointercancel", release);
        const onTouchStart = (ev) => {
          ev.preventDefault();
          const t = ev.touches && ev.touches[0];
          if (t) armHold(t.clientX, t.clientY);
          else armHold();
        };
        const onTouchMove = (ev) => {
          if (!holding && !isLive()) return;
          ev.preventDefault();
          const t = ev.touches && ev.touches[0];
          if (!t) return;
          pointer.over = true;
          pointer.x = t.clientX;
          pointer.y = t.clientY;
          if (isLive()) aimFromPointer();
        };
        canvas.addEventListener("touchstart", onTouchStart, { passive: false });
        canvas.addEventListener("touchmove", onTouchMove, { passive: false });
        canvas.addEventListener("touchend", release, { passive: false });
        canvas.addEventListener("touchcancel", release, { passive: false });
        if (stage && stage !== canvas) {
          stage.addEventListener("touchstart", onTouchStart, { passive: false });
          stage.addEventListener("touchmove", onTouchMove, { passive: false });
        }
        window.addEventListener("touchmove", (ev) => {
          if (holding || (isLive() && pointer.over)) ev.preventDefault();
        }, { passive: false });
      }
      window.addEventListener("keydown", (ev) => {
        if (!isLive()) {
          if (ev.code === "Space" || ev.key === " ") {
            ev.preventDefault();
            punchStart();
          }
          return;
        }
        if (ev.code === "Space" || ev.key === " ") { ev.preventDefault(); holding = true; }
        if (ev.code === "ArrowLeft" || ev.code === "KeyA") keys.left = true;
        if (ev.code === "ArrowRight" || ev.code === "KeyD") keys.right = true;
        if (ev.code === "ArrowUp" || ev.code === "KeyW") keys.up = true;
        if (ev.code === "ArrowDown" || ev.code === "KeyS") keys.down = true;
      });
      window.addEventListener("keyup", (ev) => {
        if (ev.code === "Space" || ev.key === " ") holding = false;
        if (ev.code === "ArrowLeft" || ev.code === "KeyA") keys.left = false;
        if (ev.code === "ArrowRight" || ev.code === "KeyD") keys.right = false;
        if (ev.code === "ArrowUp" || ev.code === "KeyW") keys.up = false;
        if (ev.code === "ArrowDown" || ev.code === "KeyS") keys.down = false;
      });
      window.addEventListener("resize", resize);
      const copyBtn = $("waterGunChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const state = PF.getState();
          const last = state.lastRun || {};
          const keyed = last[GAME_ID];
          const n = keyed && keyed.depth != null
            ? keyed.depth
            : (last.game === GAME_ID || last.gameId === GAME_ID)
              ? last.depth
              : (state.bestWaterGun || (state.bestDepth && state.bestDepth.watergun) || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const el = $("waterGunCopied");
            if (el) { el.hidden = false; el.textContent = "Copied — send it"; }
            $("waterGunStatus").textContent = "Copied — send it";
          }, () => { $("waterGunStatus").textContent = text; });
        });
      }
      stampDepthCopy();
      ensureWorld();
    },
  });
})();
