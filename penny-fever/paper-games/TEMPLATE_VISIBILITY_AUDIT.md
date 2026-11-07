# Game template visibility audit — 14 September 2026

The shared runtime now waits for the illustrated backdrop to decode before enabling play. Missing/unreadable artwork produces a visible retry error rather than silently starting on a plain stage. Gameplay canvases remain transparent. Broad decorative covers were removed while functional targets, controls, board boundaries, obstacles and puzzle pieces remain.

The existing per-game artwork mappings are retained, including the paper-diorama backgrounds and Copper’s illustrated cabinet. Ordinary grid-floor cells in Duckling Parade, Kernel Run and Opening Night are lightly tinted so their illustrated ground shows through; special cell types remain distinguishable. Text receives a small contrasting outline instead of an opaque full-board backing.

Concurrent amusement artwork/chrome commit `2abf0a8` was preserved. Its changes are separate from the remaining original-stall overlay cleanup. No gameplay update/input/create/persistence methods were changed by this overlay cleanup.

## Per-game presentation review

| Game | Host | Review scope |
| --- | --- | --- |
| `fortune` | Iris | Decorative cover/floor treatment adjusted; functional pieces retained |
| `love` | Rosalie | Already an overlay; existing functional geometry retained |
| `curios` | Digby | Already an overlay; existing functional geometry retained |
| `lookup` | Celeste | Already an overlay; existing functional geometry retained |
| `snap` | Felix | Closed for maintenance; left closed; template retained |
| `whisper` | Willa | Already an overlay; existing functional geometry retained |
| `ball-toss` | Bess | Already an overlay; existing functional geometry retained |
| `coin-pusher` | Copper | Already an overlay; existing functional geometry retained |
| `pinball` | Pip | Decorative cover/floor treatment adjusted; functional pieces retained |
| `water-gun` | Marina | Already an overlay; existing functional geometry retained |
| `milk-bottles` | Mabel | Decorative cover/floor treatment adjusted; functional pieces retained |
| `cover-the-spot` | Dot | Decorative cover/floor treatment adjusted; functional pieces retained |
| `mutoscope` | Milo | Decorative cover/floor treatment adjusted; functional pieces retained |
| `high-striker` | Magnus | Already an overlay; existing functional geometry retained |
| `catoptromancy` | Opal | Decorative cover/floor treatment adjusted; functional pieces retained |
| `bent-rings` | Ringo | Decorative cover/floor treatment adjusted; functional pieces retained |
| `plinko` | Peggy | Decorative cover/floor treatment adjusted; functional pieces retained |
| `fairy-floss` | Flossie | Decorative cover/floor treatment adjusted; functional pieces retained |
| `popcorn` | Poppy | Decorative cover/floor treatment adjusted; functional pieces retained |
| `duck-pond` | Dottie | Decorative cover/floor treatment adjusted; functional pieces retained |
| `skee-ball` | Skip | Decorative cover/floor treatment adjusted; functional pieces retained |
| `penny-pitch` | Penelope | Decorative cover/floor treatment adjusted; functional pieces retained |
| `dunk-tank` | Duncan | Decorative cover/floor treatment adjusted; functional pieces retained |
| `marquee` | Lumi | Decorative cover/floor treatment adjusted; functional pieces retained |
| `pack` | Kit | Decorative cover/floor treatment adjusted; functional pieces retained |
| `pass` | Bea | Decorative cover/floor treatment adjusted; functional pieces retained |
| `carousel` | Florence | Decorative cover/floor treatment adjusted; functional pieces retained |
| `balloons` | Nell | Decorative cover/floor treatment adjusted; functional pieces retained |
| `ferris` | Jasper | Decorative cover/floor treatment adjusted; functional pieces retained |
| `helter` | Tilly | Decorative cover/floor treatment adjusted; functional pieces retained |
| `swings` | Hugo | Already an overlay; existing functional geometry retained |
| `funhouse` | Juno | Decorative cover/floor treatment adjusted; functional pieces retained |
| `organ` | Otto | Decorative cover/floor treatment adjusted; functional pieces retained |
| `mural` | Arlo | Decorative cover/floor treatment adjusted; functional pieces retained |

## Validation

- Draft responses were intercepted in a disposable browser at the real instapic.fun URL. No localhost site or public deployment was created for these checks.
- Mobile screenshots captured for every open room, including active first-chapter boards where an extra start action exists.
- All 33 open rooms loaded their 1086-pixel-wide backdrop, started and reloaded without a room error in the final pass. Felix remains the existing maintenance exception.
- All six chapter initial renderers passed for the 33 open games: 198 successful drawing checks. This does not certify full chapter completion.
- JavaScript syntax and whitespace checks passed. Changed original-stall source before draw and from readout onward matches HEAD; gameplay methods and save structures were preserved.
- Existing favicon and main-page inline-script warnings are outside this change.

## Save and deployment limits

Reload checks confirm the presentation reopens and the background is ready. Exact-state persistence, paid rewards and full chapter completion were not certified by this rendering-only task; existing save requirements remain in force. Do not interpret this as completion of the historical persistence checklist.

The remaining changes are prepared in the live-source checkout, not published by this task. Publication remains deferred under stalls/AGENTS.md until requested. Review and stage only these files, preserving unrelated character/art work.
