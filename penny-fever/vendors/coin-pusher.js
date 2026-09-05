/* Coin Pusher Shelf — Desktop Grok owns this file. PF only. Never booth/port 6000.
 * GOBLIN HIT #3 FEEL 2026-09-05 — C1–C6 authored FLOOR rooms, not a hotter sweeper.
 * Split = seam pit. Pit Mouth = V. Double Sweep = two punches.
 * Trapdoor = MARK hatch → WAIT countdown → SHUDDER lid-lift → DUMP lane. Cash screams the scare.
 * GreedFloor · depthUnit: Floor · cashOut · codaEnabled hybrid ENDLESS after Avalanche Gallery (Aura-flippable). */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { $, kit } = PF;
  const W = 340;
  const H = 440;
  const LANES = 5;
  const MAX_COINS = 110;
  const LIP_Y = 318;
  const TRAY_Y = 372;
  const PLATE_H = 26;
  const GAME_ID = "coinpusher";
  const CODA_ENABLED = true;
  const AUTHORED_COUNT = 7;
  let run = null;
  let idleRaf = 0;
  let idleRoom = 1;
  let idleClock = 0;

  const AURA = {
    cash: "Aura: Smart jingle. Depth sticks.",
    cashDeep: (n) => `Aura: Floor ${n} and you walked. Barker respects that.`,
    buried: "Aura: The shelf ate your night. Greedy.",
    empty: "Aura: You watched it all fall in the pit.",
    greed: "Aura: One more drop, you said.",
    souvenir: "Aura: Avalanche Gallery walked. Souvenir — the glass salutes.",
    coda: "Aura: Authored greed’s over. ENDLESS — pit widens.",
    leave: "Aura: Left the glass. The pennies stay.",
  };

  const P0_MOUNT = {
    engine: "GreedFloor",
    displayName: "Coin Pusher Shelf",
    depthUnit: "Floor",
    sheet: "GOBLIN_BATCH01_BUILD_SHEETS.md",
    authoredSheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
    cashOut: true,
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  /* Authored FLOOR rooms — shelf geometry / cadence / event. Not “faster sweeper, tinier pit.”
   * bankTarget stays ~8 then ~12; coda is where the pile grows. Pusher speed does not climb. */
  const AUTHORED_FLOORS = [
    { id: 1, name: "Glass Nursery", kind: "nursery", lanes: 3, bankTarget: 8, pusherSpeed: 0.52, pitW: 8, seamW: 0, lipHang: 0, vHalf: 0, buried: false, doublePush: false, avalanche: 0, seam: false, overhang: false, vMouth: false, trapdoor: false, kickers: false, travel: 148, barker: "Wide shelf. Narrow pit. Learn DROP → tray." },
    { id: 2, name: "Split Shelf", kind: "split", lanes: 5, bankTarget: 12, pusherSpeed: 0.52, pitW: 14, seamW: 118, lipHang: 0, vHalf: 0, buried: true, doublePush: false, avalanche: 0, seam: true, overhang: false, vMouth: false, trapdoor: false, kickers: false, travel: 188, barker: "Two ledges. Center seam eats coins." },
    { id: 3, name: "Overhang Tease", kind: "overhang", lanes: 5, bankTarget: 12, pusherSpeed: 0.52, pitW: 16, seamW: 0, lipHang: 96, vHalf: 0, buried: true, doublePush: false, avalanche: 0, seam: false, overhang: true, vMouth: false, trapdoor: false, kickers: false, travel: 206, barker: "Lip hangs. Near-falls tease." },
    { id: 4, name: "Double Sweep", kind: "doublesweep", lanes: 5, bankTarget: 12, pusherSpeed: 0.52, pitW: 16, seamW: 0, lipHang: 0, vHalf: 0, buried: true, doublePush: true, avalanche: 0, seam: false, overhang: false, vMouth: false, trapdoor: false, kickers: false, travel: 68, barker: "Two short pushes. Decide faster." },
    { id: 5, name: "Pit Mouth", kind: "pitmouth", lanes: 5, bankTarget: 12, pusherSpeed: 0.52, pitW: 8, seamW: 0, lipHang: 0, vHalf: 108, buried: true, doublePush: false, avalanche: 0, seam: false, overhang: false, vMouth: true, trapdoor: false, kickers: false, travel: 188, barker: "V-mouth under center. Sides are safer." },
    { id: 6, name: "Trapdoor Floor", kind: "trapdoor", lanes: 5, bankTarget: 12, pusherSpeed: 0.52, pitW: 16, seamW: 0, lipHang: 0, vHalf: 0, buried: true, doublePush: false, avalanche: 0, seam: false, overhang: false, vMouth: false, trapdoor: true, kickers: false, travel: 188, barker: "Hatch marks a lane. It shivers. The lid lifts. Then it dumps. Cash or watch." },
    { id: 7, name: "Avalanche Gallery", kind: "avalanche", lanes: 5, bankTarget: 12, pusherSpeed: 0.52, pitW: 20, seamW: 0, lipHang: 56, vHalf: 0, buried: true, doublePush: false, avalanche: 0.42, seam: false, overhang: true, vMouth: false, trapdoor: false, kickers: true, travel: 214, barker: "Tall stacks. Kickers. Greed peak." },
  ];
  const PUSHER_LEVELS = AUTHORED_FLOORS;

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 7 authored FLOORS · ENDLESS coda · cash out or greed",
    body: "Authored rooms, not a faster sweeper: Glass Nursery → Split Shelf → Overhang Tease → Double Sweep → Pit Mouth → Trapdoor Floor → Avalanche Gallery. After 7, ENDLESS coda (flaggable). Empty shelf after Floor 1 is death.",
    status: "Depth run · START · 1 demo coin · 7 authored FLOORS then ENDLESS",
    machine: "Penny ledge · 1 demo coin · authored FLOORS",
    idleHud: ["Authored FLOORS — greed vs the pit", "DROP · CASH OUT · START"],
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

  function codaFloor(n) {
    const t = Math.max(0, n - AUTHORED_COUNT);
    const vMouth = t % 3 === 2;
    const seam = t % 3 === 1;
    return {
      id: n,
      name: `Greed Coda ${n}`,
      kind: "coda",
      lanes: 5,
      bankTarget: 24 + t * 4,
      pusherSpeed: 0.52,
      pitW: Math.min(96, 28 + t * 8),
      seamW: seam ? 70 : 0,
      lipHang: 36,
      vHalf: vMouth ? 132 : 0,
      buried: true,
      doublePush: t % 2 === 1,
      avalanche: 0.42,
      seam,
      overhang: true,
      vMouth,
      trapdoor: t % 2 === 0,
      kickers: true,
      travel: t % 2 === 1 ? 86 : 210,
      coda: true,
      barker: "ENDLESS — pit widens. Avalanche on. Cash out or get buried.",
    };
  }

  function pusherFloor(n) {
    const floor = Math.max(1, n | 0);
    if (floor <= AUTHORED_COUNT) return Object.assign({ coda: false }, AUTHORED_FLOORS[floor - 1]);
    if (!codaOn()) return null;
    return codaFloor(floor);
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun) return;
    const spec = Object.assign({
      authored: AUTHORED_FLOORS,
      authoredCount: AUTHORED_COUNT,
      cashOut: true,
      codaEnabled: CODA_ENABLED,
      codaParams: codaFloor,
      level: pusherFloor,
      stageParams: pusherFloor,
      PUSHER_LEVELS,
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

  function mountEngine(ctx) {
    const greed = rk() && rk().engines && rk().engines.GreedFloor;
    if (!greed || typeof greed.mount !== "function" || !ctx) return null;
    try {
      return greed.mount(card(), {
        cashOut: true,
        stageParams: pusherFloor,
        doAction() {},
        evaluate() { return { risk: 0, gain: 0 }; },
        canCashOut() { return !!(run && run.awaiting && !run.done); },
        deathRule() { return false; },
      }, ctx);
    } catch (_) {
      return null;
    }
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

  function isLive() {
    return !!(run && !run.done && run.kitRun && run.kitRun.alive !== false);
  }

  function punchStart() {
    stampDepthCopy();
    const el = $("pusherStatus");
    if (el) el.textContent = DEPTH_COPY.punch;
    const btn = $("pusherStart");
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
      deathReason: partial.deathReason || "buried",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
      state.bestPusherM = Math.max(state.bestPusherM || 0, payload.depth);
      state.bestPusherFloor = Math.max(state.bestPusherFloor || 0, payload.depth);
      if (partial.banked != null) {
        state.bestPusherCoins = Math.max(state.bestPusherCoins || 0, partial.banked | 0);
      }
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function challengeLine(n) {
    return `Beat my Coin Pusher floor ${n | 0} on Penny Fever`;
  }

  function hudFloor(spec) {
    if (!spec) return "FLOOR";
    if (spec.coda) return `ENDLESS · FLOOR ${spec.floor} · ${spec.name}`;
    return `FLOOR ${spec.floor} · ${spec.name}`;
  }

  function paintKitHud(spec) {
    const host = card();
    if (!host) return;
    const hud = host.querySelector(".pusher-rk-hud");
    if (!hud) return;
    if (!spec || !run || run.done) {
      hud.textContent = "";
      return;
    }
    hud.textContent = hudFloor(spec);
  }

  function roomTell(spec) {
    if (!spec) return "GREED VS THE PIT";
    if (spec.kind === "nursery") return "NURSERY · NO BURY YET";
    if (spec.kind === "split" || spec.seam) return "TWO LEDGES · SEAM EATS";
    if (spec.kind === "overhang" || spec.overhang) return spec.kickers ? "KICKERS · TALL STACKS" : "LIP HANGS PAST SAFE";
    if (spec.kind === "doublesweep" || spec.doublePush) return "TWO SHORT PUSHES";
    if (spec.kind === "pitmouth" || spec.vMouth) return "V-MOUTH · SIDES SAFER";
    if (spec.kind === "trapdoor" || spec.trapdoor) return "HATCH · SHUDDER · DUMP";
    if (spec.kind === "avalanche" || spec.kickers) return "AVALANCHE · BACK-WALL KICKERS";
    if (spec.coda) return "ENDLESS · PIT WIDENS";
    return "GREED VS THE PIT";
  }

  function floorSpec(n) {
    const f = Math.max(1, n | 0);
    const p = pusherFloor(f);
    if (!p) return null;
    return {
      floor: f,
      id: p.id || f,
      name: p.name,
      title: p.name,
      kind: p.kind,
      lanes: p.lanes || 5,
      bank: p.bankTarget,
      speed: Math.min(0.0044, 0.00215 * (p.pusherSpeed || 0.52)),
      pitW: p.pitW != null ? p.pitW : 38 + (p.pitWiden || 0) * 42,
      seamW: p.seamW || (p.seam ? 118 : 0),
      lipHang: p.lipHang != null ? p.lipHang : (p.overhang ? 96 : 0),
      vHalf: p.vHalf || (p.vMouth ? 108 : 0),
      pit: p.pitWiden || 0,
      doublePush: !!p.doublePush,
      avalanche: typeof p.avalanche === "number" ? p.avalanche : (p.avalanche ? 0.28 : 0),
      seam: !!p.seam,
      overhang: !!p.overhang,
      vMouth: !!p.vMouth,
      trapdoor: !!p.trapdoor,
      kickers: !!p.kickers,
      buried: p.buried !== false,
      travel: Math.min(214, p.travel || (LIP_Y - 92 - 28)),
      coda: !!p.coda,
      barker: p.barker || "",
    };
  }

  function laneCount() {
    return (run && run.spec && run.spec.lanes) || 5;
  }

  function idleCoins() {
    const spec = floorSpec(((idleRoom - 1) % AUTHORED_COUNT) + 1);
    const n = spec.lanes;
    const coins = [];
    for (let i = 0; i < 10; i += 1) {
      coins.push(makeCoin(i % n, LIP_Y - 18 - (i % 3) * 16, true, n));
    }
    return coins;
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

  function makeCoin(lane, y, stacked, n) {
    return {
      lane,
      x: laneX(lane, n) + (Math.random() - 0.5) * 6,
      y,
      r: 11,
      vy: stacked ? 0 : 0.4,
      falling: !stacked,
      gone: "",
      flash: 0,
    };
  }

  function laneX(lane, n) {
    const lanes = n || laneCount();
    const left = 44;
    const span = W - 88;
    return left + (span * (lane + 0.5)) / lanes;
  }

  function shelfCoins(coins) {
    return coins.filter((c) => !c.gone);
  }

  function pitWidth(spec) {
    if (spec.pitW != null) return spec.pitW;
    return 38 + (spec.pit || 0) * 42;
  }

  function seamHalf(spec) {
    return Math.max(10, (spec.seamW || 36) / 2);
  }

  function card() {
    return $("pusherCard");
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
    let rkHud = host.querySelector(".pusher-rk-hud");
    if (!rkHud) {
      rkHud = document.createElement("p");
      rkHud.className = "pusher-rk-hud";
      rkHud.setAttribute("aria-live", "polite");
      if (readout && readout.parentNode) readout.parentNode.insertBefore(rkHud, readout.nextSibling);
      else host.appendChild(rkHud);
    }
    rkHud.setAttribute("data-runkit-hud", GAME_ID);
    paintKitHud(run && run.spec);
    const canvas = $("pusherCanvas");
    if (canvas) {
      canvas.style.pointerEvents = "auto";
      canvas.classList.toggle("is-locked", !isLive());
    }
    if ((!run || run.done) && host.classList.contains("is-vestibule") && $("pusherStatus")) {
      $("pusherStatus").textContent = DEPTH_COPY.status;
    }
  }

  function qaStartAt() {
    const kitRun = rk();
    const n = kitRun && kitRun._qaStart && (kitRun._qaStart[GAME_ID] | 0);
    if (kitRun && kitRun._qaStart) kitRun._qaStart[GAME_ID] = 0;
    return n >= 1 ? n : 1;
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

  function plateYNow() {
    if (!run) return 86;
    if (run.spec && run.spec.doublePush) {
      const cycle = 2400;
      const t = (run.sweepT || 0) % cycle;
      const short = Math.min(96, run.spec.travel || 88);
      let u = 0;
      if (t < 520) u = t / 520;
      else if (t < 760) u = 1;
      else if (t < 1080) u = 1 - ((t - 760) / 320) * 0.58;
      else if (t < 1600) u = 0.42 + ((t - 1080) / 520) * 0.58;
      else if (t < 1840) u = 1;
      else u = 1 - (t - 1840) / 560;
      return 88 + kit.clamp(u, 0, 1) * short;
    }
    return 88 + ((Math.sin(run.phase) + 1) / 2) * run.spec.travel;
  }

  function trapdoorShuddering() {
    return !!(run && !run.done && run.trapdoorPhase === "shudder");
  }

  function trapdoorThreatening() {
    return !!(run && !run.done && (run.trapdoorPhase === "mark" || run.trapdoorPhase === "wait" || run.trapdoorPhase === "shudder"));
  }

  function paintScream() {
    const settle = !!(run && run.awaiting);
    const scare = trapdoorThreatening();
    const on = settle || scare;
    const cash = $("pusherCash");
    if (cash) {
      cash.classList.toggle("cash-scream", on);
      if (scare && !run.done) {
        cash.hidden = false;
        cash.disabled = false;
      }
    }
    const greedCash = $("pusherGreedCash");
    if (greedCash) greedCash.classList.toggle("cash-scream", on);
    const again = $("pusherDropAgain");
    if (again) again.classList.toggle("cash-scream", settle);
  }

  function setGreed(on, rescued) {
    const el = $("pusherGreed");
    if (!el) return;
    el.hidden = !on;
    const n = $("pusherGreedN");
    if (n) n.textContent = String(rescued || 0);
    const cash = $("pusherCash");
    if (cash) {
      cash.disabled = !run || run.done || (run.busy && !on && !trapdoorThreatening());
    }
    const drop = $("pusherDrop");
    if (drop) drop.disabled = !run || run.done || run.busy || on;
    paintScream();
  }

  function draw() {
    const canvas = $("pusherCanvas");
    const ctx = kit.prepCtx(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (run) run.shake = kit.applyShake(ctx, run.shake || 0);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1a1020");
    bg.addColorStop(1, "#0c080c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    kit.fillWood(ctx, 16, 28, W - 32, H - 52);
    ctx.fillStyle = "#14080c";
    ctx.fillRect(24, 64, W - 48, 300);
    ctx.strokeStyle = "#d4a45a";
    ctx.strokeRect(24.5, 64.5, W - 49, 299);

    ctx.fillStyle = "rgba(180,220,230,0.07)";
    ctx.fillRect(26, 66, W - 52, 70);

    const spec = run ? run.spec : floorSpec(((idleRoom - 1) % AUTHORED_COUNT) + 1);
    const py = run ? run.plateY : 88;
    ctx.fillStyle = "#6a4a28";
    ctx.fillRect(28, py, W - 56, PLATE_H);
    ctx.strokeStyle = "#f0d09a";
    ctx.strokeRect(28.5, py + 0.5, W - 57, PLATE_H - 1);
    ctx.fillStyle = "rgba(240,208,154,0.4)";
    ctx.fillRect(28, py + 20, W - 56, 6);

    ctx.fillStyle = "#3a2418";
    const hang = spec.lipHang || (spec.overhang ? 22 : 0);
    const lipH = hang ? 14 + hang * 0.45 : 14;
    if (spec.seam) {
      const half = seamHalf(spec);
      ctx.fillRect(24, LIP_Y, W / 2 - half - 24, lipH);
      ctx.fillRect(W / 2 + half, LIP_Y, W - 24 - (W / 2 + half), lipH);
      ctx.fillStyle = "#d4a45a";
      ctx.fillRect(24, LIP_Y + lipH - 4, W / 2 - half - 24, 4);
      ctx.fillRect(W / 2 + half, LIP_Y + lipH - 4, W - 24 - (W / 2 + half), 4);
    } else {
      ctx.fillRect(24, LIP_Y, W - 48, lipH);
      ctx.fillStyle = "#d4a45a";
      ctx.fillRect(24, LIP_Y + lipH - 4, W - 48, 4);
    }
    if (spec.overhang || hang) {
      ctx.fillStyle = "rgba(240,208,154,0.32)";
      ctx.fillRect(28, LIP_Y - 10, W - 56, 14);
      ctx.fillStyle = "rgba(196,30,58,0.22)";
      ctx.fillRect(28, LIP_Y + 10, W - 56, 12 + hang * 0.35);
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("OVERHANG", W / 2 - 28, LIP_Y + 8);
    }

    const nLanes = spec.lanes || 5;
    const laneW = nLanes === 3 ? 42 : 32;
    for (let i = 0; i < nLanes; i += 1) {
      const lx = laneX(i, nLanes);
      ctx.fillStyle = nLanes === 3 ? "rgba(184,232,224,0.14)" : "rgba(240,208,154,0.12)";
      ctx.fillRect(lx - laneW / 2, 72, laneW, LIP_Y - 72);
      ctx.fillStyle = "rgba(240,208,154,0.45)";
      ctx.font = "9px Georgia, serif";
      ctx.fillText(String(i + 1), lx - 3, 82);
    }
    if (spec.kind === "nursery" || nLanes === 3) {
      ctx.fillStyle = "#b8e8e0";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("NURSERY · 3 WIDE LANES", 96, 96);
    }
    if (spec.doublePush) {
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("DOUBLE SWEEP · TWO PUNCHES", 92, 96);
    }

    if (spec.seam) {
      const half = seamHalf(spec);
      ctx.fillStyle = "#120406";
      ctx.fillRect(W / 2 - half, 66, half * 2, TRAY_Y - 58);
      ctx.fillStyle = "#1a0708";
      ctx.fillRect(W / 2 - half - 4, LIP_Y - 12, half * 2 + 8, 72);
      ctx.strokeStyle = "#c41e3a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - half, 70);
      ctx.lineTo(W / 2 - half, LIP_Y + 20);
      ctx.moveTo(W / 2 + half, 70);
      ctx.lineTo(W / 2 + half, LIP_Y + 20);
      ctx.stroke();
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "9px Georgia, serif";
      ctx.fillText("SEAM PIT", W / 2 - 24, 92);
      ctx.fillText("LEFT LEDGE", 40, 108);
      ctx.fillText("RIGHT LEDGE", W - 96, 108);
    }

    if (spec.trapdoor) {
      const lane = (run && run.trapdoorLane >= 0) ? run.trapdoorLane : 2;
      const tx = laneX(lane, spec.lanes) - 24;
      const phase = (run && run.spec && run.spec.trapdoor) ? (run.trapdoorPhase || "mark") : "mark";
      const u = (phase === "shudder" && run && run.trapdoorT > 0) ? 1 - kit.clamp(run.trapdoorT / 1600, 0, 1) : (phase === "open" || (run && run.trapdoorDone) ? 1 : 0);
      const j = phase === "shudder" ? Math.sin(performance.now() / 22) * (6 + u * 5) : ((phase === "mark" || phase === "wait") ? Math.sin(performance.now() / 150) * 1.6 : 0);
      ctx.fillStyle = phase === "shudder" ? "rgba(196,30,58,0.62)" : (phase === "wait" || phase === "mark") ? "rgba(196,30,58,0.32)" : "rgba(196,30,58,0.16)";
      ctx.fillRect(tx - 2 + j * 0.2, 78, 52, LIP_Y - 78);
      ctx.fillStyle = phase === "shudder" ? "#fff6ec" : "#c41e3a";
      ctx.font = "9px Georgia, serif";
      const label = phase === "open" || (run && run.trapdoorDone) ? "OPEN" : phase === "shudder" ? "SHIVERS" : phase === "wait" ? "HATCH" : "MARKED";
      ctx.fillText(label, tx + 2, 96);
      if (phase === "wait" && run && run.trapdoorT > 0) {
        const sec = Math.max(1, Math.ceil(run.trapdoorT / 1000));
        ctx.fillStyle = "#ffe6a6";
        ctx.font = "11px Georgia, serif";
        ctx.fillText(String(sec), tx + 18, 114);
      }
      if (phase === "open" || (run && run.trapdoorDone && run.trapdoorLane >= 0)) {
        ctx.fillStyle = "#050203";
        ctx.fillRect(tx + 4, LIP_Y - 18, 40, 52);
        ctx.strokeStyle = "#c41e3a";
        ctx.lineWidth = 2;
        ctx.strokeRect(tx + 4.5, LIP_Y - 17.5, 39, 51);
        ctx.fillStyle = "#e8a0b8";
        ctx.font = "8px Georgia, serif";
        ctx.fillText("DUMPED", tx + 2, LIP_Y + 44);
      } else {
        ctx.save();
        ctx.translate(tx + 24 + j, LIP_Y - 2);
        ctx.rotate(-u * 0.85);
        ctx.fillStyle = phase === "shudder" ? "#8a2030" : "#5a2a20";
        ctx.fillRect(-24, -14, 48, 16);
        ctx.strokeStyle = phase === "shudder" ? "#fff6ec" : "#c41e3a";
        ctx.lineWidth = phase === "shudder" ? 3 : 1.8;
        ctx.strokeRect(-23.5, -13.5, 47, 15);
        ctx.fillStyle = "#e8a0b8";
        ctx.font = "8px Georgia, serif";
        ctx.fillText(phase === "shudder" ? "LID" : "HATCH", -16, -2);
        ctx.restore();
        ctx.fillStyle = "#e8a0b8";
        ctx.font = "8px Georgia, serif";
        ctx.fillText(phase === "shudder" ? "CASH OR WATCH" : "TRAPDOOR", tx - 8, LIP_Y + 22);
      }
    }

    if (spec.kickers) {
      ctx.fillStyle = "#8a6230";
      ctx.beginPath();
      ctx.moveTo(36, 96);
      ctx.lineTo(68, 142);
      ctx.lineTo(36, 142);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(W - 36, 96);
      ctx.lineTo(W - 68, 142);
      ctx.lineTo(W - 36, 142);
      ctx.fill();
    }

    const pw = pitWidth(spec);
    ctx.fillStyle = "#1a0708";
    ctx.fillRect(24, TRAY_Y - 8, pw, 48);
    ctx.fillRect(W - 24 - pw, TRAY_Y - 8, pw, 48);
    if (spec.vMouth) {
      const vh = spec.vHalf || 86;
      ctx.fillStyle = "#1a0708";
      ctx.beginPath();
      ctx.moveTo(W / 2 - vh, LIP_Y - 18);
      ctx.lineTo(W / 2, TRAY_Y + 48);
      ctx.lineTo(W / 2 + vh, LIP_Y - 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#c41e3a";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = "#e8a0b8";
      ctx.font = "10px Georgia, serif";
      ctx.fillText("V-MOUTH · CENTER DIES", W / 2 - 58, TRAY_Y + 8);
      ctx.fillStyle = "#b8e8e0";
      ctx.font = "8px Georgia, serif";
      ctx.fillText("SAFE", 40, TRAY_Y + 22);
      ctx.fillText("SAFE", W - 62, TRAY_Y + 22);
    } else {
      ctx.fillStyle = "#3d2a10";
      ctx.fillRect(24 + pw, TRAY_Y - 8, W - 48 - pw * 2, 48);
      ctx.fillStyle = "#d4a45a";
      ctx.font = "10px Georgia, serif";
      ctx.fillText("TRAY", W / 2 - 14, TRAY_Y + 22);
      ctx.fillText("PIT", 32, TRAY_Y + 22);
      ctx.fillText("PIT", W - 52, TRAY_Y + 22);
    }

    const coins = run ? run.coins : idleCoins();
    coins.forEach((c) => {
      if (c.gone === "pit" && c.y > H) return;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      const hanging = (spec.overhang || spec.lipHang) && !c.gone && c.y + c.r > LIP_Y;
      ctx.fillStyle = c.gone === "tray" ? "#f0d09a" : c.gone === "pit" ? "#6a3030" : (c.flash > 0 || hanging ? "#fff1c8" : "#d4a45a");
      ctx.fill();
      ctx.strokeStyle = "#8a6230";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(90,58,20,0.55)";
      ctx.stroke();
    });

    if (run && !run.done) {
      ctx.fillStyle = "rgba(12,6,9,0.72)";
      ctx.fillRect(8, 8, W - 16, 48);
      ctx.strokeStyle = "rgba(212,164,90,0.55)";
      ctx.strokeRect(8.5, 8.5, W - 17, 47);
      ctx.fillStyle = "#ffe6a6";
      ctx.font = "bold 14px Georgia, serif";
      ctx.fillText(hudFloor(run.spec), 16, 28);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "11px Georgia, serif";
      ctx.fillText(
        `${roomTell(run.spec)} · banked ${run.banked}` + (run.awaiting ? " · CASH OUT or DROP AGAIN" : ""),
        16,
        44
      );
    } else {
      kit.drawHud(ctx, W, DEPTH_COPY.idleHud);
    }
  }

  function start() {
    if (run && !run.done) return;
    stopIdle();
    declareP0();
    const kitRun = beginKitRun();
    if (!kitRun) {
      $("pusherStatus").textContent = "Out of demo coins · grant a pass";
      PF.refreshNightBoard();
      stampDepthCopy();
      startIdle();
      return;
    }
    const spec = floorSpec(qaStartAt());
    if (!spec) {
      stampDepthCopy();
      startIdle();
      return;
    }
    run = {
      done: false,
      kitRun,
      engine: mountEngine(kitRun),
      spec,
      coins: [],
      banked: 0,
      floorSurvived: 0,
      phase: -Math.PI / 2,
      plateY: 88,
      last: 0,
      didShove: false,
      dropCool: 0,
      busy: false,
      awaiting: false,
      doubleArmed: false,
      raf: 0,
      shake: 0,
      fxFall: 0,
      strokeRescued: 0,
      strokeLost: 0,
      strokePending: false,
      lastRescue: 0,
      pendingAdvance: false,
      trapdoorLane: -1,
      trapdoorT: 0,
      trapdoorDone: true,
      trapdoorPhase: "off",
      trapdoorArm: 0,
      sweepT: 0,
      sweepPunch: 0,
    };
    if (rk() && typeof rk().reportDepth === "function") {
      try { rk().reportDepth(kitRun, spec.floor, { name: spec.name, coda: !!spec.coda }); } catch (_) { /* hud optional */ }
    }
    seedBank(spec.bank);
    $("pusherStart").disabled = true;
    $("pusherStart").hidden = true;
    $("pusherVerdict").hidden = true;
    kit.hideResult("pusherResult");
    PF.setTier("pusherTier", "", "");
    kit.setMode(card(), "play");
    stampDepthCopy();
    setGreed(false);
    if ($("pusherDrop")) $("pusherDrop").hidden = false;
    if ($("pusherCash")) {
      $("pusherCash").hidden = false;
      $("pusherCash").disabled = false;
    }
    armTrapdoor();
    paintFloorBanner();
    paintKitHud(run.spec);
    PF.focusCard("pusherCard", true);
    PF.setAura("think");
    const loop = (now) => {
      if (!run || run.done) return;
      if (!run.last) run.last = now;
      const dt = Math.min(32, now - run.last);
      run.last = now;
      step(dt);
      draw();
      PF.refreshDepth();
      run.raf = requestAnimationFrame(loop);
    };
    run.raf = requestAnimationFrame(loop);
  }

  function pickLane() {
    const n = laneCount();
    let lane = Math.floor(Math.random() * n);
    if (run.spec.seam) {
      /* Two ledges: never seed the seam. Lanes hug the rails. */
      lane = Math.random() < 0.5 ? (Math.random() < 0.5 ? 0 : 1) : (n - 1 - (Math.random() < 0.5 ? 0 : 1));
    }
    if (run.spec.vMouth) {
      const mid = (n - 1) / 2;
      if (Math.abs(lane - mid) < 0.6 && Math.random() < 0.7) lane = Math.random() < 0.5 ? 0 : n - 1;
    }
    return lane;
  }

  function seedBank(n) {
    const want = Math.min(MAX_COINS, n);
    const tall = !!(run.spec && (run.spec.kickers || run.spec.kind === "avalanche"));
    const gap = tall ? 14 : 17;
    while (shelfCoins(run.coins).length < want) {
      const lane = pickLane();
      const stack = shelfCoins(run.coins).filter((c) => c.lane === lane).length;
      const rest = lipRest();
      const coin = makeCoin(lane, rest - stack * gap, true);
      if (tall) coin.x = laneX(lane) + (Math.random() - 0.5) * 2;
      run.coins.push(coin);
    }
  }

  function restockTowardBank() {
    const have = shelfCoins(run.coins).length;
    const add = Math.max(0, Math.min(4, run.spec.bank - have));
    for (let i = 0; i < add && shelfCoins(run.coins).length < MAX_COINS; i += 1) {
      const lane = pickLane();
      run.coins.push(makeCoin(lane, 92 + Math.random() * 20, false));
    }
  }

  function settleStacks() {
    const live = shelfCoins(run.coins).filter((c) => !c.falling);
    const byLane = [];
    const n = laneCount();
    for (let i = 0; i < n; i += 1) byLane.push([]);
    live.forEach((c) => {
      const lane = kit.clamp(c.lane | 0, 0, n - 1);
      c.lane = lane;
      byLane[lane].push(c);
    });
    byLane.forEach((col) => {
      col.sort((a, b) => b.y - a.y);
      col.forEach((c, i) => {
        if (i > 0) {
          const minY = col[i - 1].y - 17;
          if (c.y > minY) c.y = minY;
        }
        if (run.spec.seam && Math.abs(c.x - W / 2) < seamHalf(run.spec)) return;
        c.x += (laneX(c.lane) - c.x) * 0.14;
      });
    });
  }

  function inSeam(coin) {
    if (!run || !run.spec || !run.spec.seam) return false;
    return Math.abs(coin.x - W / 2) < seamHalf(run.spec);
  }

  function inVMouth(coin) {
    if (!run || !run.spec || !run.spec.vMouth) return false;
    const t = kit.clamp((coin.y - (LIP_Y - 8)) / 56, 0, 1);
    const half = (run.spec.vHalf || 86) * (1 - t * 0.92);
    return Math.abs(coin.x - W / 2) < half;
  }

  function destFor(coin) {
    const spec = run.spec;
    const n = laneCount();
    if (inSeam(coin)) return "pit";
    if (spec.vMouth) {
      /* Center is the mouth. Side lanes ride the rails into the tray. */
      if (inVMouth(coin)) return Math.random() < 0.98 ? "pit" : "tray";
      return Math.random() < 0.03 ? "pit" : "tray";
    }
    const pw = pitWidth(spec);
    const leftPit = 24 + pw;
    const rightPit = W - 24 - pw;
    if (coin.x < leftPit + 6) return "pit";
    if (coin.x > rightPit - 6) return "pit";
    const hanging = (spec.overhang || spec.lipHang) && coin.y + coin.r > LIP_Y + 4;
    const edge = (coin.lane === 0 || coin.lane === n - 1) ? 0.18 : 0.05;
    const hangChance = spec.kind === "overhang" ? 0.52 : 0.38;
    return Math.random() < (hanging ? edge + hangChance : edge) ? "pit" : "tray";
  }

  function lipRest() {
    const hang = run && run.spec ? (run.spec.lipHang || (run.spec.overhang ? 96 : 0)) : 0;
    return LIP_Y - 14 + Math.min(36, hang * 0.38);
  }

  function paintFloorBanner() {
    if (!run || !run.spec) return;
    if (run.trapdoorPhase === "mark" || run.trapdoorPhase === "wait" || run.trapdoorPhase === "shudder" || run.trapdoorPhase === "open") return;
    $("pusherStatus").textContent = `${hudFloor(run.spec)} — ${run.spec.barker}`;
  }

  function armTrapdoor() {
    if (!run || !run.spec.trapdoor) {
      run.trapdoorLane = -1;
      run.trapdoorT = 0;
      run.trapdoorDone = true;
      run.trapdoorPhase = "off";
      run.trapdoorArm = 0;
      paintScream();
      return;
    }
    run.trapdoorLane = Math.floor(Math.random() * laneCount());
    run.trapdoorT = 0;
    run.trapdoorArm = 1200;
    run.trapdoorDone = false;
    run.trapdoorPhase = "mark";
    run.shake = Math.max(run.shake || 0, 3.5);
    $("pusherStatus").textContent = `${hudFloor(run.spec)} — hatch MARKED lane ${run.trapdoorLane + 1}. It will shiver. CASH OUT if you want.`;
    paintScream();
  }

  function openTrapdoor() {
    run.trapdoorPhase = "open";
    run.trapdoorDone = true;
    run.trapdoorT = 0;
    run.shake = 18;
    let dumped = 0;
    shelfCoins(run.coins).forEach((c) => {
      if (c.lane !== run.trapdoorLane || c.falling) return;
      c.gone = "pit";
      c.flash = 260;
      c.y += 10;
      dumped += 1;
      run.strokeLost += 1;
    });
    kit.sfx("pit");
    run.fxFall = 520;
    paintScream();
    $("pusherStatus").textContent = dumped
      ? `TRAPDOOR — lane ${run.trapdoorLane + 1} dumped the pit.`
      : "TRAPDOOR — the hatch yawned empty.";
    if (!run.awaiting) run.strokePending = true;
  }

  function tickTrapdoor(dt) {
    if (!run || run.trapdoorDone || run.trapdoorLane < 0) return;
    if (run.trapdoorPhase === "mark") {
      run.trapdoorArm = (run.trapdoorArm || 0) - dt;
      if ((run.trapdoorArm | 0) % 400 < dt) run.shake = Math.max(run.shake || 0, 2.2);
      if (run.trapdoorArm > 0) return;
      run.trapdoorPhase = "wait";
      run.trapdoorT = 1800;
      paintScream();
      $("pusherStatus").textContent = `Lane ${run.trapdoorLane + 1} hatch is live. CASH OUT before it shivers.`;
      return;
    }
    if (run.trapdoorPhase === "wait") {
      run.trapdoorT -= dt;
      if (run.trapdoorT > 0) {
        if ((run.trapdoorT | 0) % 500 < dt) run.shake = Math.max(run.shake || 0, 3.2);
        return;
      }
      run.trapdoorPhase = "shudder";
      run.trapdoorT = 1600;
      run.shake = 12;
      kit.sfx("shove");
      paintScream();
      $("pusherStatus").textContent = `Lane ${run.trapdoorLane + 1} is shivering. The lid is lifting. CASH OUT or watch it dump.`;
      return;
    }
    if (run.trapdoorPhase !== "shudder") return;
    run.trapdoorT -= dt;
    const u = 1 - kit.clamp(run.trapdoorT / 1600, 0, 1);
    run.shake = Math.max(run.shake || 0, 8 + u * 14);
    shelfCoins(run.coins).forEach((c) => {
      if (c.lane !== run.trapdoorLane || c.falling) return;
      c.x += Math.sin(performance.now() * 0.07) * (1.1 + u * 2.2);
      c.y += Math.sin(performance.now() * 0.09) * (0.4 + u * 0.8);
      c.flash = 140;
    });
    if (run.trapdoorT > 0) return;
    openTrapdoor();
  }

  function spillOverLip() {
    let n = 0;
    shelfCoins(run.coins).forEach((c) => {
      if (c.falling) return;
      if (c.y + c.r < LIP_Y) return;
      const dest = destFor(c);
      c.gone = dest;
      c.falling = false;
      c.flash = 140;
      n += 1;
      if (dest === "tray") {
        run.banked += 1;
        run.strokeRescued += 1;
        kit.sfx("tray");
      } else {
        run.strokeLost += 1;
        kit.sfx("pit");
      }
    });
    if (n) {
      run.shake = 5;
      run.fxFall = 380;
      if (run.didShove) run.strokePending = true;
    }
    return n;
  }

  function physicsFalling(dt) {
    const k = dt / 16;
    let busy = false;
    run.coins.forEach((c) => {
      if (c.flash > 0) c.flash -= dt;
      if (c.gone === "tray") {
        c.y += 2.2 * k;
        c.x += ((W / 2) - c.x) * 0.08;
        if (c.y < H + 18) busy = true;
        return;
      }
      if (c.gone === "pit") {
        c.y += 3.1 * k;
        if (c.y < H + 18) busy = true;
        return;
      }
      if (!c.falling) return;
      busy = true;
      c.vy += 0.38 * k;
      c.y += c.vy * k;
      const stack = shelfCoins(run.coins).filter((o) => o !== c && !o.falling && o.lane === c.lane).length;
      const rest = lipRest() - stack * 17;
      if (c.y >= rest) {
        c.y = rest;
        c.vy = 0;
        c.falling = false;
        c.x = laneX(c.lane) + (Math.random() - 0.5) * 5;
      }
    });
    run.busy = busy || run.fxFall > 0;
    run.fxFall = Math.max(0, run.fxFall - dt);
    eatGeometry();
    settleStacks();
    run.coins = run.coins.filter((c) => !(c.gone && c.y > H + 16));
  }

  function eatGeometry() {
    const spec = run.spec;
    shelfCoins(run.coins).forEach((c) => {
      if (c.falling || c.gone) return;
      if (inSeam(c)) {
        c.gone = "pit";
        c.flash = 160;
        run.strokeLost += 1;
        kit.sfx("pit");
        return;
      }
      if (spec.vMouth && inVMouth(c) && c.y > LIP_Y - 10) {
        c.gone = destFor(c);
        c.flash = 140;
        if (c.gone === "tray") {
          run.banked += 1;
          run.strokeRescued += 1;
          kit.sfx("tray");
        } else {
          run.strokeLost += 1;
          kit.sfx("pit");
        }
      }
    });
  }

  function shoveCoins(dy) {
    const plateBottom = run.plateY + PLATE_H;
    const n = laneCount();
    shelfCoins(run.coins).forEach((c) => {
      if (c.falling) return;
      const overlaps = c.y + c.r > run.plateY - 2 && c.y - c.r < plateBottom + 10;
      if (!overlaps) return;
      c.y = Math.max(c.y + dy * 0.98, plateBottom + c.r * 0.35);
      c.flash = 40;
      if (run.spec.seam) {
        const mid = (n - 1) / 2;
        if (Math.abs(c.lane - mid) <= 1.2) c.x += (W / 2 - c.x) * 0.22;
      }
      if (run.spec.kickers) {
        if (c.x < 96 && c.y < 188) {
          c.lane = kit.clamp(c.lane + 1, 0, n - 1);
          c.x += 26;
          c.y += 18;
        } else if (c.x > W - 96 && c.y < 188) {
          c.lane = kit.clamp(c.lane - 1, 0, n - 1);
          c.x -= 26;
          c.y += 18;
        }
      }
    });
    eatGeometry();
    spillOverLip();
    settleStacks();
  }

  function resolveStroke() {
    if (!run || run.done) return;
    const rescued = run.strokeRescued;
    const after = shelfCoins(run.coins).length;
    const floorNow = run.spec.floor;
    if (rescued > 0) run.floorSurvived = Math.max(run.floorSurvived, floorNow);
    if (run.kitRun && PF.runKit && typeof PF.runKit.reportDepth === "function") {
      PF.runKit.reportDepth(run.kitRun, run.floorSurvived, { name: run.spec.name, coda: !!run.spec.coda });
    }
    $("pusherStatus").textContent = rescued
      ? `Tray +${rescued}. ${hudFloor(run.spec)}. Greed, or walk?`
      : after
        ? `Sweeper missed the tray. ${hudFloor(run.spec)}.`
        : "Shelf empty. The pit is grinning.";

    if (run.spec.buried && after === 0 && rescued === 0) {
      finish("buried");
      return;
    }

    if (!run.spec.buried && after === 0) {
      restockTowardBank();
      $("pusherStatus").textContent = `${hudFloor(run.spec)} — nursery restock. The glass is teaching.`;
    }

    run.strokeRescued = 0;
    run.strokeLost = 0;
    if (rescued > 0) {
      run.awaiting = true;
      run.pendingAdvance = true;
      run.lastRescue = rescued;
      setGreed(true, rescued);
      PF.setAura("point");
      return;
    }
    restockTowardBank();
  }

  function step(dt) {
    run.dropCool = Math.max(0, run.dropCool - dt);
    tickTrapdoor(dt);
    physicsFalling(dt);

    if (run.strokePending && !run.busy) {
      run.strokePending = false;
      resolveStroke();
    }

    const cash = $("pusherCash");
    const drop = $("pusherDrop");
    if (run.awaiting || run.busy) {
      if (cash) cash.disabled = run.busy && !run.awaiting;
      if (drop) drop.disabled = true;
      return;
    }
    if (cash) cash.disabled = !!run.busy;
    if (drop) drop.disabled = !!run.busy;

    const prevY = run.plateY;
    if (run.spec.doublePush) {
      run.sweepT = (run.sweepT || 0) + dt;
      run.plateY = plateYNow();
      const goingDown = run.plateY > prevY + 0.04;
      if (goingDown) shoveCoins(run.plateY - prevY);
      const t = run.sweepT % 2400;
      const punch = t < 760 ? 1 : t < 1840 ? 2 : 0;
      if (punch && punch !== run.sweepPunch) {
        run.sweepPunch = punch;
        run.didShove = true;
        kit.sfx("shove");
        run.shake = punch === 2 ? 6 : 4;
        $("pusherStatus").textContent = punch === 1
          ? `${hudFloor(run.spec)} — first sweep.`
          : `${hudFloor(run.spec)} — second sweep. Decide.`;
      }
      if (punch === 0) {
        if (run.didShove && !run.strokePending) run.strokePending = true;
        run.didShove = false;
        run.sweepPunch = 0;
      }
      return;
    }
    run.phase += dt * run.spec.speed;
    run.plateY = plateYNow();
    const goingDown = run.plateY > prevY + 0.04;
    const wave = Math.sin(run.phase);

    if (goingDown) shoveCoins(run.plateY - prevY);

    if (wave > 0.92 && !run.didShove) {
      run.didShove = true;
      kit.sfx("shove");
      run.shake = 4;
    }
    if (run.didShove && wave < 0.55 && !run.strokePending) {
      run.strokePending = true;
    }
    if (wave < -0.72) {
      run.didShove = false;
    }
  }

  function dropLane(lane) {
    if (!isLive() || run.dropCool > 0 || run.busy || run.awaiting) return;
    lane = kit.clamp(lane | 0, 0, laneCount() - 1);
    if (shelfCoins(run.coins).length >= MAX_COINS) {
      $("pusherStatus").textContent = "Glass is packed. Cash out or wait for the sweep.";
      return;
    }
    run.coins.push(makeCoin(lane, 78, false));
    run.dropCool = 220;
    kit.sfx("drop");
    $("pusherStatus").textContent = `Dropped lane ${lane + 1}. The plate is coming.`;
    if (run.spec.avalanche && Math.random() < run.spec.avalanche) {
      run.shake = 14;
      $("pusherStatus").textContent = "Avalanche coming — the shelf shudders.";
      const live = shelfCoins(run.coins).filter((c) => !c.falling);
      live.sort((a, b) => b.y - a.y);
      const take = Math.min(6, Math.max(3, live.length - 1));
      for (let i = 0; i < take; i += 1) live[i].y += 22;
      eatGeometry();
      settleStacks();
      spillOverLip();
      $("pusherStatus").textContent = "Avalanche! Coins tumbled the lip.";
    }
  }

  function dropFromX(x) {
    const n = laneCount();
    const span = (W - 56) / n;
    dropLane(Math.max(0, Math.min(n - 1, Math.floor((x - 28) / span))));
  }

  function scoreFor(cashed) {
    let pts = run.banked * 10 + run.floorSurvived * 200;
    if (cashed && run.floorSurvived >= 5) pts = Math.round(pts * 1.15);
    return pts;
  }

  function auraFor(reason, cashed) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (run.spec && run.spec.coda && cashed) return AURA.coda;
    if (cashed && run.floorSurvived >= 5) return AURA.cashDeep(run.floorSurvived);
    if (cashed) return AURA.cash;
    if (run.banked === 0) return AURA.empty;
    if (run.floorSurvived >= 4) return AURA.greed;
    return AURA.buried;
  }

  function revealResult(shot) {
    const reason = shot.reason;
    const cashed = shot.cashed;
    const floor = shot.floor;
    const banked = shot.banked;
    const score = shot.score;
    $("pusherStart").disabled = false;
    $("pusherStart").hidden = false;
    $("pusherStart").textContent = "DROP AGAIN · 1 demo coin";
    if ($("pusherDrop")) $("pusherDrop").hidden = true;
    if ($("pusherCash")) {
      $("pusherCash").hidden = true;
      $("pusherCash").disabled = true;
      $("pusherCash").classList.remove("cash-scream");
    }
    PF.focusCard("pusherCard", false);
    kit.setMode(card(), "result");
    const line = `FLOOR ${floor} · ${banked} BANKED · SCORE ${score}`;
    const aura = shot.aura;
    $("pusherVerdict").hidden = false;
    $("pusherVerdict").textContent = cashed
      ? `Walked away. ${line}.`
      : reason === "leave"
        ? `Left the glass · ${line}`
        : `Buried. ${line}.`;
    kit.fillResult({
      root: "pusherResult",
      depth: "pusherResultDepth",
      score: "pusherResultScore",
      aura: "pusherResultAura",
      copied: "pusherCopied",
    }, {
      depthLine: cashed ? `FLOOR ${floor} · WALKED` : `FLOOR ${floor} · BURIED`,
      scoreLine: `SCORE ${score} · ${banked} coins`,
      auraLine: aura,
    });
    const ch = $("pusherChallengeText");
    if (ch) ch.textContent = challengeLine(floor);
    PF.setTier("pusherTier", cashed ? `FLOOR ${floor}` : "BURIED", cashed ? "perfect" : "miss");
    $("pusherStatus").textContent = cashed ? "Cashed the shelf." : "The ledge keeps your greed.";
    const ok = cashed || banked > 0 || floor > 0;
    if (ok) {
      PF.award(Math.max(cashed ? 12 : 8, Math.floor(score / 8)), true, cashed ? "Pusher cash-out" : "Pusher");
      PF.setAura(cashed ? "celebrate" : "laugh");
      if (reason !== "leave") PF.showBanner(cashed, cashed ? `FLOOR ${floor}` : "BURIED", `${banked} banked · ${aura}`);
    } else {
      PF.award(0, false, "Pusher miss");
      PF.setAura("badLuck");
      if (reason !== "leave") PF.showBanner(false, "BURIED", aura);
    }
    PF.refreshNightBoard();
    stampDepthCopy();
    draw();
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true;
    if (run.raf) cancelAnimationFrame(run.raf);
    run.awaiting = false;
    setGreed(false);
    const cashed = reason === "cash" || reason === "souvenir";
    if (cashed) kit.sfx("cash");
    else if (reason !== "leave") kit.sfx("bury");
    const floor = run.floorSurvived;
    const banked = run.banked;
    const score = scoreFor(cashed);
    const shot = {
      reason,
      cashed,
      floor,
      banked,
      score,
      aura: auraFor(reason, cashed),
    };
    persistDepth({
      depth: floor,
      score,
      banked,
      deathReason: reason === "souvenir" ? "souvenir" : (cashed ? "cashed_out" : (reason === "leave" ? "leave" : "buried")),
      cashedOut: cashed,
      meta: { room: run.spec && run.spec.name, coda: !!(run.spec && run.spec.coda) },
    });
    stampDepthCopy();
    draw();
    if (reason === "leave" || cashed) {
      revealResult(shot);
      return;
    }
    setTimeout(() => revealResult(shot), 720);
  }

  function cashOut() {
    if (!isLive()) return;
    if (run.busy && !run.awaiting && !trapdoorThreatening()) return;
    finish("cash");
  }

  function enterFloor(next, fromFloor) {
    const oldN = laneCount();
    run.spec = next;
    const n = laneCount();
    shelfCoins(run.coins).forEach((c) => {
      if (oldN !== n) {
        const t = oldN > 1 ? (c.lane | 0) / (oldN - 1) : 0.5;
        c.lane = kit.clamp(Math.round(t * (n - 1)), 0, n - 1);
      } else {
        c.lane = kit.clamp(c.lane | 0, 0, n - 1);
      }
      c.x = laneX(c.lane);
    });
    if (next.seam) {
      shelfCoins(run.coins).forEach((c) => {
        if (Math.abs(c.x - W / 2) < seamHalf(next) * 0.72) {
          c.x += c.x < W / 2 ? -36 : 36;
          c.lane = c.x < W / 2 ? 0 : n - 1;
        }
      });
    }
    run.floorSurvived = Math.max(run.floorSurvived, fromFloor);
    if (run.kitRun && PF.runKit && typeof PF.runKit.reportDepth === "function") {
      PF.runKit.reportDepth(run.kitRun, next.floor, { name: next.name, coda: !!next.coda });
    }
    armTrapdoor();
    restockTowardBank();
    eatGeometry();
    run.sweepT = 0;
    run.sweepPunch = 0;
    run.phase = -Math.PI / 2;
    run.plateY = 88;
    paintKitHud(run.spec);
  }

  function dropAgain() {
    if (!run || run.done) return;
    run.awaiting = false;
    setGreed(false);
    if (run.pendingAdvance) {
      run.pendingAdvance = false;
      const floorNow = run.spec.floor;
      if (floorNow >= AUTHORED_COUNT && !run.spec.coda && !codaOn()) {
        finish("souvenir");
        return;
      }
      const next = floorSpec(floorNow + 1);
      if (!next) {
        finish("souvenir");
        return;
      }
      enterFloor(next, floorNow);
      if (next.coda && floorNow === AUTHORED_COUNT) {
        paintFloorBanner();
        PF.setAura("think");
        return;
      }
    }
    paintFloorBanner();
    PF.setAura("think");
  }

  PF.registerVendor({
    id: "coin-pusher",
    playKey: "pusher",
    chalk: "Greed is the game. Cash out or go deeper.",
    defaults: { bestPusherM: 0, bestPusherCoins: 0, bestPusherFloor: 0 },
    onLeave() { if (run && !run.done) finish("leave"); },
    onShow() { declareP0(); stampDepthCopy(); startIdle(); },
    onReset() {
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = null;
      if ($("pusherVerdict")) $("pusherVerdict").hidden = true;
      kit.hideResult("pusherResult");
      if ($("pusherStart")) {
        $("pusherStart").disabled = false;
        $("pusherStart").hidden = false;
        $("pusherStart").textContent = "START · 1 demo coin";
      }
      if ($("pusherDrop")) $("pusherDrop").hidden = true;
      if ($("pusherCash")) {
        $("pusherCash").hidden = true;
        $("pusherCash").disabled = true;
        $("pusherCash").classList.remove("cash-scream");
      }
      setGreed(false);
      kit.setMode(card(), "vestibule");
      stampDepthCopy();
      startIdle();
    },
    refreshDepth(state) {
      const m = $("depthPusherM");
      if (m) m.textContent = run && !run.done ? hudFloor(run.spec) : "FLOOR 0";
      const c = $("depthPusherCoins");
      if (c) c.textContent = String((run && !run.done) ? run.banked : 0);
      const bm = $("depthPusherBestM");
      if (bm) bm.textContent = (state.bestPusherFloor || state.bestPusherM)
        ? `Floor ${state.bestPusherFloor || Math.floor(state.bestPusherM)}`
        : "—";
      const bc = $("depthPusherBestC");
      if (bc) bc.textContent = state.bestPusherCoins ? String(state.bestPusherCoins) : "—";
    },
    bind() {
      declareP0();
      const startBtn = $("pusherStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const cash = $("pusherCash");
      if (cash) cash.addEventListener("click", cashOut);
      const drop = $("pusherDrop");
      if (drop) drop.addEventListener("click", () => dropLane(Math.floor(laneCount() / 2)));
      const again = $("pusherDropAgain");
      if (again) again.addEventListener("click", dropAgain);
      const greedCash = $("pusherGreedCash");
      if (greedCash) greedCash.addEventListener("click", cashOut);
      const canvas = $("pusherCanvas");
      if (canvas) {
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            punchStart();
            return;
          }
          ev.preventDefault();
          const p = kit.canvasPos(canvas, ev, W, H);
          dropFromX(p.x);
        });
      }
      const copyBtn = $("pusherChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const n = (PF.getState().lastRun && PF.getState().lastRun.game === GAME_ID)
            ? PF.getState().lastRun.depth
            : (PF.getState().bestPusherFloor || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const el = $("pusherCopied");
            if (el) el.hidden = false;
            $("pusherStatus").textContent = "Copied — send it";
          }, () => {
            $("pusherStatus").textContent = text;
          });
        });
      }
      if ($("pusherDrop")) $("pusherDrop").hidden = true;
      if ($("pusherCash")) $("pusherCash").hidden = true;
      stampDepthCopy();
      startIdle();
    },
  });
})();
