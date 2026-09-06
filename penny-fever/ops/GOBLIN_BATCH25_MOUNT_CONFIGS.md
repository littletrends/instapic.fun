# Batch 25 mount configs — drop-in for Desktop Grok (align to runKit)
# No ping needed — pull when wiring Soft Bucket Toss / Paper Goldfish Scoop / Penny Wish Well / Limbo Bar / Foggy Palm Read / Alley Sand Dig.
# engine declarations match GOBLIN_BATCH25_BUILD_SHEETS.md (quiet drop; NEW vendors not in batches 01–22)
# Style twin of GOBLIN_BATCH22_MOUNT_CONFIGS.md / GOBLIN_BATCH21_MOUNT_CONFIGS.md

## bucketball — SlingAim · Soft Bucket Toss
```js
PF.runKit.declare("bucketball", {
  engine: "SlingAim", // lean bucket + rim-kiss spit — classic angled-bucket cheat
  displayName: "Soft Bucket Toss",
  depthUnit: "Bucket",
  sheet: "GOBLIN_BATCH25_BUILD_SHEETS.md",
});

function bucketballStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Toss" : n === 3 ? "Lean Mouth" : n === 4 ? "Short Bank" : "Bucket Storm",
    need: n === 1 ? 2 : n === 2 ? 3 : n === 3 ? 3 : n === 4 ? 4 : 4 + Math.floor(t / 2),
    mouthScale: n === 1 ? 1.0 : n === 2 ? 0.94 : n === 3 ? 0.9 : n === 4 ? 0.86 : Math.max(0.7, 0.86 - 0.02 * t),
    leanBucket: n >= 3,
    rimKissPct: n === 1 ? 0 : n === 2 ? 8 : n === 3 ? 12 : n === 4 ? 16 : Math.min(28, 16 + 2 * t),
    balls: n < 4 ? 5 : 6,
    crateWobble: n < 3 ? 0 : n === 3 ? "low" : n === 4 ? "mid" : "high",
    missesToDeath: n === 1 ? 4 : n < 5 ? 3 : 2,
  };
}
// Play: drag-aim softballs; lean + rim-kiss spit are the cheat
// Depth = buckets cleared
// Death: balls out / lean spit / rim kiss / airball streak
// finishRun({ gameId:"bucketball", depth, score, deathReason:"balls_out"|"lean_spit"|"rim_kiss"|"airball_streak" })
// bestDepth.bucketball = Bucket
```
**Don'ts:** regulation basketball hoop copy · magnet auto-bank · ignore leanBucket late · clone hoopswish rim art

---

## fishscoop — TimingTap · Paper Goldfish Scoop
```js
PF.runKit.declare("fishscoop", {
  engine: "TimingTap", // scoop paper fish; wet-melt decoy windows stage 3+
  displayName: "Paper Goldfish Scoop",
  depthUnit: "Pond",
  sheet: "GOBLIN_BATCH25_BUILD_SHEETS.md",
});

function fishscoopStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Teach Scoop" : n === 2 ? "Mid Pond" : n === 3 ? "Wet Melt" : n === 4 ? "Thin Pulse" : "Pond Storm",
    needFish: n === 1 ? 3 : n === 2 ? 4 : n === 3 ? 5 : n === 4 ? 6 : 6 + t,
    windowMs: n === 1 ? 180 : n === 2 ? 155 : n === 3 ? 135 : n === 4 ? 115 : Math.max(70, 115 - 5 * t),
    pulseMs: n === 1 ? 900 : n === 2 ? 820 : n === 3 ? 740 : n === 4 ? 660 : Math.max(420, 660 - 25 * t),
    meltPct: n < 3 ? 0 : n === 3 ? 20 : n === 4 ? 28 : 35,
    resetMs: n === 1 ? 14000 : n === 2 ? 13000 : n === 3 ? 12000 : n === 4 ? 11000 : Math.max(8000, 11000 - 200 * t),
    missesToDeath: n < 4 ? 3 : 2,
  };
}
// Play: tap SCOOP on dry-net windows; skip melt tears
// Depth = ponds cleared
// Death: misses / melt_tear / reset_fail / early
// finishRun({ gameId:"fishscoop", depth, score, deathReason:"misses"|"melt_tear"|"reset_fail"|"early" })
// bestDepth.fishscoop = Pond
```
**Don'ts:** live animals / real goldfish framing · auto-scoop on proximity · credit melt windows · cruelty copy · window never tightens

