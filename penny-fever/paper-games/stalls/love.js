import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, credit} from '../wallet.js?v=booth-play-2';
import {takeAttempt, retryNote} from '../stall-entry.js?v=entry-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  LOVE_CHAPTERS, normalizeName, normalizeKey, countWord, addDown, sumPair,
  isLoveWin, readingFor, ordinaryFor, lettersOnly, repeatedLetters,
} from '../love-arithmetic.js?v=ritual-2';

const BOOK = 'pennyFever.rosalieTester';
const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(['space', 'del']);
const DIGITS = '0123456789'.split('');

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
function hit(p, b) {
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}
function plateBox(which, two) {
  const w = two ? 250 : 520, h = 70;
  if (!two) return {x: 190, y: 210, w, h};
  return which === 0 ? {x: 90, y: 210, w, h} : {x: 560, y: 210, w, h};
}
function keyBox(i) {
  const cols = 7, w = 56, h = 48, gap = 8;
  const row = Math.floor(i / cols), col = i % cols;
  const total = cols * w + (cols - 1) * gap;
  return {x: 450 - total / 2 + col * (w + gap), y: 620 + row * (h + gap), w, h};
}
function digitBox(i) {
  const w = 64, h = 64, gap = 10;
  const total = 10 * w + 9 * gap;
  return {x: 450 - total / 2 + i * (w + gap), y: 760, w, h};
}

function emptyBook() {
  return {v: 1, used: {}, paid: {}, sittings: {}};
}
function readBook() {
  if (typeof localStorage === 'undefined') return emptyBook();
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1) return {used: {}, paid: {}, sittings: {}, ...blob};
  } catch {}
  return emptyBook();
}
function writeBook(book) {
  if (!alleyPlay || typeof localStorage === 'undefined') return;
  try { localStorage.setItem(BOOK, JSON.stringify(book)); } catch {}
}
function usedMap(level) {
  return readBook().used[String(level)] || {};
}
function rememberUse(level, key, pct) {
  if (!alleyPlay) return;
  const book = readBook();
  book.used[String(level)] = book.used[String(level)] || {};
  book.used[String(level)][key] = pct;
  writeBook(book);
}
function chapterPaid(level) {
  return !!(readBook().paid && readBook().paid[String(level)]);
}
function markPaid(level) {
  if (!alleyPlay) return;
  const book = readBook();
  book.paid = book.paid || {};
  book.paid[String(level)] = true;
  writeBook(book);
}

function persist(s) {
  if (!alleyPlay || typeof localStorage === 'undefined' || !s) return;
  const book = readBook();
  book.sittings[String(s.level)] = {
    you: s.you, them: s.them, focus: s.focus, phase: s.phase,
    reads: s.reads, charged: !!s.charged, launchId: s.launchId || 0,
    trueCounts: s.trueCounts, playerCounts: s.playerCounts,
    countIndex: s.countIndex, addRow: s.addRow, addCol: s.addCol,
    playerRows: s.playerRows, pct: s.pct, reading: s.reading,
    mistakes: s.mistakes, hints: s.hints, won: !!s.won,
    note: s.note, mercury: s.mercury || 0,
  };
  writeBook(book);
}

function combined(s) {
  const ch = LOVE_CHAPTERS[s.level];
  return ch.bLabel ? (s.you + ' ' + s.them) : s.you;
}

function typeInto(s, ch) {
  if (s.phase !== 'edit') return;
  const two = !!(LOVE_CHAPTERS[s.level].bLabel);
  const key = !two || s.focus === 0 ? 'you' : 'them';
  if (ch === 'del') s[key] = s[key].slice(0, -1);
  else if (ch === 'space') {
    if (s[key].length && s[key].length < 16 && !s[key].endsWith(' ')) s[key] += ' ';
  } else if (s[key].length < 16) s[key] += ch;
  persist(s);
}

