import {clamp,dist,lerp,done,TAU} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {pick, swell} from '../chapter-kit.js';

const houses = [
  {x: 450, y: 1040, name: 'the lantern landing'},
  {x: 220, y: 340, name: 'the willow house'},
  {x: 450, y: 270, name: 'the heart arch'},
  {x: 680, y: 480, name: 'the reed nook'},
  {x: 250, y: 920, name: 'the lily porch'},
  {x: 640, y: 300, name: 'the moon jetty'},
];
function behind(path, distance) {
  for (let i = path.length - 1; i > 0; i--) {
    const a = path[i], b = path[i - 1], dd = dist(a, b);
    if (distance <= dd) { const t = distance / (dd || 1); return {x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)}; }
    distance -= dd;
  }
  return path[0];
}
function move(s, p, q, speed, dt) {
  const dd = dist(p, q);
  if (dd < 1) return;
  const step = Math.min(dd, speed * dt), nx = p.x + (q.x - p.x) / dd * step, ny = p.y + (q.y - p.y) / dd * step;
  if (!s.lilies.some(l => Math.hypot(nx - l.x, p.y - l.y) < l.r + 16)) p.x = clamp(nx, 190, 710);
  if (!s.lilies.some(l => Math.hypot(p.x - l.x, ny - l.y) < l.r + 16)) p.y = clamp(ny, 250, 1080);
}

export default {
  title: 'Duckling Parade',
  intro: 'Dottie’s ducklings went exploring. Find them, make a little rippling parade and bring everyone back to the house that is waiting with a lantern.',
  instructions: 'Tap the water to lead the mother duck, or use arrows and the four buttons. Swim close to each duckling to collect it. They follow your travelled path around the pads. After gathering everyone, return to the glowing house for this chapter and wait for the last little tail. From the grand parade onward, the last recruit is a crowned duck.',
  levels: ['Four little wanderers', 'The willow house', 'The grand duck parade', 'The reed nook parade', 'Seven ducklings out', 'Home to the moon jetty'],
  actions: [{id: 'left', label: '←', hold: true}, {id: 'up', label: '↑', hold: true}, {id: 'down', label: '↓', hold: true}, {id: 'right', label: '→', hold: true}, {id: 'stop', label: 'Wait here'}],
  create(level) {
    const home = pick(houses, level);
    const spots = [[300, 880], [620, 780], [280, 560], [640, 500], [470, 430], [600, 940], [360, 780]];
    const lilies = [{x: 450, y: 720, r: 42}, {x: 400, y: 520, r: 32}];
    if (level > 0) lilies.push({x: 590, y: 640, r: 28});
    if (level > 1) lilies.push({x: 290, y: 700, r: 24});
    if (level > 2) lilies.push({x: 520, y: 860, r: 26});
    if (level > 3) lilies.push({x: 330, y: 430, r: 22});
    const nDucks = swell(level, 4, 1, 7);
    const start = {x: 450, y: 820};
    return {level, t: 0, home, p: {...start}, target: {...start}, path: [{...start}], ducks: spots.slice(0, nDucks).map(([x, y], i) => ({x, y, joined: false, order: 0, face: 1, crown: level >= 2 && i === nDucks - 1})), lilies, joined: 0, docking: false, face: 1};
  },
  update(s, dt, input) {
    s.t += dt;
    const dx = (input.keys.has('ArrowRight') || input.actions.has('right') ? 1 : 0) - (input.keys.has('ArrowLeft') || input.actions.has('left') ? 1 : 0);
    const dy = (input.keys.has('ArrowDown') || input.actions.has('down') ? 1 : 0) - (input.keys.has('ArrowUp') || input.actions.has('up') ? 1 : 0);
    if (dx || dy) s.target = {x: s.p.x + dx * 70, y: s.p.y + dy * 70};
    const oldX = s.p.x;
    move(s, s.p, s.target, 145, dt);
    if (Math.abs(s.p.x - oldX) > .1) s.face = s.p.x > oldX ? 1 : -1;
    if (dist(s.path[s.path.length - 1], s.p) > 4) { s.path.push({...s.p}); if (s.path.length > 1400) s.path.shift(); }
    for (const a of s.ducks) if (!a.joined && dist(a, s.p) < 54) { a.joined = true; a.order = ++s.joined; }
    s.docking = s.joined === s.ducks.length && dist(s.p, s.home) < 88;
    for (const a of s.ducks) if (a.joined) {
      const target = s.docking ? {x: s.home.x + Math.cos(a.order * TAU / s.ducks.length) * 42, y: s.home.y + Math.sin(a.order * TAU / s.ducks.length) * 26} : behind(s.path, a.order * 34);
      const ox = a.x; move(s, a, target, 190, dt); if (Math.abs(a.x - ox) > .1) a.face = a.x > ox ? 1 : -1;
    }
    if (s.docking && s.ducks.every(a => dist(a, s.home) < 90)) {
      done(s, 'Every duckling home', 'One mother duck, ' + s.ducks.length + ' little explorers, and a very happy Dottie at ' + s.home.name + '.');
    }
  },
  pointer(s, type, p) {
    if (type === 'down' || type === 'move' && s.drag) s.target = {x: clamp(p.x, 190, 710), y: clamp(p.y, 250, 1080)};
    if (type === 'down') s.drag = true;
    if (type === 'up' || type === 'cancel') s.drag = false;
  },
  action(s, id) { if (id === 'stop') s.target = {...s.p}; },
  draw(s, d) {
    for (const l of s.lilies) {
      d.ellipse(l.x + 3, l.y + 5, l.r, l.r * .7, '#1b4a4440');
      d.ellipse(l.x, l.y, l.r, l.r * .72, '#6f9c7466', '#b7c58d88', 1.5);
    }
    if (s.joined === s.ducks.length) {
      d.glow(s.home.x, s.home.y, 88, '#ffe6a4');
      d.ellipse(s.home.x, s.home.y, 78, 44, null, '#fff0b3', 3);
    }
    d.ellipse(s.target.x, s.target.y, 11 + Math.sin(s.t * 3) * 3, 7, null, '#f2e9bc99', 2);
    d.path(s.path.slice(-55), '#e4f4dc55', 3);
    for (const a of [...s.ducks, {...s.p, face: s.face, mother: true}]) {
      const c = d.c;
      c.save(); c.translate(a.x, a.y + Math.sin(s.t * 3 + a.x) * 2); c.scale(a.face, 1);
      if (a.crown) d.item(spriteKey('crowned-duck'), 0, 0, {w: 54, shadow: false, fallback: () => d.animal(0, 0, 'duck', .9, s.t)});
      else d.animal(0, 0, 'duck', a.mother ? 1.12 : .74, s.t);
      c.restore();
      if (!a.mother && !a.joined) d.text('…', a.x, a.y - 32, 22, '#fff1ba');
    }
  },
  readout: s => s.joined + ' / ' + s.ducks.length + ' ducklings following · ' + (s.joined === s.ducks.length ? 'Back to ' + s.home.name : 'Find every little wanderer'),
};
