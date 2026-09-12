import {clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, owned} from '../wallet.js?v=booth-play-2';
import {bindPrize, takePrize} from '../chapter-kit.js?v=prize-fly-1';

const DUMP_CAP = 16;
const STROKE = 0.42;
const SHOVE = 86;
const LIP_SPEED = 18;
const BOOK = 'pennyFever.ducklingParade';
const POND = {left: 198, right: 702, back: 268, lip: 1008};
const SETS = [
  {prize: 'brave-try-ribbon', ducks: 7, pads: 2},
  {prize: 'pond-lily-dish', ducks: 8, pads: 3},
  {prize: 'crowned-duck', ducks: 9, pads: 3},
  {prize: 'sleepy-dragon', ducks: 10, pads: 4},
  {prize: 'spooky-pumpkin-friend', ducks: 11, pads: 4},
  {prize: 'crown-turtle', ducks: 12, pads: 5},
];
const HOUSES = [
  {x: 450, name: 'the lantern landing'},
  {x: 318, name: 'the willow house'},
  {x: 450, name: 'the heart arch'},
  {x: 582, name: 'the reed nook'},
  {x: 278, name: 'the lily porch'},
  {x: 622, name: 'the moon jetty'},
];
const PAD_SPOTS = [
  {x: 450, y: 720, r: 42},
  {x: 400, y: 520, r: 32},
  {x: 590, y: 640, r: 28},
  {x: 290, y: 700, r: 24},
  {x: 520, y: 860, r: 26},
  {x: 330, y: 430, r: 22},
];
const SPRITES = [
  'crowned-duck', 'brave-try-ribbon', 'lucky-dish', 'sleepy-dragon',
  'spooky-pumpkin-friend', 'crown-turtle', 'penny-purse', 'everyday-penny',
];

