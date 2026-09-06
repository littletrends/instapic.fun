# Batch 21 mount configs — drop-in for Desktop Grok (align to runKit)
# No ping needed — pull when wiring Cat Rack / Brass Ring / Pull-a-String / Hit-the-Nail / Guess Weight / Razzle.
# engine declarations match GOBLIN_BATCH21_BUILD_SHEETS.md (quiet drop; NEW vendors not in batches 01–20)
# Style twin of GOBLIN_BATCH18_MOUNT_CONFIGS.md / GOBLIN_BATCH13_MOUNT_CONFIGS.md

## catrack — SlingAim · Cat Rack
```js
PF.runKit.declare("catrack", {
  engine: "SlingAim", // weighted-base cat rack — 1930s–50s alley cheat
  displayName: "Cat Rack",
  depthUnit: "Rack",
  sheet: "GOBLIN_BATCH21_BUILD_SHEETS.md",
});

function catrackStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Paws" : n < 3 ? "Mid Rack" : n < 5 ? "Heavy Base" : "Cat Storm",
    need: n === 1 ? 2 : n === 2 ? 3 : n === 3 ? 3 : n === 4 ? 4 : 4 + Math.floor(t / 2),
    cats: n === 1 ? 3 : n < 4 ? 4 : n === 4 ? 5 : 5 + Math.floor(t / 3),
    baseMass: n === 1 ? 2.0 : n === 2 ? 2.3 : n === 3 ? 2.6 : n === 4 ? 2.9 : Math.min(4.0, 2.9 + 0.15 * t),
    bodyMass: n < 3 ? 0.8 : n === 3 ? 0.75 : n === 4 ? 0.7 : 0.65,
    spacing: n < 3 ? "wide" : n < 5 ? "mid" : "tight",
    balls: n < 4 ? 5 : 6,
    gluedBase: n >= 4 ? 1 : 0,
    missesToDeath: n === 1 ? 4 : n < 5 ? 3 : 2,
    tipOnlyNoCredit: true, // must leave shelf plane
  };
}
// Play: knock stuffed cats; weighted bases fight back
// Depth = racks cleared
// Death: balls out / tip-only fail streak
// finishRun({ gameId:"catrack", depth, score, deathReason:"balls_out"|"tip_only_fail" })
// bestDepth.catrack = Rack
```
**Don'ts:** equal mass body/base · magnet auto-clear · ignore gluedBase late

---

## brassring — TimingTap · Carousel Brass Ring
```js
PF.runKit.declare("brassring", {
  engine: "TimingTap", // grab brass; tin decoys stage 3+
  displayName: "Carousel Brass Ring",
  depthUnit: "Grab",
  sheet: "GOBLIN_BATCH21_BUILD_SHEETS.md",
});

function brassringStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Teach Pass" : n < 3 ? "Mid Carousel" : n < 5 ? "Tin Flash" : "Ring Storm",
    need: n === 1 ? 4 : n === 2 ? 5 : n === 3 ? 6 : n === 4 ? 7 : 7 + t,
    windowMs: n === 1 ? 180 : n === 2 ? 155 : n === 3 ? 135 : n === 4 ? 115 : Math.max(70, 115 - 5 * t),
    passMs: n === 1 ? 900 : n === 2 ? 800 : n === 3 ? 720 : n === 4 ? 640 : Math.max(420, 640 - 25 * t),
    tinPct: n < 3 ? 0 : n === 3 ? 18 : n === 4 ? 25 : 32,
    missesToDeath: n < 4 ? 3 : 2,
  };
}
// Play: tap GRAB on brass ring pass; skip tin
// Depth = grabs cleared
// Death: misses / tin grab / early
// finishRun({ gameId:"brassring", depth, score, deathReason:"misses"|"tin_grab"|"early" })
// bestDepth.brassring = Grab
```
**Don'ts:** auto-grab on proximity · credit tin · window never tightens

---

## stringpull — GreedFloor · Pull-a-String Prize Wall
```js
PF.runKit.declare("stringpull", {
  engine: "GreedFloor", // shared dud block behind curtain — classic string wall
  displayName: "Pull-a-String Prize Wall",
  depthUnit: "Floor",
  sheet: "GOBLIN_BATCH21_BUILD_SHEETS.md",
});

function stringpullStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Chalk Hint" : n < 3 ? "Shared Dud" : n < 5 ? "Thin Rare" : "Shuffle Wall",
    strings: n === 1 ? 10 : n === 2 ? 12 : n === 3 ? 12 : n === 4 ? 14 : 16,
    rarePct: n === 1 ? 14 : n === 2 ? 11 : n === 3 ? 9 : n === 4 ? 7 : 5,
    dudStreakDeath: n === 1 ? 0 : n < 4 ? 3 : 2, // 0 = no streak death on floor 1
    pullsToClear: n < 3 ? 3 : n < 5 ? 4 : 5,
    sharedDudBlock: true,
    shuffleStrings: n >= 5,
    canCashOut: true,
  };
}
// Play: pull strings; cash out or again; shared dud is the cheat
// Depth = floors survived
// Death: dud streak / empty wall
// finishRun({ gameId:"stringpull", depth, score, deathReason:"dud_streak"|"empty_wall", cashedOut })
// bestDepth.stringpull = Floor
```
**Don'ts:** independent fair RNG forever · hide shared dud with no tell · no CASH OUT

