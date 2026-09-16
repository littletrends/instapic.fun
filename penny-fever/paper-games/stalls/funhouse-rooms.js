/* Laughing Doorway — authored room graph.
 * cache: maze-ch1-4
 *
 * Chapter 1 Laughing Maze (BUILD): maze-chase–inspired carnival maze inside the
 *   cream oval — move along corridors, chomp star/moon/penny pellets, dodge
 *   chasing laugh-faces; power pellets / punchline door → brief chase-back.
 *   NOT a licensed-maze clone (no clone character names or art). Primary loop = maze
 *   run + chomp + chase (door gags are set-pieces only).
 *
 * CHAPTER BONUSES on path: star / moon / penny chips + Ch1 keepsake
 *   laughing-doorway via ride-seek boarding (sprites:
 *   assets/restyle/game-sprites/ride-keepsakes/laughing-doorway/front.png).
 * TREASURES list unchanged; only Ch1 maze ships now.
 *
 * SCENERY (existing art — no Imagine; maze built AROUND cream court):
 *   playfield paper-games/assets/funhouse.png (+ Concepts Amusement_06);
 *   6-pack walls assets/restyle/scene-turnarounds-2026-09-09/amusements/funhouse/;
 *   Tent_26_Bea dress BUILD still HELD — maze props only via assets/funhouse-bea/
 *   split cutouts (doorway/curtain/spotlight/moon + optional attendant).
 * Canvas draws oval court only — do not overpaint #backdrop playfield.
 * FAIRNESS: clearGoal 16 (bonus chomp beyond); house via MAZE_HOUSE 110s; faces slower.
 *
 * FREEZE Ch2–Ch6 (levels ≥1): Mirror Joke / Upside Down / Shrinking Hall /
 *   Midway Echoes / The Last Laugh keep existing CHAPTER2–6 graphs so routing
 *   still loads without crash. Polish-only; do not expand until Ch1 maze ships.
 *
 * Locked lane: carnival chase energy × punchline power × Finish the Joke comedy.
 * Prizes TREASURES unchanged. Soft fails never abort paid ride.
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

/** Seconds to pick a door after the required clue finishes. */
export const CHOICE_SECONDS = 6;

export const PHASE_SECONDS = {
  enter: 0.28,
  reveal: 1.05,
  inspect: 0.85,
  transition: 0.72,
  detourReveal: 1.55,
  /** Brief paper slide/swap after inspect on rotate rooms. */
  spin: 0.85,
  spinTeach: 1.05,
};

/** Eligible treasure spawn ids — Ch1–Ch3 last rooms share last-laugh. */
export const SPAWN_IDS = ['last-laugh'];

/** Oval stage clamp for chase faces / player paper sprite. */
export const STAGE = {xMin: 200, xMax: 700, yMin: 450, yMax: 900};

const LDOOR = {x: 268, y: 820, w: 168, h: 268};
const RDOOR = {x: 632, y: 820, w: 168, h: 268};

function door(id, to, extra = {}) {
  const box = id === 'left' ? LDOOR : RDOOR;
  return {id, to, x: box.x, y: box.y, w: box.w, h: box.h, ...extra};
}

export const CHAPTER1 = {
  id: 'laughing-maze',
  mode: 'maze',
  start: 'maze',
  mainCount: 1,
  rooms: {
    maze: {
      id: 'maze',
      kind: 'maze',
      title: 'Laughing Maze',
      caption: 'Chomp the midway chips — shut a punchline when you glow.',
      revealNote: 'MOVE · CHOMP · LAUGH-FACES CHASE',
      chooseNote: 'Clear the pellets — power lets you chase back.',
      treasure: {spawnId: 'last-laugh', col: 5, row: 4, r: 52},
      faces: 3,
    },
  },
  /** 11×13 corridor maze inside cream oval (cell 40px). */
  maze: {
    cols: 11,
    rows: 13,
    cell: 40,
    ox: 230,
    oy: 495,
    powerSec: 7.5,
    faceSpeed: 56,
    clearGoal: 16,
    playerSpeed: 168,
    faceCount: 3,
    /** # wall  . pellet  o power  + empty  S start  F face  D punchline-door */
    layout: [
      '###########',
      '#o...#...o#',
      '#.##.#.##.#',
      '#.........#',
      '##.#.+.#.##',
      '#..#.F.#..#',
      '#.#######.#',
      '#.........#',
      '###.#D#.###',
      '#o..#.#..o#',
      '#.##...##.#',
      '#....S....#',
      '###########',
    ],
  },
};

