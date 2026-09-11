import {clamp} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, credit, keep, loadMachine, saveMachine} from '../wallet.js?v=paper-cashdrop-1';

const DUMP_CAP = 24;
const LAYERS = [
  {left: 258, right: 642, back: 188, lip: 448, p0: 202, p1: 292},
  {left: 228, right: 672, back: 478, lip: 768, p0: 494, p1: 588},
  {left: 202, right: 698, back: 798, lip: 1072, p0: 814, p1: 912},
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
const SPRITES = Object.keys(DEFS);

function boomY(L, t, i) {
  const wave = Math.sin(t * 1.32 + i * 0.85) * 0.5 + 0.5;
  return L.p0 + wave * (L.p1 - L.p0);
}
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
    v: 1,
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
    c.vx = p.vx || 0;
    c.vy = p.vy || 0;
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
  const piece = mint(id, clamp(x, L.left + 20, L.right - 20), L.back + 36, 0);
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
  s.note = 'A penny at the lock.';
}
function dump(s) {
  if (s.cooldown > 0 && s.queue > 0) return;
  const have = alleyPlay ? (pocket() || 0) : s.ammo;
  const take = Math.min(DUMP_CAP, Math.max(0, have | 0));
  if (take < 1) {
    s.note = alleyPlay ? 'The pocket is empty. Cash a ticket for a five-penny stack.' : 'No practice pennies left.';
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
  s.note = take === 1 ? 'One penny into the lock.' : take + ' pennies dumped into the lock.';
}
function restock(s, rng) {
  const on = counts(s.coins);
  const pennies = on['everyday-penny'] || 0;
  if (pennies < 28 && rng() < 0.55) {
    const L = LAYERS[0];
    dropOne(s, 'everyday-penny', L.left + 40 + rng() * (L.right - L.left - 80));
  }
  if (s.restock > 0 && s.restock % 7 === 0) {
    const rare = rng() < 0.18;
    const id = pick(s, rng, rare);
    if (id && id !== 'everyday-penny') {
      const L = LAYERS[rng() < 0.55 ? 0 : 1];
      dropOne(s, id, L.left + 50 + rng() * (L.right - L.left - 100));
      s.note = rare ? 'Something rare joined the trays.' : itemName(id) + ' drifted onto the trays.';
    }
  }
}
function scatter(layer, n, rng, ids) {
  const L = LAYERS[layer];
  const out = [];
  for (let i = 0; i < n; i++) {
    const id = ids[i % ids.length];
    const x = L.left + 28 + rng() * (L.right - L.left - 56);
    const y = L.back + 55 + rng() * (L.lip - L.back - 90);
    out.push(mint(id, x, y, layer));
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
      coins.push(mint(rare, (L.left + L.right) / 2 + (rng() - 0.5) * 80, L.lip - 36, 2));
      seen.push(rare);
    }
  }
  const ammo = 12 + level * 3;
  return {
    level, t: 0, coins, aim: 450, ammo, total: ammo, score: 0, specials: 0,
    cooldown: 0, settle: 0, falling: [], dropped: 0, started: !alleyPlay,
    queue: 0, restock: 0, seen, paid: [], dirty: !!alleyPlay, saveAt: 0,
    note: alleyPlay ? 'The trays wait. Drop a penny, or dump the pocket.' : 'Drop a penny at the lock.',
  };
}