function emptyNote() {
  return alleyPlay
    ? 'A penny for a sitting. Cash a ticket at Copper Falls.'
    : 'Fill the paper, then begin.';
}

function beginAttempt(s) {
  if (s.phase !== 'edit' && s.phase !== 'wait') return;
  if (s.chargeLock) return;
  const ch = LOVE_CHAPTERS[s.level];
  const you = normalizeName(s.you);
  const them = ch.bLabel ? normalizeName(s.them) : '';
  if (!you || (ch.bLabel && !them)) {
    s.note = 'Fill the paper, darling.';
    s.shake = 0.35;
    return;
  }
  const key = normalizeKey(ch.bLabel ? [you, them] : [you]);
  const used = usedMap(s.level);
  if (Object.prototype.hasOwnProperty.call(used, key)) {
    s.note = 'Those two names still make ' + used[key] + ', darling. Arithmetic has not changed its mind. Try a nickname.';
    s.shake = 0.4;
    return;
  }
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (alleyPlay) {
        if (!takeAttempt('love', s.level)) { s.note = retryNote(); return; }
      }
      s.charged = true;
      s.launchId = (s.launchId || 0) + 1;
    }
    s.trueCounts = countWord(combined(s), ch.word);
    s.trueAdd = addDown(s.trueCounts);
    s.playerCounts = [];
    s.countIndex = 0;
    s.addRow = 1;
    s.addCol = 0;
    s.playerRows = [s.trueCounts.map(() => null)];
    s.phase = 'count';
    s.reads += 1;
    s.mistakes = 0;
    s.hints = 0;
    s.prizeKept = false;
    s.mercury = 0.08;
    const repeats = repeatedLetters(ch.word);
    s.note = repeats.length
      ? ch.word + ' repeats ' + repeats.join(' and ') + '. Count each column. How many ' + ch.word[0] + '?'
      : 'How many ' + ch.word[0] + ' in the names?';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function enterDigit(s, digit) {
  const n = Number(digit);
  if (s.phase === 'count') {
    const ch = LOVE_CHAPTERS[s.level];
    const need = s.trueCounts[s.countIndex];
    if (n !== need) {
      s.mistakes += 1;
      s.shake = 0.35;
      s.note = 'The spirits are mysterious. Your addition is simply wrong. Count the ' + ch.word[s.countIndex] + ' again.';
      persist(s);
      return;
    }
    s.playerCounts[s.countIndex] = n;
    s.countIndex += 1;
    s.mercury = s.countIndex / ch.word.length * 0.45;
    if (s.countIndex >= ch.word.length) {
      s.playerRows = [s.trueCounts.slice()];
      if (s.trueCounts.length <= 2) {
        finishMath(s);
        return;
      }
      s.phase = 'add';
      s.addRow = 1;
      s.addCol = 0;
      s.note = 'Add the neighbours. ' + s.trueCounts[0] + ' + ' + s.trueCounts[1] + ' ends in…';
      persist(s);
      return;
    }
    s.note = 'How many ' + ch.word[s.countIndex] + '?';
    persist(s);
    return;
  }
  if (s.phase === 'add') {
    const prev = s.trueAdd.rows[s.addRow - 1];
    const need = sumPair(prev[s.addCol], prev[s.addCol + 1]);
    if (n !== need) {
      s.mistakes += 1;
      s.shake = 0.35;
      s.note = 'Not that digit. ' + prev[s.addCol] + ' + ' + prev[s.addCol + 1] + ' ends in which number?';
      persist(s);
      return;
    }
    s.playerRows[s.addRow] = s.playerRows[s.addRow] || [];
    s.playerRows[s.addRow][s.addCol] = n;
    s.addCol += 1;
    const rowLen = prev.length - 1;
    if (s.addCol >= rowLen) {
      const filled = [];
      for (let i = 0; i < rowLen; i++) filled.push(s.playerRows[s.addRow][i]);
      s.playerRows[s.addRow] = filled;
      s.mercury = 0.45 + (s.addRow / Math.max(1, s.trueAdd.rows.length - 1)) * 0.45;
      if (rowLen <= 2) {
        finishMath(s);
        return;
      }
      s.addRow += 1;
      s.addCol = 0;
      const nextPrev = s.trueAdd.rows[s.addRow - 1];
      s.note = 'Next line. ' + nextPrev[0] + ' + ' + nextPrev[1] + ' ends in…';
      persist(s);
      return;
    }
    const nextPrev = s.trueAdd.rows[s.addRow - 1];
    s.note = nextPrev[s.addCol] + ' + ' + nextPrev[s.addCol + 1] + ' ends in…';
    persist(s);
  }
}

