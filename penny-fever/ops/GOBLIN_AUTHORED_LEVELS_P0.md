# Goblin Authored Levels P0 — REAL ROOMS, NOT HARDER LOOPS
# For Aura / Codex. Design only. Do NOT invent more endless vendor batches.
# DNA: walkable carnival alley · tents = depth cabinets · 1 coin = 1 run · family-safe · no casino · no Mirror Crew
# Lorie ask: INTERESTING games with REAL LEVELS (different layouts / beats), not the same loop getting harder.
# Pause endless-loop vendor batch inventing. Author these stages.

---

## 0) North star (CONFIRMED 2026-09-05 — Lorie: authored stages)

**Recommended default (hybrid):**
- Each P0/B02 cabinet ships **5–8 authored stages** with unique names, layouts, and cheat beats.
- After the last authored stage clears → optional **Endless Coda** (parametric climb using leftover stageParams) OR soft **CASHOUT / souvenir** exit.
- Mark clearly in UI: authored chapter names on HUD; coda labeled `ENDLESS` so players know the authored ride ended.

| Mode | What it is | Status |
|------|------------|--------|
| **A · Hybrid (default)** | 5–8 authored rooms → optional endless coda | **CONFIRMED direction — authored first; coda flaggable** |
| B · Authored-only | Hard stop after final named stage (win souvenir) | Alt if she hates endless |
| C · Pure generator | Old stageParams climb forever | **PAUSE** — this is the boring path she rejected |

Lorie confirmed authored stages (Yes 2026-09-05). **Implement authored tables below** as data; gate endless coda behind `codaEnabled:true` so pure authored-stop is one flip.

**Rule for every stage:** if you can describe the change as “same board, smaller numbers,” it is **illegal**. Change geometry, cheat, input cadence, or win condition beat.

---

## Shared run contract (all games below)

- **1 coin = 1 run** until DEATH (or cash-out where noted).
- Result card: `NAME · depth · score · deathReason · Aura line · challenge CTA`
- Vestibule shows best depth unit + barker cheat line (per stage table uses that line on enter / stage banner).
- Depth unit labels: Love=`HEAT STAGE` · Ball Toss=`RACK` · Pusher=`FLOOR` · Pinball=`CHAPTER` · Milk=`PYRAMID` · Cover=`SPOT` · Water=`HEAT`
- Mobile-first · pointer only · no keyboard required · no real-money / gambling copy

---

## 1) Love Heat Run (`love` · HoldBand)

**Alley joke:** The pink band is a liar’s thermometer — each room changes *how* mercury behaves, not just how thin the band is.
**Input:** Hold `#holdBtn` / full-width hold zone. Hold in band to score & clear; release cools.
**Death:** Out-of-band while holding ≥ `outLimitMs` (Stage 1: 1 grace strike). Or never enter band by `entryDeadlineMs`. Or hold poison ghost when marked.
**Scoring:** `+100 × stage` on clear + style `floor(inZoneMs/100)`. Depth = stages cleared.
**Vestibule cheat line:** “HOLD THE PINK — HOW FAR CAN YOU GO?”

### Authored stages (8)

| # | Name | Layout / band behavior | Clear beat | Death / cheat | What changes vs prior |
|---|------|------------------------|------------|---------------|------------------------|
| 1 | **Warm Glass** | Single solid pink band, tall (~22%), slow scroll. Teach hold/release. | Hold in-zone `clearMs` ~1.8s | Grace ×1; then out-of-band kill | — (tutorial room) |
| 2 | **Mercury Tide** | Band scrolls in a sine wave (vertical drift path), still one band. | Same clearMs | No grace; outLimit generous | Motion path is the lesson — not shrink |
| 3 | **Hot Split** | Band **splits mid-clear** into two short bands stacked; either is valid. | Accumulate in either | Holding the gap between = OUT | Split is a room event, not a number |
| 4 | **Twin Mercury** | Two bands always present (upper pink / lower rose). Must alternate: clear requires time in **both** within the stage. | Dual meters fill | Ignoring one band stalls clear → entry-style timeout | Twin = new verb (alternate), not thinner |
| 5 | **Ghost Band** | Solid + 50% ghost twin. Either valid. Ghost drifts opposite direction. | Either band | None poison yet — visual stress | Ghost room introduces decoy vocabulary |
| 6 | **Liar’s Flash** | Single band; every ~2.5s a **decoy flash** appears ±12% away for 400ms (not solid). | Solid only | Holding decoy = OUT | Lie cadence is the beat change |
| 7 | **Poison Twin** | Solid + ghost; **ghost is poison** (hold ≥400ms on ghost = death reason `ghost band lied`) | Solid only | Ghost kills | Inverts Stage 5 rule — same props, opposite law |
| 8 | **Fever Break Room** | Band shrinks *during* hold (active shrink while in-zone); brief teleport every 3s. Optional coda unlock. | Survive shrink+teleports for clearMs | Tight outLimit | Behavior change: living shrink, not static thin |

