import {clamp, segmentDistance, dist, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, owned} from '../wallet.js?v=booth-play-2';

const HAND = {x: 450, y: 1048};
const BAR = {x: 140, y: 1116, w: 620, h: 36};
const GAP = 46;
const RISE = 70;
const SETS = [
  {prize: 'dairy-calf', hint: 'Dead-centre of the bottom row.', towers: [{x: 450, y: 868, n: 3}]},
  {prize: 'lucky-dish', hint: 'Clip the front-centre bottle and the row walks.', towers: [{x: 450, y: 876, n: 4}]},
  {prize: 'alley-collector-cup', hint: 'Thread the gap — both inner bases in one line.', towers: [{x: 392, y: 864, n: 3}, {x: 508, y: 864, n: 3}]},
  {prize: 'cocoa-cup', hint: 'Hit the little fuse in front. It should take the pyramid.', towers: [{x: 450, y: 888, n: 2}, {x: 450, y: 738, n: 4}]},
  {prize: 'crown-hatbox', hint: 'A low sweep through both bottom rows.', towers: [{x: 348, y: 858, n: 3}, {x: 552, y: 858, n: 4}]},
  {prize: 'button-elephant', hint: 'The grand pyramid. Bottom-centre, honest power.', towers: [{x: 450, y: 884, n: 5}]},
];

function topple(b, vx = 80) {
  if (b.fallen) return;
  b.fallen = true;
  b.vx = vx;
  b.vy = -95;
  b.w = (vx >= 0 ? 1 : -1) * (1.7 + Math.abs(vx) * 0.012);
}
function nudgeRow(s, hit, vx) {
  for (const b of s.bottles) {
    if (b === hit || b.fallen) continue;
    if (Math.abs(b.y - hit.y) < 26 && Math.abs(b.x - hit.x) < 82) {
      topple(b, vx * 0.62 + (b.x < hit.x ? -55 : 55));
    }
  }
}
function angleOf(s) {
  return (clamp(s.angle, 0, 1) - 0.5) * 1.22;
}
function startCharge(s) {
  if (s.ball || s.won || s.lost || s.throws >= s.limit || s.charging) return;
  s.charging = true;
  s.power = 0.42;
}
function releaseThrow(s) {
  if (!s.charging || s.ball || s.won || s.lost) { s.charging = false; return; }
  s.charging = false;
  if (s.throws >= s.limit) return;
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny in the purse. Bank loan, or cash a ticket.';
      s.power = 0.42;
      return;
    }
  }
  const theta = angleOf(s);
  const spd = 380 + clamp(s.power, 0.4, 1) * 560;
  s.ball = {
    x: HAND.x, y: HAND.y,
    vx: Math.sin(theta) * spd,
    vy: -Math.cos(theta) * spd * 0.94,
  };
  s.throws++;
  s.power = 0.42;
  s.note = 'One bead. All down, or the prize stays.';
}
function setAngleFromX(s, x) {
  s.angle = clamp((x - BAR.x) / BAR.w, 0, 1);
}
function build(level) {
  const set = SETS[level] || SETS[0];
  const bottles = [];
  const towers = set.towers.map(t => ({...t}));
  for (const tower of towers) {
    let below = [];
    for (let row = 0; row < tower.n; row++) {
      const ids = [];
      const count = tower.n - row;
      for (let i = 0; i < count; i++) {
        const id = bottles.length;
        ids.push(id);
        bottles.push({
          x: tower.x + (i - (count - 1) / 2) * GAP,
          y: tower.y - row * RISE,
          angle: 0, w: 0, vx: 0, vy: 0, fallen: false,
          support: row ? [below[i], below[i + 1]].filter(n => n != null) : [],
        });
      }
      below = ids;
    }
  }
  return {bottles, towers, prize: set.prize, hint: set.hint, limit: 1};
}

