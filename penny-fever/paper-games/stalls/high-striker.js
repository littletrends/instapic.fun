import {clamp, done} from '../draw.js?v=ink-1';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, owned} from '../wallet.js?v=magnus-foundry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const SETS = [
  {prize: 'mighty-mallet', bell: 780, window: 38, drift: 0, decoys: [], heat: 0},
  {prize: 'bell-bracelet', bell: 680, window: 30, drift: 0, decoys: [820], heat: 0},
  {prize: 'bell-of-bravery', bell: 600, window: 26, drift: 16, decoys: [780, 700], heat: .35},
  {prize: 'perfect-play-medal', bell: 560, window: 22, drift: 20, decoys: [800, 700, 640], heat: .55},
  {prize: 'midway-master-crown', bell: 520, window: 20, drift: 26, decoys: [820, 720, 640, 580], heat: .75},
  {prize: 'foundry-spark', bell: 500, window: 17, drift: 30, decoys: [830, 740, 660, 590], heat: 1},
];

function peak(s) { return 1000 - (70 + 460 * (-s.angle / 1.45)); }
function mark(s) {
  if (!s.drift) return s.bell;
  return clamp(s.bell + Math.sin(s.t * (1.12 + s.level * .14)) * s.drift, 480, 860);
}
function build(level) {
  const set = SETS[level] || SETS[0];
  return {
    prize: set.prize, bell: set.bell, window: set.window, drift: set.drift,
    decoys: set.decoys.slice(), heat: set.heat, limit: 1,
  };
}
function strike(s) {
  if (s.flying || s.won || s.lost) return;
  if (s.throws >= s.limit) {
    s.note = 'That swing is spent. Another penny for another strike.';
    return;
  }
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny in the purse. Bank loan, or cash a ticket.';
      return;
    }
  }
  s.flying = true;
  s.y = 1000;
  s.vy = -Math.sqrt(1000 * (1000 - peak(s)));
  s.throws++;
  s.judged = false;
  s.hit = false;
  s.swing = s.angle;
  s.angle = -.1;
  s.hold = false;
  s.drag = false;
  s.note = alleyPlay ? 'A penny on the clapper. The tower will tell.' : 'The practice hammer flies.';
}

