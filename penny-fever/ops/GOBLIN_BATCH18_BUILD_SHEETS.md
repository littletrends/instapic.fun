# Goblin Batch 18 — full engine sheets (quiet drop)
# Tea Cup Spin · Mirror Maze Peek · Cotton Candy Cut · Rubber Duck Hook Colour · Night Lantern Catch · Barker Call Echo
# DNA: 1 coin = 1 run · depth until DEATH · tent mouth shows the cheat · mobile-first · solo Aura
# Source of truth for ids/engines/params: GOBLIN_BATCH18_MOUNT_CONFIGS.md

Shared: routes `#cabinet/{teacupspin|mirrorpeek|candycut|duckhookcolour|lanterncatch|barkerecho}` vestibule/play/result · `bestDepth.*` · result challenge copy · no webcam · no real-money

---

## 1) teacupspin — HoldBand · Tea Cup Spin
**Cheat visible:** saucer band is narrow; too-fast spin spills tea (readable splash + empty cup).
**Feel:** Midway tea-cup ride as a stall meter game.
**Verb:** Hold/drag to set spin RPM; keep needle in the sweet band while laps accumulate.
**Depth unit:** Lap
**Input:** Hold / drag vertical or dial — release = coast (still spills if over band)

### Vestibule
- Prop: pastel tea cups on a spinning plate, tea level visible, band dial on the rail
- Barker: “SPIN SWEET — DON’T SPILL THE SAUCER”
- Best: `Laps {n}`

### Play loop
1. Stage starts; band + rpmSweet shown (gentle teach on stage 1)
2. Player holds spin rate inside band → lap progress fills
3. Too fast (`tooFastSpills`) → spill strike; Too slow (`tooSlowNoLap`) → no lap credit
4. Clear when `lapsNeeded` complete without hitting spillLimit → depth++ · next stage tighter
5. DEATH when spillLimit reached

### Stage table
| Stage | title | lapsNeeded | bandWidth | bandH | spillLimit | rpmSweet |
|------:|-------|-----------:|-----------|------:|-----------:|---------:|
| 1 | Gentle Whirl | 2 | wide | 22 | 3 | 0.45 |
| 2 | Saucer Band | 3 | mid | 18 | 3 | 0.55 |
| 3 | Spill Edge | 3 | mid | 15 | 2 | 0.65 |
| 4 | Storm Cups | 4 | thin | 15 | 2 | 0.70 |
| 5+ | Storm Cups+ | 4+floor(t/2) | thin | max(10,15-t) | 2 | min(1.1,0.7+0.05*t) |

(t = stage−1)

### Scoring
- +40 per lap · +280 stage clear · +60×stage
- Depth = laps / stages cleared (bestDepth.teacupspin = Lap)

### Death / result
- spillLimit reached → `finishRun({ gameId:"teacupspin", depth, score, deathReason:"spill" })`
- Card: `LAP {n} · SCORE · Aura spill line`

### Don’ts
- auto-rpm lock · ignore spillLimit · Love-heat framing on tea cups

### Accept
- Player feels the band tighten and sees spills as the cheat
- Stage 3+ needs micro-corrections, not mash-hold

---

## 2) mirrorpeek — Custom (stillness + timing) · Mirror Maze Peek
**Cheat visible:** panes flicker shut; silhouette only lines up in a thin window; late stages add decoy panes.
**Feel:** Carnival mirror maze peek booth.
**Verb:** Stay still, then tap when your silhouette aligns in the open peek window.
**Depth unit:** Peek
**Input:** Pointer stillness (stillPx) + tap on align; fidget breaks stillness

### Vestibule
- Prop: angled mirrors, silhouette ghost, peek shutters
- Barker: “STILL — THEN PEEK WHEN YOU MATCH”
- Best: `Peeks {n}`

### Play loop
1. Peek window opens for `windowMs`
2. Player must be within `stillPx` of stillness AND tap when silhouette aligns
3. Success → peek counted; miss align / fidget / closed pane = strike
4. Clear when `peeksNeeded` met → depth++ · thinner windows
5. DEATH when strikes exhausted (or fidget break if coded as hard death)

