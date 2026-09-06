# Goblin Batch 24 — full engine sheets (quiet drop — NEW vendors)
# Bent Ring Soft Return · Bell Hammer Timing · Cotton Candy Wind · Chip Pusher Shelf · Fortune Door Pick · Marble Maze Trace
# 6 NEW stalls not in batches 01–23. Alley DNA: 1930s–50s carnival cheat visible in tent mouth.
# DNA: 1 coin = 1 run · depth until DEATH · mobile-first · solo Aura · no webcam · no real-money
# Engines from runKit: SlingAim / TimingTap / HoldBand / GreedFloor / OracleRooms / Custom
# Params mirrored in GOBLIN_BATCH24_MOUNT_CONFIGS.md

Shared: routes `#cabinet/{ringlean|bellhammer|cottonwind|chippusher|fortunedoors|marblemaze}` vestibule/play/result · `bestDepth.*` · challenge copy

---

## 1) ringlean — SlingAim · Bent Ring Soft Return
**Cheat visible:** pegs lean toward the throw; soft-return rings kiss the neck then slide off (classic bent-peg / soft ring alley joke — distinct from bentring’s hard lean crate).
**Feel:** Midway bottle-ring stall with “almost hung” soft returns.
**Verb:** Drag-aim + pull power soft rings at leaning peg necks; hang or soft-return spit.
**Depth unit:** Ring
**Input:** Drag-aim + pull power (SlingAim)
**Suggested engine:** SlingAim

### Vestibule
- Prop: three painted peg bottles with readable lean, stack of soft rubber rings, prize shelf décor only
- Barker: “HANG THE SOFT RING — PEGS LEAN WHEN YOU GET CLOSE”
- Best: `Rings {n}`

### Play loop
1. Stage posts need (clean hangs counted)
2. Soft arc onto neck = credit; too-hard = bounce; pegLean stage 3+ kicks borderline hangs into soft-return
3. softReturnPct adds kiss-and-slide on near-neck contact without seat lock
4. Clear when need met with rings left → depth++ · tighter neck · more lean
5. DEATH: rings out before need

### Stage table
| Stage | title | need | neckScale | pegLean | softReturnPct | rings | standWobble | missesToDeath |
|------:|-------|-----:|----------:|:-------:|--------------:|------:|------------:|--------------:|
| 1 | Soft Teach | 2 | 1.00 | no | 0 | 5 | 0 | 4 |
| 2 | Mid Neck | 3 | 0.94 | soft | 8 | 5 | 0 | 3 |
| 3 | Lean Away | 3 | 0.90 | yes | 14 | 5 | low | 3 |
| 4 | Soft Kiss | 4 | 0.86 | yes | 18 | 6 | mid | 3 |
| 5+ | Ring Storm | 4+floor(t/2) | max(0.70,0.86-0.02*t) | hard | min(30,18+2*t) | 6 | high | 2 |

### Scoring
- +80 per hang · +360 ring clear · +90×stage
- Depth = rings cleared

### Death / result
- `deathReason:"rings_out"|"soft_return"|"airball_streak"`
- Card: `RING {n}`

### Don’ts
- fair upright pegs forever · magnet auto-hang · ignore pegLean late · clone bentring crate 1:1 (soft-return is the tell)

### Accept
- Player sees lean + soft-return spit as the cheat; stage 1 teachable in ~10s

---

## 2) bellhammer — TimingTap · Bell Hammer Timing
**Cheat visible:** bell “lies late” — pulse sweet spot painted early; true clang window sits after the painted mark (classic high-striker cousin without the tower).
**Feel:** Midway hammer-bell timing booth — tap the clang, not the paint.
**Verb:** Tap STRIKE when the pulse crosses the true late window; clear strikes before the bell resets.
**Depth unit:** Strike
**Input:** Tap on pulse window (`windowMs`); lateLie decoy mark stage 3+
**Suggested engine:** TimingTap

