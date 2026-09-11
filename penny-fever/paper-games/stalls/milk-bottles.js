import {clamp, segmentDistance, dist, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, owned} from '../wallet.js?v=mabel-dairy-2';

const start = {x: 450, y: 1050};
const SETS = [
  {prize: 'dairy-calf', throws: 2, towers: [{x: 450, y: 840, n: 4}]},
  {prize: 'lucky-dish', throws: 2, towers: [{x: 310, y: 840, n: 3}, {x: 600, y: 840, n: 3}]},
  {prize: 'alley-collector-cup', throws: 2, towers: [{x: 300, y: 850, n: 4}, {x: 620, y: 720, n: 3}]},
  {prize: 'cocoa-cup', throws: 3, towers: [{x: 250, y: 840, n: 3}, {x: 450, y: 700, n: 4}, {x: 650, y: 840, n: 3}]},
  {prize: 'crown-hatbox', throws: 3, towers: [{x: 270, y: 860, n: 4}, {x: 450, y: 620, n: 3}, {x: 640, y: 860, n: 4}]},
  {prize: 'button-elephant', throws: 3, towers: [{x: 320, y: 870, n: 5}, {x: 620, y: 720, n: 4}]},
];

function topple(b, vx = 80) {
  if (b.fallen) return;
  b.fallen = true;
  b.vx = vx;
  b.vy = -80;
  b.w = (vx >= 0 ? 1 : -1) * (1.5 + Math.abs(vx) * .01);
}
function toss(s) {
  if (s.ball || s.won || s.lost) return;
  if (s.throws >= s.limit) {
    s.note = 'No beads left this dairy. One penny, one throw.';
    return;
  }
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny in the purse. Bank loan, or cash a ticket.';
      return;
    }
  }
  const t = .75;
  s.ball = {...start, vx: (s.aim.x - 450) / t, vy: (s.aim.y - 1050 - 240 * t * t) / t};
  s.throws++;
  s.note = 'Throw ' + s.throws + ' of ' + s.limit + ' · a penny a bead.';
}
function build(level) {
  const set = SETS[level] || SETS[0];
  const bottles = [];
  const towers = set.towers.map(t => ({...t}));
  for (const tower of towers) {
    let below = [];
    for (let row = 0; row < tower.n; row++) {
      const ids = [];
      for (let i = 0; i < tower.n - row; i++) {
        const id = bottles.length;
        ids.push(id);
        bottles.push({
          x: tower.x + (i - (tower.n - row - 1) / 2) * 51,
          y: tower.y - row * 77,
          angle: 0, w: 0, vx: 0, vy: 0, fallen: false,
          support: row ? [below[i], below[i + 1]] : [],
        });
      }
      below = ids;
    }
  }
  return {bottles, towers, prize: set.prize, limit: set.throws};
}

