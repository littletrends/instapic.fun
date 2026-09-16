/**
 * Amusement 1 — Florence — Carousel Waltz (Ride & Seek)
 * Tagline: Round and round, the secrets change.
 *
 * DRESS (Tent_24_Lumi + bea-player): Lumi lanterns/notes as bold cream scenery;
 *   YOU = shared bea-player on front mount. actions: [] — cream bottom TAP stick +
 *   court tap/swipe (+ Space/Enter). Do NOT set canvasControls. d.glow 6-digit hex.
 *   Horse sheet: front.png (not webp). Ch1–6 gameplay schedules LOCKED.
 *
 * SHIPPED: Chapters 1–6 (First Turn, Painted Ponies, Mirror Round, Carriage Windows,
 *   Midnight Canopy, The Grand Waltz).
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
 *   Ch3 Mirror Round — same crest TAP. One learnable reflection rule: real crest
 *     glints collect; false reflections (cool silver, dashed ring, horizontal flip)
 *     cannot be collected. Teach alone: first real window has no reflections.
 *     After first real collect (ch3Taught), later crest passes may show mirror
 *     ghosts; TAP reflection = soft fail (note + logAction miss reason:'reflection'),
 *     ride continues, never abort. Sticky crest-arm auto-collects REAL finds only.
 *     Open-until finds + sticky arm (Ch2 retune 6 fairness); GOAL=3 reachable ~59 s.
 *
 *   Ch4 Carriage Windows — same crest TAP. Finds live only while a carriage window
 *     is OPEN at the crest NOW. Each carriage opens twice: teach pass (watch —
 *     chrome “Window opens — watch; next pass TAP”; no collect), then collect pass
 *     (TAP on NOW takes the find). Shut windows never collect. Soft-fail TAP while
 *     shut/early/teach (miss note, ride continues). Teach alone: first carriage
 *     teach has no competing opens; later carriages run teach→collect pairs.
 *     Sticky crest-arm after first TAP collects only when window open + find live.
 *     Open collect scheduling + early win seal; GOAL=3 reachable ~59 s.
 *     No Ch2 decoys / Ch3 reflections on Ch4 (Grand Waltz combines later).
 *
 *   Ch5 Midnight Canopy — same crest TAP. Canopy treasures hang HIGH above the
 *     crest, then DIP into the crest NOW window (“vertical looking” is visual —
 *     eyes up — still collected by crest TAP when the find drops into NOW).
 *     TAP while still too-high = soft-fail (miss reason tooHigh); ride continues.
 *     Teach alone: first canopy find shows high→dip with chrome; no competing
 *     hazards. After first collect (ch5Taught), more canopy finds + mild speed
 *     rise (crest windows stay ~6 s — do not raise speed and narrow together).
 *     Sticky crest-arm; open-until scheduling; early win seal; GOAL=3 ~59 s.
 *     Dim lanterns / night ornaments; horse bob slightly higher; paper-cut
 *     gold/teal canopy finds (distinct from Ch2 hearts / Ch3 silver / Ch4 windows).
 *     No Ch2 decoys / Ch3 reflections / Ch4 window pairs on Ch5.
 *
 *   Ch6 The Grand Waltz — same crest TAP. Combines ONLY taught rules across
 *     rotations (prefer sequential hazard types over stacking all four on one beat):
 *     heart marks (Ch2), mirror ghosts (Ch3), open carriage windows (Ch4),
 *     canopy high→dip (Ch5), mild speed changes after teach (crest stays ~6 s —
 *     never raise speed AND narrow windows in the same step). Rising platforms =
 *     crest / horse bob slightly higher (visual); still crest TAP.
 *     Guarantee: at least one real eligible find is open-until so its crest window
 *     repeats every rotation (miss the first pass → second chance on the same slot).
 *     Teach alone first ~10–15 s: one clear real heart window with chrome
 *     “Grand Waltz — use every rule you’ve learned”; no overlapping hazards on
 *     first collect. Sticky crest-arm after first TAP auto-collects only VALID
 *     finds (open window if required, dipped canopy if required, real not
 *     reflection, heart if required). Soft-fails never abort. Early win seal;
 *     GOAL=3 reachable ~59–70 s. houseSeconds 120.
 */
