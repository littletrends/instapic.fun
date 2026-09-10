/* Backstage Flap — id=pass. Fly Gallery 3D. Desktop Grok owns this tent.
 * PF only. Never booth / port 6000 / Imagine downloads.
 * Not a stamp-pad. Catch gold loft-bags, dump pale ghosts, pull glowing fly ropes.
 * One coin = one run. 8 authored CALLS then ENDLESS. Family-safe. Aura look locked. */
import * as THREE from "../world/lib/three.module.min.js";

(function bootPass() {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) {
    setTimeout(bootPass, 24);
    return;
  }
  const { kit } = PF;
  const GAME_ID = "pass";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const CATCH_SCORE = 140;
  const ROPE_SCORE = 200;
  const CLEAR_BONUS = 320;
  const GHOST_PIT = 20;
  const DEATH_HOLD_MS = 780;
  const REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;
  const VELVET = 0x5a1424;
  const WOOD = 0x3a2418;
  const BRASS = 0xd4a45a;

  const ROPE_META = [
    { name: "TREE", color: 0xc41e3a, key: "1" },
    { name: "MOON", color: 0xe8b84a, key: "2" },
    { name: "CASTLE", color: 0x3d8a8a, key: "3" },
    { name: "STAR", color: 0xf0d09a, key: "4" },
  ];

  const AURA = {
    miss: "Aura: That bag was mine. The boards felt it.",
    ghost: "Aura: That was a ghost counterweight. Dump the pale ones.",
    rope: "Aura: Wrong fly. Scenery wanted a different rope.",
    expire: "Aura: The batten waited. You didn’t pull.",
    shallow: "Aura: Not a single catch. The loft stayed hungry.",
    mid: "Aura: Cute fly work. Opening night still wants blood.",
    deep: (n) => `Aura: Call ${n}. You’re living in my fly gallery.`,
    coda: "Aura: Authored calls done. ENDLESS — the house stays open.",
    leave: "Aura: Walking off mid-call? Coward’s hook.",
    souvenir: "Aura: Opening Night survived. Souvenir — foyer glow is yours.",
    clear: "Aura: Call up. New loft. Don’t blink.",
    pit: "Aura: Ghost in the pit. That’s the job.",
  };

  const AUTHORED = [
    {
      id: 1, name: "Soft Loft", kind: "teach",
      need: 5, ropeNeed: 0, failLimit: 3, spawnMs: 1250, fall: 0.34, hookR: 0.74,
      simultaneous: 1, ghostChance: 0, ropes: false, costume: false, books: false,
      blackout: false, mirror: false,
      barker: "Slide the hoop UNDER the gold bag. It snatches when it falls through. Slow loft.",
    },
    {
      id: 2, name: "Twin Drop", kind: "twin",
      need: 6, ropeNeed: 0, failLimit: 3, spawnMs: 980, fall: 0.58, hookR: 0.6,
      simultaneous: 2, ghostChance: 0.22, ropes: false, costume: false, books: false,
      blackout: false, mirror: false,
      barker: "Two at once. CATCH gold. DUMP the pale ghost if it falls.",
    },
    {
      id: 3, name: "Ghost Counterweight", kind: "ghost",
      need: 7, ropeNeed: 0, failLimit: 3, spawnMs: 880, fall: 0.68, hookR: 0.54,
      simultaneous: 2, ghostChance: 0.34, ropes: false, costume: false, books: false,
      blackout: false, mirror: false,
      barker: "Pale bags are ghosts. LET THEM FALL. Catch gold only.",
    },
    {
      id: 4, name: "First Fly Call", kind: "rope",
      need: 6, ropeNeed: 2, failLimit: 3, spawnMs: 900, fall: 0.7, hookR: 0.52,
      simultaneous: 2, ghostChance: 0.18, ropes: true, ropeDelay: 1800, ropeWindow: 3400, ropeGap: 2400,
      costume: false, books: false, blackout: false, mirror: false,
      barker: "A rope will GLOW. Click it or press 1–4. Keep catching gold.",
    },
    {
      id: 5, name: "Blackout Call", kind: "blackout",
      need: 8, ropeNeed: 2, failLimit: 3, spawnMs: 820, fall: 0.78, hookR: 0.5,
      simultaneous: 2, ghostChance: 0.28, ropes: true, ropeDelay: 1400, ropeWindow: 2400, ropeGap: 2000,
      costume: false, books: false, blackout: true, mirror: false,
      barker: "House goes dark. Trust the ghost light. Gold tag still shines.",
    },
    {
      id: 6, name: "Quick Change", kind: "costume",
      need: 8, ropeNeed: 2, failLimit: 2, spawnMs: 760, fall: 0.84, hookR: 0.46,
      simultaneous: 2, ghostChance: 0.26, ropes: true, ropeDelay: 1300, ropeWindow: 2200, ropeGap: 1800,
      costume: true, books: true, blackout: false, mirror: false,
      barker: "Wardrobe rain. Hats and prompt books. Gold tag still means CATCH.",
    },
    {
      id: 7, name: "Mirror Wings", kind: "mirror",
      need: 8, ropeNeed: 3, failLimit: 2, spawnMs: 720, fall: 0.9, hookR: 0.44,
      simultaneous: 2, ghostChance: 0.3, ropes: true, ropeDelay: 1200, ropeWindow: 2100, ropeGap: 1700,
      costume: true, books: false, blackout: false, mirror: true,
      barker: "Wings are mirrored. The pale ring is your pointer — brass hook goes opposite.",
    },
    {
      id: 8, name: "Opening Night", kind: "boss",
      need: 10, ropeNeed: 3, failLimit: 2, spawnMs: 640, fall: 0.98, hookR: 0.42,
      simultaneous: 3, ghostChance: 0.32, ropes: true, ropeDelay: 900, ropeWindow: 1800, ropeGap: 1500,
      costume: true, books: true, blackout: true, mirror: false,
      barker: "Opening night. Three in the air. Ghosts, ropes, blackout. One house.",
    },
  ];

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Backstage Flap",
    depthUnit: "Call",
    sheet: "GOBLIN_BATCH09_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored CALLS then ENDLESS · catch gold · dump ghosts · pull the fly",
    body: "One coin. Catch gold loft-bags. Let pale ghosts hit the pit. When a fly rope glows, hit 1 2 3 4. Eight authored calls, then ENDLESS.",
    status: "Prestige run · STEP INSIDE · 1 demo coin",
    machine: "Employees only · 1 demo coin · 8 authored CALLS",
    punch: "Prestige run — STEP INSIDE or click the loft. Catch gold. Dump ghosts.",
  };

  let run = null;
  let loopRaf = 0;
  let world = null;
  let lastTick = 0;
  let bound = false;
  let toastUntil = 0;
  let input = { x: 0, y: 1.7, down: false, jab: 0 };

  function $(id) {
    return typeof PF.$ === "function" ? PF.$(id) : document.getElementById(id);
  }
  function card() { return $("passCard"); }
  function cabinetOn() {
    const node = document.getElementById("cabinet-pass");
    return !!(node && !node.hidden);
  }
  function setText(id, text) {
    const n = $(id);
    if (n) n.textContent = text;
  }
  function rk() { return PF.runKit; }
  function isLive() {
    return !!(run && run.kitRun && run.kitRun.alive !== false && !run.done && !run.dying);
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function codaParams(n) {
    const t = Math.max(0, n - AUTHORED_COUNT);
    return {
      id: n,
      name: "Call " + n,
      kind: "coda",
      coda: true,
      need: 8 + Math.min(6, t),
      ropeNeed: 2 + Math.min(3, (t / 2) | 0),
      failLimit: 2,
      spawnMs: Math.max(360, 560 - t * 14),
      fall: Math.min(1.85, 1.18 + t * 0.05),
      hookR: Math.max(0.26, 0.36 - t * 0.008),
      simultaneous: t >= 3 ? 3 : 2,
      ghostChance: Math.min(0.48, 0.28 + t * 0.02),
      ropes: true,
      ropeDelay: Math.max(700, 1100 - t * 30),
      ropeWindow: Math.max(1100, 1900 - t * 40),
      ropeGap: Math.max(900, 1500 - t * 30),
      costume: true,
      books: t >= 1,
      blackout: t % 3 === 1,
      mirror: t >= 4 && t % 2 === 0,
      barker: "ENDLESS call. The loft stays open until you miss.",
    };
  }

  function stageSpec(n) {
    if (n <= AUTHORED_COUNT) return AUTHORED[n - 1];
    return CODA_ENABLED ? codaParams(n) : null;
  }
  function liveSpec() {
    if (!run) return AUTHORED[0];
    return run.spec || stageSpec(run.stage || 1) || AUTHORED[0];
  }
  function hudLine(spec, playing) {
    if (!spec) return "CALL 0";
    if (spec.coda) return "ENDLESS · CALL " + playing + " · " + spec.name;
    return "CALL " + playing + " · " + spec.name;
  }

  function mat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color,
      roughness: 0.62,
      metalness: 0.08,
    }, extra || {}));
  }
  function mesh(geo, material, sx, sy, sz, x, y, z) {
    const m = new THREE.Mesh(geo, material);
    m.scale.set(sx, sy, sz);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function canvasTex(w, h, paint, repeat) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    paint(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    if (repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
    }
    return t;
  }

  function woodTex() {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#3a2418";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 22; i++) {
        g.fillStyle = "rgba(" + (70 + (i % 5) * 8) + "," + (42 + (i % 3) * 6) + ",24,0.35)";
        g.fillRect(i * 12, 0, 7, h);
      }
      g.fillStyle = "rgba(20,10,6,0.25)";
      for (let y = 0; y < h; y += 18) g.fillRect(0, y, w, 1);
    }, [4, 4]);
  }
  function velvetTex() {
    return canvasTex(128, 256, (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, w, 0);
      grd.addColorStop(0, "#3a0c18");
      grd.addColorStop(0.5, "#7a1a30");
      grd.addColorStop(1, "#2a0810");
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(0,0,0,0.18)";
      for (let x = 0; x < w; x += 7) g.fillRect(x, 0, 2, h);
    });
  }
  function brickTex() {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#2a1818";
      g.fillRect(0, 0, w, h);
      for (let y = 0; y < 10; y++) {
        const off = (y % 2) * 18;
        for (let x = 0; x < 8; x++) {
          g.fillStyle = y % 2 ? "#4a2a28" : "#3a2220";
          g.fillRect(x * 34 + off, y * 26, 30, 22);
          g.fillStyle = "rgba(0,0,0,0.25)";
          g.fillRect(x * 34 + off, y * 26 + 18, 30, 3);
        }
      }
    }, [2, 3]);
  }
  function backdropTex() {
    return canvasTex(512, 256, (g, w, h) => {
      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#1a1028");
      sky.addColorStop(0.55, "#3a1830");
      sky.addColorStop(1, "#120810");
      g.fillStyle = sky;
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#f0d09a";
      for (let i = 0; i < 48; i++) {
        g.globalAlpha = 0.35 + Math.random() * 0.5;
        g.fillRect((Math.random() * w) | 0, (Math.random() * h * 0.55) | 0, 2, 2);
      }
      g.globalAlpha = 1;
      g.fillStyle = "#5a2030";
      g.beginPath();
      g.moveTo(40, h);
      g.lineTo(90, 90);
      g.lineTo(150, h);
      g.fill();
      g.fillStyle = "#3a5080";
      g.beginPath();
      g.moveTo(300, h);
      g.lineTo(360, 70);
      g.lineTo(430, h);
      g.fill();
      g.fillStyle = "#d4a45a";
      g.font = "700 28px Georgia, serif";
      g.textAlign = "center";
      g.fillText("PENNY FEVER", w / 2, 48);
    });
  }
  function sackTex() {
    return canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = "#8a6238";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(40,20,8,0.28)";
      for (let i = 0; i < 10; i++) g.fillRect(i * 13, 0, 4, h);
      g.strokeStyle = "rgba(20,10,4,0.35)";
      g.lineWidth = 2;
      for (let y = 8; y < h; y += 16) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y + 6);
        g.stroke();
      }
    });
  }
  function flatTex(kind) {
    return canvasTex(256, 384, (g, w, h) => {
      g.fillStyle = "#1a1018";
      g.fillRect(0, 0, w, h);
      g.strokeStyle = "#d4a45a";
      g.lineWidth = 8;
      g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = "#f0d09a";
      g.font = "700 36px Georgia, serif";
      g.textAlign = "center";
      g.fillText(kind, w / 2, 52);
      if (kind === "TREE") {
        g.fillStyle = "#2a4a28";
        g.beginPath();
        g.moveTo(w / 2, 80);
        g.lineTo(40, h - 40);
        g.lineTo(w - 40, h - 40);
        g.fill();
        g.fillStyle = "#3a2418";
        g.fillRect(w / 2 - 12, h - 80, 24, 60);
      } else if (kind === "MOON") {
        g.fillStyle = "#f0d09a";
        g.beginPath();
        g.arc(w / 2, h * 0.52, 70, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#1a1018";
        g.beginPath();
        g.arc(w / 2 + 28, h * 0.48, 58, 0, Math.PI * 2);
        g.fill();
      } else if (kind === "CASTLE") {
        g.fillStyle = "#4a3a58";
        g.fillRect(50, 140, 156, 200);
        g.fillRect(40, 110, 40, 80);
        g.fillRect(176, 110, 40, 80);
        g.fillStyle = "#1a1018";
        g.fillRect(110, 250, 36, 90);
        g.fillStyle = "#f0d09a";
        g.beginPath();
        g.moveTo(128, 90);
        g.lineTo(148, 130);
        g.lineTo(108, 130);
        g.fill();
      } else {
        g.fillStyle = "#f0d09a";
        const cx = w / 2, cy = h * 0.5;
        g.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + i * Math.PI / 5;
          const r = i % 2 ? 38 : 88;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.closePath();
        g.fill();
      }
    });
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = mat(SKIN, { roughness: 0.45, emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const blouse = mat(BLOUSE, { roughness: 0.5 });
    const dress = mat(DRESS, { roughness: 0.48, emissive: 0x0a2010, emissiveIntensity: 0.22 });
    const hairM = mat(HAIR, { roughness: 0.7 });
    const gold = mat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const heart = mat(HEART, { emissive: HEART, emissiveIntensity: 0.7, roughness: 0.35 });
    const shoe = mat(0x111111, { metalness: 0.72, roughness: 0.22 });

    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(mesh(world.geo.cyl, blouse, 0.13, 0.28, 0.13, 0, 0.28, 0));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.13, 0.34, 14), dress);
    skirt.position.y = 0.06;
    hip.add(skirt);
    hip.add(mesh(world.geo.box, dress, 0.04, 0.22, 0.03, -0.1, 0.4, 0.08));
    hip.add(mesh(world.geo.box, dress, 0.04, 0.22, 0.03, 0.1, 0.4, 0.08));
    const heartGem = mesh(world.geo.box, heart, 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    heartGem.rotation.z = Math.PI / 4;
    hip.add(heartGem);

    const head = new THREE.Group();
    head.position.y = 0.62;
    hip.add(head);
    head.add(mesh(world.geo.sphere, skin, 0.175, 0.175, 0.175, 0, 0.02, 0));
    const eyeW = mat(0xf7f2ea);
    const eyeD = mat(0x2a1810);
    const hi = mat(0xffffff);
    [-1, 1].forEach((side) => {
      head.add(mesh(world.geo.sphere, eyeW, 0.038, 0.044, 0.02, side * 0.055, 0.03, 0.15));
      head.add(mesh(world.geo.sphere, eyeD, 0.02, 0.02, 0.02, side * 0.055, 0.03, 0.168));
      head.add(mesh(world.geo.sphere, hi, 0.01, 0.01, 0.01, side * 0.048, 0.045, 0.18));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), mat(0xc45a6a));
    smile.position.set(0, -0.05, 0.16);
    smile.rotation.x = 2.6;
    head.add(smile);
    head.add(mesh(world.geo.sphere, hairM, 0.23, 0.2, 0.23, 0, 0.06, -0.02));
    head.add(mesh(world.geo.box, hairM, 0.28, 0.07, 0.1, 0, 0.14, 0.16));
    const pigtails = [];
    [-1, 1].forEach((side) => {
      const pig = mesh(world.geo.sphere, hairM, 0.11, 0.11, 0.11, side * 0.2, -0.04, 0.04);
      head.add(pig);
      head.add(mesh(world.geo.sphere, heart, 0.045, 0.045, 0.045, side * 0.2, 0.06, 0.06));
      pigtails.push(pig);
    });
    const crown = new THREE.Group();
    crown.position.y = 0.24;
    head.add(crown);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold);
    band.rotation.x = Math.PI / 2;
    crown.add(band);
    [-0.09, 0, 0.09].forEach((x, i) => {
      const hh = i === 1 ? 0.14 : 0.09;
      const spike = mesh(world.geo.cone, gold, 0.035, hh, 0.035, x, hh * 0.45, 0);
      crown.add(spike);
    });
    const gem = mesh(world.geo.box, heart, 0.055, 0.055, 0.025, 0, 0.02, 0.11);
    gem.rotation.z = Math.PI / 4;
    crown.add(gem);

    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0.0, 0);
      const len = arm ? 0.28 : 0.34;
      const rad = arm ? 0.035 : 0.042;
      pivot.add(mesh(world.geo.cyl, arm ? skin : dress, rad, len, rad, 0, -len / 2, 0));
      if (!arm) pivot.add(mesh(world.geo.box, shoe, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03));
      else pivot.add(mesh(world.geo.sphere, skin, 0.04, 0.04, 0.04, 0, -len, 0));
      hip.add(pivot);
      return pivot;
    }
    const armL = limb(-1, true);
    const armR = limb(1, true);
    const legL = limb(-1, false);
    const legR = limb(1, false);

    g.userData = {
      hip, head, armL, armR, legL, legR, skirt, pigtails, crown, heartGem,
      lookY: 0, dip: 0, bow: 0, spin: 0, arms: 0, flash: 0, hold: 0, mood: "idle", moodT: 0,
    };
    return g;
  }

  function poseAura(node, pose, dt) {
    const u = node.userData;
    const k = 1 - Math.pow(0.001, dt / 180);
    u.lookY = lerp(u.lookY, pose.lookY || 0, k);
    u.dip = lerp(u.dip, pose.dip || 0, k);
    u.bow = lerp(u.bow, pose.bow || 0, k);
    u.arms = lerp(u.arms, pose.arms || 0, k);
    u.flash = lerp(u.flash, pose.flash || 0, k);
    u.hold = lerp(u.hold, pose.hold || 0, k);
    if (pose.spin) u.spin += pose.spin * dt * 0.012;
    else u.spin = lerp(u.spin, 0, k * 0.6);
    u.head.rotation.y = u.lookY;
    u.head.rotation.x = u.bow * 0.45 + u.dip * 0.15;
    u.hip.rotation.y = u.spin;
    u.hip.rotation.x = u.bow * 0.55;
    u.hip.position.y = 0.42 - u.dip * 0.16 - u.bow * 0.08;
    u.armL.rotation.z = 0.18 + u.arms * 1.1 + u.flash * 1.6;
    u.armR.rotation.z = -0.18 - u.arms * 1.1 - u.flash * 1.6;
    u.armL.rotation.x = u.hold * -0.9 - u.flash * 0.4;
    u.armR.rotation.x = u.hold * -0.9 - u.flash * 0.4;
    u.skirt.scale.x = 1 + Math.abs(Math.sin(u.spin * 2)) * 0.18 + u.dip * 0.08;
    u.skirt.scale.z = 1 + Math.abs(Math.sin(u.spin * 2)) * 0.12;
    if (u.pigtails) {
      const t = performance.now() * 0.006;
      u.pigtails[0].position.y = -0.04 + Math.sin(t) * 0.02;
      u.pigtails[1].position.y = -0.04 + Math.sin(t + 1.2) * 0.02;
    }
  }

  function auraPoseNow(now) {
    const u = world.aura.userData;
    if (u.mood === "cheer" && now < u.moodT) return { dip: 1, arms: 0.7, flash: 0.4 };
    if (u.mood === "flinch" && now < u.moodT) return { dip: 0.6, hold: 1, lookY: 0.4 };
    if (u.mood === "point" && now < u.moodT) return { arms: 0.9, lookY: -0.55, flash: 0.2 };
    const cycle = Math.floor(now / 2400) % 5;
    if (cycle === 0) return { lookY: 0.7 };
    if (cycle === 1) return { lookY: -0.7 };
    if (cycle === 2) return { dip: 0.85, arms: 0.4 };
    if (cycle === 3) return { hold: 0.8, arms: 0.6 };
    return { flash: 0.7 };
  }

  function setAuraMood(mood, ms) {
    if (!world || !world.aura) return;
    world.aura.userData.mood = mood;
    world.aura.userData.moodT = performance.now() + (ms || 520);
    if (typeof PF.setAura === "function") {
      PF.setAura(mood === "cheer" ? "celebrate" : mood === "flinch" ? "badLuck" : "point");
    }
  }

  function makeHook() {
    const g = new THREE.Group();
    const brass = mat(BRASS, { metalness: 0.78, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.35 });
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.028, 10, 22), brass);
    hoop.rotation.x = Math.PI / 2;
    g.add(hoop);
    const pole = mesh(world.geo.cyl, brass, 0.018, 1.15, 0.018, 0.12, -0.55, 0.35);
    pole.rotation.x = 0.55;
    pole.rotation.z = -0.25;
    g.add(pole);
    const net = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 16),
      new THREE.MeshBasicMaterial({ color: 0xf0d09a, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
    );
    net.rotation.x = Math.PI / 2;
    g.add(net);
    const glow = new THREE.PointLight(0xffe2a0, 0.4, 2.4, 2);
    glow.position.set(0, 0, 0.05);
    g.add(glow);
    g.userData = { hoop, net, glow, brass };
    return g;
  }

  function makeGhostHook() {
    const g = new THREE.Group();
    const hoop = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.02, 8, 18),
      new THREE.MeshBasicMaterial({ color: 0xa8d8e8, transparent: true, opacity: 0.45, depthWrite: false })
    );
    hoop.rotation.x = Math.PI / 2;
    g.add(hoop);
    g.visible = false;
    return g;
  }

  function labelTex(word, dump) {
    return canvasTex(256, 80, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = dump ? "rgba(12, 28, 36, 0.92)" : "rgba(42, 22, 8, 0.92)";
      g.beginPath();
      g.moveTo(18, 12);
      g.arcTo(w - 12, 12, w - 12, h - 12, 16);
      g.arcTo(w - 12, h - 12, 12, h - 12, 16);
      g.arcTo(12, h - 12, 12, 12, 16);
      g.arcTo(12, 12, w - 12, 12, 16);
      g.closePath();
      g.fill();
      g.strokeStyle = dump ? "#7ad4d0" : "#f0d09a";
      g.lineWidth = 6;
      g.stroke();
      g.fillStyle = dump ? "#c8e8f0" : "#ffe6a6";
      g.font = "700 42px Georgia, serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(word, w / 2, h / 2 + 2);
    });
  }

  function bagLabel(tex) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    s.scale.set(0.92, 0.3, 1);
    s.position.y = 0.48;
    s.renderOrder = 10;
    s.visible = false;
    return s;
  }

  function makeDrop() {
    const g = new THREE.Group();
    const sackM = mat(0xb8893a, { map: world.sackMap, roughness: 0.48, metalness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.42 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), sackM);
    body.scale.set(1, 1.18, 1);
    g.add(body);
    const cinch = mesh(world.geo.sphere, mat(0x5a3a20), 0.09, 0.06, 0.09, 0, 0.22, 0);
    g.add(cinch);
    const tag = mesh(world.geo.box, mat(GOLD, { emissive: GOLD, emissiveIntensity: 1.15, metalness: 0.55 }), 0.11, 0.14, 0.02, 0.2, 0.04, 0.1);
    g.add(tag);
    const hat = mesh(world.geo.cone, mat(0xc41e3a, { roughness: 0.45, emissive: 0x4a1008, emissiveIntensity: 0.25 }), 0.14, 0.2, 0.14, 0, 0.08, 0);
    hat.visible = false;
    g.add(hat);
    const brim = mesh(world.geo.cyl, mat(0x8a1428), 0.18, 0.03, 0.18, 0, -0.02, 0);
    brim.visible = false;
    g.add(brim);
    const book = mesh(world.geo.box, mat(0x5a2030), 0.16, 0.04, 0.22, 0, 0, 0);
    book.visible = false;
    g.add(book);
    const ribbon = mesh(world.geo.box, mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.8 }), 0.03, 0.14, 0.012, 0, 0.08, 0.14);
    g.add(ribbon);
    const catchLbl = bagLabel(world.catchTex);
    const dumpLbl = bagLabel(world.dumpTex);
    g.add(catchLbl, dumpLbl);
    g.visible = false;
    g.userData = { body, cinch, tag, hat, brim, book, ribbon, sackM, catchLbl, dumpLbl, kind: "bag", ghost: false };
    return g;
  }

  function skinDrop(d, ghost, visual) {
    const u = d.mesh.userData;
    u.ghost = ghost;
    u.kind = visual;
    u.body.visible = visual === "bag";
    u.cinch.visible = visual === "bag";
    u.hat.visible = visual === "hat";
    if (u.brim) u.brim.visible = visual === "hat";
    u.book.visible = visual === "book";
    u.tag.visible = !ghost;
    u.ribbon.visible = !ghost;
    if (u.catchLbl) u.catchLbl.visible = !ghost;
    if (u.dumpLbl) u.dumpLbl.visible = !!ghost;
    if (ghost) {
      u.body.material = mat(0x6a90a8, { transparent: true, opacity: 0.38, emissive: 0x3a88a8, emissiveIntensity: 0.7, depthWrite: false });
      u.cinch.material = mat(0x4a7088, { transparent: true, opacity: 0.36, depthWrite: false });
      u.hat.material = mat(0x6a90a8, { transparent: true, opacity: 0.38, emissive: 0x3a88a8, emissiveIntensity: 0.5, depthWrite: false });
      u.book.material = mat(0x4a6880, { transparent: true, opacity: 0.38, depthWrite: false });
    } else {
      u.body.material = u.sackM;
      u.cinch.material = mat(0x5a3a20);
      u.hat.material = mat(visual === "hat" ? 0xc41e3a : 0x1e6b3c, { roughness: 0.45, emissive: 0x6a4808, emissiveIntensity: 0.2 });
      u.book.material = mat(0x5a2030, { emissive: 0x6a4808, emissiveIntensity: 0.18 });
    }
  }

  function makeRope(i) {
    const meta = ROPE_META[i];
    const g = new THREE.Group();
    const col = mat(meta.color, { roughness: 0.5, emissive: meta.color, emissiveIntensity: 0.22 });
    const cord = mesh(world.geo.cyl, col, 0.038, 3.5, 0.038, 0, 2.1, 0);
    g.add(cord);
    const handle = mesh(world.geo.cyl, mat(0x2a1810, { roughness: 0.55 }), 0.07, 0.28, 0.07, 0, 0.52, 0);
    g.add(handle);
    const knob = mesh(world.geo.sphere, mat(BRASS, { metalness: 0.72, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.4 }), 0.09, 0.09, 0.09, 0, 0.34, 0);
    g.add(knob);
    const badgeTex = canvasTex(256, 256, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(12,6,9,0.92)";
      ctx.beginPath();
      ctx.arc(128, 118, 108, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f0d09a";
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.fillStyle = "#fff6ec";
      ctx.font = "700 110px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.key, 128, 108);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "700 36px Georgia, serif";
      ctx.fillText(meta.name, 128, 196);
    });
    const badge = new THREE.Mesh(
      new THREE.CircleGeometry(0.28, 20),
      new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true, depthTest: false })
    );
    badge.position.set(0.08, 0.72, 0.22);
    badge.renderOrder = 6;
    g.add(badge);
    const glow = new THREE.PointLight(meta.color, 0.35, 3.6, 2);
    glow.position.set(0, 1.1, 0.2);
    g.add(glow);
    g.userData = { cord, handle, knob, badge, glow, idx: i, hot: 0, pull: 0 };
    g.position.set(-2.08, 0, 1.28 - i * 0.32);
    return g;
  }

  function makeBatten(i) {
    const meta = ROPE_META[i];
    const g = new THREE.Group();
    const bar = mesh(world.geo.cyl, mat(WOOD, { roughness: 0.7 }), 0.04, 1.8, 0.04, 0, 0, 0);
    bar.rotation.z = Math.PI / 2;
    g.add(bar);
    const flat = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 1.7),
      new THREE.MeshStandardMaterial({ map: flatTex(meta.name), roughness: 0.72, metalness: 0.05 })
    );
    flat.position.y = -0.85;
    g.add(flat);
    g.position.set(-1.15 + i * 0.78, 4.35, -2.35);
    g.userData = { yUp: 4.35, yDown: 1.72, want: 4.35 };
    return g;
  }

  function makeDust() {
    const n = 90;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = Math.random() * 3.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xf0d09a,
      size: 0.035,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    pts.userData.pos = pos;
    return pts;
  }

  function buildStage() {
    const root = new THREE.Group();
    const wood = mat(WOOD, { map: woodTex(), roughness: 0.78 });
    const velvet = mat(VELVET, { map: velvetTex(), roughness: 0.86 });
    const brass = mat(GOLD, { metalness: 0.7, roughness: 0.32, emissive: 0x4a3008, emissiveIntensity: 0.25 });
    const brick = mat(0x3a2428, { map: brickTex(), roughness: 0.9 });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), wood);
    floor.rotation.x = -Math.PI / 2;
    root.add(floor);
    root.add(mesh(world.geo.box, wood, 6.6, 0.24, 3.6, 0, 0.12, -1.2));
    root.add(mesh(world.geo.box, brass, 6.7, 0.06, 0.12, 0, 0.26, 0.58));

    const pit = mesh(world.geo.box, mat(0x12080c, { roughness: 0.9 }), 6.4, 0.5, 1.4, 0, -0.18, 1.15);
    root.add(pit);

    const back = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3.8), new THREE.MeshBasicMaterial({ map: backdropTex() }));
    back.position.set(0, 2.15, -2.85);
    root.add(back);
    root.add(mesh(world.geo.box, brick, 0.32, 4.4, 6.4, -4.2, 2.2, -0.4));
    root.add(mesh(world.geo.box, brick, 0.32, 4.4, 6.4, 4.2, 2.2, -0.4));
    root.add(mesh(world.geo.box, wood, 8.6, 0.2, 6.8, 0, 4.35, -0.5));

    const curtains = { left: [], right: [], open: 0.22 };
    for (let i = 0; i < 8; i++) {
      const L = mesh(world.geo.box, velvet, 0.42, 3.7, 0.08, -3.4, 2.1, 0.95);
      const R = mesh(world.geo.box, velvet, 0.42, 3.7, 0.08, 3.4, 2.1, 0.95);
      L.userData.baseX = -3.4;
      R.userData.baseX = 3.4;
      L.userData.i = i;
      R.userData.i = i;
      curtains.left.push(L);
      curtains.right.push(R);
      root.add(L, R);
    }
    root.add(mesh(world.geo.box, velvet, 7.6, 0.55, 0.16, 0, 3.78, 1.0));

    for (let i = 0; i < 7; i++) {
      const x = -2.4 + i * 0.8;
      const lamp = mesh(world.geo.box, mat(0xffe2a0, { emissive: 0xffc878, emissiveIntensity: 1.15 }), 0.16, 0.08, 0.22, x, 0.32, 0.62);
      root.add(lamp);
    }

    const rack = new THREE.Group();
    rack.position.set(2.65, 0.2, 0.05);
    rack.add(mesh(world.geo.cyl, brass, 0.03, 1.6, 0.03, 0, 1.2, 0));
    rack.add(mesh(world.geo.cyl, brass, 0.03, 1.6, 0.03, 0.7, 1.2, 0));
    const bar = mesh(world.geo.cyl, brass, 0.025, 0.8, 0.025, 0.35, 1.95, 0);
    bar.rotation.z = Math.PI / 2;
    rack.add(bar);
    [0x1e6b3c, 0x5a1424, 0xd4a45a, 0x3a5080].forEach((col, i) => {
      rack.add(mesh(world.geo.box, mat(col, { roughness: 0.55 }), 0.22, 0.7, 0.08, 0.12 + i * 0.16, 1.45, 0));
    });
    root.add(rack);

    root.add(mesh(world.geo.box, mat(0x4a2a14), 0.7, 0.38, 0.42, -2.15, 0.38, 0.55));
    root.add(mesh(world.geo.box, brass, 0.72, 0.04, 0.08, -2.15, 0.58, 0.55));

    root.add(mesh(world.geo.box, wood, 1.55, 0.12, 0.72, 1.15, 0.78, 3.05));
    root.add(mesh(world.geo.cyl, wood, 0.05, 0.78, 0.05, 0.55, 0.39, 2.9));
    root.add(mesh(world.geo.cyl, wood, 0.05, 0.78, 0.05, 1.65, 0.39, 2.9));
    root.add(mesh(world.geo.cyl, brass, 0.03, 0.28, 0.05, 1.55, 1.02, 2.95));
    root.add(mesh(world.geo.cyl, mat(0xf0d09a, { emissive: 0xf0d09a, emissiveIntensity: 0.8, transparent: true, opacity: 0.7 }), 0.12, 0.12, 0.16, 1.55, 1.2, 2.95));
    root.add(mesh(world.geo.box, mat(0x5a2030), 0.42, 0.04, 0.28, 0.9, 0.88, 3.02));

    const signTex = canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = "#1a0c10";
      g.fillRect(0, 0, w, h);
      g.strokeStyle = "#d4a45a";
      g.lineWidth = 8;
      g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = "#f0d09a";
      g.font = "700 26px Georgia, serif";
      g.textAlign = "center";
      g.fillText("EMPLOYEES ONLY", w / 2, 58);
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 0.55), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(-2.55, 2.62, 0.85);
    root.add(sign);

    for (let i = 0; i < 6; i++) {
      root.add(mesh(world.geo.cyl, mat(0x2a1810), 0.012, 2.5, 0.012, -2.2 + i * 0.85, 3.0, -2.45));
      root.add(mesh(world.geo.box, mat(0x3a2420), 0.14, 0.2, 0.14, -2.2 + i * 0.85, 1.7, -2.45));
    }

    const ghostLight = mesh(world.geo.cyl, mat(0xfff1c8, { emissive: 0xffe2a0, emissiveIntensity: 1.4 }), 0.05, 0.16, 0.05, -1.55, 1.05, 0.55);
    const stand = mesh(world.geo.cyl, mat(0x222222, { metalness: 0.6 }), 0.03, 0.9, 0.04, -1.55, 0.55, 0.55);
    root.add(ghostLight, stand);

    const boardCanvas = document.createElement("canvas");
    boardCanvas.width = 512;
    boardCanvas.height = 160;
    const boardTex = new THREE.CanvasTexture(boardCanvas);
    boardTex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.75),
      new THREE.MeshBasicMaterial({ map: boardTex })
    );
    board.position.set(0, 3.42, -2.55);
    root.add(board);

    const catchPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 3.6),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    );
    catchPlane.position.set(0, 1.75, 0.52);
    root.add(catchPlane);

    world.curtains = curtains;
    world.rack = rack;
    world.ghostLight = ghostLight;
    world.stageRoot = root;
    world.catchPlane = catchPlane;
    world.boardCanvas = boardCanvas;
    world.boardTex = boardTex;
    world.board = board;
    return root;
  }

  function paintBoard(title, sub) {
    if (!world || !world.boardCanvas) return;
    const c = world.boardCanvas;
    const g = c.getContext("2d");
    const w = c.width, h = c.height;
    g.fillStyle = "#12080c";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#d4a45a";
    g.lineWidth = 8;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = "#f0d09a";
    g.font = "700 36px Georgia, serif";
    g.textAlign = "center";
    g.fillText(title || "EMPLOYEES ONLY", w / 2, 70);
    g.fillStyle = "#e8a0b8";
    g.font = "22px Georgia, serif";
    g.fillText(sub || "the loft is watching", w / 2, 118);
    world.boardTex.needsUpdate = true;
  }

  function initWorld() {
    if (world && world.renderer) return world;
    const canvas = $("passCanvas");
    if (!canvas) return null;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !REDUCE, alpha: false, powerPreference: "high-performance" });
    } catch (err) {
      setText("passStatus", "This tent needs WebGL.");
      return null;
    }
    renderer.setPixelRatio(Math.min(REDUCE ? 1.25 : 2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0x0a0408, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x12080c, 0.042);
    const camera = new THREE.PerspectiveCamera(56, 16 / 10, 0.1, 60);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    camera.position.set(0.4, 2.2, 6.85);

    world = {
      renderer, scene, camera, canvas,
      geo: {
        box: new THREE.BoxGeometry(1, 1, 1),
        sphere: new THREE.SphereGeometry(1, 14, 10),
        cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
        cone: new THREE.ConeGeometry(1, 1, 8),
      },
      lights: {},
      bits: [],
      drops: [],
      ropes: [],
      battens: [],
      kick: 0,
      punch: 0,
      flash: 0,
      openWant: 0.28,
      look: new THREE.Vector3(0, 1.2, -1.15),
      ray: new THREE.Raycaster(),
      ptr: new THREE.Vector2(),
      sackMap: sackTex(),
      catchTex: labelTex("CATCH", false),
      dumpTex: labelTex("DUMP", true),
    };

    scene.add(new THREE.AmbientLight(0x3a2428, 0.42));
    scene.add(new THREE.HemisphereLight(0xc4a080, 0x1a0810, 0.55));
    const key = new THREE.DirectionalLight(0xffd0a0, 0.55);
    key.position.set(2.2, 5.4, 3.2);
    scene.add(key);
    const spot = new THREE.SpotLight(0xffe2b0, 4.2, 14, 0.42, 0.45, 1.2);
    spot.position.set(0.2, 4.4, 2.2);
    spot.target.position.set(0, 1.1, -1.2);
    scene.add(spot);
    scene.add(spot.target);
    const foot = new THREE.PointLight(0xffc878, 2.1, 6.5, 1.6);
    foot.position.set(0, 0.55, 0.7);
    scene.add(foot);
    const deskLamp = new THREE.PointLight(0xf0d09a, 1.4, 4.2, 2);
    deskLamp.position.set(1.55, 1.25, 2.95);
    scene.add(deskLamp);
    const flashLight = new THREE.PointLight(0xfff1c8, 0, 8, 1.4);
    flashLight.position.set(0, 1.5, 0.3);
    scene.add(flashLight);
    world.lights = { spot, foot, flashLight, key, deskLamp };

    scene.add(buildStage());
    world.aura = makeAura();
    world.aura.position.set(0, 0.24, -1.35);
    world.aura.rotation.y = Math.PI;
    world.aura.scale.setScalar(1.18);
    scene.add(world.aura);
    world.hook = makeHook();
    world.hook.position.set(0, 1.7, 0.52);
    scene.add(world.hook);
    world.ghostHook = makeGhostHook();
    world.ghostHook.position.set(0, 1.7, 0.52);
    scene.add(world.ghostHook);
    world.dust = makeDust();
    scene.add(world.dust);
    world.bitGroup = new THREE.Group();
    scene.add(world.bitGroup);
    world.dropGroup = new THREE.Group();
    scene.add(world.dropGroup);

    for (let i = 0; i < 4; i++) {
      const rope = makeRope(i);
      world.ropes.push(rope);
      scene.add(rope);
      const bat = makeBatten(i);
      world.battens.push(bat);
      scene.add(bat);
    }
    for (let i = 0; i < 12; i++) {
      const m = makeDrop();
      world.dropGroup.add(m);
      world.drops.push({
        mesh: m, live: false, ghost: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, spin: 0,
      });
    }

    paintBoard("EMPLOYEES ONLY", "catch gold · dump ghosts · pull the fly");
    fitRenderer();
    return world;
  }

  function fitRenderer() {
    if (!world || !world.renderer || !world.canvas) return;
    const w = Math.max(16, world.canvas.clientWidth || window.innerWidth || 720);
    const h = Math.max(16, world.canvas.clientHeight || window.innerHeight || 480);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function setCurtains(open) {
    if (!world) return;
    world.openWant = open;
  }
  function tickCurtains(dt) {
    const c = world.curtains;
    c.open = lerp(c.open, world.openWant, 1 - Math.pow(0.001, dt / 280));
    c.left.forEach((m) => {
      m.position.x = m.userData.baseX - c.open * 1.6 - m.userData.i * 0.04;
      m.rotation.y = 0.08 + c.open * 0.15;
    });
    c.right.forEach((m) => {
      m.position.x = m.userData.baseX + c.open * 1.6 + m.userData.i * 0.04;
      m.rotation.y = -0.08 - c.open * 0.15;
    });
  }

  function spawnBits(kind, origin) {
    if (!world) return;
    const n = kind === "miss" ? 10 : 16;
    const col = kind === "miss" ? 0xc41e3a : (kind === "ghost" ? 0x7ad4d0 : (kind === "rope" ? 0xe8b84a : 0xf0d09a));
    for (let i = 0; i < n; i++) {
      const m = mesh(world.geo.box, mat(col, { emissive: col, emissiveIntensity: 0.85 }), 0.05, 0.05, 0.05, origin.x, origin.y, origin.z);
      world.bitGroup.add(m);
      world.bits.push({
        mesh: m,
        vx: (Math.random() - 0.5) * 0.012,
        vy: 0.006 + Math.random() * 0.01,
        vz: (Math.random() - 0.5) * 0.01,
        life: 420 + Math.random() * 280,
      });
    }
  }
  function tickBits(dt) {
    world.bits = world.bits.filter((b) => {
      b.life -= dt;
      b.vy -= 0.000028 * dt;
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.position.z += b.vz * dt;
      b.mesh.rotation.x += dt * 0.01;
      b.mesh.rotation.y += dt * 0.012;
      if (b.life <= 0) {
        world.bitGroup.remove(b.mesh);
        return false;
      }
      return true;
    });
  }

  function freeDrop() {
    return world.drops.find((d) => !d.live);
  }
  function liveKeepCount() {
    return world.drops.filter((d) => d.live && !d.ghost).length;
  }

  function spawnDrop(now, idle) {
    const spec = liveSpec();
    const slot = freeDrop();
    if (!slot) return;
    const ghost = !idle && spec.ghostChance > 0 && Math.random() < spec.ghostChance;
    let visual = "bag";
    if (!ghost && spec.costume && Math.random() < 0.45) visual = "hat";
    else if (!ghost && spec.books && Math.random() < 0.35) visual = "book";
    else if (ghost && spec.costume && Math.random() < 0.4) visual = "hat";
    skinDrop(slot, ghost, visual);
    slot.live = true;
    slot.ghost = ghost;
    const teach = !idle && spec && spec.kind === "teach";
    slot.x = teach ? (Math.random() * 1.5) - 0.75 : (Math.random() * 3.2) - 1.6;
    slot.y = 2.7 + Math.random() * 0.28;
    slot.z = 0.48 + (Math.random() - 0.5) * 0.16;
    slot.vx = (Math.random() - 0.5) * 0.35;
    slot.vy = -0.15;
    slot.vz = 0;
    slot.spin = (Math.random() - 0.5) * 4;
    slot.mesh.visible = true;
    slot.mesh.position.set(slot.x, slot.y, slot.z);
    slot.idle = !!idle;
  }

  function recycleDrop(d) {
    d.live = false;
    d.mesh.visible = false;
  }

  function hookRadius() {
    const spec = liveSpec();
    return (spec && spec.hookR) || 0.44;
  }

  function hookPos() {
    return world.hook.position;
  }

  function aimPoint() {
    const spec = liveSpec();
    const mirror = !!(spec && spec.mirror && isLive());
    const x = clamp(input.x, -2.35, 2.35);
    return {
      x: mirror ? -x : x,
      y: clamp(input.y, 0.55, 3.2),
      z: 0.52,
    };
  }

  function tryCatch() {
    if (!world) return false;
    const live = isLive();
    const hp = hookPos();
    const ap = aimPoint();
    const r = hookRadius() * (input.jab > 0.3 ? 1.28 : 1);
    let n = 0;
    world.drops.forEach((d) => {
      if (!d.live) return;
      const dx = d.x - ap.x;
      const dy = d.y - ap.y;
      const hx = d.x - hp.x;
      const hy = d.y - hp.y;
      const nearAim = dx * dx + dy * dy <= r * r;
      const nearHook = hx * hx + hy * hy <= r * r;
      if (!nearAim && !nearHook) return;
      if (Math.abs(d.z - ap.z) > 0.9 && Math.abs(d.z - hp.z) > 0.9) return;
      if (d.idle) {
        recycleDrop(d);
        spawnBits("hit", { x: d.x, y: d.y, z: d.z });
        n += 1;
        return;
      }
      if (!live) return;
      if (d.ghost) {
        recycleDrop(d);
        miss("ghost");
        n += 1;
        return;
      }
      recycleDrop(d);
      hitCatch(d);
      n += 1;
    });
    return n > 0;
  }

  function hitCatch(d) {
    run.hits += 1;
    run.combo = (run.combo | 0) + 1;
    const bonus = Math.min(80, run.combo * 12);
    run.score += CATCH_SCORE + bonus;
    if (run.kitRun) run.kitRun.score = run.score;
    world.flash = 36;
    world.kick = 0.02;
    spawnBits("hit", { x: d.x, y: d.y, z: d.z });
    flashScreen("hit");
    sfx("hit");
    setAuraMood("cheer", 480);
    const spec = liveSpec();
    setText("passStatus", "Caught " + run.hits + "/" + spec.need + (spec.ropeNeed ? " · ropes " + run.ropesPulled + "/" + spec.ropeNeed : "") + " · " + spec.name);
    stampDepthCopy();
    paintPlayHud();
    maybeClear();
  }

  function ghostPit(d) {
    run.score += GHOST_PIT;
    if (run.kitRun) run.kitRun.score = run.score;
    spawnBits("ghost", { x: d.x, y: 0.4, z: d.z });
    sfx("drop");
  }

  function miss(reason) {
    if (!isLive()) return;
    const spec = liveSpec();
    run.fails += 1;
    run.combo = 0;
    if (run.kitRun && rk() && typeof rk().reportStrike === "function") {
      try { rk().reportStrike(run.kitRun, reason); } catch (_) {}
    }
    world.kick = 0.08;
    world.flash = 22;
    spawnBits(reason === "ghost" ? "ghost" : "miss", world.aura.position);
    flashScreen(reason === "ghost" ? "ghost" : "miss");
    sfx("miss");
    paintPips();
    const line = reason === "ghost" ? AURA.ghost : reason === "rope" ? AURA.rope : reason === "expire" ? AURA.expire : AURA.miss;
    setText("passStatus", line);
    setAuraMood("flinch", 640);
    showToast(reason === "ghost" ? "GHOST BAG" : reason === "rope" || reason === "expire" ? "FLY MISS" : "STAGE HIT", line, 900);
    if (run.fails >= (spec.failLimit || 3)) finish(reason === "ghost" ? "ghost" : (reason === "expire" ? "expire" : (reason === "rope" ? "rope" : "miss")));
  }

  function maybeClear() {
    const spec = liveSpec();
    if (run.hits >= spec.need && run.ropesPulled >= (spec.ropeNeed || 0)) clearStage();
  }

  function startRopeCall(now) {
    const spec = liveSpec();
    if (!spec.ropes) return;
    const idx = (Math.random() * 4) | 0;
    run.rope = {
      idx,
      until: now + (spec.ropeWindow || 2200),
      resolved: false,
    };
    const meta = ROPE_META[idx];
    setText("passRopeCall", meta.key + " · " + meta.name);
    const chip = $("passRopeChip");
    if (chip) chip.setAttribute("data-hot", "on");
    paintBoard("PULL  " + meta.name, "key " + meta.key + "  or click the glowing rope");
    showToast("FLY CALL · " + meta.name, "Hit " + meta.key + " — " + meta.name, 900);
    setAuraMood("point", 700);
    sfx("rack");
    world.flash = 28;
    paintFlyKeys();
  }

  function pullRope(idx) {
    if (!isLive()) {
      start();
      return;
    }
    const spec = liveSpec();
    if (!spec.ropes || !run.rope || run.rope.resolved) {
      if (isLive()) showToast("FLY RAIL", "Wait for a rope to GLOW — then 1 2 3 4", 720);
      return;
    }
    if (run.rope.idx !== idx) {
      run.rope.resolved = true;
      run.rope = null;
      miss("rope");
      coolRopes();
      return;
    }
    run.rope.resolved = true;
    run.rope = null;
    run.ropesPulled += 1;
    run.score += ROPE_SCORE;
    if (run.kitRun) run.kitRun.score = run.score;
    const bat = world.battens[idx];
    if (bat) bat.userData.want = bat.userData.yDown;
    const rope = world.ropes[idx];
    if (rope) rope.userData.pull = 1;
    spawnBits("rope", rope ? rope.position : world.aura.position);
    flashScreen("rope");
    sfx("flash");
    setAuraMood("cheer", 500);
    coolRopes();
    paintBoard(ROPE_META[idx].name + " IN", "keep the loft honest");
    setText("passStatus", "Fly in · " + run.ropesPulled + "/" + spec.ropeNeed + " · " + spec.name);
    paintPlayHud();
    run.nextRopeAt = performance.now() + (spec.ropeGap || 1800);
    maybeClear();
  }

  function coolRopes() {
    const chip = $("passRopeChip");
    if (chip) chip.setAttribute("data-hot", "off");
    setText("passRopeCall", "—");
    paintFlyKeys();
  }

  function paintFlyKeys() {
    const spec = liveSpec();
    const live = isLive();
    const hot = live && run && run.rope && !run.rope.resolved ? run.rope.idx : -1;
    const railOn = !!(live && spec && spec.ropes);
    document.querySelectorAll(".pass-flykey").forEach((btn) => {
      const i = +(btn.getAttribute("data-rope"));
      btn.classList.toggle("is-hot", i === hot);
      btn.classList.toggle("is-live", railOn);
    });
  }

  function clearStage() {
    run.score += CLEAR_BONUS;
    run.depth = run.stage;
    if (run.kitRun) {
      run.kitRun.depth = run.depth;
      run.kitRun.score = run.score;
    }
    const spec = liveSpec();
    tellDepth(run.depth, spec);
    sfx("clear");
    spawnBits("hit", world.aura.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
    setAuraMood("cheer", 900);
    world.battens.forEach((b) => { b.userData.want = b.userData.yUp; });
    const next = stageSpec(run.stage + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    if (run.stage === AUTHORED_COUNT && next.coda) {
      setText("passStatus", AURA.coda);
      if (typeof PF.showBanner === "function") PF.showBanner(true, "ENDLESS", "The house stays open");
      showToast("ENDLESS", "The loft stays open", 1200);
    } else {
      setText("passStatus", AURA.clear + " " + next.name);
      showToast(next.name, next.barker, 1100);
    }
    startStage(run.stage + 1);
  }

  function tickDrops(dt, now) {
    const spec = liveSpec();
    const g = 5.6 * ((spec && spec.fall) || 0.85);
    const live = isLive();
    world.drops.forEach((d) => {
      if (!d.live) return;
      d.vy -= g * (dt / 1000);
      d.x += d.vx * (dt / 1000);
      d.y += d.vy * (dt / 1000);
      d.z += d.vz * (dt / 1000);
      d.mesh.position.set(d.x, d.y, d.z);
      d.mesh.rotation.z += d.spin * (dt / 1000);
      d.mesh.rotation.x += dt * 0.002;
      const ud = d.mesh.userData;
      const pulse = 1 + Math.sin(now * 0.012 + d.x) * 0.08;
      if (ud.catchLbl && ud.catchLbl.visible) ud.catchLbl.scale.set(0.92 * pulse, 0.3 * pulse, 1);
      if (ud.dumpLbl && ud.dumpLbl.visible) ud.dumpLbl.scale.set(0.92 * pulse, 0.3 * pulse, 1);
      if (d.y < 0.38) {
        if (d.idle) {
          recycleDrop(d);
          return;
        }
        if (live) {
          if (d.ghost) ghostPit(d);
          else miss("miss");
        }
        recycleDrop(d);
      }
    });
    if (live || (world.drops.some((d) => d.live && d.idle))) tryCatch();
    if (live) {
      if (now >= run.nextSpawnAt && liveKeepCount() < (spec.simultaneous || 1)) {
        spawnDrop(now, false);
        run.nextSpawnAt = now + (spec.spawnMs || 800);
      }
      if (spec.ropes && run.ropesPulled < (spec.ropeNeed || 0)) {
        if (!run.rope && now >= run.nextRopeAt) startRopeCall(now);
        if (run.rope && !run.rope.resolved && now > run.rope.until) {
          run.rope.resolved = true;
          run.rope = null;
          miss("expire");
          coolRopes();
          run.nextRopeAt = now + (spec.ropeGap || 1800);
        }
      }
    } else if (!run || run.done) {
      const idleLive = world.drops.filter((d) => d.live).length;
      if (idleLive < 2 && now % 1400 < dt + 16) spawnDrop(now, true);
    }
  }

  function tickRopes(dt) {
    world.ropes.forEach((r, i) => {
      const hot = !!(run && run.rope && !run.rope.resolved && run.rope.idx === i);
      r.userData.hot = lerp(r.userData.hot, hot ? 1 : 0, 0.14);
      r.userData.pull = lerp(r.userData.pull, 0, 0.08);
      r.position.y = -r.userData.pull * 0.18;
      const pulse = 0.12 + r.userData.hot * (0.7 + Math.sin(performance.now() * 0.012) * 0.45);
      r.userData.glow.intensity = pulse * 3.2;
      r.userData.cord.material.emissiveIntensity = 0.12 + r.userData.hot * 0.85;
      r.userData.badge.scale.setScalar(1 + r.userData.hot * 0.42);
      r.userData.badge.lookAt(world.camera.position);
    });
    world.battens.forEach((b) => {
      b.position.y = lerp(b.position.y, b.userData.want, 0.08);
    });
  }

  function tickHook(dt) {
    const spec = liveSpec();
    const mirror = !!(spec && spec.mirror && isLive());
    const tx = clamp(input.x, -2.35, 2.35);
    const ty = clamp(input.y, 0.55, 3.2);
    const hx = mirror ? -tx : tx;
    world.hook.position.x = lerp(world.hook.position.x, hx, 0.48);
    world.hook.position.y = lerp(world.hook.position.y, ty, 0.48);
    world.hook.position.z = 0.52;
    input.jab = Math.max(0, input.jab - dt * 0.008);
    const jab = input.jab;
    world.hook.scale.setScalar(1 + jab * 0.18);
    world.hook.userData.glow.intensity = 0.35 + jab * 1.8 + (input.down ? 0.5 : 0);
    world.hook.rotation.z = Math.sin(performance.now() * 0.004) * 0.04;
    world.ghostHook.visible = mirror;
    if (mirror) {
      world.ghostHook.position.x = lerp(world.ghostHook.position.x, tx, 0.28);
      world.ghostHook.position.y = lerp(world.ghostHook.position.y, ty, 0.28);
      world.ghostHook.position.z = 0.52;
    }
  }

  function applyLights(spec, now, flashAmt) {
    const L = world.lights;
    const black = !!(spec && spec.blackout && isLive());
    world.scene.children.forEach((ch) => {
      if (ch.isAmbientLight) ch.intensity = lerp(ch.intensity, black ? 0.1 : 0.42, 0.12);
    });
    L.foot.intensity = black ? 0.4 : 2.1 + Math.sin(now * 0.004) * 0.25 + flashAmt * 6;
    L.spot.intensity = black ? 0.7 : 4.2 + flashAmt * 5;
    L.flashLight.intensity = flashAmt * 3.2;
    world.renderer.toneMappingExposure = (black ? 0.72 : 1.08) + flashAmt * 0.18;
    if (world.ghostLight) {
      world.ghostLight.material.emissiveIntensity = black ? 2.4 : 1.1 + Math.sin(now * 0.008) * 0.3;
    }
    world.scene.fog.density = black ? 0.08 : 0.042;
  }

  function cameraWork(now) {
    const cam = world.camera;
    const t = now * 0.0007;
    const play = isLive();
    const dying = run && run.dying;
    let x = play ? -0.22 : 0.35;
    let y = play ? 1.58 : 1.62;
    let z = play ? 4.05 : 4.55;
    if (!REDUCE) {
      x += Math.sin(t) * (play ? 0.06 : 0.14);
      y += Math.cos(t * 0.7) * 0.04;
    }
    if (world.kick) {
      x += (Math.random() - 0.5) * world.kick;
      y += (Math.random() - 0.5) * world.kick * 0.5;
      world.kick *= 0.84;
      if (world.kick < 0.004) world.kick = 0;
    }
    if (dying) {
      z = lerp(cam.position.z, 5.15, 0.08);
      y = lerp(cam.position.y, 1.85, 0.08);
    }
    cam.position.x = lerp(cam.position.x, x, 0.08);
    cam.position.y = lerp(cam.position.y, y, 0.08);
    cam.position.z = lerp(cam.position.z, z, 0.08);
    world.look.set(0, 1.22, -1.15);
    cam.lookAt(world.look);
  }

  function tickDust(now) {
    const pos = world.dust.userData.pos;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] += 0.00035 + Math.sin(now * 0.001 + i) * 0.00015;
      if (pos[i + 1] > 3.6) pos[i + 1] = 0.1;
    }
    world.dust.geometry.attributes.position.needsUpdate = true;
  }

  function hideToastIfDue(now) {
    if (!toastUntil) return;
    if (now >= toastUntil) {
      toastUntil = 0;
      const node = $("passToast");
      if (node) node.hidden = true;
    }
  }
  function showToast(title, sub, ms) {
    const node = $("passToast");
    if (!node) return;
    node.hidden = false;
    node.innerHTML = title + (sub ? "<small>" + sub + "</small>" : "");
    toastUntil = performance.now() + (ms || 1100);
  }

  function flashScreen(kind) {
    const el = $("passFlash");
    if (!el) return;
    el.classList.remove("is-on", "is-miss", "is-ghost", "is-rope");
    void el.offsetWidth;
    el.classList.add(kind === "miss" ? "is-miss" : kind === "ghost" ? "is-ghost" : kind === "rope" ? "is-rope" : "is-on");
    setTimeout(() => el.classList.remove("is-on", "is-miss", "is-ghost", "is-rope"), 140);
  }

  function sfx(name) {
    if (kit && typeof kit.sfx === "function") {
      const map = { hit: "sink", miss: "miss", flash: "rack", stamp: "stamp", clear: "chapter", drop: "drop", rack: "rack" };
      kit.sfx(map[name] || name);
    }
  }

  function renderWorld(now, dt) {
    if (!world || !world.renderer) return;
    const spec = liveSpec();
    poseAura(world.aura, auraPoseNow(now), dt);
    world.aura.position.x = Math.sin(now * 0.0008) * (isLive() ? 0.06 : 0.16);
    tickCurtains(dt);
    tickBits(dt);
    tickDust(now);
    tickDrops(dt, now);
    tickRopes(dt);
    tickHook(dt);
    const flashAmt = world.flash > 0 ? Math.min(1, world.flash / 180) : 0;
    if (world.flash > 0) world.flash = Math.max(0, world.flash - dt);
    applyLights(spec, now, flashAmt);
    cameraWork(now);
    hideToastIfDue(now);
    world.renderer.render(world.scene, world.camera);
  }

  function loop(now) {
    loopRaf = 0;
    if (!cabinetOn()) return;
    if (!lastTick) lastTick = now;
    const dt = Math.min(48, now - lastTick);
    lastTick = now;
    if (run && run.dying) stepDying(now, dt);
    renderWorld(now, dt);
    loopRaf = requestAnimationFrame(loop);
  }
  function startLoop() {
    if (loopRaf) return;
    lastTick = 0;
    loopRaf = requestAnimationFrame(loop);
  }
  function stopLoop() {
    if (loopRaf) cancelAnimationFrame(loopRaf);
    loopRaf = 0;
  }

  function beginKitRun() {
    if (rk() && typeof rk().startRun === "function") {
      return rk().startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin(GAME_ID)
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
    if (kit && typeof kit.persistRun === "function") kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }
  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "miss",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestPass = Math.max(state.bestPass || 0, payload.depth);
      state.bestPassScore = Math.max(state.bestPassScore || 0, payload.score);
    }
    closeKitRun(payload);
    if (kit && typeof kit.persistRun === "function") kit.persistRun(state, GAME_ID, payload);
    if (state && typeof PF.saveState === "function") PF.saveState();
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
  }
  function tellDepth(n, spec) {
    if (run && run.kitRun && rk() && typeof rk().reportDepth === "function") {
      try { rk().reportDepth(run.kitRun, n, { name: spec && spec.name, coda: !!(spec && spec.coda) }); } catch (_) {}
    }
    const hud = document.querySelector('[data-runkit-hud="pass"]');
    if (hud) hud.textContent = hudLine(spec, n);
  }
  function paintPips() {
    const spec = liveSpec();
    const limit = (spec && spec.failLimit) || 3;
    const span = document.querySelector('[data-runkit-strikes="pass"]');
    if (!span) return;
    const need = Math.max(1, limit);
    if (span.children.length !== need) {
      span.innerHTML = "";
      for (let i = 0; i < need; i++) span.appendChild(document.createElement("i"));
    }
    const n = run && (isLive() || run.dying) ? (run.fails | 0) : 0;
    span.querySelectorAll("i").forEach((el, i) => el.classList.toggle("on", i < n));
  }
  function stampDepthCopy() {
    const state = PF.getState() || {};
    const best = Math.max(state.bestPass || 0, (state.bestDepth && state.bestDepth.pass) || 0);
    setText("depthPassNow", isLive() || (run && run.dying) ? String(run.depth | 0) : "0");
    setText("depthPassBest", best ? String(best) : "—");
    setText("depthPassScore", isLive() || (run && run.dying) ? String(run.score | 0) : "0");
    setText("depthPassBestScore", state.bestPassScore ? String(state.bestPassScore) : "—");
    paintPips();
    const host = card();
    if (host) {
      const num = host.querySelector(".machine-number");
      if (num) num.textContent = DEPTH_COPY.machine;
      host.querySelectorAll("[data-pf-depth-copy]").forEach((p) => { p.textContent = DEPTH_COPY.body; });
    }
  }
  function paintPlayHud() {
    const spec = liveSpec();
    const n = isLive() || (run && run.dying) ? run.stage : 0;
    tellDepth(isLive() || (run && run.dying) ? (run.depth | 0) || n : n, spec);
    setText("passNeed", (run && (isLive() || run.dying) ? run.hits : 0) + " / " + ((spec && spec.need) || 0));
    if (run && run.rope && !run.rope.resolved) {
      const meta = ROPE_META[run.rope.idx];
      setText("passRopeCall", meta.key + " · " + meta.name);
    }
    paintFlyKeys();
  }

  function declareP0() {
    if (rk() && typeof rk().declare === "function") {
      rk().declare(GAME_ID, P0_MOUNT);
    }
  }
  function ensureCss() {
    if (document.querySelector('link[href="vendors/pass.css"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "vendors/pass.css";
    document.head.appendChild(link);
  }

  function startStage(n) {
    const spec = stageSpec(n);
    if (!spec) {
      finish("souvenir");
      return;
    }
    run.stage = n;
    run.spec = spec;
    run.hits = 0;
    run.fails = 0;
    run.ropesPulled = 0;
    run.combo = 0;
    run.rope = null;
    const now = performance.now();
    run.nextSpawnAt = now + 160;
    run.nextRopeAt = now + (spec.ropeDelay || 1600);
    world.drops.forEach(recycleDrop);
    world.battens.forEach((b) => { b.userData.want = b.userData.yUp; });
    if (run.kitRun) {
      run.kitRun.depth = Math.max(0, n - 1);
      run.kitRun.score = run.score;
    }
    tellDepth(Math.max(0, n - 1), spec);
    setText("passBarker", spec.barker);
    setText("passStatus", spec.barker);
    setCurtains(spec.blackout ? 0.55 : 0.9);
    paintBoard(spec.name.toUpperCase(), spec.barker);
    paintPips();
    stampDepthCopy();
    paintPlayHud();
    coolRopes();
  }

  function start() {
    if (isLive() || (run && run.dying)) return;
    if (!initWorld()) return;
    const ctx = beginKitRun();
    if (!ctx) {
      setText("passStatus", "Out of demo coins · grant a Showman’s Pass");
      showToast("NO COIN", "Grant a Showman’s Pass or earn a demo coin", 1400);
      return;
    }
    run = {
      kitRun: ctx,
      stage: 1,
      depth: 0,
      score: 0,
      fails: 0,
      hits: 0,
      ropesPulled: 0,
      combo: 0,
      rope: null,
      done: false,
      dying: false,
      spec: AUTHORED[0],
      nextSpawnAt: 0,
      nextRopeAt: 0,
    };
    if (kit && typeof kit.setMode === "function") kit.setMode(card(), "play");
    const hud = $("passHud");
    if (hud) hud.hidden = false;
    const depthHud = document.querySelector('[data-runkit-hud="pass"]');
    if (depthHud) depthHud.hidden = false;
    const startBtn = $("passStart");
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.hidden = true;
    }
    if ($("passVerdict")) $("passVerdict").hidden = true;
    if (kit && typeof kit.hideResult === "function") kit.hideResult("passResult");
    setCurtains(0.9);
    world.kick = 0.04;
    sfx("stamp");
    setAuraMood("cheer", 600);
    startStage(1);
    showToast(AUTHORED[0].name, AUTHORED[0].barker, 1300);
    startLoop();
  }

  function punchStart() {
    stampDepthCopy();
    setText("passStatus", DEPTH_COPY.punch);
    const btn = $("passStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) {}
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function stepDying(now, dt) {
    run.deathHold -= dt;
    setCurtains(0.02);
    world.kick = Math.max(world.kick, 0.05);
    if (run.deathHold <= 0) sealResult(run.deathNote || "miss");
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.deathNote = reason;
    run.deathHold = DEATH_HOLD_MS;
    setCurtains(0.02);
    sfx("stamp");
    world.kick = 0.12;
    setAuraMood(reason === "souvenir" ? "cheer" : "flinch", 800);
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "ghost") return AURA.ghost;
    if (reason === "rope") return AURA.rope;
    if (reason === "expire") return AURA.expire;
    if (depth >= 6) return AURA.deep(depth);
    if (depth > 0) return AURA.mid;
    return AURA.shallow;
  }
  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") {
      return rk().challengeText("Backstage Flap call", depth, GAME_ID);
    }
    return "Beat my Backstage Flap call " + depth + " on Penny Fever";
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    world.drops.forEach(recycleDrop);
    const depth = run.depth | 0;
    const score = run.score | 0;
    const death = reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : (reason || "miss"));
    persistDepth({
      depth,
      score,
      deathReason: death,
      cashedOut: death === "souvenir",
      meta: { stage: run.stage, fails: run.fails, hits: run.hits, ropes: run.ropesPulled, room: run.spec && run.spec.name, coda: !!(run.spec && run.spec.coda) },
    });
    stampDepthCopy();
    const startBtn = $("passStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.hidden = false;
      startBtn.textContent = "FLY AGAIN · 1 demo coin";
    }
    const hud = $("passHud");
    if (hud) hud.hidden = true;
    const depthHud = document.querySelector('[data-runkit-hud="pass"]');
    if (depthHud) depthHud.hidden = true;
    if (kit && typeof kit.setMode === "function") kit.setMode(card(), "result");
    const aura = auraLine(reason, depth);
    const challenge = challengeLine(depth);
    const verdict = $("passVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = "CALL " + depth + " · SCORE " + score + " · " + aura;
    }
    if (kit && typeof kit.fillResult === "function") {
      kit.fillResult({
        root: "passResult",
        depth: "passResultDepth",
        score: "passResultScore",
        aura: "passResultAura",
        copied: "passCopied",
      }, {
        depthLine: hudLine(run.spec, depth),
        scoreLine: "SCORE " + score + " · " + String(death).replace(/_/g, " ").toUpperCase(),
        auraLine: aura,
      });
    }
    setText("passChallengeText", challenge);
    if (typeof PF.setTier === "function") PF.setTier("passTier", depth > 0 ? "CALL " + depth : "CLOSED", depth > 0 ? "perfect" : "miss");
    setText("passStatus", reason === "leave" ? "Stepped back through the flap." : (reason === "souvenir" ? "Opening Night souvenir." : "Fly gallery stamped CLOSED."));
    paintBoard(reason === "souvenir" ? "CURTAIN CALL" : "HOUSE CLOSED", aura);
    if (depth > 0) {
      if (typeof PF.award === "function") PF.award(Math.max(8, Math.floor(score / 12)), true, "Backstage Flap");
      if (typeof PF.setAura === "function") PF.setAura(depth >= 6 ? "celebrate" : "point");
      if (reason !== "leave" && typeof PF.showBanner === "function") PF.showBanner(true, "CALL " + depth, score + " · " + aura);
    } else {
      if (typeof PF.award === "function") PF.award(0, false, "Backstage miss");
      if (typeof PF.setAura === "function") PF.setAura("badLuck");
      if (reason !== "leave" && typeof PF.showBanner === "function") PF.showBanner(false, "CLOSED", aura);
    }
    if (typeof PF.refreshNightBoard === "function") PF.refreshNightBoard();
    setCurtains(0.18);
    showToast(reason === "souvenir" ? "SOUVENIR" : "HOUSE CLOSED", aura, 1600);
    coolRopes();
  }

  function projectPointer(ev) {
    if (!world) return null;
    const rect = world.canvas.getBoundingClientRect();
    world.ptr.x = ((ev.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    world.ptr.y = -((ev.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    world.ray.setFromCamera(world.ptr, world.camera);
    const hits = world.ray.intersectObject(world.catchPlane, false);
    if (hits.length) return hits[0].point;
    return null;
  }

  function ropeFromRay() {
    const hits = world.ray.intersectObjects(world.ropes, true);
    if (!hits.length) return -1;
    let obj = hits[0].object;
    while (obj && obj.userData && obj.userData.idx == null) obj = obj.parent;
    return obj && obj.userData && obj.userData.idx != null ? obj.userData.idx : -1;
  }

  function onPointerDown(ev) {
    if (!world) return;
    if (run && run.dying) return;
    if (!isLive()) {
      if (run && run.done) start();
      else start();
      return;
    }
    ev.preventDefault();
    try { world.canvas.setPointerCapture(ev.pointerId); } catch (_) {}
    const p = projectPointer(ev);
    if (p) {
      input.x = p.x;
      input.y = p.y;
    }
    const ropeIdx = ropeFromRay();
    if (ropeIdx >= 0 && run.rope && !run.rope.resolved) {
      pullRope(ropeIdx);
      return;
    }
    input.down = true;
    input.jab = 1;
    tryCatch();
  }
  function onPointerMove(ev) {
    if (!world) return;
    const p = projectPointer(ev);
    if (!p) return;
    input.x = p.x;
    input.y = p.y;
    if (input.down && isLive()) ev.preventDefault();
  }
  function onPointerUp() {
    input.down = false;
  }

  function bindInputs() {
    if (bound) return;
    bound = true;
    const startBtn = $("passStart");
    if (startBtn) startBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      start();
    });
    const keys = $("passFlyKeys");
    if (keys) {
      keys.addEventListener("pointerdown", (ev) => {
        const btn = ev.target.closest("[data-rope]");
        if (!btn) return;
        ev.preventDefault();
        ev.stopPropagation();
        pullRope(+(btn.getAttribute("data-rope")));
      });
    }
    const canvas = $("passCanvas");
    if (canvas) {
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointercancel", onPointerUp);
    }
    const copyBtn = $("passChallenge");
    if (copyBtn && kit && typeof kit.copyText === "function") {
      copyBtn.addEventListener("click", () => {
        const text = ($("passChallengeText") && $("passChallengeText").textContent) || "";
        kit.copyText(text, () => { const n = $("passCopied"); if (n) n.hidden = false; });
      });
    }
    window.addEventListener("keydown", (ev) => {
      if (!cabinetOn()) return;
      if (ev.code === "Space" || ev.code === "Enter") {
        ev.preventDefault();
        if (!isLive()) {
          start();
          return;
        }
        input.jab = 1;
        tryCatch();
        return;
      }
      const map = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 };
      if (map[ev.code] != null) {
        ev.preventDefault();
        pullRope(map[ev.code]);
      }
    });
    window.addEventListener("resize", fitRenderer);
    if (window.ResizeObserver) {
      const host = $("passCard") || $("cabinet-pass");
      if (host) {
        const ro = new ResizeObserver(fitRenderer);
        ro.observe(host);
      }
    }
  }

  window.__passPlay = {
    snap() {
      if (!world) return null;
      return {
        live: isLive(),
        stage: run && run.stage,
        hits: run && run.hits,
        fails: run && run.fails,
        score: run && run.score,
        depth: run && run.depth,
        need: liveSpec().need,
        ropes: run && run.ropesPulled,
        ropeNeed: liveSpec().ropeNeed,
        rope: run && run.rope ? { idx: run.rope.idx, until: run.rope.until } : null,
        hook: { x: world.hook.position.x, y: world.hook.position.y, z: world.hook.position.z },
        drops: world.drops.filter((d) => d.live).map((d) => ({
          x: d.x, y: d.y, z: d.z, ghost: !!d.ghost, idle: !!d.idle,
        })),
        status: ($("passStatus") && $("passStatus").textContent) || "",
        card: card() && card().className,
      };
    },
    aim(x, y) {
      input.x = x;
      input.y = y;
    },
    jab() {
      input.jab = 1;
      input.down = true;
      tryCatch();
    },
    hold(on) {
      input.down = !!on;
      if (on) input.jab = 1;
    },
    pull(i) { pullRope(i); },
  };

  PF.registerVendor({
    id: "pass",
    playKey: "pass",
    chalk: "Employees only. Catch the loft — pull the fly.",
    defaults: { bestPass: 0, bestPassScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopLoop();
    },
    onShow() {
      ensureCss();
      declareP0();
      stampDepthCopy();
      initWorld();
      setCurtains(0.28);
      paintBoard("EMPLOYEES ONLY", "catch gold · dump ghosts · pull the fly");
      if (kit && typeof kit.setMode === "function" && !(run && (isLive() || run.dying))) {
        kit.setMode(card(), (run && run.done) ? "result" : "vestibule");
      }
      startLoop();
    },
    onReset() {
      if (run && run.dying) run.dying = false;
      run = null;
      if (world) world.drops.forEach(recycleDrop);
      const verdict = $("passVerdict");
      if (verdict) verdict.hidden = true;
      if (kit && typeof kit.hideResult === "function") kit.hideResult("passResult");
      const startBtn = $("passStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.hidden = false;
        startBtn.textContent = "STEP INSIDE · 1 demo coin";
      }
      if (kit && typeof kit.setMode === "function") kit.setMode(card(), "vestibule");
      const hud = $("passHud");
      if (hud) hud.hidden = true;
      const depthHud = document.querySelector('[data-runkit-hud="pass"]');
      if (depthHud) depthHud.hidden = true;
      setCurtains(0.28);
      stampDepthCopy();
      setText("passBarker", "EMPLOYEES ONLY — KEEP HER LIT");
      setText("passStatus", DEPTH_COPY.status);
      paintBoard("EMPLOYEES ONLY", "catch gold · dump ghosts · pull the fly");
      coolRopes();
    },
    refreshDepth(state) {
      const bestN = Math.max(state.bestPass || 0, (state.bestDepth && state.bestDepth.pass) || 0);
      setText("depthPassNow", isLive() || (run && run.dying) ? String(run.depth | 0) : "0");
      setText("depthPassBest", bestN ? String(bestN) : "—");
      setText("depthPassScore", isLive() || (run && run.dying) ? String(run.score | 0) : "0");
      setText("depthPassBestScore", state.bestPassScore ? String(state.bestPassScore) : "—");
    },
    bind() {
      ensureCss();
      declareP0();
      bindInputs();
      stampDepthCopy();
    },
  });
})();