export default {
  title: 'Copper Falls',
  live: alleyPlay,
  intro: 'Three brass trays, one lock. Drop a penny or dump the pocket. The tide pushes each shelf into the next. What slips the last lip is yours — and the trays remember if you walk away.',
  instructions: alleyPlay
    ? 'Aim the chute, then drop one penny or dump the pocket (up to twenty-four). Each tray pushes toward the next. Pennies that leave the last lip return to your pocket; keepsakes are kept. The machine sleeps until the first drop this visit, so a rare hanging on the edge stays put while you go and find more pennies. Trays are saved when you leave. Cash a booth ticket at the bar for a five-penny stack.'
    : 'Aim the chute, drop a penny or dump the rest. Three trays push toward the docks. Workshop scores never enter your wallet, and the trays reset when you start again.',
  levels: ['The copper tide', 'Moon mint', 'The crowded mint', 'A tide of crowns', 'The midnight mint', 'Pennies in a flood'],
  sprites: SPRITES,
  actions: [
    {id: 'drop', label: alleyPlay ? 'Drop a penny' : 'Drop practice penny'},
    {id: 'dump', label: alleyPlay ? 'Dump the pocket' : 'Dump the rest'},
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
    const rng = Math.random;
    if (s.restock && s.restock % 7 === 0) {
      restock(s, rng);
      s.restock += 0.001;
    }
    const booms = LAYERS.map((L, i) => boomY(L, s.t, i));
    for (let step = 0; step < 3; step++) {
      const h = dt / 3;
      for (const c of s.coins) {
        if (c.falling) {
          c.vy += 820 * h;
          c.y += c.vy * h;
          c.x += c.vx * h;
          const L = LAYERS[c.layer];
          if (c.y >= L.back + 48) {
            c.falling = false;
            c.y = L.back + 52;
            c.vy = 20;
            c.x = clamp(c.x, L.left + c.r + 4, L.right - c.r - 4);
          }
          continue;
        }
        const L = LAYERS[c.layer] || LAYERS[2];
        const boom = booms[c.layer];
        c.x += c.vx * h;
        c.y += c.vy * h;
        c.vx *= Math.exp(-2.6 * h);
        c.vy *= Math.exp(-2.6 * h);
        if (c.y > boom + c.r + 8) c.vy += 16 * h;
        if (c.y < boom + c.r) {
          c.y = boom + c.r;
          c.vy = Math.max(c.vy, 88 * Math.max(0, Math.cos(s.t * 1.32 + c.layer * 0.85)));
        }
        if (c.x < L.left + c.r) { c.x = L.left + c.r; c.vx = Math.abs(c.vx) * 0.4; }
        if (c.x > L.right - c.r) { c.x = L.right - c.r; c.vx = -Math.abs(c.vx) * 0.4; }
        if (c.y < L.back + c.r) { c.y = L.back + c.r; c.vy = Math.max(c.vy, 0); }
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
              const impulse = -relative * 0.52;
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
      if (c.y > L.lip - 6) {
        if (!spill(s, c)) continue;
      }
      stay.push(c);
    }
    s.coins = stay;
    for (const c of s.falling) { c.t += dt; c.vy += 520 * dt; c.y += c.vy * dt; }
    s.falling = s.falling.filter(c => c.y < 1240);
    if (alleyPlay && s.dirty && s.t - s.saveAt > 1.4) persist(s);
    if (!alleyPlay && s.ammo === 0 && s.queue === 0) {
      s.settle -= dt;
      if (s.settle <= 0) s.result = {
        title: 'The mint has settled',
        detail: s.score + ' from the docks' + (s.specials ? ', including ' + s.specials + ' specials' : '') + '. A local workshop score, not wallet winnings.',
      };
    }
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
      const L = LAYERS[i], boom = boomY(L, s.t, i);
      d.poly([[L.left, L.back], [L.right, L.back], [L.right + 10, L.lip], [L.left - 10, L.lip]], i === 2 ? '#5a3a228e' : '#6a462c88', '#e4c48a', 3);
      d.line({x: L.left + 6, y: L.lip - 2}, {x: L.right - 6, y: L.lip - 2}, '#f0d18f', 4);
      d.line({x: L.left + 10, y: boom}, {x: L.right - 10, y: boom}, '#c9a56a', 13);
      d.line({x: L.left + 10, y: boom - 5}, {x: L.right - 10, y: boom - 5}, '#f3ddb0', 3);
    }
    const order = [...s.coins, ...s.falling].sort((a, b) => a.layer - b.layer || a.y - b.y);
    for (const c of order) {
      d.item(spriteKey(c.id), c.x, c.y, {w: c.w, fallback: () => d.ball(c.x, c.y, c.r, c.color)});
    }
    d.poly([[s.aim - 22, 118], [s.aim + 22, 118], [s.aim + 14, 172], [s.aim - 14, 172]], '#8a7450cc', '#ead097', 2);
    d.text('↓', s.aim, 158, 22, '#fff3d0');
    if (alleyPlay && !s.started) d.text('sleeping trays', 450, 84, 18, '#f0d6a8');
  },
  readout: s => {
    const trays = s.coins.filter(c => !c.falling).length;
    if (alleyPlay) {
      const n = pocket();
      return (n == null ? '0' : n) + (n === 1 ? ' penny' : ' pennies') + ' in your pocket · ' + trays + ' on the trays · ' + s.score + ' won' + (s.queue ? ' · dumping ' + s.queue : '') + ' · ' + s.note;
    }
    return s.ammo + ' / ' + s.total + ' drops left · ' + trays + ' on the trays · ' + s.score + ' at the docks' + (s.ammo === 0 ? ' · settling' : '') + ' · ' + s.note;
  },
};
