/* Cover-the-Spot — 3D gilding table. Desktop Grok owns this doorway.
 * PF only. Never booth/port 6000. Never Imagine downloads.
 * Native Three.js tent: round felt, falling brass, authored SPOTs then ENDLESS.
 * One coin = one run. Family-safe carnival. No casino. No Mirror Crew.
 * Aura lock: pigtails, yellow crown + heart, green pinafore, black shoes. */
import * as THREE from "../world/lib/three.module.min.js";

function boot() {
  const PF = window.PennyFever;
  if (!PF || !PF.registerVendor || !PF.kit) {
    requestAnimationFrame(boot);
    return;
  }
  mountStall(PF);
}
boot();

function mountStall(PF) {
  "use strict";
  const { $, kit } = PF;

  const GAME_ID = "coverspot";
  const AUTHORED_COUNT = 7;
  const CODA_ENABLED = true;
  const MISS_DEATH = 2;
  const TABLE_R = 1.10;
  const FELT_Y = 0.96;
  const SAMPLES = 168;
  const SETTLE_MS = 1600;
  const STAMP_MS = 720;
  const DEATH_HOLD_MS = 820;
  const REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const SKIN = 0xf0c4a8;
  const HAIR = 0x3d2418;
  const DRESS = 0x1e6b3c;
  const GOLD = 0xe8b84a;
  const HEART = 0xd22b3a;
  const BLOUSE = 0xf5f0ea;
  const WOOD = 0x3a2418;
  const WOOD_DARK = 0x1a100c;
  const BRASS = 0xd4a45a;
  const CARNIVAL_RED = 0xc41e3a;
  const FELT = 0x16351f;

  const geoBox = new THREE.BoxGeometry(1, 1, 1);
  const geoSphere = new THREE.SphereGeometry(1, 16, 12);
  const geoCyl = new THREE.CylinderGeometry(1, 1, 1, 20);
  const geoCylLoose = new THREE.CylinderGeometry(1, 1, 1, 12);
  const geoCone = new THREE.ConeGeometry(1, 1, 8);
  const geoTorus = new THREE.TorusGeometry(1, 0.08, 8, 28);
  const geoPlane = new THREE.PlaneGeometry(1, 1);
  const geoDisc = new THREE.CylinderGeometry(1, 1, 0.055, 28);
  const _hit = new THREE.Vector3();
  const _ndc = new THREE.Vector2();

  let run = null;
  let world = null;
  let loopRaf = 0;
  let idleClock = 0;
  let idleRoom = 1;
  let pointer = { x: 0, z: 0, on: false };
  let camPunch = 0;
  let camShake = 0;
  let lookX = 0;
  let lookZ = 0;
  let auraMood = "idle";
  let auraMoodUntil = 0;

  const AURA = {
    bust: "Aura: Spot uncovered. Greed ate the felt.",
    miss_table: "Aura: Disc bounced off the table. Rude.",
    well: "Aura: The well swallowed your brass. Cover the ring, sugar.",
    tug: "Aura: Cloth tugged. The red peeked. That’s the cheat.",
    cash: "Aura: Smart cover. Depth sticks — leave the rest.",
    clear: "Aura: Coverage locked. Next felt tells a different lie.",
    souvenir: "Aura: Seven spots. The felt ran out of authored lies.",
    coda: "Aura: Authored ride’s over. ENDLESS — the table keeps lying.",
    deep: (n) => `Aura: Spot ${n}. You're covering lies with skill.`,
    leave: "Aura: Left the table. The red circle stays.",
    bounce: "Aura: Ghost is the rest. They bounce — trust it.",
  };

  const AUTHORED = [
    {
      id: 1, name: "Honest Circle", kind: "circle",
      ratio: 0.72, targetPct: 70, maxDiscs: 4, drift: "none",
      spotR: 0.42, bounce: 1, scatter: 0, dropH: 1.18,
      clothJerk: 0.07, clothDelay: 80, clothCap: 0.055,
      barker: "Honest Circle. Drop on the red. After you let go, the cloth tugs — watch the peek. Cover 70%. Then cash out, or drop again.",
    },
    {
      id: 2, name: "Bounce Rest", kind: "circle",
      ratio: 0.70, targetPct: 72, maxDiscs: 4, drift: "none",
      spotR: 0.42, bounce: 2, scatter: 0.12, dropH: 1.48,
      clothJerk: 0.08, clothDelay: 90, clothCap: 0.06,
      barker: "Bounce Rest. Ghost is the rest. After release the cloth still tugs. Cover 72%.",
    },
    {
      id: 3, name: "Oval Blush", kind: "oval",
      ratio: 0.70, targetPct: 72, maxDiscs: 5, drift: "none",
      spotR: 0.36, ovalW: 1.38, ovalH: 0.70, ovalRot: 0.42,
      bounce: 1, scatter: 0, dropH: 1.18,
      clothJerk: 0.085, clothDelay: 80, clothCap: 0.07,
      barker: "Oval Blush. Round plates, oval spot. Cloth tugs after the drop. Cover the ears.",
    },
    {
      id: 4, name: "Walking Blush", kind: "drift",
      ratio: 0.70, targetPct: 74, maxDiscs: 5, drift: "slow",
      spotR: 0.38, driftRad: 0.28, driftPeriod: 5400,
      bounce: 1, scatter: 0, dropH: 1.18,
      clothJerk: 0.055, clothDelay: 80, clothCap: 0.05,
      barker: "Walking Blush. The red strolls. Discs stay. Cloth tugs on release. Hold the cover.",
    },
    {
      id: 5, name: "Twin Lanterns", kind: "twin",
      ratio: 0.72, targetPct: 70, maxDiscs: 5, drift: "none",
      spotR: 0.42, twinSep: 0.62, twinR: 0.22,
      bounce: 1, scatter: 0, dropH: 1.18,
      clothJerk: 0.065, clothDelay: 80, clothCap: 0.055,
      barker: "Twin Lanterns. Two reds — each must hit 70%. The % is honest. Middle dump is a lie.",
    },
    {
      id: 6, name: "The Well", kind: "ring",
      ratio: 0.56, targetPct: 72, maxDiscs: 5, drift: "none",
      spotR: 0.48, innerRatio: 0.46,
      bounce: 1, scatter: 0, dropH: 1.22,
      clothJerk: 0.05, clothDelay: 80, clothCap: 0.05,
      barker: "The Well. Cover the RING. Center eats brass. Cloth still tugs after you drop.",
    },
    {
      id: 7, name: "Stamp Night", kind: "blob",
      ratio: 0.72, targetPct: 85, maxDiscs: 6, drift: "jitter",
      spotR: 0.36, blobA: 0.34, blobB: 0.22, blobPhase: 0.6,
      stampAmp: 0.14, stampMs: 520, bounce: 1, scatter: 0.04, dropH: 1.22,
      clothJerk: 0.1, clothDelay: 70, clothCap: 0.08,
      barker: "Stamp Night. Cloth tugs, then the blob hops, then the table slams. Keep the cover.",
    },
  ];

  const P0_MOUNT = {
    engine: "GreedFloor",
    displayName: "Cover-the-Spot",
    depthUnit: "Spot",
    sheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
    batchSheet: "GOBLIN_BATCH02_BUILD_SHEETS.md",
    cashOut: true,
    codaEnabled: CODA_ENABLED,
    authoredCount: AUTHORED_COUNT,
  };

  const DEPTH_COPY = {
    tag: "DEPTH RUN · 7 authored SPOTs · cash out between spots · ENDLESS after Stamp Night",
    body: "Round gilding table: Honest Circle → Bounce Rest → Oval Blush → Walking Blush → Twin Lanterns → The Well → Stamp Night. Drop brass. After release the cloth tugs — the % is honest. Cover, then CASH OUT or DROP AGAIN.",
    status: "Tap START or the table · 1 demo coin · move to aim · tap / Space to drop",
    machine: "Gilding table · 1 demo coin · authored SPOTs",
    punch: "Depth run — tap START or the table. One coin. Cover the red.",
  };

  function rk() { return PF.runKit || null; }
  function card() { return $("coverSpotCard"); }
  function setStatus(text) {
    const el = $("coverSpotStatus");
    if (el) el.textContent = text;
  }
  function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function cabinetOn() {
    const node = document.getElementById("cabinet-cover-the-spot");
    return !!(node && !node.hidden);
  }
  function isLive() {
    return !!(run && !run.done && !run.dying && run.kitRun && run.kitRun.alive !== false);
  }
  function pokeDepth() {
    if (typeof PF.refreshDepth === "function") {
      try { PF.refreshDepth(); } catch (_) { /* ignore */ }
    }
  }

  function coverspotCoda(n) {
    const stage = Math.max(AUTHORED_COUNT + 1, n | 0);
    const t = stage - AUTHORED_COUNT;
    return {
      id: stage,
      name: `Felt Greed ${stage}`,
      kind: "blob",
      coda: true,
      ratio: Math.max(0.42, 0.56 - 0.02 * t),
      targetPct: Math.min(94, 85 + t),
      maxDiscs: 6,
      drift: "jitter",
      spotR: Math.max(0.26, 0.36 - t * 0.012),
      blobA: 0.28,
      blobB: 0.16,
      blobPhase: 0.35 + stage * 0.17,
      stampAmp: Math.min(0.22, 0.12 + t * 0.012),
      stampMs: Math.max(320, 500 - t * 14),
      bounce: 1,
      scatter: Math.min(0.1, 0.03 + t * 0.008),
      dropH: 1.22,
      clothJerk: Math.min(0.12, 0.09 + t * 0.008),
      clothDelay: Math.max(60, 80 - t * 3),
      clothCap: Math.min(0.1, 0.06 + t * 0.006),
      barker: `ENDLESS · Felt Greed ${stage}. Authored ride ended. Smaller plates. Cloth still tugs.`,
    };
  }

  function hydrate(level) {
    const spec = Object.assign({ coda: false, bounce: 1, scatter: 0, dropH: 1.18 }, level);
    spec.spotR = spec.spotR || 0.42;
    spec.ovalW = spec.ovalW || 1.3;
    spec.ovalH = spec.ovalH == null ? 1 : spec.ovalH;
    spec.ovalRot = spec.ovalRot || 0;
    spec.innerRatio = spec.innerRatio == null ? 0.46 : spec.innerRatio;
    spec.twinSep = spec.twinSep == null ? 0.62 : spec.twinSep;
    spec.twinR = spec.twinR == null ? spec.spotR * 0.52 : spec.twinR;
    spec.blobA = spec.blobA == null ? 0 : spec.blobA;
    spec.blobB = spec.blobB == null ? 0 : spec.blobB;
    spec.blobPhase = spec.blobPhase == null ? 0 : spec.blobPhase;
    spec.driftRad = spec.driftRad == null ? 0.26 : spec.driftRad;
    spec.driftPeriod = spec.driftPeriod == null ? 5200 : spec.driftPeriod;
    spec.stampAmp = spec.stampAmp == null ? 0.12 : spec.stampAmp;
    spec.stampMs = spec.stampMs == null ? 500 : spec.stampMs;
    spec.r = spec.ratio * (spec.kind === "twin" ? spec.twinR : spec.spotR);
    spec.clothJerk = spec.clothJerk == null ? 0.07 : spec.clothJerk;
    spec.clothDelay = spec.clothDelay == null ? 80 : spec.clothDelay;
    spec.clothCap = spec.clothCap == null ? 0.06 : spec.clothCap;
    spec.title = spec.coda ? `ENDLESS · ${spec.name}` : spec.name;
    spec.enter = spec.barker || spec.name;
    return spec;
  }

  function coverspotStageParams(n) {
    const stage = Math.max(1, n | 0);
    if (stage <= AUTHORED_COUNT) return hydrate(AUTHORED[stage - 1]);
    if (!CODA_ENABLED) return null;
    return hydrate(coverspotCoda(stage));
  }

  function attractSpec() {
    return coverspotStageParams(((idleRoom - 1) % AUTHORED_COUNT) + 1);
  }

  function liveSpec() {
    if (run && run.spec) return run.spec;
    return attractSpec();
  }

  function hudStageLine(spec) {
    if (!spec) return "SPOT 0";
    if (spec.coda) return `ENDLESS · SPOT ${spec.id} · ${spec.name}`;
    return `SPOT ${spec.id} · ${spec.name}`;
  }

  function declareP0() {
    const kitRun = rk();
    if (!kitRun || typeof kitRun.declare !== "function") return;
    try { kitRun.declare(GAME_ID, P0_MOUNT); } catch (_) { /* already */ }
    kitRun.p0 = kitRun.p0 || {};
    kitRun.p0[GAME_ID] = Object.assign({
      stageParams: coverspotStageParams,
      codaParams: coverspotCoda,
      authored: AUTHORED,
      codaEnabled: CODA_ENABLED,
      authoredCount: AUTHORED_COUNT,
    }, P0_MOUNT);
    kitRun.mounted = kitRun.mounted || {};
    kitRun.mounted[GAME_ID] = true;
  }

  function mat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color,
      roughness: 0.72,
      metalness: 0.08,
    }, extra || {}));
  }

  function srgb(tex) {
    if (tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  function canvasTex(w, h, draw, repeatX, repeatY) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    srgb(t);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX || 1, repeatY || 1);
    t.anisotropy = 4;
    return t;
  }

  function feltTex() {
    return canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#14321c";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 1400; i += 1) {
        ctx.fillStyle = i % 5 === 0 ? "rgba(30,80,42,0.55)" : "rgba(10,24,14,0.35)";
        ctx.fillRect((Math.random() * 256) | 0, (Math.random() * 256) | 0, 2, 2);
      }
      ctx.strokeStyle = "rgba(212,164,90,0.08)";
      ctx.beginPath();
      ctx.arc(128, 128, 110, 0, Math.PI * 2);
      ctx.stroke();
    }, 1, 1);
  }

  function woodTex() {
    return canvasTex(128, 128, (ctx) => {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = "rgba(212,164,90,0.12)";
      for (let i = 0; i < 10; i += 1) ctx.fillRect(i * 13, 0, 3, 128);
    }, 2, 2);
  }

  function stripeTex() {
    return canvasTex(64, 64, (ctx) => {
      ctx.fillStyle = "#c41e3a";
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = "#f0d09a";
      ctx.fillRect(0, 0, 32, 64);
    }, 6, 1);
  }

  function signTex(title, sub) {
    return canvasTex(512, 160, (ctx) => {
      ctx.fillStyle = "#2a140e";
      ctx.fillRect(0, 0, 512, 160);
      ctx.strokeStyle = "#d4a45a";
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 492, 140);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "bold 42px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(title, 256, 72);
      ctx.font = "22px Georgia, serif";
      ctx.fillStyle = "#e8c48a";
      ctx.fillText(sub, 256, 118);
    }, 1, 1);
  }

  function stampTex(label) {
    return canvasTex(256, 128, (ctx) => {
      ctx.clearRect(0, 0, 256, 128);
      ctx.translate(128, 64);
      ctx.rotate(-0.16);
      ctx.strokeStyle = "rgba(196,30,58,0.95)";
      ctx.lineWidth = 8;
      ctx.strokeRect(-110, -42, 220, 84);
      ctx.fillStyle = "rgba(196,30,58,0.92)";
      ctx.font = "bold 48px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label || "BUST", 0, 2);
    }, 1, 1);
  }

  function addMesh(parent, geo, material, x, y, z, sx, sy, sz) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x || 0, y || 0, z || 0);
    if (sx != null) m.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
    parent.add(m);
    return m;
  }

  function makeAura() {
    const g = new THREE.Group();
    const skin = mat(SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
    const blouse = mat(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.2 });
    const dress = mat(DRESS, { emissive: 0x0a2010, emissiveIntensity: 0.25 });
    const dark = mat(0x111111, { roughness: 0.45 });
    const hip = new THREE.Group();
    hip.position.y = 0.42;
    g.add(hip);
    addMesh(hip, geoCylLoose, blouse, 0, 0.28, 0, 0.13, 0.28, 0.13);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.32, 12), dress);
    skirt.position.y = 0.06;
    hip.add(skirt);
    const heart = addMesh(hip, geoBox, mat(HEART, { emissive: HEART, emissiveIntensity: 0.55 }), 0, 0.22, 0.16, 0.09, 0.09, 0.04);
    heart.rotation.z = Math.PI / 4;
    const head = new THREE.Group();
    head.position.y = 0.58;
    hip.add(head);
    addMesh(head, geoSphere, skin, 0, 0.02, 0, 0.175);
    const eyeW = mat(0xf7f2ea);
    const eyeD = mat(0x2a1810);
    [-1, 1].forEach((side) => {
      const white = addMesh(head, geoSphere, eyeW, side * 0.055, 0.03, 0.15, 0.038);
      white.scale.set(0.038, 0.044, 0.02);
      addMesh(head, geoSphere, eyeD, side * 0.055, 0.03, 0.168, 0.02);
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), mat(0xc45a6a));
    smile.position.set(0, -0.05, 0.16);
    smile.rotation.x = 2.6;
    head.add(smile);
    const hairM = mat(HAIR, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });
    addMesh(head, geoSphere, hairM, 0, 0.06, -0.02, 0.23);
    [-1, 1].forEach((side) => {
      addMesh(head, geoSphere, hairM, side * 0.2, -0.04, 0.04, 0.11);
      addMesh(head, geoSphere, mat(HEART, { emissive: HEART, emissiveIntensity: 0.6 }), side * 0.2, 0.06, 0.06, 0.045);
    });
    addMesh(head, geoBox, hairM, 0, 0.14, 0.16, 0.28, 0.07, 0.1);
    const crown = new THREE.Group();
    crown.position.y = 0.24;
    head.add(crown);
    const gold = mat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
    crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold));
    [-0.09, 0, 0.09].forEach((x, i) => {
      const h = i === 1 ? 0.14 : 0.09;
      addMesh(crown, geoCone, gold, x, h * 0.45, 0, 0.035, h, 0.035);
    });
    const gem = addMesh(crown, geoBox, mat(HEART, { emissive: HEART, emissiveIntensity: 0.7 }), 0, 0.02, 0.11, 0.055, 0.055, 0.025);
    gem.rotation.z = Math.PI / 4;
    function limb(side, arm) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0.0, 0);
      const len = arm ? 0.28 : 0.34;
      const rad = arm ? 0.035 : 0.042;
      addMesh(pivot, geoCylLoose, arm ? skin : dress, 0, -len / 2, 0, rad, len, rad);
      if (!arm) addMesh(pivot, geoBox, dark, 0, -len - 0.02, 0.03, 0.08, 0.05, 0.12);
      else addMesh(pivot, geoSphere, skin, 0, -len, 0, 0.04);
      hip.add(pivot);
      return pivot;
    }
    g.userData = {
      kind: "aura", t: 0, hip, head, crown,
      armL: limb(-1, true), armR: limb(1, true),
      legL: limb(-1, false), legR: limb(1, false),
    };
    return g;
  }

  function makeDiscMesh(ghost) {
    const g = new THREE.Group();
    const brass = ghost
      ? new THREE.MeshStandardMaterial({
        color: GOLD, metalness: 0.55, roughness: 0.35, transparent: true, opacity: 0.58,
        emissive: 0x6a4808, emissiveIntensity: 0.45, depthWrite: false,
      })
      : mat(BRASS, { metalness: 0.72, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.42 });
    const body = new THREE.Mesh(geoDisc, brass);
    g.add(body);
    const rim = new THREE.Mesh(geoTorus, brass);
    rim.scale.set(1, 1, 0.55);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.01;
    g.add(rim);
    if (!ghost) {
      const face = new THREE.Mesh(
        geoPlane,
        new THREE.MeshBasicMaterial({ color: 0xf0d09a, transparent: true, opacity: 0.18 })
      );
      face.rotation.x = -Math.PI / 2;
      face.position.y = 0.03;
      face.scale.set(1.6, 1.6, 1);
      g.add(face);
    }
    g.userData.brass = brass;
    return g;
  }

  function blobRadius(spec, ang) {
    return spec.spotR * (1
      + spec.blobA * Math.sin(ang * 3 + spec.blobPhase)
      + spec.blobB * Math.cos(ang * 5 + spec.blobPhase * 1.7));
  }

  function bakeSamples(spec) {
    const out = [];
    function gridDisk(cx, cz, r, part, inner) {
      const step = Math.max(0.015, r / 18);
      const r2 = r * r;
      const inner2 = inner ? inner * inner : 0;
      for (let x = cx - r; x <= cx + r + 1e-6; x += step) {
        for (let z = cz - r; z <= cz + r + 1e-6; z += step) {
          const dx = x - cx;
          const dz = z - cz;
          const d2 = dx * dx + dz * dz;
          if (d2 > r2) continue;
          if (inner2 && d2 < inner2) continue;
          out.push({ x, z, part });
        }
      }
    }
    if (spec.kind === "twin") {
      gridDisk(-spec.twinSep * 0.5, 0, spec.twinR, 0, 0);
      gridDisk(spec.twinSep * 0.5, 0, spec.twinR, 1, 0);
    } else if (spec.kind === "oval") {
      const rx = spec.spotR * spec.ovalW;
      const rz = spec.spotR * spec.ovalH;
      const step = Math.max(0.015, spec.spotR / 18);
      const c = Math.cos(spec.ovalRot);
      const s = Math.sin(spec.ovalRot);
      const reach = Math.max(rx, rz);
      for (let x = -reach; x <= reach + 1e-6; x += step) {
        for (let z = -reach; z <= reach + 1e-6; z += step) {
          const lx = x * c + z * s;
          const lz = -x * s + z * c;
          if ((lx * lx) / (rx * rx) + (lz * lz) / (rz * rz) <= 1) out.push({ x, z, part: 0 });
        }
      }
    } else if (spec.kind === "ring") {
      gridDisk(0, 0, spec.spotR, 0, spec.spotR * spec.innerRatio);
    } else if (spec.kind === "blob") {
      const reach = spec.spotR * 1.42;
      const step = Math.max(0.015, spec.spotR / 18);
      for (let x = -reach; x <= reach + 1e-6; x += step) {
        for (let z = -reach; z <= reach + 1e-6; z += step) {
          if (Math.hypot(x, z) <= blobRadius(spec, Math.atan2(z, x))) out.push({ x, z, part: 0 });
        }
      }
    } else {
      gridDisk(0, 0, spec.spotR, 0, 0);
    }
    return out;
  }

  function originAt(spec, t) {
    const o = { x: 0, z: 0 };
    if (!spec) return o;
    if (spec.drift === "slow" || spec.kind === "drift") {
      const a = (t / spec.driftPeriod) * Math.PI * 2;
      o.x = Math.cos(a) * spec.driftRad;
      o.z = Math.sin(a * 0.85) * spec.driftRad * 0.72;
    } else if (spec.drift === "jitter") {
      const phase = stampPhase(spec, t);
      if (phase.hopping) {
        const u = (t % (spec.stampMs + 900)) / spec.stampMs;
        o.x = Math.sin(u * 17.2) * spec.stampAmp;
        o.z = Math.cos(u * 13.7) * spec.stampAmp * 0.8;
      }
    }
    return o;
  }

  function stampPhase(spec, t) {
    if (!spec || spec.drift !== "jitter") return { hopping: false, hold: false, slam: false };
    const hold = 720;
    const slam = 380;
    const period = spec.stampMs + hold + slam;
    const cycle = t % period;
    if (cycle < spec.stampMs) return { hopping: true, hold: false, slam: false };
    if (cycle < spec.stampMs + hold) return { hopping: false, hold: true, slam: false };
    return { hopping: false, hold: false, slam: true };
  }

  function settleOf(x, z, spec) {
    if (!spec || !spec.scatter) return { x, z };
    const n = Math.sin(x * 19.19 + z * 47.13) * 43758.5453;
    const f = n - Math.floor(n);
    const a = f * Math.PI * 2;
    const n2 = Math.sin(z * 12.3 + x * 4.7) * 23421.1;
    const m = spec.scatter * (0.55 + (n2 - Math.floor(n2)) * 0.45);
    return { x: x + Math.cos(a) * m, z: z + Math.sin(a) * m };
  }

  function inWell(x, z, spec, origin) {
    if (!spec || spec.kind !== "ring") return false;
    const inner = spec.spotR * spec.innerRatio;
    return Math.hypot(x - origin.x, z - origin.z) < inner * 0.92;
  }

  function onTable(x, z, r) {
    return Math.hypot(x, z) <= TABLE_R - (r || 0) * 0.25;
  }

  function clothOrigin() {
    const o = (run && run.origin) || { x: 0, z: 0 };
    return {
      x: o.x + ((run && run.clothX) || 0),
      z: o.z + ((run && run.clothZ) || 0),
    };
  }

  function coverageNow() {
    if (!run || !run.samples) return { pct: 0, parts: [0], peek: [] };
    const discs = run.discs.filter((d) => !d.trapped && (d.alt || 0) < 0.05);
    const origin = clothOrigin();
    const partsHit = [0, 0];
    const partsTot = [0, 0];
    const peek = [];
    let hit = 0;
    for (let i = 0; i < run.samples.length; i += 1) {
      const s = run.samples[i];
      const wx = origin.x + s.x;
      const wz = origin.z + s.z;
      partsTot[s.part] += 1;
      let covered = false;
      for (let d = 0; d < discs.length; d += 1) {
        const rr = discs[d].r;
        const dx = wx - discs[d].x;
        const dz = wz - discs[d].z;
        if (dx * dx + dz * dz <= rr * rr) {
          covered = true;
          break;
        }
      }
      if (covered) {
        hit += 1;
        partsHit[s.part] += 1;
      } else if (peek.length < 90) {
        peek.push(wx, FELT_Y + 0.035, wz);
      }
    }
    const parts = [];
    if (partsTot[0]) parts.push(partsHit[0] / partsTot[0]);
    if (partsTot[1]) parts.push(partsHit[1] / partsTot[1]);
    const pct = specKindTwin()
      ? (parts.length ? Math.min.apply(null, parts) : 0)
      : (run.samples.length ? hit / run.samples.length : 0);
    return { pct, parts, peek, hit, total: run.samples.length };
  }

  function specKindTwin() {
    return !!(run && run.spec && run.spec.kind === "twin");
  }

  function hitTarget(spec, cover) {
    if (!spec || !cover) return false;
    const need = spec.targetPct / 100;
    if (spec.kind === "twin") {
      return cover.parts.length >= 2 && cover.parts.every((p) => p >= need);
    }
    return cover.pct >= need;
  }

  function makeSpotShapes(spec, origin) {
    if (spec.kind === "twin") {
      return [
        { kind: "circle", x: origin.x - spec.twinSep * 0.5, z: origin.z, r: spec.twinR },
        { kind: "circle", x: origin.x + spec.twinSep * 0.5, z: origin.z, r: spec.twinR },
      ];
    }
    if (spec.kind === "oval") {
      return [{ kind: "oval", x: origin.x, z: origin.z, rx: spec.spotR * spec.ovalW, rz: spec.spotR * spec.ovalH, rot: spec.ovalRot }];
    }
    if (spec.kind === "ring") {
      return [{ kind: "ring", x: origin.x, z: origin.z, r: spec.spotR, inner: spec.spotR * spec.innerRatio }];
    }
    if (spec.kind === "blob") {
      return [{ kind: "blob", x: origin.x, z: origin.z, r: spec.spotR, a: spec.blobA, b: spec.blobB, phase: spec.blobPhase }];
    }
    return [{ kind: "circle", x: origin.x, z: origin.z, r: spec.spotR }];
  }

  function rebuildSpots(spec, shapes) {
    if (!world) return;
    const g = world.spots;
    while (g.children.length) g.remove(g.children[0]);
    const red = mat(CARNIVAL_RED, {
      emissive: CARNIVAL_RED, emissiveIntensity: 0.7, roughness: 0.45, metalness: 0.08,
      transparent: true, opacity: 0.92,
    });
    world.spotMat = red;
    shapes.forEach((shape) => {
      const node = new THREE.Group();
      if (shape.kind === "ring") {
        const torus = new THREE.Mesh(new THREE.TorusGeometry(shape.r * 0.74, (shape.r - shape.inner) * 0.42, 10, 36), red);
        torus.rotation.x = Math.PI / 2;
        node.add(torus);
        const well = new THREE.Mesh(
          new THREE.CylinderGeometry(shape.inner, shape.inner * 0.7, 0.85, 20, 1, true),
          mat(0x080204, { roughness: 1, side: THREE.DoubleSide })
        );
        well.position.y = -0.4;
        node.add(well);
        const pit = new THREE.PointLight(0xc41e3a, 1.4, 1.8, 2);
        pit.position.y = -0.35;
        node.add(pit);
        world.well = well;
      } else if (shape.kind === "blob") {
        addMesh(node, geoCyl, red, 0, 0.012, 0, shape.r, 0.02, shape.r);
        for (let i = 0; i < 5; i += 1) {
          const bump = addMesh(node, geoSphere, red, 0, 0.02, 0, shape.r * 0.28);
          bump.userData.i = i;
          node.add(bump);
        }
      } else if (shape.kind === "oval") {
        const m = addMesh(node, geoCyl, red, 0, 0.012, 0, 1, 0.02, 1);
        m.scale.set(shape.rx, 0.02, shape.rz);
        m.rotation.y = shape.rot || 0;
      } else {
        addMesh(node, geoCyl, red, 0, 0.012, 0, shape.r, 0.02, shape.r);
      }
      node.position.set(shape.x, FELT_Y + 0.02, shape.z);
      g.add(node);
    });
    g.userData.kind = spec.kind;
    world.wellOn = spec.kind === "ring";
    if (world.wellCover) world.wellCover.visible = spec.kind === "ring";
  }

  function syncSpots(spec, t) {
    if (!world || !spec) return;
    const origin = run && isLive() ? clothOrigin() : originAt(spec, t);
    const shapes = makeSpotShapes(spec, origin);
    if (world.spots.userData.kind !== spec.kind || world.spots.children.length !== shapes.length) {
      rebuildSpots(spec, shapes);
    }
    world.spots.children.forEach((node, i) => {
      const shape = shapes[i];
      if (!shape) return;
      node.position.set(shape.x, FELT_Y + 0.02, shape.z);
      if (shape.kind === "blob") {
        node.children.forEach((ch) => {
          if (ch.userData && ch.userData.i != null) {
            const a = t * 0.004 + ch.userData.i * 1.26 + spec.blobPhase;
            const rad = blobRadius(spec, a) * 0.72;
            ch.position.set(Math.cos(a) * rad, 0.03, Math.sin(a) * rad);
          }
        });
      }
    });
    if (world.spotMat) {
      const cov = run && isLive() ? run.coverage : 0;
      const hot = hitTarget(spec, run && run.cover);
      world.spotMat.emissiveIntensity = 0.45 + cov * 0.9;
      world.spotMat.color.setHex(hot ? 0xd4a45a : CARNIVAL_RED);
      world.spotMat.emissive.setHex(hot ? GOLD : CARNIVAL_RED);
    }
    if (world.coverRing) {
      const cov = run && isLive() ? run.coverage : 0;
      world.coverRing.material.color.setHex(cov >= (spec.targetPct / 100) ? 0x7ad0a0 : CARNIVAL_RED);
      world.coverRing.scale.set(1, 1, 1);
      world.coverFill.visible = false;
    }
  }

  function syncDiscs(spec) {
    if (!world) return;
    const discs = (run && run.discs) || [];
    world.discPool.forEach((m, i) => {
      const d = discs[i];
      if (!d) { m.visible = false; return; }
      m.visible = true;
      m.position.set(d.x, FELT_Y + 0.04 + (d.alt || 0), d.z);
      m.scale.setScalar(d.r);
      m.rotation.y = d.spin || 0;
      m.rotation.x = d.falling ? 0.22 : 0;
      m.rotation.z = d.trapped ? 0.4 : 0;
    });
    const ghost = world.ghost;
    const aiming = isLive() && !run.awaiting && !run.dying && pointer.on;
    ghost.visible = !!aiming;
    if (aiming && spec) {
      const rest = settleOf(pointer.x, pointer.z, spec);
      ghost.position.set(rest.x, FELT_Y + 0.08, rest.z);
      ghost.scale.setScalar(spec.r);
      const ok = onTable(rest.x, rest.z, spec.r) && !inWell(rest.x, rest.z, spec, clothOrigin());
      ghost.userData.brass.color.setHex(ok ? GOLD : CARNIVAL_RED);
      ghost.userData.brass.opacity = run.busy ? 0.28 : (ok ? 0.62 : 0.7);
    }
    const left = spec && run && isLive() ? Math.max(0, spec.maxDiscs - run.discs.length) : (spec ? spec.maxDiscs : 4);
    world.rackDiscs.forEach((m, i) => { m.visible = i < left; });
  }

  function burstSparks(x, z, color) {
    if (!world || !world.sparks) return;
    world.sparks.userData.bursts.push({ x, y: FELT_Y + 0.12, z, t: 0, color: color || 0xf0d09a });
  }

  function resizeWorld() {
    if (!world) return;
    const wrap = $("coverSpotWorld") || $("coverSpotCanvas");
    if (!wrap) return;
    const w = Math.max(16, wrap.clientWidth || wrap.offsetWidth || 960);
    const h = Math.max(16, wrap.clientHeight || wrap.offsetHeight || 720);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
    world.renderer.setSize(w, h, false);
    world.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  }

  function buildWorld(canvas) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0608, 0.048);
    scene.background = new THREE.Color(0x0a0608);
    const camera = new THREE.PerspectiveCamera(46, 1, 0.08, 40);
    camera.position.set(0, 3.62, 1.58);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: (window.devicePixelRatio || 1) < 1.7,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x0a0608, 1);
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (THREE.ACESFilmicToneMapping) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    const shadows = window.innerWidth > 720 && !REDUCE;
    if (shadows) {
      renderer.shadowMap.enabled = true;
      if (THREE.PCFSoftShadowMap) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    scene.add(new THREE.AmbientLight(0x4a382c, 0.74));
    scene.add(new THREE.HemisphereLight(0xc4a070, 0x1a100c, 0.58));
    const key = new THREE.SpotLight(0xffd090, 7.4, 14, 0.58, 0.45, 1.2);
    key.position.set(0.15, 4.3, 2.0);
    key.target.position.set(0, FELT_Y, 0);
    scene.add(key);
    scene.add(key.target);
    if (shadows) {
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
    }
    const fill = new THREE.DirectionalLight(0x8aa4cc, 0.3);
    fill.position.set(-3, 4, -2);
    scene.add(fill);

    const wood = mat(WOOD, { map: woodTex(), roughness: 0.82 });
    const canvasM = mat(0xc45a6a, { map: stripeTex(), roughness: 0.88, side: THREE.DoubleSide });
    const feltM = mat(FELT, { map: feltTex(), roughness: 0.94 });
    const brass = mat(GOLD, { metalness: 0.7, roughness: 0.32, emissive: 0x4a3008, emissiveIntensity: 0.2 });

    const floor = new THREE.Mesh(geoPlane, mat(0x1a100c, { roughness: 0.95 }));
    floor.rotation.x = -Math.PI / 2;
    floor.scale.set(16, 16, 1);
    floor.receiveShadow = true;
    scene.add(floor);

    const tent = new THREE.Group();
    scene.add(tent);
    for (let i = 0; i < 6; i += 1) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 4.4), canvasM);
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      wall.position.set(Math.sin(a) * 4.15, 2.15, Math.cos(a) * 4.15);
      wall.lookAt(0, 2.15, 0);
      tent.add(wall);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.1, 2.1, 6), canvasM);
    roof.position.y = 5.15;
    tent.add(roof);
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      addMesh(tent, geoCylLoose, wood, Math.sin(a) * 3.85, 2.1, Math.cos(a) * 3.85, 0.07, 4.2, 0.07);
    }

    const table = new THREE.Group();
    scene.add(table);
    addMesh(table, geoCyl, wood, 0, 0.46, 0, 0.22, 0.88, 0.22);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.12, 36), wood);
    top.position.y = 0.88;
    top.castShadow = true;
    top.receiveShadow = true;
    table.add(top);
    const cloth = new THREE.Group();
    cloth.position.y = FELT_Y;
    table.add(cloth);
    const felt = new THREE.Mesh(new THREE.CylinderGeometry(TABLE_R, TABLE_R, 0.03, 40), feltM);
    felt.receiveShadow = true;
    cloth.add(felt);
    const rippleGeo = new THREE.CircleGeometry(TABLE_R * 0.98, 28);
    const rippleBase = Float32Array.from(rippleGeo.attributes.position.array);
    const ripple = new THREE.Mesh(rippleGeo, feltM);
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.y = 0.018;
    ripple.receiveShadow = true;
    cloth.add(ripple);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(TABLE_R + 0.04, 0.035, 8, 40), brass);
    rail.rotation.x = Math.PI / 2;
    rail.position.y = FELT_Y + 0.01;
    table.add(rail);
    const tugCord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8),
      mat(0x5a3a18, { roughness: 0.7 })
    );
    tugCord.position.set(TABLE_R + 0.12, FELT_Y + 0.04, 0);
    tugCord.rotation.z = Math.PI / 2;
    tugCord.visible = false;
    scene.add(tugCord);
    const tugBanner = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 0.38),
      new THREE.MeshBasicMaterial({ map: stampTex("CLOTH TUG"), transparent: true, depthWrite: false })
    );
    tugBanner.position.set(0, FELT_Y + 0.55, 0.2);
    tugBanner.rotation.x = -0.35;
    tugBanner.visible = false;
    scene.add(tugBanner);

    const wellCover = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 20),
      new THREE.MeshBasicMaterial({ color: 0x080204 })
    );
    wellCover.rotation.x = -Math.PI / 2;
    wellCover.position.y = FELT_Y + 0.018;
    wellCover.visible = false;
    scene.add(wellCover);

    const coverRing = new THREE.Mesh(new THREE.TorusGeometry(TABLE_R + 0.08, 0.018, 8, 40), new THREE.MeshBasicMaterial({ color: CARNIVAL_RED }));
    coverRing.rotation.x = Math.PI / 2;
    coverRing.position.y = FELT_Y + 0.03;
    scene.add(coverRing);
    const coverFill = new THREE.Mesh(
      new THREE.CircleGeometry(TABLE_R * 0.92, 32),
      new THREE.MeshBasicMaterial({ color: 0xc41e3a, transparent: true, opacity: 0.12, depthWrite: false })
    );
    coverFill.rotation.x = -Math.PI / 2;
    coverFill.position.y = FELT_Y + 0.016;
    scene.add(coverFill);

    const lanterns = [];
    [[-1.45, 2.58, 0.15], [1.4, 2.64, -0.35], [0.08, 2.9, -1.25]].forEach((p, i) => {
      const lamp = new THREE.Group();
      lamp.position.set(p[0], p[1], p[2]);
      addMesh(lamp, geoSphere, new THREE.MeshBasicMaterial({ color: 0xffe2a0 }), 0, 0, 0, 0.09);
      addMesh(lamp, geoCylLoose, brass, 0, 0, 0, 0.11, 0.16, 0.1);
      const light = new THREE.PointLight(0xffd090, 1.65, 6.5, 2);
      lamp.add(light);
      scene.add(lamp);
      lanterns.push({ lamp, light, phase: i * 1.7 });
    });

    for (let i = 0; i < 18; i += 1) {
      const u = i / 17;
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 6),
        new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xc41e3a : i % 3 === 1 ? 0xf0d09a : 0x3d8a6a })
      );
      bulb.position.set((u - 0.5) * 4.4, 3.15 + Math.sin(u * Math.PI) * 0.18, -2.35);
      scene.add(bulb);
    }

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.35, 0.58),
      new THREE.MeshBasicMaterial({ map: signTex("COVER THE SPOT", "MOVE · TAP / SPACE TO DROP") })
    );
    sign.position.set(0, 2.58, -2.08);
    scene.add(sign);

    const how = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 0.72),
      new THREE.MeshBasicMaterial({ map: signTex("ONE DISC", "NEVER COVERS") })
    );
    how.position.set(-2.15, 1.55, -0.35);
    how.rotation.y = 0.7;
    scene.add(how);

    const poster = new THREE.Mesh(geoPlane, new THREE.MeshBasicMaterial({ color: 0x3a2418 }));
    poster.position.set(-2.35, 1.72, -1.55);
    poster.scale.set(1.55, 1.12, 1);
    poster.rotation.y = 0.55;
    scene.add(poster);
    try {
      new THREE.TextureLoader().load("assets/prepared/cover-the-spot.webp", (tex) => {
        srgb(tex);
        poster.material.map = tex;
        poster.material.needsUpdate = true;
      });
    } catch (_) { /* optional art */ }

    const shelf = new THREE.Group();
    shelf.position.set(1.95, 1.12, -1.62);
    shelf.rotation.y = -0.5;
    scene.add(shelf);
    addMesh(shelf, geoBox, wood, 0, 0, 0, 1.2, 0.06, 0.34);
    addMesh(shelf, geoBox, wood, 0, 0.42, 0, 1.2, 0.06, 0.34);
    const bear = new THREE.Group();
    addMesh(bear, geoSphere, mat(0x8a6230), 0, 0.22, 0, 0.12);
    addMesh(bear, geoSphere, mat(0x8a6230), 0, 0.36, 0.02, 0.09);
    bear.position.set(-0.28, 0.06, 0);
    shelf.add(bear);
    addMesh(shelf, geoCyl, brass, 0.22, 0.14, 0, 0.07, 0.16, 0.07);
    addMesh(shelf, geoSphere, mat(CARNIVAL_RED, { emissive: 0x4a0810, emissiveIntensity: 0.3 }), 0.48, 0.16, 0.02, 0.08);

    const aura = makeAura();
    aura.position.set(1.22, 0, -1.28);
    aura.rotation.y = Math.PI * 0.14;
    scene.add(aura);

    const rack = new THREE.Group();
    rack.position.set(-1.38, 0.92, 0.55);
    rack.rotation.y = 0.55;
    scene.add(rack);
    addMesh(rack, geoBox, wood, 0, 0, 0, 0.72, 0.05, 0.28);
    const rackDiscs = [];
    for (let i = 0; i < 6; i += 1) {
      const d = makeDiscMesh(false);
      d.scale.setScalar(0.16);
      d.position.set(-0.22 + i * 0.09, 0.05, 0);
      rack.add(d);
      rackDiscs.push(d);
    }

    const spots = new THREE.Group();
    scene.add(spots);
    const discPool = [];
    for (let i = 0; i < 8; i += 1) {
      const d = makeDiscMesh(false);
      d.visible = false;
      scene.add(d);
      discPool.push(d);
    }
    const ghost = makeDiscMesh(true);
    ghost.visible = false;
    scene.add(ghost);

    const stamp = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.58),
      new THREE.MeshBasicMaterial({ map: stampTex("BUST"), transparent: true, depthWrite: false })
    );
    stamp.position.set(0, FELT_Y + 0.28, 0.12);
    stamp.rotation.x = -0.55;
    stamp.visible = false;
    scene.add(stamp);

    const dustGeo = new THREE.BufferGeometry();
    const dustN = 70;
    const dustPos = new Float32Array(dustN * 3);
    for (let i = 0; i < dustN; i += 1) {
      dustPos[i * 3] = (Math.random() - 0.5) * 6;
      dustPos[i * 3 + 1] = 0.4 + Math.random() * 3.4;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: 0xf0d09a, size: 0.025, transparent: true, opacity: 0.35, depthWrite: false,
    }));
    scene.add(dust);

    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(36 * 3), 3));
    const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
      color: 0xf7e2b0, size: 0.048, transparent: true, opacity: 0.9, depthWrite: false,
    }));
    sparks.userData.bursts = [];
    scene.add(sparks);

    const peekGeo = new THREE.BufferGeometry();
    peekGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(90 * 3), 3));
    const peek = new THREE.Points(peekGeo, new THREE.PointsMaterial({
      color: 0xff3a4a, size: 0.042, transparent: true, opacity: 0, depthWrite: false,
    }));
    scene.add(peek);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FELT_Y);

    world = {
      renderer, scene, camera, felt, cloth, spots, discPool, ghost, stamp, aura,
      lanterns, sign, dust, sparks, key, rackDiscs, wellCover, coverRing, coverFill,
      ripple, rippleBase, tugCord, tugBanner, peek,
      raycaster: new THREE.Raycaster(), plane,
      clock: 0, shadows, clothFlash: 0, tugBannerT: 0,
    };
    resizeWorld();
    const wrap = $("coverSpotWorld");
    if (typeof ResizeObserver === "function" && wrap) {
      world.ro = new ResizeObserver(() => resizeWorld());
      world.ro.observe(wrap);
    }
    window.addEventListener("resize", resizeWorld);
    rebuildSpots(attractSpec(), makeSpotShapes(attractSpec(), { x: 0, z: 0 }));
  }

  function bootWorld() {
    const canvas = $("coverSpotCanvas");
    const fail = $("coverSpotGlFail");
    if (!canvas) return false;
    try {
      if (!world) buildWorld(canvas);
      if (fail) fail.hidden = true;
      resizeWorld();
      return true;
    } catch (err) {
      if (fail) fail.hidden = false;
      setStatus("This tent wants WebGL.");
      return false;
    }
  }

  function eventToFelt(ev) {
    if (!world) return null;
    const canvas = world.renderer.domElement;
    const r = canvas.getBoundingClientRect();
    const t = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]) || ev;
    _ndc.set(
      ((t.clientX - r.left) / Math.max(1, r.width)) * 2 - 1,
      -((t.clientY - r.top) / Math.max(1, r.height)) * 2 + 1
    );
    world.raycaster.setFromCamera(_ndc, world.camera);
    lookX = _ndc.x;
    lookZ = _ndc.y;
    if (world.raycaster.ray.intersectPlane(world.plane, _hit)) {
      return { x: _hit.x, z: _hit.z };
    }
    return null;
  }

  function setAuraMood(mood, ms) {
    auraMood = mood || "idle";
    auraMoodUntil = (world ? world.clock : 0) + (ms || 1400);
  }

  function animateAura(dt) {
    if (!world || !world.aura) return;
    const a = world.aura.userData;
    a.t += dt * 0.001;
    const t = a.t;
    const live = isLive();
    if (world.clock > auraMoodUntil && auraMood !== "idle") auraMood = live ? "watch" : "idle";
    const sway = REDUCE ? 0 : Math.sin(t * 1.4) * 0.03;
    a.hip.rotation.y = sway;
    a.head.rotation.y = sway * 0.8 - 0.08 + lookX * 0.12;
    a.head.rotation.x = auraMood === "think" ? 0.12 : auraMood === "point" ? -0.08 : 0.02;
    if (auraMood === "celebrate") {
      a.armL.rotation.z = 2.2 + Math.sin(t * 8) * 0.15;
      a.armR.rotation.z = -2.2 + Math.cos(t * 8) * 0.15;
    } else if (auraMood === "point") {
      a.armR.rotation.x = -1.15;
      a.armR.rotation.z = -0.2;
      a.armL.rotation.z = 0.35;
    } else if (auraMood === "bad") {
      a.head.rotation.y = Math.sin(t * 10) * 0.2;
      a.armL.rotation.z = 0.4;
      a.armR.rotation.z = -0.4;
    } else {
      a.armL.rotation.z = 0.55;
      a.armL.rotation.x = -0.7;
      a.armR.rotation.z = -0.15 + Math.sin(t * 2.2) * 0.08;
      a.armR.rotation.x = live ? -0.35 : Math.sin(t * 2.2) * 0.12;
    }
    world.aura.position.y = 0.02 + Math.sin(t * 1.7) * 0.012;
  }

  function animateSparks(dt) {
    if (!world || !world.sparks) return;
    const bursts = world.sparks.userData.bursts;
    const pos = world.sparks.geometry.attributes.position.array;
    pos.fill(0);
    let k = 0;
    for (let i = bursts.length - 1; i >= 0; i -= 1) {
      const b = bursts[i];
      b.t += dt;
      if (b.t > 520) { bursts.splice(i, 1); continue; }
      const u = b.t / 520;
      for (let j = 0; j < 6 && k < 36; j += 1) {
        const a = j * 1.047;
        pos[k * 3] = b.x + Math.cos(a) * u * 0.28;
        pos[k * 3 + 1] = b.y + u * 0.22 + Math.sin(j) * 0.04;
        pos[k * 3 + 2] = b.z + Math.sin(a) * u * 0.28;
        k += 1;
      }
    }
    world.sparks.geometry.attributes.position.needsUpdate = true;
    world.sparks.material.opacity = bursts.length ? 0.9 : 0;
  }

  function cameraTick(dt) {
    if (!world) return;
    world.clock += dt;
    const t = world.clock;
    const live = isLive();
    const punch = camPunch;
    camPunch *= 0.86;
    camShake *= 0.84;
    const sx = camShake ? (Math.random() - 0.5) * camShake * 0.06 : 0;
    const sy = camShake ? (Math.random() - 0.5) * camShake * 0.04 : 0;
    const idle = REDUCE ? 0 : Math.sin(t * 0.0007) * (live ? 0.06 : 0.16);
    const hx = 0 + lookX * 0.1 + idle + sx;
    const hy = 3.62 - punch * 0.12 + sy;
    const hz = 1.58 - punch * 0.16 - (live ? 0.06 : 0);
    world.camera.position.x += (hx - world.camera.position.x) * 0.08;
    world.camera.position.y += (hy - world.camera.position.y) * 0.08;
    world.camera.position.z += (hz - world.camera.position.z) * 0.08;
    world.camera.lookAt(lookX * 0.08, FELT_Y, lookZ * 0.04);
    world.lanterns.forEach((L) => {
      L.light.intensity = 1.35 + Math.sin(t * 0.003 + L.phase) * 0.35;
    });
    if (world.dust) world.dust.rotation.y += dt * 0.00004;
    const slamY = (run && run.slamT)
      ? Math.sin(clamp(run.slamT / 280, 0, 1) * Math.PI) * -0.06
      : 0;
    const cx = (run && run.clothX) || 0;
    const cz = (run && run.clothZ) || 0;
    if (world.cloth) {
      world.cloth.position.x = cx;
      world.cloth.position.z = cz;
      world.cloth.position.y = FELT_Y + slamY;
    }
    if (world.spots) world.spots.position.y = slamY;
    if (world.coverRing) world.coverRing.position.y = FELT_Y + 0.03 + slamY;
    if (world.coverFill) {
      world.coverFill.position.y = FELT_Y + 0.016 + slamY;
      world.coverFill.material.opacity = 0.04;
    }
    if (world.ripple) {
      const wave = (run && run.clothWave) || 0;
      world.ripple.position.y = 0.018 + wave * 0.02;
    }
    if (world.clothFlash > 0) {
      world.clothFlash = Math.max(0, world.clothFlash - dt * 0.0022);
      if (world.felt) world.felt.material.emissive = world.felt.material.emissive || { r: 0, g: 0, b: 0 };
    }
    if (world.tugBannerT > 0) {
      world.tugBannerT -= dt;
      if (world.tugBanner) {
        world.tugBanner.visible = world.tugBannerT > 0;
        world.tugBanner.position.set(cx, FELT_Y + 0.58 + Math.sin(t * 0.012) * 0.04, cz + 0.15);
      }
      if (world.tugCord) {
        world.tugCord.visible = world.tugBannerT > 80;
        const ang = (run && run.clothAng) || 0;
        world.tugCord.position.set(Math.cos(ang) * (TABLE_R + 0.08) + cx, FELT_Y + 0.05, Math.sin(ang) * (TABLE_R + 0.08) + cz);
        world.tugCord.rotation.y = -ang;
        world.tugCord.rotation.z = Math.PI / 2;
      }
    } else if (world.tugBanner) {
      world.tugBanner.visible = false;
      if (world.tugCord) world.tugCord.visible = false;
    }
  }

  function paintPips(spec, left) {
    const host = $("coverSpotPips");
    if (!host) return;
    const max = spec ? spec.maxDiscs : 4;
    if (host.childElementCount !== max) {
      host.innerHTML = new Array(max).fill("<i></i>").join("");
    }
    host.querySelectorAll("i").forEach((n, i) => n.classList.toggle("on", i < left));
  }

  function paintMeter(spec, cover) {
    const el = $("coverSpotMeter");
    const fill = $("coverSpotMeterFill");
    const need = $("coverSpotMeterNeed");
    const label = $("coverSpotMeterLabel");
    if (!el) return;
    if (!isLive()) { el.hidden = true; return; }
    el.hidden = false;
    const pct = cover && cover.pct != null ? cover.pct : (typeof cover === "number" ? cover : 0);
    const shown = Math.floor(pct * 100 + 1e-6);
    if (fill) fill.style.width = `${clamp(shown, 0, 100)}%`;
    if (need && spec) need.style.left = `${spec.targetPct}%`;
    let text = `${shown}% / ${spec.targetPct}%`;
    if (spec && spec.kind === "twin" && cover && cover.parts && cover.parts.length >= 2) {
      text = `${Math.floor(cover.parts[0] * 100)}% · ${Math.floor(cover.parts[1] * 100)}% / ${spec.targetPct}%`;
    }
    if (label) label.textContent = text;
    el.classList.toggle("is-hot", shown >= (spec ? spec.targetPct : 100));
  }

  function setGreed(on) {
    const el = $("coverSpotGreed");
    if (el) el.hidden = !on;
    const cash = $("coverSpotCash");
    if (cash) {
      cash.hidden = !on;
      cash.disabled = !on;
      cash.classList.toggle("cash-scream", !!on);
    }
    const drop = $("coverSpotDrop");
    if (drop) {
      drop.hidden = !!on || !isLive();
      drop.disabled = !!on;
    }
    const again = $("coverSpotDropAgain");
    if (again) again.classList.toggle("cash-scream", !!on);
    const host = card();
    if (host) host.classList.toggle("is-greed", !!on);
    if (on) {
      const k1 = document.querySelector("#coverSpotHelp .coverspot-keys");
      if (k1) {
        /* keys stay; hint updates below */
      }
      const hint = $("coverSpotHelpHint");
      if (hint) hint.textContent = "CASH OUT banks this spot. DROP AGAIN risks the next felt. Enter cashes. Space greed-drops.";
    }
  }

  function paintHelp(spec) {
    const joke = $("coverSpotJoke");
    const hint = $("coverSpotHelpHint");
    const barker = $("coverSpotBarker");
    if (barker) barker.textContent = spec ? spec.name.toUpperCase() : "COVER THE RED — ONE DISC NEVER COVERS";
    const line = spec
      ? spec.barker
      : "Move to aim. Tap the table or press Space to drop. Cover the mark, then cash out or go deeper.";
    if (joke) joke.textContent = line;
    if (hint) {
      hint.textContent = spec && spec.kind === "ring"
        ? "Cover the RING. Center is a trap. After you drop, the cloth tugs — the % is honest."
        : spec && spec.kind === "twin"
          ? "Both reds must hit the mark. The meter shows both percents, honest."
          : "After you drop, the cloth tugs and the red peeks. The % is honest. Cover, then CASH OUT or DROP AGAIN.";
    }
  }

  function paintRoomChrome(spec) {
    paintHelp(spec);
    paintPips(spec, spec ? spec.maxDiscs : 4);
    if (run && isLive()) {
      paintPips(spec, Math.max(0, spec.maxDiscs - run.discs.length));
      paintMeter(spec, run.cover);
    } else {
      paintMeter(null, 0);
    }
  }

  function stampDepthCopy() {
    const tag = document.querySelector("#cabinet-cover-the-spot [data-pf-depth-tag]");
    const body = document.querySelector("#cabinet-cover-the-spot [data-pf-depth-copy]");
    if (tag) tag.textContent = DEPTH_COPY.tag;
    if (body) body.textContent = DEPTH_COPY.body;
  }

  function paintKitHud(spec) {
    const hud = document.querySelector('[data-runkit-hud="coverspot"]');
    if (!hud) return;
    if (!run || !isLive()) { hud.textContent = ""; return; }
    const n = spec && spec.id ? spec.id : (run.stagesCleared + 1);
    hud.textContent = spec && spec.coda
      ? `ENDLESS · SPOT ${n} · ${spec.name}`
      : `SPOT ${n} · ${spec ? spec.name : ""}`;
  }

  function tellDepth() {
    if (!run || !run.kitRun || !rk() || typeof rk().reportDepth !== "function") return;
    try {
      rk().reportDepth(run.kitRun, run.stagesCleared | 0, {
        name: run.spec && run.spec.name,
        coda: !!(run.spec && run.spec.coda),
      });
    } catch (_) { /* hud */ }
    paintKitHud(run.spec);
  }

  function setPlaying(on) {
    const host = card();
    const section = $("cabinet-cover-the-spot");
    if (section) section.classList.toggle("is-playing", !!on);
    if (host) host.classList.toggle("is-playing", !!on);
  }

  function setStamp(on, label) {
    if (!world || !world.stamp) return;
    world.stamp.visible = !!on;
    if (on && label) {
      world.stamp.material.map = stampTex(label);
      world.stamp.material.needsUpdate = true;
    }
  }

  function liveCoverage() {
    if (!run) return;
    const cover = coverageNow();
    run.cover = cover;
    run.coverage = cover.pct;
    run.coverParts = cover.parts;
    if (cover.pct > (run.bestPct || 0)) run.bestPct = cover.pct;
    paintMeter(run.spec, cover);
    const shown = Math.floor(cover.pct * 100 + 1e-6);
    if (run.spec && run.spec.kind === "twin" && cover.parts.length >= 2) {
      setText("depthCoverPct", `${Math.floor(cover.parts[0] * 100)}% · ${Math.floor(cover.parts[1] * 100)}%`);
    } else {
      setText("depthCoverPct", `${shown}%`);
    }
    syncPeek(cover.peek);
  }

  function syncPeek(peek) {
    if (!world || !world.peek) return;
    const pos = world.peek.geometry.attributes.position.array;
    pos.fill(0);
    const n = peek ? peek.length / 3 : 0;
    for (let i = 0; i < n && i < 90; i += 1) {
      pos[i * 3] = peek[i * 3];
      pos[i * 3 + 1] = peek[i * 3 + 1];
      pos[i * 3 + 2] = peek[i * 3 + 2];
    }
    world.peek.geometry.setDrawRange(0, n);
    world.peek.geometry.attributes.position.needsUpdate = true;
    world.peek.material.opacity = n ? 0.95 : 0;
  }

  function enterSpot(spec) {
    run.spec = spec;
    run.discs = [];
    run.origin = originAt(spec, 0);
    run.samples = bakeSamples(spec);
    run.awaiting = false;
    run.clearedAwait = false;
    run.souvenir = false;
    run.settling = false;
    run.settleUntil = 0;
    run.coverage = 0;
    run.cover = { pct: 0, parts: [0] };
    run.coverParts = [];
    run.hitMs = 0;
    run.busy = false;
    run.slamT = 0;
    run.clothX = 0;
    run.clothZ = 0;
    run.clothTug = null;
    run.clothWave = 0;
    run.clothAng = 0;
    if (world) {
      world.tugBannerT = 0;
      if (world.tugBanner) world.tugBanner.visible = false;
      if (world.tugCord) world.tugCord.visible = false;
    }
    hideToast();
    setGreed(false);
    liveCoverage();
    paintRoomChrome(spec);
    paintPips(spec, spec.maxDiscs);
    setStatus(spec.enter);
    if (run.kitRun) {
      run.kitRun.depth = run.stagesCleared | 0;
      run.kitRun.score = run.score | 0;
    }
    paintKitHud(spec);
    pokeDepth();
    PF.setAura("think");
    setAuraMood("think", 1600);
    camPunch = 0.45;
    if (world) rebuildSpots(spec, makeSpotShapes(spec, run.origin));
  }

  function beginKitRun() {
    if (PF.runKit && typeof PF.runKit.startRun === "function") {
      const ctx = PF.runKit.startRun({ gameId: GAME_ID, coinCost: 1 });
      if (ctx) return ctx;
    }
    if (typeof PF.spendDemoCoin === "function" && !PF.spendDemoCoin(GAME_ID)) return null;
    return { gameId: GAME_ID, alive: true, depth: 0, score: 0, strikes: 0 };
  }

  function start() {
    if (isLive()) return;
    declareP0();
    const kitRun = beginKitRun();
    if (!kitRun) {
      setStatus("Out of demo coins · grant a pass");
      PF.refreshNightBoard();
      return;
    }
    const spec = coverspotStageParams(1);
    run = {
      done: false,
      dying: false,
      kitRun,
      spec,
      origin: { x: 0, z: 0 },
      samples: bakeSamples(spec),
      discs: [],
      coverage: 0,
      cover: { pct: 0, parts: [0] },
      coverParts: [],
      bestPct: 0,
      stagesCleared: 0,
      discsPlaced: 0,
      tableMisses: 0,
      score: 0,
      awaiting: false,
      clearedAwait: false,
      souvenir: false,
      settling: false,
      settleUntil: 0,
      busy: false,
      t: 0,
      last: 0,
      hitMs: 0,
      slamT: 0,
      clothX: 0,
      clothZ: 0,
      clothTug: null,
      clothWave: 0,
      clothAng: 0,
      deathHold: 0,
      deathNote: "bust",
      closedStamp: false,
    };
    const startBtn = $("coverSpotStart");
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.hidden = true;
    }
    if ($("coverSpotVerdict")) $("coverSpotVerdict").hidden = true;
    kit.hideResult("coverSpotResult");
    PF.setTier("coverSpotTier", "", "");
    kit.setMode(card(), "play");
    setPlaying(true);
    setStamp(false);
    stampDepthCopy();
    enterSpot(spec);
    if ($("coverSpotDrop")) $("coverSpotDrop").hidden = false;
    if ($("coverSpotCash")) {
      $("coverSpotCash").hidden = true;
      $("coverSpotCash").disabled = true;
      $("coverSpotCash").textContent = "CASH OUT";
    }
    PF.focusCard("coverSpotCard", true);
    bootWorld();
    startLoop();
    resizeWorld();
  }

  let toastTimer = 0;

  function showToast(text) {
    const el = $("coverSpotToast");
    if (el) {
      el.hidden = false;
      el.textContent = text;
    }
    toastTimer = 1300;
  }

  function hideToast() {
    const el = $("coverSpotToast");
    if (el) el.hidden = true;
    toastTimer = 0;
  }

  function coachStatus() {
    if (!run || !run.spec || run.awaiting || run.dying) return;
    const spec = run.spec;
    const pct = Math.floor((run.coverage || 0) * 100 + 1e-6);
    const left = Math.max(0, spec.maxDiscs - run.discs.length);
    const need = spec.targetPct;
    if (run.clothTug && run.clothTug.flashed) return;
    if (!run.discs.length) {
      setStatus(spec.enter);
      return;
    }
    if (pct >= need) {
      setStatus(`${pct}% honest · mark hit. Hold…`);
      return;
    }
    if (run.discs.length === 1) {
      setStatus(`${pct}% honest · one disc never covers. Spread the next plates around the rim. ${left} brass left.`);
      return;
    }
    setStatus(`${pct}% honest · need ${need}% · ${left} brass left. Stacking the middle won’t cover.`);
  }

  function tugCloth(disc) {
    if (!run || !run.spec) return;
    const yank = run.spec.clothJerk || 0;
    if (yank <= 0) return;
    const cap = run.spec.clothCap || 0.06;
    const residual = yank * 0.42;
    const origin = clothOrigin();
    let ang = Math.atan2(disc.z - origin.z, disc.x - origin.x);
    if (!ang && ang !== 0) ang = Math.random() * Math.PI * 2;
    if (Math.hypot(disc.x - origin.x, disc.z - origin.z) < 0.04) {
      ang = (run.discs.length * 1.7) % (Math.PI * 2);
    }
    run.clothAng = ang;
    const fromX = run.clothX || 0;
    const fromZ = run.clothZ || 0;
    const restX = clamp(fromX + Math.cos(ang) * residual, -cap, cap);
    const restZ = clamp(fromZ + Math.sin(ang) * residual, -cap, cap);
    const yankX = clamp(fromX + Math.cos(ang) * yank, -cap * 1.35, cap * 1.35);
    const yankZ = clamp(fromZ + Math.sin(ang) * yank, -cap * 1.35, cap * 1.35);
    run.clothTug = {
      delay: run.spec.clothDelay || 80,
      yankDur: 160,
      settleDur: 200,
      t: 0,
      fromX, fromZ, yankX, yankZ, restX, restZ,
      flashed: false,
    };
    run.clothWave = 1;
    if (world) world.clothDirty = true;
  }

  function stepCloth(dt) {
    if (!run) return;
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) {
        hideToast();
        coachStatus();
      }
    }
    if (run.clothWave > 0) run.clothWave = Math.max(0, run.clothWave - dt * 0.003);
    const tug = run.clothTug;
    if (!tug) return;
    tug.t += dt;
    if (tug.t < tug.delay) return;
    const tYank = tug.t - tug.delay;
    let x;
    let z;
    if (tYank < tug.yankDur) {
      const u = clamp(tYank / tug.yankDur, 0, 1);
      const e = 1 - (1 - u) * (1 - u);
      x = lerp(tug.fromX, tug.yankX, e);
      z = lerp(tug.fromZ, tug.yankZ, e);
    } else {
      const u = clamp((tYank - tug.yankDur) / tug.settleDur, 0, 1);
      const e = u * u * (3 - 2 * u);
      x = lerp(tug.yankX, tug.restX, e);
      z = lerp(tug.yankZ, tug.restZ, e);
    }
    run.clothX = x;
    run.clothZ = z;
    if (!tug.flashed) {
      tug.flashed = true;
      showToast("CLOTH TUG — the red peeked. That’s the cheat.");
      kit.sfx("shove");
      camShake = 0.9;
      setAuraMood("point", 1100);
      PF.setAura("point");
      if (world) {
        world.tugBannerT = 780;
        world.clothFlash = 1;
      }
    }
    liveCoverage();
    if (tYank >= tug.yankDur + tug.settleDur) {
      run.clothX = tug.restX;
      run.clothZ = tug.restZ;
      run.clothTug = null;
      liveCoverage();
      coachStatus();
    }
  }

  function dropAt(x, z) {
    if (!isLive() || !run.spec) return;
    if (run.awaiting || run.settling || run.busy || run.dying) return;
    const spec = run.spec;
    if (run.discs.length >= spec.maxDiscs) {
      setStatus("No brass left. Watch the cover — or bust.");
      return;
    }
    const rest = settleOf(x, z, spec);
    if (!onTable(x, z, spec.r) && !onTable(rest.x, rest.z, spec.r)) {
      run.tableMisses += 1;
      camShake = 1.3;
      kit.sfx("miss");
      setAuraMood("bad", 900);
      PF.setAura("point");
      if (rk() && typeof rk().reportStrike === "function") rk().reportStrike(run.kitRun, "table_miss");
      setStatus(run.tableMisses >= MISS_DEATH
        ? "Second bounce off the table."
        : "Off the felt. Two table misses and the run is done.");
      if (run.tableMisses >= MISS_DEATH) finish("miss_table");
      return;
    }
    const disc = {
      x, z,
      x0: x,
      z0: z,
      restX: rest.x,
      restZ: rest.z,
      r: spec.r,
      alt: spec.dropH || 1.18,
      spin: Math.random() * Math.PI,
      falling: true,
      trapped: false,
      bounce: spec.bounce > 1,
      life: 0,
      fallMs: spec.scatter ? 480 : 300,
    };
    run.discs.push(disc);
    run.discsPlaced += 1;
    run.busy = true;
    camPunch = 0.55;
    kit.sfx("drop");
    tugCloth(disc);
    paintPips(spec, Math.max(0, spec.maxDiscs - run.discs.length));
    setAuraMood("watch", 700);
  }

  function dropFromButton() {
    if (!isLive()) return;
    dropAt(pointer.on ? pointer.x : 0, pointer.on ? pointer.z : 0);
  }

  function landDisc(d) {
    if (!run || run.done) return;
    const spec = run.spec;
    const ox = clothOrigin();
    if (inWell(d.x, d.z, spec, ox)) {
      d.trapped = true;
      d.falling = true;
      d.vy = -1.6;
      kit.sfx("pit");
      camShake = 1.1;
      setAuraMood("bad", 1000);
      setStatus(AURA.well);
      burstSparks(d.x, d.z, 0xc41e3a);
      return;
    }
    if (!onTable(d.x, d.z, d.r * 0.4)) {
      d.falling = false;
      d.trapped = true;
      d.alt = 0;
      run.tableMisses += 1;
      kit.sfx("miss");
      camShake = 1.1;
      if (rk() && typeof rk().reportStrike === "function") rk().reportStrike(run.kitRun, "table_miss");
      if (run.tableMisses >= MISS_DEATH) {
        finish("miss_table");
        return;
      }
      setStatus("It kissed the rail and fell off. Two of those end the night.");
      return;
    }
    d.falling = false;
    d.alt = 0;
    d.x = d.restX;
    d.z = d.restZ;
    kit.sfx("tray");
    burstSparks(d.x, d.z, 0xf0d09a);
    camPunch = 0.28;
    liveCoverage();
    coachStatus();
  }

  function stepDiscs(dt) {
    if (!run) return;
    let falling = false;
    run.discs.forEach((d) => {
      if (!d.falling) return;
      falling = true;
      d.life += dt;
      d.spin += dt * 0.012;
      if (d.trapped) {
        d.alt -= dt * 0.0022;
        if (d.alt < -0.9) d.falling = false;
        return;
      }
      const dur = d.fallMs || 300;
      const u = clamp(d.life / dur, 0, 1);
      const hopAt = d.bounce ? 0.58 : 0.82;
      if (u >= 1) {
        landDisc(d);
        return;
      }
      if (u < hopAt) {
        const t = u / hopAt;
        d.alt = (run.spec.dropH || 1.18) * (1 - t * t);
        d.x = d.x0;
        d.z = d.z0;
      } else {
        const t = (u - hopAt) / (1 - hopAt);
        d.x = lerp(d.x0, d.restX, t);
        d.z = lerp(d.z0, d.restZ, t);
        d.alt = (run.spec.dropH || 1.18) * 0.16 * Math.sin(t * Math.PI);
      }
    });
    run.busy = falling;
  }

  function maybeClear(dt) {
    if (!run || run.done || run.busy || run.awaiting || run.dying) return;
    if (run.clothTug) return;
    const spec = run.spec;
    liveCoverage();
    if (spec.drift === "jitter") {
      const phase = stampPhase(spec, run.t);
      if (phase.slam) {
        run.slamT = Math.min(280, (run.slamT || 0) + dt);
      } else {
        run.slamT = 0;
      }
      if (phase.hopping) {
        run.hitMs = 0;
        return;
      }
      if (!hitTarget(spec, run.cover)) {
        if (!phase.slam) run.hitMs = 0;
        if (phase.slam && run.discs.length >= spec.maxDiscs && !run.settling) {
          run.settling = true;
          run.settleUntil = run.t + 420;
        }
        return;
      }
      run.hitMs += dt;
      if (run.hitMs > 220) clearStage();
      return;
    }
    if (!hitTarget(spec, run.cover)) {
      run.hitMs = 0;
      if (run.discs.length >= spec.maxDiscs && !run.busy && !run.settling) {
        run.settling = true;
        run.settleUntil = run.t + (spec.drift === "none" ? 780 : SETTLE_MS);
        setStatus(`${Math.floor(run.coverage * 100)}% · needed ${spec.targetPct}%. Last plate is down.`);
      }
      return;
    }
    const landed = run.discs.filter((d) => !d.falling && !d.trapped).length;
    if (landed < 1) return;
    const need = spec.drift === "slow" ? 420 : 180;
    run.hitMs += dt;
    if (run.hitMs >= need) clearStage();
  }

  function clearStage() {
    if (!run || run.awaiting) return;
    const spec = run.spec;
    const pct = Math.floor(run.coverage * 100);
    run.stagesCleared += 1;
    run.score += 200 * run.stagesCleared + pct;
    run.awaiting = true;
    run.clearedAwait = true;
    run.settling = false;
    run.hitMs = 0;
    if (run.kitRun) {
      run.kitRun.depth = run.stagesCleared;
      run.kitRun.score = run.score;
    }
    tellDepth();
    pokeDepth();
    kit.sfx("rack");
    camPunch = 0.7;
    setAuraMood("celebrate", 1400);
    PF.setAura("celebrate");
    setGreed(true);
    const next = coverspotStageParams(run.stagesCleared + 1);
    const lastAuthored = run.stagesCleared >= AUTHORED_COUNT && !spec.coda;
    if (!next) {
      run.souvenir = true;
      setText("coverSpotGreedPct", `${pct}%`);
      setText("coverSpotGreedHint", "Authored felts done. CASH OUT for the souvenir — or that’s the ride.");
      setText("coverSpotDropAgain", "SOUVENIR");
      setStatus(`SPOT ${run.stagesCleared} locked · ${pct}% honest. CASH OUT or SOUVENIR.`);
    } else if (lastAuthored) {
      setText("coverSpotGreedPct", `${pct}%`);
      setText("coverSpotGreedHint", "Seven spots gilded. CASH OUT and walk — or DROP AGAIN into ENDLESS.");
      setText("coverSpotDropAgain", "DROP AGAIN · ENDLESS");
      setStatus(`SPOT ${run.stagesCleared} locked · ${pct}% honest. Cash out, or greed-drop ENDLESS.`);
    } else {
      setText("coverSpotGreedPct", `${pct}%`);
      setText("coverSpotGreedHint", next.coda
        ? "CASH OUT and bank it — or DROP AGAIN into ENDLESS."
        : "CASH OUT and bank this spot — or DROP AGAIN on the next felt.");
      setText("coverSpotDropAgain", next.coda ? "DROP AGAIN · ENDLESS" : "DROP AGAIN");
      setStatus(`${hudStageLine(spec)} covered · ${pct}% honest. Cash out, or greed-drop the next felt.`);
    }
    const cash = $("coverSpotCash");
    if (cash) {
      cash.hidden = false;
      cash.disabled = false;
      cash.classList.add("cash-scream");
    }
    burstSparks(run.origin.x, run.origin.z, GOLD);
  }

  function advanceStage() {
    if (!run || run.done || !run.clearedAwait) return;
    if (run.souvenir) {
      finish("souvenir");
      return;
    }
    const next = coverspotStageParams(run.stagesCleared + 1);
    if (!next) {
      finish("souvenir");
      return;
    }
    kit.sfx("flip");
    enterSpot(next);
  }

  function cashOut() {
    if (!run || run.done || !run.clearedAwait) return;
    finish(run.souvenir ? "souvenir" : "cash");
  }

  function challengeLine(depth) {
    if (rk() && typeof rk().challengeText === "function") {
      return rk().challengeText("Cover-the-Spot stage", depth, GAME_ID);
    }
    return `Beat my Cover-the-Spot stage ${depth} on Penny Fever`;
  }

  function deathReasonOf(reason) {
    if (reason === "cash" || reason === "souvenir") return "cashed_out";
    if (reason === "leave") return "leave";
    if (reason === "miss_table") return "miss_table";
    return "bust";
  }

  function auraLine(reason, cashed, depth) {
    if (reason === "leave") return AURA.leave;
    if (reason === "souvenir") return AURA.souvenir;
    if (cashed) return depth >= 6 ? AURA.deep(depth) : AURA.cash;
    if (reason === "miss_table") return AURA.miss_table;
    if (depth >= 6) return AURA.deep(depth);
    return AURA.bust;
  }

  function closeKitRun(partial) {
    const ctx = run && run.kitRun;
    if (ctx && rk() && typeof rk().finishRun === "function") {
      try {
        return rk().finishRun(ctx, Object.assign({ gameId: GAME_ID }, partial), { navigate: false });
      } catch (_) { /* fall */ }
    }
    kit.persistRun(PF.getState(), GAME_ID, partial);
    return null;
  }

  function persistDepth(partial) {
    const state = PF.getState();
    const payload = {
      depth: partial.depth | 0,
      score: partial.score | 0,
      deathReason: partial.deathReason || "bust",
      cashedOut: !!partial.cashedOut,
      meta: partial.meta || {},
    };
    if (state) {
      state.bestCoverStages = Math.max(state.bestCoverStages || 0, payload.depth);
      if (partial.pct != null) state.bestCoverPct = Math.max(state.bestCoverPct || 0, partial.pct | 0);
      if (partial.discs != null) state.bestCoverDiscs = Math.max(state.bestCoverDiscs || 0, partial.discs | 0);
      state.bestDepth = state.bestDepth || {};
      state.bestDepth[GAME_ID] = Math.max(state.bestDepth[GAME_ID] || 0, payload.depth);
    }
    closeKitRun(payload);
    kit.persistRun(state, GAME_ID, payload);
    if (typeof PF.saveState === "function") PF.saveState();
  }

  function finish(reason) {
    if (!run || run.done) return;
    if (reason === "leave" || reason === "cash" || reason === "souvenir") {
      sealResult(reason);
      return;
    }
    if (run.dying) return;
    run.dying = true;
    run.awaiting = false;
    setGreed(false);
    run.deathNote = reason || "bust";
    run.closedStamp = true;
    run.deathHold = DEATH_HOLD_MS;
    setStamp(true, reason === "miss_table" ? "MISS" : "BUST");
    kit.sfx("stamp");
    camShake = 1.4;
    setAuraMood("bad", 1200);
  }

  function sealResult(reason) {
    if (!run || run.done) return;
    run.done = true;
    run.dying = false;
    setGreed(false);
    const cashed = reason === "cash" || reason === "souvenir";
    const deathReason = deathReasonOf(reason);
    const spec = run.spec || {};
    persistDepth({
      depth: run.stagesCleared | 0,
      score: run.score | 0,
      deathReason,
      cashedOut: cashed,
      pct: Math.floor((run.bestPct || 0) * 100),
      discs: run.discsPlaced | 0,
      meta: {
        coverage: Math.floor((run.bestPct || 0) * 100),
        discs: run.discsPlaced | 0,
        stage: spec.id,
        title: spec.title,
        name: spec.name,
        kind: spec.kind,
        coda: !!spec.coda,
        codaEnabled: CODA_ENABLED,
      },
    });
    revealResult(reason);
  }

  function revealResult(reason) {
    if (!run) return;
    const cashed = reason === "cash" || reason === "souvenir";
    const deathReason = deathReasonOf(reason);
    const depth = run.stagesCleared;
    const pct = Math.floor((run.bestPct || 0) * 100);
    const discs = run.discsPlaced;
    const score = run.score;
    const spec = run.spec || {};
    kit.setMode(card(), "result");
    setPlaying(false);
    stampDepthCopy();
    const startBtn = $("coverSpotStart");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.hidden = false;
      startBtn.textContent = "DROP AGAIN · 1 demo coin";
    }
    if ($("coverSpotDrop")) $("coverSpotDrop").hidden = true;
    if ($("coverSpotCash")) {
      $("coverSpotCash").hidden = true;
      $("coverSpotCash").disabled = true;
      $("coverSpotCash").classList.remove("cash-scream");
      $("coverSpotCash").textContent = "CASH OUT";
    }
    PF.focusCard("coverSpotCard", false);
    paintKitHud(null);
    const nameBit = spec.coda ? `ENDLESS ${depth} · ${spec.name}` : `SPOT ${depth} · ${spec.name || "Felt"}`;
    const reasonTag = cashed
      ? (reason === "souvenir" ? "SOUVENIR" : "WALKED")
      : reason === "leave"
        ? "LEFT"
        : reason === "miss_table"
          ? "MISS TABLE"
          : "BUST";
    const line = `${nameBit} · ${pct}% BEST · SCORE ${score}`;
    const aura = auraLine(reason, cashed, depth);
    if ($("coverSpotVerdict")) {
      $("coverSpotVerdict").hidden = false;
      $("coverSpotVerdict").textContent = cashed
        ? (reason === "souvenir" ? `Souvenir. ${line}.` : `Walked away. ${line}.`)
        : reason === "leave"
          ? `Left the table · ${line}`
          : reason === "miss_table"
            ? `Off the felt. ${line}.`
            : `Bust. ${line}.`;
    }
    kit.fillResult({
      root: "coverSpotResult",
      depth: "coverSpotResultDepth",
      score: "coverSpotResultScore",
      aura: "coverSpotResultAura",
      copied: "coverSpotCopied",
    }, {
      depthLine: `${nameBit} · ${reasonTag}`,
      scoreLine: `SCORE ${score} · ${pct}% · ${discs} discs · ${deathReason}`,
      auraLine: aura,
    });
    setText("coverSpotChallengeText", challengeLine(depth));
    PF.setTier("coverSpotTier", reasonTag, cashed ? "perfect" : "miss");
    setStatus(cashed
      ? (reason === "souvenir" ? "Authored ride stamped." : "Cashed the felt.")
      : "The red kept a peek.");
    const ok = cashed || depth > 0;
    if (ok) {
      PF.award(Math.max(cashed ? 12 : 8, Math.floor(score / 8)), true, cashed ? "Cover cash-out" : "Cover-the-Spot");
      PF.setAura(cashed ? "celebrate" : "laugh");
      setAuraMood(cashed ? "celebrate" : "idle", 2000);
      if (reason !== "leave") PF.showBanner(cashed, reasonTag, `${pct}% · ${aura}`);
    } else {
      PF.award(0, false, "Cover-the-Spot miss");
      PF.setAura("badLuck");
      setAuraMood("bad", 1800);
      if (reason !== "leave") PF.showBanner(false, reasonTag, aura);
    }
    PF.refreshNightBoard();
    pokeDepth();
    if (cashed) kit.sfx("cash");
    else if (reason !== "leave") kit.sfx("bury");
  }

  function step(dt) {
    if (!run || run.done) return;
    if (run.dying) {
      run.deathHold -= dt;
      if (run.deathHold <= 0) sealResult(run.deathNote);
      return;
    }
    run.origin = originAt(run.spec, run.t);
    stepDiscs(dt);
    stepCloth(dt);
    if (run.clothTug) run.busy = true;
    maybeClear(dt);
    if (run.settling && !run.busy && run.t >= run.settleUntil && !run.awaiting) {
      setStatus(`${Math.floor(run.coverage * 100)}% · needed ${run.spec.targetPct}%. Bust. ${run.spec.name} kept a peek.`);
      finish("bust");
    }
    paintPips(run.spec, Math.max(0, run.spec.maxDiscs - run.discs.length));
    const cash = $("coverSpotCash");
    const drop = $("coverSpotDrop");
    if (run.awaiting && run.clearedAwait) {
      if (cash) cash.disabled = false;
      if (drop) drop.disabled = true;
    } else {
      if (cash) cash.disabled = true;
      if (drop) drop.disabled = !!run.busy || !!run.settling;
    }
  }

  function tickWorld(dt) {
    if (!world) return;
    const spec = liveSpec();
    syncSpots(spec, run ? run.t : world.clock);
    syncDiscs(spec);
    animateAura(dt);
    animateSparks(dt);
    cameraTick(dt);
  }

  function render() {
    if (!world || !cabinetOn()) return;
    try { world.renderer.render(world.scene, world.camera); } catch (_) { /* context */ }
  }

  function stopLoop() {
    if (loopRaf) cancelAnimationFrame(loopRaf);
    loopRaf = 0;
  }

  function startLoop() {
    if (!cabinetOn()) return;
    bootWorld();
    if (loopRaf) return;
    let last = 0;
    const tick = (now) => {
      if (!cabinetOn()) {
        loopRaf = 0;
        return;
      }
      if (!last) last = now;
      const dt = Math.min(220, Math.max(16, now - last || 16));
      last = now;
      if (!isLive() && (!run || run.done)) {
        idleClock += dt;
        if (idleClock > 3200) {
          idleClock = 0;
          idleRoom = (idleRoom % AUTHORED_COUNT) + 1;
          if (world) rebuildSpots(attractSpec(), makeSpotShapes(attractSpec(), { x: 0, z: 0 }));
          paintHelp(attractSpec());
        }
      }
      if (run && !run.done) {
        run.t += dt;
        step(dt);
        tickWorld(dt);
        render();
        pokeDepth();
      } else {
        tickWorld(dt);
        render();
      }
      loopRaf = requestAnimationFrame(tick);
    };
    loopRaf = requestAnimationFrame(tick);
  }

  function onKey(ev) {
    if (!cabinetOn()) return;
    const k = ev.key;
    if (k !== " " && k !== "Enter" && k !== "Spacebar") return;
    const tag = (ev.target && ev.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") {
      if (k === " " && tag === "BUTTON") return;
    }
    ev.preventDefault();
    if (!isLive()) {
      if (!run || run.done) start();
      return;
    }
    if (run.awaiting && run.clearedAwait) {
      if (k === "Enter") cashOut();
      else advanceStage();
      return;
    }
    dropFromButton();
  }

  PF.registerVendor({
    id: "cover-the-spot",
    playKey: "coverspot",
    chalk: "Cover the red — one disc never covers.",
    defaults: { bestCoverStages: 0, bestCoverPct: 0, bestCoverDiscs: 0 },
    onLeave() {
      if (run && !run.done) finish("leave");
      setPlaying(false);
      stopLoop();
    },
    onShow() {
      declareP0();
      stampDepthCopy();
      paintRoomChrome(attractSpec());
      bootWorld();
      startLoop();
      resizeWorld();
    },
    onReset() {
      run = null;
      if ($("coverSpotVerdict")) $("coverSpotVerdict").hidden = true;
      kit.hideResult("coverSpotResult");
      if ($("coverSpotStart")) {
        $("coverSpotStart").disabled = false;
        $("coverSpotStart").hidden = false;
        $("coverSpotStart").textContent = "START · 1 demo coin";
      }
      if ($("coverSpotDrop")) $("coverSpotDrop").hidden = true;
      if ($("coverSpotCash")) {
        $("coverSpotCash").hidden = true;
        $("coverSpotCash").disabled = true;
        $("coverSpotCash").classList.remove("cash-scream");
        $("coverSpotCash").textContent = "CASH OUT";
      }
      setGreed(false);
      setStamp(false);
      paintPips(attractSpec(), 4);
      kit.setMode(card(), "vestibule");
      setPlaying(false);
      stampDepthCopy();
      setStatus(DEPTH_COPY.status);
      hideToast();
      if (cabinetOn()) startLoop();
    },
    refreshDepth(state) {
      const now = $("depthCoverNow");
      const live = (run && !run.done) || (run && card() && card().classList.contains("is-result"));
      const spec = live ? run.spec : attractSpec();
      if (now) now.textContent = hudStageLine(spec);
      const pct = $("depthCoverPct");
      if (pct) pct.textContent = run && live ? `${Math.floor(run.coverage * 100)}%` : "0%";
      const best = $("depthCoverBest");
      const bestN = Math.max(state.bestCoverStages || 0, (state.bestDepth && state.bestDepth.coverspot) || 0);
      if (best) best.textContent = bestN ? `SPOT ${bestN}` : "—";
      const bestP = $("depthCoverBestPct");
      if (bestP) bestP.textContent = state.bestCoverPct ? `${state.bestCoverPct}%` : "—";
      const door = $("coverSpotDoorBest");
      if (door) {
        const discs = state.bestCoverDiscs || 0;
        if (bestN) door.textContent = `SPOT ${bestN} · ${state.bestCoverPct || 0}% · ${discs} discs`;
        else if (state.bestCoverPct) door.textContent = `Coverage ${state.bestCoverPct}%`;
        else door.textContent = "Coverage —";
      }
    },
    bind() {
      declareP0();
      const startBtn = $("coverSpotStart");
      if (startBtn) startBtn.addEventListener("click", start);
      const cash = $("coverSpotCash");
      if (cash) cash.addEventListener("click", cashOut);
      const drop = $("coverSpotDrop");
      if (drop) drop.addEventListener("click", dropFromButton);
      const again = $("coverSpotDropAgain");
      if (again) again.addEventListener("click", advanceStage);
      const greedCash = $("coverSpotGreedCash");
      if (greedCash) greedCash.addEventListener("click", cashOut);
      const canvas = $("coverSpotCanvas");
      if (canvas) {
        canvas.addEventListener("pointermove", (ev) => {
          const p = eventToFelt(ev);
          if (p) pointer = { x: p.x, z: p.z, on: true };
        });
        canvas.addEventListener("pointerleave", () => { pointer.on = false; });
        canvas.addEventListener("pointerdown", (ev) => {
          if (!isLive()) {
            if (!run || run.done) start();
            return;
          }
          if (run.awaiting || run.settling) return;
          ev.preventDefault();
          if (canvas.setPointerCapture && ev.pointerId != null) {
            try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
          }
          const p = eventToFelt(ev) || pointer;
          pointer = { x: p.x, z: p.z, on: true };
          dropAt(p.x, p.z);
        });
      }
      window.addEventListener("keydown", onKey);
      const copyBtn = $("coverSpotChallenge");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const st = PF.getState();
          const n = (st.lastRun && st.lastRun.coverspot && st.lastRun.coverspot.depth)
            || (st.lastRun && st.lastRun.game === GAME_ID && st.lastRun.depth)
            || (st.bestCoverStages || 0);
          const text = challengeLine(n);
          kit.copyText(text, () => {
            const el = $("coverSpotCopied");
            if (el) {
              el.hidden = false;
              el.textContent = "Copied — send it";
            }
            setStatus("Copied — send it");
          }, () => setStatus(text));
        });
      }
      if ($("coverSpotDrop")) $("coverSpotDrop").hidden = true;
      if ($("coverSpotCash")) $("coverSpotCash").hidden = true;
      stampDepthCopy();
      PF._coverSpotQA = {
        drop(x, z) { dropAt(x, z); },
        state() {
          if (!run) return null;
          return {
            coverage: run.coverage,
            pct: Math.floor((run.coverage || 0) * 100 + 1e-6),
            parts: run.coverParts,
            discs: run.discs.length,
            busy: !!run.busy,
            awaiting: !!run.awaiting,
            clothX: run.clothX,
            clothZ: run.clothZ,
            tugging: !!run.clothTug,
            spec: run.spec && run.spec.name,
            target: run.spec && run.spec.targetPct,
            greed: !!run.clearedAwait,
            stages: run.stagesCleared,
            status: ($("coverSpotStatus") || {}).textContent,
            toast: ($("coverSpotToast") || {}).hidden === false
              ? ($("coverSpotToast") || {}).textContent
              : "",
          };
        },
      };
    },
  });
}
