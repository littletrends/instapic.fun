import {clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  WILLA_CHAPTERS, makeRelay, threeCards, isWillaWin, resultNumber, ordinaryFor, NPC_NAMES,
} from '../whisper-run.js?v=first-prize-1';

const BOOK = 'pennyFever.whisperRun';
const GROUND = 900;
const MESS_W = 36, MESS_H = 48;

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
function wrapLine(d, text, x, y, size, color, maxW) {
  const c = d.c;
  c.font = `500 ${size}px Georgia,serif`;
  const words = String(text).split(' ');
  let line = '', ly = y;
  for (const word of words) {
    const trial = line ? line + ' ' + word : word;
    if (line && c.measureText(trial).width > maxW) {
      d.text(line, x, ly, size, color);
      line = word;
      ly += size + 8;
    } else line = trial;
  }
  if (line) d.text(line, x, ly, size, color);
  return ly;
}
function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function emptyBook() { return {v: 1, paid: {}, sittings: {}}; }
function readBook() {
  if (typeof localStorage === 'undefined') return emptyBook();
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1) return {paid: {}, sittings: {}, ...blob};
  } catch {}
  return emptyBook();
}
function writeBook(book) {
  if (!alleyPlay || typeof localStorage === 'undefined') return;
  try { localStorage.setItem(BOOK, JSON.stringify(book)); } catch {}
}
function chapterPaid(level) {
  return !!(readBook().paid && readBook().paid[String(level)]);
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
    phase: s.phase, seed: s.seed, charged: !!s.charged, relay: s.relay,
    cards: s.cards, mx: s.mx, my: s.my, vx: s.vx, vy: s.vy,
    won: !!s.won, note: s.note, resultN: s.resultN || 0, fortune: s.fortune,
  };
  writeBook(book);
}

function platforms(level) {
  const list = [
    {x: 40, y: GROUND, w: 820, h: 24},
    {x: 80, y: 720, w: 280, h: 20},
    {x: 520, y: 720, w: 300, h: 20},
  ];
  if (level >= 2) list.push({x: 300, y: 560, w: 300, h: 20});
  return list;
}
function ladders(level) {
  const list = [{x: 200, y: 720, h: GROUND - 720}];
  if (level >= 2) list.push({x: 640, y: 560, h: 160});
  return list;
}
function npcSpot(i, n) {
  const t = n <= 1 ? 0.72 : i / Math.max(1, n - 1);
  return {x: 140 + t * 640, y: GROUND - 10};
}

function beginRun(s) {
  if (s.phase === 'flash' || s.phase === 'run' || s.phase === 'pick') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('whisper', s.level)) { s.note = retryNote(); return; }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 11 + s.level * 29;
    }
    s.relay = makeRelay(s.level, s.seed);
    s.cards = null;
    s.phase = 'flash';
    s.flashLeft = s.relay.flash;
    s.mx = 80; s.my = GROUND; s.vx = 0; s.vy = 0;
    s.axis = 0; s.jump = false; s.won = s.won && chapterPaid(s.level);
    s.fortune = ''; s.resultN = 0; s.prizeKept = false;
    s.note = 'Read it. Then it vanishes.';
    persist(s);
  } finally { s.chargeLock = false; }
}

function openCards(s) {
  s.cards = threeCards(s.relay.current, rng(s.seed + s.relay.step * 97 + 3));
  s.phase = 'pick';
  s.note = (NPC_NAMES[s.relay.step] || 'A friend') + ' offers three whispers.';
  persist(s);
}

function pickCard(s, i) {
  if (s.phase !== 'pick' || !s.cards || !s.cards[i]) return;
  s.relay.current = s.cards[i];
  s.relay.log.push(s.cards[i]);
  s.relay.step += 1;
  s.cards = null;
  if (s.relay.step >= s.relay.npcs) {
    finishRun(s);
    return;
  }
  s.phase = 'run';
  s.mx = 80; s.my = GROUND; s.vx = 0; s.vy = 0;
  s.note = 'Carry it to ' + (NPC_NAMES[s.relay.step] || 'the next') + '.';
  persist(s);
}

