# Goblin Batch 04 — full engine sheets
# Fairy Floss · Popcorn Kettle · Duck Pond · Skee-Ball · Coin Pitch Cloth · Dunk Barker
# DNA: 1 coin = 1 run · depth until DEATH · cheat/joke visible in tent mouth · mobile · solo Aura

---

## 1) Fairy Floss Wheel
**Joke:** Sugar web snaps if you rush.
**Feel:** Food-stall game, soft look, hard fail.
**Verb:** Hold-drag to wind floss onto a cone; keep tension in the sweet band.

### Vestibule
- Prop: spinning sugar tub, paper cone, pink web
- Barker: “WIND IT TALL — DON’T SNAP THE CLOUD”
- Best: `Metres {n}` / `Stage`

### Play
- Cone at center. Pointer drag winds angle; speed = pull rate.
- Tension meter: too slow = sag (no metre gain); too fast = SNAP → strike
- 2 snaps = DEATH (stage 1: 3)
- Clear stage by winding `metresNeeded` without death → depth++ · tub spins faster · sweet band thinner

### Stage table
| Stage | metresNeeded | bandWidth | tubRpm | snapLimit |
|------:|-------------:|----------:|-------:|----------:|
| 1 | 3 | wide | slow | 3 |
| 2 | 4 | wide | + | 2 |
| 3 | 5 | mid | + | 2 |
| 4 | 6 | mid | ++ | 2 |
| 5 | 7 | thin | ++ | 2 |
| 6+ | 7+t | thinner | +++ | 2 |

### Scoring
- +20 per 0.1m · +250 clear · depth = stages
### Death
- Snap limit · `FLOSS 12m · “Aura: You got greedy with the spin.”`
### Don’t
- Instant full cone button
### Accept
- Rhythm of winding; visible snap

---

## 2) Popcorn Kettle
**Joke:** Only true pops count; kettle lies with steam fakes.
**Feel:** Hot kettle counter.
**Verb:** Tap exactly on pop events (audio+visual).

### Play
- Pop events schedule; tap within ±hitMs of event = catch
- Miss / early / late = kernel burn strike. 3 burns = DEATH
- Fake steam puffs (no score; tapping fake = strike) from stage 3
- Clear = catch `need` true pops → depth++

### Stage table
| Stage | need | hitMs | popGapMs | fakeChance |
|------:|-----:|------:|---------:|-----------:|
| 1 | 8 | 140 | 700 | 0 |
| 2 | 10 | 120 | 620 | 0 |
| 3 | 12 | 110 | 560 | 0.15 |
| 4 | 14 | 100 | 500 | 0.22 |
| 5 | 16 | 90 | 450 | 0.28 |
| 6+ | 16+2*t | max(55,90-4*t) | max(300,450-20*t) | min(0.45,0.28+0.03*t) |

### Vestibule / score / death
- Barker: “TAP THE POP — IGNORE THE STEAM”
- +15 per catch · +300 clear · depth = stages
- Death: `BATCH 5 · “Aura: That was steam, sugar.”`
### Don’t
- Hold-to-auto-catch
### Accept
- False-start brain; fakes hurt

---

## 3) Duck Pond Hook
**Joke:** Only certain colours score; pond speeds up.
**Feel:** Kid pond that turns mean.
**Verb:** Tap-drag hook to catch ducks floating past.

### Play
- Ducks move on path; hook radius small
- Stage target colour(s) posted. Wrong colour catch = strike (release it) or soft miss
- 3 wrong = DEATH. Clear when `need` correct ducks caught
- Depth = stages

### Stage table
| Stage | colours | need | speed | hookR | wrongLimit |
|------:|---------|-----:|------:|------:|-----------:|
| 1 | yellow | 5 | slow | big | 3 |
| 2 | yellow | 6 | + | big | 3 |
| 3 | yellow/blue | 7 | + | mid | 3 |
| 4 | blue | 8 | ++ | mid | 2 |
| 5 | red only | 8 | ++ | small | 2 |
| 6+ | rotating call every 2 catches | 10 | +++ | small | 2 |