---

## nailhammer — HoldBand · Hit-the-Nail
```js
PF.runKit.declare("nailhammer", {
  engine: "HoldBand", // force band while nail seats; lean wobble stage 3+
  displayName: "Hit-the-Nail",
  depthUnit: "Nail",
  sheet: "GOBLIN_BATCH21_BUILD_SHEETS.md",
});

function nailhammerStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n < 3 ? "Mid Seat" : n < 5 ? "Drunk Nail" : "Nail Storm",
    bandW: n === 1 ? 0.30 : n === 2 ? 0.24 : n === 3 ? 0.18 : n === 4 ? 0.14 : Math.max(0.08, 0.14 - 0.01 * t),
    leanWobble: n < 3 ? 0 : n === 3 ? "low" : n === 4 ? "mid" : "high",
    outLimitMs: n === 1 ? 900 : n === 2 ? 800 : n === 3 ? 700 : n === 4 ? 600 : 500,
    clearMs: n === 1 ? 1800 : n === 2 ? 2000 : n === 3 ? 2200 : n === 4 ? 2400 : 2600,
    bendLimit: n === 1 ? 3 : 2,
  };
}
// Play: hold hammer force in band; seat the nail
// Depth = nails seated
// Death: bent / drifted / never_found
// finishRun({ gameId:"nailhammer", depth, score, deathReason:"bent"|"drifted"|"never_found" })
// bestDepth.nailhammer = Nail
```
**Don'ts:** auto-seat button · Love-heat romance copy · ignore lean late

---

## weightguess — OracleRooms · Guess Your Weight
```js
PF.runKit.declare("weightguess", {
  engine: "OracleRooms", // stillness then weight-band bluff — soft pack, no body shame
  displayName: "Guess Your Weight",
  depthUnit: "Room",
  sheet: "GOBLIN_BATCH21_BUILD_SHEETS.md",
});

function weightguessStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Wide Band" : n < 3 ? "Mid Needle" : n < 5 ? "Feint Scale" : "Thin Guess",
    waitMs: n === 1 ? 1200 : n === 2 ? 1400 : n === 3 ? 1600 : n === 4 ? 1800 : Math.min(2400, 1800 + 80 * t),
    breakLimitMs: n === 1 ? 4000 : n === 2 ? 3800 : n === 3 ? 3500 : n === 4 ? 3200 : Math.max(2200, 3200 - 100 * t),
    bandWidth: n < 3 ? "wide" : n < 5 ? "mid" : "thin",
    bandLbs: n === 1 ? 8 : n === 2 ? 6 : n === 3 ? 4 : n === 4 ? 3 : 2,
    allowDoubleFrom: 3,
    needleFeint: n >= 3,
    copyTone: "soft_cute", // no body shame
  };
}
// Play: stillness opens room; pick weight band; wrong = curtain
// Depth = rooms cleared
// Death: wrong_band / broke_still / timeout
// finishRun({ gameId:"weightguess", depth, score, deathReason:"wrong_band"|"broke_still"|"timeout" })
// bestDepth.weightguess = Room
```
**Don'ts:** body-shame / diet copy · medical framing · skip stillness gate

---

## razzledazzle — Custom · Razzle Dazzle
```js
PF.runKit.declare("razzledazzle", {
  engine: "Custom", // TimingTap skill-stop + GreedFloor cash-out; chart bump cheat visible
  displayName: "Razzle Dazzle",
  depthUnit: "Card",
  sheet: "GOBLIN_BATCH21_BUILD_SHEETS.md",
});

function razzledazzleStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Teach Add" : n < 3 ? "Near Miss" : n < 5 ? "Chart Bump" : "Razzle Storm",
    targetScore: n === 1 ? 12 : n === 2 ? 14 : n === 3 ? 16 : n === 4 ? 18 : 18 + 2 * t,
    tosses: n < 3 ? 4 : 5,
    pitMax: 6,
    nearGap: n < 3 ? 2 : 3,
    cheatBump: n === 1 ? 0 : n === 2 ? 1 : n === 3 ? 2 : n === 4 ? 3 : 3 + t,
    graceNearFree: n === 1 ? 1 : 0,
    canCashOut: true,
    chartRewriteVisible: true, // placard revises when near
  };
}
// Play: skill-stop add-up; chart bumps when close — classic razzle
// Depth = cards cleared
// Death: short_sum / chart_bump_bust / tosses_out
// finishRun({ gameId:"razzledazzle", depth, score, deathReason:"short_sum"|"chart_bump_bust"|"tosses_out", cashedOut })
// bestDepth.razzledazzle = Card
```
**Don'ts:** hidden RNG win with no chart motion · real-money gambling copy · unreadable placard rewrite

---

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: catrack, brassring, stringpull, nailhammer, weightguess, razzledazzle.
Door tag: `Depth run` only if engine mounted.

## finishRun quick hints
| gameId | depthUnit | typical deathReason |
|--------|-----------|---------------------|
| catrack | Rack | balls_out, tip_only_fail |
| brassring | Grab | misses, tin_grab, early |
| stringpull | Floor | dud_streak, empty_wall |
| nailhammer | Nail | bent, drifted, never_found |
| weightguess | Room | wrong_band, broke_still, timeout |
| razzledazzle | Card | short_sum, chart_bump_bust, tosses_out |
