import {clamp, dist, lerp, done} from '../draw.js?v=ink-1';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep} from '../wallet.js?v=booth-play-2';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const DUMP_CAP = 24;
const STROKE = 0.52;
const BOOK = 'pennyFever.clockworkMenagerie';
const VECTORS = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
const HOME = {x: 382, y: 268};
const SLOT = {x: 168, y: 978};
const SETS = [
  {prize: 'clockwork-key', mix: ['heart-gear', 'cabinet-key'], path: [12, 8, 4, 5, 1]},
  {prize: 'display-dome', mix: ['heart-gear', 'clockwork-key', 'cabinet-key'], path: [12, 13, 9, 5, 4, 0, 1]},
  {prize: 'clockwork-butterfly', mix: ['heart-gear', 'cabinet-key'], path: [12, 8, 9, 10, 6, 2, 1]},
  {prize: 'tin-style-robot', mix: ['heart-gear', 'cabinet-key', 'clockwork-key'], path: [12, 13, 14, 15, 11, 7, 3, 2, 1]},
  {prize: 'crystal-cradle', mix: ['heart-gear', 'display-dome', 'cabinet-key'], path: [12, 13, 14, 10, 9, 5, 1]},
  {prize: 'curio-cabinet-album', mix: ['heart-gear', 'clockwork-butterfly', 'cabinet-key'], path: [12, 8, 9, 13, 14, 10, 6, 2, 1]},
];
const LOOK = {
  'clockwork-key': '#c4a46a', 'cabinet-key': '#b89758', 'heart-gear': '#c67483',
  'display-dome': '#9eb8c4', 'clockwork-butterfly': '#d2b07a', 'tin-style-robot': '#8a9a8a',
  'crystal-cradle': '#b8a0c4', 'curio-cabinet-album': '#c4a46a',
};
const SPRITES = [
  'clockwork-key', 'cabinet-key', 'heart-gear', 'display-dome', 'clockwork-butterfly',
  'tin-style-robot', 'crystal-cradle', 'curio-cabinet-album', 'penny-purse', 'everyday-penny',
];

function centre(i) {
  return {x: 247.5 + (i % 4) * 135, y: 520 + Math.floor(i / 4) * 128};
}
function direction(a, b) {
  if (b === a - 4) return 0;
  if (b === a + 1) return 1;
  if (b === a + 4) return 2;
  return 3;
}
function ports(tile) { return tile.base.map(p => (p + tile.rot) % 4); }
function mint(id, tile, unique) {
  const c = centre(tile);
  return {
    id, tile, unique: !!unique, prize: !!unique,
    x: c.x, y: c.y, ox: c.x, oy: c.y, tx: c.x, ty: c.y, slide: 1,
    color: LOOK[id] || '#c4a46a',
  };
}
function at(p) { return {x: lerp(p.ox, p.tx, p.slide), y: lerp(p.oy, p.ty, p.slide)}; }

function trace(tiles) {
  const walk = [];
  let i = 12, enter = 3, lip = false;
  const seen = new Set();
  while (!seen.has(i)) {
    seen.add(i);
    const p = ports(tiles[i]);
    if (!p.includes(enter)) break;
    walk.push(i);
    const out = p.find(x => x !== enter);
    if (i === 1 && out === 0) { lip = true; break; }
    const r = Math.floor(i / 4), col = i % 4;
    const nr = r + VECTORS[out].y, nc = col + VECTORS[out].x;
    if (nr < 0 || nr > 3 || nc < 0 || nc > 3) break;
    i = nr * 4 + nc;
    enter = (out + 2) % 4;
  }
  return {walk, lip};
}

