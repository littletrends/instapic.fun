# Vendor stall modules

**Agents landing here:** read `../ops/ATTN_VENDOR_AGENTS.md` first. The 3D alley is a separate lane (`../world/alley.js`). Do not rebuild the carnival. Do not touch booth/port 6000.

Desktop Grok builds tent **games** here. Each file = one tent.
Core hall + existing cabinets stay in `../app.js` + `../index.html` (Codex).
3D stall shells + Aura + palace stay in `../world/`.

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
- `penny-pitch.js` — Penny Pitch Dish Garden (Custom 3D flick; glass dishes on a living quilt; yank after release; death short_points; depth = cloths)
- `dunk-tank.js` — Dunk the Barker (SlingAim; 3 balls/seat; dunk checkpoint; death miss_seat; depth = dunks; playful)

## Love Tester (3D tent)
- `love.js` + `love.css` — Three.js mercury palace. Squeeze the brass grip. 8 authored Heat rooms then ENDLESS Inferno Edge. HoldBand. `id=love`.

## Register hook
Stalls call `window.PennyFever.registerVendor({ id, playKey, chalk, defaults, bind, onShow, onLeave, onReset, refreshDepth })`.
Do not put new game loops in `app.js`.

## runKit.js (Batch 10)
Shared RunResult / bestDepth / startRun·finishRun + engines: SlingAim · HoldBand · TimingTap · GreedFloor · OracleRooms.
Every new stall must declare which engine it uses. Wire stalls onto PF.runKit — do not reinvent death/score chrome.
