import {clamp, done} from '../draw.js?v=ink-1';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, owned} from '../wallet.js?v=booth-play-2';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const DUMP_CAP = 10;
const LIP_SPEED = 16;
const STROKE = 0.4;
const SHOVE = 72;
const BOOK = 'pennyFever.impossibleSuitcase';
const CLOTH = {left: 228, right: 672, back: 392, lip: 768};
const SETS = [
  {prize: 'pressed-heart', mix: ['everyday-penny', 'lucky-match'], fill: 0.74, pocket: 92},
  {prize: 'penny-purse', mix: ['everyday-penny', 'coin-sleeve', 'lucky-match'], fill: 0.78, pocket: 84},
  {prize: 'penny-collector-book', mix: ['everyday-penny', 'whisper-charm', 'coin-sleeve'], fill: 0.82, pocket: 76},
  {prize: 'sealed-secret', mix: ['everyday-penny', 'lucky-match', 'pocket-observatory'], fill: 0.85, pocket: 68},
  {prize: 'midnight-invitation', mix: ['everyday-penny', 'whisper-charm', 'coin-sleeve', 'lucky-match'], fill: 0.88, pocket: 60},
  {prize: 'ticket-satchel', mix: ['everyday-penny', 'coin-sleeve', 'whisper-charm', 'pocket-observatory'], fill: 0.9, pocket: 52},
];
const DEFS = {
  'everyday-penny': {r: 15, w: 32, color: '#b68445', clutter: true},
  'lucky-match': {r: 15, w: 34, color: '#d2a15a', clutter: true},
  'whisper-charm': {r: 16, w: 36, color: '#8a7ab0', clutter: true},
  'coin-sleeve': {r: 16, w: 38, color: '#c4a46a', clutter: true},
  'pocket-observatory': {r: 18, w: 42, color: '#6a8aaa', clutter: true},
  'pressed-heart': {r: 22, w: 50, color: '#c67483', unique: true},
  'penny-purse': {r: 22, w: 50, color: '#6a7a52', unique: true},
  'penny-collector-book': {r: 23, w: 52, color: '#9a4d4a', unique: true},
  'treasure-tin': {r: 22, w: 50, color: '#c4a46a', unique: true},
  'midnight-invitation': {r: 22, w: 50, color: '#6a4a78', unique: true},
  'ticket-satchel': {r: 23, w: 52, color: '#b68445', unique: true},
};
const SPRITES = [
  'night-suitcase', 'ticket-satchel', 'penny-purse', 'coin-sleeve', 'lucky-match',
  'whisper-charm', 'pocket-observatory', 'pressed-heart', 'penny-collector-book',
  'treasure-tin', 'midnight-invitation', 'everyday-penny',
];

