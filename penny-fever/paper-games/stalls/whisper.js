import {clamp, done} from '../draw.js?v=ink-1';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep} from '../wallet.js?v=willa-post-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const BOOK = 'pennyFever.lostLetter';
const DUMP_CAP = 24;
const LIP_SPEED = 16;
const STROKE = 0.42;
const SHOVE = 74;
const FAN_COOL = 0.9;
const SHELVES = [
  {left: 250, right: 650, back: 248, lip: 478},
  {left: 226, right: 674, back: 508, lip: 758},
  {left: 204, right: 696, back: 792, lip: 1058},
];
const SETS = [
  {mix0: ['trade-envelope'], mix1: ['trade-envelope'], mix2: ['trade-envelope'], unique: 'whisper-charm', prize: 'whisper-charm'},
  {mix0: ['trade-envelope', 'sealed-secret'], mix1: ['trade-envelope'], mix2: ['trade-envelope', 'sealed-secret'], unique: 'charm-pouch', prize: 'charm-pouch'},
  {mix0: ['trade-envelope', 'return-postcard'], mix1: ['trade-envelope', 'sealed-secret'], mix2: ['return-postcard'], unique: 'secret-keeper', prize: 'secret-keeper'},
  {mix0: ['trade-envelope', 'message-bottle'], mix1: ['sealed-secret', 'return-postcard'], mix2: ['message-bottle', 'trade-envelope'], unique: 'surprise-parcel', prize: 'surprise-parcel'},
  {mix0: ['trade-envelope', 'sealed-secret', 'return-postcard'], mix1: ['message-bottle', 'sealed-secret'], mix2: ['return-postcard', 'sealed-secret'], unique: 'stamp-passport', prize: 'stamp-passport'},
  {mix0: ['trade-envelope', 'message-bottle'], mix1: ['sealed-secret', 'return-postcard', 'trade-envelope'], mix2: ['message-bottle', 'return-postcard'], unique: 'lost-and-found-tag', prize: 'lost-and-found-tag'},
];
const MAIL = {
  'trade-envelope': {r: 17, w: 38, color: '#e8d4a8', symbol: '♥', weight: 48, cap: 90},
  'sealed-secret': {r: 17, w: 40, color: '#c4b0c8', symbol: '★', weight: 8, cap: 8},
  'return-postcard': {r: 16, w: 36, color: '#d4c090', symbol: '☾', weight: 7, cap: 6},
  'message-bottle': {r: 17, w: 40, color: '#a8b8a0', symbol: '✧', weight: 5, cap: 4},
};
const CHAPTER_ITEMS = {
  'whisper-charm': {r: 21, w: 48, color: '#c090a0', symbol: '♡', unique: true, prize: true},
  'charm-pouch': {r: 21, w: 48, color: '#c09088', symbol: '❀', unique: true, prize: true},
  'secret-keeper': {r: 22, w: 50, color: '#9a7a9a', symbol: '✦', unique: true, prize: true},
  'surprise-parcel': {r: 22, w: 50, color: '#c4a46a', symbol: '▣', unique: true, prize: true},
  'stamp-passport': {r: 21, w: 48, color: '#8a9a6a', symbol: '✉', unique: true, prize: true},
  'lost-and-found-tag': {r: 20, w: 46, color: '#b68445', symbol: '⌂', unique: true, prize: true},
};
const DEFS = {...MAIL, ...CHAPTER_ITEMS};
const POOL = Object.entries(MAIL).map(([id, def]) => ({id, ...def}));
const SPRITES = [
  'everyday-penny', 'penny-purse', 'trade-envelope', 'sealed-secret', 'return-postcard',
  'message-bottle', 'charm-pouch', 'whisper-charm', 'secret-keeper', 'surprise-parcel',
  'stamp-passport', 'lost-and-found-tag',
];
const ISLANDS = [
  {x: 168, y: 156, symbol: '♥'},
  {x: 450, y: 108, symbol: '★'},
  {x: 732, y: 156, symbol: '☾'},
];

