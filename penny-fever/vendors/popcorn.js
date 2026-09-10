/* Popcorn Kettle — Burst Bowl. Desktop Grok owns this doorway.
 * PF only. Never booth/port 6000. Never Imagine.
 * 3D tent: heat the oil, burst kernels, tilt the copper bowl, pour gold into the bag.
 * Gold = real pop. Grey steam = fake — let it rise.
 * One coin = one depth run. Family-safe carnival. No casino. No Mirror Crew.
 * Aura lock: brunette pigtails, yellow crown + red heart, green pinafore, shiny black shoes. */
import * as THREE from "../world/lib/three.module.min.js";

function boot() {
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) {
    requestAnimationFrame(boot);
    return;
  }
  initVendor(PF);
}
boot();

function initVendor(PF) {
  const { $, kit } = PF;

  const GAME_ID = "popcorn";
  const TAU = Math.PI * 2;
  const BURNS_TO_DEATH = 3;
  const DEATH_HOLD_MS = 820;
  const AUTHORED_COUNT = 8;
  const CODA_ENABLED = true;
  const BOWL_R = 0.62;
  const BAG_X = 0;
  const BAG_Z = 0.46;
  const BAG_R = 0.155;
  const MAX_TILT = 0.38;
  const TILT_DEAD = 0.18;
  const KEY_TILT = 0.72;
  const KERNEL_CAP = 28;
  const GOLD_SCORE = 24;
  const CARAMEL_SCORE = 40;
  const CLEAR_BONUS = 400;
  const REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  let world = null;
  let run = null;
  let loopRaf = 0;
  let lastNow = 0;
  let resizeObs = null;
  let bound = false;
  let idleClock = 0;
  let idleRoom = 1;
  let keyTiltUntil = 0;

  const pointer = { x: 0.5, y: 0.5 };
  const keys = { n: 0, s: 0, e: 0, w: 0 };
  const heatHold = { down: false };

  const AURA = {
    burn: "Aura: That was steam, sugar.",
    fake: "Aura: Steam fake. Kernel laughed.",
    batch: (n) => `Aura: BATCH ${n}. Burns ate the kettle run.`,
    clear: "Aura: True pops only. The oil runs hotter.",
    deep: (n) => `Aura: Stage ${n}. You're reading the kettle's lies.`,
    leave: "Aura: Left the kettle. Kernels kept lying.",
    shallow: "Aura: Not a true pop. The steam got there first.",
    souvenir: "Aura: Steam Lie souvenir. The kettle cooled for you.",
    hot: "Aura: Oil flashed. That's a scorch.",
    spill: "Aura: Over the rim. Gold on the boards.",
    vent: "Aura: Steam vent ate the gold.",
    burntBag: "Aura: Burnt in the bag. Dump those in the vents.",
    colour: "Aura: Wrong colour. Read the call.",
  };

  const AUTHORED = [
    {
      id: 1, title: "Honest Oil", kind: "teach",
      need: 5, heatMs: 1700, goldLo: 0.30, goldHi: 0.90,
      gravity: 2.55, drag: 2.05, spillSpeed: 3.4, bagR: 0.20, bagPull: 2.1,
      burstMin: 8, burstMax: 11, vents: 0, lid: false, quake: 0,
      mirror: false, call: "gold", caramel: 0, burnt: 0, steam: 0,
      fakeChance: 0, scorchMs: 0, burnsToDeath: BURNS_TO_DEATH, spillBurns: false, hotBurns: false,
      barker: "HOLD HEAT. Release on GOLD. MOVE toward the bag to pour. No steam yet.",
    },
    {
      id: 2, title: "Butter Slide", kind: "slick",
      need: 6, heatMs: 1500, goldLo: 0.36, goldHi: 0.86,
      gravity: 3.05, drag: 1.65, spillSpeed: 2.8, bagR: 0.18, bagPull: 1.15,
      burstMin: 8, burstMax: 11, vents: 0, lid: false, quake: 0,
      mirror: false, call: "gold", caramel: 0.14, burnt: 0, steam: 0.18,
      fakeChance: 0, scorchMs: 0, burnsToDeath: BURNS_TO_DEATH, spillBurns: false, hotBurns: false,
      barker: "Grey puffs are STEAM FAKES — they rise. Don't pour them. Gold sits in the oil.",
    },
    {
      id: 3, title: "Steam Gallery", kind: "vents",
      need: 7, heatMs: 1380, goldLo: 0.40, goldHi: 0.84,
      gravity: 3.2, drag: 1.5, spillSpeed: 2.55, bagR: 0.17, bagPull: 0.55,
      burstMin: 8, burstMax: 12, vents: 2, lid: false, quake: 0,
      mirror: false, call: "gold", caramel: 0.08, burnt: 0.14, steam: 0.2,
      fakeChance: 0.18, scorchMs: 0, burnsToDeath: BURNS_TO_DEATH, spillBurns: false, hotBurns: true,
      barker: "STEAM FAKES lie. Let grey rise. Dump burnt in the vents. Gold in the bag.",
    },
    {
      id: 4, title: "Lid Gate", kind: "lid",
      need: 7, heatMs: 1280, goldLo: 0.42, goldHi: 0.82,
      gravity: 3.3, drag: 1.42, spillSpeed: 2.4, bagR: 0.16, bagPull: 0.25,
      burstMin: 8, burstMax: 12, vents: 2, lid: true, lidRpm: 0.48, quake: 0,
      mirror: false, call: "gold", caramel: 0.1, burnt: 0.12, steam: 0.16,
      fakeChance: 0.16, scorchMs: 0, burnsToDeath: BURNS_TO_DEATH, spillBurns: true, hotBurns: true,
      barker: "Lid sweeps the bag. Pour gold when the mouth is open. Steam still lies.",
    },
    {
      id: 5, title: "Colour Call", kind: "colourCall",
      need: 8, heatMs: 1220, goldLo: 0.44, goldHi: 0.80,
      gravity: 3.4, drag: 1.38, spillSpeed: 2.3, bagR: 0.155,
      burstMin: 8, burstMax: 12, vents: 2, lid: false, quake: 0,
      mirror: false, call: "caramel", caramel: 0.4, burnt: 0.1, steam: 0.14,
      fakeChance: 0.16, scorchMs: 0, burnsToDeath: BURNS_TO_DEATH, spillBurns: true, hotBurns: true,
      barker: "Bag CARAMEL only. Yellow is a soft burn. Grey steam is still a fake.",
    },
    {
      id: 6, title: "Quake Ring", kind: "quake",
      need: 8, heatMs: 1160, goldLo: 0.46, goldHi: 0.78,
      gravity: 3.5, drag: 1.32, spillSpeed: 2.2, bagR: 0.15,
      burstMin: 8, burstMax: 13, vents: 3, lid: false, quake: 0.16,
      mirror: false, call: "gold", caramel: 0.12, burnt: 0.12, steam: 0.16,
      fakeChance: 0.18, scorchMs: 10000, burnsToDeath: BURNS_TO_DEATH, spillBurns: true, hotBurns: true,
      barker: "Kettle quakes. Counter-tilt. Let grey rise. Don't bag burnt.",
    },
    {
      id: 7, title: "Mirror Pour", kind: "mirror",
      need: 8, heatMs: 1120, goldLo: 0.48, goldHi: 0.76,
      gravity: 3.45, drag: 1.3, spillSpeed: 2.15, bagR: 0.148,
      burstMin: 9, burstMax: 13, vents: 3, lid: true, lidRpm: 0.62, quake: 0.08,
      mirror: true, call: "gold", caramel: 0.12, burnt: 0.14, steam: 0.18,
      fakeChance: 0.2, scorchMs: 9000, burnsToDeath: BURNS_TO_DEATH, spillBurns: true, hotBurns: true,
      barker: "MIRROR — tilt is swapped. Gold is true. Grey steam is a fake.",
    },
    {
      id: 8, title: "Fever Kernel Opera", kind: "comboFinale",
      need: 9, heatMs: 1060, goldLo: 0.50, goldHi: 0.74,
      gravity: 3.7, drag: 1.22, spillSpeed: 2.05, bagR: 0.142,
      burstMin: 9, burstMax: 13, vents: 3, lid: true, lidRpm: 0.75, quake: 0.2,
      mirror: false, call: "caramel", caramel: 0.36, burnt: 0.14, steam: 0.2,
      fakeChance: 0.22, scorchMs: 8000, burnsToDeath: BURNS_TO_DEATH, spillBurns: true, hotBurns: true,
      barker: "Lid, vents, quake, caramel call, steam fakes. Pour true. Let grey rise.",
    },
  ];

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Popcorn Kettle",
    depthUnit: "Batch",
    sheet: "GOBLIN_AUTHORED_LEVELS_B04.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored BATCHES then ENDLESS · heat · burst · pour gold · steam fakes lie",
    body: "A real 3D kettle tent. Honest Oil → Butter Slide → Steam Gallery → Lid Gate → Colour Call → Quake Ring → Mirror Pour → Fever Kernel Opera → ENDLESS Steam Lie. Hold HEAT, release on GOLD, tilt to pour. Butter-gold is a real pop. Grey steam is a fake — let it rise. Bagging steam burns. Three burns stamp the kettle.",
    status: "Depth run · START · 1 demo coin · gold pops · steam fakes lie",
    machine: "Hot kettle · 1 demo coin · 3D burst bowl",
    punch: "Depth run — press START. Hold HEAT. Release on GOLD. Bag gold. Let steam rise.",
  };

  function rk() { return PF.runKit || null; }
  function el(id) { return $(id); }
  function setText(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function card() { return el("popcornCard"); }
  function cabinetOn() {
    const node = document.getElementById("cabinet-popcorn");
    return !!(node && !node.hidden);
  }
  function isLive() { return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false); }
  function liveSpec() { return (run && run.spec) || popcornStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1); }

  function popcornCoda(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const t = stage - AUTHORED_COUNT;
    return {
      id: stage,
      title: `Steam Lie ${stage}`,
      kind: "coda",
      need: 10 + Math.min(6, t),
      heatMs: Math.max(760, 980 - 18 * t),
      goldLo: Math.min(0.6, 0.54 + 0.01 * t),
      goldHi: Math.max(0.64, 0.7 - 0.01 * t),
      gravity: Math.min(4.6, 3.7 + 0.06 * t),
      drag: Math.max(1.05, 1.22 - 0.015 * t),
      spillSpeed: Math.max(1.7, 2.05 - 0.025 * t),
      bagR: Math.max(0.125, 0.142 - 0.003 * t),
      bagPull: 0,
      burstMin: 10,
      burstMax: 15,
      vents: 3,
      lid: true,
      lidRpm: Math.min(1.3, 0.85 + 0.05 * t),
      quake: Math.min(0.42, 0.28 + 0.02 * t),
      mirror: t % 2 === 0,
      call: t % 3 === 0 ? "caramel" : "gold",
      caramel: 0.28,
      burnt: 0.18,
      steam: 0.18,
      fakeChance: Math.min(0.34, 0.22 + 0.015 * t),
      scorchMs: Math.max(5000, 8000 - 180 * t),
      burnsToDeath: BURNS_TO_DEATH,
      spillBurns: true,
      hotBurns: true,
      coda: true,
      barker: `ENDLESS — Steam Lie ${stage}. Read the kettle.`,
    };
  }

  function popcornStageParams(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) return Object.assign({}, AUTHORED[stage - 1]);
    if (!CODA_ENABLED) return null;
    return popcornCoda(stage);
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun || typeof kitRun.declare !== "function") return;
    try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already declared */ }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: popcornStageParams,
      codaParams: popcornCoda,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function hudLine(spec, playing) {
    if (!spec) return "BATCH 0";
    if (spec.coda) return `ENDLESS · BATCH ${playing} · ${spec.title}`;
    return `BATCH ${playing} · ${spec.title}`;
  }

  function ensureHud() {
    const hud = document.querySelector(`[data-runkit-hud="${GAME_ID}"]`);
    if (!hud) return;
    if (isLive() || (run && run.dying)) {
      hud.textContent = hudLine(liveSpec(), run.stage | 0);
      hud.hidden = false;
    } else {
      hud.textContent = "BATCH 0";
      hud.hidden = true;
    }
  }

  function ensurePips() {
    const span = document.querySelector(`[data-runkit-strikes="${GAME_ID}"]`);
    if (!span) return;
    const lit = (run && run.burns) || 0;
    span.querySelectorAll("i").forEach((node, i) => node.classList.toggle("on", i < lit));
  }

  function resetPips() {
    const span = document.querySelector(`[data-runkit-strikes="${GAME_ID}"]`);
    if (!span) return;
    span.querySelectorAll("i").forEach((n) => n.classList.remove("on"));
  }

  function setCall(text, kind) {
    const node = el("popcornCall");
    if (!node) return;
    if (!text) {
      node.hidden = true;
      node.textContent = "";
      node.className = "popcorn-toast";
      return;
    }
    node.hidden = false;
    node.textContent = text;
    node.className = "popcorn-toast" + (kind ? " is-" + kind : "");
  }

  function setStamp(on, souvenir) {
    const node = el("popcornStamp");
    if (!node) return;
    node.hidden = !on;
    node.textContent = souvenir ? "SOUVENIR" : "BURN";
    node.classList.toggle("is-souvenir", !!souvenir);
  }

  function paintPlayHud() {
    const spec = liveSpec();
    const need = el("popcornNeed");
    if (need) need.textContent = isLive() || (run && run.dying) ? `${run.bagged | 0} / ${spec.need}` : "0 / 0";
    const chip = el("popcornCallChip");
    const label = el("popcornCallLabel");
    const call = (spec && spec.call) || "gold";
    if (chip) chip.dataset.call = call;
    if (label) label.textContent = call === "caramel" ? "CARAMEL" : (call === "any" ? "ANY GOLD" : "GOLD");
    const wrap = el("popcornHeatWrap");
    if (wrap) wrap.hidden = !(isLive() || (run && run.dying));
    const hud = el("popcornHud");
    if (hud) hud.hidden = !(isLive() || (run && run.dying));
    paintHeat();
    ensureHud();
    ensurePips();
  }

  function paintHeat() {
    const fill = el("popcornHeatFill");
    const gold = el("popcornHeatGold");
    const call = el("popcornHeatCall");
    const meter = document.querySelector(".popcorn-heat-meter");
    const spec = liveSpec() || {};
    const lo = spec.goldLo != null ? spec.goldLo : 0.42;
    const hi = spec.goldHi != null ? spec.goldHi : 0.8;
    if (gold) {
      gold.style.left = (lo * 100).toFixed(1) + "%";
      gold.style.width = ((hi - lo) * 100).toFixed(1) + "%";
    }
    const h = run && isLive() ? run.heat : 0;
    if (fill) fill.style.width = (clamp(h, 0, 1) * 100).toFixed(1) + "%";
    let word = "HOLD";
    let cls = "";
    if (run && isLive() && heatHold.down) {
      if (h >= hi) { word = "TOO HOT"; cls = "is-hot"; }
      else if (h >= lo) { word = "GOLD — LET GO"; cls = "is-gold"; }
      else word = "HEATING";
    } else if (run && isLive() && run.bowlCount > 0) {
      word = "POUR";
    }
    if (call) call.textContent = word;
    if (meter) {
      meter.classList.toggle("is-gold", cls === "is-gold");
      meter.classList.toggle("is-hot", cls === "is-hot");
    }
    const btn = el("popcornHeatBtn");
    if (btn) btn.classList.toggle("is-held", !!(heatHold.down && isLive()));
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall through */ }
    }
    kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "burn",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestPopcorn = Math.max(state.bestPopcorn || 0, payload.depth);
      state.bestPopcornScore = Math.max(state.bestPopcornScore || 0, payload.score);
    }
    closeKitRun(payload);
    const siblingRuns = {};
    if (state && state.lastRun && typeof state.lastRun === "object" && !Array.isArray(state.lastRun)) {
      Object.keys(state.lastRun).forEach((k) => {
        const v = state.lastRun[k];
        if (v && typeof v === "object" && v.gameId) siblingRuns[k] = v;
      });
    }
    kit.persistRun(state, GAME_ID, payload);
    if (state) {
      const keyed = Object.assign({ gameId: GAME_ID, at: Date.now() }, payload);
      state.lastRun = Object.assign({}, siblingRuns, {
        game: GAME_ID,
        gameId: GAME_ID,
        depth: payload.depth,
        score: payload.score,
        deathReason: payload.deathReason,
        cashedOut: payload.cashedOut,
        at: keyed.at,
      });
      state.lastRun[GAME_ID] = keyed;
    }
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function tellDepth(n) {
    if (run && run.kitRun && rk() && typeof rk().reportDepth === "function") {
      const spec = liveSpec();
      try { rk().reportDepth(run.kitRun, n | 0, { name: spec.title, coda: !!spec.coda }); } catch (_) { /* hud */ }
    }
    ensureHud();
  }

  function lastDepth() {
    const state = PF.getState() || {};
    const keyed = state.lastRun && state.lastRun[GAME_ID];
    if (keyed && keyed.depth != null) return keyed.depth | 0;
    const last = state.lastRun;
    if (last && (last.game === GAME_ID || last.gameId === GAME_ID)) return last.depth | 0;
    return Math.max(state.bestPopcorn || 0, (state.bestDepth && state.bestDepth[GAME_ID]) || 0);
  }

  function tellStrike(reason) {
    if (!run || !run.kitRun || !rk() || typeof rk().reportStrike !== "function") return;
    try { rk().reportStrike(run.kitRun, reason); } catch (_) { /* pips */ }
    ensurePips();
  }

  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") {
      return rk().challengeText("Popcorn stage", depth, GAME_ID);
    }
    return `Beat my Popcorn stage ${depth | 0} on Penny Fever`;
  }

  function stampDepthCopy() {
    const host = card();
    if (!host) return;
    const num = host.querySelector(".machine-number");
    if (num) num.textContent = DEPTH_COPY.machine;
    host.querySelectorAll("[data-pf-depth-copy]").forEach((p) => { p.textContent = DEPTH_COPY.body; });
    ensureHud();
    ensurePips();
    if (!isLive() && (!run || run.done)) setText("popcornStatus", DEPTH_COPY.status);
    paintPlayHud();
  }

  function punchStart() {
    stampDepthCopy();
    setText("popcornStatus", DEPTH_COPY.punch);
    const btn = el("popcornStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      return PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
    }
    return PF.spendDemoCoin("popcorn")
      ? { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 }
      : null;
  }

  function ensureCss() {
    if (document.getElementById("pf-popcorn-css") || document.querySelector('link[href="vendors/popcorn.css"]')) return;
    const link = document.createElement("link");
    link.id = "pf-popcorn-css";
    link.rel = "stylesheet";
    link.href = "vendors/popcorn.css";
    document.head.appendChild(link);
  }

  /* ---------- Three.js world ---------- */

  function setGlFail(on) {
    const node = el("popcornGlFail");
    if (node) node.hidden = !on;
  }

  function canGL() {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch (_) {
      return false;
    }
  }

  function canvasTex(w, h, draw, rx, ry) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx || 1, ry || 1);
    t.anisotropy = 4;
    t.needsUpdate = true;
    return t;
  }

  function makeMat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color,
      roughness: 0.72,
      metalness: 0.08,
    }, extra || {}));
  }

  function box(mat, sx, sy, sz, x, y, z) {
    const m = new THREE.Mesh(world.geo.box, mat);
    m.scale.set(sx, sy, sz);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }
  function sph(mat, r, x, y, z) {
    const m = new THREE.Mesh(world.geo.sphere, mat);
    m.scale.setScalar(r);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }
  function cyl(mat, rt, rb, h, x, y, z) {
    const m = new THREE.Mesh(world.geo.cyl, mat);
    m.scale.set(rt, h, rb);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function makeAura() {
    const T = THREE;
    const g = new T.Group();
    const skin = makeMat(0xf0c4a8, { roughness: 0.52 });
    const blouse = makeMat(0xf5f0ea, { emissive: 0x3a3028, emissiveIntensity: 0.12 });
    const dress = makeMat(0x1e6b3c, { emissive: 0x0a2010, emissiveIntensity: 0.25 });
    const hair = makeMat(0x3d2418, { emissive: 0x1a0c08, emissiveIntensity: 0.12 });
    const gold = makeMat(0xe8b84a, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    const heart = makeMat(0xd22b3a, { emissive: 0xd22b3a, emissiveIntensity: 0.6 });
    const shoe = makeMat(0x111111, { roughness: 0.22, metalness: 0.45 });

    const hip = new T.Group();
    hip.position.y = 0.42;
    g.add(hip);
    hip.add(cyl(blouse, 0.13, 0.15, 0.28, 0, 0.28, 0));
    const skirt = new T.Mesh(new T.CylinderGeometry(0.26, 0.12, 0.36, 12), dress);
    skirt.position.y = 0.06;
    hip.add(skirt);

    const head = new T.Group();
    head.position.y = 0.64;
    hip.add(head);
    head.add(sph(skin, 0.22, 0, 0.02, 0));
    [-1, 1].forEach((side) => {
      head.add(sph(makeMat(0xf7f2ea), 0.038, side * 0.07, 0.03, 0.19));
      head.add(sph(makeMat(0x2a1810), 0.026, side * 0.07, 0.03, 0.21));
      head.add(sph(makeMat(0xffffff), 0.01, side * 0.06, 0.045, 0.22));
    });
    const smile = new T.Mesh(new T.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), makeMat(0xc45a6a));
    smile.position.set(0, -0.05, 0.2);
    smile.rotation.x = 2.6;
    head.add(smile);

    head.add(sph(hair, 0.23, 0, 0.06, -0.02));
    [-1, 1].forEach((side) => {
      head.add(sph(hair, 0.11, side * 0.2, -0.04, 0.04));
      head.add(sph(heart, 0.045, side * 0.2, 0.06, 0.06));
    });
    head.add(box(hair, 0.28, 0.07, 0.1, 0, 0.14, 0.16));

    const crown = new T.Group();
    crown.position.y = 0.24;
    head.add(crown);
    crown.add(new T.Mesh(new T.TorusGeometry(0.12, 0.022, 8, 18), gold));
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      const spike = new T.Mesh(new T.ConeGeometry(0.035, h, 6), gold);
      spike.position.set(x, h * 0.45, 0);
      crown.add(spike);
    });
    const gem = box(heart, 0.055, 0.055, 0.025, 0, 0.02, 0.11);
    gem.rotation.z = Math.PI / 4;
    crown.add(gem);

    const charm = box(heart, 0.09, 0.09, 0.04, 0, 0.22, 0.16);
    charm.rotation.z = Math.PI / 4;
    hip.add(charm);
    const collar = new T.Mesh(new T.TorusGeometry(0.1, 0.02, 8, 16), blouse);
    collar.position.y = 0.44;
    collar.rotation.x = Math.PI / 2;
    hip.add(collar);

    function limb(side, arm) {
      const pivot = new T.Group();
      pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0, 0);
      const len = arm ? 0.28 : 0.34;
      const rad = arm ? 0.035 : 0.042;
      pivot.add(cyl(arm ? skin : dress, rad, rad, len, 0, -len / 2, 0));
      if (arm) pivot.add(sph(skin, 0.04, 0, -len, 0));
      else pivot.add(box(shoe, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03));
      hip.add(pivot);
      return pivot;
    }
    const armL = limb(-1, true);
    const armR = limb(1, true);
    limb(-1, false);
    limb(1, false);

    g.userData = { hip, head, armL, armR, crown, t: Math.random() * 8, wave: 0, sulk: 0 };
    g.scale.setScalar(1.12);
    return g;
  }

  function makeKettle() {
    const T = THREE;
    const g = new T.Group();
    const copper = makeMat(0xb87333, { metalness: 0.74, roughness: 0.3, emissive: 0x3a1808, emissiveIntensity: 0.22 });
    const brass = makeMat(0xd4a45a, { metalness: 0.72, roughness: 0.28, emissive: 0x4a3008, emissiveIntensity: 0.15 });
    const iron = makeMat(0x2a2018, { metalness: 0.45, roughness: 0.55 });

    const pts = [
      new T.Vector2(0.05, 0),
      new T.Vector2(0.52, 0.04),
      new T.Vector2(0.62, 0.16),
      new T.Vector2(0.58, 0.42),
      new T.Vector2(0.5, 0.58),
      new T.Vector2(0.44, 0.64),
    ];
    const body = new T.Mesh(new T.LatheGeometry(pts, 36), copper);
    g.add(body);

    const bowl = new T.Group();
    bowl.position.y = 0.58;
    g.add(bowl);

    const oil = new T.Mesh(
      new T.CircleGeometry(0.44, 36),
      makeMat(0x3a2208, { metalness: 0.65, roughness: 0.22, emissive: 0xc45a10, emissiveIntensity: 0.45 })
    );
    oil.rotation.x = -Math.PI / 2;
    oil.position.y = 0.01;
    bowl.add(oil);

    const glow = new T.Mesh(
      new T.CircleGeometry(0.32, 20),
      new T.MeshBasicMaterial({ color: 0xff8a20, transparent: true, opacity: 0.38 })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.014;
    bowl.add(glow);

    const bagRing = new T.Mesh(
      new T.TorusGeometry(BAG_R, 0.016, 8, 22),
      makeMat(0xe8b84a, { metalness: 0.6, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 })
    );
    bagRing.rotation.x = Math.PI / 2;
    bagRing.position.set(BAG_X, 0.03, BAG_Z);
    bowl.add(bagRing);

    const bagHole = new T.Mesh(
      new T.CircleGeometry(BAG_R * 0.92, 20),
      new T.MeshBasicMaterial({ color: 0x140808, transparent: true, opacity: 0.72, side: T.DoubleSide })
    );
    bagHole.rotation.x = -Math.PI / 2;
    bagHole.position.set(BAG_X, 0.02, BAG_Z);
    bowl.add(bagHole);

    const vents = [];
    const ventSlots = [
      { x: -0.34, z: -0.18 },
      { x: 0.34, z: -0.18 },
      { x: 0, z: -0.36 },
    ];
    ventSlots.forEach((slot) => {
      const vg = new T.Group();
      vg.position.set(slot.x, 0.02, slot.z);
      const hole = new T.Mesh(
        new T.CircleGeometry(0.09, 14),
        new T.MeshBasicMaterial({ color: 0x1a1018, transparent: true, opacity: 0.8, side: T.DoubleSide })
      );
      hole.rotation.x = -Math.PI / 2;
      vg.add(hole);
      const rim = new T.Mesh(new T.TorusGeometry(0.09, 0.012, 6, 16), iron);
      rim.rotation.x = Math.PI / 2;
      vg.add(rim);
      vg.visible = false;
      bowl.add(vg);
      vents.push(vg);
    });

    const arrow = new T.Mesh(
      new T.ConeGeometry(0.04, 0.16, 8),
      makeMat(0xffe08a, { emissive: 0xffe08a, emissiveIntensity: 0.65, metalness: 0.2 })
    );
    arrow.rotation.x = Math.PI / 2;
    arrow.position.y = 0.05;
    bowl.add(arrow);

    const lidPivot = new T.Group();
    lidPivot.position.set(0, 0.66, -0.2);
    g.add(lidPivot);
    const lid = new T.Mesh(new T.SphereGeometry(0.46, 24, 14, 0, TAU, 0, Math.PI / 2), copper);
    lid.position.set(0, 0.02, 0.2);
    lidPivot.add(lid);
    lidPivot.add(sph(brass, 0.05, 0, 0.22, 0.2));

    const gate = new T.Mesh(
      new T.CylinderGeometry(0.17, 0.17, 0.03, 18, 1, false, 0, Math.PI * 1.15),
      copper
    );
    gate.rotation.x = Math.PI / 2;
    gate.position.set(BAG_X, 0.04, BAG_Z);
    gate.visible = false;
    bowl.add(gate);

    const handle = new T.Mesh(new T.TorusGeometry(0.2, 0.022, 8, 16, Math.PI), brass);
    handle.position.set(0.58, 0.36, 0);
    handle.rotation.set(0, Math.PI / 2, 0.18);
    g.add(handle);
    const handle2 = handle.clone();
    handle2.position.x = -0.58;
    handle2.rotation.y = -Math.PI / 2;
    g.add(handle2);

    const ring = new T.Mesh(new T.TorusGeometry(0.46, 0.028, 8, 24), iron);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.02;
    g.add(ring);
    [-1, 1].forEach((sx) => {
      [-1, 1].forEach((sz) => {
        g.add(cyl(iron, 0.03, 0.024, 0.26, sx * 0.32, -0.16, sz * 0.32));
      });
    });

    const flames = [];
    const flameA = new T.MeshBasicMaterial({ color: 0xff6a18, transparent: true, opacity: 0.88 });
    const flameB = new T.MeshBasicMaterial({ color: 0xffe080, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * TAU;
      const f = new T.Mesh(new T.ConeGeometry(0.036, 0.15, 6), i % 2 ? flameB : flameA);
      f.position.set(Math.cos(a) * 0.4, -0.02, Math.sin(a) * 0.4);
      g.add(f);
      flames.push(f);
    }

    const raw = [];
    const kMat = makeMat(0x5a3a18, { roughness: 0.82 });
    for (let i = 0; i < 16; i += 1) {
      const k = sph(kMat, 0.028, rand(-0.22, 0.22), 0.03, rand(-0.22, 0.18));
      bowl.add(k);
      raw.push(k);
    }

    g.userData = {
      bowl, oil, glow, flames, raw, lidPivot, bagRing, arrow, gate, vents,
      lidOpen: 0.42,
    };
    return g;
  }

  function makeBag() {
    const T = THREE;
    const g = new T.Group();
    const paper = makeMat(0xf2d9a0, { roughness: 0.92 });
    const red = makeMat(0xc41e3a, { roughness: 0.8, emissive: 0x400810, emissiveIntensity: 0.15 });
    g.add(box(paper, 0.28, 0.34, 0.18, 0, -0.12, 0.02));
    g.add(box(red, 0.286, 0.05, 0.186, 0, 0.02, 0.02));
    const rim = new T.Mesh(
      new T.TorusGeometry(0.14, 0.016, 8, 22),
      makeMat(0xe8b84a, { metalness: 0.55, roughness: 0.32, emissive: 0x6a4808, emissiveIntensity: 0.45 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.08;
    g.add(rim);
    const inner = new T.Mesh(
      new T.CircleGeometry(0.125, 16),
      new T.MeshBasicMaterial({ color: 0x1a0c08, transparent: true, opacity: 0.55, side: T.DoubleSide })
    );
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.078;
    g.add(inner);
    const pile = new T.Group();
    pile.position.y = -0.02;
    g.add(pile);
    g.userData = { rim, pile };
    g.rotation.x = -0.55;
    return g;
  }

  function steamMat() {
    return new THREE.MeshStandardMaterial({
      color: 0xc8d0d4,
      transparent: true,
      opacity: 0.48,
      roughness: 1,
      metalness: 0,
      depthWrite: false,
      emissive: 0x8a98a0,
      emissiveIntensity: 0.22,
    });
  }

  function makeKernelMesh(kind) {
    const g = new THREE.Group();
    g.userData.kind = kind;
    if (kind === "steam") {
      const mat = steamMat();
      g.userData.mat = mat;
      for (let i = 0; i < 4; i += 1) {
        const s = new THREE.Mesh(world.geo.sphere, mat);
        s.scale.setScalar(0.07 + i * 0.028);
        s.position.set(rand(-0.04, 0.04), i * 0.055, rand(-0.04, 0.04));
        g.add(s);
      }
      return g;
    }
    const mat = world.mats[kind] || world.mats.gold;
    for (let i = 0; i < 5; i += 1) {
      const s = new THREE.Mesh(world.geo.blob, mat);
      s.position.set(rand(-0.032, 0.032), rand(-0.024, 0.024), rand(-0.032, 0.032));
      s.scale.set(rand(0.85, 1.3), rand(0.7, 1.2), rand(0.8, 1.25));
      g.add(s);
    }
    return g;
  }

  function setKernelKind(mesh, kind) {
    mesh.userData.kind = kind;
    if (kind === "steam") {
      const mat = steamMat();
      mesh.userData.mat = mat;
      mesh.children.forEach((ch) => { ch.material = mat; });
      return;
    }
    const mat = world.mats[kind] || world.mats.gold;
    mesh.userData.mat = null;
    mesh.children.forEach((ch) => { ch.material = mat; });
  }

  function paintSign(title, sub) {
    if (!world || !world.signCtx) return;
    const ctx = world.signCtx;
    ctx.fillStyle = "#2a120c";
    ctx.fillRect(0, 0, 512, 220);
    ctx.fillStyle = "#1a0c08";
    ctx.fillRect(14, 14, 484, 192);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, 484, 192);
    ctx.fillStyle = "#e8a050";
    ctx.font = "700 22px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(sub || "BURST BOWL", 256, 64);
    ctx.fillStyle = "#fff6ec";
    ctx.font = "700 34px Georgia, serif";
    ctx.fillText(title || "Popcorn Kettle", 256, 118);
    ctx.fillStyle = "#e8a0b8";
    ctx.font = "18px Georgia, serif";
    ctx.fillText("GOLD POPS  ·  GREY STEAM LIES", 256, 164);
    world.signTex.needsUpdate = true;
  }

  function paintChalk(call) {
    if (!world || !world.chalkCtx) return;
    const ctx = world.chalkCtx;
    ctx.fillStyle = "#163024";
    ctx.fillRect(0, 0, 256, 192);
    ctx.strokeStyle = "#d4a45a";
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 240, 176);
    ctx.fillStyle = "#f0d09a";
    ctx.font = "700 22px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("BAG", 128, 52);
    ctx.beginPath();
    ctx.arc(128, 108, 28, 0, TAU);
    ctx.fillStyle = call === "caramel" ? "#c45a18" : "#f0d09a";
    ctx.fill();
    ctx.fillStyle = "#e8f0d8";
    ctx.font = "700 20px Georgia, serif";
    ctx.fillText((call || "gold").toUpperCase(), 128, 164);
    world.chalkTex.needsUpdate = true;
  }

  function bootWorld() {
    if (world) return world;
    const canvas = el("popcornCanvas");
    if (!canvas || !canGL()) {
      setGlFail(true);
      return null;
    }
    setGlFail(false);

    const geo = {
      box: new THREE.BoxGeometry(1, 1, 1),
      sphere: new THREE.SphereGeometry(1, 14, 12),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
      blob: new THREE.SphereGeometry(0.038, 8, 6),
    };
    world = {
      geo,
      bits: [],
      kernelPool: [],
      liveKernels: [],
      mats: {},
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x140808);
    scene.fog = new THREE.Fog(0x140808, 6.2, 14);
    world.scene = scene;

    const camera = new THREE.PerspectiveCamera(56, 1.2, 0.08, 60);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    camera.position.set(1.4, 2.25, 5.35);
    world.camera = camera;
    world.camIdle = { x: 1.4, y: 2.25, z: 5.35 };
    world.camPlay = { x: 0, y: 2.55, z: 4.75 };
    world.lookIdle = new THREE.Vector3(0, 1.12, -0.2);
    world.lookPlay = new THREE.Vector3(0, 1.02, 0.02);
    world.look = world.lookIdle.clone();
    world.punch = 0;
    world.shake = 0;
    world.camMix = 0;
    world.tiltX = 0;
    world.tiltZ = 0;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    try { renderer.outputColorSpace = THREE.SRGBColorSpace; } catch (_) { /* r152+ */ }
    renderer.setClearColor(0x140808, 1);
    world.renderer = renderer;
    world.canvas = canvas;

    world.mats.gold = makeMat(0xf7e2b0, { roughness: 0.84, metalness: 0.04, emissive: 0xf7e2b0, emissiveIntensity: 0.18 });
    world.mats.caramel = makeMat(0xe07030, { roughness: 0.7, metalness: 0.08, emissive: 0xc45a10, emissiveIntensity: 0.28 });
    world.mats.burnt = makeMat(0x2a1810, { roughness: 0.9, metalness: 0.05, emissive: 0x1a0804, emissiveIntensity: 0.1 });
    world.mats.steam = steamMat();

    scene.add(new THREE.HemisphereLight(0xffc8a0, 0x1a0808, 0.75));
    scene.add(new THREE.AmbientLight(0x3a2418, 0.38));
    const flameLight = new THREE.PointLight(0xff7a20, 2.6, 6.5, 1.5);
    flameLight.position.set(0, 1.15, -0.15);
    scene.add(flameLight);
    world.flameLight = flameLight;
    const bulbL = new THREE.PointLight(0xffd090, 1.2, 8, 1.8);
    bulbL.position.set(-1.5, 2.45, 0.5);
    scene.add(bulbL);
    const bulbR = new THREE.PointLight(0xffd090, 1.2, 8, 1.8);
    bulbR.position.set(1.5, 2.45, 0.5);
    scene.add(bulbR);
    world.bulbs = [bulbL, bulbR];

    const stripe = canvasTex(256, 256, (ctx) => {
      for (let i = 0; i < 10; i += 1) {
        ctx.fillStyle = i % 2 ? "#7a1e32" : "#f3d7a8";
        ctx.fillRect(0, i * 25.6, 256, 25.6);
      }
    }, 1, 3);
    const canvasMat = new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.88, metalness: 0.02 });
    const wood = canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 18; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${0.05 + (i % 3) * 0.03})`;
        ctx.fillRect(i * 14 + 4, 0, 3, 256);
      }
      ctx.strokeStyle = "rgba(212,164,90,0.12)";
      for (let i = 0; i < 8; i += 1) {
        ctx.beginPath();
        ctx.moveTo(0, i * 32 + 10);
        ctx.bezierCurveTo(80, i * 32, 160, i * 32 + 18, 256, i * 32 + 8);
        ctx.stroke();
      }
    }, 2, 2);
    const woodMat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.82 });
    const night = makeMat(0x0c0814, { roughness: 1 });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), woodMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const back = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.4), canvasMat);
    back.position.set(0, 2.15, -2.35);
    scene.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.4), canvasMat);
    left.position.set(-3.6, 2.15, 0.15);
    left.rotation.y = Math.PI / 2.35;
    scene.add(left);
    const right = left.clone();
    right.position.x = 3.6;
    right.rotation.y = -Math.PI / 2.35;
    scene.add(right);

    const roofL = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.6), canvasMat);
    roofL.position.set(-1.2, 3.7, -0.45);
    roofL.rotation.set(Math.PI / 2.7, 0, Math.PI / 10);
    scene.add(roofL);
    const roofR = roofL.clone();
    roofR.position.x = 1.2;
    roofR.rotation.z = -Math.PI / 10;
    scene.add(roofR);

    const flap = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.3), night);
    flap.position.set(0, 1.45, -2.32);
    scene.add(flap);

    scene.add(box(woodMat, 3.8, 0.14, 1.35, 0, 0.88, 0.05));
    scene.add(box(woodMat, 3.8, 0.9, 0.16, 0, 0.44, 0.68));
    scene.add(box(woodMat, 0.16, 0.9, 1.35, -1.9, 0.44, 0.05));
    scene.add(box(woodMat, 0.16, 0.9, 1.35, 1.9, 0.44, 0.05));

    const kettle = makeKettle();
    kettle.position.set(0, 0.98, -0.18);
    scene.add(kettle);
    world.kettle = kettle;

    const aura = makeAura();
    aura.position.set(-1.42, 0, -0.78);
    aura.rotation.y = 0.7;
    scene.add(aura);
    world.aura = aura;

    const bag = makeBag();
    bag.position.set(0, 1.12, 0.62);
    scene.add(bag);
    world.bag = bag;

    world.signCtx = document.createElement("canvas").getContext("2d");
    world.signCtx.canvas.width = 512;
    world.signCtx.canvas.height = 220;
    world.signTex = new THREE.CanvasTexture(world.signCtx.canvas);
    world.signTex.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.64), new THREE.MeshBasicMaterial({ map: world.signTex }));
    sign.position.set(0, 2.42, -1.62);
    scene.add(sign);
    world.sign = sign;
    paintSign("Popcorn Kettle", "THE BURST BOWL");

    world.chalkCtx = document.createElement("canvas").getContext("2d");
    world.chalkCtx.canvas.width = 256;
    world.chalkCtx.canvas.height = 192;
    world.chalkTex = new THREE.CanvasTexture(world.chalkCtx.canvas);
    world.chalkTex.colorSpace = THREE.SRGBColorSpace;
    const chalk = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.42), new THREE.MeshBasicMaterial({ map: world.chalkTex }));
    chalk.position.set(1.28, 1.62, -0.55);
    chalk.rotation.y = -0.48;
    scene.add(chalk);
    world.chalk = chalk;
    paintChalk("gold");

    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe0a0 });
    for (let i = 0; i < 11; i += 1) {
      const b = new THREE.Mesh(world.geo.sphere, bulbMat);
      b.scale.setScalar(0.048);
      const u = i / 10;
      b.position.set(lerp(-2.4, 2.4, u), 2.82 + Math.sin(u * Math.PI) * 0.14, 0.72);
      scene.add(b);
    }

    scene.add(cyl(makeMat(0xf0f0ea), 0.045, 0.045, 0.14, 1.35, 1.04, 0.12));
    scene.add(box(makeMat(0xf0d09a, { emissive: 0x6a4808, emissiveIntensity: 0.22 }), 0.14, 0.055, 0.09, -1.15, 0.99, 0.18));

    const idleSteam = [];
    for (let i = 0; i < 7; i += 1) {
      const s = makeKernelMesh("steam");
      s.position.set(rand(-0.12, 0.12), 1.7, -0.18);
      s.userData.phase = rand(0, TAU);
      scene.add(s);
      idleSteam.push(s);
    }
    world.idleSteam = idleSteam;

    fitRenderer();
    if (typeof ResizeObserver !== "undefined") {
      resizeObs = new ResizeObserver(() => fitRenderer());
      resizeObs.observe(canvas.parentElement || canvas);
    }
    window.addEventListener("resize", fitRenderer);
    return world;
  }

  function fitRenderer() {
    if (!world || !world.renderer || !world.canvas) return;
    const canvas = world.canvas;
    const stage = canvas.parentElement;
    const w = Math.max(280, canvas.clientWidth || (stage && stage.clientWidth) || 640);
    const h = Math.max(360, canvas.clientHeight || (stage && stage.clientHeight) || 480);
    const pr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr)) {
      world.renderer.setPixelRatio(pr);
      world.renderer.setSize(w, h, false);
    }
    world.camera.aspect = w / Math.max(1, h);
    world.camera.updateProjectionMatrix();
  }

  function takeKernel(kind) {
    let m = world.kernelPool.pop();
    if (!m) m = makeKernelMesh(kind);
    setKernelKind(m, kind);
    m.visible = true;
    m.scale.setScalar(kind === "steam" ? 0.95 : 0.85);
    world.kettle.userData.bowl.add(m);
    const k = {
      mesh: m,
      kind,
      x: 0,
      z: 0,
      y: 0.06,
      vx: 0,
      vz: 0,
      flying: false,
      flyT: 0,
      flyDur: 0.5,
      sx: 0, sy: 0, sz: 0,
      tx: 0, ty: 0.06, tz: 0,
      arc: 0.45,
      rad: kind === "steam" ? 0.09 : 0.045,
      fake: kind === "steam",
      age: 0,
      cool: 0,
    };
    world.liveKernels.push(k);
    return k;
  }

  function freeKernel(k) {
    if (!k || !k.mesh) return;
    k.mesh.visible = false;
    if (k.mesh.parent) k.mesh.parent.remove(k.mesh);
    world.kernelPool.push(k.mesh);
    const i = world.liveKernels.indexOf(k);
    if (i >= 0) world.liveKernels.splice(i, 1);
  }

  function clearKernels() {
    if (!world) return;
    while (world.liveKernels.length) freeKernel(world.liveKernels[0]);
  }

  function spawnBit(hex, x, y, z, extra) {
    if (!world) return;
    const mat = extra && extra.basic
      ? new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.9 })
      : makeMat(hex, { emissive: hex, emissiveIntensity: 0.45 });
    const m = sph(mat, extra && extra.r ? extra.r : 0.018, x, y, z);
    world.scene.add(m);
    world.bits.push({
      mesh: m,
      vx: rand(-0.0018, 0.0018),
      vy: rand(0.0014, 0.0036),
      vz: rand(-0.0014, 0.0018),
      life: rand(280, 620),
      age: 0,
    });
  }

  function stepBits(dt) {
    world.bits = world.bits.filter((b) => {
      b.age += dt;
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.position.z += b.vz * dt;
      b.vy -= 0.000008 * dt;
      const u = b.age / b.life;
      b.mesh.scale.setScalar(Math.max(0.01, 1 - u));
      if (b.age >= b.life) {
        world.scene.remove(b.mesh);
        return false;
      }
      return true;
    });
  }

  function kettleWorldPos(lx, ly, lz, out) {
    const v = out || new THREE.Vector3();
    v.set(lx, ly, lz);
    world.kettle.userData.bowl.localToWorld(v);
    return v;
  }

  function pickKind(spec, quality) {
    const r = Math.random();
    if (r < (spec.steam || 0) * (1.15 - quality * 0.4)) return "steam";
    if (r < (spec.steam || 0) + (spec.burnt || 0) * (1.2 - quality)) return "burnt";
    if (r < (spec.steam || 0) + (spec.burnt || 0) + (spec.caramel || 0) + quality * 0.08) return "caramel";
    return "gold";
  }

  function launchKernel(kind, extra) {
    const k = takeKernel(kind);
    const ang = rand(0, TAU);
    const rad = extra && extra.rad != null ? extra.rad : rand(0.05, 0.34);
    k.flying = true;
    k.flyT = 0;
    k.flyDur = kind === "steam" ? rand(0.46, 0.72) : rand(0.38, 0.62);
    k.sx = rand(-0.06, 0.06);
    k.sy = 0.04;
    k.sz = rand(-0.06, 0.04);
    k.tx = Math.cos(ang) * rad;
    if (kind === "steam") k.tz = -Math.abs(Math.sin(ang)) * rad;
    else k.tz = clamp(Math.sin(ang) * rad * 0.85, -0.34, BAG_Z - 0.24);
    k.ty = kind === "steam" ? 0.2 : 0.06;
    k.arc = kind === "steam" ? 0.62 : 0.42 + ((extra && extra.quality) || 0.5) * 0.28;
    k.x = k.sx;
    k.z = k.sz;
    k.mesh.position.set(k.sx, k.sy, k.sz);
    return k;
  }

  function countBowl() {
    if (!world) return 0;
    return world.liveKernels.filter((k) => k.kind !== "steam").length;
  }

  function steamFakeBurst() {
    if (!world || !isLive()) return;
    const n = 4 + ((Math.random() * 3) | 0);
    world.kettle.userData.lidOpen = 0.52;
    world.punch = 0.22;
    world.shake = 0.55;
    kit.sfx("spinner");
    if (world.aura) world.aura.userData.sulk = 420;
    for (let i = 0; i < n; i += 1) launchKernel("steam", { rad: rand(0.08, 0.38) });
    const mouth = kettleWorldPos(0, 0.16, 0);
    for (let i = 0; i < 8; i += 1) spawnBit(0xc8d0d4, mouth.x, mouth.y, mouth.z, { basic: true, r: 0.022 });
    setCall("STEAM FAKE — let it rise", "steam");
    run.toastMs = 1100;
    run.bowlCount = countBowl();
    setText("popcornStatus", "Steam lie. Grey puff is not a pop. Don't bag it.");
  }

  function burst(quality) {
    if (!world || !isLive()) return;
    const spec = liveSpec();
    const n = Math.round(lerp(spec.burstMin, spec.burstMax, quality));
    const room = KERNEL_CAP - world.liveKernels.length;
    const count = Math.max(3, Math.min(n, room));
    world.kettle.userData.lidOpen = 0.95;
    world.punch = Math.max(world.punch, 0.55 + quality * 0.7);
    world.shake = Math.max(world.shake, 1.1 + quality * 1.4);
    kit.sfx(quality > 0.55 ? "rack" : "tray");
    if (world.aura) world.aura.userData.wave = 500 + quality * 500;
    let golds = 0;
    let steams = 0;
    for (let i = 0; i < count; i += 1) {
      const kind = pickKind(spec, quality);
      launchKernel(kind, { quality });
      if (kind === "steam") steams += 1;
      else golds += 1;
    }
    const mouth = kettleWorldPos(0, 0.12, 0);
    for (let i = 0; i < 10 + quality * 8; i += 1) {
      spawnBit(0xf7e2b0, mouth.x, mouth.y, mouth.z, { r: 0.016 });
    }
    if (golds === 0 && steams > 0) {
      setCall("STEAM FAKE — let it rise", "steam");
    } else {
      setCall(quality > 0.7 ? "TRUE POP" : (quality > 0.35 ? "POP — bag the gold" : "soft pop"), "gold");
    }
    run.toastMs = 800;
    run.bowlCount = countBowl();
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
  }

  function fillBagVisual() {
    if (!world || !world.bag) return;
    const pile = world.bag.userData.pile;
    const want = Math.min(18, (run && run.bagged) || 0);
    while (pile.children.length < want) {
      const p = sph(world.mats.gold, 0.04, rand(-0.07, 0.07), pile.children.length * 0.028, rand(-0.05, 0.05));
      pile.add(p);
    }
    while (pile.children.length > want) {
      pile.remove(pile.children[pile.children.length - 1]);
    }
  }

  function bagKernel(k) {
    if (!isLive() || !k) return;
    const spec = liveSpec();
    const kind = k.kind;
    const pos = kettleWorldPos(k.x, 0.08, k.z);
    freeKernel(k);
    run.bowlCount = countBowl();

    if (kind === "steam") {
      burn("fake_tap", AURA.fake);
      return;
    }
    if (kind === "burnt") {
      burn("burn", AURA.burntBag);
      return;
    }
    const call = spec.call || "gold";
    if (call === "caramel" && kind !== "caramel") {
      burn("burn", AURA.colour);
      return;
    }
    if (call === "gold" && kind === "caramel") {
      /* caramel is bonus on gold-call stages */
    } else if (call === "gold" && kind !== "gold" && kind !== "caramel") {
      burn("burn", AURA.colour);
      return;
    }

    const pts = kind === "caramel" ? CARAMEL_SCORE : GOLD_SCORE;
    run.bagged += 1;
    run.combo += 1;
    run.score += pts + Math.min(40, run.combo * 4);
    if (run.kitRun) run.kitRun.score = run.score;
    world.punch = 0.55;
    world.shake = 1.1;
    if (world.aura) world.aura.userData.wave = 640;
    kit.sfx("sink");
    PF.setAura("point");
    for (let i = 0; i < 7; i += 1) spawnBit(kind === "caramel" ? 0xe07030 : 0xf7e2b0, pos.x, pos.y, pos.z);
    fillBagVisual();
    paintPlayHud();
    setText("popcornStatus", `Bagged ${run.bagged}/${spec.need} · pour the gold`);
    if (run.bagged >= spec.need) clearStage();
  }

  function ventKernel(k) {
    if (!isLive() || !k) return;
    const kind = k.kind;
    const pos = kettleWorldPos(k.x, 0.08, k.z);
    freeKernel(k);
    run.bowlCount = countBowl();
    if (kind === "burnt" || kind === "steam") {
      kit.sfx("drain");
      run.combo = Math.max(0, run.combo);
      spawnBit(0xdcdcdc, pos.x, pos.y, pos.z, { basic: true });
      return;
    }
    burn("fake_tap", AURA.vent);
  }

  function spillKernel(k) {
    if (!isLive() || !k) return;
    const kind = k.kind;
    const pos = kettleWorldPos(k.x, 0.1, k.z);
    freeKernel(k);
    run.bowlCount = countBowl();
    if (kind === "steam") {
      kit.sfx("drop");
      return;
    }
    if (kind === "gold" || kind === "caramel") {
      const spec = liveSpec();
      kit.sfx("miss");
      for (let i = 0; i < 6; i += 1) spawnBit(0xf7e2b0, pos.x, pos.y - 0.1, pos.z);
      if (spec && spec.spillBurns) burn("burn", AURA.spill);
      else {
        run.combo = 0;
        setText("popcornStatus", "Over the rim — gold gone. Pour gentler.");
        setCall("spilled", "hot");
        run.toastMs = 700;
      }
    } else {
      kit.sfx("drop");
    }
  }

  function readTilt(now) {
    let tx = (pointer.x - 0.5) * 2;
    let tz = (pointer.y - 0.5) * 2;
    const keyX = keys.e - keys.w;
    const keyZ = keys.s - keys.n;
    if (keyX || keyZ) {
      keyTiltUntil = now + 280;
      tx = keyX * KEY_TILT;
      tz = keyZ * KEY_TILT;
    } else if (now < keyTiltUntil) {
      tx = 0;
      tz = 0;
    } else {
      const mag = Math.hypot(tx, tz);
      if (mag < TILT_DEAD) {
        tx = 0;
        tz = 0;
      } else {
        const u = (mag - TILT_DEAD) / (1 - TILT_DEAD);
        tx = (tx / mag) * u;
        tz = (tz / mag) * u;
      }
    }
    tx = clamp(tx, -1, 1);
    tz = clamp(tz, -1, 1);
    const spec = liveSpec();
    if (spec && spec.mirror && isLive()) {
      tx *= -1;
      tz *= -1;
    }
    if (spec && spec.quake && isLive() && run) {
      const t = run.t * 0.001;
      tx += Math.sin(t * 3.1) * spec.quake;
      tz += Math.cos(t * 2.4) * spec.quake * 0.8;
    }
    return { x: clamp(tx, -1.15, 1.15), z: clamp(tz, -1.15, 1.15) };
  }

  function lidBlocksBag(spec, now) {
    if (!spec || !spec.lid) return false;
    const rpm = spec.lidRpm || 0.6;
    const phase = ((now * 0.001 * rpm) % 1);
    return phase > 0.42 && phase < 0.72;
  }

  function stepKernels(dt, now) {
    if (!world) return;
    const spec = liveSpec() || {};
    const dtSec = dt / 1000;
    const tilt = readTilt(now);
    world.tiltX = lerp(world.tiltX, tilt.x, 0.22);
    world.tiltZ = lerp(world.tiltZ, tilt.z, 0.22);
    const g = spec.gravity || 3.2;
    const drag = spec.drag || 1.4;
    const bagR = spec.bagR || BAG_R;
    const blocked = isLive() && lidBlocksBag(spec, now);
    const ventN = isLive() ? (spec.vents || 0) : 0;
    const scorch = (spec.scorchMs || 0);

    world.liveKernels.slice().forEach((k) => {
      if (!k.mesh) return;
      k.age += dt;
      if (k.flying) {
        k.flyT += dtSec;
        const u = clamp(k.flyT / k.flyDur, 0, 1);
        k.x = lerp(k.sx, k.tx, u);
        k.z = lerp(k.sz, k.tz, u);
        k.y = lerp(k.sy, k.ty, u) + Math.sin(u * Math.PI) * k.arc;
        k.mesh.position.set(k.x, k.y, k.z);
        k.mesh.rotation.x += 0.08;
        k.mesh.rotation.y += 0.1;
        if (u >= 1) {
          k.flying = false;
          if (k.kind === "steam") {
            k.y = Math.max(k.y, 0.14);
            k.vx = rand(-0.08, 0.08);
            k.vz = rand(-0.08, 0.08);
          } else {
            k.y = 0.06;
            k.vx = rand(-0.15, 0.15);
            k.vz = rand(-0.15, 0.15);
          }
        }
        return;
      }
      if (k.kind === "steam") {
        k.y += 0.34 * dtSec;
        k.x += Math.sin((k.age + now) * 0.004) * 0.14 * dtSec;
        k.z += Math.cos((k.age + now) * 0.003) * 0.08 * dtSec;
        const life = 1900;
        const fade = clamp(1 - k.age / life, 0, 1);
        k.mesh.scale.setScalar(0.95 + (1 - fade) * 0.7);
        if (k.mesh.userData.mat) k.mesh.userData.mat.opacity = 0.16 + fade * 0.42;
        k.mesh.position.set(k.x, k.y, k.z);
        if (isLive() && world.tiltZ > 0.58 && k.y < 0.13) {
          const bdx = k.x - BAG_X;
          const bdz = k.z - BAG_Z;
          if (bdx * bdx + bdz * bdz < bagR * bagR) {
            bagKernel(k);
            return;
          }
        }
        if (k.age > life || k.y > 0.82) {
          freeKernel(k);
          if (run) run.bowlCount = countBowl();
        }
        return;
      }
      k.cool += dt;
      if (scorch > 0 && k.kind === "gold" && k.cool > scorch) {
        k.kind = "burnt";
        setKernelKind(k.mesh, "burnt");
      }
      k.vx += world.tiltX * g * dtSec;
      k.vz += world.tiltZ * g * dtSec;
      if (spec.bagPull && world.tiltZ > 0.28) {
        k.vx += (BAG_X - k.x) * spec.bagPull * 0.55 * dtSec;
        k.vz += (BAG_Z - k.z) * spec.bagPull * dtSec;
      }
      const damp = Math.max(0, 1 - drag * dtSec);
      k.vx *= damp;
      k.vz *= damp;
      k.x += k.vx * dtSec;
      k.z += k.vz * dtSec;

      const r = Math.hypot(k.x, k.z);
      const maxR = BOWL_R - k.rad;
      if (r > maxR) {
        const nx = k.x / (r || 1);
        const nz = k.z / (r || 1);
        const spd = k.vx * nx + k.vz * nz;
        if (isLive() && spd > (spec.spillSpeed || 2) && r > maxR + 0.01) {
          spillKernel(k);
          return;
        }
        k.x = nx * maxR;
        k.z = nz * maxR;
        k.vx -= nx * spd * 1.55;
        k.vz -= nz * spd * 1.55;
      }

      const bob = 0.055 + Math.abs(Math.sin((now * 0.008) + k.x * 8)) * 0.012;
      k.y = lerp(k.y, bob, 0.2);
      k.mesh.position.set(k.x, k.y, k.z);
      k.mesh.rotation.y += 0.02;

      if (!isLive()) return;
      const bdx = k.x - BAG_X;
      const bdz = k.z - BAG_Z;
      if (bdx * bdx + bdz * bdz < bagR * bagR) {
        if (blocked) {
          k.vz -= 0.55;
          k.z = BAG_Z - bagR - 0.02;
        } else {
          bagKernel(k);
          return;
        }
      }
      if (ventN > 0) {
        const slots = world.kettle.userData.vents;
        for (let i = 0; i < ventN && i < slots.length; i += 1) {
          const v = slots[i].position;
          const dx = k.x - v.x;
          const dz = k.z - v.z;
          if (dx * dx + dz * dz < 0.09 * 0.09) {
            ventKernel(k);
            return;
          }
        }
      }
    });
    if (run) run.bowlCount = countBowl();
  }

  function beginHeat() {
    if (!isLive() || heatHold.down) return;
    heatHold.down = true;
    if (run.heat < 0.05) run.heat = 0.02;
    kit.sfx("shove");
  }

  function endHeat() {
    if (!heatHold.down) return;
    heatHold.down = false;
    if (!isLive()) {
      if (run) run.heat = 0;
      paintHeat();
      return;
    }
    const spec = liveSpec();
    const h = run.heat;
    run.heat = 0;
    if (h >= spec.goldHi) {
      if (spec.hotBurns !== false) {
        burn("burn", AURA.hot);
        if ((spec.vents || 0) > 0) {
          for (let i = 0; i < 3; i += 1) {
            const k = takeKernel("burnt");
            k.x = rand(-0.2, 0.2);
            k.z = rand(-0.2, 0.1);
            k.mesh.position.set(k.x, 0.08, k.z);
          }
        }
        world.kettle.userData.lidOpen = 0.2;
        paintHeat();
        return;
      }
      burst(0.28);
      setCall("TOO HOT — scorched pop", "hot");
      setText("popcornStatus", "Too hot. Release on GOLD next time.");
      run.toastMs = 900;
      paintHeat();
      return;
    }
    if (h < spec.goldLo) {
      const q = clamp(h / Math.max(0.08, spec.goldLo), 0.2, 0.42);
      burst(q);
      setText("popcornStatus", "Shallow pop. Wait for GOLD next time.");
      paintHeat();
      return;
    }
    const mid = (spec.goldLo + spec.goldHi) * 0.5;
    const half = (spec.goldHi - spec.goldLo) * 0.5;
    const quality = clamp(1 - Math.abs(h - mid) / Math.max(0.04, half), 0.35, 1);
    if ((spec.fakeChance || 0) > 0 && Math.random() < spec.fakeChance) {
      steamFakeBurst();
      paintHeat();
      return;
    }
    burst(quality);
    paintHeat();
  }

  function stepHeat(dt) {
    if (!isLive()) return;
    const spec = liveSpec();
    if (heatHold.down) {
      run.heat = clamp(run.heat + dt / Math.max(400, spec.heatMs), 0, 1.05);
      if (run.heat >= 1) {
        heatHold.down = false;
        run.heat = 0;
        if (spec.hotBurns !== false) {
          burn("burn", AURA.hot);
          world.kettle.userData.lidOpen = 0.05;
        } else {
          burst(0.28);
          setCall("TOO HOT — scorched pop", "hot");
          run.toastMs = 900;
        }
      }
    } else if (run.heat > 0 && run.heat < 0.08) {
      run.heat = 0;
    }
    paintHeat();
  }

  function animateProps(dt, now) {
    if (!world) return;
    const t = now * 0.001;
    const k = world.kettle.userData;
    const heat = (run && isLive() && heatHold.down) ? run.heat : 0.15;
    k.flames.forEach((f, i) => {
      const s = 0.75 + heat * 0.9 + Math.sin(t * 14 + i) * 0.22;
      f.scale.set(s, 0.85 + heat * 0.7 + Math.sin(t * 18 + i * 0.7) * 0.3, s);
      f.position.y = -0.02 + Math.sin(t * 20 + i) * 0.012;
    });
    k.raw.forEach((kn, i) => {
      kn.position.y = 0.03 + Math.abs(Math.sin(t * (6 + heat * 10) + i * 1.3)) * (0.03 + heat * 0.08);
      kn.rotation.y += 0.01 + heat * 0.04;
    });
    k.oil.rotation.z = Math.sin(t * 1.4) * 0.04;
    if (k.oil.material.emissive) {
      k.oil.material.emissiveIntensity = 0.35 + heat * 0.7 + Math.sin(t * 6) * 0.08;
    }
    k.glow.material.opacity = 0.22 + heat * 0.45 + Math.sin(t * 6) * 0.08;
    k.glow.material.color.setHex(heat > 0.8 ? 0xff4020 : (heat > 0.42 ? 0xffe080 : 0xff8a20));
    const wantLid = k.lidOpen;
    k.lidPivot.rotation.x = lerp(k.lidPivot.rotation.x, -wantLid, 0.12);
    k.lidOpen = lerp(k.lidOpen, isLive() ? 0.34 : 0.4, 0.04);
    world.flameLight.intensity = 2.0 + heat * 2.2 + Math.sin(t * 11) * 0.4;
    world.flameLight.color.setHex(heat > 0.8 ? 0xff5030 : 0xff7a20);
    world.bulbs.forEach((b, i) => { b.intensity = 1.05 + Math.sin(t * 5 + i) * 0.18; });

    world.idleSteam.forEach((s, i) => {
      const ph = s.userData.phase + t * 0.55;
      s.position.set(Math.sin(ph + i) * 0.12, 1.62 + (ph % 1.5) * 0.24, -0.16 + Math.cos(ph) * 0.05);
      s.scale.setScalar(0.7 + (ph % 1) * 0.5);
    });

    const au = world.aura.userData;
    au.t += dt * 0.001;
    au.wave = Math.max(0, au.wave - dt);
    au.sulk = Math.max(0, au.sulk - dt);
    au.hip.rotation.y = Math.sin(au.t * 1.3) * 0.08;
    au.head.rotation.y = Math.sin(au.t * 0.8) * 0.12;
    au.head.rotation.x = au.sulk > 0 ? 0.22 : Math.sin(au.t * 2) * 0.04;
    au.armR.rotation.z = au.wave > 0 ? -1.15 + Math.sin(au.t * 10) * 0.35 : -0.35 + Math.sin(au.t * 2) * 0.12;
    au.armL.rotation.z = 0.28 + Math.sin(au.t * 1.6) * 0.08;
    au.crown.rotation.y = Math.sin(au.t * 1.1) * 0.05;

    const spec = liveSpec();
    const ventN = spec && spec.vents ? spec.vents : 0;
    k.vents.forEach((v, i) => { v.visible = i < ventN; });
    k.gate.visible = !!(spec && spec.lid);
    if (spec && spec.lid) {
      const blocked = lidBlocksBag(spec, now);
      k.gate.rotation.z = blocked ? 0.15 : 1.4;
      k.gate.material.opacity = 1;
    }
    k.bagRing.material.emissiveIntensity = (isLive() && spec && !lidBlocksBag(spec, now)) ? 0.85 : 0.35;

    world.kettle.rotation.z = world.tiltX * MAX_TILT;
    world.kettle.rotation.x = world.tiltZ * MAX_TILT;
    const mag = Math.hypot(world.tiltX, world.tiltZ);
    k.arrow.visible = mag > 0.08;
    k.arrow.position.set(world.tiltX * 0.18, 0.05, world.tiltZ * 0.18);
    k.arrow.rotation.z = 0;
    k.arrow.rotation.x = Math.PI / 2;
    k.arrow.rotation.y = Math.atan2(world.tiltX, world.tiltZ);

    if (world.bag) {
      world.bag.position.x = world.tiltX * 0.12;
      world.bag.position.z = 0.62 + world.tiltZ * 0.08;
      world.bag.rotation.x = -0.55 + world.tiltZ * 0.2;
      world.bag.rotation.z = world.tiltX * 0.25;
      if (world.bag.userData.rim) {
        world.bag.userData.rim.material.emissiveIntensity = lerp(
          world.bag.userData.rim.material.emissiveIntensity,
          isLive() ? 0.7 : 0.4,
          0.1
        );
      }
    }

    const wantCam = (isLive() || (run && run.dying)) ? 1 : 0;
    world.camMix = lerp(world.camMix, wantCam, REDUCE ? 0.2 : 0.06);
    const idle = world.camIdle;
    const play = world.camPlay;
    const orbit = REDUCE ? 0 : Math.sin(t * 0.22) * (isLive() ? 0.04 : 0.18);
    world.camera.position.x = lerp(idle.x, play.x, world.camMix) + orbit * (1 - world.camMix);
    world.camera.position.y = lerp(idle.y, play.y, world.camMix) + Math.sin(t * 0.18) * 0.03;
    world.camera.position.z = lerp(idle.z, play.z, world.camMix) - world.punch * 0.2;
    world.look.lerp(isLive() || (run && run.dying) ? world.lookPlay : world.lookIdle, 0.08);
    if (world.shake > 0.04 && !REDUCE) {
      world.camera.position.x += (Math.random() - 0.5) * world.shake * 0.03;
      world.camera.position.y += (Math.random() - 0.5) * world.shake * 0.024;
      world.shake *= 0.86;
    } else world.shake = 0;
    world.punch *= 0.9;
    world.camera.lookAt(world.look);

    if (world.sign) world.sign.position.y = 2.4 + Math.sin(t * 1.2) * 0.035;
    if (spec) paintChalk(spec.call || "gold");

    stepBits(dt);
  }

  function stepIdle(dt, now) {
    idleClock += dt;
    if (idleClock > 3400) {
      idleClock = 0;
      idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
      paintSign(popcornStageParams(idleRoom).title, "THE BURST BOWL");
    }
    if (!world || isLive() || (run && run.dying)) return;
    if (world.liveKernels.length < 5 && Math.random() < 0.012) {
      const kind = Math.random() < 0.3 ? "steam" : (Math.random() < 0.15 ? "caramel" : "gold");
      const k = takeKernel(kind);
      k.flying = true;
      k.flyDur = 0.5;
      k.sx = 0; k.sy = 0.05; k.sz = 0;
      k.tx = rand(-0.28, 0.28);
      k.tz = rand(-0.28, 0.22);
      k.ty = 0.06;
      k.arc = 0.4;
    }
    if (world.liveKernels.length > 8 && Math.random() < 0.01) {
      freeKernel(world.liveKernels[0]);
    }
  }

  function stepRun(dt, now) {
    if (!run || run.done) return;
    run.t += dt;
    run.toastMs = Math.max(0, (run.toastMs || 0) - dt);
    if (run.toastMs <= 0 && isLive()) {
      const spec = liveSpec();
      if (heatHold.down) {
        const h = run.heat;
        if (h >= spec.goldHi) setCall("TOO HOT — LET GO", "hot");
        else if (h >= spec.goldLo) setCall("GOLD — RELEASE", "gold");
        else setCall("HEATING…", "");
      } else if (spec.lid && lidBlocksBag(spec, now)) {
        setCall("LID — WAIT", "steam");
      } else if (run.bowlCount > 0) {
        setCall(spec.call === "caramel" ? "TILT — pour CARAMEL into the bag" : "TILT — pour GOLD into the bag", "gold");
      } else if (spec.call === "caramel") {
        setCall("HOLD HEAT · bag CARAMEL", "gold");
      } else {
        setCall("HOLD HEAT · release on GOLD", "");
      }
    }

    if (run.dying) {
      stepKernels(dt, now);
      run.deathHold -= dt;
      if (run.deathHold <= 0) sealResult(run.deathNote);
      return;
    }
    if (!isLive()) return;
    stepHeat(dt);
    stepKernels(dt, now);
    if (typeof PF.refreshDepth === "function") PF.refreshDepth();
  }

  function clearStage() {
    if (!isLive()) return;
    run.score += CLEAR_BONUS;
    run.depth += 1;
    if (run.kitRun) {
      run.kitRun.depth = run.depth;
      run.kitRun.score = run.score;
    }
    tellDepth(run.depth);
    kit.sfx("cash");
    PF.setAura("celebrate");
    if (world.aura) world.aura.userData.wave = 1200;
    world.punch = 1;
    world.kettle.userData.lidOpen = 1.05;
    const mouth = kettleWorldPos(0, 0.1, 0);
    for (let i = 0; i < 18; i += 1) spawnBit(0xf7e2b0, mouth.x, mouth.y, mouth.z);
    const next = popcornStageParams(run.depth + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    setText("popcornStatus", run.depth >= 6
      ? AURA.deep(run.depth)
      : `${AURA.clear} ${next.title}.`);
    setCall(next.title, "gold");
    run.toastMs = 1100;
    startStage(run.depth + 1);
  }

  function burn(reason, note) {
    if (!isLive()) return;
    const spec = liveSpec();
    run.burns += 1;
    run.combo = 0;
    run.deathNote = reason;
    tellStrike(reason);
    kit.sfx(reason === "fake_tap" ? "spinner" : "miss");
    PF.setAura("laugh");
    world.shake = 2.6;
    if (world.aura) world.aura.userData.sulk = 700;
    setText("popcornStatus", `${note} Burns ${run.burns}/${spec.burnsToDeath}.`);
    setCall(note.replace(/^Aura:\s*/, ""), reason === "fake_tap" ? "steam" : "hot");
    run.toastMs = 900;
    paintPlayHud();
    if (run.burns >= spec.burnsToDeath) finish(reason);
  }

  function auraLine(reason, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (reason === "fake_tap") return AURA.fake;
    if (depth >= 6) return AURA.deep(depth);
    if (depth >= 5) return AURA.batch(depth);
    if (depth <= 0) return AURA.shallow;
    return AURA.burn;
  }

  function finish(reason) {
    if (!run || run.done) return;
    heatHold.down = false;
    if (reason === "leave") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.deathNote = reason === "souvenir" ? "souvenir" : (reason === "fake_tap" ? "fake_tap" : "burn");
    run.deathHold = DEATH_HOLD_MS;
    kit.sfx("stamp");
    world.shake = 3.2;
    if (world.kettle) world.kettle.userData.lidOpen = reason === "souvenir" ? 1.1 : 0.02;
    setStamp(true, reason === "souvenir");
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    heatHold.down = false;
    const depth = run.depth | 0;
    const score = run.score;
    const death = reason === "leave"
      ? "leave"
      : (reason === "souvenir" ? "souvenir" : (reason === "fake_tap" ? "fake_tap" : "burn"));
    persistDepth({
      depth,
      score,
      deathReason: death,
      cashedOut: death === "souvenir",
      meta: { burns: run.burns, lastStage: run.stage, bagged: run.bagged, kind: run.spec && run.spec.kind },
    });
    stampDepthCopy();
    const startBtn = el("popcornStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "POP AGAIN · 1 demo coin";
    }
    PF.focusCard("popcornCard", false);
    kit.setMode(card(), "result");
    const aura = auraLine(reason, depth);
    const challenge = challengeLine(depth);
    const verdict = el("popcornVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = `BATCH ${depth} · SCORE ${score} · ${aura}`;
    }
    kit.fillResult({
      root: "popcornResult",
      depth: "popcornResultDepth",
      score: "popcornResultScore",
      aura: "popcornResultAura",
      copied: "popcornCopied",
    }, {
      depthLine: `BATCH ${depth}`,
      scoreLine: `SCORE ${score} · ${String(death).replace(/_/g, " ").toUpperCase()}`,
      auraLine: aura,
    });
    setText("popcornChallengeText", challenge);
    PF.setTier("popcornTier", depth > 0 ? `BATCH ${depth}` : "BURN", depth > 0 ? "perfect" : "miss");
    setText("popcornStatus", reason === "leave" ? "Left the kettle." : (reason === "souvenir" ? "Kettle souvenir. Steam settled." : "Kettle stamped BURN."));
    setCall("", "");
    if (reason === "leave") setStamp(false);
    if (depth > 0) {
      PF.award(Math.max(8, Math.floor(score / 12)), true, "Popcorn");
      PF.setAura(depth >= 4 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `BATCH ${depth}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Popcorn burn");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "BURN", aura);
    }
    PF.refreshNightBoard();
    paintSign(depth > 0 ? `Batch ${depth}` : "BURN", death === "souvenir" ? "SOUVENIR" : "THE KETTLE COOLED");
    paintPlayHud();
  }

  function startStage(n) {
    const spec = popcornStageParams(n);
    if (!spec) {
      finish("souvenir");
      return;
    }
    run.spec = spec;
    run.stage = spec.id;
    run.bagged = 0;
    run.combo = 0;
    run.heat = 0;
    run.bowlCount = 0;
    heatHold.down = false;
    tellDepth(run.depth);
    paintSign(spec.title, spec.coda ? "ENDLESS BATCH" : "AUTHORED BATCH");
    paintChalk(spec.call || "gold");
    setText("popcornStatus", spec.barker || `${spec.title} — heat, burst, pour.`);
    setCall(spec.barker, "gold");
    run.toastMs = n === 1 ? 1800 : 1200;
    if (world && world.kettle) world.kettle.userData.lidOpen = 0.5;
    fillBagVisual();
    paintPlayHud();
  }

  function start() {
    if (isLive() || (run && run.dying)) return;
    if (!world) {
      bootWorld();
      if (!world) {
        setText("popcornStatus", "This tent wants WebGL. The kettle is dark.");
        setGlFail(true);
        return;
      }
    }
    const kitRun = beginKitRun();
    if (!kitRun) {
      setText("popcornStatus", "Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      stampDepthCopy();
      return;
    }
    resetPips();
    setStamp(false);
    clearKernels();
    if (world.bag && world.bag.userData.pile) {
      while (world.bag.userData.pile.children.length) {
        world.bag.userData.pile.remove(world.bag.userData.pile.children[0]);
      }
    }
    keyTiltUntil = 0;
    run = {
      done: false,
      dying: false,
      kitRun,
      t: 0,
      stage: 1,
      depth: 0,
      spec: popcornStageParams(1),
      bagged: 0,
      burns: 0,
      score: 0,
      combo: 0,
      heat: 0,
      bowlCount: 0,
      toastMs: 0,
      deathHold: 0,
      deathNote: "burn",
    };
    tellDepth(0);
    const startBtn = el("popcornStart");
    if (startBtn) startBtn.disabled = true;
    const verdict = el("popcornVerdict");
    if (verdict) verdict.hidden = true;
    kit.hideResult("popcornResult");
    PF.setTier("popcornTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    startStage(1);
    PF.focusCard("popcornCard", true);
    PF.setAura("think");
    fitRenderer();
    startLoop();
  }

  function startLoop() {
    if (loopRaf) return;
    lastNow = 0;
    const tick = (now) => {
      if (!cabinetOn() || !world) {
        loopRaf = 0;
        return;
      }
      if (!lastNow) lastNow = now;
      const dt = Math.min(48, now - lastNow);
      lastNow = now;
      if (isLive() || (run && run.dying && !run.done)) stepRun(dt, now);
      else {
        stepIdle(dt, now);
        world.tiltX = lerp(world.tiltX, Math.sin(now * 0.0004) * 0.35, 0.04);
        world.tiltZ = lerp(world.tiltZ, Math.cos(now * 0.00032) * 0.22, 0.04);
        stepKernels(dt, now);
      }
      animateProps(dt, now);
      try { world.renderer.render(world.scene, world.camera); } catch (_) { /* gl context */ }
      loopRaf = requestAnimationFrame(tick);
    };
    loopRaf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (loopRaf) cancelAnimationFrame(loopRaf);
    loopRaf = 0;
  }

  function pointerFromEvent(ev) {
    const canvas = el("popcornCanvas");
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const t = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]) || ev;
    pointer.x = clamp((t.clientX - r.left) / Math.max(1, r.width), 0, 1);
    pointer.y = clamp((t.clientY - r.top) / Math.max(1, r.height), 0, 1);
  }

  function keyDir(code, on) {
    const v = on ? 1 : 0;
    if (code === "ArrowLeft" || code === "KeyA") keys.w = v;
    else if (code === "ArrowRight" || code === "KeyD") keys.e = v;
    else if (code === "ArrowUp" || code === "KeyW") keys.n = v;
    else if (code === "ArrowDown" || code === "KeyS") keys.s = v;
  }

  PF.registerVendor({
    id: "popcorn",
    playKey: "popcorn",
    chalk: "Gold pops. Grey steam is a fake — let it rise.",
    defaults: { bestPopcorn: 0, bestPopcornScore: 0 },
    onLeave() {
      heatHold.down = false;
      setScrollLock(false);
      if (isLive() || (run && run.dying && !run.done)) finish("leave");
      stopLoop();
    },
    onShow() {
      ensureCss();
      stampDepthCopy();
      setStamp(false);
      setScrollLock(true);
      bootWorld();
      if (!world) {
        setText("popcornStatus", "This tent wants WebGL. The kettle is dark.");
        setGlFail(true);
        return;
      }
      fitRenderer();
      startLoop();
    },
    onReset() {
      heatHold.down = false;
      clearKernels();
      run = null;
      const verdict = el("popcornVerdict");
      if (verdict) verdict.hidden = true;
      kit.hideResult("popcornResult");
      const startBtn = el("popcornStart");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      resetPips();
      setStamp(false);
      setCall("", "");
      stampDepthCopy();
      if (cabinetOn()) startLoop();
    },
    refreshDepth(state) {
      setText("depthPopNow", isLive() || (run && run.dying) ? String(run.depth | 0) : "0");
      const spec = liveSpec();
      setText("depthPopCatch", isLive() || (run && run.dying) ? `${run.bagged}/${spec.need}` : "0");
      const bestN = Math.max(state.bestPopcorn || 0, (state.bestDepth && state.bestDepth.popcorn) || 0);
      setText("depthPopBest", bestN ? String(bestN) : "—");
      setText("depthPopBestScore", state.bestPopcornScore ? String(state.bestPopcornScore) : "—");
      const door = el("popcornDoorBest");
      if (door) door.textContent = bestN ? `Batch ${bestN}` : "Batch —";
    },
    bind() {
      if (bound) return;
      bound = true;
      ensureCss();
      declareP0();
      ensurePips();
      ensureHud();
      const startBtn = el("popcornStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = el("popcornCanvas");
      const swallow = (ev) => { ev.preventDefault(); };
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("pointermove", (ev) => {
          pointerFromEvent(ev);
          ev.preventDefault();
        }, { passive: false });
        canvas.addEventListener("pointerdown", (ev) => {
          pointerFromEvent(ev);
          ev.preventDefault();
          if (run && (run.dying || run.done)) return;
          if (!isLive()) {
            punchStart();
            return;
          }
          try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* optional */ }
        }, { passive: false });
        canvas.addEventListener("wheel", swallow, { passive: false });
        canvas.addEventListener("touchmove", swallow, { passive: false });
      }
      const host = document.getElementById("cabinet-popcorn");
      if (host) {
        host.addEventListener("wheel", (ev) => {
          if (cabinetOn()) ev.preventDefault();
        }, { passive: false });
        host.addEventListener("touchmove", (ev) => {
          if (!cabinetOn()) return;
          if (ev.target && ev.target.closest && ev.target.closest(".ticket-button, .quiet-button, .popcorn-heat-btn")) return;
          ev.preventDefault();
        }, { passive: false });
      }
      const heatBtn = el("popcornHeatBtn");
      if (heatBtn) {
        const down = (ev) => {
          if (!isLive()) return;
          ev.preventDefault();
          try { heatBtn.setPointerCapture(ev.pointerId); } catch (_) { /* optional */ }
          beginHeat();
        };
        const up = (ev) => {
          if (ev && ev.type === "pointerup") {
            try { heatBtn.releasePointerCapture(ev.pointerId); } catch (_) { /* optional */ }
          }
          endHeat();
        };
        heatBtn.addEventListener("pointerdown", down);
        heatBtn.addEventListener("pointerup", up);
        heatBtn.addEventListener("pointercancel", up);
      }
      window.addEventListener("keydown", (ev) => {
        if (!cabinetOn()) return;
        const scrollKey = ev.code === "Space" || ev.code === "ArrowUp" || ev.code === "ArrowDown"
          || ev.code === "ArrowLeft" || ev.code === "ArrowRight" || ev.code === "PageUp" || ev.code === "PageDown";
        if (scrollKey) ev.preventDefault();
        keyDir(ev.code, true);
        if (!isLive() || ev.repeat) return;
        if (ev.code === "Space" || ev.key === " ") beginHeat();
      });
      window.addEventListener("keyup", (ev) => {
        keyDir(ev.code, false);
        if (!cabinetOn()) return;
        if (ev.code === "Space" || ev.key === " ") {
          ev.preventDefault();
          endHeat();
        }
      });
      const copyBtn = el("popcornChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = lastDepth();
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const copied = el("popcornCopied");
            if (copied) copied.hidden = false;
            setText("popcornStatus", "Copied — send it");
          }, () => {
            setText("popcornStatus", text);
          });
        });
      }
      stampDepthCopy();
      if (cabinetOn()) {
        setScrollLock(true);
        bootWorld();
        if (world) startLoop();
      }
    },
  });
}

function setScrollLock(on) {
  document.documentElement.classList.toggle("pf-popcorn-noscroll", !!on);
}
