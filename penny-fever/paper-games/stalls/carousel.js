/**
 * Amusement 1 — Florence — Carousel Waltz (Ride & Seek)
 * Tagline: Round and round, the secrets change.
 *
 * SHIPPED: Chapter 1 First Turn + Chapter 2 Painted Ponies — TAP-on-crest remix.
 *   Board one mount fixed center-front (Tempest rim lane). Orbiting horses
 *   carry crest platforms; glints rotate past like Mario platforms on a circle.
 *   ONE verb: TAP on the crest window (“almost… NOW”) — never free-look hunting.
 *   Practice lap teaches crest TAP (no keepsakes), then two searchable laps.
 *   Challenge: ~3 ordinary finds. Eligible treasure ≥2.5 s crest window; tap
 *   collects; ride never pauses. Paper 1-layer 2D.
 *   Burgundy/gold paper-cut horses; ripples on collect; reduced-motion slower
 *   spin, same crest windows.
 *
 *   Ch1 First Turn — no false items; any crest glint is the collect target.
 *   Ch2 Painted Ponies — same crest TAP. Only the heart-marked pony is valid.
 *   Fairness retune after Aura FAIL 1/3: slower spin, wider crest, denser heart windows.
 *     Teach alone: long warn before the first marked window (no decoys yet).
 *     Later crest passes may show decoy marks (crescent/star); TAP decoy =
 *     soft fail (note + logAction miss), ride continues, never abort.
 *     ~52 s searchable-friendly timing; GOAL=3 reachable on competent first play.
 *
 * UNFINISHED CHAPTERS (file-top note — do not rename treasures/levels):
 *   3 Mirror Round — one learnable reflection rule; false reflections cannot be collected
 *   4 Carriage Windows — door/window opens twice (teach pass, then collect pass)
 *   5 Midnight Canopy — vertical look for canopy treasures; then speed may rise
 *   6 The Grand Waltz — combine only taught rules; guarantee one repeat of the eligible window
 */
