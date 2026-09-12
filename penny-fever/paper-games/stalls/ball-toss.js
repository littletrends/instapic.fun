import {clamp, segmentDistance, dist, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, owned} from '../wallet.js?v=bess-lantern-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=prize-fly-1';

const start = {x: 450, y: 1010};
const flight = .92;
const g = 540;
const SETS = [
  {prize: 'juggling-bird', throws: 1, wind: .22, freq: .7, clusters: [{x: 450, y: 390, n: 4, len: 150}]},
  {prize: 'patchwork-bear', throws: 1, wind: .3, freq: .88, clusters: [{x: 370, y: 400, n: 3, len: 145}, {x: 530, y: 400, n: 3, len: 145}]},
  {prize: 'autumn-leaf-lantern', throws: 1, wind: .34, freq: .98, clusters: [{x: 450, y: 320, n: 3, len: 115}, {x: 270, y: 560, n: 3, len: 130}, {x: 630, y: 560, n: 3, len: 130}]},
  {prize: 'button-elephant', throws: 1, wind: .38, freq: 1.08, clusters: [{x: 310, y: 420, n: 3, len: 140}, {x: 450, y: 330, n: 3, len: 120}, {x: 590, y: 420, n: 3, len: 140}]},
  {prize: 'prize-claim', throws: 1, wind: .44, freq: 1.18, clusters: [{x: 320, y: 430, n: 3, len: 135}, {x: 450, y: 310, n: 4, len: 118}, {x: 580, y: 430, n: 3, len: 135}]},
  {prize: 'midway-scarf', throws: 1, wind: .52, freq: 1.32, clusters: [{x: 305, y: 400, n: 4, len: 128}, {x: 450, y: 290, n: 4, len: 112}, {x: 595, y: 400, n: 4, len: 128}]},
];

function knock(l, vx, vy) {
  if (l.fallen) return;
  l.fallen = true;
  l.vx = vx;
  l.vy = vy;
  l.spin = vx * .008;
}
function knockBar(s, hit, vx, vy) {
  if (hit.fallen) return;
  knock(hit, vx, vy);
  let cx = 0, n = 0;
  for (const l of s.lanterns) if (l.bar === hit.bar) { cx += l.ax; n++; }
  cx /= n || 1;
  for (const l of s.lanterns) {
    if (l.bar !== hit.bar || l.fallen) continue;
    const out = l.ax === cx ? (l.x < hit.x ? -1 : 1) : Math.sign(l.ax - cx);
    knock(l, vx * .35 + out * 100, vy * .25 - 80);
  }
}
function toss(s) {
  if (s.ball || s.won || s.lost) return;
  if (s.throws >= s.limit) {
    s.note = 'That toss is spent. Another penny for another throw.';
    return;
  }
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny in the purse. Bank loan, or cash a ticket.';
      return;
    }
  }
  const t = flight;
  s.ball = {...start, vx: (s.aim.x - start.x) / t, vy: (s.aim.y - start.y - .5 * g * t * t) / t};
  s.throws++;
  s.note = 'Toss ' + s.throws + ' of ' + s.limit + ' · a penny a throw. Lead the swing.';
}
function build(level) {
  const set = SETS[level] || SETS[0];
  const lanterns = [];
  const bars = set.clusters.map((c, ci) => {
    for (let i = 0; i < c.n; i++) {
      const ax = c.x + (i - (c.n - 1) / 2) * 46;
      lanterns.push({
        ax, ay: c.y, len: c.len + (i % 2 ? 12 : 0),
        x: ax, y: c.y + c.len, a: 0, rest: (i - (c.n - 1) / 2) * .07,
        phase: i * 1.1 + ci * 1.7,
        fallen: false, vx: 0, vy: 0, spin: 0, bar: ci,
        id: (ci + i) % 2 ? 'moon-lantern' : 'autumn-leaf-lantern',
      });
    }
    return {x: c.x, y: c.y, n: c.n, w: c.n * 23 + 28};
  });
  return {lanterns, bars, prize: set.prize, limit: set.throws, wind: set.wind, freq: set.freq};
}

