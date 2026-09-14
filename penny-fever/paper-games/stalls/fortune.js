import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  IRIS_CHAPTERS, makeGlobe, stepGlobe, brakeRing, nextLiveRing, allStopped, allMatch,
  caughtOf, fortuneFor, resultNumber, isIrisWin, ordinaryFor, symbolName, slotAt,
} from '../fortune-globe.js?v=catch-1';

const BOOK = 'pennyFever.fortuneCatcher';
const CX = 450, CY = 640;
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
    phase: s.phase, seed: s.seed, charged: !!s.charged, flashLeft: s.flashLeft,
    globe: s.globe, fortune: s.fortune, resultN: s.resultN || 0,
    won: !!s.won, note: s.note, reduced: !!s.reduced,
  };
  writeBook(book);
}

function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function beginGaze(s) {
  if (s.phase === 'flash' || s.phase === 'spin') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('fortune', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 1 + s.level * 17;
    }
    s.globe = makeGlobe(s.level, s.seed);
    s.phase = 'flash';
    s.flashLeft = s.globe.flashSecs;
    s.fortune = '';
    s.resultN = 0;
    s.prizeKept = false;
    s.reduced = reducedMotion();
    const names = s.globe.flash.map(symbolName).join(' · ');
    s.note = s.globe.hide
      ? 'Remember: ' + names
      : 'Catch: ' + names;
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function brake(s) {
  if (s.phase !== 'spin' || !s.globe) return;
  const i = nextLiveRing(s.globe);
  if (i < 0) return;
  brakeRing(s.globe, i);
  if (allStopped(s.globe)) finishGaze(s);
  else s.note = 'Ring ' + (i + 1) + ' holds. Brake the next.';
  persist(s);
}

function finishGaze(s) {
  const n = resultNumber(s.seed);
  s.resultN = n;
  const caught = caughtOf(s.globe);
  s.fortune = fortuneFor(caught);
  s.phase = 'result';
  s.charged = false;
  const prize = IRIS_CHAPTERS[s.level].prize;
  const hit = allMatch(s.globe);
  const win = hit && isIrisWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'fortune');
    if (win) {
      keep(prize, 'fortune');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: CX, y: CY});
  s.hold = 1.2;
  if (!hit) s.note = 'A near miss — ' + caught.map(symbolName).join(' · ') + '. ' + s.fortune;
  else s.note = s.fortune;
  persist(s);
}

