import {kits as chapterKits} from '../prizes.js?v=prize-hud-1';
/*
 * Spiral Slide (helter) — six chapter boards; prize seat moves each chapter.
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
 * Practice clear: keepsake taken AND crest reached (cushions help climb only).
 * Soft dump never aborts paid rides; practice keeps nothing. ~45–55s ride.
 *
 * Tagline: Choose your spiral. Catch what tumbles.
 * Paper-cut deep-red spiral (layered faces + jitter). helter.webp court stays hero.
 * Bottom terminus aligned to Palace of Joy stairs base; gold ball rolls crest→door.
 * Cream-bottom ← JUMP → pads on court. No shell STEP. Shell .play-hud only (menu off court).
 * d.glow() — 6-digit hex only. Do NOT set canvasControls.
 */
import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=prize-hud-1';
import {alleyPlay,isVerifiedPlay,owned,keep,tickets} from '../wallet.js?v=insights-1';
import {takePrize} from '../chapter-kit.js?v=align-1';
import {advanceDescent, controlDescent, descentCourse, makeDescent, matLift} from './helter-descent.js?v=descent-1';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction,
  prefersReducedMotion,
} from '../ride-seek.js?v=ride-ticket-1';

const RIDE = 'helter';
const BOOK = 'pennyFever.helter';
const HELTER_SNAP = [
  'boarded', 'practice', 'broke', 'eligible', 'spawnId', 'hiddenResult', 'slot', 'preserved',
  'treasureCollected', 'treasureRevealed', 'treasure', 'finds', 'collected',
  'hits', 'cushionsBounced', 'slidesSurvived', 'tokensTaken', 'keepsakeTaken',
  'youCell', 'lastCell', '_ballCleared', 'youX', 'youY', 'moving', 'moveT', 'moveDur',
  'moveFrom', 'moveTo', '_moveAx', '_moveAy', '_moveBx', '_moveBy', '_moveArc', 'moveReason',
  'previewing', 'previewT', 'launched', 'tappedOnce', 'jumpedOnce',
  'matPulse', 'finishPulse', 'slideFlash', 'cushionFlash', 'statusCopy',
  'challengeOkFlash', 'pendingLand',
  'ballU', 'ballX', 'ballY', 'ballRolling', 'ballActive', 'ballWait',
  't', 'progress', 'note', 'houseLeft', 'prizeKept', 'prizePosted',
  'planTreasureCell', 'duration', 'frozenChapter', 'reduced',
];
function emptyBook() { return {v: 1, sittings: {}}; }
function readBook() {
  if (typeof localStorage === 'undefined') return emptyBook();
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1) return {sittings: {}, ...blob};
  } catch {}
  return emptyBook();
}
function writeBook(book) {
  if (!alleyPlay || typeof localStorage === 'undefined') return;
  try { localStorage.setItem(BOOK, JSON.stringify(book)); } catch {}
}
function cloneJson(v) {
  try { return JSON.parse(JSON.stringify(v)); } catch { return v; }
}
function productionPlay() {
  const verified = isVerifiedPlay();
  if (alleyPlay && !verified) throw Error('Verified play is required.');
  return verified;
}
function persist(s) {
  if (productionPlay()) return;
  if (DESCENT_EDITION) {
    if (!s?.boarded) return;
    try {
      const book = readDescentBook();
      const {cells, rng, saveFault, _padArmed, ...saved} = s;
      book.sittings[s.level] = saved;
      if (s.prizeKept) book.collected[s.level] = true;
      localStorage.setItem(DESCENT_BOOK, JSON.stringify(book));
      delete s.saveFault;
    } catch {
      s.saveFault = true;
    }
    return;
  }
  if (!alleyPlay || !s) return;
  const book = readBook();
  book.currentChapter = s.level;
  if (s.result || s.broke) {
    delete book.sittings[String(s.level)];
    writeBook(book);
    return;
  }
  if (!s.boarded) return;
  const snap = {};
  for (const key of HELTER_SNAP) if (s[key] !== undefined) snap[key] = s[key];
  snap.slides = (s.slides || []).map((S) => ({cell: S.cell, used: !!S.used, dump: S.dump, teach: !!S.teach}));
  snap.cushions = (s.cushions || []).map((C) => ({cell: C.cell, used: !!C.used, boost: C.boost, teach: !!C.teach}));
  snap.tokens = (s.tokens || []).map((T) => ({cell: T.cell, id: T.id, taken: !!T.taken}));
  book.sittings[String(s.level)] = cloneJson(snap);
  writeBook(book);
}
function reviveSitting(s, saved) {
  if (!saved || !saved.boarded) return false;
  for (const key of HELTER_SNAP) if (saved[key] !== undefined) s[key] = cloneJson(saved[key]);
  s.boarded = true;
  // Keep an in-progress sitting's authored layout across board revisions.
  if (Array.isArray(saved.slides)) {
    s.slides = saved.slides.map(row => ({...row,
      dump: Number.isFinite(row.dump) ? row.dump :
        (CHAPTER_BOARDS[0].slides.find(x => x.cell === row.cell)?.dump ?? 5),
      used: !!row.used}));
  }
  if (Array.isArray(saved.cushions)) s.cushions = cloneJson(saved.cushions);
  if (Array.isArray(saved.tokens)) s.tokens = cloneJson(saved.tokens);
  return true;
}
const TREASURES = chapterKits['helter'].prizes;
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
const BALL_ROLL_SECS = 8; // faster crest→door gold ball
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

