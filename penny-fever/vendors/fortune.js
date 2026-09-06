/* Mystic Fortune Tent — Crystal Well. Desktop Grok owns this doorway.
 * PF only. Never booth/port 6000. Never Imagine.
 * FULL 3D GAME (not the old wait-loop / ticket form):
 *   Steer a crystal well on Aura's table. Catch tonight's falling sign.
 *   The well drinks gold. Red sparks crack the glass. Fill, then go deeper.
 *   8 authored rooms then ENDLESS night. One coin = one run.
 * Aura lock: pigtails, yellow crown + heart, green pinafore, black shoes.
 * Family-safe. No casino. No Mirror Crew.
 */
import * as THREE from "../world/lib/three.module.min.js";

(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;

  const GAME_ID = "fortune";
  const CABINET_ID = "cabinet-fortune";
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const DEATH_HOLD_MS = 820;
  const POOL = 22;
  const TABLE_R = 1.18;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;
  const SHOE = 0x141414;

  const SIGNS = ["star", "moon", "heart", "lantern", "eye", "ticket"];
  const SIGN_GLYPH = {
    star: "★ STAR",
    moon: "☾ MOON",
    heart: "♥ HEART",
    lantern: "🏮 LANTERN",
    eye: "◉ EYE",
    ticket: "🎟 TICKET",
  };

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Mystic Fortune Tent",
    depthUnit: "Room",
    sheet: "GOBLIN_BATCH09_BUILD_SHEETS.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const LAW_LINE = "Move well · gold drinks · red cracks.";

  const DEPTH_COPY = {
    tag: "DEPTH RUN · MOVE WELL · GOLD DRINKS · RED CRACKS · 8 rooms then ENDLESS",
    body: "Steer the crystal. Gold signs sip into the well. Red sparks shatter the glass. No ticket form. No wait-loop. Depth is rooms filled.",
    status: LAW_LINE,
  };

  const AUTHORED = [
    {
      id: 1, title: "First Light", kind: "teach",
      need: 5, timeLimit: 30, catchR: 0.44, suctionR: 0.78, fall: 0.92,
      spawnMs: 720, missLimit: 4, grace: 1, sparks: 0.2, liarChance: 0,
      trueSign: "star", mixed: false, twin: false, mailbox: false, hazy: false,
      pulse: false, ceiling: false, teachPair: true, teachHoldMs: 900,
      barker: LAW_LINE,
    },
    {
      id: 2, title: "Lantern Rain", kind: "lantern",
      need: 6, timeLimit: 26, catchR: 0.38, suctionR: 0.68, fall: 1.08,
      spawnMs: 600, missLimit: 3, grace: 0, sparks: 0.1, liarChance: 0,
      trueSign: "lantern", mixed: true, twin: false, mailbox: false, hazy: false,
      pulse: false, ceiling: false,
      barker: "LANTERNS only. Stars are decoys — let them fall.",
    },
    {
      id: 3, title: "Twin Moons", kind: "twin",
      need: 4, timeLimit: 34, catchR: 0.36, suctionR: 0.62, fall: 1.05,
      spawnMs: 560, missLimit: 3, grace: 0, sparks: 0.08, liarChance: 0,
      trueSign: "moon", mixed: false, twin: true, mailbox: false, hazy: false,
      pulse: false, ceiling: false,
      barker: "Two moons. SPACE or click a well to SWITCH. Fill both.",
    },
    {
      id: 4, title: "Liar Spark", kind: "liar",
      need: 7, timeLimit: 26, catchR: 0.34, suctionR: 0.58, fall: 1.16,
      spawnMs: 500, missLimit: 3, grace: 0, sparks: 0.06, liarChance: 0.34,
      trueSign: "star", mixed: false, twin: false, mailbox: false, hazy: false,
      pulse: false, ceiling: false,
      barker: "Gold that FLASHES red is a liar. Dodge the flip — don’t catch it.",
    },
    {
      id: 5, title: "Star Map", kind: "starmap",
      need: 8, timeLimit: 24, catchR: 0.32, suctionR: 0.54, fall: 1.22,
      spawnMs: 470, missLimit: 3, grace: 0, sparks: 0.1, liarChance: 0,
      trueSign: null, mixed: true, twin: false, mailbox: false, hazy: false,
      pulse: false, ceiling: true,
      barker: "Look UP. Catch only the ceiling sign. Wrong signs crack the glass.",
    },
    {
      id: 6, title: "Heart Mail", kind: "mailbox",
      need: 6, timeLimit: 22, catchR: 0.34, suctionR: 0.56, fall: 1.14,
      spawnMs: 500, missLimit: 3, grace: 0, sparks: 0.1, liarChance: 0,
      trueSign: "heart", mixed: true, twin: false, mailbox: true, hazy: false,
      pulse: false, ceiling: false, mailMs: 8000,
      barker: "Catch HEARTS, then DRAG the crystal into the heart mailbox.",
    },
    {
      id: 7, title: "Hazy Veil", kind: "hazy",
      need: 8, timeLimit: 26, catchR: 0.32, suctionR: 0.52, fall: 1.18,
      spawnMs: 460, missLimit: 3, grace: 0, sparks: 0.12, liarChance: 0,
      trueSign: "moon", mixed: true, twin: false, mailbox: false, hazy: true,
      pulse: false, ceiling: false,
      barker: "Fog eats the tent. The well only sees what’s close. Trust the pull.",
    },
    {
      id: 8, title: "Midnight Choir", kind: "altar",
      need: 10, timeLimit: 28, catchR: 0.28, suctionR: 0.48, fall: 1.34,
      spawnMs: 390, missLimit: 2, grace: 0, sparks: 0.16, liarChance: 0.22,
      trueSign: "eye", mixed: true, twin: false, mailbox: false, hazy: false,
      pulse: true, ceiling: true,
      barker: "The true sign PULSES. Sparks lie. Fill the well before the veil shuts.",
    },
  ];

  const LINES = [
    "The well drank gold. That’s the fortune.",
    "A brass penny is thinking about you. Don’t chase it.",
    "Three small lucks, none of them loud.",
    "The tent is theatrical. So are you, sugar.",
    "Keep the colour. Burn the hurry.",
    "A quiet catch is still a catch. Bank the hue.",
    "Aura says: sparks are how the glass forgets you.",
    "Tonight’s gossip is already tired of itself.",
    "Your next stall will pretend not to notice you. Notice it first.",
    "The wait was never the game. The well was.",
  ];
  const RARE_LINES = [
    "Aurora in the glass. You steered.",
    "Rare gilt. The well blinked first.",
    "The choir went quiet for you.",
  ];
  const AURA = {
    spark: "Aura: Red in the well. The glass noticed.",
    sparkShallow: "Aura: One spark and the night folded. Steer next coin.",
    wrong: "Aura: Pretty sign. Wrong sign.",
    miss: "Aura: Gold hit the cloth. The well went hungry.",
    veil: "Aura: The veil shut. You were still hunting.",
    mail: "Aura: The heart wanted a filing. You pocketed the skip.",
    leave: "Aura: Walking off mid-catch? Colour stays in the tent.",
    souvenir: "Aura: Authored night locked. Souvenir — the well was the fortune.",
    deep: (n) => `Aura: Room ${n}. You steered like you meant it.`,
    coda: "Aura: Authored night is done. ENDLESS haze. Don’t catch red.",
    liar: "Aura: It flashed. You believed it.",
    twin: "Aura: Two moons. You filled one and left the other cold.",
    keep: "Aura: Well full. Don’t drink sparks on the next night.",
  };

  let run = null;
  let world = null;
  let worldFailed = false;
  let bound = false;
  let raf = 0;
  let idleRaf = 0;
  let lastTs = 0;
  let pointerNdc = { x: 0, y: 0 };
  let pointerInside = false;
  let keys = { n: false, s: false, w: false, e: false };
  let toastTimer = 0;
  let lookX = 0;
  let lookY = 0;

  function rk() { return PF.runKit || null; }
  function el(id) { return $(id) || document.getElementById(id); }
  function setText(id, text) { const n = el(id); if (n) n.textContent = text; }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function cabinetOn() {
    const n = document.getElementById(CABINET_ID);
    return !!(n && !n.hidden);
  }
  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }
  function cardRoot() { return el("fortuneCard"); }
  function sfx(name) { if (kit && kit.sfx) kit.sfx(name); }

  function codaParams(n) {
    const t = Math.max(1, (n | 0) - AUTHORED_COUNT);
    const signs = SIGNS;
    return {
      id: n,
      title: `Endless Night ${n}`,
      kind: "coda",
      need: Math.min(14, 8 + t),
      timeLimit: Math.max(16, 26 - t),
      catchR: Math.max(0.2, 0.3 - t * 0.012),
      suctionR: Math.max(0.34, 0.5 - t * 0.016),
      fall: Math.min(1.85, 1.28 + t * 0.06),
      spawnMs: Math.max(280, 420 - t * 12),
      missLimit: 2,
      grace: 0,
      sparks: Math.min(0.28, 0.12 + t * 0.02),
      liarChance: t % 2 === 1 ? 0.28 : 0.12,
      trueSign: signs[(n + 3) % signs.length],
      mixed: true,
      twin: t % 4 === 0,
      mailbox: t % 5 === 0,
      hazy: true,
      pulse: true,
      ceiling: t % 3 !== 0,
      mailMs: Math.max(4200, 7000 - 180 * t),
      coda: true,
      barker: `ENDLESS night ${n}. Fog, decoys, same law: catch gold, dodge red, fill the well.`,
    };
  }

  function stageParams(n) {
    if (n <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[n - 1]);
    return codaParams(n);
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    if (typeof kitRun.declare === "function") {
      try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already */ }
    }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin(GAME_ID)
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall through */ }
    }
    if (kit && typeof kit.persistRun === "function") kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "spark",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestFortuneRooms = Math.max(state.bestFortuneRooms || 0, payload.depth);
      state.bestFortuneScore = Math.max(state.bestFortuneScore || 0, payload.score);
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
    }
    closeKitRun(payload);
    if (kit && typeof kit.persistRun === "function") kit.persistRun(state, GAME_ID, payload);
    if (state) {
      const keyed = Object.assign({ gameId: GAME_ID, at: Date.now() }, payload);
      const prev = (state.lastRun && typeof state.lastRun === "object" && !Array.isArray(state.lastRun))
        ? state.lastRun
        : {};
      state.lastRun = Object.assign({}, prev, {
        game: GAME_ID,
        gameId: GAME_ID,
        depth: payload.depth,
        score: payload.score,
        deathReason: payload.deathReason,
        cashedOut: payload.cashedOut,
        at: keyed.at,
      });
      state.lastRun[GAME_ID] = keyed;
      if (typeof PF.saveState === "function") PF.saveState();
    }
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
  }

  function stampDepthCopy() {
    const tag = document.querySelector("#cabinet-fortune [data-pf-depth-tag]");
    if (tag) tag.textContent = DEPTH_COPY.tag;
    const body = document.querySelector("#cabinet-fortune [data-pf-depth-copy]");
    if (body) body.textContent = DEPTH_COPY.body;
  }

  function toast(text, bad) {
    const n = el("fortuneToast");
    if (!n) return;
    n.hidden = false;
    n.textContent = text;
    n.classList.toggle("is-bad", !!bad);
    n.classList.add("is-on");
    toastTimer = 1100;
  }

  function hudLine(spec, room) {
    if (!spec) return "ROOM · CRYSTAL WELL";
    if (spec.coda) return `ENDLESS · ROOM ${room} · ${spec.title}`;
    return `ROOM ${room} · ${spec.title}`;
  }

  function paintHud() {
    const playing = isLive() || !!(run && run.dying);
    const spec = run && run.spec;
    const state = PF.getState() || {};
    if (playing && spec) {
      setText("fortuneHudRoom", hudLine(spec, run.room));
      setText("fortuneHudScore", `SCORE ${run.score | 0}`);
      const sign = run.trueSign || spec.trueSign || "star";
      setText("fortuneSignBadge", spec.twin
        ? `CATCH ${SIGN_GLYPH[sign] || sign} · MOON ${run.active + 1}`
        : `CATCH ${SIGN_GLYPH[sign] || sign}`);
      const need = Math.max(1, spec.need | 0);
      let have = run.fill | 0;
      let lab = `${have} / ${need}`;
      if (spec.twin) {
        lab = `A ${run.fillA | 0}/${need} · B ${run.fillB | 0}/${need}`;
        have = ((run.fillA | 0) + (run.fillB | 0)) / 2;
      }
      setText("fortuneWellLab", lab);
      const fill = el("fortuneChargeFill");
      if (fill) {
        const pct = spec.twin
          ? clamp(((run.fillA + run.fillB) / (need * 2)), 0, 1)
          : clamp(have / need, 0, 1);
        fill.style.width = `${Math.round(pct * 100)}%`;
      }
      const veil = el("fortuneVeilFill");
      const left = run.phase === "mail"
        ? clamp(1 - (run.mailT / Math.max(1, spec.mailMs || 8000)), 0, 1)
        : clamp(1 - (run.elapsed / Math.max(1, spec.timeLimit * 1000)), 0, 1);
      if (veil) veil.style.width = `${Math.round(left * 100)}%`;
      setText("fortuneVeilLab", run.phase === "mail" ? "MAIL" : `${Math.max(0, Math.ceil(left * (spec.timeLimit || 0)))}s`);
      let hint = LAW_LINE;
      if (run.phase === "mail") hint = "DRAG the crystal into the HEART mailbox. Don’t miss the slot.";
      else if (run.dying) hint = "RED CRACKS — the glass shatters.";
      else if (spec.twin) hint = LAW_LINE + " SPACE switches moons.";
      else if (spec.mailbox && run.phase === "play") hint = LAW_LINE + " Then file the heart.";
      setText("fortuneHudHint", hint);
      const extra = el("fortuneExtraKey");
      if (extra) {
        extra.hidden = false;
        extra.innerHTML = spec.twin
          ? "<kbd>SPACE</kbd> switch moons"
          : (spec.mailbox ? "<kbd>DRAG</kbd> to the heart when full" : "<kbd>GOLD</kbd> drinks · <kbd>RED</kbd> cracks");
      }
    } else {
      setText("fortuneHudRoom", "ROOM · CRYSTAL WELL");
      setText("fortuneHudScore", "SCORE 0");
      setText("fortuneSignBadge", "CATCH ★ STAR");
      setText("fortuneWellLab", "0 / 5");
      setText("fortuneVeilLab", "—");
      setText("fortuneHudHint", LAW_LINE);
      const fill = el("fortuneChargeFill");
      if (fill) fill.style.width = "0%";
      const veil = el("fortuneVeilFill");
      if (veil) veil.style.width = "100%";
    }
    const nowRoom = playing ? run.room : 0;
    setText("depthFortuneNow", `Room ${nowRoom}`);
    const bestN = Math.max(state.bestFortuneRooms || 0, (state.bestDepth && state.bestDepth.fortune) || 0);
    setText("depthFortuneBest", bestN ? `Room ${bestN}` : "—");
    setText("depthFortuneScore", playing ? String(run.score) : "0");
    setText("depthFortuneBestScore", state.bestFortuneScore ? String(state.bestFortuneScore) : "—");
  }

  function setPlayChrome() {
    const live = isLive();
    const startBtn = el("fortuneStart");
    const overlay = el("fortuneStartOverlay");
    if (startBtn) {
      startBtn.hidden = live;
      startBtn.disabled = live;
    }
    if (overlay) overlay.hidden = live || !!(run && run.dying);
    paintHud();
  }

  /* ——— Three.js builders ——— */

  function makeMat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.7, metalness: 0.08,
    }, extra || {}));
  }

  function texFromCanvas(c) {
    const t = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    t.anisotropy = 4;
    return t;
  }

  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    return texFromCanvas(c);
  }

  function meshBox(mat, w, h, d, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }
  function meshCyl(mat, rt, rb, h, x, y, z, seg) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }
  function meshSphere(mat, r, x, y, z, seg) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg || 14, seg || 12), mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function starShape() {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i += 1) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const r = i % 2 ? 0.16 : 0.4;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  }

  function heartShape() {
    const s = new THREE.Shape();
    s.moveTo(0, 0.28);
    s.bezierCurveTo(-0.04, 0.5, -0.42, 0.5, -0.42, 0.18);
    s.bezierCurveTo(-0.42, -0.02, -0.16, -0.16, 0, -0.42);
    s.bezierCurveTo(0.16, -0.16, 0.42, -0.02, 0.42, 0.18);
    s.bezierCurveTo(0.42, 0.5, 0.04, 0.5, 0, 0.28);
    return s;
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = makeMat(SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.14 });
    const blouse = makeMat(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.18 });
    const dress = makeMat(DRESS, { emissive: 0x0a2010, emissiveIntensity: 0.28 });
    const dark = makeMat(SHOE, { roughness: 0.28, metalness: 0.4 });
    const hairM = makeMat(HAIR, { emissive: 0x1a0c08, emissiveIntensity: 0.16 });
    const gold = makeMat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const heartM = makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.7, roughness: 0.4 });

    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(meshCyl(blouse, 0.13, 0.15, 0.28, 0, 0.3, 0));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.12, 0.34, 12), dress);
    skirt.position.y = 0.08;
    hip.add(skirt);
    hip.add(meshBox(dress, 0.16, 0.16, 0.04, 0, 0.3, 0.12));
    const heart = meshBox(heartM, 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    heart.rotation.z = Math.PI / 4;
    hip.add(heart);

    const head = new THREE.Group();
    head.position.y = 0.6;
    hip.add(head);
    head.add(meshSphere(skin, 0.175, 0, 0.02, 0, 14));
    const eyeW = makeMat(0xf7f2ea);
    const eyeD = makeMat(0x2a1810);
    const hi = makeMat(0xffffff);
    [-1, 1].forEach((side) => {
      const white = meshSphere(eyeW, 0.038, side * 0.055, 0.03, 0.15);
      white.scale.set(1, 1.12, 0.55);
      head.add(white);
      head.add(meshSphere(eyeD, 0.02, side * 0.055, 0.03, 0.168));
      head.add(meshSphere(hi, 0.01, side * 0.048, 0.045, 0.18));
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), makeMat(0xc45a6a));
    smile.position.set(0, -0.05, 0.16);
    smile.rotation.x = 2.6;
    head.add(smile);
    head.add(meshSphere(hairM, 0.23, 0, 0.06, -0.02, 14));
    head.add(meshBox(hairM, 0.28, 0.07, 0.1, 0, 0.14, 0.16));
    [-1, 1].forEach((side) => {
      head.add(meshSphere(hairM, 0.11, side * 0.2, -0.04, 0.04));
      head.add(meshSphere(heartM, 0.045, side * 0.2, 0.06, 0.06));
    });
    const crown = new THREE.Group();
    crown.position.y = 0.24;
    head.add(crown);
    crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold));
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, h, 6), gold);
      spike.position.set(x, h * 0.45, 0);
      crown.add(spike);
    });
    const gem = meshBox(heartM, 0.055, 0.055, 0.025, 0, 0.02, 0.11);
    gem.rotation.z = Math.PI / 4;
    crown.add(gem);

    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0.0, 0);
      const len = arm ? 0.28 : 0.34;
      const rad = arm ? 0.035 : 0.042;
      pivot.add(meshCyl(arm ? skin : dress, rad, rad, len, 0, -len / 2, 0));
      if (!arm) pivot.add(meshBox(dark, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03));
      else pivot.add(meshSphere(skin, 0.04, 0, -len, 0));
      hip.add(pivot);
      return pivot;
    }
    const armL = limb(-1, true);
    const armR = limb(1, true);
    const legL = limb(-1, false);
    const legR = limb(1, false);
    armL.rotation.x = -0.55;
    armR.rotation.x = -0.55;
    armL.rotation.z = 0.22;
    armR.rotation.z = -0.22;
    g.userData = { head, hip, armL, armR, legL, legR, crown, heart };
    return g;
  }

  function makeCrystal(pickName) {
    const g = new THREE.Group();
    let glass;
    try {
      glass = new THREE.MeshPhysicalMaterial({
        color: 0xb8f0ff,
        roughness: 0.08,
        metalness: 0.04,
        transmission: 0.62,
        thickness: 0.5,
        transparent: true,
        opacity: 0.92,
        emissive: 0x3a88aa,
        emissiveIntensity: 0.32,
      });
    } catch (_) {
      glass = makeMat(0x88d0e8, {
        transparent: true, opacity: 0.58, emissive: 0x3a88aa, emissiveIntensity: 0.5, roughness: 0.12,
      });
    }
    const ball = meshSphere(glass, 0.22, 0, 0, 0, 20);
    ball.userData.pick = pickName;
    g.add(ball);
    const inner = meshSphere(makeMat(0x66c8e8, {
      emissive: 0x44a0d0, emissiveIntensity: 0.95, transparent: true, opacity: 0.6,
    }), 0.12, 0, 0, 0, 12);
    g.add(inner);
    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.14, 0.1, 10),
      makeMat(0xd4a45a, { metalness: 0.7, roughness: 0.3, emissive: 0x4a3008, emissiveIntensity: 0.3 })
    );
    stand.position.y = -0.24;
    g.add(stand);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.014, 8, 32),
      makeMat(GOLD, { emissive: GOLD, emissiveIntensity: 0.45, metalness: 0.6 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.02;
    g.add(ring);
    const disc = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.38, 24),
      makeMat(GOLD, { emissive: GOLD, emissiveIntensity: 0.35, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -0.23;
    g.add(disc);
    g.userData = { ball, inner, ring, disc, pick: pickName };
    return g;
  }

  function signGeo(sign) {
    if (sign === "heart") {
      return new THREE.ExtrudeGeometry(heartShape(), { depth: 0.08, bevelEnabled: false });
    }
    if (sign === "star") {
      return new THREE.ExtrudeGeometry(starShape(), { depth: 0.07, bevelEnabled: false });
    }
    if (sign === "moon") return new THREE.SphereGeometry(0.22, 14, 12);
    if (sign === "lantern") return new THREE.CylinderGeometry(0.14, 0.12, 0.32, 8);
    if (sign === "eye") return new THREE.SphereGeometry(0.18, 12, 10);
    return new THREE.BoxGeometry(0.34, 0.2, 0.06);
  }

  function paintSign(mesh, sign, mode) {
    const mat = mesh.material;
    if (mode === "spark" || mode === "liarOn") {
      mat.color.setHex(0xff2244);
      mat.emissive.setHex(0xff1133);
      mat.emissiveIntensity = 1.45;
      return;
    }
    if (mode === "wrong") {
      mat.color.setHex(0x6a80a8);
      mat.emissive.setHex(0x243048);
      mat.emissiveIntensity = 0.28;
      return;
    }
    if (mode === "rare") {
      mat.color.setHex(0xfff0b0);
      mat.emissive.setHex(0xffe08a);
      mat.emissiveIntensity = 1.25;
      return;
    }
    mat.color.setHex(GOLD);
    mat.emissive.setHex(GOLD);
    mat.emissiveIntensity = 1.05;
    mesh.traverse((n) => {
      if (!n.userData || n.userData.halo !== "gold" || !n.material) return;
      if (mode === "spark" || mode === "liarOn") {
        n.visible = true;
        n.material.color.setHex(0xff2244);
        n.material.emissive.setHex(0xff1133);
        n.material.emissiveIntensity = 1.3;
      } else if (mode === "wrong") {
        n.visible = false;
      } else {
        n.visible = true;
        n.material.color.setHex(GOLD);
        n.material.emissive.setHex(GOLD);
        n.material.emissiveIntensity = 1.05;
      }
    });
  }

  function makeSignMesh(sign) {
    const geo = signGeo(sign);
    if (geo.center) geo.center();
    const mat = makeMat(GOLD, { emissive: GOLD, emissiveIntensity: 0.8, roughness: 0.35 });
    const m = new THREE.Mesh(geo, mat);
    if (sign === "heart" || sign === "star") m.scale.setScalar(0.55);
    if (sign === "lantern") {
      const cap = meshSphere(makeMat(0xffcc66, { emissive: 0xffaa44, emissiveIntensity: 1.1 }), 0.08, 0, 0.2, 0, 8);
      m.add(cap);
    }
    if (sign === "eye") {
      const pupil = meshSphere(makeMat(0x1a1014, { emissive: 0x3a1020, emissiveIntensity: 0.4 }), 0.07, 0, 0, 0.12, 8);
      m.add(pupil);
    }
    m.userData.sign = sign;
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.028, 8, 20),
      makeMat(GOLD, { emissive: GOLD, emissiveIntensity: 0.95, transparent: true, opacity: 0.9 })
    );
    halo.rotation.x = Math.PI / 2;
    halo.userData.halo = "gold";
    m.add(halo);
    return m;
  }

  function makeLabelSprite(text, hex) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 72;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(8,4,12,0.88)";
    ctx.fillRect(0, 0, 256, 72);
    ctx.strokeStyle = hex;
    ctx.lineWidth = 7;
    ctx.strokeRect(5, 5, 246, 62);
    ctx.fillStyle = hex;
    ctx.font = "700 34px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 38);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texFromCanvas(c), transparent: true, depthTest: false,
    }));
    spr.scale.set(0.78, 0.22, 1);
    spr.position.y = 0.38;
    spr.userData.lawLabel = true;
    return spr;
  }

  function stripLabels(mesh) {
    if (!mesh) return;
    const drop = [];
    mesh.traverse((n) => { if (n.userData && n.userData.lawLabel) drop.push(n); });
    drop.forEach((n) => {
      if (n.parent) n.parent.remove(n);
      if (n.material) {
        if (n.material.map) n.material.map.dispose();
        n.material.dispose();
      }
    });
  }

  function makeLawPlaque(text, hex) {
    const g = new THREE.Group();
    const plate = meshBox(makeMat(hex, { emissive: hex, emissiveIntensity: 0.7 }), 0.62, 0.16, 0.04, 0, 0, 0);
    g.add(plate);
    const spr = makeLabelSprite(text, "#" + hex.toString(16).padStart(6, "0"));
    spr.position.set(0, 0.02, 0.05);
    spr.scale.set(0.62, 0.17, 1);
    g.add(spr);
    return g;
  }

  function buildWorld() {
    const canvas = el("fortuneCanvas");
    if (!canvas) return null;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas, antialias: (window.devicePixelRatio || 1) < 1.6, powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      });
    } catch (_) {
      return null;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (THREE.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.22;
    }
    renderer.setClearColor(0x120814, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a0c18, 0.048);
    const camera = new THREE.PerspectiveCamera(46, 1.4, 0.08, 40);
    camera.position.set(0, 2.15, 3.55);
    camera.lookAt(0, 1.05, 0);

    const stripe = canvasTex(128, 128, (ctx) => {
      for (let i = 0; i < 8; i += 1) {
        ctx.fillStyle = i % 2 ? "#4a1a5a" : "#2a0c28";
        ctx.fillRect(i * 16, 0, 16, 128);
      }
    });
    stripe.wrapS = stripe.wrapT = THREE.RepeatWrapping;
    stripe.repeat.set(6, 3);

    const wood = canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 18; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${0.04 + (i % 3) * 0.03})`;
        ctx.fillRect(i * 14 + 4, 0, 3, 256);
      }
      ctx.strokeStyle = "rgba(90,50,24,0.5)";
      for (let y = 8; y < 256; y += 17) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(80, y + 6, 160, y - 5, 256, y + 3);
        ctx.stroke();
      }
    });
    wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
    wood.repeat.set(3, 3);

    const stars = canvasTex(512, 512, (ctx) => {
      ctx.fillStyle = "#070b16";
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 260; i += 1) {
        ctx.fillStyle = `rgba(255,245,220,${0.3 + Math.random() * 0.7})`;
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 1.6 + 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const canvasMat = new THREE.MeshStandardMaterial({
      map: stripe, roughness: 0.82, metalness: 0.04, side: THREE.DoubleSide,
      emissive: 0x2a1030, emissiveIntensity: 0.18,
    });
    const woodMat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.7, metalness: 0.08 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.85, map: wood });

    const root = new THREE.Group();
    scene.add(root);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(4.6, 32), floorMat);
    floor.rotation.x = -Math.PI / 2;
    root.add(floor);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.6, 3.4, 22, 1, true), canvasMat);
    wall.position.y = 1.7;
    root.add(wall);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.2, 22), new THREE.MeshStandardMaterial({
      map: stars, roughness: 0.9, emissive: 0x101428, emissiveIntensity: 0.5,
    }));
    roof.position.y = 4.4;
    root.add(roof);
    const poleMat = makeMat(0x2a1810, { roughness: 0.6 });
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      root.add(meshCyl(poleMat, 0.06, 0.06, 3.2, Math.cos(a) * 4.35, 1.6, Math.sin(a) * 4.35, 8));
    }

    const table = new THREE.Group();
    table.add(meshCyl(woodMat, 0.92, 0.92, 0.08, 0, 0.78, 0, 24));
    table.add(meshCyl(makeMat(0x1a100c), 0.94, 0.86, 0.1, 0, 0.72, 0, 24));
    table.add(meshCyl(woodMat, 0.16, 0.16, 0.7, 0, 0.36, 0, 12));
    const cloth = new THREE.Mesh(
      new THREE.CircleGeometry(0.88, 24),
      makeMat(0x4a1a28, { roughness: 0.9, emissive: 0x2a0810, emissiveIntensity: 0.2 })
    );
    cloth.rotation.x = -Math.PI / 2;
    cloth.position.y = 0.825;
    table.add(cloth);
    const rail = makeMat(0x8a6230, { metalness: 0.35, roughness: 0.45 });
    table.add(new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.035, 8, 40), rail));
    table.children[table.children.length - 1].rotation.x = Math.PI / 2;
    table.children[table.children.length - 1].position.y = 0.86;
    root.add(table);

    const tablePlane = new THREE.Mesh(
      new THREE.CircleGeometry(1.35, 24),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    );
    tablePlane.rotation.x = -Math.PI / 2;
    tablePlane.position.y = 0.84;
    root.add(tablePlane);

    const crystal = makeCrystal("orb");
    crystal.position.set(0, 1.12, 0.08);
    root.add(crystal);
    const crystal2 = makeCrystal("orb2");
    crystal2.position.set(-0.52, 1.12, 0.08);
    crystal2.visible = false;
    root.add(crystal2);

    const orbLight = new THREE.PointLight(0x88e0ff, 1.35, 4.6, 2);
    orbLight.position.set(0, 1.25, 0.08);
    root.add(orbLight);
    const orbLight2 = new THREE.PointLight(0xc8e0ff, 0, 4.2, 2);
    orbLight2.position.set(-0.52, 1.25, 0.08);
    root.add(orbLight2);

    const lanterns = [];
    const lanternMat = makeMat(0xc45a28, { emissive: 0xffaa44, emissiveIntensity: 0.7 });
    const brassMat = makeMat(0xd4a45a, { metalness: 0.65, roughness: 0.32 });
    for (let i = 0; i < 5; i += 1) {
      const L = new THREE.Group();
      const a = -1.1 + i * 0.55;
      L.position.set(Math.sin(a) * 1.85, 2.42, Math.cos(a) * 1.2 - 0.15);
      L.add(meshCyl(brassMat, 0.07, 0.09, 0.06, 0, 0, 0, 8));
      const body = meshCyl(lanternMat, 0.09, 0.07, 0.22, 0, -0.14, 0, 8);
      L.add(body);
      L.add(meshCyl(brassMat, 0.008, 0.008, 0.7, 0, 0.38, 0, 6));
      const pl = new THREE.PointLight(0xffc878, 0.5, 3.1, 2);
      pl.position.y = -0.14;
      L.add(pl);
      root.add(L);
      lanterns.push(L);
    }

    const mailbox = new THREE.Group();
    mailbox.position.set(1.48, 0.95, 0.35);
    const box = meshBox(makeMat(0x6a2030, { emissive: 0x3a0810, emissiveIntensity: 0.28 }), 0.28, 0.22, 0.18, 0, 0, 0);
    box.userData.pick = "mailbox";
    mailbox.add(box);
    const lid = meshBox(makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.5 }), 0.3, 0.08, 0.2, 0, 0.14, 0);
    lid.userData.pick = "mailbox";
    mailbox.add(lid);
    mailbox.add(meshBox(makeMat(0x1a080c), 0.18, 0.02, 0.04, 0, 0.04, 0.1));
    mailbox.add(meshCyl(woodMat, 0.04, 0.04, 0.7, 0, -0.45, 0, 8));
    const mailHeart = meshBox(makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.7 }), 0.1, 0.1, 0.04, 0, 0.02, 0.1);
    mailHeart.rotation.z = Math.PI / 4;
    mailbox.add(mailHeart);
    mailbox.visible = false;
    root.add(mailbox);

    const hologram = new THREE.Group();
    hologram.position.set(0, 2.12, -0.55);
    root.add(hologram);

    const constellation = new THREE.Group();
    constellation.position.set(0, 3.45, -0.35);
    constellation.visible = false;
    root.add(constellation);

    const candles = [];
    for (let i = 0; i < 4; i += 1) {
      const c = new THREE.Group();
      const ang = (i / 4) * Math.PI * 2 + 0.4;
      c.position.set(Math.cos(ang) * 0.62, 0.86, Math.sin(ang) * 0.62);
      c.add(meshCyl(makeMat(0xf0e6d0, { emissive: 0x3a2810, emissiveIntensity: 0.1 }), 0.03, 0.03, 0.14, 0, 0, 0, 8));
      const flame = meshSphere(makeMat(0xffaa44, { emissive: 0xff8822, emissiveIntensity: 1.4 }), 0.028, 0, 0.1, 0, 8);
      flame.scale.set(1, 1.4, 1);
      c.add(flame);
      root.add(c);
      candles.push({ g: c, flame });
    }

    const motes = [];
    SIGNS.forEach((sign) => {
      for (let i = 0; i < 6; i += 1) {
        const mesh = makeSignMesh(sign);
        mesh.visible = false;
        root.add(mesh);
        motes.push({
          mesh, sign, alive: false, kind: "true", liar: false, flipped: false,
          rare: false, absorb: 0, vx: 0, vz: 0, bob: Math.random() * 6,
        });
      }
    });
    for (let i = 0; i < 8; i += 1) {
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16),
        makeMat(0xff2244, { emissive: 0xff1133, emissiveIntensity: 1.45 })
      );
      const redHalo = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.03, 8, 16),
        makeMat(0xff3355, { emissive: 0xff2244, emissiveIntensity: 1.3, transparent: true, opacity: 0.95 })
      );
      redHalo.rotation.x = Math.PI / 2;
      redHalo.userData.halo = "red";
      mesh.add(redHalo);
      mesh.visible = false;
      root.add(mesh);
      motes.push({
        mesh, sign: "spark", alive: false, kind: "spark", liar: false, flipped: false,
        rare: false, absorb: 0, vx: 0, vz: 0, bob: Math.random() * 6, teach: "",
      });
    }

    const drinkPlaque = makeLawPlaque("DRINKS", GOLD);
    drinkPlaque.position.set(-0.78, 0.98, 0.62);
    drinkPlaque.rotation.y = 0.18;
    root.add(drinkPlaque);
    const crackPlaque = makeLawPlaque("CRACKS", 0xc41e3a);
    crackPlaque.position.set(0.78, 0.98, 0.62);
    crackPlaque.rotation.y = -0.18;
    root.add(crackPlaque);

    const hemi = new THREE.HemisphereLight(0xc8b0e8, 0x1a0c10, 0.78);
    scene.add(hemi);
    const key = new THREE.PointLight(0xf0c878, 1.35, 9, 1.6);
    key.position.set(1.4, 2.6, 2.2);
    scene.add(key);
    const fill = new THREE.PointLight(0x6a40a0, 0.7, 8, 1.8);
    fill.position.set(-2.2, 1.8, 1.2);
    scene.add(fill);

    const aura = makeAura();
    aura.position.set(1.28, 0.02, 0.55);
    aura.rotation.y = -0.72;
    aura.scale.setScalar(1.08);
    root.add(aura);

    const smokeN = 40;
    const smokePos = new Float32Array(smokeN * 3);
    for (let i = 0; i < smokeN; i += 1) {
      smokePos[i * 3] = (Math.random() - 0.5) * 0.35;
      smokePos[i * 3 + 1] = Math.random() * 0.8;
      smokePos[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
    }
    const smokeGeo = new THREE.BufferGeometry();
    smokeGeo.setAttribute("position", new THREE.BufferAttribute(smokePos, 3));
    const smoke = new THREE.Points(smokeGeo, new THREE.PointsMaterial({
      color: 0xd8c8e8, size: 0.045, transparent: true, opacity: 0.28, depthWrite: false,
    }));
    smoke.position.set(-0.72, 0.9, 0.4);
    root.add(smoke);

    const burstN = 28;
    const burstPos = new Float32Array(burstN * 3);
    const burstGeo = new THREE.BufferGeometry();
    burstGeo.setAttribute("position", new THREE.BufferAttribute(burstPos, 3));
    const burst = new THREE.Points(burstGeo, new THREE.PointsMaterial({
      color: 0xffe08a, size: 0.05, transparent: true, opacity: 0, depthWrite: false,
    }));
    root.add(burst);

    const shards = [];
    const shardMat = makeMat(0xc8f0ff, { transparent: true, opacity: 0.85, roughness: 0.12 });
    for (let i = 0; i < 16; i += 1) {
      const sh = new THREE.Mesh(new THREE.TetrahedronGeometry(0.05), shardMat.clone());
      sh.visible = false;
      root.add(sh);
      shards.push({ mesh: sh, vx: 0, vy: 0, vz: 0, life: 0 });
    }

    return {
      renderer, scene, camera, canvas, root,
      crystal, crystal2, orbLight, orbLight2,
      lanterns, mailbox, lid: mailbox.children[1], hologram, constellation,
      motes, aura, candles, smoke, smokePos, burst, burstPos, shards,
      hemi, key, fill, table, tablePlane, cloth,
      cam: { x: 0, y: 2.15, z: 3.55, lx: 0, ly: 1.05, lz: 0 },
      want: { x: 0, y: 2.15, z: 3.55, lx: 0, ly: 1.05, lz: 0 },
      raycaster: new THREE.Raycaster(),
      clock: 0,
      burstLife: 0,
    };
  }

  function resizeWorld() {
    if (!world) return;
    const canvas = world.canvas;
    const stage = el("fortuneStage") || canvas.parentNode;
    const w = Math.max(16, (stage && stage.clientWidth) || canvas.clientWidth || 640);
    const h = Math.max(16, (stage && stage.clientHeight) || canvas.clientHeight || 420);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
    world.renderer.setSize(w, h, false);
  }

  function ensureWorld() {
    if (world) return world;
    if (worldFailed) return null;
    world = buildWorld();
    if (!world) {
      worldFailed = true;
      const fail = el("fortuneWebglFail");
      if (fail) fail.hidden = false;
      return null;
    }
    resizeWorld();
    return world;
  }

  function pointerOnTable() {
    if (!world) return null;
    world.raycaster.setFromCamera(pointerNdc, world.camera);
    const hits = world.raycaster.intersectObject(world.tablePlane, false);
    return hits[0] ? hits[0].point : null;
  }

  function clampTable(x, z) {
    const r = Math.hypot(x, z);
    if (r <= TABLE_R) return { x, z };
    const k = TABLE_R / r;
    return { x: x * k, z: z * k };
  }

  function activeCrystal() {
    if (!world) return null;
    if (run && run.spec && run.spec.twin && run.active === 1) return world.crystal2;
    return world.crystal;
  }

  function clearHologram() {
    if (!world) return;
    while (world.hologram.children.length) {
      const ch = world.hologram.children[0];
      world.hologram.remove(ch);
      if (ch.geometry) ch.geometry.dispose();
    }
    while (world.constellation.children.length) {
      const ch = world.constellation.children[0];
      world.constellation.remove(ch);
      if (ch.geometry) ch.geometry.dispose();
    }
  }

  function setHologram(sign) {
    if (!world) return;
    clearHologram();
    const h = makeSignMesh(sign);
    h.scale.multiplyScalar(0.72);
    world.hologram.add(h);
    const c = makeSignMesh(sign);
    c.scale.multiplyScalar(1.6);
    world.constellation.add(c);
    const pts = [[-0.45, 0.1, 0], [0.05, 0.32, 0.06], [0.4, 0.04, -0.05]];
    const starM = makeMat(0xf0e0a8, { emissive: 0xf0d080, emissiveIntensity: 1.2 });
    pts.forEach((p) => {
      const s = meshSphere(starM, 0.045, p[0], p[1], p[2], 8);
      world.constellation.add(s);
    });
  }

  function recycleMote(m) {
    m.alive = false;
    m.absorb = 0;
    m.liar = false;
    m.flipped = false;
    m.rare = false;
    m.teach = "";
    stripLabels(m.mesh);
    m.mesh.visible = false;
  }

  function takeMote(sign, kind) {
    const pool = world.motes.filter((m) => !m.alive && (kind === "spark" ? m.kind === "spark" : m.sign === sign && m.kind !== "spark"));
    const m = pool[0];
    if (!m) return null;
    m.alive = true;
    m.kind = kind;
    m.liar = kind === "liar";
    m.flipped = false;
    m.rare = kind === "true" && Math.random() < 0.08;
    m.absorb = 0;
    m.vx = (Math.random() - 0.5) * 0.18;
    m.vz = (Math.random() - 0.5) * 0.18;
    const spread = 1.05;
    m.mesh.position.set((Math.random() - 0.5) * spread * 2, 2.35 + Math.random() * 0.45, (Math.random() - 0.5) * spread * 2);
    m.mesh.rotation.set(Math.random(), Math.random(), Math.random());
    m.mesh.visible = true;
    m.teach = "";
    stripLabels(m.mesh);
    m.mesh.scale.setScalar(kind === "spark" ? 1.35 : 1.4);
    if (m.kind !== "spark") paintSign(m.mesh, sign, m.rare ? "rare" : (kind === "wrong" ? "wrong" : "true"));
    else paintSign(m.mesh, "spark", "spark");
    if (m.mesh.material) m.mesh.material.opacity = 1;
    m.mesh.material.transparent = true;
    return m;
  }

  function spawnTeachPair() {
    if (!world || !run) return;
    const gold = takeMote(run.trueSign || "star", "true");
    if (gold) {
      gold.mesh.position.set(-0.58, 2.08, 0.42);
      gold.vx = 0;
      gold.vz = 0.02;
      gold.teach = "gold";
      gold.mesh.add(makeLabelSprite("DRINKS", "#e8b84a"));
    }
    const red = takeMote("spark", "spark");
    if (red) {
      red.mesh.position.set(0.58, 2.08, 0.42);
      red.vx = 0;
      red.vz = 0.02;
      red.teach = "red";
      red.mesh.add(makeLabelSprite("CRACKS", "#ff3355"));
    }
  }

  function spawnMote() {
    if (!world || !run || !run.spec) return;
    const spec = run.spec;
    const sign = run.trueSign;
    const roll = Math.random();
    if (roll < spec.sparks) {
      takeMote("spark", "spark");
      return;
    }
    if (spec.liarChance && roll < spec.sparks + spec.liarChance) {
      const m = takeMote(sign, "liar");
      if (m) m.flipAt = 420 + Math.random() * 380;
      return;
    }
    if (spec.mixed && roll < spec.sparks + spec.liarChance + 0.38) {
      const decoy = pick(SIGNS.filter((s) => s !== sign));
      takeMote(decoy, "wrong");
      return;
    }
    takeMote(sign, "true");
  }

  function burstAt(x, y, z, color) {
    if (!world) return;
    world.burst.position.set(x, y, z);
    world.burst.material.color.setHex(color || 0xffe08a);
    world.burst.material.opacity = 0.95;
    world.burstLife = 1;
    const arr = world.burstPos;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] = (Math.random() - 0.5) * 0.2;
      arr[i + 1] = (Math.random() - 0.5) * 0.2;
      arr[i + 2] = (Math.random() - 0.5) * 0.2;
    }
    world.burst.geometry.attributes.position.needsUpdate = true;
  }

  function crackCrystal() {
    if (!world) return;
    const c = activeCrystal() || world.crystal;
    world.shards.forEach((s) => {
      s.mesh.position.copy(c.position);
      s.mesh.visible = true;
      s.vx = (Math.random() - 0.5) * 2.2;
      s.vy = 1.2 + Math.random() * 1.6;
      s.vz = (Math.random() - 0.5) * 2.2;
      s.life = 1;
    });
  }

  function wellFull() {
    const spec = run.spec;
    if (spec.twin) return (run.fillA | 0) >= spec.need && (run.fillB | 0) >= spec.need;
    return (run.fill | 0) >= spec.need;
  }

  function addCatch(rare) {
    const spec = run.spec;
    const pts = 50 + run.room * 10 + (rare ? 80 : 0) + Math.min(80, run.combo * 8);
    run.score += pts;
    run.combo += 1;
    if (spec.twin) {
      if (run.active === 1) run.fillB += 1;
      else run.fillA += 1;
    } else {
      run.fill += 1;
    }
    if (run.kitRun) run.kitRun.score = run.score;
    if (rare) toast("DRINKS · AURORA", false);
    else toast(run.combo >= 4 ? `DRINKS · STREAK ${run.combo}` : "DRINKS", false);
    sfx("sink");
    if (typeof PF.setAura === "function") PF.setAura(run.combo >= 4 ? "celebrate" : "give");
    if (wellFull()) {
      if (spec.mailbox && run.phase !== "mail") {
        run.phase = "mail";
        run.mailT = 0;
        world.mailbox.visible = true;
        world.motes.forEach(recycleMote);
        toast("FILE THE HEART", false);
        sfx("tray");
        setPlayChrome();
        return;
      }
      clearRoom();
    }
  }

  function strike(reason) {
    if (!isLive()) return;
    run.combo = 0;
    const spec = run.spec;
    if ((spec.grace | 0) > 0 && (run.strikes | 0) < (spec.grace | 0) && reason !== "spark" && reason !== "liar") {
      run.strikes += 1;
      if (rk() && run.kitRun && rk().reportStrike) rk().reportStrike(run.kitRun, reason);
      toast("GRACE — try the gold", true);
      sfx("miss");
      return;
    }
    finish(reason);
  }

  function catchMote(m, crystal) {
    if (!isLive() || run.phase === "mail") return;
    if (m.kind === "spark" || (m.liar && m.flipped)) {
      burstAt(m.mesh.position.x, m.mesh.position.y, m.mesh.position.z, 0xff4466);
      recycleMote(m);
      toast("CRACKS", true);
      strike(m.liar ? "liar" : "spark");
      return;
    }
    if (m.kind === "wrong") {
      burstAt(m.mesh.position.x, m.mesh.position.y, m.mesh.position.z, 0x6688aa);
      recycleMote(m);
      strike("wrong");
      return;
    }
    m.absorb = 0.001;
    m._cx = crystal.position.x;
    m._cy = crystal.position.y;
    m._cz = crystal.position.z;
    burstAt(m.mesh.position.x, m.mesh.position.y, m.mesh.position.z, m.rare ? 0x7ee0c0 : 0xffe08a);
    addCatch(m.rare);
  }

  function clearRoom() {
    if (!isLive()) return;
    run.depth += 1;
    run.score += 220 + run.room * 20;
    if (run.kitRun) {
      run.kitRun.score = run.score;
      if (rk() && typeof rk().reportDepth === "function") {
        try {
          rk().reportDepth(run.kitRun, run.depth, {
            name: run.spec && run.spec.title,
            coda: !!(run.spec && run.spec.coda),
          });
        } catch (_) { /* ignore */ }
      }
    }
    sfx("cash");
    if (typeof PF.setAura === "function") PF.setAura(run.depth >= 4 ? "celebrate" : "give");
    const ticket = {
      colourName: run.trueSign ? run.trueSign.toUpperCase() : "GOLD",
      text: Math.random() < 0.12 ? pick(RARE_LINES) : pick(LINES),
    };
    setText("fortuneTicketColour", `${ticket.colourName} · ROOM ${run.room}`);
    setText("fortuneTicketLine", ticket.text);
    const node = el("fortuneFloatTicket");
    if (node) node.hidden = false;
    if (!CODA_ENABLED && run.room >= AUTHORED_COUNT) {
      finish("souvenir");
      return;
    }
    toast(`ROOM ${run.room} KEPT`, false);
    const next = run.room + 1;
    run.seq = (run.seq | 0) + 1;
    const seq = run.seq;
    window.setTimeout(() => {
      if (!isLive() || run.seq !== seq) return;
      const tix = el("fortuneFloatTicket");
      if (tix) tix.hidden = true;
      openRoom(next);
    }, REDUCE ? 280 : 720);
  }

  function openRoom(n) {
    if (!run || run.done) return;
    const spec = stageParams(n);
    run.room = n;
    run.spec = spec;
    run.phase = "play";
    run.elapsed = 0;
    run.spawnT = 0;
    run.fill = 0;
    run.fillA = 0;
    run.fillB = 0;
    run.active = 0;
    run.combo = 0;
    run.misses = 0;
    run.mailT = 0;
    run.trueSign = spec.trueSign || pick(SIGNS);
    if (world) {
      world.crystal.position.set(spec.twin ? 0.52 : 0, 1.12, 0.08);
      world.crystal2.position.set(-0.52, 1.12, 0.08);
      world.crystal2.visible = !!spec.twin;
      world.orbLight2.intensity = spec.twin ? 0.9 : 0;
      world.mailbox.visible = !!spec.mailbox;
      world.constellation.visible = !!spec.ceiling;
      if (world.scene.fog) world.scene.fog.density = spec.hazy ? 0.13 : 0.048;
      world.motes.forEach(recycleMote);
      setHologram(run.trueSign);
      if (spec.teachPair) spawnTeachPair();
    }
    run.teachHold = spec.teachHoldMs || 0;
    setPlayChrome();
    setText("fortunePlayStatus", spec.barker || LAW_LINE);
    if (typeof PF.setAura === "function") PF.setAura("think");
    sfx("drop");
    paintHud();
  }

  function start() {
    if (isLive()) return;
    stopIdle();
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("fortunePlayStatus", "Out of demo coins · grant a pass");
      if (PF.refreshNightBoard) PF.refreshNightBoard();
      return;
    }
    run = {
      done: false,
      dying: false,
      deathHold: 0,
      kitRun,
      room: 1,
      depth: 0,
      score: 0,
      strikes: 0,
      spec: stageParams(1),
      phase: "play",
      fill: 0,
      fillA: 0,
      fillB: 0,
      active: 0,
      combo: 0,
      misses: 0,
      elapsed: 0,
      spawnT: 0,
      mailT: 0,
      trueSign: "star",
      deathNote: "",
      deathReason: "",
      target: { x: 0, z: 0.08 },
    };
    const verdict = el("fortuneVerdict");
    if (verdict) verdict.hidden = true;
    if (kit && kit.hideResult) kit.hideResult("fortuneOracleResult");
    if (PF.setTier) PF.setTier("fortuneTier", "", "");
    if (kit && kit.setMode) kit.setMode(cardRoot(), "play");
    stampDepthCopy();
    if (PF.focusCard) PF.focusCard("fortuneCard", true);
    const tix = el("fortuneFloatTicket");
    if (tix) tix.hidden = true;
    ensureWorld();
    if (!cabinetOn() || !run) return;
    resizeWorld();
    openRoom(1);
    lastTs = performance.now();
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "liar") return AURA.liar;
    if (reason === "wrong") return AURA.wrong;
    if (reason === "miss") return AURA.miss;
    if (reason === "veil") return AURA.veil;
    if (reason === "mail") return AURA.mail;
    if (reason === "twin") return AURA.twin;
    if (reason === "spark") return depth <= 0 ? AURA.sparkShallow : AURA.spark;
    if (depth >= AUTHORED_COUNT) return AURA.coda;
    if (depth >= 6) return AURA.deep(depth);
    return AURA.keep;
  }

  function deathReasonOf(reason) {
    if (reason === "leave" || reason === "souvenir") return reason;
    if (reason === "mail") return "skip";
    if (reason === "liar") return "liar";
    if (reason === "wrong") return "wrong_sign";
    if (reason === "miss") return "miss";
    if (reason === "veil") return "veil";
    return "spark";
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.phase = "dead";
    run.deathNote = reason;
    run.deathReason = deathReasonOf(reason);
    run.deathHold = DEATH_HOLD_MS;
    crackCrystal();
    if (kit && kit.sfx && reason !== "souvenir") sfx("stamp");
    const card = cardRoot();
    if (card) card.classList.add("is-danger");
    setPlayChrome();
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    run.phase = "dead";
    run.deathReason = deathReasonOf(reason);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    const card = cardRoot();
    if (card) card.classList.remove("is-danger");
    const depth = run.depth | 0;
    const score = run.score | 0;
    persistDepth({
      depth,
      score,
      deathReason: run.deathReason,
      cashedOut: reason === "souvenir",
      meta: { room: run.room, sign: run.trueSign, kind: run.spec && run.spec.kind },
    });
    ["fortuneStart", "fortuneGo"].forEach((id) => {
      const btn = el(id);
      if (btn) {
        btn.disabled = false;
        btn.hidden = false;
        btn.textContent = "GAZE AGAIN · 1 demo coin";
      }
    });
    const overlay = el("fortuneStartOverlay");
    if (overlay) overlay.hidden = false;
    if (PF.focusCard) PF.focusCard("fortuneCard", false);
    if (kit && kit.setMode) kit.setMode(cardRoot(), "result");
    const aura = auraLine(reason, depth);
    const challenge = `Beat my Mystic Tent room ${depth} on Penny Fever`;
    setText("fortuneChallengeText", challenge);
    const verdict = el("fortuneVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = reason === "souvenir"
        ? `SOUVENIR · ROOM ${depth} · SCORE ${score}`
        : `ROOM ${depth} · SCORE ${score} · ${aura}`;
    }
    if (kit && kit.fillResult) {
      kit.fillResult({
        root: "fortuneOracleResult",
        depth: "fortuneResultDepth",
        score: "fortuneResultScore",
        aura: "fortuneResultAura",
        copied: "fortuneCopied",
      }, {
        depthLine: reason === "souvenir" ? `SOUVENIR · ROOM ${depth}` : `ROOM ${depth}`,
        scoreLine: `SCORE ${score} · ${String(run.deathReason).toUpperCase()}`,
        auraLine: aura,
      });
    } else {
      const root = el("fortuneOracleResult");
      if (root) root.hidden = false;
      setText("fortuneResultDepth", `ROOM ${depth}`);
      setText("fortuneResultScore", `SCORE ${score}`);
      setText("fortuneResultAura", aura);
    }
    const ok = depth > 0 || reason === "souvenir";
    if (PF.setTier) {
      PF.setTier("fortuneTier", ok
        ? (depth > AUTHORED_COUNT ? `ENDLESS · ROOM ${depth}` : `ROOM ${depth}`)
        : String(run.deathReason).toUpperCase(), ok ? "perfect" : "miss");
    }
    setText("fortunePlayStatus", reason === "leave" ? "Stepped out of the tent." : (reason === "souvenir" ? "Souvenir — authored night locked." : "The well cracked."));
    if (ok) {
      if (PF.award) PF.award(Math.max(8, Math.floor(score / 12)), true, "Fortune");
      if (PF.setAura) PF.setAura(depth >= 4 || reason === "souvenir" ? "celebrate" : "point");
      if (reason !== "leave" && PF.showBanner) PF.showBanner(true, `ROOM ${depth}`, `${score} · ${aura}`);
    } else {
      if (PF.award) PF.award(0, false, reason === "leave" ? "Fortune leave" : "Fortune spark");
      if (PF.setAura) PF.setAura("badLuck");
      if (reason !== "leave" && PF.showBanner) PF.showBanner(false, String(run.deathReason).toUpperCase(), aura);
    }
    if (PF.refreshNightBoard) PF.refreshNightBoard();
    paintHud();
    startIdle();
  }

  function switchMoon() {
    if (!isLive() || !run.spec.twin) return;
    run.active = run.active === 1 ? 0 : 1;
    toast(run.active === 1 ? "MOON B" : "MOON A", false);
    sfx("flip");
  }

  function tryClickSwitch() {
    if (!world || !isLive() || !run.spec.twin) return false;
    world.raycaster.setFromCamera(pointerNdc, world.camera);
    const list = [];
    world.crystal.traverse((n) => { if (n.userData && n.userData.pick === "orb") list.push(n); });
    world.crystal2.traverse((n) => { if (n.userData && n.userData.pick === "orb2") list.push(n); });
    const hits = world.raycaster.intersectObjects(list, false);
    if (!hits[0]) return false;
    const pick = hits[0].object.userData.pick;
    const want = pick === "orb2" ? 1 : 0;
    if (want !== run.active) switchMoon();
    return true;
  }

  function steerCrystal(dt) {
    if (!world || !run) return;
    const spec = run.spec || {};
    const speed = 2.35;
    let tx = run.target.x;
    let tz = run.target.z;
    if (keys.w) tz -= speed * dt;
    if (keys.s) tz += speed * dt;
    if (keys.n) tx -= speed * dt;
    if (keys.e) tx += speed * dt;
    if (pointerInside) {
      const p = pointerOnTable();
      if (p) {
        tx = lerp(tx, p.x, 0.45);
        tz = lerp(tz, p.z, 0.45);
      }
    }
    if (run.phase === "mail") {
      const clamped = clampTable(tx * 1.35, tz * 1.35);
      run.target.x = clamp(tx, -1.7, 1.7);
      run.target.z = clamp(tz, -1.2, 1.4);
      const c = world.crystal;
      c.position.x = lerp(c.position.x, run.target.x, 0.18);
      c.position.z = lerp(c.position.z, run.target.z, 0.18);
      const mb = world.mailbox.position;
      const d = Math.hypot(c.position.x - mb.x, c.position.z - mb.z);
      if (d < 0.38) {
        sfx("sink");
        toast("FILED", false);
        run.score += 80;
        clearRoom();
      }
      void clamped;
      return;
    }
    const cl = clampTable(tx, tz);
    run.target.x = cl.x;
    run.target.z = cl.z;
    const c = activeCrystal();
    if (!c) return;
    const k = 1 - Math.pow(0.001, dt * 1000 / 140);
    c.position.x = lerp(c.position.x, run.target.x, k);
    c.position.z = lerp(c.position.z, run.target.z, k);
    c.position.y = 1.12 + Math.sin(world.clock * 2.2) * 0.02;
  }

  function tickMotes(dt) {
    if (!world || !run) return;
    const spec = run.spec;
    const crystal = activeCrystal();
    if (!crystal) return;
    const cx = crystal.position.x;
    const cy = crystal.position.y;
    const cz = crystal.position.z;
    const fall = (REDUCE ? spec.fall * 0.7 : spec.fall);
    world.motes.forEach((m) => {
      if (!m.alive) return;
      if (m.absorb > 0) {
        m.absorb += dt * 4;
        m.mesh.position.x = lerp(m.mesh.position.x, cx, 0.2);
        m.mesh.position.y = lerp(m.mesh.position.y, cy, 0.2);
        m.mesh.position.z = lerp(m.mesh.position.z, cz, 0.2);
        m.mesh.scale.setScalar(Math.max(0.05, 1 - m.absorb));
        if (m.absorb >= 1) recycleMote(m);
        return;
      }
      if (m.liar && !m.flipped) {
        m.flipAt = (m.flipAt || 480) - dt * 1000;
        if (m.flipAt <= 0) {
          m.flipped = true;
          paintSign(m.mesh, m.sign, "liarOn");
          sfx("spinner");
        }
      }
      const pull = (m.kind === "true" && !m.flipped) ? spec.suctionR : 0;
      const dx = cx - m.mesh.position.x;
      const dz = cz - m.mesh.position.z;
      const dist = Math.hypot(dx, dz) || 0.0001;
      if (pull && dist < pull) {
        const str = (1 - dist / pull) * fall * 0.55 * dt;
        m.mesh.position.x += (dx / dist) * str * 3.2;
        m.mesh.position.z += (dz / dist) * str * 3.2;
      } else {
        m.mesh.position.x += m.vx * dt;
        m.mesh.position.z += m.vz * dt;
      }
      m.mesh.position.y -= fall * dt * (m.teach ? 0.55 : 1);
      m.mesh.rotation.y += dt * (m.kind === "spark" || m.flipped ? 4.2 : 1.4);
      m.mesh.rotation.z += dt * (m.kind === "spark" || m.flipped ? 2.4 : 0.7);
      if (m.kind === "true" && !m.flipped) {
        m.mesh.traverse((n) => {
          if (n.userData && n.userData.halo === "gold") {
            n.rotation.z = world.clock * 2.2;
            n.scale.setScalar(1 + Math.sin(world.clock * 7) * 0.1);
          }
        });
      }
      if (spec.pulse && m.kind === "true") {
        const s = 1.35 + Math.sin(world.clock * 8 + m.bob) * 0.16;
        m.mesh.scale.setScalar(s);
      }
      if (spec.hazy && m.mesh.material) {
        const near = Math.hypot(dx, m.mesh.position.y - cy, dz);
        m.mesh.material.opacity = clamp(1.15 - near * 0.55, 0.08, 1);
      }
      const dy = Math.abs(m.mesh.position.y - cy);
      if (dist < spec.catchR && dy < 0.38) {
        catchMote(m, crystal);
        return;
      }
      if (m.mesh.position.y < 0.78) {
        if (m.kind === "true" && !m.flipped) {
          run.misses += 1;
          run.combo = 0;
          sfx("miss");
          if (run.misses > spec.missLimit) strike("miss");
          else toast("GOLD ON THE CLOTH", true);
        }
        recycleMote(m);
      }
    });
  }

  function animateWorld(dt, dying) {
    if (!world) return;
    const t = world.clock;
    if (!isLive() && !dying) {
      const orbit = t * 0.16;
      world.want.x = Math.sin(orbit) * 0.85;
      world.want.z = 3.45 + Math.cos(orbit * 0.7) * 0.2;
      world.want.y = 2.05 + Math.sin(orbit * 0.5) * 0.06;
      world.want.lx = 0;
      world.want.ly = 1.08;
      world.want.lz = 0;
    } else if (run) {
      const c = activeCrystal() || world.crystal;
      world.want.x = c.position.x * 0.35;
      world.want.y = 2.12;
      world.want.z = 3.42;
      world.want.lx = c.position.x * 0.55;
      world.want.ly = 1.08;
      world.want.lz = c.position.z * 0.4;
    }
    const k = REDUCE ? 1 : 1 - Math.pow(0.001, dt * 1000 / 420);
    world.cam.x = lerp(world.cam.x, world.want.x, k);
    world.cam.y = lerp(world.cam.y, world.want.y, k);
    world.cam.z = lerp(world.cam.z, world.want.z, k);
    world.cam.lx = lerp(world.cam.lx, world.want.lx, k);
    world.cam.ly = lerp(world.cam.ly, world.want.ly, k);
    world.cam.lz = lerp(world.cam.lz, world.want.lz, k);
    const sway = (!REDUCE && pointerInside) ? 0.1 : 0;
    world.camera.position.set(world.cam.x + lookX * sway, world.cam.y + lookY * sway * 0.4, world.cam.z);
    world.camera.lookAt(world.cam.lx, world.cam.ly, world.cam.lz);

    const fillPct = run && run.spec
      ? (run.spec.twin
        ? clamp((run.fillA + run.fillB) / Math.max(1, run.spec.need * 2), 0, 1)
        : clamp(run.fill / Math.max(1, run.spec.need), 0, 1))
      : 0.18 + Math.sin(t * 1.4) * 0.06;
    [world.crystal, world.crystal2].forEach((c, i) => {
      if (!c.visible) return;
      const u = c.userData;
      if (u.inner && u.inner.material) u.inner.material.emissiveIntensity = 0.55 + fillPct * 1.7;
      if (u.ring) {
        u.ring.rotation.z = t * (0.6 + fillPct * 2);
        const active = !run || !run.spec || !run.spec.twin || run.active === i;
        u.ring.scale.setScalar((active ? 1 : 0.82) * (0.9 + fillPct * 0.4));
      }
      c.position.y = 1.12 + Math.sin(t * 1.8 + i) * 0.018;
    });
    if (world.orbLight) {
      const c = world.crystal.position;
      world.orbLight.position.set(c.x, c.y + 0.12, c.z);
      world.orbLight.intensity = 0.75 + fillPct * 2.0;
    }
    if (world.orbLight2 && world.crystal2.visible) {
      const c = world.crystal2.position;
      world.orbLight2.position.set(c.x, c.y + 0.12, c.z);
      world.orbLight2.intensity = 0.75 + fillPct * 1.6;
    }

    if (world.aura && world.aura.userData) {
      const u = world.aura.userData;
      u.hip.position.y = 0.42 + Math.sin(t * 1.5) * 0.008;
      u.head.rotation.y = Math.sin(t * 0.7) * 0.1;
      const c = activeCrystal();
      if (c) u.head.rotation.y += clamp(c.position.x * 0.15, -0.2, 0.2);
      const reach = (run && run.combo > 0) ? -1.05 : -0.55;
      u.armL.rotation.x = lerp(u.armL.rotation.x, reach, 0.08);
      u.armR.rotation.x = lerp(u.armR.rotation.x, reach, 0.08);
      u.head.rotation.z = dying ? Math.sin(t * 8) * 0.12 : 0;
    }

    world.lanterns.forEach((L, i) => {
      L.rotation.z = Math.sin(t * 1.3 + i) * 0.08;
      L.position.y = 2.42 + Math.sin(t * 1.1 + i * 0.7) * 0.04;
    });
    world.candles.forEach((c, i) => {
      c.flame.scale.y = 1.3 + Math.sin(t * 9 + i) * 0.2;
      c.flame.material.emissiveIntensity = 1.1 + Math.sin(t * 11 + i) * 0.3;
    });
    if (world.hologram) {
      world.hologram.rotation.y = t * 0.7;
      world.hologram.position.y = 2.12 + Math.sin(t * 2) * 0.05;
    }
    if (world.lid && world.mailbox.visible) {
      world.lid.rotation.x = run && run.phase === "mail" ? -0.55 + Math.sin(t * 3) * 0.08 : lerp(world.lid.rotation.x, 0, 0.08);
    }
    if (world.smokePos) {
      const arr = world.smokePos;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] += dt * 0.22;
        arr[i] += Math.sin(t + i) * dt * 0.04;
        if (arr[i + 1] > 1.1) arr[i + 1] = 0;
      }
      world.smoke.geometry.attributes.position.needsUpdate = true;
    }
    if (world.burstLife > 0) {
      world.burstLife -= dt * 2.2;
      world.burst.material.opacity = Math.max(0, world.burstLife);
      const arr = world.burstPos;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] *= 1 + dt * 3;
        arr[i + 1] += dt * 0.6;
        arr[i + 2] *= 1 + dt * 3;
      }
      world.burst.geometry.attributes.position.needsUpdate = true;
    }
    world.shards.forEach((s) => {
      if (s.life <= 0) { s.mesh.visible = false; return; }
      s.life -= dt;
      s.vy -= dt * 6;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      s.mesh.rotation.x += dt * 6;
      s.mesh.material.opacity = Math.max(0, s.life);
    });
    if (dying && world.root) world.root.rotation.z = Math.sin(t * 14) * 0.012;
    else if (world.root) world.root.rotation.z = 0;

    world.renderer.render(world.scene, world.camera);
  }

  function tick(now) {
    if (!cabinetOn()) { raf = 0; return; }
    const dt = Math.min(0.048, ((now - (lastTs || now)) || 16) / 1000);
    lastTs = now;
    if (world) world.clock += dt;
    if (toastTimer > 0) {
      toastTimer -= dt * 1000;
      if (toastTimer <= 0) {
        const n = el("fortuneToast");
        if (n) n.classList.remove("is-on");
      }
    }

    if (run && run.dying && !run.done) {
      run.deathHold -= dt * 1000;
      animateWorld(dt, true);
      if (run.deathHold <= 0) {
        sealResult(run.deathNote || "spark");
        return;
      }
      raf = requestAnimationFrame(tick);
      return;
    }

    if (isLive()) {
      run.elapsed += dt * 1000;
      if (run.phase === "play") {
        run.spawnT += dt * 1000;
        if (run.spawnT >= run.spec.spawnMs) {
          run.spawnT = 0;
          if (!(run.spec.teachPair && run.elapsed < (run.teachHold || 0))) spawnMote();
        }
        if (run.elapsed > run.spec.timeLimit * 1000) {
          finish("veil");
        }
      } else if (run.phase === "mail") {
        run.mailT += dt * 1000;
        if (run.mailT > (run.spec.mailMs || 8000)) finish("mail");
      }
      steerCrystal(dt);
      if (run.phase === "play") tickMotes(dt);
      paintHud();
    }
    animateWorld(dt, false);
    raf = requestAnimationFrame(tick);
  }

  function idleTick(now) {
    if (!cabinetOn()) { idleRaf = 0; return; }
    if (isLive() || (run && run.dying && !run.done)) { idleRaf = 0; return; }
    const dt = Math.min(0.048, ((now - (lastTs || now)) || 16) / 1000);
    lastTs = now;
    if (world) {
      world.clock += dt;
      animateWorld(dt, false);
    }
    idleRaf = requestAnimationFrame(idleTick);
  }

  function startIdle() {
    if (idleRaf || raf) return;
    ensureWorld();
    if (!cabinetOn()) return;
    if (world && (!run || run.done)) {
      try { setHologram("star"); } catch (_) { /* first paint */ }
      world.mailbox.visible = false;
      world.crystal2.visible = false;
    }
    lastTs = performance.now();
    idleRaf = requestAnimationFrame(idleTick);
  }

  function stopIdle() {
    if (idleRaf) cancelAnimationFrame(idleRaf);
    idleRaf = 0;
  }

  function setPointerFromEvent(ev) {
    const canvas = world && world.canvas;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const t = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]) || ev;
    pointerNdc.x = ((t.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    pointerNdc.y = -(((t.clientY - r.top) / Math.max(1, r.height)) * 2 - 1);
    lookX = pointerNdc.x;
    lookY = pointerNdc.y;
  }

  function onPointerDown(ev) {
    if (!world) return;
    setPointerFromEvent(ev);
    pointerInside = true;
    try { world.canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
    if (!isLive()) return;
    if (run.spec && run.spec.twin) tryClickSwitch();
    ev.preventDefault();
  }

  function onPointerMove(ev) {
    if (!world) return;
    setPointerFromEvent(ev);
    pointerInside = true;
  }

  function onPointerUp() {
    pointerInside = true;
  }

  function bind() {
    if (bound) return;
    bound = true;
    const go = () => start();
    const startBtn = el("fortuneStart");
    if (startBtn) startBtn.addEventListener("click", go);
    const goBtn = el("fortuneGo");
    if (goBtn) goBtn.addEventListener("click", go);
    const ch = el("fortuneChallenge");
    if (ch) {
      ch.addEventListener("click", async () => {
        const text = (el("fortuneChallengeText") && el("fortuneChallengeText").textContent) || "";
        if (kit && kit.copyText) {
          kit.copyText(text, () => { const c = el("fortuneCopied"); if (c) c.hidden = false; });
        } else {
          try {
            await navigator.clipboard.writeText(text);
            const copied = el("fortuneCopied");
            if (copied) copied.hidden = false;
          } catch (_) { /* ignore */ }
        }
      });
    }
    const canvas = el("fortuneCanvas");
    if (canvas) {
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointerleave", () => { pointerInside = false; });
      canvas.addEventListener("pointercancel", onPointerUp);
      canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    }
    window.addEventListener("resize", () => { if (cabinetOn()) resizeWorld(); });
    if (window.ResizeObserver && el("fortuneStage")) {
      new ResizeObserver(() => { if (cabinetOn()) resizeWorld(); }).observe(el("fortuneStage"));
    }
    window.addEventListener("keydown", (e) => {
      if (!cabinetOn()) return;
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (!isLive()) start();
        else if (run && run.spec && run.spec.twin) switchMoon();
      }
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.n = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.e = true;
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.s = true;
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.n = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.e = false;
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.s = false;
    });
    window.addEventListener("blur", () => { keys.n = keys.s = keys.w = keys.e = false; });
  }

  PF.registerVendor({
    id: "fortune",
    playKey: "fortune",
    chalk: "Move well · gold drinks · red cracks.",
    defaults: { bestFortuneRooms: 0, bestFortuneScore: 0 },
    bind,
    onLeave() {
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopIdle();
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      keys.n = keys.s = keys.w = keys.e = false;
    },
    onShow() {
      declareP0();
      stampDepthCopy();
      bind();
      const hash = (location.hash || "").replace(/^#/, "");
      if (hash === "cabinet/fortune/result" && run && run.done) {
        if (kit && kit.setMode) kit.setMode(cardRoot(), "result");
      } else if (!(run && (isLive() || run.dying))) {
        if (kit && kit.setMode) kit.setMode(cardRoot(), "vestibule");
        setText("fortunePlayStatus", DEPTH_COPY.status);
        const startBtn = el("fortuneStart");
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.hidden = false;
          startBtn.textContent = "START · 1 demo coin";
        }
        const goBtn = el("fortuneGo");
        if (goBtn) {
          goBtn.disabled = false;
          goBtn.textContent = "START · 1 demo coin";
        }
        const overlay = el("fortuneStartOverlay");
        if (overlay) overlay.hidden = false;
      }
      startIdle();
      requestAnimationFrame(() => { resizeWorld(); });
      paintHud();
    },
    onReset() {
      if (run && !run.done) finish("leave");
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      run = null;
      const verdict = el("fortuneVerdict");
      if (verdict) verdict.hidden = true;
      if (kit && kit.hideResult) kit.hideResult("fortuneOracleResult");
      ["fortuneStart", "fortuneGo"].forEach((id) => {
        const btn = el(id);
        if (btn) {
          btn.disabled = false;
          btn.hidden = false;
          btn.textContent = "START · 1 demo coin";
        }
      });
      const overlay = el("fortuneStartOverlay");
      if (overlay) overlay.hidden = false;
      const tix = el("fortuneFloatTicket");
      if (tix) tix.hidden = true;
      const card = cardRoot();
      if (card) card.classList.remove("is-danger");
      if (kit && kit.setMode) kit.setMode(cardRoot(), "vestibule");
      paintHud();
    },
    refreshDepth(state) {
      const playing = isLive() || !!(run && run.dying);
      setText("depthFortuneNow", playing ? `Room ${run.room}` : "Room 0");
      const bestN = Math.max((state && state.bestFortuneRooms) || 0, (state && state.bestDepth && state.bestDepth.fortune) || 0);
      setText("depthFortuneBest", bestN ? `Room ${bestN}` : "—");
      setText("depthFortuneScore", playing ? String(run.score) : "0");
      setText("depthFortuneBestScore", state && state.bestFortuneScore ? String(state.bestFortuneScore) : "—");
    },
  });
})();
