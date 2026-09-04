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
4. **Love Thermometer** — hold / release Sweet Heat (demo coin) + challenge copy
5. **Look Up, Darling** — device orientation or practice mode
6. **SNAP! Freeze** — timing tap
7. **Whisper Charm** — one-word charm → Alley curio
8. **Showman’s Pass** — demo unlock (no Square) until midnight Darwin
9. Dev reset clears `localStorage` key `pennyFever.v1`

## Art

- Proprietor and reactions: `assets/game/Aura_Reactions/`
- Mirror Crew stills: `assets/crew/*` (modern animated-film Imagine cast)
- Cabinet states, curios and loops: `assets/game/` (web derivatives)
- Full-quality organised originals remain outside the website repository in Downloads.

## Rules

- Demo coins only until Aura calls opening night
- No gambling / cash spins
- Hard-refresh after pulls


## Media

- `MEDIA_MANIFEST.md` — Aura’s review for Codex (do not bulk-copy Downloads sources here)
- `assets/game/` — optimised WebP stills and phone-sized H.264 loops
- `assets/asset-map.json` — stable mappings for the original foyer slots
- `assets/placeholders/*.svg` — retained as development fallbacks

Hard-refresh `#foyer` after pulls.
