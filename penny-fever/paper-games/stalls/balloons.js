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
 * Chapters:
 *   1 First Float — shipped + PASS (path-clear). GOAL 4 of 6, forgiving
 *     POP window, no wind hazard. Do not regress level===0.
 *   2 Ribbon Breeze — wind-ribbon teach on the FIRST lit blocker only
 *     (long warn, soft dump, later blockers clean POP). GOAL 3 of 5.
 *   3–6 unfinished (names kept — do not implement systems yet):
 *     3 Lantern Boughs
 *     4 Crosswind Crown
 *     5 Runaway Bouquet
 *     6 The Midnight Canopy
 *
 * Treasure ids preserved. Canvas 900×1200.
 * draw.glow() colors are 6-digit #rrggbb ONLY (API appends alpha).
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

const LOW_PATH = 0.40;
const HIGH_PATH = 0.58;
const POP_HALF = 0.40; // Ch1 very forgiving height band
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
const HOLD_ACCEL = 1.75; // faster reach to high path
const RELEASE_ACCEL = -1.2;
const VEL_DAMP = 0.86;

// Ch1 locked: POP 4 of 6, ~65s. Ch2: POP 3 of 5, ~52s (helter Ch2 haste bar).
const BLOCKER_COUNT_CH1 = 6;
const BLOCKER_COUNT_CH2 = 5;
const GOAL_CH1 = 4;
const GOAL_CH2 = 3;
const RIDE_SECS_CH1 = 65;
const RIDE_SECS_CH2 = 52;
const LANDING_LEAD = 2.8;
const FLASH_SEC = 0.32;
const POP_NEAR_ANG = 1.25; // Ch1 very wide orbit window
const POP_COOLDOWN = 0.18;

/** Long lead warning before the first wind-ribbon teach blocker (Ribbon Breeze). */
const WIND_WARN_SECS = 7.5;
const WIND_AMP = 0.13;
const WIND_RATE = 1.05;

const SPAWN_IDS = ['low-path', 'high-path'];

const LATEX = ['#e8a0b8', '#7eb8b0', '#f0d09a', '#c9a0d8', '#8ec8e8', '#f4b890'];

function isCh2(level) {
  return (level | 0) === 1;
}

function chapterGoal(level) {
  return isCh2(level) ? GOAL_CH2 : GOAL_CH1;
}

function chapterBlockerCount(level) {
  return isCh2(level) ? BLOCKER_COUNT_CH2 : BLOCKER_COUNT_CH1;
}

function chapterRideSecs(level) {
  return isCh2(level) ? RIDE_SECS_CH2 : RIDE_SECS_CH1;
}

