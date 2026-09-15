import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  OPAL_CHAPTERS, makeGlass, isSolved, tapGlass, rotateSlot, hitSlot, slotPos,
  resultNumber, isOpalWin, ordinaryFor, SHARD_INK, SHARD_MARK,
} from '../shattered-fate.js?v=first-prize-1';

const BOOK = 'pennyFever.shatteredFate';
const CX = 450, CY = 640;

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

function emptyBook() {
  return {v: 1, paid: {}, sittings: {}};
}
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
    phase: s.phase, seed: s.seed, charged: !!s.charged, glass: s.glass,
    won: !!s.won, note: s.note, resultN: s.resultN || 0,
  };
  writeBook(book);
}

function beginShatter(s) {
  if (s.phase === 'play') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('catoptromancy', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 1 + s.level * 23;
    }
    s.glass = makeGlass(s.level, s.seed);
    s.phase = 'play';
    s.resultN = 0;
    s.prizeKept = false;
    const ch = OPAL_CHAPTERS[s.level];
    s.note = ch.rotate
      ? 'Tap a shard to hold it. Tap it again to turn. Tap another to swap.'
      : 'Tap one shard, then another to swap. No turning in this crack.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function afterMove(s) {
  if (s.phase !== 'play' || !s.glass) return;
  persist(s);
  if (isSolved(s.glass)) finishGlass(s);
}

function finishGlass(s) {
  const n = resultNumber(s.seed);
  s.resultN = n;
  s.phase = 'result';
  s.charged = false;
  const prize = OPAL_CHAPTERS[s.level].prize;
  const hit = isSolved(s.glass);
  const win = hit && isOpalWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  const seal = s.glass && s.glass.seal;
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'catoptromancy');
    if (win) {
      keep(prize, 'catoptromancy');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: CX, y: CY});
  s.hold = 1.2;
  s.note = win
    ? (seal ? seal.name : 'The glass opens') + ' — the unique steps out.'
    : (seal ? seal.name + '. An ordinary reflection this sitting.' : 'The glass holds an ordinary image.');
  persist(s);
}

export default {
  title: 'Shattered Fate',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  houseSeconds: 240,
  houseTitle: 'The glass fogged',
  houseDetail: 'Opal polishes the shards. Shatter again when you are ready.',
  persist,
  intro: alleyPlay
    ? 'Opal’s looking-glass shatters into a sealed picture. Swap and turn the shards until the image is whole, then the glass opens. A ticket sits you down; the first try of each chapter is included. Extra sittings are a penny. Taps inside a sitting are free. The unique only drops on a finished glass and tonight’s numbers.'
    : 'Shatter the glass. Swap and turn shards until the picture is whole. Workshop writes nothing.',
  instructions: alleyPlay
    ? 'Tap Shatter. Tap a shard to select, tap another to swap, tap the held shard to rotate (later chapters). One penny for the whole puzzle.'
    : 'Tap, swap, turn. Practice writes nothing.',
  levels: OPAL_CHAPTERS.map(c => c.title),
  sprites: ['looking-glass-locket', 'mirror-shard', 'folding-mirror', 'winter-snow-globe', 'winter-lantern-book', 'glass-garden-key', 'star-fragment', 'moon-lantern', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: OPAL_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'shatter', label: 'Shatter the glass · Space'},
    {id: 'rotate', label: 'Turn shard'},
    {id: 'again', label: alleyPlay ? 'Another glass · 1 penny' : 'Another glass'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 1) * 6121,
      glass: saved.glass || null, charged: !!saved.charged,
      won: !!saved.won || chapterPaid(level), hold: 0,
      resultN: saved.resultN || 0,
      note: saved.note || (OPAL_CHAPTERS[level] || OPAL_CHAPTERS[0]).title + '. Shatter when you are ready.',
    };
    if (s.phase === 'play' && !s.glass) s.glass = makeGlass(level, s.seed);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (s.phase === 'play' && s.glass && isSolved(s.glass)) finishGlass(s);
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The looking-glass opened',
          itemName(OPAL_CHAPTERS[s.level].prize) + ' — ' + (s.glass?.seal?.name || 'a sealed picture'),
          {prize: OPAL_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (type !== 'down' || s.result) return;
    if (s.phase === 'idle' || s.phase === 'result') {
      beginShatter(s);
      return;
    }
    if (s.phase === 'play' && s.glass) {
      const ch = OPAL_CHAPTERS[s.level];
      const slot = hitSlot(ch, s.glass, p.x, p.y);
      if (slot < 0) {
        s.glass.selected = -1;
        persist(s);
        return;
      }
      tapGlass(s.glass, slot);
      afterMove(s);
    }
  },
  action(s, id) {
    if (id === 'shatter' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Shatter again when you are ready.';
        persist(s);
        return;
      }
      beginShatter(s);
    }
    if (id === 'rotate' && s.phase === 'play' && s.glass) {
      const i = s.glass.selected >= 0 ? s.glass.selected : 0;
      rotateSlot(s.glass, i);
      afterMove(s);
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (s.phase === 'play' && s.glass && k >= '1' && k <= '9') {
      tapGlass(s.glass, Number(k) - 1);
      afterMove(s);
      return;
    }
    if ((k === 'r' || k === 'R') && s.phase === 'play') this.action(s, 'rotate');
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'idle' || s.phase === 'result') this.action(s, 'shatter');
    }
  },
  draw(s, d) {
    const ch = OPAL_CHAPTERS[s.level];
    const c = d.c;
    d.text('Shattered Fate', 450, 118, 28, '#efe6d0');
    d.text(ch.title, 450, 154, 20, '#d2b98c');
    if (!s.won) {
      d.item(spriteKey(ch.prize), 800, 148, {w: 70, fallback: () => d.star(800, 148, 24)});
      d.text('waiting', 800, 202, 14, '#ead6a4');
    }

    c.beginPath();
    c.ellipse(CX, 620, 310, 360, 0, 0, Math.PI * 2);
    // The illustrated template supplies the surface; keep the gameplay outline.
    c.strokeStyle = '#c8a0d8';
    c.lineWidth = 6;
    c.stroke();

    if (s.glass && (s.phase === 'play' || s.phase === 'result')) {
      for (let i = 0; i < s.glass.n; i++) {
        const id = s.glass.slots[i];
        const p = slotPos(ch, i);
        const rot = (s.glass.rots[id] || 0) * Math.PI / 2;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(rot);
        roundRect(c, -p.w / 2 + 4, -p.h / 2 + 4, p.w - 8, p.h - 8, 12);
        c.fillStyle = SHARD_INK[id % SHARD_INK.length];
        c.fill();
        c.strokeStyle = s.glass.selected === i ? '#fff6d8' : '#e8c878';
        c.lineWidth = s.glass.selected === i ? 5 : 2;
        c.stroke();
        c.restore();
        d.text(String(id + 1), p.x, p.y + 6, 24, '#2a1828');
        d.text(SHARD_MARK[id % SHARD_MARK.length], p.x, p.y + 28, 12, '#3a2a38');
      }
      if (s.phase === 'result' && s.glass.seal) {
        wrapLine(d, s.glass.seal.name, 450, 300, 24, '#fff6d8', 640);
      }
    } else {
      d.text('Shatter', CX, CY, 32, '#ead6a4');
    }

    wrapLine(d, s.note, 450, 1020, 22, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1160, 16, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
