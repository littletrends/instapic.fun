# Batch23 mount configs — drop-in for Desktop Grok
# Source: GOBLIN_BATCH23_BUILD_SHEETS.md

## bottlehook — SlingAim
```js
PF.runKit.declare("bottlehook", {
  engine: "SlingAim",
  displayName: "Bottle Hook Toss",
  depthUnit: "Hook",
  sheet: "GOBLIN_BATCH23_BUILD_SHEETS.md",
});
function bottlehookStage(n) {
  const t = n - 1;
  return {
    need: n < 2 ? 2 : n < 4 ? 3 : 4 + Math.floor(t / 2),
    neckScale: Math.max(0.7, 1 - t * 0.04),
    leanAway: n >= 2,
    leanHard: n >= 4,
    hooks: n < 3 ? 5 : 6,
    missesToDeath: 3,
  };
}
```

## whistlepop — TimingTap
```js
PF.runKit.declare("whistlepop", {
  engine: "TimingTap",
  displayName: "Whistle Pop Race",
  depthUnit: "Lap",
  sheet: "GOBLIN_BATCH23_BUILD_SHEETS.md",
});
function whistlepopStage(n) {
  const t = n - 1;
  return {
    need: Math.min(10, 4 + t),
    fakeRate: Math.min(0.4, t * 0.08),
    windowMs: Math.max(80, 180 - t * 12),
    deathOnFake: true,
  };
}
```

## sandpour — HoldBand
```js
PF.runKit.declare("sandpour", {
  engine: "HoldBand",
  displayName: "Hourglass Pour",
  depthUnit: "Pour",
  sheet: "GOBLIN_BATCH23_BUILD_SHEETS.md",
});
function sandpourStage(n) {
  const t = n - 1;
  return {
    bandH: Math.max(7, 22 - t * 3),
    drift: t >= 1,
    lieChance: t < 2 ? 0 : Math.min(0.3, 0.1 + t * 0.04),
    fillMs: 2200 + t * 150,
    deathKey: "spill",
  };
}
```

## ticketclaw — GreedFloor
```js
PF.runKit.declare("ticketclaw", {
  engine: "GreedFloor",
  displayName: "Ticket Claw Shelf",
  depthUnit: "Shelf",
  sheet: "GOBLIN_BATCH23_BUILD_SHEETS.md",
  cashOut: true,
});
function ticketclawStage(n) {
  const t = n - 1;
  return {
    bankTarget: 6 + t * 4,
    softClose: n >= 2,
    softCloseHard: n >= 4,
    pitWiden: Math.min(1, 0.3 + t * 0.08),
  };
}
```

## mirrorlot — OracleRooms
```js
PF.runKit.declare("mirrorlot", {
  engine: "OracleRooms",
  displayName: "Mirror Lot Rooms",
  depthUnit: "Room",
  sheet: "GOBLIN_BATCH23_BUILD_SHEETS.md",
});
function mirrorlotStage(n) {
  const t = n - 1;
  return {
    doors: n < 3 ? 3 : 4 + (t % 2),
    lieMirrors: n < 3 ? 1 : 2,
    swapMs: n < 2 ? 0 : Math.max(300, 800 - t * 40),
  };
}
```

## railroll — Custom
```js
PF.runKit.declare("railroll", {
  engine: "Custom",
  displayName: "Rail Roll Ball",
  depthUnit: "Rail",
  sheet: "GOBLIN_BATCH23_BUILD_SHEETS.md",
});
function railrollStage(n) {
  const t = n - 1;
  return {
    bumps: n === 1 ? 0 : n < 3 ? 1 : 2 + Math.floor(t / 2),
    speed: Math.min(1.8, 0.6 + t * 0.12),
    need: n < 2 ? 2 : n < 4 ? 3 : 4,
    deathKey: "gutter",
  };
}
```
