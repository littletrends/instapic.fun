import {clamp, done} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {pick, pace, swell} from '../chapter-kit.js';

const chimes = [
  [810, 670, 490],
  [500, 805, 660],
  [710, 520, 790],
  [830, 710, 590, 490],
  [800, 520, 680, 490],
  [745, 500, 660, 820, 575],
];
function peak(s) { return 1000 - (70 + 460 * (-s.angle / 1.45)); }
function drift(s) {
  if (s.level < 2) return 0;
  return Math.sin(s.t * swell(s.level, .5, .07, .85)) * swell(s.level, 8, 5, 24);
}
function mark(s, i = s.rung) {
  const raw = s.targets[i];
  if (raw == null) return s.targets[s.targets.length - 1];
  return clamp(raw + (i === s.rung ? drift(s) : 0), 480, 860);
}
function strike(s) {
  if (s.flying) return;
  s.flying = true; s.y = 1000; s.vy = -Math.sqrt(1000 * (1000 - peak(s)));
  s.tries++; s.judged = false; s.swing = s.angle; s.angle = -.1; s.hold = false;
}

export default {
  title: 'Bellfoundry',
  intro: 'Magnus does not need brute force. He needs someone who can play the tower’s bells with a mighty mallet and a mercury weight the size of a small wardrobe.',
  instructions: 'Lift the mallet by dragging its head upwards, then release. The little brass pointer on the tower predicts the weight’s highest point. Match the glowing bell, not always the top one. Later chapters add extra bells, and some of them drift. Hold Lift then release to strike, or use Up/Down to set the mallet and Space to strike.',
  levels: ['Three measured notes', 'The backward chime', 'A restless belfry', 'Four bells to find', 'A wandering peal', 'Five notes in the wind'],
  sprites: ['mighty-mallet', 'bell-of-bravery', 'mercury-bead'],
  prizes: ['mighty-mallet', 'bell-bracelet', 'bell-of-bravery'],
  actions: [{id: 'lift', label: 'Hold to lift · release to strike', hold: true}, {id: 'strike', label: 'Strike now'}],
  create(level) {
    return {
      level, t: 0, angle: -.1, swing: 0, hold: false, drag: false, flying: false,
      y: 1000, vy: 0, tries: 0, rung: 0, judged: false, flash: 0,
      targets: pick(chimes, level).slice(),
      note: 'Raise the mallet until the pointer meets the lit bell.',
    };
  },
  update(s, dt, input) {
    s.t += dt; s.flash = Math.max(0, s.flash - dt);
    s.swing += (0 - s.swing) * Math.min(1, dt * 15);
    if (!s.flying) {
      const lift = s.hold || input.actions.has('lift'), up = input.keys.has('ArrowUp'), down = input.keys.has('ArrowDown');
      s.angle = clamp(s.angle + ((lift || up) ? -.64 : down ? .64 : 0) * dt, -1.45, 0);
      return;
    }
    const old = s.vy;
    s.vy += 500 * dt; s.y += s.vy * dt;
    if (old < 0 && s.vy >= 0 && !s.judged) {
      s.judged = true;
      const target = mark(s);
      const error = Math.abs(s.y - target);
      if (error < pace(s.level, 32, 2.2, 21)) { s.rung++; s.flash = 1; s.note = 'That note rings true.'; }
      else s.note = s.y < target ? 'Too much muscle. Lower the mallet a little.' : 'A little more lift next time.';
      if (s.rung === s.targets.length) {
        done(s, 'A tune fit for the midway', s.targets.length + ' bells rung in ' + s.tries + ' measured strikes. Magnus takes a very theatrical bow.');
        return;
      }
    }
    if (s.y >= 1000) { s.y = 1000; s.flying = false; }
  },
  pointer(s, type, p) {
    if (s.flying) return;
    if (type === 'down' && p.x > 420 && p.y > 760) s.drag = true;
    if (type === 'move' && s.drag) s.angle = clamp(Math.atan2(p.y - 980, p.x - 440), -1.45, 0);
    if (type === 'up' && s.drag) { s.drag = false; strike(s); }
    if (type === 'cancel') { s.drag = false; s.hold = false; }
  },
  action(s, id, pressed) {
    if (id === 'lift') { s.hold = pressed; if (!pressed) strike(s); }
    if (id === 'strike' && pressed) strike(s);
  },
  key(s, k, down) { if (k === ' ' && down) strike(s); },
  draw(s, d) {
    d.poly([[365, 390], [405, 390], [405, 1010], [365, 1010]], '#985d46', '#dcb477', 3);
    d.line({x: 385, y: 408}, {x: 385, y: 990}, '#e4c68e', 4);
    for (let y = 430; y < 1000; y += 35) d.line({x: 372, y}, {x: 385, y}, '#c59c67', 2);
    const target = mark(s);
    for (const [i] of s.targets.entries()) {
      const y = mark(s, i);
      d.line({x: 405, y: y - 25}, {x: 497, y: y - 25}, '#967144', 4);
      if (i === s.rung) d.glow(492, y, 55, '#e9c67e');
      d.item(spriteKey('bell-of-bravery'), 492, y, {
        w: i < s.rung ? 58 : 50, alpha: i < s.rung ? 1 : .85,
        fallback: () => {
          d.poly([[470, y + 11], [477, y - 21], [490, y - 34], [504, y - 21], [513, y + 11]], i < s.rung ? '#f1d18c' : '#b79358', '#eac88a', 3);
          d.ellipse(492, y + 12, 26, 6, '#8d724b', '#eec889', 2);
          d.ball(492, y + 19, 5, '#d8b16b');
        },
      });
    }
    if (!s.flying) {
      const py = peak(s);
      d.poly([[340, py], [355, py - 8], [355, py + 8]], '#f2d39b', '#967240');
      d.text('peak', 310, py + 5, 15, '#785541');
    }
    d.item(spriteKey('mercury-bead'), 385, s.y, {
      w: 38, fallback: () => d.ball(385, s.y, 18, '#b7b4a5'),
    });
    d.ellipse(410, 1015, 72, 20, '#a77d54', '#edca8b', 4);
    d.line({x: 385, y: 1000}, {x: 480, y: 1000}, '#d5b37d', 12);
    const angle = s.flying ? s.swing : s.angle;
    const head = {x: 440 + Math.cos(angle) * 180, y: 980 + Math.sin(angle) * 180};
    d.line({x: 440, y: 980}, head, '#775336', 14);
    d.line({x: 440, y: 975}, {x: head.x, y: head.y - 5}, '#b28a56', 4);
    d.item(spriteKey('mighty-mallet'), head.x, head.y, {
      w: 92, angle: angle + Math.PI / 2,
      fallback: () => {
        const c = d.c; c.save(); c.translate(head.x, head.y); c.rotate(angle + Math.PI / 2);
        d.poly([[-40, -23], [40, -23], [40, 23], [-40, 23]], '#a7784c', '#e0bc83', 3);
        for (const x of [-23, 23]) d.line({x, y: -24}, {x, y: 24}, '#dcc39b', 7);
        d.star(0, 0, 14); c.restore();
      },
    });
    if (s.flash) d.arc(492, target || 500, 65, 0, Math.PI * 2, '#f5d69a88', 2);
  },
  readout: s => s.rung + ' / ' + s.targets.length + ' bells · ' + s.tries + ' strikes · ' + s.note,
};
