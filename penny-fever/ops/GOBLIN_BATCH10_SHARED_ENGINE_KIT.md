# Goblin Batch 10 — Shared Engine Kit + 3 unique stalls
# Purpose: make Desktop Grok/Codex ship depth FAST without rewriting death/score/vestibule each time.
# Copy Mother. Implement kit BEFORE inventing more one-off physics where possible.

---

## A) Shared runtime (`runKit.js` suggested)

### RunResult
```js
{
  gameId: string,
  depth: number,          // primary glory
  score: number,
  deathReason: string,    // or "cashed_out"
  cashedOut: boolean,
  meta: object,           // per-game (streak ms early, coverage%, etc.)
  at: number
}
```

### Persistence (`pennyFever.v2` extend)
```js
bestDepth: { [gameId]: number },
lastRun: { [gameId]: RunResult },
feverRunBest: number,
kitsTonight: string[],    // pack
stars, fever, streak, coins // existing
```

### Lifecycle (all depth games)
1. Vestibule → Start spends 1 coin
2. `startRun(gameId)`
3. Stages via `stageParams(n)` pattern
4. On death/cashout → `finishRun(result)` → save bestDepth → `#cabinet/{id}/result`
5. Result card: depth · score · Aura line · Copy challenge `Beat my {name} {depth} on Penny Fever`

### UI chrome (shared CSS)
- `.depth-hud` top: `STAGE/HEAT/FLOOR {n}`
- `.strike-pips` for misses
- `.barker-toast`
- `.result-ticket` postcard
- Hold/aim controls reuse: `.hold-btn`, `.sling-aim`, `.lane-spray`

### Fever Run hook
```js
isFeverNode: boolean  // shortened clear gates from Batch 09 table
onNodeClear() / onNodeDeath() // bubble to route controller
```

---

## B) Shared launchers (build once)

### 1. SlingAim (Ball Toss, Milk, Cans, Rings, Hatchet, Coconut, Cornhole…)
- Drag pull = power; angle from drag; release impulse
- Params: gravity, spitSpeed (too fast = reject hole), lateralNoise

### 2. HoldBand (Love Heat Run, Theremin-like, Fairy Floss tension)
- Hold raises value; band moves; outLimitMs death

### 3. TimingTap (Snap, Popcorn, Plate Smash, High Striker, Marquee)
- Event schedule + hit window + fake events

### 4. GreedFloor (Coin Pusher, Curios, Cover-the-Spot)
- Action → escalate → CASH OUT or CONTINUE → death rule

### 5. OracleRooms (Fortune / Catoptromancy)
- Hold-wait → Keep/Burn/Double

Document each game sheet with `engine: SlingAim|HoldBand|TimingTap|GreedFloor|OracleRooms|Custom`

---

## C) Three unique stalls (full guts)

### 1) Mirror Flip Arcade (`engine: Custom` light)
**Joke:** Mirror vs camera paradox as a stillness lock game.
**Verb:** Keep face/pointer steady while split panes diverge; lock when both stable.

#### Play
- Left pane mirrored pattern drifts; right pane true pattern drifts opposite
- Player holds alignment by counter-dragging a slider
- Survive `lockMs` inside tolerance → depth++ · tighter tolerance · faster drift
- Exit tolerance > `outMs` → DEATH

#### Stages
| Stage | tol | drift | lockMs | outMs |
|------:|----:|------:|-------:|------:|
| 1 | loose | slow | 1500 | 800 |
| 2 | mid | slow | 1600 | 700 |
| 3 | mid | mid | 1700 | 600 |
| 4 | tight | mid | 1800 | 550 |
| 5 | tight | fast | 1900 | 500 |
| 6+ | tighter | faster | 2000 | 450 |

#### Vestibule
- Split YOU|CAMERA bezel · “LOCK THE PARADOX”
#### Scoring
- +200 lock · depth = locks
#### Don’t
- Require webcam (slider mock OK; webcam optional bonus)

---

### 2) Black Art Booth (`engine: TimingTap` + brightness)
**Joke:** Only what you offer to the light exists.
**Verb:** Tap glowing fragments before they fade; darkness deletes score path.

#### Play
- Fragments spawn bright on black field. Tap to “catch.” Missed fade = strike
- Clear need catches → depth++. 3 strikes DEATH
- Stage adds decoy dim fragments (tap = strike)

#### Stages
| Stage | need | spawnMs | lifeMs | decoy% |
|------:|-----:|--------:|-------:|-------:|
| 1 | 10 | 700 | 900 | 0 |
| 2 | 12 | 650 | 850 | 0 |
| 3 | 14 | 600 | 800 | 10 |
| 4 | 16 | 550 | 750 | 15 |
| 5 | 18 | 500 | 700 | 20 |
| 6+ | 18+2*t | − | − | 25 |

#### Vestibule
- Black field, white gloves floating · “OFFER IT TO THE LIGHT”

---

### 3) Closing Time (`engine: Custom` alley event)
**Joke:** Whole foyer becomes one survival game after “close.”
**Verb:** Dash between winking cabinet lights; keep Fever meter alive.

#### Play
- Unlocks when local hour ≥ 21 OR after 5 depth games played (dev toggle)
- Lights wink out on doors; player taps next lit door before timeout to “keep the night open”
- Miss = Fever −1. Fever 0 = DEATH. Survive `minutes` bands → depth
- Not a replacement for cabinet engines — a weekend event mode

#### Bands
| Band | timeoutMs | doorsLit | feverMax |
|------:|----------:|---------:|---------:|
| 1 | 2000 | 3 | 3 |
| 2 | 1700 | 3 | 3 |
| 3 | 1400 | 2 | 3 |
| 4 | 1200 | 2 | 2 |
| 5+ | 1000 | 1 | 2 |

#### Vestibule
- “AFTER CLOSE — KEEP ONE LIGHT ON”
#### Don’t
- Softlock alley permanently

---

## D) Engineer rule for new sheets
Every new stall must declare:
`engine`, `vestibuleProp`, `stageParams`, `death`, `depthUnit`, `acceptTests`, `feverRunGate` (short clear)

If it doesn’t fit a shared engine, justify Custom in one line.

---

## Hand-off priority
1. Implement runKit + result chrome
2. Refactor Love Heat Run + Ball Toss onto kit
3. Snap/Marquee on TimingTap
4. Then more stalls are cheap
