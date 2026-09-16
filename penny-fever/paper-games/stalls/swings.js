/*
 * Skyward Swings (Hugo) — Ride & Seek stall
 *
 * SHIPPED: Ch1 Lit Reach + Ch2 Ribbon Round + Ch3 Star Circles + Ch4 Cloud Waltz
 *   + Ch5 Bell Flight + Ch6 The Midnight Waltz — complete.
 *   Rainbow Islands pop energy on a Tempest circle. Chair carousel auto-orbits
 *   Hugo’s tower. ONE verb: HOLD to stretch radius outward; RELEASE tucks in.
 *   Vertical drag has no gameplay meaning; chair height is visual only.
 *   Targets are star-bubbles / lanterns on radius bands. Green “lined up” lit
 *   state fires BEFORE the catch window (Hold-the-Line SAFE). Catch = POP burst
 *   (flash + sparks + fly-home), not a silent ring pass. Ease ~620 ms between
 *   adjacent bands, no snap. Unique court (swings.png) is hero — never
 *   full-canvas overpaint. Tagline: Swing wide. Catch the night.
 *
 *   Ch1 First Swing — Lit Reach: two bands (inner / outer), 4 bubbles, long
 *     approaches (~1.8 s), no forced pushes. HOLD→POP PASS locked.
 *   Ch2 Ribbon Round: three bands (inner / middle / outer); GOAL 3; ~52 s;
 *     ONE teach ribbon gate alone (long warn ~7.5 s) then two normal bubbles;
 *     soft ribbon miss pushes one band inward — never aborts paid ride.
 *   Ch3 Star Circles: three bands; GOAL 3; ~52 s; ONE smooth-line teach alone —
 *     short outer-band sequence (long warn ~7.5 s) + coaching “Hold the line”;
 *     later a single POP on another band. Soft leave mid-sequence coaches +
 *     soft-push — never aborts. Light streak juice under verb chrome.
 *   Ch4 Cloud Waltz: three bands; GOAL 3; ~67 s; ONE cloud-teach on OUTER
 *     alone (long warn ~10 s, HOLD scream-clear) — clouds hide the teach;
 *     then 3 outer HOLD clearLong POPs (#2/#3 + makeup, approach ≥8 s,
 *     catch ×2.2 / makeup ×2.5). Soft-miss teach arms auto-line assist
 *     (snap outer while HOLD) + short soft-push (~0.25 s) — never aborts.
 *     Treasure = outer (taught). HUD stays N/3.
 *   Ch5 Bell Flight: three bands; GOAL 3 (goalCap 3, HUD forced N/3); ~67 s;
 *     ONE high→outer teach alone (long warn ~10 s, HOLD scream-clear) — bell
 *     pitch/symbol maps to bands; then 3 outer HOLD clearLong POPs (#2/#3 +
 *     makeup, clearLong approach ≥10 s, catch teach/clears ×2.5 / makeup ×2.8).
 *     Soft-miss teach arms ch5Assist auto-line snap while HOLD + short
 *     soft-push (~0.25 s) — never aborts. Treasure = outer (taught).
 *   Ch6 The Midnight Waltz: three bands; GOAL 3 (goalCap 3, HUD forced N/3);
 *     ~67 s; fair remix — ONE high→outer teach alone (long warn ~10 s,
 *     scream “Midnight — HOLD outer”); then #2 outer clearLong HOLD,
 *     #3 outer cloud (returning), #4 outer makeup clearLong. Soft-miss
 *     teach arms ch6Assist snap outer while HOLD + short soft-push
 *     (~0.25 s) — never aborts. Treasure = outer, one full warning circuit.
 */
import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
  prefersReducedMotion,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'swings';
const TREASURES = ['swing-spinner', 'heart-gear', 'star-token', 'prize-bag', 'music-carousel', 'ride-ticket'];
const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
const LEVELS = [
  'First Swing', 'Ribbon Round', 'Star Circles',
  'Cloud Waltz', 'Bell Flight', 'The Midnight Waltz',
];

const CX = 450;
const CY = 392;           // Hugo’s painted tower on swings.png
const SQUASH = 0.62;      // platform foreshortening
const INNER_R = 148;
const OUTER_R = 292;
const MIDDLE_R = (INNER_R + OUTER_R) * 0.5; // radiusU 0.5
const EASE_SEC = 0.62;    // 620 ms between adjacent bands (500–700, no snap)
const OMEGA = 0.84;       // rad/s — lit windows stay identical in reduced motion
const TAU = Math.PI * 2;
const GOAL_CH1 = 4;
const GOAL_CH2 = 3;
const GOAL_CH3 = 3;
const GOAL_CH4 = 3;
const GOAL_CH5 = 3;
const GOAL_CH6 = 3;
const CATCH_HALF = 0.34;  // rad sweep window (~0.40 s at OMEGA)
const APPROACH = 1.55;    // rad of visible approach (~1.8 s) — Ch1 / normal bubbles
const RIBBON_WARN_SEC = 7.5; // Ch2 teach ribbon long warn (helter cushion bar)
const LINE_WARN_SEC = 7.5;   // Ch3 smooth-line teach long warn (helter Tunnel Turn bar)
const CLOUD_WARN_SEC = 10;   // Ch4 cloud teach long warn (Aura soft-miss cushion)
const CLOUD_APPROACH_SEC = 5.0; // Ch4 non-teach cloud approach (fogged under ~5.0 s)
const CLOUD_CLEAR_APPROACH_SEC = 8.0; // Ch4 clear #2/#3 approach ≥8 s
const CLOUD_MAKEUP_APPROACH_SEC = 8.0; // Ch4 makeup #4 approach ≥8 s
const SOFT_PUSH_SEC_CH4 = 0.25; // Ch4 soft-push lock — HOLD resumes immediately
const BELL_WARN_SEC = 10; // Ch5 teach bell long warn
const BELL_CLEAR_APPROACH_SEC = 10.0; // Ch5 #2/#3 clearLong approach ≥10 s
const BELL_MAKEUP_APPROACH_SEC = 8.0; // Ch5 makeup #4 approach ≥8 s
const SOFT_PUSH_SEC_CH5 = 0.25; // Ch5 soft-push lock — HOLD resumes immediately
const MIDNIGHT_WARN_SEC = 10; // Ch6 teach alone long warn
const MIDNIGHT_CLEAR_APPROACH_SEC = 10.0; // Ch6 #2/#3 clearLong / returning cloud ≥10 s
const MIDNIGHT_MAKEUP_APPROACH_SEC = 8.0; // Ch6 makeup #4 approach ≥8 s
const MIDNIGHT_CLOUD_CATCH = 2.5; // Ch6 returning cloud catch multiplier
const SOFT_PUSH_SEC_CH6 = 0.25; // Ch6 soft-push lock — HOLD resumes immediately
const FINISH_THETA_CH1 = 3.12 * TAU; // land after the fourth bubble
const FINISH_THETA_CH2 = 6.85 * TAU; // ~51.5 s first-play window for 3/3
const FINISH_THETA_CH3 = 6.85 * TAU; // ~51.5 s — helter Ch3 ~52 s bar
const FINISH_THETA_CH4 = 9.0 * TAU; // ~67.3 s — makeup always finishes before land
const FINISH_THETA_CH5 = 9.0 * TAU; // ~67.3 s — Ch5 makeup finishes before land
const FINISH_THETA_CH6 = 9.0 * TAU; // ~67.3 s — Ch6 makeup finishes before land
const FLASH_SEC = 0.28;   // POP bloom
const MISS_FLASH = 0.22;
const FLY_DUR = 0.62;
const SOFT_PUSH_SEC = 0.55; // ignore lean while soft-push eases inward
const PURSE = {x: 86, y: 72};
const PRIZE_CORNER = {x: 792, y: 78};

// Lit Reach / Ribbon Round palette — green lined-up, gold idle, cool miss, warm POP, ribbon
const GREEN = '#5ee08a';
const GREEN_SOFT = '#7ef0a8';
const GOLD = '#f4d590';
const GOLD_DIM = '#d2a65b';
const COOL = '#8ec8e8';
const CREAM = '#fff6d8';
const RIBBON = '#c45a7a';
const RIBBON_SOFT = '#e88aaa';
const LINE_CREAM = '#ffe6a4'; // streak juice — Cream Tap feel, under chrome
const CLOUD_TEAL = '#7ec8c0'; // soft cloud fog
const CLOUD_SOFT = '#a8e0d8';
const BELL_GOLD = '#e8c878'; // bell silhouette / pitch bars
const BELL_SOFT = '#ffe6a4';
const MIDNIGHT_SOFT = '#c8b8e8'; // Ch6 scream-clear plate

const SPAWNS = ['inner', 'outer'];

/** Chapter 1: two bands, alternating inner/outer, long approaches, no pushes. */
function ch1Bubbles() {
  return [
    {theta: 0.92 * TAU, band: 0, taken: false}, // inner — after a learning lap
    {theta: 1.58 * TAU, band: 1, taken: false}, // outer
    {theta: 2.24 * TAU, band: 0, taken: false}, // inner
    {theta: 2.90 * TAU, band: 1, taken: false}, // outer
  ];
}

/**
 * Chapter 2 Ribbon Round: ONE teach ribbon on middle alone (long warn),
 * then two normal star-bubbles (inner, outer). GOAL 3. Soft miss recoverable
 * for ride continuity (never aborts).
 */
function ch2Bubbles() {
  return [
    {theta: 1.55 * TAU, band: 1, taken: false, ribbon: true, teach: true}, // middle ribbon gate
    {theta: 3.45 * TAU, band: 0, taken: false}, // inner star-bubble
    {theta: 5.25 * TAU, band: 2, taken: false}, // outer star-bubble
  ];
}

/**
 * Chapter 3 Star Circles: ONE smooth-line teach alone — short outer-band
 * pair (long warn on first) so the player HOLDs and keeps the line; then one
 * normal inner POP. GOAL 3. Soft leave mid-sequence never aborts.
 */
function ch3Bubbles() {
  return [
    {theta: 1.45 * TAU, band: 2, taken: false, line: true, teach: true}, // outer — long warn teach
    {theta: 2.20 * TAU, band: 2, taken: false, line: true}, // outer — keep the line
    {theta: 4.40 * TAU, band: 0, taken: false}, // inner — later single on another band
  ];
}

/**
 * Chapter 4 Cloud Waltz: ONE cloud-teach on OUTER alone (long warn ~10 s) — HOLD
 * scream-clear with verb chrome; bubble fogged by soft cloud; band shadow /
 * platform glint reveals the band first. Then THREE outer HOLD clearLong
 * star-bubbles (#2/#3 + makeup, approach ≥8 s) — recovery is HOLD-only
 * (no inner RELEASE). Soft teach miss arms ch4Assist auto-line snap while
 * HOLD so POPs land; soft miss recoverable (never aborts). Treasure = outer.
 * HUD N/3.
 */
function ch4Bubbles() {
  return [
    {theta: 1.55 * TAU, band: 2, taken: false, cloud: true, teach: true}, // #1 outer cloud+teach — 10s warn, catch ×2.2
    {theta: 3.60 * TAU, band: 2, taken: false, clearLong: true}, // #2 outer clearLong — HOLD, catch ×2.2, approach ≥8s
    {theta: 5.50 * TAU, band: 2, taken: false, clearLong: true}, // #3 outer clearLong — HOLD, same
    {theta: 7.20 * TAU, band: 2, taken: false, clearLong: true, makeup: true}, // #4 outer makeup — approach ≥8s, catch ×2.5
  ];
}

