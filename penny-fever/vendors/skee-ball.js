/* Skee-Ball Alley — Desktop Grok owns this file. PF only. Never booth/port 6000. Never Imagine.
 * GOBLIN B04 AUTHORED — GOBLIN_AUTHORED_LEVELS_B04.md · hybrid + codaEnabled.
 * 8 unique LANES (layout / cheat / verb), not a hotter target climb. Mount stageParams = coda only.
 * Soft Boardwalk → Gutter Whisper → Wax Sheen → Split Ring Gate → Bank Shot Alley →
 * Reverse Power → Moving Fifty → Fever Lane Opera → ENDLESS Wax Lie {n}.
 * SlingAim timing-power lob. Stall owns 9-ball under_target death (shadow ctx).
 * HUD = LANE {n} · {name} · coda labeled ENDLESS. Death hold ≥700ms. No unlimited balls. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const W = 340;
  const H = 500;
  const GAME_ID = "skee";
  const TEE = { x: W / 2, y: H - 36 };
  const GRAVITY = 0.22;
  const BALL_R = 8.2;
  const RING_HOME = { x: W / 2, y: 118 };
  const RING_VALS = [10, 20, 30, 50];
  const ROLL_MS = 720;
  const CLEAR_BONUS = 250;
  const LANE_TOP = 78;
  const LANE_SPAN = TEE.y - LANE_TOP;
  const DEATH_HOLD_MS = 760;
  const WAX_AFTER = 3;
  const MAX_STAGE_PTS = 9 * 50;
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;

  let run = null;
  let idleRaf = 0;
  let idleT = 0;
  let idleRoom = 1;
  let idleClock = 0;

  const AURA = {
    under_target: "Aura: Wax got you.",
    board: (n) => `Aura: SKEE ${n}. Nine balls, board still hungry.`,
    clear: "Aura: Board beaten. Next lane cheats different.",
    deep: (n) => `Aura: Lane ${n}. You're arguing with the wax and winning.`,
    leave: "Aura: Walking off mid-board? Coward’s stamp.",
    shallow: "Aura: Not a single lane. The board kept the balls.",
    souvenir: "Aura: Fever Lane Opera survived. Souvenir — the board tipped its hat.",
  };

  /* B04 authored LANES — unique geometry / cheat / verb. Target climb is coda-only. */
  const AUTHORED = [
    {
      id: 1, name: "Soft Boardwalk", title: "Soft Boardwalk", kind: "teach",
      target: 100, ringScale: 1.0, waxLies: false, balls: 9, rings: RING_VALS.slice(),
      needleSpeed: 0.00078, goldLo: 0.54, goldHi: 0.90, loft: 34,
      gutter: false, split50: false, bankRail: false, invertPower: false, movingFifty: false,
      barker: "Soft Boardwalk. Wide gold. Slow needle. Lob, don’t tap. Nine balls. Beat 100.",
    },
    {
      id: 2, name: "Gutter Whisper", title: "Gutter Whisper", kind: "gutter",
      target: 120, ringScale: 1.0, waxLies: false, balls: 9, rings: RING_VALS.slice(),
      needleSpeed: 0.00105, goldLo: 0.58, goldHi: 0.88, loft: 32,
      gutter: true, split50: false, bankRail: false, invertPower: false, movingFifty: false,
      barker: "Outlanes MAGNETIZE. Stay off the gutters or they whisper you out.",
    },
    {
      id: 3, name: "Wax Sheen", title: "Wax Sheen", kind: "waxLie",
      target: 140, ringScale: 1.0, waxLies: true, balls: 9, rings: RING_VALS.slice(),
      needleSpeed: 0.00122, goldLo: 0.62, goldHi: 0.86, loft: 30,
      gutter: false, split50: false, bankRail: false, invertPower: false, movingFifty: false,
      barker: "Sheen mid-lane. First ball after sheen SKIDS LONG. Ghost is not the land.",
    },
    {
      id: 4, name: "Split Ring Gate", title: "Split Ring Gate", kind: "split50",
      target: 160, ringScale: 1.0, waxLies: false, balls: 9, rings: [10, 20, 30, 30],
      needleSpeed: 0.00135, goldLo: 0.60, goldHi: 0.86, loft: 30,
      gutter: false, split50: true, bankRail: false, invertPower: false, movingFifty: false,
      barker: "The 50 split into TWO 30s. No center crown. Pick a gate.",
    },
    {
      id: 5, name: "Bank Shot Alley", title: "Bank Shot Alley", kind: "bankShot",
      target: 180, ringScale: 1.0, waxLies: false, balls: 9, rings: RING_VALS.slice(),
      needleSpeed: 0.0014, goldLo: 0.58, goldHi: 0.88, loft: 30,
      gutter: false, split50: false, bankRail: true, invertPower: false, movingFifty: false,
      bankNeed: 2,
      barker: "Left BANK rail is live. Bounce for a stamp. Beat 180 — or two bank stamps.",
    },
    {
      id: 6, name: "Reverse Power", title: "Reverse Power", kind: "invertPower",
      target: 180, ringScale: 1.0, waxLies: false, balls: 9, rings: RING_VALS.slice(),
      needleSpeed: 0.00128, goldLo: 0.10, goldHi: 0.46, loft: 30,
      gutter: false, split50: false, bankRail: false, invertPower: true, movingFifty: false,
      barker: "REVERSE — release EARLY for a long lob. Muscle memory is the cheat.",
    },
    {
      id: 7, name: "Moving Fifty", title: "Moving Fifty", kind: "movingFifty",
      target: 200, ringScale: 1.0, waxLies: false, balls: 9, rings: RING_VALS.slice(),
      needleSpeed: 0.00132, goldLo: 0.62, goldHi: 0.86, loft: 28,
      gutter: false, split50: false, bankRail: false, invertPower: false, movingFifty: true,
      barker: "The 50 ORBITS. 10/20/30 sit still. Lead the crown hole.",
    },
    {
      id: 8, name: "Fever Lane Opera", title: "Fever Lane Opera", kind: "comboFinale",
      target: 220, ringScale: 1.0, waxLies: true, balls: 9, rings: RING_VALS.slice(),
      needleSpeed: 0.0014, goldLo: 0.60, goldHi: 0.86, loft: 28,
      gutter: true, split50: false, bankRail: false, invertPower: false, movingFifty: true,
      barker: "Finale: wax sheen + gutter pull + moving fifty. Nine balls. Beat 220.",
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
    tag: "DEPTH RUN · 8 authored LANES then ENDLESS · 9 balls · layout cheats, not hotter targets",
    body: "Authored rooms, not a thinner loop: Soft Boardwalk → Gutter Whisper (magnet outlanes) → Wax Sheen (first ball skids long) → Split Ring Gate (two 30s, no 50) → Bank Shot Alley (rail bounce OR 180) → Reverse Power (early = long) → Moving Fifty (orbiting crown) → Fever Lane Opera → ENDLESS Wax Lie. Hold the timing bar, release to lob. Beat the board in nine balls or WAX stamps you. No unlimited balls.",
    status: "Depth run · START · 1 demo coin · 8 authored LANES then ENDLESS",
    machine: "Boardwalk skee · 1 demo coin · authored LANES",
    idleHud: ["ROLL UP — BEAT THE BOARD", "START · 1 demo coin — 8 lanes, then ENDLESS"],
    punch: "Depth run — press START. Nine balls. No unlimited balls.",
  };

  function rk() {
    return PF.runKit || null;
  }

  function el(id) {
    return $(id);
  }

  function setText(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }

  function skeeCoda(n) {
    const t = Math.max(1, (n | 0) - AUTHORED_COUNT);
    return {
      id: n,
      name: `Wax Lie ${n}`,
      title: `Wax Lie ${n}`,
      kind: "coda",
      target: Math.min(MAX_STAGE_PTS - 20, 220 + 40 * t),
      ringScale: Math.max(0.55, 1.0 - 0.04 * t),
      waxLies: true,
      balls: 9,
      rings: RING_VALS.slice(),
      needleSpeed: Math.min(0.0034, 0.0015 + 0.00012 * t),
      gutter: true,
      split50: false,
      bankRail: false,
      invertPower: t % 3 === 0,
      movingFifty: true,
      goldLo: t % 3 === 0 ? 0.12 : 0.70,
      goldHi: t % 3 === 0 ? 0.42 : 0.84,
      loft: 24,
      coda: true,
      barker: `ENDLESS Wax Lie ${n} — target climb, rings shrink, wax on. Gutters still whisper.`,
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
    try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
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

  function card() {
    return el("skeeCard");
  }

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

  function stageEl() {
    const host = card();
    return (host && host.querySelector(".vendor-stage")) || null;
  }

  function cheatLabel(spec) {
    if (!spec) return "";
    if (spec.kind === "coda") return "ENDLESS · WAX LIE";
    if (spec.kind === "comboFinale") return "WAX + GUTTER + MOVING 50";
    if (spec.kind === "movingFifty" || spec.movingFifty) return "50 ORBITS — LEAD IT";
    if (spec.kind === "invertPower" || spec.invertPower) return "REVERSE — EARLY = LONG";
    if (spec.kind === "bankShot" || spec.bankRail) return "BANK RAIL — STAMP OR SCORE";
    if (spec.kind === "split50" || spec.split50) return "NO 50 — TWO 30 GATES";
    if (spec.kind === "waxLie" || spec.waxLies) return "SHEEN SKIDS THE NEXT BALL LONG";
    if (spec.kind === "gutter" || spec.gutter) return "GUTTERS MAGNETIZE";
    return "";
  }

  function hudLine(spec, playing) {
    if (!spec) return "LANE 0";
    const name = spec.name || spec.title || "Lane";
    if (spec.coda) return `ENDLESS · LANE ${playing} · ${name}`;
    return `LANE ${playing} · ${name}`;
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
      hud.textContent = hudLine(liveSpec(), run.stage | 0);
      hud.hidden = false;
    } else {
      hud.textContent = "LANE 0";
      hud.hidden = true;
    }
    return hud;
  }

  function ensurePips(count) {
    const stage = stageEl();
    if (!stage) return null;
    let span = stage.querySelector(`[data-runkit-strikes="${GAME_ID}"]`);
    const n = Math.max(9, count | 0);
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
    const max = (spec && spec.balls) || 9;
    const span = ensurePips(max);
    if (!span) return;
    const used = (isLive() || (run && run.dying)) ? Math.max(0, max - (run.ballsLeft | 0)) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < used));
  }

  function resetPips() {
    const host = card();
    const pips = (host && host.querySelector("[data-runkit-strikes]")) || document.querySelector("[data-runkit-strikes=\"skee\"]");
    if (!pips) return;
    pips.querySelectorAll("i").forEach((n) => n.classList.remove("on"));
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
      /* Launcher only. Stall owns 9-ball under_target death.
       * missesToDeath is huge so SlingAim.resolveHit cannot steal the run.
       * Shadow ctx so reportDepth/finishRun cannot steal the coin run. */
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

  function goldBand(spec) {
    if (!spec) return { lo: 0.74, hi: 0.83 };
    return {
      lo: spec.goldLo != null ? spec.goldLo : 0.74,
      hi: spec.goldHi != null ? spec.goldHi : 0.83,
    };
  }

  function ringCenter(spec, t) {
    const amp = spec && spec.offsetAmp ? spec.offsetAmp : 0;
    const sway = amp ? Math.sin((t || 0) * 0.0018) * amp : 0;
    return { x: RING_HOME.x + sway, y: RING_HOME.y };
  }

  function fiftyPos(spec, t) {
    const c = ringCenter(spec, t);
    if (!(spec && (spec.movingFifty || spec.kind === "movingFifty" || spec.kind === "comboFinale" || (spec.coda && spec.movingFifty)))) {
      return c;
    }
    const a = (t || 0) * 0.00155;
    return { x: c.x + Math.sin(a) * 40, y: c.y + Math.cos(a) * 14 };
  }

  function splitGates(spec, t) {
    const c = ringCenter(spec, t);
    return [
      { x: c.x - 36, y: c.y + 4 },
      { x: c.x + 36, y: c.y + 4 },
    ];
  }

  function ringRadii(scale) {
    const s = scale == null ? 1 : scale;
    return { 50: 16 * s, 30: 32 * s, 20: 48 * s, 10: 66 * s };
  }

  function ovalMul(spec) {
    return spec && spec.oval50 ? { x: 1.38, y: 0.62 } : { x: 1, y: 1 };
  }

  function waxMul() {
    if (!run || !run.waxOn) return 1;
    return run.waxMul || 1;
  }

  function effectivePower(power, spec) {
    const p = kit.clamp(power, 0, 1);
    if (spec && (spec.invertPower || spec.kind === "invertPower")) return 1 - p;
    return p;
  }

  function landFromPower(power, aimX, mul, spec) {
    const p = effectivePower(power, spec);
    let travel = LANE_SPAN * (0.35 + p * 0.7) * (mul == null ? 1 : mul);
    let destX = kit.clamp(TEE.x + aimX * (0.28 + p * 0.5), 42, W - 42);
    if (spec && spec.crown) destX += (TEE.x - destX) * 0.32;
    let destY = kit.clamp(TEE.y - travel, LANE_TOP + 6, TEE.y - 28);
    let banked = false;
    if (spec && spec.bankRail && destX < 118) {
      destX = kit.clamp(118 + (118 - destX) * 0.72, 118, W - 72);
      destY = kit.clamp(destY - 22, LANE_TOP + 8, TEE.y - 36);
      banked = true;
    }
    if (spec && spec.gutter && !banked) {
      const edge = 102;
      if (destX < edge) destX = kit.clamp(destX - (edge - destX) * 0.62, 28, W - 28);
      if (destX > W - edge) destX = kit.clamp(destX + (destX - (W - edge)) * 0.62, 28, W - 28);
    }
    return { x: destX, y: destY, banked };
  }

  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") {
      return rk().challengeText("Skee-Ball stage", depth, GAME_ID);
    }
    return `Beat my Skee-Ball stage ${depth} on Penny Fever`;
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
    return Math.max(state.bestSkee || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }

  function punchStart() {
    stampDepthCopy();
    setText("skeeStatus", DEPTH_COPY.punch);
    const btn = el("skeeStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
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
    host.querySelectorAll("[data-pf-depth-copy]").forEach((p) => {
      p.textContent = DEPTH_COPY.body;
    });
    const body = host.querySelector(".vendor-vestibule-only:not([data-pf-depth-tag]):not(.card-hero):not(.signature-prop)");
    if (body && !body.hasAttribute("data-pf-depth-copy") && body.tagName === "P") {
      body.setAttribute("data-pf-depth-copy", "1");
      body.textContent = DEPTH_COPY.body;
    }
    ensureHud();
    paintPips();
    const canvas = el("skeeCanvas");
    if (canvas) {
      canvas.style.touchAction = "none";
      canvas.classList.toggle("is-locked", !isLive());
    }
    if (!isLive() && (!run || run.done)) setText("skeeStatus", DEPTH_COPY.status);
  }

  function drawLane(ctx, spec, wax) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(78, 86);
    ctx.lineTo(262, 86);
    ctx.lineTo(318, H - 22);
    ctx.lineTo(22, H - 22);
    ctx.closePath();
    ctx.clip();
    kit.fillWood(ctx, 8, 70, 324, H - 80);
    const sheen = ctx.createLinearGradient(0, 90, 0, H);
    sheen.addColorStop(0, wax ? "rgba(232,160,184,0.42)" : "rgba(212,164,90,0.08)");
    sheen.addColorStop(0.45, wax ? "rgba(240,208,154,0.34)" : "rgba(0,0,0,0.12)");
    sheen.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = sheen;
    ctx.fillRect(8, 70, 324, H - 80);
    if (spec && spec.gutter) {
      ctx.fillStyle = "rgba(8,4,8,0.55)";
      ctx.beginPath();
      ctx.moveTo(22, H - 22);
      ctx.lineTo(78, 86);
      ctx.lineTo(96, 86);
      ctx.lineTo(48, H - 22);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(318, H - 22);
      ctx.lineTo(262, 86);
      ctx.lineTo(244, 86);
      ctx.lineTo(292, H - 22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(232,160,184,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(48, H - 22);
      ctx.lineTo(96, 86);
      ctx.moveTo(292, H - 22);
      ctx.lineTo(244, 86);
      ctx.stroke();
      ctx.fillStyle = "rgba(232,160,184,0.92)";
      ctx.font = "bold 10px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("GUTTERS PULL — STAY CENTER", W / 2, 176);
    }
    if (spec && spec.bankRail) {
      ctx.fillStyle = "rgba(212,164,90,0.55)";
      ctx.fillRect(54, 96, 10, 280);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 2;
      ctx.strokeRect(54.5, 96.5, 9, 279);
      ctx.fillStyle = "rgba(240,208,154,0.92)";
      ctx.font = "bold 10px Georgia, serif";
      ctx.textAlign = "center";
      ctx.save();
      ctx.translate(42, 250);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("BANK RAIL", 0, 0);
      ctx.restore();
    }
    if (spec && spec.crown) {
      ctx.strokeStyle = "rgba(240,208,154,0.38)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TEE.x - 18, H - 40);
      ctx.quadraticCurveTo(TEE.x, 220, TEE.x - 8, 96);
      ctx.moveTo(TEE.x + 18, H - 40);
      ctx.quadraticCurveTo(TEE.x, 220, TEE.x + 8, 96);
      ctx.stroke();
      ctx.fillStyle = "rgba(240,208,154,0.86)";
      ctx.font = "bold 10px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("CROWNED LANE — RAILS FUNNEL", W / 2, 176);
    }
    if (wax) {
      const sweep = ((run ? run.t : idleT) * 0.05) % 240;
      ctx.strokeStyle = "rgba(255,246,236,0.55)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(62, 140 + sweep * 0.2);
      ctx.quadraticCurveTo(W / 2, 240 + sweep * 0.15, 278, 360 + sweep * 0.1);
      ctx.stroke();
      ctx.fillStyle = "rgba(232,160,184,0.92)";
      ctx.font = "bold 11px Georgia, serif";
      ctx.textAlign = "center";
      const lie = run && run.waxMul > 1 ? "WAX SHEEN — FAST LANE" : "WAX SHEEN — SLOW LANE";
      ctx.fillText(lie, W / 2, 156);
    }
    ctx.restore();
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(78, 86);
    ctx.lineTo(262, 86);
    ctx.lineTo(318, H - 22);
    ctx.lineTo(22, H - 22);
    ctx.closePath();
    ctx.stroke();
  }

  function drawRings(ctx, spec, t) {
    const r = ringRadii(spec.ringScale);
    const c = ringCenter(spec, t);
    const oval = ovalMul(spec);
    const flash = run && run.ringFlash;
    const split = !!(spec.split50 || spec.kind === "split50");
    const moving = !!(spec.movingFifty || spec.kind === "movingFifty" || spec.kind === "comboFinale");
    const nest = [
      { v: 10, rad: r[10], col: "#8a6230" },
      { v: 20, rad: r[20], col: "#3d8a8a" },
      { v: 30, rad: r[30], col: "#c41e3a" },
    ];
    nest.forEach((ring) => {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, ring.rad, ring.rad * 0.72, 0, 0, Math.PI * 2);
      ctx.fillStyle = flash && flash.v === ring.v && !flash.gate ? "rgba(255,246,236,0.28)" : "rgba(8,4,8,0.72)";
      ctx.fill();
      ctx.strokeStyle = flash && flash.v === ring.v && !flash.gate ? "#fff6ec" : ring.col;
      ctx.lineWidth = flash && flash.v === ring.v && !flash.gate ? 3.4 : 2.4;
      ctx.stroke();
    });
    ctx.fillStyle = "#f0d09a";
    ctx.font = "bold 11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("30", c.x, c.y - r[30] * 0.72 + 12);
    ctx.fillText("20", c.x + r[20] * 0.72, c.y + 4);
    ctx.fillText("10", c.x, c.y + r[10] * 0.72 - 6);
    if (split) {
      splitGates(spec, t).forEach((g, i) => {
        ctx.beginPath();
        ctx.ellipse(g.x, g.y, r[30] * 0.55, r[30] * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = flash && flash.gate === i ? "rgba(255,246,236,0.32)" : "rgba(8,4,8,0.78)";
        ctx.fill();
        ctx.strokeStyle = flash && flash.gate === i ? "#fff6ec" : "#d4a45a";
        ctx.lineWidth = 2.6;
        ctx.stroke();
        ctx.fillStyle = "#f0d09a";
        ctx.fillText("30", g.x, g.y + 4);
      });
      ctx.fillStyle = "rgba(232,160,184,0.95)";
      ctx.font = "bold 10px Georgia, serif";
      ctx.fillText("SPLIT GATE — NO 50", c.x, c.y - r[10] * 0.72 - 8);
    } else {
      const f = fiftyPos(spec, t);
      ctx.beginPath();
      ctx.ellipse(f.x, f.y, r[50] * oval.x, r[50] * 0.72 * oval.y, 0, 0, Math.PI * 2);
      ctx.fillStyle = flash && flash.v === 50 ? "rgba(255,246,236,0.32)" : "rgba(8,4,8,0.82)";
      ctx.fill();
      ctx.strokeStyle = flash && flash.v === 50 ? "#fff6ec" : "#d4a45a";
      ctx.lineWidth = flash && flash.v === 50 ? 3.4 : 2.6;
      ctx.stroke();
      ctx.fillStyle = "#f0d09a";
      ctx.font = "bold 11px Georgia, serif";
      ctx.fillText("50", f.x, f.y + 4);
      if (moving) {
        ctx.fillStyle = "rgba(240,208,154,0.92)";
        ctx.font = "bold 10px Georgia, serif";
        ctx.fillText("50 ORBITS", f.x, f.y - r[50] * 0.72 - 8);
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = "rgba(240,208,154,0.45)";
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, 40, 14, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  function drawPowerBar(ctx, power, wax, holding, spec) {
    const gold = goldBand(spec);
    const x = W - 32;
    const y = 210;
    const h = 220;
    ctx.fillStyle = "rgba(12,6,9,0.7)";
    ctx.fillRect(x - 16, y - 8, 34, h + 16);
    ctx.strokeStyle = wax ? "#e8a0b8" : "#d4a45a";
    ctx.strokeRect(x - 16.5, y - 8.5, 33, h + 15);
    const goldY0 = y + h - gold.hi * h;
    const goldH = Math.max(8, (gold.hi - gold.lo) * h);
    ctx.fillStyle = "rgba(212,164,90,0.28)";
    ctx.fillRect(x - 14, goldY0, 30, goldH);
    const fill = kit.clamp(power, 0, 1);
    ctx.fillStyle = fill >= gold.lo && fill <= gold.hi ? "#d4a45a" : fill > 0.92 ? "#c41e3a" : "#3d8a8a";
    ctx.fillRect(x - 12, y + h - fill * h, 26, Math.max(2, fill * h));
    if (holding) {
      ctx.fillStyle = "#fff6ec";
      ctx.fillRect(x - 15, y + h - fill * h - 1.5, 32, 3);
    }
    ctx.fillStyle = "#f0d09a";
    ctx.font = "8px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("PWR", x + 1, y - 14);
    ctx.fillText("50", x + 1, goldY0 + goldH * 0.55);
    if (spec && spec.kind === "teach") {
      ctx.fillStyle = "rgba(240,208,154,0.95)";
      ctx.fillText("WIDE", x + 1, goldY0 - 8);
    }
    if (spec && (spec.invertPower || spec.kind === "invertPower")) {
      ctx.fillStyle = "rgba(232,160,184,0.95)";
      ctx.fillText("REV", x + 1, goldY0 - 8);
      ctx.fillText("EARLY", x + 1, y + h + 18);
    }
    if (wax) {
      ctx.fillStyle = "rgba(232,160,184,0.95)";
      ctx.fillText("LIE", x + 1, y + h + 18);
    }
  }

  function drawBalls(ctx, left, total) {
    const n = total || 9;
    const y = H - 14;
    for (let i = 0; i < n; i += 1) {
      const x = 18 + i * 14;
      ctx.beginPath();
      ctx.arc(x, y, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = i < left ? "#c41e3a" : "rgba(196,30,58,0.18)";
      ctx.fill();
      ctx.strokeStyle = i < left ? "#fff6ec" : "rgba(255,246,236,0.2)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  function drawBall(ctx, ball) {
    const b = ball || { x: TEE.x, y: TEE.y, r: BALL_R };
    const scale = kit.clamp(0.72 + (b.y / H) * 0.4, 0.7, 1.12);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * scale, 0, Math.PI * 2);
    ctx.fillStyle = "#c41e3a";
    ctx.fill();
    ctx.strokeStyle = "#fff6ec";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(b.x - 2, b.y - 2, 2.1 * scale, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,246,236,0.5)";
    ctx.fill();
  }

  function draw() {
    const canvas = el("skeeCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (run) run.shake = kit.applyShake(ctx, run.shake || 0);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#2a1420");
    bg.addColorStop(1, "#10080c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const spec = liveSpec();
    const t = run ? run.t : idleT;
    const wax = !!(run && run.waxOn) || (!run && spec && spec.waxLies);
    drawLane(ctx, spec, wax);
    drawRings(ctx, spec, t);

    ctx.fillStyle = "rgba(12,6,9,0.62)";
    ctx.fillRect(88, 48, 164, 22);
    ctx.strokeStyle = "rgba(196,30,58,0.7)";
    ctx.strokeRect(88.5, 48.5, 163, 21);
    ctx.fillStyle = "#f0d09a";
    ctx.font = "11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("ROLL UP · BEAT THE BOARD", W / 2, 63);

    const cheat = cheatLabel(spec);
    if (cheat && (!run || run.done || !wax)) {
      ctx.fillStyle = "rgba(232,160,184,0.9)";
      ctx.font = "bold 10px Georgia, serif";
      ctx.fillText(cheat, W / 2, 80);
    }

    const power = run && run.aim ? run.aim.power : 0;
    drawPowerBar(ctx, power, wax, !!(run && run.aim), spec);

    if (run && run.aim) {
      ctx.strokeStyle = "rgba(240,208,154,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TEE.x, TEE.y);
      ctx.lineTo(TEE.x + run.aim.aimX * 0.55, TEE.y - 18 - run.aim.power * 70);
      ctx.stroke();
      const ghost = landFromPower(run.aim.power, run.aim.aimX, 1, spec);
      ctx.beginPath();
      ctx.arc(ghost.x, ghost.y, 7, 0, Math.PI * 2);
      ctx.strokeStyle = wax ? "rgba(232,160,184,0.8)" : (ghost.banked ? "rgba(212,164,90,0.9)" : "rgba(240,208,154,0.55)");
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (wax) {
        ctx.fillStyle = "rgba(232,160,184,0.95)";
        ctx.font = "bold 10px Georgia, serif";
        ctx.fillText("SHEEN LIES — GHOST ≠ LAND", ghost.x, ghost.y - 12);
      }
      if (spec.invertPower) {
        ctx.fillStyle = "rgba(232,160,184,0.95)";
        ctx.font = "bold 10px Georgia, serif";
        ctx.fillText("REVERSE GHOST", ghost.x, ghost.y - 12);
      }
      if (ghost.banked) {
        ctx.fillStyle = "rgba(240,208,154,0.95)";
        ctx.font = "bold 10px Georgia, serif";
        ctx.fillText("BANK", ghost.x, ghost.y - 12);
      }
      if (spec.movingFifty || spec.kind === "comboFinale") {
        const lead = fiftyPos(spec, t + 420);
        ctx.beginPath();
        ctx.arc(lead.x, lead.y, 5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(240,208,154,0.7)";
        ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(240,208,154,0.9)";
        ctx.font = "bold 9px Georgia, serif";
        ctx.fillText("LEAD", lead.x, lead.y - 10);
      }
    }

    drawBall(ctx, run && run.ball);
    if (run && run.ball && run.ball.waxVeer) {
      ctx.fillStyle = "rgba(232,160,184,0.95)";
      ctx.font = "bold 11px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("WAX VEER", run.ball.x, run.ball.y - 18);
    }
    drawBalls(ctx, run && !run.done ? run.ballsLeft : 9, 9);

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, "WAX");

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    if (run && !run.done) {
      kit.drawHud(ctx, W, [
        `${spec.title} · ${run.stagePts}/${spec.target}${spec.bankRail ? ` · BANK ${run.bankStamps || 0}/${spec.bankNeed || 2}` : ""} · balls ${run.ballsLeft}`,
        `${hudLine(spec, run.stage)} · ${run.score}${wax ? " · WAX LIES" : ""}`,
      ]);
    } else if (!run || !run.closedStamp) {
      const state = typeof PF.getState === "function" ? PF.getState() : {};
      const bestPts = (state && state.bestSkeeStagePts) || 0;
      const extra = bestPts ? [`BEST BOARD ${bestPts}`] : [];
      kit.drawHud(ctx, W, DEPTH_COPY.idleHud.concat(extra));
    }
  }

  function stopIdle() {
    if (idleRaf) cancelAnimationFrame(idleRaf);
    idleRaf = 0;
  }

  function startIdle() {
    if (isLive() || (run && run.dying) || !cabinetOn()) return;
    stopIdle();
    let last = 0;
    const tick = (now) => {
      if (isLive() || (run && run.dying) || !cabinetOn()) {
        idleRaf = 0;
        return;
      }
      if (!last) last = now;
      idleT = now;
      idleClock += Math.min(48, now - last);
      last = now;
      if (idleClock > 2600) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
      }
      draw();
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }

  function startStage(n) {
    const spec = skeeStageParams(n);
    if (!spec) return;
    run.stage = spec.id;
    run.spec = spec;
    run.ballsLeft = spec.balls;
    run.stagePts = 0;
    run.bankStamps = 0;
    run.ball = null;
    run.aim = null;
    run.waxOn = false;
    run.waxMul = 1;
    run.waxSkidNext = false;
    run.pause = n === 1 ? 0 : 420;
    run.ringFlash = null;
    tellDepth(run.depth);
    ensureHud();
    paintPips();
    const cheat = cheatLabel(spec);
    setText("skeeStatus", spec.barker || `${spec.title} — need ${spec.target} in ${spec.balls} balls.${cheat ? " " + cheat + "." : ""}`);
  }

  function start() {
    if (isLive()) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("skeeStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      stampDepthCopy();
      return;
    }
    stopIdle();
    run = {
      done: false,
      dying: false,
      kitRun,
      sling: null,
      t: 0,
      last: 0,
      raf: 0,
      depth: 0,
      stage: 1,
      score: 0,
      spec: skeeStageParams(1),
      ballsLeft: 9,
      stagePts: 0,
      bankStamps: 0,
      bestStagePts: 0,
      ball: null,
      aim: null,
      waxOn: false,
      waxMul: 1,
      waxSkidNext: false,
      pause: 0,
      shake: 0,
      closedStamp: false,
      ringFlash: null,
      deathHold: 0,
      deathNote: "under_target",
    };
    run.sling = mountSling(kitRun);
    tellDepth(0);
    const startBtn = el("skeeStart");
    if (startBtn) startBtn.disabled = true;
    const verdict = el("skeeVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("skeeResult");
    PF.setTier("skeeTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    startStage(1);
    PF.focusCard("skeeCard", true);
    PF.setAura("think");
    const loop = (now) => {
      if (!run || run.done) return;
      if (!run.last) run.last = now;
      const dt = Math.min(32, now - run.last);
      run.last = now;
      run.t += dt;
      if (run.dying) {
        draw();
        run.deathHold -= dt;
        if (run.deathHold <= 0) {
          sealResult(run.deathNote);
          return;
        }
        run.raf = requestAnimationFrame(loop);
        return;
      }
      step(dt);
      draw();
      PF.refreshDepth();
      run.raf = requestAnimationFrame(loop);
    };
    run.raf = requestAnimationFrame(loop);
  }

  function rollWaxMul() {
    run.waxMul = Math.random() < 0.5 ? 0.82 : 1.18;
  }

  function maybeWax() {
    if (!run.spec.waxLies) return;
    const used = run.spec.balls - run.ballsLeft;
    if (!run.waxOn && used >= WAX_AFTER) {
      run.waxOn = true;
      run.waxMul = 1.26;
      run.waxSkidNext = true;
      run.shake = 6;
      kit.sfx("flip");
      setText("skeeStatus", "Sheen on — next ball SKIDS LONG. Ghost is not the land.");
      PF.setAura("laugh");
      return;
    }
    if (run.waxOn && used > WAX_AFTER && Math.random() < 0.35) {
      rollWaxMul();
      run.shake = 4;
      setText("skeeStatus", run.waxMul > 1
        ? "Sheen shifted FAST — the lie changed under the wood."
        : "Sheen shifted SLOW — the lie changed under the wood.");
    }
  }

  function resolveLanding(x, y) {
    const spec = run.spec;
    const r = ringRadii(spec.ringScale);
    const c = ringCenter(spec, run.t);
    const oval = ovalMul(spec);
    if (spec.split50 || spec.kind === "split50") {
      const gates = splitGates(spec, run.t);
      for (let i = 0; i < gates.length; i += 1) {
        const g = gates[i];
        const d = Math.hypot((x - g.x) / 0.55, (y - g.y) / 0.4);
        if (d <= r[30]) return { v: 30, near: false, dist: d, gate: i };
      }
      const dist = Math.hypot(x - c.x, (y - c.y) / 0.72);
      if (dist <= r[30]) return { v: 30, near: false, dist };
      if (dist <= r[20]) return { v: 20, near: false, dist };
      if (dist <= r[10]) return { v: 10, near: false, dist };
      return { v: 0, near: dist < r[10] + 14, dist };
    }
    const f = fiftyPos(spec, run.t);
    const d50 = Math.hypot((x - f.x) / oval.x, ((y - f.y) / 0.72) / oval.y);
    if (d50 <= r[50]) return { v: 50, near: false, dist: d50 };
    const dist = Math.hypot(x - c.x, (y - c.y) / 0.72);
    if (dist <= r[30]) return { v: 30, near: false, dist };
    if (dist <= r[20]) return { v: 20, near: false, dist };
    if (dist <= r[10]) return { v: 10, near: false, dist };
    return { v: 0, near: dist < r[10] + 14, dist };
  }

  function bankClear() {
    return !!(run.spec && run.spec.bankRail && (run.bankStamps | 0) >= (run.spec.bankNeed || 2));
  }

  function scoreRing(hit) {
    const val = hit && hit.v ? hit.v : 0;
    const banked = !!(run.ball && run.ball.banked);
    run.stagePts += val;
    run.score += val;
    if (run.kitRun) run.kitRun.score = run.score;
    if (banked) run.bankStamps = (run.bankStamps | 0) + 1;
    run.ball = null;
    run.pause = 280;
    run.ringFlash = val ? { v: val, until: run.t + 320, gate: hit && hit.gate } : null;
    kit.sfx(val >= 50 || banked ? "rack" : val > 0 ? "sink" : "miss");
    let note;
    if (banked) {
      note = `BANK STAMP ${run.bankStamps}/${run.spec.bankNeed || 2}${val ? ` · ${val}` : ""}. Board ${run.stagePts}/${run.spec.target} · ${run.ballsLeft} left`;
    } else if (val) {
      note = `${val}! Board ${run.stagePts}/${run.spec.target} · ${run.ballsLeft} left`;
    } else if (run.waxOn) {
      note = `Wax ate it — ghost was not the land. Board ${run.stagePts}/${run.spec.target} · ${run.ballsLeft} left`;
    } else if (hit && hit.near) {
      note = `Near miss on the 10. Board ${run.stagePts}/${run.spec.target} · ${run.ballsLeft} left`;
    } else if (run.spec.gutter) {
      note = `Gutter whispered it out. Board ${run.stagePts}/${run.spec.target} · ${run.ballsLeft} left`;
    } else {
      note = `Gutter. Board ${run.stagePts}/${run.spec.target} · ${run.ballsLeft} left`;
    }
    setText("skeeStatus", note);
    maybeWax();
    if (run.stagePts >= run.spec.target || bankClear()) {
      clearStage();
    } else if (run.ballsLeft <= 0) {
      finish("under_target");
    }
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
    kit.sfx("rack");
    PF.setAura("celebrate");
    const next = skeeStageParams(run.depth + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    setText("skeeStatus", run.depth >= 6
      ? AURA.deep(run.depth)
      : `${AURA.clear} ${next.title} — ${next.bankRail ? "score or two bank stamps" : "need " + next.target}.`);
    startStage(run.depth + 1);
  }

  function beginAim(x) {
    if (!isLive() || run.ball || run.pause > 0) return;
    if (run.ballsLeft <= 0) return;
    run.aim = {
      power: 0,
      aimX: kit.clamp(x - TEE.x, -78, 78),
      needle: 0,
      dir: 1,
    };
    if (run.sling && typeof run.sling.beginPull === "function") {
      run.sling.beginPull(TEE.x, TEE.y);
    }
  }

  function updateAim(x) {
    if (!run || !run.aim) return;
    run.aim.aimX = kit.clamp(x - TEE.x, -78, 78);
    if (run.sling && typeof run.sling.movePull === "function") run.sling.movePull(x, TEE.y + 40);
  }

  function releaseAim() {
    if (!run || !run.aim || run.done || run.dying || run.ball) {
      if (run) run.aim = null;
      return;
    }
    const shown = run.aim.power;
    if (shown < 0.08) {
      run.aim = null;
      if (run.sling && typeof run.sling.release === "function") run.sling.release();
      setText("skeeStatus", "Hold the bar — release in the gold for 50.");
      return;
    }
    if (run.sling && typeof run.sling.release === "function") run.sling.release();
    const skid = run.waxSkidNext;
    const mul = skid ? 1.32 : waxMul();
    if (skid) run.waxSkidNext = false;
    const dest = landFromPower(shown, run.aim.aimX, mul, run.spec);
    run.ballsLeft -= 1;
    paintPips();
    const roll = ROLL_MS * (run.waxOn ? (run.waxMul > 1 || skid ? 0.78 : 1.22) : 1);
    run.ball = {
      x: TEE.x,
      y: TEE.y,
      r: BALL_R,
      destX: dest.x,
      destY: dest.y,
      life: 0,
      roll,
      loft: run.spec.loft || 26,
      waxVeer: false,
      banked: !!dest.banked,
      skid,
    };
    run.aim = null;
    kit.sfx("throw");
    setText("skeeStatus", dest.banked
      ? "Banked off the left rail — stamp if it lands."
      : skid
        ? "Sheen skid — this one runs LONG."
        : run.waxOn ? "Wax under the roll — ghost lied." : "Ball’s up the lane.");
  }

  function step(dt) {
    if (run.ringFlash && run.t > run.ringFlash.until) run.ringFlash = null;
    if (run.aim) {
      const spd = run.spec.needleSpeed || 0.0018;
      run.aim.needle += run.aim.dir * spd * dt;
      if (run.aim.needle >= 1) {
        run.aim.needle = 1;
        run.aim.dir = -1;
      } else if (run.aim.needle <= 0) {
        run.aim.needle = 0;
        run.aim.dir = 1;
      }
      run.aim.power = run.aim.needle;
    }
    if (run.pause > 0) {
      run.pause -= dt;
      return;
    }
    const ball = run.ball;
    if (!ball) return;
    ball.life += dt;
    const k = dt / 16;
    const t = kit.clamp(ball.life / (ball.roll || ROLL_MS), 0, 1);
    if (run.spec.crown) {
      ball.destX += (TEE.x - ball.destX) * Math.min(1, 0.055 * k);
    }
    if (run.spec.gutter && !ball.banked) {
      const edge = 102;
      if (ball.destX < edge) ball.destX -= (edge - ball.destX) * Math.min(1, 0.04 * k);
      if (ball.destX > W - edge) ball.destX += (ball.destX - (W - edge)) * Math.min(1, 0.04 * k);
    }
    if (run.waxOn && !ball.waxVeer && t >= 0.28 && t <= 0.62) {
      ball.waxVeer = true;
      const kick = (run.waxMul > 1 ? 1 : -1) * (18 + Math.random() * 22);
      ball.destY = kit.clamp(ball.destY - kick, LANE_TOP + 8, TEE.y - 36);
      ball.destX = kit.clamp(ball.destX + (Math.random() * 2 - 1) * 12, 42, W - 42);
      run.shake = 6;
      kit.sfx("flip");
      setText("skeeStatus", "Wax veered the roll — sheen lied mid-lane.");
      PF.setAura("laugh");
    }
    const ease = 1 - (1 - t) * (1 - t);
    const loft = Math.sin(Math.PI * t) * (ball.loft || 26);
    ball.x = TEE.x + (ball.destX - TEE.x) * ease;
    ball.y = TEE.y + (ball.destY - TEE.y) * ease - loft;
    if (t >= 1) scoreRing(resolveLanding(ball.destX, ball.destY));
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
    run.closedStamp = true;
    run.deathHold = DEATH_HOLD_MS;
    kit.sfx("stamp");
    run.shake = 8;
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    if (run.raf) cancelAnimationFrame(run.raf);
    run.closedStamp = reason !== "leave" && reason !== "souvenir";
    run.bestStagePts = Math.max(run.bestStagePts, run.stagePts);
    const depth = run.depth;
    const score = run.score;
    const death = reason === "leave" ? "leave" : reason === "souvenir" ? "souvenir" : "under_target";
    persistDepth({
      depth,
      score,
      deathReason: death,
      cashedOut: reason === "souvenir",
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
      verdict.textContent = reason === "leave"
        ? `Left the alley · ${line}`
        : reason === "souvenir"
          ? `Souvenir. ${line}.`
          : `Under target. ${line}.`;
    }
    kit.fillResult({
      root: "skeeResult",
      depth: "skeeResultDepth",
      score: "skeeResultScore",
      aura: "skeeResultAura",
      copied: "skeeCopied",
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
    draw();
    startIdle();
  }

  PF.registerVendor({
    id: "skee-ball",
    playKey: "skee",
    chalk: "Roll up. Beat the board. Wax lies.",
    defaults: { bestSkee: 0, bestSkeeScore: 0, bestSkeeStagePts: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopIdle();
    },
    onShow() { declareP0(); stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      const verdict = el("skeeVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("skeeResult");
      const startBtn = el("skeeStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      resetPips();
      stampDepthCopy();
      startIdle();
    },
    refreshDepth(state) {
      setText("depthSkeeNow", isLive() || (run && run.dying) ? String(run.depth) : "0");
      const bestN = Math.max(state.bestSkee || 0, (state.bestDepth && state.bestDepth.skee) || 0);
      setText("depthSkeeBest", bestN ? String(bestN) : "—");
      setText("depthSkeeScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("depthSkeeBestBoard", state.bestSkeeStagePts ? String(state.bestSkeeStagePts) : "—");
      setText("skeeDoorBest", bestN ? `Best lane ${bestN}` : "Lanes —");
    },
    bind() {
      declareP0();
      ensureHud();
      paintPips();
      const startBtn = el("skeeStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = el("skeeCanvas");
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("pointerdown", (ev) => {
          if (run && (run.dying || run.done)) return;
          if (!isLive()) {
            punchStart();
            return;
          }
          ev.preventDefault();
          try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
          const p = kit.canvasPos(canvas, ev, W, H);
          beginAim(p.x);
        });
        canvas.addEventListener("pointermove", (ev) => {
          if (!run || !run.aim) return;
          ev.preventDefault();
          const p = kit.canvasPos(canvas, ev, W, H);
          updateAim(p.x);
        });
        const up = (ev) => {
          if (!run || !run.aim) return;
          ev.preventDefault();
          if (ev) {
            const p = kit.canvasPos(canvas, ev, W, H);
            updateAim(p.x);
          }
          releaseAim();
        };
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("lostpointercapture", up);
        canvas.addEventListener("pointerleave", up);
        canvas.addEventListener("pointercancel", up);
      }
      const copyBtn = el("skeeChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = lastDepth();
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("skeeCopied");
            if (copied) copied.hidden = false;
            setText("skeeStatus", "Copied — send it");
          }, () => {
            setText("skeeStatus", text);
          });
        });
      }
      stampDepthCopy();
      draw();
    },
  });
})();
