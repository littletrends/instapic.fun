import {dist, done} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {swell, bindPrize} from '../chapter-kit.js?v=align-1';

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

function brushAt(s) {
  const t = s.t * (0.35 + s.level * 0.04);
  return {
    x: 450 + Math.sin(t) * 210,
    y: 640 + Math.cos(t * 0.7) * 160,
  };
}

export default {
  title: 'Painted Bay',
  intro: 'Arlo’s alley wall is fading. A wet wash drifts across the paper. Stamp when it sits over a pale patch.',
  instructions: 'Watch the drifting stamp. Tap or press Space when it covers a pale circle. Fill the wall.',
  levels: ['A first wash', 'The evening wall', 'A busier bay', 'Lantern patches', 'A crowded mural', 'The last stamp'],
  sprites: ['ride-stamp-book', 'stamp-and-inkpad', 'lantern-lighter', 'midway-map', 'perfect-circle', 'charm-display-case'],
  prizes: ['ride-stamp-book', 'stamp-and-inkpad', 'lantern-lighter', 'midway-map', 'perfect-circle', 'charm-display-case'],
  actions: [{id: 'stamp', label: 'Stamp · Space'}],
  create(level) {
    const s = {level, t: 0, patches: spots(level), cool: 0, note: 'Wait for the wash over a pale circle.'};
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt) {
    s.t += dt;
    s.cool = Math.max(0, s.cool - dt);
    if (!s.result && s.patches.every(p => p.filled)) done(s, 'The wall remembers', 'Every patch stamped.');
  },
  stamp(s) {
    if (s.result || s.cool > 0) return;
    const b = brushAt(s);
    const hit = s.patches.filter(x => !x.filled).sort((a, c) => dist(b, a) - dist(b, c))[0];
    s.cool = 0.28;
    if (hit && dist(b, hit) < hit.r + 22) {
      hit.filled = true;
      s.note = 'A stamp.';
    } else s.note = 'Wait until the wash covers a pale circle.';
  },
  pointer(s, type) { if (type === 'down') this.stamp(s); },
  action(s, id) { if (id === 'stamp') this.stamp(s); },
  key(s, k, down) { if (k === ' ' && down) this.stamp(s); },
  draw(s, d) {
    d.item(spriteKey('midway-map'), 450, 400, {w: 64, shadow: false, fallback: () => d.star(450, 400, 20)});
    d.text('stamp with the wash', 450, 350, 15, '#5a3a40');
    for (const p of s.patches) {
      d.circle(p.x, p.y, p.r, p.filled ? '#c4a46acc' : '#efe6c844', p.filled ? '#ead6a8' : '#b89a68', 3);
      if (p.filled) d.item(spriteKey('star-token'), p.x, p.y, {w: 28, shadow: false, fallback: () => {}});
    }
    const b = brushAt(s);
    d.glow(b.x, b.y, 48, '#e8c878');
    d.item(spriteKey('stamp-and-inkpad'), b.x, b.y, {w: 44, shadow: false, fallback: () => d.circle(b.x, b.y, 14, '#c4a46a')});
    const have = s.patches.filter(p => p.filled).length;
    d.text(have + ' / ' + s.patches.length, 450, 1090, 20, '#5a3a40');
  },
  readout: s => {
    const have = s.patches.filter(p => p.filled).length;
    return have + ' / ' + s.patches.length + ' stamps · ' + s.note;
  },
};
