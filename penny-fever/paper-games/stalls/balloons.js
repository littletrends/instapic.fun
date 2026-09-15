/**
 * Balloon Garden (Nell · balloons / attraction balloon-tree) — Ride & Seek stall
 *
 * LOCKED REMIX: Boulder Dash path-clear energy in carnival clothes —
 *   weave the basket through Balloon Tree branches; POP the right latex
 *   balloons to open a path (pop latex, don’t dig dirt). Feel = Boulder Dash
 *   path-clear + Balloon Fight altitude + lit gates.
 *
 * AUTHORITATIVE economy / boarding: Lorie FINAL brief still applies via
 *   ride-seek (practice / paid / eligibility). Do not reinvent keep rules.
 *
 * Lorie BUILD — Chapter 1 First Float ONLY (playable / tuned).
 *   Auto-forward / slow orbit weave through the oval court.
 *   Path blocked by latex balloon clusters; ONE glowing/lit balloon at a
 *   time is the POP target. Wrong balloons soft-miss / bounce.
 *   Primary verb screams POP (big button + tap near lit). First ~5s teach
 *   POP only (PRACTICE badge + “POP the glowing balloon”).
 *   HOLD bellows demoted to height support only (reach high/low clusters);
 *   quiet chrome vs POP. Pointer cancel releases HOLD — never leave rising.
 *   Soft contact never confiscates finds or aborts a paid flight.
 *   Unique court balloons.png is the hero — do NOT overpaint with a big
 *   green ellipse / trunk. Paper 1-layer 2D overlays only.
 *
 * UNFINISHED CHAPTERS (names kept — do not implement Ch2–6 systems yet):
 *   2 Ribbon Breeze
 *   3 Lantern Boughs
 *   4 Crosswind Crown
 *   5 Runaway Bouquet
 *   6 The Midnight Canopy
 *
 * Treasure ids preserved. Canvas 900×1200.
 */
import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
  prefersReducedMotion,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'balloons';
const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
const TREASURES = [
  'balloon-bouquet', 'prize-bag', 'swing-spinner',
  'aura-keepsake', 'laughing-doorway', 'organ-music-box',
];
const LEVELS = [
  'First Float',
  'Ribbon Breeze',
  'Lantern Boughs',
  'Crosswind Crown',
  'Runaway Bouquet',
  'The Midnight Canopy',
];

const W = 900;
const H = 1200;
const CX = 450;
const CY = 500; // pink oval court centre — backdrop owns the art
const ORBIT_RX = 210;
const ORBIT_RY = 155;

const LOW_PATH = 0.30;
const HIGH_PATH = 0.70;
const POP_HALF = 0.22; // height band to reach a lit balloon
const TREASURE_HALF = 0.24;
const HEIGHT_MIN = 0.06;
const HEIGHT_MAX = 0.94;

// Quiet HOLD zone (left) — height support only.
const HOLD_X0 = 40;
const HOLD_X1 = 300;
const HOLD_Y0 = 960;
const HOLD_Y1 = 1176;
// Big POP button (right / primary scream).
const POP_X0 = 320;
const POP_X1 = 860;
const POP_Y0 = 960;
const POP_Y1 = 1176;

const HOLD_SUSTAIN = 0.12;
const HOLD_ACCEL = 1.45;
const RELEASE_ACCEL = -1.0;
const VEL_DAMP = 0.86;

const BLOCKER_COUNT = 6;
const GOAL = 4; // POP 4 of 6 lit blockers to open the corridor
const RIDE_SECS = 48;
const LANDING_LEAD = 2.8;
const FLASH_SEC = 0.32;
const POP_NEAR_ANG = 0.55; // radians — near enough on orbit to POP
const POP_COOLDOWN = 0.18;

const SPAWN_IDS = ['low-path', 'high-path'];

const LATEX = ['#e8a0b8', '#7eb8b0', '#f0d09a', '#c9a0d8', '#8ec8e8', '#f4b890'];

function orbitSpeed(level, reduced) {
  const base = 0.20 + Math.min(0.04, level * 0.01);
  return reduced ? base * 0.62 : base;
}

function pathHeight(id) {
  return id === 'high-path' ? HIGH_PATH : LOW_PATH;
}

