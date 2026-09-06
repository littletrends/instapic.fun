# Batch 19 mount configs — drop-in for Desktop Grok (align to runKit)
# No ping needed — pull when wiring Coconut Soft / Tin Can Soft / Plinko Skill / Snack Wheel / Midway Maze / Tip Jar.
# engine declarations match GOBLIN_BATCH19_BUILD_SHEETS.md (quiet drop; Runkit map rows may lag)
# Style twin of GOBLIN_BATCH17_MOUNT_CONFIGS.md / GOBLIN_BATCH13_MOUNT_CONFIGS.md

## coconutsoft — SlingAim · Coconut Shy Soft
```js
PF.runKit.declare("coconutsoft", {
  engine: "SlingAim", // easier coconut shy onboarding
  displayName: "Coconut Shy Soft",
  depthUnit: "Shy",
  sheet: "GOBLIN_BATCH19_BUILD_SHEETS.md",
  skinOf: "coconut",
});

function coconutsoftStageParams(n) {
  const t = n - 1;
  // Gentler than coconut: bigger hit radii, more balls, missesToDeath 4
  return {
    id: n,
    title: n === 1 ? "Wide Soft" : n < 3 ? "Mid Shy" : n < 5 ? "Soft Sway" : "Tight Soft",
    need: n === 1 ? 2 : n === 2 ? 2 : n === 3 ? 3 : n === 4 ? 3 : 4,
    coconutScale: Math.min(1.3, 1.2 - 0.02 * t), // oversized soft targets
    gapScale: Math.max(0.8, 1.1 - 0.035 * t),
    sway: n >= 4,
    balls: n < 5 ? 5 : 6,
    missesToDeath: 4,
  };
}
// Play: knock soft coconuts (onboarding coconut shy)
// Depth = shys cleared
// Death: balls out before need
// finishRun({ gameId:"coconutsoft", depth, score, deathReason:"balls_out" })
// bestDepth.coconutsoft = Shy
```
**Don'ts:** as-hard-as coconut on stage 1 · magnet snap · ignore missesToDeath 4

---

## tincansoft — SlingAim · Tin Can Alley Soft
```js
PF.runKit.declare("tincansoft", {
  engine: "SlingAim", // lighter cans than canalley — onboarding cousin
  displayName: "Tin Can Alley Soft",
  depthUnit: "Stack",
  sheet: "GOBLIN_BATCH19_BUILD_SHEETS.md",
  skinOf: "canalley",
});

function tincansoftStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Feather Teach" : n < 3 ? "Light Stack" : n < 5 ? "Soft Glue" : "Soft Storm",
    topMass: Math.max(0.55, 0.75 - 0.02 * t),
    midMass: Math.max(0.9, 1.1 - 0.02 * t),
    bottomMass: Math.max(1.4, 1.8 - 0.03 * t), // lighter than canalley
    spacing: n < 3 ? "wide" : n < 5 ? "mid" : "tight",
    glueBottoms: n < 3 ? 0 : n === 3 ? 0 : 1,
    wind: n < 4 ? 0 : 0.08,
    throwsPerStack: n < 5 ? 4 : 3, // extra throw early
    canSilhouette: "tall_narrow",
    bounceSnap: 1.05, // softer than canalley 1.25
    missesToDeath: 4,
  };
}
// Play: lighter cans than canalley (onboarding cousin)
// Depth = stacks cleared
// Death: throws out / incomplete
// finishRun({ gameId:"tincansoft", depth, score, deathReason:"throws"|"incomplete" })
// bestDepth.tincansoft = Stack
```
**Don'ts:** canalley masses on stage 1 · duplicate Milk exactly · ignore soft bounce

---

## plinkoskill — Custom · Plinko Skill Drop
```js
PF.runKit.declare("plinkoskill", {
  engine: "Custom", // BATCH03 plinko DNA — chosen drop lane + breathe tilt
  displayName: "Plinko Skill Drop",
  depthUnit: "Stage",
  sheet: "GOBLIN_BATCH19_BUILD_SHEETS.md",
  skinOf: "plinko",
});

function plinkoskillStageParams(n) {
  const t = n - 1;
  const tiltAmps = { low: 0.08, mid: 0.16, high: 0.28 };
  return {
    id: n,
    title: n === 1 ? "Soft Drop" : n === 2 ? "Breath Mid" : n === 3 ? "Aim Five" : n === 4 ? "Dead Pegs" : "Tilt Storm",
    targetSlotMin: n === 1 ? 3 : n === 2 ? 4 : n === 3 ? 5 : n === 4 ? 6 : Math.min(8, 6 + Math.floor(t / 2)),
    chips: 3,
    tiltAmp: n === 1 ? tiltAmps.low : n < 4 ? tiltAmps.mid : tiltAmps.high,
    tiltHz: Math.min(0.65, 0.35 + 0.04 * t),
    dropLanes: 5,
    playerChoosesLane: true,
    deadPegEveryNthRow: n < 4 ? 0 : n === 4 ? 4 : 3,
    biasFromEntry: true,
  };
}
// Play: choose drop lane; board breathes tilt (BATCH03 plinko)
// Depth = stages cleared
// Death: all chips miss target band
// finishRun({ gameId:"plinkoskill", depth, score, deathReason:"chips_out" })
// bestDepth.plinkoskill = Stage
```
**Don'ts:** pure RNG after lane pick · ignore tilt breathe · no player lane choice

