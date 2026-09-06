# Goblin Batch 22 — full engine sheets (quiet drop — NEW vendors)
# Soft Hoop Toss · Shoot the Star · Piggy Bank Slide · Tug Band · Guess Your Age · Fascination Rolldown
# 6 NEW stalls not in batches 01–21. Alley DNA: 1930s–50s carnival cheat visible in tent mouth.
# DNA: 1 coin = 1 run · depth until DEATH · mobile-first · solo Aura · no webcam · no real-money
# Engines from runKit: HoldBand / SlingAim / TimingTap / GreedFloor / OracleRooms / Custom
# Params mirrored in GOBLIN_BATCH22_MOUNT_CONFIGS.md

Shared: routes `#cabinet/{hoopswish|shootstar|pigslide|tugband|ageguess|fascination}` vestibule/play/result · `bestDepth.*` · challenge copy

---

## 1) hoopswish — SlingAim · Soft Hoop Toss
**Cheat visible:** rim springs forward on soft arcs; ball is slightly overinflated — “almost in” spit-outs are the alley joke.
**Feel:** Midway soft-hoop / carnival basketball stall (boardwalk 1940s DNA).
**Verb:** Drag-aim + pull power softballs toward a short rim; swish or bounce-out.
**Depth unit:** Hoop
**Input:** Drag-aim + pull power (SlingAim)
**Suggested engine:** SlingAim

### Vestibule
- Prop: short hoop on a striped backboard, springy rim readable, softballs in a trough, prize shelf décor only
- Barker: “SWISH THE SHORT RIM — IT SPRINGS WHEN YOU GET CLOSE”
- Best: `Hoops {n}`

### Play loop
1. Stage posts need (clean swishes / rim-ins counted)
2. Soft arc into rim = credit; too-hard = backboard bounce; springRim stage 3+ kicks borderline shots out (readable)
3. overinflatePct adds spit-out on near-rim contact without net plane clear
4. Clear when need met with balls left → depth++ · tighter rim · more spring
5. DEATH: balls out before need

### Stage table
| Stage | title | need | rimScale | springRim | overinflatePct | balls | backboardLean | missesToDeath |
|------:|-------|-----:|---------:|:---------:|---------------:|------:|--------------:|--------------:|
| 1 | Soft Teach | 2 | 1.00 | no | 0 | 5 | 0 | 4 |
| 2 | Mid Court | 3 | 0.94 | no | 8 | 5 | 0 | 3 |
| 3 | Spring Rim | 3 | 0.90 | yes | 12 | 5 | low | 3 |
| 4 | Short Net | 4 | 0.86 | yes | 16 | 6 | mid | 3 |
| 5+ | Hoop Storm | 4+floor(t/2) | max(0.70,0.86-0.02*t) | yes | min(28,16+2*t) | 6 | high | 2 |

### Scoring
- +80 per swish · +360 hoop clear · +90×stage
- Depth = hoops cleared

### Death / result
- `deathReason:"balls_out"|"spring_spit"|"airball_streak"`
- Card: `HOOP {n}`

### Don’ts
- NBA regulation rim · magnet auto-swish · ignore springRim late · real basketball league copy

### Accept
- Player sees spring rim + overinflate spit as the cheat; stage 1 teachable in ~10s

---

## 2) shootstar — TimingTap · Shoot the Star
**Cheat visible:** paper star outline is thicker on points — “shoot out the star” leaves white edges that count as miss (classic carnival rifle cheat, touch-timed here).
**Feel:** Shoot-the-star booth without firearms — timing pulses “chip” the outline.
**Verb:** Tap CHIP when the pulse crosses a star edge segment; clear all segments before the paper resets.
**Depth unit:** Star
**Input:** Tap on pulse window (`windowMs`); thick-point decoy segments stage 3+
**Suggested engine:** TimingTap

### Vestibule
- Prop: black paper star on white card, pulse sight, thicker point edges readable up close
- Barker: “CHIP THE STAR CLEAN — POINTS LIE THICKER”
- Best: `Stars {n}`

### Play loop
1. Pulse travels star outline; sweet windowMs on thin segments
2. Tap in window → segment chipped; miss / early / thick-point false credit attempt = strike
3. Clear when all segments gone before resetMs → depth++ · faster pulse · thicker points
4. DEATH at missesToDeath OR reset with segments left

### Stage table
| Stage | title | needSeg | windowMs | pulseMs | thickPct | resetMs | missesToDeath |
|------:|-------|--------:|---------:|--------:|---------:|--------:|--------------:|
| 1 | Teach Chip | 5 | 180 | 900 | 0 | 14000 | 3 |
| 2 | Mid Star | 6 | 155 | 820 | 0 | 13000 | 3 |
| 3 | Thick Points | 7 | 135 | 740 | 20 | 12000 | 3 |
| 4 | Thin Pulse | 8 | 115 | 660 | 28 | 11000 | 2 |
| 5+ | Star Storm | 8+t | max(70,115-5*t) | max(420,660-25*t) | 35 | max(8000,11000-200*t) | 2 |

