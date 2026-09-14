/** Isolated Marquee Glowball: paddle, star, lantern, 1–100. */

export const LUMI_CHAPTERS = [
  {id: 'first', title: 'First Light', bulbs: 7, hp: 1, speed: 210, paddle: 168, lives: 3, swing: false, clouds: false, blackout: false, second: false, prize: 'marquee-bulb'},
  {id: 'parade', title: 'Pocket Parade', bulbs: 9, hp: 1, speed: 230, paddle: 156, lives: 3, swing: true, clouds: false, blackout: false, second: false, prize: 'pocket-marquee'},
  {id: 'lanterns', title: 'Lantern Lane', bulbs: 8, hp: 1, speed: 240, paddle: 148, lives: 3, swing: true, clouds: false, blackout: false, second: false, prize: 'lantern-lighter'},
  {id: 'map', title: 'Map of Lights', bulbs: 10, hp: 1, speed: 250, paddle: 140, lives: 3, swing: false, clouds: true, blackout: false, second: false, prize: 'midway-map'},
  {id: 'cracker', title: 'Starcracker Blackout', bulbs: 11, hp: 1, speed: 270, paddle: 132, lives: 3, swing: true, clouds: false, blackout: true, second: false, prize: 'new-year-star-cracker'},
  {id: 'grand', title: 'The Grand Illumination', bulbs: 12, hp: 2, speed: 290, paddle: 124, lives: 3, swing: true, clouds: true, blackout: true, second: true, prize: 'marquee-stub'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const LUMI_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isLumiWin(level, n) {
  return (LUMI_WINS[level] || LUMI_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 41 + 17);
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

const LEFT = 90, RIGHT = 810, TOP = 210, BOTTOM = 1040;
const PADDLE_Y = 980;

function layoutTargets(ch, roll) {
  const targets = [];
  const n = ch.bulbs;
  if (ch.id === 'first' || ch.id === 'parade') {
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i / Math.max(1, n - 1)) * Math.PI;
      targets.push({
        x: 450 + Math.cos(a) * 210, y: 430 + Math.sin(a) * 110,
        r: 22, hp: ch.hp, max: ch.hp, lit: false, kind: 'bulb', fade: 0,
      });
    }
  } else if (ch.id === 'lanterns') {
    for (let i = 0; i < n; i++) {
      const col = i % 4, row = Math.floor(i / 4);
      targets.push({
        x: 210 + col * 150, y: 300 + row * 110,
        r: 26, hp: ch.hp, max: ch.hp, lit: false, kind: 'lantern',
        swing: (roll() - 0.5) * 40, phase: roll() * 6, fade: 0,
      });
    }
  } else if (ch.id === 'map') {
    for (let i = 0; i < n; i++) {
      const col = i % 5, row = Math.floor(i / 5);
      targets.push({
        x: 190 + col * 130, y: 280 + row * 120,
        r: 20, hp: ch.hp, max: ch.hp, lit: false, kind: 'bulb', fade: 0,
      });
    }
  } else {
    for (let i = 0; i < n; i++) {
      const col = i % 6, row = Math.floor(i / 6);
      targets.push({
        x: 170 + col * 112, y: 270 + row * 100,
        r: 18, hp: ch.hp, max: ch.hp, lit: false, kind: row ? 'bulb' : 'lantern',
        swing: ch.swing ? (i % 2 ? 28 : -28) : 0, phase: i, fade: 0,
      });
    }
  }
  return targets;
}

export function makeBoard(level, seed) {
  const ch = LUMI_CHAPTERS[level] || LUMI_CHAPTERS[0];
  const roll = rng(seed);
  const targets = layoutTargets(ch, roll);
  const mirrors = [];
  const bumpers = [];
  const clouds = [];
  if (level >= 3) {
    mirrors.push({x: 140, y: 560, w: 18, h: 90}, {x: 760, y: 560, w: 18, h: 90});
  }
  if (level >= 4) {
    bumpers.push({x: 450, y: 620, r: 28});
  }
  if (ch.clouds) {
    clouds.push({x: 300, y: 500, r: 46, t: roll()}, {x: 600, y: 470, r: 40, t: roll() + 1});
  }
  return {
    level, seed,
    targets,
    lantern: {x: 450, y: 360, r: 34, open: false, struck: false},
    paddle: {x: 450, w: ch.paddle, y: PADDLE_Y},
    balls: [],
    lives: ch.lives, served: false,
    speed: ch.speed, blackout: ch.blackout, second: ch.second,
    mirrors, bumpers, clouds,
    t: 0, done: false, failed: '',
    hide: true,
  };
}

export function allLit(board) {
  return (board.targets || []).every(t => t.lit);
}

export function lightTarget(board, index) {
  const t = board.targets[index];
  if (!t || t.lit) return false;
  t.hp = Math.max(0, t.hp - 1);
  if (t.hp <= 0) {
    t.lit = true;
    t.fade = 0;
  }
  if (allLit(board)) board.lantern.open = true;
  return true;
}

export function lightAll(board) {
  (board.targets || []).forEach(t => { t.hp = 0; t.lit = true; t.fade = 0; });
  board.lantern.open = true;
}

export function strikeLantern(board) {
  if (!board || !board.lantern.open || board.lantern.struck) return false;
  board.lantern.struck = true;
  board.done = true;
  return true;
}

function spawnBall(board, extra) {
  const px = board.paddle.x;
  board.balls.push({
    x: px, y: PADDLE_Y - 22, vx: extra ? 80 : 40, vy: -board.speed, r: 11, live: true,
  });
}

export function serveBoard(board) {
  if (!board || board.served || board.done || board.failed) return false;
  board.served = true;
  spawnBall(board, false);
  return true;
}

export function movePaddle(board, x) {
  if (!board) return;
  const half = board.paddle.w / 2;
  board.paddle.x = Math.max(LEFT + half, Math.min(RIGHT - half, x));
}

function bouncePaddle(ball, paddle) {
  const half = paddle.w / 2;
  if (ball.y + ball.r < paddle.y - 8 || ball.y - ball.r > paddle.y + 12) return false;
  if (Math.abs(ball.x - paddle.x) > half + ball.r) return false;
  if (ball.vy < 0) return false;
  const hit = (ball.x - paddle.x) / half;
  ball.vy = -Math.abs(ball.vy);
  ball.vx += hit * 240;
  ball.y = paddle.y - 12 - ball.r;
  const mag = Math.hypot(ball.vx, ball.vy) || 1;
  const want = Math.max(180, mag);
  ball.vx = ball.vx / mag * want;
  ball.vy = ball.vy / mag * want;
  return true;
}

function hitCircle(ball, x, y, r) {
  const dx = ball.x - x, dy = ball.y - y;
  const d = Math.hypot(dx, dy);
  if (d > r + ball.r || d < 0.001) return false;
  const nx = dx / d, ny = dy / d;
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot > 0) return false;
  ball.vx -= 2 * dot * nx;
  ball.vy -= 2 * dot * ny;
  ball.x = x + nx * (r + ball.r + 0.5);
  ball.y = y + ny * (r + ball.r + 0.5);
  return true;
}

