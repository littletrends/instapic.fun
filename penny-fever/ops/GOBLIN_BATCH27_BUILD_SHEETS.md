# Goblin Batch 27 — full engine sheets (quiet drop — NEW vendors)
# Soft Lid Toss · Ribbon Snip Timing · Egg Spoon Walk · Token Rail Slide · Colour Veil Pick · Soft Cup Stack
# 6 NEW stalls not in batches 01–24. Alley DNA: 1930s–50s carnival cheat visible in tent mouth.
# DNA: 1 coin = 1 run · depth until DEATH · mobile-first · solo Aura · no webcam · no real-money
# Engines from runKit: SlingAim / TimingTap / HoldBand / GreedFloor / OracleRooms / Custom
# Params mirrored in GOBLIN_BATCH27_MOUNT_CONFIGS.md

Shared: routes `#cabinet/{lidtoss|ribbonsnip|eggspoon|tokenrail|colourveil|cupstack}` vestibule/play/result · `bestDepth.*` · challenge copy

---

## 1) lidtoss — SlingAim · Soft Lid Toss
**Cheat visible:** soft tin lids kiss the can rim then spit sideways — rim spit reads as “almost seated” before the bounce (classic soft-lid / can-rim alley joke — distinct from tin cans soft knock-down).
**Feel:** Midway tin-lid toss booth — seat the lid flat on the can crown.
**Verb:** Drag-aim + pull power soft lids at can crowns; seat or rim-spit.
**Depth unit:** Lid
**Input:** Drag-aim + pull power (SlingAim)
**Suggested engine:** SlingAim

### Vestibule
- Prop: row of painted tin cans with readable rim bevel, stack of soft rubber lids, prize shelf décor only
- Barker: “SEAT THE SOFT LID — RIMS SPIT WHEN YOU GET CLOSE”
- Best: `Lids {n}`

### Play loop
1. Stage posts need (clean seats counted)
2. Soft flat seat on crown = credit; too-hard = bounce; rimSpit stage 3+ kicks borderline seats into spit
3. rimSpitPct adds kiss-and-slide on near-rim contact without seat lock
4. Clear when need met with lids left → depth++ · tighter crown · more spit
5. DEATH: lids out before need

### Stage table
| Stage | title | need | crownScale | rimSpit | rimSpitPct | lids | standWobble | missesToDeath |
|------:|-------|-----:|-----------:|:-------:|-----------:|-----:|------------:|--------------:|
| 1 | Soft Teach | 2 | 1.00 | no | 0 | 5 | 0 | 4 |
| 2 | Mid Crown | 3 | 0.94 | soft | 8 | 5 | 0 | 3 |
| 3 | Rim Spit | 3 | 0.90 | yes | 14 | 5 | low | 3 |
| 4 | Soft Kiss | 4 | 0.86 | yes | 18 | 6 | mid | 3 |
| 5+ | Lid Storm | 4+floor(t/2) | max(0.70,0.86-0.02*t) | hard | min(30,18+2*t) | 6 | high | 2 |

### Scoring
- +80 per seat · +360 lid clear · +90×stage
- Depth = lids cleared

### Death / result
- `deathReason:"lids_out"|"rim_spit"|"airball_streak"`
- Card: `LID {n}`

### Don’ts
- fair sticky crowns forever · magnet auto-seat · ignore rimSpit late · clone tincansoft / canalley 1:1 (rim spit is the tell)

### Accept
- Player sees rim bevel + spit as the cheat; stage 1 teachable in ~10s

---

## 2) ribbonsnip — TimingTap · Ribbon Snip Timing
**Cheat visible:** scissors “lie early” — painted cut mark sits early; true snip window sits after the paint (classic ribbon / prize-string alley timing booth).
**Feel:** Midway ribbon-snip booth — tap the true snip, not the painted lie.
**Verb:** Tap SNIP when the pulse crosses the true late window; clear snips before the ribbon resets.
**Depth unit:** Snip
**Input:** Tap on pulse window (`windowMs`); lateLie decoy mark stage 3+
**Suggested engine:** TimingTap

### Vestibule
- Prop: striped carnival ribbon on a peg, scissors silhouette, painted early mark readable as a lie up close
- Barker: “SNIP THE LATE CUT — THE PAINT LIES EARLY”
- Best: `Snips {n}`

### Play loop
1. Pulse travels scissors arc; painted mark sits early; true windowMs is lateLieMs after the paint
2. Tap in true window → snip credited; early / paint-tap / miss = snip fail
3. Clear when need snips met before resetMs → depth++ · tighter window · bigger late lie
4. DEATH at missesToDeath OR reset with snips left

