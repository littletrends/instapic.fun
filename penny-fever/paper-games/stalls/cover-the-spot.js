import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  DOT_CHAPTERS, makeDeal, stepDeal, chooseCover, hitCover, coverHidden,
  fakeId, coverRadius, coverLabel, resultNumber, isDotWin, ordinaryFor, spotCover,
} from '../vanishing-spot.js?v=first-prize-1';

const BOOK = 'pennyFever.vanishingSpot';
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
    phase: s.phase, seed: s.seed, charged: !!s.charged, deal: s.deal,
    won: !!s.won, note: s.note, resultN: s.resultN || 0, reduced: !!s.reduced,
  };
  writeBook(book);
}

function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function beginWatch(s) {
  if (s.phase === 'show' || s.phase === 'shuffle' || s.phase === 'pick' || s.phase === 'reveal') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('cover-the-spot', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 1 + s.level * 17;
    }
    s.deal = makeDeal(s.level, s.seed);
    s.phase = 'show';
    s.resultN = 0;
    s.prizeKept = false;
    s.reduced = reducedMotion();
    s.note = 'The gold spot lifts. Keep your eye on ' + coverLabel(s.deal.spotId) + '.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function pickCover(s, id) {
  if (s.phase !== 'pick' || !s.deal) return;
  chooseCover(s.deal, id);
  if (s.deal.phase !== 'reveal') return;
  s.phase = 'reveal';
  finishWatch(s);
}

function finishWatch(s) {
  const n = resultNumber(s.seed);
  s.resultN = n;
  s.phase = 'result';
  s.charged = false;
  const prize = DOT_CHAPTERS[s.level].prize;
  const hit = !!(s.deal && s.deal.correct);
  const win = hit && isDotWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'cover-the-spot');
    if (win) {
      keep(prize, 'cover-the-spot');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: CX, y: CY});
  s.hold = 1.2;
  if (!hit) {
    s.note = 'It was under ' + coverLabel(spotCover(s.deal)) + '. The spot slipped.';
  } else {
    s.note = win
      ? 'You kept the little one.'
      : 'Tracked true. An ordinary token this sitting.';
  }
  persist(s);
}

