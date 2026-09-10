import {clamp,done} from '../draw.js';
import {spriteKey} from '../prizes.js';

const puzzles = [['AABB', 'ACCB', 'ACDB', 'DDDD'], ['AAABB', 'ACCBB', 'ADCEE', 'DDDEE'], ['AABBB', 'AACBD', 'ECCDD', 'EECFD', 'EEFFF']];
const treasures = [
  {id: 'ticket-satchel', name: 'Ticket satchel'},
  {id: 'penny-purse', name: 'Penny purse'},
  {id: 'coin-sleeve', name: 'Coin sleeve'},
  {id: 'lucky-match', name: 'Lucky match'},
  {id: 'whisper-charm', name: 'Whisper charm'},
  {id: 'pocket-observatory', name: 'Pocket observatory'},
];
function normal(cells) {
  const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my]);
}
function rotate(p) { p.cells = normal(p.cells.map(([x, y]) => [-y, x])); }
function valid(s, p, x, y) {
  return p.cells.every(([cx, cy]) => {
    const a = x + cx, b = y + cy;
    return a >= 0 && b >= 0 && a < s.w && b < s.h && !s.pieces.some(q => q !== p && q.place && q.cells.some(([qx, qy]) => q.place.x + qx === a && q.place.y + qy === b));
  });
}
function choose(s, p) { s.active = p.id; s.ghost = {x: 1, y: 1}; s.note = treasures[p.id].name + ': turn it, then find a snug place.'; }
function place(s) {
  const p = s.pieces[s.active];
  if (!p || p.place) return;
  if (valid(s, p, s.ghost.x, s.ghost.y)) {
    p.place = {...s.ghost}; s.moves++; s.note = 'A snug fit. Nothing squashed.';
    if (s.pieces.every(q => q.place)) done(s, 'The impossible suitcase closes', 'Every treasure has its own little place. Packed in ' + s.moves + ' placements. Kit can finally catch the midnight train.');
  } else s.note = 'That overlaps a treasure or the cloth edge. Try another turn.';
}
function tray(i) { return {x: 230 + (i % 3) * 205, y: 955 + Math.floor(i / 3) * 118}; }
function selectNext(s) {
  let i = s.active;
  for (let n = 0; n < s.pieces.length; n++) { i = (i + 1) % s.pieces.length; if (!s.pieces[i].place) { choose(s, s.pieces[i]); return; } }
}
function stamp(d, p, x, y, size, alpha = 1) {
  const c = d.c;
  c.save(); c.globalAlpha = alpha * .55;
  const has = (x, y) => p.cells.some(a => a[0] === x && a[1] === y);
  for (const [cx, cy] of p.cells) {
    const a = x + cx * size, b = y + cy * size;
    d.poly([[a + 3, b + 6], [a + size - 1, b + 6], [a + size - 1, b + size], [a + 3, b + size]], '#2a261c33');
    d.poly([[a + 4, b + 4], [a + size - 4, b + 4], [a + size - 4, b + size - 4], [a + 4, b + size - 4]], '#ead9b488', '#d7c399', 1);
    for (const [dx, dy, x1, y1, x2, y2] of [[0, -1, a, b, a + size, b], [1, 0, a + size, b, a + size, b + size], [0, 1, a, b + size, a + size, b + size], [-1, 0, a, b, a, b + size]]) {
      if (!has(cx + dx, cy + dy)) d.line({x: x1, y: y1}, {x: x2, y: y2}, '#e8d6a2aa', 2);
    }
  }
  c.restore();
  const spanX = Math.max(...p.cells.map(c => c[0])) + 1, spanY = Math.max(...p.cells.map(c => c[1])) + 1;
  d.item(spriteKey(treasures[p.id].id), x + spanX * size / 2, y + spanY * size / 2, {
    w: Math.min(spanX, spanY) * size * .92, alpha, shadow: false,
    fallback: () => d.circle(x + spanX * size / 2, y + spanY * size / 2, size * .28, '#c3a071', '#e8d6a2', 2),
  });
}

