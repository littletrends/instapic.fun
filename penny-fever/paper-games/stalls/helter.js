/*
 * Spiral Slide (helter) — Ch1 First Spiral live; Ch2–6 titles frozen (same board until Aura reopens).
 *
 * TAP-TAP-TAP + JUMP model (cushions bounce up; slides soft-dump down):
 *   ONE Archimedean spiral path, BOTTOM → TOP, sampled into cells.
 *   YOU starts at cell 0 (bottom). ←/→ or tap near YOU advances along coil cells.
 *   JUMP leaps over the next cell (onto cell+2). Miss/jump over a SLIDE = safe.
 *   SLIDE (deep-red chute): land or jump onto → soft dump DOWN (never abort).
 *   CUSHION (cream+gold plump): jump onto (or land) → bounce UP several cells.
 *   JUMP BALL: gold play ball rolls crest→bottom; near YOU → soft dump to cell 0 (JUMP over clears).
 *   Keepsake + tokens: claim when PASSING cells (from→to inclusive), not only exact land.
 *   Aura Tent_21_Skip + bea-player dress via helter-dress/ (no re-split).
 *
 * Practice clear: keepsake taken AND (crest reached OR ≥3 cushions bounced).
 * Soft dump never aborts paid rides; practice keeps nothing. ~45–55s ride.
 *
 * Tagline: Choose your spiral. Catch what tumbles.
 * Paper-cut deep-red spiral (layered faces + jitter). helter.png court stays hero.
 * Bottom terminus aligned to Palace of Joy stairs base; gold ball rolls crest→door.
 * Cream-bottom ← JUMP → pads on court. No shell STEP. Shell .play-hud only (menu off court).
 * d.glow() — 6-digit hex only. Do NOT set canvasControls.
 */
import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=exclusive-1b';
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
const BALL_WAIT_SECS = 1.4; // pause after ball exits before hopper reload
const CUSHION_GOAL = 3;
const RIDE_SECONDS = 52;
const PREVIEW_SECS = 1.6;
const STEP_EASE = 0.22; // seconds to ease between cells (snappy climb) // seconds to ease between cells
const JUMP_EASE = 0.38; // hop loft
const FX_CAP = 40;

/** Cream / gold / deep-red props — all 6-digit for d.glow(). */
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
const SLIDE_FILL = '#c03040';
const SLIDE_DEEP = '#7a1828';
const CUSHION_FILL = '#ffe8b0';
const CUSHION_DEEP = '#c99448';
const HOPPER_FILL = '#3a2a28';
const HOPPER_DEEP = '#1e1412';

/** Aura official Tent_21_Skip + bea-player — helter-dress/ (do not re-split). */
const DRESS_CACHE = 'dress-3f';
const SKIP_FILES = {
  ball: 'Tent_21_Skip_star-ball.png',
  slide: 'Tent_21_Skip_moon-slide.png',
  cushion: 'Tent_21_Skip_tufted-cushion.png',
  hopper: 'Tent_21_Skip_star-drum.png',
  cradle: 'Tent_21_Skip_moon-cradle.png',
  gauge: 'Tent_21_Skip_celestial-gauge.png',
};
const BEA_PLAYER_FILE = 'bea-player.png';
let skipPropImgs = null;
let beaPlayerImg = null;

function dressUrl(rel) {
  // Resolve against THIS module (stalls/helter.js), not play.html — otherwise
  // ../assets hits penny-fever/assets/ (404) instead of paper-games/assets/.
  try {
    return new URL(rel + (rel.includes('?') ? '&' : '?') + 'v=' + DRESS_CACHE, import.meta.url).href;
  } catch {
    return rel;
  }
}

function ensureSkipProps() {
  if (skipPropImgs) return skipPropImgs;
  skipPropImgs = {};
  for (const [key, file] of Object.entries(SKIP_FILES)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = dressUrl('../assets/helter-dress/skip/' + file);
    skipPropImgs[key] = img;
  }
  if (!beaPlayerImg) {
    beaPlayerImg = new Image();
    beaPlayerImg.decoding = 'async';
    beaPlayerImg.src = dressUrl('../assets/helter-dress/player/' + BEA_PLAYER_FILE);
  }
  return skipPropImgs;
}

function dressReady(img) {
  return !!(img && img.complete && img.naturalWidth > 0);
}

function placeDress(d, img, x, y, w, angle, h) {
  if (!dressReady(img) || typeof d.sprite !== 'function') return false;
  const opts = {w, shadow: true};
  if (h) opts.h = h;
  if (angle) opts.angle = angle;
  return d.sprite(img, x, y, opts);
}


/**
 * Ch1 authored board (also used for frozen Ch2–6 stubs).
 * Slides soft-dump DOWN; cushions bounce UP.
 * Keepsake + tokens sit on coil cells.
 */
