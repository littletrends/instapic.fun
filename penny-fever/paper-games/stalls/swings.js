/*
 * Skyward Swings (Hugo) — Ride & Seek stall
 *
 * SHIPPED: Chapter 1 First Swing — Lit Reach.
 *   Rainbow Islands pop energy on a Tempest circle. Chair carousel auto-orbits
 *   Hugo’s tower. ONE verb: HOLD to stretch radius outward; RELEASE springs in.
 *   Vertical drag has no gameplay meaning; chair height is visual only.
 *   Targets are star-bubbles / lanterns on radius bands. Green “lined up” lit
 *   state fires BEFORE the catch window (Hold-the-Line SAFE). Catch = POP burst
 *   (flash + sparks + fly-home), not a silent ring pass. Two bands only
 *   (inner / outer), long approaches (~1.8 s), no forced pushes. Platform
 *   shadow + glints show current vs target band. Ease ~620 ms between adjacent
 *   bands, no snap. Unique court (swings.png) is hero — never full-canvas
 *   overpaint. Tagline: Swing wide. Catch the night.
 *
 * UNFINISHED CHAPTERS (file-top note — do not rename treasures / levels):
 *   2 Ribbon Round — add middle band; teach inner and outer ribbon gates
 *     separately; height is not player-controlled
 *   3 Star Circles — sequences that reward holding a smooth line, not frantic
 *     switching
 *   4 Cloud Waltz — clouds hide objects but shadows show the band first
 *   5 Bell Flight — bell pitch / symbol maps to the three bands
 *   6 The Midnight Waltz — combine taught patterns; treasure gets one full
 *     warning circuit
 */
import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
  prefersReducedMotion,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'swings';
const TREASURES = ['swing-spinner', 'heart-gear', 'star-token', 'prize-bag', 'music-carousel', 'ride-ticket'];
const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
const LEVELS = [
  'First Swing', 'Ribbon Round', 'Star Circles',
  'Cloud Waltz', 'Bell Flight', 'The Midnight Waltz',
];

const CX = 450;
const CY = 392;           // Hugo’s painted tower on swings.png
const SQUASH = 0.62;      // platform foreshortening
const INNER_R = 148;
const OUTER_R = 292;
const EASE_SEC = 0.62;    // 620 ms between adjacent bands (500–700, no snap)
const OMEGA = 0.84;       // rad/s — lit windows stay identical in reduced motion
const TAU = Math.PI * 2;
const GOAL = 4;
const CATCH_HALF = 0.34;  // rad sweep window (~0.40 s at OMEGA)
const APPROACH = 1.55;    // rad of visible approach (~1.8 s)
const FINISH_THETA = 3.12 * TAU; // land after the fourth bubble
const FLASH_SEC = 0.28;   // POP bloom
const MISS_FLASH = 0.22;
const FLY_DUR = 0.62;
const PURSE = {x: 86, y: 72};
const PRIZE_CORNER = {x: 792, y: 78};

// Lit Reach palette — green lined-up, gold idle, cool miss, warm POP
const GREEN = '#5ee08a';
const GREEN_SOFT = '#7ef0a8';
const GOLD = '#f4d590';
const GOLD_DIM = '#d2a65b';
const COOL = '#8ec8e8';
const CREAM = '#fff6d8';

const SPAWNS = ['inner', 'outer'];

/** Chapter 1: two bands, alternating inner/outer, long approaches, no pushes. */
function ch1Bubbles() {
  return [
    {theta: 0.92 * TAU, band: 0, taken: false}, // inner — after a learning lap
    {theta: 1.58 * TAU, band: 1, taken: false}, // outer
    {theta: 2.24 * TAU, band: 0, taken: false}, // inner
    {theta: 2.90 * TAU, band: 1, taken: false}, // outer
  ];
}

function reducedOf(s) {
  if (typeof prefersReducedMotion === 'function') {
    try { if (prefersReducedMotion()) return true; } catch { /* fall through */ }
  }
  return !!s.reduced;
}

