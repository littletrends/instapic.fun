/** Isolated Kernel Run: field-to-fair cart, cargo, 1–100. */

export const POPPY_CHAPTERS = [
  {id: 'harvest', title: 'First Harvest', need: 3, fuel: 42, dest: 'mill', prize: 'popcorn-carton'},
  {id: 'crows', title: 'Crow Trouble', need: 4, fuel: 40, dest: 'mill', prize: 'tiny-kettle'},
  {id: 'mud', title: 'Muddy Wheels', need: 4, fuel: 38, dest: 'mill', prize: 'sweet-heat'},
  {id: 'mill', title: 'The Old Mill', need: 5, fuel: 36, dest: 'hopper', prize: 'kettle-corn-bag'},
  {id: 'kettle', title: 'Kettle Run', need: 5, fuel: 34, dest: 'kettle', prize: 'lemon-fizz'},
  {id: 'market', title: 'Market Morning', need: 6, fuel: 32, dest: 'stall', prize: 'butter-kernel'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const POPPY_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isPoppyWin(level, n) {
  return (POPPY_WINS[level] || POPPY_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 31 + 11);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'lucky-match';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
export const DIR_NAME = ['up', 'right', 'down', 'left'];

const MAPS = [
  [
    '###########',
    '#.........#',
    '#S.C.C.C.D#',
    '#.........#',
    '###########',
  ],
  [
    '#############',
    '#...........#',
    '#S.C...C...D#',
    '#....R......#',
    '#.C.....C...#',
    '#...........#',
    '#############',
  ],
  [
    '#############',
    '#....mmm....#',
    '#S.C.mmm.C.D#',
    '#....mmm....#',
    '#.C......C..#',
    '#...........#',
    '#############',
  ],
  [
    '###############',
    '#.............#',
    '#S.C.C.#.C.C.D#',
    '#.....W#W.....#',
    '#.C........C..#',
    '#.............#',
    '###############',
  ],
  [
    '###############',
    '#.............#',
    '#S.C.kk.C.C.D.#',
    '#...kkkk......#',
    '#.C....C...C..#',
    '#.............#',
    '###############',
  ],
  [
    '#################',
    '#...............#',
    '#S.C.C.f.C.C.C.D#',
    '#.....f.f.......#',
    '#.C.....f....C..#',
    '#...............#',
    '#################',
  ],
];

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function gridOf(rows) {
  return rows.map(r => r.split(''));
}

function findCell(grid, ch) {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === ch) return {x, y};
    }
  }
  return {x: 1, y: 1};
}

function cellsOf(grid, ch) {
  const out = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === ch) out.push({x, y});
    }
  }
  return out;
}

export function makeRun(level, seed) {
  const ch = POPPY_CHAPTERS[level] || POPPY_CHAPTERS[0];
  const roll = rng(seed);
  const grid = gridOf(MAPS[level] || MAPS[0]);
  const start = findCell(grid, 'S');
  grid[start.y][start.x] = '.';
  const dest = findCell(grid, 'D');
  const crows = [];
  if (level >= 1 && level <= 2) {
    const lanes = cellsOf(grid, '.').filter(p => p.y === 1 || p.y === grid.length - 2);
    for (let i = 0; i < (level === 1 ? 2 : 1); i++) {
      const p = lanes[Math.floor(roll() * lanes.length)] || {x: 3, y: 1};
      crows.push({x: p.x, y: p.y, dir: roll() < 0.5 ? 1 : 3, t: 0});
    }
  }
  const wheels = cellsOf(grid, 'W').map((p, i) => ({x: p.x, y: p.y, open: i % 2 === 0, t: 0}));
  const fair = cellsOf(grid, 'f').map((p, i) => ({x: p.x, y: p.y, dir: i % 2 ? 1 : 3, t: 0}));
  return {
    level, seed,
    grid, cols: grid[0].length, rows: grid.length,
    x: start.x, y: start.y, dir: 1, want: 1,
    dest, need: ch.need, destName: ch.dest,
    cargo: [], spilled: [],
    fuel: ch.fuel, fuelMax: ch.fuel,
    notes: 0, cool: 0,
    crows, wheels, fair,
    delivered: false, failed: '',
    hide: true,
  };
}

