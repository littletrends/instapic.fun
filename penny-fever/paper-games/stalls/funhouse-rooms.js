/* Laughing Doorway — authored room graph (Chapter 1: Two Doors).
 *
 * Locked lane: Pac-Man chase × Door Door SHUT × Finish the Joke.
 * Primary verb SHUT — duck through / slam the punchline door that finishes
 * the joke so chasing laugh-faces vanish (power-pellet = correct punchline).
 *
 * Unfinished chapters (funhouse.js reuses Ch1 so later levels still boot):
 *   2 Mirror Joke     — one reflection tells truth; another reverses the clue
 *   3 Upside Down     — doors move when the room rotates; remember positions
 *   4 Shrinking Hall  — perspective: floor tiles / shadows prove near vs far
 *   5 Midway Echoes   — distorted versions of the other five rides as clues
 *   6 The Last Laugh  — recombine mirrors, rotation, false treasures; ≤6 rooms
 */

export const RIDE = 'funhouse';
/* Treasure ids provisional per Lorie brief — keep in sync with prizes.js until renamed. */
export const TREASURES = [
  'laughing-doorway',
  'balloon-bouquet',
  'music-carousel',
  'pocket-wheel',
  'organ-music-box',
  'ride-stamp-book',
];
export const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
export const LEVEL_NAMES = [
  'Two Doors',
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
};

export const SPAWN_IDS = ['last-laugh'];

/** Oval stage clamp for chase faces / player paper sprite. */
export const STAGE = {xMin: 200, xMax: 700, yMin: 450, yMax: 900};

const LDOOR = {x: 268, y: 820, w: 168, h: 268};
const RDOOR = {x: 632, y: 820, w: 168, h: 268};

function door(id, to, extra = {}) {
  const box = id === 'left' ? LDOOR : RDOOR;
  return {id, to, x: box.x, y: box.y, w: box.w, h: box.h, ...extra};
}

/**
 * Chapter 1 — Two Doors.
 * Clue = which door finishes the joke (punchline label on the door).
 * NOT wink / look-direction Simon.
 */
export const CHAPTER1 = {
  id: 'two-doors',
  start: 'foyer',
  mainCount: 3,
  rooms: {
    foyer: {
      id: 'foyer',
      kind: 'main',
      title: 'Velvet Foyer',
      setup: 'Why did the clown bring a ladder?',
      setupProp: 'ladder',
      caption: 'Finish the joke — SHUT the punchline door.',
      revealNote: 'SHUT THE PUNCHLINE',
      inspectNote: 'Read the punchlines on the doors. Faces only giggle.',
      chooseNote: 'SHUT THE PUNCHLINE',
      doors: [
        door('left', 'gallery', {
          correct: true,
          punchline: 'To raise the roof!',
          label: 'Raise the roof',
        }),
        door('right', 'custard', {
          correct: false,
          punchline: 'To fetch more custard',
          label: 'More custard',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'ladder', x: 450, y: 560, r: 70,
          flavor: 'The setup is the ladder. The punchline is on a door.'},
        {id: 'cushion', kind: 'find', prop: 'cushion', x: 318, y: 640, r: 42, find: 'star-token',
          flavor: 'A star token tucked under a paper cushion.'},
        {id: 'ribbon', kind: 'flavor', prop: 'panel', x: 560, y: 620, r: 36,
          flavor: 'A paper ribbon. Pretty — the punchline is still on a door.'},
      ],
      faces: 1,
    },
    custard: {
      id: 'custard',
      kind: 'detour',
      title: 'Custard Joke',
      joke: 'pie',
      caption: 'A cream pie makes its introductions.',
      revealNote: 'Wrong punchline — a polite pie. The gallery waits ahead.',
      rejoin: 'gallery',
    },
    gallery: {
      id: 'gallery',
      kind: 'main',
      title: 'Diamond Gallery',
      setup: 'What do you call a joke that falls flat?',
      setupProp: 'flat',
      caption: 'New setup. SHUT the door that finishes it.',
      revealNote: 'SHUT THE PUNCHLINE',
      inspectNote: 'A panel might hide a penny. The punchline is still on a door.',
      chooseNote: 'SHUT THE PUNCHLINE',
      doors: [
        door('left', 'whoopee', {
          correct: false,
          punchline: 'A soft landing',
          label: 'Soft landing',
        }),
        door('right', 'last-court', {
          correct: true,
          punchline: 'A floor gag!',
          label: 'Floor gag',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'flat', x: 450, y: 560, r: 70,
          flavor: 'Flat setup on the oval. One door finishes it.'},
        {id: 'panel', kind: 'find', prop: 'panel', x: 590, y: 636, r: 42, find: 'moon-penny',
          flavor: 'A moon penny behind a sliding paper panel.'},
        {id: 'tassel', kind: 'flavor', prop: 'cushion', x: 310, y: 630, r: 36,
          flavor: 'A velvet tassel. Soft, silent — not the punchline.'},
      ],
      faces: 1,
    },
    whoopee: {
      id: 'whoopee',
      kind: 'detour',
      title: 'Whoopee Hall',
      joke: 'whoopee',
      caption: 'The floor has opinions.',
      revealNote: 'A whoopee cushion bows. The last court is just ahead.',
      rejoin: 'last-court',
    },
    'last-court': {
      id: 'last-court',
      kind: 'main',
      title: 'Last Court',
      setup: 'Knock knock. Who\'s there? Boo.',
      setupProp: 'boo',
      last: true,
      caption: 'The last laughing door keeps the way out.',
      revealNote: 'SHUT THE PUNCHLINE',
      inspectNote: 'If a keepsake is here, it sits in the open — tap it.',
      chooseNote: 'SHUT THE LAST LAUGH',
      doors: [
        door('left', 'exit', {
          correct: true,
          lastLaugh: true,
          punchline: 'Boo-who? Don\'t cry — exit!',
          label: 'Don\'t cry — exit',
        }),
        door('right', 'false-giggle', {
          correct: false,
          punchline: 'Boo-who? Keep giggling',
          label: 'Keep giggling',
        }),
      ],
      inspect: [
        {id: 'setup-prop', kind: 'clue', prop: 'boo', x: 450, y: 540, r: 70,
          flavor: 'Boo who? The laughing door finishes the gag.'},
        {id: 'mouth', kind: 'flavor', prop: 'mouth', x: 268, y: 700, r: 40,
          flavor: 'A comedy mouth. It only laughs for the true punchline.'},
        {id: 'court-cushion', kind: 'flavor', prop: 'cushion', x: 600, y: 640, r: 38,
          flavor: 'A court cushion. Soft landing, no secret.'},
      ],
      treasure: {spawnId: 'last-laugh', x: 450, y: 470, r: 58},
      faces: 1,
    },
    'false-giggle': {
      id: 'false-giggle',
      kind: 'detour',
      title: 'False Giggle',
      joke: 'honk',
      caption: 'A tiny door honks, then admits the gag.',
      revealNote: 'Not the last laugh. Back to the court — finish the joke.',
      rejoin: 'last-court',
    },
  },
};

export function chapterGraph(level) {
  // Ch2–6 still reuse Ch1 graph until authored (see file-top unfinished list).
  return CHAPTER1;
}

export function roomOf(graph, id) {
  return graph.rooms[id] || graph.rooms[graph.start];
}
