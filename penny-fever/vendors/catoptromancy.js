/* Catoptromancy Mirror — Desktop Grok owns this file. PF only. Never booth/port 6000. Never Imagine.
 * GOBLIN B03 AUTHORED — GOBLIN_AUTHORED_LEVELS_B03.md + BATCH03_MOUNT_CONFIGS + RUNKIT_API.
 * OracleRooms KEEP/BURN/DOUBLE. Stall owns hold-to-fill death; never mount kit tick (broke_wait).
 * Hybrid: 8 unique rooms then ENDLESS coda (codaEnabled). Not a longer-wait loop.
 * Authored (ritual layout/verb, not hotter waitMs):
 *   1 First Gaze — KEEP only, teach hold
 *   2 Candle Gallery — candle VFX (not a break); BURN unlocks
 *   3 Double Threshold — DOUBLE 45/55
 *   4 Lie Flicker Glass — flash baits release; hold through
 *   5 Twin Pane — two glasses in sequence; release between spends break bank
 *   6 Colour Choir — KEEP matching last hues (constellation tease)
 *   7 Hazy Refusal — flavour trap; KEEP still legal
 *   8 Burner's Altar — juicy BURN preview + theatrical DOUBLE odds
 * Coda n=9+: Hazy Oracle {n}. Soft pack only. Skippers lose. No gumball.
 * HUD = current ROOM · glory/best = rooms KEPT · door = Room
 * KEEP depth++; BURN 1.25× same room; DOUBLE from 3 · 45% depth+2 rare / 55% DEATH
 * DOUBLE jumps GLORY +2 but still plays the next authored room.
 * 1 coin = 1 run. coda off → souvenir. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const W = 340;
  const H = 460;
  const CX = W / 2;
  const CY = 208;
  const RX = 112;
  const RY = 142;
  const GAME_ID = "catoptromancy";
  const CABINET_ID = "cabinet-catoptromancy";
  const CATOP_ALLOW_DOUBLE_FROM = 3;
  const DOUBLE_OK = 0.45;
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const CHOIR_MATCH = 80;
  const ARRIVE_GRACE_MS = 700;
  const DEATH_HOLD_MS = 760;
  const KEEP_SCORE = 200;
  const DOUBLE_SCORE = 600;
  const SET_BONUS = 500;

  const COLOURS = [
    { id: "rose", name: "Rose", hex: "#e8a0b8" },
    { id: "brass", name: "Brass", hex: "#d4a45a" },
    { id: "teal", name: "Teal", hex: "#3d8a8a" },
    { id: "violet", name: "Violet", hex: "#7a4a8a" },
    { id: "mercury", name: "Mercury", hex: "#c8d4dc" },
    { id: "ember", name: "Ember", hex: "#c45a28" },
    { id: "ivory", name: "Ivory", hex: "#f0e6d0" },
    { id: "moon", name: "Moon", hex: "#9ab0c8" },
  ];
  const RARE = [
    { id: "aurora", name: "Aurora", hex: "#7ee0c0" },
    { id: "gilt", name: "Gilt", hex: "#f4d078" },
    { id: "iris", name: "Iris", hex: "#b48cff" },
  ];

  const LINES = [
    "The glass likes your patience more than your questions.",
    "A brass penny is thinking about you. Don’t chase it.",
    "Tonight’s gossip is already tired of itself.",
    "Hold still. The alley remembers who waited.",
    "Your next tent will pretend not to notice you. Notice it first.",
    "Three small lucks, none of them loud.",
    "The mirror declines a prophecy. It offers a colour instead.",
    "Aura says: skipping is how the glass forgets you.",
    "A colour wants to sit in your pocket. That’s all.",
    "The wait was the fortune. The ticket is a receipt.",
    "Keep the colour. Burn the hurry.",
    "The tent is theatrical. So are you, sugar.",
    "A quiet win is still a win. Bank the hue.",
    "Someone in the hall will share a joke. Laugh late.",
    "The glass fogged on purpose. That’s showmanship.",
  ];
  const HAZY = [
    "Hazy. The glass shrugs. Colour still counts.",
    "Refused to speak clearly. You may keep the colour anyway.",
    "A fogged ticket. Theatre, not prophecy.",
    "The oracle is on break. The colour isn’t.",
    "Hazy refusal. KEEP is still legal.",
  ];
  const RARE_LINES = [
    "Rare gilt. The glass blinked first.",
    "Aurora in the dark glass. You held.",
    "Sweaty double — and it paid.",
  ];

  const AURA = {
    looked: "Aura: You looked away. The glass noticed.",
    lookedShallow: "Aura: Not one room. The wait is the game.",
    double: "Aura: Double is sweaty. The glass took the bet.",
    doubleDeep: "Aura: You rolled the glass. It rolled you back.",
    leave: "Aura: Walking off mid-gaze? Colour stays in the tent.",
    keep: "Aura: Colour banked. Don’t look away on the next wait.",
    deep: (n) => `Aura: Room ${n}. You waited like a statue.`,
    set: "Aura: Three of a colour. The glass likes a set.",
    coda: "Aura: Authored glass is done. ENDLESS haze. Don’t look away.",
    skip: "Aura: Skippers lose. The wait is the game.",
    falseFull: "Aura: The ring lied. You let go of a fake full.",
    phantom: "Aura: The button lied. Thumb stays — you lifted.",
    ghostKeep: "Aura: Ghost KEEP. The wait wasn’t done.",
    flicker: "Aura: You flinched at a lie flicker. Hold through.",
    twin: "Aura: Two panes. You looked away between glasses.",
    choir: "Aura: The choir wanted a matching hue. You blinked instead.",
    hazy: "Aura: Hazy isn’t a skip. KEEP was still legal.",
    altar: "Aura: The altar tempted you. The glass took the bet.",
    souvenir: "Aura: Authored glass locked. Souvenir — the wait was the fortune.",
  };

  const P0_MOUNT = {
    engine: "OracleRooms",
    displayName: "Catoptromancy Mirror",
    depthUnit: "Room",
    sheet: "GOBLIN_AUTHORED_LEVELS_B03.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored ROOMS · ENDLESS haze · KEEP / BURN / DOUBLE",
    body: "Authored rooms, not a longer wait loop: First Gaze (KEEP only) → Candle Gallery (flicker is theatre, BURN unlocks) → Double Threshold (45/55) → Lie Flicker Glass (hold through the flash) → Twin Pane (two glasses in sequence) → Colour Choir (KEEP matching hues) → Hazy Refusal (flavour trap) → Burner’s Altar (juicy BURN + theatrical DOUBLE) → ENDLESS Hazy Oracle. Hold gaze. The ring fills only while you hold. KEEP banks a colour and the next unique room; BURN rerolls meaner same room; DOUBLE from room 3 jumps glory +2 but still plays the next authored room. No skip. No gumball.",
    status: "Depth run · START · 1 demo coin · 8 authored ROOMS then ENDLESS · no skip",
    machine: "Dark glass · 1 demo coin · authored ROOMS",
    idleHud: ["THE MIRROR KNOWS YOU’RE THERE — DON’T LOOK AWAY", "START · 1 demo coin — skippers lose · no gumball"],
    punch: "Depth run — press START. No skip. No gumball.",
  };

  const AUTHORED = [
    {
      id: 1, title: "First Gaze", kind: "teach",
      waitMs: 4000, breakLimitMs: 1200, allowDouble: false, allowBurn: false,
      lieFlicker: false, falseFull: false, ghostChoices: false, ringDip: false,
      phantomLift: false, phantomText: "", hazyRefusal: false, candle: false,
      twinPane: false, panes: 1, colourChoir: false, juicyBurn: false,
      doubleTheatre: false, coda: false,
      barker: "Hold the glass. The ring only fills while you gaze. KEEP when it fills.",
    },
    {
      id: 2, title: "Candle Gallery", kind: "candle",
      waitMs: 5000, breakLimitMs: 1000, allowDouble: false, allowBurn: true,
      lieFlicker: false, falseFull: false, ghostChoices: false, ringDip: false,
      phantomLift: false, phantomText: "", hazyRefusal: false, candle: true,
      twinPane: false, panes: 1, colourChoir: false, juicyBurn: false,
      doubleTheatre: false, coda: false,
      barker: "Candle flicker is theatre — not a break. BURN is unlocked. KEEP or BURN.",
    },
    {
      id: 3, title: "Double Threshold", kind: "doubleOpens",
      waitMs: 6000, breakLimitMs: 900, allowDouble: true, allowBurn: true,
      lieFlicker: false, falseFull: false, ghostChoices: false, ringDip: false,
      phantomLift: false, phantomText: "", hazyRefusal: false, candle: false,
      twinPane: false, panes: 1, colourChoir: false, juicyBurn: false,
      doubleTheatre: false, coda: false,
      barker: "DOUBLE opens. 45% a jump. 55% death.",
    },
    {
      id: 4, title: "Lie Flicker Glass", kind: "lieFlicker",
      waitMs: 7000, breakLimitMs: 800, allowDouble: true, allowBurn: true,
      lieFlicker: true, falseFull: false, ghostChoices: false, ringDip: true,
      phantomLift: false, phantomText: "", hazyRefusal: false, candle: false,
      twinPane: false, panes: 1, colourChoir: false, juicyBurn: false,
      doubleTheatre: false, coda: false,
      barker: "Flash is a liar. Hold through. Release still breaks.",
    },
    {
      id: 5, title: "Twin Pane", kind: "twinPane",
      waitMs: 4500, breakLimitMs: 900, allowDouble: true, allowBurn: true,
      lieFlicker: false, falseFull: false, ghostChoices: false, ringDip: false,
      phantomLift: false, phantomText: "", hazyRefusal: false, candle: false,
      twinPane: true, panes: 2, colourChoir: false, juicyBurn: false,
      doubleTheatre: false, coda: false,
      barker: "Two glasses. Fill pane A, then pane B. Release between still spends the look-away bank.",
    },
    {
      id: 6, title: "Colour Choir", kind: "colourChoir",
      waitMs: 6200, breakLimitMs: 750, allowDouble: true, allowBurn: true,
      lieFlicker: false, falseFull: false, ghostChoices: false, ringDip: false,
      phantomLift: false, phantomText: "", hazyRefusal: false, candle: false,
      twinPane: false, panes: 1, colourChoir: true, juicyBurn: false,
      doubleTheatre: false, coda: false,
      barker: "KEEP a colour that matches the last hues. The choir sings for a set.",
    },
    {
      id: 7, title: "Hazy Refusal", kind: "hazyRefusal",
      waitMs: 6800, breakLimitMs: 720, allowDouble: true, allowBurn: true,
      lieFlicker: false, falseFull: false, ghostChoices: false, ringDip: false,
      phantomLift: false, phantomText: "", hazyRefusal: true, candle: false,
      twinPane: false, panes: 1, colourChoir: false, juicyBurn: false,
      doubleTheatre: false, coda: false,
      barker: "The glass may refuse. Hazy isn’t a skip — KEEP is still legal. DOUBLE is still deadly.",
    },
    {
      id: 8, title: "Burner’s Altar", kind: "burnAltar",
      waitMs: 7400, breakLimitMs: 700, allowDouble: true, allowBurn: true,
      lieFlicker: false, falseFull: false, ghostChoices: false, ringDip: false,
      phantomLift: false, phantomText: "", hazyRefusal: false, candle: true,
      twinPane: false, panes: 1, colourChoir: false, juicyBurn: true,
      doubleTheatre: true, coda: false,
      barker: "BURN shows a juicier ticket, then a longer wait. DOUBLE is 45 / 55 — theatrical on purpose.",
    },
  ];

  let run = null;
  let idleRaf = 0;
  let lastTicket = null;
  let gazePointers = new Set();

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

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function cabinetOn() {
    const node = document.getElementById(CABINET_ID);
    return !!(node && !node.hidden);
  }

  function punchStart() {
    stampDepthCopy();
    setText("catopStatus", DEPTH_COPY.punch);
    const btn = el("catopStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function catoptromancyCodaParams(n) {
    const t = Math.max(1, (n | 0) - AUTHORED_COUNT);
    return {
      id: n,
      title: `Hazy Oracle ${n}`,
      kind: "coda",
      waitMs: Math.min(14000, 8000 + 600 * t),
      breakLimitMs: Math.max(400, 700 - 30 * t),
      allowDouble: true,
      allowBurn: true,
      lieFlicker: true,
      ghostChoices: false,
      ringDip: true,
      falseFull: false,
      phantomLift: false,
      phantomText: "",
      hazyRefusal: true,
      candle: t % 2 === 0,
      twinPane: t % 3 === 0,
      panes: t % 3 === 0 ? 2 : 1,
      colourChoir: true,
      juicyBurn: true,
      doubleTheatre: true,
      coda: true,
      barker: "Hazy refusal. KEEP is still legal. DOUBLE is still deadly.",
    };
  }

  function catoptromancyStageParams(n) {
    const room = Math.max(1, n | 0);
    if (room <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[room - 1]);
    if (!CODA_ENABLED) return null;
    return catoptromancyCodaParams(room);
  }

  function hudLine(spec, room) {
    const n = room != null ? room : (spec && spec.id);
    if (!spec) return "ROOM 0";
    const paneBit = (spec.twinPane || (spec.panes | 0) > 1) && run && run.phase === "gaze"
      ? ` · PANE ${(run.pane | 0) + 1}/${run.panes || spec.panes || 2}`
      : "";
    if (spec.coda) return `ENDLESS · ROOM ${n} · ${spec.title}${paneBit}`;
    return `ROOM ${n} · ${spec.title}${paneBit}`;
  }

  function kindHint(spec) {
    if (!spec) return "HOLD GAZE";
    if (spec.kind === "teach") return "HOLD TO FILL — KEEP ONLY — SKIPPERS LOSE";
    if (spec.kind === "candle") return "CANDLE IS THEATRE — NOT A BREAK";
    if (spec.kind === "doubleOpens") return "DOUBLE IS SWEATY · 45 / 55";
    if (spec.kind === "lieFlicker") return "FLASH BAITS RELEASE — HOLD THROUGH";
    if (spec.kind === "twinPane") return "TWO PANES — FILL A THEN B";
    if (spec.kind === "colourChoir") return "KEEP A MATCHING HUE — CHOIR TEASE";
    if (spec.kind === "hazyRefusal") return "HAZY ISN’T A SKIP — KEEP IS LEGAL";
    if (spec.kind === "burnAltar") return "JUICY BURN · DOUBLE 45 / 55";
    if (spec.coda) return "HAZY ORACLE · KEEP IS STILL LEGAL";
    return "THE WAIT IS THE GAME — DON’T LOOK AWAY";
  }

  function catoptromancyWaitMs(n) {
    const p = catoptromancyStageParams(n);
    return p ? p.waitMs : 8000;
  }

  function catoptromancyBreakLimitMs(n) {
    const p = catoptromancyStageParams(n);
    return p ? p.breakLimitMs : 700;
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function colourById(id) {
    return COLOURS.concat(RARE).find((c) => c.id === id) || COLOURS[0];
  }

  function ticketGen(n, rare) {
    const spec = catoptromancyStageParams(n) || {};
    let colour;
    if (rare) {
      colour = pick(RARE);
    } else if (spec.colourChoir && run && run.bank && run.bank.length) {
      const recent = run.bank.slice(-2);
      if (Math.random() < 0.62) colour = colourById(recent[(Math.random() * recent.length) | 0]);
      else colour = pick(COLOURS);
    } else if (spec.juicyBurn && run && run.waitMul > 1) {
      colour = Math.random() < 0.45 ? pick(RARE) : pick(COLOURS);
    } else {
      colour = pick(COLOURS);
    }
    const pack = rare ? RARE_LINES : (spec.hazyRefusal ? HAZY : LINES);
    lastTicket = {
      colour: colour.id,
      colourName: colour.name,
      hex: colour.hex,
      text: pick(pack),
      rare: !!rare || (spec.juicyBurn && run && run.waitMul > 1 && colour && RARE.some((c) => c.id === colour.id)),
      hazy: !!spec.hazyRefusal && !rare,
      choir: !!spec.colourChoir,
      room: n,
    };
    return lastTicket;
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: catoptromancyStageParams,
      waitMs: catoptromancyWaitMs,
      breakLimitMs: catoptromancyBreakLimitMs,
      allowDoubleFrom: CATOP_ALLOW_DOUBLE_FROM,
      ticketGen,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
      mount: mountOracle,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
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
      deathReason: partial.deathReason || "looked away",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestCatopRooms = Math.max(state.bestCatopRooms || 0, payload.depth);
      state.bestCatopScore = Math.max(state.bestCatopScore || 0, payload.score);
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
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

  function lastDepth() {
    const state = PF.getState() || {};
    const keyed = state.lastRun && state.lastRun[GAME_ID];
    if (keyed && keyed.depth != null) return keyed.depth | 0;
    const last = state.lastRun;
    if (last && (last.game === GAME_ID || last.gameId === GAME_ID)) return last.depth | 0;
    return Math.max(state.bestCatopRooms || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }

  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") {
      return rk().challengeText("Catoptromancy room", depth, GAME_ID);
    }
    return `Beat my Catoptromancy room ${depth} on Penny Fever`;
  }

  function shadowCtx(ctx) {
    /* Kit OracleRooms.tick treats elapsed as wait AND break, so breakLimit < waitMs
     * always finishRun("broke_wait") and steals the coin run. Shadow ctx is unused
     * because we never mount the kit tick — stall-owned createOracleRooms is the engine. */
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

  /**
   * Stall-owned OracleRooms. Kit tick counts elapsed as wait AND break, so
   * breakLimit (1200) < waitMs (4000) always kills. Hold-to-fill lives here.
   * KEEP banks colour + depth++; BURN waitMs*1.25 same depth;
   * DOUBLE 45% depth+2 rare / 55% DEATH; allowDoubleFrom = 3.
   */
  function createOracleRooms(runCtx) {
    const specWire = {
      waitMs: catoptromancyWaitMs,
      breakLimitMs: catoptromancyBreakLimitMs,
      allowDoubleFrom: CATOP_ALLOW_DOUBLE_FROM,
      ticketGen,
      stageParams: catoptromancyStageParams,
    };
    let room = 1;
    let holding = false;
    let seenHold = false;
    let waitFill = 0;
    let breakMs = 0;
    let waitMul = 1;
    let phase = "gaze";
    let ticket = null;
    let flickerArmed = false;
    let flickerAt = -1;
    let flickerT = 0;
    let arriveMs = 0;
    let falseArmed = false;
    let falseAt = -1;
    let falseT = 0;
    let phantomArmed = false;
    let phantomAt = -1;
    let phantomT = 0;
    let pane = 0;
    let panes = 1;

    function params() {
      return catoptromancyStageParams(room);
    }
    function waitNeed() {
      return Math.round(params().waitMs * waitMul);
    }
    function breakLimit() {
      return params().breakLimitMs;
    }

    const api = {
      id: "OracleRooms",
      spec: specWire,
      hold(on) {
        holding = !!on;
        if (on) seenHold = true;
      },
      begin(n, burned) {
        if (n) room = n;
        if (!burned) waitMul = 1;
        waitFill = 0;
        breakMs = 0;
        holding = false;
        seenHold = false;
        arriveMs = 0;
        phase = "gaze";
        ticket = null;
        lastTicket = null;
        const p = params();
        pane = 0;
        panes = Math.max(1, p.panes | 0);
        flickerArmed = !!p.lieFlicker;
        flickerAt = p.lieFlicker ? waitNeed() * (0.42 + Math.random() * 0.22) : -1;
        flickerT = 0;
        falseArmed = !!p.falseFull;
        falseAt = p.falseFull ? waitNeed() * (0.52 + Math.random() * 0.14) : -1;
        falseT = 0;
        phantomArmed = !!p.phantomLift;
        phantomAt = p.phantomLift ? waitNeed() * (0.36 + Math.random() * 0.18) : -1;
        phantomT = 0;
        return { room, title: p.title, pane, panes };
      },
      tick(dt) {
        const d = dt || 16;
        if (flickerT > 0) flickerT = Math.max(0, flickerT - d);
        if (falseT > 0) falseT = Math.max(0, falseT - d);
        if (phantomT > 0) phantomT = Math.max(0, phantomT - d);
        if (phase !== "gaze") {
          return {
            phase, ready: phase === "choose", ticket, waitFill, waitMs: waitNeed(),
            breakMs, flickerT, falseT, phantomT, holding, pane, panes,
          };
        }
        if (holding) {
          waitFill = Math.min(waitNeed(), waitFill + d);
          if (flickerArmed && flickerAt >= 0 && waitFill >= flickerAt) {
            flickerArmed = false;
            flickerT = 220;
          }
          if (falseArmed && falseAt >= 0 && waitFill >= falseAt) {
            falseArmed = false;
            falseT = 1200;
          }
          if (phantomArmed && phantomAt >= 0 && waitFill >= phantomAt) {
            phantomArmed = false;
            phantomT = 1100;
          }
          if (waitFill >= waitNeed()) {
            if (pane + 1 < panes) {
              pane += 1;
              waitFill = 0;
              flickerArmed = !!params().lieFlicker;
              flickerAt = params().lieFlicker ? waitNeed() * (0.42 + Math.random() * 0.22) : -1;
              flickerT = 0;
              return {
                phase: "gaze", ready: false, paneAdvance: true, pane, panes,
                waitFill: 0, waitMs: waitNeed(), breakMs, flickerT, falseT, phantomT, holding,
              };
            }
            phase = "choose";
            holding = false;
            falseT = 0;
            phantomT = 0;
            ticket = ticketGen(room, false);
            return {
              phase, ready: true, ticket, waitFill, waitMs: waitNeed(),
              breakMs, flickerT, falseT: 0, phantomT: 0, holding: false, pane, panes,
            };
          }
        } else if (!seenHold) {
          /* Skippers lose: never-gaze burns breakMs after a short arrive grace. */
          arriveMs += d;
          if (arriveMs >= ARRIVE_GRACE_MS) {
            breakMs += d;
            if (breakMs > breakLimit()) {
              return {
                dead: true,
                reason: "looked away",
                skipper: true,
                room,
                waitFill,
                waitMs: waitNeed(),
                breakMs,
                flickerT,
                falseT,
                phantomT,
              };
            }
          }
        } else {
          /* After first gaze, release burns the look-away budget immediately. */
          breakMs += d;
          if (breakMs > breakLimit()) {
            return {
              dead: true,
              reason: "looked away",
              skipper: false,
              lie: falseT > 0 ? "falseFull" : (phantomT > 0 ? "phantom" : ""),
              room,
              waitFill,
              waitMs: waitNeed(),
              breakMs,
              flickerT,
              falseT,
              phantomT,
            };
          }
        }
        return {
          phase,
          ready: false,
          waitFill,
          waitMs: waitNeed(),
          breakMs,
          flickerT,
          falseT,
          phantomT,
          holding,
          flicker: flickerT > 0,
          falseFull: falseT > 0,
          phantom: phantomT > 0,
        };
      },
      keep() {
        if (phase !== "choose") return { action: "blocked" };
        const kept = ticket;
        phase = "gaze";
        waitMul = 1;
        return { action: "keep", ticket: kept, room, waitMul: 1 };
      },
      burn() {
        if (phase !== "choose") return { action: "blocked" };
        waitMul = (waitMul || 1) * 1.25;
        phase = "gaze";
        return { action: "burn", room, waitMul };
      },
      double() {
        if (phase !== "choose") return { action: "blocked" };
        const p = params();
        if (room < CATOP_ALLOW_DOUBLE_FROM || !p.allowDouble) return { action: "blocked" };
        if (Math.random() >= DOUBLE_OK) {
          return { action: "death", reason: "double" };
        }
        const rare = ticketGen(room, true);
        ticket = rare;
        phase = "gaze";
        waitMul = 1;
        return { action: "double", ticket: rare, room, waitMul: 1 };
      },
      get room() { return room; },
      get ticket() { return ticket; },
      get phase() { return phase; },
      get holding() { return holding; },
      get waitMul() { return waitMul; },
      get waitFill() { return waitFill; },
      get waitMs() { return waitNeed(); },
      get breakMs() { return breakMs; },
      get flickerT() { return flickerT; },
      get falseT() { return falseT; },
      get phantomT() { return phantomT; },
      get pane() { return pane; },
      get panes() { return panes; },
      get params() { return params(); },
      get runCtx() { return runCtx; },
    };
    return api;
  }

  function mountOracle(root, spec, runCtx) {
    return createOracleRooms(runCtx || spec);
  }

  function mountKitOracle(runCtx) {
    /* Never mount PF.runKit.engines.OracleRooms — its tick always-kills.
     * shadowCtx exists so a future kit hold-to-fill cannot steal this coin run. */
    shadowCtx(runCtx);
    return null;
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("catoptromancy")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function card() {
    return el("catopCard");
  }

  function paintHud() {
    const canvas = el("catopCanvas");
    const stage = document.querySelector("#cabinet-catoptromancy .vendor-stage--glass")
      || (canvas && canvas.parentNode);
    if (!stage) return null;
    let hud = stage.querySelector('[data-runkit-hud="catoptromancy"]');
    if (!hud) {
      hud = document.createElement("p");
      hud.className = "depth-hud";
      hud.dataset.runkitHud = "catoptromancy";
      hud.setAttribute("aria-live", "polite");
      stage.appendChild(hud);
    }
    if ((isLive() || (run && run.dying)) && run.spec) {
      hud.textContent = hudLine(run.spec, run.room);
      hud.hidden = false;
    } else {
      hud.textContent = "ROOM 0";
      hud.hidden = true;
    }
    return hud;
  }

  function tellDepth(_n) {
    if (!run) {
      paintHud();
      return;
    }
    const current = run.room | 0;
    const glory = run.depth | 0;
    if (run.kitRun && rk() && typeof rk().reportDepth === "function") {
      try {
        rk().reportDepth(run.kitRun, current, {
          name: run.spec && run.spec.title,
          coda: !!(run.spec && run.spec.coda),
        });
      } catch (_) { /* hud optional */ }
      run.kitRun.depth = glory;
      run.kitRun.score = run.score | 0;
    }
    paintHud();
  }

  function stampDepthCopy() {
    const host = card();
    if (!host) return;
    const canvas = el("catopCanvas");
    if (canvas) {
      const live = isLive();
      canvas.style.pointerEvents = live ? "auto" : "none";
      canvas.style.touchAction = live ? "none" : "";
      canvas.classList.toggle("is-locked", !live);
    }
    paintHud();
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
    if (!isLive()) setText("catopStatus", DEPTH_COPY.status);
  }

  function ghostChoicesOn() {
    return !!(isLive() && run.phase === "gaze" && run.spec && run.spec.ghostChoices && run.falseT > 0);
  }

  function ensureGhostChoices() {
    const stage = document.querySelector("#cabinet-catoptromancy .vendor-stage--glass");
    if (!stage) return null;
    let ghost = stage.querySelector(".catop-ghost-choices");
    if (ghost) return ghost;
    ghost = document.createElement("div");
    ghost.className = "catop-ghost-choices";
    ghost.setAttribute("aria-hidden", "true");
    ghost.innerHTML = "<button type=\"button\" class=\"ticket-button\" tabindex=\"-1\">KEEP?</button><button type=\"button\" class=\"quiet-button\" tabindex=\"-1\">BURN?</button><span class=\"catop-ghost-hint\">not a ticket</span>";
    ghost.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!isLive() || run.phase !== "gaze") return;
      run.lieDeath = "ghostKeep";
      if (run.holding) setHold(false);
      setText("catopStatus", "Ghost KEEP. The wait isn’t done. Come back — the glass noticed.");
    });
    stage.appendChild(ghost);
    return ghost;
  }

  function setPlayChrome() {
    const gazing = !!(isLive() && run.phase === "gaze");
    const choosing = !!(isLive() && run.phase === "choose");
    const gaze = el("catopGaze");
    if (gaze) {
      gaze.hidden = !gazing;
      const phantom = !!(run && run.phantomT > 0);
      const falseFull = !!(run && run.falseT > 0);
      const skipLie = !!(phantom && run.spec && (run.spec.phantomText === "SKIP?" || run.spec.coda));
      gaze.classList.toggle("is-holding", !!(run && run.holding && !phantom));
      gaze.classList.toggle("is-phantom", phantom);
      gaze.classList.toggle("is-lie-skip", skipLie);
      gaze.classList.toggle("is-false-full", falseFull && !phantom);
      const pct = (run && run.waitMs)
        ? Math.floor(kit.clamp(run.waitFill / run.waitMs, 0, 1) * 100)
        : 0;
      const paneN = (run && (run.panes | 0) > 1) ? ` · PANE ${(run.pane | 0) + 1}/${run.panes}` : "";
      gaze.textContent = phantom
        ? ((run.spec && run.spec.phantomText) || "RELEASE?")
        : (falseFull
          ? "RING FULL?"
          : (run && run.holding ? `HOLDING GAZE${paneN} · ${pct}%` : `GAZE · HOLD${paneN}`));
    }
    const choices = el("catopChoices");
    if (choices) choices.hidden = !choosing;
    const burn = el("catopBurn");
    if (burn) {
      const burnOk = !!(run && run.spec && run.spec.allowBurn !== false);
      burn.hidden = choosing ? !burnOk : true;
      burn.disabled = !burnOk;
    }
    const dbl = el("catopDouble");
    if (dbl) {
      const ok = !!(run && run.spec && run.spec.allowDouble && run.room >= CATOP_ALLOW_DOUBLE_FROM);
      dbl.disabled = !ok;
      dbl.hidden = !ok;
      dbl.classList.toggle("is-theatre", !!(run && run.spec && run.spec.doubleTheatre));
      dbl.textContent = (run && run.spec && run.spec.doubleTheatre) ? "DOUBLE · 45 / 55" : "DOUBLE";
    }
    const ticket = el("catopTicket");
    if (ticket) ticket.hidden = !choosing;
    const ghost = ensureGhostChoices();
    if (ghost) {
      const on = ghostChoicesOn();
      ghost.classList.toggle("is-on", on);
      ghost.hidden = !on;
    }
    paintTicket();
    paintHud();
  }

  function paintTicket() {
    const t = run && run.ticket;
    const colour = el("catopTicketColour");
    const line = el("catopTicketLine");
    const ticketNode = el("catopTicket");
    if (ticketNode) ticketNode.classList.toggle("is-hazy", !!(t && t.hazy));
    if (colour) {
      colour.textContent = t ? (t.hazy ? `HAZY · ${t.colourName.toUpperCase()}` : t.colourName.toUpperCase()) : "";
      colour.style.color = t ? t.hex : "";
    }
    if (line) line.textContent = t ? t.text : "";
  }

  function bankColour(ticket) {
    if (!run || !ticket) return 0;
    let bonus = 0;
    const choir = !!(run.spec && run.spec.colourChoir);
    const recent = (run.bank || []).slice(-2);
    const matched = choir && recent.indexOf(ticket.colour) >= 0;
    run.bank.push(ticket.colour);
    run.counts[ticket.colour] = (run.counts[ticket.colour] || 0) + 1;
    if (matched) {
      run.score += CHOIR_MATCH;
      bonus += CHOIR_MATCH;
      kit.sfx("drop");
      setText("catopStatus", "Choir match — the glass sings that colour.");
    }
    if (run.counts[ticket.colour] === 3 && !run.sets[ticket.colour]) {
      run.sets[ticket.colour] = true;
      run.score += SET_BONUS;
      bonus += SET_BONUS;
      kit.sfx("cash");
      setText("catopStatus", AURA.set);
      PF.setAura("celebrate");
    }
    return bonus;
  }

  function paneCenters(spec) {
    if (spec && (spec.twinPane || (spec.panes | 0) > 1)) {
      return [
        { x: CX, y: CY - 88, rx: 78, ry: 72 },
        { x: CX, y: CY + 92, rx: 78, ry: 72 },
      ];
    }
    return [{ x: CX, y: CY, rx: RX, ry: RY }];
  }

  function inGlass(x, y) {
    const spec = run ? run.spec : catoptromancyStageParams(1);
    return paneCenters(spec).some((p) => {
      const dx = (x - p.x) / p.rx;
      const dy = (y - p.y) / p.ry;
      return dx * dx + dy * dy <= 1.08;
    });
  }

  function setHold(on) {
    if (!isLive() || run.phase !== "gaze") return;
    run.holding = !!on;
    if (run.oracle && typeof run.oracle.hold === "function") run.oracle.hold(on);
    setPlayChrome();
    if (on) {
      if (run.falseT > 0) setText("catopStatus", "The ring lied full. Keep holding — the wait isn’t done.");
      else if (run.phantomT > 0) setText("catopStatus", "The button lied RELEASE. Thumb stays.");
      else setText("catopStatus", run.spec.id === 1
        ? "Held. The ring fills only while you gaze."
        : `Room ${run.room} · don’t look away.`);
    } else if (isLive() && run.phase === "gaze") {
      if (run.falseT > 0) setText("catopStatus", "You let go of a fake full. Come back — the glass noticed.");
      else if (run.phantomT > 0) setText("catopStatus", "You believed RELEASE. The wait still counts.");
      else setText("catopStatus", "Gaze broke. The wait still counts — come back before the glass forgets.");
    }
  }

  function drawCandle(ctx, x, y, t) {
    const flick = 0.72 + Math.sin(t / 88) * 0.18 + Math.sin(t / 37 + x) * 0.12;
    ctx.fillStyle = "#3a2418";
    ctx.fillRect(x - 5, y, 10, 38);
    ctx.fillStyle = "#f0d09a";
    ctx.fillRect(x - 6, y - 3, 12, 5);
    ctx.save();
    ctx.translate(x, y - 2);
    ctx.scale(1, flick);
    const flame = ctx.createRadialGradient(0, -14, 1, 0, -10, 16);
    flame.addColorStop(0, "#fff6ec");
    flame.addColorStop(0.45, "#f0d09a");
    flame.addColorStop(1, "rgba(196,30,58,0)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(8, -10, 0, -26);
    ctx.quadraticCurveTo(-8, -10, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  function drawOnePane(ctx, pane, fill, flicker, broken, active) {
    const t = performance.now();
    const pulse = 0.5 + Math.sin(t / 900) * 0.5;
    ctx.fillStyle = "#12080c";
    ctx.beginPath();
    ctx.ellipse(pane.x, pane.y, pane.rx + 16, pane.ry + 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = active ? "#d4a45a" : "#8a6230";
    ctx.lineWidth = active ? 8 : 6;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(pane.x, pane.y, pane.rx + 20, pane.ry + 22, 0, 0, Math.PI * 2);
    ctx.strokeStyle = active ? "#f0d09a" : "#8a6230";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(pane.x, pane.y, pane.rx, pane.ry, 0, 0, Math.PI * 2);
    ctx.clip();
    const glass = ctx.createRadialGradient(pane.x - 22, pane.y - 28, 6, pane.x, pane.y, pane.rx);
    const glow = 0.18 + fill * 0.35 + pulse * 0.08;
    glass.addColorStop(0, `rgba(184,232,224,${0.12 + glow * 0.25})`);
    glass.addColorStop(0.45, `rgba(61,40,90,${0.35 + fill * 0.2})`);
    glass.addColorStop(1, "#07040a");
    ctx.fillStyle = glass;
    ctx.fillRect(pane.x - pane.rx, pane.y - pane.ry, pane.rx * 2, pane.ry * 2);
    ctx.fillStyle = `rgba(240,208,154,${0.06 + fill * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(pane.x - 20, pane.y - 32, 26, 14, -0.4, 0, Math.PI * 2);
    ctx.fill();
    if (flicker > 0 && active) {
      ctx.fillStyle = `rgba(255,246,236,${0.35 + flicker * 0.5})`;
      ctx.fillRect(pane.x - pane.rx, pane.y - pane.ry, pane.rx * 2, pane.ry * 2);
    }
    if (run && run.falseT > 0 && active) {
      const g2 = kit.clamp(run.falseT / 1200, 0, 1);
      ctx.fillStyle = `rgba(126,224,192,${0.12 + g2 * 0.22})`;
      ctx.fillRect(pane.x - pane.rx, pane.y - pane.ry, pane.rx * 2, pane.ry * 2);
    }
    if (broken) {
      ctx.strokeStyle = "rgba(196,30,58,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pane.x - 28, pane.y - 40);
      ctx.lineTo(pane.x + 14, pane.y + 12);
      ctx.lineTo(pane.x - 8, pane.y + 48);
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(pane.x, pane.y, pane.rx + 6, pane.ry + 6, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * kit.clamp(fill, 0, 1));
    ctx.strokeStyle = fill >= 1 ? "#7ee0c0" : "#d4a45a";
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  function drawGlass(ctx, fill, flicker, broken) {
    const t = performance.now();
    const g = ctx.createRadialGradient(CX - 24, CY - 36, 16, CX, CY, 210);
    g.addColorStop(0, "#1a1024");
    g.addColorStop(0.55, "#100814");
    g.addColorStop(1, "#08040a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    kit.fillWood(ctx, 18, 48, W - 36, H - 86);

    const spec = run ? run.spec : catoptromancyStageParams(1);
    const panes = paneCenters(spec);
    const current = (run && run.pane) | 0;
    panes.forEach((pane, i) => {
      let pFill = fill;
      if (panes.length > 1) {
        if (run && run.phase === "choose") pFill = 1;
        else if (i < current) pFill = 1;
        else if (i > current) pFill = 0.06;
      }
      drawOnePane(ctx, pane, pFill, flicker, broken, i === current || panes.length === 1);
    });

    if (spec && spec.candle) {
      drawCandle(ctx, 36, 318, t);
      drawCandle(ctx, W - 36, 318, t + 40);
    }

    ctx.fillStyle = "#f0d09a";
    ctx.font = "11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("AURA CATOPTROMANCY  ·  No. 3", CX, 430);
  }

  function drawChips(ctx, bank) {
    const y = 392;
    const start = CX - ((bank.length - 1) * 14) / 2;
    bank.slice(-10).forEach((id, i) => {
      const c = colourById(id);
      ctx.beginPath();
      ctx.arc(start + i * 14, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = c.hex;
      ctx.fill();
      ctx.strokeStyle = "rgba(18,8,12,0.65)";
      ctx.stroke();
    });
  }

  function draw() {
    const canvas = el("catopCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const spec = run ? run.spec : catoptromancyStageParams(1);
    let fill;
    let flicker = 0;
    if (run && run.waitMs) {
      fill = kit.clamp(run.waitFill / run.waitMs, 0, 1);
    } else if (!run) {
      const cyc = (performance.now() / 5200) % 1;
      if (cyc < 0.62) fill = cyc / 0.62;
      else if (cyc < 0.74) { fill = 1; flicker = 0.55; }
      else if (cyc < 0.86) fill = 1;
      else fill = 0.08;
    } else {
      fill = 0.08;
    }
    if (run && run.falseT > 0) fill = 1;
    if (run && spec.ringDip && run.flickerT > 0 && run.phase === "gaze") {
      fill = Math.max(0.08, fill * (0.18 + (1 - run.flickerT / 220) * 0.2));
    }
    if (run && run.phantomT > 0 && run.phase === "gaze") fill = Math.max(0.12, fill * 0.22);
    if (run) flicker = run.flickerT / 220;
    const broken = !!(run && run.done && (run.deathReason === "looked away" || run.deathReason === "looked_away"));
    drawGlass(ctx, run && run.phase === "choose" ? 1 : fill, flicker, broken);

    if (run && run.bank && run.bank.length) drawChips(ctx, run.bank);

    if (isLive() && run.phase === "gaze") {
      const lim = spec.breakLimitMs;
      const br = kit.clamp(run.breakMs / lim, 0, 1);
      ctx.fillStyle = "rgba(12,6,9,0.7)";
      ctx.fillRect(28, H - 28, W - 56, 10);
      ctx.fillStyle = br > 0.7 ? "#c41e3a" : "#8a6230";
      ctx.fillRect(29, H - 27, (W - 58) * br, 8);
      ctx.strokeStyle = "rgba(212,164,90,0.45)";
      ctx.strokeRect(28.5, H - 27.5, W - 57, 9);
    }

    if (spec.hazyRefusal) {
      paneCenters(spec).forEach((p) => {
        ctx.fillStyle = "rgba(200,212,220,0.14)";
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, run.deathReason === "double" || run.deathReason === "double_fail" ? "DOUBLE" : "AWAY");

    if (isLive() || (run && run.dying)) {
      const hold = run.holding ? "gazing" : "looked away";
      kit.drawHud(ctx, W, [
        `${hudLine(spec, run.room)} · ${run.score}`,
        run.phase === "choose"
          ? (run.spec.hazyRefusal
            ? "Hazy — KEEP is still legal"
            : (run.spec.allowDouble
              ? (run.spec.doubleTheatre ? "Altar — KEEP, BURN, or DOUBLE · 45/55" : "Ticket ready — KEEP, BURN, or DOUBLE")
              : (run.spec.allowBurn === false ? "Ticket ready — KEEP" : "Ticket ready — KEEP or BURN")))
          : (run.falseT > 0
            ? "Ring + ghost KEEP lied — keep holding"
            : (run.phantomT > 0
              ? ((run.spec && run.spec.phantomText) || "RELEASE?") + " is a liar — thumb stays"
              : `${kindHint(spec)} · ${Math.floor((run.waitMs ? kit.clamp(run.waitFill / run.waitMs, 0, 1) : fill) * 100)}% · ${hold}${run.bank && run.bank.length ? " · " + run.bank.length + " hues" : ""}`)),
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
    if (isLive() || (run && run.dying && !run.done)) return;
    stopIdle();
    const loop = () => {
      if (isLive()) return;
      draw();
      idleRaf = requestAnimationFrame(loop);
    };
    idleRaf = requestAnimationFrame(loop);
  }

  function openRoom(n, burned) {
    run.room = n;
    run.spec = catoptromancyStageParams(n);
    if (run.oracle && typeof run.oracle.begin === "function") run.oracle.begin(n, burned);
    if (!burned) run.waitMul = 1;
    else run.waitMul = run.oracle && run.oracle.waitMul != null ? run.oracle.waitMul : (run.waitMul || 1);
    run.waitMs = run.oracle && run.oracle.waitMs != null ? run.oracle.waitMs : Math.round(catoptromancyWaitMs(n) * run.waitMul);
    run.waitFill = 0;
    run.breakMs = 0;
    run.holding = false;
    run.phase = "gaze";
    run.flickerT = 0;
    run.flickerArmed = !!run.spec.lieFlicker;
    run.falseT = 0;
    run.phantomT = 0;
    run.lieDeath = "";
    run.ticket = null;
    run.pane = 0;
    run.panes = Math.max(1, (run.spec && run.spec.panes) | 0);
    lastTicket = null;
    setPlayChrome();
    tellDepth();
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
    const extra = run.waitMul > 1 ? ` Wait is meaner (${run.waitMul.toFixed(2)}×).` : "";
    setText("catopStatus", (run.spec.barker || `Room ${n} · ${run.spec.title}.`) + extra);
    PF.setAura("think");
  }

  function start() {
    if (isLive()) return;
    stopIdle();
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("catopStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      return;
    }
    lastTicket = null;
    gazePointers = new Set();
    run = {
      done: false,
      dying: false,
      deathHold: 0,
      deathNote: "",
      kitRun,
      kitOracle: mountKitOracle(kitRun),
      oracle: mountOracle(el("catopCanvas"), {
        waitMs: catoptromancyWaitMs,
        breakLimitMs: catoptromancyBreakLimitMs,
        allowDoubleFrom: CATOP_ALLOW_DOUBLE_FROM,
        ticketGen,
        stageParams: catoptromancyStageParams,
      }, kitRun),
      room: 1,
      depth: 0,
      score: 0,
      bank: [],
      counts: {},
      sets: {},
      waitMul: 1,
      spec: catoptromancyStageParams(1),
      waitMs: 4000,
      waitFill: 0,
      breakMs: 0,
      holding: false,
      phase: "gaze",
      ticket: null,
      flickerT: 0,
      flickerAt: -1,
      flickerArmed: false,
      falseT: 0,
      phantomT: 0,
      pane: 0,
      panes: 1,
      lieDeath: "",
      deathReason: "",
      closedStamp: false,
      last: 0,
      raf: 0,
    };
    const startBtn = el("catopStart");
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.hidden = true;
    }
    const verdict = el("catopVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("catopResult");
    PF.setTier("catopTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    PF.focusCard("catopCard", true);
    openRoom(1, false);
    tellDepth();
    const loop = (now) => {
      if (!run || run.done) return;
      if (!run.last) run.last = now;
      const dt = Math.min(32, now - run.last);
      run.last = now;
      step(dt);
      draw();
      PF.refreshDepth();
      run.raf = requestAnimationFrame(loop);
    };
    run.raf = requestAnimationFrame(loop);
  }

  function step(dt) {
    if (run && run.dying) {
      run.deathHold = Math.max(0, (run.deathHold || 0) - dt);
      paintHud();
      if (run.deathHold <= 0) sealResult(run.deathNote || "looked away");
      return;
    }
    if (!isLive()) return;
    if (!run.oracle || typeof run.oracle.tick !== "function") return;
    const prevFlicker = run.flickerT;
    const prevFalse = run.falseT;
    const prevPhantom = run.phantomT;
    const r = run.oracle.tick(dt);
    run.waitFill = r.waitFill || 0;
    run.waitMs = r.waitMs || run.waitMs;
    run.breakMs = r.breakMs || 0;
    run.flickerT = r.flickerT || 0;
    run.falseT = r.falseT || 0;
    run.phantomT = r.phantomT || 0;
    run.pane = r.pane != null ? r.pane : (run.oracle.pane | 0);
    run.panes = r.panes != null ? r.panes : (run.oracle.panes || 1);
    run.holding = !!run.oracle.holding;
    if (r.paneAdvance) {
      kit.sfx("flip");
      setText("catopStatus", `Pane ${run.pane} banked. Fill pane ${run.pane + 1} — release still spends the look-away bank.`);
    }
    if (r.dead) {
      run.lieDeath = run.lieDeath || r.lie || "";
      finish(r.skipper ? "skip" : (r.reason || "looked away"));
      return;
    }
    if (run.flickerT > 0 && prevFlicker <= 0) {
      setText("catopStatus", "Lie flicker — hold through. Release still breaks.");
    }
    if (run.falseT > 0 && prevFalse <= 0) {
      setText("catopStatus", run.spec.ghostChoices
        ? "The ring lied full. Ghost KEEP isn’t a ticket. Don’t let go."
        : "The ring lied full. Keep holding — the wait isn’t done.");
    }
    if (run.phantomT > 0 && prevPhantom <= 0) {
      const lie = (run.spec && run.spec.phantomText) || "RELEASE?";
      setText("catopStatus", `The button lied ${lie} Thumb stays.`);
    }
    setPlayChrome();
    if (r.ready && run.phase !== "choose") {
      run.phase = "choose";
      run.holding = false;
      run.ticket = r.ticket || lastTicket || ticketGen(run.room);
      kit.sfx("tray");
      setPlayChrome();
      const hazy = !!(run.spec && run.spec.hazyRefusal);
      const burnOk = !!(run.spec && run.spec.allowBurn !== false);
      setText("catopStatus", hazy
        ? "Hazy refusal. KEEP is still legal. DOUBLE is still deadly."
        : (run.spec.allowDouble
          ? (run.spec.doubleTheatre
            ? "Altar ticket. KEEP, juicy BURN (1.25× wait), or DOUBLE · 45 / 55."
            : "Ticket ready. KEEP the colour, BURN for a reroll, or DOUBLE.")
          : (burnOk
            ? "Ticket ready. KEEP the colour — or BURN and wait longer."
            : "Ticket ready. KEEP the colour.")));
      PF.setAura("point");
    }
    paintHud();
  }

  function doKeep() {
    if (!isLive() || run.phase !== "choose") return;
    const res = run.oracle && typeof run.oracle.keep === "function" ? run.oracle.keep() : { action: "keep", ticket: run.ticket || lastTicket };
    if (res.action === "blocked") return;
    const ticket = res.ticket || run.ticket || lastTicket;
    run.score += KEEP_SCORE;
    const setBonus = bankColour(ticket);
    run.depth += 1;
    run.waitMul = 1;
    if (run.kitRun) run.kitRun.score = run.score;
    kit.sfx("chapter");
    setText("catopStatus", setBonus >= SET_BONUS
      ? AURA.set
      : (setBonus
        ? `Choir match · KEEP ${ticket ? ticket.colourName : "colour"} · Room ${run.depth} banked.`
        : `KEEP ${ticket ? ticket.colourName : "colour"} · Room ${run.depth} banked.`));
    PF.setAura(run.depth >= 4 ? "celebrate" : "point");
    const nextRoom = (run.room | 0) + 1;
    const next = catoptromancyStageParams(nextRoom);
    if (!next) {
      finish("souvenir");
      return;
    }
    openRoom(nextRoom, false);
  }

  function doBurn() {
    if (!isLive() || run.phase !== "choose") return;
    if (run.spec && run.spec.allowBurn === false) return;
    const res = run.oracle && typeof run.oracle.burn === "function" ? run.oracle.burn() : { action: "burn" };
    if (res.action === "blocked") return;
    run.waitMul = res.waitMul != null ? res.waitMul : (run.waitMul || 1) * 1.25;
    kit.sfx("spinner");
    if (run.spec && run.spec.juicyBurn) {
      const preview = ticketGen(run.room, Math.random() < 0.55);
      setText("catopStatus", `BURN preview: ${preview.colourName}. Juicier ticket after 1.25× wait. DOUBLE is 45 / 55.`);
    } else {
      setText("catopStatus", "BURN. Colour tossed. The glass makes you wait longer.");
    }
    PF.setAura("laugh");
    openRoom(run.room, true);
  }

  function doDouble() {
    if (!isLive() || run.phase !== "choose") return;
    if (!run.spec.allowDouble || run.room < CATOP_ALLOW_DOUBLE_FROM) return;
    const res = run.oracle && typeof run.oracle.double === "function"
      ? run.oracle.double()
      : { action: Math.random() >= DOUBLE_OK ? "death" : "double", reason: "double", ticket: ticketGen(run.room, true) };
    if (res.action === "blocked") return;
    if (res.action === "death") {
      finish("double");
      return;
    }
    const rare = res.ticket || ticketGen(run.room, true);
    run.ticket = rare;
    run.score += DOUBLE_SCORE;
    bankColour(rare);
    run.depth += 2;
    run.waitMul = 1;
    if (run.kitRun) run.kitRun.score = run.score;
    kit.sfx("cash");
    const nextRoom = (run.room | 0) + 1;
    setText("catopStatus", `${rare.colourName} rare · glory ${run.depth} · next unique room ${nextRoom}.`);
    PF.setAura("celebrate");
    const next = catoptromancyStageParams(nextRoom);
    if (!next) {
      finish("souvenir");
      return;
    }
    openRoom(nextRoom, false);
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "skip") return AURA.skip;
    if (reason === "double" || reason === "double_fail") {
      if (run && run.spec && run.spec.kind === "burnAltar") return AURA.altar;
      return depth >= 4 ? AURA.doubleDeep : AURA.double;
    }
    if (reason === "looked away" || reason === "looked_away") {
      if (run && run.lieDeath === "ghostKeep") return AURA.ghostKeep;
      if (run && run.lieDeath === "falseFull") return AURA.falseFull;
      if (run && run.lieDeath === "phantom") return AURA.phantom;
      if (run && run.spec && run.spec.kind === "lieFlicker") return AURA.flicker;
      if (run && run.spec && run.spec.kind === "twinPane") return AURA.twin;
      if (run && run.spec && run.spec.kind === "colourChoir") return AURA.choir;
      if (run && run.spec && run.spec.kind === "hazyRefusal") return AURA.hazy;
      if (run && run.spec && run.spec.kind === "burnAltar") return AURA.altar;
      return depth <= 0 ? AURA.lookedShallow : AURA.looked;
    }
    if (depth >= AUTHORED_COUNT) return AURA.coda;
    if (depth >= 6) return AURA.deep(depth);
    if (Object.keys(run && run.sets || {}).length) return AURA.set;
    return AURA.keep;
  }

  function deathReasonOf(reason) {
    if (reason === "leave") return "leave";
    if (reason === "souvenir") return "souvenir";
    if (reason === "double" || reason === "double_fail") return "double";
    return "looked away";
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.holding = false;
    run.phase = "dead";
    run.deathNote = reason === "skip" ? "skip" : (reason === "souvenir" ? "souvenir" : (reason === "double" || reason === "double_fail" ? "double" : "looked away"));
    run.deathReason = deathReasonOf(run.deathNote);
    run.closedStamp = reason !== "souvenir";
    run.deathHold = DEATH_HOLD_MS;
    if (run.oracle && typeof run.oracle.hold === "function") run.oracle.hold(false);
    gazePointers = new Set();
    const ghost = document.querySelector("#cabinet-catoptromancy .catop-ghost-choices");
    if (ghost) {
      ghost.hidden = true;
      ghost.classList.remove("is-on");
    }
    if (run.closedStamp) kit.sfx("stamp");
    setPlayChrome();
    stampDepthCopy();
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    run.holding = false;
    run.phase = "dead";
    run.deathReason = deathReasonOf(reason === "skip" ? "looked away" : reason);
    if (reason === "skip") run.deathReason = "looked away";
    if (run.raf) cancelAnimationFrame(run.raf);
    run.closedStamp = reason !== "leave" && reason !== "souvenir";
    gazePointers = new Set();
    const ghost = document.querySelector("#cabinet-catoptromancy .catop-ghost-choices");
    if (ghost) {
      ghost.hidden = true;
      ghost.classList.remove("is-on");
    }
    const depth = run.depth | 0;
    const score = run.score;
    persistDepth({
      depth,
      score,
      deathReason: run.deathReason,
      cashedOut: reason === "souvenir",
      meta: { room: run.room, bank: (run.bank || []).slice(), lastTicket: run.ticket, kind: run.spec && run.spec.kind },
    });
    stampDepthCopy();
    setPlayChrome();
    const startBtn = el("catopStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.hidden = false;
      startBtn.textContent = "GAZE AGAIN · 1 demo coin";
    }
    PF.focusCard("catopCard", false);
    kit.setMode(card(), "result");
    setPlayChrome();
    const aura = auraLine(reason, depth);
    const challenge = challengeLine(depth);
    const verdict = el("catopVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = reason === "souvenir"
        ? `SOUVENIR · ROOM ${depth} · SCORE ${score}`
        : `ROOM ${depth} · SCORE ${score} · ${aura}`;
    }
    kit.fillResult({
      root: "catopResult",
      depth: "catopResultDepth",
      score: "catopResultScore",
      aura: "catopResultAura",
      copied: "catopCopied",
    }, {
      depthLine: reason === "souvenir" ? `SOUVENIR · ROOM ${depth}` : `ROOM ${depth}`,
      scoreLine: `SCORE ${score} · ${String(run.deathReason).toUpperCase()}`,
      auraLine: aura,
    });
    setText("catopChallengeText", challenge);
    const ok = depth > 0 || reason === "souvenir";
    PF.setTier("catopTier", ok
      ? (depth > AUTHORED_COUNT ? `ENDLESS · ROOM ${depth}` : `ROOM ${depth}`)
      : (run.deathReason === "double" ? "DOUBLE" : "LOOKED AWAY"), ok ? "perfect" : "miss");
    setText("catopStatus", reason === "leave" ? "Stepped off the glass." : (reason === "souvenir" ? "Souvenir — authored glass locked." : "The glass closed."));
    if (ok) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Catoptromancy");
      PF.setAura(depth >= 4 || reason === "souvenir" ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `ROOM ${depth}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Catoptromancy look-away");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, run.deathReason === "double" ? "DOUBLE" : "AWAY", aura);
    }
    PF.refreshNightBoard();
    draw();
    startIdle();
  }

  PF.registerVendor({
    id: "catoptromancy",
    playKey: "catoptromancy",
    chalk: "The wait IS the game. Don’t look away.",
    defaults: { bestCatopRooms: 0, bestCatopScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopIdle();
    },
    onShow() {
      declareP0();
      stampDepthCopy();
      startIdle();
    },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      gazePointers = new Set();
      const verdict = el("catopVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("catopResult");
      const startBtn = el("catopStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.hidden = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      const choices = el("catopChoices");
      if (choices) choices.hidden = true;
      const gaze = el("catopGaze");
      if (gaze) gaze.hidden = true;
      const ticket = el("catopTicket");
      if (ticket) ticket.hidden = true;
      const ghost = document.querySelector("#cabinet-catoptromancy .catop-ghost-choices");
      if (ghost) {
        ghost.hidden = true;
        ghost.classList.remove("is-on");
      }
      kit.setMode(card(), "vestibule");
      stampDepthCopy();
      startIdle();
    },
    refreshDepth(state) {
      const playing = isLive() || !!(run && run.dying);
      setText("depthCatopNow", playing ? `Room ${run.room}` : "Room 0");
      const bestN = Math.max(state.bestCatopRooms || 0, (state.bestDepth && state.bestDepth.catoptromancy) || 0);
      setText("depthCatopBest", bestN ? `Room ${bestN}` : "—");
      setText("depthCatopScore", playing ? String(run.score) : "0");
      setText("depthCatopBestScore", state.bestCatopScore ? String(state.bestCatopScore) : "—");
      const door = el("catopDoorBest");
      if (door) door.textContent = bestN ? `Room ${bestN}` : "Room —";
    },
    bind() {
      declareP0();
      const startBtn = el("catopStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const gaze = el("catopGaze");
      const holdOn = (id) => {
        gazePointers.add(id);
        setHold(true);
      };
      const holdOff = (id) => {
        gazePointers.delete(id);
        if (gazePointers.size === 0) setHold(false);
      };
      const down = (ev) => {
        if (!isLive() || run.phase !== "gaze") {
          if (!isLive()) punchStart();
          return;
        }
        ev.preventDefault();
        try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
        holdOn(ev.pointerId);
      };
      const up = (ev) => {
        holdOff(ev.pointerId);
      };
      if (gaze) {
        gaze.addEventListener("pointerdown", down);
        gaze.addEventListener("pointerup", up);
        gaze.addEventListener("pointercancel", up);
        gaze.addEventListener("lostpointercapture", up);
      }
      const canvas = el("catopCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            punchStart();
            return;
          }
          if (run.phase !== "gaze") return;
          const p = kit.canvasPos(canvas, ev, W, H);
          if (!inGlass(p.x, p.y)) return;
          ev.preventDefault();
          try { canvas.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
          holdOn(ev.pointerId);
        });
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("pointercancel", up);
        canvas.addEventListener("lostpointercapture", up);
        canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());
      }
      const keep = el("catopKeep");
      if (keep) keep.addEventListener("click", doKeep);
      const burn = el("catopBurn");
      if (burn) burn.addEventListener("click", doBurn);
      const dbl = el("catopDouble");
      if (dbl) dbl.addEventListener("click", doDouble);
      window.addEventListener("keydown", (ev) => {
        if (!isLive() || !cabinetOn()) return;
        if (ev.code === "Space" || ev.key === " ") {
          if (run.phase !== "gaze") return;
          ev.preventDefault();
          gazePointers.add("kbd");
          setHold(true);
          return;
        }
        if (run.phase !== "choose") return;
        if (ev.code === "KeyK" || ev.key === "k" || ev.key === "K") {
          ev.preventDefault();
          doKeep();
        } else if (ev.code === "KeyB" || ev.key === "b" || ev.key === "B") {
          ev.preventDefault();
          doBurn();
        } else if (ev.code === "KeyD" || ev.key === "d" || ev.key === "D") {
          ev.preventDefault();
          doDouble();
        }
      });
      window.addEventListener("keyup", (ev) => {
        if (!isLive() || !cabinetOn()) return;
        if (ev.code === "Space" || ev.key === " ") {
          gazePointers.delete("kbd");
          if (gazePointers.size === 0) setHold(false);
        }
      });
      window.addEventListener("blur", () => {
        gazePointers = new Set();
        if (isLive() && run.holding) setHold(false);
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          gazePointers = new Set();
          if (isLive() && run.holding) setHold(false);
        }
      });
      const copyBtn = el("catopChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = lastDepth();
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("catopCopied");
            if (copied) copied.hidden = false;
            setText("catopStatus", "Challenge copied");
          }, () => {
            setText("catopStatus", text);
          });
        });
      }
      stampDepthCopy();
      setPlayChrome();
      startIdle();
    },
  });
})();
