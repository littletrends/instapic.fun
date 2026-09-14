/** Isolated Milky Splash: match-three dairy bottles, unique crate delivery, 1–100. */

export const FLAVOURS = [
  {id: 'strawberry', name: 'Strawberry', mark: '♥', cap: 'round', fill: '#d45a78', ink: '#fff0e8'},
  {id: 'chocolate', name: 'Chocolate', mark: '◆', cap: 'square', fill: '#6a3a24', ink: '#f3e0c8'},
  {id: 'vanilla', name: 'Vanilla', mark: '✦', cap: 'scallop', fill: '#f0e2b8', ink: '#6a4a28'},
  {id: 'banana', name: 'Banana', mark: '☽', cap: 'ridge', fill: '#e4c04a', ink: '#4a3818'},
  {id: 'blueberry', name: 'Blueberry', mark: '●', cap: 'dot', fill: '#3a4a98', ink: '#e8e8ff'},
  {id: 'mint', name: 'Mint', mark: '♣', cap: 'leaf', fill: '#3a9a72', ink: '#e8fff4'},
];

export const MABEL_CHAPTERS = [
  {id: 'shift', title: 'Strawberry Shift', cols: 5, rows: 6, moves: 24, flavours: 4, crates: 0, weighted: 0, sour: 0, mixed: false, prize: 'dairy-calf'},
  {id: 'crates', title: 'Chocolate Crates', cols: 6, rows: 7, moves: 22, flavours: 5, crates: 4, weighted: 0, sour: 0, mixed: false, prize: 'lucky-dish'},
  {id: 'delivery', title: 'Vanilla Delivery', cols: 6, rows: 7, moves: 20, flavours: 5, crates: 2, weighted: 0, sour: 0, mixed: false, prize: 'alley-collector-cup'},
  {id: 'carton', title: 'Mixed Carton', cols: 7, rows: 8, moves: 18, flavours: 6, crates: 2, weighted: 4, sour: 0, mixed: true, prize: 'cocoa-cup'},
  {id: 'sour', title: 'Sour Milk', cols: 7, rows: 8, moves: 16, flavours: 6, crates: 2, weighted: 2, sour: 5, mixed: false, prize: 'crown-hatbox'},
  {id: 'midnight', title: 'Midnight Dairy', cols: 8, rows: 9, moves: 14, flavours: 6, crates: 4, weighted: 4, sour: 6, mixed: true, prize: 'cream-churn'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const MABEL_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isMabelWin(level, n) {
  return (MABEL_WINS[level] || MABEL_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 17 + 11);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

export function flavourOf(id) {
  return FLAVOURS.find(f => f.id === id) || FLAVOURS[0];
}

function rngBox(seed) {
  return {s: (Number(seed) || 1) >>> 0};
}
function rollOf(box) {
  box.s = (Math.imul(box.s, 1664525) + 1013904223) >>> 0;
  return box.s / 4294967296;
}
function shuffle(roll, list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poolIds(ch) {
  return FLAVOURS.slice(0, ch.flavours || 4).map(f => f.id);
}

function milk(flavour, extra) {
  return {kind: 'milk', flavour, ...extra};
}

export function cellAt(board, c, r) {
  if (!board || c < 0 || r < 0 || c >= board.cols || r >= board.rows) return null;
  return board.cells[r][c];
}

function setCell(board, c, r, cell) {
  board.cells[r][c] = cell;
}

function flavourId(cell) {
  if (!cell) return null;
  if (cell.kind === 'milk' || cell.kind === 'special') return cell.flavour;
  return null;
}

function isHoleCell(ch, c, r) {
  if (!ch.mixed) return false;
  const cols = ch.cols, rows = ch.rows;
  if ((r === 1 || r === 2) && (c === 0 || c === cols - 1)) return true;
  if (r === Math.floor(rows / 2) && (c === 1 || c === cols - 2)) return true;
  if (ch.id === 'midnight' && r === 3 && c % 3 === 2) return true;
  return false;
}

function columnSegments(board, c) {
  const segs = [];
  let start = 0;
  for (let r = 0; r <= board.rows; r++) {
    const hole = r < board.rows && board.cells[r][c]?.kind === 'hole';
    if (r === board.rows || hole) {
      if (r > start) segs.push([start, r - 1]);
      start = r + 1;
    }
  }
  return segs;
}

export function layoutOf(board) {
  const cols = board?.cols || 5, rows = board?.rows || 6;
  const size = Math.min(92, Math.floor(700 / cols), Math.floor(760 / rows));
  const originX = (900 - cols * size) / 2;
  const originY = 210;
  return {size, originX, originY, crateY: originY + rows * size + 8};
}

export function cellCenter(board, c, r) {
  const {size, originX, originY} = layoutOf(board);
  return {x: originX + (c + 0.5) * size, y: originY + (r + 0.5) * size};
}

export function cellFromPoint(board, p) {
  const {size, originX, originY} = layoutOf(board);
  const c = Math.floor((p.x - originX) / size);
  const r = Math.floor((p.y - originY) / size);
  if (c < 0 || r < 0 || c >= board.cols || r >= board.rows) return null;
  return {c, r};
}

export function findMatches(board) {
  const hits = [];
  const seen = new Set();
  const mark = (c, r) => {
    const key = r + ',' + c;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push({c, r});
  };
  for (let r = 0; r < board.rows; r++) {
    let run = 1;
    for (let c = 1; c <= board.cols; c++) {
      const same = c < board.cols && flavourId(cellAt(board, c, r)) && flavourId(cellAt(board, c, r)) === flavourId(cellAt(board, c - 1, r));
      if (same) run++;
      else {
        if (run >= 3) for (let k = 0; k < run; k++) mark(c - 1 - k, r);
        run = 1;
      }
    }
  }
  for (let c = 0; c < board.cols; c++) {
    let run = 1;
    for (let r = 1; r <= board.rows; r++) {
      const same = r < board.rows && flavourId(cellAt(board, c, r)) && flavourId(cellAt(board, c, r)) === flavourId(cellAt(board, c, r - 1));
      if (same) run++;
      else {
        if (run >= 3) for (let k = 0; k < run; k++) mark(c, r - 1 - k);
        run = 1;
      }
    }
  }
  return hits;
}

function adjacent(c1, r1, c2, r2) {
  return Math.abs(c1 - c2) + Math.abs(r1 - r2) === 1;
}

function swappable(cell) {
  return !!(cell && (cell.kind === 'milk' || cell.kind === 'special'));
}

export function legalMoves(board) {
  const moves = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      for (const [dc, dr] of [[1, 0], [0, 1]]) {
        const c2 = c + dc, r2 = r + dr;
        if (c2 >= board.cols || r2 >= board.rows) continue;
        if (!swappable(cellAt(board, c, r)) || !swappable(cellAt(board, c2, r2))) continue;
        const a = board.cells[r][c], b = board.cells[r2][c2];
        board.cells[r][c] = b;
        board.cells[r2][c2] = a;
        const ok = findMatches(board).length > 0;
        board.cells[r][c] = a;
        board.cells[r2][c2] = b;
        if (ok) moves.push({c1: c, r1: r, c2, r2});
      }
    }
  }
  return moves;
}

export function locateUnique(board) {
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (board.cells[r][c]?.kind === 'unique') {
        board.unique = {c, r};
        return board.unique;
      }
    }
  }
  board.unique = null;
  return null;
}