/**
 * Chapter 5 Bell Flight: ONE high→outer teach alone (long warn ~10 s) — bell
 * pitch/symbol maps to bands (low/mid/high → inner/middle/outer). Then THREE
 * outer HOLD clearLong bell-bubbles (#2/#3 + makeup, clearLong approach ≥10 s)
 * — recovery is HOLD-only (no inner RELEASE). Soft teach miss arms ch5Assist
 * auto-line snap while HOLD so POPs land; soft miss recoverable (never
 * aborts). Treasure = outer (taught). HUD forced N/3 (goalCap 3). GOAL 3 with
 * 4 bubbles so one soft miss still allows Practice complete.
 */
function ch5Bubbles() {
  return [
    {theta: 1.55 * TAU, band: 2, taken: false, bell: 'high', teach: true}, // #1 outer high teach — 10s warn, catch ×2.5
    {theta: 3.60 * TAU, band: 2, taken: false, bell: 'high', clearLong: true}, // #2 outer high — HOLD, catch ×2.5, approach ≥10s
    {theta: 5.50 * TAU, band: 2, taken: false, bell: 'high', clearLong: true}, // #3 outer high — HOLD, same
    {theta: 7.20 * TAU, band: 2, taken: false, bell: 'high', clearLong: true, makeup: true}, // #4 outer high makeup — catch ×2.8
  ];
}

/**
 * Chapter 6 The Midnight Waltz: fair remix of taught patterns (do NOT stack
 * max difficulty). ONE high→outer teach alone (long warn ~10 s) — scream
 * “Midnight — HOLD outer”. Then light combination: #2 outer clearLong HOLD
 * (reinforce); #3 outer cloud (one returning mechanic); #4 outer makeup
 * clearLong HOLD. GOAL 3 with 4 bubbles so one soft miss still allows
 * Practice complete. Soft teach miss arms ch6Assist auto-line snap while
 * HOLD; soft miss recoverable (never aborts). Treasure = outer, one full
 * warning circuit. HUD forced N/3 (goalCap 3).
 */
function ch6Bubbles() {
  return [
    {theta: 1.55 * TAU, band: 2, taken: false, bell: 'high', teach: true, midnight: true}, // #1 outer HIGH teach alone — 10s, Midnight HOLD
    {theta: 3.60 * TAU, band: 2, taken: false, clearLong: true, midnight: true}, // #2 outer clearLong HOLD reinforce
    {theta: 5.50 * TAU, band: 2, taken: false, cloud: true, clearLong: true, midnight: true}, // #3 outer cloud returning (not stacked with bell)
    {theta: 7.20 * TAU, band: 2, taken: false, clearLong: true, makeup: true, midnight: true}, // #4 outer makeup clearLong
  ];
}

function reducedOf(s) {
  if (typeof prefersReducedMotion === 'function') {
    try { if (prefersReducedMotion()) return true; } catch { /* fall through */ }
  }
  return !!s.reduced;
}

function pageHidden() {
  try {
    if (typeof document === 'undefined') return false;
    return !!(document.hidden || document.visibilityState === 'hidden');
  } catch {
    return false;
  }
}

function isThree(s) {
  return !!(s && s.threeBand);
}

function isStarCircles(s) {
  return !!(s && s.starCircles);
}

function isCloudWaltz(s) {
  return !!(s && s.cloudWaltz);
}

function isBellFlight(s) {
  return !!(s && s.bellFlight);
}

function isMidnightWaltz(s) {
  return !!(s && s.midnightWaltz);
}

/** Bell pitch → band: low=0 inner, mid=1 middle, high=2 outer. */
function bellToBand(bell) {
  if (bell === 'low') return 0;
  if (bell === 'mid') return 1;
  return 2;
}

function bellPitchBars(bell) {
  if (bell === 'low') return 1;
  if (bell === 'mid') return 2;
  return 3;
}

function bellVerbHint(bell) {
  if (bell === 'low') return 'RELEASE inner';
  if (bell === 'mid') return 'HOLD/RELEASE middle';
  return 'HOLD outer';
}

function finishThetaOf(s) {
  return s.finishTheta != null ? s.finishTheta : FINISH_THETA_CH1;
}

function bandRadius(band, three) {
  if (!three) return band ? OUTER_R : INNER_R;
  if (band <= 0) return INNER_R;
  if (band === 1) return MIDDLE_R;
  return OUTER_R;
}

function radiusAt(u) {
  return INNER_R + clamp(u, 0, 1) * (OUTER_R - INNER_R);
}

function orbitPoint(angle, radius) {
  return {
    x: CX + Math.cos(angle) * radius,
    y: CY + Math.sin(angle) * radius * SQUASH,
  };
}

function depthOf(angle) {
  // 0 = behind the tower, 1 = swinging toward the cream court.
  return 0.5 + 0.5 * Math.sin(angle);
}

/** Discrete band from radiusU. Ch1: 2 bands. Ch2: 3 bands at 0 / 0.5 / 1. */
function currentBand(u, three) {
  if (!three) return u >= 0.5 ? 1 : 0;
  if (u < 0.25) return 0;
  if (u < 0.75) return 1;
  return 2;
}

function bandToU(band, three) {
  if (!three) return band ? 1 : 0;
  if (band <= 0) return 0;
  if (band === 1) return 0.5;
  return 1;
}

function bandLabel(band, three) {
  if (!three) return band ? 'outer' : 'inner';
  if (band <= 0) return 'inner';
  if (band === 1) return 'middle';
  return 'outer';
}


/** Catch half: Ch5 teach/clears ×2.5, makeup ×2.8; Ch4 teach/clearLong ×2.2, makeup ×2.5;
 * Ch6 midnight clearLong/cloud ×2.5, makeup ×2.8. Ch1–3 untouched. */
function catchHalfOf(bubble) {
  if (bubble && bubble.midnight) {
    if (bubble.makeup) return CATCH_HALF * 2.8;
    if (bubble.teach) return CATCH_HALF * 2.5;
    if (bubble.cloud && bubble.clearLong) return CATCH_HALF * MIDNIGHT_CLOUD_CATCH;
    if (bubble.clearLong) return CATCH_HALF * 2.5;
    return CATCH_HALF * 2.5;
  }
  if (bubble && bubble.bell) {
    if (bubble.makeup) return CATCH_HALF * 2.8;
    if (bubble.teach) return CATCH_HALF * 2.5;
    if (bubble.clearLong) return CATCH_HALF * 2.5;
    return CATCH_HALF * 2.5;
  }
  if (bubble && bubble.cloud && bubble.teach) return CATCH_HALF * 2.2;
  if (bubble && bubble.makeup) return CATCH_HALF * 2.5;
  if (bubble && bubble.cloud) return CATCH_HALF * 1.15;
  if (bubble && bubble.clearLong) return CATCH_HALF * 2.2;
  return CATCH_HALF;
}

function approachOf(bubble) {
  if (bubble && bubble.midnight && bubble.teach) {
    return MIDNIGHT_WARN_SEC * OMEGA; // ~8.4 rad ≈ 10 s midnight teach alone
  }
  if (bubble && bubble.midnight && bubble.makeup) {
    return MIDNIGHT_MAKEUP_APPROACH_SEC * OMEGA; // ~6.72 rad ≈ 8.0 s makeup
  }
  if (bubble && bubble.midnight && bubble.cloud && bubble.clearLong) {
    return MIDNIGHT_CLEAR_APPROACH_SEC * OMEGA; // ~8.4 rad ≈ 10 s returning cloud
  }
  if (bubble && bubble.midnight && bubble.clearLong) {
    return MIDNIGHT_CLEAR_APPROACH_SEC * OMEGA; // ~8.4 rad ≈ 10 s clearLong
  }
  if (bubble && bubble.bell && bubble.teach) {
    return BELL_WARN_SEC * OMEGA; // ~8.4 rad ≈ 10 s bell teach
  }
  if (bubble && bubble.bell && bubble.makeup) {
    return BELL_MAKEUP_APPROACH_SEC * OMEGA; // ~6.72 rad ≈ 8.0 s makeup
  }
  if (bubble && bubble.bell) {
    return BELL_CLEAR_APPROACH_SEC * OMEGA; // ~8.4 rad ≈ 10.0 s clearLong
  }
  if (bubble && bubble.ribbon && bubble.teach) {
    return RIBBON_WARN_SEC * OMEGA; // ~6.3 rad ≈ 7.5 s long warn
  }
  if (bubble && bubble.line && bubble.teach) {
    return LINE_WARN_SEC * OMEGA; // ~6.3 rad ≈ 7.5 s smooth-line teach
  }
  if (bubble && bubble.cloud && bubble.teach) {
    return CLOUD_WARN_SEC * OMEGA; // ~8.4 rad ≈ 10 s cloud teach
  }
  if (bubble && bubble.cloud) {
    return CLOUD_APPROACH_SEC * OMEGA; // ~4.2 rad ≈ 5.0 s non-teach cloud
  }
  if (bubble && bubble.makeup) {
    return CLOUD_MAKEUP_APPROACH_SEC * OMEGA; // ~6.72 rad ≈ 8.0 s makeup
  }
  if (bubble && bubble.clearLong) {
    return CLOUD_CLEAR_APPROACH_SEC * OMEGA; // ~6.72 rad ≈ 8.0 s Ch4 clears
  }
  return APPROACH;
}

/** Ahead angle of a fixed world target relative to the chair. */
function aheadOf(s, theta) {
  return theta - s.theta;
}

/**
 * Green “lined up” lit — chair already on the target’s band while the
 * bubble/lantern is in approach (before + through the catch window).
 * Middle lights when radiusU near 0.5. Same windows in reduced motion.
 */
function isLinedUp(s, band, theta, approach) {
  const ahead = aheadOf(s, theta);
  const ap = approach != null ? approach : APPROACH;
  if (ahead > ap || ahead < -CATCH_HALF) return false;
  return currentBand(s.radiusU, isThree(s)) === band;
}

function setLean(s, on) {
  if (s.pushUntil != null && s.t < s.pushUntil) return; // soft-push owns the ease
  const next = !!on;
  if (s.holding === next) return;
  s.holding = next;
  const dest = next ? 1 : 0; // HOLD → outer (1); RELEASE → inner (0); middle via ease
  if (s.easeTo !== dest) {
    s.easeFrom = s.radiusU;
    s.easeTo = dest;
    s.easeT = 0;
  }
  if (next) s.leanCue = 0.35;
  logAction(s, 'lean', {on: next});
}

function refreshLean(s, input) {
  if (pageHidden() || s.backgrounded) {
    s.holdPointer = false;
    s.holdAction = false;
    setLean(s, false);
    return;
  }
  if (s.pushUntil != null && s.t < s.pushUntil) {
    s.holding = false;
    return;
  }
  const fromInput = !!(input?.actions?.has?.('lean') || input?.down);
  setLean(s, !!(s.holdPointer || s.holdAction || fromInput));
}

/** Soft fail: ease one discrete band inward; ride continues. */
function softPushInward(s) {
  const three = isThree(s);
  const cur = currentBand(s.radiusU, three);
  const next = Math.max(0, cur - 1);
  const dest = bandToU(next, three);
  s.easeFrom = s.radiusU;
  s.easeTo = dest;
  s.easeT = 0;
  s.holding = false;
  s.pushUntil = s.t + (isMidnightWaltz(s)
    ? SOFT_PUSH_SEC_CH6
    : ((isCloudWaltz(s) || isBellFlight(s)) ? (isBellFlight(s) ? SOFT_PUSH_SEC_CH5 : SOFT_PUSH_SEC_CH4) : SOFT_PUSH_SEC));
  logAction(s, 'soft-push', {from: cur, to: next});
}

function pushFly(s, id, x, y, prize) {
  s.fly = s.fly || [];
  s.fly.push({id, x, y, t: 0, dur: FLY_DUR, prize: !!prize});
}

