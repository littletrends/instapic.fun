# Goblin Authored Levels B03 — REAL ROOMS, NOT HARDER LOOPS
# For Aura / Codex. Design only. Mutoscope · Catoptromancy · High Striker · Bent Rings · Plinko
# DNA: walkable carnival alley · tents = depth cabinets · 1 coin = 1 run · family-safe · no casino · no Mirror Crew
# Lorie ask: INTERESTING games with REAL LEVELS (different layouts / beats), not the same loop getting harder.
# P0/B02 rooms live in GOBLIN_AUTHORED_LEVELS_P0.md — DO NOT rewrite those here.
# Engines live on Mother (Batch03 mounts). This file authors the stage tables Aura wires next.

---

## 0) North star (same hybrid lock as P0)

**Recommended default (hybrid):**
- Each B03 cabinet ships **6–8 authored stages** with unique names, layouts, and cheat beats.
- After the last authored stage clears → optional **Endless Coda** (`codaEnabled:true`) OR soft **CASHOUT / souvenir** exit.
- HUD shows authored chapter names; coda labeled `ENDLESS` so players know the authored ride ended.

| Mode | What it is | Status |
|------|------------|--------|
| **A · Hybrid (default)** | 6–8 authored rooms → optional endless coda | **CONFIRMED — authored first; coda flaggable** |
| B · Authored-only | Hard stop after final named stage | Alt if she hates endless |
| C · Pure generator | Old stageParams climb forever | **PAUSE** — boring path she rejected |

**Rule for every stage:** if you can describe the change as “same board, smaller numbers,” it is **illegal**. Change geometry, cheat, input cadence, or win condition beat.

Live parametric tables in `GOBLIN_BATCH03_MOUNT_CONFIGS.md` become **coda / fallback** only after these authored rooms ship.

---

## Shared run contract (B03)

- **1 coin = 1 run** until DEATH (or cash-out where noted).
- Result card: `NAME · depth · score · deathReason · Aura line · challenge CTA`
- Vestibule shows best depth unit + barker cheat line (stage banner uses room name on enter).
- Depth unit labels: Mutoscope=`STAGE` · Catoptromancy=`ROOM` · High Striker=`TOWER` (authored) / peg glory · Bent Rings=`BOARD` · Plinko=`DROP`
- Mobile-first · pointer only · no keyboard required · no real-money / gambling copy
- Soft pack for oracle tickets: playful Aura; never medical / death / destiny-romance

---

## 1) Mutoscope Hood (`mutoscope` · Custom stillness)

**Alley joke:** The iris only loves statues — each room changes *how* the peep hood lies, not just how tiny the still-pixel budget is.
**Input:** Hold still (pointer move < `stillPx`); optional tap crank to speed next card (−30% interval once per card). No gyro-only.
**Death:** Slam count hits `slamLimit` this stage (`iris slam`). Stage 1 forgiving.
**Scoring:** +40/card · +300 stage · +50×depth. Depth = stages cleared.
**Vestibule cheat line:** “HOLD STILL — THE REEL ONLY LOVES STATUES”

### Authored stages (8)

| # | Name | Layout / reel behavior | Clear beat | Death / cheat | What changes vs prior |
|---|------|------------------------|------------|---------------|------------------------|
| 1 | **Peep Lesson** | Single reel, iris opens after warmup; tall still budget; slamLimit 3. | View 4 cards | Grace slams; teach still → open | — (tutorial room) |
| 2 | **Crank Parade** | Same hood; **crank is required once** mid-reel (toast: CRANK) or timer stalls. | 5 cards + 1 mandatory crank | SlamLimit 2 | New verb: must crank, not just freeze |
| 3 | **Reverse Flip** | Cards advance **backward** (right→left flip); still rules same. | 6 cards | Same | Direction layout — reads different |
| 4 | **Jump Scare Gallery** | Mid-reel **visual flash** (jumpScare); movement during flash still slams. | 7 cards | Flash baits fidget | Scare beat, not tighter stillPx alone |
| 5 | **Twin Iris** | **Two iris windows** stacked; stillness must hold for *both* (shared meter). Cards tick only when both open. | 6 cards (slower tick) | Moving either zone side counts | Dual-window geometry |
| 6 | **Fake Slam Tent** | Audio **fake slam** thrice/stage — ignore for strike; real move still kills. | 7 cards | Teach distrust of sound | Lie beat (audio decoy) |
| 7 | **Blink Hood** | Iris **auto-blinks shut** 400ms every ~2.8s; stay still through blink (no slam if still). Fidget during blink = slam. | 8 cards | Blink cadence is the room | Timed event, not shrink |
| 8 | **Flicker Fever** | Cards **stutter** (pause/resume); crank during stutter = poison slam (`crank lied`). Optional coda unlock. | Survive stutter+poison crank for cardsNeeded | Tight still + crank law invert | Living reel behavior, not Peep Lesson hard |

