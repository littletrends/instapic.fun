import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
} from '../ride-seek.js?v=phone-layout-1';

const RIDE = 'mural';
const TREASURES = ['painted-bay', 'pocket-wheel', 'music-carousel', 'laughing-doorway', 'balloon-bouquet', 'ride-explorer-pennant'];
const PIGMENTS = [
  {id: 'burgundy', name: 'Burgundy heart', glyph: '♥', color: '#6b2030'},
  {id: 'gold', name: 'Gold star', glyph: '★', color: '#d2a65b'},
  {id: 'green', name: 'Green moon', glyph: '●', color: '#3a6a4a'},
];
const MOTIFS = [
  {id: 'lantern', label: 'lantern', pair: ['burgundy', 'gold']},
  {id: 'balloons', label: 'balloons', pair: ['burgundy', 'gold']},
  {id: 'horse', label: 'horse', pair: ['burgundy', 'gold']},
];

function pairOk(selected, pair) {
  if (selected.length !== 2) return false;
  return pair.every(id => selected.includes(id));
}

export default {
  title: 'Painted Bay',
  intro: 'Arlo’s platform rolls along the living mural. Mix two pigments, then hold Paint as the stencil passes.',
  instructions: 'Tap two pigment buttons, then hold Paint while the stencil sits in the roller frame. Two restored panels finish Chapter 1. First ride is free practice and keeps nothing.',
  levels: ['First Wash', 'Lantern Row', 'Carousel Frieze', 'Evening Panorama', 'Midway Memories', 'The Living Bay'],
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 80,
  actions: [
    {id: 'burgundy', label: '♥ Burgundy'},
    {id: 'gold', label: '★ Gold'},
    {id: 'clear', label: 'Clear mix'},
    {id: 'paint', label: 'Paint · hold', hold: true},
  ],
  create(level, rng) {
    const pigments = level === 0 ? PIGMENTS.slice(0, 2) : PIGMENTS;
    const panels = MOTIFS.slice(0, 3).map((m, i) => ({
      ...m,
      pair: level === 0 ? ['burgundy', 'gold'] : [pigments[i % pigments.length].id, pigments[(i + 1) % pigments.length].id],
      restored: false, retries: 0, t: 8 + i * 12,
    }));
    return makeRideState(level, rng, {
      pigments, panels, selected: [], painting: false, hold: 0, restored: 0, goal: 2,
      panel: 0, discovery: 0, treasureId: TREASURES[level] || TREASURES[0], x: 0,
    });
  },
  update(s, dt, input) {
    if (s.result || s.broke) return;
    if (ensureBoarded(s, RIDE, s.treasureId, s.panels.map(p => p.id))) {
      s.note = s.practice ? 'Practice — restore two panels. Nothing is kept.' : 'Mix, then hold Paint in the frame.';
    }
    if (s.result) return;
    s.t += dt;
    s.x += dt * 42;
    s.progress = Math.min(1, s.t / 44);
    const panel = s.panels[s.panel];
    if (s.discovery > 0) {
      s.discovery -= dt;
      if (s.discovery <= 0) {
        s.panel += 1;
        s.hold = 0;
        if (s.panel >= s.panels.length) {
          finishRide(s, {rideId: RIDE, treasureId: s.treasureId, challengeOk: s.restored >= s.goal, completionFind: 'star-token'});
        }
      }
      return;
    }
    if (!panel) return;
    const inFrame = s.t > panel.t && s.t < panel.t + 3.2;
    const painting = s.painting || input?.actions?.has?.('paint');
    if (inFrame && painting && pairOk(s.selected, panel.pair)) {
      s.hold += dt;
      if (s.hold >= 0.85 && !panel.restored) {
        panel.restored = true;
        s.restored += 1;
        recordFind(s, ['everyday-penny', 'star-token', 'moon-penny'][s.restored % 3], RIDE);
        s.note = 'The wall wakes — ' + s.restored + ' / ' + s.goal + '.';
        logAction(s, 'restore', {id: panel.id});
        s.discovery = 3.1;
        if (s.eligible && (s.spawnId === panel.id || (!s.treasure && s.restored === 1))) {
          s.treasure = {id: s.treasureId, taken: false};
          s.treasureRevealed = true;
        }
      }
    } else if (!painting) s.hold = Math.max(0, s.hold - dt * 0.5);
    if (s.t > panel.t + 3.4 && !panel.restored) {
      panel.retries += 1;
      if (panel.retries <= 1 && s.level === 0) {
        panel.t = s.t + 2.2;
        s.note = 'One more pass at this panel.';
      } else {
        s.panel += 1;
        s.hold = 0;
        if (s.panel >= s.panels.length) {
          finishRide(s, {rideId: RIDE, treasureId: s.treasureId, challengeOk: s.restored >= s.goal, completionFind: 'star-token'});
        }
      }
    }
  },
  action(s, id, on) {
    if (id === 'clear') s.selected = [];
    else if (id === 'paint') s.painting = !!on;
    else if (PIGMENTS.some(p => p.id === id) && on !== false) {
      if (s.selected.includes(id)) s.selected = s.selected.filter(x => x !== id);
      else if (s.selected.length < 2) s.selected = s.selected.concat(id);
    }
  },
  pointer(s, type, p) {
    if (type === 'down' && s.treasure && !s.treasure.taken && s.discovery > 0 && Math.hypot(p.x - 450, p.y - 420) < 70) {
      s.treasure.taken = true;
      recordTreasure(s, s.treasure.id);
      s.note = 'A real miniature in the wet paint.';
    }
    if (type === 'down' && p.y > 980) s.painting = true;
    if (type === 'up' || type === 'cancel') s.painting = false;
  },
  draw(s, d) {
    const panel = s.panels[Math.min(s.panel, s.panels.length - 1)];
    d.text(panel ? panel.label : 'gallery', 450, 210, 36, '#f0d09a');
    if (panel) {
      d.text('recipe  ♥  +  ★', 450, 268, 28, '#fff6d8');
      const inFrame = s.t > panel.t && s.t < panel.t + 3.2;
      d.poly([[300, 320], [600, 320], [600, 700], [300, 700]], panel.restored ? '#6b2030' : '#2a1814', inFrame ? '#f4d590' : '#b78b48', inFrame ? 8 : 3);
      if (panel.restored) d.text('awake', 450, 500, 24, '#f4d590');
      if (s.hold > 0) d.arc(450, 510, 80, -Math.PI / 2, -Math.PI / 2 + Math.min(1, s.hold / 0.85) * Math.PI * 2, '#f4d590', 6);
    }
    if (s.treasure && !s.treasure.taken && s.discovery > 0) {
      d.glow(450, 420, 48, '#f4d590');
      d.item(spriteKey(s.treasure.id), 450, 420, {w: 68, shadow: false, fallback: () => d.star(450, 420, 16)});
    }
    s.pigments.forEach((p, i) => {
      const x = 200 + i * 250;
      const on = s.selected.includes(p.id);
      d.circle(x, 900, 48, on ? p.color : '#2a1814', '#f0d09a', 3);
      d.text(p.glyph, x, 908, 28, '#fff6d8');
    });
    drawHud(d, s, {goal: s.goal, count: s.restored, label: 'panels'});
  },
  readout: s => s.note || '',
};
