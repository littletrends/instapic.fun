# Goblin Authored Levels B04 — REAL ROOMS, NOT HARDER LOOPS
# For Aura / Codex. Design only. Fairy Floss · Popcorn · Duck Pond · Skee-Ball · Penny Pitch · Dunk Tank
# DNA: walkable carnival alley · tents = depth cabinets · 1 coin = 1 run · family-safe · no casino · no Mirror Crew
# Lorie ask: INTERESTING games with REAL LEVELS (different layouts / beats), not the same loop getting harder.
# P0/B02 rooms live in GOBLIN_AUTHORED_LEVELS_P0.md — DO NOT rewrite those here.
# B03 rooms live in GOBLIN_AUTHORED_LEVELS_B03.md — DO NOT rewrite those here.
# Engines live on Mother (Batch04 mounts). This file authors the stage tables Aura wires next.

---

## 0) North star (same hybrid lock as P0 / B03)

**Recommended default (hybrid):**
- Each B04 cabinet ships **6–8 authored stages** with unique names, layouts, and cheat beats.
- After the last authored stage clears → optional **Endless Coda** (`codaEnabled:true`) OR soft **CASHOUT / souvenir** exit.
- HUD shows authored chapter names; coda labeled `ENDLESS` so players know the authored ride ended.

| Mode | What it is | Status |
|------|------------|--------|
| **A · Hybrid (default)** | 6–8 authored rooms → optional endless coda | **CONFIRMED — authored first; coda flaggable** |
| B · Authored-only | Hard stop after final named stage | Alt if she hates endless |
| C · Pure generator | Old stageParams climb forever | **PAUSE** — boring path she rejected |

**Rule for every stage:** if you can describe the change as “same board, smaller numbers,” it is **illegal**. Change geometry, cheat, input cadence, or win condition beat.

Live parametric tables in `GOBLIN_BATCH04_MOUNT_CONFIGS.md` become **coda / fallback** only after these authored rooms ship.

---

## Shared run contract (B04)

- **1 coin = 1 run** until DEATH (or cash-out where noted).
- Result card: `NAME · depth · score · deathReason · Aura line · challenge CTA`
- Vestibule shows best depth unit + barker cheat line (stage banner uses room name on enter).
- Depth unit labels: Fairy Floss=`STAGE` · Popcorn=`BATCH` · Duck Pond=`POND` · Skee-Ball=`LANE` · Penny Pitch=`CLOTH` · Dunk=`SEAT`
- Mobile-first · pointer only · no keyboard required · no real-money / gambling copy
- Soft pack VO only; Dunk stays playful splash — never mean-spirited humiliation

---

## 1) Fairy Floss Wheel (`fairyfloss` · HoldBand tension)

**Alley joke:** Sugar web snaps if you rush — each room changes *how* the cloud lies, not just a thinner tension band.
**Input:** Hold-drag winds floss onto cone; pull rate must stay in sweet band. Too slow = sag (no metre gain); too fast = SNAP strike.
**Death:** Snap count hits `snapLimit` this stage (`snap`). Stage 1 forgiving (3 snaps).
**Scoring:** +20 per 0.1m wound in band · +250 stage clear. Depth = stages cleared.
**Vestibule cheat line:** “WIND IT TALL — DON’T SNAP THE CLOUD”

### Authored stages (8)