function orbitSpeed(level, reduced) {
  // Ch1 very slow weave. Ch2 slightly slower still (helter Ch2 haste ~0.92).
  let base;
  if (isCh2(level)) base = 0.102;
  else base = 0.11 + Math.min(0.02, level * 0.006);
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

function forwardAng(from, to) {
  let d = to - from;
  while (d < 0) d += Math.PI * 2;
  while (d >= Math.PI * 2) d -= Math.PI * 2;
  return d;
}

function buildBlockers(level) {
  const count = chapterBlockerCount(level);
  // Lit blockers along a slow orbit, alternating high/low clusters.
  // Each cluster has decoy latex + one lit POP target.
  const span = Math.PI * 1.85;
  const start = -0.25;
  return Array.from({length: count}, (_, i) => {
    // First target is mid-height (easy first POP), then alternate.
    const high = i === 0 ? false : (i % 2 === 1);
    const h = i === 0 ? (LOW_PATH + HIGH_PATH) * 0.5 : (high ? HIGH_PATH : LOW_PATH);
    const ang = start + ((i + 1) / (count + 1)) * span;
    const decoys = [
      {ox: -38, oy: 10, r: 18, col: LATEX[(i * 2) % LATEX.length]},
      {ox: 36, oy: 14, r: 16, col: LATEX[(i * 2 + 1) % LATEX.length]},
      {ox: 4, oy: -28, r: 14, col: LATEX[(i + 3) % LATEX.length]},
    ];
    const b = {
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
    // Ch2: ONE teach hazard alone — wind ribbon on the FIRST lit blocker.
    if (isCh2(level) && i === 0) {
      b.teach = true;
      b.windAmp = WIND_AMP;
      b.windPhase = 0;
      b.baseHeight = h;
      b.windDumped = false;
    }
    return b;
  });
}

function nextLit(s) {
  // Soft-brush "missed" still allows POP until well past — Ch1 must not eat the target.
  // Wind-dumped teach blocker is skipped so later clean targets stay reachable.
  return (s.blockers || []).find((b) => {
    if (b.cleared) return false;
    if (b.windDumped) return false;
    const ad = angDist(s.angle, b.angle);
    if (b.missed && ad > POP_NEAR_ANG + 0.35) return false;
    return true;
  }) || null;
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
    if (b.cleared || b.softBump || b.windDumped) continue;
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
    // Wobble only — keep the lit target POP-able. Never confiscate / abort.
    logAction(s, 'brush', {id: b.id});
    if (!earlyClarity(s) && (s.cleared || 0) < 3) {
      s.note = 'Leaves brushed — still POP the glowing balloon. Cleared '
        + s.cleared + ' / ' + s.goal + '.';
    }
  }
}

/** Ch2: drift teach balloon height while approaching; long warn coaching. */
function updateWindRibbon(s, dt) {
  if (!isCh2(s.level)) return;
  const speed = orbitSpeed(s.level, s.reduced);
  for (const b of s.blockers || []) {
    if (!b.teach || b.cleared || b.windDumped) continue;

    const lead = forwardAng(s.angle, b.angle) / Math.max(0.04, speed);
    // Drift height while approaching / in window (up then down bias).
    if (lead < WIND_WARN_SECS + 2.5 || angDist(s.angle, b.angle) < POP_NEAR_ANG + 0.4) {
      b.windPhase = (b.windPhase || 0) + dt * WIND_RATE;
      // Sinusoid: rises then falls so POP early / HOLD adjust is the teach.
      const drift = Math.sin(b.windPhase) * (b.windAmp || WIND_AMP);
      b.height = clamp((b.baseHeight || LOW_PATH) + drift, HEIGHT_MIN + 0.08, HEIGHT_MAX - 0.08);
      // Keep path label honest for coaching copy.
      b.path = b.height >= (LOW_PATH + HIGH_PATH) * 0.5 ? 'high-path' : 'low-path';
    }

    if (lead <= WIND_WARN_SECS && lead > 0.05) {
      if (!s.windWarned) {
        s.windWarned = true;
        logAction(s, 'wind-warn', {id: b.id, lead: WIND_WARN_SECS});
      }
      if (!earlyClarity(s) && !s.hasPoppedOnce) {
        const rising = Math.cos(b.windPhase || 0) > 0;
        s.note = rising
          ? 'Wind ribbon — balloon rising. POP early or HOLD to match.'
          : 'Wind ribbon — balloon drifting down. POP early or release to match.';
      }
    }
  }
}

/** Soft dump when wind teach target passes without POP — ride continues. */
function softWindDump(s) {
  if (!isCh2(s.level)) return;
  for (const b of s.blockers || []) {
    if (!b.teach || b.cleared || b.windDumped) continue;
    // Keep the full forgiving POP window after the angle; dump only once well past.
    const past = forwardAng(b.angle, s.angle);
    if (past < POP_NEAR_ANG + 0.2) continue;
    // Still approaching from behind (wrapped) — not past yet.
    if (s.angle < b.angle && past > Math.PI) continue;
    b.windDumped = true;
    b.missed = true;
    b.missFlash = FLASH_SEC;
    s.vel *= 0.62;
    const pos = basketPos(b.angle, b.height);
    pushBurst(s, pos.x, pos.y, true);
    logAction(s, 'wind-dump', {id: b.id});
    // Soft fail — never abort paid / never confiscate. Later clean targets still count.
    s.note = 'Wind carried it past — soft dump; ride continues. Cleared '
      + (s.cleared || 0) + ' / ' + s.goal + '.';
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
    + (s.cleared || 0) + ' / ' + (s.goal || chapterGoal(s.level)) + '.';
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
  let dh = Math.abs(s.height - lit.height);
  // Ch1: after 3 clears, open the door for the 4th POP. Ch2: clutch after 2 for the 3rd.
  const clutchNeed = isCh2(s.level) ? 2 : 3;
  const clutch = (s.cleared || 0) >= clutchNeed;
  const nearLim = clutch ? POP_NEAR_ANG + 0.35 : POP_NEAR_ANG;
  const halfLim = clutch ? lit.half + 0.12 : lit.half;
  const near = ad <= nearLim;
  // Forgiveness: if near and almost in band, nudge into the POP band.
  // Ch2 wind teach: slightly wider snap so drifting height is still fair.
  const windSnap = (lit.teach && !lit.windDumped) ? 0.06 : 0;
  const snapBand = (clutch ? halfLim + 0.12 : lit.half + 0.16) + windSnap;
  if (near && dh <= snapBand) {
    s.height = s.height + (lit.height - s.height) * (clutch ? 0.9 : 0.72);
    dh = Math.abs(s.height - lit.height);
  }
  const heightOk = dh <= halfLim + (lit.teach ? 0.04 : 0);

  if (near && heightOk) {
    lit.cleared = true;
    lit.flash = FLASH_SEC;
    s.cleared += 1;
    s.hasPoppedOnce = true;
    const art = ORDINARY[(s.cleared - 1) % ORDINARY.length];
    recordFind(s, art, RIDE);
    logAction(s, 'pop', {id: lit.id, ok: true, path: lit.path, teach: !!lit.teach});
    const pos = basketPos(lit.angle, lit.height);
    pushBurst(s, pos.x, pos.y, false);
    s.note = s.cleared >= s.goal
      ? 'Path clear! Landing branch ahead.'
      : (lit.teach
        ? ('POP through the breeze! Cleared ' + s.cleared + ' / ' + s.goal + '.')
        : ('POP! Cleared ' + s.cleared + ' / ' + s.goal + '.'));
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
    if (lit.teach) {
      s.note = 'Wind drifted it — HOLD or release to match, then POP.';
    } else {
      s.note = lit.path === 'high-path'
        ? 'Too low — HOLD bellows to rise, then POP.'
        : 'Too high — release bellows to drift, then POP.';
    }
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
  return Math.hypot(dx, dy) <= 120;
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

function drawWindRibbon(d, b, angleNow, t) {
  if (!b.teach || b.cleared || b.windDumped) return;
  let da = b.angle - angleNow;
  while (da < -Math.PI) da += Math.PI * 2;
  while (da > Math.PI) da -= Math.PI * 2;
  if (da < -0.5 || da > 1.7) return;

  const pos = basketPos(b.angle, b.height);
  // Faint wind ribbon lines — code overlays only, no court overpaint.
  for (let i = 0; i < 3; i++) {
    const yOff = (i - 1) * 12;
    const phase = t * 2.4 + i * 0.9;
    const x0 = pos.x - 52;
    const x1 = pos.x + 52;
    const y0 = pos.y + yOff + Math.sin(phase) * 5;
    const y1 = pos.y + yOff + Math.sin(phase + 1.1) * 5;
    const midX = pos.x + Math.cos(phase * 0.7) * 8;
    const midY = pos.y + yOff + Math.sin(phase + 0.55) * 7;
    d.line({x: x0, y: y0}, {x: midX, y: midY}, '#8ec8e866', 1.4);
    d.line({x: midX, y: midY}, {x: x1, y: y1}, '#8ec8e855', 1.2);
  }
  // Soft cyan glow on teach target — 6-digit #rrggbb only.
  d.glow(pos.x, pos.y - 6, 36, '#8ec8e8');
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

  if (b.windDumped) {
    if (b.missFlash > 0) d.glow(pos.x, pos.y, 36, '#8ec8e8');
    d.circle(pos.x, pos.y, b.r * 0.7, '#8ec8e855', '#8ec8e888', 1.2);
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
      d.text(b.teach ? 'POP · wind' : 'POP', pos.x, pos.y - b.r - 18, 18, '#ffe6a4');
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
  if (rising) d.glow(bx, by - 56, 28, '#f4d590');
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

  if (active) d.glow(170, 1060, 36, '#f4d590');

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

  d.glow(590, 1065, 80 + pulse * 30, '#ffe6a4');
  d.text('POP', 590, 1060, 64, '#fff6d8');
  d.text('the glowing balloon', 590, 1120, 18, '#f0d09a');
}

function drawLanding(d, s) {
  const rideSecs = s.rideSecs || chapterRideSecs(s.level);
  if (s.t < rideSecs - LANDING_LEAD - 1.5) return;
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

  const line = 'Cleared ' + (s.cleared || 0) + ' / ' + (s.goal || chapterGoal(s.level));
  d.text(line, 450, s.practice ? 168 : 148, 22, '#ffe6a4');
  if (s.note) wrapLine(d, s.note, 450, s.practice ? 198 : 178, 16, '#f0d18f', 720);
}

export default {
  title: 'Balloon Garden',
  intro: 'POP the glowing balloon to open a path through Nell’s Balloon Tree. From Ribbon Breeze, a wind ribbon drifts the first lit balloon — POP early or match height with HOLD.',
  instructions: 'POP lit latex to clear the corridor. HOLD bellows only to reach high or low clusters. Chapter 2 (Ribbon Breeze): one wind ribbon on the first glowing balloon — long warn, soft dump if it drifts past; later balloons are clean POP.',
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
    const goal = chapterGoal(level);
    const rideSecs = chapterRideSecs(level);
    return makeRideState(level, rng, {
      angle: -0.9,
      prevAngle: -0.9,
      height: (LOW_PATH + HIGH_PATH) * 0.5,
      vel: 0,
      holding: false,
      holdAccum: 0,
      hasPoppedOnce: false,
      cleared: 0,
      goal,
      rideSecs,
      blockers: buildBlockers(level),
      treasureId: TREASURES[Math.max(0, Math.min(level, TREASURES.length - 1))],
      reduced,
      landingAngle: Math.PI * 1.55,
      landed: false,
      sparks: [],
      popFlash: 0,
      popCooldown: 0,
      windWarned: false,
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

    updateWindRibbon(s, dt);
    softWindDump(s);
    softContactCluster(s);
    // Live "NOW" coaching when in the POP window.
    if (!s.result && !earlyClarity(s)) {
      const lit = nextLit(s);
      if (lit) {
        const ad = angDist(s.angle, lit.angle);
        const dh = Math.abs(s.height - lit.height);
        const halfPad = lit.teach ? 0.1 : 0.06;
        if (ad <= POP_NEAR_ANG && dh <= lit.half + halfPad) {
          s.note = lit.teach
            ? 'NOW — POP through the breeze! Cleared ' + s.cleared + ' / ' + s.goal + '.'
            : 'NOW — POP! Cleared ' + s.cleared + ' / ' + s.goal + '.';
        } else if (ad <= POP_NEAR_ANG && dh > lit.half) {
          if (lit.teach) {
            s.note = 'Wind near — match height, then POP.';
          } else {
            s.note = lit.path === 'high-path'
              ? 'Glow near — HOLD to rise, then POP.'
              : 'Glow near — release to drift, then POP.';
          }
        }
      }
    }
    scheduleTreasure(s);
    tryCollectTreasure(s);
    tickFx(s, dt);

    const rideSecs = s.rideSecs || chapterRideSecs(s.level);
    s.progress = Math.min(1, s.t / rideSecs);

    if (!s.landed && s.t >= rideSecs - LANDING_LEAD) {
      s.note = 'Landing branch ahead. Cleared ' + s.cleared + ' / ' + s.goal + '.';
    }
    if (!s.landed && s.t >= rideSecs) {
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
    (s.blockers || []).forEach((b) => {
      if (b.teach) drawWindRibbon(d, b, s.angle, s.t || 0);
      drawCluster(d, b, s.angle, lit && b.id === lit.id);
    });

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
