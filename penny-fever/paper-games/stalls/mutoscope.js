import {clamp, lerp, done, TAU} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {pick} from '../chapter-kit.js';

const pos = i => ({x: 270 + (i % 3) * 180, y: 800 + Math.floor(i / 3) * 118});

function scene(d, level, u, x, y, scale = 1) {
  const c = d.c;
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  d.line({x: -185, y: 65}, {x: 185, y: 65}, '#918668', 5);
  if (level === 0) {
    d.item(spriteKey('moon-lantern'), 0, -8, {
      w: 88, shadow: false,
      fallback: () => d.ring(0, 0, 50, '#d4b279', 4),
    });
    const ax = -150 + u * 300, ay = 30 - Math.sin(u * Math.PI) * 130;
    d.item(spriteKey('moon-rabbit'), ax, ay, {
      w: 78, shadow: false,
      fallback: () => d.animal(ax, ay, 'rabbit', 1.25, u * 6),
    });
  } else if (level === 1) {
    d.leaf(-150, 60, -Math.PI / 3, 75);
    const bx = -140 + u * 280, by = 20 - Math.sin(u * Math.PI) * 90;
    d.item(spriteKey('singing-bird'), bx, by, {
      w: 72, shadow: false,
      fallback: () => d.animal(bx, by, 'bird', 1.3, u * 12),
    });
    d.item(spriteKey('trade-envelope'), 50, 40 - clamp((u - .45) * 150, 0, 100), {
      w: 48, shadow: false,
      fallback: () => d.envelope(50, 40 - clamp((u - .45) * 150, 0, 100), 14, '#ebd5ad', '♥'),
    });
  } else if (level === 2) {
    const fx = -140 + (u < .5 ? u * 560 : (1 - u) * 560);
    d.ring(140, 20, 25);
    d.item(spriteKey('dapper-fox'), fx, 40, {
      w: 78, shadow: false,
      fallback: () => d.animal(fx, 40, 'fox', 1.1, u * 8),
    });
    const keyX = u > .5 ? fx + 42 : 135, keyY = u > .5 ? 26 : 37;
    d.item(spriteKey('cabinet-key'), keyX, keyY, {
      w: 36, shadow: false,
      fallback: () => {
        d.ring(keyX, keyY, 9, '#d2ad62', 3);
        d.line({x: keyX + 6, y: keyY + 7}, {x: keyX + 23, y: keyY + 22}, '#d8b265', 4);
      },
    });
  } else if (level === 3) {
    const lx = Math.sin((u - .5) * Math.PI) * 130, ly = -18 + Math.abs(Math.cos((u - .5) * Math.PI)) * 36;
    d.item(spriteKey('moon-lantern'), lx, ly, {
      w: 74, shadow: false,
      fallback: () => d.ring(lx, ly, 42, '#d4b279', 4),
    });
    const rx = -130 + u * 260, ry = 38 - Math.sin(u * Math.PI * 2) * 22;
    d.item(spriteKey('moon-rabbit'), rx, ry, {
      w: 70, shadow: false,
      fallback: () => d.animal(rx, ry, 'rabbit', 1.15, u * 8),
    });
  } else if (level === 4) {
    const handed = u < .62;
    const fx = -150 + Math.min(u, .62) / .62 * 210;
    d.item(spriteKey('dapper-fox'), fx, 38, {
      w: 76, shadow: false,
      fallback: () => d.animal(fx, 38, 'fox', 1.08, u * 7),
    });
    const bx = handed ? 150 : fx + 48 + (u - .62) * 380;
    const by = handed ? 18 : 18 - (u - .62) * 140;
    d.item(spriteKey('singing-bird'), bx, by, {
      w: 64, shadow: false,
      fallback: () => d.animal(bx, by, 'bird', 1.15, u * 10),
    });
    const ex = handed ? fx + 40 : bx + 18, ey = handed ? 24 : by + 10;
    d.item(spriteKey('trade-envelope'), ex, ey, {
      w: 40, shadow: false,
      fallback: () => d.envelope(ex, ey, 12, '#ebd5ad', '♥'),
    });
  } else {
    const rx = -155 + u * 155, fx = 155 - u * 155;
    d.item(spriteKey('moon-rabbit'), rx, 36, {
      w: 68, shadow: false,
      fallback: () => d.animal(rx, 36, 'rabbit', 1.1, u * 6),
    });
    d.item(spriteKey('moon-lantern'), rx + 28, 4, {
      w: 42, shadow: false,
      fallback: () => d.ring(rx + 28, 4, 18, '#d4b279', 3),
    });
    d.item(spriteKey('dapper-fox'), fx, 38, {
      w: 72, shadow: false,
      fallback: () => d.animal(fx, 38, 'fox', 1.05, u * 7),
    });
    d.item(spriteKey('cabinet-key'), fx - 30, 18, {
      w: 32, shadow: false,
      fallback: () => d.ring(fx - 30, 18, 8, '#d2ad62', 3),
    });
    const bx = -140 + u * 280, by = -28 - Math.sin(u * Math.PI) * 36;
    d.item(spriteKey('singing-bird'), bx, by, {
      w: 58, shadow: false,
      fallback: () => d.animal(bx, by, 'bird', 1.05, u * 11),
    });
  }
  c.restore();
}
function choose(s, i) {
  if (s.picked === null) { s.picked = i; s.selected = i; }
  else {
    [s.order[i], s.order[s.picked]] = [s.order[s.picked], s.order[i]];
    s.picked = null; s.selected = i; s.swaps++;
    s.note = 'Run the reel and watch the movement.';
  }
}

