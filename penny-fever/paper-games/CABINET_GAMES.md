# Live cabinet games

Fortune and Copper Falls replace their canonical engine files in `stalls/`. Both open through `play.html?stall=<id>` and use the shared cabinet runtime, drawing helper and stylesheet. Other games retain the existing runtime.

Artwork lives under `assets/fortune/` and `assets/coin-pusher/` as optimized WebP files. The former separate Tent 1 deployment and duplicate source images were removed. Git history holds previous implementations.

The live purse and collection use the existing wallet bridge. Copper's first drop is practice with no rewards; later drops spend the selected amount (maximum 60 at once). Empty live purses never refill automatically. Each of the six trays saves paid motion and pending falling coins. Standalone practice uses separate storage. The sixth Copper prize uses the live mint-press collection identity.

Validation: `node paper-games/check-cabinet-state.mjs` from the Penny Fever root checks practice, multiple drop sizes, six trays, paid-motion resume, penny/prize delivery and deduplication, empty/failed debit handling, and Fortune resume. Browser validation covers the standard URLs, artwork, mobile controls, chapter changes, another unchanged game and alley entry/return.
