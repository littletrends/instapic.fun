/* Laughing Doorway — authored room graph.
 * cache: dress-ready-5e
 *
 * ALL 6 chapters = Pac-Man carnival maze (MOVE / CHOMP / chase). ONE shared
 * maze LAYOUT for every chapter — same corridors, same verb. Chapters vary
 * STRATEGY/fairness only: clearGoal, faceSpeed, playerSpeed, powerSec,
 * faceCount, house timer, scenery density flag (props, not grid).
 * Old punchline-door CHAPTER2–6 room graphs retired from play routing.
 *
 * Path chips = simple geometric dots only (not catalogue coins).
 * TREASURES exclusive Ch1–6 — chapter bonus sits cream-border / off-path;
 *   starKey at mid-court UNLOCKS only; bonus collects on screen clear (clearGoal).
 * Portals A/B on middle left/right edge walls — two-way through (enter L→exit R & vice versa).
 * Power / invisible tokens flash chase-face masks for a beat; soft-bomb on touch stays.
 *
 * SCENERY: funhouse.png backdrop + cream oval; Tent_26_Bea curtain portals one each side (right flipped);
 *   no cream duplicate drapes / moon / light / standee. bea-player = YOU.
 *   BONUS Ch1–6 token-sized KEEP/TREASURE. No alley wall-turnaround / wall webp.
 *   Laugh-faces = PNG cutouts in assets/funhouse-faces/ (soft bomb on touch).
 * CONTROLS: centre MOVE stick on canvas bottom + maze swipe + keyboard; no arrow pads; no curtain pads.
 * FAIRNESS baseline Ch1: clearGoal 16; house 110s; faceSpeed 56;
 *   playerSpeed 168; powerSec 7.5. Later chapters tighten goal / faces / power.
 *
 * Locked lane: carnival chase energy × punchline power × Finish the Joke comedy.
 * Soft fails never abort paid ride (face bomb = soft relocate to start).
 * dress-ready-5e: practice mode skipped in funhouse.js — maze starts eligible.
 */

export const RIDE = 'funhouse';
/* Treasure ids provisional per Lorie brief — keep in sync with prizes.js until renamed. */
export const TREASURES = [
  'laughing-doorway',
  'heart-biscuit',
  'star-token',
  'moon-penny',
  'ride-ticket',
  'stage-door-pass',
];
export const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
export const LEVEL_NAMES = [
  'Laughing Maze',
  'Mirror Joke',
  'Upside Down',
  'Shrinking Hall',
  'Midway Echoes',
  'The Last Laugh',
];

/** Seconds to pick a door after the required clue finishes (legacy door path). */
export const CHOICE_SECONDS = 6;

export const PHASE_SECONDS = {
  enter: 0.28,
  reveal: 1.05,
  inspect: 0.85,
  transition: 0.72,
  detourReveal: 1.55,
  spin: 0.85,
  spinTeach: 1.05,
};

/** Eligible treasure spawn ids — maze chapters share last-laugh spawn slot. */
export const SPAWN_IDS = ['last-laugh'];

/** Oval stage clamp for chase faces / player paper sprite. */
export const STAGE = {xMin: 200, xMax: 700, yMin: 450, yMax: 900};

/**
 * ONE shared 11×13 corridor maze inside cream oval (cell 40px).
 * All chapters use this exact layout — fairness varies elsewhere.
 * A/B = paired two-way portal mouths (widened AA….BB corridor) on middle left/right edge walls.
 * K = starKey mid-court (was treasure seat). D = punchline door. F = face house. S = start.
 * dress-ready-5d: restore all inner walls; only two open bricks behind each curtain (A...###...B).
 */
const SHARED_MAZE_LAYOUT = [
  // Walls restored (Lorie). Only two open bricks behind each curtain (A...###...B).
  '###########',
  '#o...#...o#',
  '#.##.#.##.#',
  '#.........#',
  '##.#.F.#.##',
  '#..#.K.#..#',
  'A...###...B',
  '#.........#',
  '###.#D#.###',
  '#o..#.#..o#',
  '#.##...##.#',
  '#....S....#',
  '###########',
];

