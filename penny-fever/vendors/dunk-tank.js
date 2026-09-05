/* Dunk the Barker — Desktop Grok owns this file. PF only. Never booth/port 6000. Never Imagine.
 * GOBLIN B04 AUTHORED — GOBLIN_AUTHORED_LEVELS_B04.md · hybrid + codaEnabled.
 * 8 unique SEATS (layout / cheat / verb), not a smaller-plate climb. Mount stageParams = coda only.
 * Soft Splash → Side-Sway → Fake Splash → Twin Plate → Double-Tap Plate → Shield Barker →
 * Reverse Lob → Fever Dunk Opera → ENDLESS Nastier Seat {n}.
 * SlingAim aim+power. Stall owns miss_seat death (shadow ctx). Dunk is a checkpoint.
 * HUD = SEAT {n} · {name} · coda labeled ENDLESS. Playful VO only — never mean. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const W = 340;
  const H = 460;
  const GAME_ID = "dunk";
  const TEE = { x: W / 2, y: H - 28 };
  const GRAVITY = 0.17;
  const BALL_R = 7.6;
  const TANK = { x: 48, y: 268, w: 244, h: 96 };
  const PULL_MAX = 118;
  const DUNK_MS = 1100;
  const DUNK_SCORE = 400;
  const DEATH_HOLD_MS = 760;
  const BALLS_PER_SEAT = 3;
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;

  let run = null;
  let idleRaf = 0;
  let idleRoom = 1;
  let idleClock = 0;

  const AURA = {
    miss_seat: "Aura: Three balls. Plate danced away.",
    dunk: "Aura: Soaked. Next seat cheats different.",
    playful: "Aura: Splash! Keep it cute — seats climb.",
    deep: (n) => `Aura: Dunks ${n}. Crown is dripping for you.`,
    leave: "Aura: Walking off mid-seat? Tank keeps the splash.",
    shallow: "Aura: Dry as a ticket stub. Plate still swinging.",
    souvenir: "Aura: Fever Dunk Opera soaked. Souvenir — crown still dripping, still cute.",
  };

  /* B04 authored SEATS — unique geometry / cheat / verb. Scale climb is coda-only. */
  const AUTHORED = [
    {
      id: 1, name: "Soft Splash Seat", title: "Soft Splash Seat", kind: "swaySoft",
      plateScale: 1.0, swing: "slow", swingSpeed: 0.4,
      hitRadius: "big", hitR: 42, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: false, fakeSplash: false, dualPlate: false, armThenDunk: false,
      shield: false, invertLob: false,
      barker: "Soft Splash. Slow sway. Big plate. Lead the ghost. Three balls. Keep it cute.",
    },
    {
      id: 2, name: "Side-Sway Seat", title: "Side-Sway Seat", kind: "sideSway",
      plateScale: 1.0, swing: "+", swingSpeed: 0.55,
      hitRadius: "big", hitR: 38, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: true, fakeSplash: false, dualPlate: false, armThenDunk: false,
      shield: false, invertLob: false,
      barker: "Plate rides a RAIL left-right — not a pendulum hang. Throw the track.",
    },
    {
      id: 3, name: "Fake Splash", title: "Fake Splash", kind: "fakeSplash",
      plateScale: 1.0, swing: "+", swingSpeed: 0.5,
      hitRadius: "big", hitR: 38, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: false, fakeSplash: true, dualPlate: false, armThenDunk: false,
      shield: false, invertLob: false,
      barker: "Near-miss plays a FAKE dunk. No depth. Real hit still needed.",
    },
    {
      id: 4, name: "Twin Plate", title: "Twin Plate", kind: "dualPlate",
      plateScale: 1.0, swing: "+", swingSpeed: 0.48,
      hitRadius: "mid", hitR: 32, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: false, fakeSplash: false, dualPlate: true, armThenDunk: false,
      shield: false, invertLob: false,
      barker: "TWO plates. Either dunks. The middle wall is dead bounce.",
    },
    {
      id: 5, name: "Double-Tap Plate", title: "Double-Tap Plate", kind: "armThenDunk",
      plateScale: 1.0, swing: "+", swingSpeed: 0.5,
      hitRadius: "mid", hitR: 34, ballsPerSeat: 4,
      sideSway: false, fakeSplash: false, dualPlate: false, armThenDunk: true,
      shield: false, invertLob: false,
      barker: "First hit ARMS the plate. Second dunks. Four balls this seat.",
    },
    {
      id: 6, name: "Shield Barker", title: "Shield Barker", kind: "shield",
      plateScale: 1.0, swing: "+", swingSpeed: 0.52,
      hitRadius: "mid", hitR: 34, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: false, fakeSplash: false, dualPlate: false, armThenDunk: false,
      shield: true, invertLob: false,
      barker: "A paddle SHIELDS the plate. Telegraph, then throw the open window.",
    },
    {
      id: 7, name: "Reverse Lob", title: "Reverse Lob", kind: "invertLob",
      plateScale: 1.0, swing: "slow", swingSpeed: 0.45,
      hitRadius: "mid", hitR: 36, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: false, fakeSplash: false, dualPlate: false, armThenDunk: false,
      shield: false, invertLob: true,
      barker: "REVERSE — a short pull throws LONG. Remap the lob. Keep it cute.",
    },
    {
      id: 8, name: "Fever Dunk Opera", title: "Fever Dunk Opera", kind: "comboFinale",
      plateScale: 1.0, swing: "++", swingSpeed: 0.6,
      hitRadius: "mid", hitR: 32, ballsPerSeat: BALLS_PER_SEAT,
      sideSway: true, fakeSplash: true, dualPlate: false, armThenDunk: false,
      shield: true, invertLob: false,
      barker: "Finale: side-sway + shield paddle + fake splash bait. Three balls. Double splash on hit.",
    },
  ];

  const P0_MOUNT = {
    engine: "SlingAim",
    displayName: "Dunk the Barker",
    depthUnit: "Dunks",
    sheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
    authoredSheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
    codaSheet: "GOBLIN_BATCH04_MOUNT_CONFIGS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored SEATS then ENDLESS · dunk is a checkpoint · layout cheats, not smaller plates",
    body: "Authored seats, not a smaller-plate loop: Soft Splash → Side-Sway rail → Fake Splash (near-miss lie) → Twin Plate → Double-Tap (arm then dunk, 4 balls) → Shield Barker → Reverse Lob → Fever Dunk Opera → ENDLESS Nastier Seat. Hit = dunk, depth++, next seat. Miss the seat and the tank stamps DRY. Keep it cute — never mean.",
    status: "Depth run · START · 1 demo coin · 8 authored SEATS then ENDLESS",
    machine: "Dunk seat · 1 demo coin · authored SEATS",
    idleHud: ["SOAK THE CROWN — HOW MANY SEATS?", "START · 1 demo coin — 8 seats, then ENDLESS"],
    punch: "Depth run — press START. Soak the crown.",
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

  function dunkCoda(n) {
    const t = Math.max(1, (n | 0) - AUTHORED_COUNT);
    return {
      id: n,
      name: `Nastier Seat ${n}`,
      title: `Nastier Seat ${n}`,
      kind: "coda",
      plateScale: Math.max(0.45, 0.9 - 0.04 * t),
      swing: "+++",
      swingSpeed: Math.min(1.8, 0.7 + 0.1 * t),
      hitRadius: "small",
      hitR: Math.max(14, 30 - t),
      ballsPerSeat: BALLS_PER_SEAT,
      sideSway: true,
      fakeSplash: t % 2 === 0,
      dualPlate: t % 3 === 0,
      armThenDunk: false,
      shield: true,
      invertLob: t % 4 === 0,
      hitch: t % 2 === 1,
      hitchDwell: 0.42,
      bob: 8 + Math.min(12, t * 2),
      figure8: true,
      wind: true,
      coda: true,
      barker: `ENDLESS Nastier Seat ${n} — still playful. Plate smaller, swing meaner.`,
    };
  }

  function dunkStageParams(n) {
    const seat = Math.max(1, n | 0);
    if (seat <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[seat - 1]);
    if (!CODA_ENABLED) return null;
    return dunkCoda(seat);
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun || typeof kitRun.declare !== "function") return;
    try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: dunkStageParams,
      codaParams: dunkCoda,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function card() {
    return el("dunkCard");
  }

  function cabinetOn() {
    const node = document.getElementById("cabinet-dunk-tank");
    return !!(node && !node.hidden);
  }

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function liveSpec() {
    if (run && run.spec) return run.spec;
    return dunkStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function stageEl() {
    const host = card();
    return (host && host.querySelector(".vendor-stage")) || null;
  }

  function cheatLabel(spec) {
    if (!spec) return "";
    if (spec.kind === "coda") return "ENDLESS · NASTIER SEAT";
    if (spec.kind === "comboFinale") return "RAIL + SHIELD + FAKE SPLASH";
    if (spec.kind === "invertLob" || spec.invertLob) return "REVERSE — SHORT PULL = LONG";
    if (spec.kind === "shield" || spec.shield) return "SHIELD PADDLE — THROW THE OPEN";
    if (spec.kind === "armThenDunk" || spec.armThenDunk) return "ARM THEN DUNK — TWO HITS";
    if (spec.kind === "dualPlate" || spec.dualPlate) return "TWIN PLATES — MIDDLE IS DEAD";
    if (spec.kind === "fakeSplash" || spec.fakeSplash) return "FAKE SPLASH — NEAR-MISS LIES";
    if (spec.kind === "sideSway" || spec.sideSway) return "RAIL SWAY — NOT A PENDULUM";
    return "";
  }

  function hudLine(spec, playing) {
    if (!spec) return "SEAT 0";
    const name = spec.name || spec.title || "Seat";
    if (spec.coda) return `ENDLESS · SEAT ${playing} · ${name}`;
    return `SEAT ${playing} · ${name}`;
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
      hud.textContent = hudLine(liveSpec(), run.seat | 0);
      hud.hidden = false;
    } else {
      hud.textContent = "SEAT 0";
      hud.hidden = true;
    }
    return hud;
  }

  function paintPips() {
    const stage = stageEl();
    if (!stage) return;
    const spec = liveSpec();
    const max = (spec && spec.ballsPerSeat) || BALLS_PER_SEAT;
    let span = stage.querySelector("[data-runkit-strikes]");
    if (!span) {
      span = document.createElement("span");
      span.className = "strike-pips";
      span.dataset.runkitStrikes = GAME_ID;
      span.setAttribute("aria-hidden", "true");
      stage.appendChild(span);
    }
    if (span.childElementCount !== max) {
      span.innerHTML = new Array(max).fill("<i></i>").join("");
    }
    const used = (isLive() || (run && run.dying)) ? Math.max(0, max - (run.ballsLeft | 0)) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < used));
  }

  function resetPips() {
    const host = card();
    const pips = (host && host.querySelector("[data-runkit-strikes]")) || document.querySelector("[data-runkit-strikes=\"dunk\"]");
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
      deathReason: partial.deathReason || "miss_seat",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestDunk = Math.max(state.bestDunk || 0, payload.depth);
      state.bestDunkScore = Math.max(state.bestDunkScore || 0, payload.score);
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
    return PF.spendDemoCoin("dunk")
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
      /* Launcher only. Stall owns 3-ball miss_seat death.
       * missesToDeath is huge so SlingAim.resolveHit cannot steal the run.
       * Shadow ctx so reportDepth/finishRun cannot steal the coin run. */
      return engines.SlingAim.mount(el("dunkCanvas") || card(), {
        gravity: GRAVITY,
        missesToDeath: 99,
        stageParams: dunkStageParams,
        onThrow() { kit.sfx("throw"); },
        hitTest() { return false; },
      }, shadowCtx(ctx));
    } catch (_) {
      return null;
    }
  }

  function throwSpeed(power, spec) {
    const p = spec && spec.invertLob ? (1 - kit.clamp(power, 0, 1)) : kit.clamp(power, 0, 1);
    return 6.05 + p * 8.7;
  }

  function plateAmp(spec) {
    return 78 + (1 - spec.plateScale) * 18;
  }

  function hitchPhase(t, spec) {
    const w = 0.0022 * spec.swingSpeed * Math.PI * 2;
    const raw = t * w;
    if (!spec.hitch) return raw;
    const seg = Math.PI;
    const i = Math.floor(raw / seg);
    const f = raw / seg - i;
    const dwell = spec.hitchDwell != null ? spec.hitchDwell : 0.46;
    const lo = 0.5 - dwell / 2;
    const hi = 0.5 + dwell / 2;
    let ff;
    if (f <= lo) {
      ff = (f / lo) * lo;
    } else if (f >= hi) {
      ff = hi + ((f - hi) / Math.max(0.0001, 1 - hi)) * (1 - hi);
    } else {
      const u = (f - lo) / dwell;
      ff = 0.5 - 0.03 + u * 0.06;
    }
    return (i + ff) * seg;
  }

  function railSwing(t, spec) {
    const period = 1800 / Math.max(0.35, spec.swingSpeed);
    const u = ((t % (period * 2)) / period);
    return u < 1 ? u * 2 - 1 : 3 - u * 2;
  }

  function shieldCovering(spec, t) {
    if (!spec || !spec.shield) return false;
    const a = t * 0.00235;
    return Math.sin(a) > 0.38;
  }

  function shieldAngle(t) {
    return t * 0.00235;
  }

  function platePos(spec, t) {
    const amp = plateAmp(spec);
    const phase = hitchPhase(t, spec);
    let swing;
    let y = 132;
    if (spec.sideSway || spec.kind === "sideSway" || spec.kind === "comboFinale") {
      swing = railSwing(t, spec);
      y = 128;
    } else {
      swing = Math.sin(phase);
    }
    const x = W / 2 + swing * amp;
    if (spec.bob) y += Math.sin(phase * 1.7) * spec.bob;
    if (spec.figure8) y += Math.sin(phase * 2) * 14;
    const hanging = !!(spec.hitch && Math.abs(Math.sin(phase)) > 0.92);
    const covering = shieldCovering(spec, t);
    return { x, y, r: spec.hitR, scale: spec.plateScale, hanging, skipping: false, covering, swing };
  }

  function platesOf(spec, t) {
    if (spec && (spec.dualPlate || spec.kind === "dualPlate")) {
      const phase = hitchPhase(t, spec);
      const r = spec.hitR;
      return [
        { x: W / 2 - 78 + Math.sin(phase) * 18, y: 128, r, scale: spec.plateScale, side: "L", hanging: false, skipping: false, covering: false },
        { x: W / 2 + 78 + Math.sin(phase + Math.PI) * 18, y: 128, r, scale: spec.plateScale, side: "R", hanging: false, skipping: false, covering: false },
      ];
    }
    return [platePos(spec, t)];
  }

  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") {
      return rk().challengeText("Dunk seats", depth, GAME_ID);
    }
    return `Beat my Dunk seats ${depth} on Penny Fever`;
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
    return Math.max(state.bestDunk || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }

  function tellStrike(reason) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportStrike !== "function") return;
    try { rk().reportStrike(run.kitRun, reason); } catch (_) { /* pips */ }
  }

  function punchStart() {
    stampDepthCopy();
    setText("dunkStatus", DEPTH_COPY.punch);
    const btn = el("dunkStart");
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
    const canvas = el("dunkCanvas");
    if (canvas) {
      canvas.style.touchAction = "none";
      canvas.classList.toggle("is-locked", !isLive());
    }
    if (!isLive() && (!run || run.done)) setText("dunkStatus", DEPTH_COPY.status);
  }

  function drawBarker(ctx, x, y, dunkT) {
    const fall = dunkT > 0 ? Math.min(1, dunkT / 780) : 0;
    const by = y + fall * 118;
    const rot = fall * 0.55;
    ctx.save();
    ctx.translate(x, by);
    ctx.rotate(rot);
    ctx.fillStyle = "#3a2418";
    ctx.fillRect(-18, 18, 36, 8);
    ctx.fillStyle = "#c41e3a";
    ctx.beginPath();
    ctx.ellipse(0, 8, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -10, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#f0d09a";
    ctx.fill();
    ctx.fillStyle = "#d4a45a";
    ctx.beginPath();
    ctx.moveTo(-11, -16);
    ctx.lineTo(-6, -28);
    ctx.lineTo(0, -18);
    ctx.lineTo(6, -28);
    ctx.lineTo(11, -16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#8a6230";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#12080c";
    ctx.beginPath();
    ctx.arc(-3, -11, 1.3, 0, Math.PI * 2);
    ctx.arc(3, -11, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c41e3a";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -7, 3.2, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.restore();
  }

  function drawTank(ctx, splash) {
    ctx.fillStyle = "#2a1810";
    ctx.fillRect(TANK.x - 8, TANK.y, TANK.w + 16, TANK.h + 18);
    const water = ctx.createLinearGradient(0, TANK.y, 0, TANK.y + TANK.h);
    water.addColorStop(0, "#3d8a8a");
    water.addColorStop(1, "#1a4a58");
    ctx.fillStyle = water;
    ctx.fillRect(TANK.x, TANK.y + 8, TANK.w, TANK.h - 8);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 3;
    ctx.strokeRect(TANK.x - 0.5, TANK.y - 0.5, TANK.w + 1, TANK.h + 1);
    if (splash > 0) {
      const p = Math.min(1, splash / DUNK_MS);
      ctx.strokeStyle = `rgba(184,232,224,${1 - p})`;
      ctx.lineWidth = 2;
      for (let i = 1; i <= 5; i += 1) {
        ctx.beginPath();
        ctx.ellipse(W / 2, TANK.y + 28, 18 + p * 46 * i, 8 + p * 12 * i, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawPlate(ctx, plate, flash, spec) {
    ctx.save();
    ctx.translate(plate.x, plate.y);
    ctx.beginPath();
    ctx.arc(0, 0, plate.r, 0, Math.PI * 2);
    ctx.fillStyle = flash ? "#fff6ec" : (plate.covering ? "#5a3a48" : (plate.hanging ? "#e8a0b8" : (run && run.armed ? "#3d8a8a" : "#c41e3a")));
    ctx.fill();
    ctx.strokeStyle = "#f0d09a";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, plate.r * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = run && run.armed ? "#b8e8e0" : "#d4a45a";
    ctx.fill();
    ctx.fillStyle = "#12080c";
    ctx.font = "bold 10px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = plate.covering ? "SHIELD" : plate.hanging ? "HANG" : (run && run.armed ? "ARMED" : "HIT");
    ctx.fillText(label, 0, 1);
    ctx.restore();
    if (!(spec && spec.sideSway)) {
      ctx.strokeStyle = "rgba(212,164,90,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(plate.x, 48);
      ctx.lineTo(plate.x, plate.y - plate.r);
      ctx.stroke();
    }
  }

  function drawShield(ctx, plate, spec, t) {
    if (!spec || !spec.shield) return;
    const a = shieldAngle(t);
    const covering = shieldCovering(spec, t);
    ctx.save();
    ctx.translate(plate.x, plate.y);
    ctx.rotate(a);
    ctx.fillStyle = covering ? "rgba(232,160,184,0.78)" : "rgba(240,208,154,0.38)";
    ctx.fillRect(-8, -plate.r - 18, 16, 28);
    ctx.strokeStyle = covering ? "#e8a0b8" : "#d4a45a";
    ctx.lineWidth = 2;
    ctx.strokeRect(-8.5, -plate.r - 18.5, 17, 29);
    ctx.restore();
  }

  function drawPips(ctx, left, total) {
    const n = total || BALLS_PER_SEAT;
    for (let i = 0; i < n; i += 1) {
      const x = 18 + i * 16;
      ctx.beginPath();
      ctx.arc(x, H - 14, 5.2, 0, Math.PI * 2);
      ctx.fillStyle = i < left ? "#c41e3a" : "rgba(196,30,58,0.18)";
      ctx.fill();
      ctx.strokeStyle = i < left ? "#fff6ec" : "rgba(255,246,236,0.2)";
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
  }

  function predictArc(power, ang, spec) {
    const speed = throwSpeed(power, spec);
    let x = TEE.x;
    let y = TEE.y;
    let vx = Math.cos(ang) * speed;
    let vy = Math.sin(ang) * speed;
    const pts = [];
    for (let i = 0; i < 16; i += 1) {
      vy += GRAVITY;
      x += vx;
      y += vy;
      pts.push({ x, y });
      if (y > H - 8 || x < 0 || x > W) break;
    }
    return pts;
  }

  function draw() {
    const canvas = el("dunkCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (run) run.shake = kit.applyShake(ctx, run.shake || 0);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#2c1830");
    bg.addColorStop(1, "#10080c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    kit.fillWood(ctx, 10, 40, 320, 210);

    const spec = liveSpec();
    const t = run ? run.t : performance.now();
    const plates = platesOf(spec, t);
    const dunkT = run && run.dunking ? run.dunking : 0;
    const fakeT = run && run.fakeSplash ? run.fakeSplash : 0;
    drawTank(ctx, dunkT || (fakeT > 0 ? fakeT : 0));
    drawBarker(ctx, W / 2, 198, dunkT);
    if (spec.sideSway || spec.kind === "comboFinale") {
      ctx.strokeStyle = "rgba(212,164,90,0.7)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(48, 128);
      ctx.lineTo(W - 48, 128);
      ctx.stroke();
      ctx.fillStyle = "rgba(240,208,154,0.88)";
      ctx.font = "bold 9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("RAIL", W / 2, 118);
    }
    if (spec.dualPlate) {
      ctx.strokeStyle = "rgba(196,30,58,0.7)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(W / 2, 70);
      ctx.lineTo(W / 2, 190);
      ctx.stroke();
      ctx.fillStyle = "rgba(232,160,184,0.92)";
      ctx.font = "bold 9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("DEAD", W / 2, 64);
    }
    if (dunkT <= 0) {
      plates.forEach((p) => {
        drawPlate(ctx, p, !!(run && run.plateFlash), spec);
        drawShield(ctx, p, spec, t);
      });
    }
    const cheat = cheatLabel(spec);
    if (cheat) {
      ctx.fillStyle = "rgba(232,160,184,0.92)";
      ctx.font = "bold 10px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(cheat, W / 2, 38);
    }

    ctx.strokeStyle = "rgba(240,208,154,0.4)";
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    const period = spec.sideSway ? 1800 / Math.max(0.35, spec.swingSpeed) : (1 / Math.max(0.00045, 0.0022 * spec.swingSpeed));
    let pathStarted = false;
    for (let i = 0; i <= 48; i += 1) {
      const p = platePos(spec, (i / 48) * period * (spec.sideSway ? 2 : 1));
      if (p.skipping) {
        pathStarted = false;
        continue;
      }
      if (!pathStarted) {
        ctx.moveTo(p.x, p.y);
        pathStarted = true;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(240,208,154,0.35)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(40, TEE.y);
    ctx.lineTo(W - 40, TEE.y);
    ctx.stroke();
    ctx.setLineDash([]);

    if (run && run.aim) {
      const a = run.aim;
      const ang = Math.atan2(a.hy - TEE.y, a.hx - TEE.x);
      ctx.strokeStyle = "rgba(240,208,154,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TEE.x, TEE.y);
      ctx.lineTo(a.hx, a.hy);
      ctx.stroke();
      predictArc(a.power, ang, spec).forEach((p, i, arc) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 + a.power * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = i === arc.length - 1 ? "rgba(196,30,58,0.55)" : "rgba(196,30,58,0.28)";
        ctx.fill();
      });
      if (spec.invertLob) {
        ctx.fillStyle = "rgba(232,160,184,0.95)";
        ctx.font = "bold 10px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("REVERSE LOB", TEE.x, TEE.y - 22);
      }
      platesOf(spec, t + 320).forEach((lead) => {
        if (lead.skipping || lead.covering) return;
        ctx.beginPath();
        ctx.arc(lead.x, lead.y, lead.r * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(240,208,154,0.55)";
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(240,208,154,0.88)";
        ctx.font = "bold 9px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("LEAD", lead.x, lead.y - lead.r - 8);
      });
    }

    const ball = run && run.ball ? run.ball : { x: TEE.x, y: TEE.y, r: BALL_R };
    if (dunkT <= 0) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = "#c41e3a";
      ctx.fill();
      ctx.strokeStyle = "#fff6ec";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ball.x - 2, ball.y - 2, 2.1, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,246,236,0.5)";
      ctx.fill();
    }

    if (run && run.splashes) {
      run.splashes.forEach((s) => {
        const age = (run.t - s.at) / 500;
        if (age < 0 || age > 1) return;
        ctx.beginPath();
        ctx.arc(s.x, s.y - age * 28, 3 + age * 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(184,232,224,${1 - age})`;
        ctx.fill();
      });
    }

    if (dunkT > 0) {
      ctx.fillStyle = "rgba(184,232,224,0.9)";
      ctx.font = "bold 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(spec.kind === "comboFinale" ? "DOUBLE SPLASH!" : "SPLASH!", W / 2, 88);
      ctx.font = "12px Georgia, serif";
      ctx.fillStyle = "#f0d09a";
      ctx.fillText("Keep it cute — next seat climbs", W / 2, 108);
    }
    if (fakeT > 0 && dunkT <= 0) {
      ctx.fillStyle = "rgba(232,160,184,0.92)";
      ctx.font = "bold 20px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("FAKE SPLASH", W / 2, 88);
      ctx.font = "12px Georgia, serif";
      ctx.fillStyle = "#f0d09a";
      ctx.fillText("That wasn’t a dunk — plate still dry", W / 2, 108);
    }

    drawPips(ctx, run && !run.done ? run.ballsLeft : ((spec && spec.ballsPerSeat) || BALLS_PER_SEAT), (spec && spec.ballsPerSeat) || BALLS_PER_SEAT);

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, "DRY");

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    if (run && !run.done) {
      kit.drawHud(ctx, W, [
        `${spec.title} · DUNKS ${run.depth} · balls ${run.ballsLeft}`,
        `${hudLine(spec, run.seat)} · ${run.score}${run.dunking ? " · SPLASH" : ""}`,
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

  function startSeat(n) {
    const spec = dunkStageParams(n);
    if (!spec) return;
    run.seat = spec.id;
    run.spec = spec;
    run.ballsLeft = spec.ballsPerSeat;
    run.ball = null;
    run.aim = null;
    run.dunking = 0;
    run.fakeSplash = 0;
    run.armed = false;
    run.plateFlash = 0;
    run.splashes = [];
    if (run.kitRun) run.kitRun.strikes = 0;
    tellDepth(run.depth);
    ensureHud();
    paintPips();
    setText("dunkStatus", spec.barker || `${spec.title} — ${spec.ballsPerSeat} balls. Hit the plate. Keep it cute.`);
  }

  function start() {
    if (isLive()) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("dunkStatus", "Out of demo coins · grant a pass");
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
      seat: 1,
      score: 0,
      spec: dunkStageParams(1),
      ballsLeft: BALLS_PER_SEAT,
      ball: null,
      aim: null,
      dunking: 0,
      fakeSplash: 0,
      armed: false,
      plateFlash: 0,
      splashes: [],
      shake: 0,
      closedStamp: false,
      deathHold: 0,
      deathNote: "miss_seat",
    };
    run.sling = mountSling(kitRun);
    resetPips();
    tellDepth(0);
    const startBtn = el("dunkStart");
    if (startBtn) startBtn.disabled = true;
    const verdict = el("dunkVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("dunkResult");
    PF.setTier("dunkTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    startSeat(1);
    PF.focusCard("dunkCard", true);
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

  function splashDunk() {
    run.dunking = 1;
    run.score += DUNK_SCORE;
    run.depth += 1;
    run.ball = null;
    run.aim = null;
    run.armed = false;
    run.splashes = [
      { x: W / 2 - 18, y: TANK.y + 20, at: run.t },
      { x: W / 2 + 12, y: TANK.y + 16, at: run.t + 40 },
      { x: W / 2 + 28, y: TANK.y + 24, at: run.t + 80 },
      { x: W / 2 - 8, y: TANK.y + 12, at: run.t + 120 },
      { x: W / 2 + 4, y: TANK.y + 8, at: run.t + 160 },
    ];
    if (run.spec && run.spec.kind === "comboFinale") {
      run.splashes.push(
        { x: W / 2 - 40, y: TANK.y + 10, at: run.t + 80 },
        { x: W / 2 + 44, y: TANK.y + 14, at: run.t + 120 }
      );
    }
    if (run.kitRun) {
      run.kitRun.depth = run.depth;
      run.kitRun.score = run.score;
      run.kitRun.strikes = 0;
    }
    tellDepth(run.depth);
    kit.sfx("rack");
    kit.sfx("sink");
    PF.setAura("celebrate");
    const vo = run.depth >= 6 ? AURA.deep(run.depth) : (run.depth % 2 === 0 ? AURA.dunk : AURA.playful);
    setText("dunkStatus", vo);
  }

  function armPlate() {
    run.armed = true;
    run.ball = null;
    run.plateFlash = 320;
    run.shake = 5;
    kit.sfx("sink");
    setText("dunkStatus", `Plate ARMED. Second hit dunks. ${run.ballsLeft} left.`);
    PF.setAura("point");
  }

  function playFakeSplash() {
    run.fakeSplash = 640;
    run.shake = 6;
    run.splashes = (run.splashes || []).concat([
      { x: W / 2 - 10, y: TANK.y + 18, at: run.t },
      { x: W / 2 + 16, y: TANK.y + 14, at: run.t + 40 },
    ]);
    kit.sfx("sink");
    PF.setAura("laugh");
  }

  function missBall(note) {
    run.ball = null;
    tellStrike("miss_seat");
    paintPips();
    kit.sfx("miss");
    const left = `Miss. ${run.ballsLeft} ball${run.ballsLeft === 1 ? "" : "s"} left this seat.`;
    setText("dunkStatus", note ? `${note} ${left}` : left);
    if (run.ballsLeft <= 0) finish("miss_seat");
  }

  function beginAim(x, y) {
    if (!isLive() || run.ball || run.dunking) return;
    if (run.ballsLeft <= 0) return;
    run.aim = { x, y, hx: TEE.x, hy: TEE.y, power: 0 };
    if (run.sling && typeof run.sling.beginPull === "function") {
      run.sling.beginPull(TEE.x, TEE.y);
    }
    updateAim(x, y);
  }

  function updateAim(x, y) {
    if (!run || !run.aim) return;
    const dx = TEE.x - x;
    const dy = TEE.y - y;
    const dist = Math.hypot(dx, dy);
    const pull = kit.clamp(dist, 0, PULL_MAX);
    const power = pull / PULL_MAX;
    const ang = Math.atan2(dy, dx);
    const reach = 28 + power * 92;
    run.aim.x = x;
    run.aim.y = y;
    run.aim.power = power;
    run.aim.hx = TEE.x + Math.cos(ang) * reach;
    run.aim.hy = TEE.y + Math.sin(ang) * reach;
    if (run.sling && typeof run.sling.movePull === "function") run.sling.movePull(x, y);
  }

  function releaseAim() {
    if (!run || !run.aim || run.done || run.dying || run.ball || run.dunking) {
      if (run) run.aim = null;
      return;
    }
    const pull = run.aim.power;
    if (pull < 0.12) {
      run.aim = null;
      if (run.sling && typeof run.sling.release === "function") run.sling.release();
      setText("dunkStatus", "Pull back — that’s the throw.");
      return;
    }
    if (run.sling && typeof run.sling.release === "function") run.sling.release();
    const dx = run.aim.hx - TEE.x;
    const dy = run.aim.hy - TEE.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = throwSpeed(pull, run.spec);
    const noise = 1 + (Math.random() * 0.03 - 0.015);
    const vx = (dx / dist) * speed * noise;
    const vy = (dy / dist) * speed * noise;
    run.ballsLeft -= 1;
    paintPips();
    run.ball = { x: TEE.x, y: TEE.y, r: BALL_R, vx, vy, life: 0 };
    run.aim = null;
    kit.sfx("throw");
  }

  function step(dt) {
    const k = dt / 16;
    run.plateFlash = Math.max(0, (run.plateFlash || 0) - dt);
    run.fakeSplash = Math.max(0, (run.fakeSplash || 0) - dt);
    if (run.dunking > 0) {
      run.dunking += dt;
      if (run.dunking > DUNK_MS) {
        run.dunking = 0;
        const next = dunkStageParams(run.depth + 1);
        if (!next) {
          finish("souvenir");
          return;
        }
        startSeat(run.depth + 1);
      }
      return;
    }
    const ball = run.ball;
    if (!ball) return;
    if (run.sling && typeof run.sling.stepBall === "function") {
      run.sling.stepBall(ball, k);
    } else {
      ball.vy += GRAVITY * k;
      ball.x += ball.vx * k;
      ball.y += ball.vy * k;
    }
    if (run.spec.wind || run.spec.figure8) {
      ball.vx += Math.sin(run.t * 0.0042) * 0.055 * k;
    }
    ball.life += dt;
    if (run.spec.dualPlate && ball.x > W / 2 - 12 && ball.x < W / 2 + 12 && ball.y < 190 && ball.y > 70) {
      missBall("Dead wall — pick a plate.");
      return;
    }
    const plates = platesOf(run.spec, run.t);
    let nearest = Infinity;
    let hitPlate = null;
    plates.forEach((p) => {
      const d = Math.hypot(ball.x - p.x, ball.y - p.y);
      if (d < nearest) nearest = d;
      if (d < p.r + ball.r * 0.65) hitPlate = p;
    });
    if (hitPlate) {
      if (hitPlate.covering || shieldCovering(run.spec, run.t)) {
        run.plateFlash = 180;
        missBall("Shield paddle ate it — wait the open.");
        return;
      }
      run.plateFlash = 240;
      run.shake = 8;
      if (run.spec.armThenDunk && !run.armed) {
        armPlate();
        return;
      }
      splashDunk();
      return;
    }
    const inTank = ball.x > TANK.x && ball.x < TANK.x + TANK.w && ball.y > TANK.y + 10 && ball.y < TANK.y + TANK.h;
    const near = nearest < ((plates[0] && plates[0].r) || 30) + ball.r * 2.2;
    if (inTank) {
      run.splashes = (run.splashes || []).concat([{ x: ball.x, y: ball.y, at: run.t }]);
      if (near && run.spec.fakeSplash) playFakeSplash();
      missBall(near
        ? (run.spec.fakeSplash ? "FAKE SPLASH — that wasn’t a dunk." : "Tank splash — plate danced past.")
        : "Tank splash. Plate’s still dry.");
      return;
    }
    const off = ball.x < 4 || ball.x > W - 4 || ball.y > H - 6 || ball.y < 8 || ball.life > 1800;
    if (off) {
      if (near && run.spec.fakeSplash) playFakeSplash();
      missBall(near
        ? (run.spec.fakeSplash ? "FAKE SPLASH — plate still dry." : "Near miss — plate danced past.")
        : "");
    }
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (depth <= 0) return AURA.shallow;
    if (rk() && typeof rk().auraDeathLine === "function") {
      const line = rk().auraDeathLine(GAME_ID, depth, reason || "miss_seat");
      if (line) return `Aura: ${String(line).replace(/^Aura:\s*/i, "")}`;
    }
    if (depth >= 6) return AURA.deep(depth);
    return AURA.miss_seat;
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
    run.deathNote = reason || "miss_seat";
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
    const depth = run.depth;
    const score = run.score;
    const death = reason === "leave" ? "leave" : reason === "souvenir" ? "souvenir" : "miss_seat";
    persistDepth({
      depth,
      score,
      deathReason: death,
      cashedOut: reason === "souvenir",
      meta: { seat: run.spec && run.spec.id, kind: run.spec && run.spec.kind, coda: !!(run.spec && run.spec.coda) },
    });
    stampDepthCopy();
    const startBtn = el("dunkStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "TOSS AGAIN · 1 demo coin";
    }
    PF.focusCard("dunkCard", false);
    kit.setMode(card(), "result");
    const line = `DUNKS ${depth} · SCORE ${score}`;
    const aura = auraLine(reason, depth);
    const challenge = challengeLine(depth);
    const verdict = el("dunkVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = reason === "leave"
        ? `Left the seat · ${line}`
        : reason === "souvenir"
          ? `Souvenir. ${line}.`
          : `Missed the seat. ${line}.`;
    }
    kit.fillResult({
      root: "dunkResult",
      depth: "dunkResultDepth",
      score: "dunkResultScore",
      aura: "dunkResultAura",
      copied: "dunkCopied",
    }, {
      depthLine: `DUNKS ${depth}`,
      scoreLine: `SCORE ${score} · ${death.replace(/_/g, " ").toUpperCase()}`,
      auraLine: aura,
    });
    const reasonNode = el("dunkResultReason");
    if (reasonNode) reasonNode.textContent = death.replace(/_/g, " ").toUpperCase();
    setText("dunkChallengeText", challenge);
    PF.setTier("dunkTier", depth > 0 ? `DUNKS ${depth}` : "DRY", depth > 0 || reason === "souvenir" ? "perfect" : "miss");
    setText("dunkStatus", reason === "leave" ? "Left the seat." : reason === "souvenir" ? "Crown still dripping. Still cute." : "Tank stamped DRY.");
    if (depth > 0 || reason === "souvenir") {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Dunk tank");
      PF.setAura(depth >= 3 || reason === "souvenir" ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, reason === "souvenir" ? "SOUVENIR" : `DUNKS ${depth}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Dunk miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "DRY", aura);
    }
    PF.refreshNightBoard();
    draw();
    startIdle();
  }

  PF.registerVendor({
    id: "dunk-tank",
    playKey: "dunk",
    chalk: "Soak the crown. How many seats?",
    defaults: { bestDunk: 0, bestDunkScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopIdle();
    },
    onShow() { declareP0(); stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      const verdict = el("dunkVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("dunkResult");
      const startBtn = el("dunkStart");
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
      setText("depthDunkNow", isLive() || (run && run.dying) ? String(run.depth) : "0");
      const bestN = Math.max(state.bestDunk || 0, (state.bestDepth && state.bestDepth.dunk) || 0);
      setText("depthDunkBest", bestN ? String(bestN) : "—");
      setText("depthDunkScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("depthDunkBestScore", state.bestDunkScore ? String(state.bestDunkScore) : "—");
      setText("dunkDoorBest", bestN ? `Best seats ${bestN}` : "Seats —");
    },
    bind() {
      declareP0();
      ensureHud();
      paintPips();
      const startBtn = el("dunkStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = el("dunkCanvas");
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
          beginAim(p.x, p.y);
        });
        canvas.addEventListener("pointermove", (ev) => {
          if (!run || !run.aim) return;
          ev.preventDefault();
          const p = kit.canvasPos(canvas, ev, W, H);
          updateAim(p.x, p.y);
        });
        const up = (ev) => {
          if (!run || !run.aim) return;
          ev.preventDefault();
          const p = kit.canvasPos(canvas, ev, W, H);
          updateAim(p.x, p.y);
          releaseAim();
        };
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("lostpointercapture", up);
        canvas.addEventListener("pointerleave", up);
        canvas.addEventListener("pointercancel", up);
      }
      const copyBtn = el("dunkChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = lastDepth();
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("dunkCopied");
            if (copied) copied.hidden = false;
            setText("dunkStatus", "Copied — send it");
          }, () => {
            setText("dunkStatus", text);
          });
        });
      }
      stampDepthCopy();
      draw();
    },
  });
})();
