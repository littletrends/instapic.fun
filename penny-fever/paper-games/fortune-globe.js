/** Isolated Catch the Fortune: rings, symbols, fortunes, hidden 1–100. */

export const SYMBOLS = [
  { id: "key", name: "Key" },
  { id: "moon", name: "Moon" },
  { id: "eye", name: "Eye" },
  { id: "crown", name: "Crown" },
  { id: "moth", name: "Moth" },
  { id: "hand", name: "Hand" },
  { id: "star", name: "Star" },
  { id: "bottle", name: "Bottle" },
];

export const DECOYS = [
  { id: "crescent", name: "Crescent", decoyOf: "moon" },
  { id: "spark", name: "Spark", decoyOf: "star" },
  { id: "lid", name: "Lid", decoyOf: "eye" },
];

export const IRIS_CHAPTERS = [
  { id: "clear", title: "The Clear Sign", rings: 1, flash: 2.2, hide: false, opposite: false, decoys: false, prize: "fortune-slip" },
  { id: "paired", title: "The Paired Sign", rings: 2, flash: 2.0, hide: false, opposite: false, decoys: false, prize: "moon-lantern" },
  { id: "crossing", title: "The Crossing Sign", rings: 2, flash: 1.8, hide: false, opposite: true, decoys: false, prize: "moon-brooch" },
  { id: "fading", title: "The Fading Sign", rings: 2, flash: 0.9, hide: true, opposite: false, decoys: false, prize: "fortune-journal" },
  { id: "false", title: "The False Sign", rings: 2, flash: 1.6, hide: true, opposite: true, decoys: true, prize: "moon-festival-fan" },
  { id: "mystery", title: "The Mystery Sign", rings: 3, flash: 2.4, hide: true, opposite: true, decoys: true, prize: "looking-glass-locket" },
];

export const PRIZE_NAMES = {
  "fortune-slip": "Fortune slip",
  "moon-lantern": "Moon lantern",
  "moon-brooch": "Moon brooch",
  "fortune-journal": "Fortune journal",
  "moon-festival-fan": "Moon festival fan",
  "looking-glass-locket": "Looking-glass locket",
};

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** How many of the 100 seconds pay the unique, if the catch is clean. */
export const WIN_COUNTS = [50, 40, 30, 25, 20, 15];

export function isIrisWin(level, n) {
  return (IRIS_WINS[level] || IRIS_WINS[0]).includes(n);
}

/** Number the background counter is sitting on after `elapsed` seconds. */
export function clockNumber(elapsed) {
  const t = Math.max(0, Number(elapsed) || 0);
  if (t <= 0) return 1;
  return Math.min(100, Math.max(1, Math.ceil(t)));
}

export function resultNumber(elapsed) {
  return clockNumber(elapsed);
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return "moon-penny";
  if (n % 2 === 0) return "star-token";
  return "everyday-penny";
}

export function symbolName(id) {
  const hit = SYMBOLS.find(s => s.id === id) || DECOYS.find(s => s.id === id);
  return hit ? hit.name : id;
}

