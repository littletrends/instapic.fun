# Goblin Batch 29 — full engine sheets
# Disk Flip · Cowbell · Ladder Lean · Chip Fall · Lantern Pick · Spiral Roll
# NEW. Never overwrite B23/B25–B28. Cheat visible. 1 coin = 1 run until DEATH.
# Params mirrored in GOBLIN_BATCH29_MOUNT_CONFIGS.md

---

## 1) diskflip — SlingAim · Disk Flip Toss
**Cheat visible:** Disks look round; edge bias flips outs.
**Depth unit:** Flip
**Death key:** `edge_out`
**Suggested engine:** SlingAim

### Vestibule
- Prop: Disk Flip Toss midway stall, cheat readable in tent mouth
- Barker: “DISK FLIP TOSS — WATCH THE CHEAT”
- Best: `Flip {n}`

### Play loop
- Enter play with 1 coin
- Clear stage → depth++ · escalate table
- DEATH ends run (`edge_out`)
- Mobile thumb-first · solo Aura result VO

### Stage table
| Stage | need | edgeBias | disks | missesToDeath |
|------:|-----:|---------:|------:|--------------:|
| 1 | 2 | 0 | 5 | 4 |
| 2 | 3 | soft | 5 | 3 |
| 3 | 3 | yes | 6 | 3 |
| 4+ | 4+t//2 | hard | 6 | 2 |

### Scoring
- +100 stage clear · +50×stage · depth = flips

### Don’t
- One-tap TEASER delight as the whole game
- Hide the cheat

### Accept
- Player can name the cheat
- Feels unfair then skillful

---

## 2) cowbell — TimingTap · Cowbell True Clang
**Cheat visible:** False clangs before true.
**Depth unit:** Clang
**Death key:** `false_clang`
**Suggested engine:** TimingTap

### Vestibule
- Prop: Cowbell True Clang midway stall, cheat readable in tent mouth
- Barker: “COWBELL TRUE CLANG — WATCH THE CHEAT”
- Best: `Clang {n}`

### Play loop
- Enter play with 1 coin
- Clear stage → depth++ · escalate table
- DEATH ends run (`false_clang`)
- Mobile thumb-first · solo Aura result VO

### Stage table
| Clang | need | falseRate | windowMs |
|------:|-----:|----------:|---------:|
| 1 | 4 | 0 | 180 |
| 2 | 5 | 0.15 | 150 |
| 3 | 6 | 0.25 | 130 |
| 4+ | 6+t | min(0.4,0.25+0.03*t) | max(80,130-5*t) |

### Scoring
- +100 stage clear · +50×stage · depth = clangs

### Don’t
- One-tap TEASER delight as the whole game
- Hide the cheat

### Accept
- Player can name the cheat
- Feels unfair then skillful

---

## 3) ladderlean — HoldBand · Ladder Lean Hold
**Cheat visible:** Lean band drifts; ladder lies upright.
**Depth unit:** Rung
**Death key:** `tip`
**Suggested engine:** HoldBand

### Vestibule
- Prop: Ladder Lean Hold midway stall, cheat readable in tent mouth
- Barker: “LADDER LEAN HOLD — WATCH THE CHEAT”
- Best: `Rung {n}`

### Play loop
- Enter play with 1 coin
- Clear stage → depth++ · escalate table
- DEATH ends run (`tip`)
- Mobile thumb-first · solo Aura result VO

### Stage table
| Rung | bandH | drift | lieChance | holdMs |
|-----:|------:|------:|----------:|-------:|
| 1 | 22 | 0 | 0 | 2000 |
| 2 | 18 | low | 0 | 2200 |
| 3 | 14 | mid | 0.1 | 2400 |
| 4+ | max(7,14-t) | high | min(0.3,0.1+0.04*t) | 2600 |

### Scoring
- +100 stage clear · +50×stage · depth = rungs

### Don’t
- One-tap TEASER delight as the whole game
- Hide the cheat

### Accept
- Player can name the cheat
- Feels unfair then skillful

---

## 4) chipfall — GreedFloor · Chip Fall Shelf
**Cheat visible:** Chips look safe; shelf sighs early.
**Depth unit:** Floor
**Death key:** `buried`
**Suggested engine:** GreedFloor

### Vestibule
- Prop: Chip Fall Shelf midway stall, cheat readable in tent mouth
- Barker: “CHIP FALL SHELF — WATCH THE CHEAT”
- Best: `Floor {n}`

### Play loop
- Enter play with 1 coin
- Clear stage → depth++ · escalate table
- DEATH ends run (`buried`)
- Mobile thumb-first · solo Aura result VO

