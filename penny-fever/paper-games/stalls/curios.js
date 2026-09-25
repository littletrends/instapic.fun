import {clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit, owned} from '../wallet.js?v=booth-play-2';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  resultNumber, isCabinetWin, ordinaryFor, CABINET_PRIZES,
} from '../cabinet-puzzles.js?v=first-prize-1';

/** Digby's Capsule Cabinet — claw / gacha play. Mystery drawers erased. */
const BOOK = 'pennyFever.capsuleCabinet.v2';
const CX = 450;
const CASE = {x: 140, y: 210, w: 620, h: 620};
/** Full vault shell — Copper-style backdrop rect (portrait art stretched to machine shell). */
const CAB = {x: 130, y: 188, w: 640, h: 640};
const RAIL_Y = CASE.y + 36;
const FLOOR_Y = CASE.y + CASE.h - 70;
const CLAW_OPEN = 38;
const HOUSE_SECONDS = 120;

const LEVELS = [
  'Brass claw',
  'Capsule tide',
  'Glass sway',
  'Deep pile',
  'Rare number',
  'Menagerie vault',
];

const CAPSULE_COLORS = [
  '#c67483', '#6aaa9a', '#e8c878', '#7a8ec8', '#c88a5a',
  '#a67ab0', '#8ab070', '#d09070', '#70a8c8', '#b87898',
];

const EVERYDAY = ['heart-gear', 'cabinet-key', 'everyday-penny'];

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
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
  return {v: 2, paid: {}, sittings: {}};
}
function readBook() {
  if (typeof localStorage === 'undefined') return emptyBook();
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 2) return {paid: {}, sittings: {}, ...blob};
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
    won: !!s.won, note: s.note, resultN: s.resultN || 0,
    drops: s.drops || 0, houseLeft: s.houseLeft,
  };
  writeBook(book);
}

function swayAmp(level) {
  return 10 + level * 4;
}
function clawMin() { return CASE.x + 56; }
function clawMax() { return CASE.x + CASE.w - 56; }

function makeCapsules(level, seed) {
  const roll = rng(seed + 17 + level * 131);
  // Dense vault pile — crowded, overlapping, not a neat grid
  const n = 18 + (level | 0) * 2; // 18..28
  const bonusIndex = Math.floor(roll() * n);
  const prize = CABINET_PRIZES[level] || CABINET_PRIZES[0];
  const list = [];
  const left = CASE.x + 52;
  const right = CASE.x + CASE.w - 52;
  const top = CASE.y + 190;
  const bottom = FLOOR_Y - 8;
  for (let i = 0; i < n; i++) {
    const depth = i / Math.max(1, n - 1); // 0 = back, 1 = front
    const layer = Math.floor(depth * 5);
    const stagger = (layer % 2) * 22;
    // Bias toward the floor; sprinkle upward so the pile looks stuffed
    const rise = Math.pow(roll(), 0.55) * (bottom - top) * (0.5 + roll() * 0.5);
    const x = left + stagger + roll() * Math.max(40, right - left - stagger) + (roll() - 0.5) * 40;
    const y = bottom - rise + (roll() - 0.5) * 16;
    const bonus = i === bonusIndex;
    const kind = bonus ? 'bonus' : EVERYDAY[Math.floor(roll() * EVERYDAY.length)];
    const prizeId = bonus ? prize : null;
    const itemId = prizeId || kind;
    const size = bonus ? 54 + roll() * 4 : 44 + roll() * 14;
    list.push({
      id: i,
      x: clamp(x, left, right),
      y: clamp(y, top, bottom),
      rx: size * 0.42,
      ry: size * 0.5,
      size,
      kind,
      prizeId,
      itemId,
      taken: false,
      lift: 0,
    });
  }
  return list;
}

/** Old v1 sittings were neat capsule grids without itemId — remake those piles. */
function pileOk(capsules) {
  return Array.isArray(capsules) && capsules.length > 0 && capsules.every(c => c && typeof c.itemId === 'string');
}

