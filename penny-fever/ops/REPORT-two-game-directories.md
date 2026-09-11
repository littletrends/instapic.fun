# Report: two game directories in Penny Fever

**Date:** 11 September 2026  
**Machine:** Mother PC (`motherpc`)  
**Scope:** Why **All games** and alley **Map** look like two different game lists, and whether that explains mixed-up stalls (Copper Falls and others).

---

## Verdict

There is **one live play engine** for a booth once you are inside it: the paper-world iframe (`paper-games/play.html`).

There are **several leftover directories and name lists** for finding those booths. They do not share a catalogue. They still use the old carnival titles on the map and in `index.html`, and the new paper-world titles on All games / workshop. Old interiors are still in the page, hidden under CSS.

That is not two games fighting on the same click. It **is** two (really four) ways of listing the same booth ids, plus a buried previous generation of games. That is enough to produce mixed plates, mixed copy, and “which Copper Falls is this?”

---

## What the two buttons do

### All games (on the stall chrome)

- **Control:** link labelled “All games” in `world/paper-game-booths.js`
- **Opens:** `game-links.html` (leaves the alley)
- **Content:** a **hand-written static list** of paper worlds
- **Actions per stall:**
  - **Play game** → `paper-games/play.html?stall=…` (workshop: free, no tickets, no pocket)
  - **Enter booth** → alley hash `#cabinet/…`

This list is **not** generated from `catalogue.js`. It can drift. It currently lists the original 26 stalls plus workshop extras (Calliope, Nell) and the experiment studies. It does not list the later ride rooms (ferris, helter, swings, funhouse, organ, mural) as first-class rows.

On narrow screens the All games link is hidden (`paper-game-booths.css`: `.paper-game-bar a { display: none }`).

### Map (in the sideshow alley HUD)

- **Control:** button labelled **Map** in `world/alley.js` (`#pfAlleyMapOpen`)
- **Opens:** an overlay on the 3D walk (`#pfAlleyMap`)
- **Art:** `assets/restyle/maps/sideshow-alley-map.webp`
- **Legend names:** `STALLS` in `alley.js` — the **old carnival names** (Coin Pusher Shelf, Water Gun Duel, Love Tester, …)
- **Clicking a stall name:** walks the player to that booth **and immediately opens the cabinet** (`walkToMapPlace` → `enterStallById` → `location.hash = cabinet/<id>`)

Map is a **place finder that also launches play**. It is not a second workshop. The names on it are from the previous game generation.

---

## The other two lists (easy to miss)

| List | File | Source of names |
| --- | --- | --- |
| Workshop grid | `paper-games/index.html` + `index.js` | Live `catalogue.js` |
| All games | `game-links.html` | Frozen HTML |
| Alley Map | `alley.js` `STALLS` | Old carnival titles + barkers |
| Look card / HUD nearest | same `STALLS` | Old carnival titles |

Treasure-book midway art (`world/items/midway.js`) reads `catalogue.js`, so the pocket uses paper-world titles. The walk uses alley titles. The player sees both.

---

## Same booth id, two titles

Shared id (e.g. `coin-pusher`) is the only stable join. Display names disagree everywhere else.

| id | Map / alley / old cabinet | Paper world (catalogue) |
| --- | --- | --- |
| fortune | Mystic Tent | Iris’s Reading |
| love | Love Tester | Heartstrings |
| curios | Digger’s Vault | Clockwork Menagerie |
| lookup | Star-Gazing Tent | A Little Starlight |
| snap | Flash Booth | Paper Safari |
| whisper | Gossip Booth | Lost Letter Express |
| ball-toss | Barely-Fit Toss | Lantern Toss |
| **coin-pusher** | **Coin Pusher Shelf** | **Copper Falls** |
| pinball | Pinball Alley | Thunder Garden |
| **water-gun** | **Water Gun Duel** | **Paper Harbour** |
| milk-bottles | Weighted Bottles | The Topsy Dairy |
| cover-the-spot | Cover-the-Spot | Patchwork Moon |
| mutoscope | Mutoscope Hood | The Missing Frames |
| high-striker | High Striker | Bellfoundry |
| catoptromancy | Catoptromancy | Looking-Glass Garden |
| bent-rings | Bent Ring Pegs | The Ring Orchard |
| plinko | Plinko Pegboard | Peggy’s Marble Mill |
| fairy-floss | Fairy Floss Wheel | Cloud Atelier |
| popcorn | Popcorn Kettle | Popcorn Symphony |
| duck-pond | Duck Pond Hook | Duckling Parade |
| skee-ball | Skee-Ball Alley | Moonbow Alley |
| penny-pitch | Penny Pitch | Wishing Wells |
| dunk-tank | Dunk the Barker | Splashworks |
| marquee | Boardwalk Lights | Light the Night |
| pack | Night Kit | The Impossible Suitcase |
| pass | Backstage Flap | Backstage Run |

