# runKit API — codeable contract for Desktop Grok/Codex
# Implement this BEFORE more stall art. Mother path: penny-fever/ops/

## Files (suggested)
```
js/runKit.js          // lifecycle, persistence hooks, Fever Run flags
js/engines/slingAim.js
js/engines/holdBand.js
js/engines/timingTap.js
js/engines/greedFloor.js
js/engines/oracleRooms.js
js/games/*.js         // thin configs calling engines
```

## runKit exports
```js
startRun({ gameId, coinCost=1, feverNode=false, feverGate=null })
// spends coin unless feverNode (coin already spent by route)
// returns runCtx

reportDepth(runCtx, depth, extra?)   // HUD uses declared depthUnit; extra = { name, coda }
reportStrike(runCtx, reason)         // pips; may not kill
finishRun(runCtx, {
  depth, score, deathReason, cashedOut=false, meta={}
})
// writes bestDepth[gameId], lastRun[gameId], awards fever/stars, navigates result

challengeText(name, depth, gameId?) → string
auraDeathLine(gameId, depth, reason) → string  // table or procedural

getBestDepth(gameId) → number

declare(stallId, spec|engineName)
// spec object: { engine, depthUnit, codaEnabled, authoredCount, sheet }
// stores runKit.declared[stallId] + runKit.p0[stallId]; string engineName still works
```

## runCtx shape
```js
{
  gameId, startedAt, feverNode, feverGate,
  depth: 0, score: 0, strikes: 0,
  alive: true
}
```

## Result route
All games: `#cabinet/{gameId}/result` reads `lastRun[gameId]`.
Shared render: depth · score · reason · challenge · replay CTA · back to alley/foyer.

## Engine contracts

### HoldBand.mount(root, spec, runCtx)
spec: `{ stageParams(n), onClear(stage), graceStrikes }`
See GOBLIN_LOVE_HEAT_RUN.md for Love spec values.
Events: clear → depth++; death → finishRun.

### SlingAim.mount(root, spec, runCtx)
spec: `{ gravity, onThrow(ball), hitTest(ball), stageParams(n), missesToDeath }`
Ball Toss / Milk / Cans / Rings / Hatchet / Coconut / Cornhole configs only differ by hitTest + stageParams.

### TimingTap.mount(root, spec, runCtx)
spec: `{ schedule(stage), windowMs, onHit, onFake, strikesToDeath, clearCount }`
Snap / Popcorn / Plate / High Striker / Marquee / Black Art.

### GreedFloor.mount(root, spec, runCtx)
spec: `{ doAction(), evaluate(), canCashOut, deathRule, stageParams }`
Coin Pusher / Curios / Cover-the-Spot.
UI must include CASH OUT button when `canCashOut()`.

### OracleRooms.mount(root, spec, runCtx)
spec: `{ waitMs(n), breakLimitMs(n), allowDoubleFrom, ticketGen }`
Fortune + Catoptromancy skins.

### Custom
Pinball, Bumper, Log Roll, Ladder, Fever Run controller, Closing Time, Pack draft — declare Custom and keep RunResult compatible.

### Authored rooms + codaEnabled (Milk PYRAMID · Cover SPOT · Water HEAT · P0 hybrid)
Do **not** ship Milk / Cover / Water as a pure `stageParams(n)` number climb. Each stall owns an `authored[]` table (unique names, layouts, cheat beats) then optional coda:

```js
PF.runKit.declare("milk", { engine:"SlingAim", depthUnit:"Pyramid", codaEnabled:true, authoredCount:7, sheet:"GOBLIN_AUTHORED_LEVELS_P0.md" });
// clear → next authored; after last → if (codaEnabled) codaParams(n) else souvenirClear
// HUD: PYRAMID {n} · {name} ; coda labeled ENDLESS
PF.runKit.declare("coverspot", { engine:"GreedFloor", depthUnit:"Spot", codaEnabled:true, authoredCount:7, cashOut:true, sheet:"GOBLIN_AUTHORED_LEVELS_P0.md" });
// HUD: SPOT {n} · {name} ; coda labeled ENDLESS · cash out between spots
PF.runKit.declare("watergun", { engine:"Custom", depthUnit:"Heat", codaEnabled:true, authoredCount:7, sheet:"GOBLIN_AUTHORED_LEVELS_P0.md" });
// HUD: HEAT {n} · {name} ; coda labeled ENDLESS
```

