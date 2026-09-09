# Penny Fever — paper-world interiors

Open http://127.0.0.1:4173/penny-fever/paper-games/ for the all-stalls preview list.
The ordinary local Penny Fever alley opens these interiors at the existing
doors; Marina and Celeste retain their already-approved mounts.

See [PROGRESS.md](PROGRESS.md) for all 26 games, scope and outstanding playtests.
This batch was deliberately built without browser/manual testing.

## Files

```text
paper-games/
├── index.html + index.js     all-stalls preview list
├── catalogue.js             slugs, titles, links and availability
├── play.html + runtime.js   single-room controls and lifecycle
├── style.css                isolated paper-world presentation
├── draw.js                  Canvas2D paper props and small maths helpers
├── alley-rooms.js + .css    disposable iframe hook for the existing alley
├── stalls/<slug>.js         24 independent game engines
├── assets/<slug>.png        24 themed backdrops
├── art-prompts/<slug>.md    exact generation prompts and revision notes
├── check-files.mjs          light file/API check, no browser
└── PROGRESS.md              build ledger and handoff
```

## Engine contract

Each module exports `title`, `intro`, `instructions`, `levels`, `actions`,
`create(level, rng)`, `update(state, dt, input)`, `draw(state, draw, time, input)`
and `readout(state)`. Optional `pointer`, `action`, `key` and `dispose` hooks handle
input and cleanup. World coordinates are 900 × 1200, shown as a whole portrait
scene. Set `state.result = {title, detail}` to complete a chapter.

Do not put a second RAF/timer loop or backend calls in individual engines. The
runtime owns timing, pause, input cleanup and exit. Dynamic module imports and
router messages must stay restricted to the catalogue/bridge whitelist.

## Art

All 24 new backdrops were made with the **built-in image-generation tool**.
Existing stall sheets supplied colours/materials; the approved harbour supplied
the roomy, tactile paper-world direction. No stallholder or stall-front images
were overwritten. Interactive props are drawn/moved by game code, not baked into
the backdrop. Exact prompts are saved in `art-prompts/`; generated originals are
retained separately and runtime copies are here in `assets/`.

## Local checks

From `penny-fever/`:

```sh
node paper-games/check-files.mjs
node --check app.js
```

This does not verify gameplay or visual rendering. Follow the MotherPC prohibition
on headless Chrome/GPU testing. Keep all future work within Penny Fever, and do not
publish this branch or attach real payments as a side effect of a game change.