function setOf(level) { return SETS[level] || SETS[0]; }
function prizeOf(level) { return setOf(level).prize; }
function mint(id, x, y) {
  const def = DEFS[id] || DEFS['everyday-penny'];
  return {
    id, x, y, vx: 0, vy: 0, r: def.r, w: def.w, color: def.color,
    unique: !!def.unique, falling: false,
  };
}
function inPocket(c, level) {
  return Math.abs(c.x - 450) <= setOf(level).pocket;
}
function readStore() {
  if (typeof localStorage === 'undefined') return {v: 1, cases: {}};
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1 && blob.cases) return blob;
  } catch { /* ignore */ }
  return {v: 1, cases: {}};
}
function loadCase(level) {
  const row = readStore().cases[String(level)];
  return row && Array.isArray(row.pieces) ? row : null;
}
function snapshot(s) {
  return {
    v: 1,
    chapter: s.level || 0,
    t: s.t,
    aim: s.aim,
    tucked: s.tucked,
    packed: s.packed,
    restock: s.restock,
    queue: s.queue,
    ammo: s.ammo,
    seen: s.seen.slice(),
    paid: s.paid.slice(),
    pieces: s.coins.filter(c => !c.falling).map(c => ({
      id: c.id, x: +c.x.toFixed(2), y: +c.y.toFixed(2),
      vx: +c.vx.toFixed(2), vy: +c.vy.toFixed(2),
    })),
  };
}
function persist(s) {
  if (!s || typeof localStorage === 'undefined') return;
  try {
    const store = readStore();
    store.cases[String(s.level || 0)] = snapshot(s);
    localStorage.setItem(BOOK, JSON.stringify(store));
  } catch { /* quota */ }
  s.dirty = false;
  s.saveAt = s.t;
}
function plantY(r) {
  return CLOTH.back + 22 + SHOVE + r + 10;
}
function plantPrize(coins, level, rng) {
  const id = prizeOf(level);
  if (!id || coins.some(c => c.id === id)) return;
  const side = rng() < 0.5 ? -1 : 1;
  const offset = 10 + level * 24;
  const c = mint(id, 450, plantY(DEFS[id]?.r || 22));
  c.x = clamp(450 + side * offset + (rng() - 0.5) * 8, CLOTH.left + c.r + 18, CLOTH.right - c.r - 18);
  c.y += (rng() - 0.5) * 8;
  coins.push(c);
}
function fillCloth(level, rng) {
  const set = setOf(level);
  const out = [];
  const dx = 40, dy = 36;
  const limit = CLOTH.back + (CLOTH.lip - CLOTH.back) * set.fill;
  let row = 0;
  for (let y = CLOTH.back + 44; y <= limit; y += dy, row++) {
    const inset = (row % 2) * (dx * 0.5);
    for (let x = CLOTH.left + 22 + inset; x <= CLOTH.right - 22; x += dx) {
      const id = set.mix[out.length % set.mix.length];
      if (id === set.prize) continue;
      out.push(mint(id, x + (rng() - 0.5) * 3, y + (rng() - 0.5) * 2));
    }
  }
  return out;
}
function topUp(coins, rng) {
  const packed = fillCloth(0, rng).filter(p => p.id === 'everyday-penny');
  for (const p of packed) {
    if (p.y > CLOTH.lip - 90) continue;
    if (coins.some(c => Math.hypot(c.x - p.x, c.y - p.y) < c.r + p.r + 2)) continue;
    coins.push(p);
  }
}
function hydrate(blob) {
  const level = blob.chapter || 0;
  const coins = (blob.pieces || []).map(p => {
    const c = mint(p.id, p.x, p.y);
    c.x = clamp(c.x, CLOTH.left + c.r + 2, CLOTH.right - c.r - 2);
    c.y = clamp(c.y, CLOTH.back + c.r + 4, CLOTH.lip - c.r - 3);
    c.vx = 0;
    c.vy = 0;
    return c;
  });
  if (coins.length < 18) topUp(coins, Math.random);
  plantPrize(coins, level, Math.random);
  const ammo = alleyPlay ? 0 : (blob.ammo || (36 + level * 8));
  return {
    level, t: blob.t || 0, coins, aim: blob.aim || 450, ammo, total: ammo,
    packed: blob.packed || 0, tucked: blob.tucked || 0, cooldown: 0, settle: 0,
    queue: blob.queue || 0, restock: blob.restock || 0,
    seen: blob.seen || [], paid: blob.paid || [],
    dirty: false, saveAt: 0, stroke: 0, fly: [], started: false, won: false,
    prize: prizeOf(level), cinch: 0,
    note: 'The case waited. Tuck a penny to fold the packing cloth.',
  };
}
function fresh(level, rng) {
  const coins = fillCloth(level, rng);
  plantPrize(coins, level, rng);
  const prize = prizeOf(level);
  const ammo = 36 + level * 8;
  return {
    level, t: 0, coins, aim: 450, ammo, total: ammo, packed: 0, tucked: 0,
    cooldown: 0, settle: 0, queue: 0, restock: 0, seen: prize ? [prize] : [],
    paid: [], dirty: !!alleyPlay, saveAt: 0, stroke: 0, fly: [],
    started: !alleyPlay, won: false, prize, cinch: 0,
    note: alleyPlay
      ? 'The keep-pocket is at the clasp. Tuck pennies and fold the cloth toward it.'
      : 'Practice packing. Tuck a penny to fold the cloth.',
  };
}
function flyHome(s, c, intoPocket) {
  s.fly.push({
    id: c.id, x: c.x, y: c.y, w: c.w, color: c.color, t: 0, dur: 0.68,
    prize: !!intoPocket,
  });
}
function claim(s, c) {
  const prize = s.prize || prizeOf(s.level);
  s.won = true;
  if (prize && !s.paid.includes(prize)) s.paid.push(prize);
  if (alleyPlay && prize) keep(prize, 'pack');
  takePrize(s, prize);
  flyHome(s, c, true);
  s.dirty = true;
  s.note = itemName(prize) + ' nestled in the keep-pocket — Kit can catch the midnight train.';
}
function packAway(s, c) {
  s.packed++;
  flyHome(s, c, false);
  s.dirty = true;
  s.note = c.id === 'everyday-penny'
    ? 'A penny slipped into the lining.'
    : itemName(c.id) + ' packed into the lining.';
}
function stuffBack(s, c) {
  c.x = 450 + (Math.random() - 0.5) * 28;
  c.y = plantY(c.r);
  c.vx = (Math.random() - 0.5) * 24;
  c.vy = 20;
  c.falling = true;
  s.dirty = true;
  s.note = 'Kit stuffed ' + itemName(c.id) + ' back. Aim for the keep-pocket at the clasp.';
}
function spill(s, c) {
  if (c.unique || c.id === s.prize) {
    if (inPocket(c, s.level)) {
      claim(s, c);
      return false;
    }
    stuffBack(s, c);
    return true;
  }
  packAway(s, c);
  return false;
}
function dropOne(s, id, x) {
  const piece = mint(id, clamp(x, CLOTH.left + 22, CLOTH.right - 22), 268);
  piece.falling = true;
  piece.vy = 240;
  s.coins.push(piece);
  s.dirty = true;
}
function startStroke(s) {
  s.stroke = 0.001;
  s.started = true;
}
function tuck(s) {
  if (s.won || s.result) return;
  if (s.cooldown > 0) return;
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny. Cash a booth ticket for a five-penny stack.';
      return;
    }
    s.started = true;
  } else {
    if (s.ammo <= 0) {
      s.note = 'Practice pennies are spent. Open another case from the list.';
      return;
    }
    s.ammo--;
    if (s.ammo === 0) s.settle = 8;
  }
  s.cooldown = 0.28;
  s.tucked = (s.tucked || 0) + 1;
  dropOne(s, 'everyday-penny', s.aim);
  startStroke(s);
  s.restock += 1;
  s.note = 'A penny tucked into the lining. The cloth folded.';
}
function cinch(s) {
  if (s.won || s.result) return;
  if (s.cooldown > 0 && s.queue > 0) return;
  const have = alleyPlay ? (pocket() || 0) : s.ammo;
  const take = Math.min(DUMP_CAP, Math.max(0, have | 0));
  if (take < 1) {
    s.note = alleyPlay
      ? 'The purse is empty. Cash a ticket for a five-penny stack.'
      : 'No practice pennies left to cinch.';
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
    if (s.ammo === 0) s.settle = 8;
  }
  s.queue += take;
  s.tucked = (s.tucked || 0) + take;
  s.cooldown = 0.08;
  s.cinch = 0.55;
  startStroke(s);
  s.note = take === 1 ? 'One strap cinched.' : take + ' pennies cinched through the straps.';
}
function seat(s, id, rng) {
  const c = mint(id,
    CLOTH.left + 36 + rng() * (CLOTH.right - CLOTH.left - 72),
    CLOTH.back + 36 + rng() * 28);
  c.falling = false;
  s.coins.push(c);
  s.dirty = true;
  return c;
}
function restock(s, rng) {
  const pennies = s.coins.filter(c => !c.falling && c.id === 'everyday-penny').length;
  if (pennies < 18 && rng() < 0.4) seat(s, 'everyday-penny', rng);
  if (s.restock > 0 && s.restock % 7 === 0) {
    const mix = setOf(s.level).mix.filter(id => id !== 'everyday-penny' && id !== s.prize);
    const id = mix.length ? mix[(rng() * mix.length) | 0] : 'lucky-match';
    seat(s, id, rng);
    s.note = 'Kit stuffed ' + itemName(id) + ' in at the hinges.';
  }
}
function finish(s) {
  if (s.result) return;
  const prize = s.prize || prizeOf(s.level);
  done(s, 'The impossible suitcase closes',
    itemName(prize) + ' is packed for the midnight train.',
    {prize, won: true});
}