export default {
  title: 'Catch the Fortune',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  intro: alleyPlay
    ? 'Iris’s fortune globe. It flashes a sign. Brake the rings so the remembered symbols sit in the reading window. A ticket sits you down; the first try of each chapter is included. Extra gazes are a penny. The unique only drops on a true catch and tonight’s numbers.'
    : 'The globe flashes. Brake each ring. Workshop gazes are free and write nothing.',
  instructions: alleyPlay
    ? 'Watch the flash. Tap the globe (or Space) to brake the live ring. Rings stop in order. A miss is still a fortune. Another gaze after the first is a penny.'
    : 'Watch, then tap to brake. Practice writes nothing.',
  levels: IRIS_CHAPTERS.map(c => c.title),
  sprites: ['fortune-slip', 'moon-lantern', 'moon-brooch', 'fortune-journal', 'moon-festival-fan', 'paper-crown', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: IRIS_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'gaze', label: 'Gaze · Space'},
    {id: 'brake', label: 'Brake the ring'},
    {id: 'again', label: alleyPlay ? 'Another gaze · 1 penny' : 'Another gaze'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 1) * 4099,
      globe: saved.globe || null, flashLeft: saved.flashLeft || 0,
      charged: !!saved.charged, fortune: saved.fortune || '', resultN: saved.resultN || 0,
      won: !!saved.won || chapterPaid(level), hold: 0, hidden: false, reduced: !!saved.reduced,
      note: saved.note || (IRIS_CHAPTERS[level] || IRIS_CHAPTERS[0]).title + '. Gaze when you are ready.',
    };
    if (s.phase === 'flash' || s.phase === 'spin') {
      if (!s.globe) s.globe = makeGlobe(level, s.seed);
    }
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (s.phase === 'flash') {
      s.flashLeft -= dt;
      if (s.flashLeft <= 0) {
        s.phase = 'spin';
        s.note = 'Brake the rings. Tap the globe.';
        persist(s);
      }
    }
    if (s.phase === 'spin' && s.globe) stepGlobe(s.globe, dt, s.reduced);
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'Iris caught a fortune',
          itemName(IRIS_CHAPTERS[s.level].prize) + ' — ' + s.fortune,
          {prize: IRIS_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (type !== 'down' || s.result) return;
    const inGlobe = Math.hypot(p.x - CX, p.y - CY) <= 230;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (inGlobe) beginGaze(s);
      return;
    }
    if (s.phase === 'spin' && inGlobe) brake(s);
  },
  action(s, id) {
    if (id === 'gaze' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Gaze again when you are ready.';
        persist(s);
        return;
      }
      beginGaze(s);
    }
    if (id === 'brake') brake(s);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'spin') brake(s);
      else this.action(s, 'gaze');
    }
  },
  draw(s, d) {
    const ch = IRIS_CHAPTERS[s.level];
    const c = d.c;
    d.text('Catch the Fortune', 450, 118, 28, '#efe6d0');
    d.text(ch.title, 450, 154, 20, '#d2b98c');
    if (!s.won) {
      d.item(spriteKey(ch.prize), 800, 148, {w: 70, fallback: () => d.star(800, 148, 24)});
      d.text('waiting', 800, 202, 14, '#ead6a4');
    }

    c.beginPath();
    c.arc(CX, CY, 228, 0, TAU);
    c.fillStyle = '#2a1838ee';
    c.fill();
    c.strokeStyle = '#e8c878';
    c.lineWidth = 6;
    c.stroke();
    c.beginPath();
    c.arc(CX, CY, 214, 0, TAU);
    c.strokeStyle = '#c6a267';
    c.lineWidth = 2;
    c.stroke();

    roundRect(c, CX - 54, CY - 236, 108, 36, 8);
    c.fillStyle = '#f0d18fcc';
    c.fill();
    d.text('window', CX, CY - 212, 14, '#3a2a18');

    const showFlash = s.phase === 'flash' || (s.phase === 'spin' && s.globe && !s.globe.hide);
    if (s.globe && showFlash) {
      const names = s.globe.flash.map(symbolName);
      names.forEach((name, i) => {
        d.text(name, CX, CY - 40 + i * 36, 28, '#fff6d8');
      });
    } else if (s.phase === 'idle') {
      d.text('Gaze', CX, CY, 32, '#ead6a4');
    }

    if (s.globe && (s.phase === 'spin' || s.phase === 'result' || s.phase === 'flash')) {
      s.globe.rings.forEach((ring, r) => {
        const rad = 168 - r * 46;
        c.beginPath();
        c.arc(CX, CY, rad, 0, TAU);
        c.strokeStyle = ring.stopped ? '#c8e878' : '#e8c878';
        c.lineWidth = ring.stopped ? 5 : 3;
        c.stroke();
        ring.glyphs.forEach((id, i) => {
          const a = ring.angle + (i / ring.n) * TAU - Math.PI / 2;
          const x = CX + Math.cos(a) * rad;
          const y = CY + Math.sin(a) * rad;
          const inWindow = slotAt(ring.angle, ring.n) === i;
          d.text(symbolName(id).slice(0, 4), x, y + 6, inWindow ? 16 : 13, inWindow ? '#fff6d8' : '#cbb890');
        });
      });
    }

    wrapLine(d, s.note, 450, 920, 22, '#f0d18f', 720);
    if (s.phase === 'result' && s.fortune) wrapLine(d, s.fortune, 450, 1020, 20, '#fff6d8', 700);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1160, 16, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
