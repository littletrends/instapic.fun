import {clamp, done} from '../draw.js?v=ink-1';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep} from '../wallet.js?v=booth-play-2';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  CHAPTERS, createGame, start, beginTurn, previewTurn, endTurn, nudge, undo, hint, refresh, pointOnRay, mirrorEnds,
} from '../../experiments/celestes-starlight/model.js';

const BOOK = 'pennyFever.littleStarlight';
const GLASS = ['I', 'II', 'III', 'IV', 'V'];
const SETS = [
  {prize: 'star-fragment', creature: 'moon-rabbit'},
  {prize: 'pocket-observatory', creature: 'dapper-fox'},
  {prize: 'star-spectacles', creature: 'moon-lantern'},
  {prize: 'sleepy-compass', creature: 'moon-rabbit'},
  {prize: 'gyro-ghost', creature: 'dapper-fox'},
  {prize: 'moon-rabbit', creature: 'moon-lantern'},
];
const SPRITES = [
  'star-fragment', 'star-spectacles', 'pocket-observatory', 'moon-rabbit', 'dapper-fox', 'moon-lantern',
  'sleepy-compass', 'midnight-invitation', 'aura-keepsake', 'everyday-penny', 'penny-purse',
];

function readStore() {
  if (typeof localStorage === 'undefined') return {v: 1, skies: {}};
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1 && blob.skies) return blob;
  } catch { /* ignore */ }
  return {v: 1, skies: {}};
}
function readSky(level) {
  const row = readStore().skies[String(level)] || {};
  return {
    angles: Array.isArray(row.angles) ? row.angles.slice() : null,
    selected: Number.isInteger(row.selected) ? row.selected : 0,
    turns: row.turns || 0,
    hints: row.hints || 0,
    dropped: row.dropped || 0,
    paid: !!row.paid,
    keptLit: Array.isArray(row.keptLit) ? row.keptLit.map(Boolean) : null,
    bellLit: !!row.bellLit,
  };
}
function persist(s) {
  if (!s || typeof localStorage === 'undefined') return;
  try {
    const store = readStore();
    store.skies[String(s.level || 0)] = {
      angles: (s.angles || []).slice(),
      selected: s.selected || 0,
      turns: s.turns || 0,
      hints: s.hints || 0,
      dropped: s.dropped || 0,
      paid: !!s.paid,
      keptLit: (s.keptLit || []).slice(),
      bellLit: !!s.bellLit,
    };
    localStorage.setItem(BOOK, JSON.stringify(store));
    s.dirty = false;
    s.saveAt = s.t;
  } catch { /* quota */ }
}
function guidance(s) {
  if (s.won || s.paid) return itemName(s.prize) + ' already left this sky. The glasses still wait.';
  if (s.phase === 'flying') return 'A penny of starlight is on the path.';
  if (s.bellLit && (s.keptLit || []).every(Boolean)) return 'The constellation remembers. Feed a penny to shove the keepsake.';
  if (s.ray?.solved) return 'The path is true. Feed a penny into the lantern and shove the keepsake off the bell.';
  if (s.ray?.loop) return 'The light is going round in circles. Turn a glass, then feed another penny.';
  if (s.ray?.blocked === 'moon') return 'The moon is in the way. Guide the light around it before you spend another penny.';
  if (s.ray?.receiverLit) return 'The sky bell is lit. A few hanging stars still need your light.';
  const n = (s.keptLit || []).filter(Boolean).length;
  const need = CHAPTERS[s.chapter].stars.length;
  if (n) return n + ' of ' + need + ' stars remembering. Glass ' + GLASS[s.selected] + ' — tap to turn, or feed the lantern.';
  return 'Glass ' + GLASS[s.selected] + ' selected. Turn the glasses, then feed a penny of starlight.';
}
function emptyNote() {
  return alleyPlay
    ? 'Need a penny for the lantern. Cash a booth ticket for a five-penny stack.'
    : 'Practice starlight is spent. The glasses still wait.';
}
function feed(s) {
  if (!s || s.won || s.phase === 'flying' || s.gesture || s.drag) return;
  if (s.cooldown > 0) return;
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = emptyNote();
      return;
    }
    s.started = true;
    s.dropped = (s.dropped || 0) + 1;
  } else {
    if (s.ammo <= 0) {
      s.note = emptyNote();
      return;
    }
    s.ammo--;
  }
  s.frozenRay = s.ray;
  s.phase = 'flying';
  s.flight = 0;
  s.cooldown = 0.28;
  s.dirty = true;
  s.note = s.ray?.solved
    ? 'A penny of starlight — the path is true.'
    : 'A penny of starlight rides the glasses.';
}
function claim(s) {
  const prize = s.prize;
  const c = CHAPTERS[s.chapter];
  const [rx, ry] = c.receiver;
  s.paid = true;
  s.won = true;
  s.phase = 'won';
  s.settle = 0.9;
  s.bellLit = true;
  s.keptLit = c.stars.map(() => true);
  if (alleyPlay) keep(prize, 'lookup');
  takePrize(s, prize, {x: rx, y: ry - 36});
  s.fly = s.fly || [];
  s.fly.push({id: prize, x: rx, y: ry - 36, t: 0, dur: 0.72, prize: true});
  s.note = itemName(prize) + ' shoved from the sky bell — into the treasure book!';
  s.dirty = true;
  persist(s);
}
function land(s) {
  const ray = s.frozenRay || s.ray;
  s.phase = 'playing';
  s.flight = 0;
  if (!ray) return;
  s.keptLit = s.keptLit || CHAPTERS[s.chapter].stars.map(() => false);
  for (let i = 0; i < ray.lit.length; i++) if (ray.lit[i]) s.keptLit[i] = true;
  if (ray.receiverLit) s.bellLit = true;
  const complete = s.keptLit.every(Boolean) && s.bellLit;
  if (complete && !s.paid) {
    claim(s);
    return;
  }
  if (s.paid) s.note = 'This sky already gave its keepsake. The glasses still wait.';
  else if (ray.loop) s.note = 'The light went round in circles. The penny is gone.';
  else if (ray.blocked === 'moon') s.note = 'The moon swallowed the penny. Turn a glass.';
  else if (ray.receiverLit && !s.keptLit.every(Boolean)) s.note = 'The sky bell rang, but some stars still sleep.';
  else s.note = guidance(s);
  s.dirty = true;
}
function hydrate(level, saved) {
  const s = createGame(level);
  const set = SETS[level] || SETS[0];
  const c = CHAPTERS[s.chapter];
  const ammo = 12 + level * 3;
  s.level = level;
  s.t = 0;
  s.drag = null;
  s.prize = set.prize;
  s.creature = set.creature;
  s.ammo = ammo;
  s.total = ammo;
  s.dropped = saved.dropped || 0;
  s.keptLit = c.stars.map((_, i) => !!(saved.keptLit && saved.keptLit[i]));
  s.bellLit = !!saved.bellLit;
  s.paid = !!saved.paid;
  s.won = false;
  s.cooldown = 0;
  s.fly = [];
  s.settle = 0;
  s.started = !alleyPlay || s.dropped > 0;
  s.dirty = false;
  s.saveAt = 0;
  if (saved.angles && saved.angles.length === c.mirrors.length) {
    s.angles = saved.angles.map(a => Number(a) || 0);
    s.selected = clamp(saved.selected | 0, 0, s.angles.length - 1);
    s.turns = saved.turns || 0;
    s.hints = saved.hints || 0;
  }
  if (s.paid) {
    s.keptLit = c.stars.map(() => true);
    s.bellLit = true;
  }
  refresh(s);
  s.note = s.paid
    ? itemName(s.prize) + ' already left this sky. Feed pennies if you like — the glasses wait.'
    : alleyPlay
      ? 'The ' + itemName(s.prize) + ' hangs at the sky bell. Turn the glasses, then feed a penny of starlight.'
      : 'Turn the glasses, then feed a practice penny along the path.';
  return s;
}

