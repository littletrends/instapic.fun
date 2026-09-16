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
 *   2 Ribbon Breeze — PASS (b0969e7 fairness). Wind-ribbon teach on the
 *     FIRST lit blocker only (long warn, freeze drift in POP window, soft
 *     dump, later clean POP). GOAL 3 of 5. Aura FAIL retune: wider HOLD→POP.
 *   3 Lantern Boughs — PASS locked. Lantern height-band teach on the FIRST
 *     lit blocker (retune2: wider band, slower orbit, mid-ish later balloons,
 *     longer ride; soft dump; later clean POP). GOAL 3 of 5. No wind ribbon.
 *   4 Crosswind Crown — PASS locked. Visual sideways gust on FIRST lit
 *     blocker only (long warn; drawOx sway; hit-test uses true angle + stable
 *     mid height; soft dump; later clean POP). GOAL 3 of 5.
 *   5 Runaway Bouquet — implemented. Visible bouquet drifts between two
 *     height paths after clear wind + ribbon cues (long warn at mid first;
 *     then real height drift; FREEZE in POP window; soft dump; later clean
 *     POP near-mid). GOAL 3 of 5.
 *   6 unfinished (name kept — do not implement systems yet):
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

// Ch1 locked: POP 4 of 6, ~65s. Ch2–Ch5: POP 3 of 5, ~56–72s (helter haste bar).
const BLOCKER_COUNT_CH1 = 6;
const BLOCKER_COUNT_CH2 = 5;
const BLOCKER_COUNT_CH3 = 5;
const BLOCKER_COUNT_CH4 = 5;
const BLOCKER_COUNT_CH5 = 5;
const GOAL_CH1 = 4;
const GOAL_CH2 = 3;
const GOAL_CH3 = 3;
const GOAL_CH4 = 3;
const GOAL_CH5 = 3;
const RIDE_SECS_CH1 = 65;
const RIDE_SECS_CH2 = 56; // Aura FAIL retune
const RIDE_SECS_CH3 = 72; // fairness retune2: teach + 2 clean with margin
const RIDE_SECS_CH4 = 68; // Crosswind Crown: teach + 2 clean with margin
const RIDE_SECS_CH5 = 70; // Runaway Bouquet: teach + 2 clean with margin
const LANDING_LEAD = 2.8;
const FLASH_SEC = 0.32;
const POP_NEAR_ANG = 1.25; // Ch1 very wide orbit window
const POP_COOLDOWN = 0.18;

/** Long lead warning before the first wind-ribbon teach blocker (Ribbon Breeze). */
const WIND_WARN_SECS = 8.5;
const WIND_AMP = 0.06; // gentler — HOLD→POP can land
const WIND_RATE = 0.65;

/** Long lead warning before the first lantern-band teach blocker (Lantern Boughs). */
const LANTERN_WARN_SECS = 9.0; // longer lantern teach warn
const LANTERN_BAND_HALF = 0.36; // retune2: near-full mid band for teach POP

/** Long lead warning before the first crosswind teach blocker (Crosswind Crown). */
const CROSSWIND_WARN_SECS = 8.5;
const CROSSWIND_AMP = 28; // px sideways visual offset only
const CROSSWIND_RATE = 2.2;

/** Long lead warning before the first runaway-bouquet teach blocker (Runaway Bouquet). */
const RUNAWAY_WARN_SECS = 8.75; // clear wind + ribbon cues while mid (~8.5–9s)
const RUNAWAY_DRIFT_LEAD = 4.2; // height drift starts after cue window
const RUNAWAY_RATE = 0.72; // fair first-play amp/rate — retune if Aura tight

const SPAWN_IDS = ['low-path', 'high-path'];

const LATEX = ['#e8a0b8', '#7eb8b0', '#f0d09a', '#c9a0d8', '#8ec8e8', '#f4b890'];

function isCh2(level) {
  return (level | 0) === 1;
}

function isCh3(level) {
  return (level | 0) === 2;
}

function isCh4(level) {
  return (level | 0) === 3;
}

function isCh5(level) {
  return (level | 0) === 4;
}

function chapterGoal(level) {
  if (isCh5(level)) return GOAL_CH5;
  if (isCh4(level)) return GOAL_CH4;
  if (isCh3(level)) return GOAL_CH3;
  if (isCh2(level)) return GOAL_CH2;
  return GOAL_CH1;
}

function chapterBlockerCount(level) {
  if (isCh5(level)) return BLOCKER_COUNT_CH5;
  if (isCh4(level)) return BLOCKER_COUNT_CH4;
  if (isCh3(level)) return BLOCKER_COUNT_CH3;
  if (isCh2(level)) return BLOCKER_COUNT_CH2;
  return BLOCKER_COUNT_CH1;
}

