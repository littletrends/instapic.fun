# Batch 27 mount configs — drop-in for Desktop Grok (align to runKit)
# No ping needed — pull when wiring Soft Lid Toss / Ribbon Snip / Egg Spoon Walk / Token Rail / Colour Veil / Soft Cup Stack.
# engine declarations match GOBLIN_BATCH27_BUILD_SHEETS.md (quiet drop; NEW vendors not in batches 01–24)
# Style twin of GOBLIN_BATCH24_MOUNT_CONFIGS.md / GOBLIN_BATCH22_MOUNT_CONFIGS.md

## lidtoss — SlingAim · Soft Lid Toss
```js
PF.runKit.declare("lidtoss", {
  engine: "SlingAim", // rim spit soft-lid cheat — ≠ tincansoft knock-down
  displayName: "Soft Lid Toss",
  depthUnit: "Lid",
  sheet: "GOBLIN_BATCH27_BUILD_SHEETS.md",
});

function lidtossStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Crown" : n === 3 ? "Rim Spit" : n === 4 ? "Soft Kiss" : "Lid Storm",
    need: n === 1 ? 2 : n === 2 ? 3 : n === 3 ? 3 : n === 4 ? 4 : 4 + Math.floor(t / 2),
    crownScale: n === 1 ? 1.0 : n === 2 ? 0.94 : n === 3 ? 0.9 : n === 4 ? 0.86 : Math.max(0.7, 0.86 - 0.02 * t),
    rimSpit: n === 1 ? "no" : n === 2 ? "soft" : n < 5 ? "yes" : "hard",
    rimSpitPct: n === 1 ? 0 : n === 2 ? 8 : n === 3 ? 14 : n === 4 ? 18 : Math.min(30, 18 + 2 * t),
    lids: n < 4 ? 5 : 6,
    standWobble: n < 3 ? 0 : n === 3 ? "low" : n === 4 ? "mid" : "high",
    missesToDeath: n === 1 ? 4 : n < 5 ? 3 : 2,
  };
}
// Play: drag-aim soft lids; rim spit is the cheat
// Depth = lids cleared
// Death: lids out / rim spit / airball streak
// finishRun({ gameId:"lidtoss", depth, score, deathReason:"lids_out"|"rim_spit"|"airball_streak" })
// bestDepth.lidtoss = Lid
```
**Don'ts:** fair sticky crowns forever · magnet auto-seat · ignore rimSpit late · clone tincansoft / canalley 1:1

---

## ribbonsnip — TimingTap · Ribbon Snip Timing
```js
PF.runKit.declare("ribbonsnip", {
  engine: "TimingTap", // true snip window lies late after painted mark
  displayName: "Ribbon Snip Timing",
  depthUnit: "Snip",
  sheet: "GOBLIN_BATCH27_BUILD_SHEETS.md",
});

function ribbonsnipStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Teach Snip" : n === 2 ? "Mid Ribbon" : n === 3 ? "Late Lie" : n === 4 ? "Thin Cut" : "Snip Storm",
    need: n === 1 ? 3 : n === 2 ? 4 : n === 3 ? 5 : n === 4 ? 6 : 6 + t,
    windowMs: n === 1 ? 180 : n === 2 ? 155 : n === 3 ? 135 : n === 4 ? 115 : Math.max(70, 115 - 5 * t),
    pulseMs: n === 1 ? 900 : n === 2 ? 820 : n === 3 ? 740 : n === 4 ? 660 : Math.max(420, 660 - 25 * t),
    lateLieMs: n === 1 ? 0 : n === 2 ? 40 : n === 3 ? 80 : n === 4 ? 110 : Math.min(180, 110 + 10 * t),
    resetMs: n === 1 ? 14000 : n === 2 ? 13000 : n === 3 ? 12000 : n === 4 ? 11000 : Math.max(8000, 11000 - 200 * t),
    missesToDeath: n < 4 ? 3 : 2,
  };
}
// Play: tap SNIP on true late window; skip painted early mark
// Depth = snip stages cleared
// Death: misses / early_paint / reset_fail / late_miss
// finishRun({ gameId:"ribbonsnip", depth, score, deathReason:"misses"|"early_paint"|"reset_fail"|"late_miss" })
// bestDepth.ribbonsnip = Snip
```
**Don'ts:** auto-snip on proximity · credit painted early mark · window never tightens · clone candycut / shootstar 1:1

---

