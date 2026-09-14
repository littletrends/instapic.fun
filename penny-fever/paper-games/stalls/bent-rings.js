import {clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  RINGO_CHAPTERS, makeWave, stepWave, makeRing, stepRing, isRingoWin, resultNumber,
  ordinaryFor, uniquePeg, LAUNCH_Y, FIELD,
} from '../ring-raiders.js?v=raid-2';

const BOOK = 'pennyFever.ringRaiders';

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
    phase: s.phase, seed: s.seed, charged: !!s.charged, wave: s.wave,
    aim: s.aim, power: s.power, ring: s.ring, resultN: s.resultN || 0,
    won: !!s.won, note: s.note, reduced: !!s.reduced,
  };
  writeBook(book);
}

function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function finishWave(s, why) {
  if (s.phase === 'result') return;
  const n = s.resultN || resultNumber(s.seed);
  s.resultN = n;
  s.phase = 'result';
  s.charged = false;
  s.ring = null;
  const looped = !!(s.wave && s.wave.uniqueLooped);
  const prize = RINGO_CHAPTERS[s.level].prize;
  const win = looped && isRingoWin(s.level, n) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'bent-rings');
    if (win) {
      keep(prize, 'bent-rings');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) {
    const u = (s.wave?.pegs || []).find(p => p.unique);
    takePrize(s, prize, u ? {x: u.x, y: u.y} : {x: 450, y: 520});
  }
  s.hold = 1.15;
  if (win) s.note = 'Looped the unique peg. The prize drops to the drawer.';
  else if (looped) s.note = 'A clean loop — tonight’s numbers kept the unique.';
  else s.note = why || 'Wave over. Loop the unique peg, not a glancing hit.';
  persist(s);
}

function beginWave(s) {
  if (s.phase === 'aim' || s.phase === 'fly') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('bent-rings', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (s.level + 1) * 4099) + 1 + s.level * 19;
    }
    s.wave = makeWave(s.level, s.seed);
    s.resultN = s.wave.resultN;
    s.ring = null;
    s.aim = 450;
    s.power = 0;
    s.curve = 0;
    s.charging = false;
    s.phase = 'aim';
    s.prizeKept = false;
    s.reduced = reducedMotion();
    const u = uniquePeg(s.wave);
    s.note = u
      ? 'A unique is strapped to a peg. Loop it — a bounce does not count.'
      : 'Loop the advancing pegs. One penny, one wave.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function toss(s) {
  if (s.phase !== 'aim' || !s.wave || s.ring) return;
  if (s.wave.ringsLeft <= 0) return;
  const ch = RINGO_CHAPTERS[s.level];
  const power = Math.max(0.18, s.power || 0.45);
  s.ring = makeRing(s.aim, power, s.curve, ch);
  s.wave.ringsLeft -= 1;
  s.wave.flying = true;
  s.phase = 'fly';
  s.charging = false;
  s.power = 0;
  s.curve = 0;
  s.note = s.wave.ringsLeft + ' rings left. Loop, do not glance.';
  persist(s);
}

