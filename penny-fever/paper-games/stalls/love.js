import {clamp, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend} from '../wallet.js?v=loves-1';

const LOVES = ['L', 'O', 'V', 'E', 'S'];
const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(['space', 'del']);
const SUGGEST = ['Aura', 'Iris', 'Damien', 'Oliver', 'Calliope'];
const CHAPTERS = [
  {prize: 'rose-hair-bow', need: 0, title: 'First flutter'},
  {prize: 'rose-press', need: 40, title: 'A spark'},
  {prize: 'rose-lockbox', need: 55, title: 'Warm paper'},
  {prize: 'kindness-heart', need: 70, title: 'Sweet heat'},
  {prize: 'friendship-pins', need: 76, title: 'A true blush'},
  {prize: 'ribbon-gift-box', need: 84, title: 'Boil over'},
];

function crewName() {
  try {
    const id = (typeof localStorage !== 'undefined' && localStorage.getItem('pf-selected-crew-v1')) || 'oliver';
    return id[0].toUpperCase() + id.slice(1);
  } catch {
    return 'Oliver';
  }
}
function clean(s) { return String(s || '').toUpperCase().replace(/[^A-Z ]/g, '').replace(/\s+/g, ' ').trim(); }
function lovesCount(a, b) {
  const phrase = clean(a).replace(/ /g, '') + 'LOVES' + clean(b).replace(/ /g, '');
  return LOVES.map(ch => [...phrase].filter(c => c === ch).length);
}
function pyramid(counts) {
  const rows = [counts.slice()];
  while (rows[rows.length - 1].length > 2) {
    const prev = rows[rows.length - 1], next = [];
    for (let i = 0; i < prev.length - 1; i++) next.push((prev[i] + prev[i + 1]) % 10);
    rows.push(next);
  }
  const last = rows[rows.length - 1];
  const pct = last.length === 1 ? last[0] : last[0] * 10 + last[1];
  return {rows, pct};
}
function verdict(pct) {
  if (pct >= 80) return 'Boil over.';
  if (pct >= 65) return 'Sweet heat.';
  if (pct >= 45) return 'A warm little yes.';
  if (pct >= 25) return 'A spark, not a fire.';
  return 'Icy — but even ice melts.';
}
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
      ly += size + 7;
    } else line = trial;
  }
  if (line) d.text(line, x, ly, size, color);
  return ly;
}
function plateBox(which) {
  const w = 250, h = 64;
  return which === 0
    ? {x: 120, y: 378, w, h}
    : {x: 530, y: 378, w, h};
}
function keyBox(i) {
  const cols = 7, w = 52, h = 44, gap = 6;
  const row = Math.floor(i / cols), col = i % cols;
  const total = cols * w + (cols - 1) * gap;
  return {x: 450 - total / 2 + col * (w + gap), y: 548 + row * (h + gap), w, h};
}
function chipBox(i) {
  const w = 124, h = 36, gap = 8;
  const total = SUGGEST.length * w + (SUGGEST.length - 1) * gap;
  return {x: 450 - total / 2 + i * (w + gap), y: 500, w, h};
}
function hit(p, b) {
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}

function typeInto(s, ch) {
  if (s.phase !== 'edit') return;
  const key = s.focus === 0 ? 'you' : 'them';
  if (ch === 'del') s[key] = s[key].slice(0, -1);
  else if (ch === 'space') {
    if (s[key].length && s[key].length < 14 && !s[key].endsWith(' ')) s[key] += ' ';
  } else if (s[key].length < 14) s[key] += ch;
}

function sit(s) {
  if (s.result || s.won || s.phase === 'tally' || s.phase === 'pyramid') return;
  const you = clean(s.you), them = clean(s.them);
  if (!you || !them) { s.note = 'Two names, darling.'; return; }
  const key = you + '|' + them;
  if (s.lastKey === key) { s.note = 'Same names, same heat. Change one.'; return; }
  if (s.reads > 0) {
    if (alleyPlay && (pocket() || 0) < 1) {
      s.note = 'A penny for another sitting. Cash a ticket at Copper Falls for a five-penny stack.';
      return;
    }
    if (alleyPlay && !spend(1)) {
      s.note = 'Need a penny for another sitting.';
      return;
    }
  }
  s.counts = lovesCount(you, them);
  const py = pyramid(s.counts);
  s.rows = py.rows;
  s.pct = py.pct;
  s.reads += 1;
  s.lastKey = key;
  s.phase = 'tally';
  s.reveal = 0;
  s.note = you + ' loves ' + them + '.';
}