function ch1Board() {
  // Slide cells: land/jump onto → dump DOWN by `dump` cells.
  // Placement nudge (Lorie markup 2026-09-16): all three slides further DOWN coil.
  const slides = [
    {cell: 3, dump: 5, teach: true},   // was 5 — further down
    {cell: 10, dump: 6, teach: false}, // was 13 — further down
    {cell: 20, dump: 5, teach: false}, // was 23 — further down
  ];
  // Cushion cells: land/jump onto → bounce UP by `boost` cells.
  const cushions = [
    {cell: 4, boost: 4, teach: true},   // 4 → 8
    {cell: 11, boost: 5, teach: false}, // 11 → 16
    {cell: 18, boost: 4, teach: false}, // 18 → 22
  ];
  // Collectible tokens ON the track (not exclusive treasures).
  // Hard seats: off cushion-boost arcs so bounce-pass doesn't auto-claim.
  const tokens = [
    {cell: 2, id: 'star-token'},       // early — slide-3 next
    {cell: 9, id: 'moon-penny'},       // squeeze before slide-10
    {cell: 23, id: 'everyday-penny'},  // late crest approach past slide-20
  ];
  // Chapter keepsake: same visual size as tokens; off bounce arcs (11→16, 18→22).
  const treasureCell = 17; // tap/jump claim between cush-11 zone and cush-18
  // Hopper sits near crest, slightly off-track (loads balls at top).
  const hopper = {u: 0.92, ox: 48, oy: -28};
  return {
    slides, cushions, tokens, treasureCell, hopper,
    cellCount: CELL_COUNT, duration: RIDE_SECONDS,
  };
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

function slideAt(s, cellIdx) {
  return (s.slides || []).find((S) => S.cell === cellIdx);
}

function cushionAt(s, cellIdx) {
  return (s.cushions || []).find((C) => C.cell === cellIdx);
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
  if ((s.slideFlash || 0) > 0) s.slideFlash = Math.max(0, s.slideFlash - dt);
  if ((s.cushionFlash || 0) > 0) s.cushionFlash = Math.max(0, s.cushionFlash - dt);
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
  s.lastCell = from;
  s.moveT = 0;
  const jumpish = reason === 'jump' || reason === 'cushion';
  s.moveDur = reducedMotion(s) ? 0.08 : (jumpish ? JUMP_EASE : STEP_EASE);
  s.moveReason = reason || 'tap';
  const a = cellAt(s, from);
  const b = cellAt(s, to);
  s.youX = a.x;
  s.youY = a.y;
  s._moveAx = a.x;
  s._moveAy = a.y;
  s._moveBx = b.x;
  s._moveBy = b.y;
  // Arc loft for jump / cushion bounce.
  s._moveArc = jumpish ? (reason === 'cushion' ? 56 : (reason === 'jump' ? 64 : 48)) : (reason === 'tap' || reason === 'tap-back' ? 6 : 0);
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function tryCollectToken(s, idx) {
  const tok = (s.tokens || []).find((T) => T.cell === idx && !T.taken);
  if (!tok) return;
  tok.taken = true;
  s.tokensTaken = (s.tokensTaken || 0) + 1;
  logAction(s, 'token', {cell: idx, id: tok.id});
  if (s.eligible) {
    recordFind(s, tok.id, RIDE);
    s.note = 'Token! ' + tok.id.replace(/-/g, ' ');
  } else {
    s.note = 'Practice token glimpse — paid rides keep finds.';
  }
  s.statusCopy = 'Token';
  const c = cellAt(s, idx);
  pushSparks(s, c.x, c.y, false);
  s.matPulse = 0.5;
}

function tryCollectTreasure(s, idx) {
  if (!s.treasure || s.treasure.taken || s.treasure.cell !== idx) return;
  // Collect whenever the ride is live (practice OR paid) — Lorie: claim on pass.
  if (s.result || s.broke) return;
  if (s.eligible) {
    recordTreasure(s, s.treasure.id);
    logAction(s, 'treasure', {cell: idx, id: s.treasure.id});
    s.note = 'KEEPSAKE! Spiral tower secured.';
    s.statusCopy = 'KEEPSAKE!';
  } else {
    s.note = 'KEEPSAKE! Practice glimpse — paid rides can keep it.';
    s.statusCopy = 'KEEPSAKE!';
    logAction(s, 'treasure-practice', {cell: idx});
  }
  s.treasure.taken = true;
  s.treasureRevealed = true;
  s.keepsakeTaken = true;
  const c = cellAt(s, idx);
  pushSparks(s, c.x, c.y, false);
  s.matPulse = 1.0;
  s.ladderFlash = 0.9; // reuse cream flash as claim pop
  pushFx(s, {kind: 'label', x: c.x, y: c.y - 50, text: 'KEEPSAKE!', life: 1.2, soft: false});
}

/** Claim keepsake + tokens on every cell traversed from→to inclusive. */
function collectAlong(s, from, to) {
  const a = from | 0;
  const b = to | 0;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  for (let i = lo; i <= hi; i++) {
    tryCollectTreasure(s, i);
    tryCollectToken(s, i);
  }
  s.lastCell = b;
}

/**
 * Ball near YOU → soft dump to BOTTOM cell 0 (never abort).
 * Skip if this landing cleared the ball via JUMP over it.
 */
function maybeBallKnock(s, opts) {
  if (!s.ballActive || s.moving || s.result || s.broke) return false;
  if (opts && opts.jumpedOver) return false;
  if ((s.moveReason || '') === 'ball') return false;
  const idx = s.youCell | 0;
  if (idx <= 0) return false; // already at bottom terminus
  // PIXEL meet only — cell-index false-fires across stacked spiral layers.
  if (!ballMeetsYou(s)) return false;
  logAction(s, 'ball-knock', {cell: idx, ballU: s.ballU, dist: s._ballDist});
  s.note = 'BALL DUMP! Soft dump to the bottom — ride continues.';
  s.statusCopy = 'BALL DUMP';
  s.slideFlash = 1.1;
  s.matPulse = 0.85;
  s.finishPulse = Math.max(s.finishPulse || 0, 0.45);
  const c = cellAt(s, idx);
  pushSparks(s, c.x, c.y, true);
  pushSparks(s, s.ballX || c.x, s.ballY || c.y, true);
  pushFx(s, {kind: 'label', x: c.x, y: c.y - 48, text: 'BALL DUMP!', life: 1.15, soft: true});
  s._ballCleared = false;
  beginCellMove(s, 0, 'ball');
  return true;
}

/**
 * Resolve landing on a cell: pass-claim, cushion bounce, slide dump, ball knock.
 * Soft dump never aborts. One transit at a time (no stacked auto-chains).
 */
function resolveLanding(s) {
  const idx = s.youCell | 0;
  const from = s.moveFrom != null ? (s.moveFrom | 0) : idx;
  collectAlong(s, from, idx);

  // JUMP that cleared the skipped cell does not get ball-knocked for that hop.
  const jumpedOver = !!(s._ballCleared && (s.moveReason === 'jump'));
  s._ballCleared = false;
  if (maybeBallKnock(s, {jumpedOver})) return;

  // Cushion bounce UP first (prefer boost over slide if somehow co-located — they aren't).
  const C = cushionAt(s, idx);
  if (C) {
    const dest = clamp(C.cell + C.boost, 0, (s.cells || []).length - 1);
    const first = !C.used;
    if (first) {
      C.used = true;
      s.cushionsBounced = (s.cushionsBounced || 0) + 1;
      logAction(s, 'cushion', {cell: idx, dest, n: s.cushionsBounced, teach: !!C.teach});
      recordFind(s, 'cell-' + idx, RIDE);
      s.note = C.teach
        ? 'CUSHION UP! Bounce up the coil.'
        : 'CUSHION UP! ' + s.cushionsBounced + '/' + CUSHION_GOAL;
      s.statusCopy = 'UP! ' + s.cushionsBounced + '/' + CUSHION_GOAL;
    } else {
      logAction(s, 'cushion-rehit', {cell: idx, dest});
      s.note = 'Cushion again — bounce on.';
      s.statusCopy = 'Bounce';
    }
    s.cushionFlash = 0.7;
    const c = cellAt(s, idx);
    pushSparks(s, c.x, c.y, false);
    pushFx(s, {kind: 'label', x: c.x, y: c.y - 44, text: first ? 'UP!' : 'UP!', life: 0.95, soft: false});
    beginCellMove(s, dest, 'cushion');
    return;
  }

  const S = slideAt(s, idx);
  if (S) {
    const dest = clamp(S.cell - S.dump, 0, (s.cells || []).length - 1);
    S.used = true;
    s.slidesSurvived = (s.slidesSurvived || 0) + 1;
    logAction(s, 'slide', {cell: idx, dest, n: s.slidesSurvived});
    s.slideFlash = 0.85;
    const c = cellAt(s, idx);
    pushSparks(s, c.x, c.y, true);
    pushFx(s, {kind: 'label', x: c.x, y: c.y - 44, text: 'SLIDE DOWN!', life: 1.0, soft: true});
    s.note = S.teach
      ? 'SLIDE DOWN! Soft dump — climb again. Ride continues.'
      : 'SLIDE DOWN! Jump over next time. Ride continues.';
    s.statusCopy = 'SLIDE DOWN';
    // Soft dump DOWN — never abort / never broke.
    beginCellMove(s, dest, 'slide');
    return;
  }
}

function clearOk(s) {
  const keepsake = !!(s.keepsakeTaken || (s.treasure && s.treasure.taken));
  const atTop = (s.youCell | 0) >= ((s.cells || []).length - 1);
  const cushions = (s.cushionsBounced || 0) >= CUSHION_GOAL;
  return keepsake && (atTop || cushions);
}

/** Queue one pending move if mid-ease (keeps climb responsive). */
function queueMove(s, kind) {
  if (s.result || s.broke || !s.launched) return false;
  if (s.moving) {
    s._queued = kind; // 'tap' | 'back' | 'jump'
    return true;
  }
  if (kind === 'tap') return doTapNow(s);
  if (kind === 'back') return doTapBackNow(s);
  if (kind === 'jump') return doJumpNow(s);
  return false;
}

function flushQueue(s) {
  const q = s._queued;
  s._queued = null;
  if (!q || s.result || s.broke) return;
  if (q === 'tap') doTapNow(s);
  else if (q === 'back') doTapBackNow(s);
  else if (q === 'jump') doJumpNow(s);
}

/** Advance one cell UP the spiral (→ forward). */
function doTap(s) { return queueMove(s, 'tap'); }
function doTapBack(s) { return queueMove(s, 'back'); }
function doJump(s) { return queueMove(s, 'jump'); }

function doTapNow(s) {
  if (s.result || s.broke || s.moving) return false;
  if (!s.launched) return false;
  const n = (s.cells || []).length;
  const next = Math.min((s.youCell | 0) + 1, n - 1);
  if (next === (s.youCell | 0)) {
    maybeFinish(s, 'crest');
    return false;
  }
  s.tappedOnce = true;
  logAction(s, 'tap', {from: s.youCell, to: next});
  beginCellMove(s, next, 'tap');
  s.note = 'Up the spiral';
  return true;
}

/** One cell DOWN / back (←). */
function doTapBackNow(s) {
  if (s.result || s.broke || s.moving) return false;
  if (!s.launched) return false;
  const prev = Math.max(0, (s.youCell | 0) - 1);
  if (prev === (s.youCell | 0)) return false;
  logAction(s, 'tap-back', {from: s.youCell, to: prev});
  beginCellMove(s, prev, 'tap-back');
  s.note = 'Back a step';
  return true;
}

/**
 * JUMP:
 *   next cell is CUSHION → land ON it (bounce UP)
 *   next cell is SLIDE → leap OVER it (+2, safe)
 *   else hop +2 up the coil
 */
function doJumpNow(s) {
  if (s.result || s.broke || s.moving) return false;
  if (!s.launched) return false;
  const n = (s.cells || []).length;
  const from = s.youCell | 0;
  const next = Math.min(from + 1, n - 1);
  const over2 = Math.min(from + 2, n - 1);
  let land = over2;
  let tag = 'JUMP!';
  if (next === from) {
    maybeFinish(s, 'crest');
    return false;
  }
  if (cushionAt(s, next)) {
    land = next; // JUMP onto cushion → resolveLanding boosts UP
    tag = 'JUMP UP!';
  } else if (slideAt(s, next)) {
    land = over2; // JUMP over slide
    tag = 'JUMP OVER!';
  } else {
    land = over2;
  }
  if (land === from) {
    maybeFinish(s, 'crest');
    return false;
  }
  s.jumpedOnce = true;
  const clearedBall = !!(s.ballActive && (ballMeetsYou(s) || ballCellNear(s, next)));
  s._ballCleared = clearedBall && land !== next;
  if (clearedBall && land !== next) {
    logAction(s, 'ball-jump', {cell: next});
    s.note = 'Jumped the ball!';
    s.statusCopy = 'Ball clear';
    pushSparks(s, s.ballX || CX, s.ballY || Y_BOT, false);
  } else {
    s.note = tag;
    s.statusCopy = tag;
  }
  logAction(s, 'jump', {from, next, to: land, tag});
  {
    const c = cellAt(s, from);
    pushFx(s, {kind: 'label', x: c.x, y: c.y - 42, text: tag, life: 0.6, soft: false});
    s.matPulse = Math.max(s.matPulse || 0, 0.45);
  }
  beginCellMove(s, land, 'jump');
  return true;
}

function ballCellNear(s, cellIdx) {
  if (s.ballU == null || !s.ballActive) return false;
  const n = (s.cells || []).length;
  if (n < 2) return false;
  const bu = clamp(s.ballU, 0, 1);
  const bi = Math.round(bu * (n - 1));
  return Math.abs(bi - (cellIdx | 0)) <= 2;
}

/** Pixel meet — ball must actually touch Bea (not just same spiral cell index). */
function ballMeetsYou(s) {
  if (!s.ballActive || s.ballX == null || s.youX == null) return false;
  if ((s.youCell | 0) <= 0) return false;
  const dist = Math.hypot((s.ballX || 0) - (s.youX || 0), (s.ballY || 0) - (s.youY || 0));
  s._ballDist = dist;
  // Tight: Bea ~28r + ball ~16r; require real overlap, not adjacent coil.
  return dist < 36;
}

/** Cream-bottom pad layout (canvas 900×1200) — big phone targets. */
function creamPads() {
  const y = 1088;
  const h = 96;
  const jumpW = 240;
  const sideW = 110;
  const gap = 22;
  const mid = CX;
  const jump = {id: 'jump', x: mid - jumpW / 2, y, w: jumpW, h, label: 'JUMP'};
  const left = {id: 'left', x: jump.x - gap - sideW, y, w: sideW, h, label: '←'};
  const right = {id: 'right', x: jump.x + jumpW + gap, y, w: sideW, h, label: '→'};
  return [left, jump, right];
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
  const ok = clearOk(s);
  const atTop = (s.youCell | 0) >= ((s.cells || []).length - 1);
  if (!ok && why !== 'timeout') return;
  if (ok || why === 'timeout') {
    s.challengeOkFlash = ok;
    s.finishPulse = 1.3;
    s.matPulse = 0.55;
    s.statusCopy = ok ? 'Clear!' : 'Short';
    s.note = ok
      ? (atTop ? 'Crest + keepsake — Practice clear!' : 'Keepsake + cushions — spiral clear!')
      : 'Need keepsake and crest (or 3 cushions). Ride returns.';
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
  const cell = s.planTreasureCell != null ? s.planTreasureCell : 13;
  s.treasure = {
    id: s.treasureId || TREASURES[0],
    cell,
    taken: false,
  };
  s.treasureRevealed = true; // on-track keepsake is visible
  s.keepsakeTaken = false;
}

function coachNote(s) {
  if (!s.launched) return '→ climb up · ← back · JUMP to hop';
  if (clearOk(s)) return s.note || 'Clear!';
  const idx = s.youCell | 0;
  const teachC = (s.cushions || []).find((C) => C.teach && !C.used);
  if (teachC && idx < teachC.cell) {
    return 'TAP up — JUMP onto the cream cushion for a boost';
  }
  const teachS = (s.slides || []).find((S) => S.teach && !S.used);
  if (teachS && idx >= teachS.cell - 2 && idx < teachS.cell) {
    return 'Deep-red slide ahead — JUMP over it, or ride the soft dump';
  }
  if (s.treasure && !s.treasure.taken && idx < s.treasure.cell) {
    return 'Keepsake on the coil — TAP or JUMP onto it';
  }
  if ((s.cushionsBounced || 0) < CUSHION_GOAL && s.treasure && s.treasure.taken) {
    return 'Keepsake secured — crest or ' + CUSHION_GOAL + ' cushions to clear';
  }
  return s.note || 'TAP-TAP-TAP — JUMP cushions / over slides';
}


/** Cradle + celestial gauge as bold cream track-side scenery (y < cream pads). */
function drawSkipScenery(d) {
  const imgs = ensureSkipProps();
  // Left mid court — moon cradle
  placeDress(d, imgs.cradle, 118, 720, 88, -0.12);
  // Right upper court — celestial gauge
  placeDress(d, imgs.gauge, 782, 430, 72, 0.08);
}

/** Bold deep-red chute — bigger, aimed DOWN the spiral toward the lower layer. */
function drawSlideProp(d, cell, flash) {
  if (!cell) return;
  const x = cell.x, y = cell.y;
  const u = cell.u != null ? cell.u : 0;
  // Downhill = toward lower u (bottom of spiral).
  const down = spiralPoint(Math.max(0, u - 0.035));
  const downhillAng = Math.atan2(down.y - y, down.x - x);
  const imgs = ensureSkipProps();
  if (flash) d.glow(x, y, 32, BURGUNDY);
  else d.glow(x, y, 22, SLIDE_FILL);
  // LONGER not fatter: stretch along downhill toward lower coil (snake length).
  const artAng = downhillAng + 0.35;
  // Tall natural aspect: large height, modest width — reads long on the track.
  if (placeDress(d, imgs.slide, x + Math.cos(downhillAng) * 18, y + Math.sin(downhillAng) * 18, 64, artAng, 120)) return;
  // Fallback wedge — long tip downhill.
  const tipX = x + Math.cos(downhillAng) * 52;
  const tipY = y + Math.sin(downhillAng) * 52;
  const w = 16;
  const nx = -Math.sin(downhillAng), ny = Math.cos(downhillAng);
  const poly = [
    {x: x + nx * w, y: y + ny * w - 2},
    {x: x - nx * w, y: y - ny * w - 2},
    {x: tipX - nx * 5, y: tipY - ny * 5 + 4},
    {x: tipX + nx * 5, y: tipY + ny * 5 + 4},
  ];
  d.poly(poly.map((p) => ({x: p.x + 2, y: p.y + 3})), TRACK_SHADOW + '88', TRACK_SHADOW, 1);
  d.poly(poly, SLIDE_FILL + 'f2', SLIDE_DEEP, 2.2);
  d.path([{x, y: y - 2}, {x: tipX, y: tipY + 2}], CREAM + '66', 3, false, null);
  d.text('SLIDE', x, y - 26, 12, CREAM);
}

/** Bold cream+gold cushion — Aura tufted-cushion sprite, vector fallback. */
function drawCushionProp(d, cell, flash) {
  if (!cell) return;
  const x = cell.x, y = cell.y;
  if (flash) d.glow(x, y, 30, GOLD);
  else d.glow(x, y, 20, CREAM);
  const imgs = ensureSkipProps();
  if (placeDress(d, imgs.cushion, x, y - 2, 48)) return;
  d.ellipse(x + 2, y + 5, 20, 12, TRACK_SHADOW + '66');
  d.ellipse(x, y, 19, 11, CUSHION_FILL + 'f4', CUSHION_DEEP, 2.4);
  d.ellipse(x - 3, y - 3, 10, 5, GOLD + 'aa', CREAM_DEEP + '88', 1);
  d.ellipse(x + 4, y + 2, 7, 4, CREAM + '77');
  d.circle(x, y, 3, CUSHION_DEEP + 'cc', CREAM_DEEP, 1);
  d.text('CUSHION', x, y - 20, 10, BURGUNDY_DEEP);
}

/** Hopper / dispenser near crest — Aura star-drum; pulse while reloading. */
function drawHopper(d, s) {
  const h = s.hopper || {u: 0.92, ox: 48, oy: -28};
  const p = spiralPoint(h.u);
  const x = p.x + (h.ox || 0);
  const y = p.y + (h.oy || 0);
  const waiting = (s.ballWait || 0) > 0;
  if (waiting) d.glow(x, y - 4, 28 + Math.sin((s.t || 0) * 10) * 6, GOLD);
  const imgs = ensureSkipProps();
  const placed = placeDress(d, imgs.hopper, x, y, waiting ? 58 : 52);
  if (!placed) {
    d.poly([
      {x: x - 18, y: y - 8},
      {x: x + 18, y: y - 8},
      {x: x + 14, y: y + 16},
      {x: x - 14, y: y + 16},
    ].map((q) => ({x: q.x + 2, y: q.y + 3})), TRACK_SHADOW + '77', TRACK_SHADOW, 1);
    d.poly([
      {x: x - 18, y: y - 8},
      {x: x + 18, y: y - 8},
      {x: x + 14, y: y + 16},
      {x: x - 14, y: y + 16},
    ], HOPPER_FILL + 'f4', HOPPER_DEEP, 2);
    d.ellipse(x, y - 10, 16, 7, TRACK_EDGE + 'ee', CREAM_DEEP, 1.5);
    d.ellipse(x, y - 10, 10, 4, HOPPER_DEEP + 'cc');
    d.poly([
      {x: x - 8, y: y + 12},
      {x: x + 8, y: y + 12},
      {x: p.x + 6, y: p.y + 4},
      {x: p.x - 6, y: p.y + 4},
    ], SLIDE_DEEP + 'dd', TRACK_EDGE, 1.5);
    if (!waiting) d.text('HOPPER', x, y + 28, 9, CREAM);
  }
  if (waiting) d.text('…', x, y - 30, 14, GOLD);
  if (waiting && (s.ballWait || 0) < 0.55) {
    drawBall(d, x, y - 6, 8);
  }
}

function drawFx(d, s) {
  for (const fx of s.fx || []) {
    if (fx.kind === 'spark') {
      const alpha = clamp(fx.life / 0.5, 0, 1);
      d.circle(fx.x, fx.y, 3 + alpha * 2, (fx.soft ? BURGUNDY : GOLD) + Math.round(alpha * 200).toString(16).padStart(2, '0'));
    } else if (fx.kind === 'label') {
      d.text(fx.text, fx.x, fx.y, 16, fx.soft ? BURGUNDY : CREAM);
    }
  }
}

/** Gold celestial ball — Aura star-ball sprite, vector fallback. */
function drawBall(d, x, y, r) {
  d.glow(x, y, r * 2.1, GOLD);
  const imgs = ensureSkipProps();
  const w = Math.max(28, r * 2.2);
  if (placeDress(d, imgs.ball, x, y, w)) return;
  d.ellipse(x + 2, y + 4, r * 0.95, r * 0.55, TRACK_SHADOW + '55');
  d.circle(x, y, r + 1.5, BALL_GOLD_DEEP + 'ee', TRACK_EDGE, 1.2);
  d.circle(x, y, r, BALL_GOLD + 'f8', BALL_GOLD_DEEP, 1.8);
  d.circle(x - r * 0.28, y - r * 0.32, r * 0.38, BALL_GOLD_HI + 'dd');
  d.circle(x - r * 0.18, y - r * 0.22, r * 0.14, '#fffaf0cc');
}

function loadBallFromHopper(s) {
  s.ballU = 1;
  s.ballActive = true;
  s.ballRolling = true;
  s.ballWait = 0;
  const bp = spiralPoint(1);
  s.ballX = bp.x;
  s.ballY = bp.y;
  logAction(s, 'ball-load', {});
  s.note = 'Hopper loads a fresh ball!';
  pushSparks(s, bp.x, bp.y, false);
}

export default {
  title: 'Spiral Slide',
  intro: 'Choose your spiral. Catch what tumbles. TAP along Tilly’s helter — JUMP onto cream cushions to bounce up; JUMP over deep-red slides (or ride the soft dump — never aborts). Collect the spiral-tower keepsake, then crest or bounce 3 cushions to clear.',
  instructions: 'Climb with ← JUMP → in the cream (or arrows / space). ←/→ TAP along the coil; JUMP leaps over the next cell. Land on a slide = soft dump down (ride continues). JUMP onto a cushion = bounce up. Collect keepsake + tokens on the track. Clear Practice: keepsake AND (crest OR 3 cushions). First chapter ride is free practice and keeps nothing; later rides cost a penny.',
  levels: LEVEL_NAMES,
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 70,
  actions: [],
  create(level, rng) {
    const rand = typeof rng === 'function' ? rng : Math.random;
    const plan = ch1Board(); // Ch2–6 frozen: same First Spiral board until Aura reopens
    const cells = buildSpiral(plan.cellCount);
    const slides = plan.slides.map((S) => ({...S, used: false}));
    const cushions = plan.cushions.map((C) => ({...C, used: false}));
    const tokens = plan.tokens.map((T) => ({...T, taken: false}));
    const start = cells[0];
    const crest = spiralPoint(1);
    return makeRideState(level, rand, {
      hits: 0,
      cushionsBounced: 0,
      slidesSurvived: 0,
      tokensTaken: 0,
      keepsakeTaken: false,
      goal: CUSHION_GOAL,
      treasureId: TREASURES[level] || TREASURES[0],
      cells,
      slides,
      cushions,
      tokens,
      hopper: plan.hopper,
      planTreasureCell: plan.treasureCell,
      duration: plan.duration,
      frozenChapter: level > 0,
      youCell: 0,
      lastCell: 0,
      _ballCleared: false,
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
      tappedOnce: false,
      jumpedOnce: false,
      fx: [],
      matPulse: 0,
      finishPulse: 0,
      slideFlash: 0,
      cushionFlash: 0,
      statusCopy: '',
      challengeOkFlash: false,
      pendingLand: false,
      // Gold ball prop: u=1 crest → u=0 stairs-base exit (rolls down).
      ballU: 1,
      ballX: crest.x,
      ballY: crest.y,
      ballRolling: true,
      ballActive: true,
      ballWait: 0,
    });
  },
  update(s, dt, input) {
    tickFx(s, dt);
    if (s.result || s.broke) return;

    const spawnIds = (s.cells || []).map((_, i) => 'cell-' + i);
    if (ensureBoarded(s, RIDE, s.treasureId, spawnIds.length ? spawnIds : ['cell-0', 'cell-17', 'cell-9'])) {
      s.previewing = true;
      s.previewT = 0;
      s.launched = false;
      s.t = 0;
      s.progress = 0;
      s.fx = [];
      s.matPulse = 0;
      s.finishPulse = 0;
      s.slideFlash = 0;
      s.cushionFlash = 0;
      s.statusCopy = '';
      s.tappedOnce = false;
      s.jumpedOnce = false;
      s.moving = false;
      s.youCell = 0;
      s.lastCell = 0;
      s._ballCleared = false;
      const c0 = cellAt(s, 0);
      s.youX = c0.x;
      s.youY = c0.y;
      s.hits = 0;
      s.cushionsBounced = 0;
      s.slidesSurvived = 0;
      s.tokensTaken = 0;
      s.keepsakeTaken = false;
      for (const S of s.slides || []) S.used = false;
      for (const C of s.cushions || []) C.used = false;
      for (const T of s.tokens || []) T.taken = false;
      s.ballU = 1;
      s.ballRolling = true;
      s.ballActive = true;
      s.ballWait = 0;
      {
        const bp = spiralPoint(1);
        s.ballX = bp.x; s.ballY = bp.y;
      }
      s.note = s.frozenChapter
        ? 'Chapter frozen — First Spiral board (Ch2–6 pending Aura). TAP up.'
        : 'TAP along the spiral — JUMP onto cushions, over slides';
      if (s.eligible) {
        const prefer = s.planTreasureCell != null ? s.planTreasureCell : 17;
        const preferred = 'cell-' + prefer;
        if (s.spawnId && String(s.spawnId).startsWith('cell-')) {
          const idx = Number(String(s.spawnId).replace('cell-', ''));
          // Keep seal spawn near authored hard-seat keepsake (±2).
          if (!(idx >= prefer - 2 && idx <= prefer + 2)) s.spawnId = preferred;
        } else {
          s.spawnId = preferred;
        }
        const idx = Number(String(s.spawnId).replace('cell-', ''));
        const raw = Number.isFinite(idx) ? idx : prefer;
        s.planTreasureCell = clamp(raw, prefer - 2, prefer + 2);
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
        s.note = 'TAP along the spiral — JUMP onto cushions, over slides';
        s.statusCopy = 'Climbing';
        logAction(s, 'release', {});
        spawnTreasure(s);
      }
      return;
    }

    s.t += dt;
    s.progress = Math.min(1, s.t / Math.max(0.01, s.duration || RIDE_SECONDS));

    // Gold ball rolls DOWN; when off bottom, WAIT then hopper reloads.
    if (s.ballWait > 0) {
      s.ballWait -= dt;
      if (s.ballWait <= 0) {
        s.ballWait = 0;
        loadBallFromHopper(s);
      }
    } else if (s.ballActive && s.ballRolling !== false) {
      const bu = s.ballU == null ? 1 : s.ballU;
      const rate = (1 / Math.max(0.01, BALL_ROLL_SECS)) * (0.55 + (1 - bu) * 1.35);
      s.ballU = Math.max(0, bu - dt * rate);
      if (s.ballU <= 0) {
        s.ballU = 0;
        s.ballRolling = false;
        s.ballActive = false;
        s.ballWait = BALL_WAIT_SECS;
        logAction(s, 'ball-exit', {});
        s.note = 'Ball off the bottom — hopper reloading…';
      }
      const bp = spiralPoint(s.ballU);
      s.ballX = bp.x;
      s.ballY = bp.y;
      // Live meet: ball rolling into Bea knocks to bottom (unless mid JUMP clear).
      if (!s.moving && !(s._ballCleared && s.moveReason === 'jump')) {
        maybeBallKnock(s, {});
      }
    }

    // Pass-claim while easing across keepsake/token cells.
    if (s.moving && s.treasure && !s.treasure.taken) {
      const a = s.moveFrom | 0;
      const b = s.moveTo | 0;
      const u = clamp(s.moveT / Math.max(0.001, s.moveDur || STEP_EASE), 0, 1);
      const mid = Math.round(a + (b - a) * u);
      tryCollectTreasure(s, mid);
      tryCollectToken(s, mid);
    }

    // Ease YOU along current move; resolve landing when ease completes.
    if (s.moving) {
      s.moveT += dt;
      const u = clamp(s.moveT / Math.max(0.001, s.moveDur || STEP_EASE), 0, 1);
      const e = easeInOut(u);
      const ax = s._moveAx ?? s.youX;
      const ay = s._moveAy ?? s.youY;
      const bx = s._moveBx ?? s.youX;
      const by = s._moveBy ?? s.youY;
      s.youX = ax + (bx - ax) * e;
      s.youY = ay + (by - ay) * e;
      // Jump / cushion loft arc.
      const arc = s._moveArc || 0;
      if (arc > 0) s.youY -= Math.sin(Math.PI * e) * arc;
      if (u >= 1) {
        s.moving = false;
        s.youCell = s.moveTo | 0;
        const c = cellAt(s, s.youCell);
        s.youX = c.x;
        s.youY = c.y;
        resolveLanding(s);
        if (!s.moving) {
          if (clearOk(s)) maybeFinish(s, 'goal');
          else if ((s.youCell | 0) >= ((s.cells || []).length - 1)) maybeFinish(s, 'crest');
          else {
            s.note = coachNote(s);
            flushQueue(s);
          }
        }
      }
    } else {
      // Ball rolls onto standing YOU → soft dump to cell 0 (JUMP-over handled on hop).
      if (!maybeBallKnock(s)) s.note = coachNote(s);
    }

    if (s.t >= (s.duration || RIDE_SECONDS)) {
      maybeFinish(s, 'timeout');
    }
  },
  action(s, id, down) {
    if (!down || s.result || s.broke) return;
    if (id === 'jump') doJump(s);
    else if (id === 'left') doTapBack(s);
    else if (id === 'right' || id === 'step') doTap(s);
  },
  pointer(s, type, p) {
    if (s.result || s.broke || !p) return;
    // Pads fire on down (phone-snappy); ignore move/cancel.
    if (type === 'down') {
      const hit = hitPad(p);
      if (hit === 'left') { s._padArmed = 'left'; doTapBack(s); return; }
      if (hit === 'jump') { s._padArmed = 'jump'; doJump(s); return; }
      if (hit === 'right') { s._padArmed = 'right'; doTap(s); return; }
      s._padArmed = null;
      return;
    }
    if (type === 'up') {
      // Court tap ahead/near YOU = forward (not after a pad press).
      if (s._padArmed) { s._padArmed = null; return; }
      if (typeof p.y === 'number' && p.y < 1060) {
        const ahead = p.y < (s.youY || Y_BOT) - 8;
        const near = Math.hypot((p.x || 0) - (s.youX || CX), (p.y || 0) - (s.youY || Y_BOT)) < 140;
        if (ahead || near) doTap(s);
      }
    }
  },
  key(s, k, down) {
    if (!down || s.result || s.broke) return;
    if (k === 'ArrowLeft') doTapBack(s);
    else if (k === 'ArrowRight') doTap(s);
    else if (k === 'ArrowUp' || k === ' ' || k === 'Enter' || k === 'j' || k === 'J') doJump(s);
  },
  draw(s, d) {
    const cells = s.cells || [];
    ensureSkipProps();
    // Soft vignette only — do not hide helter.png court.
    d.ellipse(CX, 640, 400, 540, '#4a182410');

    // Bold cream scenery (cradle + gauge) — away from cream pads (y≥1088).
    drawSkipScenery(d);

    // RED TRACK is the star — thick coiled ribbon with back→front layering.
    drawSpiralTrack(d);

    // Faint cell centers on the ribbon (readable footholds, not geometry lines).
    for (const c of cells) {
      d.circle(c.x, c.y, 4, '#f4d59028', TRACK_EDGE + '55', 1);
    }

    // SLIDE chute wedges (deep-red) sit ON the track.
    for (const S of s.slides || []) {
      drawSlideProp(d, cells[S.cell], (s.slideFlash || 0) > 0 && (s.youCell | 0) === S.cell);
    }

    // CUSHION plump ovals (cream+gold) sit ON the track.
    for (const C of s.cushions || []) {
      drawCushionProp(d, cells[C.cell], (s.cushionFlash || 0) > 0 && (s.youCell | 0) === C.cell);
    }

    // Track tokens (star / moon / everyday).
    for (const T of s.tokens || []) {
      if (T.taken) continue;
      const tc = cells[T.cell];
      if (!tc) continue;
      d.glow(tc.x, tc.y, 18, GOLD);
      try {
        const key = typeof spriteKey === 'function' ? spriteKey(T.id) : T.id;
        d.item?.(key, tc.x, tc.y, {w: 28, alpha: 0.92});
      } catch {
        d.star(tc.x, tc.y, 10, CREAM);
      }
    }

    // Chapter keepsake — normal token size (same w as track tokens).
    if (s.treasure && !s.treasure.taken) {
      const tc = cellAt(s, s.treasure.cell);
      if (tc) {
        d.glow(tc.x, tc.y, 18, GOLD);
        try {
          const key = typeof spriteKey === 'function' ? spriteKey(s.treasure.id) : s.treasure.id;
          d.item?.(key, tc.x, tc.y, {w: 28, alpha: 0.92});
        } catch {
          d.star(tc.x, tc.y, 10, CREAM);
        }
        d.text('KEEP', tc.x, tc.y - 22, 10, GOLD);
      }
    }

    // Crest bullseye.
    const top = cells[cells.length - 1];
    if (top) {
      d.ellipse(top.x, top.y + 2, 26, 14, TRACK_SHADOW + '44');
      d.ellipse(top.x, top.y, 20, 11, CREAM + '55', CREAM_DEEP + '99', 1.5);
      d.ellipse(top.x, top.y, 8, 5, GOLD + '66', CREAM_DEEP + '88', 1);
    }

    // Hopper near crest (reloads balls).
    drawHopper(d, s);

    // Gold celestial ball on the ribbon — rolls crest→stairs (hidden while waiting).
    if (s.ballActive) {
      const bx = s.ballX ?? spiralPoint(s.ballU == null ? 1 : s.ballU).x;
      const by = s.ballY ?? spiralPoint(s.ballU == null ? 1 : s.ballU).y;
      drawBall(d, bx, by, BALL_R);
    }

    // YOU = bea-player (~52–60w) with soft glow; fallback marker if unloaded.
    const yx = s.youX ?? (cells[0] && cells[0].x) ?? CX;
    const yy = s.youY ?? (cells[0] && cells[0].y) ?? Y_BOT;
    if ((s.cushionFlash || 0) > 0) d.glow(yx, yy, 36 + s.cushionFlash * 20, CREAM);
    if ((s.slideFlash || 0) > 0) d.glow(yx, yy, 34 + s.slideFlash * 18, BURGUNDY);
    d.glow(yx, yy + 10, 28, GOLD);
    d.ellipse(yx + 2, yy + 18, 22, 8, TRACK_SHADOW + '44');
    ensureSkipProps();
    const beaOk = placeDress(d, beaPlayerImg, yx, yy - 8, 56);
    if (!beaOk) {
      d.circle(yx, yy, 14, YOU_FILL + 'ee', CREAM_DEEP, 2);
      d.text('YOU', yx, yy + 1, 11, BURGUNDY_DEEP);
    }

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