export default {
  title: 'The Impossible Suitcase',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: alleyPlay
    ? 'Kit promised to pack lightly. Six cases, one keepable treasure each. Tuck pennies into the living jumble — each penny folds the packing cloth toward the clasp. Shove this case’s unique into the keep-pocket to stamp the book. Walk away and the jumble waits.'
    : 'Kit’s packing cloth, for practice. Tuck pennies to fold the cloth. Nestle the unique into the keep-pocket. Workshop scores stay off the book.',
  instructions: alleyPlay
    ? 'Aim along the hinges, then Tuck a penny (one from the purse). The cloth folds once per tuck. Cinch the straps to dump a handful. Only the keep-pocket at the clasp keeps the unique — corners send it back into the case. Leave whenever you like; this case keeps. Cash a booth ticket for a five-penny stack if the purse is empty.'
    : 'Aim, tuck, fold. Nestle the unique into the keep-pocket at the clasp. Corners stuff it back. Practice pennies never enter the wallet.',
  tableDetail: alleyPlay
    ? 'This case keeps its jumble. Tuck pennies to fold the packing cloth toward the clasp. Shove this chapter’s treasure into the keep-pocket. Walk away whenever you like — Kit waits.'
    : 'Practice packing. This case keeps its jumble until you open another.',
  liveTitle: 'The Impossible Suitcase',
  liveDetail: alleyPlay
    ? 'A penny a tuck. Fold the cloth. Nestle this case’s treasure into the keep-pocket at the clasp.'
    : 'Tuck practice pennies. Nestle the unique into the keep-pocket.',
  liveButton: 'Open the case',
  levels: [
    'A small overnight case',
    'Just one more thing',
    'The midnight expedition',
    'The overstuffed valise',
    'Everything but the kettle',
    'The hexomino hold-all',
  ],
  sprites: SPRITES,
  prizes: SETS.map(row => row.prize),
  actions: [
    {id: 'tuck', label: alleyPlay ? 'Tuck a penny' : 'Tuck a practice penny'},
    {id: 'cinch', label: alleyPlay ? 'Cinch the straps' : 'Cinch the rest'},
  ],
  persist,
  create(level, rng) {
    const roll = rng || Math.random;
    const saved = loadCase(level);
    if (saved && saved.pieces && saved.pieces.length >= 12) {
      const s = hydrate(saved);
      s.level = level;
      s.prize = prizeOf(level);
      plantPrize(s.coins, level, roll);
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
    s.cooldown = Math.max(0, s.cooldown - dt);
    s.cinch = Math.max(0, s.cinch - dt);
    const axis = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    s.aim = clamp(s.aim + axis * 230 * dt, 260, 640);
    if (s.queue > 0 && s.cooldown <= 0 && !s.won) {
      dropOne(s, 'everyday-penny', s.aim + (Math.random() - 0.5) * 18);
      s.queue--;
      s.restock += 1;
      s.cooldown = 0.09;
      s.started = true;
      startStroke(s);
    }
    if (s.fly) {
      for (const f of s.fly) f.t += dt;
      s.fly = s.fly.filter(f => f.t < f.dur);
    }
    if (s.won) {
      if (!s.fly.length) finish(s);
      return;
    }
    if (alleyPlay && !s.started) {
      if (s.dirty && s.t - s.saveAt > 1.2) persist(s);
      return;
    }
    const shoving = s.stroke > 0 && s.stroke < 0.7;
    if (s.stroke > 0) {
      const was = s.stroke;
      s.stroke += dt / STROKE;
      const t = clamp(s.stroke, 0, 1);
      const extend = t < 0.7 ? t / 0.7 : 1;
      const prev = was < 0.7 ? was / 0.7 : 1;
      if (extend > prev) {
        const dPlate = (extend - prev) * SHOVE;
        const plate = CLOTH.back + 22 + extend * SHOVE;
        const depth = CLOTH.lip - CLOTH.back || 1;
        for (const c of s.coins) {
          if (c.falling) continue;
          if (c.y < plate + c.r) {
            c.y += dPlate;
            c.vy = Math.max(c.vy, dPlate * 80);
          } else {
            const along = clamp((c.y - CLOTH.back) / depth, 0, 1);
            const tide = dPlate * (0.06 + 0.16 * along);
            c.y += tide;
            c.vy = Math.max(c.vy, tide * 40);
          }
        }
      }
      if (s.stroke >= 1) s.stroke = 0;
    }
    const busy = s.queue > 0 || s.stroke > 0 || s.coins.some(c => c.falling || c.vx * c.vx + c.vy * c.vy > 2.2);
    if (!busy) {
      for (const c of s.coins) { c.vx = 0; c.vy = 0; }
      if (s.dirty && s.t - s.saveAt > 1.2) persist(s);
      return;
    }
    if (s.restock && s.restock % 7 === 0) {
      restock(s, Math.random);
      s.restock += 0.001;
    }
    for (let step = 0; step < 3; step++) {
      const h = dt / 3;
      for (const c of s.coins) {
        if (c.falling) {
          c.vy += 980 * h;
          c.x += c.vx * h;
          c.y += c.vy * h;
          let hit = false;
          for (const o of s.coins) {
            if (o === c || o.falling) continue;
            const dx = o.x - c.x, dy = o.y - c.y, dd = Math.hypot(dx, dy), need = c.r + o.r;
            if (dd >= need || dd < 0.001) continue;
            hit = true;
            const nx = dx / dd, ny = dy / dd, overlap = need - dd;
            c.x -= nx * overlap; c.y -= ny * overlap;
            const j = Math.max(0, c.vy) * 0.62;
            o.vx += nx * j * 0.35;
            o.vy += Math.max(j * 0.85, ny * j);
            c.vy *= 0.28;
            c.vx *= 0.45;
          }
          if (hit && c.vy < 70) {
            c.falling = false;
            c.vy = Math.max(c.vy, 18);
          } else if (!hit && c.y >= CLOTH.back + c.r + 10) {
            c.falling = false;
            c.y = CLOTH.back + c.r + 10;
            c.vx = 0;
            c.vy = 0;
          }
          c.x = clamp(c.x, CLOTH.left + c.r, CLOTH.right - c.r);
          continue;
        }
        c.x += c.vx * h;
        c.y += c.vy * h;
        c.vx *= Math.exp(-7.2 * h);
        c.vy *= Math.exp(-6.4 * h);
        if (c.x < CLOTH.left + c.r) { c.x = CLOTH.left + c.r; c.vx = Math.abs(c.vx) * 0.2; }
        if (c.x > CLOTH.right - c.r) { c.x = CLOTH.right - c.r; c.vx = -Math.abs(c.vx) * 0.2; }
        if (c.y < CLOTH.back + c.r) { c.y = CLOTH.back + c.r; c.vy = Math.max(0, c.vy); }
        if (c.y + c.r > CLOTH.lip && !shoving && c.vy < LIP_SPEED) {
          c.y = CLOTH.lip - c.r;
          c.vy = 0;
        }
      }
      const group = s.coins.filter(c => !c.falling);
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
          const a = group[i], b = group[j], dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy), need = a.r + b.r;
          if (dd >= need || dd < 0.001) continue;
          const nx = dx / dd, ny = dy / dd, overlap = need - dd;
          a.x -= nx * overlap * 0.5; a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5; b.y += ny * overlap * 0.5;
          const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (relative < 0) {
            const impulse = -relative * 0.58;
            a.vx -= nx * impulse; a.vy -= ny * impulse;
            b.vx += nx * impulse; b.vy += ny * impulse;
          }
        }
      }
    }
    const stay = [];
    for (const c of s.coins) {
      if (c.falling) { stay.push(c); continue; }
      if (c.y + c.r > CLOTH.lip && (shoving || c.vy >= LIP_SPEED)) {
        if (!spill(s, c)) continue;
      }
      stay.push(c);
    }
    s.coins = stay;
    if (s.dirty && s.t - s.saveAt > 1.4) persist(s);
  },
  pointer(s, type, p) {
    if (s.won || s.result) return;
    if (type === 'move' || type === 'down') s.aim = clamp(p.x, 260, 640);
    if (type === 'up') tuck(s);
  },
  action(s, id) {
    if (id === 'tuck') tuck(s);
    if (id === 'cinch') cinch(s);
  },
  key(s, k, down) {
    if (!down || s.won || s.result) return;
    if (k === ' ') tuck(s);
    if (k === 'Enter' || k === 'd' || k === 'D') cinch(s);
  },
  draw(s, d) {
    d.poly([[168, 214], [732, 214], [758, 268], [142, 268]], '#5a3a2288', '#e4c48a', 3);
    d.item(spriteKey('night-suitcase'), 450, 168, {
      w: 120,
      fallback: () => d.text('KIT’S CASE', 450, 168, 16, '#e9d7a8'),
    });
    d.poly([[142, 268], [758, 268], [792, 980], [108, 980]], '#6a462c88', '#e4c48a', 3);
    d.poly(
      [[CLOTH.left - 8, CLOTH.back - 8], [CLOTH.right + 8, CLOTH.back - 8],
        [CLOTH.right + 18, CLOTH.lip + 6], [CLOTH.left - 18, CLOTH.lip + 6]],
      '#c4b08a99', '#eee0ba88', 2,
    );
    d.line({x: CLOTH.left + 6, y: CLOTH.lip - 2}, {x: CLOTH.right - 6, y: CLOTH.lip - 2}, '#f0d18f', 5);
    const extend = s.stroke > 0 && s.stroke < 0.7 ? s.stroke / 0.7 : (s.stroke >= 0.7 ? 1 : 0);
    const plate = CLOTH.back + 18 + extend * SHOVE;
    d.line({x: CLOTH.left + 10, y: plate}, {x: CLOTH.right - 10, y: plate}, '#d2b07a', 12);
    d.line({x: CLOTH.left + 10, y: plate - 5}, {x: CLOTH.right - 10, y: plate - 5}, '#f3ddb0', 3);
    const pw = setOf(s.level).pocket;
    const pocketGlow = s.coins.some(c => (c.unique || c.id === s.prize) && !c.falling && c.y > CLOTH.lip - 90);
    d.poly(
      [[450 - pw, CLOTH.lip + 8], [450 + pw, CLOTH.lip + 8], [450 + pw + 10, 930], [450 - pw - 10, 930]],
      pocketGlow ? '#6b3a3acc' : '#5a3a2288',
      pocketGlow ? '#f0d18f' : '#e8d4a0',
      pocketGlow ? 3 : 2,
    );
    d.text('keep-pocket', 450, 952, 13, '#ead6a4');
    const strap = s.cinch > 0 ? '#e8c48a' : '#8a7450aa';
    d.line({x: 310, y: 280}, {x: 300, y: 970}, strap, s.cinch > 0 ? 10 : 7);
    d.line({x: 590, y: 280}, {x: 600, y: 970}, strap, s.cinch > 0 ? 10 : 7);
    const order = [...s.coins].sort((a, b) => a.y - b.y);
    for (const c of order) {
      d.item(spriteKey(c.id), c.x, c.y, {w: c.w, fallback: () => d.ball(c.x, c.y, c.r, c.color)});
    }
    
    d.text('this case', 160, 130, 13, '#ead6a4');
    d.item(spriteKey(s.prize), 160, 188, {w: 84, fallback: () => d.star(160, 188, 28)});
    d.text(itemName(s.prize), 160, 246, 12, '#fff0cb');
    d.text(s.won ? 'packed' : 'still unpacked', 160, 272, 12, '#f0d6a8');
    for (let i = 0; i < SETS.length; i++) {
      const x = 92 + (i % 3) * 52, y = 330 + Math.floor(i / 3) * 58;
      const got = owned(SETS[i].prize) || (s.won && i === s.level) || s.paid.includes(SETS[i].prize);
      d.item(spriteKey(SETS[i].prize), x, y, {w: 36, fallback: () => d.star(x, y, 12)});
      if (got) d.text('✓', x + 14, y - 10, 16, '#f6e2a2');
      else d.circle(x, y, 20, '#1a120866');
    }
    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    const px = 790, py = 168;
    d.item(spriteKey('penny-purse'), px, py, {w: 92, fallback: () => d.heart(px, py, 28, '#6a7a52')});
    d.text(String(n), px, 226, 18, '#fff6d8');
    d.text(n === 1 ? 'penny' : 'pennies', px, 244, 12, '#ead6a4');
    d.poly([[742, 280], [838, 284], [834, 360], [738, 354]], '#6b3a3a', '#e8d4a0', 2);
    d.text('keep', 788, 376, 13, '#ead6a4');
    for (const f of (s.fly || [])) {
      const u = Math.min(1, f.t / f.dur);
      const e = 1 - (1 - u) * (1 - u);
      const destX = f.prize ? 450 : px, destY = f.prize ? 900 : py;
      const fx = f.x + (destX - f.x) * e, fy = f.y + (destY - f.y) * e;
      d.item(spriteKey(f.id), fx, fy, {
        w: Math.max(18, (f.w || 32) * (1 - u * 0.4)),
        fallback: () => d.ball(fx, fy, 10, f.color || '#b68445'),
      });
    }
    d.poly([[s.aim - 22, 286], [s.aim + 22, 286], [s.aim + 14, 332], [s.aim - 14, 332]], '#8a7450cc', '#ead097', 2);
    d.text('↓', s.aim, 318, 20, '#fff3d0');
    if (alleyPlay && !s.started) d.text('case still', 450, 72, 18, '#f0d6a8');
  },
  readout: s => {
    const inCase = s.coins.filter(c => !c.falling).length;
    const n = alleyPlay ? pocket() : s.ammo;
    if (alleyPlay) {
      return (n == null ? '0' : n) + (n === 1 ? ' penny' : ' pennies') + ' in the purse · '
        + inCase + ' in the case · ' + s.packed + ' in the lining'
        + (s.queue ? ' · cinching ' + s.queue : '') + ' · ' + s.note;
    }
    return n + ' / ' + s.total + ' practice · ' + inCase + ' in the case · '
      + s.packed + ' in the lining' + (s.ammo === 0 ? ' · settling' : '') + ' · ' + s.note;
  },
};
