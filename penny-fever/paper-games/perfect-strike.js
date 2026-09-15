import {firstPrizeEligible} from './first-prize.js?v=first-prize-1';
/** Isolated Perfect Strike: pull/hold power, moving sweet spot, called bells, 1–100. */

export const STRIKES = 3;
export const BASE_Y = 980;
export const PLATE_X = 450;
export const PLATE_HALF = 140;
export const MIN_PULL = 0.12;

export const MAGNUS_CHAPTERS = [
  {
    id: 'top', title: 'Ring the Top',
    bells: [{id: 'top', y: 300, label: 'Top'}],
    called: ['top'], pickCall: false, peal: false, add: false,
    moving: false, moveAmp: 0, moveSpeed: 1.6, tight: 0.35, window: 52,
    resist: [1, 1, 1], prize: 'mighty-mallet',
  },
  {
    id: 'call', title: 'Call the Bell',
    bells: [
      {id: 'low', y: 760, label: 'Low'},
      {id: 'mid', y: 540, label: 'Mid'},
      {id: 'high', y: 320, label: 'High'},
    ],
    called: ['mid'], pickCall: true, peal: false, add: false,
    moving: false, moveAmp: 0, moveSpeed: 1.6, tight: 0.55, window: 30,
    resist: [1, 1, 1], prize: 'bell-bracelet',
  },
  {
    id: 'crook', title: 'Crooked Anvil',
    bells: [
      {id: 'low', y: 760, label: 'Low'},
      {id: 'mid', y: 540, label: 'Mid'},
      {id: 'high', y: 320, label: 'High'},
    ],
    called: ['mid'], pickCall: false, peal: false, add: false,
    moving: true, moveAmp: 110, moveSpeed: 1.8, tight: 1.15, window: 26,
    resist: [1, 1, 1], prize: 'bell-of-bravery',
  },
  {
    id: 'double', title: 'Double Strike',
    bells: [
      {id: 'low', y: 760, label: 'Low'},
      {id: 'mid', y: 540, label: 'Mid'},
      {id: 'high', y: 320, label: 'High'},
    ],
    called: ['high'], pickCall: false, peal: false, add: true,
    moving: false, moveAmp: 0, moveSpeed: 1.6, tight: 0.5, window: 28,
    resist: [1, 1, 1], prize: 'perfect-play-medal',
  },
  {
    id: 'weight', title: 'Counterweight',
    bells: [
      {id: 'low', y: 760, label: 'Low'},
      {id: 'mid', y: 540, label: 'Mid'},
      {id: 'high', y: 320, label: 'High'},
    ],
    called: ['mid'], pickCall: false, peal: false, add: false,
    moving: false, moveAmp: 0, moveSpeed: 1.6, tight: 0.6, window: 26,
    resist: [0.78, 1.22, 0.94], prize: 'midway-master-crown',
  },
  {
    id: 'peal', title: 'The Perfect Peal',
    bells: [
      {id: 'low', y: 760, label: 'Low'},
      {id: 'mid', y: 540, label: 'Mid'},
      {id: 'high', y: 320, label: 'High'},
    ],
    called: ['low', 'mid', 'high'], pickCall: false, peal: true, add: false,
    moving: true, moveAmp: 70, moveSpeed: 1.5, tight: 0.7, window: 22,
    resist: [1, 0.82, 1.18], prize: 'foundry-spark',
  },
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const MAGNUS_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isMagnusWin(level, n) {
  if(firstPrizeEligible('high-striker',level))return true;
  return (MAGNUS_WINS[level] || MAGNUS_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 29 + 3);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

export function magnusUnique(level, n, correctHits) {
  return (Number(correctHits) || 0) >= 1 && isMagnusWin(level, n);
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function calledList(level, seed) {
  const ch = MAGNUS_CHAPTERS[level] || MAGNUS_CHAPTERS[0];
  if (ch.peal) return ch.bells.map(b => b.id);
  if (ch.pickCall) {
    const ids = ch.bells.map(b => b.id);
    const i = Math.abs((Number(seed) || 0) * 13 + 7) % ids.length;
    return [ids[i]];
  }
  return (ch.called || [ch.bells[0].id]).slice();
}

export function calledForStrike(level, seed, index) {
  const list = calledList(level, seed);
  const ch = MAGNUS_CHAPTERS[level] || MAGNUS_CHAPTERS[0];
  if (ch.peal) return list[Math.min(index, list.length - 1)];
  return list[0];
}

export function sweetAt(level, t, reduced = false) {
  const ch = MAGNUS_CHAPTERS[level] || MAGNUS_CHAPTERS[0];
  if (!ch.moving) return PLATE_X;
  const tau = reduced ? t * 0.35 : t;
  return PLATE_X + Math.sin(tau * ch.moveSpeed) * ch.moveAmp;
}

export function resistAt(level, index) {
  const ch = MAGNUS_CHAPTERS[level] || MAGNUS_CHAPTERS[0];
  return ch.resist[Math.min(Math.max(0, index), ch.resist.length - 1)];
}

export function puckYFromLift(lift) {
  return BASE_Y - (80 + lift * 720);
}

export function liftFromPuck(y) {
  return (BASE_Y - 80 - y) / 720;
}

export function commitPull(pull) {
  if (pull < MIN_PULL) return null;
  return clamp(pull, 0, 1);
}

export function resolveStrike({
  level = 0, seed = 1, pull = 0, contactX = PLATE_X, t = 0, index = 0, acc = 0, reduced = false,
} = {}) {
  const ch = MAGNUS_CHAPTERS[level] || MAGNUS_CHAPTERS[0];
  const committed = commitPull(pull);
  if (committed == null) {
    return {cancelled: true, lift: acc, puckY: puckYFromLift(acc), rang: null, correct: false, called: calledForStrike(level, seed, index)};
  }
  const sweet = sweetAt(level, t, reduced);
  const err = Math.abs(contactX - sweet) / PLATE_HALF;
  const accuracy = clamp(1 - err * ch.tight, 0.2, 1);
  const resist = resistAt(level, index);
  const shot = committed * accuracy * resist;
  let lift = ch.add ? acc + shot * 0.72 : shot;
  if (lift > 1.35) lift = 1.35;
  const puckY = puckYFromLift(lift);
  const called = calledForStrike(level, seed, index);
  let rang = null;
  let best = Infinity;
  for (const bell of ch.bells) {
    const d = Math.abs(puckY - bell.y);
    if (d <= ch.window && d < best) {
      best = d;
      rang = bell.id;
    }
  }
  const top = ch.bells.reduce((a, b) => (a.y < b.y ? a : b));
  const low = ch.bells.reduce((a, b) => (a.y > b.y ? a : b));
  const overshoot = puckY < top.y - ch.window;
  const undershoot = !rang && !overshoot && puckY > low.y + ch.window;
  return {
    cancelled: false,
    lift, puckY, rang, called,
    correct: rang === called,
    overshoot, undershoot, accuracy, resist, sweet, shot,
  };
}

export function pullForBell(level, bellId, {resist = 1, accuracy = 1, acc = 0, add = false} = {}) {
  const ch = MAGNUS_CHAPTERS[level] || MAGNUS_CHAPTERS[0];
  const bell = ch.bells.find(b => b.id === bellId) || ch.bells[0];
  const want = liftFromPuck(bell.y);
  if (add) {
    const need = (want - acc) / 0.72;
    return clamp(need / ((resist || 1) * (accuracy || 1)), 0, 1);
  }
  return clamp(want / ((resist || 1) * (accuracy || 1)), 0, 1);
}
