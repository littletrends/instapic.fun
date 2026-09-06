# P0 mount configs — drop-in for Desktop Grok (align to runKit)
# LIVE 2026-09-05 — vendors/ball-toss.js · coin-pusher.js · pinball.js
# Authored RACK / FLOOR / CHAPTER rooms (GOBLIN_AUTHORED_LEVELS_P0.md). NOT hotter-number climbs.
# startRun + Depth vestibule copy + no teasers. Love stays in app.js (not this desk).
# No ping needed — pull when wiring Love / Ball Toss / Coin Pusher.
# engine declarations match GOBLIN_RUNKIT_API.md + live vendors/runKit.js

## love — HoldBand / Heat Run (authored rooms, app.js desk)
# GOBLIN REVIEW REDO 2026-09-05 — app.js HoldBand.mount(stageParams: holdBandStageParams)
# holdBandStageParams(n) = AUTHORED unique rooms (not a thinner climb) + codaEnabled.
```js
PF.runKit.declare("love", {
  engine: "HoldBand",
  displayName: "Love Thermometer",
  depthUnit: "Heat Stage",
  sheet: "GOBLIN_LOVE_HEAT_RUN.md",
  authoredSheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
  codaEnabled: true, // hybrid default; false = souvenir after Stage 8
});

const LOVE_LEVELS = [
  { id:1, name:"Warm Glass", kind:"solid", bandH:22, speed:0.35, travel:5, clearMs:1800, outLimitMs:900, entryDeadlineMs:4000, graceStrikes:1 },
  { id:2, name:"Mercury Tide", kind:"sine", bandH:22, speed:0.95, travel:22, clearMs:1800, outLimitMs:1100, entryDeadlineMs:4200 },
  { id:3, name:"Hot Split", kind:"splitMidClear", bandH:20, splitBandH:9, splitGap:11, splitAtPct:0.45, clearMs:2000, outLimitMs:800 },
  { id:4, name:"Twin Mercury", kind:"twinAlternate", bandH:11, clearEachMs:900, stallMs:4500, outLimitMs:750, entryDeadlineMs:8000 },
  { id:5, name:"Ghost Band", kind:"ghostEither", bandH:16, ghostSpeed:-0.55, clearMs:2000, outLimitMs:700 },
  { id:6, name:"Liar's Flash", kind:"liarFlash", bandH:16, lieEveryMs:2500, decoyMs:400, decoyOffset:12, clearMs:2000, outLimitMs:650 },
  { id:7, name:"Poison Twin", kind:"ghostPoison", bandH:15, poisonMs:400, clearMs:2100, outLimitMs:600 },
  { id:8, name:"Fever Break Room", kind:"livingShrink", bandH:18, shrinkWhileHold:0.007, minBandH:7, teleportEveryMs:3000, clearMs:2400, outLimitMs:420 },
];

function loveCodaParams(n) {
  const k = Math.max(0, n - LOVE_LEVELS.length);
  return {
    id: n,
    title: "Inferno Edge " + n,
    kind: "coda",
    coda: true,
    bandH: Math.max(6, 16 - k * 1.1),
    speed: Math.min(2.4, 0.7 + k * 0.12),
    shrink: Math.min(0.02, 0.003 + k * 0.0012),
    clearMs: Math.round(2000 + Math.min(2000, k * 120)),
    outLimitMs: Math.max(280, 700 - k * 45),
    entryDeadlineMs: 4000 + Math.min(2000, k * 100),
    lieChance: Math.min(0.35, k * 0.05),
    splitAt: k >= 2,
    bothMust: k >= 7,
    graceStrikes: 0,
  };
}

function loveStageParams(n) {
  if (n >= 1 && n <= LOVE_LEVELS.length) return Object.assign({ title: LOVE_LEVELS[n-1].name }, LOVE_LEVELS[n-1]);
  if (LOVE_P0_MOUNT.codaEnabled) return loveCodaParams(n);
  return null; // souvenirClear — authored ride ends
}
function holdBandStageParams(n) {
  const p = loveStageParams(n);
  if (!p) return null;
  return Object.assign({}, p, { riseRate: 0.55, fallRate: 0.32, lo: 0, hi: 1 });
}
// HoldBand.mount(root, { stageParams: holdBandStageParams }, runCtx)
// Love owns moving-band death; HoldBand lo/hi stay 0–1
// finishRun({ gameId:"love", depth, score, deathReason, cashedOut })
// bestDepth.love = Heat Stage; kill default 3-round loop
// HUD: authored name on stage; coda labeled ENDLESS
```