/** Rainbow Islands POP — warm burst. Cool = miss flash, quieter. */
function pushBurst(s, x, y, cool) {
  s.sparks = s.sparks || [];
  const n = cool ? 6 : 12;
  for (let i = 0; i < n; i++) {
    const a = (TAU * i) / n + (cool ? 0.15 : s.t * 0.4);
    const sp = cool ? 48 : 110;
    s.sparks.push({
      x, y,
      vx: Math.cos(a) * sp * (0.7 + (i % 3) * 0.15),
      vy: Math.sin(a) * sp * SQUASH * (0.7 + (i % 3) * 0.15),
      t: 0,
      dur: cool ? 0.3 : 0.48,
      cool: !!cool,
      r: cool ? 2.6 : 3.8,
      pop: !cool,
    });
  }
  if (!cool) {
    // Inner star shards for the POP read
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (TAU / 5);
      s.sparks.push({
        x, y,
        vx: Math.cos(a) * 55,
        vy: Math.sin(a) * 55 * SQUASH,
        t: 0,
        dur: 0.36,
        cool: false,
        r: 2.2,
        pop: true,
      });
    }
  }
}

function spawnTreasure(s) {
  if (!s.eligible || s.treasure) return;
  const three = isThree(s);
  // Ch3/Ch4/Ch5: outer (taught). Ch2: middle (taught). Ch1: spawn lane.
  let band;
  if (isStarCircles(s) || isCloudWaltz(s) || isBellFlight(s) || isMidnightWaltz(s)) {
    band = 2; // Star Circles / Cloud / Bell / Midnight teach — outer
  } else if (three) {
    band = 1; // Ribbon teach — middle reachable
  } else {
    band = s.spawnId === 'inner' ? 0 : 1;
  }
  const finish = finishThetaOf(s);
  // Visible for a full circuit (green warning), then POP-swept on same angle.
  // Ch4/Ch5/Ch6: warn/sweep after makeup #4 (7.20τ); long outer warn before land at 9.0τ.
  const longTreasure = isCloudWaltz(s) || isBellFlight(s) || isMidnightWaltz(s);
  const warnTheta = longTreasure ? 7.55 * TAU : (three ? 5.55 * TAU : 1.02 * TAU);
  const sweepTheta = longTreasure ? 8.55 * TAU : (three ? 6.55 * TAU : 2.02 * TAU);
  if (sweepTheta > finish - 0.15) return; // keep land window clear
  s.treasure = {
    id: s.treasureId,
    band,
    warnTheta,
    sweepTheta,
    taken: false,
  };
}

function tryPopBubble(s, bubble, i) {
  if (bubble.taken) return;
  const d = s.theta - bubble.theta;
  const half = catchHalfOf(bubble);
  if (d < -half || d > half) return;
  if (currentBand(s.radiusU, isThree(s)) !== bubble.band) return;
  bubble.taken = true;
  bubble.flash = FLASH_SEC;
  bubble.lit = false;
  s.passed += 1;
  const findId = ORDINARY[s.passed % ORDINARY.length];
  recordFind(s, findId, RIDE);
  logAction(s, 'bubble', {
    band: bubble.band,
    i,
    passed: s.passed,
    pop: true,
    ribbon: !!bubble.ribbon,
    line: !!bubble.line,
    cloud: !!bubble.cloud,
    bell: bubble.bell || null,
  });
  const p = orbitPoint(bubble.theta, bandRadius(bubble.band, isThree(s)));
  pushFly(s, findId, p.x, p.y, false);
  pushBurst(s, p.x, p.y, false);
  s.popFlash = FLASH_SEC;
  if (bubble.line) {
    s.lineStreak = (s.lineStreak || 0) + 1;
    if (s.lineStreak >= 2) s.streakJuice = 0.55; // Cream Tap feel — light only
    s.note = s.lineStreak >= 2
      ? 'Line held! ' + s.passed + ' / ' + s.goal
      : 'POP! Hold the line — ' + s.passed + ' / ' + s.goal;
  } else if (bubble.ribbon) {
    s.lineStreak = 0;
    s.note = 'Ribbon POP! ' + s.passed + ' / ' + s.goal;
  } else if (bubble.midnight) {
    s.lineStreak = 0;
    const g = GOAL_CH6;
    const n = Math.min(s.passed, g);
    s.note = bubble.teach
      ? 'Midnight POP! HOLD outer — ' + n + ' / ' + g
      : (bubble.cloud
        ? 'Cloud POP! Midnight — ' + n + ' / ' + g
        : 'Midnight POP! ' + n + ' / ' + g);
  } else if (bubble.cloud) {
    s.lineStreak = 0;
    s.note = bubble.teach
      ? 'Cloud POP! Watch the shadow — ' + s.passed + ' / ' + s.goal
      : 'Cloud POP! ' + s.passed + ' / ' + s.goal;
  } else if (bubble.bell) {
    s.lineStreak = 0;
    const g = GOAL_CH5;
    const n = Math.min(s.passed, g);
    s.note = bubble.teach
      ? 'Bell POP! Match the pitch — ' + n + ' / ' + g
      : 'Bell POP! ' + n + ' / ' + g;
  } else {
    s.lineStreak = 0;
    s.note = 'POP! ' + s.passed + ' / ' + s.goal;
  }
  s.notePinUntil = s.t + 1.6;
}

function trySweepTreasure(s) {
  const tr = s.treasure;
  if (!tr || tr.taken) return;
  if (s.theta < tr.warnTheta) return;
  s.treasureRevealed = true;
  const d = s.theta - tr.sweepTheta;
  if (d < -CATCH_HALF || d > CATCH_HALF * 1.4) return;
  if (currentBand(s.radiusU, isThree(s)) !== tr.band) return;
  tr.taken = true;
  tr.flash = FLASH_SEC;
  recordTreasure(s, tr.id);
  logAction(s, 'treasure', {band: tr.band, id: tr.id, pop: true});
  const p = orbitPoint(tr.sweepTheta, bandRadius(tr.band, isThree(s)));
  pushFly(s, tr.id, p.x, p.y, true);
  pushBurst(s, p.x, p.y, false);
  s.popFlash = FLASH_SEC;
  s.note = 'The aerial keepsake — POP!';
}

function tickFx(s, dt) {
  if (s.leanCue > 0) s.leanCue = Math.max(0, s.leanCue - dt);
  if (s.screenFlash > 0) s.screenFlash = Math.max(0, s.screenFlash - dt);
  if (s.popFlash > 0) s.popFlash = Math.max(0, s.popFlash - dt);
  if (s.streakJuice > 0) s.streakJuice = Math.max(0, s.streakJuice - dt);
  s.bubbles.forEach((b) => {
    if (b.flash > 0) b.flash = Math.max(0, b.flash - dt);
    if (b.missFlash > 0) b.missFlash = Math.max(0, b.missFlash - dt);
  });
  if (s.treasure?.flash > 0) s.treasure.flash = Math.max(0, s.treasure.flash - dt);
  if (s.fly) {
    for (const f of s.fly) f.t += dt;
    s.fly = s.fly.filter((f) => f.t < f.dur);
  }
  if (s.sparks) {
    for (const sp of s.sparks) {
      sp.t += dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vx *= 0.9;
      sp.vy *= 0.9;
    }
    s.sparks = s.sparks.filter((sp) => sp.t < sp.dur);
  }
}

function drawStar(d, x, y, r, fill, stroke) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  d.poly(pts, fill || GOLD, stroke || GOLD_DIM, 1.5);
}

/** Star-bubble / lantern — soft globe with star core; green when lined up. */
function drawBubble(d, x, y, depth, lit, flash, miss) {
  const r = 18 + depth * 7;
  if (flash > 0) {
    const bloom = 1 + (flash / FLASH_SEC) * 1.1;
    d.glow(x, y, 56 * bloom, CREAM);
    d.circle(x, y, r * bloom, '#ffe6a4cc', CREAM, 5);
    drawStar(d, x, y, 12 + depth * 3, CREAM, GOLD);
    // POP ring expanding
    d.circle(x, y, r * (1.4 + (1 - flash / FLASH_SEC) * 1.6), null, '#ffe6a488', 3);
    return;
  }
  if (miss > 0) {
    d.glow(x, y, 40, COOL);
    d.circle(x, y, r, '#8ec8e844', COOL, 4);
    drawStar(d, x, y, 9 + depth * 3, '#c8e4f0', '#6a90b8');
    return;
  }
  if (lit) {
    // Hold-the-Line SAFE: green lined-up BEFORE the catch
    d.glow(x, y, 44 + depth * 8, GREEN);
    d.circle(x, y, r + 4, '#5ee08a33', GREEN, 5);
    d.circle(x, y, r, '#7ef0a866', GREEN_SOFT, 3.2);
    drawStar(d, x, y, 10 + depth * 3, CREAM, GREEN);
    d.text('lined up', x, y - r - 14, 14, GREEN_SOFT);
    return;
  }
  // Idle approaching lantern — gold, readable, not scream-loud
  const pulse = 0.7 + 0.3 * Math.sin(depth * 6);
  d.glow(x, y, 22 + pulse * 10, GOLD);  // draw.glow appends alpha — 6-digit only
  d.circle(x, y, r, '#f4d59022', GOLD_DIM, 2.8);
  d.circle(x, y, r * 0.72, '#f8e4b344', GOLD, 1.6);
  drawStar(d, x, y, 8 + depth * 2.5, '#f8e4b3', GOLD_DIM);
}

/** Teach ribbon gate — burgundy arch on the target band; long warn glow. */
function drawRibbonGate(d, s, bubble, bank, lit, flash, miss) {
  const three = isThree(s);
  const rr = bandRadius(bubble.band, three);
  const p = orbitPoint(bubble.theta, rr);
  const x = p.x + bank * 0.4;
  const y = p.y;
  const depth = depthOf(bubble.theta);
  const ahead = aheadOf(s, bubble.theta);
  const warn = approachOf(bubble);
  const ramp = clamp(1 - ahead / Math.max(0.01, warn), 0, 1);

  if (flash > 0) {
    drawBubble(d, x, y, depth, false, flash, 0);
    return;
  }
  if (miss > 0) {
    d.glow(x, y, 48, COOL);
    drawBubble(d, x, y, depth, false, 0, miss);
    return;
  }

  // Ribbon streamers flanking the gate (paper-cut, not full-canvas)
  const half = 0.22 + ramp * 0.08;
  for (let side = -1; side <= 1; side += 2) {
    const a0 = bubble.theta + side * half;
    const a1 = bubble.theta + side * (half * 0.55);
    const outer = orbitPoint(a0, rr + 10);
    const inner = orbitPoint(a1, rr - 14);
    const mid = orbitPoint(bubble.theta + side * half * 0.75, rr + 2);
    d.poly(
      [
        [outer.x + bank * 0.2, outer.y],
        [mid.x + bank * 0.3, mid.y - 18],
        [inner.x + bank * 0.2, inner.y],
        [mid.x + bank * 0.3, mid.y + 10],
      ],
      lit ? '#5ee08a55' : '#c45a7a66',
      lit ? GREEN : RIBBON,
      lit ? 3.2 : 2.4,
    );
  }

  // Gate oval on the band
  d.ellipse(
    x, y,
    28 + ramp * 8, 16 + ramp * 4,
    lit ? '#5ee08a33' : '#c45a7a33',
    lit ? GREEN : RIBBON_SOFT,
    lit ? 4 : 2.6,
  );
  if (lit) {
    d.glow(x, y, 50 + depth * 6, GREEN);
    d.text('lined up', x, y - 36, 15, GREEN_SOFT);
  } else {
    d.glow(x, y, 28 + ramp * 22, RIBBON); // 6-digit only
  }
  drawStar(d, x, y, 9 + depth * 2, lit ? CREAM : '#f8d0e0', lit ? GREEN : RIBBON);
  d.text('ribbon', x, y + 30 + depth * 3, 14, lit ? GREEN_SOFT : RIBBON_SOFT);
  d.text(bandLabel(bubble.band, three), x, y + 46 + depth * 3, 13, lit ? GREEN_SOFT : '#ead6a4');
}