import {TAU, clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure,
  logAction, drawHud, prefersReducedMotion,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'carousel';
const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
const TREASURES = [
  'music-carousel', 'organ-music-box', 'pocket-wheel',
  'laughing-doorway', 'ride-explorer-pennant', 'ride-ticket',
];
const LEVELS = [
  'First Turn', 'Painted Ponies', 'Mirror Round',
  'Carriage Windows', 'Midnight Canopy', 'The Grand Waltz',
];

const W = 900;
const H = 1200;
const CX = 450;
const CY = 640;
const GOAL = 3;
const HIT_R = 72;
const HORSE_N = 6;
const COLLECT_FLASH = 0.55;
const TEACH = 'TAP on the crest';
const TEACH_MARKED = 'TAP the heart-marked pony';
const VERB_SEC = 5;
/** Ch2 long warn before first searchable marked window (helter cushion teach). */
const CH2_MARK_WARN = 8.0;
const CH2_TEACH_CHROME = 5.5;
/** Tiny cosmetic sway only — NOT a named LOOK skill. */
const SWAY_X = 10;
const SWAY_Y = 6;
const DRAG_PX = 18;

/**
 * Addressable crest carriers — sealed spawnIds for treasure eligibility.
 * horse index orbits; crest = when that horse enters the front sweet-spot.
 */
const SPOTS = [
  {id: 'saddle', label: 'saddle flap', horse: 1, ox: -12, oy: -28},
  {id: 'mane', label: 'painted mane', horse: 2, ox: 18, oy: -36},
  {id: 'panel', label: 'painted panel', horse: 3, ox: -6, oy: -22},
  {id: 'bridle', label: 'bridle heart', horse: 4, ox: 14, oy: -30},
  {id: 'pole', label: 'centre pole base', horse: 5, ox: 0, oy: -18},
  {id: 'canopy', label: 'canopy fringe', horse: 1, ox: 0, oy: -48},
];

function ch1Speed(reduced) {
  // Slow waltz. Reduced-motion keeps the same crest windows, only slows spin.
  const base = 0.38;
  return reduced ? base * 0.72 : base;
}

function ch2Speed(reduced) {
  // Fairness retune (Aura FAIL 1/3): slower waltz → ~58 s / 3 laps, more crest chances.
  const base = 0.32;
  return reduced ? base * 0.72 : base;
}

function rideSpeed(s) {
  return (s.level === 1) ? ch2Speed(s.reduced) : ch1Speed(s.reduced);
}

function lapSeconds(speed) {
  return TAU / Math.max(0.12, speed);
}

/** Half-angle of crest sweet-spot so duration ≈ targetSec at current speed. */
function crestHalfFromSec(speed, targetSec) {
  return (Math.max(2.5, targetSec) * speed) / 2;
}

function wrapPi(a) {
  let x = a % TAU;
  if (x > Math.PI) x -= TAU;
  if (x < -Math.PI) x += TAU;
  return x;
}

function horsePoint(i, n, angle, cx, cy, rx, ry) {
  const a = angle + (i * TAU) / n;
  return {
    x: cx + Math.sin(a) * rx,
    y: cy + Math.cos(a) * ry * 0.42,
    a,
    scale: 0.72 + Math.cos(a) * 0.28,
    front: Math.cos(a) > 0.15,
  };
}

/** Front crest: horse angle near 0 (cos max / scale max / screen-bottom lane). */
function crestOffset(horseIdx, angle) {
  const a = angle + (horseIdx * TAU) / HORSE_N;
  return wrapPi(a);
}

function inCrest(horseIdx, angle, half) {
  return Math.abs(crestOffset(horseIdx, angle)) <= half;
}

function crestNorm(horseIdx, angle, half) {
  const off = Math.abs(crestOffset(horseIdx, angle));
  if (off > half) return 0;
  return 1 - off / Math.max(0.001, half);
}

function scheduleCh1(s) {
  const speed = ch1Speed(s.reduced);
  const lap = lapSeconds(speed);
  // Wide Ch1 crest: ~3.2 s ordinary, ≥2.5 s treasure (same half-angle for all).
  const crestHalf = crestHalfFromSec(speed, 3.2);
  s.crestHalf = crestHalf;
  s.crestSec = (2 * crestHalf) / speed;

  // Lap 0 = practice / feel crest TAP. Laps 1–2 = searchable.
  // Practice glint: horse 5 hits crest ~2.8s — rises into NOW during first-5s teach chrome.
  const practiceHorse = 5;
  const practiceCrestT = (TAU - (practiceHorse * TAU) / HORSE_N) / speed;
  const practiceFrom = Math.max(0.2, practiceCrestT - crestHalf / speed);
  const practiceUntil = practiceCrestT + crestHalf / speed;

  s.practiceGlint = {
    kind: 'practice',
    id: 'practice-crest',
    spot: 'pole',
    horse: practiceHorse,
    from: practiceFrom,
    until: practiceUntil,
    taken: false,
  };

  // Three ordinary windows across searchable laps, each full crest pass ≥ ~2.8 s.
  // Schedule so the carrier horse is in crest during [from, until].
  function crestPass(horse, lapFrac) {
    // Target crest-center time near lapFrac * lap (absolute t).
    const targetT = lap * lapFrac;
    // Nearest crest time for this horse: t_k = (k*TAU - horse*TAU/N) / speed
    const phase = (horse * TAU) / HORSE_N;
    const period = lap; // one full rotation
    let k = Math.round((targetT * speed + phase) / TAU);
    if (k < 1) k = 1;
    let crestT = (k * TAU - phase) / speed;
    // Keep on searchable laps (after lap 1 start)
    if (crestT < lap * 1.02) {
      k += 1;
      crestT = (k * TAU - phase) / speed;
    }
    if (crestT > lap * 2.92) {
      crestT = Math.min(crestT, lap * 2.85);
    }
    const halfT = crestHalf / speed;
    return {crestT, from: crestT - halfT, until: crestT + halfT, horse};
  }

  const p0 = crestPass(1, 1.15);
  const p1 = crestPass(2, 1.55);
  const p2 = crestPass(4, 2.15);
  const p3 = crestPass(3, 2.55); // recovery ordinary

  const finds = [
    {kind: 'ordinary', id: ORDINARY[0], spot: 'saddle', horse: p0.horse, from: p0.from, until: p0.until, taken: false},
    {kind: 'ordinary', id: ORDINARY[1], spot: 'mane', horse: p1.horse, from: p1.from, until: p1.until, taken: false},
    {kind: 'ordinary', id: ORDINARY[2], spot: 'bridle', horse: p2.horse, from: p2.from, until: p2.until, taken: false},
    {kind: 'ordinary', id: ORDINARY[0], spot: 'panel', horse: p3.horse, from: p3.from, until: p3.until, taken: false},
  ];
  s.finds = finds;
  s.goal = GOAL;
  s.found = 0;
  s.lapsTotal = 3;
  s.lapSec = lap;
  s.rideEnd = lap * 3;
  s.ripples = [];
  s.sparks = [];
  s.flash = 0;
  s.decoys = []; // none in ch1
  s.horseMarks = null;
  s.ch2Taught = false;
  s.firstMarked = null;
  s.treasure = null;

  if (s.eligible && s.spawnId) {
    const spot = SPOTS.find((row) => row.id === s.spawnId) || SPOTS[0];
    const horse = spot.horse;
    // Treasure crest ≥2.5 s on a pass that clears ordinary collisions.
    const tp = crestPass(horse, 1.9);
    const halfT = Math.max(2.5 / 2, crestHalf / speed);
    // Nudge off any ordinary that shares the same crest center (±0.4s).
    let crestT = tp.crestT;
    for (const f of finds) {
      if (f.horse !== horse) continue;
      const mid = (f.from + f.until) / 2;
      if (Math.abs(mid - crestT) < 0.5) crestT += lap * 0.35;
    }
    if (crestT + halfT > lap * 2.95) crestT = lap * 2.95 - halfT;
    if (crestT - halfT < lap * 1.05) crestT = lap * 1.05 + halfT;
    s.treasure = {
      id: s.treasureId,
      spot: spot.id,
      horse,
      from: crestT - halfT,
      until: crestT + halfT,
      taken: false,
    };
  }
}

/**
 * Ch2 Painted Ponies — same crest TAP as Ch1.
 * Hazard: only heart-marked pony finds collect. Decoy crest glints (crescent/star)
 * soft-fail on TAP. First marked window teaches alone; decoys unlock after first
 * successful marked collect. ~52 s ride; GOAL=3 + recovery.
 */
function scheduleCh2(s) {
  const speed = ch2Speed(s.reduced);
  const lap = lapSeconds(speed);
  // Wider crest (~4.0 s) so competent first play can hit 3/3 (Aura FAIL was 1/3).
  const crestHalf = crestHalfFromSec(speed, 4.0);
  s.crestHalf = crestHalf;
  s.crestSec = (2 * crestHalf) / speed;
  s.ch2Taught = false;
  s.markedMark = 'heart';
  s.hitPad = HIT_R * 1.2; // slightly more forgiving crest taps on Ch2

  // Persistent saddle marks: heart = valid; crescent/star = decoy ponies.
  s.horseMarks = {
    1: 'heart',
    2: 'heart',
    3: 'crescent',
    4: 'heart',
    5: 'star',
  };

  // Practice glint — crest TAP only (no keepsakes / no mark hazard).
  const practiceHorse = 2; // heart-marked so early eye training matches Ch2 rule
  const practiceCrestT = (TAU - (practiceHorse * TAU) / HORSE_N) / speed;
  const practiceFrom = Math.max(0.2, practiceCrestT - crestHalf / speed);
  const practiceUntil = practiceCrestT + crestHalf / speed;
  s.practiceGlint = {
    kind: 'practice',
    id: 'practice-crest',
    spot: 'saddle',
    horse: practiceHorse,
    from: practiceFrom,
    until: practiceUntil,
    taken: false,
  };

  // BUGFIX: next crest after minT (not nearest). Pick soonest heart-horse each time.
  function nextCrestAfter(horse, minT) {
    const phase = (horse * TAU) / HORSE_N;
    const halfT = crestHalf / speed;
    // Require the full window to start at/after minT (no overlap with prior finds).
    let k = Math.ceil(((minT + halfT) * speed + phase) / TAU - 1e-9);
    if (k < 1) k = 1;
    const crestT = (k * TAU - phase) / speed;
    if (crestT + halfT > lap * 2.98) return null;
    return {crestT, from: crestT - halfT, until: crestT + halfT, horse, halfT};
  }

  function soonestHeart(minT) {
    let best = null;
    for (const h of [1, 2, 4]) {
      const p = nextCrestAfter(h, minT);
      if (p && (!best || p.crestT < best.crestT)) best = p;
    }
    return best;
  }

  // Dense unique heart windows from late practice through end — enough for 3/3.
  const spots = ['saddle', 'mane', 'bridle', 'panel', 'saddle', 'mane', 'bridle', 'panel'];
  const slots = [];
  let minT = lap * 0.55; // allow finds during late practice lap
  for (let i = 0; i < 8; i++) {
    const p = soonestHeart(minT);
    if (!p) break;
    slots.push(p);
    minT = p.until + 0.55; // small clear gap; still many passes
  }
  const finds = slots.map((p, i) => ({
    kind: 'ordinary',
    id: ORDINARY[i % ORDINARY.length],
    spot: spots[i % spots.length],
    horse: p.horse,
    mark: 'heart',
    from: p.from,
    until: p.until,
    taken: false,
    teach: i === 0,
  }));
  s.finds = finds;
  s.goal = GOAL;
  s.found = 0;
  s.lapsTotal = 3;
  s.lapSec = lap;
  s.rideEnd = lap * 3; // ~58 s at ch2Speed 0.32
  s.ripples = [];
  s.sparks = [];
  s.flash = 0;
  s.firstMarked = finds[0];

  // Decoys only AFTER teach — attach to later windows (index >= 2), soft fail only.
  const halfT = crestHalf / speed;
  function decoyNear(horse, nearFind, mark, spotId) {
    const crestT = (nearFind.from + nearFind.until) / 2;
    const phase = (horse * TAU) / HORSE_N;
    let k = Math.round((crestT * speed + phase) / TAU);
    if (k < 1) k = 1;
    let dt = (k * TAU - phase) / speed;
    if (Math.abs(dt - crestT) > halfT * 1.2) {
      k += (dt < crestT) ? 1 : -1;
      if (k < 1) k = 1;
      dt = (k * TAU - phase) / speed;
    }
    return {
      kind: 'decoy',
      id: 'decoy-' + mark,
      spot: spotId,
      horse,
      mark,
      from: dt - halfT,
      until: dt + halfT,
      taken: false,
      afterTeach: true,
    };
  }

  // Decoys only against later finds that exist (never index past finds.length).
  s.decoys = [];
  const decoyPlan = [
    [3, 2, 'crescent', 'panel'],
    [5, 2, 'star', 'pole'],
    [3, 3, 'crescent', 'bridle'],
    [5, 3, 'star', 'canopy'],
    [3, 4, 'crescent', 'saddle'],
  ];
  for (const [horse, fi, mark, spotId] of decoyPlan) {
    if (fi < finds.length) s.decoys.push(decoyNear(horse, finds[fi], mark, spotId));
  }

  s.treasure = null;
  if (s.eligible && s.spawnId) {
    const spot = SPOTS.find((row) => row.id === s.spawnId) || SPOTS[0];
    const horse = spot.horse;
    const treasureHorse = (s.horseMarks[horse] === 'heart') ? horse : 2;
    const tp = crestPass(treasureHorse, 1.95);
    const tHalf = Math.max(2.5 / 2, crestHalf / speed);
    let crestT = tp.crestT;
    for (const f of finds) {
      if (f.horse !== treasureHorse) continue;
      const mid = (f.from + f.until) / 2;
      if (Math.abs(mid - crestT) < 0.55) crestT += lap * 0.28;
    }
    if (crestT + tHalf > lap * 2.95) crestT = lap * 2.95 - tHalf;
    if (crestT - tHalf < lap * 0.9) crestT = lap * 0.9 + tHalf;
    s.treasure = {
      id: s.treasureId,
      spot: spot.id,
      horse: treasureHorse,
      mark: 'heart',
      from: crestT - tHalf,
      until: crestT + tHalf,
      taken: false,
    };
  }
}

function scheduleForLevel(s) {
  // 0 → Ch1; 1 → Ch2; unfinished 2–5 stub as Ch1 until authored.
  if (s.level === 1) scheduleCh2(s);
  else scheduleCh1(s);
}

/** Resolve a hotspot to screen coords — no free-look offset on targeting. */
function spotScreen(spotId, s, horseOverride) {
  const spot = SPOTS.find((row) => row.id === spotId);
  if (!spot) return null;
  const swayX = s.swayX || 0;
  const swayY = s.swayY || 0;
  const cx = CX + swayX;
  const cy = CY + swayY;
  const horse = horseOverride != null ? horseOverride : spot.horse;
  const h = horsePoint(horse, HORSE_N, s.angle, cx, cy + 40, 250, 220);
  const bob = Math.sin(s.angle * 2 + horse) * (s.reduced ? 3 : 8);
  // Crest height curve: lift glint as it enters front (Mario jump arc feel).
  const n = crestNorm(horse, s.angle, s.crestHalf || 0.6);
  const crestLift = -18 * n;
  return {
    x: h.x + (spot.ox || 0) * h.scale,
    y: h.y + bob + (spot.oy || 0) * h.scale + crestLift,
    reachable: inCrest(horse, s.angle, s.crestHalf || 0.6),
    scale: h.scale,
    crest: n,
    horse,
  };
}

function itemActive(item, t) {
  return item && !item.taken && t >= item.from && t <= item.until;
}

/** Collectable only while carrier is inside the crest sweet-spot. */
function itemInCrestWindow(item, s) {
  if (!itemActive(item, s.t)) return false;
  const horse = item.horse != null ? item.horse : (SPOTS.find((r) => r.id === item.spot) || {}).horse;
  if (horse == null) return false;
  return inCrest(horse, s.angle, s.crestHalf || 0.6);
}

function hitItem(scr, p, pad = HIT_R) {
  if (!scr) return false;
  return Math.hypot(p.x - scr.x, p.y - scr.y) < pad * Math.max(0.85, scr.scale || 1);
}

function addRipple(s, x, y) {
  s.ripples.push({x, y, t: 0, life: 1.1});
}

function spawnSparks(s, x, y, n = 10) {
  s.sparks = s.sparks || [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + (s.t || 0);
    s.sparks.push({
      x, y,
      vx: Math.cos(a) * (36 + (i % 3) * 16),
      vy: Math.sin(a) * (36 + (i % 3) * 16) - 18,
      life: COLLECT_FLASH,
      r: 2.5 + (i % 3),
    });
  }
}

function collectOrdinary(s, find, scr) {
  if (!find || find.taken) return false;
  find.taken = true;
  s.found += 1;
  recordFind(s, find.id, RIDE);
  logAction(s, 'collect', {id: find.spot, kind: 'ordinary', art: find.id, mark: find.mark || null});
  if (s.level === 1 && find.mark === 'heart') {
    if (!s.ch2Taught) {
      s.ch2Taught = true;
      logAction(s, 'teach', {kind: 'marked-pony'});
    }
  }
  if (scr) {
    addRipple(s, scr.x, scr.y);
    spawnSparks(s, scr.x, scr.y, 12);
    s.flash = COLLECT_FLASH;
    s.flashX = scr.x;
    s.flashY = scr.y;
  }
  s.note = s.found >= s.goal
    ? 'Three finds — ride the horse home.'
    : (s.level === 1
      ? (s.found + ' of ' + s.goal + ' — heart-marked ponies.')
      : (s.found + ' of ' + s.goal + ' ordinary finds.'));
  s.statusKind = 'found';
  return true;
}

function decoysLive(s) {
  // Soft-hazard decoys only after the teach-alone marked collect.
  return s.level === 1 && !!s.ch2Taught;
}

function softFailDecoy(s, decoy, scr) {
  logAction(s, 'miss', {
    reason: 'decoy',
    mark: decoy.mark || 'wrong',
    horse: decoy.horse,
    x: scr ? Math.round(scr.x) : 0,
    y: scr ? Math.round(scr.y) : 0,
  });
  s.note = 'Wrong mark — ' + TEACH_MARKED + '. Ride continues.';
  s.statusKind = 'miss';
  s.decoyFlash = 0.55;
  s.decoyFlashX = scr ? scr.x : CX;
  s.decoyFlashY = scr ? scr.y : CY;
  return 'miss';
}

function collectTreasure(s, scr) {
  const tr = s.treasure;
  if (!tr || tr.taken) return false;
  tr.taken = true;
  recordTreasure(s, tr.id);
  logAction(s, 'collect', {id: tr.spot, kind: 'treasure', art: tr.id});
  if (scr) {
    addRipple(s, scr.x, scr.y);
    spawnSparks(s, scr.x, scr.y, 16);
    s.flash = COLLECT_FLASH;
    s.flashX = scr.x;
    s.flashY = scr.y;
  }
  s.note = 'The keepsake is yours — finish the waltz.';
  s.statusKind = 'found';
  return true;
}

function collectPractice(s, scr) {
  const g = s.practiceGlint;
  if (!g || g.taken) return false;
  g.taken = true;
  logAction(s, 'collect', {id: g.spot, kind: 'practice'});
  if (scr) {
    addRipple(s, scr.x, scr.y);
    spawnSparks(s, scr.x, scr.y, 8);
    s.flash = COLLECT_FLASH;
    s.flashX = scr.x;
    s.flashY = scr.y;
  }
  s.note = 'Crest TAP felt — searchable laps next. Nothing kept.';
  s.statusKind = 'practice';
  return true;
}

/** Saddle symbol — heart valid; crescent/star decoys. glow() uses 6-digit hex only. */
function drawSaddleMark(d, x, y, sc, mark, lit) {
  const glowR = (lit ? 22 : 14) * sc;
  if (mark === 'heart') {
    if (lit) d.glow(x, y, glowR, '#ffe6a4');
    d.heart(x, y, 8.5 * sc, '#d2a65b');
    d.heart(x, y - 0.5 * sc, 5.5 * sc, '#ffe6a4');
    return;
  }
  if (mark === 'crescent') {
    if (lit) d.glow(x, y, glowR, '#c8d0e0');
    // Outline crescent: outer arc + inner cut stroke (readable on saddle or glint).
    d.circle(x, y, 8 * sc, null, '#c8d0e0', 2.4);
    d.circle(x + 3.4 * sc, y - 1.4 * sc, 6.4 * sc, null, '#2a2038', 2.6);
    d.circle(x + 3.4 * sc, y - 1.4 * sc, 5.2 * sc, null, '#c8d0e0', 1.2);
    return;
  }
  if (mark === 'star') {
    if (lit) d.glow(x, y, glowR, '#f4d590');
    d.star(x, y, 8 * sc);
    d.circle(x, y, 9.5 * sc, null, '#d2a65b', 1.4);
    return;
  }
  d.heart(x, y, 6 * sc, '#d2a65b');
}

function drawHorseSafe(d, h, bob, you, t, reduced) {
  const sc = h.scale;
  const x = h.x;
  const y = h.y + bob;
  const fill = you ? '#f7efe0' : (h.front ? '#f3e2bd' : '#e8d4a8');
  const stroke = you ? '#8a4a28' : '#b78b48';
  const thick = you ? 3.2 : (h.front ? 2.4 : 1.8);

  d.ellipse(x + 4, y + 34 * sc, 38 * sc, 11 * sc, '#12233555');
  d.ellipse(x, y + 8 * sc, 42 * sc, 22 * sc, '#3a181822');

  d.line({x: x - 18 * sc, y: y + 6 * sc}, {x: x - 22 * sc, y: y + 40 * sc}, stroke, thick);
  d.line({x: x - 4 * sc, y: y + 8 * sc}, {x: x - 2 * sc, y: y + 42 * sc}, stroke, thick);
  d.line({x: x + 14 * sc, y: y + 6 * sc}, {x: x + 18 * sc, y: y + 40 * sc}, stroke, thick);
  d.line({x: x + 28 * sc, y: y + 4 * sc}, {x: x + 34 * sc, y: y + 38 * sc}, stroke, thick);

  d.poly([
    [x - 40 * sc, y + 4 * sc],
    [x - 28 * sc, y - 14 * sc],
    [x + 8 * sc, y - 18 * sc],
    [x + 44 * sc, y - 10 * sc],
    [x + 52 * sc, y + 6 * sc],
    [x + 42 * sc, y + 22 * sc],
    [x - 24 * sc, y + 24 * sc],
  ], fill, stroke, thick);

  d.poly([
    [x + 36 * sc, y - 8 * sc],
    [x + 52 * sc, y - 28 * sc],
    [x + 62 * sc, y - 22 * sc],
    [x + 58 * sc, y - 4 * sc],
    [x + 44 * sc, y + 4 * sc],
  ], fill, stroke, thick);
  d.circle(x + 56 * sc, y - 18 * sc, (you ? 13 : 11) * sc, fill, stroke, thick * 0.9);
  d.poly([
    [x + 50 * sc, y - 28 * sc],
    [x + 48 * sc, y - 40 * sc],
    [x + 56 * sc, y - 30 * sc],
  ], fill, stroke, 1.5);
  d.circle(x + 60 * sc, y - 20 * sc, 2.2 * sc, '#2a1838');
  d.poly([
    [x + 40 * sc, y - 16 * sc],
    [x + 34 * sc, y - 34 * sc],
    [x + 48 * sc, y - 22 * sc],
  ], '#6b2030cc', '#d2a65b', 1.2);

  d.poly([
    [x - 8 * sc, y - 6 * sc],
    [x + 22 * sc, y - 8 * sc],
    [x + 26 * sc, y + 12 * sc],
    [x - 12 * sc, y + 14 * sc],
  ], '#6b2030', '#d2a65b', 2);
  // Ch2: saddle mark (heart = valid; crescent/star = decoy). Ch1: default gold heart.
  if (h.mark) drawSaddleMark(d, x + 6 * sc, y + 2 * sc, sc, h.mark, !!(h.front || you));
  else d.heart(x + 6 * sc, y + 2 * sc, (you ? 7 : 5.5) * sc, '#d2a65b');

  if (h.front || you) {
    d.glow(x + 10 * sc, y - 4 * sc, 28 * sc, '#ffe6a4');
  }

  if (!reduced && !you) {
    const flick = Math.sin((t || 0) * 3 + (h.a || 0)) * 2 * sc;
    d.line(
      {x: x + 34 * sc, y: y - 20 * sc},
      {x: x + 28 * sc + flick, y: y - 36 * sc},
      '#6b2030aa',
      2,
    );
  }
}

function drawPlayerHorse(d, cx, cy, bob, t, reduced) {
  const x = cx;
  const y = cy + 110 + bob;
  d.ellipse(x + 6, y + 52, 78, 18, '#12233566');
  d.ellipse(x, y + 18, 90, 40, '#3a181828');

  d.line({x: x - 40, y: y + 10}, {x: x - 48, y: y + 70}, '#8a4a28', 4);
  d.line({x: x - 12, y: y + 14}, {x: x - 8, y: y + 74}, '#8a4a28', 4);
  d.line({x: x + 28, y: y + 10}, {x: x + 36, y: y + 70}, '#8a4a28', 4);
  d.line({x: x + 56, y: y + 6}, {x: x + 68, y: y + 66}, '#8a4a28', 4);

  d.poly([
    [x - 78, y + 8],
    [x - 50, y - 28],
    [x + 20, y - 36],
    [x + 78, y - 18],
    [x + 92, y + 14],
    [x + 72, y + 48],
    [x - 48, y + 52],
  ], '#f7efe0', '#8a4a28', 3.5);

  d.poly([
    [x + 62, y - 14],
    [x + 88, y - 52],
    [x + 108, y - 40],
    [x + 100, y - 4],
    [x + 74, y + 10],
  ], '#f7efe0', '#8a4a28', 3);
  d.circle(x + 98, y - 34, 20, '#f7efe0', '#8a4a28', 2.5);
  d.poly([[x + 88, y - 52], [x + 84, y - 72], [x + 98, y - 56]], '#f7efe0', '#8a4a28', 2);
  d.circle(x + 106, y - 36, 3.2, '#2a1838');
  d.poly([
    [x + 70, y - 30],
    [x + 58, y - 62],
    [x + 82, y - 40],
  ], '#6b2030', '#d2a65b', 2);
  if (!reduced) {
    const flick = Math.sin((t || 0) * 2.6) * 3;
    d.line({x: x + 64, y: y - 36}, {x: x + 52 + flick, y: y - 68}, '#6b2030cc', 2.5);
  }

  d.poly([
    [x - 18, y - 10],
    [x + 40, y - 12],
    [x + 46, y + 28],
    [x - 24, y + 30],
  ], '#6b2030', '#d2a65b', 2.5);
  d.heart(x + 10, y + 6, 10, '#d2a65b');
  d.glow(x + 10, y + 4, 36, '#ffe6a4');
  d.text('you', x + 6, y + 62, 15, '#f0d09a');
}

function drawCanopy(d, cx, cy, swayX, swayY, t, reduced) {
  const px = cx + swayX * 0.25;
  const py = cy + swayY * 0.25;
  d.ellipse(px, py - 160, 280, 160, '#4a182422');

  d.poly(
    [[px - 220, py - 290], [px + 220, py - 290], [px + 260, py - 36], [px - 260, py - 36]],
    '#6b203066',
    '#d2a65b',
    3.5,
  );
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI + (i * Math.PI) / 7;
    d.line(
      {x: px, y: py - 36},
      {x: px + Math.cos(a) * 248, y: py - 36 + Math.sin(a) * 74},
      '#d2a65baa',
      2.2,
    );
  }
  d.ellipse(px, py - 310, 236, 52, '#4a182488', '#f0d09a', 3.5);

  const flick = reduced ? 1 : (0.82 + 0.18 * Math.sin((t || 0) * 5.2));
  const flick2 = reduced ? 1 : (0.78 + 0.22 * Math.sin((t || 0) * 6.1 + 1.4));
  d.glow(px - 120, py - 250, 40 * flick, '#f4c878');
  d.glow(px + 120, py - 250, 40 * flick2, '#f4c878');
  d.glow(px, py - 285, 50 * (0.9 + 0.1 * flick), '#ffe6a4');
  d.circle(px - 120, py - 248, 7, '#f8e4b3', '#d2a65b', 1.5);
  d.circle(px + 120, py - 248, 7, '#f8e4b3', '#d2a65b', 1.5);

  d.circle(px, py - 36, 20, '#d2a65b', '#f8e4b3', 2.5);
  d.circle(px, py - 36, 10, '#6b2030aa', '#f0d09a', 1.5);
  d.line({x: px, y: py - 36}, {x: px, y: py + 210}, '#c4a46aaa', 10);
  d.line({x: px - 3, y: py - 36}, {x: px - 3, y: py + 210}, '#f0d09a44', 3);
}

