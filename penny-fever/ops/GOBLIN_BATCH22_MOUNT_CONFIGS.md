# Batch 22 mount configs — drop-in for Desktop Grok (align to runKit)
# No ping needed — pull when wiring Soft Hoop Toss / Shoot the Star / Piggy Bank Slide / Tug Band / Guess Your Age / Fascination.
# engine declarations match GOBLIN_BATCH22_BUILD_SHEETS.md (quiet drop; NEW vendors not in batches 01–21)
# Style twin of GOBLIN_BATCH21_MOUNT_CONFIGS.md / GOBLIN_BATCH18_MOUNT_CONFIGS.md

## hoopswish — SlingAim · Soft Hoop Toss
```js
PF.runKit.declare("hoopswish", {
  engine: "SlingAim", // spring rim + overinflate spit — 1940s soft-hoop cheat
  displayName: "Soft Hoop Toss",
  depthUnit: "Hoop",
  sheet: "GOBLIN_BATCH22_BUILD_SHEETS.md",
});

function hoopswishStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Court" : n === 3 ? "Spring Rim" : n === 4 ? "Short Net" : "Hoop Storm",
    need: n === 1 ? 2 : n === 2 ? 3 : n === 3 ? 3 : n === 4 ? 4 : 4 + Math.floor(t / 2),
    rimScale: n === 1 ? 1.0 : n === 2 ? 0.94 : n === 3 ? 0.9 : n === 4 ? 0.86 : Math.max(0.7, 0.86 - 0.02 * t),
    springRim: n >= 3,
    overinflatePct: n === 1 ? 0 : n === 2 ? 8 : n === 3 ? 12 : n === 4 ? 16 : Math.min(28, 16 + 2 * t),
    balls: n < 4 ? 5 : 6,
    backboardLean: n < 3 ? 0 : n === 3 ? "low" : n === 4 ? "mid" : "high",
    missesToDeath: n === 1 ? 4 : n < 5 ? 3 : 2,
  };
}
// Play: drag-aim softballs; spring rim + overinflate spit are the cheat
// Depth = hoops cleared
// Death: balls out / spring spit / airball streak
// finishRun({ gameId:"hoopswish", depth, score, deathReason:"balls_out"|"spring_spit"|"airball_streak" })
// bestDepth.hoopswish = Hoop
```
**Don'ts:** NBA regulation rim · magnet auto-swish · ignore springRim late · real basketball league copy

---

## shootstar — TimingTap · Shoot the Star
```js
PF.runKit.declare("shootstar", {
  engine: "TimingTap", // chip star outline; thick-point decoys stage 3+
  displayName: "Shoot the Star",
  depthUnit: "Star",
  sheet: "GOBLIN_BATCH22_BUILD_SHEETS.md",
});

function shootstarStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Teach Chip" : n === 2 ? "Mid Star" : n === 3 ? "Thick Points" : n === 4 ? "Thin Pulse" : "Star Storm",
    needSeg: n === 1 ? 5 : n === 2 ? 6 : n === 3 ? 7 : n === 4 ? 8 : 8 + t,
    windowMs: n === 1 ? 180 : n === 2 ? 155 : n === 3 ? 135 : n === 4 ? 115 : Math.max(70, 115 - 5 * t),
    pulseMs: n === 1 ? 900 : n === 2 ? 820 : n === 3 ? 740 : n === 4 ? 660 : Math.max(420, 660 - 25 * t),
    thickPct: n < 3 ? 0 : n === 3 ? 20 : n === 4 ? 28 : 35,
    resetMs: n === 1 ? 14000 : n === 2 ? 13000 : n === 3 ? 12000 : n === 4 ? 11000 : Math.max(8000, 11000 - 200 * t),
    missesToDeath: n < 4 ? 3 : 2,
  };
}
// Play: tap CHIP on thin segments; skip thick points
// Depth = stars cleared
// Death: misses / thick_point / reset_fail / early
// finishRun({ gameId:"shootstar", depth, score, deathReason:"misses"|"thick_point"|"reset_fail"|"early" })
// bestDepth.shootstar = Star
```
**Don'ts:** real gun / ammo copy · auto-chip on proximity · credit thick points · window never tightens

---

## pigslide — GreedFloor · Piggy Bank Slide
```js
PF.runKit.declare("pigslide", {
  engine: "GreedFloor", // soft lip past pig mouth — classic penny-slide banker
  displayName: "Piggy Bank Slide",
  depthUnit: "Floor",
  sheet: "GOBLIN_BATCH22_BUILD_SHEETS.md",
});

function pigslideStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Chalk Lip" : n === 2 ? "Soft Bank" : n === 3 ? "Thin Mouth" : n === 4 ? "Wobble Lane" : "Lip + Distractor",
    slides: n === 1 ? 8 : n === 2 ? 10 : n === 3 ? 10 : n === 4 ? 12 : 14,
    rarePct: n === 1 ? 16 : n === 2 ? 12 : n === 3 ? 10 : n === 4 ? 8 : 6,
    dudStreakDeath: n === 1 ? 0 : n < 4 ? 3 : 2, // 0 = no streak death on floor 1
    slidesToClear: n < 3 ? 3 : n < 5 ? 4 : 5,
    lipCheat: true,
    lipTell: n === 1 ? "chalk" : "ridge",
    laneWobble: n < 2 ? 0 : n < 4 ? "low" : n === 4 ? "mid" : "high",
    distractor: n >= 5,
    canCashOut: true,
  };
}
// Play: slide pennies; cash out or again; soft lip is the cheat
// Depth = floors survived
// Death: dud streak / empty bank / lip kiss
// finishRun({ gameId:"pigslide", depth, score, deathReason:"dud_streak"|"empty_bank"|"lip_kiss", cashedOut })
// bestDepth.pigslide = Floor
```
**Don'ts:** fair frictionless lane forever · hide lip with no tell · no CASH OUT button · real-money banker copy

