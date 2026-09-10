/* Mutoscope Hood — 3D peep parlor. Desktop Grok owns this file. PF only.
 * Never booth/port 6000. Never Imagine. Custom stillness iris + card drum.
 * Hybrid: 8 authored 3D rooms then ENDLESS. Depth = stages cleared.
 * Play: HOLD STILL to open the iris. CLICK the RED heart, not the gold decoy.
 * Crank only when a room asks. 1 coin = 1 run. Slow-phone lazy THREE boot. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const HERE = (document.currentScript && document.currentScript.src)
    || new URL("vendors/mutoscope.js", location.href).href;
  const THREE_URL = new URL("../world/lib/three.module.min.js", HERE).href;

  const GAME_ID = "mutoscope";
  const CABINET_ID = "cabinet-mutoscope";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const DEATH_HOLD_MS = 760;
  const CARD_SCORE = 40;
  const CLEAR_BONUS = 300;
  const DEPTH_BONUS = 50;
  const REDUCE = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const COARSE = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
  const SAVE_DATA = !!(navigator.connection && navigator.connection.saveData);
  const LOW = !!(SAVE_DATA
    || (navigator.deviceMemory && navigator.deviceMemory <= 2)
    || ((navigator.hardwareConcurrency || 8) <= 4 && COARSE)
    || REDUCE);
  const MAX_DPR = LOW ? 1 : (COARSE ? 1.25 : Math.min(1.5, window.devicePixelRatio || 1));
  const DUST_N = LOW ? 36 : 110;
  const APPROACH_MS = REDUCE || LOW ? 280 : 720;

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Mutoscope Hood",
    depthUnit: "Stage",
    sheet: "GOBLIN_AUTHORED_LEVELS_B03.md",
    stillness: true,
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · HOLD STILL · RED HEART NOT GOLD DECOY · 8 STAGES then ENDLESS",
    body: "Hold still. The iris opens. Click the RED heart — the gold one is a decoy. Fidget slams it. Crank only when a room asks (Parade / Reverse / don’t crank Flicker). Eight rooms then ENDLESS. Depth is stages cleared.",
    status: "Hold still · click the RED heart · gold is a decoy · 1 demo coin",
    machine: "Peep parlor · 1 demo coin · authored STAGES",
    idleHud: ["HOLD STILL — CLICK THE RED HEART, NOT THE GOLD", "START · 1 demo coin — fidget slams the iris"],
    punch: "Depth run — press START. Hold still. Click the red heart.",
  };

  const AUTHORED = [
    {
      id: 1, title: "Peep Lesson", kind: "teach",
      cardsNeeded: 4, cardMs: 900, stillPx: 16, slamLimit: 3, stillWarmupMs: 280,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: false, dualWindow: false, crankRequired: false, crankUnjam: false,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: false, poisonCrank: false,
      hitch: false, twitchWarn: true, warnFirstSlam: true, coda: false, decoyLikeness: 0,
      barker: "HOLD STILL. Click the RED heart. Gold is a decoy.",
    },
    {
      id: 2, title: "Crank Parade", kind: "crankRequired",
      cardsNeeded: 5, cardMs: 800, stillPx: 12, slamLimit: 2, stillWarmupMs: 350,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: false, dualWindow: false, crankRequired: true, crankUnjam: true,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: false, poisonCrank: false,
      hitch: true, twitchWarn: false, warnFirstSlam: false, coda: false, decoyLikeness: 1,
      barker: "HOLD STILL, then CRANK a full turn. Click the RED heart.",
    },
    {
      id: 3, title: "Reverse Flip", kind: "reverseFlip",
      cardsNeeded: 6, cardMs: 700, stillPx: 10, slamLimit: 2, stillWarmupMs: 300,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: true, dualWindow: false, crankRequired: false, crankUnjam: false,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: false, poisonCrank: false,
      hitch: false, twitchWarn: false, warnFirstSlam: false, coda: false, decoyLikeness: 1,
      barker: "HOLD STILL. If it stalls, crank BACKWARD. Red heart, not gold.",
    },
    {
      id: 4, title: "Jump Scare Gallery", kind: "jumpScare",
      cardsNeeded: 7, cardMs: 650, stillPx: 9, slamLimit: 2, stillWarmupMs: 280,
      crankSpeedMul: 0.7, jumpScare: true, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: false, dualWindow: false, crankRequired: false, crankUnjam: false,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: false, poisonCrank: false,
      hitch: false, twitchWarn: false, warnFirstSlam: false, coda: false, decoyLikeness: 2,
      barker: "HOLD STILL. Jack and gold are liars. Click the RED heart.",
    },
    {
      id: 5, title: "Twin Iris", kind: "dualWindow",
      cardsNeeded: 6, cardMs: 880, stillPx: 10, slamLimit: 2, stillWarmupMs: 320,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: false, dualWindow: true, crankRequired: false, crankUnjam: false,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: false, poisonCrank: false,
      hitch: false, twitchWarn: false, warnFirstSlam: false, coda: false, decoyLikeness: 1,
      barker: "HOLD STILL. Two windows. Click BOTH RED hearts.",
    },
    {
      id: 6, title: "Fake Slam Tent", kind: "fakeSlam",
      cardsNeeded: 7, cardMs: 620, stillPx: 9, slamLimit: 2, stillWarmupMs: 260,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: true, fakeSlamCount: 3,
      ghostPip: true,
      reverseFlip: false, dualWindow: false, crankRequired: false, crankUnjam: false,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: false, poisonCrank: false,
      hitch: false, twitchWarn: false, warnFirstSlam: false, coda: false, decoyLikeness: 2,
      barker: "HOLD STILL. Fake slams lie. Click the RED heart, not gold.",
    },
    {
      id: 7, title: "Blink Hood", kind: "blinkHood",
      cardsNeeded: 8, cardMs: 600, stillPx: 8, slamLimit: 2, stillWarmupMs: 250,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: false, dualWindow: false, crankRequired: false, crankUnjam: false,
      blinkHood: true, blinkMs: 400, blinkEveryMs: 2800, stutter: false, poisonCrank: false,
      hitch: false, twitchWarn: false, warnFirstSlam: false, coda: false, decoyLikeness: 2,
      barker: "HOLD STILL through the blink. Click the RED heart while open.",
    },
    {
      id: 8, title: "Flicker Fever", kind: "stutterPoisonCrank",
      cardsNeeded: 8, cardMs: 580, stillPx: 8, slamLimit: 2, stillWarmupMs: 240,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: false, dualWindow: false, crankRequired: false, crankUnjam: false,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: true, poisonCrank: true,
      hitch: false, twitchWarn: false, warnFirstSlam: false, coda: false, decoyLikeness: 2,
      barker: "HOLD STILL. Don’t crank the red flicker. RED heart, not gold.",
    },
  ];

  const AURA = {
    blink: "Aura: You blinked first.",
    leave: "Aura: Eye off the glass. The reel only loves statues.",
    shallow: "Aura: Not a stage. The iris hates a fidget.",
    mid: "Aura: Cute still. Deeper reels get meaner.",
    deep: "Aura: Statue. The reel loves you.",
    hitch: "Aura: The reel stalled on purpose. Crank was the verb.",
    scare: "Aura: You flinched at a flash. Movement still slams.",
    fake: "Aura: That slam was audio. The real fidget was you.",
    twin: "Aura: Two irises. You moved for one of them.",
    blinkHood: "Aura: You fidgeted through a blink. The hood noticed.",
    poison: "Aura: Crank lied. The stutter was poison.",
    reverse: "Aura: Backward reel, same statue law.",
    decoy: "Aura: That’s the gold liar. The RED heart was the click.",
    souvenir: "Aura: Authored reels locked. Souvenir — the iris salutes.",
    coda: "Aura: Authored reels done. ENDLESS peep. Don’t you dare fidget.",
  };

  const SCENES = [
    { title: "Alley Mouth", kind: "tent" },
    { title: "Crescent Canvas", kind: "moon" },
    { title: "The Ringmaster", kind: "barker" },
    { title: "Globe Dancer", kind: "dancer" },
    { title: "Brass Coin Slot", kind: "coin" },
    { title: "Mercury Bead", kind: "mercury" },
    { title: "Gossip Curtain", kind: "curtain" },
    { title: "Star Map", kind: "stars" },
    { title: "Flash Bezel", kind: "flash" },
    { title: "Pressed Penny", kind: "penny" },
    { title: "Door Ajar", kind: "photo", src: "assets/prepared/door-ajar.webp" },
    { title: "Sweet Heat", kind: "photo", src: "assets/prepared/love-thermometer-tease.webp" },
    { title: "Look Up", kind: "photo", src: "assets/prepared/lookup-wonder.webp" },
    { title: "SNAP", kind: "photo", src: "assets/prepared/snap-freeze-flash.webp" },
    { title: "The Reel Itself", kind: "photo", src: "assets/prepared/mutoscope-peephole-glow.webp" },
    { title: "Empty Hood", kind: "void" },
    { title: "An Eye Looks Back", kind: "eye" },
    { title: "Kill Screen 256", kind: "kill" },
    { title: "Jack in the Box", kind: "jack" },
    { title: "Brass Gears", kind: "gears" },
    { title: "Film Fever", kind: "film" },
  ];

  let THREE = null;
  let world = null;
  let worldPromise = null;
  let run = null;
  let loopOn = false;
  let loopRaf = 0;
  let lastNow = 0;
  let ignorePointer = false;
  let starting = false;
  const photoTex = {};

  function rk() { return PF.runKit || null; }
  function el(id) { return $(id); }
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
  function card() { return el("mutoscopeCard"); }
  function stageEl() { return el("mutoscopeStage"); }

  function mutoscopeCodaParams(n) {
    const t = Math.max(1, (n | 0) - AUTHORED_COUNT);
    return {
      id: n,
      title: `Endless Peep ${n}`,
      kind: "coda",
      cardsNeeded: 8 + Math.floor(t / 2),
      cardMs: Math.max(400, 600 - 15 * t),
      stillPx: Math.max(5, 8 - 0.3 * t),
      slamLimit: 2,
      stillWarmupMs: Math.max(180, 250 - 8 * t),
      crankSpeedMul: 0.7,
      jumpScare: true,
      fakeSlamAudio: true,
      fakeSlamCount: 2,
      reverseFlip: t % 2 === 0,
      dualWindow: false,
      crankRequired: false,
      crankUnjam: false,
      blinkHood: t % 3 === 0,
      blinkMs: 400,
      blinkEveryMs: Math.max(1800, 2800 - 80 * t),
      stutter: true,
      poisonCrank: true,
      ghostPip: true,
      ghostCrank: t % 4 === 0,
      hitch: false,
      twitchWarn: false,
      warnFirstSlam: false,
      decoyLikeness: 2,
      coda: true,
      barker: "Authored reels done. ENDLESS. Hold still. RED heart, not gold. Don’t crank the red.",
    };
  }

  function mutoscopeStageParams(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[stage - 1]);
    if (!CODA_ENABLED) return null;
    return mutoscopeCodaParams(stage);
  }

  function hudLine(spec) {
    if (!spec) return "STAGE 0";
    if (spec.coda) return `ENDLESS · STAGE ${spec.id} · ${spec.title}`;
    return `STAGE ${spec.id} · ${spec.title}`;
  }

  function kindHint(spec) {
    if (!spec) return "HOLD STILL";
    if (spec.kind === "teach") return "HOLD STILL — CLICK THE RED HEART, NOT GOLD";
    if (spec.kind === "crankRequired") return "HOLD STILL · CRANK ONCE · RED HEART";
    if (spec.kind === "reverseFlip") return "HOLD STILL · CRANK BACKWARD IF IT STALLS";
    if (spec.kind === "jumpScare") return "RED HEART — NOT JACK, NOT GOLD";
    if (spec.kind === "dualWindow") return "HOLD STILL — BOTH RED HEARTS";
    if (spec.kind === "fakeSlam") return "FAKE SLAMS LIE — RED HEART, NOT GOLD";
    if (spec.kind === "blinkHood") return "HOLD STILL THROUGH THE BLINK — RED HEART";
    if (spec.kind === "stutterPoisonCrank") return "HOLD STILL · DON’T CRANK THE RED FLICKER";
    if (spec.coda) return "ENDLESS · HOLD STILL · RED HEART, NOT GOLD";
    return "HOLD STILL — CLICK THE RED HEART, NOT THE GOLD";
  }

  function pickScene(stage, index) {
    const start = Math.min(SCENES.length - 5, (Math.max(1, stage) - 1) * 3);
    return SCENES[(start + index + SCENES.length) % SCENES.length];
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: mutoscopeStageParams,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
      engine: "Custom",
      stillness: true,
      mount(root, spec, runCtx) {
        return {
          id: "Custom",
          stillness: true,
          stageParams: mutoscopeStageParams,
          authored: AUTHORED,
          codaEnabled: CODA_ENABLED,
          runCtx: runCtx || spec,
        };
      },
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
      deathReason: partial.deathReason || "iris slam",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestMutoscopeStages = Math.max(state.bestMutoscopeStages || 0, payload.depth);
      state.bestMutoscopeCards = Math.max(state.bestMutoscopeCards || 0, ((payload.meta && payload.meta.cards) | 0));
      state.bestMutoscopeScore = Math.max(state.bestMutoscopeScore || 0, payload.score);
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
    return Math.max(state.bestMutoscopeStages || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }

  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") {
      return rk().challengeText("Mutoscope stage", depth, GAME_ID);
    }
    return `Beat my Mutoscope stage ${depth} on Penny Fever`;
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("mutoscope")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function tellDepth() {
    if (!run) { paintHud(); return; }
    const current = (run.spec && run.spec.id) | 0;
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

  function tellStrike(reason) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportStrike !== "function") {
      if (run) run.strikes = (run.strikes | 0) + 1;
      return;
    }
    try { rk().reportStrike(run.kitRun, reason); } catch (_) { /* pips */ }
    run.strikes = run.kitRun.strikes | 0;
  }

  function setEyed(on) {
    const node = stageEl();
    if (node) node.classList.toggle("is-eyed", !!on);
  }
  function setFlash(on) {
    const node = stageEl();
    if (node) node.classList.toggle("is-flash", !!on);
  }
  function setPips(n) {
    const host = document.querySelector('[data-runkit-strikes="mutoscope"]');
    if (!host) return;
    host.querySelectorAll("i").forEach((pip, i) => pip.classList.toggle("on", i < n));
  }
  function paintPipsLimit(limit) {
    const host = document.querySelector('[data-runkit-strikes="mutoscope"]');
    if (!host) return;
    const need = Math.max(2, limit | 0);
    while (host.children.length < need) host.appendChild(document.createElement("i"));
    while (host.children.length > need) host.removeChild(host.lastChild);
    setPips(run ? run.strikes : 0);
  }

  function syncCrank() {
    const crank = el("mutoscopeCrank");
    if (!crank) return;
    const need = !!(isLive() && run.spec && run.spec.crankRequired && (run.hitchLock || run.hitchT > 0));
    const poison = !!(isLive() && run.spec && run.spec.poisonCrank && run.stutterT > 0);
    const live = !!(isLive() && run.irisOpen && !run.slamming && (!run.crankedThisCard || need || poison));
    crank.disabled = !live;
    crank.hidden = !isLive();
    crank.classList.toggle("is-unjam", need && !poison);
    crank.classList.toggle("is-poison", poison);
    crank.textContent = poison ? "CRANK?" : "CRANK";
  }

  function syncShell() {
    const cab = document.getElementById(CABINET_ID);
    const host = card();
    if (!cab || !host) return;
    cab.classList.toggle("is-playing", host.classList.contains("is-playing"));
    cab.classList.toggle("is-result", host.classList.contains("is-result"));
  }

  function paintHint() {
    const node = el("mutoscopeHint");
    if (!node) return;
    node.classList.remove("is-warn", "is-poison", "is-slam");
    if (!run || run.done) {
      node.textContent = "Hold still. Click the RED heart — gold is a decoy.";
      return;
    }
    if (run.dying) {
      node.textContent = run.deathNote === "souvenir" ? "Souvenir. The iris salutes." : "SLAM";
      node.classList.add("is-slam");
      return;
    }
    if (run.approachMs > 0) {
      node.textContent = "Penny in. Lean into the hood…";
      return;
    }
    const spec = run.spec;
    let line = kindHint(spec);
    if (run.irisOpen) {
      if (run.hitchLock || (spec.crankRequired && run.crankAccum < 1.6)) {
        line = "CRANK a full turn — then click the heart";
        node.classList.add("is-warn");
      } else if (run.stutterT > 0) {
        line = spec.poisonCrank ? "RED FLICKER — don’t crank. Click the heart." : "Reel stutter — wait, then click";
        if (spec.poisonCrank) node.classList.add("is-poison");
      } else if (run.blinkMs > 0) {
        line = "Blink — wait for the iris, then click";
        node.classList.add("is-warn");
      } else if (run.fakeMs > 0 || run.fakeStampMs > 0) {
        line = "Fake slam — keep going. Click the heart.";
        node.classList.add("is-warn");
      } else if (run.flashMs > 0) {
        line = "Jack is a liar — click the HEART";
        node.classList.add("is-warn");
      } else {
        line = spec.dualWindow ? "Click BOTH RED hearts — gold is decoy" : "Click the RED heart — gold is a decoy";
      }
    } else if (run.twitchMs > 0) {
      line = "Twitching — hold the statue";
      node.classList.add("is-warn");
    } else {
      line = `Hold still · ${Math.max(0, spec.stillWarmupMs - (run.stillMs || 0)) | 0}ms · then the RED heart`;
    }
    node.textContent = line;
  }

  function paintHud() {
    const stage = stageEl();
    if (!stage) return null;
    let hud = stage.querySelector('[data-runkit-hud="mutoscope"]');
    if (!hud) {
      hud = document.createElement("p");
      hud.className = "depth-hud";
      hud.dataset.runkitHud = "mutoscope";
      hud.setAttribute("aria-live", "polite");
      const wrap = stage.querySelector(".muto-hud");
      if (wrap) wrap.appendChild(hud);
      else stage.appendChild(hud);
    }
    if ((isLive() || (run && run.dying)) && run.spec) {
      hud.textContent = hudLine(run.spec);
      hud.hidden = false;
    } else {
      hud.textContent = "STAGE 0";
      hud.hidden = true;
    }
    syncCrank();
    paintHint();
    syncShell();
    return hud;
  }

  function stampDepthCopy() {
    const host = card();
    if (!host) return;
    const num = host.querySelector(".machine-number");
    if (num) num.textContent = DEPTH_COPY.machine;
    host.querySelectorAll("[data-pf-depth-tag]").forEach((p) => { p.textContent = DEPTH_COPY.tag; });
    host.querySelectorAll("[data-pf-depth-copy]").forEach((p) => { p.textContent = DEPTH_COPY.body; });
    const canvas = el("mutoscopeCanvas");
    if (canvas) {
      const live = isLive();
      canvas.style.pointerEvents = "auto";
      canvas.style.touchAction = live ? "none" : "";
      canvas.classList.toggle("is-locked", !live);
    }
    const barker = host.querySelector(".barker-call");
    if (barker && run && run.spec && isLive()) barker.textContent = run.spec.barker || DEPTH_COPY.idleHud[0];
    else if (barker && !isLive()) barker.textContent = DEPTH_COPY.idleHud[0];
    syncCrank();
    paintHud();
    if (!isLive()) setText("mutoscopeStatus", DEPTH_COPY.status);
  }

  function punchStart() {
    stampDepthCopy();
    setText("mutoscopeStatus", DEPTH_COPY.punch);
    const btn = el("mutoscopeStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  /* ——— Three.js parlor ——— */
  function canvasTex(w, h, draw, repeatX, repeatY) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX || 1, repeatY || 1);
    t.anisotropy = 2;
    t.needsUpdate = true;
    return t;
  }

  function woodTex(tint) {
    return canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 18; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${0.04 + (i % 3) * 0.03})`;
        ctx.fillRect(i * 14 + 4, 0, 3, 256);
      }
      ctx.strokeStyle = "rgba(20,8,6,0.28)";
      ctx.lineWidth = 1.2;
      for (let y = 8; y < 256; y += 17) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(80, y + 6, 160, y - 5, 256, y + 3);
        ctx.stroke();
      }
    }, 3, 3);
  }

  function velvetTex() {
    return canvasTex(128, 128, (ctx) => {
      ctx.fillStyle = "#4a1422";
      ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 40; i += 1) {
        ctx.fillStyle = `rgba(20,4,8,${0.08 + (i % 4) * 0.04})`;
        ctx.fillRect((i * 17) % 128, 0, 2, 128);
      }
    }, 2, 2);
  }

  function stripeTex() {
    return canvasTex(128, 128, (ctx) => {
      for (let i = 0; i < 8; i += 1) {
        ctx.fillStyle = i % 2 ? "#c41e3a" : "#f0d09a";
        ctx.fillRect(i * 16, 0, 16, 128);
      }
    }, 2, 1);
  }

  function ensureWorld() {
    if (world) return Promise.resolve(world);
    if (worldPromise) return worldPromise;
    const t0 = performance.now();
    setText("mutoscopeStatus", "Warming the peep lamp…");
    worldPromise = import(THREE_URL).then((mod) => {
      THREE = mod;
      world = buildWorld();
      resize();
      const ms = Math.round(performance.now() - t0);
      if (!isLive()) setText("mutoscopeStatus", DEPTH_COPY.status + (LOW ? " · light lamp" : "") + " · " + ms + "ms");
      return world;
    }).catch((err) => {
      console.warn("mutoscope three", err);
      const fail = el("mutoscopeGlFail");
      if (fail) {
        fail.hidden = false;
        fail.textContent = "This parlor wants WebGL. " + ((err && err.message) || "The iris is waiting.");
      }
      setText("mutoscopeStatus", "This parlor wants WebGL.");
      worldPromise = null;
      throw err;
    });
    return worldPromise;
  }

  function buildWorld() {
    const canvas = el("mutoscopeCanvas");
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !LOW && (window.devicePixelRatio || 1) < 1.5,
      powerPreference: LOW ? "low-power" : "default",
      alpha: false,
      failIfMajorPerformanceCaveat: false,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.setClearColor(0x12080c, 1);
    renderer.setPixelRatio(MAX_DPR);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x14080c, 0.028);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.08, 40);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    camera.position.set(-0.85, 1.72, 5.6);

    const geo = {
      box: new THREE.BoxGeometry(1, 1, 1),
      sphere: new THREE.SphereGeometry(1, LOW ? 10 : 14, LOW ? 8 : 12),
      cyl: new THREE.CylinderGeometry(1, 1, 1, LOW ? 10 : 16),
      cone: new THREE.ConeGeometry(1, 1, 10),
      torus: new THREE.TorusGeometry(1, 0.16, 8, 20),
      plane: new THREE.PlaneGeometry(1, 1),
    };

    function mat(color, extra) {
      const e = extra || {};
      const shiny = (e.metalness || 0) > 0.4;
      const opts = {
        color,
        shininess: shiny ? 72 : 18,
        specular: shiny ? 0xaa8866 : 0x2a1810,
      };
      if (e.map) opts.map = e.map;
      if (e.emissive != null) opts.emissive = e.emissive;
      if (e.emissiveIntensity != null) opts.emissiveIntensity = e.emissiveIntensity;
      if (e.transparent) opts.transparent = true;
      if (e.opacity != null) opts.opacity = e.opacity;
      if (e.side) opts.side = e.side;
      return new THREE.MeshPhongMaterial(opts);
    }
    function box(m, w, h, d, x, y, z) {
      const mesh = new THREE.Mesh(geo.box, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x || 0, y || 0, z || 0);
      return mesh;
    }
    function sphere(m, r, x, y, z) {
      const mesh = new THREE.Mesh(geo.sphere, m);
      mesh.scale.setScalar(r);
      mesh.position.set(x || 0, y || 0, z || 0);
      return mesh;
    }
    function cyl(m, r, h, x, y, z) {
      const mesh = new THREE.Mesh(geo.cyl, m);
      mesh.scale.set(r, h, r);
      mesh.position.set(x || 0, y || 0, z || 0);
      return mesh;
    }

    const wood = mat(0x3a2418, { map: woodTex("#4a2a1c"), roughness: 0.82 });
    const woodDark = mat(0x1a100c, { map: woodTex("#241410"), roughness: 0.86 });
    const brass = mat(GOLD, { metalness: 0.78, roughness: 0.28, emissive: 0x3a2808, emissiveIntensity: 0.18 });
    const leather = mat(0x2a1410, { roughness: 0.9 });
    const velvet = mat(0x4a1422, { map: velvetTex(), roughness: 0.88 });
    const black = mat(0x0a0508, { roughness: 0.55, metalness: 0.2 });

    scene.add(new THREE.AmbientLight(0x4a3024, 0.52));
    scene.add(new THREE.HemisphereLight(0xffc090, 0x1a080c, 0.62));
    const key = new THREE.DirectionalLight(0xffd0a0, 0.72);
    key.position.set(2.4, 4.2, 3.2);
    scene.add(key);
    if (!LOW) {
      const fill = new THREE.DirectionalLight(0xffb070, 0.32);
      fill.position.set(-2.2, 2.4, 4.0);
      scene.add(fill);
    }

    const parlor = new THREE.Group();
    scene.add(parlor);
    parlor.add(box(wood, 12, 0.12, 10, 0, -0.06, 0.4));
    parlor.add(box(velvet, 12, 3.8, 0.16, 0, 1.9, -4.4));
    parlor.add(box(woodDark, 0.16, 3.8, 10, -5.9, 1.9, 0.2));
    parlor.add(box(woodDark, 0.16, 3.8, 10, 5.9, 1.9, 0.2));
    parlor.add(box(woodDark, 12, 0.16, 10, 0, 3.85, 0.2));
    const carpet = box(mat(0x5a1a28, { roughness: 0.95 }), 4.2, 0.03, 3.4, 0, 0.02, 1.1);
    parlor.add(carpet);
    [-1, 1].forEach((side) => {
      const drape = box(velvet, 1.6, 3.2, 0.12, side * 2.4, 1.7, -4.2);
      drape.rotation.y = side * -0.12;
      parlor.add(drape);
    });
    const beams = [-3, 0, 3];
    beams.forEach((x) => parlor.add(box(wood, 0.18, 0.18, 9.4, x, 3.7, 0.1)));

    const lamps = [];
    function makeLamp(x, z) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.add(cyl(brass, 0.06, 1.7, 0, 0.85, 0));
      const shade = new THREE.Mesh(geo.cone, mat(0xd4a45a, { emissive: 0xffc070, emissiveIntensity: 0.45, roughness: 0.5 }));
      shade.scale.set(0.28, 0.32, 0.28);
      shade.position.y = 1.78;
      shade.rotation.x = Math.PI;
      g.add(shade);
      const bulb = sphere(mat(0xffe6a6, { emissive: 0xffcc88, emissiveIntensity: 0.9 }), 0.07, 0, 1.62, 0);
      g.add(bulb);
      const light = new THREE.PointLight(0xffc090, 1.45, 6.8, 1.5);
      light.position.set(0, 1.6, 0);
      g.add(light);
      parlor.add(g);
      lamps.push(light);
    }
    makeLamp(-2.6, 1.6);
    if (!LOW) {
      makeLamp(2.6, 1.8);
      makeLamp(-1.8, -2.4);
    }

    const loader = new THREE.TextureLoader();
    const posterTex = loader.load("assets/prepared/mutoscope-peephole-glow.webp");
    posterTex.colorSpace = THREE.SRGBColorSpace;
    const poster = new THREE.Mesh(geo.plane, new THREE.MeshBasicMaterial({ map: posterTex }));
    poster.scale.set(1.35, 1.7, 1);
    poster.position.set(-3.4, 1.7, -4.22);
    parlor.add(poster);
    parlor.add(box(brass, 1.42, 1.78, 0.04, -3.4, 1.7, -4.28));

    const stool = new THREE.Group();
    stool.position.set(-1.55, 0, 1.7);
    stool.add(cyl(woodDark, 0.22, 0.06, 0, 0.48, 0));
    stool.add(cyl(brass, 0.03, 0.48, 0.14, 0.24, 0.14));
    stool.add(cyl(brass, 0.03, 0.48, -0.14, 0.24, 0.14));
    stool.add(cyl(brass, 0.03, 0.48, 0.14, 0.24, -0.14));
    stool.add(cyl(brass, 0.03, 0.48, -0.14, 0.24, -0.14));
    parlor.add(stool);

    const machine = new THREE.Group();
    machine.position.set(0, 0, 0.15);
    scene.add(machine);
    machine.add(box(woodDark, 1.15, 0.28, 0.95, 0, 0.14, 0));
    machine.add(box(wood, 0.98, 1.18, 0.78, 0, 0.88, -0.04));
    machine.add(box(brass, 1.02, 0.04, 0.82, 0, 1.48, -0.04));
    machine.add(box(brass, 1.02, 0.04, 0.82, 0, 0.3, -0.04));
    [[-0.46, 0.3], [0.46, 0.3], [-0.46, -0.38], [0.46, -0.38]].forEach(([x, z]) => {
      machine.add(cyl(brass, 0.035, 1.18, x, 0.88, z));
    });
    const plate = box(brass, 0.72, 0.16, 0.03, 0, 0.52, 0.38);
    machine.add(plate);

    const drum = new THREE.Group();
    drum.position.set(0, 1.54, -0.12);
    const drumShell = new THREE.Mesh(geo.cyl, mat(0x1a0c10, { metalness: 0.35, roughness: 0.4 }));
    drumShell.scale.set(0.46, 0.58, 0.46);
    drumShell.rotation.z = Math.PI / 2;
    drum.add(drumShell);
    for (let i = 0; i < 10; i += 1) {
      const rib = box(brass, 0.58, 0.018, 0.03, 0, 0, 0);
      rib.rotation.x = (i / 10) * Math.PI * 2;
      rib.position.z = Math.cos(rib.rotation.x) * 0.46;
      rib.position.y = Math.sin(rib.rotation.x) * 0.46;
      drum.add(rib);
    }
    machine.add(drum);

    const hood = new THREE.Group();
    hood.position.set(0, 1.54, 0.46);
    const hoodCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.38, 0.42, 16, 1, true),
      leather
    );
    hoodCone.rotation.x = Math.PI / 2;
    hoodCone.position.z = 0.16;
    hood.add(hoodCone);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.045, 8, 22), leather);
    lip.position.z = 0.36;
    hood.add(lip);
    const brassRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.03, 8, 22), brass);
    brassRing.position.z = 0.02;
    hood.add(brassRing);
    machine.add(hood);

    function makeIris(radius) {
      const g = new THREE.Group();
      const blades = [];
      const matA = mat(0x160a0e, { metalness: 0.4, roughness: 0.38 });
      const matB = mat(0x241014, { metalness: 0.4, roughness: 0.38 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.028, 8, 24), brass);
      g.add(ring);
      for (let i = 0; i < 6; i += 1) {
        const pivot = new THREE.Group();
        const blade = box(i % 2 ? matA : matB, radius * 0.92, radius * 0.36, 0.012, radius * 0.34, 0, 0);
        pivot.add(blade);
        g.add(pivot);
        blades.push(pivot);
      }
      g.userData.blades = blades;
      g.userData.radius = radius;
      return g;
    }
    const irisMain = makeIris(0.24);
    irisMain.position.set(0, 1.54, 0.42);
    machine.add(irisMain);
    const irisA = makeIris(0.15);
    irisA.position.set(0, 1.72, 0.42);
    const irisB = makeIris(0.15);
    irisB.position.set(0, 1.36, 0.42);
    irisA.visible = false;
    irisB.visible = false;
    machine.add(irisA);
    machine.add(irisB);

    const crank = new THREE.Group();
    crank.position.set(0.58, 1.12, 0.22);
    crank.add(cyl(brass, 0.035, 0.08, 0, 0, 0));
    const arm = box(brass, 0.06, 0.28, 0.06, 0, 0.16, 0);
    crank.add(arm);
    const knob = sphere(mat(GOLD, { metalness: 0.7, roughness: 0.25 }), 0.055, 0, 0.32, 0);
    crank.add(knob);
    crank.userData.knob = knob;
    machine.add(crank);

    const ghostCrank = crank.clone();
    ghostCrank.position.set(0.58, 1.12, 0.22);
    ghostCrank.visible = false;
    ghostCrank.traverse((n) => {
      if (n.isMesh) n.material = mat(0xf0d09a, { emissive: 0xf0d09a, emissiveIntensity: 0.7, transparent: true, opacity: 0.7 });
    });
    machine.add(ghostCrank);

    const coinSlot = box(black, 0.18, 0.04, 0.05, 0, 0.7, 0.38);
    machine.add(coinSlot);
    const coin = cyl(brass, 0.07, 0.012, 0, 1.35, 0.55);
    coin.rotation.x = Math.PI / 2;
    coin.visible = false;
    machine.add(coin);

    const reelLight = new THREE.PointLight(0xffe0b0, 0.2, 2.4, 1.4);
    reelLight.position.set(0, 1.54, -0.05);
    machine.add(reelLight);
    const flashLight = new THREE.PointLight(0xfff6ec, 0, 3.5, 1.2);
    flashLight.position.set(0, 1.54, 0.2);
    machine.add(flashLight);

    const theater = new THREE.Group();
    theater.position.set(0, 1.54, -0.22);
    machine.add(theater);
    const tableau = new THREE.Group();
    theater.add(tableau);
    const tableauB = new THREE.Group();
    tableauB.position.y = -0.34;
    tableauB.visible = false;
    theater.add(tableauB);

    const stamp = box(mat(0xc41e3a, { emissive: 0xc41e3a, emissiveIntensity: 0.4 }), 0.55, 0.22, 0.04, 0, 1.54, 0.55);
    stamp.rotation.z = -0.18;
    stamp.visible = false;
    scene.add(stamp);

    function makeAura(scale) {
      const g = new THREE.Group();
      g.scale.setScalar(scale || 1);
      const skin = mat(SKIN, { roughness: 0.55, emissive: 0x3a2018, emissiveIntensity: 0.1 });
      const dress = mat(DRESS, { roughness: 0.55, emissive: 0x0a2010, emissiveIntensity: 0.22 });
      const blouse = mat(BLOUSE, { roughness: 0.6 });
      const hairM = mat(HAIR, { roughness: 0.7, emissive: 0x1a0c08, emissiveIntensity: 0.12 });
      const gold = mat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.5 });
      const heart = mat(HEART, { emissive: HEART, emissiveIntensity: 0.55, roughness: 0.4 });
      const shoe = mat(0x111111, { roughness: 0.35, metalness: 0.25 });
      const hip = new THREE.Group();
      hip.position.y = 0.42;
      g.add(hip);
      hip.add(cyl(blouse, 0.13, 0.28, 0, 0.28, 0));
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.12, 0.34, 12), dress);
      skirt.position.y = 0.06;
      hip.add(skirt);
      const heartGem = box(heart, 0.09, 0.09, 0.04, 0, 0.22, 0.16);
      heartGem.rotation.z = Math.PI / 4;
      hip.add(heartGem);
      const head = new THREE.Group();
      head.position.y = 0.62;
      hip.add(head);
      head.add(sphere(skin, 0.18, 0, 0.02, 0));
      const eyeW = mat(0xf7f2ea);
      const eyeD = mat(0x2a1810);
      [-1, 1].forEach((side) => {
        const white = sphere(eyeW, 0.038, side * 0.055, 0.03, 0.15);
        white.scale.set(0.038, 0.044, 0.02);
        head.add(white);
        head.add(sphere(eyeD, 0.02, side * 0.055, 0.03, 0.168));
      });
      head.add(sphere(hairM, 0.2, 0, 0.06, -0.03));
      [-1, 1].forEach((side) => {
        head.add(sphere(hairM, 0.1, side * 0.2, -0.04, 0.04));
        head.add(sphere(heart, 0.042, side * 0.2, 0.06, 0.06));
      });
      const crown = new THREE.Group();
      crown.position.y = 0.22;
      head.add(crown);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold);
      crown.add(band);
      [-0.09, 0, 0.09].forEach((x, i) => {
        const h = i === 1 ? 0.14 : 0.09;
        const spike = new THREE.Mesh(geo.cone, gold);
        spike.scale.set(0.035, h, 0.035);
        spike.position.set(x, h * 0.45, 0);
        crown.add(spike);
      });
      const gem = box(heart, 0.055, 0.055, 0.025, 0, 0.02, 0.11);
      gem.rotation.z = Math.PI / 4;
      crown.add(gem);
      function limb(side, arm) {
        const pivot = new THREE.Group();
        pivot.position.set(side * (arm ? 0.16 : 0.08), arm ? 0.36 : 0.0, 0);
        const len = arm ? 0.28 : 0.34;
        const bone = cyl(arm ? skin : dress, arm ? 0.035 : 0.042, len, 0, -len / 2, 0);
        pivot.add(bone);
        if (arm) pivot.add(sphere(skin, 0.04, 0, -len, 0));
        else pivot.add(box(shoe, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03));
        hip.add(pivot);
        return pivot;
      }
      const armL = limb(-1, true);
      const armR = limb(1, true);
      limb(-1, false);
      limb(1, false);
      g.userData = { hip, head, armL, armR, t: 0 };
      return g;
    }

    const aura = makeAura(1.05);
    aura.position.set(1.78, 0, 1.28);
    aura.rotation.y = -0.55;
    scene.add(aura);

    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(DUST_N * 3);
    for (let i = 0; i < DUST_N; i += 1) {
      dustPos[i * 3] = (Math.random() - 0.5) * 8;
      dustPos[i * 3 + 1] = Math.random() * 3.4;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: 0xf0d09a,
      size: 0.02,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }));
    scene.add(dust);

    knob.userData.pick = "crank";
    crank.userData.pick = "crank";
    arm.userData.pick = "crank";
    ghostCrank.userData.pick = "ghost";

    const w = {
      THREE, scene, camera, renderer, geo, mat, box, sphere, cyl,
      parlor, machine, drum, hood, crank, ghostCrank, coin, coinSlot,
      irisMain, irisA, irisB, tableau, tableauB, theater, stamp,
      aura, dust, dustPos, lamps, reelLight, flashLight, posterTex,
      makeAura,
      camMode: "parlor",
      approachT: 0,
      shake: 0,
      crankSpin: 0,
      drumRot: 0,
      drumTarget: 0,
      flipMid: true,
      lastSceneKey: "",
      ray: new THREE.Raycaster(),
      pickables: [crank, ghostCrank, hood, coinSlot],
      tmp: new THREE.Vector3(),
      look: new THREE.Vector3(),
    };
    fillTableau(w, w.tableau, SCENES[0], mutoscopeStageParams(1));
    return w;
  }

  function clearGroup(g) {
    while (g.children.length) g.remove(g.children[0]);
  }

  function paperMatFor(spec) {
    const deep = spec && spec.id ? Math.min(1, (spec.id - 1) / 7) : 0;
    const r = (230 - deep * 50) / 255;
    const g = (211 - deep * 80) / 255;
    const b = (174 - deep * 90) / 255;
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(r, g, b),
      roughness: 0.9,
    });
  }

  function fillTableau(w, root, scene, spec) {
    if (!w || !root || !scene) return;
    const key = `${scene.title}|${scene.kind}|${spec && spec.id}|${root === w.tableauB ? "b" : "a"}`;
    if (w.lastSceneKey === key && root.children.length) return;
    if (root === w.tableau) w.lastSceneKey = key;
    clearGroup(root);
    const { box, sphere, cyl, mat, geo } = w;
    const paper = new THREE.Mesh(geo.plane, paperMatFor(spec));
    paper.scale.set(0.72, 0.9, 1);
    paper.position.z = -0.12;
    root.add(paper);
    const frame = box(mat(0x5a3a24, { metalness: 0.2 }), 0.76, 0.94, 0.03, 0, 0, -0.13);
    root.add(frame);

    const kind = scene.kind;
    if (kind === "photo" && scene.src) {
      let tex = photoTex[scene.src];
      if (!tex) {
        tex = new THREE.TextureLoader().load(scene.src);
        tex.colorSpace = THREE.SRGBColorSpace;
        photoTex[scene.src] = tex;
      }
      const pic = new THREE.Mesh(geo.plane, new THREE.MeshBasicMaterial({ map: tex }));
      pic.scale.set(0.58, 0.72, 1);
      pic.position.z = 0.02;
      root.add(pic);
    } else if (kind === "moon") {
      paper.material = mat(0x1a2238);
      root.add(sphere(mat(0xf0d09a, { emissive: 0xf0d09a, emissiveIntensity: 0.25 }), 0.14, 0.08, 0.16, 0.08));
      root.add(sphere(mat(0x1a2238), 0.12, 0.14, 0.18, 0.12));
    } else if (kind === "barker") {
      paper.material = mat(0x2a1420);
      root.add(box(mat(0x1a0c10), 0.16, 0.38, 0.12, 0, -0.04, 0.08));
      root.add(sphere(mat(SKIN), 0.1, 0, 0.22, 0.1));
      root.add(cyl(mat(0x12080c), 0.12, 0.06, 0, 0.32, 0.1));
    } else if (kind === "dancer") {
      paper.material = mat(0x241428);
      const mini = w.makeAura(0.42);
      mini.position.set(0, -0.28, 0.08);
      root.add(mini);
      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 12),
        mat(0xd4a45a, { transparent: true, opacity: 0.22, metalness: 0.3, roughness: 0.2 })
      );
      globe.position.set(0, 0.02, 0.06);
      root.add(globe);
    } else if (kind === "coin" || kind === "penny") {
      paper.material = mat(0x2a1810);
      const p = cyl(mat(GOLD, { metalness: 0.7, roughness: 0.3, emissive: 0x5a3a08, emissiveIntensity: 0.2 }), 0.22, 0.03, 0, 0.02, 0.08);
      p.rotation.x = Math.PI / 2;
      root.add(p);
    } else if (kind === "mercury") {
      paper.material = mat(0x12080c);
      root.add(box(mat(0x3a2418), 0.08, 0.55, 0.08, 0, 0.02, 0.06));
      root.add(box(mat(0xc41e3a, { emissive: 0xc41e3a, emissiveIntensity: 0.4 }), 0.05, 0.28, 0.05, 0, -0.08, 0.08));
      root.add(sphere(mat(0xc41e3a, { emissive: 0xc41e3a, emissiveIntensity: 0.5 }), 0.07, 0, -0.24, 0.08));
    } else if (kind === "curtain" || kind === "fakeSlam") {
      paper.material = mat(0x3a1020);
      for (let i = -2; i <= 2; i += 1) {
        const c = box(mat(0xc41e3a), 0.12, 0.82, 0.04, i * 0.13, 0, 0.06);
        c.rotation.z = i * 0.04;
        root.add(c);
      }
    } else if (kind === "stars") {
      paper.material = mat(0x0a1020);
      for (let i = 0; i < 12; i += 1) {
        const s = sphere(mat(0xf0d09a, { emissive: 0xf0d09a, emissiveIntensity: 0.5 }), 0.012 + (i % 3) * 0.006, ((i * 47) % 70) / 100 - 0.32, ((i * 29) % 80) / 100 - 0.3, 0.08);
        root.add(s);
      }
    } else if (kind === "flash") {
      paper.material = mat(0xfff6ec);
      root.add(sphere(mat(0x12080c), 0.16, 0, 0.04, 0.08));
      root.add(sphere(mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.8 }), 0.07, 0, 0.04, 0.16));
    } else if (kind === "void") {
      paper.material = mat(0x050308);
      root.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 8, 20), mat(GOLD, { metalness: 0.6 })));
    } else if (kind === "eye" || kind === "blinkHood") {
      paper.material = mat(0x12080c);
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat(0xf0d09a));
      white.scale.set(1.15, 0.62, 0.55);
      white.position.z = 0.06;
      root.add(white);
      root.add(sphere(mat(0x3d8a8a, { emissive: 0x1a4040, emissiveIntensity: 0.3 }), 0.09, 0, 0, 0.16));
      root.add(sphere(mat(0x0a0508), 0.04, 0, 0, 0.22));
    } else if (kind === "kill") {
      paper.material = mat(0x1a0508);
      root.add(box(mat(0xc41e3a, { emissive: 0xc41e3a, emissiveIntensity: 0.45 }), 0.42, 0.18, 0.05, 0, 0.04, 0.08));
    } else if (kind === "jack" || kind === "jumpScare") {
      paper.material = mat(0x2a1020);
      root.add(box(mat(0xc41e3a), 0.22, 0.16, 0.22, 0, -0.22, 0.08));
      const head = sphere(mat(0xf0d09a), 0.1, 0, 0.08, 0.12);
      head.userData.jack = true;
      root.add(head);
      root.add(cyl(mat(0xd4a45a), 0.03, 0.22, 0, -0.08, 0.1));
    } else if (kind === "gears" || kind === "crankRequired") {
      paper.material = mat(0x2a1810);
      const g1 = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 16), mat(GOLD, { metalness: 0.7 }));
      g1.position.set(-0.1, 0.06, 0.1);
      const g2 = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 14), mat(GOLD, { metalness: 0.7 }));
      g2.position.set(0.16, -0.08, 0.1);
      g1.userData.spin = 0.8;
      g2.userData.spin = -1.1;
      root.add(g1);
      root.add(g2);
    } else if (kind === "film" || kind === "stutterPoisonCrank") {
      paper.material = mat(0x12080c);
      root.add(box(mat(0x3a2418), 0.5, 0.28, 0.16, 0, 0.02, 0.08));
      root.add(cyl(mat(0x1a0c10), 0.09, 0.08, -0.12, 0.18, 0.12));
      root.add(cyl(mat(0x1a0c10), 0.09, 0.08, 0.12, 0.18, 0.12));
      const beam = box(mat(0xf0d09a, { emissive: 0xf0d09a, emissiveIntensity: 0.5, transparent: true, opacity: 0.25 }), 0.18, 0.18, 0.4, 0, 0.02, 0.28);
      root.add(beam);
    } else {
      paper.material = mat(0x2a1420);
      const tent = new THREE.Mesh(geo.cone, mat(0xc41e3a, { map: stripeTex() }));
      tent.scale.set(0.32, 0.42, 0.32);
      tent.position.set(0, 0.02, 0.08);
      root.add(tent);
      root.add(box(mat(0x12080c), 0.08, 0.16, 0.04, 0, -0.18, 0.12));
    }
    const scare = !!(spec && (spec.jumpScare || spec.kind === "jumpScare" || kind === "jack"));
    const like = (spec && spec.decoyLikeness) | 0;
    const side = ((spec && spec.id) || 1) + (root === w.tableauB ? 1 : 0);
    const hx = (side % 2 ? -0.22 : 0.22);
    const dx = -hx;
    const heart = box(mat(HEART, { emissive: HEART, emissiveIntensity: 0.95 }), 0.11, 0.11, 0.05, hx, scare ? -0.22 : -0.1, 0.22);
    heart.rotation.z = Math.PI / 4;
    heart.userData.role = "target";
    root.add(heart);
    root.userData.target = heart;
    let decoy;
    if (like >= 2) {
      decoy = box(mat(GOLD, { emissive: 0x8a6230, emissiveIntensity: 0.5 }), 0.09, 0.09, 0.04, dx, -0.08, 0.2);
      decoy.rotation.z = Math.PI / 4;
    } else {
      decoy = cyl(mat(GOLD, { emissive: 0x6a4808, emissiveIntensity: 0.35 }), 0.075, 0.02, dx, -0.12, 0.18);
      decoy.rotation.x = Math.PI / 2;
    }
    decoy.userData.role = "decoy";
    root.add(decoy);
    root.userData.decoy = decoy;
    const ghostMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const heartPad = new THREE.Mesh(geo.sphere, ghostMat);
    heartPad.scale.setScalar(0.16);
    heartPad.position.copy(heart.position);
    heartPad.userData.role = "target";
    root.add(heartPad);
    const decoyPad = new THREE.Mesh(geo.sphere, ghostMat);
    decoyPad.scale.setScalar(0.14);
    decoyPad.position.copy(decoy.position);
    decoyPad.userData.role = "decoy";
    root.add(decoyPad);
    if (scare) {
      root.traverse((n) => {
        if (n.userData && n.userData.jack) n.userData.role = "decoy";
      });
    }
    root.userData.kind = kind;
  }

  function setIrisOpen(iris, open) {
    if (!iris) return;
    const blades = iris.userData.blades;
    const r = iris.userData.radius;
    const cover = 1 - open;
    blades.forEach((p, i) => {
      p.rotation.z = (i / blades.length) * Math.PI * 2 + cover * 0.62;
      p.children[0].position.x = r * (0.16 + open * 0.78);
    });
  }

  function resize() {
    if (!world) return;
    const host = stageEl() || el("mutoscopeCanvas");
    const w = Math.max(16, (host && host.clientWidth) || window.innerWidth);
    const h = Math.max(16, (host && host.clientHeight) || window.innerHeight);
    world.renderer.setPixelRatio(MAX_DPR);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function pickAt(ev) {
    if (!world || !ev) return null;
    const canvas = el("mutoscopeCanvas");
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    const y = -((ev.clientY - r.top) / Math.max(1, r.height)) * 2 + 1;
    world.ray.setFromCamera({ x, y }, world.camera);
    const hits = world.ray.intersectObjects(world.pickables, true);
    return hits[0] || null;
  }

  function pickKind(ev) {
    const hit = pickAt(ev);
    if (!hit) return "";
    let n = hit.object;
    while (n) {
      if (n === world.ghostCrank || (n.userData && n.userData.pick === "ghost")) return "ghost";
      if (n === world.crank || (n.userData && n.userData.pick === "crank")) return "crank";
      if (n === world.coinSlot) return "slot";
      if (n === world.hood) return "hood";
      n = n.parent;
    }
    return "";
  }

  function fromChrome(ev) {
    const t = ev && (ev.target || ev.srcElement);
    if (!t || !t.closest) return false;
    return !!t.closest("#mutoscopeCrank, #mutoscopeStart, #mutoscopeChallenge, .vendor-actions, .vendor-result, .interior-back, .interior-header, button, a");
  }

  function overChrome(ev) {
    if (fromChrome(ev)) return true;
    const x = ev && ev.clientX;
    const y = ev && ev.clientY;
    if (x == null || y == null) return false;
    const ids = ["mutoscopeCrank", "mutoscopeStart", "mutoscopeChallenge"];
    for (let i = 0; i < ids.length; i += 1) {
      const node = el(ids[i]);
      if (!node || node.hidden || node.disabled) continue;
      const r = node.getBoundingClientRect();
      const pad = 18;
      if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) return true;
    }
    const canvas = el("mutoscopeCanvas");
    if (canvas) {
      const r = canvas.getBoundingClientRect();
      const onHood = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      if (!onHood) return true;
    }
    return false;
  }

  function pickRole(ev) {
    if (!world || !ev) return { role: "", object: null };
    const canvas = el("mutoscopeCanvas");
    if (!canvas) return { role: "", object: null };
    const r = canvas.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    const y = -((ev.clientY - r.top) / Math.max(1, r.height)) * 2 + 1;
    world.ray.setFromCamera({ x, y }, world.camera);
    const objs = [];
    world.tableau.traverse((n) => { if (n.isMesh) objs.push(n); });
    if (world.tableauB && world.tableauB.visible) {
      world.tableauB.traverse((n) => { if (n.isMesh) objs.push(n); });
    }
    objs.push(world.crank, world.ghostCrank, world.hood);
    const hits = world.ray.intersectObjects(objs, true);
    if (!hits.length) return { role: "", object: null };
    let n = hits[0].object;
    while (n) {
      if (n.userData && n.userData.role) return { role: n.userData.role, object: n };
      if (n === world.ghostCrank) return { role: "ghost", object: n };
      if (n === world.crank) return { role: "crank", object: n };
      n = n.parent;
    }
    return { role: "scene", object: hits[0].object };
  }

  function setCanvasCursor(mode) {
    const canvas = el("mutoscopeCanvas");
    if (!canvas) return;
    canvas.classList.toggle("is-grabbing", mode === "grabbing");
    canvas.classList.toggle("is-aim", mode === "aim");
  }

  function applyCrankSpin(spin) {
    if (!isLive() || !run.spec) return;
    if (run.spec.poisonCrank && run.stutterT > 0) {
      run.armMs = 0;
      setText("mutoscopeStatus", "Crank lied. The stutter was poison.");
      slam();
      return;
    }
    const signed = run.spec.reverseFlip ? -spin : spin;
    const want = run.spec.reverseFlip ? signed < 0 : signed > 0;
    if (run.spec.reverseFlip && !want && Math.abs(spin) > 0.004) {
      setText("mutoscopeStatus", "Wrong way — crank BACKWARD.");
      paintHint();
      return;
    }
    const used = run.spec.reverseFlip ? -signed : Math.abs(spin);
    run.crankAccum = (run.crankAccum || 0) + Math.abs(used);
    run.spinCool = 160;
    if (world) {
      world.crankSpin += spin * 6;
      world.drumTarget += spin * 2.4;
    }
    if (!run.sfxCool) {
      kit.sfx("spinner");
      run.sfxCool = 90;
    }
    if (run.spec.crankRequired && run.crankAccum >= 1.6) {
      run.hitchLock = false;
      run.hitchT = 0;
      run.crankedStage = true;
    }
  }

  function tryClick(pick) {
    if (!isLive() || run.slamming || run.approachMs > 0) return;
    if (run.blinkMs > 0) {
      setText("mutoscopeStatus", "Blink — wait for the iris.");
      paintHint();
      return;
    }
    if (run.spec.crankRequired && run.crankAccum < 1.6) {
      setText("mutoscopeStatus", "CRANK a full turn first — then the RED heart.");
      paintHint();
      return;
    }
    if (!run.irisOpen || run.aperture < 0.45) {
      setText("mutoscopeStatus", "Iris still shut — hold still, then click the RED heart.");
      paintHint();
      return;
    }
    const role = pick && pick.role;
    if (role === "ghost" || role === "fake" || role === "decoy") {
      run.armMs = 0;
      slam("decoy");
      return;
    }
    if (role === "target") {
      if (pick.object && pick.object.userData) pick.object.userData.hit = true;
      if (run.spec.dualWindow) {
        run.dualHits = (run.dualHits | 0) + 1;
        kit.sfx("flip");
        if (run.dualHits < 2) {
          setText("mutoscopeStatus", "One heart. Click the other window.");
          paintHint();
          return;
        }
      }
      creditCard();
      return;
    }
    setText("mutoscopeStatus", "Missed. RED heart is real — gold is the decoy.");
    paintHint();
  }

  function notePointer(ev) {
    if (!isLive() || !cabinetOn() || ignorePointer) return;
    if (run.approachMs > 0) return;
    if (overChrome(ev)) {
      run.lastPX = ev.clientX;
      run.lastPY = ev.clientY;
      run.armMs = Math.max(run.armMs, 80);
      return;
    }
    if (run.ptr && run.ptr.down && run.ptr.pick && (run.ptr.pick.role === "target" || run.ptr.pick.role === "decoy")) {
      return;
    }
    if (run.ptr && run.ptr.down && run.ptr.pick && (run.ptr.pick.role === "crank" || run.ptr.grabCrank)) {
      const dx = ev.clientX - run.ptr.x;
      const dy = ev.clientY - run.ptr.y;
      if (!run.ptr.dragging && Math.hypot(dx, dy) > 6) run.ptr.dragging = true;
      if (run.ptr.dragging) {
        setCanvasCursor("grabbing");
        applyCrankSpin(dx * 0.018);
        run.ptr.x = ev.clientX;
        run.ptr.y = ev.clientY;
        run.armMs = Math.max(run.armMs, 60);
      }
      return;
    }
    const x = ev.clientX;
    const y = ev.clientY;
    if (x == null || y == null) return;
    if (run.armMs > 0 || run.lastPX == null) {
      run.lastPX = x;
      run.lastPY = y;
      return;
    }
    const d = Math.hypot(x - run.lastPX, y - run.lastPY);
    run.lastPX = x;
    run.lastPY = y;
    const still = run.spec && run.spec.stillPx ? run.spec.stillPx : 10;
    if (d > still) {
      run.moved = true;
      run.moveBurst = d;
    } else if (run.spec && run.spec.twitchWarn && d > still * 0.38) {
      run.twitchMs = 220;
      if (!run.irisOpen) run.stillMs = Math.max(0, (run.stillMs || 0) * 0.55);
    }
  }

  function openIris() {
    if (!isLive() || run.irisOpen || run.slamming) return;
    run.irisOpen = true;
    run.opening = true;
    run.armMs = Math.max(run.armMs, 220);
    run.lastPX = null;
    run.lastPY = null;
    run.cardMsNow = run.spec.cardMs;
    run.cardWait = run.spec.cardMs;
    run.crankedThisCard = false;
    run.hitchDone = false;
    run.hitchT = 0;
    run.hitchLock = false;
    setEyed(true);
    kit.sfx("drop");
    const peep = run.scene && run.scene.title ? run.scene.title : "the reel";
    let crankNote = "Click the RED heart. Gold is a decoy.";
    if (run.spec.crankRequired) crankNote = "Crank a full turn, then click the RED heart.";
    else if (run.spec.poisonCrank) crankNote = "Don't crank the red flicker. RED heart, not gold.";
    else if (run.spec.reverseFlip) crankNote = "If it stalls, crank backward. RED heart.";
    setText("mutoscopeStatus", `${run.spec.title} — ${peep}. ${crankNote}`);
    stampDepthCopy();
  }

  function slam(why) {
    if (!isLive() || run.slamming) return;
    if (run.armMs > 0 && why !== "decoy") return;
    run.slamming = true;
    run.irisOpen = false;
    run.opening = false;
    run.stillMs = 0;
    run.moved = false;
    run.slamWhy = why || "fidget";
    run.pendingFake = 0;
    run.fakeMs = 0;
    run.fakeStampMs = 0;
    run.breatheMs = 0;
    run.hitchT = 0;
    run.hitchLock = false;
    run.stutterT = 0;
    if (world) world.shake = 0.14;
    setEyed(false);
    kit.sfx("stamp");
    setText("mutoscopeStatus", run.slamWhy === "decoy"
      ? "DECOY — that’s the gold liar. The RED heart was real."
      : "FIDGET — the iris slams shut.");
    paintHint();
  }

  function applyStrike() {
    tellStrike("iris slam");
    setPips(run.strikes);
    if (run.strikes >= run.spec.slamLimit) {
      finish("iris slam");
      return true;
    }
    if (run.spec.warnFirstSlam && run.strikes === 1) {
      setText("mutoscopeStatus", `SLAM 1 of ${run.spec.slamLimit}. Teach reel — two more and you’re stamped. Hold still.`);
    } else {
      setText("mutoscopeStatus", `SLAM ${run.strikes} of ${run.spec.slamLimit}. Stillness opens it again.`);
    }
    return false;
  }

  function lightGhostPip() {
    if (!run || !run.spec || !run.spec.ghostPip) return;
    const host = document.querySelector('[data-runkit-strikes="mutoscope"]');
    if (!host) return;
    const pip = host.children[run.strikes];
    if (!pip) return;
    pip.classList.add("ghost");
    if (run.ghostPipTimer) clearTimeout(run.ghostPipTimer);
    run.ghostPipTimer = setTimeout(() => {
      pip.classList.remove("ghost");
      run.ghostPipTimer = 0;
    }, 320);
  }

  function fakeSlam() {
    if (!isLive() || !run.irisOpen || run.slamming) return;
    run.fakeMs = 140;
    run.fakeStampMs = Math.max(run.fakeStampMs, 220);
    run.fakeSlamFired = (run.fakeSlamFired | 0) + 1;
    lightGhostPip();
    kit.sfx("stamp");
    const left = Math.max(0, (run.spec.fakeSlamCount | 0) - run.fakeSlamFired);
    setText("mutoscopeStatus", left
      ? `Was that a slam? …the reel kept going. Ignore it. (${left} more lies)`
      : "Was that a slam? …the reel kept going. Ignore it.");
  }

  function crank() {
    if (!isLive() || run.slamming || run.approachMs > 0) return;
    applyCrankSpin(run.spec && run.spec.reverseFlip ? -0.42 : 0.42);
    stampDepthCopy();
  }

  function creditCard() {
    run.stageCards += 1;
    run.cards += 1;
    run.score += CARD_SCORE;
    if (run.kitRun) run.kitRun.score = run.score;
    kit.sfx("flip");
    run.armMs = Math.max(run.armMs, 240);
    run.lastPX = null;
    run.moved = false;
    if (world) world.drumTarget += (Math.PI * 2) / 12;
    setText("mutoscopeStatus", `${run.spec.title} · card ${run.stageCards} / ${run.spec.cardsNeeded}`);
    stampDepthCopy();
    if (run.stageCards >= run.spec.cardsNeeded) {
      clearStage();
      return;
    }
    run.prevScene = run.scene;
    run.scene = pickScene(run.spec.id, run.cards);
    run.flipT = 160;
    if (world) world.flipMid = false;
    run.crankedThisCard = false;
    run.dualHits = 0;
    if (run.spec.crankRequired) {
      run.crankAccum = 0;
      run.hitchDone = false;
      run.hitchLock = true;
    } else {
      run.hitchDone = false;
      run.hitchT = 0;
      run.hitchLock = false;
    }
    run.fakeFiredOnThisCard = false;
    run.cardMsNow = run.spec.cardMs;
    run.cardWait = run.spec.cardMs;
    if (run.spec.jumpScare && (run.stageCards === 3 || run.stageCards === 5 || Math.random() < 0.18)) {
      run.flashMs = 180;
      setFlash(true);
      kit.sfx("stamp");
      setText("mutoscopeStatus", "Jump scare — flash is a liar. Movement still slams.");
    }
    const fakeNeed = run.spec.fakeSlamCount | 0;
    if (fakeNeed > 0 && (run.fakeSlamFired | 0) < fakeNeed) {
      const beats = fakeNeed === 3 ? [1, 3, 5] : [2, 4];
      if (beats.indexOf(run.stageCards) >= 0) {
        run.pendingFake = 160 + Math.random() * 280;
      }
    } else if (run.spec.fakeSlamAudio && !fakeNeed && Math.random() < 0.3) {
      run.pendingFake = 220 + Math.random() * 380;
    }
  }

  function clearStage() {
    run.depth += 1;
    run.score += CLEAR_BONUS + DEPTH_BONUS * run.depth;
    if (run.kitRun) {
      run.kitRun.depth = run.depth;
      run.kitRun.score = run.score;
      run.kitRun.strikes = 0;
    }
    kit.sfx("rack");
    PF.setAura("celebrate");
    if (world && world.aura) world.aura.userData.pose = "celebrate";
    const next = mutoscopeStageParams(run.spec.id + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    setText("mutoscopeStatus", next.coda
      ? `Stage ${run.depth} — ${AURA.coda}`
      : `Stage ${run.depth} — ${next.barker || kindHint(next)}`);
    beginStage(run.spec.id + 1);
    tellDepth();
  }

  function beginStage(n) {
    const spec = mutoscopeStageParams(n);
    run.spec = spec;
    run.strikes = 0;
    if (run.kitRun) run.kitRun.strikes = 0;
    run.stageCards = 0;
    run.irisOpen = false;
    run.opening = false;
    run.slamming = false;
    run.stillMs = 0;
    run.moved = false;
    run.armMs = 160;
    run.aperture = 0;
    run.cardMsNow = spec.cardMs;
    run.cardWait = spec.cardMs;
    run.crankedThisCard = false;
    run.crankedStage = false;
    run.flashMs = 0;
    run.fakeMs = 0;
    run.breatheMs = 0;
    run.breatheCool = 400;
    run.pendingFake = 0;
    run.flipT = 0;
    run.hitchT = 0;
    run.hitchLock = false;
    run.hitchDone = false;
    run.stutterT = 0;
    run.stutterCool = 500;
    run.blinkMs = 0;
    run.blinkCool = spec.blinkHood ? 900 : 0;
    run.fakeSlamFired = 0;
    run.fakeFiredOnThisCard = false;
    run.fakeStampMs = 0;
    run.twitchMs = 0;
    run.ghostCrankMs = 0;
    run.ghostCrankCool = 500;
    run.crankAccum = 0;
    run.spinCool = 0;
    run.dualHits = 0;
    run.ptr = null;
    run.scene = pickScene(spec.id, run.cards);
    run.prevScene = run.scene;
    if (world) {
      world.flipMid = true;
      fillTableau(world, world.tableau, run.scene, spec);
      if (spec.dualWindow) fillTableau(world, world.tableauB, pickScene(spec.id, run.cards + 1), spec);
    }
    setEyed(false);
    setFlash(false);
    paintPipsLimit(spec.slamLimit);
    setPips(0);
    stampDepthCopy();
    setText("mutoscopeStatus", spec.barker || `${spec.title} — hold still.`);
    tellDepth();
  }

  function start() {
    if (isLive() || starting) return;
    if (!world) {
      setText("mutoscopeStatus", "Warming the peep lamp…");
      starting = true;
      ensureWorld().then(() => {
        starting = false;
        if (cabinetOn() && !isLive()) start();
      }).catch(() => {
        starting = false;
        setText("mutoscopeStatus", "This parlor wants WebGL.");
      });
      return;
    }
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("mutoscopeStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      return;
    }
    run = {
      done: false,
      dying: false,
      deathHold: 0,
      deathNote: "",
      kitRun,
      spec: mutoscopeStageParams(1),
      depth: 0,
      score: 0,
      cards: 0,
      stageCards: 0,
      strikes: 0,
      irisOpen: false,
      opening: false,
      slamming: false,
      closedStamp: false,
      stillMs: 0,
      armMs: 180,
      aperture: 0,
      cardMsNow: 900,
      cardWait: 900,
      crankedThisCard: false,
      lastPX: null,
      lastPY: null,
      moved: false,
      moveBurst: 0,
      hitchT: 0,
      hitchLock: false,
      hitchDone: false,
      crankedStage: false,
      stutterT: 0,
      stutterCool: 500,
      blinkMs: 0,
      blinkCool: 0,
      fakeSlamFired: 0,
      fakeFiredOnThisCard: false,
      breatheMs: 0,
      breatheCool: 400,
      flashMs: 0,
      fakeMs: 0,
      pendingFake: 0,
      flipT: 0,
      fakeStampMs: 0,
      twitchMs: 0,
      ghostCrankMs: 0,
      ghostCrankCool: 500,
      ghostPipTimer: 0,
      crankAccum: 0,
      spinCool: 0,
      dualHits: 0,
      ptr: null,
      scene: pickScene(1, 0),
      prevScene: pickScene(1, 0),
      approachMs: APPROACH_MS,
      last: 0,
    };
    beginStage(1);
    run.approachMs = APPROACH_MS;
    if (world) {
      world.camMode = "approach";
      world.approachT = 0;
      world.coin.visible = true;
      world.coin.position.set(0, 1.55, 0.55);
      world.aura.userData.pose = "watch";
    }
    const startBtn = el("mutoscopeStart");
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.hidden = true;
    }
    const verdict = el("mutoscopeVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("mutoscopeResult");
    PF.setTier("mutoscopeTier", "", "");
    kit.setMode(card(), "play");
    paintPipsLimit(run.spec.slamLimit);
    setPips(0);
    stampDepthCopy();
    setText("mutoscopeStatus", "Penny in the slot. Lean into the hood.");
    PF.focusCard("mutoscopeCard", true);
    PF.setAura("think");
    setEyed(false);
    setFlash(false);
    kit.sfx("drop");
    startLoop();
  }

  function step(dt) {
    if (!run || run.done) return;
    if (run.dying) {
      run.deathHold = Math.max(0, (run.deathHold || 0) - dt);
      paintHud();
      if (run.deathHold <= 0) sealResult(run.deathNote || "iris slam");
      return;
    }
    if (run.approachMs > 0) {
      run.approachMs = Math.max(0, run.approachMs - dt);
      if (world) {
        world.camMode = "approach";
        world.approachT = 1 - run.approachMs / APPROACH_MS;
        if (world.coin.visible) {
          world.coin.position.y = 1.55 - (1 - run.approachMs / APPROACH_MS) * 0.82;
          if (run.approachMs < 180) world.coin.visible = false;
        }
      }
      if (run.approachMs <= 0) {
        setText("mutoscopeStatus", run.spec.barker || "HOLD STILL — CLICK THE RED HEART, NOT GOLD");
        run.armMs = 200;
        run.lastPX = null;
        run.lastPY = null;
      }
      paintHud();
      return;
    }
    if (run.armMs > 0) run.armMs = Math.max(0, run.armMs - dt);
    if (run.flipT > 0) run.flipT = Math.max(0, run.flipT - dt);
    if (run.hitchLock) {
      run.hitchT = 180 + Math.abs(Math.sin(performance.now() / 45)) * 100;
    } else if (run.hitchT > 0) {
      run.hitchT = Math.max(0, run.hitchT - dt);
    }
    if (run.stutterT > 0) run.stutterT = Math.max(0, run.stutterT - dt);
    if (run.stutterCool > 0) run.stutterCool = Math.max(0, run.stutterCool - dt);
    if (run.blinkMs > 0) run.blinkMs = Math.max(0, run.blinkMs - dt);
    if (run.blinkCool > 0) run.blinkCool = Math.max(0, run.blinkCool - dt);
    if (run.breatheMs > 0) run.breatheMs = Math.max(0, run.breatheMs - dt);
    if (run.breatheCool > 0) run.breatheCool = Math.max(0, run.breatheCool - dt);
    if (run.flashMs > 0) {
      run.flashMs = Math.max(0, run.flashMs - dt);
      if (run.flashMs <= 0) setFlash(false);
    }
    if (run.fakeMs > 0) run.fakeMs = Math.max(0, run.fakeMs - dt);
    if (run.fakeStampMs > 0) run.fakeStampMs = Math.max(0, run.fakeStampMs - dt);
    if (run.twitchMs > 0) run.twitchMs = Math.max(0, run.twitchMs - dt);
    if (run.ghostCrankMs > 0) run.ghostCrankMs = Math.max(0, run.ghostCrankMs - dt);
    if (run.ghostCrankCool > 0) run.ghostCrankCool = Math.max(0, run.ghostCrankCool - dt);
    if (run.pendingFake > 0) {
      run.pendingFake -= dt;
      if (run.pendingFake <= 0) fakeSlam();
    }

    if (run.spinCool > 0) run.spinCool = Math.max(0, run.spinCool - dt);
    if (run.sfxCool > 0) run.sfxCool = Math.max(0, run.sfxCool - dt);

    const want = run.slamming ? 0 : (run.blinkMs > 0 ? 0.08 : (run.irisOpen ? 1 : (run.stillMs > 80 ? 0.08 : 0)));
    const rate = run.slamming ? 0.016 : (run.irisOpen ? 0.014 : 0.012);
    if (run.aperture < want) run.aperture = Math.min(want, run.aperture + dt * rate);
    else if (run.aperture > want) run.aperture = Math.max(want, run.aperture - dt * rate);

    if (run.slamming) {
      if (run.aperture <= 0.03) {
        run.slamming = false;
        run.aperture = 0;
        if (applyStrike()) return;
      }
      paintHud();
      return;
    }

    const clicking = !!(run.ptr && run.ptr.down && run.ptr.pick
      && (run.ptr.pick.role === "target" || run.ptr.pick.role === "decoy"));
    const cranking = !!(run.ptr && run.ptr.dragging && run.ptr.grabCrank);
    if (run.moved && !cranking && !clicking) {
      run.moved = false;
      run.stillMs = 0;
      if (run.irisOpen) {
        slam("fidget");
        return;
      }
    } else if (!cranking) {
      run.stillMs = (run.stillMs || 0) + dt;
      if (!run.irisOpen && run.stillMs >= run.spec.stillWarmupMs) openIris();
    }

    if (run.irisOpen && !run.slamming) {
      if (run.spec.crankRequired && !run.hitchDone && run.stageCards >= 1 && run.crankAccum < 1.6) {
        run.hitchDone = true;
        run.hitchLock = true;
        kit.sfx("spit");
        setText("mutoscopeStatus", "CRANK a full turn — then click the RED heart.");
        syncCrank();
      }
      if (run.spec.stutter && run.stutterCool <= 0 && run.stutterT <= 0
          && !run.hitchLock && run.blinkMs <= 0) {
        run.stutterT = 420 + Math.random() * 180;
        run.stutterCool = 1500 + Math.random() * 700;
        kit.sfx("spit");
        setText("mutoscopeStatus", run.spec.poisonCrank
          ? "RED FLICKER — don’t crank. Click the heart."
          : "Reel stutter — wait, then click.");
        syncCrank();
      }
      if (run.spec.blinkHood && run.blinkCool <= 0 && run.blinkMs <= 0
          && !run.hitchLock && run.stutterT <= 0) {
        run.blinkMs = run.spec.blinkMs || 400;
        run.blinkCool = run.spec.blinkEveryMs || 2800;
        setText("mutoscopeStatus", "Blink — wait for the iris, then click.");
      }
      if (run.spec.ghostCrank && run.ghostCrankCool <= 0 && run.ghostCrankMs <= 0 && run.hitchT <= 0 && !run.hitchLock) {
        run.ghostCrankMs = 560;
        run.ghostCrankCool = 1400 + Math.random() * 900;
        setText("mutoscopeStatus", "Ghost HANDLE. That’s a fake — click the heart.");
      }
    }
    paintHud();
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (depth <= 0 && reason !== "souvenir") return AURA.shallow;
    if (run && run.spec && (reason === "iris slam" || reason === "slam")) {
      if (run.slamWhy === "decoy") return AURA.decoy;
      if (run.spec.poisonCrank && (run.stutterT > 0 || run.spec.kind === "stutterPoisonCrank")) return AURA.poison;
      if (run.spec.kind === "crankRequired" || run.hitchLock) return AURA.hitch;
      if (run.spec.kind === "jumpScare" || run.flashMs > 0) return AURA.scare;
      if (run.spec.kind === "fakeSlam" || run.fakeStampMs > 0) return AURA.fake;
      if (run.spec.kind === "dualWindow") return AURA.twin;
      if (run.spec.kind === "blinkHood" || run.blinkMs > 0) return AURA.blinkHood;
      if (run.spec.kind === "reverseFlip") return AURA.reverse;
    }
    if (reason === "iris slam" || reason === "slam") return AURA.blink;
    if (depth >= AUTHORED_COUNT) return AURA.coda;
    if (depth >= 5) return AURA.deep;
    if (depth >= 2) return AURA.mid;
    return AURA.blink;
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.irisOpen = false;
    run.slamming = false;
    run.opening = false;
    run.deathNote = reason === "souvenir" ? "souvenir" : "iris slam";
    run.deathReason = run.deathNote;
    run.closedStamp = reason !== "souvenir";
    run.deathHold = DEATH_HOLD_MS;
    if (world) {
      world.shake = reason === "souvenir" ? 0 : 0.1;
      world.camMode = reason === "souvenir" ? "result" : "slam";
      world.aura.userData.pose = reason === "souvenir" ? "celebrate" : "shake";
    }
    setEyed(false);
    setFlash(false);
    if (run.closedStamp) kit.sfx("pit");
    stampDepthCopy();
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    if (run.ghostPipTimer) {
      clearTimeout(run.ghostPipTimer);
      run.ghostPipTimer = 0;
    }
    const pips = document.querySelector('[data-runkit-strikes="mutoscope"]');
    if (pips) pips.querySelectorAll("i.ghost").forEach((pip) => pip.classList.remove("ghost"));
    run.irisOpen = false;
    run.slamming = false;
    run.deathReason = reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : "iris slam");
    run.closedStamp = reason !== "leave" && reason !== "souvenir";
    setEyed(false);
    setFlash(false);
    const depth = run.depth | 0;
    const score = run.score;
    const cards = run.cards;
    persistDepth({
      depth,
      score,
      deathReason: run.deathReason,
      cashedOut: reason === "souvenir",
      meta: { cards, stage: run.spec && run.spec.id, strikes: run.strikes, kind: run.spec && run.spec.kind },
    });
    stampDepthCopy();
    const startBtn = el("mutoscopeStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.hidden = false;
      startBtn.textContent = "PEEP AGAIN · 1 demo coin";
    }
    PF.focusCard("mutoscopeCard", false);
    kit.setMode(card(), "result");
    if (world) {
      world.camMode = "result";
      world.aura.userData.pose = depth >= 4 || reason === "souvenir" ? "celebrate" : (depth > 0 ? "wave" : "shake");
    }
    const aura = auraLine(reason, depth);
    const challenge = challengeLine(depth);
    const verdict = el("mutoscopeVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = reason === "leave"
        ? `Left the hood · STAGE ${depth} · CARDS ${cards}`
        : (reason === "souvenir"
          ? `SOUVENIR · STAGE ${depth} · CARDS ${cards}`
          : `CARDS ${cards} · “${aura}”`);
    }
    kit.fillResult({
      root: "mutoscopeResult",
      depth: "mutoscopeResultDepth",
      score: "mutoscopeResultScore",
      aura: "mutoscopeResultAura",
      copied: "mutoscopeCopied",
    }, {
      depthLine: reason === "souvenir" ? `SOUVENIR · STAGE ${depth}` : `STAGE ${depth}`,
      scoreLine: `SCORE ${score} · CARDS ${cards} · ${String(run.deathReason).toUpperCase()}`,
      auraLine: aura,
    });
    setText("mutoscopeChallengeText", challenge);
    PF.setTier("mutoscopeTier", depth > 0 ? (depth > AUTHORED_COUNT ? `ENDLESS · STAGE ${depth}` : `STAGE ${depth}`) : (reason === "souvenir" ? "SOUVENIR" : "SLAM"), depth > 0 || reason === "souvenir" ? "perfect" : "miss");
    setText("mutoscopeStatus", reason === "leave" ? "Left the hood." : (reason === "souvenir" ? "Souvenir — authored reels locked." : "Iris stamped SLAM."));
    const ok = depth > 0 || cards > 0 || reason === "souvenir";
    if (ok) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Mutoscope");
      PF.setAura(depth >= 4 || reason === "souvenir" ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `STAGE ${depth}`, `CARDS ${cards} · ${aura}`);
    } else {
      PF.award(0, false, "Mutoscope slam");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "SLAM", aura);
    }
    PF.refreshNightBoard();
    syncShell();
    paintHint();
  }

  function driveCamera(now, dt) {
    const cam = world.camera;
    const live = isLive() || (run && run.dying);
    const peep = live && run && (run.approachMs <= 0 || world.camMode === "peep" || world.camMode === "slam");
    let tx = -0.85;
    let ty = 1.48;
    let tz = 3.9;
    let lx = 0.55;
    let ly = 1.12;
    let lz = 0.25;
    let fov = 50;
    if (!REDUCE && (!live || (run && run.approachMs > 0 && world.approachT < 0.15))) {
      const a = now * 0.00018;
      tx = -0.85 + Math.sin(a) * 0.55;
      tz = 3.85 + Math.cos(a) * 0.32;
      ty = 1.48 + Math.sin(now * 0.0004) * 0.04;
    }
    if (run && run.approachMs > 0) {
      const t = world.approachT * world.approachT * (3 - 2 * world.approachT);
      tx = tx + (0 - tx) * t;
      ty = ty + (1.54 - ty) * t;
      tz = tz + (0.96 - tz) * t;
      lx = lx + (0 - lx) * t;
      ly = ly + (1.52 - ly) * t;
      lz = lz + (-0.55 - lz) * t;
      fov = 52 + (38 - 52) * t;
      world.camMode = "approach";
    } else if (peep && run && !run.done) {
      tx = 0;
      ty = 1.54;
      tz = 0.92;
      lx = 0;
      ly = 1.52;
      lz = -0.6;
      fov = 38;
      if (run.spec && run.spec.dualWindow) {
        ty = 1.54;
        fov = 42;
      }
      if (run.irisOpen) tz = 0.86;
      world.camMode = run.slamming || run.dying ? "slam" : "peep";
    } else if (run && run.done) {
      tx = 0.55;
      ty = 1.48;
      tz = 3.4;
      lx = 0.4;
      ly = 1.2;
      lz = 0.4;
      fov = 48;
      world.camMode = "result";
    }
    const k = 1 - Math.pow(0.001, dt / 16);
    cam.position.x += (tx - cam.position.x) * k;
    cam.position.y += (ty - cam.position.y) * k;
    cam.position.z += (tz - cam.position.z) * k;
    cam.fov += (fov - cam.fov) * k;
    cam.updateProjectionMatrix();
    if (world.shake > 0) {
      cam.position.x += (Math.random() - 0.5) * world.shake;
      cam.position.y += (Math.random() - 0.5) * world.shake;
      world.shake *= 0.86;
      if (world.shake < 0.002) world.shake = 0;
    }
    world.look.set(lx, ly, lz);
    cam.lookAt(world.look);
    if (world.scene.fog) {
      world.scene.fog.density = peep && run && run.approachMs <= 0 ? 0.012 : 0.026;
    }
  }

  function driveAura(now, dt) {
    const a = world.aura;
    if (!a || !a.userData) return;
    const u = a.userData;
    u.t += dt * 0.001;
    const pose = u.pose || "wave";
    const bob = Math.sin(u.t * 2.2) * 0.012;
    u.hip.position.y = 0.42 + bob;
    if (u.armR) {
      if (pose === "celebrate") u.armR.rotation.z = -2.2 + Math.sin(u.t * 6) * 0.15;
      else if (pose === "shake") u.armR.rotation.z = -0.3;
      else if (pose === "watch") u.armR.rotation.z = -0.5;
      else u.armR.rotation.z = -0.2 + Math.sin(u.t * 3.1) * 0.55;
    }
    if (u.armL) {
      if (pose === "celebrate") u.armL.rotation.z = 2.2 + Math.sin(u.t * 6 + 1) * 0.15;
      else u.armL.rotation.z = 0.25;
    }
    if (u.head) {
      u.head.rotation.y = pose === "watch" ? -0.25 : Math.sin(u.t * 1.4) * 0.12;
      u.head.rotation.z = pose === "shake" ? Math.sin(now * 0.02) * 0.18 : 0;
    }
  }

  function render(now, dt) {
    if (!world || !cabinetOn()) return;
    driveCamera(now, dt);
    driveAura(now, dt);

    world.lamps.forEach((l, i) => {
      l.intensity = 1.4 + Math.sin(now * 0.007 + i * 1.7) * 0.16;
    });
    const pos = world.dust.geometry.attributes.position;
    for (let i = 0; i < DUST_N; i += 1) {
      let y = pos.getY(i) + dt * 0.00012;
      if (y > 3.5) y = 0.05;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;

    let open = 0.12 + Math.sin(now / 900) * 0.06;
    let slamVis = false;
    const spec = run && run.spec ? run.spec : mutoscopeStageParams(1);
    if (run && !run.done) {
      open = run.aperture;
      if (run.blinkMs > 0) open = Math.max(0.05, open * 0.12);
      if (run.fakeMs > 0) open = Math.max(0.08, open - 0.55);
      if (run.hitchT > 0 || run.hitchLock) open = Math.max(0.2, open - 0.08);
      if (run.stutterT > 0) open = Math.max(0.22, open - 0.12);
      slamVis = !!(run.slamming || run.fakeMs > 0 || run.breatheMs > 0);
    }
    const dual = !!(run && run.spec && run.spec.dualWindow);
    world.irisMain.visible = !dual;
    world.irisA.visible = dual;
    world.irisB.visible = dual;
    world.tableauB.visible = dual;
    if (dual) {
      world.tableau.position.y = 0.18;
      world.tableau.scale.setScalar(0.72);
      world.tableauB.scale.setScalar(0.72);
      setIrisOpen(world.irisA, open);
      setIrisOpen(world.irisB, open);
    } else {
      world.tableau.position.y = 0;
      world.tableau.scale.setScalar(1);
      setIrisOpen(world.irisMain, open);
    }

    const dir = spec && spec.reverseFlip ? -1 : 1;
    if (run && run.flipT > 0) {
      const ft = 1 - run.flipT / 160;
      world.tableau.rotation.y = dir * ft * Math.PI;
      if (!world.flipMid && ft >= 0.5) {
        fillTableau(world, world.tableau, run.scene, spec);
        world.flipMid = true;
      }
    } else if (run && (run.hitchLock || run.hitchT > 90)) {
      world.tableau.rotation.y = dir * 0.25;
    } else {
      world.tableau.rotation.y += ((spec && spec.reverseFlip ? 0.08 : 0) - world.tableau.rotation.y) * 0.08;
    }
    if (run && (run.hitchT > 0 || run.hitchLock || run.stutterT > 0)) {
      const k = now / 40;
      world.tableau.position.x = Math.sin(k) * 0.03;
    } else {
      world.tableau.position.x *= 0.8;
    }

    world.drum.rotation.x += (world.drumTarget - world.drum.rotation.x) * 0.08;
    world.crank.rotation.z += ((world.crankSpin % (Math.PI * 2)) - world.crank.rotation.z) * 0.12;

    world.ghostCrank.visible = !!(run && run.spec && run.spec.ghostCrank && run.ghostCrankMs > 0);
    if (world.ghostCrank.visible) {
      world.ghostCrank.rotation.z = Math.sin(now / 40) * 0.55;
    }

    world.reelLight.intensity = 0.15 + open * 1.6;
    world.reelLight.color.setHex(spec && spec.kind === "jumpScare" && run && run.flashMs > 0 ? 0xfff6ec : 0xffe0b0);
    world.flashLight.intensity = run && run.flashMs > 0 ? (run.flashMs / 180) * 4.2 : 0;

    world.stamp.visible = !!(run && run.closedStamp);
    if (run && run.fakeStampMs > 0 && !run.closedStamp) {
      world.stamp.visible = true;
      world.stamp.material.opacity = Math.min(1, run.fakeStampMs / 220);
      world.stamp.material.transparent = true;
    } else if (world.stamp.material) {
      world.stamp.material.transparent = false;
      world.stamp.material.opacity = 1;
    }

    const jack = world.tableau.children.find((c) => c.userData && c.userData.jack);
    if (jack && run && run.flashMs > 0) jack.position.z = 0.12 + (1 - run.flashMs / 180) * 0.22;
    else if (jack) jack.position.z = 0.12;

    world.tableau.traverse((n) => {
      if (n.userData && n.userData.spin) n.rotation.z += n.userData.spin * dt * 0.002;
    });
    const pulse = 0.92 + Math.sin(now / 160) * 0.12;
    [world.tableau, world.tableauB].forEach((g) => {
      if (!g || !g.userData) return;
      const hot = !!(run && run.irisOpen && run.blinkMs <= 0);
      const t = g.userData.target;
      if (t) {
        t.scale.setScalar(hot ? pulse : 0.82);
        if (t.material && t.material.emissiveIntensity != null) t.material.emissiveIntensity = hot ? 0.95 : 0.35;
      }
      const d = g.userData.decoy;
      if (d) {
        const lie = hot && run && run.spec && (run.spec.decoyLikeness | 0) >= 2;
        d.scale.setScalar(lie ? 0.88 + Math.sin(now / 140 + 1) * 0.1 : 0.82);
        if (d.material && d.material.emissiveIntensity != null) d.material.emissiveIntensity = lie ? 0.62 : 0.28;
      }
    });

    if (!run || run.done) {
      if (Math.floor(now / 2800) !== Math.floor((now - dt) / 2800)) {
        const idle = SCENES[Math.floor(now / 2800) % SCENES.length];
        fillTableau(world, world.tableau, idle, mutoscopeStageParams(1));
      }
    }

    world.renderer.render(world.scene, world.camera);
  }

  function startLoop() {
    if (loopOn) return;
    loopOn = true;
    lastNow = 0;
    const tick = (now) => {
      if (!loopOn) return;
      if (!cabinetOn()) {
        loopOn = false;
        loopRaf = 0;
        return;
      }
      if (!lastNow) lastNow = now;
      const dt = Math.min(32, now - lastNow);
      lastNow = now;
      if (run && !run.done) step(dt);
      render(now, dt);
      if (typeof PF.refreshDepth === "function" && run && !run.done) PF.refreshDepth();
      loopRaf = requestAnimationFrame(tick);
    };
    loopRaf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    loopOn = false;
    if (loopRaf) cancelAnimationFrame(loopRaf);
    loopRaf = 0;
  }

  PF.mutoscopeDebug = function () {
    const t = world && world.tableau && world.tableau.userData && world.tableau.userData.target;
    const d = world && world.tableau && world.tableau.userData && world.tableau.userData.decoy;
    function scr(obj) {
      if (!world || !THREE || !obj) return null;
      const v = obj.getWorldPosition(new THREE.Vector3());
      v.project(world.camera);
      const c = el("mutoscopeCanvas").getBoundingClientRect();
      return {
        x: Math.round((v.x * 0.5 + 0.5) * c.width + c.left),
        y: Math.round((-v.y * 0.5 + 0.5) * c.height + c.top),
        vis: v.z < 1,
      };
    }
    return {
      world: !!world,
      low: LOW,
      live: isLive(),
      iris: !!(run && run.irisOpen),
      aperture: run ? +run.aperture.toFixed(2) : 0,
      stillMs: run ? (run.stillMs | 0) : 0,
      cards: run ? (run.cards | 0) : 0,
      strikes: run ? (run.strikes | 0) : 0,
      stage: run && run.spec && run.spec.title,
      heart: scr(t),
      decoy: scr(d),
      status: (el("mutoscopeStatus") || {}).textContent || "",
    };
  };
  PF.mutoscopeDebug.clickHeart = function () { tryClick({ role: "target" }); };
  PF.mutoscopeDebug.clickDecoy = function () { tryClick({ role: "decoy" }); };
  PF.mutoscopeDebug.fidget = function () {
    if (!run) return;
    run.armMs = 0;
    run.moved = true;
  };

  PF.registerVendor({
    id: "mutoscope",
    playKey: "mutoscope",
    chalk: "HOLD STILL — RED HEART, NOT THE GOLD DECOY",
    defaults: { bestMutoscopeStages: 0, bestMutoscopeCards: 0, bestMutoscopeScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopLoop();
      const cab = document.getElementById(CABINET_ID);
      if (cab) {
        cab.classList.remove("is-playing");
        cab.classList.remove("is-result");
      }
    },
    onShow() {
      declareP0();
      stampDepthCopy();
      ensureWorld().then(() => {
        resize();
        startLoop();
      }).catch(() => {});
    },
    onReset() {
      run = null;
      setEyed(false);
      setFlash(false);
      const verdict = el("mutoscopeVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("mutoscopeResult");
      const startBtn = el("mutoscopeStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.hidden = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      if (world) {
        world.camMode = "parlor";
        world.stamp.visible = false;
        world.coin.visible = false;
        world.aura.userData.pose = "wave";
      }
      stampDepthCopy();
      if (cabinetOn()) startLoop();
    },
    refreshDepth(state) {
      const playing = isLive() || !!(run && run.dying);
      setText("depthMutoNow", playing && run.spec ? String(run.spec.id) : "0");
      setText("depthMutoCards", playing ? String(run.cards) : "0");
      const slams = el("depthMutoSlams");
      if (slams) {
        slams.textContent = playing
          ? `${run.strikes}/${run.spec.slamLimit}`
          : "—";
      }
      const bestN = Math.max(
        state.bestMutoscopeStages || 0,
        (state.bestDepth && state.bestDepth.mutoscope) || 0
      );
      setText("depthMutoBest", bestN ? String(bestN) : "—");
      const door = el("mutoscopeDoorBest");
      if (door) door.textContent = bestN ? `Stage ${bestN}` : "Stage —";
    },
    bind() {
      declareP0();
      const startBtn = el("mutoscopeStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const crankBtn = el("mutoscopeCrank");
      const clearIgnore = () => { ignorePointer = false; };
      if (crankBtn) {
        crankBtn.addEventListener("pointerdown", (ev) => {
          ignorePointer = true;
          ev.preventDefault();
          if (!isLive()) {
            punchStart();
            return;
          }
          crank();
        });
        crankBtn.addEventListener("pointerup", clearIgnore);
        crankBtn.addEventListener("pointercancel", clearIgnore);
        crankBtn.addEventListener("click", (ev) => {
          ev.preventDefault();
          if (isLive()) crank();
        });
      }
      const endGrab = (ev) => {
        clearIgnore();
        if (!isLive() || !run.ptr || !run.ptr.down) return;
        const dragging = run.ptr.dragging;
        const pick = run.ptr.pick;
        const grabCrank = run.ptr.grabCrank;
        run.ptr.down = false;
        run.ptr.dragging = false;
        run.ptr.grabCrank = false;
        setCanvasCursor(pick && pick.role === "target" ? "aim" : "");
        run.armMs = Math.max(run.armMs, 90);
        run.lastPX = null;
        run.lastPY = null;
        if (!dragging && !grabCrank) tryClick(pick || pickRole(ev));
      };
      window.addEventListener("pointerup", endGrab);
      window.addEventListener("pointercancel", endGrab);
      const canvas = el("mutoscopeCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            punchStart();
            return;
          }
          if (run.approachMs > 0) return;
          if (fromChrome(ev)) return;
          ev.preventDefault();
          const pick = pickRole(ev);
          const grabCrank = pick.role === "crank";
          run.ptr = { x: ev.clientX, y: ev.clientY, down: true, dragging: false, pick, grabCrank };
          run.lastPX = ev.clientX;
          run.lastPY = ev.clientY;
          run.armMs = Math.max(run.armMs, grabCrank ? 120 : 200);
          setCanvasCursor(pick.role === "target" || pick.role === "decoy" ? "aim" : (grabCrank ? "grabbing" : ""));
        });
        canvas.addEventListener("pointermove", notePointer, { passive: true });
        canvas.addEventListener("wheel", (ev) => {
          if (!isLive() || !cabinetOn() || run.approachMs > 0) return;
          ev.preventDefault();
          const d = Math.hypot(ev.deltaX || 0, ev.deltaY || 0);
          if (d > (run.spec && run.spec.stillPx ? run.spec.stillPx : 10)) run.moved = true;
          else run.stillMs = 0;
        }, { passive: false });
        canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());
      }
      window.addEventListener("pointermove", notePointer, { passive: true });
      window.addEventListener("keydown", (ev) => {
        if (!isLive() || !cabinetOn()) return;
        if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
        if (ev.code === "KeyC" || ev.code === "ArrowRight") {
          ev.preventDefault();
          crank();
        } else if (ev.code === "ArrowLeft") {
          ev.preventDefault();
          applyCrankSpin(run.spec && run.spec.reverseFlip ? 0.42 : -0.42);
        } else if (ev.code === "Space" || ev.key === " ") {
          ev.preventDefault();
          const heart = world && world.tableau && world.tableau.userData && world.tableau.userData.target;
          tryClick({ role: "target", object: heart });
        }
      });
      window.addEventListener("blur", () => {
        if (run && run.ptr) run.ptr.down = false;
      });
      window.addEventListener("resize", () => { if (cabinetOn()) resize(); });
      const copyBtn = el("mutoscopeChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = lastDepth();
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("mutoscopeCopied");
            if (copied) copied.hidden = false;
            setText("mutoscopeStatus", "Challenge copied");
          }, () => {
            setText("mutoscopeStatus", text);
          });
        });
      }
      stampDepthCopy();
      if (cabinetOn()) {
        ensureWorld().then(() => {
          resize();
          startLoop();
        }).catch(() => {});
      }
    },
  });
})();
