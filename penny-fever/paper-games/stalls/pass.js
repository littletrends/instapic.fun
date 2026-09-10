import {clamp, dist, done} from '../draw.js';
import {spriteKey} from '../prizes.js';

function safe(s, p) { return s.hides.some(h => dist(p, h) < 47); }
function blocked(s, x, y) { return s.curtains.some(g => Math.abs(y - g.y) < 30 && (x < g.x - g.gap / 2 + 16 || x > g.x + g.gap / 2 - 16)); }
function spotted(s) {
  s.p = {...s.checkpoint}; s.target = null; s.seen = 0; s.shield = 2; s.rewinds++;
  s.note = 'A spotlight found you. Back to your last safe key — nothing lost.';
}
function key(d, x, y, size = 1) {
  d.ring(x, y - 12 * size, 9 * size, '#e1bb6e', 4 * size);
  d.line({x, y: y - 3 * size}, {x, y: y + 17 * size}, '#d5a45d', 5 * size);
  d.line({x, y: y + 13 * size}, {x: x + 9 * size, y: y + 13 * size}, '#e4c37e', 4 * size);
}
function curtain(d, x1, x2, y) {
  if (x2 <= x1) return;
  d.poly([[x1, y - 12], [x2, y - 12], [x2, y + 17], [x1, y + 17]], '#3f1827');
  for (let x = x1; x < x2; x += 14) {
    const end = Math.min(x + 14, x2);
    d.poly([[x, y - 13], [end, y - 13], [end, y + 12], [x, y + 17]], Math.floor((x - x1) / 14) % 2 ? '#963f4d' : '#6d2a3b');
  }
  d.line({x: x1, y: y - 14}, {x: x2, y: y - 14}, '#bd9155', 4);
  d.line({x: x1, y: y + 19}, {x: x2, y: y + 19}, '#d9b36e', 2);
}

