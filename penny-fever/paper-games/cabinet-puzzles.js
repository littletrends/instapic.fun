import {firstPrizeEligible} from './first-prize.js?v=first-prize-1';
/** Deterministic mysteries for The Cabinet That Lies. Each puzzle has one solution. */

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function shuffle(roll, list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const NAMES = ['left', 'middle', 'right', 'far'];
const EMBLEMS = ['moon', 'key', 'moth', 'heart', 'star'];
const COLORS = ['brass', 'green', 'plum', 'cream'];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15 curve. Editable; not final odds. */
export const CABINET_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export const CABINET_PRIZES = [
  'clockwork-key',
  'display-dome',
  'clockwork-butterfly',
  'tin-style-robot',
  'crystal-cradle',
  'curio-cabinet-album',
];

export function isCabinetWin(level, n) {
  if(firstPrizeEligible('curios',level))return true;
  return (CABINET_WINS[level] || CABINET_WINS[0]).includes(n);
}

/** 1–100 from the puzzle seed only. Extra args stay for the stall API; they must not remap a win. */
export function resultNumber(seed, _cluesOpened, _mistakes, _hints) {
  const raw = Math.abs((Number(seed) || 0) * 17 + 1);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'heart-gear';
  if (n % 2 === 0) return 'cabinet-key';
  return 'everyday-penny';
}

function drawers(n, roll) {
  const emblems = shuffle(roll, EMBLEMS);
  return Array.from({length: n}, (_, i) => ({
    id: i,
    label: NAMES[i] || ('drawer ' + (i + 1)),
    color: COLORS[i % COLORS.length],
    emblem: emblems[i % emblems.length],
  }));
}

export function clueHolds(clue, drawerIndex, puzzle) {
  const d = puzzle?.drawers?.[drawerIndex];
  if (!clue || !d) return false;
  if (clue.kind === 'in') return drawerIndex === clue.drawer;
  if (clue.kind === 'not-in') return drawerIndex !== clue.drawer;
  if (clue.kind === 'emblem') return d.emblem === clue.emblem;
  if (clue.kind === 'not-color') return d.color !== clue.color;
  if (clue.kind === 'claim') return drawerIndex === clue.drawer;
  return false;
}

export function solvePuzzle(puzzle) {
  if (!puzzle?.drawers) return [];
  const n = puzzle.drawers.length;
  if (puzzle.kind === 'memory') {
    return Number.isInteger(puzzle.memory?.from) ? [puzzle.memory.from] : [];
  }
  if (puzzle.kind === 'mirror') {
    return Number.isInteger(puzzle.glassMark) ? [n - 1 - puzzle.glassMark] : [];
  }
  const hits = [];
  for (let i = 0; i < n; i++) {
    if (puzzle.kind === 'one-lie') {
      const lies = puzzle.clues.filter(c => !clueHolds(c, i, puzzle)).length;
      if (lies === 1) hits.push(i);
    } else if (puzzle.kind === 'sources') {
      const truths = puzzle.clues.filter(c => clueHolds(c, i, puzzle)).length;
      if (truths === 1) hits.push(i);
    } else if (puzzle.clues.every(c => clueHolds(c, i, puzzle))) {
      hits.push(i);
    }
  }
  return hits;
}

export function proveUnique(puzzle) {
  const hits = solvePuzzle(puzzle);
  return hits.length === 1 && hits[0] === puzzle.solution;
}

function pack(level, seed, kind, drawers, solution, extra) {
  return {level, seed, kind, drawers, solution, ...extra};
}

export function makePuzzle(level, seed, _tries = 0) {
  const roll = rng(seed);
  const lv = Math.max(0, Math.min(5, level | 0));
  let puzzle = null;
  if (lv === 0) {
    const d = drawers(3, roll);
    const sol = Math.floor(roll() * 3);
    puzzle = pack(lv, seed, 'direct', d, sol, {
      clues: [{id: 0, kind: 'in', drawer: sol, true: true, text: 'The curiosity is in the ' + d[sol].label + ' drawer.'}],
      rule: 'One honest card. Open the drawer it names.',
    });
  } else if (lv === 1) {
    const d = drawers(4, roll);
    const sol = Math.floor(roll() * 4);
    const other = d[(sol + 1) % 4];
    puzzle = pack(lv, seed, 'combine', d, sol, {
      clues: [
        {id: 0, kind: 'not-color', color: other.color, true: true, text: 'Not the ' + other.color + ' handle.'},
        {id: 1, kind: 'emblem', emblem: d[sol].emblem, true: true, text: 'Look for the ' + d[sol].emblem + '.'},
      ],
      rule: 'Two honest cards. Combine them.',
    });
  } else if (lv === 2) {
    const d = drawers(3, roll);
    const sol = Math.floor(roll() * 3);
    const decoy = (sol + 1) % 3;
    const clues = shuffle(roll, [
      {id: 0, kind: 'in', drawer: decoy, true: false, text: 'It is in the ' + d[decoy].label + ' drawer.'},
      {id: 1, kind: 'in', drawer: sol, true: true, text: 'It is in the ' + d[sol].label + ' drawer.'},
      {id: 2, kind: 'not-in', drawer: decoy, true: true, text: 'It is not in the ' + d[decoy].label + ' drawer.'},
    ]);
    puzzle = pack(lv, seed, 'one-lie', d, sol, {
      clues, rule: 'Exactly one card is lying.',
    });
  } else if (lv === 3) {
    const d = drawers(4, roll);
    const sol = Math.floor(roll() * 4);
    let moved = (sol + 1 + Math.floor(roll() * 3)) % 4;
    if (moved === sol) moved = (sol + 1) % 4;
    puzzle = pack(lv, seed, 'memory', d, sol, {
      memory: {from: sol, to: moved, item: 'moth'},
      clues: [{id: 0, kind: 'in', drawer: sol, true: true, text: 'Watch the moth. After the curtain, remember where it started.'}],
      rule: 'The curtain moves one curio. Name its first drawer.',
    });
  } else if (lv === 4) {
    const d = drawers(4, roll);
    const sol = Math.floor(roll() * 4);
    const glass = 3 - sol;
    puzzle = pack(lv, seed, 'mirror', d, sol, {
      glassMark: glass,
      clues: [{id: 0, kind: 'in', drawer: sol, true: true, text: 'The looking-glass marks a drawer — but the glass reverses left and right.'}],
      rule: 'The glass is a mirror. The marked drawer is opposite.',
    });
  } else {
    const d = drawers(3, roll);
    const sol = Math.floor(roll() * 3);
    const wrong = (sol + 1) % 3;
    const voices = shuffle(roll, ['The cabinet', 'The card', 'The attendant']);
    const named = [sol, wrong, wrong];
    const claims = voices.map((who, i) => ({
      who, drawer: named[i], true: named[i] === sol,
    }));
    puzzle = pack(lv, seed, 'sources', d, sol, {
      claims,
      clues: claims.map((c, i) => ({
        id: i, kind: 'claim', drawer: c.drawer, true: c.true,
        text: c.who + ' says: “' + d[c.drawer].label + '.”',
      })),
      rule: 'Exactly one of the three is telling the truth.',
    });
  }
  if (!proveUnique(puzzle) && _tries < 8) {
    return makePuzzle(lv, (Number(seed) || 1) + 7919, _tries + 1);
  }
  return puzzle;
}