function chapterRideSecs(level) {
  if (isCh5(level)) return RIDE_SECS_CH5;
  if (isCh4(level)) return RIDE_SECS_CH4;
  if (isCh3(level)) return RIDE_SECS_CH3;
  if (isCh2(level)) return RIDE_SECS_CH2;
  return RIDE_SECS_CH1;
}

function orbitSpeed(level, reduced) {
  // Ch1 very slow weave. Ch2–Ch5 slightly slower still (helter haste ~0.92).
  let base;
  if (isCh5(level)) base = 0.068; // fair first-play Runaway Bouquet
  else if (isCh4(level)) base = 0.070; // fair first-play Crosswind Crown
  else if (isCh3(level)) base = 0.065; // retune2: more time-in-window for 3/3
  else if (isCh2(level)) base = 0.085; // wider time-in-window
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
    const mid = (LOW_PATH + HIGH_PATH) * 0.5;
    // Ch3/Ch4/Ch5 later balloons stay near mid — small climb/drop, not full HIGH/LOW swing.
    const high = i === 0 ? false : (i % 2 === 1);
    let h;
    if (i === 0) h = mid;
    else if (isCh3(level) || isCh4(level) || isCh5(level)) h = mid + (high ? 0.05 : -0.05);
    else h = high ? HIGH_PATH : LOW_PATH;
    const ang = start + ((i + 1) / (count + 1)) * span;
    const decoys = [
      {ox: -38, oy: 10, r: 18, col: LATEX[(i * 2) % LATEX.length]},
      {ox: 36, oy: 14, r: 16, col: LATEX[(i * 2 + 1) % LATEX.length]},
      {ox: 4, oy: -28, r: 14, col: LATEX[(i + 3) % LATEX.length]},
    ];
    const fairHalf = (isCh2(level) || isCh3(level) || isCh4(level) || isCh5(level));
    const b = {
      id: 'block-' + (i + 1),
      angle: ang,
      height: h,
      path: high ? 'high-path' : 'low-path',
      half: ((isCh3(level) || isCh4(level) || isCh5(level)) ? POP_HALF + 0.16 : (fairHalf ? POP_HALF + 0.10 : POP_HALF)) + Math.max(0, 0.02 - level * 0.004),
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
    // Ch3: ONE teach hazard alone — lantern height band on the FIRST lit blocker.
    // No wind ribbon (helter teaches tunnel alone without re-teaching cushion).
    if (isCh3(level) && i === 0) {
      b.teach = true;
      b.lantern = true;
      b.bandHalf = LANTERN_BAND_HALF;
      b.lanternDumped = false;
      // Mid band = start height — first POP teaches band without a long climb.
      const mid = (LOW_PATH + HIGH_PATH) * 0.5;
      b.height = mid;
      b.path = 'low-path';
    }
    // Ch4: ONE teach hazard alone — visual crosswind gust on the FIRST lit blocker.
    // Height stays mid/stable; sideways sway is draw-only (hit-test uses true angle).
    if (isCh4(level) && i === 0) {
      b.teach = true;
      b.crosswind = true;
      b.gustPhase = 0;
      b.drawOx = 0;
      b.crosswindDumped = false;
      const midH = (LOW_PATH + HIGH_PATH) * 0.5;
      b.height = midH;
      b.path = 'low-path';
    }
    // Ch5: ONE teach hazard alone — runaway bouquet drifts between LOW/HIGH after cues.
    // Height IS the real read (unlike Ch4 visual-only). Mid start for teach warn.
    if (isCh5(level) && i === 0) {
      b.teach = true;
      b.runaway = true;
      b.runawayPhase = 0;
      b.baseHeight = (LOW_PATH + HIGH_PATH) * 0.5;
      b.height = b.baseHeight;
      b.path = 'low-path';
      b.runawayDumped = false;
      b.drifting = false;
    }
    return b;
  });
}

