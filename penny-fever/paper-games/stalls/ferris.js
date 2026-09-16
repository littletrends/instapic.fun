/**
 * Pocket Wheel (Jasper · ferris) — Ride & Seek stall
 * Tagline: Rise above the midway. Look closer.
 * LOCKED lane: Tempest/Robotron-lite quiet carnival gallery.
 *   Gondola is the hub; targets climb the spokes; SNAP them in the brass
 *   glow before they reach you. Quiet Jasper, loud gallery verb: SNAP.
 * Feel: Duck Hunt gallery + Tempest spokes + Perfect Hit timing.
 * Dropped: soft dwell-FOCUS meter as the core loop.
 *
 * SHIPPED:
 *   Ch1 First Look — Aura PASS. Slow spokes, fat glow, release-while-lit SNAP
 *     hit-reg LOCKED (do not regress isTap-free release / chrome / actions).
 *   Ch2 Gondola Secrets — Aura PASS (9464867). Emblems + luggage soft-hazard.
 *   Ch3 Rooftop Trail — Aura PASS (958f413). Ordered roofs + chimney; miss-retry.
 *   Ch4 Cloud Crossing — Aura PASS (942d27f). Clouds occlude glow; armed/climb hold.
 *   Ch5 Ferris at Midnight — Aura PASS (ebfbf02). Moon preview; dim glyphs; unmarked soft-dump.
 *   Ch6 The Highest View — ≤2 Tempest depth rings; SNAP true finds; balloon decoys soft-dump.
 *
 * All six chapter names locked. Keep treasures. glow() 6-digit hex only.
 * Layout: shell #actions SNAP + .play-hud + readout; no on-court chrome/HUD.
 */
import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction,
  prefersReducedMotion,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'ferris';
const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
const TREASURES = [
  'pocket-wheel', 'star-token', 'moon-penny',
  'ride-ticket', 'ride-stamp-book', 'ride-explorer-pennant',
];
const LEVELS = [
  'First Look', 'Gondola Secrets', 'Rooftop Trail',
  'Cloud Crossing', 'Ferris at Midnight', 'The Highest View',
];

const W = 900;
const H = 1200;
const CX = 450;
const CY = 560;
const WHEEL_R = 250;
const HUB_X = CX;
const HUB_Y = 820; // gondola hub — targets climb toward you

const LENS_R = 96;
const RETICLE_R = 56; // Ch1 attested default; prefer reticleR(s.level) when drawing/hit-testing
const LENS_FINGER_Y = 96;
const HUD_TOP = 110;
const HUD_BOT = 1040;
const LENS_X_MIN = 90;
const LENS_X_MAX = 810;
const LENS_Y_MIN = HUD_TOP + LENS_R + 8;
const LENS_Y_MAX = HUD_BOT - LENS_R - 8;

const RIDE_SECS = 48;
const RIDE_SECS_CH2 = 56; // helter-bar: recoverable 3/3 on first play
const RIDE_SECS_CH3 = 72;
const RIDE_SECS_CH4 = 68; // cloud gaps + 3/3 first-play bar
const RIDE_SECS_CH5 = 78; // preview + dim climb + 3/3 first-play
const RIDE_SECS_CH6 = 74; // two depths + decoys; first-play 3/3
const GOAL = 3;
const LENS_MOVE_LOG_MS = 280;
const COLLECT_FLASH = 0.45;
const CLARITY_SECS = 5;
const TEACH = 'Aim the lens, then SNAP (button or release).';
const TEACH_CH2 = 'Emblems only — luggage is a soft dump.';
const TEACH_CH3 = 'Roofs in order — chimney is a soft dump.';
const TEACH_CH4 = 'Wait out the cloud, then SNAP in the clear glow.';
const TEACH_CH5 = 'Marked finds only — unmarked is a soft dump.';
const TEACH_CH6 = 'True finds on the rings — balloons soft-dump.';
const BALLOON_WARN = 6.5; // Ch6 teach decoy alone
const PREVIEW_SECS = 7.0; // Ch5 moonlight marking preview once
const GLOW_PAD_CH1 = 36; // Ch1 attested
const GLOW_PAD_CH2 = 28; // slightly tighter, still first-play fair
const GLOW_PAD_CH3 = 36; // match Ch1 fat — Aura fairness
const GLOW_PAD_CH4 = 34; // generous under cloud timing
const GLOW_PAD_CH5 = 36;
const GLOW_PAD_CH6 = 36;
const RETICLE_CH1 = 56;
const RETICLE_CH2 = 48;
const RETICLE_CH3 = 56; // match Ch1 fat
const RETICLE_CH4 = 54;
const RETICLE_CH5 = 56;
const RETICLE_CH6 = 56;
const LUGGAGE_WARN = 7.5; // teach hazard alone with long warn (helter Ch2 bar)
const CHIMNEY_WARN = 6.0; // Ch3 teach hazard alone — leave more trail time
const CLOUD_TEACH = 7.5; // first cloud alone across the lens

function rideSecs(level) {
  if (level === 1) return RIDE_SECS_CH2;
  if (level === 2) return RIDE_SECS_CH3;
  if (level === 3) return RIDE_SECS_CH4;
  if (level === 4) return RIDE_SECS_CH5;
  if (level === 5) return RIDE_SECS_CH6;
  return RIDE_SECS;
}

function glowPad(level) {
  if (level === 1) return GLOW_PAD_CH2;
  if (level === 2) return GLOW_PAD_CH3;
  if (level === 3) return GLOW_PAD_CH4;
  if (level === 4) return GLOW_PAD_CH5;
  if (level === 5) return GLOW_PAD_CH6;
  return GLOW_PAD_CH1;
}

function reticleR(level) {
  if (level === 1) return RETICLE_CH2;
  if (level === 2) return RETICLE_CH3;
  if (level === 3) return RETICLE_CH4;
  if (level === 4) return RETICLE_CH5;
  if (level === 5) return RETICLE_CH6;
  return RETICLE_CH1;
}

function wheelSpin(level, reduced) {
  // Slow afternoon spin of the spoke field. Eligibility never changes this.
  const base = 0.08 + Math.min(0.03, level * 0.008);
  return reduced ? base * 0.5 : base;
}

function climbSpeed(level, reduced) {
  // Ch1 attested slow. Ch2/Ch3 still 3/3-reachable on first play.
  let base = 0.020;
  if (level === 1) base = 0.022;
  else if (level === 2) base = 0.014;
  else if (level === 3) base = 0.018;
  else if (level === 4) base = 0.014;
  else if (level === 5) base = 0.015;
  else if (level >= 6) base = 0.036;
  return reduced ? base * 0.65 : base;
}

