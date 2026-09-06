# HARD STOP — no headless Chrome / Puppeteer / Playwright on Mother

**Lorie / Aura / Goblin — 2026-09-06**

While Mother is under load (or anytime doorway writers are running):

- **DO NOT** launch headless Chrome, Chromium, Puppeteer, Playwright, or SwiftShader GPU playtests on this machine.
- **DO NOT** create `/tmp/*chrome*`, `/tmp/pack-pt*`, `/tmp/pf-*-chrome*`, `/tmp/coverspot*`, `/tmp/lookup-tune*` user-data dirs for browser verification.
- Orphan GPU processes from those playtests maxed Mother CPU (~174+ load). They were killed. Doorway Groks were shut down on Lorie's order.

**Verify with:** `node --check` on your JS only. Browser playtest is Lorie/Aura offline or on another box — not live Mother while writers run.

If you already spawned one: kill your own tree immediately and do not respawn.