export function isDelivered(board) {
  if (!board) return false;
  if (board.delivered) return true;
  const u = locateUnique(board);
  return !!(u && u.r >= board.rows - 1);
}

export function openColumns(board) {
  const cols = [];
  for (let c = 0; c < board.cols; c++) {
    let blocked = false;
    for (let r = 0; r < board.rows; r++) {
      if (board.cells[r][c]?.kind === 'hole') { blocked = true; break; }
    }
    if (!blocked) cols.push(c);
  }
  return cols.length ? cols : [Math.floor(board.cols / 2)];
}

export function spawnUnique(board, col) {
  if (!board || locateUnique(board)) return board;
  const cols = openColumns(board);
  const c = cols.includes(col) ? col : cols[0];
  for (let r = 0; r < board.rows - 1; r++) {
    const cell = cellAt(board, c, r);
    if (cell && (cell.kind === 'milk' || cell.kind === 'special')) {
      setCell(board, c, r, {kind: 'unique'});
      board.unique = {c, r};
      return board;
    }
  }
  setCell(board, c, 0, {kind: 'unique'});
  board.unique = {c, r: 0};
  return board;
}

function gravity(board) {
  for (let c = 0; c < board.cols; c++) {
    for (const [a, b] of columnSegments(board, c)) {
      const kept = [];
      for (let r = a; r <= b; r++) {
        const cell = board.cells[r][c];
        if (cell && cell.kind !== 'hole') kept.push(cell);
        board.cells[r][c] = null;
      }
      let r = b;
      for (let i = kept.length - 1; i >= 0; i--, r--) board.cells[r][c] = kept[i];
    }
  }
}

