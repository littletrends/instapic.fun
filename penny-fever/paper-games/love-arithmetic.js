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
export function addDown(counts) {
  const start = (counts || []).map(n => ((Number(n) || 0) % 10 + 10) % 10);
  if (!start.length) return {rows: [[]], pct: 100, digits: [0, 0]};
  const rows = [start.slice()];
  while (rows[rows.length - 1].length > 2) {
    const prev = rows[rows.length - 1];
    const next = [];
    for (let i = 0; i < prev.length - 1; i++) next.push((prev[i] + prev[i + 1]) % 10);
    rows.push(next);
  }
  const last = rows[rows.length - 1];
  const digits = last.length === 1 ? [0, last[0]] : [last[0], last[1]];
  const raw = digits[0] * 10 + digits[1];
  const pct = raw === 0 ? 100 : raw;
  return {rows, pct, digits};
}

export function sumPair(a, b) {
  return (((Number(a) || 0) + (Number(b) || 0)) % 10 + 10) % 10;
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
  const x = ((n - 1) % 5);
  const lines = {
    love: [
      n + '% — a spark, not a fire. Keep the names anyway.',
      n + '% — the tester blushes. Not a promise, a flutter.',
      n + '% — warm paper. The machine likes this pairing.',
      n + '% — sweet heat. Rosalie fans herself, purely theatrically.',
      n + '% — boil over. Arithmetic has lost its composure.',
    ],
    vital: [
      n + '% theatrical vitality. Whimsy only — not medical advice.',
      n + '% on the paper. The spirits recommend a biscuit, not a doctor. Not medical advice.',
      n + '% stubborn ache in pencil. Still not a diagnosis.',
      n + '% — Rosalie circs it in red. Whimsy only; not medical advice.',
      n + '% — the machine is being dramatic. You are probably fine. Not medical advice.',
    ],
    family: [
      n + '% — a quiet bond. The paper does not gossip.',
      n + '% — someone at home is thinking of you, or of supper.',
      n + '% — family arithmetic: messy, fond, unsolved.',
      n + '% — the names still belong on the same page.',
      n + '% — a strong knot. Do not tell them Rosalie said so.',
    ],
    mates: [
      n + '% — mates. The tester refuses to be unkind.',
      n + '% — a good pairing for a paper alley.',
      n + '% — friendship with extra glitter.',
      n + '% — those two names still make ' + n + ', darling. Arithmetic has not changed its mind.',
      n + '% — the machine would sit with you both.',
    ],
    dream: [
      n + '% — a small wish, still breathing.',
      n + '% — the future is doodling in the margin.',
      n + '% — keep the hope. The paper likes it.',
      n + '% — a bright scribble of a tomorrow.',
      n + '% — the wish is loud. Rosalie covers her ears, smiling.',
    ],
    mystery: [
      n + '% — the spirits are mysterious. The numbers less so.',
      n + '% — a riddle with a red-pencil answer.',
      n + '% — unexplained, but neatly added.',
      n + '% — the word keeps its secret. The percent does not.',
      n + '% — mystery satisfied, for a schoolyard value of satisfied.',
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