function heightToY(height) {
  return CY + 95 - height * 210;
}

function basketPos(angle, height) {
  const depth = 0.55 + 0.45 * Math.max(0, Math.sin(angle));
  const x = CX + Math.cos(angle) * ORBIT_RX * (0.88 + 0.12 * depth);
  const y = heightToY(height) + Math.sin(angle) * ORBIT_RY * 0.72;
  return {x, y, depth, front: Math.sin(angle) > -0.2};
}

function liftFactor(holdAccum) {
  if (holdAccum >= HOLD_SUSTAIN) return 1;
  return (holdAccum / HOLD_SUSTAIN) * 0.32;
}

function stepPhysics(height, vel, holding, holdAccum, dt) {
  let acc = holdAccum;
  if (holding) acc = Math.min(0.6, acc + dt);
  else acc = Math.max(0, acc - dt * 3.4);

  const lift = holding ? liftFactor(acc) : 0;
  const a = holding ? HOLD_ACCEL * lift : RELEASE_ACCEL;
  let v = vel + a * dt;
  v *= Math.pow(VEL_DAMP, dt);
  v *= Math.exp(-1.15 * dt);
  let h = clamp(height + v * dt, HEIGHT_MIN, HEIGHT_MAX);
  if (h <= HEIGHT_MIN && v < 0) v *= -0.18;
  if (h >= HEIGHT_MAX && v > 0) v *= -0.18;
  return {height: h, vel: v, holdAccum: acc};
}

function angDist(a, b) {
  let d = ((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return Math.abs(d);
}

function buildBlockers(level) {
  // Six lit blockers along a slow orbit, alternating high/low clusters.
  // Each cluster has decoy latex + one lit POP target.
  const span = Math.PI * 1.85;
  const start = -0.25;
  return Array.from({length: BLOCKER_COUNT}, (_, i) => {
    const high = i % 2 === 1;
    const h = high ? HIGH_PATH : LOW_PATH;
    const ang = start + ((i + 1) / (BLOCKER_COUNT + 1)) * span;
    const decoys = [
      {ox: -38, oy: 10, r: 18, col: LATEX[(i * 2) % LATEX.length]},
      {ox: 36, oy: 14, r: 16, col: LATEX[(i * 2 + 1) % LATEX.length]},
      {ox: 4, oy: -28, r: 14, col: LATEX[(i + 3) % LATEX.length]},
    ];
    return {
      id: 'block-' + (i + 1),
      angle: ang,
      height: h,
      path: high ? 'high-path' : 'low-path',
      half: POP_HALF + Math.max(0, 0.02 - level * 0.004),
      decoys,
      cleared: false,
      missed: false,
      softBump: false,
      flash: 0,
      missFlash: 0,
      r: 26,
    };
  });
}

function nextLit(s) {
  return (s.blockers || []).find((b) => !b.cleared && !b.missed) || null;
}

function scheduleTreasure(s) {
  if (!s.eligible || s.treasure) return;
  const path = SPAWN_IDS.includes(s.spawnId) ? s.spawnId : 'low-path';
  // After a couple clears, on a reachable cleared-path height.
  s.treasure = {
    id: s.treasureId,
    path,
    height: pathHeight(path),
    angle: 1.05,
    taken: false,
    flash: 0,
  };
}

function pushBurst(s, x, y, cool) {
  s.sparks = s.sparks || [];
  const n = cool ? 5 : 10;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + (cool ? 0.2 : 0);
    const sp = cool ? 52 : 88;
    s.sparks.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp * 0.72,
      t: 0,
      dur: cool ? 0.28 : 0.42,
      cool: !!cool,
      r: cool ? 2.6 : 3.6,
    });
  }
}

function tickFx(s, dt) {
  (s.blockers || []).forEach((b) => {
    if (b.flash > 0) b.flash = Math.max(0, b.flash - dt);
    if (b.missFlash > 0) b.missFlash = Math.max(0, b.missFlash - dt);
  });
  if (s.treasure?.flash > 0) s.treasure.flash = Math.max(0, s.treasure.flash - dt);
  if (s.popFlash > 0) s.popFlash = Math.max(0, s.popFlash - dt);
  if (s.popCooldown > 0) s.popCooldown = Math.max(0, s.popCooldown - dt);
  if (s.sparks) {
    for (const sp of s.sparks) {
      sp.t += dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vx *= 0.92;
      sp.vy *= 0.92;
    }
    s.sparks = s.sparks.filter((sp) => sp.t < sp.dur);
  }
}

