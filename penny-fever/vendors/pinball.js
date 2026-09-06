/* Pinball Alley — 3D parlor tent. PF only. Never booth/port 6000. Never Imagine.
 * ONE THUMB. Hungry left lane. Table teaches itself. Not a two-flipper sim.
 * Custom depth-run: one chrome ball, authored chapters, ENDLESS coda after Backglass Fever. */
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

  const GAME_ID = "pinball";
  const CODA_ENABLED = true;
  const AUTHORED_COUNT = 8;
  const STEP = 1000 / 240;
  const BALL_R = 0.022;
  const WALL_T = 0.014;
  const G = 1.18;
  const MAX_SPD = 2.35;
  const FLIP_UP = 28;
  const FLIP_DOWN = 16;
  const DEATH_HOLD_MS = 780;
  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Pinball Alley",
    depthUnit: "Chapter",
    sheet: "GOBLIN_BATCH01_BUILD_SHEETS.md",
    authoredSheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const AUTHORED = [
    {
      id: 1, name: "Plunger Parade", kind: "parade", speed: 1, bumper: 120,
      mission: { id: "bumpers", label: "Hit each bumper once" },
      toys: { spinner: false, sink: false, ramp: false, slings: false, upperFlip: false, gate: false, bonus: false, thorns: false, rollovers: false, posts: true },
      bumpers: [
        { x: 0.18, y: 0.74, r: 0.05, hue: "#e8a0b8" },
        { x: 0.26, y: 0.56, r: 0.05, hue: "#d4a45a" },
        { x: 0.10, y: 0.42, r: 0.048, hue: "#3d8a8a" },
      ],
      hunger: 0.7,
      glow: 0xc45a6a,
      barker: "One thumb. Kiss each bumper. The left lane is a mouth — stay right.",
    },
    {
      id: 2, name: "Spinner Alley", kind: "spinner", speed: 1, bumper: 120,
      mission: { id: "spinner", label: "3 spinner ticks" },
      toys: { spinner: true, sink: false, ramp: false, slings: true, upperFlip: false, gate: false, bonus: false, thorns: false, rollovers: false, posts: false },
      bumpers: [
        { x: -0.34, y: 0.42, r: 0.038, hue: "#e8a0b8" },
        { x: 0.34, y: 0.42, r: 0.038, hue: "#d4a45a" },
      ],
      spinner: { x: 0.08, y: 0.72 },
      hunger: 0.55,
      glow: 0x3d8a8a,
      barker: "Shoot the spinner. Left sling is a traitor — it feeds the mouth.",
    },
    {
      id: 3, name: "Sinkhole Circus", kind: "sink", speed: 1, bumper: 120,
      mission: { id: "sink", label: "Sink hole ×2" },
      toys: { spinner: false, sink: true, ramp: false, slings: true, upperFlip: false, gate: false, bonus: false, thorns: false, rollovers: false, posts: false },
      bumpers: [
        { x: 0.00, y: 0.70, r: 0.036, hue: "#e8a0b8" },
        { x: 0.22, y: 0.54, r: 0.036, hue: "#d4a45a" },
        { x: 0.00, y: 0.38, r: 0.036, hue: "#3d8a8a" },
        { x: -0.22, y: 0.54, r: 0.036, hue: "#c41e3a" },
      ],
      sink: { x: 0.08, y: 0.54, r: 0.042 },
      hunger: 0.62,
      glow: 0x6b3a8a,
      barker: "Drop the well twice. Don't let the kick spill left.",
    },
    {
      id: 4, name: "Ramp Carnival", kind: "ramp", speed: 1, bumper: 120,
      mission: { id: "ramp-sink", label: "Shoot ramp + sink once" },
      toys: { spinner: false, sink: true, ramp: true, slings: true, upperFlip: false, gate: false, bonus: false, thorns: false, rollovers: false, posts: false, upperShelf: true },
      bumpers: [
        { x: -0.28, y: 0.78, r: 0.04, hue: "#e8a0b8" },
        { x: -0.28, y: 0.38, r: 0.04, hue: "#d4a45a" },
        { x: 0.30, y: 0.38, r: 0.04, hue: "#3d8a8a" },
      ],
      sink: { x: 0.22, y: 0.30, r: 0.04 },
      ramp: true,
      hunger: 0.7,
      glow: 0xd4a45a,
      barker: "Ramp to the shelf. Miss the return and the mouth is waiting.",
    },
    {
      id: 5, name: "Bumper Storm", kind: "storm", speed: 1, bumper: 120,
      mission: { id: "combo", label: "Bumper combo ×5" },
      toys: { spinner: false, sink: false, ramp: false, slings: true, upperFlip: false, gate: false, bonus: false, thorns: false, rollovers: false, posts: false, tightIn: true },
      bumpers: [
        { x: -0.14, y: 0.70, r: 0.042, hue: "#e8a0b8" },
        { x: 0.14, y: 0.70, r: 0.042, hue: "#d4a45a" },
        { x: 0.00, y: 0.56, r: 0.048, hue: "#3d8a8a" },
        { x: -0.18, y: 0.42, r: 0.04, hue: "#c41e3a" },
        { x: 0.18, y: 0.42, r: 0.04, hue: "#f0d09a" },
      ],
      hunger: 0.78,
      glow: 0xc41e3a,
      barker: "Five bumpers. Chaos kicks left. One thumb saves the storm.",
    },
    {
      id: 6, name: "Twin Flip Gate", kind: "gate", speed: 1, bumper: 120,
      mission: { id: "gate", label: "Open gate + 2 bonus lane hits" },
      toys: { spinner: false, sink: false, ramp: false, slings: true, upperFlip: true, gate: true, bonus: true, thorns: false, rollovers: false, posts: false },
      bumpers: [
        { x: -0.16, y: 0.44, r: 0.04, hue: "#e8a0b8" },
        { x: 0.16, y: 0.44, r: 0.04, hue: "#d4a45a" },
      ],
      hunger: 0.82,
      glow: 0x4aaa6a,
      barker: "Upper gate pulses itself. One thumb downstairs. Feed the bonus, not the mouth.",
    },
    {
      id: 7, name: "Outlane Thorns", kind: "thorns", speed: 1, bumper: 120,
      mission: { id: "alt", label: "Spinner, then sink" },
      toys: { spinner: true, sink: true, ramp: false, slings: true, upperFlip: false, gate: false, bonus: false, thorns: true, rollovers: false, posts: true },
      bumpers: [
        { x: -0.12, y: 0.62, r: 0.04, hue: "#e8a0b8" },
        { x: 0.12, y: 0.62, r: 0.04, hue: "#d4a45a" },
        { x: 0.00, y: 0.48, r: 0.038, hue: "#3d8a8a" },
      ],
      spinner: { x: 0.18, y: 0.78 },
      sink: { x: 0.08, y: 0.36, r: 0.04 },
      hunger: 0.95,
      glow: 0x8a3030,
      barker: "Thorns by the mouth. They save right. They doom left.",
    },
    {
      id: 8, name: "Backglass Fever", kind: "fever", speed: 1, bumper: 120,
      mission: { id: "chain", label: "Ramp → spinner → sink" },
      toys: { spinner: true, sink: true, ramp: true, slings: true, upperFlip: false, gate: false, bonus: false, thorns: false, rollovers: true, posts: false, upperShelf: true },
      bumpers: [
        { x: -0.18, y: 0.78, r: 0.038, hue: "#e8a0b8" },
        { x: -0.32, y: 0.52, r: 0.04, hue: "#d4a45a" },
        { x: 0.32, y: 0.56, r: 0.04, hue: "#3d8a8a" },
        { x: 0.00, y: 0.40, r: 0.042, hue: "#c41e3a" },
      ],
      spinner: { x: 0.22, y: 0.52 },
      sink: { x: 0.08, y: 0.28, r: 0.04 },
      ramp: true,
      hunger: 1.05,
      glow: 0xe8b84a,
      barker: "Fever deck. Ramp → spinner → sink. The mouth is wide awake.",
    },
  ];

  const CODA_MISSIONS = [
    { id: "chain", label: "Ramp → spinner → sink" },
    { id: "combo", label: "Bumper combo ×5" },
    { id: "sink", label: "Sink hole ×2" },
    { id: "spinner", label: "3 spinner ticks" },
  ];

  const AURA_LINE = {
    drain: "Aura: Outlane. The backglass felt that.",
    hungry: "Aura: The left lane ate you. One thumb. Stay right.",
    upper: "Aura: Missed the return. The shelf dumped you into the mouth.",
    chapter: "Aura: Chapter up. New table. Same hungry left.",
    deep: (n) => `Aura: Chapter ${n}. You're living in my table.`,
    souvenir: "Aura: Backglass Fever survived. Souvenir — the table bowed.",
    coda: "Aura: Authored chapters done. ENDLESS — the mouth stays hungry.",
    leave: "Aura: You pulled the plug mid-chapter.",
  };

  const DEPTH_COPY = {
    status: "One thumb · hold to plunge · tap to flip · left lane is hungry",
    punch: "One thumb. The left lane is hungry. Press START.",
  };

  let run = null;
  let gl = null;
  let raf = 0;
  let lastTs = 0;
  let idleT = 0;
  let visible = false;
  const pointers = new Map();
  const keys = { flip: false, P: false };
  const LIVE = { px: 0.24, py: 0.12, len: 0.20 };
  const REST_ANG = Math.PI + 0.48;
  const UP_ANG = Math.PI - 0.55;

  function card() { return $("pinballCard"); }
  function rk() { return PF.runKit; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hexCol(h) { return new THREE.Color(h); }
  function sfx(name) { try { kit.sfx(name); } catch (_) { /* ignore */ } }

  function codaOn() {
    const row = rk() && ((rk().declared && rk().declared[GAME_ID]) || (rk().p0 && rk().p0[GAME_ID]));
    if (row && row.codaEnabled === false) return false;
    return CODA_ENABLED;
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    const spec = Object.assign({
      authored: AUTHORED,
      authoredCount: AUTHORED_COUNT,
      codaEnabled: CODA_ENABLED,
      codaParams: codaChapter,
      level: chapterSpec,
      stageParams: chapterSpec,
    }, P0_MOUNT);
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

  function codaChapter(n) {
    const t = Math.max(0, n - AUTHORED_COUNT - 1);
    const base = AUTHORED[AUTHORED_COUNT - 1];
    return Object.assign({}, base, {
      id: n, ch: n, name: `Fever Coda ${n}`, kind: "coda",
      speed: Math.min(1.7, 1.16 + t * 0.06),
      bumper: 120 + t * 18,
      mission: CODA_MISSIONS[t % CODA_MISSIONS.length],
      coda: true, glow: 0xff6a9a, hunger: Math.min(1.4, 1.05 + t * 0.08),
      barker: "ENDLESS — same mouth, faster glass, rotated mission.",
    });
  }

  function chapterSpec(n) {
    const ch = Math.max(1, n | 0);
    if (ch <= AUTHORED_COUNT) {
      const row = AUTHORED[ch - 1];
      return Object.assign({ ch, coda: false, title: row.name }, row);
    }
    if (!codaOn()) return null;
    return codaChapter(ch);
  }

  function hudChapter(spec) {
    if (!spec) return "CHAPTER";
    if (spec.coda) return `ENDLESS · CHAPTER ${spec.ch} · ${spec.name}`;
    return `CHAPTER ${spec.ch} · ${spec.name}`;
  }

  function missionReset(spec) {
    const id = spec.mission && spec.mission.id;
    if (id === "bumpers") return { id, hits: spec.bumpers.map(() => false) };
    if (id === "spinner") return { id, ticks: 0, need: 3 };
    if (id === "sink") return { id, n: 0, need: 2 };
    if (id === "ramp-sink") return { id, ramp: false, sink: 0 };
    if (id === "combo") return { id, n: 0, need: 5, window: 0 };
    if (id === "gate") return { id, open: false, bonus: 0, need: 2 };
    if (id === "alt") return { id, phase: "spin" };
    if (id === "chain") return { id, phase: "ramp" };
    return { id: id || "bumpers", hits: (spec.bumpers || []).map(() => false) };
  }

  function missionDone(m) {
    if (!m) return false;
    if (m.id === "bumpers") return m.hits.every(Boolean);
    if (m.id === "spinner") return m.ticks >= m.need;
    if (m.id === "sink") return m.n >= m.need;
    if (m.id === "ramp-sink") return m.ramp && m.sink > 0;
    if (m.id === "combo") return m.n >= m.need;
    if (m.id === "gate") return m.open && m.bonus >= m.need;
    if (m.id === "alt") return m.phase === "done";
    if (m.id === "chain") return m.phase === "done";
    return false;
  }

  function missionText(m, spec) {
    if (!m) return spec && spec.mission ? spec.mission.label : "";
    if (m.id === "bumpers") return `Bumpers ${m.hits.filter(Boolean).length}/${m.hits.length}`;
    if (m.id === "spinner") return `Spinner ${m.ticks}/${m.need}`;
    if (m.id === "sink") return `Sink ${m.n}/${m.need}`;
    if (m.id === "ramp-sink") return `Ramp ${m.ramp ? "✓" : "·"}  Sink ${m.sink ? "✓" : "·"}`;
    if (m.id === "combo") return `Combo ${m.n}/${m.need}`;
    if (m.id === "gate") return `Gate ${m.open ? "OPEN" : "shut"} · bonus ${m.bonus}/${m.need}`;
    if (m.id === "alt") return m.phase === "spin" ? "Spinner first" : m.phase === "sink" ? "Now the sink" : "Clear";
    if (m.id === "chain") {
      if (m.phase === "ramp") return "Ramp first";
      if (m.phase === "spin") return "Now spinner";
      if (m.phase === "sink") return "Now sink";
      return "Fever chain clear";
    }
    return spec.mission.label;
  }

  function stampDepthCopy() {
    const el = $("pinballStatus");
    if (el && (!run || run.done)) el.textContent = DEPTH_COPY.status;
    const tag = card() && card().querySelector("[data-pf-depth-tag]");
    if (tag) tag.textContent = "DEPTH RUN · chapters until DRAIN · one thumb · hungry left lane";
  }

  function paintHud() {
    const spec = run && run.spec;
    const hud = card() && card().querySelector(".pinball-rk-hud");
    if (hud) hud.textContent = run && !run.done && spec ? hudChapter(spec) : "";
    const live = $("pinballLiveScore");
    if (live) live.textContent = run && !run.done ? String(run.score | 0) : "0";
    const mis = $("pinballMission");
    if (mis) mis.textContent = run && !run.done ? missionText(run.mission, spec) : "";
    const chg = $("pinballChargeFill");
    if (chg) chg.style.height = `${Math.round((run && run.charge ? run.charge : 0) * 100)}%`;
    const host = card();
    const plunging = !!(run && !run.done && run.ball && run.ball.mode === "plunger");
    if (host) host.classList.toggle("is-plunging", plunging);
    const plunge = $("pinballPlunge");
    if (plunge) plunge.hidden = !plunging;
    const thumb = $("pinballThumb");
    if (thumb) {
      thumb.textContent = plunging
        ? (run.charge > 0.08 ? "LET GO!" : "HOLD TO PLUNGE")
        : "FLIP";
      thumb.classList.toggle("is-down", !!(run && (plunging ? run.wantP : run.wantFlip)));
    }
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "drain",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestPinballCh = Math.max(state.bestPinballCh || 0, payload.depth);
      state.bestPinballScore = Math.max(state.bestPinballScore || 0, payload.score);
      state.bestPinballBalls = Math.max(state.bestPinballBalls || 0, payload.depth);
    }
    const ctx = run && (run.kitRun || run.ctx);
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try { rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, payload), { navigate: false }); } catch (_) { /* */ }
    }
    kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function challengeLine(n) {
    return `Beat my Pinball chapter ${n | 0} on Penny Fever`;
  }

  function auraFor(reason) {
    if (reason === "leave") return AURA_LINE.leave;
    if (reason === "souvenir") return AURA_LINE.souvenir;
    if (reason === "upper") return AURA_LINE.upper;
    if (reason === "hungry") return AURA_LINE.hungry;
    const n = run ? run.cleared : 0;
    if (n >= 6) return AURA_LINE.deep(n);
    return AURA_LINE.hungry;
  }

  /* ───────── 3D world ───────── */
  function canGL() {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch (_) { return false; }
  }

  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.needsUpdate = true;
    return t;
  }

  function mat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.62, metalness: 0.12,
    }, extra || {}));
  }

  function box(m, w, h, d, x, y, z) {
    const mesh = new THREE.Mesh(gl.geo.box, m);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function sphere(m, r, x, y, z, geo) {
    const mesh = new THREE.Mesh(geo || gl.geo.sphere, m);
    mesh.scale.setScalar(r);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function cyl(m, r, h, x, y, z, segs) {
    const mesh = new THREE.Mesh(segs ? new THREE.CylinderGeometry(1, 1, 1, segs) : gl.geo.cyl, m);
    mesh.scale.set(r, h, r);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = mat(SKIN, { roughness: 0.48, emissive: 0x3a2018, emissiveIntensity: 0.1 });
    const blouse = mat(BLOUSE, { roughness: 0.55, emissive: 0x3a3028, emissiveIntensity: 0.16 });
    const pinafore = mat(DRESS, { roughness: 0.5, emissive: 0x0a2010, emissiveIntensity: 0.28 });
    const hairM = mat(HAIR, { roughness: 0.7, emissive: 0x1a0c08, emissiveIntensity: 0.12 });
    const shoe = mat(0x111111, { roughness: 0.22, metalness: 0.55 });
    const gold = mat(GOLD, { metalness: 0.72, roughness: 0.26, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const heart = mat(HEART, { emissive: HEART, emissiveIntensity: 0.7, roughness: 0.35 });

    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(cyl(blouse, 0.13, 0.28, 0, 0.28, 0));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.13, 0.34, 14), pinafore);
    skirt.position.y = 0.06;
    hip.add(skirt);
    const bib = box(pinafore, 0.18, 0.16, 0.04, 0, 0.34, 0.12);
    hip.add(bib);
    const gem = box(heart, 0.08, 0.08, 0.035, 0, 0.24, 0.155);
    gem.rotation.z = Math.PI / 4;
    hip.add(gem);

    const head = new THREE.Group();
    head.position.y = 0.62;
    hip.add(head);
    head.add(sphere(skin, 0.175, 0, 0.02, 0));
    const eyeW = mat(0xf7f2ea);
    const eyeD = mat(0x2a1810);
    [-1, 1].forEach((s) => {
      const w = sphere(eyeW, 0.038, s * 0.055, 0.03, 0.15);
      w.scale.set(0.038, 0.044, 0.02);
      head.add(w);
      head.add(sphere(eyeD, 0.02, s * 0.055, 0.03, 0.168));
      head.add(sphere(mat(0xffffff), 0.01, s * 0.048, 0.045, 0.18));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), mat(0xc45a6a));
    smile.position.set(0, -0.05, 0.16);
    smile.rotation.x = 2.6;
    head.add(smile);
    head.add(sphere(hairM, 0.23, 0, 0.06, -0.02));
    head.add(box(hairM, 0.28, 0.07, 0.1, 0, 0.14, 0.16));
    [-1, 1].forEach((s) => {
      head.add(sphere(hairM, 0.11, s * 0.2, -0.04, 0.04));
      head.add(sphere(heart, 0.045, s * 0.2, 0.06, 0.06));
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
    const jewel = box(heart, 0.055, 0.055, 0.025, 0, 0.02, 0.11);
    jewel.rotation.z = Math.PI / 4;
    crown.add(jewel);

    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0.0, 0);
      const len = arm ? 0.28 : 0.34;
      const bone = cyl(arm ? skin : pinafore, arm ? 0.035 : 0.042, len, 0, -len / 2, 0);
      pivot.add(bone);
      if (arm) pivot.add(sphere(skin, 0.04, 0, -len, 0));
      else pivot.add(box(shoe, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03));
      hip.add(pivot);
      return pivot;
    }
    const armL = limb(-1, true);
    const armR = limb(1, true);
    const legL = limb(-1, false);
    const legR = limb(1, false);
    g.userData = { hip, head, armL, armR, legL, legR, t: 0, mood: "idle" };
    g.scale.setScalar(1.12);
    return g;
  }

  function tickAura(dt) {
    if (!gl || !gl.aura) return;
    const u = gl.aura.userData;
    u.t += dt;
    const mood = (run && !run.done && run.juice > 0.4) ? "cheer"
      : (run && run.draining) ? "sad"
        : (run && !run.done && run.ball && run.ball.y < 0.18 && run.ball.mode === "play") ? "gasp"
          : "idle";
    u.mood = mood;
    const bob = Math.sin(u.t * (mood === "cheer" ? 10 : 2.2)) * (mood === "cheer" ? 0.05 : 0.012);
    u.hip.position.y = 0.42 + bob;
    if (mood === "cheer") {
      u.armL.rotation.z = 0.9 + Math.sin(u.t * 8) * 0.25;
      u.armR.rotation.z = -0.9 + Math.sin(u.t * 8 + 1) * 0.25;
      u.armL.rotation.x = -0.4;
      u.armR.rotation.x = -0.4;
    } else if (mood === "gasp") {
      u.armL.rotation.z = 0.7;
      u.armR.rotation.z = -0.7;
      u.armL.rotation.x = -0.9;
      u.armR.rotation.x = -0.9;
      u.head.rotation.x = -0.12;
    } else if (mood === "sad") {
      u.head.rotation.x = 0.35;
      u.armL.rotation.x = 0.4;
      u.armR.rotation.x = 0.4;
      u.armL.rotation.z = 0.15;
      u.armR.rotation.z = -0.15;
    } else {
      u.head.rotation.x = 0;
      const swing = Math.sin(u.t * 2.1) * 0.12;
      u.armL.rotation.x = swing;
      u.armR.rotation.x = -swing;
      u.armR.rotation.z = -0.85 + Math.sin(u.t * 2.6) * 0.4;
      u.armL.rotation.z = 0.08;
    }
  }

  function tentStripe() {
    return canvasTex(128, 256, (ctx) => {
      for (let i = 0; i < 8; i += 1) {
        ctx.fillStyle = i % 2 ? "#6b1c32" : "#f0d4b0";
        ctx.fillRect(i * 16, 0, 16, 256);
      }
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let y = 0; y < 256; y += 18) ctx.fillRect(0, y, 128, 2);
    });
  }

  function sawdustTex() {
    return canvasTex(512, 512, (ctx) => {
      ctx.fillStyle = "#2a1c12";
      ctx.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 512; y += 36) {
        ctx.fillStyle = y % 72 ? "#3a2818" : "#322214";
        ctx.fillRect(0, y, 512, 32);
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(0, y + 32, 512, 2);
      }
      for (let i = 0; i < 80; i += 1) {
        ctx.fillStyle = `rgba(212,164,90,${0.05 + Math.random() * 0.08})`;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 10 + Math.random() * 24, 2);
      }
    });
  }

  function playfieldTex(spec) {
    return canvasTex(512, 1024, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0, "#14322c");
      g.addColorStop(0.5, "#0e241f");
      g.addColorStop(1, "#0a1614");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 1024);
      ctx.strokeStyle = "rgba(240,208,154,0.22)";
      ctx.lineWidth = 6;
      ctx.strokeRect(18, 18, 476, 988);
      ctx.strokeStyle = "rgba(180,232,224,0.35)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, 900);
      ctx.quadraticCurveTo(256, 820, 472, 900);
      ctx.stroke();
      ctx.fillStyle = "rgba(196,30,58,0.42)";
      ctx.beginPath();
      ctx.moveTo(18, 1020);
      ctx.lineTo(210, 1020);
      ctx.lineTo(70, 780);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#c41e3a";
      ctx.font = "700 34px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("HUNGRY", 110, 940);
      ctx.fillStyle = "rgba(180,232,224,0.28)";
      ctx.beginPath();
      ctx.moveTo(250, 980);
      ctx.lineTo(420, 860);
      ctx.lineTo(420, 1008);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#b8e8e0";
      ctx.font = "700 28px Georgia, serif";
      ctx.fillText("THUMB", 360, 960);
      ctx.fillStyle = "rgba(232,160,184,0.18)";
      ctx.beginPath(); ctx.arc(220, 380, 48, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(340, 380, 48, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(280, 520, 44, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f0d09a";
      ctx.font = "700 42px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(spec && spec.name ? spec.name.toUpperCase() : "PINBALL ALLEY", 256, 80);
      ctx.font = "22px Georgia, serif";
      ctx.fillStyle = "#b8e8e0";
      ctx.fillText(spec && spec.mission ? spec.mission.label : "ONE THUMB", 256, 118);
      ctx.fillStyle = "rgba(212,164,90,0.45)";
      ctx.fillRect(430, 140, 50, 760);
      ctx.fillStyle = "#1a0c10";
      ctx.font = "700 16px Georgia, serif";
      ctx.save();
      ctx.translate(455, 520);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("PLUNGER", 0, 0);
      ctx.restore();
    });
  }

  function backglassTex(score, chapter, name) {
    return canvasTex(512, 640, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 640);
      g.addColorStop(0, "#3a1020");
      g.addColorStop(0.45, "#1a0c18");
      g.addColorStop(1, "#0c0810");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 640);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 14;
      ctx.strokeRect(16, 16, 480, 608);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "700 48px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("PINBALL ALLEY", 256, 78);
      ctx.fillStyle = "#b8e8e0";
      ctx.font = "22px Georgia, serif";
      ctx.fillText(name || "THE PARLOR TABLE", 256, 112);
      ctx.fillStyle = "#f0c4a8";
      ctx.beginPath(); ctx.arc(256, 280, 78, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#3d2418";
      ctx.beginPath(); ctx.arc(256, 250, 82, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(200, 310, 28, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(312, 310, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e8b84a";
      ctx.beginPath(); ctx.moveTo(256, 168); ctx.lineTo(228, 214); ctx.lineTo(284, 214); ctx.fill();
      ctx.fillStyle = "#d22b3a";
      ctx.beginPath();
      ctx.moveTo(256, 200);
      ctx.bezierCurveTo(236, 188, 232, 214, 256, 226);
      ctx.bezierCurveTo(280, 214, 276, 188, 256, 200);
      ctx.fill();
      ctx.fillStyle = "#1e6b3c";
      ctx.fillRect(196, 355, 120, 70);
      ctx.fillStyle = "#111";
      ctx.fillRect(214, 424, 28, 18);
      ctx.fillRect(270, 424, 28, 18);
      ctx.fillStyle = "#ffe6a6";
      ctx.font = "700 56px Georgia, serif";
      ctx.fillText(String(score | 0).padStart(6, "0"), 256, 530);
      ctx.font = "20px Georgia, serif";
      ctx.fillStyle = "#e8a0b8";
      ctx.fillText(chapter || "CHAPTER 0", 256, 572);
    });
  }

  function pfLocal(x, y, h) {
    return new THREE.Vector3(x * 0.95, (h || 0) + BALL_R, y * 1.18);
  }

  const _pw = new THREE.Vector3();
  function pfWorld(x, y, h) {
    _pw.set(x * 0.95, (h || 0) + BALL_R, y * 1.18);
    if (gl && gl.pfRoot) {
      gl.pfRoot.updateWorldMatrix(true, false);
      gl.pfRoot.localToWorld(_pw);
    }
    return _pw;
  }

  function ensureGL() {
    if (gl) return gl;
    const canvas = $("pinballCanvas");
    if (!canvas || !canGL()) return null;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (THREE.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
    }
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a060c);
    scene.fog = new THREE.FogExp2(0x12080c, 0.028);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.08, 40);
    camera.position.set(0.55, 1.52, -2.15);
    camera.lookAt(0, 1.08, 0.5);
    gl = {
      renderer, scene, camera, canvas,
      geo: {
        box: new THREE.BoxGeometry(1, 1, 1),
        sphere: new THREE.SphereGeometry(1, 16, 12),
        sphereHi: new THREE.SphereGeometry(1, 22, 16),
        cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
      },
      toys: new THREE.Group(),
      sparks: [],
      trail: [],
      cam: { mode: "vestibule", yaw: 0.55, shake: 0 },
      glowCol: new THREE.Color(0xc45a6a),
    };

    scene.add(new THREE.HemisphereLight(0xffd8b0, 0x1a0c14, 0.92));
    scene.add(new THREE.AmbientLight(0x3a2430, 0.48));
    const spot = new THREE.SpotLight(0xffe6c0, 3.4, 14, 0.7, 0.4, 1.1);
    spot.position.set(0.15, 3.6, -1.4);
    spot.target.position.set(0, 0.95, 0.45);
    scene.add(spot);
    scene.add(spot.target);
    gl.playSpot = new THREE.SpotLight(0xb8e8e0, 2.2, 7, 0.55, 0.35, 1);
    gl.playSpot.position.set(0, 2.4, -0.6);
    gl.playSpot.target.position.set(0, 0.95, 0.55);
    scene.add(gl.playSpot);
    scene.add(gl.playSpot.target);
    gl.neon = new THREE.PointLight(0xc45a6a, 1.6, 5, 1.4);
    gl.neon.position.set(0, 0.4, 0.3);
    scene.add(gl.neon);
    gl.glassLight = new THREE.PointLight(0xf0d09a, 1.1, 4, 1.6);
    gl.glassLight.position.set(0, 1.55, 1.35);
    scene.add(gl.glassLight);

    const floorMat = mat(0x2a1c12, { map: sawdustTex(), roughness: 0.9 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const stripe = tentStripe();
    stripe.wrapS = stripe.wrapT = THREE.RepeatWrapping;
    stripe.repeat.set(4, 2);
    const wallM = mat(0xffffff, { map: stripe, roughness: 0.85 });
    const wallH = 3.4;
    [[0, wallH / 2, -4.2, 0], [0, wallH / 2, 4.4, Math.PI], [4.4, wallH / 2, 0.1, -Math.PI / 2], [-4.4, wallH / 2, 0.1, Math.PI / 2]].forEach((w) => {
      const m = box(wallM, 9, wallH, 0.08, w[0], w[1], w[2]);
      m.rotation.y = w[3];
      scene.add(m);
    });
    const ceil = box(mat(0x1a0c10, { roughness: 0.9 }), 9, 0.08, 9, 0, wallH, 0.1);
    scene.add(ceil);

    const lights = new THREE.Group();
    for (let i = 0; i < 18; i += 1) {
      const t = i / 17;
      const bulb = sphere(mat(0xffe6a6, { emissive: 0xffc878, emissiveIntensity: 1.4 }), 0.045, (t - 0.5) * 6.4, 2.85, -1.1 + Math.sin(t * 6) * 0.15);
      lights.add(bulb);
      const bulb2 = sphere(mat(0xffb0c8, { emissive: 0xff6a9a, emissiveIntensity: 1.1 }), 0.04, (t - 0.5) * 6.2, 2.7, 2.6);
      lights.add(bulb2);
    }
    scene.add(lights);
    gl.bulbs = lights;

    const poleM = mat(0x3a2418, { roughness: 0.7 });
    [-3.6, 3.6].forEach((x) => {
      scene.add(cyl(poleM, 0.08, 3.2, x, 1.6, -3.9));
      scene.add(cyl(poleM, 0.08, 3.2, x, 1.6, 3.9));
    });

    const signTex = canvasTex(1024, 256, (ctx) => {
      ctx.fillStyle = "#1a0c10";
      ctx.fillRect(0, 0, 1024, 256);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 16;
      ctx.strokeRect(12, 12, 1000, 232);
      ctx.fillStyle = "#ffe6a6";
      ctx.font = "700 92px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("PINBALL ALLEY", 512, 120);
      ctx.font = "32px Georgia, serif";
      ctx.fillStyle = "#e8a0b8";
      ctx.fillText("ONE BALL · HOW MANY CHAPTERS?", 512, 188);
    });
    const sign = new THREE.Mesh(gl.geo.box, new THREE.MeshStandardMaterial({
      map: signTex, emissive: 0x3a2418, emissiveIntensity: 0.35, roughness: 0.45,
    }));
    sign.scale.set(2.6, 0.62, 0.06);
    sign.position.set(0, 2.55, -3.95);
    scene.add(sign);

    gl.cabinet = buildCabinet();
    scene.add(gl.cabinet);

    gl.aura = makeAura();
    gl.aura.position.set(-1.22, 0, -0.35);
    gl.aura.rotation.y = Math.PI + 0.42;
    scene.add(gl.aura);

    const stool = cyl(mat(0x3a2418), 0.16, 0.08, 1.25, 0.42, -0.15);
    scene.add(stool);
    scene.add(cyl(mat(0x2a1810), 0.04, 0.42, 1.25, 0.21, -0.15));

    gl.ballMesh = sphere(mat(0xcfd8e0, { metalness: 0.95, roughness: 0.18, envMapIntensity: 1 }), 1, 0, 0, 0, gl.geo.sphereHi);
    gl.ballMesh.scale.setScalar(BALL_R);
    gl.pfRoot.add(gl.ballMesh);
    gl.shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(BALL_R * 1.6, 12),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
    );
    gl.shadowDisc.rotation.x = -Math.PI / 2;
    gl.pfRoot.add(gl.shadowDisc);

    for (let i = 0; i < 8; i += 1) {
      const ghost = sphere(new THREE.MeshBasicMaterial({
        color: 0xe8f0ff, transparent: true, opacity: 0.12, depthWrite: false,
      }), BALL_R * 0.85, 0, -4, 0);
      gl.pfRoot.add(ghost);
      gl.trail.push(ghost);
    }
    for (let i = 0; i < 36; i += 1) {
      const p = sphere(new THREE.MeshBasicMaterial({
        color: 0xffe6a6, transparent: true, opacity: 0, depthWrite: false,
      }), 0.012, 0, -8, 0);
      gl.pfRoot.add(p);
      gl.sparks.push({ mesh: p, life: 0, vx: 0, vy: 0, vz: 0 });
    }

    gl.plungerRod = cyl(mat(0xc0c8d0, { metalness: 0.85, roughness: 0.25 }), 0.012, 0.42, 0.55, BALL_R, 0.18);
    gl.plungerRod.rotation.x = Math.PI / 2;
    gl.pfRoot.add(gl.plungerRod);

    rebuildToys(chapterSpec(1));
    resizeGL();
    return gl;
  }

  function buildCabinet() {
    const g = new THREE.Group();
    const wood = mat(0x3a1c14, { roughness: 0.55, metalness: 0.08 });
    const dark = mat(0x1a0c0c, { roughness: 0.6 });
    const chrome = mat(0xc0c8d0, { metalness: 0.9, roughness: 0.22 });
    const brass = mat(GOLD, { metalness: 0.7, roughness: 0.3, emissive: 0x4a3010, emissiveIntensity: 0.25 });

    g.add(box(wood, 1.18, 0.55, 1.42, 0, 0.55, 0.52));
    g.add(box(dark, 1.22, 0.06, 1.46, 0, 0.84, 0.52));
    [[-0.48, -0.05], [0.48, -0.05], [-0.48, 1.08], [0.48, 1.08]].forEach((p) => {
      g.add(cyl(dark, 0.045, 0.55, p[0], 0.28, p[1]));
    });
    g.add(box(wood, 1.05, 0.82, 0.16, 0, 1.28, 1.28));
    g.add(box(brass, 1.08, 0.04, 0.18, 0, 1.70, 1.28));

    gl.backglassMesh = new THREE.Mesh(gl.geo.box, new THREE.MeshStandardMaterial({
      roughness: 0.35, metalness: 0.1, emissive: 0x221018, emissiveIntensity: 0.55,
    }));
    gl.backglassMesh.scale.set(0.92, 0.7, 0.03);
    gl.backglassMesh.position.set(0, 1.28, 1.20);
    g.add(gl.backglassMesh);
    stampBackglass(0, "CHAPTER 0", "THE PARLOR TABLE");

    const coin = box(brass, 0.22, 0.16, 0.04, 0, 0.48, -0.18);
    g.add(coin);
    gl.coinDoor = coin;
    g.add(box(chrome, 0.08, 0.08, 0.03, 0, 0.48, -0.21));

    gl.pfRoot = new THREE.Group();
    gl.pfRoot.position.set(0, 0.90, -0.12);
    gl.pfRoot.rotation.x = -0.21;
    g.add(gl.pfRoot);

    gl.pfMat = new THREE.MeshStandardMaterial({
      roughness: 0.72, metalness: 0.08, map: playfieldTex(null),
    });
    const pf = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.18), gl.pfMat);
    pf.rotation.x = -Math.PI / 2;
    pf.position.set(0, 0, 0.59);
    gl.pfRoot.add(pf);
    gl.pfMesh = pf;

    const railM = chrome;
    gl.pfRoot.add(box(railM, 0.03, 0.05, 1.16, -0.47, 0.03, 0.58));
    gl.pfRoot.add(box(railM, 0.03, 0.05, 1.16, 0.47, 0.03, 0.46));
    gl.pfRoot.add(box(railM, 0.03, 0.05, 1.10, 0.60, 0.03, 0.52));
    gl.pfRoot.add(box(railM, 0.96, 0.05, 0.03, 0, 0.03, 1.16));

    gl.hungryMaw = makeHungryMaw();
    gl.pfRoot.add(gl.hungryMaw);
    gl.flipR = makeFlipper(1);
    gl.pfRoot.add(gl.flipR.group);

    gl.miniFlip = makeFlipper(0);
    gl.miniFlip.group.scale.setScalar(0.62);
    gl.miniFlip.group.visible = false;
    gl.pfRoot.add(gl.miniFlip.group);

    gl.underglow = new THREE.PointLight(0xc45a6a, 1.8, 3.2, 1.6);
    gl.underglow.position.set(0, 0.22, 0.5);
    g.add(gl.underglow);

    gl.pfRoot.add(gl.toys);
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.92, 1.14),
      new THREE.MeshStandardMaterial({
        color: 0xb8d8f0,
        transparent: true,
        opacity: 0.07,
        roughness: 0.12,
        metalness: 0.35,
        depthWrite: false,
      })
    );
    glass.rotation.x = -Math.PI / 2;
    glass.position.set(0, 0.055, 0.58);
    gl.pfRoot.add(glass);
    g.scale.setScalar(1.16);
    g.position.y = 0.02;
    return g;
  }

  function makeFlipper(side) {
    const group = new THREE.Group();
    const chrome = mat(0xe8eef4, { metalness: 0.88, roughness: 0.22 });
    const rubber = mat(0xc41e3a, { roughness: 0.55, emissive: 0x400810, emissiveIntensity: 0.2 });
    const live = side > 0;
    const len = live ? LIVE.len : 0.12;
    const body = box(chrome, len, 0.018, live ? 0.042 : 0.032, len / 2, 0.012, 0);
    const tip = box(rubber, 0.055, 0.022, 0.044, len - 0.02, 0.012, 0);
    group.add(body);
    group.add(tip);
    const px = side === 0 ? 0.0 : LIVE.px;
    const py = side === 0 ? 0.62 : LIVE.py;
    const loc = pfLocal(px, py, 0);
    group.position.copy(loc);
    group.position.y = 0.01;
    return { group, side, px, py, len };
  }

  function makeHungryMaw() {
    const g = new THREE.Group();
    const flesh = mat(0x5a1020, { emissive: 0xc41e3a, emissiveIntensity: 0.55, roughness: 0.55 });
    const dark = mat(0x120608, { roughness: 0.7 });
    const loc = pfLocal(-0.30, 0.08, 0);
    g.position.copy(loc);
    g.position.y = 0.01;
    const pit = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), dark);
    pit.rotation.x = -Math.PI / 2;
    g.add(pit);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.014, 8, 18), flesh);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    g.add(ring);
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI + 0.2;
      const tooth = box(mat(0xf0d09a, { roughness: 0.35 }), 0.018, 0.028, 0.012, Math.cos(a) * 0.09, 0.018, Math.sin(a) * 0.07);
      g.add(tooth);
    }
    const dead = box(mat(0x2a1014, { roughness: 0.8, metalness: 0.15 }), 0.11, 0.014, 0.028, 0.08, 0.012, 0.04);
    dead.rotation.y = 0.7;
    g.add(dead);
    const glow = new THREE.PointLight(0xc41e3a, 1.4, 0.7, 2);
    glow.position.set(0, 0.06, 0);
    g.add(glow);
    gl.hungryLight = glow;
    return g;
  }

  function stampBackglass(score, chapter, name) {
    if (!gl || !gl.backglassMesh) return;
    const tex = backglassTex(score, chapter, name);
    const m = gl.backglassMesh.material;
    if (m.map) m.map.dispose();
    m.map = tex;
    m.needsUpdate = true;
  }

  function clearToys() {
    if (!gl) return;
    while (gl.toys.children.length) {
      const ch = gl.toys.children[0];
      gl.toys.remove(ch);
    }
  }

  function addBumperMesh(b) {
    const g = new THREE.Group();
    const col = hexCol(b.hue || "#e8a0b8");
    const body = mat(col, { emissive: col, emissiveIntensity: 0.25, roughness: 0.4 });
    const cap = mat(0xf7f2ea, { emissive: col, emissiveIntensity: 0.55, roughness: 0.3 });
    const c = cyl(body, b.r * 0.95, 0.028, 0, 0.016, 0, 14);
    g.add(c);
    g.add(sphere(cap, b.r * 0.72, 0, 0.034, 0));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(b.r * 0.85, 0.006, 6, 16), mat(0xf0d09a, { metalness: 0.6, roughness: 0.3 })));
    const loc = pfLocal(b.x, b.y, 0);
    g.position.copy(loc);
    g.position.y = 0;
    const light = new THREE.PointLight(col, 0, 0.55, 2);
    light.position.set(0, 0.06, 0);
    g.add(light);
    gl.toys.add(g);
    b.mesh = g;
    b.light = light;
    b.cap = g.children[1];
    b.flash = 0;
  }

  function rebuildToys(spec) {
    if (!gl) return;
    clearToys();
    const toys = spec.toys || {};
    gl.bumpers = (spec.bumpers || []).map((src, i) => {
      const b = Object.assign({ i }, src);
      addBumperMesh(b);
      return b;
    });
    gl.posts = [];
    if (toys.posts) {
      const spots = [[-0.22, 0.30, 0.02], [0.22, 0.30, 0.02], [0, 0.86, 0.018]];
      spots.forEach((s) => {
        const p = { x: s[0], y: s[1], r: s[2] };
        const m = cyl(mat(0xd4a45a, { metalness: 0.7, roughness: 0.28 }), p.r, 0.04, 0, 0.02, 0);
        const loc = pfLocal(p.x, p.y, 0);
        m.position.copy(loc);
        m.position.y = 0.02;
        gl.toys.add(m);
        gl.posts.push(p);
      });
    }
    gl.thorns = [];
    if (toys.thorns) {
      [[-0.40, 0.20], [0.40, 0.20]].forEach((s) => {
        const p = { x: s[0], y: s[1], r: 0.022 };
        const m = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.07, 6), mat(0x8a3030, { emissive: 0x400810, emissiveIntensity: 0.4 }));
        const loc = pfLocal(p.x, p.y, 0);
        m.position.copy(loc);
        m.position.y = 0.035;
        gl.toys.add(m);
        gl.thorns.push(p);
      });
    }
    gl.spinner = null;
    if (toys.spinner && spec.spinner) {
      const s = spec.spinner;
      const g = new THREE.Group();
      const gate = box(mat(0xf0d09a, { metalness: 0.5, emissive: 0x6a4808, emissiveIntensity: 0.4 }), 0.12, 0.04, 0.012, 0, 0.03, 0);
      g.add(gate);
      const loc = pfLocal(s.x, s.y, 0);
      g.position.copy(loc);
      gl.toys.add(g);
      gl.spinner = { x: s.x, y: s.y, mesh: g, ang: 0, vel: 0, lock: 0 };
    }
    gl.sink = null;
    if (toys.sink && spec.sink) {
      const s = spec.sink;
      const hole = new THREE.Mesh(
        new THREE.CircleGeometry(s.r, 16),
        new THREE.MeshStandardMaterial({ color: 0x040208, emissive: 0x3a1040, emissiveIntensity: 0.45, roughness: 0.8 })
      );
      hole.rotation.x = -Math.PI / 2;
      const loc = pfLocal(s.x, s.y, 0);
      hole.position.set(loc.x, 0.002, loc.z);
      gl.toys.add(hole);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(s.r * 1.05, 0.006, 6, 18), mat(0xe8a0b8, { emissive: 0x6a2038, emissiveIntensity: 0.5 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(loc.x, 0.006, loc.z);
      gl.toys.add(ring);
      gl.sink = { x: s.x, y: s.y, r: s.r, mesh: hole, flash: 0 };
    }
    gl.ramp = null;
    if (toys.ramp) {
      const rampM = mat(0xc0c8d0, { metalness: 0.8, roughness: 0.25 });
      const rail = box(rampM, 0.08, 0.04, 0.42, 0, 0.05, 0);
      const loc = pfLocal(-0.38, 0.62, 0);
      rail.position.copy(loc);
      rail.position.y = 0.04;
      rail.rotation.y = 0.4;
      rail.rotation.x = -0.35;
      gl.toys.add(rail);
      gl.ramp = { mouthX: -0.40, mouthY: 0.48, mouthR: 0.055, mesh: rail };
    }
    gl.gate = null;
    if (toys.gate) {
      const door = box(mat(0xf0d09a, { metalness: 0.4, emissive: 0x4a3010, emissiveIntensity: 0.3 }), 0.12, 0.05, 0.02, 0, 0.03, 0);
      const loc = pfLocal(0.34, 0.58, 0);
      door.position.copy(loc);
      gl.toys.add(door);
      gl.gate = { x: 0.34, y: 0.58, open: false, mesh: door };
    }
    gl.bonus = [];
    if (toys.bonus) {
      [0.38, 0.42].forEach((y, i) => {
        const p = { x: 0.42, y, r: 0.028, i };
        const m = cyl(mat(0x4aaa6a, { emissive: 0x145028, emissiveIntensity: 0.4 }), p.r, 0.02, 0, 0.012, 0);
        const loc = pfLocal(p.x, p.y, 0);
        m.position.copy(loc);
        gl.toys.add(m);
        gl.bonus.push(p);
      });
    }
    gl.rollovers = [];
    if (toys.rollovers) {
      [-0.16, 0, 0.16].forEach((x, i) => {
        const p = { x, y: 0.90, r: 0.03, i, on: false };
        const m = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 6, 12), mat(0xb8e8e0, { emissive: 0x1a4040, emissiveIntensity: 0.4 }));
        m.rotation.x = Math.PI / 2;
        const loc = pfLocal(p.x, p.y, 0);
        m.position.set(loc.x, 0.004, loc.z);
        gl.toys.add(m);
        p.mesh = m;
        gl.rollovers.push(p);
      });
    }
    gl.slings = !!toys.slings;
    if (gl.slings) {
      const rub = mat(0xc41e3a, { roughness: 0.5, emissive: 0x400810, emissiveIntensity: 0.25 });
      const l = box(rub, 0.16, 0.03, 0.02, 0, 0.02, 0);
      l.position.copy(pfLocal(-0.30, 0.24, 0));
      l.rotation.y = 0.7;
      gl.toys.add(l);
      const r = box(rub, 0.16, 0.03, 0.02, 0, 0.02, 0);
      r.position.copy(pfLocal(0.30, 0.24, 0));
      r.rotation.y = -0.7;
      gl.toys.add(r);
    }
    if (gl.miniFlip) gl.miniFlip.group.visible = !!toys.upperFlip;
    if (gl.pfMat) {
      if (gl.pfMat.map) gl.pfMat.map.dispose();
      gl.pfMat.map = playfieldTex(spec);
      gl.pfMat.needsUpdate = true;
    }
    const glow = spec.glow || 0xc45a6a;
    gl.glowCol.set(glow);
    if (gl.underglow) gl.underglow.color.copy(gl.glowCol);
    if (gl.neon) gl.neon.color.copy(gl.glowCol);
  }

  function spawnSparks(x, y, n, color) {
    if (!gl) return;
    let spawned = 0;
    for (let i = 0; i < gl.sparks.length && spawned < n; i += 1) {
      const s = gl.sparks[i];
      if (s.life > 0) continue;
      s.life = 0.35 + Math.random() * 0.25;
      const loc = pfLocal(x, y, 0.02);
      s.mesh.position.copy(loc);
      s.mesh.material.color.set(color || 0xffe6a6);
      s.mesh.material.opacity = 0.9;
      s.vx = (Math.random() - 0.5) * 0.9;
      s.vy = 0.4 + Math.random() * 0.6;
      s.vz = (Math.random() - 0.5) * 0.9;
      spawned += 1;
    }
  }

  function tickSparks(dt) {
    if (!gl) return;
    gl.sparks.forEach((s) => {
      if (s.life <= 0) {
        s.mesh.material.opacity = 0;
        return;
      }
      s.life -= dt;
      s.vy -= 1.8 * dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      s.mesh.material.opacity = Math.max(0, s.life * 2.2);
    });
  }

  /* ───────── physics ───────── */
  function baseWalls() {
    const w = [];
    const add = (ax, ay, bx, by) => w.push({ ax, ay, bx, by });
    add(-0.48, 0.34, -0.48, 0.84);
    add(-0.48, 0.84, -0.34, 0.97);
    add(-0.34, 0.97, -0.10, 1.03);
    add(-0.10, 1.03, 0.16, 1.03);
    add(0.16, 1.03, 0.36, 0.97);
    add(0.36, 0.97, 0.48, 0.86);
    add(0.48, 0.22, 0.48, 0.86);
    add(0.48, 0.90, 0.62, 0.90);
    add(0.62, 0.08, 0.62, 0.90);
    add(0.62, 0.90, 0.52, 1.02);
    add(0.52, 1.02, 0.28, 1.05);
    add(-0.48, 0.34, -0.26, 0.10);
    add(0.40, 0.0, 0.48, 0.14);
    add(LIVE.px, LIVE.py, 0.38, 0.28);
    add(0.34, 0.0, 0.40, 0.0);
    if (gl && gl.slings) {
      add(-0.42, 0.36, -0.22, 0.28);
      add(0.42, 0.32, 0.26, 0.32);
      add(0.26, 0.32, LIVE.px + 0.02, 0.18);
    }
    if (gl && gl.gate && !gl.gate.open) add(0.28, 0.54, 0.40, 0.62);
    return w;
  }

  function hitSeg(b, ax, ay, bx, by, thick) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = b.x - ax;
    const apy = b.y - ay;
    const ab2 = abx * abx + aby * aby;
    let t = ab2 > 0 ? (apx * abx + apy * aby) / ab2 : 0;
    t = clamp(t, 0, 1);
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    const dx = b.x - cx;
    const dy = b.y - cy;
    const d = Math.hypot(dx, dy);
    const rad = b.r + (thick || WALL_T);
    if (d >= rad || d < 1e-8) return false;
    const nx = dx / d;
    const ny = dy / d;
    const o = rad - d;
    b.x += nx * o;
    b.y += ny * o;
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      b.vx -= 1.38 * vn * nx;
      b.vy -= 1.38 * vn * ny;
      const tx = -ny;
      const ty = nx;
      const vt = b.vx * tx + b.vy * ty;
      b.vx -= vt * tx * 0.16;
      b.vy -= vt * ty * 0.16;
    }
    return true;
  }

  function hitCirc(b, cx, cy, r, kick, bounce) {
    const dx = b.x - cx;
    const dy = b.y - cy;
    const d = Math.hypot(dx, dy);
    const rad = b.r + r;
    if (d >= rad || d < 1e-8) return false;
    const nx = dx / d;
    const ny = dy / d;
    b.x = cx + nx * rad;
    b.y = cy + ny * rad;
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      const e = bounce == null ? 0.55 : bounce;
      b.vx -= (1 + e) * vn * nx;
      b.vy -= (1 + e) * vn * ny;
      if (kick) {
        b.vx += nx * kick;
        b.vy += ny * kick;
      }
    }
    return vn < 0;
  }

  function flipAngles(side, raised) {
    if (side <= 0) return raised ? 0.55 : -0.4;
    return raised ? UP_ANG : REST_ANG;
  }

  function collideFlipper(b, flip) {
    const c = Math.cos(flip.angle);
    const s = Math.sin(flip.angle);
    const tipX = flip.px + c * flip.len;
    const tipY = flip.py + s * flip.len;
    const dx = tipX - flip.px;
    const dy = tipY - flip.py;
    const len2 = flip.len * flip.len;
    let t = ((b.x - flip.px) * dx + (b.y - flip.py) * dy) / Math.max(1e-8, len2);
    t = clamp(t, 0, 1);
    const cx = flip.px + dx * t;
    const cy = flip.py + dy * t;
    const ox = b.x - cx;
    const oy = b.y - cy;
    const d = Math.hypot(ox, oy);
    const rad = b.r + 0.02;
    if (d >= rad || d < 1e-8) return false;
    const nx = ox / d;
    const ny = oy / d;
    b.x += nx * (rad - d);
    b.y += ny * (rad - d);
    const rx = cx - flip.px;
    const ry = cy - flip.py;
    const svelX = -flip.omega * ry;
    const svelY = flip.omega * rx;
    const relVx = b.vx - svelX;
    const relVy = b.vy - svelY;
    const vn = relVx * nx + relVy * ny;
    if (vn < 0) {
      b.vx -= 1.45 * vn * nx;
      b.vy -= 1.45 * vn * ny;
      b.vx += svelX * 0.92;
      b.vy += svelY * 0.92;
      const popping = flip.side > 0 && flip.omega < -5;
      if (popping) {
        b.vx += nx * 0.18 + 0.22;
        b.vy += ny * 0.9 + 0.48;
        sfx("flip");
      } else if (Math.abs(flip.omega) < 3 && flip.angle < REST_ANG - 0.25) {
        b.vx *= 0.78;
        b.vy *= 0.62;
      }
    }
    return true;
  }

  function capSpeed(b, spec) {
    const max = MAX_SPD * ((spec && spec.speed) || 1);
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > max) {
      b.vx *= max / sp;
      b.vy *= max / sp;
    }
  }

  function addScore(n, why) {
    if (!run || run.done) return;
    run.score += n | 0;
    run.juice = Math.min(1, run.juice + 0.18);
    if (gl) gl.cam.shake = Math.min(0.12, gl.cam.shake + 0.03);
    if (why && $("pinballStatus")) $("pinballStatus").textContent = why;
    paintHud();
  }

  function noteStatus(text) {
    const el = $("pinballStatus");
    if (el) el.textContent = text;
  }

  function onBumper(i) {
    if (!run || !gl || !gl.bumpers[i]) return;
    const b = gl.bumpers[i];
    b.flash = 1;
    spawnSparks(b.x, b.y, 8, b.hue);
    sfx("bumper");
    addScore(run.spec.bumper || 120, `Bumper +${run.spec.bumper || 120}`);
    const m = run.mission;
    if (m.id === "bumpers" && m.hits[i] === false) {
      m.hits[i] = true;
      noteStatus(missionText(m, run.spec));
    }
    if (m.id === "combo") {
      m.window = 900;
      m.n += 1;
      noteStatus(missionText(m, run.spec));
    }
    maybeClear();
  }

  function maybeClear() {
    if (!run || run.done || !missionDone(run.mission) || run.wantChapter) return;
    run.wantChapter = true;
    run.fanfare = 900;
    addScore(1000 * (run.spec.ch || 1), `${hudChapter(run.spec)} CLEAR`);
    sfx("chapter");
    PF.setAura("celebrate");
    noteStatus(`${hudChapter(run.spec)} CLEAR · Plunge onward.`);
  }

  function advanceChapter() {
    if (!run || run.done) return;
    run.cleared = run.spec.ch || run.cleared + 1;
    const next = chapterSpec(run.cleared + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    run.spec = next;
    run.mission = missionReset(next);
    run.wantChapter = false;
    run.fanfare = 0;
    rebuildToys(next);
    stampBackglass(run.score, hudChapter(next), next.name);
    if (rk() && run.kitRun && typeof rk().reportDepth === "function") {
      rk().reportDepth(run.kitRun, next.ch || next.id, { name: next.name, coda: !!next.coda });
    }
    if (run.ball && run.ball.mode === "play") {
      run.ball.x = 0.56;
      run.ball.y = 0.16;
      run.ball.vx = 0;
      run.ball.vy = 0;
      run.ball.mode = "plunger";
      run.ball.h = 0;
      run.safe = 700;
    }
    noteStatus(`${hudChapter(next)} — ${next.barker}`);
    paintHud();
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
  }

  function physics(ms) {
    if (!run || run.done || !run.ball) return;
    const dt = ms / 1000;
    const spec = run.spec;
    const b = run.ball;
    const speed = spec.speed || 1;

    run.juice = Math.max(0, run.juice - dt * 0.55);
    if (run.mission && run.mission.window > 0) {
      run.mission.window -= ms;
      if (run.mission.window <= 0 && run.mission.id === "combo") run.mission.n = 0;
    }
    run.safe = Math.max(0, run.safe - ms);
    run.sinkLock = Math.max(0, (run.sinkLock || 0) - ms);
    run.rampLock = Math.max(0, (run.rampLock || 0) - ms);
    run.slingLock = Math.max(0, (run.slingLock || 0) - ms);
    if (run.fanfare > 0) {
      run.fanfare -= ms;
      if (run.fanfare <= 0 && run.wantChapter) advanceChapter();
    }

    const targetR = flipAngles(1, run.wantFlip);
    const prevR = run.angleR;
    const maxR = (run.wantFlip ? FLIP_UP : FLIP_DOWN) * dt;
    run.angleR += clamp(targetR - run.angleR, -maxR, maxR);
    run.omegaR = (run.angleR - prevR) / dt;
    if (run.spec.toys && run.spec.toys.upperFlip) {
      const near = Math.hypot(b.x, b.y - 0.62) < 0.16;
      const tU = near ? 0.55 : -0.4;
      const prevU = run.angleU || -0.4;
      run.angleU = lerp(prevU, tU, clamp(18 * dt, 0, 1));
      run.omegaU = (run.angleU - prevU) / dt;
    }

    if (b.mode === "plunger") {
      const holding = !!(run.wantP);
      if (holding) run.charge = clamp((run.charge || 0) + dt * 1.15, 0, 1);
      if (!holding && run.charge > 0.04) {
        const power = Math.max(run.charge, 0.42);
        b.mode = "play";
        b.vy = 0.85 + power * 1.55;
        b.vx = -0.02;
        b.y = 0.22;
        b.x = 0.55;
        run.safe = 650;
        sfx("shove");
        run.charge = 0;
      }
      if (!holding) run.charge = Math.max(0, (run.charge || 0) - dt * 0.4);
      b.x = 0.55;
      b.y = 0.14 + (run.charge || 0) * 0.04;
      b.vx = 0;
      b.vy = 0;
      return;
    }

    if (b.mode === "ramp") {
      b.rampT = (b.rampT || 0) + dt / 0.72;
      const t = clamp(b.rampT, 0, 1);
      b.x = lerp(-0.40, 0.08, t);
      b.y = lerp(0.50, 0.90, t) + Math.sin(t * Math.PI) * 0.08;
      b.h = Math.sin(t * Math.PI) * 0.12;
      if (t >= 1) {
        b.mode = "play";
        b.h = 0;
        b.vx = 0.28;
        b.vy = -0.08;
        b.x = 0.24;
        b.y = 0.88;
        run.rampLock = 400;
        const m = run.mission;
        if (m.id === "ramp-sink") m.ramp = true;
        if (m.id === "chain" && m.phase === "ramp") m.phase = "spin";
        addScore(400, "Ramp!");
        sfx("rack");
        maybeClear();
      }
      return;
    }

    if (b.mode === "sink") {
      b.sinkT = (b.sinkT || 0) + dt;
      b.h = -0.02;
      if (b.sinkT > 0.55) {
        b.mode = "play";
        b.h = 0;
        b.x = 0;
        b.y = 0.42;
        b.vx = 0.18 + Math.random() * 0.28;
        b.vy = 0.55;
        run.sinkLock = 500;
      }
      return;
    }

    b.vy -= G * speed * dt;
    const hunger = spec.hunger == null ? 0.7 : spec.hunger;
    if (b.x < -0.14 && b.y < 0.40) {
      const pull = hunger * (0.7 + Math.max(0, 0.40 - b.y) * 1.6);
      b.vx -= pull * dt;
      b.vy -= pull * 0.85 * dt;
      if (!run.taughtHungry) {
        run.taughtHungry = true;
        noteStatus("LEFT LANE IS HUNGRY — one thumb, stay right.");
      }
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.mode === "play" && b.x > 0.46 && b.y > 0.84) {
      b.x = 0.16;
      b.y = 0.46;
      b.vx = 0.04;
      b.vy = 0.02;
    }

    baseWalls().forEach((w) => hitSeg(b, w.ax, w.ay, w.bx, w.by, WALL_T));

    collideFlipper(b, { px: LIVE.px, py: LIVE.py, len: LIVE.len, angle: run.angleR, omega: run.omegaR, side: 1 });
    if (spec.toys && spec.toys.upperFlip) {
      collideFlipper(b, { px: 0, py: 0.62, len: 0.12, angle: run.angleU || -0.4, omega: run.omegaU || 0, side: 0 });
      if (gl.gate && !gl.gate.open && Math.hypot(b.x, b.y - 0.62) < 0.12) {
        gl.gate.open = true;
        if (run.mission.id === "gate") run.mission.open = true;
        noteStatus("Gate pulsed itself — bonus lane live.");
        sfx("chapter");
        maybeClear();
      }
    }

    if (gl.bumpers) {
      gl.bumpers.forEach((bm, i) => {
        if (hitCirc(b, bm.x, bm.y, bm.r, 0.58, 0.55)) {
          b.vx += 0.07;
          onBumper(i);
        }
      });
    }
    if (gl.posts) gl.posts.forEach((p) => hitCirc(b, p.x, p.y, p.r, 0, 0.4));
    if (gl.thorns) {
      gl.thorns.forEach((p) => {
        if (hitCirc(b, p.x, p.y, p.r, 0.15, 0.5)) {
          const inward = (p.x < 0 && b.x > p.x) || (p.x > 0 && b.x < p.x);
          if (inward) {
            b.vy += 0.35;
            noteStatus("Thorn SAVE — bounced in.");
          } else {
            b.vy -= 0.45;
            b.vx += p.x < 0 ? -0.2 : 0.2;
            noteStatus("Thorn DOOM — toward the outlane.");
          }
        }
      });
    }
    if (gl.slings && run.slingLock <= 0) {
      if (b.y > 0.16 && b.y < 0.38 && b.x < -0.16 && b.vy < 0.25) {
        b.vx -= 0.38;
        b.vy -= 0.22;
        run.slingLock = 180;
        sfx("sling");
        addScore(30, "Left sling fed the mouth.");
      }
      if (b.y > 0.16 && b.y < 0.34 && b.x > 0.18 && b.vy < 0.2) {
        b.vx -= 0.15;
        b.vy += 0.78;
        run.slingLock = 180;
        sfx("sling");
        addScore(30);
      }
    }
    if (gl.spinner && gl.spinner.lock <= 0) {
      const dx = b.x - gl.spinner.x;
      const dy = b.y - gl.spinner.y;
      if (dx * dx + dy * dy < 0.01) {
        const ticks = 1 + ((Math.hypot(b.vx, b.vy) * 2) | 0);
        gl.spinner.vel += ticks * 8;
        gl.spinner.lock = 220;
        sfx("spinner");
        addScore(50 * ticks, `Spinner · ${missionText(run.mission, spec)}`);
        const m = run.mission;
        if (m.id === "spinner") m.ticks += ticks;
        if (m.id === "alt" && m.phase === "spin") m.phase = "sink";
        if (m.id === "chain" && m.phase === "spin") m.phase = "sink";
        maybeClear();
      }
    }
    if (gl.sink && run.sinkLock <= 0 && Math.hypot(b.x - gl.sink.x, b.y - gl.sink.y) < gl.sink.r && Math.hypot(b.vx, b.vy) < 1.15) {
      b.mode = "sink";
      b.sinkT = 0;
      b.vx = 0;
      b.vy = 0;
      gl.sink.flash = 1;
      sfx("sinkhole");
      addScore(350, `Sink · ${missionText(run.mission, spec)}`);
      const m = run.mission;
      if (m.id === "sink") m.n += 1;
      if (m.id === "ramp-sink") m.sink += 1;
      if (m.id === "alt" && m.phase === "sink") m.phase = "done";
      if (m.id === "chain" && m.phase === "sink") m.phase = "done";
      maybeClear();
    }
    if (gl.ramp && run.rampLock <= 0 && b.mode === "play") {
      if (Math.hypot(b.x - gl.ramp.mouthX, b.y - gl.ramp.mouthY) < gl.ramp.mouthR && b.vy > 0.15) {
        b.mode = "ramp";
        b.rampT = 0;
      }
    }
    if (gl.bonus) {
      gl.bonus.forEach((p) => {
        if (Math.hypot(b.x - p.x, b.y - p.y) < p.r + b.r) {
          if (run.bonusLock > 0) return;
          run.bonusLock = 280;
          addScore(200, `Bonus lane · ${missionText(run.mission, spec)}`);
          if (run.mission.id === "gate") run.mission.bonus += 1;
          maybeClear();
        }
      });
    }
    run.bonusLock = Math.max(0, (run.bonusLock || 0) - ms);
    if (gl.rollovers) {
      gl.rollovers.forEach((p) => {
        const on = Math.hypot(b.x - p.x, b.y - p.y) < p.r + b.r;
        if (on && !p.on) {
          p.on = true;
          addScore(80, "Rollover");
        }
        if (!on) p.on = false;
      });
    }

    capSpeed(b, spec);

    if (run.safe <= 0 && b.mode === "play" && b.x < -0.10 && b.y < 0.12) {
      beginDrain("hungry");
    }
    if (run.safe <= 0 && b.mode === "play" && b.y < 0.018 && b.x < LIVE.px - 0.02) {
      beginDrain(b.x < 0.04 ? "hungry" : "drain");
    }
    if (run.safe <= 0 && b.mode === "play" && b.y < -0.02) beginDrain(b.x < 0.05 ? "hungry" : "drain");
  }

  function beginDrain(reason) {
    if (!run || run.done || run.draining) return;
    run.draining = true;
    run.deathNote = reason;
    if (run.ball) run.ball.mode = "dead";
    sfx("drain");
    PF.setAura("badLuck");
    noteStatus("Drain. One ball, one night.");
    if (gl) gl.cam.mode = "drain";
    setTimeout(() => finish(reason), DEATH_HOLD_MS);
  }

  /* ───────── camera / draw ───────── */
  function resizeGL() {
    if (!gl) return;
    const canvas = gl.canvas;
    const host = canvas.parentElement || canvas;
    const w = Math.max(2, host.clientWidth || window.innerWidth);
    const h = Math.max(2, host.clientHeight || window.innerHeight);
    gl.renderer.setSize(w, h, false);
    gl.camera.aspect = w / h;
    gl.camera.updateProjectionMatrix();
  }

  function syncFlipMeshes() {
    if (!gl || !run) return;
    if (gl.flipR) gl.flipR.group.rotation.y = -run.angleR;
    if (gl.miniFlip && gl.miniFlip.group.visible) gl.miniFlip.group.rotation.y = -(run.angleU || -0.4);
    if (gl.hungryLight) gl.hungryLight.intensity = 1.1 + Math.sin(idleT * 6) * 0.45;
  }

  function syncBall() {
    if (!gl || !gl.ballMesh) return;
    const b = run && run.ball;
    if (!b || run.done) {
      gl.ballMesh.visible = !run || !!run.draining;
      return;
    }
    gl.ballMesh.visible = true;
    const loc = pfLocal(b.x, b.y, b.h || 0);
    gl.ballMesh.position.copy(loc);
    gl.shadowDisc.position.set(loc.x, 0.001, loc.z);
    gl.shadowDisc.material.opacity = b.mode === "ramp" ? 0.12 : 0.35;
    if (gl.plungerRod) {
      gl.plungerRod.position.set(0.55 * 0.95, BALL_R, (0.10 - (run.charge || 0) * 0.12) * 1.18);
    }
    gl.trail.forEach((g, i) => {
      const t = (i + 1) / (gl.trail.length + 1);
      g.position.lerp(loc, 0.25 + t * 0.15);
      g.material.opacity = b.mode === "play" ? 0.16 * (1 - t) : 0;
    });
    if (gl.bumpers) {
      gl.bumpers.forEach((bm) => {
        if (bm.flash > 0) bm.flash *= 0.86;
        if (bm.light) bm.light.intensity = bm.flash * 3.2;
        if (bm.cap && bm.cap.material) bm.cap.material.emissiveIntensity = 0.4 + bm.flash * 1.8;
        if (bm.mesh) bm.mesh.scale.setScalar(1 + bm.flash * 0.12);
      });
    }
    if (gl.spinner) {
      gl.spinner.ang += gl.spinner.vel * 0.016;
      gl.spinner.vel *= 0.96;
      gl.spinner.lock = Math.max(0, gl.spinner.lock - 16);
      gl.spinner.mesh.rotation.y = gl.spinner.ang;
    }
    if (gl.gate && gl.gate.mesh) {
      gl.gate.mesh.rotation.y = gl.gate.open ? 1.2 : 0;
    }
  }

  function aimCamera(dt) {
    if (!gl) return;
    const cam = gl.camera;
    const mode = (run && !run.done) ? (run.ball && run.ball.mode === "plunger" ? "plunger" : run.draining ? "drain" : "play") : (run && run.done ? "result" : "vestibule");
    gl.cam.mode = mode;
    gl.cam.shake = Math.max(0, gl.cam.shake - dt * 1.8);
    let tx = 0;
    let ty = 1.35;
    let tz = 2.15;
    let lx = 0;
    let ly = 1.05;
    let lz = 0.35;
    let wantFov = 42;
    if (mode === "vestibule" || mode === "result") {
      gl.cam.yaw += dt * 0.16;
      const a = gl.cam.yaw;
      tx = Math.sin(a) * 1.7;
      ty = 1.58;
      tz = -2.25 - Math.cos(a) * 0.32;
      lx = -0.12;
      ly = 1.18;
      lz = 0.48;
      wantFov = 44;
    } else if (mode === "plunger") {
      const eye = pfWorld(0.42, -0.22, 0.38);
      tx = eye.x; ty = eye.y; tz = eye.z;
      const look = pfWorld(0.22, 0.55, 0.04);
      lx = look.x; ly = look.y; lz = look.z;
      wantFov = 32;
    } else if (mode === "play") {
      const b = run.ball;
      const eye = pfWorld((b ? b.x * 0.12 : 0), -0.26, 0.46);
      tx = eye.x; ty = eye.y; tz = eye.z;
      const look = pfWorld(b ? b.x * 0.38 : 0, 0.52 + (b ? b.y * 0.18 : 0), 0.03);
      lx = look.x; ly = look.y; lz = look.z;
      wantFov = 34;
    } else if (mode === "drain") {
      const eye = pfWorld(0.08, -0.18, 0.32);
      tx = eye.x; ty = eye.y; tz = eye.z;
      const look = pfWorld(0, 0.08, 0.02);
      lx = look.x; ly = look.y; lz = look.z;
      wantFov = 36;
    }
    const k = 1 - Math.pow(0.0018, dt);
    cam.position.x = lerp(cam.position.x, tx, k);
    cam.position.y = lerp(cam.position.y, ty, k);
    cam.position.z = lerp(cam.position.z, tz, k);
    cam.fov = lerp(cam.fov, wantFov, k);
    cam.updateProjectionMatrix();
    if (gl.cam.shake) {
      cam.position.x += (Math.random() - 0.5) * gl.cam.shake;
      cam.position.y += (Math.random() - 0.5) * gl.cam.shake;
    }
    cam.lookAt(lx, ly, lz);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible || !gl) return;
    const dt = Math.min(0.05, (now - (lastTs || now)) / 1000);
    lastTs = now;
    idleT += dt;
    if (run && !run.done) {
      run.acc = (run.acc || 0) + dt * 1000;
      while (run.acc >= STEP) {
        physics(STEP);
        run.acc -= STEP;
      }
      syncFlipMeshes();
      syncBall();
      paintHud();
      if (typeof PF.refreshDepth === "function") PF.refreshDepth();
    } else {
      if (gl.bumpers) {
        gl.bumpers.forEach((bm, i) => {
          bm.flash = 0.25 + 0.25 * Math.sin(idleT * 3 + i);
          if (bm.light) bm.light.intensity = bm.flash * 1.4;
        });
      }
      if (gl.aura) gl.aura.rotation.y = Math.PI + 0.42 + Math.sin(idleT * 0.6) * 0.08;
    }
    tickAura(dt);
    tickSparks(dt);
    if (gl.bulbs) gl.bulbs.rotation.y = Math.sin(idleT * 0.4) * 0.01;
    if (gl.underglow) gl.underglow.intensity = 1.4 + Math.sin(idleT * 3.2) * 0.35;
    aimCamera(dt);
    gl.renderer.render(gl.scene, gl.camera);
  }

  function startLoop() {
    if (raf) return;
    lastTs = 0;
    raf = requestAnimationFrame(frame);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /* ───────── run lifecycle ───────── */
  function isLive() {
    const ctx = run && (run.kitRun || run.ctx);
    return !!(run && !run.done && ctx && ctx.alive !== false);
  }

  function beginKitRun() {
    if (typeof PF.spendDemoCoin === "function") {
      if (!PF.spendDemoCoin(GAME_ID)) return null;
    }
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      try {
        const ctx = PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1, feverNode: true });
        if (ctx) return ctx;
      } catch (_) { /* */ }
    }
    return { gameId: GAME_ID, startedAt: Date.now(), feverNode: true, feverGate: null, depth: 0, score: 0, strikes: 0, alive: true };
  }

  function qaStartAt() {
    const kitRun = rk();
    const n = kitRun && kitRun._qaStart && (kitRun._qaStart[GAME_ID] | 0);
    if (kitRun && kitRun._qaStart) kitRun._qaStart[GAME_ID] = 0;
    return n >= 1 ? n : 1;
  }

  function start() {
    if (run && !run.done) return;
    declareP0();
    ensureGL();
    const kitRun = beginKitRun();
    if (!kitRun) {
      if ($("pinballStatus")) $("pinballStatus").textContent = "Out of demo coins · grant a pass";
      PF.refreshNightBoard();
      stampDepthCopy();
      return;
    }
    const spec = chapterSpec(qaStartAt());
    if (!spec) {
      stampDepthCopy();
      return;
    }
    run = {
      done: false, draining: false, ctx: kitRun, kitRun, spec,
      score: 0, cleared: 0, mission: missionReset(spec),
      angleR: REST_ANG, angleU: -0.4,
      omegaR: 0, omegaU: 0, wantFlip: false, wantP: false, taughtHungry: false,
      charge: 0, acc: 0, juice: 0, fanfare: 0, wantChapter: false,
      safe: 800, sinkLock: 0, rampLock: 0, slingLock: 0, bonusLock: 0,
      deathNote: "",
      ball: { x: 0.55, y: 0.14, vx: 0, vy: 0, r: BALL_R, h: 0, mode: "plunger" },
    };
    pointers.clear();
    rebuildToys(spec);
    stampBackglass(0, hudChapter(spec), spec.name);
    $("pinballStart").disabled = true;
    $("pinballStart").hidden = true;
    if ($("pinballVerdict")) $("pinballVerdict").hidden = true;
    kit.hideResult("pinballResult");
    PF.setTier("pinballTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    noteStatus(`${hudChapter(spec)} — ${spec.barker}`);
    paintHud();
    PF.focusCard("pinballCard", true);
    PF.setAura("think");
    if (rk() && typeof rk().reportDepth === "function") {
      rk().reportDepth(kitRun, spec.ch || spec.id, { name: spec.name, coda: !!spec.coda });
    }
    if (gl) gl.cam.mode = "plunger";
    startLoop();
  }

  function revealResult(shot) {
    const { reason, chapter, score, aura } = shot;
    $("pinballStart").disabled = false;
    $("pinballStart").hidden = false;
    $("pinballStart").textContent = "PLAY AGAIN · 1 demo coin";
    PF.focusCard("pinballCard", false);
    kit.setMode(card(), "result");
    const line = `CHAPTER ${chapter} · SCORE ${score}`;
    $("pinballVerdict").hidden = false;
    $("pinballVerdict").textContent = reason === "leave"
      ? `Left the table · ${line}`
      : reason === "souvenir"
        ? `Souvenir. ${line}.`
        : `Drained. ${line}.`;
    kit.fillResult({
      root: "pinballResult",
      depth: "pinballResultDepth",
      score: "pinballResultScore",
      aura: "pinballResultAura",
      copied: "pinballCopied",
    }, {
      depthLine: reason === "souvenir" ? `CHAPTER ${chapter} · SOUVENIR` : `CHAPTER ${chapter}`,
      scoreLine: `SCORE ${score}`,
      auraLine: aura,
    });
    const chEl = $("pinballChallengeText");
    if (chEl) chEl.textContent = challengeLine(chapter);
    PF.setTier("pinballTier", chapter > 0 ? `CHAPTER ${chapter}` : "DRAIN", chapter > 0 ? "perfect" : "miss");
    $("pinballStatus").textContent = reason === "leave" ? "Left the table." : reason === "souvenir" ? "Authored table over." : "Drain. One ball, one night.";
    const ok = chapter > 0 || score >= 300;
    if (ok) {
      PF.award(Math.max(10, Math.floor(score / 20)), true, "Pinball");
      PF.setAura(chapter >= 3 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `CHAPTER ${chapter}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Pinball drain");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "DRAIN", aura);
    }
    PF.refreshNightBoard();
    stampDepthCopy();
    if (gl) gl.cam.mode = "result";
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    pointers.clear();
    const chapter = run.cleared;
    const score = run.score;
    const shot = { reason, chapter, score, aura: auraFor(reason) };
    persistDepth({
      depth: chapter,
      score,
      deathReason: reason === "leave" ? "leave" : reason === "souvenir" ? "souvenir" : (run.deathNote || "drain"),
      cashedOut: reason === "souvenir",
      meta: { note: run.deathNote || reason, room: run.spec && run.spec.name, coda: !!(run.spec && run.spec.coda) },
    });
    stampDepthCopy();
    if (reason === "leave" || reason === "souvenir") {
      revealResult(shot);
      return;
    }
    setTimeout(() => revealResult(shot), 220);
  }

  function applyHold() {
    if (!run || run.done) return;
    let held = keys.flip || keys.P;
    pointers.forEach(() => { held = true; });
    if (run.ball && run.ball.mode === "plunger") {
      run.wantP = held;
      run.wantFlip = false;
    } else {
      run.wantP = false;
      run.wantFlip = held;
    }
  }

  function punchStart() {
    stampDepthCopy();
    const el = $("pinballStatus");
    if (el) el.textContent = DEPTH_COPY.punch;
    const btn = $("pinballStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* */ }
    }
  }

  PF.registerVendor({
    id: "pinball",
    playKey: "pinball",
    chalk: "One thumb. The left lane is hungry.",
    defaults: { bestPinballBalls: 0, bestPinballCh: 0, bestPinballScore: 0 },
    onLeave() {
      visible = false;
      if (run && !run.done) finish("leave");
      stopLoop();
    },
    onShow() {
      visible = true;
      declareP0();
      stampDepthCopy();
      if (!ensureGL()) {
        if ($("pinballStatus")) $("pinballStatus").textContent = "This parlor wants WebGL.";
        return;
      }
      startLoop();
      requestAnimationFrame(() => resizeGL());
    },
    onReset() {
      if (run && !run.done) finish("leave");
      run = null;
      pointers.clear();
      keys.flip = keys.P = false;
      if ($("pinballVerdict")) $("pinballVerdict").hidden = true;
      kit.hideResult("pinballResult");
      if ($("pinballStart")) {
        $("pinballStart").disabled = false;
        $("pinballStart").hidden = false;
        $("pinballStart").textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      stampDepthCopy();
      if (gl) gl.cam.mode = "vestibule";
    },
    refreshDepth(state) {
      const b = $("depthPinballBalls");
      if (b) b.textContent = run && !run.done ? String(run.score) : "0";
      const ch = $("depthPinballCh");
      if (ch) ch.textContent = run && !run.done ? hudChapter(run.spec) : "CHAPTER 0";
      const bb = $("depthPinballBestB");
      if (bb) bb.textContent = state.bestPinballScore ? String(state.bestPinballScore) : "—";
      const bc = $("depthPinballBestCh");
      const bestCh = Math.max(state.bestPinballCh || 0, (state.bestDepth && state.bestDepth.pinball) || 0);
      if (bc) bc.textContent = bestCh ? String(bestCh) : "—";
    },
    bind() {
      declareP0();
      const startBtn = $("pinballStart");
      if (startBtn) startBtn.addEventListener("click", start);
      function holdThumb(on) {
        if (!isLive()) {
          if (on) punchStart();
          return;
        }
        keys.flip = on;
        keys.P = on;
        applyHold();
      }
      const thumb = $("pinballThumb");
      if (thumb) {
        thumb.addEventListener("pointerdown", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          try { thumb.setPointerCapture(ev.pointerId); } catch (_) { /* */ }
          holdThumb(true);
        });
        const up = () => holdThumb(false);
        thumb.addEventListener("pointerup", up);
        thumb.addEventListener("pointercancel", up);
        thumb.addEventListener("lostpointercapture", up);
      }
      const canvas = $("pinballCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            punchStart();
            return;
          }
          ev.preventDefault();
          try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* */ }
          pointers.set(ev.pointerId, "thumb");
          applyHold();
        });
        const release = (ev) => {
          pointers.delete(ev.pointerId);
          applyHold();
        };
        canvas.addEventListener("pointerup", release);
        canvas.addEventListener("pointercancel", release);
      }
      window.addEventListener("keydown", (ev) => {
        if (!isLive()) return;
        if (ev.repeat) return;
        if (ev.code === "Space" || ev.code === "ArrowLeft" || ev.code === "ArrowRight" || ev.code === "KeyA" || ev.code === "KeyD" || ev.code === "KeyZ") {
          ev.preventDefault();
          keys.flip = true;
          keys.P = true;
          applyHold();
        }
      });
      window.addEventListener("keyup", (ev) => {
        if (ev.code === "Space" || ev.code === "ArrowLeft" || ev.code === "ArrowRight" || ev.code === "KeyA" || ev.code === "KeyD" || ev.code === "KeyZ") {
          keys.flip = false;
          keys.P = false;
        }
        applyHold();
      });
      window.addEventListener("resize", () => { if (visible) resizeGL(); });
      const copyBtn = $("pinballChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const st = PF.getState();
          const n = (st.lastRun && st.lastRun.game === GAME_ID) ? st.lastRun.depth : (st.bestPinballCh || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const el = $("pinballCopied");
            if (el) el.hidden = false;
            $("pinballStatus").textContent = "Copied — send it";
          }, () => {
            $("pinballStatus").textContent = text;
          });
        });
      }
      stampDepthCopy();
    },
  });
}