export default {
  title: 'Bellfoundry',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: 'Magnus does not want brute force. One penny, one strike. Land the mercury weight on the lit mouth and the foundry keepsake is yours. Miss the bronze and he keeps the bell.',
  instructions: alleyPlay
    ? 'Lift the mallet until the peak pointer kisses the glowing mouth, then release (one penny a swing). The prize only rings if that single strike lands on the lit bell. A miss means another penny. Drag the head, hold Lift then release, or Up/Down and Space.'
    : 'One practice swing. Land the mercury weight on the lit bell to finish the chapter. Drag the mallet head, or Up/Down and Space.',
  tableDetail: alleyPlay
    ? 'Six foundry mouths. A penny a swing. Ring the lit bell and Magnus stamps the keepsake. Walk away whenever you like — the book keeps what you won.'
    : 'A practice foundry. Ring the lit bell to finish the chapter.',
  levels: ['The apprentice peal', 'Bracelet height', 'A restless clapper', 'Four mouths, one true', 'A wandering peal', 'The grand foundry'],
  sprites: ['mighty-mallet', 'bell-of-bravery', 'mercury-bead', 'bell-bracelet', 'perfect-play-medal', 'midway-master-crown', 'ride-explorer-pennant', 'penny-purse', 'everyday-penny'],
  prizes: SETS.map(s => s.prize),
  actions: [
    {id: 'lift', label: alleyPlay ? 'Lift · 1 penny on release' : 'Hold to lift · release to strike', hold: true},
    {id: 'strike', label: alleyPlay ? 'Strike · 1 penny' : 'Strike the clapper'},
  ],
  create(level) {
    const s = {
      ...build(level),
      level, t: 0, angle: -.1, swing: 0, hold: false, drag: false, flying: false,
      y: 1000, vy: 0, throws: 0, judged: false, hit: false, flash: 0,
      won: false, lost: false,
      note: alleyPlay ? 'One penny. One strike. Kiss the lit mouth, or the prize stays.' : 'One practice swing. Ring the lit mouth.',
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    s.flash = Math.max(0, s.flash - dt);
    s.swing += (0 - s.swing) * Math.min(1, dt * 15);
    if (s.won || s.lost) return;
    if (!s.flying) {
      const lift = s.hold || input.actions.has('lift');
      const up = input.keys.has('ArrowUp');
      const down = input.keys.has('ArrowDown');
      s.angle = clamp(s.angle + ((lift || up) ? -.64 : down ? .64 : 0) * dt, -1.45, 0);
      if (s.heat && s.angle < -1.16) {
        s.angle = clamp(s.angle + Math.sin(s.t * 7.4) * s.heat * .55 * dt, -1.45, 0);
      }
      return;
    }
    const old = s.vy;
    s.vy += 500 * dt;
    s.y += s.vy * dt;
    if (old < 0 && s.vy >= 0 && !s.judged) {
      s.judged = true;
      const target = mark(s);
      const error = Math.abs(s.y - target);
      if (error < s.window) {
        s.hit = true;
        s.flash = 1.4;
        s.note = 'The foundry answers.';
      } else {
        s.hit = false;
        s.note = s.y < target ? 'Over the mouth. Too much muscle.' : 'Short of the bronze. A little more lift.';
      }
    }
    if (s.y < 1000) return;
    s.y = 1000;
    s.flying = false;
    if (!s.judged) return;
    if (s.hit) {
      s.won = true;
      if (alleyPlay && s.prize) keep(s.prize, 'high-striker');
      takePrize(s, s.prize);
      done(s, 'A note fit for the foundry',
        itemName(s.prize) + ' flies into the treasure book.',
        {prize: s.prize, won: true});
    } else {
      s.lost = true;
      done(s, 'The bronze stays quiet',
        alleyPlay
          ? 'That swing is spent. Another penny for another strike.'
          : 'The clapper never kissed the mouth. Try this foundry again.',
        {won: false});
    }
  },
  pointer(s, type, p) {
    if (s.flying || s.won || s.lost) return;
    if (type === 'down' && p.x > 400 && p.y > 720) s.drag = true;
    if (type === 'move' && s.drag) s.angle = clamp(Math.atan2(p.y - 980, p.x - 440), -1.45, 0);
    if (type === 'up' && s.drag) { s.drag = false; strike(s); }
    if (type === 'cancel') { s.drag = false; s.hold = false; }
  },
  action(s, id, pressed) {
    if (id === 'lift') { s.hold = pressed; if (!pressed) strike(s); }
    if (id === 'strike' && pressed) strike(s);
  },
  key(s, k, down) { if (k === ' ' && down) strike(s); },
  draw(s, d) {

    d.text((s.limit - s.throws) + ' strike' + (s.limit - s.throws === 1 ? '' : 's') + ' left', 160, 272, 12, '#f0d6a8');
    for (let i = 0; i < SETS.length; i++) {
      const x = 92 + (i % 3) * 52, y = 330 + Math.floor(i / 3) * 58;
      const got = owned(SETS[i].prize) || (s.won && i === s.level);
      d.item(spriteKey(SETS[i].prize), x, y, {w: 36, fallback: () => d.star(x, y, 12)});
      if (got) d.text('✓', x + 14, y - 10, 16, '#f6e2a2');
      else d.circle(x, y, 20, '#1a120866');
    }
    const n = alleyPlay ? (pocket() ?? 0) : '∞';

    d.poly([[365, 390], [405, 390], [405, 1010], [365, 1010]], '#985d46', '#dcb477', 3);
    d.line({x: 385, y: 408}, {x: 385, y: 990}, '#e4c68e', 4);
    for (let y = 430; y < 1000; y += 35) d.line({x: 372, y}, {x: 385, y}, '#c59c67', 2);

    const target = mark(s);
    const bellAt = (y, lit, rung) => {
      d.line({x: 405, y: y - 25}, {x: 497, y: y - 25}, '#967144', 4);
      if (lit) d.glow(492, y, 55, '#e9c67e');
      d.item(spriteKey('bell-of-bravery'), 492, y, {
        w: rung ? 58 : lit ? 54 : 46, alpha: rung ? 1 : lit ? .95 : .55,
        fallback: () => {
          d.poly([[470, y + 11], [477, y - 21], [490, y - 34], [504, y - 21], [513, y + 11]],
            rung || lit ? '#f1d18c' : '#b79358', '#eac88a', 3);
          d.ellipse(492, y + 12, 26, 6, '#8d724b', '#eec889', 2);
          d.ball(492, y + 19, 5, '#d8b16b');
        },
      });
    };
    for (const y of s.decoys) bellAt(y, false, false);
    bellAt(target, !s.lost, s.hit || s.won);
    if (!s.lost) {
      d.item(spriteKey(s.prize), 575, target, {
        w: 42, alpha: s.won ? 1 : .9,
        fallback: () => d.star(575, target, 14),
      });
    }

    if (!s.flying && !s.won && !s.lost && s.throws < s.limit) {
      const py = peak(s);
      d.poly([[340, py], [355, py - 8], [355, py + 8]], '#f2d39b', '#967240');
      d.text('peak', 310, py + 5, 15, '#785541');
    }

    d.item(spriteKey('mercury-bead'), 385, s.y, {
      w: 38, fallback: () => d.ball(385, s.y, 18, '#b7b4a5'),
    });
    d.ellipse(410, 1015, 72, 20, '#a77d54', '#edca8b', 4);
    d.line({x: 385, y: 1000}, {x: 480, y: 1000}, '#d5b37d', 12);
    const angle = s.flying ? s.swing : s.angle;
    const head = {x: 440 + Math.cos(angle) * 180, y: 980 + Math.sin(angle) * 180};
    d.line({x: 440, y: 980}, head, '#775336', 14);
    d.line({x: 440, y: 975}, {x: head.x, y: head.y - 5}, '#b28a56', 4);
    d.item(spriteKey('mighty-mallet'), head.x, head.y, {
      w: 92, angle: angle + Math.PI / 2,
      fallback: () => {
        const c = d.c; c.save(); c.translate(head.x, head.y); c.rotate(angle + Math.PI / 2);
        d.poly([[-40, -23], [40, -23], [40, 23], [-40, 23]], '#a7784c', '#e0bc83', 3);
        for (const x of [-23, 23]) d.line({x, y: -24}, {x, y: 24}, '#dcc39b', 7);
        d.star(0, 0, 14); c.restore();
      },
    });
    if (s.flash) d.arc(492, target || 500, 65, 0, Math.PI * 2, '#f5d69a88', 2);
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice swings' : n + (n === 1 ? ' penny' : ' pennies') + ' in the purse';
    return (s.hit || s.won ? 'rung' : 'quiet') + ' · ' + s.throws + '/' + s.limit + ' strikes · ' + purse + ' · ' + s.note;
  },
};