export default {
  title: 'The Topsy Dairy',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: 'Mabel’s milk-bottle alley. One penny, one throw. Set the angle on the bar, hold for power, and wipe the dairy in a single bead. Leave one standing and she keeps the shelf.',
  instructions: alleyPlay
    ? 'Slide the bottom bar for angle. Hold Throw (or Space) to fill power, release to send the bead. The prize only stamps if every bottle falls on that one throw. Another penny for another go.'
    : 'Bottom bar is angle. Hold to charge, release to throw. Clear the dairy in one bead.',
  levels: ['A tidy three', 'The four-stack', 'Twin parlours', 'The fuse', 'A low sweep', 'The grand pyramid'],
  sprites: ['message-bottle', 'mercury-bead', 'dairy-calf', 'lucky-dish', 'alley-collector-cup', 'cocoa-cup', 'crown-hatbox', 'button-elephant', 'penny-purse', 'everyday-penny'],
  prizes: SETS.map(s => s.prize),
  actions: [{id: 'throw', label: alleyPlay ? 'Hold to throw · 1 penny' : 'Hold to throw', hold: true}],
  create(level) {
    return {
      ...build(level),
      level, angle: 0.5, power: 0.42, charging: false, ball: null, throws: 0, t: 0, settle: 0,
      won: false, lost: false,
      note: alleyPlay ? 'Angle on the bar. Hold, release. One throw.' : 'Angle, charge, one bead.',
    };
  },
  update(s, dt, input) {
    s.t += dt;
    const nudge = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    if (!s.ball) s.angle = clamp(s.angle + nudge * 0.55 * dt, 0, 1);
    if (s.charging) s.power = 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(s.t * 5.2));
    for (const b of s.bottles) {
      if (!b.fallen && b.support.some(i => s.bottles[i] && s.bottles[i].fallen)) {
        topple(b, (b.x < 450 ? -1 : 1) * 70);
      }
      if (b.fallen) {
        b.vy += 520 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.angle += b.w * dt;
        if (b.y > 1060) { b.y = 1060; b.vy = -Math.abs(b.vy) * 0.18; b.vx *= 0.78; b.w *= 0.82; }
        b.x = clamp(b.x, 170, 730);
      }
    }
    if (s.ball) {
      const p = s.ball, old = {x: p.x, y: p.y};
      p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const hit = s.bottles.find(b => !b.fallen && segmentDistance({x: b.x, y: b.y - 34}, old, p) < 34);
      if (hit) {
        const kick = p.vx * 0.85 + (p.x < hit.x ? 70 : -70);
        topple(hit, kick);
        nudgeRow(s, hit, p.vx);
        p.vx *= 0.7;
        p.vy *= 0.48;
      }
      if (p.y > 1120 || p.y < 280 || p.x < 120 || p.x > 780) s.ball = null;
    }
    for (const a of s.bottles) if (a.fallen && Math.abs(a.vx) > 16)
      for (const b of s.bottles) if (!b.fallen && dist({x: a.x, y: a.y - 28}, {x: b.x, y: b.y - 28}) < 50)
        topple(b, a.vx * 0.8);
    if (!s.won && !s.lost && s.bottles.every(b => b.fallen)) {
      s.settle += dt;
      if (s.settle > 0.95) {
        s.won = true;
        if (alleyPlay && s.prize) keep(s.prize, 'milk-bottles');
        done(s, 'Not a bottle left standing',
          itemName(s.prize) + ' flies into the treasure book.', {prize: s.prize, won: true});
      }
    } else if (!s.won && !s.lost && !s.ball && s.throws >= s.limit && s.bottles.some(b => !b.fallen)) {
      s.lost = true;
      const left = s.bottles.filter(b => !b.fallen).length;
      done(s, 'The dairy still stands',
        left + ' bottle' + (left === 1 ? '' : 's') + ' left. Another penny for another throw.', {won: false});
    }
  },
  pointer(s, type, p) {
    if (s.ball || s.won || s.lost) return;
    if (type === 'move' || type === 'down') {
      if (p.y > BAR.y - 24) setAngleFromX(s, p.x);
    }
    if (type === 'down' && p.y > BAR.y - 24) startCharge(s);
    if (type === 'up' || type === 'cancel') releaseThrow(s);
  },
  action(s, id, down) {
    if (id !== 'throw') return;
    if (down) startCharge(s);
    else releaseThrow(s);
  },
  key(s, k, down) {
    if (k !== ' ') return;
    if (down) startCharge(s);
    else releaseThrow(s);
  },
  draw(s, d) {
    d.poly([[70, 108], [250, 108], [250, 292], [70, 292]], '#4a3424cc', '#e4c48a', 2);
    d.text('this dairy', 160, 130, 13, '#ead6a4');
    d.item(spriteKey(s.prize), 160, 188, {w: 84, fallback: () => d.star(160, 188, 28)});
    d.text(itemName(s.prize), 160, 246, 12, '#fff0cb');
    d.text('one throw', 160, 272, 12, '#f0d6a8');
    for (let i = 0; i < SETS.length; i++) {
      const x = 92 + (i % 3) * 52, y = 330 + Math.floor(i / 3) * 58;
      const got = owned(SETS[i].prize) || (s.won && i === s.level);
      d.item(spriteKey(SETS[i].prize), x, y, {w: 36, fallback: () => d.star(x, y, 12)});
      if (got) d.text('✓', x + 14, y - 10, 16, '#f6e2a2');
      else d.circle(x, y, 20, '#1a120866');
    }
    const n = alleyPlay ? (pocket() ?? 0) : '∞';
    d.item(spriteKey('penny-purse'), 790, 160, {w: 92, fallback: () => d.heart(790, 160, 28, '#6a7a52')});
    d.text(String(n), 790, 218, 18, '#fff6d8');
    d.text(n === 1 ? 'penny' : 'pennies', 790, 236, 12, '#ead6a4');
    d.text(s.hint || '', 450, 132, 14, '#ead6a4');
    for (const t of s.towers) {
      const w = t.n * 26 + 22;
      d.line({x: t.x - w, y: t.y + 7}, {x: t.x + w, y: t.y + 7}, '#9b7c57', 18);
      d.line({x: t.x - w, y: t.y}, {x: t.x + w, y: t.y}, '#e1c294', 5);
      for (const x of [t.x - w + 14, t.x + w - 14]) d.line({x, y: t.y + 12}, {x, y: 980}, '#9d8b69', 10);
    }
    for (const b of s.bottles) {
      d.item(spriteKey('message-bottle'), b.x, b.y - 32, {
        w: 46, angle: b.angle,
        fallback: () => d.bottle(b.x, b.y, 1, '#e5e5cc', b.angle),
      });
    }
    const bead = (x, y, w) => d.item(spriteKey('mercury-bead'), x, y, {
      w, fallback: () => d.ball(x, y, w * 0.45, '#b79768'),
    });
    if (s.ball) bead(s.ball.x, s.ball.y, 32);
    else if (!s.won && !s.lost) {
      const theta = angleOf(s), spd = 380 + clamp(s.power, 0.4, 1) * 560;
      const vx = Math.sin(theta) * spd, vy = -Math.cos(theta) * spd * 0.94;
      for (let i = 1; i <= 16; i++) {
        const u = 0.055 * i;
        d.circle(HAND.x + vx * u, HAND.y + vy * u + 260 * u * u, 2.1, '#77674499');
      }
      bead(HAND.x, HAND.y, 40);
    }
    d.poly([[BAR.x - 8, BAR.y - 8], [BAR.x + BAR.w + 8, BAR.y - 8], [BAR.x + BAR.w + 8, BAR.y + BAR.h + 8], [BAR.x - 8, BAR.y + BAR.h + 8]], '#2a1c16ee', '#e4c48a', 2);
    d.text('angle', BAR.x + 36, BAR.y - 18, 12, '#ead6a4');
    d.poly([[BAR.x, BAR.y], [BAR.x + BAR.w, BAR.y], [BAR.x + BAR.w, BAR.y + BAR.h], [BAR.x, BAR.y + BAR.h]], '#3a2a22', '#c4a46a', 2);
    const fill = BAR.w * clamp(s.power, 0, 1);
    d.poly([[BAR.x + 2, BAR.y + 2], [BAR.x + fill - 2, BAR.y + 2], [BAR.x + fill - 2, BAR.y + BAR.h - 2], [BAR.x + 2, BAR.y + BAR.h - 2]], s.charging ? '#c45a3aaa' : '#6a4a2888');
    const ax = BAR.x + BAR.w * clamp(s.angle, 0, 1);
    d.poly([[ax - 10, BAR.y - 6], [ax + 10, BAR.y - 6], [ax + 10, BAR.y + BAR.h + 6], [ax - 10, BAR.y + BAR.h + 6]], '#f0d080', '#fff6d8', 2);
    d.text(s.charging ? 'release' : 'hold to throw', 450, BAR.y + BAR.h + 22, 12, '#f0d6a8');
  },
  readout: s => {
    const down = s.bottles.filter(b => b.fallen).length;
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice beads' : n + (n === 1 ? ' penny' : ' pennies') + ' in the purse';
    return down + ' / ' + s.bottles.length + ' down · ' + purse + ' · ' + s.note;
  },
};
