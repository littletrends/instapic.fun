# Paper-world build ledger — 9 September 2026

Lorie approved building through every stall without waiting for manual playtests.
All **26** catalogue entries now open a game: **24 new engines with 72 named
chapters**, alongside the two existing approved games. This is an implementation
checkpoint, not a claim that every chapter has been played through or polished.

## Open the build

- Existing Penny Fever desktop launcher → walk up to the usual stall doors.
- Direct list: http://127.0.0.1:4173/penny-fever/paper-games/
- Individual room: `play.html?stall=fortune` (substitute a slug below).

The main alley routes the 24 replacement doors through `alley-rooms.js`.
Marina and Celeste retain their existing vendor mounts. Stall fronts, character
art, wall layouts and alley movement are not redesigned in this pass.

## Every stall

| Door slug | Host / game | What the player actually does |
| --- | --- | --- |
| fortune | Iris — Fate’s Loom | Steer a continuous thread through ordered eyelets and moving moons. |
| love | Rosalie — Heartstrings | Swing and release a pendulum heart into moving ribbon baskets. |
| curios | Digby — Clockwork Menagerie | Rotate connected tracks; guide a clockwork beetle through keys to home. |
| lookup | Celeste — A Little Starlight | Existing approved paper-observatory light puzzles, preserved. |
| snap | Felix — Paper Safari | Move a camera frame, hold focus, photograph moving paper animals. |
| whisper | Willa — Lost Letter Express | Launch and trim paper-plane letters toward matching mailboxes. |
| ball-toss | Bess — Lantern Toss | Aim ballistic throws at swinging lanterns; watch them tumble. |
| coin-pusher | Copper — Copper Falls | Drop a bounded supply into a moving, colliding tide of pennies. |
| pinball | Pip — Thunder Garden | Operate articulated flippers, a plunger and physical flower bumpers. |
| water-gun | Marina — Pocket Harbour | Existing approved water-jet boat game, preserved at its current booth path. |
| milk-bottles | Mabel — The Topsy Dairy | Throw at stacked bottles; unsupported bottles topple and fall. |
| cover-the-spot | Dot — Patchwork Moon | Arrange paper discs to cover shaped moons without exposed gaps. |
| mutoscope | Milo — The Missing Frames | Reorder film frames and see the edited animation play back. |
| high-striker | Magnus — Bellfoundry | Lift and release a mallet, controlling the weight’s peak for each bell. |
| catoptromancy | Opal — Looking-Glass Garden | Navigate two mirrored lanterns through corresponding garden gaps. |
| bent-rings | Ringo — The Ring Orchard | Throw spinning rings with height, depth and moving peg targets. |
| plinko | Peggy — Peggy’s Marble Mill | Tilt a marble through physical pegs and switchable delivery gates. |
| fairy-floss | Flossie — Cloud Atelier | Wind coloured sugar at the right radius and speed into layered clouds. |
| popcorn | Poppy — Popcorn Symphony | Work the bellows and catch kernels while managing kettle heat. |
| duck-pond | Dottie — Duckling Parade | Lead a following procession of ducklings around pond obstacles. |
| skee-ball | Skip — Moonbow Alley | Aim, roll over a ramp and land airborne balls in scoring bowls. |
| penny-pitch | Penelope — Wishing Wells | Time water contact to skip a penny through three wishing rings. |
| dunk-tank | Duncan — Splashworks | Throw at mechanical latches; release a wind-up duck into the water. |
| marquee | Lumi — Light the Night | Catch travelling lights on their lantern beats to illuminate the boardwalk. |
| pack | Kit — The Impossible Suitcase | Rotate and fit awkward stitched treasures in three authored packing puzzles. |
| pass | Bea — Backstage Run | Walk through shifting curtains, avoid sweeping lights, collect keys and escape. |

## Isolation and lifecycle

- Fresh code, art and prompts live under `paper-games/`.
- Only existing PF `app.js` and `index.html` were edited for integration.
- Earlier vendor implementations remain on disk, but their script tags are no
  longer loaded for the 24 replacement rooms. There is no second old engine
  running underneath a new room.
- One iframe is mounted on entry and removed on exit. Returning to the alley uses
  the existing router and world instance, rather than nesting another carnival.
- New room animation paints at up to 30 fps, caps device pixel ratio at 1.5, pauses
  when hidden/blurred, and disposes observers/listeners/canvas on page exit.
- Only the chosen room’s backdrop loads during an alley visit. Catalogue
  thumbnails are lazy-loaded. Full-resolution backdrops total about 68 MB;
  phone delivery optimisation remains a later pass.
- The bridge checks message origin/source frame and accepts only known game IDs.
  New game pages forbid backend connections using their own CSP.
- CSS/iframe separation is **not** a security sandbox or private authentication.
  Local preview and noindex do not make a future public URL private.

## Payments, collections and production

New games are free practice. No Square, tickets, account state, persistent wallet,
collection writes, real prizes or payment hooks are called. Copper’s coin results
are confined to its practice round and do not credit the carnival wallet.
Existing carnival entrance behaviour is unchanged.

No booth software, MotherPC service, port 6000, OS, fleet deployment, Acer sync or
production website publishing was performed. Do not use a production deployment
script to back up this experimental branch.

## Checks completed / checks deliberately deferred

Completed: JS syntax, registry uniqueness, all 24 engine interfaces, chapter
declarations, local module/art/prompt files, all 26 entry doors, and replacement
router whitelist. `node paper-games/check-files.mjs` is lightweight and creates
no browser or game simulation.

Deferred at Lorie’s request: browser rendering, touch feel, difficulty balance,
chapter solvability by actual play, repeated entry/exit playtests, phone performance
and accessibility playtests. No headless Chrome/GPU/browser automation was run.

## Checkpoints

Individual game batches have local Git commits from `003960a` through `97f4fc4`.
`3bb1b2f` preserves the already-existing alley/router HTML state before this pass’s
thin routing changes. Do not revert that checkpoint to undo new games; it includes
pre-existing work. Other dirty user/agent files have been left alone.

## Next pass

Lorie’s hands-on round: try each game from its actual door, choose the keepers,
note steering/timing problems, then refine those specific engines. Later work can
add the real 160-piece curio artwork/rewards, optional sound, saved progress,
lighter phone assets and an economy. None is silently connected here.
