import {clamp, done, TAU} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend} from '../wallet.js?v=iris-ball-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const TOPICS = [
  {id: 'love', label: 'Love', lead: 'In the heart — '},
  {id: 'work', label: 'Work', lead: 'In the day’s work — '},
  {id: 'family', label: 'Family', lead: 'At home — '},
  {id: 'health', label: 'Health', lead: 'In the body — '},
  {id: 'mystery', label: 'Mystery', lead: 'The glass says — '},
];
const GLIMPSES = [
  {id: 'moon', name: 'The Moon', said: 'not everything that shimmers is the path.'},
  {id: 'star', name: 'The Star', said: 'a small light after the noise. Follow it.'},
  {id: 'sun', name: 'The Sun', said: 'warmth, and a truth you can say out loud.'},
  {id: 'wheel', name: 'The Wheel', said: 'the turn is already underway.'},
  {id: 'hermit', name: 'The Lantern', said: 'a light of your own is enough tonight.'},
  {id: 'priestess', name: 'The Veil', said: 'wait for the quiet answer, not the loud one.'},
  {id: 'world', name: 'The Circle', said: 'a circle closes. You may step through.'},
  {id: 'tower', name: 'The Fall', said: 'a structure falls. What was true remains.'},
];
const CHAPTERS = [
  {prize: 'fortune-slip', vision: 'moon', title: 'A first whisper'},
  {prize: 'moon-lantern', vision: 'star', title: 'A coin in the sky'},
  {prize: 'moon-brooch', vision: 'priestess', title: 'The veil keepsake'},
  {prize: 'fortune-journal', vision: 'hermit', title: 'The lantern’s book'},
  {prize: 'moon-festival-fan', vision: 'wheel', title: 'The turning fan'},
  {prize: 'paper-crown', vision: 'world', title: 'The last crown'},
];

