/* Penny Pitch — Dish Garden. Full 3D tent game. Desktop Grok owns this doorway.
 * PF only. Never booth/port 6000. Never Imagine. Never Mirror Crew.
 * One coin, one depth run. Flick pennies into carnival glass. Quilt yanks after release.
 * Aura lock: pigtails, yellow crown+heart, green pinafore, black shoes. */
import * as THREE from "../world/lib/three.module.min.js";

function bootPitch() {
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) {
    requestAnimationFrame(bootPitch);
    return;
  }
  mountPitch(PF);
}
bootPitch();

function mountPitch(PF) {
  "use strict";
  const { $, kit } = PF;

  const GAME_ID = "pennypitch";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const DEATH_HOLD_MS = 820;
  const CLEAR_BONUS = 250;
  const MAX_NEED = 5 * 30;

  const GRAVITY = 10.4;
  const PENNY_R = 0.055;
  const TABLE_Y = 1.02;
  const TABLE_X = 0.86;
  const TABLE_Z0 = -1.58;
  const TABLE_Z1 = 1.32;
  const LAND_DAMP = 0.55;
  const FRICTION = 2.85;
  const LIP_REST = 0.5;
  const SUCTION = 3.8;
  const CAPTURE_SPEED = 1.65;
  const SETTLE_S = 0.32;
  const SETTLE_MAX = 3.6;

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
  const RUBY = 0xc41e3a;
  const TEAL = 0x2f8a88;
  const GREEN = 0x3f7a44;
  const AMBER = 0xb06a2a;
  const CREAM = 0xf0d09a;

  const GARDEN = {
    honest: [
      { x: 0, z: -0.72, r: 0.18, val: 50, color: GOLD },
      { x: 0, z: -1.18, r: 0.14, val: 20, color: RUBY },
      { x: 0, z: -0.28, r: 0.14, val: 10, color: GREEN },
      { x: 0.42, z: -0.72, r: 0.14, val: 10, color: TEAL },
      { x: -0.42, z: -0.72, r: 0.14, val: 10, color: AMBER },
    ],
    nested: [
      { x: 0, z: -0.88, r: 0.11, val: 50, color: GOLD },
      { x: 0, z: -0.88, r: 0.23, val: 20, color: RUBY, ringOnly: true, innerR: 0.125 },
      { x: 0, z: -0.88, r: 0.36, val: 10, color: TEAL, ringOnly: true, innerR: 0.245 },
      { x: 0.54, z: -0.42, r: 0.13, val: 15, color: AMBER },
      { x: -0.54, z: -0.42, r: 0.13, val: 15, color: GREEN },
    ],
    deadGold: [
      { x: 0, z: -0.88, r: 0.16, val: 0, color: GOLD, dead: true, painted: 50 },
      { x: 0.4, z: -0.52, r: 0.135, val: 20, color: RUBY },
      { x: -0.4, z: -0.52, r: 0.135, val: 20, color: TEAL },
      { x: 0.4, z: -1.22, r: 0.135, val: 20, color: AMBER },
      { x: -0.4, z: -1.22, r: 0.135, val: 20, color: GREEN },
    ],
    knock: [
      { x: 0, z: -0.7, r: 0.125, val: 30, color: GOLD },
      { x: 0.24, z: -0.96, r: 0.11, val: 20, color: RUBY },
      { x: -0.24, z: -0.96, r: 0.11, val: 20, color: TEAL },
      { x: 0, z: -1.22, r: 0.11, val: 15, color: AMBER },
      { x: 0.5, z: -0.7, r: 0.12, val: 10, color: GREEN },
      { x: -0.5, z: -0.7, r: 0.12, val: 10, color: CREAM },
    ],
    breath: [
      { x: 0, z: -0.95, r: 0.15, val: 50, color: GOLD },
      { x: 0.46, z: -0.58, r: 0.13, val: 20, color: RUBY },
      { x: -0.46, z: -0.58, r: 0.13, val: 20, color: TEAL },
      { x: 0.46, z: -1.28, r: 0.12, val: 15, color: AMBER },
      { x: -0.46, z: -1.28, r: 0.12, val: 15, color: GREEN },
      { x: 0, z: -0.38, r: 0.12, val: 10, color: CREAM },
    ],
  };

  const AUTHORED = [
    {
      id: 1, name: "Honest Garden", title: "Honest Garden", kind: "teach",
      needPts: 30, pennies: 6, jerkChance: 0, jerkAmt: 0,
      ripple: false, mirrorAim: false, dishes: GARDEN.honest, seed: null,
      cheat: "DISHES SIT STILL — LAND INSIDE GLASS",
      barker: "Honest Garden. Drag back, aim, release. Nest a penny in a dish.",
    },
    {
      id: 2, name: "Soft Yank", title: "Soft Yank", kind: "jerk",
      needPts: 35, pennies: 6, jerkChance: 1, jerkAmt: 0.28,
      ripple: false, mirrorAim: false, dishes: GARDEN.honest, seed: null,
      cheat: "QUILT YANKS AFTER YOU LET GO",
      barker: "After you let go, the quilt may yank. Watch the dishes slide.",
    },
    {
      id: 3, name: "Nested Rings", title: "Nested Rings", kind: "nested",
      needPts: 40, pennies: 6, jerkChance: 0, jerkAmt: 0,
      ripple: false, mirrorAim: false, dishes: GARDEN.nested, seed: null,
      cheat: "RINGS INSIDE RINGS — INNER IS GOLD",
      barker: "Three rings, one well. The inner cup is fifty. Ride the rims.",
    },
    {
      id: 4, name: "Dead Gold", title: "Dead Gold", kind: "deadFelt",
      needPts: 40, pennies: 6, jerkChance: 0, jerkAmt: 0,
      ripple: false, mirrorAim: false, dishes: GARDEN.deadGold, seed: null,
      cheat: "CENTER GOLD LOOKS LIKE 50 — SCORES 0",
      barker: "Center gold looks like fifty. It's painted wood. Scores nothing.",
    },
    {
      id: 5, name: "Knock Chain", title: "Knock Chain", kind: "knock",
      needPts: 45, pennies: 6, jerkChance: 0, jerkAmt: 0,
      ripple: false, mirrorAim: false, dishes: GARDEN.knock, seed: { dish: 5, val: 10 },
      cheat: "HOUSE PENNY IS LIVE — KNOCK IT DEEPER",
      barker: "A house penny already sits in a ten. Knock it into a better dish.",
    },
    {
      id: 6, name: "Breathing Velvet", title: "Breathing Velvet", kind: "ripple",
      needPts: 50, pennies: 6, jerkChance: 0.42, jerkAmt: 0.2,
      ripple: true, mirrorAim: false, dishes: GARDEN.breath, seed: null,
      cheat: "QUILT BREATHES — DISHES BOB",
      barker: "The velvet is breathing. Dishes rise and fall. Ride the wave.",
    },
    {
      id: 7, name: "Mirror Flick", title: "Mirror Flick", kind: "mirrorAim",
      needPts: 50, pennies: 6, jerkChance: 0, jerkAmt: 0,
      ripple: false, mirrorAim: true, dishes: GARDEN.honest, seed: null,
      cheat: "MIRROR — RELEASE FLIPS LEFT FOR RIGHT",
      barker: "Mirror. On release the flick flips left for right. Aim the other hand.",
    },
    {
      id: 8, name: "Fever Dish Opera", title: "Fever Dish Opera", kind: "comboFinale",
      needPts: 60, pennies: 6, jerkChance: 0, jerkAmt: 0.32,
      ripple: true, mirrorAim: false, dishes: GARDEN.nested, seed: null,
      forceJerkAt: 2, deadCenter: true,
      cheat: "RINGS + WAVE + HARD YANK — NEED 60",
      barker: "Finale: nested rings, living wave, one hard yank. Need sixty.",
    },
  ];

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Penny Pitch",
    depthUnit: "Cloth",
    sheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored CLOTHS then ENDLESS · 6 pennies · glass dishes on a living quilt",
    body: "Drag back to charge, aim, release. Nest pennies in carnival glass. Honest Garden → Soft Yank → Nested Rings → Dead Gold → Knock Chain → Breathing Velvet → Mirror Flick → Fever Dish Opera → ENDLESS Mood Swing.",
    status: "Depth run · START · 1 demo coin · 8 cloths, then ENDLESS",
    punch: "Depth run — drag the table or press START. Nest a dish.",
  };

  const AURA_LINES = {
    short_points: "Aura: Cloth jerked. Your pennies disagreed.",
    clear: "Aura: Dish nested. Cloth has opinions again.",
    deep: (n) => `Aura: Cloth ${n}. You're pitching through mood swings.`,
    leave: "Aura: Walking off mid-cloth? Pennies stay.",
    shallow: "Aura: Not a dish. The cloth kept the opinions.",
  };

  let world = null;
  let run = null;
  let bound = false;
  let starting = false;
  let pointerDown = false;
  let toastTimer = 0;
  const REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const CHEAP = REDUCE || ((navigator.hardwareConcurrency || 8) <= 4) || ((window.devicePixelRatio || 1) >= 2.5);
  const tmp = { v: null, v2: null, v3: null, ray: null, ptr: null };

  function dishHue(col) {
    if (col === GOLD) return { kind: "gold", name: "GOLD" };
    if (col === RUBY) return { kind: "ruby", name: "RUBY" };
    if (col === TEAL) return { kind: "teal", name: "TEAL" };
    if (col === GREEN) return { kind: "green", name: "GREEN" };
    if (col === AMBER) return { kind: "amber", name: "AMBER" };
    return { kind: "cream", name: "CREAM" };
  }

  function el(id) {
    return $(id);
  }

  function setText(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function rk() {
    return PF.runKit || null;
  }

  function card() {
    return el("pennyPitchCard");
  }

  function cabinetNode() {
    return document.getElementById("cabinet-penny-pitch");
  }

  function cabinetOn() {
    const node = cabinetNode();
    return !!(node && !node.hidden);
  }

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function stageEl() {
    return el("pennyPitchStage") || (card() && card().querySelector(".vendor-stage"));
  }

  function pennypitchCoda(n) {
    const t = Math.max(1, (n | 0) - AUTHORED_COUNT);
    const shrink = Math.max(0.72, 1 - 0.04 * t);
    const dishes = GARDEN.breath.map((d) => Object.assign({}, d, {
      r: d.r * shrink,
      innerR: d.innerR ? d.innerR * shrink : undefined,
    }));
    return {
      id: n,
      name: `Mood Swing ${n}`,
      title: `Mood Swing ${n}`,
      kind: "coda",
      needPts: Math.min(MAX_NEED - 10, 60 + 8 * t),
      pennies: 6,
      jerkChance: Math.min(0.95, 0.62 + 0.05 * t),
      jerkAmt: Math.min(0.36, 0.2 + 0.025 * t),
      ripple: true,
      mirrorAim: t % 3 === 0,
      dishes,
      seed: t % 2 === 0 ? { dish: dishes.length - 1, val: 10 } : null,
      coda: true,
      cheat: "ENDLESS · SMALLER GLASS · MOOD SWING",
      barker: `ENDLESS Mood Swing ${n} — smaller dishes, the quilt keeps changing its mind.`,
    };
  }

  function pennypitchStageParams(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[stage - 1]);
    if (!CODA_ENABLED) return null;
    return pennypitchCoda(stage);
  }

  function liveSpec() {
    if (run && run.spec) return run.spec;
    return pennypitchStageParams(1);
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun || typeof kitRun.declare !== "function") return;
    try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already */ }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: pennypitchStageParams,
      codaParams: pennypitchCoda,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function ensureHud() {
    const stage = stageEl();
    if (!stage) return null;
    let hud = stage.querySelector(`[data-runkit-hud="${GAME_ID}"]`);
    if (!hud) {
      hud = document.createElement("p");
      hud.className = "depth-hud";
      hud.dataset.runkitHud = GAME_ID;
      hud.setAttribute("aria-live", "polite");
      stage.appendChild(hud);
    }
    if (isLive() || (run && run.dying)) {
      const spec = liveSpec();
      const name = spec && (spec.name || spec.title);
      hud.textContent = spec && spec.coda
        ? `ENDLESS · CLOTH ${run.stage | 0} · ${name}`
        : `CLOTH ${run.stage | 0} · ${name}`;
      hud.hidden = false;
    } else {
      hud.textContent = "CLOTH 0";
      hud.hidden = true;
    }
    return hud;
  }

  function ensurePips(count) {
    const stage = stageEl();
    if (!stage) return null;
    let span = stage.querySelector(`[data-runkit-strikes="${GAME_ID}"]`);
    const n = Math.max(6, count | 0);
    if (!span) {
      span = document.createElement("span");
      span.className = "strike-pips";
      span.dataset.runkitStrikes = GAME_ID;
      span.setAttribute("aria-hidden", "true");
      stage.appendChild(span);
    }
    if (span.childElementCount !== n) {
      span.innerHTML = new Array(n).fill("<i></i>").join("");
    }
    return span;
  }

  function paintPips() {
    const spec = liveSpec();
    const max = (spec && spec.pennies) || 6;
    const span = ensurePips(max);
    if (!span) return;
    const used = (isLive() || (run && run.dying)) ? Math.max(0, max - (run.penniesLeft | 0)) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < used));
  }

  function resetPips() {
    const host = card();
    const pips = (host && host.querySelector("[data-runkit-strikes]")) || null;
    if (!pips) return;
    pips.querySelectorAll("i").forEach((n) => n.classList.remove("on"));
  }

  function stampDepthCopy() {
    const node = card() && card().querySelector("[data-pf-depth-copy]");
    if (node) node.textContent = DEPTH_COPY.body;
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
      deathReason: partial.deathReason || "short_points",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestPennyPitch = Math.max(state.bestPennyPitch || 0, payload.depth);
      state.bestPennyPitchScore = Math.max(state.bestPennyPitchScore || 0, payload.score);
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

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("pennypitch")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") {
      return rk().challengeText("Penny Pitch stage", depth, GAME_ID);
    }
    return `Beat my Penny Pitch stage ${depth} on Penny Fever`;
  }

  function tellDepth(n) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportDepth !== "function") return;
    const spec = liveSpec();
    try {
      rk().reportDepth(run.kitRun, n | 0, { name: spec.title, coda: !!spec.coda });
    } catch (_) { /* hud */ }
    ensureHud();
  }

  function lastDepth() {
    const state = PF.getState() || {};
    const keyed = state.lastRun && state.lastRun[GAME_ID];
    if (keyed && keyed.depth != null) return keyed.depth | 0;
    const last = state.lastRun;
    if (last && (last.game === GAME_ID || last.gameId === GAME_ID)) return last.depth | 0;
    return Math.max(state.bestPennyPitch || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }

  function setImmersed(on) {
    const node = cabinetNode();
    if (node) node.classList.toggle("pitch-immersed", !!on);
  }

  function tallyPts() {
    if (!world) return 0;
    let pts = 0;
    const stacks = {};
    world.pennies.forEach((p) => {
      if (p.state === "nested" && p.dish) {
        pts += p.dish.val | 0;
        const id = p.dish.id;
        stacks[id] = (stacks[id] || 0) + 1;
      }
    });
    Object.keys(stacks).forEach((id) => {
      if (stacks[id] >= 2) pts += 15;
    });
    return pts;
  }

  function updateLiveRead() {
    const spec = liveSpec();
    const need = el("pennyPitchLiveNeed");
    const pts = el("pennyPitchLivePts");
    const penn = el("pennyPitchLivePennies");
    const pair = el("pennyPitchLivePair");
    const score = run ? tallyPts() : 0;
    if (run) run.stagePts = score;
    if (need) need.textContent = spec ? `Need ${spec.needPts}` : "Need —";
    if (pts) pts.textContent = `Pts ${score}`;
    if (penn) penn.textContent = run ? `${run.penniesLeft | 0} pennies` : "6 pennies";
    if (pair) {
      const stacked = world && world.pennies.some((p) => p.state === "nested" && p.dish && p.dish.captured && p.dish.captured.length >= 2);
      pair.hidden = !stacked;
      if (stacked) pair.textContent = "STACK +15";
    }
    const banner = el("pennyPitchBanner");
    if (banner && spec) {
      banner.hidden = false;
      banner.textContent = `${spec.title} — ${spec.cheat || ""}`;
    }
  }

  function setHint(text) {
    setText("pennyPitchHint", text);
  }

  function toast(text, kind, ms) {
    const node = el("pennyPitchToast");
    if (!node) return;
    node.hidden = !text;
    node.textContent = text || "";
    node.className = "pitch-toast" + (kind ? " is-" + kind : "");
    toastTimer = text ? (ms || 1100) / 1000 : 0;
  }

  function flashYank(on) {
    const node = el("pennyPitchYank");
    if (!node) return;
    node.hidden = !on;
  }

  function paintLandChip(dish) {
    const chip = el("pennyPitchLiveLand");
    if (!chip) return;
    if (!dish) {
      chip.hidden = true;
      return;
    }
    const hue = dishHue(dish.color);
    chip.hidden = false;
    chip.className = "is-" + (dish.dead ? "dead" : hue.kind);
    chip.textContent = dish.dead ? "DEAD GOLD · 0" : `${hue.name} +${dish.val}`;
  }

  function powerUi(on, p) {
    const bar = el("pennyPitchPower");
    const fill = el("pennyPitchPowerFill");
    const lab = el("pennyPitchPowerLabel");
    if (bar) bar.hidden = !on;
    if (lab) lab.hidden = !on;
    if (fill) fill.style.height = `${Math.round(clamp(p || 0, 0, 1) * 100)}%`;
  }

  function makeMat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color,
      roughness: 0.72,
      metalness: 0.08,
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
    t.needsUpdate = true;
    return t;
  }

  function woodTex() {
    return canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#4a2e1c";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 18; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${0.04 + (i % 3) * 0.03})`;
        ctx.fillRect(i * 14 + 4, 0, 3, 256);
      }
      ctx.strokeStyle = "rgba(20,8,4,0.28)";
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
        ctx.fillStyle = i % 2 ? "#7a2040" : "#f0d09a";
        ctx.fillRect(i * 16, 0, 16, 128);
      }
    });
  }

  function starSky() {
    return canvasTex(512, 512, (ctx) => {
      ctx.fillStyle = "#070910";
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 180; i += 1) {
        ctx.fillStyle = `rgba(255,245,220,${0.28 + Math.random() * 0.7})`;
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 1.3 + 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function pennyFaceTex() {
    return canvasTex(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(46, 40, 8, 64, 64, 64);
      g.addColorStop(0, "#f3d39a");
      g.addColorStop(0.45, "#c47a2a");
      g.addColorStop(1, "#6a3a12");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(64, 64, 62, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(90,40,10,0.65)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = "#f0d09a";
      ctx.font = "bold 36px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("¢", 64, 58);
      ctx.font = "bold 14px Georgia, serif";
      ctx.fillText("PF", 64, 88);
    });
  }

  function quiltTex() {
    return canvasTex(512, 640, (ctx) => {
      ctx.fillStyle = "#4a1a28";
      ctx.fillRect(0, 0, 512, 640);
      for (let i = 0; i < 40; i += 1) {
        ctx.fillStyle = `rgba(20,6,10,${0.04 + (i % 5) * 0.02})`;
        ctx.fillRect(0, i * 16, 512, 8);
      }
      ctx.strokeStyle = "rgba(212,164,90,0.18)";
      ctx.lineWidth = 2;
      for (let y = 80; y < 600; y += 48) {
        ctx.beginPath();
        ctx.moveTo(28, y);
        ctx.lineTo(484, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(212,164,90,0.55)";
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, 492, 620);
      ctx.fillStyle = "rgba(240,208,154,0.72)";
      ctx.font = "700 28px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("DISH GARDEN", 256, 52);
    });
  }

  function meshBox(mat, w, h, d, x, y, z) {
    const m = new THREE.Mesh(world.geo.box, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    return m;
  }

  function meshSphere(mat, r, x, y, z) {
    const m = new THREE.Mesh(world.geo.sphere, mat);
    m.scale.setScalar(r);
    m.position.set(x, y, z);
    return m;
  }

  function meshCyl(mat, rTop, rBot, h, x, y, z) {
    const m = new THREE.Mesh(world.geo.cyl, mat);
    m.scale.set(rTop, h, rBot);
    m.position.set(x, y, z);
    return m;
  }

  function makePerson(opts) {
    const g = new THREE.Group();
    const chibi = !!opts.chibi;
    const skin = makeMat(opts.skin || SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const cloth = makeMat(opts.cloth || 0x3a3040);
    const dark = makeMat(opts.shoes || 0x111111, { roughness: 0.28, metalness: 0.35 });
    g.scale.setScalar(opts.scale || 1);
    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(meshCyl(cloth, chibi ? 0.12 : 0.13, chibi ? 0.15 : 0.16, 0.28, 0, 0.28, 0));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(chibi ? 0.26 : 0.22, 0.12, chibi ? 0.36 : 0.32, 12), cloth);
    skirt.position.y = 0.06;
    hip.add(skirt);
    const head = new THREE.Group();
    head.position.y = chibi ? 0.64 : 0.58;
    hip.add(head);
    head.add(meshSphere(skin, chibi ? 0.22 : 0.175, 0, 0.02, 0));
    const eyeW = makeMat(0xf7f2ea);
    const eyeD = makeMat(0x2a1810);
    const highlight = makeMat(0xffffff);
    [-1, 1].forEach((side) => {
      const white = meshSphere(eyeW, 0.038, side * (chibi ? 0.07 : 0.055), 0.03, chibi ? 0.19 : 0.15);
      white.scale.set(chibi ? 0.05 : 0.038, chibi ? 0.058 : 0.044, 0.02);
      head.add(white);
      head.add(meshSphere(eyeD, chibi ? 0.026 : 0.02, side * (chibi ? 0.07 : 0.055), 0.03, chibi ? 0.21 : 0.168));
      head.add(meshSphere(highlight, 0.01, side * (chibi ? 0.06 : 0.048), 0.045, chibi ? 0.22 : 0.18));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), makeMat(0xc45a6a));
    smile.position.set(0, -0.05, chibi ? 0.2 : 0.16);
    smile.rotation.x = 2.6;
    head.add(smile);
    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0.0, 0);
      const len = arm ? 0.28 : 0.34;
      const rad = arm ? 0.035 : 0.042;
      pivot.add(meshCyl(arm ? skin : cloth, rad, rad, len, 0, -len / 2, 0));
      if (!arm) pivot.add(meshBox(dark, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03));
      else pivot.add(meshSphere(skin, 0.04, 0, -len, 0));
      hip.add(pivot);
      return pivot;
    }
    const armL = limb(-1, true);
    const armR = limb(1, true);
    const legL = limb(-1, false);
    const legR = limb(1, false);
    g.userData = { kind: opts.kind || "guest", t: Math.random() * 10, armL, armR, legL, legR, head, hip, mood: "idle" };
    return g;
  }

  function dressAura(g) {
    const hip = g.userData.hip;
    const head = g.userData.head;
    const blouse = makeMat(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.2 });
    const dress = makeMat(DRESS, { emissive: DRESS, emissiveIntensity: 0.42 });
    hip.children[0].material = blouse;
    hip.children[1].material = dress;
    const apron = meshBox(makeMat(0x2f9a4a, { emissive: 0x1e6b3c, emissiveIntensity: 0.62, roughness: 0.55 }), 0.22, 0.26, 0.045, 0, 0.2, 0.13);
    hip.add(apron);
    const heart = meshBox(makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.55, roughness: 0.4 }), 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    heart.rotation.z = Math.PI / 4;
    hip.add(heart);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 16), blouse);
    collar.position.y = 0.44;
    collar.rotation.x = Math.PI / 2;
    hip.add(collar);
    const hairM = makeMat(HAIR, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });
    head.add(meshSphere(hairM, 0.23, 0, 0.06, -0.02));
    [-1, 1].forEach((side) => {
      head.add(meshSphere(hairM, 0.11, side * 0.2, -0.04, 0.04));
      head.add(meshSphere(makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.6 }), 0.045, side * 0.2, 0.06, 0.06));
    });
    head.add(meshBox(hairM, 0.28, 0.07, 0.1, 0, 0.14, 0.16));
    const crown = new THREE.Group();
    crown.position.y = 0.24;
    head.add(crown);
    const gold = makeMat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold));
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, h, 6), gold);
      spike.position.set(x, h * 0.45, 0);
      crown.add(spike);
    });
    const gem = meshBox(makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.7 }), 0.055, 0.055, 0.025, 0, 0.02, 0.11);
    gem.rotation.z = Math.PI / 4;
    crown.add(gem);
    g.userData.kind = "aura";
  }

  function animatePerson(p, dt) {
    const u = p.userData;
    const mood = u.mood || "idle";
    const moving = mood === "celebrate";
    u.t += dt * (moving ? 10 : mood === "yank" ? 6 : 2.4);
    u.hip.position.y = 0.42 + Math.sin(u.t) * (moving ? 0.05 : 0.012);
    const swing = moving ? Math.sin(u.t) * 0.55 : Math.sin(u.t * 0.5) * 0.08;
    u.legL.rotation.x = -swing * 0.5;
    u.legR.rotation.x = swing * 0.5;
    if (mood === "yank") {
      u.armR.rotation.x = 0.55;
      u.armR.rotation.z = 0.85 + Math.sin(u.t * 8) * 0.12;
      u.armL.rotation.x = 0.2;
    } else if (mood === "celebrate") {
      u.armL.rotation.x = -1.4 + Math.sin(u.t * 2) * 0.2;
      u.armR.rotation.x = -1.5 + Math.sin(u.t * 2 + 1) * 0.2;
    } else if (mood === "watch") {
      u.armL.rotation.x = 0.25;
      u.armR.rotation.x = 0.15;
      u.head.rotation.x = 0.12;
    } else if (mood === "smirk") {
      u.armR.rotation.z = -0.35;
      u.head.rotation.y = 0.18;
    } else {
      u.armL.rotation.x = swing;
      u.armR.rotation.x = -swing;
      u.armR.rotation.z = -0.85 + Math.sin(u.t * 2.2) * 0.35;
      u.head.rotation.x = 0;
      u.head.rotation.y = Math.sin(u.t * 0.35) * 0.12;
    }
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

  function wrapBubble(ctx, text, x, y, maxW) {
    const words = String(text).split(" ");
    const lines = [];
    let line = "";
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = test;
    });
    if (line) lines.push(line);
    const start = y - (lines.length - 1) * 16;
    lines.slice(0, 3).forEach((ln, i) => ctx.fillText(ln, x, start + i * 32));
  }

  function setBubble(text) {
    if (!world || !world.bubbleCtx) return;
    const ctx = world.bubbleCtx;
    ctx.clearRect(0, 0, 512, 160);
    if (!text) {
      world.bubble.visible = false;
      return;
    }
    ctx.fillStyle = "rgba(240,208,154,0.94)";
    roundRect(ctx, 12, 12, 488, 112, 24);
    ctx.fill();
    ctx.strokeStyle = "#8a6230";
    ctx.lineWidth = 6;
    roundRect(ctx, 12, 12, 488, 112, 24);
    ctx.stroke();
    ctx.fillStyle = "#160b10";
    ctx.font = "600 28px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    wrapBubble(ctx, text, 256, 68, 440);
    world.bubbleTex.needsUpdate = true;
    world.bubble.visible = true;
    world.bubbleT = 3.2;
  }

  function makeSign(text) {
    const tex = canvasTex(512, 128, (ctx) => {
      ctx.fillStyle = "#1a0c10";
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, 496, 112);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "700 48px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 256, 64);
    });
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: BRASS,
      emissiveIntensity: 0.22,
      roughness: 0.5,
    });
    const m = new THREE.Mesh(world.geo.box, mat);
    m.scale.set(1.7, 0.36, 0.05);
    return m;
  }

  function dishLabelTex(spec) {
    const label = spec.dead ? String(spec.painted || 50) : String(spec.val);
    const hue = dishHue(spec.color);
    const ring = spec.dead ? "#f0d09a" : ({
      gold: "#e8b84a", ruby: "#c41e3a", teal: "#3db8b0",
      green: "#4caf50", amber: "#d4893a", cream: "#f0d09a",
    }[hue.kind] || "#f0d09a");
    return canvasTex(160, 160, (ctx) => {
      ctx.clearRect(0, 0, 160, 160);
      ctx.fillStyle = ring;
      ctx.beginPath();
      ctx.arc(80, 80, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = spec.dead ? "rgba(240,208,154,0.96)" : "rgba(12,6,8,0.88)";
      ctx.beginPath();
      ctx.arc(80, 80, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = spec.dead ? "#6a3a12" : "#fff6ec";
      ctx.font = "bold 64px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 80, 84);
    });
  }

  function makeDish(spec, id) {
    const g = new THREE.Group();
    const col = spec.color;
    const glass = new THREE.MeshStandardMaterial({
      color: col,
      transparent: true,
      opacity: spec.ringOnly ? 0.5 : 0.42,
      roughness: 0.12,
      metalness: 0.38,
      emissive: col,
      emissiveIntensity: 0.22,
    });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(spec.r, 0.02, 6, CHEAP ? 12 : 16), glass);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.024;
    g.add(rim);
    if (!spec.ringOnly) {
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(spec.r * 0.9, spec.r * 0.82, 0.028, CHEAP ? 10 : 14),
        new THREE.MeshStandardMaterial({
          color: col,
          transparent: true,
          opacity: spec.dead ? 0.7 : 0.5,
          roughness: spec.dead ? 0.7 : 0.18,
          metalness: spec.dead ? 0.05 : 0.28,
          emissive: col,
          emissiveIntensity: spec.dead ? 0.08 : 0.2,
        })
      );
      bowl.position.y = 0.01;
      g.add(bowl);
    }
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(spec.r * 1.45, spec.r * 1.45),
      new THREE.MeshBasicMaterial({ map: dishLabelTex(spec), transparent: true, depthWrite: false })
    );
    label.rotation.x = -1.12;
    label.position.set(0, 0.055, spec.r * 0.12);
    g.add(label);
    g.position.set(spec.x, 0.02, spec.z);
    const dish = {
      id,
      group: g,
      r: spec.r,
      innerR: spec.innerR || 0,
      ringOnly: !!spec.ringOnly,
      val: spec.val | 0,
      dead: !!spec.dead,
      painted: spec.painted || spec.val,
      color: col,
      wx: spec.x,
      wz: spec.z,
      phase: rand(0, Math.PI * 2),
      captured: [],
      glow: glass,
      pulse: 0,
    };
    return dish;
  }

  function rebuildDishes(spec) {
    if (!world || !world.dishRoot) return;
    while (world.dishRoot.children.length) world.dishRoot.remove(world.dishRoot.children[0]);
    world.dishes = [];
    const list = (spec && spec.dishes) || GARDEN.honest;
    list.forEach((d, i) => {
      const dish = makeDish(d, i);
      world.dishRoot.add(dish.group);
      world.dishes.push(dish);
    });
    world.dishes.sort((a, b) => a.r - b.r);
  }

  function syncDishWorld() {
    if (!world) return;
    world.dishes.forEach((d) => {
      d.group.getWorldPosition(tmp.v);
      d.wx = tmp.v.x;
      d.wz = tmp.v.z;
    });
  }

  function makePennyMesh() {
    const geo = new THREE.CylinderGeometry(PENNY_R, PENNY_R, 0.01, CHEAP ? 10 : 14);
    const face = new THREE.MeshStandardMaterial({
      map: world.pennyTex,
      roughness: 0.38,
      metalness: 0.72,
      emissive: 0x6a3810,
      emissiveIntensity: 0.32,
    });
    const m = new THREE.Mesh(geo, face);
    m.castShadow = !CHEAP;
    m.receiveShadow = !CHEAP;
    m.visible = false;
    return m;
  }

  function allocPenny() {
    let mesh = world.pennyPool.pop();
    if (!mesh) mesh = makePennyMesh();
    mesh.visible = true;
    mesh.scale.setScalar(1);
    if (!mesh.parent) world.scene.add(mesh);
    const body = {
      mesh,
      x: 0,
      y: TABLE_Y + PENNY_R,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      spin: rand(8, 16),
      state: "air",
      dish: null,
      house: false,
      idle: false,
      nestOff: { x: 0, z: 0 },
    };
    world.pennies.push(body);
    return body;
  }

  function freePenny(p) {
    if (!p) return;
    if (p.dish && p.dish.captured) {
      p.dish.captured = p.dish.captured.filter((x) => x !== p);
    }
    p.mesh.visible = false;
    if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
    world.pennyPool.push(p.mesh);
    world.pennies = world.pennies.filter((x) => x !== p);
  }

  function clearPennies(keepHouse) {
    if (!world) return;
    world.pennies.slice().forEach((p) => {
      if (keepHouse && p.house) return;
      freePenny(p);
    });
  }

  function spawnSparks(pos, color, n) {
    const col = new THREE.Color(color || CREAM);
    for (let i = 0; i < n; i += 1) {
      const s = world.sparks[world.sparkI % world.sparks.length];
      world.sparkI += 1;
      s.mesh.visible = true;
      s.mesh.position.copy(pos);
      s.mesh.material.color.copy(col);
      s.v.set(rand(-0.7, 0.7), rand(0.6, 1.6), rand(-0.7, 0.7));
      s.life = rand(0.28, 0.55);
      s.max = s.life;
    }
  }

  function spawnConfetti() {
    world.confetti.forEach((c) => {
      c.mesh.visible = true;
      c.mesh.position.set(rand(-0.7, 0.7), TABLE_Y + 0.4, rand(-0.9, 0.2));
      c.v.set(rand(-0.4, 0.4), rand(0.4, 1.2), rand(-0.3, 0.3));
      c.spin.set(rand(-8, 8), rand(-8, 8), rand(-8, 8));
      c.life = rand(0.9, 1.5);
    });
  }

  function canGL() {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch (_) {
      return false;
    }
  }

  function buildTent() {
    const root = new THREE.Group();
    const woodMap = woodTex();
    woodMap.wrapS = woodMap.wrapT = THREE.RepeatWrapping;
    woodMap.repeat.set(3, 3);
    const wood = makeMat(WOOD, { map: woodMap });
    const dark = makeMat(WOOD_DARK);
    const velvet = makeMat(VELVET);
    const stripeMap = stripeTex();
    stripeMap.wrapS = stripeMap.wrapT = THREE.RepeatWrapping;
    stripeMap.repeat.set(4, 1);
    const stripe = new THREE.MeshStandardMaterial({ map: stripeMap, roughness: 0.68 });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 14), makeMat(0x24140e, { map: woodMap, roughness: 0.86 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    root.add(floor);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(1.9, 28), velvet);
    rug.rotation.x = -Math.PI / 2;
    rug.position.y = 0.01;
    rug.receiveShadow = true;
    root.add(rug);

    root.add(meshBox(stripe, 0.08, 2.7, 6.4, -2.7, 1.35, -0.2));
    root.add(meshBox(stripe, 0.08, 2.7, 6.4, 2.7, 1.35, -0.2));
    root.add(meshBox(stripe, 5.5, 2.7, 0.08, 0, 1.35, -2.85));
    const roofL = meshBox(stripe, 3.3, 0.08, 6.6, -1.2, 2.95, -0.15);
    roofL.rotation.z = 0.42;
    const roofR = meshBox(stripe, 3.3, 0.08, 6.6, 1.2, 2.95, -0.15);
    roofR.rotation.z = -0.42;
    root.add(roofL, roofR);
    root.add(meshCyl(wood, 0.06, 0.06, 2.8, -2.55, 1.4, 2.15));
    root.add(meshCyl(wood, 0.06, 0.06, 2.8, 2.55, 1.4, 2.15));

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(18, CHEAP ? 10 : 14, CHEAP ? 8 : 10),
      new THREE.MeshBasicMaterial({ map: starSky(), side: THREE.BackSide })
    );
    root.add(sky);

    const bulbN = CHEAP ? 8 : 12;
    for (let i = 0; i < bulbN; i += 1) {
      const on = i % 2 ? CREAM : RUBY;
      const bulb = meshSphere(new THREE.MeshBasicMaterial({ color: on }), 0.045, -2.25 + i * (4.5 / bulbN), 2.48, 2.05);
      bulb.userData.bulb = true;
      root.add(bulb);
    }

    const table = new THREE.Group();
    const top = meshBox(wood, 1.92, 0.08, 3.12, 0, TABLE_Y - 0.04, -0.12);
    top.castShadow = true;
    top.receiveShadow = true;
    table.add(top);
    table.add(meshBox(dark, 1.96, 0.1, 3.16, 0, TABLE_Y - 0.12, -0.12));
    [[-0.82, -1.4], [0.82, -1.4], [-0.82, 1.12], [0.82, 1.12]].forEach(([x, z]) => {
      const leg = meshCyl(wood, 0.07, 0.08, TABLE_Y - 0.08, x, (TABLE_Y - 0.08) / 2, z);
      leg.castShadow = true;
      table.add(leg);
    });
    const lipM = makeMat(BRASS, { metalness: 0.7, roughness: 0.3, emissive: 0x4a3010, emissiveIntensity: 0.22 });
    table.add(meshBox(lipM, 1.92, 0.07, 0.07, 0, TABLE_Y + 0.03, TABLE_Z1));
    table.add(meshBox(lipM, 1.92, 0.09, 0.08, 0, TABLE_Y + 0.04, TABLE_Z0));
    table.add(meshBox(lipM, 0.07, 0.07, 3.0, -TABLE_X, TABLE_Y + 0.03, -0.12));
    table.add(meshBox(lipM, 0.07, 0.07, 3.0, TABLE_X, TABLE_Y + 0.03, -0.12));
    const pitchLine = meshBox(makeMat(CREAM, { emissive: CREAM, emissiveIntensity: 0.35 }), 1.7, 0.01, 0.02, 0, TABLE_Y + 0.01, 1.05);
    table.add(pitchLine);
    root.add(table);
    world.table = table;

    const clothGroup = new THREE.Group();
    clothGroup.position.set(0, TABLE_Y + 0.01, -0.18);
    table.add(clothGroup);
    world.clothGroup = clothGroup;

    const qTex = quiltTex();
    const clothGeo = new THREE.PlaneGeometry(1.78, 2.22, CHEAP ? 8 : 12, CHEAP ? 10 : 14);
    world.clothBase = Float32Array.from(clothGeo.attributes.position.array);
    const clothMesh = new THREE.Mesh(clothGeo, new THREE.MeshStandardMaterial({
      map: qTex,
      roughness: 0.78,
      metalness: 0.04,
      emissive: 0x2a1408,
      emissiveIntensity: 0.12,
    }));
    clothMesh.rotation.x = -Math.PI / 2;
    clothMesh.receiveShadow = true;
    clothGroup.add(clothMesh);
    world.clothGeo = clothGeo;
    world.clothMesh = clothMesh;

    const dishRoot = new THREE.Group();
    dishRoot.position.y = 0.01;
    clothGroup.add(dishRoot);
    world.dishRoot = dishRoot;
    world.dishes = [];

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.09, 0.012, 8, 24),
      makeMat(CREAM, { emissive: CREAM, emissiveIntensity: 0.8, roughness: 0.35 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.visible = false;
    clothGroup.add(ring);
    world.aimRing = ring;

    world.arcDots = [];
    for (let i = 0; i < (CHEAP ? 6 : 8); i += 1) {
      const d = meshSphere(makeMat(CREAM, { emissive: CREAM, emissiveIntensity: 0.9 }), 0.016, 0, 0, 0);
      d.visible = false;
      root.add(d);
      world.arcDots.push(d);
    }

    const aura = makePerson({ chibi: true, scale: 1.18, cloth: DRESS });
    dressAura(aura);
    aura.position.set(0.08, 0, -2.05);
    aura.rotation.y = 0.06;
    root.add(aura);
    world.aura = aura;

    const bubbleCanvas = document.createElement("canvas");
    bubbleCanvas.width = 512;
    bubbleCanvas.height = 160;
    world.bubbleCtx = bubbleCanvas.getContext("2d");
    world.bubbleTex = new THREE.CanvasTexture(bubbleCanvas);
    world.bubbleTex.colorSpace = THREE.SRGBColorSpace;
    const bubble = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 0.42),
      new THREE.MeshBasicMaterial({ map: world.bubbleTex, transparent: true })
    );
    bubble.position.set(0.2, 1.78, -1.72);
    bubble.visible = false;
    root.add(bubble);
    world.bubble = bubble;
    world.bubbleT = 0;

    const sign = makeSign("PENNY PITCH");
    sign.position.set(0, 2.58, -2.72);
    root.add(sign);

    const chalk = canvasTex(512, 340, (ctx) => {
      ctx.fillStyle = "#1b3a28";
      ctx.fillRect(0, 0, 512, 340);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 492, 320);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "700 26px Georgia, serif";
      ctx.fillText("HOUSE RULES", 36, 52);
      ctx.font = "22px Georgia, serif";
      ctx.fillStyle = "#e8f0d8";
      [
        "1. Drag back. Aim. Release.",
        "2. Nest inside a glass dish.",
        "3. Hit NEED before pennies run out.",
        "4. Quilt yanks AFTER you let go.",
        "5. Gold in the middle can lie.",
        "6. Family night. No casino.",
      ].forEach((ln, i) => ctx.fillText(ln, 36, 96 + i * 36));
    });
    const board = new THREE.Mesh(world.geo.box, new THREE.MeshStandardMaterial({ map: chalk, roughness: 0.7 }));
    board.scale.set(1.15, 0.78, 0.04);
    board.position.set(-2.62, 1.55, -0.15);
    board.rotation.y = Math.PI / 2;
    root.add(board);

    world.jars = [];
    for (let i = 0; i < 3; i += 1) {
      const jar = new THREE.Group();
      jar.add(new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.13, 0.28, 10),
        new THREE.MeshStandardMaterial({ color: 0x88aacc, transparent: true, opacity: 0.28, roughness: 0.15, metalness: 0.2 })
      ));
      jar.add(meshCyl(makeMat(BRASS, { metalness: 0.6 }), 0.13, 0.13, 0.04, 0, 0.16, 0));
      jar.position.set(2.42, 1.52, -0.55 - i * 0.38);
      root.add(jar);
      world.jars.push(jar);
    }
    [
      { c: 0xc45a6a, x: 2.42, z: -1.72 },
      { c: 0x3d8a8a, x: 2.42, z: 0.12 },
      { c: GOLD, x: -2.42, z: -1.5 },
    ].forEach((p) => {
      const bear = new THREE.Group();
      bear.add(meshSphere(makeMat(p.c), 0.11, 0, 0.16, 0));
      bear.add(meshSphere(makeMat(p.c), 0.08, 0, 0.3, 0.02));
      bear.add(meshSphere(makeMat(p.c), 0.035, -0.07, 0.36, 0));
      bear.add(meshSphere(makeMat(p.c), 0.035, 0.07, 0.36, 0));
      bear.position.set(p.x, 1.42, p.z);
      root.add(bear);
    });

    const lanterns = [];
    [-1.7, 1.7].forEach((x, i) => {
      const lamp = new THREE.Group();
      lamp.add(meshCyl(makeMat(0x2a1810), 0.02, 0.02, 0.55, 0, 2.35, 0));
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 0.22, 8),
        makeMat(GOLD, { emissive: GOLD, emissiveIntensity: 0.7, roughness: 0.4 })
      );
      shade.position.y = 2.05;
      lamp.add(shade);
      lamp.position.set(x, 0, i ? -1.2 : 0.45);
      root.add(lamp);
      const light = new THREE.PointLight(i ? 0xffc878 : 0xffd9a0, CHEAP ? 0.85 : 1.05, 8, 1.6);
      light.position.set(x, 2.05, i ? -1.2 : 0.45);
      light.castShadow = false;
      root.add(light);
      lanterns.push({ lamp, light, base: 1.15, phase: i * 1.7 });
    });
    world.lanterns = lanterns;

    root.add(new THREE.HemisphereLight(0xffe6c8, 0x1a0c14, 0.55));
    root.add(new THREE.AmbientLight(0x3a2430, 0.35));
    const key = new THREE.DirectionalLight(0xffe0b0, 0.58);
    key.position.set(2.4, 5.2, 3.4);
    key.castShadow = !CHEAP;
    key.shadow.mapSize.set(512, 512);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 16;
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    root.add(key);

    world.stamp = makeStamp();
    world.stamp.visible = false;
    table.add(world.stamp);

    world.railPennies = [];
    for (let i = 0; i < 6; i += 1) {
      const p = makePennyMesh();
      p.visible = true;
      p.position.set(-0.55 + i * 0.16, TABLE_Y + 0.03, 1.18);
      table.add(p);
      world.railPennies.push(p);
    }

    const hand = new THREE.Group();
    const skin = makeMat(SKIN);
    hand.add(meshBox(skin, 0.12, 0.04, 0.18, 0, 0, 0));
    for (let i = 0; i < 4; i += 1) {
      hand.add(meshBox(skin, 0.022, 0.022, 0.1, -0.04 + i * 0.028, 0.01, -0.12));
    }
    world.handPenny = makePennyMesh();
    world.handPenny.visible = true;
    world.handPenny.position.set(0, 0.04, -0.02);
    hand.add(world.handPenny);
    hand.position.set(0.22, -0.32, -0.58);
    hand.rotation.x = -0.55;
    hand.rotation.y = -0.18;
    hand.visible = false;
    world.hand = hand;

    world.sparks = [];
    world.sparkI = 0;
    for (let i = 0; i < (CHEAP ? 14 : 22); i += 1) {
      const mesh = meshSphere(new THREE.MeshBasicMaterial({ color: CREAM }), 0.018, 0, 0, 0);
      mesh.visible = false;
      root.add(mesh);
      world.sparks.push({ mesh, v: new THREE.Vector3(), life: 0, max: 1 });
    }
    world.confetti = [];
    const confCols = [GREEN, TEAL, AMBER, RUBY, GOLD];
    for (let i = 0; i < (CHEAP ? 10 : 16); i += 1) {
      const mesh = meshBox(new THREE.MeshBasicMaterial({ color: confCols[i % confCols.length] }), 0.04, 0.01, 0.06, 0, 0, 0);
      mesh.visible = false;
      root.add(mesh);
      world.confetti.push({ mesh, v: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0 });
    }

    const jerkBanner = canvasTex(320, 72, (ctx) => {
      ctx.fillStyle = "#c41e3a";
      ctx.fillRect(0, 0, 320, 72);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "bold 34px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("THE QUILT YANKS", 160, 38);
    });
    const jb = new THREE.Mesh(
      new THREE.PlaneGeometry(1.25, 0.3),
      new THREE.MeshBasicMaterial({ map: jerkBanner, transparent: true })
    );
    jb.position.set(0, TABLE_Y + 0.78, 0.2);
    jb.visible = false;
    root.add(jb);
    world.jerkBanner = jb;
    world.jerkBannerT = 0;

    const cord = meshCyl(makeMat(BRASS, { metalness: 0.7, roughness: 0.32, emissive: 0x6a3010, emissiveIntensity: 0.45 }), 0.012, 0.012, 0.85, 0.62, TABLE_Y + 0.28, -0.7);
    cord.rotation.z = 0.85;
    cord.visible = false;
    table.add(cord);
    world.jerkCord = cord;

    world.scene.add(root);
    world.tent = root;
    rebuildDishes(AUTHORED[0]);
  }

  function makeStamp() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 220;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "rgba(196,30,58,0.95)";
    ctx.lineWidth = 14;
    ctx.strokeRect(24, 28, 464, 164);
    ctx.fillStyle = "rgba(196,30,58,0.16)";
    ctx.fillRect(24, 28, 464, 164);
    ctx.fillStyle = "rgba(196,30,58,0.96)";
    ctx.font = "bold 92px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CLOTH", 256, 110);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.6),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    m.position.set(0, TABLE_Y + 0.7, 0.15);
    m.rotation.x = -0.35;
    return m;
  }

  function resizeRenderer() {
    if (!world || !world.renderer || !world.canvas) return;
    const stage = stageEl() || world.canvas.parentElement;
    const w = Math.max(280, (stage && stage.clientWidth) || world.canvas.clientWidth || 640);
    const h = Math.max(320, (stage && stage.clientHeight) || 520);
    const dpr = Math.min(CHEAP ? 1 : 1.5, window.devicePixelRatio || 1);
    world.renderer.setPixelRatio(dpr);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function bootWorld() {
    if (world && world.ready) {
      resizeRenderer();
      return Promise.resolve(world);
    }
    if (!canGL()) {
      setText("pennyPitchStatus", "This tent needs WebGL.");
      return Promise.resolve(null);
    }
    try {
      const canvas = el("pennyPitchCanvas");
      if (!canvas) {
        setText("pennyPitchStatus", "Lanterns wouldn't light.");
        return Promise.resolve(null);
      }
      tmp.v = new THREE.Vector3();
      tmp.v2 = new THREE.Vector3();
      tmp.v3 = new THREE.Vector3();
      tmp.ray = new THREE.Raycaster();
      tmp.ptr = new THREE.Vector2();

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x14080c, 8, 18);
      scene.background = new THREE.Color(0x14080c);
      const camera = new THREE.PerspectiveCamera(50, 1, 0.08, 40);
      camera.position.set(0, 2.2, 3.35);
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: (window.devicePixelRatio || 1) < 1.6,
        powerPreference: "high-performance",
        alpha: false,
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ReinhardToneMapping;
      renderer.toneMappingExposure = 1.85;
      renderer.shadowMap.enabled = !CHEAP;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.setClearColor(0x14080c, 1);
      world = {
        ready: false,
        THREE,
        scene,
        camera,
        renderer,
        canvas,
        clock: 0,
        last: 0,
        raf: 0,
        geo: {
          box: new THREE.BoxGeometry(1, 1, 1),
          sphere: new THREE.SphereGeometry(1, CHEAP ? 8 : 10, CHEAP ? 6 : 8),
          cyl: new THREE.CylinderGeometry(1, 1, 1, CHEAP ? 8 : 10),
        },
        pennyTex: pennyFaceTex(),
        pennyPool: [],
        pennies: [],
        dishes: [],
        clothFlash: 0,
        clothDirty: false,
        cam: { mode: "idle", k: 0 },
        shake: 0,
        resizeObs: null,
      };
      buildTent();
      if (world.hand) world.camera.add(world.hand);
      world.ready = true;
      resizeRenderer();
      if (typeof ResizeObserver === "function") {
        world.resizeObs = new ResizeObserver(() => resizeRenderer());
        const stage = stageEl();
        if (stage) world.resizeObs.observe(stage);
      }
      window.addEventListener("resize", resizeRenderer);
      setBubble("Flick a dish. The quilt has opinions.");
      return Promise.resolve(world);
    } catch (err) {
      console.warn("penny-pitch 3d", err);
      world = null;
      setText("pennyPitchStatus", "Tent poles wouldn't stand. Try again.");
      return Promise.resolve(null);
    }
  }

  function camPose(mode) {
    if (mode === "play") return { x: 0.06, y: 2.22, z: 2.72, lx: 0, ly: 1.08, lz: -0.45 };
    if (mode === "result") return { x: 0.55, y: 2.1, z: 3.2, lx: 0, ly: 1.15, lz: -0.5 };
    const t = world ? world.clock * (REDUCE ? 0.05 : 0.16) : 0;
    return {
      x: Math.sin(t) * 1.7,
      y: 2.05 + Math.sin(t * 0.7) * 0.12,
      z: 2.7 + Math.cos(t) * 0.45,
      lx: 0,
      ly: 1.12,
      lz: -0.4,
    };
  }

  function updateCamera(dt) {
    if (!world) return;
    const want = isLive() ? "play" : (run && run.done ? "result" : "idle");
    if (world.cam.mode !== want) {
      world.cam.mode = want;
      world.cam.k = 0;
    }
    world.cam.k = Math.min(1, world.cam.k + dt * 1.35);
    const pose = camPose(want);
    const k = REDUCE ? 1 : (want === "idle" ? 1 : Math.min(1, world.cam.k));
    const cam = world.camera;
    if (want === "idle") {
      cam.position.set(pose.x, pose.y, pose.z);
    } else {
      cam.position.x = lerp(cam.position.x, pose.x, k);
      cam.position.y = lerp(cam.position.y, pose.y, k);
      cam.position.z = lerp(cam.position.z, pose.z, k);
    }
    tmp.v.set(pose.lx, pose.ly, pose.lz);
    cam.lookAt(tmp.v);
    if (world.shake > 0.01) {
      cam.position.x += (Math.random() - 0.5) * world.shake * 0.04;
      cam.position.y += (Math.random() - 0.5) * world.shake * 0.02;
      world.shake *= 0.86;
    }
    if (world.hand) {
      const show = (isLive() && canFlick()) || (isLive() && run && run.charging);
      world.hand.visible = !!show;
      if (run && run.charging) {
        world.hand.position.z = -0.58 - run.power * 0.22;
        world.hand.position.x = 0.22 + run.aimX * 0.18;
      } else {
        world.hand.position.set(0.22, -0.32, -0.58);
      }
    }
  }

  function rippleCloth(dt) {
    if (!world || !world.clothGeo) return;
    const spec = liveSpec();
    const t = world.clock;
    const ripple = !!(spec && spec.ripple);
    const idleWave = !CHEAP && !run && Math.sin(t * 0.4) > 0.2;
    const jerkWave = !!(run && run.jerkWave > 0);
    const live = ripple || idleWave || jerkWave;
    if (!live) {
      if (world.clothDirty) {
        const pos = world.clothGeo.attributes.position;
        const base = world.clothBase;
        pos.array.set(base);
        pos.needsUpdate = true;
        world.clothDirty = false;
      }
      return;
    }
    const pos = world.clothGeo.attributes.position;
    const base = world.clothBase;
    for (let i = 0; i < pos.count; i += 1) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      let z = 0;
      if (ripple || idleWave) z += Math.sin(x * 5.5 + t * 2.6) * 0.016 + Math.cos(y * 4.8 + t * 2.1) * 0.012;
      if (jerkWave) {
        const d = Math.sqrt(x * x + y * y);
        z += Math.sin(d * 14 - (1 - run.jerkWave) * 18) * 0.07 * run.jerkWave;
      }
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    world.clothDirty = true;
    if (jerkWave && (world.clock * 2 | 0) !== ((world.clock - dt) * 2 | 0)) world.clothGeo.computeVertexNormals();
    if (ripple && world.dishes) {
      world.dishes.forEach((d) => {
        d.group.position.y = 0.02 + Math.sin(t * 2.2 + d.phase) * 0.022;
      });
    }
  }

  function flickVel(power, aimX, mirror) {
    const ax = mirror ? -aimX : aimX;
    return {
      vx: ax * 1.48,
      vy: 0.52 + power * 1.12,
      vz: -(2.72 + power * 2.55),
    };
  }

  function launchOrigin() {
    return new THREE.Vector3(0.02, TABLE_Y + 0.1, 1.16);
  }

  function estimateLand(power, aimX, mirror) {
    const v = flickVel(power, aimX, mirror);
    const from = launchOrigin();
    let x = from.x;
    let y = from.y;
    let z = from.z;
    let vx = v.vx;
    let vy = v.vy;
    let vz = v.vz;
    let air = true;
    const dt = 0.028;
    for (let i = 0; i < 72; i += 1) {
      if (air) {
        vy -= GRAVITY * dt;
        x += vx * dt;
        y += vy * dt;
        z += vz * dt;
        if (y <= TABLE_Y + PENNY_R) {
          y = TABLE_Y + PENNY_R;
          vy *= -0.3;
          vx *= LAND_DAMP;
          vz *= LAND_DAMP;
          if (Math.abs(vy) < 0.35) {
            air = false;
            vy = 0;
          }
        }
      } else {
        const sp = Math.hypot(vx, vz);
        if (sp < 0.05) break;
        const ns = Math.max(0, sp - FRICTION * dt);
        vx *= ns / sp;
        vz *= ns / sp;
        x += vx * dt;
        z += vz * dt;
        if (x > TABLE_X - PENNY_R) { x = TABLE_X - PENNY_R; vx *= -LIP_REST; }
        if (x < -TABLE_X + PENNY_R) { x = -TABLE_X + PENNY_R; vx *= -LIP_REST; }
        if (z < TABLE_Z0 + PENNY_R) { z = TABLE_Z0 + PENNY_R; vz *= -LIP_REST; }
        if (z > TABLE_Z1 - PENNY_R) { z = TABLE_Z1 - PENNY_R; vz *= -LIP_REST; }
      }
    }
    return { x, y: TABLE_Y + 0.04, z };
  }

  function showAim(power, aimX) {
    if (!world) return;
    const spec = liveSpec();
    const from = launchOrigin();
    const land = estimateLand(power, aimX, !!(spec && spec.mirrorAim));
    world.clothGroup.worldToLocal(tmp.v.set(land.x, land.y, land.z));
    world.aimRing.position.set(tmp.v.x, 0.05, tmp.v.z);
    world.aimRing.visible = true;
    const v = flickVel(power, aimX, !!(spec && spec.mirrorAim));
    world.arcDots.forEach((dot, i) => {
      const u = (i + 1) / (world.arcDots.length + 1);
      const t = u * 0.55;
      dot.position.set(
        from.x + v.vx * t,
        from.y + v.vy * t - 0.5 * GRAVITY * t * t,
        from.z + v.vz * t
      );
      dot.visible = dot.position.y > TABLE_Y;
    });
    powerUi(true, power);
  }

  function hideAim() {
    if (!world) return;
    world.arcDots.forEach((d) => { d.visible = false; });
    if (world.aimRing) world.aimRing.visible = false;
    powerUi(false, 0);
    flashYank(false);
  }

  function canFlick() {
    return isLive() && run && run.pause <= 0 && run.penniesLeft > 0 && !run.moving && !run.charging;
  }

  function anyMoving() {
    if (!world) return false;
    return world.pennies.some((p) => {
      if (p.state === "air") return true;
      if (p.state === "slide" && Math.hypot(p.vx, p.vz) > 0.14) return true;
      return false;
    });
  }

  function capturePenny(p, dish) {
    if (p.state === "nested" && p.dish === dish) return;
    if (p.dish && p.dish.captured) p.dish.captured = p.dish.captured.filter((x) => x !== p);
    p.state = "nested";
    p.dish = dish;
    p.vx = p.vy = p.vz = 0;
    const n = dish.captured.length;
    p.nestOff.x = rand(-0.02, 0.02);
    p.nestOff.z = rand(-0.02, 0.02);
    dish.captured.push(p);
    p.x = dish.wx + p.nestOff.x;
    p.z = dish.wz + p.nestOff.z;
    p.y = TABLE_Y + 0.016 + n * 0.012;
    const pos = tmp.v.set(p.x, p.y, p.z);
    spawnSparks(pos, dish.dead ? 0x888888 : dish.color, CHEAP ? 6 : (dish.val >= 50 ? 12 : 8));
    dish.pulse = 1;
    if (p.idle) return;
    paintLandChip(dish);
    if (dish.dead) {
      kit.sfx("pit");
      toast("DEAD GOLD · 0", "dead", 1400);
      setBubble("Looked like fifty. It wasn't.");
      if (world.aura) world.aura.userData.mood = "smirk";
    } else {
      const hue = dishHue(dish.color);
      const stacked = dish.captured.length >= 2;
      kit.sfx(dish.val >= 20 ? "cash" : "tray");
      toast(stacked ? `${hue.name} STACK +${dish.val}` : `${hue.name} +${dish.val}`, hue.kind, 1400);
      setBubble(dish.val >= 50 ? "Gold!" : `${hue.name} +${dish.val}`);
      if (world.aura) world.aura.userData.mood = dish.val >= 20 ? "celebrate" : "watch";
      if (dish.val >= 50) world.shake = 1.05;
    }
    updateLiveRead();
  }

  function knockOut(p, nx, nz, impulse) {
    if (!p.dish) return;
    const dish = p.dish;
    dish.captured = dish.captured.filter((x) => x !== p);
    p.dish = null;
    p.state = "slide";
    p.vx = nx * impulse;
    p.vz = nz * impulse;
    p.y = TABLE_Y + PENNY_R + 0.01;
    kit.sfx("shove");
    toast("KNOCK!", "", 700);
  }

  function tryCapture(p) {
    const speed = Math.hypot(p.vx, p.vz);
    if (speed > CAPTURE_SPEED) return false;
    const grab = speed < 0.35 ? 1.12 : 0.96;
    const ranked = world.dishes;
    for (let i = 0; i < ranked.length; i += 1) {
      const d = ranked[i];
      const dist = Math.hypot(p.x - d.wx, p.z - d.wz);
      if (d.ringOnly) {
        if (dist <= d.r * grab && dist >= (d.innerR || 0) * 0.92) {
          capturePenny(p, d);
          return true;
        }
      } else if (dist <= d.r * grab) {
        capturePenny(p, d);
        return true;
      }
    }
    return false;
  }

  function rimBounce(p) {
    const speed = Math.hypot(p.vx, p.vz);
    world.dishes.forEach((d) => {
      const dx = p.x - d.wx;
      const dz = p.z - d.wz;
      const dist = Math.hypot(dx, dz) || 0.0001;
      const nx = dx / dist;
      const nz = dz / dist;
      const vn = p.vx * nx + p.vz * nz;
      if (dist > d.r - 0.012 && dist < d.r + PENNY_R + 0.01 && vn < 0 && speed > 0.7) {
        p.vx -= 1.7 * vn * nx;
        p.vz -= 1.7 * vn * nz;
        p.x = d.wx + nx * (d.r + PENNY_R * 0.4);
        p.z = d.wz + nz * (d.r + PENNY_R * 0.4);
        if (!CHEAP) kit.sfx("bumper");
      }
    });
  }

  function suction(p, dt) {
    if (p.state !== "slide") return;
    const speed = Math.hypot(p.vx, p.vz);
    if (speed > 1.7) return;
    world.dishes.forEach((d) => {
      const dx = d.wx - p.x;
      const dz = d.wz - p.z;
      const dist = Math.hypot(dx, dz);
      const reach = d.ringOnly ? d.r : d.r * 1.18;
      if (dist < reach && dist > 0.001) {
        p.vx += (dx / dist) * SUCTION * dt;
        p.vz += (dz / dist) * SUCTION * dt;
      }
    });
  }

  function collidePennies() {
    const list = world.pennies;
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        if (a.state === "dead" || b.state === "dead") continue;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const dist = Math.hypot(dx, dz);
        if (dist >= PENNY_R * 2.05 || dist < 1e-4) continue;
        const nx = dx / dist;
        const nz = dz / dist;
        const overlap = PENNY_R * 2.02 - dist;
        const aLocked = a.state === "nested";
        const bLocked = b.state === "nested";
        if (!aLocked) { a.x -= nx * overlap * 0.5; a.z -= nz * overlap * 0.5; }
        if (!bLocked) { b.x += nx * overlap * 0.5; b.z += nz * overlap * 0.5; }
        const rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
        if (rv >= 0) continue;
        const imp = -rv * 0.85;
        if (aLocked && imp > 0.55) knockOut(a, -nx, -nz, imp * 0.9);
        else if (!aLocked) { a.vx -= imp * nx; a.vz -= imp * nz; }
        if (bLocked && imp > 0.55) knockOut(b, nx, nz, imp * 0.9);
        else if (!bLocked) { b.vx += imp * nx; b.vz += imp * nz; }
      }
    }
  }

  function stepPenny(p, dt) {
    if (p.state === "nested") {
      if (p.dish) {
        const n = Math.max(0, p.dish.captured.indexOf(p));
        p.x = p.dish.wx + p.nestOff.x;
        p.z = p.dish.wz + p.nestOff.z;
        p.y = TABLE_Y + 0.016 + n * 0.012;
      }
    } else if (p.state === "air") {
      p.vy -= GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y <= TABLE_Y + PENNY_R && p.x > -TABLE_X - 0.05 && p.x < TABLE_X + 0.05 && p.z > TABLE_Z0 - 0.05 && p.z < TABLE_Z1 + 0.05) {
        p.y = TABLE_Y + PENNY_R;
        p.vy *= -0.3;
        p.vx *= LAND_DAMP;
        p.vz *= LAND_DAMP;
        if (Math.abs(p.vy) < 0.35) {
          p.vy = 0;
          p.state = "slide";
          if (!p.idle) kit.sfx("drop");
        }
      } else if (p.y < 0.08) {
        p.state = "dead";
        p.y = 0.08;
        p.vx = p.vz = p.vy = 0;
        if (!p.idle) {
          kit.sfx("miss");
          toast("OFF THE TABLE", "dead", 800);
          setBubble("Off the cloth, sugar.");
          if (world.aura) world.aura.userData.mood = "smirk";
        }
      }
    } else if (p.state === "slide") {
      let sp = Math.hypot(p.vx, p.vz);
      if (sp < 1.2) tryCapture(p);
      if (p.state === "nested") {
        /* nested this frame */
      } else {
        if (sp > 0.9) rimBounce(p);
        suction(p, dt);
        sp = Math.hypot(p.vx, p.vz);
        if (sp > 0.03) {
          const ns = Math.max(0, sp - FRICTION * dt);
          p.vx *= ns / sp;
          p.vz *= ns / sp;
        } else {
          p.vx = p.vz = 0;
          tryCapture(p);
        }
        p.x += p.vx * dt;
        p.z += p.vz * dt;
        p.y = TABLE_Y + PENNY_R;
        if (p.x > TABLE_X - PENNY_R) { p.x = TABLE_X - PENNY_R; p.vx *= -LIP_REST; }
        if (p.x < -TABLE_X + PENNY_R) { p.x = -TABLE_X + PENNY_R; p.vx *= -LIP_REST; }
        if (p.z < TABLE_Z0 + PENNY_R) { p.z = TABLE_Z0 + PENNY_R; p.vz *= -0.62; }
        if (p.z > TABLE_Z1 - PENNY_R) { p.z = TABLE_Z1 - PENNY_R; p.vz *= -LIP_REST; }
        if (p.state !== "nested" && Math.hypot(p.vx, p.vz) < 0.22) tryCapture(p);
      }
    }
    p.mesh.position.set(p.x, p.y, p.z);
    if (p.state === "air" || p.state === "slide") {
      p.mesh.rotation.x += p.spin * dt;
      p.mesh.rotation.z += p.spin * 0.35 * dt;
    } else {
      p.mesh.rotation.set(0, p.mesh.rotation.y, 0);
    }
  }

  function maybeJerk() {
    if (!isLive() || !run || !run.spec) return;
    const spec = run.spec;
    const used = spec.pennies - run.penniesLeft;
    const force = spec.forceJerkAt != null && used === spec.forceJerkAt;
    const chance = spec.jerkChance || 0;
    if (!force && Math.random() >= chance) return;
    const amt = Math.max(0.18, spec.jerkAmt || 0.22);
    const ang = Math.random() * Math.PI * 2;
    run.jerkTo = { x: Math.cos(ang) * amt, z: Math.sin(ang) * amt };
    run.jerking = true;
    run.jerkDelay = 0.1;
    run.jerkHold = 0.95;
    run.jerkWave = 1;
    world.shake = 2.1;
    if (world.jerkBanner) {
      world.jerkBanner.visible = true;
      world.jerkBannerT = 1.35;
    }
    if (world.jerkCord) world.jerkCord.visible = true;
    if (world.clothMesh) {
      world.clothMesh.material.emissiveIntensity = 0.62;
      world.clothFlash = 1;
    }
    if (world.aura) world.aura.userData.mood = "yank";
    kit.sfx("shove");
    toast("THE QUILT YANKS", "yank", 1300);
    flashYank(true);
    setBubble("It yanked.");
    setHint("THE QUILT YANKS — dishes slid under your penny");
  }

  function stepJerk(dt) {
    if (!world) return;
    const g = world.clothGroup;
    if (!g) return;
    if (!run || run.done) {
      g.position.x = lerp(g.position.x, 0, 0.12);
      g.position.z = lerp(g.position.z, -0.18, 0.12);
      flashYank(false);
      if (world.jerkCord) world.jerkCord.visible = false;
      return;
    }
    if (run.jerkDelay > 0) {
      run.jerkDelay -= dt;
      if (run.jerkDelay > 0) return;
    }
    const hold = run.moving || run.jerkHold > 0;
    if (run.jerking && run.jerkTo) {
      g.position.x = lerp(g.position.x, run.jerkTo.x, 0.62);
      g.position.z = lerp(g.position.z, -0.18 + run.jerkTo.z, 0.62);
      if (Math.hypot(g.position.x - run.jerkTo.x, g.position.z - (-0.18 + run.jerkTo.z)) < 0.012) {
        g.position.x = run.jerkTo.x;
        g.position.z = -0.18 + run.jerkTo.z;
        run.jerking = false;
      }
    } else if (hold && run.jerkTo) {
      if (run.jerkHold > 0) run.jerkHold -= dt;
      g.position.x = run.jerkTo.x;
      g.position.z = -0.18 + run.jerkTo.z;
    } else {
      g.position.x = lerp(g.position.x, 0, 0.1);
      g.position.z = lerp(g.position.z, -0.18, 0.1);
      if (world.jerkCord) world.jerkCord.visible = false;
      if (Math.hypot(g.position.x, g.position.z + 0.18) < 0.02) flashYank(false);
    }
    if (run.jerkWave > 0) run.jerkWave = Math.max(0, run.jerkWave - dt * 1.35);
    if (world.jerkBannerT > 0) {
      world.jerkBannerT -= dt;
      world.jerkBanner.visible = world.jerkBannerT > 0;
      world.jerkBanner.position.y = TABLE_Y + 0.72 + Math.sin(world.clock * 10) * 0.05;
    }
  }

  function syncRail() {
    if (!world) return;
    const left = isLive() ? (run.penniesLeft | 0) : 6;
    world.railPennies.forEach((p, i) => { p.visible = i < left; });
  }

  function plantSeed(spec) {
    if (!spec || !spec.seed || !world.dishes.length) return;
    const dish = world.dishes[spec.seed.dish];
    if (!dish) return;
    const p = allocPenny();
    p.house = true;
    p.idle = false;
    p.state = "slide";
    p.x = dish.wx;
    p.z = dish.wz;
    p.y = TABLE_Y + PENNY_R;
    p.vx = p.vz = 0;
    capturePenny(p, dish);
  }

  function startStage(n) {
    if (!run) return;
    run.stage = n;
    run.spec = pennypitchStageParams(n);
    if (!run.spec) {
      finish("souvenir");
      return;
    }
    run.penniesLeft = run.spec.pennies || 6;
    run.stagePts = 0;
    run.charging = false;
    run.moving = false;
    run.settle = 0;
    run.moveAge = 0;
    run.jerking = false;
    run.jerkTo = { x: 0, z: 0 };
    run.jerkHold = 0;
    run.jerkWave = 0;
    flashYank(false);
    run.pause = n === 1 ? 180 : 420;
    run._advance = false;
    clearPennies(false);
    rebuildDishes(run.spec);
    if (world.clothGroup) world.clothGroup.position.set(0, TABLE_Y + 0.01, -0.18);
    if (world.stamp) world.stamp.visible = false;
    if (world.jerkBanner) world.jerkBanner.visible = false;
    if (world.jerkCord) world.jerkCord.visible = false;
    paintLandChip(null);
    plantSeed(run.spec);
    tellDepth(run.depth);
    ensureHud();
    paintPips();
    syncRail();
    updateLiveRead();
    setText("pennyPitchStatus", run.spec.barker);
    setBubble(run.spec.barker);
    setHint("DRAG BACK to charge · LEFT/RIGHT to aim · RELEASE to pitch");
    if (world.aura) world.aura.userData.mood = "watch";
    if (world.handPenny) world.handPenny.visible = true;
    const live = el("pennyPitchLive");
    if (live) live.hidden = false;
  }

  function clearCloth() {
    if (!isLive()) return;
    run.score += CLEAR_BONUS + (run.stagePts | 0);
    run.depth += 1;
    run.kitRun.depth = run.depth;
    run.kitRun.score = run.score;
    tellDepth(run.depth);
    kit.sfx("chapter");
    spawnConfetti();
    world.shake = 0.8;
    if (world.aura) world.aura.userData.mood = "celebrate";
    setText("pennyPitchStatus", `${run.spec.title} cleared. Next cloth.`);
    setBubble("Garden yields. Next.");
    toast(`CLOTH ${run.depth}`, "", 1200);
    PF.showBanner(true, `CLOTH ${run.depth}`, run.spec.title);
    const next = pennypitchStageParams(run.stage + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    run.pause = 700;
    run._advance = true;
  }

  function failCloth() {
    if (!run || run.dying) return;
    run.dying = true;
    run.charging = false;
    run.deathHold = DEATH_HOLD_MS;
    run.deathNote = "short_points";
    hideAim();
    if (world.stamp) {
      world.stamp.visible = true;
      world.stamp.position.y = TABLE_Y + 1.2;
    }
    if (world.aura) world.aura.userData.mood = "smirk";
    kit.sfx("stamp");
    setText("pennyPitchStatus", "Cloth stamped the pennies.");
    setBubble("Cloth keeps the pennies.");
    toast("CLOTH", "dead", 1400);
    world.shake = 1.6;
  }

  function resolveSettle() {
    if (!isLive() || !run) return;
    run.moving = false;
    updateLiveRead();
    paintPips();
    syncRail();
    if (PF.refreshDepth) PF.refreshDepth();
    const spec = run.spec;
    if ((run.stagePts | 0) >= (spec.needPts | 0)) {
      clearCloth();
      return;
    }
    if (run.penniesLeft <= 0) {
      failCloth();
      return;
    }
    setHint("DRAG BACK to charge · LEFT/RIGHT to aim · RELEASE to pitch");
    if (world.handPenny) world.handPenny.visible = true;
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    run.charging = false;
    pointerDown = false;
    hideAim();
    const depth = run.depth | 0;
    const score = run.score | 0;
    const death = reason === "leave" ? "leave" : reason === "souvenir" ? "souvenir" : (run.deathNote || "short_points");
    persistDepth({
      depth,
      score,
      deathReason: death,
      cashedOut: death === "souvenir",
      meta: { cloth: depth, reason: death },
    });
    const aura = death === "leave"
      ? AURA_LINES.leave
      : (rk() && typeof rk().auraDeathLine === "function"
        ? rk().auraDeathLine(GAME_ID, depth, death)
        : (depth >= 6 ? AURA_LINES.deep(depth) : (depth > 0 ? AURA_LINES.clear : AURA_LINES.short_points)));
    const challenge = challengeLine(depth);
    const startBtn = el("pennyPitchStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "PITCH AGAIN · 1 demo coin";
      startBtn.hidden = false;
    }
    kit.setMode(card(), "result");
    setImmersed(false);
    const verdict = el("pennyPitchVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = death === "leave" ? "Left the cloth." : (depth > 0 ? `Cloth ${depth}` : "The quilt won.");
    }
    kit.fillResult({
      root: "pennyPitchResult",
      depth: "pennyPitchResultDepth",
      score: "pennyPitchResultScore",
      aura: "pennyPitchResultAura",
      copied: "pennyPitchCopied",
    }, {
      depthLine: death === "souvenir" ? "SOUVENIR · FEVER DISH OPERA" : `CLOTH ${depth}`,
      scoreLine: `SCORE ${score} · ${death.replace(/_/g, " ").toUpperCase()}`,
      auraLine: aura,
    });
    const reasonNode = el("pennyPitchResultReason");
    if (reasonNode) reasonNode.textContent = death.replace(/_/g, " ").toUpperCase();
    setText("pennyPitchChallengeText", challenge);
    PF.setTier("pennyPitchTier", depth > 0 ? `CLOTH ${depth}` : "CLOTH", depth > 0 || reason === "souvenir" ? "perfect" : "miss");
    setText("pennyPitchStatus", reason === "leave" ? "Left the cloth." : reason === "souvenir" ? "The dishes sat still for you." : "Cloth stamped the pennies.");
    setHint("Pitch again · 1 demo coin");
    if (depth > 0 || reason === "souvenir") {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Penny pitch");
      PF.setAura(depth >= 4 || reason === "souvenir" ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, reason === "souvenir" ? "SOUVENIR" : `CLOTH ${depth}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Penny pitch miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "CLOTH", aura);
    }
    PF.refreshNightBoard();
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
    if (world.aura) world.aura.userData.mood = depth > 0 ? "celebrate" : "idle";
    setBubble(aura.replace(/^Aura:\s*/, ""));
    if (world.hand) world.hand.visible = false;
    powerUi(false, 0);
  }

  function start(opts) {
    if (isLive() || starting) return;
    starting = true;
    bootWorld().then((w) => {
      starting = false;
      if (!w) return;
      const kitRun = beginKitRun();
      if (!kitRun) {
        setText("pennyPitchStatus", "Out of demo coins · grant a pass");
        PF.refreshNightBoard();
        stampDepthCopy();
        return;
      }
      clearPennies(false);
      run = {
        done: false,
        dying: false,
        kitRun,
        t: 0,
        depth: 0,
        stage: 1,
        score: 0,
        spec: pennypitchStageParams(1),
        penniesLeft: 6,
        stagePts: 0,
        charging: false,
        moving: false,
        settle: 0,
        pause: 0,
        power: 0.35,
        aimX: 0,
        jerking: false,
        jerkDelay: 0,
        jerkHold: 0,
        jerkWave: 0,
        deathHold: 0,
        deathNote: "short_points",
        _advance: false,
        ptrStart: null,
      };
      tellDepth(0);
      const startBtn = el("pennyPitchStart");
      if (startBtn) startBtn.disabled = true;
      const verdict = el("pennyPitchVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("pennyPitchResult");
      PF.setTier("pennyPitchTier", "", "");
      kit.setMode(card(), "play");
      setImmersed(true);
      stampDepthCopy();
      startStage(1);
      PF.focusCard("pennyPitchCard", true);
      PF.setAura("think");
      world.cam.mode = "play";
      world.cam.k = 0;
      if (opts && opts.gesture && pointerDown) beginAim(opts.gesture);
    }).catch(() => { starting = false; });
  }

  function pointerPower(ev, start) {
    const r = world.canvas.getBoundingClientRect();
    const t = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]) || ev;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const pull = Math.hypot(dx, Math.max(0, dy));
    return {
      power: clamp(pull / Math.max(120, r.height * 0.5), 0.22, 1),
      aimX: clamp(dx / Math.max(80, r.width * 0.34), -1, 1),
    };
  }

  function beginAim(ev) {
    if (!isLive() || !run || !canFlick()) return;
    const t = (ev.touches && ev.touches[0]) || ev;
    pointerDown = true;
    run.charging = true;
    run.ptrStart = { x: t.clientX, y: t.clientY };
    run.power = 0.28;
    run.aimX = 0;
    const st = stageEl();
    if (st) st.classList.add("is-aiming");
    showAim(run.power, run.aimX);
    setHint("RELEASE to flick — dishes score, quilt may yank");
    if (world.aura) world.aura.userData.mood = "watch";
  }

  function moveAim(ev) {
    if (!isLive() || !run || !run.charging || !run.ptrStart) return;
    const a = pointerPower(ev, run.ptrStart);
    run.power = a.power;
    run.aimX = a.aimX;
    showAim(run.power, run.aimX);
  }

  function dropAim() {
    const st = stageEl();
    if (st) st.classList.remove("is-aiming");
    if (!isLive() || !run || !run.charging) {
      pointerDown = false;
      hideAim();
      return;
    }
    pointerDown = false;
    run.charging = false;
    const power = run.power;
    const aimX = run.aimX;
    hideAim();
    launchFlick(power, aimX);
  }

  function launchFlick(power, aimX, idle) {
    if (!world) return;
    const spec = liveSpec();
    const v = flickVel(power, aimX, !!(!idle && spec && spec.mirrorAim));
    const from = launchOrigin();
    const p = allocPenny();
    p.idle = !!idle;
    p.x = from.x;
    p.y = from.y;
    p.z = from.z;
    p.vx = v.vx;
    p.vy = v.vy;
    p.vz = v.vz;
    p.state = "air";
    p.mesh.position.set(p.x, p.y, p.z);
    if (world.handPenny) world.handPenny.visible = false;
    if (!idle) {
      run.penniesLeft = Math.max(0, run.penniesLeft - 1);
      run.moving = true;
      run.settle = 0;
      run.moveAge = 0;
      paintPips();
      syncRail();
      kit.sfx("sling");
      maybeJerk();
      updateLiveRead();
      setHint("Watch the penny — nest inside a dish");
    }
  }

  function stepFx(dt) {
    if (!world) return;
    world.sparks.forEach((s) => {
      if (s.life <= 0) {
        s.mesh.visible = false;
        return;
      }
      s.life -= dt;
      s.v.y -= 4.2 * dt;
      s.mesh.position.addScaledVector(s.v, dt);
      s.mesh.scale.setScalar(Math.max(0.1, s.life / s.max));
    });
    world.confetti.forEach((c) => {
      if (c.life <= 0) {
        c.mesh.visible = false;
        return;
      }
      c.life -= dt;
      c.v.y -= 3.4 * dt;
      c.mesh.position.addScaledVector(c.v, dt);
      c.mesh.rotation.x += c.spin.x * dt;
      c.mesh.rotation.z += c.spin.z * dt;
    });
    if (!CHEAP) {
      world.lanterns.forEach((L) => {
        L.light.intensity = L.base + Math.sin(world.clock * 3.1 + L.phase) * 0.18;
      });
    }
    if (world.clothFlash > 0) {
      world.clothFlash = Math.max(0, world.clothFlash - dt * 1.8);
      if (world.clothMesh) world.clothMesh.material.emissiveIntensity = 0.12 + world.clothFlash * 0.5;
    }
    if (world.dishes) {
      world.dishes.forEach((d) => {
        if (d.pulse > 0) {
          d.pulse = Math.max(0, d.pulse - dt * 1.6);
          if (d.glow) d.glow.emissiveIntensity = 0.22 + d.pulse * 1.6;
        }
      });
    }
    if (world.bubbleT > 0) {
      world.bubbleT -= dt;
      if (world.bubbleT <= 0) world.bubble.visible = false;
    }
    if (world.aura) animatePerson(world.aura, dt);
    if (world.stamp && world.stamp.visible) {
      world.stamp.position.y = lerp(world.stamp.position.y, TABLE_Y + 0.42, 0.18);
    }
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) {
        const n = el("pennyPitchToast");
        if (n) n.hidden = true;
      }
    }
  }

  function stepIdleDemo(dt) {
    if (isLive() || !world || !world.ready) return;
    world._idleDrop = (world._idleDrop || 0) - dt;
    if (world._idleDrop <= 0 && !anyMoving()) {
      world._idleDrop = CHEAP ? 4.8 : 2.6;
      world.pennies.filter((p) => p.idle).forEach(freePenny);
      launchFlick(rand(0.35, 0.7), rand(-0.45, 0.45), true);
    }
  }

  function tick(now) {
    if (!world || !world.ready) return;
    if (!cabinetOn()) {
      world.raf = 0;
      return;
    }
    world.raf = requestAnimationFrame(tick);
    if (!world.last) world.last = now;
    const dt = Math.min(0.05, (now - world.last) / 1000);
    world.last = now;
    world.clock += dt;
    if (run && !run.done) {
      run.t += dt * 1000;
      if (run.pause > 0) {
        run.pause -= dt * 1000;
        if (run.pause <= 0 && run._advance) {
          run._advance = false;
          startStage(run.stage + 1);
        }
      }
      if (run.dying) {
        run.deathHold -= dt * 1000;
        if (run.deathHold <= 0) finish("short_points");
      }
    }
    stepJerk(dt);
    syncDishWorld();
    if (world.pennies.length) {
      const sub = Math.min(CHEAP ? 2 : 3, Math.ceil(dt / 0.018));
      const sdt = dt / sub;
      for (let s = 0; s < sub; s += 1) {
        world.pennies.forEach((p) => stepPenny(p, sdt));
        collidePennies();
      }
    }
    if (isLive() && run && run.moving && !run.dying && run.pause <= 0) {
      run.moveAge = (run.moveAge || 0) + dt;
      if (!anyMoving()) {
        run.settle += dt;
        if (run.settle >= SETTLE_S) resolveSettle();
      } else if (run.moveAge > SETTLE_MAX) {
        world.pennies.forEach((p) => {
          if (p.state === "slide") {
            p.vx = p.vz = 0;
            tryCapture(p);
          }
        });
        resolveSettle();
      } else {
        run.settle = 0;
      }
    }
    rippleCloth(dt);
    stepFx(dt);
    updateCamera(dt);
    if (!isLive()) stepIdleDemo(dt);
    world.renderer.render(world.scene, world.camera);
  }

  function startLoop() {
    if (!world || !world.ready) return;
    if (world.raf) return;
    world.last = 0;
    world.raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (world && world.raf) {
      cancelAnimationFrame(world.raf);
      world.raf = 0;
    }
  }

  function onShow() {
    declareP0();
    stampDepthCopy();
    ensureHud();
    paintPips();
    setText("pennyPitchStatus", DEPTH_COPY.status);
    setHint("Click START or drag on the table to pitch");
    bootWorld().then((w) => {
      if (!w || !cabinetOn()) return;
      startLoop();
      resizeRenderer();
    });
  }

  function onLeave() {
    if (isLive() || (run && run.dying && !run.done)) finish("leave");
    stopLoop();
    pointerDown = false;
    setImmersed(false);
    hideAim();
  }

  function onReset() {
    if (run && !run.done) finish("leave");
    run = null;
    const verdict = el("pennyPitchVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("pennyPitchResult");
    const startBtn = el("pennyPitchStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.hidden = false;
      startBtn.textContent = "START · 1 demo coin";
    }
    kit.setMode(card(), "vestibule");
    resetPips();
    stampDepthCopy();
    setImmersed(false);
    hideAim();
    if (world && world.stamp) world.stamp.visible = false;
    if (world && world.aura) world.aura.userData.mood = "idle";
    setHint("Click START or drag on the table to pitch");
    if (cabinetOn()) startLoop();
  }

  function onKeyDown(ev) {
    if (!cabinetOn()) return;
    if (ev.repeat && ev.code !== "ArrowLeft" && ev.code !== "ArrowRight" && ev.code !== "ArrowUp" && ev.code !== "ArrowDown") return;
    if (ev.code === "Space" || ev.code === "Enter") {
      if (!isLive()) {
        ev.preventDefault();
        start();
        return;
      }
      if (canFlick() && ev.code === "Space") {
        ev.preventDefault();
        run.charging = true;
        run.ptrStart = null;
        run.power = 0.28;
        run.aimX = run.aimX || 0;
        showAim(run.power, run.aimX);
        setHint("Hold SPACE to charge · arrows aim · release SPACE to pitch");
      }
    }
    if (isLive() && run && run.charging) {
      if (ev.code === "ArrowLeft" || ev.code === "KeyA") { run.aimX = clamp(run.aimX - 0.08, -1, 1); showAim(run.power, run.aimX); }
      if (ev.code === "ArrowRight" || ev.code === "KeyD") { run.aimX = clamp(run.aimX + 0.08, -1, 1); showAim(run.power, run.aimX); }
      if (ev.code === "ArrowDown" || ev.code === "KeyS") { run.power = clamp(run.power + 0.05, 0.2, 1); showAim(run.power, run.aimX); }
      if (ev.code === "ArrowUp" || ev.code === "KeyW") { run.power = clamp(run.power - 0.05, 0.2, 1); showAim(run.power, run.aimX); }
    }
  }

  function onKeyUp(ev) {
    if (!cabinetOn()) return;
    if (ev.code === "Space" && isLive() && run && run.charging && !pointerDown) {
      ev.preventDefault();
      const power = run.power;
      const aimX = run.aimX;
      run.charging = false;
      hideAim();
      launchFlick(power, aimX);
    }
  }

  PF.registerVendor({
    id: "penny-pitch",
    playKey: "pennypitch",
    chalk: "Flick a dish. The quilt has opinions.",
    defaults: { bestPennyPitch: 0, bestPennyPitchScore: 0 },
    onLeave,
    onShow,
    onReset,
    refreshDepth(state) {
      setText("depthPitchNow", isLive() || (run && run.dying) ? String(run.depth) : "0");
      const bestN = Math.max(state.bestPennyPitch || 0, (state.bestDepth && state.bestDepth.pennypitch) || 0);
      setText("depthPitchBest", bestN ? String(bestN) : "—");
      setText("depthPitchScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("depthPitchBestScore", state.bestPennyPitchScore ? String(state.bestPennyPitchScore) : "—");
      setText("pennyPitchDoorBest", bestN ? `Best cloth ${bestN}` : "Cloths —");
    },
    bind() {
      if (bound) return;
      bound = true;
      declareP0();
      ensureHud();
      paintPips();
      stampDepthCopy();
      const startBtn = el("pennyPitchStart");
      if (startBtn) startBtn.addEventListener("click", () => start());
      const canvas = el("pennyPitchCanvas");
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("pointermove", (ev) => {
          if (isLive() && run && (run.charging || pointerDown)) ev.preventDefault();
          moveAim(ev);
        });
        canvas.addEventListener("pointerdown", (ev) => {
          if (run && (run.dying || run.done)) return;
          pointerDown = true;
          if (!isLive()) {
            ev.preventDefault();
            try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
            start({ gesture: ev });
            return;
          }
          ev.preventDefault();
          try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
          beginAim(ev);
        });
        const up = (ev) => {
          pointerDown = false;
          if (!run || !run.charging) return;
          ev.preventDefault();
          moveAim(ev);
          dropAim();
        };
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("lostpointercapture", up);
        canvas.addEventListener("pointercancel", up);
        canvas.addEventListener("pointerleave", (ev) => {
          if (run && run.charging && pointerDown) {
            moveAim(ev);
            dropAim();
          }
        });
      }
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      const copyBtn = el("pennyPitchChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = lastDepth();
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("pennyPitchCopied");
            if (copied) copied.hidden = false;
            setText("pennyPitchStatus", "Copied — send it");
          }, () => {
            setText("pennyPitchStatus", text);
          });
        });
      }
      bootWorld();
    },
  });
}
