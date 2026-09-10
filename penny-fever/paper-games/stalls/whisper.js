import {clamp,dist,done,segmentDistance} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {swell} from '../chapter-kit.js';

const perch = {x: 450, y: 960};
const letters = ['trade-envelope', 'sealed-secret', 'return-postcard'];
const names = ['heart envelope', 'sealed secret', 'return postcard'];
const allBoxes = [
  {x: 215, y: 305, symbol: '♥'},
  {x: 450, y: 255, symbol: '★'},
  {x: 695, y: 335, symbol: '☾'},
  {x: 360, y: 420, symbol: '✧'},
];

function needFor(level) { return level >= 4 ? 4 : 3; }
function isBottle(s) { return s.level >= 2 && s.delivered === s.need - 1; }
function bob(s, i) { return Math.sin(s.t * .7 + i) * swell(s.level, 0, 10, 48); }

function launch(s) {
  if (s.flying) return;
  const pull = {x: perch.x - s.aim.x, y: perch.y - s.aim.y};
  s.plane = {...perch, vx: clamp(pull.x * 3, -280, 280), vy: clamp(pull.y * 3, -760, -380)};
  s.flying = true; s.drag = false; s.trail = []; s.shots++;
}
function reset(s, note) {
  s.flying = false; s.plane = {...perch, vx: 0, vy: 0}; s.aim = {x: 450, y: 1120}; s.note = note;
}

export default {
  title: 'Lost Letter Express',
  intro: 'Willa’s mail takes the scenic route. Fold it, catch a breeze, and send a little secret to the letterboxes already waiting on her floating islands.',
  instructions: 'Pull the letter back from the lower cloud and release. Match it to the glowing island letterbox. While flying, hold Left or Right to trim. Keyboard arrows steer; Space launches. From the late-night express onward, the last delivery is a bottle, which drifts. Missed letters come back to you.',
  levels: ['The morning post', 'Crosswinds', 'The late-night express', 'A gale of envelopes', 'Islands adrift', 'The last bottle home'],
  actions: [{id: 'left', label: 'Trim left', hold: true}, {id: 'launch', label: 'Launch letter'}, {id: 'right', label: 'Trim right', hold: true}],
  create(level) {
    const need = needFor(level);
    return {level, t: 0, plane: {...perch, vx: 0, vy: 0}, aim: {x: 450, y: 1120}, drag: false, flying: false, delivered: 0, need, boxes: allBoxes.slice(0, need), shots: 0, trail: [], wind: 0, note: 'First: the ' + names[0] + '.'};
  },
  update(s, dt, input) {
    s.t += dt;
    s.wind = Math.sin(s.t * .65) * swell(s.level, 16, 18, 100);
    if (!s.flying) {
      if (input.keys.has('ArrowLeft')) s.aim.x = clamp(s.aim.x + 120 * dt, 355, 545);
      if (input.keys.has('ArrowRight')) s.aim.x = clamp(s.aim.x - 120 * dt, 355, 545);
      return;
    }
    const p = s.plane, old = {x: p.x, y: p.y};
    const trim = (input.actions.has('right') || input.keys.has('ArrowRight') ? 1 : 0) - (input.actions.has('left') || input.keys.has('ArrowLeft') ? 1 : 0);
    const bottle = isBottle(s);
    p.vx += (s.wind + trim * 120) * dt;
    p.vy += (bottle ? 28 : 78) * dt;
    p.vx *= Math.exp(-(bottle ? .04 : .1) * dt);
    p.x += p.vx * dt; p.y += p.vy * dt;
    s.trail.push({x: p.x, y: p.y});
    if (s.trail.length > 65) s.trail.shift();
    const hit = s.boxes.findIndex((b, i) => segmentDistance({x: b.x, y: b.y + bob(s, i)}, old, p) < 48);
    if (hit >= 0) {
      if (hit === s.delivered) {
        s.delivered++;
        if (s.delivered === s.need) {
          done(s, 'Every little secret found a home', s.need + ' signed-and-sealed deliveries in ' + s.shots + ' flights. Willa is keeping the contents to herself.');
          return;
        }
        reset(s, 'Delivered. Now the ' + (isBottle(s) ? 'bottle, which drifts.' : names[s.delivered] + '.'));
      } else reset(s, 'Wrong island — that secret belongs elsewhere.');
    } else if (p.x < 70 || p.x > 830 || p.y < 160 || p.y > 1140) {
      reset(s, 'The breeze brought it back. Adjust your angle or trim the wings.');
    }
  },
  pointer(s, type, p) {
    if (s.flying) return;
    if (type === 'down' && dist(p, perch) < 90) s.drag = true;
    if (type === 'move' && s.drag) s.aim = {x: clamp(p.x, 340, 560), y: clamp(p.y, 1020, 1200)};
    if (type === 'up' && s.drag) launch(s);
    if (type === 'cancel') s.drag = false;
  },
  action(s, id) { if (id === 'launch') launch(s); },
  key(s, k, down) { if (k === ' ' && down) launch(s); },
  draw(s, d) {
    for (const [i, b] of s.boxes.entries()) {
      const y = b.y + bob(s, i);
      if (i === s.delivered) d.glow(b.x, y, 58, '#ffe2a8');
      d.item(spriteKey('charm-pouch'), b.x, y, {w: i < s.delivered ? 46 : 58, alpha: i < s.delivered ? .45 : 1, fallback: () => {
        d.poly([[b.x - 40, y + 36], [b.x - 40, y - 28], [b.x, y - 58], [b.x + 40, y - 28], [b.x + 40, y + 36]], i < s.delivered ? '#9bab94' : '#b79bb8', '#ecd5a6', 3);
        d.text(b.symbol, b.x, y, 22);
      }});
      d.text(b.symbol, b.x, y + 44, 16, i === s.delivered ? '#fff1d2' : '#d7c4a066');
    }
    for (let i = 0; i < 5; i++) {
      const x = 300 + i * 65, y = 690 + Math.sin(s.t + i) * 20;
      d.path([{x: x - s.wind, y}, {x, y: y - 8}, {x: x + s.wind, y}], '#9d829e66', 3);
    }
    d.path(s.trail, '#fff3d488', 2);
    d.ellipse(perch.x, perch.y + 28, 60, 14, '#9f899e55', '#ecd5b0', 2);
    if (!s.flying) {
      d.line(perch, s.aim, '#805c83', 3);
      const vx = clamp((450 - s.aim.x) * 3, -280, 280), vy = clamp((960 - s.aim.y) * 3, -760, -380);
      for (let i = 1; i < 12; i++) {
        const t = i * .06;
        d.circle(450 + vx * t, 960 + vy * t + 39 * t * t, 2.3, '#fff1cf');
      }
    }
    const p = s.plane, bottle = isBottle(s);
    const id = bottle ? 'message-bottle' : letters[Math.min(s.delivered, letters.length - 1)];
    d.item(spriteKey(id), p.x, p.y, {w: bottle ? 54 : 62, fallback: () => {
      const c = d.c; c.save(); c.translate(p.x, p.y); c.rotate(s.flying ? Math.atan2(p.vy, p.vx) + Math.PI / 2 : 0);
      d.poly([[0, -30], [-26, 22], [0, 10], [26, 22]], '#f4e7c8', '#ba9f8d', 2);
      d.text(s.boxes[Math.min(s.delivered, s.boxes.length - 1)].symbol, 0, 4, 14, '#bd768f');
      c.restore();
    }});
  },
  readout: s => s.delivered + ' / ' + s.need + ' delivered · Breeze ' + (s.wind < 0 ? '←' : '→') + ' · ' + s.note,
};
