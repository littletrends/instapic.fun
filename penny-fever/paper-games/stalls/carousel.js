/**
 * Florence — Carousel Waltz
 * You sit one painted horse. The ride waltzes. TAP when the brass ring
 * swings to your horse. One cream TAP stick. No Mario platforms.
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
const CX = 450;
const HORSE_X = 450;
const HORSE_Y = 760;
const RING_CX = 450;
const RING_CY = 620;
const GOAL = 3;
const CREAM = '#f4d590';
const GOLD = '#ffe6a4';
const BURGUNDY = '#c67483';
const INK = '#3a1818';
const DRESS = 'waltz-1';

function chapterSpeed(level, reduced) {
  const base = [0.55, 0.62, 0.70, 0.78, 0.72, 0.86][level] || 0.55;
  return reduced ? base * 0.72 : base;
}
function grabHalf(level) {
  return [0.42, 0.36, 0.32, 0.28, 0.30, 0.24][level] || 0.42;
}
function ringCount(level) {
  return level >= 3 ? 2 : 1;
}

function ringPos(angle, which, n) {
  const spread = n > 1 ? which * Math.PI : 0;
  const a = angle + spread;
  return {
    x: RING_CX + Math.sin(a) * 230,
    y: RING_CY + Math.cos(a) * 118,
    a,
  };
}
function inGrab(angle, half) {
  const off = Math.atan2(Math.sin(angle), Math.cos(angle)); // wrap -pi..pi, 0 is front
  return Math.abs(off) <= half;
}

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
  d.ellipse(L.cx + 3, L.cy + 5, L.baseRx, L.baseRy, '#3a1a1266');
  d.ellipse(L.cx, L.cy, L.baseRx, L.baseRy, CREAM + 'ee', GOLD, 2.4);
  const pulse = 0.55 + 0.45 * Math.sin((s.t || 0) * 3.2);
  if (armed) d.glow(L.cx, L.cy, 54 + pulse * 10, GOLD);
  d.ellipse(L.cx, L.cy, L.knobR, L.knobR * 0.82, armed ? GOLD : BURGUNDY, GOLD, 2.2);
  d.text('TAP', L.cx, L.cy + 44, 26, armed ? '#6b2030' : INK);
}

function dressUrl(file) {
  return new URL('../assets/prop-kits/carousel/' + file + '?v=' + DRESS, import.meta.url).href;
}
const dressImgs = {};
function ensureDress() {
  if (dressImgs.horse) return dressImgs;
  const files = {
    horse: 'piece-01.png',
    star: 'piece-02.png',
    moon: 'piece-03.png',
    arch: 'piece-04.png',
    canopy: 'piece-05.png',
    pennant: 'piece-06.png',
  };
  for (const [k, f] of Object.entries(files)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = dressUrl(f);
    dressImgs[k] = img;
  }
  const bea = new Image();
  bea.decoding = 'async';
  bea.src = new URL('../assets/shared-player/bea-player.png?v=' + DRESS, import.meta.url).href;
  dressImgs.bea = bea;
  return dressImgs;
}
function place(d, img, x, y, w, angle) {
  if (!(img && img.complete && img.naturalWidth > 0) || typeof d.sprite !== 'function') return false;
  return d.sprite(img, x, y, {w, shadow: true, angle: angle || 0});
}

function boardIfNeeded(s) {
  ensureBoarded(s, RIDE, TREASURES[s.level] || TREASURES[0], ['ring-0', 'ring-1']);
}

function tryGrab(s) {
  if (s.result || s.lockTap > 0) return;
  s.lockTap = 0.18;
  s.stick = {active: true, kx: 0, ky: 0};
  const half = s.grabHalf;
  const n = s.rings;
  let hit = -1;
  for (let i = 0; i < n; i++) {
    const p = ringPos(s.angle, i, n);
    if (inGrab(p.a, half)) { hit = i; break; }
  }
  if (hit < 0) {
    s.note = 'The ring swung past — wait for the next turn.';
    logAction(s, 'miss', {reason: 'early'});
    return;
  }
  if (s.practice) {
    s.found = (s.found || 0) + 1;
    s.note = s.found >= GOAL ? 'Practice waltz — the ring is yours. Ride on.' : 'Caught! ' + s.found + ' / ' + GOAL;
    logAction(s, 'practice-grab', {hit});
    if (s.found >= GOAL) {
      finishRide(s, {rideId: RIDE, treasureId: s.treasureId, challengeOk: true, completionFind: 'star-token'});
    }
    return;
  }
  s.found = (s.found || 0) + 1;
  const isTreasurePass = s.eligible && !s.treasureCollected && (s.spawnId === 'ring-' + hit || (hit === 0 && s.found === 2));
  if (isTreasurePass) {
    recordTreasure(s, s.treasureId);
    s.note = 'The brass ring — chapter bonus!';
    logAction(s, 'treasure', {hit});
  } else {
    const drip = ORDINARY[s.found % ORDINARY.length];
    recordFind(s, drip, RIDE);
    s.note = 'Caught the ring! ' + s.found + ' / ' + GOAL;
    logAction(s, 'grab', {hit});
  }
  if (s.found >= GOAL) {
    finishRide(s, {
      rideId: RIDE,
      treasureId: s.treasureId,
      challengeOk: true,
      completionFind: 'star-token',
    });
  }
}

export default {
  title: 'Carousel Waltz',
  retryButton: 'Play again',
  intro: 'Round and round, the secrets change. Sit Florence’s painted horse. The carousel waltzes. TAP when the brass ring swings to your saddle.',
  instructions: 'One horse, one TAP. Watch the ring come around. TAP the cream stick (or Space) when it reaches you. Misses stay on the ride. Practice keeps nothing. A paid waltz needs three clean grabs; the glowing ring can be this chapter’s bonus.',
  levels: LEVELS,
  sprites: TREASURES.concat(ORDINARY),
  prizes: TREASURES,
  houseSeconds: 100,
  houseTitle: 'The waltz ended',
  houseDetail: 'The lantern dimmed before the last lap. Try this chapter again.',
  actions: [],
  onTimeout(s) {
    finishRide(s, {
      rideId: RIDE,
      treasureId: s.treasureId,
      challengeOk: (s.found || 0) >= GOAL,
      completionFind: 'star-token',
    });
  },
  create(level, rng) {
    const reduced = prefersReducedMotion();
    return makeRideState(level, rng, {
      angle: -1.2,
      found: 0,
      goal: GOAL,
      treasureId: TREASURES[Math.max(0, Math.min(level, TREASURES.length - 1))],
      reduced,
      speed: chapterSpeed(level, reduced),
      grabHalf: grabHalf(level),
      rings: ringCount(level),
      lockTap: 0,
      stick: null,
      bob: 0,
      note: 'Sit the horse — TAP when the ring reaches you.',
    });
  },
  update(s, dt) {
    if (!s.boarded && !s.result) boardIfNeeded(s);
    s.t += dt;
    s.lockTap = Math.max(0, (s.lockTap || 0) - dt);
    if (s.stick && s.stick.active && s.lockTap <= 0) s.stick = null;
    if (s.result) return;
    s.angle += s.speed * dt;
    s.bob = Math.sin(s.t * 2.2) * 8;
    const n = s.rings;
    const half = s.grabHalf;
    let near = false;
    for (let i = 0; i < n; i++) {
      if (inGrab(ringPos(s.angle, i, n).a, half)) near = true;
    }
    if (near && !(s.note && s.note.startsWith('Caught'))) s.note = 'NOW — TAP the ring!';
    else if (!near && s.note === 'NOW — TAP the ring!') s.note = 'Wait for the next turn.';
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (type === 'down') {
      if (hitTapStick(p) || (p && p.y > 200 && p.y < 1080)) tryGrab(s);
    }
  },
  key(s, k, down) {
    if (!down || s.result) return;
    if (k === ' ' || k === 'Enter') tryGrab(s);
  },
  draw(s, d) {
    const imgs = ensureDress();
    const bob = s.bob || 0;
    place(d, imgs.canopy, CX, 250, 420, 0);
    place(d, imgs.arch, CX, 430, 380, 0);
    place(d, imgs.star, 160, 320, 90, 0);
    place(d, imgs.moon, 740, 320, 90, 0);
    place(d, imgs.pennant, 120, 520, 80, -0.2);

    const hy = HORSE_Y + bob;
    place(d, imgs.horse, HORSE_X, hy, 280, 0);
    place(d, imgs.bea, HORSE_X - 8, hy - 70, 92, 0);
    d.text('you', HORSE_X, hy + 118, 16, INK);

    const n = s.rings || 1;
    const half = s.grabHalf;
    for (let i = 0; i < n; i++) {
      const p = ringPos(s.angle, i, n);
      const hot = inGrab(p.a, half);
      if (hot) d.glow(p.x, p.y, 54, GOLD);
      d.ring(p.x, p.y, hot ? 34 : 28, hot ? GOLD : '#e2b972', hot ? 12 : 9);
      if (hot) d.text('NOW', p.x, p.y + 2, 14, INK);
    }

    d.wrap(s.note || '', CX, 980, 20, '#3a1818', 700);
    d.text((s.found || 0) + ' / ' + GOAL + (s.practice ? ' · practice' : ''), CX, 160, 18, GOLD);
    drawTapStick(s, d);
  },
  readout: s => (s.practice ? 'practice · ' : '') + (s.note || ''),
};
