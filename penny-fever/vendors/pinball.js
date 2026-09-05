/* Pinball Alley — Desktop Grok owns this file. PF only. Never booth/port 6000.
 * GOBLIN HIT #3 FEEL 2026-09-05 — P1–P6 authored tables, not a faster-ball climb.
 * Plunger Parade ≠ Backglass Fever: open triangle + flat glass vs peaked fever deck + return spinner + sink well.
 * Twin Flip Gate opens from mini-flip CONTACT, not empty air. Thorns save-or-doom.
 * Custom · depthUnit: Chapter · codaEnabled hybrid ENDLESS after Backglass Fever (Aura-flippable).
 * Toys/walls change per chapter. Speed climb is coda-only (cap 1.7). Ramp miss = upper drain. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;
  const W = 320;
  const H = 520;
  const STEP = 1000 / 60;
  const BALL_R = 6.4;
  const GAME_ID = "pinball";
  const CODA_ENABLED = true;
  const AUTHORED_COUNT = 8;
  let run = null;
  let idleRaf = 0;
  let idleRoom = 1;
  let idleClock = 0;
  const pointers = new Map();
  const keys = { L: false, R: false };

  const AURA = {
    drain: "Aura: Outlane. The backglass felt that.",
    upper: "Aura: Missed the return. The shelf dumped you.",
    chapter: "Aura: Chapter up. New table. New toys.",
    deep: (n) => `Aura: Chapter ${n}. You're living in my table.`,
    drunk: "Aura: Those drunk flippers don’t wait.",
    souvenir: "Aura: Backglass Fever survived. Souvenir — the table bowed.",
    coda: "Aura: Authored chapters done. ENDLESS — toys stay, speed climbs.",
    leave: "Aura: You pulled the plug mid-chapter.",
  };

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Pinball Alley",
    depthUnit: "Chapter",
    sheet: "GOBLIN_BATCH01_BUILD_SHEETS.md",
    authoredSheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const AUTHORED_CHAPTERS = [
    {
      id: 1, name: "Plunger Parade", kind: "parade", speed: 1, bumper: 120,
      mission: { id: "bumpers", label: "Hit each bumper once" },
      toys: { spinner: false, sink: false, ramp: false, slings: false, upperFlip: false, gate: false, bonus: false, thorns: false, rollovers: false, upperShelf: false, posts: true },
      bumpers: [
        { x: 96, y: 168, r: 24, hue: "#e8a0b8" },
        { x: 208, y: 168, r: 24, hue: "#d4a45a" },
        { x: 152, y: 252, r: 22, hue: "#3d8a8a" },
      ],
      spinner: null, sink: null, ramp: null, outPull: 0, drunk: false,
      barker: "Open glass. Classic triangle. Kiss each bumper. No ramp. No sink. Not Fever.",
    },
    {
      id: 2, name: "Spinner Alley", kind: "spinner", speed: 1, bumper: 120,
      mission: { id: "spinner", label: "3 spinner ticks" },
      toys: { spinner: true, sink: false, ramp: false, slings: true, upperFlip: false, gate: false, bonus: false, thorns: false, rollovers: false, upperShelf: false, posts: false },
      bumpers: [
        { x: 44, y: 312, r: 14, hue: "#e8a0b8" },
        { x: 242, y: 312, r: 14, hue: "#d4a45a" },
      ],
      spinner: { x: 152, y: 102 }, sink: null, ramp: null, outPull: 0, drunk: false,
      barker: "Center spinner lane. Slingshots live. Bumpers stepped aside.",
    },
    {
      id: 3, name: "Sinkhole Circus", kind: "sink", speed: 1, bumper: 120,
      mission: { id: "sink", label: "Sink hole ×2" },
      toys: { spinner: false, sink: true, ramp: false, slings: true, upperFlip: false, gate: false, bonus: false, thorns: false, rollovers: false, upperShelf: false, posts: false },
      bumpers: [
        { x: 152, y: 168, r: 12, hue: "#e8a0b8" },
        { x: 218, y: 236, r: 12, hue: "#d4a45a" },
        { x: 152, y: 304, r: 12, hue: "#3d8a8a" },
        { x: 86, y: 236, r: 12, hue: "#c41e3a" },
      ],
      spinner: null, sink: { x: 152, y: 236 }, ramp: null, outPull: 0.03, drunk: false,
      barker: "Ring around the sink. Drop it twice.",
    },
    {
      id: 4, name: "Ramp Carnival", kind: "ramp", speed: 1, bumper: 120,
      mission: { id: "ramp-sink", label: "Shoot ramp + sink once" },
      toys: { spinner: false, sink: true, ramp: true, slings: true, upperFlip: false, gate: false, bonus: false, thorns: false, rollovers: false, upperShelf: true, posts: false },
      bumpers: [
        { x: 72, y: 92, r: 15, hue: "#e8a0b8" },
        { x: 86, y: 286, r: 16, hue: "#d4a45a" },
        { x: 232, y: 286, r: 16, hue: "#3d8a8a" },
      ],
      spinner: null, sink: { x: 214, y: 348 }, ramp: { x0: 18, y0: 58, x1: 142, y1: 142 }, outPull: 0.02, drunk: false,
      barker: "Wire ramp to the UPPER SHELF. Second floor. Miss the return, you drain.",
    },
    {
      id: 5, name: "Bumper Storm", kind: "storm", speed: 1, bumper: 120,
      mission: { id: "combo", label: "Bumper combo ×5" },
      toys: { spinner: false, sink: false, ramp: false, slings: true, upperFlip: false, gate: false, bonus: false, thorns: false, rollovers: false, upperShelf: false, posts: false, tightIn: true },
      bumpers: [
        { x: 118, y: 142, r: 16, hue: "#e8a0b8" },
        { x: 186, y: 142, r: 16, hue: "#d4a45a" },
        { x: 152, y: 184, r: 18, hue: "#3d8a8a" },
        { x: 110, y: 228, r: 15, hue: "#c41e3a" },
        { x: 194, y: 228, r: 15, hue: "#f0d09a" },
      ],
      spinner: null, sink: null, ramp: null, outPull: 0.02, drunk: false,
      barker: "Five bumpers dense. No ramp. Combo is the sport.",
    },
    {
      id: 6, name: "Twin Flip Gate", kind: "gate", speed: 1, bumper: 120,
      mission: { id: "gate", label: "Open gate + 2 bonus lane hits" },
      toys: { spinner: false, sink: false, ramp: false, slings: true, upperFlip: true, gate: true, bonus: true, thorns: false, rollovers: false, upperShelf: false, posts: false },
      bumpers: [
        { x: 108, y: 268, r: 14, hue: "#e8a0b8" },
        { x: 196, y: 268, r: 14, hue: "#d4a45a" },
      ],
      spinner: null, sink: null, ramp: null, outPull: 0.02, drunk: false,
      barker: "Tap both to pulse the mini-flip. Gate opens the bonus lane.",
    },
    {
      id: 7, name: "Outlane Thorns", kind: "thorns", speed: 1, bumper: 120,
      mission: { id: "alt", label: "Spinner, then sink" },
      toys: { spinner: true, sink: true, ramp: false, slings: true, upperFlip: false, gate: false, bonus: false, thorns: true, rollovers: false, upperShelf: false, posts: true },
      bumpers: [
        { x: 122, y: 168, r: 14, hue: "#e8a0b8" },
        { x: 182, y: 168, r: 14, hue: "#d4a45a" },
        { x: 152, y: 220, r: 13, hue: "#3d8a8a" },
      ],
      spinner: { x: 52, y: 118 }, sink: { x: 152, y: 298 }, ramp: null, outPull: 0.015, drunk: false,
      barker: "Thorn posts by the outlanes. They save. They doom.",
    },
    {
      id: 8, name: "Backglass Fever", kind: "fever", speed: 1, bumper: 120,
      mission: { id: "chain", label: "Ramp → spinner → sink" },
      toys: { spinner: true, sink: true, ramp: true, slings: true, upperFlip: false, gate: false, bonus: false, thorns: false, rollovers: true, upperShelf: true, posts: false },
      bumpers: [
        { x: 96, y: 108, r: 13, hue: "#e8a0b8" },
        { x: 52, y: 214, r: 14, hue: "#d4a45a" },
        { x: 248, y: 196, r: 14, hue: "#3d8a8a" },
        { x: 152, y: 278, r: 15, hue: "#c41e3a" },
      ],
      spinner: { x: 228, y: 214 }, sink: { x: 152, y: 342 }, ramp: { x0: 18, y0: 48, x1: 196, y1: 154 }, outPull: 0.04, drunk: false,
      barker: "Combo table: peaked fever deck, return spinner, sink well, four bumpers. Rollovers rearrange. Not Parade.",
    },
  ];
  const PINBALL_LEVELS = AUTHORED_CHAPTERS;

  const CODA_MISSIONS = [
    { id: "chain", label: "Ramp → spinner → sink" },
    { id: "combo", label: "Bumper combo ×5" },
    { id: "spinner", label: "3 spinner ticks" },
    { id: "sink", label: "Sink hole ×2" },
    { id: "ramp-sink", label: "Ramp + sink" },
  ];

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 8 authored CHAPTERS · ENDLESS coda · one ball",
    body: "Authored tables, not a faster ball: Plunger Parade → Spinner Alley → Sinkhole Circus → Ramp Carnival → Bumper Storm → Twin Flip Gate → Outlane Thorns → Backglass Fever. After 8, ENDLESS coda (flaggable). Drain ends the coin.",
    status: "Depth run · START · 1 demo coin · 8 authored CHAPTERS then ENDLESS",
    machine: "One-ball table · 1 demo coin · authored CHAPTERS",
    idleHud: ["Authored CHAPTERS — toys change, not speed", "L/R halves · one ball · START"],
    punch: "Depth run — press START. No one-tap prize.",
  };

  function rk() {
    return PF.runKit || null;
  }

  function codaOn() {
    const kitRun = rk();
    const row = kitRun && ((kitRun.declared && kitRun.declared[GAME_ID]) || (kitRun.p0 && kitRun.p0[GAME_ID]));
    if (row && typeof row.codaEnabled === "boolean") return !!row.codaEnabled;
    return !!P0_MOUNT.codaEnabled;
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    const spec = Object.assign({
      authored: AUTHORED_CHAPTERS,
      authoredCount: AUTHORED_COUNT,
      codaEnabled: CODA_ENABLED,
      codaParams: codaChapter,
      level: chapterSpec,
      stageParams: chapterSpec,
      PINBALL_LEVELS,
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
    const ctx = run && (run.kitRun || run.ctx);
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall through */ }
    }
    kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function isLive() {
    const ctx = run && (run.kitRun || run.ctx);
    return !!(run && !run.done && ctx && ctx.alive !== false);
  }

  function punchStart() {
    stampDepthCopy();
    const el = $("pinballStatus");
    if (el) el.textContent = DEPTH_COPY.punch;
    const btn = $("pinballStart");
    if (btn && !btn.hidden) {
      try { btn.focus(); } catch (_) { /* ignore */ }
      if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "drain",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestPinballCh = Math.max(state.bestPinballCh || 0, payload.depth);
      state.bestPinballScore = Math.max(state.bestPinballScore || 0, payload.score);
      state.bestPinballBalls = Math.max(state.bestPinballBalls || 0, payload.depth);
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function challengeLine(n) {
    return `Beat my Pinball chapter ${n | 0} on Penny Fever`;
  }

  function codaChapter(n) {
    const t = Math.max(0, n - AUTHORED_COUNT - 1);
    const base = AUTHORED_CHAPTERS[AUTHORED_COUNT - 1];
    const mission = CODA_MISSIONS[t % CODA_MISSIONS.length];
    return Object.assign({}, base, {
      id: n,
      ch: n,
      name: `Fever Coda ${n}`,
      kind: "coda",
      speed: Math.min(1.7, 1.16 + t * 0.06),
      bumper: 120 + t * 18,
      mission,
      coda: true,
      drunk: n >= 11,
      outPull: Math.min(0.08, 0.035 + t * 0.008),
      barker: "ENDLESS — Backglass toys, rotated mission, speed climbs.",
    });
  }

  function chapterSpec(n) {
    const ch = Math.max(1, n | 0);
    if (ch <= AUTHORED_COUNT) {
      const row = AUTHORED_CHAPTERS[ch - 1];
      return Object.assign({ ch, coda: false, title: row.name }, row);
    }
    if (!codaOn()) return null;
    return codaChapter(ch);
  }

  function hudChapter(spec) {
    if (!spec) return "CHAPTER";
    if (spec.coda) return `ENDLESS · CHAPTER ${spec.ch} · ${spec.name}`;
    return `CHAPTER ${spec.ch} · ${spec.name}`;
  }

  function paintKitHud(spec) {
    const host = card();
    if (!host) return;
    const hud = host.querySelector(".pinball-rk-hud");
    if (!hud) return;
    if (!spec || !run || run.done) {
      hud.textContent = "";
      return;
    }
    hud.textContent = hudChapter(spec);
  }

  function roomTell(spec) {
    if (!spec) return "ONE BALL — HOW MANY CHAPTERS?";
    const id = spec.mission && spec.mission.id;
    if (spec.kind === "parade" || id === "bumpers") return "HIT EACH BUMPER ONCE";
    if (spec.kind === "spinner" || id === "spinner") return "SHOOT THE CENTER LANE";
    if (spec.kind === "sink" || id === "sink") return "DROP THE HOLE ×2";
    if (spec.kind === "ramp" || id === "ramp-sink") return "RAMP TO THE UPPER SHELF";
    if (spec.kind === "storm" || id === "combo") return "COMBO FIVE BUMPERS";
    if (spec.kind === "gate" || id === "gate") return "TAP BOTH · OPEN THE GATE";
    if (spec.kind === "thorns" || id === "alt") return "POSTS SAVE OR DOOM";
    if (spec.coda) return "ENDLESS · ROTATED MISSION";
    if (spec.kind === "fever" || id === "chain") return "FEVER DECK · RAMP → SPIN → SINK";
    return spec.mission ? spec.mission.label : "ONE BALL";
  }

  function isFeverTable(spec) {
    const kind = spec && spec.kind;
    return kind === "fever" || kind === "coda";
  }

  function shelfGeom(spec) {
    if (isFeverTable(spec)) {
      return {
        x0: 16, x1: 214, yTop: 44, yFloor: 154,
        retX0: 214, retY0: 154, retX1: 262, retY1: 208,
        label: "FEVER DECK",
      };
    }
    if (spec && spec.toys && spec.toys.upperShelf) {
      return {
        x0: 20, x1: 158, yTop: 62, yFloor: 132,
        retX0: 158, retY0: 132, retX1: 228, retY1: 182,
        label: "UPPER SHELF",
      };
    }
    return null;
  }

  function tableWalls(spec) {
    const toys = (spec && spec.toys) || {};
    const kind = (spec && spec.kind) || "parade";
    const fever = isFeverTable(spec);
    /* Outlane flare is a layout verb: parade gentle, spinner wide, storm pinched, fever drunk. */
    const out = kind === "spinner" ? 34 : kind === "storm" ? -28 : kind === "thorns" ? 18 : kind === "ramp" ? 10 : kind === "gate" ? 8 : kind === "parade" ? -22 : fever ? 28 : 4;
    const leftX = kind === "storm" ? 52 : kind === "spinner" ? 18 : kind === "parade" ? 36 : fever ? 14 : 20;
    const rightX = kind === "storm" ? 234 : kind === "spinner" ? 266 : kind === "parade" ? 248 : fever ? 270 : 266;
    const topY = fever ? 48 : 68;
    const walls = fever
      ? [
          { a: { x: leftX, y: 68 }, b: { x: 88, y: 42 } },
          { a: { x: 88, y: 42 }, b: { x: 168, y: 36 } },
          { a: { x: 168, y: 36 }, b: { x: rightX, y: 68 } },
          { a: { x: leftX, y: 68 }, b: { x: leftX, y: 352 } },
          { a: { x: rightX, y: 68 }, b: { x: rightX, y: 352 } },
          { a: { x: leftX, y: 352 }, b: { x: 54 + out, y: 508 } },
          { a: { x: rightX, y: 352 }, b: { x: 232 - out, y: 508 } },
          { a: { x: 266, y: 118 }, b: { x: 266, y: 428 } },
          { a: { x: 266, y: 118 }, b: { x: 304, y: 78 } },
          { a: { x: 304, y: 78 }, b: { x: 304, y: 428 } },
          { a: { x: 266, y: 428 }, b: { x: 304, y: 428 } },
        ]
      : [
          { a: { x: leftX, y: topY }, b: { x: rightX, y: topY } },
          { a: { x: leftX, y: topY }, b: { x: leftX, y: 352 } },
          { a: { x: rightX, y: topY }, b: { x: rightX, y: 352 } },
          { a: { x: leftX, y: 352 }, b: { x: 54 + out, y: 508 } },
          { a: { x: rightX, y: 352 }, b: { x: 232 - out, y: 508 } },
          { a: { x: 266, y: 118 }, b: { x: 266, y: 428 } },
          { a: { x: 266, y: 118 }, b: { x: 304, y: 78 } },
          { a: { x: 304, y: 78 }, b: { x: 304, y: 428 } },
          { a: { x: 266, y: 428 }, b: { x: 304, y: 428 } },
        ];
    const tight = toys.tightIn ? 32 : 0;
    walls.push(
      { a: { x: 48 + tight, y: 338 }, b: { x: 78 + tight, y: 424 } },
      { a: { x: 238 - tight, y: 338 }, b: { x: 208 - tight, y: 424 } }
    );
    if (kind === "spinner") {
      /* Forced center chute — the spinner is a lane, not a sticker. */
      walls.push(
        { a: { x: 124, y: 68 }, b: { x: 124, y: 176 } },
        { a: { x: 180, y: 68 }, b: { x: 180, y: 176 } },
        { a: { x: 124, y: 176 }, b: { x: 136, y: 204 } },
        { a: { x: 180, y: 176 }, b: { x: 168, y: 204 } }
      );
    }
    if (kind === "sink") {
      walls.push(
        { a: { x: 48, y: 128 }, b: { x: 118, y: 208 } },
        { a: { x: 236, y: 128 }, b: { x: 186, y: 208 } },
        { a: { x: 48, y: 344 }, b: { x: 118, y: 264 } },
        { a: { x: 236, y: 344 }, b: { x: 186, y: 264 } }
      );
    }
    if (kind === "storm") {
      /* Bumper cage — the storm is a different sport, not five stickers on parade glass. */
      walls.push(
        { a: { x: 88, y: 118 }, b: { x: 112, y: 138 } },
        { a: { x: 216, y: 118 }, b: { x: 192, y: 138 } },
        { a: { x: 96, y: 258 }, b: { x: 118, y: 278 } },
        { a: { x: 208, y: 258 }, b: { x: 186, y: 278 } }
      );
    }
    if (kind === "ramp") {
      /* Ramp Carnival left shelf — second floor. Not Fever's wide deck. */
      const sh = shelfGeom(spec);
      if (sh) {
        walls.push(
          { a: { x: sh.x0, y: sh.yFloor }, b: { x: sh.x1, y: sh.yFloor } },
          { a: { x: sh.x1, y: sh.yFloor }, b: { x: sh.x1, y: sh.yFloor - 22 } },
          { a: { x: sh.x1, y: sh.yFloor - 22 }, b: { x: sh.x0, y: sh.yFloor - 22 } },
          { a: { x: sh.retX0, y: sh.retY0 }, b: { x: sh.retX1, y: sh.retY1 } }
        );
      }
    }
    if (toys.bonus) {
      walls.push(
        { a: { x: 196, y: 70 }, b: { x: 262, y: 70 } },
        { a: { x: 262, y: 70 }, b: { x: 262, y: 168 } },
        { a: { x: 196, y: 168 }, b: { x: 262, y: 168 } },
        { a: { x: 196, y: 70 }, b: { x: 196, y: 108 } }
      );
    }
    if (kind === "gate") {
      /* Upper mini-flip terrace — a new control surface, not the same glass. Low gap is the entry. */
      walls.push(
        { a: { x: 72, y: 188 }, b: { x: 196, y: 188 } },
        { a: { x: 72, y: 188 }, b: { x: 72, y: 112 } },
        { a: { x: 72, y: 112 }, b: { x: 196, y: 112 } },
        { a: { x: 72, y: 188 }, b: { x: 46, y: 252 } }
      );
    }
    if (kind === "thorns") {
      walls.push(
        { a: { x: 28, y: 400 }, b: { x: 48, y: 448 } },
        { a: { x: 258, y: 400 }, b: { x: 238, y: 448 } }
      );
    }
    if (fever) {
      /* Combo mesh: peaked fever deck + return-pocket spinner + sink well. Not Parade open triangle. */
      const sh = shelfGeom(spec);
      if (sh) {
        walls.push(
          { a: { x: sh.x0, y: sh.yFloor }, b: { x: sh.x1, y: sh.yFloor } },
          { a: { x: sh.x1, y: sh.yFloor }, b: { x: sh.x1, y: sh.yFloor - 22 } },
          { a: { x: sh.x1, y: sh.yFloor - 22 }, b: { x: sh.x0, y: sh.yFloor - 22 } },
          { a: { x: sh.retX0, y: sh.retY0 }, b: { x: sh.retX1, y: sh.retY1 } }
        );
      }
      walls.push(
        { a: { x: 208, y: 176 }, b: { x: 208, y: 244 } },
        { a: { x: 254, y: 184 }, b: { x: 254, y: 244 } },
        { a: { x: 208, y: 244 }, b: { x: 220, y: 262 } },
        { a: { x: 254, y: 244 }, b: { x: 242, y: 262 } },
        { a: { x: 88, y: 308 }, b: { x: 132, y: 342 } },
        { a: { x: 216, y: 308 }, b: { x: 172, y: 342 } },
        { a: { x: 118, y: 248 }, b: { x: 138, y: 268 } },
        { a: { x: 186, y: 248 }, b: { x: 166, y: 268 } }
      );
    }
    return walls;
  }

  function attractSpec() {
    return chapterSpec(((idleRoom - 1) % AUTHORED_COUNT) + 1) || AUTHORED_CHAPTERS[0];
  }

  function walls() {
    return tableWalls(run && run.spec ? run.spec : attractSpec());
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
      if (idleClock > 3800) {
        idleClock = 0;
        idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
      }
      draw();
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }

  function makeBumpers(spec) {
    return (spec.bumpers || []).map((b, i) => ({
      x: b.x, y: b.y, r: b.r, hue: b.hue,
      flash: 0, lock: 0, hit: false, id: i,
    }));
  }

  function makeRollovers(spec) {
    if (spec && (spec.kind === "fever" || spec.coda)) {
      return [
        { x: 72, y: 372, r: 7, on: false },
        { x: 152, y: 358, r: 7, on: false },
        { x: 216, y: 372, r: 7, on: false },
      ];
    }
    return [
      { x: 90, y: 132, r: 7, on: false },
      { x: 152, y: 122, r: 7, on: false },
      { x: 214, y: 132, r: 7, on: false },
    ];
  }

  function circleSeg(cx, cy, r, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((cx - x1) * dx + (cy - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    const nx = cx - px;
    const ny = cy - py;
    const d = Math.hypot(nx, ny) || 0.0001;
    return { hit: d < r, d, nx: nx / d, ny: ny / d, px, py, t };
  }

  function bounce(ball, nx, ny, rest, extra) {
    const vn = ball.vx * nx + ball.vy * ny;
    if (vn < 0) {
      ball.vx -= (1 + rest) * vn * nx;
      ball.vy -= (1 + rest) * vn * ny;
    }
    if (extra) {
      ball.vx += nx * extra;
      ball.vy += ny * extra;
    }
    const cap = 13.6 * (run ? run.spec.speed : 1);
    const sp = Math.hypot(ball.vx, ball.vy);
    if (sp > cap) {
      ball.vx = (ball.vx / sp) * cap;
      ball.vy = (ball.vy / sp) * cap;
    }
  }

  function flipperGeom(side, angle) {
    if (side === "L") {
      const pivot = { x: 76, y: 450 };
      const len = 66;
      return {
        pivot,
        tip: { x: pivot.x + Math.cos(angle) * len, y: pivot.y + Math.sin(angle) * len },
      };
    }
    const pivot = { x: 210, y: 450 };
    const len = 66;
    return {
      pivot,
      tip: { x: pivot.x + Math.cos(angle) * len, y: pivot.y + Math.sin(angle) * len },
    };
  }

  function missionReset(spec) {
    const n = (spec.bumpers || []).length;
    return {
      bumpers: Array.from({ length: n }, () => false),
      spinner: 0,
      sink: 0,
      combo: 0,
      ramp: false,
      gateOpen: false,
      bonus: 0,
      phase: spec.mission.id === "alt" || spec.mission.id === "chain" ? spec.mission.id === "alt" ? "spinner" : "ramp" : "",
      need: spec.mission.id,
    };
  }

  function missionText(m, spec) {
    const id = spec.mission.id;
    if (id === "bumpers") return `Bumpers ${m.bumpers.filter(Boolean).length}/${m.bumpers.length}`;
    if (id === "spinner") return `Spinner ${m.spinner}/3`;
    if (id === "sink") return `Sink ${m.sink}/2`;
    if (id === "combo") return `Combo ${m.combo}/5`;
    if (id === "gate") return `Gate ${m.gateOpen ? "OPEN" : "shut"} · bonus ${m.bonus}/2`;
    if (id === "alt") return m.phase === "sink" ? "Sink next" : "Spinner first";
    if (id === "chain") {
      if (m.phase === "ramp") return "Chain: ramp";
      if (m.phase === "spinner") return "Chain: spinner";
      return "Chain: sink";
    }
    return `Ramp ${m.ramp ? "✓" : "·"}  Sink ${m.sink}/1`;
  }

  function missionDone(m, spec) {
    const id = spec.mission.id;
    if (id === "bumpers") return m.bumpers.length > 0 && m.bumpers.every(Boolean);
    if (id === "spinner") return m.spinner >= 3;
    if (id === "sink") return m.sink >= 2;
    if (id === "combo") return m.combo >= 5;
    if (id === "gate") return m.gateOpen && m.bonus >= 2;
    if (id === "alt") return m.phase === "done";
    if (id === "chain") return m.phase === "done";
    return m.ramp && m.sink >= 1;
  }

  function card() {
    return $("pinballCard");
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
    let rkHud = host.querySelector(".pinball-rk-hud");
    if (!rkHud) {
      rkHud = document.createElement("p");
      rkHud.className = "pinball-rk-hud";
      rkHud.setAttribute("aria-live", "polite");
      if (readout && readout.parentNode) readout.parentNode.insertBefore(rkHud, readout.nextSibling);
      else host.appendChild(rkHud);
    }
    rkHud.setAttribute("data-runkit-hud", GAME_ID);
    paintKitHud(run && run.spec);
    const canvas = $("pinballCanvas");
    if (canvas) {
      canvas.style.pointerEvents = "auto";
      canvas.classList.toggle("is-locked", !isLive());
    }
    if ((!run || run.done) && host.classList.contains("is-vestibule") && $("pinballStatus")) {
      $("pinballStatus").textContent = DEPTH_COPY.status;
    }
  }

  function wantedFlip() {
    const L = keys.L || [...pointers.values()].includes("L");
    const R = keys.R || [...pointers.values()].includes("R");
    return { L, R };
  }

  function draw() {
    const canvas = $("pinballCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (run) run.shake = kit.applyShake(ctx, run.shake || 0);

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#241028");
    g.addColorStop(0.35, "#160b14");
    g.addColorStop(1, "#0a0608");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#1a1024";
    ctx.fillRect(16, 8, 288, 64);
    ctx.strokeStyle = "#d4a45a";
    ctx.strokeRect(16.5, 8.5, 287, 63);
    const ch = run ? run.spec.ch : idleRoom;
    const depth = run ? run.cleared : 0;
    const juice = run ? (run.juice || 0) : 0;
    const blink = 0.45 + Math.sin(performance.now() / 220) * 0.45;
    const lamps = Math.min(12, Math.max(8, ch));
    for (let i = 0; i < lamps; i += 1) {
      ctx.beginPath();
      ctx.arc(36 + i * 18, 22, juice > 0 && i < ch ? 6.2 : 5, 0, Math.PI * 2);
      ctx.fillStyle = i < ch ? (juice > 0 ? "#fff6ec" : "#e8a0b8") : "#3a2430";
      ctx.globalAlpha = i < ch ? 0.4 + blink * 0.6 : 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (juice > 0) {
      ctx.fillStyle = `rgba(232,160,184,${Math.min(0.28, juice / 2400)})`;
      ctx.fillRect(16, 8, 288, 56);
    }
    ctx.fillStyle = "#f0d09a";
    ctx.font = "12px Georgia, serif";
    ctx.fillText(run ? hudChapter(run.spec) : hudChapter(attractSpec()), 24, 50);
    ctx.font = "10px Georgia, serif";
    ctx.fillStyle = "#e8a0b8";
    ctx.fillText(run ? roomTell(run.spec) : roomTell(attractSpec()), 24, 62);

    ctx.strokeStyle = "rgba(212,164,90,0.6)";
    ctx.lineWidth = 3;
    walls().forEach((w) => {
      ctx.beginPath();
      ctx.moveTo(w.a.x, w.a.y);
      ctx.lineTo(w.b.x, w.b.y);
      ctx.stroke();
    });

    const flareKind = (run && run.spec && run.spec.kind) || attractSpec().kind;
    const flareFever = flareKind === "fever" || flareKind === "coda";
    const flareOut = flareKind === "spinner" ? 34 : flareKind === "storm" ? -28 : flareKind === "thorns" ? 18 : flareKind === "ramp" ? 10 : flareKind === "gate" ? 8 : flareKind === "parade" ? -22 : flareFever ? 28 : 4;
    const flareL = flareKind === "storm" ? 52 : flareKind === "spinner" ? 18 : flareKind === "parade" ? 36 : flareFever ? 14 : 20;
    const flareR = flareKind === "storm" ? 234 : flareKind === "spinner" ? 266 : flareKind === "parade" ? 248 : flareFever ? 270 : 266;
    ctx.fillStyle = "rgba(196,30,58,0.22)";
    ctx.beginPath();
    ctx.moveTo(flareL, 352);
    ctx.lineTo(54 + flareOut, 508);
    ctx.lineTo(flareL, 508);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(flareR, 352);
    ctx.lineTo(232 - flareOut, 508);
    ctx.lineTo(flareR, 508);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e8a0b8";
    ctx.font = "10px Georgia, serif";
    ctx.fillText("out", flareL + 4, 430);
    ctx.fillText("out", Math.min(246, flareR - 20), 430);
    const toys = (run && run.spec && run.spec.toys) || attractSpec().toys;
    if (toys.posts || toys.thorns) {
      ctx.fillStyle = toys.thorns ? "#c41e3a" : "#d4a45a";
      ctx.beginPath();
      ctx.arc(58, 398, toys.thorns ? 9 : 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(228, 398, toys.thorns ? 9 : 8, 0, Math.PI * 2);
      ctx.fill();
    }
    if (toys.thorns) {
      ctx.fillStyle = "#8a2030";
      [{ x: 38, y: 448 }, { x: 248, y: 448 }, { x: 62, y: 412 }, { x: 224, y: 412 }].forEach((p) => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 12);
        ctx.lineTo(p.x + 7, p.y + 9);
        ctx.lineTo(p.x - 7, p.y + 9);
        ctx.closePath();
        ctx.fill();
      });
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "8px Georgia, serif";
      ctx.fillText("SAVE/DOOM", 22, 392);
      ctx.fillText("SAVE/DOOM", 232, 392);
    }

    if (toys.slings) {
      const tight = toys.tightIn ? 16 : 0;
      ctx.strokeStyle = "#c41e3a";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(40 + tight, 348);
      ctx.lineTo(72 + tight, 418);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(246 - tight, 348);
      ctx.lineTo(214 - tight, 418);
      ctx.stroke();
    }

    const specNow = (run && run.spec) || attractSpec();
    if (toys.upperShelf) {
      const sh = shelfGeom(specNow);
      if (sh) {
        ctx.fillStyle = isFeverTable(specNow) ? "rgba(232,160,184,0.22)" : "rgba(212,164,90,0.22)";
        ctx.fillRect(sh.x0, sh.yTop, sh.x1 - sh.x0, sh.yFloor - sh.yTop);
        ctx.strokeStyle = isFeverTable(specNow) ? "#e8a0b8" : "#d4a45a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sh.x0, sh.yFloor);
        ctx.lineTo(sh.x1, sh.yFloor);
        ctx.stroke();
        ctx.fillStyle = isFeverTable(specNow) ? "rgba(232,160,184,0.5)" : "rgba(212,164,90,0.5)";
        ctx.fillRect(sh.x0, sh.yFloor - 12, sh.x1 - sh.x0, 12);
        ctx.strokeStyle = "rgba(184,232,224,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sh.retX0, sh.retY0);
        ctx.lineTo(sh.retX1, sh.retY1);
        ctx.stroke();
        ctx.fillStyle = "#f0d09a";
        ctx.font = "9px Georgia, serif";
        ctx.fillText(sh.label, sh.x0 + 8, sh.yTop + 16);
        ctx.fillText("RETURN", sh.retX0 + 8, sh.retY0 + 28);
      }
    }

    if (specNow.kind === "parade") {
      ctx.fillStyle = "rgba(240,208,154,0.1)";
      ctx.fillRect(44, 78, 196, 86);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("OPEN GLASS · TRIANGLE ONLY · NOT FEVER", 40, 98);
      ctx.strokeStyle = "rgba(240,208,154,0.5)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 7; i += 1) {
        ctx.beginPath();
        ctx.ellipse(285, 398 - i * 10, 7.5 - i * 0.25, 3.6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#f0d09a";
      ctx.fillText("PLUNGER", 266, 322);
    }
    if (specNow.kind === "spinner") {
      ctx.fillStyle = "rgba(240,208,154,0.16)";
      ctx.fillRect(124, 68, 56, 108);
      ctx.strokeStyle = "rgba(240,208,154,0.75)";
      ctx.lineWidth = 2;
      ctx.strokeRect(124, 68, 56, 108);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("SPIN LANE", 128, 84);
    }
    if (isFeverTable(specNow)) {
      ctx.fillStyle = "rgba(196,30,58,0.08)";
      ctx.fillRect(14, 68, 256, 360);
      ctx.fillStyle = "rgba(232,160,184,0.16)";
      ctx.fillRect(208, 176, 46, 68);
      ctx.strokeStyle = "rgba(232,160,184,0.85)";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(208, 176, 46, 68);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("FEVER · RETURN SPIN", 196, 170);
      ctx.fillText("SINK WELL", 124, 300);
    }
    if (specNow.kind === "storm") {
      ctx.strokeStyle = "rgba(196,30,58,0.45)";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(100, 126, 104, 122);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("STORM CAGE", 122, 122);
    }

    if (toys.ramp) {
      const rp = specNow.ramp || { x0: 20, y0: 62, x1: 128, y1: 136 };
      ctx.strokeStyle = "rgba(184,232,224,0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rp.x0 + 10, rp.y1 - 6);
      ctx.quadraticCurveTo(rp.x0 + 18, rp.y0 - 4, rp.x1 - 18, rp.y0 + 22);
      ctx.stroke();
      ctx.fillStyle = "rgba(184,232,224,0.85)";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("RAMP", rp.x0 + 16, rp.y0 + 10);
    }

    if (toys.spinner && (specNow.spinner || (run && run.spec && run.spec.spinner))) {
      const spin = specNow.spinner || { x: 152, y: 156 };
      const spinA = run ? run.spinAngle : 0;
      ctx.save();
      ctx.translate(spin.x, spin.y);
      ctx.rotate(spinA);
      ctx.strokeStyle = "#f0d09a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(12, 0);
      ctx.moveTo(0, -12);
      ctx.lineTo(0, 12);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#f0d09a";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("SPIN", spin.x - 12, spin.y - 16);
    }

    if (toys.sink) {
      const sink = specNow.sink || { x: 152, y: 236 };
      ctx.beginPath();
      ctx.arc(sink.x, sink.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = run && run.sinkFlash > 0 ? "#fff6ec" : "#0a0508";
      ctx.fill();
      ctx.strokeStyle = "#b8e8e0";
      ctx.stroke();
      ctx.fillStyle = "#b8e8e0";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("SINK", sink.x - 12, sink.y + 24);
    }

    if (toys.gate) {
      const open = run && run.mission && run.mission.gateOpen;
      ctx.strokeStyle = open ? "rgba(184,232,224,0.35)" : "#e8a0b8";
      ctx.lineWidth = open ? 1.5 : 5;
      ctx.beginPath();
      ctx.moveTo(196, 108);
      ctx.lineTo(196, open ? 124 : 148);
      ctx.stroke();
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "9px Georgia, serif";
      ctx.fillText(open ? "GATE OPEN" : "GATE · MINI-FLIP OPENS", 178, 102);
    }

    if (toys.bonus) {
      ctx.strokeStyle = "rgba(232,160,184,0.7)";
      ctx.strokeRect(198, 72, 62, 88);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("BONUS", 210, 88);
    }

    if (toys.upperFlip) {
      const ang = run ? run.angleU : 0.2;
      const pivot = { x: 152, y: 156 };
      const tip = { x: pivot.x + Math.cos(ang) * 42, y: pivot.y + Math.sin(ang) * 42 };
      ctx.fillStyle = "rgba(184,232,224,0.12)";
      ctx.fillRect(72, 112, 124, 76);
      ctx.fillStyle = "#b8e8e0";
      ctx.font = "8px Georgia, serif";
      ctx.fillText("MINI-FLIP · TAP BOTH", 78, 124);
      ctx.strokeStyle = "#b8e8e0";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(pivot.x, pivot.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
    }

    if (toys.rollovers) {
      const rolls = run && run.rollovers ? run.rollovers : makeRollovers(specNow);
      rolls.forEach((r) => {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.fillStyle = r.on ? "#fff6ec" : "rgba(184,232,224,0.35)";
        ctx.fill();
        ctx.strokeStyle = "#b8e8e0";
        ctx.stroke();
      });
    }

    const bumps = run ? run.bumpers : makeBumpers(attractSpec());
    bumps.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = b.flash > 0 ? "#fff6ec" : b.hue;
      ctx.globalAlpha = b.flash > 0 ? 0.95 : 0.78;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = b.hit ? "#fff6ec" : "rgba(255,246,236,0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    const lAng = run ? run.angleL : 0.4;
    const rAng = run ? run.angleR : Math.PI - 0.4;
    [["L", lAng], ["R", rAng]].forEach(([side, ang]) => {
      const f = flipperGeom(side, ang);
      ctx.strokeStyle = "#f0d09a";
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(f.pivot.x, f.pivot.y);
      ctx.lineTo(f.tip.x, f.tip.y);
      ctx.stroke();
      ctx.fillStyle = "#d4a45a";
      ctx.beginPath();
      ctx.arc(f.pivot.x, f.pivot.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    if (run && run.ball) {
      const b = run.ball;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = "#fff6ec";
      ctx.fill();
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (run && run.juice > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.92, run.juice / 380);
      ctx.fillStyle = "#fff6ec";
      ctx.font = "bold 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(`CHAPTER ${depth}`, W / 2, 248);
      ctx.font = "12px Georgia, serif";
      ctx.fillStyle = "#f0d09a";
      ctx.fillText(depth >= 4 ? AURA.deep(depth) : AURA.chapter, W / 2, 272);
      ctx.restore();
    }

    if (run && run.done && (run.deathNote === "drain" || run.deathNote === "outlane")) {
      kit.stampClosed(ctx, W, H, "DRAIN");
    }

    if (run && !run.done) {
      ctx.fillStyle = "rgba(12,6,9,0.72)";
      ctx.fillRect(8, H - 52, W - 16, 44);
      ctx.strokeStyle = "rgba(212,164,90,0.55)";
      ctx.strokeRect(8.5, H - 51.5, W - 17, 43);
      ctx.fillStyle = "#ffe6a6";
      ctx.font = "bold 15px Georgia, serif";
      ctx.fillText(hudChapter(run.spec), 16, H - 32);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "11px Georgia, serif";
      ctx.fillText(`${roomTell(run.spec)} · ${run.score} · ${missionText(run.mission, run.spec)}`, 16, H - 16);
      const m = run.mission;
      const pipN = run.spec.mission.id === "bumpers" ? (m.bumpers || []).length
        : run.spec.mission.id === "spinner" ? 3
        : run.spec.mission.id === "sink" ? 2
        : run.spec.mission.id === "combo" ? 5
        : run.spec.mission.id === "gate" ? 3
        : run.spec.mission.id === "alt" || run.spec.mission.id === "chain" ? 3
        : 2;
      const pipOn = (i) => {
        const id = run.spec.mission.id;
        if (id === "bumpers") return !!(m.bumpers && m.bumpers[i]);
        if (id === "spinner") return m.spinner > i;
        if (id === "sink") return m.sink > i;
        if (id === "combo") return m.combo > i;
        if (id === "gate") return i === 0 ? m.gateOpen : m.bonus > i - 1;
        if (id === "alt") return (m.phase === "sink" && i === 0) || m.phase === "done";
        if (id === "chain") {
          if (i === 0) return m.phase !== "ramp";
          if (i === 1) return m.phase === "sink" || m.phase === "done";
          return m.phase === "done";
        }
        return i === 0 ? m.ramp : m.sink > 0;
      };
      for (let i = 0; i < pipN; i += 1) {
        ctx.beginPath();
        ctx.arc(W - 18 - (pipN - 1 - i) * 12, H - 34, 4, 0, Math.PI * 2);
        ctx.fillStyle = pipOn(i) ? "#b8e8e0" : "rgba(240,208,154,0.2)";
        ctx.fill();
      }
    } else if (!run || !run.done) {
      kit.drawHud(ctx, W, DEPTH_COPY.idleHud);
    }
  }

  function launch(fromPlunger) {
    const speed = -10.6 * (0.9 + 0.1 * run.spec.speed);
    run.ball = {
      x: fromPlunger ? 284 : 152,
      y: fromPlunger ? 390 : 140,
      vx: fromPlunger ? -0.05 : (Math.random() * 0.5 - 0.25),
      vy: speed,
      r: BALL_R,
    };
    run.safe = 900;
    run.born = performance.now();
    run.rampLock = 400;
  }

  function beginKitRun() {
    if (typeof PF.spendDemoCoin === "function") {
      if (!PF.spendDemoCoin(GAME_ID)) return null;
    }
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      try {
        const ctx = PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1, feverNode: true });
        if (ctx) return ctx;
      } catch (_) { /* fall through to local ctx */ }
    }
    return {
      gameId: GAME_ID,
      startedAt: Date.now(),
      feverNode: true,
      feverGate: null,
      depth: 0,
      score: 0,
      strikes: 0,
      alive: true,
    };
  }

  function qaStartAt() {
    const kitRun = rk();
    const n = kitRun && kitRun._qaStart && (kitRun._qaStart[GAME_ID] | 0);
    if (kitRun && kitRun._qaStart) kitRun._qaStart[GAME_ID] = 0;
    return n >= 1 ? n : 1;
  }

  function start() {
    if (run && !run.done) return;
    stopIdle();
    declareP0();
    const kitRun = beginKitRun();
    if (!kitRun) {
      $("pinballStatus").textContent = "Out of demo coins · grant a pass";
      PF.refreshNightBoard();
      stampDepthCopy();
      startIdle();
      return;
    }
    const spec = chapterSpec(qaStartAt());
    if (!spec) {
      stampDepthCopy();
      startIdle();
      return;
    }
    run = {
      done: false,
      ctx: kitRun,
      kitRun,
      spec,
      score: 0,
      cleared: 0,
      bumpers: makeBumpers(spec),
      rollovers: spec.toys && spec.toys.rollovers ? makeRollovers(spec) : [],
      mission: missionReset(spec),
      angleU: 0.2,
      prevU: 0.2,
      wantU: false,
      rollT: 0,
      bonusLock: 0,
      ball: null,
      angleL: 0.4,
      angleR: Math.PI - 0.4,
      prevL: 0.4,
      prevR: Math.PI - 0.4,
      wantL: false,
      wantR: false,
      last: 0,
      acc: 0,
      raf: 0,
      shake: 0,
      spinAngle: 0,
      sinkFlash: 0,
      sinkLock: 0,
      rampLock: 0,
      liveAcc: 0,
      liveBonus: 0,
      deathNote: "",
      safe: 0,
      fanfare: 0,
      pendingFlip: [],
      wantChapter: false,
      slingLock: 0,
      flipGrace: 0,
      juice: 0,
      laneBias: 0,
      onShelf: false,
    };
    pointers.clear();
    $("pinballStart").disabled = true;
    $("pinballStart").hidden = true;
    $("pinballVerdict").hidden = true;
    kit.hideResult("pinballResult");
    PF.setTier("pinballTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    $("pinballStatus").textContent = `${hudChapter(spec)} — ${spec.barker}`;
    paintKitHud(spec);
    PF.focusCard("pinballCard", true);
    PF.setAura("think");
    if (rk() && typeof rk().reportDepth === "function") {
      rk().reportDepth(kitRun, spec.ch || spec.id, { name: spec.name, coda: !!spec.coda });
    }
    launch(true);
    const loop = (now) => {
      if (!run || run.done) return;
      if (!run.last) run.last = now;
      const dt = Math.min(32, now - run.last);
      run.last = now;
      run.acc += dt;
      while (run.acc >= STEP) {
        physics(STEP);
        run.acc -= STEP;
      }
      draw();
      PF.refreshDepth();
      run.raf = requestAnimationFrame(loop);
    };
    run.raf = requestAnimationFrame(loop);
  }

  function queueFlip(side, down) {
    if (!run || run.done) return;
    const delay = run.spec.drunk ? 30 : 0;
    if (!delay) {
      run[side === "L" ? "wantL" : "wantR"] = down;
      return;
    }
    setTimeout(() => {
      if (!run || run.done) return;
      run[side === "L" ? "wantL" : "wantR"] = down;
    }, delay);
  }

  function syncWanted() {
    const w = wantedFlip();
    if (!run.spec.drunk) {
      run.wantL = w.L;
      run.wantR = w.R;
    }
  }

  function addScore(n) {
    run.score += n;
    const ctx = run.kitRun || run.ctx;
    if (ctx) ctx.score = run.score;
  }

  function juiceChapter(n) {
    run.fanfare = 520;
    run.juice = 680;
    run.shake = Math.min(16, 8 + n);
    run.safe = Math.max(run.safe || 0, 1100);
    const ctx = run.kitRun || run.ctx;
    if (ctx && rk() && typeof rk().reportDepth === "function") {
      rk().reportDepth(ctx, run.spec.ch || run.spec.id, { name: run.spec.name, coda: !!run.spec.coda });
    }
    kit.sfx("chapter");
    PF.setAura("celebrate");
    const line = n >= 4 ? AURA.deep(n) : AURA.chapter;
    $("pinballStatus").textContent = `${hudChapter(run.spec)} CLEAR · +${1000 * n}. ${line} Plunge.`;
    if (typeof PF.showBanner === "function") {
      PF.showBanner(true, `CHAPTER ${n}`, line);
    }
  }

  function onBumper(b) {
    if (b.lock > 0) return;
    addScore(run.spec.bumper);
    b.flash = 140;
    b.lock = 160;
    b.hit = true;
    run.mission.bumpers[b.id] = true;
    run.mission.combo += 1;
    kit.sfx("bumper");
    run.shake = 3;
    $("pinballStatus").textContent = `Bumper +${run.spec.bumper} · ${missionText(run.mission, run.spec)}`;
    checkChapter();
  }

  function onSpinner() {
    run.mission.spinner += 1;
    run.mission.combo = 0;
    addScore(40);
    kit.sfx("spinner");
    if (run.mission.need === "alt" && run.mission.phase === "spinner") run.mission.phase = "sink";
    if (run.mission.need === "chain" && run.mission.phase === "spinner") run.mission.phase = "sink";
    $("pinballStatus").textContent = `Spinner · ${missionText(run.mission, run.spec)}`;
    checkChapter();
  }

  function onSink() {
    const sink = run.spec.sink || { x: 152, y: 298 };
    run.mission.sink += 1;
    run.mission.combo = 0;
    addScore(250);
    run.sinkFlash = 220;
    kit.sfx("sinkhole");
    if (run.mission.need === "alt" && run.mission.phase === "sink") run.mission.phase = "done";
    if (run.mission.need === "chain" && run.mission.phase === "sink") run.mission.phase = "done";
    $("pinballStatus").textContent = `Sink · ${missionText(run.mission, run.spec)}`;
    if (run.ball) {
      run.ball.x = sink.x;
      run.ball.y = sink.y;
      run.ball.vx = 0;
      run.ball.vy = 0;
      run.sinkLock = 320;
    }
    checkChapter();
  }

  function onRamp() {
    run.mission.ramp = true;
    run.mission.combo = 0;
    addScore(350);
    kit.sfx("chapter");
    run.rampLock = 360;
    if (run.mission.need === "chain" && run.mission.phase === "ramp") run.mission.phase = "spinner";
    if (run.ball) {
      const sh = shelfGeom(run.spec);
      if (sh) {
        run.ball.x = (sh.x0 + sh.x1) * 0.42;
        run.ball.y = sh.yFloor - 26;
        run.ball.vx = isFeverTable(run.spec) ? 3.8 : 3.2;
        run.ball.vy = 1.15;
        run.onShelf = true;
      } else {
        run.ball.x = 118;
        run.ball.y = 110;
        run.ball.vx = 3.2;
        run.ball.vy = 2.2;
      }
    }
    $("pinballStatus").textContent = `Ramp · ${missionText(run.mission, run.spec)}`;
    checkChapter();
  }

  function checkChapter() {
    if (!run || run.done) return;
    if (!missionDone(run.mission, run.spec)) return;
    run.wantChapter = true;
  }

  function clearChapter() {
    if (!run || run.done) return;
    const bonus = 1000 * run.spec.ch;
    addScore(bonus);
    run.cleared += 1;
    if (run.spec.ch >= AUTHORED_COUNT && !run.spec.coda && !codaOn()) {
      juiceChapter(run.cleared);
      finish("souvenir");
      return;
    }
    const next = chapterSpec(run.spec.ch + 1);
    if (!next) {
      juiceChapter(run.cleared);
      finish("souvenir");
      return;
    }
    run.spec = next;
    run.mission = missionReset(next);
    run.bumpers = makeBumpers(next);
    run.rollovers = next.toys && next.toys.rollovers ? makeRollovers(next) : [];
    run.onShelf = false;
    juiceChapter(run.cleared);
    paintKitHud(run.spec);
    launch(true);
  }

  function collideFlipper(ball, side, angle, omega, want) {
    const f = flipperGeom(side, angle);
    const hit = circleSeg(ball.x, ball.y, ball.r + 5.5, f.pivot.x, f.pivot.y, f.tip.x, f.tip.y);
    if (!hit.hit) return false;
    ball.x = hit.px + hit.nx * (ball.r + 5.8);
    ball.y = hit.py + hit.ny * (ball.r + 5.8);
    const rising = side === "L" ? Math.max(0, -omega) : Math.max(0, omega);
    const extra = (want ? rising * 16 : 0) + (want ? 1.35 : 0.15);
    bounce(ball, hit.nx, hit.ny, 0.52, extra);
    if (want && extra > 1.4) kit.sfx("flip");
    run.flipGrace = 90;
    return true;
  }

  function physics(dt) {
    const k = dt / 16;
    syncWanted();
    run.prevL = run.angleL;
    run.prevR = run.angleR;
    const tL = run.wantL ? -0.66 : 0.4;
    const tR = run.wantR ? Math.PI + 0.66 : Math.PI - 0.4;
    run.angleL += (tL - run.angleL) * Math.min(1, 0.5 * k);
    run.angleR += (tR - run.angleR) * Math.min(1, 0.5 * k);
    const omegaL = (run.angleL - run.prevL) / Math.max(0.001, k);
    const omegaR = (run.angleR - run.prevR) / Math.max(0.001, k);
    run.bumpers.forEach((b) => {
      b.flash = Math.max(0, b.flash - dt);
      b.lock = Math.max(0, b.lock - dt);
    });
    run.sinkFlash = Math.max(0, run.sinkFlash - dt);
    run.sinkLock = Math.max(0, run.sinkLock - dt);
    run.rampLock = Math.max(0, run.rampLock - dt);
    run.safe = Math.max(0, run.safe - dt);
    run.fanfare = Math.max(0, run.fanfare - dt);
    run.juice = Math.max(0, (run.juice || 0) - dt);
    run.flipGrace = Math.max(0, run.flipGrace - dt);
    run.slingLock = Math.max(0, (run.slingLock || 0) - dt);
    run.bonusLock = Math.max(0, (run.bonusLock || 0) - dt);

    const ball = run.ball;
    if (!ball) return;
    if (run.sinkLock > 0) {
      if (run.sinkLock < 40) {
        ball.vy = -7.4;
        ball.vx = (Math.random() - 0.5) * 2.6;
      }
      return;
    }

    const g = 0.155 * run.spec.speed;
    ball.vy += g * k;
    ball.vx *= Math.pow(0.9991, k);
    ball.vy *= Math.pow(0.9991, k);
    ball.x += ball.vx * k;
    ball.y += ball.vy * k;

    run.liveAcc += dt;
    if (run.liveAcc >= 10000) {
      run.liveAcc -= 10000;
      run.liveBonus += 1;
      addScore(50);
    }

    walls().forEach((w) => {
      const hit = circleSeg(ball.x, ball.y, ball.r + 2.2, w.a.x, w.a.y, w.b.x, w.b.y);
      if (hit.hit) {
        ball.x = hit.px + hit.nx * (ball.r + 2.4);
        ball.y = hit.py + hit.ny * (ball.r + 2.4);
        bounce(ball, hit.nx, hit.ny, 0.62, 0);
      }
    });

    const toys = run.spec.toys || {};
    if (toys.slings) {
      const tight = toys.tightIn ? 16 : 0;
      [[40 + tight, 348, 72 + tight, 418], [246 - tight, 348, 214 - tight, 418]].forEach((s) => {
        const hit = circleSeg(ball.x, ball.y, ball.r + 4, s[0], s[1], s[2], s[3]);
        if (hit.hit) {
          ball.x = hit.px + hit.nx * (ball.r + 4.4);
          ball.y = hit.py + hit.ny * (ball.r + 4.4);
          bounce(ball, hit.nx, hit.ny, 0.92, 3.2);
          if (run.slingLock === 0) {
            run.mission.combo = 0;
            kit.sfx("sling");
            addScore(25);
            run.slingLock = 90;
          }
        }
      });
    }

    const posts = [];
    if (toys.posts) posts.push({ x: 58, y: 398, r: 9, thorn: false }, { x: 228, y: 398, r: 9, thorn: false });
    if (toys.thorns) posts.push(
      { x: 38, y: 448, r: 11, thorn: true },
      { x: 248, y: 448, r: 11, thorn: true },
      { x: 62, y: 412, r: 10, thorn: true },
      { x: 224, y: 412, r: 10, thorn: true }
    );
    posts.forEach((p) => {
      const dx = ball.x - p.x;
      const dy = ball.y - p.y;
      const d = Math.hypot(dx, dy) || 0.0001;
      const min = ball.r + p.r;
      if (d < min) {
        const nx = dx / d;
        const ny = dy / d;
        ball.x = p.x + nx * (min + 0.5);
        ball.y = p.y + ny * (min + 0.5);
        if (p.thorn) {
          const fromInside = p.x < W / 2 ? ball.x > p.x : ball.x < p.x;
          if (fromInside) {
            bounce(ball, nx, ny, 1.05, 2.8);
            ball.vx += (p.x < W / 2 ? 2.2 : -2.2);
            ball.vy -= 1.1;
            $("pinballStatus").textContent = "Thorn SAVE — bounced in.";
          } else {
            bounce(ball, nx, ny, 0.42, 0.2);
            ball.vx += (p.x < W / 2 ? -2.4 : 2.4);
            ball.vy += 0.8;
            $("pinballStatus").textContent = "Thorn DOOM — toward the outlane.";
          }
        } else {
          bounce(ball, nx, ny, 0.85, 0.9);
        }
      }
    });

    if (toys.upperShelf) {
      const sh = shelfGeom(run.spec);
      if (sh) {
        const hit = circleSeg(ball.x, ball.y, ball.r + 2.2, sh.x0, sh.yFloor, sh.x1, sh.yFloor);
        if (hit.hit) {
          ball.x = hit.px + hit.nx * (ball.r + 2.4);
          ball.y = hit.py + hit.ny * (ball.r + 2.4);
          bounce(ball, hit.nx, hit.ny, 0.55, 0);
        }
        if (ball.x > sh.x0 + 2 && ball.x < sh.x1 && ball.y > sh.yTop && ball.y < sh.yFloor) {
          run.onShelf = true;
          if (ball.vy > 0 && ball.y > sh.yFloor - 14) {
            ball.y = sh.yFloor - 14 - ball.r;
            ball.vy = -Math.abs(ball.vy) * 0.28;
            ball.vx *= 0.84;
          }
        }
        if (ball.y < sh.yFloor + 12 && ball.x > sh.retX0 && ball.x < sh.retX1 + 8 && ball.vy > 0.08) {
          run.onShelf = false;
          ball.vx += 0.85 * k;
          ball.vy += 0.18 * k;
        } else if (run.onShelf && ball.x > sh.x0 + 2 && ball.x < sh.x1 - 12 && ball.y > sh.yFloor + 10 && ball.y < sh.yFloor + 130 && ball.vy > 0.2) {
          run.onShelf = false;
          run.deathNote = "upper_drain";
          $("pinballStatus").textContent = "Missed the return — upper drain.";
          drain();
          return;
        }
      }
    }

    if (toys.gate && run.mission && !run.mission.gateOpen) {
      const hit = circleSeg(ball.x, ball.y, ball.r + 2.4, 196, 108, 196, 148);
      if (hit.hit) {
        ball.x = hit.px + hit.nx * (ball.r + 2.6);
        ball.y = hit.py + hit.ny * (ball.r + 2.6);
        bounce(ball, hit.nx, hit.ny, 0.7, 0);
      }
    }

    if (toys.bonus && run.mission && run.mission.gateOpen && run.bonusLock === 0) {
      const fromFlip = toys.upperFlip && run.wantU;
      if (ball.x > 198 && ball.x < 260 && ball.y > 74 && ball.y < 158 && (fromFlip || ball.vx > 1.4)) {
        run.mission.bonus += 1;
        run.bonusLock = 420;
        addScore(200);
        kit.sfx("chapter");
        $("pinballStatus").textContent = `Bonus lane · ${missionText(run.mission, run.spec)}`;
        checkChapter();
      }
    }

    run.bumpers.forEach((b) => {
      const dx = ball.x - b.x;
      const dy = ball.y - b.y;
      const d = Math.hypot(dx, dy) || 0.0001;
      const min = ball.r + b.r;
      if (d < min) {
        const nx = dx / d;
        const ny = dy / d;
        ball.x = b.x + nx * (min + 0.7);
        ball.y = b.y + ny * (min + 0.7);
        bounce(ball, nx, ny, 1.12, 2.05);
        onBumper(b);
      }
    });

    if (toys.spinner && run.spec.spinner) {
      const sp = run.spec.spinner;
      const near = Math.hypot(ball.x - sp.x, ball.y - sp.y) < 22;
      const rushing = isFeverTable(run.spec)
        ? Math.hypot(ball.vx, ball.vy) > 1.35
        : Math.abs(ball.vy) > 1.1;
      if (near && rushing) {
        run.spinAngle += (isFeverTable(run.spec) ? ball.vx : ball.vy) * 0.25;
        if (!run._spinGate) {
          run._spinGate = true;
          onSpinner();
        }
      } else {
        run._spinGate = false;
      }
    }

    if (toys.sink && run.spec.sink) {
      const sink = run.spec.sink;
      const sinkD = Math.hypot(ball.x - sink.x, ball.y - sink.y);
      if (sinkD < 12 && Math.hypot(ball.vx, ball.vy) < 6.2 && run.sinkLock === 0) {
        onSink();
      }
    }

    if (toys.ramp && run.spec.ramp && run.rampLock === 0) {
      const rp = run.spec.ramp;
      const x1 = rp.x1 != null ? rp.x1 : rp.x0 + 52;
      if (ball.x > rp.x0 && ball.x < x1 - 8 && ball.y > rp.y0 && ball.y < rp.y1 && ball.vy < -1.15) {
        onRamp();
      }
    }

    if (toys.rollovers && run.rollovers) {
      run.rollT = (run.rollT || 0) + dt;
      if (run.rollT > 2500) {
        run.rollT = 0;
        const xs = run.rollovers.map((r) => r.x);
        run.rollovers.forEach((r, i) => {
          r.x = xs[(i + 1) % xs.length];
          r.on = false;
        });
        run.laneBias = (run.laneBias || 0) === 1 ? -1 : 1;
        $("pinballStatus").textContent = run.laneBias < 0 ? "Rollovers shuffled — left outlane hungry." : "Rollovers shuffled — right outlane hungry.";
      }
      run.rollovers.forEach((r) => {
        if (r.on) return;
        if (Math.hypot(ball.x - r.x, ball.y - r.y) < r.r + ball.r) {
          r.on = true;
          addScore(30);
        }
      });
    }

    if (toys.upperFlip) {
      run.wantU = !!(run.wantL && run.wantR);
      run.prevU = run.angleU || 0.2;
      const tU = run.wantU ? -0.7 : 0.35;
      run.angleU += (tU - run.angleU) * Math.min(1, 0.5 * k);
      const uf = { x: 152, y: 156 };
      const tip = { x: uf.x + Math.cos(run.angleU) * 42, y: uf.y + Math.sin(run.angleU) * 42 };
      const hit = circleSeg(ball.x, ball.y, ball.r + 5, uf.x, uf.y, tip.x, tip.y);
      if (hit.hit) {
        ball.x = hit.px + hit.nx * (ball.r + 5.2);
        ball.y = hit.py + hit.ny * (ball.r + 5.2);
        bounce(ball, hit.nx, hit.ny, 0.5, run.wantU ? 2.6 : 0.2);
        if (toys.gate && run.mission && !run.mission.gateOpen && run.wantU) {
          run.mission.gateOpen = true;
          kit.sfx("chapter");
          $("pinballStatus").textContent = "MINI-FLIP opened the gate — bonus lane live.";
          checkChapter();
        }
      }
    }

    collideFlipper(ball, "L", run.angleL, omegaL, run.wantL);
    collideFlipper(ball, "R", run.angleR, omegaR, run.wantR);

    if (ball.x > 266 && ball.y < 150) {
      if (ball.y < 128 || ball.vy < -3.5) {
        ball.x = 198;
        ball.y = Math.min(ball.y, 118);
        ball.vx = -3.4 * (0.9 + 0.1 * run.spec.speed);
        ball.vy = 2.2;
      }
    }

    const pull = (run.spec.outPull || 0) + (run.laneBias ? 0.02 : 0);
    if (pull) {
      const leftHungry = !run.laneBias || run.laneBias < 0;
      const rightHungry = !run.laneBias || run.laneBias > 0;
      if (leftHungry && ball.x < 62 && ball.y > 360) ball.vx -= pull * k * 6;
      if (rightHungry && ball.x > 224 && ball.x < 266 && ball.y > 360) ball.vx += pull * k * 6;
    }

    if (ball.x < 8) { ball.x = 8; ball.vx = Math.abs(ball.vx) * 0.7; }
    if (ball.x > W - 8) { ball.x = W - 8; ball.vx = -Math.abs(ball.vx) * 0.7; }
    const roof = isFeverTable(run.spec) ? 38 : 64;
    if (ball.y < roof) { ball.y = roof; ball.vy = Math.abs(ball.vy) * 0.7; }

    if (run.wantChapter) {
      run.wantChapter = false;
      clearChapter();
      return;
    }
    if (run.safe > 0 || run.flipGrace > 0) return;
    const inOutL = ball.x < 66 && ball.y > 438;
    const inOutR = ball.x > 220 && ball.x < 266 && ball.y > 438;
    if (inOutL || inOutR) {
      run.deathNote = "outlane";
      drain();
      return;
    }
    if (ball.y > H - 6 || (ball.y > 478 && ball.x > 84 && ball.x < 202)) {
      run.deathNote = "drain";
      drain();
    }
  }

  function drain() {
    if (!run || run.done) return;
    kit.sfx("drain");
    run.shake = 9;
    finish("drain");
  }

  function auraFor(reason) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (run.deathNote === "upper_drain") return AURA.upper;
    if (run.spec && run.spec.coda) return AURA.coda;
    if (run.spec.drunk) return AURA.drunk;
    const n = run.cleared;
    if (n >= 4) return AURA.deep(n);
    return AURA.drain;
  }

  function revealResult(shot) {
    const reason = shot.reason;
    const chapter = shot.chapter;
    const score = shot.score;
    const aura = shot.aura;
    $("pinballStart").disabled = false;
    $("pinballStart").hidden = false;
    $("pinballStart").textContent = "PLAY AGAIN · 1 demo coin";
    PF.focusCard("pinballCard", false);
    kit.setMode(card(), "result");
    const line = `CHAPTER ${chapter} · SCORE ${score}`;
    $("pinballVerdict").hidden = false;
    $("pinballVerdict").textContent = reason === "leave"
      ? `Left the table · ${line}`
      : reason === "souvenir"
        ? `Souvenir. ${line}.`
        : `Drained. ${line}.`;
    kit.fillResult({
      root: "pinballResult",
      depth: "pinballResultDepth",
      score: "pinballResultScore",
      aura: "pinballResultAura",
      copied: "pinballCopied",
    }, {
      depthLine: reason === "souvenir" ? `CHAPTER ${chapter} · SOUVENIR` : `CHAPTER ${chapter}`,
      scoreLine: `SCORE ${score}`,
      auraLine: aura,
    });
    const chEl = $("pinballChallengeText");
    if (chEl) chEl.textContent = challengeLine(chapter);
    PF.setTier("pinballTier", chapter > 0 ? `CHAPTER ${chapter}` : "DRAIN", chapter > 0 ? "perfect" : "miss");
    $("pinballStatus").textContent = reason === "leave"
      ? "Left the table."
      : reason === "souvenir"
        ? "Authored table over."
        : "Drain. One ball, one night.";
    const ok = chapter > 0 || score >= 300;
    if (ok) {
      PF.award(Math.max(10, Math.floor(score / 20)), true, "Pinball");
      PF.setAura(chapter >= 3 ? "celebrate" : "point");
      if (reason !== "leave") PF.showBanner(true, `CHAPTER ${chapter}`, `${score} · ${aura}`);
    } else {
      PF.award(0, false, "Pinball drain");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "DRAIN", aura);
    }
    PF.refreshNightBoard();
    stampDepthCopy();
    draw();
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    if (run.raf) cancelAnimationFrame(run.raf);
    pointers.clear();
    const chapter = run.cleared;
    const score = run.score;
    const shot = {
      reason,
      chapter,
      score,
      aura: auraFor(reason),
    };
    persistDepth({
      depth: chapter,
      score,
      deathReason: reason === "leave" ? "leave" : reason === "souvenir" ? "souvenir" : (run.deathNote || "drain"),
      cashedOut: reason === "souvenir",
      meta: { note: run.deathNote || reason, room: run.spec && run.spec.name, coda: !!(run.spec && run.spec.coda) },
    });
    stampDepthCopy();
    draw();
    if (reason === "leave" || reason === "souvenir") {
      revealResult(shot);
      return;
    }
    setTimeout(() => revealResult(shot), 720);
  }

  function pointerSide(canvas, ev) {
    const p = kit.canvasPos(canvas, ev, W, H);
    return p.x < W / 2 ? "L" : "R";
  }

  PF.registerVendor({
    id: "pinball",
    playKey: "pinball",
    chalk: "One ball. How many chapters?",
    defaults: { bestPinballBalls: 0, bestPinballCh: 0, bestPinballScore: 0 },
    onLeave() { if (run && !run.done) finish("leave"); },
    onShow() { declareP0(); stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      pointers.clear();
      keys.L = false;
      keys.R = false;
      if ($("pinballVerdict")) $("pinballVerdict").hidden = true;
      kit.hideResult("pinballResult");
      if ($("pinballStart")) {
        $("pinballStart").disabled = false;
        $("pinballStart").hidden = false;
        $("pinballStart").textContent = "START · 1 demo coin";
      }
      kit.setMode(card(), "vestibule");
      stampDepthCopy();
      startIdle();
    },
    refreshDepth(state) {
      const b = $("depthPinballBalls");
      if (b) b.textContent = run && !run.done ? String(run.score) : "0";
      const ch = $("depthPinballCh");
      if (ch) ch.textContent = run && !run.done ? hudChapter(run.spec) : "CHAPTER 0";
      const bb = $("depthPinballBestB");
      if (bb) bb.textContent = state.bestPinballScore ? String(state.bestPinballScore) : "—";
      const bc = $("depthPinballBestCh");
      const bestCh = Math.max(state.bestPinballCh || 0, (state.bestDepth && state.bestDepth.pinball) || 0);
      if (bc) bc.textContent = bestCh ? String(bestCh) : "—";
    },
    bind() {
      declareP0();
      const startBtn = $("pinballStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const canvas = $("pinballCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            punchStart();
            return;
          }
          ev.preventDefault();
          try { canvas.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
          const side = pointerSide(canvas, ev);
          pointers.set(ev.pointerId, side);
          queueFlip(side, true);
        });
        const release = (ev) => {
          const side = pointers.get(ev.pointerId);
          pointers.delete(ev.pointerId);
          if (side) queueFlip(side, false);
        };
        canvas.addEventListener("pointerup", release);
        canvas.addEventListener("pointercancel", release);
      }
      window.addEventListener("keydown", (ev) => {
        if (!isLive()) return;
        if (ev.repeat) return;
        if (ev.code === "ArrowLeft" || ev.code === "KeyA" || ev.code === "KeyZ") {
          ev.preventDefault();
          keys.L = true;
          queueFlip("L", true);
        }
        if (ev.code === "ArrowRight" || ev.code === "KeyL" || ev.code === "KeyD" || ev.code === "Slash") {
          ev.preventDefault();
          keys.R = true;
          queueFlip("R", true);
        }
        if (ev.code === "Space") {
          ev.preventDefault();
          keys.L = true;
          keys.R = true;
          queueFlip("L", true);
          queueFlip("R", true);
        }
      });
      window.addEventListener("keyup", (ev) => {
        if (ev.code === "ArrowLeft" || ev.code === "KeyA" || ev.code === "KeyZ") {
          keys.L = false;
          queueFlip("L", false);
        }
        if (ev.code === "ArrowRight" || ev.code === "KeyL" || ev.code === "KeyD" || ev.code === "Slash") {
          keys.R = false;
          queueFlip("R", false);
        }
        if (ev.code === "Space") {
          keys.L = false;
          keys.R = false;
          queueFlip("L", false);
          queueFlip("R", false);
        }
      });
      const copyBtn = $("pinballChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = (PF.getState().lastRun && PF.getState().lastRun.game === GAME_ID)
            ? PF.getState().lastRun.depth
            : (PF.getState().bestPinballCh || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const el = $("pinballCopied");
            if (el) el.hidden = false;
            $("pinballStatus").textContent = "Copied — send it";
          }, () => {
            $("pinballStatus").textContent = text;
          });
        });
      }
      stampDepthCopy();
      startIdle();
    },
  });
})();