function wheelEase(progress) {
  if (progress < 0.82) return 1;
  const u = (progress - 0.82) / 0.18;
  return 1 - 0.55 * u * u;
}


/** Ch2 — distinct cabin emblems + ONE luggage teach-hazard (soft fail). */
function ch2Targets() {
  return [
    {id: 'luggage', label: 'luggage', spoke: -1.2, size: 30, kind: 'hazard', art: null},
    {id: 'emblem-heart', label: 'heart emblem', spoke: 0.4, size: 32, kind: 'ordinary', art: ORDINARY[0]},
    {id: 'emblem-star', label: 'star emblem', spoke: 2.0, size: 32, kind: 'ordinary', art: ORDINARY[1]},
    {id: 'emblem-moon', label: 'moon emblem', spoke: -2.5, size: 32, kind: 'ordinary', art: ORDINARY[2]},
    {id: 'emblem-key', label: 'key emblem', spoke: 1.2, size: 30, kind: 'ordinary', art: ORDINARY[0]},
  ];
}

function chapterTargets(level) {
  if (level === 1) return ch2Targets();
  if (level === 2) return ch3Targets();
  if (level === 3) return ch4Targets();
  if (level === 4) return ch5Targets();
  if (level === 5) return ch6Targets();
  return ch1Targets();
}

/** Ch3 — ordered rooftop trail + ONE chimney teach-hazard (soft fail). */
function ch3Targets() {
  return [
    {id: 'chimney', label: 'chimney', spoke: -0.7, size: 30, kind: 'hazard', art: null},
    {id: 'roof-1', label: 'roof clue 1', spoke: 0.5, size: 40, kind: 'ordinary', trail: 0, art: ORDINARY[0]},
    {id: 'roof-2', label: 'roof clue 2', spoke: 2.1, size: 40, kind: 'ordinary', trail: 1, art: ORDINARY[1]},
    {id: 'roof-3', label: 'roof clue 3', spoke: -2.3, size: 40, kind: 'ordinary', trail: 2, art: ORDINARY[2]},
  ];
}



/** Ch6 — ≤2 Tempest depth rings; true finds + balloon decoys (soft dump). */
function ch6Targets() {
  return [
    {id: 'balloon', label: 'decoy balloon', spoke: -1.05, size: 30, kind: 'hazard', depth: 0, art: null},
    {id: 'peak-a', label: 'outer peak', spoke: 0.35, size: 36, kind: 'ordinary', depth: 0, art: ORDINARY[0]},
    {id: 'peak-b', label: 'inner crest', spoke: 2.0, size: 34, kind: 'ordinary', depth: 1, art: ORDINARY[1]},
    {id: 'peak-c', label: 'outer lamp', spoke: -2.25, size: 34, kind: 'ordinary', depth: 0, art: ORDINARY[2]},
    {id: 'peak-d', label: 'inner pennant', spoke: 1.15, size: 32, kind: 'ordinary', depth: 1, art: ORDINARY[0]},
  ];
}
/** Ch5 — moon-marked finds + ONE unmarked soft-dump; preview markings once. */
function ch5Targets() {
  return [
    {id: 'mark-crescent', label: 'crescent mark', spoke: -0.9, size: 36, kind: 'ordinary', marked: true, art: ORDINARY[0]},
    {id: 'mark-star', label: 'star mark', spoke: 0.5, size: 34, kind: 'ordinary', marked: true, art: ORDINARY[1]},
    {id: 'unmarked', label: 'unmarked lantern', spoke: 1.6, size: 30, kind: 'hazard', marked: false, art: null},
    {id: 'mark-ring', label: 'ring mark', spoke: 2.35, size: 34, kind: 'ordinary', marked: true, art: ORDINARY[2]},
    {id: 'mark-dot', label: 'dot mark', spoke: -2.4, size: 32, kind: 'ordinary', marked: true, art: ORDINARY[0]},
  ];
}
/** Ch4 — sky finds + drifting clouds that occlude glow (armed/climb never reset). */
function ch4Targets() {
  return [
    {id: 'crest', label: 'cloud crest', spoke: -0.85, size: 36, kind: 'ordinary', art: ORDINARY[0]},
    {id: 'sun-rim', label: 'sun rim', spoke: 0.55, size: 34, kind: 'ordinary', art: ORDINARY[1]},
    {id: 'kite', label: 'paper kite', spoke: 2.2, size: 34, kind: 'ordinary', art: ORDINARY[2]},
    {id: 'pennant', label: 'sky pennant', spoke: -2.35, size: 32, kind: 'ordinary', art: ORDINARY[0]},
  ];
}
/** Ch1 gallery targets — large silhouettes on distinct spokes. */
function ch1Targets() {
  return [
    {id: 'roof', label: 'tent roof', spoke: -0.9, size: 34, kind: 'ordinary', art: ORDINARY[0]},
    {id: 'gondola', label: 'cabin emblem', spoke: 0.55, size: 32, kind: 'ordinary', art: ORDINARY[1]},
    {id: 'horizon', label: 'horizon lamp', spoke: 2.4, size: 30, kind: 'ordinary', art: ORDINARY[2]},
    {id: 'framework', label: 'spoke pennant', spoke: -2.2, size: 28, kind: 'ordinary', art: ORDINARY[0]},
  ];
}

function spokePos(spokeAngle, climb, depth = 0) {
  // climb 0 = rim (safe), 1 = hub (reaches you — miss if unsnapped).
  // depth 0 = outer Tempest ring, depth 1 = inner (≤2 depths for Ch6).
  const ring = depth >= 1 ? 0.72 : 1.0;
  const rimX = CX + Math.cos(spokeAngle) * WHEEL_R * ring;
  const rimY = CY + Math.sin(spokeAngle) * WHEEL_R * 0.72 * ring;
  return {
    x: rimX + (HUB_X - rimX) * climb,
    y: rimY + (HUB_Y - rimY) * climb,
  };
}

function clampLens(x, y) {
  return {
    x: clamp(x, LENS_X_MIN, LENS_X_MAX),
    y: clamp(y, LENS_Y_MIN, LENS_Y_MAX),
  };
}

function fingerToLens(p) {
  return clampLens(p.x, p.y - LENS_FINGER_Y);
}

function inGlow(lx, ly, x, y, level = 0) {
  return Math.hypot(x - lx, y - ly) <= reticleR(level) + glowPad(level);
}

function inLens(lx, ly, x, y, pad = 0) {
  return Math.hypot(x - lx, y - ly) <= LENS_R + pad;
}

