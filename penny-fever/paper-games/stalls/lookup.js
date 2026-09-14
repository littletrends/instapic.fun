import {clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, credit} from '../wallet.js?v=booth-play-2';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  CHAPTERS, createGame, start, beginTurn, previewTurn, endTurn, nudge, undo, hint, refresh, pointOnRay, mirrorEnds, STEP, norm,
} from '../../experiments/celestes-starlight/model.js';

const BOOK = 'pennyFever.littleStarlight';
const GLASS = ['I', 'II', 'III', 'IV', 'V'];
const FLIGHT_SPEED = 410;
const FLIGHT_EXTRA = 25;
function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}
export const SKY = [
  {wins: span(1, 50), speed: 8, clue: 'Tonight favours numbers below fifty.', disturb: 1, memory: 0},
  {wins: span(2, 80, 2), speed: 11, clue: 'Even lights under eighty.', disturb: 1, memory: 0},
  {wins: span(3, 90, 3), speed: 14, clue: 'Count by threes.', disturb: 1, memory: 0},
  {wins: span(76, 100), speed: 17, clue: 'The high numbers — seventy-six and up.', disturb: 2, memory: 0},
  {wins: span(5, 100, 5), speed: 20, clue: 'The fives.', disturb: 2, memory: 2.6},
  {wins: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47], speed: 24, clue: 'The lonely primes.', disturb: 2, memory: 1.8},
];
export function skyNumber(counterT, speed) {
  return 1 + (((Math.floor(Math.max(0, counterT) * speed) % 100) + 100) % 100);
}
export function contactFromLaunch(counterT, pathLength, speed) {
  const travel = (Math.max(0, pathLength) + FLIGHT_EXTRA) / FLIGHT_SPEED;
  return skyNumber(counterT + travel, speed);
}
export function isWinningNumber(level, n) {
  const sky = SKY[level] || SKY[0];
  return sky.wins.includes(n);
}
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
  'sleepy-compass', 'midnight-invitation', 'aura-keepsake', 'everyday-penny', 'penny-purse', 'moon-penny', 'star-token', 'gyro-ghost',
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
    counterT: Number(row.counterT) || 0,
    launchId: row.launchId || 0,
    contactNumber: Number(row.contactNumber) || 0,
    flying: !!row.flying,
    flight: Number(row.flight) || 0,
    launchCounterT: Number(row.launchCounterT) || 0,
    frozen: row.frozen && typeof row.frozen === 'object' ? row.frozen : null,
    needAlign: !!row.needAlign,
    lastStrike: Number(row.lastStrike) || 0,
    clueUntil: Number(row.clueUntil) || 0,
  };
}
function persist(s) {
  if (!s || typeof localStorage === 'undefined' || !alleyPlay) return;
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
      counterT: s.counterT || 0,
      launchId: s.launchId || 0,
      contactNumber: s.contactNumber || 0,
      flying: s.phase === 'flying',
      flight: s.flight || 0,
      launchCounterT: s.launchCounterT || 0,
      frozen: s.frozenRay ? {
        length: s.frozenRay.length,
        solved: !!s.frozenRay.solved,
        receiverLit: !!s.frozenRay.receiverLit,
        loop: !!s.frozenRay.loop,
        blocked: s.frozenRay.blocked || null,
        lit: (s.frozenRay.lit || []).slice(),
        segments: (s.frozenRay.segments || []).map(seg => ({a: seg.a.slice(), b: seg.b.slice()})),
      } : null,
      needAlign: !!s.needAlign,
      lastStrike: s.lastStrike || 0,
      clueUntil: s.clueUntil || 0,
    };
    localStorage.setItem(BOOK, JSON.stringify(store));
    s.dirty = false;
    s.saveAt = s.t;
  } catch { /* quota */ }
}
function skyReady(s) {
  return !!(s.bellLit && (s.keptLit || []).length && s.keptLit.every(Boolean));
}
function skyClue(s) {
  const sky = SKY[s.level] || SKY[0];
  if (!skyReady(s) || s.paid) return '';
  if (sky.memory && s.t > (s.clueUntil || 0)) return 'Remember tonight’s numbers.';
  return sky.clue;
}
function guidance(s) {
  if (s.won || s.paid) return itemName(s.prize) + ' already left this sky. Feed pennies if you like — ordinary lights still fall.';
  if (s.phase === 'flying') {
    return s.contactNumber
      ? 'The comet is travelling. Time the bell — it will strike on a number from 1 to 100.'
      : 'A penny of starlight is on the path.';
  }
  if (skyReady(s)) {
    if (s.needAlign) return 'The last glass drifted. Line the light to the bell again, then feed another comet.';
    const clue = skyClue(s);
    return (clue ? clue + ' ' : '') + 'The numbered bell is awake. Feed a penny when you can time the strike.';
  }
  if (s.ray?.solved) return 'The path is true. Feed a penny into the lantern.';
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
  if (!s || s.phase === 'flying' || s.phase === 'won' || s.gesture || s.drag) return;
  if (s.cooldown > 0 || s.launchLock) return;
  s.launchLock = true;
  try {
    if (alleyPlay) {
      if (!takeAttempt('lookup', s.level)) {
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
    const sky = SKY[s.level] || SKY[0];
    s.frozenRay = s.ray;
    s.launchId = (s.launchId || 0) + 1;
    s.launchCounterT = s.counterT || 0;
    s.contactNumber = s.frozenRay?.receiverLit
      ? contactFromLaunch(s.launchCounterT, s.frozenRay.length || 0, sky.speed)
      : 0;
    s.phase = 'flying';
    s.flight = 0;
    s.cooldown = 0.28;
    s.dirty = true;
    s.note = s.contactNumber
      ? 'Comet away. The bell is cycling — time the strike.'
      : 'A penny of starlight rides the glasses.';
    persist(s);
  } finally {
    if (s.phase !== 'flying') s.launchLock = false;
  }
}
function ordinaryDrop(n) {
  if (n % 10 === 0) return 'star-token';
  if (n % 2 === 0) return 'moon-penny';
  return 'everyday-penny';
}
function disturbPath(s) {
  const last = Math.max(0, (s.angles || []).length - 1);
  const steps = (SKY[s.level] || SKY[0]).disturb || 1;
  const dir = (s.dropped || 1) % 2 ? 1 : -1;
  if (s.angles && s.angles.length) {
    s.angles[last] = norm(s.angles[last] + STEP * dir * steps);
    if (steps > 1 && last > 0) s.angles[last - 1] = norm(s.angles[last - 1] + STEP * -dir);
  }
  s.needAlign = true;
  refresh(s);
}
function ordinary(s, n) {
  const drop = ordinaryDrop(n);
  const c = CHAPTERS[s.chapter];
  const [rx, ry] = c.receiver;
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'lookup');
  }
  takePrize(s, drop, {x: rx, y: ry});
  s.fly = s.fly || [];
  s.fly.push({id: drop, x: rx, y: ry, t: 0, dur: 0.55, prize: false});
}
function claim(s, n) {
  const prize = s.prize;
  const c = CHAPTERS[s.chapter];
  const [rx, ry] = c.receiver;
  s.paid = true;
  s.won = true;
  s.phase = 'won';
  s.settle = 1.1;
  s.bellLit = true;
  s.keptLit = c.stars.map(() => true);
  s.lastStrike = n;
  s.needAlign = false;
  if (alleyPlay) keep(prize, 'lookup');
  takePrize(s, prize, {x: rx, y: ry - 36});
  s.fly = s.fly || [];
  s.fly.push({id: prize, x: rx, y: ry - 36, t: 0, dur: 0.72, prize: true});
  s.note = 'THE COMET STRUCK ON ' + n + '. ' + n + ' was written in tonight’s stars. ' + itemName(prize) + ' FOUND.';
  s.dirty = true;
  persist(s);
}
function land(s) {
  const ray = s.frozenRay || s.ray;
  const contact = s.contactNumber || 0;
  s.phase = 'playing';
  s.flight = 0;
  s.launchLock = false;
  if (!ray) {
    s.contactNumber = 0;
    s.frozenRay = null;
    return;
  }
  s.keptLit = s.keptLit || CHAPTERS[s.chapter].stars.map(() => false);
  for (let i = 0; i < (ray.lit || []).length; i++) if (ray.lit[i]) s.keptLit[i] = true;
  if (ray.receiverLit) {
    s.bellLit = true;
    if (!s.clueUntil && (SKY[s.level] || SKY[0]).memory) s.clueUntil = s.t + (SKY[s.level].memory || 0);
  }
  const complete = s.keptLit.every(Boolean) && s.bellLit;
  if (complete && ray.receiverLit && contact) {
    s.lastStrike = contact;
    if (isWinningNumber(s.level, contact) && !s.paid) {
      claim(s, contact);
      s.contactNumber = 0;
      s.frozenRay = null;
      return;
    }
    if (isWinningNumber(s.level, contact) && s.paid) {
      s.note = 'THE COMET STRUCK ON ' + contact + '. This sky already gave its keepsake.';
      ordinary(s, contact);
    } else {
      s.note = 'THE COMET STRUCK ON ' + contact + '. A beautiful light — but the keepsake still hangs.';
      ordinary(s, contact);
      disturbPath(s);
    }
  } else if (s.paid) s.note = 'This sky already gave its keepsake. The glasses still wait.';
  else if (ray.loop) s.note = 'The light went round in circles. The penny is gone.';
  else if (ray.blocked === 'moon') s.note = 'The moon swallowed the penny. Turn a glass.';
  else if (ray.receiverLit && !s.keptLit.every(Boolean)) s.note = 'The sky bell rang, but some stars still sleep.';
  else s.note = guidance(s);
  if (complete && !s.needAlign && s.ray?.solved) s.needAlign = false;
  if (s.ray?.solved) s.needAlign = false;
  s.contactNumber = 0;
  s.frozenRay = null;
  s.dirty = true;
  persist(s);
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
  s.counterT = saved.counterT || 0;
  s.launchId = saved.launchId || 0;
  s.launchLock = false;
  s.needAlign = !!saved.needAlign;
  s.lastStrike = saved.lastStrike || 0;
  s.clueUntil = saved.clueUntil || 0;
  s.contactNumber = 0;
  s.launchCounterT = 0;
  s.frozenRay = null;
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
  if (saved.flying && saved.frozen) {
    s.frozenRay = {
      length: saved.frozen.length || 0,
      solved: !!saved.frozen.solved,
      receiverLit: !!saved.frozen.receiverLit,
      loop: !!saved.frozen.loop,
      blocked: saved.frozen.blocked || null,
      lit: Array.isArray(saved.frozen.lit) ? saved.frozen.lit.slice() : [],
      segments: Array.isArray(saved.frozen.segments) ? saved.frozen.segments : [],
    };
    s.phase = 'flying';
    s.flight = saved.flight || 0;
    s.launchCounterT = saved.launchCounterT || s.counterT;
    s.contactNumber = saved.contactNumber || contactFromLaunch(s.launchCounterT, s.frozenRay.length, (SKY[s.level] || SKY[0]).speed);
    s.launchLock = true;
  }
  s.note = s.paid
    ? itemName(s.prize) + ' already left this sky. Feed pennies if you like — ordinary lights still fall.'
    : alleyPlay
      ? 'The ' + itemName(s.prize) + ' hangs at the sky bell. Turn the glasses, then feed a penny of starlight.'
      : 'Turn the glasses, then feed a practice penny along the path.';
  if (s.phase === 'flying') s.note = 'The comet is still travelling.';
  return s;
}

