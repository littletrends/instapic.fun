import {clamp, dist, done} from '../draw.js?v=ink-1';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend} from '../wallet.js?v=iris-cards-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const BACK = new URL('../assets/tarot-back.png', import.meta.url).href;
const FACE = new URL('../assets/tarot-face.png', import.meta.url).href;
const art = {back: null, face: null};
function loadArt() {
  [['back', BACK], ['face', FACE]].forEach(([k, src]) => {
    const img = new Image();
    img.onload = () => { art[k] = img; };
    img.src = src;
  });
}
if (typeof Image !== 'undefined') loadArt();

const TOPICS = [
  {id: 'love', label: 'Love', lead: 'In the heart — '},
  {id: 'work', label: 'Work', lead: 'In the day’s work — '},
  {id: 'family', label: 'Family', lead: 'At home — '},
  {id: 'health', label: 'Health', lead: 'In the body — '},
  {id: 'mystery', label: 'Mystery', lead: 'The tent says — '},
];
const SLOTS = ['Past', 'Present', 'Future'];
const MAJORS = [
  {id: 'fool', n: '0', name: 'The Fool', said: 'a first step, not a promise.'},
  {id: 'magician', n: 'I', name: 'The Magician', said: 'you already have the tools on the table.'},
  {id: 'priestess', n: 'II', name: 'The High Priestess', said: 'wait for the quiet answer, not the loud one.'},
  {id: 'empress', n: 'III', name: 'The Empress', said: 'something wants to grow if you let it.'},
  {id: 'emperor', n: 'IV', name: 'The Emperor', said: 'a firm line will help more than a new plan.'},
  {id: 'hierophant', n: 'V', name: 'The Hierophant', said: 'ask the old rule before you break it.'},
  {id: 'lovers', n: 'VI', name: 'The Lovers', said: 'a choice of the heart, not of convenience.'},
  {id: 'chariot', n: 'VII', name: 'The Chariot', said: 'hold both reins or the road chooses for you.'},
  {id: 'strength', n: 'VIII', name: 'Strength', said: 'gentleness will move what force cannot.'},
  {id: 'hermit', n: 'IX', name: 'The Hermit', said: 'a lantern of your own is enough tonight.'},
  {id: 'wheel', n: 'X', name: 'Wheel of Fortune', said: 'the turn is already underway.'},
  {id: 'justice', n: 'XI', name: 'Justice', said: 'what you put on the scale comes back even.'},
  {id: 'hanged', n: 'XII', name: 'The Hanged Man', said: 'pause. The view from upside-down is the gift.'},
  {id: 'death', n: 'XIII', name: 'Death', said: 'something finishes so the next thing can start.'},
  {id: 'temperance', n: 'XIV', name: 'Temperance', said: 'two measures, one cup. Mix, don’t pick.'},
  {id: 'devil', n: 'XV', name: 'The Devil', said: 'a habit dressed as a promise. Look twice.'},
  {id: 'tower', n: 'XVI', name: 'The Tower', said: 'a structure falls. What was true remains.'},
  {id: 'star', n: 'XVII', name: 'The Star', said: 'a small light after the noise. Follow it.'},
  {id: 'moon', n: 'XVIII', name: 'The Moon', said: 'not everything that shimmers is the path.'},
  {id: 'sun', n: 'XIX', name: 'The Sun', said: 'warmth, and a truth you can say out loud.'},
  {id: 'judgement', n: 'XX', name: 'Judgement', said: 'a call you have been pretending not to hear.'},
  {id: 'world', n: 'XXI', name: 'The World', said: 'a circle closes. You may step through.'},
];
const CHAPTERS = [
  {prize: 'fortune-slip', card: 'moon', title: 'A first whisper'},
  {prize: 'moon-lantern', card: 'star', title: 'A coin in the sky'},
  {prize: 'moon-brooch', card: 'priestess', title: 'The priestess keepsake'},
  {prize: 'fortune-journal', card: 'hermit', title: 'The hermit’s book'},
  {prize: 'moon-festival-fan', card: 'wheel', title: 'The turning fan'},
  {prize: 'paper-crown', card: 'world', title: 'The last crown'},
];
const DECK_N = [8, 10, 12, 16, 19, 22];
const CARD_W = 168, CARD_H = 252, CARD_Y = 548;