function tryCollectTreasure(s) {
  const tr = s.treasure;
  if (!tr || tr.taken) return;
  const ad = angDist(s.angle, tr.angle);
  if (ad > 0.42) return;
  s.treasureRevealed = true;
  if (Math.abs(s.height - tr.height) <= TREASURE_HALF) {
    tr.taken = true;
    tr.flash = FLASH_SEC;
    recordTreasure(s, tr.id);
    logAction(s, 'treasure', {path: tr.path});
    const tp = basketPos(tr.angle, tr.height);
    pushBurst(s, tp.x, tp.y, false);
    s.note = 'Bouquet yours — settle on the landing branch.';
  }
}

function softContactCluster(s) {
  // Soft brush against an uncleared cluster you are weaving past —
  // disturb lift only; never confiscate finds or abort paid flight.
  for (const b of s.blockers) {
    if (b.cleared || b.softBump) continue;
    const prev = s.prevAngle;
    const crossed = prev < b.angle && s.angle >= b.angle;
    if (!crossed) continue;
    const dh = Math.abs(s.height - b.height);
    if (dh > b.half + 0.14) continue;
    b.softBump = true;
    b.missFlash = FLASH_SEC * 0.55;
    s.vel *= 0.5;
    s.vel += (s.height > b.height ? -0.2 : 0.15);
    const pos = basketPos(b.angle, b.height);
    pushBurst(s, pos.x, pos.y, true);
    if (!b.cleared && !b.missed) {
      // Passing without a POP counts as a soft miss for this lit gate.
      b.missed = true;
      logAction(s, 'pop', {id: b.id, ok: false, soft: true});
      s.note = 'Soft brush — path still blocked. POP the glowing balloon. Cleared '
        + s.cleared + ' / ' + s.goal + '.';
    }
  }
}

function earlyClarity(s) {
  return !s.hasPoppedOnce && (s.t || 0) <= 5;
}

function setHolding(s, on) {
  const next = !!on;
  if (next === !!s.holding) return;
  s.holding = next;
  logAction(s, 'bellows', {on: next});
  if (s.result || earlyClarity(s)) return;
  if (next) s.note = 'Rising — reach the glowing balloon.';
  else s.note = 'Drifting — POP when near the glow. Cleared '
    + (s.cleared || 0) + ' / ' + (s.goal || GOAL) + '.';
}

function attemptPop(s) {
  if (s.result || s.broke || !s.boarded) return;
  if ((s.popCooldown || 0) > 0) return;
  s.popCooldown = POP_COOLDOWN;
  s.popFlash = 0.22;

  const lit = nextLit(s);
  if (!lit) {
    s.note = 'Corridor open — ease toward the landing branch.';
    logAction(s, 'pop', {ok: false, empty: true});
    return;
  }

  const ad = angDist(s.angle, lit.angle);
  const dh = Math.abs(s.height - lit.height);
  const near = ad <= POP_NEAR_ANG;
  const heightOk = dh <= lit.half;

  if (near && heightOk) {
    lit.cleared = true;
    lit.flash = FLASH_SEC;
    s.cleared += 1;
    s.hasPoppedOnce = true;
    const art = ORDINARY[(s.cleared - 1) % ORDINARY.length];
    recordFind(s, art, RIDE);
    logAction(s, 'pop', {id: lit.id, ok: true, path: lit.path});
    const pos = basketPos(lit.angle, lit.height);
    pushBurst(s, pos.x, pos.y, false);
    s.note = s.cleared >= s.goal
      ? 'Path clear! Landing branch ahead.'
      : ('POP! Cleared ' + s.cleared + ' / ' + s.goal + '.');
    return;
  }

  // Soft miss / bounce — wrong timing, wrong height, or decoy brush.
  s.vel *= 0.55;
  if (!heightOk && near) s.vel += (s.height > lit.height ? -0.18 : 0.18);
  lit.missFlash = FLASH_SEC * 0.7;
  const pos = basketPos(lit.angle, lit.height);
  pushBurst(s, pos.x, pos.y, true);
  logAction(s, 'pop', {id: lit.id, ok: false, near, heightOk});
  if (!near) {
    s.note = 'Too far — wait for the glow. Cleared ' + s.cleared + ' / ' + s.goal + '.';
  } else if (!heightOk) {
    s.note = lit.path === 'high-path'
      ? 'Too low — HOLD bellows to rise, then POP.'
      : 'Too high — release bellows to drift, then POP.';
  } else {
    s.note = 'Soft miss — POP the glowing balloon.';
  }
}

