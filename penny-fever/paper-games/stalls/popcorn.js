import {clamp, done, TAU} from '../draw.js?v=ink-1';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, owned} from '../wallet.js?v=poppy-symphony-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const DUMP_CAP = 8;
const BOOK = 'pennyFever.poppyKettle';
const SETS = [
  {prize: 'popcorn-carton', bury: 3, heatMin: 0.26, heatMax: 0.84, wild: 90, name: 'A small bag'},
  {prize: 'tiny-kettle', bury: 4, heatMin: 0.32, heatMax: 0.78, wild: 120, name: 'The matinee crowd'},
  {prize: 'sweet-heat', bury: 5, heatMin: 0.36, heatMax: 0.74, wild: 150, name: 'The evening rush'},
  {prize: 'kettle-corn-bag', bury: 6, heatMin: 0.40, heatMax: 0.70, wild: 180, name: 'The Saturday kettle'},
  {prize: 'lemon-fizz', bury: 7, heatMin: 0.44, heatMax: 0.68, wild: 210, name: 'A midnight popping'},
  {prize: 'butter-kernel', bury: 8, heatMin: 0.48, heatMax: 0.66, wild: 240, name: 'The carnival feast'},
];
const SPRITES = [
  'popcorn-carton', 'tiny-kettle', 'sweet-heat', 'picnic-parcel', 'lemon-fizz',
  'toffee-apple', 'penny-purse', 'everyday-penny',
];

