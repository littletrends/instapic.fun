/* Love Tester tent — Desktop Grok owns this doorway. PF only.
 * Never booth/port 6000. Never Imagine downloads.
 * HEARTLINE: 3D hoop-flight through the velvet palace. Steer the ruby spark.
 * Fly through pink hearts. Ice and gold shatter the glass.
 * 8 authored Heat Stages then ENDLESS Inferno Edge. One coin = one run.
 * Aura lock: brunette pigtails, yellow crown + red heart, green pinafore, black shoes.
 */
import * as THREE from "../world/lib/three.module.min.js";

function boot() {
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) {
    requestAnimationFrame(boot);
    return;
  }
  mountLove(PF);
}
boot();

function mountLove(PF) {
  "use strict";
  const { $, kit } = PF;
  const GAME_ID = "love";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const DEATH_HOLD_MS = 780;
  const COL_Y0 = 0.58;
  const COL_H = 2.18;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEARTC = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;
  const SHOE = 0x111111;
  const BRASS = 0xd4a45a;
  const PINK = 0xff6aa8;
  const GHOST = 0x7ee0f0;
  const ICE = 0xc8e8ff;

  const AURA = {
    drifted: "Out of the pink. My crown cooled.",
    never_found: "You never even found the heart, sugar.",
    ghost: "That ghost heart lied. I warned you.",
    ignored_twin: "You kissed one orbit. The other went cold.",
    decoy: "The gold flashed and you believed it.",
    ice: "Ice kissed you first. The glass keeps that.",
    souvenir: "Fever Break survived. Souvenir stamped — the authored ride ends.",
    deep: "INFERNO EDGE. Don't you dare cash soft next time.",
    coda: "Authored hearts done. ENDLESS now. Don't you dare cash soft.",
    shatter: "The mercury shattered.",
    leave: "Walking off mid-heat? The glass keeps your mark.",
    rooms: {
      1: "First spark caught. Climb next.",
      2: "You climbed. Twin orbits want both.",
      3: "Both orbits kissed. It splits next.",
      4: "Either heart worked. Ghosts arrive.",
      5: "Ghost counted. Remember that — it won't last.",
      6: "You ignored the gold. Poison next.",
      7: "Solid pink only. Fever Break is a different sky.",
      8: "Fever Break survived. Authored ride complete.",
    },
  };

  const LEVELS = [
    {
      id: 1, name: "First Spark", kind: "spiral", verb: "FLY THE PINK",
      gates: 5, speed: 2.55, turn: 2.35, hoop: 0.92, assist: 0.48,
      deadlineMs: 13000, grace: 1, y0: 1.22, yStep: 0.22, r0: 2.55, angleStep: 0.72,
      barker: "DRAG the tent to bank the spark. Fly THROUGH the pink LOVE heart. SPACE to pulse.",
    },
    {
      id: 2, name: "Rising Heat", kind: "climb", verb: "CLIMB",
      gates: 6, speed: 2.95, turn: 2.28, hoop: 0.72, assist: 0.3, decoys: 1,
      deadlineMs: 9500, grace: 0, y0: 0.95, yStep: 0.42, r0: 2.4, angleStep: 0.88,
      barker: "Climb the pink LOVE. The gold hoop with an X is a liar — don't kiss it.",
    },
    {
      id: 3, name: "Twin Orbit", kind: "twin", verb: "BOTH ORBITS",
      pairs: 4, gates: 8, speed: 3.05, turn: 2.3, hoop: 0.64, assist: 0.2,
      deadlineMs: 14000, stallMs: 6500, grace: 0, y0: 1.28, yStep: 0.3, r0: 2.48, angleStep: 0.85,
      barker: "Two glowing hearts. Hit LEFT and RIGHT. Ignoring one cools the glass.",
    },
    {
      id: 4, name: "Split Kiss", kind: "split", verb: "EITHER HEART",
      gates: 5, speed: 3.15, turn: 2.32, hoop: 0.6, splitHoop: 0.52, assist: 0.16,
      deadlineMs: 9000, splitAt: 0.4, grace: 0, y0: 1.22, yStep: 0.32, r0: 2.42, angleStep: 0.95,
      barker: "It splits mid-flight. Either heart is love. The gap is ice.",
    },
    {
      id: 5, name: "Ghost Waltz", kind: "ghostEither", verb: "EITHER COUNTS",
      gates: 6, speed: 3.28, turn: 2.34, hoop: 0.58, assist: 0.12,
      deadlineMs: 8500, grace: 0, y0: 1.14, yStep: 0.28, r0: 2.46, angleStep: 0.84,
      barker: "Pink or ghost-blue — either counts. Remember that. It will not last.",
    },
    {
      id: 6, name: "Liar's Gold", kind: "liarGold", verb: "GOLD IS A LIE",
      gates: 6, speed: 3.38, turn: 2.36, hoop: 0.56, assist: 0.1, decoys: 2,
      deadlineMs: 8200, grace: 0, y0: 1.16, yStep: 0.3, r0: 2.42, angleStep: 0.88,
      barker: "Gold hoops wear an X — that is a LIE. Fly the pink LOVE only.",
    },
    {
      id: 7, name: "Poison Twin", kind: "ghostPoison", verb: "GHOST KILLS",
      gates: 6, speed: 3.48, turn: 2.38, hoop: 0.54, assist: 0.08,
      deadlineMs: 7800, grace: 0, y0: 1.2, yStep: 0.3, r0: 2.48, angleStep: 0.86,
      barker: "Same twins. Opposite law. Ghost-blue is poison. Pink only.",
    },
    {
      id: 8, name: "Fever Break", kind: "feverJump", verb: "THEY JUMP",
      gates: 6, speed: 3.55, turn: 2.42, hoop: 0.58, minHoop: 0.34, assist: 0.04,
      deadlineMs: 7600, shrink: 0.00008, teleportMs: 1900, grace: 0,
      y0: 1.24, yStep: 0.28, r0: 2.38, angleStep: 0.92,
      barker: "Hearts shrink while you fly. They jump. Don't chase yesterday.",
    },
  ];

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Love Tester",
    depthUnit: "Heat Stage",
    sheet: "GOBLIN_LOVE_HEAT_RUN.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
    unique: true,
  };

  const _v = new THREE.Vector3();
  const _v2 = new THREE.Vector3();
  const _v3 = new THREE.Vector3();
  const _look = new THREE.Vector3();

  let world = null;
  let run = null;
  let raf = 0;
  let bound = false;
  let lookX = 0;
  let lookY = 0;
  let tiltX = 0;
  let tiltY = 0;
  let steerVisX = 0;
  let steerVisY = 0;
  let pointerOn = false;
  let pointerHover = false;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let toastTimer = 0;
  let keys = { n: 0, s: 0, e: 0, w: 0 };
  let pulseHeld = false;
  let tiltHooked = false;
  let texLove = null;
  let texLie = null;
  let texGhost = null;

  function el(id) { return $(id) || document.getElementById(id); }
  function setText(id, t) { const n = el(id); if (n) n.textContent = t; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeMat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.68, metalness: 0.08,
    }, extra || {}));
  }

  function texFromCanvas(c) {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }

  function labelTex(text, bg, fg, w, h) {
    const c = document.createElement("canvas");
    c.width = w || 512;
    c.height = h || 160;
    const ctx = c.getContext("2d");
    ctx.fillStyle = bg || "#3a1020";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
    ctx.fillStyle = fg || "#f0d09a";
    ctx.font = "700 48px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = String(text).split("\n");
    const lh = lines.length > 1 ? 52 : 0;
    lines.forEach((line, i) => {
      ctx.fillText(line, c.width / 2, c.height / 2 + (i - (lines.length - 1) / 2) * lh);
    });
    return texFromCanvas(c);
  }

  function woodTex() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#3a2418";
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 18; i += 1) {
      ctx.fillStyle = i % 2 ? "rgba(90,50,28,0.35)" : "rgba(212,164,90,0.08)";
      ctx.fillRect(0, i * 14, 256, 10);
    }
    const t = texFromCanvas(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 4);
    return t;
  }

  function velvetTex() {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, "#2a0812");
    g.addColorStop(0.5, "#7a1838");
    g.addColorStop(1, "#2a0812");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 256);
    ctx.fillStyle = "rgba(212,164,90,0.12)";
    for (let y = 0; y < 256; y += 18) ctx.fillRect(0, y, 128, 2);
    const t = texFromCanvas(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    return t;
  }

  function heartShape(s) {
    const k = s || 1;
    const sh = new THREE.Shape();
    sh.moveTo(0, 0.32 * k);
    sh.bezierCurveTo(-0.04 * k, 0.52 * k, -0.42 * k, 0.52 * k, -0.42 * k, 0.2 * k);
    sh.bezierCurveTo(-0.42 * k, 0.0, -0.18 * k, -0.14 * k, 0, -0.4 * k);
    sh.bezierCurveTo(0.18 * k, -0.14 * k, 0.42 * k, 0.0, 0.42 * k, 0.2 * k);
    sh.bezierCurveTo(0.42 * k, 0.52 * k, 0.04 * k, 0.52 * k, 0, 0.32 * k);
    return sh;
  }

  function meshBox(mat, w, h, d, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }
  function meshCyl(mat, rt, rb, h, x, y, z, seg) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }
  function meshSphere(mat, r, x, y, z, seg) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg || 12, seg || 10), mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  let geoHeart = null;
  let geoTorus = null;
  let geoShard = null;
  function sharedGeo() {
    if (!geoHeart) {
      geoHeart = new THREE.ExtrudeGeometry(heartShape(1), { depth: 0.08, bevelEnabled: false });
      geoHeart.center();
    }
    if (!geoTorus) geoTorus = new THREE.TorusGeometry(1, 0.085, 10, 28);
    if (!geoShard) geoShard = new THREE.OctahedronGeometry(0.08, 0);
    return { geoHeart, geoTorus, geoShard };
  }

  function kindColor(kind) {
    if (kind === "ghost") return GHOST;
    if (kind === "gold") return 0xffd878;
    if (kind === "ice") return ICE;
    return PINK;
  }

  function codaParams(n) {
    const k = Math.max(0, (n | 0) - LEVELS.length);
    return {
      id: n, name: "Inferno Edge " + n, title: "Inferno Edge " + n,
      kind: "coda", coda: true, authored: false, unique: false,
      gates: 6 + Math.min(3, k),
      speed: Math.min(5.1, 3.7 + k * 0.12),
      turn: Math.min(2.7, 2.42 + k * 0.04),
      hoop: Math.max(0.28, 0.52 - k * 0.016),
      minHoop: 0.26,
      assist: k < 3 ? 0.04 : 0,
      deadlineMs: Math.max(3400, 7000 - k * 160),
      shrink: Math.min(0.00016, 0.00005 + k * 0.00001),
      teleportMs: Math.max(900, 1800 - k * 80),
      decoys: k >= 1 ? 1 + Math.min(2, (k / 2) | 0) : 0,
      poison: k >= 2,
      ice: k >= 3,
      grace: 0,
      y0: 1.1, yStep: 0.28 + Math.min(0.2, k * 0.02), r0: 2.45, angleStep: 0.95,
      barker: "Authored hearts done. ENDLESS now. Pink only. Don't you dare cash soft.",
      verb: "ENDLESS",
    };
  }

  function stageParams(n) {
    const stage = n | 0;
    if (stage >= 1 && stage <= LEVELS.length) {
      const room = LEVELS[stage - 1];
      return Object.assign({}, room, { title: room.name, coda: false, authored: true, unique: true });
    }
    if (CODA_ENABLED) return codaParams(stage);
    return null;
  }

  function deathKey(reason) {
    if (reason === "never found the heart" || reason === "never_found") return "never_found";
    if (reason === "ghost heart lied" || reason === "ghost") return "ghost";
    if (reason === "ignored the twin" || reason === "ignored_twin") return "ignored_twin";
    if (reason === "the gold flashed" || reason === "decoy") return "decoy";
    if (reason === "ice kiss" || reason === "ice") return "ice";
    if (reason === "missed the heart" || reason === "drifted" || reason === "missed_gate") return "drifted";
    if (reason === "souvenir" || reason === "leave") return reason;
    return reason || "drifted";
  }

  function auraLine(reason, depth) {
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "leave") return AURA.leave;
    const key = deathKey(reason);
    if (key === "never_found") return AURA.never_found;
    if (key === "ghost") return AURA.ghost;
    if (key === "ignored_twin") return AURA.ignored_twin;
    if (key === "decoy") return AURA.decoy;
    if (key === "ice") return AURA.ice;
    if ((depth | 0) > AUTHORED_COUNT) return AURA.coda;
    if ((depth | 0) >= AUTHORED_COUNT) return AURA.deep;
    if (key === "drifted") return AURA.drifted;
    return AURA.shatter;
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = makeMat(SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const blouse = makeMat(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.18 });
    const dress = makeMat(DRESS, { emissive: 0x0a2010, emissiveIntensity: 0.28 });
    const hairM = makeMat(HAIR, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });
    const gold = makeMat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const heartM = makeMat(HEARTC, { emissive: HEARTC, emissiveIntensity: 0.65, roughness: 0.4 });
    const shoe = makeMat(SHOE, { metalness: 0.55, roughness: 0.25 });

    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(meshCyl(blouse, 0.12, 0.15, 0.28, 0, 0.28, 0));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.12, 0.36, 12), dress);
    skirt.position.y = 0.06;
    hip.add(skirt);
    const bib = meshBox(heartM, 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    bib.rotation.z = Math.PI / 4;
    hip.add(bib);

    const head = new THREE.Group();
    head.position.y = 0.64;
    hip.add(head);
    head.add(meshSphere(skin, 0.22, 0, 0.02, 0, 14));
    const eyeW = makeMat(0xf7f2ea);
    const eyeD = makeMat(0x2a1810);
    [-1, 1].forEach((side) => {
      const white = meshSphere(eyeW, 0.038, side * 0.07, 0.03, 0.19);
      white.scale.set(0.05, 0.058, 0.02);
      head.add(white);
      head.add(meshSphere(eyeD, 0.026, side * 0.07, 0.03, 0.21));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), makeMat(0xc45a6a));
    smile.position.set(0, -0.05, 0.2);
    smile.rotation.x = 2.6;
    head.add(smile);
    head.add(meshSphere(hairM, 0.23, 0, 0.06, -0.02, 14));
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
      if (!arm) pivot.add(meshBox(shoe, 0.09, 0.045, 0.13, 0, -len - 0.02, 0.03));
      else pivot.add(meshSphere(skin, 0.04, 0, -len, 0));
      hip.add(pivot);
      return pivot;
    }
    g.userData = {
      hip, head, crown,
      armL: limb(-1, true), armR: limb(1, true),
      legL: limb(-1, false), legR: limb(1, false),
    };
    g.scale.setScalar(1.18);
    return g;
  }

  function makeColumn() {
    const g = new THREE.Group();
    const brass = makeMat(BRASS, { metalness: 0.72, roughness: 0.32, emissive: 0x4a3010, emissiveIntensity: 0.18 });
    const dark = makeMat(0x2a1810, { metalness: 0.3, roughness: 0.55 });
    const glassM = makeMat(0xffe8f0, {
      roughness: 0.18, metalness: 0.08, transparent: true, opacity: 0.22,
      emissive: 0xffc0d0, emissiveIntensity: 0.08, depthWrite: false,
    });
    const ruby = makeMat(0xc41e3a, { emissive: 0xc41e3a, emissiveIntensity: 1.4, roughness: 0.25, metalness: 0.15 });

    g.add(meshCyl(dark, 0.32, 0.4, 0.18, 0, 0.09, 0, 12));
    g.add(meshCyl(brass, 0.22, 0.26, 0.12, 0, 0.22, 0, 14));
    g.add(meshCyl(glassM, 0.11, 0.11, COL_H + 0.08, 0, COL_Y0 + COL_H / 2, 0, 20));
    const mercury = meshCyl(ruby, 0.085, 0.085, 1, 0, COL_Y0 + 0.5, 0, 16);
    g.add(mercury);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), ruby);
    bulb.position.y = COL_Y0 + COL_H + 0.12;
    g.add(bulb);
    const { geoHeart } = sharedGeo();
    const heart = new THREE.Mesh(geoHeart, makeMat(0xff4a70, { emissive: 0xff2a50, emissiveIntensity: 0.9 }));
    heart.scale.set(0.55, 0.55, 0.55);
    heart.position.y = COL_Y0 + COL_H + 0.38;
    g.add(heart);
    g.add(meshCyl(brass, 0.14, 0.14, 0.08, 0, COL_Y0 + COL_H + 0.02, 0, 12));

    const labels = ["ICE", "FRIENDSHIP", "PUPPY LOVE", "PASSION", "FEVER", "INFERNO"];
    const plaques = [];
    labels.forEach((lab, i) => {
      const p = meshBox(new THREE.MeshBasicMaterial({ map: labelTex(lab, "#241018", "#f0d09a", 320, 80), transparent: true }), 0.5, 0.12, 0.01, 0.34, COL_Y0 + 0.18 + i * 0.36, 0);
      g.add(p);
      plaques.push(p);
    });

    const light = new THREE.PointLight(0xff3a60, 1.15, 5.2, 2);
    light.position.set(0, 1.4, 0.2);
    g.add(light);
    g.userData = { mercury, bulb, heart, light, ruby, plaques };
    return g;
  }

  function makeSpark() {
    const g = new THREE.Group();
    const bank = new THREE.Group();
    g.add(bank);
    const { geoHeart } = sharedGeo();
    const body = new THREE.Mesh(geoHeart, makeMat(0xff3a70, {
      emissive: 0xff2a58, emissiveIntensity: 1.6, roughness: 0.28, metalness: 0.2,
    }));
    body.scale.set(0.34, 0.34, 0.34);
    bank.add(body);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.022, 8, 20), makeMat(BRASS, {
      metalness: 0.8, roughness: 0.25, emissive: 0x6a4808, emissiveIntensity: 0.45,
    }));
    bank.add(rim);
    const wingM = makeMat(BRASS, { metalness: 0.72, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const wingL = meshBox(wingM, 0.46, 0.035, 0.14, -0.3, 0.02, 0.02);
    wingL.rotation.z = 0.28;
    const wingR = meshBox(wingM, 0.46, 0.035, 0.14, 0.3, 0.02, 0.02);
    wingR.rotation.z = -0.28;
    bank.add(wingL);
    bank.add(wingR);
    const glow = meshSphere(makeMat(0xff6aa8, {
      transparent: true, opacity: 0.28, emissive: 0xff6aa8, emissiveIntensity: 0.8, depthWrite: false,
    }), 0.28, 0, 0, 0, 12);
    bank.add(glow);
    const light = new THREE.PointLight(0xff4a78, 1.6, 4.2, 2);
    g.add(light);
    const pip = new THREE.Mesh(
      new THREE.RingGeometry(0.07, 0.11, 18),
      makeMat(PINK, { emissive: PINK, emissiveIntensity: 1.4, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })
    );
    pip.position.z = 0.62;
    g.add(pip);
    const trail = [];
    for (let i = 0; i < 14; i += 1) {
      const h = new THREE.Mesh(geoHeart, makeMat(PINK, {
        emissive: PINK, emissiveIntensity: 0.9, transparent: true, opacity: 0.55, depthWrite: false,
      }));
      h.scale.setScalar(0.12);
      h.visible = false;
      trail.push(h);
    }
    g.userData = { body, rim, glow, light, trail, bank, wingL, wingR, pip };
    return g;
  }

  function makeTent(scene) {
    const velvet = velvetTex();
    const cloth = makeMat(0x6b1838, { map: velvet, roughness: 0.86, emissive: 0x2a0810, emissiveIntensity: 0.12 });
    const poles = makeMat(BRASS, { metalness: 0.6, roughness: 0.4 });
    const wood = makeMat(0x3a2418, { map: woodTex(), roughness: 0.9 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(7.1, 32), wood);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const { geoHeart } = sharedGeo();
    const inlay = new THREE.Mesh(geoHeart, makeMat(0x5a1028, { roughness: 0.75, emissive: 0x3a0814, emissiveIntensity: 0.22 }));
    inlay.rotation.x = -Math.PI / 2;
    inlay.scale.set(3.4, 3.4, 0.4);
    inlay.position.y = 0.02;
    scene.add(inlay);

    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2 + 0.12;
      const r = 5.15;
      const panel = meshBox(cloth, 2.15, 3.8, 0.06, Math.sin(a) * r, 1.9, Math.cos(a) * r);
      panel.lookAt(0, 1.9, 0);
      scene.add(panel);
      scene.add(meshCyl(poles, 0.045, 0.045, 3.7, Math.sin(a) * (r - 0.16), 1.85, Math.cos(a) * (r - 0.16), 8));
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 1.85, 10), makeMat(0x4a1024, { map: velvet, roughness: 0.85 }));
    roof.position.y = 4.55;
    scene.add(roof);
    scene.add(meshCyl(poles, 0.03, 0.03, 0.55, 0, 5.55, 0, 8));
    scene.add(meshSphere(makeMat(GOLD, { metalness: 0.7, emissive: GOLD, emissiveIntensity: 0.6 }), 0.09, 0, 5.88, 0));

    const sign = meshBox(new THREE.MeshBasicMaterial({ map: labelTex("HEARTLINE", "#4a1020", "#ffd0e4", 640, 160) }), 2.35, 0.5, 0.04, 0, 3.55, -2.55);
    scene.add(sign);
    scene.add(meshBox(makeMat(BRASS, { metalness: 0.6 }), 2.48, 0.58, 0.06, 0, 3.55, -2.6));
    const sub = meshBox(new THREE.MeshBasicMaterial({ map: labelTex("LOVE TESTER", "#2a0810", "#f0d09a", 512, 100) }), 1.6, 0.28, 0.03, 0, 3.18, -2.52);
    scene.add(sub);

    const how = [
      { t: "DRAG TO BANK\ntilt the spark", x: -2.6, z: 1.6, w: 1.35 },
      { t: "PULSE\nspace · tap", x: 2.6, z: 1.6, w: 1.35 },
      { t: "PINK = LOVE\nGOLD X = LIE", x: 0, z: -2.15, w: 1.75 },
    ];
    how.forEach((h) => {
      const p = meshBox(new THREE.MeshBasicMaterial({ map: labelTex(h.t, "#3a1020", "#ffd0e4", 560, 200) }), h.w || 1.35, 0.48, 0.03, h.x, 1.55, h.z);
      p.lookAt(0, 1.55, 0.4);
      scene.add(p);
    });

    const lanterns = [];
    [[-2.1, 2.85, 1.5], [2.1, 2.85, 1.5], [0, 3.2, -1.85], [-2.4, 2.4, -1.1], [2.4, 2.4, -1.1]].forEach((p) => {
      const lamp = meshSphere(makeMat(0xffd09a, { emissive: 0xffc078, emissiveIntensity: 1.1 }), 0.1, p[0], p[1], p[2], 10);
      scene.add(lamp);
      scene.add(meshCyl(makeMat(BRASS, { metalness: 0.6 }), 0.02, 0.02, 0.45, p[0], p[1] + 0.28, p[2], 6));
      const pl = new THREE.PointLight(0xffb070, 1.15, 5.8, 2);
      pl.position.set(p[0], p[1], p[2]);
      scene.add(pl);
      lanterns.push({ lamp, pl });
    });

    const roses = makeMat(0x9a1838);
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      scene.add(meshSphere(roses, 0.08, Math.sin(a) * 2.05, 0.12, Math.cos(a) * 1.35, 8));
    }

    const dais = meshCyl(makeMat(0x4a2418, { roughness: 0.7 }), 0.42, 0.5, 0.16, 2.35, 0.08, 0.85, 12);
    scene.add(dais);

    return { lanterns, sign };
  }

  function tagTex(kind) {
    if (kind === "gold") {
      if (!texLie) texLie = labelTex("LIE", "#3a1808", "#ffd878", 280, 90);
      return texLie;
    }
    if (kind === "ghost") {
      if (!texGhost) texGhost = labelTex("GHOST", "#102028", "#7ee0f0", 280, 90);
      return texGhost;
    }
    if (!texLove) texLove = labelTex("LOVE", "#7a1838", "#ffd0e4", 280, 90);
    return texLove;
  }

  function makeGate(kind, radius) {
    const g = new THREE.Group();
    const { geoTorus, geoHeart } = sharedGeo();
    const col = kindColor(kind);
    const lie = kind === "gold";
    const ghost = kind === "ghost";
    const ring = new THREE.Mesh(geoTorus, makeMat(col, {
      emissive: col, emissiveIntensity: ghost ? 0.9 : 1.55,
      roughness: lie ? 0.22 : 0.32, metalness: lie ? 0.72 : 0.2,
      transparent: ghost, opacity: ghost ? 0.55 : 1,
    }));
    ring.scale.set(radius, radius, radius);
    g.add(ring);
    const gem = new THREE.Mesh(geoHeart, makeMat(col, { emissive: col, emissiveIntensity: 1.2 }));
    gem.scale.setScalar(radius * (lie ? 0.18 : 0.3));
    gem.position.y = radius + 0.14;
    g.add(gem);
    const halo = new THREE.Mesh(geoTorus, makeMat(col, {
      emissive: col, emissiveIntensity: 2.0, transparent: true, opacity: 0.35, depthWrite: false,
    }));
    halo.scale.set(radius * 1.18, radius * 1.18, radius * 1.18);
    g.add(halo);
    const beam = meshCyl(makeMat(col, {
      emissive: col, emissiveIntensity: 1.4, transparent: true, opacity: 0.22, depthWrite: false,
    }), 0.028, 0.028, 1.8, 0, 1.05, 0, 8);
    g.add(beam);
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 8), makeMat(col, { emissive: col, emissiveIntensity: 1.6 }));
    arrow.position.y = radius + 0.42;
    arrow.rotation.x = Math.PI;
    g.add(arrow);
    const tag = meshBox(new THREE.MeshBasicMaterial({ map: tagTex(kind), transparent: true }), Math.max(0.42, radius * 0.85), 0.13, 0.02, 0, -radius - 0.2, 0);
    g.add(tag);
    const needle = meshBox(makeMat(col, { emissive: col, emissiveIntensity: 1.5 }), 0.04, radius * 0.72, 0.04, 0, radius * 0.28, 0.03);
    needle.visible = !lie;
    g.add(needle);
    let crossA = null;
    let crossB = null;
    if (lie) {
      const bar = makeMat(0x4a2808, { metalness: 0.75, roughness: 0.25, emissive: 0x8a5008, emissiveIntensity: 1.1 });
      crossA = meshBox(bar, radius * 1.55, 0.08, 0.08, 0, 0, 0);
      crossA.rotation.z = Math.PI / 4;
      crossB = meshBox(bar, radius * 1.55, 0.08, 0.08, 0, 0, 0);
      crossB.rotation.z = -Math.PI / 4;
      g.add(crossA);
      g.add(crossB);
      for (let i = 0; i < 8; i += 1) {
        const ang = (i / 8) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), bar);
        spike.position.set(Math.cos(ang) * radius, Math.sin(ang) * radius, 0);
        spike.rotation.z = ang - Math.PI / 2;
        g.add(spike);
      }
      beam.visible = false;
      arrow.visible = false;
    }
    g.userData = { ring, gem, halo, beam, arrow, tag, needle, crossA, crossB, kind, radius };
    return g;
  }

  function makeIceCrystal() {
    const { geoShard } = sharedGeo();
    const m = new THREE.Mesh(geoShard, makeMat(ICE, {
      emissive: 0x88c8ff, emissiveIntensity: 0.9, roughness: 0.18, metalness: 0.35, transparent: true, opacity: 0.9,
    }));
    m.scale.setScalar(1.8);
    m.visible = false;
    m.userData = { life: 0 };
    return m;
  }

  function makeHearts() {
    const { geoHeart } = sharedGeo();
    const pool = [];
    for (let i = 0; i < 36; i += 1) {
      const m = new THREE.Mesh(geoHeart, makeMat(PINK, {
        emissive: 0xff4a88, emissiveIntensity: 0.95, transparent: true, opacity: 0.92, depthWrite: false,
      }));
      m.scale.setScalar(0.16);
      m.visible = false;
      m.userData = { life: 0, vx: 0, vy: 0, vz: 0 };
      pool.push(m);
    }
    return pool;
  }

  function makeShards() {
    const { geoShard } = sharedGeo();
    const pool = [];
    const mat = makeMat(0xf2e6ea, { roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 26; i += 1) {
      const m = new THREE.Mesh(geoShard, mat.clone());
      m.visible = false;
      m.userData = { life: 0, vx: 0, vy: 0, vz: 0, spin: 0 };
      pool.push(m);
    }
    return pool;
  }

  function makeDust() {
    const n = 110;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 1] = Math.random() * 4.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffd0c0, size: 0.032, transparent: true, opacity: 0.32 });
    return new THREE.Points(geo, mat);
  }

  function ping(freq, dur, type) {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      if (!world._ac) world._ac = new Ctor();
      const ctx = world._ac;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.45), t0 + dur);
      gain.gain.setValueAtTime(0.045, t0);
      gain.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (_) { /* ignore */ }
  }

  function toast(msg) {
    const n = el("loveToast");
    if (!n) return;
    n.hidden = false;
    n.textContent = msg;
    n.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { n.classList.remove("is-on"); }, 1100);
  }

  function spawnBurst(pos, color, n) {
    if (!world) return;
    let left = n || 8;
    world.hearts.forEach((h) => {
      if (left <= 0) return;
      if (h.visible && h.userData.life > 0) return;
      left -= 1;
      h.visible = true;
      h.position.copy(pos);
      h.position.x += rand(-0.1, 0.1);
      h.position.y += rand(-0.05, 0.12);
      h.userData.life = 0.7 + Math.random() * 0.5;
      h.userData.vx = rand(-0.7, 0.7);
      h.userData.vy = 0.5 + Math.random() * 0.9;
      h.userData.vz = rand(-0.7, 0.7);
      h.material.color.setHex(color || PINK);
      h.material.emissive.setHex(color || PINK);
      h.material.opacity = 0.95;
    });
  }

  function shatterAt(pos) {
    if (!world) return;
    world.shake = 0.55;
    world.shards.forEach((s) => {
      s.visible = true;
      s.position.copy(pos);
      s.userData.life = 0.75 + Math.random() * 0.5;
      s.userData.vx = rand(-1.8, 1.8);
      s.userData.vy = 0.5 + Math.random() * 1.6;
      s.userData.vz = rand(-1.8, 1.8);
      s.userData.spin = rand(-8, 8);
    });
    ping(180, 0.18, "sawtooth");
    ping(90, 0.28, "triangle");
  }

  function setMercuryVis(heat) {
    if (!world) return;
    const u = world.col.userData;
    const t = clamp(heat, 0, 100) / 100;
    const h = 0.08 + t * COL_H;
    u.mercury.scale.y = h;
    u.mercury.position.y = COL_Y0 + h / 2;
    u.light.position.y = COL_Y0 + h * 0.82;
    u.light.intensity = 0.35 + t * 1.9;
    u.bulb.material.emissiveIntensity = 0.6 + t * 1.6;
    u.heart.material.emissiveIntensity = 0.5 + t * 1.4;
    u.heart.rotation.y += 0.012;
    const lit = Math.min(5, Math.floor(t * 6));
    u.plaques.forEach((p, i) => {
      p.material.opacity = i <= lit ? 1 : 0.35;
      p.material.transparent = true;
    });
  }

  function poseAura(kind, t) {
    if (!world) return;
    const a = world.aura.userData;
    const bob = REDUCE ? 0 : Math.sin(t * 2.2) * 0.02;
    a.hip.position.y = 0.42 + bob;
    a.head.rotation.z = Math.sin(t * 1.4) * 0.04;
    if (kind === "cheer") {
      a.armL.rotation.z = 2.1 + Math.sin(t * 8) * 0.15;
      a.armR.rotation.z = -2.1 + Math.sin(t * 8 + 1) * 0.15;
      a.head.rotation.x = -0.12;
    } else if (kind === "lean") {
      a.armL.rotation.z = 0.45;
      a.armR.rotation.z = -1.05;
      a.hip.rotation.y = -0.18;
      a.head.rotation.x = 0.08;
    } else if (kind === "worry") {
      a.armL.rotation.z = 0.8;
      a.armR.rotation.z = -0.8;
      a.head.rotation.z = Math.sin(t * 14) * 0.12;
    } else if (kind === "sad") {
      a.armL.rotation.z = 0.2;
      a.armR.rotation.z = -0.2;
      a.head.rotation.x = 0.28;
    } else {
      a.armL.rotation.z = 0.25 + Math.sin(t * 2) * 0.35;
      a.armR.rotation.z = -0.15;
      a.hip.rotation.y = 0;
      a.head.rotation.x = 0;
    }
    if (world.spark) {
      _v.copy(world.spark.position);
      _v.y = world.aura.position.y + 0.9;
      const dx = _v.x - world.aura.position.x;
      const dz = _v.z - world.aura.position.z;
      a.hip.rotation.y = lerp(a.hip.rotation.y, Math.atan2(dx, dz) - world.aura.rotation.y, 0.08);
    }
  }

  function applyRoomLights(spec) {
    if (!world) return;
    const kind = spec && spec.kind;
    const fog = world.scene.fog;
    world.inferno = kind === "coda" || kind === "feverJump" ? 1 : 0;
    if (kind === "ghostEither" || kind === "ghostPoison") {
      if (fog) fog.color.setHex(0x102028);
      world.renderer.setClearColor(kind === "ghostPoison" ? 0x101808 : 0x101820, 1);
    } else if (kind === "coda" || kind === "feverJump") {
      if (fog) fog.color.setHex(0x280808);
      world.renderer.setClearColor(0x1a0608, 1);
    } else if (kind === "liarGold") {
      if (fog) fog.color.setHex(0x241808);
      world.renderer.setClearColor(0x160c08, 1);
    } else {
      if (fog) fog.color.setHex(0x14060c);
      world.renderer.setClearColor(0x12060c, 1);
    }
  }

  function headingFromYP(yaw, pitch, out) {
    out.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    return out;
  }

  function ypFromHeading(h) {
    const pitch = Math.asin(clamp(h.y, -0.99, 0.99));
    const yaw = Math.atan2(h.x, h.z);
    return { yaw, pitch };
  }

  function placeGateAt(gate, x, y, z, lookX, lookY, lookZ) {
    gate.position.set(x, y, z);
    _v.set(lookX, lookY, lookZ);
    if (_v.lengthSq() < 0.0001) _v.set(0, 0, 1);
    gate.lookAt(x + _v.x, y + _v.y, z + _v.z);
    gate.userData.nx = _v.x;
    gate.userData.ny = _v.y;
    gate.userData.nz = _v.z;
    gate.userData.home = { x, y, z };
  }

  function clearGates() {
    if (!world) return;
    world.gates.forEach((g) => world.scene.remove(g));
    world.gates = [];
    world.ice.forEach((c) => { c.visible = false; });
  }

  function addGate(kind, index, side, radius, x, y, z, dx, dy, dz, role) {
    const g = makeGate(kind, radius);
    placeGateAt(g, x, y, z, dx, dy, dz);
    g.userData.kind = kind;
    g.userData.index = index;
    g.userData.side = side || "";
    g.userData.role = role || "score";
    g.userData.collected = false;
    g.userData.live = false;
    g.userData.passed = false;
    g.userData.baseRadius = radius;
    world.scene.add(g);
    world.gates.push(g);
    return g;
  }

  function gateDir(i, spec, count) {
    const a0 = spec.angle0 != null ? spec.angle0 : 0.35;
    const a = a0 + i * (spec.angleStep || 0.9);
    const y = (spec.y0 || 1.2) + i * (spec.yStep || 0.3);
    const r = spec.r0 || 2.5;
    const x = Math.sin(a) * r;
    const z = Math.cos(a) * r;
    const a2 = a0 + (i + 1) * (spec.angleStep || 0.9);
    const y2 = (spec.y0 || 1.2) + (i + 1) * (spec.yStep || 0.3);
    let dx = Math.sin(a2) * r - x;
    let dy = y2 - y;
    let dz = Math.cos(a2) * r - z;
    if (i >= count - 1) {
      dx = Math.sin(a + 0.4) * r - x;
      dy = 0.05;
      dz = Math.cos(a + 0.4) * r - z;
    }
    const len = Math.hypot(dx, dy, dz) || 1;
    return { a, x, y, z, dx: dx / len, dy: dy / len, dz: dz / len };
  }

  function buildCourse(spec) {
    clearGates();
    const kind = spec.kind || "spiral";
    const hoop = spec.hoop || 0.5;
    if (kind === "twin") {
      const pairs = spec.pairs || 4;
      for (let i = 0; i < pairs; i += 1) {
        const p = gateDir(i, spec, pairs);
        addGate("pink", i, "L", hoop, Math.sin(p.a) * spec.r0, p.y, Math.cos(p.a) * spec.r0, p.dx, p.dy, p.dz, "score");
        addGate("pink", i, "R", hoop, Math.sin(p.a + Math.PI) * spec.r0, p.y + 0.08, Math.cos(p.a + Math.PI) * spec.r0, -p.dx, p.dy, -p.dz, "score");
      }
    } else {
      const n = spec.gates || 5;
      for (let i = 0; i < n; i += 1) {
        const p = gateDir(i, spec, n);
        if (kind === "ghostEither" || kind === "ghostPoison") {
          addGate("pink", i, "P", hoop, p.x, p.y, p.z, p.dx, p.dy, p.dz, "score");
          const ga = p.a + 0.55;
          addGate("ghost", i, "G", hoop * 0.95, Math.sin(ga) * spec.r0, p.y + 0.1, Math.cos(ga) * spec.r0, p.dx, p.dy, p.dz, kind === "ghostPoison" ? "kill" : "score");
        } else if (kind === "split") {
          addGate("pink", i, "M", hoop, p.x, p.y, p.z, p.dx, p.dy, p.dz, "score");
          const side = 0.55;
          _v.set(p.dx, p.dy, p.dz);
          _v2.set(0, 1, 0).cross(_v);
          if (_v2.lengthSq() < 0.01) _v2.set(1, 0, 0);
          _v2.normalize();
          const splitR = spec.splitHoop || hoop * 0.85;
          const L = addGate("pink", i, "L", splitR, p.x + _v2.x * side, p.y, p.z + _v2.z * side, p.dx, p.dy, p.dz, "score");
          const R = addGate("pink", i, "R", splitR, p.x - _v2.x * side, p.y, p.z - _v2.z * side, p.dx, p.dy, p.dz, "score");
          L.visible = false;
          R.visible = false;
          L.userData.splitChild = true;
          R.userData.splitChild = true;
        } else {
          addGate("pink", i, "", hoop, p.x, p.y, p.z, p.dx, p.dy, p.dz, "score");
        }
        if (kind === "liarGold" || spec.decoys) {
          const dCount = spec.decoys || 1;
          for (let d = 0; d < dCount; d += 1) {
            const off = 1.2 + d * 0.4;
            const ga = p.a + (d % 2 ? off : -off);
            const rr = (spec.r0 || 2.4) + 0.62;
            addGate("gold", i, "D", hoop * 0.68, Math.sin(ga) * rr, p.y + 0.18 + d * 0.12, Math.cos(ga) * rr, p.dx, p.dy, p.dz, "kill");
          }
        }
        if (kind === "coda" && spec.poison) {
          const ga = p.a + 0.62;
          addGate("ghost", i, "G", hoop * 0.9, Math.sin(ga) * spec.r0, p.y + 0.12, Math.cos(ga) * spec.r0, p.dx, p.dy, p.dz, "kill");
        }
      }
    }
    if ((kind === "split" || kind === "coda" || spec.ice) && world.ice) {
      const nIce = kind === "split" ? spec.gates : (spec.ice ? 5 : 0);
      for (let i = 0; i < nIce && i < world.ice.length; i += 1) {
        const p = gateDir(i, spec, Math.max(1, spec.gates || spec.pairs || 4));
        const c = world.ice[i];
        c.visible = kind === "split" ? false : true;
        c.position.set(p.x * 0.35, p.y, p.z * 0.35);
        c.userData.life = 1;
        c.userData.splitIndex = i;
      }
    }
  }

  function liveGates() {
    return world ? world.gates.filter((g) => g.userData.live && !g.userData.collected && g.visible) : [];
  }

  function neededCount(spec) {
    if (spec.kind === "twin") return spec.pairs || 4;
    return spec.gates || 5;
  }

  function refreshLive() {
    if (!world || !run) return;
    const spec = run.spec;
    const idx = run.liveIndex;
    const splitOn = spec.kind === "split" && run.splitFired;
    world.gates.forEach((g) => {
      const u = g.userData;
      let live = u.index === idx && !u.collected;
      if (spec.kind === "split") {
        if (u.splitChild) live = live && splitOn;
        else if (u.side === "M") live = live && !splitOn;
      }
      if (u.role === "kill") live = u.index === idx && !u.collected;
      u.live = live;
      if (u.collected) g.visible = false;
      else if (spec.kind === "split" && u.splitChild) g.visible = splitOn && u.index === idx;
      else if (spec.kind === "split" && u.side === "M") g.visible = !splitOn && u.index === idx;
      else g.visible = u.index === idx;
      u.beam.visible = !!live && u.role === "score" && u.kind !== "gold";
      u.arrow.visible = !!live && u.role === "score" && u.kind !== "gold";
      u.halo.visible = !!live;
      if (u.needle) u.needle.visible = !!live && u.role === "score" && u.kind !== "gold";
      if (u.ring && u.ring.material) u.ring.material.emissiveIntensity = live ? 1.6 : 0.25;
      if (live) { u.approached = false; u.lastZ = undefined; }
    });
  }

  function parkAtLive() {
    if (!world || !run) return;
    const lives = liveGates().filter((g) => g.userData.role === "score");
    const g = lives[0] || world.gates.find((x) => x.userData.index === run.liveIndex);
    if (!g) return;
    const u = g.userData;
    world.spark.position.set(g.position.x - u.nx * 4.2, g.position.y - (u.ny || 0) * 0.35, g.position.z - u.nz * 4.2);
    world.spark.position.y = clamp(world.spark.position.y, 0.7, 3.8);
    const yp = ypFromHeading(_v.set(u.nx, u.ny, u.nz).normalize());
    run.yaw = yp.yaw;
    run.pitch = yp.pitch;
    snapCam();
  }

  function snapCam() {
    if (!world || !run) return;
    headingFromYP(run.yaw, run.pitch, _v);
    const spark = world.spark.position;
    world.camera.position.set(
      spark.x - _v.x * 3.55,
      spark.y - _v.y * 3.55 + 1.12,
      spark.z - _v.z * 3.55
    );
    world.camera.lookAt(spark.x + _v.x * 1.4, spark.y + 0.12, spark.z + _v.z * 1.4);
  }

  function updatePlaque(name) {
    if (!world || !world.plaque) return;
    const mat = world.plaque.material;
    if (mat.map && mat.map.dispose) mat.map.dispose();
    mat.map = labelTex(String(name || "HEARTLINE").toUpperCase(), "#3a1020", "#ffd0e4", 512, 140);
    mat.needsUpdate = true;
  }

  function overlayMode(on) {
    const o = el("loveOverlay");
    if (!o) return;
    o.hidden = !on;
    if (on) {
      const again = run && run.finished;
      const strong = o.querySelector("strong");
      if (strong) strong.textContent = again ? "CLICK TO FLY AGAIN" : "CLICK TO FLY";
    }
  }

  function paintHud() {
    const spec = run && run.spec;
    const card = el("loveCard");
    if (spec && run) {
      const coda = !!spec.coda;
      const need = neededCount(spec);
      const have = run.clearedIndex;
      setText("loveHazard", coda
        ? `ENDLESS · ${spec.name} · ♥ ${have}/${need}`
        : `${spec.name.toUpperCase()} · ${spec.verb} · ♥ ${have}/${need}`);
      setText("loveBarker", spec.barker || "");
      setText("loveStageDepth", coda ? `ENDLESS · Heat Stage ${run.depth}` : `Heat Stage ${run.depth} · ${spec.name}`);
      setText("loveRoundLabel", spec.name);
      const left = Math.max(0, 1 - run.gateClock / Math.max(400, spec.deadlineMs));
      const fill = el("loveSqueezeFill");
      if (fill) fill.style.width = `${Math.round(left * 100)}%`;
      setText("thermoReadout", `♥ ${have}/${need}`);
      paintTiltPad();
      if (card) {
        card.classList.toggle("is-coda", coda);
        card.classList.toggle("is-hot", run.justCollect > 0);
        card.classList.toggle("is-danger", left < 0.32 && run.active);
        card.classList.toggle("is-dragging", pointerOn);
      }
    } else {
      setText("loveHazard", "HEARTLINE · FLY THE PINK");
      setText("thermoReadout", "♥ —");
      const fill = el("loveSqueezeFill");
      if (fill) fill.style.width = "0%";
      paintTiltPad();
      if (card) {
        card.classList.remove("is-hot", "is-danger", "is-coda", "is-dragging");
      }
    }
  }

  function paintTiltPad() {
    const knub = el("loveTiltKnub");
    const pad = el("loveTilt");
    if (!knub) return;
    const sx = clamp(lookX + tiltX + (keys.e - keys.w), -1, 1);
    const sy = clamp(lookY + tiltY + (keys.n - keys.s), -1, 1);
    knub.style.transform = `translate(${sx * 22}px, ${-sy * 22}px)`;
    if (pad) {
      pad.classList.toggle("is-hot", pointerOn || Math.hypot(sx, sy) > 0.14);
      pad.hidden = !(run && run.active);
    }
  }

  function localThrough(gate, pos) {
    gate.updateMatrixWorld(true);
    _v.copy(pos);
    gate.worldToLocal(_v);
    const radial = Math.hypot(_v.x, _v.y);
    return { z: _v.z, radial, radius: gate.userData.radius || 0.5 };
  }

  function collectGate(g) {
    if (!run || g.userData.collected) return;
    const spec = run.spec;
    g.userData.collected = true;
    g.userData.live = false;
    spawnBurst(g.position, kindColor(g.userData.kind), 10);
    ping(420 + run.liveIndex * 40, 0.1, "sine");
    world.punch = 0.22;
    run.justCollect = 0.45;
    run.score += 40 + run.depth * 8 + Math.floor(Math.max(0, spec.deadlineMs - run.gateClock) / 80);
    run.collected += 1;
    run.entered = true;

    if (spec.kind === "twin") {
      if (g.userData.side === "L") run.gotL = true;
      if (g.userData.side === "R") run.gotR = true;
      if (run.gotL && run.gotR) {
        run.clearedIndex += 1;
        run.liveIndex += 1;
        run.gotL = false;
        run.gotR = false;
        run.twinStallAt = 0;
        run.gateClock = 0;
        run.splitFired = false;
      } else {
        run.twinStallAt = run.twinStallAt || run.elapsedMs;
      }
    } else {
      run.clearedIndex += 1;
      run.liveIndex += 1;
      run.gateClock = 0;
      run.splitFired = false;
      run.teleportAcc = 0;
    }

    if (kit && kit.sfx) kit.sfx("drop");
    if (run.clearedIndex >= neededCount(spec)) {
      clearStage();
      return;
    }
    refreshLive();
    toast(spec.kind === "twin" && !(run.gotL && run.gotR) && (run.gotL || run.gotR) ? "SWITCH ORBITS" : "KISS");
  }

  function missLive(reason) {
    if (!run || !run.active) return;
    const spec = run.spec;
    if ((spec.grace | 0) > 0 && !run.graceUsed) {
      run.graceUsed = true;
      run.gateClock = 0;
      run.splitFired = false;
      toast("CAREFUL…");
      setText("loveWarn", "Missed — one more chance. Fly through the glowing heart.");
      world.shake = 0.2;
      ping(140, 0.12, "triangle");
      if (run.kitRun && PF.runKit && PF.runKit.reportStrike) PF.runKit.reportStrike(run.kitRun, "gate");
      parkAtLive();
      refreshLive();
      return;
    }
    die(reason || "missed the heart");
  }

  function seatNewRoom(n) {
    const spec = stageParams(n);
    if (!spec) return null;
    run.spec = spec;
    run.depth = n;
    run.liveIndex = 0;
    run.clearedIndex = 0;
    run.collected = 0;
    run.gotL = false;
    run.gotR = false;
    run.twinStallAt = 0;
    run.gateClock = 0;
    run.elapsedMs = 0;
    run.entered = false;
    run.splitFired = false;
    run.holdShrink = 0;
    run.teleportAcc = 0;
    run.graceUsed = false;
    run.yaw = 0.15;
    run.pitch = 0.08;
    run.boostT = 0;
    run.coolT = 0;
    run.freeze = 0.55;
    if (spec.startHeat != null) run.heat = spec.startHeat;
    else run.heat = clamp(18 + (n - 1) * 8, 18, 92);
    buildCourse(spec);
    refreshLive();
    parkAtLive();
    updatePlaque(spec.name);
    applyRoomLights(spec);
    setText("loveWarn", "");
    setText("loveStatus", spec.barker);
    paintHud();
    toast(spec.coda ? "INFERNO" : spec.name.toUpperCase());
    if (run.kitRun && PF.runKit && PF.runKit.reportDepth) {
      try { PF.runKit.reportDepth(run.kitRun, n, { name: spec.name, coda: !!spec.coda }); } catch (_) {}
    }
    return spec;
  }

  function clearStage() {
    const spec = run.spec;
    const n = run.depth;
    run.score += 100 * n;
    run.fanfare = 0.85;
    run.freeze = 0.55;
    toast(spec.coda ? "INFERNO" : spec.name.toUpperCase());
    ping(392, 0.16, "sine");
    ping(784, 0.2, "sine");
    if (kit && kit.sfx) kit.sfx("chapter");
    world.punch = 0.32;
    spawnBurst(world.spark.position, PINK, 14);
    if (typeof PF.setAura === "function") PF.setAura("celebrate");
    const line = AURA.rooms[n];
    if (line) setText("loveWarn", line);
    const next = stageParams(n + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    if (n === AUTHORED_COUNT) toast("ENDLESS");
    seatNewRoom(n + 1);
  }

  function isLive() { return !!(run && run.active && !run.dying && !run.finished); }

  function firePulse() {
    if (!isLive() || run.freeze > 0) return;
    if (run.coolT > 0) return;
    run.boostT = 0.36;
    run.coolT = 0.38;
    world.punch = Math.max(world.punch, 0.12);
    ping(520, 0.08, "sine");
    const btn = el("loveSqueeze");
    if (btn) btn.classList.add("is-down");
    if (world && world.canvas) world.canvas.classList.add("is-holding");
  }

  function endPulse() {
    pulseHeld = false;
    const btn = el("loveSqueeze");
    if (btn) btn.classList.remove("is-down");
    if (world && world.canvas) world.canvas.classList.remove("is-holding");
  }

  function tickGateHazards(dtMs) {
    const spec = run.spec;
    if (spec.kind === "split" && !run.splitFired && run.gateClock >= spec.deadlineMs * (spec.splitAt || 0.42)) {
      run.splitFired = true;
      toast("THE HEART SPLITS");
      setText("loveWarn", "Either heart. The gap is ice.");
      ping(520, 0.12, "square");
      refreshLive();
      world.ice.forEach((c) => {
        if (c.userData.splitIndex === run.liveIndex) {
          const mid = world.gates.find((g) => g.userData.index === run.liveIndex && g.userData.side === "M");
          if (mid) {
            c.visible = true;
            c.position.copy(mid.position);
          }
        }
      });
    }
    if (spec.kind === "feverJump" || (spec.kind === "coda" && spec.teleportMs)) {
      run.teleportAcc += dtMs;
      const every = spec.teleportMs || 1500;
      if (run.teleportAcc >= every) {
        const lives = liveGates();
        const tooClose = lives.some((g) => g.userData.role === "score" && g.position.distanceTo(world.spark.position) < 1.35);
        if (tooClose) {
          run.teleportAcc = every * 0.45;
        } else {
        run.teleportAcc = 0;
        lives.forEach((g) => {
          if (g.userData.role !== "score") return;
          const a = Math.random() * Math.PI * 2;
          const y = 0.9 + Math.random() * 2.4;
          const r = (spec.r0 || 2.4) + rand(-0.25, 0.35);
          const x = Math.sin(a) * r;
          const z = Math.cos(a) * r;
          const dx = -Math.sin(a);
          const dz = -Math.cos(a);
          placeGateAt(g, x, y, z, dx, 0, dz);
        });
        toast("IT JUMPS");
        world.punch = 0.18;
        ping(240, 0.1, "square");
        }
      }
      const shrink = spec.shrink || 0;
      if (shrink) {
        liveGates().forEach((g) => {
          const minR = spec.minHoop || 0.24;
          const next = Math.max(minR, g.userData.radius - shrink * dtMs);
          g.userData.radius = next;
          g.userData.ring.scale.set(next, next, next);
          g.userData.halo.scale.set(next * 1.18, next * 1.18, next * 1.18);
        });
      }
    }
    if (spec.kind === "twin" && (run.gotL || run.gotR) && !(run.gotL && run.gotR)) {
      if (!run.twinStallAt) run.twinStallAt = run.elapsedMs;
      setText("loveWarn", "SWITCH — the other orbit is going cold");
      if (run.elapsedMs - run.twinStallAt >= (spec.stallMs || 5200)) {
        die("ignored the twin");
      }
    }
  }

  function collideSpark() {
    if (!world || !run) return;
    const pos = world.spark.position;
    const sparkR = 0.2;
    const gates = world.gates;
    for (let i = 0; i < gates.length; i += 1) {
      const g = gates[i];
      const u = g.userData;
      if (!g.visible || u.collected) continue;
      if (u.index !== run.liveIndex) continue;
      const hit = localThrough(g, pos);
      const hole = u.radius * 0.88;
      const prevZ = u.lastZ;
      u.lastZ = hit.z;
      const through = Math.abs(hit.z) < 0.5;
      const crossed = prevZ != null && prevZ <= 0.12 && hit.z >= -0.12;
      const inHole = hit.radial < hole + sparkR;
      if ((through || crossed) && inHole) {
        if (u.role === "kill" || u.kind === "gold" || (u.kind === "ghost" && run.spec.kind === "ghostPoison") || (u.kind === "ghost" && run.spec.kind === "coda" && run.spec.poison)) {
          die(u.kind === "gold" ? "the gold flashed" : (u.kind === "ghost" ? "ghost heart lied" : "ice kiss"));
          return;
        }
        if (u.role === "score") {
          collectGate(g);
          return;
        }
      } else if (u.role === "score" && u.live) {
        if (hit.z < 0 && hit.radial < hole + 0.5) u.approached = true;
        if (u.approached && hit.z > 0.6 && hit.radial > hole + sparkR + 0.22) {
          u.passed = true;
          missLive("missed the heart");
          return;
        }
      }
    }
    for (let i = 0; i < world.ice.length; i += 1) {
      const c = world.ice[i];
      if (!c.visible) continue;
      if (c.position.distanceTo(pos) < 0.14 + sparkR) {
        die("ice kiss");
        return;
      }
    }
  }

  function moveSpark(dt, t) {
    const spec = run.spec;
    if (!pointerOn && !pointerHover && !keys.n && !keys.s && !keys.e && !keys.w) {
      lookX *= 0.86;
      lookY *= 0.86;
    }
    const steerX = clamp(lookX + tiltX + (keys.e - keys.w), -1.45, 1.45);
    const steerY = clamp(lookY + tiltY + (keys.n - keys.s), -1.45, 1.45);
    steerVisX = lerp(steerVisX, steerX, 0.24);
    steerVisY = lerp(steerVisY, steerY, 0.24);
    const turn = spec.turn || 2;
    run.yaw += steerX * turn * dt;
    run.pitch = clamp(run.pitch + steerY * turn * dt, -0.82, 0.82);
    headingFromYP(run.yaw, run.pitch, _v);
    const lives = liveGates().filter((g) => g.userData.role === "score");
    const assist = spec.assist || 0;
    if (assist > 0 && lives[0]) {
      _v2.copy(lives[0].position).sub(world.spark.position);
      const dist = _v2.length();
      if (dist > 0.2 && dist < 2.6) {
        _v2.normalize();
        _v.lerp(_v2, assist * dt * 1.45);
        _v.normalize();
        const yp = ypFromHeading(_v);
        run.yaw = yp.yaw;
        run.pitch = yp.pitch;
      }
    }
    let spd = spec.speed || 3.4;
    if (run.boostT > 0) {
      spd *= 1.82;
      run.boostT -= dt;
    }
    if (run.coolT > 0) run.coolT -= dt;
    if (pulseHeld && run.boostT <= 0 && run.coolT <= 0) firePulse();
    world.spark.position.addScaledVector(_v, spd * dt);
    const p = world.spark.position;
    const xz = Math.hypot(p.x, p.z);
    if (xz > 5.05) {
      p.x *= 5.05 / xz;
      p.z *= 5.05 / xz;
    }
    if (xz < 0.58) {
      p.x *= 0.58 / Math.max(0.001, xz);
      p.z *= 0.58 / Math.max(0.001, xz);
    }
    p.y = clamp(p.y, 0.45, 4.45);
    world.spark.lookAt(p.x + _v.x, p.y + _v.y, p.z + _v.z);
    const bank = world.spark.userData.bank;
    if (bank) {
      bank.rotation.z = -steerVisX * 0.9 + Math.sin(t * 8) * 0.04;
      bank.rotation.x = steerVisY * 0.38;
    }
    if (world.spark.userData.wingL) {
      world.spark.userData.wingL.rotation.z = 0.28 - steerVisX * 0.35;
      world.spark.userData.wingR.rotation.z = -0.28 - steerVisX * 0.35;
    }
    if (world.spark.userData.pip) {
      world.spark.userData.pip.position.x = steerVisX * 0.22;
      world.spark.userData.pip.position.y = steerVisY * 0.22;
    }
    world.spark.userData.glow.scale.setScalar(1 + (run.boostT > 0 ? 0.35 : 0) + Math.sin(t * 6) * 0.06);
    world.spark.userData.light.intensity = 1.3 + (run.boostT > 0 ? 1.1 : 0) + Math.sin(t * 5) * 0.2;
  }

  function advancePlay(dt, t, quiet) {
    if (!run) return;
    if (run.dying && !run.finished) {
      run.deathHold -= dt;
      if (run.deathHold <= 0) {
        if (world && world.spark) world.spark.visible = true;
        finish(run.deathReason);
      }
      return;
    }
    if (!run.active || run.dying) return;
    const dtMs = dt * 1000;
    run.elapsedMs += dtMs;
    if (run.freeze > 0) {
      run.freeze -= dt;
    } else {
      run.gateClock += dtMs;
      moveSpark(dt, t);
      tickGateHazards(dtMs);
      if (run.active && !run.dying) collideSpark();
      if (run.active && !run.dying && run.gateClock >= (run.spec.deadlineMs || 7000)) {
        missLive(run.entered ? "missed the heart" : "never found the heart");
      }
    }
    if (run.justCollect > 0) run.justCollect -= dt;
    if (run.fanfare > 0) run.fanfare -= dt;
    const need = run.spec ? neededCount(run.spec) : 1;
    run.heat = clamp(18 + (run.depth - 1) * 7 + (run.clearedIndex / Math.max(1, need)) * 38, 0, 100);
    if (!quiet) paintHud();
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    if (!world) return;
    const dt = Math.min(0.048, world.clock.getDelta() || 0.016);
    const t = world.clock.elapsedTime;

    if (run && (run.active || run.dying) && !run.finished) {
      advancePlay(dt, t, false);
    } else if (!run || !run.active) {
      const idleHeat = 28 + Math.sin(t * 0.7) * 16 + Math.sin(t * 1.3) * 6;
      setMercuryVis(idleHeat);
      const a = t * 0.35;
      world.spark.position.set(Math.sin(a) * 2.3, 1.45 + Math.sin(t * 1.4) * 0.18, Math.cos(a) * 2.3);
      world.spark.lookAt(0, 1.6, 0);
    }

    if (run) setMercuryVis(run.heat);
    const timeLeft = (run && run.active && run.spec)
      ? Math.max(0, 1 - run.gateClock / Math.max(400, run.spec.deadlineMs))
      : 1;
    world.gates.forEach((g, i) => {
      const u = g.userData;
      const pulse = REDUCE ? 1 : 1 + Math.sin(t * 4.2 + i) * (u.live ? 0.06 : 0.02);
      const hurry = (u.live && u.role === "score") ? (0.72 + 0.46 * timeLeft) : 1;
      u.halo.scale.setScalar((u.radius * 1.18) * pulse * hurry);
      u.gem.rotation.y += dt * (u.kind === "gold" ? 4.2 : 1.6);
      if (u.kind === "gold") {
        const flash = 0.45 + Math.abs(Math.sin(t * 11)) * 1.4;
        u.ring.material.emissiveIntensity = flash * (u.live ? 1.8 : 0.35);
        if (u.crossA) u.crossA.rotation.z = Math.PI / 4 + Math.sin(t * 16) * 0.04;
        if (u.crossB) u.crossB.rotation.z = -Math.PI / 4 - Math.sin(t * 16) * 0.04;
      } else if (u.live && u.role === "score") {
        const danger = timeLeft < 0.32;
        u.halo.material.color.setHex(danger ? 0xfff2c4 : kindColor(u.kind));
        u.halo.material.emissive.setHex(danger ? 0xffe08a : kindColor(u.kind));
        if (u.needle) u.needle.rotation.z = (1 - timeLeft) * Math.PI * 1.75;
      }
      if (u.arrow.visible) u.arrow.position.y = u.radius + 0.4 + Math.sin(t * 5) * 0.06;
    });
    world.ice.forEach((c, i) => {
      if (!c.visible) return;
      c.rotation.x += dt * 1.4;
      c.rotation.y += dt * 1.8;
      c.position.y += Math.sin(t * 3 + i) * 0.002;
    });

    const trail = world.spark.userData.trail;
    const sp = world.spark.position;
    trail.forEach((h, i) => {
      const k = (i + 1) / trail.length;
      h.visible = true;
      h.position.set(
        sp.x + Math.sin(t * 3 + i) * 0.04 - _look.x * k * 0.01,
        sp.y - k * 0.12,
        sp.z + Math.cos(t * 3 + i) * 0.04
      );
      headingFromYP(run ? run.yaw : t * 0.35, run ? run.pitch : 0, _v3);
      h.position.addScaledVector(_v3, -k * 0.55);
      h.scale.setScalar(0.14 * (1 - k * 0.7));
      h.material.opacity = 0.55 * (1 - k);
      h.rotation.z = t * 2 + i;
      if (!h.parent) world.scene.add(h);
    });

    let pose = "idle";
    if (run && run.dying) pose = "sad";
    else if (run && run.active && run.gateClock > (run.spec.deadlineMs || 7000) * 0.62) pose = "worry";
    else if (run && run.active) pose = "lean";
    else if (run && run.fanfare) pose = "cheer";
    poseAura(pose, t);

    world.hearts.forEach((h) => {
      if (!h.visible) return;
      h.userData.life -= dt;
      h.position.x += h.userData.vx * dt;
      h.position.y += h.userData.vy * dt;
      h.position.z += h.userData.vz * dt;
      h.rotation.z += dt * 2;
      h.material.opacity = clamp(h.userData.life, 0, 1);
      if (h.userData.life <= 0) h.visible = false;
    });
    world.shards.forEach((s) => {
      if (!s.visible) return;
      s.userData.life -= dt;
      s.userData.vy -= 3.4 * dt;
      s.position.x += s.userData.vx * dt;
      s.position.y += s.userData.vy * dt;
      s.position.z += s.userData.vz * dt;
      s.rotation.x += s.userData.spin * dt;
      if (s.userData.life <= 0) s.visible = false;
    });
    const pos = world.dust.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      let y = pos.getY(i) + dt * 0.12;
      if (y > 4.2) y = 0.1;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;

    world.lanterns.forEach((L, i) => {
      const flick = 0.65 + Math.sin(t * 7 + i) * 0.12 + (world.inferno ? 0.35 : 0);
      L.pl.intensity = flick;
      L.lamp.material.emissiveIntensity = 0.9 + flick;
    });

    world.shake *= 0.86;
    world.punch = lerp(world.punch, 0, 0.12);
    const cam = world.camera;
    const spark = world.spark.position;
    const playing = !!(run && run.active && !run.dying);
    if (playing) {
      headingFromYP(run.yaw, run.pitch, _v);
      const back = 3.55 - world.punch * 0.55;
      const wantX = spark.x - _v.x * back + lookX * 0.25;
      const wantY = spark.y - _v.y * back + 1.05 + lookY * 0.15;
      const wantZ = spark.z - _v.z * back;
      const sway = REDUCE ? 0 : Math.sin(t * 0.35) * 0.06;
      cam.position.x = lerp(cam.position.x, wantX + sway + (Math.random() - 0.5) * world.shake, 0.11);
      cam.position.y = lerp(cam.position.y, wantY + (Math.random() - 0.5) * world.shake, 0.11);
      cam.position.z = lerp(cam.position.z, wantZ, 0.11);
      _look.set(spark.x + _v.x * 1.4, spark.y + 0.15, spark.z + _v.z * 1.4);
      cam.lookAt(_look);
    } else {
      const camA = t * 0.18;
      cam.position.x = lerp(cam.position.x, Math.sin(camA) * 4.55, 0.045);
      cam.position.y = lerp(cam.position.y, 1.92, 0.045);
      cam.position.z = lerp(cam.position.z, Math.cos(camA) * 4.55, 0.045);
      _look.set(0, 1.32, 0);
      cam.lookAt(_look);
    }

    world.renderer.render(world.scene, cam);
  }

  function resize() {
    if (!world) return;
    const wrap = el("loveStage");
    const w = Math.max(16, (wrap && wrap.clientWidth) || 640);
    const h = Math.max(16, (wrap && wrap.clientHeight) || 480);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function ensureWorld() {
    if (world) return world;
    const canvas = el("loveCanvas");
    if (!canvas) return null;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: (window.devicePixelRatio || 1) < 1.6, powerPreference: "high-performance" });
    } catch (err) {
      setText("loveStatus", "This tent wants WebGL, sugar.");
      return null;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.setClearColor(0x12060c, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x14060c, 0.026);
    const camera = new THREE.PerspectiveCamera(54, 1, 0.08, 50);
    camera.position.set(0.35, 1.92, 4.55);
    const clock = new THREE.Clock();

    scene.add(new THREE.AmbientLight(0x6a3048, 0.9));
    scene.add(new THREE.HemisphereLight(0xffd0e0, 0x1a080c, 0.95));
    const key = new THREE.DirectionalLight(0xffe0c8, 0.85);
    key.position.set(-2.2, 4.2, 3.4);
    scene.add(key);

    sharedGeo();
    const tent = makeTent(scene);
    const col = makeColumn();
    scene.add(col);
    const plaque = meshBox(new THREE.MeshBasicMaterial({ map: labelTex("HEARTLINE", "#3a1020", "#ffd0e4", 512, 140) }), 1.05, 0.24, 0.02, 0, 0.72, 0.42);
    scene.add(plaque);
    scene.add(meshBox(makeMat(0x4a2418, { roughness: 0.55, metalness: 0.15 }), 1.2, 0.5, 0.7, 0, 0.26, 0));

    const spark = makeSpark();
    spark.position.set(0, 1.5, 3.2);
    scene.add(spark);

    const aura = makeAura();
    aura.position.set(2.35, 0.08, 0.85);
    aura.rotation.y = -0.7;
    scene.add(aura);

    const hearts = makeHearts();
    hearts.forEach((h) => scene.add(h));
    const shards = makeShards();
    shards.forEach((s) => scene.add(s));
    const ice = [];
    for (let i = 0; i < 8; i += 1) {
      const c = makeIceCrystal();
      scene.add(c);
      ice.push(c);
    }
    const dust = makeDust();
    scene.add(dust);

    world = {
      renderer, scene, camera, clock, canvas,
      col, plaque, aura, spark, hearts, shards, ice, dust,
      lanterns: tent.lanterns, sign: tent.sign,
      gates: [],
      shake: 0, punch: 0, inferno: 0,
    };
    spark.userData.trail.forEach((h) => scene.add(h));
    resize();
    return world;
  }

  function startLoop() {
    if (raf) return;
    if (world && world.clock) world.clock.getDelta();
    raf = requestAnimationFrame(tick);
  }
  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function die(reason) {
    if (!run || run.dying || run.finished) return;
    run.dying = true;
    run.active = false;
    run.holding = false;
    shatterAt(world.spark.position);
    world.spark.visible = false;
    if (typeof PF.setAura === "function") PF.setAura("badLuck");
    setText("loveWarn", auraLine(reason, run.depth));
    run.deathReason = reason;
    run.deathHold = DEATH_HOLD_MS / 1000;
  }

  function finish(reason) {
    if (!run || run.finished) return;
    run.finished = true;
    run.active = false;
    run.dying = false;
    if (world && world.spark) world.spark.visible = true;
    const depth = run.depth | 0;
    const score = Math.round(run.score);
    const souvenir = reason === "souvenir";
    const leave = reason === "leave";
    const rk = PF.runKit;
    if (rk && run.kitRun && typeof rk.finishRun === "function") {
      try {
        rk.finishRun(run.kitRun, {
          gameId: GAME_ID, depth, score,
          deathReason: souvenir ? "souvenir" : deathKey(reason),
          cashedOut: souvenir,
          meta: { reason, room: run.spec && run.spec.name, kind: run.spec && run.spec.kind },
        }, { navigate: false });
      } catch (_) {}
    }
    const aura = auraLine(reason, depth);
    const challenge = `Beat my Love Heat Stage ${depth} on Penny Fever`;
    setText("loveResultDepth", souvenir ? `SOUVENIR · HEAT STAGE ${depth}` : `HEAT STAGE ${depth}`);
    setText("loveResultScore", souvenir ? `SCORE ${score} · AUTHORED COMPLETE` : `SCORE ${score} · ${String(deathKey(reason)).replace(/_/g, " ").toUpperCase()}`);
    setText("loveResultAura", "Aura: " + aura);
    setText("loveChallengeText", challenge);
    const result = el("loveResult");
    if (result) result.hidden = false;
    const verdict = el("loveVerdict");
    if (verdict) { verdict.hidden = false; verdict.textContent = aura; }
    setText("loveStatus", leave ? "Stepped off mid-heat." : souvenir ? "Souvenir stamped. The authored ride ends." : `Glass dead · Heat Stage ${depth}`);
    const go = el("loveGo");
    if (go) { go.disabled = false; go.textContent = "FLY AGAIN · 1 demo coin"; }
    const hold = el("loveSqueeze");
    if (hold) hold.disabled = true;
    overlayMode(true);
    if (kit && kit.setMode) kit.setMode(el("loveCard"), "result");
    if (typeof PF.award === "function") {
      if (depth > 0) PF.award(Math.max(8, Math.floor(score / 10)), true, "Love Tester");
      else PF.award(0, false, "Love Tester miss");
    }
    if (typeof PF.showBanner === "function" && !leave) {
      PF.showBanner(depth > 0, souvenir ? "SOUVENIR" : `HEAT ${depth}`, aura);
    }
    if (typeof PF.refreshNightBoard === "function") PF.refreshNightBoard();
    paintBest();
    endPulse();
  }

  function startRun() {
    if (run && (run.active || run.dying)) return;
    if (typeof PF.spendDemoCoin === "function" && PF.spendDemoCoin("love") === false) {
      setText("loveStatus", "Out of demo coins · grant a pass");
      return;
    }
    const rk = PF.runKit;
    let kitRun = null;
    if (rk && typeof rk.startRun === "function") {
      try { kitRun = rk.startRun({ gameId: GAME_ID, feverNode: true }); } catch (_) {}
    }
    ensureWorld();
    if (world) world.spark.visible = true;
    run = {
      active: true, dying: false, finished: false, holding: false,
      heat: 22, score: 0, depth: 1, kitRun, spec: null,
      elapsedMs: 0, liveIndex: 0, clearedIndex: 0, collected: 0,
      yaw: 0, pitch: 0.08, boostT: 0, coolT: 0, freeze: 0,
      gateClock: 0, entered: false, justCollect: 0, fanfare: 0,
      warnLock: "",
    };
    const res = el("loveResult"); if (res) res.hidden = true;
    const verdict = el("loveVerdict"); if (verdict) verdict.hidden = true;
    const copied = el("loveCopied"); if (copied) copied.hidden = true;
    const go = el("loveGo"); if (go) { go.disabled = true; go.textContent = "IN THE PINK…"; }
    const hold = el("loveSqueeze"); if (hold) hold.disabled = false;
    overlayMode(false);
    if (kit && kit.setMode) kit.setMode(el("loveCard"), "play");
    if (typeof PF.focusCard === "function") PF.focusCard("loveCard", true);
    if (typeof PF.setAura === "function") PF.setAura("point");
    seatNewRoom(1);
    ping(330, 0.08, "sine");
    if (kit && kit.sfx) kit.sfx("stamp");
    startLoop();
  }

  function paintBest() {
    const state = typeof PF.getState === "function" ? PF.getState() : null;
    const best = (state && state.bestDepth && state.bestDepth.love) || 0;
    setText("loveBestDepth", best ? `Heat Stage ${best}` : "—");
    if (!(run && run.active)) setText("loveStageDepth", "—");
  }

  function stayingInTent() {
    const hash = (location.hash || "").replace(/^#/, "");
    return hash === "cabinet/love" || hash === "cabinet/love/play" || hash === "cabinet/love/result";
  }

  function onShow() {
    ensureWorld();
    resize();
    paintBest();
    setText("loveStatus", "One coin · DRAG to bank · fly pink LOVE · gold X is a liar");
    if (!(run && run.active)) {
      setText("loveBarker", "DRAG the tent to bank the spark. Fly THROUGH the pink LOVE heart. Gold with an X is a lie.");
      overlayMode(true);
      if (kit && kit.setMode && !(run && run.finished)) kit.setMode(el("loveCard"), "vestibule");
    }
    startLoop();
  }

  function onLeave() {
    if (stayingInTent()) return;
    if (run && (run.active || run.dying) && !run.finished) finish("leave");
    endPulse();
    stopLoop();
  }

  function setLookFromEvent(e) {
    const canvas = el("loveCanvas");
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    if (pointerOn) {
      lookX = clamp((e.clientX - dragStartX) / Math.max(36, r.width * 0.2), -1.4, 1.4);
      lookY = clamp(-(e.clientY - dragStartY) / Math.max(36, r.height * 0.2), -1.4, 1.4);
    } else if (e.pointerType === "mouse") {
      lookX = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 1.2;
      lookY = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * -1.2;
    }
  }

  function hookTilt() {
    if (tiltHooked) return;
    tiltHooked = true;
    const DO = window.DeviceOrientationEvent;
    if (DO && typeof DO.requestPermission === "function") {
      try { DO.requestPermission().catch(() => {}); } catch (_) { /* ignore */ }
    }
    window.addEventListener("deviceorientation", (e) => {
      if (e.gamma == null || e.beta == null) return;
      tiltX = clamp(e.gamma / 26, -1, 1);
      tiltY = clamp((40 - e.beta) / 28, -1, 1);
    }, true);
  }

  function keyOn(e, down) {
    const c = e.code;
    if (c === "ArrowLeft" || c === "KeyA") keys.w = down ? 1 : 0;
    if (c === "ArrowRight" || c === "KeyD") keys.e = down ? 1 : 0;
    if (c === "ArrowUp" || c === "KeyW") keys.n = down ? 1 : 0;
    if (c === "ArrowDown" || c === "KeyS") keys.s = down ? 1 : 0;
  }

  function bind() {
    if (bound) return;
    bound = true;
    const go = el("loveGo");
    if (go) go.addEventListener("click", startRun);
    const overlay = el("loveOverlay");
    if (overlay) overlay.addEventListener("click", (e) => { e.preventDefault(); startRun(); });
    const squeeze = el("loveSqueeze");
    const canvas = el("loveCanvas");
    if (squeeze) {
      squeeze.addEventListener("pointerdown", (e) => {
        if (e.preventDefault) e.preventDefault();
        pulseHeld = true;
        firePulse();
      });
      squeeze.addEventListener("pointerup", endPulse);
      squeeze.addEventListener("pointercancel", endPulse);
      squeeze.addEventListener("lostpointercapture", endPulse);
    }
    if (canvas) {
      canvas.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (e.preventDefault) e.preventDefault();
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        pointerOn = true;
        dragging = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        hookTilt();
        setLookFromEvent(e);
        if (canvas) canvas.classList.add("is-holding");
        if (!isLive()) return;
      });
      canvas.addEventListener("pointerup", (e) => {
        const moved = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
        pointerOn = false;
        if (!isLive()) {
          dragging = false;
          startRun();
          return;
        }
        if (!dragging && moved < 14) firePulse();
        dragging = false;
        endPulse();
      });
      canvas.addEventListener("pointercancel", () => { pointerOn = false; dragging = false; endPulse(); });
      canvas.addEventListener("lostpointercapture", () => { pointerOn = false; dragging = false; });
      canvas.addEventListener("pointermove", (e) => {
        if (Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY) > 10) dragging = true;
        if (e.pointerType === "mouse" || pointerOn) setLookFromEvent(e);
      });
      canvas.addEventListener("pointerenter", () => { pointerHover = true; });
      canvas.addEventListener("pointerleave", () => {
        pointerHover = false;
        if (!pointerOn) {
          lookX *= 0.3;
          lookY *= 0.3;
        }
      });
    }
    window.addEventListener("keydown", (e) => {
      const cab = el("cabinet-love");
      if (!cab || cab.hidden) return;
      keyOn(e, true);
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (!isLive() && el("loveGo") && !el("loveGo").disabled) startRun();
        else {
          pulseHeld = true;
          firePulse();
        }
      }
    });
    window.addEventListener("keyup", (e) => {
      keyOn(e, false);
      if (e.code === "Space" || e.key === " ") endPulse();
    });
    window.addEventListener("blur", () => { keys.n = keys.s = keys.e = keys.w = 0; endPulse(); });
    const copy = el("loveCopy") || el("loveChallenge");
    if (copy) {
      copy.addEventListener("click", () => {
        const text = (el("loveChallengeText") && el("loveChallengeText").textContent) || "Beat my Love Heat Stage 0 on Penny Fever";
        if (kit && kit.copyText) {
          kit.copyText(text, () => { const c = el("loveCopied"); if (c) c.hidden = false; });
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => { const c = el("loveCopied"); if (c) c.hidden = false; }).catch(() => {});
        }
      });
    }
    window.addEventListener("resize", resize);
    if (window.ResizeObserver && el("loveStage")) {
      new ResizeObserver(resize).observe(el("loveStage"));
    }
    if (PF.runKit && typeof PF.runKit.declare === "function") {
      try { PF.runKit.declare(GAME_ID, P0_MOUNT); } catch (_) {}
    }

    window.__loveTune = {
      snap() {
        const lives = world ? world.gates.filter((g) => g.userData.live && !g.userData.collected && g.visible) : [];
        const scores = lives.filter((g) => g.userData.role === "score");
        const pack = (g) => (g ? {
          x: +g.position.x.toFixed(3), y: +g.position.y.toFixed(3), z: +g.position.z.toFixed(3),
          kind: g.userData.kind, role: g.userData.role, side: g.userData.side || "",
          r: +((g.userData.radius || 0).toFixed(3)),
        } : null);
        const spark = world && world.spark;
        return {
          active: isLive(), dying: !!(run && run.dying), finished: !!(run && run.finished),
          depth: run && run.depth, name: run && run.spec && run.spec.name, kind: run && run.spec && run.spec.kind,
          cleared: run && run.clearedIndex, need: run && run.spec && neededCount(run.spec),
          freeze: run && +(run.freeze || 0).toFixed(2), score: run && Math.round(run.score),
          yaw: run && +run.yaw.toFixed(3), pitch: run && +run.pitch.toFixed(3),
          gotL: !!(run && run.gotL), gotR: !!(run && run.gotR),
          spark: spark ? { x: +spark.position.x.toFixed(3), y: +spark.position.y.toFixed(3), z: +spark.position.z.toFixed(3) } : null,
          gate: pack(scores[0]), gates: scores.map(pack),
          kills: lives.filter((g) => g.userData.role === "kill").map(pack),
          hazard: (el("loveHazard") || {}).textContent || "",
          warn: (el("loveWarn") || {}).textContent || "",
          aura: (el("loveResultAura") || {}).textContent || "",
          resultLine: (el("loveResultScore") || {}).textContent || "",
          overlay: !!(el("loveOverlay") && !el("loveOverlay").hidden),
        };
      },
      steer(x, y) {
        lookX = clamp(x, -1.4, 1.4);
        lookY = clamp(y, -1.4, 1.4);
        pointerOn = true;
        pointerHover = true;
      },
      release() { pointerOn = false; },
      pulse() { firePulse(); },
      fast(seconds) {
        const events = [];
        let last = "";
        const dt = 1 / 60;
        const frames = Math.max(1, Math.floor((seconds || 20) * 60));
        stopLoop();
        for (let i = 0; i < frames; i += 1) {
          if (!run || run.finished) break;
          if (run.active && !run.dying) {
            const aimed = this.aim();
            if (aimed && aimed.dist > 1.65) firePulse();
          }
          advancePlay(dt, i * dt, true);
          const s = this.snap();
          const k = [s.depth, s.cleared, s.dying, s.finished, s.name].join("|");
          if (k !== last) {
            last = k;
            events.push({
              t: +(i * dt).toFixed(2), depth: s.depth, name: s.name, kind: s.kind,
              cleared: s.cleared, need: s.need, score: s.score, warn: s.warn,
              dying: s.dying, finished: s.finished, aura: s.aura, resultLine: s.resultLine,
              dist: s.gate && s.spark ? +Math.hypot(s.gate.x - s.spark.x, s.gate.y - s.spark.y, s.gate.z - s.spark.z).toFixed(2) : null,
            });
          }
        }
        events.push(Object.assign({ end: true }, this.snap()));
        startLoop();
        return events;
      },
      aim() {
        if (!isLive() || !world || !run) return null;
        const scores = world.gates.filter((g) => g.userData.live && !g.userData.collected && g.visible && g.userData.role === "score");
        const g = scores[0];
        if (!g) return null;
        _v.copy(g.position).sub(world.spark.position);
        const dist = _v.length() || 1;
        _v.multiplyScalar(1 / dist);
        const want = ypFromHeading(_v);
        let dyaw = want.yaw - run.yaw;
        while (dyaw > Math.PI) dyaw -= Math.PI * 2;
        while (dyaw < -Math.PI) dyaw += Math.PI * 2;
        lookX = clamp(dyaw * 1.7, -1.4, 1.4);
        lookY = clamp((want.pitch - run.pitch) * 1.9, -1.4, 1.4);
        pointerOn = true;
        pointerHover = true;
        return { dist: +dist.toFixed(3), lookX: +lookX.toFixed(3), lookY: +lookY.toFixed(3), side: g.userData.side || "" };
      },
    };
  }

  PF.registerVendor({
    id: "love",
    playKey: "love",
    chalk: "Steer the spark. Kiss the pink. Ice shatters hotter.",
    defaults: { loveBest: 0, loveStreak: 0 },
    bind,
    onShow,
    onLeave,
    onReset() {
      if (run && run.active) finish("leave");
      run = null;
      endPulse();
      const go = el("loveGo");
      if (go) { go.disabled = false; go.textContent = "START · 1 demo coin"; }
      const hold = el("loveSqueeze");
      if (hold) hold.disabled = true;
      const result = el("loveResult"); if (result) result.hidden = true;
      const verdict = el("loveVerdict"); if (verdict) verdict.hidden = true;
      overlayMode(true);
      if (kit && kit.setMode) kit.setMode(el("loveCard"), "vestibule");
      paintBest();
    },
    refreshDepth(state) {
      const best = (state && state.bestDepth && state.bestDepth.love) || 0;
      setText("loveBestDepth", best ? `Heat Stage ${best}` : "—");
      if (run && (run.active || run.dying)) {
        const spec = run.spec;
        setText("loveStageDepth", spec && spec.coda
          ? `ENDLESS · Heat Stage ${run.depth}`
          : `Heat Stage ${run.depth}${spec ? " · " + spec.name : ""}`);
      }
    },
  });
}