### Stage table
| Stage | title | need | windowMs | pulseMs | lateLieMs | resetMs | missesToDeath |
|------:|-------|-----:|---------:|--------:|----------:|--------:|--------------:|
| 1 | Teach Snip | 3 | 180 | 900 | 0 | 14000 | 3 |
| 2 | Mid Ribbon | 4 | 155 | 820 | 40 | 13000 | 3 |
| 3 | Late Lie | 5 | 135 | 740 | 80 | 12000 | 3 |
| 4 | Thin Cut | 6 | 115 | 660 | 110 | 11000 | 2 |
| 5+ | Snip Storm | 6+t | max(70,115-5*t) | max(420,660-25*t) | min(180,110+10*t) | max(8000,11000-200*t) | 2 |

### Scoring
- +40 per snip · +300 snip-stage clear
- Depth = snip stages cleared

### Death / result
- `deathReason:"misses"|"early_paint"|"reset_fail"|"late_miss"`
- Card: `SNIP {n}`

### Don’ts
- auto-snip on proximity · credit the painted early mark · window never tightens · clone candycut / shootstar 1:1 (ribbon late-lie is the tell)

### Accept
- Timing addiction; late-lie paint is the visible cheat

---

## 3) eggspoon — HoldBand · Egg Spoon Walk
**Cheat visible:** spoon wobble yanks the sweet band sideways when the egg nearly seats at the finish line (boardwalk egg-and-spoon cousin — wobble snap, not romance tension).
**Feel:** Midway egg-spoon walk stall — hold force while the spoon tries to dump near the line.
**Verb:** Hold force in the band while the egg seats `clearMs` without a wobble snap.
**Depth unit:** Walk
**Input:** Hold/drag force meter (HoldBand)
**Suggested engine:** HoldBand

### Vestibule
- Prop: wooden spoon with painted egg, finish-line flag, wobble vane that twitches before snaps, force band dial
- Barker: “HOLD THE EGG WALK — SPOON WOBBLES WHEN YOU’RE CLOSE”
- Best: `Walks {n}`

### Play loop
1. Band shows sweet force; wobbleSnap from stage 3 yanks band opposite when seat progress > 70%
2. Stay in band for clearMs / egg seat toward the finish mark
3. Out of band > outLimitMs = slip strike / death path; snap hit = wobble death path late
4. Clear when egg seats without snap kill → depth++ · thinner band · nastier wobbles
5. DEATH: slipLimit / outLimit / wobble_snap / never found band

### Stage table
| Stage | title | bandW | wobbleSnap | outLimitMs | clearMs | slipLimit |
|------:|-------|------:|------------|-----------:|--------:|----------:|
| 1 | Soft Teach | 0.30 | 0 | 900 | 1800 | 3 |
| 2 | Mid Walk | 0.24 | 0 | 800 | 2000 | 2 |
| 3 | Wobble Snap | 0.18 | low | 700 | 2200 | 2 |
| 4 | Thin Shell | 0.14 | mid | 600 | 2400 | 2 |
| 5+ | Walk Storm | max(0.08,0.14-0.01*t) | high | 500 | 2600 | 2 |

### Scoring
- +50 per seat tick · +320 walk clear
- Depth = walks won / stages

### Death / result
- `deathReason:"slipped"|"wobble_snap"|"never_found"`
- Card: `WALK {n}`

### Don’ts
- auto-walk button · Love-heat / limbobar romance or limbo copy · ignore wobble snap late · real egg / food spend framing

### Accept
- Force band skill; wobble snap near finish is the readable cheat

---

## 4) tokenrail — GreedFloor · Token Rail Slide
**Cheat visible:** rail edge breathes — tokens look ready to drop, then the rail inhales and pulls them back (coin-pusher cousin with rail-breath tell — distinct from chippusher shelf avalanche).
**Feel:** Midway token / rail slide — greed vs cash-out.
**Verb:** Nudge tokens toward the drop lip; rail breath or rare drop; CASH OUT or SLIDE AGAIN.
**Depth unit:** Floor
**Input:** Tap/drag nudge; then CASH OUT / AGAIN buttons
**Suggested engine:** GreedFloor
**cashOut:** true

### Vestibule
- Prop: brass rail of painted tokens, breathing lip readable, dud tray under, rare prize token tinted
- Barker: “SLIDE THE TOKENS — OR WALK WITH WHAT YOU GOT”
- Best: `Floor {n}` · rares held

### Play loop
1. Each floor: N slides; rarePct chance a token drops; else railBreath pulls tokens back (tell after first dud)
2. After each slide: **CASH OUT** (end, keep depth/loot) or **AGAIN**
3. Clear floor if rare found OR survive slidesToClear without hitting deathRule → may DESCEND
4. DEATH: breathStreakDeath on floor≥2 OR empty bank after committing again with no rare
5. Depth = floors survived / descended