/** Cloud-hidden bubble — soft teal/cream fog until lined-up / near catch;
 *  band shadow + platform glint on the oval reveals the band first. */
function drawCloudBubble(d, s, bubble, bank, lit, flash, miss) {
  const three = isThree(s);
  const rr = bandRadius(bubble.band, three);
  const p = orbitPoint(bubble.theta, rr);
  const x = p.x + bank * 0.4;
  const y = p.y;
  const depth = depthOf(bubble.theta);
  const ahead = aheadOf(s, bubble.theta);
  const warn = approachOf(bubble);
  const ramp = clamp(1 - ahead / Math.max(0.01, warn), 0, 1);
  const nearCatch = ahead <= CATCH_HALF * 3; // reveal star sooner under fog
  const teachFog = !!bubble.teach;
  // Teach stays fully fogged until nearCatch/lit; non-teach uses lighter fog.
  const fogged = !!bubble.cloud && !lit && !nearCatch && !(flash > 0) && !(miss > 0);

  // Platform glint / band shadow on the oval — readable BEFORE the art clears
  const glintA = bubble.theta;
  for (let i = -2; i <= 2; i++) {
    const a = glintA + i * 0.07;
    const g = orbitPoint(a, rr);
    const pulse = 0.55 + 0.45 * Math.sin(s.t * 5 + i);
    d.circle(
      g.x + bank * 0.15, g.y,
      3.2 + ramp * 2.2 * pulse,
      lit ? '#5ee08acc' : '#7ec8c0cc',
      lit ? GREEN : CLOUD_TEAL,
      lit ? 2.2 : 1.6,
    );
  }
  d.ellipse(
    x, y + 10,
    34 + ramp * 10, 12 + ramp * 4,
    lit ? '#5ee08a33' : '#7ec8c044',
    lit ? GREEN_SOFT : CLOUD_SOFT,
    lit ? 3 : 2.2,
  );
  if (!lit) {
    d.glow(x, y + 8, 26 + ramp * 18, CLOUD_TEAL); // 6-digit only — band ring hint
  }

  if (flash > 0 || miss > 0 || lit || nearCatch) {
    drawBubble(d, x, y, depth, lit, flash || 0, miss || 0);
    if (!bubble.taken && !(miss > 0) && !(flash > 0)) {
      d.text(fogged ? 'watch the shadow' : (bubble.teach ? 'cloud teach' : 'cloud'), x, y + 30 + depth * 3, 13, lit ? GREEN_SOFT : CLOUD_SOFT);
      d.text(bandLabel(bubble.band, three), x, y + 46 + depth * 3, 12, lit ? GREEN_SOFT : '#ead6a4');
    }
    return;
  }

  // Fogged: soft teal/cream cloud puffs hide the star art
  // Teach = full fog; non-teach = lighter fog (clearer ghost + always bandLabel).
  const r = 18 + depth * 7;
  d.glow(x, y, (teachFog ? 42 : 30) + ramp * (teachFog ? 22 : 16), CLOUD_TEAL); // 6-digit only
  if (teachFog) {
    // faint ghost star under fog (barely readable)
    drawStar(d, x, y, 6 + depth * 1.5, '#f8e4b355', '#d2a65b55');
  } else {
    // clearer ghost star — readable under light fog
    drawStar(d, x, y, 8 + depth * 2, '#f8e4b3aa', '#d2a65baa');
  }
  const puffs = teachFog
    ? [[-20, -6, 22], [14, -10, 20], [-4, 8, 24], [22, 5, 17], [-24, 10, 16], [6, -18, 18], [0, 0, 20]]
    : [[-14, -4, 16], [10, -8, 14], [-2, 6, 18], [16, 4, 12], [-18, 8, 11], [4, -14, 13]];
  const puffFill = teachFog ? '#fff6d8cc' : '#fff6d855';
  const puffInner = teachFog ? '#7ec8c088' : '#7ec8c033';
  for (const [ox, oy, pr] of puffs) {
    const wob = Math.sin(s.t * 2.4 + ox * 0.1) * 2;
    d.ellipse(
      x + ox + wob * 0.3, y + oy,
      pr * (0.9 + ramp * 0.15), pr * 0.62,
      puffFill,
      CLOUD_TEAL,
      teachFog ? 1.8 : 1.1,
    );
    d.ellipse(
      x + ox * 0.7, y + oy * 0.8 + 2,
      pr * 0.55, pr * 0.4,
      puffInner,
      CLOUD_SOFT,
      1,
    );
  }
  d.text('Watch the shadow', x, y + (teachFog ? 42 : 36) + depth * 3, teachFog ? 16 : 13, teachFog ? CREAM : CLOUD_SOFT);
  // Always show bandLabel while fogged (non-teach clarity; teach keeps it too)
  d.text(bandLabel(bubble.band, three) + ' band', x, y + (teachFog ? 62 : 52) + depth * 3, teachFog ? 15 : 12, teachFog ? '#ffe6a4' : '#ead6a4');
}

/** Bell bubble — silhouette + pitch bars (1/2/3) map low/mid/high → bands. */
function drawBellBubble(d, s, bubble, bank, lit, flash, miss) {
  const three = isThree(s);
  const rr = bandRadius(bubble.band, three);
  const p = orbitPoint(bubble.theta, rr);
  const x = p.x + bank * 0.4;
  const y = p.y;
  const depth = depthOf(bubble.theta);
  const ahead = aheadOf(s, bubble.theta);
  const warn = approachOf(bubble);
  const ramp = clamp(1 - ahead / Math.max(0.01, warn), 0, 1);
  const pitch = bubble.bell || 'high';
  const bars = bellPitchBars(pitch);
  const teach = !!bubble.teach;

  if (flash > 0 || miss > 0) {
    drawBubble(d, x, y, depth, false, flash || 0, miss || 0);
    return;
  }

  // Pitch bars above bubble — 1 / 2 / 3 for low / mid / high
  const barBaseY = y - 34 - depth * 4;
  for (let i = 0; i < 3; i++) {
    const on = i < bars;
    const bx = x - 14 + i * 14;
    const bh = 8 + i * 5;
    d.poly(
      [[bx - 4, barBaseY], [bx + 4, barBaseY], [bx + 4, barBaseY - bh], [bx - 4, barBaseY - bh]],
      on ? (lit ? '#5ee08acc' : '#e8c878cc') : '#3a241866',
      on ? (lit ? GREEN : BELL_GOLD) : '#b78b4844',
      on ? 2.2 : 1.2,
    );
  }

  // Simple bell silhouette over the star-bubble
  const br = 16 + depth * 5;
  d.glow(x, y, lit ? (44 + depth * 8) : (24 + ramp * 16), lit ? GREEN : BELL_GOLD); // 6-digit only
  // Bell body
  d.ellipse(x, y + 2, br * 0.85, br * 0.7, lit ? '#5ee08a55' : '#e8c87855', lit ? GREEN : BELL_GOLD, lit ? 3.2 : 2.2);
  d.poly(
    [
      [x - br * 0.55, y + 4],
      [x + br * 0.55, y + 4],
      [x + br * 0.7, y + br * 0.85],
      [x - br * 0.7, y + br * 0.85],
    ],
    lit ? '#7ef0a866' : '#f4d59066',
    lit ? GREEN_SOFT : BELL_GOLD,
    2,
  );
  // Clapper
  d.circle(x, y + br * 0.95, 3.2, lit ? GREEN_SOFT : CREAM, lit ? GREEN : GOLD_DIM, 1.4);
  // Crown
  d.circle(x, y - br * 0.55, 3.6, lit ? '#5ee08a88' : '#e8c87888', lit ? GREEN : BELL_GOLD, 1.5);
  drawStar(d, x, y - 2, 7 + depth * 2, lit ? CREAM : '#f8e4b3', lit ? GREEN : GOLD_DIM);

  if (lit) {
    d.circle(x, y, br + 8, '#5ee08a22', GREEN, 4);
    d.text('lined up', x, y - br - 28, 14, GREEN_SOFT);
  }

  if (teach) {
    d.text('HIGH → OUTER · HOLD', x, y + br + 22, 15, lit ? GREEN_SOFT : BELL_SOFT);
    d.text(bandLabel(bubble.band, three), x, y + br + 40, 13, lit ? GREEN_SOFT : '#ead6a4');
  } else {
    const pitchLabel = (pitch + '').toUpperCase();
    d.text(pitchLabel + ' · ' + bellVerbHint(pitch), x, y + br + 22, 13, lit ? GREEN_SOFT : BELL_SOFT);
    d.text(bandLabel(bubble.band, three), x, y + br + 40, 12, lit ? GREEN_SOFT : '#ead6a4');
  }
}

/** Smooth-line teach guide — cream dashes on the held band (under verb chrome). */
function drawLineGuide(d, s, bank) {
  if (!isStarCircles(s)) return;
  const live = s.bubbles.filter((b) => b.line && !b.taken && !b.missed);
  if (!live.length) return;
  const teach = live.find((b) => b.teach) || live[0];
  const ahead = aheadOf(s, teach.theta);
  const warn = approachOf(teach);
  // Show while any line bubble is in/near approach, or streak juice is hot
  const inTeach = live.some((b) => {
    const a = aheadOf(s, b.theta);
    return a <= approachOf(b) + 0.4 && a > -CATCH_HALF;
  });
  if (!inTeach && !(s.streakJuice > 0)) return;
  const rr = bandRadius(teach.band, true);
  const ramp = inTeach ? clamp(1 - Math.max(0, ahead) / Math.max(0.01, warn), 0, 1) : 0.5;
  const juice = s.streakJuice > 0 ? s.streakJuice / 0.55 : 0;
  for (let i = 0; i < 10; i++) {
    const a = s.theta - 0.15 + i * 0.12;
    const p = orbitPoint(a, rr);
    const pulse = 0.55 + 0.45 * Math.sin(s.t * 6 + i);
    d.circle(
      p.x + bank * 0.25, p.y,
      2.2 + ramp * 1.4 + juice * 1.2 * pulse,
      juice > 0 ? LINE_CREAM : '#f4d590aa',
      juice > 0 ? CREAM : GOLD_DIM,
      1,
    );
  }
  if (juice > 0) {
    const chair = orbitPoint(s.theta, radiusAt(s.radiusU));
    d.glow(chair.x + bank, chair.y, 36 + juice * 20, LINE_CREAM); // 6-digit only
  }
}

function drawChain(d, ax, ay, bx, by, player) {
  const links = player ? 5 : 3;
  const w = player ? 2.4 : 1.3;
  d.line({x: ax, y: ay}, {x: bx, y: by}, GOLD_DIM, w);
  if (!player) return;
  for (let i = 1; i < links; i++) {
    const u = i / links;
    const x = ax + (bx - ax) * u;
    const y = ay + (by - ay) * u;
    d.circle(x, y, 2.4, '#c8964aaa', '#f0d09a', 1);
  }
}

