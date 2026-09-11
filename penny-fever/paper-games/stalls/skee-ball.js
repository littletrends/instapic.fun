import {clamp, dist, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, credit, keep, owned} from '../wallet.js?v=skip-moonbow-2';

const SETS = [
  {prize: 'moon-penny', target: ['10'], r10: 78, r30: 52, r50: 40, r100: 34,
    cue: 'A gentle roll into the nearest moon. Softer than a medium skip.'},
  {prize: 'star-token', target: ['30'], r10: 64, r30: 50, r50: 38, r100: 32,
    cue: 'A medium lift. Let it kiss the silver cup in the middle.'},
  {prize: 'pegboard-star', target: ['50'], r10: 58, r30: 42, r50: 38, r100: 30,
    cue: 'A stronger roll into the high 50. Too little and it drops short.'},
  {prize: 'ride-ticket', target: ['100'], r10: 52, r30: 38, r50: 32, r100: 34,
    cue: 'Steer for either 100 moon. Power and a little English.'},
  {prize: 'ride-stamp-book', target: ['left'], r10: 50, r30: 36, r50: 30, r100: 28,
    cue: 'The left-hand 100 only. Hold the angle; do not over-skip.'},
  {prize: 'summer-sun-pin', target: ['needle'], r10: 46, r30: 32, r50: 28, r100: 26, needle: true,
    cue: 'The tiny top moon. A still, strong roll — no sideways wander.'},
];

function wanted(set, hole) {
  return set.target.includes(String(hole.score)) || set.target.includes(hole.id);
}

function build(level) {
  const set = SETS[level] || SETS[0];
  const holes = [
    {x: 450, y: 700, r: set.r10, score: 10, id: '10', name: 'nearest moon'},
    {x: 450, y: 565, r: set.r30, score: 30, id: '30', name: 'silver cup'},
    {x: 450, y: 445, r: set.r50, score: 50, id: '50', name: 'high 50'},
    {x: 310, y: 470, r: set.r100, score: 100, id: 'left', name: 'left-hand 100'},
    {x: 590, y: 470, r: set.r100, score: 100, id: 'right', name: 'right-hand 100'},
  ];
  if (set.needle) holes.push({x: 450, y: 368, r: 20, score: 200, id: 'needle', name: 'needle of moonlight'});
  for (const h of holes) h.want = wanted(set, h);
  const hung = holes.filter(h => h.want).map(h => h.name).join(' or ');
  return {holes, prize: set.prize, limit: 1, hung, cue: set.cue};
}

function roll(s) {
  if (s.ball || s.won || s.lost) return;
  if (s.throws >= s.limit) {
    s.note = 'That moon is spent. Another penny for another roll.';
    return;
  }
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny in the purse. Bank loan, or cash a ticket.';
      return;
    }
  }
  s.ball = {
    x: 450, y: 1030, z: 0,
    vx: Math.sin(s.angle) * s.power,
    vy: -Math.cos(s.angle) * s.power,
    vz: 0, air: false, age: 0,
  };
  s.throws++;
  s.drag = false;
  s.note = alleyPlay
    ? 'Throw ' + s.throws + ' of ' + s.limit + ' · a penny a roll. Find ' + s.hung + '.'
    : 'Practice roll. Find ' + s.hung + '.';
}

function settle(s, hole) {
  if (s.won || s.lost) return;
  if (hole) {
    s.ball = {x: hole.x, y: hole.y, z: 6, vx: 0, vy: 0, vz: 0, air: true, age: 0, sunk: true};
    s.landed = hole;
  } else {
    s.ball = null;
    s.landed = {miss: true};
  }
  s.settle = 0;
}

function fly(s, id, x, y, prize) {
  s.fly.push({id, x, y, t: 0, dur: 0.7, prize: !!prize});
}
function drip(s, hole) {
  if (!hole || !alleyPlay) return;
  if (hole.score >= 50) {
    keep('star-token', 'skee-ball');
    fly(s, 'star-token', hole.x, hole.y, true);
    s.note = 'A star from the silver — not the hanging moon.';
  } else if (hole.score >= 30 && Math.random() < 0.28) {
    credit(1);
    fly(s, 'everyday-penny', hole.x, hole.y, false);
    s.note = 'A penny back. The hanging moon still waits.';
  }
}
function judge(s) {
  if (s.won || s.lost) return;
  const hole = s.landed && !s.landed.miss ? s.landed : null;
  if (hole && hole.want) {
    s.won = true;
    fly(s, s.prize, hole.x, hole.y, true);
    if (alleyPlay && s.prize) keep(s.prize, 'skee-ball');
    done(s, 'The moon caught it',
      itemName(s.prize) + ' flies into the treasure book.',
      {prize: s.prize, won: true});
    s.note = itemName(s.prize) + ' is yours.';
    return;
  }
  drip(s, hole);
  s.lost = true;
  const detail = hole
    ? 'It found the ' + hole.name + '. Skip wanted ' + s.hung + '. Another penny for another roll.'
    : 'It rolled past the moons. Another penny for another roll.';
  done(s, hole ? 'Not that moon' : 'Past the moonbow', detail, {won: false});
  if (!s.note || s.note.indexOf('star') < 0 && s.note.indexOf('penny back') < 0) s.note = detail;
}