| # | Name | Layout / wind behavior | Clear beat | Death / cheat | What changes vs prior |
|---|------|------------------------|------------|---------------|------------------------|
| 1 | **Soft Cloud** | Single sweet band, wide; slow tub; tall snapLimit 3. | Wind 3m | Teach wind → band → metres | — (tutorial room) |
| 2 | **Twin Strand** | Cone winds **two strands**; metres only tick when **both** tension needles sit in band (shared hold). | 4m dual | Moving either strand out = snap risk | Dual-needle geometry |
| 3 | **Gust Stall** | Mid-wind **gust event** every ~2.5s (telegraph puff); band jumps ±12% for 500ms — ride it or snap. | 5m | Gust is the beat | Timed event, not thinner band |
| 4 | **Reverse Wind** | Drag direction **inverts** (pull “down” to wind up) after toast: REVERSE. Band still valid. | 5m | Remap muscle memory | Control invert room |
| 5 | **Fake Snap Tent** | Audio **fake snap** thrice/stage — ignore for strike; real overspeed still kills. | 6m | Teach distrust of booth audio | Lie beat (audio decoy) |
| 6 | **Sag Trap Shelf** | Too-slow sag now **eats metres** (rewind) instead of only stalling; short “catch-up” window after sag. | 6m net | Sag becomes active hazard | Physics law change |
| 7 | **Pulse Tub** | Tub **pulses RPM** in a readable sine (fast→slow→fast); band width mid but living with pulse. | 7m | Sync wind to pulse | Cadence room, not static thin |
| 8 | **Fever Sugar Opera** | Combo: twin strand + one gust + one fake snap + brief reverse pulse mid-clear. Optional coda unlock. | 7m through gauntlet | Full authored cloud | Finale layout, not Soft Cloud hard |

**Endless coda (if Hybrid on):** resume parametric `fairyflossStageParams` from n=9 with titles `Sugar Edge {n}` (band shrink + tubRpm climb) — flaggable off.

### Acceptance feel — Fairy Floss
- Twin Strand / Reverse Wind are different wind machines, not thinner stickers.
- Gust Stall and Fake Snap Tent are yell-about-it cheats — alley DNA.
- Sag Trap Shelf changes the fail physics (rewind), not just snapLimit--.

---

## 2) Popcorn Kettle (`popcorn` · TimingTap)

**Alley joke:** Only true pops count; kettle lies with steam — each batch changes *how* the kettle lies, not just a tighter hit window.
**Input:** Tap exactly on pop events (audio+visual). Miss / early / late = kernel burn strike.
**Death:** 3 burns (`burn` / `fake_tap`). Clear = catch `need` true pops.
**Scoring:** +15 per catch · +300 clear. Depth = batches/stages cleared.
**Vestibule cheat line:** “TAP THE POP — IGNORE THE STEAM”

### Authored stages (8)

| # | Name | Kettle / pop layout | Clear beat | Death / cheat | What changes vs prior |
|---|------|---------------------|------------|---------------|------------------------|
| 1 | **Honest Kernels** | Steady pop gap ~700ms; generous hitMs; no fakes. | Catch 8 | Teach tap-on-pop | — |
| 2 | **Double Burst** | Every 3rd event is a **double pop** (two taps within 280ms). Singles still count. | 10 catches (doubles = 2) | New cadence verb | Burst law, not tighter hitMs alone |
| 3 | **Steam Gallery** | Fake steam puffs start (no score); tap fake = burn. True pops marked with kernel flash. | 12 true | Steam lie enters | Decoy vocabulary |
| 4 | **Silent Pop Lane** | Half the true pops are **visual-only** (no audio tick); steam still noisy. | 12 true | Trust eyes over ears | Sensory remap |
| 5 | **Lid Bounce** | Mid-batch **lid clack** (telegraph) freezes schedule 600ms then dumps **3 rapid pops**. | 14 true | Freeze→rush beat | Event physics |
| 6 | **Colour Call Kettle** | Pops tint yellow/red; posted call colour only scores; wrong-colour true pop = soft burn. | 10 call-colour | Colour filter | Win filter change |
| 7 | **Mirror Tap** | Tap zone is **horizontally mirrored** for one stretch (toast: MIRROR); pops still left/right visual. | 14 true | Remap aim brain | Input remap room |
| 8 | **Fever Kernel Opera** | Combo: steam fakes + silent pops + one lid bounce + one double-burst finale. | 16 true through gauntlet | Full authored kettle | Finale, not Honest Kernels hard |

**Endless coda:** parametric need / hitMs / fakeChance climb — after Batch 8; titles `Steam Lie {n}`.

