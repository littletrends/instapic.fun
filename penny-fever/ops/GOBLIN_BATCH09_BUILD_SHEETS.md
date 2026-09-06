# Goblin Batch 09 — full engine sheets
# Fever Run (meta) · Pass Boss Gauntlet · Fortune Night Rogue · Plate Smash · Ping-Pong Fishbowl · Shark Attack Lane
# DNA: 1 coin = 1 run · depth until DEATH · alley world · solo Aura · mobile

---

## 1) Fever Run (the Pac-Man of the hall)
**Joke:** The alley itself is the maze — cabinets are floors of one life.
**Feel:** One credit, multi-tent route, die anywhere = night over.
**Verb:** Pick/play a path of depth-minigames under one coin.

### Vestibule / entry
- Alley map node graph (even 2D schematic is fine v1)
- Barker: “ONE COIN — HOW DEEP INTO THE NIGHT?”
- Best: `Route depth {n}` · `Nodes cleared`

### Play
- Spend 1 coin → draft optional Pack kits if Pack exists → receive route of 3–5 nodes from engines that are actually playable
- Each node: enter that game in “Fever Run mode” with shortened clear targets (see node table) but SAME death rules
- Clear node → next. Death in any node → run over, keep partial depth
- Depth = nodes cleared this route. Foyer ghost = best route

### Node difficulty (short clears so route fits one sitting)
| Node# | Example clear gate | Death |
|------:|--------------------|-------|
| 1 | Love stage 3 OR Ball Toss rack 2 | normal |
| 2 | Snap streak 5 OR Marquee wave 2 | normal |
| 3 | Coin Pusher floor 2 cash-out OK | normal |
| 4 | Milk pyramid 2 OR Water Gun heat 2 | normal |
| 5 | Boss: Pass cue 3 OR Pinball chapter 2 | normal |

### Route generation
- Seed from night date + player id local
- Only include engines with `/play` live (critical — no teaser nodes)
- Pack kits modify: Extra Life once, Soft Hands, etc.

### Scoring
- +1000 × nodes · leftover kit bonus
### Don’t
- Route into unwired teaser doors
### Accept
- Feels like one night at the carnival; addictive restart

---

## 2) Pass → Boss Gauntlet
**Joke:** Backstage isn’t a peek — it’s a prestige boss you unlock.
**Verb:** Hit cue timings through rising dress-rehearsal stages.

### Vestibule
- Velvet rope · stamp slots · “EMPLOYEES ONLY”
- Locked until `stars >= 6` OR any bestDepth >= 5 across 3 games (tune)
- Barker: “STAMPS READY — SURVIVE REHEARSAL”
- Best: `Cue {n}`

### Play
- Aura performs cues: look L / curtsy / hold / flash. Player taps matching button in window
- Miss = cue fail. 2 fails = DEATH (lose no stamps; try later)
- Clear cue stage → depth++ · faster / more simultaneous cues
- Clear cue 12 = Backstage tier cosmetic (foyer glow) + exclusive curio

### Stage table
| Cue stage | windowMs | simultaneous | failLimit | notes |
|----------:|---------:|-------------:|----------:|-------|
| 1 | 900 | 1 | 2 | teach |
| 2 | 800 | 1 | 2 | |
| 3 | 700 | 1 | 2 | |
| 4 | 650 | 2 | 2 | |
| 5 | 600 | 2 | 2 | fake cue flash |
| 6–11 | −30/stage | 2 | 2 | |
| 12 | 450 | 3 | 1 | boss |

### Scoring
- +150/cue stage · tier badge on clear 12
### Don’t
- Spam unlock with one tap
### Accept
- Long-term goal feeding other games

---

## 3) Fortune → Night Oracle Rogue
**Joke:** Wait rooms with Keep/Burn/Double — already in Batch 03 Catoptromancy; this is the hall Fortune door wiring.
**Verb:** Same as Catoptromancy sheet — if both exist, Fortune = ticket-slot art; Catoptromancy = dark glass art; shared engine `oracleRoguelike.js`.

### Implement note
- One engine, two skins. Depth = rooms. See Batch 03 Catoptromancy for numbers.
- Hall Fortune vestibule: ticket slot + lucky colour chips; “Room 1 of ?”

---

## 4) Plate Smash
**Joke:** Plates on a moving line; timing smash only.
**Verb:** Tap when plate crosses the smash zone (Whac cousin).

### Vestibule
- Clay plates on a rope, mallet
- Barker: “SMASH ON THE MARK — ONLY THE PLATE”
- Best: `Lines {n}`

### Play
- Plates scroll. Tap in zone = smash score. Early/late = miss strike. 3 strikes = DEATH
- Clear `need` smashes → depth++ · faster line · decoy pans (no smash credit / strike if hit)

### Stage table
| Stage | need | speed | zoneW | decoy% | strikes |
|------:|-----:|------:|------:|-------:|--------:|
| 1 | 8 | slow | wide | 0 | 3 |
| 2 | 10 | + | wide | 0 | 3 |
| 3 | 12 | + | mid | 10 | 3 |
| 4 | 14 | ++ | mid | 15 | 2 |
| 5 | 16 | ++ | thin | 20 | 2 |
| 6+ | 16+2*t | +++ | thin | 25 | 2 |

### Scoring
- +30 smash · +300 clear
### Death
- `LINE 5 · “Aura: That was a pan.”`

---

## 5) Ping-Pong Fishbowl
**Joke:** Bowls drift on a tipsy tray.
**Verb:** Bounce/throw ping-pong into moving bowls.

### Vestibule
- Tray of bowls, ping-pong balls
- Barker: “LAND A BOWL — TRAY HAS SEA LEGS”
- Best: `Bowls {n}`

### Play
- 6 balls. Aim+arc into bowls. Tray sways. Need `landed`. Fail = DEATH

### Stage table
| Stage | bowls | need | sway | ballScale | balls |
|------:|------:|-----:|-----:|----------:|------:|
| 1 | 3 | 2 | low | 1.0 | 6 |
| 2 | 3 | 3 | low | 0.95 | 6 |
| 3 | 4 | 3 | mid | 0.9 | 6 |
| 4 | 4 | 4 | mid | 0.88 | 6 |
| 5 | 5 | 4 | high | 0.85 | 7 |
| 6+ | 5 | 5 | high | 0.8 | 7 |

### Scoring
- +75 land · +320 clear

---

## 6) Shark Attack Lane (2P-ready)
**Joke:** Race fill markers; ghost shark now.
**Verb:** Hold spray on mouth (Water Gun cousin — longer lane presentation).

### Implement note
- Shared engine with Water Gun Duel (Batch 02). Skin: shark markers + carnival paint.
- Heats table = Water Gun. Vestibule art different. Multiplayer lane B later.

### Vestibule
- Shark race lanes, ghost NPC
- Barker: “RACE THE SHARK — DON’T MISS THE TEETH”
- Best: `Heats {n}`

---

## Hand-off
Fever Run is the strategic centerpiece once ≥3 engines are deep. Pass gates prestige. Plate/Fishbowl = quick vendor fills. Shark = skin reuse.
