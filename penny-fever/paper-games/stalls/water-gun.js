import {done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  MARINA_CHAPTERS, GUNS, LANES, BURSTS, MIN_PRESSURE, BURST_LIFE,
  makeFleet, stepFleet, boatPose, fireBurst, advanceBurst, waterPoint,
  occluded, resultNumber, marinaUnique, ordinaryFor,
} from '../fleet.js?v=first-prize-1';

const BOOK = 'pennyFever.waterFleet';

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
function gunHit(p, g) {
  return Math.abs(p.x - g.x) < 48 && p.y > g.y - 70;
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
    phase: s.phase === 'burst' || s.phase === 'pump' ? 'play' : s.phase,
    seed: s.seed, charged: !!s.charged, burstsLeft: s.burstsLeft,
    gun: s.gun, uniqueHit: !!s.uniqueHit, hits: s.hits,
    fleet: s.fleet, won: !!s.won, note: s.note, resultN: s.resultN || 0,
    reduced: !!s.reduced,
  };
  writeBook(book);
}

function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function beginSit(s) {
  if (s.phase === 'play' || s.phase === 'pump' || s.phase === 'burst') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    if (!s.charged) {
      if (!takeAttempt('water-gun', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 1 + s.level * 23;
    }
    s.fleet = makeFleet(s.level, s.seed);
    s.phase = 'play';
    s.burstsLeft = BURSTS;
    s.gun = 2;
    s.pressure = 0;
    s.holding = false;
    s.burst = null;
    s.uniqueHit = false;
    s.hits = 0;
    s.resultN = 0;
    s.prizeKept = false;
    s.reduced = reducedMotion();
    s.note = 'Ten bursts. Hold a gun, lead the marked boat, release.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function fireNow(s) {
  if (s.phase !== 'play' && s.phase !== 'pump') return;
  if (s.burst || s.burstsLeft <= 0) return;
  const ch = MARINA_CHAPTERS[s.level];
  const burst = fireBurst(s.gun, s.pressure, ch.wind);
  s.holding = false;
  s.pressure = 0;
  if (!burst) {
    s.note = 'Hold to build pressure. A tap falls short.';
    s.phase = 'play';
    return;
  }
  s.burst = burst;
  s.burstsLeft -= 1;
  s.phase = 'burst';
  s.note = 'Burst ' + (BURSTS - s.burstsLeft) + ' of ' + BURSTS + '.';
  persist(s);
}

function afterBurst(s) {
  const b = s.burst;
  s.burst = null;
  s.phase = 'play';
  if (b?.uniqueHit) {
    s.uniqueHit = true;
    s.hits += 1;
    s.note = 'The marked boat takes the splash.';
    const n = resultNumber(s.seed);
    if (marinaUnique(s.level, n, true) && !chapterPaid(s.level) && !s.won) {
      finishSit(s, true);
      return;
    }
  } else if (b?.hit != null) {
    s.hits += 1;
    s.note = b.decoyHit ? 'A decoy. The marked boat is still out.' : 'A boat, but not the marked cargo.';
  } else {
    s.note = b?.decoyHit ? 'The decoy took it.' : 'Water and no hull. ' + s.burstsLeft + ' left.';
  }
  if (s.burstsLeft <= 0) finishSit(s, false);
  else persist(s);
}

function finishSit(s, fromUnique) {
  const n = resultNumber(s.seed);
  s.resultN = n;
  s.phase = 'result';
  s.charged = false;
  const prize = MARINA_CHAPTERS[s.level].prize;
  const win = marinaUnique(s.level, n, s.uniqueHit) && !chapterPaid(s.level) && !s.won;
  const drop = ordinaryFor(n);
  if (alleyPlay) {
    if (drop === 'everyday-penny') credit(1);
    else keep(drop, 'water-gun');
    if (win) {
      keep(prize, 'water-gun');
      markPaid(s.level);
      s.won = true;
    }
  } else if (win) s.won = true;
  if (win) {
    const boat = s.fleet?.boats.find(b => b.unique);
    const pose = boat ? boatPose(boat, s.fleet.t, MARINA_CHAPTERS[s.level]) : {x: 450, y: 500};
    takePrize(s, prize, {x: pose.x, y: pose.y});
  }
  s.hold = 1.2;
  if (fromUnique && win) s.note = 'The cargo hatch opens.';
  else if (s.uniqueHit) s.note = 'You soaked the marked boat.';
  else s.note = 'The marked boat kept its cargo.';
  persist(s);
}

export default {
  title: 'Water-Gun Fleet',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  intro: alleyPlay
    ? 'Marina’s paper harbour. A penny fills the tank with ten bursts. Hold a gun, lead the marked boat, release. The unique only drops if that cargo takes a hit and tonight’s numbers agree.'
    : 'Five guns. Hold to pressure, release one burst. Hit the marked boat. Workshop tanks are free and write nothing.',
  instructions: alleyPlay
    ? 'Sit for a penny — ten bursts. Tap a gun, hold to pressure, release. Lead the moving boat. Only the marked target opens the hatch.'
    : 'Choose a gun, hold, release. Practice writes nothing.',
  levels: MARINA_CHAPTERS.map(c => c.title),
  sprites: ['little-sailboat', 'message-bottle', 'harbour-washer', 'seaside-day-book', 'picnic-parcel', 'return-postcard', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: MARINA_CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'sit', label: alleyPlay ? 'Sit · 1 penny' : 'Sit down'},
    {id: 'pump', label: 'Hold to pressure', hold: true},
    {id: 'again', label: alleyPlay ? 'Another tank · 1 penny' : 'Another tank'},
  ],
  create(level) {
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const s = {
      level, t: 0, phase: saved.phase || 'idle', seed: saved.seed || (level + 4) * 2207,
      charged: !!saved.charged, burstsLeft: saved.burstsLeft ?? BURSTS,
      gun: saved.gun ?? 2, uniqueHit: !!saved.uniqueHit, hits: saved.hits || 0,
      fleet: saved.fleet || null, won: !!saved.won || chapterPaid(level),
      note: saved.note || (MARINA_CHAPTERS[level] || MARINA_CHAPTERS[0]).title + '. Sit when you are ready.',
      resultN: saved.resultN || 0, reduced: !!saved.reduced,
      pressure: 0, holding: false, burst: null, hold: 0,
    };
    if (s.phase === 'pump' || s.phase === 'burst') s.phase = 'play';
    if ((s.phase === 'play') && !s.fleet) s.fleet = makeFleet(level, s.seed);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (s.fleet && (s.phase === 'play' || s.phase === 'pump' || s.phase === 'burst')) {
      stepFleet(s.fleet, dt, s.reduced);
    }
    const pumping = s.holding || !!(input?.actions && input.actions.has('pump'));
    if ((s.phase === 'play' || s.phase === 'pump') && pumping && !s.burst) {
      s.phase = 'pump';
      s.pressure = Math.min(1, s.pressure + dt * 0.85);
    }
    if (s.phase === 'burst' && s.burst) {
      let left = dt;
      const step = 1 / 120;
      while (left > 0 && s.burst?.live) {
        const h = Math.min(step, left);
        advanceBurst(s.burst, h, s.fleet);
        left -= h;
      }
      if (!s.burst.live) afterBurst(s);
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The cargo hatch opened',
          itemName(MARINA_CHAPTERS[s.level].prize) + ' — ' + s.note,
          {prize: MARINA_CHAPTERS[s.level].prize, won: true});
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if (s.result) return;
    if (s.phase === 'idle' || s.phase === 'result') {
      if (type === 'down') beginSit(s);
      return;
    }
    if (s.phase === 'burst') return;
    if (type === 'cancel') {
      s.holding = false;
      s.pressure = 0;
      s.phase = 'play';
      return;
    }
    if (type === 'down') {
      const g = GUNS.find(gun => gunHit(p, gun));
      if (g) s.gun = g.id;
      s.holding = true;
      s.phase = 'pump';
      return;
    }
    if (type === 'move' && s.holding) {
      const g = GUNS.find(gun => gunHit(p, gun));
      if (g) s.gun = g.id;
    }
    if (type === 'up' && s.holding) {
      s.holding = false;
      fireNow(s);
    }
  },
  action(s, id, pressed) {
    if (id === 'sit' || id === 'again') {
      if (s.phase === 'result') {
        s.phase = 'idle';
        s.note = 'Another tank when you are ready.';
        persist(s);
        return;
      }
      if (pressed !== false) beginSit(s);
    }
    if (id === 'pump') {
      if (s.phase === 'idle' || s.phase === 'result' || s.phase === 'burst') return;
      if (pressed) {
        s.holding = true;
        s.phase = 'pump';
      } else if (s.holding) {
        s.holding = false;
        fireNow(s);
      }
    }
  },
  key(s, k, down) {
    if (k >= '1' && k <= '5' && down && (s.phase === 'play' || s.phase === 'pump')) {
      s.gun = Number(k) - 1;
      return;
    }
    if (k === ' ' || k === 'Enter') {
      if (s.phase === 'idle' || s.phase === 'result') {
        if (down) this.action(s, 'sit', true);
        return;
      }
      if (down && (s.phase === 'play' || s.phase === 'pump')) {
        s.holding = true;
        s.phase = 'pump';
      }
      if (!down && s.holding) {
        s.holding = false;
        fireNow(s);
      }
    }
  },
  draw(s, d) {
    const ch = MARINA_CHAPTERS[s.level];
    const c = d.c;
    d.text('Water-Gun Fleet', 450, 112, 28, '#efe6d0');
    d.text(ch.title, 450, 148, 20, '#d2b98c');
    {
      const owned = s.won || chapterPaid(s.level);
      d.item(spriteKey(ch.prize), 800, 148, {w: 66, fallback: () => d.star(800, 148, 22)});
      d.text(owned ? 'Collected' : 'Locked', 800, 202, 14, owned ? '#c8e878' : '#ead6a4');
    }

    LANES.forEach((y, i) => {
      d.line({x: 40, y}, {x: 860, y}, i === 1 ? '#7aa7a455' : '#7aa7a433', 2);
    });
    if (ch.hide) {
      roundRect(c, 380, 280, 140, 420, 12);
      c.fillStyle = '#243a44cc';
      c.fill();
      d.text('pier', 450, 500, 14, '#ead6a4');
    }

    if (s.fleet) {
      for (const boat of s.fleet.boats) {
        const pose = boatPose(boat, s.fleet.t, ch);
        const hid = occluded(pose.x, ch);
        const alpha = hid ? 0.28 : 1;
        c.save();
        c.globalAlpha = alpha;
        if (boat.unique) d.glow(pose.x, pose.y, 46, '#e8c878');
        d.item(spriteKey(boat.unique ? ch.prize : (boat.decoy ? 'message-bottle' : 'little-sailboat')), pose.x, pose.y, {
          w: boat.w, fallback: () => {
            d.ellipse(pose.x, pose.y + 10, boat.w * 0.45, 12, '#174f54', '#eac389', 2);
            d.line({x: pose.x, y: pose.y + 8}, {x: pose.x, y: pose.y - boat.w * 0.5}, '#ebc581', 3);
          },
        });
        if (boat.unique) d.text('cargo', pose.x, pose.y - 36, 13, '#fff6d8');
        c.restore();
      }
    }

    if (s.burst) {
      const gun = GUNS[s.burst.gun];
      const pts = [];
      for (let i = 1; i <= 10; i++) {
        const u = s.burst.age * i / 10;
        pts.push(waterPoint(gun, s.burst.pressure, u, s.burst.wind));
      }
      pts.forEach(pt => d.circle(pt.x, pt.y, 5, '#d4fff288'));
      d.circle(s.burst.x, s.burst.y, 8, '#e7fff0cc', '#9ad4c4', 1);
    } else if (s.phase === 'pump' || s.phase === 'play') {
      const gun = GUNS[s.gun];
      if (s.pressure > 0.05) {
        const aim = waterPoint(gun, s.pressure, BURST_LIFE, ch.wind);
        d.circle(aim.x1, aim.y1, 6, '#7aa7a466');
      }
    }

    for (const g of GUNS) {
      const sel = g.id === s.gun;
      d.poly([[g.x - 16, g.y + 10], [g.x + 16, g.y + 10], [g.x + 8, g.y - 18], [g.x - 8, g.y - 18]], sel ? '#c9a15a' : '#8a6a3a', '#eac389', 2);
      d.circle(g.x, g.y - 22, sel ? 10 : 8, sel ? '#f0d18f' : '#c9a15a', '#f0d6a8', 2);
      d.text(String(g.id + 1), g.x, g.y + 28, 14, sel ? '#fff6d8' : '#cbb890');
    }

    roundRect(c, 70, 200, 18, 90, 6);
    c.fillStyle = '#243a44ee';
    c.fill();
    const ph = s.pressure * 82;
    roundRect(c, 73, 286 - ph, 12, ph, 4);
    c.fillStyle = '#9ad4c4';
    c.fill();
    d.text('psi', 79, 310, 12, '#ead6a4');

    d.text(s.burstsLeft + ' left', 160, 188, 16, '#f0d6a8');

    wrapLine(d, s.note, 450, 1110, 20, '#f0d18f', 720);
    const n = alleyPlay ? pocket() : null;
    if (n == null) d.text('practice', 450, 1176, 16, '#ead6a4');
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    return purse + ' · ' + s.note;
  },
};
