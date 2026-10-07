import {clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {matteImage} from '../sprites.js?v=load-fix-1';
import {alleyPlay, pocket, keep, owned} from '../wallet.js?v=booth-play-2';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {CABINET_PRIZES} from '../cabinet-puzzles.js?v=first-prize-1';

/** Digby — Digger's Vault claw. Rail at the top, pile on the floor, one-way stick. */
const BOOK = 'pennyFever.capsuleCabinet.v5';
const CX = 450;
const CAB = {x: 130, y: 188, w: 640, h: 640};
/** Glass cubby of the vault booth — claw window. */
const CASE = {x: 268, y: 348, w: 364, h: 318};
const RAIL_Y = CASE.y + 10;
const FLOOR_Y = CASE.y + CASE.h - 16;
const HOUSE_SECONDS = 100;
const SWEEP_SECONDS = 5;
const PIECE_CACHE = 'digby-claw-10';
const keyedPieces = {};

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
  return {v: 5, paid: {}, sittings: {}};
}
function readBook() {
  if (typeof localStorage === 'undefined') return emptyBook();
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 5) return {paid: {}, sittings: {}, ...blob};
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
    grabBeat: s.grabBeat,
  };
  writeBook(book);
}

function clawMin() { return CASE.x + 36; }
function clawMax() { return CASE.x + CASE.w - 36; }
function grabBeatOf(seed) {
  return 1 + Math.floor(rng(seed + 91)() * SWEEP_SECONDS);
}
function sweepBeat(s) {
  return Math.min(SWEEP_SECONDS, Math.max(1, Math.ceil(s.sweepT || 0.01)));
}
function pieceArt(d, key) {
  const img = d.art && d.art[key];
  if (!img) return null;
  if (!keyedPieces[key]) keyedPieces[key] = matteImage(img) || img;
  return keyedPieces[key];
}

function pileOk(capsules) {
  return Array.isArray(capsules) && capsules.length > 0 && capsules.every(c => c && typeof c.piece === 'number');
}

function makeCapsules(level, seed) {
  const roll = rng(seed + 19 + level * 131);
  const prize = CABINET_PRIZES[level] || CABINET_PRIZES[0];
  const size = 50;
  const r = size * 0.5;
  const left = CASE.x + r + 10;
  const right = CASE.x + CASE.w - r - 10;
  const floor = FLOOR_Y - r * 0.2;
  const rowH = r * 1.08;
  const rows = 2;
  const list = [];
  let id = 0;
  for (let row = 0; row < rows; row++) {
    const y = floor - row * rowH;
    const stagger = (row % 2) * r * 0.95;
    const span = Math.max(r, right - left - stagger);
    const cols = Math.max(5, Math.round(span / (r * 1.72)));
    for (let col = 0; col < cols; col++) {
      const t = cols === 1 ? 0.5 : col / (cols - 1);
      const x = left + stagger + t * span;
      const piece = Math.floor(roll() * PIECE_KEYS.length);
      list.push({
        id: id++,
        x: clamp(x + (roll() - 0.5) * 6, left, right),
        y: y + (roll() - 0.5) * 4,
        homeX: 0,
        homeY: 0,
        size,
        piece,
        bonus: false,
        prizeId: null,
        drip: EVERYDAY_DROP[Math.floor(roll() * EVERYDAY_DROP.length)],
        tint: CAPSULE_TINTS[(piece + id) % CAPSULE_TINTS.length],
        taken: false,
        lift: 0,
      });
    }
  }
  if (list.length) {
    const bonus = list[Math.floor(roll() * list.length)];
    bonus.bonus = true;
    bonus.prizeId = prize;
    bonus.drip = null;
    bonus.size = 56;
  }
  for (const cap of list) {
    cap.homeX = cap.x;
    cap.homeY = cap.y;
  }
  return list;
}

function bonusCapsule(s) {
  return (s.capsules || []).find(c => c && c.bonus && !c.taken) || null;
}

