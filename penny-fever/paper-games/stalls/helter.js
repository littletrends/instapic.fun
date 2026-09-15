/*
 * Spiral Slide (helter) — Chapter 1 First Spiral ONLY.
 * Locked remix: Snakes & Ladders on a helter + Helix/Tempest DNA.
 * ONE verb: TURN the ring (drag/swipe around the tower) so a ladder faces you
 * (boost/safe) or a snake faces you (soft dump/redirect — never abort paid ride).
 * The tower/ring is the toy. Paper 1-layer 2D; helter.png court stays hero —
 * translucent overlays only, no solid court overpaint.
 * Tagline: Choose your spiral. Catch what tumbles.
 *
 * Unfinished chapters 2–6:
 *   2 Bunting Bend — cushions / rolled mats as obstacles, taught separately
 *   3 Tunnel Turn — short tunnels; warning symbol shows exit notch before darkness
 *   4 Three-Way Tower — three notches that reconnect; landmark colours + tiny map
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
const RIDE_SECONDS = 36;
const PREVIEW_SECS = 2.2;
const TEACH_SECS = 5;
const GOAL = 3;
const RING_COUNT = 3;
const FX_CAP = 48;
/** Angular half-width that counts as "facing you" at the bottom notch. */
const FACE_SNAP = Math.PI / 3;
const NUDGE = Math.PI / 10;

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

function chapterPlan(level, rng) {
  const haste = 1 + Math.min(0.2, level * 0.035);
  const duration = RIDE_SECONDS / haste;
  // Three rings spaced through the slow descent; treasure prefers the middle ladder.
  const times = [0.22, 0.48, 0.74].map((f) => f * duration);
  const treasureRing = 1;
  const rings = times.map((t, i) => {
    // Start slightly off so the player must TURN at least once to land ladder.
    const start = (rng() < 0.5 ? Math.PI * 0.55 : Math.PI * 1.45) + (rng() - 0.5) * 0.2;
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
    };
  });
  return {duration, rings, treasureRing};
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
  const face = facingKind(ring.targetTheta);
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
    delta = dx * 0.012;
  }
  if (Math.abs(delta) < 0.004) return;
  turnRing(s, delta);
  s.drag = {x: p.x, y: p.y};
}

