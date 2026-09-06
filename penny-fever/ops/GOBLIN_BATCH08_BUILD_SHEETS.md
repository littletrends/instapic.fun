# Goblin Batch 08 — full engine sheets
# Ring Toss Classic · Coconut Shy · Beanbag Mouth · Cornhole Drift · Ice Cream Stack · Hot-Dog Tong Race
# DNA: 1 coin = 1 run · depth until DEATH · joke visible · mobile · solo Aura

---

## 1) Ring Toss Classic (bottle grid)
**Joke:** Bottles packed so rings almost never sit — spacing is the house edge.
**Verb:** Throw rings onto bottle necks (launcher shared with Bent Pegs).

### Vestibule
- Crate of bottles, plastic rings, too-tight gaps visible
- Barker: “RING A NECK — IF THERE’S ROOM”
- Best: `Crates {n}`

### Play
- 5 rings/stage. Land on neck = score. Clear `need` → depth++. Rings out before need = DEATH
- Spacing tightens; bottles sway stage 4+

### Stage table
| Stage | bottles | need | gapScale | sway | rings |
|------:|--------:|-----:|---------:|-----:|------:|
| 1 | 6 | 2 | 1.0 | no | 5 |
| 2 | 6 | 3 | 0.92 | no | 5 |
| 3 | 9 | 3 | 0.88 | no | 5 |
| 4 | 9 | 4 | 0.84 | yes | 5 |
| 5 | 12 | 4 | 0.8 | yes | 6 |
| 6+ | 12 | 5 | max(0.65,0.8-0.02*t) | yes | 6 |

### Scoring
- +70 ring · +320 clear
### Death
- `CRATE 5 · “Aura: No room at the neck.”`
### Don’t
- Magnet snap onto necks
### Accept
- Classic frustration → mastery

---

## 2) Coconut Shy
**Joke:** Cups are deep; coconuts want to stay home.
**Verb:** Softballs to knock coconuts off cups.

### Vestibule
- Coconuts on cups, striped stall
- Barker: “KNOCK ’EM OFF — CUPS ARE DEEP”
- Best: `Shys {n}`

### Play
- Physics: coconut resting friction high. 4 balls. Need `off` count. Fail = DEATH
- Cup depth ↑ / coconut mass ↑ by stage

### Stage table
| Stage | nuts | needOff | friction | balls |
|------:|-----:|--------:|---------:|------:|
| 1 | 4 | 2 | mid | 4 |
| 2 | 4 | 3 | mid | 4 |
| 3 | 5 | 3 | high | 4 |
| 4 | 5 | 4 | high | 5 |
| 5 | 6 | 4 | higher | 5 |
| 6+ | 6 | 5 | max | 5 |

### Scoring
- +90 off · +340 clear
### Don’t
- Explode nuts on any graze
### Accept
- Satisfying topple when earned

---

## 3) Beanbag Mouth
**Joke:** Clown mouth closes between throws.
**Verb:** Toss beanbags into moving/closing mouth.

### Vestibule
- Clown face board, hinged mouth
- Barker: “FEED THE MOUTH — BEFORE IT YAWNS SHUT”
- Best: `Mouths {n}`

### Play
- Mouth open/close duty cycle. Throw while open = score if inside lips. Closed hit = bounce strike
- 5 bags. Need `in`. Fail = DEATH

### Stage table
| Stage | need | openMs | closedMs | mouthScale | bags |
|------:|-----:|-------:|---------:|-----------:|-----:|
| 1 | 3 | 900 | 400 | big | 5 |
| 2 | 3 | 800 | 450 | big | 5 |
| 3 | 4 | 700 | 500 | mid | 5 |
| 4 | 4 | 600 | 550 | mid | 5 |
| 5 | 5 | 550 | 600 | small | 6 |
| 6+ | 5 | max(350,550-20*t) | min(800,600+20*t) | small | 6 |

### Scoring
- +80 in · +300 clear
### Death
- `MOUTH 4 · “Aura: It yawned.”`

---

## 4) Cornhole Drift
**Joke:** Board slides on the grass.
**Verb:** Lob bags onto drifting board / hole.

### Vestibule
- Cornhole board on rollers
- Barker: “LAND IT — BOARD WON’T SIT STILL”
- Best: `Bags-in run / Boards`

### Play
- 4 bags/stage (pairs optional later). Hole points 3, board rest 1. Need `points`. Board drifts horizontally. Fail = DEATH

### Stage table
| Stage | needPts | drift | holeScale | bags |
|------:|--------:|------:|----------:|-----:|
| 1 | 4 | slow | 1.0 | 4 |
| 2 | 5 | slow | 0.95 | 4 |
| 3 | 6 | mid | 0.9 | 4 |
| 4 | 7 | mid | 0.85 | 4 |
| 5 | 8 | fast | 0.8 | 4 |
| 6+ | 8+t | fast | max(0.55,0.8-0.03*t) | 4 |

### Scoring
- Face points · +280 clear
### Don’t
- Static board forever

---

## 5) Ice Cream Stack
**Joke:** Soft-serve leans; gravity is the house.
**Verb:** Tap to drop scoops; keep stack upright.

### Vestibule
- Cone + pastel scoops
- Barker: “STACK IT TALL — DON’T LET IT SWOON”
- Best: `Scoops {n}`

### Play
- Scoop drops with slight random offset. Stack COM must stay in cone base. Lean past limit = SPLAT DEATH
- Depth = scoops stacked this run (endless climb). Stage bands tighten offset + melt drift

### Bands
| Scoops | offset | meltDrift | tipLimit |
|-------:|-------:|----------:|---------:|
| 1–3 | tiny | no | loose |
| 4–6 | small | tiny | mid |
| 7–9 | mid | mid | mid |
| 10–12 | mid | mid | tight |
| 13+ | large | high | tight |

### Scoring
- +40/scoop · milestone +200 every 5
### Don’t
- Auto-center scoops
### Accept
- Cute panic; food-row photo result

---

## 6) Hot-Dog Tong Race
**Joke:** Dogs keep rolling off the grill line.
**Verb:** Drag tongs to plate moving hot-dogs before they fall.

### Vestibule
- Grill, tongs, paper boats
- Barker: “PLATE ’EM FAST — THEY ROLL”
- Best: `Dogs {n}` / `Services`

### Play
- Dogs spawn rolling. Grab with tongs (drag) → drop on plate. Missed fall-off = strike. 3 strikes = DEATH
- Clear service = plate `need` dogs → depth++ · faster spawns

### Stage table
| Service | need | spawnMs | rollSpeed | strikes |
|--------:|-----:|--------:|----------:|--------:|
| 1 | 5 | 1000 | slow | 3 |
| 2 | 6 | 900 | + | 3 |
| 3 | 7 | 800 | + | 3 |
| 4 | 8 | 700 | ++ | 2 |
| 5 | 9 | 600 | ++ | 2 |
| 6+ | 9+t | max(400,600-25*t) | +++ | 2 |

### Scoring
- +35 dog · +300 service
### Death
- `SERVICE 5 · “Aura: Floor mustard.”`
### Don’t
- Tap-anywhere auto plate

---

## Hand-off
Ring/Coconut/Beanbag/Cornhole = toss family with Ball Toss DNA. Ice Cream + Hot-Dog = food row with Floss/Popcorn.