export default {
  title: 'The Impossible Suitcase',
  intro: 'Kit promised to pack lightly. Kit brought a telescope. Real treasures, a felt packing cloth, and a very particular midnight departure.',
  instructions: 'Drag treasures from the lower shelf into the packing cloth. Rotate turns the selected treasure; it must fit without overlaps. You can lift packed pieces back out. Keyboard: arrows move the preview, R rotates, Enter places. Next treasure selects another. Kit’s sketch shows where one piece could go.',
  levels: ['A small overnight case', 'Just one more thing', 'The midnight expedition'],
  actions: [{id: 'rotate', label: 'Rotate · R'}, {id: 'place', label: 'Tuck it in · Enter'}, {id: 'next', label: 'Next treasure'}, {id: 'lift', label: 'Unpack selected'}, {id: 'hint', label: 'Kit’s sketch'}],
  create(level) {
    const grid = puzzles[level], w = grid[0].length, h = grid.length, size = 400 / w;
    const letters = [...new Set(grid.join(''))].sort();
    const pieces = letters.map((letter, id) => {
      const cells = [];
      grid.forEach((row, y) => [...row].forEach((v, x) => { if (v === letter) cells.push([x, y]); }));
      const origin = {x: Math.min(...cells.map(c => c[0])), y: Math.min(...cells.map(c => c[1]))};
      const p = {id, cells: normal(cells), original: normal(cells), origin, place: null};
      for (let r = 0; r < (id + level + 1) % 4; r++) rotate(p);
      return p;
    });
    return {level, w, h, size, x: 250, y: 390, pieces, active: 0, ghost: {x: 0, y: 0}, drag: null, moves: 0, hint: 0, note: 'Every case has a complete solution; nothing needs to be forced.'};
  },
  update(s, dt) { s.hint = Math.max(0, s.hint - dt); },
  pointer(s, type, p) {
    if (type === 'cancel') {
      if (s.drag) { const q = s.pieces[s.active]; q.place = s.drag.before; q.cells = s.drag.cells; s.drag = null; }
      return;
    }
    if (type === 'down') {
      for (const q of [...s.pieces].reverse()) {
        if (q.place) {
          const gx = Math.floor((p.x - s.x) / s.size) - q.place.x, gy = Math.floor((p.y - s.y) / s.size) - q.place.y;
          if (q.cells.some(c => c[0] === gx && c[1] === gy)) {
            const before = q.place; choose(s, q); s.ghost = {...before}; q.place = null;
            s.drag = {before, cells: q.cells.map(c => [...c]), off: {x: gx + .5, y: gy + .5}}; return;
          }
        } else {
          const t = tray(q.id);
          if (Math.abs(p.x - t.x) < 93 && Math.abs(p.y - t.y) < 55) {
            choose(s, q); s.drag = {before: null, cells: q.cells.map(c => [...c]), off: {x: .5, y: .5}}; return;
          }
        }
      }
    }
    if ((type === 'move' || type === 'up') && s.drag) {
      s.ghost = {x: Math.round((p.x - s.x) / s.size - s.drag.off.x), y: Math.round((p.y - s.y) / s.size - s.drag.off.y)};
      if (type === 'up') { place(s); s.drag = null; }
    }
  },
  action(s, id) {
    const p = s.pieces[s.active];
    if (id === 'rotate') { if (p.place) { s.ghost = {...p.place}; p.place = null; } rotate(p); }
    if (id === 'place') place(s);
    if (id === 'next') selectNext(s);
    if (id === 'lift' && p.place) { s.ghost = {...p.place}; p.place = null; }
    if (id === 'hint') s.hint = 5;
  },
  key(s, k, down) {
    if (!down) return;
    if (k === 'r') this.action(s, 'rotate');
    if (k === 'Enter') place(s);
    if (k.startsWith('Arrow')) {
      const p = s.pieces[s.active];
      if (p.place) { s.ghost = {...p.place}; p.place = null; }
      s.ghost.x = clamp(s.ghost.x + (k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : 0), 0, s.w - 1);
      s.ghost.y = clamp(s.ghost.y + (k === 'ArrowDown' ? 1 : k === 'ArrowUp' ? -1 : 0), 0, s.h - 1);
    }
  },
  draw(s, d) {
    const w = s.w * s.size, h = s.h * s.size, x = s.x, y = s.y;
    d.item(spriteKey('night-suitcase'), 450, 300, {w: 120, alpha: .9, fallback: () => d.text('KIT’S CASE', 450, 300, 16, '#e9d7a8')});
    d.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], '#d8cba055', '#eee0ba88', 2);
    for (let a = 0; a <= s.w; a++) for (let b = 0; b <= s.h; b++) d.circle(x + a * s.size, y + b * s.size, 1.4, '#9e947788');
    for (const q of s.pieces) if (q.place) stamp(d, q, x + q.place.x * s.size, y + q.place.y * s.size, s.size);
    const p = s.pieces[s.active];
    if (p && !p.place) {
      const ok = valid(s, p, s.ghost.x, s.ghost.y);
      stamp(d, p, x + s.ghost.x * s.size, y + s.ghost.y * s.size, s.size, .55);
      d.text(ok ? 'A little room here' : 'Not quite a fit', 450, y + h + 36, 17, ok ? '#365947' : '#6d3f31');
    }
    for (const q of s.pieces) {
      const t = tray(q.id);
      d.ellipse(t.x, t.y + 34, 72, 12, '#28312622');
      if (q.place) { d.text('✓ packed', t.x, t.y, 16, '#e4d7b5'); continue; }
      const spanX = Math.max(...q.cells.map(c => c[0])) + 1, spanY = Math.max(...q.cells.map(c => c[1])) + 1;
      const small = Math.min(34, 140 / spanX, 80 / spanY);
      stamp(d, q, t.x - spanX * small / 2, t.y - spanY * small / 2, small);
      if (q.id === s.active) d.ellipse(t.x, t.y + 48, 64, 7, null, '#e6ca8a', 2);
    }
    if (s.hint && p) {
      const c = d.c; c.save(); c.setLineDash([8, 5]);
      for (const [cx, cy] of p.original) {
        const a = x + (cx + p.origin.x) * s.size, b = y + (cy + p.origin.y) * s.size;
        d.poly([[a + 4, b + 4], [a + s.size - 4, b + 4], [a + s.size - 4, b + s.size - 4], [a + 4, b + s.size - 4]], '#fff5b122', '#705633', 3);
      }
      c.restore();
    }
  },
  readout: s => s.pieces.filter(p => p.place).length + ' / ' + s.pieces.length + ' treasures packed · ' + s.note,
};
