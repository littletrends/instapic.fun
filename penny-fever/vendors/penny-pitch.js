/* Penny Pitch Cloth — Desktop Grok owns this file. PF only. Never booth/port 6000. Never Imagine.
 * GOBLIN B04 AUTHORED — GOBLIN_AUTHORED_LEVELS_B04.md · hybrid + codaEnabled.
 * 8 unique CLOTHS (layout / cheat / verb), not a hotter needPts climb. Mount stageParams = coda only.
 * Honest Quilt → Soft Jerk → Diamond Grid → Dead Felt → Twin Drop → Ripple Cloth →
 * Mirror Pitch → Fever Cloth Opera → ENDLESS Mood Swing {n}.
 * SlingAim aim+drop. Stall owns 5-penny short_points death (shadow ctx).
 * HUD = CLOTH {n} · {name} · coda labeled ENDLESS. Don’t hide jerk. Death hold ≥700ms. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const W = 340;
  const H = 440;
  const GAME_ID = "pennypitch";
  const GRAVITY = 0.16;
  const PENNY_R = 8.4;
  const DROP_Y = 56;
  const CLOTH = { x: 28, y: 78, w: 284, h: 284 };
  const COLS = 5;
  const ROWS = 5;
  const CLEAR_BONUS = 250;
  const DEATH_HOLD_MS = 760;
  const JERK_DELAY = 210;
  const JERK_SLIDE = 0.11;
  const MAX_NEED = 5 * 30;
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const VAL_GRID = [
    [5, 10, 5, 10, 5],
    [10, 20, 15, 20, 10],
    [5, 15, 30, 15, 5],
    [10, 20, 15, 20, 10],
    [5, 10, 5, 10, 5],
  ];
  const VAL_COL = {
    5: "#4a7a48",
    10: "#3d8a8a",
    15: "#8a6230",
    20: "#c41e3a",
    30: "#d4a45a",
  };

  let run = null;
  let idleRaf = 0;
  let idleT = 0;
  let idleRoom = 1;
  let idleClock = 0;
  let hover = { x: W / 2, y: 220 };

  const AURA = {
    short_points: "Aura: Cloth jerked. Your pennies disagreed.",
    clear: "Aura: Colour landed. Cloth has opinions again.",
    deep: (n) => `Aura: Cloth ${n}. You're pitching through mood swings.`,
    leave: "Aura: Walking off mid-cloth? Pennies stay.",
    shallow: "Aura: Not a colour. The cloth kept the opinions.",
    souvenir: "Aura: Fever Cloth Opera survived. Souvenir — the squares sat still for you.",
  };

  /* B04 authored CLOTHS — unique geometry / cheat / verb. needPts climb is coda-only. */
  const AUTHORED = [
    {
      id: 1, name: "Honest Quilt", title: "Honest Quilt", kind: "teach",
      needPts: 30, jerk: "none", jerkChance: 0, jerkPx: 0,
      squareSize: "big", squareScale: 1.0, pennies: 5,
      diamond: false, deadFelt: false, twinDrop: false, ripple: false, mirrorAim: false,
      barker: "Honest Quilt. Aim, drop. Squares sit still. Land 30 in five pennies.",
    },
    {
      id: 2, name: "Soft Jerk", title: "Soft Jerk", kind: "jerk",
      needPts: 40, jerk: "rare", jerkChance: 0.2, jerkPx: 12,
      squareSize: "big", squareScale: 1.0, pennies: 5,
      diamond: false, deadFelt: false, twinDrop: false, ripple: false, mirrorAim: false,
      barker: "After release the cloth may jerk. You will see the slide.",
    },
    {
      id: 3, name: "Diamond Grid", title: "Diamond Grid", kind: "diamond",
      needPts: 45, jerk: "none", jerkChance: 0, jerkPx: 0,
      squareSize: "big", squareScale: 1.0, pennies: 5,
      diamond: true, deadFelt: false, twinDrop: false, ripple: false, mirrorAim: false,
      barker: "Squares rotated 45°. Same values. Aim diamonds, not the quilt in your head.",
    },
    {
      id: 4, name: "Dead Felt", title: "Dead Felt", kind: "deadFelt",
      needPts: 50, jerk: "none", jerkChance: 0, jerkPx: 0,
      squareSize: "big", squareScale: 1.0, pennies: 5,
      diamond: false, deadFelt: true, deadCell: { r: 2, c: 2 }, twinDrop: false, ripple: false, mirrorAim: false,
      barker: "Center gold looks like 30. It’s DEAD FELT. Scores 0. Live squares only.",
    },
    {
      id: 5, name: "Twin Drop", title: "Twin Drop", kind: "twinDrop",
      needPts: 55, jerk: "none", jerkChance: 0, jerkPx: 0,
      squareSize: "big", squareScale: 1.0, pennies: 5,
      diamond: false, deadFelt: false, twinDrop: true, ripple: false, mirrorAim: false,
      barker: "Land TWO pennies on the same colour family — or 55 pts. Pair OR points.",
    },
    {
      id: 6, name: "Ripple Cloth", title: "Ripple Cloth", kind: "ripple",
      needPts: 55, jerk: "rare", jerkChance: 0.18, jerkPx: 10,
      squareSize: "big", squareScale: 1.0, pennies: 5,
      diamond: false, deadFelt: false, twinDrop: false, ripple: true, mirrorAim: false,
      barker: "Cloth RIPPLES under the aim. Living geometry. Jerk still rare.",
    },
    {
      id: 7, name: "Mirror Pitch", title: "Mirror Pitch", kind: "mirrorAim",
      needPts: 60, jerk: "none", jerkChance: 0, jerkPx: 0,
      squareSize: "big", squareScale: 1.0, pennies: 5,
      diamond: false, deadFelt: false, twinDrop: false, ripple: false, mirrorAim: true,
      barker: "MIRROR — on release the drop flips left/right. Aim the other hand.",
    },
    {
      id: 8, name: "Fever Cloth Opera", title: "Fever Cloth Opera", kind: "comboFinale",
      needPts: 70, jerk: "hard", jerkChance: 0, jerkPx: 26,
      squareSize: "big", squareScale: 1.0, pennies: 5,
      diamond: true, deadFelt: true, deadCell: { r: 2, c: 2 }, twinDrop: false, ripple: true, mirrorAim: false,
      forceJerkAt: 2,
      barker: "Finale: diamond + dead felt + ripple + one hard jerk mid-set. Need 70.",
    },
  ];

  const P0_MOUNT = {
    engine: "SlingAim",
    displayName: "Penny Pitch Cloth",
    depthUnit: "Cloth",
    sheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
    authoredSheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
    codaSheet: "GOBLIN_BATCH04_MOUNT_CONFIGS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored CLOTHS then ENDLESS · 5 pennies · layout cheats, not hotter needPts",
    body: "Authored rooms, not a hotter loop: Honest Quilt → Soft Jerk (you watch the slide) → Diamond Grid (45°) → Dead Felt (fake 30) → Twin Drop (pair OR points) → Ripple Cloth → Mirror Pitch (release flips) → Fever Cloth Opera → ENDLESS Mood Swing. Aim, then drop. After release the cloth may jerk — tent-visible. Hit the need in five pennies or CLOTH stamps you. Don’t hide the jerk.",
    status: "Depth run · START · 1 demo coin · 8 authored CLOTHS then ENDLESS",
    machine: "Pitch cloth · 1 demo coin · authored CLOTHS",
    idleHud: ["LAND A COLOUR — CLOTH HAS OPINIONS", "START · 1 demo coin — 8 cloths, then ENDLESS"],
    punch: "Depth run — press START. Jerk is the cheat.",
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

  function pennypitchCoda(n) {
    const t = Math.max(1, (n | 0) - AUTHORED_COUNT);
    return {
      id: n,
      name: `Mood Swing ${n}`,
      title: `Mood Swing ${n}`,
      kind: "coda",
      needPts: Math.min(MAX_NEED - 10, 70 + 10 * t),
      jerk: "often",
      jerkChance: Math.min(0.9, 0.7 + 0.03 * t),
      jerkPx: Math.min(40, 28 + 2 * t),
      squareSize: "smaller",
      squareScale: Math.max(0.5, 0.7 - 0.03 * t),
      pennies: 5,
      diamond: t % 2 === 0,
      deadFelt: true,
      deadCell: { r: 2, c: 2 },
      twinDrop: false,
      ripple: true,
      mirrorAim: t % 3 === 0,
      coda: true,
      barker: `ENDLESS Mood Swing ${n} — smaller squares, often jerk. Cloth has opinions.`,
    };
  }

  function pennypitchStageParams(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[stage - 1]);
    if (!CODA_ENABLED) return null;
    return pennypitchCoda(stage);
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun || typeof kitRun.declare !== "function") return;
    try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
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

  function card() {
    return el("pennyPitchCard");
  }

  function cabinetOn() {
    const node = document.getElementById("cabinet-penny-pitch");
    return !!(node && !node.hidden);
  }

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function liveSpec() {
    if (run && run.spec) return run.spec;
    return pennypitchStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function stageEl() {
    const host = card();
    return (host && host.querySelector(".vendor-stage")) || null;
  }

  function cheatLabel(spec) {
    if (!spec) return "";
    if (spec.kind === "coda") return "ENDLESS · MOOD SWING";
    if (spec.kind === "comboFinale") return "DIAMOND + DEAD FELT + RIPPLE + JERK";
    if (spec.kind === "mirrorAim" || spec.mirrorAim) return "MIRROR — RELEASE FLIPS";
    if (spec.kind === "ripple" || spec.ripple) return "CLOTH RIPPLES — LIVING GRID";
    if (spec.kind === "twinDrop" || spec.twinDrop) return "PAIR A COLOUR — OR HIT THE NEED";
    if (spec.kind === "deadFelt" || spec.deadFelt) return "DEAD FELT LOOKS LIKE 30";
    if (spec.kind === "diamond" || spec.diamond) return "DIAMOND GRID — 45°";
    if (spec.jerkChance > 0 || spec.forceJerkAt != null) return "CLOTH SLIDES MID-FLIGHT";
    return "";
  }

  function hudLine(spec, playing) {
    if (!spec) return "CLOTH 0";
    const name = spec.name || spec.title || "Cloth";
    if (spec.coda) return `ENDLESS · CLOTH ${playing} · ${name}`;
    return `CLOTH ${playing} · ${name}`;
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
      hud.textContent = "CLOTH 0";
      hud.hidden = true;
    }
    return hud;
  }

  function ensurePips(count) {
    const stage = stageEl();
    if (!stage) return null;
    let span = stage.querySelector(`[data-runkit-strikes="${GAME_ID}"]`);
    const n = Math.max(5, count | 0);
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
    const max = (spec && spec.pennies) || 5;
    const span = ensurePips(max);
    if (!span) return;
    const used = (isLive() || (run && run.dying)) ? Math.max(0, max - (run.penniesLeft | 0)) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < used));
  }

  function resetPips() {
    const host = card();
    const pips = (host && host.querySelector("[data-runkit-strikes]")) || document.querySelector("[data-runkit-strikes=\"pennypitch\"]");
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
      /* Launcher only. Stall owns 5-penny short_points death.
       * missesToDeath is huge so SlingAim.resolveHit cannot steal the run.
       * Shadow ctx so reportDepth/finishRun cannot steal the coin run. */
      return engines.SlingAim.mount(el("pennyPitchCanvas") || card(), {
        gravity: GRAVITY,
        missesToDeath: 99,
        stageParams: pennypitchStageParams,
        onThrow() { kit.sfx("drop"); },
        hitTest() { return false; },
      }, shadowCtx(ctx));
    } catch (_) {
      return null;
    }
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

  function punchStart() {
    stampDepthCopy();
    setText("pennyPitchStatus", DEPTH_COPY.punch);
    const btn = el("pennyPitchStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function clothGeom(spec, ox, oy) {
    const scale = spec.squareScale || 1;
    const inner = CLOTH.w * scale;
    const x = CLOTH.x + (CLOTH.w - inner) / 2 + (ox || 0);
    const y = CLOTH.y + (CLOTH.h - inner) / 2 + (oy || 0);
    return { x, y, w: inner, h: inner, cell: inner / COLS };
  }

  function rippleShift(spec, r, c, cell) {
    if (!spec || !(spec.ripple || spec.kind === "ripple" || spec.kind === "comboFinale")) return { x: 0, y: 0 };
    const t = run ? run.t : idleT;
    const u = (r + c) * 0.72 + t * 0.0032;
    return {
      x: Math.sin(u) * cell * 0.22,
      y: Math.cos(u * 0.85) * cell * 0.16,
    };
  }

  function cellRect(spec, g, r, c) {
    const ripple = rippleShift(spec, r, c, g.cell);
    return {
      x: g.x + c * g.cell + ripple.x,
      y: g.y + r * g.cell + ripple.y,
      w: g.cell,
      h: g.cell,
    };
  }

  function isDeadCell(spec, r, c) {
    if (!spec || !(spec.deadFelt || spec.kind === "deadFelt" || spec.kind === "comboFinale")) return false;
    const dead = spec.deadCell || { r: 2, c: 2 };
    return r === dead.r && c === dead.c;
  }

  function colourFamily(v) {
    if (v >= 30) return "gold";
    if (v >= 20) return "red";
    if (v >= 15) return "brown";
    if (v >= 10) return "teal";
    return "green";
  }

  function pointInDiamond(px, py, box) {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const hw = box.w * 0.48;
    const hh = box.h * 0.48;
    return (Math.abs(px - cx) / hw) + (Math.abs(py - cy) / hh) <= 1;
  }

  function drawDiamond(ctx, box) {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const hw = box.w * 0.46;
    const hh = box.h * 0.46;
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
  }

  function clampAim(x, y, spec) {
    const g = clothGeom(spec || pennypitchStageParams(1), 0, 0);
    return {
      x: kit.clamp(x, g.x + 8, g.x + g.w - 8),
      y: kit.clamp(y, Math.max(DROP_Y + 18, g.y + 8), g.y + g.h - 8),
    };
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
    const canvas = el("pennyPitchCanvas");
    if (canvas) {
      canvas.style.touchAction = "none";
      canvas.classList.toggle("is-locked", !isLive());
    }
    if (!isLive() && (!run || run.done)) setText("pennyPitchStatus", DEPTH_COPY.status);
  }

  function drawPenny(ctx, x, y, r, ghost) {
    ctx.save();
    ctx.globalAlpha = ghost ? 0.4 : 1;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, "#f7e2b0");
    g.addColorStop(0.55, "#d4a45a");
    g.addColorStop(1, "#8a6230");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "#5a3a18";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.fillStyle = "#3a2418";
    ctx.font = "8px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("1¢", x, y + 0.5);
    ctx.restore();
  }

  function drawCloth(ctx, spec, ox, oy, lastCell) {
    const g = clothGeom(spec, ox, oy);
    ctx.fillStyle = "#5a2418";
    ctx.fillRect(CLOTH.x - 8, CLOTH.y - 8, CLOTH.w + 16, CLOTH.h + 16);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 3;
    ctx.strokeRect(CLOTH.x - 8.5, CLOTH.y - 8.5, CLOTH.w + 15, CLOTH.h + 15);
    if (spec.ripple || spec.kind === "ripple" || spec.kind === "comboFinale") {
      ctx.strokeStyle = "rgba(184,232,224,0.4)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 6]);
      const wave = Math.sin((run ? run.t : idleT) * 0.003) * 8;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y + g.h * 0.35 + wave);
      ctx.quadraticCurveTo(g.x + g.w * 0.5, g.y + g.h * 0.28 - wave, g.x + g.w, g.y + g.h * 0.35 + wave);
      ctx.moveTo(g.x, g.y + g.h * 0.65 - wave);
      ctx.quadraticCurveTo(g.x + g.w * 0.5, g.y + g.h * 0.72 + wave, g.x + g.w, g.y + g.h * 0.65 - wave);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const diamond = !!(spec.diamond || spec.kind === "diamond" || spec.kind === "comboFinale");
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const v = VAL_GRID[r][c];
        const box = cellRect(spec, g, r, c);
        const dead = isDeadCell(spec, r, c);
        ctx.fillStyle = VAL_COL[v] || "#4a7a48";
        if (diamond) {
          drawDiamond(ctx, box);
          ctx.fill();
        } else {
          ctx.fillRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
        }
        if (dead) {
          ctx.fillStyle = "rgba(8,4,8,0.28)";
          if (diamond) {
            drawDiamond(ctx, box);
            ctx.fill();
          } else {
            ctx.fillRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
          }
          ctx.strokeStyle = "rgba(232,160,184,0.85)";
          ctx.lineWidth = 1.6;
          ctx.setLineDash([3, 3]);
          if (diamond) {
            drawDiamond(ctx, box);
            ctx.stroke();
          } else {
            ctx.strokeRect(box.x + 3, box.y + 3, box.w - 6, box.h - 6);
          }
          ctx.setLineDash([]);
        }
        if (lastCell && lastCell.c === c && lastCell.r === r) {
          ctx.strokeStyle = lastCell.dead ? "#e8a0b8" : "#fff6ec";
          ctx.lineWidth = 2.4;
          if (diamond) {
            drawDiamond(ctx, box);
            ctx.stroke();
          } else {
            ctx.strokeRect(box.x + 2, box.y + 2, box.w - 4, box.h - 4);
          }
        }
        ctx.fillStyle = dead ? "rgba(232,160,184,0.95)" : "rgba(255,246,236,0.9)";
        ctx.font = "bold 12px Georgia, serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(dead ? "30" : String(v), box.x + box.w / 2, box.y + box.h / 2);
      }
    }
    const cheat = cheatLabel(spec);
    if (cheat && !(run && run.jerkFlash > 0)) {
      ctx.fillStyle = "rgba(232,160,184,0.92)";
      ctx.font = "bold 10px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(cheat, W / 2, CLOTH.y - 14);
    }
  }

  function drawPips(ctx, left, total) {
    const n = total || 5;
    for (let i = 0; i < n; i += 1) {
      const x = 18 + i * 16;
      ctx.beginPath();
      ctx.arc(x, H - 14, 5, 0, Math.PI * 2);
      ctx.fillStyle = i < left ? "#d4a45a" : "rgba(212,164,90,0.18)";
      ctx.fill();
      ctx.strokeStyle = "#5a3a18";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  function draw() {
    const canvas = el("pennyPitchCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (run) run.shake = kit.applyShake(ctx, run.shake || 0);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#241018");
    bg.addColorStop(1, "#0c080c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const spec = liveSpec();
    const breath = (!run || run.done) ? Math.sin(idleT * 0.003) * 2 : 0;
    const idleJerk = (!run || run.done) && spec.jerkChance > 0
      ? Math.sin(idleT * 0.005) * (spec.jerkPx || 10)
      : 0;
    const ox = (run && run.jerk ? run.jerk.x : 0) + breath + idleJerk;
    const oy = (run && run.jerk ? run.jerk.y : 0) + breath * 0.4 + idleJerk * 0.4;
    drawCloth(ctx, spec, ox, oy, run && run.lastCell);

    if (run && run.landed) {
      const g = clothGeom(spec, ox, oy);
      run.landed.forEach((chip) => {
        const box = cellRect(spec, g, chip.r, chip.c);
        drawPenny(ctx, box.x + box.w / 2, box.y + box.h / 2, PENNY_R * 0.82, false);
      });
    }

    if (run && run.penny && run.penny.mark) {
      ctx.strokeStyle = "rgba(240,208,154,0.7)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(run.penny.mark.x, run.penny.mark.y, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(240,208,154,0.9)";
      ctx.font = "bold 9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("AIM", run.penny.mark.x, run.penny.mark.y - 12);
    }

    if (run && run.penny) {
      drawPenny(ctx, run.penny.x, run.penny.y, run.penny.r, false);
    } else if (isLive() && run.penniesLeft > 0 && run.pause <= 0) {
      const aim = clampAim(hover.x, hover.y, spec);
      drawPenny(ctx, aim.x, DROP_Y, PENNY_R, true);
      ctx.strokeStyle = "rgba(240,208,154,0.35)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(aim.x, DROP_Y + 10);
      ctx.lineTo(aim.x, aim.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(aim.x, aim.y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = run.aiming ? "rgba(240,208,154,0.85)" : "rgba(240,208,154,0.5)";
      ctx.stroke();
      if (spec.mirrorAim) {
        const mx = CLOTH.x + CLOTH.w - (aim.x - CLOTH.x);
        ctx.beginPath();
        ctx.arc(mx, aim.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(232,160,184,0.7)";
        ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(232,160,184,0.9)";
        ctx.font = "bold 9px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("MIRROR", mx, aim.y - 12);
      }
      if (run.aiming) {
        ctx.fillStyle = "rgba(240,208,154,0.9)";
        ctx.font = "bold 10px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("DROP", aim.x, aim.y - 12);
      }
    }

    if (run && run.jerkFlash > 0) {
      ctx.fillStyle = `rgba(232,160,184,${Math.min(0.55, run.jerkFlash / 480)})`;
      ctx.fillRect(CLOTH.x - 10, CLOTH.y - 32, CLOTH.w + 20, 26);
      ctx.fillStyle = "#fff6ec";
      ctx.font = "bold 12px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(run.jerkFlashLabel || "CLOTH JERKED — MID-FLIGHT", W / 2, CLOTH.y - 14);
      const p = 1 - Math.min(1, run.jerkFlash / 760);
      ctx.strokeStyle = `rgba(232,160,184,${1 - p})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(W / 2 + ox, CLOTH.y + CLOTH.h * 0.45 + oy, 18 + p * 90, 10 + p * 36, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (run && run.stealFlash > 0) {
      ctx.fillStyle = `rgba(196,30,58,${Math.min(0.5, run.stealFlash / 480)})`;
      ctx.fillRect(CLOTH.x - 10, H - 48, CLOTH.w + 20, 22);
      ctx.fillStyle = "#fff6ec";
      ctx.font = "bold 11px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("DEAD FELT — LOOKED LIKE 30", W / 2, H - 33);
    }

    drawPips(ctx, run && !run.done ? run.penniesLeft : 5, 5);

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, "CLOTH");

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    if (run && !run.done) {
      kit.drawHud(ctx, W, [
        `${spec.title} · ${run.stagePts}/${spec.needPts}${spec.twinDrop ? ` · PAIR ${run.pairHits || 0}` : ""} · ${run.penniesLeft}¢`,
        `${hudLine(spec, run.stage)} · ${run.score}${run.jerking ? " · JERK" : ""}`,
      ]);
    } else if (!run || !run.closedStamp) {
      kit.drawHud(ctx, W, DEPTH_COPY.idleHud);
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
    const spec = pennypitchStageParams(n);
    if (!spec) return;
    run.stage = spec.id;
    run.spec = spec;
    run.penniesLeft = spec.pennies;
    run.stagePts = 0;
    run.penny = null;
    run.landed = [];
    run.jerk = { x: 0, y: 0 };
    run.jerkTo = { x: 0, y: 0 };
    run.jerkQueue = [];
    run.jerking = false;
    run.jerkFlash = 0;
    run.jerkFlashLabel = "";
    run.stealFlash = 0;
    run.lastCell = null;
    run.aiming = false;
    run.families = {};
    run.pairHits = 0;
    run.pause = n === 1 ? 0 : 360;
    tellDepth(run.depth);
    ensureHud();
    paintPips();
    setText("pennyPitchStatus", spec.barker || `${spec.title} — need ${spec.needPts} in ${spec.pennies} pennies.`);
  }

  function start() {
    if (isLive()) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("pennyPitchStatus", "Out of demo coins · grant a pass");
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
      spec: pennypitchStageParams(1),
      penniesLeft: 5,
      stagePts: 0,
      penny: null,
      landed: [],
      jerk: { x: 0, y: 0 },
      jerkTo: { x: 0, y: 0 },
      jerkQueue: [],
      jerking: false,
      jerkFlash: 0,
      jerkFlashLabel: "",
      stealFlash: 0,
      lastCell: null,
      families: {},
      pairHits: 0,
      aiming: false,
      pause: 0,
      shake: 0,
      closedStamp: false,
      deathHold: 0,
      deathNote: "short_points",
    };
    run.sling = mountSling(kitRun);
    tellDepth(0);
    const startBtn = el("pennyPitchStart");
    if (startBtn) startBtn.disabled = true;
    const verdict = el("pennyPitchVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("pennyPitchResult");
    PF.setTier("pennyPitchTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    startStage(1);
    PF.focusCard("pennyPitchCard", true);
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

  function cellAt(px, py) {
    const spec = run.spec;
    const g = clothGeom(spec, run.jerk.x, run.jerk.y);
    const diamond = !!(spec.diamond || spec.kind === "diamond" || spec.kind === "comboFinale");
    let hit = null;
    let best = Infinity;
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const box = cellRect(spec, g, r, c);
        const inside = diamond
          ? pointInDiamond(px, py, box)
          : (px >= box.x && px < box.x + box.w && py >= box.y && py < box.y + box.h);
        if (inside) {
          const cx = box.x + box.w / 2;
          const cy = box.y + box.h / 2;
          const d = Math.hypot(px - cx, py - cy);
          if (d < best) {
            best = d;
            hit = { c, r, v: VAL_GRID[r][c], box, nx: (px - box.x) / box.w, ny: (py - box.y) / box.h };
          }
        }
      }
    }
    return hit;
  }

  function applyDeadFelt(cell) {
    if (!cell || !isDeadCell(run.spec, cell.r, cell.c)) return cell;
    run.stealFlash = 640;
    kit.sfx("shove");
    setText("pennyPitchStatus", "Dead felt. Looked like 30 — scored 0.");
    PF.setAura("laugh");
    return { c: cell.c, r: cell.r, v: 0, dead: true };
  }

  function twinClear() {
    if (!run.spec.twinDrop) return false;
    return (run.pairHits | 0) >= 2;
  }

  function landPenny() {
    const p = run.penny;
    let cell = cellAt(p.x, p.y);
    cell = applyDeadFelt(cell);
    const val = cell ? cell.v : 0;
    run.lastCell = cell;
    if (cell) run.landed.push(cell);
    run.stagePts += val;
    run.score += val;
    if (run.kitRun) run.kitRun.score = run.score;
    if (run.spec.twinDrop && cell && val > 0) {
      const fam = colourFamily(val);
      run.families = run.families || {};
      run.families[fam] = (run.families[fam] || 0) + 1;
      run.pairHits = Math.max(run.pairHits || 0, run.families[fam]);
    }
    run.penny = null;
    run.jerking = false;
    run.jerkQueue = [];
    run.pause = 420;
    paintPips();
    kit.sfx(val ? "tray" : "miss");
    if (!cell || !cell.dead) {
      setText("pennyPitchStatus", val
        ? `${val} on the cloth${run.spec.twinDrop ? ` · ${colourFamily(val)} ${run.families[colourFamily(val)] || 1}` : ""}. ${run.stagePts}/${run.spec.needPts} · ${run.penniesLeft} left`
        : `Off the colour. ${run.stagePts}/${run.spec.needPts} · ${run.penniesLeft} left`);
    }
    if (run.stagePts >= run.spec.needPts || twinClear()) {
      clearStage();
    } else if (run.penniesLeft <= 0) {
      finish("short_points");
    }
  }

  function clearStage() {
    run.score += CLEAR_BONUS;
    run.depth += 1;
    if (run.kitRun) {
      run.kitRun.depth = run.depth;
      run.kitRun.score = run.score;
    }
    tellDepth(run.depth);
    kit.sfx("rack");
    PF.setAura("celebrate");
    const next = pennypitchStageParams(run.depth + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    setText("pennyPitchStatus", run.depth >= 6
      ? AURA.deep(run.depth)
      : `${AURA.clear} ${next.title} — ${next.twinDrop ? "pair a colour or " : ""}need ${next.needPts}.`);
    startStage(run.depth + 1);
  }

  function beginAim(x, y) {
    if (!isLive() || run.penny || run.pause > 0) return;
    if (run.penniesLeft <= 0) return;
    const aim = clampAim(x, y, run.spec);
    hover = aim;
    run.aiming = true;
    if (run.sling && typeof run.sling.beginPull === "function") {
      run.sling.beginPull(aim.x, DROP_Y);
    }
  }

  function updateAim(x, y) {
    if (!run || !run.aiming) return;
    hover = clampAim(x, y, run.spec);
    if (run.sling && typeof run.sling.movePull === "function") {
      run.sling.movePull(hover.x, hover.y);
    }
  }

  function queueJerks(willJerk) {
    const mag = run.spec.jerkPx || 0;
    run.jerkQueue = [];
    if (!willJerk || mag <= 0) return;
    const kick = (scale) => ({
      x: (Math.random() * 2 - 1) * mag * (scale || 1),
      y: (Math.random() * 2 - 1) * mag * 0.55 * (scale || 1),
    });
    const first = kick(1);
    run.jerkQueue.push({ at: run.t + JERK_DELAY, to: first, label: "CLOTH JERKED — MID-FLIGHT" });
    if (run.spec.doubleJerk) {
      run.jerkQueue.push({
        at: run.t + JERK_DELAY + 280,
        to: { x: -first.x * 0.92, y: -first.y * 0.92 },
        label: "SECOND JERK — REVERSED, STILL IN THE AIR",
      });
    }
  }

  function applyJerk(next) {
    run.shake = 14;
    run.jerkFlash = 760;
    run.jerkFlashLabel = next.label;
    run.jerkTo.x = next.to.x;
    run.jerkTo.y = next.to.y;
    kit.sfx("shove");
    setText("pennyPitchStatus", next.label && next.label.indexOf("REVERSED") >= 0
      ? "Second jerk REVERSED — still mid-flight."
      : "Cloth jerked — you can watch the slide.");
    PF.setAura("laugh");
  }

  function flushJerks() {
    if (!run || !run.jerkQueue || !run.jerkQueue.length) return;
    while (run.jerkQueue.length) applyJerk(run.jerkQueue.shift());
    run.jerk.x = run.jerkTo.x;
    run.jerk.y = run.jerkTo.y;
  }

  function dropAt() {
    if (!isLive() || !run.aiming || run.penny || run.pause > 0) {
      if (run) run.aiming = false;
      return;
    }
    if (run.penniesLeft <= 0) {
      run.aiming = false;
      return;
    }
    const aim = clampAim(hover.x, hover.y, run.spec);
    run.aiming = false;
    run.penniesLeft -= 1;
    paintPips();
    const used = run.spec.pennies - run.penniesLeft - 1;
    const force = run.spec.forceJerkAt != null && used === run.spec.forceJerkAt;
    const willJerk = force || Math.random() < (run.spec.jerkChance || 0);
    queueJerks(willJerk);
    const destX = run.spec.mirrorAim ? (CLOTH.x + CLOTH.w - (aim.x - CLOTH.x)) : aim.x;
    run.jerking = willJerk;
    if (run.sling && typeof run.sling.release === "function") run.sling.release();
    run.penny = {
      x: aim.x,
      y: DROP_Y,
      r: PENNY_R,
      vx: 0,
      vy: 1.05,
      destX,
      destY: aim.y,
      life: 0,
      mark: { x: destX, y: aim.y },
      minAir: willJerk ? (force ? 720 : 480) : 220,
    };
    kit.sfx("drop");
    setText("pennyPitchStatus", run.spec.mirrorAim
      ? "Mirror drop — the penny flipped."
      : willJerk ? "Penny’s in the air… watch the cloth slide." : "Penny dropping.");
  }

  function step(dt) {
    const k = dt / 16;
    run.jerkFlash = Math.max(0, (run.jerkFlash || 0) - dt);
    run.stealFlash = Math.max(0, (run.stealFlash || 0) - dt);
    if (run.jerkQueue && run.jerkQueue.length) {
      const next = run.jerkQueue[0];
      if (run.t >= next.at) {
        run.jerkQueue.shift();
        applyJerk(next);
      }
    }
    const slide = Math.min(1, JERK_SLIDE * k);
    run.jerk.x += (run.jerkTo.x - run.jerk.x) * slide;
    run.jerk.y += (run.jerkTo.y - run.jerk.y) * slide;
    if (!run.jerking) {
      run.jerkTo.x += (0 - run.jerkTo.x) * Math.min(1, 0.08 * k);
      run.jerkTo.y += (0 - run.jerkTo.y) * Math.min(1, 0.08 * k);
    }
    if (run.pause > 0) {
      run.pause -= dt;
      return;
    }
    const p = run.penny;
    if (!p) return;
    p.life = (p.life || 0) + dt;
    p.vy += GRAVITY * k;
    p.y += p.vy * k;
    p.x += (p.destX - p.x) * Math.min(1, 0.18 * k);
    if (p.y >= p.destY) {
      p.y = p.destY;
      p.x = p.destX;
      if (p.life < (p.minAir || 0)) return;
      flushJerks();
      landPenny();
    }
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (depth <= 0) return AURA.shallow;
    if (rk() && typeof rk().auraDeathLine === "function") {
      const line = rk().auraDeathLine(GAME_ID, depth, reason || "short_points");
      if (line) return `Aura: ${String(line).replace(/^Aura:\s*/i, "")}`;
    }
    if (depth >= 6) return AURA.deep(depth);
    return AURA.short_points;
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave" || reason === "souvenir") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.aiming = false;
    run.deathNote = reason || "short_points";
    run.closedStamp = true;
    run.deathHold = DEATH_HOLD_MS;
    kit.sfx("stamp");
    run.shake = 8;
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    run.aiming = false;
    if (run.raf) cancelAnimationFrame(run.raf);
    run.closedStamp = reason !== "leave" && reason !== "souvenir";
    const depth = run.depth;
    const score = run.score;
    const death = reason === "leave" ? "leave" : reason === "souvenir" ? "souvenir" : "short_points";
    persistDepth({
      depth,
      score,
      deathReason: death,
      cashedOut: reason === "souvenir",
      meta: { stage: run.spec && run.spec.id, stagePts: run.stagePts, kind: run.spec && run.spec.kind, coda: !!(run.spec && run.spec.coda) },
    });
    stampDepthCopy();
    const startBtn = el("pennyPitchStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "PITCH AGAIN · 1 demo coin";
    }
    PF.focusCard("pennyPitchCard", false);
    kit.setMode(card(), "result");
    const line = `CLOTH ${depth} · SCORE ${score}`;
    const aura = auraLine(reason, depth);
    const challenge = challengeLine(depth);
    const verdict = el("pennyPitchVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = reason === "leave"
        ? `Left the cloth · ${line}`
        : reason === "souvenir"
          ? `Souvenir. ${line}.`
          : `Short points. ${line}.`;
    }
    kit.fillResult({
      root: "pennyPitchResult",
      depth: "pennyPitchResultDepth",
      score: "pennyPitchResultScore",
      aura: "pennyPitchResultAura",
      copied: "pennyPitchCopied",
    }, {
      depthLine: `CLOTH ${depth}`,
      scoreLine: `SCORE ${score} · ${death.replace(/_/g, " ").toUpperCase()}`,
      auraLine: aura,
    });
    const reasonNode = el("pennyPitchResultReason");
    if (reasonNode) reasonNode.textContent = death.replace(/_/g, " ").toUpperCase();
    setText("pennyPitchChallengeText", challenge);
    PF.setTier("pennyPitchTier", depth > 0 ? `CLOTH ${depth}` : "CLOTH", depth > 0 || reason === "souvenir" ? "perfect" : "miss");
    setText("pennyPitchStatus", reason === "leave" ? "Left the cloth." : reason === "souvenir" ? "Cloth sat still for you." : "Cloth stamped the pennies.");
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
    draw();
    startIdle();
  }

  PF.registerVendor({
    id: "penny-pitch",
    playKey: "pennypitch",
    chalk: "Land a colour. Cloth has opinions.",
    defaults: { bestPennyPitch: 0, bestPennyPitchScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopIdle();
    },
    onShow() { declareP0(); stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      const verdict = el("pennyPitchVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("pennyPitchResult");
      const startBtn = el("pennyPitchStart");
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
      setText("depthPitchNow", isLive() || (run && run.dying) ? String(run.depth) : "0");
      const bestN = Math.max(state.bestPennyPitch || 0, (state.bestDepth && state.bestDepth.pennypitch) || 0);
      setText("depthPitchBest", bestN ? String(bestN) : "—");
      setText("depthPitchScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("depthPitchBestScore", state.bestPennyPitchScore ? String(state.bestPennyPitchScore) : "—");
      setText("pennyPitchDoorBest", bestN ? `Best cloth ${bestN}` : "Cloths —");
    },
    bind() {
      declareP0();
      ensureHud();
      paintPips();
      const startBtn = el("pennyPitchStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = el("pennyPitchCanvas");
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("pointermove", (ev) => {
          const p = kit.canvasPos(canvas, ev, W, H);
          if (isLive() && run && run.aiming) {
            ev.preventDefault();
            updateAim(p.x, p.y);
          } else {
            hover = p;
          }
        });
        canvas.addEventListener("pointerdown", (ev) => {
          if (run && (run.dying || run.done)) return;
          if (!isLive()) {
            punchStart();
            return;
          }
          ev.preventDefault();
          try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
          const p = kit.canvasPos(canvas, ev, W, H);
          hover = p;
          beginAim(p.x, p.y);
        });
        const up = (ev) => {
          if (!run || !run.aiming) return;
          ev.preventDefault();
          const p = kit.canvasPos(canvas, ev, W, H);
          updateAim(p.x, p.y);
          dropAt();
        };
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("lostpointercapture", up);
        canvas.addEventListener("pointerleave", up);
        canvas.addEventListener("pointercancel", up);
      }
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
      stampDepthCopy();
      draw();
    },
  });
})();
