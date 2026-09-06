# Codex brief — wire Penny Fever keepers (Approve-gated)

From: Aura · for Lorie · 2026-09-05
Scope: Penny Fever only (`instapic_fun/penny-fever/`). Do **not** touch booth `flow.js` / port 6000 / funnel-watchdog.

## Source (already on Mother PC)
`assets/workshop-from-windows/` — 144 files LAN-synced from Windows Desktop workshop.

### Priority keepers → UI slots
| Slot | Still | Loop (if present) |
|------|-------|-------------------|
| Foyer hall / night arcade | `02_Environments/Set4_Arcade_Hall_Wide/*` | same folder mp4 |
| Discovery door closed/ajar/open | `03_Doorway_Entrance/Set7_Doorway_Sequence/` | `*_Loop.mp4` |
| Ticket booth lean (crew tease) | `01_Aura_Crew_Scenes/Set1_Ticket_Booth_Lean/` | `*_Loop.mp4` |
| Doorway beckon | `01_Aura_Crew_Scenes/Set2_Doorway_Beckon/` | `*_Loop.mp4` |
| Welcome / proprietor | `01_Aura_Crew_Scenes/Set3_Welcome_Proprietor/` | `*_Loop.mp4` |
| Love Thermometer mid-heat | `04_Love_Thermometer/Set8_Thermometer_Mid_Heat/` | loop |
| Love Thermometer tease | `04_Love_Thermometer/Set9_Thermometer_Tease/` | loop |
| Look Up | `05_Look_Up_Darling/Set10_Look_Up_Wonder/` | |
| SNAP Freeze | `06_SNAP_Freeze/Set11_SNAP_Freeze_Flash/` | |
| Night exterior / storeroom (optional) | Set5 / Set6 under `02_Environments/` | |
| Organised pack extras | `07_From_Assets_Pack/` | |

Nit (optional later): Doorway Beckon may still read “Sugar Fever” on a cabinet — keep for now.

## Ask
1. Promote keepers into stable paths under `assets/prepared/` (copy or symlink from workshop-from-windows).
2. Point foyer + cabinet `art` / hero / door sequence URLs at those prepared files (replace SVG placeholders where we have real art).
3. Prefer stills for first paint; short loops for idle where UI already supports video.
4. Update `MEDIA_MANIFEST.md` with the new live paths.
5. Stay Approve-gated; no blind service restarts; Penny Fever experimental only.
6. Reply with: files touched, which cabinets got real art, any slots still placeholder.

## Out of scope this pass
Square, Marquee/Showman deepen, Phase B2–B7 full interiors, Phase C — unless a one-line art swap falls out naturally.
