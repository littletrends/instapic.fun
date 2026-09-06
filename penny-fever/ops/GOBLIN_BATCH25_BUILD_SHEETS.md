# Goblin Batch 25 — full engine sheets (quiet drop — NEW vendors)
# Soft Bucket Toss · Paper Goldfish Scoop · Penny Wish Well · Limbo Bar · Foggy Palm Read · Alley Sand Dig
# 6 NEW stalls not in batches 01–22. Alley DNA: 1930s–50s carnival cheat visible in tent mouth.
# DNA: 1 coin = 1 run · depth until DEATH · mobile-first · solo Aura · no webcam · no real-money
# Engines from runKit: SlingAim / TimingTap / GreedFloor / HoldBand / OracleRooms / Custom
# Params mirrored in GOBLIN_BATCH25_MOUNT_CONFIGS.md

Shared: routes `#cabinet/{bucketball|fishscoop|wishwell|limbobar|palmfog|sanddig}` vestibule/play/result · `bestDepth.*` · challenge copy

---

## 1) bucketball — SlingAim · Soft Bucket Toss
**Cheat visible:** bucket mouth leans away on soft arcs; “almost in” kisses the rim and spit-outs are the alley joke (classic angled-bucket midway).
**Feel:** Midway soft-bucket / carnival toss stall (boardwalk 1940s DNA).
**Verb:** Drag-aim + pull power softballs toward a short bucket; bank or spit.
**Depth unit:** Bucket
**Input:** Drag-aim + pull power (SlingAim)
**Suggested engine:** SlingAim

### Vestibule
- Prop: angled wooden bucket on a striped crate, lean readable up close, softballs in a trough, prize shelf décor only
- Barker: “BANK THE BUCKET — IT LEANS WHEN YOU GET CLOSE”
- Best: `Buckets {n}`

### Play loop
1. Stage posts need (clean banks counted)
2. Soft arc into mouth = credit; too-hard = backboard bounce; leanBucket stage 3+ kicks borderline shots out (readable)
3. rimKissPct adds spit-out on near-mouth contact without clear plane
4. Clear when need met with balls left → depth++ · tighter mouth · more lean
5. DEATH: balls out before need

### Stage table
| Stage | title | need | mouthScale | leanBucket | rimKissPct | balls | crateWobble | missesToDeath |
|------:|-------|-----:|-----------:|:----------:|-----------:|------:|------------:|--------------:|
| 1 | Soft Teach | 2 | 1.00 | no | 0 | 5 | 0 | 4 |
| 2 | Mid Toss | 3 | 0.94 | no | 8 | 5 | 0 | 3 |
| 3 | Lean Mouth | 3 | 0.90 | yes | 12 | 5 | low | 3 |
| 4 | Short Bank | 4 | 0.86 | yes | 16 | 6 | mid | 3 |
| 5+ | Bucket Storm | 4+floor(t/2) | max(0.70,0.86-0.02*t) | yes | min(28,16+2*t) | 6 | high | 2 |

### Scoring
- +80 per bank · +360 bucket clear · +90×stage
- Depth = buckets cleared

### Death / result
- `deathReason:"balls_out"|"lean_spit"|"rim_kiss"|"airball_streak"`
- Card: `BUCKET {n}`

### Don’ts
- regulation basketball hoop copy · magnet auto-bank · ignore leanBucket late · clone hoopswish rim art (bucket lean is the tell)

### Accept
- Player sees lean + rim-kiss spit as the cheat; stage 1 teachable in ~10s

---

## 2) fishscoop — TimingTap · Paper Goldfish Scoop
**Cheat visible:** paper net softens / “melts” after wet dips — late scoops tear before the fish lifts (classic carnival goldfish scoop cheat, touch-timed here; no live animals).
**Feel:** Midway paper-fish scoop booth without live fish — pulse scoops chip the pond.
**Verb:** Tap SCOOP when the pulse crosses a fish outline; clear need fish before the pond resets.
**Depth unit:** Pond
**Input:** Tap on pulse window (`windowMs`); melt decoy windows stage 3+
**Suggested engine:** TimingTap

