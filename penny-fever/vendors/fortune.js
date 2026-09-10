/* Mystic Fortune Tent — walk-in reading. PF only. Never booth/port 6000.
 * Guest walks the tent floor to Aura at her table. One penny, one ticket.
 * Paper puppets: seated Aura + overalls guest. Rail-style WASD. */
import * as THREE from "../world/lib/three.module.min.js";

(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor) return;
  const { kit } = PF;

  const GAME_ID = "fortune";
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const START = { x: 0, z: 2.55 };
  const TABLE = { x: 0, z: -0.15 };
  const AISLE = 1.35;
  const COUNTER_Z = 0.92;

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
    "The wait was never the game. Sitting down was.",
  ];
  const COLOURS = ["oxblood", "kraft gold", "olive lamp", "cream ticket", "lantern rose"];

  const P0_MOUNT = {
    engine: "Custom",
    displayName: "Mystic Fortune Tent",
    depthUnit: "Reading",
    codaEnabled: false,
    authoredCount: 1,
  };

  function el(id) {
    return document.getElementById(id);
  }
  function setText(id, text) {
    const n = el(id);
    if (n) n.textContent = text;
  }
  function cardRoot() {
    return el("fortuneCard");
  }
  function cabinetOn() {
    const room = el("cabinet-fortune");
    return !!(room && !room.hidden);
  }
  function rk() {
    return PF.runKit || null;
  }

  let world = null;
  let raf = 0;
  let lastTs = 0;
  let bound = false;
  let keys = { w: false, a: false, s: false, d: false };
  let phase = "walk"; // walk | reading | told
  let readingT = 0;
  let told = null;
  let ctxRun = null;

  function kraft(hex, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color: hex, roughness: 0.92, metalness: 0.02, flatShading: true,
    }, extra || {}));
  }

  function loadTex(path) {
    const t = new THREE.TextureLoader().load(path);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  function makeGuest(parent) {
    const player = new THREE.Group();
    player.position.set(START.x, 0, START.z);
    player.rotation.y = Math.PI;
    parent.add(player);
    const tex = loadTex("assets/restyle/paper-guest-turnaround.png");
    const stand = new THREE.Group();
    const views = [];
    for (let side = 0; side < 2; side += 1) {
      const view = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, alphaTest: 0.12, side: THREE.DoubleSide, depthWrite: false,
      });
      function piece(x0, y0, x1, y1) {
        const g = new THREE.PlaneGeometry((x1 - x0) * 1.28, (y1 - y0) * 1.72);
        const uv = g.attributes.uv;
        for (let i = 0; i < uv.count; i += 1) {
          uv.setXY(i, (side + x0 + uv.getX(i) * (x1 - x0)) / 2, y0 + uv.getY(i) * (y1 - y0));
        }
        return new THREE.Mesh(g, mat);
      }
      const torso = piece(0, 0.26, 1, 1);
      torso.position.y = 1.08;
      view.add(torso);
      const legs = [];
      for (let i = 0; i < 2; i += 1) {
        const pivot = new THREE.Group();
        pivot.position.set((i ? 1 : -1) * 0.28, 0.4, 0);
        const shin = piece(i * 0.5, 0, (i + 1) * 0.5, 0.26);
        shin.position.y = -0.2;
        pivot.add(shin);
        view.add(pivot);
        legs.push(pivot);
      }
      view.userData.legs = legs;
      stand.add(view);
      views.push(view);
    }
    player.add(stand);
    player.userData.paperGuest = { stand, views, lastX: START.x, lastZ: START.z, phase: 0 };
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.32, 20),
      new THREE.MeshBasicMaterial({ color: 0x24160d, transparent: true, opacity: 0.28, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    player.add(shadow);
    return player;
  }

  function tickGuest(player, camera, dt, moving) {
    const g = player.userData.paperGuest;
    if (!g) return;
    const dx = player.position.x - g.lastX;
    const dz = player.position.z - g.lastZ;
    const travel = Math.hypot(dx, dz);
    g.lastX = player.position.x;
    g.lastZ = player.position.z;
    if (moving) g.phase += Math.max(travel, dt * 2.2) * 10;
    const bearing = Math.atan2(camera.position.x - player.position.x, camera.position.z - player.position.z);
    const front = Math.cos(bearing - player.rotation.y) > 0;
    g.views[0].visible = front;
    g.views[1].visible = !front;
    g.stand.rotation.y = bearing - player.rotation.y;
    const swing = moving && !REDUCE ? Math.sin(Math.floor(g.phase * 10) / 10) * 0.14 : 0;
    g.views.forEach((v) => {
      v.userData.legs[0].rotation.z = swing;
      v.userData.legs[1].rotation.z = -swing;
    });
    g.stand.position.y = moving && !REDUCE ? Math.abs(Math.sin(g.phase)) * 0.03 : 0;
  }

  function buildWorld() {
    const canvas = el("fortuneCanvas");
    if (!canvas) return null;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas, antialias: (window.devicePixelRatio || 1) < 1.6, powerPreference: "high-performance",
      });
    } catch (_) {
      return null;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.setClearColor(0x1c140e, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x2a1c14, 0.055);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.08, 60);

    if (window.PennyFever && PennyFever.kit && PennyFever.kit.restyleInterior) {
      requestAnimationFrame(function () {
        var sc = (typeof scene !== "undefined" && scene) || (typeof world !== "undefined" && world && world.scene) || (typeof gl !== "undefined" && gl && gl.scene) || (typeof gfx !== "undefined" && gfx && gfx.scene);
        if (sc) PennyFever.kit.restyleInterior(sc);
      });
    }
    camera.position.set(0, 2.45, START.z + 6.2);
    camera.lookAt(0, 1.02, START.z - 2.35);

    scene.add(new THREE.AmbientLight(0xffe3b8, 0.72));
    scene.add(new THREE.HemisphereLight(0xffd9a0, 0x3a2418, 0.55));
    const lantern = new THREE.PointLight(0xffc878, 1.35, 11, 1.6);
    lantern.position.set(0, 2.4, 0.4);
    scene.add(lantern);

    const root = new THREE.Group();
    scene.add(root);

    const stripe = canvasTex(128, 128, (ctx) => {
      for (let i = 0; i < 8; i += 1) {
        ctx.fillStyle = i % 2 ? "#6b3430" : "#425438";
        ctx.fillRect(i * 16, 0, 16, 128);
      }
    });
    stripe.repeat.set(8, 2);
    const board = canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#9b7e58";
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = "rgba(60,40,20,0.35)";
      for (let y = 0; y < 256; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y + 4);
        ctx.lineTo(256, y);
        ctx.stroke();
      }
    });
    board.repeat.set(4, 6);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(8.4, 12),
      new THREE.MeshStandardMaterial({ map: board, roughness: 1, metalness: 0, color: 0xc4a06a })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = 1.2;
    root.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({
      map: stripe, roughness: 0.95, metalness: 0, side: THREE.DoubleSide, flatShading: true,
    });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.35, 3.2, 16, 1, true), wallMat);
    wall.position.y = 1.6;
    root.add(wall);

    const studio = loadTex("assets/restyle/paper-studio.png");
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 3.1),
      new THREE.MeshBasicMaterial({ map: studio, side: THREE.DoubleSide })
    );
    back.position.set(0, 1.55, -3.35);
    root.add(back);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(4.6, 2.0, 16),
      kraft(0x5a3a28, { map: stripe })
    );
    roof.position.y = 4.15;
    root.add(roof);

    const flapMat = kraft(0x5a2030, { emissive: 0x2a0810, emissiveIntensity: 0.2 });
    [-1, 1].forEach((side) => {
      const flap = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.6), flapMat);
      flap.position.set(side * 1.05, 1.3, 5.15);
      flap.rotation.y = side * 0.42;
      root.add(flap);
    });

    const table = new THREE.Group();
    table.position.set(TABLE.x, 0, TABLE.z);
    table.add(new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.82, 0.08, 20), kraft(0x6b3430)));
    table.children[0].position.y = 0.78;
    table.add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.72, 10), kraft(0x8a6a40)));
    table.children[1].position.y = 0.38;
    const cloth = new THREE.Mesh(new THREE.CircleGeometry(0.74, 20), kraft(0x4a1a28, { emissive: 0x2a0810, emissiveIntensity: 0.18 }));
    cloth.rotation.x = -Math.PI / 2;
    cloth.position.y = 0.825;
    table.add(cloth);
    root.add(table);

    const crystal = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0xc8f0ff, roughness: 0.12, metalness: 0.05,
        emissive: 0x66c8e8, emissiveIntensity: 0.55, transparent: true, opacity: 0.88,
      })
    );
    crystal.position.set(0, 1.08, TABLE.z + 0.12);
    root.add(crystal);
    const orb = new THREE.PointLight(0x88e0ff, 0.85, 3.4, 2);
    orb.position.copy(crystal.position);
    root.add(orb);

    const aura = new THREE.Group();
    aura.position.set(0, 0, -1.22);
    const auraTex = loadTex("assets/restyle/paper-aura-seated.png");
    const portrait = new THREE.Mesh(
      new THREE.PlaneGeometry(1.22, 1.85),
      new THREE.MeshBasicMaterial({
        map: auraTex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, depthWrite: false,
      })
    );
    portrait.position.y = 0.92;
    aura.add(portrait);
    root.add(aura);

    const player = makeGuest(root);

    for (let i = 0; i < 4; i += 1) {
      const a = -0.9 + i * 0.6;
      const L = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffd993 })
      );
      L.position.set(Math.sin(a) * 1.7, 2.35, Math.cos(a) * 0.9 - 0.2);
      root.add(L);
    }

    return {
      renderer, scene, camera, root, canvas, player, aura, portrait, crystal, orb, lantern,
      clock: 0,
    };
  }

  function resizeWorld() {
    if (!world) return;
    const stage = el("fortuneStage") || world.canvas.parentElement;
    const w = Math.max(1, (stage && stage.clientWidth) || world.canvas.clientWidth || 640);
    const h = Math.max(1, (stage && stage.clientHeight) || world.canvas.clientHeight || 480);
    world.renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  }

  function ensureWorld() {
    if (world) return world;
    world = buildWorld();
    if (!world) {
      const fail = el("fortuneWebglFail");
      if (fail) fail.hidden = false;
      return null;
    }
    const fail = el("fortuneWebglFail");
    if (fail) fail.hidden = true;
    resizeWorld();
    return world;
  }

  function atTable() {
    if (!world) return false;
    const p = world.player.position;
    return p.z < COUNTER_Z && Math.abs(p.x) < 0.72;
  }

  function blocked(x, z) {
    if (Math.abs(x) > AISLE) return true;
    if (z > 5.05 || z < -0.05) return true;
    if (z < 0.55 && Math.abs(x) < 0.82) return true;
    return false;
  }

  function tryMove(dx, dz) {
    const p = world.player.position;
    if (!blocked(p.x + dx, p.z + dz)) {
      p.x += dx;
      p.z += dz;
      return;
    }
    if (!blocked(p.x, p.z + dz)) p.z += dz;
    else if (!blocked(p.x + dx, p.z) && Math.abs(p.x + dx) <= AISLE) p.x += dx;
  }

  function paintHud() {
    const near = atTable();
    if (phase === "told" && told) {
      setText("fortuneHudRoom", "AURA’S TABLE");
      setText("fortuneHudHint", "“Keep the colour. The alley is still warm.”");
      setText("fortunePlayStatus", told.line);
    } else if (phase === "reading") {
      setText("fortuneHudRoom", "THE CRYSTAL LOOKS");
      setText("fortuneHudHint", "“Hold still, darling. The paper knows.”");
      setText("fortunePlayStatus", "Aura is reading.");
    } else if (near) {
      setText("fortuneHudRoom", "AT THE TABLE");
      setText("fortuneHudHint", "“A penny for a reading.”  E to sit.");
      setText("fortunePlayStatus", "Offer a penny · E");
    } else {
      setText("fortuneHudRoom", "INSIDE THE MYSTIC TENT");
      setText("fortuneHudHint", "Walk up to Aura. She is already seated.");
      setText("fortunePlayStatus", "WASD · walk to the table");
    }
    const enter = el("fortuneGo");
    if (enter) {
      enter.disabled = phase === "reading" || (phase === "walk" && !near);
      enter.textContent = phase === "told" ? "ANOTHER READING · 1 penny" : (near ? "SIT · 1 penny" : "Walk to Aura");
    }
    const start = el("fortuneStart");
    if (start) {
      start.disabled = enter ? enter.disabled : true;
      start.textContent = enter ? enter.textContent : "Sit";
    }
  }

  function showTicket(line, colour) {
    const ticket = el("fortuneFloatTicket");
    if (ticket) ticket.hidden = false;
    setText("fortuneTicketColour", colour);
    setText("fortuneTicketLine", line);
    setText("fortuneText", line);
  }

  function askReading() {
    if (!world || phase === "reading") return;
    if (phase === "walk" && !atTable()) {
      setText("fortuneHudHint", "Come closer, darling. The table is this way.");
      return;
    }
    const kitRun = rk() && rk().startRun ? rk().startRun({ gameId: GAME_ID, coinCost: 1 }) : null;
    if (kitRun === null && rk() && rk().startRun) {
      setText("fortuneHudHint", "“A penny for a reading, darling.”");
      setText("fortunePlayStatus", "Need a penny.");
      if (PF.setAura) PF.setAura("point");
      return;
    }
    ctxRun = kitRun;
    phase = "reading";
    readingT = REDUCE ? 0.45 : 2.15;
    if (kit && kit.setMode) kit.setMode(cardRoot(), "play");
    const overlay = el("fortuneStartOverlay");
    if (overlay) overlay.hidden = true;
    paintHud();
  }

  function sealTicket() {
    const line = LINES[(Math.random() * LINES.length) | 0];
    const colour = COLOURS[(Math.random() * COLOURS.length) | 0];
    told = { line, colour };
    phase = "told";
    showTicket(line, colour);
    if (rk() && ctxRun && rk().finishRun) {
      try {
        rk().finishRun(ctxRun, {
          gameId: GAME_ID, depth: 1, score: 1, deathReason: "told", cashedOut: true,
          meta: { colour, line },
        }, { navigate: false });
      } catch (_) { /* */ }
    }
    if (PF.award) PF.award(12, true, "Fortune");
    if (PF.setAura) PF.setAura("celebrate");
    if (PF.showBanner) PF.showBanner(true, colour.toUpperCase(), line);
    if (kit && kit.setMode) kit.setMode(cardRoot(), "result");
    const result = el("fortuneOracleResult");
    if (result) result.hidden = false;
    setText("fortuneResultDepth", "ONE READING");
    setText("fortuneResultScore", colour.toUpperCase());
    setText("fortuneResultAura", line);
    setText("fortuneChallengeText", "I sat with Aura in the Mystic Tent on Penny Fever");
    paintHud();
  }

  function resetWalk() {
    phase = "walk";
    told = null;
    ctxRun = null;
    readingT = 0;
    if (world) {
      world.player.position.set(START.x, 0, START.z);
      world.player.rotation.y = Math.PI;
      updateCamera(true);
    }
    const ticket = el("fortuneFloatTicket");
    if (ticket) ticket.hidden = true;
    const result = el("fortuneOracleResult");
    if (result) result.hidden = true;
    const overlay = el("fortuneStartOverlay");
    if (overlay) overlay.hidden = true;
    if (kit && kit.setMode) kit.setMode(cardRoot(), "play");
    paintHud();
  }

  function updateCamera(snap) {
    const p = world.player.position;
    const dist = 6.2;
    const height = 2.45;
    const tx = p.x * 0.08;
    const ty = p.y + height;
    const tz = p.z + dist;
    const k = snap ? 1 : 0.16;
    world.camera.position.x += (tx - world.camera.position.x) * k;
    world.camera.position.y += (ty - world.camera.position.y) * k;
    world.camera.position.z += (tz - world.camera.position.z) * k;
    world.camera.lookAt(p.x * 0.16, 1.02, p.z - 2.35);
  }

  function tick(now) {
    if (!cabinetOn()) { raf = 0; return; }
    const dt = Math.min(0.05, ((now - (lastTs || now)) || 16) / 1000);
    lastTs = now;
    if (!world) { raf = requestAnimationFrame(tick); return; }
    world.clock += dt;
    const t = world.clock;

    let moving = false;
    if (phase !== "reading") {
      let ix = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
      let iy = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
      const strafing = Math.abs(ix) > 0.12;
      const mag = Math.hypot(ix, iy);
      if (mag > 0.08) {
        if (mag > 1) { ix /= mag; iy /= mag; }
        const speed = 2.35 * dt;
        tryMove(ix * speed, -iy * speed);
        moving = true;
      }
      if (!strafing && !atTable()) {
        const pull = (0 - world.player.position.x) * Math.min(1, 3.2 * dt);
        if (!blocked(world.player.position.x + pull, world.player.position.z)) {
          world.player.position.x += pull;
        }
      }
      let face = iy < -0.2 ? 0 : Math.PI;
      if (atTable()) face = Math.PI;
      const spin = face - world.player.rotation.y;
      const wrap = ((spin + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      world.player.rotation.y += wrap * Math.min(1, 10 * dt);
    }

    tickGuest(world.player, world.camera, dt, moving);
    updateCamera(false);

    const glow = phase === "reading" ? 1.4 + Math.sin(t * 8) * 0.45 : 0.55 + Math.sin(t * 2.1) * 0.12;
    world.crystal.material.emissiveIntensity = glow;
    world.orb.intensity = 0.7 + glow;
    world.portrait.rotation.z = REDUCE ? 0 : Math.sin(Math.floor(t * 10) / 10 * 1.6) * 0.012;
    world.lantern.intensity = 1.25 + Math.sin(t * 3.2) * 0.12;

    if (phase === "reading") {
      readingT -= dt;
      if (readingT <= 0) sealTicket();
    }

    paintHud();
    world.renderer.render(world.scene, world.camera);
    raf = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (raf) return;
    lastTs = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    keys.w = keys.a = keys.s = keys.d = false;
  }

  function onKeyDown(e) {
    if (!cabinetOn()) return;
    const k = e.key.toLowerCase();
    if (k === "w" || e.code === "ArrowUp") { keys.w = true; e.preventDefault(); }
    if (k === "s" || e.code === "ArrowDown") { keys.s = true; e.preventDefault(); }
    if (k === "a" || e.code === "ArrowLeft") { keys.a = true; e.preventDefault(); }
    if (k === "d" || e.code === "ArrowRight") { keys.d = true; e.preventDefault(); }
    if (k === "e" || e.key === "Enter") {
      e.preventDefault();
      if (!e.repeat) {
        if (phase === "told") resetWalk();
        else askReading();
      }
    }
  }
  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k === "w" || e.code === "ArrowUp") keys.w = false;
    if (k === "s" || e.code === "ArrowDown") keys.s = false;
    if (k === "a" || e.code === "ArrowLeft") keys.a = false;
    if (k === "d" || e.code === "ArrowRight") keys.d = false;
  }

  function bindPad() {
    document.querySelectorAll("[data-fortune-walk]").forEach((b) => {
      const key = b.dataset.fortuneWalk;
      b.onpointerdown = (ev) => {
        ev.preventDefault();
        b.setPointerCapture(ev.pointerId);
        keys[key] = true;
      };
      b.onpointerup = b.onpointercancel = b.onlostpointercapture = () => { keys[key] = false; };
    });
  }

  function declareP0() {
    if (!PF.runKit) PF.runKit = {};
    PF.runKit.declared = PF.runKit.declared || {};
    PF.runKit.declared[GAME_ID] = P0_MOUNT;
    if (typeof PF.runKit.declare === "function") {
      try { PF.runKit.declare(GAME_ID, P0_MOUNT); } catch (_) { /* */ }
    }
  }

  function bind() {
    if (bound) return;
    bound = true;
    const go = () => {
      if (phase === "told") resetWalk();
      else askReading();
    };
    ["fortuneStart", "fortuneGo"].forEach((id) => {
      const b = el(id);
      if (b) b.addEventListener("click", go);
    });
    bindPad();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", () => { keys.w = keys.a = keys.s = keys.d = false; });
    window.addEventListener("resize", () => { if (cabinetOn()) resizeWorld(); });
    if (window.ResizeObserver && el("fortuneStage")) {
      new ResizeObserver(() => { if (cabinetOn()) resizeWorld(); }).observe(el("fortuneStage"));
    }
    const ch = el("fortuneChallenge");
    if (ch) {
      ch.addEventListener("click", async () => {
        const text = (el("fortuneChallengeText") && el("fortuneChallengeText").textContent) || "";
        if (kit && kit.copyText) kit.copyText(text, () => { const c = el("fortuneCopied"); if (c) c.hidden = false; });
      });
    }
  }

  PF.registerVendor({
    id: "fortune",
    playKey: "fortune",
    chalk: "Walk up. Sit. One penny, one ticket.",
    defaults: { bestFortuneRooms: 0, bestFortuneScore: 0 },
    bind,
    onLeave() {
      stopLoop();
      phase = "walk";
    },
    onShow() {
      declareP0();
      bind();
      ensureWorld();
      resetWalk();
      startLoop();
      requestAnimationFrame(() => { resizeWorld(); });
    },
    onReset() {
      stopLoop();
      resetWalk();
    },
  });
})();
