import {done} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {pace, swell, bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const KEYS = ['organ-music-box', 'star-token', 'moon-penny', 'swing-spinner'];

export default {
  title: 'Fairground Organ',
  intro: 'Otto’s fairground organ unrolls a paper score. Tap when a note crosses the gold bar.',
  instructions: 'Notes drift down. Tap or press Space as they cross the bar. Later chapters send more, faster.',
  levels: ['A slow roll', 'The evening waltz', 'A busier score', 'Lantern notes', 'A quick polka', 'The last chord'],
  sprites: KEYS,
  prizes: ['organ-music-box', 'star-token', 'pressed-heart', 'lucky-match', 'marquee-bulb', 'pocket-marquee'],
  actions: [{id: 'play', label: 'Play · Space'}],
  create(level) {
    const s = {
      level, t: 0, notes: [], spawn: 0.2, hit: 0, miss: 0,
      goal: swell(level, 8, 3, 22),
      note: 'Play the gold bar.',
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt) {
    if (s.result) return;
    s.t += dt; s.spawn -= dt;
    const speed = swell(s.level, 140, 28, 280);
    if (s.spawn <= 0) {
      s.notes.push({
        id: KEYS[Math.floor(Math.random() * KEYS.length)],
        x: 280 + Math.random() * 340, y: 400, hit: false,
      });
      s.spawn = pace(s.level, 0.9, 0.08, 0.38);
    }
    for (const n of s.notes) n.y += speed * dt;
    s.notes = s.notes.filter(n => {
      if (n.y > 980 && !n.hit) { s.miss++; return false; }
      return n.y < 1040;
    });
    if (s.hit >= s.goal) done(s, 'The roll finds its rest', s.hit + ' notes, ' + s.miss + ' wandered off.');
  },
  pointer(s, type) { if (type === 'down') this.action(s, 'play'); },
  action(s, id) {
    if (id !== 'play' || s.result) return;
    const hit = s.notes.filter(n => !n.hit && n.y > 820 && n.y < 940).sort((a, b) => Math.abs(a.y - 880) - Math.abs(b.y - 880))[0];
    if (hit) {
      hit.hit = true; s.hit++;
      s.note = 'A true key.';
    } else s.note = 'Wait for the bar.';
  },
  key(s, k, down) { if (k === ' ' && down) this.action(s, 'play'); },
  draw(s, d) {
    d.line({x: 220, y: 880}, {x: 680, y: 880}, '#c4a070', 6);
    d.text('play here', 450, 390, 15, '#5a3a40');
    for (const n of s.notes) {
      d.item(spriteKey(n.id), n.x, n.y, {
        w: n.hit ? 36 : 52, alpha: n.hit ? 0.35 : 1,
        fallback: () => d.circle(n.x, n.y, 16, '#e8c878'),
      });
    }
    d.text(s.hit + ' / ' + s.goal, 450, 1090, 20, '#5a3a40');
  },
  readout: s => s.hit + ' / ' + s.goal + ' notes · ' + s.note,
};
