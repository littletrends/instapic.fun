# Batch03 mount configs — drop-in for Desktop Grok (align to runKit)
# Mutoscope · Catoptromancy · High Striker · Bent Rings · Plinko
# Full coding contracts from GOBLIN_BATCH03_BUILD_SHEETS.md — not shells.
# engine declarations match GOBLIN_RUNKIT_API.md
# PF only. Never booth/port 6000. Never Imagine.
# Desktop Grok owns: highstriker · bentring · plinko
#   vendors/high-striker.js · vendors/bent-rings.js · vendors/plinko.js
# Leave mutoscope.js + catoptromancy.js to their desks.

---

## mutoscope — Custom (stillness)

```js
PF.runKit.declare("mutoscope", {
  engine: "Custom",
  displayName: "Mutoscope Hood",
  depthUnit: "Stage",
  sheet: "GOBLIN_BATCH03_BUILD_SHEETS.md",
  stillness: true,
});

/**
 * Stillness iris + card reel.
 * Mount: Custom — pointer stillness must work (no gyro-only).
 * Death: slam count hits slamLimit in current stage.
 * Clear: cardsViewed >= cardsNeeded without death → depth++, next stageParams.
 */
function mutoscopeStageParams(n) {
  const t = n - 1;
  if (n === 1) {
    return {
      id: 1,
      title: "Peep Teach",
      cardsNeeded: 4,
      cardMs: 900,
      stillPx: 14,
      slamLimit: 3,
      stillWarmupMs: 400,
      crankSpeedMul: 0.7, // −30% interval once per card
      jumpScare: false,
      fakeSlamAudio: false,
    };
  }
  if (n === 2) {
    return {
      id: 2,
      title: "Steady Reel",
      cardsNeeded: 5,
      cardMs: 800,
      stillPx: 12,
      slamLimit: 2,
      stillWarmupMs: 350,
      crankSpeedMul: 0.7,
      jumpScare: false,
      fakeSlamAudio: false,
    };
  }
  if (n === 3) {
    return {
      id: 3,
      title: "Micro-Jitter Bait",
      cardsNeeded: 6,
      cardMs: 700,
      stillPx: 10,
      slamLimit: 2,
      stillWarmupMs: 300,
      crankSpeedMul: 0.7,
      jumpScare: false,
      fakeSlamAudio: false,
    };
  }
  if (n === 4) {
    return {
      id: 4,
      title: "Jump Scare Flash",
      cardsNeeded: 7,
      cardMs: 650,
      stillPx: 9,
      slamLimit: 2,
      stillWarmupMs: 280,
      crankSpeedMul: 0.7,
      jumpScare: true, // visual flash — movement still counts as slam
      fakeSlamAudio: false,
    };
  }
  if (n === 5) {
    return {
      id: 5,
      title: "Tight Iris",
      cardsNeeded: 8,
      cardMs: 600,
      stillPx: 8,
      slamLimit: 2,
      stillWarmupMs: 250,
      crankSpeedMul: 0.7,
      jumpScare: true,
      fakeSlamAudio: false,
    };
  }
  // 6+
  return {
    id: n,
    title: "Endless Peep",
    cardsNeeded: 8 + Math.floor(t / 2),
    cardMs: Math.max(400, 600 - 15 * t),
    stillPx: Math.max(5, 8 - 0.3 * t),
    slamLimit: 2,
    stillWarmupMs: Math.max(180, 250 - 8 * t),
    crankSpeedMul: 0.7,
    jumpScare: true,
    fakeSlamAudio: true, // audio slam — IGNORE for strike (cheat tease)
  };
}

/**
 * Scoring contract
 * +40 per card viewed · +300 stage clear · +50 × depth on clear
 * depth = stages cleared
 * finishRun({ gameId:"mutoscope", depth, score, deathReason:"iris slam" })
 * bestDepth.mutoscope = Stage
 *
 * Play loop:
 * 1. Iris closed until pointer movement < stillPx for stillWarmupMs → iris opens
 * 2. Cards advance every cardMs while iris open; optional crank tap → next card interval *= crankSpeedMul (once per card)
 * 3. Any move > stillPx while iris open → iris SLAM · strike++
 * 4. strikes >= slamLimit → DEATH
 * 5. cardsViewed >= cardsNeeded → clear, depth++, reset strikes
 * Don't: gyro-only; auto-progress without stillness
 */
```

---

## catoptromancy — OracleRooms

