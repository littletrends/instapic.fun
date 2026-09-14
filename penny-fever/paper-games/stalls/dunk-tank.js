import {done} from '../draw.js';
import {itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  DUNCAN_CHAPTERS, makeBoard, rotatePipe, toggleValve, startPump, stepFlow,
  dropChair, canDrop, tileAt, evaluateFlow, resultNumber, isDuncanWin, ordinaryFor, ports,
} from '../pressure-drop.js?v=duncan-1';

const BOOK = 'pennyFever.pressureDrop';

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
    splash: s.splash || 0,
  };
  writeBook(book);
}
function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function cellFrom(s, p) {
  const b = s.board;
  if (!b) return null;
  const c = Math.floor((p.x - b.originX) / b.cell);
  const r = Math.floor((p.y - b.originY) / b.cell);
  if (c < 0 || r < 0 || c >= b.cols || r >= b.rows) return null;
  return {c, r};
}

function beginSitting(s) {
  if (s.phase === 'build' || s.phase === 'flow' || s.phase === 'drop') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('dunk-tank', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 1 + s.level * 23;
    }
    s.board = makeBoard(s.level, s.seed);
    s.phase = 'build';
    s.resultN = 0;
    s.prizeKept = false;
    s.splash = 0;
    s.reduced = reducedMotion();
    s.note = s.board.tankRate
      ? 'The tank is rising. Rotate pipes, set valves, then pump before the waterline.'
      : 'Rotate pipes, set valves, then pump. Drop the empty chair when the gauge is gold.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function pump(s) {
  if (s.phase !== 'build' || !s.board) return;
  if (!startPump(s.board)) return;
  s.phase = 'flow';
  s.note = 'Water is travelling the brass.';
  persist(s);
}

function finishSitting(s, dropped) {
  const n = resultNumber(s.seed);
  s.resultN = n;
  s.phase = 'result';
  s.charged = false;
  const prize = DUNCAN_CHAPTERS[s.level].prize;
  const win = dropped && isDuncanWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (dropped) {
      if (drop === 'everyday-penny') credit(1);
      else keep(drop, 'dunk-tank');
    }
    if (win) {
      keep(prize, 'dunk-tank');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: 450, y: 980});
  s.hold = 1.2;
  if (win) s.note = 'The empty chair drops. ' + itemName(prize) + ' splashes out.';
  else if (dropped) s.note = 'A fine splash. An ordinary find. The unique still waits in the tank.';
  else s.note = 'Pressure lost. Duncan stays dry beside the cabinet.';
  persist(s);
}

function tryDrop(s) {
  if (!s.board || !canDrop(s.board)) return;
  dropChair(s.board);
  s.phase = 'splash';
  s.splash = 0.01;
  s.note = 'The piston snaps. The empty chair falls.';
  persist(s);
}

