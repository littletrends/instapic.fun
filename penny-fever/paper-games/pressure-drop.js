/** Isolated Pressure Drop: pipes, valves, chair, 1–100. */

export const DUNCAN_CHAPTERS = [
  {id: 'first', title: 'First Splash', prize: 'dunk-plate', need: 0.45, tank: 0, cols: 4, rows: 2},
  {id: 'valve', title: 'Turn the Valve', prize: 'barker-hat', need: 0.5, tank: 0, cols: 5, rows: 3},
  {id: 'leaky', title: 'Leaky Works', prize: 'splash-bead', need: 0.7, tank: 0, cols: 5, rows: 3},
  {id: 'split', title: 'Split Pressure', prize: 'wet-bell', need: 0.72, tank: 0, cols: 5, rows: 3},
  {id: 'rising', title: 'Rising Tank', prize: 'towel-flag', need: 0.72, tank: 0.085, cols: 5, rows: 4},
  {id: 'great', title: 'The Great Pressure Drop', prize: 'seltzer-bottle', need: 0.74, tank: 0.07, cols: 6, rows: 5},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const DUNCAN_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isDuncanWin(level, n) {
  return (DUNCAN_WINS[level] || DUNCAN_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 37 + 17);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const N = 1, E = 2, S = 4, W = 8;
const DIRS = [
  {m: N, dc: 0, dr: -1},
  {m: E, dc: 1, dr: 0},
  {m: S, dc: 0, dr: 1},
  {m: W, dc: -1, dr: 0},
];

const BASE = {
  pump: E,
  piston: W,
  straight: E | W,
  elbow: N | E,
  tee: N | E | S,
  cross: N | E | S | W,
  valve: E | W,
  leak: E | W,
  drain: E | W,
  cap: E,
};

export function rotMask(mask, k) {
  const n = mask & 15;
  const r = ((k % 4) + 4) % 4;
  if (!r) return n;
  return ((n << r) | (n >> (4 - r))) & 15;
}

export function ports(tile) {
  if (!tile) return 0;
  if (tile.type === 'valve' && !tile.open) return 0;
  const base = BASE[tile.type];
  if (base == null) return 0;
  return rotMask(base, tile.rot || 0);
}

function tileKey(c, r) {
  return c + ',' + r;
}

function layoutFor(level) {
  const T = (c, r, type, goalRot, extra = {}) => ({c, r, type, goalRot, ...extra});
  if (level === 0) {
    return {
      cols: 4, rows: 2,
      tiles: [
        T(0, 1, 'pump', 0, {fixed: true}),
        T(1, 1, 'straight', 0),
        T(2, 1, 'elbow', 3),
        T(2, 0, 'elbow', 1),
        T(3, 0, 'piston', 0, {fixed: true}),
      ],
    };
  }
  if (level === 1) {
    return {
      cols: 5, rows: 3,
      tiles: [
        T(0, 1, 'pump', 0, {fixed: true}),
        T(1, 1, 'straight', 0),
        T(2, 1, 'straight', 0),
        T(3, 1, 'valve', 0, {goalOpen: true, open: false}),
        T(4, 1, 'piston', 0, {fixed: true}),
        T(1, 0, 'elbow', 1),
        T(2, 0, 'drain', 0, {fixed: true}),
        T(1, 2, 'cap', 3),
      ],
    };
  }
  if (level === 2) {
    return {
      cols: 5, rows: 3,
      tiles: [
        T(0, 1, 'pump', 0, {fixed: true}),
        T(1, 1, 'tee', 3),
        T(1, 0, 'elbow', 1),
        T(2, 0, 'straight', 0),
        T(3, 0, 'straight', 0),
        T(4, 0, 'elbow', 2),
        T(4, 1, 'piston', 1, {fixed: true}),
        T(2, 1, 'valve', 0, {goalOpen: false, open: true}),
        T(3, 1, 'leak', 0, {fixed: true}),
        T(2, 2, 'cap', 1),
      ],
    };
  }
  if (level === 3) {
    return {
      cols: 5, rows: 3,
      tiles: [
        T(0, 1, 'pump', 0, {fixed: true}),
        T(1, 1, 'tee', 3),
        T(2, 1, 'valve', 0, {goalOpen: true, open: false}),
        T(3, 1, 'straight', 0),
        T(4, 1, 'piston', 0, {fixed: true}),
        T(1, 2, 'straight', 1),
        T(1, 0, 'elbow', 1),
        T(2, 0, 'valve', 0, {goalOpen: false, open: true}),
        T(3, 0, 'drain', 0, {fixed: true}),
        T(2, 2, 'cap', 3),
      ],
    };
  }
  if (level === 4) {
    return {
      cols: 5, rows: 4,
      tiles: [
        T(0, 2, 'pump', 0, {fixed: true}),
        T(1, 2, 'elbow', 3),
        T(1, 1, 'straight', 1),
        T(1, 0, 'elbow', 1),
        T(2, 0, 'straight', 0),
        T(3, 0, 'elbow', 2),
        T(3, 1, 'valve', 1, {goalOpen: true, open: false}),
        T(3, 2, 'elbow', 0),
        T(4, 2, 'piston', 0, {fixed: true}),
        T(2, 2, 'leak', 0, {fixed: true}),
        T(2, 1, 'cap', 2),
        T(2, 3, 'drain', 0, {fixed: true}),
        T(1, 3, 'elbow', 0),
      ],
    };
  }
  return {
    cols: 6, rows: 5,
    tiles: [
      T(0, 2, 'pump', 0, {fixed: true}),
      T(1, 2, 'tee', 3),
      T(2, 2, 'valve', 0, {goalOpen: true, open: false}),
      T(3, 2, 'elbow', 3),
      T(3, 1, 'straight', 1),
      T(3, 0, 'elbow', 1),
      T(4, 0, 'straight', 0),
      T(5, 0, 'elbow', 2),
      T(5, 1, 'straight', 1),
      T(5, 2, 'piston', 1, {fixed: true}),
      T(1, 1, 'valve', 1, {goalOpen: false, open: true}),
      T(1, 0, 'drain', 1, {fixed: true}),
      T(2, 3, 'leak', 0, {fixed: true}),
      T(1, 3, 'elbow', 0),
      T(2, 1, 'cap', 2),
      T(4, 2, 'straight', 0),
      T(4, 3, 'cap', 3),
      T(3, 3, 'elbow', 0),
      T(0, 4, 'cap', 0),
    ],
  };
}

export function makeBoard(level, seed) {
  const ch = DUNCAN_CHAPTERS[level] || DUNCAN_CHAPTERS[0];
  const spec = layoutFor(level);
  const roll = rng(seed);
  const tiles = spec.tiles.map(t => {
    const goalRot = t.goalRot || 0;
    const tile = {
      c: t.c, r: t.r, type: t.type,
      rot: goalRot,
      goalRot,
      open: t.open !== undefined ? t.open : true,
      goalOpen: t.goalOpen,
      fixed: !!t.fixed,
    };
    if (!tile.fixed && tile.type !== 'valve') {
      tile.rot = (goalRot + 1 + Math.floor(roll() * 3)) % 4;
    }
    if (tile.type === 'valve' && tile.goalOpen != null) {
      tile.open = !tile.goalOpen;
      tile.rot = goalRot;
    }
    return tile;
  });
  const cell = 78;
  const originX = 450 - (spec.cols * cell) / 2;
  const originY = 300;
  return {
    level, seed, tiles, cols: spec.cols, rows: spec.rows, cell, originX, originY,
    need: ch.need, tankRate: ch.tank, tank: 0, prize: ch.prize, title: ch.title,
    pumping: false, flowT: 0, flow: null, chair: 'up', water: [],
  };
}

export function tileAt(board, c, r) {
  return (board?.tiles || []).find(t => t.c === c && t.r === r) || null;
}

export function rotatePipe(board, c, r) {
  const t = tileAt(board, c, r);
  if (!t || t.fixed || t.type === 'valve' || t.type === 'leak' || t.type === 'drain' || t.type === 'pump' || t.type === 'piston') return false;
  if (board.pumping) return false;
  t.rot = ((t.rot || 0) + 1) % 4;
  return true;
}

export function toggleValve(board, c, r) {
  const t = tileAt(board, c, r);
  if (!t || t.type !== 'valve' || board.pumping) return false;
  t.open = !t.open;
  return true;
}

export function alignSolution(board) {
  for (const t of board.tiles) {
    t.rot = t.goalRot || 0;
    if (t.type === 'valve') t.open = t.goalOpen !== undefined ? !!t.goalOpen : true;
  }
  return board;
}

export function evaluateFlow(board) {
  const map = new Map();
  for (const t of board.tiles) map.set(tileKey(t.c, t.r), t);
  const pump = board.tiles.find(t => t.type === 'pump');
  const piston = board.tiles.find(t => t.type === 'piston');
  const visited = [];
  const seen = new Set();
  const splits = [];
  let leakAt = null;
  let drainAt = null;
  let failAt = null;
  if (!pump || !piston) {
    return {ok: false, pressure: 0, path: [], leakAt, drainAt, reached: false, failAt: 'pump'};
  }
  const q = [{tile: pump, from: 0}];
  seen.add(tileKey(pump.c, pump.r));
  while (q.length) {
    const {tile, from} = q.shift();
    visited.push(tile);
    const mask = ports(tile);
    let outgoing = 0;
    for (const d of DIRS) {
      if (!(mask & d.m)) continue;
      const nb = map.get(tileKey(tile.c + d.dc, tile.r + d.dr));
      if (!nb) continue;
      const back = rotMask(d.m, 2);
      if (!(ports(nb) & back)) continue;
      if (d.m !== from) outgoing++;
      const k = tileKey(nb.c, nb.r);
      if (seen.has(k)) continue;
      seen.add(k);
      q.push({tile: nb, from: back});
    }
    if ((tile.type === 'tee' || tile.type === 'cross') && outgoing >= 2) splits.push(tile);
    if (tile.type === 'leak') leakAt = tile;
    if (tile.type === 'drain') drainAt = tile;
  }
  const reached = seen.has(tileKey(piston.c, piston.r));
  let pressure = 1;
  if (leakAt) pressure *= 0.42;
  if (drainAt) pressure *= 0.34;
  if (splits.length && (leakAt || drainAt)) pressure *= 0.52;
  if (!reached) {
    const last = visited[visited.length - 1];
    failAt = last ? tileKey(last.c, last.r) : 'start';
  } else if (pressure < board.need) {
    failAt = leakAt ? 'leak' : drainAt ? 'drain' : 'pressure';
  }
  const ok = reached && pressure + 1e-9 >= board.need;
  return {
    ok, pressure, path: visited.map(t => ({c: t.c, r: t.r, type: t.type})),
    leakAt, drainAt, reached, failAt, splits: splits.length,
  };
}

export function routeComplete(board) {
  return !!evaluateFlow(board).ok;
}

export function startPump(board) {
  if (!board || board.pumping || board.chair === 'down') return false;
  board.pumping = true;
  board.flowT = 0;
  board.flow = evaluateFlow(board);
  board.water = (board.flow.path || []).slice();
  return true;
}

export function stepFlow(board, dt) {
  if (!board) return {event: 'idle'};
  if (board.tankRate > 0 && board.chair !== 'down' && !board.flow?.ok) {
    board.tank = Math.min(1, (board.tank || 0) + board.tankRate * dt);
    if (board.tank >= 1 && !board.pumping) return {event: 'tank'};
  }
  if (!board.pumping || !board.flow) return {event: 'idle'};
  board.flowT += dt;
  const n = Math.max(1, (board.flow.path || []).length);
  if (board.flowT < 0.18 * n && board.flowT < 1.6) return {event: 'flow'};
  board.pumping = false;
  if (board.flow.ok) return {event: 'ready'};
  return {event: 'fail', failAt: board.flow.failAt};
}

export function canDrop(board) {
  return !!board?.flow?.ok && board.chair !== 'down';
}

export function dropChair(board) {
  if (!canDrop(board)) return false;
  board.chair = 'down';
  return true;
}

export function tapCell(board, c, r) {
  const t = tileAt(board, c, r);
  if (!t) return false;
  if (t.type === 'valve') return toggleValve(board, c, r);
  return rotatePipe(board, c, r);
}
