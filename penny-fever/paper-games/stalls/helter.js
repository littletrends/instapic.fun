/*
 * Spiral Slide (helter) — Ch1 First Spiral live; Ch2–6 titles frozen (same board until Aura reopens).
 *
 * NEW model (replaces Helix ring-drop / TURN / cream-ladder catcher):
 *   ONE Archimedean spiral path, BOTTOM → TOP, sampled into cells.
 *   YOU starts at cell 0 (bottom) and climbs with verb STEP.
 *   Ladders = boost UP several cells (cream/gold). Count toward GOAL.
 *   Snakes = soft dump DOWN several cells (burgundy). Ride continues; never abort paid.
 *   Practice / chapter bar: land GOAL=3 ladders. Treasure is optional + hard (snake-detour).
 *
 * Ch1 teach: first ladder alone with coaching; one milder snake later (no stacked hazards).
 * Fair bar: competent STEP reaches 3/3 ladders in one free practice ride (~45–55s).
 * Aura fairness retune: post-snake L3 on dump corridor (no long crest re-climb).
 *
 * Keepsake (Lorie): NOT on the trivial upward ladder-skip route. It sits in the corridor
 * you only visit after a soft snake dump — slide down, step the keepsake cell, climb again.
 * Practice complete does NOT require treasure.
 *
 * Tagline: Choose your spiral. Catch what tumbles.
 * Paper-cut deep-red spiral (layered faces + jitter). helter.png court stays hero.
* Bottom terminus aligned to Palace of Joy stairs base; gold ball rolls crest→door.
 * Cream-bottom ← JUMP → pads on court. No shell STEP. Shell .play-hud only (menu off court).
 * d.glow() — 6-digit hex only. Do NOT set canvasControls.
 */
import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=exclusive-1';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction,
  prefersReducedMotion,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'helter';
const TREASURES = ['spiral-tower', 'lucky-match', 'mercury-bead', 'star-token', 'moon-penny', 'ride-ticket'];
const LEVEL_NAMES = [
  'First Spiral',
  'Bunting Bend',
  'Tunnel Turn',
  'Three-Way Tower',
  'Runaway Keepsake',
  'The Impossible Descent',
];

const TAU = Math.PI * 2;
const CX = 450;
/** Climb-axis bottom: front terminus (u=0) at Palace of Joy stairs base (~y 540). */
const Y_BOT = 980;  // big court fill — leave lower cream for ← JUMP → pads
const Y_TOP = 190;   // crest near tower tip / roof
const R_BOT = 295;   // keep big readable scale (do not shrink)
const R_TOP = 58;
const TURNS = 6.0;   // restore pre–stairs-shrink coil count
const Y_SQUASH = 0.28; // flatter ovals so stacked layers stay readable
const ANG0 = -Math.PI / 2; // bottom-front exit toward viewer / stairs
const CELL_COUNT = 26;
const TRACK_W0 = 34; // outer — leave gaps between layers
const TRACK_W1 = 22; // crest
const TRACK_SAMPLES = 560;
const BALL_R = 16;
const BALL_ROLL_SECS = 14; // gravity-ish crest→door prop roll
const GOAL = 3;
const RIDE_SECONDS = 52;
const PREVIEW_SECS = 1.6;
const STEP_EASE = 0.28; // seconds to ease between cells
const FX_CAP = 40;

/** Cream / gold ladder art; burgundy snake; keepsake glow — all 6-digit for d.glow(). */
const CREAM = '#f4d590';
const CREAM_DEEP = '#d2a65b';
const GOLD = '#ffe6a4';
const BURGUNDY = '#c67483';
const BURGUNDY_DEEP = '#6b2030';
const PATH = '#e8d0a0';
const YOU_FILL = '#fff6d8';
/** Deep-red papercut ribbon — light top face / dark edge face. */
const TRACK = '#a02838';
const TRACK_FACE = '#b83242';   // lit paper top
const TRACK_DEEP = '#8b1e2d';
const TRACK_EDGE = '#5c121c';
const TRACK_SHADOW = '#3a0a12';
const BALL_GOLD = '#e8c46a';
const BALL_GOLD_HI = '#fff0b8';
const BALL_GOLD_DEEP = '#b8892e';


/**
 * Ch1 authored board (also used for frozen Ch2–6 stubs).
 * Ladders boost UP; snake soft-dumps DOWN.
 * Treasure cell is only on the post-snake dump corridor (skipped by early ladder climbs).
 */
