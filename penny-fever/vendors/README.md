# Vendor stall modules

Desktop Grok builds new alley stalls here. Each file = one tent.
Core hall + existing cabinets stay in `../app.js` + `../index.html` (Codex).

## Batch 01
- `ball-toss.js` — Barely-Fit Ball Toss
- `coin-pusher.js` — Coin Pusher Shelf
- `pinball.js` — Pinball Alley
- `water-gun-duel.js` — Water Gun Duel (7 authored HEAT maps + codaEnabled ENDLESS)
- `milk-bottles.js` — Weighted Milk Bottles (7 authored PYRAMID rooms + codaEnabled ENDLESS)
- `mutoscope.js` — Mutoscope Hood (stillness opens iris; depth = cards seen)
- `kit.js` — shared canvas helpers
- `vendors.css` — stall vestibule / playfield chrome

## Batch 04
- `fairy-floss.js` — Fairy Floss Wheel (HoldBand tension; 5 authored STAGES + ENDLESS coda; snap limit; depth = stages)
- `popcorn.js` — Popcorn Kettle (TimingTap; 5 authored STAGES + ENDLESS coda; steam fakes; 3 burns; depth = stages)
- `duck-pond.js` — Duck Pond Hook (Custom; 5 authored STAGES + ENDLESS rotating call; depth = stages)
- `skee-ball.js` — Skee-Ball Alley (SlingAim; 9 balls; wax lies mid-stage; death under_target; depth = stages)
- `penny-pitch.js` — Penny Pitch Cloth (SlingAim drop; tent-visible jerk after release; death short_points; depth = stages)
- `dunk-tank.js` — Dunk the Barker (SlingAim; 3 balls/seat; dunk checkpoint; death miss_seat; depth = dunks; playful)

## Register hook
Stalls call `window.PennyFever.registerVendor({ id, playKey, chalk, defaults, bind, onShow, onLeave, onReset, refreshDepth })`.
Do not put new game loops in `app.js`.

## runKit.js (Batch 10)
Shared RunResult / bestDepth / startRun·finishRun + engines: SlingAim · HoldBand · TimingTap · GreedFloor · OracleRooms.
Every new stall must declare which engine it uses. Wire stalls onto PF.runKit — do not reinvent death/score chrome.
