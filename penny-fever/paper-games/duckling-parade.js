import {firstPrizeEligible} from './first-prize.js?v=first-prize-1';
/** Isolated Duckling Parade: auto ducks, route pieces, 1–100. */

export const DOTTIE_CHAPTERS = [
  {id: 'one', title: 'One Little Duck', ducks: 1, need: 1, pace: 0.55, hook: false, match: false, prize: 'brave-try-ribbon'},
  {id: 'leader', title: 'Follow the Leader', ducks: 3, need: 3, pace: 0.48, hook: false, match: false, prize: 'pond-lily-dish'},
  {id: 'currents', title: 'Crossing Currents', ducks: 3, need: 3, pace: 0.44, hook: false, match: false, prize: 'crowned-duck'},
  {id: 'hook', title: 'The Crooked Hook', ducks: 4, need: 3, pace: 0.42, hook: true, match: false, prize: 'sleepy-dragon'},
  {id: 'mixed', title: 'Mixed-Up Parade', ducks: 4, need: 4, pace: 0.4, hook: true, match: true, prize: 'spooky-pumpkin-friend'},
  {id: 'dark', title: 'Home Before Dark', ducks: 6, need: 5, pace: 0.36, hook: true, match: true, prize: 'crown-turtle'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const DOTTIE_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isDottieWin(level, n) {
  if(firstPrizeEligible('duck-pond',level))return true;
  return (DOTTIE_WINS[level] || DOTTIE_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 37 + 13);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
export const MARKS = ['♥', '★', '●', '▲', '☽', '♣'];

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function cell(type, dir = 0, extra = {}) {
  return {type, dir, lock: 0, ...extra};
}

function layout(level) {
  const cols = 7, rows = 8;
  const cells = Array.from({length: rows}, () => Array.from({length: cols}, () => cell('water', 0)));
  for (let x = 0; x < cols; x++) {
    cells[0][x] = cell('bank');
    cells[rows - 1][x] = cell('bank');
  }
  for (let y = 0; y < rows; y++) {
    cells[y][0] = cell('bank');
    cells[y][cols - 1] = cell('bank');
  }
  const homes = [];
  const pads = [];
  const gates = [];
  const currents = [];
  const bridges = [];
  const hooks = [];
  const spawns = [];

  cells[1][3] = cell('home', 0, {symbol: 0});
  homes.push({x: 3, y: 1, symbol: 0});
  cells[6][3] = cell('spawn', 0);
  spawns.push({x: 3, y: 6});
  cells[4][3] = cell('pad', 3, {id: 'pad0'});
  pads.push({id: 'pad0', x: 3, y: 4});

  if (level >= 1) {
    cells[1][2] = cell('home', 0, {symbol: 1});
    homes.push({x: 2, y: 1, symbol: 1});
    cells[1][4] = cell('home', 0, {symbol: 2});
    homes.push({x: 4, y: 1, symbol: 2});
    cells[5][2] = cell('spawn', 0);
    spawns.push({x: 2, y: 5});
    cells[5][4] = cell('spawn', 0);
    spawns.push({x: 4, y: 5});
    cells[3][3] = cell('gate', 0, {id: 'gate0', open: 0});
    gates.push({id: 'gate0', x: 3, y: 3});
  }
  if (level >= 2) {
    cells[4][2] = cell('current', 1, {id: 'cur0'});
    currents.push({id: 'cur0', x: 2, y: 4});
    cells[4][4] = cell('current', 3, {id: 'cur1'});
    currents.push({id: 'cur1', x: 4, y: 4});
    cells[2][3] = cell('pad', 0, {id: 'pad1'});
    pads.push({id: 'pad1', x: 3, y: 2});
  }
  if (level >= 3) {
    cells[3][1] = cell('hook', 0, {id: 'hook0'});
    hooks.push({id: 'hook0', x: 1, y: 3, down: false, t: 0, warn: 0});
    cells[3][5] = cell('rescue', 1);
    cells[2][1] = cell('bridge', 0, {id: 'br0', down: true});
    bridges.push({id: 'br0', x: 1, y: 2});
  }
  if (level >= 4) {
    cells[1][1] = cell('home', 0, {symbol: 3});
    homes.push({x: 1, y: 1, symbol: 3});
    cells[6][1] = cell('spawn', 0);
    spawns.push({x: 1, y: 6});
    cells[4][1] = cell('pad', 0, {id: 'pad2'});
    pads.push({id: 'pad2', x: 1, y: 4});
  }
  if (level >= 5) {
    cells[1][5] = cell('home', 0, {symbol: 4});
    homes.push({x: 5, y: 1, symbol: 4});
    cells[6][5] = cell('spawn', 0);
    spawns.push({x: 5, y: 6});
    cells[3][5] = cell('hook', 0, {id: 'hook1'});
    hooks.push({id: 'hook1', x: 5, y: 3, down: false, t: 0.8, warn: 0});
    cells[2][5] = cell('gate', 1, {id: 'gate1', open: 1});
    gates.push({id: 'gate1', x: 5, y: 2});
  }
  return {cols, rows, cells, homes, pads, gates, currents, bridges, hooks, spawns};
}

export function makeParade(level, seed) {
  const ch = DOTTIE_CHAPTERS[level] || DOTTIE_CHAPTERS[0];
  const roll = rng(seed);
  const pond = layout(level);
  const ducks = [];
  for (let i = 0; i < ch.ducks; i++) {
    const spawn = pond.spawns[i % pond.spawns.length];
    const symbol = ch.match ? (i % pond.homes.length) : 0;
    ducks.push({
      id: i, x: spawn.x, y: spawn.y,
      px: spawn.x, py: spawn.y, u: 1,
      symbol, home: false, hooked: false,
      unique: i === Math.floor(roll() * ch.ducks),
    });
  }
  return {
    level, seed, ...pond,
    ducks, need: ch.need, pace: ch.pace, match: ch.match,
    tick: 0, moveAt: 0.8,
    done: false, failed: '',
    hide: true,
  };
}

function inBounds(pond, x, y) {
  return y >= 0 && x >= 0 && y < pond.rows && x < pond.cols;
}

export function pieceAt(pond, x, y) {
  if (!inBounds(pond, x, y)) return null;
  return pond.cells[y][x];
}

export function tapPiece(pond, id) {
  if (!pond || pond.done || pond.failed) return false;
  const pad = (pond.pads || []).find(p => p.id === id);
  if (pad) {
    const c = pond.cells[pad.y][pad.x];
    if (c.lock > 0) return false;
    c.dir = (c.dir + 1) % 4;
    return true;
  }
  const gate = (pond.gates || []).find(g => g.id === id);
  if (gate) {
    const c = pond.cells[gate.y][gate.x];
    c.open = c.open ? 0 : 1;
    c.dir = c.open;
    return true;
  }
  const cur = (pond.currents || []).find(g => g.id === id);
  if (cur) {
    const c = pond.cells[cur.y][cur.x];
    c.dir = (c.dir + 1) % 4;
    return true;
  }
  const br = (pond.bridges || []).find(g => g.id === id);
  if (br) {
    const c = pond.cells[br.y][br.x];
    c.down = !c.down;
    return true;
  }
  return false;
}

function flowDir(pond, x, y) {
  const c = pieceAt(pond, x, y);
  if (!c) return 0;
  if (c.type === 'pad' || c.type === 'current') return c.dir;
  if (c.type === 'gate') return c.open ? 0 : 1;
  if (c.type === 'bridge') return c.down ? 0 : 1;
  if (c.type === 'home' || c.type === 'spawn' || c.type === 'water' || c.type === 'rescue') return 0;
  if (c.type === 'hook') return 1;
  return 0;
}

function nextCell(pond, x, y) {
  const d = flowDir(pond, x, y);
  let nx = x + DX[d], ny = y + DY[d];
  const dest = pieceAt(pond, nx, ny);
  if (!dest || dest.type === 'bank') {
    const left = (d + 3) % 4;
    nx = x + DX[left];
    ny = y + DY[left];
    const alt = pieceAt(pond, nx, ny);
    if (!alt || alt.type === 'bank') {
      const right = (d + 1) % 4;
      nx = x + DX[right];
      ny = y + DY[right];
    }
  }
  const there = pieceAt(pond, nx, ny);
  if (!there || there.type === 'bank') return {x, y};
  if (there.type === 'bridge' && !there.down) return {x, y};
  return {x: nx, y: ny};
}

function homeFor(pond, duck) {
  if (pond.match) return (pond.homes || []).find(h => h.symbol === duck.symbol) || pond.homes[0];
  return pond.homes[0];
}

export function homesReached(pond) {
  return (pond.ducks || []).filter(d => d.home).length;
}

export function stepParade(pond, dt) {
  if (!pond || pond.done || pond.failed) return;
  pond.tick += dt;
  (pond.hooks || []).forEach(h => {
    h.t += dt;
    const beat = 2.2;
    const phase = h.t % beat;
    h.warn = phase > beat - 0.45;
    h.down = phase > beat - 0.22 && phase < beat - 0.02;
    const c = pond.cells[h.y][h.x];
    if (c) c.down = h.down;
  });
  pond.cells.forEach(row => row.forEach(c => {
    if (c.lock > 0) c.lock = Math.max(0, c.lock - dt);
  }));
  pond.moveAt -= dt;
  if (pond.moveAt > 0) return;
  pond.moveAt = pond.pace;
  for (const duck of pond.ducks) {
    if (duck.home) continue;
    const here = pieceAt(pond, duck.x, duck.y);
    if (here && here.type === 'pad') here.lock = pond.pace * 0.9;
    const hook = (pond.hooks || []).find(h => h.x === duck.x && h.y === duck.y && h.down);
    if (hook) {
      duck.hooked = true;
      const rescue = {x: pond.cols - 2, y: hook.y};
      duck.px = duck.x; duck.py = duck.y;
      duck.x = rescue.x; duck.y = rescue.y;
      continue;
    }
    const nxt = nextCell(pond, duck.x, duck.y);
    duck.px = duck.x; duck.py = duck.y;
    duck.x = nxt.x; duck.y = nxt.y;
    const spot = pieceAt(pond, duck.x, duck.y);
    if (spot && spot.type === 'home') {
      const want = homeFor(pond, duck);
      if (!pond.match || (want && want.x === duck.x && want.y === duck.y)) duck.home = true;
    }
  }
  if (homesReached(pond) >= pond.need) pond.done = true;
}

export function uniqueDuck(pond) {
  return (pond.ducks || []).find(d => d.unique) || pond.ducks[0];
}
