import {clamp,done} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {alleyPlay, pocket, spend, credit} from '../wallet.js?v=paper-pennies-1';

const canal = [
  [270, 220], [630, 220], [720, 400], [735, 860],
  [640, 1035], [260, 1035], [175, 850], [170, 430], [250, 270],
];
const kinds = {
  everyday: {id: 'everyday-penny', r: 18, score: 1, w: 38, color: '#b68445'},
  moon: {id: 'moon-penny', r: 20, score: 3, w: 44, color: '#c48a4a'},
  rose: {id: 'rose-penny', r: 18, score: 3, w: 38, color: '#b56b62'},
  star: {id: 'star-token', r: 17, score: 3, w: 36, color: '#c9a45a'},
  crown: {id: 'crown-token', r: 19, score: 4, w: 40, color: '#9a4d4a'},
};
const mix = [
  ['everyday','everyday','everyday','moon'],
  ['moon','moon','everyday','star'],
  ['everyday','moon','rose','star','crown'],
  ['moon','rose','star','crown','everyday'],
  ['star','crown','rose','moon','crown'],
  ['crown','star','rose','moon','crown','star'],
];

function inside(x, y) {
  let hit = false;
  for (let i = 0, j = canal.length - 1; i < canal.length; j = i++) {
    const a = canal[i], b = canal[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
}
function closest(x, y, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return {x: a[0] + t * dx, y: a[1] + t * dy};
}
function mint(kind, x, y) {
  const k = kinds[kind];
  return {kind, x, y, vx: 0, vy: 0, r: k.r, score: k.score, w: k.w, id: k.id, color: k.color};
}
function drop(s) {
  if (s.cooldown > 0) return;
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny. Buy a roll at Aura’s ticket booth.';
      return;
    }
    s.started = true;
    s.dropped = (s.dropped || 0) + 1;
  } else {
    if (s.ammo <= 0) return;
    s.ammo--;
    if (s.ammo === 0) s.settle = 8;
  }
  s.cooldown = .45;
  const palette = mix[s.level];
  const kind = palette[(s.dropped || s.ammo) % palette.length];
  s.coins.push(mint(kind, s.aim, 250));
}

