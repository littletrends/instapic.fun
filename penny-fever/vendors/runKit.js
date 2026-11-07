/* Goblin Batch 10 + GOBLIN_RUNKIT_API.md — shared depth-run kit.
 * Contract: startRun/finishRun/reportDepth/reportStrike + engines.*.mount
 * PF only. Stalls declare engine via map in ops/GOBLIN_RUNKIT_API.md
 */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF) return;

  const DEATH_LINES = {
    love: ["Missed the pink. Dead heat.", "Band slipped. Deeper next coin."],
    balltoss: ["Three misses. Board wins.", "Warped hole laughed."],
    coinpusher: ["Greed ate the shelf.", "Should’ve cashed."],
    fairyfloss: ["You got greedy with the spin.", "Cloud wanted slower hands."],
    popcorn: ["That was steam, sugar.", "Steam fake. Kernel laughed."],
    duckpond: ["Wrong colour. Lucky ducks aren't that one."],
    skee: ["Wax got you.", "Nine balls, board still hungry."],
    pennypitch: ["Cloth jerked. Your pennies disagreed."],
    dunk: ["Three balls. Plate danced away."],
    milk: ["Three softballs. That bottom row is concrete, sugar.", "Pyramid still standing. The heavy ones laughed."],
    coverspot: ["Spot uncovered. Greed ate the felt.", "Disc bounced off the counter. Rude."],
    watergun: ["Ghost filled first. Mouth dodged you cold.", "Stream dry. Clown mouth wandered off."],
    highstriker: ["The hammer slipped. Rhythm, not spam.", "You fell off the first peg. Twice.", "The bell is a checkpoint. You treated it like an ending.", "Ghost gold isn’t a window. Pale is real.", "Marker ran backwards. You kept the old beat."],
    bentring: ["Out of rings. The pegs leaned. You saw it.", "They duck on purpose. Ghost sticks told you.", "They traded places. You threw where they were.", "The wave ducked after you committed."],
    plinko: ["Three chips, no prize slot. The board breathed without you.", "That peg ate your chip. That’s the house.", "The pendulum lied. You dropped with the decoy.", "The funnel fed the swallow. That’s the house."],
    mutoscope: ["You blinked first. The reel only loves statues.", "Fidget slammed the iris.", "Crank lied. The stutter was poison."],
    catoptromancy: ["You looked away. The glass noticed.", "Double is sweaty. The glass took the bet.", "Hazy isn’t a skip. KEEP was still legal."],
    default: ["Dead. Deeper next coin.", "The alley keeps your mark.", "One more? Night’s still warm."],
  };

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function ensureFields(state) {
    if (!state) return state;
    state.bestDepth = state.bestDepth || { love: 0 };
    state.lastRun = state.lastRun || {};
    if (state.feverRunBest == null) state.feverRunBest = 0;
    state.kitsTonight = state.kitsTonight || [];
    return state;
  }

  function getState() {
    return ensureFields(typeof PF.getState === "function" ? PF.getState() : null);
  }

  function persist() {
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function $(sel, root) {
    if (!sel) return null;
    if (typeof sel === "string" && sel[0] !== "#" && !sel.includes(" ") && PF.$) {
      const byId = PF.$(sel);
      if (byId) return byId;
    }
    const scope = root || document;
    return typeof sel === "string" ? scope.querySelector(sel) : sel;
  }

  function makeResult(partial) {
    return {
      gameId: partial.gameId || "unknown",
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || (partial.cashedOut ? "cashed_out" : "unknown"),
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
      at: Date.now(),
    };
  }

  function startRun(opts) {
    const o = typeof opts === "string" ? { gameId: opts } : opts || {};
    const gameId = o.gameId;
    if (!gameId) return null;
    const state = getState();
    if (!state) return null;
    if (!o.feverNode && typeof PF.spendDemoCoin === "function") {
      const ok = PF.spendDemoCoin();
      if (ok === false) return null;
    }
    const runCtx = {
      gameId,
      startedAt: Date.now(),
      feverNode: !!o.feverNode,
      feverGate: o.feverGate || null,
      depth: 0,
      score: 0,
      strikes: 0,
      alive: true,
    };
    state._activeRun = runCtx;
    persist();
    return runCtx;
  }

  function declaredOf(gameId) {
    const kit = PF.runKit || {};
    return (kit.declared && kit.declared[gameId])
      || (kit.p0 && kit.p0[gameId])
      || {};
  }

  function reportDepth(runCtx, depth, extra) {
    if (!runCtx || !runCtx.alive) return;
    runCtx.depth = depth | 0;
    const info = declaredOf(runCtx.gameId);
    const unit = String(info.depthUnit || "Stage").toUpperCase();
    const name = extra && extra.name;
    const coda = !!(extra && extra.coda);
    const hud = document.querySelector(`[data-runkit-hud="${runCtx.gameId}"]`) || document.querySelector(".depth-hud");
    if (hud) {
      hud.textContent = coda
        ? `ENDLESS · ${unit} ${runCtx.depth}${name ? " · " + name : ""}`
        : `${unit} ${runCtx.depth}${name ? " · " + name : ""}`;
    }
    if (typeof PF.showBanner === "function" && runCtx.depth > 0 && runCtx.depth % 3 === 0) {
      try { PF.showBanner(`${unit} ${runCtx.depth}`); } catch (_) {}
    }
  }

  function reportStrike(runCtx, reason) {
    if (!runCtx || !runCtx.alive) return runCtx;
    runCtx.strikes = (runCtx.strikes | 0) + 1;
    const pips = document.querySelector(`[data-runkit-strikes="${runCtx.gameId}"]`) || document.querySelector(".strike-pips");
    if (pips) {
      const kids = pips.querySelectorAll("i");
      kids.forEach((el, i) => el.classList.toggle("on", i < runCtx.strikes));
    }
    runCtx._lastStrike = reason || "strike";
    return runCtx;
  }

  function finishRun(runCtx, partial, opts) {
    const state = getState();
    if (!state) return null;
    const o = opts || {};
    const base = runCtx || state._activeRun || {};
    const result = makeResult({
      gameId: (partial && partial.gameId) || base.gameId,
      depth: partial && partial.depth != null ? partial.depth : base.depth,
      score: partial && partial.score != null ? partial.score : base.score,
      deathReason: partial && partial.deathReason,
      cashedOut: partial && partial.cashedOut,
      meta: partial && partial.meta,
    });
    if (runCtx) runCtx.alive = false;
    state.lastRun = state.lastRun || {};
    if (typeof state.lastRun === "object" && !Array.isArray(state.lastRun)) {
      state.lastRun[result.gameId] = result;
      state.lastRun.game = result.gameId;
      state.lastRun.depth = result.depth;
      state.lastRun.score = result.score;
      state.lastRun.deathReason = result.deathReason;
      state.lastRun.cashedOut = result.cashedOut;
      state.lastRun.at = result.at;
    }
    state.bestDepth[result.gameId] = Math.max(state.bestDepth[result.gameId] || 0, result.depth);
    state._activeRun = null;
    const earned = window.PennyFeverInventoryModel?.recordResult(state, result) || [];
    persist();
    if (earned.length) window.dispatchEvent(new CustomEvent('pennyfever:inventoryaward', { detail: { ids: earned } }));
    if (typeof PF.refreshDepth === "function") {
      try { PF.refreshDepth(); } catch (_) {}
    }
    if (o.navigate !== false) {
      try {
        const want = `#cabinet/${result.gameId}/result`;
        if (location.hash !== want) location.hash = want;
      } catch (_) {}
    }
    return result;
  }

  function recordResult(partial) {
    return finishRun(null, partial, { navigate: false });
  }

  function challengeText(name, depth, gameId) {
    const n = depth | 0;
    if (gameId === "milk") return `Beat my Milk Bottles pyramid ${n} on Penny Fever`;
    if (gameId === "watergun") return `Beat my Water Gun heat ${n} on Penny Fever`;
    if (gameId === "coverspot") return `Beat my Cover-the-Spot stage ${n} on Penny Fever`;
    if (gameId === "balltoss") return `Beat my Ball Toss rack ${n} on Penny Fever`;
    if (gameId === "coinpusher") return `Beat my Coin Pusher floor ${n} on Penny Fever`;
    if (gameId === "pinball") return `Beat my Pinball chapter ${n} on Penny Fever`;
    if (gameId === "fairyfloss") return `Beat my Fairy Floss stage ${n} on Penny Fever`;
    if (gameId === "popcorn") return `Beat my Popcorn stage ${n} on Penny Fever`;
    if (gameId === "duckpond") return `Beat my Duck Pond stage ${n} on Penny Fever`;
    if (gameId === "skee") return `Beat my Skee-Ball stage ${n} on Penny Fever`;
    if (gameId === "pennypitch") return `Beat my Penny Pitch stage ${n} on Penny Fever`;
    if (gameId === "dunk") return `Beat my Dunk seats ${n} on Penny Fever`;
    if (gameId === "highstriker") return `Beat my High Striker pegs ${n} on Penny Fever`;
    if (gameId === "bentring") return `Beat my Bent Ring Pegs stage ${n} on Penny Fever`;
    if (gameId === "plinko") return `Beat my Plinko stage ${n} on Penny Fever`;
    if (gameId === "mutoscope") return `Beat my Mutoscope stage ${n} on Penny Fever`;
    if (gameId === "catoptromancy") return `Beat my Catoptromancy room ${n} on Penny Fever`;
    return `Beat my ${name} ${n} on Penny Fever`;
  }

  function auraDeathLine(gameId, depth, reason) {
    const d = depth | 0;
    if (gameId === "fairyfloss") {
      if (d >= 6) return `Stage ${d}. That sugar web trusts you — barely.`;
      if (d > 0) return `FLOSS ${d}m snapped. Cloud wanted slower hands.`;
      return "You got greedy with the spin.";
    }
    if (gameId === "popcorn") {
      if (reason === "fake_tap") return "Steam fake. Kernel laughed.";
      if (d >= 6) return `Stage ${d}. You're reading the kettle's lies.`;
      if (d >= 5) return `BATCH ${d}. Burns ate the kettle run.`;
      return "That was steam, sugar.";
    }
    if (gameId === "duckpond") {
      if (d >= 6) return `Stage ${d}. Hook small, call rotating — still fishing.`;
      return "Wrong colour. Lucky ducks aren't that one.";
    }
    if (gameId === "skee") {
      if (d >= 6) return `Stage ${d}. You're arguing with the wax and winning.`;
      if (d > 0) return `SKEE ${d}. Nine balls, board still hungry.`;
      return "Wax got you.";
    }
    if (gameId === "pennypitch") {
      if (d >= 6) return `Stage ${d}. You're pitching through mood swings.`;
      return "Cloth jerked. Your pennies disagreed.";
    }
    if (gameId === "dunk") {
      if (d >= 6) return `Dunks ${d}. Crown is dripping for you.`;
      return "Three balls. Plate danced away.";
    }
    const pool = DEATH_LINES[gameId] || DEATH_LINES.default;
    return `${pick(pool)} (${depth}${reason ? " · " + reason : ""})`;
  }

  function getBestDepth(gameId) {
    const state = getState();
    return (state && state.bestDepth && state.bestDepth[gameId]) || 0;
  }

  /* —— Engine mounts (spec-driven) —— */

  function HoldBandMount(root, spec, runCtx) {
    const s = spec || {};
    const band = {
      value: 0.2,
      rising: false,
      outMs: 0,
      stage: 1,
      lo: 0.35,
      hi: 0.65,
      outLimitMs: 700,
    };
    function applyStage(n) {
      const p = typeof s.stageParams === "function" ? s.stageParams(n) : null;
      if (p) {
        band.lo = p.lo != null ? p.lo : band.lo;
        band.hi = p.hi != null ? p.hi : band.hi;
        band.outLimitMs = p.outLimitMs != null ? p.outLimitMs : band.outLimitMs;
        band.riseRate = p.riseRate;
        band.fallRate = p.fallRate;
      }
      band.stage = n;
      reportDepth(runCtx, n);
    }
    applyStage(1);
    const api = {
      id: "HoldBand",
      hold(on) { band.rising = !!on; },
      tick(dtMs) {
        if (!runCtx.alive) return { dead: true };
        const d = dtMs || 16;
        const rise = band.riseRate != null ? band.riseRate : 0.0022;
        const fall = band.fallRate != null ? band.fallRate : 0.0016;
        band.value = band.rising
          ? Math.min(1, band.value + rise * d)
          : Math.max(0, band.value - fall * d);
        const inBand = band.value >= band.lo && band.value <= band.hi;
        if (inBand) band.outMs = 0;
        else {
          band.outMs += d;
          if (band.outMs >= band.outLimitMs) {
            const grace = s.graceStrikes | 0;
            if (runCtx.strikes < grace) {
              reportStrike(runCtx, "band");
              band.outMs = 0;
              return { dead: false, value: band.value, inBand: false, warned: true };
            }
            runCtx.alive = false;
            finishRun(runCtx, { depth: band.stage, score: runCtx.score, deathReason: "missed_band" });
            return { dead: true, reason: "missed_band" };
          }
        }
        return { dead: false, value: band.value, inBand, stage: band.stage };
      },
      clearStage() {
        if (typeof s.onClear === "function") s.onClear(band.stage);
        runCtx.score += 100;
        applyStage(band.stage + 1);
      },
      get value() { return band.value; },
      get stage() { return band.stage; },
    };
    return api;
  }

  function SlingAimMount(root, spec, runCtx) {
    const s = spec || {};
    const missesToDeath = s.missesToDeath != null ? s.missesToDeath : 3;
    let pull = null;
    let stage = 1;
    reportDepth(runCtx, stage);
    const gravity = s.gravity != null ? s.gravity : 0.35;
    return {
      id: "SlingAim",
      beginPull(x, y) { pull = { x0: x, y0: y, x, y }; },
      movePull(x, y) { if (pull) { pull.x = x; pull.y = y; } },
      release() {
        if (!pull || !runCtx.alive) return null;
        const dx = pull.x0 - pull.x;
        const dy = pull.y0 - pull.y;
        const power = Math.min(18, Math.hypot(dx, dy) * 0.18);
        const ang = Math.atan2(dy, dx);
        const ball = { x: pull.x0, y: pull.y0, vx: Math.cos(ang) * power, vy: Math.sin(ang) * power };
        pull = null;
        if (typeof s.onThrow === "function") s.onThrow(ball);
        return ball;
      },
      stepBall(ball, dt) {
        ball.vy += gravity * (dt || 1);
        ball.x += ball.vx * (dt || 1);
        ball.y += ball.vy * (dt || 1);
        return ball;
      },
      resolveHit(ball) {
        const hit = typeof s.hitTest === "function" ? !!s.hitTest(ball) : false;
        if (hit) {
          runCtx.score += 100;
          stage += 1;
          reportDepth(runCtx, stage);
          return { hit: true, stage };
        }
        reportStrike(runCtx, "miss");
        if (runCtx.strikes >= missesToDeath) {
          runCtx.alive = false;
          finishRun(runCtx, { depth: stage, score: runCtx.score, deathReason: "misses" });
          return { hit: false, dead: true };
        }
        return { hit: false, strikes: runCtx.strikes };
      },
      get stage() { return stage; },
    };
  }

  function TimingTapMount(root, spec, runCtx) {
    const s = spec || {};
    const strikesToDeath = s.strikesToDeath != null ? s.strikesToDeath : 3;
    const windowMs = s.windowMs != null ? s.windowMs : 180;
    let queue = [];
    let stage = 1;
    let hits = 0;
    reportDepth(runCtx, stage);
    function loadSchedule() {
      queue = typeof s.schedule === "function" ? (s.schedule(stage) || []).slice() : [];
      hits = 0;
    }
    loadSchedule();
    return {
      id: "TimingTap",
      tap(now) {
        if (!runCtx.alive) return { dead: true };
        const t = now != null ? now : performance.now();
        const next = queue.find((e) => !e.resolved && !e.fake && Math.abs(e.at - t) <= windowMs);
        if (next) {
          next.resolved = true;
          hits += 1;
          if (typeof s.onHit === "function") s.onHit(next);
          const need = s.clearCount != null ? s.clearCount : 8;
          if (hits >= need) {
            stage += 1;
            runCtx.score += 100;
            reportDepth(runCtx, stage);
            loadSchedule();
          }
          return { hit: true, stage, hits };
        }
        const fake = queue.find((e) => !e.resolved && e.fake && Math.abs(e.at - t) <= windowMs);
        if (fake) {
          fake.resolved = true;
          if (typeof s.onFake === "function") s.onFake(fake);
        }
        reportStrike(runCtx, fake ? "fake" : "miss");
        if (runCtx.strikes >= strikesToDeath) {
          runCtx.alive = false;
          finishRun(runCtx, { depth: stage, score: runCtx.score, deathReason: "strikes" });
          return { dead: true };
        }
        return { hit: false, strikes: runCtx.strikes };
      },
      expire(now) {
        const t = now != null ? now : performance.now();
        queue.forEach((e) => {
          if (!e.resolved && !e.fake && t > e.at + windowMs) {
            e.resolved = true;
            reportStrike(runCtx, "expire");
          }
        });
        if (runCtx.strikes >= strikesToDeath && runCtx.alive) {
          runCtx.alive = false;
          finishRun(runCtx, { depth: stage, score: runCtx.score, deathReason: "strikes" });
          return { dead: true };
        }
        return { strikes: runCtx.strikes };
      },
      get stage() { return stage; },
    };
  }

  function GreedFloorMount(root, spec, runCtx) {
    const s = spec || {};
    let floor = 1;
    reportDepth(runCtx, floor);
    return {
      id: "GreedFloor",
      action() {
        if (!runCtx.alive) return { dead: true };
        if (typeof s.doAction === "function") s.doAction();
        const ev = typeof s.evaluate === "function" ? s.evaluate() : { risk: 0.1 + floor * 0.05 };
        if (typeof s.deathRule === "function" ? s.deathRule(ev) : Math.random() < (ev.risk || 0)) {
          runCtx.alive = false;
          finishRun(runCtx, { depth: floor, score: runCtx.score, deathReason: "greed" });
          return { dead: true, floor };
        }
        floor += 1;
        runCtx.score += ev.gain != null ? ev.gain : 100;
        reportDepth(runCtx, floor);
        return { dead: false, floor, canCash: typeof s.canCashOut === "function" ? s.canCashOut() : floor >= 2 };
      },
      cashOut() {
        if (!runCtx.alive) return null;
        runCtx.alive = false;
        return finishRun(runCtx, { depth: floor, score: runCtx.score, cashedOut: true, deathReason: "cashed_out" });
      },
      get floor() { return floor; },
    };
  }

  function OracleRoomsMount(root, spec, runCtx) {
    const s = spec || {};
    let room = 1;
    let waiting = false;
    let elapsed = 0;
    let card = null;
    reportDepth(runCtx, room);
    return {
      id: "OracleRooms",
      begin() {
        waiting = true;
        elapsed = 0;
        card = typeof s.ticketGen === "function" ? s.ticketGen(room) : { text: "…" };
      },
      tick(dtMs) {
        if (!waiting) return { ready: false };
        elapsed += dtMs || 16;
        const need = typeof s.waitMs === "function" ? s.waitMs(room) : 2800;
        const breakLim = typeof s.breakLimitMs === "function" ? s.breakLimitMs(room) : 999999;
        if (elapsed > breakLim) {
          runCtx.alive = false;
          finishRun(runCtx, { depth: room, score: runCtx.score, deathReason: "broke_wait" });
          return { dead: true };
        }
        if (elapsed >= need) return { ready: true, card };
        return { ready: false, progress: elapsed / need };
      },
      keep() {
        waiting = false;
        room += 1;
        runCtx.score += 100;
        reportDepth(runCtx, room);
        return { action: "keep", room };
      },
      burn() {
        waiting = false;
        return { action: "burn", room };
      },
      double() {
        const allow = s.allowDoubleFrom != null ? s.allowDoubleFrom : 1;
        if (room < allow) return { action: "blocked" };
        waiting = false;
        room += 2;
        runCtx.score += 250;
        reportDepth(runCtx, room);
        return { action: "double", room };
      },
      get room() { return room; },
    };
  }

  /* Legacy constructors still available for older stalls */
  function legacyWrap(mountFn) {
    return function Legacy(opts) {
      const runCtx = { gameId: "legacy", startedAt: Date.now(), depth: 0, score: 0, strikes: 0, alive: true };
      return mountFn(null, opts || {}, runCtx);
    };
  }

  PF.runKit = {
    version: 2,
    contract: "GOBLIN_RUNKIT_API",
    startRun,
    reportDepth,
    reportStrike,
    finishRun,
    recordResult,
    challengeText,
    challengeLine: challengeText,
    auraDeathLine,
    auraFor: (r) => auraDeathLine(r.gameId, r.depth, r.deathReason),
    getBestDepth,
    makeResult,
    fillResultCard(ids, result, displayName) {
      if (PF.kit && typeof PF.kit.fillResult === "function") {
        PF.kit.fillResult(ids, {
          depthLine: `Depth ${result.depth}`,
          scoreLine: `Score ${result.score}`,
          auraLine: auraDeathLine(result.gameId, result.depth, result.deathReason),
        });
      }
      const copyBtn = ids && ids.copy ? PF.$(ids.copy) : null;
      if (copyBtn) {
        const text = challengeText(displayName || result.gameId, result.depth);
        copyBtn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(text);
            const copied = ids.copied ? PF.$(ids.copied) : null;
            if (copied) copied.hidden = false;
          } catch (_) {}
        };
      }
    },
    feverHooks(api) {
      return {
        isFeverNode: !!(api && api.isFeverNode),
        onNodeClear: typeof api?.onNodeClear === "function" ? api.onNodeClear : () => {},
        onNodeDeath: typeof api?.onNodeDeath === "function" ? api.onNodeDeath : () => {},
      };
    },
    declare(stallId, spec) {
      const state = getState();
      if (!state) return null;
      if (!state.kitsTonight.includes(stallId)) state.kitsTonight.push(stallId);
      persist();
      const info = (spec && typeof spec === "object")
        ? Object.assign({ stallId, engine: spec.engine || "Custom" }, spec)
        : { stallId, engine: spec || "Custom" };
      PF.runKit.declared = PF.runKit.declared || {};
      PF.runKit.declared[stallId] = info;
      PF.runKit.p0 = PF.runKit.p0 || {};
      PF.runKit.p0[stallId] = Object.assign({}, PF.runKit.p0[stallId] || {}, info);
      PF.runKit.mounted = PF.runKit.mounted || {};
      PF.runKit.mounted[stallId] = true;
      return info;
    },
    engines: {
      HoldBand: { mount: HoldBandMount, create: legacyWrap(HoldBandMount) },
      SlingAim: { mount: SlingAimMount, create: legacyWrap(SlingAimMount) },
      TimingTap: { mount: TimingTapMount, create: legacyWrap(TimingTapMount) },
      GreedFloor: { mount: GreedFloorMount, create: legacyWrap(GreedFloorMount) },
      OracleRooms: { mount: OracleRoomsMount, create: legacyWrap(OracleRoomsMount) },
    },
  };

  if (PF.kit) PF.kit.runKit = PF.runKit;
})();
