# Goblin Batch 02 — full engine sheets (Milk · Cover-the-Spot · Water Gun)
# Hand Aura → Desktop Grok AFTER batch 01 playables stick — but sheets ready NOW.
# DNA: 1 coin = 1 run · depth until DEATH · tent mouth shows the cheat · mobile-first · solo Aura

Shared: routes `#cabinet/{milk|coverspot|watergun}` vestibule/play/result · `bestDepth.*` · result challenge copy · no webcam · no real-money

---

## 1) Weighted Milk Bottles
**Cheat visible:** bottom row darker/heavier; top bottles fly, bottom barely budge.
**Feel:** Spill-the-milk carnival stall.
**Verb:** Aim + power throw a softball at a pyramid.

### Vestibule
- Prop: 6-bottle pyramid (3–2–1), bottom row shaded heavier
- Barker: “KNOCK ’EM ALL — THE BOTTOM ONES FIGHT BACK”
- Best: `Pyramids {n}`

### Play
- Drag-aim + pull power (share Ball Toss launcher code if possible)
- Ball hits bottle = impulse; mass: top=1, mid=1.4, bottom=2.6 (the cheat)
- Pyramid cleared when all bottles past fall threshold (rotation>50° or y drop)
- **3 throws per pyramid.** Clear with bottles down → next stage. Fail to clear in 3 → DEATH (or 2 misses + incomplete = death)

### Authored PYRAMID rooms (GOBLIN_AUTHORED_LEVELS_P0.md) — NOT pure stageParams
| # | Name | Pyramid / bottle cheat | Beat | vs prior |
|---|------|------------------------|------|----------|
| 1 | **Fairground Six** | Classic 3–2–1; bottom mass 2.0; wide pins | Teach aim to base | — |
| 2 | **Heavy Heels** | Same pyramid; bottom mass 2.6; tops light | Classic weight cheat | Mass, not count |
| 3 | **Wide Shoulders** | 4–3–2–1 (10 bottles) wider base; mid mass bumped | More pins, new silhouette | Layout count |
| 4 | **Glue Corner** | 3–2–1; **one bottom corner glued** (needs 2 hits) | Planned second shot | Sticky cheat |
| 5 | **Split Stack** | Two mini pyramids side-by-side (3+3); must clear both | Dual targets | Two boards |
| 6 | **Wind Shelf** | Classic 6; **lateral wind drift** on ball; tight pins | Compensate aim | Wind room |
| 7 | **Stuck Pin Atelier** | Tight 3–2–1; **random stuck bottle** each attempt (telegraph darker); bottom mass 3.2 | Scout then strike | Random sticky + mass |

**Endless coda** (`codaEnabled:true`, hybrid default): mass climb + stuck bottle — after Pyramid 7. HUD labeled `ENDLESS`. Flip `codaEnabled:false` → souvenir clear after 7.

### Scoring
- +50 per bottle · +400 pyramid clear · +80×stage
- Depth = pyramids cleared

### Death / result
- Exhaust 3 throws without clear → DEATH
- `PYRAMID 6 · SCORE · “Aura: That bottom row is concrete, sugar.”`

### Don’t
- Equal mass bottles (removes alley joke)
- One perfect auto-strike tutorial forever

### Accept
- Player notices bottom row is unfair
- Stage 4+ needs planned shots not spam

---

## 2) Cover-the-Spot Cruel
**Cheat visible:** the spot is slightly larger than any single disc; geometry refuses perfection early.
**Feel:** Old carnival “cover the red circle” counter game.
**Verb:** Drop discs to cover a target circle; cash out or risk another disc.

### Vestibule
- Prop: red circle on felt + stack of discs that look “big enough” (they aren’t quite)
- Barker: “COVER THE SPOT — OR GET GREEDY”
- Best: `Coverage {best%}` and `Discs survived {n}`

### Play
- Top-down. Target radius R. Discs radius r = 0.72R at SPOT 1 (cannot cover in 1 disc — classic cheat).
- Tap to drop disc at pointer (with slight snap/latency). Discs stay.
- Coverage = union area / target area (approx with grid stamp 64×64 OK)
- Reach `targetPct` within `maxDiscs` → SPOT clear (depth++). Fail → DEATH (`bust`). Two table misses → DEATH (`miss_table`).
- Cash out only **between spots** after a clear (bank score, depth kept). **Primary path = clear authored spots until death.**
- Twin: both circles must hit `targetPct`. Drift: discs stick, live coverage can clear. Ring: annulus only — center is a trap.

