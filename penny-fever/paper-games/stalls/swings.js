import {done, TAU} from '../draw.js?v=ink-1';
import {spriteKey} from '../prizes.js';
import {pace, swell, bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const CHAIRS = ['swing-spinner', 'heart-gear', 'star-token', 'prize-bag', 'music-carousel', 'ride-ticket'];

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
  const window = pace(s.level, 0.26, 0.024, 0.12);
  if (s.chairs[best] === s.target && error < window) {
    s.caught++;
    s.note = 'A chair over the mat.';
    if (s.caught >= s.goal) done(s, 'The swings hold still', s.caught + ' chairs over the prize mat.');
    else s.target = s.chairs[(best + 2 + s.level) % n];
  } else {
    s.note = s.chairs[best] === s.target ? 'Almost — brake longer, then let go.' : 'Wrong chair. Hold to slow them, let go over the mat.';
  }
  s.tries++;
}

export default {
  title: 'Chair Waltz',
  intro: 'Hugo’s chair-o-planes fly a little too happily. Hold to slow the flight, then let go when the matching chair is over the front mat.',
  instructions: 'Hold Catch or Space to brake. Release when the chair shown at the top is over the pink mat. Misses are free.',
  levels: ['A gentle flight', 'The evening spin', 'Lantern chairs', 'A quicker waltz', 'Six little seats', 'The last sweep'],
  sprites: CHAIRS,
  prizes: ['swing-spinner', 'friendship-pins', 'heart-gear', 'kindness-heart', 'rose-hair-bow', 'ribbon-gift-box'],
  actions: [{id: 'catch', label: 'Hold to brake', hold: true}],
  create(level) {
    const list = CHAIRS.slice(0, swell(level, 4, 1, 6));
    const s = {
      level, t: 0, spin: 0, cool: 0, caught: 0, tries: 0, goal: swell(level, 3, 1, 8),
      chairs: list, target: list[0], holding: false, note: 'Hold to slow, let go over the mat.',
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt) {
    s.t += dt; s.cool = Math.max(0, s.cool - dt);
    s.spin += swell(s.level, 0.62, 0.24, 1.7) * (s.holding ? 0.28 : 1) * dt;
  },
  pointer(s, type) {
    if (s.result) return;
    if (type === 'down') s.holding = true;
    if (type === 'up' || type === 'cancel') {
      if (s.holding) snap(s);
      s.holding = false;
    }
  },
  action(s, id, on) {
    if (id !== 'catch' || s.result) return;
    if (on === false) {
      if (s.holding) snap(s);
      s.holding = false;
    } else s.holding = true;
  },
  key(s, k, down) {
    if (k !== ' ') return;
    if (down) s.holding = true;
    else {
      if (s.holding) snap(s);
      s.holding = false;
    }
  },
  draw(s, d) {
    const cx = 450, cy = 740, r = 188, n = s.chairs.length;
    d.item(spriteKey(s.target), cx, 430, {w: 64, shadow: false, fallback: () => d.star(cx, 430, 20)});
    d.text('this chair', cx, 380, 15, '#5a3a40');
    d.ellipse(cx, cy + r * 0.58, 46, 16, '#c890a055', '#c890a0', 2);
    for (let i = 0; i < n; i++) {
      const a = s.spin + i * TAU / n;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.55;
      const front = Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.22;
      if (front) d.glow(x, y, 40, '#ffd0c0');
      d.item(spriteKey(s.chairs[i]), x, y, {
        w: front ? 60 : 46, alpha: s.chairs[i] === s.target ? 1 : 0.88,
        fallback: () => d.circle(x, y, 16, '#e8b0a0', '#f8dfa7', 2),
      });
    }
    d.text(s.caught + ' / ' + s.goal, 450, 1090, 20, '#5a3a40');
  },
  readout: s => s.caught + ' / ' + s.goal + ' chairs · ' + s.note,
};