function drawChair(d, x, y, scale, fly, depth, player, bank) {
  const w = 36 * scale;
  const kick = fly * 11 * scale;
  const tip = (bank || 0) * 0.018 * scale;
  const seatY = y;
  const chainTop = y - 78 * scale - (1 - depth) * 10;
  const left = x - w * 0.42 + kick - tip * 8;
  const right = x + w * 0.42 + kick + tip * 8;
  drawChain(d, x - w * 0.28, chainTop, left, seatY - 6 * scale, player);
  drawChain(d, x + w * 0.28, chainTop, right, seatY - 6 * scale, player);
  const back = [
    [left - 2, seatY - 28 * scale],
    [right + 2, seatY - 28 * scale],
    [right - 2, seatY - 4 * scale],
    [left + 2, seatY - 4 * scale],
  ];
  const seat = [
    [left - 4, seatY - 6 * scale],
    [right + 4, seatY - 6 * scale],
    [right + kick * 0.2, seatY + 18 * scale],
    [left + kick * 0.2, seatY + 18 * scale],
  ];
  const fillBack = player ? '#6b2030ee' : '#6b203055';
  const fillSeat = player ? '#8a2840ee' : '#6b203044';
  d.poly(back, fillBack, GOLD_DIM, player ? 2 : 1);
  d.poly(seat, fillSeat, '#f0d09a', player ? 2 : 1);
  if (player) {
    d.poly([
      [left - 2, seatY - 8 * scale],
      [right + 2, seatY - 8 * scale],
      [right + 1, seatY - 2 * scale],
      [left - 1, seatY - 2 * scale],
    ], '#f0d09a88', GOLD, 1.4);
    d.poly([
      [x - 8 * scale + kick * 0.4, seatY - 22 * scale],
      [x + 8 * scale + kick * 0.4, seatY - 22 * scale],
      [x + 6 * scale + kick * 0.5, seatY + 2 * scale],
      [x - 6 * scale + kick * 0.5, seatY + 2 * scale],
    ], '#f3e2bd', '#b78b48', 1.5);
    d.ellipse(x + kick * 0.15, seatY + 22 * scale, 22 * scale, 7 * scale, '#1a101066', null, 0);
  }
}

function drawCanopyHub(d, s) {
  // Light hub so chains have an origin — do not hide the painted tower.
  const hold = !!s.holding;
  d.circle(CX, CY - 8, 34, hold ? '#3a182088' : '#1a304488', hold ? GOLD : GOLD_DIM, hold ? 3.6 : 3);
  d.circle(CX, CY - 8, 18, hold ? '#8a2840cc' : '#6b2030aa', GOLD, 2);
  d.ellipse(CX, CY + 52, 48, 16, '#2a181433', '#d2a65b55', 1);
  if (hold) d.glow(CX, CY - 8, 54, GOLD);
  if (s.leanCue > 0) {
    const u = s.leanCue / 0.35;
    const reach = 40 + (1 - u) * 90;
    for (let i = 0; i < 6; i++) {
      const a = s.theta * 0.2 + i * (TAU / 6);
      const p0 = orbitPoint(a, 28);
      const p1 = orbitPoint(a, reach);
      d.line(p0, p1, GOLD + (u > 0.5 ? 'aa' : '55'), 2);
    }
  }
}

function drawBandShadows(d, s) {
  const three = isThree(s);
  const bands = three ? [0, 1, 2] : [0, 1];
  const targetU = s.holding ? 1 : 0;
  const targetBand = currentBand(targetU, three);
  // While easing toward middle zone, highlight nearest dest band
  const easeBand = currentBand(s.easeTo, three);
  const cur = currentBand(s.radiusU, three);
  bands.forEach((band) => {
    const rr = bandRadius(band, three);
    const isTarget = band === easeBand || (s.easeT >= 1 && band === targetBand);
    const isCur = band === cur;
    const isMid = three && band === 1;
    d.ellipse(
      CX, CY,
      rr, rr * SQUASH,
      isCur ? '#3a241866' : '#3a241814',
      isTarget ? '#f4d590ee' : (isCur ? '#d2a65bcc' : (isMid ? '#c45a7a55' : '#b78b4844')),
      isTarget ? 3.6 : (isCur ? 2.4 : (isMid ? 1.6 : 1.1)),
    );
    if (isCur && !isTarget) {
      d.ellipse(CX, CY, rr * 0.97, rr * SQUASH * 0.97, '#2a181422', null, 0);
    }
    if (isTarget) {
      for (let i = 0; i < 8; i++) {
        const a = s.theta * 0.35 + i * (TAU / 8);
        const p = orbitPoint(a, rr);
        d.circle(p.x, p.y, 3.4, '#f4d590dd', GOLD_DIM, 1);
      }
      if (s.holding || s.easeT < 1) {
        const a = s.theta + Math.PI * 0.5;
        const tip = orbitPoint(a, rr + 18);
        const left = orbitPoint(a - 0.18, rr - 6);
        const right = orbitPoint(a + 0.18, rr - 6);
        d.poly(
          [[tip.x, tip.y], [left.x, left.y], [right.x, right.y]],
          '#f4d59055',
          '#f4d590cc',
          1.5,
        );
      }
    }
  });
}

/** Ch4: brighten the target band oval while a cloud bubble approaches. */
function drawCloudOvalHint(d, s, bank) {
  if (!isCloudWaltz(s) && !isMidnightWaltz(s)) return;
  const live = s.bubbles.find((b) => b.cloud && !b.taken && !b.missed);
  if (!live) return;
  const ahead = aheadOf(s, live.theta);
  const warn = approachOf(live);
  if (ahead > warn || ahead < -catchHalfOf(live)) return;
  const rr = bandRadius(live.band, true);
  const ramp = clamp(1 - ahead / Math.max(0.01, warn), 0, 1);
  const lit = !!live.lit;
  d.ellipse(
    CX, CY,
    rr, rr * SQUASH,
    lit ? '#5ee08a22' : '#7ec8c022',
    lit ? GREEN : CLOUD_TEAL,
    2.4 + ramp * 2.2,
  );
  // Platform glints along the approaching arc
  for (let i = 0; i < 7; i++) {
    const a = live.theta - warn * (1 - ramp) * 0.35 + i * 0.09;
    const p = orbitPoint(a, rr);
    d.circle(p.x + bank * 0.1, p.y, 2.8 + ramp, lit ? '#5ee08add' : '#a8e0d8dd', lit ? GREEN : CLOUD_SOFT, 1);
  }
}

function drawChairShadow(d, angle, radius, scale) {
  const ground = orbitPoint(angle, radius);
  d.ellipse(ground.x, ground.y + 16 * scale, 28 * scale, 10 * scale, '#1a101088', null, 0);
}

function drawFx(d, s) {
  for (const sp of (s.sparks || [])) {
    const u = sp.t / sp.dur;
    const a = 1 - u;
    const col = sp.cool ? COOL : (sp.pop ? CREAM : GOLD);
    const hex = Math.floor(a * 200).toString(16).padStart(2, '0');
    d.circle(sp.x, sp.y, sp.r * (1 - u * 0.45), col + hex, null, 0);
  }
  for (const f of (s.fly || [])) {
    const u = Math.min(1, f.t / f.dur);
    const e = 1 - (1 - u) * (1 - u);
    const dest = f.prize ? PRIZE_CORNER : PURSE;
    const fx = f.x + (dest.x - f.x) * e;
    const fy = f.y + (dest.y - f.y) * e - Math.sin(u * Math.PI) * 36;
    d.item(spriteKey(f.id), fx, fy, {
      w: 28 * (1 - u * 0.35),
      shadow: false,
      fallback: () => drawStar(d, fx, fy, 10 * (1 - u * 0.3), '#ffe6a4', GOLD_DIM),
    });
  }
}


/** Ch4 soft-miss teach: auto-line assist — while HOLD and outer clear/makeup in window, snap outer. */
function updateCh4Assist(s) {
  if (!isCloudWaltz(s) || !s.ch4Assist) return;
  if ((s.passed || 0) >= s.goal || s.result) {
    s.ch4Assist = false;
    return;
  }
  if (s.pushUntil != null && s.t < s.pushUntil) return; // brief soft-push owns ease
  if (!s.holding) return;
  const target = s.bubbles.find((b) => !b.taken && !b.missed && b.band === 2 && (b.clearLong || b.makeup));
  if (!target) return;
  const ahead = aheadOf(s, target.theta);
  const warn = approachOf(target);
  const half = catchHalfOf(target);
  if (ahead > warn || ahead < -half) return;
  // Snap outer so continuous HOLD screams the band and POPs land
  s.radiusU = 1;
  s.easeFrom = 1;
  s.easeTo = 1;
  s.easeT = 1;
  s.note = target.makeup
    ? 'HOLD outer — makeup star · auto-line'
    : 'HOLD — auto-line outer';
  s.notePinUntil = Math.max(s.notePinUntil || 0, s.t + 0.4);
}

/** Ch5 soft-miss teach: same snap pattern as Ch4 — while HOLD and outer clear/makeup in window. */
function updateCh5Assist(s) {
  if (!isBellFlight(s) || !s.ch5Assist) return;
  if ((s.passed || 0) >= s.goal || s.result) {
    s.ch5Assist = false;
    return;
  }
  if (s.pushUntil != null && s.t < s.pushUntil) return;
  if (!s.holding) return;
  const target = s.bubbles.find((b) => !b.taken && !b.missed && b.band === 2 && b.bell && (b.clearLong || b.makeup));
  if (!target) return;
  const ahead = aheadOf(s, target.theta);
  const warn = approachOf(target);
  const half = catchHalfOf(target);
  if (ahead > warn || ahead < -half) return;
  s.radiusU = 1;
  s.easeFrom = 1;
  s.easeTo = 1;
  s.easeT = 1;
  s.note = target.makeup
    ? 'HOLD outer — makeup bell · auto-line'
    : 'HOLD — auto-line outer';
  s.notePinUntil = Math.max(s.notePinUntil || 0, s.t + 0.4);
}

/** Ch6 soft-miss teach: same snap pattern as Ch4/Ch5 — while HOLD and outer clear/cloud/makeup in window. */
function updateCh6Assist(s) {
  if (!isMidnightWaltz(s) || !s.ch6Assist) return;
  if ((s.passed || 0) >= s.goal || s.result) {
    s.ch6Assist = false;
    return;
  }
  if (s.pushUntil != null && s.t < s.pushUntil) return;
  if (!s.holding) return;
  const target = s.bubbles.find((b) => !b.taken && !b.missed && b.band === 2 && b.midnight && (b.clearLong || b.makeup || b.cloud));
  if (!target) return;
  const ahead = aheadOf(s, target.theta);
  const warn = approachOf(target);
  const half = catchHalfOf(target);
  if (ahead > warn || ahead < -half) return;
  s.radiusU = 1;
  s.easeFrom = 1;
  s.easeTo = 1;
  s.easeT = 1;
  s.note = target.makeup
    ? 'HOLD outer — makeup · auto-line'
    : (target.cloud
      ? 'HOLD outer — cloud · auto-line'
      : 'HOLD — auto-line outer');
  s.notePinUntil = Math.max(s.notePinUntil || 0, s.t + 0.4);
}

function missNote(bubble, three) {
  if (bubble.ribbon) {
    return 'Ribbon miss — soft push inward; HOLD/RELEASE to the middle band';
  }
  if (bubble.line) {
    return 'Left the line — soft push; HOLD and stay on the outer band';
  }
  if (bubble.cloud) {
    return 'Cloud miss — soft push; watch the shadow for the band';
  }
  if (bubble.midnight) {
    return 'Midnight miss — soft push; HOLD outer';
  }
  if (bubble.bell) {
    return 'Match the bell — soft push; HOLD outer';
  }
  const label = bandLabel(bubble.band, three);
  if (label === 'outer') return 'Missed the outer bubble — HOLD to stretch out';
  if (label === 'middle') return 'Missed the middle bubble — HOLD briefly, then RELEASE';
  return 'Missed the inner bubble — RELEASE to tuck in';
}

function updateRibbonCoach(s) {
  if (!isThree(s) || isStarCircles(s) || isCloudWaltz(s) || isBellFlight(s) || isMidnightWaltz(s)) return;
  const teach = s.bubbles.find((b) => b.ribbon && b.teach && !b.taken && !b.missed);
  if (!teach) return;
  const ahead = aheadOf(s, teach.theta);
  const warn = approachOf(teach);
  if (ahead > warn || ahead < -CATCH_HALF) return;
  // Don't stomp a sticky miss plate or a fresh POP note
  if (s.notePinUntil != null && s.t < s.notePinUntil) return;
  if (isLinedUp(s, teach.band, teach.theta, warn)) {
    s.note = 'Lined up — hold the middle band through the ribbon';
  } else {
    s.note = 'Ribbon — HOLD/RELEASE to the middle band';
  }
}