function symbolOf(id) {
  return DEFS[id]?.symbol || '♥';
}
function islandFor(level) {
  return ISLANDS[level % ISLANDS.length];
}
function mint(id, x, y, layer) {
  const def = DEFS[id] || DEFS['trade-envelope'];
  return {
    id, x, y, layer, vx: 0, vy: 0,
    r: def.r, w: def.w, color: def.color,
    unique: !!def.unique, prize: !!def.prize, falling: false,
  };
}
function counts(mail) {
  const n = {};
  for (const c of mail) if (!c.falling) n[c.id] = (n[c.id] || 0) + 1;
  return n;
}
function pickMail(s, rng) {
  const on = counts(s.mail);
  const options = POOL.filter(def => !def.cap || (on[def.id] || 0) < def.cap);
  const pool = options.length ? options : POOL;
  let total = 0;
  for (const o of pool) total += o.weight;
  let roll = rng() * total;
  for (const o of pool) {
    roll -= o.weight;
    if (roll <= 0) return o.id;
  }
  return pool[pool.length - 1].id;
}
function snapshot(s) {
  return {
    v: 1,
    chapter: s.level || 0,
    t: s.t,
    aim: s.aim,
    dropped: s.dropped,
    score: s.score,
    restock: s.restock,
    queue: s.queue,
    seen: s.seen.slice(),
    paid: s.paid.slice(),
    claim: s.claim ? {id: s.claim.id, x: +s.claim.x.toFixed(2), y: +s.claim.y.toFixed(2), vx: +s.claim.vx.toFixed(2), vy: +s.claim.vy.toFixed(2)} : null,
    pieces: s.mail.filter(c => !c.falling).map(c => ({
      id: c.id, x: +c.x.toFixed(2), y: +c.y.toFixed(2),
      vx: +c.vx.toFixed(2), vy: +c.vy.toFixed(2), layer: c.layer,
    })),
  };
}
function plantPrize(mail, level, rng) {
  const set = SETS[level] || SETS[0];
  const id = set.unique || set.prize;
  if (!id) return;
  if (mail.some(c => !c.falling && (c.id === id || c.id === set.prize))) return;
  const layer = 1;
  const L = SHELVES[layer];
  mail.push(mint(id,
    (L.left + L.right) / 2 + (rng() - 0.5) * 48,
    L.back + (L.lip - L.back) * 0.42 + (rng() - 0.5) * 18,
    layer));
}
function readStore() {
  if (typeof localStorage === 'undefined') return {v: 1, tables: {}};
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1 && blob.tables) return blob;
  } catch { /* ignore */ }
  return {v: 1, tables: {}};
}
function loadPost(chapter = 0) {
  const row = readStore().tables[String(chapter)];
  if (row && Array.isArray(row.pieces) && row.pieces.length) return row;
  return null;
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
function hydrate(blob) {
  const mail = (blob.pieces || []).map(p => {
    const c = mint(p.id, p.x, p.y, p.layer | 0);
    const L = SHELVES[c.layer] || SHELVES[2];
    c.x = clamp(c.x, L.left + c.r + 2, L.right - c.r - 2);
    c.y = clamp(c.y, L.back + c.r + 4, L.lip - c.r - 3);
    c.vx = 0;
    c.vy = 0;
    return c;
  });
  if (mail.length < 28) topUp(mail, Math.random);
  plantPrize(mail, blob.chapter || 0, Math.random);
  const claim = blob.claim ? {
    id: blob.claim.id, x: blob.claim.x, y: blob.claim.y,
    vx: blob.claim.vx || 0, vy: blob.claim.vy || -420,
    w: (DEFS[blob.claim.id] || {}).w || 48,
    color: (DEFS[blob.claim.id] || {}).color || '#c090a0',
    r: (DEFS[blob.claim.id] || {}).r || 21,
  } : null;
  return {
    level: blob.chapter || 0, t: blob.t || 0, mail, aim: blob.aim || 450, ammo: 0, total: 0,
    score: blob.score || 0, cooldown: 0, coolFan: 0, gust: 0, dropped: blob.dropped || 0,
    started: false, queue: blob.queue || 0, restock: blob.restock || 0,
    seen: blob.seen || [], paid: blob.paid || [], dirty: false, saveAt: 0, stroke: 0, fly: [],
    claim, pendingWin: null,
    note: claim ? 'A secret is still on the breeze. Trim it home.' : 'The pigeonholes waited. Stamp postage to wake them.',
  };
}
function startStroke(s) {
  s.stroke = 0.001;
  s.started = true;
}
function flyHome(s, c, dest) {
  s.fly = s.fly || [];
  s.fly.push({
    id: c.id, x: c.x, y: c.y, w: c.w, color: c.color, t: 0, dur: 0.72,
    destX: dest.x, destY: dest.y, prize: !!c.prize,
  });
}
function seat(s, id, layer, rng) {
  const L = SHELVES[layer];
  const c = mint(id, L.left + 36 + rng() * (L.right - L.left - 72), L.back + 40 + rng() * 36, layer);
  c.vx = 0; c.vy = 0; c.falling = false;
  s.mail.push(c);
  s.dirty = true;
  return c;
}
function launchSecret(s, c) {
  const island = islandFor(s.level);
  const toward = (island.x - c.x) * 0.35;
  s.claim = {
    id: c.id, x: c.x, y: Math.min(c.y, 980),
    vx: clamp(toward, -160, 160), vy: -560,
    w: c.w, color: c.color, r: c.r,
  };
  s.note = 'A secret caught the breeze — trim Left/Right to the glowing letterbox.';
  s.dirty = true;
}
function deliverOrdinary(s, c) {
  const island = ISLANDS[(c.x < 380 ? 0 : c.x > 520 ? 2 : 1)];
  flyHome(s, c, island);
  s.score += 1;
  s.dirty = true;
  s.note = c.id === 'trade-envelope'
    ? 'A letter took the scenic route home.'
    : itemName(c.id) + ' delivered.';
}
function claimSecret(s) {
  const set = SETS[s.level] || SETS[0];
  const prize = set.prize;
  const letter = s.claim;
  s.claim = null;
  if (alleyPlay) keep(prize, 'whisper');
  takePrize(s, prize);
  if (!s.paid.includes(prize)) s.paid.push(prize);
  flyHome(s, {id: prize, x: letter.x, y: letter.y, w: letter.w, color: letter.color, prize: true}, {x: 792, y: 86});
  s.pendingWin = {prize, at: s.t};
  s.note = itemName(prize) + ' found its island — into the treasure book!';
  s.dirty = true;
}
function returnSecret(s, note) {
  const letter = s.claim;
  s.claim = null;
  if (!letter) return;
  const c = mint(letter.id, letter.x, letter.y, 1);
  const L = SHELVES[1];
  c.x = clamp(letter.x, L.left + c.r + 8, L.right - c.r - 8);
  c.y = L.back + c.r + 16;
  c.falling = false;
  s.mail.push(c);
  s.note = note || 'The breeze brought the secret back. Shove it off again.';
  s.dirty = true;
}
function spill(s, c) {
  if (c.layer >= 2) {
    if (c.prize || c.unique) launchSecret(s, c);
    else deliverOrdinary(s, c);
    return false;
  }
  c.layer += 1;
  c.falling = true;
  c.vy = 80;
  c.vx *= 0.4;
  s.note = c.prize ? itemName(c.id) + ' dropped a pigeonhole.' : 'The post moved down a shelf.';
  return true;
}
function dropOne(s, id, x) {
  const L = SHELVES[0];
  const piece = mint(id, clamp(x, L.left + 22, L.right - 22), 168, 0);
  piece.falling = true;
  piece.vy = 240;
  s.mail.push(piece);
  s.dirty = true;
}
function stamp(s) {
  if (s.claim) {
    s.note = 'Willa is watching that secret. Trim it home first.';
    return;
  }
  if (s.cooldown > 0) return;
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny for postage. Cash a booth ticket for a five-penny stack.';
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
  dropOne(s, 'trade-envelope', s.aim);
  startStroke(s);
  s.restock += 1;
  s.note = 'Postage stamped. The press shoves.';
}
function dump(s) {
  if (s.claim) {
    s.note = 'Finish the secret on the breeze first.';
    return;
  }
  if (s.cooldown > 0 && s.queue > 0) return;
  const have = alleyPlay ? (pocket() || 0) : s.ammo;
  const take = Math.min(DUMP_CAP, Math.max(0, have | 0));
  if (take < 1) {
    s.note = alleyPlay ? 'The satchel is empty. Cash a ticket for a five-penny stack.' : 'No practice postage left.';
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
  s.note = take === 1 ? 'One stamp from the satchel.' : take + ' letters dumped from the satchel.';
}
function fan(s) {
  if (s.coolFan > 0) return;
  if (!s.started && !s.claim) {
    s.note = 'Stamp postage first — the cabinet is still.';
    return;
  }
  s.coolFan = FAN_COOL;
  const dir = Math.sin(s.t * 0.7) >= 0 ? 1 : -1;
  const burst = dir * (240 + s.level * 28);
  if (s.claim) s.claim.vx += dir * 90;
  for (const c of s.mail) {
    if (c.falling) continue;
    const L = SHELVES[c.layer] || SHELVES[2];
    const along = clamp((c.y - L.back) / (L.lip - L.back || 1), 0, 1);
    c.vx += burst * (0.35 + 0.65 * along);
  }
  s.note = dir > 0 ? 'A gust to the right — the scenic route.' : 'A gust to the left — the scenic route.';
  s.dirty = true;
}
function restock(s, rng) {
  const on = counts(s.mail);
  const letters = on['trade-envelope'] || 0;
  if (letters < 36 && rng() < 0.4) seat(s, 'trade-envelope', 0, rng);
  if (s.restock > 0 && s.restock % 7 === 0) {
    const id = pickMail(s, rng);
    if (id && id !== 'trade-envelope') {
      seat(s, id, rng() < 0.55 ? 0 : 1, rng);
      s.note = itemName(id) + ' settled at the back of a pigeonhole.';
    }
    const set = SETS[s.level] || SETS[0];
    const hasPrize = s.mail.some(c => !c.falling && (c.id === set.prize || c.id === set.unique)) || (s.claim && (s.claim.id === set.prize || s.claim.id === set.unique));
    if (!hasPrize) plantPrize(s.mail, s.level, rng);
  }
}
function pack(layer, rng, ids) {
  const L = SHELVES[layer];
  const out = [];
  const dx = 38, dy = 34;
  let row = 0;
  for (let y = L.back + 44; y <= L.lip - 18; y += dy, row++) {
    const inset = (row % 2) * (dx * 0.5);
    for (let x = L.left + 24 + inset; x <= L.right - 24; x += dx) {
      const id = ids[out.length % ids.length];
      out.push(mint(id, x + (rng() - 0.5) * 3, y + (rng() - 0.5) * 2, layer));
    }
  }
  return out;
}
function topUp(mail, rng) {
  const packed = [
    ...pack(0, rng, ['trade-envelope']),
    ...pack(1, rng, ['trade-envelope']),
    ...pack(2, rng, ['trade-envelope']),
  ];
  for (const p of packed) {
    const L = SHELVES[p.layer];
    if (p.y > L.lip - 48) continue;
    if (mail.some(c => c.layer === p.layer && Math.hypot(c.x - p.x, c.y - p.y) < c.r + p.r + 2)) continue;
    mail.push(p);
  }
}
function fresh(level, rng) {
  const set = SETS[level] || SETS[0];
  const mail = [
    ...pack(0, rng, set.mix0),
    ...pack(1, rng, set.mix1),
    ...pack(2, rng, set.mix2),
  ];
  const seen = [];
  plantPrize(mail, level, rng);
  const prizeId = set.unique || set.prize;
  if (prizeId) seen.push(prizeId);
  const ammo = 12 + level * 3;
  return {
    level, t: 0, mail, aim: 450, ammo, total: ammo, score: 0,
    cooldown: 0, coolFan: 0, gust: 0, dropped: 0, started: !alleyPlay,
    queue: 0, restock: 0, seen, paid: [], dirty: !!alleyPlay, saveAt: 0, stroke: 0, fly: [],
    claim: null, pendingWin: null, settle: 0,
    note: alleyPlay
      ? 'The secret is in the pigeonholes. Stamp postage to shove it, then trim it home.'
      : 'Stamp a practice letter. Shove the secret off a lip, then fly it to the glowing island.',
  };
}

export default {
  title: 'Lost Letter Express',
  live: alleyPlay,
  tables: true,
  chapterEnds: false,
  tableDetail: 'A new set of pigeonholes. Walk away whenever you like — this chapter’s mail keeps. Dump the satchel and the office is patient.',
  intro: 'Willa’s Lost Letter Express. Six cabinets of waiting mail. A penny stamps postage and the press shoves the pigeonholes. The chapter’s secret sits in the tide — shove it off a lip, then trim it through the breeze to the glowing island.',
  instructions: alleyPlay
    ? 'Aim the stamp, then drop a penny of postage: the press shoves once. Fan the breeze to slide mail sideways. Sit still and nothing falls. When the secret leaves a lip, trim Left/Right to the glowing letterbox. Leave and that chapter’s mail waits. Dump the satchel if you dare. Cash a booth ticket for a five-penny stack if the purse is empty.'
    : 'Each chapter is a new cabinet. One shove per practice stamp. Fan the breeze. Fly the secret to the glowing island. Workshop scores never enter your wallet.',
  levels: ['The morning post', 'Crosswinds', 'The late-night express', 'A gale of envelopes', 'Islands adrift', 'The last bottle home'],
  sprites: SPRITES,
  prizes: SETS.map(set => set.prize),
  actions: [
    {id: 'stamp', label: alleyPlay ? 'Stamp postage · 1 penny' : 'Stamp a practice letter'},
    {id: 'fan', label: 'Fan the breeze'},
    {id: 'dump', label: alleyPlay ? 'Dump the satchel' : 'Dump the rest'},
  ],
  persist,
  create(level, rng) {
    const roll = rng || Math.random;
    const saved = loadPost(level);
    if (saved && saved.pieces && saved.pieces.length >= 28) {
      const s = hydrate(saved);
      s.level = level;
      if (!alleyPlay) {
        s.ammo = 12 + level * 3;
        s.total = s.ammo;
        s.started = true;
      }
      plantPrize(s.mail, level, roll);
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
    s.coolFan = Math.max(0, s.coolFan - dt);
    const axis = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    if (!s.claim) s.aim = clamp(s.aim + axis * 230 * dt, 270, 630);

    if (s.pendingWin && !s.result && s.t - s.pendingWin.at > 0.7) {
      const prize = s.pendingWin.prize;
      s.pendingWin = null;
      done(s, 'A secret found its way', itemName(prize) + ' is Willa’s to keep no longer — it is yours.', {prize, won: true});
    }

    if (s.claim) {
      const p = s.claim;
      const trim = axis;
      const wind = Math.sin(s.t * 0.65) * (22 + s.level * 10);
      p.vx += (wind + trim * 150) * dt;
      p.vy += 92 * dt;
      p.vx *= Math.exp(-0.08 * dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const island = islandFor(s.level);
      if (Math.hypot(p.x - island.x, p.y - island.y) < 52) {
        claimSecret(s);
      } else if (p.x < 40 || p.x > 860 || p.y < 40 || p.y > 1188) {
        returnSecret(s, 'The breeze brought it back. Shove it off again, then trim sooner.');
      }
    }

    if (s.queue > 0 && s.cooldown <= 0 && !s.claim) {
      dropOne(s, 'trade-envelope', s.aim + (Math.random() - 0.5) * 18);
      s.queue--;
      s.restock += 1;
      s.cooldown = 0.09;
      s.started = true;
    }

    if (s.fly) {
      for (const f of s.fly) f.t += dt;
      s.fly = s.fly.filter(f => f.t < f.dur);
    }

    if (alleyPlay && !s.started) {
      if (s.dirty && s.t - s.saveAt > 1.2) persist(s);
      return;
    }

    const breeze = Math.sin(s.t * 0.7) * (14 + s.level * 7);
    const shoving = s.stroke > 0 && s.stroke < 0.7;
    if (s.stroke > 0) {
      const was = s.stroke;
      s.stroke += dt / STROKE;
      const t = clamp(s.stroke, 0, 1);
      const extend = t < 0.7 ? t / 0.7 : 1;
      const prev = was < 0.7 ? was / 0.7 : 1;
      if (extend > prev) {
        const dPlate = (extend - prev) * SHOVE;
        for (let i = 0; i < SHELVES.length; i++) {
          const L = SHELVES[i];
          const plate = L.back + 22 + extend * SHOVE;
          const depth = L.lip - L.back || 1;
          for (const c of s.mail) {
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

    const busy = s.queue > 0 || s.stroke > 0 || s.claim || s.mail.some(c => c.falling || c.vx * c.vx + c.vy * c.vy > 2.2);
    if (!busy) {
      for (const c of s.mail) { c.vx = 0; c.vy = 0; }
      if (s.dirty && s.t - s.saveAt > 1.2) persist(s);
      return;
    }

    if (s.restock && s.restock % 7 === 0) {
      restock(s, Math.random);
      s.restock += 0.001;
    }

    for (let step = 0; step < 3; step++) {
      const h = dt / 3;
      for (const c of s.mail) {
        const L = SHELVES[c.layer] || SHELVES[2];
        if (c.falling) {
          c.vy += 980 * h;
          c.x += c.vx * h;
          c.y += c.vy * h;
          let hit = false;
          for (const o of s.mail) {
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
        c.x += (c.vx + breeze * 0.35) * h;
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
      for (const c of s.mail) if (!c.falling && groups[c.layer]) groups[c.layer].push(c);
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
    for (const c of s.mail) {
      if (c.falling) { stay.push(c); continue; }
      const L = SHELVES[c.layer];
      if (c.y + c.r > L.lip && (shoving || c.vy >= LIP_SPEED)) {
        if (!spill(s, c)) continue;
      }
      stay.push(c);
    }
    s.mail = stay;
    if (s.dirty && s.t - s.saveAt > 1.4) persist(s);
  },
  pointer(s, type, p) {
    if (s.claim) return;
    if (type === 'move' || type === 'down') s.aim = clamp(p.x, 270, 630);
    if (type === 'up') stamp(s);
  },
  action(s, id) {
    if (id === 'stamp') stamp(s);
    if (id === 'dump') dump(s);
    if (id === 'fan') fan(s);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ') stamp(s);
    if (k === 'Enter' || k === 'd' || k === 'D') dump(s);
    if (k === 'f' || k === 'F') fan(s);
  },
  draw(s, d) {
    const island = islandFor(s.level);
    for (const box of ISLANDS) {
      const glow = s.claim && box === island;
      const y = box.y + Math.sin(s.t * 0.8 + box.x) * 6;
      if (glow) d.glow(box.x, y, 58, '#ffe2a8');
      d.item(spriteKey('charm-pouch'), box.x, y, {
        w: glow ? 54 : 42, alpha: glow ? 1 : 0.55, shadow: false,
        fallback: () => {
          d.poly([[box.x - 28, y + 22], [box.x - 28, y - 16], [box.x, y - 36], [box.x + 28, y - 16], [box.x + 28, y + 22]], glow ? '#b79bb8' : '#8a7480aa', '#ecd5a6', 2);
          d.text(box.symbol, box.x, y, 16);
        },
      });
      d.text(box.symbol, box.x, y + 32, 14, glow ? '#fff1d2' : '#d7c4a066');
    }
    for (let i = 0; i < 5; i++) {
      const x = 300 + i * 70, y = 214 + Math.sin(s.t + i) * 8;
      const wind = Math.sin(s.t * 0.7) * (18 + s.level * 6);
      d.path([{x: x - wind, y}, {x, y: y - 7}, {x: x + wind, y}], '#9d829e66', 3);
    }
    for (let i = 0; i < SHELVES.length; i++) {
      const L = SHELVES[i];
      d.poly([[L.left, L.back], [L.right, L.back], [L.right + 10, L.lip], [L.left - 10, L.lip]], i === 2 ? '#4a32408e' : '#5a3a5088', '#e4c48a', 3);
      d.line({x: L.left + 6, y: L.lip - 2}, {x: L.right - 6, y: L.lip - 2}, '#f0d18f', 5);
      const extend = s.stroke > 0 && s.stroke < 0.7 ? s.stroke / 0.7 : (s.stroke >= 0.7 ? 1 : 0);
      const plate = L.back + 18 + extend * SHOVE;
      d.line({x: L.left + 10, y: plate}, {x: L.right - 10, y: plate}, '#c4a070', 12);
      d.line({x: L.left + 10, y: plate - 5}, {x: L.right - 10, y: plate - 5}, '#f3ddb0', 3);
    }
    const order = [...s.mail].sort((a, b) => a.layer - b.layer || a.y - b.y);
    for (const c of order) {
      d.item(spriteKey(c.id), c.x, c.y, {
        w: c.w,
        fallback: () => {
          if (c.id === 'message-bottle') d.bottle(c.x, c.y, c.w / 54);
          else if (c.unique) d.star(c.x, c.y, c.r * 0.9, c.color);
          else d.envelope(c.x, c.y, c.r, c.color, symbolOf(c.id));
        },
      });
    }
    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    const px = 118, py = 430;
    d.item(spriteKey('penny-purse'), px, py, {w: 132, fallback: () => d.heart(px, py, 40, '#6a7a52')});
    const heap = Math.min(Math.max(0, n), 28);
    for (let i = 0; i < heap; i++) {
      const row = Math.floor(i / 7), col = i % 7;
      const hx = px - 44 + col * 14 + row * 3;
      const hy = py + 6 - row * 9 - (col % 2) * 3;
      d.item(spriteKey('everyday-penny'), hx, hy, {w: 22, shadow: false, fallback: () => d.ball(hx, hy, 8, '#b68445')});
    }
    d.text(String(n), px, py + 72, 22, '#fff6d8');
    d.text(n === 1 ? 'penny for postage' : 'pennies for postage', px, py + 94, 13, '#ead6a4');
    d.poly([[748, 48], [844, 52], [840, 124], [744, 118]], '#6b3a3a', '#e8d4a0', 2);
    d.text('treasures', 794, 140, 13, '#ead6a4');
    for (const f of (s.fly || [])) {
      const u = Math.min(1, f.t / f.dur);
      const e = 1 - (1 - u) * (1 - u);
      const fx = f.x + (f.destX - f.x) * e, fy = f.y + (f.destY - f.y) * e;
      d.item(spriteKey(f.id), fx, fy, {w: Math.max(18, (f.w || 32) * (1 - u * 0.4)), fallback: () => d.envelope(fx, fy, 12, f.color || '#e8d4a8')});
    }
    if (s.claim) {
      const p = s.claim;
      d.glow(p.x, p.y, 46, '#ffe2a8');
      d.item(spriteKey(p.id), p.x, p.y, {
        w: (p.w || 48) + 6,
        fallback: () => d.star(p.x, p.y, p.r || 20, p.color || '#c090a0'),
      });
    }
    if (!s.claim) {
      d.poly([[s.aim - 22, 88], [s.aim + 22, 88], [s.aim + 14, 134], [s.aim - 14, 134]], '#8a7450cc', '#ead097', 2);
      d.text('✉', s.aim, 118, 18, '#fff3d0');
    }
    if (alleyPlay && !s.started) d.text('pigeonholes still', 450, 72, 18, '#f0d6a8');
  },
  readout: s => {
    const waiting = s.mail.filter(c => !c.falling).length;
    const n = alleyPlay ? pocket() : s.ammo;
    const secret = s.claim ? ' · secret on the breeze' : '';
    if (alleyPlay) {
      return (n == null ? '0' : n) + (n === 1 ? ' penny' : ' pennies') + ' for postage · ' + waiting + ' in the pigeonholes · ' + s.score + ' delivered' + (s.queue ? ' · dumping ' + s.queue : '') + secret + ' · ' + s.note;
    }
    return n + ' / ' + s.total + ' practice stamps · ' + waiting + ' in the pigeonholes · ' + s.score + ' delivered' + (s.ammo === 0 ? ' · settling' : '') + secret + ' · ' + s.note;
  },
};
