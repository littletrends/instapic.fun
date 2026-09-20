import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  BESS_CHAPTERS, BALLS, START, MIN_PULL, GRAVITY, BALL_R, PLATE_CX,
  holesAt, plateYs, launchFromPull, advanceBall, resultNumber,
  bessUnique, ordinaryFor,
} from '../plates.js?v=first-prize-1';

const BOOK = 'pennyFever.impossiblePlates';

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
    phase: s.phase === 'fly' || s.phase === 'aim' ? 'play' : s.phase,
    seed: s.seed, charged: !!s.charged, ballsLeft: s.ballsLeft,
    passes: s.passes, throws: s.throws, won: !!s.won, note: s.note,
    resultN: s.resultN || 0, reduced: !!s.reduced, t: s.t,
  };
  writeBook(book);
}

function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function beginSit(s) {
  if (s.phase === 'play' || s.phase === 'aim' || s.phase === 'fly') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('ball-toss', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 1 + s.level * 17;
    }
    s.phase = 'play';
    s.ballsLeft = BALLS;
    s.passes = 0;
    s.throws = [];
    s.ball = null;
    s.aiming = false;
    s.aim = null;
    s.settle = 0;
    s.fortune = '';
    s.resultN = 0;
    s.prizeKept = false;
    s.reduced = reducedMotion();
    s.note = 'Three balls. Pull back from the ball, then release.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function throwBall(s, pointer) {
  if (s.phase !== 'play' && s.phase !== 'aim') return;
  if (s.ball || s.ballsLeft <= 0) return;
  const ball = launchFromPull(pointer || s.aim);
  if (!ball) {
    s.note = 'Pull farther to throw — ease back to cancel.';
    s.aiming = false;
    s.aim = null;
    s.phase = 'play';
    return;
  }
  ball.need = plateYs(s.level).length;
  s.ball = ball;
  s.phase = 'fly';
  s.aiming = false;
  s.aim = null;
  s.ballsLeft -= 1;
  s.settle = 0;
  s.note = 'Ball ' + (BALLS - s.ballsLeft) + ' of ' + BALLS + '.';
  persist(s);
}

function afterBall(s) {
  const result = s.ball?.result || 'miss';
  if (result === 'pass') s.passes += 1;
  s.throws.push(result);
  s.ball = null;
  s.settle = 0;
  if (s.throws.length >= BALLS) {
    finishSit(s);
    return;
  }
  s.phase = 'play';
  if (result === 'pass') s.note = 'Clean through. ' + s.ballsLeft + ' left.';
  else if (result === 'rim') s.note = 'Rim. ' + s.ballsLeft + ' left.';
  else s.note = 'Short of the plate. ' + s.ballsLeft + ' left.';
  persist(s);
}

function finishSit(s) {
  const n = resultNumber(s.seed);
  s.resultN = n;
  s.phase = 'result';
  s.charged = false;
  const prize = BESS_CHAPTERS[s.level].prize;
  const win = bessUnique(s.level, n, s.passes) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'ball-toss');
    if (win) {
      keep(prize, 'ball-toss');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: PLATE_CX, y: plateYs(s.level)[0]});
  s.hold = 1.2;
  if (!s.passes) s.note = 'The porcelain kept every ball.';
  else s.note = s.passes + ' clean pass' + (s.passes === 1 ? '' : 'es') + '.';
  persist(s);
}

function preview(aim) {
  const ball = launchFromPull(aim);
  if (!ball) return [];
  const pts = [];
  let x = ball.x, y = ball.y, vx = ball.vx, vy = ball.vy;
  for (let i = 0; i < 18; i++) {
    vy += GRAVITY * 0.04;
    x += vx * 0.04;
    y += vy * 0.04;
    pts.push({x, y});
    if (y < 220 || y > 1180) break;
  }
  return pts;
}