function scheduleCh1(s) {
  const rows = ch1Targets();
  // Stagger climbs so the player learns SNAP on one subject at a time.
  s.targets = rows.map((row, i) => ({
    ...row,
    kind: row.kind || 'ordinary',
    climb: 0,
    alive: true,
    snapped: false,
    missed: false,
    open: 0.4 + i * 9.5,
    active: false,
    teach: false,
  }));
  s.goal = GOAL;
  s.found = 0;
  s.glowId = null;
  s.rideSecs = rideSecs(0);
  s.treasure = null;
  attachTreasureHost(s);
}

function scheduleCh2(s) {
  // Helter Ch2 bar: ONE teach hazard alone (long warn), then clean emblem climbs.
  const rows = ch2Targets();
  s.targets = rows.map((row, i) => {
    const isHaz = row.kind === 'hazard';
    // Emblem index among non-hazards (0..n)
    const ei = isHaz ? -1 : (i - 1);
    return {
      ...row,
      climb: 0,
      alive: true,
      snapped: false,
      missed: false,
      // Luggage alone first; emblems start after it should be gone, staggered for 3/3.
      open: isHaz ? 0.4 : (LUGGAGE_WARN + 0.8 + ei * 7.2),
      active: false,
      teach: isHaz,
      // Luggage exits quickly after the teach window so it cannot hog the glow.
      forceExit: isHaz ? (LUGGAGE_WARN + 0.6) : null,
    };
  });
  s.goal = GOAL;
  s.found = 0;
  s.glowId = null;
  s.rideSecs = rideSecs(1);
  s.hazardWarned = false;
  s.treasure = null;
  attachTreasureHost(s);
}

function scheduleCh3(s) {
  // Ordered trail: chimney teach alone, then roof 1→2→3 arms after each SNAP.
  const rows = ch3Targets();
  s.trailStep = 0;
  s.targets = rows.map((row) => {
    const isHaz = row.kind === 'hazard';
    const trail = row.trail;
    return {
      ...row,
      climb: 0,
      alive: true,
      snapped: false,
      missed: false,
      open: isHaz ? 0.4 : (CHIMNEY_WARN + 0.8), // roofs wait; arming gates climb
      active: false,
      armed: isHaz ? true : (trail === 0), // only first roof armed after hazard phase
      teach: isHaz,
      forceExit: isHaz ? (CHIMNEY_WARN + 0.6) : null,
    };
  });
  // Arm only roof-1 after hazard window — set opens so first roof starts then.
  for (const row of s.targets) {
    if (row.trail === 0) {
      row.open = CHIMNEY_WARN + 0.5;
      row.armed = true;
    }
    if (row.trail === 1 || row.trail === 2) {
      row.open = 999; // unlocked when previous snapped
      row.armed = false;
    }
  }
  s.goal = GOAL;
  s.found = 0;
  s.glowId = null;
  s.rideSecs = rideSecs(2);
  s.hazardWarned = false;
  s.treasure = null;
  attachTreasureHost(s);
}

function armNextRoof(s) {
  if (s.level !== 2) return;
  s.trailStep = (s.trailStep || 0) + 1;
  const next = (s.targets || []).find(o => o.trail === s.trailStep && !o.snapped);
  if (!next) return;
  next.armed = true;
  next.open = s.t; // available immediately
  next.active = true;
  next.climb = 0;
  next.alive = true;
  next.missed = false;
  next.snapped = false;
  s.note = 'Roof clue ' + (s.trailStep + 1) + ' — SNAP in order.';
}


function scheduleCh4(s) {
  // Cloud Crossing: staggered sky finds; clouds teach then leave SNAP gaps.
  // Armed once active — clouds never clear armed or reset climb.
  const rows = ch4Targets();
  s.targets = rows.map((row, i) => ({
    ...row,
    climb: 0,
    alive: true,
    snapped: false,
    missed: false,
    open: CLOUD_TEACH + 0.6 + i * 11.5,
    active: false,
    armed: false,
    teach: false,
  }));
  s.clouds = [
    // Teach cloud: wide, slow, alone across the court
    {id: 'teach', x: 80, y: 480, r: 110, vx: 55, vy: 8, teach: true},
    // Later thinner band with gaps
    {id: 'band-a', x: -40, y: 420, r: 78, vx: 70, vy: -6, teach: false, delay: CLOUD_TEACH + 2},
    {id: 'band-b', x: 980, y: 560, r: 72, vx: -62, vy: 5, teach: false, delay: CLOUD_TEACH + 8},
  ];
  s.goal = GOAL;
  s.found = 0;
  s.glowId = null;
  s.cloudTeachDone = false;
  s.rideSecs = rideSecs(3);
  s.treasure = null;
  attachTreasureHost(s);
}

function cloudOccludes(s, x, y, pad = 0) {
  for (const c of s.clouds || []) {
    if (c.delay != null && s.t < c.delay) continue;
    if (c.teach && s.cloudTeachDone) continue;
    if (Math.hypot(c.x - x, c.y - y) <= c.r + pad) return c;
  }
  return null;
}

function updateClouds(s, dt) {
  for (const c of s.clouds || []) {
    if (c.delay != null && s.t < c.delay) continue;
    if (c.teach && s.t >= CLOUD_TEACH) {
      s.cloudTeachDone = true;
      continue;
    }
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    // Wrap horizontally so bands keep crossing with clear gaps.
    if (c.x > W + c.r + 40) c.x = -c.r - 40;
    if (c.x < -c.r - 40) c.x = W + c.r + 40;
    c.y = clamp(c.y, 280, 720);
  }
}

function drawClouds(d, s) {
  for (const c of s.clouds || []) {
    if (c.delay != null && s.t < c.delay) continue;
    if (c.teach && s.cloudTeachDone) continue;
    const r = c.r;
    // Soft paper clouds — 6-digit glow only.
    d.glow(c.x, c.y, r + 24, '#e8e0d0');
    d.circle(c.x - r * 0.35, c.y, r * 0.55, '#f4f0e8cc', '#d2a65b55', 1);
    d.circle(c.x + r * 0.25, c.y - r * 0.1, r * 0.62, '#f7f4eecc', '#d2a65b55', 1);
    d.circle(c.x, c.y + r * 0.15, r * 0.5, '#efeae0cc', '#d2a65b44', 1);
  }
}

function scheduleCh5(s) {
  // Ferris at Midnight: ONE practice preview of moon markings, then dim climbs.
  // Unmarked lantern = soft dump (hazard). Marked finds count.
  const rows = ch5Targets();
  s.targets = rows.map((row, i) => {
    const isHaz = row.kind === 'hazard';
    const mi = isHaz ? -1 : rows.slice(0, i + 1).filter(o => o.kind !== 'hazard').length - 1;
    return {
      ...row,
      climb: 0.22, // preview pose
      alive: true,
      snapped: false,
      missed: false,
      open: isHaz ? (PREVIEW_SECS + 5) : (PREVIEW_SECS + 0.6 + Math.max(0, mi) * 12.5),
      active: true, // visible during preview
      armed: false,
      teach: isHaz,
      forceExit: isHaz ? (PREVIEW_SECS + 11) : null,
    };
  });
  s.goal = GOAL;
  s.found = 0;
  s.glowId = null;
  s.previewDone = false;
  s.previewUntil = PREVIEW_SECS;
  s.rideSecs = rideSecs(4);
  s.treasure = null;
  attachTreasureHost(s);
  s.note = 'Moon markings — remember them.';
}

