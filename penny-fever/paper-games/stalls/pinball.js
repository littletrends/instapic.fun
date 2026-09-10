import {clamp,done,TAU} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {swell} from '../chapter-kit.js';

const rails = [[[220,850],[220,405]],[[220,405],[320,350]],[[320,350],[580,350]],[[580,350],[680,405]],[[680,405],[680,850]],[[220,850],[322,944]],[[680,850],[578,944]]].map(([a,b]) => ({a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]}}));
function collide(p, a, b, r, omega = 0, pivot = a) {
  const dx = b.x - a.x, dy = b.y - a.y, t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  const q = {x: a.x + dx * t, y: a.y + dy * t}, x = p.x - q.x, y = p.y - q.y, dd = Math.hypot(x, y);
  if (dd >= r + 13) return false;
  const nx = dd ? x / dd : 0, ny = dd ? y / dd : -1;
  p.x = q.x + nx * (r + 13.2); p.y = q.y + ny * (r + 13.2);
  const vx = -omega * (q.y - pivot.y), vy = omega * (q.x - pivot.x);
  const vn = (p.vx - vx) * nx + (p.vy - vy) * ny;
  if (vn < 0) { p.vx -= vn * 1.78 * nx; p.vy -= vn * 1.78 * ny; }
  return true;
}
function launch(s) {
  if (s.live) return;
  s.live = true; s.ball = {x: 647, y: 960, vx: -135, vy: -870}; s.trail = []; s.launches++;
}

