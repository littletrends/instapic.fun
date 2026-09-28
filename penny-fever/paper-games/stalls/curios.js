import {clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit, owned} from '../wallet.js?v=booth-play-2';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  resultNumber, isCabinetWin, CABINET_PRIZES,
} from '../cabinet-puzzles.js?v=first-prize-1';

/** Digby — Digger's Vault claw. Packed glass capsules, joystick + DROP. */
const BOOK = 'pennyFever.capsuleCabinet.v3';
const CX = 450;
const CAB = {x: 130, y: 188, w: 640, h: 640};
/** Glass cubby of the vault booth — claw window. */
const CASE = {x: 268, y: 378, w: 364, h: 268};
const RAIL_Y = CASE.y + 18;
const FLOOR_Y = CASE.y + CASE.h - 28;
const HOUSE_SECONDS = 100;
const PIECE_CACHE = 'digby-claw-5';

const LEVELS = [
  'Brass claw',
  'Capsule tide',
  'Glass sway',
  'Deep pile',
  'Buried glow',
  'Menagerie vault',
];

const PIECE_KEYS = ['piece1', 'piece2', 'piece3', 'piece4', 'piece5', 'piece6'];
const CAPSULE_TINTS = [
  '#c6748388', '#6aaa9a88', '#e8c87888', '#7a8ec888', '#c88a5a88',
  '#a67ab088', '#8ab07088', '#d0907088', '#70a8c888', '#b8789888',
];
const EVERYDAY_DROP = ['star-token', 'moon-penny', 'crown-token', 'star-token', 'everyday-penny'];

const CREAM = '#f4d590';
const GOLD = '#e8c878';
const INK = '#3a1818';

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}
function roundRect(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

function emptyBook() {
  return {v: 3, paid: {}, sittings: {}};
}
function readBook() {
  if (typeof localStorage === 'undefined') return emptyBook();
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 3) return {paid: {}, sittings: {}, ...blob};
  } catch {}
  return emptyBook();
}
function writeBook(book) {
  if (!alleyPlay || typeof localStorage === 'undefined') return;
  try { localStorage.setItem(BOOK, JSON.stringify(book)); } catch {}
}
function chapterPaid(level) {
  return !!(readBook().paid && readBook().paid[String(level)]) || owned(CABINET_PRIZES[level]);
}
function markPaid(level) {
  if (!alleyPlay) return;
  const book = readBook();
  book.paid[String(level)] = true;
  writeBook(book);
}
function persist(s) {
  if (!alleyPlay || !s) return;
  const book = readBook();
  book.sittings[String(s.level)] = {
    phase: s.phase, seed: s.seed, charged: !!s.charged,
    aimX: s.aimX, clawX: s.clawX, capsules: s.capsules,
    won: !!s.won, note: s.note, drops: s.drops || 0, houseLeft: s.houseLeft,
  };
  writeBook(book);
}

function swayAmp(level) {
  return 6 + level * 5;
}
function slipChance(level) {
  return 0.08 + level * 0.08;
}
function clawMin() { return CASE.x + 36; }
function clawMax() { return CASE.x + CASE.w - 36; }

function pileOk(capsules) {
  return Array.isArray(capsules) && capsules.length > 0 && capsules.every(c => c && typeof c.piece === 'number');
}

function makeCapsules(level, seed) {
  const roll = rng(seed + 19 + level * 131);
  const n = 18 + (level | 0) * 4;
  const bonusIndex = Math.floor(roll() * n);
  const prize = CABINET_PRIZES[level] || CABINET_PRIZES[0];
  const list = [];
  const left = CASE.x + 28;
  const right = CASE.x + CASE.w - 28;
  const top = CASE.y + 52;
  const bottom = FLOOR_Y - 4;
  for (let i = 0; i < n; i++) {
    const layer = Math.floor((i / n) * 4);
    const stagger = (layer % 2) * 18;
    const rise = Math.pow(roll(), 0.62) * (bottom - top) * (0.55 + roll() * 0.45);
    const x = left + stagger + roll() * Math.max(40, right - left - stagger);
    const y = bottom - rise + (roll() - 0.5) * 10;
    const bonus = i === bonusIndex;
    const piece = Math.floor(roll() * PIECE_KEYS.length);
    const size = bonus ? 62 : 48 + roll() * 14;
    list.push({
      id: i,
      x: clamp(x, left, right),
      y: clamp(y, top, bottom),
      size,
      piece,
      bonus,
      prizeId: bonus ? prize : null,
      drip: bonus ? null : EVERYDAY_DROP[Math.floor(roll() * EVERYDAY_DROP.length)],
      tint: CAPSULE_TINTS[(piece + i) % CAPSULE_TINTS.length],
      taken: false,
      lift: 0,
    });
  }
  return list;
}

