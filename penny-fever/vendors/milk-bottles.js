/* Weighted Milk Bottles — Desktop Grok owns this file. PF only. Never booth/port 6000.
 * GOBLIN REVIEW HIT #2 FEEL 2026-09-05 — named rooms = verb/layout change, not mass climb.
 * Polish: Wide Shoulders squat 4–3–2–1, Glue heel pinned, Split two crates,
 * Wind gust pulses, Stuck pin is never a heel, barker tracks the live room.
 * Latest: GOBLIN_P0_AUTHORED_ACCEPT_FEEL.md (M1–M6) + GOBLIN_AUTHORED_LEVELS_P0.md +
 * GOBLIN_BATCH02_BUILD_SHEETS.md + GOBLIN_BATCH02_MOUNT_CONFIGS.md +
 * GOBLIN_BATCH02_AURA_LINES.md + GOBLIN_RUNKIT_API.md.
 * Engine: SlingAim (launcher) · Custom impulse (pyramid) · depthUnit: Pyramid · gameId: milk
 * codaEnabled hybrid: 7 named rooms then ENDLESS Concrete Row {n}. NOT pure stageParams.
 * M1 Wide Shoulders = 4–3–2–1 squat silhouette. M2 Glue Corner = left heel two-hit plan.
 * M3 Split Stack = two mini pyramids, dual clear. M4 Wind Shelf = aim-compensate gust.
 * M5 Stuck Pin Atelier = darker scout pin + heavy heels. M6 layouts change the beat.
 * Glue/stuck stay pinned until the second hit — no support-collapse cheese.
 * Shares Ball Toss sling DNA (gravity, pull, throwSpeed). Stall owns pyramid death. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;
  const W = 340;
  const H = 430;
  const SHELF_Y = 318;
  const SHELF_L = 38;
  const SHELF_R = 302;
  const BALL_R = 7.5;
  const BOTTLE_R = 13.4;
  const TEE = { x: W / 2, y: H - 24 };
  const GRAVITY = 0.165;
  const FALL_ROT = (50 * Math.PI) / 180;
  const GAME_ID = "milk";
  const CODA_ENABLED = true;
  const AUTHORED_COUNT = 7;
  const STAMP_MS = 720;
  let run = null;
  let idleRaf = 0;
  let idleRoom = 1;
  let idleClock = 0;

  const AURA = {
    throws: "Aura: Three softballs. That bottom row is concrete, sugar.",
    incomplete: "Aura: Pyramid still standing. The heavy ones laughed.",
    clear: "Aura: Spill complete. Next pyramid fights dirtier.",
    souvenir: "Aura: Pyramid seven locked. Souvenir — the lead salutes.",
    coda: "Aura: Authored ride’s over. ENDLESS — concrete keeps climbing.",
    deep: (n) => `Aura: Pyramid ${n}. You're arguing with gravity and winning.`,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 7 authored PYRAMIDS · ENDLESS coda · not a one-tap prize",
    body: "Authored rooms, not a thinner loop: Fairground Six → Heavy Heels → Wide Shoulders → Glue Corner → Split Stack → Wind Shelf → Stuck Pin Atelier. Three throws a pyramid. After 7, ENDLESS coda (flaggable). Fail to clear stamps LEAD.",
    status: "Depth run · START · 1 demo coin · 7 authored PYRAMIDS then ENDLESS",
    machine: "Spill-the-milk · 1 demo coin · authored PYRAMIDS",
    idleHud: ["Authored PYRAMIDS — bottom row is lead", "Drag-aim · 3 throws a room · START"],
    punch: "Depth run — press START. No one-tap prize.",
  };

  /* Authored PYRAMID rooms — unique layout / cheat / beat. Not “same 3–2–1, heavier bottoms.” */
  const MILK_LEVELS = [
    {
      id: 1, name: "Fairground Six", kind: "classic", layout: "3-2-1",
      topMass: 1, midMass: 1.4, bottomMass: 2.0, pinSpacing: "wide", gap: 34,
      windDrift: 0, glueBottomCorner: false, stuckBottle: false, rise: 39,
      barker: "Classic six. Aim the base — the cream on top is a liar.",
    },
    {
      id: 2, name: "Heavy Heels", kind: "heavyHeels", layout: "3-2-1",
      topMass: 0.82, midMass: 1.15, bottomMass: 2.6, pinSpacing: "wide", gap: 34,
      windDrift: 0, glueBottomCorner: false, stuckBottle: false, rise: 39,
      barker: "Same silhouette. Bottoms are concrete. Tops fly if you let them.",
    },
    {
      id: 3, name: "Wide Shoulders", kind: "wideShoulders", layout: "4-3-2-1",
      topMass: 1, midMass: 1.7, bottomMass: 2.4, pinSpacing: "wide", gap: 50,
      windDrift: 0, glueBottomCorner: false, stuckBottle: false, rise: 22,
      barker: "Ten pins. New silhouette. Mid row fights back too.",
    },
    {
      id: 4, name: "Glue Corner", kind: "glueCorner", layout: "3-2-1",
      topMass: 1, midMass: 1.4, bottomMass: 2.4, pinSpacing: "normal", gap: 29.5,
      windDrift: 0, glueBottomCorner: true, stuckBottle: false, rise: 39,
      barker: "Left heel is glued. Plan the second shot.",
    },
    {
      id: 5, name: "Split Stack", kind: "splitStack", layout: "3+3", stacks: 2,
      topMass: 1, midMass: 1.35, bottomMass: 2.5, pinSpacing: "wide", gap: 36,
      windDrift: 0, glueBottomCorner: false, stuckBottle: false, rise: 44,
      barker: "Two boards. Both must fall. Center aisle is dead air.",
    },
    {
      id: 6, name: "Wind Shelf", kind: "windShelf", layout: "3-2-1",
      topMass: 1, midMass: 1.4, bottomMass: 2.6, pinSpacing: "tight", gap: 25.8,
      windDrift: 0.26, glueBottomCorner: false, stuckBottle: false, rise: 39,
      barker: "Lateral wind on the ball. Lead the throw into the gust.",
    },
    {
      id: 7, name: "Stuck Pin Atelier", kind: "stuckPin", layout: "3-2-1",
      topMass: 1, midMass: 1.45, bottomMass: 3.2, pinSpacing: "tight", gap: 25.2,
      windDrift: 0, glueBottomCorner: false, stuckBottle: true, rise: 39,
      barker: "Dark pin is stuck. Scout it, then strike. Bottoms are lead.",
    },
  ];

  const P0_MOUNT = {
    engine: "SlingAim",
    displayName: "Weighted Milk Bottles",
    depthUnit: "Pyramid",
    sheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
    batchSheet: "GOBLIN_BATCH02_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  function rk() {
    return PF.runKit || null;
  }

  function milkCodaParams(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const t = stage - AUTHORED_COUNT;
    return {
      id: stage,
      name: `Concrete Row ${stage}`,
      title: `Concrete Row ${stage}`,
      kind: "coda",
      coda: true,
      layout: "3-2-1",
      throwsPerPyramid: 3,
      topMass: 1,
      midMass: 1.5,
      bottomMass: Math.min(4.2, 3.2 + 0.15 * t),
      pinSpacing: "tight",
      gap: 25.2,
      windDrift: Math.min(0.42, 0.18 + t * 0.04),
      glueBottomCorner: false,
      stuckBottle: true,
      rise: 39,
      fallRotDeg: 50,
      missesToDeath: 3,
      stacks: 1,
      barker: "ENDLESS — concrete keeps climbing.",
    };
  }

  function milkLevel(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) {
      const L = MILK_LEVELS[stage - 1];
      return Object.assign({
        throwsPerPyramid: 3,
        fallRotDeg: 50,
        missesToDeath: 3,
        stacks: 1,
        coda: false,
      }, L, { id: stage, title: L.name, name: L.name });
    }
    if (!P0_MOUNT.codaEnabled) return null;
    return milkCodaParams(stage);
  }

  function hudStageLine(spec, cleared) {
    if (!spec) return `PYRAMID ${cleared | 0}`;
    if (spec.coda) return `ENDLESS · PYRAMID ${spec.id} · ${spec.name}`;
    return `PYRAMID ${spec.id} · ${spec.name}`;
  }

  function paintKitHud(spec) {
    const host = card();
    if (!host) return;
    const hud = host.querySelector(".milk-rk-hud");
    if (!hud) return;
    if (!spec || !run || run.done) {
      hud.textContent = "";
      return;
    }
    hud.textContent = hudStageLine(spec, run.pyramids);
  }

  function roomTell(spec) {
    if (!spec) return "BOTTOM ROW IS LEAD";
    if (spec.kind === "splitStack") return "TWO BOARDS · BOTH MUST FALL";
    if (spec.kind === "glueCorner") return "LEFT HEEL IS GLUED · TWO THROWS";
    if (spec.kind === "stuckPin") return "SCOUT THE DARK PIN · THEN STRIKE";
    if (spec.kind === "windShelf") return "WIND ON THE BALL · LEAD THE GUST";
    if (spec.kind === "wideShoulders") return "TEN PINS · 4–3–2–1 WIDE BASE";
    if (spec.kind === "heavyHeels") return "SAME SIX · HEELS ARE CONCRETE";
    if (spec.coda) return "ENDLESS · CONCRETE ROW";
    return "BOTTOM ROW IS LEAD";
  }

  function paintVestibuleCheat(spec) {
    const host = card();
    if (!host) return;
    if (!spec) {
      spec = (run && !run.done && run.spec) ? run.spec : attractSpec();
    }
    const barker = host.querySelector(".barker-call");
    if (barker) {
      barker.textContent = spec && spec.barker
        ? `${spec.name.toUpperCase()} — ${spec.barker}`
        : "KNOCK ’EM ALL — THE BOTTOM ONES FIGHT BACK";
    }
    if (run && !run.done) return;
    const status = $("milkStatus");
    if (status && spec) {
      status.textContent = `${hudStageLine(spec, 0)} — ${spec.barker || DEPTH_COPY.status}`;
    }
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    const spec = Object.assign({
      authored: MILK_LEVELS,
      authoredCount: AUTHORED_COUNT,
      codaEnabled: CODA_ENABLED,
      codaParams: milkCodaParams,
      level: milkLevel,
      stageParams: milkLevel,
      milkStageParams: milkLevel,
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

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall through */ }
    }
    return kit.persistRun(PF.getState(), GAME_ID, partial);
  }

  function isLive() {
    return !!(run && !run.done && run.kitRun && run.kitRun.alive !== false);
  }

  function punchStart() {
    stampDepthCopy();
    const el = $("milkStatus");
    if (el) el.textContent = DEPTH_COPY.punch;
    const btn = $("milkStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function saveLiveDepth() {
    if (!run) return;
    const state = PF.getState();
    if (!state) return;
    const depth = run.pyramids | 0;
    const score = run.score | 0;
    state.bestMilkPyramids = Math.max(state.bestMilkPyramids || 0, depth);
    state.bestMilkScore = Math.max(state.bestMilkScore || 0, score);
    state.bestDepth = state.bestDepth || {};
    state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, depth);
    if (run.kitRun) {
      run.kitRun.depth = depth;
      run.kitRun.score = score;
    }
    if (typeof PF.saveState === "function") PF.saveState();
    if (typeof PF.refreshDepth === "function") {
      try { PF.refreshDepth(); } catch (_) {}
    }
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "throws",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestMilkPyramids = Math.max(state.bestMilkPyramids || 0, payload.depth);
      state.bestMilkScore = Math.max(state.bestMilkScore || 0, payload.score);
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
    }
    closeKitRun(payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function mountSling(ctx) {
    const engines = rk() && rk().engines;
    if (!engines || !engines.SlingAim || typeof engines.SlingAim.mount !== "function" || !ctx) return null;
    try {
      /* Launcher only. Stall owns pyramid death (3 throws / incomplete).
       * missesToDeath is huge so SlingAim.resolveHit cannot steal the run. */
      return engines.SlingAim.mount(card(), {
        gravity: GRAVITY,
        missesToDeath: 99,
        stageParams: milkLevel,
        onThrow() {},
        hitTest() { return false; },
      }, ctx);
    } catch (_) {
      return null;
    }
  }

  function wobbleAmp(pyramidNo, heavy) {
    if (heavy) return 0;
    return Math.max(0.28, 2.45 - pyramidNo * 0.22);
  }

  function leadGlint(pyramidNo, mass, heavy) {
    if (!heavy && !(mass >= 1.55)) return 0;
    const massBit = Math.max(0, (mass || 1) - 1) * 0.22;
    return Math.min(1, Math.max(0.16, 0.5 + massBit - pyramidNo * 0.05));
  }

  function layoutSlots(spec) {
    if (spec.kind === "wideShoulders" || spec.layout === "4-3-2-1") {
      /* Squat 4–3–2–1 — new silhouette from the tent mouth, not a stretched 3–2–1. */
      return [
        { col: 0, row: 0 },
        { col: -0.62, row: 1 }, { col: 0.62, row: 1 },
        { col: -1.24, row: 2 }, { col: 0, row: 2 }, { col: 1.24, row: 2 },
        { col: -1.92, row: 3 }, { col: -0.64, row: 3 }, { col: 0.64, row: 3 }, { col: 1.92, row: 3 },
      ];
    }
    if (spec.kind === "splitStack" || spec.layout === "3+3") {
      /* Two mini 2–1 pyramids (3+3). Wide aisle is dead air — boards do not brace each other. */
      return [
        { col: -3.08, row: 0, stack: 0 },
        { col: -3.64, row: 1, stack: 0 },
        { col: -2.52, row: 1, stack: 0 },
        { col: 3.08, row: 0, stack: 1 },
        { col: 2.52, row: 1, stack: 1 },
        { col: 3.64, row: 1, stack: 1 },
      ];
    }
    return [
      { col: 0, row: 0 },
      { col: -0.5, row: 1 },
      { col: 0.5, row: 1 },
      { col: -1, row: 2 },
      { col: 0, row: 2 },
      { col: 1, row: 2 },
    ];
  }

  function makePyramid(pyramidNo) {
    const spec = milkLevel(pyramidNo) || milkCodaParams(pyramidNo);
    const n = spec.id;
    const gap = spec.gap;
    const cx = W / 2;
    const baseY = SHELF_Y - 22;
    const rise = spec.rise || 39;
    const slots = layoutSlots(spec);
    let bottomRow = 0;
    slots.forEach((s) => { if (s.row > bottomRow) bottomRow = s.row; });
    const bottomSlots = slots.filter((s) => s.row === bottomRow);
    let gluePick = null;
    if (spec.glueBottomCorner && bottomSlots.length) {
      /* Left heel is the glued corner — a planned second shot, not a coin-flip. */
      let left = bottomSlots[0];
      bottomSlots.forEach((s) => {
        if (s.col < left.col) left = s;
      });
      gluePick = left;
    }
    let stuckSlot = -1;
    if (spec.stuckBottle) {
      /* Scout-then-strike: never a heel — Glue Corner already owns the left-heel two-hit. */
      const midTop = [];
      slots.forEach((s, i) => {
        if (s.row !== bottomRow) midTop.push(i);
      });
      stuckSlot = midTop.length ? midTop[(Math.random() * midTop.length) | 0] : 0;
    }
    return slots.map((s, i) => {
      const heavy = s.row === bottomRow;
      const glued = !!(gluePick && s === gluePick);
      const stuck = i === stuckSlot;
      let mass = spec.topMass;
      if (s.row > 0 && s.row < bottomRow) mass = spec.midMass;
      if (heavy) mass = spec.bottomMass;
      if (stuck) mass += 0.85;
      return {
        x: cx + s.col * gap,
        y: baseY - (bottomRow - s.row) * rise,
        vx: 0,
        vy: 0,
        rot: 0,
        spin: 0,
        r: spec.kind === "wideShoulders" ? BOTTLE_R * 0.9 : BOTTLE_R,
        row: s.row,
        stack: s.stack || 0,
        heavy,
        glued,
        stuck,
        hits: 0,
        needHits: glued || stuck ? 2 : 1,
        seated: true,
        fallen: false,
        mass,
        glueFlash: 0,
        stuckPulse: stuck ? 1 : 0,
        phase: i * 1.17 + n * 0.4,
        wobble: (glued || stuck) ? 0 : wobbleAmp(n, heavy),
        glint: leadGlint(n, mass, heavy),
      };
    });
  }

  function nowT() {
    return run && !run.done ? run.t : performance.now();
  }

  function posOf(b, t) {
    const flash = b.glueFlash || 0;
    const jx = flash > 0 ? Math.sin(t * 0.08) * 2.4 : 0;
    if (b.fallen || !b.seated || b.heavy) return { x: b.x + jx, y: b.y };
    return { x: b.x + Math.sin(t * 0.0032 + b.phase) * b.wobble + jx, y: b.y };
  }

  function stackStanding(list, stack) {
    let n = 0;
    for (const b of list) {
      if (!b.fallen && (b.stack || 0) === stack) n += 1;
    }
    return n;
  }

  function attractSpec() {
    return milkLevel(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  let idleBottles = null;
  function bottles() {
    if (run && run.bottles) return run.bottles;
    if (!idleBottles) idleBottles = makePyramid(attractSpec().id);
    return idleBottles;
  }

  function bottomRowOf(list) {
    let m = 0;
    for (const o of list) if ((o.row | 0) > m) m = o.row | 0;
    return m;
  }

  function seatedBottomNeighbors(b, list) {
    const bottom = bottomRowOf(list);
    let n = 0;
    for (const o of list) {
      if (o === b || o.fallen || !o.seated) continue;
      if (o.row === bottom && Math.abs(o.x - b.x) < 54) n += 1;
    }
    return n;
  }

  function unseatThreshold(b, list) {
    /* Glue / stuck never leave on the first softball — planned second shot. */
    if ((b.glued || b.stuck) && b.hits < (b.needHits || 2)) return 99;
    if (!b.heavy) {
      /* Mid-row mass (Wide Shoulders) fights; cream tops fly. */
      return 0.58 + Math.max(0, (b.mass || 1) - 1) * 0.28;
    }
    const locked = seatedBottomNeighbors(b, list);
    const massBump = Math.max(0, (b.mass || 2) - 2) * 0.42;
    if (locked >= 2) return 4.05 + massBump;
    if (locked === 1) return 0.92 + massBump;
    return 0.7 + massBump;
  }

  function maybeUnseat(b, list) {
    if (!b.seated || b.fallen) return false;
    const twoHitDone = (b.glued || b.stuck) && b.hits >= (b.needHits || 2);
    const sp = Math.hypot(b.vx, b.vy);
    if (!twoHitDone && sp < unseatThreshold(b, list)) return false;
    const p = posOf(b, nowT());
    b.x = p.x;
    b.y = p.y;
    b.seated = false;
    b.loose = 0;
    if (twoHitDone && sp < 2.2) {
      b.vx += (b.x < W / 2 ? -2.4 : 2.4);
      b.vy -= 2.6;
      b.spin += b.x < W / 2 ? -0.18 : 0.18;
    }
    collapseFrom(b, list);
    if (!b.heavy && b.row === 2) {
      for (const o of list) {
        if (o === b || o.fallen || o.row !== 2) continue;
        if (Math.abs(o.x - b.x) > 42) continue;
        o.vx += o.x >= b.x ? 2.35 : -2.35;
        o.vy -= 0.9;
        o.spin += o.x >= b.x ? 0.12 : -0.12;
        maybeUnseat(o, list);
      }
    }
    return true;
  }

  function collapseFrom(b, list) {
    const speed = Math.hypot(b.vx, b.vy);
    if (speed < 0.75) return;
    for (const o of list) {
      if (o === b || o.fallen) continue;
      const dx = o.x - b.x;
      const dy = o.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 64) continue;
      const boost = (b.heavy ? 0.18 : 1.12) * (1 - d / 64);
      o.vx += (dx / d) * boost * speed;
      o.vy += (dy / d) * boost * speed * 0.4 - 0.45;
      o.spin += dx > 0 ? 0.1 : -0.1;
      maybeUnseat(o, list);
    }
  }

  function impulse(a, b, nx, ny, rest) {
    const rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
    if (rv > 0) return 0;
    const invA = 1 / (a.mass || 0.9);
    const mass = Math.max(0.7, b.mass || 1);
    /* Seated invB scales with mass so Heavy Heels actually sits heavier than Fairground Six. */
    const invB = b.seated ? 0.03 / mass : 1 / mass;
    const j = -(1 + rest) * rv / (invA + invB);
    a.vx += j * nx * invA;
    a.vy += j * ny * invA;
    const pinned = (b.glued || b.stuck) && b.hits < (b.needHits || 2);
    if (pinned) return Math.abs(j);
    if (!b.seated) {
      b.vx -= j * nx * invB;
      b.vy -= j * ny * invB;
    } else if (b.heavy) {
      const kick = 0.28 / mass;
      b.vx -= j * nx * kick;
      b.vy -= j * ny * kick * 0.82;
    } else {
      const kick = 0.64 / mass;
      b.vx -= j * nx * kick;
      b.vy -= j * ny * kick * 0.86;
    }
    return Math.abs(j);
  }

  function separate(ax, ay, ar, bx, by, br) {
    const dx = bx - ax;
    const dy = by - ay;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const min = ar + br;
    if (dist >= min) return null;
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = min - dist;
    return { nx, ny, overlap, dist };
  }

  function drawBottle(ctx, b, t) {
    const p = posOf(b, t);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(b.rot || 0);
    const h = 46;
    const bodyW = 14.5;
    const neckW = 6.6;
    if (b.seated) {
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(0, h / 2 + 2, 11, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(-bodyW, h / 2 - 5);
    ctx.quadraticCurveTo(-bodyW, h / 2, -bodyW + 5, h / 2);
    ctx.lineTo(bodyW - 5, h / 2);
    ctx.quadraticCurveTo(bodyW, h / 2, bodyW, h / 2 - 5);
    ctx.lineTo(bodyW - 1, -h / 2 + 16);
    ctx.quadraticCurveTo(neckW + 1, -h / 2 + 12, neckW, -h / 2 + 10);
    ctx.lineTo(neckW - 0.5, -h / 2 + 2);
    ctx.quadraticCurveTo(0, -h / 2 - 2, -neckW + 0.5, -h / 2 + 2);
    ctx.lineTo(-neckW, -h / 2 + 10);
    ctx.quadraticCurveTo(-neckW - 1, -h / 2 + 12, -bodyW + 1, -h / 2 + 16);
    ctx.closePath();
    const glass = ctx.createLinearGradient(-bodyW, 0, bodyW, 0);
    const midFight = !b.heavy && (b.mass || 1) >= 1.55;
    if (b.heavy) {
      glass.addColorStop(0, "#5a4a46");
      glass.addColorStop(0.42, "#c4b4a4");
      glass.addColorStop(1, "#3a2c2a");
    } else if (midFight) {
      glass.addColorStop(0, "#6a5a52");
      glass.addColorStop(0.42, "#d8c8b4");
      glass.addColorStop(1, "#4a3a36");
    } else {
      glass.addColorStop(0, "#7a96a0");
      glass.addColorStop(0.4, "#eef4f6");
      glass.addColorStop(1, "#5a7882");
    }
    ctx.fillStyle = glass;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = b.heavy
      ? "rgba(86,76,68,0.58)"
      : (midFight ? "rgba(120,96,78,0.42)" : "rgba(255,252,244,0.74)");
    ctx.fillRect(-bodyW, 0, bodyW * 2, h / 2);
    if (b.heavy) {
      const lead = Math.min(0.92, 0.42 + Math.max(0, (b.mass || 2) - 2) * 0.28 + b.glint * 0.2);
      ctx.fillStyle = `rgba(22,16,12,${lead})`;
      ctx.beginPath();
      ctx.ellipse(0, h / 2 - 7, 10.5, 5.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(212,164,90,${b.glint})`;
      ctx.fillRect(-9.5, h / 2 - 12, 19, 2.1);
    }
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(-bodyW + 3, -h / 2 + 14, 2.6, 18);
    ctx.restore();
    ctx.strokeStyle = b.heavy ? "#8a6a50" : "#f0d09a";
    ctx.lineWidth = 1.25;
    ctx.stroke();
    ctx.fillStyle = b.glued || b.stuck ? "#8a6230" : "#c41e3a";
    ctx.fillRect(-neckW - 1.2, -h / 2 - 3.2, neckW * 2 + 2.4, 6.2);
    ctx.fillStyle = "#f0d09a";
    ctx.fillRect(-neckW, -h / 2 - 1, neckW * 2, 2);
    if (b.glued || b.stuck) {
      if (b.stuck) {
        const pulse = 0.45 + 0.35 * Math.abs(Math.sin((t || 0) * 0.006));
        ctx.strokeStyle = `rgba(232,160,184,${pulse})`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, 2, bodyW + 5, h / 2 + 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(12,8,6,0.62)";
        ctx.fillRect(-bodyW + 1, -h / 2 + 10, bodyW * 2 - 2, h / 2 + 4);
      }
      ctx.fillStyle = b.stuck ? "rgba(28,16,12,0.88)" : "rgba(212,164,90,0.88)";
      ctx.beginPath();
      ctx.ellipse(5.2, h / 2 - 5, 3.1, 6.2, 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = b.stuck ? "rgba(18,10,8,0.82)" : "rgba(90,48,18,0.7)";
      ctx.fillRect(-4, h / 2 - 11, 8, 2);
      if (b.glued) {
        ctx.fillStyle = (b.hits | 0) > 0 ? "rgba(196,30,58,0.82)" : "rgba(212,164,90,0.7)";
        ctx.beginPath();
        ctx.moveTo(-8, h / 2 - 2);
        ctx.quadraticCurveTo(-2, h / 2 + 14, 7, h / 2 + 10);
        ctx.quadraticCurveTo(0, h / 2 + 2, -8, h / 2 - 2);
        ctx.fill();
        ctx.fillStyle = "rgba(196,30,58,0.45)";
        ctx.beginPath();
        ctx.ellipse(0, h / 2 + 6, 11, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();
        if ((b.hits | 0) > 0) {
          ctx.strokeStyle = "rgba(240,208,154,0.95)";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-7, h / 2 - 10);
          ctx.lineTo(1, h / 2 + 4);
          ctx.lineTo(8, h / 2 - 6);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-4, -h / 2 + 16);
          ctx.lineTo(6, h / 2 - 8);
          ctx.stroke();
        }
      }
      ctx.fillStyle = b.stuck ? "#e8a0b8" : "#f0d09a";
      ctx.font = "8px Georgia, serif";
      ctx.textAlign = "center";
      const tag = (b.hits | 0) > 0
        ? `${b.hits}/${b.needHits || 2}`
        : (b.stuck ? "DARK PIN" : "GLUE");
      ctx.fillText(tag, 0, -h / 2 - 8);
      ctx.textAlign = "left";
    } else if (b.heavy && run && run.spec && run.spec.kind === "heavyHeels") {
      ctx.fillStyle = "rgba(196,30,58,0.9)";
      ctx.font = "7px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("LEAD", 0, h / 2 + 12);
      ctx.textAlign = "left";
    }
    ctx.restore();
  }

  function throwSpeed(power) {
    return 6.15 + power * 8.85;
  }

  function windGust(t) {
    /* Punchy gusts so Wind Shelf is a timing room, not a constant shove. */
    const wave = Math.sin(t * 0.0058);
    return wave > 0.35 ? 1.7 : 0.42;
  }

  function windAccel(drift, t, k) {
    if (!drift) return 0;
    /* Sheet windDrift 0.26 is a lead-the-gust, not a vacuum. Same kick in preview + flight. */
    return drift * 0.42 * (k == null ? 1 : k) * windGust(t);
  }

  function predictArc(power, ang) {
    const speed = throwSpeed(power);
    let x = TEE.x;
    let y = TEE.y;
    let vx = Math.cos(ang) * speed;
    let vy = Math.sin(ang) * speed;
    const pts = [];
    const wind = run && run.spec ? run.spec.windDrift : 0;
    const t0 = run ? run.t : 0;
    for (let i = 0; i < 48; i += 1) {
      vy += GRAVITY;
      vx += windAccel(wind, t0 + i * 16, 1);
      x += vx;
      y += vy;
      pts.push({ x, y });
      if (y > H - 8 || x < 0 || x > W) break;
    }
    return pts;
  }

  function drawRoomPlate(ctx, spec) {
    if (!spec) return;
    ctx.fillStyle = "rgba(12,6,9,0.78)";
    ctx.fillRect(22, 48, W - 44, 38);
    ctx.strokeStyle = spec.coda ? "rgba(196,30,58,0.85)" : "rgba(212,164,90,0.7)";
    ctx.strokeRect(22.5, 48.5, W - 45, 37);
    ctx.fillStyle = spec.coda ? "#e8a0b8" : "#f0d09a";
    ctx.font = "11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(hudStageLine(spec, run ? run.pyramids : 0), W / 2, 64);
    ctx.fillStyle = spec.coda ? "#e8a0b8" : "#d4a45a";
    ctx.font = "9px Georgia, serif";
    ctx.fillText(roomTell(spec), W / 2, 78);
    ctx.textAlign = "left";
  }

  function draw() {
    const canvas = $("milkCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (run) run.shake = kit.applyShake(ctx, run.shake || 0);

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#2c1420");
    g.addColorStop(0.55, "#1a0c12");
    g.addColorStop(1, "#10080c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(22, 48);
    ctx.lineTo(318, 40);
    ctx.lineTo(328, SHELF_Y + 8);
    ctx.lineTo(12, SHELF_Y + 18);
    ctx.closePath();
    ctx.clip();
    kit.fillWood(ctx, 8, 36, 324, SHELF_Y);
    ctx.fillStyle = "rgba(80,24,36,0.18)";
    for (let y = 52; y < SHELF_Y; y += 28) ctx.fillRect(12, y, 316, 10);
    ctx.restore();

    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(18.5, 46.5, 303, SHELF_Y - 40);

    ctx.fillStyle = "#3a2418";
    ctx.fillRect(SHELF_L - 10, SHELF_Y, SHELF_R - SHELF_L + 20, 14);
    ctx.fillStyle = "#d4a45a";
    ctx.fillRect(SHELF_L - 10, SHELF_Y, SHELF_R - SHELF_L + 20, 3);
    ctx.fillStyle = "#1a0c10";
    ctx.fillRect(16, SHELF_Y + 14, W - 32, 10);
    const room = run && run.spec ? run.spec : attractSpec();
    if (room && room.kind === "splitStack") {
      ctx.fillStyle = "rgba(12,6,9,0.62)";
      ctx.fillRect(W / 2 - 36, 90, 72, SHELF_Y - 90);
      ctx.fillStyle = "#4a3020";
      ctx.fillRect(18, SHELF_Y - 10, 118, 18);
      ctx.fillRect(W - 18 - 118, SHELF_Y - 10, 118, 18);
      ctx.fillStyle = "#2a1810";
      ctx.fillRect(22, SHELF_Y - 28, 110, 18);
      ctx.fillRect(W - 22 - 110, SHELF_Y - 28, 110, 18);
      ctx.fillStyle = "#d4a45a";
      ctx.fillRect(18, SHELF_Y - 10, 118, 3);
      ctx.fillRect(W - 18 - 118, SHELF_Y - 10, 118, 3);
      ctx.strokeStyle = "rgba(196,30,58,0.7)";
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 58);
      ctx.lineTo(W / 2, SHELF_Y);
      ctx.stroke();
      ctx.setLineDash([]);
      const listNow = bottles();
      const leftN = stackStanding(listNow, 0);
      const rightN = stackStanding(listNow, 1);
      ctx.fillStyle = "rgba(240,208,154,0.88)";
      ctx.font = "9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("DEAD AIR", W / 2, 168);
      ctx.fillText(`LEFT ${leftN}`, 82, SHELF_Y - 12);
      ctx.fillText(`RIGHT ${rightN}`, W - 82, SHELF_Y - 12);
      if (leftN === 0 && rightN > 0) ctx.fillText("RIGHT STILL UP", W / 2, 184);
      else if (rightN === 0 && leftN > 0) ctx.fillText("LEFT STILL UP", W / 2, 184);
      ctx.textAlign = "left";
    }
    if (room && room.kind === "glueCorner") {
      const glued = bottles().find((b) => b.glued && !b.fallen);
      const gx = glued ? posOf(glued, nowT()).x : (W / 2 - (room.gap || 29.5));
      ctx.fillStyle = "rgba(212,164,90,0.7)";
      ctx.beginPath();
      ctx.ellipse(gx, SHELF_Y + 3, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(196,30,58,0.45)";
      ctx.beginPath();
      ctx.ellipse(gx + 6, SHELF_Y + 4, 10, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = glued && (glued.hits | 0) > 0 ? "#e8a0b8" : "#f0d09a";
      ctx.font = "8px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(glued && (glued.hits | 0) > 0 ? "ONE MORE" : "GLUE HEEL", gx, SHELF_Y - 8);
      ctx.textAlign = "left";
    }
    if (room && room.kind === "wideShoulders") {
      ctx.fillStyle = "#4a3020";
      ctx.fillRect(SHELF_L - 28, SHELF_Y, SHELF_R - SHELF_L + 56, 16);
      ctx.fillStyle = "#d4a45a";
      ctx.fillRect(SHELF_L - 28, SHELF_Y, SHELF_R - SHELF_L + 56, 3);
      ctx.strokeStyle = "rgba(232,160,184,0.7)";
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(SHELF_L - 20, SHELF_Y - 8);
      ctx.lineTo(SHELF_R + 20, SHELF_Y - 8);
      ctx.stroke();
      ctx.setLineDash([]);
      const gap = room.gap || 50;
      ctx.strokeStyle = "rgba(232,160,184,0.45)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(W / 2, SHELF_Y - 88);
      ctx.lineTo(W / 2 - 0.62 * gap, SHELF_Y - 66);
      ctx.lineTo(W / 2 - 1.24 * gap, SHELF_Y - 44);
      ctx.lineTo(W / 2 - 1.92 * gap, SHELF_Y - 8);
      ctx.moveTo(W / 2, SHELF_Y - 88);
      ctx.lineTo(W / 2 + 0.62 * gap, SHELF_Y - 66);
      ctx.lineTo(W / 2 + 1.24 * gap, SHELF_Y - 44);
      ctx.lineTo(W / 2 + 1.92 * gap, SHELF_Y - 8);
      ctx.stroke();
      ctx.fillStyle = "rgba(232,160,184,0.95)";
      ctx.font = "9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("4-WIDE BASE · 10 PINS · SQUAT", W / 2, 112);
      ctx.textAlign = "left";
    }
    if (room && room.kind === "stuckPin") {
      const dark = bottles().find((b) => b.stuck && !b.fallen);
      if (dark) {
        const dp = posOf(dark, nowT());
        ctx.fillStyle = "rgba(12,6,9,0.28)";
        ctx.beginPath();
        ctx.ellipse(dp.x, SHELF_Y + 4, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(232,160,184,0.7)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(dp.x, dp.y, 24 + Math.sin(nowT() * 0.008) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#e8a0b8";
        ctx.font = "8px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("SCOUT THE DARK PIN", dp.x, dp.y - 36);
        ctx.textAlign = "left";
      }
    }
    if (room && room.kind === "heavyHeels") {
      ctx.fillStyle = "rgba(196,30,58,0.9)";
      ctx.font = "9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("HEELS ARE CONCRETE · TOPS FLY", W / 2, 112);
      ctx.textAlign = "left";
    }
    if (room && (room.kind === "windShelf" || (room.coda && room.windDrift))) {
      const tWind = nowT();
      const gusty = windGust(tWind) > 1;
      ctx.strokeStyle = gusty ? "rgba(126,200,224,0.95)" : "rgba(126,200,224,0.4)";
      ctx.lineWidth = gusty ? 2.4 : 1.3;
      for (let i = 0; i < 6; i += 1) {
        const y = 72 + i * 36 + Math.sin(tWind * 0.004 + i) * 7;
        const x0 = 28 + ((tWind * (gusty ? 0.22 : 0.09) + i * 32) % 260);
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.quadraticCurveTo(x0 + 18, y - 8, x0 + 42, y - 4);
        ctx.stroke();
      }
      ctx.fillStyle = gusty ? "#7ec8e0" : "rgba(126,200,224,0.45)";
      ctx.beginPath();
      ctx.moveTo(W - 48, 78);
      ctx.lineTo(W - 18, 68 + Math.sin(tWind * 0.006) * (gusty ? 12 : 5));
      ctx.lineTo(W - 18, 96 + Math.sin(tWind * 0.006) * (gusty ? 12 : 5));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#d4a45a";
      ctx.fillRect(W - 50, 76, 3, 28);
      ctx.fillStyle = gusty ? "#7ec8e0" : "rgba(212,164,90,0.9)";
      ctx.font = "9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(gusty ? "GUST ON → LEAD INTO IT" : "GUST LULL · WAIT OR FIGHT", W / 2, 112);
      ctx.textAlign = "left";
    }
    if (!run || !run.done) {
      ctx.fillStyle = "rgba(240,208,154,0.72)";
      ctx.font = "9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(roomTell(room), W / 2, SHELF_Y + 22);
      ctx.textAlign = "left";
    }

    drawRoomPlate(ctx, room);

    const t = nowT();
    const list = bottles();
    list.forEach((b) => {
      if (!b.fallen) drawBottle(ctx, b, t);
    });

    ctx.strokeStyle = "rgba(240,208,154,0.35)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(40, TEE.y);
    ctx.lineTo(W - 40, TEE.y);
    ctx.stroke();
    ctx.setLineDash([]);

    if (run && run.aim) {
      const a = run.aim;
      const ang = Math.atan2(a.hy - TEE.y, a.hx - TEE.x);
      ctx.strokeStyle = "rgba(240,208,154,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TEE.x, TEE.y);
      ctx.lineTo(a.hx, a.hy);
      ctx.stroke();
      const windy = !!(run.spec && (run.spec.kind === "windShelf" || run.spec.windDrift));
      predictArc(a.power, ang).forEach((p, i, arc) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 + a.power * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = windy
          ? (i === arc.length - 1 ? "rgba(126,200,224,0.85)" : "rgba(126,200,224,0.42)")
          : (i === arc.length - 1 ? "rgba(196,30,58,0.55)" : "rgba(196,30,58,0.28)");
        ctx.fill();
      });
    }

    const ball = run && run.ball ? run.ball : { x: TEE.x, y: TEE.y, r: BALL_R };
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "#c41e3a";
    ctx.fill();
    ctx.strokeStyle = "#fff6ec";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(ball.x - 2, ball.y - 2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (run && !run.done) {
      for (let i = 0; i < 3; i += 1) {
        const on = i < run.balls;
        ctx.beginPath();
        ctx.arc(28 + i * 15, H - 14, 4.6, 0, Math.PI * 2);
        ctx.fillStyle = on ? "#c41e3a" : "rgba(196,30,58,0.2)";
        ctx.fill();
        ctx.strokeStyle = on ? "#fff6ec" : "rgba(240,208,154,0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, "LEAD");

    const standing = list.filter((b) => !b.fallen).length;
    if (run && !run.done && run.pause > 0) {
      ctx.fillStyle = "rgba(12,6,9,0.5)";
      ctx.fillRect(0, 190, W, 52);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "18px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(run.pendingNext && run.pendingNext.coda && run.pyramids === AUTHORED_COUNT
        ? "ENDLESS — concrete climbs"
        : "SPILL — next pyramid", W / 2, 224);
      ctx.textAlign = "left";
    }
    if (run && !run.done) {
      const splitNote = run.spec && run.spec.kind === "splitStack"
        ? ` · L${stackStanding(list, 0)} R${stackStanding(list, 1)}`
        : "";
      kit.drawHud(ctx, W, [
        `${hudStageLine(run.spec, run.pyramids)} · ${run.score}`,
        run.pause > 0
          ? (run.pendingNext ? `NEXT · ${run.pendingNext.name}` : "SOUVENIR")
          : `Throws ${run.balls}${run.ball ? " in flight" : ""} · ${standing} up${splitNote}`,
      ]);
    } else if (!run || !run.closedStamp) {
      kit.drawHud(ctx, W, [hudStageLine(room, 0), roomTell(room)]);
    }
  }

  function card() {
    return $("milkCard");
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
    let copy = host.querySelector("[data-pf-depth-copy]");
    if (!copy) {
      copy = document.createElement("p");
      copy.className = "vendor-vestibule-only";
      copy.dataset.pfDepthCopy = "1";
      if (tag.parentNode) tag.parentNode.insertBefore(copy, tag.nextSibling);
      else host.appendChild(copy);
    }
    copy.textContent = DEPTH_COPY.body;
    const readout = host.querySelector(".depth-readout");
    if (readout && readout.getAttribute("data-runkit-hud") === GAME_ID) {
      readout.removeAttribute("data-runkit-hud");
    }
    let rkHud = host.querySelector(".milk-rk-hud");
    if (!rkHud) {
      rkHud = document.createElement("p");
      rkHud.className = "milk-rk-hud";
      rkHud.setAttribute("aria-live", "polite");
      if (readout && readout.parentNode) readout.parentNode.insertBefore(rkHud, readout.nextSibling);
      else host.appendChild(rkHud);
    }
    rkHud.setAttribute("data-runkit-hud", GAME_ID);
    paintKitHud(run && run.spec);
    const canvas = $("milkCanvas");
    if (canvas) {
      canvas.style.pointerEvents = "auto";
      canvas.classList.toggle("is-locked", !isLive());
    }
    if ((!run || run.done) && $("milkStatus")) {
      paintVestibuleCheat(attractSpec());
    }
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
      if (run && !run.done) {
        idleRaf = 0;
        return;
      }
      if (!last) last = now;
      idleClock += Math.min(32, now - last);
      last = now;
      if (idleClock > 4200) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        idleBottles = makePyramid(idleRoom);
        paintVestibuleCheat(milkLevel(idleRoom));
      }
      draw();
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }

  function standingCount(list) {
    return list.reduce((n, b) => n + (b.fallen ? 0 : 1), 0);
  }

  function hasSupport(b, list) {
    const kin = list.filter((o) => (o.stack || 0) === (b.stack || 0));
    if (b.row === bottomRowOf(kin)) return true;
    const reach = ((run && run.spec && run.spec.gap) || 34) * 0.85;
    for (const o of kin) {
      if (o === b || o.fallen || !o.seated) continue;
      if (o.row === b.row + 1 && Math.abs(o.x - b.x) < reach && o.y > b.y - 4) return true;
    }
    return false;
  }

  function start() {
    if (run && !run.done) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      $("milkStatus").textContent = "Out of demo coins · grant a pass";
      PF.refreshNightBoard();
      return;
    }
    stopIdle();
    idleBottles = null;
    const spec = milkLevel(1);
    run = {
      done: false,
      kitRun,
      sling: mountSling(kitRun),
      t: 0,
      last: 0,
      pyramids: 0,
      knocked: 0,
      score: 0,
      balls: spec.throwsPerPyramid,
      spec,
      bottles: makePyramid(1),
      ball: null,
      aim: null,
      settle: 0,
      pause: 0,
      pendingNext: null,
      raf: 0,
      shake: 0,
      closedStamp: false,
      lastNote: "",
      throwId: 0,
    };
    $("milkStart").disabled = true;
    $("milkVerdict").hidden = true;
    kit.hideResult("milkResult");
    PF.setTier("milkTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    paintKitHud(spec);
    if (kitRun) {
      kitRun.depth = 0;
      kitRun.score = 0;
    }
    if (rk() && typeof rk().reportDepth === "function") {
      rk().reportDepth(kitRun, spec.id, { name: spec.name, coda: !!spec.coda });
    }
    $("milkStatus").textContent = `PYRAMID 1 · ${spec.name} — ${spec.barker}`;
    paintVestibuleCheat(spec);
    PF.focusCard("milkCard", true);
    PF.setAura("think");
    const loop = (now) => {
      if (!run || run.done) return;
      if (!run.last) run.last = now;
      const dt = Math.min(32, now - run.last);
      run.last = now;
      run.t += dt;
      step(dt);
      draw();
      PF.refreshDepth();
      run.raf = requestAnimationFrame(loop);
    };
    run.raf = requestAnimationFrame(loop);
  }

  function beginAim(x, y) {
    if (!isLive() || run.ball || run.pause > 0) return;
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
    if (!run || !run.aim || run.done || run.ball) {
      if (run) run.aim = null;
      return;
    }
    const pull = run.aim.power;
    if (pull < 0.12) {
      run.aim = null;
      if (run.sling && typeof run.sling.release === "function") run.sling.release();
      $("milkStatus").textContent = "Pull back — that’s the throw.";
      return;
    }
    const dx = run.aim.hx - TEE.x;
    const dy = run.aim.hy - TEE.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = throwSpeed(pull);
    const noise = 1 + (Math.random() * 0.04 - 0.02);
    const vx = (dx / dist) * speed * noise;
    const vy = (dy / dist) * speed * noise;
    if (run.sling && typeof run.sling.release === "function") run.sling.release();
    run.balls -= 1;
    run.settle = 0;
    run.throwId = (run.throwId | 0) + 1;
    run.ball = {
      x: TEE.x,
      y: TEE.y,
      r: BALL_R,
      vx,
      vy,
      life: 0,
      mass: 0.9,
      throwId: run.throwId,
    };
    run.aim = null;
    kit.sfx("throw");
    $("milkStatus").textContent = "Ball’s up — find the cream.";
  }

  function killBall() {
    run.ball = null;
    run.settle = 720;
  }

  function collideBallBottles() {
    const ball = run.ball;
    if (!ball) return;
    const list = run.bottles;
    const t = run.t;
    for (const b of list) {
      if (b.fallen) continue;
      const p = posOf(b, t);
      const hit = separate(ball.x, ball.y, ball.r, p.x, p.y, b.r);
      if (!hit) continue;
      ball.x -= hit.nx * hit.overlap * 0.55;
      ball.y -= hit.ny * hit.overlap * 0.55;
      const j = impulse(ball, b, hit.nx, hit.ny, b.heavy ? 0.64 : 0.34);
      b.spin += hit.nx * 0.12;
      const glueish = !!(b.glued || b.stuck);
      const throwId = ball.throwId || run.throwId || 0;
      if (glueish) {
        /* One softball = one hit. Glue Corner / stuck pin are a planned second shot. */
        if (j > 0.12 && b.hitThrow !== throwId) {
          b.hitThrow = throwId;
          b.hits += 1;
          b.glueFlash = 520;
        }
      } else if (j > 0.35) {
        b.hits += 1;
      }
      if (b.heavy && j > 0.4) run.shake = Math.max(run.shake || 0, 6.2);
      const did = maybeUnseat(b, list);
      if (glueish && !did) {
        run.lastNote = b.stuck ? "stuck" : "glue";
        run.shake = Math.max(run.shake || 0, 6.8);
        $("milkStatus").textContent = b.stuck
          ? ((b.hits | 0) >= (b.needHits || 2) ? "Dark pin cracked — finish it." : "DARK PIN — scouted. Second throw.")
          : ((b.hits | 0) >= (b.needHits || 2) ? "Glue cracked — one more." : "GLUED HEEL — plan the second shot.");
        PF.setAura("laugh");
      } else if (b.heavy && !did) {
        run.lastNote = "lead";
        $("milkStatus").textContent = "Lead. It barely blinked.";
        PF.setAura("laugh");
      } else if (!b.heavy && did) {
        $("milkStatus").textContent = "Cream flies — the lead hates that.";
        PF.setAura("point");
        kit.sfx("sink");
      }
      if (j > 0.4 && ball.life > 40) return;
    }
  }

  function collideBottles() {
    const list = run.bottles;
    for (let i = 0; i < list.length; i += 1) {
      const a = list[i];
      if (a.fallen) continue;
      for (let j = i + 1; j < list.length; j += 1) {
        const b = list[j];
        if (b.fallen) continue;
        if (a.seated && b.seated) continue;
        const hit = separate(a.x, a.y, a.r, b.x, b.y, b.r);
        if (!hit) continue;
        const share = a.seated || b.seated ? 1 : 0.5;
        if (!a.seated) {
          a.x -= hit.nx * hit.overlap * share;
          a.y -= hit.ny * hit.overlap * share;
        }
        if (!b.seated) {
          b.x += hit.nx * hit.overlap * share;
          b.y += hit.ny * hit.overlap * share;
        }
        const dummyA = a.seated ? { vx: 0, vy: 0, mass: 20, seated: true } : a;
        impulse(a.seated ? dummyA : a, b, hit.nx, hit.ny, 0.22);
        if (a.seated) b.vx *= 0.85;
        maybeUnseat(a, list);
        maybeUnseat(b, list);
      }
    }
  }

  function markFallen(b) {
    if (b.fallen) return;
    b.fallen = true;
    b.seated = false;
    run.knocked += 1;
    run.score += 50;
    if (run.kitRun) run.kitRun.score = run.score;
  }

  function step(dt) {
    if (run.pause > 0) {
      run.pause -= dt;
      if (run.pause <= 0) applyNextPyramid();
      return;
    }
    const k = dt / 16;
    const list = run.bottles;
    const ball = run.ball;
    if (ball) {
      if (run.sling && typeof run.sling.stepBall === "function") {
        run.sling.stepBall(ball, k);
      } else {
        ball.vy += GRAVITY * k;
        ball.x += ball.vx * k;
        ball.y += ball.vy * k;
      }
      if (run.spec.windDrift) {
        /* Same kick as predictArc — Wind Shelf ghost is the real gust. */
        ball.vx += windAccel(run.spec.windDrift, run.t, k);
      }
      ball.life += dt;
      if (ball.y < 28) {
        ball.y = 28;
        ball.vy = Math.abs(ball.vy) * 0.4;
      }
      if (ball.x < 22) {
        ball.x = 22;
        ball.vx = Math.abs(ball.vx) * 0.55;
      }
      if (ball.x > W - 22) {
        ball.x = W - 22;
        ball.vx = -Math.abs(ball.vx) * 0.55;
      }
      if (ball.y + ball.r > SHELF_Y && ball.x > SHELF_L && ball.x < SHELF_R && ball.vy > 0) {
        ball.y = SHELF_Y - ball.r;
        ball.vy *= -0.28;
        ball.vx *= 0.84;
      }
      collideBallBottles();
      if (run.spec && run.spec.kind === "splitStack" && ball.life > 90 && ball.y < SHELF_Y - 24) {
        if (Math.abs(ball.x - W / 2) < 26) {
          run.lastNote = "aisle";
          $("milkStatus").textContent = "Dead air — both boards, sugar.";
        }
      }
      const slow = Math.hypot(ball.vx, ball.vy) < 1.35 && ball.life > 380;
      const off = ball.y > H + 8 || ball.life > 1350 || (ball.y > SHELF_Y - 14 && slow);
      if (off) killBall();
    }

    for (const b of list) {
      if (b.glueFlash > 0) b.glueFlash = Math.max(0, b.glueFlash - dt);
      if (b.fallen || !b.seated) continue;
      /* Glue heel / stuck pin stay seated until the second softball. Collapsing the
       * neighbors is not a cheese skip of the two-hit plan. */
      if ((b.glued || b.stuck) && b.hits < (b.needHits || 2)) continue;
      if (!hasSupport(b, list)) {
        b.seated = false;
        b.loose = 0;
        b.vy += 0.7;
        b.vx += (b.x < W / 2 ? -0.55 : 0.55);
      }
    }
    for (const b of list) {
      if (b.fallen || b.seated) continue;
      b.loose = (b.loose || 0) + dt;
      b.vy += 0.36 * k;
      b.x += b.vx * k;
      b.y += b.vy * k;
      b.rot += b.spin * k;
      b.spin *= 0.992;
      if (b.y + b.r > SHELF_Y && b.x > SHELF_L + 4 && b.x < SHELF_R - 4 && b.y < SHELF_Y + 18) {
        b.y = SHELF_Y - b.r + 1;
        b.vy *= -0.1;
        b.vx *= 0.86;
        if (Math.abs(b.vx) < 1.2) b.vx += (b.x < W / 2 ? -1.05 : 1.05) * k;
      }
      const dropped = b.y > SHELF_Y + 10 || b.y > H - 6;
      const spun = Math.abs(b.rot) > FALL_ROT;
      if (b.x < 10 || b.x > W - 10 || dropped || spun || b.loose > 520) markFallen(b);
    }
    collideBottles();

    if (standingCount(list) === 0) {
      clearPyramid();
      return;
    }
    if (!run.ball && run.balls <= 0) {
      const inAir = list.some((b) => !b.fallen && !b.seated);
      if (inAir) return;
      run.settle -= dt;
      if (run.settle <= 0) finish("throws");
    }
  }

  function applyNextPyramid() {
    const next = run.pendingNext;
    run.pendingNext = null;
    if (!next) {
      $("milkStatus").textContent = AURA.souvenir;
      PF.setAura("celebrate");
      finish("souvenir");
      return;
    }
    run.spec = next;
    run.bottles = makePyramid(next.id);
    run.balls = next.throwsPerPyramid;
    run.ball = null;
    run.aim = null;
    run.settle = 0;
    paintKitHud(next);
    if (rk() && typeof rk().reportDepth === "function") {
      rk().reportDepth(run.kitRun, next.id, { name: next.name, coda: !!next.coda });
    }
    if (next.coda && run.pyramids === AUTHORED_COUNT) {
      $("milkStatus").textContent = AURA.coda;
    } else {
      $("milkStatus").textContent = `${hudStageLine(next, run.pyramids)} — ${next.barker || AURA.clear}`;
    }
    paintVestibuleCheat(next);
    PF.setAura("celebrate");
    PF.refreshDepth();
  }

  function clearPyramid() {
    const cleared = run.spec;
    run.pyramids += 1;
    run.score += 400 + 80 * (cleared && cleared.id ? cleared.id : run.pyramids);
    saveLiveDepth();
    if (rk() && typeof rk().reportDepth === "function") {
      const shown = milkLevel(run.pyramids + 1) || cleared;
      rk().reportDepth(run.kitRun, shown ? shown.id : run.pyramids, {
        name: shown && shown.name,
        coda: !!(shown && shown.coda),
      });
    }
    kit.sfx("rack");
    const next = milkLevel(run.pyramids + 1);
    run.pendingNext = next;
    run.pause = 780;
    run.ball = null;
    run.aim = null;
    if (!next) {
      $("milkStatus").textContent = AURA.souvenir;
    } else if (next.coda && run.pyramids === AUTHORED_COUNT) {
      $("milkStatus").textContent = AURA.coda;
    } else {
      $("milkStatus").textContent = AURA.clear;
    }
    PF.setAura("celebrate");
    PF.refreshDepth();
  }

  function auraLine(reason, pyramids) {
    if (reason === "souvenir") return AURA.souvenir;
    if (pyramids >= 6) return AURA.deep(pyramids);
    if (reason === "incomplete") return AURA.incomplete;
    if (reason === "throws") return AURA.throws;
    const kitRun = rk();
    if (kitRun && typeof kitRun.auraDeathLine === "function") {
      return `Aura: ${kitRun.auraDeathLine(GAME_ID, pyramids, reason)}`;
    }
    return AURA.throws;
  }

  function challengeLine(n) {
    const kitRun = rk();
    if (kitRun && typeof kitRun.challengeText === "function") {
      return kitRun.challengeText("Milk Bottles pyramid", n | 0, GAME_ID);
    }
    return `Beat my Milk Bottles pyramid ${n | 0} on Penny Fever`;
  }

  function revealMilkResult(deathReason) {
    if (!run) return;
    const pyramids = run.pyramids;
    const knocked = run.knocked;
    const score = run.score;
    stampDepthCopy();
    $("milkStart").disabled = false;
    $("milkStart").textContent = "TOSS AGAIN · 1 demo coin";
    PF.focusCard("milkCard", false);
    kit.setMode(card(), "result");
    paintKitHud(null);
    const roomName = (run.spec && run.spec.name) || "";
    const line = `PYRAMID ${pyramids}${roomName ? " · " + roomName : ""} · SCORE ${score}`;
    const aura = auraLine(deathReason, pyramids);
    const challenge = challengeLine(pyramids);
    $("milkVerdict").hidden = false;
    $("milkVerdict").textContent = deathReason === "souvenir"
      ? `Souvenir clear. ${line} · authored ride done.`
      : `${line} · ${deathReason} · ${aura}`;
    kit.fillResult({
      root: "milkResult",
      depth: "milkResultDepth",
      score: "milkResultScore",
      aura: "milkResultAura",
      copied: "milkCopied",
    }, {
      depthLine: `PYRAMID ${pyramids}${roomName ? " · " + roomName : ""}`,
      scoreLine: `SCORE ${score} · ${deathReason}`,
      auraLine: aura,
    });
    const ch = $("milkChallengeText");
    if (ch) ch.textContent = challenge;
    PF.setTier("milkTier", pyramids > 0 ? `PYRAMID ${pyramids}` : "LEAD WINS", pyramids > 0 ? "perfect" : "miss");
    $("milkStatus").textContent = deathReason === "souvenir"
      ? "Souvenir — authored pyramids cleared."
      : deathReason === "incomplete" ? "Stepped off the stall." : "Lead stamped the stack.";
    const ok = pyramids > 0 || knocked > 0 || deathReason === "souvenir";
    if (ok) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Milk bottles");
      PF.setAura(pyramids >= 4 ? "celebrate" : "point");
      if (deathReason !== "incomplete") PF.showBanner(true, `PYRAMID ${pyramids}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Milk bottles miss");
      PF.setAura("badLuck");
      if (deathReason !== "incomplete") PF.showBanner(false, "LEAD WINS", aura);
    }
    PF.refreshNightBoard();
    draw();
    startIdle();
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    if (run.raf) cancelAnimationFrame(run.raf);
    const deathReason = reason === "souvenir" ? "souvenir"
      : reason === "incomplete" ? "incomplete" : "throws";
    run.closedStamp = deathReason === "throws";
    if (run.closedStamp) kit.sfx("stamp");
    persistDepth({
      depth: run.pyramids,
      score: run.score,
      deathReason,
      cashedOut: deathReason === "souvenir",
      meta: {
        knocked: run.knocked,
        stage: run.spec && run.spec.id,
        room: run.spec && run.spec.name,
        kind: run.spec && run.spec.kind,
        coda: !!(run.spec && run.spec.coda),
        lastNote: run.lastNote || "",
      },
    });
    draw();
    if (run.closedStamp) {
      setTimeout(() => revealMilkResult(deathReason), STAMP_MS);
    } else {
      revealMilkResult(deathReason);
    }
  }

  PF.registerVendor({
    id: "milk-bottles",
    playKey: "milk",
    chalk: "Bottom row doesn’t dance. That’s lead.",
    defaults: { bestMilkPyramids: 0, bestMilkScore: 0 },
    onLeave() {
      if (run && !run.done) finish("incomplete");
      stopIdle();
    },
    onShow() { stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      if ($("milkVerdict")) $("milkVerdict").hidden = true;
      kit.hideResult("milkResult");
      if ($("milkStart")) {
        $("milkStart").disabled = false;
        $("milkStart").textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      stampDepthCopy();
      startIdle();
    },
    refreshDepth(state) {
      const now = $("depthMilkNow");
      if (now) now.textContent = run && !run.done ? String(run.pyramids) : "0";
      const best = $("depthMilkBest");
      const bestN = Math.max(state.bestMilkPyramids || 0, (state.bestDepth && state.bestDepth.milk) || 0);
      if (best) best.textContent = bestN ? String(bestN) : "—";
      const sc = $("depthMilkScore");
      if (sc) sc.textContent = run && !run.done ? String(run.score) : "0";
      const bs = $("depthMilkBestScore");
      if (bs) bs.textContent = state.bestMilkScore ? String(state.bestMilkScore) : "—";
    },
    bind() {
      declareP0();
      const startBtn = $("milkStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = $("milkCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            punchStart();
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
      const copyBtn = $("milkChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const state = PF.getState();
          const last = state.lastRun || {};
          const keyed = last[GAME_ID];
          const n = keyed && keyed.depth != null
            ? keyed.depth
            : (last.game === GAME_ID || last.gameId === GAME_ID)
              ? last.depth
              : (state.bestMilkPyramids || (state.bestDepth && state.bestDepth.milk) || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const el = $("milkCopied");
            if (el) {
              el.hidden = false;
              el.textContent = "Copied — send it";
            }
            $("milkStatus").textContent = "Copied — send it";
          }, () => {
            $("milkStatus").textContent = text;
          });
        });
      }
      stampDepthCopy();
      draw();
    },
  });
})();
