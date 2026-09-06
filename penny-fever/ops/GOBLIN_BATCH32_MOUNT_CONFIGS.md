# Batch 32 mount configs — drop-in for Desktop Grok (align to runKit)
# No ping needed — pull when wiring Soft Peg Toss / Banjo Beat / Balloon String Hold / Trinket Shelf / Moon Veil / Bead Gate.
# engine declarations match GOBLIN_BATCH32_BUILD_SHEETS.md (quiet drop; NEW vendors not in batches 01–27)
# Style twin of GOBLIN_BATCH27_MOUNT_CONFIGS.md / GOBLIN_BATCH26_MOUNT_CONFIGS.md

## softpeg — SlingAim · Soft Peg Toss
```js
PF.runKit.declare("softpeg", {
  engine: "SlingAim", // hole spit soft-peg cheat — ≠ lidtoss / capseat / tincansoft
  displayName: "Soft Peg Toss",
  depthUnit: "Peg",
  sheet: "GOBLIN_BATCH32_BUILD_SHEETS.md",
});

function softpegStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Hole" : n === 3 ? "Hole Spit" : n === 4 ? "Soft Kiss" : "Peg Storm",
    need: n === 1 ? 2 : n === 2 ? 3 : n === 3 ? 3 : n === 4 ? 4 : 4 + Math.floor(t / 2),
    holeScale: n === 1 ? 1.0 : n === 2 ? 0.94 : n === 3 ? 0.9 : n === 4 ? 0.86 : Math.max(0.7, 0.86 - 0.02 * t),
    holeSpit: n === 1 ? "no" : n === 2 ? "soft" : n < 5 ? "yes" : "hard",
    holeSpitPct: n === 1 ? 0 : n === 2 ? 8 : n === 3 ? 14 : n === 4 ? 18 : Math.min(30, 18 + 2 * t),
    pegs: n < 4 ? 5 : 6,
    boardWobble: n < 3 ? 0 : n === 3 ? "low" : n === 4 ? "mid" : "high",
    missesToDeath: n === 1 ? 4 : n < 5 ? 3 : 2,
  };
}
// Play: drag-aim soft pegs; hole spit is the cheat
// Depth = pegs cleared
// Death: pegs out / hole spit / airball streak
// finishRun({ gameId:"softpeg", depth, score, deathReason:"pegs_out"|"hole_spit"|"airball_streak" })
// bestDepth.softpeg = Peg
```
**Don'ts:** fair sticky holes forever · magnet auto-seat · ignore holeSpit late · clone lidtoss / capseat / canalley / tincansoft 1:1

---

## banjobeat — TimingTap · Banjo Beat Timing
```js
PF.runKit.declare("banjobeat", {
  engine: "TimingTap", // true strum window lies late after painted fret mark
  displayName: "Banjo Beat Timing",
  depthUnit: "Beat",
  sheet: "GOBLIN_BATCH32_BUILD_SHEETS.md",
});

function banjobeatStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Teach Strum" : n === 2 ? "Mid Neck" : n === 3 ? "Late Lie" : n === 4 ? "Thin Fret" : "Beat Storm",
    need: n === 1 ? 3 : n === 2 ? 4 : n === 3 ? 5 : n === 4 ? 6 : 6 + t,
    windowMs: n === 1 ? 180 : n === 2 ? 155 : n === 3 ? 135 : n === 4 ? 115 : Math.max(70, 115 - 5 * t),
    pulseMs: n === 1 ? 900 : n === 2 ? 820 : n === 3 ? 740 : n === 4 ? 660 : Math.max(420, 660 - 25 * t),
    lateLieMs: n === 1 ? 0 : n === 2 ? 40 : n === 3 ? 80 : n === 4 ? 110 : Math.min(180, 110 + 10 * t),
    resetMs: n === 1 ? 14000 : n === 2 ? 13000 : n === 3 ? 12000 : n === 4 ? 11000 : Math.max(8000, 11000 - 200 * t),
    missesToDeath: n < 4 ? 3 : 2,
  };
}
// Play: tap STRUM on true late window; skip painted early mark
// Depth = beat stages cleared
// Death: misses / early_paint / reset_fail / late_miss
// finishRun({ gameId:"banjobeat", depth, score, deathReason:"misses"|"early_paint"|"reset_fail"|"late_miss" })
// bestDepth.banjobeat = Beat
```
**Don'ts:** auto-strum on proximity · credit painted early mark · window never tightens · clone clappulse / ribbonsnip / candycut / shootstar 1:1

