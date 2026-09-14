import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  DOTTIE_CHAPTERS, makeParade, stepParade, tapPiece, pieceAt, homesReached, MARKS,
  resultNumber, isDottieWin, ordinaryFor,
} from '../duckling-parade.js?v=pond-1';

const BOOK = 'pennyFever.ducklingParade';
const CELL = 78;

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
    phase: s.phase, seed: s.seed, charged: !!s.charged, pond: s.pond,
    won: !!s.won, note: s.note, resultN: s.resultN || 0, reduced: !!s.reduced,
  };
  writeBook(book);
}
function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function origin(pond) {
  return {x: 450 - (pond.cols * CELL) / 2, y: 240};
}

function beginParade(s) {
  if (s.phase === 'parade') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('duck-pond', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 5 + s.level * 23;
    }
    s.pond = makeParade(s.level, s.seed);
    s.phase = 'parade';
    s.resultN = 0;
    s.prizeKept = false;
    s.reduced = reducedMotion();
    s.note = 'Turn the pads before the ducklings arrive. Bring ' + s.pond.need + ' home.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function finishParade(s, ok) {
  s.phase = 'result';
  s.charged = false;
  if (!ok) {
    s.hold = 0.8;
    s.note = 'The parade could not come home.';
    persist(s);
    return;
  }
  const n = resultNumber(s.seed);
  s.resultN = n;
  const prize = DOTTIE_CHAPTERS[s.level].prize;
  const win = isDottieWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'duck-pond');
    if (win) {
      keep(prize, 'duck-pond');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: 450, y: 320});
  s.hold = 1.2;
  s.note = win
    ? 'The last duckling tips. Something was underneath.'
    : 'Home. An ordinary pond gift this sitting.';
  persist(s);
}

function hitPiece(s, p) {
  if (!s.pond) return null;
  const o = origin(s.pond);
  const x = Math.floor((p.x - o.x) / CELL);
  const y = Math.floor((p.y - o.y) / CELL);
  const c = pieceAt(s.pond, x, y);
  if (!c || !c.id) return null;
  return c.id;
}

export default {
  title: 'Duckling Parade',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  intro: alleyPlay
    ? 'Dottie’s pond. The ducklings paddle themselves; you turn pads, gates and currents. A ticket sits you down; the first try of each chapter is included. Extra parades are a penny. The unique hides under a duckling that makes it home.'
    : 'Turn the pond. Guide them home. Workshop parades are free and write nothing.',
  instructions: alleyPlay
    ? 'Tap lily pads, gates, currents and bridges. The hook is a hazard. One sitting, one charge.'
    : 'Tap the route pieces. Practice writes nothing.',
  levels: DOTTIE_CHAPTERS.map(c => c.title),
  sprites: ['brave-try-ribbon', 'pond-lily-dish', 'crowned-duck', 'sleepy-dragon', 'spooky-pumpkin-friend', 'crown-turtle', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: DOTTIE_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'parade', label: 'Start the parade · Space'},
    {id: 'again', label: alleyPlay ? 'Another parade · 1 penny' : 'Another parade'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 4) * 4337,
      pond: saved.pond || null, charged: !!saved.charged,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      resultN: saved.resultN || 0,
      note: saved.note || (DOTTIE_CHAPTERS[level] || DOTTIE_CHAPTERS[0]).title + '. Start when you are ready.',
    };
    if (s.phase === 'parade' && !s.pond) s.pond = makeParade(level, s.seed);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (s.phase === 'parade' && s.pond) {
      stepParade(s.pond, dt * (s.reduced ? 0.5 : 1));
      s.note = homesReached(s.pond) + '/' + s.pond.need + ' home. Tap the water ahead of them.';
      if (s.pond.done) finishParade(s, true);
      else if (s.pond.failed) finishParade(s, false);
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The parade came home',
          itemName(DOTTIE_CHAPTERS[s.level].prize) + ' was under a duckling.',
          {prize: DOTTIE_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result || type !== 'down') return;
    if (s.phase === 'idle' || s.phase === 'result') {
      beginParade(s);
      return;
    }
    if (s.phase === 'parade') {
      const id = hitPiece(s, p);
      if (id) tapPiece(s.pond, id);
    }
  },
  action(s, id) {
    if (id === 'parade' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Another parade when you are ready.';
        persist(s);
        return;
      }
      beginParade(s);
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'parade') return;
      this.action(s, 'parade');
    }
  },
  draw(s, d) {
    const ch = DOTTIE_CHAPTERS[s.level];
    const c = d.c;
    d.text('Duckling Parade', 450, 118, 28, '#efe6d0');
    d.text(ch.title, 450, 154, 20, '#d2b98c');
    if (!s.won) {
      d.item(spriteKey(ch.prize), 800, 148, {w: 70, fallback: () => d.star(800, 148, 24)});
      d.text('under a duck', 800, 202, 14, '#ead6a4');
    }
    if (s.pond) {
      const o = origin(s.pond);
      const arrows = ['↑', '→', '↓', '←'];
      for (let y = 0; y < s.pond.rows; y++) {
        for (let x = 0; x < s.pond.cols; x++) {
          const cell = s.pond.cells[y][x];
          const px = o.x + x * CELL, py = o.y + y * CELL;
          const fill = cell.type === 'bank' ? '#3a4a30' : cell.type === 'home' ? '#e8c878' : cell.type === 'pad' ? '#6aaa6a' : cell.type === 'gate' ? '#8a6a4a' : cell.type === 'current' ? '#5a8aaa' : cell.type === 'hook' ? '#8a6a38' : cell.type === 'bridge' ? '#a4845a' : cell.type === 'rescue' ? '#7a6aaa' : '#3a6a7826';
          roundRect(c, px + 3, py + 3, CELL - 6, CELL - 6, 10);
          c.fillStyle = fill;
          c.fill();
          if (cell.type === 'pad' || cell.type === 'current' || cell.type === 'gate') {
            d.text(arrows[cell.dir || 0], px + CELL / 2, py + CELL / 2 + 8, 22, '#fff6d8');
          }
          if (cell.type === 'home') d.text(MARKS[cell.symbol || 0], px + CELL / 2, py + CELL / 2 + 8, 20, '#3a2a18');
          if (cell.type === 'hook' && cell.down) d.text('hook', px + CELL / 2, py + CELL / 2 + 6, 12, '#fff6d8');
        }
      }
      s.pond.ducks.forEach(duck => {
        const px = o.x + duck.x * CELL + CELL / 2;
        const py = o.y + duck.y * CELL + CELL / 2;
        d.circle(px, py, duck.home ? 10 : 14, duck.unique ? '#e8c878' : '#e5c46c', '#3a2a18', 2);
        d.text(MARKS[duck.symbol] || '•', px, py + 5, 12, '#3a2a18');
      });
    } else {
      d.text('Start', 450, 640, 32, '#ead6a4');
    }
    wrapLine(d, s.note, 450, 980, 22, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1160, 16, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