function endMidnightPreview(s) {
  if (s.previewDone) return;
  s.previewDone = true;
  for (const t of s.targets || []) {
    t.climb = 0;
    t.active = false;
    t.armed = false;
    // re-open after preview using stored open times
  }
  s.note = TEACH_CH5;
  logAction(s, 'preview-done', {chapter: 5});
}

function scheduleCh6(s) {
  // Highest View: balloon teach alone, then finds on ≤2 depth rings.
  const rows = ch6Targets();
  s.targets = rows.map((row, i) => {
    const isHaz = row.kind === 'hazard';
    const fi = isHaz ? -1 : rows.slice(0, i + 1).filter(o => o.kind !== 'hazard').length - 1;
    return {
      ...row,
      depth: row.depth === 1 ? 1 : 0, // hard-cap ≤2 depths
      climb: 0,
      alive: true,
      snapped: false,
      missed: false,
      open: isHaz ? 0.4 : (BALLOON_WARN + 0.7 + Math.max(0, fi) * 11),
      active: false,
      teach: isHaz,
      forceExit: isHaz ? (BALLOON_WARN + 0.8) : null,
    };
  });
  s.goal = GOAL;
  s.found = 0;
  s.glowId = null;
  s.hazardWarned = false;
  s.rideSecs = rideSecs(5);
  s.treasure = null;
  attachTreasureHost(s);
}

function drawDepthRings(d, s) {
  // Two Tempest-ish depth rings only (never more).
  const spin = s.angle || 0;
  for (const ring of [1.0, 0.72]) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const a = spin * 0.2 + (i / 24) * Math.PI * 2;
      pts.push([
        CX + Math.cos(a) * WHEEL_R * ring,
        CY + Math.sin(a) * WHEEL_R * 0.72 * ring,
      ]);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      d.line({x: pts[i][0], y: pts[i][1]}, {x: pts[i + 1][0], y: pts[i + 1][1]}, '#d2a65b44', 2);
    }
  }
}
function scheduleRide(s) {
  if (s.level === 1) scheduleCh2(s);
  else if (s.level === 2) scheduleCh3(s);
  else if (s.level === 3) scheduleCh4(s);
  else if (s.level === 4) scheduleCh5(s);
  else if (s.level === 5) scheduleCh6(s);
  else scheduleCh1(s);
}

function attachTreasureHost(s) {
  if (!(s.eligible && s.spawnId)) return;
  const host = (s.targets || []).find(o => o.id === s.spawnId && o.kind !== 'hazard')
    || (s.targets || []).find(o => o.kind !== 'hazard')
    || (s.targets || [])[0];
  if (!host) return;
  s.treasure = {id: s.treasureId, spot: host.id, taken: false};
}

function maybeAttachTreasure(s) {
  if (!s.eligible || s.treasure || !s.spawnId) return;
  attachTreasureHost(s);
}

function spawnSparks(s, x, y, n = 10) {
  s.sparks = s.sparks || [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + (s.t || 0);
    s.sparks.push({
      x, y,
      vx: Math.cos(a) * (50 + (i % 3) * 16),
      vy: Math.sin(a) * (50 + (i % 3) * 16) - 24,
      life: COLLECT_FLASH,
      r: 3 + (i % 3),
    });
  }
}

function snapTarget(s, target) {
  if (!target || !target.alive || target.snapped) return false;
  target.snapped = true;
  target.alive = false;
  s.flash = COLLECT_FLASH;
  s.flashX = target.x;
  s.flashY = target.y;

  // Soft fail hazard (Ch2 luggage) — never aborts the ride, never counts.
  if (target.kind === 'hazard') {
    s.didSnapOnce = true;
    spawnSparks(s, target.x, target.y, 6);
    logAction(s, 'soft-fail', {id: target.id, kind: 'hazard'});
    s.note = s.level === 2
      ? 'Chimney soft-dump — roofs only. Ride continues.'
      : (s.level === 4
        ? 'Unmarked soft-dump — moon marks only. Ride continues.'
        : (s.level === 5
          ? 'Balloon soft-dump — true finds only. Ride continues.'
          : 'Luggage soft-dump — emblems only. Ride continues.'));
    if (s.glowId === target.id) s.glowId = null;
    return true;
  }

  // Ch3: only the armed roof clue counts; unarmed = soft dump (wrong order).
  if (s.level === 2 && target.trail != null && !target.armed) {
    s.didSnapOnce = true;
    spawnSparks(s, target.x, target.y, 6);
    // Respawn unarmed clue softly — does not consume the trail step.
    target.snapped = false;
    target.alive = true;
    target.climb = Math.min(0.35, target.climb);
    logAction(s, 'soft-fail', {id: target.id, kind: 'order'});
    s.note = 'Wrong roof — follow the trail order.';
    return true;
  }

  s.found += 1;
  s.didSnapOnce = true;
  const art = target.art || ORDINARY[(s.found - 1) % ORDINARY.length];
  recordFind(s, art, RIDE);
  logAction(s, 'collect', {id: target.id, kind: 'ordinary', verb: 'snap'});
  spawnSparks(s, target.x, target.y, 12);

  if (s.treasure && !s.treasure.taken && s.treasure.spot === target.id) {
    s.treasure.taken = true;
    s.treasureCollected = true;
    recordTreasure(s, s.treasure.id);
    logAction(s, 'collect', {id: target.id, kind: 'treasure', verb: 'snap'});
    s.note = 'Keepsake snapped — Jasper will stamp the card.';
  } else {
    const teach = s.level === 1 ? TEACH_CH2 : (s.level === 2 ? TEACH_CH3 : (s.level === 3 ? TEACH_CH4 : (s.level === 4 ? TEACH_CH5 : (s.level === 5 ? TEACH_CH6 : TEACH))));
    s.note = s.found >= s.goal
      ? 'Three snaps — the gondola carries you home.'
      : (s.found + ' / ' + s.goal + ' · ' + teach);
  }
  if (s.level === 2 && target.trail != null) armNextRoof(s);
  return true;
}

