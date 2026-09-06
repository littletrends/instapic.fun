# Goblin Batch 28 — full engine sheets
# Peg Bounce · Drum Hit · Balance Stick · Medal Slide · Mask Pick · Zigzag Roll
# NEW vs locked B23/B25/B26/B27 and all RUNKIT ids. Cheat visible. Depth until death.
# Do NOT renumber into locked batches.

## 1) pegbounce — SlingAim · Peg Bounce Soft Toss
**Cheat visible:** Pegs kick fair tosses into gutters on near-hits.
**Depth unit:** Peg
**Death key:** `gutter_kick`
### Stage params
| Stage | need | pegKick | balls | missesToDeath |
|------:|-----:|--------:|------:|--------------:|
| 1 | 2 | 0 | 5 | 4 |
| 2 | 3 | soft | 5 | 3 |
| 3 | 3 | yes | 6 | 3 |
| 4+ | 4+t//2 | hard | 6 | 2 |

### Vestibule
- Prop: Peg Bounce Soft Toss stall with readable cheat
- Barker: “PEG BOUNCE SOFT TOSS — SPOT THE CHEAT”
- Best: `Peg {n}`
### Play
- Clear stages until DEATH (`gutter_kick`)
- 1 coin = 1 run · mobile · solo Aura
### Stage table
| Stage | escalate |
|------:|----------|
| 1 | teach, cheat soft |
| 2 | cheat readable |
| 3 | cheat hard |
| 4+ | min tighter / faster / more lies |
### Scoring
- +100 clear · +50×stage · depth = pegs cleared
### Don’t
- Teaser one-tap delight
- Hide cheat in vestibule
### Accept
- Player names the cheat
- 60s+ before first deep death

## 2) drumhit — TimingTap · Carnival Drum Hit
**Cheat visible:** Ghost rimshots before the true hit.
**Depth unit:** Beat
**Death key:** `ghost_tap`
### Stage params
| Beat | need | ghostRate | windowMs |
|-----:|-----:|----------:|---------:|
| 1 | 4 | 0 | 180 |
| 2 | 5 | 0.15 | 150 |
| 3 | 6 | 0.25 | 130 |
| 4+ | 6+t | min(0.4,0.25+0.03*t) | max(80,130-5*t) |

### Vestibule
- Prop: Carnival Drum Hit stall with readable cheat
- Barker: “CARNIVAL DRUM HIT — SPOT THE CHEAT”
- Best: `Beat {n}`
### Play
- Clear stages until DEATH (`ghost_tap`)
- 1 coin = 1 run · mobile · solo Aura
### Stage table
| Stage | escalate |
|------:|----------|
| 1 | teach, cheat soft |
| 2 | cheat readable |
| 3 | cheat hard |
| 4+ | min tighter / faster / more lies |
### Scoring
- +100 clear · +50×stage · depth = beats cleared
### Don’t
- Teaser one-tap delight
- Hide cheat in vestibule
### Accept
- Player names the cheat
- 60s+ before first deep death

## 3) balancestick — HoldBand · Balance Stick Walk
**Cheat visible:** Sweet band drifts; stick lies about upright.
**Depth unit:** Step
**Death key:** `tip`
### Stage params
| Step | bandH | drift | lieChance | holdMs |
|-----:|------:|------:|----------:|-------:|
| 1 | 22 | 0 | 0 | 2000 |
| 2 | 18 | low | 0 | 2200 |
| 3 | 14 | mid | 0.1 | 2400 |
| 4+ | max(7,14-t) | high | min(0.3,0.1+0.04*t) | 2600 |

### Vestibule
- Prop: Balance Stick Walk stall with readable cheat
- Barker: “BALANCE STICK WALK — SPOT THE CHEAT”
- Best: `Step {n}`
### Play
- Clear stages until DEATH (`tip`)
- 1 coin = 1 run · mobile · solo Aura
### Stage table
| Stage | escalate |
|------:|----------|
| 1 | teach, cheat soft |
| 2 | cheat readable |
| 3 | cheat hard |
| 4+ | min tighter / faster / more lies |
### Scoring
- +100 clear · +50×stage · depth = steps cleared
### Don’t
- Teaser one-tap delight
- Hide cheat in vestibule
### Accept
- Player names the cheat
- 60s+ before first deep death