/** One reading per sealed 1–100. Never shown as a number. */
export const FORTUNES = [
  "A lock somewhere is waiting for you.",
  "Tonight keeps a secret, not a threat.",
  "You are being seen, kindly.",
  "A small honour, not a burden.",
  "Something tender is changing shape.",
  "Offer help; it will be taken well.",
  "A small light after the noise. Follow it.",
  "A wish is corked and safe.",
  "Something hidden will open after dark.",
  "An old feeling is changing shape.",
  "Someone important has noticed you.",
  "A small wish has been safely kept.",
  "A door you forgot still has a key in it.",
  "Look twice at what the night is showing you.",
  "A title sits lightly. Do not crush it.",
  "Hold the small thing. It is already a gift.",
  "Reach up; the light is closer than it looks.",
  "What you notice next is meant to be opened.",
  "A quiet change, the colour of dust on glass.",
  "A little ceremony, and then the work.",
  "Keep the wish corked until morning.",
  "Offer the night your open palm.",
  "Authority is only a well-cut tooth.",
  "A bright noticing. Write it down.",
  "Follow the small wing, not the lantern.",
  "You already hold the way through.",
  "A toast to a name you have not spoken.",
  "Do not flinch from the soft thing in the glass.",
  "A small unlocking, and then a change of shape.",
  "Someone important will take the hand you offer.",
  "What you keep seeing wants a quiet cork.",
  "A gentle catching. Do not squeeze.",
  "The wish and the door are the same errand.",
  "Walk slower past the next tent. It is trying to speak.",
  "A kindness you gave last week is still travelling.",
  "The moon is not late. You are early.",
  "Put the letter where you will find it at breakfast.",
  "A lost button is a small map. Follow it.",
  "Someone will remember your laugh before your name.",
  "The next yes can be quiet.",
  "Leave one pocket empty. Luck likes room.",
  "A warm window is waiting on a cold street.",
  "Do not argue with the first good idea.",
  "The alley already knows which way you turn.",
  "A secret is safer when it has a friend.",
  "Wear the colour you nearly chose.",
  "The brass remembers who was gentle.",
  "Ask the older question. The new one can wait.",
  "A stray cat is carrying your luck for an hour.",
  "The next song is for you, whether it knows or not.",
  "Fold the worry. It will still be there, smaller.",
  "A light in another window is answering yours.",
  "You will be invited twice. Go the second time.",
  "The glass is theatrical. Believe the kind part.",
  "A penny you spend tonight buys a story, not a thing.",
  "Stand where the lantern can see your face.",
  "The thing you almost said is still useful.",
  "A ribbon will come back to you.",
  "Night is a good clerk. Leave it the list.",
  "The next stranger is not a stranger for long.",
  "Keep the smaller promise. The large one will follow.",
  "A door held open is a fortune of its own.",
  "You are allowed to change your mind at the gate.",
  "The moth chose you, not the lamp.",
  "A quiet table has your place set.",
  "Tomorrow morning will explain tonight.",
  "The crown is paper. The courage is not.",
  "Take the long way home. Something wants to be found.",
  "A name you like is practising how to find you.",
  "The bottle is full enough. Stop adding wishes.",
  "Someone is saving a seat without telling you.",
  "The key was never missing. It was waiting to be used.",
  "A soft landing is being arranged.",
  "Look up when the music changes.",
  "The next apology can be short and real.",
  "A star you cannot name is still working.",
  "Put your hand on the warm wood. Stay a moment.",
  "The alley keeps a kind rumour about you.",
  "You will recognise the right stall by the smell of rain.",
  "A small delay is protecting something.",
  "The fortune you wanted is less interesting than this one.",
  "Let the night finish its sentence.",
  "A borrowed coat will fit better than you think.",
  "The next laugh will arrive from behind you.",
  "Keep the ticket. The date is not the point.",
  "A window unlatches if you stop rattling it.",
  "The globe has chosen a gentle weather.",
  "Someone is proud of you and has not said so.",
  "The path that looks dull is the one with the lanterns.",
  "A wish spent slowly lasts the week.",
  "You are not late for your own life.",
  "The next hush in the crowd is for you to hear.",
  "Carry water, not the whole well.",
  "A gold thread is already in the hem.",
  "The last light on the street is still a light.",
  "Say the true thing softly. It will travel.",
  "The glass returns what you give it: patience.",
  "A new map is being drawn with your footsteps.",
  "Tomorrow will knock. You may let it in slowly.",
  "The fortune is finished. Walk on, lucky.",
];

