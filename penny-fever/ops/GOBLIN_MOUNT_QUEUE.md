# Goblin mount queue — Aura one-pager (punch order)
# Paths relative to penny-fever/ops/. Wire declare()+stageParams; kill teasers when /play lives.
# Engine map: GOBLIN_RUNKIT_API.md · Accept feel: GOBLIN_P0_ACCEPT_TESTS.md

## Punch order P0 → B19

| Order | Set | Mount file | Aura lines | Notes |
|-------|-----|------------|------------|-------|
| 1 | P0 | GOBLIN_P0_MOUNT_CONFIGS.md | GOBLIN_P0_AURA_LINES.md | love · balltoss · coinpusher · pinball |
| 2 | P1 Snap/Marquee | GOBLIN_P1_SNAP_MARQUEE_MOUNTS.md | GOBLIN_P1_AURA_LINES.md | snap · marquee |
| 3 | P1 Hall | GOBLIN_P1_HALL_DEPTH_MOUNTS.md | GOBLIN_P1_HALL_AURA_LINES.md | whisper · lookup · curios · pack |
| 4 | B02 | GOBLIN_BATCH02_MOUNT_CONFIGS.md | GOBLIN_BATCH02_AURA_LINES.md | milk · coverspot · watergun |
| 5 | B03 | GOBLIN_BATCH03_MOUNT_CONFIGS.md | (sheet VO) | mutoscope · catoptromancy · highstriker · bentring · plinko |
| 6 | B04 | GOBLIN_BATCH04_MOUNT_CONFIGS.md | GOBLIN_BATCH04_AURA_LINES.md | fairyfloss · popcorn · duckpond · skee · pennypitch · dunk |
| 7 | B05 | GOBLIN_BATCH05_MOUNT_CONFIGS.md | GOBLIN_BATCH05_AURA_LINES.md | balloondarts · canalley · wheel · ticketchop · bumper · killscreen |
| 8 | B11 | GOBLIN_BATCH11_MOUNT_CONFIGS.md | GOBLIN_BATCH11_AURA_LINES.md | whacheart · griptest · lungtest · prizepunch · shellfind · tenstrike |
| 9 | B12 | GOBLIN_BATCH12_MOUNT_CONFIGS.md | GOBLIN_BATCH12_AURA_LINES.md | magiciancups · corkgun · frogbog · ropebell · cutoutstill · medalpusher |
| 10 | B13 | GOBLIN_BATCH13_MOUNT_CONFIGS.md | GOBLIN_BATCH13_AURA_LINES.md | bushel · milkcan · hiroller · tinpan · wackywire · crowncatch |
| 11 | B14 | GOBLIN_BATCH14_MOUNT_CONFIGS.md | GOBLIN_BATCH14_AURA_LINES.md | skeejumbo · waterballoon · pongbounce · horserace · bellecho · nightstamp |
| 12 | B15 | GOBLIN_BATCH15_MOUNT_CONFIGS.md | GOBLIN_BATCH15_AURA_LINES.md | popgunbottles · clothespin · marblerun · fanblow · spotdiff · kisscamstill |
| 13 | B16 | GOBLIN_BATCH16_MOUNT_CONFIGS.md | GOBLIN_BATCH16_AURA_LINES.md | cranesoft · whistlestop · balloontrace · pietin · glowtrace · stamprally |
| 14 | B17 | GOBLIN_BATCH17_MOUNT_CONFIGS.md | GOBLIN_BATCH17_AURA_LINES.md | softbottle · footballtoss · baseballsoft · dartcolour · pokerino · photofinish |
| 15 | B18 | GOBLIN_BATCH18_MOUNT_CONFIGS.md | GOBLIN_BATCH18_AURA_LINES.md | teacupspin · mirrorpeek · candycut · duckhookcolour · lanterncatch · barkerecho |
| 16 | B19 | GOBLIN_BATCH19_MOUNT_CONFIGS.md | GOBLIN_BATCH19_AURA_LINES.md | coconutsoft · tincansoft · plinkoskill · snackwheel · midwaymaze · tipjar |

## Parked (after B19)

