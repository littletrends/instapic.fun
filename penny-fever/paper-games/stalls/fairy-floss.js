import {clamp, done, TAU} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep} from '../wallet.js?v=flossie-cloud-1';
import {pick, bindPrize, takePrize} from '../chapter-kit.js?v=prize-fly-1';

const DUMP_CAP = 12;
const STROKE = 1.25;
const BOOK = 'pennyFever.cloudAtelier';
const colors = ['#e2a0b4', '#a6c9ba', '#e8c589'];
const names = ['Rose', 'Mint', 'Honey'];
const radii = [145, 185, 110];
const sugars = ['fairy-floss', 'swirl-lolly', 'heart-biscuit'];
const SETS = [
  {prize: 'fairy-floss', recipe: [0, 1, 2], push: 0.076, tol: 26, cloud: 'a rose cloud'},
  {prize: 'pocket-cloud', recipe: [1, 0, 2], push: 0.066, tol: 24, cloud: 'a spun-sugar heart'},
  {prize: 'cloud-jar', recipe: [2, 0, 1], push: 0.056, tol: 22, cloud: 'a honey moon pillow'},
  {prize: 'toffee-apple', recipe: [0, 2, 1], push: 0.048, tol: 20, cloud: 'a rose-and-honey swirl'},
  {prize: 'swirl-lolly', recipe: [1, 2, 0], push: 0.040, tol: 18, cloud: 'a mint-and-honey coil'},
  {prize: 'birthday-crown-box', recipe: [2, 1, 0], push: 0.034, tol: 16, cloud: 'the tricolour pillow'},
];
const SPRITES = [
  'fairy-floss', 'swirl-lolly', 'pocket-cloud', 'heart-biscuit',
  'cloud-jar', 'toffee-apple', 'cocoa-cup', 'birthday-crown-box',
  'penny-purse', 'everyday-penny',
];

