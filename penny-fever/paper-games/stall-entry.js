/** Per-stall door and retry charges. Flip a row later without rewriting the game. */

import {alleyPlay, spend} from './wallet.js?v=insights-1';

export const PENNIES_PER_TICKET = 5;
const BOOK = 'pennyFever.tentSitting';

/** Sit-down tents: curtain stays free so chapter 1 is reachable. Chapters 2–6 spend a penny inside. */
export const TICKET_TENTS = [
  'fortune', 'love', 'curios', 'lookup', 'whisper',
  'milk-bottles', 'cover-the-spot', 'mutoscope', 'catoptromancy',
  'fairy-floss', 'popcorn', 'duck-pond', 'dunk-tank', 'marquee', 'pack', 'pass',
];

/** Rail machines: door is free. One penny per round/drop. */
export const PENNY_TENTS = [
  'ball-toss', 'coin-pusher', 'pinball', 'water-gun', 'high-striker',
  'bent-rings', 'plinko', 'skee-ball', 'penny-pitch',
];

/** Empty: Felix Instapic cyber booth is open (webcam Try, game-only). */
export const CLOSED_TENTS = [];

/** Under construction (Lorie 05/11/2026). Delete ids here to reopen. */
export const UNDER_CONSTRUCTION = [
  'whisper', 'ball-toss', 'water-gun', 'cover-the-spot', 'mutoscope', 'high-striker',
  'catoptromancy', 'bent-rings', 'plinko', 'fairy-floss', 'popcorn', 'duck-pond',
  'skee-ball', 'penny-pitch', 'dunk-tank', 'marquee', 'pack', 'pass',
  'carousel', 'balloons', 'swings', 'organ', 'mural', 'ferris',
];
export const UNDER_CONSTRUCTION_LABEL = 'Under construction 🔒';

/** Ride & Seek. Ticket at the door; chapter 1 is the free ride; chapters 2–6 cost a penny. */
export const RIDE_SEEKS = ['carousel', 'organ', 'helter', 'ferris', 'swings', 'funhouse', 'balloons', 'mural'];

const TICKET_SET = new Set(TICKET_TENTS);
const PENNY_SET = new Set(PENNY_TENTS);
const CLOSED_SET = new Set([...CLOSED_TENTS, ...UNDER_CONSTRUCTION]);
const BUILD_SET = new Set(UNDER_CONSTRUCTION);
export function isUnderConstruction(id) { return BUILD_SET.has(id); }
const RIDE_SET = new Set(RIDE_SEEKS);

const PENNY_DOOR_LABEL = {
  'coin-pusher': 'The trays · pennies',
  pinball: 'The table · pennies',
  'ball-toss': 'The plates · pennies',
  'water-gun': 'The harbour · pennies',
  'high-striker': 'The tower · pennies',
  'bent-rings': 'The orchard · pennies',
  plinko: 'The mill · pennies',
  'skee-ball': 'The moonbow · pennies',
  'penny-pitch': 'The dishes · pennies',
};

export function isClosed(id) {
  return CLOSED_SET.has(id);
}

export function entryFor(id) {
  if (CLOSED_SET.has(id)) return {door: 'closed', inside: 'none', firstChapterFree: false};
  if (id === 'snap') return {door: 'free', inside: 'penny', firstChapterFree: true};
  if (id === 'curios') return {door: 'free', inside: 'penny', firstChapterFree: true};
  if (RIDE_SET.has(id)) return {door: 'ticket', inside: 'first-free-then-penny', firstChapterFree: true};
  if (PENNY_SET.has(id)) return {door: 'free', inside: 'penny', firstChapterFree: true};
  if (TICKET_SET.has(id)) return {door: 'free', inside: 'first-free-then-penny', firstChapterFree: true};
  return {door: 'penny', inside: 'penny', firstChapterFree: true};
}

export function doorKind(id) {
  return entryFor(id).door;
}

/** Chapter tabs are 1–6; engines store them as level 0–5. */
export function isChapterOne(chapter) {
  return Math.max(0, Math.floor(Number(chapter) || 0)) === 0;
}

const DRIP_IDS = ['star-token', 'moon-penny', 'rose-penny', 'crown-token'];
export function isDripId(id) {
  return DRIP_IDS.includes(id);
}

/** Chapter bonus is one copy. Everyday pennies still pay the purse. Drips wait until chapter 2. */
export function keepOrdinaryAllowed(id, chapter) {
  if (!id) return false;
  if (isChapterOne(chapter) && (isDripId(id) || id === 'five-penny-stack')) return false;
  if (id === 'everyday-penny' || id === 'five-penny-stack') return true;
  return true;
}

export function enterLabel(id) {
  const door = doorKind(id);
  if (door === 'closed') return BUILD_SET.has(id) ? UNDER_CONSTRUCTION_LABEL : 'Closed for maintenance';
  if (id === 'coin-pusher') return 'The trays · real pennies';
  if (RIDE_SET.has(id)) return 'Board · ticket · Chapter 1 free';
  if (door === 'ticket') return 'Sit down · Chapter 1 free';
  if (door === 'free') {
    if (id === 'snap') return 'Instapic booth · Chapter 1 free';
    return PENNY_DOOR_LABEL[id] || 'Enter · Chapter 1 free';
  }
  return 'Enter · Chapter 1 free';
}

function emptyBook() {
  return {v: 1, sat: {}, first: {}};
}

function readBook() {
  if (typeof localStorage === 'undefined') return emptyBook();
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1) return {sat: {}, first: {}, ...blob};
  } catch {}
  return emptyBook();
}

function writeBook(book) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(BOOK, JSON.stringify(book)); } catch {}
}

export function hasSat(id) {
  return !!readBook().sat[id];
}

export function markSat(id) {
  const book = readBook();
  book.sat[id] = true;
  writeBook(book);
}

export function hasUsedFirst(id, chapter) {
  const row = readBook().first[id] || {};
  return !!row[String(chapter || 0)];
}

/** True if this chapter's included first try was just consumed (no penny). */
export function claimFirstChapter(id, chapter) {
  if (hasUsedFirst(id, chapter)) return false;
  const book = readBook();
  book.first[id] = book.first[id] || {};
  book.first[id][String(chapter || 0)] = true;
  writeBook(book);
  return true;
}

export function retryNote() {
  return alleyPlay
    ? 'A penny for another go. Cash a ticket here for five pennies.'
    : 'Practice pennies are spent.';
}

/** Inside the paper room: workshop is always free. Chapter 1 is free (Copper spends real pennies itself). Chapter 2–6 costs 1 penny a go. Rides take a ticket at the door label; the first ride is free, then a penny. */
export function takeAttempt(stallId, chapter) {
  if (!alleyPlay) return true;
  const spec = entryFor(stallId);
  if (spec.inside === 'none') return true;
  if (isChapterOne(chapter)) return true;
  return spend(1);
}