---

## wishwell — GreedFloor · Penny Wish Well
```js
PF.runKit.declare("wishwell", {
  engine: "GreedFloor", // spiral lip past center hole — classic wish-well banker
  displayName: "Penny Wish Well",
  depthUnit: "Floor",
  sheet: "GOBLIN_BATCH25_BUILD_SHEETS.md",
});

function wishwellStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Chalk Lip" : n === 2 ? "Soft Spiral" : n === 3 ? "Thin Center" : n === 4 ? "Wobble Spiral" : "Lip + Distractor",
    drops: n === 1 ? 8 : n === 2 ? 10 : n === 3 ? 10 : n === 4 ? 12 : 14,
    rarePct: n === 1 ? 16 : n === 2 ? 12 : n === 3 ? 10 : n === 4 ? 8 : 6,
    dudStreakDeath: n === 1 ? 0 : n < 4 ? 3 : 2,
    dropsToClear: n < 3 ? 3 : n < 5 ? 4 : 5,
    lipCheat: true,
    lipTell: n === 1 ? "chalk" : "ridge",
    spiralWobble: n < 2 ? 0 : n < 4 ? "low" : n === 4 ? "mid" : "high",
    distractor: n >= 5,
    canCashOut: true,
  };
}
// Play: drop pennies in spiral; cash out or again; soft lip is the cheat
// Depth = floors survived
// Death: dud streak / empty bank / lip kiss
// finishRun({ gameId:"wishwell", depth, score, deathReason:"dud_streak"|"empty_bank"|"lip_kiss", cashedOut })
// bestDepth.wishwell = Floor
```
**Don'ts:** fair frictionless spiral forever · hide lip with no tell · no CASH OUT button · real-money banker / casino well copy · clone pigslide pig-mouth art

---

## limbobar — HoldBand · Limbo Bar
```js
PF.runKit.declare("limbobar", {
  engine: "HoldBand", // force band while bar seats; goblin dip wobble stage 3+
  displayName: "Limbo Bar",
  depthUnit: "Dip",
  sheet: "GOBLIN_BATCH25_BUILD_SHEETS.md",
});

function limbobarStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Bar" : n === 3 ? "Goblin Dip" : n === 4 ? "Thin Duck" : "Limbo Storm",
    bandW: n === 1 ? 0.3 : n === 2 ? 0.24 : n === 3 ? 0.18 : n === 4 ? 0.14 : Math.max(0.08, 0.14 - 0.01 * t),
    pulseWobble: n < 3 ? 0 : n === 3 ? "low" : n === 4 ? "mid" : "high",
    outLimitMs: n === 1 ? 900 : n === 2 ? 800 : n === 3 ? 700 : n === 4 ? 600 : 500,
    clearMs: n === 1 ? 1800 : n === 2 ? 2000 : n === 3 ? 2200 : n === 4 ? 2400 : 2600,
    slipLimit: n === 1 ? 3 : 2,
  };
}
// Play: hold force in sweet band; seat bar under win mark
// Depth = dips won
// Death: slipped / dipped / never_found
// finishRun({ gameId:"limbobar", depth, score, deathReason:"slipped"|"dipped"|"never_found" })
// bestDepth.limbobar = Dip
```
**Don'ts:** auto-win button · Love-heat romance copy · ignore pulse late · PvP / multiplayer framing · clone tugband rope art

---

