import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, credit} from '../wallet.js?v=booth-play-2';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  makePuzzle, proveUnique, resultNumber, isCabinetWin, ordinaryFor, CABINET_PRIZES,
} from '../cabinet-puzzles.js?v=first-prize-1';

const BOOK = 'pennyFever.cabinetThatLies';
const LEVELS = [
  'Three drawers, one honest card',
  'Two cards, four drawers',
  'One of the cards is lying',
  'The curtain moves a moth',
  'The looking-glass reverses',
  'Three voices, one truth',
];

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
  return b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}
function drawerBox(i, n) {
  const w = n > 3 ? 160 : 200, h = 150, gap = 18;
  const total = n * w + (n - 1) * gap;
  return {x: 450 - total / 2 + i * (w + gap), y: 560, w, h};
}
function clueBox(i) {
  return {x: 80, y: 240 + i * 78, w: 740, h: 68};
}

function emptyBook() {
  return {v: 1, tables: {}};
}
function readBook() {
  if (typeof localStorage === 'undefined') return emptyBook();
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1 && blob.tables) return blob;
  } catch {}
  return emptyBook();
}
function persist(s) {
  if (!alleyPlay || typeof localStorage === 'undefined' || !s) return;
  try {
    const book = readBook();
    book.tables[String(s.level)] = {
      seed: s.seed, phase: s.phase, opened: (s.opened || []).slice(),
      cluesOpen: (s.cluesOpen || []).slice(),
      curtain: !!s.curtain, glass: !!s.glass,
      curtainSeen: !!s.curtainSeen, glassSeen: !!s.glassSeen,
      inspect: s.inspect, choice: s.choice, mistakes: s.mistakes, hints: s.hints,
      paid: !!s.paid, won: !!s.won, resultN: s.resultN || 0,
      charged: !!s.charged, launchId: s.launchId || 0,
    };
    localStorage.setItem(BOOK, JSON.stringify(book));
  } catch {}
}

function emptyNote() {
  return alleyPlay ? 'A penny to open the cabinet.' : 'Open a practice mystery.';
}

function beginMystery(s) {
  if (s.phase === 'mystery') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (alleyPlay) {
        if (!takeAttempt('curios', s.level)) { s.note = retryNote(); return; }
      }
      s.charged = true;
      s.launchId = (s.launchId || 0) + 1;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 1 + s.level * 97;
    }
    s.puzzle = makePuzzle(s.level, s.seed);
    s.phase = 'mystery';
    s.opened = [];
    s.cluesOpen = s.puzzle.clues.map((_, i) => i === 0);
    s.curtain = false;
    s.glass = false;
    s.curtainSeen = false;
    s.glassSeen = false;
    s.inspect = -1;
    s.choice = -1;
    s.mistakes = 0;
    s.hints = 0;
    s.prizeKept = false;
    s.note = s.puzzle.rule;
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function inspectDrawer(s, drawer) {
  if (s.phase !== 'mystery' || s.choice >= 0 || !s.puzzle) return;
  const d = s.puzzle.drawers[drawer];
  if (!d) return;
  if (s.inspect === drawer) {
    accuse(s, drawer);
    return;
  }
  s.inspect = drawer;
  s.note = 'The ' + d.label + ' drawer. ' + d.color + ' handle, ' + d.emblem + ' mark. Tap again to name it.';
  persist(s);
}

function accuse(s, drawer) {
  if (s.phase !== 'mystery' || s.choice >= 0 || s.chargeLock) return;
  if (!s.puzzle || drawer < 0 || drawer >= s.puzzle.drawers.length) return;
  if (s.puzzle.kind === 'memory' && !s.curtainSeen) {
    s.note = 'Pull the curtain before you name a drawer.';
    return;
  }
  if (s.puzzle.kind === 'mirror' && !s.glassSeen) {
    s.note = 'Slide the looking-glass first.';
    return;
  }
  s.choice = drawer;
  s.phase = 'reveal';
  const ok = drawer === s.puzzle.solution;
  const n = resultNumber(s.seed);
  s.resultN = n;
  const prize = CABINET_PRIZES[s.level];
  if (!ok) {
    s.mistakes += 1;
    s.note = 'The ' + s.puzzle.drawers[drawer].label + ' drawer is empty. The curiosity was ' + s.puzzle.drawers[s.puzzle.solution].label + '.';
    s.charged = false;
    persist(s);
    return;
  }
  const drop = ordinaryFor(n);
  const win = isCabinetWin(s.level, n) && !s.paid;
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'curios');
    if (win) {
      keep(prize, 'curios');
      s.paid = true;
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) takePrize(s, prize, {x: 450, y: 200});
  s.note = 'THE DRAWER WAS TRUE. Result ' + n + (win ? '. ' + itemName(prize) + ' FOUND.' : '. A beautiful find — the unique still waits.');
  s.hold = 1.2;
  s.charged = false;
  persist(s);
}

