import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  MAGNUS_CHAPTERS, STRIKES, BASE_Y, PLATE_X, PLATE_HALF,
  calledForStrike, sweetAt, resistAt, resolveStrike,
  resultNumber, magnusUnique, ordinaryFor,
} from '../perfect-strike.js?v=first-prize-1';

const BOOK = 'pennyFever.perfectStrike';
const PIVOT = {x: 450, y: 1008};

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
    phase: s.phase === 'rise' || s.phase === 'pull' ? 'play' : s.phase,
    seed: s.seed, charged: !!s.charged, strikesLeft: s.strikesLeft,
    index: s.index, acc: s.acc, correctHits: s.correctHits,
    puckY: s.puckY, won: !!s.won, note: s.note, resultN: s.resultN || 0,
    reduced: !!s.reduced, t: s.t,
  };
  writeBook(book);
}

function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function callNote(s) {
  const ch = MAGNUS_CHAPTERS[s.level];
  const id = calledForStrike(s.level, s.seed, s.index);
  const bell = ch.bells.find(b => b.id === id);
  const name = bell ? bell.label : id;
  if (ch.peal) return 'Peal ' + (s.index + 1) + ': ring ' + name + '.';
  return 'Magnus calls ' + name + '.';
}

function beginSit(s) {
  if (s.phase === 'play' || s.phase === 'pull' || s.phase === 'rise') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('high-striker', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 1 + s.level * 19;
    }
    s.phase = 'play';
    s.strikesLeft = STRIKES;
    s.index = 0;
    s.acc = 0;
    s.correctHits = 0;
    s.pull = 0;
    s.holding = false;
    s.drag = false;
    s.contactX = PLATE_X;
    s.puckY = BASE_Y - 40;
    s.targetY = s.puckY;
    s.flash = 0;
    s.lastRang = null;
    s.resultN = 0;
    s.prizeKept = false;
    s.reduced = reducedMotion();
    s.note = callNote(s) + ' Three strikes. Aim. Time. Ring the called bell.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function strikeNow(s) {
  if (s.phase !== 'play' && s.phase !== 'pull') return;
  if (s.strikesLeft <= 0) return;
  const hit = resolveStrike({
    level: s.level, seed: s.seed, pull: s.pull, contactX: s.contactX,
    t: s.t, index: s.index, acc: s.acc, reduced: s.reduced,
  });
  s.holding = false;
  s.drag = false;
  s.phase = 'play';
  if (hit.cancelled) {
    s.pull = 0;
    s.note = 'A longer pull — ease back to cancel.';
    return;
  }
  s.strikesLeft -= 1;
  s.last = hit;
  s.acc = MAGNUS_CHAPTERS[s.level].add && !hit.overshoot ? hit.lift : 0;
  s.targetY = hit.puckY;
  s.phase = 'rise';
  s.rise = 0;
  s.flash = 0;
  if (hit.correct) s.correctHits += 1;
  s.lastRang = hit.rang;
  if (hit.correct) s.note = 'The called bell rings.';
  else if (hit.overshoot) s.note = 'Too much. It flew past.';
  else if (hit.undershoot) s.note = 'Too little. Short of the bronze.';
  else if (hit.rang) s.note = 'Wrong bell. Magnus wanted the called mouth.';
  else s.note = 'Between the mouths.';
  persist(s);
}

function afterStrike(s) {
  s.phase = 'play';
  s.pull = 0;
  s.index += 1;
  if (!MAGNUS_CHAPTERS[s.level].add || s.last?.overshoot) {
    s.puckY = BASE_Y - 40;
    s.targetY = s.puckY;
  } else {
    s.puckY = s.targetY;
  }
  const n = resultNumber(s.seed);
  if (magnusUnique(s.level, n, s.correctHits) && !chapterPaid(s.level) && !s.won) {
    finishSit(s);
    return;
  }
  if (s.strikesLeft <= 0) {
    finishSit(s);
    return;
  }
  s.note = callNote(s) + ' ' + s.strikesLeft + ' left.';
  persist(s);
}

function finishSit(s) {
  const n = resultNumber(s.seed);
  s.resultN = n;
  s.phase = 'result';
  s.charged = false;
  const prize = MAGNUS_CHAPTERS[s.level].prize;
  const win = magnusUnique(s.level, n, s.correctHits) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'high-striker');
    if (win) {
      keep(prize, 'high-striker');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  const called = MAGNUS_CHAPTERS[s.level].bells.find(b => b.id === calledForStrike(s.level, s.seed, Math.max(0, s.index - 1)))
    || MAGNUS_CHAPTERS[s.level].bells[0];
  if (win) takePrize(s, prize, {x: 560, y: called.y});
  s.hold = 1.2;
  s.note = s.correctHits
    ? 'Called bell rang ' + s.correctHits + (s.correctHits === 1 ? ' time.' : ' times.')
    : 'The called bell stayed quiet.';
  persist(s);
}

