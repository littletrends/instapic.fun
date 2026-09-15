import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
} from '../ride-seek.js?v=first-prize-1';

const RIDE = 'balloons';
const TREASURES = ['balloon-bouquet', 'prize-bag', 'swing-spinner', 'aura-keepsake', 'laughing-doorway', 'organ-music-box'];

function arches(level) {
  const n = 6;
  return Array.from({length: n}, (_, i) => ({
    t: 6 + i * 6.2,
    height: 0.25 + (i % 2) * 0.45,
    band: 0.22,
    passed: false,
  }));
}

export default {
  title: 'Balloon Garden',
  intro: 'Nell’s Balloon Tree carries the basket. Hold the bellows to rise, release to drift down, and thread the branch arches.',
  instructions: 'Hold the lower bellows to add lift. Release to descend. A ribbon shows where you will be in a moment. Pass four of six arches. First chapter ride is free practice and keeps nothing.',
  levels: ['First Float', 'Ribbon Breeze', 'Lantern Boughs', 'Crosswind Crown', 'Runaway Bouquet', 'The Midnight Canopy'],
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 80,
  actions: [{id: 'bellows', label: 'Bellows · hold', hold: true}],
  create(level, rng) {
    return makeRideState(level, rng, {
      height: 0.35, vel: 0, holding: false, passed: 0, goal: 4,
      arches: arches(level), treasureId: TREASURES[level] || TREASURES[0], orbit: 0,
    });
  },
  update(s, dt, input) {
    if (s.result || s.broke) return;
    if (ensureBoarded(s, RIDE, s.treasureId, ['low', 'high'])) {
      s.note = s.practice ? 'Practice — thread four arches. Nothing is kept.' : 'Hold to rise. Release to drift.';
    }
    if (s.result) return;
    const hold = s.holding || input?.actions?.has?.('bellows') || (input?.down && input.pointer?.y > 900);
    s.t += dt;
    s.orbit += dt * 0.35;
    const lift = hold ? 1.35 : -0.85;
    s.vel += lift * dt;
    s.vel *= 0.9;
    s.height = clamp(s.height + s.vel * dt, 0.08, 0.92);
    s.progress = Math.min(1, s.t / 45);
    s.arches.forEach(a => {
      if (a.passed || s.t < a.t || s.t > a.t + 0.7) return;
      if (Math.abs(s.height - a.height) <= a.band) {
        a.passed = true;
        s.passed += 1;
        recordFind(s, ['everyday-penny', 'star-token', 'moon-penny'][s.passed % 3], RIDE);
        s.note = 'Through the bough — ' + s.passed + ' / ' + s.goal + '.';
        logAction(s, 'arch', {height: s.height});
      }
    });
    if (s.eligible && !s.treasure && s.t > 12) {
      s.treasure = {id: s.treasureId, height: s.spawnId === 'low' ? 0.28 : 0.72, t: 24, taken: false};
    }
    if (s.treasure && !s.treasure.taken && s.t > s.treasure.t && s.t < s.treasure.t + 1.6) {
      s.treasureRevealed = true;
      if (Math.abs(s.height - s.treasure.height) < 0.18) {
        s.treasure.taken = true;
        recordTreasure(s, s.treasure.id);
        s.note = 'The bouquet is yours.';
      }
    }
    if (s.t >= 45) finishRide(s, {rideId: RIDE, treasureId: s.treasureId, challengeOk: s.passed >= s.goal, completionFind: 'star-token'});
  },
  action(s, id, on) {
    if (id === 'bellows') s.holding = !!on;
  },
  pointer(s, type, p) {
    if (type === 'down' && p.y > 900) s.holding = true;
    if (type === 'up' || type === 'cancel') s.holding = false;
  },
  draw(s, d) {
    const predict = clamp(s.height + s.vel * 1.0, 0.08, 0.92);
    const y = 860 - s.height * 620;
    const py = 860 - predict * 620;
    d.line({x: 120, y: py}, {x: 780, y: py}, '#f4d59088', 3);
    s.arches.forEach(a => {
      if (s.t < a.t - 2.5 || s.t > a.t + 0.7) return;
      const ay = 860 - a.height * 620;
      d.ellipse(620, ay, 70, 50, null, a.passed ? '#8a8' : '#f0d09a', 5);
    });
    d.circle(450, y - 80, 70, '#c45a3a', '#d2a65b', 3);
    d.circle(500, y - 100, 54, '#6b2030', '#d2a65b', 3);
    d.circle(400, y - 96, 50, '#d2a65b', '#f0d09a', 3);
    d.poly([[420, y], [480, y], [500, y + 70], [400, y + 70]], '#f3e2bd', '#b78b48', 2);
    if (s.treasure && s.treasureRevealed && !s.treasure.taken) {
      const ty = 860 - s.treasure.height * 620;
      d.item(spriteKey(s.treasure.id), 300, ty, {w: 64, shadow: false, fallback: () => d.star(300, ty, 16)});
    }
    drawHud(d, s, {goal: s.goal, count: s.passed, label: 'arches'});
  },
  readout: s => s.note || '',
};
