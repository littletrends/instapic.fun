# Goblin Batch 32 — full engine sheets (quiet drop — NEW vendors)
# Soft Peg Toss · Banjo Beat Timing · Balloon String Hold · Trinket Shelf Push · Moon Veil Pick · Bead Gate Drop
# 6 NEW stalls not in batches 01–27. Alley DNA: 1930s–50s carnival cheat visible in tent mouth.
# DNA: 1 coin = 1 run · depth until DEATH · mobile-first · solo Aura · no webcam · no real-money
# Engines from runKit: SlingAim / TimingTap / HoldBand / GreedFloor / OracleRooms / Custom
# Params mirrored in GOBLIN_BATCH32_MOUNT_CONFIGS.md

Shared: routes `#cabinet/{softpeg|banjobeat|balloonhold|trinketpush|moonveil|beadgate}` vestibule/play/result · `bestDepth.*` · challenge copy

---

## 1) softpeg — SlingAim · Soft Peg Toss
**Cheat visible:** soft rubber pegs kiss the board hole then spit sideways — hole spit reads as “almost seated” before the bounce (classic soft-peg / board-hole alley joke — distinct from peg ring hang and tin-lid seat).
**Feel:** Midway soft-peg toss booth — seat the peg flush in the painted hole.
**Verb:** Drag-aim + pull power soft pegs at board holes; seat or hole-spit.
**Depth unit:** Peg
**Input:** Drag-aim + pull power (SlingAim)
**Suggested engine:** SlingAim

### Vestibule
- Prop: painted wooden peg board with readable hole bevel, stack of soft rubber pegs, prize shelf décor only
- Barker: “SEAT THE SOFT PEG — HOLES SPIT WHEN YOU GET CLOSE”
- Best: `Pegs {n}`

### Play loop
1. Stage posts need (clean seats counted)
2. Soft flush seat in hole = credit; too-hard = bounce; holeSpit stage 3+ kicks borderline seats into spit
3. holeSpitPct adds kiss-and-slide on near-hole contact without seat lock
4. Clear when need met with pegs left → depth++ · tighter hole · more spit
5. DEATH: pegs out before need

### Stage table
| Stage | title | need | holeScale | holeSpit | holeSpitPct | pegs | boardWobble | missesToDeath |
|------:|-------|-----:|----------:|:--------:|------------:|-----:|------------:|--------------:|
| 1 | Soft Teach | 2 | 1.00 | no | 0 | 5 | 0 | 4 |
| 2 | Mid Hole | 3 | 0.94 | soft | 8 | 5 | 0 | 3 |
| 3 | Hole Spit | 3 | 0.90 | yes | 14 | 5 | low | 3 |
| 4 | Soft Kiss | 4 | 0.86 | yes | 18 | 6 | mid | 3 |
| 5+ | Peg Storm | 4+floor(t/2) | max(0.70,0.86-0.02*t) | hard | min(30,18+2*t) | 6 | high | 2 |

### Scoring
- +80 per seat · +360 peg clear · +90×stage
- Depth = pegs cleared

### Death / result
- `deathReason:"pegs_out"|"hole_spit"|"airball_streak"`
- Card: `PEG {n}`

### Don’ts
- fair sticky holes forever · magnet auto-seat · ignore holeSpit late · clone lidtoss / capseat / canalley / tincansoft 1:1 (hole spit is the tell)

### Accept
- Player sees hole bevel + spit as the cheat; stage 1 teachable in ~10s

---

## 2) banjobeat — TimingTap · Banjo Beat Timing
**Cheat visible:** frets “lie early” — painted beat mark sits early; true strum window sits after the paint (classic banjo / rhythm alley timing booth — distinct from clapper and ribbon snip).
**Feel:** Midway banjo-beat booth — tap the true strum, not the painted lie.
**Verb:** Tap STRUM when the pulse crosses the true late window; clear beats before the neck resets.
**Depth unit:** Beat
**Input:** Tap on pulse window (`windowMs`); lateLie decoy mark stage 3+
**Suggested engine:** TimingTap

### Vestibule
- Prop: painted carnival banjo neck, strum silhouette, painted early fret mark readable as a lie up close
- Barker: “STRUM THE LATE BEAT — THE PAINT LIES EARLY”
- Best: `Beats {n}`

### Play loop
1. Pulse travels fret arc; painted mark sits early; true windowMs is lateLieMs after the paint
2. Tap in true window → beat credited; early / paint-tap / miss = beat fail
3. Clear when need beats met before resetMs → depth++ · tighter window · bigger late lie
4. DEATH at missesToDeath OR reset with beats left

