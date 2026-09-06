# Batch04 mount configs — drop-in for Desktop Grok (align to runKit)
# Fairy Floss · Popcorn Kettle · Duck Pond · Skee-Ball · Penny Pitch · Dunk Barker
# Full coding contracts from GOBLIN_BATCH04_BUILD_SHEETS.md — not shells.
# engine declarations match GOBLIN_RUNKIT_API.md
# Style twin of GOBLIN_BATCH03_MOUNT_CONFIGS.md / GOBLIN_P0_MOUNT_CONFIGS.md

---

## fairyfloss — HoldBand (tension) · Fairy Floss Wheel

```js
PF.runKit.declare("fairyfloss", {
  engine: "HoldBand", // tension band skin — wind cone, not Love heat
  displayName: "Fairy Floss Wheel",
  depthUnit: "Stage",
  sheet: "GOBLIN_BATCH04_BUILD_SHEETS.md",
});

/**
 * HoldBand.mount(root, spec, runCtx) — tension / wind rate variant
 * Verb: hold-drag winds floss; keep pull rate inside sweet band
 * too slow = sag (no metre gain); too fast = SNAP → strike
 * Clear: metresWound >= metresNeeded without death → depth++
 * Death: snaps >= snapLimit
 */
function fairyflossStageParams(n) {
  const t = n - 1;
  if (n === 1) {
    return {
      id: 1,
      title: "Soft Cloud",
      metresNeeded: 3,
      bandWidth: "wide",
      bandH: 22,
      tubRpm: 0.4,
      snapLimit: 3,
      metrePerSecInBand: 0.35,
      sagNoGain: true,
    };
  }
  if (n === 2) {
    return {
      id: 2,
      title: "Taller Spin",
      metresNeeded: 4,
      bandWidth: "wide",
      bandH: 20,
      tubRpm: 0.55,
      snapLimit: 2,
      metrePerSecInBand: 0.38,
      sagNoGain: true,
    };
  }
  if (n === 3) {
    return {
      id: 3,
      title: "Mid Band",
      metresNeeded: 5,
      bandWidth: "mid",
      bandH: 16,
      tubRpm: 0.7,
      snapLimit: 2,
      metrePerSecInBand: 0.4,
      sagNoGain: true,
    };
  }
  if (n === 4) {
    return {
      id: 4,
      title: "Fast Tub",
      metresNeeded: 6,
      bandWidth: "mid",
      bandH: 14,
      tubRpm: 0.9,
      snapLimit: 2,
      metrePerSecInBand: 0.42,
      sagNoGain: true,
    };
  }
  if (n === 5) {
    return {
      id: 5,
      title: "Thin Cloud",
      metresNeeded: 7,
      bandWidth: "thin",
      bandH: 11,
      tubRpm: 1.1,
      snapLimit: 2,
      metrePerSecInBand: 0.45,
      sagNoGain: true,
    };
  }
  // 6+
  return {
    id: n,
    title: "Sugar Edge",
    metresNeeded: 7 + t,
    bandWidth: "thinner",
    bandH: Math.max(6, 11 - 0.5 * t),
    tubRpm: Math.min(2.2, 1.1 + 0.12 * t),
    snapLimit: 2,
    metrePerSecInBand: Math.min(0.6, 0.45 + 0.02 * t),
    sagNoGain: true,
  };
}

/**
 * Scoring: +20 per 0.1m wound in band · +250 stage clear · depth = stages
 * Death: snapLimit · finishRun({ gameId:"fairyfloss", depth, score, deathReason:"snap" })
 * bestDepth.fairyfloss = Stage
 * Vestibule: “WIND IT TALL — DON’T SNAP THE CLOUD” · Best: Metres {n} / Stage
 * Don’t: instant full cone button
 */
```

---

## popcorn — TimingTap · Popcorn Kettle