function ch1Board() {
  // Ladder feet + boost (destination = foot + boost, clamped).
  // Fairness retune (Aura FAIL 2/3): L3 foot sits on the post-snake corridor
  // (cell 8 — skipped by L1 boost 4→9) so one STEP after dump clears the 3rd ladder.
  const ladders = [
    {foot: 4, boost: 5, teach: true},   // 4 → 9; skips 5–8
    {foot: 11, boost: 4, teach: false}, // 11 → 15
    {foot: 8, boost: 7, teach: false},  // 8 → 15 — only after snake dump to 7
  ];
  // Mild snake after L1+L2; dump onto keepsake cell, L3 one STEP ahead.
  const snakes = [
    {head: 16, dump: 9, teach: false}, // 16 → 7
  ];
  const treasureCell = 7; // land here on soft dump (off easy L1 skip route)
  return {ladders, snakes, treasureCell, cellCount: CELL_COUNT, duration: RIDE_SECONDS};
}

/**
 * Archimedean helter coil: BOTTOM → TOP, large radius → tight crest.
 * Each turn is an ELLIPSE (x full r, y climb ± r*Y_SQUASH) so loops read as
 * coils wrapping a tower — not a flat front-view zigzag.
 * ang starts at -PI/2 (bottom-front). depth = sin(ang): +1 back, -1 front.
 */
function spiralPoint(u) {
  const ang = ANG0 + u * TURNS * TAU;
  const r = R_BOT + (R_TOP - R_BOT) * u;
  const climb = Y_BOT + (Y_TOP - Y_BOT) * u;
  // Front (sin=-1) sits lower on screen; back (sin=+1) sits higher — oval loops.
  const x = CX + Math.cos(ang) * r;
  const y = climb - Math.sin(ang) * r * Y_SQUASH;
  const depth = Math.sin(ang); // back first when sorted descending
  return {x, y, ang, r, u, depth, climb};
}

/** Sample spiral BOTTOM → TOP into cell centers ON the ribbon. */
function buildSpiral(n) {
  const cells = [];
  for (let i = 0; i < n; i++) {
    const u = n <= 1 ? 0 : i / (n - 1);
    const p = spiralPoint(u);
    cells.push({i, x: p.x, y: p.y, ang: p.ang, r: p.r, u: p.u, depth: p.depth});
  }
  return cells;
}

function trackWidth(u) {
  return TRACK_W0 + (TRACK_W1 - TRACK_W0) * clamp(u, 0, 1);
}

/**
 * Thick deep-red ribbon with depth layering: continuous half-turn coils,
 * back coils painted first so front turns visibly pass over them.
 */
function paperJitter(i, seed) {
  const n = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}

/** Unit normals along a polyline (for paper edge offsets). */
function pathNormals(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    out.push({nx: -dy, ny: dx});
  }
  return out;
}

/**
 * Papercut deep-red spiral: offset paper edges, clay/paper jitter,
 * light top face + dark edge face (not a flat stroked ribbon only).
 * Half-turn coils sorted back → front for overlap.
 */
