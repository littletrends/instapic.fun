import {clamp, done} from '../draw.js';
import {spriteKey} from '../prizes.js';

const colours = ['#edc87e', '#a3d7cb', '#e4a4b7'];
const seals = ['star-token', 'moon-penny', 'pressed-heart'];
const xs = [270, 450, 630];

function strike(s, lane) {
  if (s.cool[lane] > 0) return;
  s.cool[lane] = .16;
  const n = s.notes.filter(n => n.lane === lane).sort((a, b) => Math.abs(a.age - s.travel) - Math.abs(b.age - s.travel))[0];
  if (n && Math.abs(n.age - s.travel) < s.window) {
    s.notes.splice(s.notes.indexOf(n), 1);
    s.hits++; s.combo++; s.best = Math.max(s.best, s.combo); s.flash[lane] = 1;
    s.flares.push({lane, t: 0});
    s.note = Math.abs(n.age - s.travel) < .13 ? 'A bright, clear beat.' : 'Caught it — the alley glows a little warmer.';
  } else {
    s.combo = 0; s.flash[lane] = .15; s.note = 'Wait for the little light to reach its lantern.';
  }
}
function pos(s, n) {
  const p = clamp(n.age / s.travel, 0, 1.12);
  return {x: 450 + (xs[n.lane] - 450) * p + Math.sin(p * Math.PI) * (n.lane === 1 ? 44 : (n.lane === 0 ? -72 : 72)), y: 410 + p * 510};
}