function missTarget(s, target) {
  if (!target || !target.alive) return;
  // Ch3 armed roof: respawn so a miss cannot lock the trail at 0/3.
  if (s.level === 2 && target.trail != null && target.armed && !target.snapped) {
    target.climb = 0;
    target.alive = true;
    target.missed = false;
    target.active = true;
    target.open = s.t;
    logAction(s, 'miss-retry', {id: target.id, kind: 'trail'});
    if (s.glowId === target.id) s.glowId = null;
    s.note = 'Roof clue ' + (target.trail + 1) + ' came back — SNAP it.';
    return;
  }
  // Ch5 marked find: respawn so misses cannot lock the ride under 3/3.
  if (s.level === 4 && target.marked && target.kind !== 'hazard' && !target.snapped) {
    target.climb = 0;
    target.alive = true;
    target.missed = false;
    target.active = true;
    target.open = s.t;
    logAction(s, 'miss-retry', {id: target.id, kind: 'midnight'});
    if (s.glowId === target.id) s.glowId = null;
    s.note = 'Mark came back — SNAP the moon marking.';
    return;
  }
  // Ch6 true find: respawn so depth misses cannot lock under 3/3.
  if (s.level === 5 && target.kind !== 'hazard' && !target.snapped) {
    target.climb = 0;
    target.alive = true;
    target.missed = false;
    target.active = true;
    target.open = s.t;
    logAction(s, 'miss-retry', {id: target.id, kind: 'highest'});
    if (s.glowId === target.id) s.glowId = null;
    s.note = 'Find came back on the ring — SNAP it.';
    return;
  }
  target.alive = false;
  target.missed = true;
  logAction(s, 'miss', {id: target.id, kind: target.kind || 'ordinary'});
  if (s.glowId === target.id) s.glowId = null;
  if (target.kind === 'hazard') {
    s.note = s.level === 2
      ? 'Chimney passed — SNAP roof clue 1 next.'
      : (s.level === 4
        ? 'Unmarked passed — SNAP the moon markings.'
        : (s.level === 5
          ? 'Balloon passed — SNAP the depth-ring finds.'
          : 'Luggage passed — now SNAP the cabin emblems.'));
    s.hazardWarned = true;
  } else {
    s.note = 'It reached the gondola — watch the next spoke.';
  }
}

function drawSoftOutsideLens(d, lx, ly) {
  const c = d.c;
  if (!c) return;
  c.save();
  c.beginPath();
  c.rect(0, 0, W, H);
  c.arc(lx, ly, LENS_R + 2, 0, Math.PI * 2, true);
  c.clip('evenodd');
  c.fillStyle = 'rgba(18, 14, 22, 0.26)';
  c.fillRect(0, 0, W, H);
  c.restore();
}

function drawGondolaHub(d, s) {
  // Light paper cabin at the hub — court PNG stays full-bleed behind.
  const sway = Math.sin((s.angle || 0) * 2) * (s.reduced ? 2 : 5);
  d.glow(HUB_X + sway, HUB_Y + 20, 110, '#4a1824');
  d.poly([
    [HUB_X - 112 + sway, HUB_Y - 40],
    [HUB_X + 112 + sway, HUB_Y - 40],
    [HUB_X + 102 + sway, HUB_Y + 108],
    [HUB_X - 102 + sway, HUB_Y + 108],
  ], '#3a1018c8', '#d2a65b', 4);
  d.circle(HUB_X - 22 + sway, HUB_Y + 14, 28, '#6b2030bb', '#f4d590', 2);
  d.circle(HUB_X + 22 + sway, HUB_Y + 14, 28, '#6b2030bb', '#f4d590', 2);
  d.poly([
    [HUB_X - 48 + sway, HUB_Y + 24],
    [HUB_X + sway, HUB_Y + 78],
    [HUB_X + 48 + sway, HUB_Y + 24],
  ], '#6b2030bb', '#f4d590', 2);
  d.text('you', HUB_X + sway, HUB_Y + 100, 15, '#f0d09a');
}

function drawSpokeGuides(d, s) {
  // Faint Tempest-ish spoke lines — light ink, never covers the court.
  const spin = s.angle || 0;
  for (let i = 0; i < 8; i++) {
    const a = spin + (i / 8) * Math.PI * 2;
    const rimX = CX + Math.cos(a) * WHEEL_R;
    const rimY = CY + Math.sin(a) * WHEEL_R * 0.72;
    d.line({x: HUB_X, y: HUB_Y}, {x: rimX, y: rimY}, '#d2a65b33', 2);
  }
}

