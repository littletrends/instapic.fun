# Batch28 mounts — pegbounce set
# LOCKS: never write B23/B25/B26/B27.

## pegbounce — SlingAim
```js
PF.runKit.declare("pegbounce", { engine: "SlingAim", displayName: "Peg Bounce Soft Toss", depthUnit: "Peg", sheet: "GOBLIN_BATCH28_BUILD_SHEETS.md", });
function pegbounceStage(n){const t=n-1;return{need:n<2?2:n<4?3:4+Math.floor(t/2),pegKick:n>=2,pegHard:n>=4,balls:n<3?5:6,missesToDeath:n===1?4:n<4?3:2};}
```

## drumhit — TimingTap
```js
PF.runKit.declare("drumhit", { engine: "TimingTap", displayName: "Carnival Drum Hit", depthUnit: "Beat", sheet: "GOBLIN_BATCH28_BUILD_SHEETS.md", });
function drumhitStage(n){const t=n-1;return{need:Math.min(12,4+t),ghostRate:Math.min(0.4,t*0.08),windowMs:Math.max(80,180-t*12),deathOnGhost:true};}
```

## balancestick — HoldBand
```js
PF.runKit.declare("balancestick", { engine: "HoldBand", displayName: "Balance Stick Walk", depthUnit: "Step", sheet: "GOBLIN_BATCH28_BUILD_SHEETS.md", });
function balancestickStage(n){const t=n-1;return{bandH:Math.max(7,22-t*3),drift:t>=1,lieChance:t<2?0:Math.min(0.3,0.1+t*0.04),holdMs:2000+t*150};}
```

## medalslide — GreedFloor
```js
PF.runKit.declare("medalslide", { engine: "GreedFloor", displayName: "Medal Slide Shelf", depthUnit: "Shelf", sheet: "GOBLIN_BATCH28_BUILD_SHEETS.md",
  cashOut: true, });
function medalslideStage(n){const t=n-1;return{bankTarget:6+t*4,softDump:n>=2,softDumpHard:n>=4,pitWiden:Math.min(1,0.3+t*0.08)};}
```

## maskpick — OracleRooms
```js
PF.runKit.declare("maskpick", { engine: "OracleRooms", displayName: "Mask Pick Rooms", depthUnit: "Room", sheet: "GOBLIN_BATCH28_BUILD_SHEETS.md", });
function maskpickStage(n){const t=n-1;return{doors:n<3?3:4+(t%2),lieMasks:n<3?1:2,swapMs:n<2?0:Math.max(300,800-t*40)};}
```

## zigzagroll — Custom
```js
PF.runKit.declare("zigzagroll", { engine: "Custom", displayName: "Zigzag Roll Lane", depthUnit: "Lane", sheet: "GOBLIN_BATCH28_BUILD_SHEETS.md", });
function zigzagrollStage(n){const t=n-1;return{bumps:n===1?0:n<3?1:2+Math.floor(t/2),speed:Math.min(1.8,0.6+t*0.12),need:n<2?2:n<4?3:4,deathKey:"offtrack"};}
```
