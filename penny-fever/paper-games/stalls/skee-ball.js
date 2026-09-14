import {clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  SKIP_CHAPTERS, makeLane, makeBall, stepBall, markedHole, advanceMark,
  resultNumber, isSkipWin, ordinaryFor, shutterOpen,
} from '../moonbow.js?v=skip-1';

const BOOK = 'pennyFever.moonbowLane';
const FOOT = {x: 450, y: 1040};

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
    phase: s.phase, seed: s.seed, charged: !!s.charged, ballsLeft: s.ballsLeft,
    lane: s.lane, ball: s.ball, placeX: s.placeX, angle: s.angle, power: s.power,
    won: !!s.won, note: s.note, resultN: s.resultN || 0, markedHit: !!s.markedHit,
    score: s.score || 0, reduced: !!s.reduced,
  };
  writeBook(book);
}
function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function loadedPrize(s) {
  const n = resultNumber(s.seed);
  if (isSkipWin(s.level, n) && !chapterPaid(s.level) && !s.won) return SKIP_CHAPTERS[s.level].prize;
  return ordinaryFor(n);
}

function beginSitting(s) {
  if (s.phase === 'rolling' || s.phase === 'aim') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('skee-ball', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 1 + s.level * 17;
    }
    s.lane = makeLane(s.level, s.seed);
    s.ballsLeft = s.lane.balls;
    s.phase = 'aim';
    s.ball = null;
    s.markedHit = false;
    s.resultN = 0;
    s.prizeKept = false;
    s.score = s.score || 0;
    s.reduced = reducedMotion();
    s.placeX = 450;
    s.angle = 0;
    s.power = 390;
    const prize = loadedPrize(s);
    s.loaded = prize;
    s.note = 'Five wooden balls. Land one in the marked moon for ' + itemName(prize) + '.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function release(s) {
  if (s.phase !== 'aim' || s.ball || !s.lane) return;
  if (s.ballsLeft <= 0) return;
  s.lane.freezeT = s.t;
  s.ball = makeBall(s.placeX, s.angle, s.power);
  s.phase = 'rolling';
  s.note = 'Rolling…';
  persist(s);
}

function finishSitting(s, markedHit, hole) {
  const n = resultNumber(s.seed);
  s.resultN = n;
  s.phase = 'result';
  s.charged = false;
  s.markedHit = !!markedHit;
  s.ball = null;
  const prize = SKIP_CHAPTERS[s.level].prize;
  const win = markedHit && isSkipWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (markedHit) {
      if (drop === 'everyday-penny') credit(1);
      else keep(drop, 'skee-ball');
    }
    if (win) {
      keep(prize, 'skee-ball');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) {
    const mark = hole || markedHole(s.lane);
    takePrize(s, prize, mark ? {x: mark.x, y: mark.y} : {x: 450, y: 500});
  }
  s.hold = 1.2;
  if (win) s.note = 'The moonbow takes ' + itemName(prize) + '.';
  else if (markedHit) s.note = 'The marked moon kept a small light. The unique still waits.';
  else s.note = 'Five balls gone. The marked moon kept its secret.';
  persist(s);
}

function afterBall(s, event, hole) {
  if (event === 'sunk' && hole?.marked) {
    finishSitting(s, true, hole);
    return;
  }
  if (event === 'sunk' && hole) {
    s.score += hole.score;
    if (alleyPlay && hole.score >= 50) {
      keep('star-token', 'skee-ball');
      s.note = 'A star from a silver cup. The marked moon still waits.';
    } else if (alleyPlay && hole.score >= 30) {
      credit(1);
      s.note = 'A penny back. Aim for the marked moon.';
    } else s.note = hole.name + ' · ' + hole.score + '. The marked moon still waits.';
  } else s.note = 'Past the moons. Try the next ball.';
  s.ballsLeft -= 1;
  s.ball = null;
  if (s.lane) {
    s.lane.freezeT = null;
    advanceMark(s.lane);
  }
  if (s.ballsLeft <= 0) finishSitting(s, false, null);
  else {
    s.phase = 'aim';
    persist(s);
  }
}

