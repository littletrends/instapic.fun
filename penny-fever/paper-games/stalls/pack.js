import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  KIT_CHAPTERS, makeCase, stepCase, shiftLive, rotateLive, softDrop, hardDrop, pocketSwap,
  resultNumber, isKitWin, ordinaryFor,
} from '../impossible-case.js?v=pack-1';

const BOOK = 'pennyFever.impossibleCase';
const CELL = 36;

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
    phase: s.phase, seed: s.seed, charged: !!s.charged, pack: s.pack,
    won: !!s.won, note: s.note, resultN: s.resultN || 0, reduced: !!s.reduced,
  };
  writeBook(book);
}
function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function origin(pack) {
  return {x: 450 - (pack.w * CELL) / 2, y: 260};
}

function beginPack(s) {
  if (s.phase === 'drop') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('pack', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 9 + s.level * 31;
    }
    s.pack = makeCase(s.level, s.seed);
    s.phase = 'drop';
    s.resultN = 0;
    s.prizeKept = false;
    s.reduced = reducedMotion();
    s.note = 'Pack the list. Strap the layers. Close the case.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function finishCase(s, ok) {
  s.phase = 'result';
  s.charged = false;
  if (!ok) {
    s.hold = 0.8;
    s.note = s.pack?.failed === 'clock'
      ? 'Midnight. The lid would not shut.'
      : s.pack?.failed === 'fragile'
        ? 'A fragile piece cracked. The list is short.'
        : 'The pile reached the lid.';
    persist(s);
    return;
  }
  const n = resultNumber(s.seed);
  s.resultN = n;
  const prize = KIT_CHAPTERS[s.level].prize;
  const win = isKitWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'pack');
    if (win) {
      keep(prize, 'pack');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: 450, y: 240});
  s.hold = 1.2;
  s.note = win
    ? 'The clasps snap. A luggage tag prints the unique.'
    : 'Packed. An ordinary tag this sitting.';
  persist(s);
}

