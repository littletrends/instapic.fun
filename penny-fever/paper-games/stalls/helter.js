/*
 * Spiral Slide (helter) — Chapters 1–4 (First Spiral, Bunting Bend, Tunnel Turn, Three-Way Tower).
 * Locked remix: Snakes & Ladders on a helter + Helix/Tempest DNA.
 * ONE verb: TURN the ring (drag/swipe around the tower) so a ladder faces you
 * (boost/safe) or a snake faces you (soft dump/redirect — never abort paid ride).
 * The tower/ring is the toy. Paper 1-layer 2D; helter.png court stays hero —
 * translucent overlays only, no solid court overpaint.
 * Tagline: Choose your spiral. Catch what tumbles.
 *
 * Implemented:
 *   1 First Spiral — TURN / ladder / snake core
 *   2 Bunting Bend — burgundy cushions / rolled mats on some ring arcs;
 *     taught alone (long warn) before later chapters mix more hazards
 *   3 Tunnel Turn — short tunnels; warning symbol shows exit notch before darkness;
 *     taught alone (no new cushion teach on Ch3); dim ring art in dark, symbol stays
 *   4 Three-Way Tower — three notches that reconnect; landmark colours + tiny map;
 *     teach alone (long warn); third notch = soft reconnect (no ladder credit);
 *     mild remix: one cushion max after teach; Ch3 tunnels only when level===2
 *
 * Unfinished chapters 5–6:
 *   5 Runaway Keepsake — treasure hops rings only after visible bounce + arrow
 *   6 The Impossible Descent — do not stack max speed + darkness + tiny intercept; widen final collision
 */
import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
  prefersReducedMotion,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'helter';
const TREASURES = ['spiral-tower', 'star-token', 'moon-penny', 'prize-bag', 'ride-ticket', 'lucky-match'];
const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
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
const TOWER_TOP = 210;
const TOWER_BOT = 980;
const MAT_Y = 920;
const RIDE_SECONDS = 41;
const PREVIEW_SECS = 2.2;
const TEACH_SECS = 5;
const GOAL = 3;
const RING_COUNT = 5;
const FX_CAP = 48;
/** Angular half-width that counts as "facing you" at the bottom notch. */
const FACE_SNAP = Math.PI / 2.4;
const NUDGE = Math.PI / 10;
/** Angular half-width of a cushion / rolled-mat obstacle on a ring arc. */
const CUSHION_HALF = Math.PI / 6.5; // narrower so ladder snap stays clearable
/** Long lead warning before the first teach-cushion ring (Bunting Bend). */
const CUSHION_WARN_SECS = 8.0; // clearer teach window (Aura Ch2 FAIL)
/** Lead time to show exit symbol before tunnel darkness (Tunnel Turn). */
const TUNNEL_WARN_SECS = 7.5; // clearer symbol window before dark
/** Seconds before commit when the tunnel ring goes dark (symbol stays readable). */
const TUNNEL_DARK_SECS = 2.4;
/** Local angle of the third (landmark / side-chute) notch on Three-Way rings. */
const LANDMARK_LOCAL = (2 * Math.PI) / 3; // 120° — clear of ladder FACE_SNAP
/** Angular half-width for landmark soft-reconnect snap (narrower than FACE_SNAP). */
const LANDMARK_HALF = Math.PI / 5; // ~36°
/** Long lead warning before the first three-way teach ring (Three-Way Tower). */
const THREEWAY_WARN_SECS = 8.0;
/** Landmark / side-chute colours (gold + teal) — repeat at reconnection joins. */
const LANDMARK_GOLD = '#d4a84a';
const LANDMARK_TEAL = '#7ec8b8';

function angNorm(a) {
  let x = a % TAU;
  if (x < 0) x += TAU;
  return x;
}

function angDist(a, b) {
  const d = Math.abs(angNorm(a) - angNorm(b));
  return Math.min(d, TAU - d);
}

function reducedMotion(s) {
  if (typeof prefersReducedMotion === 'function') {
    try { return !!prefersReducedMotion() || !!s.reduced; } catch { /* fall through */ }
  }
  return !!s.reduced;
}

/**
 * Ladder notch sits at local 0; snake at π.
 * theta = 0 → ladder faces bottom (you); theta = π → snake faces you.
 */
function facingKind(theta) {
  const toLadder = angDist(theta, 0);
  const toSnake = angDist(theta, Math.PI);
  return toLadder <= toSnake ? 'ladder' : 'snake';
}

function facingTight(theta) {
  return Math.min(angDist(theta, 0), angDist(theta, Math.PI)) <= FACE_SNAP;
}

/**
 * Ring-aware facing for Ch4 three-way rings.
 * Ladder FACE_SNAP always wins; landmark is soft reconnect; snake soft dump.
 * Non-threeway rings keep classic ladder vs snake.
 */
function ringFacing(ring, theta) {
  if (ring && ring.threeway) {
    const toL = angDist(theta, 0);
    if (toL <= FACE_SNAP) return 'ladder';
    const half = (ring.threeway.half != null) ? ring.threeway.half : LANDMARK_HALF;
    const loc = (ring.threeway.landmark != null) ? ring.threeway.landmark : LANDMARK_LOCAL;
    const toM = angDist(theta, loc);
    const toS = angDist(theta, Math.PI);
    if (toM <= half && toM <= toS) return 'landmark';
    if (toS <= FACE_SNAP) return 'snake';
    // Nearest of the three outside snap windows.
    if (toL <= toM && toL <= toS) return 'ladder';
    if (toM <= toS) return 'landmark';
    return 'snake';
  }
  return facingKind(theta);
}

function landmarkFaceDist(ring, theta) {
  if (!ring || !ring.threeway) return Infinity;
  const loc = (ring.threeway.landmark != null) ? ring.threeway.landmark : LANDMARK_LOCAL;
  return angDist(theta, loc);
}

function landmarkFacing(ring, theta) {
  if (!ring || !ring.threeway) return false;
  const half = (ring.threeway.half != null) ? ring.threeway.half : LANDMARK_HALF;
  return landmarkFaceDist(ring, theta) <= half;
}

/** Local cushion angle whose world face is "you" (bottom) when theta ≈ -local. */
function cushionFaceTheta(ring) {
  if (!ring || !ring.cushion) return null;
  return angNorm(-ring.cushion.local);
}

function cushionFaceDist(ring, theta) {
  const faceAt = cushionFaceTheta(ring);
  if (faceAt == null) return Infinity;
  return angDist(theta, faceAt);
}

function cushionBlocking(ring, theta) {
  if (!ring || !ring.cushion) return false;
  const half = ring.cushion.half || CUSHION_HALF;
  return cushionFaceDist(ring, theta) <= half;
}

/**
 * Tunnel phase relative to the active clock.
 * clear → warn (symbol lit, notches visible) → dark (dim notches, symbol stays) → past.
 */
function tunnelLead(s, ring) {
  if (!ring || !ring.tunnel) return Infinity;
  // During preview, approach from -PREVIEW_SECS so the exit symbol can teach early.
  const t = s.launched ? s.t : -PREVIEW_SECS + (s.previewT || 0);
  return ring.t - t;
}

function tunnelPhase(s, ring) {
  if (!ring || !ring.tunnel || ring.done) return 'none';
  const lead = tunnelLead(s, ring);
  if (lead > TUNNEL_WARN_SECS) return 'clear';
  if (lead > TUNNEL_DARK_SECS) return 'warn';
  if (lead > -0.05) return 'dark';
  return 'past';
}

function tunnelExitKind(ring) {
  if (!ring || !ring.tunnel) return 'ladder';
  return ring.tunnel.exit === 'snake' ? 'snake' : 'ladder';
}

