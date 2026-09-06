# Batch 02 mount configs — drop-in for Desktop Grok (align to runKit)
# LIVE 2026-09-05 GOBLIN REVIEW REDO — vendors/milk-bottles.js · water-gun-duel.js · cover-the-spot.js (Desktop Grok).
# No ping needed — pull when wiring Milk / Cover-the-Spot / Water Gun.
# engine declarations match GOBLIN_RUNKIT_API.md + GOBLIN_BATCH02_BUILD_SHEETS.md
# Style twin of GOBLIN_P0_MOUNT_CONFIGS.md

## milk — SlingAim (or Custom impulse) · Weighted Milk Bottles
# LIVE: vendors/milk-bottles.js (Desktop Grok desk). Glue Corner is the left heel (two-hit plan).
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
# Authored SPOT rooms (GOBLIN_AUTHORED_LEVELS_P0.md). NOT pure stageParams climb.
# LIVE: vendors/cover-the-spot.js (Desktop Grok desk, GOBLIN REVIEW REDO 2026-09-05). Tight Felt is the one allowed ratio-bridge.
```js
PF.runKit.declare("coverspot", {
  engine: "GreedFloor",
  displayName: "Cover-the-Spot Cruel",
  depthUnit: "Spot",
  sheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
  batchSheet: "GOBLIN_BATCH02_BUILD_SHEETS.md",
  cashOut: true, // between stages only (optional bank)
  codaEnabled: true, // hybrid: 7 authored rooms then optional ENDLESS
  authoredCount: 7,
});

const COVER_LEVELS = [
  { id:1, name:"Red Circle Honest", kind:"circle", ratio:0.72, targetPct:70, maxDiscs:4, drift:"none" },
  { id:2, name:"Tight Felt", kind:"circle", ratio:0.68, targetPct:75, maxDiscs:4, drift:"none" }, // ratio-bridge only
  { id:3, name:"Oval Blush", kind:"oval", ovalW:1.3, ratio:0.70, targetPct:72, maxDiscs:5 },
  { id:4, name:"Drifting Dot", kind:"drift", ratio:0.70, targetPct:74, maxDiscs:5, drift:"slow" },
  { id:5, name:"Twin Spots", kind:"twin", ratio:0.72, targetPct:70, maxDiscs:5, twinSep:64, twinR:46 },
  { id:6, name:"Ring Spot", kind:"ring", ratio:0.56, targetPct:72, maxDiscs:5, innerRatio:0.48 },
  { id:7, name:"Jitter Stamp", kind:"blob", ratio:0.72, targetPct:85, maxDiscs:6, drift:"jitter" },
];
function coverspotCodaParams(n) {
  const t = n - 7;
  return { id:n, name:`Felt Greed ${n}`, kind:"blob", coda:true,
    ratio: Math.max(0.42, 0.56 - 0.02 * t), targetPct: Math.min(94, 85 + t),
    maxDiscs:6, drift:"jitter" };
}
function coverspotStageParams(n) {
  if (n <= 7) return COVER_LEVELS[n - 1];
  if (!codaEnabled) return null; // souvenirClear
  return coverspotCodaParams(n);
}
// Scoring: floor(coverage*100) per clear + 200*stage
// Depth = spots cleared (HUD: SPOT {n} · {name} ; coda labeled ENDLESS)
// Death: coverage < targetPct after maxDiscs · 2 table misses
// Twin: BOTH circles must hit targetPct (split attention — not average cheese)
// Drift: discs stick in world space; live coverage can clear (lead the walk)
// Ring: annulus only; center hole is a trap
// Cash out between stages = cashedOut:true finishRun (depth kept)
// finishRun({ gameId:"coverspot", depth, score, deathReason:"bust"|"miss_table"|"souvenir", cashedOut })
// bestDepth.coverspot = Spot
// Challenge: Beat my Cover-the-Spot stage {n} on Penny Fever
```
**Don’ts:** true RNG win on first disc · unreadable % meter · same circle + smaller r/R as the *only* progression (Tight Felt is the one allowed bridge)

---

## watergun — Custom (hold-spray) / TimingTap cousin · Water Gun Duel
# LIVE: vendors/water-gun-duel.js (Desktop Grok desk). Zigzag aim is 2D; stall counts while ghost advances.
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
// Death: ghost wins heat | stall (no hit while ghost advances) past stallLimitMs
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
| coverspot | Spot | bust, miss_table, souvenir |
| watergun | Heat | ghost_win, stall, souvenir |
