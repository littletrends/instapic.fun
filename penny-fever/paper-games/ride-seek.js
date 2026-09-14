/** Shared Ride & Seek contract for all eight amusements. */

import {done} from './draw.js';
import {alleyPlay, keep} from './wallet.js?v=entry-1';
import {hasUsedFirst, takeAttempt} from './stall-entry.js?v=entry-3';

export const RIDE_SEEK_IDS = ['carousel', 'organ', 'helter', 'ferris', 'swings', 'funhouse', 'balloons', 'mural'];
export const BOOK_KEY = 'pennyFever.rideSeek';

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

export function eligibilityPercent(chapter) {
  if (chapter <= 1) return 50;
  if (chapter <= 3) return 40;
  return 30;
}

export function emptyBook() {
  return {v: 1, missed: {}, slots: {}};
}

function readBook() {
  if (typeof localStorage === 'undefined') return emptyBook();
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK_KEY) || 'null');
    if (blob && blob.v === 1) return {missed: {}, slots: {}, ...blob};
  } catch {}
  return emptyBook();
}

function writeBook(book) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(BOOK_KEY, JSON.stringify(book)); } catch { /* quota */ }
}

export function missedKey(rideId, chapter) {
  return rideId + ':' + String(chapter || 0);
}

export function readMissed(rideId, chapter) {
  return readBook().missed[missedKey(rideId, chapter)] || null;
}

export function writeMissed(rideId, chapter, row) {
  const book = readBook();
  const key = missedKey(rideId, chapter);
  if (row) book.missed[key] = row;
  else delete book.missed[key];
  writeBook(book);
}

export function treasureSlotId(rideId, chapter) {
  return rideId + '_ch' + (Number(chapter) + 1);
}

export function slotOwned(slot) {
  if (!slot) return false;
  if (readBook().slots[slot]) return true;
  return false;
}

export function markSlotOwned(slot, artId, attemptId) {
  if (!slot) return;
  const book = readBook();
  if (book.slots[slot]) return;
  book.slots[slot] = {artId: artId || null, attemptId: attemptId || null, at: Date.now()};
  writeBook(book);
}

export function sealAttempt({rng, chapter, practice, treasureId, rideId, spawnIds}) {
  const slot = rideId != null ? treasureSlotId(rideId, chapter) : null;
  const missed = !practice && rideId != null ? readMissed(rideId, chapter) : null;
  if (missed?.eligible && missed.spawnId && (spawnIds || []).includes(missed.spawnId) && !slotOwned(slot)) {
    return {
      hiddenResult: missed.hiddenResult,
      eligible: true,
      spawnId: missed.spawnId,
      preserved: true,
      slot,
    };
  }
  const roll = Math.min(100, Math.max(1, Math.floor((rng?.() ?? Math.random()) * 100) + 1));
  const alreadyOwned = slotOwned(slot);
  const eligible = !practice && !alreadyOwned && roll <= eligibilityPercent(chapter);
  const spawnId = eligible && spawnIds?.length
    ? spawnIds[Math.floor((rng?.() ?? Math.random()) * spawnIds.length)]
    : null;
  return {hiddenResult: roll, eligible, spawnId, preserved: false, slot};
}

export function boardRide(rideId, chapter) {
  if (!alleyPlay) return {ok: true, practice: true, paid: false};
  const practice = !hasUsedFirst(rideId, chapter);
  const ok = takeAttempt(rideId, chapter);
  return {ok, practice, paid: ok && !practice};
}

export function recordFind(s, id, stall) {
  if (!s || !id) return false;
  s.collected.push({id, kind: 'ordinary', t: s.t});
  if (!s.practice && alleyPlay) keep(id, stall, {celebrate: false});
  return true;
}

export function recordTreasure(s, id) {
  if (!s || !id || s.treasureCollected) return false;
  s.treasureCollected = id;
  s.treasureRevealed = true;
  return true;
}