export default {
  title: 'The Cabinet That Lies',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: alleyPlay
    ? 'A living sideshow cabinet. Several drawers. Several clues. Something is lying. A penny opens one mystery. Solve it for a 1–100 result; tonight’s numbers release this chapter’s curiosity. Wrong drawers never secretly move the answer.'
    : 'Inspect the clues, then name the drawer. Workshop mysteries are free and write nothing.',
  instructions: alleyPlay
    ? 'Open a clue card. Tap a drawer to inspect, tap again to accuse. A penny starts a new mystery. The unique only drops on a correct drawer and a winning number.'
    : 'Read the cards, inspect a drawer, tap again to name it. Practice writes nothing.',
  levels: LEVELS,
  sprites: ['clockwork-key', 'display-dome', 'clockwork-butterfly', 'tin-style-robot', 'crystal-cradle', 'curio-cabinet-album', 'cabinet-key', 'heart-gear', 'everyday-penny'],
  prizes: CABINET_PRIZES.slice(),
  actions: [
    {id: 'open', label: alleyPlay ? 'Open a mystery · 1 penny' : 'Open a practice mystery'},
    {id: 'hint', label: 'A small hint'},
    {id: 'curtain', label: 'Pull the curtain'},
    {id: 'glass', label: 'Slide the looking-glass'},
  ],
  persist,
  create(level) {
    const saved = alleyPlay ? (readBook().tables[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 1) * 7919,
      puzzle: saved.seed ? makePuzzle(level, saved.seed) : null,
      opened: saved.opened || [], cluesOpen: saved.cluesOpen || [],
      curtain: !!saved.curtain, glass: !!saved.glass,
      curtainSeen: !!saved.curtainSeen, glassSeen: !!saved.glassSeen,
      inspect: saved.inspect ?? -1,
      choice: saved.choice ?? -1, mistakes: saved.mistakes || 0, hints: saved.hints || 0,
      paid: !!saved.paid, won: !!saved.won, resultN: saved.resultN || 0,
      charged: !!saved.charged, launchId: saved.launchId || 0, hold: 0,
      note: saved.phase === 'mystery' ? 'The cabinet is still waiting.' : 'A penny opens a mystery.',
    };
    if (s.phase === 'mystery' && !s.puzzle) s.puzzle = makePuzzle(level, s.seed);
    if (s.puzzle && !proveUnique(s.puzzle)) s.puzzle = makePuzzle(level, s.seed);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.paid && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The cabinet told the truth, once',
          itemName(CABINET_PRIZES[s.level]) + ' — result ' + s.resultN + '.',
          {prize: CABINET_PRIZES[s.level], won: true});
      }
    }
  },
  pointer(s, type, p) {
    if (type !== 'down' || s.result) return;
    if (s.phase === 'idle') return;
    if (s.puzzle) {
      s.puzzle.clues.forEach((_, i) => {
        if (hit(p, clueBox(i))) {
          s.cluesOpen[i] = true;
          persist(s);
        }
      });
      if (s.phase === 'mystery') {
        s.puzzle.drawers.forEach((_, i) => {
          if (hit(p, drawerBox(i, s.puzzle.drawers.length))) inspectDrawer(s, i);
        });
      }
    }
  },
  action(s, id) {
    if (id === 'open') beginMystery(s);
    if (id === 'hint' && s.puzzle) {
      s.hints += 1;
      if (s.puzzle.kind === 'memory' && s.puzzle.memory) {
        s.note = 'A whisper: it started in the ' + s.puzzle.drawers[s.puzzle.memory.from].label + ' drawer.';
      } else if (s.puzzle.kind === 'mirror') {
        s.note = 'A whisper: the mark is a mirror. Name the opposite drawer.';
      } else {
        s.note = 'A whisper: the rule is still “' + s.puzzle.rule + '”';
      }
      persist(s);
    }
    if (id === 'curtain' && s.puzzle?.kind === 'memory') {
      s.curtain = !s.curtain;
      s.curtainSeen = true;
      s.note = s.curtain ? 'The curtain is closed. The moth has moved.' : 'The curtain is open. Remember the first drawer.';
      persist(s);
    } else if (id === 'curtain') {
      s.note = 'This chapter has no curtain.';
    }
    if (id === 'glass' && s.puzzle?.kind === 'mirror') {
      s.glass = !s.glass;
      s.glassSeen = true;
      s.note = s.glass ? 'The glass is over the cabinet. Left is right.' : 'The glass is set aside.';
      persist(s);
    } else if (id === 'glass' && s.puzzle && s.puzzle.kind !== 'mirror') {
      s.note = 'This chapter has no looking-glass.';
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ') this.action(s, 'open');
    if (s.phase === 'mystery' && s.puzzle && k >= '1' && k <= '4') inspectDrawer(s, Number(k) - 1);
  },
  draw(s, d) {
    const prize = CABINET_PRIZES[s.level];
    d.text('The Cabinet That Lies', 450, 118, 28, '#efe6d0');
    d.text(LEVELS[s.level], 450, 154, 20, '#d2b98c');
    if (!s.paid) {
      d.item(spriteKey(prize), 780, 138, {w: 70, fallback: () => d.star(780, 138, 24)});
      d.text('waiting', 780, 192, 14, '#ead6a4');
    }
    const c = d.c;
    if (!s.puzzle || s.phase === 'idle') {
      wrapLine(d, s.note, 450, 520, 24, '#f0d18f', 700);
      return;
    }
    wrapLine(d, s.puzzle.rule, 450, 196, 20, '#f0d18f', 760);
    s.puzzle.clues.forEach((clue, i) => {
      const b = clueBox(i);
      const open = s.cluesOpen[i];
      roundRect(c, b.x, b.y, b.w, b.h, 10);
      c.fillStyle = open ? '#3a2a18ee' : '#241810ee';
      c.fill();
      c.strokeStyle = '#e8c878';
      c.lineWidth = 2;
      c.stroke();
      d.text(open ? clue.text : 'Clue card ' + (i + 1) + ' — tap to slide up', b.x + b.w / 2, b.y + 42, 18, open ? '#fff6d8' : '#ead6a4');
    });
    const n = s.puzzle.drawers.length;
    s.puzzle.drawers.forEach((drawer, i) => {
      let show = i;
      if (s.puzzle.kind === 'mirror' && s.glass) show = n - 1 - i;
      const b = drawerBox(i, n);
      const chosen = s.choice === i;
      const inspecting = s.inspect === i && s.phase === 'mystery';
      const truth = s.phase === 'reveal' && s.puzzle.solution === i;
      roundRect(c, b.x, b.y, b.w, b.h, 12);
      c.fillStyle = truth ? '#3a4830ee' : chosen ? '#483018ee' : inspecting ? '#3a3020ee' : '#2a2018ee';
      c.fill();
      c.strokeStyle = truth ? '#c8e878' : inspecting ? '#f0d18f' : '#e8c878';
      c.lineWidth = inspecting || truth ? 4 : 3;
      c.stroke();
      const label = s.puzzle.drawers[show] ? s.puzzle.drawers[show].label : drawer.label;
      d.text(label, b.x + b.w / 2, b.y + 48, 22, '#fff6d8');
      d.text(drawer.emblem, b.x + b.w / 2, b.y + 86, 16, '#ead6a4');
      if (s.puzzle.kind === 'mirror' && s.glass && i === s.puzzle.glassMark) {
        d.star(b.x + b.w / 2, b.y + 118, 12, '#f0d18f');
      }
      if (s.puzzle.kind === 'memory' && s.puzzle.memory) {
        const mothHere = s.curtain ? i === s.puzzle.memory.to : i === s.puzzle.memory.from;
        if (mothHere) d.text('moth', b.x + b.w / 2, b.y + 118, 16, '#f0d18f');
      }
    });
    wrapLine(d, s.note, 450, 760, 22, '#fff6d8', 760);
    if (s.resultN) d.text('Result ' + s.resultN, 450, 1080, 28, '#f0d18f');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.mistakes + ' wrong drawers · ' + s.hints + ' hints · ' + s.note;
  },
};