**Endless coda (if Hybrid on):** resume parametric `mutoscopeStageParams` from n=9 with titles `Endless Peep {n}` (fakeSlamAudio on) — flaggable off.

### Acceptance feel — Mutoscope
- Crank Parade / Flicker Fever change the **crank law** (required → poison) — player can name the flip.
- Twin Iris and Blink Hood are different hood machines, not tighter stillPx stickers.
- Fake Slam Tent makes you distrust the booth audio — alley DNA.

---

## 2) Catoptromancy Mirror (`catoptromancy` · OracleRooms)

**Alley joke:** The wait IS the game — each room changes the glass ritual, not just a longer timer.
**Input:** Hold gaze (press-and-hold). Progress ring fills only while holding. KEEP / BURN / DOUBLE after wait.
**Death:** `breakMs` > `breakLimitMs` (`looked away`) OR DOUBLE fail (55%).
**Scoring:** +200 KEEP · +600 DOUBLE success · 3-same colour constellation +500. Depth = rooms cleared with KEEP (BURN stays; DOUBLE success jumps +2).
**Vestibule cheat line:** “THE MIRROR KNOWS YOU’RE THERE — DON’T LOOK AWAY”

### Authored stages (8)

| # | Name | Glass / ritual layout | Clear beat | Death / cheat | What changes vs prior |
|---|------|----------------------|------------|---------------|------------------------|
| 1 | **First Gaze** | Soft wait ~4s; generous break; KEEP only (no DOUBLE). | Hold → KEEP | Teach hold/release | — |
| 2 | **Candle Gallery** | Wait ~5s; **candle flicker** VFX (visual only — not a break). BURN unlocked. | KEEP or BURN | BURN doesn’t advance depth | Ritual choice enters |
| 3 | **Double Threshold** | Wait ~6s; **DOUBLE** unlocks (45/55). Single glass. | KEEP / risk DOUBLE | DOUBLE sweat starts | New verb: risk jump |
| 4 | **Lie Flicker Glass** | Wait ~7s; **lie flicker** flash — hold through; release still breaks. | KEEP/BURN/DOUBLE | Flash baits release | Lie cadence beat |
| 5 | **Twin Pane** | **Two panes** in sequence: fill ring A then ring B in one room (release between = break bank continues). | Both panes → ticket | Dual gaze map | Layout: two glasses |
| 6 | **Colour Choir** | Ticket colours weighted; clear bonus if you KEEP a colour matching last 1–2 KEPT (constellation tease loud). | KEEP preferred | Same deaths | Score-layout room (collect verb) |
| 7 | **Hazy Refusal** | Ticket may **refuse** (“hazy… try again”) — still valid KEEP (flavour only); DOUBLE still deadly. | KEEP through haze | Flavour trap, not skip | Oracle personality room |
| 8 | **Burner’s Altar** | BURN yields **juicier ticket preview** then longer next wait (×1.25); DOUBLE odds shown theatrical. Finale. | Survive choice gauntlet | Tempt BURN / DOUBLE | Greed ritual finale — not longer wait alone |

**Endless coda:** parametric climb waitMs / tighter break + hazy — after Room 8; titles `Hazy Oracle {n}`.

### Acceptance feel — Catoptromancy
- Twin Pane is a different ritual map (two glasses), not First Gaze with a bigger number.
- Lie Flicker / Hazy Refusal are readable cheats you can yell about.
- Burner’s Altar makes BURN feel like a real alley temptation, not a dead button.

---

