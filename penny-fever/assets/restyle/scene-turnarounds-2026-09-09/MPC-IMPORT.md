# Mother PC handoff — scene art only

The Mother PC game build has newer game changes than this Acer checkout. Copy **only** the new `assets/restyle/scene-turnarounds-2026-09-09/` folder into the matching location in the current Mother PC project. Do not mirror the full Acer project over the Mother PC build.

This folder is self-contained. Open its `index.html` directly for review. No installation or web server is required by the gallery. The game does not reference these files yet; integration should be performed against the current Mother PC game code.

Use the per-asset paths in `manifest.json`. `pairedId` connects a vendor or attendant to their stall or attraction. Aura’s poses are grouped under `aura/`, alongside `aura/ticket-booth/`.

Prefer the individual directional PNGs for directional sprites. If using atlases, read their explicit frame rectangles rather than guessing or passing the complete sheet as a single texture. The frame size is 512 × 512; the 1024 × 1024 atlas order is front, left, back, right, row by row.

Keep vendors and structures as separate objects so position, walking clearance and camera-facing placement can be adjusted independently. Scale each kind appropriately in the world; image dimensions do not imply world dimensions.

Load images with their alpha channel intact. Do not convert to JPEG, flatten over white or colour-key cream clothing. Use the engine’s existing sprite alpha handling and test edges against the actual alley backgrounds.

The files show four discrete views, not full 3D geometry. Fine lines and small decorative gaps originate in approximately 1536-wide multi-view concept sheets, so avoid treating these exports as infinitely detailed close-up textures.

The original concept boards are retained elsewhere as references. The earlier transparent item pack is separate at `assets/restyle/items-turnarounds-2026-09-09/`.

No game integration, Mother PC transfer or browser/GPU playtest was performed as part of preparing this art pack.
