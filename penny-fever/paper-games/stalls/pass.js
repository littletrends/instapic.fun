import {clamp, dist, done} from '../draw.js?v=ink-1';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, owned} from '../wallet.js?v=bea-backstage-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const BOOK = 'pennyFever.backstageRun';
const DUMP_CAP = 8;
const LIP_SPEED = 16;
const STROKE = 0.42;
const SHOVE = 40;
const CATCH = 56;
const LAYERS = [
  {left: 188, right: 712, back: 418, lip: 508},
  {left: 182, right: 718, back: 628, lip: 728},
  {left: 176, right: 724, back: 838, lip: 948},
];
const SETS = [
  {prize: 'cue-script', mix0: ['velvet-mask'], mix1: ['secret-door-key', 'velvet-mask'], mix2: ['velvet-mask'], n0: 3, n1: 4, n2: 3, uniqueLayer: 1, gap: 172, lights: 0},
  {prize: 'velvet-mask', mix0: ['secret-door-key'], mix1: ['velvet-mask', 'secret-door-key'], mix2: ['velvet-mask'], n0: 4, n1: 5, n2: 4, uniqueLayer: 1, gap: 152, lights: 1},
  {prize: 'secret-door-key', mix0: ['velvet-mask'], mix1: ['velvet-mask', 'secret-door-key'], mix2: ['velvet-mask'], n0: 5, n1: 5, n2: 4, uniqueLayer: 0, gap: 136, lights: 2},
  {prize: 'showman-ribbon', mix0: ['velvet-mask', 'secret-door-key'], mix1: ['velvet-mask'], mix2: ['secret-door-key', 'velvet-mask'], n0: 5, n1: 6, n2: 5, uniqueLayer: 0, gap: 122, lights: 2},
  {prize: 'cue-card', mix0: ['velvet-mask', 'secret-door-key'], mix1: ['velvet-mask', 'secret-door-key'], mix2: ['velvet-mask'], n0: 6, n1: 6, n2: 5, uniqueLayer: 0, gap: 108, lights: 3},
  {prize: 'stage-door-pass', mix0: ['velvet-mask', 'secret-door-key'], mix1: ['velvet-mask', 'secret-door-key'], mix2: ['velvet-mask', 'secret-door-key'], n0: 6, n1: 7, n2: 6, uniqueLayer: 0, gap: 94, lights: 3},
];
const DEFS = {
  'everyday-penny': {r: 14, w: 28, color: '#b68445'},
  'secret-door-key': {r: 16, w: 36, color: '#d5a45d'},
  'velvet-mask': {r: 18, w: 40, color: '#9a4d4a'},
  'showman-pass': {r: 20, w: 48, color: '#c4a46a'},
  'showman-ribbon': {r: 18, w: 44, color: '#b56b62'},
  'pocket-theatre': {r: 20, w: 48, color: '#8a6a4a'},
  'midnight-invitation': {r: 20, w: 48, color: '#6a5a8a'},
};
const LIGHTS = [
  {x: 175, y: 765, base: 0},
  {x: 725, y: 545, base: Math.PI},
  {x: 450, y: 980, base: 1.15},
];
const HIDES = [
  {x: 670, y: 555}, {x: 240, y: 755}, {x: 250, y: 420}, {x: 640, y: 410},
];
const SPRITES = [
  'secret-door-key', 'velvet-mask', 'showman-pass', 'showman-ribbon',
  'pocket-theatre', 'midnight-invitation', 'penny-purse', 'everyday-penny',
];