export default {
  title: 'Lantern Toss',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: 'Bess has hung a tiny circus skyline from ribbons. One penny, one toss. Knock every lantern in that single throw and the keepsake is yours. Leave one glowing and she keeps the peg.',
  instructions: alleyPlay
    ? 'Aim and toss (one penny a throw). Lead the swing — the prize only flies if the whole skyline falls in that one toss. A leftover lantern means try again — another penny. Arrows aim, Space tosses.'
    : 'One toss. Lead the swing and clear every lantern in that throw to finish the chapter.',
  levels: ['Four little lanterns', 'Two ribbon lines', 'The high and the low', 'Three little skies', 'A crowded ribbon night', 'The storm-hung skyline'],
  sprites: ['autumn-leaf-lantern', 'moon-lantern', 'juggling-bird', 'patchwork-bear', 'prize-bag', 'button-elephant', 'prize-claim', 'midway-scarf', 'penny-purse', 'everyday-penny'],
  prizes: SETS.map(s => s.prize),
  actions: [{id: 'throw', label: alleyPlay ? 'Toss · 1 penny' : 'Toss a paper ball'}],
  create(level) {
    const s = {
      ...build(level),
      level, aim: {x: 450, y: 560}, ball: null, throws: 0, t: 0, settle: 0, won: false, lost: false,
      note: alleyPlay ? 'One penny. One toss. All down, or the prize stays on the peg.' : 'One practice toss. Clear the skyline. Lead the swing.',
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    const dx = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    const dy = (input.keys.has('ArrowDown') ? 1 : 0) - (input.keys.has('ArrowUp') ? 1 : 0);
    s.aim.x = clamp(s.aim.x + dx * 230 * dt, 200, 700);
    s.aim.y = clamp(s.aim.y + dy * 230 * dt, 420, 820);
    for (const l of s.lanterns) {
      if (!l.fallen) {
        l.a = l.rest + Math.sin(s.t * s.freq + l.phase) * s.wind;
        l.x = l.ax + Math.sin(l.a) * l.len;
        l.y = l.ay + Math.cos(l.a) * l.len;
      } else {
        l.vy += 460 * dt; l.x += l.vx * dt; l.y += l.vy * dt; l.spin += l.vx * .006 * dt;
        if (l.y > 1065) { l.y = 1065; l.vy = -Math.abs(l.vy) * .28; l.vx *= .7; }
        l.x = clamp(l.x, 200, 700);
      }
    }
    if (s.ball) {
      const p = s.ball, old = {x: p.x, y: p.y};
      p.vy += g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const hit = s.lanterns.find(l => !l.fallen && segmentDistance(l, old, p) < 42);
      if (hit) {
        knockBar(s, hit, p.vx * .7 + (p.x < hit.x ? 90 : -90), p.vy * .3 - 80);
        p.vx *= -.35; p.vy *= .2;
        s.note = 'The ribbon jumps!';
      }
      if (p.y > 1090 || p.y < 280 || p.x < 140 || p.x > 760) s.ball = null;
    }
    for (const a of s.lanterns) if (a.fallen && Math.hypot(a.vx, a.vy) > 28)
      for (const b of s.lanterns) if (!b.fallen && dist(a, b) < 64)
        knockBar(s, b, a.vx * .75 + (a.x < b.x ? 50 : -50), a.vy * .3 - 50);
    if (!s.won && !s.lost && s.lanterns.every(l => l.fallen)) {
      s.settle += dt;
      if (s.settle > 1.1) {
        const clean = s.throws === 1;
        s.won = clean;
        s.lost = !clean;
        if (alleyPlay && s.prize && clean) keep(s.prize, 'ball-toss');
        if (clean) takePrize(s, s.prize);
        done(s,
          clean ? 'Not a lantern left swinging' : 'They fell — but not in one toss',
          clean
            ? itemName(s.prize) + ' flies into the treasure book.'
            : 'The prize wanted a single clean skyline. Another penny for another toss.',
          {prize: clean ? s.prize : null, won: clean});
      }
    } else if (!s.won && !s.lost && !s.ball && s.throws >= s.limit && s.lanterns.some(l => !l.fallen)) {
      s.lost = true;
      const left = s.lanterns.filter(l => !l.fallen).length;
      done(s, 'The skyline still glows',
        left + ' lantern' + (left === 1 ? '' : 's') + ' still on the ribbon. Another penny for another toss.', {won: false});
    }
  },
  pointer(s, type, p) {
    if (type === 'move' || type === 'down') s.aim = {x: clamp(p.x, 200, 700), y: clamp(p.y, 420, 820)};
    if (type === 'up') toss(s);
  },
  action(s, id) { if (id === 'throw') toss(s); },
  key(s, k, down) { if (k === ' ' && down) toss(s); },
  draw(s, d) {
    d.poly([[70, 108], [250, 108], [250, 292], [70, 292]], '#4a3424cc', '#e4c48a', 2);
    d.text('this skyline', 160, 130, 13, '#ead6a4');
    d.item(spriteKey(s.prize), 160, 188, {w: 84, fallback: () => d.star(160, 188, 28)});
    d.text(itemName(s.prize), 160, 246, 12, '#fff0cb');
    d.text((s.limit - s.throws) + ' toss' + (s.limit - s.throws === 1 ? '' : 'es') + ' left', 160, 272, 12, '#f0d6a8');
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
    d.ellipse(450, 1080, 255, 25, '#a8757277', '#ceaa78', 2);
    for (const t of s.bars) {
      d.line({x: t.x - t.w, y: t.y}, {x: t.x + t.w, y: t.y}, '#9b7c57', 8);
      d.line({x: t.x - t.w, y: t.y - 3}, {x: t.x + t.w, y: t.y - 3}, '#e1c294', 2);
      for (const x of [t.x - t.w + 10, t.x + t.w - 10]) d.ring(x, t.y, 5, '#c4a06a', 2);
    }
    for (const l of s.lanterns) {
      if (!l.fallen) {
        d.line({x: l.ax, y: l.ay}, {x: l.x, y: l.y}, '#836a48', 3);
        d.ring(l.ax, l.ay, 6, '#c4a06a', 2);
      }
      const c = d.c; c.save(); c.translate(l.x, l.y); c.rotate(l.fallen ? l.spin : l.a);
      if (!l.fallen) d.glow(0, 8, 36, '#eebf6c');
      d.item(spriteKey(l.id), 0, 8, {
        w: 64, fallback: () => {
          d.glow(0, 0, 48, '#eebf6c');
          d.poly([[-27, -31], [27, -31], [32, 24], [18, 37], [-18, 37], [-32, 24]], '#bd7957', '#f2cd80', 3);
          d.star(0, 0, 15, '#efd698');
        },
      });
      c.restore();
    }
    if (s.ball) d.ball(s.ball.x, s.ball.y, 15, '#b57b59');
    else if (!s.won && !s.lost && s.throws < s.limit) {
      const vx = (s.aim.x - start.x) / flight, vy = (s.aim.y - start.y - .5 * g * flight * flight) / flight;
      for (let i = 1; i < 15; i++) {
        const u = i * flight / 14;
        d.circle(start.x + vx * u, start.y + vy * u + .5 * g * u * u, 2.5, '#805946aa');
      }
      d.ball(start.x, start.y, 19, '#bc6f55');
      d.ring(s.aim.x, s.aim.y, 19, '#a97950', 2);
    }
  },
  readout: s => {
    const down = s.lanterns.filter(l => l.fallen).length;
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice tosses' : n + (n === 1 ? ' penny' : ' pennies') + ' in the purse';
    return down + ' / ' + s.lanterns.length + ' down · ' + s.throws + '/' + s.limit + ' tosses · ' + purse + ' · ' + s.note;
  },
};