function chapterPlan(level, rng) {
  // Ch2/Ch3/Ch4 fair bar: MORE time so a competent first play can land 3 ladders.
  // Ch3 soft — never stack max speed + darkness. Ch4 same bar; tunnels only when level===2.
  const fair = (level === 1 || level === 2 || level === 3);
  const haste = fair
    ? 0.92 // Ch2/Ch3/Ch4 slower than Ch1
    : 1 + Math.min(0.2, level * 0.035);
  const baseSecs = fair ? 52 : RIDE_SECONDS;
  const duration = baseSecs / haste;
  // Ch2/Ch3/Ch4: 6 rings for recoverable 3 ladders; Ch1: 5 rings.
  const fracs = fair
    ? [0.12, 0.26, 0.40, 0.54, 0.68, 0.82]
    : [0.14, 0.30, 0.46, 0.62, 0.78];
  const times = fracs.map((f) => f * duration);
  const treasureRing = fair ? 3 : 2;
  const bunting = level >= 1; // Ch2+ denser bunting art flag for draw
  // Ch2: ONE teach cushion only (clearer window); later rings are clean ladder/snake.
  // Ch4: mild remix — ONE cushion after the three-way teach (not on teach ring).
  const cushionIdx = level === 1 ? new Set([0])
    : (level === 3 ? new Set([3]) : null);
  // Ch3: ONE teach tunnel only (symbol before dark); later rings clean — keep 3 ladders fair.
  // Hard rule: tunnel logic only when level===2 (never on Ch4).
  const tunnelIdx = level === 2 ? new Set([0]) : null;
  // Ch4: ONE teach three-way ring alone first (no cushion/tunnel on teach).
  const threewayIdx = level === 3 ? new Set([0]) : null;
  const rings = times.map((t, i) => {
    let start;
    let cushion = null;
    let tunnel = null;
    let threeway = null;
    if (threewayIdx && threewayIdx.has(i)) {
      // Three notches: cream ladder (win), burgundy snake (soft dump), gold/teal landmark (soft reconnect).
      const teach = i === 0;
      threeway = {teach, landmark: LANDMARK_LOCAL, half: LANDMARK_HALF};
      // Start near the landmark so the player must TURN to the cream ladder.
      start = LANDMARK_LOCAL + (rng() - 0.5) * 0.14;
    } else if (tunnelIdx && tunnelIdx.has(i)) {
      // Safe exit is always the ladder notch; symbol teaches which notch before darkness.
      const teach = i === 0;
      tunnel = {exit: 'ladder', teach};
      // Start clearly off-ladder so the player must TURN using the exit symbol.
      const mag = Math.PI * (0.42 + rng() * 0.12); // ~76°–97°
      start = (rng() < 0.5 ? mag : -mag);
    } else if (cushionIdx && cushionIdx.has(i)) {
      // Offset from ladder so TURN can clear cushion toward ladder (they rotate together).
      const mag = Math.PI * (0.40 + rng() * 0.12); // ~72°–94° from ladder
      const side = rng() < 0.5 ? 1 : -1;
      let loc = side * mag;
      while (loc > Math.PI) loc -= TAU;
      while (loc < -Math.PI) loc += TAU;
      const teach = i === 0; // first cushion ring alone gets the long warn + coaching
      cushion = {local: loc, half: CUSHION_HALF, teach};
      if (teach) {
        // Start with cushion nearly facing you — TURN clear of it toward the ladder.
        start = -loc + (rng() - 0.5) * 0.08;
      } else {
        start = (rng() < 0.5 ? Math.PI * 0.55 : Math.PI * 1.45) + (rng() - 0.5) * 0.25;
      }
    } else if (i === 0) {
      // First ring (Ch1, or Ch2 non-cushion): clearly off-ladder but within ~90° so one short drag teaches TURN.
      const mag = Math.PI * (0.38 + rng() * 0.10); // ~68°–86°
      start = (rng() < 0.5 ? mag : -mag);
    } else {
      // Later rings: off enough to need a TURN; still recoverable.
      start = (rng() < 0.5 ? Math.PI * 0.55 : Math.PI * 1.45) + (rng() - 0.5) * 0.25;
    }
    return {
      i,
      t,
      theta: angNorm(start),
      targetTheta: angNorm(start),
      done: false,
      result: null,
      glintId: ORDINARY[i % ORDINARY.length],
      findTaken: false,
      hasTreasure: false,
      cushion,
      tunnel,
      threeway,
    };
  });
  return {duration, rings, treasureRing, denserBunting: bunting, threeWay: level === 3};
}

function pushFx(s, item) {
  s.fx = s.fx || [];
  if (s.fx.length >= FX_CAP) s.fx.shift();
  s.fx.push(item);
}

function pushSparks(s, x, y, cool) {
  const n = cool ? 5 : 8;
  for (let i = 0; i < n; i++) {
    const a = (TAU * i) / n + (cool ? 0.15 : 0);
    const sp = cool ? 55 : 95;
    pushFx(s, {
      kind: 'spark', x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.85,
      t: 0, dur: cool ? 0.32 : 0.42, cool: !!cool, r: cool ? 2.6 : 3.4,
    });
  }
}

function pushRingFx(s, x, y, cool) {
  pushFx(s, {kind: 'ring', x, y, t: 0, dur: cool ? 0.35 : 0.48, cool: !!cool});
}

function pushLabel(s, x, y, text, cool) {
  pushFx(s, {kind: 'label', x, y, text, t: 0, dur: 0.9, cool: !!cool});
}

function tickFx(s, dt) {
  if (s.matPulse > 0) s.matPulse = Math.max(0, s.matPulse - dt);
  if (s.finishPulse > 0) s.finishPulse = Math.max(0, s.finishPulse - dt);
  if (s.phaseFlash > 0) s.phaseFlash = Math.max(0, s.phaseFlash - dt);
  if (s.snakeSlide > 0) s.snakeSlide = Math.max(0, s.snakeSlide - dt);
  if (s.ringFlourish > 0) s.ringFlourish = Math.max(0, s.ringFlourish - dt);
  if (!s.fx || !s.fx.length) return;
  for (const fx of s.fx) {
    fx.t += dt;
    if (fx.kind === 'spark') {
      fx.x += fx.vx * dt;
      fx.y += fx.vy * dt;
      fx.vx *= 0.9;
      fx.vy *= 0.9;
    }
  }
  s.fx = s.fx.filter((fx) => fx.t < fx.dur);
}

function activeRing(s) {
  return s.rings.find((r) => !r.done) || null;
}

function turnRing(s, delta) {
  const ring = activeRing(s);
  if (!ring) return;
  ring.targetTheta = angNorm(ring.targetTheta + delta);
  s.turnedOnce = true;
  if (cushionBlocking(ring, ring.targetTheta)) {
    s.note = 'Cushion facing you — TURN clear of it toward the ladder.';
    s.statusCopy = 'Cushion ahead';
    logAction(s, 'turn', {ring: ring.i, theta: Math.round(ring.targetTheta * 1000) / 1000, face: 'cushion'});
    return;
  }
  const face = ringFacing(ring, ring.targetTheta);
  const phase = tunnelPhase(s, ring);
  if (ring.tunnel && (phase === 'warn' || phase === 'dark')) {
    const exit = tunnelExitKind(ring);
    if (face === exit && facingTight(ring.targetTheta)) {
      s.note = 'Exit notch faces you — hold through the tunnel.';
      s.statusCopy = phase === 'dark' ? 'Tunnel exit set' : 'Exit ready';
    } else {
      s.note = exit === 'ladder'
        ? 'Tunnel symbol: TURN so the cream ladder faces you.'
        : 'Tunnel symbol: TURN so the snake notch faces you.';
      s.statusCopy = phase === 'dark' ? 'Dark — follow symbol' : 'Tunnel symbol';
    }
    logAction(s, 'turn', {ring: ring.i, theta: Math.round(ring.targetTheta * 1000) / 1000, face, tunnel: phase});
    return;
  }
  if (ring.threeway) {
    if (face === 'ladder' && facingTight(ring.targetTheta)) {
      s.note = 'Ladder facing you — hold for the drop.';
      s.statusCopy = 'Ladder ahead';
    } else if (face === 'landmark') {
      s.note = 'Side chute — soft reconnect; TURN cream ladder for credit.';
      s.statusCopy = 'Side chute';
    } else {
      s.note = 'Three ways — TURN the cream ladder. Map shows the join.';
      s.statusCopy = face === 'snake' ? 'Snake ahead' : 'Three ways';
    }
    logAction(s, 'turn', {ring: ring.i, theta: Math.round(ring.targetTheta * 1000) / 1000, face, threeway: true});
    return;
  }
  s.note = face === 'ladder'
    ? 'Ladder facing you — hold for the drop.'
    : 'Snake facing you — TURN toward the ladder.';
  s.statusCopy = face === 'ladder' ? 'Ladder ahead' : 'Snake ahead';
  logAction(s, 'turn', {ring: ring.i, theta: Math.round(ring.targetTheta * 1000) / 1000, face});
}

