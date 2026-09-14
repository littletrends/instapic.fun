import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  FLOSSIE_CHAPTERS, makeCyclone, stepCyclone, turnStick, recipeDone,
  resultNumber, isFlossieWin, ordinaryFor, sugarName, SUGAR, BOWL_R,
} from '../sugar-cyclone.js?v=cloud-1';

const BOOK = 'pennyFever.sugarCyclone';
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
    phase: s.phase, seed: s.seed, charged: !!s.charged, bowl: s.bowl,
    won: !!s.won, note: s.note, resultN: s.resultN || 0, reduced: !!s.reduced,
  };
  writeBook(book);
}
function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function beginSpin(s) {
  if (s.phase === 'spin') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('fairy-floss', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 1 + s.level * 17;
    }
    s.bowl = makeCyclone(s.level, s.seed);
    s.phase = 'spin';
    s.resultN = 0;
    s.prizeKept = false;
    s.reduced = reducedMotion();
    s.note = 'Wind ' + sugarName(s.bowl.recipe[0]) + ' onto the stick. Do not tangle.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function finishBowl(s, ok) {
  s.phase = 'result';
  s.charged = false;
  if (!ok) {
    s.hold = 0.8;
    s.note = s.bowl?.failed === 'heat'
      ? 'The heat ran out. The cloud collapsed.'
      : 'The floss tangled. The cloud is lost.';
    persist(s);
    return;
  }
  const n = resultNumber(s.seed);
  s.resultN = n;
  const prize = FLOSSIE_CHAPTERS[s.level].prize;
  const win = isFlossieWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'fairy-floss');
    if (win) {
      keep(prize, 'fairy-floss');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: CX, y: CY});
  s.hold = 1.2;
  s.note = win
    ? 'The finished cloud parts. Something was sealed inside.'
    : 'A finished cloud — an ordinary sweet this sitting.';
  persist(s);
}

export default {
  title: 'Sugar Cyclone',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  intro: alleyPlay
    ? 'Flossie’s spinning bowl. Steer the stick, wind the recipe in order, and keep the growing cloud from tangling. A ticket sits you down; the first try of each chapter is included. Extra clouds are a penny. The unique is sealed inside a finished cloud.'
    : 'Steer the stick. Wind the recipe. Workshop clouds are free and write nothing.',
  instructions: alleyPlay
    ? 'Swipe or tap Left/Right to curve the stick. Collect the marked strand. One sitting, one charge.'
    : 'Curve the stick. Practice writes nothing.',
  levels: FLOSSIE_CHAPTERS.map(c => c.title),
  sprites: ['fairy-floss', 'pocket-cloud', 'cloud-jar', 'toffee-apple', 'swirl-lolly', 'birthday-crown-box', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: FLOSSIE_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'spin', label: 'Spin · Space'},
    {id: 'left', label: 'Turn left'},
    {id: 'right', label: 'Turn right'},
    {id: 'again', label: alleyPlay ? 'Another cloud · 1 penny' : 'Another cloud'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 1) * 4111,
      bowl: saved.bowl || null, charged: !!saved.charged,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      resultN: saved.resultN || 0,
      note: saved.note || (FLOSSIE_CHAPTERS[level] || FLOSSIE_CHAPTERS[0]).title + '. Spin when you are ready.',
    };
    if (s.phase === 'spin' && !s.bowl) s.bowl = makeCyclone(level, s.seed);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (s.phase === 'spin' && s.bowl) {
      stepCyclone(s.bowl, dt, s.reduced);
      const need = s.bowl.recipe[s.bowl.wound];
      if (need) s.note = 'Next: ' + sugarName(need) + '  ·  ' + s.bowl.wound + '/' + s.bowl.recipe.length;
      if (recipeDone(s.bowl) || s.bowl.done) finishBowl(s, true);
      else if (s.bowl.failed) finishBowl(s, false);
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'A cloud worth keeping',
          itemName(FLOSSIE_CHAPTERS[s.level].prize) + ' was sealed in the finished cloud.',
          {prize: FLOSSIE_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (type === 'down') beginSpin(s);
      return;
    }
    if (s.phase !== 'spin' || !s.bowl) return;
    if (type === 'down') s.px = p.x;
    if (type === 'move' && s.px != null) {
      turnStick(s.bowl, p.x < s.px ? -1 : 1);
      s.px = p.x;
    }
    if (type === 'up' || type === 'cancel') s.px = null;
  },
  action(s, id) {
    if (id === 'spin' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Spin again when you are ready.';
        persist(s);
        return;
      }
      beginSpin(s);
    }
    if (id === 'left' && s.bowl) turnStick(s.bowl, -1);
    if (id === 'right' && s.bowl) turnStick(s.bowl, 1);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === 'ArrowLeft' || k === 'a') this.action(s, 'left');
    if (k === 'ArrowRight' || k === 'd') this.action(s, 'right');
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'spin') return;
      this.action(s, 'spin');
    }
  },
  draw(s, d) {
    const ch = FLOSSIE_CHAPTERS[s.level];
    const c = d.c;
    d.text('Sugar Cyclone', 450, 118, 28, '#efe6d0');
    d.text(ch.title, 450, 154, 20, '#d2b98c');
    if (!s.won) {
      d.item(spriteKey(ch.prize), 800, 148, {w: 70, fallback: () => d.star(800, 148, 24)});
      d.text('in the cloud', 800, 202, 14, '#ead6a4');
    }
    c.beginPath();
    c.arc(CX, CY, BOWL_R + 18, 0, Math.PI * 2);
    c.fillStyle = '#3a1830ee';
    c.fill();
    c.strokeStyle = '#e8c878';
    c.lineWidth = 6;
    c.stroke();
    c.beginPath();
    c.arc(CX, CY, BOWL_R, 0, Math.PI * 2);
    c.fillStyle = '#f4d0dc22';
    c.fill();
    if (s.bowl) {
      const ribbon = s.bowl.recipe.map((id, i) => {
        const mark = SUGAR[id]?.mark || '•';
        return i === s.bowl.wound ? '[' + mark + ']' : mark;
      }).join('  ');
      d.text(ribbon, 450, 250, 22, '#fff6d8');
      if (s.bowl.trail.length > 1) {
        c.beginPath();
        s.bowl.trail.forEach((p, i) => {
          const x = CX + p.x, y = CY + p.y;
          if (i) c.lineTo(x, y); else c.moveTo(x, y);
        });
        c.strokeStyle = '#f0c0d0';
        c.lineWidth = 10;
        c.stroke();
      }
      s.bowl.wisps.forEach(w => {
        if (w.taken) return;
        const col = SUGAR[w.kind]?.color || '#eee';
        d.circle(CX + w.x, CY + w.y, 14, col, '#fff6d8', 2);
        d.text(w.mark, CX + w.x, CY + w.y + 5, 14, '#3a1830');
      });
      d.circle(CX + s.bowl.x, CY + s.bowl.y, 11, '#efe6d0', '#c6a267', 2);
      const heat = Math.max(0, s.bowl.heatLeft / s.bowl.heatMax);
      roundRect(c, 200, 860, 500 * heat, 14, 6);
      c.fillStyle = heat < 0.25 ? '#c45a6a' : '#e8c878';
      c.fill();
    } else {
      d.text('Spin', CX, CY, 32, '#ead6a4');
    }
    wrapLine(d, s.note, 450, 920, 22, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1160, 16, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