function mix(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function topicOf(id) { return TOPICS.find(t => t.id === id); }
function prizeVision(level) { return CHAPTERS[level]?.vision; }
function prizeItem(level) { return CHAPTERS[level]?.prize; }
function chipBox(i) {
  const w = 160, h = 48, gap = 12;
  const row = i < 3 ? 0 : 1, col = i < 3 ? i : i - 3, n = row ? 2 : 3;
  const total = n * w + (n - 1) * gap;
  return {x: 450 - total / 2 + col * (w + gap), y: 318 + row * 56, w, h};
}
function hitChip(p) {
  for (let i = 0; i < TOPICS.length; i++) {
    const b = chipBox(i);
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return TOPICS[i].id;
  }
  return null;
}
function hitBall(p) {
  return Math.hypot(p.x - 450, p.y - 640) <= 168;
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

function buildParade(s) {
  const keepId = prizeVision(s.level);
  const prize = GLIMPSES.find(g => g.id === keepId) || GLIMPSES[0];
  const rest = mix(GLIMPSES.filter(g => g.id !== keepId));
  s.reads += 1;
  const pity = s.reads >= 5;
  const n = 4 + s.level;
  let parade;
  if (pity) {
    parade = [rest[0], rest[1], prize];
    s.note = 'Iris steadies the glass for you.';
  } else {
    parade = mix([prize, ...rest]).slice(0, n);
    if (!parade.some(g => g.id === keepId)) parade[n - 2] = prize;
    s.note = s.reads === 1 ? 'Look into the ball. Tap when the keepsake swims forward.' : 'A penny on the cloth. Gaze again.';
  }
  s.parade = parade;
  s.cursor = 0;
  s.dwell = 0;
  s.hold = 0;
  s.caught = null;
}

function gaze(s) {
  if (s.result || s.won || s.phase === 'swirl' || s.phase === 'seek') return;
  if (!s.topic) { s.note = 'Ask the tent something first.'; return; }
  if (s.reads > 0) {
    if (alleyPlay && (pocket() || 0) < 1) {
      s.note = 'A penny for another gaze. Cash a ticket at Copper Falls for a five-penny stack.';
      return;
    }
    if (alleyPlay && !spend(1)) {
      s.note = 'Need a penny for another gaze.';
      return;
    }
  }
  buildParade(s);
  s.phase = 'swirl';
  s.anim = 0;
}

function currentGlimpse(s) {
  if (!s.parade || !s.parade.length) return null;
  return s.parade[Math.min(s.cursor, s.parade.length - 1)];
}

function tryCatch(s) {
  if (s.won || s.result || s.phase !== 'seek') return;
  const g = currentGlimpse(s);
  if (!g) return;
  const keepId = prizeVision(s.level);
  const front = s.dwell > 0.12 && s.dwell < 0.92;
  if (g.id === keepId && front) {
    s.won = true;
    s.caught = g;
    s.phase = 'read';
    s.hold = 1.2;
    s.note = g.name + ' fills the glass.';
    takePrize(s, prizeItem(s.level), {x: 450, y: 640});
    return;
  }
  s.caught = g;
  s.phase = 'wait';
  s.note = 'A glimpse, not the keepsake. Gaze again if you like.';
}

export default {
  title: 'Iris’s Reading',
  intro: alleyPlay
    ? 'Iris keeps a crystal ball in the mystic tent. A penny sits you down. Gaze into the glass. The chapter’s keepsake swims in the mist — tap when it comes forward. Miss it and another gaze costs a penny. The fifth sitting, Iris steadies the ball. Cash a ticket on the bar for five pennies if the purse is empty.'
    : 'Iris’s workshop crystal. Choose a question, gaze, and tap when the keepsake fills the glass. Practice readings are free.',
  instructions: alleyPlay
    ? 'Pick a question. Gaze. Tap the ball when the keepsake is largest in the glass. Wrong glimpses are only a reading. Fifth sitting, Iris holds it still.'
    : 'Pick a question, gaze, and tap the ball when the keepsake swims forward.',
  levels: CHAPTERS.map(c => c.title),
  sprites: ['fortune-slip', 'moon-penny', 'moon-brooch', 'fortune-journal', 'moon-festival-fan', 'paper-crown', 'moon-lantern'],
  prizes: CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'gaze', label: 'Gaze · Space'},
    {id: 'again', label: alleyPlay ? 'Another gaze · 1 penny' : 'Another gaze'},
  ],
  create(level) {
    const s = {
      level, t: 0, topic: null, phase: 'pick', reads: 0,
      parade: null, cursor: 0, dwell: 0, anim: 0, hold: 0,
      won: false, caught: null,
      note: 'Ask the tent something. Then gaze.',
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (s.phase === 'swirl') {
      s.anim += dt;
      if (s.anim >= 0.9) {
        s.phase = 'seek';
        s.cursor = 0;
        s.dwell = 0;
      }
    }
    if (s.phase === 'seek' && s.parade) {
      const span = s.reads >= 5 ? 1.35 : 0.72;
      s.dwell += dt;
      if (s.dwell >= span) {
        s.dwell = 0;
        s.cursor += 1;
        if (s.cursor >= s.parade.length) {
          s.phase = 'wait';
          s.note = 'The mist closed. Gaze again if you like.';
        }
      }
    }
    if (s.won && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        const prize = prizeItem(s.level);
        done(s, 'A keepsake in the glass',
          itemName(prize) + ' swam up in the ball. Iris covers the cloth.',
          {prize, celebrate: false});
      }
    }
  },
  pointer(s, type, p) {
    if (type !== 'down' || s.result || s.won) return;
    if (s.phase === 'pick' || s.phase === 'wait') {
      const topic = hitChip(p);
      if (topic) {
        s.topic = topic;
        s.note = 'A question of ' + topicOf(topic).label.toLowerCase() + '. Gaze when you are ready.';
        return;
      }
    }
    if (s.phase === 'seek' && hitBall(p)) tryCatch(s);
    if ((s.phase === 'pick' || s.phase === 'wait') && s.topic && hitBall(p)) gaze(s);
  },
  action(s, id) {
    if (id === 'gaze' || id === 'again') gaze(s);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ') gaze(s);
    if (k === '1') { s.topic = 'love'; s.note = 'A question of love.'; }
    if (k === '2') { s.topic = 'work'; s.note = 'A question of work.'; }
    if (k === '3') { s.topic = 'family'; s.note = 'A question of family.'; }
    if (k === '4') { s.topic = 'health'; s.note = 'A question of health.'; }
    if (k === '5') { s.topic = 'mystery'; s.note = 'Whatever the glass knows.'; }
  },
  draw(s, d) {
    const c = d.c;
    const lead = s.topic ? topicOf(s.topic).lead : '';
    d.text('Iris’s crystal', 450, 168, 15, '#efe6d0');

    const showChips = s.phase === 'pick' || s.phase === 'wait' || !s.topic;
    if (showChips) {
      d.text(s.phase === 'wait' ? 'Ask again, or gaze' : 'What shall she read?', 450, 292, 18, '#fff6d8');
      TOPICS.forEach((t, i) => {
        const b = chipBox(i);
        const on = s.topic === t.id;
        roundRect(c, b.x, b.y, b.w, b.h, 12);
        c.fillStyle = on ? '#7a4488f2' : '#2a1838ee';
        c.fill();
        c.strokeStyle = on ? '#f0d18f' : '#e8c878cc';
        c.lineWidth = 2;
        c.stroke();
        d.text(t.label, b.x + b.w / 2, b.y + 32, 17, on ? '#fff6d8' : '#f3e2bd');
      });
    } else {
      d.text(topicOf(s.topic).label + ' · look into the glass', 450, 300, 18, '#fff6d8');
    }

    const cx = 450, cy = 640, r = 168;
    d.ellipse(cx + 8, 860, 120, 22, '#12233566');
    roundRect(c, cx - 70, 808, 140, 36, 8);
    c.fillStyle = '#4a3058';
    c.fill();
    c.strokeStyle = '#e8c878';
    c.lineWidth = 2;
    c.stroke();

    const g = c.createRadialGradient(cx - 40, cy - 50, 20, cx, cy, r);
    g.addColorStop(0, '#c8b8f0cc');
    g.addColorStop(0.45, '#6a4a98aa');
    g.addColorStop(1, '#241038ee');
    c.beginPath();
    c.arc(cx, cy, r, 0, TAU);
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = '#f0d18fcc';
    c.lineWidth = 4;
    c.stroke();

    c.save();
    c.beginPath();
    c.arc(cx, cy, r - 8, 0, TAU);
    c.clip();
    const mist = s.phase === 'swirl' ? 1 : s.phase === 'seek' ? 0.35 : 0.18;
    for (let i = 0; i < 18; i++) {
      const a = s.t * (0.4 + i * 0.03) + i;
      d.circle(
        cx + Math.cos(a) * (40 + (i % 5) * 18),
        cy + Math.sin(a * 1.3) * (30 + (i % 4) * 16),
        18 + (i % 3) * 8,
        `rgba(240,220,255,${0.04 + mist * 0.08})`,
      );
    }
    const glimpse = (s.phase === 'seek' || s.phase === 'read' || (s.phase === 'wait' && s.caught))
      ? (s.phase === 'seek' ? currentGlimpse(s) : s.caught)
      : null;
    if (glimpse) {
      const span = s.reads >= 5 ? 1.35 : 0.72;
      const u = s.phase === 'seek' ? clamp(s.dwell / span, 0, 1) : 1;
      const scale = s.phase === 'seek' ? (0.55 + Math.sin(u * Math.PI) * 0.55) : 1;
      const keep = glimpse.id === prizeVision(s.level);
      if (keep) d.glow(cx, cy, 90 * scale, '#f0d18f');
      const prize = keep ? prizeItem(s.level) : null;
      if (prize) d.item(spriteKey(prize), cx, cy + 10, {w: 88 * scale, shadow: false, fallback: () => d.star(cx, cy, 28 * scale)});
      else d.star(cx, cy, 26 * scale, keep ? '#f0d18f' : '#c8b8f0');
      d.text(glimpse.name, cx, cy + 86, 16, '#fff6d8');
    } else if (s.phase === 'swirl') {
      d.text('the mist turns', cx, cy + 8, 18, '#efe6d0');
    } else {
      d.text('the glass waits', cx, cy + 8, 18, '#c8b8d8');
    }
    c.restore();

    c.beginPath();
    c.ellipse(cx - 48, cy - 70, 36, 16, -0.5, 0, TAU);
    c.fillStyle = '#ffffff33';
    c.fill();

    if (s.phase === 'read' || s.phase === 'wait') {
      roundRect(c, 130, 900, 640, 150, 18);
      c.fillStyle = '#1a1028f2';
      c.fill();
      c.strokeStyle = '#e8c878';
      c.lineWidth = 3;
      c.stroke();
      const spoken = s.caught;
      if (spoken) wrapLine(d, lead + spoken.said, 450, 938, 20, '#fff6d8', 580);
      wrapLine(d, s.note, 450, spoken ? 1004 : 948, 16, '#f0d18f', 580);
    } else {
      d.text(s.note, 450, 980, 16, '#f0d18f');
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    const sits = s.reads + (s.reads === 1 ? ' sitting' : ' sittings');
    return purse + ' · ' + sits + ' · ' + s.note;
  },
};