function inHoldZone(p) {
  return p.x >= HOLD_X0 && p.x <= HOLD_X1 && p.y >= HOLD_Y0 && p.y <= HOLD_Y1;
}

function inPopZone(p) {
  return p.x >= POP_X0 && p.x <= POP_X1 && p.y >= POP_Y0 && p.y <= POP_Y1;
}

function nearLitOnCanvas(s, p) {
  const lit = nextLit(s);
  if (!lit) return false;
  const pos = basketPos(lit.angle, lit.height);
  const dx = p.x - pos.x;
  const dy = p.y - pos.y;
  return Math.hypot(dx, dy) <= 70;
}

function wrapLine(d, text, x, y, size, color, maxW) {
  if (!text) return y;
  const c = d.c;
  if (!c || typeof c.measureText !== 'function') {
    d.text(String(text), x, y, size, color);
    return y;
  }
  c.font = '500 ' + size + 'px Georgia,serif';
  const words = String(text).split(' ');
  let line = '', ly = y;
  for (const word of words) {
    const trial = line ? line + ' ' + word : word;
    if (line && c.measureText(trial).width > maxW) {
      d.text(line, x, ly, size, color);
      line = word;
      ly += size + 8;
    } else line = trial;
  }
  if (line) d.text(line, x, ly, size, color);
  return ly;
}

function drawCluster(d, b, angleNow, isLit) {
  let da = b.angle - angleNow;
  while (da < -Math.PI) da += Math.PI * 2;
  while (da > Math.PI) da -= Math.PI * 2;
  if (da < -0.4 || da > 1.65) {
    if (!(b.flash > 0) && !(b.missFlash > 0)) return;
  }

  const pos = basketPos(b.angle, b.height);

  if (b.cleared) {
    if (b.flash > 0) {
      const bloom = b.flash / FLASH_SEC;
      d.glow(pos.x, pos.y, 56 * bloom, '#ffe6a4');
      d.circle(pos.x, pos.y, 10 + 18 * bloom, null, '#fff6d8', 3);
    }
    return;
  }

  // Decoy latex (not the gate). Soft paper circles — no trunk/ellipse overpaint.
  for (const dec of b.decoys) {
    const dx = pos.x + dec.ox;
    const dy = pos.y + dec.oy;
    d.circle(dx, dy, dec.r, dec.col + 'bb', '#f4d590', 1.2);
    d.line({x: dx, y: dy + dec.r - 2}, {x: dx, y: dy + dec.r + 14}, '#d2a65b88', 1);
  }

  if (b.missFlash > 0) {
    d.glow(pos.x, pos.y, 40, b.softBump ? '#8ec8e8' : '#c9a08e');
  }

  // Lit / glowing POP target (only the active gate screams).
  if (isLit) {
    const pulse = 0.55 + 0.45 * Math.sin((angleNow + b.angle) * 6);
    d.glow(pos.x, pos.y, 48 + pulse * 16, '#ffe6a4');
    d.circle(pos.x, pos.y, b.r + 4, '#fff6d8ee', '#ffe6a4', 3);
    d.circle(pos.x, pos.y, b.r, '#f0d09acc', '#d2a65b', 2);
    d.circle(pos.x - 6, pos.y - 8, 5, '#ffffffaa', null, 0);
    if (da < 0.9 && da > -0.25) {
      d.text('POP', pos.x, pos.y - b.r - 18, 18, '#ffe6a4');
    }
  } else {
    d.circle(pos.x, pos.y, b.r * 0.85, '#e8a0b888', '#d2a65b88', 1.5);
  }
}

