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

## Milky Splash gameplay repair — 15 September 2026

Published as `9a14165`; Pages run `34933021449` succeeded. The user reported a stuck cow and requested this bug pass. This supersedes the unresolved prize-sequence issue recorded above. New tray seeds advance by one, making every value in the existing chapter winning sets reachable; the 50/40/30/25/20/15 sets themselves are unchanged. Existing boards and sealed result numbers are retained. A visible delivered treasure is honoured without a second eligibility check, including old delivered-but-denied saves. Owned treasures no longer spawn on new boards.

The cow can participate in swaps that make a match, and falls when space beneath clears. Specials are created after the original match clears, chain without deleting each other's pending effects, and distinguish genuine four/five/L/T matches from separate triples. Cream and special combinations activate through valid neighbour swaps. Obstacles stay anchored until cleared. Every playable segment refills, including pockets beneath holes. Dead-board recovery preserves the treasure's cell and first tries ordinary reshuffles; a fully obstructed legacy board may have the smallest necessary obstacle patch cleared to restore a legal move. Sour grows by at most one bottle every third accepted move, capped at the chapter's initial sour count plus three; a countdown is displayed.

Timers run only during active play, not while reading or watching the short swap animation. Timeout transitions to a saved waiting board or a completed ordinary result. Retry uses one explicit button press and one normal charge; tapping a waiting/ended board does not buy moves. Completed results, ordinary reward flags, selected chapter, remaining timer and sour cadence persist. There is a one-second save heartbeat plus action/exit saves. Legacy completed results restore without rerolling. The shared in-game navigation bar is now visible in embedded games as intended.

Evidence: `node paper-games/check-milky-splash.mjs` covers 120 seeded boards across six chapters, up to eight accepted moves per board, deterministic clone/resume, cow gravity and matching swaps, special survival/combinations, invalid/exhausted moves, dead-board recovery, refilled pockets, fixed weighted obstacles and bounded sour growth. `node paper-games/check-mabel-state.mjs` covers included first allowance, paid continuation, failed debit, exact board/RNG/move/timer restore, timer expiration, visible-prize delivery, ordinary/prize deduplication on normal return/reload, owned-prize suppression and legacy denied-prize recovery. Existing Copper/Iris cabinet tests pass.

Phone/desktop browser checks cover all six render/swipe layouts. An actual pointer-driven chapter-one playthrough delivers the cow, restores midway through the board, stops the idle timer, awards once across completed-result reload, advances chapter, and retries an expired saved round with one click and one debit. The browser tests use an isolated wallet and an explicit expired-timer fixture. These checks do not certify server-authoritative economy, cross-device saves, corrupt-storage recovery or atomic wallet/save writes across a process/power failure.


## First reward-bearing attempt — 15 September 2026

Ticket entry now counts as paid participation: every chapter's included first attempt has its treasure available, subject to the game's skill/collection action. Shared `first-prize.js` records successful reward-bearing attempts per game/chapter; failed debits and navigation do not advance it. Spawn and award number gates both honour the same first-attempt record. Subsequent attempts retain their existing number sets. Existing users without this new record receive the opportunity on their next reward-bearing attempt. Free unticketed ride practice remains prize-free; the first paid ride has the treasure. Workshop play does not record attempts. Owned-prize guards remain in each engine.

Iris uses the shared included-first-chapter charge instead of its old prize-locked first practice gaze. Copper releases on the first paid penny, retains practice exclusion, and restores overdue unowned prizes without another debit. Pinball releases its available chapter prize on the first qualifying hit of the first paid set of balls. Active older Mabel boards missing their unowned treasure gain it without replacing the board, timer or move allowance; existing treasure positions remain. Active legacy Iris gazes become prize-eligible without another charge. Other legacy in-progress games are retained rather than rebuilt; their new guarantee begins at the next reward-bearing attempt.

Evidence: `check-first-prizes.mjs` passes 22 number gates × six chapters × all 100 results, failed debit, module reload, later unchanged odds, eight rides' first paid attempts, six Mabel first boards and legacy recovery, six telescope gates, six correctly caught Iris prizes, and pinball first qualifying hits. Existing Mabel core/state and Copper/Iris cabinet suites pass, including conservation, saved positions and ordinary reward deduplication. Chromium phone check passes six first-board Mabel prizes, visible chapter controls, Treasures return and identical six-board restore; all 33 available engines mount without reported script or HTTP errors. This is targeted rule/state coverage, not full playthrough certification of all 33 games. LocalStorage/payment writes are still not atomic, and other games' broader save audit remains open.

Deployment: published as `901057c`; Pages run `34934424909` succeeded. Live Chromium phone checks passed all six first-attempt Mabel treasures, chapter controls, Treasures return and identical saved boards after reload. The wider live loading sweep encountered intermittent background/download timeouts (including Curios and Copper); those rooms opened on retry. That optional sweep was stopped before all 33 completed. All 33 loaded in the local-source browser check; no claim of a complete live loading pass or resolved network performance is made.

## Milky Splash delivery strategy — 15 September 2026

The first-prize change checked presence, not delivery feasibility. The user's subsequent playtest exposed that gap. A simple one-step route audit of 20 random treasure boards per chapter completed 20/12/12/8/0/9 within the existing allowances. This heuristic failure rate is not a proof that the other boards were impossible, but it was insufficient evidence of fair starting layouts.