function drawTarget(d, s, t) {
  if (!t.alive && !t.snapped) return;
  if (t.snapped) return;
  if (s.level === 2 && t.trail != null && !t.armed) return;
  const inSweet = s.glowId === t.id;
  const preview = s.level === 4 && !s.previewDone;
  const r = t.size * (1 - 0.25 * t.climb) * ((t.depth || 0) >= 1 ? 0.88 : 1);
  const isHaz = t.kind === 'hazard';
  // Ch5: dim moonlight until lens (or during the one preview).
  const moonLit = preview || inSweet || s.level !== 4;
  if (s.level === 4 && !moonLit) {
    d.glow(t.x, t.y, r + 12, isHaz ? '#705050' : '#7a8498');
    d.circle(t.x, t.y, r * 0.6, isHaz ? '#4a3038aa' : '#3a4050aa', isHaz ? '#a0707055' : '#8a90a066', 1);
    // Readable moonlight glyph even when dim (fairness — distinguish marks).
    if (isHaz) d.text('?', t.x, t.y + 8, 20, '#c09090');
    else {
      const g = t.id === 'mark-crescent' ? '☾' : (t.id === 'mark-star' ? '✦' : (t.id === 'mark-ring' ? '◦' : '•'));
      d.text(g, t.x, t.y + 8, 20, '#b8c4d8');
    }
    return;
  }
  d.glow(t.x, t.y, r + (inSweet ? 36 : 18), isHaz ? '#c07070' : (inSweet || preview ? '#c8d8ff' : '#e8d0a0'));
  // Paper silhouettes — readable gallery targets (6-digit glow only).
  if (t.id === 'balloon') {
    d.circle(t.x, t.y - r * 0.15, r * 0.7, inSweet ? '#f0a0a0ee' : '#a05060cc', '#d2a65b', 2);
    d.line({x: t.x, y: t.y + r * 0.45}, {x: t.x, y: t.y + r * 0.95}, '#d2a65b', 2);
    if (inSweet) d.text('×', t.x, t.y + 6, 18, '#ffe6a4');
  } else if (t.id === 'roof') {
    d.poly([
      [t.x - r, t.y],
      [t.x, t.y - r * 0.9],
      [t.x + r, t.y],
      [t.x + r * 0.7, t.y + r * 0.55],
      [t.x - r * 0.7, t.y + r * 0.55],
    ], inSweet ? '#f4d590ee' : '#c9a04acc', '#d2a65b', 2);
  } else if (t.id === 'gondola' || t.id === 'emblem-heart') {
    d.circle(t.x - r * 0.28, t.y - r * 0.1, r * 0.42, inSweet ? '#f4d590ee' : '#6b2030cc', '#d2a65b', 2);
    d.circle(t.x + r * 0.28, t.y - r * 0.1, r * 0.42, inSweet ? '#f4d590ee' : '#6b2030cc', '#d2a65b', 2);
    d.poly([
      [t.x - r * 0.7, t.y],
      [t.x, t.y + r * 0.75],
      [t.x + r * 0.7, t.y],
    ], inSweet ? '#f4d590ee' : '#6b2030cc', '#d2a65b', 2);
  } else if (t.id === 'horizon' || t.id === 'emblem-moon') {
    d.circle(t.x, t.y, r * 0.55, inSweet ? '#f4d590ee' : '#d2a65bcc', '#d2a65b', 2);
    d.circle(t.x + r * 0.22, t.y - r * 0.1, r * 0.42, '#3a1018aa', '#d2a65b', 1);
  } else if (t.id === 'emblem-star' || t.id === 'framework') {
    d.poly([
      [t.x, t.y - r],
      [t.x + r * 0.55, t.y + r * 0.2],
      [t.x, t.y + r * 0.55],
      [t.x - r * 0.55, t.y + r * 0.2],
    ], inSweet ? '#f4d590ee' : '#e8d0a0bb', '#d2a65b', 2);
  } else if (t.id === 'emblem-key') {
    d.circle(t.x, t.y - r * 0.25, r * 0.35, inSweet ? '#f4d590ee' : '#c9a04acc', '#d2a65b', 2);
    d.poly([
      [t.x - r * 0.12, t.y],
      [t.x + r * 0.12, t.y],
      [t.x + r * 0.12, t.y + r * 0.7],
      [t.x - r * 0.12, t.y + r * 0.7],
    ], inSweet ? '#f4d590ee' : '#c9a04acc', '#d2a65b', 2);
  } else if (isHaz && t.id === 'chimney') {
    d.poly([
      [t.x - r * 0.35, t.y - r * 0.9],
      [t.x + r * 0.35, t.y - r * 0.9],
      [t.x + r * 0.45, t.y + r * 0.6],
      [t.x - r * 0.45, t.y + r * 0.6],
    ], inSweet ? '#a05050dd' : '#5a4030cc', '#d2a65b', 2);
    d.poly([
      [t.x - r * 0.55, t.y - r * 0.95],
      [t.x + r * 0.55, t.y - r * 0.95],
      [t.x + r * 0.35, t.y - r * 0.55],
      [t.x - r * 0.35, t.y - r * 0.55],
    ], inSweet ? '#c07070dd' : '#6b5040cc', '#d2a65b', 2);
  } else if (isHaz) {
    // Luggage trunk — teach hazard (skip / soft dump).
    d.poly([
      [t.x - r * 0.85, t.y - r * 0.45],
      [t.x + r * 0.85, t.y - r * 0.45],
      [t.x + r * 0.85, t.y + r * 0.55],
      [t.x - r * 0.85, t.y + r * 0.55],
    ], inSweet ? '#a05050dd' : '#6b4030cc', '#d2a65b', 2);
    d.line({x: t.x - r * 0.85, y: t.y}, {x: t.x + r * 0.85, y: t.y}, '#d2a65b', 2);
  } else if (t.id && String(t.id).startsWith('roof-')) {
    d.poly([
      [t.x - r, t.y],
      [t.x, t.y - r * 0.95],
      [t.x + r, t.y],
      [t.x + r * 0.75, t.y + r * 0.55],
      [t.x - r * 0.75, t.y + r * 0.55],
    ], inSweet ? '#f4d590ee' : '#c9a04acc', '#d2a65b', 2);
    if (t.armed) d.text(String((t.trail || 0) + 1), t.x, t.y + 6, 18, '#ffe6a4');
  } else {
    // Default peak / mark / sky silhouettes (Ch4–Ch6).
    d.poly([
      [t.x, t.y - r],
      [t.x + r * 0.55, t.y + r * 0.2],
      [t.x, t.y + r * 0.55],
      [t.x - r * 0.55, t.y + r * 0.2],
    ], inSweet ? '#f4d590ee' : '#e8d0a0bb', '#d2a65b', 2);
    if (s.level === 5 && (t.depth || 0) >= 1) d.text('1', t.x, t.y + 6, 14, '#ffe6a4');
    if (s.level === 5 && (t.depth || 0) === 0 && !isHaz) d.text('0', t.x, t.y + 6, 14, '#e8d0a0');
  }
  if (s.level === 4 && t.marked && (preview || inSweet)) {
    const g = t.id === 'mark-crescent' ? '☾' : (t.id === 'mark-star' ? '✦' : (t.id === 'mark-ring' ? '◦' : '•'));
    d.text(g, t.x, t.y + 8, 22, '#e8f0ff');
  }
  if (s.level === 4 && isHaz && (preview || inSweet)) {
    d.text('?', t.x, t.y + 8, 22, '#f0c0c0');
  }
  if (inSweet || t.climb < 0.25 || (isHaz && t.teach) || (t.armed && t.trail != null)) {
    const tag = isHaz
      ? (t.id === 'chimney' ? 'chimney — skip' : (t.id === 'balloon' ? 'balloon — skip' : 'luggage — skip'))
      : t.label;
    d.text(tag, t.x, t.y - r - 16, 14, isHaz ? '#f0a0a0' : (inSweet ? '#ffe6a4' : '#f0d09a'));
  }
  if (s.treasure && s.treasure.spot === t.id && !s.treasure.taken && t.alive) {
    d.item(spriteKey(s.treasure.id), t.x, t.y - r - 36, {
      w: inSweet ? 56 : 32,
      alpha: inSweet ? 1 : 0.55,
      shadow: false,
      fallback: () => d.star(t.x, t.y - r - 36, 12),
    });
  }
}

