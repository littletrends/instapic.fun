import {clamp} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, credit, keep} from '../wallet.js?v=games-open-2';

const R = 11;
const G = 390;
const MAX = 940;
const FLIP = 118;
const REST = 0.46;
const UP = -0.64;
const LANE = {x: 726, y: 992, pull: 50};
const GATE = seg([666, 422], [708, 422]);
const BOOK = 'pennyFever.thunderGarden';
const TOKENS = [
  {id: 'everyday-penny', weight: 52, cap: 0},
  {id: 'moon-penny', weight: 7, cap: 6},
  {id: 'rose-penny', weight: 6, cap: 5},
  {id: 'star-token', weight: 5, cap: 4},
  {id: 'crown-token', weight: 4, cap: 3},
];
const ONCE = ['lightning-pin', 'pegboard-star', 'summer-sun-pin', 'bullseye-clock', 'looking-glass-locket'];
const SETS = [
  {prize: 'lightning-pin', felt: '#1e3a32cc', wood: '#5a3a28', bumper: '#6a3a58', bat: '#e8b8c4', unique: 1.00},
  {prize: 'star-token', felt: '#24364acc', wood: '#4a3224', bumper: '#5a4a6a', bat: '#d4c4a0', unique: 0.82},
  {prize: 'pegboard-star', felt: '#2a2438cc', wood: '#3a2a22', bumper: '#7a3a4a', bat: '#e0b070', unique: 0.68},
  {prize: 'summer-sun-pin', felt: '#1c3228cc', wood: '#4a2818', bumper: '#8a5030', bat: '#f0c090', unique: 0.50},
  {prize: 'bullseye-clock', felt: '#241820cc', wood: '#3a1c18', bumper: '#6a2a38', bat: '#c89090', unique: 0.34},
  {prize: 'looking-glass-locket', felt: '#141820ee', wood: '#2a1814', bumper: '#4a2a48', bat: '#b09088', unique: 0.22},
];
const SPRITES = ['lightning-pin', 'everyday-penny', 'star-token', 'moon-penny', 'rose-penny',
  'crown-token', 'pegboard-star', 'summer-sun-pin', 'bullseye-clock', 'looking-glass-locket', 'penny-purse'];