### Stage table
| Stage | title | need | windowMs | pulseMs | lateLieMs | resetMs | missesToDeath |
|------:|-------|-----:|---------:|--------:|----------:|--------:|--------------:|
| 1 | Teach Strum | 3 | 180 | 900 | 0 | 14000 | 3 |
| 2 | Mid Neck | 4 | 155 | 820 | 40 | 13000 | 3 |
| 3 | Late Lie | 5 | 135 | 740 | 80 | 12000 | 3 |
| 4 | Thin Fret | 6 | 115 | 660 | 110 | 11000 | 2 |
| 5+ | Beat Storm | 6+t | max(70,115-5*t) | max(420,660-25*t) | min(180,110+10*t) | max(8000,11000-200*t) | 2 |

### Scoring
- +40 per beat · +300 beat-stage clear
- Depth = beat stages cleared

### Death / result
- `deathReason:"misses"|"early_paint"|"reset_fail"|"late_miss"`
- Card: `BEAT {n}`

### Don’ts
- auto-strum on proximity · credit the painted early mark · window never tightens · clone clappulse / ribbonsnip / candycut / shootstar / bellhammer 1:1 (banjo late-lie is the tell)

### Accept
- Timing addiction; late-lie paint is the visible cheat

---

## 3) balloonhold — HoldBand · Balloon String Hold
**Cheat visible:** string tug yanks the sweet band sideways when the balloon nearly seats at the finish mark (boardwalk balloon-string cousin — tug snap, not romance tension or egg wobble).
**Feel:** Midway balloon-string hold stall — hold force while the string tries to yank near the mark.
**Verb:** Hold force in the band while the balloon seats `clearMs` without a tug snap.
**Depth unit:** Hold
**Input:** Hold/drag force meter (HoldBand)
**Suggested engine:** HoldBand

### Vestibule
- Prop: helium-look painted balloon on a string, finish-line flag, tug vane that twitches before snaps, force band dial
- Barker: “HOLD THE BALLOON STRING — TUG SNAPS WHEN YOU’RE CLOSE”
- Best: `Holds {n}`

### Play loop
1. Band shows sweet force; tugSnap from stage 3 yanks band opposite when seat progress > 70%
2. Stay in band for clearMs / balloon seat toward the finish mark
3. Out of band > outLimitMs = slip strike / death path; snap hit = tug death path late
4. Clear when balloon seats without snap kill → depth++ · thinner band · nastier tugs
5. DEATH: slipLimit / outLimit / tug_snap / never found band

### Stage table
| Stage | title | bandW | tugSnap | outLimitMs | clearMs | slipLimit |
|------:|-------|------:|---------|-----------:|--------:|----------:|
| 1 | Soft Teach | 0.30 | 0 | 900 | 1800 | 3 |
| 2 | Mid Hold | 0.24 | 0 | 800 | 2000 | 2 |
| 3 | Tug Snap | 0.18 | low | 700 | 2200 | 2 |
| 4 | Thin String | 0.14 | mid | 600 | 2400 | 2 |
| 5+ | Hold Storm | max(0.08,0.14-0.01*t) | high | 500 | 2600 | 2 |

### Scoring
- +50 per seat tick · +320 hold clear
- Depth = holds won / stages

### Death / result
- `deathReason:"slipped"|"tug_snap"|"never_found"`
- Card: `HOLD {n}`

### Don’ts
- auto-hold button · Love-heat / limbobar / ropeband / eggspoon / cottonwind romance or limbo copy · ignore tug snap late · real balloon / helium spend framing

### Accept
- Force band skill; tug snap near finish is the readable cheat

---

## 4) trinketpush — GreedFloor · Trinket Shelf Push
**Cheat visible:** shelf edge breathes — trinkets look ready to drop, then the shelf inhales and pulls them back (coin-pusher cousin with shelf-breath tell — distinct from jar breath, rail breath, chip shelf avalanche).
**Feel:** Midway trinket / shelf push — greed vs cash-out.
**Verb:** Nudge trinkets toward the drop lip; shelf breath or rare drop; CASH OUT or PUSH AGAIN.
**Depth unit:** Floor
**Input:** Tap/drag nudge; then CASH OUT / AGAIN buttons
**Suggested engine:** GreedFloor
**cashOut:** true

### Vestibule
- Prop: painted trinket shelf, breathing lip readable, dud tray under, rare prize trinket tinted
- Barker: “PUSH THE TRINKETS — OR WALK WITH WHAT YOU GOT”
- Best: `Floor {n}` · rares held