### Authored SPOT rooms (GOBLIN_AUTHORED_LEVELS_P0.md) — NOT pure stageParams
| # | Name | Spot shape / disc rules | Target beat | vs prior |
|---|------|-------------------------|-------------|----------|
| 1 | **Red Circle Honest** | Round spot; r/R=0.72; target 70%; max 4 | Learn union coverage | — |
| 2 | **Tight Felt** | Same circle; r/R=0.68; target 75% | Classic cheat tighten | Ratio-bridge only |
| 3 | **Oval Blush** | **Oval spot** (1.3× wide); discs still round | Shape mismatch | Spot shape change |
| 4 | **Drifting Dot** | Round spot **slow drifts**; discs stick in world space | Lead the spot | Motion |
| 5 | **Twin Spots** | **Two small circles**; both must hit target | Split attention | Dual targets |
| 6 | **Ring Spot** | Annulus (donut); center hole doesn’t count | Cover the ring | Topology cheat |
| 7 | **Jitter Stamp** | Irregular blob + jitter; maxDiscs 6; target 85% | Finale geometry | Blob + nerves |

**Endless coda** (`codaEnabled:true`, hybrid default): smaller r/R, higher targetPct, jitter — after Spot 7. HUD labeled `ENDLESS`. Flip `codaEnabled:false` → souvenir clear after 7.

### Scoring
- score += floor(coverage*100) per stage clear + 200×stage
- Depth = stages cleared

### Don’t
- True RNG win on first disc
- Unreadable % meter

### Accept
- Feels slightly unfair then skillful
- Greedy players die chasing 94%

---

## 3) Water Gun Duel
**Cheat visible:** clown mouths dodge; lane 2 has ghost NPC now (real player later).
**Feel:** Midway water-gun race / Shark Attack cousin.
**Verb:** Hold to spray; keep stream on moving mouth to raise your marker.

### Vestibule
- Prop: two lanes, clown mouths, fill tubes, ghost silhouette on lane B
- Barker: “FILL IT FIRST — DON’T MISS THE MOUTH”
- Best: `Heats {n}` or endless `Fill metres`

### Play (1P vs ghost v1)
- Hold spray = stream on; release = stop
- Mouth wanders on a path; stream hits only if **drag aim (X+Y)** overlaps the mouth hitbox — zigzag is a map, not X-only
- While hitting: your fill += rate. Ghost fill += ghostRate(stage)
- First to fillMax wins heat → depth++ · brief reset · next authored map
- **DEATH:** ghost wins the heat (you lost the race) OR stall (no hit while ghost advances) ≥ stallLimitMs

### Authored HEAT rooms (GOBLIN_AUTHORED_LEVELS_P0.md) — NOT pure stageParams
| # | Name | Duel map / mouth path | Ghost / cheat | vs prior |
|---|------|----------------------|---------------|----------|
| 1 | **Lane Lesson** | Straight horizontal wander; big hitbox; ghost slow | Teach hold-on-mouth | — |
| 2 | **Sine Smile** | Mouth follows **sine wave**; big hitbox | Ghost 0.7 rate | Path shape |
| 3 | **Feint Clown** | Mouth **feints** (quick fake dodge) every few secs | Mid hitbox | Feint beat |
| 4 | **Twin Mouth Map** | **Two mouths** alternate active (only active credits fill) | Ghost matches map | Dual targets |
| 5 | **Zigzag Duel** | Diagonal zigzag path; smaller hitbox; yourRate 0.95 | Ghost ~even | Path + pressure |
| 6 | **Fake-Open Fair** | Mouth sometimes **fake-open** (20% — no credit, toast) | Ghost pressure high | Lie beat |
| 7 | **Mirror Lane** | Your aim mirrored horizontally (stream flips); mouth on sine+feint | Finale confusion map | Control remap room |

**Endless coda** (`codaEnabled:true`, hybrid default): speed/hitbox/ghostRate climb + fake-open — after Heat 7. HUD labeled `ENDLESS`. Flip `codaEnabled:false` → souvenir clear after 7.

### Scoring
- +300 per heat win · + leftover fill advantage
- Depth = heats won

### Multiplayer later
- Lane B = second pointer / second phone code — same fill rules; no ghost

### Don’t
- Spray-anywhere auto fill
- Instant heat without tracking

### Accept
- Wrist/aim matters
- Heat 5+ feels like a duel

---

## Implement order
1. Milk (shares Ball Toss launcher) — LIVE vendors/milk-bottles.js (Desktop Grok, GOBLIN REVIEW REDO 2026-09-05)
2. Water Gun (hold skill, Love cousin) — LIVE vendors/water-gun-duel.js (Desktop Grok, GOBLIN REVIEW REDO 2026-09-05)
3. Cover-the-Spot (grid math) — LIVE vendors/cover-the-spot.js (Desktop Grok, GOBLIN REVIEW REDO 2026-09-05)

Art: Imagine sets already sketched in IMAGINE_VENDOR_BATCH02.md — wire when engines breathe. Never Imagine from this desk.