export default {
  title: 'The Missing Frames',
  intro: 'Milo has dropped tomorrow’s moving picture. Put the scraps of film back in sequence and turn a jittery jumble into one lovely little story of catalogue treasures.',
  instructions: 'Tap one film frame, then another to swap them. Watch the large moving scene above; it follows your edited sequence. The story runs left-to-right, then down the rows. Arrows choose a frame, Space selects it, Enter runs the reel. A helpful splice places one frame if you get stuck.',
  levels: ['The rabbit and the moon', 'The flying post', 'A fox and a borrowed key', 'Lanterns after dark', 'The fox’s night post', 'A meeting of three'],
  sprites: ['moon-rabbit', 'singing-bird', 'dapper-fox', 'moon-lantern', 'trade-envelope', 'cabinet-key'],
  prizes: ['flicker-book', 'pocket-peepshow', 'memory-scrapbook'],
  actions: [{id: 'play', label: 'Run the reel'}, {id: 'choose', label: 'Select chosen frame'}, {id: 'hint', label: 'One helpful splice'}],
  create(level, rng) {
    const n = pick([6, 9, 9, 6, 9, 9], level), order = Array.from({length: n}, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (order.every((v, i) => v === i)) order.reverse();
    return {level, order, selected: 0, picked: null, swaps: 0, t: 0, reel: 0, checking: false, note: 'The reel is out of order.'};
  },
  update(s, dt) {
    s.t += dt; s.reel += dt;
    if (s.checking && s.reel > 5) {
      s.checking = false;
      if (s.order.every((v, i) => v === i)) done(s, 'The picture moves again', 'A whole little story restored in ' + s.swaps + ' splices. Milo is saving you a seat at the premiere.');
      else s.note = 'There is still a jump in the story. Follow the animal’s movement and what it carries.';
    }
  },
  pointer(s, type, p) {
    if (type !== 'down') return;
    const i = s.order.findIndex((_, i) => {
      const q = pos(i);
      return Math.abs(p.x - q.x) < 79 && Math.abs(p.y - q.y) < 48;
    });
    if (i >= 0) choose(s, i);
  },
  action(s, id) {
    if (id === 'play') { s.reel = 0; s.checking = true; }
    if (id === 'choose') choose(s, s.selected);
    if (id === 'hint') {
      const i = s.order.findIndex((v, i) => v !== i);
      if (i >= 0) {
        const j = s.order.indexOf(i);
        [s.order[i], s.order[j]] = [s.order[j], s.order[i]];
        s.selected = i; s.picked = null; s.swaps++;
      }
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ') choose(s, s.selected);
    else if (k === 'Enter') this.action(s, 'play');
    else {
      const delta = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3}[k];
      if (delta) s.selected = clamp(s.selected + delta, 0, s.order.length - 1);
    }
  },
  draw(s, d) {
    const n = s.order.length, f = (s.reel % 5) / 5 * (n - 1), i = Math.floor(f);
    const u = lerp(s.order[i], s.order[Math.min(i + 1, n - 1)], f - i) / (n - 1);
    d.poly([[210, 430], [690, 430], [690, 710], [210, 710]], '#e9d6b180', '#b59b6e', 4);
    scene(d, s.level, u, 450, 590, 1.05);
    for (let j = 0; j < n; j++) {
      const p = pos(j);
      d.poly([[p.x - 80, p.y - 50], [p.x + 80, p.y - 50], [p.x + 80, p.y + 50], [p.x - 80, p.y + 50]], '#4d4237', '#bfa273', 2);
      d.poly([[p.x - 68, p.y - 37], [p.x + 68, p.y - 37], [p.x + 68, p.y + 37], [p.x - 68, p.y + 37]], '#dbc6a2', null);
      scene(d, s.level, s.order[j] / (n - 1), p.x, p.y, .34);
      for (let x = -64; x < 70; x += 22) {
        d.circle(p.x + x, p.y - 44, 3, '#e9d5ad');
        d.circle(p.x + x, p.y + 44, 3, '#e9d5ad');
      }
      if (j === s.selected || j === s.picked)
        d.poly([[p.x - 83, p.y - 53], [p.x + 83, p.y - 53], [p.x + 83, p.y + 53], [p.x - 83, p.y + 53]], null, j === s.picked ? '#f6dd8f' : '#bc886b', 3);
    }
    for (const x of [230, 670]) {
      d.ring(x, 360, 34, '#b9955f', 5);
      for (let j = 0; j < 5; j++) {
        const a = j * TAU / 5 + s.reel;
        d.circle(x + Math.cos(a) * 20, 360 + Math.sin(a) * 20, 7, '#665440');
      }
      d.circle(x, 360, 5, '#e8c888');
    }
  },
  readout: s => s.swaps + ' splices · Frame ' + (s.selected + 1) + ' selected · ' + s.note,
};