### Vestibule
- Prop: shallow pond tray, paper fish cutouts, paper net on a stick, wet-melt tell readable after first tear
- Barker: “SCOOP CLEAN — WET NETS LIE”
- Best: `Ponds {n}`

### Play loop
1. Pulse travels fish outlines; sweet windowMs on dry-net segments
2. Tap in window → fish scooped; miss / early / melt-window false credit = strike
3. Clear when need fish gone before resetMs → depth++ · faster pulse · more melt
4. DEATH at missesToDeath OR reset with fish left

### Stage table
| Stage | title | needFish | windowMs | pulseMs | meltPct | resetMs | missesToDeath |
|------:|-------|---------:|---------:|--------:|--------:|--------:|--------------:|
| 1 | Teach Scoop | 3 | 180 | 900 | 0 | 14000 | 3 |
| 2 | Mid Pond | 4 | 155 | 820 | 0 | 13000 | 3 |
| 3 | Wet Melt | 5 | 135 | 740 | 20 | 12000 | 3 |
| 4 | Thin Pulse | 6 | 115 | 660 | 28 | 11000 | 2 |
| 5+ | Pond Storm | 6+t | max(70,115-5*t) | max(420,660-25*t) | 35 | max(8000,11000-200*t) | 2 |

### Scoring
- +40 per fish · +300 pond clear
- Depth = ponds cleared

### Death / result
- `deathReason:"misses"|"melt_tear"|"reset_fail"|"early"`

### Don’ts
- live animals / real goldfish framing · auto-scoop on proximity · credit melt windows · cruelty copy · window never tightens

### Accept
- Timing addiction; wet-melt net is the visible cheat; paper fish only

---

## 3) wishwell — GreedFloor · Penny Wish Well
**Cheat visible:** spiral lip sits just past the center hole — most pennies kiss the lip and fall to the dud tray (classic coin-vortex / wish-well banker).
**Feel:** Midway penny wish-well / spiral slide stall — greed vs cash-out.
**Verb:** Drop a penny into the spiral; dud tray or rare center; CASH OUT or DROP AGAIN.
**Depth unit:** Floor
**Input:** Drag-drop / flick spiral; then CASH OUT / AGAIN buttons
**Suggested engine:** GreedFloor

### Vestibule
- Prop: wooden spiral well, narrow center hole, soft lip ridge readable, dud tray under, coin trough
- Barker: “WISH A PENNY — OR WALK WITH WHAT YOU GOT”
- Best: `Floor {n}` · rares held

### Play loop
1. Each floor: N drops; rarePct chance center swallows; else lip deflect → dud tray (lip ridge readable after first dud)
2. After each drop: **CASH OUT** (end, keep depth/loot) or **AGAIN**
3. Clear floor if rare found OR survive dropsToClear duds without hitting deathRule → may DESCEND
4. DEATH: dudStreakDeath on floor≥2 OR empty bank after committing again with no rare
5. Depth = floors survived / descended

### Stage / floor table
| Floor | drops | rarePct | dudStreakDeath | dropsToClear | lipCheat | spiralWobble |
|------:|------:|--------:|---------------:|-------------:|:---------:|--------------|
| 1 | 8 | 16 | no | 3 | yes (chalk lip) | 0 |
| 2 | 10 | 12 | 3 | 3 | yes | low |
| 3 | 10 | 10 | 3 | 4 | yes | low |
| 4 | 12 | 8 | 2 | 4 | yes | mid |
| 5+ | 14 | 6 | 2 | 5 | yes + distractor | high |

### Scoring
- rare rarity points · +220 floor survived · cash-out bonus +12% if floor≥4
- Depth = floors

### Death / result
- `deathReason:"dud_streak"|"empty_bank"|"lip_kiss"` · cashedOut flag when voluntary exit

