import {clamp, done, TAU} from '../draw.js';
import {spriteKey} from '../prizes.js';

const rides = ['music-carousel', 'organ-music-box', 'pocket-wheel', 'swing-spinner', 'gyro-ghost', 'star-token'];

function catchRide(s) {
  if (s.cool > 0 || s.result) return;
  const n = s.rides.length, window = .22 - s.level * .03;
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
  levels: ['A gentle first waltz', 'The band picks up', 'Midnight horses'],
  sprites: rides,
  prizes: ['music-carousel', 'organ-music-box', 'pocket-wheel'],
  actions: [{id: 'stop', label: 'Stop · Space'}],
  create(level) {
    const list = rides.slice(0, 4 + level);
    return {
      level, t: 0, spin: 0, cool: 0, caught: 0, tries: 0, goal: 3 + level,
      rides: list, target: list[0], note: 'Wait for the matching ride to reach the lantern.',
    };
  },
  update(s, dt) {
    s.t += dt; s.cool = Math.max(0, s.cool - dt);
    s.spin += (0.7 + s.level * 0.28) * dt;
  },
  pointer(s, type) { if (type === 'down') catchRide(s); },
  action(s, id) { if (id === 'stop') catchRide(s); },
  key(s, k, down) { if (k === ' ' && down) catchRide(s); },
  draw(s, d) {
    const cx = 450, cy = 700, r = 210, n = s.rides.length;
    d.ellipse(cx, cy + 8, r + 36, r * .72 + 10, '#d7c4a433', '#e8d2a4', 3);
    d.item(spriteKey(s.target), cx, 390, {w: 72, fallback: () => d.star(cx, 390, 24)});
    d.text('catch this', cx, 330, 16, '#f3dfb2');
    d.glow(cx, cy - r * .62, 40, '#f4d590');
    d.poly([[cx - 14, cy - r * .62 - 28], [cx + 14, cy - r * .62 - 28], [cx, cy - r * .62 - 6]], '#e8c484', '#a78348', 2);
    for (let i = 0; i < n; i++) {
      const a = s.spin + i * TAU / n;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * .72;
      const under = Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2))) < .2;
      if (under) d.glow(x, y, 50, '#ffe6a4');
      d.item(spriteKey(s.rides[i]), x, y, {
        w: under ? 74 : 58, alpha: s.rides[i] === s.target ? 1 : .85,
        fallback: () => d.circle(x, y, 22, '#cdb281', '#f8dfa7', 2),
      });
    }
    d.item(spriteKey('music-carousel'), cx, cy, {w: 90, alpha: .35, shadow: false, fallback: () => {}});
    d.text(s.caught + ' / ' + s.goal, cx, 1040, 22);
  },
  readout: s => s.caught + ' / ' + s.goal + ' stops · ' + s.tries + ' tries · ' + s.note,
};