### Stage table
| Stage | title | peeksNeeded | windowMs | stillPx | alignGrace | strikes | decoyPanes |
|------:|-------|------------:|---------:|--------:|-----------:|--------:|:----------:|
| 1 | Open Glass | 3 | 220 | 16 | 1 | 3 | no |
| 2 | Align Silhouette | 4 | 180 | 12 | 0 | 3 | no |
| 3 | Flicker Pane | 5 | 150 | 10 | 0 | 3 | no |
| 4 | Maze Mirror Storm | 5 | 130 | 10 | 0 | 2 | yes |
| 5+ | Maze Mirror Storm+ | 6+floor(t/2) | max(80,130-5*t) | max(6,10-0.5*t) | 0 | 2 | yes |

### Scoring
- +55 per peek · +320 clear · +70×stage
- Depth = peeks cleared

### Death / result
- `deathReason:"strikes"|"miss_align"|"fidget"`
- Card: `PEEK {n} · Aura line`

### Don’ts
- auto-align silhouette · always-open panes · ignore stillPx tighten

### Accept
- Stillness + timing both matter; decoy panes punish spam taps

---

## 3) candycut — TimingTap · Cotton Candy Cut
**Cheat visible:** fake swirls look cuttable but credit zero / strike; ribbon speeds up.
**Feel:** Fairy-floss cousin stall with scissors on the beat.
**Verb:** Tap to cut the floss ribbon only on true beat windows.
**Depth unit:** Cut
**Input:** Tap on beat (`windowMs`); ignore fake swirls (fakePct stage 3+)

### Vestibule
- Prop: pink floss ribbon spinning on a cone, toy scissors cursor
- Barker: “CUT THE RIBBON — SKIP THE FAKE SWIRL”
- Best: `Cuts {n}`

### Play loop
1. Ribbon events schedule; true cut window = ±windowMs
2. Hit true → count toward `need`
3. Miss / early / late = miss strike; cut fake swirl = fake_swirl death path / strike
4. Clear when need met → depth++ · tighter + more fakes
5. DEATH at missesToDeath

### Stage table
| Stage | title | need | windowMs | fakePct | missesToDeath |
|------:|-------|-----:|---------:|--------:|--------------:|
| 1 | Floss Teach | 5 | 160 | 0 | 3 |
| 2 | Ribbon Beat | 6 | 140 | 0 | 3 |
| 3 | Fake Swirl | 7 | 125 | 12 | 3 |
| 4 | Cut Storm | 8 | 110 | 18 | 2 |
| 5+ | Cut Storm+ | 8+t | max(75,110-5*t) | 25 | 2 |

### Scoring
- +30 per cut · +300 clear · +50×stage
- Depth = cuts / stages cleared

### Death / result
- `deathReason:"misses"|"fake_swirl"`
- Card: `CUT {n}`

### Don’ts
- HoldBand wind framing · credit fake swirls · window never tightens

### Accept
- False-start brain; stage 3+ fakes hurt; shares TimingTap with popcorn DNA, flossCousin flag

---

## 4) duckhookcolour — Custom · Rubber Duck Hook Colour
**Cheat visible:** colour call posted; wrong-colour ducks look hookable; pond speeds up; call rotates stage 3+.
**Feel:** Duck-pond skin with colour-call emphasis (share duckpond code).
**Verb:** Drag-hook the called colour duck(s) floating past.
**Depth unit:** Duck
**Input:** Tap-drag hook (hookPx shrinks); release on duck
**skinOf:** duckpond

### Vestibule
- Prop: rubber duck pond, colour call placard, wire hook
- Barker: “HOOK THE CALL — NOT EVERY DUCK”
- Best: `Ducks {n}`

### Play loop
1. Colour call posted (`colourCall:true` from stage 1)
2. Hook correct colour within hookPx → count toward need
3. Wrong duck / wrong colour → toward wrongLimit
4. Clear when need met → depth++ · faster · rotatingCall from 3
5. DEATH at wrongLimit

### Stage table
| Stage | title | colours | need | speedMul | hookPx | wrongLimit | rotatingCall |
|------:|-------|---------|-----:|---------:|-------:|-----------:|:------------:|
| 1 | Yellow Call | yellow | 5 | 0.55 | 48 | 3 | no |
| 2 | Two-Tone Pond | yellow,blue | 6 | 0.63 | 46 | 3 | no |
| 3 | Colour Call | y/b/r/g | 7 | 0.71 | 44 | 3 | yes |
| 4 | Busy Pond | y/b/r/g | 8 | 0.79 | 42 | 2 | yes |
| 5+ | Call Storm | y/b/r/g | 8+t | min(1.35,0.55+0.08*t) | max(28,48-2*t) | 2 | yes |

