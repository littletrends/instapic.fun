# Goblin Batch 26 — full engine sheets (quiet drop — NEW vendors)
# Soft Bottle Cap Seat · Clapper Pulse Timing · Soft Rope Band Walk · Prize Jar Push · Tea Leaf Rooms · Tilt Drop Board
# 6 NEW stalls not in batches 01–25. Alley DNA: 1930s–50s carnival cheat visible in tent mouth.
# DNA: 1 coin = 1 run · depth until DEATH · mobile-first · solo Aura · no webcam · no real-money
# Engines from runKit: SlingAim / TimingTap / HoldBand / GreedFloor / OracleRooms / Custom
# Params mirrored in GOBLIN_BATCH26_MOUNT_CONFIGS.md
# Avoids bottlehook set B23 · bucketball set B25 · B24 ringlean set — all RUNKIT gameIds reserved.

Shared: routes `#cabinet/{capseat|clappulse|ropeband|jarpush|tealeaf|tiltdrop}` vestibule/play/result · `bestDepth.*` · challenge copy

---

## 1) capseat — SlingAim · Soft Bottle Cap Seat
**Cheat visible:** bottle mouths “breathe” — soft caps kiss the rim then spit sideways when the mouth flexes (classic soft-cap / bottle-mouth alley joke — distinct from lidtoss can crowns and bottlehook hang).
**Feel:** Midway bottle-cap seat booth — seat the soft cap flat on the bottle mouth.
**Verb:** Drag-aim + pull power soft caps at bottle mouths; seat or mouth-spit.
**Depth unit:** Cap
**Input:** Drag-aim + pull power (SlingAim)
**Suggested engine:** SlingAim

### Vestibule
- Prop: row of painted glass bottles with readable mouth bevel, stack of soft rubber caps, prize shelf décor only
- Barker: “SEAT THE SOFT CAP — MOUTHS SPIT WHEN YOU GET CLOSE”
- Best: `Caps {n}`

### Play loop
1. Stage posts need (clean seats counted)
2. Soft flat seat on mouth = credit; too-hard = bounce; mouthSpit stage 3+ kicks borderline seats into spit
3. mouthSpitPct adds kiss-and-slide on near-rim contact without seat lock
4. Clear when need met with caps left → depth++ · tighter mouth · more spit
5. DEATH: caps out before need

### Stage table
| Stage | title | need | mouthScale | mouthSpit | mouthSpitPct | caps | standWobble | missesToDeath |
|------:|-------|-----:|-----------:|:---------:|-------------:|-----:|------------:|--------------:|
| 1 | Soft Teach | 2 | 1.00 | no | 0 | 5 | 0 | 4 |
| 2 | Mid Mouth | 3 | 0.94 | soft | 8 | 5 | 0 | 3 |
| 3 | Mouth Spit | 3 | 0.90 | yes | 14 | 5 | low | 3 |
| 4 | Soft Kiss | 4 | 0.86 | yes | 18 | 6 | mid | 3 |
| 5+ | Cap Storm | 4+floor(t/2) | max(0.70,0.86-0.02*t) | hard | min(30,18+2*t) | 6 | high | 2 |

### Scoring
- +80 per seat · +360 cap clear · +90×stage
- Depth = caps cleared

### Death / result
- `deathReason:"caps_out"|"mouth_spit"|"airball_streak"`
- Card: `CAP {n}`

### Don’ts
- fair sticky mouths forever · magnet auto-seat · ignore mouthSpit late · clone lidtoss / bottlehook / tincansoft 1:1 (mouth spit is the tell)

### Accept
- Player sees mouth bevel + spit as the cheat; stage 1 teachable in ~10s

---

## 2) clappulse — TimingTap · Clapper Pulse Timing
**Cheat visible:** clapper “lies early” — painted strike mark sits early; true clap window sits after the paint (classic hand-clapper / calliope timing booth — distinct from bellhammer clang and whistlepop race).
**Feel:** Midway clapper-pulse booth — tap the true clap, not the painted lie.
**Verb:** Tap CLAP when the pulse crosses the true late window; clear claps before the bar resets.
**Depth unit:** Clap
**Input:** Tap on pulse window (`windowMs`); lateLie decoy mark stage 3+
**Suggested engine:** TimingTap

