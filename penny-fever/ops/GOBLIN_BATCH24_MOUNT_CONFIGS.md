# Batch 24 mount configs — drop-in for Desktop Grok (align to runKit)
# No ping needed — pull when wiring Bent Ring Soft Return / Bell Hammer / Cotton Candy Wind / Chip Pusher / Fortune Doors / Marble Maze.
# engine declarations match GOBLIN_BATCH24_BUILD_SHEETS.md (quiet drop; NEW vendors not in batches 01–23)
# Style twin of GOBLIN_BATCH22_MOUNT_CONFIGS.md / GOBLIN_BATCH02_MOUNT_CONFIGS.md

## ringlean — SlingAim · Bent Ring Soft Return
```js
PF.runKit.declare("ringlean", {
  engine: "SlingAim", // peg lean + soft-return spit — soft ring cheat (≠ bentring hard crate)
  displayName: "Bent Ring Soft Return",
  depthUnit: "Ring",
  sheet: "GOBLIN_BATCH24_BUILD_SHEETS.md",
});

function ringleanStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Neck" : n === 3 ? "Lean Away" : n === 4 ? "Soft Kiss" : "Ring Storm",
    need: n === 1 ? 2 : n === 2 ? 3 : n === 3 ? 3 : n === 4 ? 4 : 4 + Math.floor(t / 2),
    neckScale: n === 1 ? 1.0 : n === 2 ? 0.94 : n === 3 ? 0.9 : n === 4 ? 0.86 : Math.max(0.7, 0.86 - 0.02 * t),
    pegLean: n === 1 ? "no" : n === 2 ? "soft" : n < 5 ? "yes" : "hard",
    softReturnPct: n === 1 ? 0 : n === 2 ? 8 : n === 3 ? 14 : n === 4 ? 18 : Math.min(30, 18 + 2 * t),
    rings: n < 4 ? 5 : 6,
    standWobble: n < 3 ? 0 : n === 3 ? "low" : n === 4 ? "mid" : "high",
    missesToDeath: n === 1 ? 4 : n < 5 ? 3 : 2,
  };
}
// Play: drag-aim soft rings; peg lean + soft-return spit are the cheat
// Depth = rings cleared
// Death: rings out / soft return / airball streak
// finishRun({ gameId:"ringlean", depth, score, deathReason:"rings_out"|"soft_return"|"airball_streak" })
// bestDepth.ringlean = Ring
```
**Don'ts:** fair upright pegs forever · magnet auto-hang · ignore pegLean late · clone bentring crate 1:1

---

## bellhammer — TimingTap · Bell Hammer Timing
```js
PF.runKit.declare("bellhammer", {
  engine: "TimingTap", // true clang window lies late after painted mark
  displayName: "Bell Hammer Timing",
  depthUnit: "Strike",
  sheet: "GOBLIN_BATCH24_BUILD_SHEETS.md",
});

function bellhammerStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Teach Clang" : n === 2 ? "Mid Bell" : n === 3 ? "Late Lie" : n === 4 ? "Thin Clang" : "Bell Storm",
    need: n === 1 ? 3 : n === 2 ? 4 : n === 3 ? 5 : n === 4 ? 6 : 6 + t,
    windowMs: n === 1 ? 180 : n === 2 ? 155 : n === 3 ? 135 : n === 4 ? 115 : Math.max(70, 115 - 5 * t),
    pulseMs: n === 1 ? 900 : n === 2 ? 820 : n === 3 ? 740 : n === 4 ? 660 : Math.max(420, 660 - 25 * t),
    lateLieMs: n === 1 ? 0 : n === 2 ? 40 : n === 3 ? 80 : n === 4 ? 110 : Math.min(180, 110 + 10 * t),
    resetMs: n === 1 ? 14000 : n === 2 ? 13000 : n === 3 ? 12000 : n === 4 ? 11000 : Math.max(8000, 11000 - 200 * t),
    missesToDeath: n < 4 ? 3 : 2,
  };
}
// Play: tap STRIKE on true late window; skip painted early mark
// Depth = strike stages cleared
// Death: misses / early_paint / reset_fail / late_miss
// finishRun({ gameId:"bellhammer", depth, score, deathReason:"misses"|"early_paint"|"reset_fail"|"late_miss" })
// bestDepth.bellhammer = Strike
```
**Don'ts:** auto-clang on proximity · credit painted early mark · window never tightens · full highstriker tower clone