export function settleArrival(s, {rideId, chapter, treasureId, stall, challengeOk, completionFind}) {
  const practice = !!s.practice;
  const collected = !!s.treasureCollected;
  const revealed = !!s.treasureRevealed;
  const eligible = !!s.eligible;
  const slot = s.slot || treasureSlotId(rideId, chapter);
  const art = treasureId || s.treasureCollected;
  const settle = true;

  if (practice) {
    return {
      settle, won: !!challengeOk, prize: false, advance: !!challengeOk, chapterAdvances: !!challengeOk,
      title: challengeOk ? 'Practice complete' : 'Practice ended',
      detail: challengeOk
        ? 'The chapter opens. Practice granted no keepsakes; paid rides can hold the treasure.'
        : 'Practice used. The next new attempt costs one Penny.',
    };
  }

  if (collected && alleyPlay) keep(art, stall || rideId, {celebrate: true});
  if (collected) markSlotOwned(slot, art, s.attemptId);
  if (collected) writeMissed(rideId, chapter, null);
  else if (revealed && eligible) {
    writeMissed(rideId, chapter, {
      eligible: true,
      spawnId: s.spawnId,
      hiddenResult: s.hiddenResult,
      slot,
    });
  }

  const ordinary = challengeOk && !collected ? (completionFind || 'everyday-penny') : null;
  if (ordinary && alleyPlay) keep(ordinary, stall || rideId, {celebrate: false});

  if (challengeOk && collected) {
    return {
      settle, won: true, prize: art, chapterAdvances: true,
      title: 'Treasure found',
      detail: 'The ride is complete. The keepsake fills this chapter’s Treasure Book slot.',
    };
  }
  if (!challengeOk && collected) {
    return {
      settle, won: false, prize: art, chapterAdvances: false,
      title: 'Keepsake found',
      detail: 'The treasure is yours, but the ride challenge is not complete. Try the chapter again.',
    };
  }
  if (challengeOk && eligible && revealed && !collected) {
    return {
      settle, won: true, prize: ordinary || false, chapterAdvances: true,
      title: 'Treasure escaped',
      detail: 'It can return on a later paid ride. An ordinary find is yours for finishing.',
    };
  }
  if (challengeOk) {
    return {
      settle, won: true, prize: ordinary || false, chapterAdvances: true,
      title: 'Ride complete',
      detail: ordinary ? 'Kept ' + ordinary.replace(/-/g, ' ') + '.' : 'The ride finished.',
    };
  }
  return {
    settle, won: false, prize: false, chapterAdvances: false,
    title: 'The ride returns',
    detail: 'The challenge is not complete. Valid finds stay. Try this chapter again.',
  };
}

export function logAction(s, type, extra = {}) {
  s.actions = s.actions || [];
  s.actions.push({n: s.actions.length + 1, t: Math.round((s.t || 0) * 1000), type, ...extra});
}

export function prefersReducedMotion() {
  try { return !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

export function makeRideState(level, rng, extra = {}) {
  const rand = typeof rng === 'function' ? rng : Math.random;
  return {
    level, t: 0, boarded: false, practice: true, broke: false,
    collected: [], actions: [], note: 'Step aboard.',
    reduced: prefersReducedMotion(), rng: rand,
    eligible: false, spawnId: null, hiddenResult: 0, slot: null, preserved: false,
    treasureCollected: null, treasureRevealed: false, treasure: null, finds: [],
    ...extra,
  };
}

export function ensureBoarded(s, rideId, treasureId, spawnIds) {
  if (s.boarded || s.result) return false;
  s.boarded = true;
  if (s.chapterPrize) { s.chapterPrize.field = true; s.chapterPrize.alpha = 0; }
  const boarding = boardRide(rideId, s.level);
  if (!boarding.ok) {
    s.broke = true;
    done(s, 'Need a penny', 'Cash a ticket at Aura’s booth for five pennies, then board again.', {won: false, prize: false, settle: true});
    return false;
  }
  s.practice = boarding.practice;
  const sealed = sealAttempt({
    rng: s.rng, chapter: s.level, practice: s.practice, treasureId, rideId, spawnIds,
  });
  s.hiddenResult = sealed.hiddenResult;
  s.eligible = sealed.eligible;
  s.spawnId = sealed.spawnId;
  s.preserved = sealed.preserved;
  s.slot = sealed.slot;
  logAction(s, 'board', {practice: s.practice, eligible: s.eligible, spawnId: s.spawnId});
  return true;
}

export function finishRide(s, {rideId, treasureId, challengeOk, completionFind}) {
  if (s.result) return;
  const outcome = settleArrival(s, {
    rideId, chapter: s.level, treasureId, stall: rideId, challengeOk, completionFind,
  });
  done(s, outcome.title, outcome.detail, {
    won: outcome.won,
    prize: outcome.prize,
    advance: outcome.advance === false ? false : undefined,
    settle: true,
  });
}

export function drawHud(d, s, {goal, count, label}) {
  const lap = Math.min(1, (s.progress ?? 0));
  d.arc(70, 70, 28, -Math.PI / 2, -Math.PI / 2 + lap * Math.PI * 2, '#f0d09a', 6);
  d.text(s.practice ? 'Practice' : 'Paid ride', 450, 64, 22, '#f0d09a');
  d.text((count ?? 0) + ' / ' + goal + ' ' + (label || 'complete'), 450, 96, 18, '#e8d0a0');
  if (s.treasureCollected) d.text('Keepsake caught', 450, 124, 16, '#f4d590');
}

export {hasOwn};
