import {clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  PENELOPE_CHAPTERS, makeTable, startPitch, tugCloth, stepCoin, markedBowl,
  resultNumber, isPenelopeWin, ordinaryFor, layoutBowls,
} from '../dish-garden.js?v=penelope-1';

const BOOK = 'pennyFever.dishGarden';

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
    phase: s.phase, seed: s.seed, charged: !!s.charged, coinsLeft: s.coinsLeft,
    table: s.table, placeX: s.placeX, angle: s.angle, power: s.power,
    won: !!s.won, note: s.note, resultN: s.resultN || 0, markedHit: !!s.markedHit,
    reduced: !!s.reduced,
  };
  writeBook(book);
}
function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function beginSitting(s) {
  if (s.phase === 'fly' || s.phase === 'aim') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('penny-pitch', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 1 + s.level * 19;
    }
    s.table = makeTable(s.level, s.seed);
    layoutBowls(s.table, 0, false);
    s.coinsLeft = s.table.coins;
    s.phase = 'aim';
    s.markedHit = false;
    s.resultN = 0;
    s.prizeKept = false;
    s.reduced = reducedMotion();
    s.placeX = clamp(450, s.table.placeMin, s.table.placeMax);
    s.angle = 0;
    s.power = 280;
    s.note = s.table.needTug
      ? 'Three coins. Pitch, then tug the cloth once while the coin flies. The far wishing bowl is the mark.'
      : 'Three coins. Pitch, then one cloth tug while it flies. Land in the marked wishing bowl.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function pitch(s) {
  if (s.phase !== 'aim' || !s.table || s.table.coin) return;
  if (s.coinsLeft <= 0) return;
  startPitch(s.table, s.placeX, s.angle, s.power);
  s.phase = 'fly';
  s.note = s.table.tugLeft ? 'One tug left or right while it flies.' : 'The coin is in the air.';
  persist(s);
}

function tug(s, dir) {
  if (s.phase !== 'fly' || !s.table) return;
  if (tugCloth(s.table, dir)) {
    s.note = dir < 0 ? 'The garden slides left.' : 'The garden slides right.';
    persist(s);
  }
}

function finishSitting(s, markedHit, bowl) {
  const n = resultNumber(s.seed);
  s.resultN = n;
  s.phase = 'result';
  s.charged = false;
  s.markedHit = !!markedHit;
  if (s.table) s.table.coin = s.table.coin && markedHit ? s.table.coin : null;
  const prize = PENELOPE_CHAPTERS[s.level].prize;
  const win = markedHit && isPenelopeWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (markedHit) {
      if (drop === 'everyday-penny') credit(1);
      else keep(drop, 'penny-pitch');
    }
    if (win) {
      keep(prize, 'penny-pitch');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, bowl ? {x: bowl.x, y: bowl.y} : {x: 450, y: 520});
  s.hold = 1.2;
  if (win) s.note = 'The bowl tips. ' + itemName(prize) + ' was waiting.';
  else if (markedHit) s.note = 'A warm clink. An ordinary wish. The unique still waits.';
  else s.note = 'Three coins spent. The wishing bowl kept its secret.';
  persist(s);
}

function afterCoin(s, event, bowl) {
  if (event === 'settle' && bowl?.marked) {
    finishSitting(s, true, bowl);
    return;
  }
  if (event === 'settle') s.note = 'It settled in the ' + (bowl?.name || 'wrong dish') + '. The wishing bowl still waits.';
  else s.note = 'The coin missed the garden.';
  if (s.table) s.table.coin = null;
  s.coinsLeft -= 1;
  if (s.coinsLeft <= 0) finishSitting(s, false, null);
  else {
    s.phase = 'aim';
    if (s.table) { s.table.cloth = 0; s.table.tugLeft = true; s.table.frozen = false; }
    persist(s);
  }
}

