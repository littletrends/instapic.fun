import {dist, done} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {swell} from '../chapter-kit.js';

function spots(level) {
  const n = swell(level, 6, 2, 16);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: 270 + (i % 4) * 120 + (i % 2) * 16,
      y: 520 + Math.floor(i / 4) * 120,
      r: 36 - level,
      filled: false,
    });
  }
  return out;
}

export default {
  title: 'Painted Bay',
  intro: 'Arlo’s alley wall is fading. Stamp the pale patches until the mural comes back.',
  instructions: 'Tap each pale circle to stamp it. Fill the wall. Later chapters ask for more stamps.',
  levels: ['A first wash', 'The evening wall', 'A busier bay', 'Lantern patches', 'A crowded mural', 'The last stamp'],
  sprites: ['midway-map', 'stamp-and-inkpad', 'lantern-lighter', 'star-token'],
  prizes: ['midway-map', 'stamp-and-inkpad', 'lantern-lighter', 'ride-stamp-book', 'first-visit-badge', 'ride-explorer-pennant'],
  actions: [],
  create(level) {
    return {level, t: 0, patches: spots(level), note: 'Stamp the pale patches.'};
  },
  update(s, dt) {
    s.t += dt;
    if (!s.result && s.patches.every(p => p.filled)) done(s, 'The wall remembers', 'Every patch stamped.');
  },
  pointer(s, type, p) {
    if (type !== 'down' || s.result) return;
    const hit = s.patches.filter(x => !x.filled).sort((a, b) => dist(p, a) - dist(p, b))[0];
    if (hit && dist(p, hit) < hit.r + 18) {
      hit.filled = true;
      s.note = 'A stamp.';
    } else s.note = 'A little closer to a pale circle.';
  },
  draw(s, d) {
    d.item(spriteKey('midway-map'), 450, 400, {w: 64, shadow: false, fallback: () => d.star(450, 400, 20)});
    d.text('stamp the wall', 450, 350, 15, '#5a3a40');
    for (const p of s.patches) {
      d.circle(p.x, p.y, p.r, p.filled ? '#c4a46acc' : '#efe6c844', p.filled ? '#ead6a8' : '#b89a68', 3);
      if (p.filled) d.item(spriteKey('star-token'), p.x, p.y, {w: 28, shadow: false, fallback: () => {}});
    }
    const have = s.patches.filter(p => p.filled).length;
    d.text(have + ' / ' + s.patches.length, 450, 1090, 20, '#5a3a40');
  },
  readout: s => {
    const have = s.patches.filter(p => p.filled).length;
    return have + ' / ' + s.patches.length + ' stamps · ' + s.note;
  },
};
