import {done} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {swell} from '../chapter-kit.js';

const FACES = ['laughing-doorway', 'looking-glass-locket', 'velvet-mask'];

function deal(s) {
  s.doors = ['looking-glass-locket', 'laughing-doorway', 'velvet-mask'];
  s.real = 1;
  s.flash = 0.9;
  s.shuffled = false;
  s.locked = false;
  s.note = 'Watch the real doorway — then pick it.';
}

function shuffleDoors(s) {
  const order = [0, 1, 2].sort(() => Math.random() - 0.5);
  s.doors = order.map(i => s.doors[i]);
  s.real = s.doors.indexOf('laughing-doorway');
  s.shuffled = true;
}

export default {
  title: 'Laughing Doorway',
  intro: 'Juno’s funhouse has two mirrors and one real laugh. Remember the true door after they shuffle.',
  instructions: 'The real doorway flashes. Then the three doors mix. Tap the real laugh. Later chapters shuffle faster and ask for more finds.',
  levels: ['A kind first laugh', 'The mirrors wink', 'A quicker shuffle', 'Four true doors', 'A busy hall', 'The last laugh'],
  sprites: ['laughing-doorway', 'looking-glass-locket', 'velvet-mask'],
  prizes: ['laughing-doorway', 'velvet-mask', 'looking-glass-locket', 'secret-door-key', 'pocket-theatre', 'showman-ribbon'],
  actions: [
    {id: 'd0', label: 'Left door'},
    {id: 'd1', label: 'Middle door'},
    {id: 'd2', label: 'Right door'},
  ],
  create(level) {
    const s = {level, t: 0, found: 0, goal: swell(level, 3, 1, 8), doors: [], real: 0, flash: 0, shuffled: false, locked: false, note: ''};
    deal(s);
    return s;
  },
  update(s, dt) {
    s.t += dt;
    const was = s.flash;
    s.flash = Math.max(0, s.flash - dt);
    if (was > 0 && s.flash === 0 && !s.shuffled) shuffleDoors(s);
  },
  pointer(s, type, p) {
    if (type !== 'down' || s.flash > 0 || s.locked || s.result) return;
    const xs = [250, 450, 650];
    let i = 0, best = 99;
    xs.forEach((x, n) => { const d = Math.abs(p.x - x); if (d < best) { best = d; i = n; } });
    if (best < 90) this.action(s, 'd' + i);
  },
  action(s, id) {
    if (s.flash > 0 || s.locked || s.result) return;
    const i = Number(String(id).slice(1));
    if (!(i >= 0 && i < 3)) return;
    s.locked = true;
    if (i === s.real) {
      s.found++;
      s.note = 'The real laugh!';
      if (s.found >= s.goal) done(s, 'Through the real door', s.found + ' true doorways.');
      else setTimeout(() => deal(s), 500);
    } else {
      s.note = 'A mirror. Watch again.';
      setTimeout(() => deal(s), 700);
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (k === 'ArrowLeft' || k === '1') this.action(s, 'd0');
    if (k === 'ArrowDown' || k === '2' || k === ' ') this.action(s, 'd1');
    if (k === 'ArrowRight' || k === '3') this.action(s, 'd2');
  },
  draw(s, d) {
    d.text(s.flash > 0 ? 'watch the laugh' : 'pick the real door', 450, 390, 16, '#5a3a40');
    const xs = [250, 450, 650];
    xs.forEach((x, i) => {
      const real = i === s.real;
      const show = s.flash > 0 ? (real ? 'laughing-doorway' : s.doors[i]) : s.doors[i];
      if (s.flash > 0 && real) d.glow(x, 700, 70, '#ffe0d0');
      d.item(spriteKey(show), x, 700, {
        w: 110, fallback: () => d.poly([[x - 40, 580], [x + 40, 580], [x + 40, 820], [x - 40, 820]], '#d4a0b8', '#f0d0c8', 2),
      });
    });
    d.text(s.found + ' / ' + s.goal, 450, 1090, 20, '#5a3a40');
  },
  readout: s => s.found + ' / ' + s.goal + ' doors · ' + s.note,
};
