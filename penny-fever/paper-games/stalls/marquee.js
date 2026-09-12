import {clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, credit, keep, owned} from '../wallet.js?v=lumi-night-1';

const colours = ['#edc87e', '#a3d7cb', '#e4a4b7'];
const seals = ['star-token', 'moon-penny', 'pressed-heart'];
const xs = [270, 450, 630];
const BOOK = 'pennyFever.lightTheNight';
const SETS = [
  {prize: 'marquee-bulb', clock: 48, travel: 3.3, window: .34, spawn: 1.12, need: 4, drift: 0, chord: 0,
    felt: '#1a2830cc', wood: '#4a3224', lamp: '#edc87e'},
  {prize: 'pocket-marquee', clock: 42, travel: 3.0, window: .30, spawn: .98, need: 5, drift: 0, chord: 0,
    felt: '#1c2438cc', wood: '#3a2a22', lamp: '#a3d7cb'},
  {prize: 'lantern-lighter', clock: 38, travel: 2.7, window: .27, spawn: .86, need: 6, drift: .25, chord: .12,
    felt: '#241c28cc', wood: '#3a2218', lamp: '#e4a4b7'},
  {prize: 'midway-map', clock: 34, travel: 2.45, window: .24, spawn: .74, need: 7, drift: .45, chord: .22,
    felt: '#182028ee', wood: '#2a1c16', lamp: '#edc87e'},
  {prize: 'new-year-star-cracker', clock: 30, travel: 2.2, window: .21, spawn: .64, need: 8, drift: .7, chord: .32,
    felt: '#141820ee', wood: '#241818', lamp: '#a3d7cb'},
  {prize: 'marquee-stub', clock: 26, travel: 2.0, window: .18, spawn: .54, need: 9, drift: 1, chord: .42,
    felt: '#10141cee', wood: '#1c1412', lamp: '#e4a4b7'},
];
const PATTERNS = [
  [0, 1, 2, 1, 0, 2, 0, 1, 2, 2, 1, 0],
  [0, 2, 1, 0, 1, 2, 2, 0, 1, 2, 0, 2, 1, 0, 1, 2],
  [0, 1, 2, 0, 2, 1, 1, 0, 2, 1, 2, 0, 0, 2, 1, 2, 1, 0, 1, 2],
  [0, 1, 2, 1, 0, 2, 2, 1, 0, 1, 2, 0, 2, 1, 0, 2, 1, 2, 0, 1, 2, 1, 0, 2],
  [0, 2, 1, 2, 0, 1, 0, 2, 1, 0, 2, 1, 2, 0, 1, 2, 1, 0, 2, 0, 1, 2, 0, 1, 2, 1, 0, 2],
  [0, 1, 2, 0, 1, 2, 2, 1, 0, 2, 1, 0, 1, 2, 0, 2, 1, 2, 0, 1, 0, 2, 1, 2, 0, 1, 2, 1, 0, 2, 1, 0],
];
const SPRITES = ['marquee-bulb', 'pocket-marquee', 'star-token', 'moon-penny', 'pressed-heart',
  'lantern-lighter', 'midway-map', 'aura-keepsake', 'ride-ticket', 'penny-purse', 'everyday-penny'];