## eggspoon — HoldBand · Egg Spoon Walk
```js
PF.runKit.declare("eggspoon", {
  engine: "HoldBand", // wobble snap yanks sweet band near finish — ≠ limbobar / cottonwind
  displayName: "Egg Spoon Walk",
  depthUnit: "Walk",
  sheet: "GOBLIN_BATCH27_BUILD_SHEETS.md",
});

function eggspoonStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Walk" : n === 3 ? "Wobble Snap" : n === 4 ? "Thin Shell" : "Walk Storm",
    bandW: n === 1 ? 0.3 : n === 2 ? 0.24 : n === 3 ? 0.18 : n === 4 ? 0.14 : Math.max(0.08, 0.14 - 0.01 * t),
    wobbleSnap: n < 3 ? 0 : n === 3 ? "low" : n === 4 ? "mid" : "high",
    outLimitMs: n === 1 ? 900 : n === 2 ? 800 : n === 3 ? 700 : n === 4 ? 600 : 500,
    clearMs: n === 1 ? 1800 : n === 2 ? 2000 : n === 3 ? 2200 : n === 4 ? 2400 : 2600,
    slipLimit: n === 1 ? 3 : 2,
    snapAtProgress: 0.7, // wobble snaps when seat > 70%
  };
}
// Play: hold force in sweet band; seat egg past finish mark
// Depth = walks won
// Death: slipped / wobble_snap / never_found
// finishRun({ gameId:"eggspoon", depth, score, deathReason:"slipped"|"wobble_snap"|"never_found" })
// bestDepth.eggspoon = Walk
```
**Don'ts:** auto-walk button · Love-heat / limbobar limbo copy · ignore wobble snap late · real egg spend framing

---

## tokenrail — GreedFloor · Token Rail Slide
```js
PF.runKit.declare("tokenrail", {
  engine: "GreedFloor", // rail breath — token slide greed + cashOut (≠ chippusher shelf)
  displayName: "Token Rail Slide",
  depthUnit: "Floor",
  sheet: "GOBLIN_BATCH27_BUILD_SHEETS.md",
  cashOut: true,
});

function tokenrailStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Chalk Lip" : n === 2 ? "Soft Rail" : n === 3 ? "Breath Edge" : n === 4 ? "Wobble Rail" : "Breath + Distractor",
    slides: n === 1 ? 8 : n === 2 ? 10 : n === 3 ? 10 : n === 4 ? 12 : 14,
    rarePct: n === 1 ? 16 : n === 2 ? 12 : n === 3 ? 10 : n === 4 ? 8 : 6,
    breathStreakDeath: n === 1 ? 0 : n < 4 ? 3 : 2, // 0 = no streak death on floor 1
    slidesToClear: n < 3 ? 3 : n < 5 ? 4 : 5,
    railBreath: true,
    lipTell: n === 1 ? "chalk" : "ridge",
    railWobble: n < 2 ? 0 : n < 4 ? "low" : n === 4 ? "mid" : "high",
    distractor: n >= 5,
    canCashOut: true,
  };
}
// Play: nudge tokens; cash out or again; rail breath is the cheat
// Depth = floors survived
// Death: breath streak / empty bank / rail breath
// finishRun({ gameId:"tokenrail", depth, score, deathReason:"breath_streak"|"empty_bank"|"rail_breath", cashedOut })
// bestDepth.tokenrail = Floor
```
**Don'ts:** fair frictionless rail forever · hide breath with no tell · no CASH OUT button · real-money / casino rail copy · clone chippusher 1:1

---

## colourveil — OracleRooms · Colour Veil Pick
```js
PF.runKit.declare("colourveil", {
  engine: "OracleRooms", // stillness then colour pick — twin fib veils swap stage 3+
  displayName: "Colour Veil Pick",
  depthUnit: "Veil",
  sheet: "GOBLIN_BATCH27_BUILD_SHEETS.md",
});

function colourveilStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Curtain" : n === 3 ? "Twin Fib" : n === 4 ? "Four Frames" : "Veil Storm",
    waitMs: n === 1 ? 1200 : n === 2 ? 1400 : n === 3 ? 1600 : n === 4 ? 1800 : Math.min(2400, 1800 + 80 * t),
    breakLimitMs: n === 1 ? 4000 : n === 2 ? 3800 : n === 3 ? 3500 : n === 4 ? 3200 : Math.max(2200, 3200 - 100 * t),
    veils: n < 4 ? 3 : n === 4 ? 4 : 4 + (t % 2),
    fibCount: n < 3 ? 1 : 2,
    twinSwap: n >= 3,
    feint: n >= 5,
    pickWindowMs: n === 1 ? 5000 : n === 2 ? 4500 : n === 3 ? 4000 : n === 4 ? 3500 : Math.max(2200, 3500 - 100 * t),
    copyTone: "soft_cute", // playful colour — no destiny-romance / medical
  };
}
// Play: stillness opens room; pick true veil; fib/swap = curtain
// Depth = veils cleared
// Death: wrong_veil / broke_still / timeout / fib_swap
// finishRun({ gameId:"colourveil", depth, score, deathReason:"wrong_veil"|"broke_still"|"timeout"|"fib_swap" })
// bestDepth.colourveil = Veil
```
**Don'ts:** destiny-romance / medical copy · skip stillness gate · always-fair single veil · shame / curse framing · clone fortunedoors 1:1

