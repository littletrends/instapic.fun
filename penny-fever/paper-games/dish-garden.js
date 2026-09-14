/** Isolated Dish Garden: bowls, cloth tug, 1–100. */

export const PENELOPE_CHAPTERS = [
  {id: 'first', title: 'First Wish', prize: 'well-wish-penny', coins: 3, tug: 90, lockZ: 0, dance: 0, track: 0, raise: false, placeMin: 260, placeMax: 640},
  {id: 'little', title: 'Little Dish Garden', prize: 'skipping-stone', coins: 3, tug: 110, lockZ: 0, dance: 0, track: 0, raise: false, placeMin: 250, placeMax: 650},
  {id: 'trick', title: 'The Tablecloth Trick', prize: 'well-coin', coins: 3, tug: 168, lockZ: 0, dance: 0, track: 0, raise: false, placeMin: 300, placeMax: 500, needTug: true},
  {id: 'dancing', title: 'Dancing China', prize: 'three-well-plaque', coins: 3, tug: 100, lockZ: 36, dance: 28, track: 0, raise: false, placeMin: 250, placeMax: 650},
  {id: 'crooked', title: 'Crooked Crockery', prize: 'wish-ribbon', coins: 3, tug: 120, lockZ: 0, dance: 0, track: 0, raise: true, placeMin: 240, placeMax: 660},
  {id: 'impossible', title: 'The Impossible Wish', prize: 'well-claim', coins: 3, tug: 72, lockZ: 40, dance: 0, track: 70, raise: true, placeMin: 280, placeMax: 620},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const PENELOPE_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isPenelopeWin(level, n) {
  return (PENELOPE_WINS[level] || PENELOPE_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 31 + 13);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function bowl(id, x, y, r, extra = {}) {
  return {
    id, baseX: x, baseY: y, x, y, r,
    marked: !!extra.marked, decoy: !!extra.decoy,
    bounce: extra.bounce || 1, raise: extra.raise || 0, tilt: extra.tilt || 0,
    dance: extra.dance || 0, phase: extra.phase || 0, track: extra.track || 0,
    name: extra.name || id, symbol: extra.symbol || (extra.marked ? 'wish' : 'petal'),
  };
}

export function markedBowl(table) {
  return (table?.bowls || []).find(b => b.marked) || null;
}

export function makeCoin(placeX, angle, power) {
  const a = Number(angle) || 0;
  const p = Number(power) || 280;
  return {
    x: Number(placeX) || 450,
    y: 1010,
    z: 12,
    vx: Math.sin(a) * p * 0.55,
    vy: -Math.abs(Math.cos(a) * p * 0.42) - 90,
    vz: 118 + Math.abs(p) * 0.08,
    spin: a * 8 + p * 0.01,
    settled: false, bowlId: null, age: 0, rimmed: 0,
  };
}

export function makeTable(level, seed) {
  const ch = PENELOPE_CHAPTERS[level] || PENELOPE_CHAPTERS[0];
  const roll = rng(seed);
  const bowls = [];
  if (level === 0) {
    bowls.push(
      bowl('left', 300, 640, 70, {name: 'left dish', symbol: 'moon'}),
      bowl('wish', 450, 620, 86, {marked: true, name: 'wishing bowl', symbol: 'wish'}),
      bowl('right', 600, 640, 70, {name: 'right dish', symbol: 'star'}),
    );
  } else if (level === 1) {
    const side = Math.floor(roll() * 3);
    const xs = [300, 450, 600];
    bowls.push(
      bowl('a', 280, 700, 48, {name: 'saucer', symbol: 'petal'}),
      bowl('b', 450, 720, 42, {name: 'cup', symbol: 'heart'}),
      bowl('c', 620, 700, 48, {name: 'tin', symbol: 'star'}),
      bowl('d', 360, 540, 40, {name: 'little well', symbol: 'moon'}),
      bowl('e', 540, 540, 40, {name: 'sister well', symbol: 'moth'}),
      bowl('wish', xs[side], 500, 58, {marked: true, name: 'wishing bowl', symbol: 'wish'}),
    );
  } else if (level === 2) {
    bowls.push(
      bowl('block', 450, 780, 54, {name: 'near decoy', decoy: true, symbol: 'petal'}),
      bowl('mid', 430, 620, 46, {name: 'garden cup', decoy: true, symbol: 'heart'}),
      bowl('wish', 700, 520, 50, {marked: true, name: 'far wishing bowl', symbol: 'wish'}),
      bowl('left', 260, 560, 44, {name: 'left decoy', decoy: true, symbol: 'moon'}),
    );
  } else if (level === 3) {
    bowls.push(
      bowl('a', 320, 680, 44, {dance: ch.dance, phase: 0.2, name: 'waltz saucer', symbol: 'petal'}),
      bowl('b', 560, 680, 44, {dance: ch.dance, phase: 1.1, name: 'reel cup', symbol: 'star'}),
      bowl('c', 450, 540, 40, {dance: ch.dance * 0.8, phase: 2.2, name: 'spin dish', symbol: 'heart'}),
      bowl('wish', 450, 430, 48, {marked: true, dance: ch.dance * 0.6, phase: 0.6, name: 'dancing wish', symbol: 'wish'}),
      bowl('d', 250, 500, 36, {dance: ch.dance, phase: 3, name: 'side bowl', symbol: 'moon'}),
      bowl('e', 650, 500, 36, {dance: ch.dance, phase: 4, name: 'side sister', symbol: 'moth'}),
    );
  } else if (level === 4) {
    bowls.push(
      bowl('low', 450, 760, 50, {raise: 0, bounce: 1.4, name: 'low crock', symbol: 'petal'}),
      bowl('tiltL', 300, 600, 38, {raise: 18, tilt: -0.35, bounce: 1.8, name: 'tilted saucer', symbol: 'moon'}),
      bowl('tiltR', 600, 600, 38, {raise: 18, tilt: 0.35, bounce: 1.8, name: 'tilted sister', symbol: 'star'}),
      bowl('high', 450, 500, 34, {raise: 26, bounce: 0.7, name: 'raised dish', symbol: 'heart'}),
      bowl('wish', 520, 400, 36, {marked: true, raise: 10, bounce: 0.9, name: 'narrow wish', symbol: 'wish'}),
      bowl('bank', 250, 430, 32, {raise: 22, bounce: 2, name: 'bank bowl', symbol: 'moth'}),
    );
  } else {
    const decoys = [
      [280, 720, 40], [450, 740, 46], [620, 720, 40],
      [320, 600, 34], [580, 600, 34], [400, 500, 30], [520, 500, 30],
      [250, 480, 28], [650, 480, 28], [360, 390, 26], [540, 390, 26],
    ];
    decoys.forEach((row, i) => {
      bowls.push(bowl('d' + i, row[0], row[1], row[2], {decoy: true, raise: i > 6 ? 12 : 0, name: 'decoy dish', symbol: ['petal', 'heart', 'star', 'moon', 'moth'][i % 5]}));
    });
    bowls.push(bowl('wish', 450, 420, 28, {marked: true, track: ch.track, name: 'golden wish', symbol: 'wish'}));
  }

  return {
    level, seed, bowls, cloth: 0, tugDist: ch.tug, tugLeft: true,
    coins: ch.coins, prize: ch.prize, title: ch.title,
    lockZ: ch.lockZ, needTug: !!ch.needTug, placeMin: ch.placeMin, placeMax: ch.placeMax,
    dance: ch.dance, track: ch.track, t: 0, frozen: false, coin: null,
  };
}

export function layoutBowls(table, t = table.t, frozen = table.frozen) {
  const time = frozen ? table.freezeT || t : t;
  for (const b of table.bowls) {
    const dance = (!frozen && b.dance) ? Math.cos(time * 1.4 + b.phase) * b.dance : (frozen ? b.danceX || 0 : 0);
    const track = b.track ? Math.sin(time * 1.15) * b.track : 0;
    if (!frozen) b.danceX = dance;
    b.x = b.baseX + table.cloth + dance + track;
    b.y = b.baseY;
  }
}

export function tugCloth(table, dir) {
  if (!table || !table.tugLeft || !table.coin || table.coin.settled || table.coin.z <= 0) return false;
  const sign = dir < 0 ? -1 : 1;
  table.cloth += sign * table.tugDist;
  table.cloth = Math.max(-220, Math.min(220, table.cloth));
  table.tugLeft = false;
  layoutBowls(table, table.t, table.frozen);
  return true;
}

export function startPitch(table, placeX, angle, power) {
  table.coin = makeCoin(placeX, angle, power);
  table.tugLeft = true;
  table.frozen = false;
  return table.coin;
}

function bowlHit(table, coin) {
  let best = null, bestD = 1e9;
  for (const b of table.bowls) {
    const d = Math.hypot(coin.x - b.x, coin.y - b.y);
    if (d < bestD) { bestD = d; best = b; }
  }
  if (!best) return null;
  const inner = Math.max(8, best.r - 10);
  const outer = best.r + 11;
  if (bestD < inner) return {bowl: best, kind: 'in', d: bestD};
  if (bestD < outer) return {bowl: best, kind: 'rim', d: bestD};
  return null;
}

export function coinInBowl(table, id) {
  const c = table?.coin;
  if (!c?.settled) return false;
  if (id) return c.bowlId === id;
  const mark = markedBowl(table);
  return !!mark && c.bowlId === mark.id;
}

export function stepCoin(table, dt) {
  if (!table) return {event: 'idle'};
  table.t += dt;
  const c = table.coin;
  const lock = table.lockZ > 0 && c && c.z < table.lockZ && c.z > 0;
  if (lock && !table.frozen) {
    table.frozen = true;
    table.freezeT = table.t;
  }
  layoutBowls(table, table.t, table.frozen || lock);
  if (!c || c.settled) return {event: c?.settled ? 'settle' : 'idle', bowl: markedBowl(table) && c?.bowlId === markedBowl(table).id ? markedBowl(table) : table.bowls.find(b => b.id === c?.bowlId) || null};

  c.age += dt;
  c.x += c.vx * dt;
  c.y += c.vy * dt;
  c.vz -= 250 * dt;
  c.z += c.vz * dt;
  c.spin += dt * 10;

  if (c.z > 0) return {event: 'fly'};

  c.z = 0;
  const hit = bowlHit(table, c);
  if (hit?.kind === 'in') {
    c.settled = true;
    c.bowlId = hit.bowl.id;
    c.x = hit.bowl.x;
    c.y = hit.bowl.y;
    c.vx = 0;
    c.vy = 0;
    return {event: 'settle', bowl: hit.bowl};
  }
  if (hit?.kind === 'rim' && c.rimmed < 3) {
    c.rimmed += 1;
    const nx = (c.x - hit.bowl.x) / (hit.d || 1);
    const ny = (c.y - hit.bowl.y) / (hit.d || 1);
    const kick = 90 * (hit.bowl.bounce || 1);
    c.vx = nx * kick + (hit.bowl.tilt || 0) * 80;
    c.vy = ny * kick * 0.6 - 30;
    c.vz = 70 + (hit.bowl.raise || 0);
    c.z = 4;
    return {event: 'rim', bowl: hit.bowl};
  }
  return {event: 'miss'};
}