### Vestibule
- Prop: painted wooden clapper bar, hand silhouette, painted early mark readable as a lie up close
- Barker: “CLAP THE LATE PULSE — THE PAINT LIES EARLY”
- Best: `Claps {n}`

### Play loop
1. Pulse travels clapper arc; painted mark sits early; true windowMs is lateLieMs after the paint
2. Tap in true window → clap credited; early / paint-tap / miss = clap fail
3. Clear when need claps met before resetMs → depth++ · tighter window · bigger late lie
4. DEATH at missesToDeath OR reset with claps left

### Stage table
| Stage | title | need | windowMs | pulseMs | lateLieMs | resetMs | missesToDeath |
|------:|-------|-----:|---------:|--------:|----------:|--------:|--------------:|
| 1 | Teach Clap | 3 | 180 | 900 | 0 | 14000 | 3 |
| 2 | Mid Pulse | 4 | 155 | 820 | 40 | 13000 | 3 |
| 3 | Late Lie | 5 | 135 | 740 | 80 | 12000 | 3 |
| 4 | Thin Clap | 6 | 115 | 660 | 110 | 11000 | 2 |
| 5+ | Clap Storm | 6+t | max(70,115-5*t) | max(420,660-25*t) | min(180,110+10*t) | max(8000,11000-200*t) | 2 |

### Scoring
- +40 per clap · +300 clap-stage clear
- Depth = clap stages cleared

### Death / result
- `deathReason:"misses"|"early_paint"|"reset_fail"|"late_miss"`
- Card: `CLAP {n}`

### Don’ts
- auto-clap on proximity · credit the painted early mark · window never tightens · clone bellhammer / whistlepop / ribbonsnip 1:1 (clapper late-lie is the tell)

### Accept
- Timing addiction; late-lie paint is the visible cheat

---

## 3) ropeband — HoldBand · Soft Rope Band Walk
**Cheat visible:** rope sway yanks the sweet band sideways when the walker nearly seats at the finish flag (boardwalk soft-rope cousin — sway snap, not romance tension or egg wobble).
**Feel:** Midway soft-rope walk stall — hold force while the rope tries to dump near the flag.
**Verb:** Hold force in the band while the walker seats `clearMs` without a sway snap.
**Depth unit:** Walk
**Input:** Hold/drag force meter (HoldBand)
**Suggested engine:** HoldBand

### Vestibule
- Prop: soft painted rope with walker token, finish-line flag, sway vane that twitches before snaps, force band dial
- Barker: “HOLD THE ROPE WALK — ROPE SWAYS WHEN YOU’RE CLOSE”
- Best: `Walks {n}`

### Play loop
1. Band shows sweet force; swaySnap from stage 3 yanks band opposite when seat progress > 70%
2. Stay in band for clearMs / walker seats toward the finish mark
3. Out of band > outLimitMs = slip strike / death path; snap hit = sway death path late
4. Clear when walker seats without snap kill → depth++ · thinner band · nastier sways
5. DEATH: slipLimit / outLimit / sway_snap / never found band

### Stage table
| Stage | title | bandW | swaySnap | outLimitMs | clearMs | slipLimit |
|------:|-------|------:|----------|-----------:|--------:|----------:|
| 1 | Soft Teach | 0.30 | 0 | 900 | 1800 | 3 |
| 2 | Mid Walk | 0.24 | 0 | 800 | 2000 | 2 |
| 3 | Sway Snap | 0.18 | low | 700 | 2200 | 2 |
| 4 | Thin Rope | 0.14 | mid | 600 | 2400 | 2 |
| 5+ | Walk Storm | max(0.08,0.14-0.01*t) | high | 500 | 2600 | 2 |

### Scoring
- +50 per seat tick · +320 walk clear
- Depth = walks won / stages

### Death / result
- `deathReason:"slipped"|"sway_snap"|"never_found"`
- Card: `WALK {n}`

### Don’ts
- auto-walk button · Love-heat / limbobar / eggspoon / cottonwind / tugband copy · ignore sway snap late · real rope / fall framing

### Accept
- Force band skill; sway snap near finish is the readable cheat

---