function pageHidden() {
  try {
    if (typeof document === 'undefined') return false;
    return !!(document.hidden || document.visibilityState === 'hidden');
  } catch {
    return false;
  }
}

function bandRadius(band) {
  return band ? OUTER_R : INNER_R;
}

function radiusAt(u) {
  return INNER_R + clamp(u, 0, 1) * (OUTER_R - INNER_R);
}

function orbitPoint(angle, radius) {
  return {
    x: CX + Math.cos(angle) * radius,
    y: CY + Math.sin(angle) * radius * SQUASH,
  };
}

function depthOf(angle) {
  // 0 = behind the tower, 1 = swinging toward the cream court.
  return 0.5 + 0.5 * Math.sin(angle);
}

function currentBand(u) {
  return u >= 0.5 ? 1 : 0;
}

function bandLabel(band) {
  return band ? 'outer' : 'inner';
}

/** Ahead angle of a fixed world target relative to the chair. */
function aheadOf(s, theta) {
  return theta - s.theta;
}

/**
 * Green “lined up” lit — chair already on the target’s band while the
 * bubble/lantern is in approach (before + through the catch window).
 * Same windows in reduced motion.
 */
function isLinedUp(s, band, theta) {
  const ahead = aheadOf(s, theta);
  if (ahead > APPROACH || ahead < -CATCH_HALF) return false;
  return currentBand(s.radiusU) === band;
}

function setLean(s, on) {
  const next = !!on;
  if (s.holding === next) return;
  s.holding = next;
  const dest = next ? 1 : 0;
  if (s.easeTo !== dest) {
    s.easeFrom = s.radiusU;
    s.easeTo = dest;
    s.easeT = 0;
  }
  if (next) s.leanCue = 0.35;
  logAction(s, 'lean', {on: next});
}

function refreshLean(s, input) {
  if (pageHidden() || s.backgrounded) {
    s.holdPointer = false;
    s.holdAction = false;
    setLean(s, false);
    return;
  }
  const fromInput = !!(input?.actions?.has?.('lean') || input?.down);
  setLean(s, !!(s.holdPointer || s.holdAction || fromInput));
}

function pushFly(s, id, x, y, prize) {
  s.fly = s.fly || [];
  s.fly.push({id, x, y, t: 0, dur: FLY_DUR, prize: !!prize});
}

/** Rainbow Islands POP — warm burst. Cool = miss flash, quieter. */
function pushBurst(s, x, y, cool) {
  s.sparks = s.sparks || [];
  const n = cool ? 6 : 12;
  for (let i = 0; i < n; i++) {
    const a = (TAU * i) / n + (cool ? 0.15 : s.t * 0.4);
    const sp = cool ? 48 : 110;
    s.sparks.push({
      x, y,
      vx: Math.cos(a) * sp * (0.7 + (i % 3) * 0.15),
      vy: Math.sin(a) * sp * SQUASH * (0.7 + (i % 3) * 0.15),
      t: 0,
      dur: cool ? 0.3 : 0.48,
      cool: !!cool,
      r: cool ? 2.6 : 3.8,
      pop: !cool,
    });
  }
  if (!cool) {
    // Inner star shards for the POP read
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (TAU / 5);
      s.sparks.push({
        x, y,
        vx: Math.cos(a) * 55,
        vy: Math.sin(a) * 55 * SQUASH,
        t: 0,
        dur: 0.36,
        cool: false,
        r: 2.2,
        pop: true,
      });
    }
  }
}

function spawnTreasure(s) {
  if (!s.eligible || s.treasure) return;
  const band = s.spawnId === 'inner' ? 0 : 1;
  // Visible for a full circuit (green warning), then POP-swept on same angle.
  s.treasure = {
    id: s.treasureId,
    band,
    warnTheta: 1.02 * TAU,
    sweepTheta: 2.02 * TAU,
    taken: false,
  };
}