---

## tugband — HoldBand · Tug Band
```js
PF.runKit.declare("tugband", {
  engine: "HoldBand", // force band while rope seats; goblin pulse wobble stage 3+
  displayName: "Tug Band",
  depthUnit: "Pull",
  sheet: "GOBLIN_BATCH22_BUILD_SHEETS.md",
});

function tugbandStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Rope" : n === 3 ? "Goblin Pulse" : n === 4 ? "Thin Tug" : "Tug Storm",
    bandW: n === 1 ? 0.3 : n === 2 ? 0.24 : n === 3 ? 0.18 : n === 4 ? 0.14 : Math.max(0.08, 0.14 - 0.01 * t),
    pulseWobble: n < 3 ? 0 : n === 3 ? "low" : n === 4 ? "mid" : "high",
    outLimitMs: n === 1 ? 900 : n === 2 ? 800 : n === 3 ? 700 : n === 4 ? 600 : 500,
    clearMs: n === 1 ? 1800 : n === 2 ? 2000 : n === 3 ? 2200 : n === 4 ? 2400 : 2600,
    slipLimit: n === 1 ? 3 : 2,
  };
}
// Play: hold force in sweet band; seat rope past win mark
// Depth = pulls won
// Death: slipped / yanked / never_found
// finishRun({ gameId:"tugband", depth, score, deathReason:"slipped"|"yanked"|"never_found" })
// bestDepth.tugband = Pull
```
**Don'ts:** auto-win button · Love-heat romance copy · ignore pulse late · PvP / multiplayer framing

---

## ageguess — OracleRooms · Guess Your Age
```js
PF.runKit.declare("ageguess", {
  engine: "OracleRooms", // stillness then age-band guess — soft pack, no age shame
  displayName: "Guess Your Age",
  depthUnit: "Room",
  sheet: "GOBLIN_BATCH22_BUILD_SHEETS.md",
});

function ageguessStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Wide Decade" : n === 2 ? "Mid Needle" : n === 3 ? "Decade Feint" : n === 4 ? "Thin Band" : "Double Feint",
    waitMs: n === 1 ? 1200 : n === 2 ? 1400 : n === 3 ? 1600 : n === 4 ? 1800 : Math.min(2400, 1800 + 80 * t),
    breakLimitMs: n === 1 ? 4000 : n === 2 ? 3800 : n === 3 ? 3500 : n === 4 ? 3200 : Math.max(2200, 3200 - 100 * t),
    bandWidth: n < 3 ? "wide" : n < 5 ? "mid" : "thin",
    bandYears: n === 1 ? 8 : n === 2 ? 6 : n === 3 ? 4 : n === 4 ? 3 : 2,
    allowDoubleFrom: 3,
    decadeFeint: n >= 3,
    copyTone: "soft_cute", // no age-shame / no “look old” digs
  };
}
// Play: stillness opens room; pick age-band card; wrong = curtain
// Depth = rooms cleared
// Death: wrong_band / broke_still / timeout
// finishRun({ gameId:"ageguess", depth, score, deathReason:"wrong_band"|"broke_still"|"timeout" })
// bestDepth.ageguess = Room
```
**Don'ts:** age-shame / “you look ancient” copy · medical / ID framing · skip stillness gate · body-shame crossover

---

## fascination — Custom · Fascination Rolldown
```js
PF.runKit.declare("fascination", {
  engine: "Custom", // TimingTap skill-stop + GreedFloor cash-out; chart nudge cheat visible
  displayName: "Fascination Rolldown",
  depthUnit: "Card",
  sheet: "GOBLIN_BATCH22_BUILD_SHEETS.md",
});

function fascinationStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Teach Roll" : n === 2 ? "Near Pit" : n === 3 ? "Chart Nudge" : n === 4 ? "Close Lie" : "Fascination Storm",
    targetScore: n === 1 ? 12 : n === 2 ? 14 : n === 3 ? 16 : n === 4 ? 18 : 18 + 2 * t,
    rolls: n < 3 ? 4 : 5,
    pitMax: 6,
    nearGap: n < 3 ? 2 : 3,
    cheatBump: n === 1 ? 0 : n === 2 ? 1 : n === 3 ? 2 : n === 4 ? 3 : 3 + t,
    graceNearFree: n === 1 ? 1 : 0,
    canCashOut: true,
    chartRewriteVisible: true, // placard revises when near
  };
}
// Play: skill-stop rolldown; chart bumps when close — classic fascination
// Depth = cards cleared
// Death: short_sum / chart_bump_bust / rolls_out
// finishRun({ gameId:"fascination", depth, score, deathReason:"short_sum"|"chart_bump_bust"|"rolls_out", cashedOut })
// bestDepth.fascination = Card
```
**Don'ts:** hidden RNG win with no chart motion · real-money gambling copy · unreadable placard rewrite · clone razzledazzle marble trough art

---

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: hoopswish, shootstar, pigslide, tugband, ageguess, fascination.
Door tag: `Depth run` only if engine mounted.

## finishRun quick hints
| gameId | depthUnit | typical deathReason |
|--------|-----------|---------------------|
| hoopswish | Hoop | balls_out, spring_spit, airball_streak |
| shootstar | Star | misses, thick_point, reset_fail, early |
| pigslide | Floor | dud_streak, empty_bank, lip_kiss |
| tugband | Pull | slipped, yanked, never_found |
| ageguess | Room | wrong_band, broke_still, timeout |
| fascination | Card | short_sum, chart_bump_bust, rolls_out |
