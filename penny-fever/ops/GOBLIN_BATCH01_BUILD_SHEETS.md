# Goblin Batch 01 — full build sheets (not shells)
# LIVE 2026-09-05 — vendors/ball-toss.js · coin-pusher.js · pinball.js
# Authored RACK/FLOOR/CHAPTER rooms (GOBLIN_AUTHORED_LEVELS_P0.md). codaEnabled hybrid ENDLESS.
# For Aura → Desktop Grok / Codex. Demo coins only. Mobile-first. Solo Aura art.
# DNA: 1 coin = 1 run. Stages climb until DEATH. Ticket = postcard from depth you died at.
# Vestibule = tent mouth + physical joke visible + depth readout + barker promise.

Shared constants (suggest):
- STORAGE: extend `pennyFever.v2` with `bestDepth.balltoss|coinpusher|pinball`, `lastRun`, optional `ghostInputs` later
- Coin cost: 1 demo coin to start; no spend on death
- Result card: game name · depth · score · Aura one-liner · Copy challenge
- Casual vs Hardcore later; ship **Hardcore = no checkpoint** first for batch 01
- Touch: pointerdown/up + touch; no keyboard required
- 60fps target; CSS/canvas OK; no external APIs

---

## 1) Barely-Fit Ball Toss
**Alley joke:** The holes are slightly too small and the board lies.
**Feel:** Midway ball-toss stall, striped tent, warped plywood, prize shelf as flavour only.
**Signature verb:** Aim + release a ball into a hole that doesn’t want you.

### Vestibule
- Prop: board with 3–5 holes clearly *too small*; one hole slightly oval/cheated.
- Copy: “STEP RIGHT UP — HOLES THAT BARELY FIT — HOW MANY RACKS?”
- Show: Best Rack / Best Score (or —)
- CTA: Start · 1 demo coin → `#cabinet/balltoss/play`

### Play loop (one rack = one stage)
1. Ball sits on a throw line (bottom of screen).
2. Player **drag-aims** (angle) and **pulls back** (power) like a sling / pool cue. Release = throw.
3. Ball arcs with simple gravity; optional tiny lateral noise (±2%) so it isn’t pixel-perfect.
4. Hit a hole = rack progress. Miss or bounce out = miss.
5. Clear all holes in the rack → next stage. **3 misses in one rack = DEATH** (glass/board “CLOSED” stamp).

### Authored racks (8 rooms — layout/cheat, not hotter numbers)
HUD: `RACK {n} · {name}`. After Rack 8, if `codaEnabled` → `ENDLESS`; else souvenir stop.

| Rack | Name | Hole rack / layout | Cheat / beat |
|-----:|------|--------------------|--------------|
| 1 | **Three Honest Circles** | 3 round holes, scale 1.0, static triangle | Teach sling + sink speed |
| 2 | **Barely Fit Tri** | Same 3 holes, scale 0.90; spit threshold stricter | Fit, not count |
| 3 | **Sway Board** | 4 holes in diamond; board slow horizontal sway | Timing throw to moving target |
| 4 | **Oval Liar** | 4 holes; **one oval** (center-line aim) | Oval is the star cheat |
| 5 | **Crowded Five** | 5 holes tight cluster center; edges dead | Cluster collision / bounce chaos |
| 6 | **Spin Rack** | 5 holes on a slowly rotating board (±12°) | New axis of motion |
| 7 | **Decoy Dent Alley** | 5 real + **1 decoy dent** (bounce stamp) | Plywood lie |
| 8 | **Warp Keyhole** | 2 round, 1 oval, 1 keyhole, 1 tiny; micro sway + rotate | Shape roster |

**Endless coda** (after 8, `codaEnabled:true`): 5 holes, scale floor 0.55, sway+rotate, odd stages add decoy.

### Physics (keep dumb & readable)
- Gravity constant; power maps to initial velocity
- Collision: circle vs hole circle — success if ball center enters hole radius *and* speed below sink threshold (too fast = bounce spit — classic cheat)
- Bounce off board face with dampening

### Scoring
- +100 per hole sunk
- +500 rack clear
- +50 × stage on rack clear
- Style: consecutive sinks without miss → ×1.1 combo (cap ×2)
- **Depth = stages cleared** (primary glory). Score secondary.