export default {
  title: 'Moonbow Skee-Ball',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  houseSeconds: 90,
  houseTitle: 'The moonbow faded',
  houseDetail: 'Skip racks the balls. Another penny for another five-ball sitting.',
  intro: alleyPlay
    ? 'Skip’s Moonbow Skee-Ball. One penny buys five wooden balls. Slide, swipe, and land a ball in the marked celestial ring to collect tonight’s sealed reward. The unique only drops on that ring and tonight’s numbers.'
    : 'Five practice balls. Land one in the marked moon. Workshop rolls write nothing.',
  instructions: alleyPlay
    ? 'Drag along the foot to place the ball, swipe up to roll. One penny for the whole five-ball sitting. Only the marked moon holds the unique.'
    : 'Place, swipe up, land the marked moon. Practice writes nothing.',
  tableDetail: alleyPlay
    ? 'One penny, five balls. Sink the marked moon to collect the sealed reward. Walk away whenever you like.'
    : 'A practice lane. Five balls. Land the marked moon.',
  levels: SKIP_CHAPTERS.map(c => c.title),
  sprites: ['silver-cup-chip', 'lane-wax', 'pegboard-star', 'moonbow-stub', 'score-card', 'summer-sun-pin', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: SKIP_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'play', label: alleyPlay ? 'Step up · 1 penny' : 'Step up'},
    {id: 'roll', label: 'Roll · Space'},
    {id: 'again', label: alleyPlay ? 'Another sitting · 1 penny' : 'Another sitting'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 1) * 4099,
      lane: saved.lane || null, ball: saved.ball || null,
      charged: !!saved.charged, ballsLeft: saved.ballsLeft || 0,
      placeX: saved.placeX || 450, angle: saved.angle || 0, power: saved.power || 390,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      resultN: saved.resultN || 0, markedHit: !!saved.markedHit, score: saved.score || 0,
      drag: null, fly: [],
      note: saved.note || (SKIP_CHAPTERS[level] || SKIP_CHAPTERS[0]).title + '. Step up when you are ready.',
    };
    if ((s.phase === 'aim' || s.phase === 'rolling') && !s.lane) s.lane = makeLane(level, s.seed);
    if (s.lane) s.loaded = loadedPrize(s);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    const keys = input?.keys || new Set();
    if (s.phase === 'aim' && !s.ball) {
      const dx = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
      const dy = (keys.has('ArrowUp') ? 1 : 0) - (keys.has('ArrowDown') ? 1 : 0);
      s.placeX = clamp(s.placeX + dx * 220 * dt, s.lane?.left + 24 || 320, s.lane?.right - 24 || 580);
      s.power = clamp(s.power + dy * 180 * dt, 240, 560);
      s.angle = clamp(s.angle + dx * 0.35 * dt, -0.55, 0.55);
    }
    if (s.phase === 'rolling' && s.ball && s.lane) {
      const ev = stepBall(s.lane, s.ball, dt, s.t);
      if (ev.event === 'sunk' || ev.event === 'miss') afterBall(s, ev.event, ev.hole);
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The moonbow caught it',
          itemName(SKIP_CHAPTERS[s.level].prize) + ' rolls into Skip’s drawer.',
          {prize: SKIP_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result || s.phase === 'rolling') return;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (type === 'down' && p.y > 860) beginSitting(s);
      return;
    }
    if (s.phase !== 'aim') return;
    if (type === 'down' && p.y > 820) {
      s.drag = {x0: p.x, y0: p.y, x: p.x, y: p.y};
      s.placeX = clamp(p.x, s.lane.left + 24, s.lane.right - 24);
    }
    if (type === 'move' && s.drag) {
      s.drag.x = p.x;
      s.drag.y = p.y;
      s.placeX = clamp(p.x, s.lane.left + 24, s.lane.right - 24);
      s.angle = clamp((p.x - s.drag.x0) / 210, -0.55, 0.55);
      s.power = clamp(240 + Math.max(0, s.drag.y0 - p.y) * 1.5, 240, 560);
    }
    if (type === 'up' && s.drag) {
      const dy = p.y - s.drag.y0;
      const dx = p.x - s.drag.x0;
      s.drag = null;
      if (dy < -36) {
        s.angle = clamp(dx / 210, -0.55, 0.55);
        s.power = clamp(240 + Math.hypot(dx, dy) * 1.15, 240, 560);
        release(s);
      }
    }
    if (type === 'cancel') s.drag = null;
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
    if (id === 'roll') {
      if (s.phase === 'idle' || s.phase === 'result') beginSitting(s);
      else release(s);
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ' || k === 'Enter') this.action(s, 'roll');
  },
  draw(s, d) {
    const ch = SKIP_CHAPTERS[s.level];
    const c = d.c;
    const skies = ['#3a2438', '#24344a', '#1a2040', '#1c2a48', '#141018', '#241838'];
    d.poly([[70, 90], [830, 90], [830, 1180], [70, 1180]], skies[s.level] + 'ee', '#d4b07a', 3);
    d.text('Moonbow Skee-Ball', 450, 118, 26, '#efe6d0');
    d.text(ch.title, 450, 148, 18, '#d2b98c');

    const lane = s.lane;
    const left = lane?.left || 292, right = lane?.right || 608;
    d.poly([[left - 18, 1068], [right + 18, 1068], [right - 10, 330], [left + 10, 330]], '#1a2740', '#c9a46a', 5);
    d.poly([[left, 1048], [right, 1048], [right - 16, 348], [left + 16, 348]], '#243656', '#8ec8e822', 1);
    for (let y = 1000; y > 360; y -= 36) {
      const u = (y - 360) / 640;
      d.line({x: left + 10 + (1 - u) * 8, y}, {x: right - 10 - (1 - u) * 8, y}, '#d7c08a22', 1);
    }
    d.line({x: left, y: 1048}, {x: left + 16, y: 348}, '#e0c27a', 6);
    d.line({x: right, y: 1048}, {x: right - 16, y: 348}, '#e0c27a', 6);
    if (lane?.wax) {
      for (const p of lane.wax) {
        d.poly([[p.x, p.y], [p.x + p.w, p.y], [p.x + p.w, p.y + p.h], [p.x, p.y + p.h]],
          p.kind === 'gloss' ? '#9ad4f433' : '#2a243888', '#e8d6a844', 1);
      }
    }
    if (lane?.banks) {
      for (const b of lane.banks) d.line(b.a, b.b, '#d7b36a', 8);
    }

    const loaded = s.loaded || ch.prize;
    for (const h of (lane?.holes || [])) {
      const open = shutterOpen(lane, h, s.t);
      d.ellipse(h.x + 4, h.y + 10, h.r + 6, (h.r + 6) * 0.7, '#08182866');
      d.ellipse(h.x, h.y, h.r, h.r * 0.7, h.marked ? '#3a4a28' : '#243044', h.marked ? '#f0d49a' : '#c9a66a', h.marked ? 8 : 5);
      d.ellipse(h.x, h.y + 6, Math.max(8, h.r - 14), Math.max(6, (h.r - 14) * 0.65), '#0a1420');
      if (h.marked) {
        d.glow(h.x, h.y, h.r + 22, '#f0d49a');
        d.item(spriteKey(loaded), h.x, h.y - 2, {w: Math.min(40, h.r), shadow: false, fallback: () => d.star(h.x, h.y, 12)});
        d.text('marked', h.x, h.y + h.r * 0.7 + 16, 13, '#fff4d0');
      } else d.text(String(h.score), h.x, h.y + 6, 16, '#e5cc98');
      if (h.shutter && !open) {
        c.save();
        c.beginPath();
        c.ellipse(h.x, h.y, h.r - 2, (h.r - 2) * 0.7, 0, 0, Math.PI * 2);
        c.fillStyle = '#c4a46ad0';
        c.fill();
        c.restore();
        d.text('gate', h.x, h.y + 4, 12, '#3a2a14');
      }
    }

    const balls = s.phase === 'idle' || s.phase === 'result' ? 0 : s.ballsLeft;
    for (let i = 0; i < 5; i++) {
      const x = 110 + i * 28;
      d.circle(x, 200, 10, i < balls ? '#c48a52' : '#2a2438', '#e8c878', 1);
    }

    const p = s.ball || (s.phase === 'aim' ? {x: s.placeX, y: FOOT.y, z: 0, trail: []} : null);
    if (p) {
      if (!s.reduced && p.trail) {
        p.trail.forEach((q, i) => d.circle(q.x, q.y, 3, i % 2 ? '#fff6d855' : '#e8c87844'));
      }
      d.ellipse(p.x + 4, p.y + 8, 16, 8, '#08182866');
      d.item(spriteKey('moon-penny'), p.x, p.y - (p.z || 0), {
        w: p.sunk ? 24 : 32, fallback: () => d.ball(p.x, p.y - (p.z || 0), p.sunk ? 12 : 16, '#c48a52'),
      });
    }
    if (s.phase === 'aim' && !s.ball) {
      const end = {x: s.placeX + Math.sin(s.angle) * 90, y: FOOT.y - Math.cos(s.angle) * 90};
      d.line({x: s.placeX, y: FOOT.y - 8}, end, '#efd09b', 3);
      d.ring(end.x, end.y, 10, '#a17955', 2);
    }

    wrapLine(d, s.note, 450, 1124, 18, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1180, 14, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    const balls = s.phase === 'aim' || s.phase === 'rolling' ? s.ballsLeft + '/5 balls' : s.phase;
    return purse + ' · ' + balls + ' · ' + s.note;
  },
};
