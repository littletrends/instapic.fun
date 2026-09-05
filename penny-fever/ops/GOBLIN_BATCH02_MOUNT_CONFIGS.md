# Batch 02 mount configs — drop-in for Desktop Grok (align to runKit)
# No ping needed — pull when wiring Milk / Cover-the-Spot / Water Gun.
# engine declarations match GOBLIN_RUNKIT_API.md + GOBLIN_BATCH02_BUILD_SHEETS.md
# Style twin of GOBLIN_P0_MOUNT_CONFIGS.md

## milk — SlingAim (or Custom impulse) · Weighted Milk Bottles
# Authored PYRAMID rooms (GOBLIN_AUTHORED_LEVELS_P0.md). NOT pure stageParams climb.
```js
PF.runKit.declare("milk", {
  engine: "SlingAim", // Custom impulse OK if shared Ball Toss launcher diverges
  displayName: "Weighted Milk Bottles",
  depthUnit: "Pyramid",
  sheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
  batchSheet: "GOBLIN_BATCH02_BUILD_SHEETS.md",
  codaEnabled: true, // hybrid: 7 authored rooms then optional ENDLESS
  authoredCount: 7,
});

const MILK_LEVELS = [
  { id:1, name:"Fairground Six", kind:"classic", layout:"3-2-1", bottomMass:2.0, pinSpacing:"wide" },
  { id:2, name:"Heavy Heels", kind:"heavyHeels", layout:"3-2-1", bottomMass:2.6, topMass:0.82 },
  { id:3, name:"Wide Shoulders", kind:"wideShoulders", layout:"4-3-2-1", midMass:1.7 },
  { id:4, name:"Glue Corner", kind:"glueCorner", layout:"3-2-1", glueBottomCorner:true },
  { id:5, name:"Split Stack", kind:"splitStack", layout:"3+3", stacks:2 },
  { id:6, name:"Wind Shelf", kind:"windShelf", layout:"3-2-1", windDrift:0.26, pinSpacing:"tight" },
  { id:7, name:"Stuck Pin Atelier", kind:"stuckPin", layout:"3-2-1", stuckBottle:true, bottomMass:3.2 },
];
function milkCodaParams(n) {
  const t = n - 7;
  return { id:n, name:`Concrete Row ${n}`, kind:"coda", coda:true, layout:"3-2-1",
    bottomMass: Math.min(4.2, 3.2 + 0.15 * t), stuckBottle:true, pinSpacing:"tight",
    windDrift: Math.min(0.42, 0.18 + t * 0.04) };
}
function milkLevel(n) {
  if (n <= 7) return MILK_LEVELS[n - 1];
  if (!codaEnabled) return null; // souvenirClear
  return milkCodaParams(n);
}
// Scoring: +50/bottle +400 pyramid clear +80*stage
// Depth = pyramids cleared
// Death: throws exhausted / incomplete pyramid
// After authored 7: codaEnabled → ENDLESS Concrete Row {n} else souvenir
// finishRun({ gameId:"milk", depth, score, deathReason:"throws"|"incomplete"|"souvenir" })
// bestDepth.milk = Pyramid
// HUD: PYRAMID {n} · {name} ; coda labeled ENDLESS
```
**Don’ts:** equal mass bottles · forever auto-strike tutorial · same 3–2–1 with only heavier bottoms as the *only* progression

---

