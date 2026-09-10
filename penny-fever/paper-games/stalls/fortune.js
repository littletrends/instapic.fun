import {dist,clamp,segmentDistance,done} from '../draw.js';
import {spriteKey} from '../prizes.js';

const patterns = [
  [[280,980],[240,760],[360,540],[580,510],[650,740],[520,930],[280,980]],
  [[260,980],[240,650],[400,440],[620,560],[660,860],[440,980],[360,730],[260,980]],
  [[230,950],[230,630],[340,430],[570,460],[680,680],[630,960],[460,880],[460,620],[230,950]],
];
const fortunes = [
  'A quiet hand can move a whole constellation.',
  'A detour is still a way forward.',
  'The most interesting path is the one you make.',
];

function snag(s) {
  s.snags++;
  s.flash = 1;
  s.drag = false;
  s.needle = {...s.nodes[s.next - 1]};
  s.target = {...s.needle};
  s.thread = s.thread.slice(0, s.saved);
  s.note = 'A lantern caught the thread. Lift the slip and continue from the glowing eyelet.';
}
function advance(s, dt) {
  const p = s.needle, q = s.target, dd = dist(p, q), step = Math.min(dd, 250 * dt);
  if (dd < 1) return;
  const old = {...p};
  p.x += (q.x - p.x) / dd * step;
  p.y += (q.y - p.y) / dd * step;
  s.thread.push({...p});
  if (s.thread.length > 2400) s.thread.splice(1, 1);
  if (s.moons.some(m => segmentDistance(m, old, p) < m.r + 6)) { snag(s); return; }
  const n = s.nodes[s.next];
  if (n && segmentDistance(n, old, p) < 28) {
    s.next++;
    s.saved = s.thread.length;
    s.note = s.next === s.nodes.length ? 'The last eyelet is yours.' : 'The next eyelet is glowing.';
    if (s.next === s.nodes.length) {
      done(s, 'Your fortune is woven', fortunes[s.level] + ' ' + s.snags + ' little tangles, all patiently untied.');
    }
  }
}

export default {
  title: 'Fate’s Loom',
  intro: 'Iris has mislaid a constellation in her moon garden. Guide a fortune slip through the brass eyelets while paper lanterns drift by.',
  instructions: 'Hold the glowing slip, then guide it through the numbered eyelets in order. It follows at a gentle speed: you cannot teleport past a lantern. Let go whenever you need a rest. Arrow keys also move. A snag returns only to your last eyelet.',
  levels: ['A small constellation', 'The wandering star', 'The secret constellation'],
  sprites: ['moon-lantern', 'fortune-slip'],
  prizes: ['fortune-slip', 'moon-penny', 'moon-brooch'],
  actions: [{id: 'left', label: '←', hold: true}, {id: 'up', label: '↑', hold: true}, {id: 'down', label: '↓', hold: true}, {id: 'right', label: '→', hold: true}],
  create(level) {
    const nodes = patterns[level].map(([x, y]) => ({x, y}));
    return {
      level, nodes,
      needle: {...nodes[0]}, target: {...nodes[0]}, next: 1,
      thread: [{...nodes[0]}], saved: 1, snags: 0, drag: false, t: 0, flash: 0,
      note: 'Pick up the fortune slip.',
      moons: Array.from({length: level + 1}, (_, i) => ({x: 450, y: 650, r: 28 + i * 4, phase: i * 2.1})),
    };
  },
  update(s, dt, input) {
    s.t += dt;
    s.flash = Math.max(0, s.flash - dt);
    s.moons.forEach((m, i) => {
      m.x = 450 + Math.sin(s.t * (.36 + i * .08) + m.phase) * (110 + i * 50);
      m.y = 660 + Math.cos(s.t * .31 + m.phase) * (100 + i * 28);
    });
    const dx = (input.keys.has('ArrowRight') || input.actions.has('right') ? 1 : 0)
      - (input.keys.has('ArrowLeft') || input.actions.has('left') ? 1 : 0);
    const dy = (input.keys.has('ArrowDown') || input.actions.has('down') ? 1 : 0)
      - (input.keys.has('ArrowUp') || input.actions.has('up') ? 1 : 0);
    if (dx || dy) {
      s.target = {x: clamp(s.needle.x + dx * 240 * dt, 175, 725), y: clamp(s.needle.y + dy * 240 * dt, 350, 1040)};
      advance(s, dt);
    } else if (s.drag) advance(s, dt);
  },
  pointer(s, type, p) {
    if (type === 'down' && dist(p, s.needle) < 80) s.drag = true;
    if (type === 'move' && s.drag) s.target = {x: clamp(p.x, 175, 725), y: clamp(p.y, 350, 1040)};
    if (type === 'up' || type === 'cancel') s.drag = false;
  },
  draw(s, d) {
    d.path(s.thread, '#503540', 8);
    d.path(s.thread, '#efc768', 3);
    s.nodes.forEach((n, i) => {
      if (i === s.next) d.glow(n.x, n.y, 48);
      d.ring(n.x, n.y, i === s.next ? 23 : 17, i < s.next ? '#f8d075' : '#ad9874', 5);
      if (i > 0) d.text(i, n.x, n.y + 6, 17);
    });
    for (const m of s.moons) {
      d.glow(m.x, m.y, m.r * 2.1, '#b8b5f2');
      d.item(spriteKey('moon-lantern'), m.x, m.y, {
        w: m.r * 2.4,
        fallback: () => {
          d.circle(m.x, m.y, m.r, '#c6bdd5', '#e2c681', 2);
          d.circle(m.x + 11, m.y - 8, m.r * .8, '#665376');
          d.star(m.x - 6, m.y + 5, 4, '#f5dc98');
        },
      });
    }
    const n = s.needle;
    const last = s.thread[s.thread.length - 2] || n;
    const angle = Math.atan2(n.y - last.y, n.x - last.x) + Math.PI / 2;
    d.item(spriteKey('fortune-slip'), n.x, n.y, {
      w: 42, angle, fallback: () => {
        d.ball(n.x, n.y, 9, s.flash ? '#d87181' : '#f2d88d');
        d.line({x: n.x - 9, y: n.y + 15}, {x: n.x + 12, y: n.y - 18}, '#fff0bf', 4);
      },
    });
  },
  readout: s => 'Eyelet ' + Math.min(s.next, s.nodes.length - 1) + ' / ' + (s.nodes.length - 1) + ' · ' + s.note,
};
