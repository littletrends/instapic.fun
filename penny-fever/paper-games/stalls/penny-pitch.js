import {clamp, dist, done} from '../draw.js?v=ink-1';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, owned} from '../wallet.js?v=penelope-wells-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const SETS = [
  {prize: 'well-wish-penny', xs: [450, 450, 450], drift: 0, window: .28, radius: 62,
    cue: 'Place the penny, send it, then skip as it kisses the water. Three still rings.'},
  {prize: 'skipping-stone', xs: [370, 500, 430], drift: 16, window: .24, radius: 56,
    cue: 'The rings wander. Steer between kisses, or hold a wish to still the water.'},
  {prize: 'well-coin', xs: [550, 410, 500], drift: 22, window: .22, radius: 52,
    cue: 'Night ripples. Skip closer to the kiss, and steer for the next ring.'},
  {prize: 'three-well-plaque', xs: [300, 430, 340], drift: 26, window: .20, radius: 48,
    cue: 'A zigzag of rings on the left garden. Place, skip, steer.'},
  {prize: 'wish-ribbon', xs: [600, 460, 580], drift: 32, window: .18, radius: 44,
    cue: 'The right-hand wells drift. Hold a wish when the water fidgets.'},
  {prize: 'well-claim', xs: [320, 460, 350], drift: 36, window: .16, radius: 40,
    cue: 'Moonlight’s last skip. Every ring in this one penny, or Penelope keeps the wish.'},
];

function wishing(input) {
  return !!(input?.actions?.has?.('wish') || input?.keys?.has?.('Shift'));
}

function build(level) {
  const set = SETS[level] || SETS[0];
  const wells = set.xs.map((x, i) => ({base: x, x, y: 840 - i * 155, hit: false}));
  return {
    wells, prize: set.prize, limit: 1,
    drift: set.drift, window: set.window, radius: set.radius, cue: set.cue,
  };
}

function send(s) {
  if (s.coin || s.won || s.lost || s.pending) return;
  if (s.throws >= s.limit) {
    s.note = 'That penny is spent. Another penny for another wish.';
    return;
  }
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny in the purse. Bank loan, or cash a ticket.';
      return;
    }
  }
  s.coin = {x: s.place, y: 1000, z: 10, vz: 130, vx: 0, touch: 0, skips: 0, resting: false};
  s.hits = 0;
  s.wells.forEach(w => { w.hit = false; });
  s.throws++;
  s.lastTap = -9;
  s.note = alleyPlay
    ? 'Throw ' + s.throws + ' of ' + s.limit + ' · a penny a skip. Meet the water.'
    : 'Practice skip. Meet the water.';
}

function skip(s) {
  if (s.won || s.lost || s.pending) return;
  if (!s.coin) {
    send(s);
    return;
  }
  const c = s.coin;
  if (c.resting) return;
  if (c.touch > 0) bounce(s);
  else s.lastTap = s.t;
}

function bounce(s) {
  const c = s.coin;
  if (!c || c.touch <= 0 || c.resting) return;
  c.touch = 0;
  c.vz = 130;
  c.z = 1;
  c.skips++;
  s.lastTap = -9;
  s.note = c.skips === 1 ? 'A clean little skip.' : 'Another skip, another ring.';
}

function sink(s, note) {
  if (s.coin) s.ripples.push({x: s.coin.x, y: s.coin.y, t: 0});
  s.coin = null;
  s.note = note;
}

function judge(s, won, title, detail) {
  if (s.won || s.lost || s.pending) return;
  s.pending = {won, title, detail};
  s.settle = 0;
}

function finish(s) {
  if (s.won || s.lost || !s.pending) return;
  const p = s.pending;
  if (p.won) {
    s.won = true;
    if (alleyPlay && s.prize) keep(s.prize, 'penny-pitch');
    takePrize(s, s.prize);
    done(s, p.title, p.detail, {prize: s.prize, won: true});
  } else {
    s.lost = true;
    done(s, p.title, p.detail, {won: false});
  }
  s.note = p.detail;
}

