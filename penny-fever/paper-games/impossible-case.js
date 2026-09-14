/** Isolated Impossible Suitcase: packing tetris, list, 1–100. */

export const KIT_CHAPTERS = [
  {id: 'shift', title: 'First Shift', w: 4, h: 10, need: 2, speed: 0.9, pocket: false, prize: 'pressed-heart'},
  {id: 'care', title: 'Handle With Care', w: 6, h: 12, need: 3, speed: 1.05, pocket: true, prize: 'penny-purse'},
  {id: 'collector', title: 'Collector’s Case', w: 6, h: 12, need: 3, speed: 1.1, pocket: true, prize: 'penny-collector-book'},
  {id: 'secret', title: 'Secret Compartment', w: 6, h: 12, need: 4, speed: 1.15, pocket: true, prize: 'sealed-secret'},
  {id: 'rush', title: 'Midnight Rush', w: 6, h: 13, need: 4, speed: 1.35, pocket: true, prize: 'midnight-invitation'},
  {id: 'impossible', title: 'The Impossible Pack', w: 8, h: 14, need: 5, speed: 1.4, pocket: true, prize: 'ticket-satchel'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const KIT_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isKitWin(level, n) {
  return (KIT_WINS[level] || KIT_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 43 + 19);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

export const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  L: [[1, 0, 0], [1, 1, 1]],
  J: [[0, 0, 1], [1, 1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  lantern: [[1], [1]],
  book: [[1, 1, 1], [1, 1, 1]],
  bundle: [[1, 1], [1, 1]],
  bottle: [[1], [1], [1]],
};

const LISTS = [
  [
    {id: 'lantern', shape: 'I', required: true, name: 'Lantern bar'},
    {id: 'poster', shape: 'I', required: true, name: 'Rolled poster'},
    {id: 'filler-a', shape: 'I', required: false, name: 'Ticket box'},
    {id: 'filler-b', shape: 'I', required: false, name: 'Boot pair'},
  ],
  [
    {id: 'glass', shape: 'lantern', required: true, name: 'Glass lantern', fragile: true},
    {id: 'bottle', shape: 'bottle', required: true, name: 'Tonic bottle', fragile: true},
    {id: 'ell', shape: 'L', required: true, name: 'L-spanner'},
    {id: 'tee', shape: 'T', required: false, name: 'Coat hanger'},
    {id: 'oh', shape: 'O', required: false, name: 'Hat box'},
    {id: 'jay', shape: 'J', required: false, name: 'Boot jack'},
  ],
  [
    {id: 'album', shape: 'book', required: true, name: 'Collector album'},
    {id: 'map', shape: 'book', required: true, name: 'Folded map'},
    {id: 'lantern', shape: 'lantern', required: true, name: 'Desk lantern', fragile: true},
    {id: 'tee', shape: 'T', required: false, name: 'Ribbon T'},
    {id: 'ess', shape: 'S', required: false, name: 'S-hook'},
    {id: 'oh', shape: 'O', required: false, name: 'Tin'},
  ],
  [
    {id: 'key', shape: 'I', required: true, name: 'Key bar', key: true},
    {id: 'parcel', shape: 'T', required: true, name: 'Secret parcel', secret: true},
    {id: 'glass', shape: 'lantern', required: true, name: 'Lamp', fragile: true},
    {id: 'book', shape: 'book', required: true, name: 'Night book'},
    {id: 'ell', shape: 'L', required: false, name: 'Brace'},
    {id: 'zed', shape: 'Z', required: false, name: 'Z-fold'},
    {id: 'oh', shape: 'O', required: false, name: 'Round tin'},
  ],
  [
    {id: 'press', shape: 'book', required: true, name: 'Press'},
    {id: 'tools', shape: 'O', required: true, name: 'Toolbox', heavy: true},
    {id: 'lamp', shape: 'lantern', required: true, name: 'Lamp', fragile: true},
    {id: 'cloak', shape: 'bundle', required: true, name: 'Cloak', soft: true},
    {id: 'ell', shape: 'L', required: false, name: 'Clutter L'},
    {id: 'jay', shape: 'J', required: false, name: 'Clutter J'},
    {id: 'tee', shape: 'T', required: false, name: 'Clutter T'},
    {id: 'ess', shape: 'S', required: false, name: 'Clutter S'},
  ],
  [
    {id: 'manifest', shape: 'I', required: true, name: 'Night kit bar'},
    {id: 'pair-a', shape: 'L', required: true, name: 'Left boot', pair: 'boots'},
    {id: 'pair-b', shape: 'J', required: true, name: 'Right boot', pair: 'boots'},
    {id: 'lamp', shape: 'lantern', required: true, name: 'Lamp', fragile: true},
    {id: 'parcel', shape: 'T', required: true, name: 'Sealed parcel', secret: true},
    {id: 'heavy', shape: 'O', required: false, name: 'Iron', heavy: true},
    {id: 'soft', shape: 'bundle', required: false, name: 'Costume', soft: true},
    {id: 'zed', shape: 'Z', required: false, name: 'Fold'},
    {id: 'ess', shape: 'S', required: false, name: 'Hook'},
    {id: 'tee', shape: 'T', required: false, name: 'Hanger'},
  ],
];

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function cloneShape(id) {
  return (SHAPES[id] || SHAPES.O).map(r => r.slice());
}

function rotateShape(shape) {
  const h = shape.length, w = shape[0].length;
  const next = Array.from({length: w}, () => Array(h).fill(0));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) next[x][h - 1 - y] = shape[y][x];
  return next;
}

function upright(shape) {
  const xs = new Set();
  shape.forEach((row, y) => row.forEach((v, x) => { if (v) xs.add(x); }));
  return xs.size === 1;
}

function emptyGrid(w, h) {
  return Array.from({length: h}, () => Array(w).fill(null));
}

function blockedCells(level, w, h) {
  const blocked = [];
  if (level >= 2) {
    const x = Math.floor(w / 2);
    for (let y = h - 4; y < h; y++) blocked.push({x, y, kind: 'divider'});
  }
  if (level >= 3) {
    for (let x = w - 2; x < w; x++) for (let y = h - 3; y < h; y++) blocked.push({x, y, kind: 'secret'});
  }
  if (level >= 5) {
    blocked.push({x: 0, y: 2, kind: 'clip'}, {x: w - 1, y: 2, kind: 'clip'});
    blocked.push({x: 0, y: 3, kind: 'clip'}, {x: w - 1, y: 3, kind: 'clip'});
  }
  return blocked;
}

function spawnFrom(def, w) {
  const shape = cloneShape(def.shape);
  const pw = shape[0].length;
  return {
    id: def.id, name: def.name, shape,
    x: Math.max(0, Math.floor((w - pw) / 2)), y: 0,
    required: !!def.required, fragile: !!def.fragile, heavy: !!def.heavy,
    soft: !!def.soft, secret: !!def.secret, key: !!def.key, pair: def.pair || '',
    revealed: !def.secret,
  };
}

export function makeCase(level, seed) {
  const ch = KIT_CHAPTERS[level] || KIT_CHAPTERS[0];
  const roll = rng(seed);
  const list = (LISTS[level] || LISTS[0]).map(p => ({...p}));
  const required = list.filter(p => p.required).map(p => p.id);
  const blocked = blockedCells(level, ch.w, ch.h);
  const grid = emptyGrid(ch.w, ch.h);
  blocked.forEach(b => {
    if (b.kind !== 'secret') grid[b.y][b.x] = {id: '#' + b.kind, blocked: true};
  });
  const queue = list.map(p => ({...p}));
  if (level >= 1) {
    const fillers = queue.filter(p => !p.required);
    for (let i = fillers.length - 1; i > 0; i--) {
      const j = Math.floor(roll() * (i + 1));
      const ia = queue.indexOf(fillers[i]), ja = queue.indexOf(fillers[j]);
      [queue[ia], queue[ja]] = [queue[ja], queue[ia]];
    }
  }
  const pack = {
    level, seed, w: ch.w, h: ch.h, need: ch.need, speed: ch.speed,
    pocketOn: ch.pocket, grid, blocked,
    queue, required, packed: [], layers: 0,
    live: null, next: null, hold: null,
    fall: 0, clock: level >= 4 ? 90 - level * 6 : 0,
    compartment: level < 3, cracked: [],
    done: false, failed: '', hide: true,
  };
  pullNext(pack);
  pullNext(pack);
  return pack;
}

function cellsOf(piece) {
  const cells = [];
  piece.shape.forEach((row, ry) => row.forEach((v, rx) => {
    if (v) cells.push({x: piece.x + rx, y: piece.y + ry});
  }));
  return cells;
}

function fits(pack, piece) {
  return cellsOf(piece).every(c => {
    if (c.x < 0 || c.x >= pack.w || c.y >= pack.h) return false;
    if (c.y < 0) return true;
    return !pack.grid[c.y][c.x];
  });
}

function pullNext(pack) {
  if (!pack.live) {
    const def = pack.queue.shift();
    pack.live = def ? spawnFrom(def, pack.w) : null;
    if (pack.live && pack.live.secret) pack.live.revealed = true;
  }
  if (!pack.next) {
    const def = pack.queue[0];
    pack.next = def ? {id: def.id, name: def.name, secret: !!def.secret, shape: def.secret ? null : cloneShape(def.shape)} : null;
  }
}

function lockLive(pack) {
  const piece = pack.live;
  if (!piece) return;
  if (piece.fragile && !upright(piece.shape)) {
    pack.cracked.push(piece.id);
    cellsOf(piece).forEach(c => {
      if (c.y >= 0 && c.y < pack.h && c.x >= 0 && c.x < pack.w) pack.grid[c.y][c.x] = {id: 'crack', cracked: true};
    });
    if (piece.required && !pack.queue.some(q => q.id === piece.id)) pack.failed = 'fragile';
    pack.live = null;
    pack.next = null;
    pullNext(pack);
    return;
  }
  if (piece.soft) {
    const sh = piece.shape;
    if (sh.length > 1) piece.shape = [sh[sh.length - 1].slice()];
  }
  cellsOf(piece).forEach(c => {
    if (c.y >= 0 && c.y < pack.h) pack.grid[c.y][c.x] = {id: piece.id, required: piece.required, pair: piece.pair};
  });
  if (piece.key) {
    pack.compartment = true;
    for (let y = 0; y < pack.h; y++) for (let x = 0; x < pack.w; x++) {
      if (pack.grid[y][x] && pack.grid[y][x].id === '#secret') pack.grid[y][x] = null;
    }
    pack.blocked = pack.blocked.filter(b => b.kind !== 'secret');
  }
  strapLines(pack, piece);
  pack.live = null;
  pack.next = null;
  pullNext(pack);
  if (listPacked(pack) && pack.layers >= pack.need && !pack.hold) {
    pack.done = true;
    pack.live = null;
  }
  if (toppedOut(pack) && !pack.done) pack.failed = 'lid';
}

function strapLines(pack, piece) {
  let cleared = 0;
  for (let y = pack.h - 1; y >= 0; y--) {
    if (pack.grid[y].every(c => c && !c.blocked)) {
      const ids = pack.grid[y].map(c => c.id);
      ids.forEach(id => {
        if (pack.required.includes(id) && !pack.packed.includes(id)) pack.packed.push(id);
      });
      pack.grid.splice(y, 1);
      pack.grid.unshift(Array(pack.w).fill(null));
      pack.blocked.forEach(b => { if (b.kind === 'divider' || b.kind === 'clip') pack.grid[b.y][b.x] = {id: '#' + b.kind, blocked: true}; });
      cleared += 1;
      y += 1;
    }
  }
  pack.layers += cleared;
  if (piece && piece.required && cellsOf(piece).some(c => c.y >= 0 && pack.grid[c.y] && pack.grid[c.y][c.x]?.id === piece.id)) {
    // still in the case unstrapped — counts as packed only after a strap
  }
}

function toppedOut(pack) {
  return pack.grid[0].some(c => c && !c.blocked) || (pack.live && cellsOf(pack.live).some(c => c.y < 0 && !fits(pack, pack.live)));
}

export function listPacked(pack) {
  return pack.required.every(id => pack.packed.includes(id));
}

export function shiftLive(pack, dx) {
  if (!pack.live || pack.done || pack.failed) return false;
  const next = {...pack.live, x: pack.live.x + dx};
  if (!fits(pack, next)) return false;
  pack.live = next;
  return true;
}

export function rotateLive(pack) {
  if (!pack.live || pack.done || pack.failed) return false;
  const shape = rotateShape(pack.live.shape);
  if (pack.live.fragile && !upright(shape)) return false;
  const next = {...pack.live, shape};
  if (!fits(pack, next)) {
    next.x = pack.live.x - 1;
    if (!fits(pack, next)) {
      next.x = pack.live.x + 1;
      if (!fits(pack, next)) return false;
    }
  }
  pack.live = next;
  return true;
}

export function softDrop(pack) {
  if (!pack.live || pack.done || pack.failed) return false;
  const next = {...pack.live, y: pack.live.y + 1};
  if (fits(pack, next)) { pack.live = next; return true; }
  lockLive(pack);
  return false;
}

export function hardDrop(pack) {
  if (!pack.live || pack.done || pack.failed) return false;
  while (fits(pack, {...pack.live, y: pack.live.y + 1})) pack.live.y += 1;
  lockLive(pack);
  return true;
}

export function pocketSwap(pack) {
  if (!pack.pocketOn || !pack.live || pack.done || pack.failed) return false;
  const held = pack.hold;
  pack.hold = pack.live;
  pack.live = held ? {...held, x: Math.max(0, Math.floor((pack.w - held.shape[0].length) / 2)), y: 0} : null;
  if (!pack.live) {
    pack.next = null;
    pullNext(pack);
  }
  return true;
}

export function stepCase(pack, dt, reduced) {
  if (!pack || pack.done || pack.failed) return;
  const slow = reduced ? 0.45 : 1;
  if (pack.clock > 0) {
    pack.clock -= dt;
    if (pack.clock <= 0) { pack.failed = 'clock'; return; }
  }
  if (!pack.live) {
    pullNext(pack);
    if (!pack.live) {
      if (listPacked(pack) && pack.layers >= pack.need && !pack.hold) pack.done = true;
      else if (!pack.queue.length) pack.failed = 'lid';
      return;
    }
  }
  pack.fall += dt * pack.speed * slow;
  const beat = 0.7;
  while (pack.fall >= beat && pack.live && !pack.done && !pack.failed) {
    pack.fall -= beat;
    softDrop(pack);
  }
}