function applyPointerTurn(s, p) {
  // Horizontal drag or circular gesture around the tower centre.
  const prev = s.drag;
  if (!prev) return;
  const dx = p.x - prev.x;
  const dy = p.y - prev.y;
  // Circular: cross product relative to tower centre ≈ angular delta.
  const rx = prev.x - CX;
  const ry = prev.y - (s.towerY || 520);
  const cross = rx * dy - ry * dx;
  const r2 = rx * rx + ry * ry;
  let delta = 0;
  if (r2 > 40 * 40) {
    delta = cross / r2;
  } else {
    // Near centre: horizontal drag turns the ring.
    delta = dx * 0.02;
  }
  if (Math.abs(delta) < 0.004) return;
  turnRing(s, delta);
  s.drag = {x: p.x, y: p.y};
}

function spawnTreasure(s) {
  if (!s.eligible || s.treasure) return;
  const idx = clamp(s.planTreasureRing ?? 2, 0, s.rings.length - 1);
  const ring = s.rings[idx];
  ring.hasTreasure = true;
  s.treasure = {
    id: s.treasureId,
    ring: idx,
    taken: false,
  };
}

function commitRing(s, ring) {
  // Ease toward target so the last TURN counts.
  // Forgiving snap: if within FACE_SNAP of ladder, lock to ladder (carnival fair).
  // Ladder FACE_SNAP beats blockers (cushion) and landmark soft-reconnect.
  // Cushion soft-redirect wins if cushion still covers the face after snap.
  let theta = ring.targetTheta;
  let snappedLadder = false;
  let snappedLandmark = false;
  if (angDist(theta, 0) <= FACE_SNAP) { theta = 0; snappedLadder = true; }
  else if (ring.threeway && landmarkFacing(ring, theta)) {
    theta = (ring.threeway.landmark != null) ? ring.threeway.landmark : LANDMARK_LOCAL;
    snappedLandmark = true;
  }
  else if (angDist(theta, Math.PI) <= FACE_SNAP) theta = Math.PI;
  ring.targetTheta = theta;
  ring.theta = theta;
  const y = ringScreenY(s, ring);

  // Ladder snap beats cushion — carnival fair; cushions teach redirect, not soft-lock.
  if (!snappedLadder && cushionBlocking(ring, ring.theta)) {
    // Soft redirect — ride always continues; never abort paid ride.
    ring.done = true;
    ring.result = 'cushion';
    logAction(s, 'commit', {ring: ring.i, face: 'cushion', theta: Math.round(ring.theta * 1000) / 1000});
    logAction(s, 'cushion', {ring: ring.i});
    s.note = 'Cushion bump! Soft redirect — TURN clear toward the ladder next time.';
    s.statusCopy = 'Cushion bump';
    s.phaseFlash = 0.85;
    s.phaseFlashLabel = 'Cushion';
    s.snakeSlide = 0.9;
    s.matPulse = 0.35;
    // Softer time penalty on Ch4 fair bar; Ch1–Ch3 keep prior values.
    s.t = Math.max(0, s.t - ((s.level === 3) ? 0.35 : 0.45));
    pushSparks(s, CX, y, true);
    pushRingFx(s, CX, y, true);
    pushLabel(s, CX, y - 36, 'cushion!', true);
    if (ring.hasTreasure && s.treasure && !s.treasure.taken) {
      s.treasureRevealed = true;
      s.note = 'Cushion soft-dumped the keepsake past you — ride continues.';
    }
    return;
  }

  // Ch4 landmark / side chute: soft reconnect — no abort, no ladder credit.
  if (snappedLandmark || (ring.threeway && !snappedLadder && ringFacing(ring, ring.theta) === 'landmark')) {
    ring.done = true;
    ring.result = 'landmark';
    logAction(s, 'commit', {ring: ring.i, face: 'landmark', theta: Math.round(ring.theta * 1000) / 1000});
    logAction(s, 'landmark', {ring: ring.i});
    s.note = 'Side chute! Soft reconnect — no ladder credit; TURN cream next time.';
    s.statusCopy = 'Side chute';
    s.phaseFlash = 0.85;
    s.phaseFlashLabel = 'Join';
    s.snakeSlide = 0.7;
    s.matPulse = 0.3;
    s.t = Math.max(0, s.t - 0.35); // softer than snake
    pushSparks(s, CX, y, true);
    pushRingFx(s, CX, y, true);
    pushLabel(s, CX, y - 36, 'reconnect', true);
    if (ring.hasTreasure && s.treasure && !s.treasure.taken) {
      s.treasureRevealed = true;
      s.note = 'Side chute soft-redirected the keepsake past you — ride continues.';
    }
    return;
  }

  const face = ringFacing(ring, ring.theta);
  ring.done = true;
  ring.result = face;
  logAction(s, 'commit', {ring: ring.i, face, theta: Math.round(ring.theta * 1000) / 1000});

  if (face === 'ladder') {
    s.hits += 1;
    if (!ring.findTaken) {
      ring.findTaken = true;
      recordFind(s, ring.glintId, RIDE);
    }
    logAction(s, 'ladder', {ring: ring.i, hits: s.hits, id: ring.glintId});
    s.note = 'Ladder! ' + s.hits + ' / ' + GOAL + ' — keep TURNING for the next ring.';
    s.statusCopy = 'Ladder!';
    s.phaseFlash = 0.85;
    s.phaseFlashLabel = 'Ladder';
    s.matPulse = 0.45;
    s.ringFlourish = reducedMotion(s) ? 0.2 : 0.55;
    pushSparks(s, CX, y, false);
    pushRingFx(s, CX, y, false);
    pushLabel(s, CX, y - 36, '+1 ladder', false);

    if (ring.hasTreasure && s.treasure && !s.treasure.taken) {
      s.treasure.taken = true;
      s.treasureRevealed = true;
      recordTreasure(s, s.treasure.id);
      logAction(s, 'treasure', {ring: ring.i, id: s.treasure.id});
      s.note = 'You caught the keepsake on the ladder!';
      s.statusCopy = 'Keepsake!';
      s.phaseFlashLabel = 'Keepsake';
      pushSparks(s, CX, y - 20, false);
      pushLabel(s, CX, y - 58, 'keepsake!', false);
    }
  } else {
    // Soft dump / redirect — ride always continues; never abort paid ride.
    logAction(s, 'snake', {ring: ring.i});
    s.note = 'Snake slide! Soft dump — TURN the next ring toward a ladder.';
    s.statusCopy = 'Snake slide';
    s.phaseFlash = 0.85;
    s.phaseFlashLabel = 'Snake';
    s.snakeSlide = 0.9;
    s.matPulse = 0.35;
    // Tiny soft slide-back on the descent clock (still finishes). Ch4 softer.
    s.t = Math.max(0, s.t - ((s.level === 3) ? 0.45 : 0.6));
    pushSparks(s, CX, y, true);
    pushRingFx(s, CX, y, true);
    pushLabel(s, CX, y - 36, 'slide-back', true);
    if (ring.hasTreasure && s.treasure && !s.treasure.taken) {
      s.treasureRevealed = true;
      s.note = 'Snake took the keepsake past you — soft dump; ride continues.';
    }
  }
}

function ringScreenY(s, ring) {
  // Rings descend from top toward the mat; commit when near MAT_Y.
  const u = s.launched ? clamp(s.t / Math.max(0.01, ring.t), 0, 1.35) : 0.15;
  const approach = clamp(u, 0, 1);
  return TOWER_TOP + (MAT_Y - 40 - TOWER_TOP) * approach;
}

function ringRadius(s, ring) {
  const y = ringScreenY(s, ring);
  const near = clamp((y - TOWER_TOP) / (MAT_Y - TOWER_TOP), 0, 1);
  return 52 + near * 78;
}

function teachWindow(s, preview) {
  if (preview) return true;
  if (!s.launched) return true;
  return s.t < TEACH_SECS;
}