function land(s) {
  const c = s.coin;
  const w = s.wells[s.hits];
  s.ripples.push({x: c.x, y: c.y, t: 0});
  if (w && dist(c, w) < s.radius) {
    w.hit = true;
    s.hits++;
    if (s.hits === s.wells.length) {
      c.touch = 0;
      c.vz = 0;
      c.z = 0;
      c.resting = true;
      s.note = 'Every ring kept the wish.';
      judge(s, true, 'The well kept every wish',
        itemName(s.prize) + ' flies into the treasure book.');
      return;
    }
    c.touch = s.window * (s.wishHeld ? 1.45 : 1);
    if (s.t - s.lastTap < .22) bounce(s);
    else s.note = 'Ring ' + s.hits + ' of ' + s.wells.length + '. Skip as it kisses.';
    return;
  }
  sink(s, w
    ? 'The penny kissed the water beside the ring.'
    : 'The far bank took the penny.');
  judge(s, false, 'A wish slipped past',
    'The rings wanted every kiss in this one penny. Another penny for another skip.');
}

export default {
  title: 'Wishing Wells',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: 'Penelope knows a penny can do more than fall. One penny, one skip across the garden. Land every wishing ring in that single run and the keepsake is yours. Sink, or miss a ring, and she keeps the wish.',
  instructions: alleyPlay
    ? 'Place the penny, send it (one penny a skip), then tap Skip as it kisses the water. Hold Left/Right to steer between rings. Hold a wish to still the drift. The prize only flies if every ring is kissed in that one run. Space sends and skips.'
    : 'One practice skip. Place, send, then skip as the penny meets its shadow. Kiss every ring in that run to finish the chapter. Hold a wish to still the water.',
  tableDetail: alleyPlay
    ? 'Six little wells. A penny a skip. Kiss every ring in that one run and Penelope stamps the keepsake. Walk away whenever you like — the book keeps what you won.'
    : 'A practice garden. Kiss every ring in one skip-run to finish the chapter.',
  levels: ['Three still wishes', 'A wandering wish', 'Ripples after dark', 'A zigzag of rings', 'Wells on the drift', 'Six skips of moonlight'],
  sprites: ['everyday-penny', 'moon-penny', 'five-penny-stack', 'wishing-acorn', 'coin-album', 'stamp-passport', 'prize-claim', 'penny-purse'],
  prizes: SETS.map(s => s.prize),
  actions: [
    {id: 'left', label: 'Steer left', hold: true},
    {id: 'skip', label: alleyPlay ? 'Send / Skip · 1 penny' : 'Send / Skip · Space'},
    {id: 'right', label: 'Steer right', hold: true},
    {id: 'wish', label: 'Hold a wish', hold: true},
  ],
  create(level) {
    const built = build(level);
    const s = {
      ...built,
      level, t: 0, lastTap: -9, coin: null, hits: 0, throws: 0, ripples: [],
      place: built.wells[0].base, wishHeld: false, pending: null, settle: 0,
      won: false, lost: false,
      note: alleyPlay ? 'One penny. One skip. ' + built.cue : 'One practice skip. ' + built.cue,
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    s.wishHeld = wishing(input);
    const calm = s.wishHeld ? .32 : 1;
    const drift = s.drift * calm;
    for (const [i, w] of s.wells.entries()) {
      w.x = w.base + Math.sin(s.t * (.5 + s.level * .05) + i) * drift;
    }
    for (const r of s.ripples) r.t += dt;
    s.ripples = s.ripples.filter(r => r.t < 1.2);

    if (s.pending) {
      s.settle += dt;
      if (s.coin?.resting) s.coin.z = 0;
      if (s.settle > .7) finish(s);
      return;
    }

    const axis = (input.actions.has('right') || input.keys.has('ArrowRight') ? 1 : 0)
      - (input.actions.has('left') || input.keys.has('ArrowLeft') ? 1 : 0);
    if (!s.coin) {
      s.place = clamp(s.place + axis * 260 * dt, 200, 700);
      return;
    }

    const c = s.coin;
    c.vx += (axis * 240 - c.vx) * Math.min(1, dt * 5);
    if (c.resting) return;
    if (c.touch > 0) {
      if (s.t - s.lastTap < .22) bounce(s);
      else {
        c.touch -= dt;
        c.x = clamp(c.x + c.vx * dt * .35, 200, 700);
        if (c.touch <= 0) {
          sink(s, 'It sank gently. Skip a little closer to the water next penny.');
          judge(s, false, 'The penny sank',
            'The skip window closed. Another penny for another wish.');
        }
      }
      return;
    }
    c.x = clamp(c.x + c.vx * dt, 200, 700);
    c.y -= 155 * dt;
    c.vz -= 260 * dt;
    c.z += c.vz * dt;
    if (c.z <= 0) {
      c.z = 0;
      land(s);
      return;
    }
    if (c.y < 360 || c.skips > 5) {
      sink(s, 'The penny reached the far bank.');
      judge(s, false, 'The far bank took it',
        'Every ring wanted a kiss in this one run. Another penny for another skip.');
    }
  },
  pointer(s, type, p) {
    if (s.won || s.lost || s.pending) return;
    if ((type === 'move' || type === 'down') && !s.coin && p)
      s.place = clamp(p.x, 200, 700);
    if (type === 'down' && s.coin) skip(s);
    if (type === 'up' && !s.coin) send(s);
  },
  action(s, id) { if (id === 'skip') skip(s); },
  key(s, k, down) { if (k === ' ' && down) skip(s); },
  draw(s, d) {

    d.text((s.limit - s.throws) + ' skip' + (s.limit - s.throws === 1 ? '' : 's') + ' left', 160, 272, 12, '#f0d6a8');
    for (let i = 0; i < SETS.length; i++) {
      const x = 92 + (i % 3) * 52, y = 330 + Math.floor(i / 3) * 58;
      const got = owned(SETS[i].prize) || (s.won && i === s.level);
      d.item(spriteKey(SETS[i].prize), x, y, {w: 36, fallback: () => d.star(x, y, 12)});
      if (got) d.text('✓', x + 14, y - 10, 16, '#f6e2a2');
      else d.circle(x, y, 20, '#1a120866');
    }
    const n = alleyPlay ? (pocket() ?? 0) : '∞';

    for (const [i, w] of s.wells.entries()) {
      const target = i === s.hits && !w.hit;
      d.ellipse(w.x, w.y + 6, 62, 41, '#1d555544');
      d.ellipse(w.x, w.y, 62, 40, null, w.hit ? '#f4d990' : (target ? '#e8c56a' : '#bd9768'), target ? 7 : 6);
      d.ellipse(w.x, w.y, 49, 30, null, '#e7d0a0', 1);
      if (w.hit) d.item(spriteKey('moon-penny'), w.x, w.y, {w: 28, shadow: false, fallback: () => d.text('✓', w.x, w.y + 7, 22, '#f9e4b4')});
      else if (i === s.wells.length - 1) d.item(spriteKey(s.prize), w.x, w.y, {w: 30, shadow: false, fallback: () => d.star(w.x, w.y, 12)});
      else d.text(i + 1, w.x, w.y + 7, 22, '#f9e4b4');
      if (target) d.glow(w.x, w.y, s.wishHeld ? 78 : 65, '#ecd19a');
    }
    for (const r of s.ripples) d.ellipse(r.x, r.y, 12 + r.t * 70, 7 + r.t * 40, null, '#e5f4db88', 2);
    const c = s.coin;
    if (c) {
      d.ellipse(c.x, c.y + 5, 19, 7, '#164b5555');
      d.item(spriteKey('everyday-penny'), c.x, c.y - c.z, {
        w: 32, fallback: () => {
          d.ellipse(c.x, c.y - c.z, 17, 6 + Math.abs(Math.cos(s.t * 14)) * 8, '#d5b077', '#f6d995', 2);
          d.star(c.x, c.y - c.z, 7, '#f6dfa1');
        },
      });
      if (c.touch) d.text('SKIP', c.x, c.y + 49, 18, '#fff0b8');
    } else if (!s.won && !s.lost && s.throws < s.limit) {
      d.ring(s.place, 1025, 23, '#e6c48b', 9);
      d.item(spriteKey('everyday-penny'), s.place, 1000, {
        w: 32, fallback: () => d.ellipse(s.place, 1000, 17, 8, '#d5b077', '#f6d995', 2),
      });
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice skips' : n + (n === 1 ? ' penny' : ' pennies') + ' in the purse';
    return s.hits + ' / ' + s.wells.length + ' wishing rings · ' + s.throws + '/' + s.limit + ' skips · ' + purse + ' · ' + s.note;
  },
};
