/** Isolated Moonbow Skee-Ball: lanes, rings, 1–100. */

export const SKIP_CHAPTERS = [
  {id: 'twilight', title: 'Twilight Roll', prize: 'silver-cup-chip', balls: 5, lip: 828, g: 470, wax: false, banks: false, shutter: false, wander: false, rMark: 72, rOther: 48},
  {id: 'rising', title: 'Rising Moon', prize: 'lane-wax', balls: 5, lip: 790, g: 520, wax: false, banks: false, shutter: false, wander: false, rMark: 50, rOther: 42},
  {id: 'crooked', title: 'Crooked Constellation', prize: 'pegboard-star', balls: 5, lip: 800, g: 500, wax: false, banks: true, shutter: false, wander: false, rMark: 46, rOther: 38},
  {id: 'wax', title: 'Wax Lane', prize: 'moonbow-stub', balls: 5, lip: 808, g: 490, wax: true, banks: false, shutter: false, wander: false, rMark: 44, rOther: 36},
  {id: 'eclipse', title: 'Eclipse Gates', prize: 'score-card', balls: 5, lip: 800, g: 510, wax: false, banks: false, shutter: true, wander: false, rMark: 42, rOther: 34},
  {id: 'moonbow', title: 'Full Moonbow', prize: 'summer-sun-pin', balls: 5, lip: 786, g: 530, wax: true, banks: true, shutter: true, wander: true, rMark: 36, rOther: 30},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const SKIP_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isSkipWin(level, n) {
  return (SKIP_WINS[level] || SKIP_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 29 + 11);
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

export function markedHole(lane) {
  return (lane?.holes || []).find(h => h.marked) || null;
}

export function shutterOpen(lane, hole, t) {
  if (!hole?.shutter) return true;
  const clock = lane.freezeT == null ? t : lane.freezeT;
  const phase = ((clock * hole.shutterSpeed) + hole.shutterPhase) % 1;
  return phase < hole.shutterOpen;
}

export function waxMul(lane, x, y) {
  if (!lane?.wax?.length) return 1;
  for (const p of lane.wax) {
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return p.mul;
  }
  return 1;
}

function bounceSegment(ball, a, b, rest = 0.68) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((ball.x - a.x) * dx + (ball.y - a.y) * dy) / len2));
  const qx = a.x + dx * t, qy = a.y + dy * t;
  const nx0 = ball.x - qx, ny0 = ball.y - qy;
  const dd = Math.hypot(nx0, ny0);
  const skin = 16;
  if (dd >= skin || dd < 0.001) return false;
  const nx = nx0 / dd, ny = ny0 / dd;
  ball.x = qx + nx * (skin + 0.4);
  ball.y = qy + ny * (skin + 0.4);
  const vn = ball.vx * nx + ball.vy * ny;
  if (vn < 0) {
    ball.vx -= vn * (1 + rest) * nx;
    ball.vy -= vn * (1 + rest) * ny;
  }
  return true;
}

export function inHole(ball, hole) {
  if (!ball || !hole) return false;
  const pad = Math.max(8, hole.r - 5);
  return Math.hypot(ball.x - hole.x, ball.y - hole.y) < pad;
}

export function makeBall(placeX, angle, power) {
  const a = Number(angle) || 0;
  const p = Number(power) || 390;
  const x = Number(placeX) || 450;
  return {
    x, y: 1040, z: 0,
    vx: Math.sin(a) * p,
    vy: -Math.cos(a) * p,
    vz: 0, air: false, age: 0, sunk: false, trail: [],
  };
}

function hole(id, x, y, r, score, extra = {}) {
  return {id, x, y, r, score, name: extra.name || id, marked: !!extra.marked, shutter: !!extra.shutter, shutterSpeed: extra.shutterSpeed || 0.55, shutterPhase: extra.shutterPhase || 0, shutterOpen: extra.shutterOpen || 0.62};
}

