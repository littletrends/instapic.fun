/* Plinko Pegboard — Desktop Grok owns this file. PF only. Never booth/port 6000. Never Imagine.
 * GOBLIN B03 AUTHORED 2026-09-05 — 8 DROP rooms, not a hotter-slot climb.
 * GOBLIN_AUTHORED_LEVELS_B03.md + GOBLIN_BATCH03_MOUNT_CONFIGS.md + GOBLIN_RUNKIT_API.md
 * Engine: Custom · depthUnit: Drop · gameId: plinko · codaEnabled hybrid
 * Soft Breath → Mid Tide → Funnel Lie → Dead Peg Gallery → Gate Row
 * → Twin Slot Contract → Mirror Drop → Fever Peg Opera → ENDLESS Dead Peg Rows {n}.
 * HUD = DROP {n} · {name} · death = chips exhausted. Leftover chips stay in the house.
 * Don’t: pure RNG · hide tilt breath · same loop hotter targetSlotMin. Death hold ≥700ms. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const W = 340;
  const H = 500;
  const GAME_ID = "plinko";
  const TAU = Math.PI * 2;
  const ROWS = 9;
  const SLOTS = 10;
  const CHIP_R = 7.2;
  const PEG_R = 4.1;
  const BOARD = { x: 28, y: 52, w: 284, h: 392 };
  const SLOT_Y = BOARD.y + BOARD.h - 28;
  const DROP_Y = BOARD.y + 18;
  const DEATH_HOLD_MS = 760;
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const SLOT_LABELS = ["ZILCH", "NICKEL", "DIME", "TICKET", "STUB", "STAR", "RIBBON", "CROWN", "FEVER", "AURA"];

  let run = null;
  let idleRaf = 0;
  let idleRoom = 1;
  let idleClock = 0;
  let idlePegs = null;
  let idleGates = null;
  let hoverLane = 2;

  const AURA = {
    exhaust: "Aura: Three chips, no prize slot. The board breathed without you.",
    deadpeg: "Aura: That peg ate your chip. That’s the house.",
    funnel: "Aura: The funnel looked like a highway. It spat you wide.",
    gate: "Aura: The gate was shut. You dropped the closed beat.",
    twin: "Aura: One paying chip isn’t a contract. Need two.",
    mirror: "Aura: You picked left. It fell right.",
    shallow: "Aura: Not a single drop. Drop when it leans your way.",
    mid: "Aura: Cute slots. The board still lies.",
    deep: (n) => `Aura: Drop ${n}. You timed the breath.`,
    coda: (n) => `Aura: ENDLESS drop ${n}. You dropped with the lie.`,
    leave: "Aura: You walked mid-drop. Chips stay in the house.",
    clear: "Aura: Slot paid. Leftover chips stay in the house.",
    souvenir: "Aura: Eight drops locked. Souvenir — the board salutes.",
  };

  /* Authored DROP rooms — unique board / cheat / win rule. Not “same 5 lanes, hotter target.” */
  const AUTHORED = [
    {
      id: 1, name: "Soft Breath Board", kind: "teach", targetSlotMin: 3, chips: 3, tiltAmp: 0.08, tiltHz: 0.35,
      dropLanes: 5, deadPegEveryNthRow: 0, biasFromEntry: true, funnelLie: false, slideGate: false,
      twinNeed: 0, mirror: false, golden: false, teachPulse: true,
      barker: "Even grid. Low breath. Need slot ≥ 3. Drop when the pendulum leans with PAY.",
    },
    {
      id: 2, name: "Mid Tide", kind: "tide", targetSlotMin: 4, chips: 3, tiltAmp: 0.16, tiltHz: 0.4,
      dropLanes: 5, deadPegEveryNthRow: 0, biasFromEntry: true, funnelLie: false, slideGate: false,
      twinNeed: 0, mirror: false, golden: false, teachPulse: false,
      barker: "Same grid, bigger breath. Need ≥ 4. Ride the mid tide.",
    },
    {
      id: 3, name: "Funnel Lie", kind: "funnel", targetSlotMin: 5, chips: 3, tiltAmp: 0.16, tiltHz: 0.42,
      dropLanes: 5, deadPegEveryNthRow: 0, biasFromEntry: true, funnelLie: true, slideGate: false,
      twinNeed: 0, mirror: false, golden: false, teachPulse: false,
      barker: "Looks like a PAY highway. Bottom kicks you wide. Need ≥ 5. Beat the silhouette.",
    },
    {
      id: 4, name: "Dead Peg Gallery", kind: "dead", targetSlotMin: 5, chips: 3, tiltAmp: 0.16, tiltHz: 0.45,
      dropLanes: 5, deadPegEveryNthRow: 3, biasFromEntry: true, funnelLie: false, slideGate: false,
      twinNeed: 0, mirror: false, golden: false, teachPulse: false,
      barker: "Every third row hides a swallow peg. Need ≥ 5. Time the lane past EAT.",
    },
    {
      id: 5, name: "Gate Row", kind: "gate", targetSlotMin: 6, chips: 3, tiltAmp: 0.18, tiltHz: 0.45,
      dropLanes: 5, deadPegEveryNthRow: 0, biasFromEntry: true, funnelLie: false, slideGate: true,
      gateMs: 1600, twinNeed: 0, mirror: false, golden: false, teachPulse: false,
      barker: "Mid-board gate opens and shuts. Drop through the gap. Need ≥ 6.",
    },
    {
      id: 6, name: "Twin Slot Contract", kind: "twin", targetSlotMin: 5, chips: 3, tiltAmp: 0.16, tiltHz: 0.45,
      dropLanes: 5, deadPegEveryNthRow: 0, biasFromEntry: true, funnelLie: false, slideGate: false,
      twinNeed: 2, mirror: false, golden: false, teachPulse: false,
      barker: "Two chips must land ≥ 5. One hero chip doesn’t clear. Three chips total.",
    },
    {
      id: 7, name: "Mirror Drop", kind: "mirror", targetSlotMin: 6, chips: 3, tiltAmp: 0.28, tiltHz: 0.5,
      dropLanes: 5, deadPegEveryNthRow: 0, biasFromEntry: true, funnelLie: false, slideGate: false,
      twinNeed: 0, mirror: true, golden: false, teachPulse: false,
      barker: "Pick left, it falls right. High breath. Need ≥ 6. Remap your aim.",
    },
    {
      id: 8, name: "Fever Peg Opera", kind: "fever", targetSlotMin: 7, chips: 3, tiltAmp: 0.28, tiltHz: 0.52,
      dropLanes: 5, deadPegEveryNthRow: 3, biasFromEntry: true, funnelLie: true, slideGate: true,
      gateMs: 1500, twinNeed: 0, mirror: false, golden: true, teachPulse: false,
      barker: "Funnel + dead rows + gate + high breath. Golden peg nudges PAY. Need ≥ 7.",
    },
  ];

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Plinko Pegboard",
    depthUnit: "Drop",
    sheet: "GOBLIN_AUTHORED_LEVELS_B03.md",
    batchSheet: "GOBLIN_BATCH03_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored DROPS then ENDLESS · drop with the breath",
    body: "Authored drops, not a thinner loop: Soft Breath Board → Mid Tide → Funnel Lie (highway silhouette kicks wide) → Dead Peg Gallery (swallow rows) → Gate Row (sliding gate) → Twin Slot Contract (two paying chips) → Mirror Drop (left falls right) → Fever Peg Opera (funnel + dead + gate + golden peg) → ENDLESS Dead Peg Rows. Tap a top lane. Time the tilt. Land slot ≥ the room target. Three chips. Fail all three and HOUSE stamps the board.",
    status: "Depth run · START · 1 demo coin · 8 authored DROPS then ENDLESS",
    machine: "Pegboard · 1 demo coin · authored DROPS",
    idleHud: ["Authored PLINKO — each drop is a different board", "Lanes · slots 0–9 · 3 chips · tent shows the tilt · START"],
    punch: "Depth run — press START, then DROP with the breath. No one-tap prize.",
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

  function plinkoCoda(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const t = stage - AUTHORED_COUNT;
    return {
      id: stage,
      name: `Dead Peg Rows ${stage}`,
      title: `Dead Peg Rows ${stage}`,
      kind: "coda",
      targetSlotMin: Math.min(8, 6 + Math.floor(t / 2)),
      chips: 3,
      tiltAmp: 0.28,
      tiltHz: Math.min(0.7, 0.5 + 0.02 * t),
      dropLanes: 5,
      deadPegEveryNthRow: 3,
      biasFromEntry: true,
      funnelLie: true,
      slideGate: t % 2 === 0,
      gateMs: 1500,
      twinNeed: 0,
      mirror: false,
      golden: t % 3 === 0,
      teachPulse: false,
      coda: true,
      barker: "ENDLESS — dead pegs, funnel, high tilt. Drop with the breath.",
    };
  }

  function roomTell(spec) {
    if (!spec) return "DROP WITH THE BREATH";
    if (spec.coda) return "ENDLESS · DEAD PEG ROWS";
    if (spec.kind === "funnel" || spec.funnelLie) return spec.kind === "fever"
      ? "FUNNEL + DEAD + GATE + GOLDEN PEG"
      : "HIGHWAY LIE · BOTTOM KICKS WIDE";
    if (spec.kind === "dead") return "SWALLOW PEGS EVERY THIRD ROW";
    if (spec.kind === "gate" || spec.slideGate) return "GATE OPENS AND SHUTS · DROP THE GAP";
    if (spec.kind === "twin") return "TWO CHIPS ≥ 5 · ONE HERO DOESN’T CLEAR";
    if (spec.kind === "mirror") return "PICK LEFT · FALLS RIGHT";
    if (spec.kind === "fever") return "FUNNEL + DEAD + GATE + GOLDEN PEG";
    if (spec.kind === "tide") return "MID TIDE · RIDE THE BIGGER BREATH";
    if (spec.coda) return "ENDLESS · DEAD PEG ROWS";
    return "DROP WHEN THE PENDULUM LEANS WITH PAY";
  }

  function attractSpec() {
    return plinkoStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function attractPegs() {
    if (!idlePegs) idlePegs = buildPegs(attractSpec());
    return idlePegs;
  }

  function attractGates() {
    if (!idleGates) idleGates = buildGates(attractSpec());
    return idleGates;
  }

  function drawRoomCard(ctx, spec, ms) {
    if (!spec || !(ms > 0)) return;
    const a = Math.min(1, ms / 220);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(12,6,9,0.92)";
    ctx.fillRect(22, 168, W - 44, 100);
    ctx.strokeStyle = spec.coda ? "#e8a0b8" : "#f0d09a";
    ctx.lineWidth = 2.2;
    ctx.strokeRect(22.5, 168.5, W - 45, 99);
    ctx.fillStyle = spec.coda ? "#e8a0b8" : "#d4a45a";
    ctx.font = "bold 11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(spec.coda ? "ENDLESS DROP" : "AUTHORED DROP", W / 2, 190);
    ctx.fillStyle = "#fff6ec";
    ctx.font = "bold 20px Georgia, serif";
    ctx.fillText(spec.name, W / 2, 218);
    ctx.fillStyle = "#e8a0b8";
    ctx.font = "11px Georgia, serif";
    ctx.fillText(roomTell(spec), W / 2, 246);
    ctx.restore();
  }

  function plinkoStageParams(n) {
    const stage = Math.max(1, n | 0);
    let spec;
    if (stage <= AUTHORED_COUNT) {
      spec = Object.assign({}, AUTHORED[stage - 1]);
    } else if (!CODA_ENABLED) {
      return null;
    } else {
      spec = plinkoCoda(stage);
    }
    spec.title = spec.name;
    return spec;
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: plinkoStageParams,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      codaParams: plinkoCoda,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function cabinetOn() {
    const node = document.getElementById("cabinet-plinko");
    return !!(node && !node.hidden);
  }

  function punchStart() {
    stampDepthCopy();
    setText("plinkoStatus", DEPTH_COPY.punch);
    const btn = el("plinkoStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function ensureHud() {
    const host = card();
    const stage = host && host.querySelector(".vendor-stage");
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
      const spec = run.spec || plinkoStageParams(Math.max(1, (run.depth | 0) + 1));
      const playing = spec.id || Math.max(1, (run.depth | 0) + 1);
      hud.textContent = spec.coda
        ? `ENDLESS · DROP ${playing} · ${spec.name}`
        : `DROP ${playing} · ${spec.name}`;
      hud.hidden = false;
    } else {
      hud.textContent = "DROP 0";
      hud.hidden = true;
    }
    paintPips();
    return hud;
  }

  function ensurePips() {
    const host = card();
    const stage = host && host.querySelector(".vendor-stage");
    if (!stage) return null;
    let span = stage.querySelector(`[data-runkit-strikes="${GAME_ID}"]`);
    if (!span) {
      span = document.createElement("span");
      span.className = "strike-pips";
      span.dataset.runkitStrikes = GAME_ID;
      span.setAttribute("aria-hidden", "true");
      span.innerHTML = "<i></i><i></i><i></i>";
      stage.appendChild(span);
    }
    return span;
  }

  function paintPips() {
    const span = ensurePips();
    if (!span) return;
    const spec = (run && run.spec) || plinkoStageParams(1);
    const max = spec.chips || 3;
    const used = isLive() || (run && run.dying) ? Math.max(0, max - (run.chipsLeft | 0)) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < used));
  }

  function challengeLine(n) {
    const kitRun = rk();
    if (kitRun && typeof kitRun.challengeText === "function") {
      try { return kitRun.challengeText("Plinko drop", n | 0, GAME_ID); } catch (_) { /* authored */ }
    }
    return `Beat my Plinko drop ${n | 0} on Penny Fever`;
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
      deathReason: partial.deathReason || "chips exhausted",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestPlinko = Math.max(state.bestPlinko || 0, payload.depth);
      state.bestPlinkoScore = Math.max(state.bestPlinkoScore || 0, payload.score);
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function tellDepth(n) {
    const depth = n | 0;
    if (run && run.kitRun) run.kitRun.depth = depth;
    const spec = (run && run.spec) || plinkoStageParams(Math.max(1, depth));
    if (run && run.kitRun && rk() && typeof rk().reportDepth === "function") {
      try { rk().reportDepth(run.kitRun, depth, { name: spec.name, coda: !!spec.coda }); } catch (_) { /* optional */ }
    }
    ensureHud();
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function card() {
    return el("plinkoCard");
  }

  function snapPhase(spec, tMs) {
    if (!spec || !spec.snapBreath) return 0;
    const hz = spec.tiltHz != null ? spec.tiltHz : 0.4;
    const phase = ((tMs / 1000) * hz) % 1;
    return phase >= 0.64 ? (phase - 0.64) / 0.36 : 0;
  }

  function boardTilt(spec, tMs) {
    const hz = spec && spec.tiltHz != null ? spec.tiltHz : 0.35;
    const amp = spec && spec.tiltAmp != null ? spec.tiltAmp : 0.08;
    if (spec && spec.snapBreath) {
      const cycles = (tMs / 1000) * hz;
      const i = Math.floor(cycles);
      const phase = cycles - i;
      const dir = i % 2 === 0 ? 1 : -1;
      if (phase < 0.64) return dir * amp * (0.62 + phase * 0.2);
      const s = (phase - 0.64) / 0.36;
      const ease = s * s * (3 - 2 * s);
      return kit.lerp(dir * amp * 0.75, -dir * amp, ease);
    }
    return Math.sin((tMs / 1000) * hz * TAU) * amp;
  }

  function kickRailX() {
    return BOARD.x + BOARD.w * 0.62;
  }

  function slotW() {
    return BOARD.w / SLOTS;
  }

  function laneX(lane, lanes) {
    const n = lanes || 5;
    const i = clamp(lane | 0, 0, n - 1);
    return BOARD.x + slotW() * (1 + i * ((SLOTS - 2) / (n - 1)));
  }

  function slotFromX(x) {
    return clamp(Math.floor((x - BOARD.x) / slotW()), 0, SLOTS - 1);
  }

  function buildGates(spec) {
    if (!spec || !spec.gates) return [];
    const n = spec.dropLanes || 3;
    const walls = [];
    const xs = [];
    for (let i = 0; i < n; i += 1) xs.push(laneX(i, n));
    for (let i = 0; i < n - 1; i += 1) {
      walls.push({
        x: (xs[i] + xs[i + 1]) / 2,
        y0: BOARD.y + 16,
        y1: SLOT_Y - 6,
        w: 7,
      });
    }
    return walls;
  }

  function buildPegs(spec) {
    const pegs = [];
    const every = spec.deadPegEveryNthRow | 0;
    const inner = BOARD.w - 12;
    const spacing = inner / (SLOTS - 1);
    const y0 = BOARD.y + 44;
    const ySpan = SLOT_Y - y0 - 18;
    let goldPlaced = false;
    for (let r = 0; r < ROWS; r += 1) {
      const odd = r % 2 === 1;
      const count = odd ? SLOTS : SLOTS - 1;
      const offset = odd ? 0 : spacing / 2;
      const y = y0 + (r / (ROWS - 1)) * ySpan;
      const deadRow = every > 0 && ((r + 1) % every === 0);
      const deadCol = deadRow ? ((r * 3 + 2) % count) : -1;
      for (let c = 0; c < count; c += 1) {
        const dead = c === deadCol;
        const golden = !!(spec.golden && !goldPlaced && !dead && r === 4 && c === Math.min(count - 1, count - 2));
        if (golden) goldPlaced = true;
        pegs.push({
          x: BOARD.x + 6 + offset + c * spacing,
          y,
          r: PEG_R,
          dead,
          golden,
          row: r,
        });
      }
    }
    return pegs;
  }

  function gateState(spec, tMs) {
    if (!spec || !spec.slideGate) return null;
    const period = spec.gateMs || 1600;
    const phase = ((tMs % period) / period);
    const open = phase > 0.3 && phase < 0.72;
    const telegraph = phase > 0.18 && phase < 0.3;
    const y = BOARD.y + BOARD.h * 0.48;
    const gapX = BOARD.x + BOARD.w * (0.22 + 0.56 * (0.5 + 0.5 * Math.sin(tMs * 0.0018)));
    return { y, open, telegraph, gapX, gapW: open ? 58 : 10, h: 10 };
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
    const canvas = el("plinkoCanvas");
    if (canvas) {
      const live = isLive();
      canvas.style.pointerEvents = live ? "auto" : "none";
      canvas.style.touchAction = "none";
      canvas.classList.toggle("is-locked", !live);
    }
    ensureHud();
    paintPips();
    if (!isLive() && el("plinkoStatus") && (!run || run.done)) {
      el("plinkoStatus").textContent = DEPTH_COPY.status;
    }
  }

  function spawnSparks(x, y, n, color) {
    if (!run) return;
    run.sparks = run.sparks || [];
    for (let i = 0; i < n; i += 1) {
      const a = Math.random() * TAU;
      const s = 0.4 + Math.random() * 1.8;
      run.sparks.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.3,
        life: 200 + Math.random() * 180, color: color || "#f0d09a",
      });
    }
  }

  function stepFx(dt) {
    if (!run) return;
    const k = dt / 16;
    if (run.sparks) {
      run.sparks = run.sparks.filter((s) => {
        s.life -= dt;
        s.x += s.vx * k;
        s.y += s.vy * k;
        return s.life > 0;
      });
    }
    if (run.trail) {
      run.trail = run.trail.filter((p) => {
        p.life -= dt;
        return p.life > 0;
      });
    }
    run.toastMs = Math.max(0, (run.toastMs || 0) - dt);
    run.roomCardMs = Math.max(0, (run.roomCardMs || 0) - dt);
    run.slotPop = Math.max(0, (run.slotPop || 0) - dt);
    run.gustFlash = Math.max(0, (run.gustFlash || 0) - dt);
    run.kickFlash = Math.max(0, (run.kickFlash || 0) - dt);
    if (run.houseFly) {
      run.houseFly = run.houseFly.filter((c) => {
        c.life -= dt;
        c.x += (c.vx || 0) * k;
        c.y += (c.vy || 0) * k;
        c.vx = (c.vx || 0) + (28 - c.x) * 0.004 * dt;
        c.vy = (c.vy || 0) + 0.08 * k;
        c.spin = (c.spin || 0) + 0.12 * k;
        if (c.x < 42 && c.y > H - 100) c.life = 0;
        return c.life > 0;
      });
    }
  }

  function drawChip(ctx, x, y, r, ghost, absorbed, spin) {
    ctx.save();
    ctx.globalAlpha = ghost ? 0.42 : (absorbed ? 0.55 : 1);
    ctx.translate(x, y);
    if (spin) ctx.rotate(spin);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.12, 0, 0, r);
    g.addColorStop(0, ghost ? "#fff6ec" : "#f7e2b0");
    g.addColorStop(0.55, absorbed ? "#8a3030" : "#d4a45a");
    g.addColorStop(1, absorbed ? "#4a1010" : "#8a6230");
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = absorbed ? "#c41e3a" : "#5a3a18";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, TAU);
    ctx.strokeStyle = "rgba(90,58,20,0.45)";
    ctx.stroke();
    ctx.fillStyle = absorbed ? "#c41e3a" : "#3a2418";
    ctx.font = "8px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("1¢", 0, 0.5);
    ctx.restore();
  }

  function drawPeg(ctx, peg, pulse) {
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, peg.r, 0, TAU);
    if (peg.golden) {
      ctx.fillStyle = pulse ? "#f0d09a" : "#d4a45a";
      ctx.fill();
      ctx.strokeStyle = "#fff6ec";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = "#3a2418";
      ctx.font = "bold 7px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("GOLD", peg.x, peg.y - peg.r - 2);
      ctx.textBaseline = "alphabetic";
      return;
    }
    if (peg.dead) {
      ctx.fillStyle = pulse ? "#c41e3a" : "#6a1018";
      ctx.fill();
      ctx.strokeStyle = "#f0d09a";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(peg.x - 3.2, peg.y - 3.2);
      ctx.lineTo(peg.x + 3.2, peg.y + 3.2);
      ctx.moveTo(peg.x + 3.2, peg.y - 3.2);
      ctx.lineTo(peg.x - 3.2, peg.y + 3.2);
      ctx.strokeStyle = "#f0d09a";
      ctx.lineWidth = 1;
      ctx.stroke();
      if (pulse) {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.r + 3.2, 0, TAU);
        ctx.strokeStyle = "rgba(196,30,58,0.55)";
        ctx.stroke();
        ctx.fillStyle = "#e8a0b8";
        ctx.font = "bold 7px Georgia, serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("EAT", peg.x, peg.y - peg.r - 3);
        ctx.textBaseline = "alphabetic";
      }
    } else {
      ctx.fillStyle = "#d4a45a";
      ctx.fill();
      ctx.strokeStyle = "#5a3a18";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(peg.x - 1.1, peg.y - 1.2, 1.15, 0, TAU);
      ctx.fillStyle = "rgba(255,246,236,0.55)";
      ctx.fill();
    }
  }

  function drawSlots(ctx, spec, lastSlot, lastOk, tilt) {
    const w = slotW();
    const need = spec.targetSlotMin;
    const payLean = tilt > 0.012;
    for (let i = 0; i < SLOTS; i += 1) {
      const x = BOARD.x + i * w;
      const ok = i >= need;
      const pulseOn = spec.teachPulse && (((run ? run.t : performance.now()) / 280) | 0) % 2 === 0;
      const glow = ok && (payLean || pulseOn);
      ctx.fillStyle = glow ? "rgba(61,138,138,0.72)" : ok ? "rgba(61,138,138,0.38)" : "rgba(18,8,12,0.72)";
      ctx.fillRect(x + 1, SLOT_Y, w - 2, 26);
      if (lastSlot === i) {
        const pop = run && run.slotPop > 0 ? 1.5 : 0;
        ctx.strokeStyle = lastOk ? "#e8a0b8" : "#c41e3a";
        ctx.lineWidth = 2 + pop;
        ctx.strokeRect(x + 1.5, SLOT_Y + 0.5, w - 3, 25);
      } else {
        ctx.strokeStyle = glow ? "#b8e8e0" : ok ? "rgba(240,208,154,0.55)" : "rgba(212,164,90,0.22)";
        ctx.lineWidth = glow ? 1.6 : 1;
        ctx.strokeRect(x + 1.5, SLOT_Y + 0.5, w - 3, 25);
      }
      ctx.fillStyle = ok ? "#f0d09a" : "#8a6a58";
      ctx.font = "bold 11px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(String(i), x + w / 2, SLOT_Y + 12);
      ctx.font = "7px Georgia, serif";
      ctx.fillStyle = glow ? "#fff6ec" : ok ? "#e8a0b8" : "#6a4a40";
      ctx.fillText(SLOT_LABELS[i], x + w / 2, SLOT_Y + 22);
    }
  }

  function shownTilt(spec, tilt) {
    return spec && spec.liarPendulum ? -tilt : tilt;
  }

  function drawLanes(ctx, spec, selected, tilt) {
    const n = spec.dropLanes || 5;
    const shown = shownTilt(spec, tilt);
    const payLean = shown > 0.012;
    for (let i = 0; i < n; i += 1) {
      const x = laneX(i, n);
      const hot = i === selected;
      const favor = payLean && i >= Math.floor(n / 2);
      ctx.beginPath();
      ctx.moveTo(x, BOARD.y + 4);
      ctx.lineTo(x - 7, BOARD.y + 16);
      ctx.lineTo(x + 7, BOARD.y + 16);
      ctx.closePath();
      ctx.fillStyle = hot ? "#f0d09a" : favor ? "rgba(61,138,138,0.7)" : "rgba(212,164,90,0.4)";
      ctx.fill();
      ctx.strokeStyle = hot ? "#fff6ec" : "rgba(90,58,24,0.7)";
      ctx.lineWidth = hot ? 1.6 : 1;
      ctx.stroke();
    }
    const leanX = W / 2 + shown * 110;
    ctx.strokeStyle = spec.liarPendulum ? "rgba(196,30,58,0.95)" : "rgba(232,160,184,0.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2, 10);
    ctx.lineTo(leanX, 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, 10, 4, 0, TAU);
    ctx.fillStyle = "#d4a45a";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(leanX, 32, 6, 0, TAU);
    ctx.fillStyle = spec.liarPendulum ? "#c41e3a" : "#e8a0b8";
    ctx.fill();
    ctx.strokeStyle = "#fff6ec";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.textAlign = "center";
    let breath;
    if (spec.liarPendulum) {
      breath = "PENDULUM LIES — READ THE BOARD";
    } else if (spec.snapBreath) {
      breath = snapPhase(spec, run ? run.t : performance.now()) > 0 ? "SNAP → DROP" : "HOLD — WAIT THE SNAP";
    } else if (spec.kickRail) {
      breath = shown > 0.06 ? "RAIL OPEN → PAY" : "KICK RAIL SHUT — LEAN RIGHT";
    } else if (shown > 0.02) {
      breath = "DROP NOW → PAY";
    } else if (shown < -0.02) {
      breath = "← BREATH AGAINST PAY";
    } else {
      breath = "WAIT THE BREATH";
    }
    ctx.font = (shown > 0.02 && !spec.liarPendulum) || spec.liarPendulum ? "bold 12px Georgia, serif" : "9px Georgia, serif";
    ctx.fillStyle = spec.liarPendulum ? "#e8a0b8" : shown > 0.02 ? "#b8e8e0" : "#f0d09a";
    ctx.fillText(breath, W / 2, 46);
  }

  function drawGlory(ctx, spec, depth) {
    ctx.save();
    ctx.fillStyle = "rgba(12,6,9,0.9)";
    ctx.fillRect(12, H - 62, W - 24, 54);
    ctx.strokeStyle = "rgba(212,164,90,0.74)";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(12.5, H - 61.5, W - 25, 53);
    ctx.fillStyle = "#f0d09a";
    ctx.font = "bold 32px Georgia, serif";
    ctx.textAlign = "center";
    const playing = spec.id || depth;
    ctx.fillText(spec.coda ? `ENDLESS ${playing}` : `DROP ${playing}`, W / 2, H - 32);
    ctx.font = "11px Georgia, serif";
    ctx.fillStyle = spec.coda ? "#e8a0b8" : "#d4a45a";
    ctx.fillText(spec.coda ? `ENDLESS · ${spec.name}` : spec.name, W / 2, H - 14);
    ctx.restore();
  }

  function drawBoard(ctx, spec, tMs, pegs) {
    const tilt = boardTilt(spec, tMs);
    const cx = W / 2;
    const cy = BOARD.y + BOARD.h * 0.46;
    ctx.save();
    ctx.translate(cx, cy);
    const tiltMul = spec.kind === "high" || spec.coda ? 1.48 : spec.kind === "teach" ? 0.9 : 1.12;
    ctx.rotate(tilt * tiltMul);
    ctx.translate(-cx, -cy);

    kit.fillWood(ctx, BOARD.x - 8, BOARD.y - 8, BOARD.w + 16, BOARD.h + 36);
    ctx.fillStyle = "rgba(8,4,8,0.38)";
    ctx.fillRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 3;
    ctx.strokeRect(BOARD.x + 0.5, BOARD.y + 0.5, BOARD.w - 1, BOARD.h - 1);

    ctx.strokeStyle = "rgba(196,30,58,0.38)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    const needX = BOARD.x + spec.targetSlotMin * slotW();
    ctx.beginPath();
    ctx.moveTo(needX, BOARD.y + 22);
    ctx.lineTo(needX, SLOT_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(196,30,58,0.72)";
    ctx.font = "9px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText(`PAY ≥ ${spec.targetSlotMin}`, needX + 4, BOARD.y + 20);
    if (spec.liarPendulum) {
      ctx.fillStyle = "rgba(12,6,9,0.72)";
      ctx.fillRect(BOARD.x + 18, BOARD.y + 24, BOARD.w - 36, 18);
      ctx.fillStyle = "#b8e8e0";
      ctx.font = "bold 13px Georgia, serif";
      ctx.textAlign = "center";
      const trueTxt = tilt > 0.012 ? "TRUE LEAN →  DROP RIGHT" : tilt < -0.012 ? "← TRUE LEAN  DROP LEFT" : "TRUE FLAT — WAIT";
      ctx.fillText(trueTxt, W / 2, BOARD.y + 38);
    }
    if (spec.kind === "aim" || spec.kind === "high" || spec.kickRail) {
      ctx.fillStyle = "rgba(61,138,138,0.18)";
      ctx.fillRect(needX, BOARD.y + 22, BOARD.x + BOARD.w - needX, SLOT_Y - BOARD.y - 22);
      ctx.fillStyle = "#b8e8e0";
      ctx.font = "bold 9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("PAY IS THIS SIDE", (needX + BOARD.x + BOARD.w) / 2, BOARD.y + 48);
    }

    if (spec.kickRail) {
      const railX = kickRailX();
      const open = tilt > 0.06;
      ctx.fillStyle = open ? "rgba(61,138,138,0.28)" : "rgba(138,98,48,0.82)";
      ctx.fillRect(railX - 4, BOARD.y + 36, 8, SLOT_Y - BOARD.y - 48);
      ctx.strokeStyle = open ? "#b8e8e0" : "#d4a45a";
      ctx.lineWidth = 2;
      ctx.strokeRect(railX - 4.5, BOARD.y + 36.5, 9, SLOT_Y - BOARD.y - 49);
      ctx.save();
      ctx.translate(railX, BOARD.y + 90);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = open ? "#fff6ec" : "#f0d09a";
      ctx.font = "bold 10px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(open ? "OPEN" : "KICK", 0, 3);
      ctx.restore();
      if (run && run.kickFlash > 0) {
        const shove = !!(run.chip && run.chip.railBoost);
        ctx.fillStyle = shove
          ? `rgba(61,138,138,${Math.min(0.42, run.kickFlash / 240)})`
          : `rgba(212,164,90,${Math.min(0.4, run.kickFlash / 420)})`;
        ctx.fillRect(railX - 14, BOARD.y + 36, 28, SLOT_Y - BOARD.y - 48);
        ctx.save();
        ctx.translate(railX, BOARD.y + 150);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = shove ? "#b8e8e0" : "#f0d09a";
        ctx.font = "bold 14px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(shove ? "SHOVE" : "KICK", 0, 4);
        ctx.restore();
      }
    }

    if (spec.snapBreath) {
      const snap = snapPhase(spec, tMs);
      if (snap > 0) {
        ctx.fillStyle = `rgba(196,30,58,${0.18 + 0.35 * snap})`;
        ctx.fillRect(BOARD.x + 8, BOARD.y + 8, BOARD.w - 16, 22);
        ctx.fillStyle = "#fff6ec";
        ctx.font = "bold 13px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("SNAP — DROP NOW", W / 2, BOARD.y + 24);
      } else {
        ctx.fillStyle = "rgba(12,6,9,0.55)";
        ctx.fillRect(BOARD.x + 28, BOARD.y + 8, BOARD.w - 56, 18);
        ctx.fillStyle = "#e8a0b8";
        ctx.font = "bold 10px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("HOLD — WAIT THE SNAP", W / 2, BOARD.y + 21);
      }
    }

    if (spec.gust) {
      ctx.fillStyle = "rgba(12,6,9,0.55)";
      ctx.fillRect(BOARD.x + 40, SLOT_Y - 36, BOARD.w - 80, 16);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "bold 9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("GUST LINE — BREATH FLIPS HERE", W / 2, SLOT_Y - 24);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(232,160,184,0.7)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(BOARD.x + 8, BOARD.y + BOARD.h * 0.42);
      ctx.lineTo(BOARD.x + BOARD.w - 8, BOARD.y + BOARD.h * 0.42);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (spec.funnelLie) {
      const payX = BOARD.x + spec.targetSlotMin * slotW();
      ctx.strokeStyle = "rgba(196,30,58,0.62)";
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(BOARD.x + 18, BOARD.y + 26);
      ctx.lineTo(payX - 8, SLOT_Y - 10);
      ctx.moveTo(BOARD.x + BOARD.w - 18, BOARD.y + 26);
      ctx.lineTo(payX + slotW() * 2, SLOT_Y - 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(12,6,9,0.7)";
      ctx.fillRect(BOARD.x + 40, BOARD.y + 26, BOARD.w - 80, 16);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "bold 9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("HIGHWAY LIE — BOTTOM KICKS WIDE", W / 2, BOARD.y + 38);
    }

    const gate = gateState(spec, tMs);
    if (gate) {
      ctx.fillStyle = gate.open ? "rgba(61,138,138,0.35)" : "rgba(196,30,58,0.55)";
      ctx.fillRect(BOARD.x + 6, gate.y, BOARD.w - 12, gate.h);
      ctx.fillStyle = gate.open ? "rgba(8,4,8,0.15)" : "rgba(12,6,9,0.85)";
      ctx.fillRect(BOARD.x + 6, gate.y, Math.max(0, gate.gapX - gate.gapW / 2 - (BOARD.x + 6)), gate.h);
      ctx.fillRect(gate.gapX + gate.gapW / 2, gate.y, Math.max(0, BOARD.x + BOARD.w - 6 - (gate.gapX + gate.gapW / 2)), gate.h);
      ctx.strokeStyle = gate.telegraph ? "#f0d09a" : (gate.open ? "#b8e8e0" : "#c41e3a");
      ctx.lineWidth = 2;
      ctx.strokeRect(gate.gapX - gate.gapW / 2, gate.y - 1, gate.gapW, gate.h + 2);
      ctx.fillStyle = gate.telegraph ? "#f0d09a" : (gate.open ? "#b8e8e0" : "#e8a0b8");
      ctx.font = "bold 9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(gate.telegraph ? "GATE CLOSING" : (gate.open ? "GATE OPEN" : "GATE SHUT"), W / 2, gate.y - 4);
    }

    if (spec.kind === "narrow" && (spec.dropLanes || 5) === 3) {
      const n = 3;
      ctx.strokeStyle = "rgba(240,208,154,0.35)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 5]);
      for (let i = 0; i < n; i += 1) {
        const x = laneX(i, n);
        ctx.beginPath();
        ctx.moveTo(x, BOARD.y + 18);
        ctx.lineTo(x, SLOT_Y - 4);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    const gates = (run && run.gates) || buildGates(spec);
    if (gates.length) {
      gates.forEach((g) => {
        ctx.fillStyle = "rgba(58,36,24,0.92)";
        ctx.fillRect(g.x - g.w / 2, g.y0, g.w, g.y1 - g.y0);
        ctx.strokeStyle = "#d4a45a";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(g.x - g.w / 2 + 0.5, g.y0 + 0.5, g.w - 1, g.y1 - g.y0 - 1);
        ctx.fillStyle = "rgba(196,30,58,0.35)";
        ctx.fillRect(g.x - 1, g.y0, 2, g.y1 - g.y0);
      });
    }

    const pulse = ((tMs / 220) | 0) % 2 === 0;
    pegs.forEach((peg) => drawPeg(ctx, peg, pulse));
    drawSlots(ctx, spec, run && run.lastSlot, run && run.lastOk, tilt);
    drawLanes(ctx, spec, run ? run.lane : hoverLane, tilt);

    if (run && run.trail) {
      run.trail.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life / 280) * 0.45;
        ctx.fillStyle = "#d4a45a";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, TAU);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    if (run && run.chip) {
      drawChip(ctx, run.chip.x, run.chip.y, run.chip.r, false, run.chip.absorbed, run.chip.spin);
    } else if (run && !run.done && !run.dying && run.chipsLeft > 0 && !run.pause) {
      const nL = spec.dropLanes || 5;
      const pick = clamp(run.lane, 0, nL - 1);
      const fall = spec.mirror ? nL - 1 - pick : pick;
      if (spec.mirror) {
        drawChip(ctx, laneX(pick, nL), DROP_Y + Math.sin(tMs / 180) * 1.4, CHIP_R, true, false, 0);
        ctx.fillStyle = "#e8a0b8";
        ctx.font = "bold 8px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("PICK", laneX(pick, nL), DROP_Y - 10);
        ctx.fillText("FALLS", laneX(fall, nL), DROP_Y - 10);
      }
      drawChip(ctx, laneX(fall, nL), DROP_Y + Math.sin(tMs / 180) * 1.4, CHIP_R, false, false, 0);
    } else if (!run || run.done) {
      drawChip(ctx, laneX(hoverLane, spec.dropLanes), DROP_Y, CHIP_R, true, false, 0);
    }

    ctx.restore();
    return tilt;
  }

  function draw() {
    const canvas = el("plinkoCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1a1020");
    bg.addColorStop(1, "#0c080c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const spec = run ? run.spec : attractSpec();
    const tMs = run ? run.t : performance.now();
    const pegs = run ? run.pegs : attractPegs();
    const tilt = drawBoard(ctx, spec, tMs, pegs);

    if (run && run.sparks) {
      run.sparks.forEach((s) => {
        ctx.globalAlpha = Math.max(0, s.life / 320);
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x - 1.1, s.y - 1.1, 2.2, 2.2);
      });
      ctx.globalAlpha = 1;
    }

    if (run && run.toastMs > 0 && run.toast && !(run.roomCardMs > 80)) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, run.toastMs / 180);
      ctx.fillStyle = "rgba(12,6,9,0.82)";
      ctx.fillRect(40, 210, W - 80, 28);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "12px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(run.toast, W / 2, 228);
      ctx.restore();
    }

    if (run && run.gustFlash > 0) {
      ctx.fillStyle = `rgba(232,160,184,${Math.min(0.32, run.gustFlash / 720)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "bold 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("GUST", W / 2, H * 0.4);
    }

    if (run && run.roomCardMs > 0) drawRoomCard(ctx, spec, run.roomCardMs);

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, "HOUSE");

    if (run && run.houseFly) {
      run.houseFly.forEach((c) => {
        drawChip(ctx, c.x, c.y, CHIP_R * 0.72, false, false, c.spin || 0);
      });
    }
    if ((run && run.houseChips) || (run && run.houseFly && run.houseFly.length)) {
      ctx.fillStyle = "rgba(12,6,9,0.72)";
      ctx.fillRect(8, H - 86, 58, 22);
      ctx.strokeStyle = "rgba(138,98,48,0.8)";
      ctx.strokeRect(8.5, H - 85.5, 57, 21);
      ctx.fillStyle = "#8a6230";
      ctx.font = "9px Georgia, serif";
      ctx.textAlign = "left";
      ctx.fillText(`HOUSE ${run.houseChips || 0}`, 12, H - 71);
    }

    if (isLive() || (run && run.dying)) {
      drawGlory(ctx, spec, spec.id || run.depth);
      ctx.fillStyle = spec.liarPendulum ? "#e8a0b8" : "#d4a45a";
      ctx.font = "11px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(roomTell(spec), W / 2, BOARD.y - 14);
      ctx.fillStyle = "#d4a45a";
      ctx.fillText(`need ≥ ${spec.targetSlotMin} · chips ${run.chipsLeft}/${spec.chips} · leftover unused · slots ${run.slotSum | 0}`, W / 2, BOARD.y - 2);
    } else if (!run || !run.closedStamp) {
      kit.drawHud(ctx, W, [
        `${spec.name} — ${roomTell(spec)}`,
        DEPTH_COPY.idleHud[1],
      ]);
    }
  }

  function stopIdle() {
    if (idleRaf) cancelAnimationFrame(idleRaf);
    idleRaf = 0;
  }

  function startIdle() {
    if (isLive()) return;
    stopIdle();
    idleClock = 0;
    let last = 0;
    const tick = (now) => {
      if (isLive()) {
        idleRaf = 0;
        return;
      }
      if (!last) last = now;
      idleClock += Math.min(32, now - last);
      last = now;
      if (idleClock > 3800) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        const spec = attractSpec();
        idlePegs = buildPegs(spec);
        idleGates = buildGates(spec);
      }
      draw();
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }

  function startStage(n) {
    const spec = plinkoStageParams(n);
    if (!spec) {
      finish("souvenir");
      return;
    }
    run.spec = spec;
    run.pegs = buildPegs(spec);
    run.gates = buildGates(spec);
    run.lane = clamp(run.lane, 0, (spec.dropLanes || 5) - 1);
    hoverLane = run.lane;
    run.chipsLeft = spec.chips;
    run.chip = null;
    run.stageHit = false;
    run.qualifyCount = 0;
    run.lastSlot = -1;
    run.lastOk = false;
    run.pause = 0;
    run.absorbing = 0;
    run.lastPeg = null;
    run.ignorePegMs = 0;
    run.trail = [];
    tellDepth(run.depth);
    paintPips();
    run.roomCardMs = spec.id === 1 ? 1280 : 1180;
    if (spec.id > 1) kit.sfx("chapter");
    setText("plinkoStatus", `${spec.name} — ${spec.barker}`);
  }

  function start() {
    if (isLive()) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("plinkoStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      stampDepthCopy();
      return;
    }
    stopIdle();
    run = {
      done: false,
      dying: false,
      kitRun,
      t: 0,
      last: 0,
      raf: 0,
      depth: 0,
      score: 0,
      lane: hoverLane,
      spec: plinkoStageParams(1),
      pegs: [],
      gates: [],
      chipsLeft: 3,
      chip: null,
      stageHit: false,
      qualifyCount: 0,
      lastSlot: -1,
      lastOk: false,
      pause: 0,
      absorbing: 0,
      lastPeg: null,
      ignorePegMs: 0,
      closedStamp: false,
      deathHold: 0,
      deathReason: "",
      deathNote: "",
      slotSum: 0,
      sparks: [],
      trail: [],
      toast: "",
      toastMs: 0,
      slotPop: 0,
      gustFlash: 0,
      kickFlash: 0,
      houseChips: 0,
      houseFly: [],
      roomCardMs: 1280,
    };
    tellDepth(0);
    paintPips();
    const startBtn = el("plinkoStart");
    if (startBtn) startBtn.disabled = true;
    const dropBtn = el("plinkoDrop");
    if (dropBtn) dropBtn.hidden = false;
    const verdict = el("plinkoVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("plinkoResult");
    PF.setTier("plinkoTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    startStage(1);
    PF.focusCard("plinkoCard", true);
    PF.setAura("think");
    const loop = (now) => {
      if (!run || run.done) return;
      if (!run.last) run.last = now;
      const dt = Math.min(32, now - run.last);
      run.last = now;
      run.t += dt;
      if (run.dying) {
        stepFx(dt);
        draw();
        run.deathHold -= dt;
        if (run.deathHold <= 0) {
          sealResult(run.deathReason);
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

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("plinko")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function bounceOffPeg(chip, peg, spec, tilt) {
    const dx = chip.x - peg.x;
    const dy = chip.y - peg.y;
    const d = Math.hypot(dx, dy) || 0.0001;
    const nx = dx / d;
    const ny = dy / d;
    const minD = chip.r + peg.r + 0.4;
    chip.x = peg.x + nx * minD;
    chip.y = peg.y + ny * minD;
    const tiltKick = spec.kind === "fever" || spec.coda || spec.kind === "mirror" ? 3.2 : spec.kind === "teach" ? 2.05 : 2.55;
    let pRight = 0.5 + tilt * tiltKick;
    if (spec.biasFromEntry) {
      pRight += nx * 0.16;
      pRight += clamp(chip.vx * 0.09, -0.18, 0.18);
      pRight += (chip.laneBias || 0);
    }
    if (spec.funnelLie && chip.y > BOARD.y + BOARD.h * 0.55) pRight -= 0.22;
    if (spec.kind === "teach") pRight = clamp(pRight, 0.28, 0.72);
    else pRight = clamp(pRight, 0.14, 0.86);
    const goRight = Math.random() < pRight;
    const kick = 1.55 + Math.random() * 0.7;
    chip.vx = (goRight ? 1 : -1) * kick + tilt * 1.35;
    chip.vy = Math.max(0.55, Math.abs(chip.vy) * 0.28 + 0.7);
    if (peg.golden) {
      chip.vx += 1.65;
      chip.goldNudge = true;
      run.toast = "GOLDEN PEG · +SLOT NUDGE";
      run.toastMs = 720;
      spawnSparks(peg.x, peg.y, 10, "#f0d09a");
      kit.sfx("tray");
    } else {
      spawnSparks(peg.x, peg.y, 4, "#f0d09a");
    }
  }

  function landChip(slot, absorbed) {
    const value = absorbed ? 0 : slot;
    run.score += value * 10;
    run.slotSum += value;
    run.lastSlot = absorbed ? -1 : slot;
    const qualify = !absorbed && slot >= run.spec.targetSlotMin;
    run.lastOk = qualify;
    if (qualify) run.qualifyCount = (run.qualifyCount || 0) + 1;
    const need = (run.spec.twinNeed | 0) > 0 ? (run.spec.twinNeed | 0) : 1;
    if (run.qualifyCount >= need) run.stageHit = true;
    if (run.kitRun) run.kitRun.score = run.score;
    run.chip = null;
    run.pause = absorbed ? 820 : 640;
    run.slotPop = 420;
    if (absorbed) {
      kit.sfx("pit");
      if (run.kitRun && rk() && typeof rk().reportStrike === "function") {
        try { rk().reportStrike(run.kitRun, "dead peg"); } catch (_) { /* pips */ }
      }
      run.toast = "Dead peg. Chip swallowed.";
      run.toastMs = 800;
      setText("plinkoStatus", "Dead peg. Chip swallowed.");
    } else if (run.lastOk) {
      kit.sfx("tray");
      PF.setAura("celebrate");
      const need = (run.spec.twinNeed | 0) > 0 ? (run.spec.twinNeed | 0) : 1;
      if (need > 1 && !run.stageHit) {
        run.toast = `Slot ${slot} · ${run.qualifyCount}/${need} paying — need two`;
        run.toastMs = 900;
        setText("plinkoStatus", `Twin contract ${run.qualifyCount}/${need}. One hero chip doesn’t clear.`);
      } else {
        run.toast = `Slot ${slot} · ${SLOT_LABELS[slot]} — leftover chips stay in the house`;
        run.toastMs = 900;
        setText("plinkoStatus", `Slot ${slot} · ${SLOT_LABELS[slot]} — drop paid.`);
      }
    } else {
      kit.sfx("miss");
      if (run.kitRun && rk() && typeof rk().reportStrike === "function") {
        try { rk().reportStrike(run.kitRun, "low slot"); } catch (_) { /* pips */ }
      }
      setText("plinkoStatus", `Slot ${slot} · need ≥ ${run.spec.targetSlotMin}.`);
    }
  }

  function resolveStageEnd() {
    if (run.stageHit) {
      const leftover = run.chipsLeft | 0;
      run.score += 300;
      run.depth += 1;
      if (run.kitRun) {
        run.kitRun.depth = run.depth;
        run.kitRun.score = run.score;
      }
      if (leftover > 0) {
        run.houseChips = (run.houseChips || 0) + leftover;
        run.houseFly = run.houseFly || [];
        const lanes = run.spec.dropLanes || 5;
        for (let i = 0; i < leftover; i += 1) {
          const lane = clamp((run.lane | 0) + i, 0, lanes - 1);
          run.houseFly.push({
            x: laneX(lane, lanes),
            y: DROP_Y,
            vx: (32 - laneX(lane, lanes)) * 0.014,
            vy: 1.15,
            life: 760,
            spin: 0,
          });
        }
        run.chipsLeft = 0;
      }
      tellDepth(run.depth);
      paintPips();
      PF.refreshDepth();
      kit.sfx("rack");
      PF.setAura("point");
      setText("plinkoStatus", leftover > 0
        ? `${AURA.clear} HOUSE keeps ${leftover}.`
        : AURA.clear);
      startStage(run.depth + 1);
      return;
    }
    run.deathNote = "chips exhausted";
    finish("chips exhausted");
  }

  function step(dt) {
    const spec = run.spec;
    const tilt = boardTilt(spec, run.t);
    stepFx(dt);

    if (run.pause > 0) {
      run.pause -= dt;
      if (run.pause <= 0 && !run.chip) {
        if (run.stageHit || run.chipsLeft <= 0) resolveStageEnd();
      }
      return;
    }

    const chip = run.chip;
    if (!chip) return;
    chip.age = (chip.age || 0) + dt;
    chip.spin = (chip.spin || 0) + 0.12 * (dt / 16);
    if (run.trail && (run.trail.length === 0 || run.trail[run.trail.length - 1].life < 220)) {
      run.trail.push({ x: chip.x, y: chip.y, life: 280 });
      if (run.trail.length > 18) run.trail.shift();
    }
    if (chip.age > 7200 && !chip.absorbed) {
      landChip(slotFromX(chip.x), false);
      return;
    }

    if (chip.absorbed) {
      run.absorbing -= dt;
      const peg = run.lastPeg;
      if (peg) {
        chip.x += (peg.x - chip.x) * 0.12 * (dt / 16);
        chip.y += (peg.y - chip.y) * 0.12 * (dt / 16);
      } else {
        chip.y += 0.04 * dt;
      }
      chip.r = Math.max(1.2, chip.r - dt * 0.014);
      if (run.absorbing <= 0) landChip(0, true);
      return;
    }

    const liveTilt = tilt;

    const steps = Math.max(1, Math.ceil(dt / 8));
    const h = dt / steps;
    run.ignorePegMs = Math.max(0, run.ignorePegMs - dt);
    for (let s = 0; s < steps; s += 1) {
      chip.vx += liveTilt * (spec.kind === "fever" || spec.coda || spec.kind === "mirror" ? 0.028 : 0.016) * h;
      chip.vy += 0.018 * h;
      chip.x += chip.vx * 0.18 * h;
      chip.y += chip.vy * 0.18 * h;

      if (spec.funnelLie && chip.y > BOARD.y + BOARD.h * 0.55) {
        const mid = BOARD.x + BOARD.w / 2;
        chip.vx += (chip.x >= mid ? 1 : -1) * 0.018 * h;
        chip.vx -= 0.012 * h;
      }
      const left = BOARD.x + chip.r + 3;
      const right = BOARD.x + BOARD.w - chip.r - 3;
      if (chip.x < left) {
        chip.x = left;
        chip.vx = Math.abs(chip.vx) * 0.72 + 0.2;
      } else if (chip.x > right) {
        chip.x = right;
        chip.vx = -Math.abs(chip.vx) * 0.72 - 0.2;
      }

      const gate = gateState(spec, run.t);
      if (gate && chip.y + chip.r > gate.y && chip.y - chip.r < gate.y + gate.h) {
        const gl = gate.gapX - gate.gapW / 2;
        const gr = gate.gapX + gate.gapW / 2;
        if (chip.x < gl || chip.x > gr) {
          if (chip.x < gate.gapX) {
            chip.x = gl - chip.r - 0.3;
            chip.vx = -Math.abs(chip.vx) * 0.55 - 0.7;
          } else {
            chip.x = gr + chip.r + 0.3;
            chip.vx = Math.abs(chip.vx) * 0.55 + 0.7;
          }
          chip.vy = Math.abs(chip.vy) * 0.4 + 0.4;
          run.kickFlash = 280;
          spawnSparks(chip.x, gate.y, 6, "#c41e3a");
          kit.sfx("spit");
          if (!chip.gateHit) {
            chip.gateHit = true;
            run.toast = "GATE SHUT — bounced aside";
            run.toastMs = 640;
          }
        }
      }

      if (run.gates && run.gates.length) {
        for (let gi = 0; gi < run.gates.length; gi += 1) {
          const g = run.gates[gi];
          if (chip.y + chip.r < g.y0 || chip.y - chip.r > g.y1) continue;
          const gl = g.x - g.w / 2;
          const gr = g.x + g.w / 2;
          if (chip.x + chip.r > gl && chip.x - chip.r < gr) {
            if (chip.x < g.x) {
              chip.x = gl - chip.r - 0.2;
              chip.vx = -Math.abs(chip.vx) * 0.62 - 0.55;
            } else {
              chip.x = gr + chip.r + 0.2;
              chip.vx = Math.abs(chip.vx) * 0.62 + 0.55;
            }
            spawnSparks(chip.x, chip.y, 2, "#d4a45a");
          }
        }
      }

      if (run.ignorePegMs <= 0) {
        for (let i = 0; i < run.pegs.length; i += 1) {
          const peg = run.pegs[i];
          if (peg === run.lastPeg) continue;
          const dx = chip.x - peg.x;
          const dy = chip.y - peg.y;
          const lim = chip.r + peg.r;
          if (dx * dx + dy * dy >= lim * lim) continue;
          if (peg.dead) {
            chip.absorbed = true;
            chip.vx = (peg.x - chip.x) * 0.08;
            chip.vy = 0.4;
            run.absorbing = 360;
            spawnSparks(peg.x, peg.y, 14, "#c41e3a");
            kit.sfx("bury");
            run.toast = "SWALLOW — vacuum";
            run.toastMs = 720;
            setText("plinkoStatus", "Swallow peg vacuumed the chip. That’s the house.");
            return;
          }
          bounceOffPeg(chip, peg, spec, liveTilt);
          run.lastPeg = peg;
          run.ignorePegMs = 42;
          kit.sfx("drop");
          break;
        }
      }

      if (chip.y >= SLOT_Y - chip.r + 2) {
        landChip(slotFromX(chip.x), false);
        return;
      }
    }
  }

  function drop() {
    if (!isLive() || run.chip || run.pause > 0) return;
    if (run.chipsLeft <= 0) return;
    const spec = run.spec;
    const tilt = boardTilt(spec, run.t);
    const n = spec.dropLanes || 5;
    const pick = clamp(run.lane, 0, n - 1);
    const lane = spec.mirror ? (n - 1 - pick) : pick;
    const x = laneX(lane, n);
    const entry = (lane / Math.max(1, n - 1) - 0.5) * 0.28;
    run.chipsLeft -= 1;
    let vx = tilt * (spec.kind === "high" || spec.coda ? 3.15 : 2.05) + entry * 1.6;
    let laneBias = spec.biasFromEntry ? entry : 0;
    if (spec.snapBreath) {
      const snap = snapPhase(spec, run.t);
      if (snap > 0) {
        vx += 1.35;
        laneBias += 0.2;
      } else {
        vx -= 1.55;
        laneBias -= 0.24;
      }
    }
    run.chip = {
      x,
      y: DROP_Y,
      vx,
      vy: 1.05,
      r: CHIP_R,
      absorbed: false,
      age: 0,
      spin: 0,
      laneBias,
      gusted: false,
      railBoost: false,
    };
    run.lastPeg = null;
    run.ignorePegMs = 0;
    run.trail = [];
    kit.sfx("shove");
    paintPips();
    let lean;
    if (spec.mirror) {
      lean = `MIRROR — picked ${pick + 1}, fell ${lane + 1}`;
    } else if (spec.slideGate) {
      const g = gateState(spec, run.t);
      lean = g && g.open ? "through an OPEN gate" : "at a SHUT gate";
    } else if (spec.funnelLie) {
      lean = "into the highway lie";
    } else {
      lean = tilt > 0.02 ? "with the pay lean" : tilt < -0.02 ? "against the pay lean" : "flat breath";
    }
    setText("plinkoStatus", `Dropped lane ${pick + 1} ${lean} · ${run.chipsLeft} chip${run.chipsLeft === 1 ? "" : "s"} left`);
  }

  function laneFromEvent(ev) {
    const canvas = el("plinkoCanvas");
    if (!canvas) return hoverLane;
    const p = kit.canvasPos(canvas, ev, W, H);
    const spec = run ? run.spec : plinkoStageParams(1);
    const n = spec.dropLanes || 5;
    let best = 0;
    let bestD = 1e9;
    for (let i = 0; i < n; i += 1) {
      const d = Math.abs(p.x - laneX(i, n));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "dead peg") return AURA.deadpeg;
    if (run && run.spec && run.spec.kind === "twin") return AURA.twin;
    if (run && run.spec && run.spec.kind === "mirror") return AURA.mirror;
    if (run && run.spec && run.spec.slideGate) return AURA.gate;
    if (run && run.spec && run.spec.funnelLie) return AURA.funnel;
    if (depth <= 0) return AURA.shallow;
    if (run && run.spec && run.spec.coda) return AURA.coda(depth);
    if (depth >= 8) return AURA.coda(depth);
    if (depth >= 5) return AURA.deep(depth);
    if (depth >= 2) return AURA.mid;
    return AURA.exhaust;
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.deathReason = reason === "souvenir" ? "souvenir" : (run.deathNote || reason);
    run.closedStamp = reason !== "souvenir";
    run.deathHold = DEATH_HOLD_MS;
    if (run.closedStamp) kit.sfx("stamp");
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    if (run.raf) cancelAnimationFrame(run.raf);
    run.closedStamp = reason !== "leave" && reason !== "souvenir";
    const depth = run.depth;
    const score = run.score;
    persistDepth({
      depth,
      score,
      deathReason: reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : (run.deathNote || reason)),
      cashedOut: reason === "souvenir",
      meta: {
        stage: run.spec && run.spec.id,
        room: run.spec && run.spec.name,
        slotSum: run.slotSum,
        houseChips: run.houseChips || 0,
        coda: !!(run.spec && run.spec.coda),
      },
    });
    stampDepthCopy();
    const startBtn = el("plinkoStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "DROP AGAIN · 1 demo coin";
    }
    const dropBtn = el("plinkoDrop");
    if (dropBtn) dropBtn.hidden = true;
    PF.focusCard("plinkoCard", false);
    kit.setMode(card(), "result");
    const death = reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : (run.deathNote || reason || "chips exhausted"));
    const line = `DROP ${depth} · SCORE ${score}`;
    const aura = auraLine(reason, depth);
    const challenge = challengeLine(depth);
    const verdict = el("plinkoVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = reason === "leave"
        ? `Left the pegboard · ${line}`
        : reason === "souvenir"
          ? `Souvenir. ${line}.`
          : `Chips exhausted. ${line} · ${death}.`;
    }
    kit.fillResult({
      root: "plinkoResult",
      depth: "plinkoResultDepth",
      score: "plinkoResultScore",
      aura: "plinkoResultAura",
      copied: "plinkoCopied",
    }, {
      depthLine: `DROP ${depth}${run.spec && run.spec.name ? " · " + run.spec.name : ""}`,
      scoreLine: `SCORE ${score} · slots ${run.slotSum | 0} · ${death}`,
      auraLine: aura,
    });
    const reasonNode = el("plinkoResultReason");
    if (reasonNode) reasonNode.textContent = String(death).replace(/_/g, " ").toUpperCase();
    setText("plinkoChallengeText", challenge);
    PF.setTier("plinkoTier", depth > 0 ? `DROP ${depth}` : "HOUSE", depth > 0 ? "perfect" : "miss");
    setText("plinkoStatus", reason === "leave" ? "Left the pegboard." : reason === "souvenir" ? "Souvenir — authored drops cleared." : "House stamped the board.");
    const ok = depth > 0;
    if (ok) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Plinko");
      PF.setAura(depth >= 4 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `DROP ${depth}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Plinko miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "HOUSE", aura);
    }
    PF.refreshNightBoard();
    draw();
    startIdle();
  }

  PF.registerVendor({
    id: "plinko",
    playKey: "plinko",
    chalk: "Drop when the board breathes with you.",
    defaults: { bestPlinko: 0, bestPlinkoScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopIdle();
    },
    onShow() { stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      const verdict = el("plinkoVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("plinkoResult");
      const startBtn = el("plinkoStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      const dropBtn = el("plinkoDrop");
      if (dropBtn) dropBtn.hidden = true;
      kit.setMode(card(), "vestibule");
      stampDepthCopy();
      startIdle();
    },
    refreshDepth(state) {
      setText("depthPlinkoNow", isLive() || (run && run.dying) ? String(run.depth) : "0");
      const bestN = Math.max(state.bestPlinko || 0, (state.bestDepth && state.bestDepth.plinko) || 0);
      setText("depthPlinkoBest", bestN ? String(bestN) : "—");
      setText("depthPlinkoScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("depthPlinkoBestScore", state.bestPlinkoScore ? String(state.bestPlinkoScore) : "—");
      const doorBest = el("plinkoDoorBest");
      if (doorBest) doorBest.textContent = bestN ? `Best drop ${bestN}` : "Drops —";
    },
    bind() {
      declareP0();
      const startBtn = el("plinkoStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const dropBtn = el("plinkoDrop");
      if (dropBtn) {
        dropBtn.addEventListener("click", (ev) => {
          ev.preventDefault();
          if (!isLive()) {
            if (!run || run.done) punchStart();
            return;
          }
          drop();
        });
      }
      const canvas = el("plinkoCanvas");
      if (canvas) {
        canvas.addEventListener("pointermove", (ev) => {
          hoverLane = laneFromEvent(ev);
          if (isLive() && !run.chip) run.lane = hoverLane;
        });
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            if (!run || run.done) punchStart();
            return;
          }
          ev.preventDefault();
          run.lane = laneFromEvent(ev);
          hoverLane = run.lane;
          drop();
        });
      }
      window.addEventListener("keydown", (ev) => {
        if (!isLive() || !cabinetOn()) return;
        if (ev.code === "ArrowLeft" || ev.code === "KeyA") {
          ev.preventDefault();
          run.lane = clamp(run.lane - 1, 0, (run.spec.dropLanes || 5) - 1);
          hoverLane = run.lane;
        }
        if (ev.code === "ArrowRight" || ev.code === "KeyD") {
          ev.preventDefault();
          run.lane = clamp(run.lane + 1, 0, (run.spec.dropLanes || 5) - 1);
          hoverLane = run.lane;
        }
        if (ev.code === "Space" || ev.key === " " || ev.code === "Enter") {
          ev.preventDefault();
          drop();
        }
        const digit = ev.key >= "1" && ev.key <= "5" ? (ev.key | 0) - 1 : -1;
        if (digit >= 0) {
          ev.preventDefault();
          run.lane = clamp(digit, 0, (run.spec.dropLanes || 5) - 1);
          hoverLane = run.lane;
          drop();
        }
      });
      const copyBtn = el("plinkoChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const last = PF.getState().lastRun;
          const n = (last && (last.game === GAME_ID || last.gameId === GAME_ID))
            ? last.depth
            : (PF.getState().bestPlinko || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("plinkoCopied");
            if (copied) {
              copied.hidden = false;
              copied.textContent = "Copied — send it";
            }
            setText("plinkoStatus", "Copied — send it");
          }, () => {
            setText("plinkoStatus", text);
          });
        });
      }
      stampDepthCopy();
      draw();
      startIdle();
    },
  });
})();
