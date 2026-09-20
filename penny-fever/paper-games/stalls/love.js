import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, credit} from '../wallet.js?v=booth-play-2';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  LOVE_CHAPTERS, normalizeName, normalizeKey, countWord, addDown, sumPair,
  isLoveWin, readingFor, ordinaryFor, lettersOnly, repeatedLetters,
} from '../love-arithmetic.js?v=love-hole-enter-1';

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
  // Just under the title stack.
  const h = 64;
  if (!two) return {x: 260, y: 400, w: 380, h};
  const w = 168;
  return which === 0 ? {x: 250, y: 400, w, h} : {x: 482, y: 400, w, h};
}
function enterBox() {
  // Edit-only: under plates, above keyboard.
  return {x: 300, y: 520, w: 300, h: 48};
}
function namesReady(s) {
  const ch = LOVE_CHAPTERS[s.level] || LOVE_CHAPTERS[0];
  const you = normalizeName(s.you || '');
  if (!you) return false;
  if (ch.bLabel && !normalizeName(s.them || '')) return false;
  return true;
}
function keyBox(i) {
  // Bottom of cream hole — room above for how-many / add.
  const cols = 7, w = 52, h = 40, gap = 6;
  const row = Math.floor(i / cols), col = i % cols;
  const total = cols * w + (cols - 1) * gap;
  return {x: 450 - total / 2 + col * (w + gap), y: 880 + row * (h + gap), w, h};
}
function digitBox(i) {
  const w = 48, h = 48, gap = 6;
  const total = 10 * w + 9 * gap;
  return {x: 450 - total / 2 + i * (w + gap), y: 895, w, h};
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
      if ((s.phase === 'edit' || s.phase === 'wait') && hit(p, enterBox())) {
        if (namesReady(s)) this.action(s, 'read');
        else { s.note = 'Write both names, then Enter.'; persist(s); }
        return;
      }
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
    d.text('Rosalie’s tester', 450 + jx, 300, 22, '#5a2030');
    d.text(ch.title, 450, 328, 17, '#7a3040');
    // Big chapter word only while naming — during count/add the pyramid owns LOVES.
    if (s.phase === 'edit' || s.phase === 'wait') {
      d.text(ch.word, 450 + jx, 372, 42, '#c45a6a');
    }
    if (!s.won) {
      d.item(spriteKey(ch.prize), 640, 318, {w: 40, fallback: () => d.heart(640, 318, 16, '#c45a6a')});
      d.text('waiting', 640, 354, 11, '#a05060');
    }

    const tubeX = 218, tubeY = 300, tubeH = 64;
    roundRect(c, tubeX, tubeY, 22, tubeH, 10);
    c.fillStyle = '#f8e4e8';
    c.fill();
    c.strokeStyle = '#c45a6a';
    c.stroke();
    const fillH = Math.max(8, tubeH * Math.min(1, s.mercury || 0));
    roundRect(c, tubeX + 3, tubeY + tubeH - fillH - 3, 16, fillH, 8);
    c.fillStyle = '#c45a6a';
    c.fill();
    d.heart(tubeX + 11, tubeY + tubeH + 20, 11, '#c45a6a');

    const highlight = s.phase === 'count' ? (ch.word[s.countIndex] || '') : '';
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
      d.text(which === 0 ? ch.aLabel : ch.bLabel, b.x + b.w / 2, b.y + 20, 14, '#a05060');
      const raw = (which === 0 ? s.you : s.them) || '';
      const shown = raw || '\u2026';
      if (s.phase === 'count' && raw) {
        // Light matching letters inside the name plate — no second name layer.
        const chars = [...shown];
        const step = Math.min(22, (b.w - 24) / Math.max(1, chars.length));
        const start = b.x + b.w / 2 - (chars.length - 1) * step / 2;
        chars.forEach((chh, i) => {
          const hit = highlight && chh.toUpperCase() === highlight;
          const x = start + i * step + jx;
          const y = b.y + 48;
          if (hit) d.circle(x, y - 4, 12, '#f8c8d0cc', '#c45a6a', 2);
          d.text(chh, x, y, 22, hit ? '#c45a6a' : '#5a2030');
        });
      } else {
        d.text(shown, b.x + b.w / 2 + jx, b.y + 48, 22, '#5a2030');
      }
    }

    // Under plates: LOVES + counts (count) or full pyramid (add/result). No duplicate names.
    const word = ch.word;
    const colStep = 56;
    const rowStep = 42;
    const colX = (len, i) => 450 - (len - 1) * (colStep / 2) + i * colStep;
    const pyramidX = (rowLen, i) => {
      const inset = (word.length - rowLen) * (colStep / 2);
      return 450 - (word.length - 1) * (colStep / 2) + inset + i * colStep;
    };
    let calcY = 490;

    if (s.phase === 'count') {
      for (let i = 0; i < word.length; i++) {
        const on = i === s.countIndex;
        d.text(word[i], colX(word.length, i), calcY, 26, on ? '#c45a6a' : '#7a3040');
      }
      calcY += 36;
      for (let i = 0; i < word.length; i++) {
        const shown = s.playerCounts[i];
        d.text(shown == null ? '\u00b7' : String(shown), colX(word.length, i), calcY, 24, '#5a2030');
      }
    }

    if (s.phase === 'add' || s.phase === 'result') {
      for (let i = 0; i < word.length; i++) {
        d.text(word[i], colX(word.length, i), calcY, 26, '#7a3040');
      }
      calcY += rowStep;
      const rows = (s.trueAdd && s.trueAdd.rows) ? s.trueAdd.rows : [s.playerCounts || []];
      rows.forEach((row, r) => {
        const y = calcY + r * rowStep;
        const shown = s.phase === 'result' || r < s.addRow || (r === s.addRow && s.phase === 'add') || r === 0;
        if (!shown) return;
        const vals = r === 0 ? (s.playerCounts || row) : row;
        for (let i = 0; i < vals.length; i++) {
          const known = s.phase === 'result' || r === 0 || r < s.addRow || (r === s.addRow && i < s.addCol);
          let value;
          if (r === 0) value = s.playerCounts[i];
          else if (s.phase === 'result') value = row[i];
          else if (s.playerRows[r] && s.playerRows[r][i] != null) value = s.playerRows[r][i];
          else value = null;
          const x = r === 0 ? colX(word.length, i) : pyramidX(vals.length, i);
          d.text(known && value != null ? String(value) : '\u00b7', x, y, 24, '#5a2030');
        }
      });
    }


    if (s.phase === 'edit' || s.phase === 'wait') {
      const eb = enterBox();
      const ready = namesReady(s);
      roundRect(c, eb.x, eb.y, eb.w, eb.h, 14);
      c.fillStyle = ready ? '#c45a6aee' : '#a08088aa';
      c.fill();
      c.strokeStyle = ready ? '#5a2030' : '#806068';
      c.lineWidth = 2;
      c.stroke();
      d.text(ready ? 'Enter' : 'Enter names first', eb.x + eb.w / 2, eb.y + 34, 22, ready ? '#fff6f8' : '#f0e0e4');
    }

    if (s.phase === 'edit') {
      KEYS.forEach((k, i) => {
        const b = keyBox(i);
        roundRect(c, b.x, b.y, b.w, b.h, 8);
        c.fillStyle = '#5a2038ee';
        c.fill();
        d.text(k === 'space' ? '\u23b5' : k === 'del' ? '\u232b' : k, b.x + b.w / 2, b.y + 28, 18, '#fff0f4');
      });
    }
    if (s.phase === 'count' || s.phase === 'add') {
      DIGITS.forEach((k, i) => {
        const b = digitBox(i);
        roundRect(c, b.x, b.y, b.w, b.h, 10);
        c.fillStyle = '#5a2038ee';
        c.fill();
        d.text(k, b.x + b.w / 2, b.y + 34, 26, '#fff6d8');
      });
    }


    // Skip canvas note during edit — it was painting over the letter keyboard.
    // Count/add keep the prompt under the digit strip; readout still shows status.
    if (s.phase !== 'edit' && s.phase !== 'wait') {
      wrapLine(d, s.note, 450, 970, 20, '#7a3040', 720);
    }
    if (s.phase === 'result' && s.pct) {
      const rows = (s.trueAdd && s.trueAdd.rows) ? s.trueAdd.rows.length : 1;
      // Under word+counts+(pyramid rows after row 0)
      const pctY = Math.min(860, 490 + 42 + Math.max(1, rows) * 42 + 16);
      d.text(String(s.pct) + '%', 450, pctY, 44, '#c45a6a');
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.mistakes + ' slips · ' + s.hints + ' hints · ' + s.note;
  },
};