function drawPlatform(d, cx, cy, swayX, swayY) {
  const px = cx + swayX * 0.4;
  const py = cy + swayY * 0.4;
  d.ellipse(px, py + 216, 350, 96, '#3a241866');
  d.ellipse(px, py + 204, 326, 82, '#5a3a2255', '#d2a65baa', 3.5);
  d.ellipse(px, py + 198, 300, 70, null, '#f0d09a55', 1.5);
}

/** Crest lane marker — fixed Tempest rim zone in front of the player mount. */
function drawCrestLane(d, s) {
  const y = CY + 48;
  const pulse = 1 + 0.06 * Math.sin((s.t || 0) * 5);
  d.glow(CX, y, 70 * pulse, '#ffe6a4');
  d.ellipse(CX, y, 88, 28, '#d2a65b22', '#f0d09a55', 2);
  // Soft “almost… NOW” rim ticks
  d.line({x: CX - 70, y: y - 36}, {x: CX - 70, y: y + 36}, '#d2a65b66', 2);
  d.line({x: CX + 70, y: y - 36}, {x: CX + 70, y: y + 36}, '#d2a65b66', 2);
}

function drawNowTelegraph(d, scr, t, treasure) {
  const n = scr.crest || 0;
  if (n <= 0.02) return;
  const pulse = 1 + 0.14 * Math.sin((t || 0) * 9);
  const base = treasure ? 64 : 52;
  d.glow(scr.x, scr.y, base * pulse * (0.55 + 0.45 * n), treasure ? '#f4d590' : '#ffe6a4');
  d.glow(scr.x, scr.y, (base * 0.5) * pulse, '#fff6d8');
  // NOW badge when deep in crest
  if (n > 0.35) {
    const fade = Math.min(1, (n - 0.35) / 0.4);
    const by = scr.y - 48;
    d.poly(
      [[scr.x - 42, by - 16], [scr.x + 42, by - 16], [scr.x + 42, by + 16], [scr.x - 42, by + 16]],
      `rgba(107,32,48,${0.92 * fade})`,
      '#ffe6a4',
      2.5,
    );
    d.text('NOW', scr.x, by + 6, 22, `rgba(255,230,164,${fade})`);
  }
  // Sparkle ticks
  const spin = (t || 0) * 2.4;
  for (let i = 0; i < 4; i++) {
    const a = spin + (i * Math.PI) / 2;
    const rr = (treasure ? 34 : 26) + 4 * Math.sin((t || 0) * 9 + i);
    d.circle(
      scr.x + Math.cos(a) * rr,
      scr.y + Math.sin(a) * rr,
      treasure ? 3.2 : 2.4,
      '#ffe6a4',
      '#d2a65b',
      1,
    );
  }
}

