import {done} from '../draw.js';
import {spriteKey} from '../prizes.js';
import {
  COURSES, SHORE, createGame, startGame, step, allLetters, gatePose, ferryPose,
} from '../../experiments/brasswater-harbour/model.js';

export default {
  title: 'Paper Harbour',
  intro: 'Marina has a little sailboat, three floating letters and a golden berth at the top of the harbour. A short burst of water behind the hull is all the wind you need.',
  instructions: 'Hold just behind the boat to push it away from your hand. Let go to refill the tank. Space or Anchor holds the boat still while you aim. Collect every letter, then settle in the golden berth. Arrows also steer a gentle jet. Bumps are free; nothing is timed unless you want a seal.',
  levels: COURSES.map(c => c.name),
  sprites: ['little-sailboat', 'trade-envelope', 'message-bottle'],
  prizes: ['little-sailboat', 'message-bottle', 'harbour-washer', 'seaside-day-book', 'picnic-parcel', 'return-postcard'],
  actions: [
    {id: 'left', label: '←', hold: true}, {id: 'up', label: '↑', hold: true},
    {id: 'down', label: '↓', hold: true}, {id: 'right', label: '→', hold: true},
    {id: 'anchor', label: 'Hold anchor · Space', hold: true},
  ],
  create(level) {
    const s = createGame(level);
    s.level = level; s.t = 0; s.held = false; s.pointer = null; s.note = COURSES[level].hint;
    return s;
  },
  update(s, dt, input) {
    if (s.phase === 'ready') startGame(s);
    s.t += dt;
    const dx = (input.keys.has('ArrowRight') || input.actions.has('right') ? 1 : 0)
      - (input.keys.has('ArrowLeft') || input.actions.has('left') ? 1 : 0);
    const dy = (input.keys.has('ArrowDown') || input.actions.has('down') ? 1 : 0)
      - (input.keys.has('ArrowUp') || input.actions.has('up') ? 1 : 0);
    let jet = {active: false, x: 0, y: 0, anchor: input.keys.has(' ') || input.actions.has('anchor')};
    if (dx || dy) {
      const n = Math.hypot(dx, dy);
      jet = {active: true, x: s.boat.x - dx / n * 90, y: s.boat.y - dy / n * 90, anchor: jet.anchor};
    } else if (s.held && s.pointer) jet = {active: true, x: s.pointer.x, y: s.pointer.y, anchor: jet.anchor};
    step(s, jet, dt);
    for (const e of s.events) {
      if (e.type === 'letter') s.note = allLetters(s) ? 'All aboard. Bring the letters to the golden berth.' : 'One safely aboard.';
      if (e.type === 'bump') s.note = 'A little bump. Try a gentler burst.';
    }
    if (s.phase === 'won') {
      done(s, 'Every letter home', Math.round(s.time) + ' seconds, ' + s.bumps + ' bumps, ' + s.rating + ' of 3 voyage seals. Marina has put the kettle on.');
    }
  },
  pointer(s, type, p) {
    if (type === 'down') { s.held = true; s.pointer = p; }
    if (type === 'move' && s.held) s.pointer = p;
    if (type === 'up' || type === 'cancel') { s.held = false; if (type !== 'up') s.pointer = null; }
  },
  key(s, k, down) { if (k === ' ' ) s.anchor = down; },
  draw(s, d) {
    const course = COURSES[s.course];
    d.path(SHORE.map(([x, y]) => ({x, y})), '#effcdb55', 2, true);
    for (const [x, y, r] of course.islands) {
      d.ellipse(x, y, r, r * .88, null, '#f4ddb355', 2);
    }
    if (course.eddy) {
      const c = d.c; c.save(); c.translate(465, 753); c.rotate(s.t * .4);
      for (let i = 0; i < 8; i++) { c.rotate(Math.PI / 4); d.arc(0, 0, 90, -.4, .6, '#d7ffe335', 3); }
      c.restore();
    }
    if (course.gate) for (const arm of gatePose(s).arms) {
      d.line({x: arm.a[0], y: arm.a[1]}, {x: arm.b[0], y: arm.b[1]}, '#e5bc82', 16);
      d.circle(arm.a[0], arm.a[1], 14, '#624f3f', '#eac58c', 3);
    }
    if (course.ferry) {
      const f = ferryPose(s);
      d.ellipse(f.x, f.y + 16, 60, 22, '#113f4940');
      d.poly([[f.x - 48, f.y], [f.x + 48, f.y - 18], [f.x + 48, f.y + 18]], '#974d43', '#eac389', 2);
      d.text('POST', f.x, f.y + 4, 12);
    }
    course.letters.forEach(([x, y], i) => {
      if (s.letters[i]) return;
      d.item(spriteKey('trade-envelope'), x, y + Math.sin(s.t * 2.4 + i) * 3, {
        w: 48, fallback: () => d.envelope(x, y, 18, '#f3e6c6', String(i + 1)),
      });
    });
    const [dx, dy] = course.dock;
    const unlocked = allLetters(s);
    d.ellipse(dx, dy, 51, 43, null, unlocked ? '#ffe3a6' : '#b0d8c0', 3);
    d.text(unlocked ? 'POST HERE' : 'COLLECT ALL 3', dx, dy - 58, 16, '#fff4d6');
    if (s.dockTime > 0) d.arc(dx, dy, 59, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, s.dockTime / 1.1), '#ffe2a0', 5);
    if (s.jet) {
      d.line({x: s.jet.x, y: s.jet.y}, {x: s.jet.tx, y: s.jet.ty}, '#d4fff288', 10 * s.jet.strength);
      d.circle(s.jet.x, s.jet.y, 8, '#e7fff088');
    }
    const b = s.boat;
    d.ellipse(b.x + 8, b.y + 14, 28, 14, '#0a435051');
    d.item(spriteKey('little-sailboat'), b.x, b.y, {
      w: 64, angle: b.angle + Math.PI / 2,
      fallback: () => { d.ellipse(b.x, b.y, 28, 14, '#174f54', '#eac389', 2); d.line({x: b.x, y: b.y}, {x: b.x, y: b.y - 48}, '#ebc581', 3); },
    });
  },
  readout: s => s.letters.filter(Boolean).length + ' / 3 letters · tank ' + Math.round(s.pressure * 100) + '% · ' + (s.note || ''),
};
