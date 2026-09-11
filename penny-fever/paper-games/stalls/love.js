import {clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep} from '../wallet.js?v=heartstrings-1';

const PIVOT = {x: 450, y: 258};
const LEN = 300;
const CLOCK = 48;
const HEART_R = 20;
const PULL = 1.14;
const BALLS = ['pressed-heart', 'heart-biscuit', 'rose-penny'];
const SETS = [
  {prize: 'rose-hair-bow', felt: '#3a2430cc', wood: '#5a3a38', ribbon: '#e8b8c4', bat: '#f0c4cc', lid: false, wind: 0, drift: 36, bob: 10, catch: 58},
  {prize: 'rose-press', felt: '#2a2438cc', wood: '#4a3228', ribbon: '#e0b070', bat: '#f0d0a0', lid: false, wind: 22, drift: 54, bob: 16, catch: 50},
  {prize: 'rose-lockbox', felt: '#241820cc', wood: '#3a2a22', ribbon: '#d4a090', bat: '#e8c4b0', lid: false, wind: 40, drift: 72, bob: 22, catch: 44},
  {prize: 'kindness-heart', felt: '#1c1828ee', wood: '#3a1c18', ribbon: '#c89090', bat: '#e0b0a8', lid: true, wind: 52, drift: 88, bob: 28, catch: 38},
  {prize: 'friendship-pins', felt: '#18141cee', wood: '#2a1814', ribbon: '#b09088', bat: '#d4b0a8', lid: true, wind: 68, drift: 108, bob: 34, catch: 34},
  {prize: 'ribbon-gift-box', felt: '#141018ee', wood: '#241414', ribbon: '#d4a0a8', bat: '#e8b8c0', lid: true, wind: 84, drift: 128, bob: 40, catch: 30},
];
const SPRITES = ['pressed-heart', 'heart-biscuit', 'rose-penny', 'rose-lockbox', 'rose-hair-bow',
  'rose-press', 'kindness-heart', 'friendship-pins', 'ribbon-gift-box', 'penny-purse', 'everyday-penny'];