### Acceptance feel — Popcorn
- Double Burst and Lid Bounce change cadence without “just smaller hitMs.”
- Silent Pop / Steam Gallery are readable kettle lies.
- Colour Call and Mirror Tap change filter / input map — not hotter numbers.

---

## 3) Duck Pond Hook (`duckpond` · HookCatch)

**Alley joke:** Only certain colours score — each pond changes *how* ducks cheat, not just faster water + smaller hook.
**Input:** Tap-drag hook to catch ducks floating past. Wrong colour / bad catch = strike.
**Death:** Wrong-catch limit (`wrong_duck`). Clear when `need` correct ducks caught.
**Scoring:** +40 correct · +280 clear. Depth = ponds/stages cleared.
**Vestibule cheat line:** “HOOK THE CALL — NOT EVERY DUCK IS LUCKY”

### Authored stages (8)

| # | Name | Pond / duck layout | Clear beat | Death / cheat | What changes vs prior |
|---|------|--------------------|------------|---------------|------------------------|
| 1 | **Yellow Nursery** | Single lane L→R; yellow only; big hook; need 5. | 5 yellow | Teach hook + release | — |
| 2 | **Cross Current** | Ducks on **two lanes** opposite directions; still yellow-only. Need 6. | 6 yellow | Dual-path aim | Layout: two currents |
| 3 | **Painted Decoy** | Yellow + **decoy ducks** with yellow *hats* but blue bodies (flash on wrong hook). Need 6 true yellow. | 6 true | Decoy silhouette | Fake-duck room |
| 4 | **Diving Shelf** | Call yellow; some yellows **dive under** mid-path (unhookable 0.8s) then surface. Need 7. | 7 surfaced yellow | Dive timing | Event behavior |
| 5 | **Twin Call** | Posted call **yellow AND blue** alternating every catch (toast updates). Need 8. | 8 on-call | Alternating filter | Win-condition cadence |
| 6 | **Whirlpool Ring** | Pond is a **slow circle**; hook must lead the curve. Call blue. Need 7. | 7 blue on ring | Path geometry | Motion layout change |
| 7 | **Hook Mirror** | Drag mirror: pull left → hook goes right. Call red. Need 8. | 8 red remapped | Control lie | Input remap |
| 8 | **Fever Duck Opera** | Combo: cross current + decoys + one dive wave + twin-call finale stretch. Need 10. | 10 valid through gauntlet | Full authored pond | Finale, not Yellow Nursery hard |

**Endless coda:** rotating call + speed climb + small hook — after Pond 8; titles `Lucky Lie {n}`.

### Acceptance feel — Duck Pond
- Cross Current / Whirlpool Ring are different ponds, not faster stickers.
- Painted Decoy + Diving Shelf are yell-about-it cheats.
- Twin Call / Hook Mirror change filter and controls — illegal “same board hotter” avoided.

---

## 4) Skee-Ball Alley (`skee` · TimingPower lob)

**Alley joke:** Rings shrink and lane wax lies — each lane chapter changes *how* the board cheats, not just a higher point target.
**Input:** Timing power bar (Ball Toss power cousin) → lob ball up lane into rings (10/20/30/50).
**Death:** Under target after allotted balls (`under_target`). Classic 9 balls unless room says otherwise.
**Scoring:** Face ring value · +200 lane clear. Depth = lanes/stages cleared; also track best single-lane points for glory.
**Vestibule cheat line:** “ROLL UP — BEAT THE BOARD”

### Authored stages (8)