export function settleBoard(board) {
  gravity(board);
  locateUnique(board);
  if (isDelivered(board)) board.delivered = true;
  return board;
}

function refill(board) {
  const ids = board.pool;
  const roll = board.roll;
  for (let c = 0; c < board.cols; c++) {
    const segs = columnSegments(board, c);
    const top = segs[0];
    if (!top || top[0] !== 0) continue;
    for (let r = top[0]; r <= top[1]; r++) {
      if (!board.cells[r][c]) board.cells[r][c] = milk(ids[Math.floor(roll() * ids.length)]);
    }
  }
}

function damageAround(board, hits) {
  const near = new Set();
  for (const h of hits) {
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = h.c + dc, r = h.r + dr;
      const cell = cellAt(board, c, r);
      if (!cell) continue;
      if (cell.kind === 'crate' || cell.kind === 'weighted' || cell.kind === 'sour') near.add(r + ',' + c);
    }
  }
  for (const key of near) {
    const [r, c] = key.split(',').map(Number);
    const cell = cellAt(board, c, r);
    if (!cell) continue;
    cell.hp = (cell.hp || 1) - 1;
    if (cell.hp <= 0) setCell(board, c, r, null);
  }
}

function activateSpecials(board, hits) {
  for (const h of hits) {
    const cell = cellAt(board, h.c, h.r);
    if (!cell || cell.kind !== 'special') continue;
    if (cell.special === 'shaken') {
      const axis = cell.axis === 'col' ? 'col' : 'row';
      if (axis === 'row') {
        for (let c = 0; c < board.cols; c++) {
          const t = cellAt(board, c, h.r);
          if (t && t.kind !== 'unique' && t.kind !== 'hole') setCell(board, c, h.r, null);
        }
      } else {
        for (let r = 0; r < board.rows; r++) {
          const t = cellAt(board, h.c, r);
          if (t && t.kind !== 'unique' && t.kind !== 'hole') setCell(board, h.c, r, null);
        }
      }
    } else if (cell.special === 'fizzy') {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const t = cellAt(board, h.c + dc, h.r + dr);
        if (t && t.kind !== 'unique' && t.kind !== 'hole') setCell(board, h.c + dc, h.r + dr, null);
      }
    } else if (cell.special === 'cream') {
      const flav = cell.flavour;
      for (let r = 0; r < board.rows; r++) for (let c = 0; c < board.cols; c++) {
        const t = cellAt(board, c, r);
        if (t && t.flavour === flav && t.kind !== 'unique') setCell(board, c, r, null);
      }
    }
  }
}