export default {
  title: 'Light the Night',
  intro: 'Lumi has caught a handful of travelling marquee bulbs. Meet each one at its pocket lantern and conduct the whole boardwalk awake, one warm window at a time.',
  instructions: 'Watch the star, moon and heart travel down their strings. Tap the matching lantern as the light reaches its brass ring. Left, Down and Right arrows work too. Missed lights return for another try; this is a melody to learn, not a life counter.',
  levels: ['A lantern waltz', 'Three little harmonies', 'The whole boardwalk'],
  sprites: ['marquee-bulb', 'pocket-marquee', 'star-token', 'moon-penny', 'pressed-heart'],
  prizes: ['marquee-bulb', 'pocket-marquee', 'lantern-lighter'],
  actions: [{id: '0', label: 'Star · ←'}, {id: '1', label: 'Moon · ↓'}, {id: '2', label: 'Heart · →'}],
  create(level) {
    const patterns = [
      [0, 1, 2, 1, 0, 2, 0, 1, 2, 2, 1, 0],
      [0, 2, 1, 0, 1, 2, 2, 0, 1, 2, 0, 2, 1, 0, 1, 2],
      [0, 1, 2, 0, 2, 1, 1, 0, 2, 1, 2, 0, 0, 2, 1, 2, 1, 0, 1, 2],
    ];
    return {
      level, queue: patterns[level].map((lane, id) => ({lane, id})), total: patterns[level].length,
      notes: [], travel: 3.3 - level * .2, window: .32, spawn: .7, t: 0, hits: 0, combo: 0, best: 0,
      flash: [0, 0, 0], cool: [0, 0, 0], flares: [], note: 'Follow the lights, not a countdown.',
    };
  },
  update(s, dt) {
    s.t += dt; s.spawn -= dt;
    for (let i = 0; i < 3; i++) { s.flash[i] = Math.max(0, s.flash[i] - dt); s.cool[i] = Math.max(0, s.cool[i] - dt); }
    if (s.spawn <= 0 && s.queue.length) {
      const n = s.queue.shift(); s.notes.push({...n, age: 0}); s.spawn = [1.5, 1.18, .95][s.level];
    }
    for (const n of [...s.notes]) {
      n.age += dt;
      if (n.age > s.travel + s.window) {
        s.notes.splice(s.notes.indexOf(n), 1); s.queue.push({id: n.id, lane: n.lane}); s.combo = 0;
        s.note = 'That light is circling back. No hurry.';
      }
    }
    for (const f of s.flares) f.t += dt;
    s.flares = s.flares.filter(f => f.t < 1.8);
    if (s.hits === s.total) done(s, 'Every lantern has found its light', 'Lumi’s boardwalk is awake. Your longest unbroken phrase was ' + s.best + ' lights.');
  },
  pointer(s, type, p) { if (type === 'down' && p.y > 750) strike(s, clamp(Math.round((p.x - 270) / 180), 0, 2)); },
  action(s, id) { strike(s, Number(id)); },
  key(s, k, down) { if (down && ['ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(k)) strike(s, ['ArrowLeft', 'ArrowDown', 'ArrowRight'].indexOf(k)); },
  draw(s, d) {
    for (let i = 0; i < 3; i++) {
      const points = [];
      for (let j = 0; j <= 32; j++) points.push(pos(s, {lane: i, age: s.travel * j / 32}));
      d.path(points, '#9a886066', 2);
      const x = xs[i], y = 925;
      d.ellipse(x, y + 72, 58, 15, '#101b2244');
      if (s.flash[i]) d.glow(x, y, 82 * s.flash[i], colours[i]);
      d.item(spriteKey('pocket-marquee'), x, y, {
        w: 92,
        fallback: () => {
          d.line({x, y: 850}, {x, y: 881}, '#b59a60', 4);
          d.ring(x, 862, 13, '#d8b76f', 4);
          d.poly([[x - 38, y - 39], [x + 38, y - 39], [x + 48, y + 38], [x - 48, y + 38]], '#263e3d', '#cfad71', 5);
          d.poly([[x - 47, y - 39], [x, y - 69], [x + 47, y - 39]], '#a78348', '#e8c484', 3);
        },
      });
      d.item(spriteKey(seals[i]), x, y + 8, {
        w: 28, shadow: false,
        fallback: () => {
          if (i === 0) d.star(x, y, 19, colours[i]);
          else if (i === 2) d.heart(x, y, 19, colours[i]);
          else { d.circle(x, y, 19, colours[i]); d.circle(x + 19 * .4, y - 19 * .28, 19 * .82, '#324945'); }
        },
      });
      d.ring(x, y, 60, colours[i] + '66', 2);
      d.text(['←', '↓', '→'][i], x, y + 110, 23, '#f3dfb2');
    }
    for (const n of s.notes) {
      const p = pos(s, n);
      d.glow(p.x, p.y, 30, colours[n.lane]);
      d.item(spriteKey('marquee-bulb'), p.x, p.y, {
        w: 28, shadow: false,
        fallback: () => {
          d.ellipse(p.x - 12, p.y, 17, 7, '#f5e9cdaa', null, 0);
          d.ellipse(p.x + 12, p.y, 17, 7, '#f5e9cdaa', null, 0);
          const lane = n.lane;
          if (lane === 0) d.star(p.x, p.y, 12, colours[lane]);
          else if (lane === 2) d.heart(p.x, p.y, 12, colours[lane]);
          else { d.circle(p.x, p.y, 12, colours[lane]); }
        },
      });
    }
    for (let i = 0; i < s.total; i++) {
      const side = i % 2, x = side ? 720 : 180, y = 475 + Math.floor(i / 2) * 49;
      d.line({x: x - 9, y}, {x: x + 9, y}, '#ad905c', 2);
      if (i < s.hits) d.glow(x, y, 25, '#f4d590');
      d.circle(x, y, 6, i < s.hits ? '#ffe6a4' : '#625b48', '#c2a46d', 1);
    }
    for (const f of s.flares) {
      const x = xs[f.lane] + Math.sin(f.t * 4) * 35, y = 900 - f.t * 180;
      d.item(spriteKey('marquee-bulb'), x, y, {w: 16 * (1 - f.t / 1.8), shadow: false, fallback: () => d.star(x, y, 8 * (1 - f.t / 1.8), colours[f.lane])});
    }
    d.text(s.hits + ' / ' + s.total + ' lights', 450, 1090, 21, '#f2dab1');
  },
  readout: s => s.hits + ' / ' + s.total + ' lights · phrase ' + s.combo + ' · ' + s.note,
};