function tryPopBubble(s, bubble, i) {
  if (bubble.taken) return;
  const d = s.theta - bubble.theta;
  if (d < -CATCH_HALF || d > CATCH_HALF) return;
  if (currentBand(s.radiusU) !== bubble.band) return;
  bubble.taken = true;
  bubble.flash = FLASH_SEC;
  bubble.lit = false;
  s.passed += 1;
  const findId = ORDINARY[s.passed % ORDINARY.length];
  recordFind(s, findId, RIDE);
  logAction(s, 'bubble', {band: bubble.band, i, passed: s.passed, pop: true});
  const p = orbitPoint(bubble.theta, bandRadius(bubble.band));
  pushFly(s, findId, p.x, p.y, false);
  pushBurst(s, p.x, p.y, false);
  s.popFlash = FLASH_SEC;
  s.note = 'POP! ' + s.passed + ' / ' + s.goal;
}

function trySweepTreasure(s) {
  const tr = s.treasure;
  if (!tr || tr.taken) return;
  if (s.theta < tr.warnTheta) return;
  s.treasureRevealed = true;
  const d = s.theta - tr.sweepTheta;
  if (d < -CATCH_HALF || d > CATCH_HALF * 1.4) return;
  if (currentBand(s.radiusU) !== tr.band) return;
  tr.taken = true;
  tr.flash = FLASH_SEC;
  recordTreasure(s, tr.id);
  logAction(s, 'treasure', {band: tr.band, id: tr.id, pop: true});
  const p = orbitPoint(tr.sweepTheta, bandRadius(tr.band));
  pushFly(s, tr.id, p.x, p.y, true);
  pushBurst(s, p.x, p.y, false);
  s.popFlash = FLASH_SEC;
  s.note = 'The aerial keepsake — POP!';
}

function tickFx(s, dt) {
  if (s.leanCue > 0) s.leanCue = Math.max(0, s.leanCue - dt);
  if (s.screenFlash > 0) s.screenFlash = Math.max(0, s.screenFlash - dt);
  if (s.popFlash > 0) s.popFlash = Math.max(0, s.popFlash - dt);
  s.bubbles.forEach((b) => {
    if (b.flash > 0) b.flash = Math.max(0, b.flash - dt);
    if (b.missFlash > 0) b.missFlash = Math.max(0, b.missFlash - dt);
  });
  if (s.treasure?.flash > 0) s.treasure.flash = Math.max(0, s.treasure.flash - dt);
  if (s.fly) {
    for (const f of s.fly) f.t += dt;
    s.fly = s.fly.filter((f) => f.t < f.dur);
  }
  if (s.sparks) {
    for (const sp of s.sparks) {
      sp.t += dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vx *= 0.9;
      sp.vy *= 0.9;
    }
    s.sparks = s.sparks.filter((sp) => sp.t < sp.dur);
  }
}

function drawStar(d, x, y, r, fill, stroke) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  d.poly(pts, fill || GOLD, stroke || GOLD_DIM, 1.5);
}

/** Star-bubble / lantern — soft globe with star core; green when lined up. */
function drawBubble(d, x, y, depth, lit, flash, miss) {
  const r = 18 + depth * 7;
  if (flash > 0) {
    const bloom = 1 + (flash / FLASH_SEC) * 1.1;
    d.glow(x, y, 56 * bloom, CREAM);
    d.circle(x, y, r * bloom, '#ffe6a4cc', CREAM, 5);
    drawStar(d, x, y, 12 + depth * 3, CREAM, GOLD);
    // POP ring expanding
    d.circle(x, y, r * (1.4 + (1 - flash / FLASH_SEC) * 1.6), null, '#ffe6a488', 3);
    return;
  }
  if (miss > 0) {
    d.glow(x, y, 40, COOL);
    d.circle(x, y, r, '#8ec8e844', COOL, 4);
    drawStar(d, x, y, 9 + depth * 3, '#c8e4f0', '#6a90b8');
    return;
  }
  if (lit) {
    // Hold-the-Line SAFE: green lined-up BEFORE the catch
    d.glow(x, y, 44 + depth * 8, GREEN);
    d.circle(x, y, r + 4, '#5ee08a33', GREEN, 5);
    d.circle(x, y, r, '#7ef0a866', GREEN_SOFT, 3.2);
    drawStar(d, x, y, 10 + depth * 3, CREAM, GREEN);
    d.text('lined up', x, y - r - 14, 14, GREEN_SOFT);
    return;
  }
  // Idle approaching lantern — gold, readable, not scream-loud
  const pulse = 0.7 + 0.3 * Math.sin(depth * 6);
  d.glow(x, y, 22 + pulse * 10, '#f4d59066');
  d.circle(x, y, r, '#f4d59022', GOLD_DIM, 2.8);
  d.circle(x, y, r * 0.72, '#f8e4b344', GOLD, 1.6);
  drawStar(d, x, y, 8 + depth * 2.5, '#f8e4b3', GOLD_DIM);
}