export default {
  title: 'Pressure Drop',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  houseSeconds: 90,
  houseTitle: 'The seat stays dry',
  houseDetail: 'Duncan wrings the splash. Another sitting when you are ready.',
  intro: alleyPlay
    ? 'Duncan’s Pressure Drop. A ticket sits you down; the first try of each chapter is included. Rotate brass pipes, set valves, pump a route, then drop the empty chair. Duncan stays put as host. The unique only splashes out on a complete route, a dropped chair, and tonight’s numbers.'
    : 'Rotate pipes, pump, drop the empty chair. Workshop writes nothing.',
  instructions: alleyPlay
    ? 'Tap a pipe to rotate 90°. Tap a valve to open or close. Pump when the route is ready, then drop the chair. Extra sittings after the first are a penny.'
    : 'Tap pipes to rotate, valves to toggle, then pump and drop. Practice writes nothing.',
  tableDetail: alleyPlay
    ? 'Build the flow. Drop the empty chair. Duncan does not take a bath.'
    : 'A practice works. Complete the route and drop the chair.',
  levels: DUNCAN_CHAPTERS.map(c => c.title),
  sprites: ['dunk-plate', 'barker-hat', 'splash-bead', 'wet-bell', 'towel-flag', 'seltzer-bottle', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: DUNCAN_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'play', label: alleyPlay ? 'Open the works' : 'Open the works'},
    {id: 'pump', label: 'Start pump'},
    {id: 'drop', label: 'Drop the chair'},
    {id: 'again', label: alleyPlay ? 'Another sitting · 1 penny' : 'Another sitting'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 1) * 4337,
      board: saved.board || null, charged: !!saved.charged,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      resultN: saved.resultN || 0, splash: saved.splash || 0,
      note: saved.note || (DUNCAN_CHAPTERS[level] || DUNCAN_CHAPTERS[0]).title + '. Open the works when you are ready.',
    };
    if ((s.phase === 'build' || s.phase === 'flow' || s.phase === 'drop' || s.phase === 'splash') && !s.board) {
      s.board = makeBoard(level, s.seed);
    }
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (s.phase === 'build' && s.board?.tankRate) {
      const ev = stepFlow(s.board, dt);
      if (ev.event === 'tank') {
        s.note = 'The tank reached the warning line. Pressure is lost.';
        finishSitting(s, false);
      }
    }
    if (s.phase === 'flow' && s.board) {
      const ev = stepFlow(s.board, dt);
      if (ev.event === 'ready') {
        s.phase = 'drop';
        s.note = 'Gold on the gauge. Drop the empty chair.';
        persist(s);
      } else if (ev.event === 'fail') {
        s.phase = 'build';
        s.board.flow = evaluateFlow(s.board);
        s.note = ev.failAt === 'leak'
          ? 'It hissed out a cracked pipe. Route around the leak.'
          : ev.failAt === 'drain'
            ? 'Pressure spilled down a drain. Close that branch.'
            : ev.failAt === 'pressure'
              ? 'The gauge never reached gold. Check valves and splits.'
              : 'The water never reached the piston. Turn the pipes.';
        persist(s);
      } else if (ev.event === 'tank') {
        finishSitting(s, false);
      }
    }
    if (s.phase === 'splash') {
      s.splash += dt;
      if (s.splash > 0.9) finishSitting(s, true);
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'A magnificently empty splash',
          itemName(DUNCAN_CHAPTERS[s.level].prize) + ' bobs out of the tank.',
          {prize: DUNCAN_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (type !== 'down' || s.result) return;
    if (s.phase === 'idle' || s.phase === 'result') {
      beginSitting(s);
      return;
    }
    if (s.phase === 'drop') {
      tryDrop(s);
      return;
    }
    if (s.phase !== 'build' || !s.board) return;
    if (p.y > 980 && p.x > 300 && p.x < 600) {
      pump(s);
      return;
    }
    const cell = cellFrom(s, p);
    if (!cell) return;
    const tile = tileAt(s.board, cell.c, cell.r);
    if (!tile) return;
    if (tile.type === 'valve') toggleValve(s.board, cell.c, cell.r);
    else rotatePipe(s.board, cell.c, cell.r);
    persist(s);
  },
  action(s, id) {
    if (id === 'play' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Open the works when you are ready.';
        persist(s);
        return;
      }
      beginSitting(s);
    }
    if (id === 'pump') pump(s);
    if (id === 'drop') tryDrop(s);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'drop') tryDrop(s);
      else if (s.phase === 'build') pump(s);
      else this.action(s, 'play');
    }
  },
  draw(s, d) {
    const ch = DUNCAN_CHAPTERS[s.level];
    const c = d.c;
    d.poly([[70, 86], [830, 86], [830, 1180], [70, 1180]], '#14363eee', '#d4b07a', 3);
    d.text('Pressure Drop', 450, 116, 26, '#efe6d0');
    d.text(ch.title, 450, 146, 18, '#9ed0c4');

    d.poly([[96, 168], [196, 168], [196, 268], [96, 268]], '#2a4a48cc', '#d4b07a', 2);
    d.text('Duncan', 146, 198, 13, '#ead6a4');
    d.ellipse(146, 226, 22, 28, '#d8c4a0', '#f0dcc0', 1);
    d.poly([[126, 248], [166, 248], [176, 300], [116, 300]], '#3a6a62', '#e8c878', 1);
    d.text('stays put', 146, 318, 12, '#9ed0c4');

    const b = s.board;
    if (b) {
      const flowSet = new Set((b.water || []).map(t => t.c + ',' + t.r));
      const shown = b.pumping ? Math.min(b.water.length, Math.floor((b.flowT || 0) / 0.18) + 1) : (b.flow?.ok ? b.water.length : 0);
      for (const t of b.tiles) {
        const x = b.originX + t.c * b.cell + b.cell / 2;
        const y = b.originY + t.r * b.cell + b.cell / 2;
        const wet = flowSet.has(t.c + ',' + t.r) && shown > (b.water || []).findIndex(q => q.c === t.c && q.r === t.r);
        roundRect(c, x - 32, y - 32, 64, 64, 8);
        c.fillStyle = t.type === 'leak' ? '#4a3028cc' : wet ? '#2a6a78cc' : '#2a4448cc';
        c.fill();
        c.strokeStyle = t.type === 'valve' ? '#f0d18f' : '#c9a46a';
        c.lineWidth = 2;
        c.stroke();
        const mask = ports(t);
        const ink = wet ? '#9ee8f0' : '#e8c878';
        if (mask & 1) d.line({x, y}, {x, y: y - 28}, ink, 7);
        if (mask & 2) d.line({x, y}, {x: x + 28, y}, ink, 7);
        if (mask & 4) d.line({x, y}, {x, y: y + 28}, ink, 7);
        if (mask & 8) d.line({x, y}, {x: x - 28, y}, ink, 7);
        if (t.type === 'pump') d.text('P', x, y + 5, 16, '#fff6d8');
        if (t.type === 'piston') d.text('◎', x, y + 6, 18, '#fff6d8');
        if (t.type === 'valve') d.text(t.open ? 'open' : 'shut', x, y + 18, 11, t.open ? '#c8e878' : '#e87878');
        if (t.type === 'leak') d.text('leak', x, y + 6, 11, '#f0b090');
        if (t.type === 'drain') d.text('drain', x, y + 6, 11, '#c0a0a0');
      }

      const gaugeX = 780, gaugeY = 220;
      const pr = b.flow ? b.flow.pressure : 0;
      d.circle(gaugeX, gaugeY, 44, '#1a3034', '#e8c878', 3);
      d.arc(gaugeX, gaugeY, 34, Math.PI * 0.75, Math.PI * 2.25, '#6a8a88', 6);
      d.arc(gaugeX, gaugeY, 34, Math.PI * 1.85, Math.PI * 2.25, '#e8c878', 6);
      const needle = Math.PI * 0.75 + Math.min(1, pr) * Math.PI * 1.5;
      d.line({x: gaugeX, y: gaugeY}, {x: gaugeX + Math.cos(needle) * 28, y: gaugeY + Math.sin(needle) * 28}, '#f0d18f', 3);
      d.text('gauge', gaugeX, gaugeY + 62, 12, '#ead6a4');

      if (b.tankRate) {
        roundRect(c, 80, 860, 28, 140, 6);
        c.fillStyle = '#1a3034';
        c.fill();
        const h = 140 * b.tank;
        c.fillStyle = b.tank > 0.8 ? '#e87878' : '#4aa0b0';
        c.fillRect(80, 1000 - h, 28, h);
        d.text('tank', 94, 1024, 12, '#ead6a4');
      }
    }

    d.poly([[300, 900], [300, 1088], [600, 1088], [600, 900]], '#2a6a68', '#d4b07a', 4);
    d.ellipse(450, 900, 150, 28, '#3a8880', '#e8c878', 4);
    const chairFall = s.board?.chair === 'down' || s.phase === 'splash' || (s.phase === 'result' && s.board?.chair === 'down');
    const a = chairFall ? Math.min(1.4, (s.splash || 1) * 2.2) : 0.05;
    d.line({x: 380, y: 820}, {x: 380 + Math.cos(a) * 90, y: 820 + Math.sin(a) * 90}, '#d4b07a', 10);
    d.poly([[400 + Math.cos(a) * 70, 800 + Math.sin(a) * 70], [460 + Math.cos(a) * 70, 800 + Math.sin(a) * 70], [468, 780], [392, 780]], '#c9b48a', '#f0dcc0', 2);
    d.text('empty chair', 450, 770, 13, '#ead6a4');
    if (s.splash > 0 && !s.reduced) {
      for (let i = 0; i < 14; i++) {
        const ang = i * 0.45, u = Math.min(1, s.splash);
        d.circle(450 + Math.cos(ang) * 90 * u, 930 - 80 * u + 90 * u * u, 6, '#b8ece8');
      }
    }

    roundRect(c, 320, 1100, 260, 48, 10);
    c.fillStyle = s.phase === 'build' ? '#f0d18fcc' : '#6a5a4888';
    c.fill();
    d.text(s.phase === 'drop' ? 'Drop the chair' : 'Start pump', 450, 1132, 18, '#3a2a18');

    wrapLine(d, s.note, 450, 1164, 16, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 790, 170, 14, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.phase + ' · ' + s.note;
  },
};