export default {
  title: 'The Impossible Suitcase',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  intro: alleyPlay
    ? 'Kit’s night case. Fit the carnival objects, strap complete layers, and tick the packing list. A ticket sits you down; the first try of each chapter is included. Extra packs are a penny. The unique is in the luggage tag when the case closes. The night suitcase itself is Aura’s welcome case, not a chapter stamp.'
    : 'Rotate and pack. Close the list. Workshop packing is free and writes nothing.',
  instructions: alleyPlay
    ? 'Swipe to move, tap to rotate, flick down to drop. Side pocket from chapter 2. One sitting, one charge.'
    : 'Move, rotate, drop. Practice writes nothing.',
  levels: KIT_CHAPTERS.map(c => c.title),
  sprites: ['pressed-heart', 'penny-purse', 'penny-collector-book', 'sealed-secret', 'midnight-invitation', 'ticket-satchel', 'night-suitcase', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: KIT_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'open', label: 'Open the case · Space'},
    {id: 'left', label: 'Left'},
    {id: 'right', label: 'Right'},
    {id: 'rot', label: 'Rotate'},
    {id: 'drop', label: 'Drop'},
    {id: 'pocket', label: 'Side pocket'},
    {id: 'again', label: alleyPlay ? 'Another pack · 1 penny' : 'Another pack'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 6) * 4567,
      pack: saved.pack || null, charged: !!saved.charged,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      resultN: saved.resultN || 0,
      note: saved.note || (KIT_CHAPTERS[level] || KIT_CHAPTERS[0]).title + '. Open when you are ready.',
    };
    if (s.phase === 'drop' && !s.pack) s.pack = makeCase(level, s.seed);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (s.phase === 'drop' && s.pack) {
      stepCase(s.pack, dt, s.reduced);
      s.note = 'List ' + s.pack.packed.length + '/' + s.pack.required.length + ' · layers ' + s.pack.layers + '/' + s.pack.need;
      if (s.pack.done) finishCase(s, true);
      else if (s.pack.failed) finishCase(s, false);
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The case snapped shut',
          itemName(KIT_CHAPTERS[s.level].prize) + ' printed on the luggage tag.',
          {prize: KIT_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (type === 'down') beginPack(s);
      return;
    }
    if (s.phase !== 'drop' || !s.pack) return;
    if (type === 'down') s.pt = {x: p.x, y: p.y, t: s.t};
    if (type === 'move' && s.pt) {
      const dx = p.x - s.pt.x;
      if (dx > 28) { shiftLive(s.pack, 1); s.pt.x = p.x; }
      if (dx < -28) { shiftLive(s.pack, -1); s.pt.x = p.x; }
    }
    if (type === 'up' && s.pt) {
      const dx = p.x - s.pt.x, dy = p.y - s.pt.y;
      if (dy > 80 && Math.abs(dy) > Math.abs(dx)) hardDrop(s.pack);
      else if (Math.hypot(dx, dy) < 16) rotateLive(s.pack);
      s.pt = null;
    }
  },
  action(s, id) {
    if (id === 'open' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Open again when you are ready.';
        persist(s);
        return;
      }
      beginPack(s);
    }
    if (!s.pack || s.phase !== 'drop') return;
    if (id === 'left') shiftLive(s.pack, -1);
    if (id === 'right') shiftLive(s.pack, 1);
    if (id === 'rot') rotateLive(s.pack);
    if (id === 'drop') hardDrop(s.pack);
    if (id === 'pocket') pocketSwap(s.pack);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === 'ArrowLeft' || k === 'a') this.action(s, 'left');
    if (k === 'ArrowRight' || k === 'd') this.action(s, 'right');
    if (k === 'ArrowUp' || k === 'w' || k === 'x') this.action(s, 'rot');
    if (k === 'ArrowDown' || k === 's') { if (s.pack) softDrop(s.pack); }
    if (k === ' ') {
      if (s.phase === 'drop') this.action(s, 'drop');
      else this.action(s, 'open');
    }
    if (k === 'Enter') this.action(s, 'open');
    if (k === 'c' || k === 'Shift') this.action(s, 'pocket');
  },
  draw(s, d) {
    const ch = KIT_CHAPTERS[s.level];
    const c = d.c;
    d.text('The Impossible Suitcase', 450, 110, 26, '#efe6d0');
    d.text(ch.title, 450, 146, 20, '#d2b98c');
    if (!s.won) {
      d.item(spriteKey(ch.prize), 800, 148, {w: 70, fallback: () => d.star(800, 148, 24)});
      d.text('in the tag', 800, 202, 14, '#ead6a4');
    }
    if (s.pack) {
      const o = origin(s.pack);
      roundRect(c, o.x - 18, o.y - 24, s.pack.w * CELL + 36, s.pack.h * CELL + 48, 16);
      c.fillStyle = '#2a3a28ee';
      c.fill();
      c.strokeStyle = '#c6a267';
      c.lineWidth = 5;
      c.stroke();
      const paint = (piece, alpha) => {
        if (!piece) return;
        c.globalAlpha = alpha;
        piece.shape.forEach((row, ry) => row.forEach((v, rx) => {
          if (!v) return;
          const x = o.x + (piece.x + rx) * CELL;
          const y = o.y + (piece.y + ry) * CELL;
          roundRect(c, x + 2, y + 2, CELL - 4, CELL - 4, 6);
          c.fillStyle = piece.required ? '#c67483' : '#8a9a6a';
          c.fill();
        }));
        c.globalAlpha = 1;
      };
      for (let y = 0; y < s.pack.h; y++) {
        for (let x = 0; x < s.pack.w; x++) {
          const cell = s.pack.grid[y][x];
          const px = o.x + x * CELL, py = o.y + y * CELL;
          roundRect(c, px + 1, py + 1, CELL - 2, CELL - 2, 4);
          c.strokeStyle = '#4a5a40';
          c.lineWidth = 1;
          c.stroke();
          if (cell) {
            roundRect(c, px + 2, py + 2, CELL - 4, CELL - 4, 6);
            c.fillStyle = cell.blocked ? '#1a2418' : cell.cracked ? '#6a5040' : cell.required ? '#c67483' : '#7a8a5a';
            c.fill();
          }
        }
      }
      paint(s.pack.live, 1);
      const listY = 980;
      d.text(s.pack.required.map(id => (s.pack.packed.includes(id) ? '✓ ' : '• ') + id).join('   '), 450, listY, 14, '#ead6a4');
      if (s.pack.next) d.text('next: ' + (s.pack.next.secret && !s.pack.next.shape ? '?' : s.pack.next.name), 450, 220, 16, '#fff6d8');
      if (s.pack.pocketOn) d.text(s.pack.hold ? 'pocket: ' + s.pack.hold.name : 'pocket empty', 160, 220, 14, '#d2b98c');
    } else {
      d.text('Open', 450, 640, 32, '#ead6a4');
    }
    wrapLine(d, s.note, 450, 1040, 20, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1160, 16, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
