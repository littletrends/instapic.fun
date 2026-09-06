# Goblin Batch 05 — full engine sheets
# Balloon Darts · Can Alley · Wheel of Luck · Ticket Chop · Bumper Rink · Kill Screen 256
# DNA: 1 coin = 1 run · depth until DEATH · tent shows the joke · mobile · solo Aura · alley not mini-app

---

## 1) Balloon Dart Wall
**Joke:** Some balloons are soft duds; only marked colours pop.
**Verb:** Aim + flick darts at a balloon grid.

### Vestibule
- Bright balloon wall, a few clearly “dead” matte balloons
- Barker: “POP THE LIVE ONES — DUD BALLOONS BITE”
- Best: `Walls {n}`

### Play
- Grid 4×3 → denser later. Tap-drag flick = dart
- Live balloon (gloss) pops on hit. Dud (matte) = dart bounce + strike
- Wrong colour when a colour call is up = strike
- 5 darts/stage. Clear = pop `need` live targets. 3 strikes OR darts out before need = DEATH
- Depth = walls cleared

### Stage table
| Stage | need | darts | dud% | colourCall | grid |
|------:|-----:|------:|-----:|:----------:|------|
| 1 | 3 | 5 | 10% | no | 4×3 |
| 2 | 4 | 5 | 15% | no | 4×3 |
| 3 | 4 | 5 | 20% | yes | 5×3 |
| 4 | 5 | 5 | 25% | yes | 5×4 |
| 5 | 5 | 6 | 30% | yes | 5×4 |
| 6+ | 6 | 6 | min(45,30+2*t) | yes | 6×4 |

### Scoring
- +60 pop · +300 clear · −0 for duds (strike only)
### Death line
- `WALL 4 · “Aura: That one was a dud, sugar.”`
### Don’t
- All balloons pop equal
### Accept
- Reading gloss vs matte matters

---

## 2) Can Alley
**Joke:** Bottom cans weighted; pyramid lies.
**Verb:** Softballs at tin pyramid (Milk cousin — tighter cans, faster throws).

### Vestibule
- Tin can pyramid, bottom darker
- Barker: “CLEAT THE CANS — BOTTOM’S FULL OF SAND”
- Best: `Stacks {n}`

### Play
- Share Milk launcher. Mass top=1 mid=1.5 bottom=3.0
- 3 balls. Clear all cans → depth++. Fail → DEATH
- Stages add glue, tighter spacing, wind

### Stage table
| Stage | bottomMass | spacing | glueBottoms | wind |
|------:|-----------:|--------:|------------:|-----:|
| 1 | 2.4 | wide | 0 | 0 |
| 2 | 2.8 | wide | 0 | 0 |
| 3 | 3.0 | mid | 1 | tiny |
| 4 | 3.3 | mid | 1 | + |
| 5 | 3.6 | tight | 2 | + |
| 6+ | min(5,3.6+0.2*t) | tight | 2 | ++ |

### Scoring / death
- +45/can · +350 clear · depth = stacks
- `STACK 5 · “Aura: Sand in the ankles.”`
### Don’t
- Duplicate Milk exactly — cans are taller/narrower, bounce snappier
### Accept
- Distinct from Milk by SFX/silhouette + snappier physics

---

## 3) Wheel of Luck (skill-stop)
**Joke:** Looks RNG; it’s a timing stop in a shrinking wedge.
**Verb:** Spin then tap STOP when pointer in pay wedge.

### Vestibule
- Big carnival wheel, brass pointer
- Barker: “STOP IT COLD — LUCK IS A FINGER”
- Best: `Stops {n}`

### Play
- Tap SPIN → wheel eases from fast → slow (but not stop alone)
- Player taps STOP once. Pointer angle vs wedge = hit/miss
- Hit → depth++ · wedge shrinks · next spin faster start
- Miss → DEATH (or 1 grace on stage 1)

### Stage table
| Stage | wedgeDeg | spinStart | decay | grace |
|------:|---------:|----------:|------:|------:|
| 1 | 48 | mid | gentle | 1 miss |
| 2 | 40 | mid | gentle | 0 |
| 3 | 32 | fast | mid | 0 |
| 4 | 26 | fast | mid | 0 |
| 5 | 20 | faster | sharp | 0 |
| 6+ | max(8,20-1.5*t) | faster | sharp | 0 |

