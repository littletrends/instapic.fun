/* Duck Pond Hook — Desktop Grok owns this file. PF only. Never booth/port 6000. Never Imagine.
 * GOBLIN B04 AUTHORED — GOBLIN_AUTHORED_LEVELS_B04.md · hybrid + codaEnabled.
 * 8 unique ponds (layout / cheat / filter / remap), NOT faster-water + smaller-hook climb.
 * Custom path-float + tap-drag hook. Target colour posted; wrong catch = strike + release.
 * Authored: Yellow Nursery → Cross Current → Painted Decoy → Diving Shelf → Twin Call → Whirlpool Ring → Hook Mirror → Fever Duck Opera → ENDLESS Lucky Lie {n}
 * HUD = current POND (playing) · glory/best = ponds cleared · death = wrong_duck
 * wrongLimit PER STAGE — wrongs reset on clear. Pips = this-stage wrongs.
 * Soft miss (no duck) is not a strike. Divers unhittable underwater.
 * Don’t: all ducks equal forever. Death hold ≥700ms. Jab or drag-yank — no hold-vacuum.
 * Vestibule: HOOK THE CALL — NOT EVERY DUCK IS LUCKY. coda off → souvenir after Fever Duck Opera. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const W = 340;
  const H = 460;
  const GAME_ID = "duckpond";
  const TAU = Math.PI * 2;
  const LANES_Y = [214, 272, 328];
  const FLOCK = 7;
  const DEATH_HOLD_MS = 760;
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const IDLE_ROOM_MS = 2800;
  const ROOM_CARD_MS = 1180;
  const PAL = {
    yellow: { body: "#f0d09a", wing: "#d4a45a", bill: "#c41e3a", eye: "#12080c" },
    blue: { body: "#3d8a8a", wing: "#2a6a6a", bill: "#d4a45a", eye: "#fff6ec" },
    red: { body: "#c41e3a", wing: "#8a1428", bill: "#f0d09a", eye: "#fff6ec" },
    green: { body: "#4a7a48", wing: "#2e5a2c", bill: "#d4a45a", eye: "#12080c" },
  };
  const BAIT = "green";
  const POND = { cx: W / 2, cy: 292, rx: 158, ry: 118 };

  let run = null;
  let idleRaf = 0;
  let idleDucks = null;
  let idleT = 0;
  let idleRoom = 1;
  let idleClock = 0;
  let hover = { x: W / 2, y: 250 };

  const AURA = {
    wrong_duck: "Aura: Wrong colour. Lucky ducks aren't that one.",
    shallow: "Aura: Not a single call. The pond sped up without you.",
    mid: "Aura: Cute hooks. The pond still picks favourites.",
    deep: (n) => `Aura: Stage ${n}. Hook small, call rotating — still fishing.`,
    leave: "Aura: You walked mid-hook. Ducks keep the luck.",
    clear: "Aura: Call hooked. Pond speeds up.",
    souvenir: "Aura: Lucky Lie souvenir. The pond kept your hook.",
  };

  const AUTHORED = [
    {
      id: 1, title: "Yellow Nursery", kind: "teach",
      colours: ["yellow"], need: 5, speed: "slow", speedMul: 0.5,
      hookR: "big", hookPx: 48, wrongLimit: 3, rotatingCall: false,
      lanes: 1, oneWay: true, callChance: 0.7, baitChance: 0.18,
      barker: "One lane, left to right. Hook yellow. Big hook.",
    },
    {
      id: 2, title: "Cross Current", kind: "crossCurrent",
      colours: ["yellow"], need: 6, speed: "+", speedMul: 0.6,
      hookR: "big", hookPx: 44, wrongLimit: 3, rotatingCall: false,
      lanes: 2, cross: true, callChance: 0.58, baitChance: 0.22,
      barker: "Two lanes, opposite currents. Still yellow only.",
    },
    {
      id: 3, title: "Painted Decoy", kind: "decoyHat",
      colours: ["yellow"], need: 6, speed: "+", speedMul: 0.65,
      hookR: "mid", hookPx: 40, wrongLimit: 3, rotatingCall: false,
      lanes: 2, decoyHats: true, callChance: 0.5, baitChance: 0.12,
      barker: "Yellow hats on blue bodies. Hook the true yellow.",
    },
    {
      id: 4, title: "Diving Shelf", kind: "diveEvent",
      colours: ["yellow"], need: 7, speed: "+", speedMul: 0.7,
      hookR: "mid", hookPx: 38, wrongLimit: 3, rotatingCall: false,
      lanes: 2, diveEvent: true, callChance: 0.55, baitChance: 0.2,
      barker: "Yellows dive mid-path. Wait for the surface.",
    },
    {
      id: 5, title: "Twin Call", kind: "twinCall",
      colours: ["yellow", "blue"], need: 8, speed: "+", speedMul: 0.75,
      hookR: "mid", hookPx: 36, wrongLimit: 2, rotatingCall: true, rotateEveryCorrect: 1,
      lanes: 2, callChance: 0.5, baitChance: 0.2,
      barker: "Call flips every catch. Yellow then blue. Toast updates.",
    },
    {
      id: 6, title: "Whirlpool Ring", kind: "whirl",
      colours: ["blue"], need: 7, speed: "++", speedMul: 0.7,
      hookR: "mid", hookPx: 34, wrongLimit: 2, rotatingCall: false,
      whirl: true, callChance: 0.52, baitChance: 0.22,
      barker: "Pond is a slow circle. Lead the curve. Call blue.",
    },
    {
      id: 7, title: "Hook Mirror", kind: "mirrorHook",
      colours: ["red"], need: 8, speed: "++", speedMul: 0.75,
      hookR: "mid", hookPx: 32, wrongLimit: 2, rotatingCall: false,
      lanes: 2, mirrorHook: true, callChance: 0.5, baitChance: 0.22,
      barker: "Pull left, hook goes right. Call red.",
    },
    {
      id: 8, title: "Fever Duck Opera", kind: "comboFinale",
      colours: ["yellow", "blue"], need: 10, speed: "++", speedMul: 0.8,
      hookR: "mid", hookPx: 32, wrongLimit: 2, rotatingCall: false,
      lanes: 2, cross: true, decoyHats: true, diveWaveOnce: true, twinFinale: true,
      callChance: 0.48, baitChance: 0.16,
      barker: "Cross current, decoys, dive wave, twin-call finale. Gauntlet.",
    },
  ];

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Duck Pond Hook",
    depthUnit: "Pond",
    sheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored PONDS then ENDLESS · hook the call · wrong colour stamps",
    body: "Authored rooms, not a thinner loop: Yellow Nursery → Cross Current → Painted Decoy → Diving Shelf → Twin Call → Whirlpool Ring → Hook Mirror → Fever Duck Opera → ENDLESS Lucky Lie. Tap-drag the hook. Only the posted colour scores. Two currents, decoy hats, dives, whirl, mirror hook — not a faster pond. Not every duck is lucky.",
    status: "Depth run · START · 1 demo coin · 8 authored PONDS then ENDLESS",
    machine: "Kid pond · 1 demo coin · 8 authored PONDS",
    idleHud: ["HOOK THE CALL — NOT EVERY DUCK IS LUCKY", "START · 1 demo coin — colour is the cheat"],
    punch: "Depth run — press START. No every-duck prize.",
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

  /* 18:23 drop-in from GOBLIN_BATCH04_MOUNT_CONFIGS.md — numbers are the contract. */
  function duckpondMountParams(n) {
    const t = n - 1;
    if (n === 1) {
      return {
        id: 1, title: "Yellow Call", colours: ["yellow"], need: 5, speed: "slow",
        speedMul: 0.5, hookR: "big", hookPx: 48, wrongLimit: 3, rotatingCall: false,
      };
    }
    if (n === 2) {
      return {
        id: 2, title: "Yellow Plus", colours: ["yellow"], need: 6, speed: "+",
        speedMul: 0.65, hookR: "big", hookPx: 44, wrongLimit: 3, rotatingCall: false,
      };
    }
    if (n === 3) {
      return {
        id: 3, title: "Two-Tone", colours: ["yellow", "blue"], need: 7, speed: "+",
        speedMul: 0.8, hookR: "mid", hookPx: 36, wrongLimit: 3, rotatingCall: false,
      };
    }
    if (n === 4) {
      return {
        id: 4, title: "Blue Only", colours: ["blue"], need: 8, speed: "++",
        speedMul: 1.0, hookR: "mid", hookPx: 32, wrongLimit: 2, rotatingCall: false,
      };
    }
    if (n === 5) {
      return {
        id: 5, title: "Red Only", colours: ["red"], need: 8, speed: "++",
        speedMul: 1.15, hookR: "small", hookPx: 26, wrongLimit: 2, rotatingCall: false,
      };
    }
    return {
      id: n,
      title: "Rotating Call",
      colours: ["yellow", "blue", "red"],
      need: 10,
      speed: "+++",
      speedMul: Math.min(1.8, 1.15 + 0.08 * t),
      hookR: "small",
      hookPx: Math.max(18, 26 - t),
      wrongLimit: 2,
      rotatingCall: true,
      rotateEveryCorrect: 2,
    };
  }

  function duckpondCoda(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const mount = duckpondMountParams(stage);
    return Object.assign({}, mount, {
      id: stage,
      title: `Lucky Lie ${stage}`,
      kind: "coda",
      weave: true,
      dive: true,
      rotatingCall: true,
      rotateEveryCorrect: 2,
      coda: true,
      barker: `ENDLESS — Lucky Lie ${stage}. Call rotates. Still fishing.`,
    });
  }

  function duckpondStageParams(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[stage - 1]);
    if (!CODA_ENABLED) return null;
    return duckpondCoda(stage);
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun || typeof kitRun.declare !== "function") return;
    try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: duckpondStageParams,
      codaParams: duckpondCoda,
      mountParams: duckpondMountParams,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function cabinetOn() {
    const node = document.getElementById("cabinet-duck-pond");
    return !!(node && !node.hidden);
  }

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function attractSpec() {
    return duckpondStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function liveSpec() {
    if (run && run.spec) return run.spec;
    return attractSpec();
  }

  function roomTell(spec) {
    if (!spec) return "HOOK THE CALL";
    if (spec.kind === "coda") return "ENDLESS — LUCKY LIE CLIMB";
    if (spec.kind === "comboFinale") return "CROSS + DECOY + DIVE WAVE + TWIN FINALE";
    if (spec.mirrorHook) return "PULL LEFT — HOOK GOES RIGHT";
    if (spec.whirl) return "CIRCLE POND — LEAD THE CURVE";
    if (spec.rotatingCall) return "CALL FLIPS EVERY CATCH";
    if (spec.diveEvent) return "YELLOWS DIVE — WAIT FOR SURFACE";
    if (spec.decoyHats) return "YELLOW HATS ON BLUE BODIES";
    if (spec.cross) return "TWO LANES — OPPOSITE CURRENTS";
    return "ONE LANE LEFT TO RIGHT · HOOK YELLOW";
  }

  function drawRoomCard(ctx, spec, ms) {
    if (!spec || !(ms > 0)) return;
    const a = Math.min(1, ms / 220);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(12,6,9,0.92)";
    ctx.fillRect(22, 148, W - 44, 108);
    ctx.strokeStyle = spec.coda ? "#e8a0b8" : "#f0d09a";
    ctx.lineWidth = 2.2;
    ctx.strokeRect(22.5, 148.5, W - 45, 107);
    ctx.fillStyle = spec.coda ? "#e8a0b8" : "#d4a45a";
    ctx.font = "bold 11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(spec.coda ? "ENDLESS POND" : "AUTHORED POND", W / 2, 170);
    ctx.fillStyle = "#fff6ec";
    ctx.font = "bold 20px Georgia, serif";
    ctx.fillText(spec.title, W / 2, 198);
    ctx.fillStyle = "#e8a0b8";
    ctx.font = "11px Georgia, serif";
    ctx.fillText(roomTell(spec), W / 2, 226);
    ctx.restore();
  }

  function kindWash(ctx, spec) {
    if (!spec) return;
    let col = null;
    if (spec.kind === "comboFinale") col = "rgba(196,30,58,0.10)";
    else if (spec.mirrorHook) col = "rgba(184,232,224,0.08)";
    else if (spec.whirl) col = "rgba(61,138,138,0.12)";
    else if (spec.rotatingCall) col = "rgba(240,208,154,0.08)";
    else if (spec.diveEvent) col = "rgba(61,138,138,0.10)";
    else if (spec.decoyHats) col = "rgba(196,30,58,0.08)";
    else if (spec.cross) col = "rgba(240,208,154,0.08)";
    else if (spec.coda) col = "rgba(232,160,184,0.10)";
    if (!col) return;
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, W, H);
  }

  function hudLine(spec, playing) {
    if (!spec) return "POND 0";
    if (spec.coda) return `ENDLESS · POND ${playing} · ${spec.title}`;
    return `POND ${playing} · ${spec.title}`;
  }

  function cheatLabel(spec) {
    if (!spec) return "";
    if (spec.kind === "coda") return "LUCKY LIE";
    if (spec.kind === "comboFinale") return "DUCK OPERA";
    if (spec.mirrorHook) return "HOOK MIRROR";
    if (spec.whirl) return "WHIRLPOOL";
    if (spec.rotatingCall) return "TWIN CALL";
    if (spec.diveEvent) return "DIVING SHELF";
    if (spec.decoyHats) return "PAINTED DECOY";
    if (spec.cross) return "CROSS CURRENT";
    return "";
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
      hud.textContent = "POND 0";
      hud.hidden = true;
    }
    return hud;
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
    return Math.max(state.bestDuckPond || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }

  function tellStrike(reason) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportStrike !== "function") return;
    try { rk().reportStrike(run.kitRun, reason); } catch (_) { /* pips */ }
    ensurePips((liveSpec() && liveSpec().wrongLimit) || 3);
  }

  function mountCustom(ctx) {
    if (!ctx) return null;
    return {
      id: "Custom",
      gameId: GAME_ID,
      stageParams: duckpondStageParams,
      codaParams: duckpondCoda,
    };
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("duckpond")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function card() {
    return el("duckPondCard");
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
    if (call.length && Math.random() < callP) {
      return call[(Math.random() * call.length) | 0];
    }
    if (Math.random() < baitP) return BAIT;
    if (unlucky.length) return unlucky[(Math.random() * unlucky.length) | 0];
    return BAIT;
  }

  function lanesOf(spec) {
    if (!spec || spec.whirl) return [POND.cy];
    if (spec.lanes === 1) return [268];
    if (spec.lanes === 2) return [232, 312];
    return LANES_Y;
  }

  function spawnDuck(spec, fromLeft) {
    let colour = pickColour(spec);
    const lanes = lanesOf(spec);
    let lane = (Math.random() * lanes.length) | 0;
    let dir = Math.random() < 0.5 ? 1 : -1;
    if (spec.oneWay) dir = 1;
    if (spec.cross) dir = lane === 0 ? 1 : -1;
    const startL = fromLeft == null ? dir > 0 : !!fromLeft;
    if (spec.oneWay) {
      lane = 0;
      dir = 1;
    }
    const call = currentCall(spec);
    let paint = null;
    let hat = null;
    let decoy = false;
    if (spec.paint && call.indexOf(colour) === -1 && Math.random() < 0.42) {
      paint = call[(Math.random() * call.length) | 0];
    }
    if (spec.decoyHats && Math.random() < 0.42) {
      hat = "yellow";
      decoy = true;
      colour = "blue";
    }
    const angle = Math.random() * TAU;
    return {
      x: spec.whirl ? POND.cx : (startL ? -28 - Math.random() * 50 : W + 28 + Math.random() * 50),
      lane,
      colour,
      paint,
      hat,
      decoy,
      diver: !!(spec.diveEvent && colour === "yellow" && Math.random() < 0.45) || !!(spec.dive && Math.random() < 0.34),
      sineDive: !!(spec.dive && !spec.diveEvent),
      dived: false,
      diveUntil: 0,
      phase: Math.random() * TAU,
      angle,
      r: 13.5,
      dir: spec.whirl ? 1 : (startL ? 1 : -1),
      caught: false,
      lift: 0,
      flee: 0,
      flash: 0,
      laneShift: Math.random() * 700,
    };
  }

  function seedFlock(spec) {
    const ducks = [];
    for (let i = 0; i < FLOCK; i += 1) {
      const d = spawnDuck(spec, i % 2 === 0);
      if (spec.whirl) {
        d.angle = (i / FLOCK) * TAU;
        const pos = duckPos(d, 0, spec);
        d.x = pos.x;
      } else {
        d.x = 18 + (i / FLOCK) * (W - 36);
      }
      ducks.push(d);
    }
    return ducks;
  }

  function ensureIdleDucks() {
    const spec = attractSpec();
    if (!idleDucks || idleDucks._room !== idleRoom) {
      idleDucks = seedFlock(spec);
      idleDucks._room = idleRoom;
    }
    return idleDucks;
  }

  function isDiving(d, t) {
    if (!d) return false;
    if (d.diveUntil && (t || 0) < d.diveUntil) return true;
    if (d.sineDive) return Math.sin((t || 0) * 0.0024 + d.phase) > 0.35;
    return false;
  }

  function duckPos(d, t, spec) {
    const s = spec || liveSpec();
    if (s && s.whirl) {
      const a = d.angle || 0;
      return {
        x: POND.cx + Math.cos(a) * (POND.rx * 0.62),
        y: POND.cy + Math.sin(a) * (POND.ry * 0.62) + Math.sin((t || 0) * 0.003 + d.phase) * 4 - (d.lift || 0),
      };
    }
    const lanes = lanesOf(s);
    const y0 = lanes[d.lane % lanes.length] || LANES_Y[0];
    const dive = isDiving(d, t) ? 18 : 0;
    return {
      x: d.x,
      y: y0 + Math.sin((t || 0) * 0.0032 + d.phase) * 7.5 - (d.lift || 0) + dive,
    };
  }

  function duckY(d, t) {
    return duckPos(d, t, liveSpec()).y;
  }

  function clampHook(p) {
    const x = kit.clamp(p.x, POND.cx - POND.rx + 12, POND.cx + POND.rx - 12);
    const y = kit.clamp(p.y, 168, H - 28);
    const nx = (x - POND.cx) / (POND.rx - 10);
    const ny = (y - POND.cy) / (POND.ry - 10);
    const d2 = nx * nx + ny * ny;
    if (d2 <= 1) return { x, y };
    const s = 1 / Math.sqrt(d2);
    return { x: POND.cx + nx * (POND.rx - 10) * s, y: POND.cy + ny * (POND.ry - 10) * s };
  }

  function resetPips() {
    const host = card();
    const pips = (host && host.querySelector("[data-runkit-strikes]")) || document.querySelector("[data-runkit-strikes=\"duckpond\"]");
    if (!pips) return;
    pips.querySelectorAll("i").forEach((n) => n.classList.remove("on"));
  }

  function ensurePips(count) {
    const stage = card() && card().querySelector(".vendor-stage");
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
      const lit = run.wrong | 0;
      span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < lit));
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
    ensurePips();
    const canvas = el("duckPondCanvas");
    if (canvas) {
      canvas.classList.toggle("is-locked", !isLive());
      canvas.style.touchAction = "none";
    }
    if (!isLive() && (!run || run.done)) setText("duckPondStatus", DEPTH_COPY.status);
  }

  function punchStart() {
    stampDepthCopy();
    setText("duckPondStatus", DEPTH_COPY.punch);
    const btn = el("duckPondStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") {
      return rk().challengeText("Duck Pond stage", depth, GAME_ID);
    }
    return `Beat my Duck Pond stage ${depth | 0} on Penny Fever`;
  }

  function drawDuck(ctx, d, t, ghost, spec) {
    const pos = duckPos(d, t, spec);
    const diving = isDiving(d, t);
    const pal = PAL[d.colour] || PAL.yellow;
    const flip = (spec && spec.whirl) ? (Math.cos(d.angle || 0) >= 0 ? 1 : -1) : (d.dir < 0 ? -1 : 1);
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.scale(flip, 1);
    if (ghost) ctx.globalAlpha = 0.45;
    if (d.flee > 0) ctx.globalAlpha = 0.7;
    if (diving) ctx.globalAlpha = Math.min(ctx.globalAlpha, 0.42);
    ctx.fillStyle = "rgba(8,20,28,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 10, 14, 4.2, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 1, 13.2, 8.2, -0.12, 0, TAU);
    ctx.fillStyle = pal.body;
    ctx.fill();
    ctx.strokeStyle = "rgba(18,8,12,0.45)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    if (d.hat && PAL[d.hat]) {
      ctx.beginPath();
      ctx.ellipse(10.2, -9.4, 6.4, 3.2, -0.2, 0, TAU);
      ctx.fillStyle = PAL[d.hat].body;
      ctx.fill();
      ctx.strokeStyle = "rgba(18,8,12,0.45)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,246,236,0.92)";
      ctx.font = "bold 7px Georgia, serif";
      ctx.textAlign = "center";
      ctx.scale(flip, 1);
      ctx.fillText("HAT", 0, -16);
      ctx.scale(flip, 1);
    }
    if (d.paint && PAL[d.paint]) {
      ctx.beginPath();
      ctx.ellipse(-0.4, -1.8, 11.4, 5.6, -0.14, 0, TAU);
      ctx.fillStyle = PAL[d.paint].body;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(1.4, 4.4, 9.6, 4.2, 0.1, 0, TAU);
      ctx.fillStyle = pal.body;
      ctx.fill();
      ctx.strokeStyle = pal.body;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-6, 6);
      ctx.lineTo(6, 6);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,246,236,0.9)";
      ctx.font = "bold 7px Georgia, serif";
      ctx.textAlign = "center";
      ctx.scale(flip, 1);
      ctx.fillText("PAINT", 0, -12);
      ctx.scale(flip, 1);
    }
    ctx.beginPath();
    ctx.ellipse(-2, 1.5, 7, 4.6, 0.4, 0, TAU);
    ctx.fillStyle = pal.wing;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10.5, -3.2, 6.1, 0, TAU);
    ctx.fillStyle = pal.body;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(15.2, -3.4);
    ctx.lineTo(22.5, -1.2);
    ctx.lineTo(15.4, 0.8);
    ctx.closePath();
    ctx.fillStyle = pal.bill;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12.2, -4.6, 1.35, 0, TAU);
    ctx.fillStyle = pal.eye;
    ctx.fill();
    if (d.flash > 0) {
      ctx.strokeStyle = d.colour === BAIT ? "#c41e3a" : "#fff6ec";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, d.r + 6, 0, TAU);
      ctx.stroke();
    }
    if (diving) {
      ctx.strokeStyle = "rgba(184,232,224,0.55)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 8, 16, 5, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "rgba(184,232,224,0.9)";
      ctx.font = "bold 8px Georgia, serif";
      ctx.textAlign = "center";
      ctx.scale(flip, 1);
      ctx.fillText("UNDER", 0, 18);
      ctx.scale(flip, 1);
    } else if (d.colour === BAIT && !d.paint) {
      ctx.fillStyle = "rgba(255,246,236,0.9)";
      ctx.font = "bold 7px Georgia, serif";
      ctx.textAlign = "center";
      ctx.scale(flip, 1);
      ctx.fillText("BAIT", 0, -12);
      ctx.scale(flip, 1);
    }
    ctx.restore();
  }

  function drawHook(ctx, x, y, r, down) {
    ctx.save();
    ctx.strokeStyle = down ? "#f0d09a" : "rgba(240,208,154,0.45)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x, 108);
    ctx.lineTo(x, y - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, Math.max(8, r * 0.42), 0.35, TAU - 0.85);
    ctx.strokeStyle = down ? "#fff6ec" : "#d4a45a";
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 3.1, 0, TAU);
    ctx.fillStyle = down ? "#c41e3a" : "#d4a45a";
    ctx.fill();
    ctx.strokeStyle = down ? "rgba(232,160,184,0.55)" : "rgba(212,164,90,0.28)";
    ctx.lineWidth = down ? 1.6 : 1.1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawCallBanner(ctx, spec) {
    const call = currentCall(spec);
    const flash = run && run.callFlash > 0;
    ctx.fillStyle = flash ? "rgba(196,30,58,0.55)" : "rgba(12,6,9,0.72)";
    ctx.fillRect(18, 78, W - 36, 28);
    ctx.strokeStyle = flash ? "#fff6ec" : "rgba(212,164,90,0.55)";
    ctx.strokeRect(18.5, 78.5, W - 37, 27);
    ctx.fillStyle = "#f0d09a";
    ctx.font = "11px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText(flash ? "NOW" : "CALL", 26, 96);
    call.forEach((c, i) => {
      const pal = PAL[c] || PAL.yellow;
      const x = 72 + i * 28;
      ctx.beginPath();
      ctx.arc(x, 92, flash ? 11 : 9, 0, TAU);
      ctx.fillStyle = pal.body;
      ctx.fill();
      ctx.strokeStyle = "#fff6ec";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
    ctx.fillStyle = flash ? "#fff6ec" : "#e8a0b8";
    ctx.font = "10px Georgia, serif";
    ctx.textAlign = "right";
    ctx.fillText(spec.rotatingCall ? "ROTATES" : call.join(" / ").toUpperCase(), W - 26, 96);
  }

  function drawPond(ctx, t) {
    const g = ctx.createLinearGradient(0, 168, 0, H);
    g.addColorStop(0, "#1a3a48");
    g.addColorStop(0.55, "#0e2430");
    g.addColorStop(1, "#081418");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(POND.cx, POND.cy, POND.rx, POND.ry, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = "rgba(184,232,224,0.18)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.ellipse(POND.cx, POND.cy, 128 - i * 22, 92 - i * 14, 0, 0, TAU);
      ctx.stroke();
    }
    const rip = 6 + Math.sin(t * 0.0024) * 3;
    ctx.strokeStyle = "rgba(240,208,154,0.18)";
    ctx.beginPath();
    ctx.ellipse(POND.cx, POND.cy, 70 + rip, 28 + rip * 0.4, 0, 0, TAU);
    ctx.stroke();
    const spec = liveSpec();
    if (spec && spec.whirl) {
      ctx.strokeStyle = "rgba(184,232,224,0.45)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.ellipse(POND.cx, POND.cy, POND.rx * 0.62, POND.ry * 0.62, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (spec && spec.cross) {
      ctx.strokeStyle = "rgba(240,208,154,0.28)";
      ctx.setLineDash([8, 6]);
      lanesOf(spec).forEach((y, i) => {
        ctx.beginPath();
        ctx.moveTo(28, y);
        ctx.lineTo(W - 28, y);
        ctx.stroke();
        ctx.fillStyle = "rgba(240,208,154,0.7)";
        ctx.font = "bold 9px Georgia, serif";
        ctx.textAlign = "left";
        ctx.fillText(i === 0 ? "→" : "←", 30, y - 6);
      });
      ctx.setLineDash([]);
    }
  }

  function draw() {
    const canvas = el("duckPondCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (run) run.shake = kit.applyShake(ctx, run.shake || 0);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#241018");
    bg.addColorStop(1, "#0c080c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    kit.fillWood(ctx, 8, 36, 324, 128);
    ctx.fillStyle = "rgba(8,4,8,0.28)";
    ctx.fillRect(8, 36, 324, 128);

    const spec = liveSpec();
    const t = run && (isLive() || run.dying) ? run.t : idleT;
    drawPond(ctx, t);
    kindWash(ctx, spec);
    drawCallBanner(ctx, spec);

    const cheat = cheatLabel(spec);
    if (cheat) {
      ctx.fillStyle = spec.paint ? "rgba(196,30,58,0.92)" : "rgba(240,208,154,0.92)";
      ctx.font = "bold 11px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(cheat, W / 2, 54);
    }

    if (isLive() && run.roomCardMs > 0) drawRoomCard(ctx, spec, run.roomCardMs);
    else if (!isLive() && !(run && run.dying) && (!run || run.done) && idleClock < 1100) {
      drawRoomCard(ctx, spec, 1100 - idleClock);
    }

    const ducks = (isLive() || (run && run.dying)) ? run.ducks : ensureIdleDucks();
    ducks.forEach((d) => {
      if (!d.caught) drawDuck(ctx, d, t, !isLive() && !(run && run.dying), spec);
    });

    const hx = run && run.hook ? run.hook.x : hover.x;
    const hy = run && run.hook ? run.hook.y : hover.y;
    const down = !!(isLive() && run.hook && run.hook.down);
    drawHook(ctx, hx, hy, spec.hookPx, down);

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, "POND");

    ctx.textAlign = "left";
    if (isLive() || (run && run.dying)) {
      kit.drawHud(ctx, W, [
        `${spec.title} · ${run.caught}/${spec.need} · wrong ${run.wrong}/${spec.wrongLimit}`,
        `${hudLine(spec, run.stage)} · ${run.score} · hook ${spec.hookR}${spec.rotatingCall ? " · ROTATE" : ""}`,
      ]);
    } else if (!run || !run.closedStamp) {
      const tell = cheatLabel(spec);
      kit.drawHud(ctx, W, [
        DEPTH_COPY.idleHud[0],
        tell ? `${spec.title} · ${tell}` : DEPTH_COPY.idleHud[1],
      ]);
    }
  }

  function stopIdle() {
    if (idleRaf) cancelAnimationFrame(idleRaf);
    idleRaf = 0;
  }

  function driftIdle(dt) {
    const spec = attractSpec();
    const ducks = ensureIdleDucks();
    const k = dt / 16;
    ducks.forEach((d) => {
      if (spec.whirl) {
        d.angle = (d.angle || 0) + spec.speedMul * 0.018 * k;
        d.x = duckPos(d, idleT, spec).x;
        return;
      }
      if (spec.weave) {
        d.laneShift = (d.laneShift || 0) + dt;
        const laneN = lanesOf(spec).length;
        if (d.laneShift > 880) {
          d.lane = (d.lane + (Math.random() < 0.5 ? 1 : laneN - 1)) % laneN;
          d.laneShift = 0;
        }
      }
      d.x += d.dir * spec.speedMul * 0.9 * k;
      if (d.x > W + 36) Object.assign(d, spawnDuck(spec, true));
      else if (d.x < -36) Object.assign(d, spawnDuck(spec, false));
    });
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
      const dt = Math.min(48, now - last);
      last = now;
      idleT += dt;
      idleClock += dt;
      if (idleClock > IDLE_ROOM_MS) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        idleDucks = null;
      }
      driftIdle(dt);
      draw();
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }

  function startStage(n) {
    const spec = duckpondStageParams(n);
    if (!spec) {
      finish("souvenir");
      return;
    }
    run.spec = spec;
    run.stage = spec.id;
    run.ducks = seedFlock(spec);
    run.caught = 0;
    run.wrong = 0;
    run.callHits = 0;
    run.callIndex = 0;
    run.lock = 280;
    run.diveWaved = false;
    run.twinFinaleOn = false;
    run.roomCardMs = n === 1 ? 1480 : ROOM_CARD_MS;
    if (run.hook) run.hook.down = false;
    tellDepth(run.depth);
    ensurePips(spec.wrongLimit);
    ensureHud();
    const call = currentCall(spec).join(" / ");
    setText("duckPondStatus", spec.barker || `${spec.title} — hook ${call}. Need ${spec.need}.`);
  }

  function start() {
    if (isLive() || (run && run.dying)) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("duckPondStatus", "Out of demo coins · grant a pass");
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
      engine: mountCustom(kitRun),
      t: 0,
      last: 0,
      raf: 0,
      depth: 0,
      stage: 1,
      score: 0,
      spec: duckpondStageParams(1),
      ducks: [],
      caught: 0,
      wrong: 0,
      callIndex: 0,
      callHits: 0,
      callFlash: 0,
      hook: { x: W / 2, y: 250, down: false, moving: false, armed: false },
      lock: 0,
      shake: 0,
      closedStamp: false,
      deathHold: 0,
      deathNote: "",
      diveWaved: false,
      twinFinaleOn: false,
      roomCardMs: 0,
    };
    tellDepth(0);
    const startBtn = el("duckPondStart");
    if (startBtn) startBtn.disabled = true;
    const verdict = el("duckPondVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("duckPondResult");
    PF.setTier("duckPondTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    startStage(1);
    PF.focusCard("duckPondCard", true);
    PF.setAura("think");
    const loop = (now) => {
      if (!run || run.done) return;
      if (!run.last) run.last = now;
      const dt = Math.min(32, now - run.last);
      run.last = now;
      run.t += dt;
      if (run.dying) {
        run.roomCardMs = Math.max(0, (run.roomCardMs || 0) - dt);
        run.callFlash = Math.max(0, run.callFlash - dt);
        run.ducks.forEach((d) => {
          d.flash = Math.max(0, d.flash - dt);
          if (d.flee > 0) {
            d.flee -= dt;
            d.x += d.dir * (run.spec.speedMul || 1) * 4.2 * (dt / 16);
          }
        });
        draw();
        run.deathHold -= dt;
        if (run.deathHold <= 0) {
          sealResult(run.deathNote || "wrong_duck");
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

  function clearStage() {
    run.score += 280;
    run.depth += 1;
    if (run.kitRun) {
      run.kitRun.depth = run.depth;
      run.kitRun.score = run.score;
    }
    tellDepth(run.depth);
    kit.sfx("rack");
    PF.setAura("celebrate");
    const next = duckpondStageParams(run.depth + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    setText("duckPondStatus", run.depth >= 6 ? AURA.deep(run.depth) : AURA.clear);
    startStage(run.depth + 1);
  }

  function strikeWrong(d) {
    run.wrong += 1;
    tellStrike("wrong_duck");
    d.flee = 520;
    d.flash = 220;
    d.dir *= -1;
    run.shake = 5;
    kit.sfx("spit");
    PF.setAura("laugh");
    setText("duckPondStatus", `Wrong colour. Released. ${run.wrong}/${run.spec.wrongLimit}.`);
    if (run.wrong >= run.spec.wrongLimit) {
      run.deathNote = "wrong_duck";
      finish("wrong_duck");
    }
  }

  function awardCatch(d) {
    d.caught = true;
    d.lift = 1;
    run.caught += 1;
    run.score += 40;
    run.callHits += 1;
    if (run.kitRun) run.kitRun.score = run.score;
    kit.sfx("sink");
    PF.setAura("point");
    if (run.spec.rotatingCall && run.callHits % (run.spec.rotateEveryCorrect || 2) === 0) {
      run.callIndex += 1;
      run.callFlash = 640;
      setText("duckPondStatus", `Call rotates — now ${currentCall(run.spec).join(" / ").toUpperCase()}. ${run.caught}/${run.spec.need}`);
    } else {
      setText("duckPondStatus", `Hooked ${d.colour}. ${run.caught}/${run.spec.need}`);
    }
    if (run.caught >= run.spec.need) clearStage();
  }

  function tryHook(jab) {
    if (!isLive() || !run.hook || !run.hook.down || run.lock > 0) return;
    if (!run.hook.armed) return;
    if (!jab && !run.hook.moving) return;
    const spec = run.spec;
    const hx = run.hook.x;
    const hy = run.hook.y;
    const reach = spec.hookPx * (jab ? 0.82 : 0.9);
    let best = null;
    let bestD = reach;
    for (const d of run.ducks) {
      if (d.caught || d.flee > 0) continue;
      if (isDiving(d, run.t)) continue;
      const pos = duckPos(d, run.t, spec);
      const dist = Math.hypot(pos.x - hx, pos.y - hy);
      if (dist < bestD) {
        bestD = dist;
        best = d;
      }
    }
    run.hook.moving = false;
    if (!best) {
      if (jab) setText("duckPondStatus", "Air. Soft miss — not a strike.");
      return;
    }
    run.hook.armed = false;
    run.lock = jab ? 180 : 140;
    if (callMatch(best.colour, spec, best)) awardCatch(best);
    else strikeWrong(best);
  }

  function step(dt) {
    const k = dt / 16;
    const spec = run.spec;
    run.roomCardMs = Math.max(0, (run.roomCardMs || 0) - dt);
    run.lock = Math.max(0, run.lock - dt);
    run.callFlash = Math.max(0, (run.callFlash || 0) - dt);
    if (spec.diveWaveOnce && !run.diveWaved && run.caught >= Math.max(3, Math.floor(spec.need * 0.4))) {
      run.diveWaved = true;
      run.ducks.forEach((d) => { d.diveUntil = run.t + 800; });
      setText("duckPondStatus", "DIVE WAVE — wait for surface.");
    }
    if (spec.twinFinale && !run.twinFinaleOn && run.caught >= 5) {
      run.twinFinaleOn = true;
      run.spec.rotatingCall = true;
      run.spec.rotateEveryCorrect = 1;
      run.callIndex = 0;
      run.callHits = 0;
      run.callFlash = 640;
      setText("duckPondStatus", "TWIN CALL FINALE — yellow then blue.");
    }
    run.ducks.forEach((d) => {
      d.flash = Math.max(0, d.flash - dt);
      if (d.caught) {
        d.lift += 0.35 * k;
        d.x += d.dir * 0.2 * k;
        if (spec.whirl) d.angle = (d.angle || 0) + 0.01 * k;
        return;
      }
      if (spec.diveEvent && d.diver && !d.dived && d.x > W * 0.42 && d.x < W * 0.58) {
        d.dived = true;
        d.diveUntil = run.t + 800;
      }
      if (spec.weave && d.flee <= 0) {
        d.laneShift = (d.laneShift || 0) + dt;
        const laneN = lanesOf(spec).length;
        if (d.laneShift > 880) {
          d.lane = (d.lane + (Math.random() < 0.5 ? 1 : laneN - 1)) % laneN;
          d.laneShift = 0;
        }
      }
      if (spec.whirl) {
        const spin = spec.speedMul * 0.018 * k * (d.dir || 1);
        d.angle = (d.angle || 0) + spin;
        const pos = duckPos(d, run.t, spec);
        d.x = pos.x;
      } else if (d.flee > 0) {
        d.flee -= dt;
        d.x += d.dir * spec.speedMul * 4.2 * k;
      } else {
        d.x += d.dir * spec.speedMul * 1.55 * k;
      }
      if (!spec.whirl) {
        if (d.x > W + 36) Object.assign(d, spawnDuck(spec, true));
        else if (d.x < -36) Object.assign(d, spawnDuck(spec, false));
      }
    });
    run.ducks = run.ducks.filter((d) => !d.caught || d.lift < 40);
    while (run.ducks.filter((d) => !d.caught).length < FLOCK) {
      run.ducks.push(spawnDuck(spec));
    }
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (depth >= 6) return AURA.deep(depth);
    return AURA.wrong_duck;
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    if (run.hook) run.hook.down = false;
    run.deathNote = reason === "souvenir" ? "souvenir" : "wrong_duck";
    run.closedStamp = reason !== "souvenir";
    run.deathHold = DEATH_HOLD_MS;
    kit.sfx("stamp");
    run.shake = 8;
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    if (run.raf) cancelAnimationFrame(run.raf);
    run.closedStamp = reason !== "leave";
    const depth = run.depth | 0;
    const score = run.score;
    const death = reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : (run.deathNote || "wrong_duck"));
    persistDepth({
      depth,
      score,
      deathReason: death,
      cashedOut: death === "souvenir",
      meta: { stage: run.spec && run.spec.id, caught: run.caught, wrong: run.wrong, kind: run.spec && run.spec.kind },
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
      verdict.textContent = reason === "leave"
        ? `Left the pond · ${line}`
        : `${aura} ${line}`;
    }
    kit.fillResult({
      root: "duckPondResult",
      depth: "duckPondResultDepth",
      score: "duckPondResultScore",
      aura: "duckPondResultAura",
      copied: "duckPondCopied",
    }, {
      depthLine: `POND ${depth}`,
      scoreLine: `SCORE ${score} · ${(reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : "wrong_duck")).replace(/_/g, " ").toUpperCase()}`,
      auraLine: aura,
    });
    setText("duckPondChallengeText", challenge);
    PF.setTier("duckPondTier", depth > 0 ? `POND ${depth}` : "POND", depth > 0 ? "perfect" : "miss");
    setText("duckPondStatus", reason === "leave" ? "Left the pond." : (reason === "souvenir" ? "Pond souvenir. Hook stays." : "Pond stamped the hook."));
    const ok = depth > 0;
    if (ok) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Duck pond");
      PF.setAura(depth >= 4 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `POND ${depth}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Duck pond miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "POND", aura);
    }
    PF.refreshNightBoard();
    draw();
    startIdle();
  }

  PF.registerVendor({
    id: "duck-pond",
    playKey: "duckpond",
    chalk: "Hook the call. Not every duck is lucky.",
    defaults: { bestDuckPond: 0, bestDuckPondScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopIdle();
    },
    onShow() { stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      idleDucks = null;
      const verdict = el("duckPondVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("duckPondResult");
      const startBtn = el("duckPondStart");
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
      setText("depthDuckNow", isLive() || (run && run.dying) ? String(run.depth | 0) : "0");
      const bestN = Math.max(state.bestDuckPond || 0, (state.bestDepth && state.bestDepth.duckpond) || 0);
      setText("depthDuckBest", bestN ? String(bestN) : "—");
      setText("depthDuckScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("depthDuckBestScore", state.bestDuckPondScore ? String(state.bestDuckPondScore) : "—");
      const doorBest = el("duckPondDoorBest");
      if (doorBest) doorBest.textContent = bestN ? `Best pond ${bestN}` : "Ponds —";
    },
    bind() {
      declareP0();
      ensurePips();
      ensureHud();
      const startBtn = el("duckPondStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = el("duckPondCanvas");
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("pointerdown", (ev) => {
          if (run && (run.dying || run.done)) return;
          if (!isLive()) {
            punchStart();
            return;
          }
          ev.preventDefault();
          try { canvas.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
          const raw = kit.canvasPos(canvas, ev, W, H);
          if (run.spec && run.spec.mirrorHook) raw.x = W - raw.x;
          const p = clampHook(raw);
          run.hook = { x: p.x, y: p.y, down: true, moving: false, armed: true };
          hover = p;
          tryHook(true);
        });
        canvas.addEventListener("pointermove", (ev) => {
          const raw = kit.canvasPos(canvas, ev, W, H);
          if (isLive() && run.spec && run.spec.mirrorHook) raw.x = W - raw.x;
          const p = clampHook(raw);
          hover = p;
          if (!isLive() || !run.hook) return;
          if (run.hook.down) ev.preventDefault();
          const dist = Math.hypot(p.x - run.hook.x, p.y - run.hook.y);
          run.hook.x = p.x;
          run.hook.y = p.y;
          if (run.hook.down && run.hook.armed && dist > 12) {
            run.hook.moving = true;
            tryHook(false);
          }
        });
        const up = () => {
          if (run && run.hook) {
            run.hook.down = false;
            run.hook.moving = false;
            run.hook.armed = false;
          }
        };
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("pointercancel", up);
        canvas.addEventListener("pointerleave", up);
        canvas.addEventListener("lostpointercapture", up);
      }
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
      stampDepthCopy();
      draw();
    },
  });
})();
