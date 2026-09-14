/** Isolated Ring Raiders: advancing pegs, loop-not-hit tosses, 1–100. */

export const RINGO_CHAPTERS = [
  {id: 'line', title: 'The Straight Line', rows: 1, cols: 5, speed: 14, sway: 0, rings: 8, pegR: 18, inner: 30, hooks: false, weave: false, storm: false, roam: false, prize: 'lucky-ring-trio'},
  {id: 'step', title: 'The Side Step', rows: 2, cols: 5, speed: 18, sway: 42, rings: 8, pegR: 16, inner: 26, hooks: false, weave: false, storm: false, roam: false, prize: 'splash-ring'},
  {id: 'grove', title: 'Wishing Grove', rows: 2, cols: 6, speed: 20, sway: 36, rings: 7, pegR: 15, inner: 24, hooks: false, weave: true, storm: false, roam: false, prize: 'wishing-acorn'},
  {id: 'hooks', title: 'Crooked Hooks', rows: 2, cols: 6, speed: 22, sway: 28, rings: 7, pegR: 14, inner: 22, hooks: true, weave: true, storm: false, roam: false, prize: 'twig-ring'},
  {id: 'storm', title: 'Ring Storm', rows: 3, cols: 6, speed: 26, sway: 48, rings: 6, pegR: 13, inner: 20, hooks: true, weave: true, storm: true, roam: false, prize: 'orchard-circlet'},
  {id: 'raid', title: 'The Golden Raid', rows: 3, cols: 7, speed: 30, sway: 54, rings: 6, pegR: 12, inner: 18, hooks: true, weave: true, storm: true, roam: true, prize: 'ring-toss-ribbon'},
];