`codaEnabled:true` is the hybrid default (Lorie 2026-09-05). One flip stops after the last named room (`deathReason:"souvenir"`, `cashedOut:true`).

---

## Engine map (queued stalls)

| gameId | engine | depth unit | sheet |
|--------|--------|------------|-------|
| love | HoldBand | Heat Stage | LOVE_HEAT_RUN |
| balltoss | SlingAim | Rack | BATCH01 |
| coinpusher | GreedFloor | Floor | BATCH01 |
| pinball | Custom | Chapter | BATCH01 |
| milk | SlingAim | Pyramid | AUTHORED_LEVELS_P0 + BATCH02 · 7 rooms · codaEnabled |
| coverspot | GreedFloor | Spot | AUTHORED_LEVELS_P0 + BATCH02 · 7 rooms · codaEnabled · WIRED vendors/cover-the-spot.js |
| watergun | Custom (hold-spray) | Heat | AUTHORED_LEVELS_P0 + BATCH02 · 7 rooms · codaEnabled |
| mutoscope | Custom (stillness) | Stage | BATCH03 |
| catoptromancy | OracleRooms | Room | BATCH03 |
| highstriker | TimingTap | Pegs | BATCH03 · WIRED vendors/high-striker.js |
| bentring | SlingAim | Stage | BATCH03 · WIRED vendors/bent-rings.js |
| plinko | Custom | Stage | BATCH03 · WIRED vendors/plinko.js |
| fairyfloss | HoldBand (tension) | Stage | BATCH04 |
| popcorn | TimingTap | Stage | BATCH04 |
| duckpond | Custom | Stage | BATCH04 |
| skee | SlingAim | Stage | BATCH04 |
| pennypitch | SlingAim | Stage | BATCH04 |
| dunk | SlingAim | Dunks | BATCH04 |
| balloondarts | SlingAim | Wall | BATCH05 |
| canalley | SlingAim | Stack | BATCH05 |
| wheel | TimingTap (stop) | Stops | BATCH05 |
| ticketchop | Custom | Window | BATCH05 |
| bumper | Custom | Laps | BATCH05 |
| killscreen | TimingTap→glitch | Stage | BATCH05 |
| snap | TimingTap | Streak | BATCH06 |
| whisper | Custom | Secrets | BATCH06 |
| lookup | Custom | Sky Tier | BATCH06 |
| curios | GreedFloor | Floor | BATCH06 |
| marquee | TimingTap | Wave | BATCH06 |
| pack | Custom meta | Routes | BATCH06 |
| logroll | Custom | Metres | BATCH07 |
| ladder | TimingTap-ish | Rungs | BATCH07 |
| hatchet | SlingAim | Stage | BATCH07 |
| glasspitch | SlingAim | Stage | BATCH07 |
| steamshovel | Custom | Shifts | BATCH07 |
| guessbluff | Custom | Streak | BATCH07 |
| ringtoss | SlingAim | Crate | BATCH08 |
| coconut | SlingAim | Shy | BATCH08 |
| beanbag | SlingAim | Mouth | BATCH08 |
| cornhole | SlingAim | Board | BATCH08 |
| icecream | Custom | Scoops | BATCH08 |
| hotdog | Custom | Service | BATCH08 |
| feverrun | Custom meta | Nodes | BATCH09 |
| pass | TimingTap | Cue | BATCH09 |
| fortune | OracleRooms | Room | BATCH09 |
| platesmash | TimingTap | Line | BATCH09 |
| fishbowl | SlingAim | Stage | BATCH09 |
| shark | watergun skin | Heat | BATCH09 |
| mirrorflip | Custom | Locks | BATCH10 |
| blackart | TimingTap | Stage | BATCH10 |
| closingtime | Custom event | Band | BATCH10 |
| teacupspin | HoldBand | Lap | BATCH18 |
| mirrorpeek | Custom (stillness + timing) | Peek | BATCH18 |
| candycut | TimingTap | Cut | BATCH18 |
| duckhookcolour | Custom | Duck | BATCH18 |
| lanterncatch | TimingTap | Lantern | BATCH18 |
| barkerecho | TimingTap | Echo | BATCH18 |
| coconutsoft | SlingAim | Shy | BATCH19 |
| tincansoft | SlingAim | Stack | BATCH19 |
| plinkoskill | Custom | Stage | BATCH19 |
| snackwheel | TimingTap | Stop | BATCH19 |
| midwaymaze | Custom | Maze | BATCH19 |
| tipjar | TimingTap | Tip | BATCH19 |
| catrack | SlingAim | Rack | BATCH21 |
| brassring | TimingTap | Grab | BATCH21 |
| stringpull | GreedFloor | Floor | BATCH21 |
| nailhammer | HoldBand | Nail | BATCH21 |
| weightguess | OracleRooms | Room | BATCH21 |
| razzledazzle | Custom | Card | BATCH21 |
| hoopswish | SlingAim | Hoop | BATCH22 |
| shootstar | TimingTap | Star | BATCH22 |
| pigslide | GreedFloor | Floor | BATCH22 |
| tugband | HoldBand | Pull | BATCH22 |
| ageguess | OracleRooms | Room | BATCH22 |
| fascination | Custom | Card | BATCH22 |
| bottlehook | SlingAim | Hook | BATCH23 |
| whistlepop | TimingTap | Lap | BATCH23 |
| sandpour | HoldBand | Pour | BATCH23 |
| ticketclaw | GreedFloor | Shelf | BATCH23 |
| mirrorlot | OracleRooms | Room | BATCH23 |
| railroll | Custom | Rail | BATCH23 |
| ringlean | SlingAim | Ring | BATCH24 |
| bellhammer | TimingTap | Strike | BATCH24 |
| cottonwind | HoldBand | Spool | BATCH24 |
| chippusher | GreedFloor | Floor | BATCH24 |
| fortunedoors | OracleRooms | Door | BATCH24 |
| marblemaze | Custom | Maze | BATCH24 |
| capseat | SlingAim | Cap | BATCH26 |
| clappulse | TimingTap | Clap | BATCH26 |
| ropeband | HoldBand | Walk | BATCH26 |
| jarpush | GreedFloor | Floor | BATCH26 |
| tealeaf | OracleRooms | Leaf | BATCH26 |
| tiltdrop | Custom | Drop | BATCH26 |
| lidtoss | SlingAim | Lid | BATCH27 |
| ribbonsnip | TimingTap | Snip | BATCH27 |
| eggspoon | HoldBand | Walk | BATCH27 |
| tokenrail | GreedFloor | Floor | BATCH27 |
| colourveil | OracleRooms | Veil | BATCH27 |
| cupstack | Custom | Stack | BATCH27 |
---

