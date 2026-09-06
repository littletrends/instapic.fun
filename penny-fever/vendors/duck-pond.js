/* Duck Pond Hook — Night Gaff. Full 3D tent game. Desktop Grok owns this file.
 * PF only. Never booth/port 6000. Never Imagine downloads.
 * One coin = one run. Aim the brass gaff. Tap to drop. Hook the CALL. */
import * as THREE from "../world/lib/three.module.min.js";

const GAME_ID = "duckpond";
const TAU = Math.PI * 2;
const FLOCK = 10;
const DEATH_HOLD_MS = 780;
const AUTHORED_COUNT = 8;
const CODA_ENABLED = true;
const BAIT = "green";
const WATER_Y = 0.46;
const POND_R = 2.42;
const MILL_ANGLE = Math.PI;
const HOOK_FALL = 0.34;
const HOOK_DUNK = 0.1;
const HOOK_YANK = 0.14;
const BODY_PAD = 0.06;
const REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const HEADLESS = /HeadlessChrome/i.test(navigator.userAgent || "");

const PAL = {
  yellow: { body: 0xf0d09a, wing: 0xd4a45a, bill: 0xc41e3a, eye: 0x12080c, glow: 0xffe08a },
  blue: { body: 0x3d8a8a, wing: 0x2a6a6a, bill: 0xd4a45a, eye: 0xfff6ec, glow: 0x7ad4d0 },
  red: { body: 0xc41e3a, wing: 0x8a1428, bill: 0xf0d09a, eye: 0xfff6ec, glow: 0xff6a7a },
  green: { body: 0x4a7a48, wing: 0x2e5a2c, bill: 0xd4a45a, eye: 0x12080c, glow: 0x8ad48a },
};

const AURA_LINES = {
  wrong_duck: "Aura: Wrong colour. Lucky ducks aren't that one.",
  decoy: "Aura: That was a hat. Lucky ducks don't wear the call.",
  mill_lost: "Aura: The mill claimed the lucky ones. You watched them paddle by.",
  shallow: "Aura: Not a single call. The pond sped up without you.",
  mid: "Aura: Cute hooks. The pond still picks favourites.",
  deep: (n) => `Aura: Stage ${n}. Hook small, call rotating — still fishing.`,
  leave: "Aura: You walked mid-hook. Ducks keep the luck.",
  clear: "Aura: Call hooked. Pond speeds up.",
  souvenir: "Aura: Lucky Lie souvenir. The pond kept your hook.",
};

const LILIES = [
  { x: 0.92, z: 0.62, r: 0.4 },
  { x: -1.12, z: 0.18, r: 0.44 },
  { x: 0.12, z: -1.18, r: 0.38 },
  { x: 1.38, z: -0.42, r: 0.36 },
  { x: -0.72, z: -0.88, r: 0.42 },
];

const AUTHORED = [
  {
    id: 1, title: "Still Nursery", kind: "teach",
    colours: ["yellow"], need: 5, speedMul: 0.42, hookR: 0.4, wrongLimit: 3,
    lanes: 1, millRush: false, millLimit: 9, callChance: 0.58, baitChance: 0.2,
    barker: "Lead the swim. TAP commits the gaff. Hook the GLOWING yellow. Empty splash is safe.",
  },
  {
    id: 2, title: "Cross Current", kind: "crossCurrent",
    colours: ["yellow"], need: 6, speedMul: 0.55, hookR: 0.32, wrongLimit: 3,
    lanes: 2, cross: true, millRush: false, millLimit: 9, callChance: 0.5, baitChance: 0.22,
    barker: "Two rings, opposite ways. Drop ahead of the glow — the hook does not scoop.",
  },
  {
    id: 3, title: "Painted Decoy", kind: "decoyHat",
    colours: ["yellow"], need: 6, speedMul: 0.78, hookR: 0.26, wrongLimit: 2,
    lanes: 2, decoyHats: true, millRush: false, millLimit: 8, callChance: 0.42, baitChance: 0.16,
    barker: "Hats wear the call. Numbers lie. Hook the glowing BODY, not the hat.",
  },
  {
    id: 4, title: "Sinkers", kind: "diveEvent",
    colours: ["yellow"], need: 7, speedMul: 0.84, hookR: 0.24, wrongLimit: 2,
    lanes: 2, diveEvent: true, decoyHats: true, millRush: false, millLimit: 8, callChance: 0.4, baitChance: 0.16,
    barker: "True yellows dive. Hats stay up — those are decoys. Wait for the glow to surface.",
  },
  {
    id: 5, title: "Lily Maze", kind: "lilyMaze",
    colours: ["yellow"], need: 6, speedMul: 0.86, hookR: 0.24, wrongLimit: 2,
    lanes: 2, lilies: true, decoyHats: true, millRush: false, millLimit: 8, callChance: 0.38, baitChance: 0.16,
    barker: "Pads bounce the gaff. Still the glow, never the hat.",
  },
  {
    id: 6, title: "Call Flip", kind: "twinCall",
    colours: ["yellow", "blue"], need: 8, speedMul: 0.88, hookR: 0.24, wrongLimit: 2,
    lanes: 2, rotatingCall: true, rotateEveryCorrect: 1, decoyHats: true, millRush: false, millLimit: 7,
    callChance: 0.4, baitChance: 0.18,
    barker: "Lantern flips every true catch. Hats re-paint. Chase the new glow.",
  },
  {
    id: 7, title: "Mill Rush", kind: "millRush",
    colours: ["blue"], need: 8, speedMul: 0.92, hookR: 0.22, wrongLimit: 2,
    lanes: 2, millRush: true, millLimit: 2, decoyHats: true, callChance: 0.36, baitChance: 0.18,
    barker: "Call is blue glow. Hats are bait. If the mill eats two true calls, you stamp.",
  },
  {
    id: 8, title: "Fever Opera", kind: "comboFinale",
    colours: ["yellow", "blue"], need: 10, speedMul: 0.96, hookR: 0.22, wrongLimit: 2,
    lanes: 2, cross: true, decoyHats: true, diveEvent: true, lilies: true, whirl: true,
    rotatingCall: true, rotateEveryCorrect: 2, millRush: true, millLimit: 2,
    callChance: 0.34, baitChance: 0.14,
    barker: "Lead the whirl. Glow only. Hats, dives, lilies, mill — not carnival pick-a-duck.",
  },
];

const P0_MOUNT = {
  engine: "Custom",
  displayName: "Duck Pond Hook",
  depthUnit: "Pond",
  sheet: "GOBLIN_BATCH04_BUILD_SHEETS.md",
  codaEnabled: CODA_ENABLED,
  authoredCount: AUTHORED_COUNT,
};

const DEPTH_COPY = {
  tag: "DEPTH RUN · 8 authored PONDS then ENDLESS · lead the drop · glow vs hat",
  body: "Night gaff, not pick-a-duck. TAP commits — the hook does not scoop. Still Nursery → Cross Current → Painted Decoy → Sinkers → Lily Maze → Call Flip → Mill Rush → Fever Opera → ENDLESS Lucky Lie. Hook the GLOWING call body. Hats and numbers are decoys. Empty splash is safe. The mill claims true calls you miss.",
  status: "Depth run · START or tap the pond · 1 demo coin · lead the drop · glow not hats",
  machine: "Night gaff · 1 demo coin · 8 authored PONDS",
  punch: "Depth run — press START or tap the pond. Hats lie. Numbers lie. Glow is the call.",
};

const CAM_PLAY = new THREE.Vector3(0, 3.12, 5.62);
const LOOK_PLAY = new THREE.Vector3(0, 0.28, 0.08);

function duckpondCoda(n) {
  const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
  const t = stage - AUTHORED_COUNT;
  return {
    id: stage,
    title: `Lucky Lie ${stage}`,
    kind: "coda",
    colours: ["yellow", "blue", "red"],
    need: 10,
    speedMul: Math.min(1.7, 0.9 + 0.08 * t),
    hookR: Math.max(0.2, 0.3 - t * 0.008),
    wrongLimit: 2,
    rotatingCall: true,
    rotateEveryCorrect: 2,
    lanes: 2,
    cross: true,
    whirl: true,
    diveEvent: true,
    decoyHats: true,
    millRush: true,
    millLimit: 2,
    lilies: t % 2 === 1,
    coda: true,
    callChance: 0.32,
    baitChance: 0.16,
    barker: `ENDLESS — Lucky Lie ${stage}. Glow only. Hats re-paint. Lead the drop.`,
  };
}

function duckpondStageParams(n) {
  const stage = Math.max(1, n | 0);
  if (stage <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[stage - 1]);
  if (!CODA_ENABLED) return null;
  return duckpondCoda(stage);
}

function boot() {
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) {
    requestAnimationFrame(boot);
    return;
  }
  initVendor(PF);
}
boot();