## 3) High Striker Pegs (`highstriker` · TimingTap)

**Alley joke:** Bell is a checkpoint, not the ending — each **tower chapter** changes *how* the hammer window behaves, not just a thinner zone.
**Input:** Tap when indicator is inside the moving sweet zone → climb +1 peg. Miss = slip.
**Death:** 3 slips in a chapter without net gain OR fall from peg 0 twice (`hammer slip` / `fell from zero`).
**Scoring:** +30/peg · +200/bell. Authored depth unit on HUD = **TOWER** chapter; glory can still report peak peg.
**Vestibule cheat line:** “RING IT — THEN KEEP CLIMBING”
**Wire note:** Authored chapters replace pure bandParams climb for towers 1–8; each chapter has a peg quota to clear (bell fanfare on clear). After Tower 8 → coda resumes height bands from peg ~21+.

### Authored stages (8) — tower chapters

| # | Name | Tower / window layout | Clear beat | Death / cheat | What changes vs prior |
|---|------|----------------------|------------|---------------|------------------------|
| 1 | **Soft Mallet Lane** | Tall zone (~18%), slow sine; climb 5 pegs; real bell on clear. | 5 pegs | Teach tap-in-window | — |
| 2 | **Bell Ladder** | Zone medium; **bell every 3 pegs** inside chapter (extra fanfare). Climb 6. | 6 pegs / 2 bells | Checkpoint rhythm | Bell cadence change |
| 3 | **Side-Sway Tower** | Sweet zone **also drifts horizontally** (2D window); vertical speed same as Soft. Climb 6. | 6 pegs | Aim + timing | Geometry: 2-axis window |
| 4 | **Fake Bell Midway** | Climb 7; **fake bell audio** at peg 3 (no checkpoint). Real bell on clear only. | 7 pegs | Audio lie | Distrust booth sound |
| 5 | **Double-Tap Pegs** | Window valid only if **two taps** within 280ms while inside zone. Climb 6. | 6 double-taps | New input verb | Cadence law, not thinner zone |
| 6 | **Slip Cascade** | Miss slips **−2**; after each hit zone **shrinks once** then resets next peg. Climb 7. | 7 pegs | Harsher miss + living zone | Event physics on miss/hit |
| 7 | **Reverse Hammer** | Indicator travels **opposite** direction (down→up vs prior up→down). Climb 7. | 7 pegs | Remap timing brain | Control/path invert room |
| 8 | **Fever Bell Run** | Combo: side-sway + fake bell bait + shrink-after-hit; climb 8 to **finale double-bell**. | 8 pegs / finale bells | Full authored tower | Finale layout, not Soft Mallet hard |

**Endless coda:** `highstrikerBandParams` from peg 21+ (shrinkAfterHit, speed climb) — titles `Sky Peg {n}` — only after Tower 8.

### Acceptance feel — High Striker
- Side-Sway and Reverse Hammer are different sports on the tower, not thinner stickers.
- Double-Tap Pegs adds a new verb without “just faster needle.”
- Fake Bell Midway is a yell-about-it cheat — alley DNA.

---

## 4) Bent Ring Pegs (`bentring` · SlingAim)

**Alley joke:** Pegs lean away mid-flight — each board changes *how* they cheat, not just leanDeg++.
**Input:** Drag-aim + power (Ball Toss launcher cousin). 3 rings/board. Stuck ring = success.
**Death:** Exhaust rings before `need` met (`out of rings`).
**Scoring:** +80/stuck · +350 clear. Depth = boards cleared.
**Vestibule cheat line:** “RING A BENT PEG — IF IT STAYS BENT”

### Authored stages (8)

