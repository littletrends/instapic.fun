import {clamp} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, credit, keep, loadMachine, saveMachine} from '../wallet.js?v=paper-cashdrop-2';

const DUMP_CAP = 24;
const LIP_SPEED = 26;
const LAYERS = [
  {left: 258, right: 642, back: 188, lip: 448},
  {left: 228, right: 672, back: 478, lip: 768},
  {left: 202, right: 698, back: 798, lip: 1072},
];
const TOKENS = {
  'everyday-penny': {r: 15, w: 32, score: 1, color: '#b68445', weight: 52, cap: 96, token: true},
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
const DEFS = {...TOKENS, ...UNIQUE};
const POOL = Object.entries(DEFS).map(([id, def]) => ({id, ...def}));
const SPRITES = [...Object.keys(DEFS), 'penny-purse'];

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
    v: 2,
    t: s.t,
    aim: s.aim,
    dropped: s.dropped,
    score: s.score,
    specials: s.specials,
    restock: s.restock,
    queue: s.queue,
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
  return {
    level: 0, t: blob.t || 0, coins, aim: blob.aim || 450, ammo: 0, total: 0,
    score: blob.score || 0, specials: blob.specials || 0, cooldown: 0, settle: 0,
    falling: [], dropped: blob.dropped || 0, started: false, queue: blob.queue || 0,
    restock: blob.restock || 0, seen: blob.seen || [], paid: blob.paid || [],
    dirty: false, saveAt: 0, note: 'The trays waited. Drop a penny to wake them.',
  };
}
function persist(s) {
  if (!alleyPlay || !s) return;
  saveMachine(snapshot(s));
  s.dirty = false;
  s.saveAt = s.t;
}
function markSeen(s, id) {
  if (!DEFS[id]?.unique) return;
  if (!s.seen.includes(id)) s.seen.push(id);
}
function payout(s, c) {
  if (c.token || c.score) {
    s.score += c.score;
    if (c.id !== 'everyday-penny') s.specials++;
    if (alleyPlay && c.score) credit(c.score);
  }
  if (c.prize || (c.id !== 'everyday-penny' && !c.token)) {
    if (alleyPlay) keep(c.id);
    if (!s.paid.includes(c.id)) s.paid.push(c.id);
  } else if (c.id !== 'everyday-penny' && alleyPlay) keep(c.id);
  s.falling.push({...c, falling: true, vy: 90, t: 0});
  s.dirty = true;
  s.note = c.prize
    ? itemName(c.id) + ' slipped the last lip!'
    : c.id === 'everyday-penny' ? 'A penny for the docks.' : itemName(c.id) + ' crossed the lip.';
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
  if (pennies < 28 && rng() < 0.45) seat(s, 'everyday-penny', 0, rng);
  if (s.restock > 0 && s.restock % 7 === 0) {
    const rare = rng() < 0.18;
    const id = pick(s, rng, rare);
    if (id && id !== 'everyday-penny') {
      seat(s, id, rng() < 0.55 ? 0 : 1, rng);
      s.note = rare ? 'Something rare joined the back of a tray.' : itemName(id) + ' settled at the back.';
    }
  }
}
function scatter(layer, n, rng, ids) {
  const L = LAYERS[layer];
  const out = [];
  const cols = Math.max(3, Math.ceil(Math.sqrt(n * 1.7)));
  const rows = Math.max(1, Math.ceil(n / cols));
  const dx = (L.right - L.left - 56) / Math.max(1, cols - 1);
  const dy = (L.lip - L.back - 100) / Math.max(1, rows);
  for (let i = 0; i < n; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const x = L.left + 28 + col * dx + (rng() - 0.5) * 6;
    const y = L.back + 48 + row * dy + (rng() - 0.5) * 6;
    out.push(mint(ids[i % ids.length], x, y, layer));
  }
  return out;
}
function fresh(level, rng) {
  const coins = [
    ...scatter(0, alleyPlay ? 18 : 14 + level * 2, rng, ['everyday-penny', 'everyday-penny', 'everyday-penny', 'moon-penny']),
    ...scatter(1, alleyPlay ? 22 : 16 + level * 2, rng, ['everyday-penny', 'everyday-penny', 'rose-penny', 'star-token']),
    ...scatter(2, alleyPlay ? 20 : 14 + level, rng, ['everyday-penny', 'everyday-penny', 'crown-token', 'pressed-heart']),
  ];
  const seen = [];
  if (alleyPlay) {
    const rare = pick({coins, seen, paid: []}, rng, true);
    if (rare) {
      const L = LAYERS[2];
      coins.push(mint(rare, (L.left + L.right) / 2 + (rng() - 0.5) * 80, L.lip - 22, 2));
      seen.push(rare);
    }
  }
  const ammo = 12 + level * 3;
  return {
    level, t: 0, coins, aim: 450, ammo, total: ammo, score: 0, specials: 0,
    cooldown: 0, settle: 0, falling: [], dropped: 0, started: !alleyPlay,
    queue: 0, restock: 0, seen, paid: [], dirty: !!alleyPlay, saveAt: 0,
    note: alleyPlay ? 'The trays wait. Pennies from your purse knock the pile.' : 'Drop a penny from the purse.',
  };
}