export default {
  title: 'Vanishing Spot',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  houseSeconds: 90,
  houseTitle: 'The covers went still',
  houseDetail: 'Dot gathers the tokens. Watch again when you are ready.',
  persist,
  intro: alleyPlay
    ? 'Dot’s vanishing spot. A gold dot hides under a cover, then the covers shuffle on fair tracks. Tap the cover that still holds it. A ticket sits you down; the first try of each chapter is included. Extra shuffles are a penny. The unique only drops on a true track and tonight’s numbers.'
    : 'Watch the gold spot. Track its cover. Workshop shuffles are free and write nothing.',
  instructions: alleyPlay
    ? 'Watch the lift. Follow the cover — paths may cross, climb, flash a false dot, or duck a curtain, but identities never teleport. Tap the right cover at the end. Another shuffle after the first is a penny.'
    : 'Watch, then tap the cover. Practice writes nothing.',
  levels: DOT_CHAPTERS.map(c => c.title),
  sprites: ['perfect-circle', 'pressed-flower-book', 'felt-moon-disc', 'spring-seed-packet', 'garden-party-book', 'charm-display-case', 'moon-penny', 'star-token', 'everyday-penny', 'rose-penny'],
  prizes: DOT_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'watch', label: 'Watch the spot · Space'},
    {id: 'again', label: alleyPlay ? 'Another shuffle · 1 penny' : 'Another shuffle'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 1) * 4099,
      deal: saved.deal || null, charged: !!saved.charged,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      resultN: saved.resultN || 0,
      note: saved.note || (DOT_CHAPTERS[level] || DOT_CHAPTERS[0]).title + '. Watch when you are ready.',
    };
    if ((s.phase === 'show' || s.phase === 'shuffle' || s.phase === 'pick') && !s.deal) {
      s.deal = makeDeal(level, s.seed);
    }
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if ((s.phase === 'show' || s.phase === 'shuffle') && s.deal) {
      stepDeal(s.deal, dt, s.reduced);
      if (s.deal.phase === 'shuffle' && s.phase === 'show') {
        s.phase = 'shuffle';
        s.note = 'Track it. Covers keep their names.';
        persist(s);
      }
      if (s.deal.phase === 'pick') {
        s.phase = 'pick';
        s.note = 'Tap the cover that hid the spot.';
        persist(s);
      }
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The little one stayed found',
          itemName(DOT_CHAPTERS[s.level].prize) + ' — kept from under the cover.',
          {prize: DOT_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (type !== 'down' || s.result) return;
    if (s.phase === 'idle' || s.phase === 'result') {
      beginWatch(s);
      return;
    }
    if (s.phase === 'pick' && s.deal) {
      const id = hitCover(s.deal, p.x, p.y);
      if (id >= 0) pickCover(s, id);
    }
  },
  action(s, id) {
    if (id === 'watch' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Watch again when you are ready.';
        persist(s);
        return;
      }
      beginWatch(s);
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (s.phase === 'pick' && k >= '1' && k <= '9') {
      pickCover(s, Number(k) - 1);
      return;
    }
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'idle' || s.phase === 'result') this.action(s, 'watch');
    }
  },
  draw(s, d) {
    const ch = DOT_CHAPTERS[s.level];
    const c = d.c;
    d.text('Vanishing Spot', 450, 118, 28, '#efe6d0');
    d.text(ch.title, 450, 154, 20, '#d2b98c');
    {
      const owned = s.won || chapterPaid(s.level);
      d.item(spriteKey(ch.prize), 800, 148, {w: 70, fallback: () => d.star(800, 148, 24)});
      d.text(owned ? 'Collected' : 'Locked', 800, 202, 14, owned ? '#c8e878' : '#ead6a4');
    }

    roundRect(c, 110, 250, 680, 640, 28);
    // The illustrated template supplies the surface; keep the gameplay outline.
    c.strokeStyle = '#e8c878';
    c.lineWidth = 5;
    c.stroke();

    for (let i = 0; i < 6; i++) {
      const x = 190 + (i % 3) * 210;
      const y = 330 + Math.floor(i / 3) * 118;
      d.circle(x, y, 34, '#3a2a22cc', '#c6a267', 2);
    }

    if (ch.curtain) {
      roundRect(c, 300, 280, 300, 300, 8);
      c.fillStyle = '#4a2038aa';
      c.fill();
      d.text('curtain', 450, 320, 14, '#ead6a4');
    }

    if (s.deal) {
      const r = coverRadius(s.deal.covers.length);
      const ordered = s.deal.covers.slice().sort((a, b) => (a.z || 0) - (b.z || 0));
      for (const cover of ordered) {
        const hidden = coverHidden(s.deal, cover.id, s.reduced);
        const y = cover.y - (cover.lift || 0);
        if (hidden) {
          d.circle(cover.x, y, r, '#24101888', '#6a4a38', 1);
          continue;
        }
        d.circle(cover.x + 6, y + 8, r, '#00000033');
        d.circle(cover.x, y, r, '#6a3a48ee', '#f0d18f', 3);
        d.circle(cover.x, y, r - 10, '#5a3040cc', '#ead6a4', 1);
        d.text(coverLabel(cover.id), cover.x, y + 8, 22, '#fff6d8');
        const showSpot = (s.deal.phase === 'show' && cover.id === s.deal.spotId)
          || (s.deal.phase === 'reveal' && cover.id === s.deal.spotId)
          || fakeId(s.deal) === cover.id;
        if (showSpot) {
          d.glow(cover.x, y + 18, 28, '#f4d590');
          d.circle(cover.x, y + 18, 10, '#f4d080', '#fff6d8', 2);
        }
      }
    } else {
      d.text('Watch', CX, CY + 40, 32, '#ead6a4');
    }

    wrapLine(d, s.note, 450, 960, 22, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1160, 16, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