### Stage table
| Floor | bankTarget | softSigh | pitWiden |
|------:|-----------:|:--------:|---------:|
| 1 | 6 | no | 0.3 |
| 2 | 10 | soft | 0.4 |
| 3 | 14 | yes | 0.55 |
| 4+ | 14+4*t | hard | min(1,0.55+0.08*t) |

### Scoring
- +100 stage clear · +50×stage · depth = floors

### Don’t
- One-tap TEASER delight as the whole game
- Hide the cheat

### Accept
- Player can name the cheat
- Feels unfair then skillful

---

## 5) lanternpick — OracleRooms · Lantern Pick Path
**Cheat visible:** One lantern lies; labels swap.
**Depth unit:** Path
**Death key:** `wrong_lantern`
**Suggested engine:** OracleRooms

### Vestibule
- Prop: Lantern Pick Path midway stall, cheat readable in tent mouth
- Barker: “LANTERN PICK PATH — WATCH THE CHEAT”
- Best: `Path {n}`

### Play loop
- Enter play with 1 coin
- Clear stage → depth++ · escalate table
- DEATH ends run (`wrong_lantern`)
- Mobile thumb-first · solo Aura result VO

### Stage table
| Path | doors | lieLanterns | swapMs |
|-----:|------:|------------:|-------:|
| 1 | 3 | 1 | 0 |
| 2 | 3 | 1 | 800 |
| 3 | 4 | 2 | 600 |
| 4+ | 4+t%2 | 2 | max(300,600-40*t) |

### Scoring
- +100 stage clear · +50×stage · depth = paths

### Don’t
- One-tap TEASER delight as the whole game
- Hide the cheat

### Accept
- Player can name the cheat
- Feels unfair then skillful

---

## 6) spiralroll — Custom · Spiral Roll Bowl
**Cheat visible:** Spiral bumps shove fair rolls out.
**Depth unit:** Spiral
**Death key:** `offspiral`
**Suggested engine:** Custom

### Vestibule
- Prop: Spiral Roll Bowl midway stall, cheat readable in tent mouth
- Barker: “SPIRAL ROLL BOWL — WATCH THE CHEAT”
- Best: `Spiral {n}`

### Play loop
- Enter play with 1 coin
- Clear stage → depth++ · escalate table
- DEATH ends run (`offspiral`)
- Mobile thumb-first · solo Aura result VO

### Stage table
| Spiral | bumps | speed | need |
|-------:|------:|------:|-----:|
| 1 | 0 | 0.6 | 2 |
| 2 | 1 | 0.8 | 3 |
| 3 | 2 | 1.0 | 3 |
| 4+ | 2+t//2 | min(1.8,1+0.1*t) | 4 |

### Scoring
- +100 stage clear · +50×stage · depth = spirals

### Don’t
- One-tap TEASER delight as the whole game
- Hide the cheat

### Accept
- Player can name the cheat
- Feels unfair then skillful

## Engine map
| gameId | engine | depthUnit |
|--------|--------|-----------|
| diskflip | SlingAim | Flip |
| cowbell | TimingTap | Clang |
| ladderlean | HoldBand | Rung |
| chipfall | GreedFloor | Floor |
| lanternpick | OracleRooms | Path |
| spiralroll | Custom | Spiral |

## Teaser kill list
When /play exists remove TEASERS for: diskflip, cowbell, ladderlean, chipfall, lanternpick, spiralroll

## Shared alley notes
- Vestibule shows cheat
- Fever Run may unlock later as live-only alt
- No webcam · no real-money · no Mirror Crew

### Coding contract extras
- Implement stageParams from mount file
- finishRun({gameId, depth, score, deathReason})
- bestDepth[gameId] persistence
- Challenge template from aura lines

### Coding contract extras
- Implement stageParams from mount file
- finishRun({gameId, depth, score, deathReason})
- bestDepth[gameId] persistence
- Challenge template from aura lines

### Coding contract extras
- Implement stageParams from mount file
- finishRun({gameId, depth, score, deathReason})
- bestDepth[gameId] persistence
- Challenge template from aura lines
## Full accept battery (Batch 29)
1. diskflip: edge spit readable by stage 3; player says "edge cheat"
2. cowbell: false clang never scores; window tightens
3. ladderlean: lie upright feels unfair then fair
4. chipfall: cash-out vs one-more-drop is real greed
5. lanternpick: swap mid-choice visible
6. spiralroll: bump shove readable; offspiral death clear

## HUD / mobile
- Depth unit large on result
- Death reason string from death key
- Thumb reach; no hover-only
- Challenge share uses aura template

## Wiring
- Mounts: GOBLIN_BATCH29_MOUNT_CONFIGS.md
- Aura: GOBLIN_BATCH29_AURA_LINES.md
- RUNKIT rows BATCH29
- Fever gates: live-only later

