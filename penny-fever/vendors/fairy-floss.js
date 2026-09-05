/* Fairy Floss Wheel — Desktop Grok owns this file. PF only. Never booth/port 6000. Never Imagine.
 * GOBLIN B04 AUTHORED — GOBLIN_AUTHORED_LEVELS_B04.md · hybrid + codaEnabled.
 * 8 unique rooms (layout / cheat / verb), NOT thinner-band climb. Coda = BATCH04 mount Sugar Edge {n}.
 * HoldBand tension / wind-rate (not Love heat). Stall owns SNAP death; engine cannot steal the run.
 * Authored: Soft Cloud → Twin Strand → Gust Stall → Reverse Wind → Fake Snap Tent → Sag Trap Shelf → Pulse Tub → Fever Sugar Opera → ENDLESS Sugar Edge {n}
 * HUD = current STAGE (playing) · glory/best = stages cleared · death = snap
 * snapLimit PER STAGE (3 then 2) — snaps reset on clear. Pips = this-stage snaps.
 * Don’t: instant full cone. Death hold ≥700ms. Best: Metres {n} / Stage.
 * Vestibule: WIND IT TALL — DON’T SNAP THE CLOUD. coda off → souvenir after Fever Sugar Opera. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const W = 340;
  const H = 480;
  const GAME_ID = "fairyfloss";
  const CONE = { x: 208, y: 198 };
  const TALL_CONE = { x: 208, y: 158 };
  const TUB = { x: 170, y: 392, rx: 78, ry: 28 };
  const METER = { x: 22, y: 64, w: 28, h: 280 };
  const SNAP_MS = 280;
  const SCORE_PER_TENTH = 20;
  const CLEAR_BONUS = 250;
  const DEATH_HOLD_MS = 760;
  const TAU = Math.PI * 2;
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const IDLE_ROOM_MS = 2800;
  const ROOM_CARD_MS = 1180;

  let run = null;
  let idleRaf = 0;
  let idleRoom = 1;
  let idleClock = 0;
  let idleT = 0;

  const AURA = {
    snap: "Aura: You got greedy with the spin.",
    snapDeep: (m) => `Aura: FLOSS ${m}m snapped. Cloud wanted slower hands.`,
    clear: "Aura: Metres locked. Tub spins meaner.",
    deep: (n) => `Aura: Stage ${n}. That sugar web trusts you — barely.`,
    leave: "Aura: Walked off mid-cloud. The web sagged.",
    shallow: "Aura: Not a metre. The cloud wanted a slower hand.",
    souvenir: "Aura: Sugar Edge souvenir. The cloud let you walk.",
  };

  const AUTHORED = [
    {
      id: 1, title: "Soft Cloud", kind: "teach",
      metresNeeded: 3, bandWidth: "wide", bandH: 22, bandMid: 0.5,
      tubRpm: 0.4, snapLimit: 3, metrePerSecInBand: 0.35, sagNoGain: true,
      snapMs: 480,
      barker: "Wide band. Circle the cone. Three snaps. Don’t rush.",
    },
    {
      id: 2, title: "Twin Strand", kind: "dualNeedle",
      metresNeeded: 4, bandWidth: "wide", bandH: 20, bandMid: 0.5,
      tubRpm: 0.5, snapLimit: 2, metrePerSecInBand: 0.36, sagNoGain: true,
      snapMs: 400, dualNeedle: true,
      barker: "Two strands. Both needles in the band. Shared hold.",
    },
    {
      id: 3, title: "Gust Stall", kind: "gust",
      metresNeeded: 5, bandWidth: "mid", bandH: 16, bandMid: 0.5,
      tubRpm: 0.65, snapLimit: 2, metrePerSecInBand: 0.38, sagNoGain: true,
      snapMs: 320, gust: true, gustEveryMs: 2500, gustMs: 500, gustJump: 0.12,
      barker: "Gust every few beats. Ride the jump or snap.",
    },
    {
      id: 4, title: "Reverse Wind", kind: "invertDrag",
      metresNeeded: 5, bandWidth: "mid", bandH: 16, bandMid: 0.5,
      tubRpm: 0.7, snapLimit: 2, metrePerSecInBand: 0.38, sagNoGain: true,
      snapMs: 300, invertDrag: true,
      barker: "REVERSE — pull down to wind up. Muscle memory lies.",
    },
    {
      id: 5, title: "Fake Snap Tent", kind: "fakeSnap",
      metresNeeded: 6, bandWidth: "mid", bandH: 14, bandMid: 0.52,
      tubRpm: 0.8, snapLimit: 2, metrePerSecInBand: 0.4, sagNoGain: true,
      snapMs: 280, fakeSnap: true, fakeSnapCount: 3,
      barker: "Booth audio lies. Three fake snaps. Ignore them.",
    },
    {
      id: 6, title: "Sag Trap Shelf", kind: "sagTrap",
      metresNeeded: 6, bandWidth: "mid", bandH: 14, bandMid: 0.5,
      tubRpm: 0.85, snapLimit: 2, metrePerSecInBand: 0.4, sagNoGain: true, sagEats: true,
      snapMs: 280, sagCatchMs: 520,
      barker: "Sag eats metres. Catch up after the droop.",
    },
    {
      id: 7, title: "Pulse Tub", kind: "pulseTub",
      metresNeeded: 7, bandWidth: "mid", bandH: 13, bandMid: 0.5,
      tubRpm: 0.95, snapLimit: 2, metrePerSecInBand: 0.42, sagNoGain: true,
      snapMs: 260, pulse: true,
      barker: "Tub pulses. Sync the wind to the sine.",
    },
    {
      id: 8, title: "Fever Sugar Opera", kind: "comboFinale",
      metresNeeded: 7, bandWidth: "mid", bandH: 12, bandMid: 0.5,
      tubRpm: 1.0, snapLimit: 2, metrePerSecInBand: 0.42, sagNoGain: true,
      snapMs: 260, dualNeedle: true, gustOnce: true, fakeSnapOnce: true,
      reversePulseMid: true, pulse: true, fakeSnapCount: 1,
      gustMs: 500, gustJump: 0.12,
      barker: "Twin strand, one gust, one fake snap, reverse pulse. Gauntlet.",
    },
  ];

  const P0_MOUNT = {
    engine: "HoldBand",
    displayName: "Fairy Floss Wheel",
    depthUnit: "Stage",
    sheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored STAGES then ENDLESS · wind the cloud until it snaps",
    body: "Authored rooms, not a thinner loop: Soft Cloud → Twin Strand → Gust Stall → Reverse Wind → Fake Snap Tent → Sag Trap Shelf → Pulse Tub → Fever Sugar Opera → ENDLESS Sugar Edge. Hold-drag around the cone. Too slow sags. Too fast SNAPs. Twin needles, gusts, reverse pull, fake snaps, sag rewind — not a skinnier band. No instant cone.",
    status: "Depth run · START · 1 demo coin · 8 authored STAGES then ENDLESS",
    machine: "Sugar stall · 1 demo coin · 8 authored STAGES",
    idleHud: ["WIND IT TALL — DON’T SNAP THE CLOUD", "START · 1 demo coin — keep the pink band"],
    punch: "Depth run — press START. Circle the cone. No full-cone button.",
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

  function applyBand(p) {
    const mid = p.bandMid != null ? p.bandMid : 0.5;
    const half = (p.bandH / 100) * 0.5;
    p.lo = kit.clamp(mid - half, 0.08, 0.78);
    p.hi = kit.clamp(mid + half, 0.22, 0.94);
    p.outLimitMs = 1e9;
    p.graceStrikes = 99;
    return p;
  }

  /* 18:23 drop-in from GOBLIN_BATCH04_MOUNT_CONFIGS.md — numbers are the contract. */
  function fairyflossMountParams(n) {
    const t = n - 1;
    if (n === 1) {
      return {
        id: 1, title: "Soft Cloud", metresNeeded: 3, bandWidth: "wide", bandH: 22,
        tubRpm: 0.4, snapLimit: 3, metrePerSecInBand: 0.35, sagNoGain: true,
      };
    }
    if (n === 2) {
      return {
        id: 2, title: "Taller Spin", metresNeeded: 4, bandWidth: "wide", bandH: 20,
        tubRpm: 0.55, snapLimit: 2, metrePerSecInBand: 0.38, sagNoGain: true,
      };
    }
    if (n === 3) {
      return {
        id: 3, title: "Mid Band", metresNeeded: 5, bandWidth: "mid", bandH: 16,
        tubRpm: 0.7, snapLimit: 2, metrePerSecInBand: 0.4, sagNoGain: true,
      };
    }
    if (n === 4) {
      return {
        id: 4, title: "Fast Tub", metresNeeded: 6, bandWidth: "mid", bandH: 14,
        tubRpm: 0.9, snapLimit: 2, metrePerSecInBand: 0.42, sagNoGain: true,
      };
    }
    if (n === 5) {
      return {
        id: 5, title: "Thin Cloud", metresNeeded: 7, bandWidth: "thin", bandH: 11,
        tubRpm: 1.1, snapLimit: 2, metrePerSecInBand: 0.45, sagNoGain: true,
      };
    }
    return {
      id: n,
      title: "Sugar Edge",
      metresNeeded: 7 + t,
      bandWidth: "thinner",
      bandH: Math.max(6, 11 - 0.5 * t),
      tubRpm: Math.min(2.2, 1.1 + 0.12 * t),
      snapLimit: 2,
      metrePerSecInBand: Math.min(0.6, 0.45 + 0.02 * t),
      sagNoGain: true,
    };
  }

  function fairyflossCoda(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const mount = fairyflossMountParams(stage);
    return applyBand(Object.assign({}, mount, {
      id: stage,
      title: `Sugar Edge ${stage}`,
      kind: "coda",
      bandMid: 0.7,
      snapMs: Math.max(180, 260 - 8 * (stage - AUTHORED_COUNT)),
      wander: true,
      pulse: true,
      tallCone: stage % 2 === 0,
      liar: true,
      sticky: true,
      liarLo: 0.34,
      liarHi: 0.56,
      coda: true,
      barker: `ENDLESS — Sugar Edge ${stage}. Band shrinks. Tub climbs.`,
    }));
  }

  function fairyflossStageParams(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) return applyBand(Object.assign({}, AUTHORED[stage - 1]));
    if (!CODA_ENABLED) return null;
    return fairyflossCoda(stage);
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun || typeof kitRun.declare !== "function") return;
    try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: fairyflossStageParams,
      codaParams: fairyflossCoda,
      mountParams: fairyflossMountParams,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function card() {
    return el("fairyFlossCard");
  }

  function cabinetOn() {
    const node = document.getElementById("cabinet-fairy-floss");
    return !!(node && !node.hidden);
  }

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function attractSpec() {
    return fairyflossStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function liveSpec() {
    if (run && run.spec) return run.spec;
    return attractSpec();
  }

  function snapMsOf(spec) {
    return (spec && spec.snapMs) || SNAP_MS;
  }

  function roomTell(spec) {
    if (!spec) return "WIND THE CLOUD";
    if (spec.kind === "coda") return "ENDLESS — SUGAR EDGE CLIMB";
    if (spec.kind === "comboFinale") return "TWIN + GUST + FAKE SNAP + REVERSE PULSE";
    if (spec.kind === "pulseTub" || spec.pulse) return "TUB PULSES — MATCH THE SINE";
    if (spec.sagEats) return "SAG EATS METRES — CATCH UP AFTER";
    if (spec.fakeSnap) return "FAKE SNAPS — IGNORE THE BOOTH";
    if (spec.invertDrag) return "REVERSE — PULL DOWN TO WIND UP";
    if (spec.gust || spec.gustOnce) return "GUST JUMPS THE BAND — RIDE IT";
    if (spec.dualNeedle) return "TWO NEEDLES — BOTH MUST SIT SWEET";
    return "CIRCLE THE CONE · KEEP THE PINK BAND";
  }

  function drawRoomCard(ctx, spec, ms) {
    if (!spec || !(ms > 0)) return;
    const a = Math.min(1, ms / 220);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(12,6,9,0.92)";
    ctx.fillRect(22, 168, W - 44, 108);
    ctx.strokeStyle = spec.coda ? "#e8a0b8" : "#f4a0c0";
    ctx.lineWidth = 2.2;
    ctx.strokeRect(22.5, 168.5, W - 45, 107);
    ctx.fillStyle = spec.coda ? "#e8a0b8" : "#d4a45a";
    ctx.font = "bold 11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(spec.coda ? "ENDLESS CLOUD" : "AUTHORED STAGE", W / 2, 190);
    ctx.fillStyle = "#fff6ec";
    ctx.font = "bold 20px Georgia, serif";
    ctx.fillText(spec.title, W / 2, 218);
    ctx.fillStyle = "#e8a0b8";
    ctx.font = "11px Georgia, serif";
    ctx.fillText(roomTell(spec), W / 2, 246);
    ctx.restore();
  }

  function kindWash(ctx, spec) {
    if (!spec) return;
    let col = null;
    if (spec.kind === "comboFinale") col = "rgba(196,30,58,0.10)";
    else if (spec.fakeSnap) col = "rgba(244,160,192,0.10)";
    else if (spec.invertDrag) col = "rgba(184,232,224,0.08)";
    else if (spec.gust || spec.gustOnce) col = "rgba(255,246,236,0.08)";
    else if (spec.sagEats) col = "rgba(212,164,90,0.10)";
    else if (spec.dualNeedle) col = "rgba(232,160,184,0.10)";
    else if (spec.pulse) col = "rgba(196,30,58,0.08)";
    else if (spec.coda) col = "rgba(232,160,184,0.10)";
    if (!col) return;
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, W, H);
  }

  function coneOf(spec) {
    return spec && spec.tallCone ? TALL_CONE : CONE;
  }

  function invertActive(spec) {
    if (!spec) return false;
    if (spec.invertDrag) return true;
    if (run && run.invertUntil > (run.t || 0)) return true;
    return false;
  }

  function liveBand(spec, t) {
    const s = spec || fairyflossStageParams(1);
    let lo = s.lo;
    let hi = s.hi;
    if (s.wander) {
      const mid = (lo + hi) / 2;
      const half = (hi - lo) / 2;
      const drift = Math.sin((t || 0) * 0.00105) * 0.16;
      lo = kit.clamp(mid + drift - half, 0.08, 0.74);
      hi = kit.clamp(mid + drift + half, 0.26, 0.94);
    }
    if (s.pulse) {
      const mid = (lo + hi) / 2;
      const half = ((hi - lo) / 2) * (1 + 0.32 * Math.sin((t || 0) * 0.0036));
      lo = kit.clamp(mid - half, 0.08, 0.74);
      hi = kit.clamp(mid + half, 0.26, 0.94);
    }
    if (run && run.gustUntil > (run.t || 0)) {
      const jump = (run.gustSign || 1) * (s.gustJump != null ? s.gustJump : 0.12);
      lo = kit.clamp(lo + jump, 0.08, 0.74);
      hi = kit.clamp(hi + jump, 0.26, 0.94);
    }
    return { lo, hi };
  }

  function liarBand(spec) {
    if (!spec || !spec.liar) return null;
    return {
      lo: spec.liarLo != null ? spec.liarLo : 0.34,
      hi: spec.liarHi != null ? spec.liarHi : 0.56,
    };
  }

  function tensionState(spec, tension, t) {
    const band = liveBand(spec, t);
    const tooClose = !!(run && run.tooClose);
    const t2 = run && run.tension2 != null ? run.tension2 : tension;
    const inA = !tooClose && tension >= band.lo && tension <= band.hi;
    const liar = liarBand(spec);
    const onLiar = !!(!tooClose && liar && tension >= liar.lo && tension <= liar.hi && !inA);
    if (spec && spec.dualNeedle) {
      const inB = !tooClose && t2 >= band.lo && t2 <= band.hi;
      const overA = !tooClose && (tension > band.hi || onLiar);
      const overB = !tooClose && t2 > band.hi;
      const sagA = tooClose || (tension < band.lo && !onLiar);
      const sagB = tooClose || t2 < band.lo;
      return {
        lo: band.lo,
        hi: band.hi,
        inBand: inA && inB,
        inA,
        inB,
        dual: true,
        onLiar,
        tooClose,
        over: overA || overB,
        sag: (sagA || sagB) && !overA && !overB,
      };
    }
    return {
      lo: band.lo,
      hi: band.hi,
      inBand: inA,
      onLiar,
      tooClose,
      over: !tooClose && (tension > band.hi || onLiar),
      sag: tooClose || (tension < band.lo && !onLiar),
    };
  }

  function pulseMul(spec, t) {
    if (!spec || !spec.pulse) return 1;
    return 1 + 0.42 * Math.sin((t || 0) * 0.0036);
  }

  function cheatLabel(spec) {
    if (!spec) return "";
    if (spec.kind === "coda") return "SUGAR EDGE";
    if (spec.kind === "comboFinale") return "SUGAR OPERA";
    if (spec.kind === "pulseTub" || (spec.pulse && !spec.dualNeedle)) return "TUB PULSE";
    if (spec.sagEats) return "SAG EATS";
    if (spec.fakeSnap) return "FAKE SNAPS";
    if (spec.invertDrag) return "REVERSE WIND";
    if (spec.gust || spec.gustOnce) return "GUST STALL";
    if (spec.dualNeedle) return "TWIN STRAND";
    return "";
  }

  function hudLine(spec, playing) {
    if (!spec) return "STAGE 0";
    if (spec.coda) return `ENDLESS · STAGE ${playing} · ${spec.title}`;
    return `STAGE ${playing} · ${spec.title}`;
  }

  function stageEl() {
    const host = card();
    return (host && host.querySelector(".vendor-stage")) || null;
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
      hud.textContent = "STAGE 0";
      hud.hidden = true;
    }
    return hud;
  }

  function ensurePips(count) {
    const stage = stageEl();
    if (!stage) return;
    let span = stage.querySelector("[data-runkit-strikes]");
    const n = Math.max(2, count || 3);
    if (!span) {
      span = document.createElement("span");
      span.className = "strike-pips";
      span.dataset.runkitStrikes = GAME_ID;
      span.setAttribute("aria-hidden", "true");
      stage.appendChild(span);
    }
    if (span.querySelectorAll("i").length !== n) {
      span.innerHTML = Array.from({ length: n }, () => "<i></i>").join("");
    }
    if (run) {
      const lit = run.snaps | 0;
      span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < lit));
    }
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
      deathReason: partial.deathReason || "snap",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    const metres = payload.meta.totalMetres || 0;
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestFairyFloss = Math.max(state.bestFairyFloss || 0, payload.depth);
      state.bestFairyFlossScore = Math.max(state.bestFairyFlossScore || 0, payload.score);
      state.bestFairyFlossMetres = Math.max(state.bestFairyFlossMetres || 0, metres);
    }
    closeKitRun(payload);
    const siblingRuns = {};
    if (state && state.lastRun && typeof state.lastRun === "object" && !Array.isArray(state.lastRun)) {
      Object.keys(state.lastRun).forEach((k) => {
        const v = state.lastRun[k];
        if (v && typeof v === "object" && v.gameId) siblingRuns[k] = v;
      });
    }
    kit.persistRun(state, GAME_ID, payload);
    if (state) {
      const keyed = Object.assign({ gameId: GAME_ID, at: Date.now() }, payload);
      state.lastRun = Object.assign({}, siblingRuns, {
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
    if (run && run.kitRun && rk() && typeof rk().reportDepth === "function") {
      const spec = liveSpec();
      try {
        rk().reportDepth(run.kitRun, n | 0, { name: spec.title, coda: !!spec.coda });
      } catch (_) { /* hud optional */ }
    }
    ensureHud();
  }

  function lastDepth() {
    const state = PF.getState() || {};
    const keyed = state.lastRun && state.lastRun[GAME_ID];
    if (keyed && keyed.depth != null) return keyed.depth | 0;
    const last = state.lastRun;
    if (last && (last.game === GAME_ID || last.gameId === GAME_ID)) return last.depth | 0;
    return Math.max(state.bestFairyFloss || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }

  function tellStrike(reason) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportStrike !== "function") return;
    try { rk().reportStrike(run.kitRun, reason); } catch (_) { /* pips */ }
    ensurePips((liveSpec() && liveSpec().snapLimit) || 2);
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

  function mountHold(ctx) {
    const engines = rk() && rk().engines;
    if (!engines || !engines.HoldBand || typeof engines.HoldBand.mount !== "function" || !ctx) return null;
    try {
      /* Launcher only. Stall owns wind-rate tension + SNAP death.
       * HoldBand.tick is Love rise/fall — do not drive the cone with it.
       * Shadow ctx so reportDepth/finishRun cannot steal the coin run. */
      return engines.HoldBand.mount(el("fairyFlossCanvas") || card(), {
        stageParams: fairyflossStageParams,
        graceStrikes: 99,
        onClear() {},
      }, shadowCtx(ctx));
    } catch (_) {
      return null;
    }
  }

  function resetPips() {
    const host = card();
    const pips = (host && host.querySelector("[data-runkit-strikes]")) || document.querySelector("[data-runkit-strikes=\"fairyfloss\"]");
    if (!pips) return;
    pips.querySelectorAll("i").forEach((n) => n.classList.remove("on"));
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
    ensurePips();
    const canvas = el("fairyFlossCanvas");
    if (canvas) {
      canvas.classList.toggle("is-locked", !isLive());
      canvas.style.touchAction = "none";
    }
    if (!isLive() && (!run || run.done)) setText("fairyFlossStatus", DEPTH_COPY.status);
  }

  function punchStart() {
    stampDepthCopy();
    setText("fairyFlossStatus", DEPTH_COPY.punch);
    const btn = el("fairyFlossStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("fairyfloss")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
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
      if (idleClock > IDLE_ROOM_MS) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
      }
      draw(now);
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }

  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") {
      return rk().challengeText("Fairy Floss stage", depth, GAME_ID);
    }
    return `Beat my Fairy Floss stage ${depth | 0} on Penny Fever`;
  }

  function angOf(x, y, cone) {
    return Math.atan2(y - cone.y, x - cone.x);
  }

  function wrapDelta(a, b) {
    let d = b - a;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return d;
  }

  function drawFloss(ctx, metres, need, snapped, sagging, t, cone) {
    const frac = kit.clamp(need ? metres / need : 0, 0, 1);
    const turns = 3 + frac * 9;
    const maxR = 18 + frac * 52;
    const droop = sagging ? 18 : 0;
    ctx.save();
    ctx.translate(cone.x, cone.y + 8 + droop * 0.35);
    ctx.strokeStyle = snapped ? "rgba(240,208,154,0.28)" : (sagging ? "rgba(244,160,192,0.45)" : "#f4a0c0");
    ctx.lineWidth = snapped ? 1.2 : (sagging ? 1.6 : 2.4);
    ctx.beginPath();
    for (let i = 0; i <= 90; i += 1) {
      const u = i / 90;
      const a = u * turns * TAU + t * 0.002;
      const r = 6 + u * maxR;
      const x = Math.cos(a) * r;
      const y = u * 92 - 8 + Math.sin(a * 0.7) * 3 + droop * u * u;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (!snapped && frac > 0.08) {
      ctx.strokeStyle = sagging ? "rgba(255,246,236,0.18)" : "rgba(255,246,236,0.45)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBits(ctx) {
    if (!run || !run.bits) return;
    run.bits.forEach((b) => {
      const age = b.life / b.max;
      ctx.globalAlpha = Math.max(0, age);
      ctx.strokeStyle = "#f4a0c0";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + b.vx * 18, b.y + b.vy * 18);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  function drawMeter(ctx, spec, st, tension) {
    ctx.fillStyle = "rgba(12,6,9,0.55)";
    ctx.fillRect(METER.x - 6, METER.y - 18, METER.w + 12, METER.h + 36);
    ctx.strokeStyle = "rgba(212,164,90,0.45)";
    ctx.strokeRect(METER.x - 5.5, METER.y - 17.5, METER.w + 11, METER.h + 35);
    ctx.fillStyle = "#1a0c10";
    ctx.fillRect(METER.x, METER.y, METER.w, METER.h);

    const liar = liarBand(spec);
    if (liar) {
      const ly = METER.y + (1 - liar.hi) * METER.h;
      const lh = (liar.hi - liar.lo) * METER.h;
      ctx.fillStyle = "rgba(244,160,192,0.55)";
      ctx.fillRect(METER.x + 2, ly, METER.w - 4, lh);
      ctx.strokeStyle = "#f4a0c0";
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(METER.x + 2.5, ly + 0.5, METER.w - 5, lh - 1);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(244,160,192,0.95)";
      ctx.font = "bold 9px Georgia, serif";
      ctx.textAlign = "left";
      ctx.fillText("LIES", METER.x + METER.w + 8, ly + lh / 2 + 3);
    }

    const bandY = METER.y + (1 - st.hi) * METER.h;
    const bandHpx = (st.hi - st.lo) * METER.h;
    ctx.fillStyle = st.inBand ? "rgba(255,246,236,0.38)" : "rgba(240,208,154,0.16)";
    ctx.fillRect(METER.x + 2, bandY, METER.w - 4, bandHpx);
    ctx.strokeStyle = st.inBand ? "#fff6ec" : "rgba(240,208,154,0.55)";
    ctx.strokeRect(METER.x + 2.5, bandY + 0.5, METER.w - 5, bandHpx - 1);

    const needleY = METER.y + (1 - tension) * METER.h;
    ctx.fillStyle = st.over ? "#c41e3a" : (st.inBand ? "#fff6ec" : "#d4a45a");
    ctx.fillRect(METER.x - 4, needleY - 3, METER.w + 8, 6);
    if (spec.dualNeedle) {
      const t2 = run && run.tension2 != null ? run.tension2 : tension;
      const n2 = METER.y + (1 - t2) * METER.h;
      ctx.fillStyle = st.inB ? "#e8a0b8" : "#c41e3a";
      ctx.fillRect(METER.x - 2, n2 - 2, METER.w + 4, 4);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "bold 8px Georgia, serif";
      ctx.textAlign = "left";
      ctx.fillText("A", METER.x - 14, needleY + 3);
      ctx.fillText("B", METER.x - 14, n2 + 3);
    }

    ctx.fillStyle = "#f0d09a";
    ctx.font = "10px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText(spec.liar ? "PALE" : "SWEET", METER.x + METER.w + 8, bandY + bandHpx / 2 + 3);
    ctx.fillText("SNAP", METER.x + METER.w + 8, METER.y + 12);
    ctx.fillText("SAG", METER.x + METER.w + 8, METER.y + METER.h - 4);
  }

  function draw(now) {
    const canvas = el("fairyFlossCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (run) run.shake = kit.applyShake(ctx, run.shake || 0);

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#2a1220");
    g.addColorStop(0.5, "#180a12");
    g.addColorStop(1, "#0c0608");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const spec = liveSpec();
    const t = run ? run.t : (now || 0);
    const cone = coneOf(spec);
    const rpm = spec.tubRpm * pulseMul(spec, t);
    const spin = t * 0.001 * rpm * TAU;
    const attractBand = liveBand(spec, t);
    const attractMid = (attractBand.lo + attractBand.hi) / 2;
    const attractAmp = spec.liar ? 0.28 : 0.18;
    const tension = run && (isLive() || run.dying)
      ? run.tension
      : attractMid + Math.sin(t * 0.0018) * attractAmp;
    const st = tensionState(spec, tension, t);

    kit.fillWood(ctx, 48, 328, 244, 118);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 2;
    ctx.strokeRect(48.5, 328.5, 243, 117);

    ctx.save();
    ctx.translate(TUB.x, TUB.y);
    ctx.fillStyle = "#3a2418";
    ctx.beginPath();
    ctx.ellipse(0, 0, TUB.rx, TUB.ry, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = spec.pulse ? "#f4a0c0" : "#d4a45a";
    ctx.lineWidth = spec.pulse ? 2.4 : 1.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, -6, TUB.rx - 10, TUB.ry - 8, 0, 0, TAU);
    ctx.fillStyle = "#5a1830";
    ctx.fill();
    for (let i = 0; i < 8; i += 1) {
      const a = spin + i * (Math.PI / 4);
      ctx.strokeStyle = i % 2 ? "rgba(244,160,192,0.55)" : "rgba(255,246,236,0.28)";
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 18, Math.sin(a) * 6 - 6, 22, 7, a, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    if (run && run.dragging) {
      ctx.strokeStyle = "rgba(244,160,192,0.45)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(TUB.x, TUB.y - 8);
      ctx.quadraticCurveTo(TUB.x + 40, cone.y + 80, cone.x, cone.y + 10);
      ctx.stroke();
    }

    const windR = spec.tallCone ? 72 : 54;
    ctx.strokeStyle = run && run.dragging ? "rgba(244,160,192,0.55)" : "rgba(240,208,154,0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cone.x, cone.y + 18, windR, 0, TAU);
    ctx.stroke();
    if (spec.dualNeedle) {
      ctx.strokeStyle = "rgba(232,160,184,0.45)";
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(cone.x, cone.y + 18, windR * 1.38, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = "#f0d09a";
    ctx.beginPath();
    ctx.moveTo(cone.x, cone.y - (spec.tallCone ? 28 : 18));
    ctx.lineTo(cone.x + 22, cone.y + (spec.tallCone ? 128 : 108));
    ctx.lineTo(cone.x - 22, cone.y + (spec.tallCone ? 128 : 108));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#8a6230";
    ctx.stroke();

    const metres = run ? run.metres : 0;
    const sagging = !!(run && run.dragging && st.sag);
    const snapped = !!(run && run.snapFlash > 0);
    drawFloss(ctx, metres, spec.metresNeeded, snapped, sagging, t, cone);
    if (spec.dualNeedle) {
      drawFloss(ctx, metres * 0.85, spec.metresNeeded, snapped, sagging, t + 180, { x: cone.x + 10, y: cone.y + 6 });
    }
    drawBits(ctx);
    drawMeter(ctx, spec, st, tension);

    kindWash(ctx, spec);

    const cheat = cheatLabel(spec);
    if (cheat) {
      ctx.fillStyle = spec.liar ? "rgba(244,160,192,0.95)" : "rgba(240,208,154,0.92)";
      ctx.font = "bold 11px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(cheat, W / 2, 54);
    }

    if (isLive() && run.roomCardMs > 0) drawRoomCard(ctx, spec, run.roomCardMs);
    else if (!isLive() && !(run && run.dying) && (!run || run.done) && idleClock < 1100) {
      drawRoomCard(ctx, spec, 1100 - idleClock);
    }

    if (isLive() && run.gustTeleUntil > run.t) {
      ctx.fillStyle = "rgba(255,246,236,0.22)";
      ctx.beginPath();
      ctx.ellipse(TUB.x + 40, TUB.y - 48, 28, 16, 0.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,246,236,0.92)";
      ctx.font = "bold 18px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("PUFF", W / 2, 86);
    } else if (run && run.fakeSnapFlash > 0) {
      ctx.fillStyle = `rgba(244,160,192,${Math.min(0.38, run.fakeSnapFlash / 420)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff6ec";
      ctx.font = "bold 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("FAKE SNAP — IGNORE", W / 2, 86);
    } else if (run && run.snapFlash > 0) {
      ctx.fillStyle = `rgba(196,30,58,${Math.min(0.45, run.snapFlash / 420)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff6ec";
      ctx.font = "bold 28px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("SNAP", W / 2, 86);
    } else if (isLive() && invertActive(spec) && !run.dragging) {
      ctx.fillStyle = "rgba(184,232,224,0.92)";
      ctx.font = "bold 20px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("REVERSE — PULL DOWN", W / 2, 86);
    } else if (isLive() && run.dragging && spec.dualNeedle && !st.inBand) {
      ctx.fillStyle = "rgba(232,160,184,0.92)";
      ctx.font = "bold 18px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(!st.inA && !st.inB ? "BOTH STRANDS" : (!st.inA ? "SPEED STRAND" : "RADIUS STRAND"), W / 2, 86);
    } else if (isLive() && run.dragging && st.tooClose) {
      ctx.fillStyle = "rgba(240,208,154,0.92)";
      ctx.font = "bold 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("CIRCLE TALL", W / 2, 86);
    } else if (isLive() && run.dragging && st.onLiar) {
      ctx.fillStyle = "rgba(244,160,192,0.9)";
      ctx.font = "bold 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("PINK LIES", W / 2, 86);
    } else if (isLive() && run.dragging && st.over) {
      ctx.fillStyle = "rgba(196,30,58,0.78)";
      ctx.font = "bold 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(spec.sticky ? "STICKY — EASE" : "EASE UP", W / 2, 86);
    } else if (isLive() && run.dragging && st.sag) {
      ctx.fillStyle = "rgba(212,164,90,0.82)";
      ctx.font = "bold 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(spec.sagEats ? "SAG EATS" : "SAG", W / 2, 86);
    }

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, "SNAP");

    if (isLive() || (run && run.dying)) {
      const mode = !run.dragging ? "LIFT" : (st.inBand ? "WINDING" : (st.over ? "TOO FAST" : "SAG"));
      kit.drawHud(ctx, W, [
        `${spec.title} · ${run.metres.toFixed(1)}/${spec.metresNeeded}m · ${run.score}`,
        `${hudLine(spec, run.stage)} · snaps ${run.snaps}/${spec.snapLimit} · ${mode}`,
      ]);
    } else if (!run || !run.closedStamp) {
      const tell = cheatLabel(spec);
      kit.drawHud(ctx, W, [
        DEPTH_COPY.idleHud[0],
        tell ? `${spec.title} · ${tell}` : DEPTH_COPY.idleHud[1],
      ]);
    }
  }

  function startStage(n) {
    const spec = fairyflossStageParams(n);
    if (!spec) {
      finish("souvenir");
      return;
    }
    run.spec = spec;
    run.stage = spec.id;
    run.metres = 0;
    run.snaps = 0;
    run.overMs = 0;
    run.dragging = false;
    run.tooClose = false;
    run.tension2 = 0.5;
    run.orbit = 0.5;
    run.lastY = 0;
    run.nextGustAt = spec.gust ? run.t + (spec.gustEveryMs || 2500) : 0;
    run.gustUntil = 0;
    run.gustTeleUntil = 0;
    run.gustSign = 1;
    run.gustFired = 0;
    run.fakeSnapsLeft = (spec.fakeSnap || spec.fakeSnapOnce) ? (spec.fakeSnapCount || 1) : 0;
    run.nextFakeSnapAt = run.fakeSnapsLeft ? run.t + 1600 : 0;
    run.fakeSnapFlash = 0;
    run.sagCatchUntil = 0;
    run.operaReverse = false;
    run.invertUntil = 0;
    run.roomCardMs = n === 1 ? 1480 : ROOM_CARD_MS;
    if (run.band && typeof run.band.hold === "function") run.band.hold(false);
    const band = liveBand(spec, run.t);
    run.tension = (band.lo + band.hi) / 2;
    tellDepth(run.depth);
    ensurePips(spec.snapLimit);
    ensureHud();
    setText("fairyFlossStatus", spec.barker || `${spec.title} — circle the cone.`);
  }

  function start() {
    if (isLive() || (run && run.dying)) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("fairyFlossStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      stampDepthCopy();
      return;
    }
    stopIdle();
    resetPips();
    run = {
      done: false,
      dying: false,
      kitRun,
      band: null,
      t: 0,
      last: 0,
      stage: 1,
      depth: 0,
      spec: fairyflossStageParams(1),
      metres: 0,
      totalMetres: 0,
      paidTenths: 0,
      score: 0,
      snaps: 0,
      tension: 0.2,
      dragging: false,
      tooClose: false,
      lastAng: 0,
      lastPtr: 0,
      overMs: 0,
      snapFlash: 0,
      fakeSnapFlash: 0,
      tension2: 0.5,
      orbit: 0.5,
      lastY: 0,
      nextGustAt: 0,
      gustUntil: 0,
      gustTeleUntil: 0,
      gustSign: 1,
      gustFired: 0,
      fakeSnapsLeft: 0,
      nextFakeSnapAt: 0,
      sagCatchUntil: 0,
      operaReverse: false,
      invertUntil: 0,
      bits: [],
      raf: 0,
      shake: 0,
      closedStamp: false,
      deathHold: 0,
      deathReason: "",
      roomCardMs: 0,
    };
    run.band = mountHold(kitRun);
    tellDepth(0);
    const startBtn = el("fairyFlossStart");
    if (startBtn) startBtn.disabled = true;
    const verdict = el("fairyFlossVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("fairyFlossResult");
    PF.setTier("fairyFlossTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    startStage(1);
    PF.focusCard("fairyFlossCard", true);
    PF.setAura("think");
    const loop = (now) => {
      if (!run || run.done) return;
      if (!run.last) run.last = now;
      const dt = Math.min(32, now - run.last);
      run.last = now;
      run.t += dt;
      if (run.dying) {
        run.roomCardMs = Math.max(0, (run.roomCardMs || 0) - dt);
        run.snapFlash = Math.max(0, run.snapFlash - dt);
        run.fakeSnapFlash = Math.max(0, (run.fakeSnapFlash || 0) - dt);
        run.bits = (run.bits || []).filter((b) => {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.life -= dt;
          return b.life > 0;
        });
        run.shake = Math.max(0, (run.shake || 0) * 0.92);
        draw(now);
        run.deathHold -= dt;
        if (run.deathHold <= 0) {
          sealResult(run.deathReason);
          return;
        }
        run.raf = requestAnimationFrame(loop);
        return;
      }
      step(dt);
      draw(now);
      PF.refreshDepth();
      run.raf = requestAnimationFrame(loop);
    };
    run.raf = requestAnimationFrame(loop);
  }

  function tickRoomCheats(spec, dt) {
    run.fakeSnapFlash = Math.max(0, (run.fakeSnapFlash || 0) - dt);
    if ((spec.gust || spec.gustOnce) && (!spec.gustOnce || run.gustFired < 1)) {
      const every = spec.gustEveryMs || 2500;
      if (!run.nextGustAt) run.nextGustAt = run.t + every;
      if (run.gustTeleUntil < run.t && run.nextGustAt - run.t < 320 && run.nextGustAt > run.t) {
        run.gustTeleUntil = run.nextGustAt;
      }
      if (run.t >= run.nextGustAt) {
        run.gustUntil = run.t + (spec.gustMs || 500);
        run.gustSign = Math.random() < 0.5 ? 1 : -1;
        run.gustFired = (run.gustFired || 0) + 1;
        run.nextGustAt = spec.gustOnce ? run.t + 1e9 : run.t + every;
        kit.sfx("spinner");
        setText("fairyFlossStatus", "GUST — ride the jump.");
      }
    }
    if (run.fakeSnapsLeft > 0 && run.dragging) {
      if (!run.nextFakeSnapAt) run.nextFakeSnapAt = run.t + 1400;
      if (run.t >= run.nextFakeSnapAt) {
        run.fakeSnapsLeft -= 1;
        run.fakeSnapFlash = 520;
        run.nextFakeSnapAt = run.t + 2200 + Math.random() * 1400;
        kit.sfx("miss");
        setText("fairyFlossStatus", "Fake snap. Ignore the booth.");
      }
    }
    if (spec.reversePulseMid && !run.operaReverse && run.metres >= spec.metresNeeded * 0.45) {
      run.operaReverse = true;
      run.invertUntil = run.t + 2800;
      setText("fairyFlossStatus", "REVERSE PULSE — pull down to wind.");
    }
  }

  function step(dt) {
    if (!isLive()) return;
    run.roomCardMs = Math.max(0, (run.roomCardMs || 0) - dt);
    run.snapFlash = Math.max(0, run.snapFlash - dt);
    run.bits = (run.bits || []).filter((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      return b.life > 0;
    });
    const spec = liveSpec();
    tickRoomCheats(spec, dt);
    const st = tensionState(spec, run.tension, run.t);
    if (!run.dragging) {
      const decay = (spec.sticky && st.over) ? 0.00055 : 0.0032;
      run.tension = Math.max(0, run.tension - decay * dt);
      if (spec.dualNeedle) run.tension2 = Math.max(0, (run.tension2 || 0.5) - decay * dt * 0.6);
      run.overMs = 0;
      return;
    }
    if (st.inBand) {
      run.overMs = 0;
      let rate = spec.metrePerSecInBand;
      if (spec.sagEats && run.sagCatchUntil > run.t) rate *= 1.55;
      const dm = rate * (dt / 1000);
      run.metres += dm;
      run.totalMetres += dm;
      const tenths = Math.floor(run.totalMetres * 10);
      if (tenths > run.paidTenths) {
        run.score += SCORE_PER_TENTH * (tenths - run.paidTenths);
        run.paidTenths = tenths;
        if (run.kitRun) run.kitRun.score = run.score;
      }
      if (run.metres >= spec.metresNeeded) clearStage();
      return;
    }
    if (st.sag && spec.sagEats) {
      run.overMs = 0;
      const eat = spec.metrePerSecInBand * 0.7 * (dt / 1000);
      run.metres = Math.max(0, run.metres - eat);
      run.sagCatchUntil = run.t + (spec.sagCatchMs || 520);
      return;
    }
    if (st.over) {
      run.overMs += dt;
      if (run.overMs >= snapMsOf(spec) || run.tension > st.hi + 0.18) snap();
    } else {
      run.overMs = 0;
    }
  }

  function pointerWind(ev) {
    if (!isLive()) return;
    const canvas = el("fairyFlossCanvas");
    if (!canvas) return;
    const spec = liveSpec();
    const cone = coneOf(spec);
    const p = kit.canvasPos(canvas, ev, W, H);
    const ang = angOf(p.x, p.y, cone);
    const now = performance.now();
    const dist = Math.hypot(p.x - cone.x, p.y - cone.y);
    const sweetR = spec.tallCone ? 72 : 58;
    run.tooClose = !!(spec.tallCone && dist < 52) || !!(spec.dualNeedle && dist < 28);
    if (spec.dualNeedle) {
      run.tension2 = kit.clamp(dist / (sweetR * 2), 0, 1);
    }
    if (!run.dragging) {
      run.dragging = true;
      run.lastAng = ang;
      run.lastPtr = now;
      run.lastY = p.y;
      if (run.band && typeof run.band.hold === "function") run.band.hold(true);
      return;
    }
    const dt = Math.max(8, now - run.lastPtr);
    if (run.tooClose) {
      run.tension += (0.12 - run.tension) * Math.min(1, dt / 80);
      run.lastAng = ang;
      run.lastPtr = now;
      run.lastY = p.y;
      return;
    }
    let raw;
    if (invertActive(spec)) {
      const dy = p.y - (run.lastY || p.y);
      const down = dy / (dt / 1000);
      raw = down <= 0 ? 0 : kit.clamp(down / 420, 0, 1);
    } else {
      const omega = Math.abs(wrapDelta(run.lastAng, ang)) / (dt / 1000);
      const expect = 9.2 * pulseMul(spec, run.t);
      raw = kit.clamp(omega / expect, 0, 1);
    }
    const st = tensionState(spec, run.tension, run.t);
    const lerpMs = (spec.sticky && st.over) ? 280 : 70;
    run.tension += (raw - run.tension) * Math.min(1, dt / lerpMs);
    run.lastAng = ang;
    run.lastPtr = now;
    run.lastY = p.y;
  }

  function pointerUp(fromLeave) {
    if (!isLive()) return;
    const spec = liveSpec();
    const st = tensionState(spec, run.tension, run.t);
    const wasDragging = run.dragging;
    run.dragging = false;
    run.tooClose = false;
    if (run.band && typeof run.band.hold === "function") run.band.hold(false);
    if (fromLeave) return;
    if (wasDragging && (run.overMs >= snapMsOf(spec) || run.tension > st.hi + 0.18)) snap();
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
    const next = fairyflossStageParams(run.depth + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    setText("fairyFlossStatus", run.depth >= 6
      ? AURA.deep(run.depth)
      : `${AURA.clear} ${next.title} — ${next.metresNeeded}m · ${cheatLabel(next) || next.bandWidth}.`);
    run.shake = 5;
    startStage(run.depth + 1);
  }

  function spawnSnapBits() {
    const cone = coneOf(liveSpec());
    for (let i = 0; i < 10; i += 1) {
      const a = Math.random() * TAU;
      run.bits.push({
        x: cone.x + (Math.random() - 0.5) * 24,
        y: cone.y + Math.random() * 40,
        vx: Math.cos(a) * 0.12,
        vy: Math.sin(a) * 0.12 - 0.04,
        life: 380 + Math.random() * 180,
        max: 560,
      });
    }
  }

  function snap() {
    if (!isLive()) return;
    const spec = liveSpec();
    const st = tensionState(spec, run.tension, run.t);
    run.snaps += 1;
    run.overMs = 0;
    run.tension = kit.clamp(st.lo + 0.02, 0.12, 0.5);
    run.dragging = false;
    if (run.band && typeof run.band.hold === "function") run.band.hold(false);
    run.snapFlash = 520;
    run.shake = 8;
    spawnSnapBits();
    tellStrike("snap");
    kit.sfx("miss");
    PF.setAura("laugh");
    setText("fairyFlossStatus", `SNAP ${run.snaps}/${spec.snapLimit} — greedy spin. Slow the circle.`);
    if (run.snaps >= spec.snapLimit) finish("snap");
  }

  function auraLine(reason, depth, metres) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (depth >= 6) return AURA.deep(depth);
    const m = Math.floor(metres || 0);
    if (m >= 1) return AURA.snapDeep(m);
    return AURA.snap;
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.dragging = false;
    if (run.band && typeof run.band.hold === "function") run.band.hold(false);
    run.deathReason = reason === "souvenir" ? "souvenir" : "snap";
    run.closedStamp = reason !== "souvenir";
    run.deathHold = DEATH_HOLD_MS;
    run.snapFlash = Math.max(run.snapFlash, 520);
    kit.sfx("stamp");
    run.shake = 8;
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    run.dragging = false;
    if (run.band && typeof run.band.hold === "function") run.band.hold(false);
    if (run.raf) cancelAnimationFrame(run.raf);
    run.closedStamp = reason !== "leave";
    const depth = run.depth | 0;
    const score = run.score;
    const metres = run.totalMetres;
    const death = reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : "snap");
    persistDepth({
      depth,
      score,
      deathReason: death,
      cashedOut: death === "souvenir",
      meta: { totalMetres: metres, snaps: run.snaps, lastStage: run.stage, kind: run.spec && run.spec.kind },
    });
    stampDepthCopy();
    const startBtn = el("fairyFlossStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "WIND AGAIN · 1 demo coin";
    }
    PF.focusCard("fairyFlossCard", false);
    kit.setMode(card(), "result");
    const mLine = `FLOSS ${metres.toFixed(1)}m`;
    const aura = auraLine(reason, depth, metres);
    const challenge = challengeLine(depth);
    const verdict = el("fairyFlossVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = `${mLine} · STAGE ${depth} · ${aura}`;
    }
    kit.fillResult({
      root: "fairyFlossResult",
      depth: "fairyFlossResultDepth",
      score: "fairyFlossResultScore",
      aura: "fairyFlossResultAura",
      copied: "fairyFlossCopied",
    }, {
      depthLine: `STAGE ${depth} · ${mLine}`,
      scoreLine: `SCORE ${score} · ${death.replace(/_/g, " ").toUpperCase()}`,
      auraLine: aura,
    });
    setText("fairyFlossChallengeText", challenge);
    PF.setTier("fairyFlossTier", depth > 0 ? `STAGE ${depth}` : "SNAP", depth > 0 ? "perfect" : "miss");
    setText("fairyFlossStatus", reason === "leave" ? "Stepped off the stall." : (reason === "souvenir" ? "Sugar souvenir. Cloud let you walk." : "Cloud stamped SNAP."));
    if (depth > 0) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Fairy floss");
      PF.setAura(depth >= 4 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `STAGE ${depth}`, `${mLine} · ${aura}`);
    } else {
      PF.award(0, false, "Fairy floss snap");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "SNAP", aura);
    }
    PF.refreshNightBoard();
    draw();
    startIdle();
  }

  PF.registerVendor({
    id: "fairy-floss",
    playKey: "fairyfloss",
    chalk: "Wind it tall — don’t snap the cloud.",
    defaults: { bestFairyFloss: 0, bestFairyFlossScore: 0, bestFairyFlossMetres: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopIdle();
    },
    onShow() { stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      const verdict = el("fairyFlossVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("fairyFlossResult");
      const startBtn = el("fairyFlossStart");
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
      setText("depthFlossNow", isLive() || (run && run.dying) ? String(run.depth | 0) : "0");
      setText("depthFlossMetres", isLive() || (run && run.dying) ? `${run.totalMetres.toFixed(1)}m` : "0m");
      const bestN = Math.max(state.bestFairyFloss || 0, (state.bestDepth && state.bestDepth.fairyfloss) || 0);
      const bestM = state.bestFairyFlossMetres || 0;
      setText("depthFlossBest", bestN ? String(bestN) : "—");
      setText("depthFlossBestM", bestM ? `${Number(bestM).toFixed(1)}m` : "—");
      const door = el("fairyFlossDoorBest");
      if (door) {
        if (bestN || bestM) {
          door.textContent = `Metres ${Math.floor(bestM || 0)} / Stage ${bestN || 0}`;
        } else {
          door.textContent = "Metres —";
        }
      }
    },
    bind() {
      declareP0();
      ensurePips();
      ensureHud();
      const startBtn = el("fairyFlossStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = el("fairyFlossCanvas");
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("pointerdown", (ev) => {
          if (run && (run.dying || run.done)) return;
          if (!isLive()) {
            punchStart();
            return;
          }
          ev.preventDefault();
          try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* optional */ }
          pointerWind(ev);
        });
        canvas.addEventListener("pointermove", (ev) => {
          if (!isLive() || !run.dragging) return;
          ev.preventDefault();
          pointerWind(ev);
        });
        canvas.addEventListener("pointerup", () => { if (isLive()) pointerUp(false); });
        canvas.addEventListener("pointercancel", () => { if (isLive()) pointerUp(false); });
        canvas.addEventListener("pointerleave", () => { if (isLive()) pointerUp(true); });
        canvas.addEventListener("lostpointercapture", () => { if (isLive()) pointerUp(false); });
      }
      const copyBtn = el("fairyFlossChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = lastDepth();
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("fairyFlossCopied");
            if (copied) copied.hidden = false;
            setText("fairyFlossStatus", "Copied — send it");
          }, () => {
            setText("fairyFlossStatus", text);
          });
        });
      }
      stampDepthCopy();
      draw();
    },
  });
})();