## First merge checklist (Grok)
- [ ] runKit.js + result chrome live
- [ ] Love uses HoldBand + LOVE_HEAT_RUN numbers (no 3-round default)
- [ ] balltoss SlingAim per BATCH01
- [ ] coinpusher GreedFloor + cash out
- [ ] pinball Custom still emits RunResult
- [ ] Teaser delight removed for any gameId with a /play engine
- [ ] Door tag `Depth run` only if engine mounted
- [x] BATCH03 highstriker TimingTap · vendors/high-striker.js · depth=pegs · bell checkpoint
- [x] BATCH03 bentring SlingAim · vendors/bent-rings.js · mid-flight lean · ringsPerStage=max(3,need)
- [x] BATCH03 plinko Custom · vendors/plinko.js · breath tilt · first paying slot clears

PF only. Never booth/port 6000. Never Imagine. Leave mutoscope.js + catoptromancy.js to their desks.
- [x] milk SlingAim · 7 authored PYRAMID rooms · vendors/milk-bottles.js · codaEnabled · not pure stageParams
- [x] coverspot GreedFloor · 7 authored SPOT rooms (not pure stageParams) · codaEnabled · cashOut between spots · vendors/cover-the-spot.js
- [x] watergun Custom hold-spray · 7 authored HEAT maps · vendors/water-gun-duel.js · codaEnabled · not pure stageParams

