import {clamp, done} from '../draw.js?v=ink-1';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep} from '../wallet.js?v=peggy-mill-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const R = 12;
const MAX = 720;
const CLOCK = 40;
const SEALS = ['pressed-heart', 'star-token', 'moon-penny'];
const COLORS = ['#de8f99', '#e2c478', '#a6d1c9'];
const SETS = [
  {prize: 'mill-marble', wood: '#5a3a28', felt: '#1e3a32cc', peg: '#cbb581', bat: '#e8b8c4',
    prizeX: 450, prizeY: 668, prizeR: 36, g: 228, clock: 42, rows: 6, pinch: 0, gap: 86},
  {prize: 'gate-token', wood: '#4a3224', felt: '#24364acc', peg: '#c4b070', bat: '#d4c4a0',
    prizeX: 338, prizeY: 612, prizeR: 32, g: 252, clock: 38, rows: 6, pinch: 6, gap: 82},
  {prize: 'mercury-bead', wood: '#3a2a22', felt: '#2a2438cc', peg: '#b8a070', bat: '#e0b070',
    prizeX: 562, prizeY: 568, prizeR: 28, g: 278, clock: 34, rows: 7, pinch: 10, gap: 76},
  {prize: 'ticket-punch', wood: '#4a2818', felt: '#1c3228cc', peg: '#c9a56a', bat: '#f0c090',
    prizeX: 318, prizeY: 518, prizeR: 26, g: 308, clock: 30, rows: 7, pinch: 14, gap: 72},
  {prize: 'stamp-and-inkpad', wood: '#3a1c18', felt: '#241820cc', peg: '#b89668', bat: '#c89090',
    prizeX: 582, prizeY: 498, prizeR: 24, g: 338, clock: 26, rows: 8, pinch: 16, gap: 68},
  {prize: 'marble-tin', wood: '#2a1814', felt: '#141820ee', peg: '#a88858', bat: '#b09088',
    prizeX: 268, prizeY: 488, prizeR: 22, g: 368, clock: 22, rows: 8, pinch: 18, gap: 64},
];
const SPRITES = ['pressed-heart', 'star-token', 'moon-penny', 'lucky-dish',
  'five-penny-stack', 'mercury-bead', 'ticket-punch', 'stamp-and-inkpad',
  'coin-album', 'penny-purse', 'everyday-penny'];

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
  const speed = Math.max(kick, Math.hypot(p.vx, p.vy) * 1.04);
  p.vx = nx * speed; p.vy = ny * speed;
  if (Math.abs(p.vx) < 8) p.vx += nx >= 0 ? 10 : -10;
  return true;
}
function layout(level) {
  const set = SETS[level] || SETS[0];
  const pegs = [];
  for (let r = 0; r < set.rows; r++) {
    for (let c = 0; c < 5; c++) {
      const x = 270 + c * set.gap + (r % 2 ? set.gap * 0.48 : 0);
      const y = 458 + r * (set.rows >= 8 ? 54 : 62);
      if (Math.hypot(x - set.prizeX, y - set.prizeY) > set.prizeR + 26) pegs.push({x, y, r: 9, cool: 0, flash: 0});
    }
  }
  const pinch = set.pinch;
  return {
    pegs,
    prizeSpot: {x: set.prizeX, y: set.prizeY, r: set.prizeR, cool: 0, flash: 0},
    gates: [
      {x: 318 - pinch * 0.4, y: 922, a: 0.45, w: 0, sign: 1, len: 74},
      {x: 582 + pinch * 0.4, y: 922, a: -0.45, w: 0, sign: -1, len: 74},
    ],
    walls: {l: 214 + pinch, r: 686 - pinch},
    outL: 318 + pinch, outR: 582 - pinch,
  };
}
function gateTarget(g, sign) {
  return sign * g.sign * 0.45;
}
function gateTips(g) {
  const c = Math.cos(g.a), sn = Math.sin(g.a);
  return {
    a: {x: g.x - c * g.len, y: g.y - sn * g.len},
    b: {x: g.x + c * g.len, y: g.y + sn * g.len},
  };
}
function sealOf(s) {
  return SEALS[(s.drops || 0) % SEALS.length];
}
function canAfford() {
  if (!alleyPlay) return true;
  return (pocket() || 0) >= 1;
}
function seatHopper(s) {
  s.mode = 'hopper';
  s.ball = null;
  s.trail = [];
  s.stuck = 0;
  s.charging = false;
  s.charge = 0;
  if (s.won) return;
  s.note = alleyPlay
    ? (canAfford() ? 'A penny starts the mill. Knock the hanging prize off its hook.' : 'Need a penny to start the mill. Cash a ticket for a five-penny stack.')
    : 'Aim the hopper. Drop a practice marble. Knock the hanging prize.';
}
function beginCharge(s) {
  if (s.result || s.won || s.mode !== 'hopper' || s.charging) return;
  if (!canAfford()) {
    s.note = alleyPlay
      ? 'Need a penny to start the mill. Cash a ticket for a five-penny stack.'
      : 'The hopper is waiting.';
    return;
  }
  s.charging = true;
  s.charge = 0.04;
}
function releaseMarble(s) {
  if (s.result || s.won) return;
  if (s.mode !== 'hopper' || !s.charging) { s.charging = false; return; }
  const power = s.charge;
  s.charging = false;
  s.charge = 0;
  if (power < 0.1) {
    s.note = 'A timid shutter. Hold Drop a little longer.';
    return;
  }
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny to start the mill. Cash a ticket for a five-penny stack.';
      return;
    }
  }
  const english = (power - 0.5) * 70;
  s.ball = {x: s.aim, y: 392, vx: english, vy: 36 + power * 90};
  s.mode = 'live';
  s.clock = s.clockMax;
  s.drops++;
  s.stuck = 0;
  s.stuckPos = {x: s.aim, y: 392, t: s.t};
  s.trail = [];
  s.note = power > 0.72 ? 'A bold drop. Tilt the house, flip the gates.' : 'The marble is in the mill. Tilt and flip the gates.';
}
function drain(s, why) {
  if (s.won || s.result) return;
  s.mode = 'dead';
  s.deadAt = s.t;
  s.charging = false;
  s.charge = 0;
  s.ball = null;
  s.trail = [];
  s.stuck = 0;
  s.note = why || (alleyPlay
    ? 'Sorted into a bin. Another penny for another marble.'
    : 'Sorted into a bin. Aim the hopper again.');
}
function claimPrize(s) {
  if (s.won || s.result) return;
  const prize = s.prize;
  s.won = true;
  s.wonAt = s.t;
  s.prizeOut = true;
  s.prizeSpot.flash = 0.55;
  s.mode = 'live';
  if (alleyPlay && prize) keep(prize, 'plinko');
  takePrize(s, prize);
  s.note = itemName(prize) + ' — knocked off Peggy’s hook!';
}
function finishWin(s) {
  if (s.result) return;
  const prize = s.prize;
  done(s, 'Peggy stamps the book',
    itemName(prize) + ' belongs in the treasure book.',
    {prize, won: true});
}

