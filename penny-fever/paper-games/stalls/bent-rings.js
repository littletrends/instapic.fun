import {clamp, dist, done} from '../draw.js?v=ink-1';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, owned} from '../wallet.js?v=ringo-orchard-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const HAND = {x: 450, y: 1030};
const FLIGHT = 1.12;
const GRAV = 540;
const CATCH_Z = 44;
const T_CATCH = (340 + Math.sqrt(340 * 340 - 4 * 270 * 34)) / 540;

const SETS = [
  {prize: 'lucky-ring-trio', throws: 1, radius: 36, sway: 0, bob: 0, freq: .7, wish: 0,
    pegs: [{bx: 450, by: 620}]},
  {prize: 'splash-ring', throws: 1, radius: 34, sway: 26, bob: 10, freq: .75, wish: 0,
    pegs: [{bx: 450, by: 600}]},
  {prize: 'wishing-acorn', throws: 1, radius: 32, sway: 32, bob: 12, freq: .85, wish: 1,
    pegs: [{bx: 310, by: 680}, {bx: 590, by: 560}]},
  {prize: 'twig-ring', throws: 1, radius: 30, sway: 38, bob: 14, freq: .95, wish: 3,
    pegs: [{bx: 280, by: 720}, {bx: 450, by: 740}, {bx: 630, by: 710}, {bx: 450, by: 530}]},
  {prize: 'orchard-circlet', throws: 1, radius: 28, sway: 46, bob: 16, freq: 1.05, wish: 5,
    pegs: [
      {bx: 260, by: 750}, {bx: 450, by: 770}, {bx: 650, by: 745},
      {bx: 330, by: 610}, {bx: 570, by: 600}, {bx: 450, by: 490},
    ]},
  {prize: 'ring-toss-ribbon', throws: 1, radius: 26, sway: 58, bob: 20, freq: 1.2, wish: 6,
    pegs: [
      {bx: 250, by: 760}, {bx: 390, by: 780}, {bx: 540, by: 775}, {bx: 680, by: 750},
      {bx: 320, by: 610}, {bx: 560, by: 590}, {bx: 450, by: 470},
    ]},
];

function landAt(aim) {
  const k = T_CATCH / FLIGHT;
  return {x: HAND.x + (aim.x - HAND.x) * k, y: HAND.y + (aim.y - HAND.y) * k};
}

function swayPeg(p, i, t, set) {
  p.x = clamp(p.bx + Math.sin(t * set.freq + i * 1.5) * set.sway, 200, 700);
  p.y = clamp(p.by + Math.cos(t * set.freq * .7 + i) * set.bob, 450, 860);
}

function build(level) {
  const set = SETS[level] || SETS[0];
  const pegs = set.pegs.map((p, i) => {
    const peg = {bx: p.bx, by: p.by, x: p.bx, y: p.by, hit: false, wish: i === set.wish};
    swayPeg(peg, i, 0, set);
    return peg;
  });
  return {pegs, prize: set.prize, limit: set.throws, radius: set.radius, set};
}

function toss(s) {
  if (s.ring || s.won || s.lost) return;
  if (s.throws >= s.limit) {
    s.note = 'That ring is spent. Another penny for another toss.';
    return;
  }
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny in the purse. Bank loan, or cash a ticket.';
      return;
    }
  }
  s.ring = {
    x: HAND.x, y: HAND.y, z: 10,
    vx: (s.aim.x - HAND.x) / FLIGHT,
    vy: (s.aim.y - HAND.y) / FLIGHT,
    vz: 340, age: 0, hit: false,
  };
  s.throws++;
  s.note = alleyPlay
    ? 'Toss ' + s.throws + ' of ' + s.limit + ' · a penny a ring. Seat the wishing branch.'
    : 'Practice toss. Seat the wishing branch.';
}