function coachingLine(s, preview, ring) {
  if (s.statusCopy && (s.matPulse > 0 || s.phaseFlash > 0.2)) return s.statusCopy;
  // Ch4 teach: three-way fork alone first — TURN cream ladder; map shows the join.
  if (ring && !ring.done && ring.threeway && ring.threeway.teach) {
    const lead = ring.t - (s.launched ? s.t : -PREVIEW_SECS);
    if (preview || lead <= THREEWAY_WARN_SECS) {
      const face = ringFacing(ring, ring.targetTheta);
      if (face === 'ladder' && facingTight(ring.targetTheta)) {
        return 'Ladder faces you — drop through when it arrives.';
      }
      if (face === 'landmark') {
        return 'Side chute reconnects — TURN cream ladder for credit.';
      }
      return 'Three ways — TURN the cream ladder. Map shows the join.';
    }
  }
  // Ch3 teach: exit symbol before darkness on the first tunnel ring (taught alone).
  if (ring && !ring.done && ring.tunnel && ring.tunnel.teach) {
    const phase = tunnelPhase(s, ring);
    if (preview || phase === 'warn' || phase === 'dark') {
      const exit = tunnelExitKind(ring);
      if (phase === 'dark') {
        return exit === 'ladder'
          ? 'Dark tunnel — follow the symbol; TURN ladder to face you.'
          : 'Dark tunnel — follow the symbol; TURN snake to face you.';
      }
      return exit === 'ladder'
        ? 'Tunnel ahead — symbol shows ladder exit. TURN before darkness.'
        : 'Tunnel ahead — symbol shows snake exit. TURN before darkness.';
    }
  }
  // Ch2 teach: long warn on the first cushion ring before mixing other hazards.
  if (ring && !ring.done && ring.cushion && ring.cushion.teach) {
    const lead = ring.t - (s.launched ? s.t : -PREVIEW_SECS);
    if (preview || lead <= CUSHION_WARN_SECS) {
      if (cushionBlocking(ring, ring.targetTheta)) {
        return 'Cushion ahead — TURN clear of it toward the ladder.';
      }
      return 'Cushion ahead — TURN clear of it toward the ladder.';
    }
  }
  if (!s.turnedOnce) return 'TURN the ring so the ladder faces you.';
  if (ring && !ring.done) {
    const phase = tunnelPhase(s, ring);
    if (ring.tunnel && (phase === 'warn' || phase === 'dark')) {
      const exit = tunnelExitKind(ring);
      const face = ringFacing(ring, ring.targetTheta);
      if (face === exit && facingTight(ring.targetTheta)) {
        return 'Exit notch faces you — hold through the tunnel.';
      }
      return phase === 'dark'
        ? 'Dark — follow the exit symbol and TURN.'
        : 'Symbol shows the exit — TURN before darkness.';
    }
    if (cushionBlocking(ring, ring.targetTheta)) {
      return 'Cushion ahead — TURN clear of it toward the ladder.';
    }
    const face = ringFacing(ring, ring.targetTheta);
    if (face === 'ladder' && facingTight(ring.targetTheta)) {
      return 'Ladder faces you — drop through when it arrives.';
    }
    if (face === 'landmark') {
      return 'Side chute reconnects — TURN cream ladder for credit.';
    }
    if (face === 'snake') return 'Snake faces you — TURN toward the cream ladder.';
    if (ring.threeway) return 'Three ways — TURN the cream ladder. Map shows the join.';
    return 'TURN so the ladder notch sits at the bottom.';
  }
  if (!preview && s.progress > 0.82) {
    return s.hits >= s.goal ? 'Bottom mat ahead — ladders clear.' : 'Bottom mat ahead — hold steady.';
  }
  return s.note || 'Choose your spiral. Catch what tumbles.';
}

function phaseLabel(s, preview) {
  if (s.phaseFlash > 0 && s.phaseFlashLabel) return s.phaseFlashLabel;
  if (s.result) return s.challengeOkFlash ? 'Clear' : 'Sliding';
  if (preview) return s.practice ? 'Practice' : 'Ready';
  if (s.launched) return 'Sliding';
  return s.practice ? 'Practice' : 'Ready';
}

function drawPracticeBadge(d, s, teach) {
  if (!s.practice) return;
  const pulse = teach ? (0.7 + 0.3 * Math.sin((s.previewT || s.t) * 5)) : 1;
  const a = Math.floor(pulse * 200).toString(16).padStart(2, '0');
  d.ellipse(450, 34, teach ? 148 : 132, teach ? 30 : 26, '#6b2030' + a, '#d2a65bcc', 2);
  d.text('PRACTICE', 450, 34, teach ? 28 : 24, '#fff6d8');
}

function drawTurnChrome(d, s, clock, teach) {
  // Loud TURN chrome until first successful turn; extra-large in the teach window.
  if (s.turnedOnce && !teach) {
    const a = '55';
    d.text('↺  TURN  ↻', 450, 1048, 18, '#f0d09a' + a);
    return;
  }
  const pulse = 0.55 + 0.45 * Math.sin(clock * 4.2);
  const fillHex = Math.floor((0.42 + pulse * 0.28) * 255).toString(16).padStart(2, '0');
  const strokeHex = Math.floor((0.55 + pulse * 0.35) * 255).toString(16).padStart(2, '0');
  const textHex = Math.floor((0.9 + pulse * 0.1) * 255).toString(16).padStart(2, '0');
  const big = teach || !s.turnedOnce;
  const top = big ? 978 : 990;
  const bot = big ? 1082 : 1075;
  const left = big ? 220 : 250;
  const right = big ? 680 : 650;
  d.poly(
    [[left, top], [right, top], [right - 10, bot], [left + 10, bot]],
    '#2a1814' + fillHex, '#d2a65b' + strokeHex, big ? 3.2 : 2.5,
  );
  d.text('↺  TURN  ↻', 450, big ? 1020 : 1025, big ? 44 : 36, '#fff6d8' + textHex);
  d.text('drag around the tower', 450, big ? 1058 : 1055, big ? 18 : 16, '#f0d09a' + textHex);
}

function drawLadderNotch(d, x, y, rx, ry, ang, highlight) {
  // Cream/gold step wedge at the notch angle on the ellipse.
  const px = x + Math.cos(ang) * rx;
  const py = y + Math.sin(ang) * ry;
  const tx = -Math.sin(ang);
  const ty = Math.cos(ang);
  const depth = highlight ? 28 : 22;
  const half = highlight ? 20 : 16;
  const ox = Math.cos(ang) * depth;
  const oy = Math.sin(ang) * depth;
  d.poly([
    [px - tx * half, py - ty * half],
    [px + tx * half, py + ty * half],
    [px + tx * half * 0.55 + ox, py + ty * half * 0.55 + oy],
    [px - tx * half * 0.55 + ox, py - ty * half * 0.55 + oy],
  ], highlight ? '#f3e2bdee' : '#f3e2bdcc', '#d2a65b', highlight ? 2.4 : 1.6);
  // Step lines
  for (let i = 1; i <= 3; i++) {
    const f = i / 4;
    const sx = px + ox * f;
    const sy = py + oy * f;
    const h = half * (1 - f * 0.45);
    d.line({x: sx - tx * h, y: sy - ty * h}, {x: sx + tx * h, y: sy + ty * h}, '#b78b48aa', 1.2);
  }
}

function drawSnakeNotch(d, x, y, rx, ry, ang, highlight) {
  // Burgundy S-curve at the snake notch.
  const px = x + Math.cos(ang) * rx;
  const py = y + Math.sin(ang) * ry;
  const tx = -Math.sin(ang);
  const ty = Math.cos(ang);
  const nx = Math.cos(ang);
  const ny = Math.sin(ang);
  const col = highlight ? '#6b2030ee' : '#6b2030cc';
  const stroke = highlight ? '#d2a65bcc' : '#b78b4866';
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const side = Math.sin(u * Math.PI * 2) * 14;
    const out = (u - 0.5) * 36;
    pts.push([px + tx * side + nx * out, py + ty * side + ny * out]);
  }
  d.path(pts.map((p) => ({x: p[0], y: p[1]})), col, highlight ? 5 : 3.5, false, null);
  d.circle(pts[0][0], pts[0][1], highlight ? 6 : 4.5, col, stroke, 1);
  d.circle(pts[8][0], pts[8][1], highlight ? 5 : 3.5, col, stroke, 1);
}