function nearestCapsule(s) {
  if (!s.capsules) return null;
  let best = null;
  let bestD = 1e9;
  for (const cap of s.capsules) {
    if (cap.taken) continue;
    const dx = cap.x - s.clawX;
    const dy = cap.y - (s.clawY + 48);
    const d = Math.hypot(dx, dy * 0.85);
    if (d < bestD) {
      bestD = d;
      best = cap;
    }
  }
  const reach = best ? best.size * 0.72 : 28;
  if (!best || bestD > reach) return null;
  return best;
}

function stickLayout() {
  return {cx: 640, cy: 1134, baseRx: 96, baseRy: 58, knobR: 30, maxPull: 42};
}
function dropPad() {
  return {x: 170, y: 1088, w: 250, h: 92};
}
function hitStick(p) {
  if (!p) return false;
  const L = stickLayout();
  const dx = (p.x - L.cx) / L.baseRx;
  const dy = (p.y - L.cy) / L.baseRy;
  return (dx * dx + dy * dy) <= 1.35;
}
function hitDrop(p) {
  if (!p) return false;
  const b = dropPad();
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}
function applyStick(s, p) {
  const L = stickLayout();
  const dx = (p?.x ?? L.cx) - L.cx;
  const dy = (p?.y ?? L.cy) - L.cy;
  const len = Math.hypot(dx, dy) || 1;
  const pull = Math.min(len, L.maxPull);
  s.stick = {active: true, kx: (dx / len) * pull, ky: (dy / len) * pull};
}

