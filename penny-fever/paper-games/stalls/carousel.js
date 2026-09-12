import {clamp, done, TAU} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {pace, swell, bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const rides = ['music-carousel', 'organ-music-box', 'pocket-wheel', 'swing-spinner', 'gyro-ghost', 'star-token'];

function catchRide(s) {
  if (s.cool > 0 || s.result) return;
  const n = s.rides.length, window = pace(s.level, .22, .025, .12);
  let best = 0, error = 99;
  for (let i = 0; i < n; i++) {
    const a = s.spin + i * TAU / n;
    const aligned = Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2)));
    if (aligned < error) { error = aligned; best = i; }
  }
  s.cool = .45;
  if (s.rides[best] === s.target && error < window) {
    s.caught++; s.note = 'A perfect stop!';
    if (s.caught >= s.goal) done(s, 'The waltz finds its rest', s.caught + ' matching rides in ' + s.tries + ' stops. Calliope keeps the lantern lit for an encore.');
    else s.target = s.rides[(best + 2 + s.level) % n];
  } else {
    s.note = s.rides[best] === s.target ? 'Almost — wait for the lantern.' : 'That was the wrong ride. Let it come round again.';
  }
  s.tries++;
}

export default {
  title: 'Carousel Waltz',
  intro: 'Calliope’s pocket carousel never quite sits still. Stop it when the matching treasure is under the lantern, and the whole little band will keep time with you.',
  instructions: 'Watch the spinning treasures. When the one shown at the top sits under the lantern, tap Stop or press Space. Later chapters spin faster. Misses are free; the carousel simply turns again.',
  levels: ['A gentle first waltz', 'The band picks up', 'Midnight horses', 'A quicker little band', 'Six treasures spinning', 'The last lantern waltz'],
  sprites: rides,
  prizes: ['music-carousel', 'gyro-ghost', 'ticket-satchel', 'first-visit-badge', 'ride-explorer-pennant', 'aura-keepsake'],
  actions: [{id: 'stop', label: 'Stop · Space'}],
  create(level) {
    const list = rides.slice(0, swell(level, 4, 1, 6));
    const s = {
      level, t: 0, spin: 0, cool: 0, caught: 0, tries: 0, goal: swell(level, 3, 1, 8),
      rides: list, target: list[0], note: 'Wait for the matching ride to reach the lantern.',
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt) {
    s.t += dt; s.cool = Math.max(0, s.cool - dt);
    s.spin += swell(s.level, 0.7, 0.28, 1.72) * dt;
  },
  pointer(s, type) { if (type === 'down') catchRide(s); },
  action(s, id) { if (id === 'stop') catchRide(s); },
  key(s, k, down) { if (k === ' ' && down) catchRide(s); },
  draw(s, d) {
    const cx = 450, cy = 690, r = 168, n = s.rides.length;
    d.item(spriteKey(s.target), cx, 248, {w: 70, shadow: false, fallback: () => d.star(cx, 248, 22)});
    d.text('catch this', cx, 198, 15, '#5a3a40');
    d.glow(cx, cy - r * 0.78, 36, '#f4d590');
    for (let i = 0; i < n; i++) {
      const a = s.spin + i * TAU / n;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.78;
      const under = Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2))) < 0.22;
      if (under) d.glow(x, y, 44, '#ffe6a4');
      d.item(spriteKey(s.rides[i]), x, y, {
        w: under ? 68 : 52, alpha: s.rides[i] === s.target ? 1 : 0.9,
        fallback: () => d.circle(x, y, 20, '#cdb281', '#f8dfa7', 2),
      });
    }
    d.text(s.caught + ' / ' + s.goal, cx, 1088, 20, '#5a3a40');
  },
  readout: s => s.caught + ' / ' + s.goal + ' stops · ' + s.tries + ' tries · ' + s.note,
};
