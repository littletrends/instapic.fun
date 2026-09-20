import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  MILO_CHAPTERS, makeReel, stepReel, brakeReel, restartSpin, isUniqueStop, windowFrame,
  frameKind, ordinarySprite, resultNumber, isMiloWin, ordinaryFor,
} from '../flicker-reel.js?v=first-prize-1';

const BOOK = 'pennyFever.flickerReel';
const CX = 450, CY = 620;
const TAU = Math.PI * 2;

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
    phase: s.phase, seed: s.seed, charged: !!s.charged, reel: s.reel,
    won: !!s.won, note: s.note, resultN: s.resultN || 0, hit: !!s.hit,
    reduced: !!s.reduced,
  };
  writeBook(book);
}

function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function paintCard(d, reel, frame, x, y, w, prize) {
  const kind = frameKind(reel, frame);
  if (kind === 'unique') {
    d.item(spriteKey(prize), x, y, {w, fallback: () => d.star(x, y, w * 0.32)});
    return;
  }
  if (kind === 'blank') {
    d.circle(x, y, w * 0.38, '#1a1410', '#6a5a48', 1);
    return;
  }
  if (kind === 'decoy') {
    d.star(x, y, w * 0.28, '#c4b090');
    return;
  }
  d.item(spriteKey(ordinarySprite(frame)), x, y, {
    w: w * 0.82,
    fallback: () => d.circle(x, y, w * 0.3, '#8a6a48'),
  });
}

function beginCrank(s) {
  if (s.phase === 'spin' || s.phase === 'brake') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('mutoscope', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 1 + s.level * 19;
    }
    s.reel = makeReel(s.level, s.seed);
    s.phase = 'spin';
    s.resultN = 0;
    s.hit = false;
    s.prizeKept = false;
    s.reduced = reducedMotion();
    s.note = 'The unique picture is on the reel. Brake when it sits in the window.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function pullBrake(s) {
  if (s.phase !== 'spin' || !s.reel) return;
  if (!brakeReel(s.reel)) return;
  s.phase = 'brake';
  s.note = 'The lever holds. The cards slow.';
  persist(s);
}

function finishReel(s, hit) {
  const n = resultNumber(s.seed);
  s.resultN = n;
  s.hit = !!hit;
  s.phase = 'result';
  s.charged = false;
  const prize = MILO_CHAPTERS[s.level].prize;
  const win = hit && isMiloWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'mutoscope');
    if (win) {
      keep(prize, 'mutoscope');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: CX, y: CY});
  s.hold = 1.2;
  if (!hit) s.note = 'A still card. The unique picture ran on.';
  else s.note = win ? 'The picture locks. The unique drops.' : 'Locked on the picture — an ordinary print this sitting.';
  persist(s);
}

function resolveStop(s) {
  if (isUniqueStop(s.reel)) {
    finishReel(s, true);
    return;
  }
  if (restartSpin(s.reel)) {
    s.phase = 'spin';
    s.note = 'A miss. Same sitting — the reel runs faster.';
    persist(s);
    return;
  }
  finishReel(s, false);
}