function setOf(level) {
  return SETS[level] || SETS[0];
}
function kernel(d, x, y, r, burnt = false, a = 0) {
  for (let i = 0; i < 4; i++) {
    const t = i * TAU / 4 + a;
    d.circle(x + Math.cos(t) * r * .45, y + Math.sin(t) * r * .45, r * .65, burnt ? '#6b5043' : '#f6e8bd', burnt ? '#9e7860' : '#dfc589', 1);
  }
  d.circle(x, y, r * .35, burnt ? '#42392e' : '#dfba6c');
}
function readStore() {
  if (typeof localStorage === 'undefined') return {v: 1, tables: {}};
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1 && blob.tables) return blob;
  } catch { /* ignore */ }
  return {v: 1, tables: {}};
}
function loadTable(level) {
  const row = readStore().tables[String(level)];
  return row && row.v === 1 ? row : null;
}
function snapshot(s) {
  const set = setOf(s.level);
  return {
    v: 1,
    heat: s.won ? 0.48 : +s.heat.toFixed(3),
    bury: s.won ? set.bury : +Math.max(0, s.bury).toFixed(2),
    heap: s.won ? 16 + s.level * 3 : s.heap | 0,
    caught: s.won ? 0 : s.caught | 0,
    dropped: s.dropped | 0,
    paid: (s.paid || []).slice(),
    aim: +s.x.toFixed(1),
  };
}
function persist(s) {
  if (!s || typeof localStorage === 'undefined') return;
  try {
    const store = readStore();
    store.tables[String(s.level || 0)] = snapshot(s);
    localStorage.setItem(BOOK, JSON.stringify(store));
  } catch { /* quota */ }
  s.dirty = false;
  s.saveAt = s.t;
}
function markDirty(s) {
  s.dirty = true;
}
function pump(s) {
  if (s.won || s.pumpDelay > 0) return;
  s.heat = clamp(s.heat + 0.17, 0, 1);
  s.pumpDelay = 0.35;
  markDirty(s);
  s.note = s.heat > setOf(s.level).heatMax
    ? 'Too hot — let the fire settle or the next pop will scorch.'
    : s.heat < setOf(s.level).heatMin
      ? 'A shy puff. The kettle wants a kinder flame before a penny.'
      : 'The kettle is singing. Feed a penny while she is kind.';
}
function spawnKernels(s, n, burnt) {
  const set = setOf(s.level);
  for (let i = 0; i < n && s.kernels.length < 16; i++) {
    const sign = (s.rng() < 0.5 ? -1 : 1);
    const spread = 70 + set.wild * 0.25;
    s.kernels.push({
      x: 450, y: 548,
      vx: sign * (55 + s.rng() * spread),
      vy: -210 - s.rng() * 80,
      age: 0, burnt: !!burnt,
    });
  }
}
function launchPrize(s) {
  if (s.prizeAir || s.won) return;
  const set = setOf(s.level);
  const sign = s.rng() < 0.5 ? -1 : 1;
  s.prizeAir = {
    id: set.prize,
    x: 450,
    y: 530,
    vx: sign * (40 + s.rng() * set.wild),
    vy: -260 - s.rng() * 40,
  };
  s.note = itemName(set.prize) + ' popped free of the tide — catch it in the carton!';
}
function missPrize(s) {
  const set = setOf(s.level);
  s.prizeAir = null;
  s.bury = Math.max(1.2, set.bury * 0.4);
  markDirty(s);
  s.note = 'It kissed the boards. Poppy scooped ' + itemName(set.prize) + ' back into the kettle.';
}
function claimPrize(s) {
  if (s.won) return;
  const set = setOf(s.level);
  const prize = set.prize;
  s.won = true;
  s.prizeAir = null;
  s.settle = 0;
  if (!s.paid.includes(prize)) s.paid.push(prize);
  if (alleyPlay) keep(prize, 'popcorn');
  takePrize(s, prize);
  s.fly.push({id: prize, x: s.x, y: 1010, t: 0, dur: 0.72});
  markDirty(s);
  persist(s);
  s.note = itemName(prize) + ' — into the treasure book!';
}
function burst(s) {
  const set = setOf(s.level);
  const heat = s.heat;
  s.heat = clamp(s.heat + 0.045, 0, 1);
  let kind = 'sweet';
  if (heat < set.heatMin) kind = 'cold';
  else if (heat > set.heatMax) kind = 'hot';
  if (kind === 'sweet') {
    s.bury = Math.max(0, s.bury - 1);
    s.heap = clamp((s.heap | 0) + 1, 8, 40);
    spawnKernels(s, 3 + Math.min(3, s.level), false);
    s.note = s.bury <= 0
      ? 'The tide lifted — the keepsake is coming!'
      : 'A golden shove. The prize sits ' + Math.ceil(s.bury) + ' pop' + (Math.ceil(s.bury) === 1 ? '' : 's') + ' deeper.';
  } else if (kind === 'hot') {
    s.bury = Math.max(0, s.bury - 0.12);
    s.heap = clamp((s.heap | 0) + 2, 8, 40);
    spawnKernels(s, 5, true);
    s.note = 'Scorched! Let the burnt bits fall. The prize barely budged.';
  } else {
    s.bury = Math.max(0, s.bury - 0.18);
    spawnKernels(s, 2, false);
    s.note = 'A timid pop. Pump the bellows, then feed while she sings.';
  }
  s.feeds.push({x: 450 + (s.rng() - 0.5) * 28, y: 168, vy: 420, t: 0});
  if (s.bury <= 0) launchPrize(s);
  markDirty(s);
}
function canPay(s) {
  if (s.won || s.cooldown > 0) return false;
  if (alleyPlay) return (pocket() || 0) >= 1;
  return s.ammo > 0;
}
function payOne(s) {
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny in the purse. Cash a booth ticket for a five-penny stack.';
      return false;
    }
    s.started = true;
  } else {
    if (s.ammo <= 0) {
      s.note = 'Practice pennies are spent. The kettle still holds what you left.';
      return false;
    }
    s.ammo--;
  }
  s.dropped = (s.dropped || 0) + 1;
  return true;
}
function feed(s) {
  if (s.won) return;
  if (s.prizeAir) {
    s.note = 'Carton ready — the keepsake is in the air!';
    return;
  }
  if (s.cooldown > 0) return;
  if (!canPay(s) && !(alleyPlay ? (pocket() || 0) : s.ammo)) {
    s.note = alleyPlay
      ? 'Need a penny in the purse. Cash a booth ticket for a five-penny stack.'
      : 'Practice pennies are spent.';
    return;
  }
  if (!payOne(s)) return;
  s.cooldown = 0.3;
  burst(s);
}
function dump(s) {
  if (s.won || s.prizeAir) return;
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
  s.queue += take;
  s.dropped = (s.dropped || 0) + take;
  s.cooldown = 0.08;
  s.note = take === 1
    ? 'One penny into the fire.'
    : take + ' pennies dumped into the fire. Keep the flame kind.';
  markDirty(s);
}
function fresh(level, rng) {
  const set = setOf(level);
  const ammo = 18 + level * 4;
  return {
    level, rng, t: 0, x: 450, target: 450, heat: 0.48, pumpDelay: 0, cooldown: 0,
    queue: 0, kernels: [], prizeAir: null, fly: [], feeds: [], caught: 0, missed: 0,
    heap: 16 + level * 3, bury: set.bury, prize: set.prize, ammo, total: ammo,
    dropped: 0, paid: [], won: false, settle: 0, started: !alleyPlay, dirty: true, saveAt: 0,
    note: alleyPlay
      ? 'Pump until the flame is kind, then feed a penny. Shove ' + itemName(set.prize) + ' out of the kettle and catch it.'
      : 'Practice fire. Pump, feed, catch ' + itemName(set.prize) + '. Scores stay in the workshop.',
  };
}
function hydrate(blob, level, rng) {
  const set = setOf(level);
  const ammo = 18 + level * 4;
  return {
    level, rng, t: 0, x: clamp(blob.aim || 450, 245, 655), target: clamp(blob.aim || 450, 245, 655),
    heat: clamp(blob.heat ?? 0.48, 0, 1), pumpDelay: 0, cooldown: 0, queue: 0,
    kernels: [], prizeAir: null, fly: [], feeds: [],
    caught: blob.caught || 0, missed: 0,
    heap: blob.heap || (16 + level * 3),
    bury: blob.bury == null ? set.bury : Math.max(0, blob.bury),
    prize: set.prize, ammo, total: ammo,
    dropped: blob.dropped || 0, paid: Array.isArray(blob.paid) ? blob.paid.slice() : [],
    won: false, settle: 0, started: !alleyPlay, dirty: false, saveAt: 0,
    note: alleyPlay
      ? 'The kettle waited. Pump, then feed a penny when she sings.'
      : 'The practice kettle waited. Pump, then feed.',
  };
}