function promoteSpecials(board, hits) {
  if (hits.length < 4) return null;
  const byRow = new Map(), byCol = new Map();
  for (const h of hits) {
    byRow.set(h.r, (byRow.get(h.r) || 0) + 1);
    byCol.set(h.c, (byCol.get(h.c) || 0) + 1);
  }
  const row4 = [...byRow.entries()].find(([, n]) => n >= 4);
  const col4 = [...byCol.entries()].find(([, n]) => n >= 4);
  const row5 = [...byRow.entries()].find(([, n]) => n >= 5);
  const col5 = [...byCol.entries()].find(([, n]) => n >= 5);
  const pick = hits.find(h => flavourId(cellAt(board, h.c, h.r))) || hits[0];
  const flav = flavourId(cellAt(board, pick.c, pick.r));
  if (!flav) return null;
  if (row5 || col5) setCell(board, pick.c, pick.r, {kind: 'special', flavour: flav, special: 'cream'});
  else if (row4) setCell(board, pick.c, pick.r, {kind: 'special', flavour: flav, special: 'shaken', axis: 'row'});
  else if (col4) setCell(board, pick.c, pick.r, {kind: 'special', flavour: flav, special: 'shaken', axis: 'col'});
  else if (hits.length >= 5) setCell(board, pick.c, pick.r, {kind: 'special', flavour: flav, special: 'fizzy'});
  else return null;
  return pick;
}

function collectHits(board, hits) {
  for (const h of hits) {
    const cell = cellAt(board, h.c, h.r);
    if (!cell || cell.kind === 'unique' || cell.kind === 'hole') continue;
    if (cell.flavour) {
      board.collected[cell.flavour] = (board.collected[cell.flavour] || 0) + 1;
    }
    setCell(board, h.c, h.r, null);
  }
}

export function resolveBoard(board) {
  let guard = 0;
  while (guard++ < 36) {
    const hits = findMatches(board);
    if (!hits.length) break;
    const kept = promoteSpecials(board, hits);
    activateSpecials(board, hits);
    damageAround(board, hits);
    collectHits(board, hits.filter(h => !(kept && h.c === kept.c && h.r === kept.r)));
    gravity(board);
    refill(board);
    locateUnique(board);
  }
  if (isDelivered(board)) board.delivered = true;
  return board;
}

function spreadSour(board) {
  if (!board.sourOn) return;
  const sour = [];
  for (let r = 0; r < board.rows; r++) for (let c = 0; c < board.cols; c++) {
    if (board.cells[r][c]?.kind === 'sour') sour.push({c, r});
  }
  const born = [];
  for (const s of sour) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const pick = dirs[Math.floor(board.roll() * dirs.length)];
    const t = cellAt(board, s.c + pick[0], s.r + pick[1]);
    if (t && t.kind === 'milk') born.push({c: s.c + pick[0], r: s.r + pick[1]});
  }
  for (const b of born) {
    if (cellAt(board, b.c, b.r)?.kind === 'milk') setCell(board, b.c, b.r, {kind: 'sour', hp: 1});
  }
}

export function reshuffle(board) {
  const milks = [];
  const spots = [];
  for (let r = 0; r < board.rows; r++) for (let c = 0; c < board.cols; c++) {
    const cell = board.cells[r][c];
    if (cell && (cell.kind === 'milk' || cell.kind === 'special')) {
      milks.push(cell);
      spots.push({c, r});
    }
  }
  const mixed = shuffle(board.roll, milks);
  spots.forEach((p, i) => setCell(board, p.c, p.r, mixed[i]));
  locateUnique(board);
  return board;
}

function ensureMoves(board) {
  let n = 0;
  while (legalMoves(board).length === 0 && n++ < 24) {
    reshuffle(board);
    if (findMatches(board).length) resolveBoard(board);
  }
  return board;
}