function finishRun(s) {
  const n = resultNumber(s.seed);
  s.resultN = n;
  s.phase = 'result';
  s.charged = false;
  const faithful = s.relay.current === s.relay.original;
  s.fortune = faithful
    ? 'The secret arrived intact: “' + s.relay.original + '”'
    : 'Sent: “' + s.relay.original + '”  Delivered: “' + s.relay.current + '”';
  const prize = WILLA_CHAPTERS[s.level].prize;
  const win = isWillaWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'whisper');
    if (win) {
      keep(prize, 'whisper');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: 720, y: 200});
  s.hold = 1.2;
  s.note = s.fortune;
  persist(s);
}

function onLadder(s) {
  return ladders(s.level).some(l => Math.abs(s.mx - l.x) < 28 && s.my <= GROUND && s.my >= l.y - 4);
}
function standOn(s) {
  for (const p of platforms(s.level)) {
    if (s.mx > p.x && s.mx < p.x + p.w && s.my <= p.y + 8 && s.my >= p.y - 18 && s.vy >= 0) return p.y;
  }
  return null;
}

export default {
  title: 'Whisper Run',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  intro: alleyPlay
    ? 'Willa shows a whisper, then it vanishes. Cross the board to each friend and pick the phrase you remember. A wrong card muddles the secret — it does not end the run. A ticket sits you down; first try of each chapter is included.'
    : 'Read the whisper, cross, pick a card. Wrong cards keep going. Workshop writes nothing.',
  instructions: alleyPlay
    ? 'Left/right to run, jump to climb. At a friend, tap a card. The whole chain is one sitting.'
    : 'Move, jump, pick a card. Practice writes nothing.',
  levels: WILLA_CHAPTERS.map(c => c.title),
  sprites: ['whisper-charm', 'charm-pouch', 'secret-keeper', 'surprise-parcel', 'stamp-passport', 'lost-and-found-tag', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: WILLA_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'go', label: 'Start the run · Space'},
    {id: 'jump', label: 'Jump'},
    {id: 'again', label: alleyPlay ? 'Another run · 1 penny' : 'Another run'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 3) * 5003,
      relay: saved.relay || null, cards: saved.cards || null,
      mx: saved.mx || 80, my: saved.my || GROUND, vx: saved.vx || 0, vy: saved.vy || 0,
      charged: !!saved.charged, won: !!saved.won || chapterPaid(level),
      note: saved.note || 'Willa has a whisper. Start when you are ready.',
      resultN: saved.resultN || 0, fortune: saved.fortune || '', hold: 0,
      axis: 0, jump: false, flashLeft: 0,
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (s.phase === 'flash') {
      s.flashLeft -= dt;
      if (s.flashLeft <= 0) {
        s.phase = 'run';
        s.note = 'The whisper is gone. Find ' + (NPC_NAMES[0] || 'a friend') + '.';
        persist(s);
      }
    }
    if (s.phase === 'run') {
      const keys = input?.keys || new Set();
      const left = keys.has('ArrowLeft') || keys.has('a') || s.axis < 0;
      const right = keys.has('ArrowRight') || keys.has('d') || s.axis > 0;
      const up = keys.has('ArrowUp') || keys.has('w') || keys.has(' ') || s.jump;
      s.axis = 0; s.jump = false;
      const climb = onLadder(s);
      if (climb && up) { s.vy = -180; s.vx = 0; }
      else {
        s.vx = (right ? 1 : 0) - (left ? 1 : 0);
        s.vx *= 220;
        s.vy += 980 * dt;
        if (up && standOn(s) != null) s.vy = -420;
      }
      s.mx = clamp(s.mx + s.vx * dt, 50, 850);
      s.my += s.vy * dt;
      const floor = standOn(s);
      if (floor != null && s.vy >= 0) { s.my = floor; s.vy = 0; }
      if (s.my > GROUND) { s.my = GROUND; s.vy = 0; }
      const npc = npcSpot(s.relay.step, s.relay.npcs);
      if (Math.hypot(s.mx - npc.x, s.my - npc.y) < 50) openCards(s);
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The whisper arrived',
          itemName(WILLA_CHAPTERS[s.level].prize) + ' — ' + s.fortune,
          {prize: WILLA_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (type === 'up' || type === 'cancel') { s.axis = 0; return; }
    if (type !== 'down' && type !== 'move') return;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (type === 'down') beginRun(s);
      return;
    }
    if (s.phase === 'pick' && type === 'down' && s.cards) {
      s.cards.forEach((_, i) => {
        const b = {x: 70, y: 430 + i * 110, w: 760, h: 96};
        if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) pickCard(s, i);
      });
      return;
    }
    if (s.phase === 'run') {
      if (p.y < 520) s.jump = true;
      else s.axis = p.x < 450 ? -1 : 1;
    }
  },
  action(s, id) {
    if (id === 'go' || id === 'again') {
      if (s.phase === 'result') { s.phase = 'idle'; s.note = 'Another whisper when you are ready.'; persist(s); return; }
      beginRun(s);
    }
    if (id === 'jump') s.jump = true;
  },
  key(s, k, down) {
    if (!down) return;
    if (k === 'Enter') this.action(s, 'go');
    if (k === ' ' && s.phase === 'run') s.jump = true;
    if (s.phase === 'pick' && k >= '1' && k <= '3') pickCard(s, Number(k) - 1);
  },
  draw(s, d) {
    const ch = WILLA_CHAPTERS[s.level];
    const c = d.c;
    d.text('Whisper Run', 450, 118, 28, '#efe6d0');
    d.text(ch.title + ' · ' + ch.npcs + (ch.npcs === 1 ? ' friend' : ' friends'), 450, 154, 20, '#d2b98c');
    {
      const owned = s.won || chapterPaid(s.level);
      d.item(spriteKey(ch.prize), 800, 148, {w: 66, fallback: () => d.star(800, 148, 22)});
      d.text(owned ? 'Collected' : 'Locked', 800, 202, 14, owned ? '#c8e878' : '#ead6a4');
    }

    platforms(s.level).forEach(p => {
      roundRect(c, p.x, p.y, p.w, p.h, 6);
      c.fillStyle = '#3a2a18ee';
      c.fill();
      c.strokeStyle = '#e8c878';
      c.stroke();
    });
    ladders(s.level).forEach(l => {
      c.strokeStyle = '#c6a267';
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(l.x - 10, l.y); c.lineTo(l.x - 10, l.y + l.h); c.stroke();
      c.beginPath(); c.moveTo(l.x + 10, l.y); c.lineTo(l.x + 10, l.y + l.h); c.stroke();
    });

    if (s.relay) {
      for (let i = 0; i < s.relay.npcs; i++) {
        const n = npcSpot(i, s.relay.npcs);
        const live = i === s.relay.step && s.phase === 'run';
        d.circle(n.x, n.y - 36, 22, live ? '#f0d18fcc' : '#3a2a18ee', '#e8c878', 2);
        d.text(NPC_NAMES[i] || '?', n.x, n.y - 30, 14, '#fff6d8');
      }
    }
    d.circle(80, GROUND - 36, 22, '#5a2038ee', '#e8c878', 2);
    d.text('Willa', 80, GROUND - 30, 14, '#fff6d8');

    if (s.phase === 'run' || s.phase === 'flash') {
      roundRect(c, s.mx - MESS_W / 2, s.my - MESS_H, MESS_W, MESS_H, 8);
      c.fillStyle = '#c45a6aee';
      c.fill();
    }

    if (s.phase === 'flash' && s.relay) wrapLine(d, s.relay.original, 450, 280, 26, '#fff6d8', 720);
    if (s.phase === 'pick' && s.cards) {
      s.cards.forEach((text, i) => {
        const y = 430 + i * 110;
        roundRect(c, 70, y, 760, 96, 12);
        c.fillStyle = '#3a2a18ee';
        c.fill();
        c.strokeStyle = '#e8c878';
        c.lineWidth = 3;
        c.stroke();
        wrapLine(d, (i + 1) + '.  ' + text, 450, y + 44, 22, '#fff6d8', 700);
      });
    }
    wrapLine(d, s.note, 450, 980, 22, '#f0d18f', 720);
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