---

## balloonhold — HoldBand · Balloon String Hold
```js
PF.runKit.declare("balloonhold", {
  engine: "HoldBand", // tug snap yanks sweet band near finish — ≠ ropeband / eggspoon / limbobar
  displayName: "Balloon String Hold",
  depthUnit: "Hold",
  sheet: "GOBLIN_BATCH32_BUILD_SHEETS.md",
});

function balloonholdStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Hold" : n === 3 ? "Tug Snap" : n === 4 ? "Thin String" : "Hold Storm",
    bandW: n === 1 ? 0.3 : n === 2 ? 0.24 : n === 3 ? 0.18 : n === 4 ? 0.14 : Math.max(0.08, 0.14 - 0.01 * t),
    tugSnap: n < 3 ? 0 : n === 3 ? "low" : n === 4 ? "mid" : "high",
    outLimitMs: n === 1 ? 900 : n === 2 ? 800 : n === 3 ? 700 : n === 4 ? 600 : 500,
    clearMs: n === 1 ? 1800 : n === 2 ? 2000 : n === 3 ? 2200 : n === 4 ? 2400 : 2600,
    slipLimit: n === 1 ? 3 : 2,
    snapAtProgress: 0.7, // tug snaps when seat > 70%
  };
}
// Play: hold force in sweet band; seat balloon past finish mark
// Depth = holds won
// Death: slipped / tug_snap / never_found
// finishRun({ gameId:"balloonhold", depth, score, deathReason:"slipped"|"tug_snap"|"never_found" })
// bestDepth.balloonhold = Hold
```
**Don'ts:** auto-hold button · Love-heat / limbobar / ropeband / eggspoon copy · ignore tug snap late · real balloon spend framing

---

## trinketpush — GreedFloor · Trinket Shelf Push
```js
PF.runKit.declare("trinketpush", {
  engine: "GreedFloor", // shelf breath — trinket push greed + cashOut (≠ jarpush / tokenrail / chippusher)
  displayName: "Trinket Shelf Push",
  depthUnit: "Floor",
  sheet: "GOBLIN_BATCH32_BUILD_SHEETS.md",
  cashOut: true,
});

function trinketpushStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Chalk Lip" : n === 2 ? "Soft Shelf" : n === 3 ? "Breath Edge" : n === 4 ? "Wobble Shelf" : "Breath + Distractor",
    pushes: n === 1 ? 8 : n === 2 ? 10 : n === 3 ? 10 : n === 4 ? 12 : 14,
    rarePct: n === 1 ? 16 : n === 2 ? 12 : n === 3 ? 10 : n === 4 ? 8 : 6,
    breathStreakDeath: n === 1 ? 0 : n < 4 ? 3 : 2, // 0 = no streak death on floor 1
    pushesToClear: n < 3 ? 3 : n < 5 ? 4 : 5,
    shelfBreath: true,
    lipTell: n === 1 ? "chalk" : "ridge",
    shelfWobble: n < 2 ? 0 : n < 4 ? "low" : n === 4 ? "mid" : "high",
    distractor: n >= 5,
    canCashOut: true,
  };
}
// Play: nudge trinkets; cash out or again; shelf breath is the cheat
// Depth = floors survived
// Death: breath streak / empty bank / shelf breath
// finishRun({ gameId:"trinketpush", depth, score, deathReason:"breath_streak"|"empty_bank"|"shelf_breath", cashedOut })
// bestDepth.trinketpush = Floor
```
**Don'ts:** fair frictionless shelf forever · hide breath with no tell · no CASH OUT button · real-money / casino shelf copy · clone jarpush / tokenrail / chippusher 1:1