export default {
  title: 'Moonbow Alley',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: alleyPlay
    ? 'Skip’s moonbow alley. Six moons, one keepsake each. A penny a roll. Land the hanging moon and the prize is yours. Silver cups sometimes drip a star; the thirty can toss a penny back. Cash a booth ticket for a five-penny stack.'
    : 'Workshop moonbow. One practice roll. Land the hanging moon to finish the chapter.',
  instructions: alleyPlay
    ? 'Pull back to set lift, drift left or right for English, then release. Or Left/Right for angle, Up/Down for power, Space to roll. One penny a roll. Only the hanging moon stamps this chapter. Stars can drip from the silver cups. Cash a booth ticket for a five-penny stack.'
    : 'One practice roll. Pull back for lift, drift for English, and land in the hanging moon to finish the chapter.',
  liveTitle: 'Moonbow Alley',
  liveDetail: alleyPlay
    ? 'A penny a roll. Hit the hanging moon for this chapter’s prize. Stars live in the silver cups.'
    : 'One practice roll. Hit the hanging moon.',
  liveButton: 'Step up to the moonbow',
  tableDetail: alleyPlay
    ? 'A penny a roll. Only the hanging moon stamps this chapter’s prize. Silver cups sometimes drip a star. Cash a booth ticket for a five-penny stack.'
    : 'One practice roll. Land the hanging moon.',
  levels: ['The moonbow bowls', 'The narrow silver cups', 'Two high moons', 'The shrinking silver', 'Tight little moons', 'A needle of moonlight'],
  sprites: ['moon-penny', 'star-token', 'pegboard-star', 'ride-ticket', 'ride-stamp-book', 'summer-sun-pin', 'penny-purse', 'everyday-penny'],
  prizes: SETS.map(s => s.prize),
  actions: [
    {id: 'less', label: 'Softer roll'},
    {id: 'roll', label: alleyPlay ? 'Roll · 1 penny' : 'Roll moon penny'},
    {id: 'more', label: 'Stronger roll'},
  ],
  create(level) {
    const built = build(level);
    return {
      ...built,
      level, t: 0, angle: 0, power: 390, ball: null, throws: 0, drag: false,
      won: false, lost: false, landed: null, settle: 0, fly: [],
      note: alleyPlay
        ? 'One penny. One roll. ' + built.cue
        : 'One practice roll. ' + built.cue,
    };
  },
  update(s, dt, input) {
    s.t += dt;
    for (const f of s.fly) f.t += dt;
    s.fly = (s.fly || []).filter(f => f.t < f.dur);
    if (s.landed && !s.won && !s.lost) {
      s.settle += dt;
      if (s.ball && s.ball.sunk) s.ball.z = Math.max(0, 6 - s.settle * 10);
      if (s.settle > 0.7) judge(s);
      return;
    }
    if (!s.ball) {
      s.angle = clamp(s.angle + ((input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0)) * .42 * dt, -.5, .5);
      s.power = clamp(s.power + ((input.keys.has('ArrowUp') ? 1 : 0) - (input.keys.has('ArrowDown') ? 1 : 0)) * 120 * dt, 240, 550);
      return;
    }
    const p = s.ball;
    p.age += dt;
    for (let i = 0; i < 4; i++) {
      const h = dt / 4;
      p.x += p.vx * h; p.y += p.vy * h;
      if (!p.air) {
        if (p.x < 303 || p.x > 597) { p.x = clamp(p.x, 303, 597); p.vx *= -.65; }
        if (p.y <= 820) { p.air = true; p.z = 5; p.vz = Math.abs(p.vy) * .45; }
      } else {
        p.vz -= 500 * h; p.z += p.vz * h;
        if (p.vz < 0 && p.z < 20) {
          const bowl = s.holes.find(b => dist(b, p) < b.r - 13);
          if (bowl) { settle(s, bowl); return; }
        }
        if (p.z < 0) { settle(s, null); return; }
      }
      if (p.y < 340 || p.x < 180 || p.x > 720 || p.age > 6) { settle(s, null); return; }
    }
  },
  pointer(s, type, p) {
    if (s.ball || s.won || s.lost) return;
    if (type === 'down' && dist(p, {x: 450, y: 1030}) < 85) s.drag = true;
    if (type === 'move' && s.drag) {
      s.power = clamp(250 + (p.y - 1030) * 1.8, 240, 550);
      s.angle = clamp((450 - p.x) / 200, -.5, .5);
    }
    if (type === 'up' && s.drag) roll(s);
    if (type === 'cancel') s.drag = false;
  },
  action(s, id) {
    if (id === 'roll') roll(s);
    if (s.ball || s.won || s.lost) return;
    if (id === 'less') s.power = clamp(s.power - 20, 240, 550);
    if (id === 'more') s.power = clamp(s.power + 20, 240, 550);
  },
  key(s, k, down) { if (k === ' ' && down) roll(s); },
  draw(s, d) {
    d.poly([[70, 108], [250, 108], [250, 292], [70, 292]], '#4a3424cc', '#e4c48a', 2);
    d.text('this moon', 160, 130, 13, '#ead6a4');
    d.item(spriteKey(s.prize), 160, 188, {w: 84, fallback: () => d.star(160, 188, 28)});
    d.text(itemName(s.prize), 160, 246, 12, '#fff0cb');
    d.text((s.limit - s.throws) + ' roll' + (s.limit - s.throws === 1 ? '' : 's') + ' left', 160, 272, 12, '#f0d6a8');
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

    d.arc(450, 620, 210, Math.PI * 1.12, Math.PI * 1.88, '#c9a56a44', 10);
    d.arc(450, 620, 186, Math.PI * 1.15, Math.PI * 1.85, '#ead6a433', 4);

    for (const b of s.holes) {
      d.ellipse(b.x + 5, b.y + 12, b.r + 8, (b.r + 8) * .72, '#283c4d55');
      d.ellipse(b.x, b.y, b.r, b.r * .72, b.want ? '#3a4a38' : '#314052', b.want ? '#f0d49a' : '#dbbe88', b.want ? 9 : 7);
      d.ellipse(b.x, b.y + 8, b.r - 14, (b.r - 14) * .67, '#706551', '#ae966c', 2);
      if (b.want) {
        d.glow(b.x, b.y, b.r + 18, '#f0d49a');
        d.item(spriteKey(s.prize), b.x, b.y - 2, {
          w: Math.min(42, b.r), shadow: false, fallback: () => d.star(b.x, b.y, 14),
        });
      } else if (b.score >= 50) {
        d.item(spriteKey('star-token'), b.x, b.y, {
          w: 22, shadow: false, fallback: () => d.text(b.score, b.x, b.y + 8, 21, '#e5cc98'),
        });
      }
      d.text(b.score, b.x, b.y + (b.want || b.score >= 50 ? 22 : 8), 18, b.want ? '#fff4d0' : '#e5cc98');
    }

    d.poly([[290, 1060], [610, 1060], [610, 870], [575, 804], [325, 804], [290, 870]], '#687b8d', '#d1b486', 4);
    d.poly([[300, 870], [600, 870], [575, 804], [325, 804]], '#a3a5a0', '#edcea0', 2);
    for (let x = 325; x <= 575; x += 50) d.line({x, y: 1050}, {x, y: 866}, '#b3b29b55', 1);
    d.line({x: 300, y: 1050}, {x: 300, y: 872}, '#e4c798', 5);
    d.line({x: 600, y: 1050}, {x: 600, y: 872}, '#e4c798', 5);

    const p = s.ball || {x: 450, y: 1030, z: 0};
    d.ellipse(p.x + 4, p.y + 8, 17, 9, '#1f344766');
    d.item(spriteKey('moon-penny'), p.x, p.y - p.z, {
      w: p.sunk ? 26 : 34, fallback: () => d.ball(p.x, p.y - p.z, p.sunk ? 13 : 17, '#b28b62'),
    });
    if (!s.ball && !s.won && !s.lost && s.throws < s.limit) {
      const end = {x: 450 + Math.sin(s.angle) * 135, y: 1030 - Math.cos(s.angle) * 135};
      d.line({x: 450, y: 1000}, end, '#efd09b', 3);
      d.ring(end.x, end.y, 14, '#a17955', 2);
      d.text('LIFT ' + Math.round((s.power - 240) / 310 * 100) + '%', 450, 1110, 17, '#f0d9ae');
    }
    for (const f of (s.fly || [])) {
      const u = Math.min(1, f.t / f.dur), e = 1 - (1 - u) * (1 - u);
      const destX = f.prize ? 160 : 790, destY = f.prize ? 188 : 160;
      d.item(spriteKey(f.id), f.x + (destX - f.x) * e, f.y + (destY - f.y) * e, {
        w: 28 * (1 - u * 0.35),
        fallback: () => d.star(f.x + (destX - f.x) * e, f.y + (destY - f.y) * e, 10, '#f4e2a8'),
      });
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice rolls' : n + (n === 1 ? ' penny' : ' pennies') + ' in the purse';
    return s.throws + '/' + s.limit + ' rolls · ' + purse + ' · ' + s.note;
  },
};