### Vestibule
- Prop: brass bell on a short post, mallet silhouette, painted early mark readable as a lie up close
- Barker: “STRIKE THE LATE CLANG — THE PAINT LIES EARLY”
- Best: `Strikes {n}`

### Play loop
1. Pulse travels mallet arc; painted mark sits early; true windowMs is lateLieMs after the paint
2. Tap in true window → strike credited; early / paint-tap / miss = strike fail
3. Clear when need strikes met before resetMs → depth++ · tighter window · bigger late lie
4. DEATH at missesToDeath OR reset with strikes left

### Stage table
| Stage | title | need | windowMs | pulseMs | lateLieMs | resetMs | missesToDeath |
|------:|-------|-----:|---------:|--------:|----------:|--------:|--------------:|
| 1 | Teach Clang | 3 | 180 | 900 | 0 | 14000 | 3 |
| 2 | Mid Bell | 4 | 155 | 820 | 40 | 13000 | 3 |
| 3 | Late Lie | 5 | 135 | 740 | 80 | 12000 | 3 |
| 4 | Thin Clang | 6 | 115 | 660 | 110 | 11000 | 2 |
| 5+ | Bell Storm | 6+t | max(70,115-5*t) | max(420,660-25*t) | min(180,110+10*t) | max(8000,11000-200*t) | 2 |

### Scoring
- +40 per strike · +300 strike-stage clear
- Depth = strike stages cleared

### Death / result
- `deathReason:"misses"|"early_paint"|"reset_fail"|"late_miss"`
- Card: `STRIKE {n}`

### Don’ts
- auto-clang on proximity · credit the painted early mark · window never tightens · full highstriker tower clone

### Accept
- Timing addiction; late-lie paint is the visible cheat

---

## 3) cottonwind — HoldBand · Cotton Candy Wind
**Cheat visible:** wind gusts snap the sweet band sideways when the spool nearly seats (fairy-floss cousin — wind, not romance tension).
**Feel:** Boardwalk cotton-candy / spun-sugar stall — hold force while wind tries to steal the spool.
**Verb:** Hold force in the band while the candy spool seats `clearMs` without a wind snap.
**Depth unit:** Spool
**Input:** Hold/drag force meter (HoldBand)
**Suggested engine:** HoldBand

### Vestibule
- Prop: spinning candy spool, striped paper cone, wind vane that twitches before snaps, force band dial
- Barker: “HOLD THE SWEET SPOOL — WIND SNAPS WHEN YOU’RE CLOSE”
- Best: `Spools {n}`

### Play loop
1. Band shows sweet force; windSnap from stage 3 yanks band opposite when seat progress > 70%
2. Stay in band for clearMs / spool seat toward the cone mark
3. Out of band > outLimitMs = slip strike / death path; snap hit = wind death path late
4. Clear when spool seats without snap kill → depth++ · thinner band · nastier gusts
5. DEATH: slipLimit / outLimit / wind_snap / never found band

### Stage table
| Stage | title | bandW | windSnap | outLimitMs | clearMs | slipLimit |
|------:|-------|------:|----------|-----------:|--------:|----------:|
| 1 | Soft Teach | 0.30 | 0 | 900 | 1800 | 3 |
| 2 | Mid Spool | 0.24 | 0 | 800 | 2000 | 2 |
| 3 | Gust Snap | 0.18 | low | 700 | 2200 | 2 |
| 4 | Thin Sugar | 0.14 | mid | 600 | 2400 | 2 |
| 5+ | Wind Storm | max(0.08,0.14-0.01*t) | high | 500 | 2600 | 2 |

### Scoring
- +50 per seat tick · +320 spool clear
- Depth = spools won / stages

### Death / result
- `deathReason:"slipped"|"wind_snap"|"never_found"`
- Card: `SPOOL {n}`

### Don’ts
- auto-spin button · Love-heat / fairyfloss romance copy · ignore wind snap late · real sugar / food spend framing