const routeParams = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search);
const TOWER_EDITION = alleyPlay || (typeof location !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(location.hostname) && routeParams.get('edition') === 'tower');
const DESCENT_EDITION = alleyPlay || (TOWER_EDITION && routeParams.get('challenge') === 'descent');
const DESCENT_BOOK = DESCENT_EDITION && 'pennyFever.helter.descent.v1:' +
  ((routeParams.get('reviewPlayer') || '').match(/^[\w-]{1,48}$/)?.[0] || 'local');

function readDescentBook() {
  const raw = localStorage.getItem(DESCENT_BOOK);
  if (raw === null) return {v: 1, sittings: {}, collected: {}};
  const book = JSON.parse(raw);
  if (book?.v !== 1 || !book.sittings || !book.collected) throw Error('Saved Helter Skelter preview needs attention.');
  return book;
}

function restoreDescentSitting(s) {
  const book = readDescentBook();
  const sitting = book.sittings[s.level];
  if (sitting) {
    if (sitting.level !== s.level || !sitting.boarded || !Array.isArray(sitting.slides) ||
        !Array.isArray(sitting.cushions) || !Number.isFinite(sitting.t) ||
        (sitting.descent && (!Number.isFinite(sitting.descent.u) || sitting.descent.u < 0 ||
          sitting.descent.u > 1 || !Number.isFinite(sitting.descent.remaining)))) {
      throw Error('Saved Helter Skelter sitting needs attention.');
    }
    Object.assign(s, sitting);
  }
  if (book.collected[s.level] === true) s.prizeKept = true;
}

/** Tilly game props + bea-player — visual art only; prize IDs stay in chapter allocations. */
const DRESS_CACHE = 'game-webp-1';
const SKIP_FILES = {
  ball: '04-gold-jump-ball.png',
  slide: '02-red-slide-chute.png',
  cushion: '03-cream-bounce-cushion.png',
  hopper: '01-curved-spiral-track.png',
  cradle: '06-bunting-rail.png',
  gauge: '05-crest-gate.png',
};
const BEA_PLAYER_FILE = 'bea-player.webp';
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
    img.src = dressUrl('../assets/helter-dress/tilly/' + file);
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

/** Transparent paper prop presentation. */
let paperPropIcons = null;
function ensurePaperPropIcons() {
  if (paperPropIcons) return paperPropIcons;
  paperPropIcons = {};
  if (!beaPlayerImg) {
    beaPlayerImg = new Image();
    beaPlayerImg.decoding = 'async';
    beaPlayerImg.src = dressUrl('../assets/helter-dress/player/' + BEA_PLAYER_FILE);
  }
  loadPaperPropAtlas('paper-props-v2.png', ['slide', 'cushion', 'ball', 'mat'], 2, 2);
  loadPaperPropAtlas('paper-scenery-v2.png', ['hopper', 'cradle', 'gauge'], 3, 1);
  return paperPropIcons;
}
function loadPaperPropAtlas(file, keys, columns, rows) {
  const atlas = new Image();
  atlas.decoding = 'async';
  atlas.onload = () => {
    const w = Math.floor(atlas.naturalWidth / columns), h = Math.floor(atlas.naturalHeight / rows);
    for (const [index, key] of keys.entries()) {
      const cell = document.createElement('canvas');
      cell.width = w; cell.height = h;
      const c = cell.getContext('2d', {willReadFrequently: true});
      c.drawImage(atlas, index % columns * w, Math.floor(index / columns) * h, w, h, 0, 0, w, h);
      const alpha = c.getImageData(0, 0, w, h).data;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (alpha[(y * w + x) * 4 + 3] <= 20) continue;
        x0 = Math.min(x0, x); y0 = Math.min(y0, y);
        x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
      if (x1 < x0 || y1 < y0) continue;
      const crop = document.createElement('canvas');
      crop.width = x1 - x0 + 3; crop.height = y1 - y0 + 3;
      crop.getContext('2d').drawImage(cell, x0 - 1, y0 - 1, crop.width, crop.height, 0, 0, crop.width, crop.height);
      paperPropIcons[key] = crop;
    }
  };
  atlas.src = dressUrl('../assets/tilly-icons/' + file);
}
function placePaperIcon(d, key, x, y, w, {
  footX = 0.5, footY = 0.5, angle = 0, flip = false, heightScale = 1, shadow = true,
} = {}) {
  const image = ensurePaperPropIcons()[key];
  if (!image || typeof d.sprite !== 'function') return false;
  const h = w * image.height / image.width * heightScale;
  const dx = (0.5 - footX) * w * (flip ? -1 : 1);
  const dy = (0.5 - footY) * h;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  d.sprite(image, x + dx * cos - dy * sin, y + dx * sin + dy * cos, {w, h, angle, flip, shadow});
  return true;
}
function drawPaperScenery(d) {
  placePaperIcon(d, 'cradle', 118, 720, 88, {angle: -0.12});
  placePaperIcon(d, 'gauge', 782, 430, 72, {angle: 0.08});
}
function drawPaperHopper(d, s) {
  const h = s.hopper || {u: 0.92, ox: 48, oy: -28};
  const p = spiralPoint(h.u), x = p.x + (h.ox || 0), y = p.y + (h.oy || 0);
  const waiting = (s.ballWait || 0) > 0;
  if (waiting) d.glow(x, y - 4, 28 + Math.sin((s.t || 0) * 10) * 6, GOLD);
  if (!placePaperIcon(d, 'hopper', x, y, waiting ? 58 : 52)) d.circle(x, y, 14, HOPPER_FILL, GOLD, 2);
  if (waiting) d.text('…', x, y - 30, 14, GOLD);
  if (waiting && (s.ballWait || 0) < 0.55) drawBall(d, x, y - 6, 8);
}
/** End paper prop presentation. */