export function targetPos(t, time) {
  const swing = t.swing || 0;
  return {x: t.x + Math.sin((time || 0) * 1.4 + (t.phase || 0)) * swing, y: t.y};
}

export function stepBoard(board, dt, reduced) {
  if (!board || board.done || board.failed) return;
  const slow = reduced ? 0.45 : 1;
  board.t += dt;
  (board.clouds || []).forEach(c => { c.t += dt; c.x += Math.sin(c.t) * 12 * dt; });
  if (board.blackout) {
    board.targets.forEach(t => {
      if (!t.lit) return;
      t.fade += dt;
      if (t.fade > 7.5) { t.lit = false; t.hp = t.max; t.fade = 0; board.lantern.open = allLit(board); }
    });
  }
  if (!board.served) return;
  for (const ball of board.balls) {
    if (!ball.live) continue;
    ball.x += ball.vx * dt * slow;
    ball.y += ball.vy * dt * slow;
    if (ball.x - ball.r < LEFT) { ball.x = LEFT + ball.r; ball.vx = Math.abs(ball.vx); }
    if (ball.x + ball.r > RIGHT) { ball.x = RIGHT - ball.r; ball.vx = -Math.abs(ball.vx); }
    if (ball.y - ball.r < TOP) { ball.y = TOP + ball.r; ball.vy = Math.abs(ball.vy); }
    bouncePaddle(ball, board.paddle);
    board.targets.forEach((t, i) => {
      if (t.lit) return;
      const p = targetPos(t, board.t);
      if (hitCircle(ball, p.x, p.y, t.r)) lightTarget(board, i);
    });
    (board.bumpers || []).forEach(b => {
      if (hitCircle(ball, b.x, b.y, b.r)) {
        ball.vx *= 1.08; ball.vy *= 1.08;
      }
    });
    (board.mirrors || []).forEach(m => {
      if (ball.x > m.x - ball.r && ball.x < m.x + m.w + ball.r && ball.y > m.y && ball.y < m.y + m.h) {
        ball.vx *= -1;
        ball.x += Math.sign(ball.vx) * 4;
      }
    });
    if (board.lantern.open && !board.lantern.struck) {
      if (hitCircle(ball, board.lantern.x, board.lantern.y, board.lantern.r)) strikeLantern(board);
    }
    if (ball.y - ball.r > BOTTOM) ball.live = false;
  }
  board.balls = board.balls.filter(b => b.live);
  if (board.second && board.served && board.balls.length === 1 && allLit(board) && !board.lantern.struck) {
    if (!board.twin) { board.twin = true; spawnBall(board, true); }
  }
  if (!board.balls.length && !board.done) {
    board.lives -= 1;
    board.served = false;
    if (board.lives <= 0) board.failed = 'dark';
  }
}