function readStore() {
  if (typeof localStorage === 'undefined') return {v: 1, tables: {}};
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1 && blob.tables) return blob;
  } catch { /* ignore */ }
  return {v: 1, tables: {}};
}
function readTable(level) {
  const row = readStore().tables[String(level)] || {};
  return {
    paid: Array.isArray(row.paid) ? row.paid.slice() : [],
    score: row.score || 0, nights: row.nights || 0, wonPennies: row.wonPennies || 0,
  };
}
function writeBook(s) {
  if (typeof localStorage === 'undefined' || !s) return;
  try {
    const store = readStore();
    store.tables[String(s.level || 0)] = {
      paid: s.paid, score: s.score, nights: s.nights, wonPennies: s.wonPennies,
    };
    localStorage.setItem(BOOK, JSON.stringify(store));
  } catch { /* quota */ }
}
function phrase(level) {
  return (PATTERNS[level] || PATTERNS[0]).map((lane, id) => ({lane, id}));
}
function pos(s, n) {
  const p = clamp(n.age / s.travel, 0, 1.12);
  const lane = clamp(n.lane | 0, 0, 2);
  return {
    x: 450 + (xs[lane] - 450) * p + Math.sin(p * Math.PI) * (lane === 1 ? 44 : (lane === 0 ? -72 : 72)),
    y: 410 + p * 510,
  };
}
function canAfford(s) {
  if (!alleyPlay) return s.ammo > 0;
  return (pocket() || 0) >= 1;
}
function seatLane(s) {
  s.mode = 'lane';
  s.charge = 0;
  s.charging = false;
  s.pointerWake = false;
  s.notes = [];
  s.queue = phrase(s.level);
  s.spawn = s.spawnGap;
  s.hits = 0;
  s.combo = 0;
  s.prizeCool = 0;
  s.lights = [false, false, false];
}
function beginCharge(s) {
  if (s.mode !== 'lane' || s.charging || s.won || s.lost) return;
  if (!canAfford(s)) {
    s.note = alleyPlay
      ? 'Need a penny to wake the marquee. Cash a booth ticket for a five-penny stack.'
      : 'Practice matches are spent.';
    return;
  }
  s.charging = true;
  s.charge = 0.02;
}
function releaseWake(s) {
  if (s.mode !== 'lane' || !s.charging) { s.charging = false; return; }
  const power = s.charge;
  s.charging = false;
  s.charge = 0;
  if (power < 0.1) {
    s.note = 'A timid spark. Draw the match further.';
    return;
  }
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny to wake the marquee. Cash a booth ticket for a five-penny stack.';
      return;
    }
  } else s.ammo--;
  s.mode = 'live';
  s.clock = s.clockMax;
  s.nights++;
  s.spawn = 0.18;
  s.note = power > 0.72 ? 'A bright wake. The boardwalk answers.' : 'The boardwalk is awake. The clock is running.';
  writeBook(s);
}
function drain(s) {
  if (s.won || s.lost) return;
  s.mode = 'dead';
  s.deadAt = s.t;
  s.charging = false;
  s.charge = 0;
  s.combo = 0;
  s.notes = [];
  s.note = alleyPlay
    ? 'The night went dark. Another penny to wake it.'
    : (s.ammo > 0 ? 'The night went dark. Wake it again.' : 'Practice matches are spent.');
  if (!alleyPlay && s.ammo <= 0) {
    s.lost = true;
    done(s, 'The night stays dark',
      'Practice matches are spent. Wake this boardwalk again.',
      {won: false});
  }
}
function drought(s) {
  let m = 1;
  if (s.wonPennies >= 8) m *= 0.55;
  if (s.wonPennies >= 16) m *= 0.4;
  return m;
}
function fly(s, id, x, y, prize) {
  s.fly.push({id, x, y, t: 0, dur: 0.7, prize: !!prize});
}
function spawnPrize(s) {
  if (s.mode !== 'live' || s.won || s.notes.some(n => n.prize) || s.prizeCool > 0) return;
  if (s.hits < s.need) return;
  const home = (s.hits + s.level) % 3;
  s.notes.push({lane: home, id: -1, age: 0, prize: true, home});
  s.note = s.prizeOut
    ? 'A familiar light leaves the glass — catch it for the joy of it.'
    : 'The keepsake has left the glass — catch it at its lantern!';
}
function claim(s, n) {
  const p = pos(s, n);
  if (s.prizeOut) {
    s.score += 400;
    fly(s, s.prize, p.x, p.y, true);
    s.note = 'A familiar light. The book already has this one.';
    return;
  }
  s.prizeOut = true;
  s.won = true;
  s.score += 2500;
  if (!s.paid.includes(s.prize)) s.paid.push(s.prize);
  fly(s, s.prize, p.x, p.y, true);
  if (alleyPlay && s.prize) keep(s.prize, 'marquee');
  writeBook(s);
  s.note = itemName(s.prize) + ' — you snagged it off the marquee!';
  done(s, 'The boardwalk keeps a light',
    itemName(s.prize) + ' flies into the treasure book.',
    {prize: s.prize, won: true});
}
function strike(s, lane) {
  if (s.mode !== 'live' || s.won || s.lost) return;
  lane = clamp(lane | 0, 0, 2);
  if (s.cool[lane] > 0) return;
  s.cool[lane] = .16;
  const n = s.notes.filter(note => note.lane === lane)
    .sort((a, b) => Math.abs(a.age - s.travel) - Math.abs(b.age - s.travel))[0];
  if (n && Math.abs(n.age - s.travel) < s.window) {
    const p = pos(s, n);
    s.notes.splice(s.notes.indexOf(n), 1);
    s.flash[lane] = 1;
    s.flares.push({lane, t: 0});
    const tight = Math.abs(n.age - s.travel) < .13;
    if (n.prize) {
      s.combo++;
      s.best = Math.max(s.best, s.combo);
      claim(s, n);
      return;
    }
    s.hits++;
    s.combo++;
    s.best = Math.max(s.best, s.combo);
    s.score += tight ? 120 : 50;
    if (s.combo >= 3) s.lights[0] = true;
    if (s.combo >= 6) s.lights[1] = true;
    if (s.combo >= 9) s.lights[2] = true;
    s.note = tight ? 'A bright, clear beat.' : 'Caught it — the alley glows a little warmer.';
    if (tight && alleyPlay && Math.random() < 0.08 * drought(s)) {
      credit(1);
      s.wonPennies++;
      fly(s, 'everyday-penny', p.x, p.y, false);
      s.note = 'A penny back into the purse.';
      writeBook(s);
    }
    spawnPrize(s);
  } else {
    s.combo = 0;
    s.flash[lane] = .15;
    s.note = s.notes.some(note => note.prize)
      ? 'The keepsake wants its own lantern. Wait for the brass ring.'
      : 'Wait for the little light to reach its lantern.';
  }
}
function strikeAll(s) {
  if (s.mode !== 'live') return;
  strike(s, 0); strike(s, 1); strike(s, 2);
}