### Scoring
- +40 correct · +280 clear
- Depth = ducks / stages cleared

### Death / result
- `deathReason:"wrong_duck"|"wrong_colour"`

### Don’ts
- duplicate duckpond art · ignore colour call · credit wrong colour

### Accept
- Call is readable; wrong-colour temptation is the joke

---

## 5) lanterncatch — TimingTap · Night Lantern Catch
**Cheat visible:** lanterns fade; decoy lanterns (stage 3+) look lit but snag = strike.
**Feel:** Night float stall under paper lanterns.
**Verb:** Tap to snag a real lantern before fadeMs expires.
**Depth unit:** Lantern
**Input:** Tap on floating lantern hitbox within windowMs / before fade

### Vestibule
- Prop: dark sky, floating paper lanterns, catch stick silhouette
- Barker: “SNAG THE GLOW — BEFORE IT FADES”
- Best: `Lanterns {n}`

### Play loop
1. Lantern floats in; true catch window windowMs; also fades after fadeMs
2. Tap true → count; miss / fade miss / decoy snag = strike path
3. Clear when need met → depth++ · more decoys
4. DEATH at missesToDeath

### Stage table
| Stage | title | need | windowMs | fadeMs | decoyPct | missesToDeath |
|------:|-------|-----:|---------:|-------:|---------:|--------------:|
| 1 | Soft Glow | 4 | 180 | 900 | 0 | 3 |
| 2 | Float Catch | 5 | 155 | 750 | 0 | 3 |
| 3 | Decoy Lantern | 6 | 135 | 650 | 15 | 3 |
| 4 | Night Storm | 7 | 120 | 650 | 22 | 2 |
| 5+ | Night Storm+ | 7+t | max(75,120-5*t) | max(400,650-30*t) | 30 | 2 |

### Scoring
- +45 per lantern · +310 clear
- Depth = lanterns cleared

### Death / result
- `deathReason:"misses"|"decoy"|"fade"`

### Don’ts
- no decoys late · everlasting glow · auto-snag on hover

### Accept
- Fade pressure + decoys; night feel without Love framing

---

## 6) barkerecho — TimingTap · Barker Call Echo
**Cheat visible:** pattern plays once then vanishes; window tightens; wrong tone kills a life.
**Feel:** Bellecho cousin — barker VO Simon rhythm.
**Verb:** Hear the barker call pattern, tap it back in time.
**Depth unit:** Echo
**Input:** Tap sequence after playback (`simonBell:true`, `barkerTone:true`)

### Vestibule
- Prop: barker megaphone, echo lights on a board
- Barker: “HEAR THE CALL — ECHO IT BACK”
- Best: `Echoes {n}`

### Play loop
1. Pattern of `notes` plays (barker tones)
2. Player taps back within windowMs per note
3. Wrong tone / timeout = lose a life
4. Clear sequence → depth++ · longer chain
5. DEATH when lives exhausted

### Stage table
| Stage | title | notes | windowMs | lives |
|------:|-------|------:|---------:|------:|
| 1 | Three Calls | 3 | 450 | 3 |
| 2 | Midway Chain | 4 | 400 | 3 |
| 3 | Thin Echo | 5 | 360 | 2 |
| 4 | Barker Storm | 6 | 320 | 2 |
| 5+ | Barker Storm+ | 6+t | 300 | 2 |

### Scoring
- +70 per echo clear · +note accuracy bonus · +90×stage
- Depth = echoes cleared

### Death / result
- `deathReason:"lives"|"wrong_tone"|"timeout"`

### Don’ts
- auto-complete sequence · show pattern forever · ignore window tighten

### Accept
- Memory + timing; distinct from bellecho via barker VO skin

---

## Engine map
| gameId | engine | depthUnit |
|--------|--------|-----------|
| teacupspin | HoldBand | Lap |
| mirrorpeek | Custom | Peek |
| candycut | TimingTap | Cut |
| duckhookcolour | Custom | Duck |
| lanterncatch | TimingTap | Lantern |
| barkerecho | TimingTap | Echo |

## Implement notes
- Mount declare()+stageParams live in GOBLIN_BATCH18_MOUNT_CONFIGS.md
- Teaser kill when /play exists: teacupspin, mirrorpeek, candycut, duckhookcolour, lanterncatch, barkerecho
- Door tag: `Depth run` only if engine mounted