/** Ch3: long warn coaching for the smooth-line teach sequence (outer alone). */
function updateLineCoach(s) {
  if (!isStarCircles(s)) return;
  const live = s.bubbles.filter((b) => b.line && !b.taken && !b.missed);
  const active = live.find((b) => {
    const ahead = aheadOf(s, b.theta);
    return ahead <= approachOf(b) && ahead > -CATCH_HALF;
  });
  if (!active) return;
  if (s.notePinUntil != null && s.t < s.notePinUntil) return;
  const warn = approachOf(active);
  if (isLinedUp(s, active.band, active.theta, warn)) {
    s.note = active.teach
      ? 'Hold the line — stay on this band'
      : 'Keep the line — stay on the outer band';
  } else {
    s.note = 'Hold the line — HOLD to the outer band and stay';
  }
}

/** Ch4: long warn coaching — scream-clear HOLD + watch the shadow. */
function updateCloudCoach(s) {
  if (!isCloudWaltz(s)) return;
  const teach = s.bubbles.find((b) => b.cloud && !b.taken && !b.missed);
  if (!teach) return;
  const ahead = aheadOf(s, teach.theta);
  const warn = approachOf(teach);
  const half = catchHalfOf(teach);
  if (ahead > warn || ahead < -half) return;
  // Live cloud-teach: pin loud coach through the full teach/catch window
  if (teach.teach) {
    const missHold = (s.notePinUntil != null) && (s.t < s.notePinUntil)
      && /Cloud miss|Missed/.test(s.note || '');
    if (missHold) return; // keep soft-miss plate until it expires
    s.note = isLinedUp(s, teach.band, teach.theta, warn)
      ? 'Watch the shadow — HOLD outer · lined up through the cloud'
      : 'Watch the shadow — HOLD outer · cloud hides the star';
    s.notePinUntil = Math.max(s.notePinUntil || 0, s.t + 0.35);
    return;
  }
  if (s.notePinUntil != null && s.t < s.notePinUntil) return;
  if (isLinedUp(s, teach.band, teach.theta, warn)) {
    s.note = 'Lined up — POP through the cloud';
  } else {
    s.note = 'Watch the shadow — find the band';
  }
}

/** Ch4/Ch5 makeup: scream coach when live and still short of GOAL. */
function updateMakeupCoach(s) {
  if (!isCloudWaltz(s) && !isBellFlight(s) && !isMidnightWaltz(s)) return;
  const makeup = s.bubbles.find((b) => b.makeup && !b.taken && !b.missed);
  if (!makeup) return;
  if ((s.passed || 0) >= s.goal) return;
  const ahead = aheadOf(s, makeup.theta);
  const warn = approachOf(makeup);
  const half = catchHalfOf(makeup);
  if (ahead > warn || ahead < -half) return;
  const missHold = (s.notePinUntil != null) && (s.t < s.notePinUntil)
    && /Cloud miss|Bell miss|Match the bell|Midnight miss|Missed|auto-line/.test(s.note || '');
  if (missHold) return;
  if (isMidnightWaltz(s)) {
    if (s.ch6Assist) {
      s.note = 'HOLD outer — makeup · auto-line';
    } else {
      s.note = isLinedUp(s, makeup.band, makeup.theta, warn)
        ? 'HOLD outer — makeup · lined up'
        : 'Midnight — HOLD outer · makeup';
    }
  } else if (isBellFlight(s)) {
    if (s.ch5Assist) {
      s.note = 'HOLD outer — makeup bell · auto-line';
    } else {
      s.note = isLinedUp(s, makeup.band, makeup.theta, warn)
        ? 'HOLD outer — makeup bell · lined up'
        : 'HOLD outer — makeup bell · Match the pitch';
    }
  } else if (s.ch4Assist) {
    s.note = isLinedUp(s, makeup.band, makeup.theta, warn)
      ? 'HOLD outer — makeup star · auto-line'
      : 'HOLD outer — makeup star · auto-line';
  } else {
    s.note = isLinedUp(s, makeup.band, makeup.theta, warn)
      ? 'HOLD outer — makeup star · lined up'
      : 'HOLD outer — makeup star';
  }
  s.notePinUntil = Math.max(s.notePinUntil || 0, s.t + 0.35);
}

/** Ch5: long warn coaching — scream-clear Match the bell / HOLD outer. */
function updateBellCoach(s) {
  if (!isBellFlight(s)) return;
  const live = s.bubbles.find((b) => b.bell && !b.taken && !b.missed);
  if (!live) return;
  const ahead = aheadOf(s, live.theta);
  const warn = approachOf(live);
  const half = catchHalfOf(live);
  if (ahead > warn || ahead < -half) return;
  const missHold = (s.notePinUntil != null) && (s.t < s.notePinUntil)
    && /Match the bell|Missed|auto-line/.test(s.note || '');
  if (missHold) return;
  const pitch = (live.bell || 'high').toUpperCase();
  if (live.teach) {
    s.note = isLinedUp(s, live.band, live.theta, warn)
      ? 'HIGH → OUTER · HOLD · lined up'
      : 'HIGH → OUTER · HOLD';
    s.notePinUntil = Math.max(s.notePinUntil || 0, s.t + 0.35);
    return;
  }
  if (live.makeup) return; // makeup coach owns plate
  if (s.ch5Assist) {
    s.note = isLinedUp(s, live.band, live.theta, warn)
      ? 'HOLD — auto-line outer · lined up'
      : 'HOLD — auto-line outer';
    s.notePinUntil = Math.max(s.notePinUntil || 0, s.t + 0.35);
    return;
  }
  if (s.notePinUntil != null && s.t < s.notePinUntil) return;
  s.note = isLinedUp(s, live.band, live.theta, warn)
    ? pitch + ' · ' + bellVerbHint(live.bell) + ' · lined up'
    : 'Match the bell — ' + pitch + ' · ' + bellVerbHint(live.bell);
}

/** Ch6: long warn coaching — scream-clear “Midnight — HOLD outer”. */
function updateMidnightCoach(s) {
  if (!isMidnightWaltz(s)) return;
  const live = s.bubbles.find((b) => b.midnight && !b.taken && !b.missed);
  if (!live) return;
  const ahead = aheadOf(s, live.theta);
  const warn = approachOf(live);
  const half = catchHalfOf(live);
  if (ahead > warn || ahead < -half) return;
  const missHold = (s.notePinUntil != null) && (s.t < s.notePinUntil)
    && /Midnight miss|Missed|auto-line|Match the bell|Cloud miss/.test(s.note || '');
  if (missHold) return;
  if (live.teach) {
    s.note = isLinedUp(s, live.band, live.theta, warn)
      ? 'Midnight — HOLD outer · lined up'
      : 'Midnight — HOLD outer';
    s.notePinUntil = Math.max(s.notePinUntil || 0, s.t + 0.35);
    return;
  }
  if (live.makeup) return; // makeup coach owns plate
  if (s.ch6Assist) {
    s.note = isLinedUp(s, live.band, live.theta, warn)
      ? 'HOLD — auto-line outer · lined up'
      : (live.cloud ? 'HOLD outer — cloud · auto-line' : 'HOLD — auto-line outer');
    s.notePinUntil = Math.max(s.notePinUntil || 0, s.t + 0.35);
    return;
  }
  if (s.notePinUntil != null && s.t < s.notePinUntil) return;
  if (live.cloud) {
    s.note = isLinedUp(s, live.band, live.theta, warn)
      ? 'Watch the shadow — HOLD outer · lined up'
      : 'Watch the shadow — HOLD outer · cloud returns';
  } else {
    s.note = isLinedUp(s, live.band, live.theta, warn)
      ? 'Midnight — HOLD outer · lined up'
      : 'Midnight — HOLD outer';
  }
}

/**
 * Soft fail mid-sequence: leave the teach band during an active line window
 * after having been lined up → coaching (+ optional soft-push debounce).
 * Bubble stays live so the player can recover. Ride never aborts.
 */
function updateLineSoftLeave(s) {
  if (!isStarCircles(s)) return;
  const live = s.bubbles.filter((b) => b.line && !b.taken && !b.missed);
  const active = live.find((b) => {
    const ahead = aheadOf(s, b.theta);
    return ahead <= approachOf(b) && ahead > -CATCH_HALF;
  });
  if (!active) {
    s.lineWasLit = false;
    return;
  }
  const onBand = currentBand(s.radiusU, true) === active.band;
  if (onBand) {
    s.lineWasLit = true;
    return;
  }
  if (!s.lineWasLit) return;
  if (s.lineSoftUntil != null && s.t < s.lineSoftUntil) return;
  s.lineWasLit = false;
  s.lineStreak = 0;
  s.lineSoftUntil = s.t + 2.0;
  softPushInward(s);
  s.screenFlash = 0.12;
  logAction(s, 'line-leave', {band: active.band});
  s.note = 'Hold the line — stay on this band';
  s.notePinUntil = s.t + 2.8;
}