## 4) jarpush — GreedFloor · Prize Jar Push
**Cheat visible:** jar lip breathes — tokens look ready to drop into the prize jar, then the lip inhales and pulls them back (coin-pusher cousin with jar-breath tell — distinct from tokenrail rail breath and chippusher shelf avalanche).
**Feel:** Midway prize-jar push — greed vs cash-out.
**Verb:** Nudge tokens toward the jar lip; jar breath or rare drop; CASH OUT or PUSH AGAIN.
**Depth unit:** Floor
**Input:** Tap/drag nudge; then CASH OUT / AGAIN buttons
**Suggested engine:** GreedFloor
**cashOut:** true

### Vestibule
- Prop: glass prize jar of painted tokens, breathing lip readable, dud tray under, rare prize token tinted
- Barker: “PUSH THE TOKENS — OR WALK WITH WHAT YOU GOT”
- Best: `Floor {n}` · rares held

### Play loop
1. Each floor: N pushes; rarePct chance a token drops into jar; else jarBreath pulls tokens back (tell after first dud)
2. After each push: **CASH OUT** (end, keep depth/loot) or **AGAIN**
3. Clear floor if rare found OR survive pushesToClear without hitting deathRule → may DESCEND
4. DEATH: breathStreakDeath on floor≥2 OR empty bank after committing again with no rare
5. Depth = floors survived / descended

### Stage / floor table
| Floor | pushes | rarePct | breathStreakDeath | pushesToClear | jarBreath | jarWobble |
|------:|-------:|--------:|------------------:|--------------:|:---------:|-----------|
| 1 | 8 | 16 | no | 3 | yes (chalk lip) | 0 |
| 2 | 10 | 12 | 3 | 3 | yes | low |
| 3 | 10 | 10 | 3 | 4 | yes | low |
| 4 | 12 | 8 | 2 | 4 | yes | mid |
| 5+ | 14 | 6 | 2 | 5 | yes + distractor | high |

### Scoring
- rare rarity points · +220 floor survived · cash-out bonus +12% if floor≥4
- Depth = floors

### Death / result
- `deathReason:"breath_streak"|"empty_bank"|"jar_breath"` · cashedOut flag when voluntary exit
- Card: `FLOOR {n}`

### Don’ts
- fair frictionless jar forever · hide breath with no tell · no CASH OUT button · real-money / casino jar copy · clone tokenrail / chippusher / coinpusher / ticketclaw 1:1

### Accept
- Greed sweat; jar breath is the alley joke players can spot

---

## 5) tealeaf — OracleRooms · Tea Leaf Rooms
**Cheat visible:** twin tea cups fib — stillness opens a trio; twin decoy cups swap leaves after the steam lifts (oracle cousin, tea-leaf pick not door/age/weight/palm/colour veil).
**Feel:** Midway tea-leaf / steam booth — hold still, then pick the true cup.
**Verb:** Hold stillness to open rooms; tap a cup; fib cups = steam death.
**Depth unit:** Leaf
**Input:** Stillness wait → tap a cup card
**Suggested engine:** OracleRooms
**Copy tone:** soft_cute — playful tea fortune, no destiny-romance / medical

### Vestibule
- Prop: three painted carnival tea cups, steam curtain, paper leaf slips, crystal-ish spoon
- Barker: “HOLD STILL — THEN PICK THE TRUE LEAF”
- Best: `Leaves {n}`

### Play loop
1. Stillness for waitMs opens the room; break early = broke_still
2. Cups shown; fibCount cups are lies; twinSwap stage 3+ swaps two leaf patterns after open
3. Pick true cup → depth++ · more cups / nastier swaps
4. Wrong cup / timeout → DEATH (steam curtain)

### Stage table
| Stage | title | waitMs | breakLimitMs | cups | fibCount | twinSwap | pickWindowMs |
|------:|-------|-------:|-------------:|-----:|---------:|:--------:|-------------:|
| 1 | Soft Teach | 1200 | 4000 | 3 | 1 | no | 5000 |
| 2 | Mid Steam | 1400 | 3800 | 3 | 1 | no | 4500 |
| 3 | Twin Fib | 1600 | 3500 | 3 | 2 | yes | 4000 |
| 4 | Four Cups | 1800 | 3200 | 4 | 2 | yes | 3500 |
| 5+ | Leaf Storm | min(2400,1800+80*t) | max(2200,3200-100*t) | 4+(t%2) | 2 | yes + feint | max(2200,3500-100*t) |

### Scoring
- +120 per true leaf · +280 leaf-stage clear
- Depth = leaves / rooms cleared

### Death / result
- `deathReason:"wrong_cup"|"broke_still"|"timeout"|"fib_swap"`
- Card: `LEAF {n}`

