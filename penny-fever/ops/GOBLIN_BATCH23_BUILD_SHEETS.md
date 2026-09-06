# Goblin Batch 23 — full engine sheets
# Bottle Hook · Whistle Pop · Hourglass Pour · Ticket Claw · Mirror Lot · Rail Roll
# NEW stalls not in 01–22. Alley DNA: cheat visible. 1 coin = 1 run until DEATH. Solo Aura.
# Engines from runKit kit. Params mirrored in GOBLIN_BATCH23_MOUNT_CONFIGS.md

Shared: `#cabinet/{id}` vestibule/play/result · bestDepth · challenge copy · no webcam · no real-money

---

## 1) bottlehook — SlingAim · Bottle Hook Toss
**Cheat visible:** Hooks look wide; bottles lean away on near-misses.
**Verb:** Aim+power toss hooks at bottle necks.
**Depth unit:** Hook
**Suggested engine:** SlingAim

### Vestibule
- Prop: Bottle Hook Toss midway stall with readable cheat
- Barker: “BOTTLE HOOK TOSS — WATCH THE CHEAT”
- Best: `Hook {n}`

### Play
- Aim+power toss hooks at bottle necks.
- Clear stage → depth++ · escalate table
- DEATH reason key: `misses`

### Stage table
| Stage | need | neckScale | leanAway | hooks |
|------:|-----:|---------:|:--------:|------:|
| 1 | 2 | 1.0 | no | 5 |
| 2 | 3 | 0.92 | soft | 5 |
| 3 | 3 | 0.86 | yes | 6 |
| 4+ | 4+t//2 | max(0.7,0.86-0.02*t) | hard | 6 |

### Scoring
- +100 clear · +50×stage · depth = hooks cleared

### Don’t
- Teaser one-tap delight
- Hide the cheat in the vestibule

### Accept
- Player names the cheat out loud
- 60s+ of meaningful tries before first deep death

---

## 2) whistlepop — TimingTap · Whistle Pop Race
**Cheat visible:** False whistle blasts before real pop.
**Verb:** Tap on true whistle-pop only.
**Depth unit:** Lap
**Suggested engine:** TimingTap

### Vestibule
- Prop: Whistle Pop Race midway stall with readable cheat
- Barker: “WHISTLE POP RACE — WATCH THE CHEAT”
- Best: `Lap {n}`

### Play
- Tap on true whistle-pop only.
- Clear stage → depth++ · escalate table
- DEATH reason key: `false_tap`

### Stage table
| Lap | fakeRate | windowMs | need |
|----:|---------:|---------:|-----:|
| 1 | 0 | 180 | 4 |
| 2 | 0.15 | 150 | 5 |
| 3 | 0.25 | 130 | 6 |
| 4+ | min(0.4,0.25+0.03*t) | max(80,130-5*t) | 6+t |

### Scoring
- +100 clear · +50×stage · depth = laps cleared

### Don’t
- Teaser one-tap delight
- Hide the cheat in the vestibule

### Accept
- Player names the cheat out loud
- 60s+ of meaningful tries before first deep death

---

## 3) sandpour — HoldBand · Hourglass Pour
**Cheat visible:** Sweet band drifts; glass lies about full.
**Verb:** Hold pour in the sweet band until fill.
**Depth unit:** Pour
**Suggested engine:** HoldBand

### Vestibule
- Prop: Hourglass Pour midway stall with readable cheat
- Barker: “HOURGLASS POUR — WATCH THE CHEAT”
- Best: `Pour {n}`

### Play
- Hold pour in the sweet band until fill.
- Clear stage → depth++ · escalate table
- DEATH reason key: `spill`

### Stage table
| Pour | bandH | drift | lieChance | fillMs |
|-----:|------:|------:|----------:|-------:|
| 1 | 22 | 0 | 0 | 2200 |
| 2 | 18 | low | 0 | 2400 |
| 3 | 14 | mid | 0.1 | 2600 |
| 4+ | max(7,14-t) | high | min(0.3,0.1+0.04*t) | 2800 |