function puffXY(level, x, y) {
  return pick([
    [x, y],
    [x, y - Math.abs(x) * .3],
    [x * 1.2, y * .55],
    [x * .7, y * 1.2],
    [x * 1.15, y - Math.abs(x) * .22],
    [x * 1.3, y * .48],
  ], level);
}
function chapterPrize(s) {
  return (SETS[s.level] || SETS[0]).prize;
}
function readStore() {
  if (typeof localStorage === 'undefined') return {v: 1, bowls: {}};
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1 && blob.bowls) return blob;
  } catch { /* ignore */ }
  return {v: 1, bowls: {}};
}
function loadBowl(level) {
  const row = readStore().bowls[String(level)];
  return row && typeof row === 'object' ? row : null;
}
function snapshot(s) {
  return {
    v: 1,
    chapter: s.level || 0,
    t: s.t,
    r: s.r,
    angle: s.angle,
    layer: s.layer,
    color: s.color,
    turns: s.turns,
    heat: s.heat,
    dropped: s.dropped,
    recipe: s.recipe.slice(),
    paid: (s.paid || []).slice(),
    puffs: (s.puffs || []).slice(0, 90).map(p => ({
      x: +p.x.toFixed(1), y: +p.y.toFixed(1), r: p.r, layer: p.layer, color: p.color,
    })),
    prize: s.prize && !s.prize.falling ? {id: s.prize.id, depth: +s.prize.depth.toFixed(3)} : null,
    started: !!s.started,
  };
}
function persist(s) {
  if (!s || !alleyPlay) return;
  try {
    const store = readStore();
    store.bowls[String(s.level || 0)] = snapshot(s);
    localStorage.setItem(BOOK, JSON.stringify(store));
  } catch { /* quota */ }
  s.dirty = false;
  s.saveAt = s.t;
}
function plantPrize(s) {
  const id = chapterPrize(s);
  if (!id || (s.paid || []).includes(id)) { s.prize = null; return; }
  s.prize = {id, x: 450, y: 508, depth: 0.06, falling: false, vx: 0, vy: 0};
}
function seatPrize(s) {
  const p = s.prize;
  if (!p || p.falling) return;
  const d = p.depth;
  p.x = 450 + Math.sin((s.t || 0) * 0.9) * (8 + d * 16);
  p.y = 498 + d * 338;
}
function growPuffs(s) {
  const count = Math.min(90, Math.floor(s.turns * 38) + s.layer * 28);
  while (s.puffs.filter(p => p.layer === Math.min(s.layer, 2)).length < count) {
    const i = s.puffs.length, a = i * 2.39996, rr = 15 + Math.sqrt((i % 75) / 75) * 115;
    const [x, y] = puffXY(s.level, Math.cos(a) * rr, Math.sin(a) * rr * .7);
    s.puffs.push({x, y, r: 16 + (i % 4) * 3, layer: Math.min(s.layer, 2), color: colors[s.color]});
  }
}
function startStroke(s) {
  s.stroke = 0.001;
  s.started = true;
}
function payPenny(s) {
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny. Cash a booth ticket for a five-penny stack.';
      return false;
    }
    s.started = true;
    s.dropped = (s.dropped || 0) + 1;
    return true;
  }
  if (s.ammo <= 0) {
    s.note = 'Practice sugar is spent.';
    return false;
  }
  s.ammo--;
  s.dropped = (s.dropped || 0) + 1;
  return true;
}
function feed(s) {
  if (s.won || s.lost || s.prize?.falling) return;
  if (s.cooldown > 0) return;
  if (!payPenny(s)) return;
  if (s.stroke > 0) s.queue++;
  else startStroke(s);
  s.cooldown = 0.28;
  s.dirty = true;
  s.note = alleyPlay ? 'A penny into the weather.' : 'Practice penny into the spinner.';
}
function dump(s) {
  if (s.won || s.lost || s.prize?.falling) return;
  if (s.cooldown > 0 && s.queue > 0) return;
  const have = alleyPlay ? (pocket() || 0) : s.ammo;
  const take = Math.min(DUMP_CAP, Math.max(0, have | 0));
  if (take < 1) {
    s.note = alleyPlay
      ? 'The purse is empty. Cash a ticket for a five-penny stack.'
      : 'No practice pennies left.';
    return;
  }
  if (alleyPlay) {
    if (!spend(take)) {
      s.note = 'Need pennies in the pocket.';
      return;
    }
    s.started = true;
  } else {
    s.ammo -= take;
  }
  s.dropped = (s.dropped || 0) + take;
  s.queue += take;
  s.cooldown = 0.08;
  if (s.stroke <= 0) { startStroke(s); s.queue--; }
  s.dirty = true;
  s.note = take === 1 ? 'One penny into the weather.' : take + ' pennies wake the spinner.';
}
function claim(s) {
  if (s.won || s.lost) return;
  s.won = true;
  const prize = chapterPrize(s);
  if (prize && !s.paid.includes(prize)) s.paid.push(prize);
  if (alleyPlay && prize) keep(prize, 'fairy-floss');
  takePrize(s, prize);
  persist(s);
  const name = itemName(prize);
  const cloud = (SETS[s.level] || SETS[0]).cloud;
  done(s, 'A cloud worth keeping',
    name + ' shoved off the lip — Flossie is calling this one ' + cloud + '.',
    {prize, won: true});
}
function fizzle(s) {
  if (s.won || s.lost) return;
  s.lost = true;
  done(s, 'The spinner went quiet',
    'Practice sugar is spent. ' + itemName(chapterPrize(s)) + ' stayed nestled in the cloud.',
    {won: false});
}
function wind(s, delta, r, speed) {
  s.angle += delta;
  s.r = r;
  if (s.won || s.lost) return;
  if (!(s.stroke > 0 && s.stroke < 1)) {
    if (Math.abs(delta) > 0.05) s.note = 'Feed the spinner a penny to wake the weather.';
    return;
  }
  if (Math.abs(delta) > 0.4) return;
  const set = SETS[s.level] || SETS[0];
  const layer = Math.min(s.layer, 2);
  const desired = s.recipe[layer];
  if (s.color !== desired) {
    s.note = 'Choose ' + names[desired] + ' sugar for this weather.';
    return;
  }
  if (Math.abs(r - radii[layer]) > set.tol) {
    s.note = 'Follow the glowing circle — this layer wants a different radius.';
    return;
  }
  if (speed > 4.5) {
    s.heat = clamp(s.heat + .1, 0, 1);
    s.note = 'Too fast: the sugar thread is stretching. Slow down.';
    return;
  }
  if (speed < .25) return;
  if (s.heat > .8) {
    s.note = 'Let the bowl cool for a moment.';
    return;
  }
  s.turns += Math.abs(delta) / TAU;
  s.heat = clamp(s.heat + Math.abs(delta) * .008, 0, 1);
  const quality = speed > 3.2 ? 0.55 : 1;
  if (s.prize && !s.prize.falling) {
    s.prize.depth = clamp(s.prize.depth + Math.abs(delta) * set.push * quality, 0, 1.2);
  }
  s.note = 'A lovely even thread — the cloud shoves.';
  growPuffs(s);
  if (s.layer < 3 && s.turns >= 2) {
    s.layer++;
    s.turns = 0;
    s.heat = Math.max(0, s.heat - .1);
    if (s.prize && !s.prize.falling) s.prize.depth = clamp(s.prize.depth + 0.07, 0, 1.2);
    if (s.layer === 3) s.note = 'Three layers wound. Keep feeding — shove the prize to the lip.';
    else s.note = 'Next weather: ' + names[s.recipe[s.layer]] + '.';
  }
  s.dirty = true;
}
function fresh(level) {
  const set = SETS[level] || SETS[0];
  const ammo = alleyPlay ? 0 : 10 + level * 2;
  const s = {
    level, t: 0, recipe: set.recipe.slice(),
    layer: 0, color: 0, turns: 0, r: 145, angle: 0, lastAngle: null, lastTime: 0,
    heat: 0, puffs: [], prize: null, paid: [],
    ammo, total: ammo, dropped: 0, queue: 0, cooldown: 0, stroke: 0, settle: 0,
    started: !alleyPlay, dirty: !!alleyPlay, saveAt: 0, won: false, lost: false, fly: [],
    note: alleyPlay
      ? 'The unique is nestled in the cloud. Feed a penny, then wind it toward the lip.'
      : 'Practice sugar. Feed a penny, wind the weather, shove the unique to the lip.',
  };
  plantPrize(s);
  return s;
}
function hydrate(blob, level) {
  const set = SETS[level] || SETS[0];
  const s = {
    level, t: blob.t || 0,
    recipe: Array.isArray(blob.recipe) && blob.recipe.length === 3 ? blob.recipe.slice() : set.recipe.slice(),
    layer: blob.layer || 0, color: blob.color || 0, turns: blob.turns || 0,
    r: blob.r || 145, angle: blob.angle || 0, lastAngle: null, lastTime: 0,
    heat: blob.heat || 0, puffs: Array.isArray(blob.puffs) ? blob.puffs.map(p => ({...p})) : [],
    prize: null, paid: Array.isArray(blob.paid) ? blob.paid.slice() : [],
    ammo: 0, total: 0, dropped: blob.dropped || 0, queue: 0, cooldown: 0, stroke: 0, settle: 0,
    started: !!blob.started, dirty: false, saveAt: 0, won: false, lost: false, fly: [],
    note: 'The cloud waited. Feed a penny to wake the weather.',
  };
  if (blob.prize && blob.prize.id && !s.paid.includes(blob.prize.id)) {
    s.prize = {id: blob.prize.id, x: 450, y: 508, depth: blob.prize.depth || 0.06, falling: false, vx: 0, vy: 0};
  } else plantPrize(s);
  return s;
}

