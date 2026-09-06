# Goblin Batch 21 — full engine sheets (quiet drop — NEW vendors)
# Cat Rack · Carousel Brass Ring · Pull-a-String · Hit-the-Nail · Guess Your Weight · Razzle Dazzle
# 6 NEW stalls not in batches 01–20. Alley DNA: 1930s–50s carnival cheat visible in tent mouth.
# DNA: 1 coin = 1 run · depth until DEATH · mobile-first · solo Aura · no webcam · no real-money
# Engines from runKit: HoldBand / SlingAim / TimingTap / GreedFloor / OracleRooms / Custom
# Params mirrored in GOBLIN_BATCH21_MOUNT_CONFIGS.md

Shared: routes `#cabinet/{catrack|brassring|stringpull|nailhammer|weightguess|razzledazzle}` vestibule/play/result · `bestDepth.*` · challenge copy

---

## 1) catrack — SlingAim · Cat Rack
**Cheat visible:** stuffed cats sit on weighted bases — front paws tip, bases barely budge (classic cat-rack lie).
**Feel:** 1930s–50s cat rack alley stall.
**Verb:** Aim + power throw softballs to knock cats clean off the shelf.
**Depth unit:** Rack
**Input:** Drag-aim + pull power (SlingAim)
**Suggested engine:** SlingAim

### Vestibule
- Prop: row of plush cats on a shelf, darker/heavier bases readable, softballs in a trough
- Barker: “KNOCK THE CATS — BASES FIGHT BACK”
- Best: `Racks {n}`

### Play loop
1. Stage posts need (cats fully off shelf)
2. Hit body = tip; weighted base needs second impulse or high power (the cheat)
3. Tip-only without clear = no credit until cat leaves shelf plane
4. Clear when need met with balls left → depth++ · tighter spacing · glued base stage 4+
5. DEATH: balls out before need

### Stage table
| Stage | title | need | cats | baseMass | bodyMass | spacing | balls | gluedBase | missesToDeath |
|------:|-------|-----:|-----:|---------:|---------:|---------|------:|:---------:|--------------:|
| 1 | Soft Paws | 2 | 3 | 2.0 | 0.8 | wide | 5 | no | 4 |
| 2 | Mid Rack | 3 | 4 | 2.3 | 0.8 | wide | 5 | no | 3 |
| 3 | Heavy Base | 3 | 4 | 2.6 | 0.75 | mid | 5 | no | 3 |
| 4 | Glue Paws | 4 | 5 | 2.9 | 0.7 | mid | 6 | yes (1) | 3 |
| 5+ | Cat Storm | 4+floor(t/2) | 5+floor(t/3) | min(4.0,2.9+0.15*t) | 0.65 | tight | 6 | yes | 2 |

### Scoring
- +70 per cat cleared · +380 rack clear · +90×stage
- Depth = racks cleared

### Death / result
- `deathReason:"balls_out"|"tip_only_fail"`
- Card: `RACK {n}`

### Don’ts
- equal mass body/base · magnet auto-clear · ignore gluedBase late

### Accept
- Player sees bases are the cheat; stage 4+ needs planned double-hits

---

## 2) brassring — TimingTap · Carousel Brass Ring
**Cheat visible:** brass ring flashes past; tin rings look identical until last frames; window thins.
**Feel:** Carousel brass-ring grab (boardwalk 1940s DNA).
**Verb:** Tap GRAB when the brass ring crosses the sweet post — ignore tin decoys.
**Depth unit:** Grab
**Input:** Tap on ring pass (`windowMs`); decoy tin rings stage 3+
**Suggested engine:** TimingTap

### Vestibule
- Prop: carousel horse silhouette, ring arm, brass vs dull tin rings
- Barker: “GRAB THE BRASS — SKIP THE TIN”
- Best: `Grabs {n}`

### Play loop
1. Rings pass on a track; true brass opens windowMs
2. Tap brass in window → grab counted
3. Miss / early / tin grab = strike
4. Clear when need met → depth++ · faster pass · more tin
5. DEATH at missesToDeath

### Stage table
| Stage | title | need | windowMs | passMs | tinPct | missesToDeath |
|------:|-------|-----:|---------:|-------:|-------:|--------------:|
| 1 | Teach Pass | 4 | 180 | 900 | 0 | 3 |
| 2 | Mid Carousel | 5 | 155 | 800 | 0 | 3 |
| 3 | Tin Flash | 6 | 135 | 720 | 18 | 3 |
| 4 | Thin Brass | 7 | 115 | 640 | 25 | 2 |
| 5+ | Ring Storm | 7+t | max(70,115-5*t) | max(420,640-25*t) | 32 | 2 |

