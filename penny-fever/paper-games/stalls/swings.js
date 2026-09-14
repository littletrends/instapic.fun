import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'swings';
const TREASURES = ['swing-spinner', 'heart-gear', 'star-token', 'prize-bag', 'music-carousel', 'ride-ticket'];

function rings(level) {
  const n = 4 + Math.min(3, level);
  return Array.from({length: n}, (_, i) => ({
    t: 6 + i * 5.5,
    band: i % 2,
    taken: false,
  }));
}

export default {
  title: 'Skyward Swings',
  intro: 'Hugo’s chairs spin on their own. Hold to swing out, release to drift in, and pass through the star rings.',
  instructions: 'Press and hold the lower half of the screen to swing outward. Release to drift inward. Match the ring’s band. First chapter ride is free practice and keeps nothing.',
  levels: ['First Swing', 'Ribbon Round', 'Star Circles', 'Cloud Shadows', 'Bell Bands', 'Midnight Waltz'],
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 70,
  actions: [{id: 'lean', label: 'Lean out · hold', hold: true}],
  create(level, rng) {
    return makeRideState(level, rng, {
      radius: 0.22, vel: 0, holding: false, passed: 0, angle: 0,
      rings: rings(level), goal: 4, treasureId: TREASURES[level] || TREASURES[0],
    });
  },
  update(s, dt, input) {
    if (s.result || s.broke) return;
    if (ensureBoarded(s, RIDE, s.treasureId, ['inner', 'outer'])) {
      s.note = s.practice ? 'Practice — pass four rings. Nothing is kept.' : 'Hold to swing out. Release to drift in.';
    }
    if (s.result) return;
    const hold = s.holding || input?.actions?.has?.('lean') || input?.down;
    s.t += dt;
    s.angle += dt * (0.9 + s.level * 0.08);
    const accel = hold ? 1.6 : -1.15;
    s.vel += accel * dt;
    s.vel *= 0.92;
    s.radius = clamp(s.radius + s.vel * dt, 0.12, 0.92);
    s.progress = Math.min(1, s.t / 38);
    const band = s.radius > 0.5 ? 1 : 0;
    s.rings.forEach(r => {
      if (r.taken || s.t < r.t || s.t > r.t + 0.7) return;
      if (band === r.band) {
        r.taken = true;
        s.passed += 1;
        recordFind(s, ['everyday-penny', 'star-token', 'moon-penny'][s.passed % 3], RIDE);
        s.note = 'Through the ring — ' + s.passed + ' / ' + s.goal + '.';
        logAction(s, 'ring', {band});
      }
    });
    if (s.eligible && !s.treasure && s.t > 10) {
      s.treasure = {id: s.treasureId, band: s.spawnId === 'inner' ? 0 : 1, t: 20, taken: false};
    }
    if (s.treasure && !s.treasure.taken && s.t > s.treasure.t && s.t < s.treasure.t + 1.1) {
      s.treasureRevealed = true;
      if (band === s.treasure.band) {
        s.treasure.taken = true;
        recordTreasure(s, s.treasure.id);
        s.note = 'The aerial keepsake!';
      }
    }
    if (s.t >= 38) finishRide(s, {rideId: RIDE, treasureId: s.treasureId, challengeOk: s.passed >= s.goal, completionFind: 'star-token'});
  },
  action(s, id, on) {
    if (id === 'lean') s.holding = !!on;
  },
  pointer(s, type, p) {
    if (type === 'down' && p.y > 820) s.holding = true;
    if (type === 'up' || type === 'cancel') s.holding = false;
  },
  draw(s, d) {
    d.circle(450, 420, 40, '#6b2030', '#d2a65b', 3);
    const innerR = 140, outerR = 280;
    d.circle(450, 420, innerR, null, '#b78b4888', 2);
    d.circle(450, 420, outerR, null, '#b78b4888', 2);
    const a = s.angle;
    const r = innerR + s.radius * (outerR - innerR);
    const x = 450 + Math.cos(a) * r, y = 420 + Math.sin(a) * r * 0.72;
    d.line({x: 450, y: 420}, {x, y}, '#d2a65b', 3);
    d.poly([[x - 28, y - 10], [x + 28, y - 10], [x + 24, y + 36], [x - 24, y + 36]], '#f3e2bd', '#b78b48', 2);
    s.rings.forEach(ring => {
      if (ring.taken || s.t < ring.t - 1.4 || s.t > ring.t + 0.7) return;
      const rr = ring.band ? outerR : innerR;
      const ang = a + 0.9;
      d.circle(450 + Math.cos(ang) * rr, 420 + Math.sin(ang) * rr * 0.72, 22, null, '#f4d590', 4);
    });
    if (s.treasure && s.treasureRevealed && !s.treasure.taken) {
      const rr = s.treasure.band ? outerR : innerR;
      d.item(spriteKey(s.treasure.id), 450 + Math.cos(a + 0.5) * rr, 420 + Math.sin(a + 0.5) * rr * 0.72, {w: 54, shadow: false, fallback: () => d.star(450, 200, 14)});
    }
    d.poly([[80, 980], [820, 980], [820, 1160], [80, 1160]], s.holding ? '#6b2030' : '#3a2418', '#f0d09a', 3);
    d.text(s.holding ? 'leaning out' : 'hold to lean out', 450, 1070, 30, '#fff6d8');
    drawHud(d, s, {goal: s.goal, count: s.passed, label: 'rings'});
  },
  readout: s => s.note || '',
};