function finishMath(s) {
  const pct = s.trueAdd.pct;
  const key = normalizeKey(LOVE_CHAPTERS[s.level].bLabel ? [s.you, s.them] : [s.you]);
  rememberUse(s.level, key, pct);
  s.pct = pct;
  s.phase = 'result';
  s.reading = readingFor(s.level, pct);
  s.charged = false;
  s.mercury = 1;
  const drop = ordinaryFor(pct);
  const prize = LOVE_CHAPTERS[s.level].prize;
  const win = isLoveWin(s.level, pct) && !chapterPaid(s.level) && !s.won;
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'love');
    if (win) {
      keep(prize, 'love');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: 720, y: 200});
  s.hold = 1.3;
  s.note = s.reading;
  persist(s);
}

function hint(s) {
  if (s.phase === 'count') {
    s.hints += 1;
    s.note = 'Rosalie circles a letter. There are ' + s.trueCounts[s.countIndex] + ' ' + LOVE_CHAPTERS[s.level].word[s.countIndex] + '.';
    persist(s);
    return;
  }
  if (s.phase === 'add') {
    const prev = s.trueAdd.rows[s.addRow - 1];
    s.hints += 1;
    s.note = 'A red-pencil hint: ' + prev[s.addCol] + ' + ' + prev[s.addCol + 1] + ' ends in ' + sumPair(prev[s.addCol], prev[s.addCol + 1]) + '.';
    persist(s);
  }
}

