import {clamp, dist, done, TAU} from '../draw.js';
import {spriteKey} from '../prizes.js';

const center = {x: 450, y: 670};
const patches = ['moon-penny', 'rose-penny', 'star-token'];
const colors = ['#b7747c', '#85978c', '#b8a079'];

function radius(level, a) {
  if (level === 0) return 134;
  if (level === 1) return 1 / Math.sqrt(Math.cos(a) ** 2 / 156 ** 2 + Math.sin(a) ** 2 / 118 ** 2);
  return 126 + 13 * Math.cos(5 * a);
}
function evaluate(s) {
  s.uncovered = s.samples.filter(p => !s.discs.some(c => dist(c, p) <= c.r));
  s.coverage = 1 - s.uncovered.length / s.samples.length;
}

export default {
  title: 'Patchwork Moon',
  intro: 'Dot has three catalogue pennies and an awkward piece of moonlight showing through the quilt. Cover every little glimmer.',
  instructions: 'Drag the three pennies over the golden shape. They may overlap. Light dots show uncovered gaps. Choose a disc with Next patch, then nudge with arrows if you prefer. There is no timer. Check the quilt when you think every edge is covered.',
  levels: ['The round moon', 'A stretched moon', 'A five-petalled moon'],
  sprites: ['moon-penny', 'rose-penny', 'star-token'],
  prizes: ['perfect-circle', 'pressed-flower-book', 'lucky-dish'],
  actions: [{id: 'next', label: 'Next patch'}, {id: 'check', label: 'Check the quilt'}, {id: 'hint', label: 'Show a placement hint'}],
  create(level) {
    const samples = [];
    for (let y = 510; y <= 830; y += 7) for (let x = 290; x <= 610; x += 7) {
      const a = Math.atan2(y - 670, x - 450);
      if (Math.hypot(x - 450, y - 670) <= radius(level, a)) samples.push({x, y});
    }
    for (let i = 0; i < 360; i++) {
      const a = i * TAU / 360, r = radius(level, a);
      samples.push({x: 450 + Math.cos(a) * r, y: 670 + Math.sin(a) * r});
    }
    const s = {
      level,
      discs: [
        {x: 250, y: 1000, r: level === 2 ? 125 : 118, id: patches[0]},
        {x: 450, y: 1000, r: level === 2 ? 125 : 118, id: patches[1]},
        {x: 650, y: 1000, r: level === 2 ? 125 : 118, id: patches[2]},
      ],
      samples, selected: 0, drag: false, offset: {x: 0, y: 0}, coverage: 0, uncovered: [], hint: 0, moves: 0,
      note: 'Overlap the pennies. Hide the moonlight.',
    };
    evaluate(s);
    return s;
  },
  update(s, dt, input) {
    s.hint = Math.max(0, s.hint - dt);
    const c = s.discs[s.selected];
    const dx = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    const dy = (input.keys.has('ArrowDown') ? 1 : 0) - (input.keys.has('ArrowUp') ? 1 : 0);
    if (dx || dy) {
      c.x = clamp(c.x + dx * 120 * dt, 220, 680);
      c.y = clamp(c.y + dy * 120 * dt, 410, 1040);
      evaluate(s);
    }
  },
  pointer(s, type, p) {
    if (type === 'down') {
      for (let i = 2; i >= 0; i--) if (dist(p, s.discs[i]) <= s.discs[i].r) {
        s.selected = i; s.drag = true; s.offset = {x: s.discs[i].x - p.x, y: s.discs[i].y - p.y}; break;
      }
    }
    if (type === 'move' && s.drag) {
      const c = s.discs[s.selected];
      c.x = clamp(p.x + s.offset.x, 220, 680);
      c.y = clamp(p.y + s.offset.y, 410, 1040);
      evaluate(s);
    }
    if (type === 'up' && s.drag) { s.drag = false; s.moves++; evaluate(s); }
    if (type === 'cancel') s.drag = false;
  },
  action(s, id) {
    if (id === 'next') s.selected = (s.selected + 1) % 3;
    if (id === 'hint') s.hint = 5;
    if (id === 'check') {
      evaluate(s);
      if (s.coverage > .999) done(s, 'Not a glimmer escaped', 'Every sampled edge and inner point is covered. Three little pennies, one very neat moon.');
      else s.note = 'Still ' + (100 * (1 - s.coverage)).toFixed(1) + '% moonlight peeping through.';
    }
  },
  key(s, k, down) { if (k === ' ' && down) this.action(s, 'check'); },
  draw(s, d) {
    const edge = Array.from({length: 180}, (_, i) => {
      const a = i * TAU / 180, r = radius(s.level, a);
      return {x: 450 + Math.cos(a) * r, y: 670 + Math.sin(a) * r};
    });
    d.path(edge, '#c69d58', 5, true, '#f2d696');
    for (const [i, c] of s.discs.entries()) {
      d.circle(c.x + 7, c.y + 10, c.r, '#77595830');
      d.circle(c.x, c.y, c.r, colors[i] + '55', '#f4ddba', 3);
      d.item(spriteKey(c.id), c.x, c.y, {
        w: c.r * 1.55, shadow: false,
        fallback: () => {
          d.circle(c.x, c.y, c.r, colors[i], '#f4ddba', 3);
          d.circle(c.x, c.y, c.r - 12, null, '#ecd2ad', 1);
          d.text(i + 1, c.x, c.y + 8, 25, '#faeccc');
        },
      });
      if (i === s.selected) d.ring(c.x, c.y, c.r + 5, '#956643', 2);
    }
    for (let i = 0; i < s.uncovered.length; i += 3) d.circle(s.uncovered[i].x, s.uncovered[i].y, 2, '#fff7d5');
    if (s.hint) {
      const a = s.selected * TAU / 3 - Math.PI / 2;
      const sol = s.level === 1
        ? [{x: 365, y: 670}, {x: 535, y: 670}, {x: 450, y: 670}][s.selected]
        : {x: 450 + Math.cos(a) * 67, y: 670 + Math.sin(a) * 67};
      d.ring(sol.x, sol.y, 17, '#724e58', 3);
      d.text('centre here', sol.x, sol.y - 28, 16, '#734a57');
    }
  },
  readout: s => Math.floor(s.coverage * 1000) / 10 + '% covered · Patch ' + (s.selected + 1) + ' selected · ' + s.note,
};
