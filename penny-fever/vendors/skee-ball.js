/* Skee-Ball Alley — Desktop Grok owns this doorway. PF only. Never booth/port 6000. Never Imagine.
 * 3D boardwalk tent. One-thumb SlingAim. Wax lies mid-stage. Under-target death after 9.
 * One coin = one run. Family-safe carnival. Aura locked look if she appears. */
import * as THREE from "../world/lib/three.module.min.js";

(function boot() {
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
    else setTimeout(boot, 24);
    return;
  }
  main(PF);
})();

function main(PF) {
  "use strict";
  const { $, kit } = PF;

  const GAME_ID = "skee";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const BALLS = 9;
  const CLEAR_BONUS = 250;
  const DEATH_HOLD_MS = 760;
  const MAX_STAGE_PTS = 9 * 50;
  const BALL_R = 0.05;
  const LANE_Y = 0.92;
  const LANE_HALF = 0.31;
  const TEE = { x: 0, y: LANE_Y + BALL_R, z: 0.58 };
  const FLAT_END = -5.72;
  const RAMP_LEN = 1.88;
  const RAMP_H = 1.26;
  const RAMP_END = FLAT_END - RAMP_LEN;
  const RAMP_THETA = Math.atan(RAMP_H / RAMP_LEN);
  const GRAVITY = 9.6;
  const LANE_FRIC = 0.34;
  const RAMP_FRIC = 0.16;
  const RING_VALS = [10, 20, 30, 50];

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;
  const WOOD = 0x5a341c;
  const WOOD_DARK = 0x2a160e;

  let run = null;
  let view = null;
  let idleT = 0;
  let idleRoom = 1;
  let reduced = false;
  let keys = { a: false, d: false, space: false };
  const pointer = { down: false, id: 0, sx: 0, sy: 0, x: 0, y: 0 };

  const AURA = {
    under_target: "Aura: Wax got you.",
    board: (n) => `Aura: SKEE ${n}. Nine balls, board still hungry.`,
    clear: "Aura: Board beaten. Next lane cheats different.",
    deep: (n) => `Aura: Lane ${n}. You're arguing with the wax and winning.`,
    leave: "Aura: Walking off mid-board? Coward’s stamp.",
    shallow: "Aura: Not a single lane. The board kept the balls.",
    souvenir: "Aura: Fever Lane Opera survived. Souvenir — the board tipped its hat.",
    roll: "Aura: Hold one thumb. Release in the gold. The boards remember every roll.",
    fifty: "Aura: Crown hole. That’s how you talk to wax.",
    gutter: "Aura: Gutters whispered. Stay in the wood.",
  };

  const AUTHORED = [
    {
      id: 1, name: "Soft Boardwalk", title: "Soft Boardwalk", kind: "teach",
      target: 100, ringScale: 1.08, waxLies: false, balls: 9,
      goldLo: 0.54, goldHi: 0.90, loft: 1, needleSpeed: 0.70,
      gutter: false, split50: false, bankRail: false, invertPower: false, movingFifty: false, crown: true,
      barker: "Soft Boardwalk. Hold one thumb. Release in the wide gold. Honest wood.",
    },
    {
      id: 2, name: "Gutter Whisper", title: "Gutter Whisper", kind: "gutter",
      target: 120, ringScale: 1.0, waxLies: false, balls: 9,
      goldLo: 0.58, goldHi: 0.88, loft: 1, needleSpeed: 1.05,
      gutter: true, split50: false, bankRail: false, invertPower: false, movingFifty: false,
      barker: "Outlanes MAGNETIZE. Stay off the gutters or they whisper you out.",
    },
    {
      id: 3, name: "Wax Sheen", title: "Wax Sheen", kind: "waxLie",
      target: 140, ringScale: 1.0, waxLies: true, balls: 9,
      goldLo: 0.62, goldHi: 0.86, loft: 1, needleSpeed: 1.22,
      gutter: false, split50: false, bankRail: false, invertPower: false, movingFifty: false,
      barker: "Sheen hits MID-LANE. First ball after sheen SKIDS LONG. Ghost is not the land.",
    },
    {
      id: 4, name: "Split Ring Gate", title: "Split Ring Gate", kind: "split50",
      target: 160, ringScale: 1.0, waxLies: false, balls: 9,
      goldLo: 0.60, goldHi: 0.86, loft: 1, needleSpeed: 1.35,
      gutter: false, split50: true, bankRail: false, invertPower: false, movingFifty: false,
      barker: "The 50 split into TWO 30s. No center crown. Pick a gate.",
    },
    {
      id: 5, name: "Bank Shot Alley", title: "Bank Shot Alley", kind: "bankShot",
      target: 180, ringScale: 1.0, waxLies: false, balls: 9,
      goldLo: 0.58, goldHi: 0.88, loft: 1, needleSpeed: 1.4,
      gutter: false, split50: false, bankRail: true, invertPower: false, movingFifty: false, bankNeed: 2,
      barker: "Left BANK rail is live. Bounce for a stamp. Beat 180 — or two bank stamps.",
    },
    {
      id: 6, name: "Reverse Power", title: "Reverse Power", kind: "invertPower",
      target: 180, ringScale: 1.0, waxLies: false, balls: 9,
      goldLo: 0.10, goldHi: 0.46, loft: 1, needleSpeed: 1.28,
      gutter: false, split50: false, bankRail: false, invertPower: true, movingFifty: false,
      barker: "REVERSE — release EARLY for a long sling. Muscle memory is the cheat.",
    },
    {
      id: 7, name: "Moving Fifty", title: "Moving Fifty", kind: "movingFifty",
      target: 200, ringScale: 1.0, waxLies: false, balls: 9,
      goldLo: 0.62, goldHi: 0.86, loft: 1, needleSpeed: 1.32,
      gutter: false, split50: false, bankRail: false, invertPower: false, movingFifty: true,
      barker: "The 50 ORBITS. 10/20/30 sit still. Lead the crown hole.",
    },
    {
      id: 8, name: "Fever Lane Opera", title: "Fever Lane Opera", kind: "comboFinale",
      target: 220, ringScale: 0.96, waxLies: true, balls: 9,
      goldLo: 0.60, goldHi: 0.86, loft: 1, needleSpeed: 1.4,
      gutter: true, split50: false, bankRail: false, invertPower: false, movingFifty: true,
      barker: "Finale: sheen mid-lane + gutter pull + moving fifty. Nine balls. Beat 220.",
    },
  ];

  const P0_MOUNT = {
    engine: "SlingAim",
    displayName: "Skee-Ball Alley",
    depthUnit: "Lane",
    sheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
    authoredSheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
    codaSheet: "GOBLIN_BATCH04_MOUNT_CONFIGS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored LANES then ENDLESS · 9 balls · the sheen is the cheat",
    body: "One-thumb sling. Hold, release in the gold. Soft Boardwalk → Gutter Whisper → Wax Sheen (sheen hits MID-LANE, next ball skids long, ghost is not the land) → Split Ring Gate → Bank Shot Alley → Reverse Power → Moving Fifty → Fever Lane Opera → ENDLESS Wax Lie. Nine balls. Beat the board or WAX stamps you. No unlimited balls.",
    status: "HOLD one thumb · release in GOLD · 9 balls · beat the board",
    machine: "Boardwalk skee · 1 demo coin · one-thumb sling",
    punch: "HOLD one thumb. Release in the gold band. Nine balls. Under target is death.",
  };

  function rk() { return PF.runKit || null; }
  function el(id) { return $(id); }
  function setText(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function card() { return el("skeeCard"); }
  function cabinetOn() {
    const node = document.getElementById("cabinet-skee-ball");
    return !!(node && !node.hidden);
  }
  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }
  function liveSpec() {
    if (run && run.spec) return run.spec;
    return skeeStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function skeeCoda(n) {
    const t = Math.max(1, (n | 0) - AUTHORED_COUNT);
    return {
      id: n,
      name: `Wax Lie ${n}`,
      title: `Wax Lie ${n}`,
      kind: "coda",
      target: Math.min(MAX_STAGE_PTS - 20, 220 + 40 * t),
      ringScale: Math.max(0.62, 1.0 - 0.04 * t),
      waxLies: true,
      balls: 9,
      goldLo: t % 3 === 0 ? 0.12 : 0.70,
      goldHi: t % 3 === 0 ? 0.42 : 0.84,
      loft: 1, needleSpeed: Math.min(2.2, 1.5 + 0.08 * t),
      gutter: true,
      split50: false,
      bankRail: false,
      invertPower: t % 3 === 0,
      movingFifty: true,
      coda: true,
      barker: `ENDLESS Wax Lie ${n} — rings shrink, wax on, gutters still whisper.`,
    };
  }

  function skeeStageParams(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[stage - 1]);
    if (!CODA_ENABLED) return null;
    return skeeCoda(stage);
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun || typeof kitRun.declare !== "function") return;
    try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already */ }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: skeeStageParams,
      codaParams: skeeCoda,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function cheatLabel(spec) {
    if (!spec) return "";
    if (spec.kind === "coda") return "ENDLESS · WAX LIE";
    if (spec.kind === "comboFinale") return "WAX + GUTTER + MOVING 50";
    if (spec.kind === "movingFifty" || spec.movingFifty) return "50 ORBITS — LEAD IT";
    if (spec.kind === "invertPower" || spec.invertPower) return "REVERSE — EARLY = LONG";
    if (spec.kind === "bankShot" || spec.bankRail) return "BANK RAIL — STAMP OR SCORE";
    if (spec.kind === "split50" || spec.split50) return "NO 50 — TWO 30 GATES";
    if (spec.kind === "waxLie" || spec.waxLies) return "SHEEN HITS MID-LANE — GHOST ≠ LAND";
    if (spec.kind === "gutter" || spec.gutter) return "GUTTERS MAGNETIZE";
    if (spec.kind === "teach" || spec.crown) return "CROWNED LANE — RAILS FUNNEL";
    return "";
  }

  function hudLine(spec, playing) {
    if (!spec) return "LANE 0";
    const name = spec.name || spec.title || "Lane";
    if (spec.coda) return `ENDLESS · LANE ${playing} · ${name}`;
    return `LANE ${playing} · ${name}`;
  }

  function ensureCss() {
    if (document.querySelector('link[href*="skee-ball.css"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "vendors/skee-ball.css";
    document.head.appendChild(link);
  }

  function stageEl() {
    return card() || document.getElementById("cabinet-skee-ball");
  }

  function ensureHud() {
    const hud = el("skeeHud");
    const line = stageEl() && stageEl().querySelector(`[data-runkit-hud="${GAME_ID}"]`);
    if (line) {
      if (isLive() || (run && run.dying)) {
        line.textContent = hudLine(liveSpec(), run.stage | 0);
        line.hidden = false;
      } else {
        line.textContent = "LANE 0";
        line.hidden = true;
        if (hud) hud.hidden = true;
      }
    }
    return line;
  }

  function ensurePips(count) {
    const span = (stageEl() && stageEl().querySelector(`[data-runkit-strikes="${GAME_ID}"]`)) || null;
    if (!span) return null;
    const n = Math.max(9, count | 0);
    if (span.childElementCount !== n) span.innerHTML = new Array(n).fill("<i></i>").join("");
    return span;
  }

  function paintPips() {
    const spec = liveSpec();
    const max = (spec && spec.balls) || 9;
    const span = ensurePips(max);
    if (!span) return;
    const used = (isLive() || (run && run.dying)) ? Math.max(0, max - (run.ballsLeft | 0)) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < used));
    if (view) {
      view.trough.forEach((mesh, i) => {
        mesh.visible = i < ((isLive() || (run && run.dying)) ? (run.ballsLeft | 0) : max);
      });
    }
  }

  function resetPips() {
    const pips = document.querySelector("[data-runkit-strikes=\"skee\"]");
    if (pips) pips.querySelectorAll("i").forEach((n) => n.classList.remove("on"));
    if (view) view.trough.forEach((mesh) => { mesh.visible = true; });
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall */ }
    }
    kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "under_target",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestSkee = Math.max(state.bestSkee || 0, payload.depth);
      state.bestSkeeScore = Math.max(state.bestSkeeScore || 0, payload.score);
      state.bestSkeeStagePts = Math.max(state.bestSkeeStagePts || 0, (payload.meta && payload.meta.bestStagePts) || 0);
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (state) {
      const keyed = Object.assign({ gameId: GAME_ID, at: Date.now() }, payload);
      const prev = (state.lastRun && typeof state.lastRun === "object" && !Array.isArray(state.lastRun)) ? state.lastRun : {};
      state.lastRun = Object.assign({}, prev, {
        game: GAME_ID, gameId: GAME_ID, depth: payload.depth, score: payload.score,
        deathReason: payload.deathReason, cashedOut: payload.cashedOut, at: keyed.at,
      });
      state.lastRun[GAME_ID] = keyed;
    }
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("skee")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function shadowCtx(ctx) {
    return {
      gameId: GAME_ID,
      startedAt: (ctx && ctx.startedAt) || Date.now(),
      feverNode: !!(ctx && ctx.feverNode),
      feverGate: ctx && ctx.feverGate,
      depth: 0,
      score: 0,
      strikes: 0,
      alive: true,
    };
  }

  function mountSling(ctx) {
    const engines = rk() && rk().engines;
    if (!engines || !engines.SlingAim || typeof engines.SlingAim.mount !== "function" || !ctx) return null;
    try {
      return engines.SlingAim.mount(el("skeeCanvas") || card(), {
        gravity: GRAVITY,
        missesToDeath: 99,
        stageParams: skeeStageParams,
        onThrow() { kit.sfx("throw"); },
        hitTest() { return false; },
      }, shadowCtx(ctx));
    } catch (_) {
      return null;
    }
  }

  function tellDepth(n) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportDepth !== "function") return;
    const spec = liveSpec();
    try { rk().reportDepth(run.kitRun, n | 0, { name: spec.title, coda: !!spec.coda }); } catch (_) { /* hud */ }
    ensureHud();
  }

  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") return rk().challengeText("Skee-Ball stage", depth, GAME_ID);
    return `Beat my Skee-Ball stage ${depth} on Penny Fever`;
  }

  function lastDepth() {
    const state = PF.getState() || {};
    const keyed = state.lastRun && state.lastRun[GAME_ID];
    if (keyed && keyed.depth != null) return keyed.depth | 0;
    const last = state.lastRun;
    if (last && (last.game === GAME_ID || last.gameId === GAME_ID)) return last.depth | 0;
    return Math.max(state.bestSkee || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }

  function goldBand(spec) {
    if (!spec) return { lo: 0.62, hi: 0.86 };
    return { lo: spec.goldLo != null ? spec.goldLo : 0.62, hi: spec.goldHi != null ? spec.goldHi : 0.86 };
  }

  function waxMul() {
    if (!run || !run.waxOn) return 1;
    return run.waxMul || 1;
  }

  function holeDefs(spec, t) {
    const s = spec && spec.ringScale != null ? spec.ringScale : 1;
    const split = !!(spec && (spec.split50 || spec.kind === "split50"));
    const moving = !!(spec && (spec.movingFifty || spec.kind === "movingFifty" || spec.kind === "comboFinale" || (spec.coda && spec.movingFifty)));
    const holes = [
      { id: "10L", v: 10, u: 0.24, x: -0.27, r: 0.11 * s, skip: 2.75 },
      { id: "10R", v: 10, u: 0.24, x: 0.27, r: 0.11 * s, skip: 2.75 },
      { id: "20", v: 20, u: 0.38, x: 0, r: 0.080 * s, skip: 3.50 },
      { id: "30", v: 30, u: 0.56, x: 0, r: 0.074 * s, skip: 4.40 },
      { id: "40L", v: 40, u: 0.72, x: -0.15, r: 0.068 * s, skip: 5.10 },
      { id: "40R", v: 40, u: 0.72, x: 0.15, r: 0.068 * s, skip: 5.10 },
      { id: "50", v: 50, u: 0.90, x: 0, r: 0.064 * s, skip: 6.80 },
    ];
    if (split) {
      holes.pop();
      holes.push({ id: "30GL", v: 30, u: 0.90, x: -0.12, r: 0.07 * s, skip: 6.80, gate: 0 });
      holes.push({ id: "30GR", v: 30, u: 0.90, x: 0.12, r: 0.07 * s, skip: 6.80, gate: 1 });
    } else if (moving) {
      const a = (t || 0) * 0.00155;
      const h = holes[holes.length - 1];
      h.x = Math.sin(a) * 0.16;
      h.u = 0.88 + Math.cos(a) * 0.045;
    }
    return holes;
  }

  function holeWorld(h) {
    const z = FLAT_END - h.u * RAMP_LEN;
    const y = LANE_Y + h.u * RAMP_H + 0.02;
    return { x: h.x, y, z };
  }

  /* ---------- textures / mats ---------- */
  function texFrom(draw, w, h, repeatX, repeatY) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    if (repeatX) t.repeat.set(repeatX, repeatY || 1);
    return t;
  }

  function woodTex() {
    return texFrom((ctx, w, h) => {
      ctx.fillStyle = "#5a341c";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 18; i += 1) {
        ctx.fillStyle = i % 2 ? "rgba(90,42,18,0.35)" : "rgba(212,164,90,0.12)";
        ctx.fillRect((i / 18) * w, 0, w / 18, h);
      }
      ctx.fillStyle = "rgba(20,8,4,0.18)";
      for (let y = 0; y < h; y += 7) {
        ctx.beginPath();
        ctx.moveTo(0, y + Math.sin(y * 0.2) * 2);
        ctx.lineTo(w, y + Math.cos(y * 0.13) * 3);
        ctx.strokeStyle = "rgba(20,8,4,0.22)";
        ctx.stroke();
      }
    }, 256, 256, 4, 12);
  }

  function canvasStripe() {
    return texFrom((ctx, w, h) => {
      for (let i = 0; i < 10; i += 1) {
        ctx.fillStyle = i % 2 ? "#7a1824" : "#f0d4b0";
        ctx.fillRect(0, (i / 10) * h, w, h / 10);
      }
    }, 64, 256, 1, 6);
  }

  function sheenTex() {
    return texFrom((ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(255,246,236,0)");
      g.addColorStop(0.45, "rgba(255,246,236,0.55)");
      g.addColorStop(0.55, "rgba(232,160,184,0.4)");
      g.addColorStop(1, "rgba(255,246,236,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }, 256, 64, 1, 1);
  }

  function makeMat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.62, metalness: 0.08,
    }, extra || {}));
  }

  function labelTex(text, color) {
    return texFrom((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color || "#f0d09a";
      ctx.font = "bold 42px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, w / 2, h / 2);
    }, 128, 64);
  }

  function marqueeTex(text) {
    return texFrom((ctx, w, h) => {
      ctx.fillStyle = "#1a080c";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "bold 54px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, w / 2, h / 2);
    }, 768, 160);
  }

  /* ---------- scene ---------- */
  function meshBox(mat, sx, sy, sz, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = false;
    m.receiveShadow = true;
    return m;
  }
  function meshCyl(mat, rt, rb, h, x, y, z, segs) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs || 12), mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }
  function meshSphere(mat, r, x, y, z) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = makeMat(SKIN, { roughness: 0.55 });
    const dress = makeMat(DRESS, { roughness: 0.45, emissive: 0x0a2010, emissiveIntensity: 0.22 });
    const blouse = makeMat(BLOUSE, { roughness: 0.5 });
    const hairM = makeMat(HAIR, { roughness: 0.7 });
    const gold = makeMat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.5 });
    const heart = makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.55 });
    const shoe = makeMat(0x111111, { metalness: 0.45, roughness: 0.25 });

    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(meshCyl(blouse, 0.13, 0.15, 0.28, 0, 0.28, 0));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.12, 0.34, 12), dress);
    skirt.position.y = 0.06;
    hip.add(skirt);
    const heartBox = meshBox(heart, 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    heartBox.rotation.z = Math.PI / 4;
    hip.add(heartBox);

    const head = new THREE.Group();
    head.position.y = 0.62;
    hip.add(head);
    head.add(meshSphere(skin, 0.175, 0, 0.02, 0));
    const eyeW = makeMat(0xf7f2ea);
    const eyeD = makeMat(0x2a1810);
    [-1, 1].forEach((side) => {
      const white = meshSphere(eyeW, 0.038, side * 0.055, 0.03, 0.15);
      white.scale.set(0.038, 0.044, 0.02);
      head.add(white);
      head.add(meshSphere(eyeD, 0.02, side * 0.055, 0.03, 0.168));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), makeMat(0xc45a6a));
    smile.position.set(0, -0.05, 0.16);
    smile.rotation.x = 2.6;
    head.add(smile);
    head.add(meshSphere(hairM, 0.23, 0, 0.06, -0.02));
    [-1, 1].forEach((side) => {
      head.add(meshSphere(hairM, 0.11, side * 0.2, -0.04, 0.04));
      head.add(meshSphere(heart, 0.045, side * 0.2, 0.06, 0.06));
    });
    head.add(meshBox(hairM, 0.28, 0.07, 0.1, 0, 0.14, 0.16));
    const crown = new THREE.Group();
    crown.position.y = 0.24;
    head.add(crown);
    crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold));
    [-0.09, 0, 0.09].forEach((x, i) => {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, i === 1 ? 0.14 : 0.09, 6), gold);
      spike.position.set(x, (i === 1 ? 0.14 : 0.09) * 0.45, 0);
      crown.add(spike);
    });
    const gem = meshBox(heart, 0.055, 0.055, 0.025, 0, 0.02, 0.11);
    gem.rotation.z = Math.PI / 4;
    crown.add(gem);

    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0.0, 0);
      const len = arm ? 0.28 : 0.34;
      const bone = meshCyl(arm ? skin : dress, arm ? 0.035 : 0.042, arm ? 0.035 : 0.042, len, 0, -len / 2, 0);
      pivot.add(bone);
      if (arm) pivot.add(meshSphere(skin, 0.04, 0, -len, 0));
      else pivot.add(meshBox(shoe, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03));
      hip.add(pivot);
      return pivot;
    }
    g.userData = { hip, head, armL: limb(-1, true), armR: limb(1, true), legL: limb(-1, false), legR: limb(1, false), mood: "idle", moodT: 0 };
    g.userData.armL.rotation.z = 0.35;
    g.userData.armR.rotation.z = -0.55;
    g.userData.armR.rotation.x = -0.4;
    return g;
  }

  function makeBallMesh() {
    const g = new THREE.Group();
    const body = meshSphere(makeMat(0xb41e32, { roughness: 0.38, metalness: 0.12 }), BALL_R, 0, 0, 0);
    g.add(body);
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(BALL_R * 0.72, 0.006, 6, 16), makeMat(0xfff6ec, { roughness: 0.4 }));
    stripe.rotation.x = Math.PI / 2;
    g.add(stripe);
    const hi = meshSphere(makeMat(0xfff6ec, { roughness: 0.3 }), 0.012, -0.016, 0.018, 0.018);
    g.add(hi);
    return g;
  }

  function makeHoleGroup(def) {
    const g = new THREE.Group();
    const well = meshCyl(makeMat(0x080406, { roughness: 1 }), def.r * 0.92, def.r * 0.7, 0.16, 0, -0.04, 0, 18);
    g.add(well);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(def.r, 0.012, 8, 20),
      makeMat(0xd4a45a, { metalness: 0.7, roughness: 0.28, emissive: 0x3a2808, emissiveIntensity: 0.25 })
    );
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: labelTex(String(def.v)),
      transparent: true,
      depthWrite: false,
    }));
    spr.scale.set(0.16, 0.08, 1);
    spr.position.set(0, 0.08, 0.02);
    g.add(spr);
    g.userData = { rim, def, sprite: spr };
    return g;
  }

  function buildWorld(canvas) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: (window.devicePixelRatio || 1) < 1.7,
      alpha: false,
      failIfMajorPerformanceCaveat: false,
    });
    renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.12;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x14080c);
    scene.fog = new THREE.FogExp2(0x14080c, 0.045);
    const camera = new THREE.PerspectiveCamera(56, 1, 0.08, 80);
    camera.position.set(0.2, 1.42, 1.7);
    const clock = new THREE.Clock();

    const wood = woodTex();
    const woodMat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.72, metalness: 0.04, color: 0xffffff });
    const darkWood = makeMat(WOOD_DARK, { roughness: 0.8 });
    const brass = makeMat(GOLD, { metalness: 0.72, roughness: 0.3, emissive: 0x3a2808, emissiveIntensity: 0.2 });
    const stripe = new THREE.MeshStandardMaterial({ map: canvasStripe(), roughness: 0.85, side: THREE.DoubleSide });
    const velvet = makeMat(0x4a1a28, { roughness: 0.9 });

    const tent = new THREE.Group();
    scene.add(tent);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 18), velvet);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -4);
    tent.add(floor);
    [-1, 1].forEach((side) => {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 5.4), stripe);
      wall.position.set(side * 3.6, 2.6, -4);
      wall.rotation.y = side * -Math.PI / 2;
      tent.add(wall);
    });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(8, 5.4), stripe);
    back.position.set(0, 2.6, -10.2);
    tent.add(back);
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(9, 16), makeMat(0x3a1018, { side: THREE.DoubleSide, roughness: 0.95 }));
    roof.rotation.x = Math.PI / 2.4;
    roof.position.set(0, 4.6, -4);
    tent.add(roof);

    const machine = new THREE.Group();
    scene.add(machine);
    const bodyLen = 8.7;
    machine.add(meshBox(darkWood, 1.15, 0.9, bodyLen, 0, 0.45, -3.4));
    const lane = meshBox(woodMat, 0.64, 0.06, 6.4, 0, LANE_Y, -2.55);
    machine.add(lane);
    const gutterL = meshBox(makeMat(0x12080c), 0.16, 0.08, 6.4, -0.40, LANE_Y - 0.04, -2.55);
    const gutterR = meshBox(makeMat(0x12080c), 0.16, 0.08, 6.4, 0.40, LANE_Y - 0.04, -2.55);
    machine.add(gutterL, gutterR);
    const railL = meshBox(brass, 0.04, 0.08, 6.3, -0.33, LANE_Y + 0.05, -2.55);
    const railR = meshBox(brass, 0.04, 0.08, 6.3, 0.33, LANE_Y + 0.05, -2.55);
    machine.add(railL, railR);
    const bank = meshBox(makeMat(GOLD, { metalness: 0.6, roughness: 0.32, emissive: GOLD, emissiveIntensity: 0.25 }), 0.06, 0.16, 4.6, -0.30, LANE_Y + 0.1, -2.4);
    bank.visible = false;
    machine.add(bank);

    const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.07, Math.hypot(RAMP_LEN, RAMP_H)), woodMat);
    ramp.position.set(0, LANE_Y + RAMP_H * 0.5, (FLAT_END + RAMP_END) / 2);
    ramp.rotation.x = -RAMP_THETA;
    machine.add(ramp);
    const face = meshBox(darkWood, 0.95, 1.55, 0.12, 0, LANE_Y + 0.85, RAMP_END - 0.08);
    machine.add(face);
    const backstop = meshBox(brass, 0.7, 0.08, 0.08, 0, LANE_Y + RAMP_H + 0.12, RAMP_END + 0.02);
    machine.add(backstop);

    const holeRoot = new THREE.Group();
    machine.add(holeRoot);
    const holeMeshes = [];
    holeDefs(AUTHORED[0], 0).forEach((def) => {
      const hg = makeHoleGroup(def);
      holeRoot.add(hg);
      holeMeshes.push(hg);
    });

    const sheen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58, 6.2),
      new THREE.MeshBasicMaterial({ map: sheenTex(), transparent: true, opacity: 0, depthWrite: false })
    );
    sheen.rotation.x = -Math.PI / 2;
    sheen.position.set(0, LANE_Y + 0.034, -2.55);
    machine.add(sheen);

    const marquee = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.34, 0.06),
      new THREE.MeshBasicMaterial({ map: marqueeTex("SKEE-BALL") })
    );
    marquee.position.set(0, 2.55, RAMP_END + 0.1);
    machine.add(marquee);

    const trough = [];
    const troughGroup = new THREE.Group();
    troughGroup.position.set(0.58, LANE_Y - 0.02, 0.55);
    machine.add(troughGroup);
    troughGroup.add(meshBox(darkWood, 0.22, 0.08, 0.7, 0, -0.04, 0));
    for (let i = 0; i < 9; i += 1) {
      const b = makeBallMesh();
      b.position.set(0, BALL_R, -0.28 + i * 0.07);
      troughGroup.add(b);
      trough.push(b);
    }

    const liveBall = makeBallMesh();
    liveBall.position.set(TEE.x, TEE.y, TEE.z);
    scene.add(liveBall);
    const pullHint = new THREE.Group();
    const shaft = meshCyl(makeMat(0xf0d09a, { emissive: 0xf0d09a, emissiveIntensity: 0.7 }), 0.012, 0.012, 0.22, 0, 0, 0);
    shaft.rotation.x = Math.PI / 2;
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 8), makeMat(0xc41e3a, { emissive: 0xc41e3a, emissiveIntensity: 0.55 }));
    head.rotation.x = -Math.PI / 2;
    head.position.z = 0.16;
    pullHint.add(shaft, head);
    pullHint.position.set(TEE.x, TEE.y + 0.1, TEE.z + 0.22);
    scene.add(pullHint);
    const ghost = makeBallMesh();
    ghost.traverse((n) => {
      if (n.material) {
        n.material = n.material.clone();
        n.material.transparent = true;
        n.material.opacity = 0.35;
        n.material.depthWrite = false;
      }
    });
    ghost.visible = false;
    scene.add(ghost);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.06, 12),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);

    const arcGeo = new THREE.BufferGeometry();
    const arcPos = new Float32Array(24 * 3);
    arcGeo.setAttribute("position", new THREE.BufferAttribute(arcPos, 3));
    const arc = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: 0xf0d09a, transparent: true, opacity: 0.7 }));
    arc.visible = false;
    scene.add(arc);

    const lights = [];
    scene.add(new THREE.AmbientLight(0x6a4838, 1.05));
    scene.add(new THREE.HemisphereLight(0xe8c8a0, 0x2a100c, 0.85));
    const fill = new THREE.DirectionalLight(0xffd2a0, 0.85);
    fill.position.set(2.2, 4.4, 3.2);
    scene.add(fill);
    const spot = new THREE.SpotLight(0xffd090, 8.5, 18, 0.62, 0.45, 1.05);
    spot.position.set(0, 4.2, 1.2);
    spot.target.position.set(0, LANE_Y, -4);
    scene.add(spot, spot.target);
    const faceLight = new THREE.PointLight(0xffc878, 3.2, 8, 1.6);
    faceLight.position.set(0, 2.2, RAMP_END + 0.6);
    scene.add(faceLight);
    for (let i = 0; i < 10; i += 1) {
      const z = 1.2 - i * 1.15;
      const bulb = meshSphere(new THREE.MeshBasicMaterial({ color: 0xffe2a0 }), 0.045, (i % 2 ? -1.1 : 1.1), 3.15, z);
      const pl = new THREE.PointLight(0xffd090, 0.55, 3.4, 2);
      pl.position.copy(bulb.position);
      tent.add(bulb, pl);
      lights.push({ bulb, pl, phase: i * 0.7 });
    }

    const aura = makeAura();
    aura.position.set(-1.05, 0, 0.15);
    aura.rotation.y = 0.55;
    scene.add(aura);

    const prize = new THREE.Group();
    prize.position.set(1.35, 0.7, -1.2);
    prize.add(meshBox(darkWood, 0.7, 0.08, 0.4, 0, 0, 0));
    prize.add(meshSphere(makeMat(0xc45a3a), 0.12, 0, 0.22, 0));
    prize.add(meshSphere(makeMat(0xf0c4a8), 0.09, 0, 0.36, 0.02));
    scene.add(prize);

    const particles = [];
    const pMat = makeMat(0xf0d09a, { emissive: 0xf0d09a, emissiveIntensity: 0.8 });
    for (let i = 0; i < 28; i += 1) {
      const p = meshSphere(pMat, 0.018, 0, -10, 0);
      p.visible = false;
      scene.add(p);
      particles.push({ mesh: p, vx: 0, vy: 0, vz: 0, life: 0 });
    }

    const confetti = [];
    [0xc41e3a, 0xd4a45a, 0x1e6b3c, 0xf0d09a, 0x3d8a8a].forEach((col, i) => {
      for (let k = 0; k < 4; k += 1) {
        const m = meshBox(makeMat(col, { emissive: col, emissiveIntensity: 0.2 }), 0.04, 0.01, 0.06, 0, -10, 0);
        m.visible = false;
        scene.add(m);
        confetti.push({ mesh: m, vx: 0, vy: 0, vz: 0, life: 0, spin: 0 });
      }
    });

    return {
      renderer, scene, camera, clock, machine, lane, sheen, marquee, bank,
      gutterL, gutterR, holeMeshes, holeRoot, liveBall, ghost, shadow, arc, arcPos,
      trough, aura, lights, spot, faceLight, particles, confetti, railL, railR, pullHint,
      cam: { mode: "idle", punch: 0, look: new THREE.Vector3(0, 1.15, -3.6) },
      raf: 0, fitted: false, demo: null, demoCool: 0.6,
    };
  }

  function layoutHoles(spec, t) {
    if (!view) return;
    const defs = holeDefs(spec, t);
    view.holeMeshes.forEach((mesh, i) => {
      const def = defs[i];
      if (!def) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      const w = holeWorld(def);
      mesh.position.set(w.x, w.y, w.z);
      mesh.rotation.x = -RAMP_THETA;
      mesh.userData.def = def;
      if (mesh.userData.sprite && mesh.userData.sprite.material.map) {
        /* labels stay */
      }
    });
    if (defs.length < view.holeMeshes.length) {
      for (let i = defs.length; i < view.holeMeshes.length; i += 1) view.holeMeshes[i].visible = false;
    }
    while (defs.length > view.holeMeshes.length) {
      const hg = makeHoleGroup(defs[view.holeMeshes.length]);
      view.holeRoot.add(hg);
      view.holeMeshes.push(hg);
    }
    defs.forEach((def, i) => {
      const mesh = view.holeMeshes[i];
      if (!mesh) return;
      mesh.visible = true;
      const w = holeWorld(def);
      mesh.position.set(w.x, w.y, w.z);
      mesh.rotation.x = -RAMP_THETA;
      mesh.userData.def = def;
    });
  }

  function applyLane(spec) {
    if (!view || !spec) return;
    layoutHoles(spec, run ? run.t : idleT);
    view.bank.visible = !!spec.bankRail;
    const gut = !!spec.gutter;
    view.gutterL.material.emissive = new THREE.Color(gut ? 0xc45a7a : 0x000000);
    view.gutterR.material.emissive = new THREE.Color(gut ? 0xc45a7a : 0x000000);
    view.gutterL.material.emissiveIntensity = gut ? 0.45 : 0;
    view.gutterR.material.emissiveIntensity = gut ? 0.45 : 0;
    const map = marqueeTex(String(spec.name || "SKEE-BALL").toUpperCase().slice(0, 18));
    if (view.marquee.material.map) view.marquee.material.map.dispose();
    view.marquee.material.map = map;
    view.marquee.material.needsUpdate = true;
    const gold = goldBand(spec);
    const bar = el("skeePowerGold");
    if (bar) {
      bar.style.bottom = (gold.lo * 100).toFixed(1) + "%";
      bar.style.height = ((gold.hi - gold.lo) * 100).toFixed(1) + "%";
    }
    setText("skeeCheat", cheatLabel(spec));
    setText("skeeBoardNeed", "/ " + (spec.target || 100));
  }

  function burst(x, y, z, n, col) {
    if (!view) return;
    let used = 0;
    view.particles.forEach((p) => {
      if (used >= n || p.life > 0) return;
      p.life = 0.45 + Math.random() * 0.35;
      p.vx = (Math.random() - 0.5) * 1.8;
      p.vy = 1.2 + Math.random() * 1.6;
      p.vz = (Math.random() - 0.5) * 1.8;
      p.mesh.visible = true;
      p.mesh.position.set(x, y, z);
      if (p.mesh.material && col) p.mesh.material.color.setHex(col);
      used += 1;
    });
  }

  function throwConfetti() {
    if (!view) return;
    view.confetti.forEach((c) => {
      c.life = 0.9 + Math.random() * 0.6;
      c.vx = (Math.random() - 0.5) * 2.4;
      c.vy = 2.2 + Math.random() * 2.2;
      c.vz = -0.4 + Math.random() * 1.2;
      c.spin = (Math.random() - 0.5) * 8;
      c.mesh.visible = true;
      c.mesh.position.set((Math.random() - 0.5) * 0.6, 1.8, RAMP_END + 0.4);
    });
  }

  /* ---------- physics ---------- */
  function makeBallState() {
    return {
      x: TEE.x, y: TEE.y, z: TEE.z,
      vx: 0, vy: 0, vz: 0,
      phase: "roll",
      along: 0,
      banked: false,
      waxVeer: false,
      spin: 0,
      age: 0,
      hole: null,
      drop: 0,
    };
  }

  function throwSpeed(power, spec, mul) {
    const p = spec && spec.invertPower ? 1 - power : power;
    const spd = (4.35 + clamp(p, 0, 1) * 7.15) * (mul == null ? 1 : mul);
    return spd;
  }

  function aimVel(power, aim, spec, mul) {
    const p = spec && spec.invertPower ? 1 - power : power;
    const spd = throwSpeed(power, spec, mul);
    return {
      vx: clamp(aim, -1, 1) * (0.28 + p * 0.50),
      vy: 0,
      vz: -spd,
    };
  }

  function stepBall(b, spec, dt, t) {
    const events = [];
    b.age += dt;
    if (b.phase === "hole") {
      b.drop += dt;
      b.y -= 0.55 * dt;
      b.vy = 0;
      if (b.drop > 0.42) {
        events.push({ type: "scored", v: b.hole ? b.hole.v : 0, hole: b.hole, banked: b.banked });
        b.phase = "done";
      }
      return events;
    }
    if (b.phase === "dead") {
      b.y += b.vy * dt;
      b.vy -= GRAVITY * dt;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      if (b.y < LANE_Y - 0.3 || b.age > 2.4) {
        events.push({ type: "miss", banked: b.banked, gutter: !!b.gutter });
        b.phase = "done";
      }
      return events;
    }
    if (b.phase === "done") return events;

    const wax = b.honest ? 1 : waxMul();
    let fric = LANE_FRIC;
    if (!b.honest && run && run.waxOn) fric = wax > 1 ? 0.14 : 0.95;
    if (spec && spec.crown && b.phase === "roll") b.vx += (0 - b.x) * 1.05 * dt;

    if (b.phase === "roll") {
      b.vx *= Math.max(0, 1 - fric * 1.25 * dt);
      b.vz *= Math.max(0, 1 - fric * dt);
      if (spec && spec.gutter && !b.banked) {
        if (Math.abs(b.x) > 0.09) b.vx += Math.sign(b.x) * (Math.abs(b.x) - 0.09) * 8.4 * dt;
      }
      if (spec && spec.bankRail && b.x < -LANE_HALF + 0.06 && b.vx < 0) {
        b.x = -LANE_HALF + 0.06;
        b.vx = Math.abs(b.vx) * 0.9;
        if (!b.banked) {
          b.banked = true;
          events.push({ type: "bank" });
        }
      }
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.y = LANE_Y + BALL_R;
      b.spin += Math.abs(b.vz) * 18 * dt;
      if (Math.abs(b.x) > LANE_HALF + 0.015) {
        b.phase = "dead";
        b.gutter = true;
        b.vy = 0.2;
        b.vz *= 0.4;
        events.push({ type: "gutter" });
        return events;
      }
      if (!b.honest && run && run.waxOn && !b.waxVeer && b.z < -1.8 && b.z > -3.6) {
        b.waxVeer = true;
        b.vz *= wax > 1 ? 1.10 : 0.82;
        b.vx += (Math.random() - 0.5) * 0.18;
        events.push({ type: "waxveer" });
      }
      if (b.z <= FLAT_END) {
        b.phase = "ramp";
        b.along = Math.abs(b.vz) * Math.cos(RAMP_THETA);
      }
    } else if (b.phase === "ramp") {
      b.along += -GRAVITY * Math.sin(RAMP_THETA) * dt;
      b.along *= Math.max(0, 1 - RAMP_FRIC * dt);
      const dirY = Math.sin(RAMP_THETA);
      const dirZ = -Math.cos(RAMP_THETA);
      b.x += b.vx * 0.8 * dt;
      b.y += dirY * b.along * dt;
      b.z += dirZ * b.along * dt;
      b.spin += Math.abs(b.along) * 14 * dt;
      if (spec && spec.gutter && !b.banked && Math.abs(b.x) > 0.14) {
        b.vx += Math.sign(b.x) * 2.4 * dt;
      }
      if (spec && spec.bankRail && b.x < -0.28 && b.vx < 0) {
        b.vx = Math.abs(b.vx) * 0.82;
        b.x = -0.28;
        if (!b.banked) { b.banked = true; events.push({ type: "bank" }); }
      }
      const u = clamp((FLAT_END - b.z) / RAMP_LEN, -0.05, 1.12);
      const surfaceY = LANE_Y + clamp(u, 0, 1) * RAMP_H + BALL_R * 0.85;
      if (b.y < surfaceY) b.y = surfaceY;
      if (Math.abs(b.x) > 0.36) {
        b.phase = "dead";
        b.gutter = true;
        b.vy = -0.2;
        events.push({ type: "gutter" });
        return events;
      }
      const holes = holeDefs(spec, t).slice().sort((a, c) => c.u - a.u);
      for (let i = 0; i < holes.length; i += 1) {
        const h = holes[i];
        const w = holeWorld(h);
        const d = Math.hypot(b.x - w.x, (b.y - w.y) * 0.85, b.z - w.z);
        const skip = h.skip != null ? h.skip : 5.4;
        if (d < h.r * 0.95 && Math.abs(b.along) < skip) {
          b.phase = "hole";
          b.hole = h;
          b.drop = 0;
          b.x = w.x;
          b.z = w.z;
          events.push({ type: "hole", v: h.v, hole: h });
          return events;
        }
      }
      if (u >= 0.985 && b.along > 0) {
        b.along *= -0.40;
        b.y = LANE_Y + RAMP_H + BALL_R;
        events.push({ type: "backstop" });
      }
      if (Math.abs(b.along) < 0.12 && u < 0.12) {
        b.phase = "dead";
        b.vy = -0.4;
        events.push({ type: "short" });
      }
      if (b.along < -0.02 && u <= 0) {
        b.phase = "dead";
        b.vy = 0.1;
        events.push({ type: "short" });
      }
    }
    return events;
  }

  function predict(power, aim, spec, mul) {
    const b = makeBallState();
    b.honest = true;
    const v = aimVel(power, aim, spec, mul);
    b.vx = v.vx; b.vy = v.vy; b.vz = v.vz;
    const pts = [];
    const fakeT = (run ? run.t : idleT);
    for (let i = 0; i < 200; i += 1) {
      const ev = stepBall(b, spec, 1 / 60, fakeT + i * 16);
      if (i % 8 === 0) pts.push({ x: b.x, y: b.y, z: b.z });
      if (ev.some((e) => e.type === "scored" || e.type === "miss" || e.type === "hole" || e.type === "gutter")) {
        pts.push({ x: b.x, y: b.y, z: b.z, hole: b.hole, gutter: b.gutter, v: b.hole && b.hole.v });
        break;
      }
    }
    return { pts, hole: b.hole, gutter: b.gutter, x: b.x, y: b.y, z: b.z };
  }

  /* ---------- camera / juice ---------- */
  function setAuraMood(mood) {
    if (!view || !view.aura) return;
    view.aura.userData.mood = mood;
    view.aura.userData.moodT = 0.7;
  }

  function say(line) {
    setText("skeeAuraLine", line);
    if (view && view.aura) view.aura.visible = true;
  }

  function popScore(val, kind) {
    const node = el("skeePopup");
    if (!node) return;
    node.hidden = false;
    node.textContent = val ? "+" + val : "GUTTER";
    node.classList.toggle("is-miss", !val);
    node.classList.toggle("is-fifty", val >= 50);
    clearTimeout(popScore._t);
    popScore._t = setTimeout(() => { node.hidden = true; }, 680);
  }

  function updateCamera(dt) {
    if (!view) return;
    const cam = view.camera;
    const c = view.cam;
    const t = run ? run.t * 0.001 : idleT * 0.001;
    let tx = 0.0, ty = 1.42, tz = 1.55;
    let lx = 0, ly = 1.12, lz = -3.6;
    if (!isLive() && !(run && run.dying)) {
      tx = 0.55 + Math.sin(t * 0.28) * 0.85;
      ty = 1.55 + Math.sin(t * 0.18) * 0.1;
      tz = 1.85 + Math.cos(t * 0.22) * 0.35;
      lx = 0; ly = 1.18; lz = -4.4;
    } else if (run && run.ball && run.ball.phase !== "hole" && run.ball.phase !== "done") {
      const b = run.ball;
      tx = b.x * 0.62;
      ty = Math.max(1.28, b.y + 0.72);
      tz = Math.min(1.7, b.z + 1.35);
      lx = b.x * 0.45; ly = b.y + 0.12; lz = b.z - 1.1;
    } else if (run && run.aim) {
      tx = run.aim.aim * 0.22;
      ty = 1.32;
      tz = 1.48 + run.aim.power * 0.42;
      lx = run.aim.aim * 0.35; ly = 1.05; lz = -3.8;
    } else {
      tx = 0.0; ty = 1.34; tz = 1.48;
      lx = 0; ly = 1.08; lz = -4.0;
    }
    if (c.punch > 0) {
      c.punch -= dt;
      ty += 0.08;
      tz -= 0.12;
    }
    const k = reduced ? 1 : 1 - Math.pow(0.001, dt);
    cam.position.x = lerp(cam.position.x, tx, k);
    cam.position.y = lerp(cam.position.y, ty, k);
    cam.position.z = lerp(cam.position.z, tz, k);
    c.look.x = lerp(c.look.x, lx, k);
    c.look.y = lerp(c.look.y, ly, k);
    c.look.z = lerp(c.look.z, lz, k);
    cam.lookAt(c.look);
    if (run && run.shake) {
      cam.position.x += (Math.random() - 0.5) * run.shake * 0.012;
      cam.position.y += (Math.random() - 0.5) * run.shake * 0.008;
      run.shake *= 0.84;
      if (run.shake < 0.04) run.shake = 0;
    }
  }

  function animateAura(dt) {
    if (!view) return;
    const a = view.aura.userData;
    a.moodT = Math.max(0, a.moodT - dt);
    const t = (run ? run.t : idleT) * 0.001;
    a.hip.rotation.y = Math.sin(t * 1.4) * 0.04;
    a.head.rotation.y = Math.sin(t * 1.1) * 0.08;
    if (a.mood === "cheer" && a.moodT > 0) {
      a.armL.rotation.x = -1.4;
      a.armR.rotation.x = -1.5;
      a.armL.rotation.z = 0.2;
      a.armR.rotation.z = -0.2;
    } else if (a.mood === "laugh" && a.moodT > 0) {
      a.head.rotation.z = Math.sin(t * 12) * 0.12;
      a.armR.rotation.x = -0.6;
    } else {
      a.armL.rotation.x = Math.sin(t * 2.1) * 0.08;
      a.armR.rotation.x = -0.45 + Math.sin(t * 1.7) * 0.06;
      a.armL.rotation.z = 0.32;
      a.armR.rotation.z = -0.55;
      a.head.rotation.z = 0;
      if (!isLive()) {
        a.armL.rotation.z = 0.2 + Math.sin(t * 2.6) * 0.5;
        a.armL.rotation.x = -0.2 + Math.sin(t * 2.6) * 0.4;
      }
    }
  }

  function fit() {
    if (!view) return false;
    const host = card() || document.getElementById("cabinet-skee-ball") || el("skeeCanvas");
    if (!host) return false;
    const w = Math.max(0, (host.clientWidth || window.innerWidth) | 0);
    const h = Math.max(0, (host.clientHeight || window.innerHeight) | 0);
    if (w < 32 || h < 32) {
      view.fitted = false;
      return false;
    }
    const bufW = Math.round(w * view.renderer.getPixelRatio());
    const bufH = Math.round(h * view.renderer.getPixelRatio());
    if (view.renderer.domElement.width !== bufW || view.renderer.domElement.height !== bufH) {
      view.renderer.setSize(w, h, false);
      view.camera.aspect = w / h;
      view.camera.updateProjectionMatrix();
    }
    view.fitted = true;
    return true;
  }

  function syncBallMesh(b, mesh) {
    if (!b || !mesh) return;
    mesh.visible = true;
    mesh.position.set(b.x, b.y, b.z);
    mesh.rotation.x = b.spin;
    mesh.rotation.z = b.x * 2;
    if (view.shadow) {
      view.shadow.visible = b.phase !== "hole";
      view.shadow.position.set(b.x, LANE_Y + 0.011, b.z);
      const sc = b.phase === "ramp" || b.phase === "dead" ? 0.7 : 1;
      view.shadow.scale.setScalar(sc);
    }
  }

  function updateArc(pts, wax) {
    if (!view) return;
    const arr = view.arcPos;
    for (let i = 0; i < 24; i += 1) {
      const p = pts[Math.min(pts.length - 1, i)] || pts[pts.length - 1] || TEE;
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    }
    view.arc.geometry.attributes.position.needsUpdate = true;
    view.arc.material.color.setHex(wax ? 0xe8a0b8 : 0xf0d09a);
    view.arc.visible = pts.length > 2;
  }

  /* ---------- run flow ---------- */
  function stampDepthCopy() {
    const host = card();
    if (!host) return;
    const num = host.querySelector(".machine-number");
    if (num) num.textContent = DEPTH_COPY.machine;
    host.querySelectorAll("[data-pf-depth-copy]").forEach((p) => { p.textContent = DEPTH_COPY.body; });
    ensureHud();
    paintPips();
    const canvas = el("skeeCanvas");
    if (canvas) canvas.classList.toggle("is-locked", !isLive());
    if (!isLive() && (!run || run.done)) setText("skeeStatus", DEPTH_COPY.status);
    const hud = el("skeeHud");
    if (hud) hud.hidden = !(isLive() || (run && run.dying));
  }

  function punchStart() {
    stampDepthCopy();
    setText("skeeStatus", DEPTH_COPY.punch);
    const btn = el("skeeStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function setPowerUi(power, holding, spec) {
    const wrap = el("skeePowerWrap");
    const fill = el("skeePowerFill");
    if (!wrap || !fill) return;
    wrap.hidden = !(isLive() || holding);
    const gold = goldBand(spec);
    const p = clamp(power, 0, 1);
    fill.style.height = (p * 100).toFixed(1) + "%";
    wrap.classList.toggle("is-gold", p >= gold.lo && p <= gold.hi);
    wrap.classList.toggle("is-lie", !!(run && run.waxOn));
  }

  function startStage(n) {
    const spec = skeeStageParams(n);
    if (!spec) return false;
    run.stage = n;
    run.spec = spec;
    run.stagePts = 0;
    run.ballsLeft = spec.balls || BALLS;
    run.ball = null;
    run.aim = null;
    run.pause = 0;
    run.waxOn = false;
    run.waxMul = 1;
    run.waxSkidNext = false;
    run.waxArmed = !!spec.waxLies;
    run.waxFlipAt = spec.waxLies ? ((spec.kind === "comboFinale" || spec.coda) ? 7 : 6) : -1;
    run.bankStamps = 0;
    run.t = 0;
    applyLane(spec);
    paintPips();
    setText("skeeBoardPts", "0");
    setText("skeeBoardNeed", "/ " + spec.target);
    setText("skeeCheat", cheatLabel(spec));
    setText("skeeHint", spec.invertPower ? "REVERSE · HOLD · release EARLY for a long sling" : "HOLD one thumb · release in GOLD");
    say(spec.barker.indexOf("Aura") === 0 ? spec.barker : "Aura: " + spec.barker);
    setText("skeeStatus", spec.barker);
    tellDepth(run.depth);
    ensureHud();
    const hud = el("skeeHud");
    if (hud) hud.hidden = false;
    return true;
  }

  function maybeWax() {
    if (!run || !run.waxArmed) return;
    if (run.waxOn) {
      if (run.ballsLeft === 3 && run.spec && (run.spec.kind === "comboFinale" || run.spec.coda)) {
        run.waxMul = run.waxMul > 1 ? 0.84 : 1.18;
        run.waxSkidNext = true;
        setText("skeeCheat", run.waxMul > 1 ? "SHEEN FLIPPED FAST — GHOST ≠ LAND" : "SHEEN FLIPPED SLOW — GHOST ≠ LAND");
        setText("skeeStatus", "Sheen flipped again. Ghost still lies.");
        say("Aura: Sheen flipped. The ghost is not the land.");
        PF.setAura("laugh");
      }
      return;
    }
    if (run.waxFlipAt < 0 || run.ballsLeft > run.waxFlipAt) return;
    run.waxOn = true;
    run.waxMul = 1.18;
    run.waxSkidNext = true;
    setText("skeeCheat", "SHEEN SKIDS THE NEXT BALL LONG — GHOST ≠ LAND");
    setText("skeeHint", "WAX LIE · ghost is not the land");
    setText("skeeStatus", "Sheen just hit. Next ball SKIDS LONG. Ghost is not the land.");
    say("Aura: Sheen mid-lane. Ghost is not the land.");
    PF.setAura("laugh");
    setAuraMood("laugh");
    if (view && view.sheen) view.sheen.material.opacity = 0.72;
    kit.sfx("flip");
    run.shake = 5;
  }

  function bankClear() {
    return !!(run.spec && run.spec.bankRail && run.bankStamps >= (run.spec.bankNeed || 2));
  }

  function onScored(val, meta) {
    if (!isLive()) return;
    run.stagePts += val;
    run.score += val;
    if (run.kitRun) run.kitRun.score = run.score;
    if (meta && meta.banked) run.bankStamps = (run.bankStamps | 0) + 1;
    run.ball = null;
    run.pause = 0.28;
    setText("skeeBoardPts", String(run.stagePts));
    setText("skeeNightScore", String(run.score));
    setText("depthSkeeScore", String(run.score));
    popScore(val, val >= 50 ? "fifty" : val ? "hit" : "miss");
    kit.sfx(val >= 50 || (meta && meta.banked) ? "rack" : val > 0 ? "sink" : "miss");
    if (val >= 50) {
      setAuraMood("cheer");
      PF.setAura("celebrate");
      say(AURA.fifty);
      if (view && view.cam) view.cam.punch = 0.28;
      run.shake = 7;
    } else if (!val) {
      setAuraMood("laugh");
      PF.setAura("laugh");
    } else {
      PF.setAura("point");
    }
    let note;
    if (meta && meta.banked) note = `BANK STAMP ${run.bankStamps}/${run.spec.bankNeed || 2}${val ? " · " + val : ""}. Board ${run.stagePts}/${run.spec.target} · ${run.ballsLeft} left`;
    else if (val) note = `${val}! Board ${run.stagePts}/${run.spec.target} · ${run.ballsLeft} left`;
    else if (meta && meta.gutter) note = `Gutter whispered it out. Board ${run.stagePts}/${run.spec.target} · ${run.ballsLeft} left`;
    else note = `Short of the holes. Board ${run.stagePts}/${run.spec.target} · ${run.ballsLeft} left`;
    const need = Math.max(0, (run.spec.target | 0) - (run.stagePts | 0));
    if (!note) note = `Board ${run.stagePts}/${run.spec.target} · ${run.ballsLeft} left`;
    if (need > 0 && run.ballsLeft > 0) note += ` · NEED ${need}`;
    setText("skeeStatus", note);
    maybeWax();
    if (run.stagePts >= run.spec.target || bankClear()) clearStage();
    else if (run.ballsLeft <= 0) finish("under_target");
  }

  function clearStage() {
    run.bestStagePts = Math.max(run.bestStagePts, run.stagePts);
    run.score += CLEAR_BONUS;
    run.depth += 1;
    if (run.kitRun) {
      run.kitRun.depth = run.depth;
      run.kitRun.score = run.score;
    }
    tellDepth(run.depth);
    kit.sfx("chapter");
    PF.setAura("celebrate");
    setAuraMood("cheer");
    throwConfetti();
    say(run.depth >= 6 ? AURA.deep(run.depth) : AURA.clear);
    const next = skeeStageParams(run.depth + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    setText("skeeStatus", `${AURA.clear} ${next.title} — need ${next.target}.`);
    startStage(run.depth + 1);
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (depth <= 0) return AURA.shallow;
    if (rk() && typeof rk().auraDeathLine === "function") {
      const line = rk().auraDeathLine(GAME_ID, depth, reason || "under_target");
      if (line) return `Aura: ${String(line).replace(/^Aura:\s*/i, "")}`;
    }
    if (depth >= 6) return AURA.deep(depth);
    if (depth > 0) return AURA.board(depth);
    return AURA.under_target;
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave" || reason === "souvenir") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.aim = null;
    run.deathNote = reason || "under_target";
    run.deathHold = DEATH_HOLD_MS;
    kit.sfx("stamp");
    run.shake = 8;
    const stamp = el("skeeStamp");
    if (stamp) stamp.hidden = false;
    const need = Math.max(0, ((run.spec && run.spec.target) || 0) - (run.stagePts | 0));
    setText("skeeHint", "UNDER TARGET · WAX");
    setText("skeeStatus", need ? `Under target by ${need}. Nine balls, board still hungry.` : "Board stamped WAX.");
    say(auraLine(reason, run.depth));
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    run.closedStamp = reason !== "leave" && reason !== "souvenir";
    run.bestStagePts = Math.max(run.bestStagePts, run.stagePts);
    const depth = run.depth;
    const score = run.score;
    const death = reason === "leave" ? "leave" : reason === "souvenir" ? "souvenir" : "under_target";
    persistDepth({
      depth, score, deathReason: death, cashedOut: reason === "souvenir",
      meta: { stage: run.spec && run.spec.id, bestStagePts: run.bestStagePts, stagePts: run.stagePts, kind: run.spec && run.spec.kind, coda: !!(run.spec && run.spec.coda) },
    });
    stampDepthCopy();
    const startBtn = el("skeeStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "ROLL AGAIN · 1 demo coin";
    }
    PF.focusCard("skeeCard", false);
    kit.setMode(card(), "result");
    const line = `LANE ${depth} · SCORE ${score}`;
    const aura = auraLine(reason, depth);
    const challenge = challengeLine(depth);
    const verdict = el("skeeVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = reason === "leave" ? `Left the alley · ${line}` : reason === "souvenir" ? `Souvenir. ${line}.` : `Under target. ${line}.`;
    }
    kit.fillResult({
      root: "skeeResult", depth: "skeeResultDepth", score: "skeeResultScore", aura: "skeeResultAura", copied: "skeeCopied",
    }, {
      depthLine: `LANE ${depth}`,
      scoreLine: `SCORE ${score} · BOARD ${run.bestStagePts | 0} · ${death.replace(/_/g, " ").toUpperCase()}`,
      auraLine: aura,
    });
    const reasonNode = el("skeeResultReason");
    if (reasonNode) reasonNode.textContent = death.replace(/_/g, " ").toUpperCase();
    setText("skeeChallengeText", challenge);
    PF.setTier("skeeTier", depth > 0 ? `LANE ${depth}` : "WAX", depth > 0 || reason === "souvenir" ? "perfect" : "miss");
    setText("skeeStatus", reason === "leave" ? "Left the alley." : reason === "souvenir" ? "Board tipped its hat." : "Board stamped WAX.");
    say(aura);
    if (depth > 0 || reason === "souvenir") {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Skee-Ball");
      PF.setAura(depth >= 4 || reason === "souvenir" ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, reason === "souvenir" ? "SOUVENIR" : `LANE ${depth}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Skee miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "WAX", aura);
    }
    PF.refreshNightBoard();
    const hud = el("skeeHud");
    if (hud) hud.hidden = true;
    el("skeePowerWrap") && (el("skeePowerWrap").hidden = true);
  }

  function start() {
    if (isLive() || (run && run.dying)) return;
    ensureWorld();
    const ctx = beginKitRun();
    if (!ctx) {
      setText("skeeStatus", "Need a demo coin for the lane.");
      return;
    }
    const stamp = el("skeeStamp");
    if (stamp) stamp.hidden = true;
    kit.hideResult("skeeResult");
    const verdict = el("skeeVerdict");
    if (verdict) verdict.hidden = true;
    run = {
      kitRun: ctx,
      done: false,
      dying: false,
      depth: 0,
      score: 0,
      stage: 1,
      stagePts: 0,
      bestStagePts: 0,
      ballsLeft: BALLS,
      ball: null,
      aim: null,
      pause: 0,
      t: 0,
      shake: 0,
      deathHold: 0,
      spec: null,
    };
    kit.setMode(card(), "play");
    const startBtn = el("skeeStart");
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.textContent = "ROLLING";
    }
    run.sling = mountSling(ctx);
    if (view) { view.demo = null; view.demoCool = 9; if (view.pullHint) view.pullHint.visible = true; }
    startStage(1);
    stampDepthCopy();
    setText("skeeNightScore", "0");
    setText("skeeHint", "HOLD one thumb · RELEASE in GOLD");
    say(AURA.roll);
    PF.setAura("point");
    kit.sfx("sling");
  }

  function beginAim(nx, ny) {
    if (!isLive() || run.ball || run.pause > 0) return;
    if (run.ballsLeft <= 0) return;
    run.aim = {
      power: 0,
      aim: clamp((nx - 0.5) * 1.85, -1, 1),
      needle: 0,
      dir: 1,
      sling: true,
      fromKey: false,
    };
    pointer.sx = nx;
    pointer.sy = ny;
    const canvas = el("skeeCanvas");
    if (canvas) canvas.classList.add("is-pulling");
    if (run.sling && typeof run.sling.beginPull === "function") {
      run.sling.beginPull(nx, ny);
    }
    setText("skeeHint", run.spec && run.spec.invertPower ? "REVERSE · release EARLY" : "HOLD · release in GOLD");
  }

  function updateAimFromPointer(nx, ny) {
    if (!run || !run.aim) return;
    run.aim.aim = clamp((nx - 0.5) * 1.85, -1, 1);
    if (run.sling && typeof run.sling.movePull === "function") run.sling.movePull(nx, ny);
  }

  function releaseAim() {
    const canvas = el("skeeCanvas");
    if (canvas) canvas.classList.remove("is-pulling");
    if (!run || !run.aim || run.done || run.dying || run.ball) {
      if (run) run.aim = null;
      setPowerUi(0, false, liveSpec());
      return;
    }
    const shown = run.aim.power;
    if (shown < 0.08) {
      run.aim = null;
      setPowerUi(0, false, liveSpec());
      if (run.sling && typeof run.sling.release === "function") run.sling.release();
      setText("skeeStatus", "Hold the sling — release in the gold band for 50.");
      setText("skeeHint", "HOLD one thumb · RELEASE in GOLD");
      return;
    }
    if (run.sling && typeof run.sling.release === "function") run.sling.release();
    const skid = run.waxSkidNext;
    const mul = skid ? 1.18 : waxMul();
    if (skid) run.waxSkidNext = false;
    const v = aimVel(shown, run.aim.aim, run.spec, mul);
    run.ballsLeft -= 1;
    paintPips();
    const b = makeBallState();
    b.vx = v.vx; b.vy = v.vy; b.vz = v.vz;
    b.skid = skid;
    run.ball = b;
    run.aim = null;
    setPowerUi(0, false, run.spec);
    if (view) {
      view.arc.visible = false;
      view.ghost.visible = false;
    }
    kit.sfx("throw");
    const gold = goldBand(run.spec);
    const inGold = shown >= gold.lo && shown <= gold.hi;
    setText("skeeStatus", skid
      ? "Sheen skid — this one runs LONG. Ghost lied."
      : run.waxOn
        ? "Wax under the roll — ghost is not the land."
        : inGold ? "Gold sling. Ball’s up the lane." : "Off the gold. Ball’s up the lane.");
  }

  function handleEvents(evs) {
    evs.forEach((e) => {
      if (e.type === "bank") {
        kit.sfx("bumper");
        run.shake = 4;
        setText("skeeStatus", "Banked off the left rail.");
      } else if (e.type === "waxveer") {
        kit.sfx("flip");
        run.shake = 5;
        setText("skeeStatus", "Wax veered the roll — sheen lied mid-lane.");
        say("Aura: Sheen lied mid-lane.");
        PF.setAura("laugh");
        setAuraMood("laugh");
      } else if (e.type === "gutter") {
        kit.sfx("pit");
        say(AURA.gutter);
        setAuraMood("laugh");
      } else if (e.type === "backstop") {
        kit.sfx("bumper");
        run.shake = 3;
      } else if (e.type === "hole") {
        burst(run.ball.x, run.ball.y, run.ball.z, e.v >= 50 ? 18 : 8, e.v >= 50 ? 0xf0d09a : 0xc41e3a);
        view.holeMeshes.forEach((m) => {
          if (m.userData.def && m.userData.def.id === (e.hole && e.hole.id) && m.userData.rim) {
            m.userData.rim.material.emissiveIntensity = 1.4;
          }
        });
      } else if (e.type === "scored") {
        onScored(e.v || 0, { banked: e.banked, hole: e.hole });
      } else if (e.type === "miss") {
        onScored(0, { banked: e.banked, gutter: e.gutter });
      }
    });
  }

  function tick(dt) {
    idleT += dt * 1000;
    if (view) {
      view.lights.forEach((L) => {
        const pulse = 0.42 + Math.sin(idleT * 0.004 + L.phase) * 0.18;
        L.pl.intensity = pulse;
      });
      if (view.sheen) {
        const wax = !!(run && run.waxOn);
        view.sheen.material.opacity = wax ? 0.48 + Math.sin(idleT * 0.004) * 0.16 : 0.05;
        view.sheen.material.map.offset.x = (idleT * 0.00018) % 1;
      }
      view.holeMeshes.forEach((m) => {
        if (m.userData.rim && m.userData.rim.material.emissiveIntensity > 0.25) {
          m.userData.rim.material.emissiveIntensity = Math.max(0.25, m.userData.rim.material.emissiveIntensity - dt * 1.8);
        }
      });
      view.particles.forEach((p) => {
        if (p.life <= 0) { p.mesh.visible = false; return; }
        p.life -= dt;
        p.vy -= 6 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
      });
      view.confetti.forEach((c) => {
        if (c.life <= 0) { c.mesh.visible = false; return; }
        c.life -= dt;
        c.vy -= 8 * dt;
        c.mesh.position.x += c.vx * dt;
        c.mesh.position.y += c.vy * dt;
        c.mesh.position.z += c.vz * dt;
        c.mesh.rotation.z += c.spin * dt;
      });
    }
    const spec = liveSpec();
    if (spec && (spec.movingFifty || spec.kind === "movingFifty" || spec.kind === "comboFinale" || spec.coda)) {
      layoutHoles(spec, run ? run.t : idleT);
    }
    if (!run || run.done) {
      if (!run) {
        const cycle = 4200;
        idleRoom = (Math.floor(idleT / cycle) % AUTHORED_COUNT) + 1;
        if (view && Math.floor(idleT / cycle) !== Math.floor((idleT - dt * 1000) / cycle)) applyLane(skeeStageParams(idleRoom));
      }
      if (view && view.pullHint) {
        view.pullHint.visible = !view.demo;
        view.pullHint.position.z = TEE.z + 0.18 + Math.sin(idleT * 0.004) * 0.08;
      }
      if (view) {
        view.demoCool = (view.demoCool || 0) - dt;
        if (!view.demo && view.demoCool <= 0) {
          const spec = liveSpec();
          const b = makeBallState();
          b.honest = true;
          const v = aimVel(0.72 + Math.random() * 0.12, (Math.random() - 0.5) * 0.35, spec, 1);
          b.vx = v.vx; b.vy = v.vy; b.vz = v.vz;
          view.demo = b;
        }
        if (view.demo) {
          const spec = liveSpec();
          const evs = stepBall(view.demo, spec, dt, idleT);
          syncBallMesh(view.demo, view.liveBall);
          if (evs.some((e) => e.type === "scored" || e.type === "miss" || e.type === "gutter") || view.demo.phase === "done") {
            view.demo = null;
            view.demoCool = 1.15;
            view.liveBall.position.set(TEE.x, TEE.y, TEE.z);
          }
        } else {
          view.liveBall.position.set(TEE.x, TEE.y, TEE.z);
          view.liveBall.rotation.x = idleT * 0.002;
          if (view.shadow) view.shadow.position.set(TEE.x, LANE_Y + 0.011, TEE.z);
        }
      }
      return;
    }
    if (view && view.pullHint) view.pullHint.visible = !run.ball;
    run.t += dt * 1000;
    if (run.dying) {
      run.deathHold -= dt * 1000;
      if (run.deathHold <= 0) sealResult(run.deathNote || "under_target");
      return;
    }
    if (run.aim) {
      const spd = (run.spec && run.spec.needleSpeed) || 0.95;
      run.aim.needle += run.aim.dir * spd * dt;
      if (run.aim.needle >= 1) { run.aim.needle = 1; run.aim.dir = -1; }
      else if (run.aim.needle <= 0) { run.aim.needle = 0; run.aim.dir = 1; }
      run.aim.power = run.aim.needle;
      if (keys.a) run.aim.aim = clamp(run.aim.aim - 1.6 * dt, -1, 1);
      if (keys.d) run.aim.aim = clamp(run.aim.aim + 1.6 * dt, -1, 1);
      setPowerUi(run.aim.power, true, run.spec);
      const pred = predict(run.aim.power, run.aim.aim, run.spec, 1);
      updateArc(pred.pts, !!(run.waxOn || run.waxSkidNext));
      if (view && view.ghost) {
        view.ghost.visible = true;
        const last = pred.pts[pred.pts.length - 1] || TEE;
        view.ghost.position.set(last.x, last.y, last.z);
      }
      if (view) {
        view.liveBall.position.set(
          TEE.x + run.aim.aim * 0.1,
          TEE.y + Math.sin(run.aim.needle * Math.PI) * 0.025,
          TEE.z
        );
        view.liveBall.rotation.x = run.aim.needle * 0.4;
      }
    } else {
      setPowerUi(0, false, run.spec);
      if (view) {
        view.arc.visible = false;
        view.ghost.visible = false;
      }
    }
    if (run.pause > 0) {
      run.pause -= dt;
      if (!run.ball && view) {
        view.liveBall.position.set(TEE.x, TEE.y, TEE.z);
      }
      return;
    }
    if (run.ball) {
      const evs = stepBall(run.ball, run.spec, dt, run.t);
      syncBallMesh(run.ball, view && view.liveBall);
      handleEvents(evs);
    } else if (view) {
      view.liveBall.position.set(TEE.x, TEE.y, TEE.z);
      view.liveBall.rotation.x = 0;
      if (view.shadow) view.shadow.position.set(TEE.x, LANE_Y + 0.011, TEE.z);
    }
  }

  function loop() {
    if (!view) return;
    if (!cabinetOn()) {
      view.raf = 0;
      return;
    }
    view.raf = requestAnimationFrame(loop);
    if (!view.fitted) fit();
    const dt = Math.min(0.033, view.clock.getDelta());
    tick(dt);
    updateCamera(dt);
    animateAura(dt);
    view.renderer.render(view.scene, view.camera);
  }

  function stopLoop() {
    if (view && view.raf) {
      cancelAnimationFrame(view.raf);
      view.raf = 0;
    }
  }

  function startLoop() {
    if (!view) return;
    if (!view.raf) {
      view.clock.getDelta();
      loop();
    }
  }

  function ensureWorld() {
    ensureCss();
    reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const canvas = el("skeeCanvas");
    if (!canvas) return null;
    if (view) {
      fit();
      startLoop();
      return view;
    }
    try {
      view = buildWorld(canvas);
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      setText("skeeStatus", /webgl|context/i.test(msg)
        ? "This tent wants WebGL. The wax will wait."
        : "Lane hitch: " + msg);
      try { console.error("skee-ball", err); } catch (_) { /* */ }
      return null;
    }
    fit();
    applyLane(skeeStageParams(1));
    if (!view._ro && typeof ResizeObserver !== "undefined") {
      view._ro = new ResizeObserver(() => fit());
      const host = card() || document.getElementById("cabinet-skee-ball");
      if (host) view._ro.observe(host);
    }
    window.addEventListener("resize", fit);
    startLoop();
    return view;
  }

  function canvasNorm(ev) {
    const canvas = el("skeeCanvas");
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    const t = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]) || ev;
    return {
      x: (t.clientX - r.left) / Math.max(1, r.width),
      y: (t.clientY - r.top) / Math.max(1, r.height),
    };
  }

  PF.registerVendor({
    id: "skee-ball",
    playKey: "skee",
    chalk: "Roll up. Beat the board. Wax lies.",
    defaults: { bestSkee: 0, bestSkeeScore: 0, bestSkeeStagePts: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopLoop();
    },
    onShow() {
      declareP0();
      stampDepthCopy();
      ensureWorld();
      say(AURA.roll);
    },
    onReset() {
      if (run) run.done = true;
      run = null;
      const verdict = el("skeeVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("skeeResult");
      const stamp = el("skeeStamp");
      if (stamp) stamp.hidden = true;
      const startBtn = el("skeeStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      resetPips();
      stampDepthCopy();
      if (cabinetOn()) startLoop();
    },
    refreshDepth(state) {
      setText("depthSkeeNow", isLive() || (run && run.dying) ? String(run.depth) : "0");
      const bestN = Math.max(state.bestSkee || 0, (state.bestDepth && state.bestDepth.skee) || 0);
      setText("depthSkeeBest", bestN ? String(bestN) : "—");
      setText("depthSkeeScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("skeeNightScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("skeeBestBoard", state.bestSkeeStagePts ? String(state.bestSkeeStagePts) : "—");
      setText("depthSkeeBestBoard", state.bestSkeeStagePts ? String(state.bestSkeeStagePts) : "—");
      setText("skeeDoorBest", bestN ? `Best lane ${bestN}` : "Lanes —");
    },
    bind() {
      declareP0();
      ensureCss();
      ensurePips(9);
      const startBtn = el("skeeStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = el("skeeCanvas");
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("pointerdown", (ev) => {
          if (run && (run.dying || run.done)) return;
          if (!isLive()) { punchStart(); return; }
          ev.preventDefault();
          try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* */ }
          pointer.down = true;
          pointer.id = ev.pointerId;
          const p = canvasNorm(ev);
          beginAim(p.x, p.y);
        });
        canvas.addEventListener("pointermove", (ev) => {
          if (!run || !run.aim || !pointer.down) return;
          ev.preventDefault();
          const p = canvasNorm(ev);
          updateAimFromPointer(p.x, p.y);
        });
        const up = (ev) => {
          if (!pointer.down && !(run && run.aim)) return;
          pointer.down = false;
          if (ev) {
            const p = canvasNorm(ev);
            updateAimFromPointer(p.x, p.y);
          }
          releaseAim();
        };
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("lostpointercapture", up);
        canvas.addEventListener("pointercancel", up);
      }
      window.addEventListener("keydown", (ev) => {
        if (!cabinetOn()) return;
        if (ev.code === "KeyA" || ev.code === "ArrowLeft") keys.a = true;
        if (ev.code === "KeyD" || ev.code === "ArrowRight") keys.d = true;
        if (ev.code === "Space") {
          ev.preventDefault();
          if (!keys.space) {
            keys.space = true;
            if (isLive() && !run.aim && !run.ball) {
              beginAim(0.5, 0.7);
              if (run.aim) run.aim.fromKey = true;
            }
          }
        }
      });
      window.addEventListener("keyup", (ev) => {
        if (ev.code === "KeyA" || ev.code === "ArrowLeft") keys.a = false;
        if (ev.code === "KeyD" || ev.code === "ArrowRight") keys.d = false;
        if (ev.code === "Space") {
          keys.space = false;
          if (run && run.aim && run.aim.fromKey) releaseAim();
        }
      });
      const copyBtn = el("skeeChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = lastDepth();
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("skeeCopied");
            if (copied) copied.hidden = false;
            setText("skeeStatus", "Copied — send it");
          }, () => setText("skeeStatus", text));
        });
      }
      stampDepthCopy();
    },
  });
}
