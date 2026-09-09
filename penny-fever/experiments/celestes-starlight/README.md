# Celeste’s Starlight — movement study 03

9 September 2026. Lorie liked Marina’s harbour artwork and saw potential in the
gameplay, while finding the jet steering takes some learning. She asked to save
that version and move to another booth in the same visual direction.

Marina’s playable build remains `a89a91d`, with her feedback preserved in commit
`4d053f2`. No harbour code or art was changed by this experiment.

## Open this local test

http://127.0.0.1:4173/penny-fever/experiments/celestes-starlight/

The existing preview serves it. No new server, installation or external service.
This is not connected to the live site, wallet, booth payment, saved collectibles
or the old Look Up engine. No alley/stall front/turnaround has been replaced.
`noindex` is not privacy protection: this is kept on the local preview and is not
published. It should not be promoted automatically with an unrelated site change.

## The game

Celeste’s Look Up booth becomes a little moonlit paper observatory. The whole
work floor stays visible. This is a **layered Canvas2D game**, not a true 3D room.

- Tap a brass glass to turn it one notch clockwise. The silver-blue line is the
  actual reflecting plane; the brass ring is its physical-looking mounting.
- Hold and turn around the ring for continuous aiming, then release to snap to
  one of eight meaningful mirror orientations. Cancel/lose focus to put it back.
- Or choose I / II / III etc, then use ↶ / ↷. Keyboard ↑ ↓ selects, ← → turns,
  Enter sends the comet when ready, and P pauses.
- Light every hanging star **simultaneously** and reach the golden sky bell.
  Decorative star print on the background does not count as a target.
- When the path is complete, send the comet. It follows that exact ray path,
  then a small folded-paper constellation creature appears: swallow, fox or hare.
- Three authored puzzles use three, four and five mirrors. The second introduces
  diagonal crossings; the third adds a solid moon casting a real beam obstruction.
- Undo is available. Celeste’s hint selects the next misaligned glass and explains
  its direction and the number of notches; it never silently changes the puzzle.

No deadline, cash, demo coins, random rewards or paid hints. Every chapter can be
selected for testing. Turns/hints are feedback, not a grading gate. Creatures are
temporary **playtest souvenirs only**; no Cabinet inventory is created or saved.

## Art

`assets/observatory-v1.png` is a new built-in image-generation result, using:

1. Celeste’s approved `design-concepts/2026-09-08/turnarounds/04-lookup.png` for theme.
2. Marina’s saved harbour image for open composition and detailed paper materials.

Full final prompt and generation method: `ART_PROMPTS.md`. The source result remains
in Codex generated_images, and a final copy is here in the project.

`assets/celeste-reference.webp` is an unchanged copy of the existing approved
`assets/restyle/stalls/sheets/04-lookup.webp`; CSS frames her portrait. Source art
was not cropped, redrawn, recoloured or overwritten on disk. The gameplay mirrors,
telescope, targets, moon, rays, comet and folded-paper creatures are code-native.

## Files and safety

- `model.js`: finite-segment reflection maths, circle occlusion, bounded ray tracing,
  authored paths, gesture/undo state and comet travel. Rays are traced on input
  changes, not repeatedly every display frame. Maximum 32 segments per trace;
  undo holds at most 100 entries. No puzzle search runs in the browser.
- `scene.js`: one Canvas2D drawing surface for moving props; static environment is
  a separate image layer. No loop, timers, listeners or imports beyond the model.
- `app.js`: one page-owned 24 Hz animation loop plus immediate input redraws, display-pixel-ratio
  cap of 1.5, input cancellation, focus/visibility handling, help and sound opt-in.
- `index.html` / `starlight.css`: separate, page-scoped presentation and controls.

Ready is idle. Hidden tabs / lost window focus pause active play and comet travel,
and require an explicit resume. Normal exit/navigation cancels the animation,
aborts listeners, disconnects resize observation, clears canvas and closes audio.
Back/forward cache returns remain paused. Opening a link in another tab does not
dispose the current page. Winning animation stops after three seconds.

Reduced motion removes decorative flutters and beam pulses, and resolves the
earned comet sequence immediately. It also lets the drawing loop sleep between
inputs. Essential hand-controlled aiming remains.
Audio is off until the user chooses it; only brief procedural chimes, no downloads.

No WebGL, remote fonts, fetches, camera, analytics, polling, persistent storage,
payment API, booth software, MotherPC service, new OS configuration or dependencies.

## Verification and next playtest

```bash
node --check experiments/celestes-starlight/model.js
node --check experiments/celestes-starlight/scene.js
node --check experiments/celestes-starlight/app.js
node ops/check-celestes-starlight.mjs
```

CPU suite checks ray intersections and reflection paths; solutions reached through
ordinary nudge/hint controls; all 512 first-puzzle angle combinations; 2,000 seeded
angle arrangements; shadows; cancelled turns; undo bounds; comet/reduced motion;
draw-call contracts; local references; input, pause, help, hidden tab, cache and
exit handlers with DOM/animation stubs. Those stubs are not screenshots.

**No headless/automated browser or GPU test was launched on MotherPC**, per
`ops/ATTN_NO_HEADLESS_CHROME.md`. Lorie’s normal Chromium/phone playtest is still
needed for actual visual layout, touch feel, apparent scale, performance and fun.

Please test whether tapping feels immediately understandable, whether the silver
glass and ray agree visually, and whether the constellation reveal feels rewarding.
This is a new design direction, not a claim that all the existing games are fixed.

## Recovery / scope

Only this new directory, `ops/check-celestes-starlight.mjs`, and the harbour feedback
note belong to this pass. The existing dirty worktree is preserved. Local Git
checkpoints and a recovery archive under the ignored `.local-backups/` keep the work.
No GitHub push, live publication, Acer sync or physical-booth deployment in this pass.
