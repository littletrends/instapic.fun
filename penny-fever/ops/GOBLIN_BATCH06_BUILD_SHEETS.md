# Goblin Batch 06 — full engine sheets
# Snap Flash Streak · Whisper Confidence · Look Up Constellation · Curios Vault · Marquee Letter Storm · Pack Draft
# These deepen EXISTING hall doors (not only new tents). Wire when Love + vendor batch 01 breathe.
# DNA: 1 coin = 1 run · depth until DEATH · solo Aura · alley world · no Mirror Crew

---

## 1) Snap → Flash Streak
**Joke:** Booth that punishes early taps (false-start brain).
**Verb:** Tap FLASH on the true pop only.

### Vestibule
- Solo Aura freeze-flash (Set11) · countdown bezel · streak readout
- Barker: “DON’T JUMP THE FLASH”
- Best: `Streak {n}` / `Pose #`

### Play
- Pose shown → windup → pop. True pop = score + streak++
- Fakes: windup with no pop; delayed pop; double pop (only 2nd counts); silent pop (light only, stage 5+)
- Early tap / fake tap = DEATH (streak over). Stage 1 grace: 1 false-start warning
- Depth = streak length (or poses cleared in a climb — use streak as depth)

### Escalation
| Streak | fakeRate | delayPop% | double% | silent% | windowMs |
|-------:|---------:|----------:|--------:|--------:|---------:|
| 1–3 | 0 | 0 | 0 | 0 | 180 |
| 4–7 | 0.15 | 0.1 | 0 | 0 | 150 |
| 8–12 | 0.25 | 0.15 | 0.1 | 0 | 130 |
| 13–18 | 0.32 | 0.2 | 0.15 | 0.1 | 110 |
| 19+ | 0.4 | 0.25 | 0.2 | 0.15 | max(70,110-2*t) |

### Scoring
- +50 per true flash · +combo × streak
### Death
- `STREAK 14 · 0.04 early · “Aura: Jumpy!”`
### Don’t
- Selfie gallery / Mirror Crew
### Accept
- Timing addiction; shareable early-ms

---

## 2) Whisper → Confidence Run
**Joke:** Soft tent, hard bluff streak.
**Verb:** Pick the fib among lines; wrong = curtain drop.

### Vestibule
- Curtain · lean pose · empty codex silhouette
- Barker: “LEAN IN — CATCH THE FIB”
- Best: `Secrets Held {n}`

### Play
- Each round: 3 whispers (2 true / 1 fib) — tap the fib
- Correct → secretsHeld++ · depth++ · next mix harder
- Wrong → DEATH
- Mic optional; tap-lean always works (stillness 1.2s opens curtain)

### Escalation
| Depth | true | fibs | timeLimit | notes |
|------:|-----:|-----:|----------:|-------|
| 1–3 | 2 | 1 | 12s | teach |
| 4–6 | 2 | 1 | 9s | fib uses smile emoji |
| 7–10 | 3 | 2 | 9s | pick all fibs |
| 11–14 | 3 | 2 | 7s | one fib quoted from foyer tip (meta) |
| 15+ | 4 | 3 | 7s | room whisper decoy line |

### Content rules
- Playful; never medical / death / destiny-romance for soft pack
- Store unlocked lines in localStorage codex (collection hook)

### Scoring
- +120 correct · set bonus every 5
### Don’t
- One free fortune tease as the whole game
### Accept
- Couples argue; codex completionists return

---

## 3) Look Up → Constellation Climb
**Joke:** Sky memory Simon; stars move later.
**Verb:** Watch outline → redraw path.

### Vestibule
- Ceiling dial / star map · Sky Tier meter
- Barker: “LOOK UP — DRAW WHAT YOU SAW”
- Best: `Sky Tier {n}`

### Play
- Flash constellation 1.2s → fade. Player traces nodes in order
- Wrong node / timeout = DEATH (grace 1 on tier 1)
- Clear → depth++ · more nodes · shorter flash · motion

### Stage table
| Tier | nodes | flashMs | drawMs | motion | notes |
|------:|------:|--------:|-------:|:------:|-------|
| 1 | 3 | 1500 | 8000 | no | |
| 2 | 4 | 1300 | 7500 | no | |
| 3 | 4 | 1200 | 7000 | drift | |
| 4 | 5 | 1100 | 6500 | drift | |
| 5 | 5 | 1000 | 6000 | drift | erase one node mid-draw |
| 6+ | 6+floor(t/2) | max(700,1000-30*t) | max(4500,6000-100*t) | yes | 2 overlays alternate |