**Endless coda (if Hybrid on):** resume parametric `loveStageParams` from n=9 with titles `Inferno Edge {n}` — flaggable off.

### Acceptance feel — Love
- Stage 4 (Twin Mercury) makes you *switch* bands — not just squeeze harder.
- Stage 5→7 teaches then punishes the ghost — player can name the law change.
- Stage 8 feels like a different machine (shrink-while-holding), not Warm Glass on hard.

---

## 2) Barely-Fit Ball Toss (`balltoss` · SlingAim)

**Alley joke:** Holes that barely fit; boards that lie.
**Input:** Drag-aim + pull power; release throws. No auto-aim.
**Death:** 3 misses in current rack (misses reset on clear). Spit (too-fast sink) counts as miss.
**Scoring:** +100/hole · +500 rack · +50×stage · combo ×1.1 (cap ×2). Depth = racks cleared.
**Vestibule cheat line:** “STEP RIGHT UP — HOLES THAT BARELY FIT — HOW MANY RACKS?”

### Authored stages (8)

| # | Name | Hole rack / layout | Cheat / beat | Death notes | vs prior |
|---|------|--------------------|--------------|-------------|----------|
| 1 | **Three Honest Circles** | 3 round holes, scale 1.0, static triangle. | Teach sling + sink speed | 3 misses | — |
| 2 | **Barely Fit Tri** | Same 3 holes, scale 0.90; spit threshold stricter. | Classic barely-fit | Same | Fit, not count |
| 3 | **Sway Board** | 4 holes in diamond; board **slow horizontal sway**. | Timing throw to moving target | Same | Motion layout |
| 4 | **Oval Liar** | 4 holes; **one oval** (hardest) marked slightly; oval needs center-line aim. | Oval is the star cheat | Same | Shape cheat |
| 5 | **Crowded Five** | 5 holes tight cluster center; edges of board dead space. | Cluster collision / bounce chaos | Same | Spacing layout |
| 6 | **Spin Rack** | 5 holes on a **slowly rotating** board (±12°). | Rotate + scale 0.76 | Same | New axis of motion |
| 7 | **Decoy Dent Alley** | 5 real + **1 decoy dent** (looks like hole, isn’t — bounce stamp). | Decoy teachable flash on hit | Same | Fake hole room |
| 8 | **Warp Keyhole** | Mixed: 2 round, 1 oval, 1 keyhole (tall thin), 1 tiny; micro sway + micro rotate. | Keyhole = new shape verb | Same | Shape roster, not just smaller |

**Endless coda:** holes 5, scale floor 0.55, sway+rotate, odd stages add decoy — only after Stage 8.

### Acceptance feel — Ball Toss
- Oval Liar and Warp Keyhole are *shape* rooms — player aims differently.
- Sway → Spin is a motion chapter change, not “faster same board.”
- Decoy Dent makes you distrust the plywood — alley DNA.

---

## 3) Coin Pusher Shelf (`coinpusher` · GreedFloor)

**Alley joke:** Greed vs getting buried. Cash-out is the emotion.
**Input:** Tap lane / DROP; between settles: **CASH OUT** vs **DROP AGAIN** (both loud).
**Death:** Floor ≥2: push wipes shelf + tray gain 0 → buried. (Floor 1 teaches.) Cash-out = souvenir, not death.
**Scoring:** banked ×10 · +200/floor · +15% cash-out if Floor ≥5. Depth = floors survived.
**Vestibule cheat line:** “GREED IS THE GAME — CASH OUT OR GO DEEPER”

### Authored stages (7) — shelf geometry changes

