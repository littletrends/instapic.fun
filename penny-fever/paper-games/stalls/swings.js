import {done, TAU} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {pace, swell} from '../chapter-kit.js';
import {ROOMS, paperRoom} from '../paper-room.js';

const CHAIRS = ['swing-spinner', 'pressed-heart', 'star-token', 'moon-penny', 'prize-bag', 'friendship-pins'];

function snap(s) {
  if (s.cool > 0 || s.result) return;
  const n = s.chairs.length;
  let best = 0, error = 99;
  for (let i = 0; i < n; i++) {
    const a = s.spin + i * TAU / n;
    const aligned = Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2)));
    if (aligned < error) { error = aligned; best = i; }
  }
  s.cool = 0.4;
  const window = pace(s.level, 0.24, 0.026, 0.11);
  if (s.chairs[best] === s.target && error < window) {
    s.caught++;
    s.note = 'A chair over the mat.';
    if (s.caught >= s.goal) done(s, 'The swings hold still', s.caught + ' chairs over the prize mat.');
    else s.target = s.chairs[(best + 2 + s.level) % n];
  } else {
    s.note = s.chairs[best] === s.target ? 'Almost — wait for the front.' : 'Wrong chair. Let them fly.';
  }
  s.tries++;
}

export default {
  title: 'Chair Waltz',
  intro: 'Hugo’s chair-o-planes fly a little too happily. Catch the matching chair when it sweeps over the front mat.',
  instructions: 'Chairs fly in a circle. When the one shown at the top is at the front of the oval, tap Catch or press Space.',
  levels: ['A gentle flight', 'The evening spin', 'Lantern chairs', 'A quicker waltz', 'Six little seats', 'The last sweep'],
  sprites: CHAIRS,
  prizes: ['swing-spinner', 'pressed-heart', 'star-token', 'prize-bag', 'friendship-pins', 'ride-ticket'],
  actions: [{id: 'catch', label: 'Catch · Space'}],
  create(level) {
    const list = CHAIRS.slice(0, swell(level, 4, 1, 6));
    return {
      level, t: 0, spin: 0, cool: 0, caught: 0, tries: 0, goal: swell(level, 3, 1, 8),
      chairs: list, target: list[0], note: 'Wait for the matching chair at the front.',
    };
  },
  update(s, dt) {
    s.t += dt; s.cool = Math.max(0, s.cool - dt);
    s.spin += swell(s.level, 0.62, 0.24, 1.7) * dt;
  },
  pointer(s, type) { if (type === 'down') snap(s); },
  action(s, id) { if (id === 'catch') snap(s); },
  key(s, k, down) { if (k === ' ' && down) snap(s); },
  draw(s, d) {
    paperRoom(d, ROOMS.swings);
    const cx = 450, cy = 620, r = 200, n = s.chairs.length;
    d.item(spriteKey(s.target), cx, 236, {w: 64, shadow: false, fallback: () => d.star(cx, 236, 20)});
    d.text('this chair', cx, 186, 15, '#f0d0c0');
    d.ellipse(cx, cy + r + 8, 46, 16, '#c890a055', '#c890a0', 2);
    for (let i = 0; i < n; i++) {
      const a = s.spin + i * TAU / n;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.55;
      d.line({x: cx, y: cy}, {x, y: y - 18}, '#c890a088', 2);
      const front = Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.22;
      if (front) d.glow(x, y, 40, '#ffd0c0');
      d.item(spriteKey(s.chairs[i]), x, y, {
        w: front ? 60 : 46, alpha: s.chairs[i] === s.target ? 1 : 0.88,
        fallback: () => d.circle(x, y, 16, '#e8b0a0', '#f8dfa7', 2),
      });
    }
    d.text(s.caught + ' / ' + s.goal, 450, 1090, 20, '#f3e2d4');
  },
  readout: s => s.caught + ' / ' + s.goal + ' chairs · ' + s.note,
};
