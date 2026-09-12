import {clamp, dist, done, TAU} from '../draw.js?v=ink-1';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, owned} from '../wallet.js?v=dot-moon-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const CX = 450;
const CY = 640;
const CLOCK = 48;
const NEEDLE = {x: 792, y: 1008, pull: 56};
const PATCHES = ['moon-penny', 'rose-penny', 'star-token'];
const COLORS = ['#b7747c', '#85978c', '#b8a079'];
const SETS = [
  {prize: 'perfect-circle', r: 118, clock: 48, need: 0.992, spin: 0, felt: '#3a2a24cc', wood: '#5a3a28', cloth: '#6a3a48'},
  {prize: 'pressed-flower-book', r: 118, clock: 42, need: 0.992, spin: 0.07, felt: '#2a3228cc', wood: '#4a3224', cloth: '#5a4a38'},
  {prize: 'felt-moon-disc', r: 125, clock: 38, need: 0.993, spin: 0.11, felt: '#243038cc', wood: '#3a2a22', cloth: '#4a3a58'},
  {prize: 'spring-seed-packet', r: 126, clock: 34, need: 0.993, spin: 0.15, felt: '#1c2a24cc', wood: '#4a2818', cloth: '#3a5a48'},
  {prize: 'garden-party-book', r: 134, clock: 30, need: 0.994, spin: 0.2, felt: '#241820cc', wood: '#3a1c18', cloth: '#6a3a38'},
  {prize: 'charm-display-case', r: 130, clock: 26, need: 0.994, spin: 0.26, felt: '#141820ee', wood: '#2a1814', cloth: '#4a2a48'},
];
const SHAPES = [
  () => 134,
  a => 1 / Math.sqrt(Math.cos(a) ** 2 / 156 ** 2 + Math.sin(a) ** 2 / 118 ** 2),
  a => 126 + 13 * Math.cos(5 * a),
  a => 124 + 16 * Math.cos(6 * a),
  a => 148 / (Math.abs(Math.cos(a)) + Math.abs(Math.sin(a))),
  a => 1 / Math.sqrt(Math.cos(a) ** 2 / 140 ** 2 + Math.sin(a) ** 2 / 105 ** 2) + 18 * Math.cos(a - .5),
];
const SPRITES = ['moon-penny', 'rose-penny', 'star-token', 'perfect-circle', 'pressed-flower-book',
  'lucky-dish', 'spring-seed-packet', 'garden-party-book', 'charm-display-case', 'penny-purse'];