function drawSpiralTrack(d) {
  const pts = [];
  for (let i = 0; i < TRACK_SAMPLES; i++) {
    pts.push(spiralPoint(i / (TRACK_SAMPLES - 1)));
  }
  // Soft under-shadow spine (paper cast).
  d.path(pts.map((p) => ({x: p.x + 4, y: p.y + 7})), TRACK_SHADOW + '44', TRACK_W0 + 8, false, null);

  const halfTurns = Math.max(2, Math.ceil(TURNS * 2));
  const coils = [];
  for (let h = 0; h < halfTurns; h++) {
    const u0 = h / (TURNS * 2);
    const u1 = Math.min(1, (h + 1) / (TURNS * 2));
    const i0 = Math.max(0, Math.floor(u0 * (TRACK_SAMPLES - 1)) - 2);
    const i1 = Math.min(TRACK_SAMPLES - 1, Math.ceil(u1 * (TRACK_SAMPLES - 1)) + 2);
    const slice = pts.slice(i0, i1 + 1);
    if (slice.length < 3) continue;
    let depthSum = 0;
    for (const p of slice) depthSum += p.depth;
    const mid = slice[Math.floor(slice.length / 2)];
    coils.push({
      pts: slice,
      depth: depthSum / slice.length,
      w: trackWidth(mid.u),
      u: mid.u,
      h,
    });
  }
  coils.sort((a, b) => b.depth - a.depth || a.u - b.u);

  for (const coil of coils) {
    const w = coil.w;
    const nrm = pathNormals(coil.pts);
    const half = w * 0.5;
    const thick = 7; // visible paper cardstock edge
    const left = [];
    const right = [];
    for (let i = 0; i < coil.pts.length; i++) {
      const p = coil.pts[i];
      const n = nrm[i];
      const jx = paperJitter(i + coil.h * 17, 1) * 1.35;
      const jy = paperJitter(i + coil.h * 17, 2) * 1.05;
      left.push({x: p.x + n.nx * half + jx, y: p.y + n.ny * half + jy});
      right.push({x: p.x - n.nx * half + jx * 0.55, y: p.y - n.ny * half + jy * 0.55});
    }
    // Dark edge face (paper thickness) — offset down-right, drawn first.
    const edgePoly = left.map((p) => ({x: p.x + 3.2, y: p.y + thick}))
      .concat(right.map((p) => ({x: p.x + 3.2, y: p.y + thick})).reverse());
    d.poly(edgePoly, TRACK_SHADOW + 'f4', TRACK_SHADOW, 1.4);
    // Deep under-face for layered depth.
    const deepPoly = left.map((p) => ({x: p.x + 1.6, y: p.y + thick * 0.62}))
      .concat(right.map((p) => ({x: p.x + 1.6, y: p.y + thick * 0.62})).reverse());
    d.poly(deepPoly, TRACK_EDGE + 'f8', TRACK_SHADOW, 1.2);
    d.poly(
      left.map((p) => ({x: p.x + 0.8, y: p.y + thick * 0.28}))
        .concat(right.map((p) => ({x: p.x + 0.8, y: p.y + thick * 0.28})).reverse()),
      TRACK_DEEP + 'f4', TRACK_EDGE, 1,
    );
    // Lit top paper face.
    const topPoly = left.concat(right.slice().reverse());
    d.poly(topPoly, TRACK_FACE + 'fa', TRACK_EDGE, 1.6);
    // Inner body wash (slightly inset).
    const inset = half * 0.55;
    const innerL = [];
    const innerR = [];
    for (let i = 0; i < coil.pts.length; i++) {
      const p = coil.pts[i];
      const n = nrm[i];
      const jx = paperJitter(i + coil.h * 9, 3) * 0.7;
      const jy = paperJitter(i + coil.h * 9, 4) * 0.5;
      innerL.push({x: p.x + n.nx * inset + jx, y: p.y + n.ny * inset + jy - 0.8});
      innerR.push({x: p.x - n.nx * inset + jx * 0.4, y: p.y - n.ny * inset + jy * 0.4});
    }
    d.poly(innerL.concat(innerR.reverse()), TRACK + 'f4', TRACK_DEEP + '88', 1);
    // Cream highlight lip on the upper paper edge.
    d.path(left.map((p) => ({x: p.x, y: p.y - 1.2})), CREAM + '78', Math.max(2.2, w * 0.14), false, null);
    // Dark lower lip (shadowed paper edge).
    d.path(right.map((p) => ({x: p.x, y: p.y + 0.8})), TRACK_SHADOW + '99', Math.max(1.8, w * 0.1), false, null);
  }
}

function reducedMotion(s) {
  if (s && s.reduced) return true;
  if (typeof prefersReducedMotion === 'function') {
    try { return !!prefersReducedMotion(); } catch { /* fall through */ }
  }
  return false;
}

function cellAt(s, idx) {
  const cells = s.cells || [];
  const i = clamp(idx | 0, 0, Math.max(0, cells.length - 1));
  return cells[i];
}

function ladderAt(s, cellIdx) {
  // Match foot even if used — recover climb can reuse ladder for movement;
  // hits only credit on first use in resolveLanding.
  return (s.ladders || []).find((L) => L.foot === cellIdx);
}

function snakeAt(s, cellIdx) {
  return (s.snakes || []).find((S) => S.head === cellIdx && !S.used);
}

function pushFx(s, fx) {
  if (!s.fx) s.fx = [];
  s.fx.push(fx);
  while (s.fx.length > FX_CAP) s.fx.shift();
}

function pushSparks(s, x, y, soft) {
  const n = soft ? 6 : 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    pushFx(s, {
      kind: 'spark', x, y,
      vx: Math.cos(a) * (40 + i * 8),
      vy: Math.sin(a) * (40 + i * 8) - 30,
      life: 0.45 + (i % 3) * 0.08,
      soft: !!soft,
    });
  }
}

function tickFx(s, dt) {
  if ((s.finishPulse || 0) > 0) s.finishPulse = Math.max(0, s.finishPulse - dt);
  if ((s.matPulse || 0) > 0) s.matPulse = Math.max(0, s.matPulse - dt);
  if ((s.snakeFlash || 0) > 0) s.snakeFlash = Math.max(0, s.snakeFlash - dt);
  if ((s.ladderFlash || 0) > 0) s.ladderFlash = Math.max(0, s.ladderFlash - dt);
  s.fx = (s.fx || []).filter((fx) => {
    fx.life -= dt;
    if (fx.kind === 'spark') {
      fx.x += (fx.vx || 0) * dt;
      fx.y += (fx.vy || 0) * dt;
      fx.vy = (fx.vy || 0) + 120 * dt;
    }
    return fx.life > 0;
  });
}