## coverspot — GreedFloor · Cover-the-Spot Cruel
```js
PF.runKit.declare("coverspot", {
  engine: "GreedFloor",
  displayName: "Cover-the-Spot Cruel",
  depthUnit: "Stage",
  sheet: "GOBLIN_BATCH02_BUILD_SHEETS.md",
  cashOut: true, // between stages only (optional bank)
});

function coverspotStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Almost Fits" : n < 4 ? "Felt Lie" : n < 6 ? "Drift Spot" : "Greedy 94",
    // r/R — disc never covers alone at stage 1
    ratio: n === 1 ? 0.72 : n === 2 ? 0.68 : n === 3 ? 0.64 : n === 4 ? 0.60 : n === 5 ? 0.56 : Math.max(0.42, 0.56 - 0.02 * t),
    targetPct: n === 1 ? 70 : n === 2 ? 75 : n === 3 ? 78 : n === 4 ? 82 : n === 5 ? 85 : Math.min(94, 85 + t),
    maxDiscs: n < 3 ? 4 : n < 6 ? 5 : 6,
    spotDrift: n < 3 ? "none" : n < 4 ? "slow" : n < 6 ? "plus" : "jitter",
    gridStamp: 64, // coverage approx
    deathOnFailTarget: true, // fail targetPct within maxDiscs → DEATH
  };
}
// Scoring: floor(coverage*100) per clear + 200*stage
// Depth = stages cleared
// Death: coverage < targetPct after maxDiscs
// Cash out between stages = cashedOut:true finishRun (depth kept)
// finishRun({ gameId:"coverspot", depth, score, deathReason:"bust"|"miss_table", cashedOut })
// bestDepth.coverspot = Stage
```
**Don’ts:** true RNG win on first disc · unreadable % meter

---

## watergun — Custom (hold-spray) / TimingTap cousin · Water Gun Duel
# Authored HEAT rooms (GOBLIN_AUTHORED_LEVELS_P0.md). NOT pure stageParams climb.
```js
PF.runKit.declare("watergun", {
  engine: "Custom", // hold-spray; TimingTap cousin — not spray-anywhere
  displayName: "Water Gun Duel",
  depthUnit: "Heat",
  sheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
  batchSheet: "GOBLIN_BATCH02_BUILD_SHEETS.md",
  codaEnabled: true, // hybrid: 7 authored maps then optional ENDLESS
  authoredCount: 7,
});

const WATER_LEVELS = [
  { id:1, name:"Lane Lesson", kind:"straight", path:"horizontal", hitbox:"big", ghostRate:0.55 },
  { id:2, name:"Sine Smile", kind:"sine", path:"sine", hitbox:"big", ghostRate:0.7 },
  { id:3, name:"Feint Clown", kind:"feint", path:"sine", hitbox:"mid", mouthFeints:true },
  { id:4, name:"Twin Mouth Map", kind:"twinMouth", path:"twin", twinMouths:true },
  { id:5, name:"Zigzag Duel", kind:"zigzag", path:"zigzag", hitbox:"small", yourRate:0.95, ghostRate:0.95 },
  { id:6, name:"Fake-Open Fair", kind:"fakeOpen", fakeOpenChance:0.2 },
  { id:7, name:"Mirror Lane", kind:"mirror", mirrorAim:true, mouthFeints:true, path:"sine" },
];
function waterCodaParams(n) {
  const t = n - 7;
  return { id:n, name:`Inferno Lane ${n}`, kind:"coda", coda:true, path:"sine",
    mouthSpeed: Math.min(1.8, 1.05 + 0.1 * t), ghostRate: 1.05 + 0.05 * t,
    fakeOpenChance:0.2, mouthFeints:true, hitbox:"small" };
}
function waterLevel(n) {
  if (n <= 7) return WATER_LEVELS[n - 1];
  if (!codaEnabled) return null; // souvenirClear
  return waterCodaParams(n);
}
// Scoring: +300 per heat win + leftover fill advantage
// Depth = heats won
// Death: ghost wins heat | stall (0 hit time) past stallLimitMs
// After authored 7: codaEnabled → ENDLESS Inferno Lane {n} else souvenir
// finishRun({ gameId:"watergun", depth, score, deathReason:"ghost_win"|"stall"|"souvenir" })
// bestDepth.watergun = Heat
// HUD: HEAT {n} · {name} ; coda labeled ENDLESS
// Lane B = ghost v1; real 2P later (same fill rules, no ghost)
```
**Don’ts:** spray-anywhere auto fill · instant heat without tracking · same wander + slightly faster ghost as the *only* progression

---

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: milk, coverspot, watergun.
Door tag: `Depth run` only if engine mounted.

## finishRun quick hints
| gameId | depthUnit | typical deathReason |
|--------|-----------|---------------------|
| milk | Pyramid | throws, incomplete, souvenir |
| coverspot | Stage | bust, miss_table |
| watergun | Heat | ghost_win, stall, souvenir |