---

## snackwheel — TimingTap · Wheel of Snacks
```js
PF.runKit.declare("snackwheel", {
  engine: "TimingTap", // Wheel of Luck skin — snack labels flavour only
  displayName: "Wheel of Snacks",
  depthUnit: "Stop",
  sheet: "GOBLIN_BATCH19_BUILD_SHEETS.md",
  skinOf: "wheel",
});

function snackwheelStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Wide Wedge" : n < 3 ? "Snack Hunt" : n < 5 ? "Tight Treat" : "Rare Snacks",
    wedgeW: n === 1 ? "wide" : n < 4 ? "mid" : "thin",
    spinMs: n === 1 ? 1400 : n === 2 ? 1250 : n === 3 ? 1100 : n === 4 ? 950 : 850,
    targetBand: n === 1 ? "any_snack" : n === 2 ? "sweet" : n === 3 ? "salty" : n === 4 ? "rare" : "jackpot_flavour",
    graceStrikes: n === 1 ? 1 : 0,
    snackLabelsOnly: true, // flavour art — share wheel stop skill
    neverAutoStop: true,
  };
}
// Play: skill-stop wheel; snack labels are flavour only (share wheel)
// Depth = stops cleared
// Death: miss wedge band
// finishRun({ gameId:"snackwheel", depth, score, deathReason:"miss_wedge" })
// bestDepth.snackwheel = Stop
```
**Don'ts:** true RNG after STOP · real-prize gambling copy · auto-freeze stage 1 forever

---

## midwaymaze — Custom · Midway Maze
```js
PF.runKit.declare("midwaymaze", {
  engine: "Custom", // top-down tiny maze; exit before timer; ghosts stage 3+
  displayName: "Midway Maze",
  depthUnit: "Maze",
  sheet: "GOBLIN_BATCH19_BUILD_SHEETS.md",
});

function midwaymazeStageParams(n) {
  const t = n - 1;
  // Sheet table: 1 small/40/0 · 2 mid/35/0 · 3 mid/30/1 · 4 big/28/1 · 5+ big/25/2
  const size = n === 1 ? "small" : n < 4 ? "mid" : "big";
  const timeSec = n === 1 ? 40 : n === 2 ? 35 : n === 3 ? 30 : n === 4 ? 28 : Math.max(18, 25 - (t - 4));
  const ghosts = n < 3 ? 0 : n === 3 ? 1 : n === 4 ? 1 : 2;
  return {
    id: n,
    title: n === 1 ? "Tiny Teach" : n === 2 ? "Mid Paths" : n === 3 ? "First Ghost" : n === 4 ? "Big Haunt" : "Ghost Storm",
    size,
    timeSec,
    ghosts,
    deathOnTimer: true,
    deathOnGhostTouch: true,
    topDown: true,
  };
}
// Play: top-down tiny maze; exit before timer; ghosts from stage 3
// Depth = mazes cleared
// Death: timer / ghost touch
// finishRun({ gameId:"midwaymaze", depth, score, deathReason:"timer"|"ghost" })
// bestDepth.midwaymaze = Maze
```
**Don'ts:** no ghosts late · infinite timer · wall-clip exit

---

## tipjar — TimingTap · Aura Tip Jar Timing
```js
PF.runKit.declare("tipjar", {
  engine: "TimingTap", // tap when tip lands in jar sweet spot
  displayName: "Aura Tip Jar Timing",
  depthUnit: "Tip",
  sheet: "GOBLIN_BATCH19_BUILD_SHEETS.md",
});

function tipjarStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Soft Drop" : n < 3 ? "Jar Catch" : n < 5 ? "Fake Bounce" : "Tip Storm",
    need: n === 1 ? 4 : n === 2 ? 5 : n === 3 ? 6 : n === 4 ? 7 : 7 + t,
    windowMs: n === 1 ? 170 : n === 2 ? 150 : n === 3 ? 130 : n === 4 ? 115 : Math.max(75, 115 - 5 * t),
    fakeBouncePct: n < 3 ? 0 : n === 3 ? 15 : n === 4 ? 22 : 28, // fake bounce stage 3+
    missesToDeath: n < 4 ? 3 : 2,
    copyTone: "soft_cute", // soft, cute — no hustle guilt
  };
}
// Play: tap when tip lands in jar sweet spot; fake bounce stage 3+
// Depth = tips cleared
// Death: misses / fake bounce tap
// finishRun({ gameId:"tipjar", depth, score, deathReason:"misses"|"fake_bounce" })
// bestDepth.tipjar = Tip
```
**Don'ts:** casino tip-guilt copy · no fakes late · auto-catch jar

---

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: coconutsoft, tincansoft, plinkoskill, snackwheel, midwaymaze, tipjar.
Door tag: `Depth run` only if engine mounted.

## finishRun quick hints
| gameId | depthUnit | typical deathReason |
|--------|-----------|---------------------|
| coconutsoft | Shy | balls_out |
| tincansoft | Stack | throws, incomplete |
| plinkoskill | Stage | chips_out |
| snackwheel | Stop | miss_wedge |
| midwaymaze | Maze | timer, ghost |
| tipjar | Tip | misses, fake_bounce |