function nextLit(s) {
  // Soft-brush "missed" still allows POP until well past — Ch1 must not eat the target.
  // Soft-dumped teach blockers are skipped so later clean targets stay reachable.
  return (s.blockers || []).find((b) => {
    if (b.cleared) return false;
    if (b.windDumped || b.lanternDumped || b.crosswindDumped || b.runawayDumped) return false;
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
    if (b.cleared || b.softBump || b.windDumped || b.lanternDumped || b.crosswindDumped || b.runawayDumped) continue;
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
    // Drift while approaching — FREEZE once inside POP window so HOLD→POP can land
    // (Aura Ch2 FAIL: window felt too tight while height kept moving).
    const nearPop = angDist(s.angle, b.angle) <= POP_NEAR_ANG + 0.15;
    if (!nearPop && (lead < WIND_WARN_SECS + 2.5 || angDist(s.angle, b.angle) < POP_NEAR_ANG + 0.55)) {
      b.windPhase = (b.windPhase || 0) + dt * WIND_RATE;
      const drift = Math.sin(b.windPhase) * (b.windAmp || WIND_AMP);
      b.height = clamp((b.baseHeight || LOW_PATH) + drift, HEIGHT_MIN + 0.08, HEIGHT_MAX - 0.08);
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

/** Ch3: long warn + coaching for the lantern height-band teach (first lit only). */
function updateLanternBand(s, dt) {
  if (!isCh3(s.level)) return;
  const speed = orbitSpeed(s.level, s.reduced);
  for (const b of s.blockers || []) {
    if (!b.teach || !b.lantern || b.cleared || b.lanternDumped) continue;

    const lead = forwardAng(s.angle, b.angle) / Math.max(0.04, speed);
    if (lead <= LANTERN_WARN_SECS && lead > 0.05) {
      if (!s.lanternWarned) {
        s.lanternWarned = true;
        logAction(s, 'lantern-warn', {id: b.id, lead: LANTERN_WARN_SECS});
      }
      if (!earlyClarity(s) && !s.hasPoppedOnce) {
        s.note = 'Lantern band — match height, then POP.';
      }
    }
  }
}

/** Soft dump when lantern teach target passes without POP — ride continues. */
function softLanternDump(s) {
  if (!isCh3(s.level)) return;
  for (const b of s.blockers || []) {
    if (!b.teach || !b.lantern || b.cleared || b.lanternDumped) continue;
    const past = forwardAng(b.angle, s.angle);
    if (past < POP_NEAR_ANG + 0.45) continue; // keep teach POP-able longer
    if (s.angle < b.angle && past > Math.PI) continue;
    b.lanternDumped = true;
    b.missed = true;
    b.missFlash = FLASH_SEC;
    s.vel *= 0.62;
    const pos = basketPos(b.angle, b.height);
    pushBurst(s, pos.x, pos.y, true);
    logAction(s, 'lantern-dump', {id: b.id});
    // Soft fail — never abort paid / never confiscate. Later clean targets still count.
    s.note = 'Passed the lantern — soft dump; ride continues. Cleared '
      + (s.cleared || 0) + ' / ' + s.goal + '.';
  }
}

/** Ch4: visual sideways gust on teach balloon; long warn coaching. Height stays stable. */
function updateCrosswind(s, dt) {
  if (!isCh4(s.level)) return;
  const speed = orbitSpeed(s.level, s.reduced);
  for (const b of s.blockers || []) {
    if (!b.teach || !b.crosswind || b.cleared || b.crosswindDumped) continue;

    // Visual-only sway — never mutate angle or height for hit-test.
    b.gustPhase = (b.gustPhase || 0) + dt * CROSSWIND_RATE;
    b.drawOx = Math.sin(b.gustPhase) * CROSSWIND_AMP;

    const lead = forwardAng(s.angle, b.angle) / Math.max(0.04, speed);
    if (lead <= CROSSWIND_WARN_SECS && lead > 0.05) {
      if (!s.crosswindWarned) {
        s.crosswindWarned = true;
        logAction(s, 'crosswind-warn', {id: b.id, lead: CROSSWIND_WARN_SECS});
      }
      if (!earlyClarity(s) && !s.hasPoppedOnce) {
        s.note = 'Crosswind sway — trust height, ignore sideways, then POP.';
      }
    }
  }
}

/** Soft dump when crosswind teach target passes without POP — ride continues. */
function softCrosswindDump(s) {
  if (!isCh4(s.level)) return;
  for (const b of s.blockers || []) {
    if (!b.teach || !b.crosswind || b.cleared || b.crosswindDumped) continue;
    const past = forwardAng(b.angle, s.angle);
    if (past < POP_NEAR_ANG + 0.45) continue; // keep teach POP-able longer
    if (s.angle < b.angle && past > Math.PI) continue;
    b.crosswindDumped = true;
    b.drawOx = 0;
    b.missed = true;
    b.missFlash = FLASH_SEC;
    s.vel *= 0.62;
    const pos = basketPos(b.angle, b.height);
    pushBurst(s, pos.x, pos.y, true);
    logAction(s, 'crosswind-dump', {id: b.id});
    // Soft fail — never abort paid / never confiscate. Later clean targets still count.
    s.note = 'Gust carried it past — soft dump; ride continues. Cleared '
      + (s.cleared || 0) + ' / ' + s.goal + '.';
  }
}

/** Ch5: long warn with wind+ribbon cues at mid, then real height drift; freeze in POP. */
function updateRunawayBouquet(s, dt) {
  if (!isCh5(s.level)) return;
  const speed = orbitSpeed(s.level, s.reduced);
  const mid = (LOW_PATH + HIGH_PATH) * 0.5;
  const halfSpan = (HIGH_PATH - LOW_PATH) * 0.5;
  for (const b of s.blockers || []) {
    if (!b.teach || !b.runaway || b.cleared || b.runawayDumped) continue;

    const lead = forwardAng(s.angle, b.angle) / Math.max(0.04, speed);
    const nearPop = angDist(s.angle, b.angle) <= POP_NEAR_ANG + 0.15;

    // Cue window first: sit at mid with visual wind + ribbon overlays — no height drift yet.
    if (lead <= RUNAWAY_WARN_SECS && lead > RUNAWAY_DRIFT_LEAD) {
      b.height = b.baseHeight != null ? b.baseHeight : mid;
      b.path = 'low-path';
      b.drifting = false;
    }

    // After cues / when lead short enough: drift between LOW_PATH and HIGH_PATH (real height).
    // FREEZE once inside POP window so HOLD→POP can land (same lesson as Ch2 Aura FAIL fix).
    if (!nearPop && lead <= RUNAWAY_DRIFT_LEAD && (lead > 0.02 || angDist(s.angle, b.angle) < POP_NEAR_ANG + 0.55)) {
      b.drifting = true;
      b.runawayPhase = (b.runawayPhase || 0) + dt * RUNAWAY_RATE;
      const drift = Math.sin(b.runawayPhase) * halfSpan;
      b.height = clamp((b.baseHeight != null ? b.baseHeight : mid) + drift, LOW_PATH - 0.02, HIGH_PATH + 0.02);
      b.path = b.height >= mid ? 'high-path' : 'low-path';
    } else if (nearPop) {
      b.drifting = false; // freeze height while POP-able
    }

    if (lead <= RUNAWAY_WARN_SECS && lead > 0.05) {
      if (!s.runawayWarned) {
        s.runawayWarned = true;
        logAction(s, 'runaway-warn', {id: b.id, lead: RUNAWAY_WARN_SECS});
      }
      if (!earlyClarity(s) && !s.hasPoppedOnce) {
        if (!b.drifting && lead > RUNAWAY_DRIFT_LEAD) {
          s.note = 'Runaway bouquet — watch the wind ribbons; then match its height.';
        } else {
          const rising = Math.cos(b.runawayPhase || 0) > 0;
          s.note = rising
            ? 'Bouquet rising — HOLD to match height, then POP.'
            : 'Bouquet drifting down — release to match height, then POP.';
        }
      }
    }
  }
}

/** Soft dump when runaway teach target passes without POP — ride continues. */
function softRunawayDump(s) {
  if (!isCh5(s.level)) return;
  for (const b of s.blockers || []) {
    if (!b.teach || !b.runaway || b.cleared || b.runawayDumped) continue;
    const past = forwardAng(b.angle, s.angle);
    if (past < POP_NEAR_ANG + 0.45) continue; // keep teach POP-able longer
    if (s.angle < b.angle && past > Math.PI) continue;
    b.runawayDumped = true;
    b.drifting = false;
    b.missed = true;
    b.missFlash = FLASH_SEC;
    s.vel *= 0.62;
    const pos = basketPos(b.angle, b.height);
    pushBurst(s, pos.x, pos.y, true);
    logAction(s, 'runaway-dump', {id: b.id});
    // Soft fail — never abort paid / never confiscate. Later clean targets still count.
    s.note = 'Bouquet ran past — soft dump; ride continues. Cleared '
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
  // Ch1: after 3 clears, open the door for the 4th POP. Ch2–Ch5: clutch earlier for 3/3.
  const fair = isCh2(s.level) || isCh3(s.level) || isCh4(s.level) || isCh5(s.level);
  const ch3 = isCh3(s.level);
  const ch4 = isCh4(s.level);
  const ch5 = isCh5(s.level);
  const chFairPad = ch3 || ch4 || ch5; // Ch3-style fairness pads for Ch4/Ch5
  const clutchNeed = fair ? 1 : 3;
  const clutch = (s.cleared || 0) >= clutchNeed;
  const nearLim = POP_NEAR_ANG + (clutch ? 0.50 : (chFairPad ? 0.38 : (fair ? 0.25 : 0)));
  const halfLim = lit.half + (clutch ? 0.16 : (chFairPad ? 0.10 : (fair ? 0.06 : 0)));
  const near = ad <= nearLim;
  const isLanternTeach = !!(lit.teach && lit.lantern && !lit.lanternDumped);
  const isWindTeach = !!(lit.teach && lit.windAmp != null && !lit.windDumped);
  const isCrosswindTeach = !!(lit.teach && lit.crosswind && !lit.crosswindDumped);
  const isRunawayTeach = !!(lit.teach && lit.runaway && !lit.runawayDumped);
  // Forgiveness snap — teach hazards get a bigger magnet once near.
  // Crosswind teach uses fair teach snap (stable height; visual sway ignored).
  // Runaway teach matches drifting height (like wind) — generous snap once near.
  const teachSnap = isLanternTeach ? 0.22 : (isWindTeach || isCrosswindTeach || isRunawayTeach ? 0.12 : (chFairPad ? 0.10 : (fair ? 0.04 : 0)));
  const bandHalf = isLanternTeach ? (lit.bandHalf || LANTERN_BAND_HALF) : halfLim;
  const snapBand = (isLanternTeach ? bandHalf : halfLim) + 0.28 + teachSnap;
  if (near && dh <= snapBand) {
    const pull = isLanternTeach ? 0.98 : (clutch || lit.teach || chFairPad ? 0.94 : (fair ? 0.8 : 0.72));
    s.height = s.height + (lit.height - s.height) * pull;
    dh = Math.abs(s.height - lit.height);
  }
  // Lantern teach: readable band with Ch3 forgiveness pad.
  // Crosswind teach: normal half (stable mid height) — NOT lantern band.
  const heightOk = isLanternTeach
    ? dh <= bandHalf + 0.10
    : dh <= halfLim + (lit.teach ? 0.08 : (chFairPad ? 0.06 : 0));

  if (near && heightOk) {
    lit.cleared = true;
    lit.flash = FLASH_SEC;
    s.cleared += 1;
    s.hasPoppedOnce = true;
    const art = ORDINARY[(s.cleared - 1) % ORDINARY.length];
    recordFind(s, art, RIDE);
    logAction(s, 'pop', {id: lit.id, ok: true, path: lit.path, teach: !!lit.teach, lantern: !!lit.lantern, crosswind: !!lit.crosswind, runaway: !!lit.runaway});
    const pos = basketPos(lit.angle, lit.height);
    pushBurst(s, pos.x, pos.y, false);
    s.note = s.cleared >= s.goal
      ? 'Path clear! Landing branch ahead.'
      : (isLanternTeach
        ? ('POP in the lantern band! Cleared ' + s.cleared + ' / ' + s.goal + '.')
        : (isCrosswindTeach
          ? ('POP through the sway! Cleared ' + s.cleared + ' / ' + s.goal + '.')
          : (isRunawayTeach
            ? ('POP the runaway bouquet! Cleared ' + s.cleared + ' / ' + s.goal + '.')
            : (isWindTeach
              ? ('POP through the breeze! Cleared ' + s.cleared + ' / ' + s.goal + '.')
              : ('POP! Cleared ' + s.cleared + ' / ' + s.goal + '.')))));
    return;
  }

  // Soft miss / bounce — wrong timing, wrong height, or decoy brush.
  // Soft miss never aborts paid / never confiscates; path stays blocked.
  s.vel *= 0.55;
  if (!heightOk && near) s.vel += (s.height > lit.height ? -0.18 : 0.18);
  lit.missFlash = FLASH_SEC * 0.7;
  const pos = basketPos(lit.angle, lit.height);
  pushBurst(s, pos.x, pos.y, true);
  logAction(s, 'pop', {id: lit.id, ok: false, near, heightOk, lantern: !!lit.lantern, crosswind: !!lit.crosswind, runaway: !!lit.runaway});
  if (!near) {
    s.note = 'Too far — wait for the glow. Cleared ' + s.cleared + ' / ' + s.goal + '.';
  } else if (!heightOk) {
    if (isLanternTeach) {
      s.note = s.height < lit.height
        ? 'Outside lantern band — HOLD to rise into it, then POP.'
        : 'Outside lantern band — release to drift into it, then POP.';
    } else if (isCrosswindTeach) {
      s.note = 'Sway is visual — trust mid height, then POP.';
    } else if (isRunawayTeach) {
      s.note = s.height < lit.height
        ? 'Bouquet is higher — HOLD to match, then POP.'
        : 'Bouquet is lower — release to match, then POP.';
    } else if (isWindTeach) {
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

function drawLanternBand(d, b, angleNow, t) {
  if (!b.teach || !b.lantern || b.cleared || b.lanternDumped) return;
  let da = b.angle - angleNow;
  while (da < -Math.PI) da += Math.PI * 2;
  while (da > Math.PI) da -= Math.PI * 2;
  if (da < -0.5 || da > 1.7) return;

  const pos = basketPos(b.angle, b.height);
  const half = b.bandHalf || LANTERN_BAND_HALF;
  // Band edges in screen space (height * 210 matches heightToY scale).
  const yHi = pos.y - half * 210;
  const yLo = pos.y + half * 210;
  const pulse = 0.55 + 0.45 * Math.sin((t || 0) * 3.2);

  // Readable horizontal lantern band brackets (code overlays only).
  const x0 = pos.x - 46;
  const x1 = pos.x + 46;
  d.line({x: x0, y: yHi}, {x: x1, y: yHi}, '#f0c070aa', 2.2);
  d.line({x: x0, y: yLo}, {x: x1, y: yLo}, '#f0c070aa', 2.2);
  d.line({x: x0, y: yHi}, {x: x0, y: yLo}, '#f0c07066', 1.4);
  d.line({x: x1, y: yHi}, {x: x1, y: yLo}, '#f0c07066', 1.4);
  // Soft lantern corner ticks
  for (const [tx, ty] of [[x0, yHi], [x1, yHi], [x0, yLo], [x1, yLo]]) {
    d.circle(tx, ty, 3.2 + pulse * 1.2, '#f0c070cc', '#ffe6a4', 1);
  }
  // Warm lantern glow on teach target — 6-digit #rrggbb only.
  d.glow(pos.x, pos.y - 6, 34 + pulse * 8, '#f0c070');
  if (da < 0.95 && da > -0.2) {
    d.text('band', pos.x, yHi - 14, 14, '#f0c070');
  }
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

function drawCrosswindGust(d, b, angleNow, t) {
  if (!b.teach || !b.crosswind || b.cleared || b.crosswindDumped) return;
  let da = b.angle - angleNow;
  while (da < -Math.PI) da += Math.PI * 2;
  while (da > Math.PI) da -= Math.PI * 2;
  if (da < -0.5 || da > 1.7) return;

  const pos = basketPos(b.angle, b.height);
  const ox = b.drawOx || 0;
  const gx = pos.x + ox;
  // Short sideways gust dashes / ribbons — visual only.
  for (let i = 0; i < 4; i++) {
    const yOff = (i - 1.5) * 11;
    const phase = (t || 0) * 3.1 + i * 0.7 + (b.gustPhase || 0);
    const len = 28 + Math.abs(Math.sin(phase)) * 18;
    const dir = Math.sin(b.gustPhase || 0) >= 0 ? 1 : -1;
    const x0 = gx - dir * 8;
    const x1 = gx - dir * (8 + len);
    const y = pos.y + yOff + Math.sin(phase) * 3;
    d.line({x: x0, y: y}, {x: x1, y: y + dir * 2}, '#b8d4e8aa', 1.6);
    d.line({x: x1, y: y + dir * 2}, {x: x1 - dir * 6, y: y - 4}, '#b8d4e866', 1.2);
  }
  // Soft lavender-cyan glow — 6-digit #rrggbb only.
  d.glow(gx, pos.y - 6, 34, '#b8d4e8');
  if (da < 0.95 && da > -0.2) {
    d.text('gust', gx, pos.y - b.r - 34, 14, '#b8d4e8');
  }
}

function drawRunawayBouquet(d, b, angleNow, t) {
  if (!b.teach || !b.runaway || b.cleared || b.runawayDumped) return;
  let da = b.angle - angleNow;
  while (da < -Math.PI) da += Math.PI * 2;
  while (da > Math.PI) da -= Math.PI * 2;
  if (da < -0.5 || da > 1.7) return;

  const pos = basketPos(b.angle, b.height);
  const pulse = 0.55 + 0.45 * Math.sin((t || 0) * 2.8);
  const cueing = !b.drifting;

  // Wind + ribbon cue lines (clear before/during drift) — code overlays only.
  for (let i = 0; i < 4; i++) {
    const yOff = (i - 1.5) * 11;
    const phase = (t || 0) * 2.6 + i * 0.85;
    const x0 = pos.x - 56;
    const x1 = pos.x + 56;
    const y0 = pos.y + yOff + Math.sin(phase) * (cueing ? 7 : 4);
    const y1 = pos.y + yOff + Math.sin(phase + 1.2) * (cueing ? 7 : 4);
    const midX = pos.x + Math.cos(phase * 0.65) * 10;
    const midY = pos.y + yOff + Math.sin(phase + 0.5) * 8;
    d.line({x: x0, y: y0}, {x: midX, y: midY}, '#e8a0b888', cueing ? 1.8 : 1.3);
    d.line({x: midX, y: midY}, {x: x1, y: y1}, '#e8a0b866', cueing ? 1.5 : 1.1);
  }
  // Bouquet-ish cluster accents (small satellite latex tied as a runaway bunch).
  const sats = [
    {ox: -18, oy: -14, r: 9},
    {ox: 16, oy: -12, r: 8},
    {ox: -6, oy: -22, r: 7},
    {ox: 8, oy: -20, r: 6},
  ];
  for (const sat of sats) {
    d.circle(pos.x + sat.ox, pos.y + sat.oy, sat.r, '#e8a0b8aa', '#f4d590', 1);
    d.line(
      {x: pos.x + sat.ox, y: pos.y + sat.oy + sat.r - 1},
      {x: pos.x, y: pos.y + 6},
      '#d2a65b66',
      1
    );
  }
  // Soft rose glow — 6-digit #rrggbb only.
  d.glow(pos.x, pos.y - 6, 34 + pulse * 8, '#e8a0b8');
  if (da < 0.95 && da > -0.2) {
    d.text(cueing ? 'ribbons' : 'drift', pos.x, pos.y - b.r - 34, 14, '#e8a0b8');
  }
}

function drawCluster(d, b, angleNow, isLit) {
  let da = b.angle - angleNow;
  while (da < -Math.PI) da += Math.PI * 2;
  while (da > Math.PI) da -= Math.PI * 2;
  if (da < -0.4 || da > 1.65) {
    if (!(b.flash > 0) && !(b.missFlash > 0)) return;
  }

  const pos = basketPos(b.angle, b.height);
  // Visual-only sideways offset for crosswind teach (hit-tests stay on true angle).
  const drawOx = (b.crosswind && !b.cleared && !b.crosswindDumped) ? (b.drawOx || 0) : 0;
  const sx = pos.x + drawOx;
  const sy = pos.y;

  if (b.cleared) {
    if (b.flash > 0) {
      const bloom = b.flash / FLASH_SEC;
      d.glow(sx, sy, 56 * bloom, '#ffe6a4');
      d.circle(sx, sy, 10 + 18 * bloom, null, '#fff6d8', 3);
    }
    return;
  }

  if (b.windDumped) {
    if (b.missFlash > 0) d.glow(sx, sy, 36, '#8ec8e8');
    d.circle(sx, sy, b.r * 0.7, '#8ec8e855', '#8ec8e888', 1.2);
    return;
  }

  if (b.lanternDumped) {
    if (b.missFlash > 0) d.glow(sx, sy, 36, '#f0c070');
    d.circle(sx, sy, b.r * 0.7, '#f0c07055', '#f0c07088', 1.2);
    return;
  }

  if (b.crosswindDumped) {
    if (b.missFlash > 0) d.glow(sx, sy, 36, '#b8d4e8');
    d.circle(sx, sy, b.r * 0.7, '#b8d4e855', '#b8d4e888', 1.2);
    return;
  }

  if (b.runawayDumped) {
    if (b.missFlash > 0) d.glow(sx, sy, 36, '#e8a0b8');
    d.circle(sx, sy, b.r * 0.7, '#e8a0b855', '#e8a0b888', 1.2);
    return;
  }

  // Decoy latex (not the gate). Soft paper circles — no trunk/ellipse overpaint.
  for (const dec of b.decoys) {
    const dx = sx + dec.ox;
    const dy = sy + dec.oy;
    d.circle(dx, dy, dec.r, dec.col + 'bb', '#f4d590', 1.2);
    d.line({x: dx, y: dy + dec.r - 2}, {x: dx, y: dy + dec.r + 14}, '#d2a65b88', 1);
  }

  if (b.missFlash > 0) {
    d.glow(sx, sy, 40, b.softBump ? '#8ec8e8' : '#c9a08e');
  }

  // Lit / glowing POP target (only the active gate screams).
  if (isLit) {
    const pulse = 0.55 + 0.45 * Math.sin((angleNow + b.angle) * 6);
    d.glow(sx, sy, 48 + pulse * 16, '#ffe6a4');
    d.circle(sx, sy, b.r + 4, '#fff6d8ee', '#ffe6a4', 3);
    d.circle(sx, sy, b.r, '#f0d09acc', '#d2a65b', 2);
    d.circle(sx - 6, sy - 8, 5, '#ffffffaa', null, 0);
    if (da < 0.9 && da > -0.25) {
      const label = b.lantern ? 'POP · band' : (b.crosswind ? 'POP · gust' : (b.runaway ? 'POP · bouquet' : (b.teach ? 'POP · wind' : 'POP')));
      d.text(label, sx, sy - b.r - 18, 18, '#ffe6a4');
    }
  } else {
    d.circle(sx, sy, b.r * 0.85, '#e8a0b888', '#d2a65b88', 1.5);
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

  const g = s.goal || chapterGoal(s.level);
  const prefix = isCh5(s.level)
    ? 'Runaway Bouquet · '
    : (isCh4(s.level)
      ? 'Crosswind Crown · '
      : (isCh3(s.level)
        ? 'Lantern Boughs · '
        : (isCh2(s.level) ? 'Ribbon Breeze · ' : '')));
  const line = prefix + 'Cleared ' + (s.cleared || 0) + ' / ' + g;
  d.text(line, 450, s.practice ? 168 : 148, 22, '#ffe6a4');
  if (s.note) wrapLine(d, s.note, 450, s.practice ? 198 : 178, 16, '#f0d18f', 720);
}

export default {
  title: 'Balloon Garden',
  intro: 'POP the glowing balloon to open a path through Nell’s Balloon Tree. Ribbon Breeze drifts the first lit balloon on a wind ribbon; Lantern Boughs asks you to match a visible height band; Crosswind Crown sways the approach sideways — trust height, then POP; Runaway Bouquet shows wind ribbons then drifts between two heights — match, then POP.',
  instructions: 'POP lit latex to clear the corridor. HOLD bellows only to reach high or low clusters. Ch2 Ribbon Breeze: one wind ribbon on the first glow — long warn, soft dump if it drifts past. Ch3 Lantern Boughs: one lantern height band on the first glow — match height, then POP; soft miss / soft dump; later balloons are clean POP. Ch4 Crosswind Crown: one visual sideways gust on the first glow — trust height, ignore sway, then POP; soft miss / soft dump; later balloons are clean POP. Ch5 Runaway Bouquet: wind + ribbon cues first, then the bouquet drifts between low and high — match height, then POP; soft miss / soft dump; later balloons are clean POP.',
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
      lanternWarned: false,
      crosswindWarned: false,
      runawayWarned: false,
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
    updateLanternBand(s, dt);
    softLanternDump(s);
    updateCrosswind(s, dt);
    softCrosswindDump(s);
    updateRunawayBouquet(s, dt);
    softRunawayDump(s);
    softContactCluster(s);
    // Live "NOW" coaching when in the POP window.
    if (!s.result && !earlyClarity(s)) {
      const lit = nextLit(s);
      if (lit) {
        const ad = angDist(s.angle, lit.angle);
        const dh = Math.abs(s.height - lit.height);
        const isLanternTeach = !!(lit.teach && lit.lantern);
        const isWindTeach = !!(lit.teach && lit.windAmp != null);
        const isCrosswindTeach = !!(lit.teach && lit.crosswind);
        const isRunawayTeach = !!(lit.teach && lit.runaway);
        const heightLim = isLanternTeach
          ? (lit.bandHalf || LANTERN_BAND_HALF)
          : lit.half + (lit.teach ? 0.1 : 0.06);
        if (ad <= POP_NEAR_ANG && dh <= heightLim) {
          s.note = isLanternTeach
            ? 'NOW — POP in the lantern band! Cleared ' + s.cleared + ' / ' + s.goal + '.'
            : (isCrosswindTeach
              ? 'NOW — trust height, POP through the sway! Cleared ' + s.cleared + ' / ' + s.goal + '.'
              : (isRunawayTeach
                ? 'NOW — match height, POP the bouquet! Cleared ' + s.cleared + ' / ' + s.goal + '.'
                : (isWindTeach
                  ? 'NOW — POP through the breeze! Cleared ' + s.cleared + ' / ' + s.goal + '.'
                  : 'NOW — POP! Cleared ' + s.cleared + ' / ' + s.goal + '.')));
        } else if (ad <= POP_NEAR_ANG && dh > heightLim) {
          if (isLanternTeach) {
            s.note = 'Lantern near — match height into the band, then POP.';
          } else if (isCrosswindTeach) {
            s.note = 'Gust near — stay mid height, ignore sway, then POP.';
          } else if (isRunawayTeach) {
            s.note = s.height < lit.height
              ? 'Bouquet near — HOLD to match height, then POP.'
              : 'Bouquet near — release to match height, then POP.';
          } else if (isWindTeach) {
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
      // Overlay priority: lantern > crosswind > runaway > wind (teach hazards don't fight).
      if (b.teach && b.lantern) drawLanternBand(d, b, s.angle, s.t || 0);
      else if (b.teach && b.crosswind) drawCrosswindGust(d, b, s.angle, s.t || 0);
      else if (b.teach && b.runaway) drawRunawayBouquet(d, b, s.angle, s.t || 0);
      else if (b.teach) drawWindRibbon(d, b, s.angle, s.t || 0);
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