export function cellAt(run, x, y) {
  if (y < 0 || x < 0 || y >= run.rows || x >= run.cols) return '#';
  return run.grid[y][x];
}

export function steer(run, dir) {
  if (!run || run.delivered || run.failed) return;
  const d = typeof dir === 'string' ? DIR_NAME.indexOf(dir) : dir;
  if (d < 0 || d > 3) return;
  run.want = d;
}

function blocked(run, x, y) {
  const c = cellAt(run, x, y);
  if (c === '#') return true;
  const wheel = (run.wheels || []).find(w => w.x === x && w.y === y);
  if (wheel && !wheel.open) return true;
  const folk = (run.fair || []).find(f => f.x === x && f.y === y);
  if (folk) return true;
  return false;
}

function spillOne(run) {
  if (!run.cargo.length) return;
  const bit = run.cargo.pop();
  run.spilled.push({x: run.x, y: run.y, bit});
}

function pickCell(run, x, y) {
  const c = cellAt(run, x, y);
  if (c === 'C') {
    run.grid[y][x] = '.';
    run.cargo.push('cob');
    run.notes += 1;
  }
  const puddle = run.spilled.findIndex(s => s.x === x && s.y === y);
  if (puddle >= 0) {
    run.cargo.push(run.spilled[puddle].bit);
    run.spilled.splice(puddle, 1);
    run.notes += 1;
  }
}

export function stepCart(run, dt) {
  if (!run || run.delivered || run.failed) return;
  run.fuel -= dt;
  if (run.fuel <= 0) {
    run.failed = 'fuel';
    return;
  }
  (run.wheels || []).forEach(w => {
    w.t += dt;
    if (w.t > 1.4) {
      w.t = 0;
      w.open = !w.open;
    }
  });
  (run.crows || []).forEach(cr => {
    cr.t += dt;
    if (cr.t > 0.55) {
      cr.t = 0;
      const nx = cr.x + DX[cr.dir], ny = cr.y + DY[cr.dir];
      if (blocked(run, nx, ny) || cellAt(run, nx, ny) === 'R') cr.dir = (cr.dir + 2) % 4;
      else { cr.x = nx; cr.y = ny; }
    }
    if (cr.x === run.x && cr.y === run.y && run.cargo.length) spillOne(run);
    const steal = run.spilled.findIndex(s => s.x === cr.x && s.y === cr.y);
    if (steal >= 0) run.spilled.splice(steal, 1);
  });
  (run.fair || []).forEach(f => {
    f.t += dt;
    if (f.t > 0.7) {
      f.t = 0;
      const nx = f.x + DX[f.dir];
      if (blocked(run, nx, f.y) || cellAt(run, nx, f.y) === 'D') f.dir = (f.dir + 2) % 4;
      else f.x = nx;
    }
  });
  const mud = cellAt(run, run.x, run.y) === 'm';
  const steam = cellAt(run, run.x, run.y) === 'k';
  const weight = 1 + run.cargo.length * 0.1 + (mud ? 0.7 : 0);
  run.cool += dt / weight;
  const stepT = 0.16;
  while (run.cool >= stepT) {
    run.cool -= stepT;
    run.dir = run.want;
    const nx = run.x + DX[run.dir];
    const ny = run.y + DY[run.dir];
    if (blocked(run, nx, ny)) {
      if (run.level >= 5 && run.cargo.length) spillOne(run);
      continue;
    }
    run.x = nx;
    run.y = ny;
    pickCell(run, nx, ny);
    if (run.x === run.dest.x && run.y === run.dest.y && run.cargo.length >= run.need) {
      run.delivered = true;
      return;
    }
  }
  if (steam) run.cool *= 0.9;
}

export function cargoCount(run) {
  return (run?.cargo || []).length;
}