---

## moonveil — OracleRooms · Moon Veil Pick
```js
PF.runKit.declare("moonveil", {
  engine: "OracleRooms", // stillness then moon pick — twin fib veils swap stage 3+
  displayName: "Moon Veil Pick",
  depthUnit: "Veil",
  sheet: "GOBLIN_BATCH32_BUILD_SHEETS.md",
});

function moonveilStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Curtain" : n === 3 ? "Twin Fib" : n === 4 ? "Four Moons" : "Veil Storm",
    waitMs: n === 1 ? 1200 : n === 2 ? 1400 : n === 3 ? 1600 : n === 4 ? 1800 : Math.min(2400, 1800 + 80 * t),
    breakLimitMs: n === 1 ? 4000 : n === 2 ? 3800 : n === 3 ? 3500 : n === 4 ? 3200 : Math.max(2200, 3200 - 100 * t),
    veils: n < 4 ? 3 : n === 4 ? 4 : 4 + (t % 2),
    fibCount: n < 3 ? 1 : 2,
    twinSwap: n >= 3,
    feint: n >= 5,
    pickWindowMs: n === 1 ? 5000 : n === 2 ? 4500 : n === 3 ? 4000 : n === 4 ? 3500 : Math.max(2200, 3500 - 100 * t),
    copyTone: "soft_cute", // playful moon — no destiny-romance / medical
  };
}
// Play: stillness opens room; pick true moon veil; fib/swap = curtain
// Depth = veils cleared
// Death: wrong_veil / broke_still / timeout / fib_swap
// finishRun({ gameId:"moonveil", depth, score, deathReason:"wrong_veil"|"broke_still"|"timeout"|"fib_swap" })
// bestDepth.moonveil = Veil
```
**Don'ts:** destiny-romance / medical copy · skip stillness gate · always-fair single veil · shame / curse framing · clone colourveil / tealeaf / fortunedoors 1:1

---

## beadgate — Custom · Bead Gate Drop
```js
PF.runKit.declare("beadgate", {
  engine: "Custom", // tap-nudge bead; gate tip near clear — ≠ tiltdrop / marblemaze / cupstack
  displayName: "Bead Gate Drop",
  depthUnit: "Gate",
  sheet: "GOBLIN_BATCH32_BUILD_SHEETS.md",
});

function beadgateStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Path" : n === 3 ? "Tip Breath" : n === 4 ? "Thin Gate" : "Gate Storm",
    needGates: n === 1 ? 4 : n === 2 ? 5 : n === 3 ? 6 : n === 4 ? 7 : 7 + t,
    timeBudgetMs: n === 1 ? 22000 : n === 2 ? 20000 : n === 3 ? 18000 : n === 4 ? 16000 : Math.max(10000, 16000 - 400 * t),
    gateTip: n < 3 ? false : n === 3 ? "low" : n === 4 ? "mid" : "high",
    spillLimit: n === 1 ? 3 : 2,
    beadSoft: n < 3 ? "soft" : n < 5 ? "mid" : "hard",
    nudgeWindowMs: n === 1 ? 4000 : n === 2 ? 3500 : n === 3 ? 3000 : n === 4 ? 2800 : Math.max(1800, 2800 - 80 * t),
    tipAtProgress: 0.75,
  };
}
// Play: tap-nudge soft bead; gate tip near clear
// Depth = gates cleared
// Death: timeout / spill / gate_tip / beads_out
// finishRun({ gameId:"beadgate", depth, score, deathReason:"timeout"|"spill"|"gate_tip"|"beads_out" })
// bestDepth.beadgate = Gate
```
**Don'ts:** auto-nudge solve · fair gates with no tip tell · clone tiltdrop / marblemaze / railroll / plinkoskill / cupstack 1:1 · soft-lock without spill death

---

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: softpeg, banjobeat, balloonhold, trinketpush, moonveil, beadgate.
Door tag: `Depth run` only if engine mounted.

