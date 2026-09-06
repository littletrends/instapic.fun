# P0 polish pass — Love Heat Run · Ball Toss · Coin Pusher · Pinball
# Concrete punch-list after engines breathe. Tick ☐ → ☑ on device (mobile primary).
# Sources: GOBLIN_P0_ACCEPT_TESTS.md · GOBLIN_LOVE_HEAT_RUN.md · GOBLIN_BORING_GAP_MEMO.md · BATCH01 sheets
# Do this BEFORE more stall art / Batch 02+ polish. Feel bugs first, chrome second.

---

## Shared (all four)

| # | Punch | Why | Done? |
|---|-------|-----|:-----:|
| S-P1 | Result card always shows depth · score · deathReason · Aura line · challenge CTA | Accept S2; shareable postcard | ☐ |
| S-P2 | Challenge copy one-tap copies; toast “Copied — send it” | Viral beat; accept challenge rows | ☐ |
| S-P3 | Death flash ≥700ms before navigate result — never instant cut | Death clarity | ☐ |
| S-P4 | HUD: depth unit label big (`HEAT STAGE` / `RACK` / `FLOOR` / `CHAPTER`) mid-play | Glory readable | ☐ |
| S-P5 | Touch targets ≥44px; hold/flipper zones full usable width on phone | Mobile | ☐ |
| S-P6 | Safe-area insets; no HUD under notch / home indicator | Mobile | ☐ |
| S-P7 | 1 coin = 1 run; death never double-charges | Accept S1 | ☐ |
| S-P8 | `bestDepth` foyer badge updates after result; persists reload | Accept S3 | ☐ |

---

## 1) Love Heat Run (`love` · HoldBand)

### Feel bugs
| # | Punch | Spec / symptom | Done? |
|---|-------|----------------|:-----:|
| L-P1 | Kill default 3-round finish; Heat Run is coin default | No “Round 3/3 finished” soft end | ☐ |
| L-P2 | Out-of-band while holding accumulates toward `outLimitMs` (not only release) | LOVE_HEAT_RUN death | ☐ |
| L-P3 | Stage 1 grace = 1 flash+toast; 2nd kill = death | graceStrikes | ☐ |
| L-P4 | Authored kinds 1–8 match `loveStageParams` (sine / split / twin switch / ghost / liar / poison / living shrink); coda climb only after 8 | Mount + AUTHORED_LEVELS_P0 | ☐ |
| L-P5 | Clear keeps heat mid (40–55) — no ice reset between stages | Flow | ☐ |
| L-P6 | Ghost/lie decoy holding counts as OUT (readable flash) | Stages 6+ | ☐ |

### HUD / death clarity
| # | Punch | Done? |
|---|-------|:-----:|
| L-H1 | Big `HEAT STAGE {n}` + subtitle title; strike pips visible | ☐ |
| L-H2 | Death reasons map to Aura: drifted out · never found the band · ghost band lied | ☐ |
| L-H3 | Glass crack / mercury shatter beat before result | ☐ |

### Challenge / mobile
| # | Punch | Done? |
|---|-------|:-----:|
| L-C1 | `Beat my Love Heat Stage {n} on Penny Fever` | ☐ |
| L-M1 | Full-width hold zone + `#holdBtn`; no keyboard required | ☐ |
| L-M2 | ~60fps mid phone; band scroll doesn’t stutter on clear | ☐ |

---

## 2) Ball Toss (`balltoss` · SlingAim)

### Feel bugs
| # | Punch | Spec / symptom | Done? |
|---|-------|----------------|:-----:|
| B-P1 | 3 misses/rack = death; misses reset on rack clear | BATCH01 | ☐ |
| B-P2 | Spit on too-fast sink readable (bounce + toast) | spitSpeed | ☐ |
| B-P3 | Stage 3+ sway · 4+ oval · 6+ rotate · 9+ odd decoy dent live | stage table | ☐ |
| B-P4 | holeScale floor 0.55 — never unreadable pinholes | Mount | ☐ |
| B-P5 | Stage 1 teachable ~10s; decent run ≥60s | Feel B-F1/F3 | ☐ |
| B-P6 | No auto-aim / magnet sink | Don’ts | ☐ |

### HUD / death clarity
| # | Punch | Done? |
|---|-------|:-----:|
| B-H1 | `RACK {n}` + holes-left + miss pips (3) | ☐ |
| B-H2 | deathReason: misses / spit / balls_out flavour distinct on card | ☐ |
| B-H3 | Near-miss spit flash so player can say “holes are unfair” | ☐ |

