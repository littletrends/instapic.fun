import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'helter';
const TREASURES = ['spiral-tower', 'star-token', 'moon-penny', 'prize-bag', 'ride-ticket', 'lucky-match'];
const LANES = [280, 620];

function junctions(level) {
  const n = 3 + Math.min(2, level);
  return Array.from({length: n}, (_, i) => ({
    t: 7 + i * 8,
    lane: i % 2,
    warn: 2.2,
  }));
}

export default {
  title: 'Spiral Slide',
  intro: 'Tilly’s slide carries you down. Swipe to change lanes, read the signs, and catch what tumbles ahead.',
  instructions: 'Swipe left or right. A painted arrow warns before each fork. Stay on the marked lane to collect. First chapter ride is free practice and keeps nothing.',
  levels: ['First Spiral', 'Bunting Bend', 'Tunnel Trick', 'Three-Way Map', 'Night Slide', 'The Grand Helter'],
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 70,
  create(level, rng) {
    return makeRideState(level, rng, {
      lane: 0, dest: 0, dist: 0, hits: 0, treasureId: TREASURES[level] || TREASURES[0],
      forks: junctions(level), goal: 3, swipe: null,
    });
  },
  update(s, dt) {
    if (s.result || s.broke) return;
    if (ensureBoarded(s, RIDE, s.treasureId, ['lane-0', 'lane-1'])) {
      s.note = s.practice ? 'Practice — swipe lanes and catch three glints. Nothing is kept.' : 'Swipe to the marked lane.';
      if (s.eligible) s.spawnId = s.spawnId || 'lane-1';
    }
    if (s.result) return;
    s.t += dt;
    s.dist += dt * (90 + s.level * 12);
    s.progress = Math.min(1, s.t / 36);
    s.lane += (s.dest - s.lane) * Math.min(1, dt * 10);
    s.forks.forEach((f, i) => {
      if (!f.done && s.t >= f.t) {
        f.done = true;
        if (Math.round(s.dest) === f.lane) {
          s.hits += 1;
          recordFind(s, ['everyday-penny', 'star-token', 'moon-penny'][i % 3], RIDE);
          s.note = 'Caught on the spiral — ' + s.hits + ' / ' + s.goal + '.';
        } else s.note = 'Wrong lane. Watch the next arrow.';
      }
    });
    if (s.eligible && !s.treasure && s.t > 12) {
      s.treasure = {id: s.treasureId, lane: s.spawnId === 'lane-0' ? 0 : 1, t: 18, taken: false};
    }
    if (s.treasure && !s.treasure.taken && s.t > s.treasure.t && s.t < s.treasure.t + 2.6) {
      s.treasureRevealed = true;
      if (Math.round(s.dest) === s.treasure.lane) {
        s.treasure.taken = true;
        recordTreasure(s, s.treasure.id);
        s.note = 'You intercepted the tumbling keepsake!';
      }
    }
    if (s.t >= 36) finishRide(s, {rideId: RIDE, treasureId: s.treasureId, challengeOk: s.hits >= s.goal, completionFind: 'star-token'});
  },
  pointer(s, type, p) {
    if (type === 'down') s.swipe = p;
    if (type === 'up' && s.swipe) {
      const dx = p.x - s.swipe.x;
      s.swipe = null;
      if (Math.abs(dx) < 24) return;
      s.dest = clamp(s.dest + (dx > 0 ? 1 : -1), 0, 1);
      logAction(s, 'lane', {lane: s.dest});
    }
    if (type === 'cancel') s.swipe = null;
  },
  key(s, k, down) {
    if (!down) return;
    if (k === 'ArrowLeft') s.dest = 0;
    if (k === 'ArrowRight') s.dest = 1;
  },
  draw(s, d) {
    d.ellipse(450, 600, 380, 500, '#4a1824');
    d.poly([[120, 80], [780, 80], [700, 1180], [200, 1180]], '#6b2030', '#d2a65b', 3);
    const warn = s.forks.find(f => !f.done && s.t > f.t - f.warn);
    if (warn) {
      d.text(warn.lane === 0 ? '← this lane' : 'this lane →', LANES[warn.lane], 220, 28, '#f4d590');
      d.glow(LANES[warn.lane], 300, 70, '#ffe6a4');
    }
    LANES.forEach((x, i) => {
      d.ellipse(x, 700, 70, 320, i === Math.round(s.dest) ? '#5a3a22' : '#2a1814', '#b78b48', 2);
    });
    const px = LANES[0] + (LANES[1] - LANES[0]) * s.lane;
    d.poly([[px - 40, 860], [px + 40, 860], [px + 36, 980], [px - 36, 980]], '#f3e2bd', '#b78b48', 2);
    d.text('you', px, 920, 16, '#4a1824');
    if (s.treasure && s.treasureRevealed && !s.treasure.taken) {
      const tx = LANES[s.treasure.lane];
      d.glow(tx, 480, 50, '#f4d590');
      d.item(spriteKey(s.treasure.id), tx, 480, {w: 64, shadow: false, fallback: () => d.star(tx, 480, 16)});
    }
    drawHud(d, s, {goal: s.goal, count: s.hits, label: 'catches'});
  },
  readout: s => s.note || '',
};