### Don’ts
- destiny-romance / medical copy · skip stillness gate · always-fair single cup · shame / curse framing · clone fortunedoors / ageguess / palmfog / colourveil / mirrorlot 1:1

### Accept
- Stillness then pick; twin fib leaves are the readable cheat

---

## 6) tiltdrop — Custom · Tilt Drop Board
**Cheat visible:** board tilts / tip-nudges when near clear gate — ball “almost drops” then breathes sideways off the gate (distinct from marblemaze trace, railroll, and plinkoskill pegs).
**Feel:** Boardwalk tilt-drop booth — guide the soft ball into the gate before the tilt dump.
**Verb:** Tap-tilt / light drag the board; clear gates without tip kill or spill.
**Depth unit:** Drop
**Input:** Tap tilt / light drag board (Custom — TimingTap seat cousin + tilt physics)
**Suggested engine:** Custom

### Vestibule
- Prop: soft painted ball, chalk gate marks, prize shelf décor, tilt seams readable on the board base
- Barker: “TILT THE DROP — BOARD LEANS WHEN YOU’RE CLOSE”
- Best: `Drops {n}`

### Play loop
1. Stage posts needGates / timeBudgetMs; board starts level with ball at start mark
2. Tap-tilt seats the ball toward next gate; miss / soft bounce = spill strike; tiltTip stage 3+ yanks board when gate progress > 75%
3. Clear when needGates seated without tip kill → depth++ · tighter gates · nastier tilt
4. DEATH: time out / spillLimit / tilt_tip / balls_out

### Stage table
| Stage | title | needGates | timeBudgetMs | tiltTip | spillLimit | ballSoft | tiltWindowMs |
|------:|-------|----------:|-------------:|:-------:|-----------:|---------:|-------------:|
| 1 | Soft Teach | 4 | 22000 | no | 3 | soft | 4000 |
| 2 | Mid Board | 5 | 20000 | no | 2 | soft | 3500 |
| 3 | Tilt Breath | 6 | 18000 | yes (low) | 2 | mid | 3000 |
| 4 | Thin Gate | 7 | 16000 | yes (mid) | 2 | mid | 2800 |
| 5+ | Drop Storm | 7+t | max(10000,16000-400*t) | yes (high) | 2 | hard | max(1800,2800-80*t) |

### Scoring
- +25 per gate seated · +340 drop clear · time leftover bonus
- Depth = drops cleared

### Death / result
- `deathReason:"timeout"|"spill"|"tilt_tip"|"balls_out"`
- Card: `DROP {n}`

### Don’ts
- auto-tilt solve · fair boards with no tilt tell · clone marblemaze / railroll / plinkoskill / cupstack 1:1 · soft-lock forever without spill death

### Accept
- Tilt skill; tip near clear gate is the alley joke

---

## Engine map
| gameId | engine | depthUnit |
|--------|--------|-----------|
| capseat | SlingAim | Cap |
| clappulse | TimingTap | Clap |
| ropeband | HoldBand | Walk |
| jarpush | GreedFloor | Floor |
| tealeaf | OracleRooms | Leaf |
| tiltdrop | Custom | Drop |

## Implement order
1. capseat (shares SlingAim / bottle-mouth spit fork)
2. clappulse (TimingTap late-lie)
3. ropeband (HoldBand sway snap)
4. jarpush (GreedFloor cash-out)
5. tealeaf (OracleRooms tea fib)
6. tiltdrop (Custom tilt + tip)

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: capseat, clappulse, ropeband, jarpush, tealeaf, tiltdrop.
Door tag: `Depth run` only if engine mounted.

---

## Shared alley notes (Batch 26)
- Vestibule always shows the cheat prop in the tent mouth (mouth bevel / early paint / sway vane / breathing jar lip / twin tea cups / tilt seams).
- Result cards share runKit chrome: depth · score · deathReason · Aura line · challenge copy · replay.
- Fever Run may gate any live engine later; do not soft-lock sheets on feverNode flags.
- Mobile: one-thumb primary; no multi-touch required; no webcam; no mic.
- Coin: 1 coin = 1 run unless feverNode route already spent.
- Quiet drop after B25; do not collide with bottlehook B23 · bucketball B25 · ringlean B24 · lidtoss B25 second set.

