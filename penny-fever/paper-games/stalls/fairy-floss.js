import {clamp, done, TAU} from '../draw.js';
import {spriteKey} from '../prizes.js';

const colors = ['#e2a0b4', '#a6c9ba', '#e8c589'];
const names = ['Rose', 'Mint', 'Honey'];
const radii = [145, 185, 110];
const sugars = ['fairy-floss', 'swirl-lolly', 'heart-biscuit'];

function wind(s, delta, r, speed) {
  s.angle += delta; s.r = r;
  if (Math.abs(delta) > .4) return;
  const desired = s.recipe[s.layer];
  if (s.color !== desired) { s.note = 'Choose ' + names[desired] + ' sugar for this layer.'; return; }
  if (Math.abs(r - radii[s.layer]) > 25) { s.note = 'Follow the glowing circle — this layer needs a different radius.'; return; }
  if (speed > 4.5) { s.heat = clamp(s.heat + .1, 0, 1); s.note = 'Too fast: the sugar thread is stretching. Slow down.'; return; }
  if (speed < .25) return;
  if (s.heat > .8) { s.note = 'Let the bowl cool for a moment.'; return; }
  s.turns += Math.abs(delta) / TAU;
  s.heat = clamp(s.heat + Math.abs(delta) * .008, 0, 1);
  s.note = 'A lovely even thread.';
  const count = Math.min(75, Math.floor(s.turns * 38));
  while (s.puffs.filter(p => p.layer === s.layer).length < count) {
    const i = s.puffs.length, a = i * 2.39996, rr = 15 + Math.sqrt((i % 75) / 75) * 115;
    let x = Math.cos(a) * rr, y = Math.sin(a) * rr * .7;
    if (s.level === 1) y -= Math.abs(x) * .3;
    if (s.level === 2) { x *= 1.2; y *= .55; }
    s.puffs.push({x, y, r: 16 + (i % 4) * 3, layer: s.layer, color: colors[s.color]});
  }
  if (s.turns >= 2) {
    s.layer++; s.turns = 0; s.heat = Math.max(0, s.heat - .1);
    if (s.layer === 3) done(s, 'A cloud worth keeping', 'Three carefully wound layers. Flossie is calling this one ' + ['a cloud', 'a little heart', 'a moon pillow'][s.level] + '.');
    else s.note = 'Next layer: ' + names[s.recipe[s.layer]] + '.';
  }
}