### Play loop
1. Each floor: N pushes; rarePct chance a trinket drops; else shelfBreath pulls trinkets back (tell after first dud)
2. After each push: **CASH OUT** (end, keep depth/loot) or **AGAIN**
3. Clear floor if rare found OR survive pushesToClear without hitting deathRule → may DESCEND
4. DEATH: breathStreakDeath on floor≥2 OR empty bank after committing again with no rare
5. Depth = floors survived / descended

### Stage / floor table
| Floor | pushes | rarePct | breathStreakDeath | pushesToClear | shelfBreath | shelfWobble |
|------:|-------:|--------:|------------------:|--------------:|:-----------:|-------------|
| 1 | 8 | 16 | no | 3 | yes (chalk lip) | 0 |
| 2 | 10 | 12 | 3 | 3 | yes | low |
| 3 | 10 | 10 | 3 | 4 | yes | low |
| 4 | 12 | 8 | 2 | 4 | yes | mid |
| 5+ | 14 | 6 | 2 | 5 | yes + distractor | high |

### Scoring
- rare rarity points · +220 floor survived · cash-out bonus +12% if floor≥4
- Depth = floors

### Death / result
- `deathReason:"breath_streak"|"empty_bank"|"shelf_breath"` · cashedOut flag when voluntary exit
- Card: `FLOOR {n}`

### Don’ts
- fair frictionless shelf forever · hide breath with no tell · no CASH OUT button · real-money / casino shelf copy · clone jarpush / tokenrail / chippusher / coinpusher / medalpusher 1:1

### Accept
- Greed sweat; shelf breath is the alley joke players can spot

---

## 5) moonveil — OracleRooms · Moon Veil Pick
**Cheat visible:** twin moon veils fib — stillness opens a trio; twin decoy veils swap moon phases after the curtain lifts (oracle cousin, moon-phase pick not colour/tea/door/age/weight/palm).
**Feel:** Midway moon / veil booth — hold still, then pick the true moon veil.
**Verb:** Hold stillness to open rooms; tap a veil; fib veils = curtain death.
**Depth unit:** Veil
**Input:** Stillness wait → tap a veil card
**Suggested engine:** OracleRooms
**Copy tone:** soft_cute — playful moon fortune, no destiny-romance / medical

### Vestibule
- Prop: three painted carnival moon veils, curtain, paper phase slips, crystal-ish needle
- Barker: “HOLD STILL — THEN PICK THE TRUE MOON”
- Best: `Veils {n}`

### Play loop
1. Stillness for waitMs opens the room; break early = broke_still
2. Veils shown; fibCount veils are lies; twinSwap stage 3+ swaps two moon phases after open
3. Pick true veil → depth++ · more veils / nastier swaps
4. Wrong veil / timeout → DEATH (curtain)

### Stage table
| Stage | title | waitMs | breakLimitMs | veils | fibCount | twinSwap | pickWindowMs |
|------:|-------|-------:|-------------:|------:|---------:|:--------:|-------------:|
| 1 | Soft Teach | 1200 | 4000 | 3 | 1 | no | 5000 |
| 2 | Mid Curtain | 1400 | 3800 | 3 | 1 | no | 4500 |
| 3 | Twin Fib | 1600 | 3500 | 3 | 2 | yes | 4000 |
| 4 | Four Moons | 1800 | 3200 | 4 | 2 | yes | 3500 |
| 5+ | Veil Storm | min(2400,1800+80*t) | max(2200,3200-100*t) | 4+(t%2) | 2 | yes + feint | max(2200,3500-100*t) |

### Scoring
- +120 per true veil · +280 veil-stage clear
- Depth = veils / rooms cleared

### Death / result
- `deathReason:"wrong_veil"|"broke_still"|"timeout"|"fib_swap"`
- Card: `VEIL {n}`

### Don’ts
- destiny-romance / medical copy · skip stillness gate · always-fair single veil · shame / curse framing · clone colourveil / tealeaf / fortunedoors / ageguess / palmfog / mirrorlot 1:1

### Accept
- Stillness then pick; twin fib moons are the readable cheat

---

## 6) beadgate — Custom · Bead Gate Drop
**Cheat visible:** gate leans / tip-nudges when near clear — bead “almost drops” then breathes sideways off the gate (distinct from tilt-drop board, marblemaze trace, railroll, cupstack lean).
**Feel:** Boardwalk bead-gate booth — guide the soft bead into the gate before the tip dump.
**Verb:** Tap-nudge / light drag the bead path; clear gates without tip kill or spill.
**Depth unit:** Gate
**Input:** Tap nudge / light drag bead (Custom — TimingTap seat cousin + tip physics)
**Suggested engine:** Custom