Mabel now uses eight deterministic, audited starting layouts per chapter while its treasure is unowned. `milky-deliveries.js` contains their seeds and starting columns; `mabel-delivery-routes.json` records reproducible legal matching routes for verification. No solver runs in the browser. The 48 recorded routes finish in 3–7 / 4–10 / 4–7 / 5–10 / 5–7 / 5–8 moves respectively, within unchanged 24/22/20/18/16/14 allowances. Every route leaves at least six spare moves. These are demonstrated routes, not guaranteed results for arbitrary player choices or a claim of shortest paths. New unowned-prize boards always contain the prize, including later attempts; this supersedes Mabel's later-board number eligibility described above. Owned-prize replays keep ordinary layouts without another unique.

Existing treasure boards retain their positions, remaining moves, RNG and timer. Old missing-prize boards receive the missing treasure in place. If such a board had already finished or exhausted its moves without offering the prize, it receives one included allowance; the treasure's presence prevents repeated replenishment on reload, and its existing ordinary-reward receipt is retained. Existing saved boards are not replaced with the audited layouts, so their routes are not certified by the new-layout tests.

Wooden grid crates remain anchored breakable obstacles, cleared by adjacent matches or special blasts; they are not delivery items. The gold treasure remains protected from matches and blasts and is collected at the bottom row. Its artwork is larger and marked PRIZE with a down arrow; invalid swaps and the treasure itself no longer emit misleading splash bursts. Help and the board explain the obstacle/delivery distinction.

Evidence: `check-mabel-deliveries.mjs` replays all 48 routes, serializes/restores between moves, checks treasure survival and at least six spare moves, verifies crate rejection/breaking, later-attempt treasure presence, prize awards, and legacy recovery without another debit or duplicate ordinary credit. Existing Mabel state, core and first-prize checks pass. Chromium at 390×844 uses actual touch-start/move/end events to deliver all six initial chapter treasures in 3/4/6/10/6/5 swaps; it preserves a chapter-three midway save/reload and all six awarded items without duplicate credit after completed-result reload. Screenshots verify the gold prize and wooden blockers are distinct. This is not an all-browser/device or interrupted-wallet-write certification.

Deployment: published as `4055d0d`; Pages run `34935824906` succeeded. Live Chromium phone touch checks delivered and awarded all six chapter prizes in 3/4/6/10/6/5 moves, leaving 21/18/14/8/10/9 moves respectively. Mid-board reload retained the exact board and continued the recorded route; completed reload retained all six prizes and wallet balance without duplicate rewards. No script or HTTP errors were reported in this targeted live run.

## Pip's Pinball Alley — 15 September 2026

User moved to Pip after accepting Milky Splash; Mabel's unreliable swipe gesture remains a final-touch-up item, with tap-neighbour controls working. This pass changes Pip and opt-in shared runtime hooks, not Mabel's gameplay.

Pinball retains the `pennyFever.pinballAlley` v2 key and legacy score, owned-prize, token, hit and prepaid-credit rows. Each table now adds a v1 snapshot containing ball position/velocity, active-ball ownership, play/lane/drain phase, elapsed simulation time, flipper angles/velocity, bumper/target/sling/roll state, saucer hold/cooldown, lights/combo, stuck-ball tracking, deterministic RNG, award animation/receipt flags and the current chapter. Saves happen every half second, after launches/drains/rewards and through runtime pause/exit hooks. Restoring never simulates offline time. Held fingers/keys and an unlaunched spring cancel; a ball in play and its purchased allowance remain intact. Legacy rows cannot restore ball positions that were never saved, but retain prepaid balls and collection history. Standalone practice no longer reads or overwrites live table progress.

One penny still buys three balls. Prepaid balls work when the purse reaches zero; a launch returning down the shooter lane remains the same ball and is not charged/count-consumed again. Cancelled/lost touch capture and pausing while charging do not launch or debit. The generic 75-second cutoff is disabled for Pip. The stuck-ball guard no longer discards a ball near the flippers; deliberate held-flipper cradles are left alone. Saucer holds freeze the ball before their deterministic kick. First-paid-set prize eligibility is retained and lowered into the saved hit threshold, so an unused ready prize does not relock when the next set is bought. Owned inventory prizes are recognized. Existing ordinary-return probabilities, caps and drought rules are unchanged.

Pip opts into chapter arrows, remembered chapter selection, HUD/hold feedback, contextual enabled plunger labels, safe input cancellation and full Help instructions. Independent canvas pointer IDs and held buttons support both flippers together. Treasures uses the shared game-specific tree and return flow. The table fills more phone width, stays upright on desktop, uses a silver ball instead of the lightning-prize sprite, shows its chapter prize separately, and has a calmer felt surface. Rendering transforms are reversed for canvas hit testing; physics rail coordinates remain unchanged.

Evidence: `check-pip-state.mjs` verifies three-ball accounting at zero purse, same-ball relaunch, failed debit, cancelled canvas/button input, independent pointer release, exact saved ball/RNG/target continuation, six chapter selection/saves, and legacy prepaid credit. Real simulated launches reach the first qualifying prize hit in every chapter (2.35–2.93 simulation seconds, including charge time); restored hits do not duplicate the chapter award. `check-pip-practice.mjs` verifies standalone isolation. Existing first-prize and Mabel state tests pass.

Chromium phone tests use real touch events for cancelled and completed plunger holds and two-finger flippers, including releasing left while right stays held. They pass a single launch debit, game-specific Treasures return, exact paused table/wallet equality after reload, the resumed first prize, hidden house timer, all six chapter arrows and selected-chapter reload. Phone/desktop screenshots were inspected. The initial multi-touch harness used touchMove to remove a finger; replacing that with a touchEnd for the lifted contact produced the correct independent pointerup. Mabel's shared chapter/Treasures/return browser regression passes. These checks do not certify every device, unavailable storage, cross-device sync, or atomic wallet/save writes across power loss.

Deployment: prepared and verified locally; live verification pending.