| # | Name | Peg board / lean cheat | Clear beat | Death notes | vs prior |
|---|------|------------------------|------------|-------------|----------|
| 1 | **Soft Lean Tri** | 3 pegs triangle; mild lean after delay; need 2. | 2/3 stuck | Teach throw → watch lean | — |
| 2 | **Cross Lean** | 3 pegs; **each peg leans a different direction** (L/R/back) after delay. Need 3. | All three | Direction roster | Per-peg lean layout |
| 3 | **Late Snap Board** | 4 pegs; **long delay then snap lean** (readable telegraph shudder). Need 3. | 3/4 | Timing of cheat changes | Cadence of lie |
| 4 | **Decoy Peg Alley** | 4 real + **1 decoy peg** (leans off-board / won’t hold). Need 3 on reals. | 3 real sticks | Decoy teachable flash | Fake peg room |
| 5 | **Spin Peg Circus** | 4 pegs on a **slow rotating** plate; lean still fires mid-flight. Need 3. | 3/4 | Rotate + lean | New motion axis |
| 6 | **Hook Only Lane** | 5 pegs; only **hook-shaped tops** hold rings (straight pegs reject — bounce stamp). Need 3 hooks. | 3 hooks | Shape verb | Peg silhouette cheat |
| 7 | **Twin Delay Row** | 5 pegs in two rows; **front row leans early, back row leans late**. Need 4. | 4/5 | Dual timing map | Timing layout, not more leanDeg |
| 8 | **Warp Hook Finale** | Mixed: 2 hooks, 2 straight, 1 decoy; micro-rotate + cross leans + late snap on back peg. Need 4. | 4 valid sticks | Full cheat roster | Finale board, not Soft Lean hard |

**Endless coda:** 5 pegs, leanDeg climb, need 4 — after Board 8; titles `Mean Lean {n}`.

### Acceptance feel — Bent Rings
- Cross Lean / Twin Delay are timing-map rooms — player aims differently per peg.
- Decoy Peg + Hook Only are visible board lies, not “lean a bit more.”
- Spin Peg Circus adds a motion chapter change.

---

## 5) Plinko Pegboard (`plinko` · Custom)

**Alley joke:** Drop timing + board breath — each drop room changes board geometry / lies, not just a higher slot target.
**Input:** Pick top lane (5 drop points) → tap release. 3 chips/stage. Clear if any chip lands slot ≥ target (or meet room-specific clear rule).
**Death:** All chips fail clear rule (`chips exhausted`).
**Scoring:** slotValue×10 · +300 clear. Depth = drops/stages cleared.
**Vestibule cheat line:** “DROP WHEN THE BOARD BREATHES WITH YOU”

### Authored stages (8)

| # | Name | Board / breath layout | Clear beat | Death / cheat | vs prior |
|---|------|----------------------|------------|---------------|----------|
| 1 | **Soft Breath Board** | Even peg grid; low tiltAmp; target slot ≥3; 3 chips. | Land ≥3 | Teach lane + breath | — |
| 2 | **Mid Tide** | Same grid; **mid breath**; target ≥4. | Land ≥4 | Classic breath lesson | Breath amp (bridge OK) |
| 3 | **Funnel Lie** | Center columns form a **visible funnel** that looks like a high-slot highway but **biases outward** at the bottom. Target ≥5. | Beat the funnel | Silhouette cheat | Geometry lie |
| 4 | **Dead Peg Gallery** | Every 3rd row has **absorb/dead pegs** (chip stops → low slot force). Target ≥5. | Avoid dead rows via lane+timing | Dead peg event | Board hazard layout |
| 5 | **Gate Row** | Mid-board **sliding gate** opens/closes on a timer (telegraph). Chip blocked → bounce aside. Target ≥6. | Time drop through open gate | Gate cadence | New moving prop |
| 6 | **Twin Slot Contract** | Must land **two chips** in slots ≥5 (not one hero chip). 3 chips total. | 2 qualifying lands | Dual-success rule | Win condition change |
| 7 | **Mirror Drop** | Drop lane choice is **horizontally mirrored** on release (pick left → falls right). Breath high. Target ≥6. | Remap aim brain | Control lie | Input remap room |
| 8 | **Fever Peg Opera** | Combo: funnel silhouette + dead peg rows + gate + high breath; target ≥7; optional one **golden peg** bounce (+slot nudge). | Land ≥7 | Finale board | Full authored layout |

**Endless coda:** targetSlotMin climb + dead peg rows + high tilt — after Drop 8; titles `Dead Peg Rows {n}`.

### Acceptance feel — Plinko
- Funnel Lie / Gate Row / Dead Peg Gallery are visibly different boards.
- Twin Slot Contract changes the win rule — not “need slot 8 instead of 7.”
- Mirror Drop is a remap room you can feel in one chip.

