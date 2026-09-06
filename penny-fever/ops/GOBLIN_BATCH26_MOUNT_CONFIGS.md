# Batch 26 mount configs — drop-in for Desktop Grok (align to runKit)
# No ping needed — pull when wiring Soft Bottle Cap Seat / Clapper Pulse / Soft Rope Band / Prize Jar Push / Tea Leaf / Tilt Drop.
# engine declarations match GOBLIN_BATCH26_BUILD_SHEETS.md (quiet drop; NEW vendors not in batches 01–25)
# Style twin of GOBLIN_BATCH25_MOUNT_CONFIGS.md / GOBLIN_BATCH24_MOUNT_CONFIGS.md
# Avoids bottlehook B23 · bucketball/lidtoss B25 · ringlean B24 — all existing RUNKIT gameIds reserved.

## capseat — SlingAim · Soft Bottle Cap Seat
```js
PF.runKit.declare("capseat", {
  engine: "SlingAim", // mouth spit soft-cap cheat — ≠ lidtoss / bottlehook
  displayName: "Soft Bottle Cap Seat",
  depthUnit: "Cap",
  sheet: "GOBLIN_BATCH26_BUILD_SHEETS.md",
});

function capseatStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Mouth" : n === 3 ? "Mouth Spit" : n === 4 ? "Soft Kiss" : "Cap Storm",
    need: n === 1 ? 2 : n === 2 ? 3 : n === 3 ? 3 : n === 4 ? 4 : 4 + Math.floor(t / 2),
    mouthScale: n === 1 ? 1.0 : n === 2 ? 0.94 : n === 3 ? 0.9 : n === 4 ? 0.86 : Math.max(0.7, 0.86 - 0.02 * t),
    mouthSpit: n === 1 ? "no" : n === 2 ? "soft" : n < 5 ? "yes" : "hard",
    mouthSpitPct: n === 1 ? 0 : n === 2 ? 8 : n === 3 ? 14 : n === 4 ? 18 : Math.min(30, 18 + 2 * t),
    caps: n < 4 ? 5 : 6,
    standWobble: n < 3 ? 0 : n === 3 ? "low" : n === 4 ? "mid" : "high",
    missesToDeath: n === 1 ? 4 : n < 5 ? 3 : 2,
  };
}
// Play: drag-aim soft caps; mouth spit is the cheat
// Depth = caps cleared
// Death: caps out / mouth spit / airball streak
// finishRun({ gameId:"capseat", depth, score, deathReason:"caps_out"|"mouth_spit"|"airball_streak" })
// bestDepth.capseat = Cap
```
**Don'ts:** fair sticky mouths forever · magnet auto-seat · ignore mouthSpit late · clone lidtoss / bottlehook / tincansoft 1:1

---

## clappulse — TimingTap · Clapper Pulse Timing
```js
PF.runKit.declare("clappulse", {
  engine: "TimingTap", // true clap window lies late after painted mark
  displayName: "Clapper Pulse Timing",
  depthUnit: "Clap",
  sheet: "GOBLIN_BATCH26_BUILD_SHEETS.md",
});

function clappulseStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Teach Clap" : n === 2 ? "Mid Pulse" : n === 3 ? "Late Lie" : n === 4 ? "Thin Clap" : "Clap Storm",
    need: n === 1 ? 3 : n === 2 ? 4 : n === 3 ? 5 : n === 4 ? 6 : 6 + t,
    windowMs: n === 1 ? 180 : n === 2 ? 155 : n === 3 ? 135 : n === 4 ? 115 : Math.max(70, 115 - 5 * t),
    pulseMs: n === 1 ? 900 : n === 2 ? 820 : n === 3 ? 740 : n === 4 ? 660 : Math.max(420, 660 - 25 * t),
    lateLieMs: n === 1 ? 0 : n === 2 ? 40 : n === 3 ? 80 : n === 4 ? 110 : Math.min(180, 110 + 10 * t),
    resetMs: n === 1 ? 14000 : n === 2 ? 13000 : n === 3 ? 12000 : n === 4 ? 11000 : Math.max(8000, 11000 - 200 * t),
    missesToDeath: n < 4 ? 3 : 2,
  };
}
// Play: tap CLAP on true late window; skip painted early mark
// Depth = clap stages cleared
// Death: misses / early_paint / reset_fail / late_miss
// finishRun({ gameId:"clappulse", depth, score, deathReason:"misses"|"early_paint"|"reset_fail"|"late_miss" })
// bestDepth.clappulse = Clap
```
**Don'ts:** auto-clap on proximity · credit painted early mark · window never tightens · clone bellhammer / whistlepop / ribbonsnip 1:1

---