/**
 * One coil, six prize seats. Slides dump DOWN; cushions bounce UP.
 * Keepsake + tokens sit off slide cells, cushion cells, and cushion landings.
 */
const CHAPTER_BOARDS = [
  { // 1 First Spiral — mid coil
    slides: [{cell: 3, dump: 5, teach: true}, {cell: 10, dump: 6}, {cell: 20, dump: 5}],
    cushions: [{cell: 4, boost: 4, teach: true}, {cell: 11, boost: 5}, {cell: 18, boost: 4}],
    tokens: [{cell: 23, id: 'everyday-penny'}],
    treasureCell: 17,
  },
  { // 2 Bunting Bend — lower-mid
    slides: [{cell: 5, dump: 4, teach: true}, {cell: 12, dump: 5}, {cell: 21, dump: 4}],
    cushions: [{cell: 6, boost: 3, teach: true}, {cell: 14, boost: 4}, {cell: 19, boost: 4}],
    tokens: [{cell: 2, id: 'star-token'}, {cell: 10, id: 'moon-penny'}, {cell: 24, id: 'everyday-penny'}],
    treasureCell: 8,
  },
  { // 3 Tunnel Turn — high coil
    slides: [{cell: 4, dump: 5, teach: true}, {cell: 11, dump: 6}, {cell: 18, dump: 5}],
    cushions: [{cell: 8, boost: 4, teach: true}, {cell: 14, boost: 3}, {cell: 22, boost: 2}],
    tokens: [{cell: 1, id: 'star-token'}, {cell: 9, id: 'moon-penny'}, {cell: 23, id: 'everyday-penny'}],
    treasureCell: 21,
  },
  { // 4 Three-Way Tower — mid after early dumps
    slides: [{cell: 6, dump: 4, teach: true}, {cell: 13, dump: 5}, {cell: 22, dump: 6}],
    cushions: [{cell: 3, boost: 4, teach: true}, {cell: 10, boost: 5}, {cell: 17, boost: 4}],
    tokens: [{cell: 1, id: 'star-token'}, {cell: 8, id: 'moon-penny'}, {cell: 24, id: 'everyday-penny'}],
    treasureCell: 16,
  },
  { // 5 Runaway Keepsake — near crest
    slides: [{cell: 4, dump: 6, teach: true}, {cell: 9, dump: 5}, {cell: 16, dump: 5}],
    cushions: [{cell: 7, boost: 3, teach: true}, {cell: 13, boost: 4}, {cell: 20, boost: 3}],
    tokens: [{cell: 2, id: 'star-token'}, {cell: 11, id: 'moon-penny'}, {cell: 22, id: 'everyday-penny'}],
    treasureCell: 24,
  },
  { // 6 Impossible Descent — mid-high, longer dumps
    slides: [{cell: 5, dump: 6, teach: true}, {cell: 12, dump: 7}, {cell: 19, dump: 6}],
    cushions: [{cell: 7, boost: 3, teach: true}, {cell: 14, boost: 4}, {cell: 21, boost: 3}],
    tokens: [{cell: 2, id: 'star-token'}, {cell: 9, id: 'moon-penny'}, {cell: 23, id: 'everyday-penny'}],
    treasureCell: 15,
  },
];