function drawBasket(d, s) {
  const p = basketPos(s.angle, s.height);
  const bx = p.x;
  const by = p.y;
  const rising = !!s.holding && (s.holdAccum || 0) >= HOLD_SUSTAIN * 0.4;
  const scale = rising ? 1.06 : 1;
  d.line({x: bx, y: by - 38 * scale}, {x: bx, y: by - 8}, '#d2a65b', 2);
  if (rising) d.glow(bx, by - 56, 28, '#f4d59088');
  d.circle(bx - 16 * scale, by - 52 * scale, 16 * scale, '#e8a0b8cc', '#f4d590', 1.5);
  d.circle(bx + 14 * scale, by - 56 * scale, 14 * scale, '#7eb8b0cc', '#f4d590', 1.5);
  d.circle(bx, by - 64 * scale, 18 * scale, '#f0d09acc', '#d2a65b', 1.5);
  d.poly([
    [bx - 28, by - 6],
    [bx + 28, by - 6],
    [bx + 24, by + 28],
    [bx - 24, by + 28],
  ], '#6b4030cc', '#d2a65b', 2);
  d.text('you', bx, by + 14, 13, '#f0d09a');
  return p;
}

function drawHoldChrome(d, s) {
  // Quiet secondary chrome — height support only.
  const active = !!s.holding;
  const charge = clamp((s.holdAccum || 0) / 0.6, 0, 1);
  d.poly([
    [HOLD_X0, HOLD_Y0],
    [HOLD_X1, HOLD_Y0],
    [HOLD_X1, HOLD_Y1],
    [HOLD_X0, HOLD_Y1],
  ], active ? '#3a2430cc' : '#2a1c18aa', active ? '#d2a65b' : '#a8907088', active ? 3 : 2);

  if (active) d.glow(170, 1060, 36, '#f4d59055');

  const barX = HOLD_X0 + 18;
  const barY = HOLD_Y0 + 16;
  const barW = HOLD_X1 - HOLD_X0 - 36;
  const barH = 10;
  const c = d.c;
  if (c) {
    c.save();
    c.fillStyle = 'rgba(20, 12, 10, 0.45)';
    c.fillRect(barX, barY, barW, barH);
    c.fillStyle = active ? 'rgba(240, 208, 154, 0.75)' : 'rgba(240, 208, 154, 0.2)';
    c.fillRect(barX, barY, barW * charge, barH);
    c.strokeStyle = '#d2a65b88';
    c.lineWidth = 1;
    c.strokeRect(barX, barY, barW, barH);
    c.restore();
  }

  d.text(active ? 'RISING' : 'HOLD', 170, 1068, 26, active ? '#fff6d8' : '#f0d09aaa');
  d.text('height', 170, 1110, 14, '#f0d09a88');
}

function drawPopButton(d, s) {
  const flash = (s.popFlash || 0) > 0;
  const pulse = 0.55 + 0.45 * Math.sin((s.t || 0) * 4.5);
  const strokeW = flash ? 7 : (5 + pulse * 2);
  d.poly([
    [POP_X0, POP_Y0],
    [POP_X1, POP_Y0],
    [POP_X1, POP_Y1],
    [POP_X0, POP_Y1],
  ], flash ? '#6a3048f2' : '#4a2038ee', '#ffe6a4', strokeW);

  d.glow(590, 1065, 80 + pulse * 30, '#ffe6a4' + Math.floor(50 + pulse * 60).toString(16).padStart(2, '0'));
  d.text('POP', 590, 1060, 64, '#fff6d8');
  d.text('the glowing balloon', 590, 1120, 18, '#f0d09a');
}

function drawLanding(d, s) {
  if (s.t < RIDE_SECS - LANDING_LEAD - 1.5) return;
  const pos = basketPos(s.landingAngle, LOW_PATH * 0.7);
  d.glow(pos.x, pos.y + 20, 50, '#c9e0a4');
  d.poly([
    [pos.x - 70, pos.y + 36],
    [pos.x + 70, pos.y + 28],
    [pos.x + 60, pos.y + 58],
    [pos.x - 55, pos.y + 62],
  ], '#5a8f7a66', '#d2a65b', 2);
  d.text('landing', pos.x, pos.y + 18, 16, '#f4d590');
}