### Scoring
- +35 per segment · +300 star clear
- Depth = stars cleared

### Death / result
- `deathReason:"misses"|"thick_point"|"reset_fail"|"early"`

### Don’ts
- real gun / ammo copy · auto-chip on proximity · credit thick points · window never tightens

### Accept
- Timing addiction; thick points are the visible cheat

---

## 3) pigslide — GreedFloor · Piggy Bank Slide
**Cheat visible:** pig mouth sits just past a soft lip — most slides kiss the lip and fall to the dud tray (classic penny-slide banker).
**Feel:** Midway piggy-bank / penny-slide stall — greed vs cash-out.
**Verb:** Slide a penny toward the pig; dud tray or rare mouth; CASH OUT or SLIDE AGAIN.
**Depth unit:** Floor
**Input:** Drag-slide / flick lane; then CASH OUT / AGAIN buttons
**Suggested engine:** GreedFloor

### Vestibule
- Prop: wooden slide lane, ceramic pig with narrow mouth, soft lip ridge readable, dud tray under
- Barker: “SLIDE A PENNY — OR WALK WITH WHAT YOU GOT”
- Best: `Floor {n}` · rares held

### Play loop
1. Each floor: N slides; rarePct chance mouth swallows; else lip deflect → dud tray (lip ridge readable after first dud)
2. After each slide: **CASH OUT** (end, keep depth/loot) or **AGAIN**
3. Clear floor if rare found OR survive slidesToClear duds without hitting deathRule → may DESCEND
4. DEATH: dudStreakDeath on floor≥2 OR empty bank after committing again with no rare
5. Depth = floors survived / descended

### Stage / floor table
| Floor | slides | rarePct | dudStreakDeath | slidesToClear | lipCheat | laneWobble |
|------:|-------:|--------:|---------------:|--------------:|:---------:|------------|
| 1 | 8 | 16 | no | 3 | yes (chalk lip) | 0 |
| 2 | 10 | 12 | 3 | 3 | yes | low |
| 3 | 10 | 10 | 3 | 4 | yes | low |
| 4 | 12 | 8 | 2 | 4 | yes | mid |
| 5+ | 14 | 6 | 2 | 5 | yes + tighter | high |

### Scoring
- rare rarity points · +220 floor survived · cash-out bonus +12% if floor≥4
- Depth = floors

### Death / result
- `deathReason:"dud_streak"|"empty_bank"|"lip_kiss"` · cashedOut flag when voluntary exit

### Don’ts
- fair frictionless lane forever · hide lip with no tell · no CASH OUT button · real-money banker copy

### Accept
- Greed sweat; soft lip is the alley joke players can spot

---

## 4) tugband — HoldBand · Tug Band
**Cheat visible:** rope marks a “fair” midline; Aura goblin pulls in pulses — sweet band drifts opposite the pulse (midway tug cheat).
**Feel:** Boardwalk tug-o-war / strength band stall — hold the pink/force band while the rope walks.
**Verb:** Hold force in the band while rope seats `seatMs` toward your side.
**Depth unit:** Pull
**Input:** Hold/drag force meter (HoldBand)
**Suggested engine:** HoldBand

### Vestibule
- Prop: knotted rope, midline chalk, force band dial, Aura goblin silhouette tugging opposite
- Barker: “HOLD THE SWEET PULL — DON’T LET THE GOBLIN YANK”
- Best: `Pulls {n}`

### Play loop
1. Band shows sweet force; pulseWobble from stage 3 yanks band opposite
2. Stay in band for clearMs / seat progress toward your win mark
3. Out of band > outLimitMs = slip strike / death path
4. Clear when rope seats past win mark → depth++ · thinner band · nastier pulses
5. DEATH: slipLimit / outLimit / never found band

### Stage table
| Stage | title | bandW | pulseWobble | outLimitMs | clearMs | slipLimit |
|------:|-------|------:|-------------|-----------:|--------:|----------:|
| 1 | Soft Teach | 0.30 | 0 | 900 | 1800 | 3 |
| 2 | Mid Rope | 0.24 | 0 | 800 | 2000 | 2 |
| 3 | Goblin Pulse | 0.18 | low | 700 | 2200 | 2 |
| 4 | Thin Tug | 0.14 | mid | 600 | 2400 | 2 |
| 5+ | Tug Storm | max(0.08,0.14-0.01*t) | high | 500 | 2600 | 2 |

### Scoring
- +50 per seat tick · +320 pull clear
- Depth = pulls won / stages

### Death / result
- `deathReason:"slipped"|"yanked"|"never_found"`

### Don’ts
- auto-win button · Love-heat romance copy · ignore pulse late · PvP / multiplayer framing

### Accept
- Force band skill; goblin pulse drift is the readable cheat

---