| # | Name | Lane / ring layout | Clear beat | Death / cheat | What changes vs prior |
|---|------|--------------------|------------|---------------|------------------------|
| 1 | **Soft Boardwalk** | Full rings scale 1.0; target 100; 9 balls; no wax. | ≥100 | Teach power → arc → ring | — |
| 2 | **Gutter Whisper** | Same rings; **outlane gutters** slightly magnetized (soft pull). Target 120. | ≥120 | Gutter geometry | Lane silhouette change |
| 3 | **Wax Sheen** | Readable **wax sheen** mid-lane; first ball after sheen **skids long**. Target 140. | ≥140 | Friction event | Cheat cadence (wax) |
| 4 | **Split Ring Gate** | Center 50 ring **splits into two 30s** side-by-side (no 50). Target 160. | ≥160 | Ring roster change | Geometry of scoring holes |
| 5 | **Bank Shot Alley** | Left **bank rail** active — bounce off rail into rings for bonus stamp. Target 180 **or** 2 bank stamps. | Score **or** bank contract | Alternate win path | Win-condition fork |
| 6 | **Reverse Power** | Power bar fills **opposite** (release early = long lob). Target 180. | ≥180 remapped | Control invert | Input law change |
| 7 | **Moving Fifty** | 50 ring **orbits slowly** on a short arc; 10/20/30 static. Target 200. | ≥200 | Moving high-value hole | Prop motion room |
| 8 | **Fever Lane Opera** | Combo: wax sheen + gutter pull + moving fifty finale; 9 balls; target 220. | ≥220 through gauntlet | Full authored lane | Finale, not Soft Boardwalk hard |

**Endless coda:** target climb + ringScale shrink + wax on — after Lane 8; titles `Wax Lie {n}`.

### Acceptance feel — Skee-Ball
- Split Ring Gate / Moving Fifty are different boards, not “need 40 more points.”
- Bank Shot Alley adds a real alternate clear verb.
- Reverse Power + Wax Sheen are remap / cheat rooms you can yell about.

---

## 5) Penny Pitch Cloth (`pennypitch` · DropAim)

**Alley joke:** Cloth jerks when you’re mid-throw — each cloth changes *how* the fabric cheats, not just smaller squares + higher needPts.
**Input:** Aim + tap-drop pennies onto coloured value squares. Clear = earn `need` points in allotted pennies.
**Death:** Fail need within pennies (`short_points`). Default 5 pennies unless room says otherwise.
**Scoring:** Face value · +250 clear. Depth = cloths/stages cleared.
**Vestibule cheat line:** “LAND A COLOUR — CLOTH HAS OPINIONS”

### Authored stages (8)

| # | Name | Cloth / square layout | Clear beat | Death / cheat | What changes vs prior |
|---|------|----------------------|------------|---------------|------------------------|
| 1 | **Honest Quilt** | Big squares; no jerk; need 30; 5 pennies. | ≥30 | Teach aim → drop → value | — |
| 2 | **Soft Jerk** | Rare **post-release jerk** (telegraph shudder). Need 40. | ≥40 | Cloth opinion enters | Event cheat |
| 3 | **Diamond Grid** | Squares rotate to **diamond** orientation (45°); values same. Need 45. | ≥45 | Shape layout | Geometry, not shrink-only |
| 4 | **Dead Felt** | One square is **dead felt** (looks high-value, scores 0 — flash on land). Need 50 on live squares. | ≥50 live | Decoy square | Fake-value room |
| 5 | **Twin Drop** | Must land **two pennies** on the same colour family (posted). Need colour-pair **or** 55 pts. | Pair **or** pts | Alternate win rule | Win-condition fork |
| 6 | **Ripple Cloth** | Continuous **slow ripple** (wave warp) under aim; jerk still rare. Need 55. | ≥55 on living cloth | Motion layout | Ongoing geometry |
| 7 | **Mirror Pitch** | Aim reticle **mirrored** horizontally on release. Need 60. | ≥60 remapped | Control lie | Input remap |
| 8 | **Fever Cloth Opera** | Combo: diamond + dead felt + ripple + one hard jerk mid-set; 5 pennies; need 70. | ≥70 through gauntlet | Full authored cloth | Finale, not Honest Quilt hard |

**Endless coda:** needPts climb + smaller squares + often jerk — after Cloth 8; titles `Mood Swing {n}`.

