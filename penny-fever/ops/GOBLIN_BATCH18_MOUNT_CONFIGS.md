# Batch 18 mount configs — drop-in for Desktop Grok (align to runKit)
# No ping needed — pull when wiring Tea Cup Spin / Mirror Peek / Candy Cut / Duck Colour / Lantern Catch / Barker Echo.
# engine declarations match GOBLIN_BATCH18_BUILD_SHEETS.md (quiet drop; Runkit map rows may lag)
# Style twin of GOBLIN_BATCH17_MOUNT_CONFIGS.md / GOBLIN_BATCH13_MOUNT_CONFIGS.md

## teacupspin — HoldBand · Tea Cup Spin
```js
PF.runKit.declare("teacupspin", {
  engine: "HoldBand", // keep spin rate in band; too fast spills
  displayName: "Tea Cup Spin",
  depthUnit: "Lap",
  sheet: "GOBLIN_BATCH18_BUILD_SHEETS.md",
});

function teacupspinStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Gentle Whirl" : n < 3 ? "Saucer Band" : n < 5 ? "Spill Edge" : "Storm Cups",
    lapsNeeded: n === 1 ? 2 : n === 2 ? 3 : n === 3 ? 3 : n === 4 ? 4 : 4 + Math.floor(t / 2),
    bandWidth: n === 1 ? "wide" : n < 4 ? "mid" : "thin",
    bandH: n === 1 ? 22 : n === 2 ? 18 : n === 3 ? 15 : Math.max(10, 15 - t),
    spillLimit: n < 3 ? 3 : 2, // spills = strikes
    rpmSweet: n === 1 ? 0.45 : n === 2 ? 0.55 : n === 3 ? 0.65 : Math.min(1.1, 0.7 + 0.05 * t),
    tooFastSpills: true,
    tooSlowNoLap: true,
  };
}
// Play: hold spin rate in band; too fast spills tea
// Depth = laps / stages cleared
// Death: spillLimit reached
// finishRun({ gameId:"teacupspin", depth, score, deathReason:"spill" })
// bestDepth.teacupspin = Lap
```
**Don'ts:** auto-rpm lock · ignore spillLimit · Love-heat framing on tea cups

---

## mirrorpeek — Custom (stillness + timing) · Mirror Maze Peek
```js
PF.runKit.declare("mirrorpeek", {
  engine: "Custom", // stillness + timing — peek windows
  displayName: "Mirror Maze Peek",
  depthUnit: "Peek",
  sheet: "GOBLIN_BATCH18_BUILD_SHEETS.md",
});

function mirrorpeekStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Open Glass" : n < 3 ? "Align Silhouette" : n < 5 ? "Flicker Pane" : "Maze Mirror Storm",
    peeksNeeded: n === 1 ? 3 : n === 2 ? 4 : n === 3 ? 5 : n === 4 ? 5 : 6 + Math.floor(t / 2),
    windowMs: n === 1 ? 220 : n === 2 ? 180 : n === 3 ? 150 : n === 4 ? 130 : Math.max(80, 130 - 5 * t),
    stillPx: n === 1 ? 16 : n === 2 ? 12 : n === 3 ? 10 : Math.max(6, 10 - 0.5 * t),
    alignGrace: n === 1 ? 1 : 0,
    strikes: n < 4 ? 3 : 2,
    decoyPanes: n >= 4,
  };
}
// Play: peek windows open; tap when silhouette aligns (stillness + timing)
// Depth = peeks cleared
// Death: strikes / miss align / fidget break
// finishRun({ gameId:"mirrorpeek", depth, score, deathReason:"strikes"|"miss_align"|"fidget" })
// bestDepth.mirrorpeek = Peek
```
**Don'ts:** auto-align silhouette · always-open panes · ignore stillPx tighten

---

## candycut — TimingTap · Cotton Candy Cut
```js
PF.runKit.declare("candycut", {
  engine: "TimingTap", // fairy floss cousin — cut ribbon on beat
  displayName: "Cotton Candy Cut",
  depthUnit: "Cut",
  sheet: "GOBLIN_BATCH18_BUILD_SHEETS.md",
});

function candycutStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Floss Teach" : n < 3 ? "Ribbon Beat" : n < 5 ? "Fake Swirl" : "Cut Storm",
    need: n === 1 ? 5 : n === 2 ? 6 : n === 3 ? 7 : n === 4 ? 8 : 8 + t,
    windowMs: n === 1 ? 160 : n === 2 ? 140 : n === 3 ? 125 : n === 4 ? 110 : Math.max(75, 110 - 5 * t),
    fakePct: n < 3 ? 0 : n === 3 ? 12 : n === 4 ? 18 : 25, // fake swirls stage 3+
    missesToDeath: n < 4 ? 3 : 2,
    flossCousin: true,
  };
}
// Play: cut floss ribbon on beat (fairy floss cousin)
// Depth = cuts / stages cleared
// Death: misses / fake swirl cut
// finishRun({ gameId:"candycut", depth, score, deathReason:"misses"|"fake_swirl" })
// bestDepth.candycut = Cut
```
**Don'ts:** HoldBand wind framing · credit fake swirls · window never tightens