## 5) ageguess — OracleRooms · Guess Your Age
**Cheat visible:** booth “thinks”; stillness opens the guess room; barker always “close” — wrong decade drops the curtain (soft pack, never cruel).
**Feel:** Guess-your-age booth — oracle stillness DNA, playful twin of Guess Your Weight.
**Verb:** Hold stillness to open rooms; pick an age-band card; wrong = curtain death.
**Depth unit:** Room
**Input:** Stillness wait → tap an age range card
**Suggested engine:** OracleRooms
**Copy tone:** soft_cute — no age-shame / no “look old” digs

### Vestibule
- Prop: carnival booth, curtain, age cards (±years bands), crystal-ish needle
- Barker: “HOLD STILL — THEN GUESS THE DECADE”
- Best: `Rooms {n}`

### Play loop
1. waitMs stillness opens the guess room
2. Needle drifts; player picks a band (wide early, thin late)
3. Correct band → room clear · depth++ · ticketGen flavour line
4. Wrong band OR break stillness before wait → toward breakLimit / death
5. allowDoubleFrom mid stages = optional second peek (greed)

### Stage / room table
| Room | waitMs | breakLimitMs | bandWidth | allowDouble | notes |
|------:|-------:|-------------:|-----------|:-----------:|-------|
| 1 | 1200 | 4000 | wide (±8y) | no | teach |
| 2 | 1400 | 3800 | wide (±6y) | no | |
| 3 | 1600 | 3500 | mid (±4y) | yes | decade feint |
| 4 | 1800 | 3200 | mid (±3y) | yes | |
| 5+ | min(2400,1800+80*t) | max(2200,3200-100*t) | thin (±2y) | yes | double-feint |

### Scoring
- +150 room · accuracy bonus if exact decade card
- Depth = rooms cleared

### Death / result
- `deathReason:"wrong_band"|"broke_still"|"timeout"`

### Don’ts
- age-shame / “you look ancient” copy · medical / ID framing · skip stillness gate · body-shame crossover

### Accept
- Oracle stillness + playful guess; soft pack only; distinct from weightguess via decade cards

---

## 6) fascination — Custom · Fascination Rolldown
**Cheat visible:** numbered pit chart posts a target that nudges when you’re one hole shy; “almost” rolls are the midway lie (fascination / rolldown DNA).
**Feel:** 1930s–50s fascination / rolldown counter — skill-stop balls + impossible chart joke.
**Verb:** Skill-stop balls into numbered pits; cash progress or risk another roll toward a moving target.
**Depth unit:** Card
**Input:** TimingTap-style stop for each roll + GreedFloor cash-out UX (declare Custom)
**Suggested engine:** Custom (TimingTap stop + GreedFloor UX)

### Vestibule
- Prop: inclined rolldown board, numbered pits, “WIN AT ___” placard that subtly revises
- Barker: “ROLL ’EM DOWN — CHART MOVES WHEN YOU GET CLOSE”
- Best: `Cards {n}`

### Play loop
1. Each card: targetScore posted; player skill-stops `rolls` into numbered pits
2. Sum toward target; chartCheat: when sum ≥ target−nearGap, target bumps +cheatBump (readable placard rewrite)
3. After each roll: **CASH OUT** partial (bank score, depth kept if cashed between cards) or **ROLL AGAIN**
4. Clear card if sum ≥ live target within rolls → depth++ · nastier cheat
5. DEATH: rolls exhausted below target OR bustRule on greed continue after near-miss

### Stage / card table
| Card | targetScore | rolls | pitMax | nearGap | cheatBump | grace |
|------:|------------:|------:|-------:|--------:|----------:|------:|
| 1 | 12 | 4 | 6 | 2 | 0 | 1 near free |
| 2 | 14 | 4 | 6 | 2 | 1 | 0 |
| 3 | 16 | 5 | 6 | 3 | 2 | 0 |
| 4 | 18 | 5 | 6 | 3 | 3 | 0 |
| 5+ | 18+2*t | 5 | 6 | 3 | 3+t | 0 |

### Scoring
- +sum on clear · +400 card · cash-out keeps partial ×0.5
- Depth = cards cleared

### Death / result
- `deathReason:"short_sum"|"chart_bump_bust"|"rolls_out"`

### Don’ts
- hidden RNG win with no chart motion · real-money gambling copy · unreadable placard rewrite · clone razzledazzle marble trough art (rolldown incline is the tell)

### Accept
- Player sees the chart cheat; still feels skillful on stops; shareable “I was one pit away”

---

## Engine map
| gameId | engine | depthUnit |
|--------|--------|-----------|
| hoopswish | SlingAim | Hoop |
| shootstar | TimingTap | Star |
| pigslide | GreedFloor | Floor |
| tugband | HoldBand | Pull |
| ageguess | OracleRooms | Room |
| fascination | Custom | Card |

## Implement order
1. hoopswish (shares SlingAim with balltoss/dunk)
2. shootstar (TimingTap)
3. tugband (HoldBand)
4. pigslide (GreedFloor cash-out)
5. ageguess (OracleRooms — soft twin of weightguess)
6. fascination (Custom hybrid last)

Art: Imagine alley tents with 1930s–50s cheat tells visible in vestibule mouths — wire when engines breathe.