## Alley cheat checklist (visible tells)
| gameId | mouth tell | stage when tell hardens |
|--------|------------|-------------------------|
| capseat | mouth bevel glints before spit | stage 3+ mouthSpit |
| clappulse | painted clap mark sits early | stage 3+ lateLieMs |
| ropeband | sway vane twitches near finish | stage 3+ swaySnap |
| jarpush | chalk/ridge lip before breath | floor 1 chalk; floor 2+ streak death |
| tealeaf | twin cups shimmer before swap | stage 3+ twinSwap |
| tiltdrop | base tilt seams before tip | stage 3+ tiltTip @ 75% |

## Depth / persistence
- `bestDepth.capseat` · `bestDepth.clappulse` · `bestDepth.ropeband` · `bestDepth.jarpush` · `bestDepth.tealeaf` · `bestDepth.tiltdrop`
- `lastRun[gameId]` feeds `#cabinet/{gameId}/result`
- Challenge strings live in GOBLIN_BATCH26_AURA_LINES.md

## Death reason glossary (Batch 26)
- capseat: caps_out · mouth_spit · airball_streak
- clappulse: misses · early_paint · reset_fail · late_miss
- ropeband: slipped · sway_snap · never_found
- jarpush: breath_streak · empty_bank · jar_breath (+ cashedOut)
- tealeaf: wrong_cup · broke_still · timeout · fib_swap
- tiltdrop: timeout · spill · tilt_tip · balls_out

## Accept suite (quick)
1. capseat stage 1 seats teach in ~10s; stage 3 spit readable
2. clappulse paint lie never credits; late window tightens
3. ropeband sway only near finish; band thins
4. jarpush CASH OUT exists; breath tell before streak death
5. tealeaf stillness gate required; twin swap stage 3+
6. tiltdrop tilt tip near clear; no auto-tilt

## Anti-clone notes
- ≠ lidtoss / bottlehook / tincansoft / canalley (cap seat on bottle mouth vs can lid / hook hang / knock-down)
- ≠ bellhammer / whistlepop / ribbonsnip / shootstar (clapper theme; same TimingTap family OK)
- ≠ limbobar / cottonwind / tugband / love / eggspoon / sandpour (rope sway walk theme)
- ≠ tokenrail / chippusher / coinpusher / pigslide / wishwell / ticketclaw (jar breath theme)
- ≠ fortunedoors / ageguess / weightguess / palmfog / colourveil / mirrorlot (tea leaf theme)
- ≠ marblemaze / railroll / plinkoskill / cupstack / midwaymaze (tilt drop board theme)

## Barker VO scraps (vestibule only)
- capseat: “Soft caps. Hard mouths. You’ll swear it was seated.”
- clappulse: “Paint lies early. Clap late. Or don’t.”
- ropeband: “Rope looks friendly until the finish flag.”
- jarpush: “Jar breathes. Your greed doesn’t have to.”
- tealeaf: “Steam first. Pick second. Fib cups third.”
- tiltdrop: “Almost in the gate — then the board laughs.”

## Mobile / HUD notes
- Primary control: one pointer drag or tap; no hover-only hits.
- HUD shows depth unit label (Cap / Clap / Walk / Floor / Leaf / Drop) + strike pips.
- CASH OUT on jarpush must be thumb-reachable bottom-right; never hide behind rare flash.
- Result share uses challenge templates only (depth integer); no personal data.

## Wiring crosswalk
| File | Role |
|------|------|
| GOBLIN_BATCH26_BUILD_SHEETS.md | this — feel · stages · accept |
| GOBLIN_BATCH26_MOUNT_CONFIGS.md | declare()+stageParams drop-in |
| GOBLIN_BATCH26_AURA_LINES.md | result VO + challenge strings |
| GOBLIN_RUNKIT_API.md | engine map rows |
| GOBLIN_SHEETS_INDEX.md | index row |
| GOBLIN_MOUNT_QUEUE.md | park after B25 |

## Fever Run note
Optional later: any of these six may become feverGate nodes once /play mounts exist. Sheets stay coinCost=1 until then. Do not invent feverNode flags in stageParams.

## Size / completeness note
Batch 26 is a full quiet-drop twin of Batch 24/25: six engines, full stage tables, death glossary, anti-clone, accept suite. Implement mounts from GOBLIN_BATCH26_MOUNT_CONFIGS.md without inventing new gameIds.