function chapterPrize(s) {
  return SETS[s.level]?.prize || null;
}
function heartId(s) {
  return BALLS[s.level % BALLS.length];
}
function nest(s) {
  const set = s.set || SETS[s.level] || SETS[0];
  const speed = 0.62 + s.level * 0.11;
  const lidShut = set.lid && Math.sin(s.t * (1.35 + s.level * 0.16)) <= (s.level >= 5 ? 0.22 : -0.02);
  return {
    x: 450 + Math.sin(s.t * speed) * set.drift,
    y: 798 - Math.sin(s.t * speed * 0.72) * set.bob,
    r: set.catch,
    open: !lidShut,
  };
}
function place(s) {
  s.x = PIVOT.x + Math.sin(s.angle) * LEN;
  s.y = PIVOT.y + Math.cos(s.angle) * LEN;
}
function seatIdle(s) {
  s.mode = 'idle';
  s.attached = true;
  s.charging = false;
  s.charge = 0;
  s.pointerThread = false;
  s.angle = -0.16;
  s.omega = 0;
  s.vx = 0;
  s.vy = 0;
  s.trail = [];
  s.wait = 0;
  s.stuck = 0;
  place(s);
}
function canAfford() {
  if (!alleyPlay) return true;
  return (pocket() || 0) >= 1;
}
function beginThread(s) {
  if (s.mode !== 'idle' || s.charging || s.won) return;
  if (!canAfford()) {
    s.note = alleyPlay
      ? 'Need a penny to thread the ribbon. Cash a booth ticket for a five-penny stack.'
      : 'The practice ribbon is spent.';
    return;
  }
  s.charging = true;
  s.charge = 0.02;
}
function releaseThread(s) {
  if (s.mode !== 'idle' || !s.charging) { s.charging = false; return; }
  const power = s.charge;
  s.charging = false;
  s.charge = 0;
  s.pointerThread = false;
  if (power < 0.1) {
    s.angle = -0.16;
    place(s);
    s.note = 'A timid thread. Draw the ribbon further back.';
    return;
  }
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny to thread the ribbon. Cash a booth ticket for a five-penny stack.';
      s.angle = -0.16;
      place(s);
      return;
    }
  }
  s.mode = 'live';
  s.attached = true;
  s.clock = s.clockMax || CLOCK;
  s.hearts++;
  s.omega = 0.55 + power * 1.55;
  s.note = power > 0.72 ? 'A strong thread. Lean, then let go.' : 'The heart is live. Pump the swing, then let go.';
}
function letGo(s) {
  if (s.won || s.mode !== 'live' || !s.attached || s.wait) return;
  s.attached = false;
  s.vx = Math.cos(s.angle) * LEN * s.omega;
  s.vy = -Math.sin(s.angle) * LEN * s.omega;
  s.shots++;
  s.trail = [];
  s.note = 'A little leap — nudge it if the lockbox drifts.';
}
function rewind(s, why) {
  s.attached = true;
  s.wait = 0;
  s.vx = 0;
  s.vy = 0;
  s.trail = [];
  s.stuck = 0;
  if (Math.abs(s.omega) < 0.35) s.omega = (s.angle < 0 ? 0.7 : -0.7);
  place(s);
  s.note = why || 'The ribbon caught you. Lean and let go again — the clock is still running.';
}
function drain(s) {
  s.mode = 'dead';
  s.deadAt = s.t;
  s.charging = false;
  s.charge = 0;
  s.attached = true;
  s.vx = 0;
  s.vy = 0;
  s.note = alleyPlay
    ? 'The ribbon went still. Another penny to thread another heart.'
    : 'Time. Thread the ribbon again.';
}
function fly(s, id, x, y) {
  s.fly.push({id, x, y, t: 0, dur: 0.7});
}
function claim(s) {
  if (s.won || s.prizeOut) return;
  const prize = chapterPrize(s);
  if (!prize) return;
  s.prizeOut = true;
  s.won = true;
  s.mode = 'won';
  s.settle = 0.7;
  s.attached = false;
  s.vx = 0;
  s.vy = 0;
  s.x = s.box.x;
  s.y = s.box.y;
  s.note = itemName(prize) + ' — you knocked it off the lockbox!';
  if (alleyPlay) keep(prize, 'love');
  fly(s, prize, s.x, s.y);
}

