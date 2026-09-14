/** Isolated Marble Mill: peg field, side flippers, hanging unique, 1–100. No numbered bowls. */

export const PEGGY_CHAPTERS = [
  {id: 'first', title: 'First Drop', rows: 5, cols: 5, gap: 92, pegR: 13, g: 168, flip: 86, dense: false, split: false, shift: false, storm: false, roam: false, prize: 'mill-marble'},
  {id: 'longer', title: 'The Longer Bounce', rows: 7, cols: 5, gap: 86, pegR: 12, g: 188, flip: 78, dense: false, split: false, shift: false, storm: false, roam: false, prize: 'gate-token'},
  {id: 'split', title: 'Split Current', rows: 7, cols: 6, gap: 78, pegR: 11, g: 204, flip: 72, dense: false, split: true, shift: false, storm: false, roam: false, prize: 'heart-gear'},
  {id: 'crooked', title: 'Crooked Mill', rows: 8, cols: 6, gap: 74, pegR: 11, g: 220, flip: 66, dense: false, split: true, shift: true, storm: false, roam: false, prize: 'ticket-punch'},
  {id: 'storm', title: 'Marble Storm', rows: 9, cols: 7, gap: 66, pegR: 10, g: 248, flip: 54, dense: true, split: true, shift: true, storm: true, roam: false, prize: 'stamp-and-inkpad'},
  {id: 'pegstorm', title: 'Pegstorm', rows: 10, cols: 7, gap: 62, pegR: 9, g: 268, flip: 48, dense: true, split: true, shift: true, storm: true, roam: true, prize: 'marble-tin'},
];

export const DRAIN_Y = 1090;
export const RAIL_Y = 236;
export const WALLS = {l: 168, r: 732};

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const PEGGY_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isPeggyWin(level, n) {
  return (PEGGY_WINS[level] || PEGGY_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 31 + 9);
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

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function bounceCircle(p, c, r, kick = 180) {
  const dx = p.x - c.x, dy = p.y - c.y, dd = Math.hypot(dx, dy);
  const need = r + (p.r || 11);
  if (dd >= need || dd === 0) return false;
  const nx = dx / dd, ny = dy / dd;
  p.x = c.x + nx * (need + 0.6);
  p.y = c.y + ny * (need + 0.6);
  const speed = Math.max(kick, Math.hypot(p.vx, p.vy) * 1.02);
  p.vx = nx * speed;
  p.vy = ny * speed;
  if (Math.abs(p.vx) < 10) p.vx += nx >= 0 ? 12 : -12;
  return true;
}

function collideSeg(p, a, b, r, omega, pivot, bounce) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  const q = {x: a.x + dx * t, y: a.y + dy * t};
  const x = p.x - q.x, y = p.y - q.y, dd = Math.hypot(x, y);
  const skin = r + (p.r || 11);
  if (dd >= skin) return false;
  const nx = dd ? x / dd : 0, ny = dd ? y / dd : -1;
  p.x = q.x + nx * (skin + 0.4);
  p.y = q.y + ny * (skin + 0.4);
  const vx = -omega * (q.y - pivot.y), vy = omega * (q.x - pivot.x);
  const vn = (p.vx - vx) * nx + (p.vy - vy) * ny;
  if (vn < 0) { p.vx -= vn * bounce * nx; p.vy -= vn * bounce * ny; }
  return true;
}

export function flipperTips(f) {
  const c = Math.cos(f.a), s = Math.sin(f.a);
  return {
    a: {x: f.x, y: f.y},
    b: {x: f.x + c * f.len, y: f.y + s * f.len},
  };
}

function uniqueHome(ch, roll, n) {
  const top = 340;
  const depth = 120 + ch.rows * 18;
  const spots = [
    {x: 450, y: top + depth * 0.35},
    {x: 310, y: top + depth * 0.45},
    {x: 590, y: top + depth * 0.45},
    {x: 380, y: top + depth * 0.62},
    {x: 520, y: top + depth * 0.62},
  ];
  if (ch.roam) return spots.map(s => ({...s}));
  return [spots[Math.floor(roll() * spots.length) % spots.length]];
}

export function makeMill(level, seed) {
  const ch = PEGGY_CHAPTERS[level] || PEGGY_CHAPTERS[0];
  const roll = rng(seed);
  const n = resultNumber(seed);
  const win = isPeggyWin(level, n);
  const pegs = [];
  const left = 210, top = 300;
  const gapY = ch.dense ? 52 : 62;
  for (let r = 0; r < ch.rows; r++) {
    const cols = ch.cols - (r % 2 ? 0 : 0);
    const ox = r % 2 ? ch.gap * 0.48 : 0;
    for (let c = 0; c < cols; c++) {
      if (ch.split && r % 3 === 2 && c === Math.floor(ch.cols / 2)) continue;
      const x = left + ox + c * ch.gap;
      const y = top + r * gapY;
      if (x < WALLS.l + 24 || x > WALLS.r - 24) continue;
      pegs.push({
        x, y, homeX: x, homeY: y, r: ch.pegR,
        shift: ch.shift && (r + c) % 4 === 0,
        bumper: ch.split && c === 0 && r % 2 === 1,
        flash: 0,
      });
    }
  }
  const homes = uniqueHome(ch, roll, n);
  const unique = {
    x: homes[0].x, y: homes[0].y, r: 22 + (5 - Math.min(5, level)),
    homes, homeI: 0, locked: !ch.roam, prize: win,
    hit: false, flash: 0,
  };
  const flipLen = ch.flip;
  const mill = {
    level, seed, ch, pegs, unique,
    bowls: null, drain: true, drainY: DRAIN_Y,
    walls: {...WALLS},
    flippers: [
      {side: 'left', x: WALLS.l + 18, y: 820, a: -0.55, rest: -0.55, up: -1.35, w: 0, cool: 0, len: flipLen, fired: false},
      {side: 'right', x: WALLS.r - 18, y: 820, a: Math.PI + 0.55, rest: Math.PI + 0.55, up: Math.PI + 1.35, w: 0, cool: 0, len: flipLen, fired: false},
    ],
    marble: null, uniqueHit: false, drained: false,
    resultN: n, t: 0, g: ch.g,
  };
  mill.pegs = mill.pegs.filter(p => Math.hypot(p.x - unique.x, p.y - unique.y) > unique.r + p.r + 10);
  return mill;
}