## Accept
One afternoon: Love Heat Run feels endless; Ball Toss dies on 3rd miss; Pusher cash-out dilemma exists; result tickets share layout.
| softpeg | SlingAim | Peg | BATCH32 |
| banjobeat | TimingTap | Beat | BATCH32 |
| balloonhold | HoldBand | Hold | BATCH32 |
| trinketpush | GreedFloor | Floor | BATCH32 |
| moonveil | OracleRooms | Veil | BATCH32 |
| beadgate | Custom | Gate | BATCH32 |

| diskflip | SlingAim | Flip | BATCH29 |
| cowbell | TimingTap | Clang | BATCH29 |
| ladderlean | HoldBand | Rung | BATCH29 |
| chipfall | GreedFloor | Floor | BATCH29 |
| lanternpick | OracleRooms | Path | BATCH29 |
| spiralroll | Custom | Spiral | BATCH29 |

| tinlidspin | SlingAim | Spin | BATCH30 |
| popcornclap | TimingTap | Catch | BATCH30 |
| broomhold | HoldBand | Hold | BATCH30 |
| tokenpush | GreedFloor | Shelf | BATCH30 |
| shadowpick | OracleRooms | Room | BATCH30 |
| corkscrew | Custom | Cork | BATCH30 |

| ringfloat | SlingAim | Float | BATCH31 |
| woodblock | TimingTap | Tap | BATCH31 |
| trayhold | HoldBand | Tray | BATCH31 |
| beadpush | GreedFloor | Bead | BATCH31 |
| curtainpick | OracleRooms | Curtain | BATCH31 |
| helixroll | Custom | Helix | BATCH31 |
| pegbounce | SlingAim | Peg | BATCH28 |
| drumhit | TimingTap | Beat | BATCH28 |
| balancestick | HoldBand | Step | BATCH28 |
| medalslide | GreedFloor | Shelf | BATCH28 |
| maskpick | OracleRooms | Room | BATCH28 |
| zigzagroll | Custom | Lane | BATCH28 |

| coinarc | SlingAim | Arc | BATCH33 |
| xylotap | TimingTap | Note | BATCH33 |
| platehold | HoldBand | Plate | BATCH33 |
| charmpush | GreedFloor | Charm | BATCH33 |
| fogdoor | OracleRooms | Fog | BATCH33 |
| twistlane | Custom | Twist | BATCH33 |

| washerflip | SlingAim | Washer | BATCH34 |
| bottletap | TimingTap | Tap | BATCH34 |
| cuphold | HoldBand | Cup | BATCH34 |
| gempush | GreedFloor | Gem | BATCH34 |
| mistpick | OracleRooms | Mist | BATCH34 |
| coilroll | Custom | Coil | BATCH34 |

| nailtoss | SlingAim | Nail | BATCH35 |
| jingletrue | TimingTap | Jingle | BATCH35 |
| polehold | HoldBand | Pole | BATCH35 |
| shellpush | GreedFloor | Shell | BATCH35 |
| smokepick | OracleRooms | Smoke | BATCH35 |
| screwroll | Custom | Screw | BATCH35 |
