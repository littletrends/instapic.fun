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

/** How many of 1–100 pay the chapter unique, if the sitting lands clean. Same curve as Iris. */
export const WIN_COUNTS = [50, 40, 30, 25, 20, 15];

/**
 * Fixed per chapter: seeded subset of 1–100 (Iris algorithm, Love-specific seed base).
 * Wrapping/repeating the same percent always hits the same win set — not reshuffled per sitting.
 */
export const LOVE_WINS = WIN_COUNTS.map((count, level) => {
  const roll = rng(5203 + level * 7919);
  return shuffle(roll, span(1, 100)).slice(0, count).sort((a, b) => a - b);
});

/** Membership only — no first-try auto bonus. Final 1–100 decides. */
export function isLoveWin(level, n) {
  return (LOVE_WINS[level] || LOVE_WINS[0]).includes(n);
}

/** One hundred general fortune-teller lines in Rosalie's Love Tester voice. */
export const LOVE_READINGS = [
  "A soft blush on the paper. Keep the names close.",
  "The machine fans itself, purely theatrically.",
  "Warm arithmetic. Nothing cruel tonight.",
  "A flutter, not a decree. Still worth writing down.",
  "Rosalie taps the glass. Favour likes patience.",
  "The pencil is fond of you. Do not argue with fond pencils.",
  "A sweet heat in the margin. Not a promise — a wink.",
  "Schoolyard magic: messy, pink, sincere.",
  "Someone is thinking of you between errands.",
  "The tester refuses to be unkind. Take the compliment.",
  "A ribbon of luck is already in your pocket.",
  "Write it twice if you must. The second time is luckier.",
  "The alley keeps a soft rumour about your heart.",
  "A biscuit-sized blessing. Eat it slowly.",
  "Tonight’s numbers are theatrical, not tyrannical.",
  "Rosalie covers a smile with a red pencil.",
  "A small yes is practising how to find you.",
  "The paper prefers kindness. So do the spirits.",
  "Keep one pocket empty for a surprise valentine.",
  "A warm window is waiting after the sitting.",
  "Do not hurry the blush. It knows its cue.",
  "The machine likes pairs that laugh at themselves.",
  "A quiet compliment, delivered in percent.",
  "Fortune here smells like rose soap and pencil shavings.",
  "You are allowed to hope in public.",
  "A soft landing is being arranged for your nerves.",
  "The next kind word will arrive from an odd angle.",
  "Rosalie rates this sitting as ‘promisingly silly’.",
  "Hold the smaller affection. The large one will follow.",
  "A glitter of luck — not enough to blind, enough to notice.",
  "The glass remembers gentle hands.",
  "Ask the kinder question first.",
  "A stray smile is carrying your luck for an hour.",
  "The next song on the alley radio is accidentally for you.",
  "Fold the worry into a paper heart. Smaller already.",
  "A light in another booth is answering yours.",
  "You will be invited twice. Go when you are ready.",
  "Believe the kind part of the machine’s drama.",
  "A penny spent on affection buys a story, not a rule.",
  "Stand where the lantern can see your face.",
  "The thing you almost said is still useful.",
  "A ribbon will come back to you, slightly warmer.",
  "Leave the list with the night. It is a good clerk.",
  "The next stranger may not stay a stranger long.",
  "Keep the smaller promise. Hearts notice.",
  "A door held open is a fortune of its own.",
  "You may change your mind at the gate. Rosalie allows it.",
  "The moth chose the kinder lamp tonight.",
  "A quiet table has room for two names.",
  "Tomorrow morning will explain tonight’s blush.",
  "Paper crowns still count as courage practice.",
  "Take the long way home. Something soft wants finding.",
  "A name you like is rehearsing how to say yours.",
  "Stop adding wishes. The bottle is full enough.",
  "Someone is saving a seat without making a fuss.",
  "The key was waiting to be used, not missing.",
  "A soft landing, theatrical cushions included.",
  "Look up when the music turns pink.",
  "The next apology can be short and real.",
  "A star you cannot name is still working overtime.",
  "Put your hand on the warm wood. Stay a moment.",
  "The alley keeps a kind rumour about your laugh.",
  "You will recognise the right stall by rose and rain.",
  "A small delay is protecting something tender.",
  "The fortune you wanted is less interesting than this one.",
  "Let the night finish its sentence before you interrupt.",
  "A borrowed coat of confidence will fit better than you think.",
  "The next laugh will arrive from beside you.",
  "Keep the ticket stub. The date is not the point.",
  "A window unlatches if you stop rattling it.",
  "The tester has chosen gentle weather.",
  "Someone is proud of you and has not said so yet.",
  "The path that looks dull has the better lanterns.",
  "A wish spent slowly lasts the week.",
  "You are not late for your own affection.",
  "The next hush in the crowd is for you to hear.",
  "Carry a cup of courage, not the whole well.",
  "A gold thread is already in the hem of today.",
  "The last light on the street is still a light.",
  "Say the true thing softly. It will travel farther.",
  "The glass returns what you give it: patience.",
  "A new map is being drawn with your footsteps.",
  "Tomorrow will knock. Let it in slowly.",
  "The fortune is finished. Walk on, lucky.",
  "Rosalie stamps this with a theatrical seal of approval.",
  "A crush-sized comet. Catch it gently.",
  "The pencil underlines hope, not doom.",
  "Share the biscuit. Luck prefers company.",
  "A pink margin note: you are doing fine.",
  "The machine clears its throat and chooses kindness.",
  "Keep the valentine even if it is only paper.",
  "A soft drumroll for ordinary sweetness.",
  "Someone’s day improves because you showed up.",
  "The arithmetic of affection: add, do not subtract.",
  "A schoolyard oath: be braver than embarrassed.",
  "Warm hands, warm numbers. That is the whole trick.",
  "Rosalie bows. The sitting was a success of spirit.",
  "Leave a little glitter for the next guest.",
  "The percent is theatre. The care is real.",
  "Walk on with your reading. The alley is smiling.",
];

