# Batch 20 mount configs — spend-aware / meta systems (Aura wire contracts)
# Design park from GOBLIN_BATCH20_SPEND_LOOPS.md + GOBLIN_SPEND_UX_NOTES.md
# These may be meta, not pure runKit engines — still declare()+stageParams Aura can mount.
# Arcade spend, not casino. Cosmetics / continues / social — never pay-to-win Heat.

## nightpass — Custom meta · Night Pass
```js
PF.runKit.declare("nightpass", {
  engine: "Custom", // season/night cosmetics unlock track
  displayName: "Night Pass",
  depthUnit: "Tier",
  sheet: "GOBLIN_BATCH20_SPEND_LOOPS.md",
  meta: true,
  spendAware: true,
  noGameplayPower: true, // cosmetics / Aura drip / ticket chrome ONLY
});

function nightpassStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Foyer Lights" : n < 4 ? "Ticket Chrome" : n < 8 ? "Aura Drip" : "Midnight Frame",
    freeTrack: true,
    paidTrack: true, // paid = cosmetics only
    freeCrumbs: true, // free track has real crumbs (ethical spend)
    xpPerDepthClear: 10 + Math.min(20, t),
    tiersToSeason: 30,
    unlocks: ["ticket_frame", "foyer_light", "aura_drip_line", "result_chrome"],
    neverBuffs: ["heat", "missesToDeath", "graceStrikes", "scoreMul"],
    sessionCodeTrial: true, // Instapic booth code → Night Pass trial
  };
}
// Play: free depth play everywhere; Pass XP from clears; paid track = Aura drip / frames
// Depth = tiers unlocked (cosmetic ladder)
// Death: n/a meta — finishRun optional on season complete
// finishRun({ gameId:"nightpass", depth, score, deathReason:"season_end"|"abandon", meta:{ track:"free"|"paid" } })
// bestDepth.nightpass = Tier
```
**Don'ts:** gameplay power · buy Inferno · loot-box rarity pressure · empty free track

---

## stickeralbum — GreedFloor · Sticker Album
```js
PF.runKit.declare("stickeralbum", {
  engine: "GreedFloor", // curios land as stickers; set complete → foyer stars
  displayName: "Sticker Album",
  depthUnit: "Set",
  sheet: "GOBLIN_BATCH20_SPEND_LOOPS.md",
  meta: true,
  spendAware: true,
  cashOut: true, // melt duplicates → fever (soft Monopoly Go brain)
  skinOf: "curios",
});

function stickeralbumStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "First Page" : n < 3 ? "Set Hunt" : n < 5 ? "Rare Slot" : "Album Storm",
    stickersPerSet: n === 1 ? 4 : n === 2 ? 5 : n === 3 ? 6 : 6 + Math.floor(t / 2),
    dropOnCuriosLand: true,
    duplicateMeltToFever: true,
    setCompleteStars: 1,
    albumSlotsSellable: true, // UX: curio album slots — soft, not loot boxes
    neverPayToSkipSet: true,
    canCashOut: true, // melt extras between floors
  };
}
// Play: curios land as stickers; complete sets for foyer stars; duplicate melt → fever
// Depth = sets completed
// Death: album wipe / abandon greed floor (same family as curios)
// finishRun({ gameId:"stickeralbum", depth, score, deathReason:"wipe"|"abandon", cashedOut, meta:{ sets, melts } })
// bestDepth.stickeralbum = Set
```
**Don'ts:** real-money rarity loot · pay to complete set · raid-anxiety album protect

---

## raidspin — TimingTap · Raid Spin
```js
PF.runKit.declare("raidspin", {
  engine: "TimingTap", // skill-stop spin; async “raid” ghost friend’s shelf
  displayName: "Raid Spin",
  depthUnit: "Raid",
  sheet: "GOBLIN_BATCH20_SPEND_LOOPS.md",
  spendAware: true,
  skinOf: "wheel",
  socialAsync: true,
});

function raidspinStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Friendly Shelf" : n < 3 ? "Ghost Raid" : n < 5 ? "Tight Shelf" : "Raid Storm",
    wedgeW: n === 1 ? "wide" : n < 4 ? "mid" : "thin",
    spinMs: n === 1 ? 1400 : n === 2 ? 1250 : n === 3 ? 1100 : n === 4 ? 950 : 850,
    targetBand: "raid_crumb",
    ghostFriendShelf: true, // async — no live PvP damage
    neverStealPower: true,
    neverDemandSpendToProtect: true, // UX guardrail
    graceStrikes: n === 1 ? 1 : 0,
    neverAutoStop: true,
  };
}
// Play: skill-stop spin; “raid” ghost friend’s shelf (async social pressure, not P2W)
// Depth = raids cleared
// Death: miss wedge
// finishRun({ gameId:"raidspin", depth, score, deathReason:"miss_wedge", meta:{ friendId, crumb } })
// bestDepth.raidspin = Raid
```
**Don'ts:** pay-to-win raid damage · protect-shelf anxiety spend · true RNG after STOP

---