function drawLens(d, s) {
  const lx = s.lensX;
  const ly = s.lensY;
  const hot = !!s.glowId;
  const pulse = hot ? 1 + 0.04 * Math.sin((s.t || 0) * 12) : 1;
  const rim = LENS_R * pulse;
  d.glow(lx, ly, rim + 30, hot ? '#ffe6a4' : '#d2a65b');
  d.circle(lx, ly, rim, 'rgba(244, 232, 180, 0.08)', '#d2a65b', 8);
  d.circle(lx, ly, rim - 10, null, '#f4d590', 2.4);
  // Sweet glow reticle (size by chapter — Ch1 attested fat, Ch2 slightly tighter)
  const rr = reticleR(s.level || 0);
  d.circle(lx, ly, rr, hot ? 'rgba(255,230,164,0.22)' : 'rgba(244,217,144,0.08)', '#f8e4b3', 2.2);
  d.line({x: lx - 18, y: ly}, {x: lx + 18, y: ly}, '#f4d590', 1.4);
  d.line({x: lx, y: ly - 18}, {x: lx, y: ly + 18}, '#f4d590', 1.4);
  if (hot) {
    d.text('SNAP', lx, ly + rim + 28, 28, '#ffe6a4');
  } else if ((s.t || 0) < CLARITY_SECS || !s.didSnapOnce) {
    d.text('LENS', lx, ly + rim + 26, 20, '#f4d590');
  }
}



function trySnap(s, via) {
  // Glow grace: release a beat after leaving the sweet spot still counts.
  let gid = s && s.glowId;
  if (!gid && s && s.glowGraceId && (s.t || 0) <= (s.glowGraceUntil || 0)) {
    gid = s.glowGraceId;
  }
  if (!s || !gid) return false;
  const target = (s.targets || []).find(o => o.id === gid && o.alive);
  if (!target) return false;
  const ok = snapTarget(s, target);
  if (ok) {
    logAction(s, 'snap-input', {via, id: target.id});
    s.glowGraceId = null;
    s.glowGraceUntil = 0;
  }
  return ok;
}

