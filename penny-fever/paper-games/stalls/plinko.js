import {clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  PEGGY_CHAPTERS, makeMill, dropMarble, stepMill, fireFlipper, flipperTips,
  isPeggyWin, resultNumber, ordinaryFor, RAIL_Y,
} from '../marble-mill.js?v=mill-1';

const BOOK = 'pennyFever.marbleMill';

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
    phase: s.phase, seed: s.seed, charged: !!s.charged, mill: s.mill,
    aim: s.aim, resultN: s.resultN || 0, won: !!s.won, note: s.note, reduced: !!s.reduced,
  };
  writeBook(book);
}

function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function awardIfHit(s) {
  if (!s.mill || s.awarded) return;
  const n = s.resultN || resultNumber(s.seed);
  s.resultN = n;
  const prize = PEGGY_CHAPTERS[s.level].prize;
  const hitUnique = !!(s.mill.uniqueHit && s.mill.unique && s.mill.unique.prize);
  const win = hitUnique && isPeggyWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  if (!hitUnique) return;
  s.awarded = true;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'plinko');
    if (win) {
      keep(prize, 'plinko');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: s.mill.unique.x, y: s.mill.unique.y});
  s.note = win
    ? 'Struck the hanging unique. It falls with the marble.'
    : 'Struck the hanging piece — tonight’s numbers kept the unique.';
  persist(s);
}

function finishDrain(s) {
  if (s.phase === 'result') return;
  awardIfHit(s);
  const n = s.resultN || resultNumber(s.seed);
  s.resultN = n;
  s.phase = 'result';
  s.charged = false;
  if (!s.awarded) {
    const drop = ordinaryFor(n);
    if (alleyPlay) {
      if (drop === 'everyday-penny') credit(1);
      else keep(drop, 'plinko');
    }
  }
  s.hold = s.won ? 1.1 : 0.7;
  if (!s.won) s.note = s.mill?.uniqueHit
    ? s.note
    : 'The marble drained. Strike the hanging unique next penny.';
  persist(s);
}

function beginDrop(s) {
  if (s.phase === 'live') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('plinko', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (s.level + 1) * 4099) + 1 + s.level * 23;
      s.mill = makeMill(s.level, s.seed);
      s.resultN = s.mill.resultN;
      s.awarded = false;
      s.prizeKept = false;
    }
    if (!s.mill) s.mill = makeMill(s.level, s.seed);
    if (s.mill.unique && s.mill.ch.roam) s.mill.unique.locked = true;
    dropMarble(s.mill, s.aim, 0.55);
    s.phase = 'live';
    s.reduced = reducedMotion();
    s.note = s.mill.unique?.prize
      ? 'The unique hangs in the pegs. Strike it before the drain.'
      : 'An ordinary hang. Flippers are free for this marble.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