### Scoring
- +250 stop · depth = stages; flavour labels on wedges (tickets not real prizes)
### Don’t
- True random outcome after stop
### Accept
- Feels like cheating luck with skill

---

## 4) Ticket Chop Booth
**Joke:** Tickets fall fast; wrong pigeonhole bites.
**Feel:** Cupid’s Post Office / sorter window.
**Verb:** Swipe falling tickets into HIS / HERS / NIGHT slots.

### Vestibule
- Service window, three pigeonholes, ticket storm
- Barker: “SORT THE NIGHT — WRONG HOLE = CLOSED”
- Best: `Windows {n}`

### Play
- Tickets fall with labels. Drag into correct slot before bottom
- Miss / wrong slot = strike. 3 strikes = DEATH
- Clear = sort `need` correctly → depth++ · faster spawn · decoy labels

### Stage table
| Stage | need | spawnMs | fallSpeed | decoy% | strikes |
|------:|-----:|--------:|----------:|-------:|--------:|
| 1 | 10 | 900 | slow | 0 | 3 |
| 2 | 12 | 800 | + | 0 | 3 |
| 3 | 14 | 700 | + | 10 | 3 |
| 4 | 16 | 600 | ++ | 15 | 2 |
| 5 | 18 | 520 | ++ | 20 | 2 |
| 6+ | 18+2*t | max(320,520-20*t) | +++ | 25 | 2 |

### Scoring
- +25 correct · +300 clear
### Death
- `WINDOW 6 · “Aura: That ticket wasn’t yours.”`
### Don’t
- Auto-sort assist

---

## 5) Bumper Rink
**Joke:** Tiny rink, mean bumps; last uncrunched wins depth.
**Feel:** Bumper cars as endless survival (1P dodge now; 2P later).
**Verb:** Drag/steer car; avoid walls & ghost bumpers.

### Vestibule
- Mini rink, sparks, ghost car silhouette
- Barker: “DON’T GET CRUNCHED — HOW MANY LAPS?”
- Best: `Laps {n}`

### Play
- Top-down. Stick or drag steering. Speed auto with stage
- Ghost cars patrol. Collision = crunch strike. 2 crunches = DEATH (stage1: 3)
- Lap when crossing start line. Depth = laps. Stage up every N laps (faster, more ghosts)

### Stage bands
| Laps total | speed | ghosts | crunchLimit |
|-----------:|------:|-------:|------------:|
| 1–3 | slow | 1 | 3 |
| 4–7 | + | 2 | 2 |
| 8–12 | ++ | 3 | 2 |
| 13+ | +++ | 4 | 2 |

### Scoring
- +100 lap · +50 near-miss (optional)
### Don’t
- Instant multiplayer requirement for v1
### Accept
- Chaotic but readable; phone thumb OK

---

## 6) Kill Screen 256 (myth machine)
**Joke:** Stages climb clean until the beautiful break — legend bait.
**Feel:** End-of-pier cursed cabinet; Aura glitch VO.
**Verb:** Simple endless micro-game (pick ONE: e.g. tap rising pulses like simplified Love OR eat dots in a tiny maze). Prefer **Pulse Tap**: tap when pulse in band — easiest to wire.

### Play
- Stages 1–255: standard climb using High-Striker-like or Pulse Tap params (reuse stageParams pattern)
- **Stage 256:** intentional glitch presentation — scrambled marquee, wrong hitboxes, Aura lines corrupt. Player cannot “clear”; run ends as MYTH DEATH with special result card
- Depth glory = who reached highest before 256; reaching 256 = foyer badge `SAW THE KILL SCREEN`

### Numbers
- Use High Striker band table accelerated: every stage +0.5% difficulty so skilled hit 30–40 in a sitting; long gods push 100+
- Soft cap messaging at 128 (“Aura: …do you hear that?”)

### Vestibule
- Half-lit, “OUT OF ORDER?” flicker that still accepts coins
- Barker (glitched): “H̶O̶W̶ ̶F̶A̶R̶—”
### Don’t
- Actually softlock the whole alley SPA
- Mean crash without result card
### Accept
- Shareable myth; special ticket art

---

## Hand-off
Queue behind 01–04. Ticket Chop + Wheel = easy mid engines. Bumper = alley multiplayer seed. Kill Screen = late pier centerpiece.
