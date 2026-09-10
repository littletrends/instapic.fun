import {clamp, dist, done} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {swell} from '../chapter-kit.js';

function toss(s) {
  if (s.ring) return;
  s.ring = {x: 450, y: 1030, z: 10, vx: (s.aim.x - 450) / 1.12, vy: (s.aim.y - 1030) / 1.12, vz: 340, age: 0, hit: false};
  s.throws++;
}

export default {
  title: 'The Ring Orchard',
  intro: 'Ringo grows crooked little brass branches, each tipped with a wishing acorn. Float a ring over the right one and let gravity finish the trick.',
  instructions: 'Aim at the peg’s base, then release to toss. Watch the separate shadow beneath the flying ring: that is where it really is on the ground. Lead a moving peg slightly. Arrows aim; Space or Toss launches. Catch every peg with one ring.',
  levels: ['The still orchard', 'A gentle sway', 'Branches on the breeze', 'A crowded acorn night', 'The packed orchard', 'The orchard in a gale'],
  sprites: ['wishing-acorn', 'lucky-ring-trio'],
  prizes: ['lucky-ring-trio', 'splash-ring', 'wishing-acorn'],
  actions: [{id: 'toss', label: 'Toss brass ring'}],
  create(level) {
    const n = swell(level, 4, 1, 8), rows = Math.ceil(n / 2);
    const yTop = 520, yBot = rows <= 2 ? 685 : 840;
    const dy = rows > 1 ? (yBot - yTop) / (rows - 1) : 0;
    return {
      level, t: 0, aim: {x: 300, y: 610}, ring: null, throws: 0, caught: 0, note: 'Watch the landing shadow.',
      pegs: Array.from({length: n}, (_, i) => ({bx: 280 + (i % 2) * 330, by: yTop + Math.floor(i / 2) * dy, x: 0, y: 0, hit: false})),
    };
  },
  update(s, dt, input) {
    s.t += dt;
    const dx = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    const dy = (input.keys.has('ArrowDown') ? 1 : 0) - (input.keys.has('ArrowUp') ? 1 : 0);
    s.aim.x = clamp(s.aim.x + dx * 230 * dt, 220, 680);
    s.aim.y = clamp(s.aim.y + dy * 230 * dt, 470, 880);
    s.pegs.forEach((p, i) => {
      p.x = p.bx + Math.sin(s.t * .7 + i * 1.5) * swell(s.level, 0, 24, 90);
      p.y = p.by + Math.cos(s.t * .5 + i) * swell(s.level, 0, 10, 40);
    });
    if (!s.ring) return;
    const r = s.ring, oldZ = r.z;
    r.age += dt; r.vz -= 540 * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.z += r.vz * dt;
    if (oldZ > 44 && r.z <= 44 && r.vz < 0) {
      const p = s.pegs.find(p => !p.hit && dist(p, r) < 32);
      if (p) {
        p.hit = true; s.caught++; r.hit = true; r.x = p.x; r.y = p.y; r.vx = 0; r.vy = 0;
        s.note = 'A lovely clean catch.';
        if (s.caught === s.pegs.length) {
          done(s, 'A ring on every branch', s.pegs.length + ' catches in ' + s.throws + ' throws. Ringo claims he taught the trees to do that.');
          return;
        }
      }
    }
    if (r.z < 0) {
      r.z = 0;
      if (!r.hit) s.note = 'It rolled away. Check the shadow and lead the branch.';
      if (r.age > 1.65) s.ring = null;
    }
  },
  pointer(s, type, p) {
    if (type === 'move' || type === 'down') s.aim = {x: clamp(p.x, 220, 680), y: clamp(p.y, 470, 880)};
    if (type === 'up') toss(s);
  },
  action(s, id) { if (id === 'toss') toss(s); },
  key(s, k, down) { if (k === ' ' && down) toss(s); },
  draw(s, d) {
    for (const p of s.pegs) {
      d.ellipse(p.x, p.y + 9, 49, 18, '#8c7854', '#cfaf75', 3);
      d.line({x: p.x, y: p.y}, {x: p.x + 6, y: p.y - 50}, '#9d754b', 12);
      d.line({x: p.x - 3, y: p.y}, {x: p.x + 3, y: p.y - 50}, '#e8c981', 4);
      d.leaf(p.x, p.y - 20, -.5, 33);
      d.item(spriteKey('wishing-acorn'), p.x + 6, p.y - 52, {
        w: 32, fallback: () => d.ball(p.x + 6, p.y - 50, 9, '#d8b573'),
      });
      if (p.hit) d.item(spriteKey('lucky-ring-trio'), p.x, p.y - 8, {
        w: 54, fallback: () => d.ellipse(p.x, p.y - 5, 34, 14, null, '#f3d589', 7),
      });
    }
    if (s.ring) {
      const r = s.ring;
      d.ellipse(r.x, r.y + 5, 33, 13, '#243b2844');
      d.ellipse(r.x, r.y - r.z, 35, 12 + Math.abs(Math.cos(r.age * 7)) * 13, null, '#8b7048', 10);
      d.ellipse(r.x - 2, r.y - r.z - 2, 35, 12 + Math.abs(Math.cos(r.age * 7)) * 13, null, '#f1d192', 6);
    } else {
      d.ellipse(s.aim.x, s.aim.y, 34, 14, null, '#fff0b999', 3);
      d.ring(450, 1030, 35, '#ecd08a', 8);
      d.line({x: 450, y: 1000}, s.aim, '#e9d6a944', 2);
    }
  },
  readout: s => s.caught + ' / ' + s.pegs.length + ' catches · ' + s.throws + ' throws · ' + s.note,
};