## ropeband — HoldBand · Soft Rope Band Walk
```js
PF.runKit.declare("ropeband", {
  engine: "HoldBand", // sway snap yanks sweet band near finish — ≠ limbobar / eggspoon / cottonwind
  displayName: "Soft Rope Band Walk",
  depthUnit: "Walk",
  sheet: "GOBLIN_BATCH26_BUILD_SHEETS.md",
});

function ropebandStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Walk" : n === 3 ? "Sway Snap" : n === 4 ? "Thin Rope" : "Walk Storm",
    bandW: n === 1 ? 0.3 : n === 2 ? 0.24 : n === 3 ? 0.18 : n === 4 ? 0.14 : Math.max(0.08, 0.14 - 0.01 * t),
    swaySnap: n < 3 ? 0 : n === 3 ? "low" : n === 4 ? "mid" : "high",
    outLimitMs: n === 1 ? 900 : n === 2 ? 800 : n === 3 ? 700 : n === 4 ? 600 : 500,
    clearMs: n === 1 ? 1800 : n === 2 ? 2000 : n === 3 ? 2200 : n === 4 ? 2400 : 2600,
    slipLimit: n === 1 ? 3 : 2,
    snapAtProgress: 0.7, // sway snaps when seat > 70%
  };
}
// Play: hold force in sweet band; seat walker past finish mark
// Depth = walks won
// Death: slipped / sway_snap / never_found
// finishRun({ gameId:"ropeband", depth, score, deathReason:"slipped"|"sway_snap"|"never_found" })
// bestDepth.ropeband = Walk
```
**Don'ts:** auto-walk button · Love-heat / limbobar / eggspoon / cottonwind / tugband copy · ignore sway snap late · real rope fall framing

---

## jarpush — GreedFloor · Prize Jar Push
```js
PF.runKit.declare("jarpush", {
  engine: "GreedFloor", // jar breath — token push greed + cashOut (≠ tokenrail / chippusher)
  displayName: "Prize Jar Push",
  depthUnit: "Floor",
  sheet: "GOBLIN_BATCH26_BUILD_SHEETS.md",
  cashOut: true,
});

function jarpushStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Chalk Lip" : n === 2 ? "Soft Jar" : n === 3 ? "Breath Edge" : n === 4 ? "Wobble Jar" : "Breath + Distractor",
    pushes: n === 1 ? 8 : n === 2 ? 10 : n === 3 ? 10 : n === 4 ? 12 : 14,
    rarePct: n === 1 ? 16 : n === 2 ? 12 : n === 3 ? 10 : n === 4 ? 8 : 6,
    breathStreakDeath: n === 1 ? 0 : n < 4 ? 3 : 2, // 0 = no streak death on floor 1
    pushesToClear: n < 3 ? 3 : n < 5 ? 4 : 5,
    jarBreath: true,
    lipTell: n === 1 ? "chalk" : "ridge",
    jarWobble: n < 2 ? 0 : n < 4 ? "low" : n === 4 ? "mid" : "high",
    distractor: n >= 5,
    canCashOut: true,
  };
}
// Play: nudge tokens; cash out or again; jar breath is the cheat
// Depth = floors survived
// Death: breath streak / empty bank / jar breath
// finishRun({ gameId:"jarpush", depth, score, deathReason:"breath_streak"|"empty_bank"|"jar_breath", cashedOut })
// bestDepth.jarpush = Floor
```
**Don'ts:** fair frictionless jar forever · hide breath with no tell · no CASH OUT button · real-money / casino jar copy · clone tokenrail / chippusher / ticketclaw 1:1

---

## tealeaf — OracleRooms · Tea Leaf Rooms
```js
PF.runKit.declare("tealeaf", {
  engine: "OracleRooms", // stillness then tea-leaf pick — twin fib cups swap stage 3+
  displayName: "Tea Leaf Rooms",
  depthUnit: "Leaf",
  sheet: "GOBLIN_BATCH26_BUILD_SHEETS.md",
});

function tealeafStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Steam" : n === 3 ? "Twin Fib" : n === 4 ? "Four Cups" : "Leaf Storm",
    waitMs: n === 1 ? 1200 : n === 2 ? 1400 : n === 3 ? 1600 : n === 4 ? 1800 : Math.min(2400, 1800 + 80 * t),
    breakLimitMs: n === 1 ? 4000 : n === 2 ? 3800 : n === 3 ? 3500 : n === 4 ? 3200 : Math.max(2200, 3200 - 100 * t),
    cups: n < 4 ? 3 : n === 4 ? 4 : 4 + (t % 2),
    fibCount: n < 3 ? 1 : 2,
    twinSwap: n >= 3,
    feint: n >= 5,
    pickWindowMs: n === 1 ? 5000 : n === 2 ? 4500 : n === 3 ? 4000 : n === 4 ? 3500 : Math.max(2200, 3500 - 100 * t),
    copyTone: "soft_cute", // playful tea — no destiny-romance / medical
  };
}
// Play: stillness opens room; pick true cup; fib/swap = steam curtain
// Depth = leaves cleared
// Death: wrong_cup / broke_still / timeout / fib_swap
// finishRun({ gameId:"tealeaf", depth, score, deathReason:"wrong_cup"|"broke_still"|"timeout"|"fib_swap" })
// bestDepth.tealeaf = Leaf
```
**Don'ts:** destiny-romance / medical copy · skip stillness gate · always-fair single cup · shame / curse framing · clone fortunedoors / colourveil / mirrorlot 1:1