Copper Falls is the loud example: Map says **shelf / greed / get buried**; All games says **Copper Falls / tide of pennies**. The playable room is the paper pusher. The plate that used to sit under it was a mill-canal, from the same empty-diorama batch as Marina’s harbour.

---

## What actually plays when you enter a booth

1. Alley sets `#cabinet/<id>`.
2. `paper-game-booths.js` registers a vendor for each ready catalogue stall (except `workshop` extras).
3. It injects a full-screen `.paper-game-room` into `#cabinet-<id>` and loads  
   `paper-games/play.html?stall=<id>&room=alley`.
4. CSS (`.paper-game-cabinet > :not(.paper-game-room)`) **hides** the old interior that still lives in `index.html`.

So the game you play from the alley **is** the paper world, not the old 3D depth-run — **if** the overlay mounts.

If that script is late, cached, or the cabinet id is missing, the old interior can flash or remain: Coin Pusher Shelf canvas, “cash out or get buried,” greed floors, Water Gun Duel copy, etc.

Those old interiors are still in `index.html` (fortune through dunk-tank, plus later ride stubs). They still pull CSS such as `vendors/coin-pusher.css` and `vendors/runKit.js`. They are dormant, not deleted.

---

## Two play economies on the same stall files

| Mode | URL | Economy |
| --- | --- | --- |
| Workshop | `paper-games/play.html?stall=coin-pusher` | Free practice. No pocket. Copper’s trays are not the alley save. |
| Alley | same file with `&room=alley` | Tickets / pennies. Copper, Pip, Mabel, Skip persist machine state. Prizes can go to the treasure book. |

All games offers both. Map only opens alley mode. A player who “plays Copper” from All games is not in the same save as the alley machine.

---

## Further leftovers

- **`experiments/`** — original Celeste observatory, Marina harbour, Digby vault. Catalogue used to deep-link Celeste and Marina here; they now share the treasure runtime, but the study pages still exist and still say they have not replaced the stall games.
- **Ride rooms** (`carousel`, `balloons`, `ferris`, `helter`, `swings`, `funhouse`, `organ`, `mural`) live in `catalogue.js`. Alley map does not list them as the original 26. `RIDE_GAMES` in `alley.js` remaps amusement ids onto those play ids when a cutout is entered.
- **`vendor-designs.js`** still uses old invitations (“THE COPPER COUNTER”, “READY · AIM · SPLASH”).

---

## Does this explain the weirdness?

**Yes, as a naming and leftover-asset problem, not as two physics engines colliding.**

Typical symptoms this architecture produces:

1. Map and All games disagree on what the booth is called and what it is for.
2. Paper-world art was generated as empty diorama plates; some plates (Copper’s canal) belong to a different metaphor than the later game (three-tray pusher) or the booth front (penny-falls cabinet).
3. Copy drifts independently: alley barkers still say “get buried”; workshop readout had “at the docks”; paper world is Copper Falls.
4. Workshop vs alley saves look like “the game forgot” or “two Coppers.”
5. Old cabinet HTML/CSS still loads, so a cache miss can show Coin Pusher Shelf / Water Gun Duel for a moment.

---

## Status (same day)

First slice done: catalogue names on the Map and look card; Map walks only; All games / game-links.html read `catalogue.js`. Old `#cabinet-*` interiors are still in `index.html`, hidden.

## Recommended fix (not done in this report)

Keep one public catalogue: `paper-games/catalogue.js`.

1. Point **All games** at the workshop grid (`paper-games/index.html`), or generate `game-links.html` from `catalogue.js` so it cannot freeze.
2. Drive Map labels, look-card titles, and HUD nearest-name from that catalogue (host + paper title), not from `STALLS.name`.
3. Make Map **walk only**; keep **Enter** on the booth card so Map is a map.
4. Delete or stub the old `#cabinet-*` interiors in `index.html` once the paper overlay is the only player, so a missed class cannot resurrect Coin Pusher Shelf.
5. One economy story in the chrome: alley vs free workshop, labelled as such.

Smallest useful first step: **one name per id everywhere**, starting with Copper Falls / Paper Harbour / Heartstrings.

---

## Files to treat as the conflict

| Role | Path |
| --- | --- |
| Live paper catalogue | `paper-games/catalogue.js` |
| Frozen All games page | `game-links.html` |
| Alley map names | `world/alley.js` (`STALLS`) |
| Alley play mount | `world/paper-game-booths.js` |
| Hide old interiors | `world/paper-game-booths.css` |
| Old interiors still in DOM | `index.html` `#cabinet-*` |
| Old vendor kit still loaded | `vendors/runKit.js`, `vendors/kit.js`, stall CSS |
| Workshop grid | `paper-games/index.html` |
| Studies | `experiments/` |
