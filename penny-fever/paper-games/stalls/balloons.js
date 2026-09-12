import {clamp, dist, done, TAU} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {pace, swell, bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const kinds = ['balloon-bouquet', 'autumn-leaf-lantern', 'moon-lantern', 'prize-bag'];

function spawn(s) {
  if (s.floaters.length >= 5) return;
  const id = kinds[(s.spawned + s.level) % kinds.length];
  s.floaters.push({
    id, x: 280 + (s.spawned % 5) * 85, y: 980,
    vx: (s.spawned % 2 ? 1 : -1) * swell(s.level, 20, 8, 52),
    vy: -(swell(s.level, 70, 12, 120) + (s.spawned % 3) * 8),
    a: 0, popped: false,
  });
  s.spawned++;
}

export default {
  title: 'Balloon Garden',
  intro: 'Nell has let a handful of paper balloons loose in the garden. Pop only the one she calls, and let the others drift on.',
  instructions: 'Tap the matching balloon as it floats past. The picture at the top is the one to pop. Wrong balloons simply keep flying. Arrows move a little pointer; Space pops whatever is nearest. Fill the garden with the right pops — no timer.',
  levels: ['A quiet afternoon', 'A breeze in the garden', 'The evening release', 'A busy little sky', 'The midnight bunch', 'A garden in a hurry'],
  sprites: kinds,
  prizes: ['balloon-bouquet', 'prize-bag', 'swing-spinner', 'aura-keepsake', 'laughing-doorway', 'organ-music-box'],
  actions: [{id: 'left', label: 'Pointer left', hold: true}, {id: 'pop', label: 'Pop nearest · Space'}, {id: 'right', label: 'Pointer right', hold: true}],
  create(level) {
    const s = {
      level, t: 0, aim: 450, floaters: [], spawned: 0, popped: 0, misses: 0,
      goal: swell(level, 8, 3, 22), delay: .2, target: kinds[0],
      note: 'Pop only the matching balloon.',
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    s.t += dt; s.delay -= dt;
    const axis = (input.actions.has('right') || input.keys.has('ArrowRight') ? 1 : 0)
      - (input.actions.has('left') || input.keys.has('ArrowLeft') ? 1 : 0);
    s.aim = clamp(s.aim + axis * 280 * dt, 260, 640);
    if (s.delay <= 0) { spawn(s); s.delay = pace(s.level, 1.15, .14, .52); }
    if (s.popped % 3 === 0) s.target = kinds[(Math.floor(s.popped / 3) + s.level) % kinds.length];
    for (const b of s.floaters) {
      if (b.popped) { b.vy += 280 * dt; b.a += dt * 4; }
      else { b.x += b.vx * dt; b.y += b.vy * dt; b.a = Math.sin(s.t * 2 + b.x) * .12; }
      if (b.x < 250) { b.x = 250; b.vx = Math.abs(b.vx); }
      if (b.x > 650) { b.x = 650; b.vx = -Math.abs(b.vx); }
    }
    s.floaters = s.floaters.filter(b => b.y > 320 && b.y < 1040);
    if (s.popped >= s.goal) done(s, 'The garden is full of little pops', s.popped + ' matching balloons, ' + s.misses + ' wanderers left to drift. Nell is tying the next bunch.');
  },
  pointer(s, type, p) {
    if (type !== 'down') return;
    s.aim = p.x;
    const hit = s.floaters.filter(b => !b.popped).sort((a, b) => dist(p, a) - dist(p, b))[0];
    if (hit && dist(p, hit) < 48) {
      hit.popped = true;
      if (hit.id === s.target) { s.popped++; s.note = 'A lovely pop.'; }
      else { s.misses++; s.note = 'Let that one go. Watch the picture at the top.'; }
    }
  },
  action(s, id) {
    if (id !== 'pop') return;
    const hit = s.floaters.filter(b => !b.popped).sort((a, b) => Math.abs(a.x - s.aim) - Math.abs(b.x - s.aim))[0];
    if (hit && Math.abs(hit.x - s.aim) < 70) {
      hit.popped = true;
      if (hit.id === s.target) { s.popped++; s.note = 'A lovely pop.'; }
      else { s.misses++; s.note = 'Let that one go.'; }
    }
  },
  key(s, k, down) { if (k === ' ' && down) this.action(s, 'pop'); },
  draw(s, d) {
    d.item(spriteKey(s.target), 450, 236, {w: 68, shadow: false, fallback: () => d.circle(450, 236, 24, '#e2a0b4')});
    d.text('pop this', 450, 186, 15, '#5a3a48');
    d.line({x: s.aim, y: 360}, {x: s.aim, y: 980}, '#6a3a5044', 2);
    for (const b of s.floaters) {
      const c = d.c; c.save(); c.translate(b.x, b.y); c.rotate(b.a);
      d.item(spriteKey(b.id), 0, 0, {
        w: 58, alpha: b.popped ? 0.4 : 1,
        fallback: () => d.circle(0, 0, 22, '#e4a4b7', '#f6d78a', 2),
      });
      c.restore();
    }
    d.text(s.popped + ' / ' + s.goal, 450, 1092, 20, '#5a3a48');
  },
  readout: s => s.popped + ' / ' + s.goal + ' matching · ' + s.note,
};
