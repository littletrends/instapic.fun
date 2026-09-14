/** Per-stall door and retry charges. Flip a row later without rewriting the game. */

import {alleyPlay, spend} from './wallet.js?v=entry-1';

export const PENNIES_PER_TICKET = 5;
const BOOK = 'pennyFever.tentSitting';

/** Sit-down tents: 1 ticket at the door. First try of each chapter is free. Retries are pennies. */
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

/** Felix: Instapic photo booth — paper sign, not a playable tent yet. */
export const CLOSED_TENTS = ['snap'];

/** All eight Ride & Seek attractions. Door is free; first attempt of each chapter is unpaid practice. */
export const RIDE_SEEKS = ['carousel', 'organ', 'helter', 'ferris', 'swings', 'funhouse', 'balloons', 'mural'];

const TICKET_SET = new Set(TICKET_TENTS);
const PENNY_SET = new Set(PENNY_TENTS);
const CLOSED_SET = new Set(CLOSED_TENTS);
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
  if (RIDE_SET.has(id)) return {door: 'free', inside: 'first-free-then-penny', firstChapterFree: true};
  if (PENNY_SET.has(id)) return {door: 'free', inside: 'penny', firstChapterFree: false};
  if (TICKET_SET.has(id)) return {door: 'ticket', inside: 'first-free-then-penny', firstChapterFree: true};
  return {door: 'penny', inside: 'penny', firstChapterFree: false};
}

export function doorKind(id) {
  return entryFor(id).door;
}

export function enterLabel(id) {
  const door = doorKind(id);
  if (door === 'closed') return 'Closed for maintenance';
  if (door === 'ticket') return 'Sit down · 1 ticket';
  if (door === 'free') {
    if (RIDE_SET.has(id)) return 'Board · first go free';
    return PENNY_DOOR_LABEL[id] || 'Enter · pennies';
  }
  return 'Enter · 1 penny';
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

/** Inside the paper room: workshop is always free. */
export function takeAttempt(stallId, chapter) {
  if (!alleyPlay) return true;
  const spec = entryFor(stallId);
  if (spec.inside === 'none') return true;
  if (spec.inside === 'first-free-then-penny') {
    if (claimFirstChapter(stallId, chapter)) return true;
    return spend(1);
  }
  return spend(1);
}