| # | Name | Shelf / pit geometry | Greed pressure | Death / beat | vs prior |
|---|------|----------------------|----------------|--------------|----------|
| 1 | **Glass Nursery** | Wide shelf, narrow pit, slow pusher. 3 lanes. | Soft bankTarget ~8 | No buried death; teach DROP→push→tray | — |
| 2 | **Split Shelf** | Shelf has a **center seam** (two ledges); coins can fall into seam pit. | BankTarget ~12 | Buried on wipe+0 tray | Geometry: seam pit |
| 3 | **Overhang Tease** | Deep overhang lip; coins stack visually past safe edge. | Near-falls telegraph | Same death | Lip shape / tease |
| 4 | **Double Sweep** | Pusher does **two short pushes** per cycle (double-sweep). | Faster decision cadence | Same | Cadence, not just speed |
| 5 | **Pit Mouth** | Pit widens into a **V-mouth** under center lane; side lanes safer. | Lane choice matters | Avalanche chance after drop | Pit silhouette change |
| 6 | **Trapdoor Floor** | Random lane gets a **trapdoor drop** once per floor (telegraph shudder). | Cash-out scream | Trapdoor can bury | Event geometry |
| 7 | **Avalanche Gallery** | Tall stacks allowed; after drop, **avalanche** chance high; shelf has back wall kickers. | Max greed dilemma | Buried common | Physics room + greed peak |

**Endless coda:** bankTarget +4/floor, pit widen, avalanche on — after Floor 7.

### Acceptance feel — Pusher
- Split Shelf / Pit Mouth change *where* coins die — readable new shelf.
- Double Sweep changes rhythm of the greed choice.
- Trapdoor Floor is a distinct scare beat, not “faster pusher.”

---

## 4) Pinball Alley (`pinball` · Custom)

**Alley joke:** One ball, how deep is the chapter? **Chapters change TABLE layout**, not just ball speed on same walls.
**Input:** Left half = L flipper; right half = R; multitouch both. 1 ball / coin.
**Death:** Drain (outlanes) = immediate death. No 3-ball credit on Depth-run.
**Scoring:** bumper/spinner points · +1000×chapter on clear · +50/10s alive. Depth = chapters cleared.
**Vestibule cheat line:** “ONE BALL — HOW MANY CHAPTERS?”

### Authored stages (8) — distinct table layouts

| # | Name | Table layout (new props) | Mission to clear | Danger | vs prior |
|---|------|--------------------------|------------------|--------|----------|
| 1 | **Plunger Parade** | Classic: 2 flippers, 3 bumpers triangle, gentle outlanes. | Hit each bumper once | Soft drains | — |
| 2 | **Spinner Alley** | Add **center spinner lane** + 2 slingshots; bumpers move to sides. | 3 spinner ticks | Slightly wider outlanes | New lane geometry |
| 3 | **Sinkhole Circus** | Center **sink hole**; bumpers form a ring around it. | Sink ×2 | Outlane magnets mild | Sink is the star |
| 4 | **Ramp Carnival** | Left **wire ramp** to upper playfield shelf with 1 bumper; lower 2 bumpers. | Shoot ramp + sink once | Upper drain if miss return lane | Vertical layout change |
| 5 | **Bumper Storm** | 5 bumpers dense mid; no ramp; tight inlanes. | Bumper combo ×5 | Chaotic bounce → outlane | Density room |
| 6 | **Twin Flip Gate** | Add **upper mini-flipper** (auto or tap-both to pulse); gate opens to bonus lane. | Open gate + 2 bonus lane hits | Missed gate = dead end bounce | New control surface |
| 7 | **Outlane Thorns** | Standard mid toys but **thorn posts** beside outlanes; post bounce can save or doom. | Alternating: spinner then sink | Thorn posts | Save/doom geometry |
| 8 | **Backglass Fever** | Combo table: ramp + spinner + sink + 4 bumpers; brief **multiball-off** (still 1 ball) but lit rollovers rearrange. | Ramp → spinner → sink chain | Drunk-feeling lane priority | Full authored finale layout |

**Endless coda:** speed mult climb (cap ~1.7) on a **rotated mission list** using Ch8 toy set — not new mesh required; only after Ch8.

### Acceptance feel — Pinball
- Ramp Carnival literally adds a second floor — reads as a new table.
- Bumper Storm vs Spinner Alley are different sports on the glass.
- Twin Flip Gate introduces a new verb without “just faster ball.”

---

## 5) Weighted Milk Bottles (`milk` · share SlingAim launcher)

**Alley joke:** Bottom row is concrete; top flies.
**Input:** Drag-aim + power (Ball Toss launcher). 3 throws per pyramid.
**Death:** Fail to clear all bottles in 3 throws.
**Scoring:** +50/bottle · +400 clear · +80×stage. Depth = pyramids cleared.
**Vestibule cheat line:** “KNOCK ’EM ALL — THE BOTTOM ONES FIGHT BACK”

