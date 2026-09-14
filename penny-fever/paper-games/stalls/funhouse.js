import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'funhouse';
const TREASURES = ['laughing-doorway', 'balloon-bouquet', 'music-carousel', 'pocket-wheel', 'organ-music-box', 'ride-stamp-book'];
const CLUES = [
  {glyph: '♥', color: '#c45a3a', name: 'heart'},
  {glyph: '★', color: '#d2a65b', name: 'star'},
  {glyph: '●', color: '#3a7aaa', name: 'moon'},
];

function roomsFor(level) {
  const n = 3 + Math.min(3, level);
  return Array.from({length: n}, (_, i) => {
    const clue = CLUES[i % CLUES.length];
    const doors = [
      {id: 'left', clue: CLUES[i % CLUES.length], correct: true},
      {id: 'right', clue: CLUES[(i + 1) % CLUES.length], correct: false},
    ];
    if (level >= 1) doors.push({id: 'middle', clue: CLUES[(i + 2) % CLUES.length], correct: false});
    return {clue, doors, done: false};
  });
}

export default {
  title: 'Laughing Doorway',
  intro: 'Juno’s funhouse carries you from room to room. Read the clue, then choose the door that matches.',
  instructions: 'A clue appears. Tap the matching door. Wrong doors detour, then return. First chapter ride is free practice and keeps nothing.',
  levels: ['Two Doors', 'Mirror Joke', 'Rotating Hall', 'Upside Corridor', 'Shadow Rides', 'The Last Laugh'],
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 80,
  create(level, rng) {
    const rooms = roomsFor(level);
    return makeRideState(level, rng, {
      rooms, room: 0, picks: 0, goal: rooms.length, wait: 0, treasureId: TREASURES[level] || TREASURES[0],
    });
  },
  update(s, dt) {
    if (s.result || s.broke) return;
    if (ensureBoarded(s, RIDE, s.treasureId, ['last-room'])) {
      s.note = s.practice ? 'Practice — match the clue on each door. Nothing is kept.' : 'Match the clue. Choose a door.';
    }
    if (s.result) return;
    s.t += dt;
    s.progress = (s.room + (s.wait > 0 ? 0.5 : 0)) / s.goal;
    if (s.wait > 0) {
      s.wait -= dt;
      if (s.wait <= 0) {
        if (s.room >= s.goal) finishRide(s, {rideId: RIDE, treasureId: s.treasureId, challengeOk: s.picks >= s.goal, completionFind: 'star-token'});
      }
    }
  },
  pointer(s, type, p) {
    if (type === 'up' || type === 'cancel') s.tapping = false;
    if (type !== 'down' || s.tapping || s.wait > 0 || s.result) return;
    s.tapping = true;
    const room = s.rooms[s.room];
    if (!room) return;
    if (s.treasure && !s.treasure.taken && s.room === s.goal - 1 && Math.hypot(p.x - 450, p.y - 360) < 70) {
      s.treasure.taken = true;
      recordTreasure(s, s.treasure.id);
      s.note = 'The real laugh — the keepsake is yours.';
      return;
    }
    const n = room.doors.length;
    const w = 700 / n;
    const i = Math.floor((p.x - 100) / w);
    const door = room.doors[i];
    if (!door) return;
    logAction(s, 'door', {room: s.room, door: door.id});
    if (door.correct) {
      s.picks += 1;
      recordFind(s, ['everyday-penny', 'star-token', 'moon-penny'][s.picks % 3], RIDE);
      s.note = 'The room giggles and lets you through.';
      s.room += 1;
      if (s.eligible && s.room === s.goal - 1) {
        s.treasure = {id: s.treasureId, taken: false};
        s.treasureRevealed = true;
      }
      if (s.room >= s.goal) {
        s.wait = 0.4;
        finishRide(s, {rideId: RIDE, treasureId: s.treasureId, challengeOk: s.picks >= s.goal, completionFind: 'star-token'});
      }
    } else {
      s.note = 'A joke door. Back you come — look again.';
      s.wait = 0.8;
    }
  },
  draw(s, d) {
    const room = s.rooms[Math.min(s.room, s.rooms.length - 1)];
    d.poly([[80, 160], [820, 160], [820, 900], [80, 900]], '#3a1820', '#d2a65b', 4);
    d.text('clue', 450, 210, 22, '#e8d0a0');
    d.text(room.clue.glyph, 450, 310, 92, room.clue.color);
    d.text(room.clue.name, 450, 380, 32, '#f0d09a');
    if (s.treasure && !s.treasure.taken && s.treasureRevealed) {
      d.glow(450, 430, 40, '#f4d590');
      d.item(spriteKey(s.treasure.id), 450, 430, {w: 58, shadow: false, fallback: () => d.heart(450, 430, 16)});
    }
    const n = room.doors.length;
    const w = 700 / n;
    room.doors.forEach((door, i) => {
      const x = 100 + i * w + w / 2;
      d.poly([[x - w * 0.38, 620], [x + w * 0.38, 620], [x + w * 0.38, 880], [x - w * 0.38, 880]], '#4a2418', '#f0d09a', 3);
      d.text(door.clue.glyph, x, 730, 56, door.clue.color);
      d.text(door.id, x, 820, 24, '#e8d0a0');
    });
    drawHud(d, s, {goal: s.goal, count: s.picks, label: 'rooms'});
  },
  readout: s => s.note || '',
};