function padsFor(level) {
  return PAD_SPOTS.slice(0, (SETS[level] || SETS[0]).pads).map(p => ({...p}));
}
function homeFor(level) {
  const h = HOUSES[level] || HOUSES[0];
  return {x: h.x, y: POND.lip + 22, name: h.name};
}
function defOf(id) {
  const prize = SETS.some(s => s.prize === id);
  if (prize) return {r: 22, w: 52, color: '#c4a46a', prize: true, unique: true, duck: id === 'crowned-duck'};
  if (id === 'everyday-penny') return {r: 14, w: 28, color: '#b68445', token: true};
  return {r: 18, w: 44, color: '#e5c46c', duck: true};
}
function mint(id, x, y) {
  const def = defOf(id);
  return {
    id, x, y, vx: 0, vy: 0,
    r: def.r, w: def.w, color: def.color,
    prize: !!def.prize, unique: !!def.unique, token: !!def.token, duck: !!def.duck,
    falling: false, face: 1,
  };
}
function plantPrize(coins, level, rng) {
  const id = (SETS[level] || SETS[0]).prize;
  if (!id) return;
  if (coins.some(c => !c.falling && c.id === id)) return;
  coins.push(mint(id,
    450 + (rng() - 0.5) * 72,
    POND.back + (POND.lip - POND.back) * 0.36 + (rng() - 0.5) * 22));
}
function pack(level, rng) {
  const set = SETS[level] || SETS[0];
  const out = [];
  const dx = 46, dy = 52;
  let n = 0;
  for (let y = POND.back + 58; y <= POND.lip - 90; y += dy) {
    const inset = (Math.floor((y - POND.back) / dy) % 2) * (dx * 0.45);
    for (let x = POND.left + 36 + inset; x <= POND.right - 36; x += dx) {
      if (n >= set.ducks) break;
      const id = rng() < 0.22 ? 'everyday-penny' : 'duckling';
      out.push(mint(id, x + (rng() - 0.5) * 4, y + (rng() - 0.5) * 3));
      n++;
    }
    if (n >= set.ducks) break;
  }
  return out;
}
function readStore() {
  if (typeof localStorage === 'undefined') return {v: 1, tables: {}};
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1 && blob.tables) return blob;
  } catch { /* ignore */ }
  return {v: 1, tables: {}};
}
function loadTable(chapter) {
  const row = readStore().tables[String(chapter)];
  if (!row || !Array.isArray(row.pieces) || !row.pieces.length) return null;
  return row;
}
function snapshot(s) {
  return {
    v: 1,
    chapter: s.level || 0,
    t: s.t,
    aim: s.aim,
    dropped: s.dropped,
    score: s.score,
    homeFlock: s.homeFlock,
    restock: s.restock,
    queue: s.queue,
    seen: (s.seen || []).slice(),
    paid: (s.paid || []).slice(),
    won: !!s.won,
    pieces: s.coins.filter(c => !c.falling).map(c => ({
      id: c.id, x: +c.x.toFixed(2), y: +c.y.toFixed(2),
      vx: +c.vx.toFixed(2), vy: +c.vy.toFixed(2),
    })),
  };
}
function persist(s) {
  if (!s || typeof localStorage === 'undefined') return;
  try {
    const store = readStore();
    store.tables[String(s.level || 0)] = snapshot(s);
    localStorage.setItem(BOOK, JSON.stringify(store));
  } catch { /* quota */ }
  s.dirty = false;
  s.saveAt = s.t;
}
function flyHome(s, c, prize) {
  s.fly = s.fly || [];
  s.fly.push({
    id: c.id, x: c.x, y: c.y, w: c.w, color: c.color, duck: !!c.duck,
    t: 0, dur: 0.7, prize: !!prize,
  });
}
function payout(s, c) {
  const chapter = SETS[s.level] || SETS[0];
  const wonChapter = c.id === chapter.prize;
  if (wonChapter && !s.won) {
    s.won = true;
    s.settle = 0.9;
    if (alleyPlay) keep(chapter.prize, 'duck-pond');
    takePrize(s, chapter.prize, {x: c.x, y: c.y});
    if (!s.paid.includes(c.id)) s.paid.push(c.id);
    flyHome(s, c, true);
    s.note = itemName(chapter.prize) + ' paddled onto the landing — into the treasure book!';
  } else if (c.token) {
    s.score += 1;
    flyHome(s, c, false);
    s.note = 'A crumb washed ashore.';
  } else {
    s.homeFlock++;
    flyHome(s, c, false);
    s.note = 'A duckling made it to ' + s.home.name + '.';
  }
  s.dirty = true;
}
function dropOne(s, id, x) {
  const piece = mint(id, clamp(x, POND.left + 22, POND.right - 22), POND.back - 86);
  piece.falling = true;
  piece.vy = 240;
  s.coins.push(piece);
  s.dirty = true;
}
function startStroke(s) {
  s.stroke = 0.001;
  s.started = true;
}
function drop(s) {
  if (s.won || s.result || s.cooldown > 0) return;
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny. Cash a booth ticket for a five-penny stack.';
      return;
    }
    s.started = true;
    s.dropped = (s.dropped || 0) + 1;
  } else {
    if (s.ammo <= 0) return;
    s.ammo--;
  }
  s.cooldown = 0.28;
  dropOne(s, 'everyday-penny', s.aim);
  startStroke(s);
  s.restock += 1;
  s.note = 'A crumb for Dottie. She paddles once.';
}
function dump(s) {
  if (s.won || s.result) return;
  if (s.cooldown > 0 && s.queue > 0) return;
  const have = alleyPlay ? (pocket() || 0) : s.ammo;
  const take = Math.min(DUMP_CAP, Math.max(0, have | 0));
  if (take < 1) {
    s.note = alleyPlay ? 'The purse is empty. Cash a ticket for a five-penny stack.' : 'No practice crumbs left.';
    return;
  }
  if (alleyPlay) {
    if (!spend(take)) {
      s.note = 'Need pennies in the pocket.';
      return;
    }
    s.started = true;
  } else {
    s.ammo -= take;
  }
  s.queue += take;
  s.dropped = (s.dropped || 0) + take;
  s.cooldown = 0.08;
  startStroke(s);
  s.note = take === 1 ? 'One crumb from the purse.' : take + ' crumbs scattered for the flock.';
}
function seat(s, id, rng) {
  const c = mint(id,
    POND.left + 40 + rng() * (POND.right - POND.left - 80),
    POND.back + 36 + rng() * 40);
  s.coins.push(c);
  s.dirty = true;
  return c;
}
function restock(s, rng) {
  const ducks = s.coins.filter(c => !c.falling && c.duck).length;
  if (ducks < 5 && rng() < 0.45) seat(s, 'duckling', rng);
  if (s.restock > 0 && s.restock % 7 === 0) {
    seat(s, rng() < 0.35 ? 'everyday-penny' : 'duckling', rng);
    s.note = 'A wanderer joined the back of the pond.';
  }
}
function bouncePads(c, pads) {
  for (const p of pads) {
    const dx = c.x - p.x, dy = c.y - p.y, dd = Math.hypot(dx, dy), need = c.r + p.r;
    if (dd >= need || dd < 0.001) continue;
    const nx = dx / dd, ny = dy / dd, overlap = need - dd;
    c.x += nx * overlap;
    c.y += ny * overlap;
    const vn = c.vx * nx + c.vy * ny;
    if (vn < 0) {
      c.vx -= vn * 1.15 * nx;
      c.vy -= vn * 1.15 * ny;
    }
  }
}
function hydrate(blob, level, rng) {
  const coins = (blob.pieces || []).map(p => {
    const c = mint(p.id, p.x, p.y);
    c.x = clamp(c.x, POND.left + c.r + 2, POND.right - c.r - 2);
    c.y = clamp(c.y, POND.back + c.r + 4, POND.lip - c.r - 3);
    c.vx = 0;
    c.vy = 0;
    return c;
  });
  if (coins.length < 4) coins.push(...pack(level, rng));
  if (!blob.won) plantPrize(coins, level, rng);
  const ammo = alleyPlay ? 0 : Math.max(8, 12 + level * 3);
  return {
    level, t: blob.t || 0, coins, aim: blob.aim || 450, ammo, total: ammo,
    score: blob.score || 0, homeFlock: blob.homeFlock || 0, cooldown: 0, settle: 0,
    dropped: blob.dropped || 0, started: false, queue: blob.queue || 0,
    restock: blob.restock || 0, seen: blob.seen || [], paid: blob.paid || [],
    won: !!blob.won, dirty: false, saveAt: 0, stroke: 0, fly: [],
    pads: padsFor(level), home: homeFor(level),
    note: blob.won
      ? itemName((SETS[level] || SETS[0]).prize) + ' already paddled home. The pond still waits.'
      : 'The pond waited. Toss a crumb and Dottie paddles.',
  };
}
function fresh(level, rng) {
  const coins = pack(level, rng);
  plantPrize(coins, level, rng);
  const ammo = 12 + level * 3;
  const home = homeFor(level);
  const prize = (SETS[level] || SETS[0]).prize;
  return {
    level, t: 0, coins, aim: 450, ammo, total: ammo, score: 0, homeFlock: 0,
    cooldown: 0, settle: 0, dropped: 0, started: !alleyPlay, queue: 0, restock: 0,
    seen: prize ? [prize] : [], paid: [], won: false, dirty: !!alleyPlay, saveAt: 0,
    stroke: 0, fly: [], pads: padsFor(level), home,
    note: alleyPlay
      ? 'The ' + itemName(prize) + ' is among the flock. Shove it onto ' + home.name + '.'
      : 'Toss a crumb. Dottie paddles. Bring the prize to ' + home.name + '.',
  };
}