export default {
  title: 'Copper Falls',
  intro: 'A little mechanical tide of pressed pennies. Drop them at the lock, wait for the brass boom, and watch the canal carry a fortune to the docks.',
  instructions: alleyPlay
    ? 'Move the chute along the top lock, then drop a penny from your pocket. Arrows choose the chute; Space drops. Pennies that reach the docks go back into your pocket — specials are worth more. The machine sleeps until the first drop. Buy more pennies from Aura if the pocket runs dry.'
    : 'Move the chute along the top lock, then tap or press Drop. Arrows choose the chute; Space drops. The boom sweeps the water. Special pennies are worth more when they reach the lower docks. After the last penny the canal has a few seconds to settle. Workshop scores never enter your wallet.',
  levels: ['The copper tide', 'Moon mint', 'The crowded mint', 'A tide of crowns', 'The midnight mint', 'Pennies in a flood'],
  actions: [{id: 'drop', label: alleyPlay ? 'Drop a penny' : 'Drop practice penny'}],
  create(level, rng) {
    const field = [];
    const palette = mix[level];
    const pile = alleyPlay ? 10 + level * 3 : 22 + level * 5;
    for (let i = 0; i < pile; i++) {
      const x = 310 + rng() * 280, y = 655 + rng() * 270;
      if (inside(x, y)) field.push(mint(palette[i % palette.length], x, y));
    }
    const ammo = 12 + level * 3;
    return {
      level, t: 0, coins: field, aim: 450, ammo, total: ammo, score: 0, specials: 0,
      boom: 580, cooldown: 0, settle: 0, falling: [], dropped: 0, started: !alleyPlay,
      note: alleyPlay ? 'Drop a penny from your pocket to wake the mint.' : 'Drop a penny at the lock.',
    };
  },
  update(s, dt, input) {
    s.t += dt;
    s.cooldown = Math.max(0, s.cooldown - dt);
    if (alleyPlay && !s.started) {
      const axis = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
      s.aim = clamp(s.aim + axis * 230 * dt, 280, 620);
      return;
    }
    const axis = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    s.aim = clamp(s.aim + axis * 230 * dt, 280, 620);
    s.boom = 590 + Math.sin(s.t * 1.45) * (88 + s.level * 6);
    const piers = s.level ? [{x: 330, y: 640, r: 28 + s.level * 6}, {x: 575, y: 720, r: 24 + s.level * 5}] : [];
    for (let step = 0; step < 3; step++) {
      const h = dt / 3;
      for (const c of s.coins) {
        const oldX = c.x, oldY = c.y;
        c.x += c.vx * h; c.y += c.vy * h;
        c.vx *= Math.exp(-2.4 * h); c.vy *= Math.exp(-2.4 * h);
        if (c.y > s.boom + c.r + 6) c.vy += 18 * h;
        if (c.y < s.boom + c.r) {
          c.y = s.boom + c.r;
          c.vy = Math.max(c.vy, 96 * Math.max(0, Math.cos(s.t * 1.45)));
        }
        for (const p of piers) {
          const dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy), need = c.r + p.r;
          if (d < need && d > .001) {
            const nx = dx / d, ny = dy / d, overlap = need - d;
            c.x += nx * overlap; c.y += ny * overlap;
            const into = c.vx * nx + c.vy * ny;
            if (into < 0) { c.vx -= nx * into * 1.2; c.vy -= ny * into * 1.2; }
          }
        }
        for (let i = 0; i < canal.length; i++) {
          const a = canal[i], b = canal[(i + 1) % canal.length], p = closest(c.x, c.y, a, b);
          const dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy);
          if (d < c.r + 3 && d > .001) {
            const nx = dx / d, ny = dy / d, overlap = c.r + 3 - d;
            c.x += nx * overlap; c.y += ny * overlap;
            const into = c.vx * nx + c.vy * ny;
            if (into < 0) { c.vx -= nx * into * 1.15; c.vy -= ny * into * 1.15; }
          }
        }
        if (!inside(c.x, c.y)) { c.x = oldX; c.y = oldY; c.vx = 0; c.vy = 0; }
      }
      for (let pass = 0; pass < 2; pass++) for (let i = 0; i < s.coins.length; i++) for (let j = i + 1; j < s.coins.length; j++) {
        const a = s.coins[i], b = s.coins[j], dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy), need = a.r + b.r;
        if (dd >= need || dd < .001) continue;
        const nx = dx / dd, ny = dy / dd, overlap = need - dd;
        a.x -= nx * overlap * .5; a.y -= ny * overlap * .5;
        b.x += nx * overlap * .5; b.y += ny * overlap * .5;
        const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (relative < 0) {
          const impulse = -relative * .55;
          a.vx -= nx * impulse; a.vy -= ny * impulse;
          b.vx += nx * impulse; b.vy += ny * impulse;
        }
      }
    }
    s.coins = s.coins.filter(c => {
      if (c.y > 955) {
        s.score += c.score;
        if (c.kind !== 'everyday') s.specials++;
        if (alleyPlay) credit(c.score);
        s.falling.push({...c, vy: 80, t: 0});
        s.note = c.kind === 'everyday' ? 'A penny for the docks.' : 'A keepsake penny crossed the lip!';
        return false;
      }
      return true;
    });
    for (const c of s.falling) { c.t += dt; c.vy += 500 * dt; c.y += c.vy * dt; }
    s.falling = s.falling.filter(c => c.y < 1180);
    if (!alleyPlay && s.ammo === 0) {
      s.settle -= dt;
      if (s.settle <= 0) done(s, 'The mint has settled', s.score + ' from the docks' + (s.specials ? ', including ' + s.specials + ' special pennies' : '') + ', from ' + s.total + ' practice drops. A local workshop score, not wallet winnings.');
    }
  },
  pointer(s, type, p) { if (type === 'move' || type === 'down') s.aim = clamp(p.x, 280, 620); if (type === 'up') drop(s); },
  action(s, id) { if (id === 'drop') drop(s); },
  key(s, k, down) { if (k === ' ' && down) drop(s); },
  draw(s, d) {
    d.line({x: 220, y: s.boom}, {x: 680, y: s.boom}, '#8a6840', 10);
    d.line({x: 220, y: s.boom - 4}, {x: 680, y: s.boom - 4}, '#f0d18f', 3);
    if (s.level) {
      for (const p of [{x: 330, y: 640, r: 28 + s.level * 6}, {x: 575, y: 720, r: 24 + s.level * 5}]) {
        d.ellipse(p.x + 4, p.y + 6, p.r, p.r * .8, '#1b3a3640');
        d.ellipse(p.x, p.y, p.r, p.r * .78, '#c4a46a88', '#ead7a0', 2);
      }
    }
    for (const c of [...s.coins, ...s.falling]) {
      d.item(spriteKey(c.id), c.x, c.y, {w: c.w, fallback: () => d.ball(c.x, c.y, c.r, c.color)});
    }
    d.poly([[s.aim - 22, 188], [s.aim + 22, 188], [s.aim + 14, 242], [s.aim - 14, 242]], '#8a7450cc', '#ead097', 2);
    d.text('↓', s.aim, 228, 22, '#fff3d0');
  },
  readout: s => {
    if (alleyPlay) {
      const n = pocket();
      return (n == null ? '0' : n) + (n === 1 ? ' penny' : ' pennies') + ' in your pocket · ' + s.score + ' won at the docks' + (s.dropped ? ' · ' + s.dropped + ' dropped' : '') + ' · ' + s.note;
    }
    return s.ammo + ' / ' + s.total + ' drops left · ' + s.score + ' at the docks' + (s.ammo === 0 ? ' · settling ' + Math.max(0, Math.ceil(s.settle)) + 's' : '') + ' · ' + s.note;
  },
};
