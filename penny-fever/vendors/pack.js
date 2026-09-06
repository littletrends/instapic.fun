/* Night Kit — 3D lantern-pack tent. PF only. Never booth/port 6000. Never Imagine.
 * Redesign: fly Aura’s heart lantern, scoop the night into a hanging trunk, then dive it.
 * Custom engine · depthUnit: Route · 8 authored nights + ENDLESS coda.
 * Joke: the suitcase is a loadout. What you pack becomes the dive you have to survive.
 * Aura locked look: brunette pigtails, yellow crown + red heart, green pinafore, black shoes. */
import * as THREE from "../world/lib/three.module.min.js";

(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const kit = PF.kit || {};
  const GAME_ID = "pack";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const DEATH_HOLD = 820;
  const TAU = Math.PI * 2;
  const REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;
  const WOOD = 0x3a2418;
  const WOOD_DARK = 0x1a100c;
  const VELVET = 0x4a1a28;
  const BRASS = 0xd4a45a;
  const BLACK = 0x141414;

  const AURA = {
    unpacked: "Aura: Night left without you. The lantern was still yawning.",
    stolen: "Aura: A moth packed for you. Rude.",
    lid: "Aura: Lid slammed. You were still shopping.",
    room_fail: "Aura: The packed night ate the lantern.",
    leave: "Aura: Walked off mid-pack. The lanterns kept the seat.",
    souvenir: "Aura: Midnight Trunk packed. Souvenir — the night bowed.",
    deep: (n) => `Aura: Route ${n}. You’re living in my suitcase.`,
    latch: "Aura: That’s the night you packed. Now fly it in order.",
    packed: "Aura: Loadout’s honest. Latch it — or tap a slot to swap.",
    clear: "Aura: Morning stamp. Next kit’s meaner.",
    route: "Aura: Route packed. The night wants another suitcase.",
    still: "Aura: The charm only loves statues. Let go.",
    ghost: "Aura: Fog doesn’t travel. Pack the real one.",
    shallow: "Aura: Empty trunk. The night didn’t even try you.",
    moth: "Aura: Moths vote with their mouths.",
    wall: "Aura: Velvet doesn’t bounce. Steer next time.",
    wrong: "Aura: Pretty, but that’s not the call.",
  };

  const KITS = [
    { id: "press", title: "Pressed Penny", short: "PENNY", verb: "GATES", dive: "Time the slamming brass lids", color: 0xd4a45a, shape: "penny" },
    { id: "lantern", title: "Heart Lantern", short: "LANTERN", verb: "HOOPS", dive: "Dark room — fly through flame hoops", color: 0xd22b3a, shape: "lantern" },
    { id: "ticket", title: "Ticket Fan", short: "TICKET", verb: "TICKETS", dive: "Hit gold tickets · dodge red", color: 0xf0d09a, shape: "ticket" },
    { id: "still", title: "Stillness Charm", short: "CHARM", verb: "STILL", dive: "Purple room — let go, don’t boost", color: 0x8a4a9a, shape: "charm" },
    { id: "coin", title: "Spare Coin", short: "COIN", verb: "COINS", dive: "Catch bouncing coins at the peak", color: 0xc46a2a, shape: "coin" },
    { id: "map", title: "Night Map", short: "MAP", verb: "STARS", dive: "Stay on the star path", color: 0x3a8a8a, shape: "map" },
  ];

  const AUTHORED = [
    {
      id: 1, name: "Soft Pack", kind: "teach",
      packMs: 28000, need: 3, featured: [], ghost: false, moths: 5, chase: 0,
      lid: false, wind: 0, strikes: 3, kitN: 6, speed: 0.72,
      barker: "Pack THREE kits. Each one becomes a room you dive — in that order.",
    },
    {
      id: 2, name: "Lantern Choir", kind: "featured",
      packMs: 20000, need: 3, featured: ["lantern"], ghost: false, moths: 7, chase: 0.12,
      lid: false, wind: 0.1, strikes: 3, kitN: 7, speed: 0.88,
      barker: "Lanterns pay extra. You still choose the three rooms.",
    },
    {
      id: 3, name: "Moth Hour", kind: "moth",
      packMs: 17000, need: 3, featured: [], ghost: false, moths: 12, chase: 0.72,
      lid: false, wind: 0.1, strikes: 3, kitN: 6, speed: 0.95,
      barker: "Moths steal your loadout. Guard the three rooms you want.",
    },
    {
      id: 4, name: "Lid Alley", kind: "lid",
      packMs: 16000, need: 3, featured: ["press"], ghost: false, moths: 8, chase: 0.2,
      lid: true, lidEvery: 2800, wind: 0.08, strikes: 3, kitN: 6, speed: 1,
      barker: "Pennies pay extra. The packing lid slams — stay out of the mouth.",
    },
    {
      id: 5, name: "Ghost Compartment", kind: "ghost",
      packMs: 16000, need: 3, featured: [], ghost: true, moths: 8, chase: 0.25,
      lid: false, wind: 0.18, strikes: 2, kitN: 8, speed: 1.05,
      barker: "Fog kits look honest. They will not become a room.",
    },
    {
      id: 6, name: "Crosswind", kind: "wind",
      packMs: 15000, need: 3, featured: ["ticket", "map"], ghost: true, moths: 9, chase: 0.28,
      lid: true, lidEvery: 3200, wind: 0.55, strikes: 2, kitN: 8, speed: 1.1,
      barker: "Tickets and maps pay extra. Wind lies. You still pick the rooms.",
    },
    {
      id: 7, name: "Charm Freeze", kind: "still",
      packMs: 14000, need: 3, featured: ["still", "coin"], ghost: true, moths: 10, chase: 0.32,
      lid: true, lidEvery: 2600, wind: 0.2, strikes: 2, kitN: 8, speed: 1.12,
      barker: "Charms and coins pay extra. Purple rooms: let go.",
    },
    {
      id: 8, name: "Midnight Trunk", kind: "finale",
      packMs: 13000, need: 3, featured: [], ghost: true, moths: 14, chase: 0.55,
      lid: true, lidEvery: 2200, wind: 0.4, strikes: 2, kitN: 8, speed: 1.22,
      barker: "Pick your three rooms. The suitcase is the night you have to fly.",
    },
  ];

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Night Kit",
    depthUnit: "Route",
    sheet: "GOBLIN_BATCH06_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  let world = null;
  let run = null;
  let raf = 0;
  let lastT = 0;
  let shown = false;
  let toastUntil = 0;
  const pointerNdc = new THREE.Vector2(0, 0);
  const keys = Object.create(null);
  const input = { boost: false, nx: 0, ny: 0 };
  const _v = new THREE.Vector3();
  const _v2 = new THREE.Vector3();

  function el(id) {
    return (PF.$ && PF.$(id)) || document.getElementById(id);
  }
  function card() { return el("packCard"); }
  function setText(id, v) {
    const n = el(id);
    if (n) n.textContent = v;
  }
  function rk() { return PF.runKit; }
  function sfx(name) { if (kit.sfx) kit.sfx(name); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function routeSpec(n) {
    if (n <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[n - 1]);
    const k = n - AUTHORED_COUNT;
    return {
      id: n, name: "Night Edge " + k, kind: "coda", coda: true,
      packMs: Math.max(7000, 11000 - k * 280),
      need: 3, featured: [], ghost: true, moths: Math.min(18, 12 + k),
      chase: Math.min(0.9, 0.5 + k * 0.04),
      lid: true, lidEvery: Math.max(1400, 2200 - k * 70),
      wind: Math.min(0.85, 0.42 + k * 0.04), strikes: 2, kitN: 8,
      speed: Math.min(1.7, 1.2 + k * 0.05),
      barker: "ENDLESS. The suitcase learned your hands.",
    };
  }

  function codaOn() {
    const row = rk() && ((rk().declared && rk().declared[GAME_ID]) || (rk().p0 && rk().p0[GAME_ID]));
    if (row && typeof row.codaEnabled === "boolean") return !!row.codaEnabled;
    return CODA_ENABLED;
  }

  function declareP0() {
    const k = rk();
    if (!k) return;
    const spec = Object.assign({}, P0_MOUNT, { authored: AUTHORED, authoredCount: AUTHORED_COUNT });
    if (typeof k.declare === "function") {
      try { k.declare(GAME_ID, spec); } catch (_) { /* already */ }
    }
    k.p0 = k.p0 || {};
    k.declared = k.declared || {};
    k.mounted = k.mounted || {};
    k.p0[GAME_ID] = spec;
    k.declared[GAME_ID] = spec;
    k.mounted[GAME_ID] = true;
  }

  function mat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.72, metalness: 0.08,
    }, extra || {}));
  }

  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function woodTex() {
    return canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 18; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${0.04 + (i % 3) * 0.03})`;
        ctx.fillRect(i * 14 + 4, 0, 3, 256);
      }
      ctx.strokeStyle = "rgba(90,50,24,0.45)";
      ctx.lineWidth = 1.2;
      for (let y = 8; y < 256; y += 17) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(80, y + 6, 160, y - 5, 256, y + 3);
        ctx.stroke();
      }
    });
  }

  function stripeTex() {
    return canvasTex(128, 128, (ctx) => {
      for (let i = 0; i < 8; i += 1) {
        ctx.fillStyle = i % 2 ? "#7b2743" : "#f0d09a";
        ctx.fillRect(i * 16, 0, 16, 128);
      }
    });
  }

  function starTex() {
    return canvasTex(512, 512, (ctx) => {
      ctx.fillStyle = "#070b16";
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 220; i += 1) {
        ctx.fillStyle = `rgba(255,245,220,${0.28 + Math.random() * 0.72})`;
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 1.6 + 0.3, 0, TAU);
        ctx.fill();
      }
    });
  }

  function labelTex(text, hex) {
    return canvasTex(256, 64, (ctx) => {
      ctx.clearRect(0, 0, 256, 64);
      ctx.fillStyle = "rgba(12,6,9,0.78)";
      roundRect(ctx, 8, 8, 240, 48, 12);
      ctx.fill();
      ctx.strokeStyle = hex || "#d4a45a";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#f5ead0";
      ctx.font = "700 18px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 128, 33);
    });
  }

  function howToTex() {
    return canvasTex(512, 256, (ctx) => {
      ctx.fillStyle = "rgba(12,6,9,0.82)";
      roundRect(ctx, 12, 12, 488, 232, 18);
      ctx.fill();
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = "#e8b84a";
      ctx.font = "700 28px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("THE SUITCASE IS A LOADOUT", 256, 52);
      ctx.fillStyle = "#fff6ec";
      ctx.font = "600 20px Georgia, serif";
      ctx.fillText("Pack 3 kits — each becomes a room", 256, 98);
      ctx.fillText("Order packed = order you dive", 256, 134);
      ctx.fillText("Tap a slot to swap · LATCH / Enter", 256, 170);
      ctx.fillText("STEER pointer · HOLD to fly", 256, 206);
    });
  }

  function addBox(parent, material, w, h, d, x, y, z) {
    const m = new THREE.Mesh(world.geo.box, material);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function addSphere(parent, material, r, x, y, z) {
    const m = new THREE.Mesh(world.geo.sphere, material);
    m.scale.setScalar(r);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function addCyl(parent, material, rTop, rBot, h, x, y, z) {
    const m = new THREE.Mesh(world.geo.cyl, material);
    m.scale.set(rTop, h, rBot);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = mat(SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const blouse = mat(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.2 });
    const dress = mat(DRESS, { emissive: 0x0a2010, emissiveIntensity: 0.25 });
    const hairM = mat(HAIR, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });
    const gold = mat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const heart = mat(HEART, { emissive: HEART, emissiveIntensity: 0.6, roughness: 0.4 });
    const shoe = mat(BLACK, { roughness: 0.25, metalness: 0.35 });

    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    addCyl(hip, blouse, 0.13, 0.16, 0.28, 0, 0.28, 0);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.12, 0.34, 12), dress);
    skirt.position.y = 0.06;
    hip.add(skirt);
    const bib = addBox(hip, dress, 0.2, 0.16, 0.04, 0, 0.34, 0.14);
    bib.rotation.x = -0.08;
    const heartGem = addBox(hip, heart, 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    heartGem.rotation.z = Math.PI / 4;

    const head = new THREE.Group();
    head.position.y = 0.58;
    hip.add(head);
    addSphere(head, skin, 0.175, 0, 0.02, 0);
    const eyeW = mat(0xf7f2ea);
    const eyeD = mat(0x2a1810);
    [-1, 1].forEach((side) => {
      const w = addSphere(head, eyeW, 0.038, side * 0.055, 0.03, 0.15);
      w.scale.set(0.038, 0.044, 0.02);
      addSphere(head, eyeD, 0.02, side * 0.055, 0.03, 0.168);
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), mat(0xc45a6a));
    smile.position.set(0, -0.05, 0.16);
    smile.rotation.x = 2.6;
    head.add(smile);
    addSphere(head, hairM, 0.23, 0, 0.06, -0.02);
    addBox(head, hairM, 0.28, 0.07, 0.1, 0, 0.14, 0.16);
    [-1, 1].forEach((side) => {
      addSphere(head, hairM, 0.11, side * 0.2, -0.04, 0.04);
      addSphere(head, heart, 0.045, side * 0.2, 0.06, 0.06);
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
    const gem = addBox(crown, heart, 0.055, 0.055, 0.025, 0, 0.02, 0.11);
    gem.rotation.z = Math.PI / 4;

    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0.0, 0);
      const len = arm ? 0.28 : 0.34;
      const rad = arm ? 0.035 : 0.042;
      addCyl(pivot, arm ? skin : dress, rad, rad, len, 0, -len / 2, 0);
      if (!arm) addBox(pivot, shoe, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03);
      else addSphere(pivot, skin, 0.04, 0, -len, 0);
      hip.add(pivot);
      return pivot;
    }
    g.userData = { hip, head, armL: limb(-1, true), armR: limb(1, true), legL: limb(-1, false), legR: limb(1, false), t: 0 };
    g.scale.setScalar(1.18);
    return g;
  }

  function animateAura(dt, mode) {
    if (!world || !world.aura) return;
    const u = world.aura.userData;
    u.t += dt * (mode === "celebrate" ? 8 : 2.6);
    u.hip.position.y = 0.42 + Math.sin(u.t) * 0.012;
    const swing = Math.sin(u.t * 0.5) * 0.08;
    u.legL.rotation.x = -swing * 0.7;
    u.legR.rotation.x = swing * 0.7;
    if (mode === "point") {
      u.armR.rotation.x = -1.15;
      u.armR.rotation.z = -0.25;
      u.armL.rotation.x = swing;
    } else if (mode === "celebrate") {
      u.armL.rotation.z = 0.9 + Math.sin(u.t * 2.2) * 0.35;
      u.armR.rotation.z = -0.9 + Math.sin(u.t * 2.2 + 1) * 0.35;
      u.armL.rotation.x = -0.2;
      u.armR.rotation.x = -0.2;
    } else {
      u.armL.rotation.x = swing;
      u.armR.rotation.z = -0.85 + Math.sin(u.t * 2.4) * 0.4;
      u.armR.rotation.x = -0.15;
    }
  }

  function makeKitMesh(def, ghost) {
    const g = new THREE.Group();
    const col = mat(def.color, {
      emissive: def.color,
      emissiveIntensity: ghost ? 0.12 : 0.42,
      metalness: def.shape === "penny" || def.shape === "coin" ? 0.7 : 0.12,
      roughness: 0.35,
      transparent: !!ghost,
      opacity: ghost ? 0.42 : 1,
    });
    if (def.shape === "penny" || def.shape === "coin") {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 22), col);
      p.rotation.x = Math.PI / 2;
      g.add(p);
      addCyl(g, mat(0x8a6230, { metalness: 0.6 }), 0.07, 0.07, 0.05, 0, 0, 0.01);
    } else if (def.shape === "lantern") {
      addCyl(g, col, 0.11, 0.13, 0.26, 0, 0, 0);
      addSphere(g, mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.9 }), 0.08, 0, 0.05, 0);
      addCyl(g, mat(BRASS, { metalness: 0.7 }), 0.02, 0.02, 0.14, 0, 0.2, 0);
    } else if (def.shape === "ticket") {
      addBox(g, col, 0.32, 0.18, 0.02, 0, 0, 0);
      addBox(g, mat(HEART, { emissive: HEART, emissiveIntensity: 0.5 }), 0.07, 0.07, 0.03, 0, 0, 0.02).rotation.z = Math.PI / 4;
    } else if (def.shape === "charm") {
      g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.16), col));
    } else if (def.shape === "map") {
      addBox(g, col, 0.3, 0.02, 0.22, 0, 0, 0);
      addSphere(g, mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.7 }), 0.03, -0.08, 0.04, -0.04);
      addSphere(g, mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.7 }), 0.03, 0.06, 0.04, 0.05);
      addSphere(g, mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.7 }), 0.03, 0.1, 0.04, -0.06);
    }
    const spr = new THREE.Mesh(
      new THREE.PlaneGeometry(0.88, 0.18),
      new THREE.MeshBasicMaterial({ map: labelTex(ghost ? "FOG" : (def.short + " · " + def.verb), ghost ? "#8a6a90" : "#d4a45a"), transparent: true })
    );
    spr.position.y = 0.32;
    g.add(spr);
    g.userData.label = spr;
    g.userData.def = def;
    g.userData.ghost = !!ghost;
    return g;
  }

  function makeCraft() {
    const g = new THREE.Group();
    const gold = mat(GOLD, { metalness: 0.7, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.7 });
    const heart = mat(HEART, { emissive: HEART, emissiveIntensity: 0.85, roughness: 0.35 });
    const brass = mat(BRASS, { metalness: 0.75, roughness: 0.28 });
    const wood = mat(0x4a2e18, { roughness: 0.55 });
    const velvet = mat(VELVET, { roughness: 0.9 });

    const lamp = new THREE.Group();
    lamp.position.y = 0.18;
    addCyl(lamp, brass, 0.045, 0.05, 0.08, 0, 0.2, 0);
    const glass = addCyl(lamp, mat(0xf0d09a, { transparent: true, opacity: 0.45, emissive: GOLD, emissiveIntensity: 0.55 }), 0.13, 0.15, 0.28, 0, 0, 0);
    const flame = addSphere(lamp, mat(GOLD, { emissive: GOLD, emissiveIntensity: 1.4 }), 0.09, 0, 0.02, 0);
    const gem = addBox(lamp, heart, 0.1, 0.1, 0.04, 0, 0.02, 0.14);
    gem.rotation.z = Math.PI / 4;
    g.add(lamp);

    const basket = new THREE.Group();
    basket.position.y = -0.38;
    addBox(basket, wood, 0.62, 0.22, 0.42, 0, 0, 0);
    addBox(basket, velvet, 0.54, 0.04, 0.34, 0, 0.08, 0);
    addBox(basket, brass, 0.1, 0.04, 0.06, 0, 0.04, 0.22);
    const slots = [];
    [-0.18, 0, 0.18].forEach((x) => {
      const s = new THREE.Group();
      s.position.set(x, 0.1, 0);
      addBox(s, mat(0x2a1018, { emissive: 0x3a1818, emissiveIntensity: 0.2 }), 0.14, 0.03, 0.14, 0, 0, 0);
      basket.add(s);
      slots.push(s);
    });
    g.add(basket);

    const light = new THREE.PointLight(0xffd090, 1.6, 7.5, 1.6);
    light.position.set(0, 0.18, 0);
    g.add(light);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.16, depthWrite: false })
    );
    glow.position.y = 0.16;
    g.add(glow);

    g.userData = { lamp, basket, slots, light, flame, glow, glass, trail: [] };
    return g;
  }

  function makeMoth() {
    const g = new THREE.Group();
    const body = mat(0xe8dcc8, { roughness: 0.85 });
    addSphere(g, body, 0.035, 0, 0, 0);
    const wingM = mat(0xf5ead0, { transparent: true, opacity: 0.85, roughness: 0.7, side: THREE.DoubleSide });
    const w1 = addBox(g, wingM, 0.14, 0.01, 0.08, 0.08, 0, 0);
    const w2 = addBox(g, wingM, 0.14, 0.01, 0.08, -0.08, 0, 0);
    g.userData.wings = [w1, w2];
    return g;
  }

  function buildWorld() {
    const canvas = el("packCanvas");
    if (!canvas) return null;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch (err) {
      prompt("The lanterns need WebGL to light this tent.");
      return null;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a050c);
    scene.fog = new THREE.FogExp2(0x12080e, 0.048);
    const camera = new THREE.PerspectiveCamera(52, 16 / 11, 0.12, 90);
    camera.position.set(0.4, 2.2, 6.2);
    const geo = {
      box: new THREE.BoxGeometry(1, 1, 1),
      sphere: new THREE.SphereGeometry(1, 14, 12),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
    };
    world = { renderer, scene, camera, geo, canvas, clock: 0, lanterns: [], moths: [], kits: [], fx: [], lids: [], pennies: [] };

    scene.add(new THREE.HemisphereLight(0xf0d0b0, 0x1a0810, 0.55));
    scene.add(new THREE.AmbientLight(0x3a2418, 0.3));

    const wood = mat(WOOD, { map: woodTex(), roughness: 0.85 });
    const stripe = mat(0xffffff, { map: stripeTex(), roughness: 0.7 });
    stripe.map.wrapS = stripe.map.wrapT = THREE.RepeatWrapping;
    stripe.map.repeat.set(7, 2);
    const velvet = mat(VELVET, { roughness: 0.9 });
    const brass = mat(BRASS, { metalness: 0.72, roughness: 0.3, emissive: 0x3a2808, emissiveIntensity: 0.2 });

    const tent = new THREE.Group();
    scene.add(tent);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), wood);
    floor.rotation.x = -Math.PI / 2;
    tent.add(floor);
    addBox(tent, stripe, 12, 5.2, 0.08, 0, 2.6, -5.1);
    addBox(tent, stripe, 0.08, 5.2, 10.4, -6.0, 2.6, 0);
    addBox(tent, stripe, 0.08, 5.2, 10.4, 6.0, 2.6, 0);
    const roofL = addBox(tent, stripe, 6.6, 0.08, 10.6, -3.1, 5.35, 0);
    roofL.rotation.z = 0.28;
    const roofR = addBox(tent, stripe, 6.6, 0.08, 10.6, 3.1, 5.35, 0);
    roofR.rotation.z = -0.28;
    const sky = new THREE.Mesh(new THREE.SphereGeometry(28, 24, 16), new THREE.MeshBasicMaterial({ map: starTex(), side: THREE.BackSide }));
    tent.add(sky);

    const how = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 1.3),
      new THREE.MeshBasicMaterial({ map: howToTex(), transparent: true })
    );
    how.position.set(0, 2.55, -4.85);
    tent.add(how);
    world.howTo = how;

    const dais = addCyl(tent, mat(WOOD_DARK), 1.15, 1.25, 0.18, 0, 0.1, -0.4);
    const trunk = new THREE.Group();
    trunk.position.set(0, 0.62, -0.4);
    tent.add(trunk);
    addBox(trunk, mat(0x4a2e18, { roughness: 0.55 }), 2.05, 0.7, 1.35, 0, 0, 0);
    addBox(trunk, velvet, 1.88, 0.1, 1.18, 0, 0.22, 0);
    addBox(trunk, brass, 0.22, 0.08, 0.1, 0, 0.12, 0.7);
    const lid = new THREE.Group();
    lid.position.set(0, 0.36, -0.66);
    trunk.add(lid);
    addBox(lid, mat(0x3a2214, { roughness: 0.5 }), 2.05, 0.12, 1.35, 0, 0.02, 0.66);
    addBox(lid, velvet, 1.86, 0.03, 1.16, 0, -0.05, 0.66);
    lid.rotation.x = -1.18;
    world.lid = lid;
    world.trunk = trunk;
    world.dais = dais;

    const fairy = new THREE.Group();
    tent.add(fairy);
    for (let i = 0; i < 22; i += 1) {
      const t = i / 21;
      const bulb = addSphere(fairy, mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.9 }), 0.038, (t - 0.5) * 10.4, 4.35 + Math.sin(t * 9) * 0.14, -3.4);
      bulb.userData.phase = t * TAU;
    }
    world.fairy = fairy;

    const lanternGroup = new THREE.Group();
    tent.add(lanternGroup);
    [[-2.4, 3.35, 1.1], [2.5, 3.4, 0.6], [0.15, 3.7, -2.1], [-3.4, 2.8, -1.4], [3.5, 2.9, -1.1]].forEach((p, i) => {
      const L = new THREE.Group();
      L.position.set(p[0], p[1], p[2]);
      addCyl(L, brass, 0.04, 0.05, 0.08, 0, 0.12, 0);
      addCyl(L, mat(0xf0d09a, { transparent: true, opacity: 0.55, emissive: GOLD, emissiveIntensity: 0.4 }), 0.11, 0.13, 0.22, 0, 0, 0);
      const light = new THREE.PointLight(i % 2 ? 0xffc070 : 0xffd090, 1.15, 8, 1.6);
      L.add(light);
      lanternGroup.add(L);
      world.lanterns.push({ group: L, light });
    });

    const moths = new THREE.Group();
    tent.add(moths);
    world.mothRoot = moths;

    const kitsRoot = new THREE.Group();
    tent.add(kitsRoot);
    world.kitsRoot = kitsRoot;

    const aura = makeAura();
    aura.position.set(-2.15, 0, 0.35);
    aura.rotation.y = 0.7;
    tent.add(aura);
    world.aura = aura;

    const table = addBox(tent, wood, 1.4, 0.1, 0.7, -2.15, 0.85, 0.55);
    addCyl(tent, mat(WOOD_DARK), 0.05, 0.05, 0.8, -2.6, 0.4, 0.75);
    addCyl(tent, mat(WOOD_DARK), 0.05, 0.05, 0.8, -1.7, 0.4, 0.35);
    table.rotation.y = 0.2;

    const craft = makeCraft();
    craft.position.set(0.2, 1.55, 3.4);
    scene.add(craft);
    world.craft = craft;

    for (let i = 0; i < 16; i += 1) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.0, depthWrite: false })
      );
      p.visible = false;
      scene.add(p);
      craft.userData.trail.push({ mesh: p, life: 0 });
    }

    const diveRoot = new THREE.Group();
    diveRoot.visible = false;
    scene.add(diveRoot);
    world.diveRoot = diveRoot;

    const fxRoot = new THREE.Group();
    scene.add(fxRoot);
    for (let i = 0; i < 28; i += 1) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 6),
        new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, depthWrite: false })
      );
      s.visible = false;
      fxRoot.add(s);
      world.fx.push({ mesh: s, vel: new THREE.Vector3(), life: 0 });
    }
    world.fxRoot = fxRoot;

    const wash = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ color: 0xc41e3a, transparent: true, opacity: 0, depthTest: false })
    );
    wash.position.z = -0.4;
    wash.renderOrder = 20;
    camera.add(wash);
    scene.add(camera);
    world.wash = wash;

    world.tent = tent;
    world.camPos = camera.position.clone();
    world.camLook = new THREE.Vector3(0, 1.2, 0);
    world.punch = 0;
    resize();
    return world;
  }

  function burst(pos, color, n) {
    if (!world) return;
    let used = 0;
    world.fx.forEach((f) => {
      if (used >= (n || 8) || f.life > 0) return;
      f.life = 0.45 + Math.random() * 0.25;
      f.mesh.visible = true;
      f.mesh.position.copy(pos);
      f.mesh.material.color.setHex(color || GOLD);
      f.mesh.material.opacity = 0.9;
      f.vel.set(rand(-1.6, 1.6), rand(0.4, 2.4), rand(-1.6, 1.6));
      used += 1;
    });
  }

  function tickFx(dt) {
    world.fx.forEach((f) => {
      if (f.life <= 0) return;
      f.life -= dt;
      f.mesh.position.addScaledVector(f.vel, dt);
      f.vel.y -= 2.2 * dt;
      f.mesh.material.opacity = Math.max(0, f.life * 1.6);
      if (f.life <= 0) f.mesh.visible = false;
    });
  }

  function clearGroup(g) {
    if (!g) return;
    while (g.children.length) {
      const ch = g.children[0];
      g.remove(ch);
      ch.traverse((n) => {
        if (n.geometry && n.geometry.dispose && n.geometry !== world.geo.box && n.geometry !== world.geo.sphere && n.geometry !== world.geo.cyl) {
          try { n.geometry.dispose(); } catch (_) { /* keep */ }
        }
      });
    }
  }

  function featuredLabel(spec) {
    if (!spec || !spec.featured || !spec.featured.length) return "PICK 3 ROOMS";
    return "BONUS  " + spec.featured.map((id) => {
      const k = KITS.find((x) => x.id === id);
      return k ? k.short : id.toUpperCase();
    }).join("  /  ");
  }

  function isFeatured(def, spec) {
    return !!(spec && spec.featured && spec.featured.length && def && spec.featured.indexOf(def.id) >= 0);
  }

  function loadoutLine(slots) {
    const list = (slots || []).filter((s) => s && !s.ghost);
    if (!list.length) return "Empty suitcase";
    return list.map((k, i) => `${i + 1} ${k.short}`).join(" → ");
  }

  function currentChamber(z) {
    const list = (world && world.chambers) || [];
    for (let i = 0; i < list.length; i += 1) {
      const ch = list[i];
      if (z <= ch.z0 + 0.45 && z >= ch.z1 - 0.25) return ch;
    }
    return null;
  }

  function spawnMoths(n) {
    clearGroup(world.mothRoot);
    world.moths = [];
    const count = Math.max(4, n | 0);
    for (let i = 0; i < count; i += 1) {
      const m = makeMoth();
      m.userData.a = Math.random() * TAU;
      m.userData.r = 0.9 + Math.random() * 2.2;
      m.userData.y = 1.1 + Math.random() * 2.1;
      m.userData.s = 0.7 + Math.random() * 1.1;
      m.userData.cz = rand(-1.8, 1.6);
      world.mothRoot.add(m);
      world.moths.push(m);
    }
  }

  function spawnOffer(spec) {
    clearGroup(world.kitsRoot);
    world.kits = [];
    const n = spec.kitN || 6;
    const defs = [];
    KITS.forEach((k) => defs.push(k));
    while (defs.length < n) {
      let extra = KITS[(Math.random() * KITS.length) | 0];
      if (spec.featured && spec.featured.length && Math.random() < 0.55) {
        const id = spec.featured[(Math.random() * spec.featured.length) | 0];
        extra = KITS.find((k) => k.id === id) || extra;
      }
      defs.push(extra);
    }
    defs.length = n;
    defs.forEach((def, i) => {
      const ghost = !!(spec.ghost && i >= 6 && Math.random() < 0.62);
      const mesh = makeKitMesh(def, ghost);
      mesh.position.set(rand(-3.2, 3.2), rand(1.05, 3.15), rand(-2.6, 2.4));
      mesh.userData.bob = Math.random() * TAU;
      mesh.userData.spin = rand(0.4, 1.2);
      mesh.userData.drift = new THREE.Vector3(rand(-0.25, 0.25), rand(-0.1, 0.1), rand(-0.25, 0.25));
      mesh.userData.packed = false;
      mesh.userData.cool = 0;
      world.kitsRoot.add(mesh);
      world.kits.push(mesh);
    });
  }

  function packedCount() {
    if (!run) return 0;
    return run.slots.filter((s) => s && !s.ghost).length;
  }

  function firstEmpty() {
    if (!run) return -1;
    for (let i = 0; i < 3; i += 1) if (!run.slots[i]) return i;
    return -1;
  }

  function setLatchUi() {
    const latch = el("packLatch");
    if (!latch) return;
    const ready = !!(run && run.alive && !run.done && run.phase === "pack" && packedCount() >= (run.spec.need || 3));
    latch.hidden = !ready;
    latch.setAttribute("aria-hidden", ready ? "false" : "true");
    latch.tabIndex = ready ? 0 : -1;
  }

  function setSlotUi() {
    const nodes = document.querySelectorAll("#packSlots [data-slot]");
    const liveCh = run && run.phase === "dive" ? currentChamber(world && world.craft ? world.craft.position.z : 0) : null;
    nodes.forEach((n, i) => {
      const item = run && (run.phase === "dive" ? (run.packed || [])[i] : run.slots[i]);
      n.classList.toggle("is-filled", !!(item && !item.ghost));
      n.classList.toggle("is-ghost", !!(item && item.ghost));
      n.classList.toggle("is-active", !!(liveCh && liveCh.i === i));
      n.textContent = item ? `${item.short} · ${item.verb}` : "—";
      n.title = item ? `${item.title}: ${item.dive}` : "Empty slot — fly into a kit";
    });
    setText("packNeed", `${packedCount()} / ${run && run.spec ? run.spec.need : 3}`);
    if (run && run.phase === "dive" && liveCh) {
      setText("packCall", `ROOM ${liveCh.i + 1} · ${liveCh.def.verb}`);
      const chip = el("packCallChip");
      if (chip) chip.querySelector("span") && (chip.querySelector("span").textContent = "DIVE");
    } else {
      setText("packCall", featuredLabel(run && run.spec));
      const chip = el("packCallChip");
      if (chip) chip.querySelector("span") && (chip.querySelector("span").textContent = "LOADOUT");
    }
    setLatchUi();
  }

  function prompt(text) {
    setText("packPrompt", text);
    setText("packLiveStatus", text);
  }

  function showToast(title, sub, ms) {
    const node = el("packToast");
    if (!node) return;
    node.hidden = false;
    node.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ""}`;
    toastUntil = performance.now() + (ms || 1100);
  }

  function hideToastIfDue(now) {
    if (!toastUntil) return;
    if (now >= toastUntil) {
      toastUntil = 0;
      const node = el("packToast");
      if (node) node.hidden = true;
    }
  }

  function hudRoute() {
    if (!run) return;
    const spec = run.spec;
    const unit = spec.coda ? "ENDLESS · ROUTE" : "ROUTE";
    const hud = document.querySelector('[data-runkit-hud="pack"]');
    const line = `${unit} ${run.routeIndex} · ${spec.name}`;
    if (hud) {
      hud.hidden = false;
      hud.textContent = line;
    }
    if (rk() && run.ctx && typeof rk().reportDepth === "function") {
      try { rk().reportDepth(run.ctx, run.routeIndex, { name: spec.name, coda: !!spec.coda }); } catch (_) { /* hud */ }
    }
  }

  function resetPips() {
    document.querySelectorAll('[data-runkit-strikes="pack"] i').forEach((n) => n.classList.remove("on"));
  }

  function unpackSlot(i) {
    if (!run || run.phase !== "pack") return;
    if (!run.slots[i]) return;
    run.slots[i] = null;
    ejectFromBasket(i);
    setSlotUi();
    prompt("Unpacked. Catch another kit — order is the dive.");
    sfx("spit");
  }

  function nestIntoBasket(mesh, slotIndex) {
    const craft = world.craft;
    const slot = craft.userData.slots[slotIndex];
    world.kitsRoot.remove(mesh);
    slot.add(mesh);
    mesh.position.set(0, 0.12, 0);
    mesh.scale.setScalar(0.55);
    mesh.userData.packed = true;
    if (mesh.userData.label) mesh.userData.label.visible = false;
  }

  function ejectFromBasket(slotIndex) {
    const craft = world.craft;
    const slot = craft.userData.slots[slotIndex];
    const mesh = slot.children.find((c) => c.userData && c.userData.def);
    if (!mesh) return;
    slot.remove(mesh);
    mesh.scale.setScalar(1);
    mesh.userData.packed = false;
    mesh.userData.cool = 0.8;
    if (mesh.userData.label) mesh.userData.label.visible = true;
    world.kitsRoot.add(mesh);
    craft.getWorldPosition(_v);
    mesh.position.copy(_v);
    mesh.position.y += 0.5;
    mesh.position.x += rand(-0.6, 0.6);
    mesh.position.z += rand(-0.4, 0.4);
  }

  function catchKit(mesh) {
    if (!run || run.phase !== "pack" || mesh.userData.packed || mesh.userData.cool > 0) return;
    const def = mesh.userData.def;
    if (mesh.userData.ghost) {
      prompt(AURA.ghost);
      showToast("FOG", "Ghost kits don’t pack", 900);
      sfx("spit");
      mesh.userData.cool = 0.7;
      burst(mesh.position, 0x8a6a90, 6);
      mesh.position.add(new THREE.Vector3(rand(-0.8, 0.8), 0.3, rand(-0.8, 0.8)));
      return;
    }
    const empty = firstEmpty();
    if (empty < 0) {
      prompt("Trunk’s full. Tap a slot to swap, then LATCH.");
      return;
    }
    run.slots[empty] = def;
    nestIntoBasket(mesh, empty);
    run.score += 90 + (isFeatured(def, run.spec) ? 70 : 0);
    if (run.ctx) run.ctx.score = run.score;
    burst(world.craft.position, def.color, 10);
    sfx("tray");
    setSlotUi();
    const left = (run.spec.need || 3) - packedCount();
    if (left <= 0) {
      prompt(`${AURA.packed} ${loadoutLine(run.slots)}`);
      showToast("LOADOUT SET", `${loadoutLine(run.slots)} · LATCH or Enter`, 1600);
    } else {
      prompt(`${def.title} → room ${empty + 1} (${def.dive}). ${left} to go.`);
    }
  }

  function stackOf(packed, i) {
    const id = packed[i].id;
    let n = 0;
    for (let k = 0; k <= i; k += 1) if (packed[k].id === id) n += 1;
    return n;
  }

  function addArch(root, def, z, half) {
    const brass = mat(BRASS, { metalness: 0.7, roughness: 0.3, emissive: 0x3a2808, emissiveIntensity: 0.3 });
    addBox(root, brass, half * 2.05, 0.08, 0.1, 0, 2.22, z);
    addBox(root, brass, 0.08, 2.2, 0.1, -half + 0.05, 1.15, z);
    addBox(root, brass, 0.08, 2.2, 0.1, half - 0.05, 1.15, z);
    const spr = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.32),
      new THREE.MeshBasicMaterial({ map: labelTex((def.short + " · " + def.verb), "#e8b84a"), transparent: true })
    );
    spr.position.set(0, 1.95, z + 0.08);
    root.add(spr);
  }

  function buildChamber(root, def, i, z0, z1, stack, half, spec) {
    const mid = (z0 + z1) * 0.5;
    const len = z0 - z1;
    addBox(root, mat(def.color, { emissive: def.color, emissiveIntensity: 0.35, roughness: 0.55 }), 0.07, 0.1, len, -half + 0.06, 2.18, mid);
    addBox(root, mat(def.color, { emissive: def.color, emissiveIntensity: 0.35, roughness: 0.55 }), 0.07, 0.1, len, half - 0.06, 2.18, mid);
    addArch(root, def, z0 - 0.15, half);
    const ch = {
      def, i, z0, z1, stack, mid, announced: false, failed: false,
      need: 0, got: 0, pathAmp: 0.7, pathFreq: 0.42,
    };

    if (def.id === "press") {
      const n = 2 + stack;
      for (let j = 0; j < n; j += 1) {
        const z = z0 - 2.2 - j * ((len - 4) / Math.max(1, n));
        const doorL = addBox(root, mat(0x3a2214, { roughness: 0.5, emissive: 0x5a3010, emissiveIntensity: 0.15 }), half * 0.95, 1.65, 0.1, -half * 0.55, 1.15, z);
        const doorR = addBox(root, mat(0x3a2214, { roughness: 0.5, emissive: 0x5a3010, emissiveIntensity: 0.15 }), half * 0.95, 1.65, 0.1, half * 0.55, 1.15, z);
        world.lids.push({ z, l: doorL, r: doorR, phase: j * 1.2, rate: 1.05 + stack * 0.28, half });
      }
    } else if (def.id === "lantern") {
      ch.need = 1 + stack;
      for (let j = 0; j < ch.need; j += 1) {
        const z = z0 - 2.4 - j * ((len - 4.2) / Math.max(1, ch.need));
        const hoop = new THREE.Mesh(
          new THREE.TorusGeometry(0.4, 0.045, 8, 20),
          mat(GOLD, { emissive: GOLD, emissiveIntensity: 1.1, metalness: 0.4 })
        );
        hoop.position.set(Math.sin(j * 1.7) * 0.28 * (stack > 1 ? 1 : 0.4), 1.12, z);
        root.add(hoop);
        const flame = addSphere(root, mat(HEART, { emissive: HEART, emissiveIntensity: 1.2 }), 0.07, hoop.position.x, hoop.position.y, z);
        world.hoops.push({ mesh: hoop, flame, ch, got: false, r: 0.42 });
      }
    } else if (def.id === "ticket") {
      ch.need = 2 + (stack > 1 ? 1 : 0);
      const n = 5 + stack * 2;
      for (let j = 0; j < n; j += 1) {
        const good = j % 2 === 0;
        const z = z0 - 1.6 - j * ((len - 3) / n);
        const col = good ? 0xf0d09a : 0xa03040;
        const mesh = addBox(root, mat(col, { emissive: col, emissiveIntensity: good ? 0.55 : 0.25 }), 0.32, 0.18, 0.03, rand(-half * 0.55, half * 0.55), 0.85 + Math.sin(j) * 0.35, z);
        world.tickets.push({ mesh, good, ch, got: false, bob: j });
      }
    } else if (def.id === "still") {
      const fog = addBox(root, mat(0x8a4a9a, { transparent: true, opacity: 0.28, emissive: 0x8a4a9a, emissiveIntensity: 0.4 }), half * 1.95, 2.05, len * 0.82, 0, 1.15, mid);
      world.stillZones.push({ z: mid, mesh: fog, depth: len * 0.82, ch });
    } else if (def.id === "coin") {
      ch.need = 2 + (stack > 1 ? 1 : 0);
      const n = ch.need + 2;
      for (let j = 0; j < n; j += 1) {
        const mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, 0.03, 16),
          mat(GOLD, { metalness: 0.8, emissive: GOLD, emissiveIntensity: 0.45 })
        );
        mesh.rotation.x = Math.PI / 2;
        mesh.position.set(Math.sin(j * 1.4) * half * 0.4, 1.1, z0 - 2.2 - j * ((len - 4) / n));
        root.add(mesh);
        world.coins.push({ mesh, ch, got: false, bob: j * 0.9, baseY: 1.1 });
      }
    } else if (def.id === "map") {
      ch.pathAmp = 0.72 - Math.min(0.22, (stack - 1) * 0.1);
      ch.pathFreq = 0.4 + stack * 0.08;
      for (let z = z0 - 0.6; z > z1 + 0.4; z -= 1.15) {
        const x = Math.sin((z0 - z) * ch.pathFreq) * ch.pathAmp;
        const star = addSphere(root, mat(GOLD, { emissive: GOLD, emissiveIntensity: 1 }), 0.05, x, 1.15, z);
        world.stars.push({ mesh: star, ch });
      }
    }

    if (def.id !== "still" && def.id !== "map" && spec.chase > 0.35) {
      const m = makeMoth();
      m.position.set(rand(-0.4, 0.4), 1.3, mid);
      m.userData.a = Math.random() * TAU;
      m.userData.s = 1.3 + Math.random();
      root.add(m);
      world.diveMoths.push(m);
    }
    return ch;
  }

  function buildDive(spec) {
    clearGroup(world.diveRoot);
    world.lids = [];
    world.pennies = [];
    world.hoops = [];
    world.tickets = [];
    world.coins = [];
    world.stars = [];
    world.diveMoths = [];
    world.stillZones = [];
    world.chambers = [];
    const root = world.diveRoot;
    const packed = (run.packed || []).filter((s) => s && !s.ghost).slice(0, 3);
    const velvet = mat(VELVET, { roughness: 0.92 });
    const wood = mat(WOOD_DARK, { roughness: 0.8 });
    const brass = mat(BRASS, { metalness: 0.7, roughness: 0.3, emissive: 0x3a2808, emissiveIntensity: 0.25 });
    const half = 1.52 - Math.min(0.28, ((spec.speed || 1) - 0.7) * 0.22);
    const CHAMBER = 14.5;
    const GAP = 2.2;
    let zCursor = 3.2;
    const startZ = zCursor + 4;
    packed.forEach((def, i) => {
      const z0 = zCursor;
      const z1 = zCursor - CHAMBER;
      const stack = stackOf(packed, i);
      world.chambers.push(buildChamber(root, def, i, z0, z1, stack, half, spec));
      zCursor = z1 - GAP;
    });
    const endZ = zCursor - 1.4;
    const len = startZ - endZ + 2;
    const midAll = (startZ + endZ) * 0.5;
    addBox(root, velvet, half * 2.2, 0.08, len, 0, 0.02, midAll);
    addBox(root, velvet, half * 2.2, 0.08, len, 0, 2.36, midAll);
    addBox(root, velvet, 0.08, 2.4, len, -half, 1.15, midAll);
    addBox(root, velvet, 0.08, 2.4, len, half, 1.15, midAll);
    for (let z = startZ; z > endZ; z -= 4.2) {
      addBox(root, wood, half * 2.15, 0.08, 0.16, 0, 0.08, z);
    }

    const stamp = new THREE.Group();
    stamp.position.set(0, 1.1, endZ);
    addBox(stamp, brass, 0.9, 1.4, 0.12, 0, 0, 0);
    const spr = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.32),
      new THREE.MeshBasicMaterial({ map: labelTex("MORNING STAMP", "#e8b84a"), transparent: true })
    );
    spr.position.set(0, 0.95, 0.1);
    stamp.add(spr);
    const endAura = makeAura();
    endAura.position.set(0.85, -1.05, 0.2);
    endAura.rotation.y = -0.5;
    endAura.scale.setScalar(0.95);
    stamp.add(endAura);
    world.diveAura = endAura;
    root.add(stamp);
    world.stamp = stamp;
    world.diveLen = -endZ + 2;
    world.diveEndZ = endZ;
    world.diveHalf = half;
    world.diveDark = false;
  }

  function beginPack() {
    const spec = run.spec;
    run.phase = "pack";
    run.packLeft = spec.packMs;
    run.packMax = spec.packMs;
    run.slots = [null, null, null];
    run.lidPulse = 0;
    run.iFrames = 0.45;
    spawnOffer(spec);
    spawnMoths(spec.moths || 6);
    world.tent.visible = true;
    world.diveRoot.visible = false;
    if (world.howTo) world.howTo.visible = spec.kind === "teach";
    world.craft.position.set(0.15, 1.6, 3.55);
    world.craft.rotation.set(0, 0, 0);
    world.craft.userData.slots.forEach((s) => {
      while (s.children.length) s.remove(s.children[0]);
    });
    if (world.lid) world.lid.rotation.x = -1.18;
    prompt(spec.barker);
    showToast(spec.name.toUpperCase(), spec.barker, spec.kind === "teach" ? 1800 : 1100);
    setSlotUi();
    hudRoute();
    sfx("drop");
  }

  function beginDive() {
    if (!run || run.phase !== "pack") return;
    if (packedCount() < (run.spec.need || 3)) {
      prompt("Three honest kits. The latch won’t lie for you.");
      return;
    }
    run.packed = run.slots.filter((s) => s && !s.ghost).slice(0, 3);
    run.phase = "latch";
    run.latchT = 0;
    prompt(`${AURA.latch} ${loadoutLine(run.packed)}`);
    showToast("DIVING LOADOUT", loadoutLine(run.packed), 1400);
    sfx("stamp");
    setLatchUi();
    const st = PF.getState && PF.getState();
    if (st) {
      st.lastPack = run.packed.map((k) => k.title);
      st.kitsTonight = run.packed.map((k) => k.id);
      if (PF.saveState) PF.saveState();
    }
  }

  function enterDive() {
    buildDive(run.spec);
    world.tent.visible = false;
    world.diveRoot.visible = true;
    world.craft.position.set(0, 1.12, 6.2);
    world.craft.rotation.set(0, 0, 0);
    run.phase = "dive";
    run.diveT = 0;
    run.lastChamber = null;
    const bits = loadoutLine(run.packed);
    prompt(`DIVE your loadout: ${bits}. Each kit is the next room.`);
    showToast("ROOM 1", (run.packed[0] && run.packed[0].dive) || "Steer", 1400);
    sfx("chapter");
    if (world.scene.fog) world.scene.fog.density = 0.04;
    setSlotUi();
  }

  function strike(reason) {
    if (!run || !run.alive || run.dying || run.iFrames > 0) return;
    run.iFrames = 0.7;
    run.strikes = (run.strikes | 0) + 1;
    if (run.ctx && rk() && typeof rk().reportStrike === "function") rk().reportStrike(run.ctx, reason);
    const pips = document.querySelectorAll('[data-runkit-strikes="pack"] i');
    pips.forEach((n, i) => n.classList.toggle("on", i < run.strikes));
    sfx("miss");
    world.punch = 0.55;
    if (world.wash) world.wash.material.opacity = 0.35;
    if (run.strikes >= (run.spec.strikes || 3)) finish(reason || "room_fail");
  }

  function clearRoute() {
    run.depth += 1;
    if (run.ctx) run.ctx.depth = run.depth;
    run.score += 420;
    if (run.ctx) run.ctx.score = run.score;
    hudRoute();
    prompt(run.depth >= 6 ? AURA.deep(run.depth) : AURA.route);
    showToast("ROUTE STAMPED", run.spec.name, 1200);
    sfx("chapter");
    if (run.routeIndex >= AUTHORED_COUNT && !codaOn()) {
      finish("souvenir");
      return;
    }
    run.phase = "celebrate";
    run.celeT = 0;
    if (PF.setAura) PF.setAura("celebrate");
    world.tent.visible = true;
    world.diveRoot.visible = false;
    if (world.scene.fog) world.scene.fog.density = 0.048;
  }

  function nextRoute() {
    run.routeIndex += 1;
    run.spec = routeSpec(run.routeIndex);
    run.strikes = 0;
    resetPips();
    beginPack();
  }

  function isLive() {
    return !!(run && run.alive && !run.done);
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (run.dying && reason !== "leave") return;
    if (reason !== "leave" && reason !== "souvenir" && !run.dying) {
      run.dying = true;
      run.death = reason || "room_fail";
      run.deathHold = DEATH_HOLD;
      sfx("drain");
      prompt(AURA[reason] || AURA.room_fail);
      showToast("CLOSED", AURA[reason] || AURA.room_fail, 1400);
      return;
    }
    seal(reason);
  }

  function seal(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.alive = false;
    run.dying = false;
    const depth = run.depth | 0;
    const score = run.score | 0;
    const death = reason === "leave" ? "leave" : reason === "souvenir" ? "souvenir" : (run.death || reason || "room_fail");
    const stSave = PF.getState ? PF.getState() : null;
    if (stSave) {
      stSave.bestPack = Math.max(stSave.bestPack || 0, depth);
      stSave.bestPackScore = Math.max(stSave.bestPackScore || 0, score);
    }
    if (run.ctx && rk() && typeof rk().finishRun === "function") {
      try {
        rk().finishRun(run.ctx, {
          gameId: GAME_ID, depth, score, deathReason: death,
          cashedOut: reason === "souvenir",
          meta: { route: run.routeIndex, packed: (run.packed || []).map((k) => k.id), coda: !!(run.spec && run.spec.coda) },
        }, { navigate: false });
      } catch (_) {
        if (kit.persistRun) kit.persistRun(PF.getState(), GAME_ID, { depth, score, deathReason: death, cashedOut: reason === "souvenir" });
      }
    } else if (kit.persistRun) {
      kit.persistRun(PF.getState(), GAME_ID, { depth, score, deathReason: death, cashedOut: reason === "souvenir" });
    }
    const startBtn = el("packStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "PACK AGAIN · 1 demo coin";
    }
    if (kit.setMode) kit.setMode(card(), "result");
    if (PF.focusCard) PF.focusCard("packCard", false);
    const aura = death === "souvenir" ? AURA.souvenir
      : death === "leave" ? AURA.leave
        : depth >= 4 ? AURA.deep(depth)
          : (AURA[death] || AURA.room_fail);
    const challenge = (rk() && rk().challengeText)
      ? rk().challengeText("Night Kit route", depth, GAME_ID)
      : `Beat my Night Kit route ${depth} on Penny Fever`;
    if (kit.fillResult) {
      kit.fillResult({
        root: "packResult", depth: "packResultDepth", score: "packResultScore",
        aura: "packResultAura", copied: "packCopied",
      }, {
        depthLine: `ROUTE ${depth}`,
        scoreLine: `SCORE ${score} · ${String(death).replace(/_/g, " ").toUpperCase()}`,
        auraLine: aura,
      });
    }
    setText("packResultReason", String(death).replace(/_/g, " ").toUpperCase());
    setText("packChallengeText", challenge);
    const verdict = el("packVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = death === "souvenir" ? `Souvenir. ROUTE ${depth}.` : `${aura} · ROUTE ${depth}`;
    }
    if (PF.setTier) PF.setTier("packTier", depth > 0 || death === "souvenir" ? `ROUTE ${depth}` : "UNPACKED", depth > 0 || death === "souvenir" ? "perfect" : "miss");
    prompt(death === "leave" ? "Left the packing table." : death === "souvenir" ? "The night bowed." : "Trunk stamped CLOSED.");
    if (depth > 0 || death === "souvenir") {
      if (PF.award) PF.award(Math.max(8, Math.floor(score / 14)), true, "Night Kit");
      if (PF.setAura) PF.setAura(depth >= 3 || death === "souvenir" ? "celebrate" : "point");
      if (death !== "leave" && PF.showBanner) PF.showBanner(true, death === "souvenir" ? "SOUVENIR" : `ROUTE ${depth}`, aura);
    } else {
      if (PF.award) PF.award(0, false, "Night Kit miss");
      if (PF.setAura) PF.setAura("badLuck");
      if (death !== "leave" && PF.showBanner) PF.showBanner(false, "UNPACKED", aura);
    }
    if (PF.refreshNightBoard) PF.refreshNightBoard();
    stampDepth();
    const hud = document.querySelector('[data-runkit-hud="pack"]');
    if (hud) hud.textContent = "";
    world.tent.visible = true;
    world.diveRoot.visible = false;
    if (world.howTo) world.howTo.visible = true;
    if (world.scene.fog) world.scene.fog.density = 0.048;
    if (world.lid) world.lid.rotation.x = -0.25;
  }

  function stampDepth() {
    const st = PF.getState ? PF.getState() : {};
    const live = isLive();
    setText("depthPackNow", live ? String(run.depth | 0) : "0");
    setText("depthPackScore", live ? String(run.score | 0) : "0");
    const best = Math.max(st.bestPack || 0, (st.bestDepth && st.bestDepth.pack) || 0);
    const bestS = st.bestPackScore || 0;
    setText("depthPackBest", best ? String(best) : "—");
    setText("depthPackBestScore", bestS ? String(bestS) : "—");
  }

  function start() {
    if (isLive()) return;
    if (!world) buildWorld();
    if (!world) {
      prompt("The lanterns need WebGL to light this tent.");
      return;
    }
    const ctx = rk() && typeof rk().startRun === "function"
      ? rk().startRun({ gameId: GAME_ID })
      : { gameId: GAME_ID, depth: 0, score: 0, strikes: 0, alive: true };
    if (!ctx) {
      prompt("Out of demo coins · grant a pass");
      setText("packLiveStatus", "Out of demo coins · grant a pass");
      return;
    }
    run = {
      ctx, alive: true, done: false, dying: false,
      phase: "pack", routeIndex: 1,
      depth: 0, score: 0, strikes: 0,
      spec: routeSpec(1), packed: [], slots: [null, null, null],
      iFrames: 0,
    };
    if (kit.hideResult) kit.hideResult("packResult");
    const verdict = el("packVerdict");
    if (verdict) verdict.hidden = true;
    if (kit.setMode) kit.setMode(card(), "play");
    if (PF.focusCard) PF.focusCard("packCard", true);
    const hudEl = el("packHud");
    if (hudEl) hudEl.hidden = false;
    const timer = el("packTimer");
    if (timer) timer.hidden = false;
    const startBtn = el("packStart");
    if (startBtn) startBtn.disabled = true;
    resetPips();
    beginPack();
    stampDepth();
    if (PF.setAura) PF.setAura("point");
  }

  function readSteer() {
    let x = pointerNdc.x;
    let y = pointerNdc.y;
    if (keys.KeyA || keys.ArrowLeft) x -= 1;
    if (keys.KeyD || keys.ArrowRight) x += 1;
    if (keys.KeyW || keys.ArrowUp) y += 1;
    if (keys.KeyS || keys.ArrowDown) y -= 1;
    input.nx = clamp(x, -1.2, 1.2);
    input.ny = clamp(y, -1.2, 1.2);
    input.boost = !!(input.held || keys.Space);
  }

  function tickCraftPack(dt, spec) {
    const c = world.craft;
    const speed = (spec.speed || 1) * (input.boost ? 5.4 : 1.55);
    const wind = spec.wind || 0;
    c.position.x += (input.nx * 3.35 - c.position.x) * Math.min(1, dt * 3.2);
    c.position.y += ((1.15 + (input.ny + 1) * 1.15) - c.position.y) * Math.min(1, dt * 3.2);
    c.position.z -= speed * dt;
    if (!input.boost) c.position.z += 1.15 * dt;
    c.position.x += Math.sin(world.clock * 1.3) * wind * dt * 1.8;
    c.position.x = clamp(c.position.x, -3.55, 3.55);
    c.position.y = clamp(c.position.y, 0.62, 3.55);
    c.position.z = clamp(c.position.z, -3.35, 4.15);
    c.rotation.z = lerp(c.rotation.z, -input.nx * 0.35, dt * 6);
    c.rotation.x = lerp(c.rotation.x, input.ny * 0.18, dt * 6);
    const u = c.userData;
    u.light.intensity = input.boost ? 2.3 : 1.45;
    u.flame.scale.setScalar(input.boost ? 1.25 : 1 + Math.sin(world.clock * 8) * 0.08);
    u.glow.material.opacity = input.boost ? 0.28 : 0.14;
  }

  function tickCraftDive(dt, spec) {
    const c = world.craft;
    const half = world.diveHalf || 1.45;
    const ch = currentChamber(c.position.z);
    let auto = 4.4 * (spec.speed || 1);
    if (ch && ch.def.id === "still") auto *= 0.58;
    if (ch && ch.def.id === "map") auto *= 0.82;
    if (ch && ch.def.id === "coin") auto *= 0.88;
    const extra = input.boost && !(ch && ch.def.id === "still") ? 3.2 : 0;
    c.position.x += (input.nx * (half - 0.38) - c.position.x) * Math.min(1, dt * 5);
    c.position.y += ((0.7 + (input.ny + 1) * 0.65) - c.position.y) * Math.min(1, dt * 5);
    c.position.z -= (auto + extra) * dt;
    c.rotation.z = lerp(c.rotation.z, -input.nx * 0.4, dt * 7);
    c.rotation.x = lerp(c.rotation.x, -0.12 + input.ny * 0.1, dt * 6);
    const out = c.position.y < 0.45 || c.position.y > 2.05 || Math.abs(c.position.x) > half - 0.22;
    if (out) {
      c.position.x = clamp(c.position.x, -half + 0.32, half - 0.32);
      c.position.y = clamp(c.position.y, 0.55, 1.95);
      strike("wall");
      burst(c.position, HEART, 8);
    }
  }

  function tickTrail(dt) {
    const c = world.craft;
    const trail = c.userData.trail;
    const boost = input.boost && isLive();
    trail.forEach((t, i) => {
      if (boost && Math.random() < 0.35 && t.life <= 0) {
        t.life = 0.35;
        t.mesh.visible = true;
        t.mesh.position.copy(c.position);
        t.mesh.position.y -= 0.05;
        t.mesh.position.z += 0.1 + i * 0.01;
      }
      if (t.life > 0) {
        t.life -= dt;
        t.mesh.material.opacity = t.life * 1.4;
        t.mesh.position.z += dt * 0.4;
        if (t.life <= 0) t.mesh.visible = false;
      }
    });
  }

  function tickKits(dt, spec) {
    const c = world.craft;
    const wind = spec.wind || 0;
    world.kits.forEach((mesh) => {
      if (mesh.userData.packed) {
        mesh.rotation.y += dt * 1.4;
        return;
      }
      mesh.userData.cool = Math.max(0, mesh.userData.cool - dt);
      mesh.userData.bob += dt * 2;
      mesh.position.x += mesh.userData.drift.x * dt + Math.sin(mesh.userData.bob) * wind * dt;
      mesh.position.y += Math.sin(mesh.userData.bob * 1.3) * dt * 0.15;
      mesh.position.z += mesh.userData.drift.z * dt;
      if (mesh.position.x < -3.6 || mesh.position.x > 3.6) mesh.userData.drift.x *= -1;
      if (mesh.position.z < -3.1 || mesh.position.z > 2.8) mesh.userData.drift.z *= -1;
      mesh.position.y = clamp(mesh.position.y, 0.85, 3.4);
      mesh.rotation.y += dt * mesh.userData.spin;
      if (mesh.userData.label) mesh.userData.label.lookAt(world.camera.position);
      const featured = isFeatured(mesh.userData.def, spec) && !mesh.userData.ghost;
      if (mesh.children[0] && mesh.children[0].material && mesh.children[0].material.emissive) {
        mesh.children[0].material.emissiveIntensity = mesh.userData.ghost
          ? 0.12
          : (featured ? 0.7 + Math.sin(world.clock * 6) * 0.25 : 0.42 + Math.sin(world.clock * 5) * 0.12);
      }
      if (run && run.phase === "pack" && mesh.userData.cool <= 0) {
        if (mesh.position.distanceTo(c.position) < 0.64) catchKit(mesh);
      }
    });
  }

  function tickMothsPack(dt, spec) {
    const c = world.craft;
    const chase = spec.chase || 0;
    world.moths.forEach((m) => {
      const u = m.userData;
      u.a += dt * u.s;
      let x = Math.cos(u.a) * u.r;
      let z = Math.sin(u.a * 0.8) * u.r * 0.65 + u.cz;
      let y = u.y + Math.sin(u.a * 2) * 0.12;
      if (chase && run && run.phase === "pack") {
        x = lerp(x, c.position.x, chase * dt * 1.6);
        y = lerp(y, c.position.y, chase * dt * 1.4);
        z = lerp(z, c.position.z, chase * dt * 1.4);
      }
      m.position.set(x, y, z);
      if (u.wings) {
        u.wings[0].rotation.z = Math.sin(world.clock * 22 + u.a) * 0.55;
        u.wings[1].rotation.z = -Math.sin(world.clock * 22 + u.a) * 0.55;
      }
      if (run && run.phase === "pack" && m.position.distanceTo(c.position) < 0.38) {
        u.a += 1.2;
        m.position.y += 0.4;
        burst(m.position, 0xe8dcc8, 5);
        sfx("spit");
        let idx = -1;
        for (let i = run.slots.length - 1; i >= 0; i -= 1) {
          if (run.slots[i]) { idx = i; break; }
        }
        if (idx >= 0) {
          run.slots[idx] = null;
          ejectFromBasket(idx);
          setSlotUi();
          prompt("A moth unpacked you.");
          showToast("STOLEN", "Moth took a kit", 800);
        } else {
          strike("moth");
          prompt(AURA.moth);
        }
      }
    });
  }

  function tickPack(dt) {
    const spec = run.spec;
    run.packLeft -= dt * 1000;
    const fill = el("packTimerFill");
    const bar = fill && fill.parentElement;
    const p = Math.max(0, run.packLeft / run.packMax);
    if (fill) fill.style.transform = `scaleX(${p})`;
    if (bar) bar.classList.toggle("is-low", p < 0.28);
    tickCraftPack(dt, spec);
    tickKits(dt, spec);
    tickMothsPack(dt, spec);
    if (world.lid) {
      if (spec.lid) {
        run.lidPulse += dt * 1000;
        const every = spec.lidEvery || 3000;
        const cycle = run.lidPulse % every;
        const closing = cycle > every - 780;
        const k = closing ? (cycle - (every - 780)) / 780 : 0;
        world.lid.rotation.x = lerp(-1.18, -0.08, k);
        const inMouth = world.craft.position.distanceTo(world.trunk.position) < 1.15 && world.craft.position.y < 1.55;
        if (closing && k > 0.72 && inMouth && !run.lidHit) {
          run.lidHit = true;
          strike("lid");
          prompt(AURA.lid);
          showToast("LID", "Stay out of the trunk mouth", 800);
        }
        if (cycle < 80) run.lidHit = false;
      } else {
        world.lid.rotation.x = -1.18;
      }
    }
    if (run.packLeft <= 0) {
      if (packedCount() >= (spec.need || 3)) beginDive();
      else finish("unpacked");
    }
  }

  function leaveChamber(ch) {
    if (!ch || ch.failed) return;
    if ((ch.def.id === "lantern" || ch.def.id === "coin" || ch.def.id === "ticket") && ch.got < ch.need) {
      ch.failed = true;
      strike("room_fail");
      prompt(`${ch.def.title} room unfinished (${ch.got}/${ch.need}).`);
      showToast("MISSED ROOM", `${ch.def.short} needed ${ch.need}`, 900);
    }
  }

  function tickLatch(dt) {
    run.latchT += dt;
    if (world.lid) world.lid.rotation.x = lerp(-1.18, -0.12, Math.min(1, run.latchT / 0.55));
    world.craft.position.lerp(world.trunk.position.clone().add(new THREE.Vector3(0, 0.55, 0.1)), dt * 2.4);
    if (run.latchT > 0.85) enterDive();
  }

  function tickDive(dt) {
    const spec = run.spec;
    run.diveT += dt;
    tickCraftDive(dt, spec);
    const c = world.craft;
    const ch = currentChamber(c.position.z);
    if (ch !== run.lastChamber) {
      if (run.lastChamber) leaveChamber(run.lastChamber);
      run.lastChamber = ch;
      if (ch && !ch.announced) {
        ch.announced = true;
        prompt(`ROOM ${ch.i + 1} · ${ch.def.title.toUpperCase()} — ${ch.def.dive}`);
        showToast(`ROOM ${ch.i + 1} · ${ch.def.short}`, ch.def.dive, 1300);
        setSlotUi();
      }
    }
    const dark = !!(ch && ch.def.id === "lantern");
    if (world.scene.fog) world.scene.fog.density = dark ? 0.11 : 0.038;
    world.craft.userData.light.intensity = dark ? (input.boost ? 2.8 : 1.9) : (input.boost ? 2.2 : 1.4);
    world.diveDark = dark;

    const fill = el("packTimerFill");
    const endZ = world.diveEndZ != null ? world.diveEndZ : -world.diveLen;
    const span = 6.2 - endZ;
    if (fill) fill.style.transform = `scaleX(${clamp((c.position.z - endZ) / span, 0, 1)})`;

    (world.lids || []).forEach((L) => {
      const wave = (Math.sin(run.diveT * L.rate + L.phase) + 1) * 0.5;
      const closed = wave > 0.52 ? (wave - 0.52) / 0.48 : 0;
      const openGap = L.half * 0.9;
      const shutGap = 0.42;
      const gap = shutGap + (1 - closed) * (openGap - shutGap);
      const doorW = L.half * 0.9;
      L.l.position.x = -gap - doorW * 0.5;
      L.r.position.x = gap + doorW * 0.5;
      if (closed > 0.58 && Math.abs(c.position.z - L.z) < 0.26 && Math.abs(c.position.x) >= gap * 0.86) {
        if (!L.hit) {
          L.hit = true;
          strike("lid");
          burst(c.position, 0x3a2214, 7);
        }
      } else if (Math.abs(c.position.z - L.z) > 0.55) {
        L.hit = false;
      }
    });

    (world.hoops || []).forEach((h) => {
      if (h.got || !h.mesh) return;
      h.mesh.rotation.z += dt * 1.4;
      if (h.flame) h.flame.scale.setScalar(1 + Math.sin(world.clock * 8) * 0.12);
      const dx = h.mesh.position.x - c.position.x;
      const dy = h.mesh.position.y - c.position.y;
      const dz = h.mesh.position.z - c.position.z;
      if (Math.abs(dz) < 0.28 && Math.hypot(dx, dy) < h.r) {
        h.got = true;
        h.ch.got += 1;
        h.mesh.material.emissiveIntensity = 0.2;
        run.score += 55;
        if (run.ctx) run.ctx.score = run.score;
        burst(h.mesh.position, GOLD, 8);
        sfx("sink");
        prompt(`Hoop ${h.ch.got}/${h.ch.need}`);
      }
    });

    (world.tickets || []).forEach((t) => {
      if (t.got || !t.mesh) return;
      t.mesh.rotation.z += dt * 1.6;
      t.mesh.position.y = 0.9 + Math.sin(world.clock * 3 + t.bob) * 0.28;
      if (t.mesh.position.distanceTo(c.position) < 0.4) {
        t.got = true;
        t.mesh.visible = false;
        if (t.good) {
          t.ch.got += 1;
          run.score += 40;
          if (run.ctx) run.ctx.score = run.score;
          burst(t.mesh.position, 0xf0d09a, 6);
          sfx("tray");
          prompt(`Gold ticket ${t.ch.got}/${t.ch.need}`);
        } else {
          strike("wrong");
          prompt("Red ticket. Gold only.");
          burst(t.mesh.position, HEART, 6);
        }
      }
    });

    (world.coins || []).forEach((p) => {
      if (p.got || !p.mesh) return;
      p.mesh.rotation.y += dt * 4;
      const wave = Math.sin(world.clock * 3.2 + p.bob);
      p.mesh.position.y = p.baseY + Math.abs(wave) * 0.85;
      const peak = Math.abs(wave) > 0.72;
      p.mesh.material.emissiveIntensity = peak ? 0.95 : 0.3;
      if (p.mesh.position.distanceTo(c.position) < 0.4) {
        p.got = true;
        p.mesh.visible = false;
        p.ch.got += 1;
        run.score += peak ? 60 : 28;
        if (run.ctx) run.ctx.score = run.score;
        burst(p.mesh.position, GOLD, 7);
        sfx("sink");
        prompt(peak ? `Peak coin ${p.ch.got}/${p.ch.need}` : `Coin ${p.ch.got}/${p.ch.need} — catch the peak`);
      }
    });

    (world.stars || []).forEach((s) => {
      if (!s.mesh) return;
      s.mesh.material.emissiveIntensity = 0.7 + Math.sin(world.clock * 6 + s.mesh.position.z) * 0.3;
    });

    if (ch && ch.def.id === "map") {
      const pathX = Math.sin((ch.z0 - c.position.z) * ch.pathFreq) * ch.pathAmp;
      if (Math.abs(c.position.x - pathX) > 0.58) {
        strike("wall");
        prompt("Stay on the stars.");
        c.position.x = lerp(c.position.x, pathX, 0.45);
      }
    }

    (world.diveMoths || []).forEach((m) => {
      m.userData.a += dt * m.userData.s;
      m.position.x += Math.sin(m.userData.a) * dt * 0.7;
      m.position.y += Math.cos(m.userData.a * 1.3) * dt * 0.25;
      if (m.userData.wings) {
        m.userData.wings[0].rotation.z = Math.sin(world.clock * 22) * 0.5;
        m.userData.wings[1].rotation.z = -Math.sin(world.clock * 22) * 0.5;
      }
      if (m.position.distanceTo(c.position) < 0.36) {
        m.position.z -= 1.4;
        strike("moth");
        burst(m.position, 0xe8dcc8, 5);
      }
    });

    (world.stillZones || []).forEach((z) => {
      if (Math.abs(c.position.z - z.z) < z.depth * 0.5) {
        z.mesh.material.opacity = 0.22 + Math.sin(world.clock * 6) * 0.08;
        if (input.boost) {
          if (!z.hit) {
            z.hit = true;
            strike("still");
            prompt(AURA.still);
            showToast("STILL", "Let go through the purple", 900);
          }
        } else {
          z.hit = false;
        }
      }
    });

    if (world.diveAura) animateAura(dt, "point");

    if (c.position.z <= (world.diveEndZ != null ? world.diveEndZ + 0.6 : -world.diveLen + 2.1)) {
      if (run.lastChamber) leaveChamber(run.lastChamber);
      run.score += 220;
      prompt(AURA.clear);
      clearRoute();
    }
    if (run.diveT > 48) finish("room_fail");
  }

  function tickCelebrate(dt) {
    run.celeT += dt;
    if (world.lid) world.lid.rotation.x = -1.05 + Math.sin(run.celeT * 8) * 0.08;
    world.craft.position.set(0.2, 1.7, 2.8);
    if (run.celeT > 1.35) nextRoute();
  }

  function tickCam(dt) {
    const c = world.craft;
    const want = _v;
    const look = _v2;
    const phase = run && !run.done ? run.phase : "idle";
    if (phase === "dive") {
      want.set(c.position.x * 0.35, c.position.y + 0.72, c.position.z + 2.55);
      look.set(c.position.x * 0.2, c.position.y + 0.05, c.position.z - 3.2);
    } else if (phase === "latch") {
      want.set(c.position.x * 0.35, c.position.y + 1.15, c.position.z + 2.5);
      look.copy(world.trunk.position);
      look.y += 0.45;
    } else if (phase === "pack") {
      want.set(c.position.x * 0.55, c.position.y + 0.85, c.position.z + 3.15);
      look.set(c.position.x * 0.35, c.position.y + 0.1, c.position.z - 2.2);
    } else if (phase === "celebrate") {
      want.set(0.6, 2.2, 5.4);
      look.set(0, 1.3, 0);
    } else {
      want.set(Math.sin(world.clock * 0.18) * 1.4, 2.35, 6.4);
      look.set(0, 1.25, -0.2);
    }
    if (world.punch > 0 && !REDUCE) {
      want.x += (Math.random() - 0.5) * world.punch;
      want.y += (Math.random() - 0.5) * world.punch;
      world.punch *= 0.82;
    } else {
      world.punch *= 0.82;
    }
    const k = 1 - Math.pow(0.001, dt * (phase === "dive" ? 4.2 : 2.6));
    world.camPos.lerp(want, k);
    world.camLook.lerp(look, k);
    world.camera.position.copy(world.camPos);
    world.camera.lookAt(world.camLook);
    if (world.wash && world.wash.material.opacity > 0) {
      world.wash.material.opacity *= 0.88;
    }
  }

  function animateIdle(dt) {
    world.clock += dt;
    const t = world.clock;
    world.lanterns.forEach((L, i) => {
      L.light.intensity = 1.05 + Math.sin(t * 6.5 + i) * 0.18;
      L.group.rotation.z = Math.sin(t * 1.3 + i) * 0.08;
    });
    world.fairy.children.forEach((b) => {
      if (b.material && b.material.emissive) b.material.emissiveIntensity = 0.5 + Math.sin(t * 6 + b.userData.phase) * 0.5;
    });
    if (!run || run.done || !run.alive) {
      if (world.lid) world.lid.rotation.x = -0.85 + Math.sin(t * 0.7) * 0.28;
      world.craft.position.set(Math.sin(t * 0.35) * 1.1, 1.55 + Math.sin(t * 0.8) * 0.12, 2.8 + Math.cos(t * 0.35) * 0.4);
      world.craft.rotation.y = t * 0.25;
      if (!world.kits.length) spawnOffer(AUTHORED[0]);
      if (!world.moths.length) spawnMoths(8);
      tickKits(dt, AUTHORED[0]);
      world.moths.forEach((m) => {
        const u = m.userData;
        u.a += dt * u.s;
        m.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(u.a * 2) * 0.12, Math.sin(u.a * 0.8) * u.r * 0.6 + u.cz);
      });
    }
    const mode = run && run.phase === "celebrate" ? "celebrate"
      : run && (run.phase === "pack" || run.phase === "dive") ? "point"
        : "wave";
    animateAura(dt, mode);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;
    if (!world) return;
    readSteer();
    hideToastIfDue(now);
    if (isLive()) {
      run.iFrames = Math.max(0, (run.iFrames || 0) - dt);
      if (run.dying) {
        run.deathHold -= dt * 1000;
        if (world.lid) world.lid.rotation.x = THREE.MathUtils.lerp(world.lid.rotation.x, 0.02, dt * 4);
        if (run.deathHold <= 0) seal(run.death);
      } else if (run.phase === "pack") tickPack(dt);
      else if (run.phase === "latch") tickLatch(dt);
      else if (run.phase === "dive") tickDive(dt);
      else if (run.phase === "celebrate") tickCelebrate(dt);
      stampDepth();
    }
    tickTrail(dt);
    tickFx(dt);
    animateIdle(dt);
    tickCam(dt);
    world.renderer.render(world.scene, world.camera);
  }

  function resize() {
    if (!world) return;
    const stage = world.canvas.parentElement;
    const w = Math.max(320, stage ? stage.clientWidth : window.innerWidth || 640);
    const h = Math.max(300, stage ? stage.clientHeight : window.innerHeight || 460);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / Math.max(1, h);
    world.camera.updateProjectionMatrix();
  }

  function startLoop() {
    if (raf) return;
    lastT = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function onPointerMove(ev) {
    if (!world) return;
    const r = world.canvas.getBoundingClientRect();
    pointerNdc.x = ((ev.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    pointerNdc.y = -((ev.clientY - r.top) / Math.max(1, r.height)) * 2 + 1;
  }

  function onPointerDown(ev) {
    ev.preventDefault();
    if (!world) return;
    if (!isLive()) {
      start();
      return;
    }
    if (run.dying || run.phase === "latch" || run.phase === "celebrate") return;
    input.held = true;
    world.canvas.classList.add("is-held");
    try { world.canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
    onPointerMove(ev);
  }

  function onPointerUp(ev) {
    input.held = false;
    if (world && world.canvas) world.canvas.classList.remove("is-held");
    try { if (ev && world) world.canvas.releasePointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
  }

  function onKey(ev) {
    if (!shown) return;
    if (ev.code === "Enter") {
      ev.preventDefault();
      if (!isLive()) start();
      else if (run.phase === "pack" && packedCount() >= (run.spec.need || 3)) beginDive();
      return;
    }
    if (ev.code === "Space") ev.preventDefault();
    keys[ev.code] = ev.type === "keydown";
  }

  PF.registerVendor({
    id: "pack",
    playKey: "pack",
    chalk: "Fly the lantern. Pack the night. Dive what you packed.",
    defaults: { bestPack: 0, bestPackScore: 0 },
    onLeave() {
      shown = false;
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopLoop();
    },
    onShow() {
      shown = true;
      if (!world) buildWorld();
      resize();
      startLoop();
      stampDepth();
      const hash = (location.hash || "").replace(/^#/, "");
      if (hash === "cabinet/pack/result") {
        const st = PF.getState ? PF.getState() : {};
        const last = st.lastRun && (st.lastRun.pack || st.lastRun);
        if (last && (last.gameId === GAME_ID || last.game === GAME_ID || st.lastRun.pack)) {
          if (kit.setMode) kit.setMode(card(), "result");
        }
      } else if (!isLive()) {
        if (kit.setMode) kit.setMode(card(), "vestibule");
        prompt("Pack three kits. Each one is a room you dive, in the order you packed.");
      }
    },
    onReset() {
      if (isLive()) finish("leave");
      run = null;
      if (kit.hideResult) kit.hideResult("packResult");
      const verdict = el("packVerdict");
      if (verdict) verdict.hidden = true;
      const startBtn = el("packStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      if (kit.setMode) kit.setMode(card(), "vestibule");
      stampDepth();
    },
    refreshDepth(state) {
      const st = state || (PF.getState ? PF.getState() : {});
      const live = isLive();
      setText("depthPackNow", live ? String(run.depth | 0) : "0");
      setText("depthPackScore", live ? String(run.score | 0) : "0");
      const bestN = Math.max(st.bestPack || 0, (st.bestDepth && st.bestDepth.pack) || 0);
      const last = st.lastRun && (st.lastRun.pack || st.lastRun);
      const bestS = Math.max(st.bestPackScore || 0, (last && last.gameId === GAME_ID ? last.score : 0) || 0);
      setText("depthPackBest", bestN ? String(bestN) : "—");
      setText("depthPackBestScore", bestS ? String(bestS) : "—");
      if (live && run.score > (st.bestPackScore || 0)) {
        st.bestPackScore = run.score;
        st.bestPack = Math.max(st.bestPack || 0, run.depth);
      }
    },
    bind() {
      declareP0();
      PF._packPlay = {
        snap() {
          if (!world) return { world: false };
          const ch = run && run.phase === "dive" ? currentChamber(world.craft.position.z) : null;
          return {
            world: true,
            phase: run && run.phase,
            alive: isLive(),
            dying: !!(run && run.dying),
            done: !!(run && run.done),
            slots: run ? run.slots.map((s) => (s && s.id) || null) : [],
            packed: run ? (run.packed || []).map((s) => s && s.id) : [],
            strikes: run && run.strikes,
            score: run && run.score,
            depth: run && run.depth,
            route: run && run.routeIndex,
            craft: [world.craft.position.x, world.craft.position.y, world.craft.position.z],
            kits: (world.kits || []).filter((k) => k.visible && !k.userData.packed).map((k) => ({
              id: k.userData.def && k.userData.def.id,
              ghost: !!k.userData.ghost,
              x: k.position.x, y: k.position.y, z: k.position.z,
            })),
            chamber: ch && {
              i: ch.i, id: ch.def.id, verb: ch.def.verb, got: ch.got, need: ch.need,
              z0: ch.z0, z1: ch.z1, pathAmp: ch.pathAmp, pathFreq: ch.pathFreq,
            },
            hoops: (world.hoops || []).filter((h) => !h.got).map((h) => ({ x: h.mesh.position.x, y: h.mesh.position.y, z: h.mesh.position.z })),
            tickets: (world.tickets || []).filter((t) => !t.got).map((t) => ({ good: t.good, x: t.mesh.position.x, y: t.mesh.position.y, z: t.mesh.position.z })),
            coins: (world.coins || []).filter((p) => !p.got).map((p) => ({ x: p.mesh.position.x, y: p.mesh.position.y, z: p.mesh.position.z })),
            stars: (world.stars || []).slice(0, 12).map((s) => ({ x: s.mesh.position.x, z: s.mesh.position.z })),
            lids: (world.lids || []).map((L) => ({ z: L.z, lx: L.l.position.x, rx: L.r.position.x })),
            latch: !!(el("packLatch") && !el("packLatch").hidden),
            prompt: (el("packPrompt") && el("packPrompt").textContent) || "",
            hud: (document.querySelector('[data-runkit-hud="pack"]') && document.querySelector('[data-runkit-hud="pack"]').textContent) || "",
          };
        },
        steer(nx, ny, boost) {
          pointerNdc.set(nx, ny);
          input.held = !!boost;
        },
      };
      const startBtn = el("packStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const latch = el("packLatch");
      if (latch) latch.addEventListener("click", (ev) => { ev.preventDefault(); beginDive(); });
      const slots = el("packSlots");
      if (slots) {
        slots.addEventListener("click", (ev) => {
          const li = ev.target && ev.target.closest ? ev.target.closest("[data-slot]") : null;
          if (!li || !run || run.phase !== "pack") return;
          ev.preventDefault();
          unpackSlot(Number(li.getAttribute("data-slot")));
        });
      }
      const canvas = el("packCanvas");
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointercancel", onPointerUp);
        canvas.addEventListener("pointerleave", onPointerUp);
      }
      const ch = el("packChallenge");
      if (ch) {
        ch.addEventListener("click", () => {
          const text = (el("packChallengeText") && el("packChallengeText").textContent) || "";
          if (kit.copyText) {
            kit.copyText(text, () => { const c = el("packCopied"); if (c) c.hidden = false; });
          }
        });
      }
      window.addEventListener("keydown", onKey);
      window.addEventListener("keyup", onKey);
      window.addEventListener("resize", () => { if (shown) resize(); });
      if ("ResizeObserver" in window) {
        const stage = canvas && canvas.parentElement;
        if (stage) new ResizeObserver(() => { if (shown) resize(); }).observe(stage);
      }
      stampDepth();
    },
  });
})();
