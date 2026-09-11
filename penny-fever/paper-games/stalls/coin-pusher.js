import {clamp} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, credit, keep, loadMachine, saveMachine} from '../wallet.js?v=games-open-2';

const DUMP_CAP = 24;
const LIP_SPEED = 16;
const STROKE = 0.42;
const SHOVE = 78;
const LAYERS = [
  {left: 258, right: 642, back: 188, lip: 448},
  {left: 228, right: 672, back: 478, lip: 768},
  {left: 202, right: 698, back: 798, lip: 1072},
];
const SETS = [
  {mix0: ['everyday-penny'], mix1: ['everyday-penny', 'moon-penny'], mix2: ['everyday-penny', 'moon-penny'], unique: 'coin-sleeve', prize: 'coin-sleeve'},
  {mix0: ['everyday-penny', 'moon-penny'], mix1: ['everyday-penny', 'moon-penny'], mix2: ['moon-penny', 'star-token'], unique: 'copper-cascade', prize: 'copper-cascade'},
  {mix0: ['everyday-penny', 'rose-penny'], mix1: ['everyday-penny', 'rose-penny'], mix2: ['rose-penny', 'star-token'], unique: 'penny-tree', prize: 'penny-tree'},
  {mix0: ['everyday-penny', 'crown-token'], mix1: ['everyday-penny', 'star-token'], mix2: ['crown-token'], unique: 'coin-album', prize: 'coin-album'},
  {mix0: ['everyday-penny', 'star-token'], mix1: ['moon-penny', 'rose-penny'], mix2: ['star-token', 'crown-token'], unique: 'treasure-tin', prize: 'treasure-tin'},
  {mix0: ['everyday-penny', 'moon-penny', 'rose-penny'], mix1: ['star-token', 'crown-token'], mix2: ['moon-penny', 'crown-token'], unique: 'five-penny-stack', prize: 'five-penny-stack'},
];
const TOKENS = {
  'everyday-penny': {r: 15, w: 32, score: 1, color: '#b68445', weight: 52, cap: 160, token: true},
  'moon-penny': {r: 16, w: 36, score: 3, color: '#c48a4a', weight: 7, cap: 6, token: true},
  'rose-penny': {r: 16, w: 34, score: 3, color: '#b56b62', weight: 6, cap: 5, token: true},
  'star-token': {r: 15, w: 32, score: 3, color: '#c9a45a', weight: 5, cap: 4, token: true},
  'crown-token': {r: 16, w: 34, score: 4, color: '#9a4d4a', weight: 4, cap: 3, token: true},
  'pressed-heart': {r: 16, w: 36, score: 2, color: '#c67483', weight: 4, cap: 3, token: true},
  'lucky-match': {r: 14, w: 30, score: 2, color: '#d2a15a', weight: 4, cap: 3, token: true},
};
const UNIQUES = [
  'looking-glass-locket', 'clockwork-butterfly', 'secret-door-key', 'moon-brooch',
  'crystal-cradle', 'star-fragment', 'wishing-acorn', 'pocket-cloud',
  'mercury-bead', 'gyro-ghost', 'aura-keepsake', 'midnight-invitation',
  'sleepy-compass', 'clockwork-key', 'heart-gear',
];
const UNIQUE = Object.fromEntries(UNIQUES.map(id => [id, {r: 20, w: 44, score: 0, color: '#c4a46a', weight: 1, unique: true, prize: true}]));
const CHAPTER_ITEMS = {
  'coin-sleeve': {r: 22, w: 50, score: 0, color: '#c4a46a', unique: true, prize: true},
  'copper-cascade': {r: 24, w: 54, score: 0, color: '#b68445', unique: true, prize: true},
  'penny-tree': {r: 24, w: 54, score: 0, color: '#8a9a4a', unique: true, prize: true},
  'coin-album': {r: 22, w: 48, score: 0, color: '#9a4d4a', unique: true, prize: true},
  'treasure-tin': {r: 22, w: 48, score: 0, color: '#c4a46a', unique: true, prize: true},
  'five-penny-stack': {r: 20, w: 46, score: 5, color: '#b68445', unique: true, prize: true, token: true},
};
const DEFS = {...TOKENS, ...UNIQUE, ...CHAPTER_ITEMS};
const POOL = Object.entries(DEFS).map(([id, def]) => ({id, ...def}));
const SPRITES = ['everyday-penny','moon-penny','rose-penny','star-token','crown-token','heart-gear','penny-purse',...Object.keys(CHAPTER_ITEMS)];