export default {
  title: 'Heartstrings',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: alleyPlay
    ? 'Rosalie’s tiny theatre. Six valentine cabinets. A penny threads the ribbon. The heart is live on a clock — lean to pump the swing, let go into the lockbox, nudge in the air. Hit this chapter’s keepsake hanging on the lockbox to keep it. Time or a still ribbon, and another penny threads another heart.'
    : 'Workshop ribbon. Thread the heart, lean to pump, let go, nudge in the air. Hit the hanging prize.',
  instructions: alleyPlay
    ? 'Hold Thread and release (one penny). Z / X or the sides of the carpet lean the swing; in the air they still nudge. Let go, or tap the stage, to send the heart. A clock runs while it is live. Hit the prize on the lockbox to stamp it. Later cabinets shut their mouths — wait for a yawn. Cash a booth ticket for a five-penny stack.'
    : 'Hold Thread. Z and X lean. Let go into the lockbox. Hit the hanging prize.',
  liveTitle: 'Heartstrings',
  liveDetail: alleyPlay
    ? 'A penny threads the ribbon. Hit the prize hanging on the lockbox. The clock is running.'
    : 'Thread the ribbon. Hit the prize. Lean, let go, nudge.',
  liveButton: 'Step up to the ribbon',
  tableDetail: alleyPlay
    ? 'A penny threads the ribbon. Hit this cabinet’s prize on the lockbox to keep it. Time runs out — another penny for another heart. Lean, let go, and nudge in the air.'
    : 'Hit the hanging prize. Lean, let go, nudge.',
  levels: ['First flutter', 'A change of heart', 'Hearts on the breeze', 'The restless lockbox', 'A hurried valentine', 'A gale of valentines'],
  sprites: SPRITES,
  prizes: SETS.map(t => t.prize),
  actions: [
    {id: 'left', label: 'Lean left · Z', hold: true},
    {id: 'thread', label: alleyPlay ? 'Thread · 1 penny' : 'Thread the ribbon', hold: true},
    {id: 'release', label: 'Let go'},
    {id: 'right', label: 'Lean right · X', hold: true},
  ],
  create(level) {
    const set = SETS[level] || SETS[0];
    const s = {
      level, t: 0, set, mode: 'idle', charge: 0, charging: false, pointerThread: false,
      left: false, right: false, attached: true, angle: -0.16, omega: 0,
      x: 0, y: 0, vx: 0, vy: 0, trail: [], fly: [], wait: 0, stuck: 0,
      hearts: 0, shots: 0, score: 0, won: false, prizeOut: false, settle: 0,
      clockMax: Math.max(28, CLOCK - level * 3), clock: Math.max(28, CLOCK - level * 3),
      box: {x: 450, y: 798, r: set.catch, open: true},
      note: alleyPlay
        ? 'A penny threads the ribbon. Hit the prize on the lockbox to keep it.'
        : 'Thread the ribbon. Hit the prize.',
    };
    seatIdle(s);
    s.box = nest(s);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    s.box = nest(s);
    if (s.mode === 'won') {
      s.x = s.box.x;
      s.y = s.box.y;
      for (const f of s.fly) f.t += dt;
      s.fly = s.fly.filter(f => f.t < f.dur);
      s.settle = Math.max(0, (s.settle || 0) - dt);
      if (s.settle <= 0 && !s.result) {
        const prize = chapterPrize(s);
        done(s, 'A little leap of faith',
          itemName(prize) + ' flies into the treasure book. Rosalie would call that a connection.',
          {prize, won: true});
      }
      return;
    }
    if (s.mode === 'live') {
      s.clock = Math.max(0, (s.clock ?? s.clockMax) - dt);
      if (s.clock <= 0) drain(s);
    }
    const wantL = s.left || input.actions.has('left') || input.keys.has('z') || input.keys.has('Z') || input.keys.has('ArrowLeft');
    const wantR = s.right || input.actions.has('right') || input.keys.has('x') || input.keys.has('X') || input.keys.has('ArrowRight');
    const holdThread = s.pointerThread || input.actions.has('thread') || input.keys.has(' ');
    if (s.mode === 'idle') {
      if (holdThread) beginThread(s);
      if (s.charging) {
        if (holdThread && !s.pointerThread) s.charge = clamp(s.charge + dt * 1.28, 0, 1);
        s.angle = -0.18 - s.charge * PULL;
        s.omega = 0;
        place(s);
      }
      if (s.charging && !holdThread) releaseThread(s);
    } else if (s.mode === 'dead') {
      if (s.t - s.deadAt > 0.8) seatIdle(s);
    }
    if (s.mode !== 'live') {
      for (const f of s.fly) f.t += dt;
      s.fly = s.fly.filter(f => f.t < f.dur);
      return;
    }
    if (s.wait) {
      s.wait -= dt;
      if (s.wait <= 0) rewind(s);
      return;
    }
    const pump = (wantR ? 1 : 0) - (wantL ? 1 : 0);
    if (s.attached) {
      s.omega += (-2.2 * Math.sin(s.angle) + pump * 0.82) * dt;
      s.omega *= Math.exp(-0.008 * dt);
      s.omega = clamp(s.omega, -2.45, 2.45);
      s.angle += s.omega * dt;
      place(s);
      if (Math.abs(s.omega) < 0.05 && Math.abs(s.angle) < 0.1) {
        s.stuck += dt;
        if (s.stuck > 1.15) {
          s.omega += s.angle <= 0 ? 0.85 : -0.85;
          s.stuck = 0;
        }
      } else s.stuck = 0;
    } else {
      const set = s.set || SETS[s.level] || SETS[0];
      s.vx += Math.sin(s.t * 0.9) * set.wind * dt;
      s.vx += pump * 210 * dt;
      s.vy += 460 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.trail.push({x: s.x, y: s.y});
      if (s.trail.length > 22) s.trail.shift();
      const box = s.box;
      const reach = Math.hypot(s.x - box.x, s.y - box.y);
      if (reach < box.r) {
        if (box.open) {
          s.score += 2500;
          claim(s);
          return;
        }
        if (s.vy > 0) {
          s.vy = -Math.abs(s.vy) * 0.42;
          s.vx += (s.x < box.x ? -90 : 90);
          s.note = 'The lockbox closed its mouth. Wait for a yawn.';
        }
      } else if (s.y > 1108 || s.x < 118 || s.x > 782) {
        s.score += 40;
        s.wait = 0.35;
        s.note = 'The ribbon caught you. Try letting go a little earlier or later.';
      }
    }
    for (const f of s.fly) f.t += dt;
    s.fly = s.fly.filter(f => f.t < f.dur);
  },
  pointer(s, type, p) {
    if (type === 'down') {
      if (s.mode === 'idle') {
        s.pointerThread = true;
        beginThread(s);
        s.charge = clamp((p.y - (PIVOT.y + LEN - 20)) / 130, 0.05, 1);
      } else if (s.mode === 'live' && s.attached) {
        if (p.y > 1110) {
          if (p.x < 380) s.left = true;
          else if (p.x > 520) s.right = true;
        } else letGo(s);
      } else if (s.mode === 'live') {
        if (p.x < 450) s.left = true;
        else s.right = true;
      }
    }
    if (type === 'move' && s.pointerThread && s.mode === 'idle') {
      s.charge = clamp((p.y - (PIVOT.y + LEN - 20)) / 130, 0.05, 1);
    }
    if (type === 'up' || type === 'cancel') {
      if (s.pointerThread) { s.pointerThread = false; releaseThread(s); }
      s.left = false;
      s.right = false;
    }
  },
  action(s, id, down) {
    if (id === 'left') s.left = !!down;
    if (id === 'right') s.right = !!down;
    if (id === 'thread') {
      if (down) beginThread(s);
      else releaseThread(s);
    }
    if (id === 'release' && down) letGo(s);
  },
  key(s, k, down) {
    if ((k === 'z' || k === 'Z' || k === 'ArrowLeft') && !down) s.left = false;
    if ((k === 'x' || k === 'X' || k === 'ArrowRight') && !down) s.right = false;
    if (k === ' ') {
      if (s.mode === 'idle') {
        if (down) beginThread(s);
        else releaseThread(s);
      } else if (down) letGo(s);
    }
    if (down && (k === 'Enter' || k === 'r' || k === 'R')) letGo(s);
  },
  draw(s, d, _t, input) {
    const set = s.set || SETS[s.level] || SETS[0];
    const leftOn = s.left || input?.keys?.has('z') || input?.keys?.has('Z') || input?.keys?.has('ArrowLeft') || input?.actions?.has('left');
    const rightOn = s.right || input?.keys?.has('x') || input?.keys?.has('X') || input?.keys?.has('ArrowRight') || input?.actions?.has('right');
    const threadOn = s.charging || input?.actions?.has('thread') || (s.mode === 'idle' && input?.keys?.has(' '));
    d.poly([[70, 36], [300, 36], [300, 118], [70, 118]], '#161022cc', '#e6c57a', 2);
    d.text('HEARTSTRINGS', 185, 68, 16, '#fff3d0');
    d.text(String(s.score).padStart(6, '0'), 185, 96, 16, '#f0d49a');
    d.arc(PIVOT.x, PIVOT.y + 8, 168, Math.PI, 0, '#e7b482', 7);
    d.ring(PIVOT.x, PIVOT.y, 12, '#e7b482', 3);
    if (s.attached) {
      d.line(PIVOT, {x: s.x, y: s.y}, '#6d4356', 6);
      d.line({x: PIVOT.x - 2, y: PIVOT.y}, {x: s.x - 2, y: s.y}, set.ribbon, 3);
      if (s.mode === 'live') {
        let x = s.x, y = s.y, vx = Math.cos(s.angle) * LEN * s.omega, vy = -Math.sin(s.angle) * LEN * s.omega;
        for (let i = 0; i < 16; i++) {
          vy += 460 * 0.032;
          x += vx * 0.032;
          y += vy * 0.032;
          d.circle(x, y, 2.2, '#f7e3b894');
        }
      }
    }
    d.path(s.trail, '#f7ccbf88', 4);
    const box = s.box;
    if (box.open) d.glow(box.x, box.y, 70, '#ffdca5');
    d.item(spriteKey('rose-lockbox'), box.x, box.y + 8, {
      w: 78, alpha: box.open ? 1 : 0.55,
      fallback: () => d.poly([[box.x - 50, box.y], [box.x - 34, box.y + 40], [box.x + 34, box.y + 40], [box.x + 50, box.y]], '#b77774', '#edc993', 3),
    });
    d.item(spriteKey(set.prize), box.x, box.y - 18, {
      w: s.prizeOut ? 28 : 44, alpha: s.prizeOut ? 0.3 : (box.open ? 1 : 0.4),
      fallback: () => d.heart(box.x, box.y - 18, 16, '#c95c79'),
    });
    if (!s.prizeOut) d.text(box.open ? 'hit' : 'shut', box.x, box.y + 52, 12, box.open ? '#f0d6a8' : '#c4a0a8');
    d.item(spriteKey(heartId(s)), s.x, s.y, {
      w: 52, angle: s.attached ? s.angle : Math.atan2(s.vy, s.vx) + Math.PI / 2,
      fallback: () => d.heart(s.x, s.y, 22, '#c95c79'),
    });
    d.poly([[118, 1120], [782, 1120], [798, 1172], [102, 1172]], '#2a1c16ee', '#e6c57a', 2);
    d.circle(210, 1146, 16, leftOn ? '#f0d080' : '#6a3a48', '#ead6a4', 2);
    d.circle(450, 1148, 14, threadOn ? '#f0d080' : '#3a2a2288', '#c4a46a66', 1);
    d.circle(690, 1146, 16, rightOn ? '#f0d080' : '#6a3a48', '#ead6a4', 2);
    d.text('Z', 210, 1152, 12, '#fff6d8');
    d.text('X', 690, 1152, 12, '#fff6d8');
    const remain = Math.ceil(Math.max(0, s.mode === 'live' ? s.clock : (s.clockMax || CLOCK)));
    d.text(remain + 's', 620, 128, 16, remain <= 8 && s.mode === 'live' ? '#f0a070' : '#ead6a4');
    const n = alleyPlay ? (pocket() ?? 0) : '∞';
    d.item(spriteKey('penny-purse'), 86, 64, {w: 72, fallback: () => d.heart(86, 64, 22, '#6a7a52')});
    d.text(String(n), 86, 108, 18, '#fff6d8');
    d.poly([[760, 44], [828, 48], [824, 108], [756, 104]], '#6b3a3a', '#e8d4a0', 2);
    d.item(spriteKey(set.prize), 792, 76, {w: 36, fallback: () => d.heart(792, 76, 12, '#f4e2a8')});
    for (const f of s.fly) {
      const u = Math.min(1, f.t / f.dur), e = 1 - (1 - u) * (1 - u);
      d.item(spriteKey(f.id), f.x + (792 - f.x) * e, f.y + (76 - f.y) * e, {
        w: 28 * (1 - u * 0.35),
        fallback: () => d.heart(f.x + (792 - f.x) * e, f.y + (76 - f.y) * e, 10, '#c95c79'),
      });
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice ribbon' : n + (n === 1 ? ' penny' : ' pennies');
    const mode = s.mode === 'live'
      ? (s.attached ? (s.charging ? 'ribbon drawn' : 'swinging') : 'in the air')
      : s.mode === 'idle' ? (s.charging ? 'ribbon drawn' : 'thread the ribbon')
        : s.mode === 'won' ? 'prize kept' : 'still';
    const clock = s.mode === 'live' ? Math.ceil(Math.max(0, s.clock)) + 's' : 'clock ready';
    return purse + ' · ' + clock + ' · ' + s.score + ' · ' + (s.prizeOut ? 'prize kept' : 'hit the prize') + ' · ' + mode + ' · ' + s.note;
  },
};
