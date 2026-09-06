/* Flash Booth — Living Plate. Desktop Grok owns this tent. PF only. Never booth/port 6000.
 * Full 3D studio hunt (not a 3-2-1 tap demo): drag to look, click WHITE flash-bugs.
 * Orange liar-lamps and the birdie burn the plate. Aura locked look.
 * Engine: Custom · depthUnit: Take · gameId: snap · 8 authored TAKES then ENDLESS.
 * 1 coin = 1 run. Family-safe carnival. No casino. No Mirror Crew. */
import * as THREE from "../world/lib/three.module.min.js";

(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const GAME_ID = "snap";
  const CABINET_ID = "cabinet-snap";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const DEATH_HOLD_MS = 720;
  const INTRO_MS = 560;
  const RECOVER_MS = 480;
  const TAU = Math.PI * 2;
  const POP_HIT = 0.36;
  const VIEW = { x: 1.22, yLo: 0.95, yHi: 2.12, zLo: 0.32, zHi: 1.02 };
  const TAP_DEAD_TOUCH = 28;
  const TAP_DEAD_MOUSE = 10;
  const PLAYTEST = /(?:\?|&)playtest=1(?:&|$)/.test(location.search);

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;
  const SHOE = 0x141414;
  const WOOD = 0x3a2418;
  const BRASS = 0xd4a45a;
  const VELVET = 0x5a1a28;

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Flash Booth",
    depthUnit: "Take",
    sheet: "GOBLIN_ALLEY_CABINETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored TAKES then ENDLESS · hunt the white flash",
    body: "True pop and liar lamp share one look. TAP the bright WHITE flash. The orange lamp lies. DRAG to look around — you do not need a SNAP button. One coin. Go as far as the plate holds.",
    status: "Living plate · START · 1 demo coin · 8 authored TAKES then ENDLESS",
    machine: "Living plate · 1 demo coin · hunt the WHITE flash",
    idleHud: ["CLICK WHITE · ORANGE LIES · DRAG TO LOOK", "START · 1 demo coin — catch the true pops"],
    punch: "Depth run — press START. Hunt the white flashes.",
  };

  const AUTHORED = [
    {
      id: 1, name: "Portrait Lesson", kind: "teach",
      need: 1, fakes: 1, birdie: false, spin: false, blackout: false, wiggle: false,
      speed: 0.38, timeMs: 12000, grace: true, pattern: "pair",
      barker: "Both in one look. TAP the bright WHITE pop. The orange lamp is a liar.",
    },
    {
      id: 2, name: "Wiggle Reel", kind: "wiggle",
      need: 1, fakes: 1, birdie: false, spin: false, blackout: false, wiggle: true,
      speed: 0.72, timeMs: 10500, grace: false, pattern: "pair",
      barker: "She fidgets. White and orange stay in frame. TAP only the WHITE.",
    },
    {
      id: 3, name: "Liar Lamps", kind: "liar",
      need: 1, fakes: 2, birdie: false, spin: false, blackout: false, wiggle: false,
      speed: 0.92, timeMs: 10000, grace: false, pattern: "cluster",
      barker: "Two orange lamps, one white pop — all in one look. TAP the WHITE.",
    },
    {
      id: 4, name: "Double Exposure", kind: "double",
      need: 2, fakes: 2, birdie: false, spin: false, blackout: false, wiggle: true,
      speed: 0.95, timeMs: 12000, grace: false, pattern: "cluster",
      barker: "Two whites beside two liars. TAP both whites. Orange still burns the plate.",
    },
    {
      id: 5, name: "Spinning Set", kind: "spin",
      need: 1, fakes: 2, birdie: false, spin: true, blackout: false, wiggle: true,
      speed: 1.05, timeMs: 10000, grace: false, pattern: "pair",
      barker: "The set turns behind them. White and orange stay in one look. TAP WHITE.",
    },
    {
      id: 6, name: "Blackout Booth", kind: "blackout",
      need: 1, fakes: 1, birdie: false, spin: false, blackout: true, wiggle: false,
      speed: 0.82, timeMs: 10500, grace: false, pattern: "pair",
      barker: "Lights die. Both still sit in frame. White blinks true. Orange still lies.",
    },
    {
      id: 7, name: "Birdie Watch", kind: "birdie",
      need: 1, fakes: 1, birdie: true, spin: false, blackout: false, wiggle: true,
      speed: 1.0, timeMs: 9500, grace: false, pattern: "pair",
      barker: "White, orange, and the yellow birdie — one look. TAP only WHITE.",
    },
    {
      id: 8, name: "Fever Studio", kind: "fever",
      need: 2, fakes: 2, birdie: true, spin: true, blackout: false, wiggle: true,
      speed: 1.15, timeMs: 9500, grace: false, pattern: "cluster",
      barker: "Fever. Two whites, two liars, a birdie. Still one look. TAP WHITE only.",
    },
  ];

  const AURA_LINE = {
    fake_out: "Aura: Gotcha — that lamp was a liar.",
    birdie: "Aura: You snapped the birdie. She was still looking.",
    too_late: "Aura: The moment walked off. Plate’s blank.",
    leave: "Aura: Walking off mid-take? Coward’s stamp.",
    shallow: "Aura: Not a single take. The booth is laughing.",
    mid: "Aura: Cute freeze. Deeper plates get meaner.",
    deep: "Aura: You hunted the blind ones. Dangerous.",
    souvenir: "Aura: Eight plates locked. The booth salutes.",
    coda: "Aura: Authored plates done. ENDLESS takes. Don’t you dare click orange.",
    miss_air: "Aura: The white one, sugar. The glowing ball.",
  };

  const POSES = ["idle", "peace", "wave", "kick", "lookaway", "curtsy", "jump"];
  const BACKDROP_KIND = ["velvet", "boardwalk", "stars", "hearts", "stripes", "void", "garden", "fever"];

  let run = null;
  let world = null;
  let raf = 0;
  let lastTs = 0;
  let reduceMotion = false;
  let bootPromise = null;
  let bound = false;
  let keys = Object.create(null);

  const pointer = {
    x: 0, y: 0, nx: 0, ny: 0, down: false, dragging: false,
    sx: 0, sy: 0, px: 0, py: 0, over: false, touch: false, id: -1,
  };

  function rk() { return PF.runKit || null; }
  function el(id) { return $(id); }
  function setText(id, text) { const n = el(id); if (n) n.textContent = text; }
  function card() { return el("snapCard"); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function cabinetOn() {
    const node = document.getElementById(CABINET_ID);
    return !!(node && !node.hidden);
  }

  function stayingOnSnap() {
    const hash = (location.hash || "").replace(/^#/, "");
    return hash === "cabinet/snap" || hash.startsWith("cabinet/snap/");
  }

  function hashLeaf() {
    const m = (location.hash || "").match(/^#?cabinet\/snap(?:\/(play|result))?$/);
    return (m && m[1]) || "";
  }

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function codaSpec(n) {
    const k = n - AUTHORED_COUNT;
    return {
      id: n,
      name: "Endless Take " + n,
      kind: "coda",
      need: Math.min(4, 1 + Math.floor(k / 2)),
      fakes: Math.min(5, 1 + Math.floor(k / 2)),
      birdie: n % 3 === 0,
      spin: n % 2 === 0,
      blackout: n % 4 === 1,
      wiggle: true,
      speed: Math.min(2.4, 1.4 + k * 0.08),
      timeMs: Math.max(5200, 9000 - k * 220),
      grace: false,
      pattern: k % 2 ? "cluster" : "pair",
      coda: true,
      barker: "ENDLESS take " + n + ". White and orange in one look. TAP WHITE only.",
    };
  }

  function specFor(n) {
    if (n <= AUTHORED_COUNT) return AUTHORED[n - 1];
    return codaSpec(n);
  }

  function declareP0() {
    const kitRun = rk();
    if (kitRun && typeof kitRun.declare === "function") kitRun.declare(GAME_ID, P0_MOUNT);
  }

  function stampDepthCopy() {
    const host = card();
    const copy = host && host.querySelector("[data-pf-depth-copy]");
    if (copy) copy.textContent = DEPTH_COPY.body;
    const machine = host && host.querySelector(".machine-number");
    if (machine && !isLive()) machine.textContent = DEPTH_COPY.machine;
    if (!isLive()) setText("snapStatus", DEPTH_COPY.status);
  }

  /* —— audio —— */
  let audioCtx = null;
  function ac() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function tone(freq, dur, gain, type, slide) {
    const ctx = ac();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.05, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noiseBurst(dur, gain) {
    const ctx = ac();
    if (!ctx) return;
    const n = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = n.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = n;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    const g = ctx.createGain();
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(gain || 0.08, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  function sfx(name) {
    if (name === "tick") { tone(880, 0.06, 0.03, "square", 520); return; }
    if (name === "fake") { tone(240, 0.12, 0.04, "triangle", 140); noiseBurst(0.08, 0.03); return; }
    if (name === "shutter") { noiseBurst(0.05, 0.1); tone(1480, 0.07, 0.05, "square", 420); tone(220, 0.16, 0.04, "sine", 90); return; }
    if (name === "hit") { tone(523, 0.12, 0.04, "sine", 784); tone(784, 0.18, 0.03, "sine", 1046); return; }
    if (name === "die") { tone(196, 0.28, 0.05, "sawtooth", 70); return; }
    if (name === "start") { tone(330, 0.1, 0.03, "triangle", 440); tone(440, 0.14, 0.03, "triangle", 660); return; }
    if (name === "warn") { tone(392, 0.09, 0.03, "square", 220); return; }
    if (name === "hover") { tone(990, 0.04, 0.018, "sine", 1320); return; }
    if (kit && kit.sfx) kit.sfx(name);
  }

  /* —— textures / mats —— */
  function canvasTex(w, h, draw, repeatX, repeatY) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX || 1, repeatY || 1);
    t.anisotropy = 4;
    t.needsUpdate = true;
    return t;
  }

  function makeMat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.62, metalness: 0.08,
    }, extra || {}));
  }

  function meshBox(mat, w, h, d, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function meshSphere(mat, r, x, y, z, seg) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg || 14, seg || 12), mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function meshCyl(mat, rTop, rBot, h, x, y, z, seg) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg || 12), mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function woodTex() {
    return canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#4a2e1c";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 18; i += 1) {
        ctx.fillStyle = "rgba(0,0,0," + (0.04 + (i % 3) * 0.03) + ")";
        ctx.fillRect(i * 14 + 4, 0, 3, 256);
      }
      ctx.strokeStyle = "rgba(90,50,24,0.55)";
      ctx.lineWidth = 1.2;
      for (let y = 8; y < 256; y += 17) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(80, y + 6, 160, y - 5, 256, y + 3);
        ctx.stroke();
      }
    }, 3, 3);
  }

  function velvetTex() {
    return canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#4a1422";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 40; i += 1) {
        ctx.fillStyle = "rgba(20,0,8," + (0.05 + (i % 4) * 0.03) + ")";
        ctx.fillRect(i * 7, 0, 3, 256);
      }
      ctx.fillStyle = "rgba(212,164,90,0.12)";
      ctx.fillRect(0, 0, 256, 10);
      ctx.fillRect(0, 246, 256, 10);
    }, 2, 2);
  }

  function plaqueTex() {
    return canvasTex(512, 256, (ctx) => {
      ctx.fillStyle = "#2a140c";
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, 492, 236);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "700 36px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("TAP THE WHITE POP", 256, 88);
      ctx.font = "700 28px Georgia, serif";
      ctx.fillStyle = "#ffb089";
      ctx.fillText("ORANGE LAMPS LIE", 256, 138);
      ctx.fillStyle = "#e8c878";
      ctx.font = "22px Georgia, serif";
      ctx.fillText("DRAG TO LOOK  ·  NO 3-2-1 BUTTON", 256, 188);
    }, 1, 1);
  }

  function polaroidTex(take, pose, perfect) {
    return canvasTex(256, 320, (ctx) => {
      ctx.fillStyle = "#f6efe2";
      ctx.fillRect(0, 0, 256, 320);
      ctx.fillStyle = perfect ? "#5a2040" : "#2a3048";
      ctx.fillRect(18, 18, 220, 220);
      ctx.fillStyle = "#f0c4a8";
      ctx.beginPath();
      ctx.arc(128, 118, 38, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#3d2418";
      ctx.beginPath();
      ctx.arc(112, 128, 16, 0, TAU);
      ctx.arc(144, 128, 16, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#1e6b3c";
      ctx.fillRect(96, 150, 64, 70);
      ctx.fillStyle = "#e8b84a";
      ctx.fillRect(108, 72, 40, 12);
      ctx.fillStyle = "#d22b3a";
      ctx.beginPath();
      ctx.moveTo(128, 86);
      ctx.lineTo(136, 96);
      ctx.lineTo(120, 96);
      ctx.fill();
      ctx.fillStyle = "#3a2418";
      ctx.font = "700 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("TAKE " + take, 128, 272);
      ctx.font = "16px Georgia, serif";
      ctx.fillStyle = "#6a4a30";
      ctx.fillText(perfect ? "true pop" : pose, 128, 296);
    }, 1, 1);
  }

  function backdropTex(kind) {
    return canvasTex(1024, 512, (ctx) => {
      if (kind === "velvet") {
        ctx.fillStyle = "#6a1830";
        ctx.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 16; i += 1) {
          ctx.fillStyle = i % 2 ? "#5a1428" : "#7a1e38";
          ctx.fillRect(i * 64, 0, 64, 512);
        }
        ctx.fillStyle = "#d4a45a";
        ctx.fillRect(0, 20, 1024, 10);
        ctx.fillRect(0, 482, 1024, 10);
        return;
      }
      if (kind === "boardwalk") {
        const g = ctx.createLinearGradient(0, 0, 0, 512);
        g.addColorStop(0, "#1a2040");
        g.addColorStop(0.55, "#3a1840");
        g.addColorStop(1, "#8a3a28");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1024, 512);
        ctx.fillStyle = "#f0d09a";
        for (let i = 0; i < 40; i += 1) {
          ctx.globalAlpha = 0.35 + Math.random() * 0.5;
          ctx.beginPath();
          ctx.arc(Math.random() * 1024, Math.random() * 220, 1.6, 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        return;
      }
      if (kind === "stars") {
        ctx.fillStyle = "#070b16";
        ctx.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 180; i += 1) {
          ctx.fillStyle = "rgba(255,245,220," + (0.3 + Math.random() * 0.7) + ")";
          ctx.beginPath();
          ctx.arc(Math.random() * 1024, Math.random() * 512, Math.random() * 1.8 + 0.3, 0, TAU);
          ctx.fill();
        }
        return;
      }
      if (kind === "hearts") {
        ctx.fillStyle = "#4a1830";
        ctx.fillRect(0, 0, 1024, 512);
        ctx.fillStyle = "#d22b3a";
        for (let i = 0; i < 18; i += 1) {
          const x = 60 + (i % 6) * 160;
          const y = 80 + Math.floor(i / 6) * 150;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-22, -22, 44, 44);
          ctx.restore();
        }
        return;
      }
      if (kind === "stripes") {
        for (let i = 0; i < 18; i += 1) {
          ctx.fillStyle = i % 2 ? "#c45a3a" : "#f0d09a";
          ctx.fillRect(i * 58, 0, 58, 512);
        }
        return;
      }
      if (kind === "void") {
        ctx.fillStyle = "#050308";
        ctx.fillRect(0, 0, 1024, 512);
        const glow = ctx.createRadialGradient(512, 240, 10, 512, 240, 220);
        glow.addColorStop(0, "rgba(255,220,160,0.35)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 1024, 512);
        return;
      }
      if (kind === "garden") {
        ctx.fillStyle = "#143022";
        ctx.fillRect(0, 0, 1024, 512);
        ctx.fillStyle = "#1e6b3c";
        ctx.fillRect(0, 300, 1024, 212);
        ctx.fillStyle = "#e8b84a";
        ctx.beginPath();
        ctx.arc(820, 90, 50, 0, TAU);
        ctx.fill();
        return;
      }
      const fever = ctx.createLinearGradient(0, 0, 1024, 512);
      fever.addColorStop(0, "#7a1028");
      fever.addColorStop(0.5, "#d45a20");
      fever.addColorStop(1, "#f0c45a");
      ctx.fillStyle = fever;
      ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "700 96px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("FEVER", 512, 280);
    }, 1, 1);
  }

  /* —— Aura (locked look) —— */
  function makeAura() {
    const g = new THREE.Group();
    const skin = makeMat(SKIN, { roughness: 0.55, emissive: 0x3a2018, emissiveIntensity: 0.1 });
    const blouse = makeMat(BLOUSE, { roughness: 0.5, emissive: 0x3a3028, emissiveIntensity: 0.12 });
    const dress = makeMat(DRESS, { roughness: 0.48, emissive: 0x0a2010, emissiveIntensity: 0.22 });
    const hairM = makeMat(HAIR, { roughness: 0.7, emissive: 0x1a0c08, emissiveIntensity: 0.12 });
    const gold = makeMat(GOLD, { metalness: 0.7, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.5 });
    const heart = makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.65, roughness: 0.35 });
    const shoe = makeMat(SHOE, { metalness: 0.55, roughness: 0.28 });

    const hip = new THREE.Group();
    hip.position.y = 0.46;
    g.add(hip);

    hip.add(meshCyl(blouse, 0.14, 0.16, 0.32, 0, 0.3, 0, 14));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.14, 0.38, 14), dress);
    skirt.position.y = 0.05;
    hip.add(skirt);
    hip.add(meshBox(dress, 0.22, 0.2, 0.04, 0, 0.36, 0.14));
    const heartGem = meshBox(heart, 0.09, 0.09, 0.04, 0, 0.24, 0.17);
    heartGem.rotation.z = Math.PI / 4;
    hip.add(heartGem);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 16), blouse);
    collar.position.y = 0.46;
    collar.rotation.x = Math.PI / 2;
    hip.add(collar);

    const head = new THREE.Group();
    head.position.y = 0.64;
    hip.add(head);
    head.add(meshSphere(skin, 0.19, 0, 0.02, 0, 16));
    const eyeW = makeMat(0xf7f2ea);
    const eyeD = makeMat(0x2a1810);
    const hi = makeMat(0xffffff);
    [-1, 1].forEach((side) => {
      const white = meshSphere(eyeW, 0.04, side * 0.06, 0.03, 0.16);
      white.scale.set(0.04, 0.046, 0.02);
      head.add(white);
      head.add(meshSphere(eyeD, 0.022, side * 0.06, 0.03, 0.175));
      head.add(meshSphere(hi, 0.01, side * 0.05, 0.045, 0.19));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 6, 12, Math.PI), makeMat(0xc45a6a));
    smile.position.set(0, -0.05, 0.17);
    smile.rotation.x = 2.55;
    head.add(smile);

    head.add(meshSphere(hairM, 0.22, 0, 0.07, -0.03, 14));
    head.add(meshBox(hairM, 0.3, 0.07, 0.1, 0, 0.14, 0.15));
    [-1, 1].forEach((side) => {
      head.add(meshSphere(hairM, 0.11, side * 0.2, -0.05, 0.04, 12));
      head.add(meshSphere(heart, 0.045, side * 0.2, 0.05, 0.07));
    });

    const crown = new THREE.Group();
    crown.position.y = 0.24;
    head.add(crown);
    crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.022, 8, 18), gold));
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.15 : 0.09;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, h, 6), gold);
      spike.position.set(x, h * 0.45, 0);
      crown.add(spike);
    });
    const gem = meshBox(heart, 0.055, 0.055, 0.025, 0, 0.02, 0.12);
    gem.rotation.z = Math.PI / 4;
    crown.add(gem);

    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.18 : 0.08), arm ? 0.4 : 0.0, 0);
      const len = arm ? 0.3 : 0.36;
      const rad = arm ? 0.036 : 0.044;
      pivot.add(meshCyl(arm ? skin : dress, rad, rad, len, 0, -len / 2, 0));
      if (arm) pivot.add(meshSphere(skin, 0.042, 0, -len, 0));
      else pivot.add(meshBox(shoe, 0.09, 0.05, 0.14, 0, -len - 0.02, 0.03));
      hip.add(pivot);
      return pivot;
    }

    const armL = limb(-1, true);
    const armR = limb(1, true);
    const legL = limb(-1, false);
    const legR = limb(1, false);

    g.userData = { hip, head, armL, armR, legL, legR, crown, pose: "idle" };
    g.scale.setScalar(1.28);
    return g;
  }

  function applyPose(aura, name, t, frozen) {
    const u = aura.userData;
    const breathe = frozen ? 0 : Math.sin(t * 2.1) * 0.018;
    u.hip.position.y = 0.46 + breathe + (name === "jump" && !frozen ? 0.12 : 0);
    u.hip.rotation.y = frozen ? u.hip.rotation.y : Math.sin(t * 0.8) * 0.08;
    u.head.rotation.z = frozen ? u.head.rotation.z : Math.sin(t * 1.4) * 0.05;
    u.head.rotation.y = 0;
    u.armL.rotation.set(0.15, 0, 0.25);
    u.armR.rotation.set(0.15, 0, -0.25);
    u.legL.rotation.set(0.05, 0, 0.04);
    u.legR.rotation.set(-0.04, 0, -0.04);
    if (name === "peace") {
      u.armR.rotation.set(-0.2, 0.2, -2.35);
      u.armL.rotation.set(0.2, 0, 0.4);
    } else if (name === "wave") {
      u.armR.rotation.set(-0.1, 0.1, -2.1);
      u.armR.rotation.z += frozen ? 0 : Math.sin(t * 8) * 0.25;
    } else if (name === "kick") {
      u.legR.rotation.set(-1.15, 0, -0.1);
      u.armL.rotation.set(-0.4, 0, 0.6);
    } else if (name === "lookaway") {
      u.head.rotation.y = 0.7;
      u.armL.rotation.set(0.4, 0, 0.5);
    } else if (name === "curtsy") {
      u.hip.position.y = 0.32;
      u.legL.rotation.set(0.4, 0, 0.35);
      u.legR.rotation.set(0.15, 0, -0.5);
      u.armR.rotation.set(0.6, 0, -0.8);
    } else if (name === "jump") {
      u.armL.rotation.set(-2.1, 0, 0.4);
      u.armR.rotation.set(-2.1, 0, -0.4);
      u.legL.rotation.set(-0.35, 0, 0.15);
      u.legR.rotation.set(-0.35, 0, -0.15);
    }
    u.pose = name;
    u.crown.rotation.z = frozen ? 0 : Math.sin(t * 3) * 0.04;
  }

  /* —— props —— */
  function makeStudioCam() {
    const g = new THREE.Group();
    const brass = makeMat(BRASS, { metalness: 0.72, roughness: 0.3, emissive: 0x4a3010, emissiveIntensity: 0.15 });
    const leather = makeMat(0x2a1810, { roughness: 0.7 });
    const glass = makeMat(0x1a3040, { metalness: 0.4, roughness: 0.15, emissive: 0x102030, emissiveIntensity: 0.2 });
    g.add(meshBox(leather, 0.55, 0.42, 0.7, 0, 1.15, 0));
    g.add(meshCyl(brass, 0.16, 0.18, 0.28, 0, 1.15, 0.46, 16));
    g.add(meshCyl(glass, 0.12, 0.12, 0.06, 0, 1.15, 0.6, 16));
    const bulb = meshSphere(makeMat(0xfff4d8, { emissive: 0xffe8b0, emissiveIntensity: 0.35, roughness: 0.2 }), 0.13, 0, 1.48, 0.05, 16);
    g.add(bulb);
    g.add(meshCyl(brass, 0.03, 0.03, 0.16, 0, 1.38, 0.05));
    const shutter = meshCyl(makeMat(0xc45a3a, { emissive: 0x401010, emissiveIntensity: 0.2 }), 0.055, 0.055, 0.04, 0.3, 1.15, 0.1, 12);
    shutter.rotation.z = Math.PI / 2;
    g.add(shutter);
    g.add(meshCyl(brass, 0.03, 0.03, 1.05, 0, 0.52, 0));
    [-1, 0, 1].forEach((s, i) => {
      const leg = meshCyl(brass, 0.018, 0.018, 1.1, s * 0.22, 0.5, i === 1 ? -0.18 : 0.12);
      leg.rotation.z = s * 0.18;
      g.add(leg);
    });
    g.userData = { bulb, shutter };
    return g;
  }

  function makeBirdie() {
    const g = new THREE.Group();
    const body = meshSphere(makeMat(0xf0d05a, { emissive: 0x6a5010, emissiveIntensity: 0.35 }), 0.11, 0, 0, 0, 14);
    g.add(body);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 6), makeMat(0xe07020, { emissive: 0x6a2808, emissiveIntensity: 0.3 }));
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.02, 0.14);
    g.add(beak);
    const comb = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 5), makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.45 }));
    comb.position.set(0, 0.12, 0.02);
    g.add(comb);
    const hit = meshSphere(makeMat(0xf0d05a, { transparent: true, opacity: 0.0, depthWrite: false }), POP_HIT, 0, 0, 0, 8);
    g.add(hit);
    const light = new THREE.PointLight(0xf0d05a, 0.9, 3.2, 2);
    g.add(light);
    g.userData = { kind: "birdie", vx: 0.8, vy: 0.4, vz: 0.6, bob: 0, light };
    g.visible = false;
    g.position.set(0.9, 1.6, 0.4);
    return g;
  }

  function makePop(kind) {
    const g = new THREE.Group();
    const isTrue = kind === "true";
    const color = isTrue ? 0xfff6d8 : 0xff7a3a;
    const emissive = isTrue ? 0xffe8b0 : 0xff5520;
    const core = meshSphere(makeMat(color, {
      emissive, emissiveIntensity: isTrue ? 2.4 : 1.05, roughness: 0.18, metalness: 0.15,
    }), isTrue ? 0.17 : 0.12, 0, 0, 0, 16);
    g.add(core);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(isTrue ? 0.3 : 0.22, 12, 10),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: isTrue ? 0.38 : 0.3, depthWrite: false })
    );
    g.add(glow);
    if (isTrue) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.018, 8, 20),
        makeMat(GOLD, { metalness: 0.55, roughness: 0.3, emissive: 0x6a4808, emissiveIntensity: 0.55 })
      );
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
    } else {
      const shade = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.2, 10, 1, true),
        makeMat(0x3a1810, { side: THREE.DoubleSide, roughness: 0.72 })
      );
      shade.position.y = 0.12;
      shade.rotation.x = Math.PI;
      g.add(shade);
      g.add(meshCyl(makeMat(BRASS, { metalness: 0.6, roughness: 0.35 }), 0.018, 0.018, 0.1, 0, -0.12, 0, 8));
    }
    const hit = meshSphere(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), POP_HIT, 0, 0, 0, 8);
    g.add(hit);
    const light = new THREE.PointLight(color, isTrue ? 2.6 : 1.05, 4.2, 1.8);
    g.add(light);
    const trail = [];
    const trailMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, depthWrite: false });
    for (let i = 0; i < 5; i += 1) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.045 - i * 0.006, 6, 6), trailMat);
      d.position.set(0, 0, 0);
      g.add(d);
      trail.push(d);
    }
    g.userData = {
      kind, core, glow, light, trail, trailHist: [],
      vx: 0, vy: 0, vz: 0, bob: Math.random() * TAU, caught: false, home: null,
    };
    return g;
  }

  function makeLampStand(x, z) {
    const g = new THREE.Group();
    const brass = makeMat(BRASS, { metalness: 0.65, roughness: 0.32 });
    g.add(meshCyl(brass, 0.03, 0.04, 1.7, 0, 0.85, 0, 8));
    g.add(meshCyl(brass, 0.16, 0.16, 0.04, 0, 0.02, 0, 10));
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 10, 1, true), makeMat(0x3a2010, { side: THREE.DoubleSide, roughness: 0.7 }));
    shade.position.y = 1.78;
    shade.rotation.x = Math.PI;
    g.add(shade);
    const bulb = meshSphere(makeMat(0xffc080, { emissive: 0xff6a30, emissiveIntensity: 0.4, roughness: 0.2 }), 0.08, 0, 1.66, 0, 10);
    g.add(bulb);
    g.position.set(x, 0, z);
    g.userData = { bulb };
    return g;
  }

  /* —— 3D booth —— */
  function canGL() {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      return false;
    }
  }

  function bootWorld() {
    if (world) return world;
    const canvas = el("snapCanvas");
    const host = canvas && canvas.parentElement;
    if (!canvas || !host) return null;
    if (!canGL()) {
      const fb = document.createElement("p");
      fb.className = "snap-fallback";
      fb.textContent = "This booth wants WebGL. The alley still loves you.";
      host.appendChild(fb);
      return null;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: (window.devicePixelRatio || 1) < 1.6,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x12080c, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x12080c, 8.5, 18);

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 48);
    camera.position.set(0.2, 1.7, 6.1);

    const root = new THREE.Group();
    scene.add(root);

    const wood = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.82, metalness: 0.04 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), wood);
    floor.rotation.x = -Math.PI / 2;
    root.add(floor);

    const velvet = new THREE.MeshStandardMaterial({ map: velvetTex(), roughness: 0.9, metalness: 0.02 });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 5.2), velvet);
    back.position.set(0, 2.6, -3.2);
    root.add(back);
    const wallL = new THREE.Mesh(new THREE.PlaneGeometry(10, 5.2), velvet);
    wallL.position.set(-6, 2.6, 0.6);
    wallL.rotation.y = Math.PI / 2;
    root.add(wallL);
    const wallR = wallL.clone();
    wallR.position.set(6, 2.6, 0.6);
    wallR.rotation.y = -Math.PI / 2;
    root.add(wallR);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), makeMat(0x2a1018, { roughness: 0.95 }));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 5.0;
    root.add(ceil);

    const stage = new THREE.Group();
    stage.position.set(0, 0, -0.2);
    root.add(stage);

    stage.add(meshBox(wood, 2.8, 0.14, 1.7, 0, 0.07, 0));
    const brass = makeMat(BRASS, { metalness: 0.55, roughness: 0.4 });
    stage.add(meshCyl(brass, 0.032, 0.038, 0.46, -1.22, 0.28, 0.7, 8));
    stage.add(meshCyl(brass, 0.032, 0.038, 0.46, 1.22, 0.28, 0.7, 8));
    stage.add(meshBox(brass, 2.5, 0.04, 0.04, 0, 0.5, 0.7));

    const backdropMat = new THREE.MeshStandardMaterial({ map: backdropTex("velvet"), roughness: 0.7, metalness: 0.02 });
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 3.1), backdropMat);
    backdrop.position.set(0, 1.85, -1.35);
    stage.add(backdrop);
    stage.add(meshBox(brass, 5.5, 0.09, 0.09, 0, 3.42, -1.35));
    stage.add(meshBox(brass, 0.09, 3.2, 0.09, -2.72, 1.85, -1.35));
    stage.add(meshBox(brass, 0.09, 3.2, 0.09, 2.72, 1.85, -1.35));

    const aura = makeAura();
    aura.position.set(0, 0.14, 0.18);
    stage.add(aura);

    const studioCam = makeStudioCam();
    studioCam.position.set(2.05, 0, 2.55);
    studioCam.rotation.y = -0.48;
    root.add(studioCam);

    const birdie = makeBirdie();
    birdie.position.set(0.55, 1.85, 0.55);
    root.add(birdie);

    const pops = new THREE.Group();
    pops.position.copy(stage.position);
    root.add(pops);

    const lamps = [
      makeLampStand(-2.4, 1.15),
      makeLampStand(2.5, 1.05),
      makeLampStand(-1.7, -0.85),
      makeLampStand(1.85, -0.7),
    ];
    lamps.forEach((l) => root.add(l));

    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.2),
      new THREE.MeshBasicMaterial({ map: plaqueTex() })
    );
    plaque.position.set(-5.85, 2.35, 0.4);
    plaque.rotation.y = Math.PI / 2;
    root.add(plaque);
    root.add(meshBox(brass, 0.06, 1.32, 2.52, -5.88, 2.35, 0.4));

    const chair = new THREE.Group();
    chair.add(meshBox(makeMat(0x2a1810), 0.55, 0.08, 0.55, 0, 0.55, 0));
    chair.add(meshBox(makeMat(0x2a1810), 0.55, 0.7, 0.08, 0, 0.95, -0.24));
    chair.add(meshCyl(brass, 0.03, 0.03, 0.55, -0.22, 0.27, -0.2));
    chair.add(meshCyl(brass, 0.03, 0.03, 0.55, 0.22, 0.27, -0.2));
    chair.add(meshCyl(brass, 0.03, 0.03, 0.55, -0.22, 0.27, 0.2));
    chair.add(meshCyl(brass, 0.03, 0.03, 0.55, 0.22, 0.27, 0.2));
    chair.position.set(-3.1, 0, 1.6);
    chair.rotation.y = 0.5;
    root.add(chair);

    const clapper = new THREE.Group();
    clapper.add(meshBox(makeMat(0x1a1010), 0.5, 0.32, 0.04, 0, 0, 0));
    clapper.add(meshBox(makeMat(0xf0d09a), 0.5, 0.06, 0.04, 0, 0.2, 0));
    clapper.position.set(-1.45, 1.2, 0.7);
    clapper.visible = false;
    stage.add(clapper);

    const stringGroup = new THREE.Group();
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe2a0 });
    for (let i = 0; i < 16; i += 1) {
      stringGroup.add(meshSphere(bulbMat, 0.05, -3.6 + i * 0.48, 4.55, -0.4 + Math.sin(i * 0.9) * 0.5));
    }
    root.add(stringGroup);

    const polaroidWall = new THREE.Group();
    polaroidWall.position.set(-5.7, 1.55, 1.6);
    polaroidWall.rotation.y = Math.PI / 2;
    root.add(polaroidWall);

    scene.add(new THREE.AmbientLight(0x2a1820, 0.58));
    const key = new THREE.SpotLight(0xffd0a8, 3.4, 16, 0.72, 0.45, 1.1);
    key.position.set(-2.4, 3.8, 3.6);
    key.target.position.set(0, 1.2, 0);
    scene.add(key);
    scene.add(key.target);
    const fill = new THREE.PointLight(0x406080, 1.5, 12, 1.6);
    fill.position.set(2.6, 2.4, 2.8);
    scene.add(fill);
    const rim = new THREE.PointLight(0xff6a88, 1.2, 9, 1.8);
    rim.position.set(0.2, 2.8, -2.0);
    scene.add(rim);
    const flash = new THREE.PointLight(0xfff4e0, 0, 14, 1.1);
    flash.position.set(0.2, 2.4, 3.4);
    scene.add(flash);
    const rec = new THREE.PointLight(0xff3030, 0.15, 3, 2);
    rec.position.set(2.05, 1.55, 2.55);
    scene.add(rec);

    const sparks = [];
    const sparkGeo = new THREE.SphereGeometry(0.03, 6, 6);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffe8b0 });

    const loader = new THREE.TextureLoader();
    loader.load("assets/prepared/snap-freeze-flash.webp", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const poster = new THREE.Mesh(
        new THREE.PlaneGeometry(1.25, 1.55),
        new THREE.MeshBasicMaterial({ map: tex })
      );
      poster.position.set(5.85, 2.15, 0.5);
      poster.rotation.y = -Math.PI / 2;
      root.add(poster);
    }, undefined, () => {});

    world = {
      renderer, scene, camera, root, stage, aura, studioCam, birdie, pops, lamps,
      backdrop, backdropMat, polaroidWall, clapper, flash, rec, fill, key, rim,
      stringGroup, sparks, sparkGeo, sparkMat, canvas, host,
      popList: [],
      raycaster: new THREE.Raycaster(),
      ndc: new THREE.Vector2(),
      _v: new THREE.Vector3(),
      look: { yaw: 0.04, pitch: 0.12, dist: 7.05 },
      hover: null,
      flashUntil: 0,
      flashKind: "",
      blackout: 0,
      clock: 0,
      lastTease: 0,
    };
    resize();
    return world;
  }

  function resize() {
    if (!world) return;
    const { canvas, host, renderer, camera } = world;
    const w = Math.max(16, host.clientWidth || canvas.clientWidth || 640);
    const h = Math.max(16, host.clientHeight || 480);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function setBackdrop(kind) {
    if (!world) return;
    const tex = backdropTex(kind);
    const old = world.backdropMat.map;
    world.backdropMat.map = tex;
    world.backdropMat.needsUpdate = true;
    if (old) old.dispose();
  }

  function burstSparks(origin, n, color) {
    if (!world) return;
    const mat = color
      ? new THREE.MeshBasicMaterial({ color })
      : world.sparkMat;
    for (let i = 0; i < n; i += 1) {
      const m = new THREE.Mesh(world.sparkGeo, mat);
      m.position.copy(origin);
      world.stage.add(m);
      world.sparks.push({
        mesh: m, ownMat: !!color,
        vx: (Math.random() - 0.5) * 3.2,
        vy: 1.2 + Math.random() * 2.8,
        vz: (Math.random() - 0.5) * 2.2,
        life: 0.45 + Math.random() * 0.4,
      });
    }
  }

  function pinPolaroid(take, pose, perfect) {
    if (!world) return;
    const tex = polaroidTex(take, pose, perfect);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.7),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    const col = world.polaroidWall.children.length;
    mesh.position.set((col % 3) * 0.62 - 0.62, 0.85 - Math.floor(col / 3) * 0.78, 0.04);
    mesh.rotation.z = (Math.random() - 0.5) * 0.18;
    world.polaroidWall.add(mesh);
    if (world.polaroidWall.children.length > 12) {
      const old = world.polaroidWall.children[0];
      world.polaroidWall.remove(old);
      if (old.material && old.material.map) old.material.map.dispose();
      if (old.material) old.material.dispose();
    }
  }

  function flyHudPolaroid(label) {
    const node = el("snapPolaroid");
    const txt = el("snapPolaroidText");
    if (txt) txt.textContent = label;
    if (!node) return;
    node.hidden = false;
    node.style.animation = "none";
    void node.offsetWidth;
    node.style.animation = "";
    clearTimeout(flyHudPolaroid._t);
    flyHudPolaroid._t = setTimeout(() => { node.hidden = true; }, 1400);
  }

  function veil(kind) {
    const v = el("snapFlashVeil");
    if (!v) return;
    v.classList.remove("is-pop", "is-fake", "is-die");
    void v.offsetWidth;
    if (kind === "real" || kind === "true") v.classList.add("is-pop");
    else if (kind === "fake") v.classList.add("is-fake");
    else if (kind === "die") v.classList.add("is-die");
  }

  function doFlash(kind) {
    if (!world) return;
    const real = kind === "real" || kind === "true";
    world.flashKind = real ? "real" : "fake";
    world.flashUntil = world.clock + (real ? 0.28 : 0.16);
    world.flash.intensity = real ? 24 : 7;
    world.flash.color.setHex(real ? 0xfff4e8 : 0xffc080);
    const bulb = world.studioCam.userData.bulb;
    if (bulb && bulb.material) {
      bulb.material.emissiveIntensity = real ? 3.2 : 1.1;
      bulb.material.color.setHex(real ? 0xffffff : 0xffd0a0);
    }
    veil(real ? "real" : "fake");
    const stage = el("snapStage");
    if (stage) {
      stage.classList.toggle("is-window", real);
      stage.classList.toggle("is-fake", !real);
    }
    if (real) {
      sfx("shutter");
      if (world.clapper) {
        world.clapper.visible = true;
        world.clapper.rotation.x = -0.55;
      }
    } else {
      sfx("fake");
    }
  }

  function clearPops() {
    if (!world) return;
    while (world.pops.children.length) {
      const c = world.pops.children[0];
      world.pops.remove(c);
    }
    world.popList.length = 0;
    world.hover = null;
    if (world.birdie) world.birdie.visible = false;
  }

  function layoutSlots(n) {
    const out = [];
    if (n <= 1) {
      out.push({ x: 0, y: 1.5, z: 0.78 });
      return out;
    }
    if (n === 2) {
      out.push({ x: -0.74, y: 1.5, z: 0.8 });
      out.push({ x: 0.74, y: 1.46, z: 0.76 });
      return out;
    }
    const cols = Math.min(4, n);
    for (let i = 0; i < n; i += 1) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const inRow = Math.min(cols, n - row * cols);
      const t = inRow <= 1 ? 0 : (col / (inRow - 1) - 0.5);
      out.push({
        x: t * 1.9,
        y: 1.22 + row * 0.55 + (col % 2) * 0.06,
        z: 0.76 - Math.abs(t) * 0.05,
      });
    }
    return out;
  }

  function spawnPops(spec) {
    if (!world) return;
    clearPops();
    const speed = spec.speed || 1;
    const kinds = [];
    const trueN = spec.need | 0;
    const fakeN = spec.fakes | 0;
    const max = Math.max(trueN, fakeN);
    for (let i = 0; i < max; i += 1) {
      if (i < trueN) kinds.push("true");
      if (i < fakeN) kinds.push("fake");
    }
    const slots = layoutSlots(kinds.length);
    kinds.forEach((kind, i) => {
      const pop = makePop(kind);
      const s = slots[i] || slots[0];
      pop.position.set(s.x, s.y, s.z);
      pop.userData.home = pop.position.clone();
      const slow = spec.pattern === "pair" && kinds.length <= 2;
      pop.userData.vx = (Math.random() - 0.5) * speed * (slow ? 0.35 : 0.9);
      pop.userData.vy = (Math.random() - 0.5) * speed * (slow ? 0.28 : 0.55);
      pop.userData.vz = (Math.random() - 0.5) * speed * 0.35;
      world.pops.add(pop);
      world.popList.push(pop);
    });
    if (spec.birdie) {
      world.birdie.visible = true;
      world.birdie.position.set(0.15, 1.95, 0.5);
    }
    world.lamps.forEach((lamp) => {
      const bulb = lamp.userData.bulb;
      if (bulb && bulb.material) {
        bulb.material.emissiveIntensity = 0.28;
        bulb.material.emissive.setHex(0xffc080);
      }
    });
  }

  function bouncePop(pop, dt, spec) {
    const u = pop.userData;
    if (u.caught) return;
    const t = world.clock;
    if (spec && spec.pattern === "pair" && u.home) {
      const a = t * (0.7 + (spec.speed || 1) * 0.25) + u.bob;
      pop.position.x = u.home.x + Math.sin(a) * 0.16;
      pop.position.y = u.home.y + Math.cos(a * 1.15) * 0.12;
      pop.position.z = u.home.z + Math.sin(a * 0.8) * 0.06;
    } else {
      pop.position.x += u.vx * dt;
      pop.position.y += u.vy * dt;
      pop.position.z += u.vz * dt;
      if (u.home) {
        const dx = pop.position.x - u.home.x;
        const dy = pop.position.y - u.home.y;
        if (Math.abs(dx) > 0.38) u.vx *= -1;
        if (Math.abs(dy) > 0.28) u.vy *= -1;
      }
    }
    pop.position.x = clamp(pop.position.x, -VIEW.x, VIEW.x);
    pop.position.y = clamp(pop.position.y, VIEW.yLo, VIEW.yHi);
    pop.position.z = clamp(pop.position.z, VIEW.zLo, VIEW.zHi);
    if (pop.position.x <= -VIEW.x || pop.position.x >= VIEW.x) u.vx *= -1;
    if (pop.position.y <= VIEW.yLo || pop.position.y >= VIEW.yHi) u.vy *= -1;
    if (pop.position.z <= VIEW.zLo || pop.position.z >= VIEW.zHi) u.vz *= -1;
    u.trailHist.push({ x: pop.position.x, y: pop.position.y, z: pop.position.z });
    if (u.trailHist.length > 6) u.trailHist.shift();
    u.trail.forEach((d, i) => {
      const src = u.trailHist[u.trailHist.length - 2 - i];
      if (src) {
        d.position.set(
          src.x - pop.position.x,
          src.y - pop.position.y,
          src.z - pop.position.z
        );
      }
    });
    const pulse = 1 + Math.sin(t * 6 + u.bob) * 0.08;
    const hoverBoost = world.hover === pop ? 1.16 : 1;
    pop.scale.setScalar(pulse * hoverBoost);
    pop.visible = true;
    if (spec && spec.blackout) {
      const on = Math.sin(t * 4.2 + u.bob) > -0.15;
      if (u.light) u.light.intensity = on ? (u.kind === "true" ? 3.4 : 1.2) : 0.18;
      if (u.glow && u.glow.material) u.glow.material.opacity = on ? 0.4 : 0.12;
      if (u.core && u.core.material) u.core.material.emissiveIntensity = on ? (u.kind === "true" ? 2.6 : 1.1) : 0.2;
    }
  }

  function tickBirdie(dt) {
    const b = world.birdie;
    if (!b || !b.visible) return;
    const t = world.clock;
    b.position.x = Math.sin(t * 1.35) * 0.7;
    b.position.y = 1.92 + Math.sin(t * 2.4) * 0.12;
    b.position.z = 0.48 + Math.cos(t * 1.1) * 0.08;
    b.rotation.y = Math.sin(t * 1.6) * 0.8;
    b.rotation.z = Math.sin(t * 8) * 0.2;
    const hover = world.hover === b;
    b.scale.setScalar(hover ? 1.25 : 1);
  }

  function liveTargets() {
    const targets = world.popList.filter((p) => p && !p.userData.caught && p.visible);
    if (world.birdie && world.birdie.visible) targets.push(world.birdie);
    return targets;
  }

  function pickUnderPointer() {
    if (!world) return null;
    world.ndc.set(pointer.nx, pointer.ny);
    world.raycaster.setFromCamera(world.ndc, world.camera);
    const targets = liveTargets();
    const hits = world.raycaster.intersectObjects(targets, true);
    for (let i = 0; i < hits.length; i += 1) {
      let o = hits[i].object;
      while (o) {
        if (o.userData && o.userData.kind && !o.userData.caught) return o;
        o = o.parent;
      }
    }
    const canvas = world.canvas;
    const w = Math.max(1, canvas.clientWidth || 1);
    const h = Math.max(1, canvas.clientHeight || 1);
    const rad = pointer.touch ? 48 : 32;
    const rad2 = rad * rad;
    const px = (pointer.nx * 0.5 + 0.5) * w;
    const py = (-pointer.ny * 0.5 + 0.5) * h;
    let best = null;
    let bestD = rad2;
    const v = world._v;
    for (let i = 0; i < targets.length; i += 1) {
      const pop = targets[i];
      pop.getWorldPosition(v);
      v.project(world.camera);
      if (v.z > 1 || v.z < -1) continue;
      const sx = (v.x * 0.5 + 0.5) * w;
      const sy = (-v.y * 0.5 + 0.5) * h;
      const d = (sx - px) * (sx - px) + (sy - py) * (sy - py);
      if (d < bestD) {
        bestD = d;
        best = pop;
      }
    }
    return best;
  }

  function setCallout(text, cls) {
    const call = el("snapCountdown");
    if (!call) return;
    call.hidden = false;
    call.textContent = text;
    call.classList.toggle("is-fake", cls === "fake");
    call.classList.toggle("is-real", cls === "real");
  }

  function paintNeed() {
    if (!run) return;
    const n = el("snapNeed");
    if (n) n.textContent = "CATCH  " + run.hits + "  /  " + run.need + "  WHITE";
    const hud = document.querySelector('[data-runkit-hud="' + GAME_ID + '"]');
    if (hud && run.spec) {
      hud.textContent = run.spec.coda
        ? "ENDLESS · TAKE " + run.spec.id + " · " + run.spec.name
        : "TAKE " + run.spec.id + " · " + run.spec.name;
    }
  }

  function paintTimer() {
    const fill = el("snapTimerFill");
    const wrap = el("snapTimerWrap");
    if (!fill || !run) return;
    if (run.phase !== "hunt") {
      fill.style.width = run.phase === "intro" ? "100%" : "0%";
      if (wrap) wrap.classList.remove("is-low");
      return;
    }
    const left = Math.max(0, run.until - performance.now());
    const pct = clamp(left / Math.max(1, run.timeMs), 0, 1) * 100;
    fill.style.width = pct + "%";
    if (wrap) wrap.classList.toggle("is-low", pct < 28);
    const sec = el("snapTimerSec");
    if (sec) sec.textContent = (left / 1000).toFixed(1) + "s";
  }

  function setReticle(hit) {
    const r = el("snapReticle");
    if (!r) return;
    r.classList.toggle("is-true", !!(hit && hit.userData.kind === "true"));
    r.classList.toggle("is-fake", !!(hit && hit.userData.kind !== "true"));
    const stage = el("snapStage");
    if (!stage || !pointer.over) {
      r.style.left = "50%";
      r.style.top = "50%";
      return;
    }
    const box = stage.getBoundingClientRect();
    r.style.left = ((pointer.x - box.left) / Math.max(1, box.width) * 100) + "%";
    r.style.top = ((pointer.y - box.top) / Math.max(1, box.height) * 100) + "%";
  }

  function applyRoomLook(spec) {
    if (!world) return;
    const kind = spec.coda
      ? BACKDROP_KIND[spec.id % BACKDROP_KIND.length]
      : BACKDROP_KIND[(spec.id - 1) % BACKDROP_KIND.length];
    setBackdrop(kind);
    world.blackout = spec.blackout ? 1 : 0;
    world.stage.rotation.y = 0;
    applyPose(world.aura, spec.wiggle ? "wave" : "peace", world.clock, false);
    world.look.yaw = 0.04;
    world.look.pitch = 0.12;
    world.look.dist = spec.spin ? 7.45 : 7.05;
  }

  function beginTake() {
    if (!run || !isLive()) return;
    const take = run.depth + 1;
    const spec = specFor(take);
    run.spec = spec;
    run.phase = "intro";
    run.hits = 0;
    run.need = spec.need | 0;
    run.timeMs = spec.timeMs;
    run.until = 0;
    run.frozen = false;
    run.pose = spec.wiggle ? POSES[take % POSES.length] : "peace";
    run.introUntil = performance.now() + INTRO_MS;
    run.grace = !!spec.grace;
    applyRoomLook(spec);
    clearPops();
    setText("snapStatus", spec.barker);
    const kitRun = rk();
    if (kitRun && kitRun.reportDepth) {
      kitRun.reportDepth(run.kitRun, run.depth, { name: spec.name, coda: !!spec.coda });
    }
    paintNeed();
    const freeze = el("snapFreeze");
    if (freeze) {
      freeze.disabled = true;
      freeze.hidden = true;
    }
    setCallout(spec.name.toUpperCase(), "");
    const hint = el("snapHint");
    if (hint) hint.textContent = spec.barker;
    if (world) world.clapper.visible = false;
  }

  function openHunt() {
    if (!run || !isLive()) return;
    if (!world) {
      run.introUntil = performance.now() + 240;
      return;
    }
    run.phase = "hunt";
    run.until = performance.now() + run.timeMs;
    spawnPops(run.spec);
    if (PLAYTEST) {
      run._pt = run._pt || { step: 0, at: 0 };
      run._pt.at = performance.now();
    }
    sfx("tick");
    setCallout("TAP THE WHITE", "real");
    paintNeed();
  }

  function removePop(pop) {
    if (!world || !pop) return;
    world.pops.remove(pop);
    const i = world.popList.indexOf(pop);
    if (i >= 0) world.popList.splice(i, 1);
    if (world.hover === pop) world.hover = null;
  }

  function catchTrue(pop) {
    if (!run || !isLive() || run.phase !== "hunt") return;
    pop.userData.caught = true;
    const origin = pop.position.clone();
    burstSparks(origin, 16, 0xfff4e0);
    doFlash("true");
    removePop(pop);
    run.hits += 1;
    const left = Math.max(0, run.until - performance.now());
    const perfect = left > run.timeMs * 0.55;
    run.score += 80 + (perfect ? 30 : 0) + run.hits * 8;
    if (run.kitRun) run.kitRun.score = run.score;
    sfx("hit");
    paintNeed();
    setCallout(run.hits + " / " + run.need, "real");
    if (world) world.clapper.rotation.x = 0.12;
    if (run.hits >= run.need) clearRoom(left, perfect);
  }

  function clearRoom(leftMs, perfect) {
    if (!run || !isLive()) return;
    run.depth += 1;
    const spec = run.spec;
    const bonus = 80 + run.depth * 12 + (perfect ? 30 : 0) + (spec.need > 1 ? 40 : 0);
    run.score += bonus;
    if (run.kitRun) run.kitRun.score = run.score;
    const kitRun = rk();
    if (kitRun && kitRun.reportDepth) {
      kitRun.reportDepth(run.kitRun, run.depth, { name: spec.name, coda: !!spec.coda });
    }
    pinPolaroid(run.depth, run.pose || "idle", perfect);
    flyHudPolaroid(perfect ? "PERFECT PLATE" : "TRUE POP");
    setText("snapMs", perfect ? "CLEAN" : "LOCKED");
    const msEl = el("snapMs");
    if (msEl) msEl.hidden = false;
    const state = PF.getState();
    if (state) {
      state.snapStreak = run.depth;
      PF.saveState();
    }
    PF.refreshNightBoard();
    if (spec.id === AUTHORED_COUNT && !spec.coda) {
      setText("snapStatus", AURA_LINE.coda);
      PF.showBanner(true, "SOUVENIR", "Eight plates. ENDLESS takes.");
    }
    run.phase = "recover";
    run.frozen = true;
    run.recoverUntil = performance.now() + RECOVER_MS;
    clearPops();
    setCallout("PLATE LOCKED", "real");
  }

  function die(reason) {
    if (!run || run.done || run.dying) return;
    run.dying = true;
    run.phase = "dying";
    run.deathReason = reason;
    veil("die");
    sfx("die");
    if (world) {
      world.flash.intensity = 0;
      applyPose(world.aura, "lookaway", world.clock, true);
    }
    const freeze = el("snapFreeze");
    if (freeze) freeze.disabled = true;
    const label = reason === "fake_out" ? "LIAR" : reason === "birdie" ? "BIRDIE" : reason === "too_late" ? "LATE" : "BURNED";
    setCallout(label, "fake");
    setText("snapStatus", reason.replace(/_/g, " "));
    setTimeout(() => finish(reason), DEATH_HOLD_MS);
  }

  function onShoot() {
    if (!cabinetOn()) return;
    if (!isLive()) {
      if (!run || run.done) start();
      return;
    }
    if (run.phase === "recover" || run.phase === "dying" || run.phase === "intro") return;
    if (run.phase !== "hunt") return;
    const hit = pickUnderPointer();
    if (!hit) {
      if (run.grace) {
        run.grace = false;
        sfx("warn");
        setCallout("THE WHITE ONE", "fake");
        setText("snapStatus", AURA_LINE.miss_air);
        return;
      }
      sfx("warn");
      setCallout("MISS", "");
      return;
    }
    const kind = hit.userData.kind;
    if (kind === "true") {
      catchTrue(hit);
      return;
    }
    if (run.grace) {
      run.grace = false;
      sfx("warn");
      setCallout(kind === "birdie" ? "NOT THE BIRDIE" : "ORANGE LIES", "fake");
      setText("snapStatus", kind === "birdie" ? AURA_LINE.birdie : "Aura: That’s the liar lamp. TAP the WHITE one.");
      return;
    }
    die(kind === "birdie" ? "birdie" : "fake_out");
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA_LINE.leave;
    if (reason === "fake_out") return AURA_LINE.fake_out;
    if (reason === "birdie") return AURA_LINE.birdie;
    if (reason === "too_late") return AURA_LINE.too_late;
    if (reason === "souvenir") return AURA_LINE.souvenir;
    if (depth >= AUTHORED_COUNT) return AURA_LINE.deep;
    if (depth >= 3) return AURA_LINE.mid;
    if (depth <= 0) return AURA_LINE.shallow;
    return AURA_LINE.mid;
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    run.phase = "result";
    const depth = run.depth | 0;
    const score = run.score | 0;
    const death = reason || run.deathReason || "unknown";
    const kitRun = rk();
    if (kitRun && typeof kitRun.finishRun === "function") {
      kitRun.finishRun(run.kitRun, {
        gameId: GAME_ID,
        depth,
        score,
        deathReason: death,
        meta: { take: depth, name: run.spec && run.spec.name },
      }, { navigate: reason !== "leave" });
    } else if (kit && kit.persistRun) {
      kit.persistRun(PF.getState(), GAME_ID, { depth, score, deathReason: death });
    }
    const aura = auraLine(death, depth);
    const challenge = (kitRun && kitRun.challengeText)
      ? kitRun.challengeText("Flash Booth", depth, GAME_ID)
      : "Beat my Flash Booth take " + depth + " on Penny Fever";
    const verdict = el("snapVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = "TAKE " + depth + " · SCORE " + score + " · " + death.replace(/_/g, " ") + " · " + aura;
    }
    if (kit && kit.fillResult) {
      kit.fillResult({
        root: "snapResult",
        depth: "snapResultDepth",
        score: "snapResultScore",
        aura: "snapResultAura",
        copied: "snapCopied",
      }, {
        depthLine: "TAKE " + depth + (run.spec && run.spec.name ? " · " + run.spec.name : ""),
        scoreLine: "SCORE " + score + " · " + String(death).replace(/_/g, " ").toUpperCase(),
        auraLine: aura,
      });
    }
    const reasonNode = el("snapResultReason");
    if (reasonNode) reasonNode.textContent = String(death).replace(/_/g, " ").toUpperCase();
    setText("snapChallengeText", challenge);
    PF.setTier("snapTier", depth > 0 ? "TAKE " + depth : "BLANK", depth > 0 ? "perfect" : "miss");
    setText("snapStatus", reason === "leave" ? "Stepped off the stall." : "Plate stamped.");
    if (kit && kit.setMode) kit.setMode(card(), "result");
    const startBtn = el("snapStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.hidden = false;
      startBtn.textContent = "AGAIN · 1 demo coin";
    }
    const freeze = el("snapFreeze");
    if (freeze) {
      freeze.disabled = true;
      freeze.hidden = true;
    }
    if (depth > 0) {
      PF.award(Math.max(8, Math.floor(score / 10)), true, "Flash Booth");
      PF.setAura(depth >= 5 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, "TAKE " + depth, score + " · " + aura);
    } else {
      PF.award(0, false, "Flash Booth miss");
      PF.setAura("laugh");
      if (reason !== "leave") PF.showBanner(false, "BLANK PLATE", aura);
    }
    const state = PF.getState();
    if (state) {
      state.bestSnap = Math.max(state.bestSnap || 0, depth);
      state.bestSnapScore = Math.max(state.bestSnapScore || 0, score);
      state.snapStreak = depth;
      PF.saveState();
    }
    PF.refreshNightBoard();
  }

  function start() {
    if (isLive()) return;
    ac();
    const kitRun = rk() && rk().startRun ? rk().startRun({ gameId: GAME_ID }) : null;
    if (!kitRun) {
      setText("snapStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      stampDepthCopy();
      return;
    }
    sfx("start");
    run = {
      done: false,
      dying: false,
      kitRun,
      depth: 0,
      score: 0,
      spec: null,
      phase: "intro",
      pose: "peace",
    };
    const state = PF.getState();
    if (state) {
      state.plays = state.plays || {};
      state.plays.snap = (state.plays.snap || 0) + 1;
      state.snapStreak = 0;
      PF.saveState();
    }
    if (kit && kit.setMode) kit.setMode(card(), "play");
    PF.focusCard("snapCard", true);
    const startBtn = el("snapStart");
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.hidden = true;
    }
    const verdict = el("snapVerdict");
    if (verdict) verdict.hidden = true;
    if (kit) kit.hideResult("snapResult");
    const msEl = el("snapMs");
    if (msEl) msEl.hidden = true;
    beginTake();
  }

  function tickGame(now) {
    if (!isLive()) return;
    if (run.phase === "intro") {
      if (now >= run.introUntil) openHunt();
      return;
    }
    if (run.phase === "recover") {
      if (now >= run.recoverUntil) beginTake();
      return;
    }
    if (run.phase === "hunt") {
      paintTimer();
      if (now >= run.until) die("too_late");
      else if (PLAYTEST) playtestDrive(now);
    }
  }

  function tickWorld(dt) {
    if (!world) return;
    world.clock += dt;
    const t = world.clock;
    const spec = run && run.spec;
    const frozen = !!(run && run.frozen && isLive());
    let pose = "idle";
    if (run && isLive()) {
      if (spec && spec.birdie && world.birdie.visible) pose = "lookaway";
      else pose = run.pose || "peace";
    }
    applyPose(world.aura, pose, t, frozen || !!(run && run.dying));

    if (spec && spec.wiggle && isLive() && !frozen) {
      world.aura.position.x = Math.sin(t * 0.85) * 0.28;
    } else if (!isLive()) {
      world.aura.position.x = Math.sin(t * 0.35) * 0.12;
    } else if (!spec || !spec.wiggle) {
      world.aura.position.x = lerp(world.aura.position.x, 0, 0.08);
    }

    if (spec && spec.spin && isLive() && !frozen && !reduceMotion) {
      world.stage.rotation.y += dt * 0.22;
    } else if (!isLive()) {
      world.stage.rotation.y = Math.sin(t * 0.22) * 0.1;
    }

    if (isLive() && run.phase === "hunt") {
      world.popList.forEach((p) => bouncePop(p, dt, spec));
      tickBirdie(dt);
    }

    const look = world.look;
    const turn = (keys.ArrowLeft || keys.KeyA ? 1 : 0) - (keys.ArrowRight || keys.KeyD ? 1 : 0);
    const nod = (keys.ArrowUp || keys.KeyW ? 1 : 0) - (keys.ArrowDown || keys.KeyS ? 1 : 0);
    look.yaw += turn * dt * 1.35;
    look.pitch += nod * dt * 0.9;
    look.pitch = clamp(look.pitch, -0.28, 0.42);
    look.yaw = clamp(look.yaw, -1.15, 1.15);

    const punch = (world.flashKind === "real" && world.clock < world.flashUntil) ? 0.32 : 0;
    const dist = look.dist - punch;
    const lx = Math.sin(look.yaw) * Math.cos(look.pitch) * dist;
    const ly = 1.45 + Math.sin(look.pitch) * dist * 0.55;
    const lz = Math.cos(look.yaw) * Math.cos(look.pitch) * dist;
    if (!reduceMotion) {
      world.camera.position.set(lx, ly, lz);
    } else {
      world.camera.position.set(0.15, 1.7, 6.1);
    }
    world.camera.lookAt(0.0, 1.25, -0.15);

    if (isLive() && run.phase === "hunt") {
      const hit = pickUnderPointer();
      if (hit !== world.hover) {
        if (hit && hit.userData.kind === "true") sfx("hover");
        world.hover = hit;
      }
      setReticle(hit);
    } else {
      world.hover = null;
      setReticle(null);
    }

    if (world.clock > world.flashUntil) {
      world.flash.intensity += (0 - world.flash.intensity) * 0.12;
      const bulb = world.studioCam.userData.bulb;
      if (bulb && bulb.material) {
        bulb.material.emissiveIntensity += (0.35 - bulb.material.emissiveIntensity) * 0.08;
      }
    }

    const night = world.blackout && isLive() && run.phase === "hunt" ? 0.1 : 1;
    world.key.intensity += ((3.4 * night) - world.key.intensity) * 0.08;
    world.fill.intensity += ((1.5 * night) - world.fill.intensity) * 0.08;
    world.rec.intensity = isLive() && run && run.phase === "hunt" ? 0.55 : 0.12;

    world.stringGroup.children.forEach((lamp, i) => {
      const on = 0.55 + Math.sin(t * 3 + i) * 0.45;
      lamp.scale.setScalar(0.85 + on * 0.25);
    });

    world.lamps.forEach((lamp, i) => {
      const bulb = lamp.userData.bulb;
      if (!bulb || !bulb.material) return;
      const pulse = 0.35 + Math.sin(t * 4 + i) * 0.2;
      if (!(spec && spec.fakes > 0 && isLive() && run.phase === "hunt")) {
        bulb.material.emissiveIntensity = pulse;
      }
    });

    for (let i = world.sparks.length - 1; i >= 0; i -= 1) {
      const s = world.sparks[i];
      s.life -= dt;
      s.vy -= 4.4 * dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      s.mesh.scale.setScalar(Math.max(0.01, s.life * 2));
      if (s.life <= 0) {
        world.stage.remove(s.mesh);
        if (s.ownMat && s.mesh.material) s.mesh.material.dispose();
        world.sparks.splice(i, 1);
      }
    }

    if (!isLive() && t - (world.lastTease || 0) > 3.6) {
      world.lastTease = t;
      doFlash("fake");
    }

    world.renderer.render(world.scene, world.camera);
  }

  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (!cabinetOn()) return;
    const now = ts || performance.now();
    const dt = Math.min(0.05, (now - (lastTs || now)) / 1000);
    lastTs = now;
    tickGame(now);
    tickWorld(dt);
  }

  function startLoop() {
    if (raf) return;
    lastTs = 0;
    raf = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function boot() {
    if (world) {
      resize();
      return world;
    }
    if (bootPromise) return bootPromise;
    reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    bootPromise = Promise.resolve().then(() => {
      bootWorld();
      resize();
      startLoop();
      return world;
    });
    return bootPromise;
  }

  const playtestLog = [];
  function pt(msg, extra) {
    const row = Object.assign({ t: Math.round(performance.now()), msg: msg }, extra || {});
    playtestLog.push(row);
    window.__pfSnapPlaytest = playtestLog.slice();
    let node = document.getElementById("snapPlaytestLog");
    if (!node) {
      node = document.createElement("pre");
      node.id = "snapPlaytestLog";
      node.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99;max-width:46rem;max-height:9rem;overflow:auto;background:#12080c;color:#f0d09a;font:12px/1.3 monospace;padding:8px;border:1px solid #d4a45a";
      document.body.appendChild(node);
    }
    node.textContent = playtestLog.map((r) => r.msg + " " + JSON.stringify(r).slice(0, 180)).join("\n");
  }

  function simulateTapOn(pop) {
    if (!world || !pop) return false;
    const v = world._v;
    pop.getWorldPosition(v);
    v.project(world.camera);
    const box = world.canvas.getBoundingClientRect();
    const x = box.left + (v.x * 0.5 + 0.5) * box.width;
    const y = box.top + (-v.y * 0.5 + 0.5) * box.height;
    const stage = el("snapStage") || world.canvas;
    const base = {
      bubbles: true, cancelable: true, clientX: x, clientY: y,
      pointerId: 7, pointerType: "mouse", buttons: 1, isPrimary: true, view: window,
    };
    stage.dispatchEvent(new PointerEvent("pointerdown", base));
    stage.dispatchEvent(new PointerEvent("pointerup", base));
    return { x: x, y: y };
  }

  function playtestDrive(now) {
    if (!run || run.phase !== "hunt" || !world) return;
    run._pt = run._pt || { at: now, step: 0 };
    const age = now - run._pt.at;
    if (run.depth === 0 && run._pt.step === 0 && age > 180) {
      run._pt.step = 1;
      const white = world.popList.find((p) => p.userData.kind === "true");
      const fake = world.popList.find((p) => p.userData.kind === "fake");
      const sep = (white && fake) ? Math.hypot(white.position.x - fake.position.x, white.position.y - fake.position.y) : 0;
      const tap = simulateTapOn(white);
      pt("tap-white", { sep: +sep.toFixed(2), tap: tap, hits: run.hits, phase: run.phase, depth: run.depth });
      return;
    }
    if (run.depth === 1 && run._pt.step < 2 && age > 200) {
      run._pt.step = 2;
      const stage = el("snapStage") || world.canvas;
      const box = stage.getBoundingClientRect();
      const x = box.left + box.width * 0.55;
      const y = box.top + box.height * 0.55;
      stage.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 8, pointerType: "touch", buttons: 1, isPrimary: true, view: window }));
      for (let i = 1; i <= 6; i += 1) {
        stage.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, cancelable: true, clientX: x + i * 22, clientY: y + i * 8, pointerId: 8, pointerType: "touch", buttons: 1, isPrimary: true, view: window }));
      }
      stage.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, clientX: x + 132, clientY: y + 48, pointerId: 8, pointerType: "touch", buttons: 1, isPrimary: true, view: window }));
      pt("drag", { live: isLive(), phase: run.phase, dying: !!run.dying, hits: run.hits });
      return;
    }
    if (run.depth === 1 && run._pt.step === 2 && age > 420 && isLive()) {
      run._pt.step = 3;
      const fake = world.popList.find((p) => p.userData.kind === "fake");
      const tap = simulateTapOn(fake);
      pt("tap-orange", { tap: tap, dying: !!run.dying, death: run.deathReason, phase: run.phase });
    }
  }

  function ndcFromEvent(ev) {
    const canvas = el("snapCanvas");
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const cx = ev.clientX;
    const cy = ev.clientY;
    pointer.x = cx;
    pointer.y = cy;
    pointer.nx = ((cx - r.left) / Math.max(1, r.width) - 0.5) * 2;
    pointer.ny = ((cy - r.top) / Math.max(1, r.height) - 0.5) * -2;
    pointer.over = cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
  }

  function setLooking(on) {
    const stage = el("snapStage");
    if (stage) stage.classList.toggle("is-looking", !!on);
  }

  function onPointerDown(ev) {
    if (ev.target && ev.target.closest && ev.target.closest("button")) return;
    if (pointer.down && pointer.id !== ev.pointerId) return;
    ev.preventDefault();
    ndcFromEvent(ev);
    pointer.down = true;
    pointer.dragging = false;
    pointer.touch = ev.pointerType === "touch" || ev.pointerType === "pen";
    pointer.id = ev.pointerId;
    pointer.sx = pointer.x;
    pointer.sy = pointer.y;
    pointer.px = pointer.x;
    pointer.py = pointer.y;
    const host = ev.currentTarget;
    try { host.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
  }

  function onPointerMove(ev) {
    if (pointer.down && ev.pointerId !== pointer.id) return;
    if (pointer.down) ev.preventDefault();
    ndcFromEvent(ev);
    if (!pointer.down) return;
    const dead = pointer.touch ? TAP_DEAD_TOUCH : TAP_DEAD_MOUSE;
    const dx0 = pointer.x - pointer.sx;
    const dy0 = pointer.y - pointer.sy;
    if (!pointer.dragging && (dx0 * dx0 + dy0 * dy0) > dead * dead) {
      pointer.dragging = true;
      setLooking(true);
    }
    if (pointer.dragging && world) {
      const dx = pointer.x - pointer.px;
      const dy = pointer.y - pointer.py;
      const feel = pointer.touch ? 0.0052 : 0.0045;
      world.look.yaw -= dx * feel;
      world.look.pitch += dy * (feel * 0.72);
      world.look.yaw = clamp(world.look.yaw, -1.15, 1.15);
      world.look.pitch = clamp(world.look.pitch, -0.28, 0.42);
    }
    pointer.px = pointer.x;
    pointer.py = pointer.y;
  }

  function endPointer(ev) {
    if (ev && pointer.id !== -1 && ev.pointerId !== pointer.id) return;
    if (ev) ndcFromEvent(ev);
    const wasDrag = pointer.dragging;
    const wasDown = pointer.down;
    pointer.down = false;
    pointer.dragging = false;
    pointer.id = -1;
    setLooking(false);
    if (!wasDown) return;
    if (wasDrag) return;
    if (!isLive()) {
      if (!run || run.done) start();
      return;
    }
    if (ev) ev.preventDefault();
    onShoot();
  }

  PF.registerVendor({
    id: "snap",
    playKey: "snap",
    chalk: "Tap the WHITE pop. The orange lamp lies.",
    defaults: { bestSnap: 0, bestSnapScore: 0, bestSnapMs: null, snapStreak: 0 },
    onLeave() {
      if (!stayingOnSnap()) {
        if (isLive() || (run && run.dying && !run.done)) finish("leave");
        stopLoop();
      }
    },
    onShow() {
      declareP0();
      stampDepthCopy();
      boot();
      startLoop();
      requestAnimationFrame(() => resize());
      const leaf = hashLeaf();
      if (leaf === "result") {
        if (kit && kit.setMode) kit.setMode(card(), "result");
        return;
      }
      if (!isLive()) {
        start();
      }
    },
    onReset() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      run = null;
      const verdict = el("snapVerdict");
      if (verdict) verdict.hidden = true;
      if (kit) kit.hideResult("snapResult");
      const startBtn = el("snapStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.hidden = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      const freeze = el("snapFreeze");
      if (freeze) {
        freeze.disabled = true;
        freeze.hidden = true;
      }
      if (kit && kit.setMode) kit.setMode(card(), "vestibule");
      stampDepthCopy();
      if (world) {
        clearPops();
        while (world.polaroidWall.children.length) {
          const old = world.polaroidWall.children[0];
          world.polaroidWall.remove(old);
        }
      }
    },
    refreshDepth(state) {
      const playing = isLive() || !!(run && run.dying);
      setText("depthSnapStreak", playing ? String(run.depth | 0) : "0");
      setText("depthSnapNow", playing ? String(run.depth | 0) : "0");
      const bestN = Math.max(state.bestSnap || 0, (state.bestDepth && state.bestDepth.snap) || 0);
      setText("depthSnapBest", bestN ? String(bestN) : "—");
      setText("depthSnapScore", playing ? String(run.score | 0) : "0");
      setText("depthSnapBestScore", state.bestSnapScore ? String(state.bestSnapScore) : "—");
      setText("depthSnapBestMs", state.bestSnapMs != null ? state.bestSnapMs + " ms" : "— ms");
      const door = el("snapDoorBest");
      if (door) door.textContent = bestN ? "Take " + bestN : "Takes —";
    },
    bind() {
      if (bound) return;
      bound = true;
      declareP0();
      const startBtn = el("snapStart");
      if (startBtn) startBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        start();
      });
      const freeze = el("snapFreeze");
      if (freeze) freeze.hidden = true;
      const stage = el("snapStage");
      const canvas = el("snapCanvas");
      const surface = stage || canvas;
      if (surface) {
        surface.style.touchAction = "none";
        surface.addEventListener("pointerdown", onPointerDown, { passive: false });
        surface.addEventListener("pointermove", onPointerMove, { passive: false });
        surface.addEventListener("pointerup", endPointer, { passive: false });
        surface.addEventListener("pointercancel", endPointer, { passive: false });
        surface.addEventListener("lostpointercapture", (ev) => {
          if (pointer.id === ev.pointerId) endPointer(ev);
        });
        surface.addEventListener("contextmenu", (ev) => ev.preventDefault());
      }
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("webglcontextlost", (ev) => {
          ev.preventDefault();
          world = null;
          bootPromise = null;
        });
        canvas.addEventListener("webglcontextrestored", () => { boot(); });
      }
      window.addEventListener("keydown", (ev) => {
        if (!cabinetOn()) return;
        keys[ev.code] = true;
        if (ev.code === "Space" || ev.key === " ") {
          ev.preventDefault();
          if (!isLive()) {
            if (!run || run.done) start();
            return;
          }
          if (!pointer.over) {
            pointer.nx = 0;
            pointer.ny = 0;
          }
          onShoot();
        }
      });
      window.addEventListener("keyup", (ev) => { keys[ev.code] = false; });
      const copyBtn = el("snapChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const last = PF.getState().lastRun || {};
          const rec = last.snap || last;
          const n = (rec && (rec.game === GAME_ID || rec.gameId === GAME_ID || last.snap))
            ? (last.snap ? last.snap.depth : rec.depth)
            : (PF.getState().bestSnap || 0);
          const text = (rk() && rk().challengeText)
            ? rk().challengeText("Flash Booth", n, GAME_ID)
            : "Beat my Flash Booth take " + n + " on Penny Fever";
          if (kit && kit.copyText) {
            kit.copyText(text, () => {
              const copied = el("snapCopied");
              if (copied) copied.hidden = false;
            });
          }
        });
      }
      window.addEventListener("resize", () => { if (cabinetOn()) resize(); });
      if (window.ResizeObserver && el("snapStage")) {
        const ro = new ResizeObserver(() => { if (cabinetOn()) resize(); });
        ro.observe(el("snapStage"));
      }
      stampDepthCopy();
    },
  });

  window.__pfSnap = function pfSnapDebug() {
    const call = el("snapCountdown");
    const need = el("snapNeed");
    const cardEl = card();
    if (!world) {
      return {
        ready: false,
        live: isLive(),
        phase: run && run.phase,
        mode: cardEl && cardEl.dataset.mode,
        callout: call && call.textContent,
        need: need && need.textContent,
      };
    }
    const box = world.canvas.getBoundingClientRect();
    const v = world._v;
    const pops = [];
    world.popList.forEach((p) => {
      p.getWorldPosition(v);
      const wx = v.x, wy = v.y, wz = v.z;
      v.project(world.camera);
      pops.push({
        kind: p.userData.kind,
        caught: !!p.userData.caught,
        visible: p.visible,
        wx: wx, wy: wy, wz: wz,
        nx: v.x, ny: v.y,
        sx: box.left + (v.x * 0.5 + 0.5) * box.width,
        sy: box.top + (-v.y * 0.5 + 0.5) * box.height,
      });
    });
    return {
      ready: true,
      live: isLive(),
      phase: run && run.phase,
      depth: run && (run.depth | 0),
      hits: run && (run.hits | 0),
      needN: run && (run.need | 0),
      spec: run && run.spec && run.spec.name,
      dying: !!(run && run.dying),
      done: !!(run && run.done),
      death: run && run.deathReason,
      mode: cardEl && cardEl.dataset.mode,
      callout: call && call.textContent,
      need: need && need.textContent,
      canvas: { w: box.width, h: box.height, l: box.left, t: box.top },
      pops: pops,
    };
  };
})();