| Order | Set | Mount file | Aura lines | Notes |
|-------|-----|------------|------------|-------|
| 17 | B20 spend meta | GOBLIN_BATCH20_MOUNT_CONFIGS.md | GOBLIN_BATCH20_AURA_LINES.md | nightpass · stickeralbum · raidspin · revivecredit · livelane · dailyheist — wire after P0 spine; see GOBLIN_SPEND_UX_NOTES.md |
| 18 | B21 quiet drop | GOBLIN_BATCH21_MOUNT_CONFIGS.md | GOBLIN_BATCH21_AURA_LINES.md | catrack · brassring · stringpull · nailhammer · weightguess · razzledazzle — park after B19; wire after P0 spine |
| 19 | B22 quiet drop | GOBLIN_BATCH22_MOUNT_CONFIGS.md | GOBLIN_BATCH22_AURA_LINES.md | hoopswish · shootstar · pigslide · tugband · ageguess · fascination — park after B19; wire after P0 spine |
| 20 | B23 quiet drop | GOBLIN_BATCH23_MOUNT_CONFIGS.md | GOBLIN_BATCH23_AURA_LINES.md | bottlehook · whistlepop · sandpour · ticketclaw · mirrorlot · railroll — park after B19; wire after P0 spine |

| 21 | B24 quiet drop | GOBLIN_BATCH24_MOUNT_CONFIGS.md | GOBLIN_BATCH24_AURA_LINES.md | ringlean · bellhammer · cottonwind · chippusher · fortunedoors · marblemaze — park after B23; wire after P0 spine |
| 22 | B25 quiet drop | GOBLIN_BATCH25_MOUNT_CONFIGS.md | GOBLIN_BATCH25_AURA_LINES.md | lidtoss · ribbonsnip · eggspoon · tokenrail · colourveil · cupstack — park after B24; wire after P0 spine |

## Sheets without mount files yet (build later)
B06–B10 · B07–B09 stalls live partly via P1 hall / Fever gates — sheets: GOBLIN_BATCH06–10_*.md · GOBLIN_FEVER_RUN_NODE_GATES.md

## Spine reminder
runKit → P0 Love + Batch01 → Snap + Marquee → Fever Run (≥3 engines) → Milk/Water Gun → Curios → Pass → Kill Screen late.
- PARK: Batch24 mounts (`GOBLIN_BATCH24_MOUNT_CONFIGS.md`) — after B23. gameIds: ringlean · bellhammer · cottonwind · chippusher · fortunedoors · marblemaze
- PARK: Batch25 mounts (`GOBLIN_BATCH25_MOUNT_CONFIGS.md`) — after B24. gameIds: lidtoss · ribbonsnip · eggspoon · tokenrail · colourveil · cupstack
- PARK: Batch27 lidtoss set — after Soft Bucket B25. Do not renumber B23/B25.
- PARK: Batch26 capseat set (`GOBLIN_BATCH26_*`) — after B25 Soft Bucket; before B27 lidtoss.

| 23 | B28 quiet drop | GOBLIN_BATCH28_MOUNT_CONFIGS.md | GOBLIN_BATCH28_AURA_LINES.md | softpeg · banjobeat · balloonhold · trinketpush · moonveil · beadgate — park after B27; wire after P0 spine |
- PARK: Batch28 softpeg set (`GOBLIN_BATCH28_*`) — after B27 lidtoss; do not renumber B23/B25/B26/B27.

## Levels pass (Goblin)
Authored rooms (not harder loops): `GOBLIN_AUTHORED_LEVELS_P0.md` — Love · Ball Toss · Pusher · Pinball · Milk · Cover · Water. Wire after P0 polish; pause endless-batch inventing; do not order B05+.
REVIEW HIT #2 accept-feel (tick while polishing): `GOBLIN_P0_AUTHORED_ACCEPT_FEEL.md` — supersedes pure depth-climb feel for love · balltoss · coinpusher · pinball · milk · coverspot · watergun.
Finish authored feel before B05.
B03 authored rooms (next): `GOBLIN_AUTHORED_LEVELS_B03.md` — Mutoscope · Catoptromancy · High Striker · Bent Rings · Plinko (6–8 named rooms each + codaEnabled). Wire after P0/B02 feel; do not ship B03 as pure stageParams climb.
B04 authored rooms (next after B03 feel): `GOBLIN_AUTHORED_LEVELS_B04.md` — Fairy Floss · Popcorn · Duck Pond · Skee-Ball · Penny Pitch · Dunk (6–8 named rooms each + codaEnabled). Wire after B03 feel; do not ship B04 as pure stageParams climb.
