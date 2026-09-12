import {clamp, dist, done} from '../draw.js?v=ink-1';
import {spriteKey} from '../prizes.js';
import {pace, swell, bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

function point(t) {
  const a = t * 7.2;
  const r = 200 - t * 140;
  return {x: 450 + Math.sin(a) * r, y: 400 + t * 600};
}
function ringsFor(level) {
  const n = swell(level, 3, 1, 6);
  return Array.from({length: n}, (_, i) => (i + 1) / (n + 1));
}

export default {
  title: 'Spiral Slide',
  intro: 'Tilly’s helter-skelter is a paper spiral. Catch the gold rings on the way down. Miss one and keep going — she’ll send you down again for the ones you skipped.',
  instructions: 'A bead slides the spiral. Tap or press Space when it passes through a gold ring. Caught rings stay caught if you ride again.',
  levels: ['A gentle slide', 'Two more turns', 'A tighter coil', 'The evening drop', 'A busy spiral', 'The last hoop'],
  sprites: ['ride-explorer-pennant', 'star-token', 'moon-penny', 'prize-bag'],
  prizes: ['lucky-match', 'star-token', 'splash-ring', 'brave-try-ribbon', 'prize-bag', 'first-visit-badge'],
  actions: [{id: 'catch', label: 'Catch ring · Space'}],
  create(level) {
    const s = {
      level, t: 0, u: 0, caught: 0, runs: 0,
      rings: ringsFor(level).map(u => ({u, got: false})),
      note: 'Tap as the bead passes a ring.',
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt) {
    if (s.result) return;
    s.t += dt;
    s.u = clamp(s.u + pace(s.level, 0.22, 0.02, 0.12) * dt, 0, 1);
    if (s.u >= 1) {
      if (s.rings.every(r => r.got)) done(s, 'Right to the sawdust', 'Every ring on the slide.');
      else {
        s.u = 0; s.runs++;
        s.note = 'Again for the rings you skipped.';
      }
    }
  },
  pointer(s, type) { if (type === 'down') this.action(s, 'catch'); },
  action(s, id) {
    if (id !== 'catch' || s.result) return;
    const p = point(s.u);
    const hit = s.rings.find(r => !r.got && dist(p, point(r.u)) < 42);
    if (hit) {
      hit.got = true; s.caught++;
      s.note = 'A ring!';
    } else s.note = 'Not yet — wait for the gold.';
  },
  key(s, k, down) { if (k === ' ' && down) this.action(s, 'catch'); },
  draw(s, d) {
    for (let i = 0; i <= 40; i++) {
      const a = point(i / 40), b = point((i + 1) / 40);
      d.line(a, b, '#8a6238cc', 7);
    }
    for (const r of s.rings) {
      const p = point(r.u);
      d.circle(p.x, p.y, 22, r.got ? '#e8c87866' : null, r.got ? '#d8ecc8' : '#e8c878', 4);
    }
    const p = point(s.u);
    d.item(spriteKey('star-token'), p.x, p.y, {w: 44, fallback: () => d.circle(p.x, p.y, 14, '#e8c878')});
    d.text(s.caught + ' / ' + s.rings.length, 450, 1090, 20, '#5a3a40');
  },
  readout: s => s.caught + ' / ' + s.rings.length + ' rings · ' + s.note,
};