function drawApproachGlint(d, scr, t, treasure) {
  // Visible while approaching / leaving crest window time — softer than NOW.
  const pulse = 1 + 0.06 * Math.sin((t || 0) * 5);
  const base = treasure ? 40 : 32;
  d.glow(scr.x, scr.y, base * pulse, treasure ? '#f4d590' : '#ffe6a4');
  d.circle(scr.x, scr.y, 6, '#ffe6a4aa', '#d2a65b', 1.5);
}

function drawPracticeBadge(d, s) {
  if (!s.practice) return;
  const pulse = 1 + 0.04 * Math.sin((s.t || 0) * 4);
  const w = 210 * pulse;
  const x0 = 450 - w / 2;
  const y = 132;
  d.glow(450, y + 28, 70, '#d2a65b');
  d.poly([[x0, y], [x0 + w, y], [x0 + w, y + 56], [x0, y + 56]], '#6b2030f0', '#f0d09a', 3);
  d.text('PRACTICE', 450, y + 38, 28, '#ffe6a4');
}

function drawVerbChrome(d, s) {
  // First 5s: ONE verb — TAP on the crest. No LOOK chrome.
  if (!s.practice) return;
  const t = s.t || 0;
  if (t > VERB_SEC) return;
  const fade = t < VERB_SEC - 0.6 ? 1 : Math.max(0, (VERB_SEC - t) / 0.6);
  if (fade < 0.05) return;

  const y = 860;
  d.poly(
    [[120, y], [780, y], [780, y + 150], [120, y + 150]],
    `rgba(12,10,18,${0.88 * fade})`,
    '#d2a65b',
    3,
  );

  const tx = 450;
  const ty = y + 58;
  const pulse = 1 + 0.12 * Math.sin(t * 6);
  d.glow(tx, ty, 58 * pulse, '#ffe6a4');
  d.circle(tx, ty, 48, `rgba(210,166,91,${0.35 * fade})`, '#ffe6a4', 3);
  d.circle(tx, ty, 15, `rgba(255,230,164,${0.95 * fade})`, '#d2a65b', 2);
  d.text('TAP', tx, ty + 72, 28, `rgba(255,230,164,${fade})`);
  d.text(TEACH, 450, y + 138, 24, `rgba(255,246,216,${fade})`);
}