export function makeLane(level, seed) {
  const ch = SKIP_CHAPTERS[level] || SKIP_CHAPTERS[0];
  const roll = rng(seed);
  const left = ch.banks ? 268 : 292;
  const right = ch.banks ? 632 : 608;
  const holes = [];
  let markSpots = [];

  if (level === 0) {
    holes.push(
      hole('mark', 450, 508, ch.rMark, 50, {marked: true, name: 'reward moon'}),
      hole('near', 450, 708, ch.rOther, 10, {name: 'nearest moon'}),
      hole('left', 330, 560, 40, 30, {name: 'left cup'}),
      hole('right', 570, 560, 40, 30, {name: 'right cup'}),
    );
  } else if (level === 1) {
    holes.push(
      hole('low', 450, 640, ch.rOther + 4, 30, {name: 'rising cup'}),
      hole('mark', 450, 428, ch.rMark, 50, {marked: true, name: 'high reward moon'}),
      hole('left', 318, 520, 36, 20, {name: 'left 20'}),
      hole('right', 582, 520, 36, 20, {name: 'right 20'}),
    );
  } else if (level === 2) {
    const side = roll() < 0.5 ? 1 : -1;
    holes.push(
      hole('mark', 450 + side * 118, 470, ch.rMark, 50, {marked: true, name: 'off-centre moon'}),
      hole('mid', 450 - side * 70, 600, ch.rOther, 30, {name: 'crooked cup'}),
      hole('near', 450, 730, 40, 10, {name: 'near moon'}),
      hole('far', 450 - side * 130, 430, 32, 40, {name: 'far crescent'}),
    );
  } else if (level === 3) {
    holes.push(
      hole('mark', 450, 470, ch.rMark, 50, {marked: true, name: 'wax moon'}),
      hole('near', 450, 700, ch.rOther, 10, {name: 'matte cup'}),
      hole('left', 340, 560, 34, 30, {name: 'gloss left'}),
      hole('right', 560, 560, 34, 30, {name: 'gloss right'}),
    );
  } else if (level === 4) {
    holes.push(
      hole('mark', 450, 452, ch.rMark, 50, {marked: true, name: 'eclipse moon', shutter: true, shutterSpeed: 0.48, shutterPhase: roll() * 0.4, shutterOpen: 0.58}),
      hole('near', 450, 690, ch.rOther, 10, {name: 'low moon'}),
      hole('left', 322, 530, 32, 30, {shutter: true, shutterSpeed: 0.7, shutterPhase: 0.2, shutterOpen: 0.55, name: 'gated left'}),
      hole('right', 578, 530, 32, 30, {shutter: true, shutterSpeed: 0.7, shutterPhase: 0.55, shutterOpen: 0.55, name: 'gated right'}),
    );
  } else {
    markSpots = [
      {x: 450, y: 430},
      {x: 340, y: 500},
      {x: 560, y: 500},
      {x: 450, y: 360},
    ];
    const idx = Math.floor(roll() * markSpots.length) % markSpots.length;
    const spot = markSpots[idx];
    holes.push(
      hole('mark', spot.x, spot.y, ch.rMark, 100, {marked: true, name: 'wandering moonbow', shutter: true, shutterSpeed: 0.42, shutterPhase: roll() * 0.3, shutterOpen: 0.6}),
      hole('near', 450, 710, ch.rOther, 10, {name: 'near moon'}),
      hole('mid', 450, 580, 34, 30, {name: 'middle cup'}),
      hole('left', 310, 480, 30, 40, {shutter: true, shutterSpeed: 0.6, shutterPhase: 0.1, shutterOpen: 0.5, name: 'left gate'}),
      hole('right', 590, 480, 30, 40, {shutter: true, shutterSpeed: 0.6, shutterPhase: 0.4, shutterOpen: 0.5, name: 'right gate'}),
    );
  }

  const banks = [];
  if (ch.banks) {
    banks.push(
      {a: {x: left - 8, y: 980}, b: {x: left + 36, y: 520}},
      {a: {x: right + 8, y: 980}, b: {x: right - 36, y: 520}},
    );
  }
  const wax = [];
  if (ch.wax) {
    wax.push(
      {x: left + 16, y: 860, w: (right - left) * 0.42, h: 90, mul: 1.28, kind: 'gloss'},
      {x: 430, y: 900, w: 90, h: 110, mul: 0.62, kind: 'matte'},
    );
  }

  return {
    level, seed, left, right, lip: ch.lip, g: ch.g,
    holes, banks, wax, markSpots, markIndex: markSpots.length ? holes.find(h => h.marked) ? markSpots.findIndex(s => s.x === holes.find(h => h.marked).x && s.y === holes.find(h => h.marked).y) : 0 : 0,
    wander: !!ch.wander, shutter: !!ch.shutter, freezeT: null, balls: ch.balls,
    prize: ch.prize, title: ch.title,
  };
}

export function advanceMark(lane) {
  if (!lane?.wander || !lane.markSpots?.length) return false;
  const mark = markedHole(lane);
  if (!mark) return false;
  lane.markIndex = ((lane.markIndex || 0) + 1) % lane.markSpots.length;
  const spot = lane.markSpots[lane.markIndex];
  mark.x = spot.x;
  mark.y = spot.y;
  return true;
}

export function stepBall(lane, ball, dt, t = 0) {
  if (!lane || !ball || ball.sunk) return {event: 'idle', hole: null};
  const steps = 4;
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    ball.age += h;
    ball.x += ball.vx * h;
    ball.y += ball.vy * h;
    if (!ball.air) {
      const mul = waxMul(lane, ball.x, ball.y);
      ball.vx *= Math.pow(mul, h * 8);
      ball.vy *= Math.pow(mul, h * 8);
      if (ball.x < lane.left || ball.x > lane.right) {
        ball.x = Math.max(lane.left, Math.min(lane.right, ball.x));
        ball.vx *= -0.64;
      }
      for (const b of lane.banks || []) bounceSegment(ball, b.a, b.b, 0.72);
      if (ball.y <= lane.lip) {
        ball.air = true;
        ball.z = 6;
        ball.vz = Math.abs(ball.vy) * 0.46;
      }
    } else {
      ball.vz -= lane.g * h;
      ball.z += ball.vz * h;
      for (const b of lane.banks || []) bounceSegment(ball, b.a, b.b, 0.58);
      if (ball.vz < 0 && ball.z < 22) {
        const hole = (lane.holes || []).find(q => inHole(ball, q));
        if (hole) {
          if (!shutterOpen(lane, hole, t)) {
            ball.vx += (ball.x < hole.x ? -1 : 1) * 70;
            ball.vy = Math.abs(ball.vy) * 0.25;
            ball.vz = 90;
            ball.z = 8;
          } else {
            ball.sunk = true;
            ball.x = hole.x;
            ball.y = hole.y;
            ball.z = 6;
            ball.vx = 0;
            ball.vy = 0;
            ball.vz = 0;
            return {event: 'sunk', hole};
          }
        }
      }
      if (ball.z < 0) return {event: 'miss', hole: null};
    }
    if (ball.y < 300 || ball.x < 150 || ball.x > 750 || ball.age > 6.2) return {event: 'miss', hole: null};
  }
  if (ball.trail) {
    ball.trail.push({x: ball.x, y: ball.y - (ball.z || 0)});
    if (ball.trail.length > 10) ball.trail.shift();
  }
  return {event: 'live', hole: null};
}