export default {
  title: 'Cloud Atelier',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  tableDetail: alleyPlay
    ? 'This confection keeps. Feed pennies into Flossie’s spinner, wind the coloured weather, and shove the unique off the lip into the cone. Walk away — the cloud waits.'
    : 'Practice the weather. Feed a penny, wind the cloud, shove the unique to the lip.',
  intro: alleyPlay
    ? 'Flossie does not just spin sugar. She sculpts the weather. Six confections, each with a unique nestled in the living cloud. Feed the spinner a penny, then wind — the tide shoves. Walk away and that cloud waits.'
    : 'Wind three coloured weathers into a cloud and shove the unique to the lip. Workshop sugar never enters the pocket.',
  instructions: alleyPlay
    ? 'Feed a penny to wake the spinner (Space). Hold Wind, or circle the stick, following the glowing ring in the requested sugar colour. A gentle pace shoves the unique toward the lip; too fast stretches the thread. A handful dumps the purse. Cash a booth ticket for a five-penny stack if the purse is empty.'
    : 'Feed a practice penny, then wind. Right colour, right radius, steady pace. Space feeds, then winds while held. Enter dumps the rest.',
  levels: ['A rose cloud', 'A spun-sugar heart', 'A honey moon pillow', 'A rose-and-honey swirl', 'A mint-and-honey coil', 'The tricolour pillow'],
  sprites: SPRITES,
  prizes: SETS.map(set => set.prize),
  actions: [
    {id: '0', label: 'Rose sugar'},
    {id: '1', label: 'Mint sugar'},
    {id: '2', label: 'Honey sugar'},
    {id: 'inner', label: 'Inner radius'},
    {id: 'stir', label: 'Wind the cloud', hold: true},
    {id: 'outer', label: 'Outer radius'},
    {id: 'feed', label: alleyPlay ? 'Feed a penny' : 'Feed practice penny'},
    {id: 'dump', label: alleyPlay ? 'A handful of pennies' : 'Dump the rest'},
  ],
  persist,
  create(level) {
    if (alleyPlay) {
      const saved = loadBowl(level);
      if (saved && Array.isArray(saved.puffs)) return hydrate(saved, level);
    }
    const s = fresh(level);
    persist(s);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    s.heat = Math.max(0, s.heat - dt * .025);
    s.cooldown = Math.max(0, s.cooldown - dt);
    if (input.keys.has('ArrowUp')) s.r = clamp(s.r + 70 * dt, 90, 210);
    if (input.keys.has('ArrowDown')) s.r = clamp(s.r - 70 * dt, 90, 210);
    if (s.won || s.lost) {
      seatPrize(s);
      return;
    }
    if (s.queue > 0 && s.stroke <= 0 && s.cooldown <= 0 && !s.prize?.falling) {
      startStroke(s);
      s.queue--;
      s.cooldown = 0.08;
    }
    if (alleyPlay && !s.started) {
      seatPrize(s);
      if (s.dirty && s.t - s.saveAt > 1.2) persist(s);
      return;
    }
    if (s.stroke > 0) {
      s.stroke += dt / STROKE;
      if (s.prize && !s.prize.falling) {
        s.prize.depth = clamp(s.prize.depth + dt * 0.012, 0, 1.2);
      }
      if (s.stroke >= 1) s.stroke = 0;
    }
    if (s.stroke > 0 && (input.actions.has('stir') || input.keys.has(' '))) {
      wind(s, dt * 1.6, s.r, 1.6);
    }
    if (s.prize && !s.prize.falling && s.prize.depth >= 1) {
      s.prize.falling = true;
      s.prize.vy = 80;
      s.note = itemName(s.prize.id) + ' tipped the lip!';
      s.dirty = true;
    }
    if (s.prize?.falling) {
      s.prize.vy += 520 * dt;
      s.prize.y += s.prize.vy * dt;
      s.fly = s.fly || [];
      if (s.prize.y > 1040) claim(s);
    }
    seatPrize(s);
    if (!alleyPlay && s.ammo <= 0 && s.queue <= 0 && s.stroke <= 0 && !s.prize?.falling) {
      s.settle += dt;
      if (s.settle > 1.4) fizzle(s);
    } else s.settle = 0;
    if (s.dirty && s.t - s.saveAt > 1.4) persist(s);
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
    if (id === 'feed') feed(s);
    if (id === 'dump') dump(s);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ' && !(s.stroke > 0)) feed(s);
    if (k === 'Enter' || k === 'd' || k === 'D') dump(s);
    if (k === '1' || k === '2' || k === '3') s.color = Number(k) - 1;
  },
  draw(s, d) {
    d.line({x: 450, y: 650}, {x: 450, y: 750}, '#cfb386', 12);
    if (s.puffs.length) {
      d.item(spriteKey(s.layer >= 3 ? 'pocket-cloud' : 'fairy-floss'), 450, 535, {
        w: 90 + s.puffs.length * .4, alpha: .55, shadow: false, fallback: () => {},
      });
    }
    for (const p of s.puffs) {
      d.ellipse(450 + p.x + 3, 535 + p.y + 5, p.r, p.r * .8, '#b47f8e33');
      d.ellipse(450 + p.x, 535 + p.y, p.r, p.r * .8, p.color, '#f1d6ca55', 1);
      d.arc(447 + p.x, 532 + p.y, p.r * .6, 3.4, 5.4, '#ffe9d588', 1);
    }
    if (!s.puffs.length) {
      d.ellipse(450, 530, 125, 83, null, '#d2a49b77', 2);
      d.text('The cloud grows here', 450, 535, 20, '#9c6b77');
    }
    const prize = s.prize;
    if (prize && !prize.falling) {
      d.glow(prize.x, prize.y, 36, '#f3d7a0');
      d.item(spriteKey(prize.id), prize.x, prize.y, {
        w: 42 + prize.depth * 16,
        fallback: () => d.ball(prize.x, prize.y, 16, '#c4a46a'),
      });
    }
    d.ellipse(450, 885, 225, 115, '#ae8591', '#e6c79d', 5);
    d.ellipse(450, 860, 225, 110, '#766070', '#e9d0ab', 7);
    const ring = radii[Math.min(s.layer, 2)];
    const live = s.stroke > 0 && s.stroke < 1;
    d.ellipse(450, 860, ring, ring * .6, null, live ? '#f8dfb4' : '#e2c49a88', live ? 4 : 3);
    d.ellipse(450, 860, 45, 24, s.heat > .8 ? '#c76a73' : '#cfb492', '#ead3ae', 3);
    if (live) {
      const spin = s.t * 10;
      for (let i = 0; i < 6; i++) {
        const a = spin + i * TAU / 6;
        d.line(
          {x: 450 + Math.cos(a) * 18, y: 860 + Math.sin(a) * 10},
          {x: 450 + Math.cos(a) * 40, y: 860 + Math.sin(a) * 22},
          colors[s.color] + '99', 2);
      }
    }
    d.poly([[392, 1008], [450, 1108], [508, 1008]], '#d9c29a', '#f0d9b0', 2);
    d.text('cone', 450, 1124, 13, '#ead6a4');
    if (prize?.falling) {
      d.item(spriteKey(prize.id), prize.x, prize.y, {
        w: 48, fallback: () => d.ball(prize.x, prize.y, 16, '#c4a46a'),
      });
    }
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
      d.item(spriteKey(sugars[s.recipe[i]]), x, 1164, {
        w: i < s.layer ? 52 : 44, alpha: i === s.color ? 1 : .7,
        fallback: () => { d.circle(x, 1164, 24, colors[s.recipe[i]], i < s.layer ? '#fff4c8' : '#ba9785', 3); },
      });
      if (i < s.layer) d.text('✓', x, 1170, 20, '#725b60');
    }
    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    const hx = 132, hy = 148;
    d.item(spriteKey('penny-purse'), hx, hy, {w: 132, fallback: () => d.heart(hx, hy, 40, '#6a7a52')});
    const heap = Math.min(Math.max(0, n), 28);
    for (let i = 0; i < heap; i++) {
      const row = Math.floor(i / 7), col = i % 7;
      const x = hx - 44 + col * 14 + row * 3;
      const y = hy + 6 - row * 9 - (col % 2) * 2;
      d.item(spriteKey('everyday-penny'), x, y, {w: 22, shadow: false, fallback: () => d.ball(x, y, 8, '#b68445')});
    }
    d.text(String(n), hx, hy + 72, 22, '#fff6d8');
    d.text(n === 1 ? 'penny in the purse' : 'pennies in the purse', hx, hy + 92, 13, '#ead6a4');
    d.poly([[742, 48], [838, 52], [834, 128], [738, 122]], '#6b3a3a', '#e8d4a0', 2);
    d.text('treasures', 788, 144, 13, '#ead6a4');
    const want = chapterPrize(s);
    if (want) d.item(spriteKey(want), 788, 90, {w: 44, fallback: () => d.ball(788, 90, 14, '#c4a46a')});
    if (alleyPlay && !s.started) d.text('spinner still', 450, 72, 18, '#f0d6a8');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : s.ammo;
    const layer = Math.min(s.layer + 1, 3);
    const sugar = names[s.recipe[Math.min(s.layer, 2)]];
    const depth = s.prize ? Math.round(Math.min(1, s.prize.depth) * 100) : 100;
    const purse = alleyPlay
      ? ((n == null ? 0 : n) + (n === 1 ? ' penny' : ' pennies') + ' in the purse')
      : (n + ' / ' + s.total + ' practice pennies');
    return purse + ' · layer ' + layer + '/3 ' + sugar + ' · lip ' + depth + '%'
      + (s.queue ? ' · handful ' + s.queue : '') + ' · ' + s.note;
  },
};
