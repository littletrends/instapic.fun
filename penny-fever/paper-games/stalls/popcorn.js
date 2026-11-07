import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  POPPY_CHAPTERS, makeRun, stepCart, steer, cargoCount, DIR_NAME, cellAt,
  resultNumber, isPoppyWin, ordinaryFor,
} from '../kernel-run.js?v=first-prize-1';

const BOOK = 'pennyFever.kernelRun';
const CELL = 48;

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
    phase: s.phase, seed: s.seed, charged: !!s.charged, run: s.run,
    won: !!s.won, note: s.note, resultN: s.resultN || 0, reduced: !!s.reduced,
  };
  writeBook(book);
}
function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function origin(run) {
  return {x: 450 - (run.cols * CELL) / 2, y: 320};
}

function beginRun(s) {
  if (s.phase === 'run') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('popcorn', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 3 + s.level * 19;
    }
    s.run = makeRun(s.level, s.seed);
    s.phase = 'run';
    s.resultN = 0;
    s.prizeKept = false;
    s.reduced = reducedMotion();
    s.note = 'Harvest ' + s.run.need + ' and deliver to the ' + s.run.destName + '.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function finishRun(s, ok) {
  s.phase = 'result';
  s.charged = false;
  if (!ok) {
    s.hold = 0.8;
    s.note = s.run?.failed === 'fuel'
      ? 'The cart ran dry. The load never arrived.'
      : 'The delivery failed.';
    persist(s);
    return;
  }
  const n = resultNumber(s.seed);
  s.resultN = n;
  const prize = POPPY_CHAPTERS[s.level].prize;
  const win = isPoppyWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'popcorn');
    if (win) {
      keep(prize, 'popcorn');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: 450, y: 520});
  s.hold = 1.2;
  s.note = win
    ? 'The load tips. Something was sealed in the last carton.'
    : 'Delivered. An ordinary kernel this sitting.';
  persist(s);
}

export default {
  title: 'Kernel Run',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  intro: alleyPlay
    ? 'Poppy’s field-to-fair run. Steer the cart, gather the load, and deliver it. A ticket sits you down; the first try of each chapter is included. Extra runs are a penny. The unique rides in a delivered load.'
    : 'Steer the cart. Deliver the load. Workshop runs are free and write nothing.',
  instructions: alleyPlay
    ? 'Swipe or tap a direction. The cart keeps rolling. One sitting, one charge.'
    : 'Steer and deliver. Practice writes nothing.',
  levels: POPPY_CHAPTERS.map(c => c.title),
  sprites: ['popcorn-carton', 'tiny-kettle', 'sweet-heat', 'kettle-corn-bag', 'lemon-fizz', 'butter-kernel', 'lucky-match', 'star-token', 'everyday-penny'],
  prizes: POPPY_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'go', label: 'Start the run · Space'},
    {id: 'up', label: 'Up'},
    {id: 'left', label: 'Left'},
    {id: 'right', label: 'Right'},
    {id: 'down', label: 'Down'},
    {id: 'again', label: alleyPlay ? 'Another run · 1 penny' : 'Another run'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 2) * 4219,
      run: saved.run || null, charged: !!saved.charged,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      resultN: saved.resultN || 0,
      note: saved.note || (POPPY_CHAPTERS[level] || POPPY_CHAPTERS[0]).title + '. Start when you are ready.',
    };
    if (s.phase === 'run' && !s.run) s.run = makeRun(level, s.seed);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (s.phase === 'run' && s.run) {
      stepCart(s.run, dt * (s.reduced ? 0.45 : 1));
      s.note = cargoCount(s.run) + '/' + s.run.need + ' aboard · ' + s.run.destName + ' waiting';
      if (s.run.delivered) finishRun(s, true);
      else if (s.run.failed) finishRun(s, false);
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The symphony lands',
          itemName(POPPY_CHAPTERS[s.level].prize) + ' was in the delivered load.',
          {prize: POPPY_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (type === 'down') beginRun(s);
      return;
    }
    if (s.phase !== 'run' || !s.run) return;
    if (type === 'down') s.pt = {x: p.x, y: p.y};
    if (type === 'up' && s.pt) {
      const dx = p.x - s.pt.x, dy = p.y - s.pt.y;
      if (Math.hypot(dx, dy) > 18) {
        steer(s.run, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      }
      s.pt = null;
    }
  },
  action(s, id) {
    if (id === 'go' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Another harvest when you are ready.';
        persist(s);
        return;
      }
      beginRun(s);
    }
    if (DIR_NAME.includes(id) && s.run) steer(s.run, id);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === 'ArrowUp' || k === 'w') this.action(s, 'up');
    if (k === 'ArrowDown' || k === 's') this.action(s, 'down');
    if (k === 'ArrowLeft' || k === 'a') this.action(s, 'left');
    if (k === 'ArrowRight' || k === 'd') this.action(s, 'right');
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'run') return;
      this.action(s, 'go');
    }
  },
  draw(s, d) {
    const ch = POPPY_CHAPTERS[s.level];
    const c = d.c;
    d.text('Kernel Run', 450, 118, 28, '#efe6d0');
    d.text(ch.title, 450, 154, 20, '#d2b98c');
    {
      const owned = s.won || chapterPaid(s.level);
      d.item(spriteKey(ch.prize), 800, 148, {w: 70, fallback: () => d.star(800, 148, 24)});
      d.text(owned ? 'Collected' : 'Locked', 800, 202, 14, owned ? '#c8e878' : '#ead6a4');
    }
    if (s.run) {
      const o = origin(s.run);
      for (let y = 0; y < s.run.rows; y++) {
        for (let x = 0; x < s.run.cols; x++) {
          const px = o.x + x * CELL, py = o.y + y * CELL;
          const kind = cellAt(s.run, x, y);
          const fill = kind === '#' ? '#3a2a18' : kind === 'C' ? '#c6b15a' : kind === 'D' ? '#e8c878' : kind === 'm' ? '#6a5438' : kind === 'k' ? '#c45a6a55' : kind === 'R' ? '#7a8a5a' : '#2a403026';
          roundRect(c, px + 2, py + 2, CELL - 4, CELL - 4, 6);
          c.fillStyle = fill;
          c.fill();
          if (kind === 'C') d.text('cob', px + CELL / 2, py + CELL / 2 + 4, 11, '#3a2a18');
          if (kind === 'D') d.text(s.run.destName.slice(0, 4), px + CELL / 2, py + CELL / 2 + 4, 11, '#3a2a18');
        }
      }
      (s.run.crows || []).forEach(cr => {
        d.circle(o.x + cr.x * CELL + CELL / 2, o.y + cr.y * CELL + CELL / 2, 12, '#2a2030', '#ead6a4', 1);
      });
      (s.run.fair || []).forEach(f => {
        d.circle(o.x + f.x * CELL + CELL / 2, o.y + f.y * CELL + CELL / 2, 11, '#6a4a38', '#e8c878', 1);
      });
      d.circle(o.x + s.run.x * CELL + CELL / 2, o.y + s.run.y * CELL + CELL / 2, 14, '#c45a6a', '#fff6d8', 2);
      const fuel = Math.max(0, s.run.fuel / s.run.fuelMax);
      roundRect(c, 200, 860, 500 * fuel, 14, 6);
      c.fillStyle = '#e8c878';
      c.fill();
      d.text(cargoCount(s.run) + ' aboard', 450, 890, 18, '#fff6d8');
    } else {
      d.text('Start', 450, 640, 32, '#ead6a4');
    }
    wrapLine(d, s.note, 450, 930, 22, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1160, 16, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