function drawLandmarkNotch(d, x, y, rx, ry, ang, highlight) {
  // Gold/teal side-chute wedge — third notch on Three-Way rings.
  const px = x + Math.cos(ang) * rx;
  const py = y + Math.sin(ang) * ry;
  const tx = -Math.sin(ang);
  const ty = Math.cos(ang);
  const depth = highlight ? 26 : 20;
  const half = highlight ? 16 : 13;
  const ox = Math.cos(ang) * depth;
  const oy = Math.sin(ang) * depth;
  d.poly([
    [px - tx * half, py - ty * half],
    [px + tx * half, py + ty * half],
    [px + tx * half * 0.5 + ox, py + ty * half * 0.5 + oy],
    [px - tx * half * 0.5 + ox, py - ty * half * 0.5 + oy],
  ], highlight ? '#7ec8b8ee' : '#7ec8b8bb', highlight ? LANDMARK_GOLD : '#d4a84a99', highlight ? 2.4 : 1.6);
  // Teal inner channel + gold lip
  d.line(
    {x: px - tx * half * 0.35, y: py - ty * half * 0.35},
    {x: px - tx * half * 0.35 + ox * 0.85, y: py - ty * half * 0.35 + oy * 0.85},
    LANDMARK_GOLD + 'cc', 1.4,
  );
  d.line(
    {x: px + tx * half * 0.35, y: py + ty * half * 0.35},
    {x: px + tx * half * 0.35 + ox * 0.85, y: py + ty * half * 0.35 + oy * 0.85},
    LANDMARK_TEAL + 'cc', 1.4,
  );
}

/** Tiny map: three paths rejoining — teach preview for Three-Way Tower. */
function drawTinyMap(d, s, clock, active) {
  const pulse = active ? (0.55 + 0.45 * Math.sin(clock * 4.2)) : 0.7;
  const fillA = Math.floor((0.45 + pulse * 0.25) * 255).toString(16).padStart(2, '0');
  const strokeA = Math.floor((0.55 + pulse * 0.35) * 255).toString(16).padStart(2, '0');
  const ox = 78;
  const oy = s.practice ? 118 : 96;
  d.ellipse(ox, oy, 64, 52, '#1a1010' + fillA, '#d2a65b' + strokeA, active ? 2.2 : 1.5);
  d.text('map', ox, oy - 38, 11, '#ead6a4cc');
  // Three paths from top → join at bottom (cream / teal / burgundy).
  const topY = oy - 18;
  const joinY = oy + 16;
  const midY = oy + 2;
  // Left cream ladder path
  d.path([
    {x: ox - 22, y: topY},
    {x: ox - 14, y: midY},
    {x: ox, y: joinY},
  ], '#f3e2bd', active ? 3.2 : 2.4, false, null);
  // Centre teal landmark path
  d.path([
    {x: ox, y: topY},
    {x: ox, y: midY},
    {x: ox, y: joinY},
  ], LANDMARK_TEAL, active ? 3.2 : 2.4, false, null);
  // Right burgundy snake path
  d.path([
    {x: ox + 22, y: topY},
    {x: ox + 14, y: midY},
    {x: ox, y: joinY},
  ], '#6b2030', active ? 3.2 : 2.4, false, null);
  // Landmark colours at the join
  d.circle(ox, joinY, 5.5, LANDMARK_GOLD, LANDMARK_TEAL, 1.6);
  d.circle(ox - 22, topY, 3.5, '#f3e2bd', '#d2a65bcc', 1);
  d.circle(ox, topY, 3.5, LANDMARK_TEAL, LANDMARK_GOLD, 1);
  d.circle(ox + 22, topY, 3.5, '#6b2030', '#d2a65bcc', 1);
  if (active) d.text('join', ox, oy + 32, 11, '#f0d09acc');
}

/** Landmark colour markers at reconnection joins along the tower spine (Ch4). */
function drawJoinLandmarks(d, s) {
  if (!s.threeWay) return;
  const bank = s.camBank || 0;
  const joins = [0.28, 0.52, 0.76];
  for (let i = 0; i < joins.length; i++) {
    const y = TOWER_TOP + (TOWER_BOT - TOWER_TOP) * joins[i];
    const col = (i % 2 === 0) ? LANDMARK_GOLD : LANDMARK_TEAL;
    d.circle(CX + bank * 0.1, y, 5, col + 'aa', '#d2a65b66', 1.2);
    d.circle(CX + bank * 0.1 - 22, y + 4, 3.2, LANDMARK_TEAL + '88', null, 0);
    d.circle(CX + bank * 0.1 + 22, y + 4, 3.2, LANDMARK_GOLD + '88', null, 0);
  }
}

function drawCushion(d, x, y, rx, ry, ang, highlight, rolled) {
  // Burgundy cushion / rolled mat on a ring arc — paper-cut oval + soft strap.
  const px = x + Math.cos(ang) * rx;
  const py = y + Math.sin(ang) * ry;
  const tx = -Math.sin(ang);
  const ty = Math.cos(ang);
  const nx = Math.cos(ang);
  const ny = Math.sin(ang);
  const fill = highlight ? '#6b2030ee' : '#6b2030bb';
  const stroke = highlight ? '#d2a65bcc' : '#b78b4888';
  const hw = highlight ? 22 : 18;
  const hh = rolled ? (highlight ? 14 : 11) : (highlight ? 16 : 13);
  d.ellipse(px + nx * 4, py + ny * 4, hw, hh, fill, stroke, highlight ? 2.2 : 1.5);
  // Cream piping
  d.ellipse(px + nx * 4, py + ny * 4, hw * 0.55, hh * 0.45, '#f3e2bd55', '#f3e2bd66', 1);
  if (rolled) {
    // Rolled-mat bands
    for (const u of [-0.35, 0, 0.35]) {
      const bx = px + nx * 4 + tx * hw * u * 0.85;
      const by = py + ny * 4 + ty * hw * u * 0.85;
      d.line(
        {x: bx - nx * hh * 0.7, y: by - ny * hh * 0.7},
        {x: bx + nx * hh * 0.7, y: by + ny * hh * 0.7},
        '#f3e2bd99', 1.4,
      );
    }
  } else {
    // Cushion tassels
    d.circle(px + nx * 4 + tx * hw * 0.7, py + ny * 4 + ty * hw * 0.7, 3.2, '#f3e2bdcc', '#d2a65b88', 1);
    d.circle(px + nx * 4 - tx * hw * 0.7, py + ny * 4 - ty * hw * 0.7, 3.2, '#f3e2bdcc', '#d2a65b88', 1);
  }
}

/** Warning glyph showing which notch is the safe tunnel exit — stays readable in darkness. */
function drawTunnelSymbol(d, x, y, exit, highlight, clock) {
  const pulse = highlight ? (0.55 + 0.45 * Math.sin(clock * 4.8)) : 0.75;
  const fillA = Math.floor((0.55 + pulse * 0.4) * 255).toString(16).padStart(2, '0');
  const strokeA = Math.floor((0.65 + pulse * 0.3) * 255).toString(16).padStart(2, '0');
  d.ellipse(x, y, 46 + pulse * 6, 28 + pulse * 3, '#1a1010' + fillA, '#d2a65b' + strokeA, highlight ? 2.6 : 1.8);
  if (exit === 'ladder') {
    // Cream ladder chevron / arrow glyph
    d.poly([
      [x - 14, y + 6],
      [x, y - 12],
      [x + 14, y + 6],
      [x + 7, y + 6],
      [x + 7, y + 12],
      [x - 7, y + 12],
      [x - 7, y + 6],
    ], '#f3e2bdee', '#d2a65bcc', 1.6);
    d.text('ladder', x, y + 22, 12, '#f4d590');
  } else {
    // Snake S glyph
    d.text('∿', x, y + 2, 28, '#e8b0b0');
    d.text('snake', x, y + 22, 12, '#e8b0b0');
  }
  d.text('exit', x, y - 22, 11, '#ead6a4cc');
}

