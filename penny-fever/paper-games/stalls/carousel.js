import {TAU, clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js?v=ritual-3';
import {
  boardRide, sealAttempt, recordFind, recordTreasure, settleArrival, logAction, prefersReducedMotion, drawHud,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'carousel';
const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
const TREASURES = ['music-carousel', 'organ-music-box', 'pocket-wheel', 'laughing-doorway', 'ride-explorer-pennant', 'ride-ticket'];
const DRAG_PX = 14;
const LOOK_X = 900 * 0.15;
const LOOK_Y = 1200 * 0.10;
const RECENTER_MS = 0.25;
const GOAL = 3;
const RIDE_ART = new URL('../../assets/restyle/scene-turnarounds-2026-09-09/amusements/horse-carousel/front.webp', import.meta.url).href;
const rideArt = {img: null, ok: false};
function loadRideArt() {
  if (rideArt.img || typeof Image === 'undefined') return;
  const img = new Image();
  img.onload = () => { rideArt.ok = true; };
  img.src = RIDE_ART;
  rideArt.img = img;
}
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
    loadRideArt();
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
    const look = {x: s.lookX, y: s.lookY};
    const bob = Math.sin(s.t * 2.2) * (s.reduced ? 2 : 7);
    d.ellipse(450, 600, 520, 620, '#1a1218');
    d.ellipse(450, 1180, 560, 220, '#120c0a');
    if (rideArt.ok && rideArt.img) {
      const img = rideArt.img;
      const w = 980, h = w * (img.naturalHeight || 1) / (img.naturalWidth || 1);
      d.c.save();
      d.c.drawImage(img, 450 - w / 2 + look.x * 0.7, 430 - h / 2 + look.y * 0.55 + bob, w, h);
      d.c.restore();
    } else {
      const cx = 450 + look.x, cy = 560 + look.y;
      d.ellipse(cx, cy + 220, 340, 90, '#3a2418');
      d.poly([[cx - 240, cy - 260], [cx + 240, cy - 260], [cx + 280, cy - 20], [cx - 280, cy - 20]], '#6b2030', '#d2a65b', 3);
      d.ellipse(cx, cy - 300, 250, 52, '#4a1824', '#f0d09a', 3);
    }
    const youX = 450, youY = 980 + bob;
    d.ellipse(youX + 8, youY + 58, 90, 22, '#12233588');
    d.poly([[youX - 110, youY + 20], [youX + 120, youY - 10], [youX + 130, youY + 48], [youX - 100, youY + 70]], '#f7efe0', '#b78b48', 3);
    d.poly([[youX + 70, youY - 36], [youX + 150, youY - 18], [youX + 138, youY + 22], [youX + 78, youY + 18]], '#f7efe0', '#b78b48', 3);
    d.circle(youX + 132, youY - 8, 28, '#f7efe0', '#b78b48', 2);
    d.poly([[youX - 30, youY - 18], [youX + 46, youY - 24], [youX + 50, youY + 18], [youX - 34, youY + 24]], '#6b2030', '#d2a65b', 2);
    d.text('you', youX, youY + 8, 22, '#f0d09a');
    s.finds?.forEach(row => {
      if (!visibleAt(row, s.t)) return;
      d.glow(row.x + look.x, row.y + look.y, 64, '#ffe6a4');
      d.item(spriteKey(row.id), row.x + look.x, row.y + look.y, {w: 78, shadow: false, fallback: () => d.star(row.x + look.x, row.y + look.y, 20)});
    });
    s.decoys?.forEach(row => {
      if (!visibleAt(row, s.t)) return;
      d.glow(row.x + look.x, row.y + look.y, 36, '#c9b8ff');
      d.star(row.x + look.x, row.y + look.y, 16, '#e8d8ff');
    });
    if (s.treasure && visibleAt(s.treasure, s.t)) {
      d.glow(s.treasure.x + look.x, s.treasure.y + look.y, 78, '#f4d590');
      d.item(spriteKey(s.treasure.id), s.treasure.x + look.x, s.treasure.y + look.y, {w: 92, shadow: false, fallback: () => d.heart(s.treasure.x + look.x, s.treasure.y + look.y, 22)});
    }
    if (s.t < 4 && !s.drag) d.text('Drag to look · tap a glint', 450, 210, 28, '#fff6d8');
    s.progress = Math.min(1, s.t / ((TAU / chapterTune(s.level).speed) * chapterTune(s.level).laps) || 1);
    const found = s.collected.filter(row => row.kind === 'ordinary').length;
    drawHud(d, s, {goal: GOAL, count: found, label: 'finds'});
  },
  readout: s => s.note || '',
};