function beginSitting(s) {
  if (s.phase === 'aim' || s.phase === 'drop') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (alleyPlay) {
        if (!takeAttempt('curios', s.level)) {
          s.note = retryNote();
          return;
        }
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 3 + s.level * 59;
      s.launchId = (s.launchId || 0) + 1;
    }
    s.capsules = makeCapsules(s.level, s.seed);
    s.phase = 'aim';
    s.aimX = CX;
    s.clawX = CX;
    s.clawY = RAIL_Y + 36;
    s.held = null;
    s.dropT = 0;
    s.dropPhase = null;
    s.prizeKept = false;
    s.houseLeft = HOUSE_SECONDS;
    s.note = 'Aim the claw — DROP on a capsule';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function startDrop(s) {
  if (s.phase !== 'aim' || s.chargeLock) return;
  s.phase = 'drop';
  s.dropPhase = 'descend';
  s.dropT = 0;
  s._riseFromY = null;
  s.held = null;
  s.target = nearestCapsule(s);
  s.note = 'Claw descending…';
  persist(s);
}

function awardCatch(s, cap) {
  const prize = CABINET_PRIZES[s.level];
  const already = chapterPaid(s.level) || s.won;
  const mark = resultNumber(s.seed + (s.drops || 0) * 17);
  let got = null;
  let chapterWin = false;
  if (cap.bonus) {
    if (!already && isCabinetWin(s.level, mark)) {
      got = prize;
      chapterWin = true;
    } else {
      got = cap.drip || EVERYDAY_DROP[0];
    }
  } else {
    got = cap.drip || EVERYDAY_DROP[0];
  }
  if (alleyPlay) {
    if (got === 'everyday-penny') credit(1);
    else keep(got, 'curios');
    if (chapterWin) {
      markPaid(s.level);
      s.won = true;
      s.paid = true;
    }
  } else if (chapterWin) {
    s.won = true;
    s.paid = true;
  }
  if (chapterWin) takePrize(s, prize, {x: cap.x, y: cap.y});
  const label = itemName(got) || got;
  s.note = chapterWin
    ? 'The claw held the ' + label + '!'
    : 'Caught a capsule — ' + label + '.';
  return chapterWin;
}

function resolveDrop(s) {
  s.drops = (s.drops || 0) + 1;
  const aimed = s.held;
  if (!aimed) {
    s.note = 'Nothing in the claws';
    finishMiss(s);
    return;
  }
  aimed.taken = true;
  awardCatch(s, aimed);
  s.phase = 'result';
  s.charged = false;
  s.hold = s.won ? 1.3 : 0.85;
  persist(s);
}

function finishMiss(s) {
  s.phase = 'result';
  s.charged = false;
  s.hold = 0.7;
  persist(s);
}

function drawClaw(d, x, y, open) {
  const c = d.c;
  d.ellipse(x, RAIL_Y, 20, 8, '#8a7048', GOLD, 2);
  d.line({x, y: RAIL_Y}, {x, y}, '#c8b898', 3);
  d.ellipse(x, y, 14, 10, '#5a3028', GOLD, 2);
  c.save();
  c.strokeStyle = GOLD;
  c.fillStyle = '#8aa0b0';
  c.lineWidth = 4;
  c.lineCap = 'round';
  for (const [dx, ang] of [[-open, -0.45], [open, 0.45]]) {
    c.beginPath();
    c.moveTo(x, y + 6);
    c.quadraticCurveTo(x + dx * 0.45, y + 26, x + dx, y + 44);
    c.stroke();
  }
  c.restore();
}

function drawCapsule(d, cap, time) {
  if (cap.taken && !cap.lift) return;
  const y = cap.y - (cap.lift || 0);
  const bob = Math.sin((time || 0) * 1.6 + cap.id) * 1.2;
  const r = cap.size * 0.5;
  const cy = y + bob;
  d.ellipse(cap.x + 2, cy + r * 0.62, r * 0.72, r * 0.22, '#12233555');
  if (cap.bonus) d.glow(cap.x, cy, r * 1.6, GOLD);
  d.ellipse(cap.x, cy, r * 0.96, r, cap.tint || '#c8d8e866', '#f4f0e8cc', 2);
  const artKey = cap.bonus ? spriteKey(cap.prizeId) : PIECE_KEYS[cap.piece];
  if (cap.bonus) {
    d.item(artKey, cap.x, cy, {
      w: r * 1.15,
      shadow: false,
      fallback: () => d.star(cap.x, cy, r * 0.35, '#fff6d8'),
    });
  } else {
    const img = d.art && d.art[artKey];
    if (img && typeof d.sprite === 'function') d.sprite(img, cap.x, cy, {w: r * 1.35, shadow: false});
    else d.star(cap.x, cy, r * 0.28, GOLD);
  }
  d.ellipse(cap.x - r * 0.28, cy - r * 0.32, r * 0.28, r * 0.16, '#ffffff55');
  d.ellipse(cap.x, cy, r * 0.96, r, null, '#fff6d8aa', 1.4);
}

function drawStick(s, d) {
  const L = stickLayout();
  const armed = !!(s.stick && s.stick.active);
  const kx = armed ? (s.stick.kx || 0) : 0;
  const ky = armed ? (s.stick.ky || 0) : 0;
  d.ellipse(L.cx + 3, L.cy + 5, L.baseRx, L.baseRy, '#3a1a1266');
  d.ellipse(L.cx, L.cy, L.baseRx, L.baseRy, CREAM + 'ee', GOLD, 2.2);
  const nx = L.cx + kx;
  const ny = L.cy + ky;
  d.ellipse(nx, ny, L.knobR, L.knobR * 0.82, armed ? GOLD : '#c42848', GOLD, 2);
  d.ellipse(nx - 4, ny - 6, L.knobR * 0.4, L.knobR * 0.26, CREAM + 'aa');
  d.text('AIM', L.cx, L.cy - L.baseRy + 18, 14, INK);
}

function drawDrop(s, d) {
  const b = dropPad();
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  d.ellipse(cx + 2, cy + 4, b.w * 0.48, b.h * 0.42, '#12233566');
  d.ellipse(cx, cy, b.w * 0.48, b.h * 0.42, CREAM + 'ee', GOLD, 2.2);
  d.text('DROP', cx, cy + 2, 24, INK);
}

export default {
  title: 'Digger’s Vault',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  canvasControls: true,
  persist,
  houseSeconds: HOUSE_SECONDS,
  houseTitle: 'The cabinet closed',
  houseDetail: 'Digby latches the glass. Another claw when you have a penny.',
  clockRuns: s => s.phase === 'aim' || s.phase === 'drop',
  onTimeout(s) {
    if (s.phase === 'aim' || s.phase === 'drop') {
      s.phase = 'result';
      s.charged = false;
      s.note = 'Time is up. The claw rests.';
      s.hold = 0.5;
      persist(s);
    }
  },
  retryAttempt(s) { this.action(s, 'again'); },
  retryButton: alleyPlay ? 'Play again · 1 penny' : 'Play again',
  intro: alleyPlay
    ? 'Digby’s claw in Digger’s Vault. Aim with the stick, DROP on a glass capsule. A clean grab keeps whatever is inside — Digby’s clockwork pieces, or the glowing chapter bonus when tonight’s mark is in. Soft slips stay in the pile. A ticket sits the first go; later claws cost a penny.'
    : 'Aim the claw, DROP on a capsule. Workshop sittings are free and write nothing.',
  instructions: alleyPlay
    ? 'Hold the AIM stick (or ←/→) to slide the claw. DROP (cream pad or Space) lowers it. Grab a capsule by sitting the claws over it. The glowing globe is this chapter’s bonus — skill must catch it, and tonight’s hidden mark must agree. Other globes hold Digby’s 6-piece curios as everyday finds.'
    : 'Aim, DROP, grab a capsule. Practice writes nothing.',
  levels: LEVELS,
  images: {
    cabinet: '../assets/restyle/scene-turnarounds-2026-09-09/stalls/curios/front.webp',
    piece1: './assets/prop-kits/curios/piece-01.png?v=' + PIECE_CACHE,
    piece2: './assets/prop-kits/curios/piece-02.png?v=' + PIECE_CACHE,
    piece3: './assets/prop-kits/curios/piece-03.png?v=' + PIECE_CACHE,
    piece4: './assets/prop-kits/curios/piece-04.png?v=' + PIECE_CACHE,
    piece5: './assets/prop-kits/curios/piece-05.png?v=' + PIECE_CACHE,
    piece6: './assets/prop-kits/curios/piece-06.png?v=' + PIECE_CACHE,
  },
  sprites: [
    'clockwork-key', 'display-dome', 'clockwork-butterfly', 'tin-style-robot',
    'crystal-cradle', 'curio-cabinet-album', 'star-token', 'moon-penny', 'crown-token', 'everyday-penny',
  ],
  prizes: CABINET_PRIZES.slice(),
  actions: [],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const resume = saved.phase === 'aim' || saved.phase === 'drop';
    const s = {
      level, t: 0,
      phase: resume ? saved.phase : (saved.phase === 'result' ? 'result' : 'idle'),
      seed: saved.seed || (level + 1) * 7919,
      capsules: pileOk(saved.capsules) ? saved.capsules : null,
      aimX: saved.aimX ?? CX,
      clawX: saved.clawX ?? CX,
      clawY: RAIL_Y + 36,
      charged: resume ? !!saved.charged : false,
      won: !!saved.won || chapterPaid(level),
      paid: chapterPaid(level),
      hold: 0,
      drops: saved.drops || 0,
      houseLeft: saved.houseLeft,
      held: null,
      target: null,
      dropT: 0,
      dropPhase: null,
      stick: null,
      note: saved.note || 'Aim the claw — DROP on a capsule',
    };
    if (resume && !s.capsules) s.capsules = makeCapsules(level, s.seed);
    if (s.phase === 'drop') {
      s.phase = 'aim';
      s.dropPhase = null;
    }
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if ((s.won || s.paid) && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;

    if (s.phase === 'aim') {
      if (s.stick && s.stick.active) {
        s.aimX = clamp(s.aimX + (s.stick.kx || 0) * 3.2 * dt, clawMin(), clawMax());
      }
      if (input?.keys) {
        if (input.keys.has('ArrowLeft') || input.keys.has('a')) {
          s.aimX = clamp(s.aimX - 140 * dt, clawMin(), clawMax());
        }
        if (input.keys.has('ArrowRight') || input.keys.has('d')) {
          s.aimX = clamp(s.aimX + 140 * dt, clawMin(), clawMax());
        }
      }
      const sway = Math.sin(s.t * (1.4 + s.level * 0.18)) * swayAmp(s.level);
      s.clawX = clamp(s.aimX + sway, clawMin(), clawMax());
      s.clawY = RAIL_Y + 36;
    }

    if (s.phase === 'drop') {
      s.dropT += dt;
      if (s.dropPhase === 'descend') {
        const targetY = s.target ? s.target.y - s.target.size * 0.55 : FLOOR_Y - 50;
        s.clawY = lerp(RAIL_Y + 36, targetY, Math.min(1, s.dropT / 0.5));
        if (s.dropT >= 0.5) {
          s.dropPhase = 'grip';
          s.dropT = 0;
        }
      } else if (s.dropPhase === 'grip') {
        if (s.dropT >= 0.22) {
          const cap = nearestCapsule(s);
          const roll = rng(s.seed + s.drops * 91 + (s.level + 1) * 13)();
          const hold = cap && roll > slipChance(s.level);
          s.held = hold ? cap : null;
          s.target = cap;
          s.dropPhase = 'rise';
          s.dropT = 0;
          s.note = s.held ? 'Got it…' : 'Slipped!';
        }
      } else if (s.dropPhase === 'rise') {
        if (s._riseFromY == null) s._riseFromY = s.clawY;
        s.clawY = lerp(s._riseFromY, RAIL_Y + 36, Math.min(1, s.dropT / 0.48));
        if (s.held) {
          s.held.x = s.clawX;
          s.held.lift = Math.max(0, s.held.y - (s.clawY + 50));
        }
        if (s.dropT >= 0.48) {
          s._riseFromY = null;
          resolveDrop(s);
        }
      }
    }

    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The claw held true',
          itemName(CABINET_PRIZES[s.level]) + ' is yours.',
          {prize: CABINET_PRIZES[s.level], won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) {
      s.hold -= dt;
    }
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (type === 'down') {
      if (hitDrop(p)) {
        if (s.phase === 'idle' || s.phase === 'result') beginSitting(s);
        else if (s.phase === 'aim') startDrop(s);
        return;
      }
      if (hitStick(p)) {
        if (s.phase === 'idle' || s.phase === 'result') beginSitting(s);
        applyStick(s, p);
        return;
      }
      if (s.phase === 'idle' || s.phase === 'result') {
        beginSitting(s);
        return;
      }
      if (s.phase === 'aim' && p.y >= CASE.y && p.y <= CASE.y + CASE.h) {
        s.dragAim = true;
        s.aimX = clamp(p.x, clawMin(), clawMax());
      }
      return;
    }
    if (type === 'move' || type === 'drag') {
      if (s.stick && s.stick.active) applyStick(s, p);
      else if (s.phase === 'aim' && (s.dragAim || (p.y >= CASE.y && p.y <= CASE.y + CASE.h + 40))) {
        s.aimX = clamp(p.x, clawMin(), clawMax());
      }
      return;
    }
    if (type === 'up' || type === 'cancel') {
      s.stick = null;
      s.dragAim = false;
    }
  },
  action(s, id) {
    if (id === 'play' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Another claw when you are ready.';
        persist(s);
      }
      beginSitting(s);
    }
    if (id === 'drop') {
      if (s.phase === 'idle' || s.phase === 'result') beginSitting(s);
      else startDrop(s);
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'aim') startDrop(s);
      else if (s.phase === 'idle' || s.phase === 'result') beginSitting(s);
    }
  },
  draw(s, d, time) {
    const prize = CABINET_PRIZES[s.level];
    const c = d.c;
    d.text('Digger’s Vault', 450, 108, 28, '#efe6d0');
    d.text(LEVELS[s.level], 450, 142, 18, '#d2b98c');
    {
      const collected = s.won || chapterPaid(s.level);
      d.item(spriteKey(prize), 800, 130, {w: 64, fallback: () => d.star(800, 130, 22)});
      d.text(collected ? 'Collected' : 'Locked', 800, 182, 14, collected ? '#c8e878' : '#ead6a4');
    }

    const cab = d.art && d.art.cabinet;
    if (cab) {
      c.drawImage(cab, CAB.x, CAB.y, CAB.w, CAB.h);
    } else {
      roundRect(c, CASE.x - 18, CASE.y - 24, CASE.w + 36, CASE.h + 48, 18);
      c.fillStyle = '#3a1818ee';
      c.fill();
    }

    roundRect(c, CASE.x, CASE.y, CASE.w, CASE.h, 10);
    c.fillStyle = 'rgba(12, 22, 32, 0.42)';
    c.fill();
    c.save();
    roundRect(c, CASE.x, CASE.y, CASE.w, CASE.h, 10);
    c.clip();
    d.line({x: CASE.x + 12, y: RAIL_Y}, {x: CASE.x + CASE.w - 12, y: RAIL_Y}, GOLD, 3);
    d.ellipse(CX, FLOOR_Y + 10, CASE.w * 0.36, 14, '#12233566');
    if (s.capsules) {
      const ordered = s.capsules.slice().sort((a, b) => a.y - b.y);
      for (const cap of ordered) {
        if (s.held && cap.id === s.held.id) continue;
        drawCapsule(d, cap, time || s.t);
      }
    } else if (s.phase === 'idle') {
      d.text('Play', CX, CASE.y + CASE.h * 0.42, 26, '#ead6a4');
      d.wrap('Packed capsules · brass claw · Digby’s six', CX, CASE.y + CASE.h * 0.62, 15, '#d2b98c', CASE.w - 20);
    }
    c.restore();

    if (s.phase === 'aim' || s.phase === 'drop' || (s.phase === 'result' && s.capsules)) {
      drawClaw(d, s.clawX, s.clawY, s.held ? 12 : 28);
      if (s.held) drawCapsule(d, Object.assign({}, s.held, {x: s.clawX, lift: 0, y: s.clawY + 52}), time);
    }

    d.wrap(s.note || '', CX, 980, 20, '#fff6d8', 720);
    drawDrop(s, d);
    drawStick(s, d);
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
