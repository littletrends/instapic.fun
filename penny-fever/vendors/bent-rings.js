/* Bent Ring Pegs — Desktop Grok owns this file. PF only. Never booth/port 6000. Never Imagine.
 * GOBLIN B03 AUTHORED 2026-09-05 — 8 BOARD rooms, not a meaner-lean climb.
 * GOBLIN_AUTHORED_LEVELS_B03.md + GOBLIN_BATCH03_MOUNT_CONFIGS.md + GOBLIN_RUNKIT_API.md
 * Engine: SlingAim · depthUnit: Board · gameId: bentring · codaEnabled hybrid
 * Soft Lean Tri → Cross Lean → Late Snap → Decoy Peg Alley → Spin Peg Circus
 * → Hook Only Lane → Twin Delay Row → Warp Hook Finale → ENDLESS Mean Lean {n}.
 * HUD = BOARD {n} · {name} · death = out of rings. Leftover rings stay in the house.
 * Don’t: hide lean · auto-stick near miss · same loop hotter leanDeg. Death hold ≥700ms. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const W = 340;
  const H = 440;
  const RING_R = 16;
  const RING_INNER = 9.2;
  const TEE = { x: W / 2, y: H - 28 };
  const GRAVITY = 0.165;
  const PEG_LEN = 46;
  const PEG_R = 5.2;
  const BOARD = { y: 72, h: 210 };
  const GAME_ID = "bentring";
  const LEAN_LERP_MS = 180;
  const DEATH_HOLD_MS = 760;
  const TAU = Math.PI * 2;
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const SNAP_LERP_MS = 70;

  let run = null;
  let idleRaf = 0;
  let idleRoom = 1;
  let idleClock = 0;
  let idlePegs = null;

  const AURA = {
    miss: "Aura: Out of rings. The pegs leaned. You saw it.",
    shallow: "Aura: Not a single board. They duck on purpose.",
    mid: "Aura: Cute sticks. They still lean mid-flight.",
    deep: "Aura: You threw where they’ll be. Dangerous.",
    decoy: "Aura: That peg was a decoy. It never holds.",
    hook: "Aura: Straight pegs spit. Hooks are the only necks.",
    spin: "Aura: The plate turned. You threw at home.",
    snap: "Aura: Late snap. You committed before the shudder finished.",
    coda: "Aura: Authored boards done. ENDLESS lean. Aim the cheat.",
    leave: "Aura: Left rings on the dirt.",
    near: "Aura: Near miss. The peg spat you. That’s the tent.",
    spit: "Aura: SPIT. Close isn’t stuck. The neck bounced you.",
    late: "Aura: Back row ducked late. Dual clocks, one throw.",
    souvenir: "Aura: Eight boards locked. Souvenir — the pegs salute.",
  };

  /* Authored BOARD rooms — unique layout / cheat / verb. Not “same three pegs, meaner lean.” */
  const AUTHORED = [
    {
      id: 1, name: "Soft Lean Tri", kind: "tri", pegs: 3, need: 2, leanDeg: 8, delayMs: 280, ringScale: 1.0,
      barker: "Triangle. Mild lean after the delay. Need two. Watch the ghosts.",
    },
    {
      id: 2, name: "Cross Lean", kind: "crosslean", pegs: 3, need: 3, leanDeg: 14, delayMs: 260, ringScale: 0.95,
      barker: "Three pegs, three directions — left, right, back. Need all three.",
    },
    {
      id: 3, name: "Late Snap Board", kind: "latesnap", pegs: 4, need: 3, leanDeg: 18, delayMs: 520, ringScale: 0.92,
      snap: true,
      barker: "Long telegraph shudder, then they SNAP. Need three of four.",
    },
    {
      id: 4, name: "Decoy Peg Alley", kind: "decoy", pegs: 5, need: 3, leanDeg: 16, delayMs: 240, ringScale: 0.9,
      decoyIndex: 2,
      barker: "Four reals plus one decoy that leans off-board. Need three reals. Decoy never holds.",
    },
    {
      id: 5, name: "Spin Peg Circus", kind: "spin", pegs: 4, need: 3, leanDeg: 14, delayMs: 240, ringScale: 0.9,
      spin: true,
      barker: "Plate rotates. Lean still fires mid-flight. Need three. Throw the moving ghosts.",
    },
    {
      id: 6, name: "Hook Only Lane", kind: "hook", pegs: 5, need: 3, leanDeg: 12, delayMs: 230, ringScale: 0.88,
      hookMask: [true, false, true, false, true],
      barker: "Only hook-shaped tops hold. Straight pegs SPIT. Need three hooks.",
    },
    {
      id: 7, name: "Twin Delay Row", kind: "twindelay", pegs: 5, need: 4, leanDeg: 16, delayMs: 160, ringScale: 0.88,
      twinDelay: true, frontDelayMs: 80, backDelayMs: 380,
      barker: "Two rows. Front leans early, back leans late. Need four.",
    },
    {
      id: 8, name: "Warp Hook Finale", kind: "warp", pegs: 5, need: 4, leanDeg: 18, delayMs: 420, ringScale: 0.85,
      spin: true, snap: true, decoyIndex: 4, hookMask: [true, false, true, false, false],
      twinDelay: true, frontDelayMs: 60, backDelayMs: 360,
      barker: "Two hooks, two straight, one decoy. Micro-spin, cross leans, late snap on the back. Need four valid sticks.",
    },
  ];

  const P0_MOUNT = {
    engine: "SlingAim",
    displayName: "Bent Ring Pegs",
    depthUnit: "Board",
    sheet: "GOBLIN_AUTHORED_LEVELS_B03.md",
    batchSheet: "GOBLIN_BATCH03_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored BOARDS then ENDLESS · they lean mid-flight",
    body: "Authored boards, not a thinner loop: Soft Lean Tri (triangle teach) → Cross Lean (L/R/back roster) → Late Snap Board (long telegraph then SNAP) → Decoy Peg Alley (won’t hold) → Spin Peg Circus (rotating plate) → Hook Only Lane (straight pegs spit) → Twin Delay Row (front early / back late) → Warp Hook Finale (mix of every cheat) → ENDLESS Mean Lean. Drag-aim. After release they lean — ghosts tell. Near miss SPITS. Stick enough before rings run out. Leftover rings stay in the house.",
    status: "Depth run · START · 1 demo coin · 8 authored BOARDS then ENDLESS",
    machine: "Crooked pegs · 1 demo coin · authored BOARDS",
    idleHud: ["Authored BENT PEGS — each board ducks different", "Drag-aim · ghosts tell · leftover unused · START"],
    punch: "Depth run — press START. No one-tap prize.",
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

  function bentringCoda(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const t = stage - AUTHORED_COUNT;
    return {
      id: stage,
      name: `Mean Lean ${stage}`,
      title: `Mean Lean ${stage}`,
      kind: "coda",
      pegs: 5,
      need: 4,
      leanDeg: Math.min(35, 20 + 2 * t),
      delayMs: 200,
      ringScale: 0.85,
      spin: t % 2 === 0,
      snap: t % 3 === 0,
      hookMask: [true, true, false, true, true],
      coda: true,
      barker: "ENDLESS — five pegs, meaner lean, need four. Ghosts still tell.",
    };
  }

  function roomTell(spec) {
    if (!spec) return "GHOST STICKS = WHERE THEY DUCK";
    if (spec.kind === "tri") return "TRIANGLE · MILD LEAN · NEED TWO";
    if (spec.kind === "crosslean") return "LEFT · RIGHT · BACK — THREE DIRECTIONS";
    if (spec.kind === "latesnap") return "LONG SHUDDER THEN SNAP";
    if (spec.kind === "decoy") return "DECOY NEVER HOLDS · NEED THREE REALS";
    if (spec.kind === "spin") return "PLATE SPINS · THROW THE MOVING GHOSTS";
    if (spec.kind === "hook") return "HOOKS HOLD · STRAIGHT PEGS SPIT";
    if (spec.kind === "twindelay") return "FRONT EARLY · BACK LATE";
    if (spec.kind === "warp") return "HOOKS + DECOY + SPIN + LATE SNAP";
    if (spec.coda) return "ENDLESS · MEAN LEAN";
    return "GHOST STICKS = WHERE THEY DUCK";
  }

  function attractSpec() {
    return bentringStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function attractPegs() {
    if (!idlePegs) idlePegs = makePegs(attractSpec());
    return idlePegs;
  }

  function drawRoomCard(ctx, spec, ms) {
    if (!spec || !(ms > 0)) return;
    const a = Math.min(1, ms / 220);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(12,6,9,0.92)";
    ctx.fillRect(22, 132, W - 44, 100);
    ctx.strokeStyle = spec.coda ? "#e8a0b8" : "#f0d09a";
    ctx.lineWidth = 2.2;
    ctx.strokeRect(22.5, 132.5, W - 45, 99);
    ctx.fillStyle = spec.coda ? "#e8a0b8" : "#d4a45a";
    ctx.font = "bold 11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(spec.coda ? "ENDLESS BENT PEGS" : "AUTHORED BOARD", W / 2, 154);
    ctx.fillStyle = "#fff6ec";
    ctx.font = "bold 20px Georgia, serif";
    ctx.fillText(spec.name, W / 2, 182);
    ctx.fillStyle = "#e8a0b8";
    ctx.font = "11px Georgia, serif";
    ctx.fillText(roomTell(spec), W / 2, 210);
    ctx.restore();
  }

  function bentringStageParams(n) {
    const stage = Math.max(1, n | 0);
    let spec;
    if (stage <= AUTHORED_COUNT) {
      spec = Object.assign({}, AUTHORED[stage - 1]);
    } else if (!CODA_ENABLED) {
      return null;
    } else {
      spec = bentringCoda(stage);
    }
    spec.title = spec.name;
    spec.ringsPerStage = Math.max(3, spec.need);
    return spec;
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: bentringStageParams,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      codaParams: bentringCoda,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }

  function punchStart() {
    stampDepthCopy();
    setText("bentRingStatus", DEPTH_COPY.punch);
    const btn = el("bentRingStart");
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
      const spec = run.spec || bentringStageParams(Math.max(1, (run.stages | 0) + 1));
      const playing = spec.id || Math.max(1, (run.stages | 0) + 1);
      hud.textContent = spec.coda
        ? `ENDLESS · BOARD ${playing} · ${spec.name}`
        : `BOARD ${playing} · ${spec.name}`;
      hud.hidden = false;
    } else {
      hud.textContent = "BOARD 0";
      hud.hidden = true;
    }
    paintPips();
    return hud;
  }

  function ensurePips(count) {
    const host = card();
    const stage = host && host.querySelector(".vendor-stage");
    if (!stage) return null;
    let span = stage.querySelector(`[data-runkit-strikes="${GAME_ID}"]`);
    const n = Math.max(3, count | 0);
    if (!span) {
      span = document.createElement("span");
      span.className = "strike-pips";
      span.dataset.runkitStrikes = GAME_ID;
      span.setAttribute("aria-hidden", "true");
      stage.appendChild(span);
    }
    if (span.childElementCount !== n) {
      span.innerHTML = new Array(n).fill("<i></i>").join("");
    }
    return span;
  }

  function paintPips() {
    const spec = (run && run.spec) || bentringStageParams(1);
    const max = spec.ringsPerStage || 3;
    const span = ensurePips(max);
    if (!span) return;
    const used = isLive() || (run && run.dying) ? Math.max(0, max - (run.rings | 0)) : 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < used));
  }

  function challengeLine(n) {
    const kitRun = rk();
    if (kitRun && typeof kitRun.challengeText === "function") {
      try { return kitRun.challengeText("Bent Rings board", n | 0, GAME_ID); } catch (_) { /* authored */ }
    }
    return `Beat my Bent Rings board ${n | 0} on Penny Fever`;
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
      deathReason: partial.deathReason || "out of rings",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestBentRing = Math.max(state.bestBentRing || 0, payload.depth);
      state.bestBentRingScore = Math.max(state.bestBentRingScore || 0, payload.score);
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function tellDepth(n) {
    const stages = n | 0;
    if (run && run.kitRun) run.kitRun.depth = stages;
    const spec = (run && run.spec) || bentringStageParams(Math.max(1, stages));
    if (run && run.kitRun && rk() && typeof rk().reportDepth === "function") {
      try { rk().reportDepth(run.kitRun, stages, { name: spec.name, coda: !!spec.coda }); } catch (_) { /* optional */ }
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

  function mountSling(ctx) {
    const engines = rk() && rk().engines;
    if (!engines || !engines.SlingAim || typeof engines.SlingAim.mount !== "function" || !ctx) return null;
    try {
      /* Launcher only. Stall owns ringsPerStage = max(3, need), mid-flight lean, leftover house.
       * SlingAim.resolveHit would bump stage/death — do not drive throws with it.
       * Shadow ctx so reportDepth/finishRun cannot steal the coin run. */
      return engines.SlingAim.mount(el("bentRingCanvas") || card(), {
        gravity: GRAVITY,
        missesToDeath: 99,
        stageParams: bentringStageParams,
        onThrow() { kit.sfx("throw"); },
        hitTest(ball) {
          if (!run || !ball) return false;
          return tryStick(ball);
        },
      }, shadowCtx(ctx));
    } catch (_) {
      return null;
    }
  }

  function card() {
    return el("bentRingCard");
  }

  function pegLayout(spec) {
    const n = spec.pegs;
    const kind = spec.kind || "tri";
    const spots = [];
    const left = 58;
    const right = W - 58;
    const yMid = BOARD.y + 118;
    if (kind === "tri") {
      spots.push({ x: left + 28, y: yMid + 18 });
      spots.push({ x: W / 2, y: yMid - 28 });
      spots.push({ x: right - 28, y: yMid + 18 });
    } else if (kind === "crosslean") {
      spots.push({ x: left + 36, y: yMid + 6 });
      spots.push({ x: W / 2, y: yMid - 8 });
      spots.push({ x: right - 36, y: yMid + 6 });
    } else if (kind === "spin" || kind === "warp") {
      const r = kind === "warp" ? 58 : 64;
      for (let i = 0; i < n; i += 1) {
        const a = -Math.PI / 2 + (i / n) * TAU;
        spots.push({ x: W / 2 + Math.cos(a) * r, y: yMid + Math.sin(a) * r * 0.55 });
      }
    } else if (kind === "twindelay" || kind === "latesnap" || kind === "hook" || kind === "decoy" || kind === "coda") {
      const frontCount = Math.ceil(n / 2);
      const backCount = n - frontCount;
      for (let i = 0; i < n; i += 1) {
        const front = i < frontCount;
        const col = front ? i : i - frontCount;
        const cols = front ? frontCount : Math.max(1, backCount);
        const u = cols === 1 ? 0.5 : col / (cols - 1);
        spots.push({
          x: left + 16 + u * (right - left - 32),
          y: yMid + (front ? 22 : -18),
          front,
        });
      }
    } else {
      for (let i = 0; i < n; i += 1) {
        const u = n === 1 ? 0.5 : i / (n - 1);
        spots.push({ x: left + u * (right - left), y: yMid });
      }
    }
    return spots;
  }

  function makePegs(spec) {
    const spots = pegLayout(spec);
    const pegs = [];
    const hookMask = spec.hookMask || null;
    for (let i = 0; i < spots.length; i += 1) {
      let sign = i % 2 === 0 ? 1 : -1;
      let back = false;
      if (spec.kind === "crosslean" || spec.kind === "warp") {
        if (i === 0) sign = -1;
        else if (i === spots.length - 1 || (spec.kind === "crosslean" && i === 2)) sign = 1;
        else {
          sign = 0;
          back = true;
        }
      }
      if (spec.kind === "tri") sign = i === 1 ? 0 : (i === 0 ? -1 : 1);
      const front = spots[i].front != null
        ? spots[i].front
        : (spec.kind === "twindelay" || spec.kind === "latesnap" || spec.kind === "warp"
          ? i < Math.ceil(spots.length / 2)
          : true);
      let delayExtra = 0;
      if (spec.twinDelay || spec.kind === "twindelay" || spec.kind === "warp") {
        delayExtra = front ? (spec.frontDelayMs || 80) : (spec.backDelayMs || 380);
      }
      if (spec.kind === "latesnap" && !front) delayExtra = 40;
      const decoy = spec.decoyIndex != null && i === spec.decoyIndex;
      const hook = hookMask ? !!hookMask[i] : (spec.kind !== "hook" && spec.kind !== "warp");
      pegs.push({
        x: spots[i].x,
        y: spots[i].y,
        homeX: spots[i].x,
        homeY: spots[i].y,
        swapX: spots[i].x,
        lean: 0,
        targetLean: 0,
        sign,
        stuck: false,
        flash: 0,
        wobble: i * 0.9,
        delayExtra,
        front,
        still: spec.kind === "tri" && i === 1,
        back,
        decoy,
        hook: decoy ? false : hook,
      });
    }
    if (spec.kind === "tri" && pegs[1]) {
      pegs[1].sign = 0;
      pegs[1].still = true;
    }
    return pegs;
  }

  function pegTip(p, leanOverride) {
    const a = leanOverride != null ? leanOverride : p.lean;
    if (p && p.back) {
      const pitch = Math.abs(a);
      return {
        x: p.x,
        y: p.y - PEG_LEN * (1 - pitch * 0.28) - pitch * 16,
      };
    }
    if (p && p.decoy) {
      return {
        x: p.x + Math.sin(a) * (PEG_LEN + 18),
        y: p.y - Math.cos(a) * PEG_LEN * 0.72,
      };
    }
    return {
      x: p.x + Math.sin(a) * PEG_LEN,
      y: p.y - Math.cos(a) * PEG_LEN,
    };
  }

  function ghostLean(p, spec) {
    if (p && p.still) return 0;
    const deg = (spec && spec.leanDeg ? spec.leanDeg : 8) * (p && p.decoy ? 1.85 : 1);
    if (p && p.back) return (deg * Math.PI / 180);
    return (p.sign || 0) * (deg * Math.PI / 180);
  }

  function applySpin(pegs, spec, t) {
    if (!spec || !(spec.spin || spec.kind === "spin" || spec.kind === "warp")) return;
    const cx = W / 2;
    const cy = BOARD.y + 118;
    const rate = spec.kind === "warp" ? 0.00032 : 0.0007;
    (pegs || []).forEach((p) => {
      if (p.stuck) return;
      const hx = p.homeX;
      const hy = p.homeY != null ? p.homeY : p.y;
      const r = Math.hypot(hx - cx, hy - cy);
      const a0 = Math.atan2(hy - cy, hx - cx);
      const a = a0 + t * rate;
      p.x = cx + Math.cos(a) * r;
      p.y = cy + Math.sin(a) * (r * 0.9);
    });
  }

  function fleeX(p, spec, leanAmt) {
    const home = p.homeX != null ? p.homeX : p.x;
    if (!spec || spec.kind !== "arc" || (p && p.still)) return home;
    const target = Math.abs(ghostLean(p, spec)) || 0.01;
    const u = kit.clamp(Math.abs(leanAmt != null ? leanAmt : p.lean) / target, 0, 1);
    const away = (home - W / 2) >= 0 ? 1 : -1;
    return home + away * u * 42;
  }

  function ghostHome(p, spec) {
    return { x: fleeX(p, spec, ghostLean(p, spec)), y: p.y };
  }

  function ringRadii() {
    const scale = run && run.spec ? run.spec.ringScale : 1;
    return { outer: RING_R * scale, inner: RING_INNER * scale };
  }

  function distToPeg(ring, p) {
    const tip = pegTip(p);
    const vx = tip.x - p.x;
    const vy = tip.y - p.y;
    const len = Math.hypot(vx, vy) || 1;
    const ux = vx / len;
    const uy = vy / len;
    const wx = ring.x - p.x;
    const wy = ring.y - p.y;
    const along = kit.clamp((wx * ux + wy * uy) / len, 0, 1);
    const px = p.x + ux * along * len;
    const py = p.y + uy * along * len;
    return { d: Math.hypot(ring.x - px, ring.y - py), along, px, py, tip };
  }

  function pegHolds(p, spec) {
    if (!p || p.decoy) return false;
    if (spec && spec.kind === "hook" && !p.hook) return false;
    return true;
  }

  function spitRing(ring, p, i, hit, note, toastMsg, status) {
    const nx = (ring.x - hit.px) / (hit.d || 1);
    const ny = (ring.y - hit.py) / (hit.d || 1);
    ring.vx += nx * 2.8;
    ring.vy = Math.abs(ring.vy) * 0.38 + 1.6;
    p.flash = 220;
    ring.spitPeg = i;
    ring.spitUntil = run.t + 340;
    run.lastNote = note || "spit";
    run.shake = 5;
    run.toast = toastMsg || "SPIT — close isn’t stuck";
    run.toastMs = 760;
    spawnSparks(hit.px, hit.py, 8, note === "decoy" ? "#c41e3a" : "#e8a0b8");
    kit.sfx("spit");
    setText("bentRingStatus", status || "SPIT. The neck bounced you. Stick is inner, not the kiss.");
  }

  function tryStick(ring) {
    if (!run || ring.stuckOn != null) return false;
    const spec = run.spec;
    const rad = ringRadii();
    const spitLock = ring.spitUntil && run.t < ring.spitUntil;
    for (let i = 0; i < run.pegs.length; i += 1) {
      const p = run.pegs[i];
      if (p.stuck) continue;
      if (spitLock && ring.spitPeg === i) continue;
      const hit = distToPeg(ring, p);
      const inner = hit.d < rad.inner && hit.along > 0.38;
      const outer = hit.d < rad.outer && hit.along > 0.2;
      if (!inner && !outer) continue;
      if (p.decoy) {
        spitRing(ring, p, i, hit, "decoy", "DECOY — never holds", "Decoy peg. It leans off-board on purpose.");
        return false;
      }
      if (!pegHolds(p, spec)) {
        spitRing(ring, p, i, hit, "hook", "STRAIGHT — HOOKS ONLY", "Straight peg spat you. Only hooks hold.");
        return false;
      }
      if (inner) {
        p.stuck = true;
        p.flash = 280;
        ring.stuckOn = i;
        ring.x = hit.tip.x;
        ring.y = hit.tip.y + 6;
        ring.vx = 0;
        ring.vy = 0;
        return true;
      }
      spitRing(ring, p, i, hit, "spit", "SPIT — close isn’t stuck", "SPIT. The neck bounced you. Stick is inner, not the kiss.");
      return false;
    }
    return false;
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
    const canvas = el("bentRingCanvas");
    if (canvas) {
      const live = isLive();
      canvas.style.pointerEvents = live ? "auto" : "none";
      canvas.style.touchAction = "none";
      canvas.classList.toggle("is-locked", !live);
    }
    ensureHud();
    paintPips();
    if (!isLive() && el("bentRingStatus") && (!run || run.done)) {
      el("bentRingStatus").textContent = DEPTH_COPY.status;
    }
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("bentring")
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
      if (idleClock > 3800) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        idlePegs = makePegs(attractSpec());
      }
      drawIdle(now);
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }

  function throwSpeed(power) {
    return 5.85 + power * 8.35;
  }

  function predictArc(power, ang) {
    const speed = throwSpeed(power);
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

  function spawnSparks(x, y, n, color) {
    if (!run) return;
    run.sparks = run.sparks || [];
    for (let i = 0; i < n; i += 1) {
      const a = Math.random() * TAU;
      const s = 0.5 + Math.random() * 2.1;
      run.sparks.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.4,
        life: 240 + Math.random() * 200, color: color || "#f0d09a",
      });
    }
  }

  function drawSparks(ctx) {
    if (!run || !run.sparks) return;
    run.sparks.forEach((s) => {
      ctx.globalAlpha = Math.max(0, s.life / 380);
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x - 1.1, s.y - 1.1, 2.2, 2.2);
    });
    ctx.globalAlpha = 1;
  }

  function drawPeg(ctx, p, spec, showGhost, idx) {
    const tip = pegTip(p);
    const ghostA = ghostLean(p, spec);
    if (showGhost && !p.stuck && !p.still && Math.abs(ghostA) > 0.01) {
      const gBase = ghostHome(p, spec);
      const gPeg = { x: gBase.x, y: p.y };
      const gTip = pegTip(gPeg, ghostA);
      const flying = !!(run && run.ring && run.ring.stuckOn == null);
      const remain = flying && run && !run.leaning ? Math.max(0, run.leanAt - run.t) : 0;
      const delay = (run && run.spec && run.spec.delayMs) || 280;
      const imminent = flying ? (run.leaning ? 1 : 1 - remain / Math.max(1, delay)) : 0.55;
      ctx.save();
      ctx.strokeStyle = `rgba(196,30,58,${0.45 + 0.5 * imminent})`;
      ctx.lineWidth = 3.2 + 2.2 * imminent;
      ctx.setLineDash([4, 4]);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(gBase.x, p.y + 6);
      ctx.lineTo(gTip.x, gTip.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(196,30,58,0.55)";
      ctx.beginPath();
      ctx.arc(gTip.x, gTip.y, PEG_R * 0.9, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flying ? "#fff6ec" : "#e8a0b8";
      ctx.font = "bold 8px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(spec && spec.kind === "arc" ? "FLEE" : "AIM", gTip.x, gTip.y - 10);
      if (spec && spec.kind === "arc" && Math.abs(gBase.x - (p.homeX != null ? p.homeX : p.x)) > 4) {
        ctx.strokeStyle = "rgba(196,30,58,0.45)";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(p.homeX != null ? p.homeX : p.x, p.y + 10);
        ctx.lineTo(gBase.x, p.y + 10);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
    if (showGhost && spec.swap && p.swapX != null && p.swapX !== p.homeX && !p.stuck) {
      const flying = !!(run && run.ring && run.ring.stuckOn == null);
      const dest = { x: p.swapX, y: p.y, lean: ghostA };
      const dTip = pegTip(dest, ghostA);
      ctx.save();
      ctx.strokeStyle = flying ? "rgba(61,138,138,0.9)" : "rgba(61,138,138,0.5)";
      ctx.lineWidth = flying ? 3.4 : 2.4;
      ctx.setLineDash([3, 5]);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.swapX, p.y + 6);
      ctx.lineTo(dTip.x, dTip.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(61,138,138,0.7)";
      ctx.beginPath();
      ctx.arc(dTip.x, dTip.y, PEG_R * 0.85, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flying ? "#b8e8e0" : "rgba(184,232,224,0.9)";
      ctx.font = "bold 8px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("LANDS", dTip.x, dTip.y - 10);
      if (p.homeX != null && Math.abs(p.x - p.homeX) > 1) {
        ctx.strokeStyle = "rgba(61,138,138,0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(p.homeX, p.y + 10);
        ctx.lineTo(p.x, p.y + 10);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = p.stuck ? "#3d8a8a" : p.still ? "#b8e8e0" : p.flash > 0 ? "#e8a0b8" : "#d4a45a";
    ctx.lineWidth = p.still ? 7.5 : 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 6);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    if (p.still) {
      ctx.strokeStyle = "rgba(184,232,224,0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 6);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
    }
    ctx.fillStyle = "#3a2418";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 8, 9, 3.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.stuck ? "#b8e8e0" : p.decoy ? "#c41e3a" : "#f0d09a";
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, PEG_R, 0, TAU);
    ctx.fill();
    if (p.hook && !p.decoy) {
      ctx.strokeStyle = p.stuck ? "#b8e8e0" : "#f0d09a";
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.arc(tip.x + 7, tip.y + 1, 8, -0.55, Math.PI * 0.85);
      ctx.stroke();
    }
    if (Math.abs(p.lean) > 0.02) {
      ctx.strokeStyle = "rgba(196,30,58,0.55)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y - PEG_LEN);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (!p.still && p.sign) {
      ctx.fillStyle = p.sign > 0 ? "rgba(196,30,58,0.85)" : "rgba(61,138,138,0.85)";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 16);
      ctx.lineTo(p.x + p.sign * 10, p.y + 12);
      ctx.lineTo(p.x, p.y + 8);
      ctx.closePath();
      ctx.fill();
    }
    if (spec && spec.kind === "wave" && !p.stuck) {
      const flying = !!(run && run.ring && run.ring.stuckOn == null);
      const nextIdx = (() => {
        if (!run || !run.pegs) return 0;
        let best = 0;
        let bestDelay = 1e9;
        run.pegs.forEach((q, qi) => {
          if (q.stuck) return;
          const d = q.delayExtra || 0;
          const started = run.leaning && q.leanStart && run.t >= q.leanStart;
          if (started) return;
          if (d < bestDelay) {
            bestDelay = d;
            best = qi;
          }
        });
        return best;
      })();
      const hot = (idx | 0) === nextIdx && flying;
      if (hot) {
        ctx.beginPath();
        ctx.arc(p.x, p.y + 4, 16, 0, TAU);
        ctx.strokeStyle = "rgba(240,208,154,0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();
        const due = run.leaning
          ? Math.max(0, (p.leanStart || run.t) - run.t)
          : Math.max(0, (run.leanAt || 0) + (p.delayExtra || 0) - run.t);
        ctx.fillStyle = "#fff6ec";
        ctx.font = "bold 9px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(due > 40 ? `NEXT ${Math.ceil(due)}` : "NOW", p.x, p.y - 14);
      }
      ctx.fillStyle = hot ? "#fff6ec" : "#f0d09a";
      ctx.font = "bold 10px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(String((idx | 0) + 1), p.x, p.y + 28);
    }
    if (p.decoy) {
      ctx.fillStyle = "#c41e3a";
      ctx.font = "bold 8px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("DECOY", p.x, p.y + 28);
    } else if (spec && spec.kind === "hook" && !p.hook) {
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "bold 8px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("SPIT", p.x, p.y + 28);
    } else if (spec && (spec.kind === "hook" || spec.kind === "warp") && p.hook) {
      ctx.fillStyle = "#b8e8e0";
      ctx.font = "bold 8px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("HOOK", p.x, p.y + 28);
    } else if (p.still) {
      ctx.fillStyle = "#b8e8e0";
      ctx.font = "bold 8px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("STANDS", p.x, p.y + 28);
    } else if (p.back && !p.stuck) {
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "bold 8px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("BACK", p.x, p.y + 28);
    } else if (spec && (spec.kind === "twindelay" || spec.kind === "warp") && !p.stuck && !p.front) {
      const flying = !!(run && run.ring && run.ring.stuckOn == null);
      const due = flying
        ? (run.leaning
          ? Math.max(0, (p.leanStart || run.t) - run.t)
          : Math.max(0, (run.leanAt || 0) + (p.delayExtra || 0) - run.t))
        : 0;
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "bold 8px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(flying && due > 40 ? `LATE ${Math.ceil(due)}` : "LATE", p.x, p.y + 28);
    } else if (spec && spec.kind === "spin" && !p.stuck) {
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "bold 8px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("SPIN", p.x, p.y + 28);
    }
    ctx.restore();
  }

  function drawRingAt(ctx, x, y, scale, stuck, spin) {
    const o = RING_R * scale;
    const inn = RING_INNER * scale;
    ctx.save();
    ctx.translate(x, y);
    if (spin) ctx.rotate(spin);
    ctx.beginPath();
    ctx.arc(0, 0, o, 0, TAU);
    ctx.arc(0, 0, inn, 0, TAU, true);
    ctx.fillStyle = stuck ? "rgba(61,138,138,0.85)" : "#c41e3a";
    ctx.fill("evenodd");
    ctx.strokeStyle = stuck ? "#b8e8e0" : "#fff6ec";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, o, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, inn, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,246,236,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-o * 0.7, 0);
    ctx.lineTo(o * 0.7, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawGlory(ctx, spec, stages) {
    ctx.save();
    ctx.fillStyle = "rgba(12,6,9,0.9)";
    ctx.fillRect(12, H - 62, W - 24, 54);
    ctx.strokeStyle = "rgba(212,164,90,0.74)";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(12.5, H - 61.5, W - 25, 53);
    ctx.fillStyle = "#f0d09a";
    ctx.font = "bold 32px Georgia, serif";
    ctx.textAlign = "center";
    const playing = spec.id || stages;
    ctx.fillText(spec.coda ? `ENDLESS ${playing}` : `BOARD ${playing}`, W / 2, H - 32);
    ctx.font = "11px Georgia, serif";
    ctx.fillStyle = spec.coda ? "#e8a0b8" : "#d4a45a";
    ctx.fillText(spec.coda ? `ENDLESS · ${spec.name}` : spec.name, W / 2, H - 14);
    ctx.restore();
  }

  function drawScene(ctx, spec, pegs, showGhost) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#2a1420");
    g.addColorStop(1, "#12080c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(22, 48);
    ctx.lineTo(318, 40);
    ctx.lineTo(328, BOARD.y + BOARD.h);
    ctx.lineTo(14, BOARD.y + BOARD.h + 12);
    ctx.closePath();
    ctx.clip();
    kit.fillWood(ctx, 8, 36, 324, BOARD.h + 40);
    ctx.fillStyle = "rgba(80,24,36,0.16)";
    for (let y = 56; y < BOARD.y + BOARD.h; y += 26) ctx.fillRect(12, y, 316, 8);
    ctx.restore();

    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(22, 48);
    ctx.lineTo(318, 40);
    ctx.lineTo(328, BOARD.y + BOARD.h);
    ctx.lineTo(14, BOARD.y + BOARD.h + 12);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = "rgba(12,6,9,0.55)";
    ctx.fillRect(86, 50, 168, 22);
    ctx.fillStyle = "#f0d09a";
    ctx.font = "11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(spec.coda ? "ENDLESS · BENT PEGS" : `${spec.name.toUpperCase()} · 5¢`, W / 2, 65);
    ctx.textAlign = "left";

    if (spec.spin || spec.kind === "spin" || spec.kind === "warp") {
      ctx.save();
      ctx.strokeStyle = "rgba(232,160,184,0.55)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.ellipse(W / 2, BOARD.y + 118, 78, 44, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(232,160,184,0.8)";
      ctx.font = "bold 9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("SPIN PLATE", W / 2, BOARD.y + 36);
      ctx.restore();
    }

    pegs.forEach((p, i) => drawPeg(ctx, p, spec, showGhost, i));

    if (spec.kind === "cross" && pegs.length >= 4) {
      ctx.save();
      ctx.strokeStyle = "rgba(196,30,58,0.55)";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      const g0 = ghostHome(pegs[0], spec);
      const g1 = ghostHome(pegs[1], spec);
      const g2 = ghostHome(pegs[2], spec);
      const g3 = ghostHome(pegs[3], spec);
      const t0 = pegTip({ x: g0.x, y: pegs[0].y, lean: 0 }, ghostLean(pegs[0], spec));
      const t1 = pegTip({ x: g1.x, y: pegs[1].y, lean: 0 }, ghostLean(pegs[1], spec));
      const t2 = pegTip({ x: g2.x, y: pegs[2].y, lean: 0 }, ghostLean(pegs[2], spec));
      const t3 = pegTip({ x: g3.x, y: pegs[3].y, lean: 0 }, ghostLean(pegs[3], spec));
      ctx.beginPath();
      ctx.moveTo(t0.x, t0.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.moveTo(t1.x, t1.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(196,30,58,0.85)";
      ctx.font = "bold 9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("THE X", W / 2, BOARD.y + 36);
      ctx.restore();
    }

    if (spec.swap) {
      ctx.save();
      ctx.strokeStyle = "rgba(61,138,138,0.75)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      for (let i = 0; i < pegs.length - 1; i += 2) {
        const a = pegs[i];
        const b = pegs[i + 1];
        if (!a || !b || a.stuck || b.stuck) continue;
        ctx.beginPath();
        ctx.moveTo(a.homeX != null ? a.homeX : a.x, a.y + 20);
        ctx.lineTo(b.homeX != null ? b.homeX : b.x, b.y + 20);
        ctx.stroke();
        ctx.fillStyle = "rgba(61,138,138,0.9)";
        ctx.font = "8px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("SWAP", ((a.x + b.x) / 2), Math.max(a.y, b.y) + 32);
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.fillStyle = spec.kind === "swap" ? "rgba(61,138,138,0.92)" : "rgba(196,30,58,0.72)";
    ctx.font = "9px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(roomTell(spec), W / 2, BOARD.y + BOARD.h + 8);

    ctx.strokeStyle = "rgba(240,208,154,0.35)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(40, TEE.y);
    ctx.lineTo(W - 40, TEE.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawIdle(now) {
    const canvas = el("bentRingCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const spec = attractSpec();
    const pegs = attractPegs();
    const t = now || performance.now();
    const tease = (Math.sin(t * 0.0024) * 0.5 + 0.5);
    applySpin(pegs, spec, t);
    pegs.forEach((p, i) => {
      if (p.still) {
        p.lean = 0;
        if (!(spec.spin || spec.kind === "spin" || spec.kind === "warp")) {
          p.x = p.homeX != null ? p.homeX : p.x;
        }
        return;
      }
      const ghost = ghostLean(p, spec);
      p.lean = ghost * tease;
    });
    drawScene(ctx, spec, pegs, true);
    drawRingAt(ctx, TEE.x, TEE.y, spec.ringScale || 1, false, t * 0.004);
    kit.drawHud(ctx, W, [
      `${spec.name} — ${roomTell(spec)}`,
      DEPTH_COPY.idleHud[1],
    ]);
  }

  function draw() {
    const canvas = el("bentRingCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (run) run.shake = kit.applyShake(ctx, run.shake || 0);
    const spec = run ? run.spec : bentringStageParams(1);
    const pegs = run ? run.pegs : makePegs(spec);
    drawScene(ctx, spec, pegs, true);

    if (run && run.aim) {
      const a = run.aim;
      const ang = Math.atan2(a.hy - TEE.y, a.hx - TEE.x);
      ctx.strokeStyle = "rgba(240,208,154,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TEE.x, TEE.y);
      ctx.lineTo(a.hx, a.hy);
      ctx.stroke();
      predictArc(a.power, ang).forEach((p, i, arc) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 + a.power * 1.4, 0, TAU);
        ctx.fillStyle = i === arc.length - 1 ? "rgba(196,30,58,0.55)" : "rgba(196,30,58,0.28)";
        ctx.fill();
      });
      ctx.fillStyle = "rgba(12,6,9,0.78)";
      ctx.fillRect(14, H - 118, 14, 62);
      ctx.strokeStyle = "rgba(212,164,90,0.7)";
      ctx.strokeRect(14.5, H - 117.5, 13, 61);
      ctx.fillStyle = a.power > 0.82 ? "#c41e3a" : a.power > 0.45 ? "#f0d09a" : "#8a6230";
      const ph = 58 * a.power;
      ctx.fillRect(16, H - 116 + 58 - ph, 10, ph);
      ctx.fillStyle = "#d4a45a";
      ctx.font = "8px Georgia, serif";
      ctx.textAlign = "left";
      ctx.fillText("PWR", 12, H - 122);
    }

    if (run && run.stuckRings) {
      run.stuckRings.forEach((s) => {
        const p = run.pegs[s.i];
        if (!p) return;
        const tip = pegTip(p);
        drawRingAt(ctx, tip.x, tip.y + 6, spec.ringScale, true, 0);
      });
    }

    if (run && run.ring && run.ring.stuckOn == null) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#12080c";
      ctx.beginPath();
      ctx.ellipse(run.ring.x, TEE.y + 6, 10, 3.2, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      drawRingAt(ctx, run.ring.x, run.ring.y, spec.ringScale, false, run.ring.spin || 0);
    } else if (!run || !run.ring) {
      drawRingAt(ctx, TEE.x, TEE.y, spec.ringScale, false, 0);
    }

    const left = run ? run.rings : spec.ringsPerStage;
    for (let i = 0; i < spec.ringsPerStage; i += 1) {
      ctx.globalAlpha = i < left ? 1 : 0.22;
      drawRingAt(ctx, 28 + i * 22, H - 78, 0.55, false, 0);
      ctx.globalAlpha = 1;
    }

    if (run && run.ring && !run.leaning) {
      const remain = Math.max(0, run.leanAt - run.t);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "bold 12px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(`LEAN IN ${Math.ceil(remain)}ms`, W / 2, 108);
    } else if (run && run.leaning && run.ring) {
      ctx.fillStyle = "#c41e3a";
      ctx.font = "bold 13px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("THEY LEAN", W / 2, 108);
    }

    if (run && run.houseFly) {
      run.houseFly.forEach((h) => {
        ctx.globalAlpha = Math.min(1, h.life / 180);
        drawRingAt(ctx, h.x, h.y, 0.48, true, h.spin || 0);
        ctx.globalAlpha = 1;
      });
    }
    if (run && run.houseRings) {
      run.houseRings.forEach((h, i) => {
        ctx.globalAlpha = 0.72;
        drawRingAt(ctx, 28 + i * 16, H - 52, 0.42, true, 0);
        ctx.globalAlpha = 1;
      });
      if (run.houseRings.length) {
        ctx.fillStyle = "#8a6230";
        ctx.font = "8px Georgia, serif";
        ctx.textAlign = "left";
        ctx.fillText(`HOUSE ${run.houseRings.length}`, 18, H - 38);
      }
    }

    if (isLive() || (run && run.dying)) drawGlory(ctx, spec, spec.id || run.stages);
    drawSparks(ctx);

    if (run && run.toastMs > 0 && run.toast && !(run.roomCardMs > 80)) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, run.toastMs / 180);
      ctx.fillStyle = "rgba(12,6,9,0.82)";
      ctx.fillRect(40, 200, W - 80, 28);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "12px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(run.toast, W / 2, 218);
      ctx.restore();
    }

    if (run && run.roomCardMs > 0) drawRoomCard(ctx, spec, run.roomCardMs);

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, "MISS");

    if (isLive()) {
      const stuck = run.pegs.filter((p) => p.stuck).length;
      ctx.fillStyle = "#d4a45a";
      ctx.font = "10px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(`Stuck ${stuck}/${spec.need} · leftover unused`, W / 2, BOARD.y + BOARD.h + 22);
    } else if (!run || (!run.closedStamp && !run.dying)) {
      kit.drawHud(ctx, W, DEPTH_COPY.idleHud);
    }
  }

  function start() {
    if (isLive()) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("bentRingStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      stampDepthCopy();
      return;
    }
    stopIdle();
    const spec = bentringStageParams(1);
    run = {
      done: false,
      dying: false,
      kitRun,
      sling: null,
      t: 0,
      last: 0,
      stages: 0,
      score: 0,
      spec,
      pegs: makePegs(spec),
      rings: spec.ringsPerStage,
      ring: null,
      aim: null,
      stuckRings: [],
      leanAt: 0,
      leaning: false,
      sparks: [],
      toast: "",
      toastMs: 0,
      raf: 0,
      shake: 0,
      closedStamp: false,
      deathHold: 0,
      deathReason: "",
      lastNote: "",
      settle: 0,
      houseRings: [],
      houseFly: [],
      roomCardMs: 1280,
    };
    tellDepth(0);
    run.sling = mountSling(kitRun);
    tellDepth(0);
    paintPips();
    const startBtn = el("bentRingStart");
    if (startBtn) startBtn.disabled = true;
    const verdict = el("bentRingVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("bentRingResult");
    PF.setTier("bentRingTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    setText("bentRingStatus", `${spec.name} — ${spec.barker}`);
    PF.focusCard("bentRingCard", true);
    PF.setAura("think");
    const loop = (now) => {
      if (!run || run.done) return;
      if (!run.last) run.last = now;
      const dt = Math.min(32, now - run.last);
      run.last = now;
      run.t += dt;
      if (run.dying) {
        stepFx(dt);
        draw();
        run.deathHold -= dt;
        if (run.deathHold <= 0) {
          sealResult(run.deathReason);
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

  function stepFx(dt) {
    if (!run) return;
    const k = dt / 16;
    if (run.sparks) {
      run.sparks = run.sparks.filter((s) => {
        s.life -= dt;
        s.x += s.vx * k;
        s.y += s.vy * k;
        s.vy += 0.06 * k;
        return s.life > 0;
      });
    }
    run.toastMs = Math.max(0, (run.toastMs || 0) - dt);
    run.roomCardMs = Math.max(0, (run.roomCardMs || 0) - dt);
    if (run.houseFly) {
      run.houseFly = run.houseFly.filter((h) => {
        h.life -= dt;
        h.x += (h.vx || 0) * k;
        h.y += (h.vy || 0) * k;
        h.vx = (h.vx || 0) + (28 - h.x) * 0.004 * dt;
        h.vy = (h.vy || 0) + 0.06 * k;
        h.spin = (h.spin || 0) + 0.1 * k;
        return h.life > 0;
      });
    }
  }

  function beginAim(x, y) {
    if (!isLive() || run.ring || run.settle > 0 || run.rings <= 0) return;
    run.aim = { x, y, hx: TEE.x, hy: TEE.y, power: 0 };
    if (run.sling && typeof run.sling.beginPull === "function") {
      run.sling.beginPull(TEE.x, TEE.y);
      if (typeof run.sling.movePull === "function") run.sling.movePull(x, y);
    }
    updateAim(x, y);
  }

  function updateAim(x, y) {
    if (!run || !run.aim) return;
    const dx = TEE.x - x;
    const dy = TEE.y - y;
    const dist = Math.hypot(dx, dy);
    const pull = kit.clamp(dist, 0, 118);
    const power = pull / 118;
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
    if (!run || !run.aim || run.done || run.dying || run.ring) {
      if (run) run.aim = null;
      return;
    }
    const pull = run.aim.power;
    if (pull < 0.12) {
      run.aim = null;
      if (run.sling && typeof run.sling.release === "function") run.sling.release();
      setText("bentRingStatus", "Pull back — that’s the throw.");
      return;
    }
    const dx = run.aim.hx - TEE.x;
    const dy = run.aim.hy - TEE.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = throwSpeed(pull);
    const noise = 1 + (Math.random() * 0.03 - 0.015);
    const vx = (dx / dist) * speed * noise;
    const vy = (dy / dist) * speed * noise;
    if (run.sling && typeof run.sling.release === "function") {
      run.sling.release();
    }
    run.rings -= 1;
    run.leanAt = run.t + run.spec.delayMs;
    run.leaning = false;
    run.pegs.forEach((p) => {
      if (p.stuck) return;
      p.x = p.homeX != null ? p.homeX : p.x;
      p.lean = 0;
      p.targetLean = ghostLean(p, run.spec);
      p.leanStart = 0;
    });
    run.ring = {
      x: TEE.x,
      y: TEE.y,
      vx,
      vy,
      life: 0,
      stuckOn: null,
      spin: 0,
    };
    run.aim = null;
    paintPips();
    kit.sfx("throw");
    setText("bentRingStatus", `In the air — lean in ${run.spec.delayMs}ms. Throw where the ghosts sit.`);
  }

  function stuckCount() {
    return run.pegs.reduce((n, p) => n + (p.stuck ? 1 : 0), 0);
  }

  function awardStick(idx) {
    run.score += 80;
    if (run.kitRun) run.kitRun.score = run.score;
    run.stuckRings.push({ i: idx });
    const tip = pegTip(run.pegs[idx]);
    spawnSparks(tip.x, tip.y, 10, "#b8e8e0");
    kit.sfx("sink");
    const need = run.spec.need;
    const have = stuckCount();
    setText("bentRingStatus", `Stuck ${have}/${need}. +80.`);
    PF.setAura("point");
    run.ring = null;
    if (have >= need) {
      clearStage();
      return;
    }
    run.settle = 240;
  }

  function clearStage() {
    run.stages += 1;
    run.score += 350;
    if (run.kitRun) {
      run.kitRun.depth = run.stages;
      run.kitRun.score = run.score;
    }
    tellDepth(run.stages);
    paintPips();
    PF.refreshDepth();
    kit.sfx("rack");
    PF.setAura("celebrate");
    const leftover = run.rings;
    if (leftover > 0) {
      run.houseRings = (run.houseRings || []).concat(new Array(leftover).fill(1));
      run.houseFly = run.houseFly || [];
      for (let i = 0; i < leftover; i += 1) {
        run.houseFly.push({
          x: TEE.x + (i - leftover / 2) * 14,
          y: TEE.y,
          vx: (28 + i * 16 - TEE.x) * 0.012,
          vy: 0.8,
          life: 720,
          spin: 0,
        });
      }
    }
    run.spec = bentringStageParams(run.stages + 1);
    if (!run.spec) {
      finish("souvenir");
      return;
    }
    run.pegs = makePegs(run.spec);
    run.rings = run.spec.ringsPerStage;
    run.ring = null;
    run.aim = null;
    run.stuckRings = [];
    run.leaning = false;
    run.settle = 0;
    run.toast = leftover > 0 ? `BOARD ${run.stages} · leftover rings stay in the house` : `BOARD ${run.stages} CLEAR`;
    run.toastMs = 900;
    run.roomCardMs = 1180;
    kit.sfx("chapter");
    setText("bentRingStatus", `BOARD ${run.stages} CLEAR · +350. ${run.spec.name} — ${run.spec.barker}`);
  }

  function killRing(note) {
    run.ring = null;
    run.lastNote = note || "miss";
    run.settle = 280;
    tellStrike("miss");
    paintPips();
    kit.sfx("miss");
    const have = stuckCount();
    setText("bentRingStatus", `Miss. Stuck ${have}/${run.spec.need} · rings ${run.rings}.`);
  }

  function step(dt) {
    const k = dt / 16;
    stepFx(dt);
    run.pegs.forEach((p) => {
      p.flash = Math.max(0, p.flash - dt);
    });
    if (run.settle > 0) run.settle = Math.max(0, run.settle - dt);

    applySpin(run.pegs, run.spec, run.t);

    if (run.ring && !run.leaning && run.t < run.leanAt) {
      const remain = Math.max(0, run.leanAt - run.t);
      const twitch = 1 - remain / Math.max(1, run.spec.delayMs);
      const snap = !!(run.spec.snap || run.spec.kind === "latesnap");
      run.pegs.forEach((p) => {
        if (p.stuck) return;
        const ghost = p.targetLean || ghostLean(p, run.spec);
        p.lean = ghost * (snap ? 0.34 : 0.22) * twitch * Math.sin(run.t * (snap ? 0.055 : 0.03) + p.wobble);
      });
    }

    if (run.ring && !run.leaning && run.t >= run.leanAt) {
      run.leaning = true;
      run.pegs.forEach((p) => {
        if (!p.stuck) p.leanStart = run.t + (p.delayExtra || 0);
      });
      const snap = !!(run.spec.snap || run.spec.kind === "latesnap");
      const leanLine = run.spec.kind === "spin"
        ? "PLATE SPINS — throw was already gone."
        : snap
          ? "THEY SNAP — throw was already gone."
          : "THEY LEAN — throw was already gone.";
      setText("bentRingStatus", leanLine);
      run.toast = snap ? "SNAP" : (run.spec.kind === "spin" ? "SPIN" : "THEY LEAN");
      run.toastMs = 640;
      run.shake = snap ? 8 : 6;
      PF.setAura("laugh");
    }
    if (run.leaning) {
      const spec = run.spec;
      const lerpMs = (spec.snap || spec.kind === "latesnap") ? SNAP_LERP_MS : LEAN_LERP_MS;
      run.pegs.forEach((p) => {
        if (p.stuck || !p.leanStart) return;
        if (p.still) {
          p.lean = 0;
          return;
        }
        const u = kit.clamp((run.t - p.leanStart) / lerpMs, 0, 1);
        const over = spec.snap || spec.kind === "latesnap"
          ? u
          : (u < 0.7 ? (u / 0.7) * 1.22 : 1.22 - ((u - 0.7) / 0.3) * 0.22);
        p.lean = p.targetLean * over;
      });
    }

    const ring = run.ring;
    if (ring && ring.stuckOn == null) {
      ring.vy += GRAVITY * k;
      ring.x += ring.vx * k;
      ring.y += ring.vy * k;
      ring.life += dt;
      ring.spin = (ring.spin || 0) + 0.18 * k;
      if (ring.x < 10) {
        ring.x = 10;
        ring.vx = Math.abs(ring.vx) * 0.45;
      }
      if (ring.x > W - 10) {
        ring.x = W - 10;
        ring.vx = -Math.abs(ring.vx) * 0.45;
      }
      const stuck = tryStick(ring);
      if (stuck && ring.stuckOn != null) {
        awardStick(ring.stuckOn);
        return;
      }
      const off = ring.y > H + 10 || ring.y < 8 || ring.life > 1600;
      const floor = ring.y > TEE.y + 8 && Math.hypot(ring.vx, ring.vy) < 1.1 && ring.life > 420;
      if (off || floor) killRing(run.lastNote || "miss");
    }

    if (!run.ring && run.rings <= 0 && stuckCount() < run.spec.need && run.settle <= 0) {
      finish("out of rings");
    }
  }

  function auraLine(reason, stages) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (run && run.lastNote === "decoy") return AURA.decoy;
    if (run && run.lastNote === "hook") return AURA.hook;
    if (run && run.lastNote === "spit") return AURA.spit;
    if (run && run.spec && run.spec.kind === "spin") return AURA.spin;
    if (run && run.spec && (run.spec.kind === "latesnap" || run.spec.snap)) return AURA.snap;
    if (run && run.spec && (run.spec.kind === "twindelay" || run.spec.kind === "warp")) return AURA.late;
    if (stages <= 0) return AURA.shallow;
    if (run && run.spec && run.spec.coda) return AURA.coda;
    if (stages >= 8) return AURA.coda;
    if (stages >= 5) return AURA.deep;
    if (stages >= 2) return AURA.mid;
    return AURA.miss;
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.deathReason = reason === "souvenir" ? "souvenir" : "out of rings";
    run.closedStamp = reason !== "souvenir";
    run.deathHold = DEATH_HOLD_MS;
    if (run.closedStamp) kit.sfx("stamp");
    run.shake = 7;
    run.pegs.forEach((p) => {
      if (!p.stuck) p.targetLean = ghostLean(p, run.spec) * 1.4;
    });
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    if (run.raf) cancelAnimationFrame(run.raf);
    run.closedStamp = reason !== "leave" && reason !== "souvenir";
    const stages = run.stages;
    const score = run.score;
    persistDepth({
      depth: stages,
      score,
      deathReason: reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : "out of rings"),
      cashedOut: reason === "souvenir",
      meta: {
        stuck: stuckCount(),
        stage: run.spec && run.spec.id,
        room: run.spec && run.spec.name,
        kind: run.spec && run.spec.kind,
        house: (run.houseRings && run.houseRings.length) || 0,
        coda: !!(run.spec && run.spec.coda),
      },
    });
    stampDepthCopy();
    const startBtn = el("bentRingStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "TOSS AGAIN · 1 demo coin";
    }
    PF.focusCard("bentRingCard", false);
    kit.setMode(card(), "result");
    const death = reason === "leave" ? "leave" : (reason === "souvenir" ? "souvenir" : "out of rings");
    const line = `BOARD ${stages} · SCORE ${score}`;
    const aura = auraLine(reason, stages);
    const challenge = challengeLine(stages);
    const verdict = el("bentRingVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = `${line} · ${death} · ${aura}`;
    }
    kit.fillResult({
      root: "bentRingResult",
      depth: "bentRingResultDepth",
      score: "bentRingResultScore",
      aura: "bentRingResultAura",
      copied: "bentRingCopied",
    }, {
      depthLine: `BOARD ${stages}${run.spec && run.spec.name ? " · " + run.spec.name : ""}`,
      scoreLine: `SCORE ${score} · ${death}`,
      auraLine: aura,
    });
    const reasonNode = el("bentRingResultReason");
    if (reasonNode) reasonNode.textContent = String(death).replace(/_/g, " ").toUpperCase();
    setText("bentRingChallengeText", challenge);
    PF.setTier("bentRingTier", stages > 0 ? `BOARD ${stages}` : "MISS", stages > 0 ? "perfect" : "miss");
    setText("bentRingStatus", reason === "leave" ? "Stepped off the stall." : reason === "souvenir" ? "Souvenir — authored boards cleared." : "Board stamped MISS.");
    const ok = stages > 0;
    if (ok) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Bent rings");
      PF.setAura(stages >= 3 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `BOARD ${stages}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Bent rings miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "MISS", aura);
    }
    PF.refreshNightBoard();
    draw();
    startIdle();
  }

  PF.registerVendor({
    id: "bent-rings",
    playKey: "bentring",
    chalk: "Ring a bent peg — if it stays bent.",
    defaults: { bestBentRing: 0, bestBentRingScore: 0 },
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopIdle();
    },
    onShow() { stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      const verdict = el("bentRingVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("bentRingResult");
      const startBtn = el("bentRingStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      stampDepthCopy();
      startIdle();
    },
    refreshDepth(state) {
      setText("depthBentNow", isLive() || (run && run.dying) ? String(run.stages) : "0");
      const bestN = Math.max(state.bestBentRing || 0, (state.bestDepth && state.bestDepth.bentring) || 0);
      setText("depthBentBest", bestN ? String(bestN) : "—");
      setText("depthBentScore", isLive() || (run && run.dying) ? String(run.score) : "0");
      setText("depthBentBestScore", state.bestBentRingScore ? String(state.bestBentRingScore) : "—");
      const door = el("bentRingDoorBest");
      if (door) door.textContent = bestN ? `Best board ${bestN}` : "Boards —";
    },
    bind() {
      declareP0();
      const startBtn = el("bentRingStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = el("bentRingCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            if (!run || run.done) punchStart();
            return;
          }
          ev.preventDefault();
          try { canvas.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
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
        canvas.addEventListener("pointercancel", () => { if (run) run.aim = null; });
      }
      const copyBtn = el("bentRingChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const last = PF.getState().lastRun;
          const n = (last && (last.game === GAME_ID || last.gameId === GAME_ID))
            ? last.depth
            : (PF.getState().bestBentRing || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("bentRingCopied");
            if (copied) {
              copied.hidden = false;
              copied.textContent = "Copied — send it";
            }
            setText("bentRingStatus", "Copied — send it");
          }, () => {
            setText("bentRingStatus", text);
          });
        });
      }
      stampDepthCopy();
      startIdle();
    },
  });
})();