function radius(level, a) {
  return (SHAPES[level] || SHAPES[0])(a);
}
function sampleMoon(level) {
  const samples = [];
  for (let y = 500; y <= 780; y += 8) for (let x = 280; x <= 620; x += 8) {
    const a = Math.atan2(y - CY, x - CX);
    if (Math.hypot(x - CX, y - CY) <= radius(level, a)) samples.push({x: x - CX, y: y - CY});
  }
  for (let i = 0; i < 360; i++) {
    const a = i * TAU / 360, r = radius(level, a);
    samples.push({x: Math.cos(a) * r, y: Math.sin(a) * r});
  }
  return samples;
}
function world(p, spin) {
  const c = Math.cos(spin), n = Math.sin(spin);
  return {x: CX + p.x * c - p.y * n, y: CY + p.x * n + p.y * c};
}
function evaluate(s) {
  const spin = s.spin || 0;
  s.uncovered = s.samples.filter(p => {
    const q = world(p, spin);
    return !s.discs.some(c => dist(c, q) <= c.r + 1.25);
  });
  s.coverage = s.samples.length ? 1 - s.uncovered.length / s.samples.length : 0;
}
function chapterPrize(s) {
  return SETS[s.level]?.prize || null;
}
function canAfford(s) {
  if (!alleyPlay) return s.ammo > 0;
  return (pocket() || 0) >= 1;
}
function seatIdle(s) {
  s.mode = 'idle';
  s.charge = 0;
  s.charging = false;
  s.pointerThread = false;
  s.clock = s.clockMax;
}
function beginThread(s) {
  if (s.won || s.mode !== 'idle' || s.charging) return;
  if (!canAfford(s)) {
    s.note = alleyPlay
      ? 'Need a penny to thread the needle. Cash a booth ticket for a five-penny stack.'
      : 'Practice threads are spent.';
    return;
  }
  s.charging = true;
  s.charge = 0.12;
}
function releaseThread(s) {
  if (s.mode !== 'idle' || !s.charging) { s.charging = false; return; }
  const power = s.charge;
  s.charging = false;
  s.charge = 0;
  if (power < 0.1) {
    s.note = 'A timid thread. Draw the needle a little further.';
    return;
  }
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny to thread the needle. Cash a booth ticket for a five-penny stack.';
      return;
    }
  } else s.ammo--;
  s.mode = 'live';
  s.clock = s.clockMax;
  s.sessions++;
  evaluate(s);
  s.note = power > 0.72
    ? 'A firm stitch started. Pin the scraps before the moonlight turns.'
    : 'The needle is in. Cover every glimmer, then stitch.';
}
function drain(s) {
  s.mode = 'dead';
  s.deadAt = s.t;
  s.charging = false;
  s.charge = 0;
  s.drag = false;
  s.note = alleyPlay
    ? 'The moonlight slipped. Another penny to thread again — your scraps stay put.'
    : (s.ammo > 0 ? 'Time. Thread again; the patches keep their places.' : 'Practice threads spent.');
}
function fly(s, id, x, y) {
  s.fly.push({id, x, y, t: 0, dur: 0.7});
}
function claim(s) {
  if (s.won || s.mode !== 'live') {
    if (!s.won && s.mode !== 'live') s.note = 'Thread the needle first. The quilt only takes a stitch while the clock is live.';
    return;
  }
  evaluate(s);
  if (s.coverage < s.need) {
    s.clock = Math.max(0, s.clock - 2.2);
    const left = (100 * (1 - s.coverage)).toFixed(1);
    s.note = 'Still ' + left + '% moonlight. A hasty stitch costs time.';
    if (s.clock <= 0) drain(s);
    return;
  }
  const prize = chapterPrize(s);
  s.won = true;
  s.prizeOut = true;
  s.wonAt = s.t;
  s.drag = false;
  if (prize) {
    if (alleyPlay) keep(prize, 'cover-the-spot');
    takePrize(s, prize);
    fly(s, prize, CX, CY);
    s.note = itemName(prize) + ' — stitched off the hanging quilt!';
  } else s.note = 'Not a glimmer escaped.';
}
function finish(s) {
  const prize = chapterPrize(s);
  done(s, 'Not a glimmer escaped',
    itemName(prize) + ' is stitched into the treasure book.',
    {prize, won: true});
}