### Don’ts
- fair frictionless spiral forever · hide lip with no tell · no CASH OUT button · real-money banker / casino well copy · clone pigslide pig-mouth art (spiral well is the tell)

### Accept
- Greed sweat; soft spiral lip is the alley joke players can spot

---

## 4) limbobar — HoldBand · Limbo Bar
**Cheat visible:** bar marks a “fair” height; Aura goblin dips the bar in pulses — sweet band drifts opposite the dip (midway limbo cheat).
**Feel:** Boardwalk limbo / duck-under stall — hold the pink/force band while the bar descends.
**Verb:** Hold force in the band while bar seats `seatMs` under the win mark.
**Depth unit:** Dip
**Input:** Hold/drag force meter (HoldBand)
**Suggested engine:** HoldBand

### Vestibule
- Prop: striped limbo bar, chalk height marks, force band dial, Aura goblin silhouette dipping the pole
- Barker: “HOLD THE SWEET DUCK — DON’T LET THE GOBLIN DIP”
- Best: `Dips {n}`

### Play loop
1. Band shows sweet force; pulseWobble from stage 3 dips bar opposite
2. Stay in band for clearMs / seat progress under win mark
3. Out of band > outLimitMs = slip strike / death path
4. Clear when bar seats past win mark → depth++ · thinner band · nastier dips
5. DEATH: slipLimit / outLimit / never found band

### Stage table
| Stage | title | bandW | pulseWobble | outLimitMs | clearMs | slipLimit |
|------:|-------|------:|-------------|-----------:|--------:|----------:|
| 1 | Soft Teach | 0.30 | 0 | 900 | 1800 | 3 |
| 2 | Mid Bar | 0.24 | 0 | 800 | 2000 | 2 |
| 3 | Goblin Dip | 0.18 | low | 700 | 2200 | 2 |
| 4 | Thin Duck | 0.14 | mid | 600 | 2400 | 2 |
| 5+ | Limbo Storm | max(0.08,0.14-0.01*t) | high | 500 | 2600 | 2 |

### Scoring
- +50 per seat tick · +320 dip clear
- Depth = dips won / stages

### Death / result
- `deathReason:"slipped"|"dipped"|"never_found"`

### Don’ts
- auto-win button · Love-heat romance copy · ignore pulse late · PvP / multiplayer framing · clone tugband rope art (limbo bar is the tell)

### Accept
- Force band skill; goblin dip drift is the readable cheat

---

## 5) palmfog — OracleRooms · Foggy Palm Read
**Cheat visible:** booth “thinks”; stillness opens the palm room; fog always “close” — wrong line card drops the curtain (soft pack, never cruel).
**Feel:** Foggy palm-read booth — oracle stillness DNA, playful twin of Fortune / Guess Weight / Guess Age.
**Verb:** Hold stillness to open rooms; pick a palm-line card; wrong = curtain death.
**Depth unit:** Room
**Input:** Stillness wait → tap a palm-line range card
**Suggested engine:** OracleRooms
**Copy tone:** soft_cute — no fate-shame / no “cursed” digs

### Vestibule
- Prop: carnival booth, curtain, palm-line cards (life/heart/head soft bands), foggy crystal glass
- Barker: “HOLD STILL — THEN READ THE LINE”
- Best: `Rooms {n}`

### Play loop
1. waitMs stillness opens the palm room
2. Fog drifts; player picks a line band (wide early, thin late)
3. Correct band → room clear · depth++ · ticketGen flavour line
4. Wrong band OR break stillness before wait → toward breakLimit / death
5. allowDoubleFrom mid stages = optional second peek (greed)

### Stage / room table
| Room | waitMs | breakLimitMs | bandWidth | allowDouble | notes |
|------:|-------:|-------------:|-----------|:-----------:|-------|
| 1 | 1200 | 4000 | wide | no | teach |
| 2 | 1400 | 3800 | wide | no | |
| 3 | 1600 | 3500 | mid | yes | fog feint |
| 4 | 1800 | 3200 | mid | yes | |
| 5+ | min(2400,1800+80*t) | max(2200,3200-100*t) | thin | yes | double-feint |