export default {
  title: 'Impossible Plates',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  intro: alleyPlay
    ? 'Bess’s barely-fit plates. Pull back and throw three balls for a penny. A clean centre pass rings the porcelain; a rim clip rattles away. The unique only drops on a true pass and tonight’s numbers.'
    : 'Pull back from the ball. A clean centre pass goes through; a rim clip fails. Workshop throws are free and write nothing.',
  instructions: alleyPlay
    ? 'Sit for a penny — three balls. Pull back from the ball and release. Return to the start to cancel. Only a clean hole counts.'
    : 'Pull back, release. Practice writes nothing.',
  levels: BESS_CHAPTERS.map(c => c.title),
  sprites: ['juggling-bird', 'patchwork-bear', 'autumn-leaf-lantern', 'button-elephant', 'prize-claim', 'midway-scarf', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: BESS_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'sit', label: alleyPlay ? 'Sit · 1 penny' : 'Sit down'},
    {id: 'again', label: alleyPlay ? 'Another sitting · 1 penny' : 'Another sitting'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 1) * 3109,
      charged: !!saved.charged, ballsLeft: saved.ballsLeft ?? BALLS,
      passes: saved.passes || 0, throws: saved.throws || [],
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      note: saved.note || (BESS_CHAPTERS[level] || BESS_CHAPTERS[0]).title + '. Sit when you are ready.',
      resultN: saved.resultN || 0, ball: null, aiming: false, aim: null, settle: 0,
    };
    if (s.phase === 'aim' || s.phase === 'fly') s.phase = 'play';
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (s.phase === 'fly' && s.ball) {
      let left = dt;
      const step = 1 / 180;
      while (left > 0 && s.ball && !s.ball.judged) {
        const h = Math.min(step, left);
        advanceBall(s.ball, h, {level: s.level, seed: s.seed, t: s.t, reduced: s.reduced});
        left -= h;
      }
      if (s.ball.judged) {
        s.settle += dt;
        if (s.settle > 0.35) afterBall(s);
      }
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'A clean pass through porcelain',
          itemName(BESS_CHAPTERS[s.level].prize) + ' — ' + s.note,
          {prize: BESS_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (type === 'down') beginSit(s);
      return;
    }
    if (s.phase === 'fly') return;
    if (type === 'cancel') {
      s.aiming = false;
      s.aim = null;
      s.phase = 'play';
      return;
    }
    if (type === 'down') {
      if (Math.hypot(p.x - START.x, p.y - START.y) < 80) {
        s.aiming = true;
        s.aim = p;
        s.phase = 'aim';
      }
      return;
    }
    if (type === 'move' && s.aiming) s.aim = p;
    if (type === 'up' && s.aiming) {
      s.aim = p;
      throwBall(s, p);
    }
  },
  action(s, id) {
    if (id === 'sit' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Sit again when you are ready.';
        persist(s);
        return;
      }
      beginSit(s);
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'idle' || s.phase === 'result') this.action(s, 'sit');
    }
  },
  draw(s, d) {
    const ch = BESS_CHAPTERS[s.level];
    const c = d.c;
    d.text('Impossible Plates', 450, 118, 28, '#efe6d0');
    d.text(ch.title, 450, 154, 20, '#d2b98c');
    {
      const owned = s.won || chapterPaid(s.level);
      d.item(spriteKey(ch.prize), 800, 148, {w: 70, fallback: () => d.star(800, 148, 24)});
      d.text(owned ? 'Collected' : 'Locked', 800, 202, 14, owned ? '#c8e878' : '#ead6a4');
    }

    const holes = holesAt(s.level, s.t, s.seed, s.reduced);
    const ys = [...new Set(holes.map(h => h.y))];
    for (const py of ys) {
      const here = holes.filter(h => h.y === py);
      c.save();
      if (s.level === 3 && here[0]?.tilt) {
        c.translate(PLATE_CX, py);
        c.rotate(here[0].tilt * 0.35);
        c.translate(-PLATE_CX, -py);
      }
      d.ellipse(PLATE_CX + 6, py + 10, ch.plateR * 0.92, ch.plateR * 0.38, '#12233533');
      d.circle(PLATE_CX, py, ch.plateR, '#f3e2c4', '#c6a267', 5);
      d.circle(PLATE_CX, py, ch.plateR - 8, '#efe0c0', '#e8c878', 2);
      for (const h of here) {
        d.circle(h.x, h.y, h.r, h.live ? '#2a1838ee' : '#3a2a18cc', h.live ? '#f0d18f' : '#8a7350', h.live ? 4 : 2);
        if (h.live) d.glow(h.x, h.y, h.r + 18, '#e8c878');
      }
      c.restore();
    }

    const left = s.phase === 'play' || s.phase === 'aim' ? s.ballsLeft : (s.phase === 'fly' ? s.ballsLeft + (s.ball ? 1 : 0) : 0);
    for (let i = 0; i < BALLS; i++) {
      const x = 330 + i * 40;
      d.circle(x, 188, 10, i < left ? '#b57b59' : '#3a2a18aa', '#e8c878', 1);
    }

    if (s.ball) d.ball(s.ball.x, s.ball.y, BALL_R, '#c47a55');
    else if (s.phase === 'play' || s.phase === 'aim') {
      d.ball(START.x, START.y, BALL_R + 2, '#c47a55');
      if (s.aiming && s.aim) {
        const pts = preview(s.aim);
        pts.forEach((pt, i) => d.circle(pt.x, pt.y, i === pts.length - 1 ? 4 : 2.4, '#e8c87899'));
        d.line(START, s.aim, '#ead6a488', 2);
        const ready = Math.hypot(START.x - s.aim.x, START.y - s.aim.y) >= MIN_PULL;
        d.text(ready ? 'release' : 'pull', START.x, START.y + 48, 16, ready ? '#fff6d8' : '#cbb890');
      }
    } else if (s.phase === 'idle') {
      d.ball(START.x, START.y, BALL_R + 2, '#c47a55');
      d.text('Sit', 450, 900, 28, '#ead6a4');
    }

    wrapLine(d, s.note, 450, 1120, 22, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1180, 16, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
