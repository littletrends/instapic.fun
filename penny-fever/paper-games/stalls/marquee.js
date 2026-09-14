import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  LUMI_CHAPTERS, makeBoard, stepBoard, serveBoard, movePaddle, allLit, targetPos,
  resultNumber, isLumiWin, ordinaryFor,
} from '../glowball.js?v=boardwalk-1';

const BOOK = 'pennyFever.marqueeGlowball';

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
    phase: s.phase, seed: s.seed, charged: !!s.charged, board: s.board,
    won: !!s.won, note: s.note, resultN: s.resultN || 0, reduced: !!s.reduced,
  };
  writeBook(book);
}
function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function beginServe(s) {
  if (s.phase === 'play' && s.board?.served) return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (s.phase !== 'play' || !s.board) {
      if (!s.charged) {
        if (!takeAttempt('marquee', s.level)) {
          s.note = retryNote();
          return;
        }
        s.charged = true;
        s.seed = (s.seed || (Date.now() & 0xfffffff)) + 7 + s.level * 29;
      }
      s.board = makeBoard(s.level, s.seed);
      s.phase = 'play';
      s.resultN = 0;
      s.prizeKept = false;
      s.reduced = reducedMotion();
    }
    serveBoard(s.board);
    s.note = 'Keep the star up. Light the marquee, then the lantern.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function finishBoard(s, ok) {
  s.phase = 'result';
  s.charged = false;
  if (!ok) {
    s.hold = 0.8;
    s.note = 'The star fell. The lantern stays sealed.';
    persist(s);
    return;
  }
  const n = resultNumber(s.seed);
  s.resultN = n;
  const prize = LUMI_CHAPTERS[s.level].prize;
  const win = isLumiWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'marquee');
    if (win) {
      keep(prize, 'marquee');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: 450, y: 360});
  s.hold = 1.2;
  s.note = win
    ? 'The lantern opens. The boardwalk keeps a prize.'
    : 'Lit. An ordinary spark this sitting.';
  persist(s);
}

export default {
  title: 'Marquee Glowball',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  intro: alleyPlay
    ? 'Lumi’s dark marquee. Paddle the star, light every bulb, then strike the prize lantern. A ticket sits you down; the first try of each chapter is included. Extra nights are a penny. The unique waits in the lantern.'
    : 'Paddle the star. Light the board. Workshop nights are free and write nothing.',
  instructions: alleyPlay
    ? 'Drag to move the paddle. Serve with Space. Last hit is the lantern. One sitting, one charge.'
    : 'Slide the paddle. Practice writes nothing.',
  levels: LUMI_CHAPTERS.map(c => c.title),
  sprites: ['marquee-bulb', 'pocket-marquee', 'lantern-lighter', 'midway-map', 'new-year-star-cracker', 'marquee-stub', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: LUMI_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'serve', label: 'Serve · Space'},
    {id: 'again', label: alleyPlay ? 'Another night · 1 penny' : 'Another night'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 5) * 4451,
      board: saved.board || null, charged: !!saved.charged,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      resultN: saved.resultN || 0,
      note: saved.note || (LUMI_CHAPTERS[level] || LUMI_CHAPTERS[0]).title + '. Serve when you are ready.',
    };
    if (s.phase === 'play' && !s.board) s.board = makeBoard(level, s.seed);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (s.phase === 'play' && s.board) {
      stepBoard(s.board, dt, s.reduced);
      const lit = s.board.targets.filter(t => t.lit).length;
      s.note = s.board.lantern.open
        ? 'The lantern is open. Strike it.'
        : lit + '/' + s.board.targets.length + ' lights · ' + s.board.lives + ' stars';
      if (s.board.done) finishBoard(s, true);
      else if (s.board.failed) finishBoard(s, false);
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The boardwalk woke',
          itemName(LUMI_CHAPTERS[s.level].prize) + ' dropped from the lantern.',
          {prize: LUMI_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (type === 'down') beginServe(s);
      return;
    }
    if (s.phase === 'play' && s.board && (type === 'down' || type === 'move')) {
      movePaddle(s.board, p.x);
      if (type === 'down' && !s.board.served) serveBoard(s.board);
    }
  },
  action(s, id) {
    if (id === 'serve' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Serve again when you are ready.';
        persist(s);
        return;
      }
      beginServe(s);
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (k === 'ArrowLeft' && s.board) movePaddle(s.board, s.board.paddle.x - 36);
    if (k === 'ArrowRight' && s.board) movePaddle(s.board, s.board.paddle.x + 36);
    if (k === ' ' || k === 'Enter') this.action(s, 'serve');
  },
  draw(s, d) {
    const ch = LUMI_CHAPTERS[s.level];
    const c = d.c;
    const glow = s.board ? s.board.targets.filter(t => t.lit).length / Math.max(1, s.board.targets.length) : 0;
    d.text('Marquee Glowball', 450, 118, 28, '#efe6d0');
    d.text(ch.title, 450, 154, 20, '#d2b98c');
    if (!s.won) {
      d.item(spriteKey(ch.prize), 800, 148, {w: 70, fallback: () => d.star(800, 148, 24)});
      d.text('in the lantern', 800, 202, 14, '#ead6a4');
    }
    roundRect(c, 80, 200, 740, 860, 18);
    c.fillStyle = `rgba(8, 16, 14, ${0.92 - glow * 0.35})`;
    c.fill();
    c.strokeStyle = '#e8c878';
    c.lineWidth = 4;
    c.stroke();
    if (s.board) {
      s.board.targets.forEach(t => {
        const p = targetPos(t, s.board.t);
        d.circle(p.x, p.y, t.r, t.lit ? '#f4d590' : '#243028', t.lit ? '#fff6d8' : '#6a7a68', 2);
      });
      const L = s.board.lantern;
      d.circle(L.x, L.y, L.r, L.open ? '#f0d18f' : '#2a2018', '#e8c878', 3);
      (s.board.bumpers || []).forEach(b => d.star(b.x, b.y, b.r));
      (s.board.mirrors || []).forEach(m => {
        roundRect(c, m.x, m.y, m.w, m.h, 4);
        c.fillStyle = '#c8d8e8aa';
        c.fill();
      });
      (s.board.clouds || []).forEach(cl => d.circle(cl.x, cl.y, cl.r, '#d8d0c055'));
      const p = s.board.paddle;
      roundRect(c, p.x - p.w / 2, p.y, p.w, 16, 8);
      c.fillStyle = '#c4a46a';
      c.fill();
      s.board.balls.forEach(b => d.star(b.x, b.y, b.r + 4, '#fff6d8'));
      if (!s.board.served) d.text('Serve', 450, 900, 24, '#ead6a4');
    } else {
      d.text('Serve', 450, 640, 32, '#ead6a4');
    }
    wrapLine(d, s.note, 450, 1088, 20, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1160, 16, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
