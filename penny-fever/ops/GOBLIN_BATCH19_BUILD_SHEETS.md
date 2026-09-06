# Goblin Batch 19 — full engine sheets (quiet drop)
# Coconut Shy Soft · Tin Can Alley Soft · Plinko Skill Drop · Wheel of Snacks · Midway Maze · Aura Tip Jar Timing
# DNA: 1 coin = 1 run · depth until DEATH · tent mouth shows the cheat · mobile-first · solo Aura
# Source of truth for ids/engines/params: GOBLIN_BATCH19_MOUNT_CONFIGS.md
# Soft/cute tip jar — no hustle guilt. Snack wheel = flavour labels only (not gambling).

Shared: routes `#cabinet/{coconutsoft|tincansoft|plinkoskill|snackwheel|midwaymaze|tipjar}` vestibule/play/result · `bestDepth.*` · result challenge copy · no webcam · no real-money

---

## 1) coconutsoft — SlingAim · Coconut Shy Soft
**Cheat visible:** still a shy — gaps shrink later; early stages oversized soft targets (onboarding cousin of coconut).
**Feel:** Gentler coconut shy for first-coin players.
**Verb:** Aim + power sling balls to knock soft coconuts.
**Depth unit:** Shy
**Input:** Drag-aim + pull power (share SlingAim / coconut launcher)
**skinOf:** coconut

### Vestibule
- Prop: oversized soft coconuts on pegs, wide gaps early, 5 softballs in trough
- Barker: “KNOCK THE SOFT ONES — GAPS GET MEAN LATER”
- Best: `Shys {n}`

### Play loop
1. Stage posts need (coconuts to knock)
2. Player throws; coconutScale oversized early; gapScale starts generous
3. Hit = coconut down; miss burns a ball
4. Clear when need met with balls remaining → depth++ · sway from stage 4
5. DEATH: balls out before need (missesToDeath 4 — softer than coconut)

### Stage table
| Stage | title | need | coconutScale | gapScale | sway | balls | missesToDeath |
|------:|-------|-----:|-------------:|---------:|:----:|------:|--------------:|
| 1 | Wide Soft | 2 | ~1.20 | ~1.10 | no | 5 | 4 |
| 2 | Mid Shy | 2 | ~1.18 | ~1.065 | no | 5 | 4 |
| 3 | Soft Sway | 3 | ~1.16 | ~1.03 | no | 5 | 4 |
| 4 | Tight Soft | 3 | ~1.14 | ~0.995 | yes | 5 | 4 |
| 5+ | Tight Soft+ | 4 | min(1.3,1.2-0.02*t) | max(0.8,1.1-0.035*t) | yes | 6 | 4 |

### Scoring
- +60 per coconut · +350 shy clear · +80×stage
- Depth = shys cleared

### Death / result
- `deathReason:"balls_out"`
- Card: `SHY {n}`

### Don’ts
- as-hard-as coconut on stage 1 · magnet snap · ignore missesToDeath 4

### Accept
- Stage 1 feels fair/kind; stage 4+ still asks aim; onboarding without removing alley DNA

---

## 2) tincansoft — SlingAim · Tin Can Alley Soft
**Cheat visible:** bottoms still heavier than tops, but lighter than canalley; soft bounce; glue creeps in late.
**Feel:** Can Alley onboarding cousin — feather teach.
**Verb:** SlingAim throw to topple light tin stacks.
**Depth unit:** Stack
**Input:** Drag-aim + power (share canalley / milk launcher DNA)
**skinOf:** canalley

### Vestibule
- Prop: tall-narrow can silhouette pyramid, soft bounce chalked on rail
- Barker: “LIGHT CANS — STILL A STACK TO CLEAR”
- Best: `Stacks {n}`

### Play loop
1. Stack with topMass < midMass < bottomMass (lighter than canalley)
2. throwsPerStack attempts; clear = all cans past fall threshold
3. glueBottoms from stage 4; wind from stage 4
4. Fail to clear → DEATH (throws out / incomplete)
5. missesToDeath 4 soft bank