---

## tiltdrop — Custom · Tilt Drop Board
```js
PF.runKit.declare("tiltdrop", {
  engine: "Custom", // tap-tilt board; tip near clear gate — ≠ marblemaze / railroll / cupstack
  displayName: "Tilt Drop Board",
  depthUnit: "Drop",
  sheet: "GOBLIN_BATCH26_BUILD_SHEETS.md",
});

function tiltdropStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Board" : n === 3 ? "Tilt Breath" : n === 4 ? "Thin Gate" : "Drop Storm",
    needGates: n === 1 ? 4 : n === 2 ? 5 : n === 3 ? 6 : n === 4 ? 7 : 7 + t,
    timeBudgetMs: n === 1 ? 22000 : n === 2 ? 20000 : n === 3 ? 18000 : n === 4 ? 16000 : Math.max(10000, 16000 - 400 * t),
    tiltTip: n < 3 ? false : n === 3 ? "low" : n === 4 ? "mid" : "high",
    spillLimit: n === 1 ? 3 : 2,
    ballSoft: n < 3 ? "soft" : n < 5 ? "mid" : "hard",
    tiltWindowMs: n === 1 ? 4000 : n === 2 ? 3500 : n === 3 ? 3000 : n === 4 ? 2800 : Math.max(1800, 2800 - 80 * t),
    tipAtProgress: 0.75,
  };
}
// Play: tap-tilt soft ball toward gates; tilt tip near clear
// Depth = drops cleared
// Death: timeout / spill / tilt_tip / balls_out
// finishRun({ gameId:"tiltdrop", depth, score, deathReason:"timeout"|"spill"|"tilt_tip"|"balls_out" })
// bestDepth.tiltdrop = Drop
```
**Don'ts:** auto-tilt solve · fair boards with no tilt tell · clone marblemaze / railroll / plinkoskill / cupstack 1:1 · soft-lock without spill death

---

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: capseat, clappulse, ropeband, jarpush, tealeaf, tiltdrop.
Door tag: `Depth run` only if engine mounted.

## finishRun quick hints
| gameId | depthUnit | typical deathReason |
|--------|-----------|---------------------|
| capseat | Cap | caps_out, mouth_spit, airball_streak |
| clappulse | Clap | misses, early_paint, reset_fail, late_miss |
| ropeband | Walk | slipped, sway_snap, never_found |
| jarpush | Floor | breath_streak, empty_bank, jar_breath (+ cashedOut) |
| tealeaf | Leaf | wrong_cup, broke_still, timeout, fib_swap |
| tiltdrop | Drop | timeout, spill, tilt_tip, balls_out |

## Wiring notes (Desktop Grok)
- Import after Batch25 mounts; declare() must not collide with existing gameIds.
- stageParams(n) is 1-indexed stage/floor; t = n - 1 for storm formulas.
- GreedFloor jarpush requires visible CASH OUT when canCashOut.
- OracleRooms tealeaf uses soft_cute copyTone only.
- Custom tiltdrop must still emit finishRun-compatible RunResult.
- Routes: `#cabinet/{gameId}` · `#cabinet/{gameId}/play` · `#cabinet/{gameId}/result`
- Persistence keys: bestDepth.* / lastRun.* per gameId above.
- Fever: optional feverNode later; sheets stay coin=1 until then.
- HUD: depth unit label from depthUnit; death pip reasons from deathReason enums.
- Alley door placard: displayName + Depth run tag only when /play mounted.
- Accept: each stage 1 teachable ~10s; cheat tell visible in vestibule prop.
- Anti-dupe: not in batches 01–25 — capseat · clappulse · ropeband · jarpush · tealeaf · tiltdrop.
- Sister files: GOBLIN_BATCH26_BUILD_SHEETS.md · GOBLIN_BATCH26_AURA_LINES.md
- Engine kit: SlingAim / TimingTap / HoldBand / GreedFloor / OracleRooms / Custom from GOBLIN_BATCH10_SHARED_ENGINE_KIT.md
- Score hooks: reportDepth on clear; finishRun on death or cash-out.
- Mobile: one pointer; no hover-only hits; large tap targets on CLAP / CASH OUT / cup cards.
- Result share: challenge templates in aura lines; depth integer only.
- Do not ship teaser delight once engine play exists for these six.
- Reserved collisions explicitly avoided: bottlehook whistlepop sandpour ticketclaw mirrorlot railroll · bucketball fishscoop wishwell limbobar palmfog sanddig · lidtoss ribbonsnip eggspoon tokenrail colourveil cupstack · ringlean bellhammer cottonwind chippusher fortunedoors marblemaze.