### Death / result
- Death on 3rd miss in current rack (misses reset on rack clear)
- Result: `RACK 7 · SCORE · “Aura: That oval ate you.”`
- Copy challenge: `Beat my Ball Toss rack {n} on Penny Fever`

### Don’t
- Auto-aim assist
- One-throw-and-win ticket booth
- Webcam
- Giant panda prize UX (shelf is décor)

### Accept
- Drag-aim throws feel juicy; stage 1 teachable in 10s
- Player can articulate the cheat (“holes too small / spit-outs”)
- Best depth persists

---

## 2) Coin Pusher Shelf
**Alley joke:** The shelf of pennies — greed vs getting buried.
**Feel:** Arcade coin-pusher / penny faller under glass. Hypnotic. Nasty when the sweep comes.
**Signature verb:** Drop coins · watch cascade · choose CASH OUT or RISK NEXT DROP.

### Vestibule
- Prop: glass case, coin ledge packed with pennies, sweeper bar visible.
- Copy: “GREED IS THE GAME — CASH OUT OR GO DEEPER”
- Show: Best Floor rescued · Best coins banked
- CTA: Start · 1 demo coin

### Play loop
- Playfield = side-view or ¾ shelf with coins as simple discs (perf: pool of ~80–120 sprites max; merge stacks visually if needed).
- Player taps **DROP** (or taps a lane column 1–5) to drop one coin from above.
- Coins settle with simple stacking / nudging (no full Box2D required — grid columns + height stacks is OK v1).
- A **pusher ledge** slowly oscillates; when it pushes, overhanging coins may fall into the **tray** (rescued = score) or into the **pit** (lost).
- After each successful rescue wave, player gets a prompt: **CASH OUT** (end run, keep score) or **DROP AGAIN** (risk).
- **Depth = drops survived / floor metres** (define Floor = every N drops or every full sweeper cycle).

### Authored floors (7 rooms — shelf geometry, not hotter numbers)
HUD: `FLOOR {n} · {name}`. After Floor 7, if `codaEnabled` → `ENDLESS`; else souvenir stop.

| Floor | Name | Shelf / pit geometry | Greed pressure |
|------:|------|----------------------|----------------|
| 1 | **Glass Nursery** | Wide shelf, **3 lanes**, narrow pit, slow pusher | Soft bankTarget ~8; no buried death |
| 2 | **Split Shelf** | Center **seam pit** (two ledges) | BankTarget ~12; buried on wipe+0 tray |
| 3 | **Overhang Tease** | Deep overhang lip; stacks past safe edge | Near-falls telegraph |
| 4 | **Double Sweep** | Pusher does **two short pushes** per cycle | Faster decision cadence |
| 5 | **Pit Mouth** | Pit widens into a **V-mouth** under center; sides safer | Lane choice matters |
| 6 | **Trapdoor Floor** | Random lane **trapdoor** once per floor (shudder telegraph) | Cash-out scream |
| 7 | **Avalanche Gallery** | Tall stacks; high avalanche; back-wall kickers | Max greed dilemma |

**Endless coda** (after 7, `codaEnabled:true`): bankTarget +4/floor, pit widen, avalanche on.

### Death
- Not instant on one bad drop. Death = **tray reaches 0 AND pit takes your last overhanging stack after a push while you’re on Floor ≥2** — OR simpler v1: **3 empty trays in a row** (pushes that yield 0 rescued) = buried / DEATH.
- Prefer v1 simple: **DEAD when a push clears your shelf to zero coins and tray gain is 0** after Floor 1 (you got greedy and the machine ate everything).

### Cash out (the hook)
- Any time between drops (not mid-physics): **CASH OUT** ends run as a *win-state souvenir* (not death) with depth + banked coins.
- This is the Dig-Dug / greed emotion. UI must scream the dilemma.

### Scoring
- Banked coins × 10
- +200 per Floor survived
- Cash-out bonus: +15% if Floor ≥5
- Depth primary for foyer badge: `Floor {n}`

### Don’t
- Real-money / gambling copy
- Infinite free drops without risk
- Unreadable 500-body physics soup on mobile

### Accept
- One round of play teaches DROP → push → tray
- Players feel greed (one more drop)
- Cash out vs death are distinct result flavours

---

