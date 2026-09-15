import {firstPrizeEligible} from './first-prize.js?v=first-prize-1';
/** Isolated Shattered Fate: seeded shard grid, rotate/swap, 1–100. */

export const OPAL_CHAPTERS = [
  {id: 'crack', title: 'First Crack', shards: 3, cols: 3, rotate: false, scramble: 4, prize: 'looking-glass-locket'},
  {id: 'turn', title: 'Turning Glass', shards: 4, cols: 2, rotate: true, scramble: 6, prize: 'mirror-shard'},
  {id: 'portrait', title: 'Broken Portrait', shards: 5, cols: 3, rotate: true, scramble: 8, prize: 'folding-mirror'},
  {id: 'overlap', title: 'Overlapping Reflections', shards: 6, cols: 3, rotate: true, scramble: 10, prize: 'winter-snow-globe'},
  {id: 'twins', title: 'Mirror Twins', shards: 7, cols: 4, rotate: true, scramble: 12, prize: 'winter-lantern-book'},
  {id: 'fate', title: 'Shattered Fate', shards: 8, cols: 4, rotate: true, scramble: 14, prize: 'glass-garden-key'},
];

export const SEALS = [
  {id: 'moon-well', name: 'Moon in the well'},
  {id: 'moth-glass', name: 'Moth on the glass'},
  {id: 'brass-key', name: 'A key in frost'},
  {id: 'garden-gate', name: 'The garden gate'},
  {id: 'winter-bird', name: 'A winter bird'},
  {id: 'lantern-pair', name: 'Twin lanterns'},
  {id: 'crown-dust', name: 'Crown of dust'},
  {id: 'open-palm', name: 'An open palm'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const OPAL_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isOpalWin(level, n) {
  if(firstPrizeEligible('catoptromancy',level))return true;
  return (OPAL_WINS[level] || OPAL_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 33 + 13);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

export function sealedOf(seed) {
  return SEALS[(resultNumber(seed) - 1) % SEALS.length];
}

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const SHARD_INK = ['#d8e4f0', '#f0d8c8', '#e8d8f0', '#d8ece0', '#f0e8c8', '#e0d0c0', '#c8d8e8', '#f0dce8'];
export const SHARD_MARK = ['moon', 'moth', 'key', 'gate', 'bird', 'lamp', 'crown', 'hand'];

export function slotPos(ch, i) {
  const cols = ch.cols;
  const n = ch.shards;
  const row = Math.floor(i / cols);
  const col = i % cols;
  const last = Math.floor((n - 1) / cols);
  const inRow = row === last ? n - row * cols : cols;
  const cell = n >= 7 ? 128 : n >= 5 ? 140 : 156;
  const gap = 12;
  const total = inRow * cell + (inRow - 1) * gap;
  const startX = 450 - total / 2;
  const rows = last + 1;
  const startY = 430 + (rows === 1 ? 70 : 0);
  return {
    x: startX + col * (cell + gap) + cell / 2,
    y: startY + row * (cell + 18) + cell / 2,
    w: cell,
    h: cell,
  };
}

export function makeGlass(level, seed) {
  const ch = OPAL_CHAPTERS[level] || OPAL_CHAPTERS[0];
  const roll = rng(seed);
  const n = ch.shards;
  const slots = Array.from({length: n}, (_, i) => i);
  const rots = Array.from({length: n}, () => 0);
  for (let k = 0; k < ch.scramble; k++) {
    const a = Math.floor(roll() * n);
    let b = Math.floor(roll() * n);
    if (b === a) b = (a + 1 + Math.floor(roll() * Math.max(1, n - 1))) % n;
    const tmp = slots[a];
    slots[a] = slots[b];
    slots[b] = tmp;
    if (ch.rotate) {
      const id = slots[Math.floor(roll() * n)];
      rots[id] = (rots[id] + 1 + Math.floor(roll() * 3)) % 4;
    }
  }
  if (slots.every((id, i) => id === i) && rots.every(r => r % 4 === 0)) {
    const tmp = slots[0];
    slots[0] = slots[n - 1];
    slots[n - 1] = tmp;
    if (ch.rotate) rots[slots[0]] = 1;
  }
  return {
    level, seed, n, cols: ch.cols, rotate: !!ch.rotate,
    slots, rots, selected: -1, seal: sealedOf(seed),
  };
}

export function isSolved(glass) {
  if (!glass) return false;
  return glass.slots.every((id, i) => id === i) && glass.rots.every(r => (r % 4) === 0);
}

export function swapSlots(glass, i, j) {
  if (!glass) return false;
  const n = glass.n;
  if (i === j || i < 0 || j < 0 || i >= n || j >= n) return false;
  const t = glass.slots[i];
  glass.slots[i] = glass.slots[j];
  glass.slots[j] = t;
  glass.selected = -1;
  return true;
}

export function rotateSlot(glass, i) {
  if (!glass || !glass.rotate || i < 0 || i >= glass.n) return false;
  const id = glass.slots[i];
  glass.rots[id] = (glass.rots[id] + 1) % 4;
  return true;
}

export function tapGlass(glass, slot) {
  if (!glass || slot < 0 || slot >= glass.n) return 'none';
  if (glass.selected < 0) {
    glass.selected = slot;
    return 'select';
  }
  if (glass.selected === slot) {
    if (glass.rotate) {
      rotateSlot(glass, slot);
      return 'rotate';
    }
    glass.selected = -1;
    return 'deselect';
  }
  swapSlots(glass, glass.selected, slot);
  return 'swap';
}

/** Place every shard home and upright. Always legal: swaps generate S_n. */
export function repairGlass(glass) {
  const g = {
    ...glass,
    slots: glass.slots.slice(),
    rots: glass.rots.slice(),
  };
  for (let home = 0; home < g.n; home++) {
    const at = g.slots.indexOf(home);
    if (at !== home) swapSlots(g, at, home);
  }
  for (let id = 0; id < g.n; id++) g.rots[id] = 0;
  return isSolved(g);
}

export function hitSlot(ch, glass, x, y) {
  if (!glass) return -1;
  for (let i = 0; i < glass.n; i++) {
    const p = slotPos(ch, i);
    if (Math.abs(x - p.x) <= p.w / 2 && Math.abs(y - p.y) <= p.h / 2) return i;
  }
  return -1;
}