### Acceptance feel — Penny Pitch
- Diamond Grid / Ripple Cloth are visibly different cloths.
- Dead Felt + Soft Jerk are alley lies you can name.
- Twin Drop / Mirror Pitch change win rule and aim map — not “needPts++ only.”

---

## 6) Dunk the Barker (`dunk` · SlingAim plate)

**Alley joke:** Target plate shrinks and swings — each **seat** changes *how* the plate cheats, not just smaller hitRadius. Dunk is checkpoint emotion; run continues.
**Input:** Aim + power throw at plate (Ball Toss cousin). Hit = dunk cinematic + depth++; miss streak kills.
**Death:** Miss all balls this seat (`miss_seat`). Default 3 balls/seat.
**Scoring:** +400 dunk · depth = dunks/seats cleared. Keep dunk VO playful / cute — never mean.
**Vestibule cheat line:** “SOAK THE CROWN — HOW MANY SEATS?”

### Authored stages (8) — seats

| # | Name | Plate / seat layout | Clear beat | Death / cheat | What changes vs prior |
|---|------|---------------------|------------|---------------|------------------------|
| 1 | **Soft Splash Seat** | Large plate, slow sway; 3 balls. | Hit once | Teach lob → dunk fanfare | — |
| 2 | **Side-Sway Seat** | Plate **orbits horizontally** on a short rail (not just rotate). | Hit once | 2-axis aim | Geometry path change |
| 3 | **Fake Splash** | Mid-seat **fake dunk audio/VFX** on near-miss — no depth; real hit still needed. | Real hit | Audio/VFX lie | Distrust booth |
| 4 | **Twin Plate** | **Two plates** (left/right); either dunks; wrong-side wall is dead bounce. | Hit either | Dual target map | Layout: two plates |
| 5 | **Double-Tap Plate** | Valid hit only if **two throws land** within the seat (first arms plate, second dunks). 4 balls. | Arm + dunk | Two-step clear | Win-condition change |
| 6 | **Shield Barker** | Rotating **soft shield paddle** briefly covers plate (telegraph). | Hit while open | Timed gate | Moving prop cheat |
| 7 | **Reverse Lob** | Power bar invert (early release = long). Plate mid sway. | Hit remapped | Control invert | Input law room |
| 8 | **Fever Dunk Opera** | Combo: side-sway + shield paddle + one fake splash bait; 3 balls; finale double-splash VFX on hit. | Hit through gauntlet | Full authored seat | Finale, not Soft Splash hard |

**Endless coda:** plateScale / swing / hitRadius climb — after Seat 8; titles `Nastier Seat {n}` — still playful dunk lines.

### Acceptance feel — Dunk
- Twin Plate / Side-Sway are different seats, not stickers.
- Double-Tap Plate changes the clear verb without “just smaller plate.”
- Fake Splash + Shield Barker are yell-about-it cheats; VO stays cute.

---

## Acceptance feel rollup (quick QA)

| Game | Feel A | Feel B | Feel C |
|------|--------|--------|--------|
| Fairy Floss | Twin Strand dual needle | Gust / Fake Snap cheats | Reverse Wind + Sag Trap law |
| Popcorn | Double Burst / Lid Bounce cadence | Silent Pop + Steam lies | Colour Call + Mirror Tap |
| Duck Pond | Cross Current / Whirlpool layouts | Painted Decoy + Diving Shelf | Twin Call + Hook Mirror |
| Skee-Ball | Split Ring / Moving Fifty boards | Bank Shot win fork | Reverse Power + Wax Sheen |
| Penny Pitch | Diamond / Ripple cloths | Dead Felt + Soft Jerk | Twin Drop + Mirror Pitch |
| Dunk | Twin Plate / Side-Sway seats | Double-Tap clear verb | Fake Splash + Shield paddle |

---

## Aura wire order (B04 authored — after B03 feel breathing)

When B03 authored rooms are on-device and feeling distinct, wire **B04 authored tables** in this order (matches sheet hand-off):

