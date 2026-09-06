# Goblin Batch 03 — full engine sheets
# Mutoscope · Catoptromancy · High Striker · Bent Ring Pegs · Plinko
# Aura flagged Mutoscope + Catoptromancy; adding alley cousins with full guts.
# DNA: 1 coin = 1 run · depth until DEATH · tent shows the cheat · mobile · solo Aura
# PF only. Never booth/port 6000. Never Imagine.
# Desktop Grok owns: vendors/high-striker.js · bent-rings.js · plinko.js
# Leave mutoscope.js + catoptromancy.js to their desks.

---

## 1) Mutoscope Hood
**Cheat/joke:** Picture only stays while you hold still; fidget slam-closes the iris.
**Feel:** What-the-Butler-Saw peep hood on the midway.
**Verb:** Hold still (no pointer move beyond threshold) while cards tick; optional tap to “crank” pace.

### Vestibule
- Prop: wood hood, closed iris, crank
- Barker: “HOLD STILL — THE REEL ONLY LOVES STATUES”
- Best: `Cards {n}`

### Play
- Iris opens when stillness starts (pointer movement < stillPx for stillWarmupMs)
- Cards advance on a timer; crank tap speeds next card (−30% interval once per card)
- **Any** move > stillPx → iris SLAM · strike. 2nd slam in a stage = DEATH (stage 1: 3 slams)
- Clear stage by viewing `cardsNeeded` without death → depth++ · longer reel · meaner stillness

### Stage table
| Stage | cardsNeeded | cardMs | stillPx | slamLimit | Notes |
|------:|------------:|-------:|--------:|----------:|-------|
| 1 | 4 | 900 | 14 | 3 | teach |
| 2 | 5 | 800 | 12 | 2 | |
| 3 | 6 | 700 | 10 | 2 | bait micro-jitter |
| 4 | 7 | 650 | 9 | 2 | card “jump scare” flash |
| 5 | 8 | 600 | 8 | 2 | |
| 6+ | 8+floor(t/2) | max(400,600-15*t) | max(5,8-0.3*t) | 2 | fake slam sound (ignore) |

### Scoring
- +40 per card · +300 stage · +50×depth
- Depth = stages cleared (or total cards as alt foyer stat — use stages)

### Death / result
- Slam limit hit → `CARDS 23 · “Aura: You blinked first.”`

### Don’t
- Gyro-only (pointer stillness must work)
- Auto-progress without stillness

### Accept
- Tension of not moving; crank is optional spice

---

## 2) Catoptromancy Mirror
**Joke:** The wait IS the game; skippers lose.
**Feel:** Mystic mirror tent — dark glass, theatrical oracle.
**Verb:** Hold gaze (hold button / press-and-hold) through unskippable wait rooms; Keep / Burn / Double.

### Vestibule
- Prop: dark glass, dim glow, ticket slot
- Barker: “THE MIRROR KNOWS YOU’RE THERE — DON’T LOOK AWAY”
- Best: `Room {n}`

### Play
- Room starts: glass dims · hold to gaze. Progress ring fills only while holding.
- Release = gaze breaks; `breakMs` accumulates → if > limit, DEATH (“looked away”)
- When ring full (waitMs): ticket text appears. Choices:
  - **KEEP** → bank ticket colour, next room
  - **BURN** → reroll ticket, waitMs * 1.25 next (harder), stay same depth chance
  - **DOUBLE** → risk: 45% depth+2 & rare colour, 55% DEATH
- Depth = rooms cleared with KEEP (BURN doesn’t advance depth; DOUBLE success jumps)

### Stage / room table
| Room | waitMs | breakLimitMs | doubleOK | Notes |
|------:|-------:|-------------:|:--------:|-------|
| 1 | 4000 | 1200 | no | teach keep |
| 2 | 5000 | 1000 | no | |
| 3 | 6000 | 900 | yes | |
| 4 | 7000 | 800 | yes | lie flicker (hold still through flash) |
| 5 | 8000 | 700 | yes | |
| 6+ | min(14000, 8000+600*t) | max(400,700-30*t) | yes | “hazy” refusals as ticket flavour |

### Scoring
- +200 per KEEP room · DOUBLE success +600 · set bonus for colour constellation (3 same = +500)
- Ticket lines: playful Aura packs; never medical/death/destiny-romance for soft pack

### Don’t
- Skip button
- Instant gumball fortune

### Accept
- Wait feels theatrical not broken
- DOUBLE is sweaty

---

## 3) High Striker Pegs
**Joke:** Bell is a checkpoint, not the ending.
**Feel:** Carnival strength tower — but rhythm, not spam.
**Verb:** Tap in a moving timing window to climb pegs; miss window = hammer slip.

