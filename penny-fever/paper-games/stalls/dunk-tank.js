import {clamp, segmentDistance, dist, done, TAU} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, owned} from '../wallet.js?v=duncan-splash-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const start = {x: 450, y: 1050};
const SETS = [
  {prize: 'dunk-plate', throws: 1, guard: false, towers: [{x: 640, y: 720, n: 3}]},
  {prize: 'barker-hat', throws: 1, guard: false, towers: [{x: 255, y: 730, n: 3}, {x: 645, y: 730, n: 3}]},
  {prize: 'splash-bead', throws: 1, guard: true, towers: [{x: 250, y: 740, n: 3}, {x: 650, y: 640, n: 3}]},
  {prize: 'wet-bell', throws: 1, guard: true, towers: [{x: 240, y: 760, n: 3}, {x: 450, y: 520, n: 2}, {x: 660, y: 760, n: 3}]},
  {prize: 'towel-flag', throws: 1, guard: true, towers: [{x: 250, y: 780, n: 4}, {x: 650, y: 580, n: 3}]},
  {prize: 'seltzer-bottle', throws: 1, guard: true, towers: [{x: 235, y: 790, n: 4}, {x: 450, y: 510, n: 3}, {x: 665, y: 790, n: 4}]},
];

function topple(p, vx = 80) {
  if (p.fallen) return;
  p.fallen = true;
  p.vx = vx;
  p.vy = -80;
  p.w = (vx >= 0 ? 1 : -1) * (1.5 + Math.abs(vx) * .01);
}
function toss(s) {
  if (s.ball || s.won || s.lost || s.dunk >= 0) return;
  if (s.throws >= s.limit) {
    s.note = 'That bead is spent. Another penny for another throw.';
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
  s.note = 'Bead ' + s.throws + ' of ' + s.limit + ' · a penny a splash.';
}
function build(level) {
  const set = SETS[level] || SETS[0];
  const plates = [];
  const towers = set.towers.map(t => ({...t}));
  for (const tower of towers) {
    let below = [];
    for (let row = 0; row < tower.n; row++) {
      const ids = [];
      for (let i = 0; i < tower.n - row; i++) {
        const id = plates.length;
        ids.push(id);
        plates.push({
          x: tower.x + (i - (tower.n - row - 1) / 2) * 51,
          y: tower.y - row * 62,
          angle: 0, w: 0, vx: 0, vy: 0, fallen: false,
          support: row ? [below[i], below[i + 1]] : [],
        });
      }
      below = ids;
    }
  }
  return {plates, towers, prize: set.prize, limit: set.throws, guardOn: !!set.guard};
}

export default {
  title: 'Splashworks',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: 'Duncan’s Splashworks. One penny, one mercury bead. Knock every brass splash-plate in that single throw and the crowned duck takes the most unnecessarily theatrical bath on the alley. Leave a plate hanging and Duncan keeps the seat dry.',
  instructions: alleyPlay
    ? 'Aim and throw (one penny a bead). The prize only flies if every plate falls in that one throw. A leftover plate means try again — another penny. Arrows aim, Space throws. Later chapters add a swinging boom across the lane.'
    : 'One throw. Clear every splash-plate in that bead to finish the chapter. Later chapters add a swinging boom.',
  tableDetail: 'A new set of splash-plates. One penny, one bead. Dunk the volunteer and the keepsake is yours.',
  levels: ['The volunteer’s first bath', 'Two splash stacks', 'Mind the swinging boom', 'The high plate and the tank', 'The long-swing bath', 'Duncan’s grand dunk'],
  sprites: ['crowned-duck', 'mercury-bead', 'splash-ring', 'dairy-calf', 'laughing-doorway', 'seaside-day-book', 'lemon-fizz', 'penny-purse', 'everyday-penny'],
  prizes: SETS.map(s => s.prize),
  actions: [{id: 'throw', label: alleyPlay ? 'Throw · 1 penny' : 'Throw mercury bead'}],
  create(level) {
    const built = build(level);
    const s = {
      ...built,
      level, aim: {x: built.towers[0].x, y: built.towers[0].y - 24}, ball: null, throws: 0, t: 0,
      dunk: -1, guard: {x: 450, y: 865}, won: false, lost: false,
      note: alleyPlay ? 'One penny. One bead. Every plate down, or the seat stays dry.' : 'One practice bead. Clear the plates, dunk the volunteer.',
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    if (s.guardOn) {
      const extra = Math.max(0, s.level - 2);
      s.guard.x = 450 + Math.sin(s.t * (1.1 + extra * .18)) * (155 + extra * 12);
    }
    const dx = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    const dy = (input.keys.has('ArrowDown') ? 1 : 0) - (input.keys.has('ArrowUp') ? 1 : 0);
    if (s.dunk < 0 && !s.won && !s.lost) {
      s.aim.x = clamp(s.aim.x + dx * 220 * dt, 210, 690);
      s.aim.y = clamp(s.aim.y + dy * 220 * dt, 380, 900);
    }
    for (const p of s.plates) {
      if (!p.fallen && p.support.some(i => s.plates[i].fallen)) topple(p, (p.x < 450 ? -1 : 1) * 45);
      if (p.fallen) {
        p.vy += 460 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.angle += p.w * dt;
        if (p.y > 1060) { p.y = 1060; p.vy = -Math.abs(p.vy) * .22; p.vx *= .8; p.w *= .85; }
        p.x = clamp(p.x, 185, 715);
      }
    }
    if (s.ball) {
      const b = s.ball, old = {x: b.x, y: b.y};
      b.vy += 480 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (s.guardOn && segmentDistance(s.guard, old, b) < 43) {
        b.vx = (b.x < s.guard.x ? -1 : 1) * 190; b.vy = Math.abs(b.vy) * .4;
        s.note = 'The boom caught it. Wait for a clear lane — another penny if this bead is spent.';
      }
      const hit = s.plates.find(p => !p.fallen && segmentDistance({x: p.x, y: p.y}, old, b) < 34);
      if (hit) {
        topple(hit, b.vx * .7 + (b.x < hit.x ? 95 : -95));
        b.vx *= -.35; b.vy *= .2;
        s.note = 'A plate rings.';
      }
      if (b.y > 1110 || b.y < 330 || b.x < 160 || b.x > 740) s.ball = null;
    }
    for (const a of s.plates) if (a.fallen && Math.abs(a.vx) > 20)
      for (const p of s.plates) if (!p.fallen && dist({x: a.x, y: a.y}, {x: p.x, y: p.y}) < 46)
        topple(p, a.vx * .65);
    if (!s.won && !s.lost && s.plates.every(p => p.fallen)) {
      if (s.dunk < 0) {
        s.dunk = 0;
        s.note = 'The last plate! The seat tips…';
      }
      s.dunk += dt;
      if (s.dunk > 2.2) {
        const clean = s.throws === 1;
        s.won = clean;
        s.lost = !clean;
        if (alleyPlay && s.prize && clean) keep(s.prize, 'dunk-tank');
        if (clean) takePrize(s, s.prize);
        done(s,
          clean ? 'A magnificently unnecessary splash' : 'They fell — but not in one throw',
          clean
            ? itemName(s.prize) + ' flies into the treasure book.'
            : 'The prize wanted a single clean dunk. Another penny for another bead.',
          {prize: clean ? s.prize : null, won: clean});
      }
    } else if (!s.won && !s.lost && s.dunk < 0 && !s.ball && s.throws >= s.limit && s.plates.some(p => !p.fallen)) {
      s.lost = true;
      const left = s.plates.filter(p => !p.fallen).length;
      done(s, 'The seat stays dry',
        left + ' plate' + (left === 1 ? '' : 's') + ' still hanging. Another penny for another throw.', {won: false});
    }
  },
  pointer(s, type, p) {
    if (s.won || s.lost || s.dunk >= 0) return;
    if (type === 'move' || type === 'down') s.aim = {x: clamp(p.x, 210, 690), y: clamp(p.y, 380, 900)};
    if (type === 'up') toss(s);
  },
  action(s, id) { if (id === 'throw') toss(s); },
  key(s, k, down) { if (k === ' ' && down) toss(s); },
  draw(s, d) {
    const c = d.c;
    d.poly([[70, 108], [250, 108], [250, 292], [70, 292]], '#4a3424cc', '#e4c48a', 2);
    d.text('this bath', 160, 130, 13, '#ead6a4');
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
    d.poly([[342, 810], [342, 915], [558, 915], [558, 810]], '#508b89', '#d4b987', 4);
    d.ellipse(450, 810, 108, 38, '#49847f', '#e4c48d', 6);
    d.line({x: 363, y: 795}, {x: 363, y: 535}, '#b79b6d', 8);
    d.line({x: 537, y: 795}, {x: 537, y: 535}, '#b79b6d', 8);
    d.line({x: 365, y: 535}, {x: 535, y: 535}, '#dfc28b', 5);
    const a = s.dunk < 0 ? 0 : Math.min(1.5, s.dunk * 4);
    d.line({x: 395, y: 635}, {x: 395 + Math.cos(a) * 108, y: 635 + Math.sin(a) * 108}, '#af8057', 14);
    const duckY = s.dunk < 0
      ? 610 + Math.sin(s.t * 2) * 2
      : s.dunk < .65 ? 610 + 420 * s.dunk * s.dunk : 770 + Math.sin(s.dunk * 5) * 5;
    c.save(); c.beginPath(); c.rect(300, 400, 300, 420); c.clip();
    d.item(spriteKey('crowned-duck'), 450, duckY, {
      w: 110, fallback: () => d.animal(450, duckY, 'duck', 1.65, s.t),
    });
    d.ring(450, duckY + 10, 28, '#e7c786', 8);
    c.restore();
    d.ellipse(450, 817, 104, 24, '#70bab988');
    for (let i = 0; i < 8; i++) d.line({x: 355 + i * 27, y: 837}, {x: 355 + i * 27, y: 909}, '#91bdaf44', 2);
    for (const t of s.towers) {
      const w = t.n * 28 + 18;
      d.line({x: t.x - w, y: t.y + 8}, {x: t.x + w, y: t.y + 8}, '#8a6a48', 14);
      d.line({x: t.x - w, y: t.y + 2}, {x: t.x + w, y: t.y + 2}, '#e1c294', 4);
    }
    let focus = null, best = 1e9;
    if (s.dunk < 0 && !s.won && !s.lost) {
      for (const p of s.plates) if (!p.fallen) {
        const q = dist(s.aim, p);
        if (q < best) { best = q; focus = p; }
      }
    }
    for (const p of s.plates) {
      if (p === focus) d.glow(p.x, p.y, 52, '#e9c787');
      d.circle(p.x, p.y, 28, p.fallen ? '#b9b985' : '#ba6c59', '#ead0a0', 4);
      d.circle(p.x, p.y, 15, null, '#f2d8aa', 3);
      d.circle(p.x, p.y, 5, '#eee0b0');
    }
    if (s.guardOn) {
      d.line({x: 450, y: 735}, s.guard, '#c0a16e', 3);
      d.ring(s.guard.x, s.guard.y, 32, '#bc7769', 13);
    }
    if (s.dunk > .65) {
      const t = s.dunk - .65;
      for (let i = 0; i < 18; i++) {
        const angle = i * TAU / 18, x = 450 + Math.cos(angle) * 130 * t, y = 800 - 220 * t + 220 * t * t + Math.sin(angle) * 50 * t;
        if (y < 930) d.poly([[x, y - 8], [x + 5, y + 4], [x - 5, y + 4]], '#caeeea', '#f6f2c4', 1);
      }
    }
    const bead = (x, y, w) => d.item(spriteKey('mercury-bead'), x, y, {
      w, fallback: () => d.ball(x, y, w * .45, '#b79768'),
    });
    if (s.ball) bead(s.ball.x, s.ball.y, 32);
    else if (s.dunk < 0 && !s.won && !s.lost && s.throws < s.limit) {
      const t = .75, vx = (s.aim.x - 450) / t, vy = (s.aim.y - 1050 - 240 * t * t) / t;
      for (let i = 1; i <= 14; i++) {
        const u = t * i / 14;
        d.circle(450 + vx * u, 1050 + vy * u + 240 * u * u, 2.2, '#77674499');
      }
      bead(450, 1050, 40);
      d.ring(s.aim.x, s.aim.y, 17, '#af8056', 2);
    }
  },
  readout: s => {
    const down = s.plates.filter(p => p.fallen).length;
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice beads' : n + (n === 1 ? ' penny' : ' pennies') + ' in the purse';
    return down + ' / ' + s.plates.length + ' plates · ' + s.throws + '/' + s.limit + ' throws · ' + purse + ' · ' + s.note;
  },
};