function readStore() {
  if (typeof localStorage === 'undefined') return {v: 1, tables: {}};
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1 && blob.tables) return blob;
  } catch { /* ignore */ }
  return {v: 1, tables: {}};
}
function snapshot(s) {
  return {
    tiles: s.tiles.map(t => ({base: t.base.slice(), rot: t.rot})),
    pieces: s.pieces.filter(p => p.tile >= 0).map(p => ({id: p.id, tile: p.tile, unique: !!p.unique})),
    dropped: s.dropped, score: s.score, paid: s.paid.slice(), seen: s.seen.slice(),
    selected: s.selected, restock: s.restock | 0,
  };
}
function persist(s) {
  if (!s) return;
  try {
    if (typeof localStorage === 'undefined') return;
    const store = readStore();
    store.tables[String(s.level || 0)] = snapshot(s);
    localStorage.setItem(BOOK, JSON.stringify(store));
  } catch { /* quota */ }
  s.dirty = false;
  s.saveAt = s.t;
}

function plant(s, rng) {
  const set = SETS[s.level] || SETS[0];
  const used = new Set(s.pieces.filter(p => p.tile >= 0).map(p => p.tile));
  if (!s.paid.includes(set.prize) && !s.pieces.some(p => p.id === set.prize && p.tile >= 0)) {
    let tile = set.path[Math.max(1, Math.floor(set.path.length / 2))];
    if (used.has(tile) || tile === 1) tile = set.path.find(i => i !== 1 && i !== 12 && !used.has(i)) ?? set.path[1];
    s.pieces.push(mint(set.prize, tile, true));
    used.add(tile);
    if (!s.seen.includes(set.prize)) s.seen.push(set.prize);
  }
  const want = 3 + s.level;
  const fillers = s.pieces.filter(p => !p.unique && p.tile >= 0).length;
  for (let n = fillers; n < want; n++) {
    const empties = [];
    for (let i = 0; i < 16; i++) if (!used.has(i) && i !== 1) empties.push(i);
    if (!empties.length) break;
    const tile = empties[Math.floor(rng() * empties.length)];
    const id = set.mix[n % set.mix.length];
    s.pieces.push(mint(id, tile, false));
    used.add(tile);
  }
}

function hydrate(blob, level, rng) {
  const set = SETS[level] || SETS[0];
  const tiles = (blob.tiles || []).map(t => ({
    base: Array.isArray(t.base) ? t.base.slice() : [0, 1],
    rot: (t.rot | 0) % 4,
  }));
  if (tiles.length !== 16) return null;
  const pieces = (blob.pieces || []).map(p => mint(p.id, p.tile | 0, !!p.unique || p.id === set.prize));
  const s = {
    level, t: 0, tiles, pieces, path: set.path.slice(), prize: set.prize,
    selected: blob.selected ?? 12, running: false, beetle: {x: SLOT.x, y: SLOT.y - 40},
    walk: [], route: [], lip: false, stroke: 0, queue: 0, cooldown: 0,
    dropped: blob.dropped || 0, score: blob.score || 0,
    paid: Array.isArray(blob.paid) ? blob.paid.slice() : [],
    seen: Array.isArray(blob.seen) ? blob.seen.slice() : [],
    restock: blob.restock || 0, ammo: alleyPlay ? 0 : 12 + level * 3,
    total: alleyPlay ? 0 : 12 + level * 3, started: !alleyPlay,
    fly: [], dirty: false, saveAt: 0, angle: 0,
    note: alleyPlay ? 'The garden waited. Feed a penny to wind the works.' : 'Turn the discs, then wind the traveller.',
  };
  plant(s, rng);
  return s;
}

function fresh(level, rng) {
  const set = SETS[level] || SETS[0];
  const path = set.path;
  const tiles = Array.from({length: 16}, () => ({base: [0, 1], rot: Math.floor(rng() * 4)}));
  path.forEach((i, n) => {
    tiles[i] = {
      base: [n ? direction(i, path[n - 1]) : 3, n < path.length - 1 ? direction(i, path[n + 1]) : 0],
      rot: 1 + Math.floor(rng() * 3),
    };
  });
  const ammo = 12 + level * 3;
  const s = {
    level, t: 0, tiles, pieces: [], path: path.slice(), prize: set.prize,
    selected: 12, running: false, beetle: {x: SLOT.x, y: SLOT.y - 40},
    walk: [], route: [], lip: false, stroke: 0, queue: 0, cooldown: 0,
    dropped: 0, score: 0, paid: [], seen: [], restock: 0,
    ammo: alleyPlay ? 0 : ammo, total: ammo, started: !alleyPlay,
    fly: [], dirty: !!alleyPlay, saveAt: 0, angle: -Math.PI / 2,
    note: alleyPlay
      ? 'The unique sits in the garden. Turn the rails, then feed a penny to shove.'
      : 'Turn the discs so the glow kisses the door, then wind.',
  };
  plant(s, rng);
  return s;
}