/** Begin a move toward absolute cell index (eased). */
function beginCellMove(s, dest, reason) {
  const n = (s.cells || []).length;
  const to = clamp(dest | 0, 0, Math.max(0, n - 1));
  const from = s.youCell | 0;
  if (to === from && !s.moving) {
    s.youCell = to;
    s.youX = cellAt(s, to).x;
    s.youY = cellAt(s, to).y;
    return;
  }
  s.moving = true;
  s.moveFrom = from;
  s.moveTo = to;
  s.moveT = 0;
  s.moveDur = reducedMotion(s) ? 0.08 : STEP_EASE;
  s.moveReason = reason || 'step';
  const a = cellAt(s, from);
  const b = cellAt(s, to);
  s.youX = a.x;
  s.youY = a.y;
  s._moveAx = a.x;
  s._moveAy = a.y;
  s._moveBx = b.x;
  s._moveBy = b.y;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Resolve landing on a cell: treasure, ladder boost, snake dump.
 * Ladder/snake chains: resolve one transit at a time (no stacked auto-chains in Ch1).
 */
function resolveLanding(s) {
  const idx = s.youCell | 0;

  // Optional keepsake — only while eligible / not yet taken; hard snake-detour cell.
  if (s.treasure && !s.treasure.taken && s.treasure.cell === idx) {
    if (s.eligible || s.practice) {
      // Practice may "see" it but ride-seek only keeps on paid; still record for paid.
      if (s.eligible) {
        recordTreasure(s, s.treasure.id);
        logAction(s, 'treasure', {cell: idx, id: s.treasure.id});
        s.note = 'Keepsake! Soft snake detour paid off.';
        s.statusCopy = 'Keepsake';
      } else {
        s.note = 'Practice keepsake glimpse — paid rides can keep it.';
        s.statusCopy = 'Glimpse';
        logAction(s, 'treasure-practice', {cell: idx});
      }
      s.treasure.taken = true;
      s.treasureRevealed = true;
      const c = cellAt(s, idx);
      pushSparks(s, c.x, c.y, false);
      s.matPulse = 0.7;
    }
  }

  const L = ladderAt(s, idx);
  if (L) {
    const first = !L.used;
    const dest = clamp(L.foot + L.boost, 0, (s.cells || []).length - 1);
    if (first) {
      L.used = true;
      s.hits = (s.hits || 0) + 1;
      logAction(s, 'ladder', {cell: idx, dest, hits: s.hits, teach: !!L.teach});
      recordFind(s, 'cell-' + idx, RIDE);
      s.note = s.hits >= GOAL
        ? 'Crest clear — ' + s.hits + ' / ' + GOAL + ' ladders!'
        : (L.teach
          ? 'Cream ladder! Boost up — keep STEPping for more.'
          : 'Ladder boost! ' + s.hits + ' / ' + GOAL);
      s.statusCopy = 'Ladder ' + s.hits + '/' + GOAL;
    } else {
      logAction(s, 'ladder-reclimb', {cell: idx, dest});
      s.note = 'Ladder again — climb on.';
      s.statusCopy = 'Reclimb';
    }
    s.ladderFlash = 0.7;
    const c = cellAt(s, idx);
    pushSparks(s, c.x, c.y, false);
    pushFx(s, {kind: 'label', x: c.x, y: c.y - 36, text: first ? 'ladder!' : 'up!', life: 0.7, soft: false});
    // Boost UP (first credit or soft-dump reclimb).
    beginCellMove(s, dest, 'ladder');
    return;
  }

  const S = snakeAt(s, idx);
  if (S) {
    S.used = true;
    const dest = clamp(S.head - S.dump, 0, (s.cells || []).length - 1);
    logAction(s, 'snake', {cell: idx, dest});
    s.snakeFlash = 0.85;
    const c = cellAt(s, idx);
    pushSparks(s, c.x, c.y, true);
    pushFx(s, {kind: 'label', x: c.x, y: c.y - 36, text: 'snake…', life: 0.75, soft: true});
    s.note = 'Snake soft dump — climb again. Ride continues.';
    s.statusCopy = 'Soft dump';
    // Soft dump DOWN — never abort / never broke.
    beginCellMove(s, dest, 'snake');
    return;
  }
}

/** Advance one cell up the spiral (STEP). */
function doStep(s) {
  if (s.result || s.broke || s.moving) return false;
  if (!s.launched) return false;
  const n = (s.cells || []).length;
  const next = Math.min((s.youCell | 0) + 1, n - 1);
  if (next === (s.youCell | 0)) {
    // Already at crest — try finish if goal met.
    maybeFinish(s, 'crest');
    return false;
  }
  s.steppedOnce = true;
  logAction(s, 'step', {from: s.youCell, to: next});
  beginCellMove(s, next, 'step');
  return true;
}

/** One cell DOWN the spiral (←). */
function doStepBack(s) {
  if (s.result || s.broke || s.moving) return false;
  if (!s.launched) return false;
  const prev = Math.max(0, (s.youCell | 0) - 1);
  if (prev === (s.youCell | 0)) return false;
  logAction(s, 'step-back', {from: s.youCell, to: prev});
  beginCellMove(s, prev, 'step-back');
  return true;
}

/** Cream-bottom pad layout (canvas 900×1200). */
function creamPads() {
  const y = 1128;
  const h = 78;
  const jumpW = 210;
  const sideW = 92;
  const gap = 28;
  const mid = CX;
  const jump = {id: 'jump', x: mid - jumpW / 2, y, w: jumpW, h, label: 'JUMP'};
  const left = {id: 'left', x: jump.x - gap - sideW, y, w: sideW, h, label: '←'};
  const right = {id: 'right', x: jump.x + jumpW + gap, y, w: sideW, h, label: '→'};
  const stick = {id: 'stick', x: mid - 18, y: y - 36, w: 36, h: 28, label: '🕹️'};
  return [left, jump, right, stick];
}

function hitPad(p) {
  if (!p || typeof p.x !== 'number') return null;
  for (const pad of creamPads()) {
    if (p.x >= pad.x && p.x <= pad.x + pad.w && p.y >= pad.y && p.y <= pad.y + pad.h) return pad.id;
  }
  return null;
}

function drawCreamPads(d) {
  for (const pad of creamPads()) {
    if (pad.id === 'stick') {
      d.text(pad.label, pad.x + pad.w / 2, pad.y + pad.h / 2, 22, GOLD);
      continue;
    }
    const isJump = pad.id === 'jump';
    d.ellipse(pad.x + pad.w / 2 + 2, pad.y + pad.h / 2 + 4, pad.w * 0.48, pad.h * 0.42, TRACK_SHADOW + '66');
    d.ellipse(
      pad.x + pad.w / 2,
      pad.y + pad.h / 2,
      pad.w * 0.48,
      pad.h * 0.42,
      isJump ? CREAM + 'ee' : '#233941ee',
      isJump ? CREAM_DEEP : '#a48c62',
      2
    );
    d.text(pad.label, pad.x + pad.w / 2, pad.y + pad.h / 2 + 1, isJump ? 22 : 28, isJump ? BURGUNDY_DEEP : CREAM);
  }
}

function maybeFinish(s, why) {
  if (s.result || s.broke) return;
  const ok = (s.hits || 0) >= (s.goal || GOAL);
  const atTop = (s.youCell | 0) >= ((s.cells || []).length - 1);
  if (!ok && why !== 'timeout') return;
  if (ok || why === 'timeout') {
    s.challengeOkFlash = ok;
    s.finishPulse = 1.3;
    s.matPulse = 0.55;
    s.statusCopy = ok ? 'Clear!' : 'Short on ladders';
    s.note = ok
      ? (atTop ? 'Top of the spiral — Practice clear!' : 'Three ladders — spiral clear!')
      : 'Short on ladders — ride returns.';
    const c = cellAt(s, s.youCell | 0);
    pushSparks(s, c.x, c.y, !ok);
    finishRide(s, {
      rideId: RIDE,
      treasureId: s.treasureId,
      challengeOk: ok,
      completionFind: 'star-token',
    });
  }
}

function spawnTreasure(s) {
  const cell = s.planTreasureCell != null ? s.planTreasureCell : 8;
  s.treasure = {
    id: s.treasureId || TREASURES[0],
    cell,
    taken: false,
  };
  s.treasureRevealed = false;
}

function coachNote(s) {
  if (!s.launched) return 'STEP up the spiral — cream ladder boosts you';
  if ((s.hits || 0) >= GOAL) return s.note || 'Clear!';
  const idx = s.youCell | 0;
  const teachL = (s.ladders || []).find((L) => L.teach && !L.used);
  if (teachL && idx <= teachL.foot) {
    return 'STEP up the spiral — cream ladder boosts you';
  }
  const sn = (s.snakes || []).find((S) => !S.used);
  if (sn && idx >= sn.head - 2 && idx <= sn.head) {
    return 'Burgundy snake ahead — soft dump, then climb again';
  }
  if (s.treasure && !s.treasure.taken && idx < s.treasure.cell && (s.snakes || []).some((S) => S.used)) {
    return 'Keepsake on the dump path — STEP onto it';
  }
  return s.note || 'STEP up the spiral';
}

function drawLadderSeg(d, cells, foot, dest) {
  const a = cells[foot];
  const b = cells[Math.min(dest, cells.length - 1)];
  if (!a || !b) return;
  // Cream/gold rail + rungs (translucent diegetic).
  d.line({x: a.x - 10, y: a.y}, {x: b.x - 10, y: b.y}, CREAM_DEEP + '99', 3);
  d.line({x: a.x + 10, y: a.y}, {x: b.x + 10, y: b.y}, CREAM_DEEP + '99', 3);
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x1 = a.x - 10 + (b.x - a.x) * t;
    const y1 = a.y + (b.y - a.y) * t;
    const x2 = a.x + 10 + (b.x - a.x) * t;
    d.line({x: x1, y: y1}, {x: x2, y: y1}, CREAM + 'aa', 2);
  }
  d.glow(a.x, a.y, 22, CREAM);
  d.circle(a.x, a.y, 7, CREAM + '66', CREAM_DEEP, 1.5);
}