export default {
  title: 'Peggy’s Marble Mill',
  live: alleyPlay,
  tables: true,
  intro: alleyPlay
    ? 'Six mill shifts. A penny starts the hopper. Knock this mill’s hanging prize off its hook — aim the drop, tilt the house, flip the sorting gates. A clock runs while the marble is live. Drain or time, and another penny starts another marble.'
    : 'Workshop mill. Aim, drop, tilt, and flip the gates. Knock the hanging prize off its hook. Shift is free practice.',
  instructions: alleyPlay
    ? 'Hold Drop and release to spend a penny and send a marble. Left/Right or arrows tilt the mill (and aim the hopper). Flip gates swings both ramps — time it to kick a marble back up toward the prize. A clock runs while the marble is live. Hit the hanging prize to keep it.'
    : 'Hold Drop and release. Arrows tilt (and aim). Up or Flip gates kicks the ramps. Knock the hanging prize to finish the chapter.',
  liveTitle: 'Peggy’s Marble Mill',
  liveDetail: alleyPlay
    ? 'A penny a marble. Knock the hanging prize off its hook. The mill has a clock.'
    : 'Drop a practice marble. Knock the hanging prize. Tilt and flip the gates.',
  liveButton: 'Step up to the mill',
  tableDetail: alleyPlay
    ? 'A penny starts the hopper. Knock this mill’s prize off the hook to keep it. Time runs out, or a bin takes it — another penny for another marble. Tilt the house; flip the gates.'
    : 'Knock the hanging prize. Tilt and flip the gates.',
  levels: ['The first mill run', 'A dish in the pegs', 'Mercury in the brass', 'Punch the hanging ticket', 'The morning stamp', 'Peggy’s closed book'],
  sprites: SPRITES,
  prizes: SETS.map(t => t.prize),
  actions: [
    {id: 'left', label: 'Tilt left · ←', hold: true},
    {id: 'gate', label: 'Flip gates · ↑'},
    {id: 'drop', label: alleyPlay ? 'Drop · 1 penny' : 'Drop marble', hold: true},
    {id: 'right', label: 'Tilt right · →', hold: true},
  ],
  create(level) {
    const set = SETS[level] || SETS[0];
    const built = layout(level);
    const clockMax = Math.max(20, set.clock || CLOCK);
    const s = {
      level, t: 0, mode: 'hopper', aim: 450, charge: 0, charging: false, pointerDrop: false,
      left: false, right: false, gateSign: 1, combo: 0,
      drops: 0, won: false, wonAt: 0, prizeOut: false, fly: [], trail: [], stuck: 0,
      clockMax, clock: clockMax, prize: set.prize, set,
      note: alleyPlay
        ? 'A penny starts the mill. Knock ' + itemName(set.prize) + ' off the hook.'
        : 'Drop a practice marble. Knock ' + itemName(set.prize) + ' off the hook.',
      ...built,
    };
    seatHopper(s);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    if (s.result) return;
    if (s.won) {
      if (s.prizeSpot) s.prizeSpot.flash = Math.max(0, (s.prizeSpot.flash || 0) - dt);
      for (const f of s.fly) f.t += dt;
      s.fly = s.fly.filter(f => f.t < f.dur);
      if (s.t - (s.wonAt || s.t) > 0.7) finishWin(s);
      return;
    }
    if (s.mode === 'live') {
      s.clock = Math.max(0, (s.clock ?? s.clockMax) - dt);
      if (s.clock <= 0) drain(s, alleyPlay
        ? 'Time. Another penny for another marble.'
        : 'Time. Aim the hopper again.');
    }
    for (const peg of s.pegs) {
      peg.cool = Math.max(0, peg.cool - dt);
      peg.flash = Math.max(0, peg.flash - dt);
    }
    if (s.prizeSpot) {
      s.prizeSpot.cool = Math.max(0, s.prizeSpot.cool - dt);
      s.prizeSpot.flash = Math.max(0, (s.prizeSpot.flash || 0) - dt);
    }
    const tilt = (s.right || input.actions.has('right') || input.keys.has('ArrowRight') ? 1 : 0)
      - (s.left || input.actions.has('left') || input.keys.has('ArrowLeft') ? 1 : 0);
    const holdDrop = s.pointerDrop || input.actions.has('drop') || input.keys.has(' ');
    if (s.mode === 'hopper') {
      s.aim = clamp(s.aim + tilt * 220 * dt, s.walls.l + 18, s.walls.r - 18);
      if (holdDrop) beginCharge(s);
      if (s.charging) {
        if (holdDrop && !s.pointerDrop) s.charge = clamp(s.charge + dt * 1.35, 0, 1);
      }
      if (s.charging && !holdDrop) releaseMarble(s);
    } else if (s.mode === 'dead') {
      if (s.t - s.deadAt > 0.7) seatHopper(s);
    }
    const wantFlip = s.gateSign;
    const steps = 5;
    for (let n = 0; n < steps; n++) {
      const h = dt / steps;
      for (const g of s.gates) {
        const target = gateTarget(g, wantFlip);
        const change = clamp(target - g.a, -14 * h, 14 * h);
        g.w = change / h;
        g.a += change;
      }
      if (s.mode !== 'live' || !s.ball) continue;
      const p = s.ball;
      const hunger = 1 + s.level * 0.04;
      p.vy += (s.set.g || 240) * hunger * h;
      p.vx += tilt * 340 * h;
      p.vx *= Math.exp(-0.14 * h);
      p.x += p.vx * h; p.y += p.vy * h;
      if (p.x < s.walls.l + R) { p.x = s.walls.l + R; p.vx = Math.abs(p.vx) * 0.72; }
      if (p.x > s.walls.r - R) { p.x = s.walls.r - R; p.vx = -Math.abs(p.vx) * 0.72; }
      for (const peg of s.pegs) {
        if (bounceCircle(p, peg, peg.r, 210 + s.combo * 6)) {
          if (peg.cool === 0) {
            peg.cool = 0.1; peg.flash = 0.16; s.combo++;
          }
        }
      }
      for (const g of s.gates) {
        const seg = gateTips(g);
        const slap = Math.abs(g.w) > 1.6 ? 1.92 : 1.28;
        if (collide(p, seg.a, seg.b, 11, g.w, {x: g.x, y: g.y}, slap)) {
          if (Math.abs(g.w) > 1.6) { p.vy -= 220; s.combo++; }
        }
      }
      if (s.prizeSpot && s.prizeSpot.cool === 0 && bounceCircle(p, s.prizeSpot, s.prizeSpot.r, 380)) {
        s.prizeSpot.cool = 0.4;
        s.prizeSpot.flash = 0.4;
        s.combo++;
        if (!s.prizeOut) {
          s.fly.push({id: s.prize, x: s.prizeSpot.x, y: s.prizeSpot.y, t: 0, dur: 0.65, prize: true});
          claimPrize(s);
        }
      }
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > MAX) { p.vx *= MAX / speed; p.vy *= MAX / speed; }
      if (p.y > 1140) drain(s);
      else if (p.y > 1028 && p.x > s.outL && p.x < s.outR) drain(s);
    }
    if (s.mode === 'live' && s.ball) {
      s.trail.push({x: s.ball.x, y: s.ball.y});
      if (s.trail.length > 18) s.trail.shift();
      const pos = s.stuckPos || {x: s.ball.x, y: s.ball.y, t: s.t};
      if (Math.hypot(s.ball.x - pos.x, s.ball.y - pos.y) > 16) s.stuckPos = {x: s.ball.x, y: s.ball.y, t: s.t};
      else if (s.t - pos.t > 1.25) {
        if (s.ball.y > 960) drain(s, alleyPlay
          ? 'Caught in the bins. Another penny for another marble.'
          : 'Caught in the bins. Aim the hopper again.');
        else {
          s.ball.vx += (s.prizeSpot.x - s.ball.x) * 0.35;
          s.ball.vy = -240;
          s.stuckPos = {x: s.ball.x, y: s.ball.y, t: s.t};
        }
      }
    }
    for (const f of s.fly) f.t += dt;
    s.fly = s.fly.filter(f => f.t < f.dur);
  },
  pointer(s, type, p) {
    if (s.result || s.won) return;
    if (type === 'down') {
      if (s.mode === 'hopper' && p.y < 470) {
        s.aim = clamp(p.x, s.walls.l + 18, s.walls.r - 18);
        s.pointerDrop = true;
        beginCharge(s);
        s.charge = clamp((p.y - 360) / 80, 0.08, 1);
      } else if (s.mode === 'hopper') {
        s.aim = clamp(p.x, s.walls.l + 18, s.walls.r - 18);
        s.pointerDrop = true;
        beginCharge(s);
      } else if (p.y > 860 && p.x > 360 && p.x < 540) {
        s.gateSign *= -1;
        s.note = s.gateSign > 0 ? 'Gates lean toward the bins.' : 'Gates kick toward the walls.';
      } else if (p.x < 450) s.left = true;
      else s.right = true;
    }
    if (type === 'move') {
      if (s.mode === 'hopper' && !s.ball) s.aim = clamp(p.x, s.walls.l + 18, s.walls.r - 18);
      if (s.pointerDrop && s.mode === 'hopper') s.charge = clamp((p.y - 360) / 80, 0.08, 1);
    }
    if (type === 'up' || type === 'cancel') {
      if (s.pointerDrop) { s.pointerDrop = false; releaseMarble(s); }
      s.left = false; s.right = false;
    }
  },
  action(s, id, down) {
    if (s.result || s.won) return;
    if (id === 'left') s.left = !!down;
    if (id === 'right') s.right = !!down;
    if (id === 'gate' && down !== false) {
      s.gateSign *= -1;
      s.note = s.gateSign > 0 ? 'Gates lean toward the bins.' : 'Gates kick toward the walls.';
    }
    if (id === 'drop') {
      if (down) beginCharge(s);
      else releaseMarble(s);
    }
  },
  key(s, k, down) {
    if (s.result || s.won) return;
    if ((k === 'ArrowLeft' || k === 'z' || k === 'Z') && !down) s.left = false;
    if ((k === 'ArrowRight' || k === 'x' || k === 'X') && !down) s.right = false;
    if ((k === 'ArrowUp' || k === 'w' || k === 'W') && down) {
      s.gateSign *= -1;
      s.note = s.gateSign > 0 ? 'Gates lean toward the bins.' : 'Gates kick toward the walls.';
    }
    if (k === ' ') {
      if (down) beginCharge(s);
      else releaseMarble(s);
    }
  },
  draw(s, d, _t, input) {
    const set = s.set || SETS[s.level] || SETS[0];
    const leftOn = s.left || input?.keys?.has('ArrowLeft') || input?.actions?.has('left');
    const rightOn = s.right || input?.keys?.has('ArrowRight') || input?.actions?.has('right');
    d.text('PEGGY’S', 450, 58, 14, '#e8c878');
    d.text('MARBLE MILL', 450, 92, 28, '#fff3d0');
    d.text((s.drops ? String(s.drops).padStart(2, '0') : '00') + ' drops', 450, 122, 16, '#f0d49a');
    const remain = Math.ceil(Math.max(0, s.mode === 'live' ? s.clock : (s.clockMax || CLOCK)));
    d.text(remain + 's', 620, 128, 16, remain <= 8 && s.mode === 'live' ? '#f0a070' : '#ead6a4');
    d.line({x: s.walls.l, y: 390}, {x: s.walls.l, y: 1030}, '#8a7652', 13);
    d.line({x: s.walls.l - 2, y: 390}, {x: s.walls.l - 2, y: 1030}, '#e6c690', 3);
    d.line({x: s.walls.r, y: 390}, {x: s.walls.r, y: 1030}, '#8a7652', 13);
    d.line({x: s.walls.r + 2, y: 390}, {x: s.walls.r + 2, y: 1030}, '#e6c690', 3);
    const shutter = s.mode === 'hopper' ? s.charge * 28 : 0;
    d.poly([[s.aim - 22, 368 + shutter], [s.aim + 22, 368 + shutter], [s.aim + 16, 392 + shutter], [s.aim - 16, 392 + shutter]], '#6a3a28ee', '#e6c57a', 2);
    for (const peg of s.pegs) {
      if (peg.flash > 0) d.glow(peg.x, peg.y, 28, '#f0d49a');
      d.ellipse(peg.x + 3, peg.y + 5, 11, 7, '#203f3c55');
      d.circle(peg.x, peg.y, peg.r + 1, peg.flash > 0 ? '#f0d080' : set.peg, '#f0d6a0', 2);
    }
    if (s.prizeSpot) {
      const ps = s.prizeSpot;
      if (ps.flash > 0) d.glow(ps.x, ps.y, 78, '#f0d49a');
      d.circle(ps.x, ps.y, ps.r + 5, s.prizeOut ? '#2a242888' : '#6a3a28ee', '#f0d6a0', 3);
      d.item(spriteKey(set.prize), ps.x, ps.y, {
        w: s.prizeOut ? 32 : Math.min(52, ps.r * 1.6), alpha: s.prizeOut ? 0.32 : 1,
        fallback: () => d.star(ps.x, ps.y, 16, '#f4e2a8'),
      });
      if (!s.prizeOut) d.text('hit', ps.x, ps.y + ps.r + 16, 11, '#f0d6a8');
    }
    for (const g of s.gates) {
      const seg = gateTips(g);
      d.line(seg.a, seg.b, Math.abs(g.w) > 1 ? '#f0d080' : set.bat, 14);
      d.circle(g.x, g.y, 11, '#9b8057', '#f0d4a0', 2);
    }
    for (let i = 0; i < 3; i++) {
      const x = 290 + i * 160;
      d.item(spriteKey('lucky-dish'), x, 1072, {
        w: 110,
        fallback: () => {
          d.poly([[x - 66, 1032], [x - 48, 1110], [x + 48, 1110], [x + 66, 1032]], COLORS[i], '#e9d1a2', 3);
          d.ellipse(x, 1032, 66, 14, '#315956', '#e9d1a2', 3);
        },
      });
      d.item(spriteKey(SEALS[i]), x, 1060, {
        w: 32, shadow: false,
        fallback: () => d.star(x, 1060, 10, '#f9edca'),
      });
    }
    d.path(s.trail, '#e6e2cc66', 3);
    const seal = sealOf(s);
    const color = COLORS[(s.drops || 0) % COLORS.length];
    if (s.ball) {
      d.item(spriteKey(seal), s.ball.x, s.ball.y, {
        w: 28,
        fallback: () => d.ball(s.ball.x, s.ball.y, R, color),
      });
    } else if (s.mode === 'hopper' && !s.won) {
      const y = 392 + (s.charging ? s.charge * 28 : 0);
      d.item(spriteKey(seal), s.aim, y, {
        w: 32,
        fallback: () => d.ball(s.aim, y, 14, color),
      });
      d.text('↓', s.aim, y - 28, 22, '#fff6d8');
    }
    d.circle(210, 1146, 16, leftOn ? '#f0d080' : '#6a3a48', '#ead6a4', 2);
    d.circle(450, 1148, 14, s.gateSign < 0 ? '#f0d080' : '#3a2a2288', '#c4a46a66', 1);
    d.circle(690, 1146, 16, rightOn ? '#f0d080' : '#6a3a48', '#ead6a4', 2);
    d.text('←', 210, 1152, 12, '#fff6d8');
    d.text('↑', 450, 1152, 12, '#fff6d8');
    d.text('→', 690, 1152, 12, '#fff6d8');
    const n = alleyPlay ? (pocket() ?? 0) : '∞';
    d.item(spriteKey(set.prize), 792, 76, {
      w: 36, alpha: s.prizeOut ? 0.4 : 1,
      fallback: () => d.star(792, 76, 12, '#f4e2a8'),
    });
    for (const f of s.fly) {
      const u = Math.min(1, f.t / f.dur), e = 1 - (1 - u) * (1 - u);
      d.item(spriteKey(f.id), f.x + (792 - f.x) * e, f.y + (76 - f.y) * e, {
        w: 28 * (1 - u * 0.35),
        fallback: () => d.star(f.x + (792 - f.x) * e, f.y + (76 - f.y) * e, 10, '#f4e2a8'),
      });
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = alleyPlay
      ? ((n == null ? '0' : n) + (n === 1 ? ' penny' : ' pennies'))
      : 'practice';
    const mode = s.mode === 'live' ? 'marble in the mill'
      : s.mode === 'hopper' ? (s.charging ? 'shutter drawn' : 'aim the hopper')
        : 'in the bins';
    const clock = s.mode === 'live' ? Math.ceil(Math.max(0, s.clock)) + 's' : 'clock ready';
    return purse + ' · ' + clock + ' · ' + (s.prizeOut ? 'prize kept' : 'hit the prize') + ' · ' + mode + ' · ' + s.note;
  },
};
