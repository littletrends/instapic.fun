/* Barely-Fit Ball Toss — Desktop Grok owns this file. PF only. Never booth/port 6000.
 * GOBLIN HIT #3 FEEL 2026-09-05 — B1–B6 authored RACK rooms, not a thinner-hole climb.
 * Oval = racetrack stadium + painted corridor. Sway = X translate. Spin = ±12° turntable spoke.
 * Cluster fist ≠ honest triangle. Dent looks honest until the plywood flash. Keyhole is a slot verb.
 * SlingAim · depthUnit: Rack · codaEnabled hybrid ENDLESS after Warp Keyhole (Aura-flippable). */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;
  const W = 340;
  const H = 440;
  const BALL_R = 7.8;
  const TEE = { x: W / 2, y: H - 28 };
  const GRAVITY = 0.165;
  const SINK_BASE = 3.45;
  const GAME_ID = "balltoss";
  const CODA_ENABLED = true;
  const AUTHORED_COUNT = 8;
  let run = null;
  let idleRaf = 0;
  let idleRoom = 1;
  let idleClock = 0;
  let idlePack = null;

  const AURA = {
    oval: "Aura: That oval ate you.",
    spit: "Aura: Too hot on the throw — board spat you out.",
    decoy: "Aura: That dent isn’t a hole.",
    keyhole: "Aura: The keyhole wanted a needle, not a prayer.",
    closed: "Aura: Three misses. That oval ate you.",
    shallow: "Aura: Three misses. That oval ate you.",
    misses: "Aura: Three misses. That oval ate you.",
    mid: "Aura: Cute racks. The oval’s still hungry.",
    deep: "Aura: Barely-fit and you still threaded it. Dangerous.",
    souvenir: "Aura: Warp Keyhole survived. Souvenir — the plywood tipped its hat.",
    coda: "Aura: Authored racks done. ENDLESS — the dent still lies.",
    leave: "Aura: Walking off mid-rack? Coward’s stamp.",
  };

  const P0_MOUNT = {
    engine: "SlingAim",
    displayName: "Barely-Fit Ball Toss",
    depthUnit: "Rack",
    sheet: "GOBLIN_BATCH01_BUILD_SHEETS.md",
    authoredSheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  /* Authored RACK rooms — unique plywood / hole verb. Not “same three holes, tinier.”
   * Rack 2 is the one allowed fit-bridge (scale + spit). Everything after changes shape, motion, or lie. */
  const AUTHORED_RACKS = [
    { id: 1, name: "Three Honest Circles", kind: "triangle", holeScale: 1, spitSpeed: 1.15, sway: 0, rotate: 0, rotateAmp: 0, spd: 0, clusterRims: false, barker: "Three honest circles. Sink speed matters." },
    { id: 2, name: "Barely Fit Tri", kind: "triangle", holeScale: 0.9, spitSpeed: 1.38, sway: 0, rotate: 0, rotateAmp: 0, spd: 0, clusterRims: false, barker: "Same three. Barely fit. Don’t throw hot." },
    { id: 3, name: "Sway Board", kind: "diamond", holeScale: 1, spitSpeed: 1.15, sway: 6.4, rotate: 0, rotateAmp: 0, spd: 0.00048, clusterRims: false, barker: "Diamond slides sideways. Time the throw — it does not spin." },
    { id: 4, name: "Oval Liar", kind: "ovalLiar", holeScale: 1, spitSpeed: 1.15, sway: 0, rotate: 0, rotateAmp: 0, spd: 0, clusterRims: false, barker: "Three rounds. One racetrack oval. Only the painted corridor sinks." },
    { id: 5, name: "Crowded Five", kind: "cluster", holeScale: 1, spitSpeed: 1.18, sway: 0, rotate: 0, rotateAmp: 0, spd: 0, clusterRims: true, barker: "Fist of five. Edges are dead plywood." },
    { id: 6, name: "Spin Rack", kind: "spinFive", holeScale: 0.76, spitSpeed: 1.15, sway: 0, rotate: 1, rotateAmp: 12 * Math.PI / 180, spd: 0.00042, clusterRims: false, barker: "Turntable rocks ±12°. Lead the spoke — not a faster sway." },
    { id: 7, name: "Decoy Dent Alley", kind: "decoyFive", holeScale: 1, spitSpeed: 1.15, sway: 0, rotate: 0, rotateAmp: 0, spd: 0, decoyDent: true, clusterRims: false, barker: "Five real. One juicy center. The center isn’t a hole." },
    { id: 8, name: "Warp Keyhole", kind: "warpKeyhole", holeScale: 1, spitSpeed: 1.12, sway: 0.55, rotate: 0.55, rotateAmp: 0.09, spd: 0.00055, clusterRims: false, barker: "Round, racetrack oval, keyhole slot, tiny. Four aim verbs." },
  ];
  const BALLTOSS_LEVELS = AUTHORED_RACKS;

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored RACKS · ENDLESS coda · not a one-tap prize",
    body: "Authored rooms, not a thinner loop: Honest Circles → Barely Fit → Sway Board → Oval Liar → Crowded Five → Spin Rack → Decoy Dent → Warp Keyhole. After 8, ENDLESS coda (flaggable). Three misses stamps CLOSED.",
    status: "Depth run · START · 1 demo coin · 8 authored RACKS then ENDLESS",
    machine: "Midway toss · 1 demo coin · authored RACKS",
    idleHud: ["Authored RACKS — holes that barely fit", "Drag-aim · 3 misses a room · START"],
    punch: "Depth run — press START. No one-tap prize.",
  };

  function rk() {
    return PF.runKit || null;
  }

  function codaOn() {
    const kitRun = rk();
    const row = kitRun && ((kitRun.declared && kitRun.declared[GAME_ID]) || (kitRun.p0 && kitRun.p0[GAME_ID]));
    if (row && typeof row.codaEnabled === "boolean") return !!row.codaEnabled;
    return !!P0_MOUNT.codaEnabled;
  }

  function codaRack(n) {
    const t = Math.max(0, n - AUTHORED_COUNT - 1);
    return {
      id: n,
      name: `Warp Coda ${n}`,
      kind: "codaFive",
      holeScale: Math.max(0.55, 0.72 - t * 0.02),
      spitSpeed: 1.24,
      sway: 1,
      rotate: 1,
      rotateAmp: 0.14,
      spd: 0.0016,
      decoyDent: n % 2 === 1,
      oval: true,
      coda: true,
      barker: "ENDLESS — sway, spin, and the dent still lies.",
    };
  }

  function balltossStage(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) {
      const row = AUTHORED_RACKS[stage - 1];
      return Object.assign({
        holes: row.kind === "triangle" ? 3 : row.kind === "diamond" || row.kind === "ovalLiar" ? 4 : 5,
        missesToDeath: 3,
        coda: false,
      }, row);
    }
    if (!codaOn()) return null;
    return Object.assign({ holes: 5, missesToDeath: 3 }, codaRack(stage));
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    const spec = Object.assign({
      authored: AUTHORED_RACKS,
      authoredCount: AUTHORED_COUNT,
      codaEnabled: CODA_ENABLED,
      codaParams: codaRack,
      level: balltossStage,
      stageParams: balltossStage,
      BALLTOSS_LEVELS,
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

  function mountEngine(ctx) {
    const sling = rk() && rk().engines && rk().engines.SlingAim;
    if (!sling || typeof sling.mount !== "function" || !ctx) return null;
    try {
      return sling.mount(card(), {
        gravity: GRAVITY,
        missesToDeath: 99,
        spitSpeed: 1.15,
        stageParams: balltossStage,
        onThrow() {},
        hitTest() { return false; },
      }, ctx);
    } catch (_) {
      return null;
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

  function isLive() {
    return !!(run && !run.done && run.kitRun && run.kitRun.alive !== false);
  }

  function punchStart() {
    stampDepthCopy();
    const el = $("ballTossStatus");
    if (el) el.textContent = DEPTH_COPY.punch;
    const btn = $("ballTossStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "miss",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestBallToss = Math.max(state.bestBallToss || 0, payload.depth);
      state.bestBallTossScore = Math.max(state.bestBallTossScore || 0, payload.score);
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function challengeLine(n) {
    return `Beat my Ball Toss rack ${n | 0} on Penny Fever`;
  }

  function hudRack(spec) {
    if (!spec) return "RACK";
    if (spec.coda) return `ENDLESS · RACK ${spec.stage} · ${spec.name}`;
    return `RACK ${spec.stage} · ${spec.name}`;
  }

  function paintKitHud(spec) {
    const host = card();
    if (!host) return;
    const hud = host.querySelector(".balltoss-rk-hud");
    if (!hud) return;
    if (!spec || !run || run.done) {
      hud.textContent = "";
      return;
    }
    hud.textContent = hudRack(spec);
  }

  function roomTell(spec) {
    if (!spec) return "HOLES THAT BARELY FIT";
    if (spec.kind === "triangle" && spec.scale < 0.96) return "BARELY FIT · DON’T THROW HOT";
    if (spec.kind === "triangle") return "THREE HONEST CIRCLES";
    if (spec.kind === "diamond") return "BOARD SWAYS — TIME THE THROW";
    if (spec.kind === "ovalLiar") return "OVAL WANTS THE CORRIDOR";
    if (spec.kind === "cluster") return "TIGHT CLUSTER · EDGES ARE DEAD";
    if (spec.kind === "spinFive") return "RACK TURNS ±12° · LEAD IT";
    if (spec.kind === "decoyFive") return "ONE DENT IS NOT A HOLE";
    if (spec.kind === "warpKeyhole") return "KEYHOLE · OVAL · TINY";
    if (spec.coda) return "ENDLESS · SWAY + SPIN + DENT";
    return "HOLES THAT BARELY FIT";
  }

  function stageSpec(n) {
    const stage = Math.max(1, n | 0);
    const p = balltossStage(stage);
    if (!p) return null;
    return {
      stage,
      id: p.id || stage,
      name: p.name,
      title: p.name,
      kind: p.kind,
      holes: p.holes,
      scale: Math.max(0.55, p.holeScale != null ? p.holeScale : 1),
      sway: p.sway || 0,
      rotate: p.rotate || 0,
      rotateAmp: p.rotateAmp || 0,
      oval: !!p.oval,
      decoy: p.decoyDent ? 1 : 0,
      spd: p.spd || 0,
      spitSpeed: p.spitSpeed,
      missesToDeath: p.missesToDeath || 3,
      clusterRims: !!p.clusterRims || p.kind === "cluster",
      coda: !!p.coda,
      barker: p.barker || "",
    };
  }

  function hole(lx, ly, rx, ry, extra) {
    return Object.assign({
      lx,
      ly,
      rx,
      ry,
      rot: 0,
      oval: false,
      keyhole: false,
      decoy: false,
      tiny: false,
      shape: "round",
      hit: false,
      spitFlash: 0,
      lock: 0,
    }, extra || {});
  }

  function boardPoly(spec) {
    const kind = spec && spec.kind;
    /* Each room is a different piece of plywood — not the same rectangle with tinier holes. */
    if (kind === "diamond") return [[170, 64], [330, 178], [170, 332], [10, 178]];
    if (kind === "ovalLiar") return [[18, 88], [322, 52], [328, 268], [12, 318]];
    if (kind === "cluster") return [[142, 68], [198, 68], [206, 262], [134, 262]];
    if (kind === "spinFive") return "ellipse";
    if (kind === "decoyFive") return [[18, 64], [322, 64], [334, 340], [10, 340]];
    if (kind === "warpKeyhole") return [[12, 64], [250, 70], [336, 196], [280, 344], [28, 338], [4, 168]];
    if (kind === "codaFive") return [[22, 48], [318, 40], [332, 300], [18, 318]];
    return [[36, 58], [304, 48], [318, 306], [22, 318]];
  }

  function pointInPoly(px, py, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
      const xi = poly[i][0];
      const yi = poly[i][1];
      const xj = poly[j][0];
      const yj = poly[j][1];
      const hit = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / ((yj - yi) || 1e-6) + xi);
      if (hit) inside = !inside;
    }
    return inside;
  }

  function layoutHoles(spec) {
    const r = 13.1 * spec.scale;
    const kind = spec.kind;
    /* Rack 1–2: same three honest circles. Rack 2 is the allowed fit-bridge (scale + spit). */
    if (kind === "triangle") {
      return [
        hole(170, 104, r, r * 0.92),
        hole(108, 198, r, r * 0.92),
        hole(232, 198, r, r * 0.92),
      ];
    }
    /* Rack 3: diamond plywood + sway. Side holes sweep across the throw lane — timing, not tinier. */
    if (kind === "diamond") {
      return [
        hole(170, 74, r, r * 0.92),
        hole(52, 178, r, r * 0.92),
        hole(288, 178, r, r * 0.92),
        hole(170, 312, r, r * 0.92),
      ];
    }
    /* Rack 4: oval is the STAR — a racetrack stadium, not a round hole and not a squashed circle. Three honest circles stay round. Only the painted corridor sinks. */
    if (kind === "ovalLiar") {
      const rr = r * 0.94;
      return [
        hole(36, 72, rr, rr),
        hole(304, 64, rr, rr),
        hole(42, 298, rr, rr),
        hole(176, 176, r * 4.4, r * 0.98, { oval: true, shape: "oval", rot: -0.18 }),
      ];
    }
    /* Rack 5: five holes packed in a fist. Board is a skinny column; edges of the stall are dead wood. */
    if (kind === "cluster") {
      const cx = 170;
      const cy = 164;
      const rad = 20;
      const holes = [];
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
        holes.push(hole(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.9, r * 0.7, r * 0.62));
      }
      return holes;
    }
    /* Rack 6: five holes on a round turntable rim. Rotate ±12° is the verb, not tinier holes. */
    if (kind === "spinFive") {
      const cx = 170;
      const cy = 180;
      const rad = 92;
      const holes = [];
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
        holes.push(hole(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.82, r, r * 0.9));
      }
      return holes;
    }
    /* Rack 7: five real at the rails + one juicy center dent that LOOKS like the easy hole until it flashes plywood. */
    if (kind === "decoyFive") {
      return [
        hole(48, 88, r, r * 0.9),
        hole(170, 78, r, r * 0.9),
        hole(292, 88, r, r * 0.9),
        hole(56, 300, r, r * 0.9),
        hole(284, 300, r, r * 0.9),
        hole(170, 178, r * 1.55, r * 1.4, { decoy: true, shape: "decoy", rot: 0 }),
      ];
    }
    /* Rack 8: mixed verbs — 2 round, 1 racetrack oval, 1 tall thin keyhole, 1 tiny. Four different aims. */
    if (kind === "warpKeyhole") {
      return [
        hole(38, 122, r, r * 0.92),
        hole(302, 132, r, r * 0.92),
        hole(176, 86, r * 2.6, r * 0.86, { oval: true, shape: "oval", rot: -0.16 }),
        hole(86, 272, r * 0.46, r * 2.55, { keyhole: true, shape: "keyhole" }),
        hole(282, 292, r * 0.34, r * 0.3, { tiny: true, shape: "tiny" }),
      ];
    }
    const holes = [];
    const cx = 170;
    const cy = 158;
    const rad = 78;
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const oval = spec.oval && i === 1;
      holes.push(hole(
        cx + Math.cos(a) * rad,
        cy + Math.sin(a) * rad * 0.76,
        oval ? r * 1.55 : r,
        oval ? r * 0.44 : r * 0.9,
        oval ? { oval: true, shape: "oval", rot: -0.18 } : {}
      ));
    }
    if (spec.decoy) {
      holes.push(hole(170, 158, r * 0.96, r * 0.88, { decoy: true, shape: "decoy", rot: 0.12 }));
    }
    return holes;
  }

  function makeHoles(stage) {
    const spec = stageSpec(stage);
    if (!spec) return null;
    return { spec, holes: layoutHoles(spec) };
  }

  function boardXform(t, spec) {
    /* Sway = pure X translate. Spin = pure rotation. Never both on the authored motion rooms. */
    const kind = spec && spec.kind;
    const swayAmt = kind === "spinFive" ? 0 : (spec.sway ? Math.sin(t * (spec.spd || 0.0012)) * (18 * spec.sway) : 0);
    const amp = spec.rotateAmp || 0;
    const rot = kind === "diamond" ? 0 : (spec.rotate ? Math.sin(t * (spec.spd || 0.0012) * (kind === "spinFive" ? 1 : 0.85) + 0.4) * amp : 0);
    const cy = spec && (kind === "spinFive" || kind === "codaFive") ? 180 : 168;
    return { sway: swayAmt, rot, cx: 170, cy };
  }

  function holePos(h, t, spec) {
    const xf = boardXform(t, spec);
    const dx = h.lx - xf.cx;
    const dy = h.ly - xf.cy;
    const c = Math.cos(xf.rot);
    const s = Math.sin(xf.rot);
    return {
      x: xf.cx + dx * c - dy * s + xf.sway,
      y: xf.cy + dx * s + dy * c,
      rot: h.rot + xf.rot,
    };
  }

  function inEllipse(px, py, cx, cy, rx, ry, rot) {
    const dx = px - cx;
    const dy = py - cy;
    const c = Math.cos(-rot);
    const s = Math.sin(-rot);
    const lx = dx * c - dy * s;
    const ly = dx * s + dy * c;
    const nx = lx / Math.max(0.001, rx);
    const ny = ly / Math.max(0.001, ry);
    return nx * nx + ny * ny <= 1;
  }

  function ovalLocal(px, py, cx, cy, rot) {
    const dx = px - cx;
    const dy = py - cy;
    const c = Math.cos(-rot);
    const s = Math.sin(-rot);
    return { lx: dx * c - dy * s, ly: dx * s + dy * c };
  }

  /* Stadium / capsule along local X — reads as an oval, not a squashed circle. */
  function inStadium(px, py, cx, cy, rx, ry, rot) {
    const loc = ovalLocal(px, py, cx, cy, rot);
    const cr = Math.min(ry, rx * 0.48);
    const mid = Math.max(0, rx - cr);
    if (Math.abs(loc.lx) <= mid) return Math.abs(loc.ly) <= ry;
    const ex = Math.abs(loc.lx) - mid;
    return ex * ex + loc.ly * loc.ly <= cr * cr;
  }

  function ovalCenterLine(h, p, ball) {
    const loc = ovalLocal(ball.x, ball.y, p.x, p.y, p.rot);
    /* Fat oval is the lie. Only the painted long-axis corridor sinks. Off-axis is plywood. */
    const axis = Math.max(3.2, Math.min(h.ry * 0.34, BALL_R * 0.78));
    return Math.abs(loc.ly) <= axis && Math.abs(loc.lx) <= h.rx * 0.92;
  }

  function traceStadium(ctx, rx, ry) {
    const cr = Math.min(ry, rx * 0.48);
    const mid = Math.max(0, rx - cr);
    ctx.beginPath();
    if (mid < 1.5) {
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      return;
    }
    ctx.moveTo(-mid, -ry);
    ctx.lineTo(mid, -ry);
    ctx.arc(mid, 0, cr, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-mid, ry);
    ctx.arc(-mid, 0, cr, Math.PI / 2, 3 * Math.PI / 2);
    ctx.closePath();
  }

  function keyholeLocal(px, py, h, p) {
    const dx = px - p.x;
    const dy = py - p.y;
    const c = Math.cos(-p.rot);
    const s = Math.sin(-p.rot);
    return { lx: dx * c - dy * s, ly: dx * s + dy * c };
  }

  function inKeyhole(px, py, h, p) {
    const loc = keyholeLocal(px, py, h, p);
    const headR = Math.max(6.6, h.rx * 1.55);
    const headY = -h.ry * 0.52;
    const inHead = Math.hypot(loc.lx, loc.ly - headY) <= headR;
    const slotW = h.rx * 0.82;
    const slotTop = headY + headR * 0.28;
    const inSlot = Math.abs(loc.lx) <= slotW && loc.ly >= slotTop && loc.ly <= h.ry * 0.98;
    return inHead || inSlot;
  }

  function keyholeThread(h, p, ball) {
    const loc = keyholeLocal(ball.x, ball.y, h, p);
    return Math.abs(loc.lx) <= Math.max(4.2, h.rx * 0.9);
  }

  function worldToBoard(x, y, t, spec) {
    const xf = boardXform(t, spec);
    const dx = x - xf.cx - xf.sway;
    const dy = y - xf.cy;
    const c = Math.cos(-xf.rot);
    const s = Math.sin(-xf.rot);
    return { x: xf.cx + dx * c - dy * s, y: xf.cy + dx * s + dy * c };
  }

  function inBoard(x, y, t, spec) {
    const local = spec ? worldToBoard(x, y, t || 0, spec) : { x, y };
    const poly = boardPoly(spec);
    if (poly === "ellipse") {
      const nx = (local.x - 170) / 128;
      const ny = (local.y - 180) / 108;
      return nx * nx + ny * ny <= 1;
    }
    return pointInPoly(local.x, local.y, poly);
  }

  function inDeadPlywood(x, y, t, spec) {
    if (!spec || spec.kind !== "cluster") return false;
    const local = worldToBoard(x, y, t || 0, spec);
    /* Skinny live column. Everything left/right of the cluster board is bounce-only plywood. */
    return (local.x < 142 || local.x > 198) && local.y > 64 && local.y < 270;
  }

  function attractSpec() {
    return stageSpec(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function attractPack() {
    if (!idlePack) idlePack = makeHoles(attractSpec().stage);
    return idlePack;
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
      if (idleClock > 3800) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        idlePack = makeHoles(idleRoom);
      }
      draw();
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }

  function realHoles(holes) {
    return holes.filter((h) => !h.decoy);
  }

  function auraLine(reason, racks, lastNote) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "coda" || (run && run.spec && run.spec.coda && racks >= AUTHORED_COUNT)) return AURA.coda;
    if (lastNote === "oval") return AURA.oval;
    if (lastNote === "keyhole") return AURA.keyhole;
    if (lastNote === "decoy") return AURA.decoy;
    if (lastNote === "spit") return AURA.spit;
    if (racks <= 0) return AURA.shallow;
    if (racks >= 7) return AURA.deep;
    if (racks >= 3) return AURA.mid;
    return AURA.closed;
  }

  function card() {
    return $("ballTossCard");
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
    let rkHud = host.querySelector(".balltoss-rk-hud");
    if (!rkHud) {
      rkHud = document.createElement("p");
      rkHud.className = "balltoss-rk-hud";
      rkHud.setAttribute("aria-live", "polite");
      if (readout && readout.parentNode) readout.parentNode.insertBefore(rkHud, readout.nextSibling);
      else host.appendChild(rkHud);
    }
    rkHud.setAttribute("data-runkit-hud", GAME_ID);
    paintKitHud(run && run.spec);
    const canvas = $("ballTossCanvas");
    if (canvas) {
      canvas.style.pointerEvents = "auto";
      canvas.classList.toggle("is-locked", !isLive());
    }
    if ((!run || run.done) && host.classList.contains("is-vestibule") && $("ballTossStatus")) {
      $("ballTossStatus").textContent = DEPTH_COPY.status;
    }
  }

  function beginKitRun() {
    if (typeof PF.spendDemoCoin === "function") {
      if (!PF.spendDemoCoin(GAME_ID)) return null;
    }
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      try {
        const ctx = PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1, feverNode: true });
        if (ctx) return ctx;
      } catch (_) { /* fall through to local ctx */ }
    }
    return {
      gameId: GAME_ID,
      startedAt: Date.now(),
      feverNode: true,
      feverGate: null,
      depth: 0,
      score: 0,
      strikes: 0,
      alive: true,
    };
  }

  function throwSpeed(power) {
    return 6.15 + power * 8.85;
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

  function draw() {
    const canvas = $("ballTossCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (run) run.shake = kit.applyShake(ctx, run.shake || 0);

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#2a1420");
    g.addColorStop(1, "#12080c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const t = run ? run.t : (idleClock || 0);
    const pack = run ? { spec: run.spec, holes: run.holes } : attractPack();
    const xf = boardXform(t, pack.spec);
    ctx.save();
    ctx.translate(xf.cx + xf.sway, xf.cy);
    ctx.rotate(xf.rot);
    ctx.translate(-xf.cx, -xf.cy);

    ctx.save();
    ctx.beginPath();
    const poly = boardPoly(pack.spec);
    if (poly === "ellipse") {
      ctx.ellipse(170, 180, 128, 108, 0, 0, Math.PI * 2);
    } else {
      ctx.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i][0], poly[i][1]);
      ctx.closePath();
    }
    ctx.clip();
    kit.fillWood(ctx, 8, 36, 324, 310);
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.fillRect(8, 36, 324, 310);
    if (pack.spec.kind === "cluster") {
      ctx.fillStyle = "rgba(12,6,8,0.72)";
      ctx.fillRect(8, 36, 134, 310);
      ctx.fillRect(198, 36, 134, 310);
      ctx.fillStyle = "rgba(240,208,154,0.75)";
      ctx.font = "9px Georgia, serif";
      ctx.save();
      ctx.translate(96, 220);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("DEAD PLYWOOD", 0, 0);
      ctx.restore();
      ctx.save();
      ctx.translate(250, 108);
      ctx.rotate(Math.PI / 2);
      ctx.fillText("DEAD PLYWOOD", 0, 0);
      ctx.restore();
    }
    if (pack.spec.kind === "spinFive" || pack.spec.kind === "codaFive") {
      ctx.strokeStyle = "rgba(240,208,154,0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(170, 180, 108, 92, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(170, 180, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(212,164,90,0.55)";
      ctx.fill();
      ctx.strokeStyle = "#e8a0b8";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(170, 180);
      ctx.lineTo(170, 88);
      ctx.stroke();
      ctx.fillStyle = "#e8a0b8";
      ctx.beginPath();
      ctx.moveTo(164, 96);
      ctx.lineTo(170, 82);
      ctx.lineTo(176, 96);
      ctx.fill();
      ctx.fillStyle = "#f0d09a";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("SPIN ±12° · LEAD THE SPOKE", 108, 184);
    }
    if (pack.spec.kind === "diamond" || (pack.spec.sway && pack.spec.kind !== "warpKeyhole" && !pack.spec.coda)) {
      ctx.strokeStyle = "rgba(232,160,184,0.7)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(36, 176);
      ctx.lineTo(304, 176);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(232,160,184,0.9)";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("SWAY — TIME IT", 128, 168);
    }
    if (pack.spec.kind === "ovalLiar") {
      const liar = pack.holes.find((h) => h.oval);
      if (liar) {
        const c = Math.cos(liar.rot);
        const s = Math.sin(liar.rot);
        const ax = liar.rx * 0.92;
        ctx.strokeStyle = "rgba(232,160,184,0.7)";
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(liar.lx - c * ax, liar.ly - s * ax);
        ctx.lineTo(liar.lx + c * ax, liar.ly + s * ax);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("OVAL · CORRIDOR OR PLYWOOD", 96, 70);
    }
    if (pack.spec.kind === "decoyFive") {
      const dent = pack.holes.find((h) => h.decoy);
      if (dent && (dent.exposed || dent.spitFlash > 0)) {
        ctx.fillStyle = "rgba(196,30,58,0.22)";
        ctx.beginPath();
        ctx.ellipse(dent.lx, dent.ly, dent.rx + 10, dent.ry + 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(232,160,184,0.95)";
        ctx.font = "10px Georgia, serif";
        ctx.fillText("PLYWOOD LIE — NOT A HOLE", 96, 214);
      }
    }
    ctx.restore();

    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (poly === "ellipse") {
      ctx.ellipse(170, 180, 128, 108, 0, 0, Math.PI * 2);
    } else {
      ctx.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i][0], poly[i][1]);
      ctx.closePath();
    }
    ctx.stroke();

    pack.holes.forEach((h) => {
      ctx.save();
      ctx.translate(h.lx, h.ly);
      ctx.rotate(h.rot);
      const fill = h.hit ? "rgba(61,138,138,0.85)" : h.spitFlash > 0 ? "rgba(196,30,58,0.55)" : "#0a0508";
      if (h.keyhole) {
        const headR = Math.max(6.6, h.rx * 1.55);
        const headY = -h.ry * 0.52;
        const slotW = h.rx * 0.82;
        ctx.beginPath();
        ctx.arc(0, headY, headR, Math.PI * 0.82, Math.PI * 2 - Math.PI * 0.82);
        ctx.lineTo(slotW, h.ry * 0.98);
        ctx.lineTo(-slotW, h.ry * 0.98);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = h.hit ? "#b8e8e0" : "#b8e8e0";
        ctx.lineWidth = 2.2;
        ctx.stroke();
      } else {
        if (h.oval) traceStadium(ctx, h.rx, h.ry);
        else {
          ctx.beginPath();
          ctx.ellipse(0, 0, h.rx, h.ry, 0, 0, Math.PI * 2);
        }
        if (h.decoy) {
          const shown = h.exposed || h.spitFlash > 0;
          if (!shown) {
            ctx.fillStyle = "#0a0508";
            ctx.fill();
            ctx.strokeStyle = "#f0d09a";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            ctx.fillStyle = "rgba(74,46,28,0.92)";
            ctx.fill();
            ctx.strokeStyle = "#c41e3a";
            ctx.lineWidth = 2.6;
            ctx.stroke();
            ctx.strokeStyle = "rgba(196,30,58,0.85)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-h.rx * 0.55, -h.ry * 0.2);
            ctx.lineTo(h.rx * 0.55, h.ry * 0.25);
            ctx.moveTo(-h.rx * 0.4, h.ry * 0.35);
            ctx.lineTo(h.rx * 0.5, -h.ry * 0.3);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = fill;
          ctx.fill();
          ctx.strokeStyle = h.hit ? "#b8e8e0" : h.oval ? "#e8a0b8" : h.tiny ? "#d4a45a" : "#f0d09a";
          ctx.lineWidth = h.oval ? 2.6 : 1.5;
          ctx.stroke();
          if (h.oval) {
            const axis = Math.max(3.2, Math.min(h.ry * 0.34, BALL_R * 0.78));
            ctx.strokeStyle = "rgba(232,160,184,0.95)";
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(-h.rx * 0.92, 0);
            ctx.lineTo(h.rx * 0.92, 0);
            ctx.stroke();
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.moveTo(-h.rx * 0.86, -axis);
            ctx.lineTo(h.rx * 0.86, -axis);
            ctx.moveTo(-h.rx * 0.86, axis);
            ctx.lineTo(h.rx * 0.86, axis);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
      ctx.fillStyle = h.decoy ? "#e8a0b8" : h.keyhole ? "#b8e8e0" : h.oval ? "#e8a0b8" : h.tiny ? "#d4a45a" : "rgba(240,208,154,0.0)";
      ctx.font = "8px Georgia, serif";
      ctx.textAlign = "center";
      if (h.decoy && (h.exposed || h.spitFlash > 0)) ctx.fillText("DENT", 0, h.ry + 11);
      else if (h.keyhole) ctx.fillText("KEY", 0, h.ry + 12);
      else if (h.oval) ctx.fillText("OVAL", 0, h.ry + 12);
      else if (h.tiny) ctx.fillText("TINY", 0, h.ry + 11);
      ctx.textAlign = "left";
      ctx.restore();
    });
    ctx.restore();

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
      const arc = predictArc(a.power, ang);
      arc.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 + a.power * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = i === arc.length - 1 ? "rgba(196,30,58,0.55)" : "rgba(196,30,58,0.28)";
        ctx.fill();
      });
    }

    const ball = run && run.ball ? run.ball : { x: TEE.x, y: TEE.y, r: BALL_R };
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "#c41e3a";
    ctx.fill();
    ctx.strokeStyle = "#fff6ec";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ball.x - 2, ball.y - 2, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,246,236,0.55)";
    ctx.fill();

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, "CLOSED");

    if (run && !run.done) {
      const left = realHoles(run.holes).filter((h) => !h.hit).length;
      const combo = run.combo > 1.01 ? ` · combo ×${run.combo.toFixed(1)}` : "";
      ctx.fillStyle = "rgba(12,6,9,0.72)";
      ctx.fillRect(8, 8, W - 16, 48);
      ctx.strokeStyle = "rgba(212,164,90,0.55)";
      ctx.strokeRect(8.5, 8.5, W - 17, 47);
      ctx.fillStyle = "#ffe6a6";
      ctx.font = "bold 15px Georgia, serif";
      ctx.fillText(hudRack(run.spec), 16, 28);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "11px Georgia, serif";
      ctx.fillText(`${roomTell(run.spec)} · ${left} left · ${run.score}${combo}`, 16, 44);
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(W - 28 - i * 16, 26, 5, 0, Math.PI * 2);
        ctx.fillStyle = i < run.misses ? "#c41e3a" : "rgba(240,208,154,0.22)";
        ctx.fill();
        ctx.strokeStyle = "#f0d09a";
        ctx.stroke();
      }
    } else if (!run || !run.closedStamp) {
      kit.drawHud(ctx, W, DEPTH_COPY.idleHud);
    }
  }

  function qaStartAt() {
    const kitRun = rk();
    const n = kitRun && kitRun._qaStart && (kitRun._qaStart[GAME_ID] | 0);
    if (kitRun && kitRun._qaStart) kitRun._qaStart[GAME_ID] = 0;
    return n >= 1 ? n : 1;
  }

  function start() {
    if (run && !run.done) return;
    stopIdle();
    declareP0();
    const kitRun = beginKitRun();
    if (!kitRun) {
      $("ballTossStatus").textContent = "Out of demo coins · grant a pass";
      PF.refreshNightBoard();
      stampDepthCopy();
      startIdle();
      return;
    }
    const pack = makeHoles(qaStartAt());
    if (!pack) {
      stampDepthCopy();
      startIdle();
      return;
    }
    run = {
      done: false,
      kitRun,
      engine: mountEngine(kitRun),
      t: 0,
      last: 0,
      racks: 0,
      hits: 0,
      misses: 0,
      score: 0,
      combo: 1,
      spec: pack.spec,
      holes: pack.holes,
      ball: null,
      aim: null,
      raf: 0,
      shake: 0,
      closedStamp: false,
      lastNote: "",
      onBoard: false,
      faceHit: false,
      doomed: "",
    };
    if (rk() && typeof rk().reportDepth === "function") {
      try { rk().reportDepth(kitRun, pack.spec.stage, { name: pack.spec.name, coda: !!pack.spec.coda }); } catch (_) { /* hud optional */ }
    }
    paintKitHud(pack.spec);
    $("ballTossStart").disabled = true;
    $("ballTossStart").hidden = true;
    $("ballTossVerdict").hidden = true;
    kit.hideResult("ballTossResult");
    PF.setTier("ballTossTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    $("ballTossStatus").textContent = `${hudRack(run.spec)} — ${run.spec.barker}`;
    paintKitHud(run.spec);
    PF.focusCard("ballTossCard", true);
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

  function awardSink(h) {
    const gained = Math.round(100 * run.combo);
    run.score += gained;
    if (run.kitRun) run.kitRun.score = run.score;
    run.hits += 1;
    run.combo = Math.min(2, run.combo * 1.1);
    h.hit = true;
    run.ball = null;
    run.onBoard = false;
    run.faceHit = false;
    run.doomed = "";
    kit.sfx("sink");
    $("ballTossStatus").textContent = h.decoy
      ? `Dent lied. +${gained}.`
      : h.keyhole
        ? `Keyhole threaded. +${gained}. Combo ×${run.combo.toFixed(1)} · miss ${run.misses}/3`
        : h.oval
          ? `The oval took it. +${gained}. Combo ×${run.combo.toFixed(1)} · miss ${run.misses}/3`
          : `Barely in. +${gained}. Combo ×${run.combo.toFixed(1)} · miss ${run.misses}/3`;
    if (realHoles(run.holes).every((x) => x.hit)) clearRack();
  }

  function enterRack(n) {
    const pack = makeHoles(n);
    if (!pack) return false;
    run.spec = pack.spec;
    run.holes = pack.holes;
    run.misses = 0;
    $("ballTossStatus").textContent = `${hudRack(run.spec)} — ${run.spec.barker}`;
    paintKitHud(run.spec);
    return true;
  }

  function clearRack() {
    const stage = run.spec.stage;
    const bonus = 500 + 50 * stage;
    run.score += bonus;
    if (run.kitRun) run.kitRun.score = run.score;
    run.racks += 1;
    run.misses = 0;
    kit.sfx("rack");
    PF.setAura("celebrate");
    if (stage >= AUTHORED_COUNT && !run.spec.coda) {
      if (!codaOn()) {
        $("ballTossStatus").textContent = `RACK ${run.racks} CLEAR · +${bonus}. Authored ride over.`;
        if (run.kitRun && PF.runKit && typeof PF.runKit.reportDepth === "function") {
          PF.runKit.reportDepth(run.kitRun, run.racks, { name: run.spec.name, coda: false });
        }
        finish("souvenir");
        return;
      }
      $("ballTossStatus").textContent = `RACK ${run.racks} CLEAR · +${bonus}. ENDLESS — the plywood keeps lying.`;
    }
    if (!enterRack(stage + 1)) {
      finish("souvenir");
      return;
    }
    if (run.kitRun && PF.runKit && typeof PF.runKit.reportDepth === "function") {
      PF.runKit.reportDepth(run.kitRun, run.spec.stage, { name: run.spec.name, coda: !!run.spec.coda });
    }
    if (run.spec.coda && stage === AUTHORED_COUNT) {
      $("ballTossStatus").textContent = `${hudRack(run.spec)} — ${run.spec.barker}`;
    } else if (!run.spec.coda) {
      $("ballTossStatus").textContent = `${hudRack(run.spec)} CLEAR bonus +${bonus}. ${run.spec.barker}`;
    }
  }

  function registerMiss(note) {
    if (!run || run.done || run.resolving) return;
    run.resolving = true;
    run.misses += 1;
    if (run.kitRun && rk() && typeof rk().reportStrike === "function") {
      try { rk().reportStrike(run.kitRun, note || "miss"); } catch (_) { /* pips optional */ }
    }
    run.combo = 1;
    run.ball = null;
    run.onBoard = false;
    run.faceHit = false;
    run.doomed = "";
    run.lastNote = note || "miss";
    kit.sfx(note === "spit" ? "spit" : "miss");
    $("ballTossStatus").textContent = note === "spit"
      ? `SPIT ${run.misses}/3 — too fast for the hole.`
      : note === "decoy"
        ? `Plywood lie. Miss ${run.misses}/3.`
        : `Miss ${run.misses}/3 — the hole cheated.`;
    run.resolving = false;
    if (run.misses >= (run.spec.missesToDeath || 3)) finish("miss");
  }

  function bounceFrom(h, p, spit) {
    const nx = run.ball.x - p.x;
    const ny = run.ball.y - p.y;
    const d = Math.hypot(nx, ny) || 1;
    run.ball.vx += (nx / d) * (spit ? 3.1 : 2.4);
    run.ball.vy = Math.abs(run.ball.vy) * (spit ? 0.55 : 0.72) + (spit ? 2.1 : 1.1);
    h.spitFlash = h.decoy ? 900 : (spit ? 220 : 180);
    h.lock = h.decoy ? 420 : (spit ? 260 : 240);
    run.shake = spit ? 7 : 5;
    run.doomed = spit ? (h.keyhole ? "keyhole" : h.oval ? "oval" : "spit") : (h.decoy ? "decoy" : h.oval ? "oval" : "miss");
    run.lastNote = run.doomed;
    kit.sfx("spit");
    $("ballTossStatus").textContent = h.decoy
      ? "PLYWOOD LIE — that dent isn’t a hole."
      : h.keyhole
        ? (spit ? "Keyhole spat — too hot for a slot." : "Keyhole rim.")
        : h.oval
          ? (spit ? "The oval spat you out." : "Oval wants the center-line.")
          : "SPIT — too hot for a barely-fit hole.";
  }

  function step(dt) {
    const k = dt / 16;
    run.holes.forEach((h) => {
      h.spitFlash = Math.max(0, h.spitFlash - dt);
      h.lock = Math.max(0, (h.lock || 0) - dt);
    });
    const ball = run.ball;
    if (!ball) return;
    ball.vy += GRAVITY * k;
    ball.x += ball.vx * k;
    ball.y += ball.vy * k;
    ball.life += dt;
    const speed = Math.hypot(ball.vx, ball.vy);

    if (!run.doomed && ball.vy > -0.15 && run.spec.clusterRims) {
      for (const h of run.holes) {
        if (h.lock > 0 || h.decoy) continue;
        const p = holePos(h, run.t, run.spec);
        const d = Math.hypot(ball.x - p.x, ball.y - p.y) || 1;
        const outer = (h.rx + h.ry) * 0.5 + BALL_R + 1.2;
        const inner = (h.rx + h.ry) * 0.42;
        const covers = inEllipse(ball.x, ball.y, p.x, p.y, h.rx, h.ry, p.rot);
        if (!covers && d < outer && d > inner) {
          bounceFrom(h, p, false);
          $("ballTossStatus").textContent = "Cluster rim — holes fight each other.";
          return;
        }
      }
    }
    if (!run.doomed && ball.vy > -0.15) {
      for (const h of run.holes) {
        if (h.lock > 0) continue;
        const p = holePos(h, run.t, run.spec);
        const fat = h.hit ? 1.08 : 1;
        const covers = h.keyhole
          ? inKeyhole(ball.x, ball.y, h, p)
          : (h.oval || h.shape === "oval")
            ? inStadium(ball.x, ball.y, p.x, p.y, h.rx * fat, h.ry * fat, p.rot)
            : inEllipse(ball.x, ball.y, p.x, p.y, h.rx * fat, h.ry * fat, p.rot);
        if (!covers) continue;
        if (h.hit) {
          bounceFrom(h, p, false);
          return;
        }
        if (h.decoy) {
          h.exposed = true;
          bounceFrom(h, p, false);
          return;
        }
        if ((h.oval || h.shape === "oval") && !ovalCenterLine(h, p, ball)) {
          bounceFrom(h, p, false);
          run.doomed = "oval";
          run.lastNote = "oval";
          $("ballTossStatus").textContent = "Oval wants the center-line.";
          return;
        }
        if (h.keyhole && !keyholeThread(h, p, ball)) {
          bounceFrom(h, p, false);
          run.doomed = "keyhole";
          run.lastNote = "keyhole";
          $("ballTossStatus").textContent = "Keyhole wants a needle thread.";
          return;
        }
        const spitMul = run.spec.spitSpeed || 1.15;
        const sinkNeed = (SINK_BASE * (h.tiny ? run.spec.scale * 0.7 : run.spec.scale)) / spitMul;
        if (speed <= sinkNeed) {
          run.lastNote = h.keyhole ? "keyhole" : h.oval ? "oval" : "sink";
          awardSink(h);
          return;
        }
        bounceFrom(h, p, true);
        return;
      }
    }

    if (!run.doomed && run.spec.kind === "cluster" && inDeadPlywood(ball.x, ball.y, run.t, run.spec) && ball.vy > 0.2) {
      ball.vy = -Math.abs(ball.vy) * 0.28 - 0.7;
      ball.vx *= 0.55;
      run.shake = 4;
      run.faceHit = true;
      $("ballTossStatus").textContent = "Dead plywood — the cluster is the only live wood.";
      return;
    }

    const on = inBoard(ball.x, ball.y, run.t, run.spec);
    if (on && ball.y < 300 && ball.vy > 0.35 && !run.faceHit && !run.doomed) {
      run.faceHit = true;
      run.onBoard = true;
      ball.vy = -Math.abs(ball.vy) * 0.34 - 0.55;
      ball.vx *= 0.7;
      run.shake = 3;
    }
    if (!on) run.onBoard = false;

    const off = ball.x < 4 || ball.x > W - 4 || ball.y > H - 6 || ball.y < 4 || ball.life > 2600;
    if (off) registerMiss(run.doomed || run.lastNote || "miss");
  }

  function beginAim(x, y) {
    if (!isLive() || run.ball) return;
    run.aim = { x, y, hx: TEE.x, hy: TEE.y, power: 0 };
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
  }

  function releaseAim() {
    if (!run || !run.aim || run.done || run.ball) {
      if (run) run.aim = null;
      return;
    }
    const pull = run.aim.power;
    if (pull < 0.12) {
      run.aim = null;
      $("ballTossStatus").textContent = "Pull back — that’s the throw.";
      return;
    }
    const dx = run.aim.hx - TEE.x;
    const dy = run.aim.hy - TEE.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = throwSpeed(pull);
    const noise = 1 + (Math.random() * 0.04 - 0.02);
    run.ball = {
      x: TEE.x,
      y: TEE.y,
      r: BALL_R,
      vx: (dx / dist) * speed * noise,
      vy: (dy / dist) * speed * noise,
      life: 0,
    };
    run.aim = null;
    run.onBoard = false;
    run.faceHit = false;
    run.doomed = "";
    kit.sfx("throw");
  }

  function revealResult(shot) {
    const reason = shot.reason;
    const racks = shot.racks;
    const score = shot.score;
    const hits = shot.hits;
    const lastNote = shot.lastNote;
    $("ballTossStart").disabled = false;
    $("ballTossStart").hidden = false;
    $("ballTossStart").textContent = "TOSS AGAIN · 1 demo coin";
    PF.focusCard("ballTossCard", false);
    kit.setMode(card(), "result");
    const line = `RACK ${racks} · SCORE ${score}`;
    const aura = auraLine(reason, racks, lastNote);
    const challenge = challengeLine(racks);
    $("ballTossVerdict").hidden = false;
    $("ballTossVerdict").textContent = reason === "souvenir" ? `Souvenir. ${line}.` : `${line} · ${aura}`;
    kit.fillResult({
      root: "ballTossResult",
      depth: "ballTossResultDepth",
      score: "ballTossResultScore",
      aura: "ballTossResultAura",
      copied: "ballTossCopied",
    }, {
      depthLine: reason === "souvenir" ? `RACK ${racks} · SOUVENIR` : `RACK ${racks}`,
      scoreLine: `SCORE ${score}`,
      auraLine: aura,
    });
    const ch = $("ballTossChallengeText");
    if (ch) ch.textContent = challenge;
    PF.setTier("ballTossTier", racks > 0 ? `RACK ${racks}` : "CLOSED", racks > 0 ? "perfect" : "miss");
    $("ballTossStatus").textContent = reason === "leave"
      ? "Stepped off the stall."
      : reason === "souvenir"
        ? "Authored ride over."
        : "Board stamped CLOSED.";
    const ok = racks > 0 || hits > 0;
    if (ok) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Ball toss");
      PF.setAura(racks >= 5 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `RACK ${racks}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Ball toss miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "CLOSED", aura);
    }
    PF.refreshNightBoard();
    stampDepthCopy();
    draw();
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    if (run.raf) cancelAnimationFrame(run.raf);
    run.closedStamp = reason !== "leave" && reason !== "souvenir";
    if (run.closedStamp) kit.sfx("stamp");
    if (reason === "souvenir") kit.sfx("rack");
    const shot = {
      reason,
      racks: run.racks,
      score: run.score,
      hits: run.hits,
      lastNote: run.lastNote,
    };
    persistDepth({
      depth: shot.racks,
      score: shot.score,
      deathReason: reason === "leave" ? "leave" : reason === "souvenir" ? "souvenir" : (shot.lastNote || "miss"),
      cashedOut: reason === "souvenir",
      meta: { room: run.spec && run.spec.name, coda: !!(run.spec && run.spec.coda) },
    });
    stampDepthCopy();
    draw();
    if (reason === "leave" || reason === "souvenir") {
      revealResult(shot);
      return;
    }
    setTimeout(() => revealResult(shot), 720);
  }

  PF.registerVendor({
    id: "ball-toss",
    playKey: "balltoss",
    chalk: "Holes that barely fit. Drag back. How many racks?",
    defaults: { bestBallToss: 0, bestBallTossScore: 0 },
    onLeave() { if (run && !run.done) finish("leave"); },
    onShow() { declareP0(); stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      idlePack = null;
      if ($("ballTossVerdict")) $("ballTossVerdict").hidden = true;
      kit.hideResult("ballTossResult");
      if ($("ballTossStart")) {
        $("ballTossStart").disabled = false;
        $("ballTossStart").hidden = false;
        $("ballTossStart").textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      stampDepthCopy();
      startIdle();
    },
    refreshDepth(state) {
      const now = $("depthTossNow");
      if (now) {
        if (run && !run.done) now.textContent = run.spec.coda ? `ENDLESS ${run.spec.stage}` : `RACK ${run.spec.stage}`;
        else now.textContent = "0";
      }
      const best = $("depthTossBest");
      const bestN = Math.max(state.bestBallToss || 0, (state.bestDepth && state.bestDepth.balltoss) || 0);
      if (best) best.textContent = bestN ? String(bestN) : "—";
      const sc = $("depthTossScore");
      if (sc) sc.textContent = run && !run.done ? String(run.score) : "0";
      const bs = $("depthTossBestScore");
      if (bs) bs.textContent = state.bestBallTossScore ? String(state.bestBallTossScore) : "—";
    },
    bind() {
      declareP0();
      const startBtn = $("ballTossStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = $("ballTossCanvas");
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
      const copyBtn = $("ballTossChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = (PF.getState().lastRun && PF.getState().lastRun.game === GAME_ID)
            ? PF.getState().lastRun.depth
            : (PF.getState().bestBallToss || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const el = $("ballTossCopied");
            if (el) el.hidden = false;
            $("ballTossStatus").textContent = "Copied — send it";
          }, () => {
            $("ballTossStatus").textContent = text;
          });
        });
      }
      stampDepthCopy();
      startIdle();
    },
  });
})();