## 4) medalslide — GreedFloor · Medal Slide Shelf
**Cheat visible:** Medals look stacked; shelf soft-dumps early.
**Depth unit:** Shelf
**Death key:** `buried`
### Stage params
| Shelf | bankTarget | softDump | pitWiden |
|------:|-----------:|:--------:|---------:|
| 1 | 6 | no | 0.3 |
| 2 | 10 | soft | 0.4 |
| 3 | 14 | yes | 0.55 |
| 4+ | 14+4*t | hard | min(1,0.55+0.08*t) |

### Vestibule
- Prop: Medal Slide Shelf stall with readable cheat
- Barker: “MEDAL SLIDE SHELF — SPOT THE CHEAT”
- Best: `Shelf {n}`
### Play
- Clear stages until DEATH (`buried`)
- 1 coin = 1 run · mobile · solo Aura
### Stage table
| Stage | escalate |
|------:|----------|
| 1 | teach, cheat soft |
| 2 | cheat readable |
| 3 | cheat hard |
| 4+ | min tighter / faster / more lies |
### Scoring
- +100 clear · +50×stage · depth = shelfs cleared
### Don’t
- Teaser one-tap delight
- Hide cheat in vestibule
### Accept
- Player names the cheat
- 60s+ before first deep death

## 5) maskpick — OracleRooms · Mask Pick Rooms
**Cheat visible:** One mask fibs; labels swap mid-choice.
**Depth unit:** Room
**Death key:** `wrong_mask`
### Stage params
| Room | doors | lieMasks | swapMs |
|-----:|------:|---------:|-------:|
| 1 | 3 | 1 | 0 |
| 2 | 3 | 1 | 800 |
| 3 | 4 | 2 | 600 |
| 4+ | 4+t%2 | 2 | max(300,600-40*t) |

### Vestibule
- Prop: Mask Pick Rooms stall with readable cheat
- Barker: “MASK PICK ROOMS — SPOT THE CHEAT”
- Best: `Room {n}`
### Play
- Clear stages until DEATH (`wrong_mask`)
- 1 coin = 1 run · mobile · solo Aura
### Stage table
| Stage | escalate |
|------:|----------|
| 1 | teach, cheat soft |
| 2 | cheat readable |
| 3 | cheat hard |
| 4+ | min tighter / faster / more lies |
### Scoring
- +100 clear · +50×stage · depth = rooms cleared
### Don’t
- Teaser one-tap delight
- Hide cheat in vestibule
### Accept
- Player names the cheat
- 60s+ before first deep death

## 6) zigzagroll — Custom · Zigzag Roll Lane
**Cheat visible:** Bumpers shove fair rolls off the zigzag.
**Depth unit:** Lane
**Death key:** `offtrack`
### Stage params
| Lane | bumps | speed | need |
|-----:|------:|------:|-----:|
| 1 | 0 | 0.6 | 2 |
| 2 | 1 | 0.8 | 3 |
| 3 | 2 | 1.0 | 3 |
| 4+ | 2+t//2 | min(1.8,1+0.1*t) | 4 |

### Vestibule
- Prop: Zigzag Roll Lane stall with readable cheat
- Barker: “ZIGZAG ROLL LANE — SPOT THE CHEAT”
- Best: `Lane {n}`
### Play
- Clear stages until DEATH (`offtrack`)
- 1 coin = 1 run · mobile · solo Aura
### Stage table
| Stage | escalate |
|------:|----------|
| 1 | teach, cheat soft |
| 2 | cheat readable |
| 3 | cheat hard |
| 4+ | min tighter / faster / more lies |
### Scoring
- +100 clear · +50×stage · depth = lanes cleared
### Don’t
- Teaser one-tap delight
- Hide cheat in vestibule
### Accept
- Player names the cheat
- 60s+ before first deep death