function nearestCapsule(s) {
  if (!s.capsules) return null;
  let best = null;
  let bestD = 1e9;
  const cx = s.clawX;
  for (const cap of s.capsules) {
    if (cap.taken) continue;
    const d = Math.abs(cap.x - cx);
    if (d < bestD) {
      bestD = d;
      best = cap;
    }
  }
  // Must be roughly under the claw — hard grab window
  if (!best || bestD > 48) return null;
  return best;
}

function creamPads() {
  const y = 1088;
  const h = 96;
  const dropW = 240;
  const sideW = 110;
  const gap = 22;
  const drop = {id: 'drop', x: CX - dropW / 2, y, w: dropW, h, label: 'DROP'};
  const left = {id: 'left', x: drop.x - gap - sideW, y, w: sideW, h, label: '←'};
  const right = {id: 'right', x: drop.x + dropW + gap, y, w: sideW, h, label: '→'};
  return [left, drop, right];
}
function hitPad(p) {
  if (!p || typeof p.x !== 'number') return null;
  for (const pad of creamPads()) {
    if (p.x >= pad.x && p.x <= pad.x + pad.w && p.y >= pad.y && p.y <= pad.y + pad.h) return pad.id;
  }
  return null;
}
function drawCreamPads(d) {
  for (const pad of creamPads()) {
    const isDrop = pad.id === 'drop';
    d.ellipse(pad.x + pad.w / 2 + 2, pad.y + pad.h / 2 + 4, pad.w * 0.48, pad.h * 0.42, '#12233566');
    d.ellipse(
      pad.x + pad.w / 2,
      pad.y + pad.h / 2,
      pad.w * 0.48,
      pad.h * 0.42,
      isDrop ? '#efe6d0ee' : '#2a1818ee',
      isDrop ? '#8a6040' : '#e8c878',
      2
    );
    d.text(pad.label, pad.x + pad.w / 2, pad.y + pad.h / 2 + 1, isDrop ? 22 : 28, isDrop ? '#4a2018' : '#efe6d0');
  }
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
    s.clawY = RAIL_Y + 40;
    s.held = null;
    s.dropT = 0;
    s.dropPhase = null;
    s.resultN = 0;
    s.prizeKept = false;
    s.houseLeft = HOUSE_SECONDS;
    s.note = 'Aim the claw — DROP when ready';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function nudgeAim(s, dir) {
  if (s.phase !== 'aim') return;
  s.aimX = clamp(s.aimX + dir * 28, clawMin(), clawMax());
  persist(s);
}

function startDrop(s) {
  if (s.phase !== 'aim' || s.chargeLock) return;
  s.phase = 'drop';
  s.dropPhase = 'descend';
  s.dropT = 0;
  s._riseFromY = null;
  s.held = null;
  s.target = nearestCapsule(s);
  s.seed = (s.seed || 1) + 1;
  s.note = 'Claw descending…';
  persist(s);
}

function resolveDrop(s) {
  const n = resultNumber(s.seed);
  s.resultN = n;
  s.drops = (s.drops || 0) + 1;
  const aimed = s.target;
  const win = isCabinetWin(s.level, n);
  const prize = CABINET_PRIZES[s.level];
  const already = chapterPaid(s.level) || s.won;

  if (!aimed) {
    s.held = null;
    s.note = n + ' — nothing under the claw';
    finishMiss(s);
    return;
  }

  if (win) {
    // Grip holds — receive the aimed item
    aimed.taken = true;
    s.held = aimed;
    let got = null;
    let chapterWin = false;
    if (aimed.kind === 'bonus') {
      if (!already) {
        got = prize;
        chapterWin = true;
      } else {
        got = ordinaryFor(n);
      }
    } else {
      got = aimed.kind;
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

    if (chapterWin) takePrize(s, prize, {x: aimed.x, y: aimed.y});

    const label = itemName(got) || got;
    s.note = n + ' — caught the ' + label + '!';
    s.phase = 'result';
    s.charged = false;
    s.hold = chapterWin ? 1.4 : 0.9;
    persist(s);
    return;
  }

  // Wrong number — claw slips. Optional tiny consolation on near-miss.
  s.held = null;
  const near = nearMiss(s.level, n);
  if (near && (s.seed % 7 === 0)) {
    const drop = 'everyday-penny';
    if (alleyPlay) credit(1);
    s.note = n + ' — slipped (a penny rattled free)';
  } else {
    s.note = n + ' — slipped';
  }
  finishMiss(s);
}

function nearMiss(level, n) {
  for (let d = -2; d <= 2; d++) {
    if (d === 0) continue;
    const m = n + d;
    if (m >= 1 && m <= 100 && isCabinetWin(level, m)) return true;
  }
  return false;
}

function finishMiss(s) {
  s.phase = 'result';
  s.charged = false;
  s.hold = 0.7;
  persist(s);
}

function drawClaw(d, x, y, open, holding) {
  const c = d.c;
  const spread = holding ? 14 : open;
  // Rail trolley
  d.ellipse(x, RAIL_Y, 22, 10, '#8a7048', '#e8c878', 2);
  // Cable
  d.line({x, y: RAIL_Y}, {x, y}, '#c8b898', 3);
  // Body
  d.ellipse(x, y, 16, 12, '#5a3028', '#e8c878', 2);
  // Three prongs
  c.save();
  c.strokeStyle = '#e8c878';
  c.fillStyle = '#6a3830';
  c.lineWidth = 3;
  for (const [dx, ang] of [[-spread, -0.35], [0, 0.15], [spread, 0.35]]) {
    c.beginPath();
    c.moveTo(x, y + 8);
    c.quadraticCurveTo(x + dx * 0.6, y + 28, x + dx, y + 44);
    c.stroke();
    c.beginPath();
    c.arc(x + dx, y + 44, 5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  }
  c.restore();
}

function drawCapsule(d, cap, time) {
  if (cap.taken && !cap.lift) return;
  const y = cap.y - (cap.lift || 0);
  const bob = Math.sin((time || 0) * 2 + cap.id) * 1.5;
  const size = cap.size || Math.max(44, (cap.rx || 22) * 2.2);
  const itemId = cap.itemId || cap.prizeId || (cap.kind !== 'bonus' ? cap.kind : null);
  d.ellipse(cap.x + 2, y + size * 0.34, size * 0.36, size * 0.13, '#12233555');
  if (cap.kind === 'bonus') {
    d.glow(cap.x, y + bob, size * 0.72, '#e8c878');
  }
  if (itemId) {
    d.item(spriteKey(itemId), cap.x, y + bob, {
      w: size,
      fallback: () => {
        const fill = CAPSULE_COLORS[(cap.id || 0) % CAPSULE_COLORS.length];
        d.ellipse(cap.x, y + bob, size * 0.38, size * 0.46, fill, '#fff6d8', 2);
        if (cap.kind === 'bonus') d.star(cap.x, y + bob, 10, '#fff6d8');
      },
    });
  }
}

export default {
  title: 'Capsule Cabinet',
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
  playLabel: s => alleyPlay && ['result', 'idle'].includes(s.phase) ? 'Play again · 1 penny' : 'Play',
  intro: alleyPlay
    ? 'Digby’s Cabinet of Curios. Aim the claw along the rail, then DROP. A result from 1–100 decides the grip — the right number picks up whatever you aimed at: the glowing chapter prize in the vault pile, or a hard everyday collectable. Wrong numbers slip. A penny starts a sitting.'
    : 'Aim the claw, DROP when ready. Workshop sittings are free and write nothing.',
  instructions: alleyPlay
    ? 'Drag the court or use ←/→ / cream pads to aim. DROP (Space / cream TAP) lowers the claw. Hit a winning 1–100 to keep the aimed curio. Chapter bonus only if you aimed at the glowing prize and the number holds.'
    : 'Aim, DROP, see the number. Practice writes nothing.',
  levels: LEVELS,
  images: {
    cabinet: './assets/curios/cabinet.webp',
  },
  sprites: [
    'clockwork-key', 'display-dome', 'clockwork-butterfly', 'tin-style-robot',
    'crystal-cradle', 'curio-cabinet-album', 'cabinet-key', 'heart-gear', 'everyday-penny',
  ],
  prizes: CABINET_PRIZES.slice(),
  actions: [
    {id: 'play', label: alleyPlay ? 'Play · 1 penny' : 'Play'},
    {id: 'again', label: alleyPlay ? 'Play again · 1 penny' : 'Play again'},
    {id: 'drop', label: 'DROP · Space'},
  ],
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
      clawY: RAIL_Y + 40,
      charged: resume ? !!saved.charged : false,
      won: !!saved.won || chapterPaid(level),
      paid: chapterPaid(level),
      hold: 0,
      resultN: saved.resultN || 0,
      drops: saved.drops || 0,
      houseLeft: saved.houseLeft,
      held: null,
      target: null,
      dropT: 0,
      dropPhase: null,
      dragAim: false,
      note: saved.note || 'Aim the claw — DROP when ready',
    };
    if (resume && !s.capsules) s.capsules = makeCapsules(level, s.seed);
    if (s.phase === 'drop') {
      // Interrupted mid-drop — settle back to aim
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

    // Keyboard hold aim
    if (s.phase === 'aim' && input?.keys) {
      if (input.keys.has('ArrowLeft') || input.keys.has('a')) {
        s.aimX = clamp(s.aimX - 120 * dt, clawMin(), clawMax());
      }
      if (input.keys.has('ArrowRight') || input.keys.has('d')) {
        s.aimX = clamp(s.aimX + 120 * dt, clawMin(), clawMax());
      }
    }

    if (s.phase === 'aim') {
      const sway = Math.sin(s.t * (1.8 + s.level * 0.15)) * swayAmp(s.level);
      s.clawX = clamp(s.aimX + sway, clawMin(), clawMax());
      s.clawY = RAIL_Y + 40;
      s.note = s.note && s.note.includes('—') && s.resultN ? s.note : 'Aim the claw — DROP when ready';
    }

    if (s.phase === 'drop') {
      s.dropT += dt;
      if (s.dropPhase === 'descend') {
        const targetY = (s.target ? s.target.y - 50 : FLOOR_Y - 80);
        s.clawY = lerp(RAIL_Y + 40, targetY, Math.min(1, s.dropT / 0.55));
        if (s.dropT >= 0.55) {
          s.dropPhase = 'grip';
          s.dropT = 0;
        }
      } else if (s.dropPhase === 'grip') {
        if (s.dropT >= 0.28) {
          s.dropPhase = 'rise';
          s.dropT = 0;
          // Peek: will we hold? Decide now so rise can show item or empty
          const n = resultNumber(s.seed);
          const win = isCabinetWin(s.level, n) && s.target;
          if (win && s.target) {
            s.held = s.target;
            s.target.lift = 0;
          } else {
            s.held = null;
          }
        }
      } else if (s.dropPhase === 'rise') {
        if (s._riseFromY == null) s._riseFromY = s.clawY;
        s.clawY = lerp(s._riseFromY, RAIL_Y + 40, Math.min(1, s.dropT / 0.5));
        if (s.held) {
          s.held.x = s.clawX;
          s.held.lift = Math.max(0, s.held.y - (s.clawY + 55));
        }
        if (s.dropT >= 0.5) {
          s._riseFromY = null;
          resolveDrop(s);
        }
      }
    }

    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The claw held true',
          itemName(CABINET_PRIZES[s.level]) + ' — result ' + s.resultN + '.',
          {prize: CABINET_PRIZES[s.level], won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) {
      s.hold -= dt;
    }
  },
  pointer(s, type, p) {
    if (s.result) return;
    const pad = hitPad(p);
    if (type === 'down') {
      if (pad === 'left') { nudgeAim(s, -1); return; }
      if (pad === 'right') { nudgeAim(s, 1); return; }
      if (pad === 'drop') {
        if (s.phase === 'idle' || s.phase === 'result') beginSitting(s);
        else if (s.phase === 'aim') startDrop(s);
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
      if (s.phase === 'aim' && (s.dragAim || (p.y >= CASE.y && p.y <= CASE.y + CASE.h + 40))) {
        s.aimX = clamp(p.x, clawMin(), clawMax());
      }
      return;
    }
    if (type === 'up' || type === 'cancel') {
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
    if (k === 'ArrowLeft' || k === 'a') nudgeAim(s, -1);
    if (k === 'ArrowRight' || k === 'd') nudgeAim(s, 1);
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'aim') startDrop(s);
      else if (s.phase === 'idle' || s.phase === 'result') beginSitting(s);
    }
  },
  draw(s, d, time) {
    const prize = CABINET_PRIZES[s.level];
    const c = d.c;
    d.text('Capsule Cabinet', 450, 108, 28, '#efe6d0');
    d.text(LEVELS[s.level], 450, 142, 18, '#d2b98c');
    {
      const collected = s.won || chapterPaid(s.level);
      d.item(spriteKey(prize), 800, 130, {w: 64, fallback: () => d.star(800, 130, 22)});
      d.text(collected ? 'Collected' : 'Locked', 800, 182, 14, collected ? '#c8e878' : '#ead6a4');
    }

    // Vault cabinet backdrop (Copper pattern) — real Empty Cabinet art
    const cab = d.art && d.art.cabinet;
    if (cab) {
      c.drawImage(cab, CAB.x, CAB.y, CAB.w, CAB.h);
      // Soft glass wash so piled sprites read clearly without double-framing
      roundRect(c, CASE.x + 6, CASE.y + 6, CASE.w - 12, CASE.h - 12, 10);
      c.fillStyle = 'rgba(18, 28, 40, 0.32)';
      c.fill();
    } else {
      // Fallback if cabinet art fails to load
      roundRect(c, CASE.x - 18, CASE.y - 24, CASE.w + 36, CASE.h + 48, 18);
      c.fillStyle = '#3a1818ee';
      c.fill();
      c.strokeStyle = '#e8c878';
      c.lineWidth = 5;
      c.stroke();
      roundRect(c, CASE.x, CASE.y, CASE.w, CASE.h, 10);
      c.fillStyle = '#1a2838aa';
      c.fill();
      c.strokeStyle = '#c8b070';
      c.lineWidth = 3;
      c.stroke();
    }

    // Rail
    d.line({x: CASE.x + 20, y: RAIL_Y}, {x: CASE.x + CASE.w - 20, y: RAIL_Y}, '#e8c878', 4);

    // Floor pile shadow
    d.ellipse(CX, FLOOR_Y + 18, CASE.w * 0.38, 18, '#12233566');

    if (s.capsules) {
      // Draw back-to-front by y
      const ordered = s.capsules.slice().sort((a, b) => a.y - b.y);
      for (const cap of ordered) {
        if (s.held && cap.id === s.held.id) continue;
        drawCapsule(d, cap, time || s.t);
      }
    } else if (s.phase === 'idle') {
      d.text('Play', 450, 520, 36, '#ead6a4');
      d.wrap('Vault of curios · brass claw · dig for Digby’s prizes', 450, 580, 20, '#d2b98c', 520);
    }

    // Aim ghost
    if (s.phase === 'aim') {
      c.save();
      c.globalAlpha = 0.35;
      d.line({x: s.clawX, y: RAIL_Y + 50}, {x: s.clawX, y: FLOOR_Y}, '#fff6d8', 2);
      c.restore();
      const under = nearestCapsule(s);
      if (under) {
        const r = (under.size || 48) * 0.52;
        d.ellipse(under.x, under.y, r, r * 1.08, null, '#fff6d8aa', 2);
      }
    }

    if (s.phase === 'aim' || s.phase === 'drop' || (s.phase === 'result' && s.capsules)) {
      drawClaw(d, s.clawX, s.clawY, s.held ? 14 : CLAW_OPEN, !!s.held);
      if (s.held) drawCapsule(d, Object.assign({}, s.held, {x: s.clawX, lift: 0, y: s.clawY + 55}), time);
    }

    // Big 1–100 readout
    if (s.resultN) {
      d.glow(CX, 860, 70, '#e8c878');
      d.text(String(s.resultN), CX, 870, 64, '#fff6d8');
    }

    d.wrap(s.note || '', CX, 960, 22, '#fff6d8', 720);
    drawCreamPads(d);
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};

function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}
