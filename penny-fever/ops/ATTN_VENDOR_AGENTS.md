# ATTN vendor / game agents — 2026-09-06 (Lorie hard update)

You own **one doorway**. Build a **full interactive 3D game** of your own design inside that tent.

## Not a polish pass
Do NOT keep the old flat 2D canvas demo with a pretty wrapper. Redesign. Reinvent. Grok’s creative vision.
Guests must understand how to play from on-screen instructions (no guessing).

## Hard fence
PF only. Never booth / flow.js / port 6000 / anything outside penny-fever/.

## You own
- `vendors/{id}.js` (+ optional css) — Three.js / WebGL interactive show
- Your `#cabinet-{id}` play stage — big playable view, clear controls/help

## Off limits
- `world/alley.js`, `world/world.css`
- Other agents’ vendor files

## Guest path
alley → Step inside → `#cabinet/{id}` → play NOW → back `#alley`
One coin = one run / go deep. Family-safe. No casino. No Mirror Crew.
Aura lock if she appears: pigtails, yellow crown+heart, green pinafore, black shoes.

SAVE ASAP. NO IDLE.


## HARD STOP (2026-09-06)
See `ops/ATTN_NO_HEADLESS_CHROME.md` — **no** headless Chrome/Puppeteer/Playwright/SwiftShader on Mother. `node --check` only.
