# Exact-state saving build checklist

## Current Fortune and Copper Falls engines — 14 September 2026

The live replacements use `stalls/fortune.js` and `stalls/coin-pusher.js` through the standard `play.html` route. They share `cabinet-runtime.js`, `cabinet-draw.js` and `cabinet.css`. There is no separate experiment deployment for these games.

Fortune keeps its existing `pennyFever.irisTent1.v2` saves. Copper Falls saves full coin positions, velocities, falling flags, active drop/push/settle phase, paid counts and selected chapter in `pennyFever.copperFalls.v6`. Both persist every second and on pause/exit; Copper also saves after drops and collections. The older Copper engine's different tray layout remains in its original storage key and is not migrated. Owned collection treasures are retained and recognized.

The disabled charging pilot has not been revalidated against these replacements. Legacy audit rows below describe previous engines, not these active versions.

## Disabled pilot candidate update — 13 September 2026

The three-pilot charging adapter adds authoritative snapshots for Balloon Garden,
Fortune and Copper Falls without editing their engine modules. The legacy-hook
audit below still describes the default, unflagged build; it is not superseded for
the other 31 games.

- Balloon Garden: engine input/timer/balloon state retained across fixture frame
  return; one ticket at Begin, no recharge on resume, explicit terminal records.
- Fortune: topic/chapter/parade/RNG/timing frozen at valid gaze; midnight and
  resumed daily reservations covered by server and browser fixtures.
- Copper Falls: six persistent tables, companion-save selection, individually
  recorded bulk drops, deterministic RNG/motion and deduplicated delayed payouts.
  Paid motion is not terminated by the house timer.
- Evidence: 30 backend tests, intercepted Chromium smoke test and migration/client
  Node checks. Some edge cases use constructed engine snapshots. These are not
  live 3D routing, production service or every-chapter playthrough tests.
- Deployment: disabled and unpublished. Full evidence and activation gates:
  MotherPC `motherpc_server/PENNY_PILOT_RELEASE_CANDIDATE.md`.

## Original live-source audit

Audited 2026-09-13 against the working live-source checkout on MotherPC.
These are build requirements, not a claim that the features are implemented or deployed.
Update this checklist when a game changes; recheck the code rather than trusting an old status.

## Player requirement

Every chapter must stay as the player left it. Returning is not a new game.
A treasure hanging off a coin-pusher edge must still be there. Leaving for Aura,
another stall, Home, a reload, or closing the browser must not reset progress.
Do not alter character/doll work while implementing game saves.

## Shared runtime work required

- Preserve the selected chapter separately for each game and retain all chapter saves.
- Restore before rendering; do not call fresh random setup over a valid saved layout.
- Preserve elapsed/remaining time, motion, random-generator state, queued paid actions,
  chapter prize phase, and reward/payment receipts. No offline simulation or duplicate credits.
- Save on pause, chapter changes, leaving, page hide, and regularly during play.
  Reconcile already-paid drops and rewards after an interrupted write.
- Do not overwrite restored house timers in `runtime.js` reset(), which currently
  assigns `state.houseLeft = house.seconds` after engine.create().
- The runtime currently calls optional engine.persist() and silently catches errors.
  Verify each engine actually saves; handle storage failure without claiming success.
- Save plain data, not DOM/canvas/audio objects or event handlers. Rebuild presentation
  resources without randomizing saved gameplay. Clear held keyboard/pointer input on resume.
- Version saves, validate them, and migrate old saves without discarding them silently.
- Scope saves by player, game, and chapter. Define browser/device synchronization separately:
  localStorage alone does not carry a save from Acer to MotherPC or another browser.
- Explicit reset is a separate, confirmed action. Never use it on ordinary return.

## Per-game requirements

“Hook present” means an engine persist hook was found, not that exact restoration passes.
“No hook found” means the inspected engine has no runtime persist hook; other storage
may exist and must be examined before implementing a replacement.

