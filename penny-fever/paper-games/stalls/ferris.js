import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
} from '../ride-seek.js?v=phone-layout-1';

const RIDE = 'ferris';
const TREASURES = ['pocket-wheel', 'star-token', 'moon-penny', 'ride-ticket', 'ride-stamp-book', 'ride-explorer-pennant'];

function spots(level) {
  const extra = Math.min(2, level);
  const list = [
    {id: 'roof', x: 260, y: 360, label: 'tent roof'},
    {id: 'gondola', x: 640, y: 520, label: 'next gondola'},
    {id: 'moon', x: 450, y: 180, label: 'horizon'},
    {id: 'spoke', x: 200, y: 700, label: 'wheel spoke'},
    {id: 'bag', x: 720, y: 280, label: 'luggage'},
  ];
  return list.slice(0, 3 + extra);
}

export default {
  title: 'Pocket Wheel',
  intro: 'Jasper’s gondola rises over the midway. Drag the brass lens, hold to focus, then tap what comes sharp.',
  instructions: 'Drag the lens onto a glint and hold until it sharpens, then tap. First chapter ride is free practice and keeps nothing.',
  levels: ['First Look', 'Gondola Secrets', 'Rooftop Trail', 'Cloud Occlusion', 'Moonlight Markings', 'The High Horizon'],
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 75,
  create(level, rng) {
    const list = spots(level);
    return makeRideState(level, rng, {
      lensX: 450, lensY: 640, focus: 0, focused: null, found: 0,
      spots: list, goal: 3, angle: 0, drag: null, treasureId: TREASURES[level] || TREASURES[0],
    });
  },
  update(s, dt) {
    if (s.result || s.broke) return;
    if (ensureBoarded(s, RIDE, s.treasureId, s.spots.map(o => o.id))) {
      s.note = s.practice ? 'Practice — focus three glints. Nothing is kept.' : 'Drag the lens. Hold to focus. Tap.';
    }
    if (s.result) return;
    s.t += dt;
    s.angle += dt * 0.18;
    s.progress = Math.min(1, s.t / 42);
    const target = s.spots.find(o => !o.taken && Math.hypot(s.lensX - o.x, s.lensY - o.y) < 70);
    if (s.drag && target) {
      s.focus = Math.min(1, s.focus + dt / 0.85);
      if (s.focus >= 1) s.focused = target.id;
    } else {
      s.focus = Math.max(0, s.focus - dt * 0.8);
      if (s.focus < 0.4) s.focused = null;
    }
    if (s.eligible && !s.treasure && s.t > 8) {
      const spot = s.spots.find(o => o.id === s.spawnId) || s.spots[0];
      s.treasure = {id: s.treasureId, x: spot.x, y: spot.y, spot: spot.id, taken: false};
    }
    if (s.t >= 42) finishRide(s, {rideId: RIDE, treasureId: s.treasureId, challengeOk: s.found >= s.goal, completionFind: 'moon-penny'});
  },
  pointer(s, type, p) {
    if (type === 'down') { s.drag = p; logAction(s, 'lens-down', {x: p.x, y: p.y}); }
    if (type === 'move' && s.drag) {
      s.lensX = clamp(p.x, 80, 820);
      s.lensY = clamp(p.y, 120, 900);
    }
    if (type === 'up') {
      if (s.focused && s.focus >= 1) {
        const spot = s.spots.find(o => o.id === s.focused && !o.taken);
        if (spot && Math.hypot(p.x - spot.x, p.y - spot.y) < 80) {
          spot.taken = true;
          s.found += 1;
          recordFind(s, ['everyday-penny', 'star-token', 'moon-penny'][s.found % 3], RIDE);
          s.note = s.found + ' / ' + s.goal + ' brought into focus.';
          logAction(s, 'collect', {id: spot.id});
        }
        if (s.treasure && !s.treasure.taken && s.focused === s.treasure.spot) {
          s.treasureRevealed = true;
          if (Math.hypot(p.x - s.treasure.x, p.y - s.treasure.y) < 80) {
            s.treasure.taken = true;
            recordTreasure(s, s.treasure.id);
            s.note = 'The distant keepsake is yours.';
          }
        }
      }
      s.drag = null;
    }
    if (type === 'cancel') s.drag = null;
  },
  draw(s, d) {
    d.ellipse(450, 1100, 500, 200, '#1a2030');
    d.circle(450, 620, 260, null, '#d2a65b', 10);
    for (let i = 0; i < 8; i++) {
      const a = s.angle + i * Math.PI / 4;
      d.line({x: 450, y: 620}, {x: 450 + Math.cos(a) * 250, y: 620 + Math.sin(a) * 250}, '#b78b48', 3);
    }
    s.spots.forEach(o => {
      if (o.taken) return;
      d.glow(o.x, o.y, 28, '#ffe6a4');
      d.circle(o.x, o.y, 10, '#f0d09a');
    });
    if (s.treasure && !s.treasure.taken) {
      d.item(spriteKey(s.treasure.id), s.treasure.x, s.treasure.y, {w: s.focused === s.treasure.spot ? 64 : 28, alpha: 0.4 + s.focus * 0.6, shadow: false, fallback: () => d.star(s.treasure.x, s.treasure.y, 12)});
    }
    d.circle(s.lensX, s.lensY, 70, null, '#d2a65b', 6);
    d.circle(s.lensX, s.lensY, 54, null, '#f4d590', 2);
    if (s.focus > 0) d.arc(s.lensX, s.lensY, 80, -Math.PI / 2, -Math.PI / 2 + s.focus * Math.PI * 2, '#f4d590', 5);
    drawHud(d, s, {goal: s.goal, count: s.found, label: 'focused'});
  },
  readout: s => s.note || '',
};