function stickLayout() {
  return {cx: 450, cy: 1134, baseRx: 118, baseRy: 66, knobR: 32, maxPull: 48, dead: 14};
}
function hitStick(p) {
  if (!p) return false;
  const L = stickLayout();
  const dx = (p.x - L.cx) / L.baseRx;
  const dy = (p.y - L.cy) / L.baseRy;
  return (dx * dx + dy * dy) <= 1.4;
}
function applyStick(s, p) {
  const L = stickLayout();
  const dx = (p?.x ?? L.cx) - L.cx;
  const dy = (p?.y ?? L.cy) - L.cy;
  const len = Math.hypot(dx, dy) || 1;
  const pull = Math.min(len, L.maxPull);
  // One way: right only. Left pull is ignored.
  s.stick = {active: true, kx: Math.max(0, (dx / len) * pull), ky: (dy / len) * pull, pull};
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
    s.aimX = clawMin();
    s.clawX = clawMin();
    s.clawY = RAIL_Y + 28;
    s.sweepT = 0;
    s.held = null;
    s.dropT = 0;
    s.dropPhase = null;
    s.prizeKept = false;
    s.grabBeat = grabBeatOf(s.seed);
    s.dropBeat = 0;
    s.timed = false;
    s.houseLeft = HOUSE_SECONDS;
    s.note = 'Hold right. TAP on the glowing second to lift and keep the bonus.';
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
  s.dropBeat = sweepBeat(s);
  s.timed = s.dropBeat === s.grabBeat;
  s.target = s.timed ? bonusCapsule(s) : null;
  s.note = s.timed
    ? (s.target ? 'The second is true — lifting the glow…' : 'The second is true, but the glow is gone.')
    : 'Wrong second — empty claws.';
  persist(s);
}

function awardCatch(s, cap) {
  if (!cap || !cap.bonus) return false;
  const prize = CABINET_PRIZES[s.level];
  const already = chapterPaid(s.level) || s.won;
  s.won = true;
  s.paid = true;
  if (already) {
    s.note = 'The claw held the bonus. This chapter is already kept.';
    return true;
  }
  if (alleyPlay) {
    keep(prize, 'curios');
    markPaid(s.level);
  }
  takePrize(s, prize, {x: 800, y: 130});
  s.note = 'The claw held the ' + (itemName(prize) || prize) + '!';
  return true;
}

function dropCapsuleHome(cap) {
  if (!cap) return;
  cap.taken = false;
  cap.lift = 0;
  cap.x = cap.homeX || cap.x;
  cap.y = cap.homeY || cap.y;
}