### Scoring
- +100 clear · +50×stage · depth = pours cleared

### Don’t
- Teaser one-tap delight
- Hide the cheat in the vestibule

### Accept
- Player names the cheat out loud
- 60s+ of meaningful tries before first deep death

---

## 4) ticketclaw — GreedFloor · Ticket Claw Shelf
**Cheat visible:** Tickets look stacked; claw soft-closes early.
**Verb:** Drop claw; cash out or risk deeper shelf.
**Depth unit:** Shelf
**Suggested engine:** GreedFloor

### Vestibule
- Prop: Ticket Claw Shelf midway stall with readable cheat
- Barker: “TICKET CLAW SHELF — WATCH THE CHEAT”
- Best: `Shelf {n}`

### Play
- Drop claw; cash out or risk deeper shelf.
- Clear stage → depth++ · escalate table
- DEATH reason key: `buried`

### Stage table
| Shelf | bankTarget | softClose | pitWiden |
|------:|-----------:|:---------:|---------:|
| 1 | 6 | no | 0.3 |
| 2 | 10 | soft | 0.4 |
| 3 | 14 | yes | 0.55 |
| 4+ | 14+4*t | hard | min(1,0.55+0.08*t) |

### Scoring
- +100 clear · +50×stage · depth = shelfs cleared

### Don’t
- Teaser one-tap delight
- Hide the cheat in the vestibule

### Accept
- Player names the cheat out loud
- 60s+ of meaningful tries before first deep death

---

## 5) mirrorlot — OracleRooms · Mirror Lot Rooms
**Cheat visible:** One mirror lies; labels swap mid-choice.
**Verb:** Pick the true mirror path through rooms.
**Depth unit:** Room
**Suggested engine:** OracleRooms

### Vestibule
- Prop: Mirror Lot Rooms midway stall with readable cheat
- Barker: “MIRROR LOT ROOMS — WATCH THE CHEAT”
- Best: `Room {n}`

### Play
- Pick the true mirror path through rooms.
- Clear stage → depth++ · escalate table
- DEATH reason key: `wrong_door`

### Stage table
| Room | doors | lieMirrors | swapMs |
|-----:|------:|-----------:|-------:|
| 1 | 3 | 1 | 0 |
| 2 | 3 | 1 | 800 |
| 3 | 4 | 2 | 600 |
| 4+ | 4+t%2 | 2 | max(300,600-40*t) |

### Scoring
- +100 clear · +50×stage · depth = rooms cleared

### Don’t
- Teaser one-tap delight
- Hide the cheat in the vestibule

### Accept
- Player names the cheat out loud
- 60s+ of meaningful tries before first deep death

---

## 6) railroll — Custom · Rail Roll Ball
**Cheat visible:** Rail bumps shove fair rolls into gutters.
**Verb:** Release timing to keep ball on the rail.
**Depth unit:** Rail
**Suggested engine:** Custom

### Vestibule
- Prop: Rail Roll Ball midway stall with readable cheat
- Barker: “RAIL ROLL BALL — WATCH THE CHEAT”
- Best: `Rail {n}`

### Play
- Release timing to keep ball on the rail.
- Clear stage → depth++ · escalate table
- DEATH reason key: `gutter`

### Stage table
| Rail | bumps | speed | need |
|-----:|------:|------:|-----:|
| 1 | 0 | 0.6 | 2 |
| 2 | 1 | 0.8 | 3 |
| 3 | 2 | 1.0 | 3 |
| 4+ | 2+t//2 | min(1.8,1+0.1*t) | 4 |

### Scoring
- +100 clear · +50×stage · depth = rails cleared

### Don’t
- Teaser one-tap delight
- Hide the cheat in the vestibule

### Accept
- Player names the cheat out loud
- 60s+ of meaningful tries before first deep death