function drawChain(d, ax, ay, bx, by, player) {
  const links = player ? 5 : 3;
  const w = player ? 2.4 : 1.3;
  d.line({x: ax, y: ay}, {x: bx, y: by}, GOLD_DIM, w);
  if (!player) return;
  for (let i = 1; i < links; i++) {
    const u = i / links;
    const x = ax + (bx - ax) * u;
    const y = ay + (by - ay) * u;
    d.circle(x, y, 2.4, '#c8964aaa', '#f0d09a', 1);
  }
}

function drawChair(d, x, y, scale, fly, depth, player, bank) {
  const w = 36 * scale;
  const kick = fly * 11 * scale;
  const tip = (bank || 0) * 0.018 * scale;
  const seatY = y;
  const chainTop = y - 78 * scale - (1 - depth) * 10;
  const left = x - w * 0.42 + kick - tip * 8;
  const right = x + w * 0.42 + kick + tip * 8;
  drawChain(d, x - w * 0.28, chainTop, left, seatY - 6 * scale, player);
  drawChain(d, x + w * 0.28, chainTop, right, seatY - 6 * scale, player);
  const back = [
    [left - 2, seatY - 28 * scale],
    [right + 2, seatY - 28 * scale],
    [right - 2, seatY - 4 * scale],
    [left + 2, seatY - 4 * scale],
  ];
  const seat = [
    [left - 4, seatY - 6 * scale],
    [right + 4, seatY - 6 * scale],
    [right + kick * 0.2, seatY + 18 * scale],
    [left + kick * 0.2, seatY + 18 * scale],
  ];
  const fillBack = player ? '#6b2030ee' : '#6b203055';
  const fillSeat = player ? '#8a2840ee' : '#6b203044';
  d.poly(back, fillBack, GOLD_DIM, player ? 2 : 1);
  d.poly(seat, fillSeat, '#f0d09a', player ? 2 : 1);
  if (player) {
    d.poly([
      [left - 2, seatY - 8 * scale],
      [right + 2, seatY - 8 * scale],
      [right + 1, seatY - 2 * scale],
      [left - 1, seatY - 2 * scale],
    ], '#f0d09a88', GOLD, 1.4);
    d.poly([
      [x - 8 * scale + kick * 0.4, seatY - 22 * scale],
      [x + 8 * scale + kick * 0.4, seatY - 22 * scale],
      [x + 6 * scale + kick * 0.5, seatY + 2 * scale],
      [x - 6 * scale + kick * 0.5, seatY + 2 * scale],
    ], '#f3e2bd', '#b78b48', 1.5);
    d.ellipse(x + kick * 0.15, seatY + 22 * scale, 22 * scale, 7 * scale, '#1a101066', null, 0);
  }
}

function drawCanopyHub(d, s) {
  // Light hub so chains have an origin — do not hide the painted tower.
  const hold = !!s.holding;
  d.circle(CX, CY - 8, 34, hold ? '#3a182088' : '#1a304488', hold ? GOLD : GOLD_DIM, hold ? 3.6 : 3);
  d.circle(CX, CY - 8, 18, hold ? '#8a2840cc' : '#6b2030aa', GOLD, 2);
  d.ellipse(CX, CY + 52, 48, 16, '#2a181433', '#d2a65b55', 1);
  if (hold) d.glow(CX, CY - 8, 54, GOLD);
  if (s.leanCue > 0) {
    const u = s.leanCue / 0.35;
    const reach = 40 + (1 - u) * 90;
    for (let i = 0; i < 6; i++) {
      const a = s.theta * 0.2 + i * (TAU / 6);
      const p0 = orbitPoint(a, 28);
      const p1 = orbitPoint(a, reach);
      d.line(p0, p1, GOLD + (u > 0.5 ? 'aa' : '55'), 2);
    }
  }
}

