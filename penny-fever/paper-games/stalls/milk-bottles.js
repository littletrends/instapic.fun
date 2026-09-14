import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  MABEL_CHAPTERS, makeBoard, applySwap, cloneBoard, isDelivered, isMabelWin, resultNumber,
  ordinaryFor, flavourOf, cellFromPoint, cellCenter, refillMoves, locateUnique, layoutOf,
} from '../milky-splash.js?v=splash-1';

const BOOK = 'pennyFever.milkySplash';

function roundRect(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y, x + w, y, rr);
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

function boardBlob(board) {
  if (!board) return null;
  return {
    level: board.level, seed: board.seed, cols: board.cols, rows: board.rows,
    cells: board.cells, moves: board.moves, movesLeft: board.movesLeft,
    unique: board.unique, delivered: !!board.delivered, sourOn: !!board.sourOn,
    pool: board.pool, collected: board.collected, rngSeed: board.rngSeed || board.seed,
    rng: board.rng ? {s: board.rng.s} : undefined,
  };
}

function persist(s) {
  if (!alleyPlay || !s) return;
  const book = readBook();
  book.sittings[String(s.level)] = {
    phase: s.phase, seed: s.seed, charged: !!s.charged,
    board: boardBlob(s.board), resultN: s.resultN || 0,
    won: !!s.won, note: s.note, reduced: !!s.reduced,
    selected: s.selected,
  };
  writeBook(book);
}

function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function revive(blob, level, seed) {
  if (blob && blob.cells) return cloneBoard(blob);
  return makeBoard(level, seed);
}

function finishWin(s) {
  if (s.won || s.phase === 'result') return;
  const n = s.resultN || resultNumber(s.seed);
  s.resultN = n;
  const prize = MABEL_CHAPTERS[s.level].prize;
  const delivered = isDelivered(s.board);
  const win = delivered && isMabelWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  s.phase = 'result';
  s.charged = false;
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'milk-bottles');
    if (win) {
      keep(prize, 'milk-bottles');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, cellCenter(s.board, s.board.unique.c, s.board.unique.r));
  s.hold = 1.2;
  s.note = win
    ? 'The sealed bottle opens in Mabel’s crate.'
    : delivered
      ? 'Into the crate — but tonight’s numbers kept the unique.'
      : 'The dairy settles.';
  persist(s);
}

function restSitting(s, why) {
  const n = s.resultN || resultNumber(s.seed);
  s.resultN = n;
  const waiting = !!(s.board && locateUnique(s.board) && !s.board.delivered);
  s.charged = false;
  if (waiting) {
    s.phase = 'rest';
    s.note = why || 'Moves gone. The sealed bottle waits in the crate-run. A penny for more swaps.';
    persist(s);
    return;
  }
  const drop = ordinaryFor(n);
  s.phase = 'result';
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'milk-bottles');
  }
  s.hold = 0.8;
  s.note = why || 'Moves gone. Ordinary dairy, no unique tonight.';
  persist(s);
}