function drawSnakeCurve(d, cells, head, dest) {
  const a = cells[head];
  const b = cells[Math.max(0, dest)];
  if (!a || !b) return;
  const mid = {
    x: (a.x + b.x) / 2 + (a.y < b.y ? 36 : -36),
    y: (a.y + b.y) / 2,
  };
  // Approximate S-curve with polyline segments.
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const omt = 1 - t;
    const x = omt * omt * a.x + 2 * omt * t * mid.x + t * t * b.x;
    const y = omt * omt * a.y + 2 * omt * t * mid.y + t * t * b.y;
    pts.push({x, y});
  }
  d.path(pts, BURGUNDY + 'cc', 5, false, null);
  d.path(pts, BURGUNDY_DEEP + '88', 2, false, null);
  d.glow(a.x, a.y, 20, BURGUNDY);
  d.circle(a.x, a.y, 6, BURGUNDY + '55', BURGUNDY_DEEP, 1.5);
}

function drawFx(d, s) {
  for (const fx of s.fx || []) {
    if (fx.kind === 'spark') {
      const alpha = clamp(fx.life / 0.5, 0, 1);
      // Bake alpha into 8-digit only on fill via ellipse hex+alpha is ok if 6-digit base for glow;
      // use circle fill with 8-digit; glow itself stays 6-digit.
      d.circle(fx.x, fx.y, 3 + alpha * 2, (fx.soft ? BURGUNDY : GOLD) + Math.round(alpha * 200).toString(16).padStart(2, '0'));
    } else if (fx.kind === 'label') {
      d.text(fx.text, fx.x, fx.y, 16, fx.soft ? BURGUNDY : CREAM);
    }
  }
}