## finishRun quick hints
| gameId | depthUnit | typical deathReason |
|--------|-----------|---------------------|
| softpeg | Peg | pegs_out, hole_spit, airball_streak |
| banjobeat | Beat | misses, early_paint, reset_fail, late_miss |
| balloonhold | Hold | slipped, tug_snap, never_found |
| trinketpush | Floor | breath_streak, empty_bank, shelf_breath (+ cashedOut) |
| moonveil | Veil | wrong_veil, broke_still, timeout, fib_swap |
| beadgate | Gate | timeout, spill, gate_tip, beads_out |

## Wiring notes (Desktop Grok)
- Import after Batch27 mounts; declare() must not collide with existing gameIds.
- stageParams(n) is 1-indexed stage/floor; t = n - 1 for storm formulas.
- GreedFloor trinketpush requires visible CASH OUT when canCashOut.
- OracleRooms moonveil uses soft_cute copyTone only.
- Custom beadgate must still emit finishRun-compatible RunResult.
- Routes: `#cabinet/{gameId}` · `#cabinet/{gameId}/play` · `#cabinet/{gameId}/result`
- Persistence keys: bestDepth.* / lastRun.* per gameId above.
- Fever: optional feverNode later; sheets stay coin=1 until then.
- HUD: depth unit label from depthUnit; death pip reasons from deathReason enums.
- Alley door placard: displayName + Depth run tag only when /play mounted.
- Accept: each stage 1 teachable ~10s; cheat tell visible in vestibule prop.
- Anti-dupe: not in batches 01–27 — softpeg · banjobeat · balloonhold · trinketpush · moonveil · beadgate.
- Sister files: GOBLIN_BATCH32_BUILD_SHEETS.md · GOBLIN_BATCH32_AURA_LINES.md
- Engine kit: SlingAim / TimingTap / HoldBand / GreedFloor / OracleRooms / Custom from GOBLIN_BATCH10_SHARED_ENGINE_KIT.md
- Score hooks: reportDepth on clear; finishRun on death or cash-out.
- Mobile: one pointer; no hover-only hits; large tap targets on STRUM / CASH OUT / veil cards.
- Result share: challenge templates in aura lines; depth integer only.
- Do not ship teaser delight once engine play exists for these six.
- Reserved collisions explicitly avoided: bottlehook whistlepop sandpour ticketclaw mirrorlot railroll · bucketball fishscoop wishwell limbobar palmfog sanddig · lidtoss ribbonsnip eggspoon tokenrail colourveil cupstack · ringlean bellhammer cottonwind chippusher fortunedoors marblemaze · capseat clappulse ropeband jarpush tealeaf tiltdrop.

## stageParams smoke (n=1..5 titles)
| gameId | n1 | n2 | n3 | n4 | n5+ |
|--------|----|----|----|----|-----|
| softpeg | Soft Teach | Mid Hole | Hole Spit | Soft Kiss | Peg Storm |
| banjobeat | Teach Strum | Mid Neck | Late Lie | Thin Fret | Beat Storm |
| balloonhold | Soft Teach | Mid Hold | Tug Snap | Thin String | Hold Storm |
| trinketpush | Chalk Lip | Soft Shelf | Breath Edge | Wobble Shelf | Breath + Distractor |
| moonveil | Soft Teach | Mid Curtain | Twin Fib | Four Moons | Veil Storm |
| beadgate | Soft Teach | Mid Path | Tip Breath | Thin Gate | Gate Storm |

## Mount accept (wiring)
1. softpegStageParams(3).holeSpit === "yes" && holeSpitPct === 14
2. banjobeatStageParams(3).lateLieMs === 80
3. balloonholdStageParams(3).tugSnap === "low" && snapAtProgress === 0.7
4. trinketpushStageParams(1).breathStreakDeath === 0 && canCashOut === true
5. moonveilStageParams(3).twinSwap === true && copyTone === "soft_cute"
6. beadgateStageParams(3).gateTip === "low" && tipAtProgress === 0.75