## balltoss — SlingAim
```js
PF.runKit.declare("balltoss", {
  engine: "SlingAim",
  displayName: "Barely-Fit Ball Toss",
  depthUnit: "Rack",
  sheet: "GOBLIN_BATCH01_BUILD_SHEETS.md",
  authoredSheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
  codaEnabled: true, // flip false = souvenir stop after Warp Keyhole
  authoredCount: 8,
});

const BALLTOSS_LEVELS = [
  { id:1, name:"Three Honest Circles", kind:"triangle", holeScale:1, spitSpeed:1.15 },
  { id:2, name:"Barely Fit Tri", kind:"triangle", holeScale:0.90, spitSpeed:1.38 },
  { id:3, name:"Sway Board", kind:"diamond", sway:true },
  { id:4, name:"Oval Liar", kind:"ovalLiar" }, // one oval; center-line aim
  { id:5, name:"Crowded Five", kind:"cluster" },
  { id:6, name:"Spin Rack", kind:"spinFive", rotateAmp:"±12°", holeScale:0.76 },
  { id:7, name:"Decoy Dent Alley", kind:"decoyFive" }, // 5 real + 1 dent
  { id:8, name:"Warp Keyhole", kind:"warpKeyhole" }, // round/oval/keyhole/tiny
];
function balltossStage(n) {
  if (n <= 8) return BALLTOSS_LEVELS[n - 1];
  if (!codaEnabled) return null; // souvenir
  return { name:`Warp Coda ${n}`, kind:"codaFive", holes:5, holeScale:Math.max(0.55, 0.72-(n-9)*0.02), sway:true, rotate:true, decoyDent:n%2===1, coda:true };
}
// HUD: `RACK n · name` · coda labeled ENDLESS
// +100/hole +500 rack +50*stage; depth = racks cleared
```

## coinpusher — GreedFloor
```js
PF.runKit.declare("coinpusher", {
  engine: "GreedFloor",
  displayName: "Coin Pusher Shelf",
  depthUnit: "Floor",
  sheet: "GOBLIN_BATCH01_BUILD_SHEETS.md",
  authoredSheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
  cashOut: true,
  codaEnabled: true, // flip false = souvenir stop after Avalanche Gallery
  authoredCount: 7,
});

const PUSHER_LEVELS = [
  { id:1, name:"Glass Nursery", kind:"nursery", lanes:3, bankTarget:8, pit:"narrow", buried:false },
  { id:2, name:"Split Shelf", kind:"split", seam:true, bankTarget:12 }, // center seam pit
  { id:3, name:"Overhang Tease", kind:"overhang", overhang:true },
  { id:4, name:"Double Sweep", kind:"doublesweep", doublePush:true }, // two short pushes / cycle
  { id:5, name:"Pit Mouth", kind:"pitmouth", vMouth:true }, // V under center; sides safer
  { id:6, name:"Trapdoor Floor", kind:"trapdoor", trapdoor:true }, // one lane dumps once
  { id:7, name:"Avalanche Gallery", kind:"avalanche", avalanche:0.42, kickers:true },
];
function pusherFloor(n) {
  if (n <= 7) return PUSHER_LEVELS[n - 1];
  if (!codaEnabled) return null;
  return { name:`Greed Coda ${n}`, bankTarget:24+(n-7)*4, pitWiden:true, avalanche:true, kickers:true, coda:true };
}
// HUD: `FLOOR n · name` · coda labeled ENDLESS
// Death: shelf wiped + 0 tray on buried floors (Floor 1 teaches)
// Cash out between drops = cashedOut:true finishRun
```

## pinball — Custom
```js
PF.runKit.declare("pinball", {
  engine: "Custom",
  displayName: "Pinball Alley",
  depthUnit: "Chapter",
  sheet: "GOBLIN_BATCH01_BUILD_SHEETS.md",
  authoredSheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
  codaEnabled: true, // flip false = souvenir stop after Backglass Fever
  authoredCount: 8,
});

const PINBALL_LEVELS = [
  { id:1, name:"Plunger Parade", toys:{bumpers:"triangle", posts:true}, mission:"hit each bumper once" },
  { id:2, name:"Spinner Alley", toys:{spinner:"center", slings:true, bumpers:"sides"}, mission:"3 spinner ticks" },
  { id:3, name:"Sinkhole Circus", toys:{sink:"center", bumpers:"ring"}, mission:"sink ×2" },
  { id:4, name:"Ramp Carnival", toys:{ramp:true, upperShelf:true, sink:true}, mission:"ramp + sink" },
  { id:5, name:"Bumper Storm", toys:{bumpers:5, tightIn:true, ramp:false}, mission:"bumper combo ×5" },
  { id:6, name:"Twin Flip Gate", toys:{upperFlip:true, gate:true, bonus:true}, mission:"open gate + 2 bonus" },
  { id:7, name:"Outlane Thorns", toys:{thorns:true, spinner:true, sink:true}, mission:"spinner then sink" },
  { id:8, name:"Backglass Fever", toys:{ramp:true, spinner:true, sink:true, bumpers:4, rollovers:true}, mission:"ramp → spinner → sink" },
];
function chapterSpec(n) {
  if (n <= 8) return PINBALL_LEVELS[n - 1];
  if (!codaEnabled) return null;
  // Ch8 toy set, rotated mission, speed cap ~1.7
  return { name:`Fever Coda ${n}`, toys:PINBALL_LEVELS[7].toys, speed:Math.min(1.7, 1.16+(n-9)*0.06), coda:true };
}
// HUD: `CHAPTER n · name` · coda labeled ENDLESS
// Must still call finishRun with depth=chapters; drain=death
```

## Teaser kill list (when /play exists)
Remove TEASERS delight as sole interaction for: love, balltoss, coinpusher, pinball.
- balltoss / coinpusher / pinball — LIVE in vendors/*.js: canvas locked until startRun; vestibule is Depth copy; no one-tap prize
- love — app.js desk (leave alone)
Door tag: `VENDOR · DEPTH RUN` only if engine mounted (those three doors are).
