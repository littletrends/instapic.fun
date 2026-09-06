# Goblin Batch 07 — full engine sheets
# Log Roll · Ladder Climb · Hatchet Silhouette · Glass Block Pitch · Steam Shovel · Guess Bluff Booth
# DNA: 1 coin = 1 run · depth until DEATH · cheat visible · mobile · solo Aura · walkable alley

---

## 1) Log Roll
**Joke:** Keep footing while the log accelerates.
**Feel:** Midway balance novelty.
**Verb:** Tilt/drag to counter-roll; fall = death.

### Vestibule
- Log over sawdust pit, Aura arms out
- Barker: “STAY ON — HOW MANY METRES?”
- Best: `Metres {n}`

### Play
- Log rotates; player counters with left/right hold or tilt
- Balance meter drifts. Out of safe zone for `fallMs` → DEATH
- Depth checkpoints every 10m (stage++); speed++ · fake bumps

### Stage / distance bands
| Metres | rotSpeed | noise | fallMs | notes |
|-------:|---------:|------:|-------:|-------|
| 0–10 | slow | low | 500 | teach |
| 10–25 | + | low | 450 | |
| 25–40 | ++ | mid | 400 | bump impulses |
| 40–60 | ++ | mid | 350 | |
| 60+ | +++ | high | 300 | reverse-spin feints |

### Scoring
- +2 per metre · +150 per 10m band
### Death
- `LOG 47m · “Aura: Timber.”`
### Don’t
- Gyro-only (drag fallback required)
### Accept
- Simple, sweaty, shareable distance

---

## 2) Ladder Climb
**Joke:** Rope ladder twists harder the higher you go.
**Verb:** Alternate left/right taps in rhythm while ladder rotates.

### Vestibule
- Rope ladder to a prize ledge (flavour)
- Barker: “CLIMB THE TWIST — DON’T LOOK DOWN”
- Best: `Rungs {n}`

### Play
- Show next rung side (L/R). Tap correct side. Wrong / late = slip −2 rungs; slip below 0 twice = DEATH
- Ladder yaw increases with height (visual + input lag optional 20ms at high)
- Depth = highest rung

### Bands
| Rungs | tapWindowMs | yaw | slip |
|------:|------------:|----:|-----:|
| 1–8 | 700 | low | −2 |
| 9–16 | 600 | mid | −2 |
| 17–24 | 520 | mid | −3 |
| 25–32 | 450 | high | −3 |
| 33+ | max(280,450-10*t) | high | −3 |

### Scoring
- +25/rung · +200 per 8-rung band
### Don’t
- Single button climb
### Accept
- Rhythm + disorientation

---

## 3) Hatchet Silhouette
**Joke:** Bull shrinks; silhouette judge is picky.
**Verb:** Aim+power throw hatchet into shrinking bull (Ball Toss launcher).

### Vestibule
- Wood target with painted Aura-safe silhouette outline (not gory)
- Barker: “STICK THE BULL — CLEAN ONLY”
- Best: `Sticks {n}`

### Play
- 3 hatchets/stage. Stick inside bull radius = success. Edge glance = bounce miss
- Clear need sticks → depth++. Fail → DEATH
- Bull scale shrinks; optional slow sway

### Stage table
| Stage | need | bullScale | sway | hatchets |
|------:|-----:|----------:|-----:|---------:|
| 1 | 1 | 1.0 | no | 3 |
| 2 | 2 | 0.9 | no | 3 |
| 3 | 2 | 0.8 | yes | 3 |
| 4 | 3 | 0.7 | yes | 3 |
| 5 | 3 | 0.6 | yes | 4 |
| 6+ | 3 | max(0.35,0.6-0.03*t) | yes | 4 |

### Scoring
- +120 stick · +350 clear
### Don’t
- Gore / horror framing
### Accept
- Clean carnival axe stall

---

## 4) Glass Block Pitch
**Joke:** Blocks get greasy; coins slide off.
**Verb:** Drop coins onto glass block islands.

### Vestibule
- Glass blocks in a case, coin slot
- Barker: “MAKE IT STICK — GREASE IS THE HOUSE”
- Best: `Blocks {n}`

### Play
- Tap-aim drop. Coin lands with friction. Grease param ↑ → slide off = miss
- 5 coins. Need `stuck` coins on blocks to clear. Fail → DEATH
- Depth = stages

### Stage table
| Stage | needStuck | grease | blockSize | coins |
|------:|----------:|-------:|----------:|------:|
| 1 | 2 | low | big | 5 |
| 2 | 2 | mid | big | 5 |
| 3 | 3 | mid | mid | 5 |
| 4 | 3 | high | mid | 5 |
| 5 | 4 | high | small | 5 |
| 6+ | 4 | max | smaller | 5 |

### Scoring
- +70 stuck · +300 clear
### Death
- `GLASS 4 · “Aura: Slippery night.”`
### Don’t
- Magnetic auto-stick assist

---

## 5) Steam Shovel Beads
**Joke:** Points for scoop volume vs shrinking timer (Williams Crane cousin — no prize claim).
**Verb:** Drag shovel; scoop beads into hopper before time out.

### Vestibule
- Mini steam shovel, bead pile, hopper
- Barker: “SCOOP TONS — BEAT THE WHISTLE”
- Best: `Tons {n}` / `Shifts`

### Play
- Continuous scoop control (drag). Beads scooped add tons
- Timer per shift. Whistle = end shift. Reach `quota` → depth++ · next quota↑ timer↓
- Fail quota = DEATH
- Optional: overfill spill waste

### Stage table
| Shift | quota | timeSec | spillEasy | notes |
|------:|------:|--------:|:---------:|-------|
| 1 | 20 | 25 | no | |
| 2 | 28 | 24 | no | |
| 3 | 36 | 22 | yes | |
| 4 | 44 | 20 | yes | |
| 5 | 52 | 18 | yes | |
| 6+ | 52+8*t | max(12,18-t) | yes | moving pile |

### Scoring
- tons×5 · +400 clear shift
### Don’t
- Real claw prize redemption copy
### Accept
- Hypnotic scoop skill

---

## 6) Guess Bluff Booth (Age/Weight cousin)
**Joke:** Aura guesses wrong on purpose; you play higher/lower bluff streak.
**Verb:** Higher / Lower / Spot-on vs Aura’s tease number.

### Vestibule
- Scale + age sign, theatrical
- Barker: “CALL HER BLUFF — STREAK THE LIES”
- Best: `Bluff Streak {n}`

### Play
- Aura announces a silly guess. Secret target seeded. Player picks Higher / Lower / Exactly
- Correct → streak++ depth++. Wrong → DEATH
- Exactly is rare jackpot (+bonus) but tiny window
- Escalation: timer shrinks; Aura double-talk (two numbers, one real)

### Stage table
| Streak | timerSec | exactWindow | doubleTalk |
|-------:|---------:|------------:|:----------:|
| 1–3 | 10 | wide | no |
| 4–7 | 8 | mid | no |
| 8–12 | 7 | mid | yes |
| 13+ | 5 | thin | yes |

### Content
- Playful only; no body-shaming. Prefer “lucky number” framing over real weight.
### Scoring
- +100 call · +500 exact
### Don’t
- Actual weight/age harvesting
### Accept
- Fast bluff addiction

---

## Hand-off
Log Roll + Ladder = easy motion engines. Hatchet + Glass share toss/drop DNA with batch 01. Steam Shovel = greed cousin to Coin Pusher. Guess Bluff = soft booth between Fortune/Whisper.