export default {
  title: 'Ring Raiders',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  houseSeconds: 70,
  houseTitle: 'The orchard emptied',
  houseDetail: 'Ringo collects the rings. Another wave when you are ready.',
  intro: alleyPlay
    ? 'Ringo’s Ring Orchard, rebuilt as Ring Raiders. Pegs advance. One penny buys the whole wave. Hold to throw; a ring must loop a peg, not merely strike it. The unique is strapped to a moving peg.'
    : 'Loop advancing pegs. A glancing hit bounces away. Workshop waves are free and write nothing.',
  instructions: alleyPlay
    ? 'Slide the launcher. Hold to charge, release to toss. Optional side-drag adds curve. Loop the unique peg to keep the chapter prize. One penny is one wave, not one ring.'
    : 'Aim, hold, toss. Loop pegs. Practice writes nothing.',
  levels: RINGO_CHAPTERS.map(c => c.title),
  sprites: ['lucky-ring-trio', 'splash-ring', 'wishing-acorn', 'twig-ring', 'orchard-circlet', 'ring-toss-ribbon', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: RINGO_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'left', label: '← launcher', hold: true},
    {id: 'raid', label: alleyPlay ? 'Wave · 1 penny' : 'Start wave'},
    {id: 'toss', label: 'Toss · Space', hold: true},
    {id: 'right', label: 'launcher →', hold: true},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 1) * 4099,
      wave: saved.wave || null, ring: saved.ring || null,
      aim: saved.aim || 450, power: saved.power || 0, curve: 0, charging: false,
      charged: !!saved.charged, resultN: saved.resultN || 0,
      won: !!saved.won || chapterPaid(level), hold: 0, reduced: !!saved.reduced,
      left: false, right: false,
      note: saved.note || (RINGO_CHAPTERS[level] || RINGO_CHAPTERS[0]).title + '. Start a wave when you are ready.',
    };
    if ((s.phase === 'aim' || s.phase === 'fly') && !s.wave) s.wave = makeWave(level, s.seed);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    const keys = input?.keys || new Set();
    const acts = input?.actions || new Set();
    const left = s.left || keys.has('ArrowLeft') || acts.has('left');
    const right = s.right || keys.has('ArrowRight') || acts.has('right');
    if (s.phase === 'aim' || s.phase === 'fly') {
      s.aim = clamp(s.aim + ((right ? 1 : 0) - (left ? 1 : 0)) * 280 * dt, FIELD.left + 20, FIELD.right - 20);
    }
    if (s.phase === 'aim' && s.charging) s.power = clamp(s.power + dt * 1.2, 0, 1);
    if (s.phase === 'aim' || s.phase === 'fly') {
      if (s.wave) stepWave(s.wave, dt, s.reduced);
      if (s.wave && s.wave.breached) finishWave(s, 'The formation reached Ringo’s counter.');
      else if (s.wave && s.wave.cleared) finishWave(s, 'Wave cleared.');
    }
    if (s.phase === 'fly' && s.ring) {
      const ev = stepRing(s.ring, s.wave, dt);
      if (ev.kind === 'loop' && ev.peg?.unique) {
        finishWave(s, 'Looped the unique.');
      } else if (!s.ring.live) {
        s.ring = null;
        if (s.wave) s.wave.flying = false;
        if (s.wave.uniqueLooped) finishWave(s, 'Looped the unique.');
        else if (s.wave.ringsLeft <= 0) finishWave(s, 'No rings left.');
        else { s.phase = 'aim'; persist(s); }
      }
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'A ring on the unique peg',
          itemName(RINGO_CHAPTERS[s.level].prize) + ' — looped, not merely struck.',
          {prize: RINGO_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (type === 'down') beginWave(s);
      return;
    }
    if (type === 'down') {
      if (p.y > 920) {
        s.aim = clamp(p.x, FIELD.left + 20, FIELD.right - 20);
        s.charging = true;
        s.power = 0.12;
        s.curve0 = p.x;
      } else if (p.x < 450) s.left = true;
      else s.right = true;
    }
    if (type === 'move' && s.charging) {
      s.aim = clamp(p.x, FIELD.left + 20, FIELD.right - 20);
      s.curve = clamp((p.x - (s.curve0 || p.x)) / 140, -1, 1);
    }
    if (type === 'up' || type === 'cancel') {
      s.left = false; s.right = false;
      if (s.charging) { s.charging = false; toss(s); }
    }
  },
  action(s, id, down) {
    if (id === 'raid' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Another wave when you are ready.';
        persist(s);
        return;
      }
      beginWave(s);
    }
    if (id === 'left') s.left = !!down;
    if (id === 'right') s.right = !!down;
    if (id === 'toss') {
      if (down) { s.charging = true; s.power = Math.max(s.power, 0.12); }
      else toss(s);
    }
  },
  key(s, k, down) {
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'idle' || s.phase === 'result') { if (down) this.action(s, 'raid'); return; }
      if (down) { s.charging = true; s.power = Math.max(s.power, 0.12); }
      else toss(s);
    }
  },
  draw(s, d) {
    const ch = RINGO_CHAPTERS[s.level];
    d.poly([[70, 40], [830, 40], [850, 1160], [50, 1160]], '#1a2a1cee', '#c6a267', 3);
    d.text('Ring Raiders', 450, 88, 28, '#efe6d0');
    d.text(ch.title, 450, 122, 18, '#d2b98c');
    if (!s.won) {
      d.item(spriteKey(ch.prize), 800, 108, {w: 60, fallback: () => d.star(800, 108, 20)});
      d.text('waiting', 800, 156, 12, '#ead6a4');
    }
    d.line({x: FIELD.left, y: 160}, {x: FIELD.left, y: 1000}, '#8a7652', 10);
    d.line({x: FIELD.right, y: 160}, {x: FIELD.right, y: 1000}, '#8a7652', 10);
    d.line({x: FIELD.left, y: 990}, {x: FIELD.right, y: 990}, '#c45a6a', 3);
    d.text('counter', 450, 1012, 12, '#e8a0a0');
    if (s.wave) {
      for (const peg of s.wave.pegs) {
        if (peg.looped) continue;
        const fill = peg.kind === 'hook' ? '#b88848' : peg.kind === 'acorn' ? '#8a5a28' : '#c4a060';
        d.circle(peg.x, peg.y, peg.r, fill, '#f0d6a0', 2);
        if (peg.kind === 'hook') d.arc(peg.x, peg.y, peg.r + 6, peg.tilt - 0.8, peg.tilt + 0.8, '#e8c878', 3);
        if (peg.unique) {
          d.glow(peg.x, peg.y - peg.r - 18, 28, '#f0d18f');
          d.item(spriteKey(ch.prize), peg.x, peg.y - peg.r - 18, {
            w: 32, fallback: () => d.star(peg.x, peg.y - peg.r - 18, 10),
          });
        }
      }
      d.text(s.wave.ringsLeft + ' rings', 160, 122, 16, '#f0d18f');
    }
    if (s.ring && s.ring.live) {
      d.ellipse(s.ring.x, s.ring.y, s.ring.outer, s.ring.outer * 0.55, null, '#8b7048', 10);
      d.ellipse(s.ring.x - 1, s.ring.y - 1, s.ring.outer, s.ring.outer * 0.55, null, '#f1d192', 6);
    } else if (s.phase === 'aim') {
      d.ring(s.aim, LAUNCH_Y, 28, '#ecd08a', 7);
      if (s.charging) {
        d.line({x: s.aim - 40, y: 1120}, {x: s.aim - 40 + 80 * s.power, y: 1120}, '#f0d18f', 8);
      }
    }
    wrapLine(d, s.note, 450, 1140, 18, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 140, 88, 14, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    const rings = s.wave ? s.wave.ringsLeft + ' rings' : 'idle';
    const u = s.wave?.uniqueLooped ? 'unique looped' : (uniquePeg(s.wave) ? 'unique live' : 'no unique');
    return purse + ' · ' + rings + ' · ' + u + ' · ' + s.note;
  },
};
