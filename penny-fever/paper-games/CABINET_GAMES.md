# Live cabinet games

Fortune and Copper Falls replace their canonical engine files in `stalls/`. Both open through `play.html?stall=<id>` and use the shared cabinet runtime, drawing helper and stylesheet. Other games retain the existing runtime.

Artwork lives under `assets/fortune/` and `assets/coin-pusher/` as optimized WebP files. The former separate Tent 1 deployment and duplicate source images were removed. Git history holds previous implementations.

The live purse and collection use the existing wallet bridge. Copper's first drop is practice with no rewards; later drops spend the selected amount (maximum 60 at once). Empty live purses never refill automatically. Each of the six trays saves paid motion and pending falling coins. Standalone practice uses separate storage. The sixth Copper prize uses the live mint-press collection identity.

Validation: `node paper-games/check-cabinet-state.mjs` from the Penny Fever root checks practice, multiple drop sizes, six trays, paid-motion resume, penny/prize delivery and deduplication, empty/failed debit handling, and Fortune resume. Browser validation covers the standard URLs, artwork, mobile controls, chapter changes, another unchanged game and alley entry/return.

## Shared navigation and Copper polish — 15 September 2026

Both runtimes now use `game-navigation.js` and `game-navigation.css` for chapter arrows, Treasures and Help. Embedded games share the Back to alley / host / Alley menu header. Game-specific collection selection and return keep the current iframe. Individual engines retain their existing saving capabilities; this does not complete the legacy save audit.

Copper has two rows of larger drop controls, accurate 60-penny limit labels, matching mint-press artwork, in-bounds pegs on new trays, and working divider, shelf and slow-corner chapter features. Existing saved coin positions and the v6 storage format are retained.

Prize recommendation: use a saved 1–100 random roll per eligible paid action, with independently chosen odds for each game. Do not use elapsed time: idle time and device performance should not improve the reward chance. Practice must remain excluded, and reload must reuse the saved decision. In Copper, release a prize into the tray; collecting still requires it to fall over the edge. This pass deliberately retains the existing paid-count release thresholds (4, 8, 14, 22, 32, 48); no new random prize rates have been activated.
