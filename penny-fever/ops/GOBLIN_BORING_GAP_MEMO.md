# BORING GAP MEMO — Goblin → Aura → Desktop Grok/Codex
# Lorie: games feel boring. Diagnosis + required fix. Not optional flavour.

## Diagnosis (Aura box workshop, app.js now)
- **ONLY real game:** Love Thermometer (fixed 3 rounds → rank). Still NOT a Heat Run (endless stages until death).
- **Everything else:** `TEASERS` one-tap delight strings. That is foyer candy / nested-app snack — NOT alley vendor depth.
- **Batch 01 sheets EXIST** at `ops/GOBLIN_BATCH01_BUILD_SHEETS.md` (also Mother) but are **NOT WIRED into play routes**. Titles without guts = boring.

## North star reminder
Walkable sideshow alley · 1 coin = 1 RUN · stages climb until DEATH · ticket = postcard from depth · tent mouth shows the cheat · NOT “tap → cute line → leave.”

## Required build order (stop polishing teaser copy)
### P0 — Make Love stop being a demo loop
Upgrade Love to **Heat Run** per earlier Goblin engineer notes:
- Endless stages; band shrinks/splits/lies
- Miss band = DEATH (not “see your rank after 3”)
- Depth = Heat Stage (foyer bestDepth.love)
- Keep 3-round flow ONLY as a “Practice” toggle if needed — default coin = run until death

### P0 — Implement Batch 01 as REAL `/play` engines
Wire routes like Love:
- `#cabinet/balltoss` · `/play` · `/result`
- `#cabinet/coinpusher` · `/play` · `/result`
- `#cabinet/pinball` · `/play` · `/result`

**Source of truth:** `ops/GOBLIN_BATCH01_BUILD_SHEETS.md` — implement stage tables, death, scoring, cash-out (pusher), chapter depth (pinball). Do NOT ship another teaser delight for these ids.

### P1 — Kill teaser-as-game UX for any door marked Vendor/Depth
If a cabinet is enterable but engine isn’t ready: vestibule may say “Aura is tuning the machine — depth run landing next” — **no fake one-tap “game.”** One-tap delights trained everyone that Penny Fever is boring.

### P1 — Foyer truth in UI
Door tags: `Depth run` only when `/play` exists. Else `Tuning` / `Soon`. Never imply playable skill when it’s a string picker.

## Accept tests (Lorie should feel these)
1. Ball Toss: 60s+ of aiming; dies on 3rd miss; can say “holes are unfair.”
2. Coin Pusher: feels greed; cash-out vs one-more-drop is a real choice.
3. Pinball: flippers matter; drain ends the coin; chapter number is the glory.
4. Love Heat Run: can’t “finish” — only die deeper than last time.
5. No door returns only a witty sentence and a coin deduct.

## What Goblin will keep doing
Full build sheets (loop/stages/death/score/input/vestibule/donts) for every vendor — never shells. Next sheets on request for Weighted Milk / Cover-the-Spot / Water Gun Duel once batch 01 playables stick.

## Explicit don’t
- More TEASER lines as “content”
- Nesting mini “complete level 1 get sticker” flows
- Building vestibule art without a play engine behind batch 01 doors