function mix(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function topicOf(id) { return TOPICS.find(t => t.id === id); }
function prizeCard(level) { return CHAPTERS[level]?.card; }
function prizeItem(level) { return CHAPTERS[level]?.prize; }
function cardBox(i) {
  return {x: 250 + i * 200 - CARD_W / 2, y: CARD_Y, w: CARD_W, h: CARD_H};
}
function chipBox(i) {
  const w = 160, h = 48, gap = 12;
  const row = i < 3 ? 0 : 1, col = i < 3 ? i : i - 3, n = row ? 2 : 3;
  const total = n * w + (n - 1) * gap;
  return {x: 450 - total / 2 + col * (w + gap), y: 378 + row * 56, w, h};
}
function hitChip(p) {
  for (let i = 0; i < TOPICS.length; i++) {
    const b = chipBox(i);
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return TOPICS[i].id;
  }
  return null;
}
function hitCard(p, s) {
  if (!s.hand) return -1;
  for (let i = 0; i < 3; i++) {
    const b = cardBox(i);
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return i;
  }
  return -1;
}

function dealHand(s) {
  const n = DECK_N[s.level] || 22;
  const keepId = prizeCard(s.level);
  const prize = MAJORS.find(m => m.id === keepId);
  const rest = mix(MAJORS.filter(m => m.id !== keepId)).slice(0, Math.max(0, n - 1));
  s.reads += 1;
  const pity = s.reads >= 5;
  let three;
  if (pity) {
    const extra = mix(rest).slice(0, 2);
    three = [extra[0], prize, extra[1]];
    s.note = 'Iris lays a card herself.';
  } else {
    three = mix([prize, ...rest]).slice(0, 3);
    s.note = s.reads === 1 ? 'Iris shuffles for you.' : 'A penny on the table. Iris shuffles.';
  }
  s.hand = three.map(card => ({card, flip: 0, turning: false}));
}

function shuffleDeck(s) {
  if (s.result || s.won || s.phase === 'shuffle' || s.phase === 'deal') return;
  if (s.phase === 'read') return;
  if (!s.topic) { s.note = 'Ask the tent something first.'; return; }
  if (s.reads > 0) {
    if (alleyPlay && (pocket() || 0) < 1) {
      s.note = 'A penny for another reading. Cash a ticket at Copper Falls for a five-penny stack.';
      return;
    }
    if (alleyPlay && !spend(1)) {
      s.note = 'Need a penny for another reading.';
      return;
    }
  }
  dealHand(s);
  s.phase = 'shuffle';
  s.anim = 0;
}

function turnCard(s, i) {
  if (!s.hand || !s.hand[i] || s.hand[i].flip > 0) return;
  s.hand[i].turning = true;
}

function finishIfFound(s) {
  if (s.won || !s.hand || s.hand.some(h => h.flip < 1)) return;
  const keepId = prizeCard(s.level);
  const slot = s.hand.findIndex(h => h.card.id === keepId);
  if (slot < 0) {
    s.phase = 'wait';
    s.note = 'The keepsake stayed in the deck. Another reading, if you like.';
    return;
  }
  s.won = true;
  s.foundSlot = slot;
  s.hold = 1.15;
  s.note = 'A keepsake was printed in the ' + SLOTS[slot] + '.';
  const box = cardBox(slot);
  takePrize(s, prizeItem(s.level), {x: box.x + box.w / 2, y: box.y + box.h / 2});
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

function blit(c, img, x, y, w, h, sx) {
  c.save();
  c.translate(x + w / 2, y + h / 2);
  c.scale(Math.max(0.04, sx), 1);
  roundRect(c, -w / 2, -h / 2, w, h, 16);
  c.clip();
  if (img) c.drawImage(img, -w / 2, -h / 2, w, h);
  else {
    c.fillStyle = sx > 0 ? '#efe6d0' : '#4a2058';
    c.fill();
  }
  c.restore();
}

function paintFace(d, card, x, y, w, h, sx, prize) {
  const c = d.c;
  blit(c, art.face, x, y, w, h, sx);
  if (sx < 0.35) return;
  c.save();
  c.translate(x + w / 2, y + h / 2);
  c.scale(sx, 1);
  d.text(card.n, 0, -h * 0.34, 15, '#7a4a88');
  d.text(card.name, 0, -h * 0.22, 13, '#4a2848');
  mark(c, card.id, 0, 8);
  if (prize) {
    d.glow(0, h * 0.28, 36, '#f0d18f');
    d.item(spriteKey(prize), 0, h * 0.30, {w: 48, shadow: false, fallback: () => d.star(0, h * 0.30, 14)});
    d.text('keepsake', 0, h * 0.42, 11, '#8a6230');
  }
  c.restore();
}

function mark(c, id, x, y) {
  c.save();
  c.translate(x, y);
  c.strokeStyle = '#c4a070';
  c.fillStyle = '#6a3a78';
  c.lineWidth = 2.2;
  c.beginPath();
  if (id === 'moon') {
    c.arc(-4, 0, 22, 0.4, Math.PI * 1.7);
    c.arc(8, 0, 16, Math.PI * 1.2, 0.5, true);
    c.fill();
  } else if (id === 'sun') {
    c.arc(0, 0, 12, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      c.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
      c.lineTo(Math.cos(a) * 26, Math.sin(a) * 26);
    }
    c.stroke();
  } else if (id === 'star' || id === 'fool') {
    c.translate(0, -2);
    c.moveTo(0, -22);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5, b = a + Math.PI / 5;
      c.lineTo(Math.cos(a) * 22, Math.sin(a) * 22);
      c.lineTo(Math.cos(b) * 9, Math.sin(b) * 9);
    }
    c.closePath(); c.fill();
  } else if (id === 'tower') {
    c.moveTo(-16, 22); c.lineTo(-8, -18); c.lineTo(8, -18); c.lineTo(16, 22); c.closePath(); c.fill();
  } else if (id === 'wheel' || id === 'chariot') {
    c.arc(0, 0, 20, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(0, 0, 7, 0, Math.PI * 2); c.fill();
  } else if (id === 'lovers' || id === 'empress') {
    c.moveTo(0, 16);
    c.bezierCurveTo(-24, 2, -14, -18, 0, -6);
    c.bezierCurveTo(14, -18, 24, 2, 0, 16);
    c.fill();
  } else if (id === 'hermit') {
    c.moveTo(0, -20); c.lineTo(0, 18); c.stroke();
    c.beginPath(); c.arc(0, -22, 8, 0, Math.PI * 2); c.fillStyle = '#e8c878'; c.fill();
  } else if (id === 'world') {
    c.arc(0, 0, 18, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.ellipse(0, 0, 8, 18, 0, 0, Math.PI * 2); c.stroke();
  } else if (id === 'priestess') {
    c.arc(0, -6, 14, 0, Math.PI * 2); c.fill();
    c.fillRect(-12, 8, 24, 16);
  } else {
    c.arc(0, 0, 16, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(0, -12); c.lineTo(8, 12); c.lineTo(-8, 12); c.closePath(); c.fill();
  }
  c.restore();
}

export default {
  title: 'Iris’s Reading',
  intro: alleyPlay
    ? 'Iris keeps a carnival tarot in the mystic tent. A penny sits you down. The first spread of each chapter is included; another reading costs a penny. Three cards — past, present, future. One card in the deck has this chapter’s keepsake printed in it. It may take a few sittings to appear.'
    : 'Iris’s workshop tarot. Choose a question, shuffle, and read past, present and future. A keepsake is printed on one card each chapter. Practice readings are free.',
  instructions: alleyPlay
    ? 'Pick a question. Shuffle. Turn the three cards. If the keepsake card is in the spread, it is yours. Miss it and pay a penny to shuffle again. The fifth sitting of a chapter, Iris helps. Cash a ticket on the bar for five pennies if the purse is empty.'
    : 'Pick a question, shuffle, and turn the three cards. The keepsake is hiding in the deck.',
  levels: CHAPTERS.map(c => c.title),
  sprites: ['fortune-slip', 'moon-penny', 'moon-brooch', 'fortune-journal', 'moon-festival-fan', 'paper-crown', 'moon-lantern'],
  prizes: CHAPTERS.map(c => c.prize),
  actions: [
    {id: 'shuffle', label: 'Shuffle · Space'},
    {id: 'again', label: alleyPlay ? 'Another reading · 1 penny' : 'Another reading'},
  ],
  create(level) {
    const s = {
      level, t: 0, topic: null, phase: 'pick', reads: 0, hand: null,
      anim: 0, hold: 0, won: false, foundSlot: -1,
      note: 'Ask the tent something. Then shuffle.',
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (s.phase === 'shuffle') {
      s.anim += dt;
      if (s.anim >= 0.85) {
        s.phase = 'deal';
        s.hand.forEach((h, i) => { h.turnIn = 0.25 + i * 0.32; });
      }
    }
    if (s.hand && (s.phase === 'deal' || s.phase === 'read')) {
      for (const h of s.hand) {
        if (h.turnIn != null) {
          h.turnIn -= dt;
          if (h.turnIn <= 0) { h.turning = true; h.turnIn = null; }
        }
        if (h.turning) {
          h.flip = Math.min(1, h.flip + dt * 2.6);
          if (h.flip >= 1) h.turning = false;
        }
      }
      if (s.hand.every(h => h.flip >= 1) && s.phase === 'deal') {
        s.phase = 'read';
        finishIfFound(s);
      }
    }
    if (s.won && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        const prize = prizeItem(s.level);
        const slot = SLOTS[s.foundSlot] || 'spread';
        done(s, 'A keepsake in the cards',
          itemName(prize) + ' was printed in the ' + slot + '. Iris closes the book.',
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
        s.note = 'A question of ' + topicOf(topic).label.toLowerCase() + '. Shuffle when you are ready.';
        return;
      }
    }
    if (s.phase === 'deal' || s.phase === 'read') {
      const i = hitCard(p, s);
      if (i >= 0) turnCard(s, i);
    }
  },
  action(s, id) {
    if (id === 'shuffle' || id === 'again') shuffleDeck(s);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ') shuffleDeck(s);
    if (k === '1') { s.topic = 'love'; s.note = 'A question of love.'; }
    if (k === '2') { s.topic = 'work'; s.note = 'A question of work.'; }
    if (k === '3') { s.topic = 'family'; s.note = 'A question of family.'; }
    if (k === '4') { s.topic = 'health'; s.note = 'A question of health.'; }
    if (k === '5') { s.topic = 'mystery'; s.note = 'Whatever the tent knows.'; }
  },
  draw(s, d) {
    const lead = s.topic ? topicOf(s.topic).lead : '';
    d.text('Iris’s tarot', 450, 178, 15, '#efe6d0');
    const showChips = s.phase === 'pick' || s.phase === 'wait' || !s.topic;
    if (showChips) {
      d.text(s.phase === 'wait' ? 'Ask again, or shuffle' : 'What shall she read?', 450, 358, 18, '#fff6d8');
      TOPICS.forEach((t, i) => {
        const b = chipBox(i);
        const on = s.topic === t.id;
        const c = d.c;
        roundRect(c, b.x, b.y, b.w, b.h, 12);
        c.fillStyle = on ? '#7a4488f2' : '#2a1838ee';
        c.fill();
        c.strokeStyle = on ? '#f0d18f' : '#e8c878cc';
        c.lineWidth = 2;
        c.stroke();
        d.text(t.label, b.x + b.w / 2, b.y + 32, 17, on ? '#fff6d8' : '#f3e2bd');
      });
    } else {
      d.text(topicOf(s.topic).label + ' · past · present · future', 450, 358, 18, '#fff6d8');
    }

    const shaking = s.phase === 'shuffle';
    for (let i = 0; i < 3; i++) {
      const b = cardBox(i);
      const jx = shaking ? Math.sin(s.t * 24 + i) * 8 : 0;
      const jy = shaking ? Math.cos(s.t * 18 + i * 2) * 6 : 0;
      d.text(SLOTS[i], b.x + b.w / 2, b.y - 14, 13, '#ead6a4');
      const h = s.hand && s.hand[i];
      if (!h) {
        blit(d.c, art.back, b.x + jx, b.y + jy, b.w, b.h, 1);
        continue;
      }
      const flip = shaking ? 0 : h.flip;
      const sx = Math.abs(Math.cos(flip * Math.PI));
      const showFace = flip >= 0.5;
      if (showFace) {
        const isPrize = h.card.id === prizeCard(s.level);
        paintFace(d, h.card, b.x, b.y, b.w, b.h, sx, isPrize ? prizeItem(s.level) : null);
      } else {
        blit(d.c, art.back, b.x + jx, b.y + jy, b.w, b.h, sx);
      }
    }

    if ((s.phase === 'read' || s.phase === 'wait' || s.won) && s.hand && s.hand.some(h => h.flip >= 1)) {
      const c = d.c;
      roundRect(c, 130, 816, 640, 196, 18);
      c.fillStyle = '#1a1028f2';
      c.fill();
      c.strokeStyle = '#e8c878';
      c.lineWidth = 3;
      c.stroke();
      const names = s.hand.map((h, i) => SLOTS[i] + ': ' + (h.flip >= 1 ? h.card.name : '…')).join('   ·   ');
      d.text(names, 450, 848, 15, '#e8c878');
      const spoken = (s.hand[1] && s.hand[1].flip >= 1) ? s.hand[1] : s.hand.find(h => h.flip >= 1);
      const bodyY = wrapLine(d, lead + spoken.card.said, 450, 888, 22, '#fff6d8', 580);
      wrapLine(d, s.note, 450, bodyY + 28, 16, '#f0d18f', 580);
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    const sits = s.reads + (s.reads === 1 ? ' sitting' : ' sittings');
    return purse + ' · ' + sits + ' · ' + s.note;
  },
};