### Scoring
- +40 per brass · +300 grab clear
- Depth = grabs / stages cleared

### Death / result
- `deathReason:"misses"|"tin_grab"|"early"`

### Don’ts
- auto-grab on proximity · credit tin · window never tightens

### Accept
- Timing addiction; tin decoys are the visible cheat

---

## 3) stringpull — GreedFloor · Pull-a-String Prize Wall
**Cheat visible:** most strings tied to the same dud block behind the curtain (classic string-pull wall).
**Feel:** Midway prize-wall string game — greed vs cash-out.
**Verb:** Pull a string; dud or rare; CASH OUT or PULL AGAIN.
**Depth unit:** Floor
**Input:** Tap a hanging string; then CASH OUT / AGAIN buttons
**Suggested engine:** GreedFloor

### Vestibule
- Prop: curtain wall of numbered strings, prize silhouettes, Aura wink
- Barker: “PULL A STRING — OR WALK WITH WHAT YOU GOT”
- Best: `Floor {n}` · rares held

### Play loop
1. Each floor: N strings; rarePct chance of curio; else dud (many strings share one dud block — readable after first dud)
2. After each pull: **CASH OUT** (end, keep depth/loot) or **AGAIN**
3. Clear floor if rare found OR survive pullsToClear duds without hitting deathRule → may DESCEND
4. DEATH: dudStreakDeath on floor≥2 OR empty wall with no rare after committing again
5. Depth = floors survived / descended

### Stage / floor table
| Floor | strings | rarePct | dudStreakDeath | pullsToClear | sharedDudBlock |
|------:|--------:|--------:|---------------:|-------------:|:--------------:|
| 1 | 10 | 14 | no | 3 | yes (hint chalk) |
| 2 | 12 | 11 | 3 | 3 | yes |
| 3 | 12 | 9 | 3 | 4 | yes |
| 4 | 14 | 7 | 2 | 4 | yes |
| 5+ | 16 | 5 | 2 | 5 | yes + shuffle |

### Scoring
- rare rarity points · +220 floor survived · cash-out bonus +12% if floor≥4
- Depth = floors

### Death / result
- `deathReason:"dud_streak"|"empty_wall"` · cashedOut flag when voluntary exit

### Don’ts
- independent fair RNG per string forever · hide shared dud with no tell · no CASH OUT button

### Accept
- Greed sweat; shared dud is the alley joke players can spot

---

## 4) nailhammer — HoldBand · Hit-the-Nail
**Cheat visible:** nail leans drunk; sweet force band narrows — too hard bends, too soft never seats.
**Feel:** Strongman-adjacent nail stall (county fair 1930s).
**Verb:** Hold hammer force in the band while the nail seats `seatMs`.
**Depth unit:** Nail
**Input:** Hold/drag force meter (HoldBand)
**Suggested engine:** HoldBand

### Vestibule
- Prop: plank, crooked nail, wooden mallet, force band dial
- Barker: “HOLD THE SWEET HIT — DON’T BEND THE NAIL”
- Best: `Nails {n}`

### Play loop
1. Band shows sweet force; nail lean wobble from stage 3
2. Stay in band for clearMs / seat progress
3. Out of band > outLimitMs = bend strike / death path
4. Clear when nail seated → depth++ · thinner band · more lean
5. DEATH: bendLimit / outLimit

### Stage table
| Stage | title | bandW | leanWobble | outLimitMs | clearMs | bendLimit |
|------:|-------|------:|------------|-----------:|--------:|----------:|
| 1 | Soft Teach | 0.30 | 0 | 900 | 1800 | 3 |
| 2 | Mid Seat | 0.24 | 0 | 800 | 2000 | 2 |
| 3 | Drunk Nail | 0.18 | low | 700 | 2200 | 2 |
| 4 | Thin Hit | 0.14 | mid | 600 | 2400 | 2 |
| 5+ | Nail Storm | max(0.08,0.14-0.01*t) | high | 500 | 2600 | 2 |

### Scoring
- +50 per seat tick · +320 nail clear
- Depth = nails seated / stages

### Death / result
- `deathReason:"bent"|"drifted"|"never_found"`

### Don’ts
- auto-seat button · Love-heat romance copy · ignore lean late

### Accept
- Force band skill; crooked nail is the readable cheat

---