1. **Fairy Floss** — Stages 1–8 names + behaviors above; replace pure bandWidth/metres climb; coda flag.
2. **Popcorn** — Batches 1–8 (burst / steam / silent / lid / colour / mirror); hitMs-only climb = coda-only.
3. **Duck Pond** — Ponds 1–8 (currents / decoy / dive / twin call / whirl / mirror); speed-only climb = coda.
4. **Skee-Ball** — Lanes 1–8 (gutter / wax / split / bank / reverse / moving fifty); target-only climb = coda.
5. **Penny Pitch** — Cloths 1–8 (jerk / diamond / dead / twin / ripple / mirror); needPts-only climb = coda.
6. **Dunk** — Seats 1–8 (sway / fake / twin / double-tap / shield / reverse); scale-only climb = coda.

**Stop:** Do not treat Batch04 mount `stageParams` titles as the player-facing authored ride — those become coda/fallback.
**Also stop:** Casino / Mirror Crew / real-money copy. Dunk stays playful splash.

### Data shape hint (Aura)
```js
// Per game: authored[] then optional coda(n)
const FAIRYFLOSS_LEVELS = [
  { id:1, name:"Soft Cloud", kind:"teach", metresNeeded:3, snapLimit:3 /* ... */ },
  { id:2, name:"Twin Strand", kind:"dualNeedle", /* ... */ },
  { id:4, name:"Reverse Wind", kind:"invertDrag", /* ... */ },
  { id:8, name:"Fever Sugar Opera", kind:"comboFinale", /* ... */ },
];
const POPCORN_BATCHES = [
  { id:1, name:"Honest Kernels", kind:"steady", need:8 /* ... */ },
  { id:2, name:"Double Burst", kind:"doublePop", /* ... */ },
  { id:3, name:"Steam Gallery", kind:"fakeSteam", /* ... */ },
  // ...
];
const DUNK_SEATS = [
  { id:1, name:"Soft Splash Seat", kind:"swaySoft", balls:3 /* ... */ },
  { id:4, name:"Twin Plate", kind:"dualPlate", /* ... */ },
  { id:5, name:"Double-Tap Plate", kind:"armThenDunk", balls:4 /* ... */ },
  // ...
];
// clear → next authored; after last → if (codaEnabled) endlessParams(n) else souvenirClear
```

### Challenge copy (glory nouns)
- Fairy Floss: `Beat my Fairy Floss stage {n} on Penny Fever`
- Popcorn: `Beat my Popcorn stage {n} on Penny Fever`
- Duck Pond: `Beat my Duck Pond stage {n} on Penny Fever`
- Skee-Ball: `Beat my Skee-Ball stage {n} on Penny Fever`
- Penny Pitch: `Beat my Penny Pitch stage {n} on Penny Fever`
- Dunk: `Beat my Dunk seats {n} on Penny Fever`

---

## Explicit don’ts
- Same loop + thinner band / tighter hitMs / faster pond / higher skee target / higher needPts / smaller plate as the *only* progression
- Casino / real-money / gambling language
- Mirror Crew
- Mean-spirited dunk humiliation copy
- Shipping B04 as pure `stageParams` climb while these rooms unauthored
- Rewriting P0/B02 or B03 rooms in this file

---

## Room count checklist

| gameId | Authored rooms | Count |
|--------|----------------|------:|
| fairyfloss | Soft Cloud → Fever Sugar Opera | 8 |
| popcorn | Honest Kernels → Fever Kernel Opera | 8 |
| duckpond | Yellow Nursery → Fever Duck Opera | 8 |
| skee | Soft Boardwalk → Fever Lane Opera | 8 |
| pennypitch | Honest Quilt → Fever Cloth Opera | 8 |
| dunk | Soft Splash Seat → Fever Dunk Opera | 8 |
| **B04 total** | | **48** |

---

*Goblin ops — B04 authored rooms for Lorie/Aura. Hybrid default. Carnival DNA intact. P0 + B03 files untouched.*