export default {
  title: 'Skyward Swings',
  intro: 'Swing wide. Catch the night. HOLD to stretch out — RELEASE to tuck in. Burst the star-bubbles.',
  instructions: 'One verb: HOLD to stretch out to the outer band. RELEASE to tuck in. Line up green, then POP each star-bubble. Ribbon Round adds a middle band — ease through it for the ribbon gate. Star Circles rewards holding a smooth flight line on one band. Cloud Waltz hides the star in soft cloud — watch the band shadow first. Bell Flight maps pitch to bands — high OUTER HOLD. Midnight Waltz remixes taught cues — HOLD outer through clear, cloud, and makeup stars. First ride is free practice.',
  levels: LEVELS,
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 70,
  actions: [{id: 'lean', label: 'HOLD · stretch out', hold: true}],
  create(level, rng) {
    const reduced = typeof prefersReducedMotion === 'function' ? prefersReducedMotion() : false;
    const ch2 = level === 1;
    const ch3 = level === 2;
    const ch4 = level === 3;
    const ch5 = level === 4;
    const ch6 = level === 5;
    const three = ch2 || ch3 || ch4 || ch5 || ch6;
    return makeRideState(level, rng, {
      theta: -0.35,
      radiusU: 0,
      easeFrom: 0,
      easeTo: 0,
      easeT: 1,
      holding: false,
      holdPointer: false,
      holdAction: false,
      backgrounded: false,
      passed: 0,
      goal: ch6 ? GOAL_CH6 : (ch5 ? GOAL_CH5 : (ch4 ? GOAL_CH4 : (ch3 ? GOAL_CH3 : (ch2 ? GOAL_CH2 : GOAL_CH1)))),
      goalCap: ch6 ? GOAL_CH6 : (ch5 ? GOAL_CH5 : undefined),
      threeBand: three,
      starCircles: ch3,
      cloudWaltz: ch4,
      bellFlight: ch5,
      midnightWaltz: ch6,
      finishTheta: ch6 ? FINISH_THETA_CH6 : (ch5 ? FINISH_THETA_CH5 : (ch4 ? FINISH_THETA_CH4 : (ch3 ? FINISH_THETA_CH3 : (ch2 ? FINISH_THETA_CH2 : FINISH_THETA_CH1)))),
      bubbles: ch6 ? ch6Bubbles() : (ch5 ? ch5Bubbles() : (ch4 ? ch4Bubbles() : (ch3 ? ch3Bubbles() : (ch2 ? ch2Bubbles() : ch1Bubbles())))),
      treasureId: TREASURES[Math.max(0, Math.min(level, TREASURES.length - 1))],
      camBank: 0,
      pointer: null,
      reduced,
      fly: [],
      sparks: [],
      leanCue: 0,
      screenFlash: 0,
      popFlash: 0,
      streakJuice: 0,
      lineStreak: 0,
      lineWasLit: false,
      lineSoftUntil: 0,
      coachUntil: ch6 ? 7 : (ch5 ? 7 : (ch4 ? 7 : (ch3 ? 7 : (ch2 ? 6 : 5)))),
      notePinUntil: 0,
      pushUntil: 0,
      ch4Assist: false,
      ch5Assist: false,
      ch6Assist: false,
    });
  },
  update(s, dt, input) {
    if (s.result || s.broke) return;
    // Belt-and-suspenders: Bell Flight / Midnight Waltz HUD/goal never drifts to bubble count (4).
    if (isBellFlight(s)) {
      s.goal = GOAL_CH5;
      s.goalCap = GOAL_CH5;
    }
    if (isMidnightWaltz(s)) {
      s.goal = GOAL_CH6;
      s.goalCap = GOAL_CH6;
    }

    if (ensureBoarded(s, RIDE, s.treasureId, SPAWNS)) {
      s.note = isMidnightWaltz(s)
        ? 'Midnight Waltz — HOLD outer'
        : (isBellFlight(s)
          ? 'Bell Flight — Match the pitch'
          : (isCloudWaltz(s)
            ? 'Cloud Waltz — watch the shadow'
            : (isStarCircles(s)
              ? 'Star Circles — HOLD the line · stay on one band'
              : (isThree(s)
                ? 'Ribbon Round — HOLD out · RELEASE in · middle is the ease'
                : 'HOLD to stretch out · RELEASE to tuck in'))));
      s.coachUntil = s.t + (isMidnightWaltz(s) || isBellFlight(s) || isCloudWaltz(s) || isStarCircles(s) ? 7 : (isThree(s) ? 6 : 5));
    }
    if (s.result) return;

    s.backgrounded = pageHidden();
    refreshLean(s, input);

    s.t += dt;
    s.theta += OMEGA * dt;

    if (s.easeT < 1) {
      s.easeT = Math.min(1, s.easeT + dt / EASE_SEC);
      const u = s.easeT * s.easeT * (3 - 2 * s.easeT);
      s.radiusU = s.easeFrom + (s.easeTo - s.easeFrom) * u;
    } else {
      s.radiusU = s.easeTo;
    }

    const reduced = reducedOf(s);
    const wantBank = (s.radiusU - 0.5) * (reduced ? 5 : 16);
    s.camBank += (wantBank - s.camBank) * Math.min(1, dt * 5);

    const finish = finishThetaOf(s);
    s.progress = Math.min(1, s.theta / finish);

    const three = isThree(s);

    // Update green lit flags (readable before catch; same timing when reduced)
    s.bubbles.forEach((bubble) => {
      if (bubble.taken) {
        bubble.lit = false;
        return;
      }
      bubble.lit = isLinedUp(s, bubble.band, bubble.theta, approachOf(bubble));
    });

    // Ch4/Ch5/Ch6 assist snap (after ease) so HOLD lands outer before POP check
    updateCh4Assist(s);
    updateCh5Assist(s);
    updateCh6Assist(s);
    // Re-lit after possible assist snap
    if (s.ch4Assist || s.ch5Assist || s.ch6Assist) {
      s.bubbles.forEach((bubble) => {
        if (bubble.taken || bubble.missed) { bubble.lit = false; return; }
        bubble.lit = isLinedUp(s, bubble.band, bubble.theta, approachOf(bubble));
      });
    }

    s.bubbles.forEach((bubble, i) => {
      tryPopBubble(s, bubble, i);
      if (!bubble.taken && !bubble.missed && s.theta > bubble.theta + catchHalfOf(bubble)) {
        bubble.missed = true;
        bubble.missFlash = MISS_FLASH;
        bubble.lit = false;
        s.screenFlash = 0.14;
        const missType = bubble.midnight
          ? (bubble.cloud ? 'cloud-miss' : (bubble.bell ? 'bell-miss' : 'bubble-miss'))
          : (bubble.ribbon ? 'ribbon-miss' : (bubble.line ? 'line-miss' : (bubble.cloud ? 'cloud-miss' : (bubble.bell ? 'bell-miss' : 'bubble-miss'))));
        logAction(s, missType, {band: bubble.band, i, bell: bubble.bell || null, midnight: !!bubble.midnight});
        if (bubble.ribbon || bubble.line || bubble.cloud || bubble.bell || bubble.midnight) {
          softPushInward(s);
        }
        // Soft-miss cloud/bell/midnight teach → arm auto-line assist until GOAL or ride end
        if (bubble.cloud && bubble.teach && !bubble.midnight) {
          s.ch4Assist = true;
        }
        if (bubble.bell && bubble.teach && !bubble.midnight) {
          s.ch5Assist = true;
        }
        if (bubble.midnight && bubble.teach) {
          s.ch6Assist = true;
        }
        if (bubble.line) s.lineStreak = 0;
        s.note = missNote(bubble, three);
        s.notePinUntil = s.t + (bubble.ribbon || bubble.line || bubble.cloud || bubble.bell || bubble.midnight ? 3.2 : 2.8);
        const p = orbitPoint(bubble.theta, bandRadius(bubble.band, three));
        pushBurst(s, p.x, p.y, true);
      }
    });

    updateLineSoftLeave(s);
    updateRibbonCoach(s);
    updateLineCoach(s);
    updateCloudCoach(s);
    updateBellCoach(s);
    updateMidnightCoach(s);
    updateMakeupCoach(s);
    updateCh4Assist(s); // coach note after plates; snap already applied pre-POP
    updateCh5Assist(s);
    updateCh6Assist(s);
    spawnTreasure(s);
    if (s.treasure && !s.treasure.taken && s.theta >= s.treasure.warnTheta) {
      s.treasure.lit = isLinedUp(s, s.treasure.band, s.treasure.sweepTheta)
        || (currentBand(s.radiusU, three) === s.treasure.band && s.theta < s.treasure.sweepTheta);
    }
    trySweepTreasure(s);
    tickFx(s, dt);

    if (s.theta >= finish) {
      finishRide(s, {
        rideId: RIDE,
        treasureId: s.treasureId,
        challengeOk: s.passed >= (isMidnightWaltz(s) ? GOAL_CH6 : (isBellFlight(s) ? GOAL_CH5 : s.goal)),
        completionFind: 'star-token',
      });
    }
  },
  action(s, id, on) {
    if (id !== 'lean' || s.result || s.broke) return;
    s.holdAction = !!on;
    refreshLean(s);
  },
  pointer(s, type, p) {
    if (s.result || s.broke) return;
    if (type === 'down') {
      s.pointer = {x: p.x, y: p.y};
      s.holdPointer = true;
      refreshLean(s);
      return;
    }
    if (type === 'move' && s.pointer) {
      // Radial stretch is the only axis that matters.
      // Vertical-only drag is ignored for gameplay — height is visual.
      s.pointer = {x: p.x, y: p.y};
      return;
    }
    if (type === 'up' || type === 'cancel' || type === 'leave' || type === 'blur' || type === 'out') {
      s.pointer = null;
      s.holdPointer = false;
      refreshLean(s);
    }
  },
  key(s, k, down) {
    if (s.result || s.broke) return;
    if (k === ' ' || k === 'Space' || k === 'Spacebar' || k === 'Shift') {
      s.holdAction = !!down;
      refreshLean(s);
    }
  },
  draw(s, d) {
    const reduced = reducedOf(s);
    const bank = s.camBank || 0;
    const fly = s.radiusU;
    const hang = fly * (reduced ? 6 : 20);
    const three = isThree(s);

    // Soft court vignette only — never a full-canvas fill over swings.png.
    d.ellipse(CX + bank * 0.12, CY + 70, 360, 250, '#1a101014');
    if (s.holding) {
      d.ellipse(CX, CY + 40, 300, 210, '#6b203012');
    }
    if (s.screenFlash > 0) {
      d.ellipse(CX, CY, 280, 200, '#6a90b822');
    }
    if (s.popFlash > 0) {
      const u = s.popFlash / FLASH_SEC;
      d.ellipse(CX, CY, 200 + (1 - u) * 80, 140 + (1 - u) * 40, '#ffe6a4' + Math.floor(u * 28).toString(16).padStart(2, '0'));
    }

    drawBandShadows(d, s);
    drawCloudOvalHint(d, s, bank);
    drawLineGuide(d, s, bank);
    drawCanopyHub(d, s);

    // Decorative sister chairs — carousel read, not gameplay.
    const ghosts = [];
    const player = {angle: s.theta, radius: radiusAt(s.radiusU), player: true};
    for (let i = 1; i < 8; i++) {
      ghosts.push({
        angle: s.theta + i * (TAU / 8),
        radius: radiusAt(0.72),
        player: false,
      });
    }
    const seats = ghosts.concat([player]).sort((a, b) => depthOf(a.angle) - depthOf(b.angle));
    seats.forEach((seat) => {
      const depth = depthOf(seat.angle);
      const scale = (seat.player ? 0.78 : 0.42) + depth * (seat.player ? 0.55 : 0.28);
      const p = orbitPoint(seat.angle, seat.radius);
      const y = p.y + (seat.player ? hang * (0.35 + 0.65 * depth) : 8) + bank * 0.04;
      const x = p.x + bank * (seat.player ? 1 : 0.3);
      drawChairShadow(d, seat.angle, seat.radius, scale);
      drawChair(d, x, y, scale, seat.player ? fly : 0.7, depth, seat.player, seat.player ? bank : 0);
    });

    // Star-bubbles / ribbon gates at fixed world angles — fly the chair to them.
    s.bubbles.forEach((bubble) => {
      if (bubble.taken && !(bubble.flash > 0)) return;
      const ahead = aheadOf(s, bubble.theta);
      const ap = approachOf(bubble);
      if (!bubble.taken && ahead > ap && !(bubble.missFlash > 0)) return;
      if (!bubble.taken && ahead < -catchHalfOf(bubble) && !(bubble.missFlash > 0)) return;
      const lit = !!bubble.lit && !bubble.taken;
      if (bubble.ribbon) {
        drawRibbonGate(d, s, bubble, bank, lit, bubble.flash || 0, bubble.missFlash || 0);
        return;
      }
      if (bubble.cloud) {
        drawCloudBubble(d, s, bubble, bank, lit, bubble.flash || 0, bubble.missFlash || 0);
        return;
      }
      if (bubble.bell) {
        drawBellBubble(d, s, bubble, bank, lit, bubble.flash || 0, bubble.missFlash || 0);
        return;
      }
      const p = orbitPoint(bubble.theta, bandRadius(bubble.band, three));
      const depth = depthOf(bubble.theta);
      const px = p.x + bank * 0.4;
      const py = p.y;
      drawBubble(d, px, py, depth, lit, bubble.flash || 0, bubble.missFlash || 0);
      if (!bubble.taken && !(bubble.missFlash > 0) && !(bubble.flash > 0)) {
        const label = bubble.line
          ? (bubble.teach ? 'hold the line' : 'keep the line')
          : bandLabel(bubble.band, three);
        d.text(label, px, py + 28 + depth * 4, 13, lit ? GREEN_SOFT : (bubble.line ? LINE_CREAM : '#ead6a4'));
        if (bubble.line) {
          d.text(bandLabel(bubble.band, three), px, py + 44 + depth * 4, 12, lit ? GREEN_SOFT : '#ead6a4');
        }
      }
    });

    if (s.treasure && !s.treasure.taken && s.theta >= s.treasure.warnTheta) {
      const tr = s.treasure;
      const ang = tr.sweepTheta;
      const p = orbitPoint(ang, bandRadius(tr.band, three));
      const x = p.x + bank * 0.4;
      const y = p.y;
      const warnSpan = tr.sweepTheta - tr.warnTheta;
      const ramp = clamp((s.theta - tr.warnTheta) / Math.max(0.01, warnSpan), 0, 1);
      const near = Math.abs(s.theta - tr.sweepTheta) < 0.9;
      const lit = !!tr.lit;
      // Full green warning circuit when on-band; gold glints otherwise
      for (let i = 0; i < 6; i++) {
        const a = s.theta * 0.9 + i * (TAU / 6);
        const g = orbitPoint(a, bandRadius(tr.band, three) * (0.92 + 0.08 * Math.sin(s.t * 4 + i)));
        d.circle(
          g.x + bank * 0.2, g.y,
          2.6 + ramp * 1.4,
          lit ? '#5ee08acc' : '#f4d590cc',
          lit ? GREEN : GOLD_DIM,
          1,
        );
      }
      d.glow(x, y, (near ? 58 : 36) + ramp * 24, lit ? GREEN : GOLD);
      if (lit) {
        d.circle(x, y, 34, '#5ee08a22', GREEN, 4);
        d.text('lined up', x, y - 48, 15, GREEN_SOFT);
      }
      d.item(spriteKey(tr.id), x, y, {
        w: near ? 64 : 48 + ramp * 10,
        shadow: false,
        fallback: () => drawStar(d, x, y, 16, '#ffe6a4', GOLD_DIM),
      });
      if (s.theta < tr.sweepTheta - 0.2) {
        d.text(bandLabel(tr.band, three) + ' band', x, y + 42, 15, lit ? GREEN_SOFT : GOLD);
      }
    }
    if (s.treasure?.taken && s.treasure.flash > 0) {
      const tr = s.treasure;
      const p = orbitPoint(tr.sweepTheta, bandRadius(tr.band, three));
      const bloom = s.treasure.flash / FLASH_SEC;
      d.glow(p.x + bank * 0.4, p.y, 80 * bloom, CREAM);
      d.circle(p.x + bank * 0.4, p.y, 30, null, CREAM, 6);
      d.circle(p.x + bank * 0.4, p.y, 30 * (1.3 + (1 - bloom) * 1.4), null, '#ffe6a466', 3);
    }

    // Prize waiting corner when eligible and not yet taken
    if (s.eligible && s.treasureId && !(s.treasure && s.treasure.taken) && !s.treasureCollected) {
      d.item(spriteKey(s.treasureId), PRIZE_CORNER.x, PRIZE_CORNER.y, {
        w: 48,
        fallback: () => drawStar(d, PRIZE_CORNER.x, PRIZE_CORNER.y, 14, '#ffe6a4', GOLD_DIM),
      });
      d.text('waiting', PRIZE_CORNER.x, PRIZE_CORNER.y + 42, 13, '#ead6a4');
    }

    // Local juice under chrome so the verb stays readable.
    drawFx(d, s);

    // Clarity-first control chrome (Lorie): one verb must read in the first 5s.
    const early = (s.t || 0) < (s.coachUntil != null ? s.coachUntil : 5);
    const verb = s.holding ? 'RELEASE' : 'HOLD';
    const verbSub = s.holding
      ? (isMidnightWaltz(s) ? 'tuck in · Midnight HOLD' : (isBellFlight(s) ? 'tuck in · Match the pitch' : (isCloudWaltz(s) ? 'tuck in · watch the shadow' : (isStarCircles(s) ? 'tuck in · leave the line' : (three ? 'tuck in · ease past middle' : 'tuck in')))))
      : (isMidnightWaltz(s) ? 'stretch out · Midnight HOLD' : (isBellFlight(s) ? 'stretch out · Match the pitch' : (isCloudWaltz(s) ? 'stretch out · watch the shadow' : (isStarCircles(s) ? 'stretch out · hold the line' : (three ? 'stretch out · ease through middle' : 'stretch out')))));
    const coach = s.note || (isMidnightWaltz(s)
      ? 'Midnight — HOLD outer'
      : (isBellFlight(s)
        ? 'Match the bell — HOLD outer'
        : (isCloudWaltz(s)
          ? 'Watch the shadow — cloud hides the star'
          : (isStarCircles(s)
            ? 'HOLD the line · stay on the outer band'
            : (three
              ? 'HOLD out · RELEASE in · middle for the ribbon'
              : 'HOLD to stretch out · RELEASE to tuck in')))));

    // Teach windows first — cloud teach / makeup use catchHalfOf so HOLD chrome lasts full catch.
    const teachRibbon = three && !isStarCircles(s) && !isCloudWaltz(s) && !isBellFlight(s) && !isMidnightWaltz(s) && s.bubbles.some((b) => b.ribbon && b.teach && !b.taken && !b.missed
      && aheadOf(s, b.theta) <= approachOf(b) && aheadOf(s, b.theta) > -CATCH_HALF);
    const teachLine = isStarCircles(s) && s.bubbles.some((b) => b.line && !b.taken && !b.missed
      && aheadOf(s, b.theta) <= approachOf(b) && aheadOf(s, b.theta) > -CATCH_HALF);
    const teachCloud = isCloudWaltz(s) && s.bubbles.some((b) => b.cloud && b.teach && !b.taken && !b.missed
      && aheadOf(s, b.theta) <= approachOf(b) && aheadOf(s, b.theta) > -catchHalfOf(b));
    const teachBell = isBellFlight(s) && s.bubbles.some((b) => b.bell && b.teach && !b.taken && !b.missed
      && aheadOf(s, b.theta) <= approachOf(b) && aheadOf(s, b.theta) > -catchHalfOf(b));
    const teachMidnight = isMidnightWaltz(s) && s.bubbles.some((b) => b.midnight && b.teach && !b.taken && !b.missed
      && aheadOf(s, b.theta) <= approachOf(b) && aheadOf(s, b.theta) > -catchHalfOf(b));
    const makeupLoud = (isCloudWaltz(s) || isBellFlight(s) || isMidnightWaltz(s)) && (s.passed || 0) < s.goal && s.bubbles.some((b) => b.makeup && !b.taken && !b.missed
      && aheadOf(s, b.theta) <= approachOf(b) && aheadOf(s, b.theta) > -catchHalfOf(b));
    const assistLoud = ((isCloudWaltz(s) && !!s.ch4Assist) || (isBellFlight(s) && !!s.ch5Assist) || (isMidnightWaltz(s) && !!s.ch6Assist))
      && (s.passed || 0) < s.goal
      && /auto-line/.test(s.note || '');
    const teachLoud = teachRibbon || teachLine || teachCloud || teachBell || teachMidnight || makeupLoud || assistLoud;

    // Sticky miss coaching plate (playtest: settle was burying the miss verb).
    // Cloud-teach / makeup / assist pin uses its own scream plate below so verb HOLD stays visible.
    const missPinned = !teachCloud && !teachBell && !teachMidnight && !makeupLoud && !assistLoud && (s.notePinUntil != null) && (s.t < s.notePinUntil)
      && /Missed|Ribbon miss|Left the line|Hold the line|Cloud miss|Watch the shadow|Match the bell|Bell miss|Midnight miss|makeup|auto-line/.test(s.note || '');
    if (missPinned) {
      d.poly(
        [[160, 760], [740, 760], [728, 848], [172, 848]],
        '#1a3044ee',
        COOL,
        3,
      );
      d.text(s.note, 450, 810, 18, CREAM);
    }

    // Live cloud/bell/midnight teach / makeup / auto-line assist: sticky scream-clear coach plate
    if ((teachCloud || teachBell || teachMidnight || makeupLoud || assistLoud) && !missPinned) {
      d.poly(
        [[120, 730], [780, 730], [768, 808], [132, 808]],
        '#1a3044f0',
        teachMidnight || (isMidnightWaltz(s) && (makeupLoud || assistLoud))
          ? MIDNIGHT_SOFT
          : (teachBell || (isBellFlight(s) && makeupLoud) ? BELL_SOFT : CLOUD_SOFT),
        3.5,
      );
      d.text(
        s.note || (assistLoud
          ? 'HOLD — auto-line outer'
          : (makeupLoud
            ? (isMidnightWaltz(s) ? 'HOLD outer — makeup' : (isBellFlight(s) ? 'HOLD outer — makeup bell' : 'HOLD outer — makeup star'))
            : (teachMidnight ? 'Midnight — HOLD outer' : (teachBell ? 'HIGH → OUTER · HOLD' : 'Watch the shadow — HOLD outer · cloud hides the star')))),
        450, 778, 20, CREAM,
      );
    }

    // Big in-court verb plate — loudest early / until first POP / during teach or makeup.
    if (!missPinned && (early || s.holding || (s.passed || 0) < 1 || teachLoud)) {
      const tall = isCloudWaltz(s) || isBellFlight(s) || isMidnightWaltz(s);
      d.poly(
        [[200, 820], [700, 820], [688, tall ? 940 : 920], [212, tall ? 940 : 920]],
        s.holding ? '#6b2030ee' : '#2a1838ee',
        s.holding ? GOLD : '#e8c878',
        early || teachLoud ? 4 : 2.5,
      );
      d.text(verb, 450, 858, early || teachLoud ? 42 : 34, CREAM);
      d.text(verbSub, 450, 898, 18, '#f0d18f');
      // Scream-clear N/3 under verb during Cloud Waltz / Bell Flight / Midnight Waltz
      if (tall) {
        if (isMidnightWaltz(s)) {
          d.text(Math.min(s.passed || 0, GOAL_CH6) + ' / ' + GOAL_CH6 + ' Midnight POP', 450, 924, 17, MIDNIGHT_SOFT);
        } else if (isBellFlight(s)) {
          d.text(Math.min(s.passed || 0, GOAL_CH5) + ' / ' + GOAL_CH5 + ' Bell POP', 450, 924, 17, BELL_SOFT);
        } else {
          d.text((s.passed || 0) + ' / ' + s.goal + ' bubbles', 450, 924, 17, CLOUD_SOFT);
        }
      }
    }

    // Bottom thumb chrome — same verb, phone reach.
    d.poly(
      [[90, 1068], [810, 1068], [792, 1188], [108, 1188]],
      s.holding ? '#6b2030f0' : '#3a2418ee',
      s.holding ? GOLD : '#f0d09a',
      s.holding ? 3.2 : 2.4,
    );
    const loudChrome = teachCloud || teachBell || teachMidnight || makeupLoud || assistLoud;
    d.text(s.holding ? 'RELEASE · tuck in' : 'HOLD · stretch out', 450, 1110, loudChrome ? 28 : 26, CREAM);
    d.text(coach, 450, 1152, loudChrome ? 20 : 16, loudChrome ? CREAM : '#f0d18f');
    if (s.practice) {
      // Practice badge BELOW drawHud panel so it never covers N/3 count
      const pulse = teachLoud ? (0.7 + 0.3 * Math.sin((s.t || 0) * 5)) : 1;
      const a = Math.floor(pulse * 238).toString(16).padStart(2, '0');
      d.poly(
        [[320, 178], [580, 178], [568, 228], [332, 228]],
        '#2a1838' + a,
        teachLine ? LINE_CREAM : (teachMidnight ? MIDNIGHT_SOFT : (teachBell ? BELL_SOFT : (teachCloud ? CLOUD_SOFT : (teachRibbon ? RIBBON_SOFT : '#ead6a4')))),
        teachLoud ? 3 : 2,
      );
      d.text('PRACTICE', 450, 208, teachLoud ? 24 : 20, CREAM);
    }

    if (isMidnightWaltz(s)) {
      drawHud(d, s, {goal: GOAL_CH6, count: Math.min(s.passed || 0, GOAL_CH6), label: 'Midnight POP'});
    } else if (isBellFlight(s)) {
      drawHud(d, s, {goal: GOAL_CH5, count: Math.min(s.passed || 0, GOAL_CH5), label: 'Bell POP'});
    } else {
      drawHud(d, s, {goal: s.goal, count: s.passed, label: 'bubbles'});
    }
  },
  readout: (s) => s.note || '',
};
