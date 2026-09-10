import {clamp, done, TAU} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {swell} from '../chapter-kit.js';

function pump(s) {
  if (s.pumpDelay > 0) return;
  s.heat = clamp(s.heat + .17, 0, 1);
  s.pumpDelay = .35;
  s.note = s.heat > .8 ? 'Too hot — let the fire settle.' : 'The kettle is singing.';
}
function kernel(d, x, y, r, burnt = false, a = 0) {
  for (let i = 0; i < 4; i++) {
    const t = i * TAU / 4 + a;
    d.circle(x + Math.cos(t) * r * .45, y + Math.sin(t) * r * .45, r * .65, burnt ? '#6b5043' : '#f6e8bd', burnt ? '#9e7860' : '#dfc589', 1);
  }
  d.circle(x, y, r * .35, burnt ? '#42392e' : '#dfba6c');
}

export default {
  title: 'Popcorn Symphony',
  intro: 'Poppy’s tiny kettle has a very bouncy personality. Keep the fire comfortable, catch the good popcorn in a carton and let the burnt bits pass.',
  instructions: 'Move the carton with the pointer or Left/Right. Pump the bellows when the flame gets low; Space also pumps. Too much heat makes burnt kernels, which spoil two good pieces if caught. Fill the carton with golden popcorn. No countdown — take the pace you like.',
  levels: ['A small bag', 'The matinee crowd', 'The evening rush', 'The Saturday kettle', 'A midnight popping', 'The carnival feast'],
  sprites: ['popcorn-carton', 'tiny-kettle', 'sweet-heat'],
  prizes: ['popcorn-carton', 'tiny-kettle', 'sweet-heat'],
  actions: [{id: 'left', label: 'Basket left', hold: true}, {id: 'pump', label: 'Pump bellows · Space'}, {id: 'right', label: 'Basket right', hold: true}],
  create(level, rng) {
    return {level, rng, t: 0, x: 450, target: 450, heat: .48, pumpDelay: 0, popDelay: .4, kernels: [], caught: 0, missed: 0, goal: swell(level, 16, 6, 46), note: 'A gentle flame makes the best popcorn.'};
  },
  update(s, dt, input) {
    s.t += dt;
    s.heat = Math.max(0, s.heat - dt * .048);
    s.pumpDelay = Math.max(0, s.pumpDelay - dt);
    s.popDelay -= dt;
    const axis = (input.actions.has('right') || input.keys.has('ArrowRight') ? 1 : 0)
      - (input.actions.has('left') || input.keys.has('ArrowLeft') ? 1 : 0);
    if (axis) s.target = clamp(s.target + axis * 410 * dt, 245, 655);
    s.x += clamp(s.target - s.x, -440 * dt, 440 * dt);
    if (s.popDelay <= 0 && s.heat > .18 && s.kernels.length < 12) {
      const sign = s.rng() < .5 ? -1 : 1;
      s.kernels.push({x: 450, y: 555, vx: sign * (80 + s.rng() * 125), vy: -220 - s.rng() * 70, age: 0, burnt: s.heat > .82});
      s.popDelay = (1.45 - s.heat * .9) / (1 + s.level * .1);
    }
    for (const k of s.kernels) {
      const old = k.y;
      k.age += dt; k.vy += 285 * dt; k.x += k.vx * dt; k.y += k.vy * dt;
      if (k.x < 215) { k.x = 215; k.vx = Math.abs(k.vx) * .8; }
      if (k.x > 685) { k.x = 685; k.vx = -Math.abs(k.vx) * .8; }
      if (old < 1010 && k.y >= 1010 && k.vy > 0 && Math.abs(k.x - s.x) < 62) {
        k.remove = true;
        if (k.burnt) { s.caught = Math.max(0, s.caught - 2); s.note = 'A burnt bit! Let those fall.'; }
        else { s.caught++; s.note = 'A lovely catch.'; }
      } else if (k.y > 1120) { k.remove = true; s.missed++; }
    }
    s.kernels = s.kernels.filter(k => !k.remove);
    if (s.caught >= s.goal) done(s, 'A bag full of little golden moments', s.goal + ' good pieces caught. Poppy recommends sharing, but will not insist.');
  },
  pointer(s, type, p) { if (type === 'down' || type === 'move') s.target = clamp(p.x, 245, 655); },
  action(s, id) { if (id === 'pump') pump(s); },
  key(s, k, down) { if (k === ' ' && down) pump(s); },
  draw(s, d) {
    d.ellipse(450, 651, 88, 19, '#72573b88');
    for (let i = 0; i < 5; i++) {
      const x = 414 + i * 18, h = 12 + s.heat * 55 + Math.sin(s.t * 11 + i) * 8;
      d.poly([[x - 10, 650], [x - 3, 650 - h], [x + 13, 650]], s.heat > .8 ? '#b75d4c' : '#e7ad63', '#f7d48b', 1);
    }
    d.item(spriteKey('sweet-heat'), 450, 640, {
      w: 36 + s.heat * 18, alpha: .35 + s.heat * .5, shadow: false, fallback: () => {},
    });
    d.item(spriteKey('tiny-kettle'), 450, 560, {
      w: 96,
      fallback: () => {
        d.poly([[375, 545], [390, 625], [510, 625], [525, 545]], '#a67d50', '#ead1a0', 4);
        d.ellipse(450, 545, 75, 22, '#4d4436', '#e2c795', 5);
        d.ellipse(450, 530 - Math.abs(Math.sin(s.t * 9)) * s.heat * 10, 80, 12, '#b8935d', '#f0d49f', 3);
        d.ring(450, 510, 11, '#bda275', 4);
      },
    });
    for (const k of s.kernels) kernel(d, k.x, k.y, 13, k.burnt, k.age * 3);
    const x = s.x;
    d.item(spriteKey('popcorn-carton'), x, 1060, {
      w: 130,
      fallback: () => {
        d.poly([[x - 70, 1010], [x - 49, 1110], [x + 49, 1110], [x + 70, 1010]], '#ead5b1', '#ad8a5f', 3);
        for (let i = -2; i <= 2; i++) d.poly([[x + i * 25 - 9, 1012], [x + i * 18 - 7, 1108], [x + i * 18 + 7, 1108], [x + i * 25 + 9, 1012]], '#ae6456', null);
        d.ellipse(x, 1010, 70, 16, '#a58a62', '#f0d5a5', 3);
      },
    });
    for (let i = 0; i < Math.min(s.caught, 32); i++) kernel(d, x - 45 + (i % 6) * 18, 1010 - Math.floor(i / 6) * 12, 9, false, i);
    d.text(s.heat > .8 ? 'TOO HOT' : s.heat < .2 ? 'NEEDS A PUFF' : 'GENTLE FLAME', 450, 700, 16, s.heat > .8 ? '#a14f43' : '#785b3d');
  },
  readout: s => s.caught + ' / ' + s.goal + ' good popcorn · ' + s.note,
};