export default {
  title: 'A Little Starlight',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: alleyPlay
    ? 'Celeste’s observatory is a living paper sky. Six constellations, each hanging one keepsake at the numbered sky bell. Turn the glasses for free. Each penny is a comet. Wake the stars, then time the 1–100 bell — only tonight’s numbers drop the unique. Miss, and ordinary starlight still falls. Walk away — this sky waits.'
    : 'Celeste’s workshop sky. Turn the brass glasses, then feed practice pennies along the path. Workshop scores never enter your wallet.',
  instructions: alleyPlay
    ? 'Tap or drag a glass (free). Space feeds one penny and launches a comet along the current path. Stars stay remembered. When the numbered bell is awake, time the comet so it strikes a winning number. After a miss the last glass drifts — line it up again. Z undo, X hint.'
    : 'Turn the glasses, then feed a practice penny. Light the stars, then time the numbered bell. Workshop play is free and writes nothing.',
  tableDetail: alleyPlay
    ? 'Glasses are free. A penny launches one comet. The unique hangs until a winning strike. Walk away — the sky waits.'
    : 'Turn the glasses, then feed a practice penny. This sky keeps while you are here.',
  liveTitle: 'A Little Starlight',
  liveDetail: alleyPlay
    ? 'Wake the constellation, then time the numbered bell. A winning strike drops this sky’s keepsake.'
    : 'Turn the glasses. Feed a practice penny. Wake the constellation, then time the bell.',
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
    const sky = SKY[s.level] || SKY[0];
    s.counterT = (s.counterT || 0) + Math.min(dt, 0.1);
    s.skyFace = skyNumber(s.counterT, sky.speed);
    if (s.phase === 'flying') {
      s.flight += Math.min(dt, 0.1) * FLIGHT_SPEED;
      if (s.flight >= (s.frozenRay?.length || 0) + FLIGHT_EXTRA) land(s);
      return;
    }
    if (s.needAlign && s.ray?.solved) s.needAlign = false;
    if (s.phase === 'playing' && !s.gesture) {
      const keys = input?.keys || new Set();
      const actions = input?.actions || new Set();
      const pick = (keys.has('ArrowRight') || actions.has('right') ? 1 : 0)
        - (keys.has('ArrowLeft') || actions.has('left') ? 1 : 0);
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
    const ready = skyReady(s);
    if (bellOn) d.glow(rx, ry, ready ? 90 : 70, ready ? '#f0d18f' : '#ffe8a6');
    d.item(spriteKey('pocket-observatory'), rx, ry, {
      w: 70, shadow: false,
      fallback: () => { d.circle(rx, ry, 28, '#121f3e', '#caac6f', 3); d.star(rx, ry, 16, bellOn ? '#ffe8a6' : '#635e68'); },
    });
    if (ready) {
      const face = s.phase === 'flying' && s.contactNumber ? s.skyFace : (s.skyFace || 1);
      d.text(String(face).padStart(2, '0'), rx, ry + 8, 36, '#fff6d8');
      const clue = skyClue(s);
      if (clue) d.text(clue, rx, ry + 86, 16, '#f0d18f');
    }
    if (!s.paid) {
      d.item(spriteKey(s.prize), rx, ry - 72, {
        w: 58, shadow: false,
        fallback: () => d.star(rx, ry - 72, 20, '#e7c789'),
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
    d.poly([[742, 48], [838, 52], [834, 128], [738, 122]], '#6b3a3a', '#e8d4a0', 2);
    d.text('treasures', 788, 144, 13, '#ead6a4');
    for (const f of (s.fly || [])) {
      const u = Math.min(1, f.t / f.dur);
      const e = 1 - (1 - u) * (1 - u);
      const destX = f.prize ? 780 : px, destY = f.prize ? 90 : py;
      const fx = f.x + (destX - f.x) * e, fy = f.y + (destY - f.y) * e;
      d.item(spriteKey(f.id), fx, fy, {w: Math.max(18, 44 * (1 - u * 0.4)), fallback: () => d.star(fx, fy, 12, '#e7c789')});
    }
    if (s.lastStrike && s.phase !== 'flying') {
      d.text(s.paid ? ('Struck on ' + s.lastStrike + ' — keepsake found') : ('Struck on ' + s.lastStrike), 450, 108, 20, '#f0d18f');
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
