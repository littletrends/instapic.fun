/**
 * Florence — Carousel Waltz
 * Mario Kart energy on a painted roundabout: race horses around the canopy,
 * change lanes, grab item globes, boost / pie / star. Win the laps.
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
const CHAPTERS = [
  {title: 'First Turn', laps: 2, ai: 2, speed: 1.05, items: false, pies: false},
  {title: 'Painted Ponies', laps: 2, ai: 3, speed: 1.15, items: true, pies: false},
  {title: 'Mirror Round', laps: 3, ai: 3, speed: 1.22, items: true, pies: true},
  {title: 'Carriage Windows', laps: 3, ai: 3, speed: 1.32, items: true, pies: true},
  {title: 'Midnight Canopy', laps: 3, ai: 4, speed: 1.38, items: true, pies: true},
  {title: 'The Grand Waltz', laps: 3, ai: 4, speed: 1.48, items: true, pies: true},
];
const CX = 450;
const CY = 590;
const LANES = 3;
const CREAM = '#f4d590';
const GOLD = '#ffe6a4';
const BURGUNDY = '#c67483';
const INK = '#3a1818';
const DRESS = 'race-1';
const AI_TINT = ['#c67483', '#6aaa9a', '#7a8ec8', '#c88a5a'];
const AI_NAME = ['Brass', 'Ribbon', 'Moon', 'Ticket'];
const ITEMS = ['boost', 'pie', 'star'];

function chOf(level) {
  return CHAPTERS[Math.max(0, Math.min(level | 0, CHAPTERS.length - 1))];
}
function laneRadii(lane) {
  return {rx: 198 + lane * 40, ry: 118 + lane * 26};
}
function onTrack(angle, lane) {
  const {rx, ry} = laneRadii(lane);
  return {
    x: CX + Math.sin(angle) * rx,
    y: CY + Math.cos(angle) * ry,
    a: angle,
    scale: 0.72 + 0.38 * ((CY + Math.cos(angle) * ry) - (CY - ry)) / (2 * ry + 1),
  };
}
function wrapAng(a) {
  let x = a % TAU;
  if (x < 0) x += TAU;
  return x;
}
function angDiff(a, b) {
  let d = wrapAng(a) - wrapAng(b);
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function stickLayout() {
  return {cx: 320, cy: 1134, baseRx: 96, baseRy: 58, knobR: 30, maxPull: 44, dead: 12};
}
function usePad() {
  return {x: 520, y: 1088, w: 250, h: 92};
}
function hitStick(p) {
  if (!p) return false;
  const L = stickLayout();
  const dx = (p.x - L.cx) / L.baseRx;
  const dy = (p.y - L.cy) / L.baseRy;
  return (dx * dx + dy * dy) <= 1.4;
}
function hitUse(p) {
  if (!p) return false;
  const b = usePad();
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}
function applyStick(s, p) {
  const L = stickLayout();
  const dx = (p?.x ?? L.cx) - L.cx;
  const dy = (p?.y ?? L.cy) - L.cy;
  const len = Math.hypot(dx, dy) || 1;
  const pull = Math.min(len, L.maxPull);
  s.stick = {active: true, kx: (dx / len) * pull, ky: (dy / len) * pull};
}

function dressUrl(file) {
  return new URL('../assets/prop-kits/carousel/' + file + '?v=' + DRESS, import.meta.url).href;
}
const dressImgs = {};
function ensureDress() {
  if (dressImgs.horse) return dressImgs;
  const files = {
    horse: 'piece-01.png', star: 'piece-02.png', moon: 'piece-03.png',
    arch: 'piece-04.png', canopy: 'piece-05.png', pennant: 'piece-06.png',
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
function place(d, img, x, y, w, opts = {}) {
  if (!(img && img.complete && img.naturalWidth > 0) || typeof d.sprite !== 'function') return false;
  return d.sprite(img, x, y, {w, shadow: true, ...opts});
}

function makeRacer(id, angle, lane, ai, tint, name) {
  return {
    id, angle, lane, laneF: lane, speed: 0, boost: 0, slow: 0, star: 0,
    item: null, ai, tint, name, finished: 0, laps: 0, lastAng: angle,
  };
}
function spawnBoxes(ch) {
  if (!ch.items) return [];
  const n = 4;
  return Array.from({length: n}, (_, i) => ({
    angle: (i / n) * TAU + 0.4,
    lane: 1,
    kind: 'box',
    cool: 0,
  }));
}

function boardIfNeeded(s) {
  ensureBoarded(s, RIDE, TREASURES[s.level] || TREASURES[0], ['finish']);
}

function placeOf(s, racer) {
  const score = (r) => r.laps * TAU + wrapAng(r.angle);
  const you = score(racer);
  let place = 1;
  for (const r of s.racers) {
    if (r.id === racer.id) continue;
    if (score(r) > you + 0.001) place++;
  }
  return place;
}

function useItem(s, r) {
  if (!r.item || s.count > 0) return;
  const it = r.item;
  r.item = null;
  if (it === 'boost') r.boost = Math.max(r.boost, 1.35);
  else if (it === 'star') { r.star = 2.2; r.boost = Math.max(r.boost, 1.1); }
  else if (it === 'pie') {
    s.hazards.push({angle: wrapAng(r.angle - 0.28), lane: Math.round(r.laneF), life: 8});
  }
  logAction(s, 'item', {id: r.id, it});
}

function pickBox(s, r, box) {
  box.cool = 4.2;
  r.item = ITEMS[(Math.abs((r.id * 17 + (s.t * 10) | 0)) % ITEMS.length)];
  if (r.id === 'you' && !s.practice) recordFind(s, ORDINARY[s.found++ % ORDINARY.length], RIDE);
}

function finishPlayer(s) {
  if (s.result) return;
  const place = placeOf(s, s.you);
  const wonRace = place === 1;
  if (wonRace && s.eligible && !s.treasureCollected) recordTreasure(s, s.treasureId);
  s.note = wonRace ? 'First past the canopy!' : 'You placed ' + place + '.';
  finishRide(s, {
    rideId: RIDE,
    treasureId: s.treasureId,
    challengeOk: wonRace,
    completionFind: wonRace ? 'star-token' : 'moon-penny',
  });
}

function stepRacer(s, r, dt, ch) {
  const reduced = s.reduced ? 0.75 : 1;
  let spd = ch.speed * 0.95 * reduced;
  if (r.ai) {
    spd *= 0.92 + (r.id.length % 5) * 0.02 + Math.sin(s.t * 0.7 + r.angle) * 0.04;
    if (s.t > 1.2 && (Math.floor(s.t * 3 + r.angle * 4) % 17 === 0) && r.laneCool <= 0) {
      r.lane = clamp(r.lane + (Math.sin(s.t + r.angle) > 0 ? 1 : -1), 0, LANES - 1);
      r.laneCool = 0.9;
    }
    if (r.item && Math.sin(s.t * 2 + r.angle) > 0.7) useItem(s, r);
  } else {
    const L = s.stick;
    if (L && L.active) {
      if (L.kx < -18 && r.laneCool <= 0) { r.lane = Math.max(0, r.lane - 1); r.laneCool = 0.28; }
      if (L.kx > 18 && r.laneCool <= 0) { r.lane = Math.min(LANES - 1, r.lane + 1); r.laneCool = 0.28; }
      if (L.ky < -16) spd *= 1.22;
    }
  }
  if (r.boost > 0) { spd *= 1.55; r.boost -= dt; }
  if (r.star > 0) { spd *= 1.2; r.star -= dt; }
  if (r.slow > 0) { spd *= 0.55; r.slow -= dt; }
  r.laneCool = Math.max(0, (r.laneCool || 0) - dt);
  r.laneF += (r.lane - r.laneF) * Math.min(1, dt * 6);
  const prev = r.angle;
  r.angle = wrapAng(r.angle + spd * dt);
  if (r.angle < prev) r.laps += 1;
  r.speed = spd;
}

function collide(s, dt) {
  const list = s.racers;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (Math.abs(a.laneF - b.laneF) > 0.55) continue;
      const d = Math.abs(angDiff(a.angle, b.angle));
      if (d > 0.18) continue;
      if (a.star > 0 || b.star > 0) continue;
      const ahead = angDiff(a.angle, b.angle) > 0 ? a : b;
      const behind = ahead === a ? b : a;
      behind.slow = Math.max(behind.slow, 0.35);
      behind.angle = wrapAng(behind.angle - 0.04);
    }
  }
}

function pickups(s) {
  const ch = chOf(s.level);
  for (const box of s.boxes) {
    if (box.cool > 0) continue;
    for (const r of s.racers) {
      if (r.item) continue;
      if (Math.abs(r.laneF - box.lane) > 0.6) continue;
      if (Math.abs(angDiff(r.angle, box.angle)) < 0.12) pickBox(s, r, box);
    }
  }
  if (!ch.pies) return;
  for (const h of s.hazards) {
    for (const r of s.racers) {
      if (r.star > 0) continue;
      if (Math.abs(r.laneF - h.lane) > 0.55) continue;
      if (Math.abs(angDiff(r.angle, h.angle)) < 0.1) r.slow = Math.max(r.slow, 0.8);
    }
  }
}

function drawStick(s, d) {
  const L = stickLayout();
  const armed = !!(s.stick && s.stick.active);
  const kx = armed ? (s.stick.kx || 0) : 0;
  const ky = armed ? (s.stick.ky || 0) : 0;
  d.ellipse(L.cx + 3, L.cy + 5, L.baseRx, L.baseRy, '#3a1a1266');
  d.ellipse(L.cx, L.cy, L.baseRx, L.baseRy, CREAM + 'ee', GOLD, 2.2);
  d.ellipse(L.cx + kx, L.cy + ky, L.knobR, L.knobR * 0.82, armed ? GOLD : BURGUNDY, GOLD, 2);
  d.text('STEER', L.cx, L.cy - L.baseRy + 16, 14, INK);
}
function drawUse(s, d) {
  const b = usePad();
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const has = !!(s.you && s.you.item);
  d.ellipse(cx + 2, cy + 4, b.w * 0.48, b.h * 0.42, '#12233566');
  d.ellipse(cx, cy, b.w * 0.48, b.h * 0.42, CREAM + 'ee', GOLD, 2.2);
  d.text(has ? s.you.item.toUpperCase() : 'BOOST', cx, cy + 2, 22, INK);
}

function drawHorse(d, imgs, r, you) {
  const p = onTrack(r.angle, r.laneF);
  const w = (you ? 118 : 100) * p.scale;
  const facing = Math.cos(r.angle);
  const flip = facing < 0;
  if (r.star > 0) d.glow(p.x, p.y, 70, GOLD);
  if (r.boost > 0) d.glow(p.x, p.y, 48, BURGUNDY);
  const ok = place(d, imgs.horse, p.x, p.y, w, {flip, angle: facing * -0.12});
  if (!ok) {
    d.ellipse(p.x, p.y, w * 0.38, w * 0.22, r.tint || CREAM, GOLD, 2);
  }
  if (you) place(d, imgs.bea, p.x - 6, p.y - w * 0.28, w * 0.42, {flip});
  else d.ellipse(p.x, p.y - 8, 10, 6, r.tint, GOLD, 1);
  if (you) d.text('you', p.x, p.y + w * 0.38, 13, INK);
}

export default {
  title: 'Carousel Waltz',
  retryButton: 'Play again',
  intro: 'Florence’s painted derby. Race the other horses around the canopy — steer lanes, snatch globes, boost, drop pies. First over the finish keeps the chapter bonus when tonight’s mark is in.',
  instructions: 'STEER left/right to change lane. Hold the stick up to gallop faster. USE fires a globe (boost, pie, star). Beat the field on the laps. Practice keeps nothing.',
  levels: CHAPTERS.map(c => c.title),
  sprites: TREASURES.concat(ORDINARY),
  prizes: TREASURES,
  houseSeconds: 100,
  houseTitle: 'The waltz ended',
  houseDetail: 'The lanterns dimmed before the last lap. Race this chapter again.',
  actions: [],
  clockRuns: s => s.phase === 'race' && !s.result,
  onTimeout(s) {
    finishRide(s, {
      rideId: RIDE,
      treasureId: s.treasureId,
      challengeOk: false,
      completionFind: 'star-token',
    });
  },
  create(level, rng) {
    const ch = chOf(level);
    const reduced = prefersReducedMotion();
    const you = makeRacer('you', 0, 1, false, GOLD, 'You');
    const racers = [you];
    for (let i = 0; i < ch.ai; i++) {
      racers.push(makeRacer('ai' + i, -0.45 * (i + 1), i % LANES, true, AI_TINT[i % AI_TINT.length], AI_NAME[i % AI_NAME.length]));
    }
    return makeRideState(level, rng, {
      phase: 'count',
      count: 3.2,
      you, racers,
      boxes: spawnBoxes(ch),
      hazards: [],
      found: 0,
      treasureId: TREASURES[Math.max(0, Math.min(level, TREASURES.length - 1))],
      reduced,
      stick: null,
      note: '3 — hold STEER, race the horses.',
    });
  },
  update(s, dt, input) {
    if (!s.boarded && !s.result) boardIfNeeded(s);
    s.t += dt;
    if (s.result) return;
    const ch = chOf(s.level);
    if (s.phase === 'count') {
      s.count -= dt;
      const n = Math.min(3, Math.max(0, Math.ceil(s.count)));
      s.note = n > 0 ? (n + '…') : 'GO!';
      if (s.count <= 0) { s.phase = 'race'; s.note = 'Race! STEER lanes — USE items.'; }
      return;
    }
    if (input?.keys) {
      if (input.keys.has('ArrowLeft') && s.you.laneCool <= 0) { s.you.lane = Math.max(0, s.you.lane - 1); s.you.laneCool = 0.28; }
      if (input.keys.has('ArrowRight') && s.you.laneCool <= 0) { s.you.lane = Math.min(LANES - 1, s.you.lane + 1); s.you.laneCool = 0.28; }
      if (input.keys.has('ArrowUp')) s.you.boost = Math.max(s.you.boost, 0.05);
    }
    for (const r of s.racers) {
      if (r.finished) continue;
      stepRacer(s, r, dt, ch);
      if (r.laps >= ch.laps) {
        r.finished = placeOf(s, r);
        if (r.id === 'you') finishPlayer(s);
      }
    }
    collide(s, dt);
    pickups(s);
    for (const b of s.boxes) b.cool = Math.max(0, b.cool - dt);
    s.hazards = s.hazards.filter(h => (h.life -= dt) > 0);
    if (s.phase === 'race' && s.you && !s.you.finished) {
      s.note = 'Lap ' + Math.min(ch.laps, s.you.laps + 1) + '/' + ch.laps + ' · P' + placeOf(s, s.you);
    }
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (type === 'down') {
      if (hitUse(p)) {
        if (s.you.item) useItem(s, s.you);
        else s.you.boost = Math.max(s.you.boost, 0.55);
        return;
      }
      if (hitStick(p) || (p && p.y > 200)) applyStick(s, p);
      return;
    }
    if (type === 'move' || type === 'drag') {
      if (s.stick && s.stick.active) applyStick(s, p);
      return;
    }
    if (type === 'up' || type === 'cancel') s.stick = null;
  },
  key(s, k, down) {
    if (!down || s.result) return;
    if (k === ' ' || k === 'Enter') {
      if (s.you.item) useItem(s, s.you);
      else s.you.boost = Math.max(s.you.boost, 0.55);
    }
  },
  draw(s, d) {
    const imgs = ensureDress();
    const ch = chOf(s.level);
    place(d, imgs.canopy, CX, CY - 8, 168, {});
    place(d, imgs.arch, CX, CY + 6, 210, {});
    place(d, imgs.star, 118, 268, 78, {});
    place(d, imgs.moon, 782, 268, 78, {});
    for (let lane = LANES - 1; lane >= 0; lane--) {
      const {rx, ry} = laneRadii(lane);
      d.ellipse(CX, CY, rx, ry, null, lane === 1 ? GOLD : '#d2a65b88', lane === 1 ? 3 : 1.6);
    }
    for (const box of s.boxes) {
      if (box.cool > 0) continue;
      const p = onTrack(box.angle, box.lane);
      d.glow(p.x, p.y, 28, GOLD);
      d.circle(p.x, p.y, 14, CREAM, GOLD, 2);
      d.star(p.x, p.y, 8, BURGUNDY);
    }
    for (const h of s.hazards) {
      const p = onTrack(h.angle, h.lane);
      d.ellipse(p.x, p.y, 16, 10, BURGUNDY, GOLD, 1);
    }
    const drawOrder = s.racers.slice().sort((a, b) => onTrack(a.angle, a.laneF).y - onTrack(b.angle, b.laneF).y);
    for (const r of drawOrder) drawHorse(d, imgs, r, r.id === 'you');

    const got = !!s.treasureCollected;
    d.item(spriteKey(s.treasureId), 800, 130, {w: 64, fallback: () => d.star(800, 130, 22)});
    d.text(got ? 'Collected' : 'Locked', 800, 182, 14, got ? '#c8e878' : '#ead6a4');
    d.text((s.practice ? 'practice · ' : '') + (s.you ? 'P' + placeOf(s, s.you) : ''), 450, 118, 20, GOLD);
    d.wrap(s.note || '', CX, 980, 20, INK, 700);
    drawStick(s, d);
    drawUse(s, d);
  },
  readout: s => (s.practice ? 'practice · ' : '') + (s.note || ''),
};