```js
PF.runKit.declare("popcorn", {
  engine: "TimingTap",
  displayName: "Popcorn Kettle",
  depthUnit: "Stage",
  sheet: "GOBLIN_BATCH04_BUILD_SHEETS.md",
});

/**
 * TimingTap.mount(root, spec, runCtx) — pop-event schedule
 * Tap within ±hitMs of true pop = catch; miss/early/late = burn strike
 * Fake steam (stage 3+): no score; tap fake = strike
 * Clear: catches >= need → depth++; 3 burns = DEATH
 */
function popcornStageParams(n) {
  const t = n - 1;
  if (n === 1) {
    return {
      id: 1,
      title: "First Pops",
      need: 8,
      hitMs: 140,
      popGapMs: 700,
      fakeChance: 0,
      burnsToDeath: 3,
    };
  }
  if (n === 2) {
    return {
      id: 2,
      title: "Hotter Gap",
      need: 10,
      hitMs: 120,
      popGapMs: 620,
      fakeChance: 0,
      burnsToDeath: 3,
    };
  }
  if (n === 3) {
    return {
      id: 3,
      title: "Steam Lies",
      need: 12,
      hitMs: 110,
      popGapMs: 560,
      fakeChance: 0.15,
      burnsToDeath: 3,
    };
  }
  if (n === 4) {
    return {
      id: 4,
      title: "False Puff",
      need: 14,
      hitMs: 100,
      popGapMs: 500,
      fakeChance: 0.22,
      burnsToDeath: 3,
    };
  }
  if (n === 5) {
    return {
      id: 5,
      title: "Kettle Rush",
      need: 16,
      hitMs: 90,
      popGapMs: 450,
      fakeChance: 0.28,
      burnsToDeath: 3,
    };
  }
  // 6+
  return {
    id: n,
    title: "Burn Batch",
    need: 16 + 2 * t,
    hitMs: Math.max(55, 90 - 4 * t),
    popGapMs: Math.max(300, 450 - 20 * t),
    fakeChance: Math.min(0.45, 0.28 + 0.03 * t),
    burnsToDeath: 3,
  };
}

/**
 * Scoring: +15 per catch · +300 stage clear · depth = stages
 * Death: 3 burns · finishRun({ gameId:"popcorn", depth, score, deathReason:"burn"|"fake_tap" })
 * bestDepth.popcorn = Stage
 * Vestibule: “TAP THE POP — IGNORE THE STEAM”
 * Don’t: hold-to-auto-catch
 */
```

---

## duckpond — Custom · Duck Pond Hook

```js
PF.runKit.declare("duckpond", {
  engine: "Custom",
  displayName: "Duck Pond Hook",
  depthUnit: "Stage",
  sheet: "GOBLIN_BATCH04_BUILD_SHEETS.md",
});

/**
 * Custom path float + tap-drag hook.
 * Target colour(s) posted; wrong colour catch = strike (or soft miss release)
 * Clear: correct catches >= need → depth++; wrongLimit wrong = DEATH
 */
function duckpondStageParams(n) {
  const t = n - 1;
  if (n === 1) {
    return {
      id: 1,
      title: "Yellow Call",
      colours: ["yellow"],
      need: 5,
      speed: "slow",
      speedMul: 0.5,
      hookR: "big",
      hookPx: 48,
      wrongLimit: 3,
      rotatingCall: false,
    };
  }
  if (n === 2) {
    return {
      id: 2,
      title: "Yellow Plus",
      colours: ["yellow"],
      need: 6,
      speed: "+",
      speedMul: 0.65,
      hookR: "big",
      hookPx: 44,
      wrongLimit: 3,
      rotatingCall: false,
    };
  }
  if (n === 3) {
    return {
      id: 3,
      title: "Two-Tone",
      colours: ["yellow", "blue"],
      need: 7,
      speed: "+",
      speedMul: 0.8,
      hookR: "mid",
      hookPx: 36,
      wrongLimit: 3,
      rotatingCall: false,
    };
  }
  if (n === 4) {
    return {
      id: 4,
      title: "Blue Only",
      colours: ["blue"],
      need: 8,
      speed: "++",
      speedMul: 1.0,
      hookR: "mid",
      hookPx: 32,
      wrongLimit: 2,
      rotatingCall: false,
    };
  }
  if (n === 5) {
    return {
      id: 5,
      title: "Red Only",
      colours: ["red"],
      need: 8,
      speed: "++",
      speedMul: 1.15,
      hookR: "small",
      hookPx: 26,
      wrongLimit: 2,
      rotatingCall: false,
    };
  }
  // 6+
  return {
    id: n,
    title: "Rotating Call",
    colours: ["yellow", "blue", "red"], // call rotates every 2 correct catches
    need: 10,
    speed: "+++",
    speedMul: Math.min(1.8, 1.15 + 0.08 * t),
    hookR: "small",
    hookPx: Math.max(18, 26 - t),
    wrongLimit: 2,
    rotatingCall: true,
    rotateEveryCorrect: 2,
  };
}

/**
 * Scoring: +40 correct · +280 stage clear · depth = stages
 * Death: wrong >= wrongLimit · finishRun({ gameId:"duckpond", depth, score, deathReason:"wrong_duck" })
 * bestDepth.duckpond = Stage
 * Vestibule: “HOOK THE CALL — NOT EVERY DUCK IS LUCKY”
 * Don’t: all ducks equal forever
 */
```

---

## skee — SlingAim · Skee-Ball Alley