function maybeWin(s) {
  const ch = CHAPTERS[s.level];
  const hitNeed = s.pct >= ch.need;
  const pity = s.reads >= 5;
  if (!hitNeed && !pity) {
    s.phase = 'wait';
    s.note = pity ? s.note : (ch.need
      ? 'Rosalie wants ' + ch.need + '% this sitting. Try another name.'
      : 'The keepsake stayed in the drawer.');
    return;
  }
  s.won = true;
  s.hold = 1.2;
  s.phase = 'result';
  s.note = pity && !hitNeed
    ? 'Rosalie blots the page. A valentine anyway.'
    : 'A valentine in the heat.';
}

export default {
  title: 'Love Tester',
  intro: alleyPlay
    ? 'Rosalie’s old-school tester. Write two names. Count L O V E S, add the neighbours, and read the heat. A booth ticket sits you down. The first sitting of each chapter is included; another name costs a penny. Warmer chapters want a higher % — or she helps on the fifth try.'
    : 'Write two names. Count the loves. Add the neighbours until a percent remains. Workshop sittings are free.',
  instructions: alleyPlay
    ? 'Tap a name plate, type with the paper keys, or pick a suggestion. Read the names. If the % is warm enough for this chapter, the valentine is yours. Miss it and pay a penny to try another pair. Cash a booth ticket at Copper Falls if the purse is empty.'
    : 'Type two names and read them. Later chapters want a warmer percent.',
  levels: CHAPTERS.map(c => c.title),
  sprites: ['pressed-heart', 'rose-hair-bow', 'rose-press', 'rose-lockbox', 'kindness-heart', 'friendship-pins', 'ribbon-gift-box'],
  prizes: CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'read', label: 'Read the names · Space'},
    {id: 'again', label: alleyPlay ? 'Another sitting · 1 penny' : 'Another sitting'},
  ],
  create(level) {
    return {
      level, t: 0, you: crewName(), them: '', focus: 1, phase: 'edit',
      reads: 0, lastKey: '', counts: null, rows: null, pct: 0, reveal: 0, hold: 0,
      won: false, note: 'Who shall we ask about?',
    };
  },
  update(s, dt) {
    s.t += dt;
    if (s.phase === 'tally') {
      s.reveal += dt;
      if (s.reveal >= LOVES.length * 0.28 + 0.15) { s.phase = 'pyramid'; s.reveal = 0; }
    } else if (s.phase === 'pyramid') {
      s.reveal += dt;
      const rows = (s.rows || []).length;
      if (s.reveal >= rows * 0.32 + 0.2) { s.phase = 'result'; maybeWin(s); }
    }
    if (s.won && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        const ch = CHAPTERS[s.level];
        done(s, 'A valentine from Rosalie',
          itemName(ch.prize) + ' — ' + s.pct + '%. ' + verdict(s.pct),
          {prize: ch.prize, celebrate: false});
      }
    }
  },
  pointer(s, type, p) {
    if (type !== 'down' || s.result || s.won) return;
    if (s.phase === 'wait') {
      if (hit(p, plateBox(0)) || hit(p, plateBox(1))) {
        s.phase = 'edit';
        s.focus = hit(p, plateBox(0)) ? 0 : 1;
        s.note = 'Change a name, then read again.';
        return;
      }
    }
    if (s.phase === 'edit') {
      if (hit(p, plateBox(0))) { s.focus = 0; return; }
      if (hit(p, plateBox(1))) { s.focus = 1; return; }
      for (let i = 0; i < SUGGEST.length; i++) {
        if (hit(p, chipBox(i))) { s.them = SUGGEST[i]; s.focus = 1; s.note = 'And ' + SUGGEST[i] + '.'; return; }
      }
      for (let i = 0; i < KEYS.length; i++) {
        if (hit(p, keyBox(i))) { typeInto(s, KEYS[i]); return; }
      }
    }
  },
  action(s, id) {
    if (id === 'read' || id === 'again') sit(s);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ' || k === 'Enter') sit(s);
    if (k === 'Backspace' || k === 'del') typeInto(s, 'del');
  },
  draw(s, d) {
    const ch = CHAPTERS[s.level];
    d.text('Rosalie’s tester', 450, 188, 16, '#5a2030');
    d.text(ch.need ? ('This sitting wants ' + ch.need + '%') : 'Any reading will do', 450, 220, 15, '#7a3040');

    const c = d.c;
    for (const which of [0, 1]) {
      const b = plateBox(which);
      const on = s.focus === which && s.phase === 'edit';
      roundRect(c, b.x, b.y, b.w, b.h, 12);
      c.fillStyle = on ? '#fff0f4ee' : '#f8e4e8dd';
      c.fill();
      c.strokeStyle = on ? '#c45a6a' : '#e8a0b0';
      c.lineWidth = on ? 3 : 2;
      c.stroke();
      const label = which === 0 ? 'You' : 'Them';
      const value = which === 0 ? s.you : s.them;
      d.text(label, b.x + b.w / 2, b.y + 18, 12, '#a05060');
      d.text(value || '…', b.x + b.w / 2, b.y + 46, 20, '#5a2030');
    }
    d.text('loves', 450, 418, 18, '#c45a6a');

    const editing = s.phase === 'edit';
    if (editing) {
      SUGGEST.forEach((name, i) => {
        const b = chipBox(i);
        const on = s.them === name;
        roundRect(c, b.x, b.y, b.w, b.h, 10);
        c.fillStyle = on ? '#c45a6aee' : '#5a2038cc';
        c.fill();
        d.text(name, b.x + b.w / 2, b.y + 24, 14, on ? '#fff6d8' : '#f8e4e8');
      });
      KEYS.forEach((k, i) => {
        const b = keyBox(i);
        roundRect(c, b.x, b.y, b.w, b.h, 8);
        c.fillStyle = '#5a2038ee';
        c.fill();
        c.strokeStyle = '#e8a0b088';
        c.lineWidth = 1.5;
        c.stroke();
        const label = k === 'space' ? '⎵' : k === 'del' ? '⌫' : k;
        d.text(label, b.x + b.w / 2, b.y + 30, 16, '#fff0f4');
      });
    }

    if (s.counts && s.phase !== 'edit') {
      const shown = s.phase === 'tally' ? Math.min(LOVES.length, Math.floor(s.reveal / 0.28) + 1) : LOVES.length;
      for (let i = 0; i < shown; i++) {
        const x = 250 + i * 100;
        d.text(LOVES[i], x, 560, 22, '#c45a6a');
        d.text(String(s.counts[i]), x, 598, 28, '#5a2030');
      }
    }
    if (s.rows && (s.phase === 'pyramid' || s.phase === 'result' || s.phase === 'wait' || s.won)) {
      const shownRows = s.phase === 'pyramid' ? Math.min(s.rows.length, Math.floor(s.reveal / 0.32) + 1) : s.rows.length;
      for (let r = 1; r < shownRows; r++) {
        const row = s.rows[r];
        const y = 640 + (r - 1) * 36;
        const gap = 56;
        const x0 = 450 - ((row.length - 1) * gap) / 2;
        row.forEach((n, i) => d.text(String(n), x0 + i * gap, y, 22, '#7a3040'));
      }
    }

    if (s.phase === 'result' || s.phase === 'wait' || s.won) {
      roundRect(c, 130, 820, 640, 200, 18);
      c.fillStyle = '#3a1420f2';
      c.fill();
      c.strokeStyle = '#e8b0b8';
      c.lineWidth = 3;
      c.stroke();
      d.text(s.pct + '%', 450, 878, 48, '#fff6d8');
      d.text(verdict(s.pct), 450, 922, 20, '#f0d18f');
      wrapLine(d, s.note, 450, 958, 16, '#f8e4e8', 560);
      if (s.won) d.item(spriteKey(ch.prize), 720, 878, {w: 52, shadow: false, fallback: () => d.heart(720, 878, 18)});
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    const sits = s.reads + (s.reads === 1 ? ' sitting' : ' sittings');
    return purse + ' · ' + sits + ' · ' + s.note;
  },
};