function beginPlay(s) {
  if (s.phase === 'play') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    const waiting = !!(s.board && locateUnique(s.board) && !s.board.delivered);
    if (!s.charged) {
      if (!takeAttempt('milk-bottles', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      if (!waiting) {
        s.seed = (s.seed || (s.level + 1) * 4099) + 1 + s.level * 17;
        s.board = makeBoard(s.level, s.seed);
        s.resultN = resultNumber(s.seed);
        s.won = s.won && chapterPaid(s.level);
        s.prizeKept = false;
      } else {
        refillMoves(s.board);
      }
    }
    s.phase = 'play';
    s.selected = null;
    s.reduced = reducedMotion();
    const u = locateUnique(s.board);
    s.note = u
      ? 'Match beneath the sealed bottle. Walk it down into the crate.'
      : 'Swap neighbours. Three of a flavour splash.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function trySwap(s, a, b) {
  if (s.phase !== 'play' || s.lock || s.result) return;
  const res = applySwap(s.board, a.c, a.r, b.c, b.r);
  if (!res.ok) {
    s.note = res.reason === 'no-match' ? 'No splash — the bottles bounce home.' : 'Those two will not trade.';
    s.selected = null;
    return;
  }
  s.selected = null;
  s.note = s.board.unique
    ? (s.board.movesLeft + ' moves. Walk the sealed bottle down.')
    : (s.board.movesLeft + ' moves left.');
  if (s.board.delivered) finishWin(s);
  else if (s.board.movesLeft <= 0) restSitting(s);
  else persist(s);
}

export default {
  title: 'Milky Splash!',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  houseSeconds: 160,
  houseTitle: 'The dairy closes',
  houseDetail: 'Mabel covers the crate. Another sitting when you are ready.',
  intro: alleyPlay
    ? 'Mabel’s match-three dairy. Swap neighbouring bottles. A ticket sits you down; the first try of each chapter is included. Extra sittings are a penny — one charge, a full move tray. If a sealed unique appears, match it down into the crate. The board waits if moves run out.'
    : 'Swap neighbouring bottles. Workshop sittings are free and write nothing. Walk a sealed bottle into the crate when one appears.',
  instructions: alleyPlay
    ? 'Tap two neighbours to swap. Only a real match spends a move. Cascades are free. The unique is a sealed bottle — splash the dairy beneath it until it drops into Mabel’s crate.'
    : 'Tap two neighbours. Practice writes nothing.',
  levels: MABEL_CHAPTERS.map(c => c.title),
  sprites: ['dairy-calf', 'lucky-dish', 'alley-collector-cup', 'cocoa-cup', 'crown-hatbox', 'cream-churn', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: MABEL_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'play', label: alleyPlay ? 'Sit · Space' : 'Sit at the dairy'},
    {id: 'again', label: alleyPlay ? 'Another tray · 1 penny' : 'Another tray'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const seed = saved.seed || (level + 1) * 4099;
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed,
      board: saved.board ? revive(saved.board, level, seed) : null,
      charged: !!saved.charged, resultN: saved.resultN || 0,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      selected: saved.selected || null, lock: false,
      note: saved.note || (MABEL_CHAPTERS[level] || MABEL_CHAPTERS[0]).title + '. Sit when you are ready.',
    };
    if ((s.phase === 'play' || s.phase === 'rest') && !s.board) s.board = makeBoard(level, s.seed);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (s.phase === 'play' && s.board) {
      if (s.board.delivered && !s.won) finishWin(s);
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The crate takes the unique',
          itemName(MABEL_CHAPTERS[s.level].prize) + ' — sealed bottle delivered.',
          {prize: MABEL_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (s.phase === 'idle' || s.phase === 'result' || s.phase === 'rest') {
      if (type === 'down') beginPlay(s);
      return;
    }
    if (s.phase !== 'play' || !s.board) return;
    if (type === 'down') {
      const cell = cellFromPoint(s.board, p);
      if (!cell) return;
      if (s.selected && (s.selected.c !== cell.c || s.selected.r !== cell.r)) {
        trySwap(s, s.selected, cell);
        return;
      }
      s.selected = cell;
      s.pointerCell = cell;
      return;
    }
    if (type === 'up' && s.pointerCell) {
      const cell = cellFromPoint(s.board, p);
      if (cell && (cell.c !== s.pointerCell.c || cell.r !== s.pointerCell.r)) trySwap(s, s.pointerCell, cell);
      s.pointerCell = null;
    }
    if (type === 'cancel') s.pointerCell = null;
  },
  action(s, id) {
    if (id === 'play' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        if (!(s.board && locateUnique(s.board) && !s.board.delivered)) s.board = null;
        s.note = 'Sit again when you are ready.';
        persist(s);
        return;
      }
      beginPlay(s);
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ' || k === 'Enter') this.action(s, 'play');
  },
  draw(s, d) {
    const ch = MABEL_CHAPTERS[s.level];
    const c = d.c;
    d.text('Milky Splash!', 450, 108, 28, '#efe6d0');
    d.text(ch.title, 450, 142, 18, '#d2b98c');
    if (!s.won) {
      d.item(spriteKey(ch.prize), 800, 132, {w: 64, fallback: () => d.star(800, 132, 22)});
      d.text('waiting', 800, 184, 13, '#ead6a4');
    }
    const board = s.board;
    if (board) {
      const {size, originX, originY, crateY} = layoutOf(board);
      roundRect(c, originX - 12, originY - 12, board.cols * size + 24, board.rows * size + 24, 14);
      // The illustrated template supplies the surface; keep the gameplay outline.
      c.strokeStyle = '#e8c878';
      c.lineWidth = 3;
      c.stroke();
      for (let r = 0; r < board.rows; r++) {
        for (let col = 0; col < board.cols; col++) {
          const cell = board.cells[r][col];
          const x = originX + col * size, y = originY + r * size;
          const sel = s.selected && s.selected.c === col && s.selected.r === r;
          if (!cell || cell.kind === 'hole') {
            if (cell?.kind === 'hole') {
              roundRect(c, x + 6, y + 6, size - 12, size - 12, 8);
              c.fillStyle = '#1a120866';
              c.fill();
            }
            continue;
          }
          if (cell.kind === 'crate') {
            roundRect(c, x + 8, y + 10, size - 16, size - 20, 6);
            c.fillStyle = '#8a6238';
            c.fill();
            c.strokeStyle = '#e8c878';
            c.stroke();
            d.text('crate', x + size / 2, y + size / 2 + 4, 11, '#fff6d8');
            continue;
          }
          if (cell.kind === 'weighted') {
            d.bottle(x + size / 2, y + size * 0.72, size / 54, '#9a8a78', 0);
            d.text('w', x + size / 2, y + size * 0.42, 14, '#fff6d8');
            continue;
          }
          if (cell.kind === 'sour') {
            d.bottle(x + size / 2, y + size * 0.72, size / 54, '#7a9a48', 0);
            d.text('sour', x + size / 2, y + size * 0.4, 11, '#fff6d8');
            continue;
          }
          if (cell.kind === 'unique') {
            d.glow(x + size / 2, y + size / 2, size * 0.6, '#f0d18f');
            d.bottle(x + size / 2, y + size * 0.72, size / 48, '#f4e8c0', 0);
            d.item(spriteKey(ch.prize), x + size / 2, y + size * 0.42, {
              w: size * 0.55, fallback: () => d.star(x + size / 2, y + size * 0.42, 12),
            });
            continue;
          }
          const flav = flavourOf(cell.flavour);
          d.bottle(x + size / 2, y + size * 0.74, size / 52, flav.fill, 0);
          d.text(flav.mark, x + size / 2, y + size * 0.42, sel ? 20 : 16, flav.ink);
          if (cell.kind === 'special') d.text(cell.special === 'cream' ? 'gold' : 'fizz', x + size / 2, y + size * 0.58, 10, '#fff6d8');
          if (sel) {
            c.strokeStyle = '#fff6d8';
            c.lineWidth = 3;
            roundRect(c, x + 4, y + 4, size - 8, size - 8, 8);
            c.stroke();
          }
        }
      }
      roundRect(c, originX, crateY, board.cols * size, 54, 8);
      c.fillStyle = '#6a4228ee';
      c.fill();
      c.strokeStyle = '#e8c878';
      c.stroke();
      d.text(board.delivered ? 'crate · taken' : 'Mabel’s crate', 450, crateY + 34, 16, '#fff6d8');
      d.text(board.movesLeft + ' moves', 160, 142, 16, '#f0d18f');
    } else {
      d.text('Sit', 450, 640, 32, '#ead6a4');
    }
    wrapLine(d, s.note, 450, 1088, 20, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1168, 16, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    const moves = s.board ? s.board.movesLeft + ' moves' : 'idle';
    const u = s.board && locateUnique(s.board) ? (s.board.delivered ? 'delivered' : 'sealed on board') : 'no unique';
    return purse + ' · ' + moves + ' · ' + u + ' · ' + s.note;
  },
};