export default {
  title: 'Popcorn Symphony',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: alleyPlay
    ? 'Poppy’s kettle is a living machine. Six kettles, six keepsakes. A penny in the fire shoves the popcorn tide; catch this kettle’s unique when it pops free. Walk away and the heap waits. Dump the purse if you dare — a wild fire wastes a wild handful.'
    : 'Poppy’s practice kettle. Pump the bellows, feed a penny, catch the chapter keepsake. Workshop scores never enter your wallet.',
  instructions: alleyPlay
    ? 'Move the carton (pointer or Left/Right). Pump the bellows (Space) until the flame is kind, then Feed a penny. Each penny shoves the heap; too cold is timid, too hot scorches. Catch the keepsake when it pops. Dump the purse for a cascade. Leave and this kettle keeps. Cash a booth ticket for a five-penny stack if the purse is empty.'
    : 'Move the carton. Pump, then feed a practice penny. Catch the keepsake. Dump the rest if you like. Workshop play is free practice.',
  tableDetail: alleyPlay
    ? 'A new kettle, a new keepsake in the tide. Pump, feed pennies, catch it when it pops. Walk away whenever you like — this kettle keeps.'
    : 'A new practice kettle. Catch this chapter’s keepsake. Workshop scores stay here.',
  levels: SETS.map(s => s.name),
  sprites: SPRITES,
  prizes: SETS.map(s => s.prize),
  actions: [
    {id: 'left', label: 'Carton left', hold: true},
    {id: 'pump', label: 'Pump bellows · Space'},
    {id: 'feed', label: alleyPlay ? 'Feed a penny' : 'Feed practice penny'},
    {id: 'dump', label: alleyPlay ? 'Dump the purse' : 'Dump the rest'},
    {id: 'right', label: 'Carton right', hold: true},
  ],
  persist,
  create(level, rng) {
    const roll = rng || Math.random;
    const saved = loadTable(level);
    if (saved) {
      const s = hydrate(saved, level, roll);
      if (s.bury <= 0) launchPrize(s);
      bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
      return s;
    }
    const s = fresh(level, roll);
    persist(s);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    s.heat = Math.max(0, s.heat - dt * 0.048);
    s.pumpDelay = Math.max(0, s.pumpDelay - dt);
    s.cooldown = Math.max(0, s.cooldown - dt);
    const axis = (input.actions.has('right') || input.keys.has('ArrowRight') ? 1 : 0)
      - (input.actions.has('left') || input.keys.has('ArrowLeft') ? 1 : 0);
    if (axis) s.target = clamp(s.target + axis * 410 * dt, 245, 655);
    s.x += clamp(s.target - s.x, -440 * dt, 440 * dt);

    if (s.queue > 0 && s.cooldown <= 0 && !s.won && !s.prizeAir) {
      burst(s);
      s.queue--;
      s.cooldown = 0.1;
    }

    for (const f of s.feeds) {
      f.t += dt;
      f.vy += 520 * dt;
      f.y += f.vy * dt;
    }
    s.feeds = s.feeds.filter(f => f.y < 560 && f.t < 0.9);

    for (const k of s.kernels) {
      const old = k.y;
      k.age += dt;
      k.vy += 285 * dt;
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      if (k.x < 215) { k.x = 215; k.vx = Math.abs(k.vx) * 0.8; }
      if (k.x > 685) { k.x = 685; k.vx = -Math.abs(k.vx) * 0.8; }
      if (old < 1010 && k.y >= 1010 && k.vy > 0 && Math.abs(k.x - s.x) < 62) {
        k.remove = true;
        if (k.burnt) {
          s.caught = Math.max(0, s.caught - 2);
          s.note = 'A burnt bit in the carton! Let those fall.';
        } else {
          s.caught++;
          if (!s.prizeAir && !s.won) s.note = 'Golden. The heap still hides ' + itemName(s.prize) + '.';
        }
      } else if (k.y > 1120) {
        k.remove = true;
        s.missed++;
      }
    }
    s.kernels = s.kernels.filter(k => !k.remove);

    if (s.prizeAir && !s.won) {
      const p = s.prizeAir;
      const old = p.y;
      p.vy += 300 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 210) { p.x = 210; p.vx = Math.abs(p.vx) * 0.72; }
      if (p.x > 690) { p.x = 690; p.vx = -Math.abs(p.vx) * 0.72; }
      if (old < 1010 && p.y >= 1010 && p.vy > 0 && Math.abs(p.x - s.x) < 78) claimPrize(s);
      else if (p.y > 1140) missPrize(s);
    }

    if (s.fly) {
      for (const f of s.fly) f.t += dt;
      s.fly = s.fly.filter(f => f.t < f.dur);
    }

    if (s.won && !s.result) {
      s.settle += dt;
      if (s.settle > 0.85) {
        done(s, 'The carton caught a little golden moment',
          itemName(s.prize) + ' flies into the treasure book. Poppy recommends sharing, but will not insist.',
          {prize: s.prize, won: true});
      }
    }

    if (s.dirty && s.t - (s.saveAt || 0) > 1.2) persist(s);
  },
  pointer(s, type, p) {
    if (type === 'down' || type === 'move') s.target = clamp(p.x, 245, 655);
  },
  action(s, id) {
    if (id === 'pump') pump(s);
    if (id === 'feed') feed(s);
    if (id === 'dump') dump(s);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ') pump(s);
    if (k === 'Enter') feed(s);
    if (k === 'd' || k === 'D') dump(s);
  },
  draw(s, d) {
    const set = setOf(s.level);
    
    d.text('this kettle', 146, 122, 13, '#ead6a4');
    d.item(spriteKey(s.prize), 146, 178, {w: 78, fallback: () => d.star(146, 178, 26)});
    d.text(itemName(s.prize), 146, 236, 12, '#fff0cb');
    const left = Math.max(0, Math.ceil(s.bury));
    d.text(s.won ? 'caught' : (s.prizeAir ? 'in the air' : left + ' pop' + (left === 1 ? '' : 's') + ' deep'), 146, 262, 12, '#f0d6a8');
    for (let i = 0; i < SETS.length; i++) {
      const x = 78 + (i % 3) * 50, y = 318 + Math.floor(i / 3) * 52;
      const got = owned(SETS[i].prize) || (s.won && i === s.level);
      d.item(spriteKey(SETS[i].prize), x, y, {w: 34, fallback: () => d.star(x, y, 11)});
      if (got) d.text('✓', x + 12, y - 10, 15, '#f6e2a2');
      else d.circle(x, y, 18, '#1a120866');
    }

    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    const px = 790, py = 168;

    d.ellipse(450, 651, 88, 19, '#72573b88');
    for (let i = 0; i < 5; i++) {
      const x = 414 + i * 18, h = 12 + s.heat * 55 + Math.sin(s.t * 11 + i) * 8;
      d.poly([[x - 10, 650], [x - 3, 650 - h], [x + 13, 650]], s.heat > set.heatMax ? '#b75d4c' : '#e7ad63', '#f7d48b', 1);
    }
    d.item(spriteKey('sweet-heat'), 450, 640, {
      w: 36 + s.heat * 18, alpha: 0.35 + s.heat * 0.5, shadow: false, fallback: () => {},
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
    const heapN = Math.min(s.heap, 28);
    for (let i = 0; i < heapN; i++) {
      const a = i * 2.399 + s.t * 0.15;
      const rr = 10 + (i % 8) * 5.5;
      kernel(d, 450 + Math.cos(a) * rr * 0.95, 548 + Math.sin(a) * rr * 0.32, 9, false, a);
    }
    if (!s.won && !s.prizeAir) {
      const rise = (1 - clamp(s.bury / set.bury, 0, 1)) * 36;
      d.item(spriteKey(s.prize), 450, 528 - rise, {
        w: 34 + rise * 0.35,
        fallback: () => d.star(450, 528 - rise, 14),
      });
    }
    for (const f of s.feeds) {
      d.item(spriteKey('everyday-penny'), f.x, f.y, {
        w: 28, shadow: false, fallback: () => d.ball(f.x, f.y, 10, '#b68445'),
      });
    }
    for (const k of s.kernels) kernel(d, k.x, k.y, 13, k.burnt, k.age * 3);
    if (s.prizeAir) {
      d.item(spriteKey(s.prizeAir.id), s.prizeAir.x, s.prizeAir.y, {
        w: 56, fallback: () => d.star(s.prizeAir.x, s.prizeAir.y, 20),
      });
    }
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
    for (const f of (s.fly || [])) {
      const u = Math.min(1, f.t / f.dur);
      const e = 1 - (1 - u) * (1 - u);
      const fx = f.x + (788 - f.x) * e, fy = f.y + (90 - f.y) * e;
      d.item(spriteKey(f.id), fx, fy, {w: Math.max(22, 56 * (1 - u * 0.4)), fallback: () => d.star(fx, fy, 14)});
    }
    const hot = s.heat > set.heatMax, cold = s.heat < set.heatMin;
    d.text(hot ? 'TOO HOT' : cold ? 'NEEDS A PUFF' : 'GENTLE FLAME', 450, 700, 16, hot ? '#a14f43' : '#785b3d');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : s.ammo;
    const purse = alleyPlay
      ? ((n == null ? 0 : n) + (n === 1 ? ' penny' : ' pennies') + ' in the purse')
      : (n + ' / ' + s.total + ' practice pennies');
    const deep = s.won ? 'keepsake caught' : s.prizeAir ? 'keepsake in the air' : Math.ceil(s.bury) + ' pops deep';
    return purse + ' · ' + deep + (s.queue ? ' · dumping ' + s.queue : '') + ' · ' + s.note;
  },
};
