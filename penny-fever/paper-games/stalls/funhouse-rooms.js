/* Laughing Doorway — authored room graph.
 *
 * Chapter 1 Two Doors — SHUT THE PUNCHLINE (unchanged).
 * Chapter 2 Mirror Joke — implemented: one hazard taught alone (the mirror lies;
 *   reflection swaps/reverses door punchlines; truth is oval SETUP + real doors).
 * Chapter 3 Upside Down — implemented: one hazard taught alone (room rotates;
 *   mark door positions before the turn; punchlines travel with door objects as
 *   they swap places; memory solves which physical door still finishes the SETUP).
 * Chapter 4 Shrinking Hall — implemented: one hazard taught alone (perspective /
 *   near vs far); floor tiles prove depth; SHUT the NEAR punchline that finishes
 *   the SETUP (not the tiny far decoy). No mirror or rotate restack.
 *
 * Unfinished chapters (reuse Ch4 graph until authored):
 *   5 Midway Echoes   — distorted versions of the other five rides as clues
 *   6 The Last Laugh  — recombine mirrors, rotation, false treasures; ≤6 rooms
 *
 * Locked lane: Pac-Man chase × Door Door SHUT × Finish the Joke.
 * Primary verb SHUT — duck through / slam the punchline door that finishes
 * the joke so chasing laugh-faces vanish (power-pellet = correct punchline).
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
          punchline: 'Raise the roof!',
          label: 'Raise the roof',
        }),
        door('right', 'custard', {
          correct: false,
          punchline: 'More custard!',
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
          punchline: 'Soft landing',
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
          punchline: 'Don\'t cry — exit!',
          label: 'Don\'t cry — exit',
        }),
        door('right', 'false-giggle', {
          correct: false,
          punchline: 'Keep giggling',
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

/**
 * Chapter 2 — Mirror Joke.
 * ONE new hazard taught alone on the first main room: the mirror lies
 * (reflection swaps/reverses door punchlines). Truth = oval SETUP + real doors.
 * Soft fails only — wrong door → joke detour → rejoin. Never abort the paid ride.
 * NOT wink / look-direction Simon.
 */
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

export function chapterGraph(level) {
  // level 0 = Ch1; level 1 = Ch2; level 2 = Ch3; level ≥3 = Ch4 until Ch5+ are authored.
  if (level >= 3) return CHAPTER4;
  if (level >= 2) return CHAPTER3;
  if (level >= 1) return CHAPTER2;
  return CHAPTER1;
}

export function roomOf(graph, id) {
  return graph.rooms[id] || graph.rooms[graph.start];
}