## palmfog — OracleRooms · Foggy Palm Read
```js
PF.runKit.declare("palmfog", {
  engine: "OracleRooms", // stillness then palm-line guess — soft pack, no fate shame
  displayName: "Foggy Palm Read",
  depthUnit: "Room",
  sheet: "GOBLIN_BATCH25_BUILD_SHEETS.md",
});

function palmfogStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Wide Palm" : n === 2 ? "Mid Fog" : n === 3 ? "Fog Feint" : n === 4 ? "Thin Line" : "Double Feint",
    waitMs: n === 1 ? 1200 : n === 2 ? 1400 : n === 3 ? 1600 : n === 4 ? 1800 : Math.min(2400, 1800 + 80 * t),
    breakLimitMs: n === 1 ? 4000 : n === 2 ? 3800 : n === 3 ? 3500 : n === 4 ? 3200 : Math.max(2200, 3200 - 100 * t),
    bandWidth: n < 3 ? "wide" : n < 5 ? "mid" : "thin",
    allowDoubleFrom: 3,
    fogFeint: n >= 3,
    copyTone: "soft_cute", // no fate-shame / no “cursed” digs
  };
}
// Play: stillness opens room; pick palm-line card; wrong = curtain
// Depth = rooms cleared
// Death: wrong_band / broke_still / timeout
// finishRun({ gameId:"palmfog", depth, score, deathReason:"wrong_band"|"broke_still"|"timeout" })
// bestDepth.palmfog = Room
```
**Don'ts:** fate-shame / “you’re cursed” copy · medical / real psychic framing · skip stillness gate · clone ageguess decade cards

---

## sanddig — Custom · Alley Sand Dig
```js
PF.runKit.declare("sanddig", {
  engine: "Custom", // TimingTap scoop + GreedFloor cash-out; sand nudge cheat visible
  displayName: "Alley Sand Dig",
  depthUnit: "Dig",
  sheet: "GOBLIN_BATCH25_BUILD_SHEETS.md",
});

function sanddigStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Teach Dig" : n === 2 ? "Near Tag" : n === 3 ? "Sand Nudge" : n === 4 ? "Wet Clump" : "Dig Storm",
    needTags: n === 1 ? 2 : n === 2 ? 3 : n === 3 ? 3 : n === 4 ? 4 : 4 + Math.floor(t / 2),
    scoops: n < 3 ? 5 : 6,
    cellMax: 1,
    nearGap: n < 4 ? 1 : 2,
    cheatBump: n === 1 ? 0 : n === 2 ? 1 : n === 3 ? 1 : n === 4 ? 2 : 2 + t,
    graceNearFree: n === 1 ? 1 : 0,
    canCashOut: true,
    sandRewriteVisible: true,
    wetClump: n >= 4,
  };
}
// Play: skill-scoop sand tray; placard bumps when close — classic dig-for-prize
// Depth = digs cleared
// Death: short_tags / sand_bump_bust / scoops_out / wet_clump
// finishRun({ gameId:"sanddig", depth, score, deathReason:"short_tags"|"sand_bump_bust"|"scoops_out"|"wet_clump", cashedOut })
// bestDepth.sanddig = Dig
```
**Don'ts:** hidden RNG win with no sand motion · real-money gambling copy · unreadable placard rewrite · live-animal dig · clone fascination / razzledazzle trough art

---

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: bucketball, fishscoop, wishwell, limbobar, palmfog, sanddig.
Door tag: `Depth run` only if engine mounted.

## finishRun quick hints
| gameId | depthUnit | typical deathReason |
|--------|-----------|---------------------|
| bucketball | Bucket | balls_out, lean_spit, rim_kiss, airball_streak |
| fishscoop | Pond | misses, melt_tear, reset_fail, early |
| wishwell | Floor | dud_streak, empty_bank, lip_kiss |
| limbobar | Dip | slipped, dipped, never_found |
| palmfog | Room | wrong_band, broke_still, timeout |
| sanddig | Dig | short_tags, sand_bump_bust, scoops_out, wet_clump |