function setOf(level) { return SETS[level] || SETS[0]; }
function prizeOf(s) { return setOf(s.level).prize; }
function mint(id, x, y, layer, extra = {}) {
  const def = DEFS[id] || DEFS['velvet-mask'];
  return {
    id, x, y, layer, vx: 0, vy: 0, r: def.r, w: def.w, color: def.color,
    unique: !!extra.unique, prize: !!extra.prize, falling: false,
  };
}
function absNear(a, b, r) { return Math.abs(a - b) < r; }
function inGap(s, c) {
  const g = s.curtains[c.layer];
  if (!g) return true;
  const wide = g.gap * (s.gapBoost || 1);
  return Math.abs(c.x - g.x) < wide / 2 - 8;
}
function atLip(c) {
  const L = LAYERS[c.layer] || LAYERS[2];
  return c.y + c.r >= L.lip - 10;
}
function hiding(s, p) { return s.hides.some(h => dist(p, h) < 47); }
function blocked(s, x, y) {
  return s.curtains.some(g => Math.abs(y - g.y) < 30 && (x < g.x - g.gap * (s.gapBoost || 1) / 2 + 16 || x > g.x + g.gap * (s.gapBoost || 1) / 2 - 16));
}
function inBeam(s, p) {
  for (const l of s.lights) {
    const dx = p.x - l.x, dy = p.y - l.y, a = Math.atan2(dy, dx);
    const delta = Math.atan2(Math.sin(a - l.a), Math.cos(a - l.a));
    if (Math.hypot(dx, dy) < 460 && Math.abs(delta) < 0.16) return true;
  }
  return false;
}
function readStore() {
  if (typeof localStorage === 'undefined') return {v: 1, tables: {}};
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1 && blob.tables) return blob;
  } catch { /* ignore */ }
  return {v: 1, tables: {}};
}
function snapshot(s) {
  return {
    v: 1,
    chapter: s.level || 0,
    t: s.t,
    dropped: s.dropped,
    score: s.score,
    paid: s.paid.slice(),
    seen: s.seen.slice(),
    keysGot: s.keysGot,
    px: +s.p.x.toFixed(2),
    py: +s.p.y.toFixed(2),
    cx: +s.checkpoint.x.toFixed(2),
    cy: +s.checkpoint.y.toFixed(2),
    prizeOut: !!s.prizeOut,
    pieces: s.props.filter(c => !c.falling && !c.caught).map(c => ({
      id: c.id, x: +c.x.toFixed(2), y: +c.y.toFixed(2), layer: c.layer,
      unique: !!c.unique, prize: !!c.prize,
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
function plantPrize(props, level, rng) {
  const set = setOf(level);
  const id = set.prize;
  if (props.some(c => !c.falling && (c.unique || c.id === id && c.prize))) return;
  const layer = clamp(set.uniqueLayer | 0, 0, 2);
  const L = LAYERS[layer];
  props.push(mint(id,
    (L.left + L.right) / 2 + (rng() - 0.5) * 110,
    L.back + (L.lip - L.back) * 0.34 + (rng() - 0.5) * 16,
    layer, {unique: true, prize: true}));
}
function pack(layer, rng, ids, n) {
  const L = LAYERS[layer];
  const out = [];
  const count = Math.max(1, n | 0);
  for (let i = 0; i < count; i++) {
    const id = ids[i % ids.length];
    const x = L.left + 36 + (i + 0.5) * (L.right - L.left - 72) / count + (rng() - 0.5) * 10;
    const y = L.back + 26 + rng() * 22;
    out.push(mint(id, x, y, layer));
  }
  return out;
}
function flyHome(s, c, toBook) {
  s.fly = s.fly || [];
  s.fly.push({
    id: c.id, x: c.x, y: c.y, w: c.w, color: c.color, t: 0, dur: 0.7,
    prize: !!toBook,
  });
}
function catchPiece(s, c) {
  if (c.caught) return;
  c.caught = true;
  if (c.prize && c.id === prizeOf(s)) {
    claimUnique(s, c);
    return;
  }
  if (c.id === 'secret-door-key') {
    s.keysGot++;
    s.checkpoint = {x: s.p.x, y: s.p.y};
    s.gapBoost = 1.32;
    s.shield = 1.1;
    s.note = 'A secret door key. The next gap breathes wider.';
  } else {
    s.score++;
    s.note = itemName(c.id) + ' into the wings.';
  }
  flyHome(s, c, false);
  s.dirty = true;
}
function claimUnique(s, c) {
  if (s.won) return;
  const prize = prizeOf(s);
  s.won = true;
  s.prizeOut = true;
  s.winAt = s.t;
  if (!s.paid.includes(prize)) s.paid.push(prize);
  if (!s.seen.includes(prize)) s.seen.push(prize);
  if (alleyPlay) keep(prize, 'pass');
  takePrize(s, prize);
  flyHome(s, c, true);
  s.dirty = true;
  s.note = itemName(prize) + ' — shoved into the wings!';
}
function reseatUnique(s, c) {
  const L = LAYERS[0];
  c.layer = 0;
  c.falling = false;
  c.x = clamp(c.x + (Math.random() - 0.5) * 40, L.left + c.r + 8, L.right - c.r - 8);
  c.y = L.back + 28;
  c.vx = 0;
  c.vy = 0;
  s.note = 'A spotlight, or an empty wing — the flies kept ' + itemName(c.id) + '.';
  s.dirty = true;
}
function spill(s, c) {
  if (c.prize && c.id === prizeOf(s) && inBeam(s, c)) {
    reseatUnique(s, c);
    return true;
  }
  if (c.layer >= 2) {
    if (dist(s.p, c) < CATCH + 8) {
      catchPiece(s, c);
      return false;
    }
    if (c.prize && c.id === prizeOf(s)) {
      reseatUnique(s, c);
      return true;
    }
    return false;
  }
  c.layer += 1;
  c.falling = true;
  c.vy = 90;
  c.vx *= 0.4;
  s.note = c.prize ? itemName(c.id) + ' dropped a batten.' : 'The flies moved a row down.';
  return true;
}
function startStroke(s) {
  s.stroke = 0.001;
  s.started = true;
}
function cue(s) {
  if (s.won || s.cooldown > 0) return;
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny for the cue board. Cash a booth ticket for a five-penny stack.';
      return;
    }
    s.started = true;
  } else {
    if (s.ammo <= 0) {
      s.note = 'Practice cues are spent. This call still waits.';
      return;
    }
    s.ammo--;
    if (s.ammo === 0) s.settle = 8;
  }
  s.dropped = (s.dropped || 0) + 1;
  s.cooldown = 0.28;
  s.aim = s.p.x;
  startStroke(s);
  s.restock += 1;
  s.dirty = true;
  s.note = 'A penny into the cue board. The flies shoved.';
}
function dump(s) {
  if (s.won) return;
  if (s.cooldown > 0 && s.queue > 0) return;
  const have = alleyPlay ? (pocket() || 0) : s.ammo;
  const take = Math.min(DUMP_CAP, Math.max(0, have | 0));
  if (take < 1) {
    s.note = alleyPlay ? 'The purse is empty. Cash a ticket for a five-penny stack.' : 'No practice cues left.';
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
    if (s.ammo === 0) s.settle = 8;
  }
  s.queue += take;
  s.dropped = (s.dropped || 0) + take;
  s.cooldown = 0.08;
  s.aim = s.p.x;
  startStroke(s);
  s.dirty = true;
  s.note = take === 1 ? 'One penny from the purse.' : take + ' pennies dumped into the flies.';
}
function restock(s, rng) {
  const keys = s.props.filter(c => !c.falling && c.id === 'secret-door-key' && !c.prize).length;
  if (keys < 1 && rng() < 0.55) {
    const L = LAYERS[0];
    s.props.push(mint('secret-door-key', L.left + 50 + rng() * (L.right - L.left - 100), L.back + 24, 0));
    s.note = 'Another key hung itself on the upstage rail.';
    s.dirty = true;
  }
}
function spotted(s) {
  s.p = {...s.checkpoint};
  s.target = null;
  s.seenMeter = 0;
  s.shield = 2;
  s.rewinds++;
  s.note = 'A spotlight found you. Back to your last safe key — the flies still hold.';
}
function fresh(level, rng) {
  const set = setOf(level);
  const props = [
    ...pack(0, rng, set.mix0, set.n0),
    ...pack(1, rng, set.mix1, set.n1),
    ...pack(2, rng, set.mix2, set.n2),
  ];
  plantPrize(props, level, rng);
  const hides = HIDES.slice(0, 2 + (set.lights > 0 ? 1 : 0) + (level >= 4 ? 1 : 0));
  const ammo = 12 + level * 2;
  return {
    level, t: 0, props, aim: 450, ammo, total: ammo, score: 0,
    cooldown: 0, settle: 0, dropped: 0, started: !alleyPlay, queue: 0, restock: 0,
    seen: [set.prize], paid: [], dirty: !!alleyPlay, saveAt: 0, stroke: 0, fly: [],
    p: {x: 450, y: 1080}, target: null, checkpoint: {x: 450, y: 1080},
    keysGot: 0, gapBoost: 1, shield: 0, rewinds: 0, steps: 0, seenMeter: 0,
    won: false, prizeOut: false, winAt: 0,
    curtains: LAYERS.map((L, i) => ({y: (L.back + L.lip) / 2, x: 450, gap: set.gap, phase: i * 1.8})),
    lights: LIGHTS.slice(0, set.lights).map(p => ({...p, a: p.base})),
    hides,
    note: alleyPlay
      ? 'The keepsake hangs in the flies. Cue a penny, then catch it in the wings.'
      : 'Practice cues. Walk the gaps. Cue the flies. Catch this call’s prize.',
  };
}
function hydrate(blob, level) {
  const set = setOf(level);
  const props = (blob.pieces || []).map(p => {
    const c = mint(p.id, p.x, p.y, p.layer | 0, {unique: !!p.unique, prize: !!p.prize});
    const L = LAYERS[c.layer] || LAYERS[2];
    c.x = clamp(c.x, L.left + c.r + 2, L.right - c.r - 2);
    c.y = clamp(c.y, L.back + c.r + 4, L.lip - c.r - 3);
    return c;
  });
  plantPrize(props, level, Math.random);
  const hides = HIDES.slice(0, 2 + (set.lights > 0 ? 1 : 0) + (level >= 4 ? 1 : 0));
  return {
    level, t: blob.t || 0, props, aim: blob.px || 450, ammo: alleyPlay ? 0 : 12 + level * 2,
    total: 12 + level * 2, score: blob.score || 0, cooldown: 0, settle: 0,
    dropped: blob.dropped || 0, started: !alleyPlay && (blob.dropped || 0) > 0, queue: 0, restock: 0,
    seen: blob.seen || [set.prize], paid: blob.paid || [], dirty: false, saveAt: 0, stroke: 0, fly: [],
    p: {x: blob.px || 450, y: blob.py || 1080}, target: null,
    checkpoint: {x: blob.cx || 450, y: blob.cy || 1080},
    keysGot: blob.keysGot || 0, gapBoost: 1, shield: 0, rewinds: 0, steps: 0, seenMeter: 0,
    won: false, prizeOut: !!blob.prizeOut, winAt: 0,
    curtains: LAYERS.map((L, i) => ({y: (L.back + L.lip) / 2, x: 450, gap: set.gap, phase: i * 1.8})),
    lights: LIGHTS.slice(0, set.lights).map(p => ({...p, a: p.base})),
    hides,
    note: 'The flies waited. Cue a penny to wake them.',
  };
}
function keyMark(d, x, y, size = 1) {
  d.ring(x, y - 12 * size, 9 * size, '#e1bb6e', 4 * size);
  d.line({x, y: y - 3 * size}, {x, y: y + 17 * size}, '#d5a45d', 5 * size);
  d.line({x, y: y + 13 * size}, {x: x + 9 * size, y: y + 13 * size}, '#e4c37e', 4 * size);
}
function curtain(d, x1, x2, y) {
  if (x2 <= x1) return;
  d.poly([[x1, y - 12], [x2, y - 12], [x2, y + 17], [x1, y + 17]], '#3f1827');
  for (let x = x1; x < x2; x += 14) {
    const end = Math.min(x + 14, x2);
    d.poly([[x, y - 13], [end, y - 13], [end, y + 12], [x, y + 17]], Math.floor((x - x1) / 14) % 2 ? '#963f4d' : '#6d2a3b');
  }
  d.line({x: x1, y: y - 14}, {x: x2, y: y - 14}, '#bd9155', 4);
  d.line({x: x1, y: y + 19}, {x: x2, y: y + 19}, '#d9b36e', 2);
}

export default {
  title: 'Backstage Run',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  tableDetail: alleyPlay
    ? 'A penny into the cue board shoves this call’s flies. Walk the gaps, catch the hanging keepsake in the wings. Sit still and nothing falls. Walk away — this curtain-call waits.'
    : 'Practice cues. Walk the gaps, cue the flies, catch the hanging prize.',
  intro: alleyPlay
    ? 'Bea left the last curtain unlocked… almost. Six curtain-calls, one keepsake hanging in the flies each time. Feed pennies into the cue board and the battens shove. Walk the tiny traveller through the gaps and catch this call’s prize as it drops into the wings. The bank likes a dumped purse. Walk away when the gap still looks kind — that call keeps.'
    : 'Bea’s workshop flies. Cue the battens, slip the gaps, catch this call’s hanging prize. Practice never writes the pocket.',
  instructions: alleyPlay
    ? 'Tap a destination or hold the arrows to walk. Space cues the flies (one penny). The scenery only shoves when you cue. Time it when the unique hangs over a gap, and stand in the wings to catch it. Dump the purse for a flood. Later calls sweep spotlights — rest in the green circles. Each key you catch is a safe return and a wider gap. Cash a booth ticket for a five-penny stack.'
    : 'Walk the gaps. Space cues the flies. Catch the hanging prize in the wings. Workshop scores never enter your wallet.',
  liveTitle: 'Backstage Run',
  liveDetail: alleyPlay
    ? 'A penny cues the flies. Walk the gaps and catch this call’s keepsake as it shoves into the wings.'
    : 'Cue the flies. Catch the hanging prize.',
  liveButton: 'Step backstage',
  levels: ['After the audience leaves', 'Someone left a light on', 'The midnight curtain call', 'A rehearsal in the dark', 'Four keys backstage', 'The last velvet call'],
  sprites: SPRITES,
  prizes: SETS.map(t => t.prize),
  actions: [
    {id: 'left', label: '←', hold: true},
    {id: 'right', label: '→', hold: true},
    {id: 'cue', label: alleyPlay ? 'Cue · 1 penny' : 'Cue the flies'},
    {id: 'dump', label: alleyPlay ? 'Dump the purse' : 'Cue the rest'},
    {id: 'wait', label: 'Wait here'},
  ],
  persist,
  create(level, rng) {
    const roll = rng || Math.random;
    const saved = readStore().tables[String(level)];
    if (saved && Array.isArray(saved.pieces) && saved.pieces.length >= 4) {
      const s = hydrate(saved, level);
      s.level = level;
      plantPrize(s.props, level, roll);
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
    s.shield = Math.max(0, s.shield - dt);
    s.gapBoost = Math.max(1, (s.gapBoost || 1) - dt * 0.12);
    for (const g of s.curtains) g.x = 450 + Math.sin(s.t * (0.42 + s.level * 0.06) + g.phase) * 155;
    for (const [i, l] of s.lights.entries()) l.a = l.base + Math.sin(s.t * 0.65 + i) * 0.55;

    if (s.won) {
      for (const f of (s.fly || [])) f.t += dt;
      s.fly = (s.fly || []).filter(f => f.t < f.dur);
      if (!s.result && s.t - (s.winAt || 0) > 0.78) {
        const prize = prizeOf(s);
        persist(s);
        done(s, 'Beyond the last velvet curtain',
          itemName(prize) + ' into the treasure book. ' + s.dropped + ' cue' + (s.dropped === 1 ? '' : 's') + ', ' + s.rewinds + ' gentle returns.',
          {prize, won: true});
      }
      return;
    }

    let dx = (input.keys.has('ArrowRight') || input.actions.has('right') ? 1 : 0)
      - (input.keys.has('ArrowLeft') || input.actions.has('left') ? 1 : 0);
    let dy = (input.keys.has('ArrowDown') || input.actions.has('down') ? 1 : 0)
      - (input.keys.has('ArrowUp') || input.actions.has('up') ? 1 : 0);
    if (dx || dy) s.target = null;
    else if (s.target) {
      dx = s.target.x - s.p.x; dy = s.target.y - s.p.y;
      if (Math.hypot(dx, dy) < 5) { s.target = null; dx = dy = 0; }
    }
    const len = Math.hypot(dx, dy);
    if (len) {
      const step = Math.min(185 * dt, len > 2 ? len : 185 * dt);
      const nx = clamp(s.p.x + dx / len * step, 195, 705);
      const ny = clamp(s.p.y + dy / len * step, 340, 1110);
      if (!blocked(s, nx, s.p.y)) s.p.x = nx;
      if (!blocked(s, s.p.x, ny)) s.p.y = ny;
      s.steps += dt;
    }
    for (const g of s.curtains) {
      const wide = g.gap * (s.gapBoost || 1);
      if (Math.abs(s.p.y - g.y) < 29 && (s.p.x < g.x - wide / 2 + 16 || s.p.x > g.x + wide / 2 - 16)) {
        s.p.y = g.y + (s.p.y < g.y ? -31 : 31);
        s.target = null;
      }
    }

    let inLight = false;
    if (!hiding(s, s.p) && !s.shield) inLight = inBeam(s, s.p);
    s.seenMeter = clamp(s.seenMeter + (inLight ? dt : dt * -2), 0, 0.48);
    if (s.seenMeter >= 0.48) spotted(s);

    for (const c of s.props) {
      if (c.falling || c.caught) continue;
      if (dist(s.p, c) < 34 && atLip(c) && inGap(s, c)) catchPiece(s, c);
    }
    s.props = s.props.filter(c => !c.caught);
    if (s.won) return;

    if (s.queue > 0 && s.cooldown <= 0) {
      s.queue--;
      s.restock += 1;
      s.aim = s.p.x;
      startStroke(s);
      s.cooldown = 0.09;
      s.started = true;
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
        const aim = s.aim || s.p.x;
        for (let i = 0; i < LAYERS.length; i++) {
          const L = LAYERS[i];
          const plate = L.back + 22 + extend * SHOVE;
          const depth = L.lip - L.back || 1;
          for (const c of s.props) {
            if (c.falling || c.layer !== i) continue;
            const focus = absNear(c.x, aim, 86) ? 1.55 : 1;
            if (c.y < plate + c.r) {
              c.y += dPlate * focus;
              c.vy = Math.max(c.vy, dPlate * 80);
              c.vx += (c.x - aim) * 0.04 * dPlate;
            } else {
              const along = clamp((c.y - L.back) / depth, 0, 1);
              const tide = dPlate * (0.06 + 0.16 * along) * focus;
              c.y += tide;
              c.vy = Math.max(c.vy, tide * 40);
            }
          }
        }
      }
      if (s.stroke >= 1) s.stroke = 0;
    }

    const busy = s.queue > 0 || s.stroke > 0 || s.props.some(c => c.falling || c.vx * c.vx + c.vy * c.vy > 2.2);
    if (!busy) {
      for (const c of s.props) { c.vx = 0; c.vy = 0; }
      if (s.dirty && s.t - s.saveAt > 1.2) persist(s);
    } else {
      if (s.restock && s.restock % 8 === 0) {
        restock(s, Math.random);
        s.restock += 0.001;
      }
      for (let step = 0; step < 3; step++) {
        const h = dt / 3;
        for (const c of s.props) {
          const L = LAYERS[c.layer] || LAYERS[2];
          if (c.falling) {
            c.vy += 980 * h;
            c.x += c.vx * h;
            c.y += c.vy * h;
            c.x = clamp(c.x, L.left + c.r, L.right - c.r);
            if (c.y >= L.back + c.r + 8 && c.vy > 0) {
              c.falling = false;
              c.y = L.back + c.r + 10;
              c.vx *= 0.3;
              c.vy = 0;
            }
            continue;
          }
          c.x += c.vx * h;
          c.y += c.vy * h;
          c.vx *= Math.exp(-7.2 * h);
          c.vy *= Math.exp(-6.4 * h);
          if (c.x < L.left + c.r) { c.x = L.left + c.r; c.vx = Math.abs(c.vx) * 0.2; }
          if (c.x > L.right - c.r) { c.x = L.right - c.r; c.vx = -Math.abs(c.vx) * 0.2; }
          if (c.y < L.back + c.r) { c.y = L.back + c.r; c.vy = Math.max(0, c.vy); }
          if (c.y + c.r > L.lip && !shoving && c.vy < LIP_SPEED) {
            c.y = L.lip - c.r;
            c.vy = 0;
          }
        }
        const groups = [[], [], []];
        for (const c of s.props) if (!c.falling && groups[c.layer]) groups[c.layer].push(c);
        for (const group of groups) {
          for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
            const a = group[i], b = group[j], dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy), need = a.r + b.r;
            if (dd >= need || dd < 0.001) continue;
            const nx = dx / dd, ny = dy / dd, overlap = need - dd;
            a.x -= nx * overlap * 0.5; a.y -= ny * overlap * 0.5;
            b.x += nx * overlap * 0.5; b.y += ny * overlap * 0.5;
          }
        }
      }
      const stay = [];
      for (const c of s.props) {
        if (c.caught) continue;
        if (c.falling) {
          if (dist(s.p, c) < CATCH) { catchPiece(s, c); continue; }
          stay.push(c);
          continue;
        }
        const L = LAYERS[c.layer];
        if (c.y + c.r > L.lip && (shoving || c.vy >= LIP_SPEED)) {
          if (inGap(s, c)) {
            if (!spill(s, c)) continue;
          } else {
            c.y = L.lip - c.r;
            c.vy = 0;
          }
        }
        stay.push(c);
      }
      s.props = stay.filter(c => !c.caught);
      if (s.dirty && s.t - s.saveAt > 1.4) persist(s);
    }

    if (s.fly) {
      for (const f of s.fly) f.t += dt;
      s.fly = s.fly.filter(f => f.t < f.dur);
    }

    if (!alleyPlay && s.ammo <= 0 && s.queue <= 0 && s.stroke <= 0 && !s.won && s.settle > 0) {
      s.settle -= dt;
      if (s.settle <= 0 && !s.props.some(c => c.falling)) {
        s.note = 'Practice cues spent. The keepsake still hangs — begin the call again.';
      }
    }
  },
  pointer(s, type, p, input) {
    if (s.won) return;
    if (type === 'down' || type === 'move' && input.down) s.target = {x: clamp(p.x, 195, 705), y: clamp(p.y, 340, 1110)};
    if (type === 'cancel') s.target = null;
  },
  action(s, id) {
    if (id === 'wait') s.target = null;
    if (id === 'cue') cue(s);
    if (id === 'dump') dump(s);
  },
  key(s, k, down) {
    if (!down || s.won) return;
    if (k === ' ') cue(s);
    if (k === 'Enter' || k === 'd' || k === 'D') dump(s);
  },
  draw(s, d) {
    for (const h of s.hides) {
      d.ellipse(h.x, h.y, 43, 31, '#71978444', '#657e5b', 2);
      d.leaf(h.x - 22, h.y + 5, -0.7, 20, '#54735a');
      d.leaf(h.x + 24, h.y - 5, 0.9, 18, '#809872');
    }
    for (const l of s.lights) {
      const c = d.c; c.save();
      const grad = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, 460);
      grad.addColorStop(0, '#ffe6a655'); grad.addColorStop(1, '#ffe6a608');
      c.fillStyle = grad; c.beginPath(); c.moveTo(l.x, l.y); c.arc(l.x, l.y, 460, l.a - 0.16, l.a + 0.16); c.closePath(); c.fill(); c.restore();
      d.circle(l.x, l.y, 14, '#40342c', '#d0ad6c', 4);
      d.line(l, {x: l.x + Math.cos(l.a) * 22, y: l.y + Math.sin(l.a) * 22}, '#f0d08f', 8);
    }
    for (let i = 0; i < LAYERS.length; i++) {
      const L = LAYERS[i];
      const extend = s.stroke > 0 && s.stroke < 0.7 ? s.stroke / 0.7 : (s.stroke >= 0.7 ? 1 : 0);
      const plate = L.back + 18 + extend * SHOVE;
      d.poly([[L.left, L.back], [L.right, L.back], [L.right + 8, L.lip], [L.left - 8, L.lip]], i === 2 ? '#5a3a228e' : '#6a462c88', '#e4c48a', 3);
      d.line({x: L.left + 10, y: plate}, {x: L.right - 10, y: plate}, '#d2b07a', 10);
      d.line({x: L.left + 10, y: plate - 4}, {x: L.right - 10, y: plate - 4}, '#f3ddb0', 3);
      d.line({x: L.left + 6, y: L.lip - 2}, {x: L.right - 6, y: L.lip - 2}, '#f0d18f', 5);
      const g = s.curtains[i];
      d.line({x: 175, y: g.y - 18}, {x: 725, y: g.y - 18}, '#45392b', 3);
      const wide = g.gap * (s.gapBoost || 1);
      curtain(d, 175, g.x - wide / 2, g.y);
      curtain(d, g.x + wide / 2, 725, g.y);
      d.ellipse(g.x, g.y + 2, wide / 2 - 13, 7, '#cfdbb566');
    }
    const order = [...s.props].sort((a, b) => a.layer - b.layer || a.y - b.y);
    for (const c of order) {
      if (c.prize) d.glow(c.x, c.y, 32, '#edc477');
      d.item(spriteKey(c.id), c.x, c.y, {
        w: c.w,
        fallback: () => {
          if (c.id === 'secret-door-key') keyMark(d, c.x, c.y);
          else d.ball(c.x, c.y, c.r, c.color);
        },
      });
    }
    d.ellipse(450, 365, 64, 21, '#3e2d2733', '#bc995e', 3);
    d.text('last velvet', 450, 328, 13, '#ead6a4');
    const prize = prizeOf(s);
    
    d.item(spriteKey(prize), 788, 84, {w: 54, fallback: () => d.star(788, 84, 18)});
    d.text('this call', 788, 144, 13, '#ead6a4');
    for (let i = 0; i < SETS.length; i++) {
      const x = 760 + (i % 3) * 28, y = 178 + Math.floor(i / 3) * 28;
      const got = owned(SETS[i].prize) || (s.won && i === s.level) || (s.paid || []).includes(SETS[i].prize);
      d.item(spriteKey(SETS[i].prize), x, y, {w: 22, fallback: () => d.star(x, y, 7)});
      if (got) d.text('✓', x + 8, y - 8, 12, '#f6e2a2');
    }
    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    const px = 132, py = 148;
    d.item(spriteKey('penny-purse'), px, py, {w: 132, fallback: () => d.heart(px, py, 40, '#6a7a52')});
    const heap = Math.min(Math.max(0, n === '∞' ? 0 : n), 28);
    for (let i = 0; i < heap; i++) {
      const row = Math.floor(i / 7), col = i % 7;
      const hx = px - 44 + col * 14 + row * 3;
      const hy = py + 8 - row * 9 - (col % 2) * 2;
      d.item(spriteKey('everyday-penny'), hx, hy, {w: 22, shadow: false, fallback: () => d.ball(hx, hy, 8, '#b68445')});
    }
    d.text(String(n), px, py + 74, 22, '#fff6d8');
    d.text(n === 1 ? 'penny for the flies' : 'pennies for the flies', px, py + 96, 13, '#ead6a4');
    for (const f of (s.fly || [])) {
      const u = Math.min(1, f.t / f.dur);
      const e = 1 - (1 - u) * (1 - u);
      const destX = f.prize ? 450 : px, destY = f.prize ? 365 : py;
      const fx = f.x + (destX - f.x) * e, fy = f.y + (destY - f.y) * e;
      d.item(spriteKey(f.id), fx, fy, {w: Math.max(18, (f.w || 32) * (1 - u * 0.4)), fallback: () => d.ball(fx, fy, 10, f.color || '#b68445')});
    }
    if (s.target) d.ellipse(s.target.x, s.target.y, 10, 6, null, '#f9e6bb', 2);
    const p = s.p;
    d.ellipse(p.x, p.y + 17, 22, 9, '#30252155');
    d.item(spriteKey('velvet-mask'), p.x, p.y, {
      w: 44, fallback: () => {
        d.line({x: p.x - 7, y: p.y + 7}, {x: p.x - 13, y: p.y + 18 + Math.sin(s.steps * 18) * 3}, '#5e4933', 5);
        d.line({x: p.x + 7, y: p.y + 7}, {x: p.x + 13, y: p.y + 18 - Math.sin(s.steps * 18) * 3}, '#5e4933', 5);
        d.poly([[p.x - 15, p.y - 14], [p.x + 15, p.y - 14], [p.x + 18, p.y + 10], [p.x - 18, p.y + 10]], '#b38750', '#ecd296', 2);
        keyMark(d, p.x, p.y - 18, 0.75);
        d.ellipse(p.x - 6, p.y - 3, 2, 3, '#493425');
        d.ellipse(p.x + 6, p.y - 3, 2, 3, '#493425');
      },
    });
    if (s.seenMeter) d.arc(p.x, p.y, 30, -Math.PI / 2, -Math.PI / 2 + s.seenMeter / 0.48 * Math.PI * 2, '#e9aa70', 5);
    if (s.shield) d.ring(p.x, p.y, 29, '#b5dab288', 2);
    if (alleyPlay && !s.started) d.text('flies still', 450, 72, 18, '#f0d6a8');
  },
  readout: s => {
    const hang = s.props.filter(c => !c.falling).length;
    const n = alleyPlay ? pocket() : s.ammo;
    const prize = itemName(prizeOf(s));
    if (alleyPlay) {
      return (n == null ? '0' : n) + (n === 1 ? ' penny' : ' pennies') + ' · ' + hang + ' hanging · ' + prize + (s.queue ? ' · dumping ' + s.queue : '') + ' · ' + s.note;
    }
    return n + ' / ' + s.total + ' cues · ' + hang + ' hanging · ' + prize + (s.ammo === 0 ? ' · settling' : '') + ' · ' + s.note;
  },
};