function drawRingToy(d, s, ring, clock, teach) {
  if (ring.done && ringScreenY(s, ring) < TOWER_TOP + 20) return;
  const y = ringScreenY(s, ring);
  const rx = ringRadius(s, ring);
  const ry = rx * 0.38;
  const theta = ring.theta;
  const face = ringFacing(ring, ring.targetTheta);
  const tight = facingTight(ring.targetTheta);
  const active = !ring.done && ring === activeRing(s);
  const phase = tunnelPhase(s, ring);
  const inTunnel = active && ring.tunnel && (phase === 'warn' || phase === 'dark');
  const dark = active && ring.tunnel && phase === 'dark';
  const pulse = (teach && active) ? (0.55 + 0.45 * Math.sin(clock * 5)) : (active ? (0.35 + 0.25 * Math.sin(clock * 3.5)) : 0);
  const reduced = reducedMotion(s);
  const flourish = (!reduced && (s.ringFlourish || 0) > 0 && ring.done) ? s.ringFlourish * 8 : 0;

  // Gold rail ring — translucent, never solid court overpaint. Dim in tunnel darkness.
  const fillA = dark ? '10' : (active ? '28' : '14');
  const stroke = dark ? '#d2a65b44' : (active ? '#d2a65bcc' : '#d2a65b66');
  d.ellipse(CX, y, rx, ry, (dark ? '#1a1010' : '#5a3a22') + fillA, stroke, active ? 3.2 : 1.8);
  if (dark) {
    // Soft darkness veil — keep helter.png readable beneath.
    d.ellipse(CX, y, rx + 8, ry + 10, '#0a060888', '#1a101066', 1.5);
  }
  if (active && pulse > 0 && !dark) {
    d.ellipse(CX, y, rx + 6 + pulse * 10, ry + 3 + pulse * 4, null, '#ffe6a4' + Math.floor(pulse * 160).toString(16).padStart(2, '0'), 2);
  }

  // Open notches: ladder at local 0 + theta → world angle; bottom-facing is π/2.
  // World draw angle for a local notch a: a + theta, with 0 = +x, π/2 = +y (down / you).
  const ladderAng = theta + flourish + Math.PI / 2; // when theta=0, ladder at bottom
  const snakeAng = theta + Math.PI + flourish + Math.PI / 2;

  // Warn phase: notches still clear. Darkness: hide notch art — symbol carries the teach.
  const landmarkAng = ring.threeway
    ? (theta + ((ring.threeway.landmark != null) ? ring.threeway.landmark : LANDMARK_LOCAL) + flourish + Math.PI / 2)
    : null;
  if (!dark) {
    drawLadderNotch(d, CX, y, rx, ry, ladderAng, active && face === 'ladder' && tight && !cushionBlocking(ring, ring.targetTheta));
    drawSnakeNotch(d, CX, y, rx, ry, snakeAng, active && face === 'snake' && !cushionBlocking(ring, ring.targetTheta));
    if (ring.threeway && landmarkAng != null) {
      drawLandmarkNotch(
        d, CX, y, rx, ry, landmarkAng,
        active && face === 'landmark' && !cushionBlocking(ring, ring.targetTheta),
      );
    }
  }

  // Cushion / rolled mat on some Ch2 ring arcs.
  if (ring.cushion) {
    const cAng = theta + ring.cushion.local + flourish + Math.PI / 2;
    const cBlock = active && cushionBlocking(ring, ring.targetTheta);
    const rolled = (ring.i % 2) === 1;
    drawCushion(d, CX, y, rx, ry, cAng, cBlock || !!(ring.cushion.teach && active), rolled);
    if (active && (cBlock || ring.cushion.teach)) {
      const warnPulse = 0.5 + 0.5 * Math.sin(clock * 4.5);
      const warnA = Math.floor((0.35 + warnPulse * 0.4) * 255).toString(16).padStart(2, '0');
      d.ellipse(
        CX + Math.cos(cAng) * rx,
        y + Math.sin(cAng) * ry,
        34 + warnPulse * 8, 18 + warnPulse * 4,
        null, '#c67483' + warnA, 2,
      );
    }
  }

  // Tunnel exit warning symbol — readable before and during darkness.
  if (inTunnel) {
    const exit = tunnelExitKind(ring);
    drawTunnelSymbol(d, CX, y - ry - 36, exit, true, clock);
  }

  // Facing marker at bottom of ring ("you").
  if (active) {
    const blocked = cushionBlocking(ring, ring.targetTheta);
    const exit = ring.tunnel ? tunnelExitKind(ring) : null;
    const matchedExit = exit && face === exit && tight;
    const glowCol = blocked ? '#c67483'
      : (inTunnel && matchedExit) ? '#ffe6a4'
      : (inTunnel && !matchedExit) ? '#c67483'
      : (face === 'ladder' ? '#ffe6a4'
        : (face === 'landmark' ? LANDMARK_TEAL : '#c67483'));
    d.glow(CX, y + ry, 28 + pulse * 12, glowCol);
    let label = blocked ? 'cushion'
      : (face === 'ladder' ? 'ladder'
        : (face === 'landmark' ? 'side chute' : 'snake'));
    if (inTunnel && !blocked) label = dark ? ('dark · ' + label) : label;
    const labelCol = blocked ? '#e8b0b0'
      : (face === 'ladder' ? '#f4d590'
        : (face === 'landmark' ? LANDMARK_TEAL : '#e8b0b0'));
    d.text(label, CX, y + ry + 22, 14, labelCol);
  }

  // Result stamp after commit.
  if (ring.done) {
    const stamp = ring.result === 'ladder' ? '▲ ladder'
      : ring.result === 'cushion' ? '▣ cushion'
      : ring.result === 'landmark' ? '◇ join' : '∿ snake';
    const stampCol = ring.result === 'ladder' ? '#f4d590aa'
      : ring.result === 'cushion' ? '#c67483aa'
      : ring.result === 'landmark' ? (LANDMARK_TEAL + 'aa') : '#c67483aa';
    d.text(stamp, CX, y - ry - 14, 14, stampCol);
  }

  // Treasure sits on the ladder segment ahead (fair, on a ladder notch).
  if (ring.hasTreasure && s.treasure && !s.treasure.taken && !ring.done) {
    const tx = CX + Math.cos(ladderAng) * (rx * 0.72);
    const ty = y + Math.sin(ladderAng) * (ry * 0.72);
    d.glow(tx, ty, 40, '#f4d590');
    d.item(spriteKey(s.treasure.id), tx, ty, {
      w: 56,
      shadow: false,
      fallback: () => d.star(tx, ty, 14, '#ffe6a4'),
    });
    if (face === 'ladder' && tight) d.text('intercept', tx, ty - 28, 14, '#fff6d8');
  }
}

function drawBunting(d, y, denser) {
  const n = denser ? 11 : 7;
  const span = denser ? 62 : 95;
  const start = denser ? 130 : 160;
  for (let i = 0; i < n; i++) {
    const x = start + i * span;
    const col = i % 2 ? '#6b2030aa' : '#f3e2bdaa';
    const h = denser ? 22 + (i % 3) * 4 : 26;
    d.poly([[x, y], [x + (denser ? 22 : 28), y], [x + (denser ? 11 : 14), y + h]], col, '#d2a65b66', 1);
  }
  if (denser) {
    // Second scallop row — denser Ch2 carnival feel
    for (let i = 0; i < n - 1; i++) {
      const x = start + span * 0.5 + i * span;
      const col = i % 2 ? '#f3e2bd88' : '#6b203088';
      d.poly([[x, y + 18], [x + 18, y + 18], [x + 9, y + 36]], col, '#d2a65b44', 1);
    }
  }
}

function drawTowerHint(d, s) {
  // Soft tower spine — translucent; helter.png remains the hero.
  const bank = s.camBank || 0;
  d.poly([
    [CX - 18 + bank * 0.1, TOWER_TOP],
    [CX + 18 + bank * 0.1, TOWER_TOP],
    [CX + 36 + bank * 0.1, TOWER_BOT],
    [CX - 36 + bank * 0.1, TOWER_BOT],
  ], '#f3e2bd14', '#d2a65b33', 1.2);
  d.ellipse(CX + bank * 0.1, TOWER_TOP - 10, 70, 18, '#f3e2bd22', '#d2a65b44', 1.2);
}

function drawFx(d, s) {
  for (const fx of (s.fx || [])) {
    const u = fx.t / fx.dur;
    const a = 1 - u;
    if (fx.kind === 'spark') {
      const col = fx.cool ? '#8ec8e8' : '#f4d590';
      const hex = Math.floor(a * 200).toString(16).padStart(2, '0');
      d.circle(fx.x, fx.y, fx.r * (1 - u * 0.45), col + hex, null, 0);
    } else if (fx.kind === 'ring') {
      const r = 18 + u * 52;
      const col = fx.cool ? '#8ec8e8' : '#ffe6a4';
      const hex = Math.floor(a * 210).toString(16).padStart(2, '0');
      d.circle(fx.x, fx.y, r, null, col + hex, 3);
    } else if (fx.kind === 'label') {
      const rise = u * 46;
      const col = fx.cool ? '#b8d4e8' : '#fff6d8';
      const hex = Math.floor(a * 240).toString(16).padStart(2, '0');
      d.text(fx.text, fx.x, fx.y - rise, 22, col + hex);
    }
  }
}