/** Paper-cut gold/celestial ball — disc + highlight (prop rolls crest→door). */
function drawBall(d, x, y, r) {
  d.ellipse(x + 2, y + 4, r * 0.95, r * 0.55, TRACK_SHADOW + '55');
  d.circle(x, y, r + 1.5, BALL_GOLD_DEEP + 'ee', TRACK_EDGE, 1.2);
  d.circle(x, y, r, BALL_GOLD + 'f8', BALL_GOLD_DEEP, 1.8);
  d.circle(x - r * 0.28, y - r * 0.32, r * 0.38, BALL_GOLD_HI + 'dd');
  d.circle(x - r * 0.18, y - r * 0.22, r * 0.14, '#fffaf0cc');
  d.glow(x, y, r * 2.1, GOLD);
}

export default {
  title: 'Spiral Slide',
  intro: 'Choose your spiral. Catch what tumbles. STEP up Tilly’s helter — cream ladders boost you up the spiral; burgundy snakes soft-dump you down (ride never aborts). Land 3 ladders to clear. A keepsake hides on a snake-detour off the easy climb.',
  instructions: 'Climb with ← JUMP → in the cream (or ↑ / space). Cream ladders boost you up; land on 3 to clear Practice. Burgundy snakes soft-dump you down — climb again; paid rides never abort. Keepsake sits off the easy ladder route on the snake-dump path. First chapter ride is free practice and keeps nothing; later rides cost a penny.',
  levels: LEVEL_NAMES,
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 70,
  actions: [],
  create(level, rng) {
    const rand = typeof rng === 'function' ? rng : Math.random;
    const plan = ch1Board(); // Ch2–6 frozen: same First Spiral board until Aura reopens
    const cells = buildSpiral(plan.cellCount);
    const ladders = plan.ladders.map((L) => ({...L, used: false}));
    const snakes = plan.snakes.map((S) => ({...S, used: false}));
    const start = cells[0];
    const crest = spiralPoint(1);
    return makeRideState(level, rand, {
      hits: 0,
      goal: GOAL,
      treasureId: TREASURES[level] || TREASURES[0],
      cells,
      ladders,
      snakes,
      planTreasureCell: plan.treasureCell,
      duration: plan.duration,
      frozenChapter: level > 0,
      youCell: 0,
      youX: start.x,
      youY: start.y,
      moving: false,
      moveT: 0,
      moveDur: STEP_EASE,
      moveFrom: 0,
      moveTo: 0,
      previewing: false,
      previewT: 0,
      launched: false,
      steppedOnce: false,
      fx: [],
      matPulse: 0,
      finishPulse: 0,
      snakeFlash: 0,
      ladderFlash: 0,
      statusCopy: '',
      challengeOkFlash: false,
      pendingLand: false,
      // Gold ball prop: u=1 crest → u=0 stairs-base exit (rolls down).
      ballU: 1,
      ballX: crest.x,
      ballY: crest.y,
      ballRolling: true,
    });
  },
  update(s, dt, input) {
    tickFx(s, dt);
    if (s.result || s.broke) return;

    const spawnIds = (s.cells || []).map((_, i) => 'cell-' + i);
    if (ensureBoarded(s, RIDE, s.treasureId, spawnIds.length ? spawnIds : ['cell-0', 'cell-8', 'cell-12'])) {
      s.previewing = true;
      s.previewT = 0;
      s.launched = false;
      s.t = 0;
      s.progress = 0;
      s.fx = [];
      s.matPulse = 0;
      s.finishPulse = 0;
      s.snakeFlash = 0;
      s.ladderFlash = 0;
      s.statusCopy = '';
      s.steppedOnce = false;
      s.moving = false;
      s.youCell = 0;
      const c0 = cellAt(s, 0);
      s.youX = c0.x;
      s.youY = c0.y;
      s.hits = 0;
      for (const L of s.ladders || []) L.used = false;
      for (const S of s.snakes || []) S.used = false;
      s.ballU = 1;
      s.ballRolling = true;
      {
        const bp = spiralPoint(1);
        s.ballX = bp.x; s.ballY = bp.y;
      }
      s.note = s.frozenChapter
        ? 'Chapter frozen — First Spiral board (Ch2–6 pending Aura). STEP up.'
        : 'STEP up the spiral — cream ladder boosts you';
      // Fair treasure: seal may pick a spawn; prefer authored snake-detour cell when eligible.
      if (s.eligible) {
        const preferred = 'cell-' + (s.planTreasureCell ?? 8);
        if (s.spawnId && String(s.spawnId).startsWith('cell-')) {
          const idx = Number(String(s.spawnId).replace('cell-', ''));
          // Keep seal spawn only if it sits on the hard dump corridor near authored cell.
          if (!(idx >= 5 && idx <= 9)) s.spawnId = preferred;
        } else {
          s.spawnId = preferred;
        }
        const idx = Number(String(s.spawnId).replace('cell-', ''));
        s.planTreasureCell = clamp(Number.isFinite(idx) ? idx : 8, 5, 9);
      }
      logAction(s, 'preview', {secs: PREVIEW_SECS});
    }
    if (s.result) return;

    if (s.previewing && !s.launched) {
      s.previewT += dt;
      if (s.previewT >= PREVIEW_SECS) {
        s.previewing = false;
        s.launched = true;
        s.t = 0;
        s.progress = 0;
        s.note = 'STEP up the spiral — cream ladder boosts you';
        s.statusCopy = 'Climbing';
        logAction(s, 'release', {});
        spawnTreasure(s);
      }
      return;
    }

    s.t += dt;
    s.progress = Math.min(1, s.t / Math.max(0.01, s.duration || RIDE_SECONDS));

    // Gold ball rolls DOWN the spiral (u: 1→0) with gravity-ish ease.
    if (s.ballRolling !== false) {
      const bu = s.ballU == null ? 1 : s.ballU;
      // Accel as it descends — full crest→door in ~BALL_ROLL_SECS.
      const rate = (1 / Math.max(0.01, BALL_ROLL_SECS)) * (0.55 + (1 - bu) * 1.35);
      s.ballU = Math.max(0, bu - dt * rate);
      if (s.ballU <= 0) {
        s.ballU = 0;
        s.ballRolling = false;
      }
      const bp = spiralPoint(s.ballU);
      s.ballX = bp.x;
      s.ballY = bp.y;
    }

    // Ease YOU along current move; resolve landing when ease completes.
    if (s.moving) {
      s.moveT += dt;
      const u = clamp(s.moveT / Math.max(0.001, s.moveDur || STEP_EASE), 0, 1);
      const e = easeInOut(u);
      s.youX = (s._moveAx ?? s.youX) + ((s._moveBx ?? s.youX) - (s._moveAx ?? s.youX)) * e;
      s.youY = (s._moveAy ?? s.youY) + ((s._moveBy ?? s.youY) - (s._moveAy ?? s.youY)) * e;
      if (u >= 1) {
        s.moving = false;
        s.youCell = s.moveTo | 0;
        const c = cellAt(s, s.youCell);
        s.youX = c.x;
        s.youY = c.y;
        resolveLanding(s);
        // If resolve started another move (ladder/snake), wait; else check win.
        if (!s.moving) {
          if ((s.hits || 0) >= (s.goal || GOAL)) maybeFinish(s, 'goal');
          else if ((s.youCell | 0) >= ((s.cells || []).length - 1)) maybeFinish(s, 'crest');
          else s.note = coachNote(s);
        }
      }
    } else {
      s.note = coachNote(s);
    }

    // Reveal keepsake once snake has fired (detour corridor only).
    if (s.treasure && !s.treasure.taken) {
      if ((s.snakes || []).some((S) => S.used)) s.treasureRevealed = true;
    }

    if (s.t >= (s.duration || RIDE_SECONDS)) {
      maybeFinish(s, 'timeout');
    }
  },
  action(s, id, down) {
    if (!down || s.result || s.broke) return;
    if (id === 'step' || id === 'jump') doStep(s);
    else if (id === 'left') doStepBack(s);
    else if (id === 'right') doStep(s);
  },
  pointer(s, type, p) {
    if (s.result || s.broke) return;
    if (type !== 'up' || !p) return;
    const hit = hitPad(p);
    if (hit === 'left') { doStepBack(s); return; }
    if (hit === 'right' || hit === 'jump' || hit === 'stick') { doStep(s); return; }
    // Tap-ahead on the spiral still STEPs (ignore cream pad band).
    if (typeof p.y === 'number' && p.y < 1080) {
      const ahead = p.y < (s.youY || Y_BOT) - 8;
      const near = Math.hypot((p.x || 0) - (s.youX || CX), (p.y || 0) - (s.youY || Y_BOT)) < 120;
      if (ahead || near) doStep(s);
    }
  },
  key(s, k, down) {
    if (!down || s.result || s.broke) return;
    if (k === 'ArrowLeft') doStepBack(s);
    else if (k === 'ArrowUp' || k === 'ArrowRight' || k === ' ' || k === 'Enter' || k === 'j' || k === 'J') doStep(s);
  },
  draw(s, d) {
    const cells = s.cells || [];
    // Soft vignette only — do not hide helter.png court.
    d.ellipse(CX, 640, 400, 540, '#4a182410');

    // RED TRACK is the star — thick coiled ribbon with back→front layering.
    drawSpiralTrack(d);

    // Faint cell centers on the ribbon (readable footholds, not geometry lines).
    for (const c of cells) {
      d.circle(c.x, c.y, 4, '#f4d59028', TRACK_EDGE + '55', 1);
    }

    // Ladder segments (cream/gold) sit ON the track.
    for (const L of s.ladders || []) {
      drawLadderSeg(d, cells, L.foot, L.foot + L.boost);
    }

    // Snake curves (burgundy) sit ON the track.
    for (const S of s.snakes || []) {
      drawSnakeCurve(d, cells, S.head, S.head - S.dump);
    }

    // Treasure on hard detour cell.
    if (s.treasure && !s.treasure.taken && (s.treasureRevealed || s.eligible || s.practice)) {
      const tc = cellAt(s, s.treasure.cell);
      if (tc) {
        const show = s.treasureRevealed || ((s.snakes || []).some((S) => S.used));
        if (show) {
          d.glow(tc.x, tc.y, 28, GOLD);
          d.star(tc.x, tc.y, 14, CREAM);
          try {
            const key = typeof spriteKey === 'function' ? spriteKey(s.treasure.id) : s.treasure.id;
            d.item?.(key, tc.x, tc.y, {w: 36, alpha: 0.9});
          } catch { /* sprite optional */ }
        }
      }
    }

    // Crest bullseye — cream disc (+ optional tiny spiral-tower sprite).
    const top = cells[cells.length - 1];
    if (top) {
      d.ellipse(top.x, top.y + 2, 26, 14, TRACK_SHADOW + '44');
      d.ellipse(top.x, top.y, 20, 11, CREAM + '55', CREAM_DEEP + '99', 1.5);
      d.ellipse(top.x, top.y, 8, 5, GOLD + '66', CREAM_DEEP + '88', 1);
      try {
        d.item?.('spiral-tower', top.x, top.y - 10, {w: 28, alpha: 0.85});
      } catch { /* sprite optional */ }
    }

    // Gold celestial ball (prop) on the ribbon — rolls crest→stairs.
    {
      const bx = s.ballX ?? spiralPoint(s.ballU == null ? 1 : s.ballU).x;
      const by = s.ballY ?? spiralPoint(s.ballU == null ? 1 : s.ballU).y;
      drawBall(d, bx, by, BALL_R);
    }

    // YOU marker.
    const yx = s.youX ?? (cells[0] && cells[0].x) ?? CX;
    const yy = s.youY ?? (cells[0] && cells[0].y) ?? Y_BOT;
    if ((s.ladderFlash || 0) > 0) d.glow(yx, yy, 36 + s.ladderFlash * 20, CREAM);
    if ((s.snakeFlash || 0) > 0) d.glow(yx, yy, 34 + s.snakeFlash * 18, BURGUNDY);
    d.glow(yx, yy, 26, GOLD);
    d.circle(yx, yy, 14, YOU_FILL + 'ee', CREAM_DEEP, 2);
    d.text('YOU', yx, yy + 1, 11, BURGUNDY_DEEP);

    // Finish flourish near crest / YOU.
    if ((s.finishPulse || 0) > 0) {
      d.glow(yx, yy, 50 + s.finishPulse * 40, s.challengeOkFlash ? GOLD : '#8ec8e8');
    }

    drawFx(d, s);

    // On-court cream-bottom controls (replaces shell STEP).
    if (!s.result && !s.broke) drawCreamPads(d);
  },
  readout: (s) => s.note || '',
};