export default {
  title: 'Backstage Run',
  intro: 'Bea has left the last curtain unlocked… almost. Wind up a tiny traveller and slip through the theatre while its scenery changes around you.',
  instructions: 'Tap a destination or hold the arrows to walk. Pass through the gaps in the moving curtains and collect all three secret door keys. In later chapters, stay out of the sweeping spotlights or rest in the green hiding circles. Each key saves a safe return point. Reach the top doorway with all three.',
  levels: ['After the audience leaves', 'Someone left a light on', 'The midnight curtain call'],
  sprites: ['secret-door-key', 'velvet-mask'],
  prizes: ['showman-pass', 'velvet-mask', 'secret-door-key'],
  actions: [{id: 'left', label: '←', hold: true}, {id: 'up', label: '↑', hold: true}, {id: 'down', label: '↓', hold: true}, {id: 'right', label: '→', hold: true}, {id: 'wait', label: 'Wait here'}],
  create(level) {
    const keys = [{x: 310, y: 980}, {x: 600, y: 755}, {x: 305, y: 550}];
    return {
      level, t: 0, p: {x: 450, y: 1080}, target: null, checkpoint: {x: 450, y: 1080},
      keys: keys.map(p => ({...p, got: false})), hides: [...keys, {x: 670, y: 555}, {x: 240, y: 755}],
      curtains: [890, 680, 460].map((y, i) => ({y, x: 450, gap: 155 - level * 12, phase: i * 1.8})),
      lights: Array.from({length: level}, (_, i) => ({x: i ? 725 : 175, y: i ? 545 : 765, a: 0, base: i ? Math.PI : 0})),
      seen: 0, shield: 0, rewinds: 0, steps: 0, note: 'Find the secret door keys. The green circles are safe resting places.',
    };
  },
  update(s, dt, input) {
    s.t += dt; s.shield = Math.max(0, s.shield - dt);
    for (const g of s.curtains) g.x = 450 + Math.sin(s.t * (.42 + s.level * .06) + g.phase) * 155;
    for (const [i, l] of s.lights.entries()) l.a = l.base + Math.sin(s.t * .65 + i) * .55;
    let dx = (input.keys.has('ArrowRight') || input.actions.has('right') ? 1 : 0)
      - (input.keys.has('ArrowLeft') || input.actions.has('left') ? 1 : 0);
    let dy = (input.keys.has('ArrowDown') || input.actions.has('down') ? 1 : 0)
      - (input.keys.has('ArrowUp') || input.actions.has('up') ? 1 : 0);
    if (dx || dy) s.target = null;
    else if (s.target) {
      dx = s.target.x - s.p.x; dy = s.target.y - s.p.y;
      if (Math.hypot(dx, dy) < 5) { s.target = null; dx = dy = 0; }
    }
    const len = Math.hypot(dx, dy);
    if (len) {
      const step = Math.min(185 * dt, len > 2 ? len : 185 * dt);
      const nx = clamp(s.p.x + dx / len * step, 195, 705), ny = clamp(s.p.y + dy / len * step, 340, 1110);
      if (!blocked(s, nx, s.p.y)) s.p.x = nx;
      if (!blocked(s, s.p.x, ny)) s.p.y = ny;
      s.steps += dt;
    }
    for (const g of s.curtains) if (Math.abs(s.p.y - g.y) < 29 && (s.p.x < g.x - g.gap / 2 + 16 || s.p.x > g.x + g.gap / 2 - 16)) {
      s.p.y = g.y + (s.p.y < g.y ? -31 : 31); s.target = null;
    }
    for (const k of s.keys) if (!k.got && dist(s.p, k) < 32) {
      k.got = true; s.checkpoint = {x: k.x, y: k.y}; s.shield = 1; s.note = 'A secret door key, and a safe place to return.';
    }
    let inLight = false;
    if (!safe(s, s.p) && !s.shield) for (const l of s.lights) {
      const dx = s.p.x - l.x, dy = s.p.y - l.y, a = Math.atan2(dy, dx);
      const delta = Math.atan2(Math.sin(a - l.a), Math.cos(a - l.a));
      if (Math.hypot(dx, dy) < 460 && Math.abs(delta) < .16) inLight = true;
    }
    s.seen = clamp(s.seen + (inLight ? dt : dt * -2), 0, .48);
    if (s.seen >= .48) spotted(s);
    if (s.p.y < 375 && Math.abs(s.p.x - 450) < 73) {
      if (s.keys.every(k => k.got)) done(s, 'Beyond the last velvet curtain', 'Three keys, one tiny traveller and a whole theatre explored. ' + s.rewinds + ' gentle returns to a safe place. Bea kept the final light on for you.');
      else s.note = 'The final curtain needs all three keys.';
    }
  },
  pointer(s, type, p, input) {
    if (type === 'down' || type === 'move' && input.down) s.target = {x: clamp(p.x, 195, 705), y: clamp(p.y, 340, 1110)};
    if (type === 'cancel') s.target = null;
  },
  action(s, id) { if (id === 'wait') s.target = null; },
  draw(s, d) {
    for (const h of s.hides) {
      d.ellipse(h.x, h.y, 43, 31, '#71978444', '#657e5b', 2);
      d.leaf(h.x - 22, h.y + 5, -.7, 20, '#54735a');
      d.leaf(h.x + 24, h.y - 5, .9, 18, '#809872');
    }
    for (const l of s.lights) {
      const c = d.c; c.save();
      const grad = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, 460);
      grad.addColorStop(0, '#ffe6a655'); grad.addColorStop(1, '#ffe6a608');
      c.fillStyle = grad; c.beginPath(); c.moveTo(l.x, l.y); c.arc(l.x, l.y, 460, l.a - .16, l.a + .16); c.closePath(); c.fill(); c.restore();
      d.circle(l.x, l.y, 14, '#40342c', '#d0ad6c', 4);
      d.line(l, {x: l.x + Math.cos(l.a) * 22, y: l.y + Math.sin(l.a) * 22}, '#f0d08f', 8);
    }
    for (const g of s.curtains) {
      d.line({x: 175, y: g.y - 18}, {x: 725, y: g.y - 18}, '#45392b', 3);
      curtain(d, 175, g.x - g.gap / 2, g.y);
      curtain(d, g.x + g.gap / 2, 725, g.y);
      d.ellipse(g.x, g.y + 2, g.gap / 2 - 13, 7, '#cfdbb566');
    }
    for (const k of s.keys) if (!k.got) {
      d.glow(k.x, k.y, 28, '#edc477');
      d.item(spriteKey('secret-door-key'), k.x, k.y + Math.sin(s.t * 2) * 4, {
        w: 36, fallback: () => key(d, k.x, k.y + Math.sin(s.t * 2) * 4),
      });
    } else d.text('✓', k.x, k.y + 4, 20, '#dae0b3');
    d.ellipse(450, 365, 64, 21, '#3e2d2733', '#bc995e', 3);
    for (let i = 0; i < 3; i++) d.circle(422 + i * 28, 345, 7, s.keys[i].got ? '#e7c275' : '#5c4839', '#bc995e', 1);
    if (s.target) d.ellipse(s.target.x, s.target.y, 10, 6, null, '#f9e6bb', 2);
    const p = s.p;
    d.ellipse(p.x, p.y + 17, 22, 9, '#30252155');
    d.item(spriteKey('velvet-mask'), p.x, p.y, {
      w: 44, fallback: () => {
        d.line({x: p.x - 7, y: p.y + 7}, {x: p.x - 13, y: p.y + 18 + Math.sin(s.steps * 18) * 3}, '#5e4933', 5);
        d.line({x: p.x + 7, y: p.y + 7}, {x: p.x + 13, y: p.y + 18 - Math.sin(s.steps * 18) * 3}, '#5e4933', 5);
        d.poly([[p.x - 15, p.y - 14], [p.x + 15, p.y - 14], [p.x + 18, p.y + 10], [p.x - 18, p.y + 10]], '#b38750', '#ecd296', 2);
        key(d, p.x, p.y - 18, .75);
        d.ellipse(p.x - 6, p.y - 3, 2, 3, '#493425');
        d.ellipse(p.x + 6, p.y - 3, 2, 3, '#493425');
      },
    });
    if (s.seen) d.arc(p.x, p.y, 30, -Math.PI / 2, -Math.PI / 2 + s.seen / .48 * Math.PI * 2, '#e9aa70', 5);
    if (s.shield) d.ring(p.x, p.y, 29, '#b5dab288', 2);
  },
  readout: s => s.keys.filter(k => k.got).length + ' / 3 keys · ' + (safe(s, s.p) ? 'Hiding safely · ' : '') + s.note,
};