### Accept
- Force band skill; wind snap near seat is the readable cheat

---

## 4) chippusher — GreedFloor · Chip Pusher Shelf
**Cheat visible:** shelf edge avalanches — chips look ready to drop, then the shelf breathes and pulls them back (coin-pusher cousin with chip avalanche tell).
**Feel:** Midway chip / token pusher — greed vs cash-out.
**Verb:** Nudge chips toward the drop lip; avalanche or rare drop; CASH OUT or PUSH AGAIN.
**Depth unit:** Floor
**Input:** Tap/drag nudge; then CASH OUT / AGAIN buttons
**Suggested engine:** GreedFloor
**cashOut:** true

### Vestibule
- Prop: glass shelf of painted chips, breathing edge lip readable, dud tray under, rare prize chip tinted
- Barker: “PUSH THE CHIPS — OR WALK WITH WHAT YOU GOT”
- Best: `Floor {n}` · rares held

### Play loop
1. Each floor: N pushes; rarePct chance a chip drops; else avalancheBreath pulls chips back (tell after first dud)
2. After each push: **CASH OUT** (end, keep depth/loot) or **AGAIN**
3. Clear floor if rare found OR survive pushesToClear without hitting deathRule → may DESCEND
4. DEATH: avalancheStreakDeath on floor≥2 OR empty bank after committing again with no rare
5. Depth = floors survived / descended

### Stage / floor table
| Floor | pushes | rarePct | avalancheStreakDeath | pushesToClear | avalancheBreath | shelfWobble |
|------:|-------:|--------:|---------------------:|--------------:|:---------------:|-------------|
| 1 | 8 | 16 | no | 3 | yes (chalk lip) | 0 |
| 2 | 10 | 12 | 3 | 3 | yes | low |
| 3 | 10 | 10 | 3 | 4 | yes | low |
| 4 | 12 | 8 | 2 | 4 | yes | mid |
| 5+ | 14 | 6 | 2 | 5 | yes + distractor | high |

### Scoring
- rare rarity points · +220 floor survived · cash-out bonus +12% if floor≥4
- Depth = floors

### Death / result
- `deathReason:"avalanche_streak"|"empty_bank"|"shelf_breath"` · cashedOut flag when voluntary exit
- Card: `FLOOR {n}`

### Don’ts
- fair frictionless shelf forever · hide avalanche with no tell · no CASH OUT button · real-money pusher / casino copy

### Accept
- Greed sweat; shelf avalanche breath is the alley joke players can spot

---

## 5) fortunedoors — OracleRooms · Fortune Door Pick
**Cheat visible:** two doors fib — stillness opens a trio; twin decoy doors swap labels after the curtain lifts (oracle cousin, door-pick not age/weight).
**Feel:** Midway fortune / three-door booth — hold still, then pick the true door.
**Verb:** Hold stillness to open rooms; tap a door; fib doors = curtain death.
**Depth unit:** Door
**Input:** Stillness wait → tap a door card
**Suggested engine:** OracleRooms
**Copy tone:** soft_cute — playful fortune, no destiny-romance / medical

### Vestibule
- Prop: three painted carnival doors, curtain, paper fortune slips, crystal-ish needle
- Barker: “HOLD STILL — THEN PICK THE TRUE DOOR”
- Best: `Doors {n}`

### Play loop
1. Stillness for waitMs opens the room; break early = broke_still
2. Doors shown; fibCount doors are lies; twinSwap stage 3+ swaps two labels after open
3. Pick true door → depth++ · more doors / nastier swaps
4. Wrong door / timeout → DEATH (curtain)