function mazeChapter(spec) {
  const {
    id, title, caption, clearGoal, faceSpeed, powerSec, faceCount,
    playerSpeed = 168, houseSeconds = 110, scenery = 'full',
  } = spec;
  return {
    id,
    mode: 'maze',
    start: 'maze',
    mainCount: 1,
    scenery,
    houseSeconds,
    rooms: {
      maze: {
        id: 'maze',
        kind: 'maze',
        title,
        caption: caption || 'Chomp the midway chips — shut a punchline when you glow.',
        revealNote: 'MOVE · CHOMP · LAUGH-FACES CHASE',
        chooseNote: 'Clear the pellets — power lets you chase back.',
        // Chapter bonus cream-border / off-path — locked until starKey UNLOCK;
        // collect only after screen clear (clearGoal / mazeCleared).
        treasure: {spawnId: 'last-laugh', x: 755, y: 700, r: 22, lockedUntilKey: true},
        faces: faceCount,
      },
    },
    maze: {
      cols: 11,
      rows: 13,
      cell: 40,
      ox: 230,
      oy: 495,
      powerSec,
      faceSpeed,
      clearGoal,
      playerSpeed,
      faceCount,
      /** # wall  . pellet  o power  + empty  S start  F face  D punchline-door
       *  A/B portals  K starKey mid-court */
      layout: SHARED_MAZE_LAYOUT,
    },
  };
}

export const CHAPTER1 = mazeChapter({
  id: 'laughing-maze',
  title: 'Laughing Maze',
  caption: 'Chomp the midway chips — shut a punchline when you glow.',
  clearGoal: 16,
  faceSpeed: 56,
  playerSpeed: 168,
  powerSec: 7.5,
  faceCount: 3,
  houseSeconds: 110,
  scenery: 'full',
});

export const CHAPTER2 = mazeChapter({
  id: 'mirror-joke-maze',
  title: 'Mirror Joke',
  caption: 'Same corridors — chomp a few more chips; faces a touch faster.',
  clearGoal: 18,
  faceSpeed: 62,
  playerSpeed: 168,
  powerSec: 7.0,
  faceCount: 3,
  houseSeconds: 105,
  scenery: 'full',
});

export const CHAPTER3 = mazeChapter({
  id: 'upside-down-maze',
  title: 'Upside Down',
  caption: 'Same maze verb — power window shorter, chase stays fair.',
  clearGoal: 20,
  faceSpeed: 68,
  playerSpeed: 172,
  powerSec: 6.5,
  faceCount: 4,
  houseSeconds: 100,
  scenery: 'dense',
});

export const CHAPTER4 = mazeChapter({
  id: 'shrinking-hall-maze',
  title: 'Shrinking Hall',
  caption: 'Same lanes — more chips to clear, faces lean in.',
  clearGoal: 22,
  faceSpeed: 74,
  playerSpeed: 176,
  powerSec: 6.0,
  faceCount: 4,
  houseSeconds: 95,
  scenery: 'dense',
});

export const CHAPTER5 = mazeChapter({
  id: 'midway-echoes-maze',
  title: 'Midway Echoes',
  caption: 'Same corridors — denser props, brisk faces, brief punchline power.',
  clearGoal: 24,
  faceSpeed: 80,
  playerSpeed: 180,
  powerSec: 5.5,
  faceCount: 4,
  houseSeconds: 90,
  scenery: 'dense',
});

export const CHAPTER6 = mazeChapter({
  id: 'last-laugh-maze',
  title: 'The Last Laugh',
  caption: 'Finale fairness on the same maze — fullest chase, clear the big chomp.',
  clearGoal: 26,
  faceSpeed: 88,
  playerSpeed: 184,
  powerSec: 5.0,
  faceCount: 5,
  houseSeconds: 90,
  scenery: 'finale',
});

export function chapterGraph(level) {
  // Every level 0–5 → maze mode (old punchline-door graphs retired from play).
  const n = Math.max(0, Math.min(5, level | 0));
  return [CHAPTER1, CHAPTER2, CHAPTER3, CHAPTER4, CHAPTER5, CHAPTER6][n];
}

export function roomOf(graph, id) {
  return graph.rooms[id] || graph.rooms[graph.start];
}
