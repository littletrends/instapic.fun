import {firstPrizeEligible} from './first-prize.js?v=first-prize-1';
/** Isolated Vanishing Spot: covers, fair shuffles, 1–100. */

export const DOT_CHAPTERS = [
  {id: 'three', title: 'Three Little Covers', covers: 3, swaps: 4, speed: 0.9, rows: 1, adjacent: true, fakes: false, curtain: false, prize: 'perfect-circle'},
  {id: 'crossing', title: 'Crossing Tracks', covers: 4, swaps: 6, speed: 0.72, rows: 1, cross: true, fakes: false, curtain: false, prize: 'pressed-flower-book'},
  {id: 'stairs', title: 'Upstairs, Downstairs', covers: 4, swaps: 6, speed: 0.66, rows: 2, fakes: false, curtain: false, prize: 'felt-moon-disc'},
  {id: 'false', title: 'The False Dot', covers: 5, swaps: 7, speed: 0.56, rows: 1, fakes: true, curtain: false, prize: 'spring-seed-packet'},
  {id: 'curtain', title: 'Behind the Curtain', covers: 5, swaps: 8, speed: 0.5, rows: 2, fakes: false, curtain: true, prize: 'garden-party-book'},
  {id: 'vanish', title: 'The Vanishing Spot', covers: 6, swaps: 10, speed: 0.4, rows: 2, fakes: true, curtain: true, prize: 'charm-display-case'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const DOT_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isDotWin(level, n) {
  if(firstPrizeEligible('cover-the-spot',level))return true;
  return (DOT_WINS[level] || DOT_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 21 + 9);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

export function coverLabel(id) {
  return String.fromCharCode(65 + (Number(id) || 0));
}

export function coverRadius(n) {
  if (n >= 6) return 46;
  if (n >= 5) return 52;
  if (n >= 4) return 58;
  return 66;
}

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function layoutSlots(n, rows) {
  const count = Math.max(1, n | 0);
  if ((rows || 1) < 2) {
    return Array.from({length: count}, (_, i) => ({
      i, x: 150 + (i + 0.5) * (600 / count), y: 710, row: 0,
    }));
  }
  const top = Math.ceil(count / 2);
  const bot = count - top;
  const slots = [];
  for (let i = 0; i < top; i++) {
    slots.push({i, x: 170 + (i + 0.5) * (560 / top), y: 438, row: 1});
  }
  for (let i = 0; i < bot; i++) {
    slots.push({i: top + i, x: 170 + (i + 0.5) * (560 / bot), y: 792, row: 0});
  }
  return slots;
}

function pickPair(ch, n, slots, roll, k) {
  if (ch.adjacent && n > 1) {
    const sa = Math.floor(roll() * (n - 1));
    return [sa, sa + 1];
  }
  if (ch.rows > 1 && k % 2 === 0) {
    const top = slots.filter(s => s.row === 1).map(s => s.i);
    const bot = slots.filter(s => s.row === 0).map(s => s.i);
    if (top.length && bot.length) {
      return [
        top[Math.floor(roll() * top.length)],
        bot[Math.floor(roll() * bot.length)],
      ];
    }
  }
  let sa = Math.floor(roll() * n);
  let sb = Math.floor(roll() * n);
  let guard = 0;
  while (sb === sa && guard++ < 10) sb = Math.floor(roll() * n);
  if (sb === sa) sb = (sa + 1) % n;
  return [sa, sb];
}

export function makeDeal(level, seed) {
  const ch = DOT_CHAPTERS[level] || DOT_CHAPTERS[0];
  const roll = rng(seed);
  const n = ch.covers;
  const slots = layoutSlots(n, ch.rows);
  const covers = Array.from({length: n}, (_, i) => ({
    id: i, slot: i, x: slots[i].x, y: slots[i].y, z: 0, lift: 0,
  }));
  const spotId = Math.floor(roll() * n);
  const occ = Array.from({length: n}, (_, i) => i);
  const swaps = [];
  for (let k = 0; k < ch.swaps; k++) {
    const [sa, sb] = pickPair(ch, n, slots, roll, k);
    const a = occ[sa];
    const b = occ[sb];
    occ[sa] = b;
    occ[sb] = a;
    const fakePool = covers.map(c => c.id).filter(id => id !== spotId);
    const cross = !!(ch.cross || Math.abs(sa - sb) > 1 || slots[sa].row !== slots[sb].row);
    swaps.push({
      a, b, fromA: sa, fromB: sb, toA: sb, toB: sa,
      duration: ch.speed,
      cross,
      curtain: !!(ch.curtain && k % 2 === 1),
      fake: ch.fakes && fakePool.length ? fakePool[Math.floor(roll() * fakePool.length)] : null,
    });
  }
  return {
    level, seed, covers, slots, spotId, swaps,
    phase: 'show', swapIndex: 0, swapT: 0, showLeft: 1.7,
    choice: -1, correct: false,
  };
}

function settleCovers(deal) {
  for (const c of deal.covers) {
    const sl = deal.slots[c.slot];
    if (!sl) continue;
    c.x = sl.x;
    c.y = sl.y;
    c.z = 0;
    c.lift = deal.phase === 'show' && c.id === deal.spotId ? 26 : 0;
  }
}

export function spotCover(deal) {
  return deal ? deal.spotId : -1;
}

export function spotPath(deal) {
  let slot = deal.spotId;
  const path = [slot];
  for (const sw of deal.swaps || []) {
    if (sw.a === deal.spotId) slot = sw.toA;
    else if (sw.b === deal.spotId) slot = sw.toB;
    path.push(slot);
  }
  return path;
}

export function skipToPick(deal) {
  if (!deal) return deal;
  deal.covers.forEach(c => { c.slot = c.id; });
  for (const sw of deal.swaps) {
    const a = deal.covers.find(c => c.id === sw.a);
    const b = deal.covers.find(c => c.id === sw.b);
    if (a) a.slot = sw.toA;
    if (b) b.slot = sw.toB;
  }
  deal.swapIndex = deal.swaps.length;
  deal.swapT = 0;
  deal.showLeft = 0;
  deal.phase = 'pick';
  settleCovers(deal);
  return deal;
}

export function coverHidden(deal, coverId, reduced) {
  if (reduced || !deal || deal.phase !== 'shuffle') return false;
  const sw = deal.swaps[deal.swapIndex];
  if (!sw || !sw.curtain) return false;
  const u = deal.swapT / (sw.duration || 0.6);
  return u > 0.22 && u < 0.78 && (coverId === sw.a || coverId === sw.b);
}

export function fakeId(deal) {
  if (!deal || deal.phase !== 'shuffle') return -1;
  const sw = deal.swaps[deal.swapIndex];
  return sw && sw.fake != null ? sw.fake : -1;
}

export function stepDeal(deal, dt, reduced) {
  if (!deal || deal.phase === 'pick' || deal.phase === 'reveal') return deal;
  const slow = reduced ? 0.45 : 1;
  if (deal.phase === 'show') {
    deal.showLeft -= dt;
    const spot = deal.covers.find(c => c.id === deal.spotId);
    if (spot) spot.lift = 26;
    if (deal.showLeft <= 0) {
      if (spot) spot.lift = 0;
      deal.phase = 'shuffle';
      deal.swapIndex = 0;
      deal.swapT = 0;
    }
    return deal;
  }
  if (deal.phase !== 'shuffle') return deal;
  const sw = deal.swaps[deal.swapIndex];
  if (!sw) {
    deal.phase = 'pick';
    settleCovers(deal);
    return deal;
  }
  deal.swapT += dt * slow;
  const dur = sw.duration || 0.6;
  const u = Math.min(1, deal.swapT / dur);
  const e = u * u * (3 - 2 * u);
  const a = deal.covers.find(c => c.id === sw.a);
  const b = deal.covers.find(c => c.id === sw.b);
  const sa = deal.slots[sw.fromA];
  const sb = deal.slots[sw.fromB];
  const bulge = Math.sin(u * Math.PI);
  if (a && sa && sb) {
    a.x = sa.x + (sb.x - sa.x) * e;
    a.y = sa.y + (sb.y - sa.y) * e - (sw.cross ? bulge * 36 : 0);
    a.z = sw.cross ? bulge : 0;
  }
  if (b && sa && sb) {
    b.x = sb.x + (sa.x - sb.x) * e;
    b.y = sb.y + (sa.y - sb.y) * e + (sw.cross ? bulge * 28 : 0);
    b.z = sw.cross ? -bulge : 0;
  }
  if (u >= 1) {
    if (a) { a.slot = sw.toA; a.z = 0; }
    if (b) { b.slot = sw.toB; b.z = 0; }
    settleCovers(deal);
    deal.swapIndex += 1;
    deal.swapT = 0;
    if (deal.swapIndex >= deal.swaps.length) {
      deal.phase = 'pick';
      settleCovers(deal);
    }
  }
  return deal;
}

export function chooseCover(deal, coverId) {
  if (!deal || deal.phase !== 'pick') return false;
  const id = Number(coverId);
  if (!deal.covers.some(c => c.id === id)) return false;
  deal.choice = id;
  deal.correct = id === deal.spotId;
  deal.phase = 'reveal';
  deal.covers.forEach(c => {
    c.lift = (c.id === id || c.id === deal.spotId) ? 26 : 0;
  });
  return deal.correct;
}

export function hitCover(deal, x, y) {
  if (!deal) return -1;
  const r = coverRadius(deal.covers.length);
  let best = -1;
  let bestD = r;
  for (const c of deal.covers) {
    const d = Math.hypot(x - c.x, y - (c.y - (c.lift || 0)));
    if (d <= bestD) { bestD = d; best = c.id; }
  }
  return best;
}