export default {
  title: 'Thunder Garden',
  intro: 'Pip plants silver seeds and grows little thunderstorms. Keep a lightning pin rolling through the garden until every brass flower rings awake.',
  instructions: 'Launch a lightning pin, then use the two flippers. Hold the left/right side of the stage or the two buttons; Z and X work on a keyboard. Space launches. Wake all the flowers. A drained pin returns to the launch spring; your lit flowers stay lit.',
  levels: ['First sparks', 'The six-flower storm', 'Lightning among the roses', 'A garden packed with bells', 'The crowded thunderbed', 'Roses in a tempest'],
  sprites: ['lightning-pin', 'star-token'],
  prizes: ['lightning-pin', 'star-token', 'pegboard-star'],
  actions: [{id: 'left', label: 'Left flipper · Z', hold: true}, {id: 'launch', label: 'Launch · Space'}, {id: 'right', label: 'Right flipper · X', hold: true}],
  create(level) {
    const n = swell(level, 4, 1, 8), rows = Math.ceil(n / 2);
    const yTop = 450, yBot = rows <= 2 ? 605 : rows === 3 ? 750 : 780;
    const dy = rows > 1 ? (yBot - yTop) / (rows - 1) : 0;
    return {
      level, t: 0, live: false, launches: 0, score: 0, left: false, right: false,
      flippers: [{x: 322, y: 944, a: .31, w: 0, sign: 1}, {x: 578, y: 944, a: Math.PI - .31, w: 0, sign: -1}],
      ball: {x: 647, y: 960, vx: 0, vy: 0}, trail: [],
      flowers: Array.from({length: n}, (_, i) => ({x: 320 + (i % 2) * 260, y: yTop + Math.floor(i / 2) * dy, lit: false, cool: 0, phase: i})),
    };
  },
  update(s, dt, input) {
    s.t += dt;
    for (const f of s.flowers) f.cool = Math.max(0, f.cool - dt);
    const active = [s.left || input.actions.has('left') || input.keys.has('z'), s.right || input.actions.has('right') || input.keys.has('x')];
    for (let n = 0; n < 6; n++) {
      const h = dt / 6;
      s.flippers.forEach((f, i) => {
        const target = i ? (active[i] ? Math.PI + .55 : Math.PI - .31) : (active[i] ? -.55 : .31);
        const change = clamp(target - f.a, -11 * h, 11 * h); f.w = change / h; f.a += change;
      });
      if (!s.live) continue;
      const p = s.ball;
      p.vy += swell(s.level, 440, 25, 540) * h; p.vx *= Math.exp(-.025 * h); p.x += p.vx * h; p.y += p.vy * h;
      for (const r of rails) collide(p, r.a, r.b, 7);
      for (const f of s.flippers) collide(p, f, {x: f.x + Math.cos(f.a) * 123, y: f.y + Math.sin(f.a) * 123}, 12, f.w, f);
      for (const f of s.flowers) {
        const dx = p.x - f.x, dy = p.y - f.y, dd = Math.hypot(dx, dy);
        if (dd < 47) {
          const nx = dx / (dd || 1), ny = dy / (dd || 1);
          p.x = f.x + nx * 47; p.y = f.y + ny * 47;
          const speed = Math.max(480, Math.hypot(p.vx, p.vy) * 1.02);
          p.vx = nx * speed; p.vy = ny * speed;
          if (f.cool === 0) { s.score += f.lit ? 10 : 100; f.lit = true; f.cool = .18; }
        }
      }
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > 1050) { p.vx *= 1050 / speed; p.vy *= 1050 / speed; }
      if (p.y > 1070 || p.x < 150 || p.x > 750) { s.live = false; s.ball = {x: 647, y: 960, vx: 0, vy: 0}; }
    }
    if (s.live) { s.trail.push({x: s.ball.x, y: s.ball.y}); if (s.trail.length > 16) s.trail.shift(); }
    if (s.flowers.every(f => f.lit)) done(s, 'A garden full of thunder', 'Every flower is awake. ' + s.score + ' points from ' + s.launches + ' lightning pins.');
  },
  pointer(s, type, p) {
    if (type === 'down') { if (!s.live) launch(s); else if (p.x < 450) s.left = true; else s.right = true; }
    if (type === 'up' || type === 'cancel') { s.left = false; s.right = false; }
  },
  action(s, id) { if (id === 'launch') launch(s); },
  key(s, k, down) { if (k === ' ' && down) launch(s); },
  draw(s, d) {
    for (const r of rails) {
      d.line({x: r.a.x + 4, y: r.a.y + 6}, {x: r.b.x + 4, y: r.b.y + 6}, '#101d3166', 18);
      d.line(r.a, r.b, '#86745b', 14); d.line(r.a, r.b, '#e5bd79', 4);
    }
    for (const f of s.flowers) {
      if (f.lit) d.glow(f.x, f.y, 67, '#e7cba4');
      for (let i = 0; i < 7; i++) d.leaf(f.x, f.y, i * TAU / 7 + s.t * .08, 46, f.lit ? '#d597ac' : '#708392');
      d.item(spriteKey('star-token'), f.x, f.y, {
        w: f.lit ? 44 : 34, alpha: f.lit ? 1 : .7,
        fallback: () => { d.ball(f.x, f.y, 28, f.lit ? '#e4c67b' : '#b39c74'); d.star(f.x, f.y, 13, f.lit ? '#fff0b1' : '#83755f'); },
      });
    }
    d.path(s.trail, '#ebd9c144', 4);
    for (const f of s.flippers) {
      const tip = {x: f.x + Math.cos(f.a) * 123, y: f.y + Math.sin(f.a) * 123};
      d.line(f, tip, '#674c61', 27); d.line({x: f.x, y: f.y - 4}, {x: tip.x, y: tip.y - 4}, '#d296a7', 19);
      d.circle(f.x, f.y, 15, '#cdb281', '#f8dfa7', 2);
    }
    d.poly([[625, 925], [670, 925], [670, 1020], [625, 1020]], '#64738a', '#d7b986', 2);
    d.item(spriteKey('lightning-pin'), s.ball.x, s.ball.y, {
      w: 36, angle: Math.atan2(s.ball.vy, s.ball.vx) + Math.PI / 2,
      fallback: () => d.ball(s.ball.x, s.ball.y, 13, '#b5c8ce'),
    });
    d.text('Z', 322, 1020, 18); d.text('X', 578, 1020, 18);
  },
  readout: s => s.flowers.filter(f => f.lit).length + ' / ' + s.flowers.length + ' flowers · ' + s.score + ' points · ' + (s.live ? 'Keep the pin in play' : 'Spring ready — launch'),
};
