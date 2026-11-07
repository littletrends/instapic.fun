import {firstPrizeEligible} from './first-prize.js?v=first-prize-1';
/** Isolated schoolyard reducer for Rosalie's tester. Not wired into rendering. */

export function normalizeName(text) {
  return String(text || '')
    .toUpperCase()
    .replace(/[-_]/g, ' ')
    .replace(/[^A-Z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeKey(parts) {
  return parts.map(normalizeName).filter(Boolean).join('|');
}

export function lettersOnly(text) {
  return normalizeName(text).replace(/ /g, '');
}

export function countLetter(text, letter) {
  const ch = String(letter || '').toUpperCase().slice(0, 1);
  if (!ch) return 0;
  return [...lettersOnly(text)].filter(c => c === ch).length;
}

export function countWord(text, word) {
  return [...String(word || '').toUpperCase()].map(ch => countLetter(text, ch));
}

export function repeatedLetters(word) {
  const w = String(word || '').toUpperCase();
  const seen = new Set();
  const repeats = [];
  for (const ch of w) {
    if (seen.has(ch) && !repeats.includes(ch)) repeats.push(ch);
    seen.add(ch);
  }
  return repeats;
}

/** Adjacent digits summed mod 10 until two digits remain. 00 is 100. */
/** Full neighbour sums (7+4 → 11). Final dial is last two digits of the closing total. */
export function pctFromFinal(last) {
  const nums = (last || []).map(n => Math.abs(Number(n) || 0));
  if (!nums.length) return 100;
  const total = nums.length === 1 ? nums[0] : nums[0] + nums[1];
  const p = total % 100;
  return p === 0 ? 100 : p;
}

export function addDown(counts) {
  const start = (counts || []).map(n => Math.abs(Number(n) || 0));
  if (!start.length) return {rows: [[]], pct: 100, digits: [0, 0]};
  const rows = [start.slice()];
  while (rows[rows.length - 1].length > 2) {
    const prev = rows[rows.length - 1];
    const next = [];
    for (let i = 0; i < prev.length - 1; i++) next.push(prev[i] + prev[i + 1]);
    rows.push(next);
  }
  const last = rows[rows.length - 1];
  const pct = pctFromFinal(last);
  const digits = last.length === 1 ? [Math.floor(pct / 10), pct % 10] : last.slice();
  return {rows, pct, digits};
}

export function sumPair(a, b) {
  return (Number(a) || 0) + (Number(b) || 0);
}

export function readingForInput(level, you, them) {
  const ch = LOVE_CHAPTERS[level] || LOVE_CHAPTERS[0];
  const text = ch.bLabel ? (you + ' ' + them) : you;
  const counts = countWord(text, ch.word);
  return {counts, ...addDown(counts)};
}

export const LOVE_CHAPTERS = [
  {id: 'love', title: 'Love / Crush', word: 'LOVES', aLabel: 'Your name', bLabel: 'Their name', prize: 'rose-hair-bow'},
  {id: 'vital', title: 'Health / Vitality', word: 'VITAL', aLabel: 'Your name', bLabel: 'What is complaining', prize: 'kindness-heart'},
  {id: 'family', title: 'Family', word: 'BONDS', aLabel: 'Your name', bLabel: 'Family name', prize: 'ribbon-gift-box'},
  {id: 'mates', title: 'Friendship', word: 'MATES', aLabel: 'Friend one', bLabel: 'Friend two', prize: 'friendship-pins'},
  {id: 'dream', title: 'Future / Wish', word: 'DREAM', aLabel: 'Your name', bLabel: 'A hope or wish', prize: 'rose-press'},
  {id: 'mystery', title: 'Mystery', word: 'MYSTERY', aLabel: 'The unexplained word', bLabel: null, prize: 'rose-lockbox'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15 curve. Editable; not final odds. */
export const LOVE_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isLoveWin(level, n) {
  if(firstPrizeEligible('love',level))return true;
  return (LOVE_WINS[level] || LOVE_WINS[0]).includes(n);
}

export function readingFor(level, n) {
  const ch = LOVE_CHAPTERS[level] || LOVE_CHAPTERS[0];
  const x = ((Math.max(1, Number(n) || 1) - 1) % 5);
  // Body only — the booth prints "33% = …" so score + reasoning always show together.
  const lines = {
    love: [
      'A spark, not a fire. Keep the names anyway.',
      'The tester blushes. Not a promise — a flutter.',
      'Warm paper. The machine likes this pairing.',
      'Sweet heat. Rosalie fans herself, purely theatrically.',
      'Boil over. Arithmetic has lost its composure.',
    ],
    vital: [
      'Theatrical vitality. Whimsy only — not medical advice.',
      'The spirits recommend a biscuit, not a doctor. Not medical advice.',
      'Stubborn ache in pencil. Still not a diagnosis. Not medical advice.',
      'Rosalie circles it in red. Whimsy only; not medical advice.',
      'The machine is being dramatic. You are probably fine. Not medical advice.',
    ],
    family: [
      'A quiet bond. The paper does not gossip.',
      'Someone at home is thinking of you, or of supper.',
      'Family arithmetic: messy, fond, unsolved.',
      'The names still belong on the same page.',
      'A strong knot. Do not tell them Rosalie said so.',
    ],
    mates: [
      'Mates. The tester refuses to be unkind.',
      'A good pairing for a paper alley.',
      'Friendship with extra glitter.',
      'Those two names still add up, darling. Arithmetic has not changed its mind.',
      'The machine would sit with you both.',
    ],
    dream: [
      'A small wish, still breathing.',
      'The future is doodling in the margin.',
      'Keep the hope. The paper likes it.',
      'A bright scribble of a tomorrow.',
      'The wish is loud. Rosalie covers her ears, smiling.',
    ],
    mystery: [
      'The spirits are mysterious. The numbers less so.',
      'A riddle with a red-pencil answer.',
      'Unexplained, but neatly added.',
      'The word keeps its secret. The percent does not.',
      'Mystery satisfied, for a schoolyard value of satisfied.',
    ],
  };
  const pack = lines[ch.id] || lines.love;
  return pack[x];
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'rose-penny';
  if (n % 2 === 0) return 'heart-biscuit';
  return 'everyday-penny';
}