export function applySwap(board, c1, r1, c2, r2) {
  if (!board || !adjacent(c1, r1, c2, r2)) return {ok: false, reason: 'apart'};
  const a = cellAt(board, c1, r1), b = cellAt(board, c2, r2);
  if (!swappable(a) || !swappable(b)) return {ok: false, reason: 'stuck'};
  setCell(board, c1, r1, b);
  setCell(board, c2, r2, a);
  if (!findMatches(board).length) {
    setCell(board, c1, r1, a);
    setCell(board, c2, r2, b);
    return {ok: false, reason: 'no-match'};
  }
  board.movesLeft = Math.max(0, (board.movesLeft || 0) - 1);
  resolveBoard(board);
  if (board.sourOn) spreadSour(board);
  if (legalMoves(board).length === 0) ensureMoves(board);
  if (isDelivered(board)) board.delivered = true;
  return {ok: true, delivered: !!board.delivered, movesLeft: board.movesLeft};
}

export function refillMoves(board) {
  const ch = MABEL_CHAPTERS[board.level] || MABEL_CHAPTERS[0];
  board.movesLeft = ch.moves;
  return board;
}

function placeObstacles(board, ch, roll) {
  const spots = [];
  for (let r = 1; r < board.rows - 2; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (board.cells[r][c]?.kind === 'milk') spots.push({c, r});
    }
  }
  const mixed = shuffle(roll, spots);
  let i = 0;
  for (let n = 0; n < ch.crates; n++, i++) {
    const p = mixed[i];
    if (p) setCell(board, p.c, p.r, {kind: 'crate', hp: 1});
  }
  for (let n = 0; n < ch.weighted; n++, i++) {
    const p = mixed[i];
    if (p) setCell(board, p.c, p.r, {kind: 'weighted', hp: 2});
  }
  for (let n = 0; n < ch.sour; n++, i++) {
    const p = mixed[i];
    if (p) setCell(board, p.c, p.r, {kind: 'sour', hp: 1});
  }
}

export function makeBoard(level, seed) {
  const ch = MABEL_CHAPTERS[level] || MABEL_CHAPTERS[0];
  const rng = rngBox(seed);
  const roll = () => rollOf(rng);
  const ids = poolIds(ch);
  const cells = [];
  for (let r = 0; r < ch.rows; r++) {
    const row = [];
    for (let c = 0; c < ch.cols; c++) {
      if (isHoleCell(ch, c, r)) { row.push({kind: 'hole'}); continue; }
      let flav = ids[Math.floor(roll() * ids.length)];
      let guard = 0;
      while (guard++ < 12) {
        const left2 = c >= 2 && flavourId(row[c - 1]) === flav && flavourId(row[c - 2]) === flav;
        const up2 = r >= 2 && flavourId(cells[r - 1][c]) === flav && flavourId(cells[r - 2][c]) === flav;
        if (!left2 && !up2) break;
        flav = ids[Math.floor(roll() * ids.length)];
      }
      row.push(milk(flav));
    }
    cells.push(row);
  }
  const board = {
    level, seed, cols: ch.cols, rows: ch.rows, cells,
    moves: ch.moves, movesLeft: ch.moves,
    unique: null, delivered: false, sourOn: ch.sour > 0,
    pool: ids, collected: {},
    rngSeed: seed, rng,
  };
  board.roll = () => rollOf(board.rng);
  placeObstacles(board, ch, roll);
  if (findMatches(board).length) resolveBoard(board);
  if (isMabelWin(level, resultNumber(seed))) spawnUnique(board);
  ensureMoves(board);
  locateUnique(board);
  return board;
}

export function cloneBoard(board) {
  const cells = board.cells.map(row => row.map(cell => cell ? {...cell} : null));
  const next = {
    ...board,
    cells,
    unique: board.unique ? {...board.unique} : null,
    collected: {...(board.collected || {})},
    pool: (board.pool || []).slice(),
    rng: {s: (board.rng && board.rng.s != null) ? board.rng.s : (Number(board.rngSeed || board.seed) || 1) >>> 0},
  };
  next.roll = () => rollOf(next.rng);
  return next;
}

export function countKind(board, kind) {
  let n = 0;
  for (const row of board.cells) for (const cell of row) if (cell?.kind === kind) n++;
  return n;
}
