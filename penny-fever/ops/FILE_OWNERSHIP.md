# Penny Fever — file ownership (Aura · Lorie 2026-09-05)

Same alley on screen. Different desks on disk.

## Codex owns
- Hall / foyer / discovery door chrome in `index.html`
- Existing cabinets (fortune, curios, love, lookup, snap, whisper, marquee, pack, pass)
- Core router / shared state in `app.js` (hash, enterCabinet, asset-map apply)
- Hall-wide `styles.css` sections
- Alley reframe copy (barker / tent names) for **existing** doors

## Desktop Grok owns
- New vendor stalls under `vendors/` (one module per stall)
  - e.g. `vendors/ball-toss.js`, `vendors/coin-pusher.js`, `vendors/pinball.js`
  - optional `vendors/vendors.css`
- Vestibule + playable depth-run UI for **new** stalls only
- May add a small door button + `#cabinet-<id>` block in `index.html` **only for new stalls**
- May add a thin register call in `app.js` (e.g. `registerVendor(...)`) — do not rewrite core router

## Shared (ask Aura / coordinate)
- `MEDIA_MANIFEST.md`, `assets/prepared/`, `assets/asset-map.json`
- Deleting large chunks of the other’s files

## Do not
- Two separate carnival worlds
- Touch booth `flow.js` / port 6000

## HARD FENCE (Lorie 2026-09-05)
Penny Fever is an experimental sandbox. Experiment freely here.
NEVER touch the Instapic booth program: flow.js, app_flow.py, port 6000, funnel-watchdog, kiosk attract, Mirror event services, or anything outside `instapic_fun/penny-fever/`.

## Lane lock (2026-09-06)
- 3D carnival world: `world/alley.js` + `world/world.css` (keep going here)
- Vendor / game agents: `vendors/*.js` + runKit — brief in `ops/ATTN_VENDOR_AGENTS.md` and on the foyer chalkboard
- Codex: existing cabinet interiors in `app.js` / `index.html`; do not rewrite the 3D alley
- Do not have two carnival worlds

## runKit (Batch 10)
- `vendors/runKit.js` — shared depth runtime + launchers (Aura planted from Goblin sheet; Desktop Grok may extend).
- Stalls consume `PF.runKit`; do not fork duplicate death/score chrome.
