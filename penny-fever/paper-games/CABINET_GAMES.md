# Live cabinet games

Fortune and Copper Falls replace their canonical engine files in `stalls/`. Both open through `play.html?stall=<id>` and use the shared cabinet runtime, drawing helper and stylesheet. Other games retain the existing runtime.

Artwork lives under `assets/fortune/` and `assets/coin-pusher/` as optimized WebP files. The former separate Tent 1 deployment and duplicate source images were removed. Git history holds previous implementations.

The live purse and collection use the existing wallet bridge. Copper's first drop is practice with no rewards; later drops spend the selected amount (the full selected amount, with no 60-penny cap). Empty live purses never refill automatically. Each of the six trays saves paid motion and pending falling coins. Standalone practice uses separate storage. The sixth Copper prize uses the live mint-press collection identity.

Validation: `node paper-games/check-cabinet-state.mjs` from the Penny Fever root checks practice, multiple drop sizes, six trays, paid-motion resume, penny/prize delivery and deduplication, empty/failed debit handling, and Fortune resume. Browser validation covers the standard URLs, artwork, mobile controls, chapter changes, another unchanged game and alley entry/return.

## Shared navigation and Copper polish — 15 September 2026

Both runtimes now use `game-navigation.js` and `game-navigation.css` for chapter arrows, Treasures and Help. Embedded games share the Back to alley / host / Alley menu header. Game-specific collection selection and return keep the current iframe. Individual engines retain their existing saving capabilities; this does not complete the legacy save audit.

Copper has two rows of larger drop controls, accurate 60-penny limit labels, matching mint-press artwork, in-bounds pegs on new trays, and working divider, shelf and slow-corner chapter features. Existing saved coin positions and the v6 storage format are retained.

Prize recommendation: use a saved 1–100 random roll per eligible paid action, with independently chosen odds for each game. Do not use elapsed time: idle time and device performance should not improve the reward chance. Practice must remain excluded, and reload must reuse the saved decision. In Copper, release a prize into the tray; collecting still requires it to fall over the edge. This pass deliberately retains the existing paid-count release thresholds (4, 8, 14, 22, 32, 48); no new random prize rates have been activated.

## Full handfuls — 15 September 2026

A 300-penny purse offers 1 / 75 / 150 / 300. The full amount is debited once and lands as one compact handful, followed by one aimed shove. Large handfuls are represented as up to 24 counted physical stacks, not a gradual hopper queue. Every stack retains its exact penny value, contributes weight to collisions and pays its full count when it falls. Stack thickness is visible; the machine total includes airborne pennies. This is an arcade stack model, not an individually simulated 3D coin solver.

New chapter layouts keep fixed starting quantities: Shallow Tray 24, Split Falls 21, Peg Rain 21, Double Shelf 10, Crooked Crown 10, Great Copper Fall 8. Existing saved layouts are never reseeded. Divider, pegs, upper shelf and slow corner distinguish the later patterns.

Accounting: current penny count + returned pennies = starting balance + dropped pennies. Existing saves establish their accounting baseline from their current coins; historical paid counts and prize state remain intact. Prize objects are excluded from penny totals. No hidden drain or forced refund percentage exists. The aimed shove scales with the square root of handful size, so more pennies increase force with diminishing returns.

Deterministic fresh-tray centre-drop checks with 300 pennies returned 8 / 7 / 5 / 4 / 4 / 3 pennies, retaining the balance. These examples are not return-to-player rates or a completed economy balance study: an already loaded tray and different aim can pay differently. A hanging-prize fixture is won with an aimed full haul but not a single penny. Prize release thresholds remain unchanged.

## Four-penny prize release — 15 September 2026

Supersedes the earlier 4/8/14/22/32/48 thresholds: every unowned chapter prize releases by the fourth paid penny. Existing saved thresholds are updated without resetting coins or paid counts. A previously started chapter with four or more paid pennies releases its overdue prize on return, with no additional debit. An existing physical prize is retained; an owned prize is not repeated. A stale on-tray flag with no physical prize is reconciled against the actual pieces.

The one complimentary practice drop is still once per Copper save, not per chapter; practice remains uncharged and excludes prizes. Persistent status distinguishes free practice, remaining paid pennies, prize on tray, and treasure already collected. The prize draws above the penny pile with an outline. Winning still requires pushing it over the edge.