## revivecredit — runKit hook · Revive Credit
```js
PF.runKit.declare("revivecredit", {
  engine: "Custom", // runKit death hook — arcade continue
  displayName: "Revive Credit",
  depthUnit: "Continue",
  sheet: "GOBLIN_BATCH20_SPEND_LOOPS.md",
  meta: true,
  spendAware: true,
  runKitHook: "onDeathContinue",
});

function revivecreditStageParams(n) {
  // n = continues used this run (or offer index)
  return {
    id: n,
    title: n === 1 ? "Insert Coin" : n === 2 ? "Second Chance" : "Last Credit",
    continueCostCredits: 1,
    resumeDepthDelta: -1, // continue at same depth−1
    markContinued: true, // depth stigma: continued flag on result
    watchAdLater: true, // Watch? (later) path
    maxContinuesPerRun: 3,
    neverBuyRank: true,
    labelClearly: "arcade_credit", // UX: Insert coin after death
  };
}
// Play: on death offer Watch? (later) or Spend 1 credit → resume depth−1
// Depth = continues accepted (meta) / host game keeps its depthUnit
// Death: decline continue → host finishRun stands
// finishRun host with meta:{ continued:true, continuesUsed:n } — depth stigma preserved
// bestDepth.revivecredit optional = Continues used (analytics)
```
**Don'ts:** silent continue wipe stigma · buy Inferno via continue · infinite free continues

---

## livelane — Custom (duel skins) · Live Lane
```js
PF.runKit.declare("livelane", {
  engine: "Custom", // watergun/bumper 2P — NPC ghost now; real players later
  displayName: "Live Lane",
  depthUnit: "Heat",
  sheet: "GOBLIN_BATCH20_SPEND_LOOPS.md",
  spendAware: true,
  duel: true,
  skinsOf: ["watergun", "bumper", "shark"],
});

function livelaneStageParams(n) {
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "Ghost Lane" : n < 3 ? "NPC Duel" : n < 5 ? "Party Heat" : "Lane Storm",
    mode: n < 3 ? "npc_ghost" : "party_ready",
    engineSkin: n % 2 === 0 ? "watergun" : "bumper",
    heatTarget: n === 1 ? 3 : n === 2 ? 4 : 5 + Math.floor(t / 2),
    partyPackUnlock: true, // UX: Party pack / booking code for 2P night
    sessionCodeBridge: true, // Instapic codes
    neverPayToWinHeat: true,
  };
}
// Play: duel lane vs NPC ghost now; real players = party night packs (spend reason)
// Depth = heats won
// Death: lose heat / disconnect
// finishRun({ gameId:"livelane", depth, score, deathReason:"heat_loss"|"disconnect", meta:{ vs:"npc"|"player" } })
// bestDepth.livelane = Heat
```
**Don'ts:** pay-to-win lane power · force spend to enter free ghost duel · ignore party-pack bridge

---

## dailyheist — Custom meta (feverrun skin) · Daily Heist
```js
PF.runKit.declare("dailyheist", {
  engine: "Custom", // short daily route of 3 live engines; streak rewards
  displayName: "Daily Heist",
  depthUnit: "Heist",
  sheet: "GOBLIN_BATCH20_SPEND_LOOPS.md",
  meta: true,
  spendAware: true,
  skinOf: "feverrun",
  daily: true,
});

function dailyheistStageParams(n) {
  // n = day streak / heist attempt index
  const t = n - 1;
  return {
    id: n,
    title: n === 1 ? "First Heist" : n < 3 ? "Streak Warm" : n < 7 ? "Week Run" : "Heist Storm",
    nodesRequired: 3,
    nodePoolLiveOnly: true, // Fever Run gates — live engines only
    shortenedGates: true, // use GOBLIN_FEVER_RUN_NODE_GATES.md
    streakReward: true,
    monopolyDailyHabit: true,
    oneCoinWholeRoute: true,
    deathEndsHeist: true,
    neverBuyStreakProtect: true,
  };
}
// Play: daily 3-node route of live engines; streak rewards (Monopoly daily habit)
// Depth = heists cleared (or streak days)
// Death: node death ends heist
// finishRun({ gameId:"dailyheist", depth, score, deathReason:"node_death"|"abandon", meta:{ nodes, streak } })
// bestDepth.dailyheist = Heist
```
**Don'ts:** teaser nodes in pool · pay to protect streak · skip-skill buy

---

## Teaser / door notes
- Meta systems: foyer chips / Pass board / Continue modal — not stall teasers.
- Door tag `Depth run` only for playable mounts (raidspin, livelane); nightpass/stickeralbum/dailyheist = meta doors; revivecredit = hook only.
- Ethical: cosmetics · continues · convenience OK; never buy Heat / Inferno / raid-anxiety.

## finishRun quick hints
| gameId | depthUnit | typical deathReason |
|--------|-----------|---------------------|
| nightpass | Tier | season_end, abandon |
| stickeralbum | Set | wipe, abandon |
| raidspin | Raid | miss_wedge |
| revivecredit | Continue | (host death; hook) |
| livelane | Heat | heat_loss, disconnect |
| dailyheist | Heist | node_death, abandon |