import {TAU, clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=exclusive-1b';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure,
  logAction, prefersReducedMotion,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'carousel';
const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
const TREASURES = [
  'music-carousel', 'ticket-satchel', 'ride-explorer-pennant',
  'star-token', 'moon-penny', 'ride-ticket',
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
const TEACH_MIRROR = 'TAP the real crest — skip mirrors';
const TEACH_WINDOW = 'Window opens — watch; next pass TAP';
const TEACH_CANOPY = 'Canopy treasure — TAP when it drops into NOW';
const TEACH_WALTZ = 'Grand Waltz — use every rule you’ve learned';
const VERB_SEC = 5;
/** Ch2 long warn before first searchable marked window (helter cushion teach). */
const CH2_MARK_WARN = 8.0;
const CH2_TEACH_CHROME = 5.5;
/** Ch3 long warn before first searchable real window (teach alone). */
const CH3_REAL_WARN = 8.0;
const CH3_TEACH_CHROME = 5.5;
/** Ch4 long warn before first teach window (teach alone). */
const CH4_WINDOW_WARN = 8.0;
const CH4_TEACH_CHROME = 5.5;
/** Ch5 long warn before first canopy dip (teach alone). */
const CH5_CANOPY_WARN = 8.0;
const CH5_TEACH_CHROME = 5.5;
/** Ch6 long warn before first Grand Waltz teach window. */
const CH6_WALTZ_WARN = 8.0;
const CH6_TEACH_CHROME = 5.5;
/** Tiny cosmetic sway only — NOT a named LOOK skill. */
const SWAY_X = 10;
const SWAY_Y = 6;
const DRAG_PX = 18;

/** Papercut horse-carousel front sheet — crop ride rect into rideCutout. */
const PAPERCUT_SHEET = 512;
const PAPERCUT_RIDE_RECT = [58, 34, 396, 446]; // front ride frame from catalogue
const RIDE_CUTOUT_SRC = new URL(
  '../../assets/restyle/scene-turnarounds-2026-09-09/amusements/horse-carousel/front.png',
  import.meta.url,
).href;
/** @type {HTMLCanvasElement|ImageBitmap|null} */
let rideCutout = null;
let rideCutoutReady = false;

function cropRideCutout(img, rect) {
  const [sx, sy, sw, sh] = rect;
  const out = (typeof OffscreenCanvas !== 'undefined')
    ? new OffscreenCanvas(sw, sh)
    : Object.assign(document.createElement('canvas'), {width: sw, height: sh});
  if (!(out instanceof OffscreenCanvas)) {
    out.width = sw;
    out.height = sh;
  }
  const ctx = out.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return out;
}

function preloadRideCutout() {
  if (rideCutoutReady || typeof Image === 'undefined') return;
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    try {
      const cut = cropRideCutout(img, PAPERCUT_RIDE_RECT);
      if (!cut) return;
      // Prefer ImageBitmap when available (faster draw); else keep canvas.
      if (typeof createImageBitmap === 'function') {
        createImageBitmap(cut).then((bmp) => {
          rideCutout = bmp;
          rideCutoutReady = true;
        }).catch(() => {
          rideCutout = cut;
          rideCutoutReady = true;
        });
      } else {
        rideCutout = cut;
        rideCutoutReady = true;
      }
    } catch (_) { /* keep stick geometry fallback */ }
  };
  img.onerror = () => { /* missing png — stick geometry remains */ };
  img.src = RIDE_CUTOUT_SRC;
}
preloadRideCutout();

function drawRideCutout(d, swayX, swayY) {
  if (!rideCutoutReady || !rideCutout) return false;
  const w = 560;
  const iw = rideCutout.width || PAPERCUT_RIDE_RECT[2];
  const ih = rideCutout.height || PAPERCUT_RIDE_RECT[3];
  const h = w * (ih / (iw || 1));
  const x = CX + swayX * 0.35;
  const y = CY - 40 + swayY * 0.35;
  if (typeof d.sprite === 'function') {
    return d.sprite(rideCutout, x, y, {w, h, shadow: false, alpha: 1});
  }
  const c = d.c;
  c.save();
  c.translate(x, y);
  c.drawImage(rideCutout, -w / 2, -h / 2, w, h);
  c.restore();
  return true;
}

/** Cream / gold / burgundy — 6-digit hex only for d.glow(). */
const CREAM = '#f4d590';
const CREAM_DEEP = '#d2a65b';
const GOLD = '#ffe6a4';
const BURGUNDY = '#c67483';
const BURGUNDY_DEEP = '#6b2030';
const INK = '#3a1818';

/** Aura Tent_24_Lumi + shared bea-player — resolve vs THIS module (stalls/). */
const DRESS_CACHE = 'dress-1a';
const LUMI_FILES = {
  starLantern: 'Tent_24_Lumi_piece-01.png', // star-lantern
  moonLantern: 'Tent_24_Lumi_piece-02.png', // moon-lantern
  heartLantern: 'Tent_24_Lumi_piece-03.png', // heart-lantern
  starNote: 'Tent_24_Lumi_piece-04.png', // star-note icon
  moonNote: 'Tent_24_Lumi_piece-05.png', // moon-note icon
  heartNote: 'Tent_24_Lumi_piece-06.png', // heart-note icon
};
const BEA_PLAYER_FILE = 'bea-player.png';
let lumiPropImgs = null;
let beaPlayerImg = null;

function dressUrl(rel) {
  // Resolve against THIS module (stalls/carousel.js), not play.html.
  try {
    return new URL(rel + (rel.includes('?') ? '&' : '?') + 'v=' + DRESS_CACHE, import.meta.url).href;
  } catch {
    return rel;
  }
}

function ensureLumiProps() {
  if (lumiPropImgs) return lumiPropImgs;
  lumiPropImgs = {};
  for (const [key, file] of Object.entries(LUMI_FILES)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = dressUrl('../assets/carousel-lumi/' + file);
    lumiPropImgs[key] = img;
  }
  if (!beaPlayerImg) {
    beaPlayerImg = new Image();
    beaPlayerImg.decoding = 'async';
    beaPlayerImg.src = dressUrl('../assets/shared-player/' + BEA_PLAYER_FILE);
  }
  return lumiPropImgs;
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
 * Tent_24_Lumi scenery on cream court — canopy poles, crest sides, mid-court.
 * Do NOT paint a full-screen background over cream / #backdrop.
 */
function drawLumiScenery(d, swayX, swayY) {
  const imgs = ensureLumiProps();
  const sx = (swayX || 0) * 0.22;
  const sy = (swayY || 0) * 0.22;
  // Soft gold/burgundy accents only (no full bg wash).
  d.glow(118 + sx, 268 + sy, 34, GOLD);
  d.glow(782 + sx, 268 + sy, 34, GOLD);
  d.glow(CX + sx, 198 + sy, 40, BURGUNDY);
  // 01 star-lantern — left canopy pole
  placeDress(d, imgs.starLantern, 118 + sx, 310 + sy, 96, -0.1);
  // 02 moon-lantern — right canopy pole
  placeDress(d, imgs.moonLantern, 782 + sx, 310 + sy, 96, 0.1);
  // 03 heart-lantern — crest / canopy crown
  placeDress(d, imgs.heartLantern, CX + sx, 210 + sy, 108, 0);
  // 04 star-note — left mid-court / crest side
  placeDress(d, imgs.starNote, 96 + sx, 520 + sy, 72, -0.12);
  // 05 moon-note — right mid-court / crest side
  placeDress(d, imgs.moonNote, 804 + sx, 520 + sy, 72, 0.12);
  // 06 heart-note — mid-court accent (left-of-center, clear of crest lane)
  placeDress(d, imgs.heartNote, 168 + sx, 430 + sy, 68, -0.05);
}

/**
 * Centre-bottom cream TAP stick (one pad — not UD/LR cluster).
 * Press fires crest TAP (Mario TAP remix). Shell Pause/Restart stay off-court.
 */
function tapStickLayout() {
  return {cx: CX, cy: 1136, baseRx: 102, baseRy: 62, knobR: 34, maxPull: 28};
}

function hitTapStick(p) {
  if (!p || typeof p.x !== 'number') return false;
  const L = tapStickLayout();
  const dx = (p.x - L.cx) / L.baseRx;
  const dy = (p.y - L.cy) / L.baseRy;
  return (dx * dx + dy * dy) <= 1.28;
}

function drawTapStick(s, d) {
  const L = tapStickLayout();
  const armed = !!(s.stick && s.stick.active);
  const kx = armed ? (s.stick.kx || 0) : 0;
  const ky = armed ? (s.stick.ky || 0) : 0;
  const pulse = 0.55 + 0.45 * Math.sin((s.t || 0) * 3.2);
  d.ellipse(L.cx + 3, L.cy + 5, L.baseRx, L.baseRy, '#3a1a1266');
  d.ellipse(L.cx, L.cy, L.baseRx, L.baseRy, CREAM + 'ee', GOLD, 2.4);
  d.ellipse(L.cx, L.cy, L.baseRx * 0.72, L.baseRy * 0.62, '#f8e4b3cc', BURGUNDY, 1.6);
  if (armed) d.glow(L.cx, L.cy, 54 + pulse * 10, GOLD);
  const nx = L.cx + kx;
  const ny = L.cy + ky;
  d.ellipse(nx + 2, ny + 4, L.knobR * 0.95, L.knobR * 0.72, '#3a1a1244');
  d.ellipse(nx, ny, L.knobR, L.knobR * 0.82, armed ? GOLD : BURGUNDY, GOLD, 2.2);
  d.ellipse(nx - 4, ny - 6, L.knobR * 0.42, L.knobR * 0.28, CREAM + 'aa');
  // Dark readable label on cream (not pale cream-on-cream).
  d.text('TAP', L.cx, L.cy + L.baseRy + 18, 15, armed ? BURGUNDY_DEEP : INK);
}



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
  // Fairness retune 6 (Aura FAIL 2/3×2): sticky crest-arm until goal after first TAP.
  const base = 0.24;
  return reduced ? base * 0.72 : base;
}

function ch3Speed(reduced) {
  // Mirror Round: same fairness bar as Ch2 retune 6 — slow spin, wide crest.
  return ch2Speed(reduced);
}

function ch4Speed(reduced) {
  // Carriage Windows: same fairness bar — slow spin ~0.24, ~6s crest.
  return ch2Speed(reduced);
}

function ch5BaseSpeed(reduced) {
  // Midnight Canopy: same fairness bar — spin base ~0.24, ~6s crest.
  return ch2Speed(reduced);
}

function ch5Speed(s) {
  const base = ch5BaseSpeed(s.reduced);
  // Mild rise ONLY after teach — crestHalf retuned in update so windows stay ~6s.
  if (s.ch5Taught) return base * 1.12;
  return base;
}

function ch6BaseSpeed(reduced) {
  // Grand Waltz: same fairness bar — spin base ~0.24, ~6s crest.
  return ch2Speed(reduced);
}

function ch6Speed(s) {
  const base = ch6BaseSpeed(s.reduced);
  // Mild rise ONLY after teach — crestHalf retuned in update so windows stay ~6s.
  // Never raise speed AND narrow windows in the same step.
  if (s.ch6Taught) return base * 1.12;
  return base;
}

function rideSpeed(s) {
  if (s.level === 1) return ch2Speed(s.reduced);
  if (s.level === 2) return ch3Speed(s.reduced);
  if (s.level === 3) return ch4Speed(s.reduced);
  if (s.level === 4) return ch5Speed(s);
  if (s.level === 5) return ch6Speed(s);
  return ch1Speed(s.reduced);
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
  s.reflections = []; // none in ch1
  s.horseMarks = null;
  s.ch2Taught = false;
  s.ch3Taught = false;
  s.firstMarked = null;
  s.firstReal = null;
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
  // Wider crest (~5.5 s); open-until finds so missing one pass is not fatal.
  const crestHalf = crestHalfFromSec(speed, 6.0); // ~6s NOW windows
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

  // Fairness retune 3: one heart-find per marked pony, stays until taken.
  // Every crest pass after from is a collect chance (still crest-TAP / NOW).
  const spots = ['saddle', 'mane', 'bridle', 'panel'];
  const heartHorses = [1, 2, 4, 1]; // 4th is spare — goal stays 3
  const openFrom = lap * 0.12; // searchable ASAP after board (third heart before waltz end)
  const rideLaps = 3; // ~fairness-bar length; sticky arm covers 3/3 inside it
  const finds = heartHorses.map((horse, i) => ({
    kind: 'ordinary',
    id: ORDINARY[i % ORDINARY.length],
    spot: spots[i % spots.length],
    horse,
    mark: 'heart',
    from: openFrom,
    until: lap * rideLaps, // open until taken / ride end
    taken: false,
    teach: i === 0,
  }));
  s.finds = finds;
  s.goal = GOAL;
  s.found = 0;
  s.lapsTotal = rideLaps;
  s.lapSec = lap;
  s.rideEnd = lap * rideLaps;
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
  s.reflections = []; // Ch2 uses decoy marks, not mirror reflections
  s.ch3Taught = false;
  s.firstReal = null;
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

/**
 * Ch3 Mirror Round — same crest TAP as Ch1/Ch2.
 * Hazard: false reflections (cool silver / dashed / horizontal flip) soft-fail on TAP.
 * First real window teaches alone; reflections unlock after first real collect (ch3Taught).
 * Sticky crest-arm auto-collects REAL finds only — never reflections.
 * Open-until finds + Ch2 retune 6 fairness; GOAL=3 reachable in one fair ~59 s run.
 */
function scheduleCh3(s) {
  const speed = ch3Speed(s.reduced);
  const lap = lapSeconds(speed);
  const crestHalf = crestHalfFromSec(speed, 6.0); // ~6s NOW windows
  s.crestHalf = crestHalf;
  s.crestSec = (2 * crestHalf) / speed;
  s.ch3Taught = false;
  s.ch2Taught = false;
  s.hitPad = HIT_R * 1.2;
  s.horseMarks = null;
  s.decoys = [];
  s.firstMarked = null;

  // Practice glint — real crest TAP only (no reflection hazard on practice lap).
  const practiceHorse = 1;
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

  function nextCrestAfter(horse, minT) {
    const phase = (horse * TAU) / HORSE_N;
    const halfT = crestHalf / speed;
    let k = Math.ceil(((minT + halfT) * speed + phase) / TAU - 1e-9);
    if (k < 1) k = 1;
    const crestT = (k * TAU - phase) / speed;
    if (crestT + halfT > lap * 2.98) return null;
    return {crestT, from: crestT - halfT, until: crestT + halfT, horse, halfT};
  }

  // Open-until real finds (same fairness as Ch2 retune 6). Sticky arm covers 3/3.
  const spots = ['saddle', 'mane', 'bridle', 'panel'];
  const realHorses = [1, 2, 4, 1]; // 4th spare — goal stays 3
  const openFrom = lap * 0.12;
  const rideLaps = 3;
  const finds = realHorses.map((horse, i) => ({
    kind: 'ordinary',
    id: ORDINARY[i % ORDINARY.length],
    spot: spots[i % spots.length],
    horse,
    from: openFrom,
    until: lap * rideLaps,
    taken: false,
    teach: i === 0,
    real: true,
  }));
  s.finds = finds;
  s.goal = GOAL;
  s.found = 0;
  s.lapsTotal = rideLaps;
  s.lapSec = lap;
  s.rideEnd = lap * rideLaps;
  s.ripples = [];
  s.sparks = [];
  s.flash = 0;
  s.firstReal = finds[0];

  // False reflections — scheduled early but gated by reflectionsLive (after teach).
  // Cool silver ghost crest glints on non-primary horses; soft-fail only, never collect.
  const halfT = crestHalf / speed;
  s.reflections = [];
  let refMin = openFrom + halfT * 1.5;
  const refPlan = [
    [3, 'panel'],
    [5, 'pole'],
    [3, 'bridle'],
    [5, 'canopy'],
    [3, 'saddle'],
    [5, 'mane'],
    [3, 'panel'],
    [5, 'pole'],
  ];
  for (let i = 0; i < refPlan.length; i++) {
    const [horse, spotId] = refPlan[i];
    const p = nextCrestAfter(horse, refMin);
    if (!p) break;
    s.reflections.push({
      kind: 'reflection',
      id: 'reflection-' + i,
      spot: spotId,
      horse,
      from: p.from,
      until: p.until,
      taken: false,
      afterTeach: true,
    });
    refMin = p.crestT + halfT * 0.35;
  }

  s.treasure = null;
  if (s.eligible && s.spawnId) {
    const spot = SPOTS.find((row) => row.id === s.spawnId) || SPOTS[0];
    // Eligible treasure is REAL (not a reflection) — prefer a real-find horse.
    let treasureHorse = spot.horse;
    if (![1, 2, 4].includes(treasureHorse)) treasureHorse = 2;
    const tp = nextCrestAfter(treasureHorse, lap * 0.9);
    const tHalf = Math.max(2.5 / 2, crestHalf / speed);
    let crestT = tp ? tp.crestT : lap * 1.6;
    if (crestT + tHalf > lap * 2.95) crestT = lap * 2.95 - tHalf;
    if (crestT - tHalf < lap * 0.9) crestT = lap * 0.9 + tHalf;
    s.treasure = {
      id: s.treasureId,
      spot: spot.id,
      horse: treasureHorse,
      real: true,
      from: crestT - tHalf,
      until: crestT + tHalf,
      taken: false,
    };
  }
}


/**
 * Ch4 Carriage Windows — same crest TAP as Ch1–Ch3.
 * Rule: finds live only while a carriage window is OPEN at the crest NOW.
 * Each carriage opens twice: teach pass (watch / no collect), then collect pass
 * (TAP collects). Collect phase is open-until across later crest visits for fairness.
 * Teach alone: first teach has no competing opens. Sticky arm collects only on
 * open collect windows. No Ch2 decoys / Ch3 reflections. GOAL=3 ~59 s.
 */
function scheduleCh4(s) {
  const speed = ch4Speed(s.reduced);
  const lap = lapSeconds(speed);
  const crestHalf = crestHalfFromSec(speed, 6.0); // ~6s NOW windows
  s.crestHalf = crestHalf;
  s.crestSec = (2 * crestHalf) / speed;
  s.ch4Taught = false;
  s.ch3Taught = false;
  s.ch2Taught = false;
  s.hitPad = HIT_R * 1.2;
  s.horseMarks = null;
  s.decoys = [];
  s.reflections = [];
  s.firstMarked = null;
  s.firstReal = null;

  const halfT = crestHalf / speed;
  // Narrower teach opens so teach-alone does not collide with the next carriage.
  const teachHalfT = Math.min(1.35, halfT * 0.45);

  function nextCrestAfter(horse, minT) {
    const phase = (horse * TAU) / HORSE_N;
    let k = Math.ceil(((minT + halfT) * speed + phase) / TAU - 1e-9);
    if (k < 1) k = 1;
    const crestT = (k * TAU - phase) / speed;
    if (crestT + halfT > lap * 2.98) return null;
    return {crestT, from: crestT - halfT, until: crestT + halfT, horse, halfT};
  }

  function nextTeachAfter(horse, minT) {
    const phase = (horse * TAU) / HORSE_N;
    let k = Math.ceil(((minT + teachHalfT) * speed + phase) / TAU - 1e-9);
    if (k < 1) k = 1;
    const crestT = (k * TAU - phase) / speed;
    if (crestT + teachHalfT > lap * 2.98) return null;
    return {
      crestT,
      from: crestT - teachHalfT,
      until: crestT + teachHalfT,
      horse,
      halfT: teachHalfT,
    };
  }

  // Practice lap — one real OPEN window glint (collectible as practice only).
  // Horse 5 crests first; first searchable teach uses a different carriage so
  // practice and teach-alone never fight for the same NOW.
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
    windowOpen: true,
  };

  const rideLaps = 3;
  // Early-crest horses so teach→collect pairs fit the ~59 s fairness bar.
  // First teach alone on horse 4 after practice ends (no competing carriage opens).
  const carriagePlan = [
    {horse: 4, spot: 'bridle'},
    {horse: 3, spot: 'panel'},
    {horse: 2, spot: 'mane'},
    {horse: 1, spot: 'saddle'}, // spare
  ];

  s.openings = [{
    kind: 'practice',
    horse: practiceHorse,
    spot: 'pole',
    from: practiceFrom,
    until: practiceUntil,
  }];
  s.carriageHorses = [5, 4, 3, 2, 1];

  // Practice (horse 5) and first teach (horse 4) crest at different times — wall-clock
  // may nearly touch, but NOW never shares a competing open. Keep teachMin early.
  let teachMin = lap * 0.08;
  const finds = [];
  for (let i = 0; i < carriagePlan.length; i++) {
    const {horse, spot} = carriagePlan[i];
    const teach = nextTeachAfter(horse, teachMin);
    if (!teach) break;
    const collect = nextCrestAfter(horse, teach.crestT + teachHalfT + 0.05);
    if (!collect) break;

    finds.push({
      kind: 'ordinary',
      id: ORDINARY[i % ORDINARY.length],
      spot,
      horse,
      from: collect.from,
      until: lap * rideLaps,
      taken: false,
      teach: i === 0,
      teachFrom: teach.from,
      teachUntil: teach.until,
      collectFrom: collect.from,
    });

    s.openings.push({
      kind: 'teach',
      horse,
      spot,
      from: teach.from,
      until: teach.until,
      findIndex: i,
    });
    // Collect open-until: every later crest of this horse opens the window.
    s.openings.push({
      kind: 'collect',
      horse,
      spot,
      from: collect.from,
      until: lap * rideLaps,
      findIndex: i,
    });

    if (i === 0) {
      // Teach alone — next carriage teach starts only after this teach ends.
      teachMin = teach.until + 0.15;
      s.firstTeach = {
        from: teach.from,
        until: teach.until,
        horse,
        spot,
        crestT: teach.crestT,
      };
      s.firstCollect = {
        from: collect.from,
        until: collect.until,
        horse,
        spot,
        crestT: collect.crestT,
      };
    } else {
      teachMin = teach.until + 0.1;
    }
  }

  s.finds = finds;
  s.goal = GOAL;
  s.found = 0;
  s.lapsTotal = rideLaps;
  s.lapSec = lap;
  s.rideEnd = lap * rideLaps;
  s.ripples = [];
  s.sparks = [];
  s.flash = 0;

  s.treasure = null;
  if (s.eligible && s.spawnId) {
    const spot = SPOTS.find((row) => row.id === s.spawnId) || SPOTS[0];
    // Treasure only on a COLLECT pass — prefer a carriage horse after its teach.
    let treasureHorse = spot.horse;
    if (![5, 4, 3, 2].includes(treasureHorse)) treasureHorse = 4;
    const firstCollectFrom = (finds[0] && finds[0].collectFrom) || lap * 0.9;
    const tp = nextCrestAfter(treasureHorse, Math.max(firstCollectFrom, lap * 0.85));
    const tHalf = Math.max(2.5 / 2, crestHalf / speed);
    let crestT = tp ? tp.crestT : lap * 1.6;
    if (crestT + tHalf > lap * 2.95) crestT = lap * 2.95 - tHalf;
    if (crestT - tHalf < firstCollectFrom) crestT = firstCollectFrom + tHalf;
    s.treasure = {
      id: s.treasureId,
      spot: spot.id,
      horse: treasureHorse,
      from: crestT - tHalf,
      until: crestT + tHalf,
      taken: false,
      collectPass: true,
    };
    s.openings.push({
      kind: 'collect',
      horse: treasureHorse,
      spot: spot.id,
      from: crestT - tHalf,
      until: crestT + tHalf,
      treasure: true,
    });
  }
}


/**
 * Ch5 Midnight Canopy — same crest TAP as Ch1–Ch4.
 * Rule: canopy treasures hang HIGH above the crest, then DIP into crest NOW.
 * TAP collects only while the find is in the crest band; TAP while still too-high
 * = soft-fail (tooHigh). Teach alone: first canopy find with chrome; after
 * ch5Taught more finds + mild speed rise (windows stay ~6 s). No Ch2/Ch3/Ch4
 * hazards. Open-until + sticky arm; GOAL=3 reachable ~59 s.
 */
function scheduleCh5(s) {
  const speed = ch5BaseSpeed(s.reduced);
  const lap = lapSeconds(speed);
  const crestHalf = crestHalfFromSec(speed, 6.0); // ~6s NOW windows
  s.crestHalf = crestHalf;
  s.crestSec = (2 * crestHalf) / speed;
  s.ch5Taught = false;
  s.ch5CrestRetuned = false;
  s.ch4Taught = false;
  s.ch3Taught = false;
  s.ch2Taught = false;
  s.hitPad = HIT_R * 1.2;
  s.horseMarks = null;
  s.decoys = [];
  s.reflections = [];
  s.openings = [];
  s.carriageHorses = [];
  s.firstMarked = null;
  s.firstReal = null;
  s.firstTeach = null;
  s.firstCollect = null;

  const halfT = crestHalf / speed;

  function nextCrestAfter(horse, minT) {
    const phase = (horse * TAU) / HORSE_N;
    let k = Math.ceil(((minT + halfT) * speed + phase) / TAU - 1e-9);
    if (k < 1) k = 1;
    const crestT = (k * TAU - phase) / speed;
    if (crestT + halfT > lap * 2.98) return null;
    return {crestT, from: crestT - halfT, until: crestT + halfT, horse, halfT};
  }

  // Practice lap — one canopy dip glint (collectible as practice only).
  const practiceHorse = 5;
  const practiceCrestT = (TAU - (practiceHorse * TAU) / HORSE_N) / speed;
  const practiceFrom = Math.max(0.2, practiceCrestT - halfT);
  const practiceUntil = practiceCrestT + halfT;
  s.practiceGlint = {
    kind: 'practice',
    id: 'practice-canopy',
    spot: 'canopy',
    horse: practiceHorse,
    from: practiceFrom,
    until: practiceUntil,
    taken: false,
    canopy: true,
  };

  const rideLaps = 3;
  // Early-crest horses so teach + two more collects fit the ~59 s fairness bar.
  // First teach alone on horse 4 (no competing canopy finds until ch5Taught).
  const canopyPlan = [
    {horse: 4, spot: 'canopy', teach: true},
    {horse: 3, spot: 'canopy', afterTeach: true},
    {horse: 2, spot: 'canopy', afterTeach: true},
    {horse: 1, spot: 'canopy', afterTeach: true}, // spare
  ];

  const openFrom = lap * 0.12;
  const finds = [];
  for (let i = 0; i < canopyPlan.length; i++) {
    const {horse, spot, teach, afterTeach} = canopyPlan[i];
    finds.push({
      kind: 'ordinary',
      id: ORDINARY[i % ORDINARY.length],
      spot,
      horse,
      from: openFrom,
      until: lap * rideLaps,
      taken: false,
      teach: !!teach,
      afterTeach: !!afterTeach,
      canopy: true,
    });
  }
  s.finds = finds;
  s.goal = GOAL;
  s.found = 0;
  s.lapsTotal = rideLaps;
  s.lapSec = lap;
  s.rideEnd = lap * rideLaps;
  s.ripples = [];
  s.sparks = [];
  s.flash = 0;
  s.firstCanopy = finds[0];
  // Approximate first crest window for warn / chrome (open-until; sticky covers later).
  const firstWin = nextCrestAfter(4, openFrom);
  s.firstCanopyCrest = firstWin
    ? {from: firstWin.from, until: firstWin.until, horse: 4, crestT: firstWin.crestT}
    : {from: openFrom, until: openFrom + 6, horse: 4, crestT: openFrom + 3};

  s.treasure = null;
  if (s.eligible && s.spawnId) {
    const spot = SPOTS.find((row) => row.id === s.spawnId) || SPOTS.find((r) => r.id === 'canopy') || SPOTS[0];
    let treasureHorse = spot.horse;
    if (![4, 3, 2, 1].includes(treasureHorse)) treasureHorse = 3;
    const tp = nextCrestAfter(treasureHorse, Math.max(openFrom + halfT, lap * 0.85));
    const tHalf = Math.max(2.5 / 2, halfT);
    let crestT = tp ? tp.crestT : lap * 1.6;
    if (crestT + tHalf > lap * 2.95) crestT = lap * 2.95 - tHalf;
    if (crestT - tHalf < openFrom) crestT = openFrom + tHalf;
    s.treasure = {
      id: s.treasureId,
      spot: spot.id === 'canopy' ? 'canopy' : spot.id,
      horse: treasureHorse,
      from: crestT - tHalf,
      until: crestT + tHalf,
      taken: false,
      canopy: true,
    };
  }
}


/**
 * Ch6 The Grand Waltz — same crest TAP as Ch1–Ch5.
 * Combines ONLY taught rules across rotations (sequential hazard types):
 *   heart marks (Ch2), mirror ghosts (Ch3), open windows (Ch4), canopy dips (Ch5),
 *   mild speed rise after teach (crest windows stay ~6 s).
 * Rising platforms = slightly higher horse bob (visual); still crest TAP.
 * Guarantee: find[0] (teach heart) is open-until so its crest window repeats
 * every rotation — miss first pass → second chance on the same eligible slot.
 * Teach alone ~10–15 s: clear real heart + chrome naming the mix; no overlapping
 * hazards on first collect. Sticky crest-arm; soft-fails never abort.
 * GOAL=3 reachable ~59–70 s.
 */
function scheduleCh6(s) {
  const speed = ch6BaseSpeed(s.reduced);
  const lap = lapSeconds(speed);
  const crestHalf = crestHalfFromSec(speed, 6.0); // ~6s NOW windows
  s.crestHalf = crestHalf;
  s.crestSec = (2 * crestHalf) / speed;
  s.ch6Taught = false;
  s.ch6CrestRetuned = false;
  s.ch5Taught = false;
  s.ch4Taught = false;
  s.ch3Taught = false;
  s.ch2Taught = false;
  s.hitPad = HIT_R * 1.2;
  s.markedMark = 'heart';

  // Heart = valid; crescent/star = decoy soft-fails after teach.
  s.horseMarks = {
    1: 'heart',
    2: 'heart',
    3: 'crescent',
    4: 'heart',
    5: 'star',
  };

  const halfT = crestHalf / speed;

  function nextCrestAfter(horse, minT) {
    const phase = (horse * TAU) / HORSE_N;
    let k = Math.ceil(((minT + halfT) * speed + phase) / TAU - 1e-9);
    if (k < 1) k = 1;
    const crestT = (k * TAU - phase) / speed;
    if (crestT + halfT > lap * 2.98) return null;
    return {crestT, from: crestT - halfT, until: crestT + halfT, horse, halfT};
  }

  // Practice lap — one safe early crest glint (no hazards / no keepsakes).
  const practiceHorse = 5;
  const practiceCrestT = (TAU - (practiceHorse * TAU) / HORSE_N) / speed;
  const practiceFrom = Math.max(0.2, practiceCrestT - halfT);
  const practiceUntil = practiceCrestT + halfT;
  s.practiceGlint = {
    kind: 'practice',
    id: 'practice-waltz',
    spot: 'pole',
    horse: practiceHorse,
    from: practiceFrom,
    until: practiceUntil,
    taken: false,
    mark: 'heart',
    windowOpen: true,
  };

  const rideLaps = 3;
  const openFrom = lap * 0.12;

  // Sequential rule beats (denser than Ch4, still readable — not all four at once):
  // 0 teach alone: heart real (open-until = GUARANTEED eligible window REPEAT)
  // 1 after teach: open-window collect (carriage)
  // 2 after teach: canopy high→dip
  // 3 after teach: spare heart (mirrors/decoys live nearby)
  s.openings = [{
    kind: 'practice',
    horse: practiceHorse,
    spot: 'saddle',
    from: practiceFrom,
    until: practiceUntil,
  }];
  s.carriageHorses = [2];

  const finds = [];

  // 0) Teach heart — horse 4, open-until, guaranteed crest repeat each lap.
  finds.push({
    kind: 'ordinary',
    id: ORDINARY[0],
    spot: 'bridle',
    horse: 4,
    mark: 'heart',
    from: openFrom,
    until: lap * rideLaps,
    taken: false,
    teach: true,
    afterTeach: false,
    needsWindow: false,
    canopy: false,
    real: true,
    repeatGuaranteed: true,
  });

  // 1) Window-gated heart — horse 2.
  // First crest after teach alone = SHUT (soft-fail opportunity); next crest opens
  // collect open-until (teach→collect pattern from Ch4, without stacking other hazards).
  {
    const horse = 2;
    const spot = 'mane';
    const shutPass = nextCrestAfter(horse, openFrom + halfT + 0.4);
    const collectPass = shutPass
      ? nextCrestAfter(horse, shutPass.until + 0.05)
      : nextCrestAfter(horse, openFrom + lap * 0.55);
    const from = collectPass ? collectPass.from : (openFrom + lap * 0.7);
    finds.push({
      kind: 'ordinary',
      id: ORDINARY[1],
      spot,
      horse,
      mark: 'heart',
      from: shutPass ? shutPass.from : from, // visible on shut pass too (not collectible)
      until: lap * rideLaps,
      taken: false,
      teach: false,
      afterTeach: true,
      needsWindow: true,
      canopy: false,
      real: true,
      shutUntil: shutPass ? shutPass.until : null,
    });
    s.openings.push({
      kind: 'collect',
      horse,
      spot,
      from,
      until: lap * rideLaps,
      findIndex: 1,
    });
  }

  // 2) Canopy dip — horse 1; hang high then dip into NOW.
  // from=openFrom (afterTeach-gated) so TAP while approaching = tooHigh soft-fail,
  // matching Ch5 open-until pattern.
  {
    const horse = 1;
    const spot = 'canopy';
    finds.push({
      kind: 'ordinary',
      id: ORDINARY[2],
      spot,
      horse,
      mark: 'heart',
      from: openFrom,
      until: lap * rideLaps,
      taken: false,
      teach: false,
      afterTeach: true,
      needsWindow: false,
      canopy: true,
      real: true,
    });
  }

  // 3) Spare heart — horse 4 again later band (also benefits from open-until repeat).
  {
    const horse = 4;
    const spot = 'panel';
    finds.push({
      kind: 'ordinary',
      id: ORDINARY[0],
      spot,
      horse,
      mark: 'heart',
      from: openFrom + lap * 0.55,
      until: lap * rideLaps,
      taken: false,
      teach: false,
      afterTeach: true,
      needsWindow: false,
      canopy: false,
      real: true,
    });
  }

  s.finds = finds;
  s.goal = GOAL;
  s.found = 0;
  s.lapsTotal = rideLaps;
  s.lapSec = lap;
  s.rideEnd = lap * rideLaps;
  s.ripples = [];
  s.sparks = [];
  s.flash = 0;
  s.firstMarked = finds[0];
  s.firstReal = finds[0];
  s.firstTeach = null;
  s.firstCollect = null;
  s.firstCanopy = finds[2] || null;
  s.firstWaltz = finds[0];
  const firstWin = nextCrestAfter(4, openFrom);
  s.firstWaltzCrest = firstWin
    ? {from: firstWin.from, until: firstWin.until, horse: 4, crestT: firstWin.crestT}
    : {from: openFrom, until: openFrom + 6, horse: 4, crestT: openFrom + 3};

  // Document guaranteed eligible-window repeat: horse 4 crest after firstWin.
  const repeatWin = firstWin
    ? nextCrestAfter(4, firstWin.until + 0.05)
    : nextCrestAfter(4, openFrom + lap * 0.9);
  s.guaranteedRepeat = {
    horse: 4,
    spot: 'bridle',
    findIndex: 0,
    firstFrom: s.firstWaltzCrest.from,
    firstUntil: s.firstWaltzCrest.until,
    repeatFrom: repeatWin ? repeatWin.from : null,
    repeatUntil: repeatWin ? repeatWin.until : null,
  };

  // Mirror ghosts — horse 3 only, early short windows after teach (sequential vs decoys).
  s.reflections = [];
  const reflectionPlan = [
    [3, 'panel'],
    [3, 'saddle'],
  ];
  for (let i = 0; i < reflectionPlan.length; i++) {
    const [horse, spot] = reflectionPlan[i];
    const win = nextCrestAfter(horse, openFrom + halfT * 0.15 + i * 0.2);
    if (!win) continue;
    s.reflections.push({
      kind: 'reflection',
      id: 'reflection-' + i,
      spot,
      horse,
      from: win.from,
      until: win.until, // one crest pass
      taken: false,
      afterTeach: true,
    });
  }

  // Decoy marks — horse 5 only, next crest band (no overlap with horse-3 mirrors).
  s.decoys = [];
  const decoyPlan = [
    [5, 'star', 'pole'],
    [5, 'crescent', 'canopy'],
  ];
  for (let i = 0; i < decoyPlan.length; i++) {
    const [horse, mark, spotId] = decoyPlan[i];
    const win = nextCrestAfter(horse, openFrom + halfT + 0.5 + i * 0.25);
    if (!win) continue;
    s.decoys.push({
      kind: 'decoy',
      id: 'decoy-' + mark + '-' + i,
      spot: spotId,
      horse,
      mark,
      from: win.from,
      until: win.until,
      taken: false,
      afterTeach: true,
    });
  }

  s.treasure = null;
  if (s.eligible && s.spawnId) {
    const spot = SPOTS.find((row) => row.id === s.spawnId) || SPOTS[0];
    let treasureHorse = spot.horse;
    if (![4, 2, 1].includes(treasureHorse)) treasureHorse = 4;
    const tp = nextCrestAfter(treasureHorse, Math.max(openFrom + halfT, lap * 0.85));
    const tHalf = Math.max(2.5 / 2, halfT);
    let crestT = tp ? tp.crestT : lap * 1.6;
    if (crestT + tHalf > lap * 2.95) crestT = lap * 2.95 - tHalf;
    if (crestT - tHalf < openFrom) crestT = openFrom + tHalf;
    s.treasure = {
      id: s.treasureId,
      spot: spot.id,
      horse: treasureHorse,
      mark: 'heart',
      from: crestT - tHalf,
      until: crestT + tHalf,
      taken: false,
      real: true,
    };
  }
}

function scheduleForLevel(s) {
  // 0 → Ch1; 1 → Ch2; 2 → Ch3; 3 → Ch4; 4 → Ch5; 5 → Ch6 Grand Waltz.
  if (s.level === 1) scheduleCh2(s);
  else if (s.level === 2) scheduleCh3(s);
  else if (s.level === 3) scheduleCh4(s);
  else if (s.level === 4) scheduleCh5(s);
  else if (s.level === 5) scheduleCh6(s);
  else scheduleCh1(s); // level 0 First Turn
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
  // Ch5/Ch6: horse bob slightly higher (rising platforms / eyes-up canopy read).
  const rise = s.level === 4 || s.level === 5;
  const bobAmp = rise ? (s.reduced ? 5 : 12) : (s.reduced ? 3 : 8);
  const bob = Math.sin(s.angle * 2 + horse) * bobAmp;
  // Crest height curve: lift glint as it enters front (Mario jump arc feel).
  const n = crestNorm(horse, s.angle, s.crestHalf || 0.6);
  const crestLift = -18 * n;
  // Ch5 / Ch6 canopy finds: hang HIGH above crest, then DIP into NOW.
  let canopyDip = 0;
  const canopySpot = s.level === 4 || (s.level === 5 && spot.id === 'canopy');
  if (canopySpot) {
    const highLift = -92;
    canopyDip = highLift * (1 - n * n) - 18;
  }
  return {
    x: h.x + (spot.ox || 0) * h.scale,
    y: h.y + bob + (spot.oy || 0) * h.scale + crestLift + canopyDip,
    reachable: inCrest(horse, s.angle, s.crestHalf || 0.6),
    scale: h.scale,
    crest: n,
    horse,
    tooHigh: canopySpot && n < 0.12,
  };
}

function itemActive(item, t) {
  return item && !item.taken && t >= item.from && t <= item.until;
}

/** Ch5/Ch6: after-teach canopy (or waltz) finds stay hidden until first teach collect. */
function canopyFindLive(s, item) {
  if (!itemActive(item, s.t)) return false;
  if (s.level === 4 && item.afterTeach && !s.ch5Taught) return false;
  if (s.level === 5 && item.afterTeach && !s.ch6Taught) return false;
  return true;
}

/** Ch6: after-teach finds stay hidden until Grand Waltz teach collect. */
function waltzFindLive(s, item) {
  if (!itemActive(item, s.t)) return false;
  if (s.level === 5 && item.afterTeach && !s.ch6Taught) return false;
  return true;
}

/** Ch4: which opening is live for a horse right now (crest + time). */
function liveOpeningForHorse(s, horse) {
  const t = s.t || 0;
  const half = s.crestHalf || 0.6;
  if (horse == null || !inCrest(horse, s.angle, half)) return null;
  const opens = (s.openings || []).filter((op) =>
    op.horse === horse && t >= op.from && t <= op.until);
  if (!opens.length) return null;
  // Prefer collect over teach when both somehow overlap.
  return opens.find((op) => op.kind === 'collect' || op.kind === 'practice')
    || opens[0];
}

function horseWindowOpen(s, horse) {
  return !!liveOpeningForHorse(s, horse);
}

function teachOpeningLive(s) {
  const t = s.t || 0;
  const half = s.crestHalf || 0.6;
  return (s.openings || []).find((op) =>
    op.kind === 'teach'
    && t >= op.from && t <= op.until
    && inCrest(op.horse, s.angle, half)) || null;
}

function shutCarriageAtCrest(s) {
  if (s.level !== 3 && s.level !== 5) return null;
  const half = s.crestHalf || 0.6;
  for (const horse of (s.carriageHorses || [])) {
    if (!inCrest(horse, s.angle, half)) continue;
    if (!horseWindowOpen(s, horse)) return horse;
  }
  return null;
}

/** Collectable only while carrier is inside the crest sweet-spot. */
function itemInCrestWindow(item, s) {
  // Ch5: gate after-teach finds until first canopy collect.
  // Ch6: gate after-teach finds until Grand Waltz teach collect.
  if (s.level === 4) {
    if (!canopyFindLive(s, item)) return false;
  } else if (s.level === 5) {
    if (!waltzFindLive(s, item)) return false;
  } else if (!itemActive(item, s.t)) {
    return false;
  }
  const horse = item.horse != null ? item.horse : (SPOTS.find((r) => r.id === item.spot) || {}).horse;
  if (horse == null) return false;
  if (!inCrest(horse, s.angle, s.crestHalf || 0.6)) return false;
  // Ch4 / Ch6 window-gated finds: live only while a COLLECT (or practice) window is open.
  if (s.level === 3 || (s.level === 5 && item.needsWindow)) {
    if (item.kind === 'practice' || item.windowOpen) return true;
    const op = liveOpeningForHorse(s, horse);
    if (!op) return false;
    if (op.kind === 'teach') return false;
    if (op.kind === 'collect' || op.kind === 'practice') return true;
    return false;
  }
  // Ch5 / Ch6 canopy: crest NOW band only — too-high approach is not collectible.
  return true;
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
    // Chain fairness: each heart collect re-arms so a 2/3 run still reaches 3/3.
    if (s.found < (s.goal || GOAL)) armCrestTap(s, 20);
  }
  if (s.level === 2) {
    if (!s.ch3Taught) {
      s.ch3Taught = true;
      logAction(s, 'teach', {kind: 'real-crest'});
    }
    // Chain fairness: sticky re-arm until goal (reflections never auto-collect).
    if (s.found < (s.goal || GOAL)) armCrestTap(s, 20);
  }
  if (s.level === 3) {
    if (!s.ch4Taught) {
      s.ch4Taught = true;
      logAction(s, 'teach', {kind: 'carriage-window'});
    }
    // Chain fairness: sticky re-arm until goal (shut/teach never auto-collect).
    if (s.found < (s.goal || GOAL)) armCrestTap(s, 20);
  }
  if (s.level === 4) {
    if (!s.ch5Taught) {
      s.ch5Taught = true;
      logAction(s, 'teach', {kind: 'canopy-dip'});
    }
    // Chain fairness: sticky re-arm until goal (too-high never auto-collect).
    if (s.found < (s.goal || GOAL)) armCrestTap(s, 20);
  }
  if (s.level === 5) {
    if (!s.ch6Taught) {
      s.ch6Taught = true;
      logAction(s, 'teach', {kind: 'grand-waltz'});
    }
    // Sticky re-arm until goal — only VALID finds auto-collect (gated in itemInCrestWindow).
    if (s.found < (s.goal || GOAL)) armCrestTap(s, 20);
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
      : (s.level === 2
        ? (s.found + ' of ' + s.goal + ' — real crests only.')
        : (s.level === 3
          ? (s.found + ' of ' + s.goal + ' — open windows only.')
          : (s.level === 4
            ? (s.found + ' of ' + s.goal + ' — canopy dips into NOW.')
            : (s.level === 5
              ? (s.found + ' of ' + s.goal + ' — every rule you’ve learned.')
              : (s.found + ' of ' + s.goal + ' ordinary finds.'))))));
  s.statusKind = 'found';
  return true;
}

