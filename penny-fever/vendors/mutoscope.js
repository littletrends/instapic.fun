/* Mutoscope Hood — Desktop Grok owns this file. PF only. Never booth/port 6000. Never Imagine.
 * GOBLIN B03 AUTHORED — GOBLIN_AUTHORED_LEVELS_B03.md + BATCH03_MOUNT_CONFIGS + RUNKIT_API.
 * Custom stillness iris + card reel. Hybrid: 8 unique rooms then ENDLESS coda (codaEnabled).
 * Authored (layout/verb, not tighter stillPx):
 *   1 Peep Lesson — teach still → open, grace slams
 *   2 Crank Parade — crank REQUIRED once or the reel stalls
 *   3 Reverse Flip — cards flip right→left
 *   4 Jump Scare Gallery — visual flash; movement still slams
 *   5 Twin Iris — two stacked windows; cards tick only when both open
 *   6 Fake Slam Tent — audio slam ×3, ignore for strike
 *   7 Blink Hood — iris auto-blinks 400ms / ~2.8s; fidget during blink slams
 *   8 Flicker Fever — stutter pause/resume; crank during stutter = poison slam
 * Coda n=9+: Endless Peep {n} (fakeSlamAudio on). Pointer stillness only (no gyro).
 * HUD = current STAGE · glory/best = stages cleared · door = Stage · death = iris slam
 * 1 coin = 1 run. coda off → souvenir. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const W = 340;
  const H = 460;
  const CX = W / 2;
  const CY = 214;
  const HOOD_R = 148;
  const GAME_ID = "mutoscope";
  const CABINET_ID = "cabinet-mutoscope";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const DEATH_HOLD_MS = 760;
  const CARD_SCORE = 40;
  const CLEAR_BONUS = 300;
  const DEPTH_BONUS = 50;

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
    tag: "DEPTH RUN · 8 authored STAGES · ENDLESS peep · not a tighter loop",
    body: "Authored rooms, not a tighter stillness loop: Peep Lesson (teach still) → Crank Parade (must crank or the reel stalls) → Reverse Flip (right→left) → Jump Scare Gallery (flash baits fidget) → Twin Iris (two windows, shared still) → Fake Slam Tent (audio lie ×3) → Blink Hood (auto-blink) → Flicker Fever (stutter; crank is poison) → ENDLESS Peep. Hold still. The iris opens. Cards tick. A fidget slams it. Depth is stages cleared.",
    status: "Depth run · START · 1 demo coin · 8 authored STAGES then ENDLESS",
    machine: "Peep hood · 1 demo coin · authored STAGES",
    idleHud: ["HOLD STILL — THE REEL ONLY LOVES STATUES", "START · 1 demo coin — fidget slams it"],
    punch: "Depth run — press START. No one-tap prize.",
  };

  const AUTHORED = [
    {
      id: 1, title: "Peep Lesson", kind: "teach",
      cardsNeeded: 4, cardMs: 900, stillPx: 14, slamLimit: 3, stillWarmupMs: 400,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: false, dualWindow: false, crankRequired: false, crankUnjam: false,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: false, poisonCrank: false,
      hitch: false, twitchWarn: true, warnFirstSlam: true, coda: false,
      barker: "HOLD STILL — THE REEL ONLY LOVES STATUES",
    },
    {
      id: 2, title: "Crank Parade", kind: "crankRequired",
      cardsNeeded: 5, cardMs: 800, stillPx: 12, slamLimit: 2, stillWarmupMs: 350,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: false, dualWindow: false, crankRequired: true, crankUnjam: true,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: false, poisonCrank: false,
      hitch: true, twitchWarn: false, warnFirstSlam: false, coda: false,
      barker: "CRANK when the reel stalls. Waiting will not unjam it.",
    },
    {
      id: 3, title: "Reverse Flip", kind: "reverseFlip",
      cardsNeeded: 6, cardMs: 700, stillPx: 10, slamLimit: 2, stillWarmupMs: 300,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: true, dualWindow: false, crankRequired: false, crankUnjam: false,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: false, poisonCrank: false,
      hitch: false, twitchWarn: false, warnFirstSlam: false, coda: false,
      barker: "The reel runs backward. Right to left. Stillness still rules.",
    },
    {
      id: 4, title: "Jump Scare Gallery", kind: "jumpScare",
      cardsNeeded: 7, cardMs: 650, stillPx: 9, slamLimit: 2, stillWarmupMs: 280,
      crankSpeedMul: 0.7, jumpScare: true, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: false, dualWindow: false, crankRequired: false, crankUnjam: false,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: false, poisonCrank: false,
      hitch: false, twitchWarn: false, warnFirstSlam: false, coda: false,
      barker: "Flash baits a fidget. Movement during the scare still slams.",
    },
    {
      id: 5, title: "Twin Iris", kind: "dualWindow",
      cardsNeeded: 6, cardMs: 880, stillPx: 10, slamLimit: 2, stillWarmupMs: 320,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: false, dualWindow: true, crankRequired: false, crankUnjam: false,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: false, poisonCrank: false,
      hitch: false, twitchWarn: false, warnFirstSlam: false, coda: false,
      barker: "Two irises. Shared stillness. Cards tick only when both are open.",
    },
    {
      id: 6, title: "Fake Slam Tent", kind: "fakeSlam",
      cardsNeeded: 7, cardMs: 620, stillPx: 9, slamLimit: 2, stillWarmupMs: 260,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: true, fakeSlamCount: 3,
      ghostPip: true,
      reverseFlip: false, dualWindow: false, crankRequired: false, crankUnjam: false,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: false, poisonCrank: false,
      hitch: false, twitchWarn: false, warnFirstSlam: false, coda: false,
      barker: "Three fake slams. Distrust the booth audio. Real fidget still kills.",
    },
    {
      id: 7, title: "Blink Hood", kind: "blinkHood",
      cardsNeeded: 8, cardMs: 600, stillPx: 8, slamLimit: 2, stillWarmupMs: 250,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: false, dualWindow: false, crankRequired: false, crankUnjam: false,
      blinkHood: true, blinkMs: 400, blinkEveryMs: 2800, stutter: false, poisonCrank: false,
      hitch: false, twitchWarn: false, warnFirstSlam: false, coda: false,
      barker: "The iris blinks shut on a timer. Stay still through the blink.",
    },
    {
      id: 8, title: "Flicker Fever", kind: "stutterPoisonCrank",
      cardsNeeded: 8, cardMs: 580, stillPx: 8, slamLimit: 2, stillWarmupMs: 240,
      crankSpeedMul: 0.7, jumpScare: false, fakeSlamAudio: false, fakeSlamCount: 0,
      reverseFlip: false, dualWindow: false, crankRequired: false, crankUnjam: false,
      blinkHood: false, blinkMs: 0, blinkEveryMs: 0, stutter: true, poisonCrank: true,
      hitch: false, twitchWarn: false, warnFirstSlam: false, coda: false,
      barker: "The reel stutters. Crank during the stutter is poison — crank lied.",
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
    { title: "Whisper", kind: "photo", src: "assets/game/Whisper_Charm/Idle.webp" },
    { title: "The Reel Itself", kind: "photo", src: "assets/game/Cabinet_of_Curios/Mutoscope_Reel.webp" },
    { title: "Aura Considers", kind: "photo", src: "assets/game/Aura_Reactions/Thinking.webp" },
    { title: "She Points", kind: "photo", src: "assets/game/Aura_Reactions/Pointing.webp" },
    { title: "Empty Hood", kind: "void" },
    { title: "An Eye Looks Back", kind: "eye" },
    { title: "Kill Screen 256", kind: "kill" },
  ];

  const IMGS = {};
  SCENES.forEach((s) => {
    if (!s.src) return;
    const im = new Image();
    im.src = s.src;
    IMGS[s.src] = im;
  });

  let run = null;
  let idleRaf = 0;
  let ignorePointer = false;

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
    setText("mutoscopeStatus", DEPTH_COPY.punch);
    const btn = el("mutoscopeStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

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
      hitch: false,
      twitchWarn: false,
      warnFirstSlam: false,
      coda: true,
      barker: "Authored reels done. ENDLESS peep. Fake slams lie. Don’t fidget.",
    };
  }

  function mutoscopeStageParams(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[stage - 1]);
    if (!CODA_ENABLED) return null;
    return mutoscopeCodaParams(stage);
  }

  function isGhostHandle(x, y) {
    return !!(isLive() && run.spec && run.spec.ghostCrank && run.ghostCrankMs > 0
      && Math.hypot(x - (W - 46), y - 368) < 32);
  }

  function hudLine(spec) {
    if (!spec) return "STAGE 0";
    if (spec.coda) return `ENDLESS · STAGE ${spec.id} · ${spec.title}`;
    return `STAGE ${spec.id} · ${spec.title}`;
  }

  function kindHint(spec) {
    if (!spec) return "HOLD STILL";
    if (spec.kind === "teach") return "HOLD STILL — FIDGET SLAMS";
    if (spec.kind === "crankRequired") return "REEL STALLS — CRANK REQUIRED";
    if (spec.kind === "reverseFlip") return "BACKWARD REEL — RIGHT TO LEFT";
    if (spec.kind === "jumpScare") return "FLASH BAITS FIDGET — MOVEMENT STILL SLAMS";
    if (spec.kind === "dualWindow") return "TWIN IRIS — BOTH MUST STAY OPEN";
    if (spec.kind === "fakeSlam") return "FAKE SLAMS LIE — REAL FIDGET KILLS";
    if (spec.kind === "blinkHood") return "BLINK SHUT — STAY STILL THROUGH IT";
    if (spec.kind === "stutterPoisonCrank") return "STUTTER — CRANK IS POISON";
    if (spec.coda) return "ENDLESS PEEP · FAKE SLAMS LIE · DON’T FIDGET";
    return "HOLD STILL — THE REEL ONLY LOVES STATUES";
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

  function tellDepth(_n) {
    if (!run) {
      paintHud();
      return;
    }
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

  function pickScene(stage, index) {
    const start = Math.min(SCENES.length - 5, (Math.max(1, stage) - 1) * 3);
    return SCENES[(start + index + SCENES.length) % SCENES.length];
  }

  function card() {
    return el("mutoscopeCard");
  }

  function stageEl() {
    return el("mutoscopeStage");
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
    crank.textContent = poison ? "CRANK?" : (need ? "CRANK" : "CRANK");
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
      stage.appendChild(hud);
    }
    if ((isLive() || (run && run.dying)) && run.spec) {
      hud.textContent = hudLine(run.spec);
      hud.hidden = false;
    } else {
      hud.textContent = "STAGE 0";
      hud.hidden = true;
    }
    syncCrank();
    return hud;
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
      tag.className = "vendor-vestibule-only pf-depth-tag";
      tag.setAttribute("role", "status");
      const readout = host.querySelector(".depth-readout");
      if (readout && readout.parentNode) readout.parentNode.insertBefore(tag, readout);
      else host.appendChild(tag);
    }
    tag.textContent = DEPTH_COPY.tag;
    host.querySelectorAll("[data-pf-depth-copy]").forEach((p) => {
      p.textContent = DEPTH_COPY.body;
    });
    const canvas = el("mutoscopeCanvas");
    if (canvas) {
      const live = isLive();
      canvas.style.pointerEvents = live ? "auto" : "none";
      canvas.style.touchAction = live ? "none" : "";
      canvas.classList.toggle("is-locked", !live);
    }
    syncCrank();
    paintHud();
    if (!isLive()) setText("mutoscopeStatus", DEPTH_COPY.status);
  }

  function drawPaper(ctx, w, h, tint) {
    ctx.fillStyle = tint || "#e6d3ae";
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "rgba(90,50,20,0.08)";
    for (let y = -h / 2; y < h / 2; y += 7) ctx.fillRect(-w / 2, y, w, 1);
    ctx.strokeStyle = "rgba(90,60,30,0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);
  }

  function drawScene(ctx, scene, w, h, stage) {
    const deep = Math.min(1, (stage - 1) / 5);
    drawPaper(ctx, w, h, `rgb(${230 - deep * 40},${211 - deep * 70},${174 - deep * 80})`);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
    ctx.clip();

    if (scene.kind === "photo") {
      const im = IMGS[scene.src];
      if (im && im.complete && im.naturalWidth) {
        const iw = im.naturalWidth;
        const ih = im.naturalHeight;
        const s = Math.max((w - 16) / iw, (h - 36) / ih);
        ctx.drawImage(im, -iw * s / 2, -ih * s / 2 - 8, iw * s, ih * s);
      } else {
        drawScene(ctx, { title: scene.title, kind: "tent" }, w, h, stage);
        ctx.restore();
        return;
      }
    } else if (scene.kind === "moon") {
      ctx.fillStyle = "#1a2238";
      ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
      ctx.fillStyle = "#f0d09a";
      ctx.beginPath();
      ctx.arc(10, -28, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a2238";
      ctx.beginPath();
      ctx.arc(20, -32, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d4a45a";
      ctx.beginPath();
      ctx.moveTo(-50, 40);
      ctx.quadraticCurveTo(0, 8, 50, 44);
      ctx.stroke();
    } else if (scene.kind === "barker") {
      ctx.fillStyle = "#2a1420";
      ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
      ctx.fillStyle = "#1a0c10";
      ctx.fillRect(-18, -8, 36, 70);
      ctx.beginPath();
      ctx.arc(0, -28, 16, 0, Math.PI * 2);
      ctx.fillStyle = "#e8d4b0";
      ctx.fill();
      ctx.fillStyle = "#12080c";
      ctx.fillRect(-22, -44, 44, 10);
      ctx.fillRect(-8, -54, 16, 12);
      ctx.strokeStyle = "#f0d09a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, -6);
      ctx.lineTo(48, -40);
      ctx.stroke();
    } else if (scene.kind === "dancer") {
      ctx.fillStyle = "#241428";
      ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
      ctx.beginPath();
      ctx.ellipse(0, 4, 38, 52, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "rgba(232,160,184,0.85)";
      ctx.beginPath();
      ctx.arc(0, -6, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(-12, 36);
      ctx.lineTo(12, 36);
      ctx.closePath();
      ctx.fill();
    } else if (scene.kind === "coin") {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
      ctx.fillStyle = "#d4a45a";
      ctx.beginPath();
      ctx.arc(0, -4, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8a6230";
      ctx.beginPath();
      ctx.arc(0, -4, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f0d09a";
      ctx.font = "18px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("1¢", 0, 2);
    } else if (scene.kind === "mercury") {
      ctx.fillStyle = "#12080c";
      ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(-10, -60, 20, 110);
      ctx.fillStyle = "#c41e3a";
      ctx.fillRect(-6, -10, 12, 52);
      ctx.beginPath();
      ctx.arc(0, 48, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (scene.kind === "curtain") {
      ctx.fillStyle = "#3a1020";
      ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
      ctx.fillStyle = "#c41e3a";
      for (let i = -3; i <= 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * 16, -70);
        ctx.quadraticCurveTo(i * 16 + 8, 0, i * 16, 70);
        ctx.lineTo(i * 16 + 14, 70);
        ctx.quadraticCurveTo(i * 16 + 22, 0, i * 16 + 14, -70);
        ctx.fill();
      }
    } else if (scene.kind === "stars") {
      ctx.fillStyle = "#0a1020";
      ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
      ctx.fillStyle = "#f0d09a";
      for (let i = 0; i < 18; i += 1) {
        const x = ((i * 47) % 110) - 55;
        const y = ((i * 29) % 120) - 60;
        ctx.globalAlpha = 0.4 + (i % 5) * 0.12;
        ctx.beginPath();
        ctx.arc(x, y, 1.4 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (scene.kind === "flash") {
      ctx.fillStyle = "#fff6ec";
      ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
      ctx.fillStyle = "#12080c";
      ctx.beginPath();
      ctx.arc(0, -8, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d4a45a";
      ctx.beginPath();
      ctx.arc(0, -8, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (scene.kind === "penny") {
      ctx.fillStyle = "#2a1810";
      ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
      ctx.fillStyle = "#b87333";
      ctx.beginPath();
      ctx.arc(0, -2, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f0d09a";
      ctx.beginPath();
      ctx.arc(0, -2, 32, 0, Math.PI * 2);
      ctx.stroke();
    } else if (scene.kind === "void") {
      ctx.fillStyle = "#050308";
      ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
      ctx.strokeStyle = "rgba(212,164,90,0.25)";
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.stroke();
    } else if (scene.kind === "eye") {
      ctx.fillStyle = "#12080c";
      ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
      ctx.fillStyle = "#f0d09a";
      ctx.beginPath();
      ctx.ellipse(0, 0, 52, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3d8a8a";
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0a0508";
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (scene.kind === "kill") {
      ctx.fillStyle = "#1a0508";
      ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
      ctx.fillStyle = "#c41e3a";
      ctx.font = "bold 42px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("256", 0, 8);
    } else {
      ctx.fillStyle = "#2a1420";
      ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
      ctx.fillStyle = "#c41e3a";
      ctx.beginPath();
      ctx.moveTo(-54, 48);
      ctx.lineTo(0, -40);
      ctx.lineTo(54, 48);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#12080c";
      ctx.fillRect(-10, 18, 20, 30);
    }
    ctx.restore();

    ctx.fillStyle = "rgba(18,8,12,0.72)";
    ctx.fillRect(-w / 2, h / 2 - 28, w, 28);
    ctx.fillStyle = "#f0d09a";
    ctx.font = "11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(scene.title, 0, h / 2 - 10);
  }

  function drawCardFace(ctx, scene, stage, flip) {
    const w = 168;
    const h = 210;
    const sx = Math.max(0.04, Math.abs(flip)) * (flip < 0 ? -1 : 1);
    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(sx, 1);
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 18;
    drawScene(ctx, scene, w, h, stage);
    ctx.restore();
  }

  function irisWindows(spec) {
    if (spec && spec.dualWindow) {
      return [
        { x: CX, y: CY - 78, r: 72 },
        { x: CX, y: CY + 86, r: 72 },
      ];
    }
    return [{ x: CX, y: CY, r: HOOD_R - 10 }];
  }

  function drawIrisAt(ctx, x, y, r, open, slam) {
    const blades = 6;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();

    const cover = 1 - open;
    for (let i = 0; i < blades; i += 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((i / blades) * Math.PI * 2 + cover * 0.62 + (slam ? 0.18 : 0));
      ctx.translate(r * (0.28 + open * 0.7), 0);
      ctx.rotate(0.62);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.56, r * (0.15 + cover * 0.2), 0, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? "#241014" : "#160a0e";
      ctx.fill();
      ctx.strokeStyle = "rgba(212,164,90,0.38)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }

    const hole = r * (0.05 + open * 0.78);
    ctx.beginPath();
    ctx.arc(x, y, hole, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(240,208,154,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = Math.max(6, r * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r + 8, 0, Math.PI * 2);
    ctx.strokeStyle = "#3a2418";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r + 13, 0, Math.PI * 2);
    ctx.strokeStyle = "#8a6230";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    const rivets = specDual() ? 6 : 8;
    for (let i = 0; i < rivets; i += 1) {
      const a = (i / rivets) * Math.PI * 2 + 0.2;
      const rr = r + 13;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = "#d4a45a";
      ctx.fill();
    }
  }

  function specDual() {
    return !!(run && run.spec && run.spec.dualWindow);
  }

  function drawIris(ctx, open, slam) {
    const spec = run ? run.spec : mutoscopeStageParams(1);
    irisWindows(spec).forEach((w) => drawIrisAt(ctx, w.x, w.y, w.r, open, slam));
  }

  function drawHoodShell(ctx) {
    const g = ctx.createRadialGradient(CX - 30, CY - 40, 20, CX, CY, 210);
    g.addColorStop(0, "#2a1814");
    g.addColorStop(0.55, "#160a0c");
    g.addColorStop(1, "#0a0508");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#1a0c10";
    ctx.beginPath();
    ctx.ellipse(CX, CY + 8, 168, 176, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5a3a24";
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.save();
    ctx.fillStyle = "#3a2418";
    ctx.fillRect(28, 392, W - 56, 48);
    ctx.strokeStyle = "#d4a45a";
    ctx.strokeRect(28.5, 392.5, W - 57, 47);
    ctx.fillStyle = "#f0d09a";
    ctx.font = "11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("AURA MUTOSCOPE  ·  No. 14", CX, 412);
    ctx.fillStyle = "#d4a45a";
    ctx.font = "10px Georgia, serif";
    ctx.fillText("stillness opens  ·  fidget slams", CX, 428);
    ctx.restore();

    ctx.save();
    ctx.translate(W - 46, 368);
    const ghost = !!(run && run.spec && run.spec.ghostCrank && run.ghostCrankMs > 0);
    ctx.rotate(-0.45 + (ghost ? Math.sin(performance.now() / 40) * 0.55 : 0));
    ctx.fillStyle = ghost ? "#f0d09a" : "#8a6230";
    ctx.fillRect(-4, -28, 8, 32);
    ctx.beginPath();
    ctx.arc(0, -32, 10, 0, Math.PI * 2);
    ctx.fillStyle = ghost ? "#fff6ec" : "#d4a45a";
    ctx.fill();
    ctx.strokeStyle = "#f0d09a";
    ctx.lineWidth = ghost ? 2.4 : 1.4;
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const canvas = el("mutoscopeCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    drawHoodShell(ctx);

    const spec = run ? run.spec : mutoscopeStageParams(1);
    const now = performance.now();
    let open = 0.1 + Math.sin(now / 900) * 0.05;
    let idleScene = null;
    let idleSlam = false;
    if (run) {
      open = run.aperture;
      if (run.blinkMs > 0) open = Math.max(0.05, open * 0.12);
      if (run.fakeMs > 0) open = Math.max(0.08, open - 0.55);
      if (run.hitchT > 0 || run.hitchLock) open = Math.max(0.2, open - 0.08);
      if (run.stutterT > 0) open = Math.max(0.22, open - 0.12);
    } else {
      const beat = Math.floor((now / 2200) % 6);
      if (beat === 0) open = 0.08;
      else if (beat === 1) open = 0.82;
      else if (beat === 2) { open = 0.78; idleScene = SCENES[2]; }
      else if (beat === 3) { open = 0.7; idleScene = SCENES[3]; idleSlam = false; }
      else if (beat === 4) { open = 0.22; idleSlam = true; idleScene = SCENES[8]; }
      else { open = 0.55 + Math.sin(now / 180) * 0.22; idleScene = SCENES[0]; }
    }
    const slam = !!(run && (run.slamming || run.fakeMs > 0 || run.breatheMs > 0)) || idleSlam;

    ctx.save();
    ctx.beginPath();
    irisWindows(spec).forEach((w) => {
      ctx.moveTo(w.x + w.r - 2, w.y);
      ctx.arc(w.x, w.y, w.r - 2, 0, Math.PI * 2);
    });
    ctx.clip();
    ctx.fillStyle = "#0a0508";
    ctx.fillRect(0, 0, W, H);

    if (run && run.scene) {
      if (run.hitchT > 0 || run.hitchLock || run.stutterT > 0) {
        const k = performance.now() / 40;
        ctx.translate(Math.sin(k) * 9, Math.cos(k * 0.5) * 2);
      }
      const flipping = run.flipT > 0;
      const hitchBack = run.hitchLock || run.hitchT > 90;
      const dir = spec.reverseFlip ? -1 : 1;
      if (flipping) {
        const ft = run.flipT / 160;
        if (ft < 0.5) drawCardFace(ctx, run.prevScene || run.scene, spec.id, dir * (1 - ft * 2));
        else drawCardFace(ctx, run.scene, spec.id, dir * (ft * 2 - 1));
      } else if (hitchBack) {
        drawCardFace(ctx, run.prevScene || run.scene, spec.id, dir * (0.72 + (run.hitchT / 240) * 0.28));
      } else {
        drawCardFace(ctx, run.scene, spec.id, dir);
      }
      if (run.flashMs > 0) {
        ctx.fillStyle = `rgba(255,246,236,${kit.clamp(run.flashMs / 180, 0, 0.92)})`;
        ctx.fillRect(0, 0, W, H);
      }
    } else if (idleScene) {
      const t = performance.now();
      const beat = Math.floor((t / 2200) % 6);
      if (beat === 2) ctx.translate(Math.sin(t / 52) * 18, Math.cos(t / 74) * 11);
      if (beat === 3) ctx.translate(Math.sin(t / 40) * 9, Math.cos(t / 80) * 2);
      drawCardFace(ctx, idleScene, 1, 1);
      if (beat === 4) {
        ctx.fillStyle = "rgba(255,246,236,0.55)";
        ctx.fillRect(0, 0, W, H);
      }
    } else {
      ctx.fillStyle = "rgba(240,208,154,0.12)";
      ctx.font = "13px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("the reel only loves statues", CX, CY);
    }
    ctx.restore();

    drawIris(ctx, Math.max(0, Math.min(1, open)), slam);

    if (run && run.twitchMs > 0 && !run.slamming) {
      ctx.beginPath();
      ctx.arc(CX, CY, HOOD_R - 6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(212,164,90,${kit.clamp(run.twitchMs / 220, 0, 0.85)})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, "SLAM");
    else if (run && run.fakeStampMs > 0 && !run.closedStamp) {
      ctx.save();
      ctx.globalAlpha = kit.clamp(run.fakeStampMs / 260, 0, 0.82);
      kit.stampClosed(ctx, W, H, "SLAM?");
      ctx.restore();
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    if (isLive() || (run && run.dying)) {
      const stillHint = run.irisOpen
        ? ((run.hitchLock || run.hitchT > 0)
          ? (spec.crankRequired ? "Iris open — reel STALLED — CRANK" : "Iris open — hitch is a JAM — DON'T CHASE")
          : (run.stutterT > 0
            ? (spec.poisonCrank ? "Stutter — CRANK IS POISON" : "Reel stutter — wait it out")
            : (run.blinkMs > 0
              ? "Blink — stay still. Fidget still slams."
              : (run.fakeMs > 0 || run.fakeStampMs > 0
                ? "Fake slam — NOT a strike — DON'T FLINCH"
                : (run.flashMs > 0
                  ? "Flash — movement still slams"
                  : (run.twitchMs > 0 ? "Twitching — hold the statue" : kindHint(spec)))))))
        : (run.twitchMs > 0
          ? "Twitching — stillness delayed"
          : `Hold still · ${Math.max(0, spec.stillWarmupMs - run.stillMs) | 0}ms`);
      kit.drawHud(ctx, W, [
        `${hudLine(spec)} · ${run.stageCards}/${spec.cardsNeeded} · slam ${run.strikes}/${spec.slamLimit}`,
        stillHint,
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
    const tick = () => {
      if (isLive()) {
        idleRaf = 0;
        return;
      }
      draw();
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }

  function fromCrank(ev) {
    const t = ev && (ev.target || ev.srcElement);
    if (!t || !t.closest) return false;
    return !!t.closest("#mutoscopeCrank, #mutoscopeStart, #mutoscopeChallenge, .vendor-actions, .vendor-result, .interior-back, .interior-header, button, a");
  }

  function inCrank(x, y) {
    if (isGhostHandle(x, y)) return false;
    return Math.hypot(x - (W - 46), y - 368) < 28;
  }

  function overChrome(ev) {
    if (fromCrank(ev)) return true;
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

  function notePointer(ev) {
    if (!isLive() || !cabinetOn() || ignorePointer) return;
    if (overChrome(ev)) {
      run.lastPX = ev.clientX;
      run.lastPY = ev.clientY;
      run.armMs = Math.max(run.armMs, 90);
      return;
    }
    const canvas = el("mutoscopeCanvas");
    if (canvas && ev.clientX != null && kit && typeof kit.canvasPos === "function") {
      const p = kit.canvasPos(canvas, ev, W, H);
      if (isGhostHandle(p.x, p.y)) {
        run.armMs = 0;
        run.moved = true;
        run.moveBurst = (run.spec && run.spec.stillPx ? run.spec.stillPx : 10) + 1;
        return;
      }
      if (inCrank(p.x, p.y)) {
        run.lastPX = ev.clientX;
        run.lastPY = ev.clientY;
        run.armMs = Math.max(run.armMs, 90);
        return;
      }
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
    if (d > run.spec.stillPx) {
      run.moved = true;
      run.moveBurst = d;
    } else if (run.spec.twitchWarn && d > run.spec.stillPx * 0.38) {
      run.twitchMs = 220;
      if (!run.irisOpen) run.stillMs = Math.max(0, (run.stillMs || 0) * 0.55);
    }
  }

  function openIris() {
    if (!isLive() || run.irisOpen || run.slamming) return;
    run.irisOpen = true;
    run.opening = true;
    run.armMs = Math.max(run.armMs, 90);
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
    let crankNote = "Optional crank.";
    if (run.spec.crankRequired) crankNote = "Crank when the reel stalls.";
    else if (run.spec.poisonCrank) crankNote = "Don't crank the stutter.";
    setText("mutoscopeStatus", `${run.spec.title} — iris open · ${peep}. Don't fidget. ${crankNote}`);
    stampDepthCopy();
  }

  function slam() {
    if (!isLive() || run.slamming) return;
    if (run.armMs > 0) return;
    run.slamming = true;
    run.irisOpen = false;
    run.opening = false;
    run.stillMs = 0;
    run.moved = false;
    run.pendingFake = 0;
    run.fakeMs = 0;
    run.fakeStampMs = 0;
    run.breatheMs = 0;
    run.hitchT = 0;
    run.hitchLock = false;
    run.stutterT = 0;
    setEyed(false);
    kit.sfx("stamp");
    setText("mutoscopeStatus", "FIDGET — the iris slams shut.");
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
    if (!isLive() || !run.irisOpen || run.slamming) return;
    if (run.spec.poisonCrank && run.stutterT > 0) {
      run.armMs = 0;
      setText("mutoscopeStatus", "Crank lied. The stutter was poison.");
      slam();
      return;
    }
    if (run.spec.crankRequired && (run.hitchLock || run.hitchT > 0)) {
      run.hitchT = 0;
      run.hitchLock = false;
      run.crankedStage = true;
      run.armMs = Math.max(run.armMs, 160);
      run.lastPX = null;
      run.lastPY = null;
      run.moved = false;
      kit.sfx("spinner");
      setText("mutoscopeStatus", "Crank — reel moving again. Don’t fidget.");
      stampDepthCopy();
      return;
    }
    if (run.crankedThisCard) return;
    run.crankedThisCard = true;
    const base = run.spec.cardMs;
    const used = Math.max(0, (run.cardMsNow || base) - run.cardWait);
    run.cardMsNow = base * run.spec.crankSpeedMul;
    run.cardWait = Math.max(0, run.cardMsNow - used);
    run.armMs = Math.max(run.armMs, 140);
    run.lastPX = null;
    run.lastPY = null;
    run.moved = false;
    kit.sfx("spinner");
    setText("mutoscopeStatus", "Crank — faster card. Don't move.");
    stampDepthCopy();
  }

  function creditCard() {
    run.stageCards += 1;
    run.cards += 1;
    run.score += CARD_SCORE;
    if (run.kitRun) run.kitRun.score = run.score;
    kit.sfx("flip");
    setText("mutoscopeStatus", `${run.spec.title} · card ${run.stageCards} / ${run.spec.cardsNeeded}`);
    stampDepthCopy();
    if (run.stageCards >= run.spec.cardsNeeded) {
      clearStage();
      return;
    }
    run.prevScene = run.scene;
    run.scene = pickScene(run.spec.id, run.cards);
    run.flipT = 160;
    run.crankedThisCard = false;
    if (!run.spec.crankRequired) {
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
    run.scene = pickScene(spec.id, run.cards);
    run.prevScene = run.scene;
    setEyed(false);
    setFlash(false);
    paintPipsLimit(spec.slamLimit);
    setPips(0);
    stampDepthCopy();
    setText("mutoscopeStatus", spec.barker || `${spec.title} — hold still.`);
    tellDepth();
  }

  function start() {
    if (isLive()) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("mutoscopeStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      return;
    }
    stopIdle();
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
      scene: pickScene(1, 0),
      prevScene: pickScene(1, 0),
      last: 0,
      raf: 0,
    };
    beginStage(1);
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
    setText("mutoscopeStatus", run.spec.barker || "HOLD STILL — THE REEL ONLY LOVES STATUES");
    PF.focusCard("mutoscopeCard", true);
    PF.setAura("think");
    setEyed(false);
    setFlash(false);
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
    if (run.dying) {
      run.deathHold = Math.max(0, (run.deathHold || 0) - dt);
      paintHud();
      if (run.deathHold <= 0) sealResult(run.deathNote || "iris slam");
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

    const want = run.slamming ? 0 : (run.blinkMs > 0 ? 0.08 : (run.irisOpen ? 1 : (run.stillMs > 80 ? 0.06 : 0)));
    const rate = run.slamming ? 0.014 : (run.irisOpen ? 0.008 : 0.01);
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

    if (run.moved) {
      run.moved = false;
      run.stillMs = 0;
      if (run.irisOpen) {
        slam();
        return;
      }
    } else {
      run.stillMs += dt;
      if (!run.irisOpen && run.stillMs >= run.spec.stillWarmupMs) openIris();
    }

    if (run.irisOpen && !run.slamming && run.aperture > 0.55) {
      if (run.spec.crankRequired && !run.hitchDone && run.stageCards >= 1
          && run.cardWait < run.cardMsNow * 0.62
          && run.cardWait > run.cardMsNow * 0.22) {
        run.hitchDone = true;
        run.hitchT = 280;
        run.hitchLock = true;
        kit.sfx("spit");
        setText("mutoscopeStatus", "CRANK — the reel stalls until you crank.");
        syncCrank();
      }
      if (run.spec.stutter && run.stutterCool <= 0 && run.stutterT <= 0
          && !run.hitchLock && run.hitchT <= 0 && run.blinkMs <= 0
          && run.cardWait < run.cardMsNow * 0.72
          && run.cardWait > run.cardMsNow * 0.18) {
        run.stutterT = 420 + Math.random() * 180;
        run.stutterCool = 1500 + Math.random() * 700;
        kit.sfx("spit");
        setText("mutoscopeStatus", run.spec.poisonCrank
          ? "Reel stutter — don’t crank. Crank lied."
          : "Reel stutter — wait it out.");
        syncCrank();
      }
      if (run.spec.blinkHood && run.blinkCool <= 0 && run.blinkMs <= 0
          && !run.hitchLock && run.stutterT <= 0) {
        run.blinkMs = run.spec.blinkMs || 400;
        run.blinkCool = run.spec.blinkEveryMs || 2800;
        setText("mutoscopeStatus", "Blink — stay still. Fidget still slams.");
      }
      if (run.spec.ghostCrank && run.ghostCrankCool <= 0 && run.ghostCrankMs <= 0 && run.hitchT <= 0 && !run.hitchLock) {
        run.ghostCrankMs = 560;
        run.ghostCrankCool = 1400 + Math.random() * 900;
        setText("mutoscopeStatus", "Ghost HANDLE. Reaching slams. HTML crank is real.");
      }
      /* Hitch lock pauses until crank. Stutter pauses then resumes. Blink pauses cards. */
      if (run.hitchT <= 0 && !run.hitchLock && run.stutterT <= 0 && run.blinkMs <= 0) {
        run.cardWait -= dt;
        if (run.cardWait <= 0) creditCard();
      }
    }
    paintHud();
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (depth <= 0 && reason !== "souvenir") return AURA.shallow;
    if (run && run.spec && (reason === "iris slam" || reason === "slam")) {
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
    setEyed(false);
    setFlash(false);
    if (run.closedStamp) kit.sfx("pit");
    stampDepthCopy();
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    if (run.raf) cancelAnimationFrame(run.raf);
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
    draw();
    startIdle();
  }

  PF.registerVendor({
    id: "mutoscope",
    playKey: "mutoscope",
    chalk: "HOLD STILL — THE REEL ONLY LOVES STATUES",
    defaults: { bestMutoscopeStages: 0, bestMutoscopeCards: 0, bestMutoscopeScore: 0 },
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
      stampDepthCopy();
      startIdle();
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
      window.addEventListener("pointerup", clearIgnore);
      window.addEventListener("pointercancel", clearIgnore);
      const canvas = el("mutoscopeCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            punchStart();
            return;
          }
          ev.preventDefault();
          const p = kit.canvasPos(canvas, ev, W, H);
          if (isGhostHandle(p.x, p.y)) {
            ev.preventDefault();
            run.armMs = 0;
            slam();
            return;
          }
          run.lastPX = ev.clientX;
          run.lastPY = ev.clientY;
          run.armMs = Math.max(run.armMs, 80);
          if (inCrank(p.x, p.y)) {
            ignorePointer = true;
            crank();
            return;
          }
        });
        canvas.addEventListener("pointerup", () => {
          if (!isLive()) return;
          run.armMs = Math.max(run.armMs, 100);
          run.lastPX = null;
          run.lastPY = null;
        });
        canvas.addEventListener("pointerleave", () => {
          if (!isLive()) return;
          run.armMs = Math.max(run.armMs, 90);
          run.lastPX = null;
          run.lastPY = null;
        });
        canvas.addEventListener("pointermove", notePointer, { passive: true });
        canvas.addEventListener("wheel", (ev) => {
          if (!isLive() || !cabinetOn()) return;
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
        if (ev.code === "KeyC" || ev.code === "Space" || ev.key === " ") {
          ev.preventDefault();
          crank();
        }
      });
      window.addEventListener("blur", () => {
        if (isLive() && cabinetOn() && run.irisOpen) slam();
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && isLive() && cabinetOn() && run.irisOpen) slam();
      });
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
      startIdle();
    },
  });
})();