function seat(s, peg) {
  const r = s.ring;
  peg.hit = true;
  r.hit = true;
  r.x = peg.x;
  r.y = peg.y;
  r.z = CATCH_Z;
  r.vx = 0;
  r.vy = 0;
  r.vz = 0;
  s.settle = 0;
  if (peg.wish) s.note = 'A lovely clean catch on the wishing arm.';
  else s.note = 'Snagged a decoy. The wishing acorn still waits.';
}

function judge(s) {
  if (s.won || s.lost) return;
  const wish = s.pegs.find(p => p.wish && p.hit);
  if (wish) {
    s.won = true;
    if (alleyPlay && s.prize) keep(s.prize, 'bent-rings');
    takePrize(s, s.prize);
    done(s, 'A ring on the wishing branch',
      itemName(s.prize) + ' drops into the treasure book.',
      {prize: s.prize, won: true});
    s.note = itemName(s.prize) + ' is yours.';
    return;
  }
  s.lost = true;
  const decoy = s.pegs.some(p => p.hit);
  done(s,
    decoy ? 'The wrong branch kept it' : 'The ring kissed dirt',
    decoy
      ? 'Pretty brass, empty luck. Another penny for the wishing arm.'
      : 'Watch the landing shadow and lead the wishing branch. Another penny for another toss.',
    {won: false});
}