### Authored stages (7)

| # | Name | Pyramid / bottle cheat | Beat | vs prior |
|---|------|------------------------|------|----------|
| 1 | **Fairground Six** | Classic 3–2–1; bottom mass 2.0; wide pins. | Teach aim to base | — |
| 2 | **Heavy Heels** | Same pyramid; bottom mass 2.6; tops light. | Classic weight cheat | Mass, not count |
| 3 | **Wide Shoulders** | 4–3–2–1 (10 bottles) wider base; mid mass bumped. | More pins, new silhouette | Layout count |
| 4 | **Glue Corner** | 3–2–1; **one bottom corner glued** (needs 2 hits). | Planned second shot | Sticky cheat |
| 5 | **Split Stack** | Two mini pyramids side-by-side (3+3); must clear both. | Dual targets | Two boards |
| 6 | **Wind Shelf** | Classic 6; **lateral wind drift** on ball; tight pins. | Compensate aim | Wind room |
| 7 | **Stuck Pin Atelier** | Tight 3–2–1; **random stuck bottle** each attempt (telegraph darker); bottom mass 3.2. | Scout then strike | Random sticky + mass |

**Endless coda:** mass climb + stuck bottle — after Pyramid 7.

### Acceptance feel — Milk
- Split Stack is a different stall setup, not heavier bottoms alone.
- Glue Corner forces a two-hit plan — new beat.
- Wide Shoulders reads as a new pyramid shape from the tent mouth.

---

## 6) Cover-the-Spot Cruel (`coverspot`)

**Alley joke:** Spot bigger than any one disc; geometry refuses perfection.
**Input:** Tap-drop discs; coverage % meter. Clear stage by hitting `targetPct` within `maxDiscs`, or bust.
**Death:** Fail target within maxDiscs. (Optional between-stage cash-out banks score.)
**Scoring:** floor(coverage×100) + 200×stage. Depth = spots cleared.
**Vestibule cheat line:** “COVER THE SPOT — OR GET GREEDY”

### Authored stages (7)

| # | Name | Spot shape / disc rules | Target beat | vs prior |
|---|------|-------------------------|-------------|----------|
| 1 | **Red Circle Honest** | Round spot; r/R=0.72; target 70%; max 4. | Learn union coverage | — |
| 2 | **Tight Felt** | Same circle; r/R=0.68; target 75%. | Classic cheat tighten | Ratio only OK here as bridge |
| 3 | **Oval Blush** | **Oval spot** (1.3× wide); discs still round. | Shape mismatch | Spot shape change |
| 4 | **Drifting Dot** | Round spot **slow drifts** on felt; discs stick in world space. | Lead the spot | Motion |
| 5 | **Twin Spots** | **Two small circles**; must cover both to ≥target average. | Split attention | Dual targets |
| 6 | **Ring Spot** | Annulus (donut); center hole doesn’t count; discs waste if centered. | Cover the ring | Topology cheat |
| 7 | **Jitter Stamp** | Irregular blob spot + jitter; maxDiscs 6; target 85%. | Finale geometry | Blob + nerves |

**Endless coda:** smaller r/R, higher targetPct, jitter — after Spot 7.

### Acceptance feel — Cover
- Oval / Ring / Twin are visibly different felt puzzles.
- Drifting Dot changes timing, not just %.
- Ring Spot makes “perfect center drop” a trap — alley laugh.

---

## 7) Water Gun Duel (`watergun`)

**Alley joke:** Clown mouths dodge; ghost lane races you.
**Input:** Hold spray; aim/drag to keep stream on mouth. 1P vs ghost v1.
**Death:** Ghost fills first OR your hit-time stalls ≥ stallLimitMs while ghost advances.
**Scoring:** +300/heat · leftover fill edge. Depth = heats won.
**Vestibule cheat line:** “FILL IT FIRST — DON’T MISS THE MOUTH”

### Authored stages (7) — duel maps