---

## cupstack — Custom · Soft Cup Stack
```js
PF.runKit.declare("cupstack", {
  engine: "Custom", // tap-place stack; lean tip near clear — ≠ softbottle / magiciancups
  displayName: "Soft Cup Stack",
  depthUnit: "Stack",
  sheet: "GOBLIN_BATCH27_BUILD_SHEETS.md",
});

function cupstackStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Teach" : n === 2 ? "Mid Tower" : n === 3 ? "Lean Breath" : n === 4 ? "Thin Stack" : "Stack Storm",
    needCups: n === 1 ? 4 : n === 2 ? 5 : n === 3 ? 6 : n === 4 ? 7 : 7 + t,
    timeBudgetMs: n === 1 ? 22000 : n === 2 ? 20000 : n === 3 ? 18000 : n === 4 ? 16000 : Math.max(10000, 16000 - 400 * t),
    leanTip: n < 3 ? false : n === 3 ? "low" : n === 4 ? "mid" : "high",
    spillLimit: n === 1 ? 3 : 2,
    cupSoft: n < 3 ? "soft" : n < 5 ? "mid" : "hard",
    placeWindowMs: n === 1 ? 4000 : n === 2 ? 3500 : n === 3 ? 3000 : n === 4 ? 2800 : Math.max(1800, 2800 - 80 * t),
    tipAtProgress: 0.75,
  };
}
// Play: tap-place soft cups; lean tip near clear height
// Depth = stacks cleared
// Death: timeout / spill / lean_tip / cups_out
// finishRun({ gameId:"cupstack", depth, score, deathReason:"timeout"|"spill"|"lean_tip"|"cups_out" })
// bestDepth.cupstack = Stack
```
**Don'ts:** auto-stack solve · fair towers with no lean tell · clone softbottle / magiciancups 1:1 · soft-lock without spill death

---

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: lidtoss, ribbonsnip, eggspoon, tokenrail, colourveil, cupstack.
Door tag: `Depth run` only if engine mounted.

## finishRun quick hints
| gameId | depthUnit | typical deathReason |
|--------|-----------|---------------------|
| lidtoss | Lid | lids_out, rim_spit, airball_streak |
| ribbonsnip | Snip | misses, early_paint, reset_fail, late_miss |
| eggspoon | Walk | slipped, wobble_snap, never_found |
| tokenrail | Floor | breath_streak, empty_bank, rail_breath (+ cashedOut) |
| colourveil | Veil | wrong_veil, broke_still, timeout, fib_swap |
| cupstack | Stack | timeout, spill, lean_tip, cups_out |

## Wiring notes (Desktop Grok)
- Import after Batch24 mounts; declare() must not collide with existing gameIds.
- stageParams(n) is 1-indexed stage/floor; t = n - 1 for storm formulas.
- GreedFloor tokenrail requires visible CASH OUT when canCashOut.
- OracleRooms colourveil uses soft_cute copyTone only.
- Custom cupstack must still emit finishRun-compatible RunResult.
- Routes: `#cabinet/{gameId}` · `#cabinet/{gameId}/play` · `#cabinet/{gameId}/result`
- Persistence keys: bestDepth.* / lastRun.* per gameId above.
- Fever: optional feverNode later; sheets stay coin=1 until then.
- HUD: depth unit label from depthUnit; death pip reasons from deathReason enums.
- Alley door placard: displayName + Depth run tag only when /play mounted.
- Accept: each stage 1 teachable ~10s; cheat tell visible in vestibule prop.
- Anti-dupe: not in batches 01–24 — lidtoss · ribbonsnip · eggspoon · tokenrail · colourveil · cupstack.
- Sister files: GOBLIN_BATCH27_BUILD_SHEETS.md · GOBLIN_BATCH27_AURA_LINES.md
- Engine kit: SlingAim / TimingTap / HoldBand / GreedFloor / OracleRooms / Custom from GOBLIN_BATCH10_SHARED_ENGINE_KIT.md
- Score hooks: reportDepth on clear; finishRun on death or cash-out.
- Mobile: one pointer; no hover-only hits; large tap targets on SNIP / CASH OUT / veil cards.
- Result share: challenge templates in aura lines; depth integer only.
- Do not ship teaser delight once engine play exists for these six.