### Scoring
- +80 tier · accuracy bonus
### Death
- `SKY 7 · “Aura: Orion shook his head.”`
### Don’t
- Webcam required
### Accept
- Near-miss ghost trace on result card

---

## 4) Curios → Vault Descent
**Joke:** Greed cash-out vs deeper floor.
**Verb:** Timing claw — stop swing + drop depth.

### Vestibule
- Claw · fogged shelf · Floor plaque
- Barker: “GRAB IT — OR GO DEEPER”
- Best: `Floor {n}` · curios count

### Play
- 2-axis timing bars (swing + depth) simplified: one swing bar + tap DROP
- Catch = curio into vault. Miss = no prize that drop
- After each catch/miss: **CASH OUT** (end, keep loot) or **DESCEND** (floor++)
- DEATH: descend into empty fog floor and miss 2× in a row on floor≥3 OR shelf collapse event (rare stage 5+)
- Prefer clear v1: each Floor has 2 claw attempts; need 1 catch to unlock descend; fail both = DEATH. Cash out anytime between floors.

### Floor table
| Floor | swingSpeed | catchWindow | fog | rareChance |
|------:|-----------:|------------:|----:|-----------:|
| 1 | slow | wide | low | 5% |
| 2 | + | wide | low | 8% |
| 3 | + | mid | mid | 10% |
| 4 | ++ | mid | mid | 12% |
| 5 | ++ | thin | high | 15% |
| 6+ | +++ | thinner | high | 18% |

### Scoring
- Curio rarity points · +200 floor survived · cash-out bonus +15% if floor≥4
### Don’t
- Free jar-shake teaser as game
### Accept
- Greed sweat; collection sets

---

## 5) Marquee → Letter Storm
**Joke:** Rhythm marquee; garbage letters deeper.
**Verb:** Tap only when the lit letter matches the target sequence.

### Vestibule
- Dark marquee · Wave counter
- Barker: “HIT THE LIT LETTER — IGNORE THE NOISE”
- Best: `Wave {n}` · combo

### Play
- Target word scrolls (PENNY / FEVER / night words). Tap correct lit letter on beat
- Wrong letter = miss. 3 misses = DEATH
- Clear wave = finish word · depth++ · add garbage letters · second lane at wave 5

### Wave table
| Wave | wordLen | bpm | garbage | lanes | missLimit |
|------:|--------:|----:|--------:|------:|----------:|
| 1 | 5 | 80 | 0 | 1 | 3 |
| 2 | 5 | 90 | 1 | 1 | 3 |
| 3 | 6 | 100 | 2 | 1 | 3 |
| 4 | 6 | 110 | 3 | 1 | 2 |
| 5 | 7 | 120 | 3 | 2 | 2 |
| 6+ | 7+ | min(160,120+5*t) | 4 | 2 | 2 |

### Scoring
- +30 correct · combo mult · +400 wave
### Don’t
- Free “light one letter” teaser as whole product
### Accept
- DDR-lite clarity on phone

---

## 6) Pack → Draft Rogue (meta)
**Joke:** Suitcase is loadout for a Fever Run — not a loot peek.
**Verb:** Draft 3 kits, then commit to a linked mini-run path.

### Vestibule
- Open suitcase · kit cards face down
- Barker: “PACK FOR THE NIGHT — THEN SURVIVE IT”
- Best: `Routes cleared {n}`

### Play
- Reveal 5 kits / pick 3 (examples): Soft Hands (Love +1 grace), Sharp Ear (Whisper one reveal), Steady Claw, Extra Life, Calm Flipper, Early Cash (Coin Pusher +10%), Stillness Charm (Mutoscope +1 slam)
- Then auto-path or pick 3 nodes from available engines (Love / Toss / Snap…) — play them as floors of ONE coin life
- DEATH in any node ends route. Clear all nodes = route depth++
- Kits expire midnight local

### v1 scope if engines thin
- Ship draft UI + apply Soft Hands to Love Heat Run only; expand as engines land

### Don’t
- Peek button that only toasts flavour text
### Accept
- Theorycraft; makes alley one addiction

---

## Hand-off
Priority among these after vendor batch 01: Snap Flash Streak + Marquee Letter Storm (pure how-far). Then Curios greed. Whisper/Look Up soft-hard. Pack last glue.