---

## cottonwind — HoldBand · Cotton Candy Wind
```js
PF.runKit.declare("cottonwind", {
  engine: "HoldBand", // wind snap yanks sweet band near seat — ≠ fairyfloss romance
  displayName: "Cotton Candy Wind",
  depthUnit: "Spool",
  sheet: "GOBLIN_BATCH24_BUILD_SHEETS.md",
});

function cottonwindStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Spool" : n === 3 ? "Gust Snap" : n === 4 ? "Thin Sugar" : "Wind Storm",
    bandW: n === 1 ? 0.3 : n === 2 ? 0.24 : n === 3 ? 0.18 : n === 4 ? 0.14 : Math.max(0.08, 0.14 - 0.01 * t),
    windSnap: n < 3 ? 0 : n === 3 ? "low" : n === 4 ? "mid" : "high",
    outLimitMs: n === 1 ? 900 : n === 2 ? 800 : n === 3 ? 700 : n === 4 ? 600 : 500,
    clearMs: n === 1 ? 1800 : n === 2 ? 2000 : n === 3 ? 2200 : n === 4 ? 2400 : 2600,
    slipLimit: n === 1 ? 3 : 2,
    snapAtProgress: 0.7, // wind snaps when seat > 70%
  };
}
// Play: hold force in sweet band; seat spool past cone mark
// Depth = spools won
// Death: slipped / wind_snap / never_found
// finishRun({ gameId:"cottonwind", depth, score, deathReason:"slipped"|"wind_snap"|"never_found" })
// bestDepth.cottonwind = Spool
```
**Don'ts:** auto-spin button · Love-heat / fairyfloss romance copy · ignore wind snap late · real sugar spend framing

---

## chippusher — GreedFloor · Chip Pusher Shelf
```js
PF.runKit.declare("chippusher", {
  engine: "GreedFloor", // shelf avalanche breath — chip pusher greed + cashOut
  displayName: "Chip Pusher Shelf",
  depthUnit: "Floor",
  sheet: "GOBLIN_BATCH24_BUILD_SHEETS.md",
  cashOut: true,
});

function chippusherStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Chalk Lip" : n === 2 ? "Soft Shelf" : n === 3 ? "Breath Edge" : n === 4 ? "Wobble Shelf" : "Avalanche + Distractor",
    pushes: n === 1 ? 8 : n === 2 ? 10 : n === 3 ? 10 : n === 4 ? 12 : 14,
    rarePct: n === 1 ? 16 : n === 2 ? 12 : n === 3 ? 10 : n === 4 ? 8 : 6,
    avalancheStreakDeath: n === 1 ? 0 : n < 4 ? 3 : 2, // 0 = no streak death on floor 1
    pushesToClear: n < 3 ? 3 : n < 5 ? 4 : 5,
    avalancheBreath: true,
    lipTell: n === 1 ? "chalk" : "ridge",
    shelfWobble: n < 2 ? 0 : n < 4 ? "low" : n === 4 ? "mid" : "high",
    distractor: n >= 5,
    canCashOut: true,
  };
}
// Play: nudge chips; cash out or again; shelf avalanche is the cheat
// Depth = floors survived
// Death: avalanche streak / empty bank / shelf breath
// finishRun({ gameId:"chippusher", depth, score, deathReason:"avalanche_streak"|"empty_bank"|"shelf_breath", cashedOut })
// bestDepth.chippusher = Floor
```
**Don'ts:** fair frictionless shelf forever · hide avalanche with no tell · no CASH OUT button · real-money / casino pusher copy

---