```js
PF.runKit.declare("catoptromancy", {
  engine: "OracleRooms",
  displayName: "Catoptromancy Mirror",
  depthUnit: "Room",
  sheet: "GOBLIN_BATCH03_BUILD_SHEETS.md",
});

/**
 * OracleRooms.mount(root, spec, runCtx)
 * spec: { waitMs(n), breakLimitMs(n), allowDoubleFrom, ticketGen, stageParams(n) }
 * Depth = rooms cleared with KEEP (BURN stays; DOUBLE success jumps depth+2)
 */
function catoptromancyStageParams(n) {
  const t = n - 1;
  if (n === 1) {
    return {
      id: 1,
      title: "First Gaze",
      waitMs: 4000,
      breakLimitMs: 1200,
      allowDouble: false,
      lieFlicker: false,
      hazyRefusal: false,
    };
  }
  if (n === 2) {
    return {
      id: 2,
      title: "Longer Glass",
      waitMs: 5000,
      breakLimitMs: 1000,
      allowDouble: false,
      lieFlicker: false,
      hazyRefusal: false,
    };
  }
  if (n === 3) {
    return {
      id: 3,
      title: "Double Opens",
      waitMs: 6000,
      breakLimitMs: 900,
      allowDouble: true,
      lieFlicker: false,
      hazyRefusal: false,
    };
  }
  if (n === 4) {
    return {
      id: 4,
      title: "Lie Flicker",
      waitMs: 7000,
      breakLimitMs: 800,
      allowDouble: true,
      lieFlicker: true, // flash — hold through; release still breaks
      hazyRefusal: false,
    };
  }
  if (n === 5) {
    return {
      id: 5,
      title: "Tight Gaze",
      waitMs: 8000,
      breakLimitMs: 700,
      allowDouble: true,
      lieFlicker: true,
      hazyRefusal: false,
    };
  }
  // 6+
  return {
    id: n,
    title: "Hazy Oracle",
    waitMs: Math.min(14000, 8000 + 600 * t),
    breakLimitMs: Math.max(400, 700 - 30 * t),
    allowDouble: true,
    lieFlicker: true,
    hazyRefusal: true, // ticket flavour only — still valid KEEP
  };
}

/** Helpers for OracleRooms wire */
function catoptromancyWaitMs(n) {
  return catoptromancyStageParams(n).waitMs;
}
function catoptromancyBreakLimitMs(n) {
  return catoptromancyStageParams(n).breakLimitMs;
}
const CATOP_ALLOW_DOUBLE_FROM = 3; // room id >= 3

/**
 * DOUBLE risk: 45% → depth += 2 + rare colour ticket; 55% → DEATH
 * BURN → reroll ticket, next waitMs *= 1.25, depth unchanged
 * KEEP → bank ticket colour, depth++, next room
 *
 * Scoring:
 * +200 per KEEP room · DOUBLE success +600 · 3-same colour constellation +500
 * Ticket packs: playful Aura; never medical / death / destiny-romance (soft pack)
 *
 * Death: breakMs > breakLimitMs ("looked away") OR DOUBLE fail
 * finishRun({ gameId:"catoptromancy", depth, score, deathReason })
 * bestDepth.catoptromancy = Room
 *
 * Don't: skip button; instant gumball fortune
 */
```

---

## highstriker — TimingTap