export default {
  title: 'Patchwork Moon',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: alleyPlay
    ? 'Dot’s six quilt tables. A penny threads the needle and starts the clock. Cover this moon’s hanging prize with the three catalogue scraps, then stitch before the light turns. Time out, and another penny lets you keep sewing from where you left the patches.'
    : 'Workshop moons. Thread the needle, cover the glimmer, stitch the hanging prize. The clock is practice pressure.',
  instructions: alleyPlay
    ? 'Hold Thread and release (one penny). Drag scraps, Next patch or Z to choose, X to pin a scrap so it stays, arrows to nudge. Stitch (Space) when every glimmer is gone. A hasty stitch costs clock. Later moons turn while you work. Cash a booth ticket for a five-penny stack.'
    : 'Hold Thread. Drag, pin, nudge, then Stitch. Later moons turn.',
  liveTitle: 'Patchwork Moon',
  liveDetail: alleyPlay
    ? 'A penny threads the needle. Cover the moonlight, stitch the hanging prize. The clock is running.'
    : 'Thread the needle. Cover the moonlight. Stitch the prize.',
  liveButton: 'Step up to the quilt',
  tableDetail: alleyPlay
    ? 'A penny threads the needle. Cover this moon and stitch the hanging prize into the book. Time runs out — another penny, same scraps. Walk away whenever you like.'
    : 'Cover the moonlight and stitch. Practice threads only.',
  levels: ['The round moon', 'A stretched moon', 'Five petals turning', 'Six petals in a hurry', 'A diamond that will not sit', 'The offset moon that will not wait'],
  sprites: SPRITES,
  prizes: SETS.map(t => t.prize),
  actions: [
    {id: 'next', label: 'Next patch · Z'},
    {id: 'pin', label: 'Pin / unpin · X'},
    {id: 'thread', label: alleyPlay ? 'Thread · 1 penny' : 'Thread the needle', hold: true},
    {id: 'stitch', label: 'Stitch the quilt · Space'},
  ],
  create(level) {
    const set = SETS[level] || SETS[0];
    const prize = set.prize;
    const discs = PATCHES.map((id, i) => ({
      x: 250 + i * 200, y: 1000, r: set.r, id, pinned: false,
    }));
    const s = {
      level, t: 0, mode: 'idle', charge: 0, charging: false, pointerThread: false,
      selected: 0, drag: false, offset: {x: 0, y: 0}, coverage: 0, uncovered: [],
      sessions: 0, fly: [], spin: 0, won: false, prizeOut: alleyPlay && owned(prize),
      ammo: alleyPlay ? 0 : Math.max(4, 9 - level),
      clockMax: set.clock || Math.max(26, CLOCK - level * 4),
      clock: set.clock || Math.max(26, CLOCK - level * 4),
      need: set.need, spinSpeed: set.spin, prize, set,
      samples: sampleMoon(level), discs,
      note: alleyPlay
        ? 'A penny threads the needle. Cover the moonlight, then stitch the hanging prize.'
        : 'Thread the needle. Cover the moonlight, then stitch.',
    };
    s.clockMax = set.clock;
    s.clock = set.clock;
    evaluate(s);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    for (const f of s.fly) f.t += dt;
    s.fly = s.fly.filter(f => f.t < f.dur);
    if (s.won) {
      if (!s.result && s.t - (s.wonAt || s.t) > 0.55) finish(s);
      return;
    }
    if (s.mode === 'live') {
      s.clock = Math.max(0, (s.clock ?? s.clockMax) - dt);
      if (s.spinSpeed) {
        s.spin += s.spinSpeed * dt;
        evaluate(s);
      }
      if (s.clock <= 0) {
        drain(s);
        s.note = alleyPlay
          ? 'The moon turned past the scraps. Another penny to thread again.'
          : 'Time. Thread the needle again.';
      }
    }
    const holdThread = s.pointerThread || input.actions.has('thread') || input.keys.has('Enter');
    if (s.mode === 'idle') {
      if (holdThread) beginThread(s);
      if (s.charging) {
        if (holdThread && !s.pointerThread) s.charge = clamp(s.charge + dt * 1.35, 0, 1);
      }
      if (s.charging && !holdThread) releaseThread(s);
    } else if (s.mode === 'dead') {
      if (s.t - s.deadAt > 0.8) seatIdle(s);
    }
    if (s.mode !== 'live') return;
    const c = s.discs[s.selected];
    if (c && !c.pinned && !s.drag) {
      const dx = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
      const dy = (input.keys.has('ArrowDown') ? 1 : 0) - (input.keys.has('ArrowUp') ? 1 : 0);
      if (dx || dy) {
        c.x = clamp(c.x + dx * 150 * dt, 190, 710);
        c.y = clamp(c.y + dy * 150 * dt, 360, 1040);
        evaluate(s);
      }
    }
  },
  pointer(s, type, p) {
    if (s.won) return;
    if (type === 'down') {
      if (s.mode === 'idle' && p.x > 700 && p.y > 860) {
        s.pointerThread = true;
        beginThread(s);
        s.charge = clamp((p.y - NEEDLE.y) / NEEDLE.pull, 0.12, 1);
        return;
      }
      if (s.mode === 'live') {
        for (let i = 2; i >= 0; i--) {
          if (dist(p, s.discs[i]) <= s.discs[i].r) {
            s.selected = i;
            if (!s.discs[i].pinned) {
              s.drag = true;
              s.offset = {x: s.discs[i].x - p.x, y: s.discs[i].y - p.y};
            } else s.note = 'That scrap is pinned. Unpin it (X) to move it.';
            break;
          }
        }
      }
    }
    if (type === 'move' && s.pointerThread && s.mode === 'idle') {
      s.charge = clamp((p.y - NEEDLE.y) / NEEDLE.pull, 0.12, 1);
    }
    if (type === 'move' && s.drag && s.mode === 'live') {
      const c = s.discs[s.selected];
      if (c && !c.pinned) {
        c.x = clamp(p.x + s.offset.x, 190, 710);
        c.y = clamp(p.y + s.offset.y, 360, 1040);
        evaluate(s);
      }
    }
    if (type === 'up' || type === 'cancel') {
      if (s.pointerThread) { s.pointerThread = false; releaseThread(s); }
      if (s.drag && type === 'up') evaluate(s);
      s.drag = false;
    }
  },
  action(s, id, down) {
    if (id === 'thread') {
      if (down) beginThread(s);
      else releaseThread(s);
      return;
    }
    if (down === false) return;
    if (id === 'next') s.selected = (s.selected + 1) % 3;
    if (id === 'pin') {
      const c = s.discs[s.selected];
      if (c) {
        c.pinned = !c.pinned;
        if (c.pinned && s.drag && s.selected === s.discs.indexOf(c)) s.drag = false;
        s.note = c.pinned ? 'Pinned. That scrap will not wander.' : 'Unpinned. Drag or nudge it.';
      }
    }
    if (id === 'stitch') claim(s);
  },
  key(s, k, down) {
    if ((k === 'z' || k === 'Z') && down) s.selected = (s.selected + 1) % 3;
    if ((k === 'x' || k === 'X') && down) this.action(s, 'pin', true);
    if (k === 'Enter') {
      if (down) beginThread(s);
      else releaseThread(s);
    }
    if ((k === ' ' || k === 'Spacebar') && down) claim(s);
  },
  draw(s, d) {
    const set = s.set || SETS[s.level] || SETS[0];
    d.text('PATCHWORK MOON', 205, 68, 16, '#fff3d0');
    d.text(Math.floor(s.coverage * 1000) / 10 + '% covered', 205, 96, 16, s.coverage >= s.need ? '#f0d080' : '#f0d49a');

    const edge = Array.from({length: 180}, (_, i) => {
      const a = i * TAU / 180, r = radius(s.level, a);
      return world({x: Math.cos(a) * r, y: Math.sin(a) * r}, s.spin || 0);
    });
    d.path(edge, '#c69d58', 5, true, '#f2d696');
    if (s.prize && !s.prizeOut) {
      d.item(spriteKey(s.prize), CX, CY, {
        w: s.coverage >= s.need ? 52 : 36, alpha: s.mode === 'live' ? 0.55 : 0.28,
        fallback: () => d.star(CX, CY, 16, '#f4e2a8'),
      });
      if (s.coverage >= s.need && s.mode === 'live') d.text('stitch', CX, CY + 28, 12, '#f0d6a8');
    }

    for (const [i, c] of s.discs.entries()) {
      d.circle(c.x + 7, c.y + 10, c.r, '#77595830');
      d.circle(c.x, c.y, c.r, COLORS[i] + '55', '#f4ddba', 3);
      d.item(spriteKey(c.id), c.x, c.y, {
        w: c.r * 1.55, shadow: false,
        fallback: () => {
          d.circle(c.x, c.y, c.r, COLORS[i], '#f4ddba', 3);
          d.circle(c.x, c.y, c.r - 12, null, '#ecd2ad', 1);
          d.text(i + 1, c.x, c.y + 8, 25, '#faeccc');
        },
      });
      if (i === s.selected) d.ring(c.x, c.y, c.r + 5, '#956643', 2);
      if (c.pinned) {
        d.circle(c.x + c.r * 0.62, c.y - c.r * 0.62, 8, '#c45a6a', '#f0d6a0', 2);
        d.line({x: c.x + c.r * 0.62, y: c.y - c.r * 0.62}, {x: c.x + c.r * 0.62 + 6, y: c.y - c.r * 0.62 - 14}, '#ead6a4', 2);
      }
    }
    if (s.mode === 'live') {
      for (let i = 0; i < s.uncovered.length; i += 3) {
        const q = world(s.uncovered[i], s.spin || 0);
        d.circle(q.x, q.y, 2, '#fff7d5');
      }
    }

    const springY = NEEDLE.y + (s.mode === 'idle' ? s.charge * NEEDLE.pull : 0);
    d.poly([[748, 900], [844, 900], [850, 1148], [742, 1148]], '#3a2a22cc', '#d2b07a', 2);
    d.line({x: NEEDLE.x, y: springY + 10}, {x: NEEDLE.x, y: 1128}, '#c5d0d6', 4);
    for (let i = 0; i < 6; i++) {
      const cy = springY + 18 + i * ((1124 - springY - 18) / 6);
      d.line({x: NEEDLE.x - 8, y: cy}, {x: NEEDLE.x + 8, y: cy}, '#d2b07a', 2);
    }
    d.circle(NEEDLE.x, springY + 8, 11, '#8a3030', '#f0d0a8', 2);
    d.text('thread', NEEDLE.x, 1162, 12, '#ead6a4');

    const remain = Math.ceil(Math.max(0, s.mode === 'live' ? s.clock : (s.clockMax || CLOCK)));
    d.text(remain + 's', 620, 128, 16, remain <= 8 && s.mode === 'live' ? '#f0a070' : '#ead6a4');
    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    d.item(spriteKey(set.prize), 792, 76, {
      w: s.prizeOut ? 28 : 36, alpha: s.prizeOut ? 0.4 : 1,
      fallback: () => d.star(792, 76, 12, '#f4e2a8'),
    });
    for (let i = 0; i < SETS.length; i++) {
      const x = 168 + i * 44, y = 154;
      const got = owned(SETS[i].prize) || (s.prizeOut && i === s.level);
      d.item(spriteKey(SETS[i].prize), x, y, {w: 26, fallback: () => d.star(x, y, 9)});
      if (got) d.text('✓', x + 10, y - 8, 12, '#f6e2a2');
    }
    for (const f of s.fly) {
      const u = Math.min(1, f.t / f.dur), e = 1 - (1 - u) * (1 - u);
      d.item(spriteKey(f.id), f.x + (792 - f.x) * e, f.y + (76 - f.y) * e, {
        w: 28 * (1 - u * 0.35),
        fallback: () => d.star(f.x + (792 - f.x) * e, f.y + (76 - f.y) * e, 10, '#f4e2a8'),
      });
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : s.ammo;
    const purse = (n == null ? '0' : n) + (alleyPlay ? (n === 1 ? ' penny' : ' pennies') : ' practice');
    const mode = s.mode === 'live' ? (s.coverage >= s.need ? 'ready to stitch' : 'moonlight still showing')
      : s.mode === 'idle' ? (s.charging ? 'needle drawn' : 'thread the needle')
        : 'the light slipped';
    const clock = s.mode === 'live' ? Math.ceil(Math.max(0, s.clock)) + 's' : 'clock ready';
    const pin = s.discs[s.selected]?.pinned ? 'pinned' : 'patch ' + (s.selected + 1);
    return purse + ' · ' + clock + ' · ' + (Math.floor(s.coverage * 1000) / 10) + '% · '
      + (s.prizeOut ? 'prize kept' : 'stitch the prize') + ' · ' + pin + ' · ' + mode + ' · ' + s.note;
  },
};
