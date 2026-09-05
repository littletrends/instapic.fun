# Aura's Penny Fever — private preview

Isolated arcade under `instapic_fun/penny-fever/`. Not linked from live `index.html`. No Square, no analytics, no Mother PC APIs. CSP `connect-src 'none'`. `noindex`.

## Preview

```bash
# from magic_mirror_v1/instapic_fun (or any static server)
npx --yes serve -l 4173
# open http://127.0.0.1:4173/penny-fever/  then #foyer
```

## Playable

1. Discovery door → foyer
2. **One Fortune** — free once per Darwin day → ticket stub + Cabinet curio
3. **Cabinet of Curios** — Alley Ephemera + Machine Guts
4. **Love Thermometer** — Heat Run until DEATH (miss the pink band). Depth = Heat Stage. Optional Practice · 3 rounds (no depth stamp).
5. **Look Up, Darling** — device orientation or practice mode
6. **SNAP! Freeze** — timing tap
7. **Whisper Charm** — one-word charm → Alley curio
8. **Showman’s Pass** — demo unlock (no Square) until midnight Darwin
9. **Barely-Fit Ball Toss** — lead moving holes; racks before a 3-miss streak
10. **Coin Pusher Shelf** — drop pennies, walk away or get buried
11. **Pinball Alley** — one-thumb flipper; balls + table chapter
12. Dev reset clears `localStorage` key `pennyFever.v1`

## Art

- Proprietor and reactions: `assets/game/Aura_Reactions/`
- Solo proprietor artwork: `assets/prepared/welcome-proprietor.webp` and `assets/game/Aura_Reactions/`
- Cabinet states, curios and loops: `assets/game/` (web derivatives)
- Full-quality organised originals remain outside the website repository in Downloads.

## Rules

- Demo coins only until Aura calls opening night
- No gambling / cash spins
- Existing attractions read as sideshow tents and stalls: prop first, barker voice, depth-run promise
- Vendor batch 01 is live on the hall: Barely-Fit Toss, Coin Pusher Shelf, Pinball Alley
- Remaining Goblin Alley cabinets in `ops/GOBLIN_ALLEY_CABINETS.md` stay backlog
- The foyer and current attractions share one nighttime boardwalk—not a menu of nested apps
- Hard-refresh after pulls


## Media

- `MEDIA_MANIFEST.md` — Aura’s review for Codex (do not bulk-copy Downloads sources here)
- `assets/game/` — optimised WebP stills and phone-sized H.264 loops
- `assets/asset-map.json` — stable mappings for the original foyer slots
- `assets/placeholders/*.svg` — retained as development fallbacks

Hard-refresh `#foyer` after pulls.