## 3) Pinball Alley
**Alley joke:** A real backglass table in a tent — one ball, how deep is the chapter?
**Feel:** EM pinball romance: flippers, thump, lit backglass. Mobile = one-thumb / two-zone flippers.
**Signature verb:** Flip to keep the ball alive through rising table chapters.

### Vestibule
- Prop: backglass lit (PENNY FEVER / Aura pose), flipper table ¾ view.
- Copy: “ONE BALL — HOW MANY CHAPTERS?”
- Show: Best Chapter · Best Score
- CTA: Start · 1 demo coin

### Play loop
- **1 ball per coin** (classic credit feel). Optional: earn remount ball at Chapter 5+ later — not in v1.
- Controls: tap/hold **LEFT** half = left flipper; **RIGHT** half = right. Both = both. Nudge = small tilt gesture (optional v1.1; skip if tilt-abuse).
- Table elements v1 (keep few, readable):
  - 2 flippers
  - 3 bumpers (circle bounce + points)
  - 1 spinner lane
  - 2 slingshots
  - 1 ramp or sink hole that starts **Chapter clear** when hit enough times
  - Outlanes L/R → DRAIN = DEATH

### Authored chapters (8 rooms — table layout, not ball-speed-only)
HUD: `CHAPTER {n} · {name}`. After Chapter 8, if `codaEnabled` → `ENDLESS`; else souvenir stop.
Chapters change **which toys exist**, not just speed on the same walls.

| Ch | Name | Table layout (new props) | Mission to clear |
|---:|------|--------------------------|------------------|
| 1 | **Plunger Parade** | 2 flippers, 3 bumpers triangle, gentle outlane posts | Hit each bumper once |
| 2 | **Spinner Alley** | **Center spinner** + 2 slingshots; bumpers move to sides | 3 spinner ticks |
| 3 | **Sinkhole Circus** | Center **sink**; bumpers ring around it | Sink ×2 |
| 4 | **Ramp Carnival** | Left **wire ramp** to upper shelf (1 bumper) + lower 2; sink | Ramp + sink once |
| 5 | **Bumper Storm** | **5 bumpers** dense mid; no ramp; tight inlanes | Bumper combo ×5 |
| 6 | **Twin Flip Gate** | **Upper mini-flipper** (tap-both); gate opens bonus lane | Open gate + 2 bonus hits |
| 7 | **Outlane Thorns** | Spinner + sink + **thorn posts** beside outlanes | Spinner, then sink |
| 8 | **Backglass Fever** | Ramp + spinner + sink + 4 bumpers; **rollovers rearrange** | Ramp → spinner → sink |

**Endless coda** (after 8, `codaEnabled:true`): Ch8 toy set, rotated mission list, speed mult climb cap ~1.7.

- Chapter clear = fanfare + Depth++ + brief safe plunge. Drain anytime = DEATH (lose ball).

### Physics
- 2D circle ball; flipper = rotating segment impulse; bumpers = radial impulse; walls = reflect.
- Use a tiny fixed-timestep loop. Canvas or DOM — Grok’s choice; prefer canvas for ball.

### Scoring
- Bumper/spinner points
- +1000 × chapter on clear
- Flipper live time soft bonus every 10s (+50)
- Depth = chapters cleared

### Death / result
- Drain → `CHAPTER 4 · SCORE · “Aura: Outlane gotcha, sugar.”`
- Challenge: `Beat my Pinball chapter {n}`

### Don’t
- 3-ball default credit (kills “one coin one run” story) — unless foyer mode “Fancy” later
- Tiny unreadable table on phone — design large flipper zones
- Full Williams ROM complexity — mission table above is enough

### Accept
- Flippers feel fair; drain feels like player fault
- Chapter cadence readable on backglass (CHAPTER 3 lamp)
- 60s+ runs possible for decent players

---

## Implementation order for Grok/Codex
1. Routes: `#cabinet/{balltoss|coinpusher|pinball}` vestibule · `/play` · `/result` (mirror Love)
2. Shared `RunResult { depth, score, deathReason, cashedOut? }`
3. Ball Toss first (simplest verb) → Coin Pusher (state/greed) → Pinball (physics heaviest)
4. Foyer door cards: tag `Vendor · Depth run`, art placeholders OK
5. Aura VO one-liners: hook me if you want a table of 8 lines × rank/death each

## Out of scope for batch 01
Multiplayer lanes, ghost replay upload, real payments, Mirror Crew, webcam.