export default {
  title: 'Pocket Wheel',
  intro: 'Rise above the midway. Look closer. Targets climb the spokes — SNAP them in Jasper’s brass glow before they reach your gondola.',
  instructions: TEACH + ' Drag the lens (above your thumb); release while lit to SNAP. Ch2: emblems only — luggage soft-dumps. Ch3: roofs in order 1→2→3 — chimney soft-dumps. Ch4: wait out clouds, then SNAP. Ch5: moon marks only — unmarked soft-dumps; one preview. Ch6: depth rings — balloons soft-dump. First ride is practice.',
  levels: LEVELS,
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 100,
  create(level, rng) {
    const reduced = prefersReducedMotion();
    return makeRideState(level, rng, {
      lensX: CX,
      lensY: 620,
      found: 0,
      targets: [],
      goal: GOAL,
      angle: -0.35,
      drag: null,
      pointerDown: null,
      moved: false,
      lastLensLog: 0,
      treasureId: TREASURES[Math.max(0, Math.min(level, TREASURES.length - 1))],
      reduced,
      scheduled: false,
      sparks: [],
      flash: 0,
      flashX: CX,
      flashY: CY,
      treasureCollected: false,
      didSnapOnce: false,
      glowId: null,
    });
  },
  update(s, dt) {
    if (s.result || s.broke) return;

    if (ensureBoarded(s, RIDE, s.treasureId, chapterTargets(s.level).filter(o => o.kind !== 'hazard').map(o => o.id))) {
      scheduleRide(s);
      s.scheduled = true;
      s.note = s.level === 1 ? TEACH_CH2 : (s.level === 2 ? TEACH_CH3 : (s.level === 3 ? TEACH_CH4 : (s.level === 4 ? TEACH_CH5 : (s.level === 5 ? TEACH_CH6 : TEACH))));
    }
    if (s.result) return;
    if (!s.scheduled) return;

    maybeAttachTreasure(s);

    s.t += dt;
    const secs = s.rideSecs || rideSecs(s.level);
    s.progress = Math.min(1, s.t / secs);
    const spin = wheelSpin(s.level, s.reduced) * wheelEase(s.progress);
    s.angle += spin * dt;
    const climb = climbSpeed(s.level, s.reduced);

    if (s.level === 3) {
      updateClouds(s, dt);
      if (!s.cloudTeachDone && s.t < CLOUD_TEACH) {
        s.note = 'Cloud crossing the lens — wait for clear sky.';
      } else if (!s.cloudTeachDone && s.t >= CLOUD_TEACH) {
        s.cloudTeachDone = true;
        s.note = TEACH_CH4;
      }
    }

    // Ch5: freeze during moonlight marking preview, then release climbs.
    if (s.level === 4 && !s.previewDone) {
      if (s.t < (s.previewUntil || PREVIEW_SECS)) {
        s.note = 'Moon markings — remember them.';
        for (const t5 of s.targets || []) {
          if (!t5.alive) continue;
          t5.active = true;
          const spoke = t5.spoke + s.angle * 0.15;
          const pos = spokePos(spoke, t5.climb, t5.depth || 0);
          t5.x = pos.x;
          t5.y = pos.y;
        }
        // Skip normal climb this frame — preview only.
        if (s.t >= (s.rideSecs || rideSecs(s.level))) {
          finishRide(s, {
            rideId: RIDE,
            treasureId: s.treasureId,
            challengeOk: s.found >= s.goal,
            completionFind: 'moon-penny',
          });
        }
        if (s.sparks && s.sparks.length) {
          for (const sp of s.sparks) {
            sp.life -= dt;
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.vy += 70 * dt;
          }
          s.sparks = s.sparks.filter(sp => sp.life > 0);
        }
        if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);
        return;
      }
      endMidnightPreview(s);
    }

    // Ch2/Ch3/Ch6 teach: long warn while the single hazard approaches alone.
    if ((s.level === 1 || s.level === 2 || s.level === 5) && !s.hazardWarned) {
      const haz = (s.targets || []).find(o => o.kind === 'hazard' && o.alive);
      const warnUntil = s.level === 2 ? CHIMNEY_WARN : (s.level === 5 ? BALLOON_WARN : LUGGAGE_WARN);
      if (haz && s.t >= haz.open && s.t < warnUntil) {
        s.note = s.level === 2
          ? 'Chimney climbing — do not SNAP it.'
          : (s.level === 5
            ? 'Balloon climbing — do not SNAP it.'
            : 'Luggage climbing — do not SNAP it.');
      }
      if (haz && !haz.alive) s.hazardWarned = true;
      if (!haz || s.t >= warnUntil) s.hazardWarned = true;
    }

    let glow = null;
    for (const t of s.targets) {
      if (!t.alive) continue;
      if (s.level === 2 && t.trail != null && !t.armed) {
        // Waiting for prior roof SNAP — visible but not climbing yet.
        t.active = false;
        continue;
      }
      if (s.t >= t.open) t.active = true;
      if (!t.active) continue;
      const spoke = t.spoke + s.angle * 0.15; // slight field drift
      let pos = spokePos(spoke, t.climb, t.depth || 0);
      t.x = pos.x;
      t.y = pos.y;
      // Ch4: once active, armed stays true forever — clouds never reset it or climb.
      if (s.level === 3) t.armed = true;
      const aiming = inGlow(s.lensX, s.lensY, t.x, t.y, s.level);
      const occluded = s.level === 3 && !!(
        cloudOccludes(s, s.lensX, s.lensY, 36)
        || cloudOccludes(s, t.x, t.y, (t.size || 30) + 8)
      );
      const lit = aiming && !occluded;
      if (s.level === 3 && aiming && occluded && t.armed) {
        s.note = 'Cloud over the glow — wait, then SNAP.';
      }
      // Crawl-while-lit (attested Ch1 feel; keeps SNAP hittable — not a dwell meter).
      // Ch4: crawl only when clear-lit; occluded climb continues at full rate (no reset).
      const rate = lit ? climb * (s.level === 2 ? 0.04 : (s.level === 4 || s.level === 5 ? 0.05 : 0.08)) : climb;
      t.climb = Math.min(1, t.climb + rate * dt);
      pos = spokePos(spoke, t.climb, t.depth || 0);
      t.x = pos.x;
      t.y = pos.y;
      // Ch2: clear luggage after teach window so emblems own the glow.
      if (t.forceExit != null && s.t >= t.forceExit && t.kind === 'hazard' && t.alive) {
        t.climb = Math.min(1, t.climb + climb * 3.2 * dt);
      }
      if (t.climb >= 1) {
        missTarget(s, t);
        continue;
      }
      if (lit || inGlow(s.lensX, s.lensY, t.x, t.y, s.level)) {
        // Prefer real finds over hazards; Ch3 unarmed roofs never take the glow.
        if (s.level === 2 && t.trail != null && !t.armed) {
          /* skip */
        } else if (!glow || (glow.kind === 'hazard' && t.kind !== 'hazard')) {
          glow = t;
        }
      }
    }
    const prev = s.glowId;
    s.glowId = glow ? glow.id : null;
    if (glow) {
      s.glowGraceId = glow.id;
      s.glowGraceUntil = s.t + 0.55;
    }
    if (s.glowId && s.glowId !== prev) {
      logAction(s, 'glow-ready', {id: s.glowId, kind: glow.kind || 'ordinary'});
      if (glow.kind === 'hazard') {
        s.note = s.level === 2
          ? 'Chimney in the glow — skip it!'
          : (s.level === 4
            ? 'Unmarked in the glow — skip it!'
            : (s.level === 5 ? 'Balloon in the glow — skip it!' : 'Luggage in the glow — skip it!'));
      } else s.note = 'In the glow — SNAP!';
    }

    if (s.sparks && s.sparks.length) {
      for (const sp of s.sparks) {
        sp.life -= dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 70 * dt;
      }
      s.sparks = s.sparks.filter(sp => sp.life > 0);
    }
    if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);

    if (s.t >= secs) {
      finishRide(s, {
        rideId: RIDE,
        treasureId: s.treasureId,
        challengeOk: s.found >= s.goal,
        completionFind: 'moon-penny',
      });
    }
  },
  // Fortune-style external SNAP control (runtime wires #actions buttons).
  actions: [{id: 'snap', label: 'SNAP'}],
  action(s, id, pressed) {
    if (s.result || s.broke) return;
    if (!pressed || id !== 'snap') return;
    trySnap(s, 'action');
  },
  pointer(s, type, p) {
    if (s.result || s.broke) return;

    if (type === 'down') {
      s.pointerDown = {x: p.x, y: p.y, t: s.t};
      s.moved = false;
      s.drag = p;
      // Tap on lens glass while already glowing also snaps on down.
      if (s.glowId && inLens(s.lensX, s.lensY, p.x, p.y, 24)) {
        trySnap(s, 'lens-down');
        s.drag = null;
        s.pointerDown = null;
        return;
      }
      const lens = fingerToLens(p);
      s.lensX = lens.x;
      s.lensY = lens.y;
      return;
    }

    if (type === 'move' && s.drag) {
      if (s.pointerDown && Math.hypot(p.x - s.pointerDown.x, p.y - s.pointerDown.y) > 12) {
        s.moved = true;
      }
      s.drag = p;
      const lens = fingerToLens(p);
      s.lensX = lens.x;
      s.lensY = lens.y;
      const now = (s.t || 0) * 1000;
      if (now - (s.lastLensLog || 0) >= LENS_MOVE_LOG_MS) {
        s.lastLensLog = now;
        logAction(s, 'lens-move', {x: Math.round(s.lensX), y: Math.round(s.lensY)});
      }
      return;
    }

    if (type === 'up') {
      const wasDrag = s.drag;
      const moved = s.moved;
      s.drag = null;
      s.pointerDown = null;
      s.moved = false;
      if (!wasDrag) return;

      // HIT REGISTRATION FIX: do not require a short "tap".
      // While a target is in the glow, release / SNAP chrome / lens = SNAP.
      // (Old isTap gate ate every drag-to-aim then release.)
      const litNow = !!(s.glowId || (s.glowGraceId && (s.t || 0) <= (s.glowGraceUntil || 0)));
      if (!litNow) {
        if ((s.t || 0) < CLARITY_SECS) s.note = TEACH;
        return;
      }
      const onLens = inLens(s.lensX, s.lensY, p.x, p.y, 28)
        || inLens(s.lensX, s.lensY, p.x, p.y - LENS_FINGER_Y * 0.4, 32);
      // Release-to-commit while lit or in glow-grace (gallery trigger).
      // Shell #actions SNAP + lens tap + release-while-lit — no on-court chrome.
      if (onLens || true) {
        trySnap(s, onLens ? 'lens-up' : 'release');
      }
      return;
    }

    if (type === 'cancel') {
      s.drag = null;
      s.pointerDown = null;
      s.moved = false;
    }
  },
  draw(s, d) {
    // ferris.png is the unique court — never clear or full-bleed overpaint.
    drawSpokeGuides(d, s);
    if (s.level === 5) drawDepthRings(d, s);
    drawGondolaHub(d, s);

    if (s.level === 3) drawClouds(d, s);

    (s.targets || []).forEach(t => {
      if (t.active && (t.alive || t.snapped)) drawTarget(d, s, t);
    });

    drawSoftOutsideLens(d, s.lensX, s.lensY);
    drawLens(d, s);

    if (s.sparks && s.sparks.length) {
      for (const sp of s.sparks) {
        const a = Math.max(0, sp.life / COLLECT_FLASH);
        d.circle(sp.x, sp.y, sp.r * (0.5 + 0.5 * a), '#ffe6a4', '#d2a65b', 1);
      }
    }
    if (s.flash > 0) {
      const k = s.flash / COLLECT_FLASH;
      d.glow(s.flashX || CX, s.flashY || CY, 28 + 70 * k, '#ffe6a4');
    }

  },
  readout: s => s.note || TEACH,
};