## Anti-collision
Reserved elsewhere: bottlehook set B23, Soft Bucket B25, capseat B26, lidtoss B27, pegbounce B28.

## Full accept battery (Batch 29)
1. diskflip: edge spit readable by stage 3; player says "edge cheat"
2. cowbell: false clang never scores; window tightens
3. ladderlean: lie upright feels unfair then fair
4. chipfall: cash-out vs one-more-drop is real greed
5. lanternpick: swap mid-choice visible
6. spiralroll: bump shove readable; offspiral death clear

## HUD / mobile
- Depth unit large on result
- Death reason string from death key
- Thumb reach; no hover-only
- Challenge share uses aura template

## Wiring
- Mounts: GOBLIN_BATCH29_MOUNT_CONFIGS.md
- Aura: GOBLIN_BATCH29_AURA_LINES.md
- RUNKIT rows BATCH29
- Fever gates: live-only later

## Anti-collision
Reserved elsewhere: bottlehook set B23, Soft Bucket B25, capseat B26, lidtoss B27, pegbounce B28.

## Full accept battery (Batch 29)
1. diskflip: edge spit readable by stage 3; player says "edge cheat"
2. cowbell: false clang never scores; window tightens
3. ladderlean: lie upright feels unfair then fair
4. chipfall: cash-out vs one-more-drop is real greed
5. lanternpick: swap mid-choice visible
6. spiralroll: bump shove readable; offspiral death clear

## HUD / mobile
- Depth unit large on result
- Death reason string from death key
- Thumb reach; no hover-only
- Challenge share uses aura template

## Wiring
- Mounts: GOBLIN_BATCH29_MOUNT_CONFIGS.md
- Aura: GOBLIN_BATCH29_AURA_LINES.md
- RUNKIT rows BATCH29
- Fever gates: live-only later

## Anti-collision
Reserved elsewhere: bottlehook set B23, Soft Bucket B25, capseat B26, lidtoss B27, pegbounce B28.

## Full accept battery (Batch 29)
1. diskflip: edge spit readable by stage 3; player says "edge cheat"
2. cowbell: false clang never scores; window tightens
3. ladderlean: lie upright feels unfair then fair
4. chipfall: cash-out vs one-more-drop is real greed
5. lanternpick: swap mid-choice visible
6. spiralroll: bump shove readable; offspiral death clear

## HUD / mobile
- Depth unit large on result
- Death reason string from death key
- Thumb reach; no hover-only
- Challenge share uses aura template

## Wiring
- Mounts: GOBLIN_BATCH29_MOUNT_CONFIGS.md
- Aura: GOBLIN_BATCH29_AURA_LINES.md
- RUNKIT rows BATCH29
- Fever gates: live-only later

## Anti-collision
Reserved elsewhere: bottlehook set B23, Soft Bucket B25, capseat B26, lidtoss B27, pegbounce B28.

## Full accept battery (Batch 29)
1. diskflip: edge spit readable by stage 3; player says "edge cheat"
2. cowbell: false clang never scores; window tightens
3. ladderlean: lie upright feels unfair then fair
4. chipfall: cash-out vs one-more-drop is real greed
5. lanternpick: swap mid-choice visible
6. spiralroll: bump shove readable; offspiral death clear

## HUD / mobile
- Depth unit large on result
- Death reason string from death key
- Thumb reach; no hover-only
- Challenge share uses aura template

## Wiring
- Mounts: GOBLIN_BATCH29_MOUNT_CONFIGS.md
- Aura: GOBLIN_BATCH29_AURA_LINES.md
- RUNKIT rows BATCH29
- Fever gates: live-only later

## Anti-collision
Reserved elsewhere: bottlehook set B23, Soft Bucket B25, capseat B26, lidtoss B27, pegbounce B28.

## Full accept battery (Batch 29)
1. diskflip: edge spit readable by stage 3; player says "edge cheat"
2. cowbell: false clang never scores; window tightens
3. ladderlean: lie upright feels unfair then fair
4. chipfall: cash-out vs one-more-drop is real greed
5. lanternpick: swap mid-choice visible
6. spiralroll: bump shove readable; offspiral death clear

## HUD / mobile
- Depth unit large on result
- Death reason string from death key
- Thumb reach; no hover-only
- Challenge share uses aura template

## Wiring
- Mounts: GOBLIN_BATCH29_MOUNT_CONFIGS.md
- Aura: GOBLIN_BATCH29_AURA_LINES.md
- RUNKIT rows BATCH29
- Fever gates: live-only later

## Anti-collision
Reserved elsewhere: bottlehook set B23, Soft Bucket B25, capseat B26, lidtoss B27, pegbounce B28.