export default {
  title: 'Duckling Parade',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  tableDetail: alleyPlay
    ? 'A living pond. Walk away and the ducklings wait. Toss a crumb (one penny) and Dottie paddles once. Sit still and the water holds. Shove this chapter’s prize onto the landing to keep it. Scatter the purse and the reeds usually win.'
    : 'Practice pond. Toss crumbs, steer Dottie while she paddles, and shove the prize onto the landing. Workshop scores stay out of the wallet.',
  intro: alleyPlay
    ? 'Dottie’s ducklings went exploring, and the pond keeps whatever you leave on it. Six landings, one keepsake each. A penny buys one paddle. Shove the prize onto the house that is waiting with a lantern — then it is yours to keep.'
    : 'Dottie’s workshop pond. Toss crumbs, paddle the flock, and bring this chapter’s prize to the landing. Practice never writes the pocket.',
  instructions: alleyPlay
    ? 'Aim along the bank and toss a crumb (one penny). Dottie paddles once — steer her while she strokes. Lily pads turn the tide. The chapter prize is in the water; shove it onto the glowing landing to stamp the treasure book. Leave and this pond waits. Cash a booth ticket for a five-penny stack if the purse is empty.'
    : 'Aim and toss a crumb. Steer Dottie during the paddle. Shove the prize onto the landing. Workshop play is free.',
  liveTitle: 'Duckling Parade',
  liveDetail: alleyPlay
    ? 'A penny a crumb. Dottie paddles once. Shove this landing’s prize home to keep it.'
    : 'Toss crumbs. Steer the paddle. Bring the prize home.',
  liveButton: 'Step down to the pond',
  levels: ['Four little wanderers', 'The willow house', 'The grand duck parade', 'The reed nook parade', 'Seven ducklings out', 'Home to the moon jetty'],
  sprites: SPRITES,
  prizes: SETS.map(s => s.prize),
  actions: [
    {id: 'left', label: 'Paddle left', hold: true},
    {id: 'drop', label: alleyPlay ? 'Toss a crumb · 1 penny' : 'Toss a practice crumb'},
    {id: 'dump', label: alleyPlay ? 'Scatter the crumbs' : 'Scatter the rest'},
    {id: 'right', label: 'Paddle right', hold: true},
  ],
  persist,
  create(level, rng) {
    const roll = rng || Math.random;
    const saved = loadTable(level);
    if (saved && saved.pieces && saved.pieces.length >= 4) {
      const s = hydrate(saved, level, roll);
      s.level = level;
      s.pads = padsFor(level);
      s.home = homeFor(level);
      if (!s.won) plantPrize(s.coins, level, roll);
      bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
      return s;
    }
    const s = fresh(level, roll);
    persist(s);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    s.cooldown = Math.max(0, s.cooldown - dt);
    if (s.result) return;
    if (s.won) {
      for (const f of (s.fly || [])) f.t += dt;
      s.fly = (s.fly || []).filter(f => f.t < f.dur);
      s.settle = Math.max(0, (s.settle || 0) - dt);
      if (s.settle <= 0 && !s.result) {
        const prize = (SETS[s.level] || SETS[0]).prize;
        done(s, 'Every duckling home',
          itemName(prize) + ' paddled into the treasure book. Dottie is lighting the lantern at ' + s.home.name + '.',
          {prize, won: true});
      }
      if (s.dirty && s.t - (s.saveAt || 0) > 0.8) persist(s);
      return;
    }
    const axis = (input.keys.has('ArrowRight') || input.actions.has('right') ? 1 : 0)
      - (input.keys.has('ArrowLeft') || input.actions.has('left') ? 1 : 0);
    s.aim = clamp(s.aim + axis * 230 * dt, 260, 640);
    if (s.queue > 0 && s.cooldown <= 0) {
      dropOne(s, 'everyday-penny', s.aim + (Math.random() - 0.5) * 18);
      s.queue--;
      s.restock += 1;
      s.cooldown = 0.09;
      s.started = true;
    }
    if (alleyPlay && !s.started) {
      if (s.dirty && s.t - (s.saveAt || 0) > 1.2) persist(s);
      return;
    }
    const shoving = s.stroke > 0 && s.stroke < 0.7;
    if (s.stroke > 0) {
      const was = s.stroke;
      s.stroke += dt / STROKE;
      const t = clamp(s.stroke, 0, 1);
      const extend = t < 0.7 ? t / 0.7 : 1;
      const prev = was < 0.7 ? was / 0.7 : 1;
      if (extend > prev) {
        const dPlate = (extend - prev) * SHOVE;
        const plate = POND.back + 22 + extend * SHOVE;
        const depth = POND.lip - POND.back || 1;
        for (const c of s.coins) {
          if (c.falling) continue;
          if (c.y < plate + c.r) {
            c.y += dPlate;
            c.vy = Math.max(c.vy, dPlate * 80);
            if (Math.abs(c.x - s.aim) < 90) c.vx += (s.aim - c.x) * 0.04;
          } else {
            const along = clamp((c.y - POND.back) / depth, 0, 1);
            const tide = dPlate * (0.08 + 0.18 * along);
            c.y += tide;
            c.vy = Math.max(c.vy, tide * 40);
          }
        }
      }
      if (s.stroke >= 1) s.stroke = 0;
    }
    if (s.fly) {
      for (const f of s.fly) f.t += dt;
      s.fly = s.fly.filter(f => f.t < f.dur);
    }
    const busy = s.queue > 0 || s.stroke > 0 || s.coins.some(c => c.falling || c.vx * c.vx + c.vy * c.vy > 2.2);
    if (!busy) {
      for (const c of s.coins) { c.vx = 0; c.vy = 0; }
      if (s.dirty && s.t - (s.saveAt || 0) > 1.2) persist(s);
      return;
    }
    if (s.restock && s.restock % 7 === 0) {
      restock(s, Math.random);
      s.restock += 0.001;
    }
    for (let step = 0; step < 3; step++) {
      const h = dt / 3;
      for (const c of s.coins) {
        if (c.falling) {
          c.vy += 980 * h;
          c.x += c.vx * h;
          c.y += c.vy * h;
          let hit = false;
          for (const o of s.coins) {
            if (o === c || o.falling) continue;
            const dx = o.x - c.x, dy = o.y - c.y, dd = Math.hypot(dx, dy), need = c.r + o.r;
            if (dd >= need || dd < 0.001) continue;
            hit = true;
            const nx = dx / dd, ny = dy / dd, overlap = need - dd;
            c.x -= nx * overlap; c.y -= ny * overlap;
            const j = Math.max(0, c.vy) * 0.62;
            o.vx += nx * j * 0.35;
            o.vy += Math.max(j * 0.85, ny * j);
            c.vy *= 0.28;
            c.vx *= 0.45;
          }
          bouncePads(c, s.pads);
          if (hit && c.vy < 70) {
            c.falling = false;
            c.vy = Math.max(c.vy, 18);
          } else if (!hit && c.y >= POND.back + c.r + 10) {
            c.falling = false;
            c.y = POND.back + c.r + 10;
            c.vx = 0;
            c.vy = 0;
          }
          c.x = clamp(c.x, POND.left + c.r, POND.right - c.r);
          continue;
        }
        c.x += c.vx * h;
        c.y += c.vy * h;
        c.vx *= Math.exp(-7.2 * h);
        c.vy *= Math.exp(-6.4 * h);
        if (c.vx) c.face = c.vx >= 0 ? 1 : -1;
        if (c.x < POND.left + c.r) { c.x = POND.left + c.r; c.vx = Math.abs(c.vx) * 0.2; }
        if (c.x > POND.right - c.r) { c.x = POND.right - c.r; c.vx = -Math.abs(c.vx) * 0.2; }
        if (c.y < POND.back + c.r) { c.y = POND.back + c.r; c.vy = Math.max(0, c.vy); }
        bouncePads(c, s.pads);
        if (c.y + c.r > POND.lip && !shoving && c.vy < LIP_SPEED) {
          c.y = POND.lip - c.r;
          c.vy = 0;
        }
      }
      const group = s.coins.filter(c => !c.falling);
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
          const a = group[i], b = group[j], dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy), need = a.r + b.r;
          if (dd >= need || dd < 0.001) continue;
          const nx = dx / dd, ny = dy / dd, overlap = need - dd;
          a.x -= nx * overlap * 0.5; a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5; b.y += ny * overlap * 0.5;
          const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (relative < 0) {
            const impulse = -relative * 0.58;
            a.vx -= nx * impulse; a.vy -= ny * impulse;
            b.vx += nx * impulse; b.vy += ny * impulse;
          }
        }
      }
    }
    const stay = [];
    for (const c of s.coins) {
      if (c.falling) { stay.push(c); continue; }
      if (c.y + c.r > POND.lip && (shoving || c.vy >= LIP_SPEED)) {
        payout(s, c);
        continue;
      }
      stay.push(c);
    }
    s.coins = stay;
    if (s.dirty && s.t - (s.saveAt || 0) > 1.4) persist(s);
  },
  pointer(s, type, p) {
    if (s.won || s.result) return;
    if (type === 'move' || type === 'down') s.aim = clamp(p.x, 260, 640);
    if (type === 'up') drop(s);
  },
  action(s, id) {
    if (id === 'drop') drop(s);
    if (id === 'dump') dump(s);
  },
  key(s, k, down) {
    if (!down || s.won || s.result) return;
    if (k === ' ') drop(s);
    if (k === 'Enter' || k === 'd' || k === 'D') dump(s);
  },
  draw(s, d) {
    d.ellipse(450, 640, 292, 430, '#2a5a5844', '#b7d4c066', 3);
    d.poly([[POND.left - 8, POND.back], [POND.right + 8, POND.back], [POND.right + 18, POND.lip], [POND.left - 18, POND.lip]], '#3a6a6288', '#d7e8c4', 3);
    d.line({x: POND.left + 8, y: POND.lip - 2}, {x: POND.right - 8, y: POND.lip - 2}, '#f0e2a8', 5);
    const extend = s.stroke > 0 && s.stroke < 0.7 ? s.stroke / 0.7 : (s.stroke >= 0.7 ? 1 : 0);
    const plate = POND.back + 18 + extend * SHOVE;
    d.line({x: POND.left + 16, y: plate}, {x: POND.right - 16, y: plate}, '#8fb8a0aa', 10);
    d.line({x: POND.left + 16, y: plate - 4}, {x: POND.right - 16, y: plate - 4}, '#e8f6d8', 2);
    for (const l of s.pads) {
      d.ellipse(l.x + 3, l.y + 5, l.r, l.r * 0.7, '#1b4a4440');
      d.ellipse(l.x, l.y, l.r, l.r * 0.72, '#6f9c7466', '#b7c58d88', 1.5);
    }
    const house = s.home;
    d.glow(house.x, house.y, s.won ? 96 : 70, '#ffe6a4');
    d.ellipse(house.x, house.y, 78, 44, '#6a4a2888', '#fff0b3', 3);
    d.text(house.name, house.x, house.y + 36, 13, '#fff1ba');
    const order = [...s.coins].sort((a, b) => a.y - b.y);
    for (const c of order) {
      if (c.token) {
        d.item(spriteKey('everyday-penny'), c.x, c.y, {w: c.w, fallback: () => d.ball(c.x, c.y, c.r, c.color)});
        continue;
      }
      if (c.prize && !c.duck) {
        d.item(spriteKey(c.id), c.x, c.y, {w: c.w, fallback: () => d.star(c.x, c.y, c.r)});
        continue;
      }
      const ctx = d.c;
      ctx.save();
      ctx.translate(c.x, c.y + Math.sin(s.t * 3 + c.x) * 2);
      ctx.scale(c.face || 1, 1);
      if (c.id === 'crowned-duck' || (c.prize && c.duck)) {
        d.item(spriteKey('crowned-duck'), 0, 0, {w: c.w, shadow: false, fallback: () => d.animal(0, 0, 'duck', 0.95, s.t)});
      } else {
        d.animal(0, 0, 'duck', 0.74, s.t);
      }
      ctx.restore();
    }
    const dottieY = plate + 8;
    const ctx = d.c;
    ctx.save();
    ctx.translate(s.aim, dottieY + Math.sin(s.t * 3) * 2);
    d.animal(0, 0, 'duck', 1.16, s.t);
    ctx.restore();
    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    const px = 118, py = 148;
    d.item(spriteKey('penny-purse'), px, py, {w: 128, fallback: () => d.heart(px, py, 40, '#6a7a52')});
    const heap = Math.min(Math.max(0, n === '∞' ? 0 : n), 28);
    for (let i = 0; i < heap; i++) {
      const row = Math.floor(i / 7), col = i % 7;
      const hx = px - 44 + col * 14 + row * 3;
      const hy = py + 8 - row * 9 - (col % 2) * 3;
      d.item(spriteKey('everyday-penny'), hx, hy, {w: 22, shadow: false, fallback: () => d.ball(hx, hy, 8, '#b68445')});
    }
    d.text(String(n), px, py + 72, 22, '#fff6d8');
    d.text(n === 1 ? 'penny in the purse' : 'pennies in the purse', px, py + 92, 13, '#ead6a4');
    d.poly([[742, 48], [838, 52], [834, 128], [738, 122]], '#6b3a3a', '#e8d4a0', 2);
    d.text('treasures', 788, 144, 13, '#ead6a4');
    const prize = (SETS[s.level] || SETS[0]).prize;
    d.item(spriteKey(prize), 788, 88, {w: 54, fallback: () => d.star(788, 88, 18)});
    for (let i = 0; i < SETS.length; i++) {
      const x = 86 + (i % 3) * 44, y = 268 + Math.floor(i / 3) * 50;
      const got = owned(SETS[i].prize) || (s.won && i === s.level);
      d.item(spriteKey(SETS[i].prize), x, y, {w: 32, fallback: () => d.star(x, y, 11)});
      if (got) d.text('✓', x + 12, y - 10, 15, '#f6e2a2');
      else d.circle(x, y, 16, '#1a120866');
    }
    for (const f of (s.fly || [])) {
      const u = Math.min(1, f.t / f.dur);
      const e = 1 - (1 - u) * (1 - u);
      const destX = f.prize ? 788 : house.x, destY = f.prize ? 88 : house.y;
      const fx = f.x + (destX - f.x) * e, fy = f.y + (destY - f.y) * e;
      if (f.duck && !f.prize) {
        d.animal(fx, fy, 'duck', Math.max(0.35, 0.74 * (1 - u * 0.4)), s.t);
      } else {
        d.item(spriteKey(f.id), fx, fy, {w: Math.max(16, (f.w || 32) * (1 - u * 0.4)), fallback: () => d.ball(fx, fy, 10, f.color || '#b68445')});
      }
    }
    d.poly([[s.aim - 22, 92], [s.aim + 22, 92], [s.aim + 14, 138], [s.aim - 14, 138]], '#8a7450cc', '#ead097', 2);
    d.text('↓', s.aim, 124, 20, '#fff3d0');
    if (alleyPlay && !s.started) d.text('pond still', 450, 72, 18, '#f0d6a8');
    if (s.note) d.text(s.note, 450, 196, 14, '#fff1d0');
  },
  readout: s => {
    const on = s.coins.filter(c => !c.falling).length;
    const n = alleyPlay ? pocket() : s.ammo;
    const prize = (SETS[s.level] || SETS[0]).prize;
    if (alleyPlay) {
      return (n == null ? '0' : n) + (n === 1 ? ' penny' : ' pennies') + ' in the purse · '
        + on + ' on the pond · ' + s.homeFlock + ' home'
        + (s.queue ? ' · scattering ' + s.queue : '')
        + ' · ' + (s.won ? itemName(prize) + ' kept' : s.note);
    }
    return n + ' / ' + s.total + ' crumbs · ' + on + ' on the pond · ' + s.homeFlock + ' home'
      + (s.ammo === 0 ? ' · settling' : '') + ' · ' + s.note;
  },
};