function decoysLive(s) {
  // Ch2: soft-hazard decoys only AFTER 3/3 — never steal taps during the fairness bar.
  // Ch6: decoys after teach (during fairness) — sticky arm ignores them; soft-fail only.
  if (s.level === 5) return !!s.ch6Taught;
  return s.level === 1 && !!s.ch2Taught && (s.found || 0) >= (s.goal || GOAL);
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

function reflectionsLive(s) {
  // Mirror ghosts only AFTER first real collect teaches the rule.
  // Practice-lap practiceGlint itself never spawns reflections (separate item).
  // Ch6: after Grand Waltz teach — soft-fail only; sticky arm never auto-collects them.
  if (s.level === 5) return !!s.ch6Taught;
  return s.level === 2 && !!s.ch3Taught;
}

function softFailReflection(s, reflection, scr) {
  logAction(s, 'miss', {
    reason: 'reflection',
    horse: reflection.horse,
    spot: reflection.spot,
    x: scr ? Math.round(scr.x) : 0,
    y: scr ? Math.round(scr.y) : 0,
  });
  s.note = 'Mirror ghost — ' + TEACH_MIRROR + '. Ride continues.';
  s.statusKind = 'miss';
  s.reflectionFlash = 0.55;
  s.reflectionFlashX = scr ? scr.x : CX;
  s.reflectionFlashY = scr ? scr.y : CY;
  return 'miss';
}

function softFailWindow(s, reason, horse, scr) {
  logAction(s, 'miss', {
    reason: reason || 'shut',
    horse: horse != null ? horse : null,
    x: scr ? Math.round(scr.x) : 0,
    y: scr ? Math.round(scr.y) : 0,
  });
  if (reason === 'teach') {
    s.note = TEACH_WINDOW + '. Ride continues.';
  } else if (reason === 'early') {
    s.note = 'Too early — wait for an open window at NOW.';
  } else {
    s.note = 'Window shut — TAP only while open at NOW. Ride continues.';
  }
  s.statusKind = 'miss';
  s.windowFlash = 0.55;
  s.windowFlashX = scr ? scr.x : CX;
  s.windowFlashY = scr ? scr.y : CY;
  return 'miss';
}

function softFailTooHigh(s, horse, scr) {
  logAction(s, 'miss', {
    reason: 'tooHigh',
    horse: horse != null ? horse : null,
    x: scr ? Math.round(scr.x) : 0,
    y: scr ? Math.round(scr.y) : 0,
  });
  s.note = 'Still high — ' + TEACH_CANOPY + '. Ride continues.';
  s.statusKind = 'miss';
  s.canopyFlash = 0.55;
  s.canopyFlashX = scr ? scr.x : CX;
  s.canopyFlashY = scr ? scr.y : (CY - 80);
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

function drawCanopy(d, cx, cy, swayX, swayY, t, reduced, night) {
  const px = cx + swayX * 0.25;
  const py = cy + swayY * 0.25;
  d.ellipse(px, py - 160, 280, 160, night ? '#0a122422' : '#4a182422');

  d.poly(
    [[px - 220, py - 290], [px + 220, py - 290], [px + 260, py - 36], [px - 260, py - 36]],
    night ? '#1a203866' : '#6b203066',
    night ? '#7ec8b0' : '#d2a65b',
    3.5,
  );
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI + (i * Math.PI) / 7;
    d.line(
      {x: px, y: py - 36},
      {x: px + Math.cos(a) * 248, y: py - 36 + Math.sin(a) * 74},
      night ? '#7ec8b088' : '#d2a65baa',
      2.2,
    );
  }
  d.ellipse(px, py - 310, 236, 52, night ? '#12182888' : '#4a182488', night ? '#c8e8d8' : '#f0d09a', 3.5);

  const flick = reduced ? 1 : (0.82 + 0.18 * Math.sin((t || 0) * 5.2));
  const flick2 = reduced ? 1 : (0.78 + 0.22 * Math.sin((t || 0) * 6.1 + 1.4));
  if (night) {
    // Dim lanterns — Midnight Canopy.
    d.glow(px - 120, py - 250, 22 * flick, '#7ec8b0');
    d.glow(px + 120, py - 250, 22 * flick2, '#7ec8b0');
    d.glow(px, py - 285, 28 * (0.9 + 0.1 * flick), '#d2a65b');
    d.circle(px - 120, py - 248, 5, '#2a3848', '#7ec8b0', 1.2);
    d.circle(px + 120, py - 248, 5, '#2a3848', '#7ec8b0', 1.2);
    // Night canopy ornaments — gold/teal paper-cut fringe.
    for (let i = 0; i < 5; i++) {
      const ox = px - 140 + i * 70;
      const oy = py - 210 - (i % 2) * 18;
      const pulse = reduced ? 1 : (0.85 + 0.15 * Math.sin((t || 0) * 3.4 + i));
      d.glow(ox, oy, 14 * pulse, i % 2 ? '#7ec8b0' : '#d2a65b');
      d.poly(
        [[ox, oy - 10], [ox + 8, oy], [ox, oy + 10], [ox - 8, oy]],
        i % 2 ? '#1a3840' : '#3a2818',
        i % 2 ? '#7ec8b0' : '#d2a65b',
        1.6,
      );
    }
  } else {
    d.glow(px - 120, py - 250, 40 * flick, '#f4c878');
    d.glow(px + 120, py - 250, 40 * flick2, '#f4c878');
    d.glow(px, py - 285, 50 * (0.9 + 0.1 * flick), '#ffe6a4');
    d.circle(px - 120, py - 248, 7, '#f8e4b3', '#d2a65b', 1.5);
    d.circle(px + 120, py - 248, 7, '#f8e4b3', '#d2a65b', 1.5);
  }

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



/** Tiny crest-adjacent cue — not a full-width teach panel / permanent bar. */
function drawCrestAdjacentCue(d, primary, secondary, fade, accent) {
  if (!primary || fade < 0.05) return;
  const y = CY + 112;
  const h = secondary ? 38 : 28;
  const w = Math.min(560, secondary ? 500 : 400);
  const x0 = CX - w / 2;
  d.poly(
    [[x0, y], [x0 + w, y], [x0 + w, y + h], [x0, y + h]],
    `rgba(12,10,18,${0.7 * fade})`,
    accent || '#d2a65b',
    1.5,
  );
  d.text(primary, CX, y + (secondary ? 15 : 19), secondary ? 13 : 14, `rgba(255,230,164,${fade})`);
  if (secondary) d.text(secondary, CX, y + 32, 11, `rgba(240,208,154,${0.92 * fade})`);
}



/** Ch2 teach-alone chrome — brief crest-adjacent. No LOOK / TAP glyph. */
function drawCh2MarkChrome(d, s) {
  if (s.level !== 1) return;
  if (s.ch2Taught) return;
  const t = s.t || 0;
  const lap0 = s.practice && Math.floor(t / (s.lapSec || 1)) === 0;

  let show = false;
  let fade = 1;
  if (lap0 && t >= VERB_SEC && t < VERB_SEC + CH2_TEACH_CHROME) {
    show = true;
    const end = VERB_SEC + CH2_TEACH_CHROME;
    fade = t < end - 0.6 ? 1 : Math.max(0, (end - t) / 0.6);
  }

  const first = s.firstMarked;
  if (!s.practice && first && !first.taken) {
    const lead = first.from - t;
    if (lead <= CH2_MARK_WARN && t <= first.until + 0.2) {
      show = true;
      fade = lead > 0 ? 1 : Math.max(0.35, 1 - (t - first.from) / Math.max(0.4, first.until - first.from));
    }
  }

  if (!s.practice && !s.ch2Taught && t < CH2_TEACH_CHROME) {
    show = true;
    fade = t < CH2_TEACH_CHROME - 0.6 ? 1 : Math.max(0, (CH2_TEACH_CHROME - t) / 0.6);
  }

  if (!show || fade < 0.05) return;
  drawCrestAdjacentCue(d, TEACH_MARKED, 'gold heart saddle', fade, '#d2a65b');
}

/** Dashed silver ring — learnable false-reflection cue (6-digit glow only). */
function drawDashedRing(d, x, y, r, color, segs = 14) {
  for (let i = 0; i < segs; i++) {
    if (i % 2) continue;
    const a0 = (i / segs) * Math.PI * 2;
    const a1 = ((i + 0.72) / segs) * Math.PI * 2;
    d.arc(x, y, r, a0, a1, color, 2.4);
  }
}

/** False reflection crest glint — cool silver, dashed ring, horizontal flip cue. */
function drawReflectionGlint(d, scr, t) {
  if (!scr) return;
  const pulse = 1 + 0.08 * Math.sin((t || 0) * 6.5);
  const n = scr.crest || 0;
  // Ghost position hint: slight horizontal flip offset of inner art about glint center.
  d.glow(scr.x, scr.y, (n > 0.02 ? 48 : 30) * pulse, '#b8c4d4');
  drawDashedRing(d, scr.x, scr.y, 26 * pulse, '#c8d0e0');
  d.circle(scr.x, scr.y, 12, 'rgba(168,184,200,0.28)', '#c8d0e0', 2);
  // Horizontal-flip chevrons (mirror cue) — drawn flipped left/right.
  const fx = 10;
  d.poly(
    [[scr.x + fx, scr.y - 11], [scr.x - 2, scr.y], [scr.x + fx, scr.y + 11]],
    null,
    '#c8d0e0',
    2.2,
  );
  d.poly(
    [[scr.x - fx, scr.y - 11], [scr.x + 2, scr.y], [scr.x - fx, scr.y + 11]],
    null,
    '#a8b8c8',
    1.6,
  );
  if (n > 0.35) {
    const fade = Math.min(1, (n - 0.35) / 0.4);
    d.poly(
      [[scr.x - 52, scr.y - 66], [scr.x + 52, scr.y - 66], [scr.x + 52, scr.y - 34], [scr.x - 52, scr.y - 34]],
      `rgba(26,32,48,${0.88 * fade})`,
      '#c8d0e0',
      2,
    );
    d.text('MIRROR', scr.x, scr.y - 42, 18, `rgba(200,208,224,${fade})`);
  }
}

/** Ch3 teach-alone chrome — brief crest-adjacent. No LOOK verb. */
function drawCh3MirrorChrome(d, s) {
  if (s.level !== 2) return;
  if (s.ch3Taught) return;
  const t = s.t || 0;
  const lap0 = s.practice && Math.floor(t / (s.lapSec || 1)) === 0;

  let show = false;
  let fade = 1;
  if (lap0 && t >= VERB_SEC && t < VERB_SEC + CH3_TEACH_CHROME) {
    show = true;
    const end = VERB_SEC + CH3_TEACH_CHROME;
    fade = t < end - 0.6 ? 1 : Math.max(0, (end - t) / 0.6);
  }

  const first = s.firstReal;
  if (!s.practice && first && !first.taken) {
    const lead = first.from - t;
    if (lead <= CH3_REAL_WARN && t <= first.until + 0.2) {
      show = true;
      fade = lead > 0 ? 1 : Math.max(0.35, 1 - (t - first.from) / Math.max(0.4, first.until - first.from));
    }
  }

  if (!s.practice && !s.ch3Taught && t < CH3_TEACH_CHROME) {
    show = true;
    fade = t < CH3_TEACH_CHROME - 0.6 ? 1 : Math.max(0, (CH3_TEACH_CHROME - t) / 0.6);
  }

  if (!show || fade < 0.05) return;
  drawCrestAdjacentCue(d, TEACH_MIRROR, 'skip mirror ghosts', fade, '#d2a65b');
}

/** Paper-cut carriage window on a crest horse — gold/burgundy frame; open = bright interior. */
function drawCarriageWindow(d, x, y, sc, open, teach) {
  const fx = x - 6 * sc;
  const fy = y - 10 * sc;
  const w = 22 * sc;
  const h = 28 * sc;
  // Burgundy body + gold frame (6-digit glow only).
  d.poly(
    [[fx, fy], [fx + w, fy], [fx + w, fy + h], [fx, fy + h]],
    '#4a1828',
    '#d2a65b',
    2.2,
  );
  d.poly(
    [[fx + 2 * sc, fy + 2 * sc], [fx + w - 2 * sc, fy + 2 * sc], [fx + w - 2 * sc, fy + h - 2 * sc], [fx + 2 * sc, fy + h - 2 * sc]],
    open ? (teach ? '#3a2a18' : '#fff6d8') : '#1a1018',
    '#d2a65b',
    1.4,
  );
  if (open) {
    d.glow(fx + w * 0.5, fy + h * 0.45, 18 * sc, teach ? '#f0d09a' : '#ffe6a4');
    if (!teach) {
      d.circle(fx + w * 0.5, fy + h * 0.42, 4 * sc, '#ffe6a4', '#d2a65b', 1.2);
    } else {
      d.text('…', fx + w * 0.5, fy + h * 0.55, Math.max(10, 12 * sc), '#ead6a4');
    }
  } else {
    // Shut sash.
    d.line({x: fx + 2 * sc, y: fy + h * 0.5}, {x: fx + w - 2 * sc, y: fy + h * 0.5}, '#6b2030', 2);
    d.line({x: fx + w * 0.5, y: fy + 2 * sc}, {x: fx + w * 0.5, y: fy + h - 2 * sc}, '#6b2030', 2);
  }
}

function drawCh4WindowChrome(d, s) {
  if (s.level !== 3) return;
  const t = s.t || 0;
  const lap0 = s.practice && Math.floor(t / (s.lapSec || 1)) === 0;
  let show = false;
  let fade = 1;

  if (lap0 && t >= VERB_SEC && t < VERB_SEC + CH4_TEACH_CHROME) {
    show = true;
    const end = VERB_SEC + CH4_TEACH_CHROME;
    fade = t < end - 0.6 ? 1 : Math.max(0, (end - t) / 0.6);
  }

  const first = s.firstTeach;
  if (!s.practice && first && t <= first.until + 0.35) {
    const lead = first.from - t;
    if (lead <= CH4_WINDOW_WARN) {
      show = true;
      fade = lead > 0 ? 1 : Math.max(0.35, 1 - (t - first.from) / Math.max(0.4, first.until - first.from));
    }
  }

  if (!s.practice && !s.ch4Taught && t < CH4_TEACH_CHROME) {
    show = true;
    fade = t < CH4_TEACH_CHROME - 0.6 ? 1 : Math.max(0, (CH4_TEACH_CHROME - t) / 0.6);
  }

  // During a live teach open, reinforce the watch cue.
  const teachOp = teachOpeningLive(s);
  if (teachOp) {
    show = true;
    fade = 1;
  }

  if (!show || fade < 0.05) return;
  drawCrestAdjacentCue(d, TEACH_WINDOW, 'open at NOW · shut never', fade, '#d2a65b');
}

/** Paper-cut gold/teal canopy ornament — distinct from hearts / silver ghosts / windows. */
function drawCanopyOrnament(d, x, y, sc, lit) {
  const s = Math.max(0.7, sc || 1);
  if (lit) d.glow(x, y, 20 * s, '#7ec8b0');
  d.glow(x, y, 12 * s, '#d2a65b');
  d.poly(
    [[x, y - 14 * s], [x + 10 * s, y - 2 * s], [x + 6 * s, y + 12 * s], [x - 6 * s, y + 12 * s], [x - 10 * s, y - 2 * s]],
    '#1a3040',
    '#7ec8b0',
    2,
  );
  d.poly(
    [[x, y - 8 * s], [x + 5 * s, y], [x, y + 7 * s], [x - 5 * s, y]],
    '#3a2818',
    '#d2a65b',
    1.5,
  );
  d.circle(x, y - 1 * s, 2.4 * s, '#ffe6a4', '#d2a65b', 1);
}

function drawCh5CanopyChrome(d, s) {
  if (s.level !== 4) return;
  const t = s.t || 0;
  const lap0 = s.practice && Math.floor(t / (s.lapSec || 1)) === 0;
  let show = false;
  let fade = 1;

  if (lap0 && t >= VERB_SEC && t < VERB_SEC + CH5_TEACH_CHROME) {
    show = true;
    const end = VERB_SEC + CH5_TEACH_CHROME;
    fade = t < end - 0.6 ? 1 : Math.max(0, (end - t) / 0.6);
  }

  const first = s.firstCanopyCrest;
  if (!s.practice && first && !s.ch5Taught && t <= first.until + 0.35) {
    const lead = first.from - t;
    if (lead <= CH5_CANOPY_WARN) {
      show = true;
      fade = lead > 0 ? 1 : Math.max(0.35, 1 - (t - first.from) / Math.max(0.4, first.until - first.from));
    }
  }

  if (!s.practice && !s.ch5Taught && t < CH5_TEACH_CHROME) {
    show = true;
    fade = t < CH5_TEACH_CHROME - 0.6 ? 1 : Math.max(0, (CH5_TEACH_CHROME - t) / 0.6);
  }

  if (!show || fade < 0.05) return;
  drawCrestAdjacentCue(d, TEACH_CANOPY, 'hang high — TAP on the dip', fade, '#7ec8b0');
}


/** Ch6 teach-alone chrome — brief crest-adjacent. No LOOK verb. */
function drawCh6WaltzChrome(d, s) {
  if (s.level !== 5) return;
  if (s.ch6Taught) return;
  const t = s.t || 0;
  const lap0 = s.practice && Math.floor(t / (s.lapSec || 1)) === 0;
  let show = false;
  let fade = 1;

  if (lap0 && t >= VERB_SEC && t < VERB_SEC + CH6_TEACH_CHROME) {
    show = true;
    const end = VERB_SEC + CH6_TEACH_CHROME;
    fade = t < end - 0.6 ? 1 : Math.max(0, (end - t) / 0.6);
  }

  const first = s.firstWaltzCrest;
  if (!s.practice && first && !s.ch6Taught && t <= first.until + 0.35) {
    const lead = first.from - t;
    if (lead <= CH6_WALTZ_WARN) {
      show = true;
      fade = lead > 0 ? 1 : Math.max(0.35, 1 - (t - first.from) / Math.max(0.4, first.until - first.from));
    }
  }

  if (!s.practice && !s.ch6Taught && t < CH6_TEACH_CHROME) {
    show = true;
    fade = t < CH6_TEACH_CHROME - 0.6 ? 1 : Math.max(0, (CH6_TEACH_CHROME - t) / 0.6);
  }

  if (!show || fade < 0.05) return;
  drawCrestAdjacentCue(d, TEACH_WALTZ, 'hearts · mirrors · windows · dips', fade, '#d2a65b');
}

function drawStatusStrip(d, s) {
  // Durable lines → s.note / shell readout. Only brief crest-adjacent NOW/hazard cues.
  if (s.practice && (s.t || 0) < VERB_SEC) return;
  let label = '';
  let accent = '#d2a65b';
  const anyMarked =
    (s.practiceGlint && itemInCrestWindow(s.practiceGlint, s)) ||
    (s.treasure && itemInCrestWindow(s.treasure, s)) ||
    (s.finds || []).some((row) => itemInCrestWindow(row, s));
  const anyDecoy = decoysLive(s) && (s.decoys || []).some((row) => itemInCrestWindow(row, s));
  const anyReflection = reflectionsLive(s) && (s.reflections || []).some((row) => itemInCrestWindow(row, s));
  const anyTeach = s.level === 3 && !!teachOpeningLive(s);
  const anyShut = (s.level === 3 || s.level === 5) && shutCarriageAtCrest(s) != null;
  const anyTooHigh = (s.level === 4 && (s.finds || []).some((row) =>
    canopyFindLive(s, row) && !itemInCrestWindow(row, s)))
    || (s.level === 5 && (s.finds || []).some((row) =>
      row.canopy && waltzFindLive(s, row) && !itemInCrestWindow(row, s)));

  if (anyMarked) {
    label = s.level === 1
      ? 'almost… NOW — heart'
      : (s.level === 2
        ? 'almost… NOW — real'
        : (s.level === 3
          ? 'almost… NOW — open'
          : (s.level === 4
            ? 'almost… NOW — canopy'
            : (s.level === 5 ? 'almost… NOW — waltz' : 'almost… NOW'))));
    accent = (s.level === 4 || s.level === 5) ? '#7ec8b0' : '#d2a65b';
  } else if (anyTooHigh) {
    label = 'still high — wait for the dip';
    accent = '#7ec8b0';
  } else if (anyTeach) {
    label = 'window opens — watch';
    accent = '#d2a65b';
  } else if (anyShut) {
    label = 'window shut — wait';
    accent = '#c8d0e0';
  } else if (anyReflection) {
    label = 'mirror ghost — skip';
    accent = '#c8d0e0';
  } else if (anyDecoy) {
    label = 'decoy crest — skip';
    accent = '#c8d0e0';
  } else {
    return; // no permanent searching/lap bar
  }
  drawCrestAdjacentCue(d, label, null, 1, accent);
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



function armCrestTap(s, sec = 20) {
  // Fairness retune 6: sticky until GOAL — first TAP arms every later heart crest.
  s.crestTapSticky = true;
  const until = (s.t || 0) + sec;
  s.crestTapArmedUntil = Math.max(s.crestTapArmedUntil || 0, until);
}

function liveHeartFinds(s) {
  return (s.finds || []).filter((row) => itemInCrestWindow(row, s));
}

function collectBestLiveHeart(s) {
  const liveHearts = liveHeartFinds(s);
  if (!liveHearts.length) return false;
  liveHearts.sort((a, b) => crestNorm(b.horse, s.angle, s.crestHalf || 0.6) - crestNorm(a.horse, s.angle, s.crestHalf || 0.6));
  const find = liveHearts[0];
  collectOrdinary(s, find, spotScreen(find.spot, s, find.horse) || {x: CX, y: CY + 48, scale: 1});
  return true;
}

function consumeArmedCrest(s) {
  const sticky = !!s.crestTapSticky && (s.found || 0) < (s.goal || GOAL);
  if (!sticky && (s.crestTapArmedUntil || 0) < (s.t || 0)) return false;
  if (collectBestLiveHeart(s)) return true;
  // Also resolve treasure / practice while armed.
  if (s.treasure && itemInCrestWindow(s.treasure, s)) {
    collectTreasure(s, spotScreen(s.treasure.spot, s, s.treasure.horse) || {x: CX, y: CY + 48, scale: 1});
    return true;
  }
  if (s.practiceGlint && itemInCrestWindow(s.practiceGlint, s)) {
    collectPractice(s, spotScreen(s.practiceGlint.spot, s, s.practiceGlint.horse) || {x: CX, y: CY + 48, scale: 1});
    return true;
  }
  return false;
}

function tryCrestTap(s, p) {
  // Fairness retune 6: sticky crest-arm until 3/3 after first TAP; timed arm backup 20s.
  armCrestTap(s, 20);

  // Ch4: teach-open TAP = soft miss BEFORE any collect (watch; next pass).
  if (s.level === 3) {
    const teachOp = teachOpeningLive(s);
    if (teachOp) {
      const scr = spotScreen(teachOp.spot || 'saddle', s, teachOp.horse)
        || {x: CX, y: CY + 48, scale: 1};
      return softFailWindow(s, 'teach', teachOp.horse, scr);
    }
  }

  if (collectBestLiveHeart(s)) return 'collect';

  if (s.treasure && itemInCrestWindow(s.treasure, s)) {
    collectTreasure(s, spotScreen(s.treasure.spot, s, s.treasure.horse) || {x: CX, y: CY + 48, scale: 1});
    return 'collect';
  }

  if (s.practiceGlint && itemInCrestWindow(s.practiceGlint, s)) {
    collectPractice(s, spotScreen(s.practiceGlint.spot, s, s.practiceGlint.horse) || {x: CX, y: CY + 48, scale: 1});
    return 'collect';
  }

  // Reflections after teach — soft-fail only (never collected; sticky arm ignores them).
  if (reflectionsLive(s)) {
    const reflection = (s.reflections || []).find((row) => !row.taken && itemInCrestWindow(row, s));
    if (reflection) {
      return softFailReflection(s, reflection, spotScreen(reflection.spot, s, reflection.horse));
    }
  }

  // Decoys after teach (Ch6) / after goal (Ch2) — soft-fail if crest-live.
  if (decoysLive(s)) {
    const decoy = (s.decoys || []).find((row) => !row.taken && itemInCrestWindow(row, s));
    if (decoy) {
      return softFailDecoy(s, decoy, spotScreen(decoy.spot, s, decoy.horse));
    }
  }

  // Ch4 / Ch6: shut window at crest = soft miss (after teach handled above).
  if (s.level === 3 || s.level === 5) {
    const shutHorse = shutCarriageAtCrest(s);
    if (shutHorse != null) {
      // Ch6: only soft-fail shut when a window-gated find is the relevant crest beat.
      if (s.level === 5) {
        const gated = (s.finds || []).some((row) =>
          row.needsWindow && !row.taken && waltzFindLive(s, row) && row.horse === shutHorse);
        if (gated) {
          return softFailWindow(s, 'shut', shutHorse, {x: CX, y: CY + 48, scale: 1});
        }
      } else {
        return softFailWindow(s, 'shut', shutHorse, {x: CX, y: CY + 48, scale: 1});
      }
    }
  }

  // Ch5 / Ch6 canopy: active canopy find still hanging high → tooHigh soft-fail.
  const early = (s.finds || []).find((row) => {
    if (s.level === 4) return canopyFindLive(s, row) && !itemInCrestWindow(row, s);
    if (s.level === 5) {
      if (row.canopy) return waltzFindLive(s, row) && !itemInCrestWindow(row, s);
      return false;
    }
    return itemActive(row, s.t) && !itemInCrestWindow(row, s);
  });
  const earlyTr = s.treasure && itemActive(s.treasure, s.t) && !itemInCrestWindow(s.treasure, s);
  const earlyPr = s.practiceGlint && itemActive(s.practiceGlint, s.t) && !itemInCrestWindow(s.practiceGlint, s);
  if (early || earlyTr || earlyPr) {
    if (s.level === 4 || (s.level === 5 && early && early.canopy)) {
      const horse = early ? early.horse : (earlyTr ? s.treasure.horse : (s.practiceGlint && s.practiceGlint.horse));
      const spot = early ? early.spot : (earlyTr ? s.treasure.spot : (s.practiceGlint && s.practiceGlint.spot));
      const scr = spotScreen(spot || 'canopy', s, horse) || {x: CX, y: CY - 80, scale: 1};
      return softFailTooHigh(s, horse, scr);
    }
    if (s.level === 3 || (s.level === 5 && early && early.needsWindow)) {
      return softFailWindow(s, 'early', early ? early.horse : null, {x: CX, y: CY + 48, scale: 1});
    }
    logAction(s, 'arm', {reason: 'early', x: Math.round(p.x), y: Math.round(p.y)});
    s.note = 'Armed — wait for NOW.';
    s.statusKind = 'searching';
    return 'arm';
  }
  s.note = 'TAP armed — crest will catch it.';
  return 'arm';
}


export default {
  title: 'Carousel Waltz',
  intro: 'Round and round, the secrets change. Board one horse fixed front-and-center; glints rise into the crest — TAP on NOW (Mario TAP remix: cream bottom stick, court tap/swipe, or Space/Enter). Painted Ponies: only the gold heart counts. Mirror Round: TAP real crests — skip cool silver mirror ghosts. Carriage Windows: TAP only while the window is open. Midnight Canopy: watch treasures hang high, then TAP when they drop into NOW. Grand Waltz: painted marks, mirrors, open windows, and canopy dips combine — use every rule you’ve learned.',
  instructions: 'Your horse stays center-front. Watch orbiting glints rise into the crest sweet-spot, then TAP on NOW — press the cream bottom stick, tap/swipe the court, or Space/Enter (no under-stage button). Practice teaches crest TAP and keeps nothing; a paid waltz costs one penny. First Turn: any crest glint. Painted Ponies: TAP the heart-marked pony — wrong marks soft-fail and the ride continues. Mirror Round: one reflection rule — real crest glints collect; dashed silver mirror ghosts cannot. Carriage Windows: each window opens twice — watch the teach pass, then TAP the collect pass; shut windows never collect. Midnight Canopy: canopy treasures hang high, then dip into NOW — TAP the dip; too-high soft-fails and the ride continues. Grand Waltz: combines painted marks, mirrors, open windows, and canopy dips across rotations — miss a pass and the eligible window repeats. Find three ordinary keepsakes before the final rotation ends.',
  levels: LEVELS,
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 120,
  houseTitle: 'The waltz ended',
  houseDetail: 'The lantern dimmed before the last lap. Try this chapter again.',
  actions: [],

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
      reflections: [],
      openings: [],
      carriageHorses: [],
      ch2Taught: false,
      ch3Taught: false,
      ch4Taught: false,
      ch5Taught: false,
      ch5CrestRetuned: false,
      ch6Taught: false,
      ch6CrestRetuned: false,
      firstMarked: null,
      firstReal: null,
      firstTeach: null,
      firstCollect: null,
      firstCanopy: null,
      firstCanopyCrest: null,
      firstWaltz: null,
      firstWaltzCrest: null,
      guaranteedRepeat: null,
      decoyFlash: 0,
      reflectionFlash: 0,
      windowFlash: 0,
      canopyFlash: 0,
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
      } else if (s.level === 2) {
        s.note = s.eligible
          ? 'Mirror Round — TAP real crests; skip mirror ghosts. A keepsake hides this waltz.'
          : 'Mirror Round — TAP real crests; skip mirror ghosts. Three finds finish the ride.';
      } else if (s.level === 3) {
        s.note = s.eligible
          ? 'Carriage Windows — TAP only while open. A keepsake hides this waltz.'
          : 'Carriage Windows — watch the teach open; TAP the next open pass.';
      } else if (s.level === 4) {
        s.note = s.eligible
          ? 'Midnight Canopy — TAP when the treasure dips into NOW. A keepsake hides this waltz.'
          : 'Midnight Canopy — watch it hang high; TAP when it drops into NOW.';
      } else if (s.level === 5) {
        s.note = s.eligible
          ? 'Grand Waltz — every rule you’ve learned. A keepsake hides this waltz.'
          : TEACH_WALTZ;
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

    // Crest-arm: early TAP still resolves when the marked pony reaches NOW.
    consumeArmedCrest(s);

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

    // Ch3 long warn before first real window (teach alone — no reflections yet).
    if (s.level === 2 && !s.practice && !s.ch3Taught && s.firstReal && !s.firstReal.taken) {
      const lead = s.firstReal.from - (s.t || 0);
      if (lead <= CH3_REAL_WARN && lead > -0.05 && !s.ch3WarnLogged) {
        s.ch3WarnLogged = true;
        logAction(s, 'real-warn', {lead: CH3_REAL_WARN});
        s.note = TEACH_MIRROR + ' — warm gold NOW is real.';
      }
    }

    // Ch4: mark teach complete when first teach window ends; warn before it.
    if (s.level === 3 && s.firstTeach) {
      const t = s.t || 0;
      if (!s.ch4Taught && t > s.firstTeach.until) {
        s.ch4Taught = true;
        logAction(s, 'teach', {kind: 'carriage-window-seen'});
      }
      if (!s.practice && t <= s.firstTeach.until + 0.2) {
        const lead = s.firstTeach.from - t;
        if (lead <= CH4_WINDOW_WARN && lead > -0.05 && !s.ch4WarnLogged) {
          s.ch4WarnLogged = true;
          logAction(s, 'window-warn', {lead: CH4_WINDOW_WARN});
          s.note = TEACH_WINDOW;
        }
      }
    }

    // Ch5: warn before first canopy dip; after teach, mild speed + retune crest to keep ~6s.
    if (s.level === 4) {
      const t = s.t || 0;
      const first = s.firstCanopyCrest;
      if (!s.practice && first && !s.ch5Taught && t <= first.until + 0.2) {
        const lead = first.from - t;
        if (lead <= CH5_CANOPY_WARN && lead > -0.05 && !s.ch5WarnLogged) {
          s.ch5WarnLogged = true;
          logAction(s, 'canopy-warn', {lead: CH5_CANOPY_WARN});
          s.note = TEACH_CANOPY;
        }
      }
      if (s.ch5Taught && !s.ch5CrestRetuned) {
        s.ch5CrestRetuned = true;
        const spd = rideSpeed(s);
        s.crestHalf = crestHalfFromSec(spd, 6.0);
        s.crestSec = (2 * s.crestHalf) / spd;
        logAction(s, 'speed-rise', {speed: spd, crestSec: s.crestSec});
      }
    }

    // Ch6: warn before first Grand Waltz teach; after teach, mild speed + retune crest (~6s).
    if (s.level === 5) {
      const t = s.t || 0;
      const first = s.firstWaltzCrest;
      if (!s.practice && first && !s.ch6Taught && t <= first.until + 0.2) {
        const lead = first.from - t;
        if (lead <= CH6_WALTZ_WARN && lead > -0.05 && !s.ch6WarnLogged) {
          s.ch6WarnLogged = true;
          logAction(s, 'waltz-warn', {lead: CH6_WALTZ_WARN});
          s.note = TEACH_WALTZ;
        }
      }
      if (s.ch6Taught && !s.ch6CrestRetuned) {
        s.ch6CrestRetuned = true;
        const spd = rideSpeed(s);
        s.crestHalf = crestHalfFromSec(spd, 6.0);
        s.crestSec = (2 * s.crestHalf) / spd;
        logAction(s, 'speed-rise', {speed: spd, crestSec: s.crestSec, chapter: 6});
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
    if ((s.reflectionFlash || 0) > 0) s.reflectionFlash = Math.max(0, s.reflectionFlash - dt);
    if ((s.windowFlash || 0) > 0) s.windowFlash = Math.max(0, s.windowFlash - dt);
    if ((s.canopyFlash || 0) > 0) s.canopyFlash = Math.max(0, s.canopyFlash - dt);

    // Fairness: seal a win as soon as 3/3 lands (don't bleed into a late miss veil).
    if (!s.result && (s.found || 0) >= (s.goal || GOAL) && (s.t || 0) > 0.4) {
      finishRide(s, {
        rideId: RIDE,
        treasureId: s.treasureId,
        challengeOk: true,
        completionFind: 'star-token',
      });
    } else if (s.t >= (s.rideEnd || lapSeconds(speed) * 3)) {
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
    if (s.result || s.broke || !p) return;

    if (type === 'down') {
      // Cream TAP stick — press fires crest TAP (Mario remix).
      if (hitTapStick(p)) {
        const L = tapStickLayout();
        s._stickArmed = true;
        s.stick = {active: true, kx: 0, ky: 0};
        s.drag = null;
        logAction(s, 'tap', {via: 'stick'});
        tryCrestTap(s, {x: CX, y: CY + 48});
        return;
      }
      s._stickArmed = false;
      s.stick = null;
      s.drag = {x: p.x, y: p.y, swayX: s.swayX || 0, swayY: s.swayY || 0, moved: false};
      return;
    }

    if (type === 'move') {
      if (s._stickArmed) {
        const L = tapStickLayout();
        const dx = (p.x || L.cx) - L.cx;
        const dy = (p.y || L.cy) - L.cy;
        const len = Math.hypot(dx, dy) || 1;
        const pull = Math.min(len, L.maxPull);
        s.stick = {active: true, kx: (dx / len) * pull, ky: (dy / len) * pull};
        return;
      }
      if (s.drag) {
        const dx = p.x - s.drag.x;
        const dy = p.y - s.drag.y;
        if (Math.hypot(dx, dy) > DRAG_PX) s.drag.moved = true;
        // Tiny cosmetic sway only — ignored for crest / collect.
        if (s.drag.moved) {
          s.swayX = clamp(s.drag.swayX + dx * 0.08, -SWAY_X, SWAY_X);
          s.swayY = clamp(s.drag.swayY + dy * 0.08, -SWAY_Y, SWAY_Y);
        }
      }
      return;
    }

    if (type === 'up') {
      if (s._stickArmed) {
        s._stickArmed = false;
        s.stick = null;
        return; // already fired TAP on press
      }
      if (s.drag) {
        s.drag = null;
        // Court tap OR swipe fires crest TAP (Mario TAP remix).
        logAction(s, 'tap', {x: Math.round(p.x), y: Math.round(p.y), via: 'pointer'});
        tryCrestTap(s, p);
      }
      return;
    }

    if (type === 'cancel') {
      s.drag = null;
      s._stickArmed = false;
      s.stick = null;
    }
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
    ensureLumiProps();
    const dressed = drawRideCutout(d, swayX, swayY);

    // Stick canopy/platform only when papercut cutout is not ready.
    if (!dressed) {
      drawPlatform(d, CX, CY, swayX, swayY);
      drawCanopy(d, CX, CY, swayX, swayY, t, reduced, s.level === 4 || s.level === 5);
    }
    // Lumi Tent props as bold scenery (canopy poles / crest / mid-court) — no full bg.
    drawLumiScenery(d, swayX, swayY);
    drawCrestLane(d, s);

    // Orbiting horses (skip index 0 — player mount fixed foreground).
    // When dressed, skip stick horses — papercut sheet already shows the ring.
    const order = [];
    for (let i = 1; i < HORSE_N; i++) {
      const h = horsePoint(i, HORSE_N, s.angle || 0, cx, cy + 40, 250, 220);
      if (s.horseMarks && s.horseMarks[i]) h.mark = s.horseMarks[i];
      order.push({i, h});
    }
    order.sort((a, b) => a.h.scale - b.h.scale);
    for (const {i, h} of order) {
      const bobAmp = (s.level === 4 || s.level === 5) ? (reduced ? 5 : 14) : (reduced ? 3 : 10);
      const bob = Math.sin((s.angle || 0) * 2 + i) * bobAmp;
      if (!dressed) drawHorseSafe(d, h, bob, false, t, reduced);
      // Ch4 / Ch6: paper-cut carriage window on crest carriers (open vs shut).
      if ((s.level === 3 || s.level === 5) && (s.carriageHorses || []).includes(i) && h.front) {
        const op = liveOpeningForHorse(s, i);
        const open = !!op;
        const teach = !!(op && op.kind === 'teach');
        drawCarriageWindow(d, h.x - 8 * h.scale, h.y - 6 * h.scale + bob, h.scale, open, teach);
      }
    }

    // YOU = bea-player on fixed front horse lane (~52–60w) + soft glow; geometry fallback.
    const playerBobAmp = (s.level === 4 || s.level === 5) ? (reduced ? 5 : 12) : (reduced ? 3 : 8);
    const bob = Math.sin(t * 2.2) * playerBobAmp;
    const px = CX + swayX * 0.15;
    const py = CY + swayY * 0.15 + 110 + bob;
    d.glow(px, py + 8, 30, GOLD);
    d.ellipse(px + 2, py + 26, 28, 10, '#12233555');
    ensureLumiProps();
    const beaOk = placeDress(d, beaPlayerImg, px, py - 6, 56);
    if (!beaOk) {
      if (!dressed) {
        drawPlayerHorse(d, CX + swayX * 0.15, CY + swayY * 0.15, bob, t, reduced);
      } else {
        d.circle(px, py, 14, '#fff6d8ee', CREAM_DEEP, 2);
        d.text('YOU', px, py + 1, 11, BURGUNDY_DEEP);
      }
    }

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
        if (s.level === 3) {
          drawCarriageWindow(d, scr.x, scr.y - 26, 0.9, true, false);
        }
        if (s.level === 4 || (s.level === 5 && s.practiceGlint.canopy)) {
          drawCanopyOrnament(d, scr.x, scr.y - 22, 1.1, scr.crest > 0.02);
        }
        if (s.level === 5 && s.practiceGlint.mark === 'heart') {
          d.glow(scr.x, scr.y - 22, 16, '#ffe6a4');
          d.heart(scr.x, scr.y - 22, 8, '#d2a65b');
        }
        d.item(spriteKey('star-token'), scr.x, scr.y, {
          w: 52,
          shadow: false,
          fallback: () => d.star(scr.x, scr.y, 12),
        });
      }
    }

    (s.finds || []).forEach((row) => {
      if (s.level === 4) {
        if (!canopyFindLive(s, row)) return;
      } else if (s.level === 5) {
        if (!waltzFindLive(s, row)) return;
      } else if (!itemActive(row, s.t)) {
        return;
      }
      // Ch4: never draw find during a teach open; approach OK in collect phase.
      if (s.level === 3) {
        const teachLive = (s.openings || []).some((op) =>
          op.kind === 'teach' && op.horse === row.horse
          && s.t >= op.from && s.t <= op.until);
        if (teachLive) return;
      }
      const scr = spotScreen(row.spot, s, row.horse);
      if (!scr) return;
      const windowGated = s.level === 3 || (s.level === 5 && row.needsWindow);
      const openNow = !windowGated || !!itemInCrestWindow(row, s);
      if (scr.crest > 0.02 && openNow) drawNowTelegraph(d, scr, t, false);
      else if (s.level === 4 || (s.level === 5 && row.canopy)) drawApproachGlint(d, scr, t, false);
      else if (!windowGated || scr.crest > 0.001) drawApproachGlint(d, scr, t, false);
      else return;
      // Heart cue on the collectable glint (Ch2/Ch6). Ch3: warm REAL cue (vs silver mirrors).
      if (row.mark === 'heart') {
        d.glow(scr.x, scr.y - 22, 18, '#ffe6a4');
        d.heart(scr.x, scr.y - 22, 9, '#d2a65b');
      } else if (s.level === 2 && row.real) {
        d.glow(scr.x, scr.y - 20, 16, '#ffe6a4');
        d.circle(scr.x, scr.y - 20, 5, '#ffe6a4', '#d2a65b', 1.5);
      }
      if ((s.level === 3 || (s.level === 5 && row.needsWindow)) && openNow) {
        d.glow(scr.x, scr.y - 18, 16, '#ffe6a4');
        drawCarriageWindow(d, scr.x, scr.y - 28, 0.85, true, false);
      }
      if (s.level === 4 || (s.level === 5 && row.canopy)) {
        drawCanopyOrnament(d, scr.x, scr.y - 24, 1.15, scr.crest > 0.02);
      }
      if (!windowGated || openNow || scr.crest > 0.15) {
        d.item(spriteKey(row.id), scr.x, scr.y, {
          w: 56,
          shadow: false,
          fallback: () => ((s.level === 4 || (s.level === 5 && row.canopy))
            ? drawCanopyOrnament(d, scr.x, scr.y, 1.0, scr.crest > 0.02)
            : d.star(scr.x, scr.y, 14)),
        });
      }
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

    // Ch3 false reflections — cool silver / dashed / flip cue; soft-fail on TAP (after teach).
    if (reflectionsLive(s)) {
      (s.reflections || []).forEach((row) => {
        if (!itemActive(row, s.t)) return;
        const scr = spotScreen(row.spot, s, row.horse);
        if (!scr) return;
        drawReflectionGlint(d, scr, t);
      });
    }

    if ((s.decoyFlash || 0) > 0) {
      const k = s.decoyFlash / 0.55;
      d.glow(s.decoyFlashX || CX, s.decoyFlashY || CY, 24 + 40 * k, '#c8d0e0');
      d.text('soft miss', s.decoyFlashX || CX, (s.decoyFlashY || CY) - 36, 16, `rgba(200,208,224,${k})`);
    }

    if ((s.reflectionFlash || 0) > 0) {
      const k = s.reflectionFlash / 0.55;
      d.glow(s.reflectionFlashX || CX, s.reflectionFlashY || CY, 24 + 40 * k, '#b8c4d4');
      d.text('mirror miss', s.reflectionFlashX || CX, (s.reflectionFlashY || CY) - 36, 16, `rgba(200,208,224,${k})`);
    }

    if ((s.windowFlash || 0) > 0) {
      const k = s.windowFlash / 0.55;
      d.glow(s.windowFlashX || CX, s.windowFlashY || CY, 24 + 40 * k, '#f0d09a');
      d.text('window miss', s.windowFlashX || CX, (s.windowFlashY || CY) - 36, 16, `rgba(240,208,154,${k})`);
    }

    if ((s.canopyFlash || 0) > 0) {
      const k = s.canopyFlash / 0.55;
      d.glow(s.canopyFlashX || CX, s.canopyFlashY || (CY - 80), 24 + 40 * k, '#7ec8b0');
      d.text('too high', s.canopyFlashX || CX, (s.canopyFlashY || (CY - 80)) - 36, 16, `rgba(126,200,176,${k})`);
    }

    if (s.treasure && itemActive(s.treasure, s.t)) {
      const scr = spotScreen(s.treasure.spot, s, s.treasure.horse);
      if (scr) {
        if (scr.crest > 0.02) drawNowTelegraph(d, scr, t, true);
        else drawApproachGlint(d, scr, t, true);
        if (s.level === 4 || (s.level === 5 && s.treasure.canopy)) {
          drawCanopyOrnament(d, scr.x, scr.y - 28, 1.3, scr.crest > 0.02);
        }
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

    // Shell .play-hud + #readout/s.note own status — no on-court Practice/count HUD.
    // Crest-adjacent teach cues only.
    drawCh2MarkChrome(d, s);
    drawCh3MirrorChrome(d, s);
    drawCh4WindowChrome(d, s);
    drawCh5CanopyChrome(d, s);
    drawCh6WaltzChrome(d, s);
    drawStatusStrip(d, s);

    // One cream bottom TAP stick (replaces under-stage TAP button). Pause/Restart off-court.
    if (!s.result && !s.broke) drawTapStick(s, d);
  },

  readout: (s) => s.note || '',
};
