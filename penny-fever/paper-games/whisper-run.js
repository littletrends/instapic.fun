import {firstPrizeEligible} from './first-prize.js?v=first-prize-1';
/** Isolated Whisper Run: phrases, mutations, chapter relays, 1–100. */

export const WILLA_CHAPTERS = [
  {id: 'one', title: 'First whisper', npcs: 1, flash: 3.2, prize: 'whisper-charm'},
  {id: 'two', title: 'Two mouths', npcs: 2, flash: 2.8, prize: 'charm-pouch'},
  {id: 'three', title: 'Over the ladder', npcs: 3, flash: 2.5, prize: 'secret-keeper'},
  {id: 'four', title: 'A longer secret', npcs: 4, flash: 2.2, prize: 'surprise-parcel'},
  {id: 'five', title: 'Five relays', npcs: 5, flash: 1.8, prize: 'stamp-passport'},
  {id: 'six', title: 'The last bottle home', npcs: 6, flash: 1.6, prize: 'lost-and-found-tag'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

export const WILLA_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isWillaWin(level, n) {
  if(firstPrizeEligible('whisper',level))return true;
  return (WILLA_WINS[level] || WILLA_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 23 + 5);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

export const STARTERS = [
  'The moon stole my silver spoon.',
  'A brass moth keeps the last stamp.',
  'Willa posted a velvet secret.',
  'The lantern hid a paper crown.',
  'Penny boats sleep in the harbour.',
  'The midway keeps a quiet key.',
];

const SWAPS = [
  ['moon', 'moth'], ['stole', 'sold'], ['silver', 'silly'],
  ['brass', 'glass'], ['moth', 'match'], ['stamp', 'stump'],
  ['velvet', 'violet'], ['secret', 'second'], ['lantern', 'lanterns'],
  ['paper', 'pepper'], ['crown', 'crowd'], ['boats', 'goats'],
  ['harbour', 'arbour'], ['midway', 'midnight'], ['quiet', 'quite'],
  ['key', 'tea'], ['posted', 'toasted'], ['keeps', 'kept'],
];

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function mutate(phrase, roll) {
  const lower = String(phrase);
  const usable = SWAPS.filter(([a]) => new RegExp('\\b' + a + '\\b', 'i').test(lower));
  if (!usable.length) return phrase.replace(/spoon/i, 'spool').replace(/key/i, 'tea');
  const [from, to] = usable[Math.floor(roll() * usable.length) % usable.length];
  return lower.replace(new RegExp('\\b' + from + '\\b', 'i'), (m) => {
    if (m[0] === m[0].toUpperCase()) return to[0].toUpperCase() + to.slice(1);
    return to;
  });
}

export function threeCards(truePhrase, roll) {
  const a = truePhrase;
  let b = mutate(a, roll);
  let c = mutate(a, roll);
  let guard = 0;
  while (b === a && guard++ < 8) b = mutate(a, roll);
  while ((c === a || c === b) && guard++ < 16) c = mutate(b === a ? a : b, roll);
  const cards = [a, b, c];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function makeRelay(level, seed) {
  const ch = WILLA_CHAPTERS[level] || WILLA_CHAPTERS[0];
  const roll = rng(seed);
  const original = STARTERS[Math.floor(roll() * STARTERS.length)];
  return {level, seed, original, current: original, npcs: ch.npcs, flash: ch.flash, step: 0, log: [original]};
}

export const NPC_NAMES = ['Bess', 'Dot', 'Pip', 'Mabel', 'Skip', 'Aura'];