function drawBandShadows(d, s) {
  const target = s.holding ? 1 : 0;
  const cur = currentBand(s.radiusU);
  [0, 1].forEach((band) => {
    const rr = bandRadius(band);
    const isTarget = band === target;
    const isCur = band === cur;
    d.ellipse(
      CX, CY,
      rr, rr * SQUASH,
      isCur ? '#3a241866' : '#3a241814',
      isTarget ? '#f4d590ee' : (isCur ? '#d2a65bcc' : '#b78b4844'),
      isTarget ? 3.6 : (isCur ? 2.4 : 1.1),
    );
    if (isCur && !isTarget) {
      d.ellipse(CX, CY, rr * 0.97, rr * SQUASH * 0.97, '#2a181422', null, 0);
    }
    if (isTarget) {
      for (let i = 0; i < 8; i++) {
        const a = s.theta * 0.35 + i * (TAU / 8);
        const p = orbitPoint(a, rr);
        d.circle(p.x, p.y, 3.4, '#f4d590dd', GOLD_DIM, 1);
      }
      if (s.holding || s.easeT < 1) {
        const a = s.theta + Math.PI * 0.5;
        const tip = orbitPoint(a, rr + 18);
        const left = orbitPoint(a - 0.18, rr - 6);
        const right = orbitPoint(a + 0.18, rr - 6);
        d.poly(
          [[tip.x, tip.y], [left.x, left.y], [right.x, right.y]],
          '#f4d59055',
          '#f4d590cc',
          1.5,
        );
      }
    }
  });
}

function drawChairShadow(d, angle, radius, scale) {
  const ground = orbitPoint(angle, radius);
  d.ellipse(ground.x, ground.y + 16 * scale, 28 * scale, 10 * scale, '#1a101088', null, 0);
}

function drawFx(d, s) {
  for (const sp of (s.sparks || [])) {
    const u = sp.t / sp.dur;
    const a = 1 - u;
    const col = sp.cool ? COOL : (sp.pop ? CREAM : GOLD);
    const hex = Math.floor(a * 200).toString(16).padStart(2, '0');
    d.circle(sp.x, sp.y, sp.r * (1 - u * 0.45), col + hex, null, 0);
  }
  for (const f of (s.fly || [])) {
    const u = Math.min(1, f.t / f.dur);
    const e = 1 - (1 - u) * (1 - u);
    const dest = f.prize ? PRIZE_CORNER : PURSE;
    const fx = f.x + (dest.x - f.x) * e;
    const fy = f.y + (dest.y - f.y) * e - Math.sin(u * Math.PI) * 36;
    d.item(spriteKey(f.id), fx, fy, {
      w: 28 * (1 - u * 0.35),
      shadow: false,
      fallback: () => drawStar(d, fx, fy, 10 * (1 - u * 0.3), '#ffe6a4', GOLD_DIM),
    });
  }
}