---

## duckhookcolour — Custom · Rubber Duck Hook Colour
```js
PF.runKit.declare("duckhookcolour", {
  engine: "Custom", // duckpond skin — colour call emphasis
  displayName: "Rubber Duck Hook Colour",
  depthUnit: "Duck",
  sheet: "GOBLIN_BATCH18_BUILD_SHEETS.md",
  skinOf: "duckpond",
});

function duckhookcolourStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Yellow Call" : n === 2 ? "Two-Tone Pond" : n === 3 ? "Colour Call" : n === 4 ? "Busy Pond" : "Call Storm",
    colours: n === 1 ? ["yellow"] : n === 2 ? ["yellow", "blue"] : ["yellow", "blue", "red", "green"],
    need: n === 1 ? 5 : n === 2 ? 6 : n === 3 ? 7 : n === 4 ? 8 : 8 + t,
    speedMul: Math.min(1.35, 0.55 + 0.08 * t),
    hookPx: Math.max(28, 48 - 2 * t),
    wrongLimit: n < 4 ? 3 : 2,
    colourCall: true, // colour call from stage 1 (duckpond DNA)
    rotatingCall: n >= 3,
  };
}
// Play: duck pond with colour call (duckpond skin)
// Depth = ducks / stages cleared
// Death: wrong_duck / wrong_colour
// finishRun({ gameId:"duckhookcolour", depth, score, deathReason:"wrong_duck"|"wrong_colour" })
// bestDepth.duckhookcolour = Duck
```
**Don'ts:** duplicate duckpond art · ignore colour call · credit wrong colour

---

## lanterncatch — TimingTap · Night Lantern Catch
```js
PF.runKit.declare("lanterncatch", {
  engine: "TimingTap",
  displayName: "Night Lantern Catch",
  depthUnit: "Lantern",
  sheet: "GOBLIN_BATCH18_BUILD_SHEETS.md",
});

function lanterncatchStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Glow" : n < 3 ? "Float Catch" : n < 5 ? "Decoy Lantern" : "Night Storm",
    need: n === 1 ? 4 : n === 2 ? 5 : n === 3 ? 6 : n === 4 ? 7 : 7 + t,
    windowMs: n === 1 ? 180 : n === 2 ? 155 : n === 3 ? 135 : n === 4 ? 120 : Math.max(75, 120 - 5 * t),
    fadeMs: n === 1 ? 900 : n === 2 ? 750 : n === 3 ? 650 : Math.max(400, 650 - 30 * t),
    decoyPct: n < 3 ? 0 : n === 3 ? 15 : n === 4 ? 22 : 30, // decoys stage 3+
    missesToDeath: n < 4 ? 3 : 2,
  };
}
// Play: floating lanterns; tap to snag before fade; decoys stage 3+
// Depth = lanterns cleared
// Death: misses / decoy snag / fade miss
// finishRun({ gameId:"lanterncatch", depth, score, deathReason:"misses"|"decoy"|"fade" })
// bestDepth.lanterncatch = Lantern
```
**Don'ts:** no decoys late · everlasting glow · auto-snag on hover

---

## barkerecho — TimingTap · Barker Call Echo
```js
PF.runKit.declare("barkerecho", {
  engine: "TimingTap", // bellecho cousin — repeat barker call rhythm
  displayName: "Barker Call Echo",
  depthUnit: "Echo",
  sheet: "GOBLIN_BATCH18_BUILD_SHEETS.md",
});

function barkerechoStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Three Calls" : n < 3 ? "Midway Chain" : n < 5 ? "Thin Echo" : "Barker Storm",
    notes: n === 1 ? 3 : n === 2 ? 4 : n === 3 ? 5 : n === 4 ? 6 : 6 + t,
    windowMs: n === 1 ? 450 : n === 2 ? 400 : n === 3 ? 360 : n === 4 ? 320 : 300,
    lives: n < 3 ? 3 : 2,
    simonBell: true, // hear pattern, tap back — bellecho DNA, barker VO
    barkerTone: true,
  };
}
// Play: repeat barker call rhythm (bellecho cousin)
// Depth = echoes cleared
// Death: lives exhausted (wrong tone / timeout)
// finishRun({ gameId:"barkerecho", depth, score, deathReason:"lives"|"wrong_tone"|"timeout" })
// bestDepth.barkerecho = Echo
```
**Don'ts:** auto-complete sequence · show pattern forever · ignore window tighten

---

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: teacupspin, mirrorpeek, candycut, duckhookcolour, lanterncatch, barkerecho.
Door tag: `Depth run` only if engine mounted.

## finishRun quick hints
| gameId | depthUnit | typical deathReason |
|--------|-----------|---------------------|
| teacupspin | Lap | spill |
| mirrorpeek | Peek | strikes, miss_align, fidget |
| candycut | Cut | misses, fake_swirl |
| duckhookcolour | Duck | wrong_duck, wrong_colour |
| lanterncatch | Lantern | misses, decoy, fade |
| barkerecho | Echo | lives, wrong_tone, timeout |