### Vestibule
- Prop: soft painted bead, chalk gate marks, prize shelf décor, tip seams readable on the gate frame
- Barker: “NUDGE THE BEAD — GATE LEANS WHEN YOU’RE CLOSE”
- Best: `Gates {n}`

### Play loop
1. Stage posts needGates / timeBudgetMs; path starts level with bead at start mark
2. Tap-nudge seats the bead toward next gate; miss / soft bounce = spill strike; gateTip stage 3+ yanks frame when gate progress > 75%
3. Clear when needGates seated without tip kill → depth++ · tighter gates · nastier tip
4. DEATH: time out / spillLimit / gate_tip / beads_out

### Stage table
| Stage | title | needGates | timeBudgetMs | gateTip | spillLimit | beadSoft | nudgeWindowMs |
|------:|-------|----------:|-------------:|:-------:|-----------:|---------:|--------------:|
| 1 | Soft Teach | 4 | 22000 | no | 3 | soft | 4000 |
| 2 | Mid Path | 5 | 20000 | no | 2 | soft | 3500 |
| 3 | Tip Breath | 6 | 18000 | yes (low) | 2 | mid | 3000 |
| 4 | Thin Gate | 7 | 16000 | yes (mid) | 2 | mid | 2800 |
| 5+ | Gate Storm | 7+t | max(10000,16000-400*t) | yes (high) | 2 | hard | max(1800,2800-80*t) |

### Scoring
- +25 per gate seated · +340 gate clear · time leftover bonus
- Depth = gates cleared

### Death / result
- `deathReason:"timeout"|"spill"|"gate_tip"|"beads_out"`
- Card: `GATE {n}`

### Don’ts
- auto-nudge solve · fair gates with no tip tell · clone tiltdrop / marblemaze / railroll / plinkoskill / cupstack 1:1 · soft-lock forever without spill death

### Accept
- Nudge skill; tip near clear gate is the alley joke

---

## Engine map
| gameId | engine | depthUnit |
|--------|--------|-----------|
| softpeg | SlingAim | Peg |
| banjobeat | TimingTap | Beat |
| balloonhold | HoldBand | Hold |
| trinketpush | GreedFloor | Floor |
| moonveil | OracleRooms | Veil |
| beadgate | Custom | Gate |

## Implement order
1. softpeg (shares SlingAim / hole-spit fork)
2. banjobeat (TimingTap late-lie)
3. balloonhold (HoldBand tug snap)
4. trinketpush (GreedFloor cash-out)
5. moonveil (OracleRooms moon fib)
6. beadgate (Custom bead + tip)

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: softpeg, banjobeat, balloonhold, trinketpush, moonveil, beadgate.
Door tag: `Depth run` only if engine mounted.

---

## Shared alley notes (Batch 32)
- Vestibule always shows the cheat prop in the tent mouth (hole bevel / early paint / tug vane / breathing shelf lip / twin moon veils / tip seams).
- Result cards share runKit chrome: depth · score · deathReason · Aura line · challenge copy · replay.
- Fever Run may gate any live engine later; do not soft-lock sheets on feverNode flags.
- Mobile: one-thumb primary; no multi-touch required; no webcam; no mic.
- Coin: 1 coin = 1 run unless feverNode route already spent.
- Quiet drop after B27; do not collide with lidtoss B27 · capseat B26 · bucketball B25 · bottlehook B23 · ringlean B24.

## Alley cheat checklist (visible tells)
| gameId | mouth tell | stage when tell hardens |
|--------|------------|-------------------------|
| softpeg | hole bevel glints before spit | stage 3+ holeSpit |
| banjobeat | painted fret mark sits early | stage 3+ lateLieMs |
| balloonhold | tug vane twitches near finish | stage 3+ tugSnap |
| trinketpush | chalk/ridge lip before breath | floor 1 chalk; floor 2+ streak death |
| moonveil | twin moons shimmer before swap | stage 3+ twinSwap |
| beadgate | gate tip seams before tip | stage 3+ gateTip @ 75% |

## Depth / persistence
- `bestDepth.softpeg` · `bestDepth.banjobeat` · `bestDepth.balloonhold` · `bestDepth.trinketpush` · `bestDepth.moonveil` · `bestDepth.beadgate`
- `lastRun[gameId]` feeds `#cabinet/{gameId}/result`
- Challenge strings live in GOBLIN_BATCH32_AURA_LINES.md