export default {
  title: 'The Ring Orchard',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: 'Ringo grows crooked little brass branches, each tipped with a wishing acorn. One penny, one ring. Seat it on the wishing branch — the one wearing the prize — and the keepsake is yours. A decoy or the dirt keeps the ring.',
  instructions: alleyPlay
    ? 'Aim at the wishing branch’s base, then toss (one penny a ring). The pale shadow is where the ring will really land — lead a moving arm so the shadow kisses the prize. Seat that branch in a single toss or Ringo keeps the orchard. Arrows aim, Space tosses.'
    : 'One practice ring. Put the landing shadow on the wishing branch — the one wearing the prize — to finish the chapter. Lead a moving arm; a decoy spends the toss.',
  levels: ['The still orchard', 'A gentle sway', 'Twin crooked arms', 'A crowded acorn night', 'The packed orchard', 'The orchard in a gale'],
  sprites: ['wishing-acorn', 'lucky-ring-trio', 'splash-ring', 'crown-turtle', 'paper-crown', 'friendship-pins', 'penny-purse', 'everyday-penny'],
  prizes: SETS.map(s => s.prize),
  actions: [{id: 'toss', label: alleyPlay ? 'Toss · 1 penny' : 'Toss brass ring'}],
  create(level) {
    const built = build(level);
    const s = {
      ...built,
      level, t: 0, aim: {x: 450, y: 610}, ring: null, throws: 0, settle: 0, won: false, lost: false,
      note: alleyPlay
        ? 'One penny. One ring. Seat the wishing branch, or the prize stays.'
        : 'One practice ring. Seat the wishing branch.',
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    const dx = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    const dy = (input.keys.has('ArrowDown') ? 1 : 0) - (input.keys.has('ArrowUp') ? 1 : 0);
    s.aim.x = clamp(s.aim.x + dx * 230 * dt, 220, 680);
    s.aim.y = clamp(s.aim.y + dy * 230 * dt, 470, 880);
    s.pegs.forEach((p, i) => { if (!p.hit) swayPeg(p, i, s.t, s.set); });
    if (s.ring) {
      const r = s.ring, oldZ = r.z;
      r.age += dt;
      if (!r.hit) {
        r.vz -= GRAV * dt;
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        r.z += r.vz * dt;
        if (oldZ > CATCH_Z && r.z <= CATCH_Z && r.vz < 0) {
          let best = null, bestD = s.radius;
          for (const p of s.pegs) {
            if (p.hit) continue;
            const d = dist(p, r);
            if (d < bestD) { bestD = d; best = p; }
          }
          if (best) seat(s, best);
        }
        if (r.z < 0) {
          r.z = 0;
          r.vz = 0;
          r.vx *= .4;
          r.vy *= .4;
        }
      }
      if (!r.hit && r.z <= 0 && r.age > 1.65) s.ring = null;
    }
    if (!s.won && !s.lost && s.ring?.hit) {
      s.settle += dt;
      if (s.settle > .85) judge(s);
    } else if (!s.won && !s.lost && !s.ring && s.throws >= s.limit) {
      judge(s);
    }
  },
  pointer(s, type, p) {
    if (type === 'move' || type === 'down') s.aim = {x: clamp(p.x, 220, 680), y: clamp(p.y, 470, 880)};
    if (type === 'up') toss(s);
  },
  action(s, id) { if (id === 'toss') toss(s); },
  key(s, k, down) { if (k === ' ' && down) toss(s); },
  draw(s, d) {
    d.poly([[70, 108], [250, 108], [250, 292], [70, 292]], '#4a3424cc', '#e4c48a', 2);
    d.text('this orchard', 160, 130, 13, '#ead6a4');
    d.item(spriteKey(s.prize), 160, 188, {w: 84, fallback: () => d.star(160, 188, 28)});
    d.text(itemName(s.prize), 160, 246, 12, '#fff0cb');
    d.text((s.limit - s.throws) + ' ring' + (s.limit - s.throws === 1 ? '' : 's') + ' left', 160, 272, 12, '#f0d6a8');
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

    const order = s.pegs.map((p, i) => i).sort((a, b) => s.pegs[a].y - s.pegs[b].y);
    for (const i of order) {
      const p = s.pegs[i];
      d.ellipse(p.x, p.y + 9, 49, 18, p.wish ? '#8a6a3ccc' : '#8c7854', p.wish ? '#f0d089' : '#cfaf75', 3);
      d.line({x: p.x, y: p.y}, {x: p.x + 6, y: p.y - 50}, '#9d754b', 12);
      d.line({x: p.x - 3, y: p.y}, {x: p.x + 3, y: p.y - 50}, '#e8c981', 4);
      d.leaf(p.x, p.y - 20, -.5, 33);
      if (p.wish) {
        d.glow?.(p.x + 6, p.y - 58, 36, '#edcd8b');
        d.item(spriteKey(s.prize), p.x + 6, p.y - 58, {
          w: 42, fallback: () => d.star(p.x + 6, p.y - 58, 16),
        });
      } else {
        d.item(spriteKey('wishing-acorn'), p.x + 6, p.y - 52, {
          w: 32, fallback: () => d.ball(p.x + 6, p.y - 50, 9, '#d8b573'),
        });
      }
      if (p.hit) d.item(spriteKey('lucky-ring-trio'), p.x, p.y - 8, {
        w: 54, fallback: () => d.ellipse(p.x, p.y - 5, 34, 14, null, '#f3d589', 7),
      });
    }

    if (s.ring) {
      const r = s.ring;
      d.ellipse(r.x, r.y + 5, 33, 13, '#243b2844');
      const tilt = 12 + Math.abs(Math.cos(r.age * 7)) * 13;
      d.ellipse(r.x, r.y - r.z, 35, tilt, null, '#8b7048', 10);
      d.ellipse(r.x - 2, r.y - r.z - 2, 35, tilt, null, '#f1d192', 6);
    } else if (!s.won && !s.lost && s.throws < s.limit) {
      const land = landAt(s.aim);
      d.ellipse(land.x, land.y, 28, 12, '#243b2833', '#fff0b966', 2);
      d.ellipse(s.aim.x, s.aim.y, 34, 14, null, '#fff0b999', 3);
      d.ring(HAND.x, HAND.y, 35, '#ecd08a', 8);
      d.line(HAND, s.aim, '#e9d6a944', 2);
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice rings' : n + (n === 1 ? ' penny' : ' pennies') + ' in the purse';
    const wish = s.pegs.some(p => p.wish && p.hit);
    const snag = s.pegs.some(p => p.hit);
    const on = wish ? 'wishing branch seated' : snag ? 'wrong branch' : 'no catch';
    return on + ' · ' + s.throws + '/' + s.limit + ' tosses · ' + purse + ' · ' + s.note;
  },
};
