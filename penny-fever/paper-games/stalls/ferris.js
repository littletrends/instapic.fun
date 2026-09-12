import {done, TAU} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {pace, swell, bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const CABINS = ['pocket-wheel', 'star-token', 'moon-penny', 'ride-ticket', 'gyro-ghost', 'pressed-heart'];

function cabinsAt(s) {
  const cx = 450, cy = 730, r = 168, n = s.cabins.length;
  return s.cabins.map((id, i) => {
    const a = s.spin + i * TAU / n;
    return {
      id, i, a,
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r * 0.82,
      top: Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2))),
    };
  });
}

function pickCabin(s, p) {
  if (s.cool > 0 || s.result) return;
  const window = pace(s.level, 0.28, 0.024, 0.13);
  const spots = cabinsAt(s);
  let hit = spots[0], best = 99;
  for (const c of spots) {
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    if (d < best) { best = d; hit = c; }
  }
  if (best > 58) { s.note = 'Tap the cabin itself, at the moon.'; return; }
  s.cool = 0.4;
  s.tries++;
  if (hit.id === s.target && hit.top < window) {
    s.caught++;
    s.note = 'A cabin at the moon.';
    if (s.caught >= s.goal) done(s, 'The wheel holds still', s.caught + ' cabins under the crescent.');
    else s.target = s.cabins[(hit.i + 2 + s.level) % s.cabins.length];
  } else {
    s.note = hit.id === s.target ? 'Almost — wait until it kisses the crescent.' : 'That cabin isn’t the one. Let it come round.';
  }
}

export default {
  title: 'Pocket Wheel',
  intro: 'Jasper’s ferris wheel never quite sits. Point at the matching cabin when it kisses the crescent — don’t stop the whole wheel.',
  instructions: 'Tap the cabin itself when it is at the very peak. Later chapters turn faster. Misses are free.',
  levels: ['A slow first turn', 'The evening lift', 'Lantern cabins', 'A quicker wheel', 'Six little cars', 'The last crescent'],
  sprites: CABINS,
  prizes: ['pocket-wheel', 'moon-penny', 'moon-brooch', 'moon-lantern', 'ride-stamp-book', 'summer-sun-pin'],
  actions: [{id: 'stop', label: 'Tap the cabin'}],
  create(level) {
    const list = CABINS.slice(0, swell(level, 4, 1, 6));
    const s = {
      level, t: 0, spin: 0, cool: 0, caught: 0, tries: 0, goal: swell(level, 3, 1, 8),
      cabins: list, target: list[0], note: 'Wait for the matching cabin at the top.',
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt) {
    s.t += dt; s.cool = Math.max(0, s.cool - dt);
    s.spin += swell(s.level, 0.55, 0.22, 1.6) * dt;
  },
  pointer(s, type, p) { if (type === 'down') pickCabin(s, p); },
  action() {},
  key() {},
  draw(s, d) {
    const cx = 450, cy = 730, r = 168;
    d.item(spriteKey(s.target), cx, 408, {w: 64, shadow: false, fallback: () => d.star(cx, 408, 20)});
    d.text('this cabin', cx, 358, 15, '#5a3a40');
    d.glow(cx, cy - r, 36, '#f4d590');
    for (const c of cabinsAt(s)) {
      if (c.top < 0.22) d.glow(c.x, c.y, 40, '#ffe6a4');
      d.item(spriteKey(c.id), c.x, c.y, {
        w: c.top < 0.22 ? 58 : 44, alpha: c.id === s.target ? 1 : 0.88,
        fallback: () => d.circle(c.x, c.y, 16, '#cdb281', '#f8dfa7', 2),
      });
    }
    d.text(s.caught + ' / ' + s.goal, 450, 1090, 20, '#5a3a40');
  },
  readout: s => s.caught + ' / ' + s.goal + ' cabins · ' + s.note,
};