export default {
  title: 'Dish Garden',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  houseSeconds: 80,
  houseTitle: 'The wells went still',
  houseDetail: 'Penelope folds the cloth. Another penny for another three-coin sitting.',
  intro: alleyPlay
    ? 'Penelope’s Dish Garden. One penny buys three pitch coins. Flick a brass coin, then tug the tablecloth once while it flies. The unique only drops if the coin settles in the marked wishing bowl and tonight’s numbers agree.'
    : 'Three practice coins. Pitch, tug once, settle in the marked bowl. Workshop writes nothing.',
  instructions: alleyPlay
    ? 'Place along the cloth, swipe to pitch, then Tug Left or Tug Right once while it flies. One penny for the whole sitting.'
    : 'Pitch, one tug, land the marked bowl. Practice writes nothing.',
  tableDetail: alleyPlay
    ? 'One penny, three coins, one tug each. Settle in the marked wishing bowl.'
    : 'A practice garden. Three coins. Land the marked bowl.',
  levels: PENELOPE_CHAPTERS.map(c => c.title),
  sprites: ['well-wish-penny', 'skipping-stone', 'well-coin', 'three-well-plaque', 'wish-ribbon', 'well-claim', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: PENELOPE_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'play', label: alleyPlay ? 'Step up · 1 penny' : 'Step up'},
    {id: 'pitch', label: 'Pitch · Space'},
    {id: 'tug-left', label: 'Tug left'},
    {id: 'tug-right', label: 'Tug right'},
    {id: 'again', label: alleyPlay ? 'Another sitting · 1 penny' : 'Another sitting'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 1) * 4201,
      table: saved.table || null, charged: !!saved.charged, coinsLeft: saved.coinsLeft || 0,
      placeX: saved.placeX || 450, angle: saved.angle || 0, power: saved.power || 280,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      resultN: saved.resultN || 0, markedHit: !!saved.markedHit, drag: null,
      note: saved.note || (PENELOPE_CHAPTERS[level] || PENELOPE_CHAPTERS[0]).title + '. Step up when you are ready.',
    };
    if ((s.phase === 'aim' || s.phase === 'fly') && !s.table) s.table = makeTable(level, s.seed);
    if (s.table) layoutBowls(s.table, s.table.t || 0, !!s.table.frozen);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    const keys = input?.keys || new Set();
    if (s.phase === 'aim' && s.table) {
      const dx = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
      s.placeX = clamp(s.placeX + dx * 240 * dt, s.table.placeMin, s.table.placeMax);
      const dy = (keys.has('ArrowUp') ? 1 : 0) - (keys.has('ArrowDown') ? 1 : 0);
      s.power = clamp(s.power + dy * 160 * dt, 180, 420);
    }
    if (s.phase === 'fly' && s.table) {
      if (keys.has('ArrowLeft')) tug(s, -1);
      if (keys.has('ArrowRight')) tug(s, 1);
      const ev = stepCoin(s.table, dt);
      if (ev.event === 'settle' || ev.event === 'miss') afterCoin(s, ev.event, ev.bowl);
    } else if (s.table && s.phase === 'aim') {
      layoutBowls(s.table, s.t, false);
      s.table.t = s.t;
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The wishing bowl tipped',
          itemName(PENELOPE_CHAPTERS[s.level].prize) + ' was folded into the book.',
          {prize: PENELOPE_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (type === 'down' && p.y > 900) beginSitting(s);
      return;
    }
    if (s.phase === 'aim') {
      if (type === 'down' && p.y > 860) s.drag = {x0: p.x, y0: p.y};
      if (type === 'move' && s.drag) {
        s.placeX = clamp(p.x, s.table.placeMin, s.table.placeMax);
        s.angle = clamp((p.x - s.drag.x0) / 220, -0.5, 0.5);
        s.power = clamp(180 + Math.max(0, s.drag.y0 - p.y) * 1.2, 180, 420);
      }
      if (type === 'up' && s.drag) {
        const dy = p.y - s.drag.y0;
        const dx = p.x - s.drag.x0;
        s.drag = null;
        if (dy < -28) {
          s.angle = clamp(dx / 220, -0.5, 0.5);
          s.power = clamp(180 + Math.hypot(dx, dy) * 1.05, 180, 420);
          pitch(s);
        }
      }
      if (type === 'cancel') s.drag = null;
      return;
    }
    if (s.phase === 'fly' && type === 'down') {
      if (p.x < 450) tug(s, -1);
      else tug(s, 1);
    }
  },
  action(s, id) {
    if (id === 'play' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Step up when you are ready.';
        persist(s);
        return;
      }
      beginSitting(s);
    }
    if (id === 'pitch') {
      if (s.phase === 'idle' || s.phase === 'result') beginSitting(s);
      else pitch(s);
    }
    if (id === 'tug-left') tug(s, -1);
    if (id === 'tug-right') tug(s, 1);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ' || k === 'Enter') this.action(s, 'pitch');
    if (k === 'a' || k === 'A') tug(s, -1);
    if (k === 'd' || k === 'D') tug(s, 1);
  },
  draw(s, d) {
    const ch = PENELOPE_CHAPTERS[s.level];
    const c = d.c;
    d.poly([[70, 90], [830, 90], [830, 1180], [70, 1180]], '#3a1828ee', '#d4a07a', 3);
    d.text('Dish Garden', 450, 118, 26, '#efe6d0');
    d.text(ch.title, 450, 148, 18, '#e2b98c');

    const clothX = s.table?.cloth || 0;
    const cloth = [
      [80 + clothX * 0.08, 260], [820 + clothX * 0.08, 260],
      [860 + clothX * 0.2, 1080], [40 + clothX * 0.2, 1080],
    ];
    d.poly(cloth, '#6a2438', '#e8c49a', 4);
    d.poly([[120 + clothX * 0.1, 300], [780 + clothX * 0.1, 300], [810 + clothX * 0.18, 1020], [90 + clothX * 0.18, 1020]], '#7a2e44', '#f0d0a822', 1);
    for (let i = 0; i < 6; i++) {
      const y = 360 + i * 110;
      d.line({x: 140 + clothX * 0.12, y}, {x: 760 + clothX * 0.12, y}, '#e8c49a33', 1);
    }

    const bowls = s.table?.bowls || [];
    for (const b of bowls) {
      d.ellipse(b.x + 4, b.y + 10, b.r + 8, (b.r + 8) * 0.55, '#1a081266');
      d.ellipse(b.x, b.y, b.r, b.r * 0.55, b.marked ? '#c9a24a' : '#d8c4a0', b.marked ? '#fff4c8' : '#8a5a48', b.marked ? 6 : 3);
      d.ellipse(b.x, b.y + 4, b.r - 10, (b.r - 10) * 0.45, b.marked ? '#7a5028' : '#6a3a38');
      if (b.marked) {
        d.glow(b.x, b.y, b.r + 18, '#f0d49a');
        d.text('wish', b.x, b.y + b.r * 0.55 + 14, 13, '#fff4d0');
      } else d.text(b.symbol, b.x, b.y + 4, 12, '#fff6d8');
    }

    const coins = s.phase === 'idle' || s.phase === 'result' ? 0 : s.coinsLeft;
    for (let i = 0; i < 3; i++) {
      d.circle(110 + i * 28, 200, 10, i < coins ? '#d5b077' : '#2a1820', '#f6d995', 1);
    }
    if (s.table && s.phase === 'fly') {
      roundRect(c, 80, 980, 160, 54, 10);
      c.fillStyle = s.table.tugLeft ? '#f0d18fcc' : '#6a5a4888';
      c.fill();
      d.text('Tug left', 160, 1014, 16, '#3a2a18');
      roundRect(c, 660, 980, 160, 54, 10);
      c.fillStyle = s.table.tugLeft ? '#f0d18fcc' : '#6a5a4888';
      c.fill();
      d.text('Tug right', 740, 1014, 16, '#3a2a18');
    }

    const coin = s.table?.coin;
    if (coin) {
      d.ellipse(coin.x, coin.y + 6, 16, 7, '#1a081266');
      d.item(spriteKey('everyday-penny'), coin.x, coin.y - coin.z, {
        w: 30, angle: s.reduced ? 0 : coin.spin,
        fallback: () => d.ellipse(coin.x, coin.y - coin.z, 14, 6 + Math.abs(Math.cos(coin.spin)) * 6, '#d5b077', '#f6d995', 2),
      });
    } else if (s.phase === 'aim') {
      d.ring(s.placeX, 1022, 20, '#e6c48b', 8);
      d.item(spriteKey('everyday-penny'), s.placeX, 1000, {
        w: 30, fallback: () => d.ellipse(s.placeX, 1000, 14, 7, '#d5b077', '#f6d995', 2),
      });
    }

    wrapLine(d, s.note, 450, 1120, 18, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1180, 14, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    const coins = s.phase === 'aim' || s.phase === 'fly' ? s.coinsLeft + '/3 coins' : s.phase;
    return purse + ' · ' + coins + ' · ' + s.note;
  },
};