| Engine in stalls/ | Audit status | State to preserve and test |
| --- | --- | --- |
| ball-toss.js | No hook found | Lantern positions, swing phases, hits, airborne balls, throws remaining, aim, score and chapter prize. |
| balloons.js | No hook found | Balloon arrangement, motion, popped/collected state, current action and chapter progress. |
| bent-rings.js | No hook found | Branch motion, rings in flight or landed, rotation/velocity, remaining throws and awards. |
| carousel.js | No hook found | Wheel angle/speed, target and selected rider, stop phase, matches and prize progress. |
| catoptromancy.js | Hook present; audit needed | Both gardens, player/reflection positions, puzzle changes, collected objects and animation state. |
| coin-pusher.js | Exact-state patch prepared; unpublished | Full-precision edge positions, falling pieces, velocities, pusher stroke, queued drops, cooldowns, payouts and sparse/empty tables. Targeted serialization tests pass; browser return/payment-interruption tests remain. |
| cover-the-spot.js | No hook found | Disc positions/orientations, target layout, coverage, remaining discs and any active placement. |
| curios.js | Hook present; audit needed | Track layout/rotations, beetle position and travel phase, switches, collected pieces and prize state. |
| duck-pond.js | Hook present; audit needed | Duck positions/directions, followers, homes reached, obstacles, route phase and remaining time. |
| dunk-tank.js | No hook found | Bell motion, aim/charge, projectile, splash phase, hits, remaining attempts and prize state. |
| fairy-floss.js | Hook present; audit needed | Sculpture geometry/progress, sugar colours, winding phase, tool position and collected rewards. |
| ferris.js | No hook found | Wheel angle/speed, gondola contents, target, current action and earned progress. |
| fortune.js | No hook found | Current reading/input, selected outcome, reveal phase, time and already-delivered keepsakes. |
| funhouse.js | No hook found | Room/layout, positions, doors, selected path, solved obstacles and current animation. |
| helter.js | No hook found | Rider position/speed, slide phase, targets, collected objects and chapter progress. |
| high-striker.js | No hook found | Charge, hammer/bell motion, strike phase, sequence progress and remaining attempts. |
| lookup.js | Hook present; audit needed | Telescope angles, constellation layout, discovered stars, alignment/reveal phases and reward state. |
| love.js | No hook found | Entered names, selected reading, meter/animation phase, progress and issued souvenir. |
| marquee.js | Hook present; audit needed | Light pattern, sequence position, wave phase, toggles, timing and completed progress. |
| milk-bottles.js | No hook found | Every bottle position/velocity, fallen state, airborne balls, aim and remaining throws. |
| mural.js | No hook found | Placed/painted pieces, colours, selected tool, target pattern and completed areas. |
| mutoscope.js | Hook present; audit needed | Frame order, selected/spliced frames, playback position, solved sections and prize phase. |
| organ.js | No hook found | Tune/sequence position, chosen notes, timing, successes and current chapter. |
| pack.js | Hook present; audit needed | Each packed object's position/rotation, loose pieces, suitcase layout and completion phase. |
| pass.js | Hook present; audit needed | Player position/velocity, scenery motion, obstacles, checkpoints, collected items and timer. |
| penny-pitch.js | No hook found | Airborne/skipping penny physics, fountain cycles, aim, attempts and credited results. |
| pinball.js | Hook present; audit needed | Ball position/velocity, flipper/plunger state, bumpers/targets, paid balls, score, table phase and payout receipts. |
| plinko.js | No hook found | Marble positions/velocities, gate angles, hopper/queue, destination bins and paid-drop state. |
| popcorn.js | Hook present; audit needed | Kernels in flight, kettle/basket state, heat/rhythm, caught counts and issued rewards. |
| skee-ball.js | No hook found | Ball trajectory/velocity, lane/bowl phase, aim, balls remaining, score and credited wins. |
| snap.js | No hook found | Woodland actors, motion phases, camera framing, captured results and awarded keepsakes. |
| swings.js | No hook found | Ride angle/speed, swing positions, target/selection, current action and collected rewards. |
| water-gun.js | No hook found | Boat position/velocity, aim, water/charge, harbour obstacles, progress and timer. |
| whisper.js | Hook present; audit needed | Letters and flight paths, mailbox/wind phases, delivery queue, matched letters and rewards. |

## Acceptance test for each game

1. Start a chapter; create a distinctive layout or pause midway through an action.
2. Record gameplay state, wallet, reward receipts and selected chapter.
3. Leave for the alley/Ticket Desk, return, then repeat with reload and browser close.
4. Before resuming, compare positions, counters, timers, motion phases and rewards.
5. Resume: motion continues from the saved frame, with no new charge or repeated payout.
6. Switch between chapters and verify each retains its own state.
7. Test completed, empty, partially paid and old-version saves, plus unavailable storage.
8. Record test results and deployment status here. A hook alone is not completion.

