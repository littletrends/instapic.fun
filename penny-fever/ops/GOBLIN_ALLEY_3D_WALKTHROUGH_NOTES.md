# Alley → 3D walkthrough (engineer north star, not a build ticket yet)
Lorie: we’re a mile from a 3D walk-through game. Every sheet should aim that way.

## What “walkthrough” means here
- Player moves through a **continuous sideshow alley** (tents L/R, ground path, night lights).
- Cabinets are **places you walk up to**, not app icons.
- NPCs/lines first as props; real players later in the same space.
- Enter tent mouth → interior run → exit back to alley with depth stamp.

## Don’t paint into nested-app corner
- Avoid UI that only makes sense as separate “mini-app cards”
- Vestibules = physical tent mouths in world space
- Result tickets can be 2D overlays; the *world* stays the alley
- Foyer 3D hall is the embryo — grow it into a path with depth, not a carousel only

## Engine / world split
- **World layer:** walk, approach, barker VO, queue silhouettes, day/night
- **Cabinet layer:** depth-run games (Heat Run, Ball Toss, etc.) full screen or in-tent camera
- Shared: demo coins, bestDepth, Fever Run pathing later (doors as nodes on the alley graph)

## Near-term (while games deepen)
- Keep hall camera / door cards spatial
- Name routes like places (`#alley`, `#tent/love`) when convenient
- Batch art = stall exteriors that fit a strip, not floating portraits
- One coin economy across the whole alley

## Later
- Bumper cars / water gun as **lane objects in the alley**
- Kill Screen 256 as end-of-pier myth machine
- Multiplayer presence in the same walk space

Goblin keeps feeding cabinet guts that assume this world.
