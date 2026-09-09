# Marina’s Paper Harbour — movement study 02

9 September 2026. Lorie approved a fresh Marina sailboat experiment after the
wider Pinball test still felt like an old box game, with an orientation mismatch.
**Pinball has not been replaced or changed by this pass.** Neither have the alley,
stall fronts, vendor turnaround artwork, other games or any working Instapic systems.

## Open the local test

http://127.0.0.1:4173/penny-fever/experiments/brasswater-harbour/

Uses the existing development preview. No new service or installation. This is
not linked from production or the alley. `noindex` is included but is **not access
control**; keeping it on the local preview, and not publishing, is the boundary.

## What to test

The entire harbour stays visible. This is a layered 2D / shallow-perspective paper
world, **not a true-3D environment or new model of the stall**.

1. Launch, then hold in the water behind the boat. The spray pushes it away.
   Move the jet around it to steer; release between bursts to refill the tank.
2. Collect the three floating letters in any order. Boats have momentum, drag,
   collisions, a turning hull, independent upright mast/sails, bobbing and a wake.
3. Reach the golden berth at the top. Release the jet and hold the anchor, or
   Space, to settle for 1.1 seconds. Fast fly-throughs do not deliver the letters.
4. Try all three voyages without unlocking/paying: island slalom; moving boom
   gates; ferry plus a swirling current. The gate and ferry pictures use the same
   geometry/timing as their collision shapes.
5. Keyboard alternative: focus the water; arrows / WASD create steering jets.
   Space anchors; P pauses. Touch/mouse cancels and lost focus release input.

There is no deadline or failure fee. Voyage seals are **temporary feedback only**:
one for delivery, another for at most four bumps, another for the published par.
They do not create collectibles, coins or saved achievements. The final postcard
offers replay/next voyage; all three courses are also directly selectable.

Look especially at: perceived distance, whether the boat is readable on a phone,
how easy it is to steer with a finger, whether docking makes sense, and whether
this direction is actually more appealing than the old boxed games. Those remain
human playtest questions; passing a simulation is not proof of fun.

## Art and implementation

- `assets/harbour-v1.png`: new illustrated paper harbour, built-in image-generation
  tool. Approximately 2.9 MB. Prompt, references and generation method are in
  `ART_PROMPTS.md`. Original generated file also remains in Codex generated_images.
- `assets/marina-reference.webp`: **unchanged copy** of the existing approved
  `assets/restyle/stalls/sheets/10-water-gun.webp`; CSS only frames her portrait.
  No character redraw, sheet edit, transparency cleanup or source overwrite.
- `scene.js`: moving code-native paper boat/sails, islands/palms, letters/buoys,
  gate hinges, ferry, jet arcs/droplets, limited wake/ripples and delivery confetti.
  The stage image is a separate static DOM layer, not redrawn every frame.
- `model.js`: pure authored courses, forces, drag, capsule/circle collisions,
  pressure, collection and docking. 120 Hz substeps, capped elapsed time; no
  external physics package and no state read from an existing game.
- `app.js`: one page-owned animation loop, inputs, lifecycle, responsive sizing,
  optional procedural chimes, help, pause and results. No imports from runKit,
  app.js/router, vendor engines, wallet or any Instapic API.
- `index.html` / `harbour.css`: a full-harbour stage with a paper postcard and
  compact controls, not a nested cabinet modal. The notebook sits beside it on
  desktop and below it on narrow phones. No crop/zoom to fill the viewport.

## MotherPC safety

No WebGL, GPU browser automation, polling, service worker, downloads, remote font,
analytics, camera, real payments, accounts, localStorage or sessionStorage.
Canvas2D paints at most 30 times/sec; display pixel ratio is capped at 1.5. Wake
points (20), rings (16), confetti (34) and time substeps (12) are capped.

Ready is a still scene. Pause, page hiding and lost focus stop play; return requires
an explicit resume. Win animation stops after three seconds. Exit/navigation aborts
listeners, cancels the loop, disconnects the size observer, closes audio and clears
the canvas. Back/forward-cache restores remain paused. Audio is off until selected.
Reduced motion removes decorative bobbing, wakes and confetti, not essential
player-controlled boat movement or moving course obstacles.

## Verification

From the Penny Fever directory:

```bash
node --check experiments/brasswater-harbour/app.js
node --check experiments/brasswater-harbour/model.js
node --check experiments/brasswater-harbour/scene.js
node ops/check-brasswater-harbour.mjs
```

The CPU suite covers input force direction, refilling, anchor, early/fast docking,
rate independence, collision safety, bad input, elapsed-time caps, three complete
voyages using only ordinary jet/anchor controls, seeded stress, bounded effects,
Canvas draw-call contracts and local file/reference isolation.
The real page handlers also run against CPU-only DOM/animation stubs to check
launch, cancellation, help, pause, visibility, course resets and final disposal.

**No automated browser was opened.** It is prohibited on MotherPC by
`ops/ATTN_NO_HEADLESS_CHROME.md`. Browser layout, pointer feel, actual frame rate
and aesthetic quality still need Lorie’s normal Chromium / phone test. Canvas
call stubs are not screenshots and must not be described as visual validation.

## Scope / recovery

Only this new directory plus `ops/check-brasswater-harbour.mjs` are part of this
pass. Nothing was changed outside Penny Fever. No publication, Git push, booth
deployment or Acer sync. Existing dirty files / art cleanup belong to their owners.
Existing legacy game/prepared asset references elsewhere may still need the
separate cleanup pass; this prototype has its own copied assets and no dependency
on those missing directories. It is not a repair of the entire arcade.

A local recovery archive is kept in Penny Fever’s ignored `.local-backups/`.
A path-scoped local Git checkpoint contains only this prototype and its test;
other in-progress artwork and code changes are left uncommitted and untouched.
Removing this experiment removes the test, with no saved-state migration needed.
