# New paper game interiors — ongoing build

Lorie’s instruction, 9 September 2026: work through every stall, one at a time;
continue without manual playtest approvals. Keep the look of Marina and Celeste.

Scope: Penny Fever only. No physical booths, OS, payment integration, live publish,
fleet sync or changes to current user-owned vendor implementations. Existing
versions remain recoverable. Fresh interiors are reached through the preview list.

Preview: http://127.0.0.1:4173/penny-fever/paper-games/

`catalogue.js` is the live build ledger: `ready` means module and artwork exist,
not that Lorie has accepted the gameplay. No automated browser/GPU playtests.
Only syntax and local-reference checks during this pass, as requested.

## Completed before this batch

- Marina — Paper Harbour (`a89a91d`, feedback checkpoint `4d053f2`).
- Celeste — A Little Starlight (`7f9b235`).

## Queue

Iris → Rosalie → Digby → Felix → Willa → Bess → Copper → Pip → Mabel → Dot →
Milo → Magnus → Opal → Ringo → Peggy → Flossie → Poppy → Dottie → Skip →
Penelope → Duncan → Lumi → Kit → Bea.

Each gets its own themed art and game module. Shared code is limited to canvas
primitives, controls, page lifecycle, and deliberately reusable physics helpers.
No repeated reskin of one game engine is the plan.