export default {
  title: 'Skyward Swings',
  intro: 'Swing wide. Catch the night. HOLD to stretch out — RELEASE to spring in. Burst the star-bubbles.',
  instructions: 'One verb: HOLD to stretch out to the outer band. RELEASE to spring in. Line up green, then POP each star-bubble. First ride is free practice.',
  levels: LEVELS,
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 70,
  actions: [{id: 'lean', label: 'HOLD · stretch out', hold: true}],
  create(level, rng) {
    const reduced = typeof prefersReducedMotion === 'function' ? prefersReducedMotion() : false;
    return makeRideState(level, rng, {
      theta: -0.35,
      radiusU: 0,
      easeFrom: 0,
      easeTo: 0,
      easeT: 1,
      holding: false,
      holdPointer: false,
      holdAction: false,
      backgrounded: false,
      passed: 0,
      goal: GOAL,
      bubbles: ch1Bubbles(),
      treasureId: TREASURES[Math.max(0, Math.min(level, TREASURES.length - 1))],
      camBank: 0,
      pointer: null,
      reduced,
      fly: [],
      sparks: [],
      leanCue: 0,
      screenFlash: 0,
      popFlash: 0,
      coachUntil: 5,
    });
  },
  update(s, dt, input) {
    if (s.result || s.broke) return;

    if (ensureBoarded(s, RIDE, s.treasureId, SPAWNS)) {
      s.note = 'HOLD to stretch out · RELEASE to spring in';
      s.coachUntil = s.t + 5;
    }
    if (s.result) return;

    s.backgrounded = pageHidden();
    refreshLean(s, input);

    s.t += dt;
    s.theta += OMEGA * dt;

    if (s.easeT < 1) {
      s.easeT = Math.min(1, s.easeT + dt / EASE_SEC);
      const u = s.easeT * s.easeT * (3 - 2 * s.easeT);
      s.radiusU = s.easeFrom + (s.easeTo - s.easeFrom) * u;
    } else {
      s.radiusU = s.easeTo;
    }

    const reduced = reducedOf(s);
    const wantBank = (s.radiusU - 0.5) * (reduced ? 5 : 16);
    s.camBank += (wantBank - s.camBank) * Math.min(1, dt * 5);

    s.progress = Math.min(1, s.theta / FINISH_THETA);

    // Update green lit flags (readable before catch; same timing when reduced)
    s.bubbles.forEach((bubble) => {
      if (bubble.taken) {
        bubble.lit = false;
        return;
      }
      bubble.lit = isLinedUp(s, bubble.band, bubble.theta);
    });

    s.bubbles.forEach((bubble, i) => {
      tryPopBubble(s, bubble, i);
      if (!bubble.taken && !bubble.missed && s.theta > bubble.theta + CATCH_HALF) {
        bubble.missed = true;
        bubble.missFlash = MISS_FLASH;
        bubble.lit = false;
        s.screenFlash = 0.14;
        logAction(s, 'bubble-miss', {band: bubble.band, i});
        s.note = bubble.band
          ? 'HOLD — outer'
          : 'RELEASE — inner';
        const p = orbitPoint(bubble.theta, bandRadius(bubble.band));
        pushBurst(s, p.x, p.y, true);
      }
    });
    spawnTreasure(s);
    if (s.treasure && !s.treasure.taken && s.theta >= s.treasure.warnTheta) {
      s.treasure.lit = isLinedUp(s, s.treasure.band, s.treasure.sweepTheta)
        || (currentBand(s.radiusU) === s.treasure.band && s.theta < s.treasure.sweepTheta);
    }
    trySweepTreasure(s);
    tickFx(s, dt);

    if (s.theta >= FINISH_THETA) {
      finishRide(s, {
        rideId: RIDE,
        treasureId: s.treasureId,
        challengeOk: s.passed >= s.goal,
        completionFind: 'star-token',
      });
    }
  },
  action(s, id, on) {
    if (id !== 'lean' || s.result || s.broke) return;
    s.holdAction = !!on;
    refreshLean(s);
  },
  pointer(s, type, p) {
    if (s.result || s.broke) return;
    if (type === 'down') {
      s.pointer = {x: p.x, y: p.y};
      s.holdPointer = true;
      refreshLean(s);
      return;
    }
    if (type === 'move' && s.pointer) {
      // Radial stretch is the only axis that matters.
      // Vertical-only drag is ignored for gameplay — height is visual.
      s.pointer = {x: p.x, y: p.y};
      return;
    }
    if (type === 'up' || type === 'cancel' || type === 'leave' || type === 'blur' || type === 'out') {
      s.pointer = null;
      s.holdPointer = false;
      refreshLean(s);
    }
  },
  key(s, k, down) {
    if (s.result || s.broke) return;
    if (k === ' ' || k === 'Space' || k === 'Spacebar' || k === 'Shift') {
      s.holdAction = !!down;
      refreshLean(s);
    }
  },
  draw(s, d) {
    const reduced = reducedOf(s);
    const bank = s.camBank || 0;
    const fly = s.radiusU;
    const hang = fly * (reduced ? 6 : 20);

    // Soft court vignette only — never a full-canvas fill over swings.png.
    d.ellipse(CX + bank * 0.12, CY + 70, 360, 250, '#1a101014');
    if (s.holding) {
      d.ellipse(CX, CY + 40, 300, 210, '#6b203012');
    }
    if (s.screenFlash > 0) {
      d.ellipse(CX, CY, 280, 200, '#6a90b822');
    }
    if (s.popFlash > 0) {
      const u = s.popFlash / FLASH_SEC;
      d.ellipse(CX, CY, 200 + (1 - u) * 80, 140 + (1 - u) * 40, '#ffe6a4' + Math.floor(u * 28).toString(16).padStart(2, '0'));
    }

    drawBandShadows(d, s);
    drawCanopyHub(d, s);

    // Decorative sister chairs — carousel read, not gameplay.
    const ghosts = [];
    const player = {angle: s.theta, radius: radiusAt(s.radiusU), player: true};
    for (let i = 1; i < 8; i++) {
      ghosts.push({
        angle: s.theta + i * (TAU / 8),
        radius: radiusAt(0.72),
        player: false,
      });
    }
    const seats = ghosts.concat([player]).sort((a, b) => depthOf(a.angle) - depthOf(b.angle));
    seats.forEach((seat) => {
      const depth = depthOf(seat.angle);
      const scale = (seat.player ? 0.78 : 0.42) + depth * (seat.player ? 0.55 : 0.28);
      const p = orbitPoint(seat.angle, seat.radius);
      const y = p.y + (seat.player ? hang * (0.35 + 0.65 * depth) : 8) + bank * 0.04;
      const x = p.x + bank * (seat.player ? 1 : 0.3);
      drawChairShadow(d, seat.angle, seat.radius, scale);
      drawChair(d, x, y, scale, seat.player ? fly : 0.7, depth, seat.player, seat.player ? bank : 0);
    });

    // Star-bubbles / lanterns at fixed world angles — fly the chair to them.
    s.bubbles.forEach((bubble) => {
      if (bubble.taken && !(bubble.flash > 0)) return;
      const ahead = aheadOf(s, bubble.theta);
      if (!bubble.taken && ahead > APPROACH && !(bubble.missFlash > 0)) return;
      if (!bubble.taken && ahead < -CATCH_HALF && !(bubble.missFlash > 0)) return;
      const p = orbitPoint(bubble.theta, bandRadius(bubble.band));
      const depth = depthOf(bubble.theta);
      const px = p.x + bank * 0.4;
      const py = p.y;
      const lit = !!bubble.lit && !bubble.taken;
      drawBubble(d, px, py, depth, lit, bubble.flash || 0, bubble.missFlash || 0);
      if (!bubble.taken && !(bubble.missFlash > 0) && !(bubble.flash > 0)) {
        d.text(bandLabel(bubble.band), px, py + 28 + depth * 4, 13, lit ? GREEN_SOFT : '#ead6a4');
      }
    });

    if (s.treasure && !s.treasure.taken && s.theta >= s.treasure.warnTheta) {
      const tr = s.treasure;
      const ang = tr.sweepTheta;
      const p = orbitPoint(ang, bandRadius(tr.band));
      const x = p.x + bank * 0.4;
      const y = p.y;
      const warnSpan = tr.sweepTheta - tr.warnTheta;
      const ramp = clamp((s.theta - tr.warnTheta) / Math.max(0.01, warnSpan), 0, 1);
      const near = Math.abs(s.theta - tr.sweepTheta) < 0.9;
      const lit = !!tr.lit;
      // Full green warning circuit when on-band; gold glints otherwise
      for (let i = 0; i < 6; i++) {
        const a = s.theta * 0.9 + i * (TAU / 6);
        const g = orbitPoint(a, bandRadius(tr.band) * (0.92 + 0.08 * Math.sin(s.t * 4 + i)));
        d.circle(
          g.x + bank * 0.2, g.y,
          2.6 + ramp * 1.4,
          lit ? '#5ee08acc' : '#f4d590cc',
          lit ? GREEN : GOLD_DIM,
          1,
        );
      }
      d.glow(x, y, (near ? 58 : 36) + ramp * 24, lit ? GREEN : GOLD);
      if (lit) {
        d.circle(x, y, 34, '#5ee08a22', GREEN, 4);
        d.text('lined up', x, y - 48, 15, GREEN_SOFT);
      }
      d.item(spriteKey(tr.id), x, y, {
        w: near ? 64 : 48 + ramp * 10,
        shadow: false,
        fallback: () => drawStar(d, x, y, 16, '#ffe6a4', GOLD_DIM),
      });
      if (s.theta < tr.sweepTheta - 0.2) {
        d.text(bandLabel(tr.band) + ' band', x, y + 42, 15, lit ? GREEN_SOFT : GOLD);
      }
    }
    if (s.treasure?.taken && s.treasure.flash > 0) {
      const tr = s.treasure;
      const p = orbitPoint(tr.sweepTheta, bandRadius(tr.band));
      const bloom = s.treasure.flash / FLASH_SEC;
      d.glow(p.x + bank * 0.4, p.y, 80 * bloom, CREAM);
      d.circle(p.x + bank * 0.4, p.y, 30, null, CREAM, 6);
      d.circle(p.x + bank * 0.4, p.y, 30 * (1.3 + (1 - bloom) * 1.4), null, '#ffe6a466', 3);
    }

    // Prize waiting corner when eligible and not yet taken
    if (s.eligible && s.treasureId && !(s.treasure && s.treasure.taken) && !s.treasureCollected) {
      d.item(spriteKey(s.treasureId), PRIZE_CORNER.x, PRIZE_CORNER.y, {
        w: 48,
        fallback: () => drawStar(d, PRIZE_CORNER.x, PRIZE_CORNER.y, 14, '#ffe6a4', GOLD_DIM),
      });
      d.text('waiting', PRIZE_CORNER.x, PRIZE_CORNER.y + 42, 13, '#ead6a4');
    }

    // Local juice under chrome so the verb stays readable.
    drawFx(d, s);

    // Clarity-first control chrome (Lorie): one verb must read in the first 5s.
    const early = (s.t || 0) < (s.coachUntil != null ? s.coachUntil : 5);
    const verb = s.holding ? 'RELEASE' : 'HOLD';
    const verbSub = s.holding ? 'spring in' : 'stretch out';
    const coach = s.note || 'HOLD to stretch out · RELEASE to spring in';

    // Big in-court verb plate — loudest thing early / until first POP.
    if (early || s.holding || (s.passed || 0) < 1) {
      d.poly(
        [[200, 820], [700, 820], [688, 920], [212, 920]],
        s.holding ? '#6b2030ee' : '#2a1838ee',
        s.holding ? GOLD : '#e8c878',
        early ? 4 : 2.5,
      );
      d.text(verb, 450, 858, early ? 42 : 34, CREAM);
      d.text(verbSub, 450, 898, 18, '#f0d18f');
    }

    // Bottom thumb chrome — same verb, phone reach.
    d.poly(
      [[90, 1068], [810, 1068], [792, 1188], [108, 1188]],
      s.holding ? '#6b2030f0' : '#3a2418ee',
      s.holding ? GOLD : '#f0d09a',
      s.holding ? 3.2 : 2.4,
    );
    d.text(s.holding ? 'RELEASE · spring in' : 'HOLD · stretch out', 450, 1110, 26, CREAM);
    d.text(coach, 450, 1152, 16, '#f0d18f');
    if (s.practice) {
      d.poly(
        [[340, 78], [560, 78], [552, 128], [348, 128]],
        '#2a1838ee',
        '#ead6a4',
        2,
      );
      d.text('practice', 450, 108, 22, CREAM);
    }

    drawHud(d, s, {goal: s.goal, count: s.passed, label: 'bubbles'});
  },
  readout: (s) => s.note || '',
};