export function dropMarble(mill, x, power = 0.55) {
  const px = clamp(x, mill.walls.l + 16, mill.walls.r - 16);
  mill.marble = {x: px, y: RAIL_Y + 28, vx: (power - 0.5) * 40, vy: 42 + power * 70, r: 11, live: true, trail: []};
  mill.drained = false;
  mill.uniqueHit = !!mill.uniqueHit;
  if (mill.unique && mill.ch.roam) mill.unique.locked = true;
  return mill.marble;
}

export function fireFlipper(mill, side) {
  const f = mill.flippers.find(x => x.side === side);
  if (!f || f.cool > 0) return false;
  f.fired = true;
  f.cool = 0.22;
  return true;
}

export function stepMill(mill, dt, input = {}, reduced = false) {
  if (!mill) return mill;
  const slow = reduced ? 0.5 : 1;
  mill.t += dt * slow;
  const wantL = !!(input.left || input.flipL);
  const wantR = !!(input.right || input.flipR);
  if (wantL) fireFlipper(mill, 'left');
  if (wantR) fireFlipper(mill, 'right');
  for (const f of mill.flippers) {
    f.cool = Math.max(0, f.cool - dt);
    const target = f.fired ? f.up : f.rest;
    const prev = f.a;
    const change = clamp(target - f.a, -16 * dt, 16 * dt);
    f.a += change;
    f.w = (f.a - prev) / (dt || 1 / 60);
    if (f.fired && Math.abs(f.a - f.up) < 0.04) f.fired = false;
  }
  for (const peg of mill.pegs) {
    peg.flash = Math.max(0, peg.flash - dt);
    if (peg.shift) peg.x = peg.homeX + Math.sin(mill.t * 0.8 + peg.homeY * 0.01) * 16;
    if (peg.bumper) peg.x = peg.homeX + Math.sin(mill.t * 1.1) * 10;
  }
  if (mill.unique && !mill.unique.locked && mill.unique.homes && mill.unique.homes.length > 1 && !mill.marble) {
    if (Math.floor(mill.t * 0.7) !== Math.floor((mill.t - dt) * 0.7)) {
      mill.unique.homeI = (mill.unique.homeI + 1) % mill.unique.homes.length;
    }
    const h = mill.unique.homes[mill.unique.homeI];
    mill.unique.x += (h.x - mill.unique.x) * Math.min(1, dt * 4);
    mill.unique.y += (h.y - mill.unique.y) * Math.min(1, dt * 4);
  }
  if (mill.unique) mill.unique.flash = Math.max(0, (mill.unique.flash || 0) - dt);
  const p = mill.marble;
  if (!p || !p.live) return mill;
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const h = dt * slow / steps;
    p.vy += mill.g * h;
    p.vx *= Math.exp(-0.12 * h);
    p.x += p.vx * h;
    p.y += p.vy * h;
    if (p.x < mill.walls.l + p.r) { p.x = mill.walls.l + p.r; p.vx = Math.abs(p.vx) * 0.7; }
    if (p.x > mill.walls.r - p.r) { p.x = mill.walls.r - p.r; p.vx = -Math.abs(p.vx) * 0.7; }
    for (const peg of mill.pegs) {
      if (bounceCircle(p, peg, peg.r, 200)) peg.flash = 0.12;
    }
    for (const f of mill.flippers) {
      const seg = flipperTips(f);
      const slap = Math.abs(f.w) > 2 ? 1.9 : 1.25;
      if (collideSeg(p, seg.a, seg.b, 8, f.w, {x: f.x, y: f.y}, slap) && Math.abs(f.w) > 2) p.vy -= 240;
    }
    if (mill.unique && !mill.unique.hit && bounceCircle(p, mill.unique, mill.unique.r, 320)) {
      mill.unique.hit = true;
      mill.unique.flash = 0.5;
      mill.uniqueHit = !!mill.unique.prize;
    }
    const spd = Math.hypot(p.vx, p.vy);
    if (spd > 720) { p.vx *= 720 / spd; p.vy *= 720 / spd; }
    if (p.y > mill.drainY) {
      p.live = false;
      mill.drained = true;
      mill.marble = p;
      return mill;
    }
  }
  p.trail = p.trail || [];
  p.trail.push({x: p.x, y: p.y});
  if (p.trail.length > 16) p.trail.shift();
  return mill;
}

export function millOver(mill) {
  return !!(mill && mill.drained);
}