export const COUNTER_Y = 980;
export const LAUNCH_Y = 1048;
export const FIELD = {left: 160, right: 740, top: 168};

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const RINGO_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isRingoWin(level, n) {
  return (RINGO_WINS[level] || RINGO_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 29 + 13);
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

const KINDS = ['peg', 'acorn', 'leaf', 'heart', 'hook'];

export function classifyToss(ring, peg) {
  if (!ring || !peg || peg.looped) return 'miss';
  const dx = Math.abs(ring.x - peg.x);
  const dy = Math.abs(ring.y - peg.y);
  if (dy > 16) return 'miss';
  const inner = ring.inner || 24;
  const outer = ring.outer || inner + 8;
  const pr = peg.r || 14;
  if (dx + pr <= inner - 1) return 'loop';
  if (dx < outer + pr) return 'hit';
  return 'miss';
}

export function aroundPeg(ring, peg, prevY) {
  if (!ring || !peg) return false;
  if (Math.abs(ring.y - peg.y) <= 8) return true;
  if (prevY != null && prevY > peg.y && ring.y <= peg.y) return true;
  return false;
}

export function makeWave(level, seed) {
  const ch = RINGO_CHAPTERS[level] || RINGO_CHAPTERS[0];
  const roll = rng(seed);
  const n = resultNumber(seed);
  const wantUnique = isRingoWin(level, n);
  const gapX = (FIELD.right - FIELD.left) / Math.max(1, ch.cols);
  const pegs = [];
  for (let row = 0; row < ch.rows; row++) {
    const dir = row % 2 === 0 ? 1 : -1;
    for (let col = 0; col < ch.cols; col++) {
      if (ch.storm && row === 1 && col === 0) continue;
      const kind = ch.hooks && (row + col) % 3 === 2 ? 'hook' : KINDS[(row + col) % (ch.weave ? 4 : 1)];
      const rScale = ch.weave && kind === 'acorn' ? 0.78 : 1;
      const x = FIELD.left + gapX * (col + 0.5);
      const y = FIELD.top + 18 + row * (ch.pegR * 2 + 36);
      pegs.push({
        id: row + '-' + col,
        row, col, kind,
        x, y, homeX: x, homeY: y,
        r: ch.pegR * rScale,
        tilt: kind === 'hook' ? (dir * 0.35) : 0,
        vx: ch.sway ? dir * (18 + row * 4) : 0,
        pause: kind === 'acorn',
        pauseT: roll() * 2,
        looped: false,
        unique: false,
      });
    }
  }
  if (wantUnique && pegs.length) {
    const pick = Math.min(pegs.length - 1, Math.floor(roll() * pegs.length));
    pegs[pick].unique = true;
  }
  return {
    level, seed, pegs, ch,
    ringsLeft: ch.rings, ringsMax: ch.rings,
    uniqueLooped: false, breached: false, cleared: false,
    t: 0, roamT: 0, resultN: n,
    inner: ch.inner, outer: ch.inner + 8, pegR: ch.pegR, speed: ch.speed,
  };
}

export function livePegs(wave) {
  return (wave?.pegs || []).filter(p => !p.looped);
}

export function uniquePeg(wave) {
  return (wave?.pegs || []).find(p => p.unique && !p.looped) || null;
}

export function stepWave(wave, dt, reduced) {
  if (!wave || wave.breached || wave.cleared) return wave;
  const slow = reduced ? 0.45 : 1;
  wave.t += dt * slow;
  wave.roamT += dt * slow;
  const ch = wave.ch || RINGO_CHAPTERS[wave.level] || RINGO_CHAPTERS[0];
  for (const peg of wave.pegs) {
    if (peg.looped) continue;
    if (peg.pause) {
      peg.pauseT -= dt * slow;
      if (peg.pauseT <= 0) {
        peg.pauseT = 1.4 + (peg.col % 3) * 0.3;
      } else if (peg.pauseT < 0.45) {
        // tactical hold
      } else {
        peg.y += ch.speed * dt * slow * 0.35;
      }
    } else {
      peg.y += ch.speed * dt * slow;
    }
    if (ch.sway) {
      peg.x += peg.vx * dt * slow;
      if (peg.x < FIELD.left + peg.r || peg.x > FIELD.right - peg.r) {
        peg.vx *= -1;
        peg.x = Math.max(FIELD.left + peg.r, Math.min(FIELD.right - peg.r, peg.x));
      }
    }
    if (ch.hooks && peg.kind === 'hook') {
      peg.tilt = Math.sin(wave.t * 1.4 + peg.col) * 0.55;
    }
    if (ch.storm && Math.floor(wave.t * 0.6) % 2 === 1 && peg.row === 0) peg.vx = Math.abs(peg.vx || 22) * (peg.col % 2 ? -1 : 1);
  }
  if (ch.roam) {
    const u = uniquePeg(wave);
    if (u && wave.roamT > 1.2) {
      const live = livePegs(wave).filter(p => p !== u);
      if (live.length) {
        const swap = live[Math.floor((wave.t * 3) % live.length)];
        const hx = u.x, hy = u.y;
        u.x = swap.x; u.y = swap.y;
        swap.x = hx; swap.y = hy;
      }
      wave.roamT = 0;
    }
  }
  if (livePegs(wave).some(p => p.y >= COUNTER_Y - 18)) wave.breached = true;
  if (!livePegs(wave).length) wave.cleared = true;
  return wave;
}

export function makeRing(x, power, curve, ch) {
  const inner = (ch && ch.inner) || 24;
  const lift = 280 + power * 520;
  return {
    x, y: LAUNCH_Y, z: 0,
    vx: curve * 210,
    vy: -lift,
    inner, outer: inner + 8,
    live: true, looped: false, bounced: false, age: 0,
  };
}

export function stepRing(ring, wave, dt) {
  if (!ring || !ring.live) return {kind: 'dead'};
  const prevY = ring.y;
  ring.age += dt;
  ring.vy += 540 * dt;
  ring.x += ring.vx * dt;
  ring.y += ring.vy * dt;
  if (ring.x < FIELD.left - 20 || ring.x > FIELD.right + 20 || ring.y < 80 || ring.y > 1180) {
    ring.live = false;
    return {kind: 'spent'};
  }
  for (const peg of livePegs(wave)) {
    if (!aroundPeg(ring, peg, prevY)) continue;
    const hit = classifyToss(ring, peg);
    if (hit === 'loop') {
      peg.looped = true;
      ring.live = false;
      ring.looped = true;
      ring.x = peg.x;
      ring.y = peg.y;
      if (peg.unique) wave.uniqueLooped = true;
      if (!livePegs(wave).length) wave.cleared = true;
      return {kind: 'loop', peg};
    }
    if (hit === 'hit' && !ring.bounced) {
      ring.vx += (ring.x < peg.x ? -1 : 1) * 160;
      ring.vy = Math.abs(ring.vy) * 0.35 + 40;
      ring.bounced = true;
      return {kind: 'hit', peg};
    }
  }
  return {kind: 'fly'};
}

export function waveOver(wave) {
  return !!(wave && (wave.breached || wave.cleared || wave.ringsLeft <= 0 && !wave.flying));
}
