/* Cover-the-Spot Cruel — Desktop Grok owns this file. PF only. Never booth/port 6000.
 * GOBLIN REVIEW HIT #2 FEEL — named rooms = verb/layout change, not a title sticker.
 * Latest: GOBLIN_P0_AUTHORED_ACCEPT_FEEL.md + GOBLIN_AUTHORED_LEVELS_P0.md +
 * GOBLIN_BATCH02_MOUNT_CONFIGS.md + GOBLIN_BATCH02_BUILD_SHEETS.md + GOBLIN_RUNKIT_API.md.
 * Engine: GreedFloor · depthUnit: Spot · gameId: coverspot · codaEnabled · cashOut between spots.
 * Tight Felt is the one allowed ratio-bridge. Oval / Twin / Ring / Drift / Blob change the felt.
 * S1 Oval ≠ round. S2 Twin: BOTH hit targetPct (not average cheese). S3 Ring: center is a trap.
 * S4 Drift: discs stick; lead the walk. S5 Blob silhouette is stable; jitter STAMPS (not a sine).
 * S6 Vestibule cheat matches the current named SPOT. twinSep is center-to-center. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const W = 340;
  const H = 440;
  const GAME_ID = "coverspot";
  const FELT = { x: 22, y: 62, w: 296, h: 312 };
  const SPOT_HOME = { x: 170, y: 218 };
  const BASE_R = 78;
  const HONEST_RATIO = 0.72;
  const MISS_DEATH = 2;
  const CODA_ENABLED = true;
  const AUTHORED_COUNT = 7;
  const GRID = 64;
  const SNAP = 5.2;
  const LATENCY = 90;
  const STAMP_MS = 720;
  const SETTLE_MS = 3800;
  const DRIFT_DWELL = 420;
  const JITTER_DWELL = 220;
  const STAMP_HOLD = 0.76;
  const TRAP_FLASH_MS = 980;
  const IDLE_ROOM_MS = 3600;

  let run = null;
  let pointer = { x: SPOT_HOME.x, y: SPOT_HOME.y, on: false };
  let idleRaf = 0;
  let idleRoom = 1;
  let idleClock = 0;

  /* BATCH02 Aura VO — solo Aura, playful. Exact GOBLIN_BATCH02_AURA_LINES.md. */
  const AURA = {
    bust: "Aura: Spot uncovered. Greed ate the felt.",
    miss_table: "Aura: Disc bounced off the counter. Rude.",
    cash: "Aura: Smart cover. Depth sticks — leave the rest.",
    clear: "Aura: Coverage locked. Next felt tells a different lie.",
    souvenir: "Aura: Seven spots. The felt ran out of authored lies.",
    coda: "Aura: Authored ride’s over. ENDLESS — jitter keeps lying.",
    deep: (n) => `Aura: Spot ${n}. You're covering lies with skill.`,
    leave: "Aura: Left the counter. The red circle stays.",
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 7 authored SPOTs · cash out between spots · ENDLESS coda after Jitter Stamp",
    body: "Authored rooms, not a smaller circle: Red Circle Honest → Tight Felt → Oval Blush → Drifting Dot → Twin Spots → Ring Spot → Jitter Stamp. Tap to drop. Hit the target or bust. Cash out only after a clear.",
    status: "Depth run · START · 1 demo coin · 7 authored spots, then ENDLESS",
    machine: "Felt counter · 1 demo coin · authored SPOTs",
    idleHud: ["Authored SPOTs — oval / twin / ring / blob", "START · 1 demo coin — cash out or get greedy"],
    punch: "Depth run — press START. No one-tap prize.",
  };

  /* Authored SPOT rooms — unique shape / cheat / beat. Tight Felt is the one allowed ratio-bridge.
   * twinSep is CENTER-TO-CENTER. HIT #2: twinSep > 2*twinR so a mid dump cannot Venn-cheese both. */
  const COVER_LEVELS = [
    {
      id: 1, name: "Red Circle Honest", kind: "circle",
      ratio: 0.72, targetPct: 70, maxDiscs: 4, drift: "none", R: 78,
      barker: "Red Circle Honest. Tap the felt. One disc never covers — that’s the joke.",
    },
    {
      id: 2, name: "Tight Felt", kind: "circle", tight: true,
      ratio: 0.68, targetPct: 75, maxDiscs: 4, drift: "none", R: 78,
      barker: "Tight Felt. Same circle, meaner fit. Cover 75%.",
    },
    {
      id: 3, name: "Oval Blush", kind: "oval", ovalW: 1.3, ovalH: 0.72, ovalRot: 0.4,
      ratio: 0.70, targetPct: 72, maxDiscs: 5, drift: "none", R: 66,
      barker: "Oval Blush. Round discs, oval spot. The ears stay red — that’s the joke.",
    },
    {
      id: 4, name: "Drifting Dot", kind: "drift",
      ratio: 0.70, targetPct: 74, maxDiscs: 5, drift: "slow", R: 70,
      driftRad: 38, driftPeriod: 5400,
      barker: "Drifting Dot. The red walks. Discs stick. Lead it.",
    },
    {
      id: 5, name: "Twin Spots", kind: "twin",
      ratio: 0.72, targetPct: 70, maxDiscs: 5, drift: "none", R: 78,
      twinSep: 88, twinR: 36,
      barker: "Twin Spots. Two circles. Cover both — each must hit the mark. A center dump is a lie.",
    },
    {
      id: 6, name: "Ring Spot", kind: "ring",
      ratio: 0.56, targetPct: 72, maxDiscs: 5, drift: "none", R: 86, innerRatio: 0.48,
      barker: "Ring Spot. Donut felt. Center is a trap — cover the ring.",
    },
    {
      id: 7, name: "Jitter Stamp", kind: "blob",
      ratio: 0.72, targetPct: 85, maxDiscs: 6, drift: "jitter", R: 68,
      blobA: 0.34, blobB: 0.22, blobPhase: 0.6, stampAmp: 20, stampMs: 500,
      barker: "Jitter Stamp. Blob + nerves. Cover the lumps, lock on the HOLD, then it stamps.",
    },
  ];

  const P0_MOUNT = {
    engine: "GreedFloor",
    displayName: "Cover-the-Spot Cruel",
    depthUnit: "Spot",
    sheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
    batchSheet: "GOBLIN_BATCH02_BUILD_SHEETS.md",
    cashOut: true,
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  function rk() {
    return PF.runKit || null;
  }

  function coverspotCodaParams(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const t = stage - AUTHORED_COUNT;
    return {
      id: stage,
      name: `Felt Greed ${stage}`,
      title: `Felt Greed ${stage}`,
      kind: "blob",
      coda: true,
      ratio: Math.max(0.42, 0.56 - 0.02 * t),
      targetPct: Math.min(94, 85 + t),
      maxDiscs: 6,
      drift: "jitter",
      R: Math.max(48, BASE_R - t * 2.2),
      blobA: 0.28,
      blobB: 0.16,
      blobPhase: 0.35 + stage * 0.17,
      stampAmp: Math.min(28, 18 + t * 1.4),
      stampMs: Math.max(320, 500 - t * 14),
      barker: `ENDLESS · Felt Greed ${stage}. Authored ride ended. Smaller discs. Jitter stays.`,
    };
  }

  function hydrate(level) {
    const spec = Object.assign({ coda: false }, level);
    spec.R = spec.R || BASE_R;
    spec.ovalW = spec.ovalW || 1.3;
    spec.ovalH = spec.ovalH == null ? 1 : spec.ovalH;
    spec.ovalRot = spec.ovalRot || 0;
    spec.innerRatio = spec.innerRatio == null ? 0.48 : spec.innerRatio;
    spec.twinSep = spec.twinSep == null ? 88 : spec.twinSep;
    spec.twinR = spec.twinR == null ? spec.R * 0.46 : spec.twinR;
    spec.blobA = spec.blobA == null ? 0 : spec.blobA;
    spec.blobB = spec.blobB == null ? 0 : spec.blobB;
    spec.blobPhase = spec.blobPhase == null ? 0 : spec.blobPhase;
    spec.driftRad = spec.driftRad == null ? 34 : spec.driftRad;
    spec.driftPeriod = spec.driftPeriod == null ? 5200 : spec.driftPeriod;
    spec.stampAmp = spec.stampAmp == null ? 20 : spec.stampAmp;
    spec.stampMs = spec.stampMs == null ? 500 : spec.stampMs;
    spec.gridStamp = spec.gridStamp || GRID;
    spec.deathOnFailTarget = true;
    const discBase = spec.kind === "twin" ? spec.twinR : spec.R;
    spec.r = spec.ratio * discBase;
    spec.honestR = HONEST_RATIO * spec.R;
    spec.latency = LATENCY;
    spec.snap = SNAP;
    spec.title = spec.coda ? `ENDLESS · ${spec.name}` : spec.name;
    spec.enter = spec.barker || spec.enter || spec.name;
    spec.spotDrift = spec.drift;
    spec.tight = !!(spec.tight || (spec.id === 2 && spec.kind === "circle"));
    return spec;
  }

  function coverspotStageParams(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) return hydrate(COVER_LEVELS[stage - 1]);
    if (!CODA_ENABLED) return null;
    return hydrate(coverspotCodaParams(stage));
  }

  function nextLevelId(currentId) {
    const next = (currentId | 0) + 1;
    if (next <= AUTHORED_COUNT) return next;
    if (CODA_ENABLED) return next;
    return 0;
  }

  function hudStageLine(spec) {
    if (!spec) return "SPOT 0";
    if (spec.coda) return `ENDLESS · SPOT ${spec.id} · ${spec.name}`;
    return `SPOT ${spec.id} · ${spec.name}`;
  }

  function roomTell(spec) {
    if (!spec) return "ONE DISC NEVER COVERS";
    if (spec.kind === "oval") return "ROUND DISCS · OVAL SPOT";
    if (spec.kind === "drift") return "THE RED WALKS · DISCS STICK";
    if (spec.kind === "twin") return "TWO CIRCLES · COVER BOTH";
    if (spec.kind === "ring") return "DONUT · CENTER IS A TRAP";
    if (spec.kind === "blob") return spec.coda ? "ENDLESS · BLOB + STAMP" : "BLOB + STAMP · LOCK THE HOLD";
    if (spec.tight || spec.id === 2) return "SAME CIRCLE · MEANER FIT";
    return "ONE DISC NEVER COVERS";
  }

  function paintRoomChrome(spec, force) {
    const host = card();
    if (!host || !spec) return;
    /* Result card keeps the death-room cheat; idle cycle must not steal it. */
    if (!force && host.classList.contains("is-result")) return;
    host.dataset.coverKind = spec.kind || "circle";
    host.dataset.coverId = String(spec.id || "");
    host.dataset.coverName = spec.name || "";
    host.dataset.coverTight = (spec.tight || spec.id === 2) ? "1" : "0";
    host.dataset.coverCoda = spec.coda ? "1" : "0";
    host.dataset.coverDrift = spec.drift || "none";
    const prop = host.querySelector(".signature-prop--coverspot");
    if (prop) {
      prop.dataset.kind = spec.kind || "circle";
      prop.dataset.drift = spec.drift || "none";
    }
    const barker = host.querySelector(".barker-call");
    if (barker) {
      barker.textContent = spec.coda
        ? `ENDLESS · ${spec.name.toUpperCase()} — ${roomTell(spec)}`
        : `${spec.name.toUpperCase()} — ${roomTell(spec)}`;
    }
    const joke = host.querySelector(".tent-mouth-joke");
    if (joke) joke.textContent = spec.barker || spec.enter;
    const now = $("depthCoverNow");
    if (now) now.textContent = hudStageLine(spec);
  }

  function isLiveDrift(spec) {
    if (!spec) return false;
    return spec.kind === "drift" || spec.drift === "slow" || spec.drift === "jitter" || spec.kind === "blob";
  }

  function dwellNeed(spec) {
    if (!spec || !isLiveDrift(spec)) return 0;
    if (spec.drift === "jitter" || spec.kind === "blob") return JITTER_DWELL;
    return DRIFT_DWELL;
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    const spec = Object.assign({
      authored: COVER_LEVELS,
      authoredCount: AUTHORED_COUNT,
      cashOut: true,
      codaEnabled: CODA_ENABLED,
      codaParams: coverspotCodaParams,
      level: coverspotStageParams,
      stageParams: coverspotStageParams,
      coverspotStageParams,
    }, P0_MOUNT);
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, spec); } catch (_) { /* already declared */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = spec;
    kitRun.declared = kitRun.declared || {};
    kitRun.declared[GAME_ID] = spec;
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function card() {
    return $("coverSpotCard");
  }

  function statusEl() {
    return $("coverSpotStatus");
  }

  function setStatus(text) {
    const el = statusEl();
    if (el) el.textContent = text;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function isLive() {
    return !!(run && !run.done && run.kitRun && run.kitRun.alive !== false);
  }

  function pokeDepth() {
    if (typeof PF.refreshDepth === "function") {
      try { PF.refreshDepth(); } catch (_) { /* ignore */ }
    }
  }

  function resetPips() {
    const pips = document.querySelector('[data-runkit-strikes="' + GAME_ID + '"]');
    if (!pips) return;
    pips.querySelectorAll("i").forEach((el) => el.classList.remove("on"));
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall through */ }
    }
    return kit.persistRun(PF.getState(), GAME_ID, partial);
  }

  function persistDepth(partial) {
    if (run && run.persisted) return;
    if (run) run.persisted = true;
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "bust",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestCoverStages = Math.max(state.bestCoverStages || 0, payload.depth);
      if (partial.pct != null) state.bestCoverPct = Math.max(state.bestCoverPct || 0, partial.pct | 0);
      if (partial.discs != null) state.bestCoverDiscs = Math.max(state.bestCoverDiscs || 0, partial.discs | 0);
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
    }
    closeKitRun(payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function saveLiveDepth() {
    if (!run) return;
    const state = PF.getState();
    if (!state) return;
    const depth = run.stagesCleared | 0;
    const score = run.score | 0;
    const pct = Math.floor((run.bestPct || 0) * 100);
    state.bestCoverStages = Math.max(state.bestCoverStages || 0, depth);
    state.bestCoverPct = Math.max(state.bestCoverPct || 0, pct);
    state.bestCoverDiscs = Math.max(state.bestCoverDiscs || 0, run.discsPlaced | 0);
    state.bestDepth = state.bestDepth || {};
    state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, depth);
    if (run.kitRun) {
      run.kitRun.depth = depth;
      run.kitRun.score = score;
    }
    if (typeof PF.saveState === "function") PF.saveState();
    pokeDepth();
  }

  function beginKitRun() {
    let feverNode = false;
    if (typeof PF.spendDemoCoin === "function") {
      if (!PF.spendDemoCoin(GAME_ID)) return null;
      feverNode = true;
    }
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      try {
        const ctx = PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1, feverNode });
        if (ctx) return ctx;
      } catch (_) { /* local ctx */ }
    }
    return {
      gameId: GAME_ID,
      startedAt: Date.now(),
      feverNode,
      feverGate: null,
      depth: 0,
      score: 0,
      strikes: 0,
      alive: true,
    };
  }

  function mountGreed(runCtx) {
    const engines = rk() && rk().engines;
    if (!engines || !engines.GreedFloor || typeof engines.GreedFloor.mount !== "function" || !runCtx) {
      return {
        id: "GreedFloor",
        cashOut() { finish("cash"); },
        action() {},
        get floor() { return run ? run.spec.id : 1; },
      };
    }
    try {
      /* Chrome only. Stall owns disc drops, coverage, bust / miss_table.
       * deathRule always false so GreedFloor.action cannot steal the run.
       * Buttons call stall cashOut() — never engine.cashOut() — so depth = spots cleared. */
      const mounted = engines.GreedFloor.mount(card(), {
        cashOut: true,
        stageParams: coverspotStageParams,
        doAction() {},
        evaluate() {
          if (!run) return { coverage: 0, gain: 0, risk: 0 };
          return {
            coverage: run.coverage,
            discsUsed: run.discs.length,
            targetPct: run.spec.targetPct,
            gain: 0,
            risk: 0,
          };
        },
        canCashOut() { return canBank(); },
        deathRule() { return false; },
      }, runCtx);
      if (runCtx) {
        runCtx.depth = 0;
        runCtx.score = 0;
      }
      return mounted;
    } catch (_) {
      return null;
    }
  }

  function maxExtent(spec) {
    if (!spec) return BASE_R;
    if (spec.kind === "oval") {
      const rx = spec.R * (spec.ovalW || 1.3);
      const ry = spec.R * (spec.ovalH == null ? 1 : spec.ovalH);
      const rot = spec.ovalRot || 0;
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const hx = Math.sqrt(rx * rx * c * c + ry * ry * s * s);
      const hy = Math.sqrt(rx * rx * s * s + ry * ry * c * c);
      return Math.max(hx, hy);
    }
    if (spec.kind === "twin") return twinHalf(spec) + (spec.twinR || spec.R * 0.46);
    if (spec.kind === "blob") {
      return spec.R * (1 + (spec.blobA || 0) + (spec.blobB || 0) + 0.1) + (spec.stampAmp || 20);
    }
    const walk = spec.drift === "slow" || spec.kind === "drift"
      ? (spec.driftRad || 34)
      : spec.drift === "jitter" || spec.kind === "blob"
        ? (spec.stampAmp || 20)
        : 0;
    return spec.R + walk * 0.25;
  }

  function twinHalf(spec) {
    return (spec && spec.twinSep != null ? spec.twinSep : 88) * 0.5;
  }

  /* Blob silhouette is authored and stable. Jitter is a stamp, not a morphing lottery. */
  function blobRadius(theta, spec) {
    const R = spec.R || BASE_R;
    const phase = spec.blobPhase || 0;
    return R * (1
      + (spec.blobA || 0) * Math.sin(3 * theta + phase)
      + (spec.blobB || 0) * Math.sin(5 * theta + phase * 1.7)
      + 0.05 * Math.sin(2 * theta + phase * 0.6));
  }

  function stampPhase(spec, t) {
    const period = (spec && spec.stampMs) || 500;
    const amp = (spec && spec.stampAmp) || 20;
    const hop = Math.floor((t || 0) / period);
    const k = ((t || 0) % period) / Math.max(1, period);
    const holding = k < STAMP_HOLD;
    return {
      period,
      amp,
      hop,
      k,
      holding,
      hopping: !holding,
      telegraph: holding && k >= STAMP_HOLD - 0.18,
    };
  }

  function stampPos(hop, amp) {
    const a = hop * 2.399;
    return { x: Math.sin(a) * amp, y: Math.cos(a * 1.37) * amp * 0.72 };
  }

  /* S4: slow figure-8 walk you can lead. S5: jitter is a hold-then-hop STAMP, not the same sine. */
  function spotOffset(spec, t) {
    const kind = spec && spec.drift;
    if (kind === "slow" || (spec && spec.kind === "drift")) {
      const rad = spec.driftRad || 34;
      const period = spec.driftPeriod || 5200;
      const ang = ((t || 0) / period) * Math.PI * 2;
      return { x: Math.cos(ang) * rad, y: Math.sin(ang * 2) * rad * 0.46 };
    }
    if (kind === "jitter" || (spec && spec.kind === "blob")) {
      const ph = stampPhase(spec, t);
      const p0 = stampPos(ph.hop, ph.amp);
      if (ph.holding) return p0;
      const p1 = stampPos(ph.hop + 1, ph.amp);
      const u = (ph.k - STAMP_HOLD) / Math.max(0.001, 1 - STAMP_HOLD);
      const e = u * u * (3 - 2 * u);
      return { x: p0.x + (p1.x - p0.x) * e, y: p0.y + (p1.y - p0.y) * e };
    }
    return { x: 0, y: 0 };
  }

  function makeSpots(spec, origin, t) {
    const home = origin || SPOT_HOME;
    const off = spotOffset(spec, t || 0);
    const pad = maxExtent(spec) + 8;
    const ox = clamp(home.x + off.x, FELT.x + pad, FELT.x + FELT.w - pad);
    const oy = clamp(home.y + off.y, FELT.y + pad, FELT.y + FELT.h - pad);
    const kind = spec.kind || "circle";
    if (kind === "oval") {
      return [{
        kind: "oval",
        x: ox,
        y: oy,
        rx: spec.R * (spec.ovalW || 1.3),
        ry: spec.R * (spec.ovalH == null ? 1 : spec.ovalH),
        rot: spec.ovalRot || 0,
      }];
    }
    if (kind === "twin") {
      const sep = twinHalf(spec);
      const r = spec.twinR;
      return [
        { kind: "circle", x: ox - sep, y: oy, r, tag: "L" },
        { kind: "circle", x: ox + sep, y: oy, r, tag: "R" },
      ];
    }
    if (kind === "ring") {
      return [{ kind: "ring", x: ox, y: oy, r: spec.R, inner: spec.R * spec.innerRatio }];
    }
    if (kind === "blob") {
      return [{ kind: "blob", x: ox, y: oy, r: spec.R, spec }];
    }
    return [{ kind: "circle", x: ox, y: oy, r: spec.R }];
  }

  function inSpot(shape, x, y) {
    const dx = x - shape.x;
    const dy = y - shape.y;
    if (shape.kind === "oval") {
      const rot = shape.rot || 0;
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const lx = dx * c + dy * s;
      const ly = -dx * s + dy * c;
      const rx = shape.rx || 1;
      const ry = shape.ry || 1;
      return (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1;
    }
    if (shape.kind === "ring") {
      const d2 = dx * dx + dy * dy;
      return d2 <= shape.r * shape.r && d2 >= shape.inner * shape.inner;
    }
    if (shape.kind === "blob") {
      const rr = blobRadius(Math.atan2(dy, dx), shape.spec);
      return dx * dx + dy * dy <= rr * rr;
    }
    const r = shape.r || 0;
    return dx * dx + dy * dy <= r * r;
  }

  function shapeBounds(shape) {
    if (shape.kind === "oval") {
      const rx = shape.rx || 1;
      const ry = shape.ry || 1;
      const rot = shape.rot || 0;
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const hx = Math.sqrt(rx * rx * c * c + ry * ry * s * s);
      const hy = Math.sqrt(rx * rx * s * s + ry * ry * c * c);
      return { x: shape.x - hx, y: shape.y - hy, w: hx * 2, h: hy * 2 };
    }
    const r = shape.kind === "blob" ? (shape.r || BASE_R) * 1.5 : (shape.r || BASE_R);
    return { x: shape.x - r, y: shape.y - r, w: r * 2, h: r * 2 };
  }

  function coverageOfShape(shape, discs, grid) {
    if (!shape) return 0;
    const b = shapeBounds(shape);
    const n = grid || GRID;
    const stepX = b.w / n;
    const stepY = b.h / n;
    let total = 0;
    let covered = 0;
    const landed = discs.filter((d) => !d.falling);
    for (let i = 0; i < n; i += 1) {
      const x = b.x + (i + 0.5) * stepX;
      for (let j = 0; j < n; j += 1) {
        const y = b.y + (j + 0.5) * stepY;
        if (!inSpot(shape, x, y)) continue;
        total += 1;
        for (let k = 0; k < landed.length; k += 1) {
          const d = landed[k];
          const ddx = x - d.x;
          const ddy = y - d.y;
          if (ddx * ddx + ddy * ddy <= d.r * d.r) {
            covered += 1;
            break;
          }
        }
      }
    }
    return total ? covered / total : 0;
  }

  function coverageReport(shapes, discs, grid) {
    const parts = (shapes || []).map((s) => coverageOfShape(s, discs, grid));
    const avg = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
    return { avg, parts };
  }

  /* Twin: BOTH circles must hit targetPct — split attention, not average cheese. */
  function hitTarget(spec, coverage, parts) {
    if (!spec) return false;
    if (spec.kind === "twin" && parts && parts.length === 2) {
      return parts[0] * 100 + 1e-6 >= spec.targetPct && parts[1] * 100 + 1e-6 >= spec.targetPct;
    }
    return coverage * 100 + 1e-6 >= spec.targetPct;
  }

  function discWastedInHole(spec, x, y, shapes) {
    if (!spec || spec.kind !== "ring") return false;
    const s0 = (shapes && shapes[0]) || null;
    if (!s0) return false;
    const inner = s0.inner != null ? s0.inner : spec.R * spec.innerRatio;
    const dx = x - s0.x;
    const dy = y - s0.y;
    return dx * dx + dy * dy <= inner * inner;
  }

  function twinMidDump(spec, x, y, shapes) {
    if (!spec || spec.kind !== "twin" || !shapes || shapes.length < 2) return false;
    const mx = (shapes[0].x + shapes[1].x) * 0.5;
    const my = (shapes[0].y + shapes[1].y) * 0.5;
    const dx = x - mx;
    const dy = y - my;
    return dx * dx + dy * dy <= spec.r * spec.r;
  }

  function idleDiscs(spec, shapes) {
    const r = spec.r;
    const s0 = shapes[0] || { x: SPOT_HOME.x, y: SPOT_HOME.y };
    if (spec.kind === "twin" && shapes[1]) {
      return [
        { x: shapes[0].x + 4, y: shapes[0].y - 3, r, falling: false },
        { x: shapes[1].x - 5, y: shapes[1].y + 4, r, falling: false },
      ];
    }
    if (spec.kind === "ring") {
      const mid = ((s0.r || spec.R) + (s0.inner || spec.R * spec.innerRatio)) * 0.55;
      return [
        { x: s0.x, y: s0.y - mid, r, falling: false },
        { x: s0.x + mid * 0.86, y: s0.y + mid * 0.5, r, falling: false },
      ];
    }
    if (spec.kind === "oval") {
      /* Stack the rounds in the middle so the blush ears stay uncovered. */
      const rot = s0.rot || spec.ovalRot || 0;
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      return [
        { x: s0.x - c * 6 + s * 7, y: s0.y - s * 6 - c * 7, r, falling: false },
        { x: s0.x + c * 7 - s * 5, y: s0.y + s * 7 + c * 5, r, falling: false },
      ];
    }
    if (spec.kind === "blob") {
      return [
        { x: s0.x - 10, y: s0.y - 6, r, falling: false },
        { x: s0.x + 14, y: s0.y + 8, r, falling: false },
      ];
    }
    return [
      { x: s0.x - 12, y: s0.y - 9, r, falling: false },
      { x: s0.x + 18, y: s0.y + 8, r, falling: false },
    ];
  }

  function onFelt(x, y, r) {
    const pad = Math.max(8, (r || 20) * 0.22);
    return x > FELT.x + pad && x < FELT.x + FELT.w - pad && y > FELT.y + pad && y < FELT.y + FELT.h - pad;
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
      tag.className = "vendor-vestibule-only coverspot-hud-tag";
      tag.setAttribute("role", "status");
      const readout = host.querySelector(".depth-readout");
      if (readout && readout.parentNode) readout.parentNode.insertBefore(tag, readout);
      else host.appendChild(tag);
    }
    tag.textContent = DEPTH_COPY.tag;
    const body = host.querySelector("[data-pf-depth-copy]")
      || host.querySelector(".vendor-vestibule-only:not([data-pf-depth-tag]):not(.card-hero):not(.signature-prop)");
    if (body && body.tagName === "P") body.textContent = DEPTH_COPY.body;
    const canvas = $("coverSpotCanvas");
    if (canvas) {
      canvas.style.pointerEvents = "auto";
      canvas.classList.toggle("is-locked", !isLive());
    }
    if ((!run || run.done) && statusEl() && !host.classList.contains("is-result")) {
      statusEl().textContent = DEPTH_COPY.status;
    }
    if ((!run || run.done) && !host.classList.contains("is-result") && !host.classList.contains("is-playing")) {
      paintRoomChrome(attractSpec());
    }
  }

  function punchStart() {
    stampDepthCopy();
    setStatus(DEPTH_COPY.punch);
    const btn = $("coverSpotStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function canBank() {
    return !!(run && !run.done && run.awaiting && run.clearedAwait);
  }

  function greedHint() {
    if (!run) return "Cash out, or drop again?";
    if (run.souvenir) return "Authored ride complete. Bank the souvenir.";
    const nid = nextLevelId(run.spec.id);
    if (!nid) return "Authored ride over. Bank the souvenir.";
    const next = coverspotStageParams(nid);
    if (!next) return "Authored ride over. Bank the souvenir.";
    if (next.coda) return "Authored ride ended. ENDLESS coda — or bank it?";
    return `Clear. Next SPOT: ${next.name}`;
  }

  function setGreed(on, pct) {
    const el = $("coverSpotGreed");
    if (!el) return;
    const show = !!(on && canBank());
    el.hidden = !show;
    const n = $("coverSpotGreedPct");
    if (n) n.textContent = `${Math.floor((pct || 0) * 100)}%`;
    const hint = $("coverSpotGreedHint");
    if (hint) hint.textContent = greedHint();
    const cash = $("coverSpotCash");
    if (cash) {
      cash.disabled = !show;
      cash.classList.toggle("cash-scream", show);
      cash.hidden = !show;
      cash.textContent = run && run.souvenir ? "SOUVENIR" : "CASH OUT";
    }
    const drop = $("coverSpotDrop");
    if (drop) {
      drop.disabled = !run || run.done || run.busy || show || !!(run && run.settling);
      drop.hidden = !run || run.done;
    }
    const again = $("coverSpotDropAgain");
    if (again) {
      const allowAgain = show && !run.souvenir;
      again.disabled = !allowAgain;
      again.hidden = !show;
      again.classList.toggle("cash-scream", allowAgain);
      if (run && run.spec && !run.souvenir) {
        const nid = nextLevelId(run.spec.id);
        const next = nid ? coverspotStageParams(nid) : null;
        again.textContent = next && next.coda ? "ENDLESS" : "DROP AGAIN";
      } else {
        again.textContent = "DROP AGAIN";
      }
    }
    const greedCash = $("coverSpotGreedCash");
    if (greedCash) {
      greedCash.disabled = !show;
      greedCash.textContent = run && run.souvenir ? "SOUVENIR" : "CASH OUT";
      greedCash.classList.toggle("cash-scream", show);
    }
  }

  function paintKitHud(spec) {
    const host = card();
    if (!host) return;
    const hud = host.querySelector("[data-runkit-hud='" + GAME_ID + "']") || host.querySelector(".coverspot-rk-hud");
    if (!hud) return;
    if (!spec || !run || run.done) {
      hud.textContent = "";
      return;
    }
    if (run.awaiting && run.clearedAwait) {
      hud.textContent = run.souvenir
        ? `SOUVENIR · ${hudStageLine(spec)}`
        : `CLEAR · ${hudStageLine(spec)}`;
      return;
    }
    hud.textContent = hudStageLine(spec);
  }

  function drawDisc(ctx, d, ghost) {
    ctx.save();
    ctx.globalAlpha = ghost ? 0.38 : (d.trapped ? 0.52 : (d.falling ? 0.88 : 1));
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(d.x - d.r * 0.28, d.y - d.r * 0.32, d.r * 0.1, d.x, d.y, d.r);
    g.addColorStop(0, ghost ? "#fff6ec" : d.trapped ? "#c8b080" : "#f7e2b0");
    g.addColorStop(0.55, d.trapped ? "#8a6230" : "#d4a45a");
    g.addColorStop(1, "#5a3a18");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = ghost ? "rgba(240,208,154,0.55)" : "#5a3a18";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r * 0.42, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(90,58,20,0.45)";
    ctx.stroke();
    if (d.trapped) {
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = "#f0d09a";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(d.x - d.r * 0.46, d.y - d.r * 0.46);
      ctx.lineTo(d.x + d.r * 0.46, d.y + d.r * 0.46);
      ctx.moveTo(d.x + d.r * 0.46, d.y - d.r * 0.46);
      ctx.lineTo(d.x - d.r * 0.46, d.y + d.r * 0.46);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShape(ctx, shape, spec) {
    ctx.save();
    if (shape.kind === "oval") {
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.rot || 0);
      ctx.fillStyle = "#e24a6a";
      ctx.strokeStyle = "#7a1018";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, shape.rx, shape.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      /* Honest round vs blush ears — S1 mismatch. */
      ctx.strokeStyle = "rgba(240,208,154,0.55)";
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, spec && spec.R ? spec.R : Math.min(shape.rx, shape.ry), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "rgba(240,208,154,0.86)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-shape.rx, 0);
      ctx.lineTo(shape.rx, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,230,166,0.95)";
      ctx.beginPath();
      ctx.arc(shape.rx, 0, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-shape.rx, 0, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(240,208,154,0.95)";
      ctx.font = "10px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("OVAL", 0, -shape.ry - 8);
      ctx.fillText("EAR", shape.rx, 12);
      ctx.fillText("EAR", -shape.rx, 12);
      ctx.textAlign = "start";
    } else if (shape.kind === "ring") {
      ctx.fillStyle = "#c41e3a";
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2);
      ctx.arc(shape.x, shape.y, shape.inner, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
      ctx.strokeStyle = "#7a1018";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2);
      ctx.stroke();
      const well = ctx.createRadialGradient(shape.x, shape.y, 2, shape.x, shape.y, shape.inner);
      well.addColorStop(0, "#0a140c");
      well.addColorStop(0.72, "#16351f");
      well.addColorStop(1, "#0c1c10");
      ctx.fillStyle = well;
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.inner - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(240,208,154,0.7)";
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.inner, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(196,30,58,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shape.x - 9, shape.y - 9);
      ctx.lineTo(shape.x + 9, shape.y + 9);
      ctx.moveTo(shape.x + 9, shape.y - 9);
      ctx.lineTo(shape.x - 9, shape.y + 9);
      ctx.stroke();
      ctx.fillStyle = "rgba(240,208,154,0.95)";
      ctx.font = "10px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("HOLE", shape.x, shape.y - 6);
      ctx.fillText("TRAP", shape.x, shape.y + 18);
      ctx.textAlign = "start";
    } else if (shape.kind === "blob") {
      ctx.fillStyle = spec && spec.coda ? "#b01832" : "#c41e3a";
      ctx.strokeStyle = "#7a1018";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const steps = 64;
      for (let i = 0; i <= steps; i += 1) {
        const th = (i / steps) * Math.PI * 2;
        const rr = blobRadius(th, shape.spec);
        const px = shape.x + Math.cos(th) * rr;
        const py = shape.y + Math.sin(th) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(240,208,154,0.92)";
      ctx.font = "10px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(spec && spec.coda ? "ENDLESS" : "BLOB", shape.x, shape.y - (shape.r || (spec && spec.R) || BASE_R) * 0.2);
      ctx.textAlign = "start";
    } else {
      ctx.fillStyle = "#c41e3a";
      ctx.strokeStyle = "#7a1018";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (spec && spec.id === 2) {
        ctx.strokeStyle = "rgba(240,208,154,0.45)";
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, spec.honestR || spec.R * HONEST_RATIO, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (shape.tag) {
        ctx.fillStyle = "rgba(240,208,154,0.92)";
        ctx.font = "11px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(shape.tag, shape.x, shape.y + 4);
        ctx.textAlign = "start";
      }
    }
    ctx.restore();
  }

  function drawDiscGhostHint(ctx, spec, shapes) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,230,166,0.42)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    if (spec.kind === "twin") {
      shapes.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, spec.r, 0, Math.PI * 2);
        ctx.stroke();
      });
      /* Mid dump is the lie — ghost it as a forbidden well, not a hint. */
      const midX = shapes[0] && shapes[1] ? (shapes[0].x + shapes[1].x) * 0.5 : SPOT_HOME.x;
      const midY = shapes[0] && shapes[1] ? (shapes[0].y + shapes[1].y) * 0.5 : SPOT_HOME.y;
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = "rgba(196,30,58,0.55)";
      ctx.beginPath();
      ctx.arc(midX, midY, spec.r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (spec.kind === "ring") {
      const s0 = shapes[0] || { x: SPOT_HOME.x, y: SPOT_HOME.y, r: spec.R, inner: spec.R * spec.innerRatio };
      const mid = ((s0.r || spec.R) + (s0.inner || spec.R * spec.innerRatio)) * 0.5;
      ctx.beginPath();
      ctx.arc(s0.x, s0.y, mid, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = "rgba(196,30,58,0.55)";
      ctx.beginPath();
      ctx.arc(s0.x, s0.y, spec.r * 0.45, 0, Math.PI * 2);
      ctx.stroke();
    } else if (spec.kind === "oval") {
      const s0 = shapes[0] || { x: SPOT_HOME.x, y: SPOT_HOME.y, rot: 0, rx: spec.R };
      const rot = s0.rot || spec.ovalRot || 0;
      const along = (s0.rx || spec.R * 1.3) - spec.r * 0.55;
      ctx.beginPath();
      ctx.arc(s0.x + Math.cos(rot) * along, s0.y + Math.sin(rot) * along, spec.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s0.x - Math.cos(rot) * along, s0.y - Math.sin(rot) * along, spec.r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (spec.kind === "drift" || spec.drift === "slow") {
      const s0 = shapes[0] || { x: SPOT_HOME.x, y: SPOT_HOME.y };
      const tNow = run ? run.t : idleClock;
      const nowOff = spotOffset(spec, tNow);
      const ahead = spotOffset(spec, tNow + 520);
      ctx.beginPath();
      ctx.arc(s0.x, s0.y, spec.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,230,166,0.32)";
      ctx.beginPath();
      ctx.arc(s0.x + (ahead.x - nowOff.x), s0.y + (ahead.y - nowOff.y), spec.r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const s0 = shapes[0] || { x: SPOT_HOME.x, y: SPOT_HOME.y };
      ctx.beginPath();
      ctx.arc(s0.x, s0.y, spec.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawFeltTell(ctx, spec, shapes, t) {
    ctx.save();
    ctx.fillStyle = "rgba(240,208,154,0.92)";
    ctx.font = "10px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(roomTell(spec), W / 2, FELT.y + 16);
    if (spec.kind === "twin" && shapes[0] && shapes[1]) {
      ctx.strokeStyle = "rgba(12,6,9,0.5)";
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(W / 2, FELT.y + 24);
      ctx.lineTo(W / 2, FELT.y + FELT.h - 12);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(240,208,154,0.82)";
      ctx.fillText("LEFT", shapes[0].x, shapes[0].y + shapes[0].r + 14);
      ctx.fillText("RIGHT", shapes[1].x, shapes[1].y + shapes[1].r + 14);
      ctx.fillText("BOTH", W / 2, FELT.y + FELT.h - 10);
    }
    if (spec.kind === "drift" || spec.drift === "slow") {
      const s0 = shapes[0] || { x: SPOT_HOME.x, y: SPOT_HOME.y };
      const nowOff = spotOffset(spec, t || 0);
      ctx.strokeStyle = "rgba(240,208,154,0.28)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= 10; i += 1) {
        const off = spotOffset(spec, (t || 0) + i * 180);
        const px = s0.x + (off.x - nowOff.x);
        const py = s0.y + (off.y - nowOff.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      const later = spotOffset(spec, (t || 0) + 480);
      const dx = later.x - nowOff.x;
      const dy = later.y - nowOff.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const rad = (s0.r || spec.R) + 14;
      const ax = s0.x + ux * rad;
      const ay = s0.y + uy * rad;
      ctx.strokeStyle = "rgba(240,208,154,0.85)";
      ctx.fillStyle = "rgba(240,208,154,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s0.x + ux * (s0.r || spec.R) * 0.35, s0.y + uy * (s0.r || spec.R) * 0.35);
      ctx.lineTo(ax, ay);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - ux * 8 - uy * 5, ay - uy * 8 + ux * 5);
      ctx.lineTo(ax - ux * 8 + uy * 5, ay - uy * 8 - ux * 5);
      ctx.closePath();
      ctx.fill();
      ctx.font = "9px Georgia, serif";
      ctx.fillText("LEAD", ax + ux * 12, ay + uy * 12);
    }
    if (spec.drift === "jitter" || spec.kind === "blob") {
      const s0 = shapes[0] || { x: SPOT_HOME.x, y: SPOT_HOME.y };
      const ph = stampPhase(spec, t || 0);
      ctx.strokeStyle = ph.telegraph ? "rgba(240,208,154,0.9)" : "rgba(240,208,154,0.28)";
      ctx.setLineDash(ph.holding ? [3, 4] : []);
      ctx.lineWidth = ph.telegraph ? 2.4 : 1.4;
      ctx.beginPath();
      ctx.arc(s0.x, s0.y, ph.telegraph ? 20 + (ph.k - (STAMP_HOLD - 0.18)) * 40 : 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(240,208,154,0.92)";
      ctx.font = "10px Georgia, serif";
      ctx.fillText(ph.telegraph ? "STAMP" : ph.hopping ? "HOP" : "HOLD", s0.x, s0.y - (s0.r || spec.R) - 8);
    }
    ctx.textAlign = "start";
    ctx.restore();
  }

  function drawMeter(ctx, spec, coverage, parts) {
    const x = 28;
    const y = H - 36;
    const w = W - 56;
    const need = spec.targetPct / 100;
    const twin = spec.kind === "twin" && parts && parts.length === 2;
    const shown = twin ? Math.min(parts[0], parts[1]) : coverage;
    ctx.fillStyle = "rgba(12,6,9,0.78)";
    ctx.fillRect(x, y - (twin ? 10 : 0), w, twin ? 26 : 16);
    ctx.strokeStyle = "rgba(212,164,90,0.55)";
    ctx.strokeRect(x + 0.5, y - (twin ? 10 : 0) + 0.5, w - 1, (twin ? 26 : 16) - 1);
    if (twin) {
      const hBar = 10;
      [parts[0], parts[1]].forEach((p, i) => {
        const yy = y - 8 + i * 12;
        ctx.fillStyle = p * 100 + 1e-6 >= spec.targetPct ? "#3d8a8a" : "#c41e3a";
        ctx.fillRect(x + 1, yy, Math.max(0, (w - 2) * clamp(p, 0, 1)), hBar);
      });
    } else {
      const fillW = w * clamp(shown, 0, 1);
      ctx.fillStyle = hitTarget(spec, coverage, parts) ? "#3d8a8a" : "#c41e3a";
      ctx.fillRect(x + 1, y + 1, Math.max(0, fillW - 2), 14);
    }
    const notch = x + w * need;
    ctx.strokeStyle = "#f0d09a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(notch, y - (twin ? 13 : 3));
    ctx.lineTo(notch, y + (twin ? 18 : 19));
    ctx.stroke();
    ctx.fillStyle = "#f0d09a";
    ctx.font = "10px Georgia, serif";
    ctx.fillText(`need ${spec.targetPct}%`, clamp(notch + 4, x, x + w - 64), y - (twin ? 14 : 5));
    if (twin) {
      ctx.fillText(`L ${Math.floor(parts[0] * 100)}%  R ${Math.floor(parts[1] * 100)}%  both`, x + 4, y + 14);
    } else {
      ctx.fillText(`${Math.floor(coverage * 100)}%`, x + 4, y + 12);
    }
  }

  function drawDiscPips(ctx, spec, left) {
    const x0 = FELT.x + FELT.w - 12 - spec.maxDiscs * 14;
    const y = FELT.y + 28;
    ctx.fillStyle = "#d4a45a";
    ctx.font = "10px Georgia, serif";
    ctx.textAlign = "right";
    ctx.fillText("DISCS", x0 - 8, y + 4);
    ctx.textAlign = "start";
    for (let i = 0; i < spec.maxDiscs; i += 1) {
      ctx.beginPath();
      ctx.arc(x0 + i * 14, y, 5.2, 0, Math.PI * 2);
      ctx.fillStyle = i < left ? "#d4a45a" : "#3a2418";
      ctx.fill();
      ctx.strokeStyle = "rgba(90,58,20,0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function attractSpec() {
    return coverspotStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function draw() {
    const canvas = $("coverSpotCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (run) run.shake = kit.applyShake(ctx, run.shake || 0);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1a1020");
    bg.addColorStop(1, "#0c080c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    kit.fillWood(ctx, 10, 20, W - 20, H - 36);

    ctx.fillStyle = "#16351f";
    ctx.fillRect(FELT.x, FELT.y, FELT.w, FELT.h);
    ctx.fillStyle = "rgba(12,40,18,0.35)";
    for (let i = 0; i < FELT.w; i += 14) ctx.fillRect(FELT.x + i, FELT.y, 2, FELT.h);
    ctx.strokeStyle = "#d4a45a";
    ctx.strokeRect(FELT.x + 0.5, FELT.y + 0.5, FELT.w - 1, FELT.h - 1);

    const spec = run ? run.spec : attractSpec();
    const t = run ? run.t : idleClock;
    const shapes = run ? run.shapes : makeSpots(spec, SPOT_HOME, t);
    const discs = run ? run.discs : idleDiscs(spec, shapes);
    const report = run
      ? { avg: run.coverage, parts: run.coverParts || [] }
      : coverageReport(shapes, discs, spec.gridStamp);
    const coverage = report.avg;

    shapes.forEach((s) => drawShape(ctx, s, spec));
    drawFeltTell(ctx, spec, shapes, t);
    drawDiscGhostHint(ctx, spec, shapes);
    discs.forEach((d) => drawDisc(ctx, d, false));
    if (run && run.trapMarks && run.trapMarks.length) {
      ctx.save();
      run.trapMarks.forEach((m) => {
        if (t > m.until) return;
        const a = 1 - clamp((t - (m.until - TRAP_FLASH_MS)) / TRAP_FLASH_MS, 0, 1);
        ctx.globalAlpha = 0.45 + a * 0.55;
        ctx.strokeStyle = "#f0d09a";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(m.x - 11, m.y - 11);
        ctx.lineTo(m.x + 11, m.y + 11);
        ctx.moveTo(m.x + 11, m.y - 11);
        ctx.lineTo(m.x - 11, m.y + 11);
        ctx.stroke();
      });
      ctx.restore();
    }

    if (run && !run.done && !run.awaiting && !run.busy && !run.settling && pointer.on) {
      drawDisc(ctx, { x: pointer.x, y: pointer.y, r: spec.r, falling: true }, true);
    }

    const used = run ? run.discs.length : 0;
    const left = run ? Math.max(0, spec.maxDiscs - used) : spec.maxDiscs;
    drawDiscPips(ctx, spec, left);
    drawMeter(ctx, spec, coverage, report.parts);

    if (run && run.closedStamp) {
      kit.stampClosed(ctx, W, H, run.stampLabel || "BUST");
    }

    if (run && !run.done) {
      const beat = spec.kind === "twin"
        ? `both ≥ ${spec.targetPct}%`
        : spec.kind === "ring"
          ? `ring ${Math.floor(coverage * 100)}% · hole is a trap`
          : spec.kind === "drift"
            ? `lead the walk · ${Math.floor(coverage * 100)}% · need ${spec.targetPct}%`
            : spec.kind === "oval"
              ? `oval ${Math.floor(coverage * 100)}% · round discs mismatch`
              : spec.kind === "blob"
                ? `blob ${Math.floor(coverage * 100)}% · ${stampPhase(spec, run.t).holding ? "HOLD" : "STAMP"}`
                : `${Math.floor(coverage * 100)}% · need ${spec.targetPct}%`;
      const nid = nextLevelId(spec.id);
      const next = nid ? coverspotStageParams(nid) : null;
      kit.drawHud(ctx, W, [
        hudStageLine(spec),
        run.awaiting && run.clearedAwait
          ? (run.souvenir ? "SOUVENIR — authored ride complete" : (next && next.coda ? "CASH OUT or ENDLESS coda" : "CASH OUT or DROP AGAIN — next felt lies differently"))
          : run.settling
            ? `Spot still walking · ${Math.floor(coverage * 100)}% · need ${spec.targetPct}%`
            : `${roomTell(spec)} · ${left} left · ${beat}`,
      ]);
    } else if (!run || !run.closedStamp) {
      kit.drawHud(ctx, W, [hudStageLine(spec), roomTell(spec)]);
    }
  }

  function liveCoverage(force) {
    if (!run) return 0;
    const drifting = isLiveDrift(run.spec);
    if (!(run.awaiting && run.clearedAwait) && (drifting || force || run.coverDirty)) {
      run.shapes = makeSpots(run.spec, run.origin, run.t);
      const s0 = run.shapes[0];
      run.spot = { x: s0.x, y: s0.y, r: s0.r || s0.rx || run.spec.R };
    }
    if (!force && !run.coverDirty && !drifting) return run.coverage;
    const landed = run.discs.filter((d) => !d.falling);
    const report = coverageReport(run.shapes, landed, run.spec.gridStamp);
    const prev = Math.floor((run.coverage || 0) * 100);
    run.coverage = report.avg;
    run.coverParts = report.parts;
    run.bestPct = Math.max(run.bestPct, run.coverage);
    run.coverDirty = false;
    if (Math.floor(run.coverage * 100) !== prev) pokeDepth();
    return run.coverage;
  }

  function stopIdle() {
    if (idleRaf) cancelAnimationFrame(idleRaf);
    idleRaf = 0;
  }

  function startIdle() {
    if (isLive()) return;
    stopIdle();
    paintRoomChrome(attractSpec());
    let last = 0;
    const tick = (now) => {
      if (run && !run.done) {
        idleRaf = 0;
        return;
      }
      if (!last) last = now;
      const dt = Math.min(32, now - last);
      last = now;
      idleClock += dt;
      if (idleClock > IDLE_ROOM_MS) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        paintRoomChrome(attractSpec());
      }
      draw();
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }

  function reportHud(spec) {
    paintKitHud(spec);
    if (!run || !run.kitRun) return;
    run.kitRun.depth = run.stagesCleared | 0;
    run.kitRun.score = run.score | 0;
    if (run.stagesCleared > 0 && rk() && typeof rk().reportDepth === "function") {
      rk().reportDepth(run.kitRun, run.stagesCleared, {
        name: spec && spec.name,
        coda: !!(spec && spec.coda),
      });
      run.kitRun.depth = run.stagesCleared | 0;
    }
    paintKitHud(spec);
  }

  function enterSpot(spec) {
    run.spec = spec;
    run.discs = [];
    run.origin = { x: SPOT_HOME.x, y: SPOT_HOME.y };
    if (spec.drift === "slow" || spec.drift === "jitter" || spec.kind === "drift") {
      run.origin.x += (Math.random() - 0.5) * 10;
      run.origin.y += (Math.random() - 0.5) * 8;
    }
    run.awaiting = false;
    run.clearedAwait = false;
    run.souvenir = false;
    run.settling = false;
    run.settleUntil = 0;
    run.coverage = 0;
    run.coverParts = [];
    run.coverDirty = true;
    run.hitMs = 0;
    run.dropGen = (run.dropGen | 0) + 1;
    run.pending = null;
    run.busy = false;
    run.shapes = makeSpots(spec, run.origin, run.t || 0);
    const s0 = run.shapes[0];
    run.spot = { x: s0.x, y: s0.y, r: s0.r || s0.rx || spec.R };
    run.trapMarks = [];
    setGreed(false);
    liveCoverage(true);
    paintRoomChrome(spec);
    setStatus(spec.enter || `${hudStageLine(spec)}. Cover the felt.`);
    if (run.kitRun) {
      run.kitRun.depth = run.stagesCleared | 0;
      run.kitRun.score = run.score | 0;
    }
    paintKitHud(spec);
    pokeDepth();
    PF.setAura("think");
  }

  function start() {
    if (run && !run.done) return;
    declareP0();
    const kitRun = beginKitRun();
    if (!kitRun) {
      setStatus("Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      return;
    }
    stopIdle();
    resetPips();
    const spec = coverspotStageParams(1);
    run = {
      done: false,
      persisted: false,
      kitRun,
      floor: null,
      spec,
      origin: { x: SPOT_HOME.x, y: SPOT_HOME.y },
      shapes: makeSpots(spec, SPOT_HOME, 0),
      spot: { x: SPOT_HOME.x, y: SPOT_HOME.y, r: spec.R },
      discs: [],
      coverage: 0,
      coverParts: [],
      coverDirty: true,
      hitMs: 0,
      bestPct: 0,
      stagesCleared: 0,
      discsPlaced: 0,
      tableMisses: 0,
      score: 0,
      awaiting: false,
      clearedAwait: false,
      souvenir: false,
      settling: false,
      settleUntil: 0,
      busy: false,
      pending: null,
      last: 0,
      t: 0,
      raf: 0,
      shake: 0,
      dropGen: 0,
      closedStamp: false,
      stampLabel: "",
      revealTimer: 0,
      trapMarks: [],
    };
    run.floor = mountGreed(kitRun);
    if (run.kitRun) {
      run.kitRun.depth = 0;
      run.kitRun.score = 0;
    }
    const startBtn = $("coverSpotStart");
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.hidden = true;
    }
    if ($("coverSpotVerdict")) $("coverSpotVerdict").hidden = true;
    kit.hideResult("coverSpotResult");
    PF.setTier("coverSpotTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    enterSpot(spec);
    if ($("coverSpotDrop")) $("coverSpotDrop").hidden = false;
    if ($("coverSpotCash")) {
      $("coverSpotCash").hidden = true;
      $("coverSpotCash").disabled = true;
      $("coverSpotCash").textContent = "CASH OUT";
    }
    PF.focusCard("coverSpotCard", true);
    const loop = (now) => {
      if (!run || run.done) return;
      if (!run.last) run.last = now;
      const dt = Math.min(32, now - run.last);
      run.last = now;
      run.t += dt;
      step(dt);
      draw();
      run.raf = requestAnimationFrame(loop);
    };
    run.raf = requestAnimationFrame(loop);
  }

  function maybeClearFromLive(dt) {
    if (!run || run.done || run.busy || run.awaiting) return false;
    const spec = run.spec;
    if (!spec) return false;
    const landed = run.discs.filter((d) => !d.falling).length;
    if (landed < 2) {
      run.hitMs = 0;
      return false;
    }
    if (!hitTarget(spec, run.coverage, run.coverParts)) {
      run.hitMs = 0;
      return false;
    }
    /* Jitter: lock on the HOLD. A hop pauses the meter; coverage drop still resets. */
    if ((spec.drift === "jitter" || spec.kind === "blob") && stampPhase(spec, run.t).hopping) {
      return false;
    }
    const need = dwellNeed(spec);
    run.hitMs = (run.hitMs || 0) + (dt || 16);
    if (run.hitMs < need) return false;
    clearStage(run.coverage);
    return true;
  }

  function step(dt) {
    if (!run || run.done) return;
    liveCoverage(false);

    if (run.pending) {
      run.pending.wait -= dt;
      if (run.pending.wait <= 0) {
        landDisc(run.pending);
        run.pending = null;
      }
    }

    let falling = false;
    run.discs.forEach((d) => {
      if (!d.falling) return;
      falling = true;
      d.life = (d.life || 0) + dt;
      const k = Math.min(1, d.life / 160);
      d.y = d.fromY + (d.restY - d.fromY) * k;
      if (k >= 1) {
        d.y = d.restY;
        d.falling = false;
        run.coverDirty = true;
      }
    });
    run.busy = !!(run.pending || falling);

    const cash = $("coverSpotCash");
    const drop = $("coverSpotDrop");
    if (run.awaiting && run.clearedAwait) {
      if (cash) cash.disabled = false;
      if (drop) drop.disabled = true;
      return;
    }
    if (cash) cash.disabled = true;
    if (drop) drop.disabled = !!run.busy || !!run.settling;

    /* Drift + jitter: discs stick in world space; live coverage can clear. */
    if (!run.busy && isLiveDrift(run.spec)) {
      if (maybeClearFromLive(dt)) return;
      if (run.settling && run.t >= run.settleUntil) {
        const pct = Math.floor(run.coverage * 100);
        setStatus(`${pct}% · needed ${run.spec.targetPct}%. Bust. ${run.spec.name} kept a peek.`);
        finish("bust");
      }
    }
  }

  function landDisc(pending) {
    if (!run || run.done) return;
    const spec = run.spec;
    const x = pending.x;
    const y = pending.y;
    if (!onFelt(x, y, spec.r)) {
      run.tableMisses += 1;
      run.shake = 7;
      kit.sfx("miss");
      setStatus(run.tableMisses >= MISS_DEATH
        ? "Second bounce off the table."
        : "Bounced off the felt. Two misses and you’re done.");
      PF.setAura("point");
      if (rk() && typeof rk().reportStrike === "function") rk().reportStrike(run.kitRun, "table_miss");
      if (run.tableMisses >= MISS_DEATH) {
        finish("miss_table");
        return;
      }
      run.busy = false;
      return;
    }
    const disc = {
      x,
      y,
      r: spec.r,
      falling: true,
      fromY: y - 26,
      restY: y,
      life: 0,
      trapped: false,
    };
    run.discs.push(disc);
    run.discsPlaced += 1;
    run.coverDirty = true;
    kit.sfx("drop");
    const gen = run.dropGen;
    window.setTimeout(() => {
      if (!run || run.done || run.dropGen !== gen) return;
      resolveDrop();
    }, 170);
  }

  function resolveDrop() {
    if (!run || run.done) return;
    run.discs.forEach((d) => {
      d.falling = false;
      if (d.restY != null) d.y = d.restY;
    });
    run.coverDirty = true;
    const coverage = liveCoverage(true);
    const spec = run.spec;
    const pct = Math.floor(coverage * 100);
    let hit = hitTarget(spec, coverage, run.coverParts);
    /* One disc never covers — classic cheat. Grid rounding must not gift a first-drop win. */
    if (hit && run.discs.length < 2) hit = false;

    if (hit && !isLiveDrift(spec)) {
      clearStage(coverage);
      return;
    }

    if (run.discs.length >= spec.maxDiscs) {
      if (isLiveDrift(spec)) {
        run.settling = true;
        run.settleUntil = run.t + SETTLE_MS;
        run.awaiting = false;
        run.clearedAwait = false;
        setGreed(false);
        setStatus(spec.kind === "blob" || spec.drift === "jitter"
          ? `${pct}% · blob still stamps. Lock the HOLD at ${spec.targetPct}%.`
          : `${pct}% · spot still walking. Lead it to ${spec.targetPct}%.`);
        PF.setAura("point");
        return;
      }
      setStatus(`${pct}% · needed ${spec.targetPct}%. Bust. ${spec.name} kept a peek.`);
      finish("bust");
      return;
    }

    run.awaiting = false;
    run.clearedAwait = false;
    setGreed(false);
    const last = run.discs[run.discs.length - 1];
    const trapped = last && discWastedInHole(spec, last.x, last.y, run.shapes);
    if (trapped && last) {
      last.trapped = true;
      run.trapMarks = run.trapMarks || [];
      run.trapMarks.push({ x: last.x, y: last.y, until: run.t + TRAP_FLASH_MS });
      run.shake = Math.max(run.shake || 0, 6);
    }
    const left = spec.maxDiscs - run.discs.length;
    let detail = `${pct}% covered. Target ${spec.targetPct}%. ${left} left.`;
    if (run.discs.length === 1 && spec.id === 1) {
      detail = `${pct}% · one disc never covers — that’s the joke. ${left} left.`;
    } else if (spec.kind === "twin" && run.coverParts && run.coverParts.length === 2) {
      const lOk = run.coverParts[0] * 100 + 1e-6 >= spec.targetPct;
      const rOk = run.coverParts[1] * 100 + 1e-6 >= spec.targetPct;
      const mid = last && twinMidDump(spec, last.x, last.y, run.shapes);
      if (mid) {
        detail = `Center dump is a lie. Cover LEFT and RIGHT. Both need ${spec.targetPct}%. ${left} left.`;
      } else if (lOk && !rOk) {
        detail = `LEFT locked. RIGHT still hungry. Both need ${spec.targetPct}%. ${left} left.`;
      } else if (rOk && !lOk) {
        detail = `RIGHT locked. LEFT still hungry. Both need ${spec.targetPct}%. ${left} left.`;
      } else {
        detail = `L ${Math.floor(run.coverParts[0] * 100)}% · R ${Math.floor(run.coverParts[1] * 100)}% · both need ${spec.targetPct}%. ${left} left.`;
      }
    } else if (spec.kind === "ring") {
      detail = trapped
        ? `Center is a trap. ${pct}% of the ring. Need ${spec.targetPct}%. ${left} left.`
        : `${pct}% of the ring. Center doesn’t count. Need ${spec.targetPct}%. ${left} left.`;
    } else if (spec.kind === "drift") {
      detail = `${pct}% on a walking spot. Lead it. Need ${spec.targetPct}%. ${left} left.`;
    } else if (spec.kind === "oval") {
      detail = `${pct}% of the oval. Round discs don’t match. Need ${spec.targetPct}%. ${left} left.`;
    } else if (spec.kind === "blob") {
      detail = `${pct}% of the blob. It stamps. Need ${spec.targetPct}%. ${left} left.`;
    }
    setStatus(detail);
    PF.setAura("point");
    kit.sfx(trapped ? "miss" : "tray");
  }

  function clearStage(coverage) {
    if (!run || run.done || run.clearedAwait) return;
    const spec = run.spec;
    const gained = Math.floor(coverage * 100) + 200 * spec.id;
    run.score += gained;
    run.stagesCleared += 1;
    run.bestPct = Math.max(run.bestPct, coverage);
    run.settling = false;
    run.settleUntil = 0;
    run.hitMs = 0;
    if (run.kitRun) {
      run.kitRun.score = run.score;
      run.kitRun.depth = run.stagesCleared;
    }
    const nid = nextLevelId(spec.id);
    run.awaiting = true;
    run.clearedAwait = true;
    run.souvenir = !nid;
    reportHud(spec);
    saveLiveDepth();
    setGreed(true, coverage);
    const pct = Math.floor(coverage * 100);
    if (run.souvenir) {
      setStatus(`${AURA.souvenir} ${hudStageLine(spec)} · ${pct}%. Bank the souvenir.`);
    } else {
      const next = coverspotStageParams(nid);
      if (next && next.coda) {
        setStatus(`${AURA.coda} ${hudStageLine(spec)} · ${pct}%. ENDLESS coda, or bank it?`);
      } else {
        setStatus(`${AURA.clear} ${hudStageLine(spec)} · ${pct}%. Next: ${next.name}. Bank it, or greed?`);
      }
    }
    PF.setAura("celebrate");
    kit.sfx("cash");
    run.shake = 4;
    pokeDepth();
  }

  function advanceStage() {
    if (!run || run.done) return;
    if (run.souvenir) {
      finish("souvenir");
      return;
    }
    const next = nextLevelId(run.spec.id);
    if (!next) {
      finish("souvenir");
      return;
    }
    const spec = coverspotStageParams(next);
    if (!spec) {
      finish("souvenir");
      return;
    }
    enterSpot(spec);
  }

  function dropAt(x, y) {
    if (!isLive() || run.busy || run.awaiting || run.settling) return;
    const spec = run.spec;
    if (run.discs.length >= spec.maxDiscs) return;
    const snap = spec.snap;
    const nx = clamp(x + (Math.random() - 0.5) * snap, 8, W - 8);
    const ny = clamp(y + (Math.random() - 0.5) * snap, 8, H - 8);
    run.busy = true;
    run.dropGen = (run.dropGen | 0) + 1;
    run.pending = { x: nx, y: ny, wait: spec.latency };
    setStatus("Disc dropping…");
  }

  function challengeLine(n) {
    const kitRun = rk();
    if (kitRun && typeof kitRun.challengeText === "function") {
      try { return kitRun.challengeText("Cover-the-Spot", n | 0, GAME_ID); } catch (_) { /* local */ }
    }
    return `Beat my Cover-the-Spot stage ${n | 0} on Penny Fever`;
  }

  function auraLine(reason, cashed, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (cashed) return AURA.cash;
    if (depth >= 6) return AURA.deep(depth);
    if (reason === "miss_table") return AURA.miss_table;
    if (reason === "bust") return AURA.bust;
    const kitRun = rk();
    if (kitRun && typeof kitRun.auraDeathLine === "function") {
      try { return `Aura: ${kitRun.auraDeathLine(GAME_ID, depth, reason)}`; } catch (_) { /* local */ }
    }
    return AURA.bust;
  }

  function deathReasonOf(reason) {
    if (reason === "souvenir") return "souvenir";
    if (reason === "cash") return "cashed_out";
    if (reason === "leave") return "leave";
    if (reason === "miss_table") return "miss_table";
    return "bust";
  }

  function revealResult(reason) {
    if (!run) return;
    const cashed = reason === "cash" || reason === "souvenir";
    const deathReason = deathReasonOf(reason);
    const depth = run.stagesCleared;
    const pct = Math.floor(run.bestPct * 100);
    const discs = run.discsPlaced;
    const score = run.score;
    const spec = run.spec;
    kit.setMode(card(), "result");
    paintRoomChrome(spec, true);
    stampDepthCopy();
    const startBtn = $("coverSpotStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.hidden = false;
      startBtn.textContent = "DROP AGAIN · 1 demo coin";
    }
    if ($("coverSpotDrop")) $("coverSpotDrop").hidden = true;
    if ($("coverSpotCash")) {
      $("coverSpotCash").hidden = true;
      $("coverSpotCash").disabled = true;
      $("coverSpotCash").classList.remove("cash-scream");
      $("coverSpotCash").textContent = "CASH OUT";
    }
    PF.focusCard("coverSpotCard", false);
    paintKitHud(null);
    const nameBit = spec.coda ? `ENDLESS ${depth} · ${spec.name}` : `SPOT ${depth} · ${spec.name}`;
    const reasonTag = cashed
      ? (reason === "souvenir" ? "SOUVENIR" : "WALKED")
      : reason === "leave"
        ? "LEFT"
        : reason === "miss_table"
          ? "MISS TABLE"
          : "BUST";
    const line = `${nameBit} · ${pct}% BEST · SCORE ${score}`;
    const aura = auraLine(reason, cashed, depth);
    if ($("coverSpotVerdict")) {
      $("coverSpotVerdict").hidden = false;
      $("coverSpotVerdict").textContent = cashed
        ? (reason === "souvenir" ? `Souvenir. ${line}.` : `Walked away. ${line}.`)
        : reason === "leave"
          ? `Left the counter · ${line}`
          : reason === "miss_table"
            ? `Off the felt. ${line}.`
            : `Bust. ${line}.`;
    }
    kit.fillResult({
      root: "coverSpotResult",
      depth: "coverSpotResultDepth",
      score: "coverSpotResultScore",
      aura: "coverSpotResultAura",
      copied: "coverSpotCopied",
    }, {
      depthLine: `${nameBit} · ${reasonTag}`,
      scoreLine: `SCORE ${score} · ${pct}% · ${discs} discs · ${deathReason}`,
      auraLine: aura,
    });
    const ch = $("coverSpotChallengeText");
    if (ch) ch.textContent = challengeLine(depth);
    PF.setTier("coverSpotTier", reasonTag, cashed ? "perfect" : "miss");
    setStatus(cashed
      ? (reason === "souvenir" ? "Authored ride stamped." : "Cashed the felt.")
      : "The red kept a peek.");
    const ok = cashed || depth > 0;
    if (ok) {
      PF.award(Math.max(cashed ? 12 : 8, Math.floor(score / 8)), true, cashed ? "Cover cash-out" : "Cover-the-Spot");
      PF.setAura(cashed ? "celebrate" : "laugh");
      if (reason !== "leave") PF.showBanner(cashed, reasonTag, `${pct}% · ${aura}`);
    } else {
      PF.award(0, false, "Cover-the-Spot miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, reasonTag, aura);
    }
    PF.refreshNightBoard();
    pokeDepth();
    draw();
    startIdle();
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    if (run.raf) cancelAnimationFrame(run.raf);
    run.awaiting = false;
    run.settling = false;
    setGreed(false);
    const cashed = reason === "cash" || reason === "souvenir";
    const deathReason = deathReasonOf(reason);
    const spec = run.spec || {};
    run.closedStamp = deathReason === "bust" || deathReason === "miss_table";
    run.stampLabel = deathReason === "miss_table" ? "MISS" : "BUST";
    persistDepth({
      depth: run.stagesCleared | 0,
      score: run.score | 0,
      deathReason,
      cashedOut: cashed,
      pct: Math.floor((run.bestPct || 0) * 100),
      discs: run.discsPlaced | 0,
      meta: {
        coverage: Math.floor((run.bestPct || 0) * 100),
        discs: run.discsPlaced | 0,
        stage: spec.id,
        title: spec.title,
        name: spec.name,
        kind: spec.kind,
        coda: !!spec.coda,
        codaEnabled: CODA_ENABLED,
      },
    });
    if (cashed) kit.sfx("cash");
    else if (run.closedStamp) kit.sfx("stamp");
    else if (reason !== "leave") kit.sfx("bury");
    draw();
    const wait = run.closedStamp && reason !== "leave" ? STAMP_MS : 0;
    if (run.revealTimer) window.clearTimeout(run.revealTimer);
    run.revealTimer = window.setTimeout(() => revealResult(reason), wait);
  }

  function cashOut() {
    if (!canBank()) return;
    finish(run.souvenir ? "souvenir" : "cash");
  }

  function dropAgain() {
    if (!run || run.done) return;
    if (run.souvenir) {
      finish("souvenir");
      return;
    }
    if (run.clearedAwait) {
      advanceStage();
    }
  }

  function dropFromButton() {
    if (!isLive() || run.awaiting || run.busy || run.settling) return;
    dropAt(pointer.x, pointer.y);
  }

  PF.registerVendor({
    id: "cover-the-spot",
    playKey: "coverspot",
    chalk: "Cover the spot — or get greedy.",
    defaults: { bestCoverStages: 0, bestCoverPct: 0, bestCoverDiscs: 0 },
    onLeave() {
      if (run && !run.done) finish("leave");
      stopIdle();
    },
    onShow() { declareP0(); stampDepthCopy(); paintRoomChrome(attractSpec()); startIdle(); draw(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      if (run && run.revealTimer) window.clearTimeout(run.revealTimer);
      run = null;
      if ($("coverSpotVerdict")) $("coverSpotVerdict").hidden = true;
      kit.hideResult("coverSpotResult");
      if ($("coverSpotStart")) {
        $("coverSpotStart").disabled = false;
        $("coverSpotStart").hidden = false;
        $("coverSpotStart").textContent = "START · 1 demo coin";
      }
      if ($("coverSpotDrop")) $("coverSpotDrop").hidden = true;
      if ($("coverSpotCash")) {
        $("coverSpotCash").hidden = true;
        $("coverSpotCash").disabled = true;
        $("coverSpotCash").classList.remove("cash-scream");
        $("coverSpotCash").textContent = "CASH OUT";
      }
      setGreed(false);
      resetPips();
      kit.setMode(card(), "vestibule");
      stampDepthCopy();
      startIdle();
      draw();
    },
    refreshDepth(state) {
      const host = card();
      const onResult = !!(host && host.classList.contains("is-result") && run);
      const now = $("depthCoverNow");
      const liveSpec = (run && !run.done) || onResult ? run.spec : attractSpec();
      if (now) now.textContent = hudStageLine(liveSpec);
      const pct = $("depthCoverPct");
      if (pct) pct.textContent = run && (!run.done || onResult) ? `${Math.floor(run.coverage * 100)}%` : "0%";
      const best = $("depthCoverBest");
      const bestN = Math.max(state.bestCoverStages || 0, (state.bestDepth && state.bestDepth.coverspot) || 0);
      if (best) best.textContent = bestN ? `SPOT ${bestN}` : "—";
      const bestP = $("depthCoverBestPct");
      if (bestP) bestP.textContent = state.bestCoverPct ? `${state.bestCoverPct}%` : "—";
      const door = $("coverSpotDoorBest");
      if (door) {
        const discs = state.bestCoverDiscs || 0;
        if (bestN) door.textContent = `SPOT ${bestN} · ${state.bestCoverPct || 0}% · ${discs} discs`;
        else if (state.bestCoverPct) door.textContent = `Coverage ${state.bestCoverPct}%`;
        else door.textContent = "Coverage —";
      }
    },
    bind() {
      declareP0();
      const startBtn = $("coverSpotStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const cash = $("coverSpotCash");
      if (cash) cash.addEventListener("click", cashOut);
      const drop = $("coverSpotDrop");
      if (drop) drop.addEventListener("click", dropFromButton);
      const again = $("coverSpotDropAgain");
      if (again) again.addEventListener("click", dropAgain);
      const greedCash = $("coverSpotGreedCash");
      if (greedCash) greedCash.addEventListener("click", cashOut);
      const canvas = $("coverSpotCanvas");
      if (canvas) {
        canvas.addEventListener("pointermove", (ev) => {
          const p = kit.canvasPos(canvas, ev, W, H);
          pointer = { x: p.x, y: p.y, on: true };
          if (run && !run.done && !run.awaiting) draw();
        });
        canvas.addEventListener("pointerleave", () => { pointer.on = false; });
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            punchStart();
            return;
          }
          if (run.awaiting || run.settling) return;
          ev.preventDefault();
          if (canvas.setPointerCapture && ev.pointerId != null) {
            try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
          }
          const p = kit.canvasPos(canvas, ev, W, H);
          pointer = { x: p.x, y: p.y, on: true };
          dropAt(p.x, p.y);
        });
      }
      const copyBtn = $("coverSpotChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const st = PF.getState();
          const n = (st.lastRun && st.lastRun.coverspot && st.lastRun.coverspot.depth)
            || (st.lastRun && st.lastRun.game === GAME_ID && st.lastRun.depth)
            || (st.bestCoverStages || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const el = $("coverSpotCopied");
            if (el) {
              el.hidden = false;
              el.textContent = "Copied — send it";
            }
            setStatus("Copied — send it");
          }, () => {
            setStatus(text);
          });
        });
      }
      if ($("coverSpotDrop")) $("coverSpotDrop").hidden = true;
      if ($("coverSpotCash")) $("coverSpotCash").hidden = true;
      stampDepthCopy();
      startIdle();
      draw();
    },
  });
})();
