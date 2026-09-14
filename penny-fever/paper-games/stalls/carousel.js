import {TAU, clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js?v=ritual-3';
import {
  boardRide, sealAttempt, recordFind, recordTreasure, settleArrival, logAction, prefersReducedMotion,
} from '../ride-seek.js?v=phone-layout-1';

const RIDE = 'carousel';
const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
const TREASURES = ['music-carousel', 'organ-music-box', 'pocket-wheel', 'laughing-doorway', 'ride-explorer-pennant', 'ride-ticket'];
const DRAG_PX = 14;
const LOOK_X = 900 * 0.15;
const LOOK_Y = 1200 * 0.10;
const RECENTER_MS = 0.25;
const GOAL = 3;
const SPOTS = [
  {id: 'saddle', label: 'a saddle flap', x: 620, y: 640},
  {id: 'canopy', label: 'the canopy fringe', x: 450, y: 220},
  {id: 'panel', label: 'a painted panel', x: 240, y: 520},
  {id: 'pole', label: 'the centre pole', x: 470, y: 430},
  {id: 'carriage', label: 'a carriage window', x: 700, y: 780},
];

function chapterTune(level) {
  const speed = 0.42 + level * 0.06;
  const window = Math.max(1.25, 2.7 - level * 0.18);
  const decoys = level >= 2;
  const vertical = level >= 4;
  return {speed, window, decoys, vertical, laps: 3};
}

function horsePoint(i, n, angle, cx, cy, rx, ry) {
  const a = angle + i * TAU / n;
  return {x: cx + Math.sin(a) * rx, y: cy + Math.cos(a) * ry * 0.42, a, scale: 0.72 + Math.cos(a) * 0.28};
}

function scheduleFinds(s, rng) {
  const tune = chapterTune(s.level);
  const lap = TAU / Math.max(0.2, tune.speed);
  const finds = [];
  for (let i = 0; i < GOAL + (s.level > 0 ? 1 : 0); i++) {
    const spot = SPOTS[i % SPOTS.length];
    const start = (s.practice ? lap * 0.85 : lap * 0.35) + i * (lap * 0.55);
    finds.push({
      kind: 'ordinary',
      id: ORDINARY[i % ORDINARY.length],
      spot: spot.id,
      x: spot.x,
      y: spot.y,
      from: start,
      until: start + tune.window + 1.2,
      taken: false,
    });
  }
  s.finds = finds;
  if (s.eligible && s.spawnId) {
    const spot = SPOTS.find(row => row.id === s.spawnId) || SPOTS[0];
    const from = lap * 1.4;
    s.treasure = {
      id: s.treasureId,
      spot: spot.id,
      x: spot.x,
      y: (tune.vertical && spot.id === 'canopy') ? 160 : spot.y,
      from,
      until: from + Math.max(2.5, tune.window),
      taken: false,
    };
  } else s.treasure = null;
  if (tune.decoys) {
    s.decoys = [{x: 320, y: 300, from: lap * 1.1, until: lap * 1.1 + 1.4}];
  } else s.decoys = [];
}

function visibleAt(item, t) {
  return item && !item.taken && t >= item.from && t <= item.until;
}

function hit(item, p, look) {
  if (!item) return false;
  const x = item.x + look.x, y = item.y + look.y;
  return Math.hypot(p.x - x, p.y - y) < 54;
}

function board(s, rng) {
  if (s.boarded) return;
  s.boarded = true;
  if (s.chapterPrize) { s.chapterPrize.field = true; s.chapterPrize.alpha = 0; }
  const boarding = boardRide(RIDE, s.level);
  if (!boarding.ok) {
    s.broke = true;
    done(s, 'Need a penny', 'Cash a ticket at Aura’s booth for five pennies, then board again.', {won: false, prize: false});
    return;
  }
  s.practice = boarding.practice;
  const spawnIds = SPOTS.map(row => row.id);
  const sealed = sealAttempt({
    rng, chapter: s.level, practice: s.practice,
    treasureId: s.treasureId, rideId: RIDE, spawnIds,
  });
  s.hiddenResult = sealed.hiddenResult;
  s.eligible = sealed.eligible;
  s.spawnId = sealed.spawnId;
  s.preserved = sealed.preserved;
  s.slot = sealed.slot;
  scheduleFinds(s, rng);
  s.note = s.practice
    ? 'Practice ride — look and tap three glints. Nothing is kept. Finishing opens the chapter.'
    : (s.eligible ? 'A keepsake is hiding this waltz. Look, then tap.' : 'Search the passing horses. Three glints finish the ride.');
  logAction(s, 'board', {practice: s.practice, eligible: s.eligible, spawnId: s.spawnId});
}

function arrive(s) {
  if (s.result) return;
  const challengeOk = s.collected.filter(row => row.kind === 'ordinary').length >= GOAL;
  if (s.treasure && s.eligible && s.t >= s.treasure.from && !s.treasure.taken) s.treasureRevealed = true;
  const names = s.collected.map(row => itemName(row.id)).filter(Boolean);
  s.ordinaryReward = names.slice(0, 3).join(', ');
  const outcome = settleArrival(s, {
    rideId: RIDE, chapter: s.level, treasureId: s.treasureId, stall: RIDE, challengeOk,
    completionFind: 'star-token',
  });
  done(s, outcome.title, outcome.detail, {
    won: outcome.won,
    prize: outcome.prize,
    advance: outcome.advance === false ? false : undefined,
    settle: true,
  });
}

export default {
  title: 'Carousel Waltz',
  intro: 'Florence’s carousel carries you. Look a little, tap what you find, and let the horse bring you home.',
  instructions: 'Drag to look. Tap a glint to collect. The first ride of each chapter is free practice. A paid waltz costs one penny. Find three ordinary keepsakes to finish. A chapter treasure only appears on some paid rides.',
  levels: ['First Turn', 'Painted Ponies', 'Mirror Round', 'Carriage Windows', 'Midnight Canopy', 'The Grand Waltz'],
  sprites: ['music-carousel', 'organ-music-box', 'everyday-penny', 'star-token', 'moon-penny', 'laughing-doorway', 'ride-explorer-pennant', 'ride-ticket'],
  prizes: TREASURES,
  houseSeconds: 70,
  houseTitle: 'The waltz ended',
  houseDetail: 'The lantern dimmed before the last lap. Try this chapter again.',
  create(level, rng) {
    const rand = typeof rng === 'function' ? rng : Math.random;
    const reduced = prefersReducedMotion();
    const s = {
      level, t: 0, angle: 0, lookX: 0, lookY: 0, lookVX: 0, lookVY: 0,
      drag: null, boarded: false, practice: true, broke: false,
      collected: [], actions: [], note: 'Step onto the horse.',
      treasureId: TREASURES[Math.max(0, Math.min(level, TREASURES.length - 1))],
      reduced, rng: rand, eligible: false, spawnId: null, hiddenResult: 0,
      treasureCollected: null, treasureRevealed: false,
    };
    return s;
  },
  update(s, dt, input) {
    if (s.result || s.broke) return;
    board(s, s.rng);
    if (s.result) return;
    const tune = chapterTune(s.level);
    const speed = s.reduced ? tune.speed * 0.72 : tune.speed;
    s.t += dt;
    s.angle += speed * dt;
    const lap = TAU / speed;
    if (!s.drag) {
      const k = Math.min(1, dt / RECENTER_MS);
      s.lookX += (0 - s.lookX) * k;
      s.lookY += (0 - s.lookY) * k;
    }
    if (s.treasure && visibleAt(s.treasure, s.t) && !s.treasureRevealed) {
      s.treasureRevealed = true;
      logAction(s, 'reveal', {spot: s.treasure.spot});
    }
    if (s.t >= lap * tune.laps) arrive(s);
  },
  pointer(s, type, p) {
    if (s.result || s.broke) return;
    if (type === 'down') {
      s.drag = {x: p.x, y: p.y, lookX: s.lookX, lookY: s.lookY, moved: false};
      return;
    }
    if (type === 'move' && s.drag) {
      const dx = p.x - s.drag.x, dy = p.y - s.drag.y;
      if (Math.hypot(dx, dy) > DRAG_PX) s.drag.moved = true;
      if (s.drag.moved) {
        s.lookX = clamp(s.drag.lookX + dx, -LOOK_X, LOOK_X);
        s.lookY = clamp(s.drag.lookY + dy, -LOOK_Y, LOOK_Y);
      }
      return;
    }
    if (type === 'up' && s.drag) {
      const drag = s.drag;
      s.drag = null;
      if (drag.moved) {
        logAction(s, 'look', {x: Math.round(s.lookX), y: Math.round(s.lookY)});
        return;
      }
      const look = {x: s.lookX, y: s.lookY};
      logAction(s, 'tap', {x: Math.round(p.x), y: Math.round(p.y)});
      if (s.treasure && visibleAt(s.treasure, s.t) && hit(s.treasure, p, look)) {
        s.treasure.taken = true;
        recordTreasure(s, s.treasure.id);
        s.note = 'The keepsake is yours — finish the waltz.';
        return;
      }
      const find = s.finds?.find(row => visibleAt(row, s.t) && hit(row, p, look));
      if (find) {
        find.taken = true;
        recordFind(s, find.id, RIDE);
        const n = s.collected.filter(row => row.kind === 'ordinary').length;
        s.note = n >= GOAL ? 'Three finds — ride the horse home.' : (n + ' of ' + GOAL + ' ordinary finds.');
        return;
      }
      if (s.decoys?.some(row => visibleAt(row, s.t) && hit(row, p, look))) {
        s.note = 'A reflection — it will not come with you.';
      }
    }
    if (type === 'cancel') s.drag = null;
  },
  draw(s, d) {
    const cx = 450 + s.lookX, cy = 640 + s.lookY;
    d.ellipse(450, 1180, 520, 220, '#1a1410');
    d.ellipse(cx, cy + 210, 340, 90, '#3a2418');
    d.ellipse(cx, cy + 200, 318, 78, '#5a3a22', '#d2a65b', 3);
    d.poly([[cx - 210, cy - 280], [cx + 210, cy - 280], [cx + 250, cy - 40], [cx - 250, cy - 40]], '#6b2030', '#d2a65b', 3);
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI + i * Math.PI / 7;
      d.line({x: cx, y: cy - 40}, {x: cx + Math.cos(a) * 240, y: cy - 40 + Math.sin(a) * 70}, '#d2a65b', 2);
    }
    d.ellipse(cx, cy - 300, 230, 48, '#4a1824', '#f0d09a', 3);
    d.circle(cx, cy - 40, 18, '#d2a65b', '#f8e4b3', 2);
    d.line({x: cx, y: cy - 40}, {x: cx, y: cy + 200}, '#c4a46a', 8);
    const n = 6;
    for (let i = 1; i < n; i++) {
      const h = horsePoint(i, n, s.angle, cx, cy + 40, 250, 220);
      const bob = Math.sin(s.angle * 2 + i) * 10;
      d.ellipse(h.x + 6, h.y + 28 + bob, 34 * h.scale, 12, '#12233555');
      d.poly([
        [h.x - 36 * h.scale, h.y + bob],
        [h.x + 40 * h.scale, h.y - 8 + bob],
        [h.x + 48 * h.scale, h.y + 18 + bob],
        [h.x - 28 * h.scale, h.y + 22 + bob],
      ], '#f3e2bd', '#b78b48', 2);
      d.circle(h.x + 40 * h.scale, h.y - 4 + bob, 11 * h.scale, '#f3e2bd', '#b78b48', 1.5);
    }
    const you = horsePoint(0, n, 0, cx, cy + 110, 0, 0);
    const bob = Math.sin(s.t * 2.2) * (s.reduced ? 3 : 8);
    d.poly([[you.x - 70, you.y + 40 + bob], [you.x + 80, you.y + 20 + bob], [you.x + 88, you.y + 70 + bob], [you.x - 60, you.y + 78 + bob]], '#f7efe0', '#b78b48', 3);
    d.circle(you.x + 78, you.y + 28 + bob, 22, '#f7efe0', '#b78b48', 2);
    d.poly([[you.x - 10, you.y + 8 + bob], [you.x + 36, you.y + 8 + bob], [you.x + 40, you.y + 36 + bob], [you.x - 14, you.y + 38 + bob]], '#6b2030', '#d2a65b', 2);
    d.item(spriteKey('music-carousel'), cx, cy - 40, {w: 92, shadow: false, fallback: () => d.star(cx, cy - 40, 16)});
    const look = {x: s.lookX, y: s.lookY};
    s.finds?.forEach(row => {
      if (!visibleAt(row, s.t)) return;
      d.glow(row.x + look.x, row.y + look.y, 46, '#ffe6a4');
      d.item(spriteKey(row.id), row.x + look.x, row.y + look.y, {w: 56, shadow: false, fallback: () => d.star(row.x + look.x, row.y + look.y, 14)});
    });
    s.decoys?.forEach(row => {
      if (!visibleAt(row, s.t)) return;
      d.glow(row.x + look.x, row.y + look.y, 30, '#c9b8ff');
      d.star(row.x + look.x, row.y + look.y, 12, '#e8d8ff');
    });
    if (s.treasure && visibleAt(s.treasure, s.t)) {
      d.glow(s.treasure.x + look.x, s.treasure.y + look.y, 58, '#f4d590');
      d.item(spriteKey(s.treasure.id), s.treasure.x + look.x, s.treasure.y + look.y, {w: 72, shadow: false, fallback: () => d.heart(s.treasure.x + look.x, s.treasure.y + look.y, 18)});
    }
    const lap = Math.min(1, s.t / ((TAU / chapterTune(s.level).speed) * chapterTune(s.level).laps) || 1);
    d.arc(70, 70, 28, -Math.PI / 2, -Math.PI / 2 + lap * TAU, '#f0d09a', 6);
    d.text(s.practice ? 'Practice' : 'Paid waltz', 450, 64, 22, '#f0d09a');
    const found = s.collected.filter(row => row.kind === 'ordinary').length;
    d.text(found + ' / ' + GOAL + ' finds', 450, 96, 18, '#e8d0a0');
    if (s.treasureCollected) d.text('Keepsake caught', 450, 124, 16, '#f4d590');
  },
  readout: s => s.note || '',
};