function resolveDrop(s) {
  s.drops = (s.drops || 0) + 1;
  const aimed = s.held;
  if (!s.timed || !aimed) {
    if (aimed) dropCapsuleHome(aimed);
    s.held = null;
    s.note = s.timed ? 'The glow slipped the claws.' : 'Wrong second — empty claws.';
    finishMiss(s);
    return;
  }
  aimed.taken = true;
  aimed.lift = 0;
  aimed.x = s.clawX;
  aimed.y = s.clawY + 52;
  s.held = aimed;
  awardCatch(s, aimed);
  s.phase = 'result';
  s.charged = false;
  s.hold = s.won ? 2.2 : 1.6;
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
    const img = pieceArt(d, artKey);
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
  d.ellipse(L.cx + 3, L.cy + 5, L.baseRx, L.baseRy, '#3a1a1266');
  d.ellipse(L.cx, L.cy, L.baseRx, L.baseRy, CREAM + 'ee', GOLD, 2.2);
  const nx = L.cx + kx;
  const ny = L.cy;
  d.ellipse(nx, ny, L.knobR, L.knobR * 0.82, armed ? GOLD : '#c42848', GOLD, 2);
  d.ellipse(nx - 4, ny - 6, L.knobR * 0.4, L.knobR * 0.26, CREAM + 'aa');
  const now = s.phase === 'aim' && sweepBeat(s) === s.grabBeat;
  d.text(s.phase === 'aim' ? (now ? 'NOW' : 'HOLD →') : 'TAP', L.cx, L.cy - L.baseRy + 18, 16, now ? '#c42848' : INK);
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
    ? 'Digby’s claw rides the top rail. Capsules sit on the vault floor. The stick only sweeps one way. TAP on the glowing second to lift and keep the chapter bonus. Miss that second and the claws come up empty. A ticket sits the first go; later claws cost a penny.'
    : 'Stick sweeps one way. TAP on the glowing second to lift and keep the bonus. Miss and the claws come up empty. Workshop sittings write nothing.',
  instructions: alleyPlay
    ? 'Hold the stick right to send the claw across. It never comes back. TAP when NOW lights to lift and keep the glow. Miss that second and the claws come up empty.'
    : 'Hold right to sweep. TAP when NOW lights to lift and keep the bonus. Miss the second and the claws come up empty.',
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
      aimX: saved.aimX ?? clawMin(),
      clawX: saved.clawX ?? clawMin(),
      clawY: RAIL_Y + 28,
      sweepT: 0,
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
      grabBeat: saved.grabBeat || grabBeatOf(saved.seed || (level + 1) * 7919),
      dropBeat: 0,
      timed: false,
      note: saved.note || 'Aim the claw — TAP the glowing second',
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
      s.sweepT = (s.sweepT || 0) + dt;
      if (s.stick && s.stick.active && (s.stick.kx || 0) > 10) {
        s.aimX = clamp(s.aimX + 170 * dt, clawMin(), clawMax());
      }
      if (input?.keys && (input.keys.has('ArrowRight') || input.keys.has('d'))) {
        s.aimX = clamp(s.aimX + 170 * dt, clawMin(), clawMax());
      }
      s.clawX = s.aimX;
      s.clawY = RAIL_Y + 28;
      const left = Math.max(0, SWEEP_SECONDS - s.sweepT);
      const beat = sweepBeat(s);
      if (beat === s.grabBeat) s.note = 'NOW — TAP!';
      else if (left <= 2.2 && left > 0) s.note = 'Drop in ' + Math.ceil(left) + '…';
      else s.note = 'Sweep right. TAP on the glowing second.';
      if (s.sweepT >= SWEEP_SECONDS) startDrop(s);
    }

    if (s.phase === 'drop') {
      s.dropT += dt;
      if (s.dropPhase === 'descend') {
        const cap = s.timed ? s.target : null;
        const targetY = cap ? cap.y - cap.size * 0.55 : FLOOR_Y - 40;
        const u = Math.min(1, s.dropT / 0.55);
        if (cap) s.clawX = lerp(s.clawX, cap.x, Math.min(1, u * 1.4));
        s.clawY = lerp(RAIL_Y + 28, targetY, u);
        if (s.dropT >= 0.5) {
          s.dropPhase = 'grip';
          s.dropT = 0;
        }
      } else if (s.dropPhase === 'grip') {
        if (s.dropT >= 0.18) {
          const cap = s.timed ? (s.target || bonusCapsule(s)) : null;
          s.held = cap;
          s.target = cap;
          if (cap) {
            s.clawX = cap.x;
            cap.taken = false;
            cap.lift = 0;
          }
          s.dropPhase = 'rise';
          s.dropT = 0;
          s.note = cap ? 'The glow is in the claws…' : 'Wrong second — empty claws.';
        }
      } else if (s.dropPhase === 'rise') {
        if (s._riseFromY == null) s._riseFromY = s.clawY;
        const u = Math.min(1, s.dropT / 0.85);
        s.clawY = lerp(s._riseFromY, RAIL_Y + 28, u);
        if (s.held) {
          s.held.x = s.clawX;
          s.held.lift = Math.max(0, s.held.y - (s.clawY + 50));
        }
        if (s.dropT >= 0.85) {
          s._riseFromY = null;
          resolveDrop(s);
        }
      }
    }

    if (s.phase === 'result' && s.held && s.timed) {
      s.held.x = s.clawX;
      s.held.y = s.clawY + 52;
      s.held.lift = 0;
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
      if (s.phase === 'idle' || s.phase === 'result') {
        beginSitting(s);
        s._pressT = s.t;
        s._startedGo = true;
        if (hitStick(p)) applyStick(s, p);
        return;
      }
      if (s.phase === 'aim') {
        s._pressT = s.t;
        s._startedGo = false;
        if (hitStick(p)) applyStick(s, p);
        else startDrop(s);
      }
      return;
    }
    if (type === 'move' || type === 'drag') {
      if (s.phase === 'aim' && s.stick && s.stick.active) applyStick(s, p);
      return;
    }
    if (type === 'up' || type === 'cancel') {
      const held = s.stick && s.stick.active;
      const tap = !s._startedGo && (s.t - (s._pressT || s.t)) < 0.28 && (!held || (s.stick.pull || 0) < 16);
      s.stick = null;
      if (s.phase === 'aim' && tap) startDrop(s);
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

    if (s.phase === 'aim') {
      const beat = sweepBeat(s);
      for (let i = 1; i <= SWEEP_SECONDS; i++) {
        const x = CASE.x + 48 + (i - 1) * 38;
        const y = CASE.y + 18;
        const now = beat === i && i === s.grabBeat;
        d.circle(x, y, now ? 8 : 5, now ? GOLD : (i === beat ? CREAM : '#3a181888'), GOLD, 1.5);
      }
    }
    if (s.phase === 'aim' || s.phase === 'drop' || (s.phase === 'result' && s.capsules)) {
      if (s.phase === 'aim' && sweepBeat(s) === s.grabBeat) d.glow(s.clawX, s.clawY, 46, GOLD);
      drawClaw(d, s.clawX, s.clawY, s.held ? 12 : 28);
      if (s.held) {
        drawCapsule(d, Object.assign({}, s.held, {
          x: s.clawX, y: s.clawY + 52, lift: 0, taken: false,
        }), time);
      }
    }

    d.wrap(s.note || '', CX, 980, 20, '#fff6d8', 720);
    drawStick(s, d);
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