function drawPracticeLegend(d, s) {
  if (!s.practice) return;
  if ((s.t || 0) < VERB_SEC) return;
  const lapIdx = Math.min(2, Math.floor((s.t || 0) / (s.lapSec || 1)));
  if (lapIdx > 0) return;
  const y = 168;
  d.poly([[160, y], [740, y], [740, y + 44], [160, y + 44]], '#122335e8', '#d2a65b', 2);
  d.text(TEACH + ' · almost… NOW · nothing kept', 450, y + 30, 18, '#ffe6a4');
}

/** Ch2 teach-alone chrome — long warn / coaching for the heart mark. No LOOK verb. */
function drawCh2MarkChrome(d, s) {
  if (s.level !== 1) return;
  if (s.ch2Taught) return;
  const t = s.t || 0;
  const lap0 = s.practice && Math.floor(t / (s.lapSec || 1)) === 0;

  // Practice: after crest-TAP verb, briefly show the heart mark (seconds ~5–8).
  let show = false;
  let fade = 1;
  if (lap0 && t >= VERB_SEC && t < VERB_SEC + CH2_TEACH_CHROME) {
    show = true;
    const end = VERB_SEC + CH2_TEACH_CHROME;
    fade = t < end - 0.6 ? 1 : Math.max(0, (end - t) / 0.6);
  }

  // Searchable: long warn before first marked window (helter cushion pattern).
  const first = s.firstMarked;
  if (!s.practice && first && !first.taken) {
    const lead = first.from - t;
    if (lead <= CH2_MARK_WARN && t <= first.until + 0.2) {
      show = true;
      fade = lead > 0 ? 1 : Math.max(0.35, 1 - (t - first.from) / Math.max(0.4, first.until - first.from));
    }
  }

  // Also first ~7 s of searchable if teach window is later.
  if (!s.practice && !s.ch2Taught && t < CH2_TEACH_CHROME) {
    show = true;
    fade = t < CH2_TEACH_CHROME - 0.6 ? 1 : Math.max(0, (CH2_TEACH_CHROME - t) / 0.6);
  }

  if (!show || fade < 0.05) return;

  const y = 820;
  d.poly(
    [[100, y], [800, y], [800, y + 120], [100, y + 120]],
    `rgba(12,10,18,${0.86 * fade})`,
    '#d2a65b',
    3,
  );
  const hx = 200;
  const hy = y + 58;
  d.glow(hx, hy, 36, '#ffe6a4');
  d.heart(hx, hy, 18, '#d2a65b');
  d.heart(hx, hy - 1, 11, '#ffe6a4');
  d.text(TEACH_MARKED, 520, y + 52, 24, `rgba(255,230,164,${fade})`);
  d.text('Gold heart saddle — decoys come later', 520, y + 92, 16, `rgba(240,208,154,${fade})`);
}