export function fortuneFor(n) {
  const i = Math.max(1, Math.min(100, n | 0)) - 1;
  return FORTUNES[i] || FORTUNES[0];
}

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function shuffle(roll, list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Allocated once per chapter: a random subset of the 100 seconds. Not rerolled per gaze. */
export const IRIS_WINS = WIN_COUNTS.map((count, level) => {
  const roll = rng(4109 + level * 7919);
  return shuffle(roll, span(1, 100)).slice(0, count).sort((a, b) => a - b);
});

const TAU = Math.PI * 2;

export function slotAt(angle, n) {
  const turns = ((angle / TAU) % 1 + 1) % 1;
  return Math.round(turns * n) % n;
}

export function snapAngle(angle, n) {
  const slot = slotAt(angle, n);
  return (slot / n) * TAU;
}

export function makeGlobe(level, seed) {
  const ch = IRIS_CHAPTERS[level] || IRIS_CHAPTERS[0];
  // Mix adjacent gaze seeds so the first remembered sign does not repeat for hundreds of turns.
  let mixed = (Number(seed) || 1) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x21f0aaad);
  mixed = Math.imul(mixed ^ (mixed >>> 15), 0x735a2d97);
  const roll = rng((mixed ^ (mixed >>> 15)) >>> 0);
  const chapterSymbols = [
    ['moon','star','key','eye'],
    ['moon','bottle','moth','star','hand'],
    ['key','crown','eye','hand','star','bottle'],
    ['moon','moth','eye','bottle','crown','hand'],
    ['moon','star','eye','key','moth','crown','bottle'],
    SYMBOLS.map(s => s.id),
  ];
  const pool = [...new Set([...(chapterSymbols[level] || chapterSymbols[0]), ...SYMBOLS.map(s => s.id)])];
  const flash = [];
  for (let i = 0; i < ch.rings; i++) {
    let pick = pool[Math.floor(roll() * pool.length)];
    while (flash.includes(pick)) pick = pool[Math.floor(roll() * pool.length)];
    flash.push(pick);
  }
  const rings = [];
  for (let r = 0; r < ch.rings; r++) {
    let glyphs = shuffle(roll, pool);
    if (ch.decoys) {
      const decoy = DECOYS.find(d => d.decoyOf === flash[r]) || DECOYS[r % DECOYS.length];
      glyphs = glyphs.filter(id => id !== decoy.id);
      const insert = Math.max(1, Math.floor(roll() * (glyphs.length - 1)));
      glyphs[insert] = decoy.id;
    }
    if (!glyphs.includes(flash[r])) glyphs[0] = flash[r];
    const n = glyphs.length;
    const targetSlot = glyphs.indexOf(flash[r]);
    const dir = ch.opposite && r % 2 === 1 ? -1 : 1;
    const speed = (0.55 + level * 0.12 + r * 0.08) * dir;
    rings.push({
      glyphs, n, target: flash[r], targetSlot,
      angle: roll() * TAU, speed, stopped: false, slipped: false,
    });
  }
  return { level, seed, flash, rings, flashSecs: ch.flash, hide: ch.hide, opposite: ch.opposite };
}

export function caughtOf(globe) {
  return (globe.rings || []).map(ring => ring.glyphs[slotAt(ring.angle, ring.n)]);
}

export function allMatch(globe) {
  const got = caughtOf(globe);
  return globe.flash.every((id, i) => got[i] === id);
}

export function allStopped(globe) {
  return (globe.rings || []).every(r => r.stopped);
}

export function brakeRing(globe, index) {
  const ring = globe.rings[index];
  if (!ring || ring.stopped) return false;
  ring.angle = snapAngle(ring.angle, ring.n);
  ring.stopped = true;
  ring.speed = 0;
  ring.slipped = ring.glyphs[slotAt(ring.angle, ring.n)] !== ring.target;
  return true;
}

export function nextLiveRing(globe) {
  return (globe.rings || []).findIndex(r => !r.stopped);
}

export function stepGlobe(globe, dt, reduced) {
  const slow = reduced ? 0.35 : 1;
  for (const ring of globe.rings) {
    if (ring.stopped) continue;
    ring.angle += ring.speed * dt * slow;
  }
}