function drawFx(d, s) {
  for (const sp of (s.sparks || [])) {
    const u = sp.t / sp.dur;
    const a = 1 - u;
    const col = sp.cool ? '#8ec8e8' : '#f4d590';
    const hex = Math.floor(a * 200).toString(16).padStart(2, '0');
    d.circle(sp.x, sp.y, sp.r * (1 - u * 0.5), col + hex, null, 0);
  }
  if (s.treasure?.taken && s.treasure.flash > 0) {
    const tr = s.treasure;
    const tp = basketPos(tr.angle, tr.height);
    const bloom = tr.flash / FLASH_SEC;
    d.glow(tp.x, tp.y, 72 * bloom, '#ffe6a4');
    d.circle(tp.x, tp.y, 26, null, '#f8e4b3', 6);
  }
}

function drawPracticeBadge(d, s) {
  if (!s.practice) return;
  const c = d.c;
  const label = 'PRACTICE';
  const y = 108;
  if (c) {
    c.save();
    c.font = '700 34px Georgia,serif';
    const tw = c.measureText(label).width;
    const pw = tw + 56;
    const ph = 48;
    const px = 450 - pw / 2;
    const py = y - ph / 2 - 4;
    c.fillStyle = 'rgba(42, 28, 24, 0.92)';
    c.strokeStyle = '#ffe6a4';
    c.lineWidth = 4;
    const r = 22;
    c.beginPath();
    c.moveTo(px + r, py);
    c.lineTo(px + pw - r, py);
    c.quadraticCurveTo(px + pw, py, px + pw, py + r);
    c.lineTo(px + pw, py + ph - r);
    c.quadraticCurveTo(px + pw, py + ph, px + pw - r, py + ph);
    c.lineTo(px + r, py + ph);
    c.quadraticCurveTo(px, py + ph, px, py + ph - r);
    c.lineTo(px, py + r);
    c.quadraticCurveTo(px, py, px + r, py);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  } else {
    d.poly([
      [450 - 120, y - 28],
      [450 + 120, y - 28],
      [450 + 120, y + 20],
      [450 - 120, y + 20],
    ], '#2a1c18ee', '#ffe6a4', 4);
  }
  d.text(label, 450, y, 34, '#fff6d8');
}

function drawObjective(d, s) {
  if (!s.boarded && s.cleared == null) return;

  if (s.practice) {
    drawPracticeBadge(d, s);
  } else {
    const mode = s.eligible ? 'Paid flight · keepsake live' : 'Paid flight';
    d.text(mode, 450, 118, 16, '#fff6d8');
  }

  if (earlyClarity(s)) {
    d.text('POP the glowing balloon', 450, s.practice ? 168 : 152, 22, '#ffe6a4');
    return;
  }

  const line = 'Cleared ' + (s.cleared || 0) + ' / ' + (s.goal || GOAL);
  d.text(line, 450, s.practice ? 168 : 148, 22, '#ffe6a4');
  if (s.note) wrapLine(d, s.note, 450, s.practice ? 198 : 178, 16, '#f0d18f', 720);
}

