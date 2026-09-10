import {clamp, done} from '../draw.js';
import {spriteKey} from '../prizes.js';

const seals = ['pressed-heart', 'star-token', 'moon-penny'];
const colors = ['#de8f99', '#e2c478', '#a6d1c9'];
const symbols = ['♥', '★', '☾'];

function drop(s) {
  if (s.ball) return;
  s.ball = {x: s.aim, y: 400, vx: 12, vy: 10};
  s.attempts++;
  s.trail = [];
}
function bounce(p, q, r) {
  const dx = p.x - q.x, dy = p.y - q.y, dd = Math.hypot(dx, dy);
  if (dd >= r + 12) return;
  const nx = dd ? dx / dd : 1, ny = dd ? dy / dd : 0;
  p.x = q.x + nx * (r + 12 + .2); p.y = q.y + ny * (r + 12 + .2);
  const v = p.vx * nx + p.vy * ny;
  if (v < 0) { p.vx -= v * 1.6 * nx; p.vy -= v * 1.6 * ny; }
  if (Math.abs(p.vx) < 4) p.vx += 9;
}

export default {
  title: 'Peggy’s Marble Mill',
  intro: 'A sealed treasure, a forest of brass pegs, and two little gates with minds of their own. Help Peggy sort the day’s deliveries.',
  instructions: 'Choose a drop position at the top and release a marble. Hold Tilt left/right to influence its path; Flip gates reverses the two lower ramps. Match the marble’s seal to its cup. Arrows tilt, Space drops, Up flips the gates. Wrong deliveries are free to retry.',
  levels: ['The first sorting run', 'Six special deliveries', 'A quicker little mill'],
  sprites: ['pressed-heart', 'star-token', 'moon-penny', 'lucky-dish'],
  prizes: ['five-penny-stack', 'lucky-dish', 'mercury-bead'],
  actions: [{id: 'left', label: 'Tilt left', hold: true}, {id: 'drop', label: 'Drop marble'}, {id: 'gate', label: 'Flip gates'}, {id: 'right', label: 'Tilt right', hold: true}],
  create(level) {
    const pegs = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) pegs.push({x: 270 + c * 85 + (r % 2 ? 40 : 0), y: 485 + r * 65});
    return {level, t: 0, aim: 450, ball: null, pegs, gate: 1, delivered: 0, attempts: 0, queue: Array.from({length: 4 + level}, (_, i) => (i * 2 + level) % 3), trail: [], note: 'Match the seal to the cup.'};
  },
  update(s, dt, input) {
    s.t += dt;
    const tilt = (input.actions.has('right') || input.keys.has('ArrowRight') ? 1 : 0)
      - (input.actions.has('left') || input.keys.has('ArrowLeft') ? 1 : 0);
    if (!s.ball) { s.aim = clamp(s.aim + tilt * 220 * dt, 230, 670); return; }
    const p = s.ball;
    for (let n = 0; n < 4; n++) {
      const h = dt / 4;
      p.vx += tilt * 300 * h; p.vy += (250 + s.level * 35) * h; p.vx *= Math.exp(-.12 * h);
      p.x += p.vx * h; p.y += p.vy * h;
      if (p.x < 222) { p.x = 222; p.vx = Math.abs(p.vx) * .7; }
      if (p.x > 678) { p.x = 678; p.vx = -Math.abs(p.vx) * .7; }
      for (const peg of s.pegs) bounce(p, peg, 9);
      for (let i = 0; i < 2; i++) {
        const cx = 330 + i * 240, cy = 910, a = s.gate * (i ? -.45 : .45);
        const ax = cx - Math.cos(a) * 70, ay = cy - Math.sin(a) * 70;
        const bx = cx + Math.cos(a) * 70, by = cy + Math.sin(a) * 70;
        const dx = bx - ax, dy = by - ay, t = clamp(((p.x - ax) * dx + (p.y - ay) * dy) / (dx * dx + dy * dy), 0, 1);
        bounce(p, {x: ax + dx * t, y: ay + dy * t}, 7);
      }
      p.vx = clamp(p.vx, -420, 420); p.vy = clamp(p.vy, -500, 500);
    }
    s.trail.push({x: p.x, y: p.y}); if (s.trail.length > 24) s.trail.shift();
    if (p.y > 1030) {
      const cup = clamp(Math.floor((p.x - 210) / 160), 0, 2);
      if (cup === s.queue[s.delivered]) { s.delivered++; s.note = 'Sorted into the right cup.'; }
      else s.note = 'That one needs the other cup. Another marble is ready.';
      s.ball = null;
      if (s.delivered === s.queue.length) done(s, 'The mill is running beautifully', s.delivered + ' deliveries correctly sorted in ' + s.attempts + ' drops.');
    }
  },
  pointer(s, type, p) {
    if (!s.ball && (type === 'down' || type === 'move')) s.aim = clamp(p.x, 230, 670);
    if (type === 'up' && !s.ball) drop(s);
  },
  action(s, id) { if (id === 'drop') drop(s); if (id === 'gate') s.gate *= -1; },
  key(s, k, down) { if (!down) return; if (k === ' ') drop(s); if (k === 'ArrowUp') s.gate *= -1; },
  draw(s, d) {
    for (const x of [210, 690]) {
      d.line({x, y: 405}, {x, y: 1025}, '#8a7652', 13);
      d.line({x: x - 2, y: 405}, {x: x - 2, y: 1025}, '#e6c690', 3);
    }
    for (const p of s.pegs) {
      d.ellipse(p.x + 3, p.y + 5, 11, 7, '#203f3c55');
      d.ball(p.x, p.y, 9, '#cbb581');
    }
    for (let i = 0; i < 2; i++) {
      const x = 330 + i * 240, y = 910, a = s.gate * (i ? -.45 : .45);
      d.line({x: x - Math.cos(a) * 70, y: y - Math.sin(a) * 70}, {x: x + Math.cos(a) * 70, y: y + Math.sin(a) * 70}, '#ddba7d', 14);
      d.circle(x, y, 11, '#9b8057', '#f0d4a0', 2);
    }
    for (let i = 0; i < 3; i++) {
      const x = 290 + i * 160;
      d.item(spriteKey('lucky-dish'), x, 1072, {
        w: 118,
        fallback: () => {
          d.poly([[x - 72, 1030], [x - 54, 1110], [x + 54, 1110], [x + 72, 1030]], colors[i], '#e9d1a2', 3);
          d.ellipse(x, 1030, 72, 15, '#315956', '#e9d1a2', 3);
        },
      });
      d.item(spriteKey(seals[i]), x, 1060, {
        w: 36, shadow: false,
        fallback: () => d.text(symbols[i], x, 1080, 29, '#f9edca'),
      });
    }
    d.path(s.trail, '#e6e2cc66', 3);
    const next = s.queue[s.delivered];
    const seal = seals[next] || seals[0];
    if (s.ball) {
      d.item(spriteKey(seal), s.ball.x, s.ball.y, {
        w: 28, fallback: () => { d.ball(s.ball.x, s.ball.y, 12, colors[next] || colors[0]); d.text(symbols[next] || '', s.ball.x, s.ball.y + 4, 12, '#534b4b'); },
      });
    } else if (next !== undefined) {
      d.item(spriteKey(seal), s.aim, 400, {
        w: 34, fallback: () => d.ball(s.aim, 400, 15, colors[next]),
      });
      d.text('↓', s.aim, 370, 25);
    }
  },
  readout: s => s.delivered + ' / ' + s.queue.length + ' sorted · Next ' + (symbols[s.queue[s.delivered]] || 'complete') + ' · ' + s.note,
};