function rotate(s, i) {
  if (s.stroke > 0 || i < 0 || i > 15) return;
  s.selected = i;
  s.tiles[i].rot = (s.tiles[i].rot + 1) % 4;
  s.dirty = true;
  const {walk, lip} = trace(s.tiles);
  const on = s.pieces.some(p => p.unique && p.tile >= 0 && walk.includes(p.tile));
  if (lip && on) s.note = 'The unique sits on a railway that kisses the door. Wind the works.';
  else if (lip) s.note = 'The railway reaches the door — but the unique is off the rails.';
  else if (on) s.note = 'The unique is on the glow, yet the door is turned away.';
  else s.note = 'Turn the rails. The glow is the shove.';
}

function flyHome(s, piece, from) {
  s.fly = s.fly || [];
  s.fly.push({
    id: piece.id, x: from.x, y: from.y, t: 0, dur: 0.7,
    prize: !!piece.unique, color: piece.color,
  });
}

function payout(s, piece, from) {
  const prize = (SETS[s.level] || SETS[0]).prize;
  const won = piece.id === prize || piece.unique;
  flyHome(s, piece, from);
  s.dirty = true;
  if (won && !s.paid.includes(prize)) {
    s.paid.push(prize);
    if (alleyPlay) keep(prize, 'curios');
    takePrize(s, prize);
    done(s, 'A most satisfactory little expedition',
      itemName(prize) + ' shoved through the keyhole — into the treasure book!',
      {prize, won: true});
    s.note = itemName(prize) + ' through the door — into the treasure book!';
    return;
  }
  s.score += 1;
  s.note = won
    ? itemName(prize) + ' already lives in the book. Digby caught it again.'
    : itemName(piece.id) + ' tumbled into Digby’s catching tray.';
}

function planShove(s) {
  const {walk, lip} = trace(s.tiles);
  const byTile = new Map();
  for (const p of s.pieces) if (p.tile >= 0) byTile.set(p.tile, p);
  const occupied = new Set(byTile.keys());
  const moves = [];
  for (let i = walk.length - 1; i >= 0; i--) {
    const tile = walk[i];
    const piece = byTile.get(tile);
    if (!piece) continue;
    if (i === walk.length - 1 && lip && tile === 1) {
      moves.push({piece, from: tile, to: -1, claim: true});
      occupied.delete(tile);
      continue;
    }
    if (i === walk.length - 1) continue;
    const dest = walk[i + 1];
    if (occupied.has(dest)) continue;
    moves.push({piece, from: tile, to: dest, claim: false});
    occupied.delete(tile);
    occupied.add(dest);
  }
  return {walk, lip, moves};
}

function startWind(s) {
  const plan = planShove(s);
  s.walk = plan.walk;
  s.lip = plan.lip;
  s.stroke = 0.001;
  s.started = true;
  const route = plan.walk.map(centre);
  route.unshift({x: SLOT.x, y: SLOT.y - 18});
  if (plan.lip) route.push(HOME);
  s.route = route;
  s.beetle = {...route[0]};
  for (const m of plan.moves) {
    const from = centre(m.from);
    m.piece.ox = from.x;
    m.piece.oy = from.y;
    m.piece.slide = 0;
    if (m.claim) {
      m.piece.tx = HOME.x;
      m.piece.ty = HOME.y;
      m.piece.tile = -1;
      payout(s, m.piece, from);
    } else {
      const to = centre(m.to);
      m.piece.tx = to.x;
      m.piece.ty = to.y;
      m.piece.tile = m.to;
    }
  }
  s.pieces = s.pieces.filter(p => p.tile >= 0);
  if (!plan.moves.length) {
    s.note = plan.lip
      ? 'The railway kisses the door, but nothing sat on the rails to shove.'
      : 'A penny into the works — that track does not reach the door.';
  } else if (!plan.moves.some(m => m.claim) && plan.lip) {
    s.note = 'The traveller shoved the garden one bed toward the door.';
  } else if (!plan.lip) {
    s.note = 'The works shoved, then jammed. Turn a disc.';
  }
  s.dirty = true;
}

