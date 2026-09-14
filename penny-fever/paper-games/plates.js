/** Isolated Impossible Plates: pull-back throws, rim vs clean pass, 1–100. */

export const BALL_R = 15;
export const FAIR = 1.25;
export const MIN_PULL = 52;
export const MAX_PULL = 260;
export const MIN_SPEED = 640;
export const MAX_SPEED = 1180;
export const GRAVITY = 640;
export const START = {x: 450, y: 1020};
export const BALLS = 3;
export const PLATE_CX = 450;

export const BESS_CHAPTERS = [
  {id: 'open', title: 'The Open Plate', plateR: 108, prize: 'juggling-bird'},
  {id: 'rock', title: 'The Rocking Plate', plateR: 108, prize: 'patchwork-bear'},
  {id: 'choose', title: 'The Choosing Plate', plateR: 220, prize: 'autumn-leaf-lantern'},
  {id: 'turn', title: 'The Turning Plate', plateR: 108, prize: 'button-elephant'},
  {id: 'layer', title: 'The Layered Plates', plateR: 108, prize: 'prize-claim'},
  {id: 'impossible', title: 'The Impossible Plate', plateR: 108, prize: 'midway-scarf'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const BESS_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isBessWin(level, n) {
  return (BESS_WINS[level] || BESS_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 17 + 11);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

export function bessUnique(level, n, passes) {
  return (Number(passes) || 0) >= 1 && isBessWin(level, n);
}

export function plateYs(level) {
  if (level === 4) return [560, 380];
  if (level === 5) return [620, 470, 330];
  return [430];
}

function motionT(t, reduced) {
  return reduced ? t * 0.35 : t;
}

export function holesAt(level, t, seed = 1, reduced = false) {
  const tau = motionT(t, reduced);
  if (level === 0) return [{x: 450, y: 430, r: 22, live: true}];
  if (level === 1) {
    return [{x: 450 + Math.sin(tau * 1.35) * 74, y: 430, r: 19.5, live: true}];
  }
  if (level === 2) {
    const shift = Math.abs((Number(seed) || 0) * 3) % 3;
    const live = (Math.floor(tau / 1.55) + shift) % 3;
    return [300, 450, 600].map((x, i) => ({x, y: 430, r: 19, live: i === live}));
  }
  if (level === 3) {
    const tilt = tau * 0.85;
    const open = Math.max(0.28, Math.abs(Math.cos(tilt)));
    return [{x: 450, y: 430, r: 20 * open, live: true, tilt}];
  }
  if (level === 4) {
    const cycle = 3.2;
    const u = (((tau % cycle) + cycle) % cycle) / cycle;
    const spread = (u < 0.45 || u > 0.92) ? 0 : Math.sin(((u - 0.45) / 0.47) * Math.PI);
    return [
      {x: 450 + 78 * spread, y: 560, r: 19, live: true},
      {x: 450 - 78 * spread, y: 380, r: 19, live: true},
    ];
  }
  const cycle = 3.6;
  const u = (((tau % cycle) + cycle) % cycle) / cycle;
  const spread = (u < 0.4 || u > 0.95) ? 0 : Math.sin(((u - 0.4) / 0.55) * Math.PI);
  return [
    {x: 450 + 42 * spread, y: 620, r: 18.5, live: true},
    {x: 450 + 70 * spread, y: 470, r: 18.5, live: true},
    {x: 450 + 96 * spread, y: 330, r: 18.5, live: true},
  ];
}

export function classifyHole(x, vx, vy, hole) {
  const dist = Math.abs(x - hole.x);
  if (hole.tilt != null) {
    const spd = Math.hypot(vx, vy) || 1;
    const nx = Math.sin(hole.tilt);
    const ny = -Math.cos(hole.tilt);
    const into = -(vx * nx + vy * ny) / spd;
    if (into < 0.52) {
      if (dist > hole.r + BALL_R + 10) return null;
      return 'rim';
    }
  }
  if (hole.live && dist + BALL_R <= hole.r + FAIR) return 'pass';
  if (dist <= hole.r + BALL_R + 8) return 'rim';
  return null;
}

export function verdictAt(x, vx, vy, holes, plateR = 108) {
  if (!holes.length) {
    if (Math.abs(x - PLATE_CX) <= plateR + BALL_R) return 'rim';
    return 'miss';
  }
  let rim = false;
  for (const hole of holes) {
    const v = classifyHole(x, vx, vy, hole);
    if (v === 'pass') return 'pass';
    if (v === 'rim') rim = true;
  }
  if (rim) return 'rim';
  if (Math.abs(x - PLATE_CX) <= plateR + BALL_R) return 'rim';
  return 'miss';
}

export function launchFromPull(pointer, from = START) {
  if (!pointer) return null;
  const dx = from.x - pointer.x;
  const dy = from.y - pointer.y;
  const len = Math.hypot(dx, dy);
  if (len < MIN_PULL) return null;
  const capped = Math.min(len, MAX_PULL);
  const power = (capped - MIN_PULL) / (MAX_PULL - MIN_PULL);
  const speed = MIN_SPEED + power * (MAX_SPEED - MIN_SPEED);
  const inv = 1 / len;
  return {
    x: from.x, y: from.y,
    vx: dx * inv * speed, vy: dy * inv * speed,
    live: true, judged: false, result: null, got: 0,
  };
}

export function launchTo(target, flight = 0.8, from = START) {
  const t = Math.max(0.35, Number(flight) || 0.8);
  const vx = (target.x - from.x) / t;
  const vy = (target.y - from.y - 0.5 * GRAVITY * t * t) / t;
  return {
    x: from.x, y: from.y, vx, vy,
    live: true, judged: false, result: null, got: 0,
  };
}

export function makeBall(level) {
  return {
    x: START.x, y: START.y, vx: 0, vy: 0,
    live: true, judged: false, result: null, got: 0,
    need: plateYs(level).length,
  };
}

export function advanceBall(ball, dt, ctx) {
  if (!ball || !ball.live) return ball;
  const level = ctx.level || 0;
  const seed = ctx.seed || 1;
  const reduced = !!ctx.reduced;
  const t = ctx.t || 0;
  const ch = BESS_CHAPTERS[level] || BESS_CHAPTERS[0];
  if (!ball.need) ball.need = plateYs(level).length;
  if (ball.judged) {
    ball.vy += GRAVITY * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    return ball;
  }
  const before = {x: ball.x, y: ball.y};
  ball.vy += GRAVITY * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  for (const py of plateYs(level)) {
    if (!(before.y > py && ball.y <= py)) continue;
    const spanY = before.y - ball.y || 1e-6;
    const u = (before.y - py) / spanY;
    const x = before.x + (ball.x - before.x) * u;
    const holes = holesAt(level, t, seed, reduced).filter(h => Math.abs(h.y - py) < 0.5);
    const v = verdictAt(x, ball.vx, ball.vy, holes, ch.plateR);
    if (v === 'pass') {
      ball.got = (ball.got || 0) + 1;
      if (ball.got >= ball.need) {
        ball.result = 'pass';
        ball.judged = true;
        ball.x = x;
        ball.y = py;
        ball.vx *= 0.2;
        ball.vy *= 0.15;
      }
    } else {
      ball.result = v || 'miss';
      ball.judged = true;
      ball.x = x;
      ball.y = py;
      if (v === 'rim') {
        ball.vy = Math.abs(ball.vy) * 0.32;
        ball.vx += (x < PLATE_CX ? -1 : 1) * 90;
      }
    }
  }
  if (!ball.judged && ball.y > 1180 && ball.vy > 0) {
    ball.result = 'miss';
    ball.judged = true;
  }
  return ball;
}

export function simulateFlight(ball, level, seed, t0 = 0, dt = 1 / 180) {
  const b = {
    ...ball,
    judged: false,
    result: null,
    got: 0,
    need: plateYs(level).length,
    live: true,
  };
  let t = t0;
  for (let i = 0; i < 900; i++) {
    t += dt;
    advanceBall(b, dt, {level, seed, t, reduced: false});
    if (b.judged && (b.y > 1120 || i > 40 && b.result === 'pass')) break;
    if (b.y > 1240) break;
  }
  if (!b.judged) {
    b.result = 'miss';
    b.judged = true;
  }
  return b;
}