```js
PF.runKit.declare("highstriker", {
  engine: "TimingTap",
  displayName: "High Striker Pegs",
  depthUnit: "Pegs",
  sheet: "GOBLIN_BATCH03_BUILD_SHEETS.md",
});

/**
 * TimingTap.mount(root, spec, runCtx) — vertical climb skin
 * Bell every 5 pegs = checkpoint fanfare (hardcore: no save; casual later may soft-save)
 * Depth = highest peg reached this run (NOT stages)
 * Death: 3 slips in a band without net gain OR fall from peg 0 twice
 */
function highstrikerBandParams(peg) {
  // peg = current height (0-based before climb, or 1-based after — use next peg target)
  const p = Math.max(1, peg);
  if (p <= 5) {
    return { pegBand: "1-5", zoneH: 0.18, speed: 0.5, slipOnMiss: -1, shrinkAfterHit: false, fakeBell: false };
  }
  if (p <= 10) {
    return { pegBand: "6-10", zoneH: 0.14, speed: 0.7, slipOnMiss: -1, shrinkAfterHit: false, fakeBell: false };
  }
  if (p <= 15) {
    return { pegBand: "11-15", zoneH: 0.11, speed: 0.9, slipOnMiss: -1, shrinkAfterHit: false, fakeBell: true };
  }
  if (p <= 20) {
    return { pegBand: "16-20", zoneH: 0.09, speed: 1.1, slipOnMiss: -2, shrinkAfterHit: false, fakeBell: false };
  }
  // 21+
  const t = p - 20;
  return {
    pegBand: "21+",
    zoneH: Math.max(0.05, 0.09 - 0.002 * t),
    speed: Math.min(2.0, 1.1 + 0.08 * t),
    slipOnMiss: -2,
    shrinkAfterHit: true, // zone shrinks after each successful hit
    fakeBell: t % 3 === 0,
  };
}

/** StageParams adapter — TimingTap schedule from current peg */
function highstrikerStageParams(n) {
  // n here = peg target index for HUD; band from height
  const band = highstrikerBandParams(n);
  return {
    id: n,
    title: n % 5 === 0 ? `Bell ${n / 5}` : `Peg ${n}`,
    zoneH: band.zoneH,
    speed: band.speed,
    slipOnMiss: band.slipOnMiss,
    shrinkAfterHit: band.shrinkAfterHit,
    fakeBell: band.fakeBell,
    bellEvery: 5,
    slipsWithoutNetGainToDeath: 3,
    fallFromZeroTwiceToDeath: true,
  };
}

/**
 * Play loop:
 * - Vertical meter + moving sweet zone; tap while indicator inside zone → climb +1 peg
 * - Miss → peg += slipOnMiss (min 0); track slipsWithoutNetGain
 * - Every 5 pegs → bell checkpoint fanfare
 * - reportDepth(runCtx, currentPeg) as glory
 *
 * Scoring: +30 per peg · +200 per bell · depth = pegs
 * finishRun({ gameId:"highstriker", depth: pegs, score, deathReason:"hammer slip"|"fell from zero" })
 * bestDepth.highstriker = Pegs
 *
 * Don't: mash-anywhere progress; hard end at first bell
 */
```

---

## bentring — SlingAim

```js
PF.runKit.declare("bentring", {
  engine: "SlingAim",
  displayName: "Bent Ring Pegs",
  depthUnit: "Stage",
  sheet: "GOBLIN_BATCH03_BUILD_SHEETS.md",
});

/**
 * SlingAim.mount(root, spec, runCtx) — rings launcher (Ball Toss cousin)
 * Mid-flight cheat: after release + delayMs, pegs lerp lean ±leanDeg (readable)
 * Stage clear = ringed pegs >= need; 3 rings per stage; exhaust before need = DEATH
 */
function bentringStageParams(n) {
  const t = n - 1;
  if (n === 1) {
    return {
      id: 1,
      title: "Soft Lean",
      pegs: 3,
      need: 2,
      leanDeg: 8,
      delayMs: 280,
      ringScale: 1.0,
      ringsPerStage: 3,
    };
  }
  if (n === 2) {
    return {
      id: 2,
      title: "All Three",
      pegs: 3,
      need: 3,
      leanDeg: 12,
      delayMs: 260,
      ringScale: 0.95,
      ringsPerStage: 3,
    };
  }
  if (n === 3) {
    return {
      id: 3,
      title: "Four Peg Board",
      pegs: 4,
      need: 3,
      leanDeg: 16,
      delayMs: 240,
      ringScale: 0.9,
      ringsPerStage: 3,
    };
  }
  if (n === 4) {
    return {
      id: 4,
      title: "Full Board",
      pegs: 4,
      need: 4,
      leanDeg: 20,
      delayMs: 220,
      ringScale: 0.88,
      ringsPerStage: 4, // max(3, need) — 3 rings / need 4 is unwinnable
    };
  }
  // 5+
  return {
    id: n,
    title: "Mean Lean",
    pegs: 5,
    need: 4,
    leanDeg: Math.min(35, 20 + 2 * t),
    delayMs: 200,
    ringScale: 0.85,
    ringsPerStage: 4, // max(3, need)
  };
}

/**
 * hitTest: ring center vs peg after lean applied; stuck = success
 * onThrow: start delayMs timer → lerp peg lean ±leanDeg (sign readable / alternate)
 * missesToDeath: effective = ringsPerStage exhausted before need met (not global 3)
 * ringsPerStage = max(3, need) so stage 4+ is playable
 *
 * Scoring: +80 per stuck ring · +350 stage clear · depth = stages
 * finishRun({ gameId:"bentring", depth, score, deathReason:"out of rings" })
 * bestDepth.bentring = Stage
 *
 * Don't: hide lean (cheat must be tent-visible); auto-stick on near miss
 */
```

