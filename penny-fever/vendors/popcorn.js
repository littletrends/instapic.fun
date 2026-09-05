/* Popcorn Kettle — Desktop Grok owns this file. PF only. Never booth/port 6000. Never Imagine.
 * GOBLIN B04 AUTHORED — GOBLIN_AUTHORED_LEVELS_B04.md · hybrid + codaEnabled.
 * 8 unique batches (cadence / lie / filter / remap), NOT hitMs-only climb. Coda = Steam Lie {n}.
 * TimingTap pop-event schedule. Stall owns burn/fake_tap death; engine cannot steal the run.
 * Authored: Honest Kernels → Double Burst → Steam Gallery → Silent Pop Lane → Lid Bounce → Colour Call Kettle → Mirror Tap → Fever Kernel Opera → ENDLESS Steam Lie {n}
 * HUD = current BATCH (playing) · glory/best = batches cleared · death = burn | fake_tap
 * burnsToDeath 3 is RUN-WIDE. Pips = burns. Fake tap ≠ miss.
 * Don’t: hold-to-auto-catch. Death hold ≥700ms. Discrete tap only — no hold-repeat.
 * Vestibule: TAP THE POP — IGNORE THE STEAM. coda off → souvenir after Fever Kernel Opera. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const W = 340;
  const H = 460;
  const GAME_ID = "popcorn";
  const KETTLE = { x: 170, y: 268, r: 78 };
  const TAP_LOCK_MS = 110;
  const MISS_LOCK_MS = 120;
  const CATCH_SCORE = 15;
  const CLEAR_BONUS = 300;
  const BURNS_TO_DEATH = 3;
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
  let idleBits = [];
  let idleNextAt = 0;
  let idleLidLie = false;
  let idleLidUntil = -1;
  let idleLidBump = 0;

  const AURA = {
    burn: "Aura: That was steam, sugar.",
    fake: "Aura: Steam fake. Kernel laughed.",
    batch: (n) => `Aura: BATCH ${n}. Burns ate the kettle run.`,
    clear: "Aura: True pops only. Gap shrinks.",
    deep: (n) => `Aura: Stage ${n}. You're reading the kettle's lies.`,
    leave: "Aura: Left the kettle. Kernels kept lying.",
    shallow: "Aura: Not a true pop. The steam got there first.",
    souvenir: "Aura: Steam Lie souvenir. The kettle cooled for you.",
  };

  const AUTHORED = [
    {
      id: 1, title: "Honest Kernels", kind: "steady",
      need: 8, hitMs: 140, popGapMs: 700, fakeChance: 0, burnsToDeath: BURNS_TO_DEATH,
      barker: "Even pops. No steam. Tap the gold ring.",
    },
    {
      id: 2, title: "Double Burst", kind: "doublePop",
      need: 10, hitMs: 140, popGapMs: 680, fakeChance: 0, burnsToDeath: BURNS_TO_DEATH,
      doubleBurst: true, doubleMs: 280,
      barker: "Every third event is a double. Two taps. Singles still count.",
    },
    {
      id: 3, title: "Steam Gallery", kind: "fakeSteam",
      need: 12, hitMs: 130, popGapMs: 620, fakeChance: 0.22, burnsToDeath: BURNS_TO_DEATH,
      kernelFlash: true,
      barker: "Steam puffs. Grey is a liar. Kernel flash is true.",
    },
    {
      id: 4, title: "Silent Pop Lane", kind: "silentPop",
      need: 12, hitMs: 130, popGapMs: 600, fakeChance: 0.16, burnsToDeath: BURNS_TO_DEATH,
      silent: true, kernelFlash: true,
      barker: "Half the pops go quiet. Trust the flash, not the tick.",
    },
    {
      id: 5, title: "Lid Bounce", kind: "lidBounce",
      need: 14, hitMs: 120, popGapMs: 580, fakeChance: 0, burnsToDeath: BURNS_TO_DEATH,
      lidBounce: true, freezeMs: 600,
      barker: "Lid clacks, freeze, then three rapid pops. Don’t tap the freeze.",
    },
    {
      id: 6, title: "Colour Call Kettle", kind: "colourCall",
      need: 10, hitMs: 120, popGapMs: 560, fakeChance: 0, burnsToDeath: BURNS_TO_DEATH,
      colourCall: true, callColour: "yellow",
      barker: "Posted colour only. Wrong-colour true pop is a soft burn.",
    },
    {
      id: 7, title: "Mirror Tap", kind: "mirrorTap",
      need: 14, hitMs: 120, popGapMs: 560, fakeChance: 0, burnsToDeath: BURNS_TO_DEATH,
      mirrorTap: true, sides: true,
      barker: "MIRROR stretch — tap the other side of the kettle.",
    },
    {
      id: 8, title: "Fever Kernel Opera", kind: "comboFinale",
      need: 16, hitMs: 110, popGapMs: 540, fakeChance: 0.18, burnsToDeath: BURNS_TO_DEATH,
      silent: true, lidBounce: true, doubleBurstFinale: true, kernelFlash: true, freezeMs: 600,
      barker: "Steam, silent, lid bounce, double-burst finale. Gauntlet.",
    },
  ];

  const P0_MOUNT = {
    engine: "TimingTap",
    displayName: "Popcorn Kettle",
    depthUnit: "Batch",
    sheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored BATCHES then ENDLESS · tap true pops · steam fakes strike",
    body: "Authored rooms, not a thinner loop: Honest Kernels → Double Burst → Steam Gallery → Silent Pop Lane → Lid Bounce → Colour Call Kettle → Mirror Tap → Fever Kernel Opera → ENDLESS Steam Lie. Tap the pop. Miss, early, or late burns. Steam scores nothing. Doubles, silent pops, lid freeze, colour filter, mirror tap — not a tighter window. No hold-to-auto-catch.",
    status: "Depth run · START · 1 demo coin · 8 authored BATCHES then ENDLESS",
    machine: "Hot kettle · 1 demo coin · 8 authored BATCHES",
    idleHud: ["TAP THE POP — IGNORE THE STEAM", "START · 1 demo coin — only true pops count"],
    punch: "Depth run — press START. Tap the pop, not the steam.",
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
  function popcornMountParams(n) {
    const t = n - 1;
    if (n === 1) {
      return { id: 1, title: "First Pops", need: 8, hitMs: 140, popGapMs: 700, fakeChance: 0, burnsToDeath: BURNS_TO_DEATH };
    }
    if (n === 2) {
      return { id: 2, title: "Hotter Gap", need: 10, hitMs: 120, popGapMs: 620, fakeChance: 0, burnsToDeath: BURNS_TO_DEATH };
    }
    if (n === 3) {
      return { id: 3, title: "Steam Lies", need: 12, hitMs: 110, popGapMs: 560, fakeChance: 0.15, burnsToDeath: BURNS_TO_DEATH };
    }
    if (n === 4) {
      return { id: 4, title: "False Puff", need: 14, hitMs: 100, popGapMs: 500, fakeChance: 0.22, burnsToDeath: BURNS_TO_DEATH };
    }
    if (n === 5) {
      return { id: 5, title: "Kettle Rush", need: 16, hitMs: 90, popGapMs: 450, fakeChance: 0.28, burnsToDeath: BURNS_TO_DEATH };
    }
    return {
      id: n,
      title: "Burn Batch",
      need: 16 + 2 * t,
      hitMs: Math.max(55, 90 - 4 * t),
      popGapMs: Math.max(300, 450 - 20 * t),
      fakeChance: Math.min(0.45, 0.28 + 0.03 * t),
      burnsToDeath: BURNS_TO_DEATH,
    };
  }

  function popcornCoda(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const mount = popcornMountParams(stage);
    return Object.assign({}, mount, {
      id: stage,
      title: `Steam Lie ${stage}`,
      kind: "coda",
      stagger: true,
      twin: true,
      lidLie: true,
      fakeChance: Math.min(0.45, 0.28 + 0.03 * (stage - 1)),
      coda: true,
      barker: `ENDLESS — Steam Lie ${stage}. Read the kettle.`,
    });
  }

  function popcornStageParams(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[stage - 1]);
    if (!CODA_ENABLED) return null;
    return popcornCoda(stage);
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun || typeof kitRun.declare !== "function") return;
    try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: popcornStageParams,
      codaParams: popcornCoda,
      mountParams: popcornMountParams,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function card() {
    return el("popcornCard");
  }

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function attractSpec() {
    return popcornStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function liveSpec() {
    if (run && run.spec) return run.spec;
    return attractSpec();
  }

  function roomTell(spec) {
    if (!spec) return "TAP THE POP";
    if (spec.kind === "coda") return "ENDLESS — STEAM LIE CLIMB";
    if (spec.kind === "comboFinale") return "STEAM + SILENT + LID + DOUBLE FINALE";
    if (spec.mirrorTap) return "MIRROR STRETCH — TAP THE OTHER SIDE";
    if (spec.colourCall) return "POSTED COLOUR ONLY — WRONG TINT BURNS";
    if (spec.lidBounce) return "LID CLACK → FREEZE → THREE RAPID POPS";
    if (spec.silent) return "HALF THE POPS ARE QUIET — TRUST EYES";
    if (spec.fakeChance > 0) return "GREY STEAM LIES — KERNEL FLASH COUNTS";
    if (spec.doubleBurst) return "EVERY THIRD EVENT IS A DOUBLE";
    return "EVEN POPS · TAP THE GOLD RING";
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
    ctx.fillText(spec.coda ? "ENDLESS BATCH" : "AUTHORED BATCH", W / 2, 170);
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
    else if (spec.mirrorTap) col = "rgba(184,232,224,0.08)";
    else if (spec.colourCall) col = "rgba(240,208,154,0.10)";
    else if (spec.lidBounce) col = "rgba(230,230,230,0.08)";
    else if (spec.silent) col = "rgba(12,6,9,0.10)";
    else if (spec.fakeChance > 0) col = "rgba(230,230,230,0.06)";
    else if (spec.doubleBurst) col = "rgba(232,140,40,0.08)";
    else if (spec.coda) col = "rgba(196,30,58,0.08)";
    if (!col) return;
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, W, H);
  }

  function cabinetOn() {
    const node = document.getElementById("cabinet-popcorn");
    return !!(node && !node.hidden);
  }

  function hudLine(spec, playing) {
    if (!spec) return "BATCH 0";
    if (spec.coda) return `ENDLESS · BATCH ${playing} · ${spec.title}`;
    return `BATCH ${playing} · ${spec.title}`;
  }

  function cheatLabel(spec) {
    if (!spec) return "";
    if (spec.kind === "coda") return "STEAM LIE";
    if (spec.kind === "comboFinale") return "KERNEL OPERA";
    if (spec.mirrorTap) return "MIRROR TAP";
    if (spec.colourCall) return "COLOUR CALL";
    if (spec.lidBounce) return "LID BOUNCE";
    if (spec.silent) return "SILENT POPS";
    if (spec.kind === "fakeSteam" || spec.fakeChance > 0) return "STEAM LIES";
    if (spec.doubleBurst) return "DOUBLE BURST";
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
      hud.textContent = "BATCH 0";
      hud.hidden = true;
    }
    return hud;
  }

  function ensurePips() {
    const stage = stageEl();
    if (!stage) return;
    let span = stage.querySelector("[data-runkit-strikes]");
    if (!span) {
      span = document.createElement("span");
      span.className = "strike-pips";
      span.dataset.runkitStrikes = GAME_ID;
      span.setAttribute("aria-hidden", "true");
      span.innerHTML = "<i></i><i></i><i></i>";
      stage.appendChild(span);
    }
    if (run) {
      const lit = run.burns | 0;
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
      deathReason: partial.deathReason || "burn",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestPopcorn = Math.max(state.bestPopcorn || 0, payload.depth);
      state.bestPopcornScore = Math.max(state.bestPopcornScore || 0, payload.score);
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
    return Math.max(state.bestPopcorn || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }

  function tellStrike(reason) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportStrike !== "function") return;
    try { rk().reportStrike(run.kitRun, reason); } catch (_) { /* pips */ }
    ensurePips();
  }

  function popSide(spec, i) {
    if (!spec.sides && !spec.mirrorTap) return null;
    return i % 2 === 0 ? "L" : "R";
  }

  function popColour(spec, i) {
    if (!spec.colourCall) return null;
    return i % 2 === 0 ? "yellow" : "red";
  }

  function makeEvent(at, extra) {
    return Object.assign({ at, fake: false, resolved: false, fired: false, silent: false, colour: null, side: null, double: false }, extra || {});
  }

  function buildSchedule(spec, now) {
    const events = [];
    let t = now + spec.popGapMs * 0.7;
    let trues = 0;
    let slot = 0;
    const want = spec.need + 4;
    let guard = 0;
    while (trues < want && guard < 90) {
      guard += 1;
      slot += 1;
      const fake = spec.fakeChance > 0 && Math.random() < spec.fakeChance && trues > 0;
      const doubleNow = !fake && spec.doubleBurst && slot % 3 === 0 && trues + 2 <= want + 2;
      if (doubleNow) {
        const gap = spec.doubleMs || 280;
        events.push(makeEvent(t, { double: true, burst: 1, colour: popColour(spec, trues), side: popSide(spec, trues), silent: !!(spec.silent && trues % 2 === 1) }));
        events.push(makeEvent(t + gap, { double: true, burst: 2, colour: popColour(spec, trues + 1), side: popSide(spec, trues + 1), silent: false }));
        trues += 2;
        t += spec.popGapMs + gap * 0.2;
        continue;
      }
      events.push(makeEvent(t, {
        fake,
        colour: fake ? null : popColour(spec, trues),
        side: popSide(spec, slot),
        silent: !!(!fake && spec.silent && trues % 2 === 1),
      }));
      if (!fake) {
        trues += 1;
        if (spec.twin && Math.random() < 0.58) {
          events.push(makeEvent(t + Math.max(70, spec.hitMs * 0.72), { fake: true, twin: true }));
        }
      }
      let gap = spec.popGapMs;
      if (spec.stagger) gap = (events.length % 2 === 0) ? spec.popGapMs * 0.46 : spec.popGapMs * 1.52;
      t += gap + spec.popGapMs * (0.12 * (Math.random() - 0.5));
    }
    return events;
  }

  function remainingTrues() {
    if (!run || !run.queue) return 0;
    return run.queue.filter((e) => !e.resolved && !e.fake).length;
  }

  function topUpSchedule(spec) {
    if (!isLive() || !run) return;
    if (run.frozenUntil > run.t) return;
    const needLeft = Math.max(0, spec.need - run.catches);
    let extra = needLeft + 3 - remainingTrues();
    if (extra <= 0) return;
    let t = run.t + spec.popGapMs;
    const last = run.queue[run.queue.length - 1];
    if (last && last.at + spec.popGapMs * 0.5 > t) t = last.at + spec.popGapMs;
    let guard = 0;
    while (extra > 0 && guard < 40) {
      guard += 1;
      const fake = spec.fakeChance > 0 && Math.random() < spec.fakeChance;
      run.queue.push({ at: t, fake, resolved: false, fired: false });
      if (!fake) {
        extra -= 1;
        if (spec.twin && Math.random() < 0.5) {
          run.queue.push({
            at: t + Math.max(70, spec.hitMs * 0.72),
            fake: true,
            resolved: false,
            fired: false,
            twin: true,
          });
        }
      }
      let gap = spec.popGapMs;
      if (spec.stagger) gap = extra % 2 === 0 ? spec.popGapMs * 0.46 : spec.popGapMs * 1.52;
      t += gap + spec.popGapMs * (0.12 * (Math.random() - 0.5));
    }
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

  function mountTap(ctx) {
    const engines = rk() && rk().engines;
    if (!engines || !engines.TimingTap || typeof engines.TimingTap.mount !== "function" || !ctx) return null;
    try {
      const spec = liveSpec();
      /* Launcher only. Stall owns run.t clock, per-stage hitMs, burn/fake_tap death.
       * TimingTap.tap uses performance.now + frozen windowMs — do not drive pops with it.
       * Shadow ctx so reportDepth/finishRun cannot steal the coin run. */
      return engines.TimingTap.mount(el("popcornCanvas") || card(), {
        windowMs: spec.hitMs,
        strikesToDeath: 99,
        clearCount: 999,
        stageParams: popcornStageParams,
        schedule(stage) {
          const p = popcornStageParams(stage);
          const now = (run && run.t) || 0;
          return buildSchedule(p, now);
        },
        onHit() {},
        onFake() { kit.sfx("spinner"); },
      }, shadowCtx(ctx));
    } catch (_) {
      return null;
    }
  }

  function resetPips() {
    const host = card();
    const pips = (host && host.querySelector("[data-runkit-strikes]")) || document.querySelector("[data-runkit-strikes=\"popcorn\"]");
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
    const canvas = el("popcornCanvas");
    if (canvas) {
      canvas.classList.toggle("is-locked", !isLive());
      canvas.style.touchAction = "none";
    }
    if (!isLive() && (!run || run.done)) setText("popcornStatus", DEPTH_COPY.status);
  }

  function punchStart() {
    stampDepthCopy();
    setText("popcornStatus", DEPTH_COPY.punch);
    const btn = el("popcornStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("popcorn")
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
    idleNextAt = 0;
    idleBits = [];
    idleLidLie = false;
    idleLidUntil = -1;
    idleLidBump = 0;
    const tick = (now) => {
      if (isLive() || (run && run.dying) || !cabinetOn()) {
        idleRaf = 0;
        return;
      }
      if (!last) last = now;
      const dt = Math.min(48, now - last);
      last = now;
      idleT = now;
      idleClock += dt;
      if (idleClock > IDLE_ROOM_MS) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        idleBits = [];
        idleLidLie = false;
      }
      stepIdle(dt, now);
      draw(now);
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }

  function stepIdle(dt, now) {
    const spec = attractSpec();
    idleBits = idleBits.filter((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += (b.fake ? 0.00012 : 0.00028) * dt;
      return now - b.born < b.life;
    });
    idleLidBump = Math.max(0, idleLidBump - dt * 0.06);
    if (idleLidLie && now > idleLidUntil) idleLidLie = false;
    if (!idleNextAt) idleNextAt = now + 420;
    if (now < idleNextAt) return;
    const wantLid = spec.lidLie && Math.random() < 0.28;
    if (wantLid) {
      idleLidLie = true;
      idleLidUntil = now + spec.hitMs + 80;
      idleLidBump = 11;
      pushBurst(idleBits, true, now);
      idleNextAt = now + spec.popGapMs * 1.1;
      return;
    }
    const fake = spec.fakeChance > 0 && Math.random() < Math.max(0.35, spec.fakeChance);
    const twin = spec.twin && fake && Math.random() < 0.5;
    pushBurst(idleBits, fake, now);
    idleLidBump = fake ? 6 : 12;
    idleNextAt = now + (spec.stagger && !fake ? spec.popGapMs * 1.4 : spec.popGapMs * (twin ? 0.55 : 0.9));
  }

  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") {
      return rk().challengeText("Popcorn stage", depth, GAME_ID);
    }
    return `Beat my Popcorn stage ${depth | 0} on Penny Fever`;
  }

  function pushBurst(list, fake, now, ev) {
    const n = fake ? 5 : 9;
    const ox = ev && ev.side === "L" ? -46 : (ev && ev.side === "R" ? 46 : 0);
    const col = ev && ev.colour;
    for (let i = 0; i < n; i += 1) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      const sp = fake ? 0.12 + Math.random() * 0.12 : 0.22 + Math.random() * 0.22;
      list.push({
        x: KETTLE.x + ox + (Math.random() - 0.5) * 28,
        y: KETTLE.y - 48,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: fake ? 420 : 560,
        fake,
        colour: col,
        silent: !!(ev && ev.silent),
        born: now,
      });
    }
  }

  function spawnBurst(fake, now, ev) {
    if (!run) return;
    pushBurst(run.bits, fake, now, ev);
  }

  function fireEvent(e) {
    if (!run || e.fired) return;
    e.fired = true;
    spawnBurst(e.fake, run.t, e);
    if (!e.silent) kit.sfx(e.fake ? "spinner" : "tray");
    run.lidBump = e.fake ? 6 : 12;
    if (!e.fake && (liveSpec().kernelFlash || e.silent)) run.kernelFlash = 280;
  }

  function nearestOpen(now, maxDist) {
    let best = null;
    let bestD = maxDist;
    (run.queue || []).forEach((e) => {
      if (e.resolved) return;
      const d = Math.abs(e.at - now);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    });
    return best;
  }

  function draw(now) {
    const canvas = el("popcornCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (run) run.shake = kit.applyShake(ctx, run.shake || 0);

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#24140c");
    g.addColorStop(0.55, "#140a08");
    g.addColorStop(1, "#0c0606");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    kit.fillWood(ctx, 36, 330, 268, 92);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 2;
    ctx.strokeRect(36.5, 330.5, 267, 91);

    const spec = liveSpec();
    const t = run && (isLive() || run.dying) ? run.t : (now || idleT || 0);
    const next = run && run.queue ? run.queue.find((e) => !e.resolved) : null;
    const until = next ? next.at - t : 9999;
    const inWin = next && Math.abs(until) <= spec.hitMs;
    const lead = spec.hitMs + 90;
    const telegraph = next && until > 0 && until < lead;
    const lidLieOn = isLive() || (run && run.dying)
      ? !!(run && run.lidLie && t <= run.lidLieUntil)
      : !!(idleLidLie && t <= idleLidUntil);

    const bump = (isLive() || (run && run.dying))
      ? (run && run.lidBump ? run.lidBump : 0)
      : idleLidBump;
    ctx.save();
    ctx.translate(KETTLE.x, KETTLE.y - bump * 0.35);
    ctx.fillStyle = "#6a3218";
    ctx.beginPath();
    ctx.ellipse(0, 18, 86, 52, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#d4a45a";
    ctx.stroke();
    const glow = lidLieOn
      ? "rgba(230,230,230,0.32)"
      : telegraph
        ? (next.fake ? "rgba(230,230,230,0.28)" : "rgba(232,140,40,0.45)")
        : "rgba(196,80,20,0.2)";
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, -8, 62, 38, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#8a4a22";
    ctx.beginPath();
    ctx.ellipse(0, -6, 58, 34, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#f0d09a";
    ctx.lineWidth = inWin && next && !next.fake ? 3 : 1.4;
    ctx.beginPath();
    ctx.ellipse(0, -6, 58, 34, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = "#3a2418";
    ctx.fillRect(-8, 64, 16, 28);
    ctx.fillRect(-28, 88, 56, 10);
    ctx.restore();

    kindWash(ctx, spec);

    const bits = (isLive() || (run && run.dying)) ? (run && run.bits) : idleBits;
    if (bits) {
      bits.forEach((b) => {
        const age = (t - b.born) / b.life;
        if (age >= 1) return;
        ctx.globalAlpha = 1 - age;
        if (b.fake) {
          ctx.fillStyle = "rgba(230,230,230,0.85)";
          ctx.beginPath();
          ctx.ellipse(b.x, b.y, 10 + age * 16, 7 + age * 10, 0, 0, TAU);
          ctx.fill();
        } else {
          ctx.fillStyle = b.colour === "red" ? "#e07070" : (b.colour === "yellow" ? "#f0d09a" : "#f7e2b0");
          ctx.beginPath();
          ctx.arc(b.x, b.y, 5.5, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = b.silent ? "#fff6ec" : "#c41e3a";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });
    }

    if (next && !next.resolved) {
      const span = Math.max(120, spec.popGapMs * 0.55);
      const dist = Math.abs(until);
      if (dist < span) {
        const r = 28 + dist * 0.08;
        ctx.strokeStyle = next.fake
          ? `rgba(230,230,230,${inWin ? 0.7 : 0.28})`
          : `rgba(232,140,40,${inWin ? 0.9 : 0.35})`;
        ctx.lineWidth = inWin ? 3.2 : 1.6;
        ctx.setLineDash(next.twin ? [5, 4] : []);
        ctx.beginPath();
        ctx.arc(KETTLE.x, KETTLE.y - 10, r, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (isLive() && spec.colourCall) {
      ctx.fillStyle = "rgba(12,6,9,0.72)";
      ctx.fillRect(18, 72, W - 36, 26);
      ctx.strokeStyle = "rgba(212,164,90,0.55)";
      ctx.strokeRect(18.5, 72.5, W - 37, 25);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "11px Georgia, serif";
      ctx.textAlign = "left";
      ctx.fillText("CALL", 26, 90);
      ctx.beginPath();
      ctx.arc(78, 85, 8, 0, TAU);
      ctx.fillStyle = (spec.callColour || "yellow") === "red" ? "#c41e3a" : "#f0d09a";
      ctx.fill();
      ctx.fillStyle = "#e8a0b8";
      ctx.textAlign = "right";
      ctx.fillText((spec.callColour || "yellow").toUpperCase(), W - 26, 90);
    }

    if (isLive() && run.frozenUntil > run.t) {
      ctx.fillStyle = "rgba(230,230,230,0.88)";
      ctx.font = "bold 16px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("LID CLACK — WAIT", KETTLE.x, KETTLE.y - 92);
    } else if (isLive() && run.mirrorOn) {
      ctx.fillStyle = "rgba(184,232,224,0.92)";
      ctx.font = "bold 16px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("MIRROR", KETTLE.x, KETTLE.y - 92);
    } else if (isLive() && run.kernelFlash > 0) {
      ctx.fillStyle = "rgba(247,226,176,0.95)";
      ctx.font = "bold 16px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("KERNEL", KETTLE.x, KETTLE.y - 92);
    } else if (lidLieOn) {
      ctx.fillStyle = "rgba(230,230,230,0.88)";
      ctx.font = "bold 13px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("LID — NOT A POP", KETTLE.x, KETTLE.y - 92);
    } else if (spec.stagger && next && until > spec.popGapMs * 0.95) {
      ctx.fillStyle = "rgba(240,208,154,0.72)";
      ctx.font = "bold 13px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("PAUSE", KETTLE.x, KETTLE.y - 92);
    } else if (telegraph && next && next.fake) {
      ctx.fillStyle = "rgba(230,230,230,0.42)";
      ctx.font = "11px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(next.twin ? "twin steam" : "steam", KETTLE.x, KETTLE.y - 92);
    } else if (telegraph && next && !next.fake) {
      ctx.fillStyle = "rgba(240,160,60,0.95)";
      ctx.font = "bold 15px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("POP", KETTLE.x, KETTLE.y - 92);
    } else if (!isLive() && !(run && run.dying)) {
      const recent = idleBits[idleBits.length - 1];
      ctx.font = recent && !recent.fake ? "bold 15px Georgia, serif" : "bold 13px Georgia, serif";
      ctx.textAlign = "center";
      if (recent && recent.fake) {
        ctx.fillStyle = "rgba(230,230,230,0.88)";
        ctx.fillText(spec.twin ? "twin steam" : "steam", KETTLE.x, KETTLE.y - 92);
      } else if (recent) {
        ctx.fillStyle = "rgba(240,160,60,0.95)";
        ctx.fillText("POP", KETTLE.x, KETTLE.y - 92);
      } else if (spec.stagger) {
        ctx.fillStyle = "rgba(240,208,154,0.72)";
        ctx.fillText("PAUSE", KETTLE.x, KETTLE.y - 92);
      }
    }

    const cheat = cheatLabel(spec);
    if (cheat) {
      ctx.fillStyle = spec.fakeChance || spec.lidLie ? "rgba(230,230,230,0.9)" : "rgba(240,208,154,0.92)";
      ctx.font = "bold 11px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(cheat, W / 2, 54);
    }

    if (isLive() && run.roomCardMs > 0) drawRoomCard(ctx, spec, run.roomCardMs);
    else if (!isLive() && !(run && run.dying) && (!run || run.done) && idleClock < 1100) {
      drawRoomCard(ctx, spec, 1100 - idleClock);
    }

    if (run && run.flash > 0) {
      const col = run.flashKind === "catch" ? "184,232,224" : "196,30,58";
      ctx.fillStyle = `rgba(${col},${Math.min(0.4, run.flash / 380)})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, "BURN");

    if (isLive() || (run && run.dying)) {
      kit.drawHud(ctx, W, [
        `${spec.title} · ${run.catches}/${spec.need} · ${run.score}`,
        `${hudLine(spec, run.stage)} · burns ${run.burns}/${spec.burnsToDeath} · ±${spec.hitMs}ms`,
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
    const spec = popcornStageParams(n);
    if (!spec) {
      finish("souvenir");
      return;
    }
    run.spec = spec;
    run.stage = spec.id;
    run.catches = 0;
    run.queue = buildSchedule(spec, run.t);
    run.lidLie = false;
    run.lidLieUntil = -1;
    run.lidBounced = false;
    run.frozenUntil = -1;
    run.mirrorOn = false;
    run.mirrorUntil = -1;
    run.finaleBurst = false;
    run.kernelFlash = 0;
    run.missLock = MISS_LOCK_MS;
    run.lastTapAt = run.t;
    run.pointerDown = false;
    run.roomCardMs = n === 1 ? 1480 : ROOM_CARD_MS;
    tellDepth(run.depth);
    ensureHud();
    setText("popcornStatus", spec.barker || `${spec.title} — tap the pop.`);
  }

  function start() {
    if (isLive() || (run && run.dying)) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("popcornStatus", "Out of demo coins · grant a pass");
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
      tapper: null,
      t: 0,
      last: 0,
      stage: 1,
      depth: 0,
      spec: popcornStageParams(1),
      catches: 0,
      burns: 0,
      score: 0,
      queue: [],
      bits: [],
      lastTapAt: -999,
      missLock: 0,
      pointerDown: false,
      flash: 0,
      flashKind: "",
      lidBump: 0,
      lidLie: false,
      lidLieUntil: -1,
      lidBounced: false,
      frozenUntil: -1,
      mirrorOn: false,
      mirrorUntil: -1,
      finaleBurst: false,
      kernelFlash: 0,
      raf: 0,
      shake: 0,
      closedStamp: false,
      deathHold: 0,
      deathNote: "burn",
      roomCardMs: 0,
    };
    run.tapper = mountTap(kitRun);
    tellDepth(0);
    const startBtn = el("popcornStart");
    if (startBtn) startBtn.disabled = true;
    const verdict = el("popcornVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("popcornResult");
    PF.setTier("popcornTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    startStage(1);
    PF.focusCard("popcornCard", true);
    PF.setAura("think");
    const loop = (now) => {
      if (!run || run.done) return;
      if (!run.last) run.last = now;
      const dt = Math.min(32, now - run.last);
      run.last = now;
      run.t += dt;
      if (run.dying) {
        run.roomCardMs = Math.max(0, (run.roomCardMs || 0) - dt);
        run.flash = Math.max(0, run.flash - dt);
        run.lidBump = Math.max(0, (run.lidBump || 0) - dt * 0.06);
        run.bits = (run.bits || []).filter((b) => {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.vy += (b.fake ? 0.00012 : 0.00028) * dt;
          return run.t - b.born < b.life;
        });
        draw(now);
        run.deathHold -= dt;
        if (run.deathHold <= 0) {
          sealResult(run.deathNote);
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

  function maybeLidLie(spec, dt) {
    if (!spec.lidLie) return;
    if (run.lidLie && run.t > run.lidLieUntil) {
      run.lidLie = false;
      return;
    }
    if (run.lidLie) return;
    const next = run.queue.find((e) => !e.resolved);
    const far = !next || Math.abs(next.at - run.t) > spec.hitMs * 2.4;
    if (far && Math.random() < 0.00085 * dt) {
      run.lidLie = true;
      run.lidLieUntil = run.t + spec.hitMs + 50;
      run.lidBump = 11;
      spawnBurst(true, run.t);
      kit.sfx("spinner");
    }
  }

  function maybeLidBounce(spec) {
    if (!spec.lidBounce || run.lidBounced) return;
    const trip = Math.max(3, Math.floor(spec.need * 0.42));
    if (run.catches < trip) return;
    run.lidBounced = true;
    const freeze = spec.freezeMs || 600;
    run.frozenUntil = run.t + freeze;
    run.lidBump = 14;
    kit.sfx("stamp");
    setText("popcornStatus", "LID CLACK — freeze, then three pops.");
    (run.queue || []).forEach((e) => {
      if (!e.resolved) e.at += freeze + 40;
    });
    const dump = run.frozenUntil + 80;
    run.queue.push(makeEvent(dump, { dump: true }));
    run.queue.push(makeEvent(dump + 140, { dump: true }));
    run.queue.push(makeEvent(dump + 280, { dump: true }));
  }

  function maybeMirror(spec) {
    if (!spec.mirrorTap) return;
    if (!run.mirrorOn && run.catches >= 4) {
      run.mirrorOn = true;
      run.mirrorUntil = run.t + 7800;
      setText("popcornStatus", "MIRROR — tap the other side.");
    }
    if (run.mirrorOn && run.t > run.mirrorUntil) {
      run.mirrorOn = false;
      setText("popcornStatus", "Mirror off. Eyes forward.");
    }
  }

  function maybeFinaleBurst(spec) {
    if (!spec.doubleBurstFinale || run.finaleBurst) return;
    if (run.catches < spec.need - 4) return;
    run.finaleBurst = true;
    const t0 = run.t + 360;
    const gap = 280;
    run.queue.push(makeEvent(t0, { double: true, burst: 1, finale: true }));
    run.queue.push(makeEvent(t0 + gap, { double: true, burst: 2, finale: true }));
    setText("popcornStatus", "DOUBLE BURST FINALE.");
  }

  function step(dt) {
    if (!isLive()) return;
    run.roomCardMs = Math.max(0, (run.roomCardMs || 0) - dt);
    run.flash = Math.max(0, run.flash - dt);
    run.missLock = Math.max(0, (run.missLock || 0) - dt);
    run.lidBump = Math.max(0, (run.lidBump || 0) - dt * 0.06);
    const spec = liveSpec();
    run.bits = (run.bits || []).filter((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += (b.fake ? 0.00012 : 0.00028) * dt;
      return run.t - b.born < b.life;
    });
    let expiredTrue = false;
    const frozen = run.frozenUntil > run.t;
    run.queue.forEach((e) => {
      if (frozen) return;
      if (!e.fired && run.t >= e.at) fireEvent(e);
      if (e.resolved) return;
      if (!e.fake && run.t > e.at + spec.hitMs) {
        e.resolved = true;
        if (!expiredTrue) {
          expiredTrue = true;
          burn("burn", "Late. Kernel burned.");
        }
      } else if (e.fake && run.t > e.at + spec.hitMs) {
        e.resolved = true;
      }
    });
    maybeLidLie(spec, dt);
    maybeLidBounce(spec);
    maybeMirror(spec);
    maybeFinaleBurst(spec);
    run.kernelFlash = Math.max(0, (run.kernelFlash || 0) - dt);
    topUpSchedule(spec);
  }

  function tap(ev) {
    if (!isLive()) return;
    const now = run.t;
    if (now - run.lastTapAt < TAP_LOCK_MS) return;
    if ((run.missLock || 0) > 0) return;
    run.lastTapAt = now;
    const spec = liveSpec();
    if (run.frozenUntil > now) {
      burn("burn", "Lid freeze. Wait for the dump.");
      return;
    }
    let tapX = KETTLE.x;
    if (ev && (ev.pointerType || (ev.target && ev.target.id === "popcornCanvas")) && el("popcornCanvas")) {
      const p = kit.canvasPos(el("popcornCanvas"), ev, W, H);
      tapX = p.x;
      if (spec.mirrorTap && run.mirrorOn) tapX = W - tapX;
    }
    const tapSide = tapX < W / 2 ? "L" : "R";
    const inWin = (e) => !e.resolved && Math.abs(e.at - now) <= spec.hitMs;
    const sideOk = (e) => {
      if (!e.side) return true;
      if (!(spec.mirrorTap && run.mirrorOn) && !spec.sides) return true;
      if (spec.mirrorTap && run.mirrorOn) return e.side === tapSide;
      return true;
    };
    const hit = run.queue.find((e) => inWin(e) && !e.fake && sideOk(e));
    if (hit) {
      hit.resolved = true;
      if (!hit.fired) fireEvent(hit);
      if (spec.colourCall && hit.colour && hit.colour !== (spec.callColour || "yellow")) {
        burn("burn", "Wrong colour pop. Soft burn.");
        return;
      }
      catchPop();
      return;
    }
    const fake = run.queue.find((e) => inWin(e) && e.fake);
    if (fake) {
      fake.resolved = true;
      if (!fake.fired) fireEvent(fake);
      burn("fake_tap", fake.twin ? "Twin puff. Second was steam." : "Steam fake. That puff does not count.");
      return;
    }
    if (run.lidLie && now <= run.lidLieUntil) {
      run.lidLie = false;
      burn("fake_tap", "Lid lie. That bump was not a pop.");
      return;
    }
    const near = nearestOpen(now, spec.popGapMs * 0.65);
    if (near && !near.fake) {
      near.resolved = true;
      if (!near.fired) fireEvent(near);
      burn("burn", now < near.at ? "Early. True pops only." : "Late. True pops only.");
      return;
    }
    burn("burn", "False start. True pops only.");
  }

  function catchPop() {
    const spec = liveSpec();
    run.catches += 1;
    run.score += CATCH_SCORE;
    run.flash = 220;
    run.flashKind = "catch";
    run.shake = 3;
    if (run.kitRun) run.kitRun.score = run.score;
    if (run.catches >= spec.need) {
      clearStage();
      return;
    }
    setText("popcornStatus", `Catch ${run.catches}/${spec.need} · ±${spec.hitMs}ms`);
    PF.setAura("point");
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
    const next = popcornStageParams(run.depth + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    setText("popcornStatus", run.depth >= 6
      ? AURA.deep(run.depth)
      : `${AURA.clear} ${next.title} — ${next.need} pops · ±${next.hitMs}ms.`);
    run.shake = 5;
    startStage(run.depth + 1);
  }

  function burn(reason, note) {
    if (!isLive()) return;
    const spec = liveSpec();
    run.burns += 1;
    run.flash = 340;
    run.flashKind = reason === "fake_tap" ? "fake" : "burn";
    run.shake = 6;
    run.missLock = MISS_LOCK_MS;
    run.deathNote = reason;
    tellStrike(reason);
    kit.sfx(reason === "fake_tap" ? "spinner" : "miss");
    PF.setAura("laugh");
    setText("popcornStatus", `${note} Burns ${run.burns}/${spec.burnsToDeath}.`);
    if (run.burns >= spec.burnsToDeath) finish(reason);
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "fake_tap") return AURA.fake;
    if (depth >= 6) return AURA.deep(depth);
    if (depth >= 5) return AURA.batch(depth);
    return AURA.burn;
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.deathNote = reason === "souvenir" ? "souvenir" : (reason === "fake_tap" ? "fake_tap" : "burn");
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
    const death = reason === "leave"
      ? "leave"
      : (reason === "souvenir" ? "souvenir" : (reason === "fake_tap" ? "fake_tap" : "burn"));
    persistDepth({
      depth,
      score,
      deathReason: death,
      cashedOut: death === "souvenir",
      meta: { burns: run.burns, lastStage: run.stage, catches: run.catches, kind: run.spec && run.spec.kind },
    });
    stampDepthCopy();
    const startBtn = el("popcornStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "POP AGAIN · 1 demo coin";
    }
    PF.focusCard("popcornCard", false);
    kit.setMode(card(), "result");
    const aura = auraLine(reason, depth);
    const challenge = challengeLine(depth);
    const verdict = el("popcornVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = `BATCH ${depth} · SCORE ${score} · ${aura}`;
    }
    kit.fillResult({
      root: "popcornResult",
      depth: "popcornResultDepth",
      score: "popcornResultScore",
      aura: "popcornResultAura",
      copied: "popcornCopied",
    }, {
      depthLine: `BATCH ${depth}`,
      scoreLine: `SCORE ${score} · ${String(death).replace(/_/g, " ").toUpperCase()}`,
      auraLine: aura,
    });
    setText("popcornChallengeText", challenge);
    PF.setTier("popcornTier", depth > 0 ? `BATCH ${depth}` : "BURN", depth > 0 ? "perfect" : "miss");
    setText("popcornStatus", reason === "leave" ? "Left the kettle." : (reason === "souvenir" ? "Kettle souvenir. Steam settled." : "Kettle stamped BURN."));
    if (depth > 0) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Popcorn");
      PF.setAura(depth >= 4 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `BATCH ${depth}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Popcorn burn");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "BURN", aura);
    }
    PF.refreshNightBoard();
    draw();
    startIdle();
  }

  PF.registerVendor({
    id: "popcorn",
    playKey: "popcorn",
    chalk: "Tap the pop — ignore the steam.",
    defaults: { bestPopcorn: 0, bestPopcornScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopIdle();
    },
    onShow() { stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      idleBits = [];
      idleLidLie = false;
      const verdict = el("popcornVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("popcornResult");
      const startBtn = el("popcornStart");
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
      setText("depthPopNow", isLive() || (run && run.dying) ? String(run.depth | 0) : "0");
      const spec = liveSpec();
      setText("depthPopCatch", isLive() || (run && run.dying) ? `${run.catches}/${spec.need}` : "0");
      const bestN = Math.max(state.bestPopcorn || 0, (state.bestDepth && state.bestDepth.popcorn) || 0);
      setText("depthPopBest", bestN ? String(bestN) : "—");
      setText("depthPopBestScore", state.bestPopcornScore ? String(state.bestPopcornScore) : "—");
      const door = el("popcornDoorBest");
      if (door) door.textContent = bestN ? `Batch ${bestN}` : "Batch —";
    },
    bind() {
      declareP0();
      ensurePips();
      ensureHud();
      const startBtn = el("popcornStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = el("popcornCanvas");
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("pointerdown", (ev) => {
          if (run && (run.dying || run.done)) return;
          if (!isLive()) {
            punchStart();
            return;
          }
          if (run.pointerDown) return;
          run.pointerDown = true;
          ev.preventDefault();
          try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* optional */ }
          tap(ev);
        });
        canvas.addEventListener("pointermove", (ev) => {
          if (!isLive()) return;
          if (run.pointerDown) ev.preventDefault();
        });
        const up = () => {
          if (run) run.pointerDown = false;
        };
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("pointercancel", up);
        canvas.addEventListener("pointerleave", up);
        canvas.addEventListener("lostpointercapture", up);
      }
      window.addEventListener("keydown", (ev) => {
        if (!cabinetOn() || !isLive() || ev.repeat) return;
        if (run && run.pointerDown) return;
        if (ev.code === "Space" || ev.key === " ") {
          ev.preventDefault();
          tap(ev);
        }
      });
      const copyBtn = el("popcornChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = lastDepth();
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("popcornCopied");
            if (copied) copied.hidden = false;
            setText("popcornStatus", "Copied — send it");
          }, () => {
            setText("popcornStatus", text);
          });
        });
      }
      stampDepthCopy();
      draw();
    },
  });
})();