export const CHAPTER2 = {
  id: 'mirror-joke',
  start: 'foyer',
  mainCount: 3,
  rooms: {
    foyer: {
      id: 'foyer',
      kind: 'main',
      title: 'Mirror Foyer',
      teach: true,
      mirror: true,
      /* Long clear coaching window — teach hazard alone (Tilly helter Ch2 bar). */
      revealSec: 2.35,
      inspectSec: 2.15,
      setup: 'Why did the comedian carry a looking-glass?',
      setupProp: 'mirror',
      caption: 'MIRROR LIES — SHUT the door that finishes the SETUP.',
      revealNote: 'MIRROR LIES — SHUT the door that finishes the SETUP.',
      inspectNote: 'Glass swaps the punchlines. Read the real doors — then SHUT.',
      chooseNote: 'MIRROR LIES — SHUT THE PUNCHLINE',
      doors: [
        door('left', 'gallery', {
          correct: true,
          punchline: 'To reflect on the gag!',
          label: 'Reflect on the gag',
        }),
        door('right', 'shard', {
          correct: false,
          punchline: 'Twice the laugh!',
          label: 'Twice the laugh',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'mirror', x: 450, y: 548, r: 70,
          flavor: 'SETUP on the oval is true. The glass beside the doors lies.'},
        {id: 'shard-find', kind: 'find', prop: 'cushion', x: 300, y: 630, r: 40, find: 'star-token',
          flavor: 'A star token under a paper cushion — not the punchline.'},
        {id: 'ribbon', kind: 'flavor', prop: 'panel', x: 600, y: 620, r: 34,
          flavor: 'Pretty paper. The punchline is still on a real door.'},
      ],
      faces: 1,
    },
    shard: {
      id: 'shard',
      kind: 'detour',
      title: 'Mirror Shard',
      joke: 'shard',
      caption: 'A polite shard bows — then points you onward.',
      revealNote: 'Wrong punchline — a mirror shard joke. Gallery waits ahead.',
      rejoin: 'gallery',
    },
    gallery: {
      id: 'gallery',
      kind: 'main',
      title: 'Looking Gallery',
      mirror: true,
      /* Same hazard, shorter teach — no new stack. */
      revealSec: 1.05,
      inspectSec: 0.85,
      setup: 'What do you call a funny looking-glass?',
      setupProp: 'pane',
      caption: 'Same lie. SHUT the door that finishes the SETUP.',
      revealNote: 'MIRROR LIES — trust the SETUP, not the glass.',
      inspectNote: 'Glass still swaps sides. Real doors keep the truth.',
      chooseNote: 'SHUT THE PUNCHLINE',
      doors: [
        door('left', 'cracked', {
          correct: false,
          punchline: 'A giggle pane',
          label: 'Giggle pane',
        }),
        door('right', 'last-court', {
          correct: true,
          punchline: 'A punchline pane!',
          label: 'Punchline pane',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'pane', x: 450, y: 548, r: 70,
          flavor: 'SETUP stays true. Mirror still swaps the door lines.'},
        {id: 'panel', kind: 'find', prop: 'panel', x: 590, y: 636, r: 42, find: 'moon-penny',
          flavor: 'A moon penny behind a sliding paper panel.'},
        {id: 'tassel', kind: 'flavor', prop: 'cushion', x: 310, y: 630, r: 36,
          flavor: 'A velvet tassel. Soft — not the punchline.'},
      ],
      faces: 1,
    },
    cracked: {
      id: 'cracked',
      kind: 'detour',
      title: 'Cracked Reflection',
      joke: 'cracked',
      caption: 'The reflection cracks up — then ushers you on.',
      revealNote: 'Cracked reflection gag. Last court is just ahead.',
      rejoin: 'last-court',
    },
    'last-court': {
      id: 'last-court',
      kind: 'main',
      title: 'Last Mirror Court',
      mirror: true,
      last: true,
      setup: 'Knock knock. Who\'s there? Mirror.',
      setupProp: 'knock',
      caption: 'Final punchline. Mirror still lies once — then the laughing door.',
      revealNote: 'MIRROR LIES once more — SHUT the last laugh.',
      inspectNote: 'If a keepsake is here, it sits in the open — tap it.',
      chooseNote: 'SHUT THE LAST LAUGH',
      doors: [
        door('left', 'exit', {
          correct: true,
          lastLaugh: true,
          punchline: 'Mirror who? — exit!',
          label: 'Mirror who? — exit',
        }),
        door('right', 'fog', {
          correct: false,
          punchline: 'Stay and stare',
          label: 'Stay and stare',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'knock', x: 450, y: 540, r: 70,
          flavor: 'Mirror who? The laughing door finishes the gag — not the glass.'},
        {id: 'mouth', kind: 'flavor', prop: 'mouth', x: 268, y: 700, r: 40,
          flavor: 'A comedy mouth. It only laughs for the true punchline.'},
        {id: 'court-cushion', kind: 'flavor', prop: 'cushion', x: 600, y: 640, r: 38,
          flavor: 'A court cushion. Soft landing, no secret.'},
      ],
      treasure: {spawnId: 'last-laugh', x: 450, y: 470, r: 58},
      faces: 1,
    },
    fog: {
      id: 'fog',
      kind: 'detour',
      title: 'Foggy Glass',
      joke: 'fog',
      caption: 'The glass fogs over, then clears the way back.',
      revealNote: 'Not the last laugh. Back to the court — finish the joke.',
      rejoin: 'last-court',
    },
  },
};

/**
 * Chapter 3 — Upside Down.
 * ONE new hazard taught alone on the first main room: the room rotates.
 * Mark door positions before the turn; punchline plates stay on the door objects
 * as they visually swap places (left↔right). Memory solves which physical door
 * still finishes the SETUP. Soft fails only — detour → rejoin. Never abort.
 * No mirror restack — Ch3 focuses on rotate only. NOT wink / look-direction Simon.
 */
export const CHAPTER3 = {
  id: 'upside-down',
  start: 'foyer',
  mainCount: 3,
  rooms: {
    foyer: {
      id: 'foyer',
      kind: 'main',
      title: 'Spin Foyer',
      teachRotate: true,
      rotate: true,
      /* Long clear coaching window — teach rotate alone (helter Ch3 bar). */
      revealSec: 2.35,
      inspectSec: 2.15,
      setup: 'Why did the funhouse tip the foyer?',
      setupProp: 'spin',
      caption: 'MARK THE DOORS — then the room turns. SHUT the punchline after.',
      revealNote: 'MARK THE DOORS — then the room turns.',
      inspectNote: 'Punchlines ride with the doors. Mark them — then wait for the spin.',
      chooseNote: 'REMEMBER — then SHUT THE PUNCHLINE',
      doors: [
        door('left', 'gallery', {
          correct: true,
          punchline: 'For a punchline flip!',
          label: 'Punchline flip',
        }),
        door('right', 'dizzy', {
          correct: false,
          punchline: 'More spinning!',
          label: 'More spinning',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'spin', x: 450, y: 548, r: 70,
          flavor: 'SETUP stays true. Mark which door finishes it — then the room turns.'},
        {id: 'spin-find', kind: 'find', prop: 'cushion', x: 300, y: 630, r: 40, find: 'star-token',
          flavor: 'A star token under a paper cushion — not the punchline.'},
        {id: 'ribbon', kind: 'flavor', prop: 'panel', x: 600, y: 620, r: 34,
          flavor: 'Pretty paper. Mark the punchline doors before they swap.'},
      ],
      faces: 1,
    },
    dizzy: {
      id: 'dizzy',
      kind: 'detour',
      title: 'Dizzy Joke',
      joke: 'dizzy',
      caption: 'The room spins a polite circle, then points you onward.',
      revealNote: 'Wrong punchline — a dizzy gag. Gallery waits ahead.',
      rejoin: 'gallery',
    },
    gallery: {
      id: 'gallery',
      kind: 'main',
      title: 'Turn Gallery',
      rotate: true,
      /* Same hazard, shorter — no new stack (no mirror teach). */
      revealSec: 1.05,
      inspectSec: 0.85,
      setup: 'What do you call a hallway that flips?',
      setupProp: 'turn',
      caption: 'Same spin. MARK — then SHUT the door that finishes the SETUP.',
      revealNote: 'Room turns again — mark the punchlines first.',
      inspectNote: 'Doors will swap. Remember which finishes the SETUP.',
      chooseNote: 'REMEMBER — SHUT THE PUNCHLINE',
      doors: [
        door('left', 'whirl', {
          correct: false,
          punchline: 'A soft tumble',
          label: 'Soft tumble',
        }),
        door('right', 'last-court', {
          correct: true,
          punchline: 'A flip gag!',
          label: 'Flip gag',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'turn', x: 450, y: 548, r: 70,
          flavor: 'SETUP stays true. Mark the finishing door before the spin.'},
        {id: 'panel', kind: 'find', prop: 'panel', x: 590, y: 636, r: 42, find: 'moon-penny',
          flavor: 'A moon penny behind a sliding paper panel.'},
        {id: 'tassel', kind: 'flavor', prop: 'cushion', x: 310, y: 630, r: 36,
          flavor: 'A velvet tassel. Soft — not the punchline.'},
      ],
      faces: 1,
    },
    whirl: {
      id: 'whirl',
      kind: 'detour',
      title: 'Whirl Hall',
      joke: 'whirl',
      caption: 'A paper whirl bows — then ushers you on.',
      revealNote: 'Whirl gag. Last court is just ahead.',
      rejoin: 'last-court',
    },
    'last-court': {
      id: 'last-court',
      kind: 'main',
      title: 'Last Spin Court',
      rotate: true,
      last: true,
      setup: 'Knock knock. Who\'s there? Upside.',
      setupProp: 'flip',
      caption: 'Final spin once — then the laughing door.',
      revealNote: 'One more turn — MARK, then SHUT the last laugh.',
      inspectNote: 'If a keepsake is here, it sits in the open — tap it.',
      chooseNote: 'SHUT THE LAST LAUGH',
      doors: [
        door('left', 'exit', {
          correct: true,
          lastLaugh: true,
          punchline: 'Upside who? — exit!',
          label: 'Upside who? — exit',
        }),
        door('right', 'topsy', {
          correct: false,
          punchline: 'Stay dizzy',
          label: 'Stay dizzy',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'flip', x: 450, y: 540, r: 70,
          flavor: 'Upside who? Mark the laughing door — then the room turns once.'},
        {id: 'mouth', kind: 'flavor', prop: 'mouth', x: 268, y: 700, r: 40,
          flavor: 'A comedy mouth. It only laughs for the true punchline.'},
        {id: 'court-cushion', kind: 'flavor', prop: 'cushion', x: 600, y: 640, r: 38,
          flavor: 'A court cushion. Soft landing, no secret.'},
      ],
      treasure: {spawnId: 'last-laugh', x: 450, y: 470, r: 58},
      faces: 1,
    },
    topsy: {
      id: 'topsy',
      kind: 'detour',
      title: 'Topsy Joke',
      joke: 'topsy',
      caption: 'Topsy-turvy admits the gag, then clears the way back.',
      revealNote: 'Not the last laugh. Back to the court — finish the joke.',
      rejoin: 'last-court',
    },
  },
};


/**
 * Chapter 4 — Shrinking Hall.
 * ONE new hazard taught alone on the first main room: perspective / near vs far.
 * Floor tiles / shadows prove which door is near (correct scale) vs far (tiny decoy).
 * Correct = NEAR door that finishes the SETUP. Soft fails only — detour → rejoin.
 * No mirror or rotate restack — Ch4 focuses on shrink only. NOT wink / look-direction Simon.
 */
export const CHAPTER4 = {
  id: 'shrinking-hall',
  start: 'foyer',
  mainCount: 3,
  rooms: {
    foyer: {
      id: 'foyer',
      kind: 'main',
      title: 'Shrink Foyer',
      teachShrink: true,
      shrink: true,
      /* Long clear coaching window — teach near/far alone. */
      revealSec: 2.35,
      inspectSec: 2.15,
      setup: 'Why did the hallway shrink the punchline?',
      setupProp: 'depth',
      caption: 'MARK THE SETUP — WHICH IS NEAR? SHUT the near punchline.',
      revealNote: 'MARK THE SETUP — WHICH IS NEAR?',
      inspectNote: 'Floor tiles prove depth. Near door matches SETUP — far is a tiny decoy.',
      chooseNote: 'SHUT THE NEAR PUNCHLINE',
      doors: [
        door('left', 'gallery', {
          correct: true,
          near: true,
          punchline: 'So the gag stayed close!',
          label: 'Gag stayed close',
        }),
        door('right', 'tiny', {
          correct: false,
          near: false,
          punchline: 'So it looked farther!',
          label: 'Looked farther',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'depth', x: 450, y: 548, r: 70,
          flavor: 'SETUP stays true. The near door finishes it — not the tiny far decoy.'},
        {id: 'shrink-find', kind: 'find', prop: 'cushion', x: 300, y: 630, r: 40, find: 'star-token',
          flavor: 'A star token under a paper cushion — not the punchline.'},
        {id: 'ribbon', kind: 'flavor', prop: 'panel', x: 600, y: 620, r: 34,
          flavor: 'Pretty paper. Read the floor — which door is near?'},
      ],
      faces: 1,
    },
    tiny: {
      id: 'tiny',
      kind: 'detour',
      title: 'Tiny Joke',
      joke: 'tiny',
      caption: 'A polite tiny door peeps, then points you onward.',
      revealNote: 'Wrong punchline — a tiny gag. Depth gallery waits ahead.',
      rejoin: 'gallery',
    },
    gallery: {
      id: 'gallery',
      kind: 'main',
      title: 'Depth Gallery',
      shrink: true,
      /* Same hazard, shorter — no new stack (no mirror/rotate teach). */
      revealSec: 1.05,
      inspectSec: 0.85,
      setup: 'What do you call a joke that walks away?',
      setupProp: 'hall',
      caption: 'Same depth rule. SHUT the NEAR door that finishes the SETUP.',
      revealNote: 'Near vs far again — trust the floor tiles.',
      inspectNote: 'Tiny far decoy may look tempting. SHUT the near punchline.',
      chooseNote: 'SHUT THE NEAR PUNCHLINE',
      doors: [
        door('left', 'echo', {
          correct: false,
          near: false,
          punchline: 'A distant giggle',
          label: 'Distant giggle',
        }),
        door('right', 'last-court', {
          correct: true,
          near: true,
          punchline: 'A close call!',
          label: 'Close call',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'hall', x: 450, y: 548, r: 70,
          flavor: 'SETUP stays true. Near finishes it — far only looks matching.'},
        {id: 'panel', kind: 'find', prop: 'panel', x: 590, y: 636, r: 42, find: 'moon-penny',
          flavor: 'A moon penny behind a sliding paper panel.'},
        {id: 'tassel', kind: 'flavor', prop: 'cushion', x: 310, y: 630, r: 36,
          flavor: 'A velvet tassel. Soft — not the punchline.'},
      ],
      faces: 1,
    },
    echo: {
      id: 'echo',
      kind: 'detour',
      title: 'Echo Alcove',
      joke: 'echo',
      caption: 'An echo bows from far away — then ushers you on.',
      revealNote: 'Echo gag. Last hall court is just ahead.',
      rejoin: 'last-court',
    },
    'last-court': {
      id: 'last-court',
      kind: 'main',
      title: 'Last Hall Court',
      shrink: true,
      last: true,
      setup: 'Knock knock. Who\'s there? Near.',
      setupProp: 'near',
      caption: 'Final depth once — SHUT the near laughing door.',
      revealNote: 'One more depth check — SHUT the NEAR last laugh.',
      inspectNote: 'If a keepsake is here, it sits in the open — tap it.',
      chooseNote: 'SHUT THE LAST LAUGH',
      doors: [
        door('left', 'exit', {
          correct: true,
          near: true,
          lastLaugh: true,
          punchline: 'Near who? — exit!',
          label: 'Near who? — exit',
        }),
        door('right', 'vanish', {
          correct: false,
          near: false,
          punchline: 'Stay tiny',
          label: 'Stay tiny',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'near', x: 450, y: 540, r: 70,
          flavor: 'Near who? The near laughing door finishes the gag — not the far decoy.'},
        {id: 'mouth', kind: 'flavor', prop: 'mouth', x: 268, y: 700, r: 40,
          flavor: 'A comedy mouth. It only laughs for the true punchline.'},
        {id: 'court-cushion', kind: 'flavor', prop: 'cushion', x: 600, y: 640, r: 38,
          flavor: 'A court cushion. Soft landing, no secret.'},
      ],
      treasure: {spawnId: 'last-laugh', x: 450, y: 470, r: 58},
      faces: 1,
    },
    vanish: {
      id: 'vanish',
      kind: 'detour',
      title: 'Vanish Joke',
      joke: 'vanish',
      caption: 'The far door vanishes into a soft gag, then clears the way back.',
      revealNote: 'Not the last laugh. Back to the court — finish the joke.',
      rejoin: 'last-court',
    },
  },
};


/**
 * Chapter 5 — Midway Echoes.
 * ONE new hazard taught alone on the first main room: distorted miniatures of
 * other Penny Fever rides as clues. Oval SETUP names/shows the true ride echo
 * (CAROUSEL / SWINGS / BALLOONS / WHEEL / CALLIOPE / SLIDE / BAY). Doors show
 * miniature ride glyphs — some warped/wrong. Correct = door whose ride miniature
 * matches the SETUP echo (not the warped decoy). Soft fails only — detour → rejoin.
 * No mirror, rotate, or shrink restack. NOT wink / look-direction Simon.
 */
export const CHAPTER5 = {
  id: 'midway-echoes',
  start: 'foyer',
  mainCount: 3,
  rooms: {
    foyer: {
      id: 'foyer',
      kind: 'main',
      title: 'Echo Foyer',
      teachEcho: true,
      echo: true,
      /* Long clear coaching window — teach ride-echo alone. */
      revealSec: 2.35,
      inspectSec: 2.15,
      setup: 'The midway whispers a ride — which echo is CAROUSEL?',
      setupProp: 'carousel',
      setupEcho: 'carousel',
      caption: 'HEAR THE ECHO → MATCH THE RIDE → SHUT THE PUNCHLINE.',
      revealNote: 'HEAR THE ECHO — MATCH THE RIDE',
      inspectNote: 'SETUP names the true ride. Doors show miniatures — some warped. Match, then SHUT.',
      chooseNote: 'MATCH THE RIDE — SHUT THE PUNCHLINE',
      doors: [
        door('left', 'gallery', {
          correct: true,
          echo: 'carousel',
          punchline: 'The waltz horse!',
          label: 'Waltz horse',
        }),
        door('right', 'warble', {
          correct: false,
          echo: 'swings',
          warp: true,
          punchline: 'A warped swing!',
          label: 'Warped swing',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'carousel', x: 450, y: 548, r: 70,
          flavor: 'SETUP names the true ride echo. Match that miniature on a door — not the warped decoy.'},
        {id: 'echo-find', kind: 'find', prop: 'cushion', x: 300, y: 630, r: 40, find: 'star-token',
          flavor: 'A star token under a paper cushion — not the punchline.'},
        {id: 'ribbon', kind: 'flavor', prop: 'panel', x: 600, y: 620, r: 34,
          flavor: 'Pretty paper. Hear the echo — which door matches the ride?'},
      ],
      faces: 1,
    },
    warble: {
      id: 'warble',
      kind: 'detour',
      title: 'Warble Joke',
      joke: 'warble',
      caption: 'A polite warble peeps off-key, then points you onward.',
      revealNote: 'Wrong echo — a warble gag. Midway gallery waits ahead.',
      rejoin: 'gallery',
    },
    gallery: {
      id: 'gallery',
      kind: 'main',
      title: 'Midway Gallery',
      echo: true,
      /* Same hazard, shorter — no new stack (no mirror/rotate/shrink). */
      revealSec: 1.05,
      inspectSec: 0.85,
      setup: 'Another whisper — which echo is SWINGS?',
      setupProp: 'swings',
      setupEcho: 'swings',
      caption: 'Same echo rule. MATCH the ride miniature, then SHUT.',
      revealNote: 'Hear the echo again — match SWINGS.',
      inspectNote: 'Warped decoys may look loud. Match the SETUP ride, then SHUT.',
      chooseNote: 'MATCH THE RIDE — SHUT THE PUNCHLINE',
      doors: [
        door('left', 'static', {
          correct: false,
          echo: 'balloons',
          warp: true,
          punchline: 'A sour balloon!',
          label: 'Sour balloon',
        }),
        door('right', 'last-court', {
          correct: true,
          echo: 'swings',
          punchline: 'The chain chair!',
          label: 'Chain chair',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'swings', x: 450, y: 548, r: 70,
          flavor: 'SETUP stays true. Match the SWINGS miniature — not a warped decoy.'},
        {id: 'panel', kind: 'find', prop: 'panel', x: 590, y: 636, r: 42, find: 'moon-penny',
          flavor: 'A moon penny behind a sliding paper panel.'},
        {id: 'tassel', kind: 'flavor', prop: 'cushion', x: 310, y: 630, r: 36,
          flavor: 'A velvet tassel. Soft — not the punchline.'},
      ],
      faces: 1,
    },
    static: {
      id: 'static',
      kind: 'detour',
      title: 'Static Alcove',
      joke: 'static',
      caption: 'Static crackles a soft gag — then ushers you on.',
      revealNote: 'Static gag. Last echo court is just ahead.',
      rejoin: 'last-court',
    },
    'last-court': {
      id: 'last-court',
      kind: 'main',
      title: 'Last Echo Court',
      echo: true,
      last: true,
      setup: 'Final whisper — which echo is WHEEL?',
      setupProp: 'wheel',
      setupEcho: 'wheel',
      caption: 'Final echo once — MATCH the wheel, SHUT the laughing door.',
      revealNote: 'One more echo — MATCH WHEEL, then SHUT the last laugh.',
      inspectNote: 'If a keepsake is here, it sits in the open — tap it.',
      chooseNote: 'SHUT THE LAST LAUGH',
      doors: [
        door('left', 'exit', {
          correct: true,
          echo: 'wheel',
          lastLaugh: true,
          punchline: 'Wheel who? — exit!',
          label: 'Wheel who? — exit',
        }),
        door('right', 'sour', {
          correct: false,
          echo: 'calliope',
          warp: true,
          punchline: 'Stay warped',
          label: 'Stay warped',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'wheel', x: 450, y: 540, r: 70,
          flavor: 'Wheel who? Match the WHEEL miniature on the laughing door — not the warped decoy.'},
        {id: 'mouth', kind: 'flavor', prop: 'mouth', x: 268, y: 700, r: 40,
          flavor: 'A comedy mouth. It only laughs for the true punchline.'},
        {id: 'court-cushion', kind: 'flavor', prop: 'cushion', x: 600, y: 640, r: 38,
          flavor: 'A court cushion. Soft landing, no secret.'},
      ],
      treasure: {spawnId: 'last-laugh', x: 450, y: 470, r: 58},
      faces: 1,
    },
    sour: {
      id: 'sour',
      kind: 'detour',
      title: 'Sour Echo',
      joke: 'sour',
      caption: 'A sour note bends the echo, then clears the way back.',
      revealNote: 'Not the last laugh. Back to the court — finish the joke.',
      rejoin: 'last-court',
    },
  },
};


/**
 * Chapter 6 — The Last Laugh.
 * Finale remix of known hazards — one clear teach on foyer, then deepen.
 * Do NOT stack every hazard in one room.
 *   Foyer (teachFinale): LAST LAUGH coach; mirror hazard alone first.
 *   Gallery: echo hazard alone (different prior rule).
 *   Last Laugh Court: mild near/far remix — SETUP truthful; correct punchline
 *     on the NEAR door. Soft fails only — detour → rejoin.
 * Primary verb remains SHUT THE PUNCHLINE. Treasure: ride-stamp-book.
 */
export const CHAPTER6 = {
  id: 'the-last-laugh',
  start: 'foyer',
  mainCount: 3,
  rooms: {
    foyer: {
      id: 'foyer',
      kind: 'main',
      title: 'Encore Foyer',
      teachFinale: true,
      mirror: true,
      /* Long clear coaching — LAST LAUGH + one familiar hazard alone (mirror). */
      revealSec: 2.35,
      inspectSec: 2.15,
      setup: 'Why did the funhouse save the last laugh?',
      setupProp: 'mirror',
      caption: 'LAST LAUGH — TRUST THE SETUP → SHUT THE PUNCHLINE.',
      revealNote: 'LAST LAUGH — TRUST THE SETUP. Mirror still lies once.',
      inspectNote: 'SETUP is true. Glass swaps punchlines — read real doors, then SHUT.',
      chooseNote: 'TRUST THE SETUP → SHUT THE PUNCHLINE',
      doors: [
        door('left', 'gallery', {
          correct: true,
          punchline: 'For the encore gag!',
          label: 'Encore gag',
        }),
        door('right', 'guffaw', {
          correct: false,
          punchline: 'Twice the bow!',
          label: 'Twice the bow',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'mirror', x: 450, y: 548, r: 70,
          flavor: 'SETUP on the oval is true. Mirror lies — shut the real punchline.'},
        {id: 'encore-find', kind: 'find', prop: 'cushion', x: 300, y: 630, r: 40, find: 'star-token',
          flavor: 'A star token under a paper cushion — not the punchline.'},
        {id: 'ribbon', kind: 'flavor', prop: 'panel', x: 600, y: 620, r: 34,
          flavor: 'Pretty paper. Trust the SETUP — not the glass.'},
      ],
      faces: 1,
    },
    guffaw: {
      id: 'guffaw',
      kind: 'detour',
      title: 'False Guffaw',
      joke: 'shard',
      caption: 'A polite false guffaw bows — then points you onward.',
      revealNote: 'Wrong punchline — a false guffaw. Encore gallery waits ahead.',
      rejoin: 'gallery',
    },
    gallery: {
      id: 'gallery',
      kind: 'main',
      title: 'Echo Encore Gallery',
      echo: true,
      /* Different prior hazard alone — ride echo match. No mirror restack. */
      revealSec: 1.05,
      inspectSec: 0.85,
      setup: 'The midway whispers once more — which echo is CAROUSEL?',
      setupProp: 'carousel',
      setupEcho: 'carousel',
      caption: 'MATCH THE RIDE — then SHUT THE PUNCHLINE.',
      revealNote: 'Hear the echo — MATCH CAROUSEL, then SHUT.',
      inspectNote: 'SETUP names the true ride. Match that miniature — not a warped decoy.',
      chooseNote: 'MATCH THE RIDE — SHUT THE PUNCHLINE',
      doors: [
        door('left', 'warble', {
          correct: false,
          echo: 'balloons',
          warp: true,
          punchline: 'A sour balloon!',
          label: 'Sour balloon',
        }),
        door('right', 'last-court', {
          correct: true,
          echo: 'carousel',
          punchline: 'The waltz horse!',
          label: 'Waltz horse',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'carousel', x: 450, y: 548, r: 70,
          flavor: 'SETUP stays true. Match the CAROUSEL miniature — not a warped decoy.'},
        {id: 'panel', kind: 'find', prop: 'panel', x: 590, y: 636, r: 42, find: 'moon-penny',
          flavor: 'A moon penny behind a sliding paper panel.'},
        {id: 'tassel', kind: 'flavor', prop: 'cushion', x: 310, y: 630, r: 36,
          flavor: 'A velvet tassel. Soft — not the punchline.'},
      ],
      faces: 1,
    },
    warble: {
      id: 'warble',
      kind: 'detour',
      title: 'Off-Key Alcove',
      joke: 'warble',
      caption: 'An off-key peep warbles, then ushers you on.',
      revealNote: 'Wrong echo — off-key gag. Last Laugh Court is just ahead.',
      rejoin: 'last-court',
    },
    'last-court': {
      id: 'last-court',
      kind: 'main',
      title: 'Last Laugh Court',
      shrink: true,
      last: true,
      /* Mild remix — near door + correct punchline; SETUP truthful. No mirror/echo stack. */
      setup: 'Knock knock. Who\'s there? Last laugh.',
      setupProp: 'near',
      caption: 'Final remix — SHUT the NEAR punchline that finishes the SETUP.',
      revealNote: 'Near vs far once — TRUST THE SETUP, SHUT the near last laugh.',
      inspectNote: 'If a keepsake is here, it sits in the open — tap it. Near finishes the gag.',
      chooseNote: 'SHUT THE LAST LAUGH',
      doors: [
        door('left', 'exit', {
          correct: true,
          near: true,
          lastLaugh: true,
          punchline: 'Last laugh who? — exit!',
          label: 'Last laugh who? — exit',
        }),
        door('right', 'curtain', {
          correct: false,
          near: false,
          punchline: 'Stay for one more',
          label: 'Stay for one more',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'near', x: 450, y: 540, r: 70,
          flavor: 'Last laugh who? The NEAR laughing door finishes the gag — not the tiny far decoy.'},
        {id: 'mouth', kind: 'flavor', prop: 'mouth', x: 268, y: 700, r: 40,
          flavor: 'A comedy mouth. It only laughs for the true punchline.'},
        {id: 'court-cushion', kind: 'flavor', prop: 'cushion', x: 600, y: 640, r: 38,
          flavor: 'A court cushion. Soft landing, no secret.'},
      ],
      treasure: {spawnId: 'last-laugh', x: 450, y: 470, r: 58},
      faces: 1,
    },
    curtain: {
      id: 'curtain',
      kind: 'detour',
      title: 'Curtain Call',
      joke: 'sour',
      caption: 'A curtain call bows too soon — then clears the way back.',
      revealNote: 'Not the last laugh. Back to the court — finish the joke.',
      rejoin: 'last-court',
    },
  },
};

export function chapterGraph(level) {
  // level 0 = Ch1 Laughing Maze; 1–5 = frozen CHAPTER2–6 (load-safe).
  if (level >= 5) return CHAPTER6;
  if (level >= 4) return CHAPTER5;
  if (level >= 3) return CHAPTER4;
  if (level >= 2) return CHAPTER3;
  if (level >= 1) return CHAPTER2;
  return CHAPTER1;
}

export function roomOf(graph, id) {
  return graph.rooms[id] || graph.rooms[graph.start];
}