function mint(id, x, y, layer) {
  const def = DEFS[id] || DEFS['everyday-penny'];
  return {
    id, x, y, layer, vx: 0, vy: 0,
    r: def.r, w: def.w, score: def.score || 0, color: def.color,
    unique: !!def.unique, prize: !!def.prize, token: !!def.token, falling: false,
  };
}
function counts(coins) {
  const n = {};
  for (const c of coins) if (!c.falling) n[c.id] = (n[c.id] || 0) + 1;
  return n;
}
function pick(s, rng, wantUnique) {
  const on = counts(s.coins);
  const options = [];
  for (const def of POOL) {
    if (def.unique) {
      if (!wantUnique) continue;
      if (s.seen.includes(def.id) || s.paid.includes(def.id)) continue;
    } else if (wantUnique) continue;
    if (def.cap && (on[def.id] || 0) >= def.cap) continue;
    options.push(def);
  }
  if (!options.length) return wantUnique ? null : 'everyday-penny';
  let total = 0;
  for (const o of options) total += o.weight;
  let roll = rng() * total;
  for (const o of options) {
    roll -= o.weight;
    if (roll <= 0) return o.id;
  }
  return options[options.length - 1].id;
}
function snapshot(s) {
  return {
    v: 4,
    chapter: s.level || 0,
    t: s.t,
    aim: s.aim,
    dropped: s.dropped,
    score: s.score,
    specials: s.specials,
    restock: s.restock,
    queue: s.queue,
    stroke: 0,
    seen: s.seen.slice(),
    paid: s.paid.slice(),
    pieces: s.coins.filter(c => !c.falling).map(c => ({
      id: c.id, x: +c.x.toFixed(2), y: +c.y.toFixed(2),
      vx: +c.vx.toFixed(2), vy: +c.vy.toFixed(2), layer: c.layer,
    })),
  };
}
function hydrate(blob) {
  const coins = (blob.pieces || []).map(p => {
    const c = mint(p.id, p.x, p.y, p.layer | 0);
    const L = LAYERS[c.layer] || LAYERS[2];
    c.x = clamp(c.x, L.left + c.r + 2, L.right - c.r - 2);
    c.y = clamp(c.y, L.back + c.r + 4, L.lip - c.r - 3);
    c.vx = 0;
    c.vy = 0;
    return c;
  });
  if ((blob.v || 0) < 3 && coins.length < 90) topUp(coins, Math.random);
  return {
    level: blob.chapter || 0, t: blob.t || 0, coins, aim: blob.aim || 450, ammo: 0, total: 0,
    score: blob.score || 0, specials: blob.specials || 0, cooldown: 0, settle: 0,
    falling: [], fly: [], dropped: blob.dropped || 0, started: false, queue: blob.queue || 0,
    restock: blob.restock || 0, seen: blob.seen || [], paid: blob.paid || [],
    dirty: false, saveAt: 0, stroke: 0, note: 'The trays waited. Drop a penny to wake them.',
  };
}
function startStroke(s) {
  s.stroke = 0.001;
  s.started = true;
}
function persist(s) {
  if (!s) return;
  saveMachine(snapshot(s), s.level || 0);
  s.dirty = false;
  s.saveAt = s.t;
}
function markSeen(s, id) {
  if (!DEFS[id]?.unique) return;
  if (!s.seen.includes(id)) s.seen.push(id);
}
function flyHome(s, c) {
  s.fly = s.fly || [];
  s.fly.push({
    id: c.id, x: c.x, y: c.y, w: c.w, color: c.color, t: 0, dur: 0.62,
    prize: !!(c.prize || (c.id !== 'everyday-penny')),
  });
}
function payout(s, c) {
  if (c.token || c.score) {
    s.score += c.score;
    if (c.id !== 'everyday-penny') s.specials++;
    if (alleyPlay && c.score) {
      credit(c.score);
      keep('penny-purse');
    }
  }
  if (c.id !== 'everyday-penny' && alleyPlay) keep(c.id);
  if (c.unique && alleyPlay && SETS[s.level]?.prize) keep(SETS[s.level].prize);
  if (c.prize && !s.paid.includes(c.id)) s.paid.push(c.id);
  flyHome(s, c);
  s.dirty = true;
  s.note = c.prize || c.id !== 'everyday-penny'
    ? itemName(c.id) + ' into the treasure book!'
    : 'A penny into the purse.';
}
function spill(s, c) {
  if (c.layer >= 2) {
    payout(s, c);
    return false;
  }
  c.layer += 1;
  c.falling = true;
  c.vy = 80;
  c.vx *= 0.4;
  s.note = c.prize ? itemName(c.id) + ' dropped a tray.' : 'The tide moved down a tray.';
  return true;
}
function dropOne(s, id, x) {
  const L = LAYERS[0];
  const piece = mint(id, clamp(x, L.left + 22, L.right - 22), 132, 0);
  piece.falling = true;
  piece.vy = 240;
  markSeen(s, id);
  s.coins.push(piece);
  s.dirty = true;
}
function drop(s) {
  if (s.cooldown > 0) return;
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny. Cash a booth ticket for a five-penny stack.';
      return;
    }
    s.started = true;
    s.dropped = (s.dropped || 0) + 1;
  } else {
    if (s.ammo <= 0) return;
    s.ammo--;
    if (s.ammo === 0) s.settle = 10;
  }
  s.cooldown = 0.28;
  dropOne(s, 'everyday-penny', s.aim);
  startStroke(s);
  s.restock += 1;
  s.note = 'A penny from the purse.';
}
function dump(s) {
  if (s.cooldown > 0 && s.queue > 0) return;
  const have = alleyPlay ? (pocket() || 0) : s.ammo;
  const take = Math.min(DUMP_CAP, Math.max(0, have | 0));
  if (take < 1) {
    s.note = alleyPlay ? 'The purse is empty. Cash a ticket for a five-penny stack.' : 'No practice pennies left.';
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
    if (s.ammo === 0) s.settle = 10;
  }
  s.queue += take;
  s.dropped = (s.dropped || 0) + take;
  s.cooldown = 0.08;
  startStroke(s);
  s.note = take === 1 ? 'One penny from the purse.' : take + ' pennies dumped from the purse.';
}
function seat(s, id, layer, rng) {
  const L = LAYERS[layer];
  const c = mint(id, L.left + 36 + rng() * (L.right - L.left - 72), L.back + 40 + rng() * 36, layer);
  c.vx = 0; c.vy = 0; c.falling = false;
  markSeen(s, id);
  s.coins.push(c);
  s.dirty = true;
  return c;
}
function restock(s, rng) {
  const on = counts(s.coins);
  const pennies = on['everyday-penny'] || 0;
  if (pennies < 70 && rng() < 0.4) seat(s, 'everyday-penny', 0, rng);
  if (s.restock > 0 && s.restock % 7 === 0) {
    const rare = rng() < 0.18;
    const id = pick(s, rng, rare);
    if (id && id !== 'everyday-penny') {
      seat(s, id, rng() < 0.55 ? 0 : 1, rng);
      s.note = rare ? 'Something rare joined the back of a tray.' : itemName(id) + ' settled at the back.';
    }
  }
}
function pack(layer, rng, ids) {
  const L = LAYERS[layer];
  const out = [];
  const dx = 33, dy = 30;
  let row = 0;
  for (let y = L.back + 46; y <= L.lip - 16; y += dy, row++) {
    const inset = (row % 2) * (dx * 0.5);
    for (let x = L.left + 22 + inset; x <= L.right - 22; x += dx) {
      const id = ids[out.length % ids.length];
      out.push(mint(id, x + (rng() - 0.5) * 3, y + (rng() - 0.5) * 2, layer));
    }
  }
  return out;
}
function topUp(coins, rng) {
  const packed = [
    ...pack(0, rng, ['everyday-penny']),
    ...pack(1, rng, ['everyday-penny']),
    ...pack(2, rng, ['everyday-penny']),
  ];
  for (const p of packed) {
    const L = LAYERS[p.layer];
    if (p.y > L.lip - 48) continue;
    if (coins.some(c => c.layer === p.layer && Math.hypot(c.x - p.x, c.y - p.y) < c.r + p.r + 2)) continue;
    coins.push(p);
  }
}
function fresh(level, rng) {
  const set = SETS[level] || SETS[0];
  const coins = [
    ...pack(0, rng, set.mix0),
    ...pack(1, rng, set.mix1),
    ...pack(2, rng, set.mix2),
  ];
  const seen = [];
  if (set.unique) {
    const L = LAYERS[2];
    coins.push(mint(set.unique, (L.left + L.right) / 2 + (rng() - 0.5) * 90, L.lip - 28, 2));
    seen.push(set.unique);
  }
  if (level >= 3) {
    const L = LAYERS[1];
    coins.push(mint('heart-gear', L.left + 80 + rng() * 200, L.lip - 40, 1));
    seen.push('heart-gear');
  }
  const ammo = 12 + level * 3;
  return {
    level, t: 0, coins, aim: 450, ammo, total: ammo, score: 0, specials: 0,
    cooldown: 0, settle: 0, falling: [], dropped: 0, started: !alleyPlay,
    queue: 0, restock: 0, seen, paid: [], dirty: !!alleyPlay, saveAt: 0, stroke: 0, fly: [],
    note: alleyPlay ? 'The trays wait. A penny from the purse lands, then the plate shoves once.' : 'Drop a penny from the purse.',
  };
}