### Stage / floor table
| Floor | slides | rarePct | breathStreakDeath | slidesToClear | railBreath | railWobble |
|------:|-------:|--------:|------------------:|--------------:|:----------:|------------|
| 1 | 8 | 16 | no | 3 | yes (chalk lip) | 0 |
| 2 | 10 | 12 | 3 | 3 | yes | low |
| 3 | 10 | 10 | 3 | 4 | yes | low |
| 4 | 12 | 8 | 2 | 4 | yes | mid |
| 5+ | 14 | 6 | 2 | 5 | yes + distractor | high |

### Scoring
- rare rarity points · +220 floor survived · cash-out bonus +12% if floor≥4
- Depth = floors

### Death / result
- `deathReason:"breath_streak"|"empty_bank"|"rail_breath"` · cashedOut flag when voluntary exit
- Card: `FLOOR {n}`

### Don’ts
- fair frictionless rail forever · hide breath with no tell · no CASH OUT button · real-money / casino rail copy · clone chippusher / coinpusher 1:1

### Accept
- Greed sweat; rail breath is the alley joke players can spot

---

## 5) colourveil — OracleRooms · Colour Veil Pick
**Cheat visible:** twin colour veils fib — stillness opens a trio; twin decoy veils swap hues after the curtain lifts (oracle cousin, colour-pick not door/age/weight/palm).
**Feel:** Midway colour / veil booth — hold still, then pick the true veil.
**Verb:** Hold stillness to open rooms; tap a veil; fib veils = curtain death.
**Depth unit:** Veil
**Input:** Stillness wait → tap a veil card
**Suggested engine:** OracleRooms
**Copy tone:** soft_cute — playful colour fortune, no destiny-romance / medical

### Vestibule
- Prop: three painted carnival colour veils, curtain, paper colour slips, crystal-ish needle
- Barker: “HOLD STILL — THEN PICK THE TRUE COLOUR”
- Best: `Veils {n}`

### Play loop
1. Stillness for waitMs opens the room; break early = broke_still
2. Veils shown; fibCount veils are lies; twinSwap stage 3+ swaps two hues after open
3. Pick true veil → depth++ · more veils / nastier swaps
4. Wrong veil / timeout → DEATH (curtain)

### Stage table
| Stage | title | waitMs | breakLimitMs | veils | fibCount | twinSwap | pickWindowMs |
|------:|-------|-------:|-------------:|------:|---------:|:--------:|-------------:|
| 1 | Soft Teach | 1200 | 4000 | 3 | 1 | no | 5000 |
| 2 | Mid Curtain | 1400 | 3800 | 3 | 1 | no | 4500 |
| 3 | Twin Fib | 1600 | 3500 | 3 | 2 | yes | 4000 |
| 4 | Four Frames | 1800 | 3200 | 4 | 2 | yes | 3500 |
| 5+ | Veil Storm | min(2400,1800+80*t) | max(2200,3200-100*t) | 4+(t%2) | 2 | yes + feint | max(2200,3500-100*t) |

### Scoring
- +120 per true veil · +280 veil-stage clear
- Depth = veils / rooms cleared

### Death / result
- `deathReason:"wrong_veil"|"broke_still"|"timeout"|"fib_swap"`
- Card: `VEIL {n}`

### Don’ts
- destiny-romance / medical copy · skip stillness gate · always-fair single veil · shame / curse framing · clone fortunedoors / ageguess / palmfog 1:1

### Accept
- Stillness then pick; twin fib colours are the readable cheat

---

## 6) cupstack — Custom · Soft Cup Stack
**Cheat visible:** stack leans / tip-nudges when near clear height — cups “almost tower” then breathe sideways (distinct from softbottle knock and magician cups shell game).
**Feel:** Boardwalk soft cup-stack booth — build the tower before the lean dump.
**Verb:** Tap-place soft cups onto the growing stack; clear height without lean tip or spill.
**Depth unit:** Stack
**Input:** Tap place / light drag seat (Custom — TimingTap seat cousin + lean physics)
**Suggested engine:** Custom

### Vestibule
- Prop: soft paper cups, chalk height marks, prize shelf décor, lean seams readable on the stack base
- Barker: “STACK THE SOFT CUPS — TOWER LEANS WHEN YOU’RE CLOSE”
- Best: `Stacks {n}`

### Play loop
1. Stage posts needCups / timeBudgetMs; stack starts empty at base
2. Tap-place seats a cup; miss / soft bounce = spill strike; lean tip stage 3+ yanks stack when height progress > 75%
3. Clear when needCups seated without tip kill → depth++ · taller need · nastier lean
4. DEATH: time out / spillLimit / lean_tip / cups_out