### Challenge / mobile
| # | Punch | Done? |
|---|-------|:-----:|
| B-C1 | `Beat my Ball Toss rack {n} on Penny Fever` | ☐ |
| B-M1 | Drag-aim + pull power works with thumb; no hover depend | ☐ |
| B-M2 | Trajectory ghost light enough for 60fps; no canvas blowout | ☐ |

---

## 3) Coin Pusher (`coinpusher` · GreedFloor)

### Feel bugs
| # | Punch | Spec / symptom | Done? |
|---|-------|----------------|:-----:|
| C-P1 | **CASH OUT** vs **DROP AGAIN** both loud primary buttons | Feel C-F2 | ☐ |
| C-P2 | Cash-out = `cashedOut:true` souvenir — NOT death flavour | Accept C1/C2 | ☐ |
| C-P3 | Floor≥2 buried death: shelf wiped + tray gain 0 | BATCH01 | ☐ |
| C-P4 | Floor≥5 avalanche chance after drop | Mount | ☐ |
| C-P5 | bankTarget / pusherSpeed climb per `pusherFloor(n)` | Mount | ☐ |
| C-P6 | First minute teaches DROP → push → tray without wall of text | Feel C-F1 | ☐ |

### HUD / death clarity
| # | Punch | Done? |
|---|-------|:-----:|
| C-H1 | `FLOOR {n}` + banked + tray preview | ☐ |
| C-H2 | Result distinguishes buried death vs cash-out walk | ☐ |
| C-H3 | Avalanche telegraph (shelf shudder) before wipe | ☐ |

### Challenge / mobile
| # | Punch | Done? |
|---|-------|:-----:|
| C-C1 | `Beat my Coin Pusher floor {n} on Penny Fever` | ☐ |
| C-M1 | Drop + cash-out buttons thumb-reachable; no overlap | ☐ |
| C-M2 | Physics stable on mid phone; no coin tunnel through shelf | ☐ |

---

## 4) Pinball Alley (`pinball` · Custom)

### Feel bugs
| # | Punch | Spec / symptom | Done? |
|---|-------|----------------|:-----:|
| P-P1 | 1 ball / coin; drain = immediate death | BATCH01 | ☐ |
| P-P2 | Half-screen L/R flippers fair; drain feels player fault | Feel P-F1 | ☐ |
| P-P3 | Chapter clear → depth++ · fanfare · brief safe plunge | Accept P2 | ☐ |
| P-P4 | Mission table Ch1–n wired (bumpers → spinner → sink…) | Sheet | ☐ |
| P-P5 | Speed mult climbs (cap ~1.7); bumper values climb | Accept P4 | ☐ |
| P-P6 | No 3-ball credit on Depth-run path | Accept P8 | ☐ |

### HUD / death clarity
| # | Punch | Done? |
|---|-------|:-----:|
| P-H1 | Backglass / HUD `CHAPTER {n}` readable mid-play | Feel P-F2 | ☐ |
| P-H2 | Mission progress pips (e.g. bumpers hit) visible | ☐ |
| P-H3 | Drain deathReason `"drain"` + Aura line; no soft “ball saved” | ☐ |

### Challenge / mobile
| # | Punch | Done? |
|---|-------|:-----:|
| P-C1 | `Beat my Pinball chapter {n} on Penny Fever` | ☐ |
| P-M1 | Flipper zones ≥ half-width each; multitouch both sides | ☐ |
| P-M2 | Decent player survives ≥60s; no frame-drop on bumper storms | ☐ |

---

## Order of attack
1. Love feel bugs L-P1–P6 + death clarity L-H*
2. Ball Toss miss/spit B-P1–P3 + HUD B-H*
3. Coin Pusher cash-out dilemma C-P1–P2 + buried death C-P3
4. Pinball drain + chapter HUD P-P1–P3 + P-H*
5. Shared S-P* + all challenge copy + mobile pass

## Sign-off

| Cabinet | Feel ☑ | HUD/death ☑ | Challenge+mobile ☑ | Signer | Date (Darwin) |
|---------|:------:|:-----------:|:------------------:|--------|---------------|
| love | ☐ | ☐ | ☐ | | |
| balltoss | ☐ | ☐ | ☐ | | |
| coinpusher | ☐ | ☐ | ☐ | | |
| pinball | ☐ | ☐ | ☐ | | |

**Ship rule:** Shared S-P1–S-P8 + that cabinet’s rows ☑ before foyer `Depth run` tag and before gameId enters Fever Run pool. Prefer this pass over new stall art.
