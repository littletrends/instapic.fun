import {dist,lerp,done,clamp} from '../draw.js';
import {spriteKey} from '../prizes.js';

const paths = [[12, 8, 4, 5, 1], [12, 13, 9, 5, 4, 0, 1], [12, 8, 9, 10, 6, 2, 1]];
const vectors = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
const keyIds = ['clockwork-key', 'cabinet-key', 'heart-gear'];
const home = {x: 450, y: 255};
const centre = i => ({x: 247.5 + (i % 4) * 135, y: 520 + Math.floor(i / 4) * 128});
function direction(a, b) { if (b === a - 4) return 0; if (b === a + 1) return 1; if (b === a + 4) return 2; return 3; }
function ports(tile) { return tile.base.map(p => (p + tile.rot) % 4); }
function launch(s) {
  s.walk = [{x: 175, y: 900}]; s.visited = [];
  let i = 12, enter = 3, seen = new Set(), valid = false;
  while (!seen.has(i)) {
    seen.add(i);
    const c = centre(i), p = ports(s.tiles[i]);
    if (!p.includes(enter)) { s.note = 'A track mouth is turned away. The traveller will show you where.'; break; }
    s.walk.push(c); s.visited.push(i);
    const out = p.find(x => x !== enter), v = vectors[out], r = Math.floor(i / 4), col = i % 4;
    if (i === 1 && out === 0) {
      s.walk.push(home);
      valid = s.keys.every(k => seen.has(k));
      s.note = valid ? 'All three winding keys are on the route.' : 'The route reaches the door but misses a winding key.';
      break;
    }
    const nr = r + v.y, nc = col + v.x;
    if (nr < 0 || nr > 3 || nc < 0 || nc > 3) { s.note = 'That track leads out of the garden.'; break; }
    s.walk.push({x: c.x + v.x * 67.5, y: c.y + v.y * 64});
    i = nr * 4 + nc; enter = (out + 2) % 4;
  }
  s.valid = valid; s.running = true; s.edge = 0; s.fraction = 0; s.beetle = {...s.walk[0]}; s.seenKeys = new Set(); s.tries++;
}
function rotate(s, i) {
  if (s.running) return;
  s.selected = i; s.tiles[i].rot = (s.tiles[i].rot + 1) % 4;
  s.note = 'Turn the rails; wind the traveller when you are ready.';
}