---

## Acceptance feel rollup (quick QA)

| Game | Feel A | Feel B | Feel C |
|------|--------|--------|--------|
| Mutoscope | Crank required → crank poison flip | Twin Iris / Blink Hood new hood machines | Fake Slam audio lie |
| Catoptromancy | Twin Pane dual glass | Lie Flicker + Hazy Refusal cheats | Burner’s Altar temptation ritual |
| High Striker | Side-Sway 2-axis window | Double-Tap new verb | Fake Bell + Reverse Hammer |
| Bent Rings | Cross Lean / Twin Delay maps | Decoy + Hook shape lies | Spin Peg motion chapter |
| Plinko | Funnel / Gate / Dead Peg boards | Twin Slot win-rule change | Mirror Drop remap |

---

## Aura wire order (B03 authored — after P0 feel breathing)

When P0/B02 authored rooms are on-device and feeling distinct, wire **B03 authored tables** in this order (matches sheet hand-off):

1. **Mutoscope** — Stages 1–8 names + behaviors above; replace pure stillPx climb; coda flag.
2. **High Striker** — Tower chapters 1–8 (window verbs / lies); peg glory retained; bandParams = coda-only after 8.
3. **Catoptromancy** — Rooms 1–8 ritual layouts; waitMs-only climb is coda-only.
4. **Bent Rings** — Boards 1–8 (lean maps / decoy / hooks / spin); leanDeg-only climb = coda.
5. **Plinko** — Drops 1–8 (funnel / gate / dead / twin / mirror); targetSlot-only climb = coda.

**Stop:** Do not treat Batch03 mount `stageParams` titles as the player-facing authored ride — those become coda/fallback.
**Also stop:** Casino / Mirror Crew / real-money copy. Soft oracle pack only.

### Data shape hint (Aura)
```js
// Per game: authored[] then optional coda(n)
const MUTOSCOPE_LEVELS = [
  { id:1, name:"Peep Lesson", kind:"teach", cardsNeeded:4, slamLimit:3 /* ... */ },
  { id:2, name:"Crank Parade", kind:"crankRequired", /* ... */ },
  { id:5, name:"Twin Iris", kind:"dualWindow", /* ... */ },
  { id:8, name:"Flicker Fever", kind:"stutterPoisonCrank", /* ... */ },
];
const HIGHSTRIKER_TOWERS = [
  { id:1, name:"Soft Mallet Lane", kind:"vertical", pegsToClear:5 /* ... */ },
  { id:3, name:"Side-Sway Tower", kind:"axis2d", /* ... */ },
  { id:5, name:"Double-Tap Pegs", kind:"doubleTap", /* ... */ },
  // ...
];
// clear → next authored; after last → if (codaEnabled) endlessParams(n) else souvenirClear
```

### Challenge copy (glory nouns)
- Mutoscope: `Beat my Mutoscope stage {n} on Penny Fever`
- Catoptromancy: `Beat my Catoptromancy room {n} on Penny Fever`
- High Striker: `Beat my High Striker tower {n} on Penny Fever`
- Bent Rings: `Beat my Bent Rings board {n} on Penny Fever`
- Plinko: `Beat my Plinko drop {n} on Penny Fever`

---

## Explicit don’ts
- Same loop + tighter stillPx / thinner zone / higher leanDeg / higher slotMin as the *only* progression
- Casino / real-money / gambling language
- Mirror Crew
- Medical / death / destiny-romance oracle tickets
- Shipping B03 as pure `stageParams` climb while these rooms unauthored
- Rewriting P0/B02 rooms in this file

---

## Room count checklist

| gameId | Authored rooms | Count |
|--------|----------------|------:|
| mutoscope | Peep Lesson → Flicker Fever | 8 |
| catoptromancy | First Gaze → Burner’s Altar | 8 |
| highstriker | Soft Mallet Lane → Fever Bell Run | 8 |
| bentring | Soft Lean Tri → Warp Hook Finale | 8 |
| plinko | Soft Breath Board → Fever Peg Opera | 8 |
| **B03 total** | | **40** |

---

*Goblin ops — B03 authored rooms for Lorie/Aura. Hybrid default. Carnival DNA intact. P0 file untouched.*
