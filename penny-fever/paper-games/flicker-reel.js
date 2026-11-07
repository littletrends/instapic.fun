import {firstPrizeEligible} from './first-prize.js?v=first-prize-1';
/** Isolated Flicker Reel: 100 hidden frames, brake window, 1–100. */

export const MILO_CHAPTERS = [
  {id: 'slow', title: 'The Slow Reel', speed: 8, brake: 0.42, jumps: false, doubles: false, reverse: false, slip: false, spins: 3, prize: 'flicker-book'},
  {id: 'jump', title: 'The Jumping Reel', speed: 11, brake: 0.48, jumps: true, doubles: false, reverse: false, slip: false, spins: 3, prize: 'pocket-peepshow'},
  {id: 'double', title: 'The Double Reel', speed: 12, brake: 0.54, jumps: false, doubles: true, reverse: false, slip: false, spins: 3, prize: 'memory-scrapbook'},
  {id: 'slip', title: 'The Slipping Crank', speed: 13, brake: 0.6, jumps: false, doubles: false, reverse: false, slip: true, spins: 3, prize: 'moonlight-wardrobe'},
  {id: 'reverse', title: 'The Reverse Picture', speed: 14, brake: 0.66, jumps: false, doubles: false, reverse: true, slip: false, spins: 3, prize: 'dapper-fox'},
  {id: 'final', title: 'The Final Flicker', speed: 16, brake: 0.74, jumps: true, doubles: true, reverse: true, slip: true, spins: 3, prize: 'pocket-theatre'},
];

export const ORDINARY_FRAMES = ['moon-rabbit', 'singing-bird', 'dapper-fox', 'moon-lantern', 'trade-envelope', 'cabinet-key'];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const MILO_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isMiloWin(level, n) {
  if(firstPrizeEligible('mutoscope',level))return true;
  return (MILO_WINS[level] || MILO_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 29 + 3);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

/** The unique picture sits on this hidden frame. Seed-based, 1–100. */
export function uniqueFrame(seed) {
  return resultNumber(seed);
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

export function wrapPos(pos) {
  return ((Number(pos) % 100) + 100) % 100;
}

export function windowFrame(reel) {
  const pos = wrapPos(reel && reel.pos);
  let n = Math.round(pos);
  n = ((n % 100) + 100) % 100;
  return n === 0 ? 100 : n;
}

export function decoyFrames(unique) {
  const u = Number(unique) || 1;
  const a = u === 100 ? 1 : u + 1;
  const b = u === 1 ? 100 : u - 1;
  return [a, b];
}

export function frameKind(reel, frame) {
  const f = Number(frame);
  if (f === reel.unique) return 'unique';
  if (reel.doubles && decoyFrames(reel.unique).includes(f)) return 'decoy';
  if (reel.jumps && f % 11 === 0) return 'blank';
  return 'ordinary';
}

export function ordinarySprite(frame) {
  return ORDINARY_FRAMES[((Number(frame) || 1) - 1) % ORDINARY_FRAMES.length];
}

export function makeReel(level, seed) {
  const ch = MILO_CHAPTERS[level] || MILO_CHAPTERS[0];
  const roll = rng(seed);
  const unique = uniqueFrame(seed);
  return {
    level, seed, unique,
    pos: roll() * 100,
    speed: ch.speed,
    dir: 1,
    t: 0,
    braking: false,
    brakeT: 0,
    brakeDur: ch.brake,
    stopped: false,
    spin: 0,
    jumps: !!ch.jumps,
    doubles: !!ch.doubles,
    reverse: !!ch.reverse,
    slip: !!ch.slip,
    frame: 0,
  };
}

export function brakeReel(reel) {
  if (!reel || reel.stopped || reel.braking) return false;
  reel.braking = true;
  reel.brakeT = 0;
  return true;
}

export function stepReel(reel, dt, reduced) {
  if (!reel || reel.stopped) return reel;
  const slow = reduced ? 0.4 : 1;
  reel.t += dt;
  if (reel.reverse) {
    const cycle = reel.t % 3.2;
    reel.dir = cycle > 2.15 ? -1 : 1;
  } else {
    reel.dir = 1;
  }
  let spd = reel.speed;
  if (reel.slip) spd *= (Math.floor(reel.t / 1.15) % 2 === 0) ? 1 : 1.55;
  if (reel.braking) {
    reel.brakeT += dt;
    const u = Math.min(1, reel.brakeT / (reel.brakeDur || 0.5));
    spd *= (1 - u) * (1 - u);
    reel.pos = wrapPos(reel.pos + reel.dir * spd * dt * slow);
    if (u >= 1) {
      reel.stopped = true;
      reel.braking = false;
      reel.frame = windowFrame(reel);
      reel.pos = reel.frame === 100 ? 0 : reel.frame;
    }
    return reel;
  }
  reel.pos = wrapPos(reel.pos + reel.dir * spd * dt * slow);
  if (reel.jumps) {
    const beat = reel.t % 0.85;
    if (beat < dt) reel.pos = wrapPos(reel.pos + reel.dir * 2);
  }
  return reel;
}

export function isUniqueStop(reel) {
  return !!(reel && reel.stopped && windowFrame(reel) === reel.unique);
}

export function restartSpin(reel) {
  const ch = MILO_CHAPTERS[reel.level] || MILO_CHAPTERS[0];
  const cap = ch.spins || 3;
  if (reel.spin + 1 >= cap) return false;
  reel.spin += 1;
  reel.stopped = false;
  reel.braking = false;
  reel.brakeT = 0;
  reel.speed = ch.speed * (1 + reel.spin * 0.32);
  reel.pos = wrapPos(reel.pos + 13 + reel.spin * 7);
  reel.t = 0;
  reel.dir = 1;
  reel.frame = 0;
  return true;
}

export function spinsLeft(reel) {
  const ch = MILO_CHAPTERS[reel.level] || MILO_CHAPTERS[0];
  return Math.max(0, (ch.spins || 3) - 1 - reel.spin);
}