### Vestibule
- Barker: “HOOK THE CALL — NOT EVERY DUCK IS LUCKY”
### Scoring
- +40 correct · +280 clear
### Don’t
- All ducks equal forever

---

## 4) Skee-Ball Alley
**Joke:** Rings shrink; lane wax lies.
**Feel:** Boardwalk skee lane.
**Verb:** Timing power bar to lob ball up lane into rings.

### Play
- Pull timing bar (Ball Toss power cousin) → ball arc
- Rings: 10 / 20 / 30 / 50 (center)
- 9 balls per stage (classic). Clear if score ≥ target. Fail → DEATH
- Wax: occasional lane friction change mid-stage (readable sheen)

### Stage table
| Stage | target | ringScale | waxLies | balls |
|------:|-------:|----------:|:------:|------:|
| 1 | 100 | 1.0 | no | 9 |
| 2 | 140 | 0.95 | no | 9 |
| 3 | 180 | 0.9 | yes | 9 |
| 4 | 220 | 0.85 | yes | 9 |
| 5 | 260 | 0.8 | yes | 9 |
| 6+ | 260+40*t | max(0.55,0.8-0.03*t) | yes | 9 |

### Vestibule
- Barker: “ROLL UP — BEAT THE BOARD”
- Depth = stages cleared · also show best single-stage points
### Death
- Under target after 9 · `SKEE 4 · “Aura: Wax got you.”`
### Don’t
- Unlimited balls

---

## 5) Penny Pitch Cloth
**Joke:** Cloth jerks when you’re mid-throw.
**Verb:** Drop/toss pennies onto coloured squares.

### Play
- Top-down cloth with squares (values). Aim + drop (tap)
- After release, cloth may jerk (stage 2+) shifting targets
- Clear = earn `need` points in 5 pennies. Fail → DEATH
- Depth = stages

### Stage table
| Stage | needPts | jerk | squareSize | pennies |
|------:|--------:|------|------------:|--------:|
| 1 | 30 | none | big | 5 |
| 2 | 40 | rare | big | 5 |
| 3 | 50 | mid | mid | 5 |
| 4 | 60 | mid | mid | 5 |
| 5 | 70 | often | small | 5 |
| 6+ | 70+10*t | often | smaller | 5 |

### Vestibule
- Barker: “LAND A COLOUR — CLOTH HAS OPINIONS”
### Scoring
- Face value · +250 clear

---

## 6) Dunk the Barker
**Joke:** Target plate shrinks and swings nastier; dunk is checkpoint emotion but run continues.
**Verb:** Throw at plate (aim+power); hit = dunk cinematic + depth++; miss streak kills.

### Play
- 3 balls per “seat”. Hit plate = dunk · depth++ · next seat harder. Miss all 3 = DEATH
- Plate: swing speed + scale from stage

### Stage table
| Seat | plateScale | swing | hitRadius |
|------:|-----------:|------:|----------:|
| 1 | 1.0 | slow | big |
| 2 | 0.9 | + | mid |
| 3 | 0.8 | ++ | mid |
| 4 | 0.7 | ++ | small |
| 5+ | max(0.45,0.7-0.04*t) | +++ | small |

### Vestibule
- Aura on dunk seat (cute, not mean-spirited) · Barker: “SOAK THE CROWN — HOW MANY SEATS?”
### Scoring
- +400 dunk · depth = dunks
### Don’t
- Mean-spirited humiliation copy; keep playful
### Accept
- Satisfying dunk; harder seats

---

## Hand-off
Behind P0 + batch 01–03. Food row (Floss/Popcorn/Duck) good art-filler + engine pairs. Skee + Pitch + Dunk = classic midway spine.
