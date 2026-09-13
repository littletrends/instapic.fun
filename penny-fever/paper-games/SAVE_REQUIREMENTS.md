# Exact-state saving build checklist

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