---

## plinko — Custom

```js
PF.runKit.declare("plinko", {
  engine: "Custom",
  displayName: "Plinko Pegboard",
  depthUnit: "Stage",
  sheet: "GOBLIN_BATCH03_BUILD_SHEETS.md",
});

/**
 * Custom chip drop + breathing tilt board.
 * 5 top drop lanes; slots 0–9; stage clear = first chip in slot >= targetSlotMin
 * (leftover chips unused). 3 chips per stage; fail all → DEATH
 */
function plinkoStageParams(n) {
  const t = n - 1;
  const tiltAmps = { low: 0.08, mid: 0.16, high: 0.28 };
  if (n === 1) {
    return {
      id: 1,
      title: "Soft Drop",
      targetSlotMin: 3,
      chips: 3,
      tiltAmp: tiltAmps.low,
      tiltHz: 0.35,
      dropLanes: 5,
      deadPegEveryNthRow: 0,
      biasFromEntry: true,
    };
  }
  if (n === 2) {
    return {
      id: 2,
      title: "Breath Mid",
      targetSlotMin: 4,
      chips: 3,
      tiltAmp: tiltAmps.mid,
      tiltHz: 0.4,
      dropLanes: 5,
      deadPegEveryNthRow: 0,
      biasFromEntry: true,
    };
  }
  if (n === 3) {
    return {
      id: 3,
      title: "Aim Five",
      targetSlotMin: 5,
      chips: 3,
      tiltAmp: tiltAmps.mid,
      tiltHz: 0.45,
      dropLanes: 5,
      deadPegEveryNthRow: 0,
      biasFromEntry: true,
    };
  }
  if (n === 4) {
    return {
      id: 4,
      title: "High Breath",
      targetSlotMin: 6,
      chips: 3,
      tiltAmp: tiltAmps.high,
      tiltHz: 0.5,
      dropLanes: 5,
      deadPegEveryNthRow: 0,
      biasFromEntry: true,
    };
  }
  // 5+
  return {
    id: n,
    title: "Dead Peg Rows",
    targetSlotMin: Math.min(8, 6 + Math.floor(t / 2)),
    chips: 3,
    tiltAmp: tiltAmps.high,
    tiltHz: Math.min(0.7, 0.5 + 0.02 * t),
    dropLanes: 5,
    deadPegEveryNthRow: 3, // every 3rd row has a dead/absorb peg
    biasFromEntry: true,
  };
}

/**
 * Physics (dumb & readable):
 * - Chip release from chosen lane 0..4
 * - Peg bounce L/R ~50/50 with bias from entry angle + board tilt oscillation
 * - tilt = sin(t * tiltHz * τ) * tiltAmp → shifts bias
 * - Slot value = slot index; clear if slot >= targetSlotMin
 *
 * Scoring: slotValue × 10 per chip · +300 stage clear · depth = stages
 * Optional endless high-score sum of slot values across run
 * finishRun({ gameId:"plinko", depth, score, deathReason:"chips exhausted" })
 * bestDepth.plinko = Stage
 *
 * Don't: pure RNG with no drop timing skill; hide tilt breath
 */
```

---

## Wire checklist (Batch03)

- [ ] mutoscope Custom stillness + stageParams; pointer stillPx (not gyro-only)
- [ ] catoptromancy OracleRooms; KEEP/BURN/DOUBLE; allowDoubleFrom=3
- [x] highstriker TimingTap vertical; depth=pegs; bell every 5 · vendors/high-striker.js
- [x] bentring SlingAim; mid-flight lean after delayMs · vendors/bent-rings.js
- [x] plinko Custom; tiltAmp + targetSlotMin; 3 chips/stage · vendors/plinko.js
- [x] highstriker / bentring / plinko call finishRun with depth/score/deathReason; result chrome in-stall
- [x] Door tag `VENDOR · DEPTH RUN` on high-striker / bent-rings / plinko (play mounted)

## Hand-off order (from sheet)
Mutoscope → High Striker → Catoptromancy → Bent Rings → Plinko (or parallel art).