```js
PF.runKit.declare("skee", {
  engine: "SlingAim",
  displayName: "Skee-Ball Alley",
  depthUnit: "Stage",
  sheet: "GOBLIN_BATCH04_BUILD_SHEETS.md",
});

/**
 * SlingAim.mount — timing power bar lob (Ball Toss cousin) up lane into rings
 * Rings: 10 / 20 / 30 / 50 (center). 9 balls/stage. Clear if stageScore >= target.
 * Fail under target after 9 → DEATH. Wax sheen mid-stage from stage 3 (readable friction lie).
 */
function skeeStageParams(n) {
  const t = n - 1;
  if (n === 1) {
    return {
      id: 1,
      title: "Teach Roll",
      target: 100,
      ringScale: 1.0,
      waxLies: false,
      balls: 9,
      rings: [10, 20, 30, 50],
    };
  }
  if (n === 2) {
    return {
      id: 2,
      title: "Board Climb",
      target: 140,
      ringScale: 0.95,
      waxLies: false,
      balls: 9,
      rings: [10, 20, 30, 50],
    };
  }
  if (n === 3) {
    return {
      id: 3,
      title: "Wax Sheen",
      target: 180,
      ringScale: 0.9,
      waxLies: true,
      balls: 9,
      rings: [10, 20, 30, 50],
    };
  }
  if (n === 4) {
    return {
      id: 4,
      title: "Tight Rings",
      target: 220,
      ringScale: 0.85,
      waxLies: true,
      balls: 9,
      rings: [10, 20, 30, 50],
    };
  }
  if (n === 5) {
    return {
      id: 5,
      title: "Mean Lane",
      target: 260,
      ringScale: 0.8,
      waxLies: true,
      balls: 9,
      rings: [10, 20, 30, 50],
    };
  }
  // 6+
  return {
    id: n,
    title: "Endless Board",
    target: 260 + 40 * t,
    ringScale: Math.max(0.55, 0.8 - 0.03 * t),
    waxLies: true,
    balls: 9,
    rings: [10, 20, 30, 50],
  };
}

/**
 * Scoring: face ring values sum · +250 clear optional bonus · depth = stages cleared
 * Also track best single-stage points for vestibule
 * Death: under target after 9 · finishRun({ gameId:"skee", depth, score, deathReason:"under_target" })
 * bestDepth.skee = Stage
 * Vestibule: “ROLL UP — BEAT THE BOARD”
 * Don’t: unlimited balls
 */
```

---

## pennypitch — SlingAim · Penny Pitch Cloth

```js
PF.runKit.declare("pennypitch", {
  engine: "SlingAim",
  displayName: "Penny Pitch Cloth",
  depthUnit: "Stage",
  sheet: "GOBLIN_BATCH04_BUILD_SHEETS.md",
});

/**
 * SlingAim / aim+drop — top-down cloth squares; tap drop after aim
 * After release, cloth may jerk (stage 2+) shifting targets mid-flight
 * Clear: points earned >= needPts in 5 pennies. Fail → DEATH
 */
function pennypitchStageParams(n) {
  const t = n - 1;
  if (n === 1) {
    return {
      id: 1,
      title: "Soft Cloth",
      needPts: 30,
      jerk: "none",
      jerkChance: 0,
      jerkPx: 0,
      squareSize: "big",
      squareScale: 1.0,
      pennies: 5,
    };
  }
  if (n === 2) {
    return {
      id: 2,
      title: "Rare Jerk",
      needPts: 40,
      jerk: "rare",
      jerkChance: 0.2,
      jerkPx: 12,
      squareSize: "big",
      squareScale: 0.95,
      pennies: 5,
    };
  }
  if (n === 3) {
    return {
      id: 3,
      title: "Mid Opinions",
      needPts: 50,
      jerk: "mid",
      jerkChance: 0.4,
      jerkPx: 18,
      squareSize: "mid",
      squareScale: 0.85,
      pennies: 5,
    };
  }
  if (n === 4) {
    return {
      id: 4,
      title: "Cloth Mood",
      needPts: 60,
      jerk: "mid",
      jerkChance: 0.5,
      jerkPx: 22,
      squareSize: "mid",
      squareScale: 0.8,
      pennies: 5,
    };
  }
  if (n === 5) {
    return {
      id: 5,
      title: "Often Jerk",
      needPts: 70,
      jerk: "often",
      jerkChance: 0.7,
      jerkPx: 28,
      squareSize: "small",
      squareScale: 0.7,
      pennies: 5,
    };
  }
  // 6+
  return {
    id: n,
    title: "Mean Cloth",
    needPts: 70 + 10 * t,
    jerk: "often",
    jerkChance: Math.min(0.9, 0.7 + 0.03 * t),
    jerkPx: Math.min(40, 28 + 2 * t),
    squareSize: "smaller",
    squareScale: Math.max(0.5, 0.7 - 0.03 * t),
    pennies: 5,
  };
}

/**
 * Scoring: face value of landed squares · +250 clear · depth = stages
 * Death: points < needPts after 5 pennies
 * finishRun({ gameId:"pennypitch", depth, score, deathReason:"short_points" })
 * bestDepth.pennypitch = Stage
 * Vestibule: “LAND A COLOUR — CLOTH HAS OPINIONS”
 * Don’t: hide jerk (must be tent-visible)
 */
```

