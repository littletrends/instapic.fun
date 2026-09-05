/* Water Gun Duel — Desktop Grok owns this file. PF only. Never booth/port 6000.
 * GOBLIN REVIEW HIT #2 FEEL 2026-09-05 — named rooms = path/verb maps, not faster ghost.
 * Polish: Sine Smile is a U-path, Zigzag is a corner map, Feint is a FAKE clone,
 * Twin is high/low stations, Fake-open toasts with no stall-cheat, Mirror still flips X.
 * Latest: GOBLIN_P0_AUTHORED_ACCEPT_FEEL.md (W1–W6) + GOBLIN_AUTHORED_LEVELS_P0.md +
 * GOBLIN_BATCH02_BUILD_SHEETS.md + GOBLIN_BATCH02_MOUNT_CONFIGS.md +
 * GOBLIN_BATCH02_AURA_LINES.md + GOBLIN_RUNKIT_API.md.
 * Engine: Custom hold-spray · depthUnit: Heat · gameId: watergun · codaEnabled
 * codaEnabled hybrid: 7 named maps then ENDLESS Inferno Lane {n}. NOT pure stageParams.
 * W1 Sine Smile / Zigzag = path maps. W2 Feint = yell-about-able fake dodge.
 * W3 Twin Mouth = only LIVE credits. W4 Fake-open = no credit + toast.
 * W5 Mirror Lane = stream flips. W6 ghost race + stallLimit readable.
 * Zigzag aim is 2D (X+Y). Ghost stream never blinks. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;
  const W = 360;
  const H = 440;
  const YOU_X = 96;
  const GHOST_X = 264;
  const MOUTH_Y = 286;
  const GUN_Y = 408;
  const RATE_MS = 0.02;
  const GAME_ID = "watergun";
  const CODA_ENABLED = true;
  const AUTHORED_COUNT = 7;
  const STAMP_MS = 720;
  let run = null;
  let holding = false;
  let keys = { left: false, right: false, up: false, down: false };
  let idleRaf = 0;
  let idleRoom = 1;
  let idleClock = 0;

  const AURA = {
    ghostWin: "Aura: Ghost filled first. Mouth dodged you cold.",
    stall: "Aura: Stream dry. Clown mouth wandered off.",
    clear: "Aura: Heat won. Wrist hotter.",
    souvenir: "Aura: Heat seven locked. Souvenir — the ghost tips its hat.",
    coda: "Aura: Authored ride’s over. ENDLESS — mouths keep lying.",
    deep: (n) => `Aura: Heat ${n}. Lane B felt that spray.`,
    leave: "Aura: Left the lane. Ghost still filling.",
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 7 authored HEATS · ENDLESS coda · not a one-tap prize",
    body: "Authored duel maps, not a faster ghost: Lane Lesson → Sine Smile → Feint Clown → Twin Mouth Map → Zigzag Duel → Fake-Open Fair → Mirror Lane. After 7, ENDLESS coda (flaggable). Ghost wins or stall stamps DRY.",
    status: "Depth run · START · 1 demo coin · 7 authored HEATS then ENDLESS",
    machine: "Spray lane · 1 demo coin · authored HEATS",
    idleHud: ["Authored HEATS — mouths dodge, maps lie", "Hold spray · aim the mouth · ghost never blinks"],
    punch: "Depth run — press START. No one-tap prize.",
  };

  const WATER_LEVELS = [
    {
      id: 1, name: "Lane Lesson", kind: "straight", path: "horizontal",
      hitbox: "big", youR: 22, mouthSpeed: 0.4, yourRate: 1.0, ghostRate: 0.55,
      fillMax: 100, mouthFeints: false, fakeOpenChance: 0, twinMouths: false,
      mirrorAim: false, youAmp: 18, ghostAmp: 10, sineRise: 0, stallLimitMs: 2200,
      barker: "Straight lane. Hold the mouth. Ghost is slow.",
    },
    {
      id: 2, name: "Sine Smile", kind: "sine", path: "sine",
      hitbox: "big", youR: 22, mouthSpeed: 0.52, yourRate: 1.0, ghostRate: 0.7,
      fillMax: 100, mouthFeints: false, fakeOpenChance: 0, twinMouths: false,
      mirrorAim: false, youAmp: 42, ghostAmp: 22, sineRise: 44, stallLimitMs: 2000,
      barker: "The mouth rides a sine. Lead the wave.",
    },
    {
      id: 3, name: "Feint Clown", kind: "feint", path: "sine",
      hitbox: "mid", youR: 16.5, mouthSpeed: 0.62, yourRate: 1.0, ghostRate: 0.78,
      fillMax: 110, mouthFeints: true, fakeOpenChance: 0, twinMouths: false,
      mirrorAim: false, youAmp: 24, ghostAmp: 14, sineRise: 26, stallLimitMs: 1800,
      barker: "It fakes a dodge. Don’t chase the feint.",
    },
    {
      id: 4, name: "Twin Mouth Map", kind: "twinMouth", path: "twin",
      hitbox: "mid", youR: 16.5, mouthSpeed: 0.72, yourRate: 1.0, ghostRate: 0.82,
      fillMax: 110, mouthFeints: false, fakeOpenChance: 0, twinMouths: true,
      mirrorAim: false, youAmp: 12, ghostAmp: 10, stallLimitMs: 1700, twinPeriodMs: 2200, twinSpread: 44, twinRise: 38,
      barker: "Two mouths. Only the live one fills.",
    },
    {
      id: 5, name: "Zigzag Duel", kind: "zigzag", path: "zigzag",
      hitbox: "small", youR: 12.2, mouthSpeed: 0.88, yourRate: 0.95, ghostRate: 0.95,
      fillMax: 120, mouthFeints: false, fakeOpenChance: 0, twinMouths: false,
      mirrorAim: false, youAmp: 38, ghostAmp: 22, zigAmp: 64, stallLimitMs: 1500,
      barker: "Diagonal zigzag. Drag the stream onto the map.",
    },
    {
      id: 6, name: "Fake-Open Fair", kind: "fakeOpen", path: "sine",
      hitbox: "small", youR: 12.8, mouthSpeed: 0.9, yourRate: 1.22, ghostRate: 1.05,
      fillMax: 120, mouthFeints: false, fakeOpenChance: 0.2, twinMouths: false,
      mirrorAim: false, youAmp: 28, ghostAmp: 16, sineRise: 30, stallLimitMs: 1400,
      barker: "Sometimes the mouth lies. Fake-open is no credit. Ghost pressure high.",
    },
    {
      id: 7, name: "Mirror Lane", kind: "mirror", path: "sine",
      hitbox: "mid", youR: 15.5, mouthSpeed: 0.78, yourRate: 0.95, ghostRate: 0.9,
      fillMax: 120, mouthFeints: true, fakeOpenChance: 0, twinMouths: false,
      mirrorAim: true, youAmp: 26, ghostAmp: 16, sineRise: 28, stallLimitMs: 1300,
      barker: "Your stream flips. Aim the other way.",
    },
  ];

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Water Gun Duel",
    depthUnit: "Heat",
    sheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
    batchSheet: "GOBLIN_BATCH02_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  function rk() {
    return PF.runKit || null;
  }

  function hitboxR(hitbox) {
    return hitbox === "big" ? 22 : hitbox === "mid" ? 16.5 : 12.2;
  }

  function waterCodaParams(n) {
    const heat = Math.max(AUTHORED_COUNT + 1, n | 0);
    const t = heat - AUTHORED_COUNT;
    const youR = Math.max(9.5, hitboxR("small") - t * 0.35);
    return {
      id: heat,
      name: `Inferno Lane ${heat}`,
      title: `Inferno Lane ${heat}`,
      kind: "coda",
      coda: true,
      path: "sine",
      hitbox: "small",
      youR,
      ghostR: youR + 5.5,
      mouthSpeed: Math.min(1.8, 1.05 + 0.1 * t),
      yourRate: 1.05,
      ghostRate: Math.min(1.55, 1.05 + 0.05 * t),
      fillMax: 120,
      mouthFeints: true,
      fakeOpenChance: 0.2,
      twinMouths: false,
      mirrorAim: false,
      stallLimitMs: Math.max(900, 1300 - t * 40),
      youAmp: 30 + t * 2,
      ghostAmp: 16 + t,
      sineRise: Math.min(44, 32 + t * 1.2),
      zigAmp: 28,
      streamWeave: 3.4 + t * 0.4,
      ghostTrack: Math.min(0.055, 0.034 + t * 0.002),
      ghostWobble: Math.max(1.8, 4.2 - t * 0.2),
      barker: "ENDLESS — mouths keep lying.",
    };
  }

  function waterLevel(n) {
    const heat = Math.max(1, n | 0);
    if (heat <= AUTHORED_COUNT) {
      const L = WATER_LEVELS[heat - 1];
      const youR = L.youR != null ? L.youR : hitboxR(L.hitbox);
      return Object.assign({
        coda: false,
        ghostR: youR + 5.5,
        streamWeave: 2.6 + heat * 0.35,
        /* Ghost stays on the map — stream never blinks; fill is the on-mouth duel. */
        ghostTrack: L.kind === "zigzag" ? 0.055 : L.kind === "twinMouth" ? 0.05 : L.kind === "straight" ? 0.03 : 0.032,
        ghostWobble: L.kind === "straight" ? 1.1 : L.kind === "zigzag" ? 2.8 : Math.max(2.4, 5.2 - heat * 0.28),
        zigAmp: L.zigAmp != null ? L.zigAmp : 64,
        sineRise: L.sineRise != null ? L.sineRise : 0,
        twinPeriodMs: L.twinPeriodMs || 2200,
        twinRise: L.twinRise != null ? L.twinRise : 38,
      }, L, { id: heat, title: L.name, name: L.name, youR, ghostR: youR + 5.5 });
    }
    if (!P0_MOUNT.codaEnabled) return null;
    return waterCodaParams(heat);
  }

  function watergunStageParams(n) {
    return waterLevel(n);
  }

  function hudStageLine(spec, won) {
    if (!spec) return `HEAT ${won | 0}`;
    if (spec.coda) return `ENDLESS · HEAT ${spec.id} · ${spec.name}`;
    return `HEAT ${spec.id} · ${spec.name}`;
  }

  function paintKitHud(spec) {
    const host = card();
    if (!host) return;
    const hud = host.querySelector(".watergun-rk-hud");
    if (!hud) return;
    if (!spec || !run || run.done) {
      hud.textContent = "";
      return;
    }
    hud.textContent = hudStageLine(spec, run.won);
  }

  function roomTell(spec) {
    if (!spec) return "FILL THE MOUTH";
    if (spec.kind === "straight") return "STRAIGHT LANE · HOLD THE MOUTH";
    if (spec.kind === "sine") return "SINE MAP · LEAD THE WAVE";
    if (spec.kind === "feint") return "FEINT — DON’T CHASE THE FAKE";
    if (spec.kind === "twinMouth") return "TWO MOUTHS · ONLY LIVE FILLS";
    if (spec.kind === "zigzag") return "ZIGZAG MAP · DRAG X AND Y";
    if (spec.kind === "fakeOpen") return "FAKE-OPEN IS A LIE · NO CREDIT";
    if (spec.kind === "mirror") return "MIRROR — AIM THE OTHER WAY";
    if (spec.coda) return "ENDLESS · MOUTHS KEEP LYING";
    return "FILL THE MOUTH";
  }

  function paintVestibuleCheat(spec) {
    const host = card();
    if (!host) return;
    if (!spec) {
      spec = (run && !run.done && run.tun) ? run.tun : attractSpec();
    }
    const barker = host.querySelector(".barker-call");
    if (barker) {
      barker.textContent = spec && spec.barker
        ? `${spec.name.toUpperCase()} — ${spec.barker}`
        : "FILL IT FIRST — DON’T MISS THE MOUTH";
    }
    if (run && !run.done) return;
    const status = $("waterGunStatus");
    if (status && spec) {
      status.textContent = `${hudStageLine(spec, 0)} — ${spec.barker || DEPTH_COPY.status}`;
    }
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    const spec = Object.assign({
      authored: WATER_LEVELS,
      authoredCount: AUTHORED_COUNT,
      codaEnabled: CODA_ENABLED,
      codaParams: waterCodaParams,
      level: waterLevel,
      stageParams: waterLevel,
      watergunStageParams: waterLevel,
    }, P0_MOUNT);
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, spec); } catch (_) { /* already declared */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = spec;
    kitRun.declared = kitRun.declared || {};
    kitRun.declared[GAME_ID] = spec;
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall through */ }
    }
    return kit.persistRun(PF.getState(), GAME_ID, partial);
  }

  function isLive() {
    return !!(run && !run.done && run.kitRun && run.kitRun.alive !== false);
  }

  function attractSpec() {
    return waterLevel(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function punchStart() {
    stampDepthCopy();
    const el = $("waterGunStatus");
    if (el) el.textContent = DEPTH_COPY.punch;
    const btn = $("waterGunStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function saveLiveDepth() {
    if (!run) return;
    const state = PF.getState();
    if (!state) return;
    const depth = run.won | 0;
    const score = run.score | 0;
    state.bestWaterGun = Math.max(state.bestWaterGun || 0, depth);
    state.bestWaterGunScore = Math.max(state.bestWaterGunScore || 0, score);
    state.bestDepth = state.bestDepth || {};
    state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, depth);
    if (run.kitRun) {
      run.kitRun.depth = depth;
      run.kitRun.score = score;
    }
    if (typeof PF.saveState === "function") PF.saveState();
    if (typeof PF.refreshDepth === "function") {
      try { PF.refreshDepth(); } catch (_) {}
    }
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "ghost_win",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestWaterGun = Math.max(state.bestWaterGun || 0, payload.depth);
      state.bestWaterGunScore = Math.max(state.bestWaterGunScore || 0, payload.score);
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
    }
    closeKitRun(payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function mouthX(base, amp, spd, phase, t, feint) {
    const wave = Math.sin(t * spd + phase) * amp;
    return base + wave + (feint || 0);
  }

  const ZIG_PTS = [
    [-1, -1],
    [0.95, -0.12],
    [-0.92, 0.42],
    [1, 1],
    [-0.15, 0.88],
    [0.72, -0.95],
  ];

  function zigzagNorm(t, spd, phase) {
    const n = ZIG_PTS.length;
    const u = t * spd * 0.00205 + (phase || 0);
    const wrapped = ((u % n) + n) % n;
    const i = wrapped | 0;
    const f = wrapped - i;
    const a = ZIG_PTS[i];
    const b = ZIG_PTS[(i + 1) % n];
    return {
      nx: a[0] + (b[0] - a[0]) * f,
      ny: a[1] + (b[1] - a[1]) * f,
    };
  }

  function mouthPos(spec, laneX, t, extra) {
    const amp = extra && extra.amp != null ? extra.amp : spec.youAmp;
    const spd = spec.mouthSpeed;
    const feint = (extra && extra.feint) || 0;
    const phase = (extra && extra.phase) || 0;
    const kind = spec.kind;
    const path = spec.path;
    let x = laneX;
    let y = MOUTH_Y;
    if (kind === "zigzag" || path === "zigzag") {
      /* Corner-to-corner map — 2D drag, not a faster sine. */
      const z = zigzagNorm(t, spd, phase);
      x = laneX + z.nx * amp + feint;
      y = MOUTH_Y + z.ny * (spec.zigAmp || 64);
    } else if (kind === "twinMouth" || path === "twin") {
      x = laneX + Math.sin(t * spd * 0.0024 + phase) * amp * 0.35 + feint;
    } else if (kind === "straight" || path === "horizontal") {
      const u = (t * spd * 0.0018 + phase) % 2;
      const tri = u < 1 ? u * 2 - 1 : 3 - u * 2;
      x = laneX + tri * amp * 0.7 + feint;
      y = MOUTH_Y;
    } else {
      /* Sine Smile — U-curve path map, not a slightly-faster horizontal. */
      const wt = t * spd * 0.0048 + phase;
      const u = Math.sin(wt);
      const rise = spec.sineRise != null ? spec.sineRise : amp * 0.9;
      x = laneX + u * amp + feint;
      y = MOUTH_Y + (1 - u * u) * rise;
    }
    y = clamp(y, 188, 352);
    return { x, y };
  }

  function twinPair(spec, laneX, t, ghost) {
    const period = spec.twinPeriodMs || 2200;
    const active = Math.floor(t / period) % 2;
    const spread = spec.twinSpread != null ? spec.twinSpread : 44;
    const rise = spec.twinRise != null ? spec.twinRise : 38;
    const wob = Math.sin(t * 0.0022) * 4;
    /* High-left / low-right stations — a map, not two mouths on a line. */
    return [
      { x: laneX - spread + wob, y: MOUTH_Y - rise, active: active === 0, ghost },
      { x: laneX + spread - wob, y: MOUTH_Y + rise, active: active === 1, ghost },
    ];
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function mirrorX(x) {
    return YOU_X * 2 - x;
  }

  function drawClown(ctx, x, y, r, ghost, fake, shut) {
    ctx.save();
    ctx.globalAlpha = ghost ? 0.55 : (shut ? 0.42 : 1);
    ctx.beginPath();
    ctx.arc(x, y - 2, 28, 0, Math.PI * 2);
    ctx.fillStyle = ghost ? "#3d8a8a" : "#e8a0b8";
    ctx.fill();
    ctx.strokeStyle = ghost ? "#b8e8e0" : "#d4a45a";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = ghost ? "rgba(184,232,224,0.35)" : "#fff6ec";
    ctx.beginPath();
    ctx.arc(x - 9, y - 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 9, y - 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#12080c";
    ctx.beginPath();
    ctx.arc(x - 9, y - 9, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 9, y - 9, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ghost ? "#b8e8e0" : "#c41e3a";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y + 2, 10, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.fillStyle = ghost ? "rgba(184,232,224,0.45)" : "#c41e3a";
    ctx.beginPath();
    ctx.arc(x, y - 22, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    if (shut) {
      ctx.ellipse(x, y + 12, r * 0.72, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#2a1418";
      ctx.fill();
      ctx.strokeStyle = ghost ? "rgba(184,232,224,0.45)" : "rgba(240,208,154,0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      return;
    }
    ctx.ellipse(x, y + 12, fake ? r * 1.18 : r, r * 0.78, 0, 0, Math.PI * 2);
    ctx.fillStyle = fake ? "rgba(196,30,58,0.55)" : "#0a0508";
    ctx.fill();
    ctx.strokeStyle = fake ? "#c41e3a" : (ghost ? "#b8e8e0" : "#f0d09a");
    ctx.lineWidth = ghost ? 2.4 : 1.6;
    ctx.stroke();
    if (fake && !ghost) {
      ctx.strokeStyle = "rgba(240,208,154,0.95)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.55, y + 4);
      ctx.lineTo(x + r * 0.55, y + 20);
      ctx.moveTo(x + r * 0.55, y + 4);
      ctx.lineTo(x - r * 0.55, y + 20);
      ctx.stroke();
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "8px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("LIE", x, y + 34);
      ctx.textAlign = "left";
    }
  }

  function drawTube(ctx, x, fill, ghost) {
    const top = 86;
    const h = 128;
    const w = 22;
    ctx.fillStyle = "#1a0c10";
    ctx.fillRect(x - w / 2, top, w, h);
    ctx.strokeStyle = ghost ? "rgba(184,232,224,0.7)" : "#d4a45a";
    ctx.strokeRect(x - w / 2 + 0.5, top + 0.5, w - 1, h - 1);
    const fh = Math.max(0, Math.min(1, fill)) * (h - 6);
    if (fh > 0) {
      const g = ctx.createLinearGradient(0, top + h, 0, top);
      g.addColorStop(0, ghost ? "#5aa8a0" : "#2a6a8a");
      g.addColorStop(1, ghost ? "#b8e8e0" : "#7ec8e0");
      ctx.fillStyle = g;
      ctx.fillRect(x - w / 2 + 2, top + h - 3 - fh, w - 4, fh);
    }
    const by = top - 10 - fill * 16;
    const br = 9 + fill * 10;
    ctx.beginPath();
    ctx.arc(x, by, br, 0, Math.PI * 2);
    ctx.fillStyle = ghost ? "rgba(61,138,138,0.72)" : "#c41e3a";
    ctx.fill();
    ctx.strokeStyle = ghost ? "#b8e8e0" : "#f0d09a";
    ctx.stroke();
  }

  function drawGun(ctx, x, y, aimX, aimY, ghost) {
    ctx.save();
    ctx.translate(x, y);
    const ang = Math.atan2((aimY != null ? aimY : MOUTH_Y) - y, aimX - x) - Math.PI / 2;
    ctx.rotate(ang * 0.35);
    ctx.fillStyle = ghost ? "rgba(184,232,224,0.45)" : "#6a4a28";
    ctx.fillRect(-7, -6, 14, 18);
    ctx.fillStyle = ghost ? "rgba(184,232,224,0.7)" : "#d4a45a";
    ctx.fillRect(-3, -28, 6, 24);
    ctx.restore();
  }

  function drawMouthPath(ctx, spec, laneX, ghost) {
    if (!spec) return;
    if (spec.twinMouths) {
      const pair = twinPair(spec, laneX, 0, ghost);
      ctx.save();
      pair.forEach((m) => {
        ctx.strokeStyle = ghost ? "rgba(184,232,224,0.35)" : "rgba(240,208,154,0.7)";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(m.x, m.y + 12, (ghost ? spec.ghostR : spec.youR) + 10, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      if (!ghost) {
        ctx.strokeStyle = "rgba(232,160,184,0.55)";
        ctx.beginPath();
        ctx.moveTo(pair[0].x, pair[0].y + 12);
        ctx.lineTo(pair[1].x, pair[1].y + 12);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    ctx.save();
    const zig = spec.kind === "zigzag" || spec.path === "zigzag";
    const sine = spec.path === "sine" || spec.kind === "sine" || spec.kind === "feint"
      || spec.kind === "fakeOpen" || spec.kind === "mirror" || spec.kind === "coda";
    ctx.strokeStyle = ghost
      ? "rgba(184,232,224,0.22)"
      : (zig ? "rgba(232,160,184,0.85)" : sine ? "rgba(240,208,154,0.72)" : "rgba(240,208,154,0.38)");
    ctx.lineWidth = (!ghost && (zig || sine)) ? 2.4 : 1.4;
    ctx.setLineDash(zig ? [3, 4] : sine ? [6, 4] : [5, 5]);
    ctx.beginPath();
    const amp = ghost ? spec.ghostAmp : spec.youAmp;
    const phase = ghost ? 2.1 : 0.4;
    const ticks = [];
    for (let i = 0; i <= 40; i += 1) {
      const t = (i / 40) * 4800;
      const p = mouthPos(spec, laneX, t, { amp, phase });
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
      if (zig && i % 5 === 0) ticks.push(p);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    if (zig && !ghost) {
      ctx.fillStyle = "rgba(232,160,184,0.85)";
      ticks.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();
  }

  function drawStream(ctx, gx, gy, tx, ty, on, ghost) {
    ctx.save();
    ctx.strokeStyle = on
      ? (ghost ? "rgba(184,232,224,0.85)" : "rgba(126,200,224,0.95)")
      : (ghost ? "rgba(184,232,224,0.28)" : "rgba(126,200,224,0.4)");
    ctx.lineWidth = on ? 3.2 : 1.8;
    ctx.beginPath();
    ctx.moveTo(gx, gy - 26);
    ctx.quadraticCurveTo((gx + tx) / 2 + (ghost ? 8 : -6), (gy + ty) / 2, tx, ty);
    ctx.stroke();
    if (on) {
      ctx.fillStyle = ghost ? "rgba(184,232,224,0.7)" : "rgba(240,248,255,0.8)";
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.arc(tx + (i - 1.5) * 4, ty + 3 + (i % 2) * 3, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function draw() {
    const canvas = $("waterGunCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1a1024");
    bg.addColorStop(1, "#0c080c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    kit.fillWood(ctx, 14, 36, W - 28, H - 52);
    ctx.fillStyle = "rgba(8,4,8,0.45)";
    ctx.fillRect(22, 48, W - 44, H - 78);

    ctx.strokeStyle = "rgba(212,164,90,0.35)";
    ctx.beginPath();
    ctx.moveTo(W / 2, 54);
    ctx.lineTo(W / 2, H - 36);
    ctx.stroke();

    ctx.fillStyle = "#f0d09a";
    ctx.font = "11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("YOU", YOU_X, 348);
    ctx.fillStyle = "#b8e8e0";
    ctx.fillText("GHOST LANE", GHOST_X, 348);
    ctx.textAlign = "left";

    const t = run ? run.t : idleClock + 900;
    const tun = run ? run.tun : attractSpec();
    const youPos = mouthPos(tun, YOU_X, t, { amp: tun.youAmp, phase: 0.4, feint: run ? run.youFeint : 0 });
    const ghostPos = mouthPos(tun, GHOST_X, t, { amp: tun.ghostAmp, phase: 2.1, feint: 0 });
    const youFill = run ? run.youFill / tun.fillMax : 0.12;
    const ghostFill = run ? run.ghostFill / tun.fillMax : 0.38;
    const youAim = run ? run.youStreamX : YOU_X;
    const youAimY = run ? run.youStreamY : MOUTH_Y + 12;
    const ghostAim = run ? run.ghostShotX : GHOST_X;
    const ghostAimY = run ? run.ghostShotY : MOUTH_Y + 12;
    const youOn = run ? run.youOn : false;
    const ghostOn = run ? run.ghostOn : true;
    const spraying = run && !run.done && run.cd <= 0 && run.pause <= 0;
    const fake = !!(run && run.fakeOpen);

    drawTube(ctx, YOU_X, youFill, false);
    drawTube(ctx, GHOST_X, ghostFill, true);
    drawMouthPath(ctx, tun, YOU_X, false);
    drawMouthPath(ctx, tun, GHOST_X, true);
    if (tun.kind === "sine" || tun.kind === "zigzag") {
      ctx.fillStyle = tun.kind === "zigzag" ? "rgba(232,160,184,0.95)" : "rgba(240,208,154,0.9)";
      ctx.font = "9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(tun.kind === "zigzag" ? "ZIGZAG MAP" : "SINE SMILE", YOU_X, 78);
      ctx.textAlign = "left";
    }
    if (!run || !run.done) {
      ctx.fillStyle = "rgba(240,208,154,0.78)";
      ctx.font = "9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(roomTell(tun), W / 2, H - 18);
      ctx.textAlign = "left";
    }
    if (tun.twinMouths) {
      twinPair(tun, YOU_X, t, false).forEach((m, i) => {
        drawClown(ctx, m.x, m.y, tun.youR, false, fake && m.active, !m.active);
        ctx.fillStyle = m.active ? "#f0d09a" : "rgba(196,30,58,0.8)";
        ctx.font = "9px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(m.active ? "LIVE" : "SHUT", m.x, m.y - 38);
        ctx.fillStyle = "rgba(240,208,154,0.8)";
        ctx.font = "8px Georgia, serif";
        ctx.fillText(i === 0 ? "HIGH" : "LOW", m.x, m.y + 36);
        ctx.textAlign = "left";
      });
      twinPair(tun, GHOST_X, t, true).forEach((m) => {
        drawClown(ctx, m.x, m.y, tun.ghostR, true, false, !m.active);
      });
    } else {
      const decoy = run && (run.feintDecoy || (run.feintAfter && run.feintAfter.ms > 0 ? run.feintAfter : null));
      if (decoy) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.85, (decoy.ms || 400) / 500);
        drawClown(ctx, decoy.x, decoy.y, tun.youR, false, true);
        ctx.restore();
        ctx.fillStyle = "#e8a0b8";
        ctx.font = "9px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("FAKE", decoy.x, decoy.y - 40);
        ctx.textAlign = "left";
      }
      drawClown(ctx, youPos.x, youPos.y, tun.youR, false, fake);
      drawClown(ctx, ghostPos.x, ghostPos.y, tun.ghostR, true, false);
    }
    drawGun(ctx, YOU_X, GUN_Y, run ? run.youAimX : YOU_X, run ? run.youAimY : MOUTH_Y, false);
    drawGun(ctx, GHOST_X, GUN_Y, ghostAim, ghostAimY, true);

    if (!run || spraying || (run && run.cd <= 0)) {
      if (!run || holding || spraying) {
        drawStream(ctx, YOU_X, GUN_Y, youAim, youAimY, youOn && spraying, false);
      }
      /* Ghost stream never blinks — always spraying while the heat is live. */
      drawStream(ctx, GHOST_X, GUN_Y, ghostAim, ghostAimY, !run || spraying, true);
    }
    if (run && spraying && holding && !youOn) {
      ctx.fillStyle = "rgba(126,200,224,0.28)";
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.arc(youAim + (i - 2) * 5.5, youAimY + 6 + (i % 2) * 4, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (tun.mirrorAim) {
      ctx.strokeStyle = "rgba(232,160,184,0.7)";
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(YOU_X, 58);
      ctx.lineTo(YOU_X, GUN_Y - 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(232,160,184,0.9)";
      ctx.font = "10px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("MIRROR — aim the other way", YOU_X, 64);
      ctx.textAlign = "left";
      if (run && !run.done) {
        ctx.strokeStyle = "rgba(240,208,154,0.45)";
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.arc(run.youAimX, run.youAimY, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = "rgba(232,160,184,0.85)";
        ctx.beginPath();
        ctx.arc(run.youStreamX, run.youStreamY, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(240,208,154,0.75)";
        ctx.font = "8px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("HAND", run.youAimX, run.youAimY - 12);
        ctx.fillStyle = "rgba(232,160,184,0.9)";
        ctx.fillText("STREAM", run.youStreamX, run.youStreamY - 14);
        ctx.textAlign = "left";
      }
    }
    if (run && run.feintFlash > 0) {
      ctx.fillStyle = `rgba(232,160,184,${0.2 * (run.feintFlash / 280)})`;
      ctx.fillRect(22, 48, W - 44, H - 78);
    }
    if (run && run.toast && run.toastMs > 0) {
      ctx.fillStyle = "rgba(12,6,9,0.62)";
      ctx.fillRect(40, 118, W - 80, 28);
      ctx.strokeStyle = "rgba(196,30,58,0.85)";
      ctx.strokeRect(40.5, 118.5, W - 81, 27);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "11px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(run.toast, W / 2, 137);
      ctx.textAlign = "left";
    }

    if (run && !run.done && run.cd > 0) {
      ctx.fillStyle = "rgba(12,6,9,0.55)";
      ctx.fillRect(0, 190, W, 52);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "18px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(run.cd > 450 ? hudStageLine(tun, run.won) : "SPRAY!", W / 2, 224);
      ctx.textAlign = "left";
    } else if (run && !run.done && run.pause > 0) {
      ctx.fillStyle = "rgba(12,6,9,0.5)";
      ctx.fillRect(0, 190, W, 52);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "18px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(run.tun && run.tun.coda && run.won === AUTHORED_COUNT
        ? "ENDLESS — ghost reloads"
        : "HEAT WON — ghost reloads", W / 2, 224);
      ctx.textAlign = "left";
    }

    if (run && run.closedStamp) kit.stampClosed(ctx, W, H, "DRY");

    if (run && !run.done) {
      const youPct = Math.floor((run.youFill / tun.fillMax) * 100);
      const ghostPct = Math.floor((run.ghostFill / tun.fillMax) * 100);
      const stallPct = tun.stallLimitMs > 0 ? Math.min(1, run.stallMs / tun.stallLimitMs) : 0;
      const stallWarn = spraying && !run.youOn && run.ghostOn && stallPct > 0.08;
      if (stallWarn) {
        const bx = 24;
        const by = 64;
        const bw = W - 48;
        ctx.fillStyle = "rgba(12,6,9,0.7)";
        ctx.fillRect(bx, by, bw, 10);
        ctx.fillStyle = stallPct > 0.72 ? "#c41e3a" : "#e8a0b8";
        ctx.fillRect(bx, by, bw * stallPct, 10);
        ctx.strokeStyle = "rgba(196,30,58,0.9)";
        ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 9);
        ctx.fillStyle = "#f0d09a";
        ctx.font = "8px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("STALL — HIT THE MOUTH", W / 2, by - 3);
        ctx.textAlign = "left";
      }
      kit.drawHud(ctx, W, [
        `${hudStageLine(tun, run.won)} · ${run.score}`,
        stallWarn
          ? `STALL ${Math.floor(stallPct * 100)}% · Ghost ${ghostPct}%`
          : tun.mirrorAim
            ? `MIRROR · You ${youPct}% · Ghost ${ghostPct}%`
            : tun.twinMouths
              ? `LIVE ONLY · You ${youPct}% · Ghost ${ghostPct}%`
              : `You ${youPct}% · Ghost ${ghostPct}%`,
      ]);
    } else if (!run || !run.closedStamp) {
      kit.drawHud(ctx, W, [hudStageLine(tun, 0), roomTell(tun)]);
    }
  }

  function card() {
    return $("waterGunCard");
  }

  function stampDepthCopy() {
    const host = card();
    if (!host) return;
    const num = host.querySelector(".machine-number");
    if (num) num.textContent = DEPTH_COPY.machine;
    let tag = host.querySelector("[data-pf-depth-tag]");
    if (!tag) {
      tag = document.createElement("p");
      tag.dataset.pfDepthTag = "1";
      tag.className = "pf-depth-tag vendor-vestibule-only";
      tag.setAttribute("role", "status");
      const readout = host.querySelector(".depth-readout");
      if (readout && readout.parentNode) readout.parentNode.insertBefore(tag, readout);
      else host.appendChild(tag);
    }
    tag.textContent = DEPTH_COPY.tag;
    let copy = host.querySelector("[data-pf-depth-copy]");
    if (!copy) {
      copy = document.createElement("p");
      copy.className = "vendor-vestibule-only";
      copy.dataset.pfDepthCopy = "1";
      if (tag.parentNode) tag.parentNode.insertBefore(copy, tag.nextSibling);
      else host.appendChild(copy);
    }
    copy.textContent = DEPTH_COPY.body;
    const readout = host.querySelector(".depth-readout");
    if (readout && readout.getAttribute("data-runkit-hud") === GAME_ID) {
      readout.removeAttribute("data-runkit-hud");
    }
    let rkHud = host.querySelector(".watergun-rk-hud");
    if (!rkHud) {
      rkHud = document.createElement("p");
      rkHud.className = "watergun-rk-hud";
      rkHud.setAttribute("aria-live", "polite");
      if (readout && readout.parentNode) readout.parentNode.insertBefore(rkHud, readout.nextSibling);
      else host.appendChild(rkHud);
    }
    rkHud.setAttribute("data-runkit-hud", GAME_ID);
    paintKitHud(run && run.tun);
    const canvas = $("waterGunCanvas");
    if (canvas) {
      canvas.style.pointerEvents = "auto";
      canvas.classList.toggle("is-locked", !isLive());
    }
    if ((!run || run.done) && $("waterGunStatus")) {
      paintVestibuleCheat(attractSpec());
    }
  }

  function beginKitRun() {
    let feverNode = false;
    if (typeof PF.spendDemoCoin === "function") {
      if (!PF.spendDemoCoin(GAME_ID)) return null;
      feverNode = true;
    }
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      try {
        const ctx = PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1, feverNode });
        if (ctx) return ctx;
      } catch (_) { /* local ctx */ }
    }
    return {
      gameId: GAME_ID,
      startedAt: Date.now(),
      feverNode,
      feverGate: null,
      depth: 0,
      score: 0,
      strikes: 0,
      alive: true,
    };
  }

  function stopIdle() {
    if (idleRaf) cancelAnimationFrame(idleRaf);
    idleRaf = 0;
  }

  function startIdle() {
    if (isLive()) return;
    stopIdle();
    idleClock = 0;
    let last = 0;
    const tick = (now) => {
      if (run && !run.done) {
        idleRaf = 0;
        return;
      }
      if (!last) last = now;
      idleClock += Math.min(32, now - last);
      last = now;
      if (idleClock > 4200) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
        paintVestibuleCheat(waterLevel(idleRoom));
      }
      draw();
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }

  function startHeat(heat) {
    const tun = waterLevel(heat);
    if (!tun) {
      $("waterGunStatus").textContent = AURA.souvenir;
      PF.setAura("celebrate");
      finish("souvenir");
      return;
    }
    run.heat = heat;
    run.tun = tun;
    run.youFill = 0;
    run.ghostFill = 0;
    run.youOn = false;
    run.ghostOn = false;
    run.youAimX = YOU_X;
    run.youAimY = MOUTH_Y + 12;
    run.ghostAimX = GHOST_X;
    run.ghostAimY = MOUTH_Y + 12;
    run.youStreamX = YOU_X;
    run.youStreamY = MOUTH_Y + 12;
    run.ghostShotX = GHOST_X;
    run.ghostShotY = MOUTH_Y + 12;
    run.youFeint = 0;
    run.feintHold = 0;
    run.feintMs = tun.mouthFeints ? 900 : 0;
    run.feintAfter = null;
    run.feintDecoy = null;
    run.feintFlash = 0;
    run.fakeOpen = false;
    run.fakeMs = 0;
    run.stallMs = 0;
    run.hitMs = 0;
    run.toast = "";
    run.toastMs = 0;
    run.cd = 900;
    run.pause = 0;
    paintKitHud(tun);
    if (rk() && typeof rk().reportDepth === "function") {
      rk().reportDepth(run.kitRun, tun.id, { name: tun.name, coda: !!tun.coda });
    }
    if (tun.coda && heat === AUTHORED_COUNT + 1) {
      $("waterGunStatus").textContent = AURA.coda;
    } else {
      $("waterGunStatus").textContent = `${hudStageLine(tun, run.won)} — ${tun.barker || "hold to spray, lead the mouth."}`;
    }
    paintVestibuleCheat(tun);
  }

  function start() {
    if (run && !run.done) return;
    const kitRun = beginKitRun();
    if (!kitRun) {
      $("waterGunStatus").textContent = "Out of demo coins · grant a pass";
      PF.refreshNightBoard();
      return;
    }
    stopIdle();
    const tun = waterLevel(1);
    run = {
      done: false,
      kitRun,
      t: 0,
      last: 0,
      heat: 1,
      won: 0,
      score: 0,
      raf: 0,
      youFill: 0,
      ghostFill: 0,
      youAimX: YOU_X,
      youAimY: MOUTH_Y + 12,
      ghostAimX: GHOST_X,
      ghostAimY: MOUTH_Y + 12,
      youStreamX: YOU_X,
      youStreamY: MOUTH_Y + 12,
      ghostShotX: GHOST_X,
      ghostShotY: MOUTH_Y + 12,
      youOn: false,
      ghostOn: false,
      youFeint: 0,
      feintHold: 0,
      feintMs: 0,
      feintAfter: null,
      feintDecoy: null,
      feintFlash: 0,
      fakeOpen: false,
      fakeMs: 0,
      stallMs: 0,
      hitMs: 0,
      cd: 900,
      pause: 0,
      tun,
      toast: "",
      toastMs: 0,
      closedStamp: false,
      deathNote: "",
    };
    holding = false;
    keys.left = false;
    keys.right = false;
    keys.up = false;
    keys.down = false;
    $("waterGunStart").disabled = true;
    $("waterGunVerdict").hidden = true;
    kit.hideResult("waterGunResult");
    PF.setTier("waterGunTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    if (kitRun) {
      kitRun.depth = 0;
      kitRun.score = 0;
    }
    startHeat(1);
    $("waterGunStatus").textContent = `HEAT 1 · ${tun.name} — ${tun.barker}`;
    paintVestibuleCheat(tun);
    PF.focusCard("waterGunCard", true);
    PF.setAura("think");
    const loop = (now) => {
      if (!run || run.done) return;
      if (!run.last) run.last = now;
      const dt = Math.min(32, now - run.last);
      run.last = now;
      run.t += dt;
      step(dt);
      draw();
      PF.refreshDepth();
      run.raf = requestAnimationFrame(loop);
    };
    run.raf = requestAnimationFrame(loop);
  }

  function step(dt) {
    const tun = run.tun;
    if (keys.left) run.youAimX -= 0.42 * dt;
    if (keys.right) run.youAimX += 0.42 * dt;
    if (keys.up) run.youAimY -= 0.42 * dt;
    if (keys.down) run.youAimY += 0.42 * dt;
    run.youAimX = clamp(run.youAimX, 28, 168);
    run.youAimY = clamp(run.youAimY != null ? run.youAimY : MOUTH_Y + 12, 170, 360);

    const heatLive = run.pause <= 0 && run.cd <= 0;
    if (heatLive && tun.mouthFeints) {
      run.feintMs -= dt;
      if (run.feintDecoy) {
        run.feintDecoy.ms -= dt;
        if (run.feintDecoy.ms <= 0) run.feintDecoy = null;
      } else if (run.feintMs <= 0) {
        const real = mouthPos(tun, YOU_X, run.t, { amp: tun.youAmp, phase: 0.4, feint: 0 });
        const jump = (Math.random() < 0.5 ? 1 : -1) * (62 + tun.id * 2);
        run.feintDecoy = {
          x: clamp(real.x + jump, 36, 164),
          y: clamp(real.y - 10, 188, 352),
          ms: 720,
          r: tun.youR,
        };
        run.feintAfter = { x: run.feintDecoy.x, y: run.feintDecoy.y, ms: 720 };
        run.youFeint = 0;
        run.feintMs = 1500 + Math.random() * 900;
        run.feintFlash = 320;
        run.toast = "FEINT — don’t chase";
        run.toastMs = 640;
        $("waterGunStatus").textContent = "Feint — that’s a fake. Stay on the live mouth.";
      }
    }
    if (run.feintAfter && !run.feintDecoy) {
      run.feintAfter.ms -= dt;
      if (run.feintAfter.ms <= 0) run.feintAfter = null;
    }
    if (run.feintFlash > 0) run.feintFlash -= dt;

    if (run.toastMs > 0) run.toastMs -= dt;
    else run.toast = "";

    if (heatLive && tun.fakeOpenChance > 0) {
      run.fakeMs -= dt;
      if (run.fakeMs <= 0) {
        run.fakeOpen = Math.random() < tun.fakeOpenChance;
        run.fakeMs = run.fakeOpen ? 640 : 2200 + Math.random() * 900;
        if (run.fakeOpen) {
          run.toast = "FAKE-OPEN — no credit";
          run.toastMs = 720;
          $("waterGunStatus").textContent = "Fake-open — no credit, sugar.";
        }
      }
    }

    const youPos = mouthPos(tun, YOU_X, run.t, { amp: tun.youAmp, phase: 0.4, feint: run.youFeint });
    const ghostPos = mouthPos(tun, GHOST_X, run.t, { amp: tun.ghostAmp, phase: 2.1, feint: 0 });
    let youTarget = youPos;
    let ghostTarget = ghostPos;
    if (tun.twinMouths) {
      const yours = twinPair(tun, YOU_X, run.t, false);
      const ghosts = twinPair(tun, GHOST_X, run.t, true);
      youTarget = yours.find((m) => m.active) || yours[0];
      ghostTarget = ghosts.find((m) => m.active) || ghosts[0];
    }
    const track = 1 - Math.exp(-tun.ghostTrack * dt);
    run.ghostAimX += (ghostTarget.x - run.ghostAimX) * track;
    run.ghostAimY += ((ghostTarget.y || MOUTH_Y) - run.ghostAimY) * track;
    run.ghostAimX = clamp(run.ghostAimX, 196, 332);
    run.ghostAimY = clamp(run.ghostAimY, 170, 360);
    const rawStream = run.youAimX + Math.sin(run.t * 0.01) * tun.streamWeave;
    run.youStreamX = tun.mirrorAim
      ? clamp(mirrorX(rawStream), 28, 168)
      : clamp(rawStream, 28, 168);
    run.youStreamY = clamp(run.youAimY, 170, 360);
    run.ghostShotX = clamp(run.ghostAimX + Math.sin(run.t * 0.0074) * tun.ghostWobble, 196, 332);
    run.ghostShotY = clamp(
      run.ghostAimY + 12 + Math.cos(run.t * 0.0062) * tun.ghostWobble * 0.35,
      170,
      360
    );

    if (run.pause > 0) {
      run.pause -= dt;
      if (run.pause <= 0) startHeat(run.heat + 1);
      return;
    }
    if (run.cd > 0) {
      run.cd -= dt;
      return;
    }

    const youDx = run.youStreamX - youTarget.x;
    const youDy = run.youStreamY - ((youTarget.y != null ? youTarget.y : MOUTH_Y) + 12);
    const youDist = Math.hypot(youDx, youDy);
    /* Zigzag is a 2D map: stream must overlap mouth in X AND Y. Spray-anywhere does not fill. */
    const onMouth = holding && youDist <= tun.youR * 1.15;
    let chasingFeint = false;
    if (run.feintDecoy && holding) {
      const fd = Math.hypot(
        run.youStreamX - run.feintDecoy.x,
        run.youStreamY - (run.feintDecoy.y + 12)
      );
      if (fd <= (run.feintDecoy.r || tun.youR) * 1.3 && fd + 6 < youDist) {
        chasingFeint = true;
        run.toast = "FEINT — that’s a fake";
        run.toastMs = Math.max(run.toastMs, 360);
        $("waterGunStatus").textContent = "Feint — that’s a fake.";
      }
    }
    run.youOn = onMouth && !run.fakeOpen && !chasingFeint;
    if (tun.twinMouths && holding) {
      const yours = twinPair(tun, YOU_X, run.t, false);
      const shut = yours.find((m) => !m.active);
      if (shut) {
        const shutDist = Math.hypot(
          run.youStreamX - shut.x,
          run.youStreamY - (shut.y + 12)
        );
        if (shutDist <= tun.youR * 1.2 && !onMouth) {
          run.toast = "WRONG MOUTH — only LIVE fills";
          run.toastMs = Math.max(run.toastMs, 360);
          $("waterGunStatus").textContent = "Wrong mouth — only the live one fills.";
        }
      }
      const period = tun.twinPeriodMs || 2200;
      const left = period - (run.t % period);
      if (left < 420 && left > 40) {
        run.toast = run.toast && run.toast.indexOf("WRONG") === 0 ? run.toast : "SWAP";
        if (run.toast === "SWAP") run.toastMs = Math.max(run.toastMs, 180);
      }
    }
    const ghostDist = Math.hypot(
      run.ghostShotX - ghostTarget.x,
      run.ghostShotY - ((ghostTarget.y || MOUTH_Y) + 12)
    );
    run.ghostOn = ghostDist <= tun.ghostR * 1.05;
    if (run.youOn) {
      run.youFill = Math.min(tun.fillMax, run.youFill + tun.yourRate * RATE_MS * dt);
      run.hitMs += dt;
    } else if (onMouth && run.fakeOpen) {
      run.toast = "FAKE-OPEN — no credit";
      run.toastMs = Math.max(run.toastMs, 280);
      $("waterGunStatus").textContent = "Fake-open — no credit, sugar.";
    }
    /* Ghost stream never blinks (always spraying). Fill only while on the live mouth.
     * Tight tracking keeps this a duel, not a missing NPC. Spray-anywhere does not fill. */
    if (run.ghostOn) {
      run.ghostFill = Math.min(tun.fillMax, run.ghostFill + tun.ghostRate * RATE_MS * dt);
    }

    const covering = run.youOn || (onMouth && run.fakeOpen) || chasingFeint;
    if (covering) {
      /* On-mouth including a lie still counts as a hit for stall. Fake-open denies fill, not the stream. */
      run.stallMs = 0;
    } else if (run.ghostOn) {
      /* Stall counts while the ghost advances — not while both streams miss. */
      run.stallMs += dt;
      if (run.stallMs >= tun.stallLimitMs) {
        run.deathNote = "stall";
        finish("stall");
        return;
      }
    }

    if (run.youFill >= tun.fillMax && run.youFill >= run.ghostFill) {
      const leftover = Math.max(0, Math.floor(run.youFill - run.ghostFill));
      run.won += 1;
      run.score += 300 + leftover;
      run.youFill = tun.fillMax;
      saveLiveDepth();
      if (rk() && typeof rk().reportDepth === "function") {
        rk().reportDepth(run.kitRun, run.won, { name: tun.name, coda: !!tun.coda });
      }
      kit.sfx("rack");
      PF.setAura("celebrate");
      const next = waterLevel(run.heat + 1);
      if (!next) {
        $("waterGunStatus").textContent = AURA.souvenir;
        finish("souvenir");
        return;
      }
      $("waterGunStatus").textContent = next.coda && run.won === AUTHORED_COUNT
        ? AURA.coda
        : AURA.clear;
      run.pause = 780;
      return;
    }
    if (run.ghostFill >= tun.fillMax) {
      run.deathNote = "ghost_win";
      finish("ghost_win");
    }
  }

  function aimFromEvent(ev) {
    const canvas = $("waterGunCanvas");
    if (!canvas || !run) return;
    const p = kit.canvasPos(canvas, ev, W, H);
    run.youAimX = clamp(p.x, 28, 168);
    run.youAimY = clamp(p.y, 170, 360);
  }

  function auraLine(reason, won) {
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "leave") return AURA.leave;
    if (won >= 6) return AURA.deep(won);
    if (reason === "stall") return AURA.stall;
    if (reason === "ghost_win") return AURA.ghostWin;
    const kitRun = rk();
    if (kitRun && typeof kitRun.auraDeathLine === "function") {
      return `Aura: ${kitRun.auraDeathLine(GAME_ID, won, reason)}`;
    }
    return AURA.ghostWin;
  }

  function challengeLine(n) {
    const kitRun = rk();
    if (kitRun && typeof kitRun.challengeText === "function") {
      return kitRun.challengeText("Water Gun heat", n | 0, GAME_ID);
    }
    return `Beat my Water Gun heat ${n | 0} on Penny Fever`;
  }

  function revealWaterResult(deathReason) {
    if (!run) return;
    const won = run.won;
    const heat = run.heat;
    const score = run.score;
    stampDepthCopy();
    $("waterGunStart").disabled = false;
    $("waterGunStart").textContent = "SPRAY AGAIN · 1 demo coin";
    PF.focusCard("waterGunCard", false);
    kit.setMode(card(), "result");
    paintKitHud(null);
    const roomName = (run.tun && run.tun.name) || "";
    const line = `HEAT ${won}${roomName ? " · " + roomName : ""} · SCORE ${score}`;
    const aura = auraLine(deathReason, won);
    const challenge = challengeLine(won);
    $("waterGunVerdict").hidden = false;
    $("waterGunVerdict").textContent = deathReason === "souvenir"
      ? `Souvenir clear. ${line} · authored ride done.`
      : deathReason === "leave"
        ? `Stepped off the lane · ${line}`
        : deathReason === "stall"
          ? `Stream dry. ${line} · ${deathReason} · fell on heat ${heat}.`
          : `Ghost filled first. ${line} · ${deathReason} · fell on heat ${heat}.`;
    kit.fillResult({
      root: "waterGunResult",
      depth: "waterGunResultDepth",
      score: "waterGunResultScore",
      aura: "waterGunResultAura",
      copied: "waterGunCopied",
    }, {
      depthLine: `HEAT ${won}${roomName ? " · " + roomName : ""}`,
      scoreLine: `SCORE ${score} · ${deathReason}`,
      auraLine: aura,
    });
    const ch = $("waterGunChallengeText");
    if (ch) ch.textContent = challenge;
    PF.setTier("waterGunTier", won > 0 ? `HEATS ${won}` : "DRY", won > 0 ? "perfect" : "miss");
    $("waterGunStatus").textContent = deathReason === "souvenir"
      ? "Souvenir — authored heats cleared."
      : deathReason === "leave"
        ? "Left the lane."
        : deathReason === "stall"
          ? "Stream dry — stall while the ghost advanced."
          : "Ghost stamped DRY.";
    const ok = won > 0 || deathReason === "souvenir";
    if (ok) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Water gun");
      PF.setAura(won >= 4 ? "celebrate" : "point");
      if (deathReason !== "leave") PF.showBanner(true, `HEATS ${won}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Water gun miss");
      PF.setAura("badLuck");
      if (deathReason !== "leave") PF.showBanner(false, "DRY", aura);
    }
    PF.refreshNightBoard();
    draw();
    startIdle();
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    if (run.raf) cancelAnimationFrame(run.raf);
    holding = false;
    keys.left = false;
    keys.right = false;
    keys.up = false;
    keys.down = false;
    const deathReason = reason === "souvenir" ? "souvenir"
      : reason === "leave" ? "leave"
        : (reason === "stall" ? "stall" : "ghost_win");
    run.closedStamp = deathReason !== "leave" && deathReason !== "souvenir";
    if (run.closedStamp) kit.sfx("stamp");
    persistDepth({
      depth: run.won,
      score: run.score,
      deathReason,
      cashedOut: deathReason === "souvenir",
      meta: {
        heat: run.heat,
        room: run.tun && run.tun.name,
        coda: !!(run.tun && run.tun.coda),
        youFill: run.youFill,
        ghostFill: run.ghostFill,
      },
    });
    draw();
    if (run.closedStamp) {
      setTimeout(() => revealWaterResult(deathReason), STAMP_MS);
    } else {
      revealWaterResult(deathReason);
    }
  }

  PF.registerVendor({
    id: "water-gun",
    playKey: "watergun",
    chalk: "First to fill. The ghost lane never blinks.",
    defaults: { bestWaterGun: 0, bestWaterGunScore: 0 },
    onLeave() {
      if (run && !run.done) finish("leave");
      stopIdle();
    },
    onShow() { stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      holding = false;
      keys.left = false;
      keys.right = false;
      keys.up = false;
      keys.down = false;
      if ($("waterGunVerdict")) $("waterGunVerdict").hidden = true;
      kit.hideResult("waterGunResult");
      if ($("waterGunStart")) {
        $("waterGunStart").disabled = false;
        $("waterGunStart").textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      stampDepthCopy();
      startIdle();
    },
    refreshDepth(state) {
      const now = $("depthGunNow");
      if (now) now.textContent = run && !run.done ? String(run.won) : "0";
      const best = $("depthGunBest");
      const bestN = Math.max(state.bestWaterGun || 0, (state.bestDepth && state.bestDepth.watergun) || 0);
      if (best) best.textContent = bestN ? String(bestN) : "—";
      const sc = $("depthGunScore");
      if (sc) sc.textContent = run && !run.done ? String(run.score) : "0";
      const bs = $("depthGunBestScore");
      if (bs) bs.textContent = state.bestWaterGunScore ? String(state.bestWaterGunScore) : "—";
    },
    bind() {
      declareP0();
      const startBtn = $("waterGunStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = $("waterGunCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            punchStart();
            return;
          }
          ev.preventDefault();
          holding = true;
          aimFromEvent(ev);
          try { canvas.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
        });
        canvas.addEventListener("pointermove", (ev) => {
          if (!isLive() || !holding) return;
          aimFromEvent(ev);
        });
        const release = () => { holding = false; };
        canvas.addEventListener("pointerup", release);
        canvas.addEventListener("pointercancel", release);
      }
      window.addEventListener("keydown", (ev) => {
        if (!isLive()) return;
        if (ev.code === "Space" || ev.key === " ") {
          ev.preventDefault();
          holding = true;
        }
        if (ev.code === "ArrowLeft" || ev.code === "KeyA") keys.left = true;
        if (ev.code === "ArrowRight" || ev.code === "KeyD") keys.right = true;
        if (ev.code === "ArrowUp" || ev.code === "KeyW") keys.up = true;
        if (ev.code === "ArrowDown" || ev.code === "KeyS") keys.down = true;
      });
      window.addEventListener("keyup", (ev) => {
        if (ev.code === "Space" || ev.key === " ") holding = false;
        if (ev.code === "ArrowLeft" || ev.code === "KeyA") keys.left = false;
        if (ev.code === "ArrowRight" || ev.code === "KeyD") keys.right = false;
        if (ev.code === "ArrowUp" || ev.code === "KeyW") keys.up = false;
        if (ev.code === "ArrowDown" || ev.code === "KeyS") keys.down = false;
      });
      const copyBtn = $("waterGunChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const state = PF.getState();
          const last = state.lastRun || {};
          const keyed = last[GAME_ID];
          const n = keyed && keyed.depth != null
            ? keyed.depth
            : (last.game === GAME_ID || last.gameId === GAME_ID)
              ? last.depth
              : (state.bestWaterGun || (state.bestDepth && state.bestDepth.watergun) || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const el = $("waterGunCopied");
            if (el) {
              el.hidden = false;
              el.textContent = "Copied — send it";
            }
            $("waterGunStatus").textContent = "Copied — send it";
          }, () => {
            $("waterGunStatus").textContent = text;
          });
        });
      }
      stampDepthCopy();
      draw();
    },
  });
})();