function drawStatusStrip(d, s) {
  if (s.practice && (s.t || 0) < VERB_SEC) return;
  const lapIdx = Math.min(2, Math.floor((s.t || 0) / (s.lapSec || 1)));
  const y = 1088;
  let label = 'searching';
  let color = '#f0d09a';
  let fill = '#1a1220ee';
  const anyMarked =
    (s.practiceGlint && itemInCrestWindow(s.practiceGlint, s)) ||
    (s.treasure && itemInCrestWindow(s.treasure, s)) ||
    (s.finds || []).some((row) => itemInCrestWindow(row, s));
  const anyDecoy = decoysLive(s) && (s.decoys || []).some((row) => itemInCrestWindow(row, s));
  const anyCrest = anyMarked || anyDecoy;

  if (anyMarked) {
    label = s.level === 1 ? 'almost… NOW — heart TAP' : 'almost… NOW — TAP';
    color = '#ffe6a4';
    fill = '#3a2018ee';
  } else if (anyDecoy) {
    label = 'decoy crest — skip wrong marks';
    color = '#c8d0e0';
    fill = '#1a2030ee';
  } else if (s.practice && lapIdx === 0) {
    label = 'practice · wait for the crest';
    color = '#ead6a4';
    fill = '#2a2030ee';
  } else if (s.statusKind === 'found' && (s.flash || 0) > 0.15) {
    label = 'found · ' + (s.found || 0) + ' / ' + (s.goal || GOAL);
    color = '#ffe6a4';
    fill = '#3a2810ee';
  } else if (s.found >= (s.goal || GOAL)) {
    label = 'complete · ride home';
    color = '#fff6d8';
    fill = '#2a2210ee';
  } else if (lapIdx === 0) {
    label = 'practice lap';
    color = '#ead6a4';
  } else {
    label = 'lap ' + (lapIdx + 1) + ' · ' + (s.found || 0) + '/' + (s.goal || GOAL);
    color = '#f0d09a';
  }
  d.poly([[200, y], [700, y], [700, y + 40], [200, y + 40]], fill, '#d2a65b', 2);
  d.text(label, 450, y + 28, 18, color);
}

function drawSparksAndFlash(d, s) {
  for (const sp of (s.sparks || [])) {
    const a = Math.max(0, sp.life / COLLECT_FLASH);
    d.circle(sp.x, sp.y, sp.r * a, '#ffe6a4', '#d2a65b', 1);
  }
  if ((s.flash || 0) > 0) {
    const k = s.flash / COLLECT_FLASH;
    d.glow(s.flashX || CX, s.flashY || CY, 28 + 78 * k, '#ffe6a4');
  }
}

function tryCrestTap(s, p) {
  const pad = (s.hitPad || HIT_R) * 1.35;
  // Generous front-lane magnet — if a crest window is live, tapping the lower court counts.
  const crestLive = (s.finds || []).some((row) => itemInCrestWindow(row, s))
    || (s.treasure && itemInCrestWindow(s.treasure, s))
    || (s.practiceGlint && itemInCrestWindow(s.practiceGlint, s))
    || (decoysLive(s) && (s.decoys || []).some((row) => itemInCrestWindow(row, s)));
  const crestPad = (scr) => {
    if (!scr) return false;
    if (Math.hypot(p.x - CX, p.y - (CY + 48)) < (pad + 70)) return true;
    // Whole lower-middle band while a crest window is live (phone-thumb fair).
    if (crestLive && p.y > CY - 40 && p.y < CY + 220 && p.x > CX - 160 && p.x < CX + 160) return true;
    return false;
  };
  const hit = (scr) => hitItem(scr, p, pad) || crestPad(scr);

  // Treasure first while in crest (always heart-valid).
  if (s.treasure && itemInCrestWindow(s.treasure, s)) {
    const scr = spotScreen(s.treasure.spot, s, s.treasure.horse);
    if (hit(scr)) {
      collectTreasure(s, scr);
      return 'collect';
    }
  }

  // Practice glint (lap 0 teach) — no keepsake; crest TAP only.
  if (s.practiceGlint && itemInCrestWindow(s.practiceGlint, s)) {
    const scr = spotScreen(s.practiceGlint.spot, s, s.practiceGlint.horse);
    if (hit(scr)) {
      collectPractice(s, scr);
      return 'collect';
    }
  }

  // Marked ordinary finds (Ch2 heart / Ch1 any).
  const find = (s.finds || []).find((row) => {
    if (!itemInCrestWindow(row, s)) return false;
    const scr = spotScreen(row.spot, s, row.horse);
    return hit(scr);
  });
  if (find) {
    collectOrdinary(s, find, spotScreen(find.spot, s, find.horse));
    return 'collect';
  }

  // Ch2 decoy soft-fail — never abort ride / never finishRide early.
  if (decoysLive(s)) {
    const decoy = (s.decoys || []).find((row) => {
      if (row.taken) return false;
      if (!itemInCrestWindow(row, s)) return false;
      const scr = spotScreen(row.spot, s, row.horse);
      return hit(scr);
    });
    if (decoy) {
      return softFailDecoy(s, decoy, spotScreen(decoy.spot, s, decoy.horse));
    }
  }

  // Early / late: an active glint exists but is outside crest → miss.
  const early = (s.finds || []).find((row) => itemActive(row, s.t) && !itemInCrestWindow(row, s));
  const earlyTr = s.treasure && itemActive(s.treasure, s.t) && !itemInCrestWindow(s.treasure, s);
  const earlyPr = s.practiceGlint && itemActive(s.practiceGlint, s.t) && !itemInCrestWindow(s.practiceGlint, s);
  const earlyDec = decoysLive(s) && (s.decoys || []).some((row) => itemActive(row, s.t) && !itemInCrestWindow(row, s));
  if (early || earlyTr || earlyPr || earlyDec) {
    logAction(s, 'miss', {reason: 'crest', x: Math.round(p.x), y: Math.round(p.y)});
    s.note = 'Almost… wait for NOW.';
    s.statusKind = 'miss';
    return 'miss';
  }
  return 'tap';
}

