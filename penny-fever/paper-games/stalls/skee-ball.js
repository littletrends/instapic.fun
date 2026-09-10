import {clamp, dist, done} from '../draw.js';
import {spriteKey} from '../prizes.js';

function roll(s) {
  if (s.ball || s.rolls === 9) return;
  s.ball = {x: 450, y: 1030, z: 0, vx: Math.sin(s.angle) * s.power, vy: -Math.cos(s.angle) * s.power, vz: 0, air: false, age: 0};
  s.rolls++; s.drag = false;
}
function finishBall(s, points) {
  s.score += points; s.ball = null;
  s.note = points ? 'Into the ' + points + ' bowl.' : 'It rolled past. Try a different amount of lift.';
  if (s.rolls === 9) done(s, 'Nine rolls under the moon', s.score + ' points. Your angle and rolling speed made every journey. Try another chapter or beat this card.');
}

export default {
  title: 'Moonbow Alley',
  intro: 'Skip’s little wooden ramp sends a moon penny up into the moonlight. Give it enough roll, but not so much that it sails past everything.',
  instructions: 'Pull back from the penny to set power and sideways aim, then release. Or use Left/Right for angle, Up/Down for power and Space to roll. Watch the ground shadow when the penny leaves the ramp. Nine free rolls per chapter; all scores are local.',
  levels: ['The moonbow bowls', 'The narrow silver cups', 'Two high moons'],
  sprites: ['moon-penny', 'star-token'],
  prizes: ['moon-penny', 'star-token', 'pegboard-star'],
  actions: [{id: 'less', label: 'Softer roll'}, {id: 'roll', label: 'Roll penny · Space'}, {id: 'more', label: 'Stronger roll'}],
  create(level) {
    return {
      level, t: 0, angle: 0, power: 390, ball: null, rolls: 0, score: 0, drag: false, note: 'A medium roll is a good beginning.',
      holes: [
        {x: 450, y: 700, r: 70, score: 10}, {x: 450, y: 565, r: 55 - level * 3, score: 30},
        {x: 450, y: 445, r: 42 - level * 2, score: 50}, {x: 290, y: 470, r: 36 - level * 2, score: 100},
        {x: 610, y: 470, r: 36 - level * 2, score: 100},
      ],
    };
  },
  update(s, dt, input) {
    s.t += dt;
    if (!s.ball) {
      s.angle = clamp(s.angle + ((input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0)) * .42 * dt, -.5, .5);
      s.power = clamp(s.power + ((input.keys.has('ArrowUp') ? 1 : 0) - (input.keys.has('ArrowDown') ? 1 : 0)) * 120 * dt, 240, 550);
      return;
    }
    const p = s.ball; p.age += dt;
    for (let i = 0; i < 4; i++) {
      const h = dt / 4;
      p.x += p.vx * h; p.y += p.vy * h;
      if (!p.air) {
        if (p.x < 303 || p.x > 597) { p.x = clamp(p.x, 303, 597); p.vx *= -.65; }
        if (p.y <= 820) { p.air = true; p.z = 5; p.vz = Math.abs(p.vy) * .45; }
      } else {
        p.vz -= 500 * h; p.z += p.vz * h;
        if (p.vz < 0 && p.z < 20) {
          const bowl = s.holes.find(b => dist(b, p) < b.r - 13);
          if (bowl) { finishBall(s, bowl.score); return; }
        }
        if (p.z < 0) { finishBall(s, 0); return; }
      }
      if (p.y < 340 || p.x < 180 || p.x > 720 || p.age > 6) { finishBall(s, 0); return; }
    }
  },
  pointer(s, type, p) {
    if (s.ball) return;
    if (type === 'down' && dist(p, {x: 450, y: 1030}) < 85) s.drag = true;
    if (type === 'move' && s.drag) {
      s.power = clamp(250 + (p.y - 1030) * 1.8, 240, 550);
      s.angle = clamp((450 - p.x) / 200, -.5, .5);
    }
    if (type === 'up' && s.drag) roll(s);
    if (type === 'cancel') s.drag = false;
  },
  action(s, id) {
    if (id === 'roll') roll(s);
    if (id === 'less') s.power = clamp(s.power - 20, 240, 550);
    if (id === 'more') s.power = clamp(s.power + 20, 240, 550);
  },
  key(s, k, down) { if (k === ' ' && down) roll(s); },
  draw(s, d) {
    for (const b of s.holes) {
      d.ellipse(b.x + 5, b.y + 12, b.r + 8, (b.r + 8) * .72, '#283c4d55');
      d.ellipse(b.x, b.y, b.r, b.r * .72, '#314052', '#dbbe88', 7);
      d.ellipse(b.x, b.y + 8, b.r - 14, (b.r - 14) * .67, '#706551', '#ae966c', 2);
      if (b.score >= 50) d.item(spriteKey('star-token'), b.x, b.y, {
        w: 22, shadow: false, fallback: () => d.text(b.score, b.x, b.y + 8, 21, '#e5cc98'),
      });
      d.text(b.score, b.x, b.y + (b.score >= 50 ? 22 : 8), 18, '#e5cc98');
    }
    d.poly([[290, 1060], [610, 1060], [610, 870], [575, 804], [325, 804], [290, 870]], '#687b8d', '#d1b486', 4);
    d.poly([[300, 870], [600, 870], [575, 804], [325, 804]], '#a3a5a0', '#edcea0', 2);
    for (let x = 325; x <= 575; x += 50) d.line({x, y: 1050}, {x, y: 866}, '#b3b29b55', 1);
    d.line({x: 300, y: 1050}, {x: 300, y: 872}, '#e4c798', 5);
    d.line({x: 600, y: 1050}, {x: 600, y: 872}, '#e4c798', 5);
    const p = s.ball || {x: 450, y: 1030, z: 0};
    d.ellipse(p.x + 4, p.y + 8, 17, 9, '#1f344766');
    d.item(spriteKey('moon-penny'), p.x, p.y - p.z, {
      w: 34, fallback: () => d.ball(p.x, p.y - p.z, 17, '#b28b62'),
    });
    if (!s.ball) {
      const end = {x: 450 + Math.sin(s.angle) * 135, y: 1030 - Math.cos(s.angle) * 135};
      d.line({x: 450, y: 1000}, end, '#efd09b', 3);
      d.text('ROLL ' + Math.round((s.power - 240) / 310 * 100) + '%', 450, 1110, 17, '#f0d9ae');
    }
  },
  readout: s => s.rolls + ' / 9 rolls · ' + s.score + ' points · ' + s.note,
};
