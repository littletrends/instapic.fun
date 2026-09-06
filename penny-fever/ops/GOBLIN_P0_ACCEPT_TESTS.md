# P0 accept tests — Aura / Desktop Grok tick sheet
# Concrete playtests for Love Heat Run · Ball Toss · Coin Pusher · Pinball
# Feel tests from GOBLIN_BORING_GAP_MEMO + measurable stage/death checks from sheets.
# Tick ☐ → ☑ when proven on device (mobile primary). Fail = do not ship Depth-run tag.

> **Authored mode:** For Love + B01 + B02 named rooms / feel accept, use `GOBLIN_P0_AUTHORED_ACCEPT_FEEL.md` (REVIEW HIT #2). This sheet remains for shared plumbing + legacy parametric depth-climb checks; authored layouts supersede pure stageParams feel.

---

## Shared (all four)

| # | Check | Pass? |
|---|-------|:-----:|
| S1 | 1 demo coin starts a run; death does **not** spend another coin | ☐ |
| S2 | Result route `#cabinet/{id}/result` shows depth · score · deathReason · Aura line · challenge CTA | ☐ |
| S3 | `bestDepth.{id}` persists across reload; foyer door shows it | ☐ |
| S4 | Door tag is `Depth run` only when `/play` engine mounted — never teaser-only | ☐ |
| S5 | No door returns only a witty sentence + coin deduct (BORING_GAP #5) | ☐ |
| S6 | Touch/pointer works; keyboard not required; ~60fps on mid phone | ☐ |

---

## 1) Love Heat Run (`love` · HoldBand)

**Feel (BORING_GAP #4):** Can’t “finish” — only die deeper than last time.

### Feel ticks
| # | Feel | Pass? |
|---|------|:-----:|
| L-F1 | Default coin path is Heat Run (endless stages), **not** fixed 3-round rank loop | ☐ |
| L-F2 | Holding in pink band feels skillful; leaving band while holding is sweaty | ☐ |
| L-F3 | Player can say “I died deeper than last time” — depth is the glory | ☐ |

### Measurable stage / death
| # | Check | Spec | Pass? |
|---|-------|------|:-----:|
| L1 | Stage 1 grants **1 grace strike**; 2nd out-of-band kill = DEATH | LOVE_HEAT_RUN grace | ☐ |
| L2 | Stage 2+ : `outMs >= outLimitMs` while holding → DEATH (`"drifted out"`) | outLimitMs = max(280, 900−t×55) | ☐ |
| L3 | Never enter band within `entryDeadlineMs` → DEATH (`"never found the band"`) | 4000 + min(2000,t×100) | ☐ |
| L4 | Clear = `inZoneMs >= clearMs` → depth++ · next `loveStageParams(n)` · no soft “Round 3/3 finished” | clearMs = 1800+min(2200,t×120) | ☐ |
| L5 | Decent player reaches **Heat Stage 5–8** first session | accept from sheet | ☐ |
| L6 | Stage 6+: lieChance decoy counts as OUT; stage 7+: split ghost; 14+: ghost poison | lie/split/bothMust | ☐ |
| L7 | Foyer Best = `Heat Stage {n}` not avg % only | vestibule | ☐ |
| L8 | Challenge copy: `Beat my Love Heat Stage {n} on Penny Fever` | result | ☐ |

**Kill list:** TEASER delight removed; LOVE_ROUNDS length-3 gated off default.

---

## 2) Ball Toss (`balltoss` · SlingAim)

**Feel (BORING_GAP #1):** 60s+ of aiming; dies on 3rd miss; can say “holes are unfair.”

### Feel ticks
| # | Feel | Pass? |
|---|------|:-----:|
| B-F1 | Drag-aim + pull power feels juicy; stage 1 teachable in ~10s | ☐ |
| B-F2 | Player articulates cheat: holes too small / spit-outs / oval / sway | ☐ |
| B-F3 | One run lasts **60s+** for a decent player (not one-tap done) | ☐ |

### Measurable stage / death
| # | Check | Spec | Pass? |
|---|-------|------|:-----:|
| B1 | **3 misses in current rack = DEATH**; misses reset on rack clear | BATCH01 | ☐ |
| B2 | Stage 1: 3 holes · scale 1.00 · no motion | stage table | ☐ |
| B3 | Stage 3+: sway on; stage 4+: oval hole; stage 6+: micro rotate | stage table | ☐ |
| B4 | Stage 9+ odd: decoy dent (looks like hole, isn’t) | decoyDent | ☐ |
| B5 | Too-fast sink → bounce spit (`spitSpeed` threshold) — readable cheat | physics | ☐ |
| B6 | Score: +100/hole · +500 rack · +50×stage; depth = **racks cleared** | scoring | ☐ |
| B7 | holeScale never below 0.55 on deep stages | max(0.55, …) | ☐ |
| B8 | Challenge: `Beat my Ball Toss rack {n} on Penny Fever` | result | ☐ |

**Don’t ship if:** auto-aim assist or one-throw-and-win ticket booth.

---

## 3) Coin Pusher (`coinpusher` · GreedFloor)

**Feel (BORING_GAP #2):** Feels greed; cash-out vs one-more-drop is a real choice.

### Feel ticks
| # | Feel | Pass? |
|---|------|:-----:|
| C-F1 | First minute teaches DROP → push → tray without a tutorial wall of text | ☐ |
| C-F2 | **CASH OUT** vs **DROP AGAIN** dilemma is loud in UI (not buried) | ☐ |
| C-F3 | Players feel greed (“one more drop”) at least once | ☐ |

### Measurable stage / death
| # | Check | Spec | Pass? |
|---|-------|------|:-----:|
| C1 | CASH OUT between drops ends run as souvenir (`cashedOut:true`) — **not** death | GreedFloor | ☐ |
| C2 | Death ≠ cash-out flavour on result card (distinct copy) | accept | ☐ |
| C3 | Floor 1 bankTarget 8; Floor n: `8+(n-1)*4`; pusherSpeed = min(2, 0.6+n×0.12) | P0 mount | ☐ |
| C4 | Floor ≥5: avalanche chance after drop | avalanche: n>=5 | ☐ |
| C5 | Death v1: shelf wiped to 0 coins **and** tray gain 0 on Floor ≥2 (buried) | BATCH01 / P0 | ☐ |
| C6 | Score: banked×10 · +200/Floor · +15% cash-out bonus if Floor ≥5 | scoring | ☐ |
| C7 | Depth primary foyer badge = `Floor {n}` | bestDepth | ☐ |
| C8 | No real-money / gambling copy anywhere in stall | don’t | ☐ |

**Don’t ship if:** infinite free drops with no risk, or cash-out button missing when `canCashOut()`.

---

## 4) Pinball Alley (`pinball` · Custom)

**Feel (BORING_GAP #3):** Flippers matter; drain ends the coin; chapter number is the glory.

### Feel ticks
| # | Feel | Pass? |
|---|------|:-----:|
| P-F1 | Left/right half-screen flippers feel fair; drain feels like player fault | ☐ |
| P-F2 | Backglass / HUD shows **CHAPTER {n}** readable mid-play | ☐ |
| P-F3 | Decent player can survive **60s+**; chapters climb | ☐ |

### Measurable stage / death
| # | Check | Spec | Pass? |
|---|-------|------|:-----:|
| P1 | **1 ball per coin**; drain (outlane) = DEATH immediately | BATCH01 | ☐ |
| P2 | Chapter clear (mission) → depth++ · fanfare · brief safe plunge | chapters | ☐ |
| P3 | Ch1: hit each bumper once; Ch2: 3 spinner; Ch3: sink×2; … per sheet table | missions | ☐ |
| P4 | Ball speed mult climbs (1.0 → cap ~1.7); bumper values climb | stage table | ☐ |
| P5 | finishRun still emits RunResult `{ depth: chapters, score, deathReason:"drain" }` | runKit Custom | ☐ |
| P6 | Score: bumper/spinner pts · +1000×chapter on clear · +50/10s live | scoring | ☐ |
| P7 | Challenge: `Beat my Pinball chapter {n}` | result | ☐ |
| P8 | No 3-ball default credit on Depth-run path | don’t | ☐ |

**Don’t ship if:** flipper zones tiny/unreadable on phone, or teaser string instead of table.

---

## Sign-off

| Cabinet | Feel all ☑ | Measurable all ☑ | Signer | Date (Sydney) |
|---------|:----------:|:----------------:|--------|---------------|
| love | ☐ | ☐ | | |
| balltoss | ☐ | ☐ | | |
| coinpusher | ☐ | ☐ | | |
| pinball | ☐ | ☐ | | |

**Ship rule:** All Shared S1–S6 + that cabinet’s Feel + Measurable rows ☑ before foyer `Depth run` tag and before that gameId enters Fever Run pool.