export default {
  title: 'Light the Night',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: alleyPlay
    ? 'Lumi’s marquee cabinet. Six nights, one keepsake hanging on the glass each time. A penny wakes the boardwalk. Catch the travelling bulbs at their lanterns, then snatch this night’s prize when it leaves the glass. The clock runs while the night is live — dark, and another penny wakes it again.'
    : 'Workshop marquee. Wake the night, catch the lights, snatch the hanging prize. Shift slaps the whole boardwalk.',
  instructions: alleyPlay
    ? 'Hold Wake and release (one penny a night). Star, Moon and Heart lanterns as the bulbs reach their brass rings — arrows, or tap the lanterns. Shift, or the quiet pad under the moon, hits all three. Catch enough lights and the hanging prize leaves the glass: catch that one to stamp it. Cash a booth ticket for a five-penny stack.'
    : 'Hold Wake. Star ←, Moon ↓, Heart →. Shift for all three. Catch the hanging prize when it leaves the glass.',
  liveTitle: 'Light the Night',
  liveDetail: alleyPlay
    ? 'A penny wakes the marquee. Catch the lights, then snatch the prize off the glass. The clock is running.'
    : 'Wake the night. Catch the hanging prize. Shift for the whole boardwalk.',
  liveButton: 'Step up to the marquee',
  tableDetail: alleyPlay
    ? 'A penny wakes this night. Catch travelling bulbs at their lanterns, then snatch this cabinet’s prize when it leaves the glass. Time runs out, or the night goes dark — another penny to wake it. Shift slaps all three lanterns.'
    : 'Catch the hanging prize. Shift for the whole boardwalk.',
  levels: ['A lantern waltz', 'Three little harmonies', 'The whole boardwalk', 'A midnight refrain', 'Lanterns in canon', 'The all-night encore'],
  sprites: SPRITES,
  prizes: SETS.map(t => t.prize),
  actions: [
    {id: '0', label: 'Star · ←'},
    {id: '1', label: 'Moon · ↓'},
    {id: 'all', label: 'Whole boardwalk · Shift', hold: true},
    {id: 'wake', label: alleyPlay ? 'Wake the night · 1 penny' : 'Wake the night', hold: true},
    {id: '2', label: 'Heart · →'},
  ],
  persist(s) { writeBook(s); },
  create(level) {
    const book = readTable(level);
    const set = SETS[level] || SETS[0];
    const s = {
      level, t: 0, mode: 'lane', charge: 0, charging: false, pointerWake: false,
      prize: set.prize, need: set.need, travel: set.travel, window: set.window,
      spawnGap: set.spawn, drift: set.drift, chord: set.chord,
      clockMax: set.clock, clock: set.clock, set,
      hits: 0, combo: 0, best: 0, score: book.score, nights: book.nights, wonPennies: book.wonPennies,
      paid: book.paid, prizeOut: book.paid.includes(set.prize),
      ammo: alleyPlay ? 0 : Math.max(4, 9 - level),
      notes: [], queue: phrase(level), spawn: set.spawn, prizeCool: 0,
      flash: [0, 0, 0], cool: [0, 0, 0], lights: [false, false, false],
      flares: [], fly: [], won: false, lost: false,
      note: alleyPlay
        ? (book.paid.includes(set.prize)
          ? 'This night’s prize is already in the book. A penny still wakes the marquee.'
          : 'A penny wakes the marquee. Catch the lights, then snatch the prize off the glass.')
        : 'Wake the night. Catch the hanging prize.',
    };
    seatLane(s);
    return s;
  },
  update(s, dt, input = {keys: new Set(), actions: new Set()}) {
    s.t += dt;
    if (s.won || s.lost) {
      for (const f of s.fly) f.t += dt;
      s.fly = s.fly.filter(f => f.t < f.dur);
      for (const f of s.flares) f.t += dt;
      s.flares = s.flares.filter(f => f.t < 1.8);
      return;
    }
    const keys = input.keys || new Set();
    const actions = input.actions || new Set();
    for (let i = 0; i < 3; i++) {
      s.flash[i] = Math.max(0, s.flash[i] - dt);
      s.cool[i] = Math.max(0, s.cool[i] - dt);
    }
    s.prizeCool = Math.max(0, s.prizeCool - dt);
    const holdWake = s.pointerWake || actions.has('wake') || keys.has(' ');
    if (s.mode === 'lane') {
      if (holdWake) beginCharge(s);
      if (s.charging) {
        if (holdWake && !s.pointerWake) s.charge = clamp(s.charge + dt * 1.28, 0, 1);
      }
      if (s.charging && !holdWake) releaseWake(s);
    } else if (s.mode === 'dead') {
      if (s.t - s.deadAt > 0.8) seatLane(s);
    } else if (s.mode === 'live') {
      s.clock = Math.max(0, (s.clock ?? s.clockMax) - dt);
      if (s.clock <= 0) {
        drain(s);
        s.note = alleyPlay
          ? 'Time. Another penny to wake the marquee.'
          : 'Time. Wake the night again.';
      }
    }
    if (s.mode === 'live') {
      s.spawn -= dt;
      if (s.spawn <= 0 && s.queue.length) {
        const n = s.queue.shift();
        s.notes.push({...n, age: 0});
        if (s.chord && s.queue.length && Math.random() < s.chord) {
          const m = s.queue.shift();
          s.notes.push({...m, age: 0.04});
        }
        s.spawn = s.spawnGap;
      }
      if (!s.queue.length && !s.notes.length) s.queue = phrase(s.level);
      spawnPrize(s);
      for (const n of s.notes) {
        n.age += dt;
        if (n.prize && s.drift) {
          n.lane = clamp(Math.round(n.home + Math.sin(n.age * (1.35 + s.level * .18)) * s.drift), 0, 2);
        }
      }
      for (const n of [...s.notes]) {
        if (n.age <= s.travel + s.window) continue;
        s.notes.splice(s.notes.indexOf(n), 1);
        s.combo = 0;
        if (n.prize) {
          s.prizeCool = 1.15;
          s.note = 'The keepsake slipped back onto the glass.';
        } else {
          s.queue.push({id: n.id, lane: n.lane});
          s.note = 'That light is circling back. The clock is not.';
        }
      }
    }
    for (const f of s.flares) f.t += dt;
    s.flares = s.flares.filter(f => f.t < 1.8);
    for (const f of s.fly) f.t += dt;
    s.fly = s.fly.filter(f => f.t < f.dur);
  },
  pointer(s, type, p) {
    if (s.won || s.lost) return;
    if (type === 'down') {
      if (s.mode === 'lane' && (p.x > 700 || (p.y > 1110 && p.x > 620))) {
        s.pointerWake = true;
        beginCharge(s);
        s.charge = clamp((p.y - 980) / 90, 0.05, 1);
      } else if (p.y > 1088 && p.x > 370 && p.x < 530) {
        strikeAll(s);
      } else if (p.y > 750) {
        strike(s, clamp(Math.round((p.x - 270) / 180), 0, 2));
      }
    }
    if (type === 'move' && s.pointerWake && s.mode === 'lane') {
      s.charge = clamp((p.y - 980) / 90, 0.05, 1);
    }
    if (type === 'up' || type === 'cancel') {
      if (s.pointerWake) { s.pointerWake = false; releaseWake(s); }
    }
  },
  action(s, id, down) {
    if (id === 'wake') {
      if (down) beginCharge(s);
      else releaseWake(s);
      return;
    }
    if (id === 'all') { if (down !== false) strikeAll(s); return; }
    if (down === false) return;
    const lane = id === 'star' ? 0 : id === 'moon' ? 1 : id === 'heart' ? 2 : Number(id);
    if (lane === 0 || lane === 1 || lane === 2) strike(s, lane);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === 'ArrowLeft' || k === 'z' || k === 'Z') strike(s, 0);
    else if (k === 'ArrowDown' || k === 'x' || k === 'X') strike(s, 1);
    else if (k === 'ArrowRight' || k === 'c' || k === 'C') strike(s, 2);
    else if (k === 'Shift' || k === 'Control') strikeAll(s);
    else if (k === ' ') beginCharge(s);
  },
  draw(s, d, _t, input) {
    const set = s.set || SETS[s.level] || SETS[0];
    const keys = input?.keys;
    const actions = input?.actions;
    const allOn = actions?.has?.('all') || keys?.has?.('Shift') || keys?.has?.('Control');
    const on = [
      allOn || actions?.has?.('0') || keys?.has?.('ArrowLeft') || keys?.has?.('z') || keys?.has?.('Z') || s.flash[0] > .2,
      allOn || actions?.has?.('1') || keys?.has?.('ArrowDown') || keys?.has?.('x') || keys?.has?.('X') || s.flash[1] > .2,
      allOn || actions?.has?.('2') || keys?.has?.('ArrowRight') || keys?.has?.('c') || keys?.has?.('C') || s.flash[2] > .2,
    ];
    d.poly([[70, 36], [340, 36], [340, 128], [70, 128]], '#161022cc', '#e6c57a', 2);
    d.text('LIGHT THE NIGHT', 205, 66, 16, '#fff3d0');
    d.text(String(s.score).padStart(6, '0'), 205, 94, 16, '#f0d49a');
    for (let i = 0; i < 3; i++) d.circle(160 + i * 36, 114, 7, s.lights[i] ? '#f0c060' : '#2a2428', '#e8d4a0', 1);
    const remain = Math.ceil(Math.max(0, s.mode === 'live' ? s.clock : (s.clockMax || 48)));
    d.text(remain + 's', 790, 68, 16, remain <= 8 && s.mode === 'live' ? '#f0a070' : '#ead6a4');
    for (let i = 0; i < 12; i++) {
      const x = 168 + i * 48;
      const lit = i < Math.min(12, s.hits) && s.mode !== 'lane';
      if (lit) d.glow(x, 214, 16, '#f4e2a8');
      d.circle(x, 214, 6, lit ? '#ffe6a4' : '#2a2428', '#c2a46d', 1);
    }
    const prizeLive = s.notes.some(n => n.prize);
    const ps = {x: 450, y: 292};
    if (!s.prizeOut && !prizeLive) d.glow(ps.x, ps.y, 70, set.lamp);
    d.circle(ps.x, ps.y, 32, s.prizeOut ? '#2a242888' : '#6a3a28ee', '#f0d6a0', 3);
    d.item(spriteKey(set.prize), ps.x, ps.y, {
      w: s.prizeOut || prizeLive ? 34 : 52, alpha: s.prizeOut ? 0.35 : prizeLive ? 0.2 : 1,
      fallback: () => d.star(ps.x, ps.y, 16, '#f4e2a8'),
    });
    if (!s.prizeOut && !prizeLive) d.text('hanging', ps.x, ps.y + 48, 11, '#f0d6a8');
    else if (prizeLive) d.text('catch it', ps.x, ps.y + 48, 11, '#f0d6a8');
    else d.text('kept', ps.x, ps.y + 48, 11, '#ead6a488');
    for (let i = 0; i < 3; i++) {
      const points = [];
      for (let j = 0; j <= 32; j++) points.push(pos(s, {lane: i, age: s.travel * j / 32}));
      d.path(points, '#9a886066', 2);
      const x = xs[i], y = 925;
      d.ellipse(x, y + 72, 58, 15, '#101b2244');
      if (s.flash[i]) d.glow(x, y, 82 * s.flash[i], colours[i]);
      d.item(spriteKey('pocket-marquee'), x, y, {
        w: on[i] ? 100 : 92,
        fallback: () => {
          d.line({x, y: 850}, {x, y: 881}, '#b59a60', 4);
          d.ring(x, 862, 13, '#d8b76f', 4);
          d.poly([[x - 38, y - 39], [x + 38, y - 39], [x + 48, y + 38], [x - 48, y + 38]], '#263e3d', '#cfad71', 5);
          d.poly([[x - 47, y - 39], [x, y - 69], [x + 47, y - 39]], '#a78348', '#e8c484', 3);
        },
      });
      d.item(spriteKey(seals[i]), x, y + 8, {
        w: 28, shadow: false,
        fallback: () => {
          if (i === 0) d.star(x, y, 19, colours[i]);
          else if (i === 2) d.heart(x, y, 19, colours[i]);
          else { d.circle(x, y, 19, colours[i]); d.circle(x + 19 * .4, y - 19 * .28, 19 * .82, '#324945'); }
        },
      });
      d.ring(x, y, 60, colours[i] + (on[i] ? 'cc' : '66'), on[i] ? 3 : 2);
      d.text(['←', '↓', '→'][i], x, y + 110, 23, '#f3dfb2');
    }
    for (const n of s.notes) {
      const p = pos(s, n);
      d.glow(p.x, p.y, n.prize ? 42 : 30, n.prize ? '#f4e2a8' : colours[n.lane]);
      d.item(spriteKey(n.prize ? set.prize : 'marquee-bulb'), p.x, p.y, {
        w: n.prize ? 36 : 28, shadow: false,
        fallback: () => {
          if (n.prize) d.star(p.x, p.y, 14, '#f4e2a8');
          else if (n.lane === 0) d.star(p.x, p.y, 12, colours[n.lane]);
          else if (n.lane === 2) d.heart(p.x, p.y, 12, colours[n.lane]);
          else d.circle(p.x, p.y, 12, colours[n.lane]);
        },
      });
    }
    const rows = Math.ceil(s.need / 2), rowH = Math.min(36, 220 / Math.max(1, rows));
    for (let i = 0; i < s.need; i++) {
      const side = i % 2, x = side ? 740 : 160, y = 360 + Math.floor(i / 2) * rowH;
      d.line({x: x - 9, y}, {x: x + 9, y}, '#ad905c', 2);
      if (i < s.hits) d.glow(x, y, 18, '#f4d590');
      d.circle(x, y, 5, i < s.hits ? '#ffe6a4' : '#625b48', '#c2a46d', 1);
    }
    for (const f of s.flares) {
      const x = xs[f.lane] + Math.sin(f.t * 4) * 35, y = 900 - f.t * 180;
      d.item(spriteKey('marquee-bulb'), x, y, {
        w: 16 * (1 - f.t / 1.8), shadow: false,
        fallback: () => d.star(x, y, 8 * (1 - f.t / 1.8), colours[f.lane]),
      });
    }
    d.poly([[118, 1120], [782, 1120], [798, 1172], [102, 1172]], '#2a1c16ee', '#e6c57a', 2);
    d.circle(210, 1146, 16, on[0] ? '#f0d080' : '#6a3a48', '#ead6a4', 2);
    d.circle(450, 1148, 14, allOn ? '#f0d080' : '#3a2a2288', '#c4a46a66', 1);
    d.circle(690, 1146, 16, on[2] ? '#f0d080' : '#6a3a48', '#ead6a4', 2);
    d.text('Z', 210, 1152, 12, '#fff6d8');
    d.text('X', 450, 1152, 11, '#ead6a488');
    d.text('C', 690, 1152, 12, '#fff6d8');
    const springY = 1086 + (s.mode === 'lane' ? s.charge * 48 : 0);
    d.item(spriteKey('lantern-lighter'), 792, springY, {
      w: 40, fallback: () => d.ball(792, springY, 12, '#c45a4a'),
    });
    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    d.item(spriteKey('penny-purse'), 86, 64, {w: 72, fallback: () => d.heart(86, 64, 22, '#6a7a52')});
    d.text(String(n), 86, 108, 18, '#fff6d8');
    d.poly([[760, 44], [828, 48], [824, 108], [756, 104]], '#6b3a3a', '#e8d4a0', 2);
    d.item(spriteKey(set.prize), 792, 76, {w: 36, fallback: () => d.star(792, 76, 12, '#f4e2a8')});
    for (let i = 0; i < SETS.length; i++) {
      const x = 86, y = 200 + i * 36;
      const got = owned(SETS[i].prize) || (s.prizeOut && i === s.level);
      d.item(spriteKey(SETS[i].prize), x, y, {w: 22, fallback: () => d.star(x, y, 8)});
      if (got) d.text('✓', x + 12, y - 8, 12, '#f6e2a2');
    }
    for (const f of s.fly) {
      const u = Math.min(1, f.t / f.dur), e = 1 - (1 - u) * (1 - u);
      const destX = f.prize ? 792 : 86, destY = f.prize ? 76 : 64;
      d.item(spriteKey(f.id), f.x + (destX - f.x) * e, f.y + (destY - f.y) * e, {
        w: 28 * (1 - u * 0.35),
        fallback: () => d.ball(f.x + (destX - f.x) * e, f.y + (destY - f.y) * e, 9, '#d2b07a'),
      });
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : s.ammo;
    const purse = (n == null ? '0' : n) + (alleyPlay ? (n === 1 ? ' penny' : ' pennies') : ' practice');
    const mode = s.mode === 'live' ? 'night awake' : s.mode === 'lane' ? (s.charging ? 'match drawn' : 'wake the night') : 'dark';
    const clock = s.mode === 'live' ? Math.ceil(Math.max(0, s.clock)) + 's' : 'clock ready';
    const prize = s.prizeOut ? 'prize kept' : (s.notes.some(n => n.prize) ? 'catch the prize' : s.hits + '/' + s.need + ' to unhook');
    return purse + ' · ' + clock + ' · ' + s.score + ' · ' + prize + ' · ' + mode + ' · ' + s.note;
  },
};