### Stage table
| Stage | title | topMass | midMass | bottomMass | spacing | glueBottoms | wind | throwsPerStack | bounceSnap |
|------:|-------|--------:|--------:|-----------:|---------|------------:|-----:|---------------:|-----------:|
| 1 | Feather Teach | 0.75 | 1.10 | 1.80 | wide | 0 | 0 | 4 | 1.05 |
| 2 | Light Stack | 0.73 | 1.08 | 1.77 | wide | 0 | 0 | 4 | 1.05 |
| 3 | Soft Glue | 0.71 | 1.06 | 1.74 | mid | 0 | 0 | 4 | 1.05 |
| 4 | Soft Storm | 0.69 | 1.04 | 1.71 | mid | 1 | 0.08 | 4 | 1.05 |
| 5+ | Soft Storm+ | max(0.55,0.75-0.02*t) | max(0.9,1.1-0.02*t) | max(1.4,1.8-0.03*t) | tight | 1 | 0.08 | 3 | 1.05 |

canSilhouette: tall_narrow

### Scoring
- +50 per can · +400 stack clear
- Depth = stacks cleared

### Death / result
- `deathReason:"throws"|"incomplete"`

### Don’ts
- canalley masses on stage 1 · duplicate Milk exactly · ignore soft bounce

### Accept
- Feels kinder than canalley but still shows mass cheat; bounceSnap 1.05 readable

---

## 3) plinkoskill — Custom · Plinko Skill Drop
**Cheat visible:** board breathes tilt; dead pegs late; lane choice biases entry — not pure RNG after pick.
**Feel:** BATCH03 plinko DNA with player-chosen drop lane.
**Verb:** Pick drop lane, drop chips; tilt amp/hz escalate; land in target slot band.
**Depth unit:** Stage
**Input:** Tap lane (1–5) then drop; optional breathe-tilt read
**skinOf:** plinko

### Vestibule
- Prop: peg board, five drop mouths, breathing frame, target slots lit
- Barker: “PICK THE LANE — RIDE THE TILT”
- Best: `Stages {n}`

### Play loop
1. Player chooses drop lane (`playerChoosesLane:true`, dropLanes:5)
2. Chip drops with biasFromEntry + continuous tiltAmp/tiltHz
3. Need targetSlotMin hits across chips (3 chips)
4. Clear if enough chips land in target band → depth++
5. DEATH: all chips miss target band (`chips_out`)
6. deadPegEveryNthRow from stage 4

### Stage table
| Stage | title | targetSlotMin | chips | tiltAmp | tiltHz | deadPegEveryNthRow |
|------:|-------|--------------:|------:|---------|-------:|-------------------:|
| 1 | Soft Drop | 3 | 3 | low 0.08 | ~0.35 | 0 |
| 2 | Breath Mid | 4 | 3 | mid 0.16 | ~0.39 | 0 |
| 3 | Aim Five | 5 | 3 | mid 0.16 | ~0.43 | 0 |
| 4 | Dead Pegs | 6 | 3 | high 0.28 | ~0.47 | 4 |
| 5+ | Tilt Storm | min(8,6+floor(t/2)) | 3 | high 0.28 | min(0.65,0.35+0.04*t) | 3 |

### Scoring
- +80 per chip in band · +350 stage clear
- Depth = stages cleared

### Death / result
- `deathReason:"chips_out"`

### Don’ts
- pure RNG after lane pick · ignore tilt breathe · no player lane choice

### Accept
- Lane skill readable; tilt is the cheat you can see; not a casino plinko

---

## 4) snackwheel — TimingTap · Wheel of Snacks
**Cheat visible:** wedges thin later; skill-stop required — labels are flavour art only.
**Feel:** Wheel of Luck skin with snack names (demo tickets only — never real-prize copy).
**Verb:** Tap STOP when pointer sits in target snack band.
**Depth unit:** Stop
**Input:** Tap STOP during spin (neverAutoStop)
**skinOf:** wheel

### Vestibule
- Prop: candy-coloured wheel, snack wedges (popcorn / taffy / pretzel art), skill-stop button
- Barker: “STOP ON THE TREAT — LABELS ARE FLAVOUR”
- Best: `Stops {n}`

### Play loop
1. Wheel spins for spinMs; player taps STOP
2. Land in targetBand (any_snack → sweet → salty → rare → jackpot_flavour)
3. Miss wedge = death (graceStrikes 1 on stage 1 only)
4. Clear → depth++ · thinner wedges

### Stage table
| Stage | title | wedgeW | spinMs | targetBand | graceStrikes |
|------:|-------|--------|-------:|------------|-------------:|
| 1 | Wide Wedge | wide | 1400 | any_snack | 1 |
| 2 | Snack Hunt | mid | 1250 | sweet | 0 |
| 3 | Tight Treat | mid | 1100 | salty | 0 |
| 4 | Rare Snacks | thin | 950 | rare | 0 |
| 5+ | Rare Snacks+ | thin | 850 | jackpot_flavour | 0 |

