/** Shared 1–100 prize-second tables. Chapter tabs 1–6 are level 0–5. */

export function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15 curve. Editable; not final odds. */
export const WIN_COUNTS = [50, 40, 30, 25, 20, 15];

export const WIN_SECONDS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

const NOTES = [
  'The clock lights on seconds 1–50.',
  'The clock lights on even seconds through 80.',
  'The clock lights on every third second through 90.',
  'The clock lights on seconds 76–100.',
  'The clock lights on every fifth second.',
  'The clock lights on the prime seconds.',
];

export function winningSeconds(level) {
  const lv = Math.max(0, Math.min(5, level | 0));
  return (WIN_SECONDS[lv] || WIN_SECONDS[0]).slice();
}

export function isWinSecond(level, n) {
  return winningSeconds(level).includes(Number(n));
}

/** Number the 1–100 clock is sitting on after `elapsed` seconds. */
export function clockNumber(elapsed, total = 100) {
  const t = Math.max(0, Number(elapsed) || 0);
  const cap = Math.max(1, Number(total) || 100);
  if (t <= 0) return 1;
  return Math.min(cap, Math.max(1, Math.ceil(t)));
}

export function elapsedSecond(houseLeft, total = 100) {
  const cap = Math.max(1, Number(total) || 100);
  const left = Number(houseLeft);
  if (!Number.isFinite(left)) return 1;
  return clockNumber(cap - left, cap);
}

export function sameSeconds(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** Quiet entry line. Dense chapters use a range; short custom lists are named. */
export function secondsNote(level, seconds) {
  const lv = Math.max(0, Math.min(5, level | 0));
  const list = Array.isArray(seconds) ? seconds : winningSeconds(lv);
  if (!sameSeconds(list, winningSeconds(lv))) {
    if (list.length && list.length <= 10) return 'The clock lights on ' + list.join(', ') + '.';
    return 'The clock lights on this chapter’s prize seconds.';
  }
  return NOTES[lv] || NOTES[0];
}