export default {
  title: 'Flicker Reel',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  houseSeconds: 90,
  houseTitle: 'The reel ran out',
  houseDetail: 'Milo winds a fresh picture. Brake again when you are ready.',
  persist,
  intro: alleyPlay
    ? 'Milo’s flicker reel. One of a hundred hidden frames carries the unique. Crank, watch the window, brake when the prize sits in it. A ticket sits you down; the first try of each chapter is included. Extra sittings are a penny. Up to three brakes in one sitting, each faster. The unique only drops on a true stop and tonight’s numbers.'
    : 'Crank the reel. Brake on the unique picture. Workshop cranks are free and write nothing.',
  instructions: alleyPlay
    ? 'Tap the viewer or Crank to start. Tap again (or Brake / Space) to stop. The lever slows before it locks. Misses restart faster without another penny.'
    : 'Crank, then brake. Practice writes nothing.',
  levels: MILO_CHAPTERS.map(c => c.title),
  sprites: ['flicker-book', 'pocket-peepshow', 'memory-scrapbook', 'moonlight-wardrobe', 'dapper-fox', 'pocket-theatre', 'moon-rabbit', 'singing-bird', 'moon-lantern', 'trade-envelope', 'cabinet-key', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: MILO_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'crank', label: 'Crank the reel · Space'},
    {id: 'brake', label: 'Brake'},
    {id: 'again', label: alleyPlay ? 'Another reel · 1 penny' : 'Another reel'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 1) * 5113,
      reel: saved.reel || null, charged: !!saved.charged,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      resultN: saved.resultN || 0, hit: !!saved.hit,
      note: saved.note || (MILO_CHAPTERS[level] || MILO_CHAPTERS[0]).title + '. Crank when you are ready.',
    };
    if ((s.phase === 'spin' || s.phase === 'brake') && !s.reel) s.reel = makeReel(level, s.seed);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if ((s.phase === 'spin' || s.phase === 'brake') && s.reel) {
      stepReel(s.reel, dt, s.reduced);
      if (s.reel.stopped) resolveStop(s);
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The picture locked',
          itemName(MILO_CHAPTERS[s.level].prize) + ' drops from the reel.',
          {prize: MILO_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (type !== 'down' || s.result) return;
    const inView = Math.hypot(p.x - CX, p.y - CY) <= 240;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (inView || p.y > 900) beginCrank(s);
      return;
    }
    if (s.phase === 'spin' && (inView || p.y > 980)) pullBrake(s);
  },
  action(s, id) {
    if (id === 'crank' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Crank again when you are ready.';
        persist(s);
        return;
      }
      beginCrank(s);
    }
    if (id === 'brake') pullBrake(s);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'spin') pullBrake(s);
      else this.action(s, 'crank');
    }
  },
  draw(s, d) {
    const ch = MILO_CHAPTERS[s.level];
    const c = d.c;
    d.text('Flicker Reel', 450, 118, 28, '#efe6d0');
    d.text(ch.title, 450, 154, 20, '#d2b98c');
    {
      const owned = s.won || chapterPaid(s.level);
      d.item(spriteKey(ch.prize), 800, 148, {w: 70, fallback: () => d.star(800, 148, 24)});
      d.text(owned ? 'Collected' : 'Locked', 800, 202, 14, owned ? '#c8e878' : '#ead6a4');
    }

    c.beginPath();
    c.arc(CX, CY, 228, 0, TAU);
    // The illustrated template supplies the surface; keep the gameplay outline.
    c.strokeStyle = '#e8c878';
    c.lineWidth = 6;
    c.stroke();

    roundRect(c, CX - 70, CY - 248, 140, 40, 8);
    c.fillStyle = '#f0d18fcc';
    c.fill();
    d.text('window', CX, CY - 222, 14, '#3a2a18');

    if (s.reel && (s.phase === 'spin' || s.phase === 'brake' || s.phase === 'result')) {
      const now = windowFrame(s.reel);
      paintCard(d, s.reel, now, CX, CY, 120, ch.prize);
      if (s.reel.dir < 0) d.text('reverse', CX, CY + 86, 14, '#f0d18f');
      for (let k = -4; k <= 4; k++) {
        if (!k) continue;
        let f = now + k;
        if (f > 100) f -= 100;
        if (f < 1) f += 100;
        const a = -Math.PI / 2 + k * 0.22;
        const rad = 176;
        paintCard(d, s.reel, f, CX + Math.cos(a) * rad, CY + Math.sin(a) * rad, 36, ch.prize);
      }
    } else {
      d.text('Crank', CX, CY, 32, '#ead6a4');
      d.item(spriteKey(ch.prize), CX, CY + 70, {w: 54, fallback: () => d.star(CX, CY + 70, 18)});
    }

    wrapLine(d, s.note, 450, 940, 22, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1160, 16, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