export default {
  title: 'Copper Falls',
  live: alleyPlay,
  intro: 'Your purse holds the pennies. Drop one — or dump the lot — onto the trays. Nothing moves until a penny lands on the pile and knocks it forward. What slips the last lip is yours, and the trays remember if you walk away.',
  instructions: alleyPlay
    ? 'Aim, then drop a penny from your purse or dump the purse (up to twenty-four). Trays do not run on their own: coins only shuffle when a dropped penny lands on them. Knock a piece over the last lip and it is yours. Leave and come back — the pile stays. Cash a booth ticket at the bar for a five-penny stack.'
    : 'Aim, drop a penny from the purse or dump the rest. Trays stay still until a penny lands on the pile. Workshop scores never enter your wallet.',
  levels: ['The copper tide', 'Moon mint', 'The crowded mint', 'A tide of crowns', 'The midnight mint', 'Pennies in a flood'],
  sprites: SPRITES,
  actions: [
    {id: 'drop', label: alleyPlay ? 'Drop a penny' : 'Drop practice penny'},
    {id: 'dump', label: alleyPlay ? 'Dump the purse' : 'Dump the rest'},
  ],
  persist,
  create(level, rng) {
    if (alleyPlay) {
      const saved = loadMachine();
      if (saved && saved.pieces && saved.pieces.length) return hydrate(saved);
    }
    const s = fresh(level, rng);
    if (alleyPlay) persist(s);
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
    const busy = s.queue > 0 || s.coins.some(c => c.falling || c.vx * c.vx + c.vy * c.vy > 2.2);
    if (!busy) {
      for (const c of s.coins) { c.vx = 0; c.vy = 0; }
      if (alleyPlay && s.dirty && s.t - s.saveAt > 1.2) persist(s);
      if (!alleyPlay && s.ammo === 0 && s.queue === 0) {
        s.settle -= dt;
        if (s.settle <= 0) s.result = {
          title: 'The mint has settled',
          detail: s.score + ' from the docks' + (s.specials ? ', including ' + s.specials + ' specials' : '') + '. A local workshop score, not wallet winnings.',
        };
      }
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
        if (c.y + c.r > L.lip && c.vy < LIP_SPEED) {
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
      if (c.y + c.r > L.lip && c.vy >= LIP_SPEED) {
        if (!spill(s, c)) continue;
      }
      stay.push(c);
    }
    s.coins = stay;
    for (const c of s.falling) { c.t += dt; c.vy += 520 * dt; c.y += c.vy * dt; }
    s.falling = s.falling.filter(c => c.y < 1240);
    if (alleyPlay && s.dirty && s.t - s.saveAt > 1.4) persist(s);
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
      d.line({x: L.left + 8, y: L.back + 8}, {x: L.right - 8, y: L.back + 8}, '#c9a56a88', 6);
    }
    const order = [...s.coins, ...s.falling].sort((a, b) => a.layer - b.layer || a.y - b.y);
    for (const c of order) {
      d.item(spriteKey(c.id), c.x, c.y, {w: c.w, fallback: () => d.ball(c.x, c.y, c.r, c.color)});
    }
    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    d.item(spriteKey('penny-purse'), 126, 132, {w: 118, fallback: () => d.heart(126, 132, 36, '#6a7a52')});
    const show = Math.min(n, 8);
    for (let i = 0; i < show; i++) {
      d.item(spriteKey('everyday-penny'), 92 + i * 8, 154 - (i % 3) * 4, {w: 20, shadow: false, fallback: () => d.ball(92 + i * 8, 154, 8, '#b68445')});
    }
    d.text(String(n), 126, 198, 22, '#fff6d8');
    d.text(n === 1 ? 'penny in the purse' : 'pennies in the purse', 126, 218, 13, '#ead6a4');
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