export default {
  title: 'Balloon Garden',
  intro: 'POP the glowing balloon to open a path through Nell’s Balloon Tree.',
  instructions: 'POP lit latex to clear the corridor. HOLD bellows only to reach high or low clusters.',
  levels: LEVELS,
  sprites: TREASURES.concat(ORDINARY),
  prizes: TREASURES,
  houseSeconds: 80,
  actions: [
    {id: 'pop', label: 'POP'},
    {id: 'bellows', label: 'HOLD · height', hold: true},
  ],
  create(level, rng) {
    const reduced = prefersReducedMotion();
    return makeRideState(level, rng, {
      angle: -0.9,
      prevAngle: -0.9,
      height: LOW_PATH,
      vel: 0,
      holding: false,
      holdAccum: 0,
      hasPoppedOnce: false,
      cleared: 0,
      goal: GOAL,
      blockers: buildBlockers(level),
      treasureId: TREASURES[Math.max(0, Math.min(level, TREASURES.length - 1))],
      reduced,
      landingAngle: Math.PI * 1.55,
      landed: false,
      sparks: [],
      popFlash: 0,
      popCooldown: 0,
      _pointerMode: null,
    });
  },
  update(s, dt, input) {
    if (s.result || s.broke) return;

    if (ensureBoarded(s, RIDE, s.treasureId, SPAWN_IDS)) {
      s.note = 'POP the glowing balloon';
      scheduleTreasure(s);
    }
    if (s.result) return;

    // Shell HOLD (bellows) — only when pointer is not capturing hold.
    const shellHold = !!input?.actions?.has?.('bellows');
    if (s._pointerMode !== 'hold' && shellHold !== !!s.holding) {
      setHolding(s, shellHold);
    }
    // Shell POP tap edge via actions set (one-shot).
    if (input?.actions?.has?.('pop') && !s._shellPopLatched) {
      s._shellPopLatched = true;
      attemptPop(s);
    } else if (!input?.actions?.has?.('pop')) {
      s._shellPopLatched = false;
    }

    s.prevAngle = s.angle;
    s.t += dt;
    const speed = orbitSpeed(s.level, s.reduced);
    s.angle += speed * dt;

    const phys = stepPhysics(s.height, s.vel, !!s.holding, s.holdAccum, dt);
    s.height = phys.height;
    s.vel = phys.vel;
    s.holdAccum = phys.holdAccum;

    softContactCluster(s);
    scheduleTreasure(s);
    tryCollectTreasure(s);
    tickFx(s, dt);

    s.progress = Math.min(1, s.t / RIDE_SECS);

    if (!s.landed && s.t >= RIDE_SECS - LANDING_LEAD) {
      s.note = 'Landing branch ahead. Cleared ' + s.cleared + ' / ' + s.goal + '.';
    }
    if (!s.landed && s.t >= RIDE_SECS) {
      s.landed = true;
      setHolding(s, false);
      s.height = clamp(s.height * 0.7 + 0.12, HEIGHT_MIN, 0.4);
      finishRide(s, {
        rideId: RIDE,
        treasureId: s.treasureId,
        challengeOk: s.cleared >= s.goal,
        completionFind: 'star-token',
      });
    }
  },
  action(s, id, on) {
    if (id === 'bellows') setHolding(s, on);
    if (id === 'pop' && on) attemptPop(s);
  },
  pointer(s, type, p) {
    if (s.result || s.broke) return;
    if (type === 'down') {
      if (inHoldZone(p)) {
        s._pointerMode = 'hold';
        setHolding(s, true);
        return;
      }
      if (inPopZone(p) || nearLitOnCanvas(s, p)) {
        s._pointerMode = 'pop';
        attemptPop(s);
        return;
      }
      return;
    }
    if (type === 'move' && s._pointerMode === 'hold') {
      return;
    }
    if (type === 'up') {
      if (s._pointerMode === 'hold') setHolding(s, false);
      s._pointerMode = null;
      return;
    }
    if (type === 'cancel') {
      // Pointer cancel / lost capture → bellows released; never leave rising forever.
      s._pointerMode = null;
      setHolding(s, false);
    }
  },
  draw(s, d) {
    // Backdrop balloons.png is the unique court — do NOT paint a big green
    // ellipse or solid trunk over the pink oval. Light overlays only.

    drawObjective(d, s);

    const lit = nextLit(s);
    (s.blockers || []).forEach((b) => drawCluster(d, b, s.angle, lit && b.id === lit.id));

    if (s.treasure && !s.treasure.taken) {
      const tr = s.treasure;
      let da = tr.angle - s.angle;
      while (da < -Math.PI) da += Math.PI * 2;
      while (da > Math.PI) da -= Math.PI * 2;
      if (da > -0.2 && da < 1.4) {
        const tp = basketPos(tr.angle, tr.height);
        s.treasureRevealed = true;
        d.glow(tp.x, tp.y, 40, '#f4d590');
        d.item(spriteKey(tr.id), tp.x, tp.y, {
          w: 56,
          shadow: false,
          fallback: () => d.star(tp.x, tp.y, 14),
        });
        d.text('keepsake path', tp.x, tp.y - 36, 14, '#f4d590');
      }
    }

    drawLanding(d, s);
    drawBasket(d, s);
    drawFx(d, s);
    drawHoldChrome(d, s);
    drawPopButton(d, s);
    drawHud(d, s, {goal: s.goal, count: s.cleared, label: 'cleared'});
  },
  readout: (s) => s.note || '',
};