### Stage table
| Stage | title | waitMs | breakLimitMs | doors | fibCount | twinSwap | pickWindowMs |
|------:|-------|-------:|-------------:|------:|---------:|:--------:|-------------:|
| 1 | Soft Teach | 1200 | 4000 | 3 | 1 | no | 5000 |
| 2 | Mid Curtain | 1400 | 3800 | 3 | 1 | no | 4500 |
| 3 | Twin Fib | 1600 | 3500 | 3 | 2 | yes | 4000 |
| 4 | Four Frames | 1800 | 3200 | 4 | 2 | yes | 3500 |
| 5+ | Door Storm | min(2400,1800+80*t) | max(2200,3200-100*t) | 4+(t%2) | 2 | yes + feint | max(2200,3500-100*t) |

### Scoring
- +120 per true door · +280 door-stage clear
- Depth = doors / rooms cleared

### Death / result
- `deathReason:"wrong_door"|"broke_still"|"timeout"|"fib_swap"`
- Card: `DOOR {n}`

### Don’ts
- destiny-romance / medical copy · skip stillness gate · always-fair single door · shame / curse framing

### Accept
- Stillness then pick; twin fib doors are the readable cheat

---

## 6) marblemaze — Custom · Marble Maze Trace
**Cheat visible:** maze walls nudge inward on near-clears — marble “almost out” gets pinched (distinct from marblerun gravity track and midwaymaze top-down fair walls).
**Feel:** Boardwalk handheld marble maze — tilt / drag the marble to the exit before the walls breathe.
**Verb:** Drag-tilt marble along the path; exit without wall pinch or hole drop.
**Depth unit:** Maze
**Input:** Drag / tilt pointer (Custom — HoldBand seat cousin + path collision)
**Suggested engine:** Custom

### Vestibule
- Prop: wooden maze tray, glass marble, exit hole painted gold, walls with hairline “breathe” seams readable up close
- Barker: “WALK THE MARBLE OUT — WALLS NUDGE WHEN YOU’RE CLOSE”
- Best: `Mazes {n}`

### Play loop
1. Stage posts a path length / timeBudgetMs; marble starts at entry
2. Drag-tilt moves marble; hole traps = fall death; wall contact = bounce or pinch
3. wallNudge stage 3+ pinches corridors when exit progress > 75%
4. Clear when marble seats in exit → depth++ · longer path · nastier nudge
5. DEATH: time out / hole fall / wall pinch / stuckLimit

### Stage table
| Stage | title | pathLen | timeBudgetMs | wallNudge | holeCount | corridorW | stuckLimitMs |
|------:|-------|--------:|-------------:|:---------:|----------:|----------:|-------------:|
| 1 | Soft Teach | 6 | 22000 | no | 1 | 1.00 | 4000 |
| 2 | Mid Trace | 8 | 20000 | no | 2 | 0.92 | 3500 |
| 3 | Wall Breath | 9 | 18000 | yes (low) | 2 | 0.86 | 3000 |
| 4 | Thin Lane | 10 | 16000 | yes (mid) | 3 | 0.80 | 2800 |
| 5+ | Maze Storm | 10+t | max(10000,16000-400*t) | yes (high) | 3+floor(t/2) | max(0.62,0.80-0.02*t) | max(1800,2800-80*t) |

### Scoring
- +15 per path node · +340 maze clear · time leftover bonus
- Depth = mazes cleared

### Death / result
- `deathReason:"timeout"|"hole_fall"|"wall_nudge"|"stuck"`
- Card: `MAZE {n}`

### Don’ts
- auto-path solve · fair walls with no nudge tell · clone marblerun / midwaymaze 1:1 · physics that soft-locks forever without stuck death

### Accept
- Path skill; wall nudge near exit is the alley joke

---

## Implement order
1. ringlean (shares SlingAim / bentring soft-return fork)
2. bellhammer (TimingTap late-lie)
3. cottonwind (HoldBand wind snap)
4. chippusher (GreedFloor cash-out)
5. fortunedoors (OracleRooms door fib)
6. marblemaze (Custom path + nudge)

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: ringlean, bellhammer, cottonwind, chippusher, fortunedoors, marblemaze.
Door tag: `Depth run` only if engine mounted.