export default {
  title: 'The Topsy Dairy',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: 'Mabel’s milk-bottle alley. Six full dairies, one keepsake each. A penny a throw, and only a couple of throws. One clean hit can take the lot — miss, and the shelf stays hers.',
  instructions: alleyPlay
    ? 'Aim and throw (one penny a bead). You only get two or three throws this dairy. Knock every bottle to stamp the prize and open it in the treasure book. Chapters you have cleared are marked. Arrows aim, Space throws.'
    : 'Aim and throw. Limited beads. Clear the dairy to finish the chapter.',
  levels: ['The full dairy', 'Two parlour stacks', 'The high shelf', 'Three little dairies', 'The tall and the tiny', 'The grand pyramid'],
  sprites: ['message-bottle', 'mercury-bead', 'dairy-calf', 'lucky-dish', 'alley-collector-cup', 'cocoa-cup', 'crown-hatbox', 'button-elephant', 'penny-purse', 'everyday-penny'],
  prizes: SETS.map(s => s.prize),
  actions: [{id: 'throw', label: alleyPlay ? 'Throw · 1 penny' : 'Throw mercury bead'}],
  create(level) {
    return {
      ...build(level),
      level, aim: {x: 450, y: 770}, ball: null, throws: 0, t: 0, settle: 0, won: false, lost: false,
      note: alleyPlay ? 'A penny a bead. ' + (SETS[level] || SETS[0]).throws + ' throws this dairy.' : 'Limited practice beads. Clear the dairy.',
    };
  },
  update(s, dt, input) {
    s.t += dt;
    const dx = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    const dy = (input.keys.has('ArrowDown') ? 1 : 0) - (input.keys.has('ArrowUp') ? 1 : 0);
    s.aim.x = clamp(s.aim.x + dx * 220 * dt, 220, 680);
    s.aim.y = clamp(s.aim.y + dy * 220 * dt, 430, 900);
    for (const b of s.bottles) {
      if (!b.fallen && b.support.some(i => s.bottles[i].fallen)) topple(b, (b.x < 450 ? -1 : 1) * 45);
      if (b.fallen) {
        b.vy += 460 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.angle += b.w * dt;
        if (b.y > 1060) { b.y = 1060; b.vy = -Math.abs(b.vy) * .22; b.vx *= .8; b.w *= .85; }
        b.x = clamp(b.x, 185, 715);
      }
    }
    if (s.ball) {
      const p = s.ball, old = {x: p.x, y: p.y};
      p.vy += 480 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const hit = s.bottles.find(b => !b.fallen && segmentDistance({x: b.x, y: b.y - 36}, old, p) < 36);
      if (hit) { topple(hit, p.vx * .7 + (p.x < hit.x ? 95 : -95)); p.vx *= -.35; p.vy *= .2; }
      if (p.y > 1100 || p.y < 330 || p.x < 160 || p.x > 740) s.ball = null;
    }
    for (const a of s.bottles) if (a.fallen && Math.abs(a.vx) > 20)
      for (const b of s.bottles) if (!b.fallen && dist({x: a.x, y: a.y - 30}, {x: b.x, y: b.y - 30}) < 43)
        topple(b, a.vx * .65);
    if (!s.won && !s.lost && s.bottles.every(b => b.fallen)) {
      s.settle += dt;
      if (s.settle > 1.1) {
        s.won = true;
        if (alleyPlay && s.prize) keep(s.prize, 'milk-bottles');
        done(s, 'Not a bottle left standing',
          itemName(s.prize) + ' flies into the treasure book.', {prize: s.prize, won: true});
      }
    } else if (!s.won && !s.lost && !s.ball && s.throws >= s.limit && s.bottles.some(b => !b.fallen)) {
      s.lost = true;
      const left = s.bottles.filter(b => !b.fallen).length;
      done(s, 'The dairy still stands',
        left + ' bottle' + (left === 1 ? '' : 's') + ' left after ' + s.throws + ' throws. Mabel keeps the shelf.', {won: false});
    }
  },
  pointer(s, type, p) {
    if (type === 'move' || type === 'down') s.aim = {x: clamp(p.x, 220, 680), y: clamp(p.y, 430, 900)};
    if (type === 'up') toss(s);
  },
  action(s, id) { if (id === 'throw') toss(s); },
  key(s, k, down) { if (k === ' ' && down) toss(s); },
  draw(s, d) {
    d.poly([[70, 108], [250, 108], [250, 292], [70, 292]], '#4a3424cc', '#e4c48a', 2);
    d.text('this dairy', 160, 130, 13, '#ead6a4');
    d.item(spriteKey(s.prize), 160, 188, {w: 84, fallback: () => d.star(160, 188, 28)});
    d.text(itemName(s.prize), 160, 246, 12, '#fff0cb');
    d.text((s.limit - s.throws) + ' throw' + (s.limit - s.throws === 1 ? '' : 's') + ' left', 160, 272, 12, '#f0d6a8');
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
    for (const t of s.towers) {
      const w = t.n * 30 + 24;
      d.line({x: t.x - w, y: t.y + 7}, {x: t.x + w, y: t.y + 7}, '#9b7c57', 18);
      d.line({x: t.x - w, y: t.y}, {x: t.x + w, y: t.y}, '#e1c294', 5);
      for (const x of [t.x - w + 14, t.x + w - 14]) d.line({x, y: t.y + 12}, {x, y: 970}, '#9d8b69', 10);
    }
    for (const b of s.bottles) {
      d.item(spriteKey('message-bottle'), b.x, b.y - 32, {
        w: 48, angle: b.angle,
        fallback: () => d.bottle(b.x, b.y, 1, '#e5e5cc', b.angle),
      });
    }
    const bead = (x, y, w) => d.item(spriteKey('mercury-bead'), x, y, {
      w, fallback: () => d.ball(x, y, w * .45, '#b79768'),
    });
    if (s.ball) bead(s.ball.x, s.ball.y, 32);
    else if (!s.won && !s.lost && s.throws < s.limit) {
      const t = .75, vx = (s.aim.x - 450) / t, vy = (s.aim.y - 1050 - 240 * t * t) / t;
      for (let i = 1; i <= 14; i++) {
        const u = t * i / 14;
        d.circle(450 + vx * u, 1050 + vy * u + 240 * u * u, 2.2, '#77674499');
      }
      bead(450, 1050, 40);
      d.ring(s.aim.x, s.aim.y, 17, '#a17955', 2);
    }
  },
  readout: s => {
    const down = s.bottles.filter(b => b.fallen).length;
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice beads' : n + (n === 1 ? ' penny' : ' pennies') + ' in the purse';
    return down + ' / ' + s.bottles.length + ' down · ' + s.throws + '/' + s.limit + ' throws · ' + purse + ' · ' + s.note;
  },
};