export default {
  title: 'A Little Starlight',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: alleyPlay
    ? 'Celeste’s observatory is a living paper sky. Six constellations, each hanging one keepsake at the sky bell. Feed pennies into the lantern; each penny is a comet that rides whatever path the glasses currently make. Light every star and the bell, and the unique shoves into the treasure book. Walk away — this sky waits.'
    : 'Celeste’s workshop sky. Turn the brass glasses, then feed practice pennies along the path. Workshop scores never enter your wallet.',
  instructions: alleyPlay
    ? 'Tap a glass to give it a notch, or drag it around. Arrows choose a glass; Left/Right or ↶↷ turn it. Each penny fed into the lantern sends a comet down the current path. Stars the comet wakes remember. When every star and the sky bell remember, the hanging keepsake shoves into the book. Z undoes, X offers a hint, Space feeds a penny. Leave and the glasses keep.'
    : 'Turn the glasses, then feed a practice penny. Light every star and the sky bell to finish the chapter. Workshop play is free.',
  tableDetail: alleyPlay
    ? 'This sky hangs one keepsake. Turn the glasses (free), then feed a penny of starlight. Walk away whenever you like — the glasses and the stars that already remember will wait.'
    : 'Turn the glasses, then feed a practice penny. This sky keeps while you are here.',
  liveTitle: 'A Little Starlight',
  liveDetail: alleyPlay
    ? 'A penny of starlight rides the glasses. Shove this sky’s keepsake off the bell to keep it.'
    : 'Turn the glasses. Feed a practice penny. Wake the constellation.',
  liveButton: 'Step up to the lantern',
  levels: CHAPTERS.map(c => c.title),
  sprites: SPRITES,
  prizes: SETS.map(row => row.prize),
  actions: [
    {id: 'left', label: '↶ Turn'},
    {id: 'right', label: '↷ Turn'},
    {id: 'feed', label: alleyPlay ? 'Feed the lantern · 1 penny' : 'Feed a practice penny'},
    {id: 'undo', label: 'Undo'},
    {id: 'hint', label: 'A small hint'},
  ],
  persist,
  create(level) {
    const index = clamp(Math.trunc(level) || 0, 0, SETS.length - 1);
    const s = hydrate(index, alleyPlay ? readSky(index) : {});
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    if (s.phase === 'ready') start(s);
    s.t += dt;
    s.cooldown = Math.max(0, s.cooldown - dt);
    if (s.fly) {
      for (const f of s.fly) f.t += dt;
      s.fly = s.fly.filter(f => f.t < f.dur);
    }
    if (s.phase === 'won') {
      s.settle = Math.max(0, (s.settle || 0) - dt);
      if (s.settle <= 0 && !s.result) {
        const prize = s.prize;
        done(s, CHAPTERS[s.chapter].name + ' awakens',
          itemName(prize) + ' — Celeste folds the light into a little souvenir.',
          {prize, won: true});
      }
      return;
    }
    if (s.phase === 'flying') {
      s.flight += Math.min(dt, 0.1) * 410;
      if (s.flight >= (s.frozenRay?.length || 0) + 25) land(s);
      return;
    }
    if (s.phase === 'playing' && !s.gesture) {
      const pick = (input.keys.has('ArrowRight') || input.actions.has('right') ? 1 : 0)
        - (input.keys.has('ArrowLeft') || input.actions.has('left') ? 1 : 0);
      if (pick && nudge(s, s.selected, pick)) {
        s.dirty = true;
        s.note = guidance(s);
      }
    }
    if (s.dirty && s.t - (s.saveAt || 0) > 1.2) persist(s);
  },
  pointer(s, type, p) {
    if (s.phase === 'won' || s.phase === 'flying') return;
    if (s.phase !== 'playing') return;
    const mirrors = CHAPTERS[s.chapter].mirrors;
    if (type === 'down') {
      let index = -1, best = 78;
      mirrors.forEach((m, i) => { const d = Math.hypot(p.x - m[0], p.y - m[1]); if (d < best) { best = d; index = i; } });
      if (index >= 0 && beginTurn(s, index)) {
        s.drag = {index, from: s.angles[index], cx: mirrors[index][0], cy: mirrors[index][1], last: Math.atan2(p.y - mirrors[index][1], p.x - mirrors[index][0]), total: 0, ox: p.x, oy: p.y, moved: false, center: best < 20};
        return;
      }
      const src = CHAPTERS[s.chapter].source;
      if (Math.hypot(p.x - src[0], p.y - src[1]) < 64) s.lanternDown = true;
    }
    if (type === 'move' && s.drag) {
      const a = Math.atan2(p.y - s.drag.cy, p.x - s.drag.cx);
      s.drag.total += Math.atan2(Math.sin(a - s.drag.last), Math.cos(a - s.drag.last));
      s.drag.last = a;
      if (Math.hypot(p.x - s.drag.ox, p.y - s.drag.oy) > 10) s.drag.moved = true;
      if (s.drag.moved) previewTurn(s, s.drag.from + (s.drag.center ? (p.x - s.drag.ox) * .01 : s.drag.total));
    }
    if ((type === 'up' || type === 'cancel') && s.drag) {
      const drag = s.drag; s.drag = null;
      if (type === 'cancel' || !drag.moved) {
        endTurn(s, true);
        if (type !== 'cancel') nudge(s, drag.index, 1);
      } else endTurn(s);
      s.dirty = true;
      s.note = guidance(s);
      s.lanternDown = false;
      return;
    }
    if (type === 'up' && s.lanternDown) {
      s.lanternDown = false;
      const src = CHAPTERS[s.chapter].source;
      if (Math.hypot(p.x - src[0], p.y - src[1]) < 72) feed(s);
    }
  },
  action(s, id) {
    if (s.phase === 'won' || s.phase === 'flying') return;
    if (s.phase !== 'playing') return;
    if (id === 'left') { if (nudge(s, s.selected, -1)) s.dirty = true; }
    if (id === 'right') { if (nudge(s, s.selected, 1)) s.dirty = true; }
    if (id === 'feed' || id === 'send') feed(s);
    if (id === 'undo') { if (undo(s)) s.dirty = true; }
    if (id === 'hint') {
      const h = hint(s);
      if (h) {
        s.dirty = true;
        s.note = 'Glass ' + GLASS[h.index] + ': ' + h.text;
        return;
      }
    }
    if (s.phase === 'playing') s.note = s.note || guidance(s);
  },
  key(s, k, down) {
    if (!down || s.phase !== 'playing') return;
    if (k === 'ArrowUp') s.selected = Math.max(0, s.selected - 1);
    if (k === 'ArrowDown') s.selected = Math.min(s.angles.length - 1, s.selected + 1);
    if (k === ' ') feed(s);
    if (k === 'Enter') feed(s);
    if (k === 'z') { if (undo(s)) s.dirty = true; }
    if (k === 'x') this.action(s, 'hint');
    if (s.phase === 'playing' && k !== ' ' && k !== 'Enter') s.note = guidance(s);
  },
  draw(s, d) {
    const c = CHAPTERS[s.chapter];
    const ray = s.phase === 'flying' ? s.frozenRay : s.ray;
    const kept = s.keptLit || [];
    for (const seg of (ray?.segments || [])) {
      d.line({x: seg.a[0], y: seg.a[1]}, {x: seg.b[0], y: seg.b[1]}, '#c5edf466', 6);
      d.line({x: seg.a[0], y: seg.a[1]}, {x: seg.b[0], y: seg.b[1]}, '#eef9d8', 1.6);
    }
    for (const moon of c.moons) {
      d.circle(moon[0], moon[1], moon[2], '#f1dfb2', '#ffebc0', 2);
      d.text('moon', moon[0], moon[1] + moon[2] + 22, 14, '#d9d3ba');
    }
    c.stars.forEach(([x, y], i) => {
      const on = !!(ray?.lit[i] || kept[i]);
      if (on) d.glow(x, y, 48, '#ffda8a');
      d.item(spriteKey('star-fragment'), x, y, {
        w: on ? 44 : 34, shadow: false,
        fallback: () => d.star(x, y, on ? 20 : 16, on ? '#f4d692' : '#54677f'),
      });
    });
    const [rx, ry] = c.receiver;
    const bellOn = !!(ray?.receiverLit || s.bellLit);
    if (bellOn) d.glow(rx, ry, 70);
    d.item(spriteKey('pocket-observatory'), rx, ry, {
      w: 70, shadow: false,
      fallback: () => { d.circle(rx, ry, 28, '#121f3e', '#caac6f', 3); d.star(rx, ry, 16, bellOn ? '#ffe8a6' : '#635e68'); },
    });
    if (!s.paid) {
      d.item(spriteKey(s.prize), rx, ry - 58, {
        w: 52, shadow: false,
        fallback: () => d.star(rx, ry - 58, 18, '#e7c789'),
      });
    }
    const [sx, sy] = c.source;
    d.glow(sx, sy, s.phase === 'flying' ? 56 : 36, '#f0d18f');
    d.item(spriteKey('moon-lantern'), sx, sy, {
      w: 64, shadow: false,
      fallback: () => d.circle(sx, sy, 22, '#3a2a18', '#e0b773', 3),
    });
    d.text('lantern', sx, sy + 42, 13, '#ead6a4');
    c.mirrors.forEach((p, i) => {
      const [x, y] = p;
      if (s.selected === i) d.glow(x, y, 70, '#a5e4ee');
      d.ellipse(x, y, 48, 41, '#172c50', '#e0b773', 3);
      const [a, b] = mirrorEnds(p, s.angles[i]);
      d.line({x: a[0], y: a[1]}, {x: b[0], y: b[1]}, '#bd975c', 14);
      d.line({x: a[0], y: a[1]}, {x: b[0], y: b[1]}, '#a0d7e6', 8);
      d.item(spriteKey('star-spectacles'), x, y + 6, {
        w: 36, angle: s.angles[i], shadow: false, fallback: () => d.circle(x, y, 8, '#cda768'),
      });
      d.text(GLASS[i], x, y + 62, 18, s.selected === i ? '#d9ffff' : '#edce91');
    });
    if (s.phase === 'flying' && ray) {
      const p = pointOnRay(ray, s.flight);
      d.glow(p[0], p[1], 55);
      d.item(spriteKey('everyday-penny'), p[0], p[1], {
        w: 32, shadow: false, fallback: () => d.star(p[0], p[1], 12, '#fffce3'),
      });
    }
    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    const px = 132, py = 148;
    d.item(spriteKey('penny-purse'), px, py, {w: 120, fallback: () => d.heart(px, py, 36, '#6a7a52')});
    d.text(String(n), px, py + 70, 22, '#fff6d8');
    d.text(n === 1 ? 'penny for the lantern' : 'pennies for the lantern', px, py + 92, 13, '#ead6a4');
    
    d.text('treasures', 788, 144, 13, '#ead6a4');
    for (const f of (s.fly || [])) {
      const u = Math.min(1, f.t / f.dur);
      const e = 1 - (1 - u) * (1 - u);
      const destX = f.prize ? 780 : px, destY = f.prize ? 90 : py;
      const fx = f.x + (destX - f.x) * e, fy = f.y + (destY - f.y) * e;
      d.item(spriteKey(f.id), fx, fy, {w: Math.max(18, 44 * (1 - u * 0.4)), fallback: () => d.star(fx, fy, 12, '#e7c789')});
    }
    if (s.phase === 'won') {
      d.item(spriteKey(s.creature || 'moon-rabbit'), 450, 620, {w: 160, fallback: () => d.star(450, 620, 40)});
      d.text(c.name, 450, 430, 22);
    }
  },
  readout: s => {
    const need = CHAPTERS[s.chapter].stars.length;
    const lit = (s.keptLit || []).filter(Boolean).length;
    const n = alleyPlay ? pocket() : s.ammo;
    const purse = alleyPlay
      ? (n == null ? '0' : n) + (n === 1 ? ' penny' : ' pennies') + ' for the lantern'
      : n + ' / ' + s.total + ' practice pennies';
    return lit + ' / ' + need + ' stars remember · ' + (s.bellLit ? 'bell awake' : 'bell sleeping') + ' · ' + purse + ' · ' + (s.note || '');
  },
};
