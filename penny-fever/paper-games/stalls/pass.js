import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  BEA_CHAPTERS, makeStage, stepStage, swipeKey, curtainOpen, propsLeft,
  resultNumber, isBeaWin, ordinaryFor,
} from '../opening-night.js?v=curtain-1';

const BOOK = 'pennyFever.openingNight';
const CELL = 70;

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
    phase: s.phase, seed: s.seed, charged: !!s.charged, stage: s.stage,
    won: !!s.won, note: s.note, resultN: s.resultN || 0, reduced: !!s.reduced,
  };
  writeBook(book);
}
function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function origin(stage) {
  return {x: 450 - (stage.cols * CELL) / 2, y: 210};
}

function beginCue(s) {
  if (s.phase === 'run') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('pass', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 11 + s.level * 37;
    }
    s.stage = makeStage(s.level, s.seed);
    s.phase = 'run';
    s.resultN = 0;
    s.prizeKept = false;
    s.reduced = reducedMotion();
    s.note = 'Swipe the golden key to the portrait. Watch the curtains.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function finishNight(s, ok) {
  s.phase = 'result';
  s.charged = false;
  if (!ok) {
    s.hold = 0.8;
    s.note = 'The curtain fell before the key turned.';
    persist(s);
    return;
  }
  const n = resultNumber(s.seed);
  s.resultN = n;
  const prize = BEA_CHAPTERS[s.level].prize;
  const win = isBeaWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'pass');
    if (win) {
      keep(prize, 'pass');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: 450, y: 260});
  s.hold = 1.2;
  s.note = win
    ? 'The portrait swings. A prize waits on the tiny stage.'
    : 'The key turned. An ordinary cue this sitting.';
  persist(s);
}

export default {
  title: 'Opening Night',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  intro: alleyPlay
    ? 'Bea’s backstage. Swipe her golden key through curtains, racks and lights to the portrait door. A ticket sits you down; the first try of each chapter is included. Extra runs are a penny. The unique is behind the portrait. The showman pass is a status item, not a chapter stamp.'
    : 'Swipe the key to the portrait. Workshop cues are free and write nothing.',
  instructions: alleyPlay
    ? 'Swipe one tile at a time. Wait for gaps. Collect later-chapter props first. One sitting, one charge.'
    : 'Swipe the key. Practice writes nothing.',
  levels: BEA_CHAPTERS.map(c => c.title),
  sprites: ['cue-script', 'velvet-mask', 'secret-door-key', 'showman-ribbon', 'cue-card', 'stage-door-pass', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: BEA_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'cue', label: 'Cue the run · Space'},
    {id: 'up', label: 'Up'},
    {id: 'left', label: 'Left'},
    {id: 'right', label: 'Right'},
    {id: 'down', label: 'Down'},
    {id: 'again', label: alleyPlay ? 'Another cue · 1 penny' : 'Another cue'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 7) * 4673,
      stage: saved.stage || null, charged: !!saved.charged,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      resultN: saved.resultN || 0,
      note: saved.note || (BEA_CHAPTERS[level] || BEA_CHAPTERS[0]).title + '. Cue when you are ready.',
    };
    if (s.phase === 'run' && !s.stage) s.stage = makeStage(level, s.seed);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (s.phase === 'run' && s.stage) {
      stepStage(s.stage, dt * (s.reduced ? 0.5 : 1));
      const left = propsLeft(s.stage);
      s.note = left.length
        ? 'Collect ' + left.join(', ') + ' before the portrait.'
        : 'Lives ' + s.stage.lives + '. Reach the portrait.';
      if (s.stage.done) finishNight(s, true);
      else if (s.stage.failed) finishNight(s, false);
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The portrait opened',
          itemName(BEA_CHAPTERS[s.level].prize) + ' waited behind the door.',
          {prize: BEA_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (type === 'down') beginCue(s);
      return;
    }
    if (s.phase !== 'run' || !s.stage) return;
    if (type === 'down') s.pt = {x: p.x, y: p.y};
    if (type === 'up' && s.pt) {
      const dx = p.x - s.pt.x, dy = p.y - s.pt.y;
      if (Math.hypot(dx, dy) > 16) {
        swipeKey(s.stage, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      }
      s.pt = null;
    }
  },
  action(s, id) {
    if (id === 'cue' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Cue again when you are ready.';
        persist(s);
        return;
      }
      beginCue(s);
    }
    if (['up', 'down', 'left', 'right'].includes(id) && s.stage) swipeKey(s.stage, id);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === 'ArrowUp' || k === 'w') this.action(s, 'up');
    if (k === 'ArrowDown' || k === 's') this.action(s, 'down');
    if (k === 'ArrowLeft' || k === 'a') this.action(s, 'left');
    if (k === 'ArrowRight' || k === 'd') this.action(s, 'right');
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'run') return;
      this.action(s, 'cue');
    }
  },
  draw(s, d) {
    const ch = BEA_CHAPTERS[s.level];
    const c = d.c;
    d.text('Opening Night', 450, 110, 28, '#efe6d0');
    d.text(ch.title, 450, 146, 20, '#d2b98c');
    if (!s.won) {
      d.item(spriteKey(ch.prize), 800, 148, {w: 70, fallback: () => d.star(800, 148, 24)});
      d.text('behind the door', 800, 202, 14, '#ead6a4');
    }
    if (s.stage) {
      const o = origin(s.stage);
      for (let y = 0; y < s.stage.rows; y++) {
        for (let x = 0; x < s.stage.cols; x++) {
          const cell = s.stage.cells[y][x];
          const px = o.x + x * CELL, py = o.y + y * CELL;
          let fill = cell.kind === 'wall' ? '#1a1014' : cell.kind === 'door' ? '#e8c878' : cell.kind === 'start' ? '#4a2a38' : '#3a2030';
          const cur = s.stage.curtains.find(cu => cu.row === y && cu.cols.includes(x));
          if (cur && !curtainOpen(cur, s.stage.t)) fill = '#6a2038';
          const trap = s.stage.traps.find(tr => tr.x === x && tr.y === y);
          if (trap && trap.open) fill = '#0a0808';
          else if (trap && trap.warn) fill = '#5a3a20';
          roundRect(c, px + 3, py + 3, CELL - 6, CELL - 6, 8);
          c.fillStyle = fill;
          c.fill();
        }
      }
      s.stage.racks.forEach(r => {
        roundRect(c, o.x + r.x * CELL + 6, o.y + r.row * CELL + 10, r.w * CELL - 12, CELL - 20, 6);
        c.fillStyle = '#8a6a4a';
        c.fill();
      });
      s.stage.scenery.forEach(sc => {
        if (!sc.active) return;
        roundRect(c, o.x + sc.x * CELL + 4, o.y + sc.row * CELL + 8, sc.w * CELL - 8, CELL - 16, 6);
        c.fillStyle = '#5a6a8aaa';
        c.fill();
      });
      s.stage.lights.forEach(l => {
        if (!l.on) return;
        d.glow(o.x + l.x * CELL + CELL / 2, o.y + l.y * CELL + CELL / 2, CELL * 1.2, '#fff6d8');
      });
      s.stage.props.forEach(p => {
        if (p.got) return;
        d.circle(o.x + p.x * CELL + CELL / 2, o.y + p.y * CELL + CELL / 2, 10, '#f0d18f', '#3a2a18', 2);
      });
      d.circle(o.x + s.stage.x * CELL + CELL / 2, o.y + s.stage.y * CELL + CELL / 2, 14, '#e8c878', '#fff6d8', 2);
    } else {
      d.text('Cue', 450, 640, 32, '#ead6a4');
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
