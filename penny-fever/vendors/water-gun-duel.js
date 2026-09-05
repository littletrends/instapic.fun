/* Water Gun Duel — Desktop Grok owns this file. PF only. Never booth/port 6000.
 * Authored HEAT rooms (GOBLIN_AUTHORED_LEVELS_P0.md) + BATCH02 scoring.
 * Engine: Custom hold-spray · depthUnit: Heat · gameId: watergun · codaEnabled */
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
  let run = null;
  let holding = false;
  let keys = { left: false, right: false };
  let idleRaf = 0;

  const AURA = {
    ghostWin: "Aura: Ghost filled first. Mouth dodged you cold.",
    stall: "Aura: Stream dry. Clown mouth wandered off.",
    clear: "Aura: Heat won. Wrist hotter.",
    souvenir: "Aura: Heat seven locked. Souvenir — the ghost tips its hat.",
    coda: "Aura: Authored ride’s over. ENDLESS — mouths keep lying.",
    deep: (n) => `Aura: Heat ${n}. Lane B felt that spray.`,
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
      mirrorAim: false, youAmp: 18, ghostAmp: 10, stallLimitMs: 2200,
      barker: "Straight lane. Hold the mouth. Ghost is slow.",
    },
    {
      id: 2, name: "Sine Smile", kind: "sine", path: "sine",
      hitbox: "big", youR: 22, mouthSpeed: 0.55, yourRate: 1.0, ghostRate: 0.7,
      fillMax: 100, mouthFeints: false, fakeOpenChance: 0, twinMouths: false,
      mirrorAim: false, youAmp: 28, ghostAmp: 14, stallLimitMs: 2000,
      barker: "The mouth rides a sine. Lead the wave.",
    },
    {
      id: 3, name: "Feint Clown", kind: "feint", path: "sine",
      hitbox: "mid", youR: 16.5, mouthSpeed: 0.7, yourRate: 1.0, ghostRate: 0.85,
      fillMax: 110, mouthFeints: true, fakeOpenChance: 0, twinMouths: false,
      mirrorAim: false, youAmp: 26, ghostAmp: 14, stallLimitMs: 1800,
      barker: "It fakes a dodge. Don’t chase the feint.",
    },
    {
      id: 4, name: "Twin Mouth Map", kind: "twinMouth", path: "twin",
      hitbox: "mid", youR: 16.5, mouthSpeed: 0.72, yourRate: 1.0, ghostRate: 0.9,
      fillMax: 110, mouthFeints: false, fakeOpenChance: 0, twinMouths: true,
      mirrorAim: false, youAmp: 12, ghostAmp: 10, stallLimitMs: 1700, twinPeriodMs: 2100,
      barker: "Two mouths. Only the live one fills.",
    },
    {
      id: 5, name: "Zigzag Duel", kind: "zigzag", path: "zigzag",
      hitbox: "small", youR: 12.2, mouthSpeed: 0.95, yourRate: 0.95, ghostRate: 0.95,
      fillMax: 120, mouthFeints: false, fakeOpenChance: 0, twinMouths: false,
      mirrorAim: false, youAmp: 34, ghostAmp: 18, zigAmp: 32, stallLimitMs: 1500,
      barker: "Diagonal zigzag. Drag the stream onto the map.",
    },
    {
      id: 6, name: "Fake-Open Fair", kind: "fakeOpen", path: "sine",
      hitbox: "small", youR: 12.8, mouthSpeed: 1.0, yourRate: 0.9, ghostRate: 1.05,
      fillMax: 120, mouthFeints: false, fakeOpenChance: 0.2, twinMouths: false,
      mirrorAim: false, youAmp: 30, ghostAmp: 16, stallLimitMs: 1400,
      barker: "Sometimes the mouth lies. Fake-open is no credit.",
    },
    {
      id: 7, name: "Mirror Lane", kind: "mirror", path: "sine",
      hitbox: "mid", youR: 15.5, mouthSpeed: 0.88, yourRate: 0.95, ghostRate: 1.0,
      fillMax: 120, mouthFeints: true, fakeOpenChance: 0, twinMouths: false,
      mirrorAim: true, youAmp: 28, ghostAmp: 16, stallLimitMs: 1300,
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
    const youR = Math.max(9.5, 12.2 - t * 0.35);
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
      yourRate: 0.85,
      ghostRate: 1.05 + 0.05 * t,
      fillMax: 120,
      mouthFeints: true,
      fakeOpenChance: 0.2,
      twinMouths: false,
      mirrorAim: t % 3 === 0,
      stallLimitMs: Math.max(900, 1300 - t * 40),
      youAmp: 30 + t * 2,
      ghostAmp: 16 + t,
      zigAmp: 28,
      streamWeave: 3.4 + t * 0.4,
      ghostTrack: 0.0032 + t * 0.0004,
      ghostWobble: Math.max(4, 12 - t * 0.6),
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
        ghostTrack: 0.0024 + heat * 0.00035,
        ghostWobble: Math.max(4, 18 - heat * 1.1),
        zigAmp: 28,
        twinPeriodMs: 2100,
      }, L, { id: heat, title: L.name, name: L.name, youR, ghostR: youR + 5.5 });
    }
    if (!CODA_ENABLED) return null;
    return waterCodaParams(heat);
  }

  function watergunStageParams(n) {
    return waterLevel(n) || waterCodaParams(Math.max(AUTHORED_COUNT + 1, n | 0));
  }

  function hudStageLine(spec, won) {
    if (!spec) return `HEAT ${won | 0}`;
    if (spec.coda) return `ENDLESS · HEAT ${spec.id} · ${spec.name}`;
    return `HEAT ${spec.id} · ${spec.name}`;
  }

  function roomTell(spec) {
    if (!spec) return "FILL THE MOUTH";
    if (spec.kind === "straight") return "STRAIGHT LANE · HOLD THE MOUTH";
    if (spec.kind === "sine") return "SINE PATH · LEAD THE WAVE";
    if (spec.kind === "feint") return "FEINT — DON’T CHASE THE FAKE";
    if (spec.kind === "twinMouth") return "TWO MOUTHS · ONLY LIVE FILLS";
    if (spec.kind === "zigzag") return "ZIGZAG MAP · DRAG THE STREAM";
    if (spec.kind === "fakeOpen") return "FAKE-OPEN IS A LIE";
    if (spec.kind === "mirror") return "MIRROR — STREAM FLIPS";
    if (spec.coda) return "ENDLESS · MOUTHS KEEP LYING";
    return "FILL THE MOUTH";
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      authored: WATER_LEVELS,
      authoredCount: AUTHORED_COUNT,
      codaEnabled: CODA_ENABLED,
      codaParams: waterCodaParams,
      level: waterLevel,
      stageParams: waterLevel,
    }, P0_MOUNT);
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

  function punchStart() {
    stampDepthCopy();
    const el = $("waterGunStatus");
    if (el) el.textContent = DEPTH_COPY.punch;
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

  function triangle(u) {
    const x = ((u % 4) + 4) % 4;
    if (x < 1) return x;
    if (x < 2) return 2 - x;
    if (x < 3) return 2 - x;
    return x - 4;
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
    if (kind === "straight" || path === "horizontal") {
      const u = (t * spd * 0.0018 + phase) % 2;
      const tri = u < 1 ? u * 2 - 1 : 3 - u * 2;
      x = laneX + tri * amp * 0.7 + feint;
    } else if (kind === "zigzag" || path === "zigzag") {
      const u = t * spd * 0.0034 + phase;
      x = laneX + triangle(u) * amp + feint;
      y = MOUTH_Y + triangle(u * 0.85 + 1.1) * (spec.zigAmp || 28);
    } else if (kind === "twinMouth" || path === "twin") {
      x = laneX + Math.sin(t * spd * 0.0024 + phase) * amp * 0.35 + feint;
    } else {
      x = mouthX(laneX, amp, spd * 0.0052, phase, t, feint);
    }
    return { x, y };
  }

  function twinPair(spec, laneX, t, ghost) {
    const period = spec.twinPeriodMs || 2100;
    const active = Math.floor(t / period) % 2;
    const spread = 30;
    const wob = Math.sin(t * 0.0022) * 4;
    return [
      { x: laneX - spread + wob, y: MOUTH_Y, active: active === 0, ghost },
      { x: laneX + spread - wob, y: MOUTH_Y, active: active === 1, ghost },
    ];
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function mirrorX(x) {
    return YOU_X * 2 - x;
  }

  function drawClown(ctx, x, y, r, ghost, fake) {
    ctx.save();
    ctx.globalAlpha = ghost ? 0.55 : 1;
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
    ctx.ellipse(x, y + 12, fake ? r * 1.18 : r, r * 0.78, 0, 0, Math.PI * 2);
    ctx.fillStyle = fake ? "rgba(196,30,58,0.55)" : "#0a0508";
    ctx.fill();
    ctx.strokeStyle = fake ? "#c41e3a" : (ghost ? "#b8e8e0" : "#f0d09a");
    ctx.lineWidth = ghost ? 2.4 : 1.6;
    ctx.stroke();
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
    if (!spec || spec.twinMouths) return;
    ctx.save();
    ctx.strokeStyle = ghost ? "rgba(184,232,224,0.22)" : "rgba(240,208,154,0.38)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const amp = ghost ? spec.ghostAmp : spec.youAmp;
    const phase = ghost ? 2.1 : 0.4;
    for (let i = 0; i <= 28; i += 1) {
      const t = (i / 28) * 4200;
      const p = mouthPos(spec, laneX, t, { amp, phase });
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
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

    const t = run ? run.t : 900;
    const tun = run ? run.tun : waterLevel(1);
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
    if (!run || !run.done) {
      ctx.fillStyle = "rgba(240,208,154,0.78)";
      ctx.font = "9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(roomTell(tun), W / 2, H - 18);
      ctx.textAlign = "left";
    }
    if (tun.twinMouths) {
      twinPair(tun, YOU_X, t, false).forEach((m) => {
        ctx.save();
        ctx.globalAlpha = m.active ? 1 : 0.38;
        drawClown(ctx, m.x, m.y, tun.youR, false, fake && m.active);
        ctx.restore();
        if (m.active) {
          ctx.fillStyle = "#f0d09a";
          ctx.font = "9px Georgia, serif";
          ctx.textAlign = "center";
          ctx.fillText("LIVE", m.x, m.y - 38);
          ctx.textAlign = "left";
        }
      });
      twinPair(tun, GHOST_X, t, true).forEach((m) => {
        ctx.save();
        ctx.globalAlpha = m.active ? 0.9 : 0.32;
        drawClown(ctx, m.x, m.y, tun.ghostR, true, false);
        ctx.restore();
      });
    } else {
      drawClown(ctx, youPos.x, youPos.y, tun.youR, false, fake);
      drawClown(ctx, ghostPos.x, ghostPos.y, tun.ghostR, true, false);
    }
    drawGun(ctx, YOU_X, GUN_Y, run ? run.youAimX : YOU_X, run ? run.youAimY : MOUTH_Y, false);
    drawGun(ctx, GHOST_X, GUN_Y, ghostAim, ghostAimY, true);

    if (!run || spraying || (run && run.cd <= 0)) {
      if (!run || holding || spraying) {
        drawStream(ctx, YOU_X, GUN_Y, youAim, youAimY, youOn && spraying, false);
      }
      drawStream(ctx, GHOST_X, GUN_Y, ghostAim, ghostAimY, ghostOn && (!run || spraying), true);
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
      ctx.fillStyle = "rgba(232,160,184,0.85)";
      ctx.font = "10px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("MIRROR — stream flips", YOU_X, 64);
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
      const stallWarn = spraying && !run.youOn && run.ghostOn && run.stallMs > tun.stallLimitMs * 0.4;
      kit.drawHud(ctx, W, [
        `${hudStageLine(tun, run.won)} · won ${run.won} · ${run.score}`,
        stallWarn
          ? `STALL — hit the mouth · Ghost ${ghostPct}%`
          : tun.mirrorAim
            ? `MIRROR · You ${youPct}% · Ghost ${ghostPct}%`
            : `You ${youPct}% · Ghost ${ghostPct}%`,
      ]);
    } else if (!run || !run.closedStamp) {
      kit.drawHud(ctx, W, DEPTH_COPY.idleHud);
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
    const canvas = $("waterGunCanvas");
    if (canvas) {
      canvas.style.pointerEvents = "auto";
      canvas.classList.toggle("is-locked", !isLive());
    }
    if ((!run || run.done) && $("waterGunStatus")) {
      $("waterGunStatus").textContent = DEPTH_COPY.status;
    }
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("watergun")
      ? { gameId: GAME_ID, startedAt: Date.now(), feverNode: false, feverGate: null, depth: 0, score: 0, strikes: 0, alive: true }
      : null;
  }

  function stopIdle() {
    if (idleRaf) cancelAnimationFrame(idleRaf);
    idleRaf = 0;
  }

  function startIdle() {
    if (isLive()) return;
    stopIdle();
    const tick = () => {
      if (run && !run.done) {
        idleRaf = 0;
        return;
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
    run.fakeOpen = false;
    run.fakeMs = 0;
    run.stallMs = 0;
    run.hitMs = 0;
    run.cd = 900;
    run.pause = 0;
    if (tun.coda && heat === AUTHORED_COUNT + 1) {
      $("waterGunStatus").textContent = AURA.coda;
    } else {
      $("waterGunStatus").textContent = `${hudStageLine(tun, run.won)} — ${tun.barker || "hold to spray, lead the mouth."}`;
    }
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
      fakeOpen: false,
      fakeMs: 0,
      stallMs: 0,
      hitMs: 0,
      cd: 900,
      pause: 0,
      tun,
      closedStamp: false,
      deathNote: "",
    };
    holding = false;
    if (rk() && typeof rk().reportDepth === "function") {
      rk().reportDepth(kitRun, 0, { name: tun.name, coda: !!tun.coda });
    }
    $("waterGunStart").disabled = true;
    $("waterGunVerdict").hidden = true;
    kit.hideResult("waterGunResult");
    PF.setTier("waterGunTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    $("waterGunStatus").textContent = `HEAT 1 · ${tun.name} — ${tun.barker}`;
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
    run.youAimX = clamp(run.youAimX, 28, 168);
    run.youAimY = clamp(run.youAimY != null ? run.youAimY : MOUTH_Y + 12, 170, 360);

    if (tun.mouthFeints) {
      run.feintMs -= dt;
      if (run.feintHold > 0) {
        run.feintHold -= dt;
        if (run.feintHold <= 0) run.youFeint = 0;
      } else if (run.feintMs <= 0) {
        run.youFeint = (Math.random() < 0.5 ? 1 : -1) * (16 + tun.id * 1.6);
        run.feintHold = 280;
        run.feintMs = 1400 + Math.random() * 900;
      }
    }

    if (tun.fakeOpenChance > 0) {
      run.fakeMs -= dt;
      if (run.fakeMs <= 0) {
        run.fakeOpen = Math.random() < tun.fakeOpenChance;
        run.fakeMs = run.fakeOpen ? 640 : 2200 + Math.random() * 900;
        if (run.fakeOpen) $("waterGunStatus").textContent = "Fake-open — no credit, sugar.";
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
    run.ghostAimY += ((ghostTarget.y || MOUTH_Y) - run.ghostAimY) * track * 0.85;
    run.ghostAimX = clamp(run.ghostAimX, 196, 332);
    run.ghostAimY = clamp(run.ghostAimY, 170, 360);
    const rawStream = run.youAimX + Math.sin(run.t * 0.01) * tun.streamWeave;
    run.youStreamX = tun.mirrorAim
      ? clamp(mirrorX(rawStream), 28, 168)
      : clamp(rawStream, 28, 168);
    run.youStreamY = clamp(run.youAimY, 170, 360);
    run.ghostShotX = clamp(run.ghostAimX + Math.sin(run.t * 0.0074) * tun.ghostWobble, 196, 332);
    run.ghostShotY = clamp((ghostTarget.y || MOUTH_Y) + 12, 170, 360);

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
    const youDy = run.youStreamY - ((youTarget.y || MOUTH_Y) + 12);
    const youDist = Math.hypot(youDx, youDy);
    const aimHit = holding && youDist <= tun.youR * 1.15;
    run.youOn = aimHit && !run.fakeOpen;
    const ghostDist = Math.hypot(
      run.ghostShotX - ghostTarget.x,
      run.ghostShotY - ((ghostTarget.y || MOUTH_Y) + 12)
    );
    run.ghostOn = ghostDist <= tun.ghostR * 0.95;
    if (run.youOn) {
      run.youFill = Math.min(tun.fillMax, run.youFill + tun.yourRate * RATE_MS * dt);
      run.hitMs += dt;
      run.stallMs = 0;
    } else if (holding && aimHit && run.fakeOpen) {
      $("waterGunStatus").textContent = "Fake mouth — no credit.";
    }
    if (run.ghostOn) run.ghostFill = Math.min(tun.fillMax, run.ghostFill + tun.ghostRate * RATE_MS * dt);

    if (!run.youOn && run.ghostOn) {
      run.stallMs += dt;
      if (run.stallMs >= tun.stallLimitMs) {
        run.deathNote = "stall";
        finish("stall");
        return;
      }
    } else if (run.youOn) {
      run.stallMs = 0;
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
    if (won >= 6) return AURA.deep(won);
    if (reason === "stall") return AURA.stall;
    return AURA.ghostWin;
  }

  function challengeLine(n) {
    return `Beat my Water Gun heat ${n | 0} on Penny Fever`;
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    if (run.raf) cancelAnimationFrame(run.raf);
    holding = false;
    const deathReason = reason === "souvenir" ? "souvenir"
      : reason === "leave" ? "leave"
        : (reason === "stall" ? "stall" : "ghost_win");
    run.closedStamp = deathReason !== "leave" && deathReason !== "souvenir";
    if (run.closedStamp) kit.sfx("stamp");
    const won = run.won;
    const heat = run.heat;
    const score = run.score;
    persistDepth({
      depth: won,
      score,
      deathReason,
      cashedOut: deathReason === "souvenir",
      meta: {
        heat,
        room: run.tun && run.tun.name,
        coda: !!(run.tun && run.tun.coda),
        youFill: run.youFill,
        ghostFill: run.ghostFill,
      },
    });
    stampDepthCopy();
    $("waterGunStart").disabled = false;
    $("waterGunStart").textContent = "SPRAY AGAIN · 1 demo coin";
    PF.focusCard("waterGunCard", false);
    kit.setMode(card(), "result");
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
      : deathReason === "leave" ? "Left the lane." : "Ghost stamped DRY.";
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
      });
      window.addEventListener("keyup", (ev) => {
        if (ev.code === "Space" || ev.key === " ") holding = false;
        if (ev.code === "ArrowLeft" || ev.code === "KeyA") keys.left = false;
        if (ev.code === "ArrowRight" || ev.code === "KeyD") keys.right = false;
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
            if (el) el.hidden = false;
            $("waterGunStatus").textContent = "Challenge copied";
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