function seg(a, b) { return {a: {x: a[0], y: a[1]}, b: {x: b[0], y: b[1]}}; }
function readStore() {
  if (typeof localStorage === 'undefined') return {v: 2, tables: {}};
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 2 && blob.tables) return blob;
    if (blob && Array.isArray(blob.seen)) return {v: 2, tables: {0: {
      seen: blob.seen, paid: blob.paid || [], score: blob.score || 0, balls: blob.balls || 0,
      wonPennies: 0, specials: 0, tokens: {},
    }}};
  } catch { /* ignore */ }
  return {v: 2, tables: {}};
}
function readTable(level) {
  const row = readStore().tables[String(level)] || {};
  return {
    seen: Array.isArray(row.seen) ? row.seen.slice() : [],
    paid: Array.isArray(row.paid) ? row.paid.slice() : [],
    score: row.score || 0, balls: row.balls || 0,
    wonPennies: row.wonPennies || 0, specials: row.specials || 0,
    tokens: row.tokens && typeof row.tokens === 'object' ? {...row.tokens} : {},
  };
}
function writeBook(s) {
  if (typeof localStorage === 'undefined' || !s) return;
  try {
    const store = readStore();
    store.tables[String(s.level || 0)] = {
      seen: s.seen, paid: s.paid, score: s.score, balls: s.balls,
      wonPennies: s.wonPennies, specials: s.specials, tokens: s.tokens,
    };
    localStorage.setItem(BOOK, JSON.stringify(store));
  } catch { /* quota */ }
}
function collide(p, a, b, r, omega = 0, pivot = a, bounce = 1.22) {
  const dx = b.x - a.x, dy = b.y - a.y, t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  const q = {x: a.x + dx * t, y: a.y + dy * t}, x = p.x - q.x, y = p.y - q.y, dd = Math.hypot(x, y);
  const skin = r + 1.6;
  if (dd >= skin) return false;
  const nx = dd ? x / dd : 0, ny = dd ? y / dd : -1;
  p.x = q.x + nx * (skin + 0.45); p.y = q.y + ny * (skin + 0.45);
  const vx = -omega * (q.y - pivot.y), vy = omega * (q.x - pivot.x);
  const vn = (p.vx - vx) * nx + (p.vy - vy) * ny;
  if (vn < 0) { p.vx -= vn * bounce * nx; p.vy -= vn * bounce * ny; }
  return true;
}
function bounceCircle(p, c, r, kick) {
  const dx = p.x - c.x, dy = p.y - c.y, dd = Math.hypot(dx, dy);
  if (dd >= r + R) return false;
  const nx = dx / (dd || 1), ny = dy / (dd || 1);
  p.x = c.x + nx * (r + R + 0.7); p.y = c.y + ny * (r + R + 0.7);
  const speed = Math.max(kick, Math.hypot(p.vx, p.vy) * 1.02);
  p.vx = nx * speed; p.vy = ny * speed;
  return true;
}
function drought(s) {
  let m = 1;
  if (s.wonPennies >= 12) m *= 0.55;
  if (s.wonPennies >= 24) m *= 0.4;
  if (s.specials >= 6) m *= 0.5;
  if (s.specials >= 10) m *= 0.35;
  return m;
}
function pickToken(s) {
  const options = TOKENS.filter(t => {
    if (t.id === 'everyday-penny') return true;
    return (s.tokens[t.id] || 0) < t.cap;
  });
  let total = 0;
  for (const t of options) total += t.weight;
  let roll = Math.random() * total;
  for (const t of options) {
    roll -= t.weight;
    if (roll <= 0) return t.id;
  }
  return 'everyday-penny';
}
function chapterPrize(s) {
  return SETS[s.level]?.prize || null;
}
function pickUnique(s) {
  const prize = chapterPrize(s);
  if (!prize) return null;
  if (ONCE.includes(prize) && (s.seen.includes(prize) || s.paid.includes(prize))) return null;
  const token = TOKENS.find(t => t.id === prize);
  if (token?.cap && (s.tokens[prize] || 0) >= token.cap) return null;
  return prize;
}
function fly(s, id, x, y, prize) {
  s.fly.push({id, x, y, t: 0, dur: 0.7, prize: !!prize});
}
function pay(s, id, x, y) {
  const token = TOKENS.find(t => t.id === id);
  if (token?.cap && (s.tokens[id] || 0) >= token.cap) id = 'everyday-penny';
  if (ONCE.includes(id) && (s.paid.includes(id) || s.seen.includes(id))) id = pickToken(s);
  else if (ONCE.includes(id)) { s.seen.push(id); s.paid.push(id); }
  const unique = ONCE.includes(id);
  const special = id !== 'everyday-penny';
  if (id === 'everyday-penny') {
    s.score += 50;
    s.wonPennies++;
    if (alleyPlay) credit(1);
    s.note = 'A penny back into the purse.';
  } else {
    s.score += unique ? 2500 : 400;
    s.specials++;
    s.tokens[id] = (s.tokens[id] || 0) + 1;
    if (alleyPlay) keep(id, 'pinball');
    s.note = itemName(id) + (unique ? ' — a rare from the glass!' : ' into the treasure book.');
  }
  fly(s, id, x, y, special);
  writeBook(s);
}
function dropFromHit(s, kind, x, y) {
  const rng = Math.random();
  const d = drought(s);
  const u = (SETS[s.level]?.unique || 1) * d;
  const jackpot = s.lights.every(Boolean);
  if (kind === 'bumper') {
    s.score += 120;
    if (rng < 0.08 * d) pay(s, 'everyday-penny', x, y);
    else if (rng < 0.08 * d + 0.022 * d) pay(s, pickToken(s), x, y);
    else if (rng < 0.08 * d + 0.022 * d + 0.002 * u) { const id = pickUnique(s); if (id) pay(s, id, x, y); }
  } else if (kind === 'sling') {
    s.score += 40;
    if (rng < 0.04 * d) pay(s, 'everyday-penny', x, y);
  } else if (kind === 'target' || kind === 'roll') {
    s.score += kind === 'target' ? 250 : 80;
    if (rng < 0.22 * d) pay(s, 'everyday-penny', x, y);
    else if (rng < 0.32 * d) pay(s, pickToken(s), x, y);
    else if (rng < 0.32 * d + 0.012 * u) { const id = pickUnique(s); if (id) pay(s, id, x, y); }
  } else if (kind === 'saucer') {
    s.score += jackpot ? 1400 : 800;
    if (jackpot && rng < 0.18 * u) {
      const prize = pickUnique(s) || pickToken(s);
      pay(s, prize, x, y);
    } else if (rng < 0.48 * d) pay(s, 'everyday-penny', x, y);
    else if (rng < 0.78 * d) pay(s, pickToken(s), x, y);
    else if (rng < 0.78 * d + 0.07 * u) { const id = pickUnique(s); if (id) pay(s, id, x, y); }
    if (jackpot) s.lights = [false, false, false];
  }
}
function layout(level) {
  const pinch = Math.min(14, level * 2);
  const rails = [
    seg([210, 200], [210, 750]),
    seg([210, 750], [228, 1148]),
    seg([276 - pinch, 848], [276 - pinch, 1148]),
    seg([276 - pinch, 848], [300, 1002]),
    seg([210, 200], [640, 200]),
    seg([640, 200], [720, 188]),
    seg([720, 188], [758, 228]),
    seg([758, 228], [758, 1090]),
    seg([696, 1090], [758, 1090]),
    seg([696, 410], [696, 1090]),
    seg([696, 410], [668, 458]),
    seg([668, 458], [668, 750]),
    seg([668, 750], [650, 1148]),
    seg([618 + pinch, 848], [618 + pinch, 1148]),
    seg([618 + pinch, 848], [568, 1002]),
  ];
  const slings = [
    {kick: {x: 120, y: -310}, cool: 0, segs: [seg([328, 742], [362, 868]), seg([328, 742], [328, 868])]},
    {kick: {x: -120, y: -310}, cool: 0, segs: [seg([540, 742], [506, 868]), seg([540, 742], [540, 868])]},
  ];
  const bumpers = [
    {x: 338, y: 372, r: 34, cool: 0, flash: 0},
    {x: 542, y: 372, r: 34, cool: 0, flash: 0},
    {x: 440, y: 518, r: 36, cool: 0, flash: 0},
  ];
  if (level >= 1) bumpers.push({x: 440, y: 300, r: 22, cool: 0, flash: 0});
  if (level >= 3) bumpers.push({x: 330, y: 620, r: 24, cool: 0, flash: 0}, {x: 550, y: 620, r: 24, cool: 0, flash: 0});
  if (level >= 4) bumpers.push({x: 440, y: 680, r: 20, cool: 0, flash: 0});
  const posts = [
    {x: 440, y: 888, r: 9, kick: 220},
    {x: 318, y: 700, r: 8, kick: 180},
    {x: 562, y: 700, r: 8, kick: 180},
  ];
  if (level >= 2) posts.push({x: 440, y: 760, r: 7, kick: 160});
  const targets = [
    {x: 236, y: 448, on: false, cool: 0},
    {x: 236, y: 518, on: false, cool: 0},
    {x: 236, y: 588, on: false, cool: 0},
  ];
  const rolls = [
    {x: 320, y: 248, on: false},
    {x: 440, y: 248, on: false},
    {x: 560, y: 248, on: false},
  ];
  return {
    rails, slings, bumpers, posts, targets, rolls,
    saucer: {x: 440, y: 268, cool: 0, hold: 0},
    flippers: [
      {x: 292, y: 1008, a: REST, w: 0, sign: 1},
      {x: 576, y: 1008, a: Math.PI - REST, w: 0, sign: -1},
    ],
    outL: 276 - pinch, outR: 618 + pinch,
  };
}
function seatLane(s) {
  s.mode = 'lane';
  s.charge = 0;
  s.charging = false;
  s.stuck = 0;
  s.stuckPos = {x: LANE.x, y: LANE.y, t: s.t || 0};
  s.ball = {x: LANE.x, y: LANE.y, vx: 0, vy: 0};
  s.trail = [];
}
function canAfford(s) {
  if (!alleyPlay) return s.ammo > 0;
  return (pocket() || 0) >= 1;
}
function beginCharge(s) {
  if (s.mode !== 'lane' || s.charging) return;
  if (!canAfford(s)) {
    s.note = alleyPlay
      ? 'Need a penny to pull the spring. Cash a booth ticket for a five-penny stack.'
      : 'Practice balls are spent.';
    return;
  }
  s.charging = true;
  s.charge = 0.02;
}
function releasePlunger(s) {
  if (s.mode !== 'lane' || !s.charging) { s.charging = false; return; }
  const power = s.charge;
  s.charging = false;
  s.charge = 0;
  if (power < 0.1) {
    s.ball.y = LANE.y;
    s.note = 'A timid pull. Draw the spring further back.';
    return;
  }
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny to launch. Cash a booth ticket for a five-penny stack.';
      s.ball.y = LANE.y;
      return;
    }
  } else s.ammo--;
  s.mode = 'live';
  s.balls++;
  s.ball.vx = -18 - power * 28;
  s.ball.vy = -460 - power * 760;
  s.note = power > 0.72 ? 'A strong plunge.' : 'The silver ball is in play.';
  writeBook(s);
}
function drain(s) {
  s.mode = 'dead';
  s.deadAt = s.t;
  s.charging = false;
  s.charge = 0;
  s.combo = 0;
  s.stuck = 0;
  s.note = alleyPlay
    ? 'Drained. Another penny for another ball — the table always has the last word.'
    : (s.ammo > 0 ? 'Drained. Pull the spring for another practice ball.' : 'Practice balls spent.');
}
function inShooter(p) { return p.x > 690; }
function shouldDrain(s, p) {
  if (inShooter(p)) return false;
  if (p.y > 1138) return true;
  if (p.y > 1028 && p.x < s.outL) return true;
  if (p.y > 1028 && p.x > s.outR && p.x < 690) return true;
  if (p.y > 1108 && p.x > 310 && p.x < 558) return true;
  return false;
}