## Presentation-only pass — 14 September 2026

See `TEMPLATE_VISIBILITY_AUDIT.md` for all 34 game review statuses and evidence. The overlay cleanup changes drawing surfaces and backdrop readiness only. The 33 open games passed opening/reload checks and 198 chapter initial render checks; these do not certify exact-state save restoration or paid outcomes. Existing gameplay/save methods were preserved. Remaining presentation changes are prepared, not published by this task; Felix remains closed.

## Phone presentation pass — 14 September 2026

All open games: shared viewport/control/menu changes and render-only ride cleanup are covered by `PHONE_LAYOUT_REVIEW.md`. 33 opening checks and 99 viewport/control checks passed. Existing engine save/charge APIs remain; no claim of exact-state restore completion. The return/reload/browser-close, per-chapter state, wallet and payout checks above remain required. This agent has not published the pass; concurrent commits briefly included then reverted play.html; the required shell markup and supporting changes are now pending together in the shared working tree.

Publication update — 14 September 2026: user authorized publishing the combined phone layout and backdrop cleanup. Browser evidence and remaining save checks are unchanged.

## Catch the Fortune polish — 15 September 2026

Prepared for publication: centre-only Gaze/Stop input, six chapter previews and motifs,
varied seeded signs, matching alley Iris art, reading typography, and the two-row
embedded navigation with Treasure Book access. Existing v2 sitting snapshots restore
without regenerating saved rings. Eight symbol slots and the prize/timing rules remain.

Validation: `node paper-games/check-cabinet-state.mjs` passes six-chapter full-ring,
phase and clock restoration, result text/practice persistence, variation across adjacent
seeds, and removal of lower-button charging. Existing Copper wallet/payout tests pass.
Phone-sized Chromium browser checks passed map image/order, successive Iris chats,
all six chapters through centre taps, both close controls, Treasure Book return, and
unchanged sitting snapshots after alley exit/re-entry. Artwork and JavaScript checks
passed. This polish does not certify cross-device sync, unavailable-storage recovery,
or every browser-close/payment-interruption case in the broader acceptance checklist.

Deployment: published as `8b1722b` on 15 September 2026 (Pages run
`34908293764`, successful). The same phone-sized browser checks passed against
https://instapic.fun, including the map image, changing chats and exact return state.

## Chapter and collection navigation — 15 September 2026

Fortune's previous/next arrows persist the current chapter before restoring the
selected chapter. Treasure Book return closes the overlay and resumes the same
iframe; it does not reload or begin another paid turn. Node cabinet checks passed,
and phone/desktop browser checks passed previous/next boundaries, collection-tree
expansion, shelf-to-tree selection, image pages and saved-globe equality across a
Treasure Book visit. Publication is included with this navigation update. The broader
browser-close/payment-interruption limitations above are unchanged.

## Fortune result controls — 15 September 2026

The lower purple-area control repeats the centre globe's gaze/stop action. CAUGHT
results offer chapter advance (disabled at the final chapter); missed catches offer
a normal paid retry. The existing snapshot format and save/restore paths are unchanged.
Node checks cover both controls, no double charging, one charge for a retry, no charge
for chapter navigation and the final chapter boundary. Phone browser checks use
constructed caught/missed result fixtures to verify both result actions and layout.

## Copper Falls and shared navigation — 15 September 2026

Copper v6 saves and existing fixed paid-count prize thresholds are unchanged. Shared chapter navigation persists before switching; Treasures pauses the game and returns to the existing iframe. Larger drop buttons honour disabled state and show the existing maximum 60-penny debit. Chapter obstacle fixes change subsequent motion, without replacing saved coin positions.

Evidence: Node cabinet checks pass practice exclusion, wallet drop sizes, all six tray snapshots, exact paid-motion restore, deduplicated rewards, empty/failed debit handling, Iris controls and Copper peg bounds. Chromium checks pass Copper practice, paid drop, chapter selection, game-specific Treasures return, and exact frozen tray/wallet equality after reload. Phone (390×844) and desktop (1280×900) screenshots captured. Shared navigation mounts without reported script/network errors in all 33 available games. These opening checks do not certify their gameplay or exact saves. Cross-device sync, unavailable storage and every browser-close/payment-interruption case remain outside this pass.

Deployment: published as `20313a0` on 15 September 2026; Pages run `34923888461` succeeded. Live Chromium Copper checks passed practice, paid motion, game-specific Treasure return and exact frozen tray/wallet equality after reload, with phone and desktop captures.