function spawnTreasure(s) {
  if (!s.eligible || s.treasure) return;
  const idx = clamp(s.planTreasureRing ?? 1, 0, s.rings.length - 1);
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
  ring.theta = ring.targetTheta;
  const face = facingKind(ring.theta);
  ring.done = true;
  ring.result = face;
  logAction(s, 'commit', {ring: ring.i, face, theta: Math.round(ring.theta * 1000) / 1000});

  const y = ringScreenY(s, ring);
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
    // Tiny soft slide-back on the descent clock (still finishes).
    s.t = Math.max(0, s.t - 1.4);
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
  if (!s.turnedOnce) return 'TURN the ring so the ladder faces you.';
  if (ring && !ring.done) {
    const face = facingKind(ring.targetTheta);
    if (face === 'ladder' && facingTight(ring.targetTheta)) {
      return 'Ladder faces you — drop through when it arrives.';
    }
    if (face === 'snake') return 'Snake faces you — TURN toward the cream ladder.';
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
  const taught = !!s.turnedOnce && !teach;
  // Big TURN chrome like TAP GAZE — fades after taught.
  if (taught) {
    const a = '55';
    d.text('↺  TURN  ↻', 450, 1048, 18, '#f0d09a' + a);
    return;
  }
  const pulse = 0.55 + 0.45 * Math.sin(clock * 4.2);
  const fillHex = Math.floor((0.42 + pulse * 0.28) * 255).toString(16).padStart(2, '0');
  const strokeHex = Math.floor((0.55 + pulse * 0.35) * 255).toString(16).padStart(2, '0');
  const textHex = Math.floor((0.9 + pulse * 0.1) * 255).toString(16).padStart(2, '0');
  d.poly(
    [[250, 990], [650, 990], [640, 1075], [260, 1075]],
    '#2a1814' + fillHex, '#d2a65b' + strokeHex, 2.5,
  );
  d.text('↺  TURN  ↻', 450, 1025, 36, '#fff6d8' + textHex);
  d.text('drag around the tower', 450, 1055, 16, '#f0d09a' + textHex);
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

function drawRingToy(d, s, ring, clock, teach) {
  if (ring.done && ringScreenY(s, ring) < TOWER_TOP + 20) return;
  const y = ringScreenY(s, ring);
  const rx = ringRadius(s, ring);
  const ry = rx * 0.38;
  const theta = ring.theta;
  const face = facingKind(ring.targetTheta);
  const tight = facingTight(ring.targetTheta);
  const active = !ring.done && ring === activeRing(s);
  const pulse = (teach && active) ? (0.55 + 0.45 * Math.sin(clock * 5)) : (active ? (0.35 + 0.25 * Math.sin(clock * 3.5)) : 0);
  const reduced = reducedMotion(s);
  const flourish = (!reduced && (s.ringFlourish || 0) > 0 && ring.done) ? s.ringFlourish * 8 : 0;

  // Gold rail ring — translucent, never solid court overpaint.
  const fillA = active ? '28' : '14';
  const stroke = active ? '#d2a65bcc' : '#d2a65b66';
  d.ellipse(CX, y, rx, ry, '#5a3a22' + fillA, stroke, active ? 3.2 : 1.8);
  if (active && pulse > 0) {
    d.ellipse(CX, y, rx + 6 + pulse * 10, ry + 3 + pulse * 4, null, '#ffe6a4' + Math.floor(pulse * 160).toString(16).padStart(2, '0'), 2);
  }

  // Open notches: ladder at local 0 + theta → world angle; bottom-facing is π/2.
  // World draw angle for a local notch a: a + theta, with 0 = +x, π/2 = +y (down / you).
  const ladderAng = theta + flourish + Math.PI / 2; // when theta=0, ladder at bottom
  const snakeAng = theta + Math.PI + flourish + Math.PI / 2;

  drawLadderNotch(d, CX, y, rx, ry, ladderAng, active && face === 'ladder' && tight);
  drawSnakeNotch(d, CX, y, rx, ry, snakeAng, active && face === 'snake');

  // Facing marker at bottom of ring ("you").
  if (active) {
    d.glow(CX, y + ry, 28 + pulse * 12, face === 'ladder' ? '#ffe6a4' : '#c6748388');
    d.text(face === 'ladder' ? 'ladder' : 'snake', CX, y + ry + 22, 14, face === 'ladder' ? '#f4d590' : '#e8b0b0');
  }

  // Result stamp after commit.
  if (ring.done) {
    const stamp = ring.result === 'ladder' ? '▲ ladder' : '∿ snake';
    d.text(stamp, CX, y - ry - 14, 14, ring.result === 'ladder' ? '#f4d590aa' : '#c67483aa');
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

function drawBunting(d, y) {
  for (let i = 0; i < 7; i++) {
    const x = 160 + i * 95;
    const col = i % 2 ? '#6b2030aa' : '#f3e2bdaa';
    d.poly([[x, y], [x + 28, y], [x + 14, y + 26]], col, '#d2a65b66', 1);
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
    const face = facingKind(ring.targetTheta);
    d.text(face === 'ladder' ? 'facing: ladder' : 'facing: snake', 450, 1156, 13, '#f0d09acc');
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
  intro: 'Choose your spiral. Catch what tumbles. Tilly’s helter carries you down — TURN each ring so a ladder faces you, and catch what sits on the spiral.',
  instructions: 'Choose your spiral. Catch what tumbles. TURN the ring (drag around the tower or ← →) so the cream ladder faces you before you drop through. Land on 3 ladders. A snake is a soft dump — the ride never aborts. First chapter ride is free practice and keeps nothing; later rides cost a penny.',
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
    });
  },
  update(s, dt) {
    tickFx(s, dt);
    if (s.result || s.broke) return;

    if (ensureBoarded(s, RIDE, s.treasureId, ['ring-0', 'ring-1', 'ring-2'])) {
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
      s.note = 'TURN the ring so the ladder faces you.';
      // Fair treasure spawn: always on a ladder segment of an authored ring.
      if (s.eligible) {
        const preferred = ['ring-1', 'ring-0', 'ring-2'];
        if (!preferred.includes(s.spawnId)) s.spawnId = 'ring-1';
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
    const faceSign = live ? (facingKind(live.targetTheta) === 'ladder' ? -1 : 1) : 0;
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

    drawBunting(d, 150);
    drawTowerHint(d, s);

    if (preview) {
      d.ellipse(CX + bank * 0.1, 175, 120, 28, '#f3e2bd33', '#d2a65b55', 1.5);
      d.text('launch', CX + bank * 0.1, 175, 14, '#f0d09a88');
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
      if (celebrating) d.glow(CX + bank, 1120, 80 + fp * 50, s.challengeOkFlash ? '#ffe6a4' : '#8ec8e888');
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