### Scoring
- +150 room · accuracy bonus if exact line card
- Depth = rooms cleared

### Death / result
- `deathReason:"wrong_band"|"broke_still"|"timeout"`

### Don’ts
- fate-shame / “you’re cursed” copy · medical / real psychic framing · skip stillness gate · age/weight crossover digs · clone ageguess decade cards (palm lines are the tell)

### Accept
- Oracle stillness + playful guess; soft pack only; distinct from ageguess/weightguess via palm-line cards

---

## 6) sanddig — Custom · Alley Sand Dig
**Cheat visible:** prize tags bury under “fair” sand; fake-heavy patches and wet clumps nudge the shovel when you’re one scoop shy (midway dig-for-prize DNA).
**Feel:** 1930s–50s sand-dig / prize-bury counter — skill scoops + lying sand joke.
**Verb:** TimingTap-style scoop pulses into the sand bed; cash progress or risk another dig toward a moving need.
**Depth unit:** Dig
**Input:** TimingTap-style scoop for each dig + GreedFloor cash-out UX (declare Custom)
**Suggested engine:** Custom (TimingTap scoop + GreedFloor UX)

### Vestibule
- Prop: wooden sand tray, shovel, buried tag silhouettes, “FIND ___ TAGS” placard that subtly revises, wet-clump tell
- Barker: “DIG FOR TAGS — SAND GETS HEAVY WHEN YOU GET CLOSE”
- Best: `Digs {n}`

### Play loop
1. Each dig card: needTags posted; player skill-scoops `scoops` into sand cells
2. Progress toward need; sandCheat: when found ≥ need−nearGap, need bumps +cheatBump (readable placard rewrite) OR wet clump wastes a scoop
3. After each scoop: **CASH OUT** partial (bank score, depth kept if cashed between digs) or **DIG AGAIN**
4. Clear dig if found ≥ live need within scoops → depth++ · nastier cheat
5. DEATH: scoops exhausted below need OR bustRule on greed continue after near-miss

### Stage / dig table
| Dig | needTags | scoops | cellMax | nearGap | cheatBump | grace |
|------:|---------:|-------:|--------:|--------:|----------:|------:|
| 1 | 2 | 5 | 1 | 1 | 0 | 1 near free |
| 2 | 3 | 5 | 1 | 1 | 1 | 0 |
| 3 | 3 | 6 | 1 | 1 | 1 | 0 |
| 4 | 4 | 6 | 1 | 2 | 2 | 0 |
| 5+ | 4+floor(t/2) | 6 | 1 | 2 | 2+t | 0 |

### Scoring
- +sum tags on clear · +400 dig · cash-out keeps partial ×0.5
- Depth = digs cleared

### Death / result
- `deathReason:"short_tags"|"sand_bump_bust"|"scoops_out"|"wet_clump"`

### Don’ts
- hidden RNG win with no sand motion · real-money gambling copy · unreadable placard rewrite · live-animal dig · clone fascination rolldown / razzledazzle trough art (sand tray + shovel is the tell)

### Accept
- Player sees the sand cheat; still feels skillful on scoops; shareable “I was one tag away”

---

## Engine map
| gameId | engine | depthUnit |
|--------|--------|-----------|
| bucketball | SlingAim | Bucket |
| fishscoop | TimingTap | Pond |
| wishwell | GreedFloor | Floor |
| limbobar | HoldBand | Dip |
| palmfog | OracleRooms | Room |
| sanddig | Custom | Dig |

## Implement order
1. bucketball (shares SlingAim with balltoss/hoopswish)
2. fishscoop (TimingTap)
3. limbobar (HoldBand)
4. wishwell (GreedFloor cash-out)
5. palmfog (OracleRooms — soft twin of ageguess/weightguess)
6. sanddig (Custom hybrid last)

Art: Imagine alley tents with 1930s–50s cheat tells visible in vestibule mouths — wire when engines breathe.
