import {done, TAU} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {pace, swell} from '../chapter-kit.js';

const CABINS = ['pocket-wheel', 'star-token', 'moon-penny', 'ride-ticket', 'gyro-ghost', 'pressed-heart'];

function stop(s) {
  if (s.cool > 0 || s.result) return;
  const n = s.cabins.length;
  let best = 0, error = 99;
  for (let i = 0; i < n; i++) {
    const a = s.spin + i * TAU / n;
    const aligned = Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2)));
    if (aligned < error) { error = aligned; best = i; }
  }
  s.cool = 0.4;
  const window = pace(s.level, 0.24, 0.026, 0.11);
  if (s.cabins[best] === s.target && error < window) {
    s.caught++;
    s.note = 'A cabin at the moon.';
    if (s.caught >= s.goal) done(s, 'The wheel holds still', s.caught + ' cabins under the crescent.');
    else s.target = s.cabins[(best + 2 + s.level) % n];
  } else {
    s.note = s.cabins[best] === s.target ? 'Almost — wait for the top.' : 'Wrong cabin. Let it come round.';
  }
  s.tries++;
}

export default {
  title: 'Pocket Wheel',
  intro: 'Jasper’s ferris wheel never quite sits. Stop it when the matching cabin kisses the crescent.',
  instructions: 'Watch the cabins in the oval. When the one shown at the top is at the very peak, tap Stop or press Space. Later chapters turn faster.',
  levels: ['A slow first turn', 'The evening lift', 'Lantern cabins', 'A quicker wheel', 'Six little cars', 'The last crescent'],
  sprites: CABINS,
  prizes: ['pocket-wheel', 'star-token', 'moon-penny', 'ride-ticket', 'ride-stamp-book', 'ride-explorer-pennant'],
  actions: [{id: 'stop', label: 'Stop · Space'}],
  create(level) {
    const list = CABINS.slice(0, swell(level, 4, 1, 6));
    return {
      level, t: 0, spin: 0, cool: 0, caught: 0, tries: 0, goal: swell(level, 3, 1, 8),
      cabins: list, target: list[0], note: 'Wait for the matching cabin at the top.',
    };
  },
  update(s, dt) {
    s.t += dt; s.cool = Math.max(0, s.cool - dt);
    s.spin += swell(s.level, 0.55, 0.22, 1.6) * dt;
  },
  pointer(s, type) { if (type === 'down') stop(s); },
  action(s, id) { if (id === 'stop') stop(s); },
  key(s, k, down) { if (k === ' ' && down) stop(s); },
  draw(s, d) {
    const cx = 450, cy = 730, r = 168, n = s.cabins.length;
    d.item(spriteKey(s.target), cx, 408, {w: 64, shadow: false, fallback: () => d.star(cx, 408, 20)});
    d.text('this cabin', cx, 358, 15, '#5a3a40');
    d.glow(cx, cy - r, 36, '#f4d590');
    for (let i = 0; i < n; i++) {
      const a = s.spin + i * TAU / n;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.82;
      const top = Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2))) < 0.22;
      if (top) d.glow(x, y, 40, '#ffe6a4');
      d.item(spriteKey(s.cabins[i]), x, y, {
        w: top ? 58 : 44, alpha: s.cabins[i] === s.target ? 1 : 0.88,
        fallback: () => d.circle(x, y, 16, '#cdb281', '#f8dfa7', 2),
      });
    }
    d.text(s.caught + ' / ' + s.goal, 450, 1090, 20, '#5a3a40');
  },
  readout: s => s.caught + ' / ' + s.goal + ' cabins · ' + s.note,
};