---

## dunk — SlingAim · Dunk the Barker

```js
PF.runKit.declare("dunk", {
  engine: "SlingAim",
  displayName: "Dunk the Barker",
  depthUnit: "Dunks",
  sheet: "GOBLIN_BATCH04_BUILD_SHEETS.md",
});

/**
 * SlingAim aim+power throw at swinging plate.
 * 3 balls per “seat”. Hit plate = dunk cinematic · depth++ · next seat harder.
 * Miss all 3 = DEATH. Dunk is checkpoint emotion; run continues.
 * Keep playful — never mean-spirited humiliation copy.
 */
function dunkStageParams(n) {
  // n = seat number (depth+1 before dunk)
  const t = Math.max(0, n - 5);
  if (n === 1) {
    return {
      id: 1,
      title: "Seat One",
      plateScale: 1.0,
      swing: "slow",
      swingSpeed: 0.4,
      hitRadius: "big",
      hitR: 42,
      ballsPerSeat: 3,
    };
  }
  if (n === 2) {
    return {
      id: 2,
      title: "Seat Two",
      plateScale: 0.9,
      swing: "+",
      swingSpeed: 0.55,
      hitRadius: "mid",
      hitR: 34,
      ballsPerSeat: 3,
    };
  }
  if (n === 3) {
    return {
      id: 3,
      title: "Seat Three",
      plateScale: 0.8,
      swing: "++",
      swingSpeed: 0.75,
      hitRadius: "mid",
      hitR: 30,
      ballsPerSeat: 3,
    };
  }
  if (n === 4) {
    return {
      id: 4,
      title: "Seat Four",
      plateScale: 0.7,
      swing: "++",
      swingSpeed: 0.9,
      hitRadius: "small",
      hitR: 24,
      ballsPerSeat: 3,
    };
  }
  // 5+
  return {
    id: n,
    title: `Seat ${n}`,
    plateScale: Math.max(0.45, 0.7 - 0.04 * t),
    swing: "+++",
    swingSpeed: Math.min(1.8, 0.9 + 0.1 * t),
    hitRadius: "small",
    hitR: Math.max(14, 24 - t),
    ballsPerSeat: 3,
  };
}

/**
 * Scoring: +400 dunk · depth = dunks (seats soaked)
 * Death: miss all 3 balls this seat
 * finishRun({ gameId:"dunk", depth, score, deathReason:"miss_seat" })
 * bestDepth.dunk = Dunks
 * Vestibule: “SOAK THE CROWN — HOW MANY SEATS?” · Aura dunk VO cute, not cruel
 * Don’t: mean-spirited humiliation
 */
```

---

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: fairyfloss, popcorn, duckpond, skee, pennypitch, dunk.
Door tag: `Depth run` only if engine mounted.

## finishRun quick hints
| gameId | depthUnit | typical deathReason |
|--------|-----------|---------------------|
| fairyfloss | Stage | snap |
| popcorn | Stage | burn, fake_tap |
| duckpond | Stage | wrong_duck |
| skee | Stage | under_target |
| pennypitch | Stage | short_points |
| dunk | Dunks | miss_seat |

## Wire checklist (Batch04)
- [ ] fairyfloss HoldBand tension; snapLimit 3→2; metresNeeded climb
- [ ] popcorn TimingTap; fakeChance from stage 3; burnsToDeath 3
- [ ] duckpond Custom hook; rotatingCall stage 6+
- [ ] skee SlingAim; 9 balls; waxLies stage 3+; ring 10/20/30/50
- [ ] pennypitch SlingAim drop; jerk after release stage 2+
- [ ] dunk SlingAim; 3 balls/seat; depth=dunks; playful dunk VO
- [ ] All call finishRun with depth/score/deathReason; result route shared

## Hand-off (from sheet)
Food row (Floss/Popcorn/Duck) good art-filler + engine pairs. Skee + Pitch + Dunk = classic midway spine. Behind P0 + batch 01–03.