snackLabelsOnly: true

### Scoring
- +120 per stop · +200×stage
- Depth = stops cleared

### Death / result
- `deathReason:"miss_wedge"`

### Don’ts
- true RNG after STOP · real-prize gambling copy · auto-freeze stage 1 forever

### Accept
- Skill-stop feel; snack art is costume; no wallet/guilt framing

---

## 5) midwaymaze — Custom · Midway Maze
**Cheat visible:** timer bites; ghosts appear from stage 3 and touch = death.
**Feel:** Tiny top-down carnival maze between tents.
**Verb:** Steer to exit before timeSec; avoid ghosts.
**Depth unit:** Maze
**Input:** Swipe / virtual stick / tap-to-step (topDown:true)

### Vestibule
- Prop: cardboard maze plan, exit lamp, ghost silhouette chalked for later
- Barker: “FIND THE EXIT — BEFORE THE GHOSTS”
- Best: `Mazes {n}`

### Play loop
1. Spawn in maze of size small/mid/big
2. Reach exit before timeSec
3. Ghosts (0 → 1 → 2) patrol; touch = death
4. Clear exit → depth++ · bigger / faster / more ghosts
5. DEATH: timer OR ghost touch

### Stage table
| Stage | title | size | timeSec | ghosts |
|------:|-------|------|--------:|-------:|
| 1 | Tiny Teach | small | 40 | 0 |
| 2 | Mid Paths | mid | 35 | 0 |
| 3 | First Ghost | mid | 30 | 1 |
| 4 | Big Haunt | big | 28 | 1 |
| 5+ | Ghost Storm | big | max(18,25-(t-4)) | 2 |

deathOnTimer: true · deathOnGhostTouch: true

### Scoring
- +200 maze clear · leftover seconds × 5
- Depth = mazes cleared

### Death / result
- `deathReason:"timer"|"ghost"`

### Don’ts
- no ghosts late · infinite timer · wall-clip exit

### Accept
- Stage 1 teaches layout; stage 3+ ghost pressure; mobile-readable maze

---

## 6) tipjar — TimingTap · Aura Tip Jar Timing
**Cheat visible:** fake bounce coins (stage 3+) look landable; sweet spot shrinks.
**Feel:** Soft, cute tip-jar timing — no hustle guilt copy.
**Verb:** Tap when the tip coin hits the jar sweet spot.
**Depth unit:** Tip
**Input:** Tap on descent beat (windowMs)

### Vestibule
- Prop: glass tip jar, soft coin arc, Aura smile sticker
- Barker: “CATCH THE TIP — SKIP THE FAKE BOUNCE”
- Best: `Tips {n}`
- Tone: soft_cute

### Play loop
1. Coin arcs toward jar; true land window windowMs
2. Hit sweet spot → tip counted
3. Miss = strike; fake bounce tap (fakeBouncePct stage 3+) = fake_bounce
4. Clear when need met → depth++
5. DEATH at missesToDeath

### Stage table
| Stage | title | need | windowMs | fakeBouncePct | missesToDeath |
|------:|-------|-----:|---------:|--------------:|--------------:|
| 1 | Soft Drop | 4 | 170 | 0 | 3 |
| 2 | Jar Catch | 5 | 150 | 0 | 3 |
| 3 | Fake Bounce | 6 | 130 | 15 | 3 |
| 4 | Tip Storm | 7 | 115 | 22 | 2 |
| 5+ | Tip Storm+ | 7+t | max(75,115-5*t) | 28 | 2 |

### Scoring
- +35 per tip · +290 clear
- Depth = tips cleared

### Death / result
- `deathReason:"misses"|"fake_bounce"`

### Don’ts
- casino tip-guilt copy · no fakes late · auto-catch jar

### Accept
- Cute timing addiction; fakes punish greed taps; soft pack VO only

---

## Engine map
| gameId | engine | depthUnit |
|--------|--------|-----------|
| coconutsoft | SlingAim | Shy |
| tincansoft | SlingAim | Stack |
| plinkoskill | Custom | Stage |
| snackwheel | TimingTap | Stop |
| midwaymaze | Custom | Maze |
| tipjar | TimingTap | Tip |

## Implement notes
- Mount declare()+stageParams live in GOBLIN_BATCH19_MOUNT_CONFIGS.md
- Teaser kill when /play exists: coconutsoft, tincansoft, plinkoskill, snackwheel, midwaymaze, tipjar
- Door tag: `Depth run` only if engine mounted