function chapterBoard(level) {
  const plan = CHAPTER_BOARDS[Math.max(0, Math.min(5, level | 0))] || CHAPTER_BOARDS[0];
  return {
    slides: plan.slides.map((S) => ({teach: false, ...S})),
    cushions: plan.cushions.map((C) => ({teach: false, ...C})),
    tokens: plan.tokens.map((T) => ({...T})),
    treasureCell: plan.treasureCell,
    hopper: {u: 0.92, ox: 48, oy: -28},
    cellCount: CELL_COUNT,
    duration: RIDE_SECONDS,
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

function towerRailLight(c, pts, back, front) {
  const a = pts[0], b = pts[pts.length - 1];
  const light = c.createLinearGradient(a.x, a.y, b.x, b.y);
  light.addColorStop(0, a.depth > 0 ? back : front);
  light.addColorStop(1, b.depth > 0 ? back : front);
  return light;
}

/**
 * Papercut deep-red spiral: offset paper edges, clay/paper jitter,
 * light top face + dark edge face (not a flat stroked ribbon only).
 * Half-turn coils sorted back → front for overlap.
 */
function drawSpiralTrack(d, tower = false) {
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
    const thick = tower ? 10 : 7;
    const face = tower ? towerRailLight(d.c, coil.pts, '#873f42fa', '#b74645fa') : TRACK_FACE + 'fa';
    const deck = tower ? towerRailLight(d.c, coil.pts, '#6d2d37f4', '#93313bf4') : TRACK + 'f4';
    const highlight = tower ? towerRailLight(d.c, coil.pts, '#c79557cd', '#f5cb84') : CREAM + '78';
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
    d.poly(topPoly, face, TRACK_EDGE, 1.6);
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
    d.poly(innerL.concat(innerR.reverse()), deck, TRACK_DEEP + '88', 1);
    // Cream highlight lip on the upper paper edge.
    d.path(left.map((p) => ({x: p.x, y: p.y - 1.2})), highlight, Math.max(2.2, w * 0.14), false, null);
    // Dark lower lip (shadowed paper edge).
    d.path(right.map((p) => ({x: p.x, y: p.y + 0.8})), tower ? '#ba7c48d9' : TRACK_SHADOW + '99', Math.max(1.8, w * 0.1), false, null);
    if (tower) {
      for (let i = 8; i < left.length - 7; i += 9) {
        d.circle(left[i].x, left[i].y - 1.2, 2.2, coil.pts[i].depth > 0 ? '#d19d67' : '#fff0be', '#775136', 0.7);
      }
    }
  }
}

function drawTowerBrackets(d) {
  for (let turn = 0; turn < TURNS; turn++) {
    for (const sweep of [0.19, 0.83]) {
      const p = spiralPoint((turn + sweep) / TURNS);
      const side = Math.sign(p.x - CX);
      const mount = {x: CX + side * (83 + p.y * 0.088), y: p.y + 10};
      const rail = {x: p.x - side * 11, y: p.y + 10};
      if ((rail.x - mount.x) * side < 15) continue;
      const brace = {x: mount.x, y: mount.y + 22};
      d.path([brace, rail, mount], '#311c20', 8);
      d.path([brace, rail, mount], '#b77945', 4);
      d.circle(brace.x, brace.y, 3.7, '#e4b66f', '#664026', 1.2);
    }
  }
}

function drawTowerSign(d, s) {
  const c = d.c;
  c.save();
  c.beginPath();
  c.roundRect(18, 55, 300, 84, 12);
  c.fillStyle = '#10272bef';
  c.fill();
  c.strokeStyle = '#d6ad6b';
  c.lineWidth = 2;
  c.stroke();
  c.restore();
  d.text('Tilly’s Helter Skelter', 168, 82, 27, '#ffe4ad');
  const label = s.descent ? '2 · Slide to the exit' : LEVEL_NAMES[s.level] || LEVEL_NAMES[0];
  d.text(label, 168, 113, 21, '#f5ddba');
}

function drawDescentCourse(d, s) {
  const run = s.descent;
  const gates = descentCourse(s.level).gates;
  for (let i = run?.gateIndex ?? gates.length; i < gates.length; i++) {
    const [u, kind] = gates[i];
    const next = i === run.gateIndex;
    const p = spiralPoint(u), down = spiralPoint(u - 0.005);
    const rim = trackWidth(u) * 0.61;
    const colour = kind === 'jump' ? '#f16456' : '#5fd8cb';
    const c = d.c;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(Math.atan2(down.y - p.y, down.x - p.x));
    c.globalAlpha = next ? 1 : 0.62;
    d.path([{x: 0, y: -rim}, {x: 0, y: rim}], '#191b26', 12);
    d.path([{x: 0, y: -rim}, {x: 0, y: rim}], colour, 7);
    d.circle(0, -rim, 5.5, '#f6d995', '#32242b', 1.5);
    d.circle(0, rim, 5.5, '#f6d995', '#32242b', 1.5);
    c.restore();
    if (next) d.text(kind === 'jump' ? 'JUMP' : 'BRAKE', p.x, p.y - 30, 22, colour);
  }
  const c = d.c;
  c.save();
  c.beginPath();
  c.roundRect(612, 55, 262, 84, 12);
  c.fillStyle = '#10272bef';
  c.fill();
  c.strokeStyle = '#d6ad6b';
  c.lineWidth = 2;
  c.stroke();
  c.restore();
  const time = Math.ceil(run?.remaining ?? Math.max(0, s.duration - s.t));
  const status = run ? run.gateIndex + '/' + gates.length + ' gates' : 'Climb';
  d.text(time + 's · ' + status, 743, 82, 24, '#ffe4ad');
  const next = gates[run?.gateIndex]?.[1];
  const cue = !run ? (s.keepsakeTaken ? 'Keepsake in hand' : 'Find the keepsake') :
    !run.active ? 'Start at the crest' :
    run.note.startsWith('Bumped') ? 'Bumped · try the jump' :
    run.note.startsWith('Wide') ? 'Wide · brake here' :
    !next ? 'Coast to the exit' : next === 'jump' ? 'Next: red jump bar' : 'Next: blue bend';
  d.text(cue, 743, 113, 20, '#f5ddba');
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
  s.note = s.practice
    ? 'Practice token glimpse — finish a paid ride to keep finds.'
    : 'In hand — reach the crest to keep it. A ball dump puts it back.';
  s.statusCopy = 'Token';
  const c = cellAt(s, idx);
  pushSparks(s, c.x, c.y, false);
  s.matPulse = 0.5;
}

function tryCollectTreasure(s, idx) {
  if (!s.treasure || s.treasure.taken || s.treasure.cell !== idx) return;
  if (s.result || s.broke) return;
  // Carry only. The book slot stays Locked until crest + keepsake.
  s.treasure.taken = true;
  s.treasureRevealed = true;
  s.keepsakeTaken = true;
  logAction(s, 'treasure-carry', {cell: idx, id: s.treasure.id});
  s.note = 'Keepsake in hand — reach the crest to keep it. A ball dump puts it back.';
  s.statusCopy = 'CARRY';
  const c = cellAt(s, idx);
  pushSparks(s, c.x, c.y, false);
  s.matPulse = 1.0;
  s.ladderFlash = 0.9;
  pushFx(s, {kind: 'label', x: c.x, y: c.y - 50, text: 'CARRY!', life: 1.2, soft: false});
}

function restoreTokens(s) {
  if (s.result || s.broke || s.prizeKept) return 0;
  let n = 0;
  for (const tok of s.tokens || []) {
    if (!tok.taken) continue;
    tok.taken = false;
    n += 1;
  }
  if (n) s.tokensTaken = 0;
  return n;
}

function dropKeepsake(s) {
  if (s.result || s.broke || s.prizeKept) return false;
  const tokens = restoreTokens(s);
  const had = !!(s.keepsakeTaken || s.treasure?.taken);
  if (!had && !tokens) return false;
  s.keepsakeTaken = false;
  s.treasureCollected = null;
  if (s.treasure) s.treasure.taken = false;
  return had || tokens > 0;
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
  const dropped = dropKeepsake(s);
  s.note = dropped
    ? 'BALL DUMP! Keepsake back on the coil — reach the crest to keep it.'
    : 'BALL DUMP! Soft dump to the bottom — ride continues.';
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
      if (isVerifiedPlay()) s.collected.push({id: 'cell-' + idx, kind: 'ordinary', t: s.t});
      else recordFind(s, 'cell-' + idx, RIDE);
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
  // Crest required — cushion boosts help climb but must not finish the ride early.
  return keepsake && atTop;
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

function drawCreamPads(d, descent) {
  for (const pad of creamPads()) {
    const isJump = pad.id === 'jump';
    const braking = descent?.braking && pad.id === 'left';
    const label = !descent ? pad.label : isJump ? (descent.active ? 'JUMP' : 'RIDE DOWN') : pad.id === 'left' ? 'Brake' : 'Coast';
    d.ellipse(pad.x + pad.w / 2 + 2, pad.y + pad.h / 2 + 4, pad.w * 0.48, pad.h * 0.42, TRACK_SHADOW + '66');
    d.ellipse(
      pad.x + pad.w / 2,
      pad.y + pad.h / 2,
      pad.w * 0.48,
      pad.h * 0.42,
      isJump ? CREAM + 'ee' : braking ? '#236561' : '#233941ee',
      isJump ? CREAM_DEEP : '#a48c62',
      2
    );
    d.text(label, pad.x + pad.w / 2, pad.y + pad.h / 2 + 1, isJump ? 22 : 28, isJump ? BURGUNDY_DEEP : CREAM);
  }
}

function handleDescentInput(s, input) {
  if (!s.descent || s.saveFault) return;
  if (controlDescent(s.descent, input)) persist(s);
}

function updateMatRide(s, dt) {
  const run = s.descent;
  const gate = run.gateIndex, bumps = run.bumps;
  const outcome = advanceDescent(run, s.level, dt);
  const p = spiralPoint(run.u);
  s.youCell = Math.round(run.u * (s.cells.length - 1));
  s.youX = p.x;
  s.youY = p.y - matLift(run);
  s.note = run.note;
  if (outcome === 'exit') {
    if (!s.prizeKept) {
      if (isVerifiedPlay()) {
        keep(TREASURES[s.level], RIDE);
        s.prizePosted = true;
        s.treasureCollected = TREASURES[s.level];
      }
      takePrize(s, TREASURES[s.level], p);
    }
    s.note = 'Keepsake home. Chapter reward Collected.';
    s.result = {won: true, settle: true, title: 'Out through the bottom!', detail: s.note};
  } else if (outcome === 'timeout') {
    s.result = {won: false, settle: true, title: 'The mat ran out of time', detail: 'Clear the bars and bends, then coast through the exit.'};
  }
  if (outcome || run.gateIndex !== gate || run.bumps !== bumps) persist(s);
}

function maybeFinish(s, why) {
  if (s.result || s.broke) return;
  const ok = clearOk(s);
  const atTop = (s.youCell | 0) >= ((s.cells || []).length - 1);
  if (!ok && why !== 'timeout') return;
  if (ok && DESCENT_EDITION) {
    s.descent = makeDescent(s.level);
    s._queued = null;
    s.fx = [];
    s.ballActive = false;
    s.note = s.descent.note;
    persist(s);
    return;
  }
  if (ok || why === 'timeout') {
    s.challengeOkFlash = ok;
    s.finishPulse = 1.3;
    s.matPulse = 0.55;
    s.statusCopy = ok ? 'Clear!' : 'Short';
    s.note = ok
      ? 'Crest with the keepsake — chapter bonus Collected.'
      : 'Need the keepsake and the crest. Ride returns.';
    if (ok) {
      recordTreasure(s, s.treasureId);
      for (const tok of s.tokens || []) {
        if (tok.taken) recordFind(s, tok.id, RIDE);
      }
    }
    const c = cellAt(s, s.youCell | 0);
    pushSparks(s, c.x, c.y, !ok);
    finishRide(s, {
      rideId: RIDE,
      treasureId: s.treasureId,
      challengeOk: ok,
      completionFind: 'star-token',
    });
    persist(s);
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
    return 'Keepsake secured — keep climbing to the crest';
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

/** A prop's foot marks the real landing cell; the flag states its effect. */
function drawPropFlag(d, x, y, amount, up) {
  const c = d.c, w = 80, h = 29;
  const bx = x + (up ? 43 : -34), by = y - 55;
  c.save();
  c.strokeStyle = up ? '#b48c44' : '#9c4350';
  c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(x + (up ? 17 : -17), y - 15); c.lineTo(bx + (up ? -20 : 20), by + h / 2); c.stroke();
  c.fillStyle = up ? '#fff0cc' : '#782535';
  c.strokeStyle = up ? '#b48c44' : '#f2c78c';
  c.lineWidth = 1.5;
  c.beginPath();c.roundRect(bx - w / 2, by - h / 2, w, h, 7);c.fill();c.stroke();
  const size = Math.max(21, 12 * 900 / (c.canvas.clientWidth || 450));
  c.font = '700 ' + size + 'px Georgia,serif';c.textAlign = 'center';c.textBaseline = 'middle';
  c.fillStyle = up ? '#6b4b27' : '#fff0ce';
  c.fillText((up ? '↑ +' : '↓ −') + amount, bx, by, w - 8);
  c.restore();
}

/** Upright red chute, with its exit planted on the actual slide cell. */
function drawSlideProp(d, cell, flash, dump) {
  if (!cell) return;
  const {x, y, u = 0} = cell;
  const down = spiralPoint(Math.max(0, u - 0.006));
  const dx = down.x - x, dy = down.y - y;
  const flip = dx < 0;
  // The ellipse is a projection. Keep the chute upright on its supports at tight turns.
  const slope = clamp(Math.atan2(dy, Math.abs(dx)), -0.32, 0.32);
  const angle = (flip ? -1 : 1) * (slope * 0.65 - 0.18);
  const curveSide = (x - CX) / cell.r;
  const width = trackWidth(u) * (2.48 - Math.abs(curveSide) * 0.37);
  const seatX = x - curveSide * 10;
  if (flash) d.glow(x, y, 32, BURGUNDY);
  d.ellipse(seatX, y + 3, width * 0.38, 6, TRACK_SHADOW + '77');
  if (placePaperIcon(d, 'slide', seatX, y + 3, width, {
    footX: 0.52, footY: 0.88, heightScale: 0.72, angle, flip, shadow: false,
  })) {
    drawPropFlag(d, x, y, dump, false);
    return;
  }
  // Use the same short footprint while the atlas loads.
  const downhillAng = Math.atan2(dy, dx);
  const ux = Math.cos(downhillAng), uy = Math.sin(downhillAng);
  const lipX = x + ux * width * 0.35, lipY = y + uy * width * 0.35;
  const backX = x - ux * width * 0.35, backY = y - uy * width * 0.35;
  const nx = -uy, ny = ux;
  const poly = [
    {x: backX + nx * 11, y: backY + ny * 11},
    {x: backX - nx * 11, y: backY - ny * 11},
    {x: lipX - nx * 6, y: lipY - ny * 6},
    {x: lipX + nx * 6, y: lipY + ny * 6},
  ];
  d.poly(poly, SLIDE_FILL, CREAM_DEEP, 2.2);
  drawPropFlag(d, x, y, dump, false);
}

/** Bold cream+gold cushion — Aura tufted-cushion sprite, vector fallback. */
function drawCushionProp(d, cell, flash, boost) {
  if (!cell) return;
  const x = cell.x, y = cell.y;
  const width = trackWidth(cell.u ?? 0) * 2.32;
  if (flash) d.glow(x, y, 30, GOLD);
  d.ellipse(x, y + 5, width * 0.43, 6, TRACK_SHADOW + '66');
  if (placePaperIcon(d, 'cushion', x, y + 5, width, {footY: 0.9, heightScale: 0.84, shadow: false})) {
    drawPropFlag(d, x, y, boost, true);
    return;
  }
  d.ellipse(x + 2, y + 5, 20, 12, TRACK_SHADOW + '66');
  d.ellipse(x, y, 19, 11, CUSHION_FILL + 'f4', CUSHION_DEEP, 2.4);
  d.ellipse(x - 3, y - 3, 10, 5, GOLD + 'aa', CREAM_DEEP + '88', 1);
  d.ellipse(x + 4, y + 2, 7, 4, CREAM + '77');
  d.circle(x, y, 3, CUSHION_DEEP + 'cc', CREAM_DEEP, 1);
  drawPropFlag(d, x, y, boost, true);
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
function drawBall(d, x, y, r, roll = 0) {
  d.glow(x, y, r * 2.1, GOLD);
  const w = Math.max(23, r * 2.25);
  if (placePaperIcon(d, 'ball', x, y, w, {angle: roll})) return;
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
  intro: 'Tilly’s spiral slide. Pick up the chapter keepsake on the coil, then reach the crest to keep it. A ball dump before the crest puts it back Locked. Ticket ride: chapter 1 is the free ride; later chapters cost a ticket.',
  instructions: 'Step on with → or a tap on the track ahead (court taps only step forward); step back with ← or the ← pad; JUMP (Space, ↑, Enter or J) leaps over the next cell. Cream cushions bounce you up; landing on a red slide drops you lower, but the ride goes on. Carry the keepsake to the crest to collect it — a ball dump before the top puts it back.',
  levels: LEVEL_NAMES,
  images: TOWER_EDITION ? {'tilly-tower': './assets/tilly-icons/helter-tower-v1.webp'} : {},
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: DESCENT_EDITION ? 0 : 100,
  ...(DESCENT_EDITION ? {
    instructions: 'Climb to the crest with the keepsake. Use arrows to step and Space or Jump to hop. At the crest, press Ride down to start the mat. Jump the red bars. Tap Brake for blue bends. Coast to speed up again. Bring the keepsake out through the bottom exit to collect the chapter reward.',
    retryAttempt(s) {
      if (productionPlay()) return this.create(s.level);
      const book = readDescentBook();
      delete book.sittings[s.level];
      localStorage.setItem(DESCENT_BOOK, JSON.stringify(book));
    },
  } : {}),
  actions: [],
  managesEntry: true,
  canStartAttempt(level) { return !isVerifiedPlay() || level === 0 || tickets() >= 1; },
  persist,
  restoreState(blob) {
    productionPlay();
    if (!blob || !Number.isInteger(blob.level) || blob.level < 0 || blob.level > 5 ||
        !Array.isArray(blob.cells) || blob.cells.length < 2 || !Array.isArray(blob.slides) ||
        !Array.isArray(blob.cushions) || !Array.isArray(blob.tokens) || !Number.isFinite(blob.t) ||
        (blob.descent && (!Number.isFinite(blob.descent.u) || blob.descent.u < 0 || blob.descent.u > 1 ||
          !Number.isFinite(blob.descent.remaining)))) throw Error('Invalid Spiral Slide snapshot.');
    return {...blob, rng: () => Math.random()};
  },
  selectedChapter() { if (alleyPlay) return 0; return Math.max(0, Math.min(5, Number(readBook().currentChapter) || 0)); },
  create(level, rng) {
    const production = productionPlay();
    if (!Number.isInteger(level) || level < 0 || level > 5) throw Error('Choose a chapter from 1 to 6.');
    const rand = production ? () => Math.random() : typeof rng === 'function' ? rng : Math.random;
    const plan = chapterBoard(level);
    const cells = buildSpiral(plan.cellCount);
    const slides = plan.slides.map((S) => ({...S, used: false}));
    const cushions = plan.cushions.map((C) => ({...C, used: false}));
    const tokens = plan.tokens.map((T) => ({...T, taken: false}));
    const start = cells[0];
    const crest = spiralPoint(1);
    const s = makeRideState(level, rand, {
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
      frozenChapter: false,
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
    if (production) {
      s.practice = false;
      s.prizeKept = owned(TREASURES[level]);
    }
    const saved = !production && alleyPlay ? (readBook().sittings[String(level)] || null) : null;
    if (reviveSitting(s, saved) && s.launched && !s.treasure) spawnTreasure(s);
    if (DESCENT_EDITION && !production) restoreDescentSitting(s);
    return s;
  },
  update(s, dt, input) {
    productionPlay();
    if (s.saveFault) { persist(s); return; }
    tickFx(s, dt);
    if (s.result || s.broke) { persist(s); return; }
    s.saveClock = (s.saveClock || 0) + dt;
    if (s.saveClock >= 1) { s.saveClock = 0; persist(s); }
    if (s.descent) { updateMatRide(s, dt); return; }

    const spawnIds = (s.cells || []).map((_, i) => 'cell-' + i);
    if (ensureBoarded(s, RIDE, s.treasureId, spawnIds.length ? spawnIds : ['cell-0', 'cell-' + (s.planTreasureCell ?? 17), 'cell-9'])) {
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
      s.note = 'TAP along the spiral — JUMP onto cushions, over slides';
      if (s.eligible) {
        const prefer = s.planTreasureCell != null ? s.planTreasureCell : 17;
        s.spawnId = 'cell-' + prefer;
        s.planTreasureCell = prefer;
      }
      logAction(s, 'preview', {secs: PREVIEW_SECS});
      persist(s);
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
        persist(s);
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
    if (s.descent) { handleDescentInput(s, id); return; }
    if (id === 'jump') doJump(s);
    else if (id === 'left') doTapBack(s);
    else if (id === 'right' || id === 'step') doTap(s);
  },
  pointer(s, type, p) {
    if (s.result || s.broke || !p) return;
    if (s.descent) {
      if (type === 'down') handleDescentInput(s, hitPad(p));
      return;
    }
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
    if (s.descent) {
      const input = k === 'ArrowLeft' ? 'left' : k === 'ArrowRight' ? 'right' :
        ['ArrowUp', ' ', 'Enter', 'j', 'J'].includes(k) ? 'jump' : null;
      if (input) handleDescentInput(s, input);
      return;
    }
    if (k === 'ArrowLeft') doTapBack(s);
    else if (k === 'ArrowRight') doTap(s);
    else if (k === 'ArrowUp' || k === ' ' || k === 'Enter' || k === 'j' || k === 'J') doJump(s);
  },
  draw(s, d) {
    const cells = s.cells || [];
    ensurePaperPropIcons();
    const tower = TOWER_EDITION && d.art?.['tilly-tower'];
    if (tower) {
      d.c.drawImage(tower, 0, 0, 900, 1200);
      drawTowerBrackets(d);
      drawTowerSign(d, s);
    } else {
      d.ellipse(CX, 640, 400, 540, '#4a182410');
      drawPaperScenery(d);
    }

    // RED TRACK is the star — thick coiled ribbon with back→front layering.
    drawSpiralTrack(d, !!tower);

    // Faint cell centers on the ribbon (readable footholds, not geometry lines).
    for (const c of cells) {
      d.circle(c.x, c.y, 4, '#f4d59028', TRACK_EDGE + '55', 1);
    }

    // SLIDE chute wedges (deep-red) sit ON the track.
    for (const S of s.descent ? [] : (s.slides || [])) {
      drawSlideProp(d, cells[S.cell], (s.slideFlash || 0) > 0 && (s.youCell | 0) === S.cell, S.dump);
    }

    // CUSHION plump ovals (cream+gold) sit ON the track.
    for (const C of s.descent ? [] : (s.cushions || [])) {
      drawCushionProp(d, cells[C.cell], (s.cushionFlash || 0) > 0 && (s.youCell | 0) === C.cell, C.boost);
    }

    // Track tokens (star / moon / everyday).
    for (const T of s.descent ? [] : (s.tokens || [])) {
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
    if (!s.descent && s.treasure && !s.treasure.taken) {
      const tc = cellAt(s, s.treasure.cell);
      if (tc) {
        d.glow(tc.x, tc.y, 18, GOLD);
        try {
          const key = typeof spriteKey === 'function' ? spriteKey(s.treasure.id) : s.treasure.id;
          d.item?.(key, tc.x, tc.y, {w: 28, alpha: 0.92});
        } catch {
          d.star(tc.x, tc.y, 10, CREAM);
        }
        d.text(DESCENT_EDITION && s.prizeKept ? 'Collected' : 'Locked', tc.x, tc.y - 22, 10, GOLD);
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
    if (DESCENT_EDITION) drawDescentCourse(d, s);
    if (!s.descent) drawPaperHopper(d, s);

    // Gold celestial ball on the ribbon — rolls crest→stairs (hidden while waiting).
    if (s.ballActive) {
      const bx = s.ballX ?? spiralPoint(s.ballU == null ? 1 : s.ballU).x;
      const by = s.ballY ?? spiralPoint(s.ballU == null ? 1 : s.ballU).y;
      drawBall(d, bx, by, BALL_R, (1 - (s.ballU == null ? 1 : s.ballU)) * TAU * 9);
    }

    // YOU = bea-player (~52–60w) with soft glow; fallback marker if unloaded.
    const yx = s.youX ?? (cells[0] && cells[0].x) ?? CX;
    const yy = s.youY ?? (cells[0] && cells[0].y) ?? Y_BOT;
    if ((s.cushionFlash || 0) > 0) d.glow(yx, yy, 36 + s.cushionFlash * 20, CREAM);
    if ((s.slideFlash || 0) > 0) d.glow(yx, yy, 34 + s.slideFlash * 18, BURGUNDY);
    d.glow(yx, yy + 10, 28, GOLD);
    d.ellipse(yx + 2, yy + 18, 22, 8, TRACK_SHADOW + '44');
    placePaperIcon(d, 'mat', yx, yy + 12, 61);
    const beaOk = placeDress(d, beaPlayerImg, yx, yy - 24, 56);
    if (s.keepsakeTaken && s.treasure && !s.result) {
      try {
        const key = typeof spriteKey === 'function' ? spriteKey(s.treasure.id) : s.treasure.id;
        d.item?.(key, yx + 18, yy - 28, {w: 26, alpha: 0.95});
      } catch {
        d.star(yx + 18, yy - 28, 10, GOLD);
      }
    }
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
    if (!s.result && !s.broke) drawCreamPads(d, s.descent);
    if (s.saveFault) d.text('Saving paused. Keep this window open.', 450, 950, 26, CREAM);
  },
  readout: (s) => s.note || '',
};