## fortunedoors — OracleRooms · Fortune Door Pick
```js
PF.runKit.declare("fortunedoors", {
  engine: "OracleRooms", // stillness then door pick — twin fib doors swap stage 3+
  displayName: "Fortune Door Pick",
  depthUnit: "Door",
  sheet: "GOBLIN_BATCH24_BUILD_SHEETS.md",
});

function fortunedoorsStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Curtain" : n === 3 ? "Twin Fib" : n === 4 ? "Four Frames" : "Door Storm",
    waitMs: n === 1 ? 1200 : n === 2 ? 1400 : n === 3 ? 1600 : n === 4 ? 1800 : Math.min(2400, 1800 + 80 * t),
    breakLimitMs: n === 1 ? 4000 : n === 2 ? 3800 : n === 3 ? 3500 : n === 4 ? 3200 : Math.max(2200, 3200 - 100 * t),
    doors: n < 4 ? 3 : n === 4 ? 4 : 4 + (t % 2),
    fibCount: n < 3 ? 1 : 2,
    twinSwap: n >= 3,
    feint: n >= 5,
    pickWindowMs: n === 1 ? 5000 : n === 2 ? 4500 : n === 3 ? 4000 : n === 4 ? 3500 : Math.max(2200, 3500 - 100 * t),
    copyTone: "soft_cute", // playful fortune — no destiny-romance / medical
  };
}
// Play: stillness opens room; pick true door; fib/swap = curtain
// Depth = doors cleared
// Death: wrong_door / broke_still / timeout / fib_swap
// finishRun({ gameId:"fortunedoors", depth, score, deathReason:"wrong_door"|"broke_still"|"timeout"|"fib_swap" })
// bestDepth.fortunedoors = Door
```
**Don'ts:** destiny-romance / medical copy · skip stillness gate · always-fair single door · shame / curse framing

---

## marblemaze — Custom · Marble Maze Trace
```js
PF.runKit.declare("marblemaze", {
  engine: "Custom", // drag-tilt path; wall nudge near exit — ≠ marblerun / midwaymaze
  displayName: "Marble Maze Trace",
  depthUnit: "Maze",
  sheet: "GOBLIN_BATCH24_BUILD_SHEETS.md",
});

function marblemazeStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Trace" : n === 3 ? "Wall Breath" : n === 4 ? "Thin Lane" : "Maze Storm",
    pathLen: n === 1 ? 6 : n === 2 ? 8 : n === 3 ? 9 : n === 4 ? 10 : 10 + t,
    timeBudgetMs: n === 1 ? 22000 : n === 2 ? 20000 : n === 3 ? 18000 : n === 4 ? 16000 : Math.max(10000, 16000 - 400 * t),
    wallNudge: n < 3 ? false : n === 3 ? "low" : n === 4 ? "mid" : "high",
    holeCount: n === 1 ? 1 : n < 4 ? 2 : n === 4 ? 3 : 3 + Math.floor(t / 2),
    corridorW: n === 1 ? 1.0 : n === 2 ? 0.92 : n === 3 ? 0.86 : n === 4 ? 0.8 : Math.max(0.62, 0.8 - 0.02 * t),
    stuckLimitMs: n === 1 ? 4000 : n === 2 ? 3500 : n === 3 ? 3000 : n === 4 ? 2800 : Math.max(1800, 2800 - 80 * t),
    nudgeAtProgress: 0.75,
  };
}
// Play: drag-tilt marble to exit; walls nudge near clear
// Depth = mazes cleared
// Death: timeout / hole_fall / wall_nudge / stuck
// finishRun({ gameId:"marblemaze", depth, score, deathReason:"timeout"|"hole_fall"|"wall_nudge"|"stuck" })
// bestDepth.marblemaze = Maze
```
**Don'ts:** auto-path solve · fair walls with no nudge tell · clone marblerun / midwaymaze 1:1 · soft-lock without stuck death

---

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: ringlean, bellhammer, cottonwind, chippusher, fortunedoors, marblemaze.
Door tag: `Depth run` only if engine mounted.

## finishRun quick hints
| gameId | depthUnit | typical deathReason |
|--------|-----------|---------------------|
| ringlean | Ring | rings_out, soft_return, airball_streak |
| bellhammer | Strike | misses, early_paint, reset_fail, late_miss |
| cottonwind | Spool | slipped, wind_snap, never_found |
| chippusher | Floor | avalanche_streak, empty_bank, shelf_breath (+ cashedOut) |
| fortunedoors | Door | wrong_door, broke_still, timeout, fib_swap |
| marblemaze | Maze | timeout, hole_fall, wall_nudge, stuck |
