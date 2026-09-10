import {clamp, segmentDistance, dist, done} from '../draw.js';
import {spriteKey} from '../prizes.js';

const start = {x: 450, y: 1050};

function topple(b, vx = 80) {
  if (b.fallen) return;
  b.fallen = true;
  b.vx = vx;
  b.vy = -80;
  b.w = (vx >= 0 ? 1 : -1) * (1.5 + Math.abs(vx) * .01);
}
function toss(s) {
  if (s.ball) return;
  const t = .75;
  s.ball = {...start, vx: (s.aim.x - 450) / t, vy: (s.aim.y - 1050 - 240 * t * t) / t};
  s.throws++;
}
function build(level) {
  const bottles = [];
  const towers = level === 0 ? [{x: 450, y: 810, n: 3}]
    : level === 1 ? [{x: 315, y: 830, n: 3}, {x: 610, y: 670, n: 2}]
    : [{x: 310, y: 830, n: 3}, {x: 600, y: 780, n: 3}];
  for (const tower of towers) {
    let below = [];
    for (let row = 0; row < tower.n; row++) {
      const ids = [];
      for (let i = 0; i < tower.n - row; i++) {
        const id = bottles.length;
        ids.push(id);
        bottles.push({
          x: tower.x + (i - (tower.n - row - 1) / 2) * 51,
          y: tower.y - row * 77,
          angle: 0, w: 0, vx: 0, vy: 0, fallen: false,
          support: row ? [below[i], below[i + 1]] : [],
        });
      }
      below = ids;
    }
  }
  return {bottles, towers};
}

export default {
  title: 'The Topsy Dairy',
  intro: 'Mabel insists these message bottles are perfectly sensible arrangements. Find the weak point and turn an impossible stack into a very satisfying little tumble.',
  instructions: 'Aim at the bottle tower and release to throw a mercury bead. Hit the supporting bottles to bring the upper ones down. Arrows aim and Space throws too. The dotted arc is your actual path. Each chapter has unlimited practice throws; try to clear it in fewer.',
  levels: ['The six-bottle pyramid', 'The high shelf', 'Two troublesome towers'],
  sprites: ['message-bottle', 'mercury-bead'],
  prizes: ['dairy-calf', 'lucky-dish', 'alley-collector-cup'],
  actions: [{id: 'throw', label: 'Throw mercury bead'}],
  create(level) {
    return {...build(level), level, aim: {x: 450, y: 770}, ball: null, throws: 0, t: 0, settle: 0};
  },
  update(s, dt, input) {
    s.t += dt;
    const dx = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    const dy = (input.keys.has('ArrowDown') ? 1 : 0) - (input.keys.has('ArrowUp') ? 1 : 0);
    s.aim.x = clamp(s.aim.x + dx * 220 * dt, 220, 680);
    s.aim.y = clamp(s.aim.y + dy * 220 * dt, 430, 900);
    for (const b of s.bottles) {
      if (!b.fallen && b.support.some(i => s.bottles[i].fallen)) topple(b, (b.x < 450 ? -1 : 1) * 45);
      if (b.fallen) {
        b.vy += 460 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.angle += b.w * dt;
        if (b.y > 1060) { b.y = 1060; b.vy = -Math.abs(b.vy) * .22; b.vx *= .8; b.w *= .85; }
        b.x = clamp(b.x, 185, 715);
      }
    }
    if (s.ball) {
      const p = s.ball, old = {x: p.x, y: p.y};
      p.vy += 480 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const hit = s.bottles.find(b => !b.fallen && segmentDistance({x: b.x, y: b.y - 36}, old, p) < 36);
      if (hit) { topple(hit, p.vx * .7 + (p.x < hit.x ? 95 : -95)); p.vx *= -.35; p.vy *= .2; }
      if (p.y > 1100 || p.y < 330 || p.x < 160 || p.x > 740) s.ball = null;
    }
    for (const a of s.bottles) if (a.fallen && Math.abs(a.vx) > 20)
      for (const b of s.bottles) if (!b.fallen && dist({x: a.x, y: a.y - 30}, {x: b.x, y: b.y - 30}) < 43)
        topple(b, a.vx * .65);
    if (s.bottles.every(b => b.fallen)) {
      s.settle += dt;
      if (s.settle > 1.3) done(s, 'Not a single sensible bottle left', s.bottles.length + ' bottles toppled in ' + s.throws + ' throws. Mabel calls that a clean sweep.');
    }
  },
  pointer(s, type, p) {
    if (type === 'move' || type === 'down') s.aim = {x: clamp(p.x, 220, 680), y: clamp(p.y, 430, 900)};
    if (type === 'up') toss(s);
  },
  action(s, id) { if (id === 'throw') toss(s); },
  key(s, k, down) { if (k === ' ' && down) toss(s); },
  draw(s, d) {
    for (const t of s.towers) {
      const w = t.n * 30 + 24;
      d.line({x: t.x - w, y: t.y + 7}, {x: t.x + w, y: t.y + 7}, '#9b7c57', 18);
      d.line({x: t.x - w, y: t.y}, {x: t.x + w, y: t.y}, '#e1c294', 5);
      for (const x of [t.x - w + 14, t.x + w - 14]) d.line({x, y: t.y + 12}, {x, y: 970}, '#9d8b69', 10);
    }
    for (const b of s.bottles) {
      d.item(spriteKey('message-bottle'), b.x, b.y - 32, {
        w: 48, angle: b.angle,
        fallback: () => d.bottle(b.x, b.y, 1, '#e5e5cc', b.angle),
      });
    }
    const bead = (x, y, w) => d.item(spriteKey('mercury-bead'), x, y, {
      w, fallback: () => d.ball(x, y, w * .45, '#b79768'),
    });
    if (s.ball) bead(s.ball.x, s.ball.y, 32);
    else {
      const t = .75, vx = (s.aim.x - 450) / t, vy = (s.aim.y - 1050 - 240 * t * t) / t;
      for (let i = 1; i <= 14; i++) {
        const u = t * i / 14;
        d.circle(450 + vx * u, 1050 + vy * u + 240 * u * u, 2.2, '#77674499');
      }
      bead(450, 1050, 40);
      d.ring(s.aim.x, s.aim.y, 17, '#a17955', 2);
    }
  },
  readout: s => s.bottles.filter(b => b.fallen).length + ' / ' + s.bottles.length + ' down · ' + s.throws + ' throws',
};