export default {
  title: 'Copper Falls',
  live: alleyPlay,
  tables: true,
  tableDetail: 'A new set on this table. Walk away whenever you like — this chapter keeps. Dump the purse and the bank is patient.',
  intro: 'Six tables, each a new set. The bank lets a little copper go so you stay. Dump the purse and the table usually wins. Walk away when the lip still looks kind — that table keeps until you come back.',
  instructions: alleyPlay
    ? 'Each chapter is a different cabinet. Drop a penny: the plate shoves once. Sit still and nothing falls. Leave and that chapter’s trays wait. Dump it all and the bank has the longer breath. Cash a booth ticket for a five-penny stack if the purse is empty.'
    : 'Each chapter is a new set. One shove per drop. Workshop scores never enter your wallet.',
  levels: ['The copper tide', 'Moon mint', 'The crowded mint', 'A tide of crowns', 'The midnight mint', 'Pennies in a flood'],
  sprites: SPRITES,
  actions: [
    {id: 'drop', label: alleyPlay ? 'Drop a penny' : 'Drop practice penny'},
    {id: 'dump', label: alleyPlay ? 'Dump the purse' : 'Dump the rest'},
  ],
  persist,
  create(level, rng) {
    const saved = loadMachine(level);
    if (saved && saved.pieces && saved.pieces.length) {
      const s = hydrate(saved);
      s.level = level;
      return s;
    }
    const s = fresh(level, rng);
    persist(s);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    s.cooldown = Math.max(0, s.cooldown - dt);
    const axis = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    s.aim = clamp(s.aim + axis * 230 * dt, 280, 620);
    if (s.queue > 0 && s.cooldown <= 0) {
      dropOne(s, 'everyday-penny', s.aim + (Math.random() - 0.5) * 18);
      s.queue--;
      s.restock += 1;
      s.cooldown = 0.09;
      s.started = true;
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
        for (let i = 0; i < LAYERS.length; i++) {
          const L = LAYERS[i];
          const plate = L.back + 22 + extend * SHOVE;
          const depth = L.lip - L.back || 1;
          for (const c of s.coins) {
            if (c.falling || c.layer !== i) continue;
            if (c.y < plate + c.r) {
              c.y += dPlate;
              c.vy = Math.max(c.vy, dPlate * 80);
            } else {
              const along = clamp((c.y - L.back) / depth, 0, 1);
              const tide = dPlate * (0.06 + 0.16 * along);
              c.y += tide;
              c.vy = Math.max(c.vy, tide * 40);
            }
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
        const L = LAYERS[c.layer] || LAYERS[2];
        if (c.falling) {
          c.vy += 980 * h;
          c.x += c.vx * h;
          c.y += c.vy * h;
          let hit = false;
          for (const o of s.coins) {
            if (o === c || o.falling || o.layer !== c.layer) continue;
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
          } else if (!hit && c.y >= L.back + c.r + 10) {
            c.falling = false;
            c.y = L.back + c.r + 10;
            c.vx = 0;
            c.vy = 0;
          }
          c.x = clamp(c.x, L.left + c.r, L.right - c.r);
          continue;
        }
        c.x += c.vx * h;
        c.y += c.vy * h;
        c.vx *= Math.exp(-7.2 * h);
        c.vy *= Math.exp(-6.4 * h);
        if (c.x < L.left + c.r) { c.x = L.left + c.r; c.vx = Math.abs(c.vx) * 0.2; }
        if (c.x > L.right - c.r) { c.x = L.right - c.r; c.vx = -Math.abs(c.vx) * 0.2; }
        if (c.y < L.back + c.r) { c.y = L.back + c.r; c.vy = Math.max(0, c.vy); }
        if (c.y + c.r > L.lip && !shoving && c.vy < LIP_SPEED) {
          c.y = L.lip - c.r;
          c.vy = 0;
        }
      }
      const groups = [[], [], []];
      for (const c of s.coins) if (!c.falling && groups[c.layer]) groups[c.layer].push(c);
      for (const group of groups) {
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
    }
    const stay = [];
    for (const c of s.coins) {
      if (c.falling) { stay.push(c); continue; }
      const L = LAYERS[c.layer];
      if (c.y + c.r > L.lip && (shoving || c.vy >= LIP_SPEED)) {
        if (!spill(s, c)) continue;
      }
      stay.push(c);
    }
    s.coins = stay;
    for (const c of s.falling) { c.t += dt; c.vy += 520 * dt; c.y += c.vy * dt; }
    s.falling = s.falling.filter(c => c.y < 1240);
    if (s.fly) {
      for (const f of s.fly) f.t += dt;
      s.fly = s.fly.filter(f => f.t < f.dur);
    }
    if (s.dirty && s.t - s.saveAt > 1.4) persist(s);
  },
  pointer(s, type, p) {
    if (type === 'move' || type === 'down') s.aim = clamp(p.x, 280, 620);
    if (type === 'up') drop(s);
  },
  action(s, id) { if (id === 'drop') drop(s); if (id === 'dump') dump(s); },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ') drop(s);
    if (k === 'Enter' || k === 'd' || k === 'D') dump(s);
  },
  draw(s, d) {
    for (let i = 0; i < LAYERS.length; i++) {
      const L = LAYERS[i];
      d.poly([[L.left, L.back], [L.right, L.back], [L.right + 10, L.lip], [L.left - 10, L.lip]], i === 2 ? '#5a3a228e' : '#6a462c88', '#e4c48a', 3);
      d.line({x: L.left + 6, y: L.lip - 2}, {x: L.right - 6, y: L.lip - 2}, '#f0d18f', 5);
      const extend = s.stroke > 0 && s.stroke < 0.7 ? s.stroke / 0.7 : (s.stroke >= 0.7 ? 1 : 0);
      const plate = L.back + 18 + extend * SHOVE;
      d.line({x: L.left + 10, y: plate}, {x: L.right - 10, y: plate}, '#d2b07a', 12);
      d.line({x: L.left + 10, y: plate - 5}, {x: L.right - 10, y: plate - 5}, '#f3ddb0', 3);
    }
    const order = [...s.coins, ...s.falling].sort((a, b) => a.layer - b.layer || a.y - b.y);
    for (const c of order) {
      d.item(spriteKey(c.id), c.x, c.y, {w: c.w, fallback: () => d.ball(c.x, c.y, c.r, c.color)});
    }
    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    const px = 132, py = 148;
    d.item(spriteKey('penny-purse'), px, py, {w: 148, fallback: () => d.heart(px, py, 44, '#6a7a52')});
    const heap = Math.min(Math.max(0, n), 36);
    for (let i = 0; i < heap; i++) {
      const row = Math.floor(i / 7), col = i % 7;
      const hx = px - 48 + col * 15 + row * 4;
      const hy = py + 8 - row * 10 - (col % 2) * 3;
      d.item(spriteKey('everyday-penny'), hx, hy, {w: 24, shadow: false, fallback: () => d.ball(hx, hy, 9, '#b68445')});
    }
    d.text(String(n), px, py + 78, 24, '#fff6d8');
    d.text(n === 1 ? 'penny in the purse' : 'pennies in the purse', px, py + 100, 14, '#ead6a4');
    d.poly([[742, 48], [838, 52], [834, 128], [738, 122]], '#6b3a3a', '#e8d4a0', 2);
    d.text('treasures', 788, 144, 13, '#ead6a4');
    for (const f of (s.fly || [])) {
      const u = Math.min(1, f.t / f.dur);
      const e = 1 - (1 - u) * (1 - u);
      const destX = f.prize ? 780 : px, destY = f.prize ? 90 : py;
      const fx = f.x + (destX - f.x) * e, fy = f.y + (destY - f.y) * e;
      d.item(spriteKey(f.id), fx, fy, {w: Math.max(18, (f.w || 32) * (1 - u * 0.4)), fallback: () => d.ball(fx, fy, 10, f.color || '#b68445')});
    }
    d.poly([[s.aim - 22, 92], [s.aim + 22, 92], [s.aim + 14, 138], [s.aim - 14, 138]], '#8a7450cc', '#ead097', 2);
    d.text('↓', s.aim, 124, 20, '#fff3d0');
    if (alleyPlay && !s.started) d.text('trays still', 450, 72, 18, '#f0d6a8');
  },
  readout: s => {
    const trays = s.coins.filter(c => !c.falling).length;
    const n = alleyPlay ? pocket() : s.ammo;
    if (alleyPlay) {
      return (n == null ? '0' : n) + (n === 1 ? ' penny' : ' pennies') + ' in the purse · ' + trays + ' on the trays · ' + s.score + ' won' + (s.queue ? ' · dumping ' + s.queue : '') + ' · ' + s.note;
    }
    return n + ' / ' + s.total + ' in the purse · ' + trays + ' on the trays · ' + s.score + ' at the docks' + (s.ammo === 0 ? ' · settling' : '') + ' · ' + s.note;
  },
};