## Copper full-handful accounting — 15 September 2026

Published as `f243b85`, included in successful Pages run `34925818491`. Copper retains v6 storage and adds per-stack counts, starting/dropped/returned ledger totals and the active handful size to saved state. Old positions and motion restore without reseeding; old saves start their ledger at their retained balance. All non-prize pieces, including legacy star tokens, retain their existing one-penny value unless carrying a stack count. Practice remains separate and awards nothing.

Validation: Node tests pass all six chapters × four drop sizes from a 300-penny purse, conservation and wallet equality at each simulated frame, compact simultaneous landing, paid mid-drop restoration, a 3,000-penny haul, and hanging-prize small/full-haul comparison. Existing wallet rejection, payout deduplication, practice and Iris checks pass. Chromium phone/desktop checks pass a full 300-penny drop, game-specific Treasures return and exact saved tray/ledger/wallet equality on reload. Browser-close/payment-write interruption and storage-failure recovery are not newly certified.

## Copper four-penny release fix — 15 September 2026

Published as `f00e2df`, included in successful Pages run `34926887898`. Existing v6 trays keep their penny positions, motion and accounting. All chapters use a four-paid-penny threshold; overdue unowned prizes are inserted and persisted during restore without a debit. Existing prize positions are retained and owned prizes are not reissued.

Node evidence: all six chapters release on their fourth single paid penny; old 48-penny saves with nine already paid receive exactly one prize on return with unchanged pennies and wallet. Reload does not duplicate the prize; stale presence flags are repaired. Existing full-haul accounting, practice exclusion, wallet, payout and Iris checks pass. Phone/desktop browser verification covers a four-penny drop, physical prize presence, Treasures return and exact saved tray/wallet restoration after reload. Remaining storage-failure and interrupted-payment limitations from the wider checklist are unchanged.

## Milky Splash visual pass — 15 September 2026

User requested retaining the existing prototype and changing visuals only. New `milky-splash-art.js` draws dairy bottles, cream/mint board tiles, flavour symbols, special/obstacle treatments, delivery crate, selected-cell feedback and short milk splashes. Cached bottle canvases require no new image downloads. The early grids are larger; drawing and input use the same updated `layoutOf`. Prototype move allowances, house timer, charging, bonus eligibility and save data remain unchanged. The planning-only Acer brief's alternative economy is not activated.

Validation: phone-sized Chromium rendered all six chapter layouts and captured desktop presentation. For every chapter, drawing leaves the complete engine state unchanged and a valid swipe through the displayed cell centres consumes exactly one move. JavaScript syntax and diff checks pass. This presentation pass does not certify the prototype's broader payment/persistence acceptance checklist or new gameplay rules. Deployment: published as `f7ce6af`; Pages run `34928723672` completed successfully.

## Milky Splash sliding controls — 15 September 2026

Published as `9440adb`; Pages run `34929579498` succeeded. Transparent board/header/footer let the original template show; banana has saturated yellow milk and vanilla ivory milk with a plum cap. Swap, rejected-swap return and post-match refill positions animate without changing resolved board data. Input is blocked during the short slide. Reduced motion resolves immediately. Accepted board state persists before animation finishes; reloading shows the committed board rather than rerolling or refunding a move. Presentation animation itself is not persisted.

Mabel opts into the shared chapter arrows. Saves add current chapter and remaining house time; switching chapters/restoring does not renew the timer or debit a penny. Beginning another purchased/included move allowance retains the existing 160-second allowance. Play replaces the Sit label.

Evidence: six-chapter phone/desktop browser render and cell-centre swipe tests, state immutability during drawing, one move consumed with repeat input blocked during a slide, and animation completion. Embedded browser checks pass chapter arrows, identical saved board and charged state after a round trip, non-increasing remaining timer, no navigation debit, Treasures return and selected-chapter restoration on reload.

Separate existing prize issue found, not altered by this control/visual pass: chapter 2 starts from an even seed and advances by 18, so resultNumber always returns odd values, while its winning set contains only even values. It cannot spawn a unique under the current normal sequence. Chapter 6 also has a parity-constrained sequence. First 100 new-tray starts produce eligible counts 50/0/30/24/20/28, not the nominal 50/40/30/25/20/15. Prize-sequence correction remains needed before further paid item testing. Existing saved prize positions and payout rules are unchanged.