export default {
  title: 'Love Tester',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  intro: alleyPlay
    ? 'Rosalie’s schoolyard fortune machine. Write the names. Count the letters. Add them down until 1–100 remains. A penny a sitting. The unique valentine only drops on tonight’s numbers. Same names, same answer — always. Not medical advice, even on the health sitting.'
    : 'Write the names, count the letters, add them down. Workshop sittings are free and write nothing.',
  instructions: alleyPlay
    ? 'Fill the paper. Count each letter of the chapter word, then add neighbours (ones digit only). Wrong counts are free to correct. A penny starts a new sitting. Same names will not be charged again.'
    : 'Type, count, add. Practice writes nothing.',
  levels: LOVE_CHAPTERS.map(c => c.title),
  sprites: ['rose-hair-bow', 'kindness-heart', 'ribbon-gift-box', 'friendship-pins', 'rose-press', 'rose-lockbox', 'rose-penny', 'heart-biscuit', 'everyday-penny', 'pressed-heart'],
  prizes: LOVE_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'read', label: 'Begin sitting · Enter'},
    {id: 'hint', label: 'A little hint'},
    {id: 'again', label: alleyPlay ? 'New sitting · 1 penny' : 'New sitting'},
  ],
  create(level) {
    const ch = LOVE_CHAPTERS[level] || LOVE_CHAPTERS[0];
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0,
      you: saved.you || '', them: saved.them || '', focus: saved.focus || 0,
      phase: saved.phase || 'edit',
      reads: saved.reads || 0, charged: !!saved.charged, launchId: saved.launchId || 0,
      shake: 0, mistakes: saved.mistakes || 0, hints: saved.hints || 0,
      trueCounts: saved.trueCounts || null,
      trueAdd: saved.trueCounts ? addDown(saved.trueCounts) : null,
      playerCounts: saved.playerCounts || [], countIndex: saved.countIndex || 0,
      playerRows: saved.playerRows || [], addRow: saved.addRow || 1, addCol: saved.addCol || 0,
      pct: saved.pct || 0, reading: saved.reading || '', hold: 0,
      won: !!saved.won, mercury: saved.mercury || 0,
      note: saved.note || (ch.aLabel + (ch.bLabel ? ' and ' + ch.bLabel.toLowerCase() : '') + '.'),
    };
    if (s.won || chapterPaid(level)) s.won = true;
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    s.shake = Math.max(0, (s.shake || 0) - dt);
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        const ch = LOVE_CHAPTERS[s.level];
        done(s, 'A valentine from Rosalie',
          itemName(ch.prize) + ' — struck on ' + s.pct + '. ' + s.reading,
          {prize: ch.prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && !s.result && s.hold > 0) {
      s.hold -= dt;
    }
  },
  pointer(s, type, p) {
    if (type !== 'down' || s.result) return;
    const ch = LOVE_CHAPTERS[s.level];
    const two = !!ch.bLabel;
    if (s.phase === 'edit' || s.phase === 'wait' || (s.phase === 'result' && !s.won)) {
      if (hit(p, plateBox(0, two))) { s.phase = 'edit'; s.focus = 0; return; }
      if (two && hit(p, plateBox(1, two))) { s.phase = 'edit'; s.focus = 1; return; }
      if (s.phase === 'edit') {
        for (let i = 0; i < KEYS.length; i++) if (hit(p, keyBox(i))) { typeInto(s, KEYS[i]); return; }
      }
    }
    if (s.phase === 'count' || s.phase === 'add') {
      for (let i = 0; i < DIGITS.length; i++) if (hit(p, digitBox(i))) { enterDigit(s, DIGITS[i]); return; }
    }
  },
  action(s, id) {
    if (id === 'read' || id === 'again') {
      if (s.phase === 'result' || s.phase === 'wait') {
        s.phase = 'edit';
        s.note = 'Change a name, then sit again.';
        persist(s);
        return;
      }
      beginAttempt(s);
    }
    if (id === 'hint') hint(s);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === 'Enter') this.action(s, 'read');
    if (k === 'Tab') {
      s.focus = s.focus ? 0 : 1;
      return;
    }
    if (s.phase === 'edit') {
      if (k === 'Backspace') typeInto(s, 'del');
      else if (k === ' ') typeInto(s, 'space');
      else if (/^[a-zA-Z]$/.test(k)) typeInto(s, k.toUpperCase());
    }
    if ((s.phase === 'count' || s.phase === 'add') && /^[0-9]$/.test(k)) enterDigit(s, k);
  },
  draw(s, d) {
    const ch = LOVE_CHAPTERS[s.level];
    const two = !!ch.bLabel;
    const jx = s.shake ? Math.sin(s.t * 40) * 8 : 0;
    const c = d.c;
    d.text('Rosalie’s tester', 450 + jx, 118, 28, '#5a2030');
    d.text(ch.title + ' · ' + ch.word, 450, 152, 22, '#7a3040');
    if (!s.won) {
      d.item(spriteKey(ch.prize), 800, 150, {w: 70, fallback: () => d.heart(800, 150, 28, '#c45a6a')});
      d.text('waiting', 800, 204, 14, '#a05060');
    }

    const tubeX = 46, tubeY = 250, tubeH = 220;
    roundRect(c, tubeX, tubeY, 22, tubeH, 10);
    c.fillStyle = '#f8e4e8';
    c.fill();
    c.strokeStyle = '#c45a6a';
    c.stroke();
    const fillH = Math.max(8, tubeH * Math.min(1, s.mercury || 0));
    roundRect(c, tubeX + 3, tubeY + tubeH - fillH - 3, 16, fillH, 8);
    c.fillStyle = '#c45a6a';
    c.fill();
    d.heart(tubeX + 11, tubeY + tubeH + 22, 12, '#c45a6a');

    const plates = two ? [0, 1] : [0];
    for (const which of plates) {
      const b = plateBox(which, two);
      const on = s.focus === which && s.phase === 'edit';
      roundRect(c, b.x + jx, b.y, b.w, b.h, 12);
      c.fillStyle = on ? '#fff0f4ee' : '#f8e4e8dd';
      c.fill();
      c.strokeStyle = on ? '#c45a6a' : '#e8a0b0';
      c.lineWidth = on ? 4 : 2;
      c.stroke();
      d.text(which === 0 ? ch.aLabel : ch.bLabel, b.x + b.w / 2, b.y + 22, 16, '#a05060');
      d.text((which === 0 ? s.you : s.them) || '…', b.x + b.w / 2, b.y + 52, 24, '#5a2030');
    }

    const names = two ? [lettersOnly(s.you), lettersOnly(s.them)] : [lettersOnly(s.you)];
    const letter = s.phase === 'count' ? ch.word[s.countIndex] : '';
    names.forEach((word, row) => {
      if (!word) return;
      const y = 300 + row * 36;
      const start = 450 - (word.length - 1) * 16;
      [...word].forEach((chh, i) => {
        const x = start + i * 32;
        const on = letter && chh === letter;
        if (on) d.circle(x, y - 6, 14, '#f8c8d088', '#c45a6a', 2);
        d.text(chh, x, y, 22, on ? '#c45a6a' : '#5a2030');
      });
    });

    if (s.phase === 'count' || s.phase === 'add' || s.phase === 'result') {
      const word = ch.word;
      for (let i = 0; i < word.length; i++) {
        const x = 450 - (word.length - 1) * 36 + i * 72;
        const on = s.phase === 'count' && i === s.countIndex;
        d.text(word[i], x, 390, 32, on ? '#c45a6a' : '#7a3040');
        const shown = s.playerCounts[i];
        d.text(shown == null ? '·' : String(shown), x, 428, 28, '#5a2030');
      }
    }

    if (s.phase === 'edit') {
      KEYS.forEach((k, i) => {
        const b = keyBox(i);
        roundRect(c, b.x, b.y, b.w, b.h, 8);
        c.fillStyle = '#5a2038ee';
        c.fill();
        d.text(k === 'space' ? '⎵' : k === 'del' ? '⌫' : k, b.x + b.w / 2, b.y + 34, 20, '#fff0f4');
      });
    }
    if (s.phase === 'count' || s.phase === 'add') {
      DIGITS.forEach((k, i) => {
        const b = digitBox(i);
        roundRect(c, b.x, b.y, b.w, b.h, 10);
        c.fillStyle = '#5a2038ee';
        c.fill();
        d.text(k, b.x + b.w / 2, b.y + 44, 28, '#fff6d8');
      });
    }

    if (s.trueAdd && (s.phase === 'add' || s.phase === 'result')) {
      s.trueAdd.rows.forEach((row, r) => {
        if (r === 0) return;
        const y = 470 + r * 36;
        const shown = s.phase === 'result' || r < s.addRow || (r === s.addRow && s.phase === 'add');
        if (!shown && s.phase !== 'result') return;
        row.forEach((n, i) => {
          const known = s.phase === 'result' || r < s.addRow || (r === s.addRow && i < s.addCol);
          const x = 450 - (row.length - 1) * 28 + i * 56;
          const value = s.phase === 'result' ? n : (s.playerRows[r] && s.playerRows[r][i] != null ? s.playerRows[r][i] : n);
          d.text(known ? String(value) : '·', x, y, 24, '#5a2030');
        });
      });
    }

    wrapLine(d, s.note, 450, 980, 22, '#7a3040', 720);
    if (s.phase === 'result' && s.pct) {
      d.text(String(s.pct), 450, 920, 48, '#c45a6a');
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.mistakes + ' slips · ' + s.hints + ' hints · ' + s.note;
  },
};