function restock(s, rng) {
  const set = SETS[s.level] || SETS[0];
  const used = new Set(s.pieces.filter(p => p.tile >= 0).map(p => p.tile));
  const empties = [12, 13, 14, 15].filter(i => !used.has(i));
  if (!empties.length) return;
  const id = set.mix[Math.floor(rng() * set.mix.length)];
  s.pieces.push(mint(id, empties[Math.floor(rng() * empties.length)], false));
  s.note = itemName(id) + ' settled at the back of the garden.';
  s.dirty = true;
}

function bumpRestock(s) {
  s.restock += 1;
  if (s.restock % 7 === 0) restock(s, Math.random);
}

function drop(s) {
  if (s.stroke > 0 || s.cooldown > 0) return;
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny in the purse.';
      return;
    }
    s.started = true;
    s.dropped = (s.dropped || 0) + 1;
  } else {
    if (s.ammo <= 0) {
      s.note = 'No practice pennies left. The garden still waits.';
      return;
    }
    s.ammo--;
  }
  s.cooldown = 0.22;
  bumpRestock(s);
  startWind(s);
}

function dump(s) {
  if (s.cooldown > 0 && s.queue > 0) return;
  const have = alleyPlay ? (pocket() || 0) : s.ammo;
  const take = Math.min(DUMP_CAP, Math.max(0, have | 0));
  if (take < 1) {
    s.note = alleyPlay ? 'The purse is empty.' : 'No practice pennies left.';
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
  s.note = take === 1 ? 'One penny into the winding slot.' : take + ' pennies dumped into the works.';
}

export default {
  title: 'Clockwork Menagerie',
  live: alleyPlay,
  tables: true,
  chapterEnds: false,
  tableDetail: 'A new garden in Digby’s cabinet. Walk away whenever you like — this chapter keeps. The unique waits on the brass beds until you shove it through the door.',
  intro: 'Digby’s cabinet is alive. Six gardens, six exhibits. Feed a penny into the winding slot and the brass traveller shoves everything on the connected railway one bed toward the keyhole door. The chapter’s unique sits among the gears. Shove it through and it goes in the treasure book. Walk away — that garden waits.',
  instructions: alleyPlay
    ? 'Tap a disc to turn it. The glow is the shove. Each penny winds the traveller once — sit still and nothing falls. Leave and the garden keeps. Dump the purse for a longer wind. The unique through the keyhole stamps the book.'
    : 'Tap a disc to turn it. Wind the traveller to shove curios along the glow. Workshop scores never enter your wallet.',
  levels: [
    'The runaway key',
    'Under the display dome',
    'Bring the butterfly home',
    'The tin traveller',
    'Crystal in the lower beds',
    'The cabinet’s long way home',
  ],
  sprites: SPRITES,
  prizes: SETS.map(set => set.prize),
  actions: [
    {id: 'rotate', label: 'Turn chosen disc'},
    {id: 'wind', label: alleyPlay ? 'Wind · 1 penny' : 'Wind the traveller'},
    {id: 'dump', label: alleyPlay ? 'Dump the purse' : 'Dump the rest'},
  ],
  persist,
  create(level, rng) {
    const roll = rng || Math.random;
    const saved = readStore().tables[String(level)];
    if (saved && Array.isArray(saved.tiles) && saved.tiles.length === 16) {
      const s = hydrate(saved, level, roll);
      if (s) {
        bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
        return s;
      }
    }
    const s = fresh(level, roll);
    persist(s);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt) {
    s.t += dt;
    s.cooldown = Math.max(0, s.cooldown - dt);
    if (s.queue > 0 && s.stroke <= 0 && s.cooldown <= 0) {
      s.queue--;
      bumpRestock(s);
      s.cooldown = 0.1;
      startWind(s);
    }
    if (s.stroke > 0) {
      s.stroke += dt / STROKE;
      const t = clamp(s.stroke, 0, 1);
      const route = s.route || [];
      if (route.length > 1) {
        const u = t * (route.length - 1);
        const i = Math.min(route.length - 2, Math.floor(u));
        const f = u - i;
        const a = route[i], b = route[i + 1];
        s.beetle = {x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f)};
        s.angle = Math.atan2(b.y - a.y, b.x - a.x);
      }
      for (const p of s.pieces) {
        if (p.slide < 1) p.slide = Math.min(1, p.slide + dt / STROKE);
      }
      if (s.stroke >= 1) {
        s.stroke = 0;
        for (const p of s.pieces) {
          p.slide = 1;
          p.ox = p.tx;
          p.oy = p.ty;
        }
        s.dirty = true;
      }
    }
    for (const f of (s.fly || [])) f.t += dt;
    s.fly = (s.fly || []).filter(f => f.t < f.dur);
    if (s.dirty && s.t - (s.saveAt || 0) > 1.2) persist(s);
  },
  pointer(s, type, p) {
    if (type !== 'down') return;
    const i = s.tiles.findIndex((_, n) => dist(p, centre(n)) < 56);
    if (i >= 0) { rotate(s, i); return; }
    if (dist(p, SLOT) < 54 || dist(p, {x: SLOT.x, y: SLOT.y - 36}) < 48) drop(s);
  },
  action(s, id) {
    if (id === 'wind') drop(s);
    if (id === 'dump') dump(s);
    if (id === 'rotate') rotate(s, s.selected);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ') drop(s);
    if (k === 'Enter' || k === 'd' || k === 'D') dump(s);
    if (k === 'r' || k === 'R') rotate(s, s.selected);
    const step = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4}[k];
    if (step) s.selected = clamp(s.selected + step, 0, 15);
  },
  draw(s, d) {
    const {walk, lip} = trace(s.tiles);
    const onFlow = new Set(walk);
    for (let i = 0; i < 16; i++) {
      const c = centre(i), tile = s.tiles[i], hot = onFlow.has(i);
      d.circle(c.x, c.y, 52, hot ? '#8a6a3858' : '#79664055', hot ? '#f0d18f' : '#c5ab7488', hot ? 2.4 : 1.5);
      if (i === s.selected) d.ring(c.x, c.y, 56, '#f9d99a', 3);
      for (const p of ports(tile)) {
        const v = VECTORS[p];
        d.line(c, {x: c.x + v.x * 67.5, y: c.y + v.y * 64}, '#322f24aa', 11);
        d.line(c, {x: c.x + v.x * 67.5, y: c.y + v.y * 64}, hot ? '#f3ddb0' : '#d1b577', hot ? 5 : 4);
      }
      d.circle(c.x, c.y, 7, hot ? '#f3ddb0' : '#e1c181');
    }
    d.glow(HOME.x, HOME.y, lip ? 64 : 44, lip ? '#f6e2a2' : '#f3e0a8');
    d.item(spriteKey('display-dome'), HOME.x, HOME.y, {
      w: 78,
      fallback: () => { d.ring(HOME.x, HOME.y, 32); d.text('DOOR', HOME.x, HOME.y + 48, 13); },
    });
    if (lip) d.text('the lip is kind', HOME.x, HOME.y - 52, 13, '#f0d6a8');
    for (const p of s.pieces) {
      const pos = at(p);
      const w = p.unique ? 54 : 42;
      if (p.unique) d.glow(pos.x, pos.y, 36);
      d.item(spriteKey(p.id), pos.x, pos.y, {
        w,
        fallback: () => p.unique ? d.star(pos.x, pos.y, 16, p.color) : d.ball(pos.x, pos.y, w * 0.38, p.color),
      });
    }
    const b = s.beetle;
    const c = d.c;
    c.save(); c.translate(b.x, b.y); c.rotate(s.angle || 0);
    d.item(spriteKey('clockwork-butterfly'), 0, 0, {
      w: 48, shadow: false,
      fallback: () => {
        for (let i = 0; i < 3; i++) {
          const x = -12 + i * 11, wiggle = Math.sin(s.t * 20 + i) * 5;
          d.line({x, y: -6}, {x: x + wiggle - 8, y: -22}, '#cba760', 3);
          d.line({x, y: 6}, {x: x - wiggle - 8, y: 22}, '#cba760', 3);
        }
        d.ellipse(0, 0, 22, 15, '#b39951', '#f5d899', 2);
        d.circle(22, 0, 8, '#526044', '#e6c27b', 2);
      },
    });
    c.restore();
    d.poly([[SLOT.x - 46, SLOT.y - 28], [SLOT.x + 46, SLOT.y - 22], [SLOT.x + 40, SLOT.y + 36], [SLOT.x - 40, SLOT.y + 30]], '#5a3a228e', '#e4c48a', 2);
    d.item(spriteKey('everyday-penny'), SLOT.x, SLOT.y, {
      w: 36, fallback: () => d.ball(SLOT.x, SLOT.y, 14, '#b68445'),
    });
    d.text('winding slot', SLOT.x, SLOT.y + 48, 13, '#ead6a4');
    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    const px = 132, py = 148;
    d.item(spriteKey('penny-purse'), px, py, {w: 128, fallback: () => d.heart(px, py, 40, '#6a7a52')});
    d.text(String(n), px, py + 72, 22, '#fff6d8');
    d.text(n === 1 ? 'penny in the purse' : 'pennies in the purse', px, py + 94, 13, '#ead6a4');
    
    d.text('treasures', 788, 144, 13, '#ead6a4');
    const prize = s.prize;
    d.item(spriteKey(prize), 788, 88, {
      w: 44, fallback: () => d.star(788, 88, 14, LOOK[prize] || '#c4a46a'),
    });
    if (s.paid.includes(prize)) d.text('✓', 818, 70, 16, '#f6e2a2');
    for (const f of (s.fly || [])) {
      const u = Math.min(1, f.t / f.dur);
      const e = 1 - (1 - u) * (1 - u);
      const destX = f.prize ? 788 : px, destY = f.prize ? 88 : py;
      const fx = f.x + (destX - f.x) * e, fy = f.y + (destY - f.y) * e;
      d.item(spriteKey(f.id), fx, fy, {
        w: Math.max(18, 40 * (1 - u * 0.4)),
        fallback: () => d.ball(fx, fy, 10, f.color || '#b68445'),
      });
    }
    if (alleyPlay && !s.started) d.text('the garden waits', 450, 72, 18, '#f0d6a8');
  },
  readout: s => {
    const {walk, lip} = trace(s.tiles);
    const n = alleyPlay ? pocket() : s.ammo;
    const beds = s.pieces.filter(p => p.tile >= 0).length;
    const unique = s.pieces.find(p => p.unique && p.tile >= 0);
    const on = unique && walk.includes(unique.tile);
    const purse = alleyPlay
      ? (n == null ? '0' : n) + (n === 1 ? ' penny' : ' pennies') + ' in the purse'
      : n + ' / ' + s.total + ' in the purse';
    const door = lip ? 'door open' : 'door turned away';
    const seat = on ? 'unique on the rails' : (unique ? 'unique off the rails' : 'unique kept');
    return purse + ' · ' + beds + ' in the garden · ' + door + ' · ' + seat
      + (s.queue ? ' · winding ' + s.queue : '') + ' · ' + s.note;
  },
};