export default {
  title: 'Clockwork Menagerie',
  intro: 'Digby’s smallest exhibit has escaped its bell jar. Reconnect the brass garden railway and let a traveller fetch three winding keys for the door at the top.',
  instructions: 'Tap a round track disc to rotate it. Connect the lower-left entrance to the keyhole door, visiting every golden key. Wind the traveller to watch your route. Keyboard: arrows choose a disc, Space rotates, Enter winds. A wrong route keeps your work intact. The third chapter sends the clockwork butterfly home.',
  levels: ['The runaway beetle', 'A very curious detour', 'Bring the butterfly home'],
  actions: [{id: 'rotate', label: 'Turn chosen disc'}, {id: 'wind', label: 'Wind the traveller'}, {id: 'hint', label: 'Align one disc'}],
  create(level, rng) {
    const path = paths[level];
    const tiles = Array.from({length: 16}, () => ({base: [0, 1], rot: Math.floor(rng() * 4), solved: false}));
    path.forEach((i, n) => {
      tiles[i] = {base: [n ? direction(i, path[n - 1]) : 3, n < path.length - 1 ? direction(i, path[n + 1]) : 0], rot: 1 + Math.floor(rng() * 3), solved: true};
    });
    return {level, path, tiles, keys: [path[1], path[Math.floor(path.length / 2)], path[path.length - 2]], selected: 12, running: false, beetle: {x: 175, y: 900}, walk: [], seenKeys: new Set(), tries: 0, t: 0, note: 'Three keys, one little traveller, one door.'};
  },
  update(s, dt) {
    s.t += dt;
    if (!s.running) return;
    const a = s.walk[s.edge], b = s.walk[s.edge + 1];
    if (!b) {
      s.running = false;
      if (s.valid) done(s, 'A most satisfactory little expedition', (s.level === 2 ? 'The butterfly ' : 'The beetle ') + 'returned with all three winding keys after ' + s.tries + ' exploratory walks.');
      return;
    }
    s.fraction += dt * 115 / Math.max(1, dist(a, b));
    if (s.fraction >= 1) { s.edge++; s.fraction = 0; }
    s.beetle = {x: lerp(a.x, b.x, Math.min(1, s.fraction)), y: lerp(a.y, b.y, Math.min(1, s.fraction))};
    s.angle = Math.atan2(b.y - a.y, b.x - a.x);
    for (const k of s.keys) if (dist(s.beetle, centre(k)) < 30) s.seenKeys.add(k);
  },
  pointer(s, type, p) {
    if (type !== 'down') return;
    const i = s.tiles.findIndex((_, i) => dist(p, centre(i)) < 56);
    if (i >= 0) rotate(s, i);
  },
  action(s, id) {
    if (id === 'wind' && !s.running) launch(s);
    if (id === 'rotate') rotate(s, s.selected);
    if (id === 'hint' && !s.running) {
      const i = s.path.find(i => s.tiles[i].rot !== 0);
      if (i !== undefined) { s.tiles[i].rot = 0; s.selected = i; }
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (k === 'Enter') this.action(s, 'wind');
    else if (k === ' ') rotate(s, s.selected);
    else {
      const n = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4}[k];
      if (n) s.selected = clamp(s.selected + n, 0, 15);
    }
  },
  draw(s, d) {
    for (let i = 0; i < 16; i++) {
      const c = centre(i), tile = s.tiles[i];
      d.circle(c.x, c.y, 52, '#79664055', '#c5ab7488', 1.5);
      if (i === s.selected) d.ring(c.x, c.y, 56, '#f9d99a', 3);
      for (const p of ports(tile)) {
        const v = vectors[p];
        d.line(c, {x: c.x + v.x * 67.5, y: c.y + v.y * 64}, '#322f24aa', 11);
        d.line(c, {x: c.x + v.x * 67.5, y: c.y + v.y * 64}, '#d1b577', 4);
      }
      d.circle(c.x, c.y, 7, '#e1c181');
    }
    s.keys.forEach((k, n) => {
      const c = centre(k);
      if (s.seenKeys.has(k)) return;
      d.glow(c.x, c.y, 34);
      d.item(spriteKey(keyIds[n]), c.x, c.y, {w: 44, fallback: () => d.ring(c.x, c.y, 10, '#ffdc81', 3)});
    });
    d.glow(home.x, home.y, 50, '#f3e0a8');
    d.item(spriteKey('display-dome'), home.x, home.y, {w: 72, fallback: () => { d.ring(home.x, home.y, 32); d.text('HOME', home.x, home.y + 48, 13); }});
    const c = d.c;
    c.save(); c.translate(s.beetle.x, s.beetle.y); c.rotate(s.angle || 0);
    if (s.level === 2) {
      d.item(spriteKey('clockwork-butterfly'), 0, 0, {w: 56, shadow: false, fallback: () => d.ellipse(0, 0, 22, 14, '#b39951', '#f5d899', 2)});
    } else {
      for (let i = 0; i < 3; i++) {
        const x = -12 + i * 11, wiggle = Math.sin(s.t * 20 + i) * 5;
        d.line({x, y: -6}, {x: x + wiggle - 8, y: -22}, '#cba760', 3);
        d.line({x, y: 6}, {x: x - wiggle - 8, y: 22}, '#cba760', 3);
      }
      d.ellipse(0, 0, 22, 15, '#b39951', '#f5d899', 2);
      d.circle(22, 0, 8, '#526044', '#e6c27b', 2);
    }
    c.restore();
  },
  readout: s => s.seenKeys.size + ' / 3 keys · ' + s.note,
};