export default {
  title: 'Marble Mill',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  houseSeconds: 60,
  houseTitle: 'The mill stopped',
  houseDetail: 'Peggy locks the gates. Drop another marble next sitting.',
  intro: alleyPlay
    ? 'Peggy’s mill. No numbered bowls — only a long peg field and an open drain. One penny, one marble. Flippers are free for that run. If a unique hangs in the pegs, strike it before the marble falls through.'
    : 'Aim the rail, drop a practice marble, tap side flippers. Workshop drops write nothing.',
  instructions: alleyPlay
    ? 'Drag the top slider, release to drop. Tap left or right to fire a flipper. Hit the hanging unique. A drain without a hit spends the penny.'
    : 'Aim, drop, flip. Practice writes nothing.',
  levels: PEGGY_CHAPTERS.map(c => c.title),
  sprites: ['mill-marble', 'gate-token', 'heart-gear', 'ticket-punch', 'stamp-and-inkpad', 'marble-tin', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: PEGGY_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'left', label: 'Left flipper · Z', hold: true},
    {id: 'drop', label: alleyPlay ? 'Drop · 1 penny' : 'Drop marble'},
    {id: 'right', label: 'Right flipper · X', hold: true},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 1) * 4099,
      mill: saved.mill || null, aim: saved.aim || 450,
      charged: !!saved.charged, resultN: saved.resultN || 0,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      left: false, right: false, awarded: false,
      note: saved.note || (PEGGY_CHAPTERS[level] || PEGGY_CHAPTERS[0]).title + '. Aim the rail, then drop.',
    };
    if (s.phase === 'live' && !s.mill) s.mill = makeMill(level, s.seed);
    if (s.phase === 'idle' && alleyPlay && !s.mill) s.mill = makeMill(level, s.seed);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    const keys = input?.keys || new Set();
    const acts = input?.actions || new Set();
    const left = s.left || keys.has('ArrowLeft') || keys.has('z') || keys.has('Z') || acts.has('left');
    const right = s.right || keys.has('ArrowRight') || keys.has('x') || keys.has('X') || acts.has('right');
    if (s.phase === 'idle' || s.phase === 'aim') {
      s.aim = clamp(s.aim + ((right ? 1 : 0) - (left ? 1 : 0)) * 260 * dt, 200, 700);
      if (s.mill && !s.mill.marble) stepMill(s.mill, dt, {}, s.reduced);
    }
    if (s.phase === 'live' && s.mill) {
      stepMill(s.mill, dt, {left, right}, s.reduced);
      if (s.mill.uniqueHit) awardIfHit(s);
      if (s.mill.drained) finishDrain(s);
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'Peggy stamps the book',
          itemName(PEGGY_CHAPTERS[s.level].prize) + ' — struck in the peg field.',
          {prize: PEGGY_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (type === 'down') {
      if (s.phase === 'idle' || s.phase === 'result' || s.phase === 'aim') {
        if (p.y < 320) {
          s.aim = clamp(p.x, 200, 700);
          s.holding = true;
        } else if (s.phase === 'idle' || s.phase === 'result') beginDrop(s);
        else if (p.x < 450) fireFlipper(s.mill || {}, 'left');
        else fireFlipper(s.mill || {}, 'right');
      } else if (s.phase === 'live') {
        if (p.x < 450) { s.left = true; if (s.mill) fireFlipper(s.mill, 'left'); }
        else { s.right = true; if (s.mill) fireFlipper(s.mill, 'right'); }
      }
    }
    if (type === 'move' && (s.phase === 'idle' || s.phase === 'aim' || s.holding)) {
      s.aim = clamp(p.x, 200, 700);
    }
    if (type === 'up' || type === 'cancel') {
      if (s.holding && (s.phase === 'idle' || s.phase === 'aim' || s.phase === 'result')) {
        s.holding = false;
        beginDrop(s);
      }
      s.left = false; s.right = false;
    }
  },
  action(s, id, down) {
    if (id === 'drop' && down !== false) {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.mill = null;
        s.note = 'Another marble when you are ready.';
        persist(s);
        return;
      }
      beginDrop(s);
    }
    if (id === 'left') {
      s.left = !!down;
      if (down && s.mill) fireFlipper(s.mill, 'left');
    }
    if (id === 'right') {
      s.right = !!down;
      if (down && s.mill) fireFlipper(s.mill, 'right');
    }
  },
  key(s, k, down) {
    if ((k === ' ' || k === 'Enter') && down) this.action(s, 'drop');
    if ((k === 'z' || k === 'Z') && down && s.mill) fireFlipper(s.mill, 'left');
    if ((k === 'x' || k === 'X') && down && s.mill) fireFlipper(s.mill, 'right');
  },
  draw(s, d) {
    const ch = PEGGY_CHAPTERS[s.level];
    const mill = s.mill;
    d.poly([[48, 16], [852, 16], [870, 1184], [30, 1184]], '#3a2a18ee', '#e6c57a', 4);
    d.text('Marble Mill', 450, 72, 28, '#fff3d0');
    d.text(ch.title, 450, 104, 18, '#d2b98c');
    if (!s.won) {
      d.item(spriteKey(ch.prize), 800, 88, {w: 58, fallback: () => d.star(800, 88, 18)});
      d.text('waiting', 800, 136, 12, '#ead6a4');
    }
    d.poly([[150, 170], [750, 170], [770, 1080], [130, 1080]], '#1e3a32cc', '#d7b56a', 3);
    d.line({x: 168, y: 220}, {x: 732, y: 220}, '#e6c57a', 6);
    d.text('rail', 450, 208, 12, '#ead6a4');
    if (mill) {
      for (const peg of mill.pegs) {
        if (peg.flash > 0) d.glow(peg.x, peg.y, 22, '#f0d49a');
        d.circle(peg.x, peg.y, peg.r, peg.flash > 0 ? '#f0d080' : '#cbb581', '#f0d6a0', 2);
      }
      if (mill.unique) {
        const u = mill.unique;
        if (u.flash > 0) d.glow(u.x, u.y, 56, '#f0d18f');
        d.circle(u.x, u.y, u.r + 4, u.hit ? '#2a242888' : '#6a3a28ee', '#f0d6a0', 3);
        const show = u.prize ? ch.prize : 'star-token';
        d.item(spriteKey(show), u.x, u.y, {
          w: u.hit ? 22 : 36, alpha: u.hit ? 0.35 : 1,
          fallback: () => d.star(u.x, u.y, 12, '#f4e2a8'),
        });
        d.text(u.prize ? 'unique' : 'ordinary', u.x, u.y + u.r + 14, 11, '#f0d6a8');
      }
      for (const f of mill.flippers) {
        const seg = flipperTips(f);
        d.line(seg.a, seg.b, Math.abs(f.w) > 2 ? '#f0d080' : '#e8b8c4', 12);
        d.circle(f.x, f.y, 9, '#9b8057', '#f0d4a0', 2);
      }
      if (mill.marble && mill.marble.live) {
        d.path(mill.marble.trail || [], '#e6e2cc66', 3);
        d.ball(mill.marble.x, mill.marble.y, mill.marble.r, '#e8d8b0');
      }
    }
    if (!mill?.marble?.live && s.phase !== 'live') {
      d.ball(s.aim, RAIL_Y + 18, 12, '#e8d8b0');
      d.text('↓', s.aim, RAIL_Y - 8, 18, '#fff6d8');
    }
    d.poly([[130, 1088], [770, 1088], [780, 1160], [120, 1160]], '#2a1c16ee', '#e6c57a', 2);
    d.text('open drain · no numbered bowls', 450, 1122, 14, '#ead6a4');
    wrapLine(d, s.note, 450, 1154, 16, '#f0d18f', 700);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 140, 72, 14, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    const hang = s.mill?.uniqueHit ? 'unique struck' : (s.mill?.unique?.prize ? 'unique hanging' : 'ordinary hang');
    return purse + ' · ' + hang + ' · ' + (s.phase) + ' · ' + s.note;
  },
};