export default {
  title: 'Cloud Atelier',
  intro: 'Flossie does not just spin sugar. She sculpts the weather. Wind three coloured layers into a little cloud you can almost feel, then keep it as fairy floss.',
  instructions: 'Hold and circle the stick around the bowl, following the glowing ring. Use the requested sugar colour. Keep a gentle steady pace; stop to cool when needed. For keyboard/buttons, hold Stir and use Up/Down or Inner/Outer to change radius. Each layer needs two smooth turns.',
  levels: ['A rose cloud', 'A spun-sugar heart', 'A honey moon pillow'],
  sprites: ['fairy-floss', 'swirl-lolly', 'pocket-cloud', 'heart-biscuit'],
  prizes: ['fairy-floss', 'pocket-cloud', 'cloud-jar'],
  actions: [
    {id: '0', label: 'Rose sugar'}, {id: '1', label: 'Mint sugar'}, {id: '2', label: 'Honey sugar'},
    {id: 'inner', label: 'Inner radius'}, {id: 'stir', label: 'Stir gently', hold: true}, {id: 'outer', label: 'Outer radius'},
  ],
  create(level) {
    return {
      level, t: 0, recipe: level === 0 ? [0, 1, 2] : level === 1 ? [1, 0, 2] : [2, 0, 1],
      layer: 0, color: 0, turns: 0, r: 145, angle: 0, lastAngle: null, lastTime: 0, heat: 0, puffs: [],
      note: 'Choose the first sugar colour.',
    };
  },
  update(s, dt, input) {
    s.t += dt; s.heat = Math.max(0, s.heat - dt * .025);
    if (input.keys.has('ArrowUp')) s.r = clamp(s.r + 70 * dt, 90, 210);
    if (input.keys.has('ArrowDown')) s.r = clamp(s.r - 70 * dt, 90, 210);
    if (input.actions.has('stir') || input.keys.has(' ')) wind(s, dt * 1.6, s.r, 1.6);
  },
  pointer(s, type, p) {
    const x = p.x - 450, y = (p.y - 860) / .6, a = Math.atan2(y, x), r = Math.hypot(x, y);
    if (type === 'down') { s.lastAngle = a; s.lastTime = s.t; }
    if (type === 'move' && s.lastAngle !== null) {
      let delta = a - s.lastAngle;
      if (delta > Math.PI) delta -= TAU;
      if (delta < -Math.PI) delta += TAU;
      const dt = Math.max(.016, s.t - s.lastTime);
      wind(s, delta, clamp(r, 70, 230), Math.abs(delta) / dt);
      s.lastAngle = a; s.lastTime = s.t;
    }
    if (type === 'up' || type === 'cancel') s.lastAngle = null;
  },
  action(s, id) {
    if (['0', '1', '2'].includes(id)) s.color = Number(id);
    if (id === 'inner') s.r = clamp(s.r - 10, 90, 210);
    if (id === 'outer') s.r = clamp(s.r + 10, 90, 210);
  },
  draw(s, d) {
    d.line({x: 450, y: 650}, {x: 450, y: 750}, '#cfb386', 12);
    if (s.puffs.length) {
      d.item(spriteKey(s.layer === 3 ? 'pocket-cloud' : 'fairy-floss'), 450, 535, {
        w: 90 + s.puffs.length * .4, alpha: .55, shadow: false,
        fallback: () => {},
      });
    }
    for (const p of s.puffs) {
      d.ellipse(450 + p.x + 3, 535 + p.y + 5, p.r, p.r * .8, '#b47f8e33');
      d.ellipse(450 + p.x, 535 + p.y, p.r, p.r * .8, p.color, '#f1d6ca55', 1);
      d.arc(447 + p.x, 532 + p.y, p.r * .6, 3.4, 5.4, '#ffe9d588', 1);
    }
    if (!s.puffs.length) {
      d.ellipse(450, 530, 125, 83, null, '#d2a49b77', 2);
      d.text('Your cloud grows here', 450, 535, 20, '#9c6b77');
    }
    d.ellipse(450, 885, 225, 115, '#ae8591', '#e6c79d', 5);
    d.ellipse(450, 860, 225, 110, '#766070', '#e9d0ab', 7);
    d.ellipse(450, 860, radii[Math.min(s.layer, 2)], radii[Math.min(s.layer, 2)] * .6, null, '#f8dfb4', 3);
    d.ellipse(450, 860, 45, 24, s.heat > .8 ? '#c76a73' : '#cfb492', '#ead3ae', 3);
    const px = 450 + Math.cos(s.angle) * s.r, py = 860 + Math.sin(s.angle) * s.r * .6;
    for (let i = 0; i < 8; i++) {
      const a = s.t * 4 + i * .4;
      d.line({x: 450 + Math.cos(a) * 35, y: 860 + Math.sin(a) * 20}, {x: px, y: py}, colors[s.color] + '55', 1);
    }
    d.item(spriteKey('swirl-lolly'), px, py - 18, {
      w: 46, angle: s.angle,
      fallback: () => { d.line({x: px, y: py}, {x: px + 18, y: py - 80}, '#e7cfad', 9); d.ellipse(px, py, 10, 6, colors[s.color]); },
    });
    for (let i = 0; i < 3; i++) {
      const x = 365 + i * 85;
      d.item(spriteKey(sugars[s.recipe[i]]), x, 1090, {
        w: i < s.layer ? 52 : 44, alpha: i === s.color ? 1 : .7,
        fallback: () => { d.circle(x, 1090, 24, colors[s.recipe[i]], i < s.layer ? '#fff4c8' : '#ba9785', 3); },
      });
      if (i < s.layer) d.text('✓', x, 1097, 20, '#725b60');
    }
  },
  readout: s => 'Layer ' + Math.min(s.layer + 1, 3) + ' / 3 · ' + names[s.recipe[Math.min(s.layer, 2)]] + ' · ' + s.turns.toFixed(1) + ' / 2 turns · ' + s.note,
};