/** Short chapter flavour (~8 lines each). Combined with LOVE_READINGS[n-1]. */
export const LOVE_THEME_FLAVOUR = {
  love: [
    "A spark, not a fire.",
    "The tester blushes on cue.",
    "Warm paper between two names.",
    "Sweet heat, purely theatrical.",
    "A flutter worth keeping.",
    "Boil-over drama in pink ink.",
    "Crush arithmetic, fond and silly.",
    "The machine fans itself for you.",
  ],
  vital: [
    "Theatrical vim only.",
    "A biscuit-sized pep talk.",
    "Stubborn pencil, kind verdict.",
    "Rosalie circles energy in red.",
    "The paper recommends a stretch.",
    "Dramatic vitality, not a diagnosis.",
    "A lively scribble of courage.",
    "Have a biscuit; the machine insists.",
  ],
  family: [
    "A quiet knot.",
    "Home-shaped arithmetic.",
    "The paper does not gossip.",
    "Names that still share a page.",
    "Fond mess, unsolved and dear.",
    "Someone at home thinks of supper — or you.",
    "A strong ribbon, gently tied.",
    "Do not tell them Rosalie said so.",
  ],
  mates: [
    "Mates, glitter optional.",
    "The tester refuses unkindness.",
    "A good pairing for a paper alley.",
    "Friendship with extra sparkle.",
    "Two names, one silly machine.",
    "The booth would sit with you both.",
    "Loyalty in schoolyard percent.",
    "A laugh shared is already a win.",
  ],
  dream: [
    "A small wish, still breathing.",
    "The future doodles in the margin.",
    "Keep the hope; the paper likes it.",
    "A bright scribble of tomorrow.",
    "The wish is loud; Rosalie smiles.",
    "Hope with glitter on its shoes.",
    "A tomorrow practising its entrance.",
    "Wish carefully, then wish kindly.",
  ],
  mystery: [
    "The spirits are mysterious; the numbers less so.",
    "A riddle with a red-pencil answer.",
    "Unexplained, but neatly added.",
    "The word keeps its secret.",
    "Mystery satisfied, schoolyard edition.",
    "A hush with a pink bow on it.",
    "The unexplained word winks.",
    "Rosalie shrugs theatrically — and knows.",
  ],
};

export function readingFor(level, n) {
  const ch = LOVE_CHAPTERS[level] || LOVE_CHAPTERS[0];
  const pct = Math.max(1, Math.min(100, n | 0));
  const pack = LOVE_THEME_FLAVOUR[ch.id] || LOVE_THEME_FLAVOUR.love;
  const flavour = pack[(pct - 1) % pack.length];
  const general = LOVE_READINGS[pct - 1] || LOVE_READINGS[0];
  const label = ch.id.charAt(0).toUpperCase() + ch.id.slice(1);
  return '[' + label + '] ' + flavour + ' ' + general;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'rose-penny';
  if (n % 2 === 0) return 'heart-biscuit';
  return 'everyday-penny';
}