| # | Name | Duel map / mouth path | Ghost / cheat | vs prior |
|---|------|----------------------|---------------|----------|
| 1 | **Lane Lesson** | Straight horizontal wander; big hitbox; ghost slow. | Teach hold-on-mouth | — |
| 2 | **Sine Smile** | Mouth follows **sine wave**; big hitbox. | Ghost 0.7 rate | Path shape |
| 3 | **Feint Clown** | Mouth **feints** (quick fake dodge) every few secs. | Mid hitbox | Feint beat |
| 4 | **Twin Mouth Map** | **Two mouths** alternate active (only active credits fill). | Ghost matches map | Dual targets |
| 5 | **Zigzag Duel** | Diagonal zigzag path; smaller hitbox; yourRate 0.95. | Ghost ~even | Path + pressure |
| 6 | **Fake-Open Fair** | Mouth sometimes **fake-open** (20% — no credit, toast). | Ghost pressure high | Lie beat |
| 7 | **Mirror Lane** | Your aim mirrored horizontally (stream flips); mouth on sine+feint. | Finale confusion map | Control remap room |

**Endless coda:** speed/hitbox/ghostRate climb + fake-open — after Heat 7.

### Acceptance feel — Water
- Twin Mouth and Mirror Lane are different duel sports.
- Feint / Fake-Open are readable cheats you can yell about.
- Zigzag is a map, not “ghost slightly faster.”

---

## Acceptance feel rollup (quick QA)

| Game | Feel A | Feel B | Feel C |
|------|--------|--------|--------|
| Love | Twin Mercury forces alternation | Ghost→Poison flips the law | Fever Break shrinks while holding |
| Ball Toss | Oval / Keyhole reshape aim | Sway→Spin new motion | Decoy dent = plywood lie |
| Pusher | Seam / V-mouth new pits | Double sweep new rhythm | Trapdoor = event scare |
| Pinball | Ramp = second floor | Spinner vs Storm different toys | Twin Flip Gate new verb |
| Milk | Split Stack dual pyramids | Glue Corner two-hit plan | Wide Shoulders new silhouette |
| Cover | Oval / Ring / Twin shapes | Drift timing room | Ring traps center drops |
| Water | Twin / Mirror maps | Feint + fake-open cheats | Zigzag path readable |

---

## Aura wire order (AFTER P0 polish — do not order B05+)

Polish checklist lives in `GOBLIN_P0_POLISH_PASS.md`. When feel bugs for Love/Ball/Pusher/Pinball are breathing, wire **authored stage tables** in this order:

1. **Love** — replace pure `loveStageParams` climb with Stages 1–8 names + behaviors above; coda flag.
2. **Ball Toss** — rack layouts 1–8 (shapes/motion/decoy); coda after 8.
3. **Coin Pusher** — shelf geometry floors 1–7; keep cash-out dilemma loud.
4. **Pinball** — **table layout chapters** 1–8 (new props per chapter); speed-only climb is coda-only.
5. **Milk** — pyramid layouts 1–7 (shares launcher).
6. **Water Gun** — duel maps 1–7.
7. **Cover-the-Spot** — spot shapes 1–7.

**Stop:** Do not pull B05+ mounts / new vendor invent loops until these rooms feel distinct on device.
**Also stop:** Endless parametric-only stage generators as the default player-facing path.

### Data shape hint (Aura)
```js
// Per game: authored[] then optional coda(n)
const LOVE_LEVELS = [
  { id:1, name:"Warm Glass", kind:"solid", bandH:22, /* ... */ },
  { id:4, name:"Twin Mercury", kind:"twinAlternate", /* ... */ },
  { id:7, name:"Poison Twin", kind:"ghostPoison", /* ... */ },
  // ...
];
// clear → next authored; after last → if (codaEnabled) endlessParams(n) else souvenirClear
```

### Challenge copy (unchanged glory nouns)
- Love: `Beat my Love Heat Stage {n} on Penny Fever`
- Ball Toss: `Beat my Ball Toss rack {n} on Penny Fever`
- Pusher: `Beat my Coin Pusher floor {n} on Penny Fever`
- Pinball: `Beat my Pinball chapter {n} on Penny Fever`
- Milk: `Beat my Milk Bottles pyramid {n} on Penny Fever`
- Cover: `Beat my Cover-the-Spot stage {n} on Penny Fever`
- Water: `Beat my Water Gun heat {n} on Penny Fever`

---

## Explicit don’ts
- Same loop + smaller band / faster ball / tinier holes as the *only* progression
- Casino / real-money / gambling language
- Mirror Crew
- New vendor batch inventing while these rooms unshipped
- Ordering B05+ wire work ahead of this levels pass

---

*Goblin ops — authored rooms for Lorie/Aura. Hybrid default pending her pick. Carnival DNA intact.*