function drawStateChip(d, s, preview) {
  const label = phaseLabel(s, preview);
  const chapter = LEVEL_NAMES[clamp(s.level || 0, 0, LEVEL_NAMES.length - 1)] || LEVEL_NAMES[0];
  const cy = s.practice ? 78 : 56;
  d.ellipse(450, cy, 210, 28, '#1a101066', '#d2a65b55', 1.2);
  d.text(label, 450, cy - 8, 18, '#fff6d8');
  d.text(chapter, 450, cy + 14, 13, '#ead6a4aa');
}

function drawBottomStrip(d, s, preview, ring) {
  const line = coachingLine(s, preview, ring);
  d.poly(
    [[120, 1088], [780, 1088], [768, 1172], [132, 1172]],
    '#2a181466', '#d2a65b66', 1.5,
  );
  d.text(line, 450, 1128, 18, '#fff6d8');
  if (s.practice && s.turnedOnce) {
    d.text('nothing is kept', 450, 1156, 13, '#ead6a488');
  } else if (ring && !ring.done) {
    const phase = tunnelPhase(s, ring);
    if (ring.tunnel && (phase === 'warn' || phase === 'dark')) {
      const exit = tunnelExitKind(ring);
      d.text(
        (phase === 'dark' ? 'dark · ' : '') + 'exit symbol: ' + exit,
        450, 1156, 13, '#f0d09acc',
      );
    } else if (cushionBlocking(ring, ring.targetTheta)) {
      d.text('facing: cushion', 450, 1156, 13, '#e8b0b0cc');
    } else {
      const face = ringFacing(ring, ring.targetTheta);
      const faceTxt = face === 'ladder' ? 'facing: ladder'
        : (face === 'landmark' ? 'facing: side chute' : 'facing: snake');
      const faceCol = face === 'landmark' ? (LANDMARK_TEAL + 'cc') : '#f0d09acc';
      d.text(faceTxt, 450, 1156, 13, faceCol);
    }
  }
}

function drawMat(d, s, clock) {
  const reduced = reducedMotion(s);
  const bank = s.camBank || 0;
  const slide = (s.snakeSlide || 0) > 0 ? Math.sin(s.snakeSlide * 14) * (reduced ? 4 : 14) : 0;
  const bob = Math.sin(clock * 5) * (reduced ? 2 : 5);
  const pulseScale = (s.matPulse || 0) > 0 ? 1 + (s.matPulse / 0.45) * 0.08 : 1;
  const px = CX + bank + slide;
  const halfW = 48 * pulseScale;
  const halfBot = 42 * pulseScale;
  d.poly([
    [px - halfW, MAT_Y - 20 + bob],
    [px + halfW, MAT_Y - 20 + bob],
    [px + halfBot, MAT_Y + 70 + bob],
    [px - halfBot, MAT_Y + 70 + bob],
  ], '#f3e2bd', '#b78b48', 2);
  d.poly([
    [px - 22 * pulseScale, MAT_Y + 4 + bob],
    [px + 22 * pulseScale, MAT_Y + 4 + bob],
    [px + 18 * pulseScale, MAT_Y + 40 + bob],
    [px - 18 * pulseScale, MAT_Y + 40 + bob],
  ], '#6b2030', '#d2a65b', 2);
  if ((s.matPulse || 0) > 0) d.glow(px, MAT_Y + 24 + bob, 56 + s.matPulse * 40, '#ffe6a4');
  d.text('you', px, MAT_Y + 28 + bob, 16, '#f8e4b3');
}

