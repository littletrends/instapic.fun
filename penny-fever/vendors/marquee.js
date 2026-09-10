/* Boardwalk Lights — 3D spark ride. PF only. Never booth/port 6000.
 * Own design: fly a carnival spark down the night pier through gold letter gates.
 * Ice-blue shorts cost a strike. 8 authored WAVES then ENDLESS. Depth unit: Wave.
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

  const GAME_ID = "marquee";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const DEATH_HOLD_MS = 720;
  const REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;
  const SHOE = 0x111111;

  const AURA = {
    miss: "Aura: You missed the gold. The sign went hungry.",
    ice: "Aura: Ice-blue is a short. Gold only.",
    leave: "Aura: Walking off mid-ride? The fuse noticed.",
    shallow: "Aura: Not a single gate. The pier’s still dark.",
    mid: "Aura: Cute flight. The sign wanted a longer night.",
    deep: "Aura: You made the boardwalk remember you.",
    coda: "Aura: Authored waves done. ENDLESS sky sign. Don’t kiss ice.",
    souvenir: "Aura: Eight courses locked. Souvenir — the bulbs salute.",
    fizzled: "Aura: Fuse died. Steer cleaner next coin.",
  };

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Boardwalk Lights",
    depthUnit: "Wave",
    sheet: "GOBLIN_BATCH06_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const AUTHORED = [
    { id: 1, name: "Nursery Spark", word: "PENNY", gold: 4, speed: 6.0, gap: 10, weave: 0, ampX: 0, ampY: 0, ice: false, blackout: false, r: 1.28, barker: "Steer the spark. Fly through every GOLD hoop. Slow and center." },
    { id: 2, name: "Spell PENNY", word: "PENNY", gold: 5, speed: 7.1, gap: 9.2, weave: 0.75, ampX: 1.35, ampY: 0.12, ice: false, blackout: false, r: 1.12, barker: "PENNY weaves left and right. Stay in the gold." },
    { id: 3, name: "Ice Tease", word: "FEVER", gold: 5, speed: 7.6, gap: 9.0, weave: 0.65, ampX: 1.25, ampY: 0.16, ice: true, iceEvery: 1, iceOff: 2.35, iceR: 0.68, blackout: false, r: 1.08, barker: "Gold is the path. ICE-BLUE is a short — dodge it." },
    { id: 4, name: "High Low", word: "LIGHT", gold: 5, speed: 8.0, gap: 8.6, weave: 0.4, ampX: 0.7, ampY: 0.72, ice: true, iceEvery: 2, iceOff: 2.2, iceY: 1.55, iceR: 0.7, blackout: false, r: 1.05, barker: "Climb and dip. Gold moves up the night. Ice sits high." },
    { id: 5, name: "Storm Weave", word: "STORM", gold: 5, speed: 8.6, gap: 8.2, weave: 1.05, ampX: 1.85, ampY: 0.28, ice: true, iceEvery: 1, iceOff: -2.4, iceR: 0.66, blackout: false, r: 1.0, barker: "Faster S-curve. Ice sits where you just were." },
    { id: 6, name: "Night Dip", word: "NIGHT", gold: 5, speed: 8.4, gap: 8.4, weave: 0.5, ampX: 1.0, ampY: 0.35, ice: true, iceEvery: 1, iceOff: 2.15, iceY: 1.7, iceR: 0.64, lowGold: true, blackout: false, r: 1.02, barker: "Duck. Gold hugs the planks. Ice hangs high and wide." },
    { id: 7, name: "Blackout Chase", word: "NEON", gold: 4, speed: 7.8, gap: 9.2, weave: 0.7, ampX: 1.5, ampY: 0.32, ice: true, iceEvery: 1, iceOff: 2.3, iceR: 0.7, blackout: true, r: 1.06, barker: "The pier goes dark. Chase the gold hoop that lives." },
    { id: 8, name: "Fever Canyon", word: "PENNY", gold: 7, speed: 9.2, gap: 7.6, weave: 0.95, ampX: 1.7, ampY: 0.4, ice: true, iceEvery: 1, iceOff: 2.45, iceR: 0.62, blackout: false, r: 0.96, barker: "Dense gold. Liars wide. Hold the spark." },
  ];

  const CODA_WORDS = ["PENNY", "FEVER", "STORM", "NIGHT", "LIGHT", "SIGN", "HEAT", "STAR", "NEON", "RISE"];

  let world = null;
  let run = null;
  let raf = 0;
  let bound = false;
  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { x: 0, y: 0, down: false, touch: false };

  function rk() { return PF.runKit || null; }
  function el(id) { return $(id); }
  function setText(id, text) { const n = el(id); if (n) n.textContent = text; }
  function card() { return el("marqueeCard"); }
  function canvas() { return el("marqueeCanvas"); }
  function cabinetOn() {
    const n = document.getElementById("cabinet-marquee");
    return !!(n && !n.hidden);
  }
  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function codaOn() {
    const row = rk() && ((rk().declared && rk().declared[GAME_ID]) || (rk().p0 && rk().p0[GAME_ID]));
    if (row && typeof row.codaEnabled === "boolean") return !!row.codaEnabled;
    return CODA_ENABLED;
  }

  function waveSpec(n) {
    const i = Math.max(1, n | 0);
    if (i <= AUTHORED_COUNT) return AUTHORED[i - 1];
    const k = Math.max(0, i - AUTHORED_COUNT - 1);
    const word = CODA_WORDS[k % CODA_WORDS.length];
    return {
      id: i, name: "Sky Sign " + i, coda: true, word,
      gold: Math.min(9, 5 + ((k / 2) | 0)),
      speed: Math.min(12.5, 9.4 + k * 0.22),
      gap: Math.max(6.4, 8.0 - k * 0.08),
      weave: 0.95, ampX: Math.min(2.1, 1.55 + k * 0.03), ampY: 0.38,
      ice: true, iceEvery: 1, iceOff: 2.4 + (k % 2 ? -0.15 : 0.15), iceR: 0.62,
      blackout: k % 4 === 3, r: Math.max(0.82, 0.98 - k * 0.012),
      barker: "ENDLESS. The sign doesn’t sleep.",
    };
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    const spec = Object.assign({ authored: AUTHORED, authoredCount: AUTHORED_COUNT, codaEnabled: CODA_ENABLED, stageParams: waveSpec }, P0_MOUNT);
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

  function std(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.62, metalness: 0.08 }, extra || {}));
  }

  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function letterTex(ch, kind) {
    const gold = kind === "gold";
    const ice = kind === "ice";
    return canvasTex(128, 128, (ctx) => {
      ctx.fillStyle = gold ? "#2a1808" : ice ? "#041820" : "#140c0a";
      ctx.fillRect(0, 0, 128, 128);
      if (ice) {
        ctx.strokeStyle = "#8ee8ff";
        ctx.fillStyle = "#8ee8ff";
        ctx.lineWidth = 8;
        ctx.shadowColor = "#5ad8ff";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(64, 18); ctx.lineTo(64, 110);
        ctx.moveTo(22, 64); ctx.lineTo(106, 64);
        ctx.moveTo(34, 34); ctx.lineTo(94, 94);
        ctx.moveTo(94, 34); ctx.lineTo(34, 94);
        ctx.stroke();
        ctx.font = "bold 22px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("ICE", 64, 118);
        return;
      }
      ctx.fillStyle = gold ? "#ffe08a" : "#6a5040";
      ctx.font = "bold 86px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = gold ? "#ffb84a" : "transparent";
      ctx.shadowBlur = gold ? 18 : 0;
      ctx.fillText(ch, 64, 72);
    });
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = std(SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const cloth = std(DRESS, { emissive: 0x0a2010, emissiveIntensity: 0.28 });
    const blouse = std(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.18 });
    const dark = std(SHOE, { roughness: 0.22, metalness: 0.35 });
    const hairM = std(HAIR, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });
    const gold = std(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const heartM = std(HEART, { emissive: HEART, emissiveIntensity: 0.7, roughness: 0.4 });
    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.28, 10), blouse);
    torso.position.y = 0.28;
    hip.add(torso);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.12, 0.36, 10), cloth);
    skirt.position.y = 0.06;
    hip.add(skirt);
    const head = new THREE.Group();
    head.position.y = 0.64;
    hip.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), skin));
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), std(0x2a1810));
      eye.position.set(side * 0.07, 0.03, 0.2);
      head.add(eye);
    });
    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0, 0);
      const len = arm ? 0.28 : 0.34;
      const bone = new THREE.Mesh(new THREE.CylinderGeometry(arm ? 0.035 : 0.042, arm ? 0.035 : 0.042, len, 6), arm ? skin : cloth);
      bone.position.y = -len / 2;
      pivot.add(bone);
      if (!arm) {
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.12), dark);
        shoe.position.set(0, -len - 0.02, 0.03);
        pivot.add(shoe);
      }
      hip.add(pivot);
      return pivot;
    }
    const armL = limb(-1, true);
    const armR = limb(1, true);
    limb(-1, false); limb(1, false);
    const heart = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.04), heartM);
    heart.rotation.z = Math.PI / 4;
    heart.position.set(0, 0.22, 0.16);
    hip.add(heart);
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10), hairM);
    hairCap.position.set(0, 0.06, -0.02);
    head.add(hairCap);
    [-1, 1].forEach((side) => {
      const pig = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), hairM);
      pig.position.set(side * 0.2, -0.04, 0.04);
      head.add(pig);
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), heartM);
      bead.position.set(side * 0.2, 0.06, 0.06);
      head.add(bead);
    });
    const crown = new THREE.Group();
    crown.position.y = 0.24;
    head.add(crown);
    crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 6, 14), gold));
    [-0.09, 0, 0.09].forEach((x, i) => {
      const hh = i === 1 ? 0.14 : 0.09;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, hh, 5), gold);
      spike.position.set(x, hh * 0.45, 0);
      crown.add(spike);
    });
    const gem = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.025), heartM);
    gem.rotation.z = Math.PI / 4;
    gem.position.set(0, 0.02, 0.11);
    crown.add(gem);
    g.userData = { armL, armR, head, hip };
    g.scale.setScalar(1.05);
    return g;
  }

  function makeGate(ch, kind) {
    const g = new THREE.Group();
    const ice = kind === "ice";
    const em = ice ? 0x3ad0ff : 0xffc84a;
    const tex = letterTex(ch, kind);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(ice ? 1.15 : 1.28, ice ? 1.15 : 1.45),
      new THREE.MeshStandardMaterial({
        map: tex, emissive: em, emissiveIntensity: ice ? 1.05 : 0.95,
        roughness: 0.42, metalness: ice ? 0.35 : 0.12, transparent: true, opacity: 0.97,
      })
    );
    g.add(face);
    const hoop = new THREE.Mesh(
      new THREE.TorusGeometry(ice ? 0.92 : 1.02, ice ? 0.07 : 0.08, 8, 24),
      std(ice ? 0x8ee8ff : 0xe8b84a, {
        metalness: ice ? 0.55 : 0.65, roughness: 0.28,
        emissive: em, emissiveIntensity: ice ? 0.9 : 0.7,
      })
    );
    g.add(hoop);
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 1.9, 0.18),
      std(ice ? 0x102830 : 0x2a1810, { metalness: 0.45, roughness: 0.4, emissive: em, emissiveIntensity: 0.22 })
    );
    frame.position.z = -0.14;
    g.add(frame);
    const bulbGeo = new THREE.SphereGeometry(0.07, 6, 6);
    const bulbMat = std(ice ? 0x8ee8ff : 0xffe08a, { emissive: em, emissiveIntensity: 1.35 });
    [[-0.72, 0.82], [0.72, 0.82], [-0.72, -0.82], [0.72, -0.82]].forEach((xy) => {
      const b = new THREE.Mesh(bulbGeo, bulbMat);
      b.position.set(xy[0], xy[1], 0.12);
      g.add(b);
    });
    g.userData.kind = kind;
    return g;
  }

  function makeSpark() {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffc84a, emissiveIntensity: 1.4, roughness: 0.25 })
    );
    g.add(core);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.28, depthWrite: false })
    );
    g.add(glow);
    const light = new THREE.PointLight(0xffc84a, 1.4, 9, 1.6);
    g.add(light);
    g.userData = { core, glow, light };
    return g;
  }

  function tentTextures() {
    const stripe = canvasTex(128, 128, (ctx) => {
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? "#7b2743" : "#f0d09a";
        ctx.fillRect(i * 16, 0, 16, 128);
      }
    });
    stripe.wrapS = stripe.wrapT = THREE.RepeatWrapping;
    stripe.repeat.set(3, 2);
    const wood = canvasTex(128, 128, (ctx) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? "#2a1810" : "#4a2e1c";
        ctx.fillRect(i * 16, 0, 14, 128);
      }
    });
    wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
    wood.repeat.set(2, 4);
    const sign = canvasTex(512, 96, (ctx) => {
      ctx.fillStyle = "#12080c";
      ctx.fillRect(0, 0, 512, 96);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "bold 48px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#ffb84a";
      ctx.shadowBlur = 12;
      ctx.fillText("BOARDWALK LIGHTS", 256, 52);
    });
    if (THREE.ClampToEdgeWrapping) {
      sign.wrapS = sign.wrapT = THREE.ClampToEdgeWrapping;
    }
    return { stripe, wood, sign };
  }

  function makeTentSlice(z, mats, geos, odd) {
    const g = new THREE.Group();
    g.position.z = z;
    const wallL = new THREE.Mesh(geos.wall, mats.canvas);
    wallL.position.set(-5.1, 2.4, 0);
    wallL.rotation.y = Math.PI / 2;
    g.add(wallL);
    const wallR = wallL.clone();
    wallR.position.x = 5.1;
    wallR.rotation.y = -Math.PI / 2;
    g.add(wallR);
    const roof = new THREE.Mesh(geos.roof, mats.canvas);
    roof.position.set(0, 4.55, 0);
    roof.rotation.x = Math.PI / 2;
    g.add(roof);
    const floor = new THREE.Mesh(geos.floor, mats.wood);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    g.add(floor);
    [-4.35, 4.35].forEach((x) => {
      const post = new THREE.Mesh(geos.post, mats.post);
      post.position.set(x, 2.15, -4.4);
      g.add(post);
      const post2 = post.clone();
      post2.position.z = 4.4;
      g.add(post2);
    });
    const valance = new THREE.Mesh(geos.valance, mats.valance);
    valance.position.set(0, 4.05, 0);
    g.add(valance);
    if (odd) {
      const booth = new THREE.Mesh(geos.booth, mats.booth);
      booth.position.set(3.55, 0.7, 0);
      g.add(booth);
    }
    [-3.85, 3.85].forEach((x, i) => {
      const lamp = new THREE.Mesh(geos.lamp, mats.lamp);
      lamp.position.set(x, 3.55, i ? 2.2 : -2.2);
      g.add(lamp);
    });
    return g;
  }

  function buildWorld() {
    const cv = canvas();
    if (!cv) return null;
    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setClearColor(0x1a0c12, 1);
    renderer.setPixelRatio(1);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a0c12, 0.022);
    scene.background = new THREE.Color(0x12080e);
    const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 180);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    camera.position.set(0, 2.45, -9.6);

    scene.add(new THREE.HemisphereLight(0xffd0a0, 0x2a1014, 0.55));
    const moonL = new THREE.DirectionalLight(0xffe0b0, 0.4);
    moonL.position.set(-6, 12, 2);
    scene.add(moonL);
    const fill = new THREE.DirectionalLight(0xffc080, 0.22);
    fill.position.set(6, 4, 8);
    scene.add(fill);

    const tex = tentTextures();
    const mats = {
      canvas: std(0xc45a6a, { map: tex.stripe, roughness: 0.85, emissive: 0x3a1018, emissiveIntensity: 0.12 }),
      wood: std(0x3a2418, { map: tex.wood, roughness: 0.9 }),
      post: std(0x2a1810, { roughness: 0.7 }),
      valance: std(0x5a1830, { roughness: 0.8, emissive: 0x2a0810, emissiveIntensity: 0.15 }),
      booth: std(0x7b2743, { roughness: 0.7, emissive: 0x2a0810, emissiveIntensity: 0.1 }),
      brass: std(0xd4a45a, { metalness: 0.55, roughness: 0.35, emissive: 0x4a3010, emissiveIntensity: 0.25 }),
      lamp: std(0xffe08a, { emissive: 0xffc84a, emissiveIntensity: 1.15 }),
    };
    const geos = {
      wall: new THREE.PlaneGeometry(12, 5.2),
      roof: new THREE.PlaneGeometry(11, 12),
      floor: new THREE.PlaneGeometry(10.2, 12),
      post: new THREE.BoxGeometry(0.22, 4.3, 0.22),
      valance: new THREE.BoxGeometry(10.4, 0.28, 12),
      booth: new THREE.BoxGeometry(1.5, 1.4, 1.3),
      lamp: new THREE.SphereGeometry(0.09, 6, 6),
    };

    const sliceLen = 12;
    const slices = [];
    for (let i = 0; i < 6; i++) {
      const sl = makeTentSlice(i * sliceLen, mats, geos, i % 2);
      scene.add(sl);
      slices.push(sl);
    }

    const title = new THREE.Mesh(
      new THREE.PlaneGeometry(7.4, 1.15),
      new THREE.MeshStandardMaterial({ map: tex.sign, emissive: 0x4a3010, emissiveIntensity: 0.4, roughness: 0.5 })
    );
    title.position.set(0, 3.85, 2.4);
    scene.add(title);

    const mouthL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.2, 0.4), mats.post);
    mouthL.position.set(-5.1, 2.5, -1.2);
    scene.add(mouthL);
    const mouthR = mouthL.clone();
    mouthR.position.x = 5.1;
    scene.add(mouthR);

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 80),
      std(0x0a1a28, { roughness: 0.3, metalness: 0.5, emissive: 0x041018, emissiveIntensity: 0.18 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.7, 40);
    scene.add(water);

    const wheel = new THREE.Group();
    wheel.position.set(-11, 4.2, 28);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.07, 6, 24), mats.brass);
    wheel.add(rim);
    for (let i = 0; i < 6; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.05, 4.3, 0.05), mats.post);
      spoke.rotation.z = (i / 6) * Math.PI;
      wheel.add(spoke);
    }
    scene.add(wheel);

    const aura = makeAura();
    aura.position.set(-2.35, 0, 1.1);
    aura.rotation.y = 0.45;
    scene.add(aura);

    const spark = makeSpark();
    spark.position.set(0, 1.35, 0);
    scene.add(spark);

    const gateRoot = new THREE.Group();
    scene.add(gateRoot);

    return {
      renderer, scene, camera, moonL, aura, spark, gateRoot, water, wheel,
      slices, sliceLen, title,
      lastFrame: 0, lastT: 0, blackout: false, pose: "idle",
    };
  }

  function resize() {
    if (!world) return;
    const cv = canvas();
    const stage = document.querySelector("#cabinet-marquee .pf-mq-viewport");
    if (!cv || !stage) return;
    const w = Math.max(320, stage.clientWidth || 960);
    const h = Math.max(240, stage.clientHeight || 540);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function clearGates() {
    if (!world) return;
    while (world.gateRoot.children.length) {
      const ch = world.gateRoot.children[0];
      world.gateRoot.remove(ch);
    }
    if (run) run.gates = [];
  }

  function placeCourse(spec, z0) {
    clearGates();
    const gates = [];
    let z = z0 == null ? 12 : z0;
    const word = spec.word || "PENNY";
    const n = spec.gold || word.length;
    const iceR = spec.iceR || Math.max(0.55, (spec.r || 1) * 0.62);
    for (let i = 0; i < n; i++) {
      const ch = word[i % word.length];
      const x = spec.weave ? Math.sin(i * spec.weave) * (spec.ampX || 0) : 0;
      let y = 1.35 + (spec.ampY ? Math.sin(i * 0.85) * spec.ampY : 0);
      if (spec.lowGold) y = 0.82 + Math.abs(Math.sin(i)) * 0.18;
      const gold = { ch, kind: "gold", x, y, z, r: spec.r || 1.0, passed: false, mesh: makeGate(ch, "gold") };
      gold.mesh.position.set(x, y, z);
      world.gateRoot.add(gold.mesh);
      gates.push(gold);
      if (spec.ice && (i % (spec.iceEvery || 1) === 0) && i > 0) {
        const ix = x + (spec.iceOff || 2.3);
        const iy = y + (spec.iceY || 0);
        const ice = { ch: "X", kind: "ice", x: ix, y: iy, z: z - spec.gap * 0.42, r: iceR, passed: false, mesh: makeGate("X", "ice") };
        ice.mesh.position.set(ix, iy, ice.z);
        world.gateRoot.add(ice.mesh);
        gates.push(ice);
      }
      z += spec.gap;
    }
    run.gates = gates;
    run.finishZ = z + 4;
    run.goldNeed = n;
    run.goldGot = 0;
    run.overrun = false;
    paintWord();
  }

  function setBlackout(on) {
    if (!world) return;
    world.blackout = !!on;
    world.scene.fog.density = on ? 0.048 : 0.022;
    world.moonL.intensity = on ? 0.08 : 0.45;
  }

  function paintWord() {
    const node = el("marqueeCueWord");
    if (!node || !run || !run.gates) { if (node) node.textContent = ""; return; }
    const golds = run.gates.filter((g) => g.kind === "gold");
    node.innerHTML = golds.map((g, i) => {
      const cls = i < run.goldGot ? "is-done" : (i === run.goldGot ? "is-next" : "");
      return `<span class="${cls}">${g.ch}</span>`;
    }).join("");
  }

  function paintHud() {
    const hud = document.querySelector('[data-runkit-hud="marquee"]');
    if (!hud) return;
    if (!run || !run.spec) { hud.textContent = "WAVE 0"; return; }
    hud.textContent = run.spec.coda
      ? `ENDLESS · WAVE ${run.cleared} · ${run.spec.name}`
      : `WAVE ${run.spec.id} · ${run.spec.name}`;
  }

  function paintPips() {
    const span = document.querySelector('[data-runkit-strikes="marquee"]');
    if (!span) return;
    const n = run && isLive() ? ((run.kitRun && run.kitRun.strikes) || 0) : 0;
    span.querySelectorAll("i").forEach((p, i) => p.classList.toggle("on", i < n));
  }

  function sfx(name) { if (kit && kit.sfx) kit.sfx(name); }

  function beginWave(n) {
    const spec = waveSpec(n);
    run.spec = spec;
    run.hint = spec.barker;
    setText("marqueeStatus", spec.barker);
    setText("marqueeHint", spec.barker);
    setBlackout(!!spec.blackout);
    let z0 = 12;
    if (world && world.spark) {
      if (n <= 1) world.spark.position.set(0, 1.35, 0);
      z0 = world.spark.position.z + (n <= 1 ? 12 : 11);
    }
    placeCourse(spec, z0);
    if (rk() && run.kitRun) rk().reportDepth(run.kitRun, run.cleared, { name: spec.name, coda: !!spec.coda });
    paintHud();
    paintPips();
    if (spec.coda && run.cleared === AUTHORED_COUNT && typeof PF.showBanner === "function") {
      PF.showBanner(true, "ENDLESS", "Sky sign. Gold through. Ice dodge.");
    }
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
  }

  function strike(reason) {
    if (!isLive()) return;
    const now = performance.now();
    if (now < (run.graceUntil || 0)) return;
    run.graceUntil = now + 260;
    sfx("miss");
    if (rk() && run.kitRun) rk().reportStrike(run.kitRun, reason);
    paintPips();
    run.hint = reason === "ice" ? AURA.ice : AURA.miss;
    setText("marqueeStatus", run.hint);
    setText("marqueeHint", run.hint);
    if (((run.kitRun && run.kitRun.strikes) || 0) >= 3) finish(reason);
  }

  function hitGold(gate) {
    run.goldGot += 1;
    run.score += 40 + run.goldGot * 8;
    if (run.kitRun) run.kitRun.score = run.score;
    sfx("rack");
    gate.mesh.scale.setScalar(1.18);
    paintWord();
    if (run.goldGot >= run.goldNeed) clearWave();
  }

  function clearWave() {
    run.score += 400;
    if (run.kitRun) run.kitRun.score = run.score;
    run.cleared += 1;
    sfx("chapter");
    grantBulb();
    if (rk() && run.kitRun) rk().reportDepth(run.kitRun, run.cleared, { name: run.spec.name, coda: !!run.spec.coda });
    if (run.cleared === AUTHORED_COUNT && !codaOn()) {
      finish("souvenir");
      return;
    }
    const next = run.cleared + 1;
    setText("marqueeStatus", `WAVE ${run.cleared} LIT — ${waveSpec(next).name}`);
    setTimeout(() => { if (isLive()) beginWave(next); }, 640);
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
  }

  function grantBulb() {
    const state = PF.getState && PF.getState();
    if (!state) return;
    state.curios = state.curios || {};
    if (!state.curios.marquee_bulb) {
      state.curios.marquee_bulb = { shelf: "guts", at: Date.now() };
      if (PF.saveState) PF.saveState();
    }
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "ice") return AURA.ice;
    if (depth >= 8) return AURA.deep;
    if (depth >= 3) return AURA.mid;
    if (depth > 0) return AURA.fizzled;
    return AURA.shallow;
  }

  function challengeLine(depth) {
    if (rk() && rk().challengeText) return rk().challengeText("Boardwalk Lights", depth, GAME_ID);
    return `Beat my Boardwalk Lights ${depth} on Penny Fever`;
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && rk().finishRun) {
      try { return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false }); }
      catch (_) { /* fall */ }
    }
    if (kit && kit.persistRun) kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = reason !== "leave" && reason !== "souvenir";
    if (reason !== "leave" && reason !== "souvenir") sfx("drain");
    const depth = run.cleared | 0;
    const score = run.score | 0;
    closeKitRun({
      depth, score,
      deathReason: reason === "leave" ? "leave" : reason === "souvenir" ? "souvenir" : reason,
      cashedOut: reason === "souvenir",
      meta: { room: run.spec && run.spec.name, coda: !!(run.spec && run.spec.coda) },
    });
    const reveal = () => revealResult({ reason, depth, score });
    if (reason === "leave" || reason === "souvenir") reveal();
    else setTimeout(reveal, DEATH_HOLD_MS);
  }

  function revealResult(shot) {
    const { reason, depth, score } = shot;
    const aura = auraLine(reason, depth);
    const startBtn = el("marqueeGo");
    if (startBtn) {
      startBtn.hidden = false;
      startBtn.disabled = false;
      startBtn.textContent = "RIDE AGAIN · 1 demo coin";
    }
    if (kit) kit.setMode(card(), "result");
    const verdict = el("marqueeVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = reason === "leave" ? `Left the pier · WAVE ${depth}` : (reason === "souvenir" ? `SOUVENIR · WAVE ${depth}` : `WAVE ${depth} · “${aura}”`);
    }
    if (kit) {
      kit.fillResult({
        root: "marqueeResult", depth: "marqueeResultDepth", score: "marqueeResultScore",
        aura: "marqueeResultAura", copied: "marqueeCopied",
      }, {
        depthLine: reason === "souvenir" ? `SOUVENIR · WAVE ${depth}` : (depth > AUTHORED_COUNT ? `ENDLESS · WAVE ${depth}` : `WAVE ${depth}`),
        scoreLine: `SCORE ${score} · ${String(reason).toUpperCase()}`,
        auraLine: aura,
      });
    }
    setText("marqueeChallengeText", challengeLine(depth));
    if (PF.setTier) PF.setTier("marqueeTier", depth > 0 ? (depth > AUTHORED_COUNT ? `ENDLESS · WAVE ${depth}` : `WAVE ${depth}`) : (reason === "souvenir" ? "SOUVENIR" : "FIZZLED"), depth > 0 || reason === "souvenir" ? "perfect" : "miss");
    setText("marqueeStatus", reason === "leave" ? "Left the pier." : (reason === "souvenir" ? "Souvenir — authored waves locked." : "Fuse died. Steer gold. Dodge ice."));
    const ok = depth > 0 || reason === "souvenir";
    if (PF.award) {
      if (ok) PF.award(Math.max(10, Math.floor(score / 12)), true, "Marquee");
      else PF.award(0, false, "Marquee miss");
    }
    if (PF.setAura) PF.setAura(ok ? (depth >= 4 ? "celebrate" : "point") : "badLuck");
    if (reason !== "leave" && PF.showBanner) PF.showBanner(ok, ok ? `WAVE ${depth}` : "FIZZLED", aura);
    if (PF.refreshNightBoard) PF.refreshNightBoard();
    if (PF.refreshDepth) PF.refreshDepth();
    run.dying = false;
  }

  function startGame() {
    if (isLive() || !cabinetOn()) return;
    const kitRun = rk() && rk().startRun ? rk().startRun({ gameId: GAME_ID }) : null;
    if (!kitRun) {
      setText("marqueeStatus", "Out of demo coins · grant a pass");
      if (PF.refreshNightBoard) PF.refreshNightBoard();
      return;
    }
    const state = PF.getState && PF.getState();
    if (state) {
      state.plays = state.plays || {};
      state.plays.marquee = (state.plays.marquee || 0) + 1;
      if (PF.saveState) PF.saveState();
    }
    if (kit) kit.hideResult("marqueeResult");
    const verdict = el("marqueeVerdict");
    if (verdict) verdict.hidden = true;
    if (PF.setTier) PF.setTier("marqueeTier", "", "");
    if (kit) kit.setMode(card(), "play");
    const startBtn = el("marqueeGo");
    if (startBtn) startBtn.hidden = true;
    pointer.x = 0; pointer.y = 0; pointer.down = false; pointer.touch = false;
    run = {
      kitRun, done: false, dying: false, cleared: 0, score: 0,
      spec: null, gates: [], goldNeed: 0, goldGot: 0, finishZ: 40, hint: "", overrun: false,
    };
    ensureWorld();
    beginWave(1);
    kickLoop();
    const cv = canvas();
    if (cv && cv.focus) try { cv.focus(); } catch (_) { /* ignore */ }
  }

  function steer(dt) {
    if (!world || !world.spark) return;
    let tx = pointer.x * 3.05;
    let ty = 1.35 + pointer.y * 1.35;
    if (keys.l) tx -= 2.2;
    if (keys.r) tx += 2.2;
    if (keys.u) ty += 1.25;
    if (keys.d) ty -= 1.1;
    tx = Math.max(-2.9, Math.min(2.9, tx));
    ty = Math.max(0.62, Math.min(2.85, ty));
    const sp = world.spark.position;
    const follow = (pointer.touch || pointer.down) ? 0.22 : 0.16;
    const k = Math.min(1, follow * (dt / 0.016));
    sp.x += (tx - sp.x) * k;
    sp.y += (ty - sp.y) * k;
    const speed = (run && run.spec && run.spec.speed) || 6.5;
    if (isLive()) sp.z += speed * dt;
    else sp.z = 0;
    const pulse = 1 + Math.sin((world.lastT || 0) * 8) * 0.08;
    if (world.spark.userData.glow) world.spark.userData.glow.scale.setScalar(pulse);
  }

  function tickGates() {
    if (!isLive() || !world) return;
    const sp = world.spark.position;
    run.gates.forEach((g) => {
      if (g.passed) return;
      if (sp.z < g.z - 0.55) return;
      g.passed = true;
      const d = Math.hypot(sp.x - g.x, sp.y - g.y);
      if (g.kind === "gold") {
        if (d <= g.r) hitGold(g);
        else strike("miss");
      } else if (g.kind === "ice") {
        if (d <= g.r) strike("ice");
      }
      if (g.mesh) {
        const ok = g.kind === "gold" && d <= g.r;
        g.mesh.scale.setScalar(ok ? 1.12 : 0.86);
        g.mesh.children.forEach((ch) => {
          if (ch.material && ch.material.emissiveIntensity != null) {
            ch.material.emissiveIntensity = ok ? 1.3 : 0.12;
          }
        });
      }
    });
    if (isLive() && !run.overrun && sp.z > run.finishZ && run.goldGot < run.goldNeed) {
      run.overrun = true;
      strike("miss");
    }
  }

  function tickCamera() {
    if (!world) return;
    const sp = world.spark.position;
    const cam = world.camera;
    const want = new THREE.Vector3(sp.x * 0.28, sp.y + 1.55, sp.z - 9.2);
    cam.position.lerp(want, REDUCE ? 1 : 0.2);
    cam.lookAt(sp.x * 0.4, sp.y + 0.15, sp.z + 11);
  }

  function poseAura(t) {
    if (!world || !world.aura) return;
    const u = world.aura.userData;
    u.hip.position.y = 0.42 + Math.sin(t * 2) * 0.02;
    u.armR.rotation.x = isLive() ? -1.2 : Math.sin(t * 1.4) * 0.15;
    u.armL.rotation.x = isLive() ? 0.2 : Math.sin(t * 1.4 + 1) * 0.15;
    u.head.rotation.y = Math.sin(t * 0.7) * 0.2;
  }

  function tickTent() {
    if (!world || !world.slices) return;
    const z = world.spark.position.z;
    const len = world.sliceLen || 12;
    const origin = Math.floor(z / len) - 1;
    for (let i = 0; i < world.slices.length; i++) {
      world.slices[i].position.z = (origin + i) * len;
    }
    if (world.title) world.title.position.z = z + 7.2;
    if (world.aura) {
      world.aura.position.x = -2.55;
      world.aura.position.z = z - 2.5;
    }
    if (world.wheel) {
      world.wheel.position.z = z + 22;
      world.wheel.rotation.z += 0.006;
    }
  }

  function tickWorld(dt, t) {
    if (!world) return;
    steer(dt);
    tickGates();
    tickCamera();
    poseAura(t);
    tickTent();
    world.renderer.render(world.scene, world.camera);
  }

  function loop(now) {
    if (!cabinetOn() || !world) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
    if (world.lastFrame && now - world.lastFrame < 33) return;
    world.lastFrame = now;
    const t = now * 0.001;
    const dt = Math.min(0.05, t - (world.lastT || t));
    world.lastT = t;
    tickWorld(dt, t);
  }

  function kickLoop() {
    if (raf) return;
    raf = requestAnimationFrame(loop);
  }
  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function ensureWorld() {
    if (world) { resize(); return world; }
    try {
      world = buildWorld();
      resize();
    } catch (err) {
      console.warn("marquee 3d", err);
      world = null;
    }
    return world;
  }

  function viewRect() {
    const host = document.querySelector("#cabinet-marquee .pf-mq-viewport") || canvas();
    return host ? host.getBoundingClientRect() : { left: 0, top: 0, width: 1, height: 1 };
  }

  function applyClient(cx, cy) {
    const r = viewRect();
    pointer.x = ((cx - r.left) / Math.max(1, r.width)) * 2 - 1;
    pointer.y = -((cy - r.top) / Math.max(1, r.height)) * 2 + 1;
    pointer.x = Math.max(-1, Math.min(1, pointer.x));
    pointer.y = Math.max(-1, Math.min(1, pointer.y));
  }

  function fingerFromEvent(ev) {
    const t = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]) || ev;
    if (!t || t.clientX == null) return null;
    return t;
  }

  function onPointerDown(ev) {
    if (ev.target && ev.target.closest && ev.target.closest("button, a, input")) return;
    pointer.down = true;
    pointer.touch = ev.pointerType === "touch" || ev.pointerType === "pen";
    applyClient(ev.clientX, ev.clientY);
    const cv = canvas();
    if (cv) {
      cv.classList.add("is-dragging");
      try { cv.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
    }
    if (ev.cancelable) ev.preventDefault();
  }
  function onPointerMove(ev) {
    if (pointer.touch && !pointer.down) return;
    if (ev.clientX == null) return;
    applyClient(ev.clientX, ev.clientY);
    if (pointer.down && ev.cancelable) ev.preventDefault();
  }
  function onPointerUp(ev) {
    pointer.down = false;
    const cv = canvas();
    if (cv) cv.classList.remove("is-dragging");
    if (ev && ev.cancelable) ev.preventDefault();
  }
  function onTouch(ev) {
    const t = fingerFromEvent(ev);
    if (!t) return;
    pointer.down = true;
    pointer.touch = true;
    applyClient(t.clientX, t.clientY);
    if (ev.cancelable) ev.preventDefault();
  }
  function onTouchEnd(ev) {
    pointer.down = false;
    const cv = canvas();
    if (cv) cv.classList.remove("is-dragging");
    if (ev.cancelable) ev.preventDefault();
  }

  function onKey(ev) {
    if (!cabinetOn()) return;
    const k = ev.key;
    if ((k === "Enter" || k === " ") && !isLive() && ev.type === "keydown") {
      ev.preventDefault();
      startGame();
      return;
    }
    const on = ev.type === "keydown";
    if (k === "ArrowLeft" || k === "a" || k === "A") keys.l = on;
    if (k === "ArrowRight" || k === "d" || k === "D") keys.r = on;
    if (k === "ArrowUp" || k === "w" || k === "W") keys.u = on;
    if (k === "ArrowDown" || k === "s" || k === "S") keys.d = on;
  }

  function bindUi() {
    if (bound) return;
    bound = true;
    const go = el("marqueeGo");
    if (go) go.addEventListener("click", () => startGame());
    const ch = el("marqueeChallenge");
    if (ch) {
      ch.addEventListener("click", () => {
        const text = (el("marqueeChallengeText") && el("marqueeChallengeText").textContent) || challengeLine(0);
        if (kit && kit.copyText) kit.copyText(text, () => { const c = el("marqueeCopied"); if (c) c.hidden = false; });
      });
    }
    const view = document.querySelector("#cabinet-marquee .pf-mq-viewport") || canvas();
    if (view) {
      const opts = { passive: false };
      view.addEventListener("pointerdown", onPointerDown, opts);
      view.addEventListener("pointermove", onPointerMove, opts);
      view.addEventListener("pointerup", onPointerUp, opts);
      view.addEventListener("pointercancel", onPointerUp, opts);
      view.addEventListener("touchstart", onTouch, opts);
      view.addEventListener("touchmove", onTouch, opts);
      view.addEventListener("touchend", onTouchEnd, opts);
      view.addEventListener("touchcancel", onTouchEnd, opts);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("resize", resize);
  }

  PF.marqueeTune = {
    snap() {
      const sp = world && world.spark && world.spark.position;
      const next = run && run.gates && run.gates.find((g) => !g.passed);
      const gold = run && run.gates && run.gates.find((g) => g.kind === "gold" && !g.passed);
      return {
        live: isLive(),
        done: !!(run && run.done),
        dying: !!(run && run.dying),
        wave: run && run.spec && run.spec.id,
        name: run && run.spec && run.spec.name,
        cleared: run && run.cleared,
        goldGot: run && run.goldGot,
        goldNeed: run && run.goldNeed,
        strikes: run && run.kitRun && run.kitRun.strikes,
        score: run && run.score,
        reason: run && run.deathReason,
        spark: sp ? { x: +sp.x.toFixed(2), y: +sp.y.toFixed(2), z: +sp.z.toFixed(2) } : null,
        next: next ? { kind: next.kind, ch: next.ch, x: +next.x.toFixed(2), y: +next.y.toFixed(2), z: +next.z.toFixed(2), r: next.r } : null,
        gold: gold ? { ch: gold.ch, x: +gold.x.toFixed(2), y: +gold.y.toFixed(2), z: +gold.z.toFixed(2), r: gold.r } : null,
        pointer: { x: +pointer.x.toFixed(2), y: +pointer.y.toFixed(2), down: pointer.down },
      };
    },
    aimWorld(x, y) {
      pointer.x = x / 3.05;
      pointer.y = (y - 1.35) / 1.35;
      pointer.down = true;
    },
  };

  PF.registerVendor({
    id: "marquee",
    playKey: "marquee",
    chalk: "STEER THE SPARK — GOLD THROUGH, ICE DODGE",
    defaults: { bestMarqueeWave: 0, bestMarqueeScore: 0 },
    bind() { bindUi(); },
    onLeave() {
      stopLoop();
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
    },
    onShow() {
      declareP0();
      bindUi();
      if (kit && !isLive() && !(run && run.dying)) kit.setMode(card(), (run && run.done) ? "result" : "vestibule");
      ensureWorld();
      kickLoop();
    },
    onReset() {
      if (run && !run.done) finish("leave");
      run = null;
      clearGates();
      setBlackout(false);
      const verdict = el("marqueeVerdict");
      if (verdict) verdict.hidden = true;
      if (kit) kit.hideResult("marqueeResult");
      const startBtn = el("marqueeGo");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.hidden = false;
        startBtn.textContent = "RIDE · 1 demo coin";
      }
      if (kit) kit.setMode(card(), "vestibule");
      setText("marqueeStatus", "STEER the spark · GOLD through · ICE dodge · START · 1 demo coin");
    },
    refreshDepth(state) {
      const playing = isLive() || !!(run && run.dying);
      setText("depthMarqueeNow", playing ? String(run.cleared || 0) : "0");
      setText("depthMarqueeScore", playing ? String(run.score | 0) : "0");
      const bestN = Math.max(state.bestMarqueeWave || 0, (state.bestDepth && state.bestDepth.marquee) || 0);
      const bestS = Math.max(state.bestMarqueeScore || 0, ((state.lastRun && state.lastRun.marquee && state.lastRun.marquee.score) || 0));
      if (playing) {
        state.bestMarqueeWave = Math.max(state.bestMarqueeWave || 0, run.cleared | 0);
        state.bestMarqueeScore = Math.max(state.bestMarqueeScore || 0, run.score | 0);
      }
      setText("depthMarqueeBest", bestN ? String(bestN) : "—");
      setText("depthMarqueeBestScore", bestS ? String(bestS) : "—");
      const door = el("marqueeDoorBest");
      if (door) door.textContent = bestN ? `Wave ${bestN}` : "Wave —";
    },
  });
}