export default {
  title: 'Perfect Strike',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  intro: alleyPlay
    ? 'Magnus’s Perfect Strike. Hard isn’t enough. Ring it right. A penny buys three strikes. Pull, time the sweet spot, and hit the called bell. The unique only drops on a true ring and tonight’s numbers.'
    : 'Hard isn’t enough. Ring it right. Pull, time the plate, ring the called bell. Workshop strikes are free and write nothing.',
  instructions: alleyPlay
    ? 'Sit for a penny — three strikes. Pull the hammer (or hold Pull). Release on the sweet spot. Too little falls short; too much flies past.'
    : 'Pull and release. Practice writes nothing.',
  levels: MAGNUS_CHAPTERS.map(c => c.title),
  sprites: ['mighty-mallet', 'bell-bracelet', 'bell-of-bravery', 'perfect-play-medal', 'midway-master-crown', 'foundry-spark', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: MAGNUS_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'sit', label: alleyPlay ? 'Sit · 1 penny' : 'Sit down'},
    {id: 'pull', label: 'Hold to pull', hold: true},
    {id: 'again', label: alleyPlay ? 'Another sitting · 1 penny' : 'Another sitting'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 2) * 2711,
      charged: !!saved.charged, strikesLeft: saved.strikesLeft ?? STRIKES,
      index: saved.index || 0, acc: saved.acc || 0, correctHits: saved.correctHits || 0,
      puckY: saved.puckY || BASE_Y - 40, targetY: saved.puckY || BASE_Y - 40,
      pull: 0, holding: false, drag: false, contactX: PLATE_X,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      note: saved.note || (MAGNUS_CHAPTERS[level] || MAGNUS_CHAPTERS[0]).title + '. Sit when you are ready.',
      resultN: saved.resultN || 0, rise: 0, flash: 0, last: null, lastRang: null,
    };
    if (s.phase === 'pull' || s.phase === 'rise') s.phase = 'play';
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    const holdBtn = !!(input?.actions && input.actions.has('pull'));
    if ((s.phase === 'play' || s.phase === 'pull') && (s.holding || holdBtn) && !s.drag) {
      s.phase = 'pull';
      s.pull = Math.min(1, s.pull + dt * 0.7);
      s.holding = true;
    }
    if (s.phase === 'rise') {
      s.rise += dt;
      const u = Math.min(1, s.rise / 0.42);
      const e = u * u * (3 - 2 * u);
      s.puckY = (BASE_Y - 40) * (1 - e) + s.targetY * e;
      if (s.last?.correct) s.flash = 1;
      if (s.rise > 0.55) afterStrike(s);
    }
    s.flash = Math.max(0, s.flash - dt);
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'Hard was not enough. It rang right.',
          itemName(MAGNUS_CHAPTERS[s.level].prize) + ' — ' + s.note,
          {prize: MAGNUS_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (type === 'down') beginSit(s);
      return;
    }
    if (s.phase === 'rise') return;
    if (type === 'cancel') {
      s.drag = false;
      s.holding = false;
      s.pull = 0;
      s.phase = 'play';
      return;
    }
    if (type === 'down' && p.y > 780) {
      s.drag = true;
      s.phase = 'pull';
      s.contactX = Math.max(PLATE_X - PLATE_HALF, Math.min(PLATE_X + PLATE_HALF, p.x));
      const back = Math.max(0, p.y - PIVOT.y);
      s.pull = Math.min(1, back / 160);
    }
    if (type === 'move' && s.drag) {
      s.contactX = Math.max(PLATE_X - PLATE_HALF, Math.min(PLATE_X + PLATE_HALF, p.x));
      const back = Math.max(0, p.y - (PIVOT.y - 20));
      s.pull = Math.min(1, back / 170);
    }
    if (type === 'up' && s.drag) {
      s.drag = false;
      strikeNow(s);
    }
  },
  action(s, id, pressed) {
    if (id === 'sit' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Sit again when you are ready.';
        persist(s);
        return;
      }
      if (pressed !== false) beginSit(s);
    }
    if (id === 'pull') {
      if (s.phase === 'idle' || s.phase === 'result' || s.phase === 'rise') return;
      if (pressed) {
        s.holding = true;
        s.phase = 'pull';
      } else if (s.holding) {
        s.holding = false;
        strikeNow(s);
      }
    }
  },
  key(s, k, down) {
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'idle' || s.phase === 'result') {
        if (down) this.action(s, 'sit', true);
        return;
      }
      if (down && (s.phase === 'play' || s.phase === 'pull')) {
        s.holding = true;
        s.phase = 'pull';
      }
      if (!down && s.holding) {
        s.holding = false;
        strikeNow(s);
      }
    }
  },
  draw(s, d) {
    const ch = MAGNUS_CHAPTERS[s.level];
    const c = d.c;
    d.text('Perfect Strike', 450, 108, 28, '#efe6d0');
    d.text('Hard Isn\'t Enough. Ring It Right.', 450, 140, 16, '#d2b98c');
    d.text(ch.title, 450, 168, 18, '#ead6a4');
    {
      const owned = s.won || chapterPaid(s.level);
      d.item(spriteKey(ch.prize), 800, 148, {w: 66, fallback: () => d.star(800, 148, 22)});
      d.text(owned ? 'Collected' : 'Locked', 800, 202, 14, owned ? '#c8e878' : '#ead6a4');
    }

    const crooked = s.level === 2;
    const mastX = crooked ? 430 : 385;
    d.poly([[mastX - 18, 240], [mastX + 18, 240], [mastX + 22, BASE_Y], [mastX - 22, BASE_Y]], '#6a4530', '#e8c878', 3);
    d.line({x: mastX, y: 250}, {x: mastX, y: BASE_Y - 8}, '#e4c68e', 4);

    const called = calledForStrike(s.level, s.seed, s.index);
    for (const bell of ch.bells) {
      const lit = bell.id === called;
      const rung = s.lastRang === bell.id && s.flash > 0;
      d.line({x: mastX + 12, y: bell.y - 20}, {x: mastX + 108, y: bell.y - 20}, '#967144', 4);
      if (lit) d.glow(mastX + 108, bell.y, 48, '#e9c67e');
      d.item(spriteKey('bell-of-bravery'), mastX + 108, bell.y, {
        w: rung ? 58 : lit ? 52 : 42, alpha: lit ? 1 : 0.62,
        fallback: () => {
          d.poly([[mastX + 84, bell.y + 12], [mastX + 92, bell.y - 22], [mastX + 108, bell.y - 34], [mastX + 124, bell.y - 22], [mastX + 132, bell.y + 12]],
            lit ? '#f1d18c' : '#b79358', '#eac88a', 3);
        },
      });
      d.text(bell.label, mastX + 168, bell.y + 4, 14, lit ? '#fff6d8' : '#cbb890');
      if (lit && !s.won) {
        d.item(spriteKey(ch.prize), mastX + 210, bell.y, {w: 36, fallback: () => d.star(mastX + 210, bell.y, 12)});
      }
    }

    if (s.level === 3) {
      roundRect(c, 70, 320, 28, 420, 8);
      c.fillStyle = '#3a2a18ee';
      c.fill();
      const h = 40 + s.acc * 360;
      roundRect(c, 74, 732 - h, 20, h, 6);
      c.fillStyle = '#e8c878cc';
      c.fill();
      d.text('lift', 84, 760, 12, '#ead6a4');
    }
    if (s.level === 4) {
      const r = resistAt(s.level, s.index);
      d.line({x: 120, y: 280}, {x: 120, y: 520}, '#c6a267', 4);
      d.circle(120, 300 + (1.3 - r) * 160, 22, '#8a6a3a', '#e8c878', 3);
      d.text('weight', 120, 560, 13, '#ead6a4');
    }

    d.ball(mastX, s.puckY, 16, '#b7b4a5');

    const sweet = sweetAt(s.level, s.t, s.reduced);
    const plateY = 1000;
    const skew = crooked ? 28 : 0;
    d.poly([[PLATE_X - PLATE_HALF, plateY + 18], [PLATE_X + PLATE_HALF, plateY + 18], [PLATE_X + PLATE_HALF - skew, plateY - 10], [PLATE_X - PLATE_HALF + skew, plateY - 10]], '#8a6a3a', '#e8c878', 3);
    d.ellipse(sweet, plateY, 22, 10, '#f0d18fcc', '#fff6d8', 2);
    d.text('sweet', sweet, plateY - 22, 13, '#fff6d8');

    const angle = -0.18 - s.pull * 1.15;
    const head = {x: PIVOT.x + Math.cos(angle) * 170, y: PIVOT.y + Math.sin(angle) * 170};
    d.line(PIVOT, head, '#775336', 14);
    d.item(spriteKey('mighty-mallet'), head.x, head.y, {
      w: 88, angle: angle + Math.PI / 2,
      fallback: () => {
        c.save(); c.translate(head.x, head.y); c.rotate(angle + Math.PI / 2);
        d.poly([[-36, -20], [36, -20], [36, 20], [-36, 20]], '#a7784c', '#e0bc83', 3);
        c.restore();
      },
    });

    for (let i = 0; i < STRIKES; i++) {
      d.circle(330 + i * 36, 210, 9, i < s.strikesLeft ? '#e8c878' : '#3a2a18aa', '#c6a267', 1);
    }

    wrapLine(d, s.note, 450, 1124, 20, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1180, 16, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