export default {
  title: 'Carousel Waltz',
  intro: 'Round and round, the secrets change. Board one horse fixed front-and-center; glints rise into the crest — TAP on NOW. Painted Ponies adds one rule: only the gold heart-marked pony counts.',
  instructions: 'Your horse stays center-front. Watch orbiting glints rise into the crest sweet-spot, then TAP on NOW. Practice teaches crest TAP and keeps nothing; a paid waltz costs one penny. First Turn: any crest glint. Painted Ponies: TAP the heart-marked pony — wrong marks soft-fail and the ride continues. Find three ordinary keepsakes before the final rotation ends.',
  levels: LEVELS,
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 90,
  houseTitle: 'The waltz ended',
  houseDetail: 'The lantern dimmed before the last lap. Try this chapter again.',
  actions: [{id: 'tap', label: 'TAP'}],

  create(level, rng) {
    const reduced = prefersReducedMotion();
    return makeRideState(level, rng, {
      angle: 0,
      swayX: 0,
      swayY: 0,
      drag: null,
      found: 0,
      goal: GOAL,
      finds: [],
      ripples: [],
      sparks: [],
      flash: 0,
      flashX: CX,
      flashY: CY,
      statusKind: 'practice',
      introShown: false,
      treasureId: TREASURES[Math.max(0, Math.min(level, TREASURES.length - 1))],
      reduced,
      scheduled: false,
      playerHorse: 0,
      crestHalf: 0.6,
      practiceGlint: null,
      horseMarks: null,
      decoys: [],
      ch2Taught: false,
      firstMarked: null,
      decoyFlash: 0,
    });
  },

  update(s, dt) {
    if (s.result || s.broke) return;

    const spawnIds = SPOTS.map((row) => row.id);
    if (ensureBoarded(s, RIDE, s.treasureId, spawnIds)) {
      scheduleForLevel(s);
      s.scheduled = true;
      s.introShown = true;
      s.statusKind = s.practice ? 'practice' : 'searching';
      if (s.practice) {
        s.note = 'PRACTICE — TAP on the crest when it pulses NOW. Nothing is kept.';
      } else if (s.level === 1) {
        s.note = s.eligible
          ? 'Painted Ponies — TAP the heart-marked pony. A keepsake hides this waltz.'
          : 'Painted Ponies — TAP the heart-marked pony. Three finds finish the ride.';
      } else {
        s.note = s.eligible
          ? 'A keepsake hides this waltz. TAP on the crest.'
          : 'Watch the crest. Three NOW taps finish the ride.';
      }
    }
    if (s.result) return;
    if (!s.scheduled) return;

    const speed = rideSpeed(s);
    s.t += dt;
    s.angle += speed * dt;
    s.progress = Math.min(1, (s.t || 0) / (s.rideEnd || 1));

    // Cosmetic sway recentre — not a LOOK skill.
    if (!s.drag) {
      const k = Math.min(1, dt / 0.2);
      s.swayX += (0 - s.swayX) * k;
      s.swayY += (0 - s.swayY) * k;
    }

    if ((s.flash || 0) <= 0.05) {
      const lapIdx = Math.min(2, Math.floor((s.t || 0) / (s.lapSec || 1)));
      if (s.practice && lapIdx === 0) s.statusKind = 'practice';
      else if (s.found >= s.goal) s.statusKind = 'found';
      else s.statusKind = 'searching';
    }

    // Ch2 long warn before first marked window (teach alone).
    if (s.level === 1 && !s.practice && !s.ch2Taught && s.firstMarked && !s.firstMarked.taken) {
      const lead = s.firstMarked.from - (s.t || 0);
      if (lead <= CH2_MARK_WARN && lead > -0.05 && !s.ch2WarnLogged) {
        s.ch2WarnLogged = true;
        logAction(s, 'mark-warn', {lead: CH2_MARK_WARN});
        s.note = TEACH_MARKED + ' — gold heart on the saddle.';
      }
    }

    // Reveal eligible treasure when its crest window opens (ride never pauses).
    if (s.treasure && itemInCrestWindow(s.treasure, s) && !s.treasureRevealed) {
      s.treasureRevealed = true;
      logAction(s, 'reveal', {spot: s.treasure.spot});
      s.note = 'Keepsake on the crest — TAP NOW.';
    }

    s.ripples = (s.ripples || []).filter((r) => {
      r.t += dt;
      return r.t < r.life;
    });

    if (s.sparks && s.sparks.length) {
      const next = [];
      for (const sp of s.sparks) {
        sp.life -= dt;
        if (sp.life <= 0) continue;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 55 * dt;
        next.push(sp);
      }
      s.sparks = next;
    }
    if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);
    if ((s.decoyFlash || 0) > 0) s.decoyFlash = Math.max(0, s.decoyFlash - dt);

    if (s.t >= (s.rideEnd || lapSeconds(speed) * 3)) {
      if (s.treasure && s.eligible && s.t >= s.treasure.from && !s.treasure.taken) {
        s.treasureRevealed = true;
      }
      finishRide(s, {
        rideId: RIDE,
        treasureId: s.treasureId,
        challengeOk: s.found >= s.goal,
        completionFind: 'star-token',
      });
    }
  },

  action(s, id, down) {
    if (!down || s.result || s.broke) return;
    if (id === 'tap') {
      logAction(s, 'tap', {via: 'button'});
      tryCrestTap(s, {x: CX, y: CY + 48});
    }
  },

  key(s, k, down) {
    if (!down || s.result || s.broke) return;
    if (k === ' ' || k === 'Enter') {
      logAction(s, 'tap', {via: 'key', key: k});
      tryCrestTap(s, {x: CX, y: CY + 48});
    }
  },

  pointer(s, type, p) {
    if (s.result || s.broke) return;

    if (type === 'down') {
      s.drag = {x: p.x, y: p.y, swayX: s.swayX || 0, swayY: s.swayY || 0, moved: false};
      return;
    }

    if (type === 'move' && s.drag) {
      const dx = p.x - s.drag.x;
      const dy = p.y - s.drag.y;
      if (Math.hypot(dx, dy) > DRAG_PX) s.drag.moved = true;
      // Tiny cosmetic sway only — ignored for crest / collect.
      if (s.drag.moved) {
        s.swayX = clamp(s.drag.swayX + dx * 0.08, -SWAY_X, SWAY_X);
        s.swayY = clamp(s.drag.swayY + dy * 0.08, -SWAY_Y, SWAY_Y);
      }
      return;
    }

    if (type === 'up' && s.drag) {
      const drag = s.drag;
      s.drag = null;
      // Drag never counts as a skill — always treat release as TAP attempt
      // unless the finger clearly slid (then ignore; no LOOK log).
      if (drag.moved && Math.hypot(p.x - drag.x, p.y - drag.y) > 48) {
        return;
      }
      logAction(s, 'tap', {x: Math.round(p.x), y: Math.round(p.y)});
      tryCrestTap(s, p);
      return;
    }

    if (type === 'cancel') s.drag = null;
  },

  draw(s, d) {
    // Backdrop carousel.png owns the unique court — never full-screen clear/overpaint.
    // d.clear is transparent at shell level; we only draw paper-cut layers here.
    const swayX = s.swayX || 0;
    const swayY = s.swayY || 0;
    const cx = CX + swayX;
    const cy = CY + swayY;
    const t = s.t || 0;
    const reduced = !!s.reduced;

    drawPlatform(d, CX, CY, swayX, swayY);
    drawCanopy(d, CX, CY, swayX, swayY, t, reduced);
    drawCrestLane(d, s);

    // Orbiting horses (skip index 0 — player mount fixed foreground).
    const order = [];
    for (let i = 1; i < HORSE_N; i++) {
      const h = horsePoint(i, HORSE_N, s.angle || 0, cx, cy + 40, 250, 220);
      if (s.horseMarks && s.horseMarks[i]) h.mark = s.horseMarks[i];
      order.push({i, h});
    }
    order.sort((a, b) => a.h.scale - b.h.scale);
    for (const {i, h} of order) {
      const bob = Math.sin((s.angle || 0) * 2 + i) * (reduced ? 3 : 10);
      drawHorseSafe(d, h, bob, false, t, reduced);
    }

    // Player horse — locked center-front (Tempest rim lane).
    const bob = Math.sin(t * 2.2) * (reduced ? 3 : 8);
    drawPlayerHorse(d, CX + swayX * 0.15, CY + swayY * 0.15, bob, t, reduced);

    const poleX = CX + swayX * 0.25;
    const poleY = CY + swayY * 0.25;
    d.item(spriteKey('music-carousel'), poleX, poleY - 40, {
      w: 72,
      shadow: false,
      fallback: () => d.star(poleX, poleY - 40, 14),
    });

    // Practice glint (lap 0) — approach + NOW telegraph.
    if (s.practiceGlint && itemActive(s.practiceGlint, s.t)) {
      const scr = spotScreen(s.practiceGlint.spot, s, s.practiceGlint.horse);
      if (scr) {
        if (scr.crest > 0.02) drawNowTelegraph(d, scr, t, false);
        else drawApproachGlint(d, scr, t, false);
        d.item(spriteKey('star-token'), scr.x, scr.y, {
          w: 52,
          shadow: false,
          fallback: () => d.star(scr.x, scr.y, 12),
        });
      }
    }

    (s.finds || []).forEach((row) => {
      if (!itemActive(row, s.t)) return;
      const scr = spotScreen(row.spot, s, row.horse);
      if (!scr) return;
      if (scr.crest > 0.02) drawNowTelegraph(d, scr, t, false);
      else drawApproachGlint(d, scr, t, false);
      // Heart cue on the collectable glint (Ch2).
      if (row.mark === 'heart') {
        d.glow(scr.x, scr.y - 22, 18, '#ffe6a4');
        d.heart(scr.x, scr.y - 22, 9, '#d2a65b');
      }
      d.item(spriteKey(row.id), scr.x, scr.y, {
        w: 56,
        shadow: false,
        fallback: () => d.star(scr.x, scr.y, 14),
      });
    });

    // Ch2 decoy crest glints — wrong marks; soft-fail on TAP (after teach).
    if (decoysLive(s)) {
      (s.decoys || []).forEach((row) => {
        if (!itemActive(row, s.t)) return;
        const scr = spotScreen(row.spot, s, row.horse);
        if (!scr) return;
        const pulse = 1 + 0.08 * Math.sin(t * 7);
        if (scr.crest > 0.02) {
          d.glow(scr.x, scr.y, 44 * pulse, '#c8d0e0');
          if (scr.crest > 0.35) {
            d.poly(
              [[scr.x - 48, scr.y - 64], [scr.x + 48, scr.y - 64], [scr.x + 48, scr.y - 32], [scr.x - 48, scr.y - 32]],
              'rgba(26,32,48,0.88)',
              '#c8d0e0',
              2,
            );
            d.text('SKIP', scr.x, scr.y - 40, 18, '#c8d0e0');
          }
        } else {
          d.glow(scr.x, scr.y, 28 * pulse, '#c8d0e0');
        }
        drawSaddleMark(d, scr.x, scr.y, 1.35, row.mark || 'crescent', scr.crest > 0.02);
      });
    }

    if ((s.decoyFlash || 0) > 0) {
      const k = s.decoyFlash / 0.55;
      d.glow(s.decoyFlashX || CX, s.decoyFlashY || CY, 24 + 40 * k, '#c8d0e0');
      d.text('soft miss', s.decoyFlashX || CX, (s.decoyFlashY || CY) - 36, 16, `rgba(200,208,224,${k})`);
    }

    if (s.treasure && itemActive(s.treasure, s.t)) {
      const scr = spotScreen(s.treasure.spot, s, s.treasure.horse);
      if (scr) {
        if (scr.crest > 0.02) drawNowTelegraph(d, scr, t, true);
        else drawApproachGlint(d, scr, t, true);
        d.item(spriteKey(s.treasure.id), scr.x, scr.y, {
          w: 72,
          shadow: false,
          fallback: () => d.heart(scr.x, scr.y, 18),
        });
      }
    }

    (s.ripples || []).forEach((r) => {
      const u = r.t / r.life;
      const rad = 18 + u * 52;
      d.circle(r.x, r.y, rad, null, `rgba(244,213,144,${(1 - u) * 0.9})`, 3.5);
      d.circle(r.x, r.y, rad * 0.55, null, `rgba(255,230,164,${(1 - u) * 0.45})`, 2);
    });

    drawSparksAndFlash(d, s);

    const lapFrac = Math.min(1, (s.t || 0) / (s.rideEnd || 1));
    d.glow(70, 70, 40, '#d2a65b');
    d.arc(70, 70, 28, -Math.PI / 2, -Math.PI / 2 + lapFrac * TAU, '#f0d09a', 7);
    d.circle(70, 70, 16, '#122335cc', '#d2a65b', 2);
    const lapIdx = Math.min(2, Math.floor((s.t || 0) / (s.lapSec || 1)));
    d.text(String(lapIdx + 1), 70, 76, 18, '#ffe6a4');
    d.text(lapIdx === 0 ? 'practice' : ('lap ' + (lapIdx + 1)), 70, 112, 14, '#e8d0a0');

    d.poly([[760, 48], [870, 48], [870, 96], [760, 96]], '#122335dd', '#d2a65b', 2);
    d.text((s.found || 0) + ' / ' + (s.goal || GOAL), 815, 82, 22, '#ffe6a4');

    drawPracticeBadge(d, s);
    drawVerbChrome(d, s);
    drawPracticeLegend(d, s);
    drawCh2MarkChrome(d, s);
    drawStatusStrip(d, s);

    drawHud(d, s, {goal: s.goal || GOAL, count: s.found || 0, label: 'finds'});
  },

  readout: (s) => s.note || '',
};