### Vestibule
- Prop: tower, bell, mallet
- Barker: “RING IT — THEN KEEP CLIMBING”
- Best: `Pegs {n}`

### Play
- Vertical meter + moving sweet zone. Tap when indicator inside zone = climb 1 peg.
- Miss = slip down 1 (min 0); 3 slips in a stage without net gain → DEATH OR fall from peg 0 twice = DEATH
- Every 5 pegs = bell checkpoint (fanfare, soft save for casual mode later; hardcore = no save)
- Depth = highest peg reached this run

### Stage as height bands
| Peg band | zoneH | speed | slipOnMiss | Notes |
|---------:|------:|------:|-----------:|-------|
| 1–5 | 18% | 0.5 | −1 | |
| 6–10 | 14% | 0.7 | −1 | |
| 11–15 | 11% | 0.9 | −1 | fake bell audio |
| 16–20 | 9% | 1.1 | −2 | |
| 21+ | max(5,9-0.2*t) | min(2.0,1.1+0.08*t) | −2 | zone shrinks after each hit |

### Scoring
- +30 per peg · +200 per bell · depth = pegs

### Don’t
- Mash-anywhere progress
- Hard end at first bell

### Accept
- Rhythm skill; “just one more peg”

---

## 4) Bent Ring Pegs
**Cheat:** Pegs lean away mid-flight.
**Verb:** Throw rings (Ball Toss launcher cousin) onto pegs.

### Vestibule
- Crooked pegs board, rings
- Barker: “RING A BENT PEG — IF IT STAYS BENT”
- Best: `Pegs ringed {n}` streak / stages

### Play
- Rings per stage = max(3, need). Never fewer rings than need (stage 4 `need 4` with 3 rings is unwinnable).
- Stage clear = ring `need` pegs (usually all visible). First `need` sticks clear; leftover rings unused.
- Mid-flight after release + delayMs, pegs lerp lean angle ±leanDeg (readable cheat)
- Stuck ring = success. Misses exhaust → DEATH

### Stage table
| Stage | pegs | need | leanDeg | delayMs | ringScale |
|------:|-----:|-----:|--------:|---------:|----------:|
| 1 | 3 | 2 | 8 | 280 | 1.0 |
| 2 | 3 | 3 | 12 | 260 | 0.95 |
| 3 | 4 | 3 | 16 | 240 | 0.9 |
| 4 | 4 | 4 | 20 | 220 | 0.88 |
| 5+ | 5 | 4 | min(35,20+2*t) | 200 | 0.85 |

### Scoring / death
- +80 per ring · +350 clear · depth = stages
- Out of rings before need → DEATH

---

## 5) Plinko Pegboard
**Joke:** Drop timing + board “breathes” (tilt lies).
**Verb:** Tap to release chip; aim for high slots.

### Vestibule
- Pegboard, slots 0–9, prize labels as flavour
- Barker: “DROP WHEN THE BOARD BREATHES WITH YOU”
- Best: `High slot streak {n}` / `Stages`

### Play
- Chip release from chosen top lane (5 drop points)
- Peg bounces simple L/R 50/50 with bias from entry angle
- Board tilt oscillates; tilt shifts bias
- Stage: land in slot ≥ target for clear (first paying chip clears; leftover chips stay in the house). 3 chips; fail all → DEATH
- Depth = stages; optional endless high-score sum of slot values across the run

### Stage table
| Stage | targetSlotMin | chips | tiltAmp | Notes |
|------:|--------------:|------:|-------:|-------|
| 1 | 3 | 3 | low | |
| 2 | 4 | 3 | mid | |
| 3 | 5 | 3 | mid | |
| 4 | 6 | 3 | high | |
| 5+ | min(8,6+floor(t/2)) | 3 | high | dead peg every 3rd row |

### Scoring
- slot value ×10 · +300 clear · depth = stages

---

## Hand-off
Copy Mother. Order after batch 01+02: Mutoscope → High Striker → Catoptromancy → Rings → Plinko (or parallel art).

## Wire status (Desktop Grok)
- [x] highstriker — `vendors/high-striker.js` · TimingTap vertical · depth = pegs · bell every 5 is checkpoint not ending
- [x] bentring — `vendors/bent-rings.js` · SlingAim · mid-flight lean after delayMs · ringsPerStage = max(3, need)
- [x] plinko — `vendors/plinko.js` · Custom breath tilt · first slot ≥ target clears · 3 chips then DEATH
- [ ] mutoscope / catoptromancy — other desks; do not touch those vendors