function initVendor(PF) {
  const { $, kit } = PF;

  let run = null;
  let world = null;
  let raf = 0;
  let lastT = 0;
  let frameN = 0;
  let idleRoom = 1;
  let idleClock = 0;
  let intro = 0;
  let toastUntil = 0;
  let bound = false;
  let simT = 0;
  let hookPhase = "idle";
  let hookAge = 0;
  let hookCool = 0;
  let dunkTried = false;
  const commit = { on: false, x: 0, z: 0 };
  const punch = { t: 0, mag: 0 };
  const aim = { x: 0, z: 1.15 };
  const keys = { l: false, r: false, u: false, d: false };
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const _v = new THREE.Vector3();
  const _v2 = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const look = LOOK_PLAY.clone();
  const droplets = [];

  const GEO = {
    sphere: new THREE.SphereGeometry(1, 14, 12),
    sphereHi: new THREE.SphereGeometry(1, 18, 14),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
    cone: new THREE.ConeGeometry(1, 1, 8),
    box: new THREE.BoxGeometry(1, 1, 1),
    torus: new THREE.TorusGeometry(1, 0.18, 8, 18),
    plane: new THREE.PlaneGeometry(1, 1, 1, 1),
    water: new THREE.CircleGeometry(POND_R, 48),
    ring: new THREE.RingGeometry(0.22, 0.34, 28),
    circle: new THREE.CircleGeometry(1, 20),
  };

  function el(id) { return $(id); }
  function setText(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }
  function rk() { return PF.runKit || null; }
  function card() { return el("duckPondCard"); }
  function cabinetOn() {
    const node = document.getElementById("cabinet-duck-pond");
    return !!(node && !node.hidden);
  }
  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }
  function liveSpec() {
    return (run && run.spec) || duckpondStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function mat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color,
      roughness: 0.72,
      metalness: 0.08,
    }, extra || {}));
  }
  function mesh(geo, material, sx, sy, sz, x, y, z) {
    const m = new THREE.Mesh(geo, material);
    m.scale.set(sx, sy, sz);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = false;
    m.receiveShadow = false;
    return m;
  }

  function canvasTex(w, h, draw, wrap) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (wrap) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(wrap[0], wrap[1]);
    }
    return t;
  }

  function currentCall(spec, st) {
    const s = spec || liveSpec();
    if (!s.rotatingCall) return s.colours.slice();
    const idx = (st && st.callIndex != null) ? st.callIndex : (run ? run.callIndex : 0);
    return [s.colours[idx % s.colours.length]];
  }

  function callMatch(colour, spec, duck) {
    if (duck && duck.decoy) return false;
    return currentCall(spec).indexOf(colour) !== -1;
  }

  function pickColour(spec) {
    const call = currentCall(spec);
    const pool = ["yellow", "blue", "red"];
    const unlucky = pool.filter((c) => call.indexOf(c) === -1);
    const callP = spec && spec.callChance != null ? spec.callChance : 0.42;
    const baitP = spec && spec.baitChance != null ? spec.baitChance : 0.32;
    if (call.length && Math.random() < callP) return call[(Math.random() * call.length) | 0];
    if (Math.random() < baitP) return BAIT;
    if (unlucky.length) return unlucky[(Math.random() * unlucky.length) | 0];
    return BAIT;
  }

  function roomTell(spec) {
    if (!spec) return "HOOK THE GLOW";
    if (spec.kind === "coda") return "ENDLESS — GLOW ONLY · HATS LIE";
    if (spec.kind === "comboFinale") return "LEAD THE WHIRL · GLOW NOT HATS";
    if (spec.mirrorHook) return "PULL LEFT — HOOK GOES RIGHT";
    if (spec.whirl) return "WHIRLPOOL — DROP AHEAD OF THE GLOW";
    if (spec.millRush) return "MILL EATS TRUE CALLS — HATS ARE BAIT";
    if (spec.rotatingCall) return "CALL FLIPS — HATS RE-PAINT";
    if (spec.diveEvent) return "GLOW DIVES · HATS STAY UP";
    if (spec.decoyHats) return "HATS WEAR THE CALL · BODY IS TRUTH";
    if (spec.lilies) return "LILIES BOUNCE THE GAFF";
    if (spec.cross) return "TWO RINGS — LEAD THE SWIM";
    return "LEAD THE DUCK · TAP COMMITS · HOOK THE GLOW";
  }

  function hudLine(spec, playing) {
    if (!spec) return "POND 0";
    if (spec.coda) return `ENDLESS · POND ${playing} · ${spec.title}`;
    return `POND ${playing} · ${spec.title}`;
  }

  function sfx(name) {
    if (kit && typeof kit.sfx === "function") kit.sfx(name);
  }

  function tone(freq0, freq1, dur, type, vol) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    try {
      const ctx = tone._ac || (tone._ac = new Ctor());
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq0, t0);
      o.frequency.exponentialRampToValueAtTime(Math.max(40, freq1), t0 + dur);
      g.gain.setValueAtTime(vol || 0.05, t0);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch (_) { /* audio optional */ }
  }

  function sfxQuack() { tone(420, 170, 0.16, "sine", 0.05); }
  function sfxSplash() { tone(220, 90, 0.12, "triangle", 0.04); }
  function sfxMill() { tone(140, 70, 0.22, "sawtooth", 0.03); }

  function showToast(title, sub, ms) {
    const node = el("duckPondToast");
    if (!node) return;
    node.hidden = false;
    node.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ""}`;
    toastUntil = performance.now() + (ms || 1180);
  }
  function hideToastIfDue(now) {
    if (!toastUntil) return;
    if (now >= toastUntil) {
      toastUntil = 0;
      const node = el("duckPondToast");
      if (node) node.hidden = true;
    }
  }

  function waterShader() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWhirl: { value: 0 },
        uDeep: { value: new THREE.Color(0x08363c) },
        uShallow: { value: new THREE.Color(0x2a8f7c) },
        uFoam: { value: new THREE.Color(0xdff6ee) },
      },
      transparent: true,
      depthWrite: false,
      vertexShader: `
        uniform float uTime;
        uniform float uWhirl;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          vUv = uv;
          vec3 p = position;
          float r = length(p.xy);
          float w1 = sin(p.x * 1.7 + uTime * 1.7) * 0.055;
          float w2 = cos(p.y * 1.9 + uTime * 1.25) * 0.042;
          float whirl = uWhirl * sin(r * 3.4 - uTime * 2.6) * 0.09;
          p.z += w1 + w2 + whirl;
          vWave = p.z;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uDeep;
        uniform vec3 uShallow;
        uniform vec3 uFoam;
        uniform float uTime;
        uniform float uWhirl;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          vec2 c = vUv - 0.5;
          float d = length(c);
          float caustic = pow(0.5 + 0.5 * sin(vUv.x * 30.0 + uTime * 2.1) * sin(vUv.y * 24.0 - uTime * 1.55), 2.4);
          float swirl = uWhirl * 0.5 + 0.5 * sin(atan(c.y, c.x) * 6.0 - uTime * 1.8);
          float rim = smoothstep(0.42, 0.5, d);
          vec3 col = mix(uDeep, uShallow, clamp(0.38 + vWave * 3.2 + swirl * 0.12, 0.0, 1.0));
          col += uFoam * caustic * 0.26;
          col = mix(col, uFoam, rim * 0.55);
          float alpha = 0.9 + caustic * 0.06;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
  }

  function makeDuck(colour) {
    const pal = PAL[colour] || PAL.yellow;
    const g = new THREE.Group();
    const bodyM = mat(pal.body, { roughness: 0.38, metalness: 0.14 });
    const wingM = mat(pal.wing, { roughness: 0.5 });
    const billM = mat(pal.bill, { roughness: 0.32, metalness: 0.22 });
    const eyeM = mat(pal.eye, { roughness: 0.22 });
    const body = mesh(GEO.sphereHi, bodyM, 0.3, 0.17, 0.22, 0, 0.02, 0);
    g.add(body);
    g.add(mesh(GEO.sphere, bodyM, 0.14, 0.14, 0.14, 0.22, 0.13, 0));
    const bill = mesh(GEO.cone, billM, 0.058, 0.11, 0.048, 0.35, 0.11, 0);
    bill.rotation.z = -Math.PI / 2;
    g.add(bill);
    g.add(mesh(GEO.sphere, eyeM, 0.024, 0.024, 0.024, 0.28, 0.18, 0.075));
    g.add(mesh(GEO.sphere, eyeM, 0.024, 0.024, 0.024, 0.28, 0.18, -0.075));
    const wingL = mesh(GEO.sphere, wingM, 0.11, 0.045, 0.15, 0.02, 0.05, 0.18);
    const wingR = mesh(GEO.sphere, wingM, 0.11, 0.045, 0.15, 0.02, 0.05, -0.18);
    g.add(wingL);
    g.add(wingR);
    const tail = mesh(GEO.cone, bodyM, 0.07, 0.12, 0.05, -0.26, 0.1, 0);
    tail.rotation.z = 0.9;
    g.add(tail);
    const hatCrownM = mat(0xf0d09a, { roughness: 0.42 });
    const hatBrimM = mat(0xd4a45a, { roughness: 0.5 });
    const hat = new THREE.Group();
    hat.add(mesh(GEO.cyl, hatCrownM, 0.11, 0.1, 0.11, 0, 0.06, 0));
    hat.add(mesh(GEO.cyl, hatBrimM, 0.17, 0.025, 0.17, 0, 0, 0));
    hat.position.set(0.16, 0.28, 0);
    hat.visible = false;
    g.add(hat);
    const glow = mesh(GEO.sphere, mat(0xf0d09a, {
      emissive: 0xf0d09a, emissiveIntensity: 1.35, roughness: 0.22, transparent: true, opacity: 0.95,
    }), 0.09, 0.09, 0.09, 0.02, 0.28, 0);
    glow.visible = false;
    g.add(glow);
    const num = canvasTex(64, 64, (ctx) => {
      ctx.fillStyle = "#fff6ec";
      ctx.beginPath();
      ctx.arc(32, 32, 28, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#c41e3a";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = "#1a100c";
      ctx.font = "700 32px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(1 + ((Math.random() * 9) | 0)), 32, 34);
    });
    num.wrapS = num.wrapT = THREE.ClampToEdgeWrapping;
    const disc = new THREE.Mesh(GEO.circle, new THREE.MeshBasicMaterial({ map: num }));
    disc.scale.set(0.07, 0.07, 0.07);
    disc.position.set(0.02, 0.18, 0);
    disc.rotation.x = -Math.PI / 2;
    disc.visible = false;
    g.add(disc);
    g.userData = { body, bodyM, wingL, wingR, hat, hatCrownM, hatBrimM, glow, colour, disc };
    return g;
  }

  function recolorDuck(d, colour) {
    const pal = PAL[colour] || PAL.yellow;
    d.colour = colour;
    const ud = d.mesh.userData;
    ud.colour = colour;
    ud.bodyM.color.setHex(pal.body);
    ud.wingL.material.color.setHex(pal.wing);
    ud.wingR.material.color.setHex(pal.wing);
  }

  function dressDuck(d, spec) {
    if (!d || !d.mesh) return;
    const call = currentCall(spec);
    const trueCall = call.indexOf(d.colour) !== -1;
    d.decoy = !!(spec && spec.decoyHats && !trueCall);
    const ud = d.mesh.userData;
    const hex = hexForCall(call[0] || "yellow");
    if (ud.hat) ud.hat.visible = d.decoy;
    if (ud.disc) ud.disc.visible = d.decoy;
    if (ud.hatCrownM) ud.hatCrownM.color.setHex(hex);
    if (ud.hatBrimM) ud.hatBrimM.color.setHex(hex);
    if (ud.glow) {
      ud.glow.visible = trueCall;
      ud.glow.material.color.setHex(hex);
      ud.glow.material.emissive.setHex(hex);
    }
  }

  function dressFlock(spec, ducks) {
    const list = ducks || (run && run.ducks) || (world && world._idleDucks) || [];
    for (let i = 0; i < list.length; i += 1) dressDuck(list[i], spec);
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = mat(0xf0c4a8, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const hair = mat(0x3d2418, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });
    const gold = mat(0xe8b84a, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const heart = mat(0xd22b3a, { emissive: 0xd22b3a, emissiveIntensity: 0.65, roughness: 0.35 });
    const dress = mat(0x1e6b3c, { emissive: 0x0a2010, emissiveIntensity: 0.25 });
    const blouse = mat(0xf5f0ea, { emissive: 0x3a3028, emissiveIntensity: 0.18 });
    const shoe = mat(0x141414, { roughness: 0.22, metalness: 0.45 });

    const hip = new THREE.Group();
    hip.position.y = 0.55;
    g.add(hip);
    hip.add(mesh(GEO.cyl, blouse, 0.14, 0.28, 0.14, 0, 0.3, 0));
    const pinafore = mesh(GEO.cyl, dress, 0.24, 0.38, 0.24, 0, 0.06, 0);
    pinafore.scale.set(1, 1, 0.85);
    hip.add(pinafore);
    const gem = mesh(GEO.box, heart, 0.08, 0.08, 0.035, 0, 0.22, 0.16);
    gem.rotation.z = Math.PI / 4;
    hip.add(gem);

    const head = new THREE.Group();
    head.position.y = 0.62;
    hip.add(head);
    head.add(mesh(GEO.sphere, skin, 0.18, 0.18, 0.18, 0, 0.02, 0));
    head.add(mesh(GEO.sphere, hair, 0.2, 0.12, 0.2, 0, 0.1, -0.02));
    [-1, 1].forEach((side) => {
      head.add(mesh(GEO.sphere, hair, 0.1, 0.1, 0.1, side * 0.18, -0.04, 0.04));
      head.add(mesh(GEO.sphere, heart, 0.04, 0.04, 0.04, side * 0.18, 0.05, 0.06));
      head.add(mesh(GEO.sphere, mat(0xf7f2ea), 0.036, 0.042, 0.018, side * 0.055, 0.03, 0.16));
      head.add(mesh(GEO.sphere, mat(0x2a1810), 0.02, 0.02, 0.02, side * 0.055, 0.03, 0.175));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.007, 6, 10, Math.PI), mat(0xc45a6a));
    smile.position.set(0, -0.04, 0.165);
    smile.rotation.x = 2.55;
    head.add(smile);

    const crown = new THREE.Group();
    crown.position.y = 0.22;
    head.add(crown);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold);
    band.rotation.x = Math.PI / 2;
    crown.add(band);
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      const spike = new THREE.Mesh(GEO.cone, gold);
      spike.scale.set(0.035, h, 0.035);
      spike.position.set(x, h * 0.45, 0);
      crown.add(spike);
    });
    const heartGem = mesh(GEO.box, heart, 0.05, 0.05, 0.025, 0, 0.02, 0.12);
    heartGem.rotation.z = Math.PI / 4;
    crown.add(heartGem);

    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.18 : 0.08), arm ? 0.38 : 0.0, 0);
      const len = arm ? 0.3 : 0.36;
      pivot.add(mesh(GEO.cyl, arm ? skin : dress, arm ? 0.035 : 0.045, len, arm ? 0.035 : 0.045, 0, -len / 2, 0));
      if (arm) pivot.add(mesh(GEO.sphere, skin, 0.04, 0.04, 0.04, 0, -len, 0));
      else pivot.add(mesh(GEO.box, shoe, 0.08, 0.05, 0.13, 0, -len - 0.02, 0.03));
      hip.add(pivot);
      return pivot;
    }
    const armL = limb(-1, true);
    const armR = limb(1, true);
    limb(-1, false);
    limb(1, false);
    const paddle = mesh(GEO.box, mat(0xf0d09a, { emissive: 0x6a4808, emissiveIntensity: 0.25 }), 0.18, 0.26, 0.03, 0, -0.34, 0);
    armR.add(paddle);
    paddle.position.set(0, -0.42, 0.02);

    g.userData = { hip, head, armL, armR, paddle, mood: "idle", moodT: 0 };
    g.scale.setScalar(1.08);
    g.position.set(2.55, 0.02, -1.55);
    g.rotation.y = -0.85;
    return g;
  }

  function paintCallSign(ctx, label, colour) {
    ctx.fillStyle = "#1a100c";
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "#2a1810";
    ctx.fillRect(18, 18, 476, 220);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 10;
    ctx.strokeRect(18, 18, 476, 220);
    ctx.fillStyle = "#f0d09a";
    ctx.font = "700 34px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("TONIGHT'S CALL", 256, 74);
    const hex = colour === "blue" ? "#7ad4d0" : colour === "red" ? "#ff6a7a" : "#f0d09a";
    ctx.fillStyle = hex;
    ctx.font = "700 78px Georgia, serif";
    ctx.fillText(label || "YELLOW", 256, 168);
    ctx.fillStyle = "#e8a0b8";
    ctx.font = "22px Georgia, serif";
    ctx.fillText("not every duck is lucky", 256, 214);
  }

  function makeMill() {
    const g = new THREE.Group();
    const wood = mat(0x4a2e1c, { roughness: 0.78 });
    const dark = mat(0x2a1810, { roughness: 0.7 });
    const brass = mat(0xd4a45a, { metalness: 0.55, roughness: 0.35 });
    g.add(mesh(GEO.box, dark, 0.22, 1.7, 0.22, -0.72, 0.85, 0));
    g.add(mesh(GEO.box, dark, 0.22, 1.7, 0.22, 0.72, 0.85, 0));
    g.add(mesh(GEO.cyl, brass, 0.07, 1.7, 0.07, 0, 1.15, 0));
    const wheel = new THREE.Group();
    wheel.position.set(0, 1.15, 0);
    const hub = mesh(GEO.cyl, wood, 0.16, 0.22, 0.16, 0, 0, 0);
    hub.rotation.z = Math.PI / 2;
    wheel.add(hub);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * TAU;
      const paddle = mesh(GEO.box, wood, 0.08, 0.72, 0.28, Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0);
      paddle.rotation.z = a + Math.PI / 2;
      wheel.add(paddle);
    }
    g.add(wheel);
    g.add(mesh(GEO.box, dark, 1.8, 0.16, 0.7, 0, 0.28, 0.15));
    g.position.set(0, 0.08, -2.72);
    g.userData = { wheel };
    return g;
  }

  function buildWorld(canvas) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !REDUCE,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(HEADLESS ? 1 : Math.min(REDUCE ? 1.2 : 1.7, window.devicePixelRatio || 1));
    renderer.setClearColor(0x061014, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1a18, 0.024);
    const camera = new THREE.PerspectiveCamera(48, 1, 0.12, 80);
    camera.position.copy(CAM_PLAY);
    camera.lookAt(LOOK_PLAY);

    scene.add(new THREE.HemisphereLight(0xffe2b0, 0x0a2a28, 0.78));
    const sun = new THREE.DirectionalLight(0xffe6c4, 0.88);
    sun.position.set(2.4, 6.4, 5.2);
    scene.add(sun);
    const lanternA = new THREE.PointLight(0xffb45a, 1.4, 12, 2);
    lanternA.position.set(-1.7, 3.2, 0.5);
    scene.add(lanternA);
    const lanternB = new THREE.PointLight(0x7ad4d0, 0.55, 9, 2);
    lanternB.position.set(2.2, 2.7, -1.1);
    scene.add(lanternB);
    const pondGlow = new THREE.PointLight(0x3d8a8a, 0.85, 8, 2);
    pondGlow.position.set(0, 0.9, 0);
    scene.add(pondGlow);
    const callLight = new THREE.PointLight(0xf0d09a, 1.1, 7, 2);
    callLight.position.set(0, 2.35, -0.2);
    scene.add(callLight);

    const stripe = canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#143022";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 12; i += 1) {
        ctx.fillStyle = i % 2 ? "#1e4a32" : "#f0d09a";
        ctx.fillRect(i * 22, 0, 22, 256);
      }
    }, [3, 2]);
    const canvasMat = new THREE.MeshStandardMaterial({
      map: stripe, roughness: 0.9, metalness: 0.02, side: THREE.BackSide,
    });
    const tent = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.6, 6.6, 10, 1, true), canvasMat);
    tent.position.y = 3.15;
    scene.add(tent);
    const peak = new THREE.Mesh(new THREE.ConeGeometry(7.6, 2.5, 10), canvasMat);
    peak.position.y = 7.15;
    scene.add(peak);

    const wood = canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 18; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${0.05 + (i % 3) * 0.03})`;
        ctx.fillRect(i * 14 + 4, 0, 3, 256);
      }
    }, [6, 6]);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(8.4, 28), mat(0x3a2418, { map: wood, roughness: 0.88 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const basin = new THREE.Mesh(
      new THREE.CylinderGeometry(POND_R + 0.18, POND_R + 0.08, 0.58, 40),
      mat(0x1a100c, { roughness: 0.7 }),
    );
    basin.position.y = 0.2;
    scene.add(basin);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(POND_R + 0.12, 0.12, 10, 48),
      mat(0x5a3a22, { roughness: 0.52, metalness: 0.14 }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = WATER_Y + 0.02;
    scene.add(rim);

    const waterMat = waterShader();
    const water = new THREE.Mesh(GEO.water, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = WATER_Y;
    scene.add(water);

    const hitPlane = new THREE.Mesh(
      new THREE.CircleGeometry(POND_R + 0.15, 24),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
    );
    hitPlane.rotation.x = -Math.PI / 2;
    hitPlane.position.y = WATER_Y;
    scene.add(hitPlane);

    const lilyGroup = new THREE.Group();
    LILIES.forEach((p, i) => {
      const pad = mesh(GEO.cyl, mat(i % 2 ? 0x2e6a3a : 0x3a7a42, { roughness: 0.68 }), p.r, 0.035, p.r, p.x, WATER_Y + 0.03, p.z);
      pad.userData.baseR = p.r;
      lilyGroup.add(pad);
      const flower = mesh(GEO.sphere, mat(0xf0d09a, { emissive: 0x6a4808, emissiveIntensity: 0.2 }), 0.05, 0.03, 0.05, p.x, WATER_Y + 0.07, p.z);
      lilyGroup.add(flower);
    });
    scene.add(lilyGroup);

    const reedM = mat(0x2a5a32);
    for (let i = 0; i < 14; i += 1) {
      const a = 0.35 + i * 0.18;
      const reed = mesh(GEO.cyl, reedM, 0.018, 0.75 + (i % 3) * 0.18, 0.018, 0, 0, 0);
      reed.position.set(Math.cos(a) * 2.85 - 0.2, 0.62, Math.sin(a) * 2.55 - 1.4);
      reed.rotation.z = ((i % 5) - 2) * 0.05;
      scene.add(reed);
    }

    const counter = mesh(GEO.box, mat(0x4a2e1c, { map: wood, roughness: 0.7 }), 4.2, 0.2, 0.78, 0, 1.08, 2.72);
    scene.add(counter);
    scene.add(mesh(GEO.box, mat(0x2a1810), 4.2, 0.95, 0.2, 0, 0.58, 3.02));

    const bunting = canvasTex(512, 64, (ctx) => {
      ctx.clearRect(0, 0, 512, 64);
      const cols = ["#c41e3a", "#f0d09a", "#1e6b3c", "#3d8a8a"];
      for (let i = 0; i < 10; i += 1) {
        ctx.fillStyle = cols[i % cols.length];
        ctx.beginPath();
        ctx.moveTo(i * 52, 4);
        ctx.lineTo(i * 52 + 46, 4);
        ctx.lineTo(i * 52 + 23, 58);
        ctx.closePath();
        ctx.fill();
      }
    });
    bunting.wrapS = bunting.wrapT = THREE.ClampToEdgeWrapping;
    const flags = new THREE.Mesh(
      new THREE.PlaneGeometry(7.4, 0.55),
      new THREE.MeshBasicMaterial({ map: bunting, transparent: true, side: THREE.DoubleSide }),
    );
    flags.position.set(0, 4.45, -2.55);
    scene.add(flags);

    const callCanvas = document.createElement("canvas");
    callCanvas.width = 512;
    callCanvas.height = 256;
    const callCtx = callCanvas.getContext("2d");
    paintCallSign(callCtx, "YELLOW", "yellow");
    const callTex = new THREE.CanvasTexture(callCanvas);
    callTex.colorSpace = THREE.SRGBColorSpace;
    const callBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(1.85, 0.92),
      new THREE.MeshBasicMaterial({ map: callTex }),
    );
    callBoard.position.set(-0.15, 2.72, -2.28);
    scene.add(callBoard);

    const callLantern = new THREE.Group();
    const glass = mesh(GEO.sphere, mat(0xf0d09a, {
      emissive: 0xf0d09a, emissiveIntensity: 0.85, roughness: 0.25, metalness: 0.15, transparent: true, opacity: 0.92,
    }), 0.22, 0.26, 0.22, 0, 0, 0);
    callLantern.add(glass);
    callLantern.add(mesh(GEO.cyl, mat(0xd4a45a, { metalness: 0.6, roughness: 0.3 }), 0.08, 0.08, 0.08, 0, 0.28, 0));
    callLantern.add(mesh(GEO.cyl, mat(0xd4a45a, { metalness: 0.55 }), 0.012, 0.7, 0.012, 0, 0.68, 0));
    callLantern.position.set(0, 2.15, 0);
    scene.add(callLantern);

    const mill = makeMill();
    scene.add(mill);

    const shelf = mesh(GEO.box, mat(0x3a2418), 1.5, 0.08, 0.42, -2.55, 1.42, 0.15);
    scene.add(shelf);

    const lanternGroup = new THREE.Group();
    [-1.7, 0, 1.7].forEach((x, i) => {
      const lamp = new THREE.Group();
      lamp.add(mesh(GEO.sphere, mat(0xffc878, { emissive: 0xffb45a, emissiveIntensity: 0.9 }), 0.13, 0.15, 0.13, 0, 0, 0));
      lamp.add(mesh(GEO.cyl, mat(0x3a2418), 0.04, 0.08, 0.04, 0, 0.13, 0));
      lamp.position.set(x, 3.62, 0.7 - i * 0.12);
      lanternGroup.add(lamp);
    });
    scene.add(lanternGroup);

    const bulbs = new THREE.Group();
    for (let i = 0; i < 18; i += 1) {
      const b = mesh(GEO.sphere, mat(0xffe6a0, { emissive: 0xffc040, emissiveIntensity: 0.75 }), 0.04, 0.04, 0.04, 0, 0, 0);
      const t = i / 17;
      b.position.set(-4.2 + t * 8.4, 4.12 - Math.sin(t * Math.PI) * 0.28, 2.55);
      bulbs.add(b);
    }
    scene.add(bulbs);

    const motesGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(56 * 3);
    for (let i = 0; i < 56; i += 1) {
      motePos[i * 3] = (Math.random() - 0.5) * 8;
      motePos[i * 3 + 1] = 0.6 + Math.random() * 3.8;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    motesGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
    const motes = new THREE.Points(motesGeo, new THREE.PointsMaterial({
      color: 0xf0d09a, size: 0.045, transparent: true, opacity: 0.42, depthWrite: false,
    }));
    scene.add(motes);

    const aura = makeAura();
    scene.add(aura);

    const ducksGroup = new THREE.Group();
    scene.add(ducksGroup);

    const hook = new THREE.Group();
    const brass = mat(0xd4a45a, { metalness: 0.74, roughness: 0.26, emissive: 0x5a3a10, emissiveIntensity: 0.22 });
    hook.add(mesh(GEO.cyl, brass, 0.02, 0.3, 0.02, 0, 0.14, 0));
    const bend = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 8, 16, Math.PI * 1.28), brass);
    bend.rotation.x = Math.PI / 2;
    bend.position.set(0.055, -0.02, 0);
    hook.add(bend);
    const tip = mesh(GEO.cone, brass, 0.02, 0.07, 0.02, 0.12, -0.02, 0);
    tip.rotation.z = 1.2;
    hook.add(tip);
    hook.position.set(0, WATER_Y + 0.42, 1.15);
    scene.add(hook);

    const poleGeo = new THREE.CylinderGeometry(0.016, 0.03, 1, 8);
    poleGeo.translate(0, 0.5, 0);
    const pole = new THREE.Mesh(poleGeo, mat(0x5a3a22, { roughness: 0.58 }));
    scene.add(pole);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -1, 0)]);
    const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xf0d09a, transparent: true, opacity: 0.7 }));
    scene.add(line);

    const target = new THREE.Mesh(
      GEO.ring,
      new THREE.MeshBasicMaterial({ color: 0xf0d09a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }),
    );
    target.rotation.x = -Math.PI / 2;
    target.position.y = WATER_Y + 0.03;
    scene.add(target);

    const ripples = [];
    for (let i = 0; i < 10; i += 1) {
      const r = new THREE.Mesh(
        new THREE.RingGeometry(0.05, 0.12, 22),
        new THREE.MeshBasicMaterial({ color: 0xdff6ee, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
      );
      r.rotation.x = -Math.PI / 2;
      r.visible = false;
      scene.add(r);
      ripples.push({ mesh: r, t: 0, life: 0 });
    }

    const dropGroup = new THREE.Group();
    for (let i = 0; i < 18; i += 1) {
      const d = mesh(GEO.sphere, mat(0xb8e8e0, { transparent: true, opacity: 0.7 }), 0.03, 0.04, 0.03, 0, 0, 0);
      d.visible = false;
      dropGroup.add(d);
      droplets.push({ mesh: d, vx: 0, vy: 0, vz: 0, life: 0 });
    }
    scene.add(dropGroup);

    const wash = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ color: 0xc41e3a, transparent: true, opacity: 0, depthTest: false }),
    );
    wash.renderOrder = 20;
    camera.add(wash);
    wash.position.z = -0.35;
    scene.add(camera);

    return {
      renderer, scene, camera, water, waterMat, hitPlane, hook, pole, line, target,
      aura, ducksGroup, lanternGroup, motes, callBoard, callTex, callCanvas, callCtx,
      callLantern, callGlass: glass, callLight, mill, lilyGroup, ripples, wash,
      lanternA, pondGlow, sun, introCam: true,
    };
  }

  function spawnRipple(x, z) {
    if (!world) return;
    const slot = world.ripples.find((r) => r.life <= 0) || world.ripples[0];
    slot.t = 0;
    slot.life = 1;
    slot.mesh.visible = true;
    slot.mesh.position.set(x, WATER_Y + 0.02, z);
    slot.mesh.scale.setScalar(1);
    slot.mesh.material.opacity = 0.6;
  }

  function burstDrops(x, z, n) {
    let used = 0;
    for (let i = 0; i < droplets.length && used < (n || 8); i += 1) {
      const d = droplets[i];
      if (d.life > 0) continue;
      d.life = 0.55 + Math.random() * 0.25;
      d.vx = (Math.random() - 0.5) * 1.6;
      d.vy = 1.4 + Math.random() * 1.4;
      d.vz = (Math.random() - 0.5) * 1.6;
      d.mesh.visible = true;
      d.mesh.position.set(x, WATER_Y + 0.08, z);
      used += 1;
    }
  }

  function setAuraMood(mood) {
    if (!world || !world.aura) return;
    world.aura.userData.mood = mood;
    world.aura.userData.moodT = 0.95;
  }

  function updateAura(dt, t) {
    const a = world && world.aura;
    if (!a) return;
    const ud = a.userData;
    ud.moodT = Math.max(0, ud.moodT - dt);
    const sway = REDUCE ? 0 : Math.sin(t * 1.35) * 0.045;
    ud.hip.rotation.y = sway;
    ud.head.rotation.y = sway * 0.65;
    if (ud.mood === "cheer" && ud.moodT > 0) {
      ud.armL.rotation.z = 2.15;
      ud.armR.rotation.z = -2.15;
    } else if (ud.mood === "point" && ud.moodT > 0) {
      ud.armR.rotation.z = -0.15;
      ud.armR.rotation.x = -0.95;
      ud.armL.rotation.z = 0.25;
    } else {
      ud.armL.rotation.z = 0.32 + Math.sin(t * 2.05) * 0.12;
      ud.armR.rotation.z = -0.52 + Math.sin(t * 1.55) * 0.08;
      ud.armR.rotation.x = -0.22;
    }
    if (ud.moodT <= 0) ud.mood = "idle";
  }

  function hexForCall(c) {
    return c === "blue" ? 0x3d8a8a : c === "red" ? 0xc41e3a : 0xf0d09a;
  }

  function updateCallSign(spec) {
    if (!world) return;
    const call = currentCall(spec);
    const label = call.join(" / ").toUpperCase() || "YELLOW";
    paintCallSign(world.callCtx, label, call[0] || "yellow");
    world.callTex.needsUpdate = true;
    const chip = el("duckPondCallChip");
    if (chip) chip.dataset.call = call[0] || "yellow";
    setText("duckPondCall", label);
    const hex = hexForCall(call[0]);
    if (world.callGlass) {
      world.callGlass.material.color.setHex(hex);
      world.callGlass.material.emissive.setHex(hex);
    }
    if (world.callLight) world.callLight.color.setHex(hex);
    if (world.target && hookPhase === "idle") world.target.material.color.setHex(hex);
    if (world.aura && world.aura.userData.paddle) {
      world.aura.userData.paddle.material.color.setHex(hex);
    }
    dressFlock(spec);
  }

  function tintStage(spec) {
    if (!world) return;
    const deep = spec.whirl ? 0x062e3a : spec.kind === "comboFinale" ? 0x2a1020 : spec.millRush ? 0x0a2438 : 0x08363c;
    const shallow = spec.whirl ? 0x1a7a8a : spec.kind === "comboFinale" ? 0x8a3a5a : 0x2a8f7c;
    world.waterMat.uniforms.uDeep.value.setHex(deep);
    world.waterMat.uniforms.uShallow.value.setHex(shallow);
    world.waterMat.uniforms.uWhirl.value = spec.whirl ? 1 : (spec.kind === "comboFinale" ? 0.45 : 0);
    const fog = spec.kind === "comboFinale" ? 0x1a0c14 : spec.whirl ? 0x0a2428 : 0x0b1a18;
    world.scene.fog.color.setHex(fog);
    world.renderer.setClearColor(fog, 1);
    if (world.lilyGroup) {
      world.lilyGroup.visible = !!spec.lilies;
    }
  }

  function isDiving(d, t) {
    if (!d || d.decoy) return false;
    if (d.diveUntil && t < d.diveUntil) return true;
    if (d.sineDive) return Math.sin(t * 2.2 + d.phase) > 0.42;
    return false;
  }

  function duckWorldPos(d) {
    return {
      x: Math.sin(d.angle) * d.radius,
      z: Math.cos(d.angle) * d.radius,
    };
  }

  function onLily(x, z, spec) {
    if (!spec || !spec.lilies) return false;
    for (let i = 0; i < LILIES.length; i += 1) {
      const p = LILIES[i];
      if (Math.hypot(p.x - x, p.z - z) < p.r * 0.92) return true;
    }
    return false;
  }

  function clampAim() {
    const r = Math.hypot(aim.x, aim.z);
    const max = POND_R - 0.18;
    if (r > max) {
      aim.x = (aim.x / r) * max;
      aim.z = (aim.z / r) * max;
    }
  }

  function clearGroup(g) {
    if (!g) return;
    while (g.children.length) g.remove(g.children[0]);
  }

  function seedFlock(spec) {
    if (!world) return [];
    clearGroup(world.ducksGroup);
    const ducks = [];
    const lanes = spec.lanes || 1;
    for (let i = 0; i < FLOCK; i += 1) {
      const colour = pickColour(spec);
      const meshDuck = makeDuck(colour);
      world.ducksGroup.add(meshDuck);
      const lane = lanes > 1 ? (i % 2) : 0;
      const d = {
        mesh: meshDuck,
        colour,
        angle: (i / FLOCK) * TAU + Math.random() * 0.2,
        radius: lane === 0 ? 1.55 : 2.05,
        dir: spec.cross && lane === 1 ? -1 : 1,
        phase: Math.random() * TAU,
        caught: false,
        lift: 0,
        flee: 0,
        decoy: false,
        sineDive: false,
        diveUntil: 0,
        millGate: false,
      };
      dressDuck(d, spec);
      d.sineDive = !!(spec.diveEvent && !d.decoy && (callMatch(d.colour, spec, d)) && i % 3 !== 0);
      ducks.push(d);
    }
    return ducks;
  }

  function recycleDuck(d, spec) {
    d.caught = false;
    d.lift = 0;
    d.flee = 0;
    d.angle = d.dir > 0 ? 0.15 : TAU - 0.15;
    const colour = pickColour(spec);
    recolorDuck(d, colour);
    dressDuck(d, spec);
    d.sineDive = !!(spec.diveEvent && !d.decoy && callMatch(d.colour, spec, d));
    d.diveUntil = 0;
    d.millGate = false;
    d.mesh.rotation.set(0, 0, 0);
    d.mesh.visible = true;
  }

  function crossedMill(prev, next, dir) {
    const a0 = ((prev % TAU) + TAU) % TAU;
    const a1 = ((next % TAU) + TAU) % TAU;
    if (dir > 0) {
      if (a0 < MILL_ANGLE && a1 >= MILL_ANGLE) return true;
      if (a1 < a0 && a0 < MILL_ANGLE) return true;
    } else {
      if (a0 > MILL_ANGLE && a1 <= MILL_ANGLE) return true;
      if (a1 > a0 && a0 > MILL_ANGLE) return true;
    }
    return false;
  }

  function hookHeight() {
    if (hookPhase === "fall") return lerp(0.46, -0.05, clamp(hookAge / HOOK_FALL, 0, 1));
    if (hookPhase === "dunk") return -0.05 + Math.sin(simT * 14) * 0.012;
    if (hookPhase === "yank") return lerp(-0.05, 0.46, clamp(hookAge / HOOK_YANK, 0, 1));
    return 0.46 + Math.sin(simT * 3.1) * 0.012;
  }

  function applyHookPose() {
    if (!world) return;
    const hx = commit.on ? commit.x : aim.x;
    const hz = commit.on ? commit.z : aim.z;
    const y = WATER_Y + hookHeight();
    world.hook.position.set(hx, y, hz);
    world.hook.rotation.y = Math.sin(simT * 2.2) * 0.08;
    world.hook.rotation.z = hookPhase === "dunk" || hookPhase === "fall" ? 0.45 : 0.08;
    const spec = liveSpec();
    const hookR = (spec && spec.hookR) || 0.3;
    world.hook.scale.setScalar(0.82 + hookR * 1.1);
    world.target.position.set(hx, WATER_Y + 0.03, hz);
    const pulse = hookPhase === "idle" ? 1 + Math.sin(simT * 6) * 0.06 : 1;
    const fallK = hookPhase === "fall" ? clamp(hookAge / HOOK_FALL, 0, 1) : (hookPhase === "dunk" ? 1 : 0);
    const ringScale = ((hookR + BODY_PAD) / 0.34) * (1 - fallK * 0.18) * pulse;
    world.target.scale.setScalar(Math.max(0.5, ringScale));
    world.target.material.opacity = hookPhase === "idle" ? 0.82 : 0.95;
    if (hookPhase === "idle") {
      world.target.material.color.setHex(hexForCall(currentCall(spec)[0]));
    } else {
      world.target.material.color.setHex(0xfff6ec);
    }
    const cam = world.camera;
    _v.set(0.55, -0.22, -0.62).applyMatrix4(cam.matrixWorld);
    const end = world.hook.position;
    world.pole.position.copy(_v);
    _v2.copy(end).sub(_v);
    const dist = Math.max(0.05, _v2.length());
    world.pole.scale.set(1, dist, 1);
    world.pole.quaternion.setFromUnitVectors(UP, _v2.normalize());
    const pos = world.line.geometry.attributes.position;
    pos.setXYZ(0, _v.x, _v.y, _v.z);
    pos.setXYZ(1, end.x, end.y + 0.12, end.z);
    pos.needsUpdate = true;
  }

  function hookXZ() {
    return commit.on ? { x: commit.x, z: commit.z } : { x: aim.x, z: aim.z };
  }

  function duckPosAt(d, dtAhead) {
    const spec = liveSpec();
    const speed = 0.72 * (spec.speedMul || 0.55) * (spec.whirl ? 1.22 : 1);
    const ang = d.angle + d.dir * speed * dtAhead;
    return { x: Math.sin(ang) * d.radius, z: Math.cos(ang) * d.radius };
  }

  function nearestDuck(spec, radius, dtAhead, onlyCall) {
    if (!run || !run.ducks) return null;
    let best = null;
    let bestD = radius;
    const t = simT;
    const hz = hookXZ();
    const ahead = dtAhead || 0;
    for (let i = 0; i < run.ducks.length; i += 1) {
      const d = run.ducks[i];
      if (d.caught || d.flee > 0) continue;
      if (isDiving(d, t + ahead)) continue;
      if (onlyCall && !callMatch(d.colour, spec, d)) continue;
      const p = ahead ? duckPosAt(d, ahead) : duckWorldPos(d);
      const dist = Math.hypot(p.x - hz.x, p.z - hz.z);
      if (dist < bestD) {
        best = d;
        bestD = dist;
      }
    }
    return best;
  }

  function splashRadius(spec) {
    return ((spec && spec.hookR) || 0.28) + BODY_PAD;
  }

  function splashTarget(spec) {
    const r = splashRadius(spec);
    return nearestDuck(spec, r, 0, true) || nearestDuck(spec, r, 0, false);
  }

  function splashMiss(spec) {
    const r = splashRadius(spec) * 1.2;
    const late = nearestDuck(spec, r, -0.16, true) || nearestDuck(spec, r, -0.16, false);
    const early = nearestDuck(spec, r, 0.22, true) || nearestDuck(spec, r, 0.22, false);
    if (late) {
      showToast("LATE", "They swam through — drop ahead of the glow", 900);
      setText("duckPondStatus", "LATE — lead the swim. The hook does not scoop.");
      return;
    }
    if (early) {
      showToast("EARLY", "Wait for the glow, then drop", 900);
      setText("duckPondStatus", "EARLY — they aren't under yet. Time the splash.");
      return;
    }
    setText("duckPondStatus", "Air. Soft miss — not a strike.");
  }

  function tryCatch() {
    if (!isLive() || dunkTried) return;
    const spec = run.spec;
    const d = splashTarget(spec);
    if (!d) {
      dunkTried = true;
      splashMiss(spec);
      return;
    }
    dunkTried = true;
    if (callMatch(d.colour, spec, d)) catchGood(d, spec);
    else catchWrong(d, spec);
  }

  function dropHook() {
    if (!isLive()) return;
    if (hookPhase !== "idle" || hookCool > 0) return;
    if (run.stageHold > 0) return;
    const spec = run.spec;
    if (onLily(aim.x, aim.z, spec)) {
      spawnRipple(aim.x, aim.z);
      burstDrops(aim.x, aim.z, 5);
      sfxSplash();
      showToast("LILY", "Pads bounce the gaff — drop in open water", 900);
      setText("duckPondStatus", "Lily bounce. Open water only.");
      hookCool = 0.22;
      return;
    }
    commit.on = true;
    commit.x = aim.x;
    commit.z = aim.z;
    hookPhase = "fall";
    hookAge = 0;
    dunkTried = false;
    sfx("drop");
  }

  function tickHook(dt) {
    if (hookCool > 0) hookCool = Math.max(0, hookCool - dt);
    if (hookPhase === "idle") return;
    hookAge += dt;
    if (hookPhase === "fall") {
      if (hookAge >= HOOK_FALL) {
        hookPhase = "dunk";
        hookAge = 0;
        const hz = hookXZ();
        spawnRipple(hz.x, hz.z);
        burstDrops(hz.x, hz.z, 10);
        sfxSplash();
        tryCatch();
      }
    } else if (hookPhase === "dunk") {
      if (hookAge >= HOOK_DUNK) {
        hookPhase = "yank";
        hookAge = 0;
      }
    } else if (hookPhase === "yank") {
      if (hookAge >= HOOK_YANK) {
        hookPhase = "idle";
        hookAge = 0;
        hookCool = 0.1;
        commit.on = false;
      }
    }
  }

  function catchGood(d, spec) {
    d.caught = true;
    d.lift = 0.01;
    run.caught += 1;
    run.score += 40;
    sfx("tray");
    sfxQuack();
    spawnRipple(aim.x, aim.z);
    punch.t = 1;
    punch.mag = 0.07;
    setAuraMood("cheer");
    hookPhase = "yank";
    hookAge = 0;
    showToast("TRUE CALL", `${d.colour.toUpperCase()} glow · ${run.caught}/${spec.need}`, 720);
    if (spec.rotatingCall && spec.colours.length > 1) {
      const every = spec.rotateEveryCorrect || 1;
      if (run.caught % every === 0) {
        run.callIndex = (run.callIndex + 1) % spec.colours.length;
        updateCallSign(spec);
        setText("duckPondStatus", `Call rotates — now ${currentCall(spec).join(" / ").toUpperCase()} glow. ${run.caught}/${spec.need}`);
      } else {
        setText("duckPondStatus", `True call. ${run.caught}/${spec.need}`);
      }
    } else {
      setText("duckPondStatus", `True call. ${run.caught}/${spec.need}`);
    }
    paintNeed();
    if (run.kitRun) run.kitRun.score = run.score;
    if (run.caught >= spec.need) clearStage();
  }

  function catchWrong(d, spec) {
    d.flee = 0.75;
    run.wrong += 1;
    sfx("spit");
    sfxQuack();
    spawnRipple(aim.x, aim.z);
    punch.t = 1;
    punch.mag = 0.12;
    setAuraMood("point");
    if (world) world.wash.material.opacity = 0.28;
    tellStrike(d.decoy ? "decoy" : "wrong_duck");
    ensurePips((spec && spec.wrongLimit) || 3);
    if (d.decoy) {
      setText("duckPondStatus", `Decoy hat. Body was ${d.colour}. ${run.wrong}/${spec.wrongLimit}.`);
      showToast("DECOY", `Hat wore the call. Body is ${d.colour}. ${run.wrong}/${spec.wrongLimit}`, 920);
    } else {
      setText("duckPondStatus", `Wrong colour. Released. ${run.wrong}/${spec.wrongLimit}.`);
      showToast("WRONG DUCK", `${d.colour.toUpperCase()} isn't the call. ${run.wrong}/${spec.wrongLimit}`, 820);
    }
    hookPhase = "yank";
    hookAge = 0;
    if (run.wrong >= spec.wrongLimit) beginDeath(d.decoy ? "decoy" : "wrong_duck");
  }

  function millClaim(d, spec) {
    if (!isLive() || !spec.millRush) {
      recycleDuck(d, spec);
      return;
    }
    const lucky = callMatch(d.colour, spec, d);
    sfxMill();
    spawnRipple(0, -POND_R + 0.2);
    burstDrops(0, -POND_R + 0.15, 8);
    if (lucky) {
      run.millLost += 1;
      tellStrike("mill_lost");
      paintMill();
      setAuraMood("point");
      showToast("MILL", `Lucky duck went over · ${run.millLost}/${spec.millLimit}`, 900);
      setText("duckPondStatus", `Mill ate a ${d.colour} call duck. ${run.millLost}/${spec.millLimit}.`);
      if (world) world.wash.material.opacity = 0.18;
      if (run.millLost >= spec.millLimit) {
        recycleDuck(d, spec);
        beginDeath("mill_lost");
        return;
      }
    }
    recycleDuck(d, spec);
  }

  function clearStage() {
    run.depth = run.stage;
    run.score += 280;
    if (run.kitRun) {
      run.kitRun.depth = run.depth;
      run.kitRun.score = run.score;
    }
    tellDepth(run.depth);
    sfx("chapter");
    setAuraMood("cheer");
    PF.setAura("celebrate");
    const next = run.stage + 1;
    const nxt = duckpondStageParams(next);
    if (!nxt) {
      beginDeath("souvenir");
      return;
    }
    showToast(run.spec.title, "CALL HOOKED — NEXT POND", 900);
    setText("duckPondStatus", AURA_LINES.clear);
    run.stageHold = 0.9;
    run.pendingNext = next;
  }

  function beginDeath(reason) {
    if (!run || run.dying || run.done) return;
    if (reason === "souvenir") {
      sealResult("souvenir");
      return;
    }
    run.dying = true;
    run.deathNote = reason;
    run.deathAt = performance.now();
    sfx("stamp");
    setAuraMood("point");
    PF.setAura("badLuck");
    if (world) world.wash.material.opacity = 0.4;
    showToast("POND CLOSED", reason === "mill_lost" ? "The mill took the luck" : reason === "decoy" ? "A hat stamped the hook" : "Wrong colour stamped the hook", 1100);
  }

  function enterStage(n) {
    const spec = duckpondStageParams(n);
    if (!spec) {
      beginDeath("souvenir");
      return;
    }
    run.stage = n;
    run.spec = spec;
    run.caught = 0;
    run.wrong = 0;
    run.millLost = 0;
    run.callIndex = 0;
    run.ducks = seedFlock(spec);
    run.t0 = performance.now();
    hookPhase = "idle";
    hookAge = 0;
    dunkTried = false;
    commit.on = false;
    tintStage(spec);
    updateCallSign(spec);
    ensureHud();
    ensurePips(spec.wrongLimit);
    paintNeed();
    paintMill();
    tellDepth(Math.max(0, n - 1));
    const hint = el("duckPondPlayHint");
    if (hint) {
      if (spec.decoyHats && spec.diveEvent) hint.textContent = "LEAD the drop · glow dives · hats stay up — those are decoys";
      else if (spec.decoyHats) hint.textContent = "LEAD the drop · hook the GLOW · hats and numbers are decoys";
      else if (spec.lilies) hint.textContent = "LEAD the drop · skip the lilies · hook the glow";
      else if (spec.millRush) hint.textContent = "LEAD the drop · save the glow before the mill";
      else hint.textContent = "LEAD the duck · TAP commits · hook the GLOWING call";
    }
    showToast(spec.coda ? "ENDLESS POND" : "AUTHORED POND", `${spec.title} — ${roomTell(spec)}`, 1280);
    setText("duckPondStatus", spec.barker || `${spec.title} — hook ${currentCall(spec).join(" / ")}. Need ${spec.need}.`);
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
  }

  function paintNeed() {
    if (!run || !run.spec) {
      setText("duckPondNeed", "0 / 0");
      return;
    }
    setText("duckPondNeed", `${run.caught} / ${run.spec.need}`);
  }

  function paintMill() {
    const wrap = el("duckPondMillWrap");
    const spec = run && run.spec;
    const show = !!(spec && spec.millRush && isLive());
    if (wrap) wrap.hidden = !show;
    if (show) setText("duckPondMill", `${run.millLost | 0} / ${spec.millLimit}`);
  }

  function ensureHud() {
    const hud = el("duckPondHud");
    if (hud && isLive()) hud.hidden = false;
    const depth = card() && card().querySelector("[data-runkit-hud=\"duckpond\"]");
    if (depth) {
      depth.hidden = !isLive();
      const spec = liveSpec();
      depth.textContent = hudLine(spec, (run && run.stage) || 0);
    }
  }

  function ensurePips(limit) {
    const span = card() && card().querySelector("[data-runkit-strikes=\"duckpond\"]");
    if (!span) return;
    const max = Math.max(2, limit || 3);
    if (span.childElementCount !== max) {
      span.innerHTML = new Array(max).fill("<i></i>").join("");
    }
    const used = (isLive() || (run && run.dying)) ? (run.wrong | 0) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < used));
  }

  function resetPips() {
    const span = card() && card().querySelector("[data-runkit-strikes=\"duckpond\"]");
    if (!span) return;
    span.querySelectorAll("i").forEach((n) => n.classList.remove("on"));
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall through */ }
    }
    kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "wrong_duck",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestDuckPond = Math.max(state.bestDuckPond || 0, payload.depth);
      state.bestDuckPondScore = Math.max(state.bestDuckPondScore || 0, payload.score);
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (state) {
      const keyed = Object.assign({ gameId: GAME_ID, at: Date.now() }, payload);
      const prev = (state.lastRun && typeof state.lastRun === "object" && !Array.isArray(state.lastRun))
        ? state.lastRun
        : {};
      state.lastRun = Object.assign({}, prev, {
        game: GAME_ID,
        gameId: GAME_ID,
        depth: payload.depth,
        score: payload.score,
        deathReason: payload.deathReason,
        cashedOut: payload.cashedOut,
        at: keyed.at,
      });
      state.lastRun[GAME_ID] = keyed;
    }
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function tellDepth(n) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportDepth !== "function") return;
    const spec = liveSpec();
    try {
      rk().reportDepth(run.kitRun, n | 0, { name: spec.title, coda: !!spec.coda });
    } catch (_) { /* hud */ }
    ensureHud();
  }

  function tellStrike(reason) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportStrike !== "function") return;
    try { rk().reportStrike(run.kitRun, reason); } catch (_) { /* pips */ }
  }

  function lastDepth() {
    const state = PF.getState() || {};
    const keyed = state.lastRun && state.lastRun[GAME_ID];
    if (keyed && keyed.depth != null) return keyed.depth | 0;
    const last = state.lastRun;
    if (last && (last.game === GAME_ID || last.gameId === GAME_ID)) return last.depth | 0;
    return Math.max(state.bestDuckPond || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }

  function challengeLine(n) {
    if (rk() && typeof rk().challengeText === "function") {
      return rk().challengeText("Duck Pond", n, GAME_ID);
    }
    return `Beat my Duck Pond stage ${n} on Penny Fever`;
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA_LINES.leave;
    if (reason === "souvenir") return AURA_LINES.souvenir;
    if (reason === "mill_lost") return AURA_LINES.mill_lost;
    if (reason === "decoy") return AURA_LINES.decoy;
    if (rk() && typeof rk().auraDeathLine === "function") {
      const line = rk().auraDeathLine(GAME_ID, depth, reason || "wrong_duck");
      if (line) return `Aura: ${String(line).replace(/^Aura:\s*/i, "")}`;
    }
    if (depth >= 6) return AURA_LINES.deep(depth);
    if (depth >= 3) return AURA_LINES.mid;
    if (depth <= 0) return AURA_LINES.shallow;
    return AURA_LINES.wrong_duck;
  }

  function stampDepthCopy() {
    const host = card();
    if (!host) return;
    const num = host.querySelector(".machine-number");
    if (num) num.textContent = DEPTH_COPY.machine;
    host.querySelectorAll("[data-pf-depth-copy]").forEach((p) => {
      p.textContent = DEPTH_COPY.body;
    });
    ensureHud();
    ensurePips();
    if (!isLive() && (!run || run.done)) setText("duckPondStatus", DEPTH_COPY.status);
  }

  function punchStart() {
    stampDepthCopy();
    setText("duckPondStatus", DEPTH_COPY.punch);
    const btn = el("duckPondStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
    }
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("duckpond")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function start() {
    if (isLive()) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("duckPondStatus", "Out of demo coins · grant a pass");
      return;
    }
    run = {
      kitRun,
      stage: 1,
      depth: 0,
      score: 0,
      caught: 0,
      wrong: 0,
      millLost: 0,
      callIndex: 0,
      spec: null,
      ducks: [],
      done: false,
      dying: false,
      t0: performance.now(),
      stageHold: 0,
      pendingNext: 0,
    };
    const startBtn = el("duckPondStart");
    if (startBtn) startBtn.disabled = true;
    const verdict = el("duckPondVerdict");
    if (verdict) verdict.hidden = true;
    if (kit && kit.hideResult) kit.hideResult("duckPondResult");
    PF.setTier("duckPondTier", "", "");
    kit.setMode(card(), "play");
    PF.focusCard("duckPondCard", true);
    enterStage(1);
    sfx("chapter");
    setAuraMood("cheer");
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    const depth = run.depth | 0;
    const score = run.score | 0;
    const death = reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : (run.deathNote || "wrong_duck"));
    persistDepth({
      depth,
      score,
      deathReason: death,
      cashedOut: death === "souvenir",
      meta: { stage: run.spec && run.spec.id, caught: run.caught, wrong: run.wrong, mill: run.millLost, kind: run.spec && run.spec.kind },
    });
    stampDepthCopy();
    const startBtn = el("duckPondStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "HOOK AGAIN · 1 demo coin";
    }
    PF.focusCard("duckPondCard", false);
    kit.setMode(card(), "result");
    const line = `POND ${depth} · SCORE ${score}`;
    const aura = auraLine(reason, depth);
    const challenge = challengeLine(depth);
    const verdict = el("duckPondVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = reason === "leave" ? `Left the pond · ${line}` : `${aura} ${line}`;
    }
    kit.fillResult({
      root: "duckPondResult",
      depth: "duckPondResultDepth",
      score: "duckPondResultScore",
      aura: "duckPondResultAura",
      copied: "duckPondCopied",
    }, {
      depthLine: `POND ${depth}`,
      scoreLine: `SCORE ${score} · ${death.replace(/_/g, " ").toUpperCase()}`,
      auraLine: aura,
    });
    const reasonNode = el("duckPondResultReason");
    if (reasonNode) reasonNode.textContent = death.replace(/_/g, " ").toUpperCase();
    setText("duckPondChallengeText", challenge);
    PF.setTier("duckPondTier", depth > 0 ? `POND ${depth}` : "POND", depth > 0 ? "perfect" : "miss");
    setText("duckPondStatus", reason === "leave" ? "Left the pond." : (reason === "souvenir" ? "Pond souvenir. Hook stays." : "Pond stamped the hook."));
    paintMill();
    if (depth > 0) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Duck pond");
      PF.setAura(depth >= 4 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `POND ${depth}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Duck pond miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "POND", aura);
    }
    PF.refreshNightBoard();
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
    showToast(reason === "souvenir" ? "SOUVENIR" : "POND CLOSED", aura, 1600);
    if (world) {
      const attract = duckpondStageParams(1);
      world._idleDucks = seedFlock(attract);
      tintStage(attract);
      updateCallSign(attract);
    }
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave" || reason === "souvenir") sealResult(reason);
    else beginDeath(reason);
  }

  function tickDucks(dt, t, spec, ducks) {
    const speed = 0.72 * (spec.speedMul || 0.55);
    const live = isLive();
    for (let i = 0; i < ducks.length; i += 1) {
      const d = ducks[i];
      const diving = isDiving(d, t);
      if (d.caught) {
        d.lift += dt * 1.7;
        const p = duckWorldPos(d);
        d.mesh.position.set(p.x, WATER_Y + 0.55 + d.lift * 1.5, p.z);
        d.mesh.rotation.y += dt * 6;
        d.mesh.rotation.z = Math.sin(t * 8) * 0.4;
        if (d.lift > 1.15) recycleDuck(d, spec);
        continue;
      }
      const prev = d.angle;
      if (d.flee > 0) {
        d.flee -= dt;
        d.angle += d.dir * speed * 1.85 * dt;
      } else {
        const whirl = spec.whirl ? 1.22 : 1;
        d.angle += d.dir * speed * whirl * dt;
      }
      if (live && crossedMill(prev, d.angle, d.dir) && !d.caught) {
        millClaim(d, spec);
        continue;
      }
      const p = duckWorldPos(d);
      const bob = REDUCE ? 0 : Math.sin(t * 3.2 + d.phase) * 0.03;
      const y = WATER_Y + bob + (diving ? -0.22 : 0);
      d.mesh.position.set(p.x, y, p.z);
      d.mesh.rotation.y = d.angle + (d.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      d.mesh.rotation.z = diving ? 0.55 : Math.sin(t * 4 + d.phase) * 0.08;
      d.mesh.userData.wingL.rotation.z = Math.sin(t * 8 + d.phase) * 0.25;
      d.mesh.userData.wingR.rotation.z = -Math.sin(t * 8 + d.phase) * 0.25;
      d.mesh.visible = !(diving && y < WATER_Y - 0.18);
      if (diving) d.mesh.scale.setScalar(0.92);
      else d.mesh.scale.setScalar(1);
      const ud = d.mesh.userData;
      if (ud.glow) {
        const lit = !d.decoy && callMatch(d.colour, spec, d) && !diving;
        ud.glow.visible = lit;
        if (lit) ud.glow.material.emissiveIntensity = 1.15 + Math.sin(t * 5.2 + d.phase) * 0.45;
      }
    }
  }

  function tickFx(dt) {
    if (!world) return;
    world.ripples.forEach((r) => {
      if (r.life <= 0) return;
      r.t += dt;
      r.life -= dt * 0.85;
      const s = 1 + r.t * 3.4;
      r.mesh.scale.setScalar(s);
      r.mesh.material.opacity = Math.max(0, r.life * 0.55);
      if (r.life <= 0) r.mesh.visible = false;
    });
    droplets.forEach((d) => {
      if (d.life <= 0) return;
      d.life -= dt;
      d.vy -= 6.4 * dt;
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      d.mesh.material.opacity = Math.max(0, d.life * 1.2);
      if (d.life <= 0 || d.mesh.position.y < WATER_Y) d.mesh.visible = false;
    });
    if (world.wash.material.opacity > 0) {
      world.wash.material.opacity = Math.max(0, world.wash.material.opacity - dt * 0.9);
    }
    if (world.mill && world.mill.userData.wheel) {
      world.mill.userData.wheel.rotation.z += dt * (liveSpec().whirl ? 1.8 : 1.05);
    }
    if (world.motes) {
      world.motes.rotation.y += dt * 0.04;
      world.motes.position.y = Math.sin(simT * 0.4) * 0.05;
    }
    if (world.callLantern) {
      world.callLantern.position.y = 2.15 + Math.sin(simT * 1.6) * 0.04;
    }
    if (world.lanternGroup) {
      world.lanternGroup.children.forEach((lamp, i) => {
        lamp.position.y = 3.62 + Math.sin(simT * 1.4 + i) * 0.03;
      });
    }
  }

  function tickCamera(dt) {
    if (!world) return;
    if (punch.t > 0) punch.t = Math.max(0, punch.t - dt * 3.2);
    const spec = liveSpec();
    const introK = REDUCE ? 1 : clamp(intro, 0, 1);
    const orbit = REDUCE || isLive() ? 0 : Math.sin(simT * 0.18) * 0.35;
    const lean = isLive() ? aim.x * 0.12 : 0;
    const whirlRoll = spec.whirl && isLive() ? Math.sin(simT * 0.7) * 0.03 : 0;
    const shake = punch.t * punch.mag;
    const camY = lerp(4.2, CAM_PLAY.y, introK);
    const camZ = lerp(6.4, CAM_PLAY.z, introK);
    world.camera.position.set(
      CAM_PLAY.x + orbit + lean + (Math.random() - 0.5) * shake,
      camY + (Math.random() - 0.5) * shake * 0.4,
      camZ,
    );
    look.set(LOOK_PLAY.x + aim.x * 0.08, LOOK_PLAY.y, LOOK_PLAY.z + aim.z * 0.04);
    world.camera.lookAt(look);
    world.camera.rotation.z = whirlRoll;
  }

  function tickKeys(dt) {
    if (!cabinetOn() || commit.on) return;
    const spd = 2.4 * dt;
    let dx = 0;
    let dz = 0;
    if (keys.l) dx -= spd;
    if (keys.r) dx += spd;
    if (keys.u) dz -= spd;
    if (keys.d) dz += spd;
    if (!dx && !dz) return;
    if (liveSpec().mirrorHook) dx = -dx;
    aim.x += dx;
    aim.z += dz;
    clampAim();
  }

  function projectPointer(ev) {
    if (!world) return null;
    const canvas = el("duckPondCanvas");
    const r = canvas.getBoundingClientRect();
    ndc.x = ((ev.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    ndc.y = -((ev.clientY - r.top) / Math.max(1, r.height)) * 2 + 1;
    raycaster.setFromCamera(ndc, world.camera);
    const hits = raycaster.intersectObject(world.hitPlane);
    if (!hits.length) return null;
    return { x: hits[0].point.x, z: hits[0].point.z };
  }

  function applyAimFromPointer(ev) {
    if (commit.on) return;
    const p = projectPointer(ev);
    if (!p) return;
    if (liveSpec().mirrorHook) p.x = -p.x;
    aim.x = p.x;
    aim.z = p.z;
    clampAim();
  }

  function resize() {
    if (!world) return;
    const canvas = el("duckPondCanvas");
    if (!canvas) return;
    const w = Math.max(2, canvas.clientWidth || canvas.parentElement.clientWidth || 960);
    const h = Math.max(2, canvas.clientHeight || canvas.parentElement.clientHeight || 720);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
    world.renderer.setSize(w, h, false);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!world || !cabinetOn()) return;
    const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016);
    lastT = now;
    simT += dt;
    if (!REDUCE && intro < 1) intro = Math.min(1, intro + dt * 0.85);
    else intro = 1;
    hideToastIfDue(now);
    tickKeys(dt);

    const spec = liveSpec();
    if (world.waterMat) world.waterMat.uniforms.uTime.value = simT;

    if (run && run.dying && !run.done) {
      if (now - (run.deathAt || now) >= DEATH_HOLD_MS) sealResult(run.deathNote || "wrong_duck");
    }
    if (isLive() && run.stageHold > 0) {
      run.stageHold -= dt;
      if (run.stageHold <= 0 && run.pendingNext) {
        const n = run.pendingNext;
        run.pendingNext = 0;
        enterStage(n);
      }
    }

    if (!isLive() && (!run || run.done)) {
      idleClock += dt;
      if (idleClock > 7.5) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        const attract = duckpondStageParams(idleRoom);
        if (world) {
          world._idleDucks = seedFlock(attract);
          tintStage(attract);
          updateCallSign(attract);
        }
      }
    }

    const ducks = ((isLive() || (run && run.dying && !run.done)) && run.ducks && run.ducks.length)
      ? run.ducks
      : (world._idleDucks || []);
    if (ducks.length) tickDucks(dt, simT, spec, ducks);
    if (isLive()) tickHook(dt);
    applyHookPose();
    updateAura(dt, simT);
    tickFx(dt);
    tickCamera(dt);
    if (isLive()) ensurePips(run.spec && run.spec.wrongLimit);
    frameN += 1;
    if (HEADLESS && frameN % 8 !== 0) return;
    world.renderer.render(world.scene, world.camera);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function startLoop() {
    if (raf) return;
    lastT = 0;
    raf = requestAnimationFrame(loop);
  }

  function ensureWorld() {
    const canvas = el("duckPondCanvas");
    if (!canvas) return null;
    if (world) return world;
    try {
      world = buildWorld(canvas);
      resize();
      const attract = duckpondStageParams(1);
      world._idleDucks = seedFlock(attract);
      tintStage(attract);
      updateCallSign(attract);
      intro = REDUCE ? 1 : 0;
    } catch (err) {
      setText("duckPondStatus", "This tent needs WebGL.");
      world = null;
    }
    return world;
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun || typeof kitRun.declare !== "function") return;
    try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already */ }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: duckpondStageParams,
      codaParams: duckpondCoda,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function onPointerDown(ev) {
    if (!world || !cabinetOn()) return;
    if (run && run.dying && !run.done) return;
    if (!isLive()) {
      start();
      if (!isLive()) punchStart();
      return;
    }
    ev.preventDefault();
    const canvas = el("duckPondCanvas");
    try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
    applyAimFromPointer(ev);
    dropHook();
  }

  function onPointerMove(ev) {
    if (!world || !cabinetOn()) return;
    applyAimFromPointer(ev);
    if (isLive()) ev.preventDefault();
  }

  function onKeyDown(ev) {
    if (!cabinetOn()) return;
    const k = ev.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") keys.l = true;
    else if (k === "ArrowRight" || k === "d" || k === "D") keys.r = true;
    else if (k === "ArrowUp" || k === "w" || k === "W") keys.u = true;
    else if (k === "ArrowDown" || k === "s" || k === "S") keys.d = true;
    else if (k === " " || k === "Enter") {
      ev.preventDefault();
      if (!isLive()) start();
      else dropHook();
    } else return;
    ev.preventDefault();
  }

  function onKeyUp(ev) {
    const k = ev.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") keys.l = false;
    else if (k === "ArrowRight" || k === "d" || k === "D") keys.r = false;
    else if (k === "ArrowUp" || k === "w" || k === "W") keys.u = false;
    else if (k === "ArrowDown" || k === "s" || k === "S") keys.d = false;
  }

  PF.registerVendor({
    id: "duck-pond",
    playKey: "duckpond",
    chalk: "Lead the drop. Glow is the call. Hats lie.",
    defaults: { bestDuckPond: 0, bestDuckPondScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopLoop();
      keys.l = keys.r = keys.u = keys.d = false;
    },
    onShow() {
      stampDepthCopy();
      ensureWorld();
      resize();
      intro = REDUCE ? 1 : 0;
      startLoop();
    },
    onReset() {
      run = null;
      hookPhase = "idle";
      commit.on = false;
      const verdict = el("duckPondVerdict");
      if (verdict) verdict.hidden = true;
      if (kit && kit.hideResult) kit.hideResult("duckPondResult");
      const startBtn = el("duckPondStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      resetPips();
      stampDepthCopy();
      paintMill();
      if (world) {
        const attract = duckpondStageParams(1);
        world._idleDucks = seedFlock(attract);
        tintStage(attract);
        updateCallSign(attract);
      }
      startLoop();
    },
    refreshDepth(state) {
      setText("depthDuckNow", isLive() || (run && run.dying) ? String(run.depth | 0) : "0");
      const bestN = Math.max(state.bestDuckPond || 0, (state.bestDepth && state.bestDepth.duckpond) || 0);
      setText("depthDuckBest", bestN ? String(bestN) : "—");
      setText("depthDuckScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("depthDuckBestScore", state.bestDuckPondScore ? String(state.bestDuckPondScore) : "—");
      const doorBest = el("duckPondDoorBest");
      if (doorBest) doorBest.textContent = bestN ? `Best pond ${bestN}` : "Ponds —";
    },
    bind() {
      if (bound) return;
      bound = true;
      declareP0();
      ensureHud();
      ensurePips();
      const startBtn = el("duckPondStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = el("duckPondCanvas");
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerup", () => {});
        canvas.addEventListener("pointercancel", () => {});
      }
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      const copyBtn = el("duckPondChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = lastDepth();
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("duckPondCopied");
            if (copied) copied.hidden = false;
            setText("duckPondStatus", "Copied — send it");
          }, () => {
            setText("duckPondStatus", text);
          });
        });
      }
      window.addEventListener("resize", resize);
      if (typeof ResizeObserver === "function" && canvas) {
        const ro = new ResizeObserver(() => resize());
        ro.observe(canvas);
      }
      stampDepthCopy();
    },
  });
}