### Stage table
| Stage | title | needCups | timeBudgetMs | leanTip | spillLimit | cupSoft | placeWindowMs |
|------:|-------|---------:|-------------:|:-------:|-----------:|--------:|--------------:|
| 1 | Soft Teach | 4 | 22000 | no | 3 | soft | 4000 |
| 2 | Mid Tower | 5 | 20000 | no | 2 | soft | 3500 |
| 3 | Lean Breath | 6 | 18000 | yes (low) | 2 | mid | 3000 |
| 4 | Thin Stack | 7 | 16000 | yes (mid) | 2 | mid | 2800 |
| 5+ | Stack Storm | 7+t | max(10000,16000-400*t) | yes (high) | 2 | hard | max(1800,2800-80*t) |

### Scoring
- +25 per cup seated · +340 stack clear · time leftover bonus
- Depth = stacks cleared

### Death / result
- `deathReason:"timeout"|"spill"|"lean_tip"|"cups_out"`
- Card: `STACK {n}`

### Don’ts
- auto-stack solve · fair towers with no lean tell · clone softbottle / magiciancups 1:1 · soft-lock forever without spill death

### Accept
- Place skill; lean tip near clear height is the alley joke

---

## Engine map
| gameId | engine | depthUnit |
|--------|--------|-----------|
| lidtoss | SlingAim | Lid |
| ribbonsnip | TimingTap | Snip |
| eggspoon | HoldBand | Walk |
| tokenrail | GreedFloor | Floor |
| colourveil | OracleRooms | Veil |
| cupstack | Custom | Stack |

## Implement order
1. lidtoss (shares SlingAim / tin-lid rim-spit fork)
2. ribbonsnip (TimingTap late-lie)
3. eggspoon (HoldBand wobble snap)
4. tokenrail (GreedFloor cash-out)
5. colourveil (OracleRooms colour fib)
6. cupstack (Custom stack + lean)

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: lidtoss, ribbonsnip, eggspoon, tokenrail, colourveil, cupstack.
Door tag: `Depth run` only if engine mounted.

---

## Shared alley notes (Batch 27)
- Vestibule always shows the cheat prop in the tent mouth (rim bevel / early paint / wobble vane / breathing rail / twin veils / lean seams).
- Result cards share runKit chrome: depth · score · deathReason · Aura line · challenge copy · replay.
- Fever Run may gate any live engine later; do not soft-lock sheets on feverNode flags.
- Mobile: one-thumb primary; no multi-touch required; no webcam; no mic.
- Coin: 1 coin = 1 run unless feverNode route already spent.

## Alley cheat checklist (visible tells)
| gameId | mouth tell | stage when tell hardens |
|--------|------------|-------------------------|
| lidtoss | rim bevel glints before spit | stage 3+ rimSpit |
| ribbonsnip | painted cut mark sits early | stage 3+ lateLieMs |
| eggspoon | wobble vane twitches near finish | stage 3+ wobbleSnap |
| tokenrail | chalk/ridge lip before breath | floor 1 chalk; floor 2+ streak death |
| colourveil | twin veils shimmer before swap | stage 3+ twinSwap |
| cupstack | base lean seams before tip | stage 3+ leanTip @ 75% |

## Depth / persistence
- `bestDepth.lidtoss` · `bestDepth.ribbonsnip` · `bestDepth.eggspoon` · `bestDepth.tokenrail` · `bestDepth.colourveil` · `bestDepth.cupstack`
- `lastRun[gameId]` feeds `#cabinet/{gameId}/result`
- Challenge strings live in GOBLIN_BATCH27_AURA_LINES.md

## Death reason glossary (Batch 27)
- lidtoss: lids_out · rim_spit · airball_streak
- ribbonsnip: misses · early_paint · reset_fail · late_miss
- eggspoon: slipped · wobble_snap · never_found
- tokenrail: breath_streak · empty_bank · rail_breath (+ cashedOut)
- colourveil: wrong_veil · broke_still · timeout · fib_swap
- cupstack: timeout · spill · lean_tip · cups_out

## Accept suite (quick)
1. lidtoss stage 1 seats teach in ~10s; stage 3 spit readable
2. ribbonsnip paint lie never credits; late window tightens
3. eggspoon wobble only near finish; band thins
4. tokenrail CASH OUT exists; breath tell before streak death
5. colourveil stillness gate required; twin swap stage 3+
6. cupstack lean tip near clear; no auto-stack

## Anti-clone notes
- ≠ tincansoft / canalley (lid seat vs knock-down)
- ≠ candycut / shootstar / bellhammer (ribbon snip theme; same TimingTap family OK)
- ≠ limbobar / cottonwind / tugband / love (egg wobble walk theme)
- ≠ chippusher / coinpusher / pigslide / wishwell (token rail breath theme)
- ≠ fortunedoors / ageguess / weightguess / palmfog (colour veil theme)
- ≠ softbottle / magiciancups / bankaball (cup stack lean theme)
