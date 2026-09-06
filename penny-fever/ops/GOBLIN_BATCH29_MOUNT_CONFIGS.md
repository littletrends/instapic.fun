# Batch29 mount configs — diskflip set
# LOCKS: do not touch B23/B25–B28.

## diskflip — SlingAim · Disk Flip Toss
```js
PF.runKit.declare("diskflip", {
  engine: "SlingAim",
  displayName: "Disk Flip Toss",
  depthUnit: "Flip",
  sheet: "GOBLIN_BATCH29_BUILD_SHEETS.md",
});
function diskflipStage(n){const t=n-1;return{need:n<2?2:n<4?3:4+Math.floor(t/2),edgeBias:n>=2,edgeHard:n>=4,disks:n<3?5:6,missesToDeath:n===1?4:n<4?3:2};}
// finishRun({ gameId:"diskflip", depth, score, deathReason:"edge_out" })
```

## cowbell — TimingTap · Cowbell True Clang
```js
PF.runKit.declare("cowbell", {
  engine: "TimingTap",
  displayName: "Cowbell True Clang",
  depthUnit: "Clang",
  sheet: "GOBLIN_BATCH29_BUILD_SHEETS.md",
});
function cowbellStage(n){const t=n-1;return{need:Math.min(12,4+t),falseRate:Math.min(0.4,t*0.08),windowMs:Math.max(80,180-t*12),deathOnFalse:true};}
// finishRun({ gameId:"cowbell", depth, score, deathReason:"false_clang" })
```

## ladderlean — HoldBand · Ladder Lean Hold
```js
PF.runKit.declare("ladderlean", {
  engine: "HoldBand",
  displayName: "Ladder Lean Hold",
  depthUnit: "Rung",
  sheet: "GOBLIN_BATCH29_BUILD_SHEETS.md",
});
function ladderleanStage(n){const t=n-1;return{bandH:Math.max(7,22-t*3),drift:t>=1,lieChance:t<2?0:Math.min(0.3,0.1+t*0.04),holdMs:2000+t*150};}
// finishRun({ gameId:"ladderlean", depth, score, deathReason:"tip" })
```

## chipfall — GreedFloor · Chip Fall Shelf
```js
PF.runKit.declare("chipfall", {
  engine: "GreedFloor",
  displayName: "Chip Fall Shelf",
  depthUnit: "Floor",
  sheet: "GOBLIN_BATCH29_BUILD_SHEETS.md",
  cashOut: true,
});
function chipfallStage(n){const t=n-1;return{bankTarget:6+t*4,softSigh:n>=2,softSighHard:n>=4,pitWiden:Math.min(1,0.3+t*0.08)};}
// finishRun({ gameId:"chipfall", depth, score, deathReason:"buried" })
```

## lanternpick — OracleRooms · Lantern Pick Path
```js
PF.runKit.declare("lanternpick", {
  engine: "OracleRooms",
  displayName: "Lantern Pick Path",
  depthUnit: "Path",
  sheet: "GOBLIN_BATCH29_BUILD_SHEETS.md",
});
function lanternpickStage(n){const t=n-1;return{doors:n<3?3:4+(t%2),lieLanterns:n<3?1:2,swapMs:n<2?0:Math.max(300,800-t*40)};}
// finishRun({ gameId:"lanternpick", depth, score, deathReason:"wrong_lantern" })
```

## spiralroll — Custom · Spiral Roll Bowl
```js
PF.runKit.declare("spiralroll", {
  engine: "Custom",
  displayName: "Spiral Roll Bowl",
  depthUnit: "Spiral",
  sheet: "GOBLIN_BATCH29_BUILD_SHEETS.md",
});
function spiralrollStage(n){const t=n-1;return{bumps:n===1?0:n<3?1:2+Math.floor(t/2),speed:Math.min(1.8,0.6+t*0.12),need:n<2?2:n<4?3:4,deathKey:"offspiral"};}
// finishRun({ gameId:"spiralroll", depth, score, deathReason:"offspiral" })
```

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps

// Expand: map BUILD stage table columns into returned fields; keep death keys stable.
// diskflip edgeBias · cowbell falseRate · ladderlean lieChance · chipfall softSigh · lanternpick swapMs · spiralroll bumps
