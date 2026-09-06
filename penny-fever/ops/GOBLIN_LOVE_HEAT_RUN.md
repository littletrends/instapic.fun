# Love Thermometer → HEAT RUN (authored rooms)
# 1 coin = 1 run until DEATH (or souvenir if coda is off). Depth = Heat Stage.
# Source of rooms: GOBLIN_AUTHORED_LEVELS_P0.md. HoldBand in app.js. Solo Aura.
# NOT a pure stageParams climb — each room changes how mercury behaves.
# GOBLIN REVIEW REDO 2026-09-05 — app.js HoldBand.mount(stageParams: holdBandStageParams) = AUTHORED unique rooms + codaEnabled.

## Vestibule
- Best: `Heat Stage {n}`
- Copy: “HOLD THE PINK — HOW FAR CAN YOU GO?”
- CTA: 1 demo coin → play
- Practice 3 rooms (Warm Glass → Mercury Tide → Hot Split) is optional — DEFAULT is Heat Run
- HUD names the authored room; coda is labeled `ENDLESS`

## Core verb (unchanged feel)
- Hold = heat rises (~0.55/tick as now)
- Release = heat falls (~0.32/tick as now)
- Pink band is the law of the room; score while holding IN a valid band
- Leave a valid band while holding OR never enter by `entryDeadlineMs` → death (Stage 1: 1 grace strike)

## Death
- **Grace:** Stage 1 (Warm Glass) only — 1 free strike (flash band red, toast “Careful…”)
- **Else:** `outMs >= outLimitMs` while holding out-of-band → **DEATH** (`"drifted out"`)
- Never enter a valid band for first `entryDeadlineMs` → `"never found the band"`
- Hold poison ghost ≥400ms → `"ghost band lied"`
- Twin Mercury: fill one band and ignore the other until `stallMs` → `"ignored the twin"`
- Hold Liar’s Flash decoy until outLimit → `"the lie flashed"`
- Death ≠ end of 3 rounds. Practice stamps without Heat. After authored Stage 8: if `codaEnabled` enter ENDLESS, else **souvenir** (not death).

## Authored rooms (8) — wire these, do not shrink the same board

```js
const LOVE_CODA_ENABLED = true; // hybrid default; one flip = authored-stop souvenir

const LOVE_LEVELS = [
  { id:1, name:"Warm Glass", kind:"solid", bandH:22, speed:0.35, travel:5, clearMs:1800, outLimitMs:900, entryDeadlineMs:4000, graceStrikes:1 },
  { id:2, name:"Mercury Tide", kind:"sine", bandH:22, speed:0.95, travel:22, clearMs:1800, outLimitMs:1100, entryDeadlineMs:4200 },
  { id:3, name:"Hot Split", kind:"splitMidClear", bandH:20, splitBandH:9, splitGap:11, splitAtPct:0.45, clearMs:2000, outLimitMs:800 },
  { id:4, name:"Twin Mercury", kind:"twinAlternate", bandH:11, clearEachMs:900, stallMs:4500, outLimitMs:750, entryDeadlineMs:8000 },
  { id:5, name:"Ghost Band", kind:"ghostEither", bandH:16, ghostSpeed:-0.55, clearMs:2000, outLimitMs:700 },
  { id:6, name:"Liar's Flash", kind:"liarFlash", bandH:16, lieEveryMs:2500, decoyMs:400, decoyOffset:12, clearMs:2000, outLimitMs:650 },
  { id:7, name:"Poison Twin", kind:"ghostPoison", bandH:15, poisonMs:400, clearMs:2100, outLimitMs:600 },
  { id:8, name:"Fever Break Room", kind:"livingShrink", bandH:18, shrinkWhileHold:0.007, minBandH:7, teleportEveryMs:3000, clearMs:2400, outLimitMs:420 },
];

function loveStageParams(n) {
  if (n >= 1 && n <= LOVE_LEVELS.length) return Object.assign({ title: LOVE_LEVELS[n-1].name }, LOVE_LEVELS[n-1]);
  if (LOVE_CODA_ENABLED) return loveCodaParams(n); // Inferno Edge {n}, HUD = ENDLESS
  return null; // souvenirClear
}
```

| # | Name | Layout / beat | Clear | Death / cheat | vs prior |
|---|------|---------------|-------|---------------|----------|
| 1 | Warm Glass | Single solid tall band (~22%), slow scroll | in-zone ~1.8s | Grace ×1 | tutorial |
| 2 | Mercury Tide | Same height; **sine path** | same clearMs | No grace; generous outLimit | motion, not shrink |
| 3 | Hot Split | Splits **mid-clear** into two short stacked bands | either band | Gap = OUT | room event |
| 4 | Twin Mercury | Two bands always (upper pink / lower rose) | time in **both** | Ignore one → stall timeout | new verb: alternate |
| 5 | Ghost Band | Solid + 50% ghost, opposite drift | either | not poison | decoy vocabulary |
| 6 | Liar’s Flash | Single band; decoy flash ±12% / 400ms every ~2.5s | solid only | decoy = OUT | lie cadence |
| 7 | Poison Twin | Solid + ghost; ghost poison ≥400ms | solid only | `"ghost band lied"` | inverts Stage 5 |
| 8 | Fever Break Room | Shrinks **while holding**; teleport every 3s | survive shrink+teleports | tight outLimit | living machine |

**Rule:** if the change is “same board, smaller numbers,” it is illegal.

## Endless coda (`codaEnabled:true`)
- After Stage 8 clear → `loveCodaParams(n)` from n=9, titles `Inferno Edge {n}`
- HUD: `ENDLESS · Inferno Edge {n}` so the authored ride is visibly over
- Leftover parametric climb (bandH/speed/shrink/lie/split/bothMust) lives **only here**
- Flip `codaEnabled:false` → souvenir after Fever Break (cashedOut, not death)

## Stage clear
- `inZoneMs >= clearMs` (Twin Mercury: both meters ≥ `clearEachMs`)
- depth++, fanfare, reset meters, keep heat mid (40–55)
- UI: `HEAT STAGE 4 · Twin Mercury` (authored) or `ENDLESS · Inferno Edge 9`

## Scoring / persistence
- `score += 100 * stage` on each clear + style (`floor(inZoneMs/100)` that stage)
- `state.bestDepth.love = max(...)`
- Result: `HEAT STAGE {depth} · SCORE · deathReason` · Aura line · challenge CTA
- Challenge: `Beat my Love Heat Stage {n} on Penny Fever`
- Fever/stars: `fever += depth`, `stars += floor(depth/3)`

## Input
- Pointer hold on `#holdBtn` (full-width hold zone)
- On death: disable hold, navigate result after 700ms
- Souvenir / practice: no glass crack

## Accept feel
- Twin Mercury makes you *switch* bands
- Ghost → Poison is a law the player can name
- Fever Break feels like a different machine, not Warm Glass on hard
- Coda is labeled ENDLESS; authored-stop is one flag flip

## Explicit replace
- Delete / gate the `LOVE_ROUNDS` length-3 loop as default
- Do **not** resume the old `stageParams` climb as the player-facing path
- Rank pills: depth 1–2 Lukewarm, 3–4 Warm, 5–7 Sweet, 8+ Inferno
