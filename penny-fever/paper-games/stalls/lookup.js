import {done, TAU} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {
  CHAPTERS, createGame, start, beginTurn, previewTurn, endTurn, nudge, undo, hint, launch, tick, pointOnRay, mirrorEnds,
} from '../../experiments/celestes-starlight/model.js';

const GLASS = ['I', 'II', 'III', 'IV', 'V'];
const creatures = ['moon-rabbit', 'dapper-fox', 'moon-lantern'];

function guidance(s) {
  if (s.ray.solved) return 'You’ve made a path. Send the comet and wake the constellation.';
  if (s.ray.loop) return 'The light is going round in circles. Turn a glass.';
  if (s.ray.blocked === 'moon') return 'The moon is in the way. Guide the light around it.';
  if (s.ray.receiverLit) return 'The sky bell is lit. A few hanging stars still need your light.';
  return 'Glass ' + GLASS[s.selected] + ' selected. Tap to turn, or use ↶ and ↷.';
}

export default {
  title: 'A Little Starlight',
  intro: 'Celeste’s observatory is a paper sky you can hold. Turn the brass glasses until every hanging star is lit, then send a comet through the path you made.',
  instructions: 'Tap a glass to give it a notch, or drag it around. Light every star and the sky bell, then Send the comet. Arrows choose a glass; Left/Right or ↶↷ turn it. Z undoes, X offers a hint, Space sends when the path is ready. No timer, no lost lives.',
  levels: CHAPTERS.map(c => c.title),
  sprites: ['star-fragment', 'star-spectacles', 'pocket-observatory', 'moon-rabbit', 'dapper-fox', 'moon-lantern'],
  prizes: ['star-fragment', 'pocket-observatory', 'star-spectacles', 'sleepy-compass', 'midnight-invitation', 'star-fragment'],
  actions: [
    {id: 'left', label: '↶ Turn'},
    {id: 'right', label: '↷ Turn'},
    {id: 'send', label: 'Send the comet'},
    {id: 'undo', label: 'Undo'},
    {id: 'hint', label: 'A small hint'},
  ],
  create(level) {
    const s = createGame(level);
    s.level = level; s.t = 0; s.drag = null; s.note = CHAPTERS[level].line;
    return s;
  },
  update(s, dt, input) {
    if (s.phase === 'ready') start(s);
    s.t += dt;
    if (s.phase === 'playing' && !s.gesture) {
      const pick = (input.keys.has('ArrowRight') || input.actions.has('right') ? 1 : 0)
        - (input.keys.has('ArrowLeft') || input.actions.has('left') ? 1 : 0);
      if (pick && nudge(s, s.selected, pick)) s.note = guidance(s);
    }
    tick(s, dt, false);
    if (s.phase === 'won') {
      done(s, CHAPTERS[s.chapter].name + ' awakens', s.turns + ' turns, ' + s.hints + (s.hints === 1 ? ' hint' : ' hints') + '. Celeste folds the light into a little souvenir.');
    }
  },
  pointer(s, type, p) {
    if (s.phase !== 'playing') return;
    const mirrors = CHAPTERS[s.chapter].mirrors;
    if (type === 'down') {
      let index = -1, best = 78;
      mirrors.forEach((m, i) => { const d = Math.hypot(p.x - m[0], p.y - m[1]); if (d < best) { best = d; index = i; } });
      if (index < 0 || !beginTurn(s, index)) return;
      s.drag = {index, from: s.angles[index], cx: mirrors[index][0], cy: mirrors[index][1], last: Math.atan2(p.y - mirrors[index][1], p.x - mirrors[index][0]), total: 0, ox: p.x, oy: p.y, moved: false, center: best < 20};
    }
    if (type === 'move' && s.drag) {
      const a = Math.atan2(p.y - s.drag.cy, p.x - s.drag.cx);
      s.drag.total += Math.atan2(Math.sin(a - s.drag.last), Math.cos(a - s.drag.last));
      s.drag.last = a;
      if (Math.hypot(p.x - s.drag.ox, p.y - s.drag.oy) > 10) s.drag.moved = true;
      if (s.drag.moved) previewTurn(s, s.drag.from + (s.drag.center ? (p.x - s.drag.ox) * .01 : s.drag.total));
    }
    if ((type === 'up' || type === 'cancel') && s.drag) {
      const drag = s.drag; s.drag = null;
      if (type === 'cancel' || !drag.moved) {
        endTurn(s, true);
        if (type !== 'cancel') nudge(s, drag.index, 1);
      } else endTurn(s);
      s.note = guidance(s);
    }
  },
  action(s, id) {
    if (s.phase !== 'playing') return;
    if (id === 'left') nudge(s, s.selected, -1);
    if (id === 'right') nudge(s, s.selected, 1);
    if (id === 'send') launch(s);
    if (id === 'undo') undo(s);
    if (id === 'hint') {
      const h = hint(s);
      if (h) s.note = 'Glass ' + GLASS[h.index] + ': ' + h.text;
    }
    if (s.phase === 'playing') s.note = s.note || guidance(s);
  },
  key(s, k, down) {
    if (!down || s.phase !== 'playing') return;
    if (k === 'ArrowUp') s.selected = Math.max(0, s.selected - 1);
    if (k === 'ArrowDown') s.selected = Math.min(s.angles.length - 1, s.selected + 1);
    if (k === ' ') { if (s.ray.solved) launch(s); else nudge(s, s.selected, 1); }
    if (k === 'z') undo(s);
    if (k === 'x') this.action(s, 'hint');
    if (s.phase === 'playing') s.note = guidance(s);
  },
  draw(s, d) {
    const c = CHAPTERS[s.chapter], ray = s.phase === 'flying' ? s.frozenRay : s.ray;
    for (const seg of ray.segments) {
      d.line({x: seg.a[0], y: seg.a[1]}, {x: seg.b[0], y: seg.b[1]}, '#c5edf466', 6);
      d.line({x: seg.a[0], y: seg.a[1]}, {x: seg.b[0], y: seg.b[1]}, '#eef9d8', 1.6);
    }
    for (const moon of c.moons) {
      d.circle(moon[0], moon[1], moon[2], '#f1dfb2', '#ffebc0', 2);
      d.text('moon', moon[0], moon[1] + moon[2] + 22, 14, '#d9d3ba');
    }
    c.stars.forEach(([x, y], i) => {
      if (ray.lit[i]) d.glow(x, y, 48, '#ffda8a');
      d.item(spriteKey('star-fragment'), x, y, {
        w: ray.lit[i] ? 44 : 34, shadow: false,
        fallback: () => d.star(x, y, ray.lit[i] ? 20 : 16, ray.lit[i] ? '#f4d692' : '#54677f'),
      });
    });
    const [rx, ry] = c.receiver;
    if (ray.receiverLit) d.glow(rx, ry, 70);
    d.item(spriteKey('pocket-observatory'), rx, ry, {
      w: 70, shadow: false,
      fallback: () => { d.circle(rx, ry, 28, '#121f3e', '#caac6f', 3); d.star(rx, ry, 16, ray.receiverLit ? '#ffe8a6' : '#635e68'); },
    });
    c.mirrors.forEach((p, i) => {
      const [x, y] = p;
      if (s.selected === i) d.glow(x, y, 70, '#a5e4ee');
      d.ellipse(x, y, 48, 41, '#172c50', '#e0b773', 3);
      const [a, b] = mirrorEnds(p, s.angles[i]);
      d.line({x: a[0], y: a[1]}, {x: b[0], y: b[1]}, '#bd975c', 14);
      d.line({x: a[0], y: a[1]}, {x: b[0], y: b[1]}, '#a0d7e6', 8);
      d.item(spriteKey('star-spectacles'), x, y + 6, {
        w: 36, angle: s.angles[i], shadow: false, fallback: () => d.circle(x, y, 8, '#cda768'),
      });
      d.text(GLASS[i], x, y + 62, 18, s.selected === i ? '#d9ffff' : '#edce91');
    });
    if (s.phase === 'flying') {
      const p = pointOnRay(ray, s.flight);
      d.glow(p[0], p[1], 55);
      d.item(spriteKey('star-fragment'), p[0], p[1], {w: 36, shadow: false, fallback: () => d.star(p[0], p[1], 12, '#fffce3')});
    }
    if (s.phase === 'won') {
      d.item(spriteKey(creatures[s.chapter] || 'moon-rabbit'), 450, 620, {w: 160, fallback: () => d.star(450, 620, 40)});
      d.text(c.name, 450, 430, 22);
    }
  },
  readout: s => (s.ray?.lit.filter(Boolean).length || 0) + ' / ' + CHAPTERS[s.chapter].stars.length + ' stars · Glass ' + GLASS[s.selected] + ' · ' + (s.note || ''),
};