export default {
  title: 'Spiral Slide',
  intro: 'Choose your spiral. Catch what tumbles. Tilly’s helter carries you down — TURN each ring so a ladder faces you, and catch what sits on the spiral. From chapter 2, burgundy cushions and rolled mats appear on some arcs — TURN clear of them toward the ladder. From chapter 3, short tunnels hide the notches — a warning symbol shows the safe exit before darkness. From chapter 4, three notches reconnect — cream ladder wins, snake soft-dumps, gold/teal side chute soft-reconnects (no ladder credit); a tiny map shows the join.',
  instructions: 'Choose your spiral. Catch what tumbles. TURN the ring (drag around the tower or ← →) so the cream ladder faces you before you drop through. Land on 3 ladders. A snake is a soft dump — the ride never aborts. From chapter 2 (Bunting Bend), cushions and rolled mats block a notch if you commit into them — soft redirect, never an abort. From chapter 3 (Tunnel Turn), a warning symbol shows which notch is the safe exit before the ring goes dark — follow the symbol and TURN; darkness dims the ring art but the symbol stays readable. From chapter 4 (Three-Way Tower), three notches reconnect — TURN the cream ladder; the gold/teal side chute is a soft reconnect with no ladder credit; the map shows paths rejoining. First chapter ride is free practice and keeps nothing; later rides cost a penny.',
  levels: LEVEL_NAMES,
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 70,
  create(level, rng) {
    const rand = typeof rng === 'function' ? rng : Math.random;
    const plan = chapterPlan(level, rand);
    return makeRideState(level, rand, {
      hits: 0,
      goal: GOAL,
      treasureId: TREASURES[level] || TREASURES[0],
      rings: plan.rings,
      planTreasureRing: plan.treasureRing,
      duration: plan.duration,
      denserBunting: !!plan.denserBunting,
      threeWay: !!plan.threeWay,
      camBank: 0,
      towerY: 520,
      drag: null,
      turnedOnce: false,
      previewing: false,
      previewT: 0,
      launched: false,
      fx: [],
      matPulse: 0,
      finishPulse: 0,
      phaseFlash: 0,
      phaseFlashLabel: '',
      statusCopy: '',
      challengeOkFlash: false,
      snakeSlide: 0,
      ringFlourish: 0,
      cushionWarned: false,
      tunnelWarned: false,
      threewayWarned: false,
    });
  },
  update(s, dt) {
    tickFx(s, dt);
    if (s.result || s.broke) return;

    if (ensureBoarded(s, RIDE, s.treasureId, ['ring-0', 'ring-1', 'ring-2', 'ring-3', 'ring-4'])) {
      s.previewing = true;
      s.previewT = 0;
      s.launched = false;
      s.t = 0;
      s.progress = 0;
      s.fx = [];
      s.matPulse = 0;
      s.finishPulse = 0;
      s.phaseFlash = 0;
      s.phaseFlashLabel = '';
      s.statusCopy = '';
      s.turnedOnce = false;
      s.snakeSlide = 0;
      s.ringFlourish = 0;
      s.cushionWarned = false;
      s.tunnelWarned = false;
      s.threewayWarned = false;
      const teachTun = (s.rings || []).find((r) => r.tunnel && r.tunnel.teach);
      const teachCush = (s.rings || []).find((r) => r.cushion && r.cushion.teach);
      const teachThree = (s.rings || []).find((r) => r.threeway && r.threeway.teach);
      s.note = teachThree
        ? 'Three ways — TURN the cream ladder. Map shows the join.'
        : teachTun
          ? 'Tunnel ahead — watch the exit symbol before darkness.'
          : teachCush
            ? 'Cushion ahead — TURN clear of it toward the ladder.'
            : 'TURN the ring so the ladder faces you.';
      // Fair treasure spawn: always on a ladder segment of an authored ring.
      if (s.eligible) {
        const preferred = ['ring-2', 'ring-1', 'ring-3', 'ring-0', 'ring-4'];
        if (!preferred.includes(s.spawnId)) s.spawnId = 'ring-2';
        const idx = Number(String(s.spawnId).replace('ring-', '')) || 1;
        s.planTreasureRing = clamp(idx, 0, s.rings.length - 1);
      }
      logAction(s, 'preview', {secs: PREVIEW_SECS});
    }
    if (s.result) return;

    // Smooth ring spin toward the player's target (less flourish if reduced motion).
    const reduced = reducedMotion(s);
    const spinLerp = reduced ? 10 : 14;
    for (const ring of s.rings) {
      if (ring.done) continue;
      let diff = ring.targetTheta - ring.theta;
      while (diff > Math.PI) diff -= TAU;
      while (diff < -Math.PI) diff += TAU;
      ring.theta = angNorm(ring.theta + diff * Math.min(1, dt * spinLerp));
    }

    // Soft camera bank from ring facing — reduced motion keeps windows, less bank.
    const live = activeRing(s);
    const liveFace = live ? ringFacing(live, live.targetTheta) : null;
    const faceSign = liveFace === 'ladder' ? -1 : (liveFace === 'landmark' ? 0 : (liveFace ? 1 : 0));
    const targetBank = faceSign * (reduced ? 4 : 14);
    s.camBank += (targetBank - s.camBank) * Math.min(1, dt * 3.5);
    s.towerY = 480 + (s.progress || 0) * 80;

    if (s.previewing && !s.launched) {
      s.previewT += dt;
      if (s.previewT >= PREVIEW_SECS) {
        s.previewing = false;
        s.launched = true;
        s.t = 0;
        s.progress = 0;
        s.note = 'Tilly releases the mat!';
        s.statusCopy = 'Sliding';
        logAction(s, 'release', {});
        spawnTreasure(s);
      }
      return;
    }

    s.t += dt;
    s.progress = Math.min(1, s.t / s.duration);

    // Reveal treasure once its ring is approaching.
    if (s.treasure && !s.treasure.taken) {
      const tr = s.rings[s.treasure.ring];
      if (tr && s.t >= tr.t - 4) s.treasureRevealed = true;
    }

    // Ch4 teach loop: long warn before the first three-way ring commits.
    const liveRing = activeRing(s);
    if (liveRing && liveRing.threeway && liveRing.threeway.teach && !liveRing.done) {
      if (s.t >= liveRing.t - THREEWAY_WARN_SECS) {
        if (!s.threewayWarned) {
          s.threewayWarned = true;
          s.statusCopy = 'Three ways';
          s.phaseFlash = 0.7;
          s.phaseFlashLabel = 'Three ways';
          logAction(s, 'threeway-warn', {ring: liveRing.i, lead: THREEWAY_WARN_SECS});
        }
        const face = ringFacing(liveRing, liveRing.targetTheta);
        if (face === 'ladder' && facingTight(liveRing.targetTheta)) {
          s.note = 'Ladder faces you — drop through when it arrives.';
        } else if (face === 'landmark') {
          s.note = 'Side chute reconnects — TURN cream ladder for credit.';
        } else {
          s.note = 'Three ways — TURN the cream ladder. Map shows the join.';
        }
      }
    }

    // Ch2 teach loop: long warn before the first cushion ring commits.
    if (liveRing && liveRing.cushion && liveRing.cushion.teach && !liveRing.done) {
      if (s.t >= liveRing.t - CUSHION_WARN_SECS) {
        if (!s.cushionWarned) {
          s.cushionWarned = true;
          s.statusCopy = 'Cushion ahead';
          s.phaseFlash = 0.7;
          s.phaseFlashLabel = 'Cushion';
          logAction(s, 'cushion-warn', {ring: liveRing.i, lead: CUSHION_WARN_SECS});
        }
        s.note = 'Cushion ahead — TURN clear of it toward the ladder.';
      }
    }

    // Ch3 teach loop: exit symbol before darkness on the first tunnel ring.
    if (liveRing && liveRing.tunnel && !liveRing.done) {
      const phase = tunnelPhase(s, liveRing);
      const exit = tunnelExitKind(liveRing);
      if (phase === 'warn' || phase === 'dark') {
        if (liveRing.tunnel.teach && !s.tunnelWarned && phase === 'warn') {
          s.tunnelWarned = true;
          s.statusCopy = 'Tunnel symbol';
          s.phaseFlash = 0.75;
          s.phaseFlashLabel = 'Tunnel';
          logAction(s, 'tunnel-warn', {ring: liveRing.i, exit, lead: TUNNEL_WARN_SECS});
        }
        if (phase === 'dark' && liveRing.tunnel.teach) {
          s.note = exit === 'ladder'
            ? 'Dark tunnel — follow the symbol; TURN ladder to face you.'
            : 'Dark tunnel — follow the symbol; TURN snake to face you.';
          if (s.statusCopy !== 'Tunnel exit set') s.statusCopy = 'Dark — follow symbol';
        } else if (liveRing.tunnel.teach) {
          s.note = exit === 'ladder'
            ? 'Tunnel ahead — symbol shows ladder exit. TURN before darkness.'
            : 'Tunnel ahead — symbol shows snake exit. TURN before darkness.';
        }
      }
    }

    // One discrete commit per ring when the mat reaches it (Helix-style drop through).
    s.rings.forEach((ring) => {
      if (!ring.done && s.t >= ring.t) commitRing(s, ring);
    });

    if (s.t >= s.duration) {
      const ok = s.hits >= s.goal;
      s.challengeOkFlash = ok;
      s.finishPulse = 1.4;
      s.matPulse = 0.6;
      s.phaseFlash = 1.0;
      s.phaseFlashLabel = ok ? 'Clear' : 'Short';
      s.statusCopy = ok ? 'Clear! Bottom mat.' : 'Short on ladders — bottom mat.';
      pushSparks(s, CX + (s.camBank || 0), 1120, !ok);
      pushRingFx(s, CX + (s.camBank || 0), 1120, !ok);
      if (ok) pushLabel(s, CX, 1080, 'clear!', false);
      finishRide(s, {
        rideId: RIDE,
        treasureId: s.treasureId,
        challengeOk: ok,
        completionFind: 'star-token',
      });
    }
  },
  pointer(s, type, p) {
    if (s.result || s.broke) return;
    if (type === 'down') s.drag = {x: p.x, y: p.y};
    if (type === 'move' && s.drag) applyPointerTurn(s, p);
    if (type === 'up') {
      if (s.drag) applyPointerTurn(s, p);
      s.drag = null;
    }
    if (type === 'cancel') s.drag = null;
  },
  key(s, k, down) {
    if (!down || s.result || s.broke) return;
    if (k === 'ArrowLeft') turnRing(s, -NUDGE);
    if (k === 'ArrowRight') turnRing(s, NUDGE);
  },
  draw(s, d) {
    const bank = s.camBank || 0;
    const preview = !!(s.previewing && !s.launched);
    const clock = preview ? s.previewT : s.t;
    const teach = teachWindow(s, preview);
    const ring = activeRing(s);

    // Soft oval vignette only — do not hide helter.png court.
    d.ellipse(CX + bank * 0.15, 640, 390, 520, '#4a182414');

    drawBunting(d, 150, !!s.denserBunting);
    drawTowerHint(d, s);
    drawJoinLandmarks(d, s);

    if (preview) {
      d.ellipse(CX + bank * 0.1, 175, 120, 28, '#f3e2bd33', '#d2a65b55', 1.5);
      d.text('launch', CX + bank * 0.1, 175, 14, '#f0d09a88');
    }

    // Ch4 tiny map during teach / approach of the three-way teach ring.
    if (s.threeWay) {
      const tw = (s.rings || []).find((r) => r.threeway && r.threeway.teach && !r.done);
      const lead = tw ? (tw.t - (s.launched ? s.t : -PREVIEW_SECS)) : Infinity;
      const showMap = !!tw && (preview || lead <= THREEWAY_WARN_SECS || !s.launched);
      if (showMap) drawTinyMap(d, s, clock, true);
      else if (s.threeWay && preview) drawTinyMap(d, s, clock, false);
    }

    // Draw rings back-to-front (top first).
    const order = s.rings.slice().sort((a, b) => ringScreenY(s, a) - ringScreenY(s, b));
    for (const r of order) drawRingToy(d, s, r, clock, teach);

    drawMat(d, s, clock);

    // Bottom arrival mat hint near the end / finish celebration.
    const nearEnd = !preview && s.progress > 0.82;
    const celebrating = (s.finishPulse || 0) > 0;
    if (nearEnd || celebrating) {
      const fp = celebrating ? s.finishPulse / 1.4 : 0;
      d.ellipse(CX + bank, 1120, 160 + fp * 40, 36 + fp * 10, '#f3e2bd55', celebrating ? '#ffe6a4cc' : '#d2a65b88', celebrating ? 3 : 2);
      if (celebrating) d.glow(CX + bank, 1120, 80 + fp * 50, s.challengeOkFlash ? '#ffe6a4' : '#8ec8e8');
      d.text(celebrating ? (s.challengeOkFlash ? 'bottom mat · clear' : 'bottom mat') : 'bottom mat', CX + bank, 1120, 18, '#f0d09a');
    }

    drawFx(d, s);
    drawPracticeBadge(d, s, teach && !!s.practice);
    drawStateChip(d, s, preview);
    drawTurnChrome(d, s, clock, teach);
    drawBottomStrip(d, s, preview, ring);

    drawHud(d, s, {goal: s.goal, count: s.hits, label: 'ladders'});
  },
  readout: (s) => s.note || '',
};