## Death reason glossary (Batch 32)
- softpeg: pegs_out · hole_spit · airball_streak
- banjobeat: misses · early_paint · reset_fail · late_miss
- balloonhold: slipped · tug_snap · never_found
- trinketpush: breath_streak · empty_bank · shelf_breath (+ cashedOut)
- moonveil: wrong_veil · broke_still · timeout · fib_swap
- beadgate: timeout · spill · gate_tip · beads_out

## Accept suite (quick)
1. softpeg stage 1 seats teach in ~10s; stage 3 spit readable
2. banjobeat paint lie never credits; late window tightens
3. balloonhold tug only near finish; band thins
4. trinketpush CASH OUT exists; breath tell before streak death
5. moonveil stillness gate required; twin swap stage 3+
6. beadgate tip near clear; no auto-nudge

## Anti-clone notes
- ≠ lidtoss / capseat / bottlehook / tincansoft / canalley (peg seat in board hole vs can lid / bottle mouth / hook hang / knock-down)
- ≠ clappulse / ribbonsnip / bellhammer / whistlepop / shootstar / candycut (banjo theme; same TimingTap family OK)
- ≠ limbobar / cottonwind / tugband / love / eggspoon / ropeband / sandpour (balloon string tug theme)
- ≠ tokenrail / jarpush / chippusher / coinpusher / pigslide / wishwell / ticketclaw / medalpusher (trinket shelf breath theme)
- ≠ colourveil / tealeaf / fortunedoors / ageguess / weightguess / palmfog / mirrorlot (moon veil theme)
- ≠ tiltdrop / marblemaze / railroll / plinkoskill / cupstack / midwaymaze (bead gate tip theme)

## Barker VO scraps (vestibule only)
- softpeg: “Soft pegs. Hard holes. You’ll swear it was seated.”
- banjobeat: “Paint lies early. Strum late. Or don’t.”
- balloonhold: “String looks friendly until the finish flag.”
- trinketpush: “Shelf breathes. Your greed doesn’t have to.”
- moonveil: “Still first. Pick second. Fib moons third.”
- beadgate: “Almost in the gate — then the frame laughs.”

## Mobile / HUD notes
- Primary control: one pointer drag or tap; no hover-only hits.
- HUD shows depth unit label (Peg / Beat / Hold / Floor / Veil / Gate) + strike pips.
- CASH OUT on trinketpush must be thumb-reachable bottom-right; never hide behind rare flash.
- Result share uses challenge templates only (depth integer); no personal data.

## Wiring crosswalk
| File | Role |
|------|------|
| GOBLIN_BATCH32_BUILD_SHEETS.md | this — feel · stages · accept |
| GOBLIN_BATCH32_MOUNT_CONFIGS.md | declare()+stageParams drop-in |
| GOBLIN_BATCH32_AURA_LINES.md | result VO + challenge strings |
| GOBLIN_RUNKIT_API.md | engine map rows |
| GOBLIN_SHEETS_INDEX.md | index row |
| GOBLIN_MOUNT_QUEUE.md | park after B27 |

## Fever Run note
Optional later: any of these six may become feverGate nodes once /play mounts exist. Sheets stay coinCost=1 until then. Do not invent feverNode flags in stageParams.

## Size / completeness note
Batch 32 is a full quiet-drop twin of Batch 24/26/27: six engines, full stage tables, death glossary, anti-clone, accept suite. Implement mounts from GOBLIN_BATCH32_MOUNT_CONFIGS.md without inventing new gameIds.

## Extra alley flavour (Batch 32)
- Soft Peg board uses chalk hole rings that scuff after spit — readable wear, not RNG fog.
- Banjo neck frets glow paint-lie early; true window is a quieter pulse tick.
- Balloon string has a visible tug vane; never silent yank.
- Trinket shelf lip chalks white on floor 1, ridges on later floors.
- Moon veil cards use soft_cute moon-phase names (crescent / gibbous / full) — never curse copy.
- Bead gate frame shows tip seams before stage 3 tip engages.

## Param mirror checklist
Confirm mount stageParams match tables above for: need/holeScale/holeSpitPct · windowMs/lateLieMs · bandW/tugSnap/clearMs · pushes/rarePct/breathStreakDeath · waitMs/fibCount/twinSwap · needGates/gateTip/timeBudgetMs.

## Quiet-drop placement
Park after B27 lidtoss set. Do not renumber B23/B25/B26/B27. Append RUNKIT rows as BATCH32 only.