## 5) weightguess — OracleRooms · Guess Your Weight
**Cheat visible:** scale “thinks”; stillness opens the guess room; break early and the curtain drops (barker always “close”).
**Feel:** Guess-your-weight booth — oracle stillness DNA, playful not body-shame.
**Verb:** Hold stillness to open rooms; pick a weight band bluff; wrong = curtain death.
**Depth unit:** Room
**Input:** Stillness wait → tap a weight range card
**Suggested engine:** OracleRooms
**Copy tone:** soft_cute — no body shame

### Vestibule
- Prop: carnival scale, curtain booth, weight cards (±lbs bands)
- Barker: “HOLD STILL — THEN GUESS THE NEEDLE”
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
| 1 | 1200 | 4000 | wide (±8) | no | teach |
| 2 | 1400 | 3800 | wide (±6) | no | |
| 3 | 1600 | 3500 | mid (±4) | yes | needle feint |
| 4 | 1800 | 3200 | mid (±3) | yes | |
| 5+ | min(2400,1800+80*t) | max(2200,3200-100*t) | thin (±2) | yes | double-feint |

### Scoring
- +150 room · accuracy bonus if exact needle card
- Depth = rooms cleared

### Death / result
- `deathReason:"wrong_band"|"broke_still"|"timeout"`

### Don’ts
- body-shame / diet copy · medical framing · skip stillness gate

### Accept
- Oracle stillness + playful guess; soft pack only

---

## 6) razzledazzle — Custom · Razzle Dazzle
**Cheat visible:** add-up chart posts a target that drifts after rolls; “almost” scores are the midway lie (classic razzle).
**Feel:** Notorious 1930s–50s razzle/add-em-up counter — skill stop + impossible chart joke.
**Verb:** Skill-stop dice/marbles into add-up; cash progress or risk another toss toward a moving target.
**Depth unit:** Card
**Input:** TimingTap-style stop for each toss + GreedFloor cash-out UX (declare Custom)
**Suggested engine:** Custom (TimingTap stop + GreedFloor UX)

### Vestibule
- Prop: add-up chart, marble/dice trough, “WIN AT ___” placard that subtly revises
- Barker: “ADD ’EM UP — CHART MOVES WHEN YOU GET CLOSE”
- Best: `Cards {n}`

### Play loop
1. Each card: targetScore posted; player skill-stops `tosses` into numbered pits
2. Sum toward target; chartCheat: when sum ≥ target−nearGap, target bumps +cheatBump (readable placard rewrite)
3. After each toss: **CASH OUT** partial (bank score, depth kept if cashed between cards) or **TOSS AGAIN**
4. Clear card if sum ≥ live target within tosses → depth++ · nastier cheat
5. DEATH: tosses exhausted below target OR bustRule on greed continue after near-miss

### Stage / card table
| Card | targetScore | tosses | pitMax | nearGap | cheatBump | grace |
|------:|------------:|-------:|-------:|--------:|----------:|------:|
| 1 | 12 | 4 | 6 | 2 | 0 | 1 near free |
| 2 | 14 | 4 | 6 | 2 | 1 | 0 |
| 3 | 16 | 5 | 6 | 3 | 2 | 0 |
| 4 | 18 | 5 | 6 | 3 | 3 | 0 |
| 5+ | 18+2*t | 5 | 6 | 3 | 3+t | 0 |

### Scoring
- +sum on clear · +400 card · cash-out keeps partial ×0.5
- Depth = cards cleared

### Death / result
- `deathReason:"short_sum"|"chart_bump_bust"|"tosses_out"`

### Don’ts
- hidden RNG win with no chart motion · real-money gambling copy · unreadable placard rewrite

### Accept
- Player sees the chart cheat; still feels skillful on stops; shareable “I was one point away”

---

## Engine map
| gameId | engine | depthUnit |
|--------|--------|-----------|
| catrack | SlingAim | Rack |
| brassring | TimingTap | Grab |
| stringpull | GreedFloor | Floor |
| nailhammer | HoldBand | Nail |
| weightguess | OracleRooms | Room |
| razzledazzle | Custom | Card |

## Implement order
1. catrack (shares SlingAim with milk/canalley)
2. brassring (TimingTap)
3. nailhammer (HoldBand)
4. stringpull (GreedFloor cash-out)
5. weightguess (OracleRooms)
6. razzledazzle (Custom hybrid last)

Art: Imagine alley tents with 1930s–50s cheat tells visible in vestibule mouths — wire when engines breathe.