export default {
  title: 'Thunder Garden',
  live: alleyPlay,
  tables: true,
  intro: alleyPlay
    ? 'Six old-school pin tables. A penny from the purse pulls the spring. Tap the flippers to keep the silver ball alive. Bumpers rain small wins; stars and hearts cap out; the table’s own prize almost never leaves the glass. The house smiles, then takes the ball.'
    : 'Workshop pin tables. Pull the plunger, tap the flippers, chase the lights. Practice balls never enter the alley purse.',
  instructions: alleyPlay
    ? 'Hold Plunge (or drag the spring) and release to shoot. Tap Left and Right — or the two sides of the glass — for the flippers. Z and X work on a keyboard. Each ball costs a penny. Hits often score, sometimes drip a penny or a star, and almost never a unique. Drain, and the house waits for another penny. Cash a booth ticket for a five-penny stack.'
    : 'Hold Plunge and release. Tap Left and Right flippers. Z, X and Space work on a keyboard. Each chapter is a different cabinet.',
  liveTitle: 'Thunder Garden',
  liveDetail: alleyPlay
    ? 'Hold the plunger, let go, then tap the flippers. A penny a ball. Small wins feel generous. The rare things stay rare.'
    : 'Pull the spring and tap the flippers.',
  liveButton: 'Step up to the table',
  tableDetail: alleyPlay
    ? 'A penny a ball. Hold the plunger, let go, then tap the flippers. Small wins drip back; stars and hearts cap out; this cabinet’s prize almost never leaves the glass.'
    : 'A different cabinet. Pull the spring, tap the bats. Practice balls stay in the workshop.',
  levels: ['First ball', 'A hungrier drain', 'Lights in a hurry', 'The tight outlanes', 'Storm on the glass', 'The house never blinks'],
  sprites: SPRITES,
  prizes: SETS.map(t => t.prize),
  actions: [
    {id: 'left', label: 'Left flipper · Z', hold: true},
    {id: 'plunge', label: alleyPlay ? 'Plunge · 1 penny' : 'Plunge', hold: true},
    {id: 'right', label: 'Right flipper · X', hold: true},
  ],
  persist(s) { writeBook(s); },
  create(level) {
    const book = readTable(level);
    const set = SETS[level] || SETS[0];
    const built = layout(level);
    const s = {
      level, t: 0, mode: 'lane', charge: 0, charging: false, pointerPlunge: false,
      left: false, right: false, combo: 0, lights: [false, false, false],
      balls: book.balls, score: book.score, wonPennies: book.wonPennies, specials: book.specials,
      seen: book.seen, paid: book.paid, tokens: book.tokens, fly: [], trail: [], stuck: 0,
      ammo: alleyPlay ? 0 : Math.max(4, 9 - level),
      note: alleyPlay ? 'A penny pulls the spring.' : 'Pull the spring.',
      set, ...built,
    };
    seatLane(s);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    const hunger = 1 + s.level * 0.055;
    for (const b of s.bumpers) { b.cool = Math.max(0, b.cool - dt); b.flash = Math.max(0, b.flash - dt); }
    for (const t of s.targets) t.cool = Math.max(0, t.cool - dt);
    for (const sl of s.slings) sl.cool = Math.max(0, sl.cool - dt);
    s.saucer.cool = Math.max(0, s.saucer.cool - dt);
    const wantL = s.left || input.actions.has('left') || input.keys.has('z') || input.keys.has('Z') || input.keys.has('ArrowLeft');
    const wantR = s.right || input.actions.has('right') || input.keys.has('x') || input.keys.has('X') || input.keys.has('ArrowRight');
    const holdPlunge = s.pointerPlunge || input.actions.has('plunge') || input.keys.has(' ');
    if (s.mode === 'lane') {
      if (holdPlunge) beginCharge(s);
      if (s.charging) {
        if (holdPlunge && !s.pointerPlunge) s.charge = clamp(s.charge + dt * 1.28, 0, 1);
        s.ball.x = LANE.x;
        s.ball.y = LANE.y + s.charge * LANE.pull;
      }
      if (s.charging && !holdPlunge) releasePlunger(s);
    } else if (s.mode === 'dead') {
      if (s.t - s.deadAt > 0.8) seatLane(s);
    }
    const steps = 6;
    for (let n = 0; n < steps; n++) {
      const h = dt / steps;
      s.flippers.forEach((f, i) => {
        const rest = i ? Math.PI - REST : REST;
        const up = i ? Math.PI - UP : UP;
        const target = (i ? wantR : wantL) ? up : rest;
        const change = clamp(target - f.a, -18 * h, 18 * h);
        f.w = change / h;
        f.a += change;
      });
      if (s.mode !== 'live') continue;
      const p = s.ball;
      p.vy += G * hunger * h;
      p.vx *= Math.exp(-0.016 * h);
      p.x += p.vx * h; p.y += p.vy * h;
      if (inShooter(p) && p.y < 280 && p.vy < 0) p.vx = Math.min(p.vx, -280 - Math.abs(p.vy) * 0.12);
      for (const r of s.rails) collide(p, r.a, r.b, R, 0, r.a, 1.2);
      if (!(inShooter(p) && p.vy < -24)) collide(p, GATE.a, GATE.b, R, 0, GATE.a, 1.18);
      for (const f of s.flippers) {
        const tip = {x: f.x + Math.cos(f.a) * FLIP, y: f.y + Math.sin(f.a) * FLIP};
        const slap = Math.abs(f.w) > 2 ? 1.96 : 1.26;
        collide(p, f, tip, 13, f.w, f, slap);
      }
      for (const b of s.bumpers) {
        if (bounceCircle(p, b, b.r, 430 + s.combo * 8)) {
          if (b.cool === 0) {
            b.cool = 0.12; b.flash = 0.2; s.combo++;
            dropFromHit(s, 'bumper', b.x, b.y);
            if (s.combo === 3) s.lights[0] = true;
            if (s.combo === 6) s.lights[1] = true;
            if (s.combo === 9) s.lights[2] = true;
          }
        }
      }
      for (const post of s.posts) bounceCircle(p, post, post.r, post.kick);
      for (const sl of s.slings) {
        for (const r of sl.segs) {
          if (collide(p, r.a, r.b, R, 0, r.a, 1.5)) {
            if (sl.cool === 0) {
              sl.cool = 0.16;
              p.vx += sl.kick.x; p.vy += sl.kick.y;
              dropFromHit(s, 'sling', p.x, p.y);
            }
          }
        }
      }
      for (const t of s.targets) {
        if (t.cool > 0) continue;
        if (Math.hypot(p.x - t.x, p.y - t.y) < 22) {
          t.on = true; t.cool = 0.45;
          p.vx = Math.abs(p.vx) * 0.7 + 90;
          dropFromHit(s, 'target', t.x, t.y);
          if (s.targets.every(x => x.on)) {
            s.lights = [true, true, true];
            s.targets.forEach(x => { x.on = false; });
            s.note = 'The saucer is hungry.';
          }
        }
      }
      for (const r of s.rolls) {
        if (!r.on && p.vy > 40 && Math.abs(p.x - r.x) < 22 && p.y > r.y - 16 && p.y < r.y + 18) {
          r.on = true;
          dropFromHit(s, 'roll', r.x, r.y);
          s.lights[s.rolls.indexOf(r)] = true;
        }
      }
      if (s.saucer.cool === 0 && Math.hypot(p.x - s.saucer.x, p.y - s.saucer.y) < 24) {
        s.saucer.cool = 1.25;
        s.saucer.hold = 0.38;
        p.vx *= 0.08; p.vy *= 0.08;
        p.x = s.saucer.x; p.y = s.saucer.y;
        dropFromHit(s, 'saucer', s.saucer.x, s.saucer.y);
        s.combo = 0;
        s.rolls.forEach(r => { r.on = false; });
      }
      if (s.saucer.hold > 0) {
        s.saucer.hold -= h;
        if (s.saucer.hold <= 0) { p.vx = (Math.random() - 0.5) * 240; p.vy = 380; }
      }
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > MAX) { p.vx *= MAX / speed; p.vy *= MAX / speed; }
      if (shouldDrain(s, p)) drain(s);
    }
    if (s.mode === 'live' && inShooter(s.ball) && s.ball.y > 1010 && s.ball.vy > -10) {
      s.mode = 'lane';
      s.charge = 0;
      s.charging = false;
      s.ball = {x: LANE.x, y: LANE.y, vx: 0, vy: 0};
      s.trail = [];
      s.note = 'Back down the lane. Same ball — pull the spring again.';
    }
    if (s.mode === 'live') {
      s.trail.push({x: s.ball.x, y: s.ball.y});
      if (s.trail.length > 14) s.trail.shift();
      const pos = s.stuckPos || {x: s.ball.x, y: s.ball.y, t: s.t};
      if (Math.hypot(s.ball.x - pos.x, s.ball.y - pos.y) > 18) s.stuckPos = {x: s.ball.x, y: s.ball.y, t: s.t};
      else if (s.t - pos.t > 1.35 && !inShooter(s.ball)) {
        if (s.ball.y > 980) drain(s);
        else {
          s.ball.vx += (440 - s.ball.x) * 0.9;
          s.ball.vy = -300;
          s.stuckPos = {x: s.ball.x, y: s.ball.y, t: s.t};
        }
      }
    }
    for (const f of s.fly) f.t += dt;
    s.fly = s.fly.filter(f => f.t < f.dur);
  },
  pointer(s, type, p) {
    if (type === 'down') {
      if (s.mode === 'lane' && p.x > 640) {
        s.pointerPlunge = true;
        beginCharge(s);
        s.charge = clamp((p.y - LANE.y) / LANE.pull, 0.05, 1);
      } else if (p.x < 450) s.left = true;
      else s.right = true;
    }
    if (type === 'move' && s.pointerPlunge && s.mode === 'lane') {
      s.charge = clamp((p.y - LANE.y) / LANE.pull, 0.05, 1);
    }
    if (type === 'up' || type === 'cancel') {
      if (s.pointerPlunge) { s.pointerPlunge = false; releasePlunger(s); }
      s.left = false; s.right = false;
    }
  },
  action(s, id, down) {
    if (id === 'left') s.left = !!down;
    if (id === 'right') s.right = !!down;
    if (id === 'plunge') {
      if (down) beginCharge(s);
      else releasePlunger(s);
    }
  },
  key(s, k, down) {
    if ((k === 'z' || k === 'Z' || k === 'ArrowLeft') && !down) s.left = false;
    if ((k === 'x' || k === 'X' || k === 'ArrowRight') && !down) s.right = false;
    if (k === ' ') {
      if (down) beginCharge(s);
      else releasePlunger(s);
    }
  },
  draw(s, d, _t, input) {
    const set = s.set || SETS[s.level] || SETS[0];
    const leftOn = s.left || input?.keys?.has('z') || input?.keys?.has('Z') || input?.keys?.has('ArrowLeft') || input?.actions?.has('left');
    const rightOn = s.right || input?.keys?.has('x') || input?.keys?.has('X') || input?.keys?.has('ArrowRight') || input?.actions?.has('right');
    d.poly([[64, 18], [836, 18], [858, 1184], [42, 1184]], set.wood, '#e6c57a', 4);
    d.poly([[96, 30], [804, 30], [804, 172], [96, 172]], '#161022f2', '#e6c57a', 2);
    d.text('PIP’S', 450, 58, 14, '#e8c878');
    d.text('THUNDER GARDEN', 450, 92, 28, '#fff3d0');
    d.text(String(s.score).padStart(6, '0'), 450, 128, 26, '#f0d49a');
    for (let i = 0; i < 3; i++) d.circle(390 + i * 50, 152, 8, s.lights[i] ? '#f0c060' : '#2a2428', '#e8d4a0', 1);
    d.poly([[118, 186], [782, 186], [798, 1116], [102, 1116]], set.felt, '#d7b56a', 3);
    for (const r of s.rails) {
      d.line(r.a, r.b, '#4a3a28', 14);
      d.line(r.a, r.b, '#e6c57a', 3);
    }
    d.line(GATE.a, GATE.b, '#c4a46a', 6);
    for (const sl of s.slings) for (const r of sl.segs) d.line(r.a, r.b, sl.cool > 0 ? '#f0d080' : '#c9a56a', 9);
    for (const post of s.posts) d.circle(post.x, post.y, post.r, '#8a6a48', '#f0d6a0', 2);
    for (const b of s.bumpers) {
      if (b.flash > 0) d.glow(b.x, b.y, 68, '#f0d49a');
      d.circle(b.x, b.y, b.r + 3, set.bumper, '#f0d6a0', 3);
      d.circle(b.x, b.y, Math.max(8, b.r - 10), b.flash > 0 ? '#f0d080' : '#3a2438', '#ead6a4', 2);
      d.item(spriteKey('star-token'), b.x, b.y, {
        w: b.flash > 0 ? 40 : 30, alpha: 0.95,
        fallback: () => d.star(b.x, b.y, 12, '#f4e2a8'),
      });
    }
    for (const t of s.targets) {
      d.poly([[t.x - 10, t.y - 16], [t.x + 12, t.y - 8], [t.x + 12, t.y + 8], [t.x - 10, t.y + 16]], t.on ? '#c45a6a' : '#8a6a48', '#ead6a4', 2);
    }
    for (const r of s.rolls) {
      d.ellipse(r.x, r.y, 16, 8, r.on ? '#f0d08055' : '#00000033', r.on ? '#f0d080' : '#c4a46a', 2);
    }
    d.circle(s.saucer.x, s.saucer.y, 20, '#3a2a38cc', s.lights.every(Boolean) ? '#f0d080' : '#b89668', 3);
    d.path(s.trail, '#f0d6a844', 4);
    for (const f of s.flippers) {
      const c = Math.cos(f.a), sn = Math.sin(f.a);
      const pts = [[-8, -15], [FLIP - 10, -7], [FLIP + 2, 0], [FLIP - 10, 7], [-8, 15]]
        .map(([x, y]) => [f.x + x * c - y * sn, f.y + x * sn + y * c]);
      d.poly(pts, set.bat, '#f8e6b8', 2);
      d.circle(f.x, f.y, 13, '#d4b07a', '#f8e6b8', 2);
    }
    const springY = LANE.y + (s.mode === 'lane' ? s.charge * LANE.pull : 0);
    d.poly([[696, 1090], [758, 1090], [758, 1148], [696, 1148]], '#3a2a22cc', '#d2b07a', 2);
    d.line({x: LANE.x, y: springY + 16}, {x: LANE.x, y: 1086}, '#c5d0d6', 5);
    const coils = 7;
    for (let i = 0; i < coils; i++) {
      const cy = springY + 22 + i * ((1084 - springY - 22) / coils);
      d.line({x: LANE.x - 9, y: cy}, {x: LANE.x + 9, y: cy}, '#d2b07a', 2);
    }
    d.circle(LANE.x, springY + 28, 15, '#8a3030', '#f0d0a8', 2);
    d.item(spriteKey('lightning-pin'), s.ball.x, s.ball.y, {
      w: 32, angle: Math.atan2(s.ball.vy, s.ball.vx) + Math.PI / 2,
      fallback: () => d.ball(s.ball.x, s.ball.y, R, '#c5d0d6'),
    });
    d.poly([[118, 1120], [782, 1120], [798, 1172], [102, 1172]], '#2a1c16ee', '#e6c57a', 2);
    d.circle(210, 1146, 16, leftOn ? '#f0d080' : '#6a3a48', '#ead6a4', 2);
    d.circle(690, 1146, 16, rightOn ? '#f0d080' : '#6a3a48', '#ead6a4', 2);
    d.text('Z', 210, 1152, 12, '#fff6d8');
    d.text('X', 690, 1152, 12, '#fff6d8');
    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    d.item(spriteKey('penny-purse'), 86, 64, {w: 72, fallback: () => d.heart(86, 64, 22, '#6a7a52')});
    d.text(String(n), 86, 108, 18, '#fff6d8');
    d.poly([[760, 44], [828, 48], [824, 108], [756, 104]], '#6b3a3a', '#e8d4a0', 2);
    d.item(spriteKey(set.prize), 792, 76, {w: 36, fallback: () => d.star(792, 76, 12, '#f4e2a8')});
    for (const f of s.fly) {
      const u = Math.min(1, f.t / f.dur), e = 1 - (1 - u) * (1 - u);
      const destX = f.prize ? 792 : 86, destY = f.prize ? 76 : 64;
      d.item(spriteKey(f.id), f.x + (destX - f.x) * e, f.y + (destY - f.y) * e, {
        w: 28 * (1 - u * 0.35),
        fallback: () => d.ball(f.x + (destX - f.x) * e, f.y + (destY - f.y) * e, 9, '#d2b07a'),
      });
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : s.ammo;
    const purse = (n == null ? '0' : n) + (alleyPlay ? (n === 1 ? ' penny' : ' pennies') : ' practice');
    const mode = s.mode === 'live' ? 'ball in play' : s.mode === 'lane' ? (s.charging ? 'spring drawn' : 'pull the spring') : 'drained';
    return purse + ' · ' + s.score + ' · ' + s.wonPennies + ' won back · ' + s.specials + ' specials · ' + mode + ' · ' + s.note;
  },
};

