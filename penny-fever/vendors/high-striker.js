/* High Striker Pegs — Desktop Grok owns this file. PF only. Never booth/port 6000. Never Imagine.
 * GOBLIN B03 AUTHORED 2026-09-05 — 8 TOWER chapters, not a thinner zone climb.
 * GOBLIN_AUTHORED_LEVELS_B03.md + GOBLIN_BATCH03_MOUNT_CONFIGS.md + GOBLIN_RUNKIT_API.md
 * Engine: TimingTap · depthUnit: Tower · gameId: highstriker · codaEnabled hybrid
 * 8 named towers (layout / cheat / verb) then ENDLESS Sky Peg {n}. BandParams = coda only.
 * Soft Mallet → Bell Ladder → Side-Sway (2-axis) → Fake Bell Midway → Double-Tap
 * → Slip Cascade → Reverse Hammer → Fever Bell Run. Bell = checkpoint, not the ending.
 * HUD = TOWER {n} · {name} · glory still reports peak pegs · death = hammer slip | fell from zero
 * Don’t: mash-anywhere · hard end at first bell · same loop hotter numbers. Death hold ≥700ms. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const W = 340;
  const H = 480;
  const TOWER = { x: 118, y: 58, w: 78, h: 360 };
  const GAME_ID = "highstriker";
  const BELL_EVERY = 5;
  const TAP_LOCK_MS = 140;
  const MISS_LOCK_MS = 260;
  const DOUBLE_TAP_MS = 280;
  const DEATH_HOLD_MS = 760;
  const TAU = Math.PI * 2;
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;

  let run = null;
  let idleRaf = 0;
  let idleRoom = 1;
  let idleClock = 0;

  const AURA = {
    slip: "Aura: The hammer slipped. Rhythm, not spam.",
    zero: "Aura: You fell off the first peg. Twice.",
    shallow: "Aura: Not a single tower. The bell is laughing.",
    mid: "Aura: Cute climb. The bell’s a checkpoint, sugar.",
    deep: "Aura: You rang it and kept climbing. Dangerous.",
    fake: "Aura: You chased a fake ding. Real bell is on clear.",
    reverse: "Aura: Marker ran backwards. You kept the old beat.",
    double: "Aura: One tap is air. Double-tap is the verb.",
    sway: "Aura: Gold drifted sideways. Height alone is a liar.",
    cascade: "Aura: Miss dropped two and the next gold shrank.",
    struck: "Aura: Window already struck. Wait the next pass.",
    oldBeat: "Aura: You swung the old beat. Reverse runs the other way.",
    coda: "Aura: Authored towers done. ENDLESS sky pegs. Don’t mash.",
    leave: "Aura: Walking off mid-tower? Coward’s stamp.",
    bell: "Aura: Bell’s a checkpoint. Keep climbing.",
    souvenir: "Aura: Eight towers locked. Souvenir — the bell salutes.",
  };

  /* Authored TOWER chapters — unique layout / cheat / verb. Not “same tower, thinner zone.”
   * BandParams numeric climb is coda-only after Tower 8. */
  const AUTHORED = [
    {
      id: 1, name: "Soft Mallet Lane", kind: "vertical", pegsToClear: 5,
      zoneH: 0.18, speed: 0.5, slipOnMiss: -1, shrinkAfterHit: false, fakeBell: false,
      bellEvery: 0, sway: false, doubleTap: false, reverse: false,
      barker: "Tall gold. Tap when the marker is in it. Five pegs. Real bell on clear.",
    },
    {
      id: 2, name: "Bell Ladder", kind: "bellLadder", pegsToClear: 6,
      zoneH: 0.14, speed: 0.65, slipOnMiss: -1, shrinkAfterHit: false, fakeBell: false,
      bellEvery: 3, sway: false, doubleTap: false, reverse: false,
      barker: "Bell every three pegs this tower. Two extra fanfares. Then keep climbing.",
    },
    {
      id: 3, name: "Side-Sway Tower", kind: "axis2d", pegsToClear: 6,
      zoneH: 0.16, speed: 0.5, slipOnMiss: -1, shrinkAfterHit: false, fakeBell: false,
      bellEvery: 0, sway: true, doubleTap: false, reverse: false,
      barker: "Gold drifts sideways. Marker sways. Hit the 2-axis window — not just the height.",
    },
    {
      id: 4, name: "Fake Bell Midway", kind: "fakeBell", pegsToClear: 7,
      zoneH: 0.13, speed: 0.7, slipOnMiss: -1, shrinkAfterHit: false, fakeBell: true,
      fakeBellAt: 3, bellEvery: 0, sway: false, doubleTap: false, reverse: false,
      barker: "A ding at peg 3 is a liar. Real bell only when this tower clears.",
    },
    {
      id: 5, name: "Double-Tap Pegs", kind: "doubleTap", pegsToClear: 6,
      zoneH: 0.16, speed: 0.55, slipOnMiss: -1, shrinkAfterHit: false, fakeBell: false,
      bellEvery: 0, sway: false, doubleTap: true, doubleTapMs: DOUBLE_TAP_MS, reverse: false,
      barker: "Two taps in the gold within 280ms. One tap is air.",
    },
    {
      id: 6, name: "Slip Cascade", kind: "cascade", pegsToClear: 7,
      zoneH: 0.14, speed: 0.75, slipOnMiss: -2, shrinkAfterHit: true, shrinkOnce: true,
      fakeBell: false, bellEvery: 0, sway: false, doubleTap: false, reverse: false,
      barker: "Miss drops two. After a hit the next peg’s gold shrinks once, then resets.",
    },
    {
      id: 7, name: "Reverse Hammer", kind: "reverse", pegsToClear: 7,
      zoneH: 0.13, speed: 0.7, slipOnMiss: -1, shrinkAfterHit: false, fakeBell: false,
      bellEvery: 0, sway: false, doubleTap: false, reverse: true,
      barker: "Marker runs the other way. Don’t keep the old beat.",
    },
    {
      id: 8, name: "Fever Bell Run", kind: "fever", pegsToClear: 8,
      zoneH: 0.12, speed: 0.8, slipOnMiss: -1, shrinkAfterHit: true, fakeBell: true,
      fakeBellAt: 4, bellEvery: 0, sway: true, doubleTap: false, reverse: false,
      finaleDoubleBell: true,
      barker: "Sway + fake ding + shrink. Eight pegs. Finale double-bell.",
    },
  ];

  const P0_MOUNT = {
    engine: "TimingTap",
    displayName: "High Striker Pegs",
    depthUnit: "Tower",
    sheet: "GOBLIN_AUTHORED_LEVELS_B03.md",
    batchSheet: "GOBLIN_BATCH03_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored TOWERS then ENDLESS · bell is a checkpoint",
    body: "Authored towers, not a thinner loop: Soft Mallet Lane (teach the window) → Bell Ladder (bell every 3 pegs) → Side-Sway Tower (2-axis gold) → Fake Bell Midway (ding at 3 is a liar) → Double-Tap Pegs (two taps / 280ms) → Slip Cascade (miss −2, next gold shrinks once) → Reverse Hammer (path invert) → Fever Bell Run (sway + fake ding + shrink, finale double-bell) → ENDLESS Sky Peg. Tap the gold. Miss slips. Three slips with no net gain, or falling from peg 0 twice, stamps the tower. The bell is a checkpoint, not the ending.",
    status: "Depth run · START · 1 demo coin · 8 authored TOWERS then ENDLESS",
    machine: "Strength tower · 1 demo coin · authored TOWERS",
    idleHud: ["Authored TOWERS — each chapter is a different sport", "TAP the gold · bell is a checkpoint · START"],
    punch: "Depth run — press START. No mash prize.",
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

  function highstrikerBandParams(peg) {
    const p = Math.max(1, peg | 0);
    if (p <= 5) {
      return { pegBand: "1-5", zoneH: 0.18, speed: 0.5, slipOnMiss: -1, shrinkAfterHit: false, fakeBell: false };
    }
    if (p <= 10) {
      return { pegBand: "6-10", zoneH: 0.14, speed: 0.7, slipOnMiss: -1, shrinkAfterHit: false, fakeBell: false };
    }
    if (p <= 15) {
      return { pegBand: "11-15", zoneH: 0.11, speed: 0.9, slipOnMiss: -1, shrinkAfterHit: false, fakeBell: true };
    }
    if (p <= 20) {
      return { pegBand: "16-20", zoneH: 0.09, speed: 1.1, slipOnMiss: -2, shrinkAfterHit: false, fakeBell: false };
    }
    const t = p - 20;
    return {
      pegBand: "21+",
      zoneH: Math.max(0.05, 0.09 - 0.002 * t),
      speed: Math.min(2.0, 1.1 + 0.08 * t),
      slipOnMiss: -2,
      shrinkAfterHit: true,
      fakeBell: t % 3 === 0,
    };
  }

  function highstrikerCoda(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const t = stage - AUTHORED_COUNT;
    const peg = 21 + (t - 1) * 5;
    const band = highstrikerBandParams(peg);
    return {
      id: stage,
      name: `Sky Peg ${stage}`,
      title: `Sky Peg ${stage}`,
      kind: "sky",
      coda: true,
      pegsToClear: 5,
      zoneH: band.zoneH,
      speed: band.speed,
      slipOnMiss: band.slipOnMiss,
      shrinkAfterHit: true,
      fakeBell: !!band.fakeBell,
      fakeBellAt: band.fakeBell ? 2 : 0,
      bellEvery: BELL_EVERY,
      sway: t % 2 === 0,
      doubleTap: false,
      reverse: t % 3 === 0,
      barker: "ENDLESS sky. Window shrinks after hits. Fake bells still lie.",
    };
  }

  function highstrikerStageParams(n) {
    const stage = Math.max(1, n | 0);
    let spec;
    if (stage <= AUTHORED_COUNT) {
      spec = Object.assign({ coda: false }, AUTHORED[stage - 1]);
    } else if (!CODA_ENABLED) {
      return null;
    } else {
      spec = highstrikerCoda(stage);
    }
    spec.title = spec.name;
    spec.slipsWithoutNetGainToDeath = 3;
    spec.fallFromZeroTwiceToDeath = true;
    spec.bellEvery = spec.bellEvery || 0;
    spec.pegsToClear = spec.pegsToClear || 5;
    return spec;
  }

  function roomTell(spec) {
    if (!spec) return "TAP THE GOLD";
    if (spec.coda) return "ENDLESS · SKY PEG";
    if (spec.kind === "axis2d" || spec.sway) return spec.kind === "fever"
      ? "SWAY + FAKE DING + SHRINK · FINALE DOUBLE-BELL"
      : "2-AXIS GOLD · HEIGHT ALONE IS A LIAR";
    if (spec.kind === "fakeBell") return "DING AT 3 IS A LIAR · REAL BELL ON CLEAR";
    if (spec.kind === "doubleTap") return "TWO TAPS IN GOLD · 280ms · ONE TAP IS AIR";
    if (spec.kind === "cascade") return "MISS −2 · NEXT GOLD SHRINKS ONCE";
    if (spec.kind === "reverse") return "MARKER RUNS THE OTHER WAY · DON’T KEEP THE OLD BEAT";
    if (spec.kind === "bellLadder") return "BELL EVERY 3 PEGS · THEN KEEP CLIMBING";
    if (spec.kind === "fever") return "SWAY + FAKE DING + SHRINK · FINALE DOUBLE-BELL";
    if (spec.kind === "sky" || spec.coda) return "ENDLESS · SKY PEG";
    return "TAP THE GOLD · BELL IS NOT THE END";
  }

  function attractSpec() {
    return highstrikerStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function hudStageLine(spec, towers, pegs) {
    if (!spec) return `TOWER ${towers | 0}`;
    const peak = pegs != null ? ` · PEGS ${pegs | 0}` : "";
    if (spec.coda) return `ENDLESS · TOWER ${spec.id} · ${spec.name}${peak}`;
    return `TOWER ${spec.id} · ${spec.name}${peak}`;
  }

  function drawRoomCard(ctx, spec, ms) {
    if (!spec || !(ms > 0)) return;
    const a = Math.min(1, ms / 220);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(12,6,9,0.92)";
    ctx.fillRect(22, 148, W - 44, 100);
    ctx.strokeStyle = spec.coda ? "#e8a0b8" : "#f0d09a";
    ctx.lineWidth = 2.2;
    ctx.strokeRect(22.5, 148.5, W - 45, 99);
    ctx.fillStyle = spec.coda ? "#e8a0b8" : "#d4a45a";
    ctx.font = "bold 11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(spec.coda ? "ENDLESS SKY PEG" : "AUTHORED TOWER", W / 2, 170);
    ctx.fillStyle = "#fff6ec";
    ctx.font = "bold 20px Georgia, serif";
    ctx.fillText(spec.name, W / 2, 198);
    ctx.fillStyle = "#e8a0b8";
    ctx.font = "11px Georgia, serif";
    ctx.fillText(roomTell(spec), W / 2, 226);
    ctx.restore();
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: highstrikerStageParams,
      bandParams: highstrikerBandParams,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      codaParams: highstrikerCoda,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function cabinetOn() {
    const node = document.getElementById("cabinet-high-striker");
    return !!(node && !node.hidden);
  }

  function punchStart() {
    stampDepthCopy();
    setText("highStrikerStatus", DEPTH_COPY.punch);
    const btn = el("highStrikerStart");
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
      const spec = run.spec || highstrikerStageParams(Math.max(1, (run.towers | 0) + 1));
      hud.textContent = hudStageLine(spec, run.towers | 0, run.peak | 0);
      hud.hidden = false;
    } else {
      hud.textContent = "TOWER 0";
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
    const n = isLive() || (run && run.dying) ? (run.slips | 0) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < n));
  }

  function challengeLine(n) {
    const kitRun = rk();
    if (kitRun && typeof kitRun.challengeText === "function") {
      try { return kitRun.challengeText("High Striker tower", n | 0, GAME_ID); } catch (_) { /* authored */ }
    }
    return `Beat my High Striker tower ${n | 0} on Penny Fever`;
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
      deathReason: partial.deathReason || "hammer slip",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestHighStriker = Math.max(state.bestHighStriker || 0, payload.depth);
      state.bestHighStrikerScore = Math.max(state.bestHighStrikerScore || 0, payload.score);
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function tellDepth(n) {
    const towers = n | 0;
    if (run && run.kitRun) run.kitRun.depth = towers;
    const spec = (run && run.spec) || highstrikerStageParams(Math.max(1, towers));
    if (run && run.kitRun && rk() && typeof rk().reportDepth === "function") {
      try {
        rk().reportDepth(run.kitRun, towers, {
          name: spec.name,
          coda: !!spec.coda,
          pegs: run.peak | 0,
        });
      } catch (_) { /* hud optional */ }
    }
    ensureHud();
  }

  function tellStrike(reason) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportStrike !== "function") return;
    try { rk().reportStrike(run.kitRun, reason); } catch (_) { /* pips */ }
    paintPips();
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
      /* Launcher only. Stall owns peg climb, slips, zero-falls, bell checkpoints.
       * TimingTap.tap uses performance.now + frozen windowMs — do not drive the mallet with it.
       * Shadow ctx so reportDepth/finishRun cannot steal the coin run. */
      return engines.TimingTap.mount(el("highStrikerCanvas") || card(), {
        windowMs: 180,
        strikesToDeath: 99,
        clearCount: 999,
        stageParams: highstrikerStageParams,
        schedule(stage) {
          const band = highstrikerBandParams(stage);
          const now = (run && run.t) || 0;
          const period = 1000 / Math.max(0.2, band.speed);
          return [
            { at: now + period * 0.62, fake: !!band.fakeBell },
            { at: now + period * 1.62, fake: false },
          ];
        },
        onHit() {},
        onFake() { kit.sfx("spinner"); },
      }, shadowCtx(ctx));
    } catch (_) {
      return null;
    }
  }

  function card() {
    return el("highStrikerCard");
  }

  function restMul(t) {
    return (run && run.restUntil && t < run.restUntil) ? 0.52 : 1;
  }

  function liveSpec() {
    const spec = run && run.spec ? run.spec : attractSpec();
    let zoneH = Math.max(0.04, (spec.zoneH || 0.14) * (run && run.hitShrink ? run.hitShrink : 1));
    if (run && spec.kind === "cascade" && run.pendingShrink) {
      zoneH *= 0.62;
    }
    if (run && spec.shrinkAfterHit && !spec.shrinkOnce) {
      zoneH = Math.max(0.04, zoneH);
    }
    const speed = (spec.speed || 0.5) * restMul(run ? run.t : 0);
    return Object.assign({}, spec, { zoneH, speed });
  }

  function indicatorPos(t, spec) {
    const speed = spec && spec.speed != null ? spec.speed : 0.5;
    const reverse = !!(spec && (spec.reverse || spec.kind === "reverse"));
    const rate = Math.max(0.15, speed);
    const u = ((t / 1000) * rate) % 2;
    const tri = u < 1 ? u : 2 - u;
    return reverse ? 1 - tri : tri;
  }

  function indicatorDir(t, spec) {
    const speed = spec && spec.speed != null ? spec.speed : 0.5;
    const reverse = !!(spec && (spec.reverse || spec.kind === "reverse"));
    const rate = Math.max(0.15, speed);
    const u = ((t / 1000) * rate) % 2;
    let rising = u < 1;
    if (reverse) rising = !rising;
    return rising ? 1 : -1;
  }

  function indicatorX(t, spec) {
    if (!spec || !spec.sway) return 0.5;
    return 0.5 + Math.sin(t * 0.00215) * 0.34;
  }

  function zoneMidX(t, spec) {
    if (!spec || !spec.sway) return 0.5;
    return 0.5 + Math.sin(t * 0.00128 + 1.1) * 0.3;
  }

  function ghostBeatPos(t, spec) {
    const speed = spec && spec.speed != null ? spec.speed : 0.5;
    const rate = Math.max(0.15, speed);
    const u = ((t / 1000) * rate) % 2;
    return u < 1 ? u : 2 - u;
  }

  function zoneWindows(t, spec) {
    const kind = (spec && spec.kind) || "vertical";
    let h = spec.zoneH || 0.14;
    if (kind === "vertical") h *= 1.08;
    const driftAmp = kind === "reverse" ? 0.1 : kind === "axis2d" || spec.sway ? 0.04 : 0.07;
    const drift = Math.sin(t * 0.00115) * driftAmp;
    let baseMid = 0.56;
    if (kind === "reverse") baseMid = 0.4;
    if (kind === "vertical") baseMid = 0.52;
    if (kind === "cascade") baseMid = 0.58;
    const mid = kit.clamp(baseMid + drift, 0.22, 0.88);
    const zx = zoneMidX(t, spec);
    const real = {
      lo: kit.clamp(mid - h / 2, 0.04, 0.9),
      hi: kit.clamp(mid + h / 2, 0.1, 0.96),
      mid,
      x: zx,
      xHalf: spec && spec.sway ? 0.16 : 0.5,
      real: true,
    };
    return [real];
  }

  function inSway(posX, win) {
    if (!win || win.xHalf >= 0.45) return true;
    return Math.abs((posX == null ? 0.5 : posX) - win.x) <= win.xHalf;
  }

  function inAnyReal(pos, wins, spec, dir, posX) {
    return wins.some((w) => w.real && pos >= w.lo && pos <= w.hi && inSway(posX, w));
  }

  function splitHitAt(pos, wins) {
    const hit = wins.find((w) => w.split && w.real && pos >= w.lo && pos <= w.hi);
    return hit ? hit.split : "";
  }

  function inGhost(pos, wins) {
    return wins.some((w) => !w.real && !w.liar && !w.camp && pos >= w.lo && pos <= w.hi);
  }

  function inLiarGold(pos, wins) {
    return wins.some((w) => w.liar && pos >= w.lo && pos <= w.hi);
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
    const canvas = el("highStrikerCanvas");
    if (canvas) {
      const live = isLive();
      canvas.style.pointerEvents = live ? "auto" : "none";
      canvas.style.touchAction = "none";
      canvas.classList.toggle("is-locked", !live);
    }
    ensureHud();
    paintPips();
    if (!isLive() && el("highStrikerStatus") && (!run || run.done)) {
      el("highStrikerStatus").textContent = DEPTH_COPY.status;
    }
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("highstriker")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
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
      if (idleClock > 3600) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
      }
      draw(now);
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }

  function spawnSparks(x, y, n, color) {
    if (!run) return;
    run.sparks = run.sparks || [];
    for (let i = 0; i < n; i += 1) {
      const a = Math.random() * TAU;
      const s = 0.6 + Math.random() * 2.4;
      run.sparks.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.6,
        life: 280 + Math.random() * 220,
        color: color || "#f0d09a",
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
        s.vy += 0.08 * k;
        return s.life > 0;
      });
    }
    if (run.dust) {
      run.dust = run.dust.filter((d) => {
        d.life -= dt;
        d.x += d.vx * k;
        d.y += d.vy * k * 0.2;
        d.r += 0.04 * k;
        return d.life > 0;
      });
    }
    run.malletSwing = Math.max(0, (run.malletSwing || 0) - dt * 0.0048);
    run.bellShake = Math.max(0, (run.bellShake || 0) - dt);
    run.shrinkFlash = Math.max(0, (run.shrinkFlash || 0) - dt);
    run.stutterFlash = Math.max(0, (run.stutterFlash || 0) - dt);
    run.hitchFlash = Math.max(0, (run.hitchFlash || 0) - dt);
    run.hitFlash = Math.max(0, (run.hitFlash || 0) - dt);
    run.missFlash = Math.max(0, (run.missFlash || 0) - dt);
    run.toastMs = Math.max(0, (run.toastMs || 0) - dt);
    run.roomCardMs = Math.max(0, (run.roomCardMs || 0) - dt);
    run.puckVis = kit.lerp(run.puckVis == null ? run.pegs : run.puckVis, run.pegs, Math.min(1, dt * 0.012));
  }

  function drawSparks(ctx) {
    if (!run || !run.sparks) return;
    run.sparks.forEach((s) => {
      ctx.globalAlpha = Math.max(0, s.life / 420);
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x - 1.2, s.y - 1.2, 2.4, 2.4);
    });
    ctx.globalAlpha = 1;
    if (run.dust) {
      run.dust.forEach((d) => {
        ctx.globalAlpha = Math.max(0, d.life / 420) * 0.45;
        ctx.fillStyle = "#8a6230";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, TAU);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
  }

  function drawBell(ctx, x, y, lit, shake) {
    ctx.save();
    ctx.translate(x + (shake ? (Math.random() - 0.5) * 3.2 : 0), y);
    if (shake) ctx.rotate((Math.random() - 0.5) * 0.12);
    ctx.fillStyle = lit ? "#f0d09a" : "#8a6230";
    ctx.beginPath();
    ctx.moveTo(-16, 6);
    ctx.quadraticCurveTo(-18, -10, 0, -16);
    ctx.quadraticCurveTo(18, -10, 16, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#f0d09a";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = lit ? "#c41e3a" : "#3a2418";
    ctx.beginPath();
    ctx.arc(0, 10, 3.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawMallet(ctx, swing) {
    const u = kit.clamp(swing || 0, 0, 1);
    const ang = -0.55 + u * 1.35;
    ctx.save();
    ctx.translate(248, 428);
    ctx.rotate(ang);
    ctx.fillStyle = "#3a2418";
    ctx.fillRect(-5, -62, 10, 62);
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(-4, -62, 3, 62);
    ctx.fillStyle = "#c41e3a";
    ctx.fillRect(-16, -78, 32, 20);
    ctx.strokeStyle = "#f0d09a";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-15.5, -77.5, 31, 19);
    ctx.fillStyle = "#8a6230";
    ctx.fillRect(-18, -82, 36, 8);
    ctx.restore();
  }

  function drawPips(ctx, x, y, filled, max, on, off) {
    for (let i = 0; i < max; i += 1) {
      ctx.beginPath();
      ctx.arc(x + i * 13, y, 4.4, 0, TAU);
      ctx.fillStyle = i < filled ? on : off;
      ctx.fill();
      ctx.strokeStyle = "rgba(240,208,154,0.45)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawGlory(ctx, spec, towers, pegs) {
    const name = spec.name || spec.title || "Tower";
    ctx.save();
    ctx.fillStyle = "rgba(12,6,9,0.9)";
    ctx.fillRect(12, H - 64, W - 24, 56);
    ctx.strokeStyle = "rgba(212,164,90,0.74)";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(12.5, H - 63.5, W - 25, 55);
    ctx.fillStyle = "#f0d09a";
    ctx.font = "bold 30px Georgia, serif";
    ctx.textAlign = "center";
    const playing = spec.id || towers;
    ctx.fillText(spec.coda ? `ENDLESS ${playing}` : `TOWER ${playing}`, W / 2, H - 32);
    ctx.font = "11px Georgia, serif";
    ctx.fillStyle = spec.coda ? "#e8a0b8" : "#d4a45a";
    ctx.fillText(`${name} · PEGS ${pegs | 0}`, W / 2, H - 14);
    ctx.restore();
  }

  function draw(now) {
    const canvas = el("highStrikerCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (run) run.shake = kit.applyShake(ctx, run.shake || 0);

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#241018");
    g.addColorStop(0.55, "#160a0e");
    g.addColorStop(1, "#0c0608");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const specEarly = liveSpec();
    if (specEarly.kind === "reverse") {
      ctx.fillStyle = "rgba(61,138,138,0.1)";
      ctx.fillRect(0, 0, W, H);
    } else if (specEarly.kind === "fakeBell") {
      ctx.fillStyle = "rgba(196,30,58,0.12)";
      ctx.fillRect(0, 0, W, H * 0.28);
    } else if (specEarly.kind === "axis2d" || specEarly.sway) {
      ctx.fillStyle = "rgba(61,138,138,0.08)";
      ctx.fillRect(0, 0, W, H);
    } else if (specEarly.kind === "doubleTap") {
      ctx.fillStyle = "rgba(240,208,154,0.07)";
      ctx.fillRect(0, 0, W, H);
    } else if (specEarly.kind === "cascade") {
      ctx.fillStyle = "rgba(232,160,184,0.08)";
      ctx.fillRect(0, 0, W, H);
    } else if (specEarly.kind === "fever") {
      ctx.fillStyle = "rgba(196,30,58,0.1)";
      ctx.fillRect(0, 0, W, H);
    } else if (specEarly.coda) {
      ctx.fillStyle = "rgba(196,30,58,0.06)";
      ctx.fillRect(0, 0, W, H);
    }

    ctx.fillStyle = "rgba(240,208,154,0.06)";
    for (let s = 0; s < 18; s += 1) {
      ctx.fillRect(12 + (s * 47) % (W - 24), 12 + (s * 29) % 50, 2, 2);
    }

    ctx.fillStyle = "#1a0c10";
    ctx.fillRect(28, 430, W - 56, 28);
    ctx.fillStyle = "#3a2418";
    ctx.fillRect(44, 418, W - 88, 16);
    ctx.fillStyle = "rgba(90,58,24,0.55)";
    ctx.fillRect(52, 420, W - 104, 4);

    kit.fillWood(ctx, TOWER.x, TOWER.y, TOWER.w, TOWER.h);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 3;
    ctx.strokeRect(TOWER.x + 0.5, TOWER.y + 0.5, TOWER.w - 1, TOWER.h - 1);
    ctx.fillStyle = "rgba(12,6,9,0.35)";
    ctx.fillRect(TOWER.x + 28, TOWER.y + 8, 8, TOWER.h - 16);

    const t = run ? run.t : (now || performance.now());
    const spec = liveSpec();
    const wins = zoneWindows(t, spec);
    const pos = indicatorPos(t, spec);
    const dir = indicatorDir(t, spec);
    const pegs = run ? run.pegs : 0;
    const peak = run ? run.peak : 0;
    const visPegs = run && run.puckVis != null ? run.puckVis : pegs;
    const tell = roomTell(spec);

    const labels = ["WEAK", "STRONG", "BELL", "DANGER"];
    labels.forEach((lab, i) => {
      const y = TOWER.y + TOWER.h - 18 - (i / 3) * (TOWER.h - 36);
      ctx.fillStyle = i === 2 ? "rgba(196,30,58,0.55)" : "rgba(240,208,154,0.28)";
      ctx.font = "8px Georgia, serif";
      ctx.textAlign = "right";
      ctx.fillText(lab, TOWER.x - 22, y);
    });

    const posX = indicatorX(t, spec);
    const hot = inAnyReal(pos, wins, spec, dir, posX);
    wins.forEach((win) => {
      const zoneY = TOWER.y + (1 - win.hi) * TOWER.h;
      const zoneHpx = Math.max(4, (win.hi - win.lo) * TOWER.h);
      const swayShift = spec.sway ? (win.x - 0.5) * (TOWER.w + 40) : 0;
      const zoneW = spec.sway ? Math.max(28, TOWER.w * 0.58) : TOWER.w - 8;
      const zoneX = TOWER.x + 4 + swayShift - (spec.sway ? (zoneW - (TOWER.w - 8)) / 2 : 0);
      const hoveringY = pos >= win.lo && pos <= win.hi;
      const hovering = hoveringY && inSway(posX, win);
      const struck = !!(run && run.windowConsumed && win.real && hovering);
      const thisHot = win.real && hovering && !struck;
      ctx.fillStyle = thisHot ? "rgba(61,138,138,0.42)" : struck ? "rgba(12,6,9,0.55)" : "rgba(240,208,154,0.16)";
      ctx.fillRect(zoneX, zoneY, zoneW, zoneHpx);
      ctx.strokeStyle = thisHot ? "#b8e8e0" : struck ? "#8a6230" : "rgba(240,208,154,0.55)";
      ctx.lineWidth = thisHot ? 2.2 : 1.5;
      ctx.strokeRect(zoneX + 0.5, zoneY + 0.5, zoneW - 1, zoneHpx - 1);
      if (spec.sway) {
        ctx.fillStyle = hoveringY && !hovering ? "#e8a0b8" : "#b8e8e0";
        ctx.font = "bold 8px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(hoveringY && !hovering ? "OFF AXIS" : "2-AXIS", zoneX + zoneW / 2, zoneY - 4);
      }
      if (struck) {
        ctx.fillStyle = "#8a6230";
        ctx.font = "bold 11px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("STRUCK", zoneX + zoneW / 2, zoneY + zoneHpx / 2 + 4);
      } else if (thisHot) {
        ctx.fillStyle = "rgba(184,232,224,0.18)";
        ctx.fillRect(zoneX, zoneY, zoneW, zoneHpx);
        if (isLive()) {
          ctx.fillStyle = "#b8e8e0";
          ctx.font = "bold 15px Georgia, serif";
          ctx.textAlign = "center";
          const nowTxt = spec.kind === "doubleTap"
            ? (run && run.doubleArmed ? "AGAIN" : "TAP TAP")
            : "NOW";
          ctx.fillText(nowTxt, zoneX + zoneW / 2, zoneY + zoneHpx / 2 + 5);
        }
      }
      if (run && run.shrinkFlash > 0 && win.real) {
        ctx.strokeStyle = `rgba(196,30,58,${Math.min(0.85, run.shrinkFlash / 280)})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(zoneX - 2, zoneY - 3, zoneW + 4, zoneHpx + 6);
      }
    });

    ctx.fillStyle = "rgba(12,6,9,0.78)";
    const extraTell = spec.kind === "reverse" || spec.kind === "axis2d" || spec.sway || spec.kind === "doubleTap" || spec.kind === "fakeBell" || spec.kind === "cascade" || spec.kind === "fever";
    ctx.fillRect(22, 8, W - 44, extraTell ? 38 : 22);
    ctx.fillStyle = spec.kind === "fakeBell" || spec.kind === "fever" ? "#e8a0b8" : "#f0d09a";
    ctx.font = "bold 10px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(tell, W / 2, 23);
    if (spec.kind === "reverse") {
      ctx.fillStyle = "#b8e8e0";
      ctx.font = "bold 9px Georgia, serif";
      ctx.fillText("PINK GHOST = OLD BEAT — DON’T SWING IT", W / 2, 42);
    } else if (spec.kind === "axis2d" || (spec.sway && spec.kind !== "fever")) {
      ctx.fillStyle = "#b8e8e0";
      ctx.font = "bold 9px Georgia, serif";
      ctx.fillText("MARKER AND GOLD BOTH DRIFT — HIT BOTH AXES", W / 2, 42);
    } else if (spec.kind === "doubleTap") {
      ctx.fillStyle = "#f0d09a";
      ctx.font = "bold 9px Georgia, serif";
      ctx.fillText("TWO TAPS WHILE GOLD · 280ms", W / 2, 42);
    } else if (spec.kind === "fakeBell") {
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "bold 9px Georgia, serif";
      ctx.fillText("PEG 3 DING IS A LIAR · REAL BELL ON CLEAR", W / 2, 42);
    } else if (spec.kind === "cascade") {
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "bold 9px Georgia, serif";
      ctx.fillText("MISS −2 · NEXT PEG’S GOLD SHRINKS ONCE", W / 2, 42);
    } else if (spec.kind === "fever") {
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "bold 9px Georgia, serif";
      ctx.fillText("SWAY + FAKE DING + SHRINK · FINALE DOUBLE-BELL", W / 2, 42);
    } else if (spec.kind === "bellLadder") {
      ctx.fillStyle = "#f0d09a";
      ctx.font = "bold 9px Georgia, serif";
      ctx.fillText("BELL EVERY THREE PEGS THIS TOWER", W / 2, 42);
    }

    const vis = 12;
    const base = Math.max(0, Math.floor(visPegs) - 4);
    for (let i = 0; i <= vis; i += 1) {
      const pegN = base + i;
      const y = TOWER.y + TOWER.h - 10 - (i / vis) * (TOWER.h - 28);
      ctx.fillStyle = pegN > 0 && pegN % BELL_EVERY === 0 ? "#c41e3a" : "#d4a45a";
      ctx.fillRect(TOWER.x + TOWER.w - 2, y - 1, 14, 3);
      if (pegN > 0 && (pegN % 5 === 0 || i === vis || pegN === Math.round(visPegs))) {
        ctx.fillStyle = pegN > 0 && pegN % BELL_EVERY === 0 ? "#e8a0b8" : "#f0d09a";
        ctx.font = "10px Georgia, serif";
        ctx.textAlign = "left";
        ctx.fillText(String(pegN), TOWER.x + TOWER.w + 16, y + 3);
      }
    }

    const puckI = kit.clamp(visPegs - base, 0, vis);
    const puckY = TOWER.y + TOWER.h - 10 - (puckI / vis) * (TOWER.h - 28);
    ctx.fillStyle = "#c41e3a";
    ctx.fillRect(TOWER.x + 10, puckY - 6, TOWER.w - 36, 12);
    ctx.strokeStyle = "#fff6ec";
    ctx.strokeRect(TOWER.x + 10.5, puckY - 5.5, TOWER.w - 37, 11);
    ctx.fillStyle = "rgba(255,246,236,0.35)";
    ctx.fillRect(TOWER.x + 14, puckY - 3, TOWER.w - 52, 3);

    if (spec.kind === "reverse") {
      const ghostPos = ghostBeatPos(t, spec);
      const gY = TOWER.y + (1 - ghostPos) * TOWER.h;
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = "#e8a0b8";
      ctx.beginPath();
      ctx.moveTo(TOWER.x - 4, gY);
      ctx.lineTo(TOWER.x - 16, gY - 6);
      ctx.lineTo(TOWER.x - 16, gY + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(TOWER.x + 8, gY - 1.5, TOWER.w - 24, 3);
      ctx.restore();
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "bold 8px Georgia, serif";
      ctx.textAlign = "right";
      ctx.fillText("OLD", TOWER.x - 20, gY + 3);
    }

    const indY = TOWER.y + (1 - pos) * TOWER.h;
    const indShift = spec.sway ? (posX - 0.5) * (TOWER.w + 36) : 0;
    ctx.fillStyle = hot ? "#b8e8e0" : "#f0d09a";
    ctx.beginPath();
    ctx.moveTo(TOWER.x - 4 + indShift, indY);
    ctx.lineTo(TOWER.x - 18 + indShift, indY - 7);
    ctx.lineTo(TOWER.x - 18 + indShift, indY + 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(TOWER.x + 6 + indShift, indY - 2, spec.sway ? TOWER.w * 0.46 : TOWER.w - 20, 4);
    ctx.fillStyle = spec.kind === "reverse" ? "#e8a0b8" : "#f0d09a";
    ctx.beginPath();
    if (dir > 0) {
      ctx.moveTo(TOWER.x - 26 + indShift, indY + 6);
      ctx.lineTo(TOWER.x - 22 + indShift, indY - 6);
      ctx.lineTo(TOWER.x - 18 + indShift, indY + 6);
    } else {
      ctx.moveTo(TOWER.x - 26 + indShift, indY - 6);
      ctx.lineTo(TOWER.x - 22 + indShift, indY + 6);
      ctx.lineTo(TOWER.x - 18 + indShift, indY - 6);
    }
    ctx.closePath();
    ctx.fill();

    const bells = Math.floor(peak / BELL_EVERY);
    const bellLit = !!(run && (run.bellFlash > 0 || bells > 0));
    drawBell(ctx, TOWER.x + TOWER.w / 2, TOWER.y - 6, bellLit, run && run.bellShake > 0);
    if (run && run.fakeBellFlash > 0) {
      const a = Math.min(0.7, run.fakeBellFlash / 280);
      ctx.fillStyle = `rgba(196,30,58,${a})`;
      ctx.font = "bold 13px Georgia, serif";
      ctx.textAlign = "center";
      const fakeLine = "FAKE DING — NOT A CHECKPOINT";
      ctx.fillText(fakeLine, TOWER.x + TOWER.w / 2, TOWER.y + 22);
      ctx.strokeStyle = `rgba(196,30,58,${a})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(TOWER.x + TOWER.w / 2, TOWER.y - 6, 22, 0, TAU);
      ctx.stroke();
    }
    if (run && run.doubleArmed) {
      ctx.fillStyle = "rgba(61,138,138,0.62)";
      ctx.fillRect(TOWER.x + 4, TOWER.y + 4, TOWER.w - 8, 22);
      ctx.fillStyle = "#fff6ec";
      ctx.font = "bold 11px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("AGAIN — 280ms", TOWER.x + TOWER.w / 2, TOWER.y + 20);
    }

    drawMallet(ctx, run ? run.malletSwing : 0.12 + Math.sin(t * 0.002) * 0.08);

    if (isLive() || (run && run.dying)) {
      drawGlory(ctx, spec, spec.id || run.towers, peak);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "9px Georgia, serif";
      ctx.textAlign = "left";
      ctx.fillText("ZERO", 22, H - 48);
      drawPips(ctx, 58, H - 52, run.fallsFromZero, 2, "#c41e3a", "rgba(240,208,154,0.18)");
      if (spec.slipOnMiss <= -2) {
        ctx.fillStyle = "#e8a0b8";
        ctx.font = "bold 9px Georgia, serif";
        ctx.textAlign = "left";
        ctx.fillText("MISS −2", 22, H - 36);
      }
      ctx.textAlign = "right";
      ctx.fillStyle = "#d4a45a";
      ctx.fillText(`${run.score}`, W - 20, H - 48);
    }

    drawSparks(ctx);

    if (run && run.hitFlash > 0) {
      ctx.fillStyle = `rgba(184,232,224,${Math.min(0.28, run.hitFlash / 420)})`;
      ctx.fillRect(0, 0, W, H);
    } else if (run && run.missFlash > 0) {
      ctx.fillStyle = `rgba(196,30,58,${Math.min(0.28, run.missFlash / 380)})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (run && run.restUntil && run.t < run.restUntil) {
      ctx.fillStyle = "rgba(12,6,9,0.72)";
      ctx.fillRect(28, 34, W - 56, 22);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "bold 12px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("CHECKPOINT — KEEP CLIMBING", W / 2, 50);
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

    if (run && run.roomCardMs > 0) drawRoomCard(ctx, spec, run.roomCardMs);

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, "SLIP");

    if (!isLive() && (!run || (!run.closedStamp && !run.dying))) {
      const shown = attractSpec();
      kit.drawHud(ctx, W, [
        `${shown.name} — ${roomTell(shown)}`,
        DEPTH_COPY.idleHud[1],
      ]);
    }
  }

  function start() {
    if (isLive()) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("highStrikerStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      stampDepthCopy();
      return;
    }
    stopIdle();
    const spec0 = highstrikerStageParams(1);
    run = {
      done: false,
      dying: false,
      kitRun,
      tapper: null,
      t: 0,
      last: 0,
      spec: spec0,
      tower: 1,
      towers: 0,
      chapterPegs: 0,
      pegs: 0,
      peak: 0,
      puckVis: 0,
      score: 0,
      slips: 0,
      slipFloor: 0,
      fallsFromZero: 0,
      hitShrink: 1,
      pendingShrink: false,
      windowConsumed: false,
      lastTapAt: 0,
      tapLock: TAP_LOCK_MS,
      doubleArmed: 0,
      fakeBellDone: false,
      bellFlash: 0,
      fakeBellFlash: 0,
      malletSwing: 0,
      bellShake: 0,
      shrinkFlash: 0,
      sparks: [],
      dust: [],
      toast: "",
      toastMs: 0,
      raf: 0,
      shake: 0,
      closedStamp: false,
      deathHold: 0,
      deathReason: "",
      lastNote: "",
      lastHitAt: 0,
      restUntil: 0,
      hitFlash: 0,
      missFlash: 0,
      roomCardMs: 1280,
    };
    tellDepth(0);
    run.tapper = mountTap(kitRun);
    tellDepth(0);
    paintPips();
    const startBtn = el("highStrikerStart");
    if (startBtn) startBtn.disabled = true;
    const verdict = el("highStrikerVerdict");
    if (verdict) verdict.hidden = true;
    const tapBtn = el("highStrikerTap");
    if (tapBtn) {
      tapBtn.hidden = false;
      tapBtn.textContent = "SWING";
    }
    kit.hideResult("highStrikerResult");
    PF.setTier("highStrikerTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    setText("highStrikerStatus", `${spec0.name} — ${spec0.barker}`);
    PF.focusCard("highStrikerCard", true);
    PF.setAura("think");
    const loop = (now) => {
      if (!run || run.done) return;
      if (!run.last) run.last = now;
      const dt = Math.min(32, now - run.last);
      run.last = now;
      run.t += dt;
      if (run.dying) {
        run.bellFlash = Math.max(0, run.bellFlash - dt);
        run.puckVis = kit.lerp(run.puckVis == null ? run.pegs : run.puckVis, 0, Math.min(1, dt * 0.008));
        run.malletSwing = Math.max(0, (run.malletSwing || 0) - dt * 0.0012);
        stepFx(dt);
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

  function toast(msg, ms) {
    run.toast = msg;
    run.toastMs = ms || 720;
  }

  function step(dt) {
    run.bellFlash = Math.max(0, run.bellFlash - dt);
    run.fakeBellFlash = Math.max(0, run.fakeBellFlash - dt);
    stepFx(dt);
    const spec = liveSpec();
    const wins = zoneWindows(run.t, spec);
    const pos = indicatorPos(run.t, spec);
    const dir = indicatorDir(run.t, spec);
    const posX = indicatorX(run.t, spec);
    const inside = inAnyReal(pos, wins, spec, dir, posX);
    if (!inside) {
      run.windowConsumed = false;
      if (spec.kind === "cascade" && run.pendingShrink && run.chapterPegs > 0) {
        /* shrink lasts until this next peg is played; reset after the pass leaves gold */
      }
    }
    if (run.doubleArmed && run.t > run.doubleArmed) {
      run.doubleArmed = 0;
      toast("TOO LATE — two taps", 640);
    }
  }

  function swing() {
    if (!isLive()) return;
    const now = run.t;
    const lock = run.tapLock || TAP_LOCK_MS;
    if (now - run.lastTapAt < lock) return;
    run.lastTapAt = now;
    run.malletSwing = 1;
    const spec = liveSpec();
    const wins = zoneWindows(run.t, spec);
    const pos = indicatorPos(run.t, spec);
    const dir = indicatorDir(run.t, spec);
    const posX = indicatorX(run.t, spec);
    if (run.windowConsumed) {
      run.lastNote = "struck";
      setText("highStrikerStatus", "Window already struck — wait for the next pass.");
      toast("STRUCK — wait the next pass", 520);
      return;
    }
    if (inAnyReal(pos, wins, spec, dir, posX)) {
      run.tapLock = TAP_LOCK_MS;
      run.lastNote = "";
      if (spec.doubleTap || spec.kind === "doubleTap") {
        const windowMs = spec.doubleTapMs || DOUBLE_TAP_MS;
        if (!run.doubleArmed) {
          run.doubleArmed = run.t + windowMs;
          toast("AGAIN — 280ms", 520);
          setText("highStrikerStatus", "First tap armed. Tap again in the gold.");
          return;
        }
        run.doubleArmed = 0;
      }
      climb();
      return;
    }
    if (spec.sway && wins.some((w) => pos >= w.lo && pos <= w.hi && !inSway(posX, w))) {
      run.lastNote = "sway";
      toast("OFF AXIS — hit the drifting gold", 900);
      setText("highStrikerStatus", "Height is not enough. Catch the sideways gold.");
    } else if (spec.kind === "reverse" && inAnyReal(ghostBeatPos(run.t, spec), wins, spec, dir, 0.5)) {
      run.lastNote = "oldBeat";
      toast("OLD BEAT — follow the live arrow", 900);
      setText("highStrikerStatus", "That’s the old beat ghost. Follow the live arrow.");
    } else if (spec.kind === "reverse") {
      run.lastNote = "reverse";
    } else if (spec.doubleTap || spec.kind === "doubleTap") {
      run.lastNote = "double";
      run.doubleArmed = 0;
      toast("ONE TAP IS AIR", 720);
    } else {
      run.lastNote = "slip";
      run.doubleArmed = 0;
    }
    run.tapLock = MISS_LOCK_MS;
    slip();
  }

  function ringBell(label, extra) {
    run.score += 200;
    if (extra) run.score += 200;
    if (run.kitRun) run.kitRun.score = run.score;
    run.bellFlash = extra ? 900 : 640;
    run.bellShake = extra ? 560 : 420;
    spawnSparks(TOWER.x + TOWER.w / 2, TOWER.y - 6, extra ? 22 : 16, "#f0d09a");
    kit.sfx("rack");
    run.restUntil = run.t + 560;
    toast(label || "BELL — checkpoint. KEEP CLIMBING.", extra ? 1300 : 1100);
    PF.setAura("celebrate");
  }

  function enterTower(next) {
    run.spec = next;
    run.tower = next.id;
    run.chapterPegs = 0;
    run.slips = 0;
    run.slipFloor = 0;
    run.hitShrink = 1;
    run.pendingShrink = false;
    run.doubleArmed = 0;
    run.fakeBellDone = false;
    run.windowConsumed = false;
    run.roomCardMs = 1180;
    kit.sfx("chapter");
    toast(next.coda ? `ENDLESS · ${next.name}` : next.name, 900);
    setText("highStrikerStatus", `${next.coda ? "ENDLESS · " : ""}${next.name} — ${next.barker}`);
    tellDepth(run.towers);
  }

  function clearTower() {
    run.towers += 1;
    const spec = run.spec;
    if (spec.finaleDoubleBell) {
      ringBell("FINALE DOUBLE-BELL — authored tower done", true);
    } else {
      ringBell(`${spec.name.toUpperCase()} CLEAR — keep climbing`);
    }
    if (run.kitRun) run.kitRun.depth = run.towers;
    tellDepth(run.towers);
    paintPips();
    PF.refreshDepth();
    const next = highstrikerStageParams(run.towers + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    enterTower(next);
  }

  function climb() {
    run.windowConsumed = true;
    run.lastHitAt = run.t;
    run.doubleArmed = 0;
    const spec = liveSpec();
    if (spec.kind === "cascade" && run.pendingShrink) {
      run.pendingShrink = false;
      run.hitShrink = 1;
    }
    run.chapterPegs += 1;
    run.pegs += 1;
    run.peak = Math.max(run.peak, run.pegs);
    run.score += 30;
    run.slips = 0;
    run.slipFloor = run.chapterPegs;
    if (run.kitRun) run.kitRun.score = run.score;
    paintPips();
    PF.refreshDepth();
    run.hitFlash = 280;
    const vis = 12;
    const base = Math.max(0, run.pegs - 4);
    const puckI = kit.clamp(run.pegs - base, 0, vis);
    const puckY = TOWER.y + TOWER.h - 10 - (puckI / vis) * (TOWER.h - 28);
    spawnSparks(TOWER.x + TOWER.w / 2, puckY, 8, "#f0d09a");
    kit.sfx("sink");
    if (spec.shrinkAfterHit) {
      if (spec.shrinkOnce || spec.kind === "cascade") {
        run.pendingShrink = true;
        run.shrinkFlash = 420;
        toast("NEXT GOLD SHRINKS ONCE", 640);
      } else {
        run.hitShrink = Math.max(0.55, run.hitShrink * 0.88);
        run.shrinkFlash = 420;
        toast("WINDOW SHRANK", 640);
      }
    }
    if (spec.fakeBellAt && run.chapterPegs === spec.fakeBellAt && !run.fakeBellDone) {
      run.fakeBellDone = true;
      run.fakeBellFlash = 720;
      kit.sfx("spinner");
      toast("FAKE DING — not a checkpoint", 900);
      setText("highStrikerStatus", "Fake ding. Real bell is on tower clear.");
      run.lastNote = "fake";
    } else if (spec.bellEvery > 0 && run.chapterPegs > 0 && run.chapterPegs % spec.bellEvery === 0
      && run.chapterPegs < spec.pegsToClear) {
      ringBell(`BELL ${Math.floor(run.chapterPegs / spec.bellEvery)} — checkpoint. KEEP CLIMBING.`);
      setText("highStrikerStatus", `Bell ladder ding. ${run.chapterPegs}/${spec.pegsToClear} this tower.`);
    } else {
      setText("highStrikerStatus", `${spec.name} · ${run.chapterPegs}/${spec.pegsToClear} · peg ${run.pegs}`);
      PF.setAura("point");
    }
    run.shake = 4;
    if (run.chapterPegs >= spec.pegsToClear) clearTower();
    else tellDepth(run.towers);
  }

  function slip() {
    const spec = liveSpec();
    const atZero = run.chapterPegs <= 0;
    if (atZero) run.fallsFromZero += 1;
    run.chapterPegs = Math.max(0, run.chapterPegs + spec.slipOnMiss);
    run.pegs = Math.max(0, run.pegs + spec.slipOnMiss);
    run.slips += 1;
    run.windowConsumed = true;
    run.doubleArmed = 0;
    if (spec.kind === "cascade" && run.pendingShrink) {
      run.pendingShrink = false;
      run.hitShrink = 1;
    }
    run.shake = 6;
    run.dust = run.dust || [];
    run.dust.push({ x: 248, y: 428, vx: -0.4, vy: -0.2, r: 4, life: 380 });
    run.dust.push({ x: 256, y: 430, vx: 0.5, vy: -0.15, r: 3, life: 320 });
    tellStrike(atZero ? "fell from zero" : "hammer slip");
    paintPips();
    run.missFlash = 320;
    kit.sfx("miss");
    spawnSparks(TOWER.x + 20, TOWER.y + TOWER.h - 12, 6, "#c41e3a");
    setText("highStrikerStatus", atZero
      ? `Fell from zero ${run.fallsFromZero}/2. Tap the window, not the air.`
      : run.lastNote === "sway"
        ? `OFF AXIS. SLIP ${run.slips}/3 · ${spec.name}.`
        : run.lastNote === "double"
          ? `ONE TAP IS AIR. SLIP ${run.slips}/3.`
          : `SLIP ${run.slips}/3 · ${spec.slipOnMiss} peg · ${run.chapterPegs}/${spec.pegsToClear}.`);
    PF.setAura("laugh");
    if (run.fallsFromZero >= 2) {
      finish("fell from zero");
      return;
    }
    if (run.slips >= 3 && run.chapterPegs <= run.slipFloor) finish("hammer slip");
  }

  function auraLine(reason, towers) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "fell from zero") return AURA.zero;
    if (run && run.lastNote === "fake") return AURA.fake;
    if (run && (run.lastNote === "reverse" || run.lastNote === "oldBeat")) return AURA.oldBeat;
    if (run && run.lastNote === "sway") return AURA.sway;
    if (run && run.lastNote === "double") return AURA.double;
    if (run && run.lastNote === "struck") return AURA.struck;
    if (run && run.spec && run.spec.kind === "cascade") return AURA.cascade;
    if (towers <= 0) return AURA.shallow;
    if (run && run.spec && run.spec.coda) return AURA.coda;
    if (towers >= 8) return AURA.coda;
    if (towers >= 5) return AURA.deep;
    if (towers >= 2) return AURA.mid;
    return AURA.slip;
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.deathReason = reason === "souvenir"
      ? "souvenir"
      : (reason === "fell from zero" ? "fell from zero" : "hammer slip");
    run.closedStamp = reason !== "souvenir";
    run.deathHold = DEATH_HOLD_MS;
    if (run.closedStamp) kit.sfx("stamp");
    run.shake = 8;
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    if (run.raf) cancelAnimationFrame(run.raf);
    run.closedStamp = reason !== "leave" && reason !== "souvenir";
    const towers = run.towers | 0;
    const pegs = run.peak | 0;
    const score = run.score;
    const death = reason === "leave"
      ? "leave"
      : (reason === "souvenir" ? "souvenir" : (reason === "fell from zero" ? "fell from zero" : "hammer slip"));
    persistDepth({
      depth: towers,
      score,
      deathReason: death,
      cashedOut: reason === "souvenir",
      meta: {
        lastPeg: run.pegs,
        pegs,
        tower: run.spec && run.spec.id,
        room: run.spec && run.spec.name,
        kind: run.spec && run.spec.kind,
        fallsFromZero: run.fallsFromZero,
        coda: !!(run.spec && run.spec.coda),
      },
    });
    stampDepthCopy();
    const startBtn = el("highStrikerStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "SWING AGAIN · 1 demo coin";
    }
    const tapBtn = el("highStrikerTap");
    if (tapBtn) tapBtn.hidden = true;
    PF.focusCard("highStrikerCard", false);
    kit.setMode(card(), "result");
    const line = `TOWER ${towers} · PEGS ${pegs} · SCORE ${score}`;
    const aura = auraLine(reason, towers);
    const challenge = challengeLine(towers);
    const verdict = el("highStrikerVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = `${line} · ${death} · ${aura}`;
    }
    kit.fillResult({
      root: "highStrikerResult",
      depth: "highStrikerResultDepth",
      score: "highStrikerResultScore",
      aura: "highStrikerResultAura",
      copied: "highStrikerCopied",
    }, {
      depthLine: `TOWER ${towers}${run.spec && run.spec.name ? " · " + run.spec.name : ""}`,
      scoreLine: `SCORE ${score} · PEGS ${pegs} · ${death}`,
      auraLine: aura,
    });
    const reasonNode = el("highStrikerResultReason");
    if (reasonNode) reasonNode.textContent = String(death).replace(/_/g, " ").toUpperCase();
    setText("highStrikerChallengeText", challenge);
    PF.setTier("highStrikerTier", towers > 0 ? `TOWER ${towers}` : "SLIP", towers > 0 ? "perfect" : "miss");
    setText("highStrikerStatus", reason === "leave" ? "Stepped off the stall." : reason === "souvenir" ? "Souvenir — authored towers cleared." : "Tower stamped SLIP.");
    const ok = towers > 0 || pegs > 0;
    if (ok) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "High striker");
      PF.setAura(towers >= 5 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `TOWER ${towers}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "High striker miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "SLIP", aura);
    }
    PF.refreshNightBoard();
    draw();
    startIdle();
  }

  PF.registerVendor({
    id: "high-striker",
    playKey: "highstriker",
    chalk: "Ring it — then keep climbing. The bell is a checkpoint.",
    defaults: { bestHighStriker: 0, bestHighStrikerScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopIdle();
    },
    onShow() { stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      const verdict = el("highStrikerVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("highStrikerResult");
      const startBtn = el("highStrikerStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      const tapBtn = el("highStrikerTap");
      if (tapBtn) tapBtn.hidden = true;
      kit.setMode(card(), "vestibule");
      stampDepthCopy();
      startIdle();
    },
    refreshDepth(state) {
      setText("depthStrikerNow", isLive() || (run && run.dying) ? String(run.towers) : "0");
      const bestN = Math.max(state.bestHighStriker || 0, (state.bestDepth && state.bestDepth.highstriker) || 0);
      setText("depthStrikerBest", bestN ? String(bestN) : "—");
      setText("depthStrikerScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("depthStrikerBestScore", state.bestHighStrikerScore ? String(state.bestHighStrikerScore) : "—");
      const door = el("highStrikerDoorBest");
      if (door) door.textContent = bestN ? `Best tower ${bestN}` : "Towers —";
    },
    bind() {
      declareP0();
      const startBtn = el("highStrikerStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const tapBtn = el("highStrikerTap");
      if (tapBtn) {
        tapBtn.addEventListener("click", (ev) => {
          ev.preventDefault();
          if (!isLive()) {
            if (!run || run.done) punchStart();
            return;
          }
          swing();
        });
      }
      const canvas = el("highStrikerCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            if (!run || run.done) punchStart();
            return;
          }
          ev.preventDefault();
          swing();
        });
      }
      window.addEventListener("keydown", (ev) => {
        if (!isLive() || !cabinetOn()) return;
        if (ev.code === "Space" || ev.key === " ") {
          ev.preventDefault();
          swing();
        }
      });
      const copyBtn = el("highStrikerChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const last = PF.getState().lastRun;
          const n = (last && (last.game === GAME_ID || last.gameId === GAME_ID))
            ? last.depth
            : (PF.getState().bestHighStriker || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("highStrikerCopied");
            if (copied) {
              copied.hidden = false;
              copied.textContent = "Copied — send it";
            }
            setText("highStrikerStatus", "Copied — send it");
          }, () => {
            setText("highStrikerStatus", text);
          });
        });
      }
      stampDepthCopy();
      draw();
      startIdle();
    },
  });
})();
