/* Penny Fever 3D carnival — PF only. Never booth/port 6000.
 * Imagine files are the art bible (palace, hall, Aura lock). Runtime is code. */
import * as THREE from "./lib/three.module.min.js";
import { mountRestyle, poseRestyle } from "./restyle.js?v=keep-light-1";
import { installPaperProprietor, updatePaperProprietor } from "./paper-proprietor.js?v=vendor-face-1";
import { paperRail, makePaperEntrance, installCrewGuest, updateCrewGuest, FOYER_IN, FOYER_OUT } from "./paper-guest-entrance.js?v=doll-blank-1";
import { phoneLane } from "./phone-lane.js?v=keep-light-1";
import { installPaperCrew, updatePaperCrew } from "./paper-crew.js?v=doll-blank-1";
import { installIndividualVendors } from "./paper-vendors.js?v=keep-light-1";
import {COUNTER, LOOP_START, makeVisibleTicketBooth, updateTicketBooth, extendPaperAlley, makePaperWalls, installTicketService, updateTicketService, paintAuraWallet} from "./paper-midway.js?v=alley-webp-1";
import {openTill} from "./ticket-till.js?v=booth-till-1";
import {BAY_X, AMUSEMENT_ART, midwayLots} from "./amusements/catalogue.js?v=alley-webp-1";
import {installWallBackdrops} from "./walls/install.js?v=wall-bay-2";
import {installPapercutRides} from "./amusements/install.js?v=ride-side-1";
import {installVendorCutouts} from "./vendor-cutouts.js?v=vendor-face-1";
import {installStallCutouts} from "./stall-cutouts.js?v=alley-webp-1";
import {games as paperGames} from "../paper-games/catalogue.js?v=penny-door-1";

const CUTOUT = (id) => `assets/restyle/scene-turnarounds-2026-09-09/stalls/${id}/front.webp`;
const STALLS = [
  { id: "fortune", kind: "tent", art: CUTOUT("fortune"), accent: 0x6b3a8a, line: "Three cards. A keepsake is hiding in the deck." },
  { id: "love", kind: "cabinet", art: CUTOUT("love"), accent: 0xc43a5a, line: "Two names. Count the loves. Read the heat." },
  { id: "curios", kind: "cabinet", art: CUTOUT("curios"), accent: 0x8a6230, line: "Reconnect the tracks. The beetle only walks the glow." },
  { id: "lookup", kind: "tent", art: CUTOUT("lookup"), accent: 0x3d6a8a, line: "Turn the brass glasses. Wake the sky." },
  { id: "snap", kind: "cabinet", art: CUTOUT("snap"), accent: 0xe8d0a0, line: "Frame the hanging prize before the light goes." },
  { id: "whisper", kind: "tent", art: CUTOUT("whisper"), accent: 0x8a4a6a, line: "Stamp a letter. Fan it home." },
  { id: "ball-toss", kind: "booth", art: CUTOUT("ball-toss"), accent: 0xc45a3a, line: "Knock every lantern in one toss." },
  { id: "coin-pusher", kind: "cabinet", art: CUTOUT("coin-pusher"), accent: 0xd4a45a, line: "A penny shoves the tide. Walk away — the trays stay." },
  { id: "pinball", kind: "cabinet", art: CUTOUT("pinball"), accent: 0x3a8a6a, line: "A penny pulls the spring. Tap the bats. The glass always smiles last." },
  { id: "water-gun", kind: "booth", art: CUTOUT("water-gun"), accent: 0x3a7aaa, line: "Nudge a little sailboat through a paper harbour." },
  { id: "milk-bottles", kind: "booth", art: CUTOUT("milk-bottles"), accent: 0xc0c4cc, line: "A penny a bead. Two or three throws. The shelf or the book." },
  { id: "cover-the-spot", kind: "booth", art: CUTOUT("cover-the-spot"), accent: 0xc45a6a, line: "Cover the moon. Don’t get greedy." },
  { id: "mutoscope", kind: "cabinet", art: CUTOUT("mutoscope"), accent: 0x8a3030, line: "Crank the reel. Light the story." },
  { id: "high-striker", kind: "booth", art: CUTOUT("high-striker"), accent: 0xd45a3a, line: "One penny, one strike. Ring the lit mouth." },
  { id: "catoptromancy", kind: "tent", art: CUTOUT("catoptromancy"), accent: 0x5a3a8a, line: "Fold the glass. Don’t look away." },
  { id: "bent-rings", kind: "booth", art: CUTOUT("bent-rings"), accent: 0x8a6a3a, line: "Seat the ring on the wishing branch." },
  { id: "plinko", kind: "cabinet", art: CUTOUT("plinko"), accent: 0x3a8a8a, line: "Drop a marble. Flip the gates." },
  { id: "fairy-floss", kind: "tent", art: CUTOUT("fairy-floss"), accent: 0xe8a0c0, line: "Wind the cloud. Don’t snap the sugar." },
  { id: "popcorn", kind: "booth", art: CUTOUT("popcorn"), accent: 0xe8c45a, line: "Pump the bellows. Catch the pop." },
  { id: "duck-pond", kind: "booth", art: CUTOUT("duck-pond"), accent: 0x3a8a5a, line: "Paddle the flock home." },
  { id: "skee-ball", kind: "booth", art: CUTOUT("skee-ball"), accent: 0xc46a3a, line: "A penny a roll. Land the hanging moon." },
  { id: "penny-pitch", kind: "booth", art: CUTOUT("penny-pitch"), accent: 0xd4a45a, line: "Skip a penny across the wells." },
  { id: "dunk-tank", kind: "booth", art: CUTOUT("dunk-tank"), accent: 0x3a6aaa, line: "One bead. Clear the plates." },
  { id: "marquee", kind: "cabinet", art: CUTOUT("marquee"), accent: 0xf0d09a, line: "Wake the night. Catch the hanging prize." },
  { id: "pack", kind: "booth", art: CUTOUT("pack"), accent: 0x8a6230, line: "Tuck pennies. Nestle the unique." },
  { id: "pass", kind: "tent", art: CUTOUT("pass"), accent: 0x5a2030, line: "Walk the gaps. Catch the hanging prize." },
];
const paperById = Object.fromEntries((paperGames || []).map((g) => [g.id, g]));
for (const spec of STALLS) {
  const g = paperById[spec.id];
  if (!g) continue;
  spec.host = g.host;
  spec.hostSlug = String(g.host || "").toLowerCase().replace(/[^a-z]+/g, "");
  spec.name = g.title;
  spec.blurb = g.blurb;
  spec.line = g.blurb;
}

const SKIN = 0xf0c4a8;
const HAIR = 0x3d2418;
const DRESS = 0x1e6b3c;
const GOLD = 0xe8b84a;
const HEART = 0xd22b3a;
const BLOUSE = 0xf5f0ea;
const WOOD = 0x3a2418;
const WOOD_DARK = 0x1a100c;
const VELVET = 0x4a1a28;
const BRASS = 0xd4a45a;

/* Straight sideshow alley: pier → palace door → stalls L/R → dead end.
 * Stalls sit off the walk, faces angled toward incoming walkers. Tap a door. */
const STALL_X = paperRail ? 2.52 : 2.62;
const STALL_STEP = paperRail ? 6.6 : 2.68;
const STALL_Z0 = paperRail ? 14 : 8;
const AISLE = 1.62;
const WALK_X = AISLE;
const FACE_PULL = paperRail ? 3.2 : 1.7;
const DOOR_REACH = 2.6;
const COUNTER_X = 0.58;
const COUNTER_Z = 1.18;
const COUNTER_REACH = 1.92;
let hallLen = 0;

const geoBox = new THREE.BoxGeometry(1, 1, 1);
const geoSphere = new THREE.SphereGeometry(1, 14, 12);
const geoCyl = new THREE.CylinderGeometry(1, 1, 1, 10);
const loader = new THREE.TextureLoader();

function canGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function canvasTex(w, h, draw, repeatX, repeatY) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX || 1, repeatY || 1);
  t.anisotropy = 4;
  return t;
}

function woodTex(tint, grain) {
  return canvasTex(256, 256, (ctx) => {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 18; i += 1) {
      ctx.fillStyle = `rgba(0,0,0,${0.04 + (i % 3) * 0.03})`;
      ctx.fillRect(i * 14 + 4, 0, 3, 256);
    }
    ctx.strokeStyle = grain;
    ctx.lineWidth = 1.2;
    for (let y = 8; y < 256; y += 17) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(80, y + 6, 160, y - 5, 256, y + 3);
      ctx.stroke();
    }
  }, 4, 4);
}

function stripeTex(a, b) {
  return canvasTex(128, 128, (ctx) => {
    const w = 16;
    for (let i = 0; i < 8; i += 1) {
      ctx.fillStyle = i % 2 ? a : b;
      ctx.fillRect(i * w, 0, w, 128);
    }
  }, 2, 1);
}

function starTex() {
  return canvasTex(512, 512, (ctx) => {
    ctx.fillStyle = "#070b16";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 220; i += 1) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 1.4 + 0.3;
      ctx.fillStyle = `rgba(255,245,220,${0.35 + Math.random() * 0.65})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function artMap(url) {
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function texFromCanvas(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

function punchPalaceFacade(img) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1536;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, img.width * 0.10, 0, img.width * 0.90, img.height * 0.76, 0, 0, c.width, c.height);
  const dw = c.width * 0.22;
  const dh = c.height * 0.28;
  const dx = c.width * 0.52 - dw / 2;
  const dy = c.height * 0.70;
  ctx.clearRect(dx, dy, dw, dh);
  return texFromCanvas(c);
}

function auraCutout(img) {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 960;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const cx = c.width * 0.5;
  const cy = c.height * 0.46;
  for (let y = 0; y < c.height; y += 1) {
    for (let x = 0; x < c.width; x += 1) {
      const i = (y * c.width + x) * 4;
      const dx = (x - cx) / (c.width * 0.36);
      const dy = (y - cy) / (c.height * 0.50);
      const d = Math.sqrt(dx * dx + dy * dy);
      const a = Math.max(0, Math.min(1, 1 - (d - 0.68) / 0.32));
      data.data[i + 3] = Math.floor(data.data[i + 3] * a);
    }
  }
  ctx.putImageData(data, 0, 0);
  return texFromCanvas(c);
}

function wetPlankTex() {
  return canvasTex(512, 512, (ctx) => {
    ctx.fillStyle = "#16110c";
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 40) {
      ctx.fillStyle = y % 80 ? "#2a2118" : "#20180f";
      ctx.fillRect(0, y, 512, 36);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, y + 35, 512, 2);
      ctx.fillStyle = "rgba(255,196,90,0.10)";
      ctx.fillRect(50 + (y % 90), y + 10, 160, 5);
      ctx.fillRect(260, y + 20, 110, 3);
    }
    ctx.fillStyle = "rgba(255, 170, 60, 0.08)";
    for (let i = 0; i < 14; i += 1) ctx.fillRect(24 + i * 36, 0, 2, 512);
  }, 1, 8);
}

function meshBox(mat, w, h, d, x, y, z) {
  const m = new THREE.Mesh(geoBox, mat);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  return m;
}

function meshSphere(mat, r, x, y, z) {
  const m = new THREE.Mesh(geoSphere, mat);
  m.scale.setScalar(r);
  m.position.set(x, y, z);
  return m;
}

function meshCyl(mat, rTop, rBot, h, x, y, z) {
  const m = new THREE.Mesh(geoCyl, mat);
  m.scale.set(rTop, h, rBot);
  m.position.set(x, y, z);
  return m;
}

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.55);
  s.bezierCurveTo(-0.7, -0.15, -0.65, 0.45, 0, 0.28);
  s.bezierCurveTo(0.65, 0.45, 0.7, -0.15, 0, -0.55);
  return s;
}

function makeMat(color, extra) {
  return new THREE.MeshStandardMaterial(Object.assign({
    color,
    roughness: 0.72,
    metalness: 0.08,
  }, extra || {}));
}

function makePerson(opts) {
  const g = new THREE.Group();
  const chibi = !!opts.chibi;
  const skin = makeMat(opts.skin || SKIN, { emissive: 0x3a2018, emissiveIntensity: 0.12 });
  const cloth = makeMat(opts.cloth || 0x3a3040);
  const dark = makeMat(opts.shoes || 0x1a1a1a);
  const scale = opts.scale || 1;
  g.scale.setScalar(scale);

  const hip = new THREE.Group();
  hip.position.y = 0.42;
  g.add(hip);

  const torso = meshCyl(cloth, chibi ? 0.12 : 0.13, chibi ? 0.15 : 0.16, 0.28, 0, 0.28, 0);
  hip.add(torso);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(chibi ? 0.26 : 0.22, 0.12, chibi ? 0.36 : 0.32, 12), cloth);
  skirt.position.y = 0.06;
  hip.add(skirt);

  const head = new THREE.Group();
  head.position.y = chibi ? 0.64 : 0.58;
  hip.add(head);
  head.add(meshSphere(skin, chibi ? 0.22 : 0.175, 0, 0.02, 0));
  const eyeW = makeMat(0xf7f2ea);
  const eyeD = makeMat(0x2a1810);
  const highlight = makeMat(0xffffff);
  [-1, 1].forEach((side) => {
    const white = meshSphere(eyeW, 0.038, side * (chibi ? 0.07 : 0.055), 0.03, chibi ? 0.19 : 0.15);
    white.scale.set(chibi ? 0.05 : 0.038, chibi ? 0.058 : 0.044, 0.02);
    head.add(white);
    head.add(meshSphere(eyeD, chibi ? 0.026 : 0.02, side * (chibi ? 0.07 : 0.055), 0.03, chibi ? 0.21 : 0.168));
    head.add(meshSphere(highlight, 0.01, side * (chibi ? 0.06 : 0.048), 0.045, chibi ? 0.22 : 0.18));
  });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI), makeMat(0xc45a6a));
  smile.position.set(0, -0.05, chibi ? 0.2 : 0.16);
  smile.rotation.x = 2.6;
  head.add(smile);

  function limb(side, arm) {
    const pivot = new THREE.Group();
    pivot.position.set(side * (arm ? 0.16 : 0.07), arm ? 0.36 : 0.0, 0);
    const len = arm ? 0.28 : 0.34;
    const rad = arm ? 0.035 : 0.042;
    const bone = meshCyl(arm ? skin : cloth, rad, rad, len, 0, -len / 2, 0);
    pivot.add(bone);
    if (!arm) {
      const shoe = meshBox(dark, 0.08, 0.05, 0.12, 0, -len - 0.02, 0.03);
      pivot.add(shoe);
    } else {
      const hand = meshSphere(skin, 0.04, 0, -len, 0);
      pivot.add(hand);
    }
    hip.add(pivot);
    return pivot;
  }

  const armL = limb(-1, true);
  const armR = limb(1, true);
  const legL = limb(-1, false);
  const legR = limb(1, false);

  g.userData = {
    kind: opts.kind || "guest",
    t: Math.random() * 10,
    armL,
    armR,
    legL,
    legR,
    head,
    hip,
    wave: false,
    heading: 0,
  };
  return g;
}

function dressAura(g) {
  const hip = g.userData.hip;
  const head = g.userData.head;
  const blouse = makeMat(BLOUSE, { emissive: 0x3a3028, emissiveIntensity: 0.2 });
  const dress = makeMat(DRESS, { emissive: 0x0a2010, emissiveIntensity: 0.25 });
  hip.children[0].material = blouse;
  hip.children[1].material = dress;
  const heart = meshBox(makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.55, roughness: 0.4 }), 0.09, 0.09, 0.04, 0, 0.22, 0.16);
  heart.rotation.z = Math.PI / 4;
  hip.add(heart);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 16), blouse);
  collar.position.y = 0.44;
  collar.rotation.x = Math.PI / 2;
  hip.add(collar);

  const hairM = makeMat(HAIR, { emissive: 0x1a0c08, emissiveIntensity: 0.15 });
  head.add(meshSphere(hairM, 0.23, 0, 0.06, -0.02));
  [-1, 1].forEach((side) => {
    head.add(meshSphere(hairM, 0.11, side * 0.2, -0.04, 0.04));
    head.add(meshSphere(makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.6 }), 0.045, side * 0.2, 0.06, 0.06));
  });
  head.add(meshBox(hairM, 0.28, 0.07, 0.1, 0, 0.14, 0.16));

  const crown = new THREE.Group();
  crown.position.y = 0.24;
  head.add(crown);
  const gold = makeMat(GOLD, { metalness: 0.65, roughness: 0.28, emissive: 0x6a4808, emissiveIntensity: 0.55 });
  crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), gold));
  [-0.09, 0, 0.09].forEach((x, i) => {
    const h = i === 1 ? 0.14 : 0.09;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, h, 6), gold);
    spike.position.set(x, h * 0.45, 0);
    crown.add(spike);
  });
  const gem = meshBox(makeMat(HEART, { emissive: HEART, emissiveIntensity: 0.7 }), 0.055, 0.055, 0.025, 0, 0.02, 0.11);
  gem.rotation.z = Math.PI / 4;
  crown.add(gem);
  g.userData.kind = "aura";
}

function makeNoteBoard(title, lines) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1b3a28";
  ctx.fillRect(0, 0, 768, 512);
  ctx.fillStyle = "#143022";
  ctx.fillRect(18, 18, 732, 476);
  ctx.strokeStyle = "#d4a45a";
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, 732, 476);
  ctx.fillStyle = "#f0d09a";
  ctx.font = "700 36px Georgia, serif";
  ctx.fillText(title, 48, 78);
  ctx.fillStyle = "#e8f0d8";
  ctx.font = "22px Georgia, serif";
  lines.forEach((line, i) => ctx.fillText(line, 48, 128 + i * 34));
  const tex = texFromCanvas(canvas);
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  const m = new THREE.Mesh(geoBox, mat);
  m.scale.set(1.55, 1.05, 0.04);
  return m;
}

function dressBarker(g, accent) {
  g.userData.hip.children[0].material = makeMat(0xf3e6d0);
  g.userData.hip.children[1].material = makeMat(accent || VELVET);
  const hat = meshCyl(makeMat(0x1a1010), 0.12, 0.16, 0.08, 0, 0.2, 0);
  g.userData.head.add(hat);
  g.userData.kind = "barker";
}

function animatePerson(p, dt, moving, waving) {
  const u = p.userData;
  if (paperRail && (u.papercutStand || u.paperCrew || u.paperGuest || u.paperProprietor || u.vendorHost)) return;
  u.t += dt * (moving ? 9 : 2.4);
  const bob = Math.sin(u.t) * (moving ? 0.04 : 0.012);
  u.hip.position.y = 0.42 + bob;
  const swing = moving ? Math.sin(u.t) * 0.7 : Math.sin(u.t * 0.5) * 0.08;
  u.armL.rotation.x = waving ? 0.15 : swing;
  u.legL.rotation.x = -swing * 0.85;
  u.legR.rotation.x = swing * 0.85;
  if (waving) {
    u.armR.rotation.x = -0.2;
    u.armR.rotation.z = -0.9 + Math.sin(u.t * 2.4) * 0.45;
  } else {
    u.armR.rotation.z = 0.05;
    u.armR.rotation.x = -swing;
  }
  poseRestyle(p, dt);
}

function makeSign(text, accent) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 176;
  const ctx = canvas.getContext("2d");
  const bg = ctx.createLinearGradient(0, 0, 0, 176);
  bg.addColorStop(0, "#351520");
  bg.addColorStop(0.55, "#1a0c10");
  bg.addColorStop(1, "#080407");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillRect(0, 128, 512, 48);
  ctx.strokeStyle = "#f0c96f";
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 160);
  ctx.fillStyle = "#e8a0b8";
  ctx.font = "800 18px system-ui, sans-serif";
  ctx.letterSpacing = "5px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✦  STEP RIGHT UP  ✦", 256, 38);
  ctx.fillStyle = "#f0d09a";
  const fontSize = text.length > 20 ? 34 : text.length > 14 ? 40 : 47;
  ctx.font = `800 ${fontSize}px Georgia, serif`;
  ctx.shadowColor = "rgba(255, 190, 70, 0.75)";
  ctx.shadowBlur = 12;
  ctx.fillText(text.toUpperCase(), 256, 105, 455);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: accent || BRASS,
    emissiveIntensity: 0.34,
    roughness: 0.55,
  });
  const m = new THREE.Mesh(geoBox, mat);
  m.scale.set(1.72, 0.54, 0.06);
  return m;
}

function makeStall(spec, x, z, yaw) {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  /* Local +Z is the pretty face. Yaw so that face looks at walkers on the aisle. */
  root.rotation.y = yaw;
  const faceZ = spec.kind === "tent" ? 0.76 : spec.kind === "cabinet" ? 0.56 : 0.52;
  root.userData.stall = spec;
  root.userData.worldX = x;
  root.userData.worldZ = z;
  root.userData.faceOff = faceZ + 0.4;
  root.userData.hitR = spec.kind === "tent" ? 1.02 : spec.kind === "cabinet" ? 0.86 : 0.94;
  if (paperRail) return root;
  const wood = makeMat(WOOD, { map: woodTex("#4a2e1c", "rgba(0,0,0,0.18)") });
  const dark = makeMat(WOOD_DARK);
  const velvet = makeMat(VELVET);
  const accent = makeMat(spec.accent, { emissive: spec.accent, emissiveIntensity: 0.35 });
  const art = new THREE.MeshBasicMaterial({
    map: artMap(spec.art),
  });

  if (spec.kind === "tent") {
    root.add(meshBox(wood, 1.7, 0.12, 1.5, 0, 0.06, 0));
    root.add(meshBox(velvet, 1.55, 1.7, 1.35, 0, 1.0, -0.05));
    const stripe = new THREE.MeshStandardMaterial({
      map: stripeTex("#7a2040", "#f0d09a"),
      roughness: 0.7,
    });
    const roofL = meshBox(stripe, 1.15, 0.08, 1.5, -0.4, 2.05, 0);
    roofL.rotation.z = 0.45;
    const roofR = meshBox(stripe, 1.15, 0.08, 1.5, 0.4, 2.05, 0);
    roofR.rotation.z = -0.45;
    root.add(roofL, roofR);
    const poster = new THREE.Mesh(geoBox, art);
    poster.scale.set(1.43, 1.62, 0.05);
    poster.position.set(0, 1.18, 0.72);
    root.add(poster);
  } else if (spec.kind === "cabinet") {
    root.add(meshBox(dark, 1.52, 2.1, 0.95, 0, 1.06, 0));
    root.add(meshBox(velvet, 1.56, 0.5, 1.0, 0, 2.28, 0));
    const screen = new THREE.Mesh(geoBox, art);
    screen.scale.set(1.41, 1.67, 0.06);
    screen.position.set(0, 1.28, 0.52);
    root.add(screen);
    root.add(meshBox(accent, 1.58, 0.18, 0.55, 0, 2.58, 0.12));
    root.add(meshBox(wood, 1.54, 0.14, 0.6, 0, 0.48, 0.38));
  } else {
    root.add(meshBox(wood, 1.55, 0.9, 0.85, 0, 0.5, 0.05));
    root.add(meshBox(dark, 1.6, 1.5, 0.22, 0, 1.35, -0.28));
    const awning = new THREE.MeshStandardMaterial({
      map: stripeTex("#c43a5a", "#f7ebe0"),
      roughness: 0.65,
    });
    const awn = meshBox(awning, 1.7, 0.08, 1.05, 0, 1.95, 0.22);
    awn.rotation.x = -0.28;
    root.add(awn);
    const poster = new THREE.Mesh(geoBox, art);
    poster.scale.set(1.42, 1.42, 0.05);
    poster.position.set(0, 1.2, 0.48);
    root.add(poster);
  }

  const sign = makeSign(spec.name, spec.accent);
  sign.position.set(0, spec.kind === "cabinet" ? 2.94 : 2.56, 0.42);
  root.add(sign);

  root.add(meshBox(dark, 0.09, 1.62, 0.09, -0.64, 1.12, faceZ));
  root.add(meshBox(dark, 0.09, 1.62, 0.09, 0.64, 1.12, faceZ));
  root.add(meshBox(accent, 1.38, 0.1, 0.1, 0, 1.96, faceZ));
  root.add(meshBox(wood, 0.92, 0.07, 0.5, 0, 0.04, faceZ + 0.34));
  return root;
}

function makePalace(group) {
  const wood = makeMat(0x3a281c, { map: woodTex("#3a281c", "rgba(0,0,0,0.22)"), roughness: 0.8 });
  const gold = makeMat(GOLD, { metalness: 0.55, roughness: 0.35, emissive: 0x6a4008, emissiveIntensity: 0.45 });
  const roof = makeMat(0x1c120c);
  const frontZ = -7.35;

  group.add(meshBox(wood, 5.6, 4.6, 2.6, 0.15, 2.4, -5.15));
  const rL = meshBox(roof, 4.2, 0.18, 3.6, -1.6, 5.9, -5.4);
  rL.rotation.z = 0.38;
  const rR = meshBox(roof, 4.2, 0.18, 3.6, 2.0, 5.9, -5.4);
  rR.rotation.z = -0.38;
  group.add(rL, rR);

  const interior = makeMat(0x12080a, { emissive: 0x4a220c, emissiveIntensity: 0.45, roughness: 0.9 });
  group.add(meshBox(interior, 1.7, 2.7, 2.6, 0, 1.38, frontZ + 1.35));
  group.add(meshBox(makeMat(0x1a100c), 0.2, 3.05, 0.28, -1.05, 1.52, frontZ + 0.08));
  group.add(meshBox(makeMat(0x1a100c), 0.2, 3.05, 0.28, 1.05, 1.52, frontZ + 0.08));
  group.add(meshBox(makeMat(0x1a100c), 2.3, 0.18, 0.28, 0, 3.02, frontZ + 0.08));

  const facadeMap = artMap("assets/restyle/paper-entrance-cutout.png");
  const facade = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6, 11.4),
    new THREE.MeshBasicMaterial({ map: facadeMap, side: THREE.DoubleSide })
  );
  facade.position.set(0.1, 5.65, frontZ);
  facade.rotation.y = Math.PI;
  group.add(facade);
  loadImage("assets/restyle/paper-entrance-cutout.png").then((img) => {
    facade.material = new THREE.MeshBasicMaterial({
      map: punchPalaceFacade(img),
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide,
    });
  }).catch(() => {});

  const heartMat = new THREE.MeshBasicMaterial({ color: 0xff5a18, transparent: true, opacity: 0.88 });
  const hGeo = new THREE.ExtrudeGeometry(heartShape(), { depth: 0.1, bevelEnabled: false });
  [[0.1, 4.9, frontZ + 0.08, 1.15], [-1.9, 3.35, frontZ + 0.08, 0.62], [2.15, 3.45, frontZ + 0.08, 0.6]].forEach((h) => {
    const m = new THREE.Mesh(hGeo, heartMat);
    m.position.set(h[0], h[1], h[2]);
    m.scale.setScalar(h[3]);
    group.add(m);
  });
  const crownHeart = new THREE.Mesh(hGeo, new THREE.MeshBasicMaterial({ color: 0xffc040 }));
  crownHeart.position.set(0.15, 7.55, frontZ + 0.06);
  crownHeart.scale.setScalar(0.82);
  group.add(crownHeart);
  group.add(meshBox(gold, 0.08, 0.24, 0.08, 0.15, 8.0, frontZ + 0.06));

  const glow = new THREE.PointLight(0xff6a22, 8.5, 34, 1.3);
  glow.position.set(0, 2.4, frontZ + 2.2);
  group.add(glow);
  const porch = new THREE.PointLight(0xffc878, 4.2, 18, 1.5);
  porch.position.set(0, 2.1, frontZ + 2.6);
  group.add(porch);
  const spill = new THREE.SpotLight(0xff8a40, 7.2, 30, 0.72, 0.42, 1.15);
  spill.position.set(0, 3.0, frontZ + 0.4);
  spill.target.position.set(0, 0, frontZ - 8);
  group.add(spill);
  group.add(spill.target);

  const lantern = new THREE.MeshBasicMaterial({ color: 0xffe2a0 });
  [-1.35, 1.35].forEach((x) => {
    group.add(meshCyl(gold, 0.05, 0.05, 0.55, x, 2.55, frontZ + 0.25));
    group.add(meshSphere(lantern, 0.13, x, 2.2, frontZ + 0.25));
    const lamp = new THREE.PointLight(0xffd090, 1.8, 8, 2);
    lamp.position.set(x, 2.2, frontZ + 0.5);
    group.add(lamp);
  });
}

function makePier(group) {
  const plank = makeMat(0x2a2218, {
    map: wetPlankTex(),
    roughness: 0.22,
    metalness: 0.28,
    emissive: 0x2a1808,
    emissiveIntensity: 0.18,
  });
  const pier = meshBox(plank, 11, 0.18, 34, 0, -0.08, -20);
  group.add(pier);
  const rail = makeMat(0x3a2a1c);
  const lantern = new THREE.MeshBasicMaterial({ color: 0xffe0a0 });
  [-5.2, 5.2].forEach((x) => {
    group.add(meshBox(rail, 0.12, 0.7, 34, x, 0.4, -20));
    for (let z = -32; z < -4; z += 3.4) {
      group.add(meshCyl(rail, 0.07, 0.07, 0.85, x, 0.45, z));
      group.add(meshSphere(lantern, 0.07, x, 0.95, z));
    }
  });
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.MeshBasicMaterial({ color: 0x081420 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(-20, -0.5, -24);
  group.add(water);
  const water2 = water.clone();
  water2.position.set(20, -0.5, -24);
  group.add(water2);
  const foam = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 3.2),
    new THREE.MeshBasicMaterial({ color: 0x8aa0b8, transparent: true, opacity: 0.18 })
  );
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(-8, -0.42, -22);
  group.add(foam);
}

function makeHall(group, len) {
  const floorT = woodTex("#4a3424", "rgba(20,10,0,0.2)");
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(paperRail ? 9.8 : 8.6, len + 4),
    makeMat(0x4a3424, { map: floorT, roughness: 0.78 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, len / 2);
  group.add(floor);
  const throat = meshBox(
    makeMat(0x4a3424, { map: floorT, roughness: 0.78 }),
    2.5, 0.05, 8.2,
    0, 0.01, -3.6
  );
  group.add(throat);

  const wallT = woodTex("#2a1a12", "rgba(0,0,0,0.25)");
  const wallM = makeMat(0x2a1a12, { map: wallT, roughness: 0.85 });
  if (paperRail) {
    makePaperWalls(group, len);
  } else {
  [-1, 1].forEach((side) => {
    group.add(meshBox(wallM, 0.28, 4.6, len, side * 4.25, 2.3, len / 2));
    group.add(meshBox(makeMat(VELVET), 0.12, 1.4, len, side * 4.05, 3.6, len / 2));
  });
  group.add(meshBox(makeMat(0x1c120e), 8.8, 0.2, len, 0, 4.7, len / 2));
  group.add(meshBox(makeMat(WOOD_DARK), 8.6, 3.6, 0.4, 0, 1.8, len + 1.6));
  }

  const lampMat = makeMat(0xffe2a8, { emissive: 0xffd08a, emissiveIntensity: 0.85 });
  const brass = makeMat(BRASS, { metalness: 0.7, roughness: 0.3 });
  for (let z = 8; z < len - 2; z += 8) {
    [-1, 1].forEach((side) => {
      const lx = side * 3.55;
      group.add(meshCyl(brass, 0.05, 0.05, 0.4, lx, 3.7, z));
      group.add(meshSphere(lampMat, 0.12, lx, 3.45, z));
    });
    if (paperRail) continue;
    const lamp = new THREE.PointLight(0xffd090, 1.25, 14, 2);
    lamp.position.set(0, 3.5, z);
    lamp.userData.flicker = 0.8 + Math.random();
    group.add(lamp);
  }

  if (!paperRail) {
    const coinGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.01, 10);
    const coinMat = makeMat(GOLD, { metalness: 0.8, roughness: 0.35, emissive: 0x3a2a08, emissiveIntensity: 0.15 });
    const coins = new THREE.InstancedMesh(coinGeo, coinMat, 140);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 140; i += 1) {
      dummy.position.set((Math.random() - 0.5) * 2.4, 0.02, 4 + Math.random() * (len - 8));
      dummy.rotation.set(Math.PI / 2, 0, Math.random() * Math.PI);
      dummy.updateMatrix();
      coins.setMatrixAt(i, dummy.matrix);
    }
    group.add(coins);
  }
}

function makeSky(radius) {
  const geo = new THREE.SphereGeometry(radius, 24, 16);
  const mat = new THREE.MeshBasicMaterial({ map: starTex(), side: THREE.BackSide });
  return new THREE.Mesh(geo, mat);
}

function makeFireflies() {
  const n = paperRail ? 18 : 90;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  const phase = [];
  for (let i = 0; i < n; i += 1) {
    pos[i * 3] = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = 0.4 + Math.random() * 5.5;
    pos[i * 3 + 2] = -36 + Math.random() * (hallLen + 20);
    phase.push(Math.random() * Math.PI * 2);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 64;
  const glowCtx = glowCanvas.getContext("2d");
  const glow = glowCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
  glow.addColorStop(0, "rgba(255,255,225,1)");
  glow.addColorStop(0.28, "rgba(255,214,112,.95)");
  glow.addColorStop(1, "rgba(255,170,50,0)");
  glowCtx.fillStyle = glow;
  glowCtx.fillRect(0, 0, 64, 64);
  const glowMap = new THREE.CanvasTexture(glowCanvas);
  const mat = new THREE.PointsMaterial({
    color: 0xffd080,
    map: glowMap,
    alphaTest: 0.02,
    size: 0.22,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.userData.phase = phase;
  return pts;
}

function makeLooseCoins() {
  const group = new THREE.Group();
  const face = makeMat(0xe8b84a, { metalness: 0.72, roughness: 0.24, emissive: 0x6a3d00, emissiveIntensity: 0.55 });
  const mark = makeMat(0x8a5418, { metalness: 0.75, roughness: 0.3 });
  const count = 7;
  for (let i = 0; i < count; i += 1) {
    const coin = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.055, 24), face);
    disc.rotation.z = Math.PI / 2;
    coin.add(disc);
    const stamp = new THREE.Mesh(new THREE.ExtrudeGeometry(heartShape(), { depth: 0.025, bevelEnabled: false }), mark);
    stamp.scale.setScalar(0.09);
    stamp.rotation.y = Math.PI / 2;
    stamp.position.x = 0.04;
    coin.add(stamp);
    const segment = (hallLen - STALL_Z0 - 5) / count;
    coin.position.set((Math.random() - 0.5) * 2.05, 0.55, STALL_Z0 + 2.5 + segment * (i + 0.35 + Math.random() * 0.35));
    coin.userData.baseY = coin.position.y;
    coin.userData.phase = Math.random() * Math.PI * 2;
    coin.userData.collected = false;
    group.add(coin);
  }
  return group;
}

const GATE_Z = paperRail ? COUNTER.z + 1.2 : -7.52;
const AURA_DOOR = paperRail ? { x: -1.55, z: 6.2 } : { x: 0.12, z: -7.72 };
const AURA_TILL = paperRail ? AURA_DOOR : { x: 2.15, z: 3.1 };

function pfState() {
  return (window.PennyFever && typeof window.PennyFever.getState === "function" && window.PennyFever.getState()) || {};
}
function ticketPassed() {
  return !!pfState().admitPassed;
}
function hasAdmitTicket() {
  return !!pfState().admitTicket;
}
function pocketPennies() {
  return Number(pfState().demoCoins) || 0;
}
function pocketTickets() {
  const PF = window.PennyFever;
  if (typeof PF?.tickets === "function") return PF.tickets();
  return Number(pfState().playTickets) || 0;
}
function paintPocketHud() {
  const pocketCount = el("pfPocketCoinCount");
  if (pocketCount) pocketCount.textContent = String(pocketPennies());
  const ticketCount = el("pfPocketScripCount");
  if (ticketCount) ticketCount.textContent = String(pocketTickets());
}
function stallEnterLabel(id) {
  id = playIdFor(id);
  if (id === "fortune") return "Sit for a reading · 1 penny";
  if (id === "coin-pusher") return "The trays · pennies";
  if (id === "pinball") return "The table · pennies";
  if (id === "milk-bottles") return "The dairy · pennies";
  if (id === "skee-ball") return "The moonbow · pennies";
  if (id === "love") return "Enter · 1 penny";
  const sitDown = new Set(["carousel", "balloons", "ferris", "helter", "swings", "funhouse", "organ", "mural"]);
  if (sitDown.has(id)) return "Enter · 1 penny";
  return "Enter · pennies";
}

const api = {
  ok: false,
  started: false,
  paused: false,
  gateBump: false,
  facedAlley: false,
  start,
  stop,
  pause,
  resume,
  pose,
  warp,
  step,
  stepOut,
};

window.PennyFeverWorld = api;

let renderer, scene, camera, clock;
let player, aura, barkers, guests, stalls, fireflies, lamps, looseCoins, wallBackdrops, papercutRides, vendorCutouts, stallCutouts;
let keys = {};
let joy = { x: 0, y: 0, active: false };
let camYaw = 0;
let glanceYaw = 0;
let lookDrag = false;
let viewBlend = 0;
let nearest = null;
let focus = null;
let vendorChatUntil = 0;
let moveIntent = { ix: 0, iy: 0 };
let stallCardOpen = false;
let stallCardPinned = false;
let alleyMapOpen = false;
let stallCardId = "";
let stallCardView = "front";
let lookZoom = 1;
const LOOK_VIEWS = ["front", "left", "back", "right"];

let promptTargetSlug = "";
let raf = 0;
let hintTimer = 0;
let solids = [];
let loopingAlley = false;
let loopTimer = 0;
let loopOpenTimer = 0;
let gatePromptActive = false;
let chatPinned = false;
let pendingTillCashIn = false;
let tillMessage = "";
let tillMessageUntil = 0;
const hudAnchor = new THREE.Vector3();

function el(id) {
  return document.getElementById(id);
}

function attachHud() {
  const stage = el("pfWorldStage");
  if (!stage || el("pfWorldPrompt")) return;
  stage.insertAdjacentHTML("beforeend", `
    <div class="pf-world-hud" id="pfWorldHud">
      <div class="pf-world-top">
        <div class="pf-world-compass" id="pfWorldCompass">
          <span id="pfWorldZone">PIER</span>
          <strong id="pfWorldNearest">Heart palace</strong>
        </div>
        <nav class="pf-world-pocket" aria-label="Your Penny Fever pocket">
          <button type="button" id="pfPocketScrip"><span>🎟</span><b id="pfPocketScripCount">0</b> Tickets</button>
          <button type="button" id="pfPocketTicket"><span>🪙</span><b id="pfPocketCoinCount">0</b> Pennies</button>
          <button type="button" id="pfPocketDoll"><span>🎀</span>Doll</button>
          <button type="button" id="pfPocketChat"><span>💬</span>Chat</button>
          <button type="button" id="pfPocketChest"><span>🗝</span>Treasures</button>
        </nav>
        <div class="pf-world-tools">
          <button type="button" id="pfAlleyMapOpen">Map</button>
          <button type="button" id="pfWorldLeave">Ticket desk</button>
          <a id="pfWorldHome" href="../index.html">Home</a>
        </div>
      </div>
      <div class="pf-world-speech" id="pfWorldSpeech" hidden>
        <b id="pfWorldSpeechName">Aura</b>
        <p id="pfWorldSpeechText"></p>
      </div>
      <div class="pf-world-prompt" id="pfWorldPrompt" hidden>
        <p class="pf-action-name" id="pfWorldPromptName"></p>
        <div class="pf-action-row">
          <button type="button" id="pfWorldEnter">Enter</button>
          <button type="button" id="pfWorldChat" hidden>Chat</button>
        </div>
        <em id="pfWorldPromptLine"></em>
      </div>
      <button type="button" class="pf-pass-chip" id="pfPassChip" hidden>
        <span id="pfPassChipHost"></span>
        <strong id="pfPassChipName"></strong>
        <em>Look</em>
      </button>
      <div class="pf-stall-card" id="pfStallCard" hidden>
        <div class="pf-stall-card-art">
          <img id="pfStallCardBooth" alt="" draggable="false">
          <img id="pfStallCardVendor" alt="" draggable="false">
        </div>
        <div class="pf-stall-card-views" id="pfStallCardViews">
          <button type="button" data-spin="-1" aria-label="Show previous view">◀ Back</button>
          <span id="pfStallCardViewLabel" aria-live="polite">front</span>
          <button type="button" data-spin="1" aria-label="Show next view">Forth ▶</button>
        </div>
        <p class="pf-stall-card-kicker" id="pfStallCardHost"></p>
        <h2 class="pf-stall-card-name" id="pfStallCardName"></h2>
        <p class="pf-stall-card-line" id="pfStallCardLine"></p>
        <div class="pf-stall-card-till" id="pfStallCardTill" hidden>
          <section class="aura-counter-wallet" aria-label="Current wallet">
            <p class="aura-counter-kicker">Your pocket</p>
            <ul id="pfAuraWalletList"></ul>
          </section>
          <button type="button" id="pfTillTrade">Trade 5 pennies · 1 ticket</button>
          <button type="button" id="pfTillTickets">Buy tickets &amp; pennies</button>
        </div>
        <div class="pf-stall-card-actions">
          <button type="button" id="pfStallCardEnter">Enter</button>
          <button type="button" id="pfStallCardChat">Chat</button>
          <button type="button" id="pfStallCardBack">Back to the alley</button>
        </div>
      </div>
      <div class="pf-look-rig" id="pfLookRig" hidden>
        <button type="button" data-orbit="-1" aria-label="Show previous view">◀ Back</button>
        <span id="pfLookRigLabel" aria-live="polite">front</span>
        <button type="button" data-orbit="1" aria-label="Show next view">Forth ▶</button>
      </div>
      <div class="pf-joy" id="pfJoy" aria-hidden="true"><i class="pf-joy-knob" id="pfJoyKnob"></i></div>
      <p class="pf-world-hint" id="pfWorldHint">Walk the boards · tap Look over your head · step toward a booth to open it</p>
      <div class="pf-world-loop-veil" id="pfWorldLoopVeil" aria-hidden="true"><span>THE NIGHT BENDS ROUND…</span></div>
      <div class="pf-alley-map" id="pfAlleyMap" hidden>
        <div class="pf-alley-map-bar">
          <strong>The World</strong>
          <button type="button" id="pfAlleyMapClose">Close</button>
        </div>
        <div class="pf-alley-map-board">
          <figure class="pf-alley-map-art">
            <img src="assets/restyle/maps/world-map.webp" alt="Flat world map ringed with ice. Aura’s Penny Fever is pinned on the disc." width="1024" height="1024" loading="lazy" decoding="async">
            <button type="button" class="pf-world-pin" id="pfAlleyMapYou" data-place="aura">
              <i aria-hidden="true"></i>
              <span>Aura’s Penny Fever</span>
            </button>
          </figure>
        </div>
        <div class="pf-alley-map-legend" id="pfAlleyMapLegend">
          <div class="pf-alley-map-marks">
            <button type="button" data-place="pier">Pier</button>
            <button type="button" data-place="aura">Aura’s booth</button>
            <button type="button" data-place="end">End of the walk</button>
          </div>
          <div class="pf-alley-map-rides" id="pfAlleyMapRides"></div>
          <div class="pf-alley-map-cols">
            <div id="pfAlleyMapLeft"></div>
            <div id="pfAlleyMapRight"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="pf-world-fail" id="pfWorldFail" hidden>
      <div>
        <p>This machine won’t spin a 3D alley.</p>
        <button type="button" id="pfWorldFailMap">Back to the entrance</button>
      </div>
    </div>
  `);
}

function fillAlleyMap() {
  const left = el("pfAlleyMapLeft");
  const right = el("pfAlleyMapRight");
  if (!left || !right || left.dataset.ready) return;
  left.dataset.ready = "1";
  STALLS.forEach((spec, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.place = spec.id;
    b.textContent = spec.host ? spec.host + " · " + spec.name : spec.name;
    (i % 2 === 0 ? left : right).append(b);
  });
  const rides = el("pfAlleyMapRides");
  if (rides) {
    Object.entries(RIDE_GAMES).forEach(([amuseId, playId]) => {
      const g = paperById[playId];
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.place = amuseId;
      b.textContent = g ? g.host + " · " + g.title : playId;
      rides.append(b);
    });
  }
}

function syncAlleyMapYou() {
  /* World map pin stays on Aura’s Penny Fever. Later parks get their own pins. */
}

function closeAlleyMap() {
  alleyMapOpen = false;
  const map = el("pfAlleyMap");
  if (map) map.hidden = true;
  document.body.classList.remove("pf-alley-map-open");
  const open = el("pfAlleyMapOpen");
  if (open) open.setAttribute("aria-pressed", "false");
}

function openAlleyMap() {
  fillAlleyMap();
  alleyMapOpen = true;
  closeStallCard();
  const map = el("pfAlleyMap");
  if (map) map.hidden = false;
  document.body.classList.add("pf-alley-map-open");
  const open = el("pfAlleyMapOpen");
  if (open) open.setAttribute("aria-pressed", "true");
  syncAlleyMapYou();
  paintPocketHud();
}

const RIDE_GAMES = {
  "horse-carousel": "carousel",
  "balloon-tree": "balloons",
  "ferris-wheel": "ferris",
  "helter-skelter": "helter",
  "chair-swings": "swings",
  "funhouse": "funhouse",
  "fairground-organ": "organ",
  "alley-wall-bay": "mural",
};
function playIdFor(id) {
  return RIDE_GAMES[id] || id;
}

function aisleX(side) {
  return (side || 1) * Math.min(WALK_X - 0.35, 0.95);
}

function boothPose(id) {
  if (!id) return null;
  const playId = playIdFor(id);
  const stall = stalls?.find((x) => x.userData.stall?.id === playId || x.userData.stall?.id === id);
  if (stall) {
    const side = Math.sign(stall.position.x) || 1;
    return { id: playId, x: aisleX(side), z: stall.position.z, yaw: 0 };
  }
  const rideKey = Object.keys(RIDE_GAMES).find((key) => RIDE_GAMES[key] === playId) || id;
  const ride = papercutRides?.figures?.find((f) => {
    if (f.userData.kind !== "ride") return false;
    const aid = f.userData.amusementId;
    return aid === rideKey || aid === id || aid === playId || RIDE_GAMES[aid] === playId;
  });
  if (ride) {
    const side = Math.sign(ride.position.x) || 1;
    return { id: playId, x: aisleX(side), z: ride.position.z, yaw: 0 };
  }
  return null;
}

function rememberAlleySpot(id) {
  const pose = boothPose(id) || (player && Number.isFinite(player.position.z) ? {
    id: id || "",
    x: player.position.x,
    z: player.position.z,
    yaw: camYaw,
  } : (id ? { id } : null));
  if (!pose) return;
  try { sessionStorage.setItem("pf-alley-spot", JSON.stringify(pose)); } catch { /* private mode */ }
}

function restoreAlleySpot() {
  try {
    const spot = JSON.parse(sessionStorage.getItem("pf-alley-spot") || "null");
    if (!spot) return false;
    const pose = Number.isFinite(Number(spot.z)) ? spot : boothPose(spot.id);
    if (!pose || !Number.isFinite(Number(pose.z))) return false;
    if (player) warp(Number(pose.x) || 0, Number(pose.z), Number.isFinite(Number(pose.yaw)) ? Number(pose.yaw) : 0);
    return true;
  } catch {
    return false;
  }
}

function stepOut(id) {
  const pose = boothPose(id);
  if (pose) {
    try { sessionStorage.setItem("pf-alley-spot", JSON.stringify(pose)); } catch { /* private mode */ }
    if (player) warp(pose.x, pose.z, pose.yaw);
    return true;
  }
  rememberAlleySpot(id);
  return restoreAlleySpot();
}

function enterStallById(id) {
  if (!id) return false;
  id = playIdFor(id);
  if (!document.getElementById("cabinet-" + id)) return false;
  rememberAlleySpot(id);
  closeStallCard();
  closeAlleyMap();
  location.hash = "cabinet/" + id;
  return true;
}

function walkToMapPlace(place) {
  if (!player) return;
  if (place === "pier") {
    closeAlleyMap();
    return warp(0, FOYER_IN + 1.2, 0);
  }
  if (place === "aura") {
    closeAlleyMap();
    return warp(paperRail ? -0.45 : 0.4, COUNTER.z + 1.15, 0);
  }
  if (place === "end") {
    closeAlleyMap();
    if (!ticketPassed()) return warp(paperRail ? -0.45 : 0.4, COUNTER.z + 1.15, 0);
    return warp(0, hallLen - 2.4, 0);
  }
  const s = stalls?.find((x) => x.userData.stall?.id === place);
  if (s) {
    const side = Math.sign(s.position.x) || 1;
    warp(side * 0.28, s.position.z, 0);
  } else {
    const ride = papercutRides?.figures?.find((f) => f.userData.amusementId === place);
    if (ride) warp((Math.sign(ride.position.x) || 1) * 0.28, ride.position.z, 0);
  }
  enterStallById(place);
}

function bindHud() {
  const leave = el("pfWorldLeave");
  const enter = el("pfWorldEnter");
  const pocketScrip = el("pfPocketScrip");
  const pocketTicket = el("pfPocketTicket");
  const pocketDoll = el("pfPocketDoll");
  const pocketChat = el("pfPocketChat");
  const pocketChest = el("pfPocketChest");
  const failMap = el("pfWorldFailMap");
  const mapOpen = el("pfAlleyMapOpen");
  const mapClose = el("pfAlleyMapClose");
  const mapLegend = el("pfAlleyMapLegend");
  if (leave) leave.addEventListener("click", (event) => {
    event.preventDefault();
    openBoothCard(auraDeskFocus());
  });
  const passChip = el("pfPassChip");
  if (passChip) passChip.addEventListener("click", (event) => {
    event.preventDefault();
    if (nearest) openBoothCard(nearest);
  });
  const tillTickets = el("pfTillTickets");
  const tillTrade = el("pfTillTrade");
  if (tillTickets) tillTickets.addEventListener("click", () => {
    closeStallCard();
    openTill({pin: true});
  });
  if (tillTrade) tillTrade.addEventListener("click", () => {
    const ok = window.PennyFever?.tradePenniesForTicket?.();
    tillMessage = ok ? "One booth ticket from five pennies." : "Need five pennies for a ticket.";
    tillMessageUntil = performance.now() + 4000;
    paintAuraWallet(el("pfStallCard"));
  });
  if (mapOpen) mapOpen.addEventListener("click", () => {
    if (alleyMapOpen) closeAlleyMap();
    else openAlleyMap();
  });
  if (mapClose) mapClose.addEventListener("click", closeAlleyMap);
  if (mapLegend) mapLegend.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-place]");
    if (!button) return;
    event.preventDefault();
    walkToMapPlace(button.dataset.place);
  });
  const worldPin = el("pfAlleyMapYou");
  if (worldPin) worldPin.addEventListener("click", (event) => {
    event.preventDefault();
    walkToMapPlace(worldPin.dataset.place || "aura");
  });
  if (enter) {
    enter.addEventListener("click", (event) => {
      event.preventDefault();
      enterNearest();
    });
  }
  const chat = el("pfWorldChat");
  if (chat) {
    chat.addEventListener("click", (event) => {
      event.preventDefault();
      talkToFocus();
    });
  }
  const stallEnter = el("pfStallCardEnter");
  const stallChat = el("pfStallCardChat");
  const stallBack = el("pfStallCardBack");
  if (stallEnter) stallEnter.addEventListener("click", (event) => {
    event.preventDefault();
    if (nearest?.kind === "stall" || nearest?.kind === "ride") enterStallById(nearest.id);
    else enterNearest();
  });
  if (stallChat) stallChat.addEventListener("click", (event) => {
    event.preventDefault();
    talkToFocus();
  });
  if (stallBack) stallBack.addEventListener("click", (event) => {
    event.preventDefault();
    closeStallCard();
  });
  const views = el("pfStallCardViews");
  if (views) {
    views.addEventListener("click", (event) => {
      const spin = event.target.closest("button[data-spin]");
      if (!spin) return;
      event.preventDefault();
      spinLookCard(Number(spin.dataset.spin));
    });
  }
  const rig = el("pfLookRig");
  if (rig) {
    rig.addEventListener("click", (event) => {
      const orbit = event.target.closest("button[data-orbit]");
      if (orbit) {
        event.preventDefault();
        spinLookCard(Number(orbit.dataset.orbit));
        return;
      }
    });
  }
  bindCardSpin();
  if (pocketScrip) pocketScrip.addEventListener("click", () => {
    window.PennyFeverInventory?.open('ticket-roll');
  });
  if (pocketTicket) pocketTicket.addEventListener("click", () => {
    window.PennyFeverInventory?.open('everyday-penny');
  });
  if (pocketDoll) pocketDoll.addEventListener("click", () => {
    window.PennyFeverDoll?.open();
  });
  if (pocketChat) pocketChat.addEventListener("click", () => {
    chatPinned = !chatPinned;
    pocketChat.classList.toggle("is-active", chatPinned);
    pocketChat.setAttribute("aria-pressed", String(chatPinned));
  });
  if (pocketChest) pocketChest.addEventListener("click", () => {
    window.PennyFeverInventory?.open();
  });
  paintPocketHud();
  window.addEventListener("pennyfever:statechange", paintPocketHud);
  if (failMap) {
    failMap.addEventListener("click", () => { location.hash = "door"; });
  }
  bindJoy();
  bindLook();
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });
}

function onKey(e) {
  if (api.paused || document.querySelector('dialog[open]')) return;
  const k = e.key.toLowerCase();
  if (alleyMapOpen) {
    if (e.key === "Escape" || k === "m") {
      e.preventDefault();
      closeAlleyMap();
    }
    return;
  }
  if (k === "m") {
    e.preventDefault();
    openAlleyMap();
    return;
  }
  keys[k] = true;
  if (k === "e" || k === "enter") {
    if (gatePromptActive || promptTargetSlug || (nearest && nearest.atCounter)) {
      e.preventDefault();
      enterNearest();
    }
  }
  if (k === "q") { e.preventDefault(); spinLookCard(-1); }
  if (k === "t") { e.preventDefault(); spinLookCard(1); }
}

function bindLook() {
  const canvas = el("pfWorld");
  if (!canvas) return;
  const pointers = new Map();
  let lastX = 0;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.target.closest?.(".pf-joy, .pf-look-rig, .pf-stall-card, button, a")) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lookDrag = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size >= 2) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    if (nearest && nearest.atCounter) {
      bindLook.accum = (bindLook.accum || 0) + dx;
      if (Math.abs(bindLook.accum) > 48) {
        spinLookCard(bindLook.accum > 0 ? 1 : -1);
        bindLook.accum = 0;
      }
    } else {
      glanceYaw -= dx * 0.0022;
      if (glanceYaw > 0.28) glanceYaw = 0.28;
      if (glanceYaw < -0.28) glanceYaw = -0.28;
    }
  });
  const end = (e) => {
    pointers.delete(e.pointerId);
    if (!pointers.size) lookDrag = false;
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
}

function bindJoy() {
  const pad = el("pfJoy");
  const knob = el("pfJoyKnob");
  if (!pad || !knob) return;
  const set = (cx, cy, x, y) => {
    const r = pad.clientWidth / 2;
    let dx = x - cx;
    let dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const max = r - 24;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    joy.x = dx / max;
    joy.y = dy / max;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const start = (e) => {
    joy.active = true;
    const r = pad.getBoundingClientRect();
    set(r.left + r.width / 2, r.top + r.height / 2, e.clientX, e.clientY);
    pad.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (!joy.active) return;
    const r = pad.getBoundingClientRect();
    set(r.left + r.width / 2, r.top + r.height / 2, e.clientX, e.clientY);
  };
  const end = () => {
    joy.active = false;
    joy.x = 0;
    joy.y = 0;
    knob.style.transform = "";
  };
  pad.addEventListener("pointerdown", start);
  pad.addEventListener("pointermove", move);
  pad.addEventListener("pointerup", end);
  pad.addEventListener("pointercancel", end);
}

function lookCardKind(best) {
  return best && (best.kind === "stall" || best.kind === "ride" || best.kind === "aura");
}

function lookCardArt(best, view = "front") {
  const root = "assets/restyle/scene-turnarounds-2026-09-09";
  const v = ["front", "left", "back", "right"].includes(view) ? view : "front";
  if (best.kind === "stall") {
    return {
      booth: `${root}/stalls/${best.id}/${v}.webp`,
      vendor: best.hostSlug ? `${root}/vendors/${best.hostSlug}/${v}.webp` : "",
      role: "host",
    };
  }
  if (best.kind === "ride") {
    const host = (best.hostSlug || best.host || "").toLowerCase();
    return {
      booth: `${root}/amusements/${best.id}/${v}.webp`,
      vendor: host ? `${root}/attendants/${host}/${v}.webp` : "",
      role: "attendant",
    };
  }
  return {
    booth: `${root}/aura/ticket-booth/${v}.webp`,
    vendor: `${root}/aura/welcoming/${v}.webp`,
    role: "proprietor",
  };
}

function focusedFigures() {
  const list = [];
  if (!nearest) return list;
  if (nearest.kind === "stall") {
    const s = stalls?.find((st) => st.userData.stall.id === nearest.id);
    if (s) list.push(s);
    const b = barkers?.find((p) => p.userData.stallId === nearest.id);
    if (b) list.push(b);
  } else if (nearest.kind === "ride") {
    (papercutRides?.figures || []).forEach((fig) => {
      if (fig.userData.amusementId === nearest.id) list.push(fig);
    });
  } else if (nearest.kind === "aura") {
    if (aura) list.push(aura);
    const booth = scene?.getObjectByName("Aura ticket booth · papercut");
    if (booth) list.push(booth);
  }
  return list;
}

function pinFocusedView(index) {
  stallCardView = LOOK_VIEWS[index] || "front";
  focusedFigures().forEach((fig) => {
    fig.userData.pinView = index;
    if (fig.userData.papercutStand) fig.userData.papercutStand.userData.pinView = index;
  });
}

function paintLookViewLabel(view) {
  const name = LOOK_VIEWS.includes(view) ? view : "front";
  const card = el("pfStallCardViewLabel");
  if (card) card.textContent = name;
  const rig = el("pfLookRigLabel");
  if (rig) rig.textContent = name;
}

function spinLookCard(dir) {
  const i = (LOOK_VIEWS.indexOf(stallCardView) + dir + 4) % 4;
  pinFocusedView(i);
  paintLookViewLabel(LOOK_VIEWS[i]);
  if (stallCardOpen) applyLookCardView(LOOK_VIEWS[i]);
}

function nudgeLookZoom(dir) {
  return dir;
}

function bindCardSpin() {
  const stage = el("pfStallCard")?.querySelector(".pf-stall-card-art");
  if (!stage) return;
  let drag = null;
  let accum = 0;
  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, dist: 0 };
    accum = 0;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (drag?.id !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
    accum += dx;
    drag.dist += Math.hypot(dx, dy);
    if (Math.abs(accum) > 42) {
      spinLookCard(accum > 0 ? 1 : -1);
      accum = 0;
    }
  });
  const end = (e) => { if (drag?.id === e.pointerId) drag = null; };
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
}

function applyLookCardView(view) {
  if (!nearest || !lookCardKind(nearest)) return;
  stallCardView = view;
  const art = lookCardArt(nearest, view);
  const booth = el("pfStallCardBooth");
  const vendor = el("pfStallCardVendor");
  if (booth) {
    booth.hidden = false;
    booth.src = art.booth;
    booth.onerror = () => { if (view !== "front") applyLookCardView("front"); };
  }
  if (vendor) {
    if (art.vendor) {
      vendor.hidden = false;
      vendor.src = art.vendor;
      vendor.onerror = () => { vendor.hidden = true; };
    } else {
      vendor.removeAttribute("src");
      vendor.hidden = true;
    }
  }
  paintLookViewLabel(view);
  const stage = el("pfStallCard")?.querySelector(".pf-stall-card-art");
  if (stage) stage.classList.toggle("is-rear", view === "back" || view === "right");
}

function auraDeskFocus() {
  return {
    id: "aura",
    kind: "aura",
    name: "Ticket booth",
    host: "Aura",
    hostSlug: "",
    line: "Trade pennies for a ticket here. Square is only for buying packs.",
    x: COUNTER.x,
    z: COUNTER.z,
    stallX: COUNTER.x,
    stallZ: COUNTER.z,
    side: -1,
    dist: 0,
    atCounter: true,
  };
}

function hidePassChip() {
  const chip = el("pfPassChip");
  if (chip) chip.hidden = true;
}

function showPassChip(place) {
  const chip = el("pfPassChip");
  if (!chip || !place) return hidePassChip();
  const host = el("pfPassChipHost");
  const name = el("pfPassChipName");
  if (host) host.textContent = place.host || (place.kind === "aura" ? "Aura" : "");
  if (name) name.textContent = place.name || "";
  chip.hidden = false;
}

function openBoothCard(best) {
  if (!lookCardKind(best)) return;
  stallCardPinned = true;
  focus = best;
  nearest = { ...best, atCounter: true };
  hidePassChip();
  syncStallCard(nearest);
}

function closeStallCard() {
  focusedFigures().forEach((fig) => {
    delete fig.userData.pinView;
    if (fig.userData.papercutStand) delete fig.userData.papercutStand.userData.pinView;
  });
  stallCardOpen = false;
  stallCardPinned = false;
  stallCardId = "";
  lookZoom = 1;
  const card = el("pfStallCard");
  if (card) card.hidden = true;
  const till = el("pfStallCardTill");
  if (till) till.hidden = true;
  const joy = el("pfJoy");
  if (joy) joy.hidden = false;
  if (player && Math.abs(player.position.x) > 0.35) player.position.x *= 0.2;
}

function syncStallCard(best) {
  const card = el("pfStallCard");
  if (!card) return;
  if (!lookCardKind(best)) {
    if (stallCardOpen) closeStallCard();
    return;
  }
  if (stallCardId !== best.kind + ":" + best.id) {
    stallCardId = best.kind + ":" + best.id;
    stallCardView = "front";
    const art = lookCardArt(best, "front");
    const booth = el("pfStallCardBooth");
    const vendor = el("pfStallCardVendor");
    const hostEl = el("pfStallCardHost");
    const nameEl = el("pfStallCardName");
    const lineEl = el("pfStallCardLine");
    const enter = el("pfStallCardEnter");
    const chat = el("pfStallCardChat");
    if (booth) {
      booth.src = art.booth;
      booth.alt = best.name || "";
      booth.onerror = () => { booth.hidden = true; };
      booth.hidden = false;
    }
    if (vendor) {
      if (art.vendor) {
        vendor.hidden = false;
        vendor.src = art.vendor;
        vendor.alt = best.host || "";
        vendor.onerror = () => { vendor.hidden = true; };
      } else {
        vendor.removeAttribute("src");
        vendor.hidden = true;
      }
    }
    if (hostEl) hostEl.textContent = best.host ? `${best.host} · ${art.role}` : "";
    if (nameEl) nameEl.textContent = best.name || "";
    if (lineEl) lineEl.textContent = best.line || "";
    if (enter) {
      if (best.kind === "stall") {
        enter.hidden = false;
        enter.disabled = false;
        enter.textContent = stallEnterLabel(best.id);
      } else if (best.kind === "ride") {
        const open = !!document.getElementById("cabinet-" + playIdFor(best.id));
        enter.hidden = !open;
        enter.disabled = false;
        enter.textContent = open ? stallEnterLabel(playIdFor(best.id)) : "Not open yet";
      } else if (best.kind === "aura") {
        const laps = Number(pfState().alleyLaps) || 0;
        enter.hidden = false;
        enter.textContent = ticketPassed()
          ? "This lap is punched"
          : laps === 0
            ? (hasAdmitTicket() ? "Show ticket" : "Come through")
            : "Pay a penny";
        enter.disabled = !!ticketPassed();
      } else {
        enter.hidden = true;
        enter.disabled = false;
      }
    }
    if (chat) {
      chat.hidden = best.kind === "aura";
      chat.textContent = "Chat";
    }
    const back = el("pfStallCardBack");
    if (back) back.textContent = best.kind === "aura" ? "Enter the sideshow alley" : "Back to the alley";
    const till = el("pfStallCardTill");
    if (till) till.hidden = best.kind !== "aura";
    if (best.kind === "aura") paintAuraWallet(el("pfStallCard"));
    applyLookCardView("front");
  }
  stallCardOpen = true;
  card.hidden = false;
  const joy = el("pfJoy");
  if (joy) joy.hidden = true;
}

function talkToFocus() {
  if (!nearest) return;
  if (nearest.kind === "aura") {
    chatPinned = true;
    const pocketChat = el("pfPocketChat");
    if (pocketChat) {
      pocketChat.classList.add("is-active");
      pocketChat.setAttribute("aria-pressed", "true");
    }
    return;
  }
  if (nearest.kind === "stall" || nearest.kind === "ride") {
    vendorChatUntil = performance.now() + 6400;
    const lineEl = el("pfStallCardLine");
    if (lineEl) lineEl.textContent = nearest.line || "";
  }
}

function enterNearest() {
  if (stallCardOpen && (nearest?.kind === "stall" || nearest?.kind === "ride")) {
    enterStallById(nearest.id);
    return;
  }
  if (handleGatePrompt()) return;
  if (!nearest || !nearest.atCounter) return;
  if (stallCardOpen && nearest.kind === "aura") {
    if (ticketPassed()) return;
    const PF = window.PennyFever;
    const laps = Number(pfState().alleyLaps) || 0;
    const kind = laps === 0 ? "ticket" : "penny";
    if (PF && typeof PF.admitAlleyLap === "function") {
      if (!PF.admitAlleyLap(kind) && kind === "penny") {
        tillMessage = "A penny for the next walk. Cash a booth ticket at Copper Falls for a five-penny stack.";
        tillMessageUntil = performance.now() + 7000;
      }
    }
    stallCardId = "";
    syncStallCard(nearest);
    return;
  }
  if (stallCardOpen && nearest.kind === "ride") {
    enterStallById(nearest.id);
    return;
  }
  if (nearest.kind === "vendor") {
    talkToFocus();
    return;
  }
  if (nearest.kind === "ride" || nearest.kind === "aura" || nearest.kind === "booth") return;
  const slug = promptTargetSlug || nearest.id;
  if (!slug) return;
  const PF = window.PennyFever;
  if (PF && typeof PF.enterTent === "function") PF.enterTent(slug);
  else if (PF && typeof PF.enter === "function") PF.enter(slug);
  else location.hash = "cabinet/" + slug;
}

function buildWorld() {
  const canvas = el("pfWorld");
  const first = laneSize();
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !paperRail && !phoneLane && window.devicePixelRatio < 1.6,
    powerPreference: phoneLane ? "low-power" : "high-performance",
    stencil: false,
  });
  renderer.setPixelRatio(Math.min(phoneLane || paperRail ? 1 : 2, window.devicePixelRatio || 1));
  renderer.setSize(first.w, first.h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = paperRail ? THREE.NoToneMapping : THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = paperRail ? 1 : 2.05;
  renderer.setClearColor(0x070b16, 1);

  const lots = midwayLots(STALLS.map((s) => s.id));
  hallLen = STALL_Z0 + lots.length * STALL_STEP + 8;
  // Dome must enclose the last stall — radius 90 cut the aisle after Catoptromancy.
  const skyR = Math.max(180, hallLen + 48);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b1018, 0.026);
  camera = new THREE.PerspectiveCamera(phoneLane ? 68 : 58, first.w / first.h, 0.45, skyR + 80);
  clock = new THREE.Clock();

  scene.add(new THREE.AmbientLight(0x4a382c, 0.95));
  scene.add(new THREE.HemisphereLight(0x8aa4cc, 0x2a1810, 0.9));
  const moon = new THREE.DirectionalLight(0xc0d4ff, 0.55);
  moon.position.set(-8, 14, -18);
  scene.add(moon);
  const pierFill = new THREE.DirectionalLight(0xffc090, 0.85);
  pierFill.position.set(0, 8, -28);
  pierFill.target.position.set(0, 1, -6);
  scene.add(pierFill);
  scene.add(pierFill.target);

  scene.add(makeSky(skyR));
  makePier(scene);
  if (paperRail) makePaperEntrance(scene);
  else makePalace(scene);
  makeHall(scene, hallLen);

  stalls = [];
  solids = [];
  STALLS.forEach((spec, i) => {
    const lotI = lots.findIndex((l) => l.kind === "stall" && l.id === spec.id);
    const side = lotI >= 0 ? lots[lotI].side : (i % 2 === 0 ? -1 : 1);
    const x = side * STALL_X;
    const z = STALL_Z0 + (lotI >= 0 ? lotI : i) * STALL_STEP;
    const yaw = Math.atan2(-x, -FACE_PULL);
    const s = makeStall(spec, x, z, yaw);
    s.userData.side = side;
    s.userData.doorX = x + Math.sin(yaw) * s.userData.faceOff;
    s.userData.doorZ = z + Math.cos(yaw) * s.userData.faceOff;
    scene.add(s);
    stalls.push(s);
    solids.push({ x, z, r: paperRail ? Math.min(0.7, s.userData.hitR) : s.userData.hitR });
  });

  const curtain = meshBox(makeMat(VELVET), 7.6, 3.8, 0.2, 0, 1.9, hallLen + 0.8);
  scene.add(curtain);
  const endSign = makeSign("ROUND AGAIN", 0x8a2030);
  endSign.position.set(0, 3.4, hallLen + 0.6);
  scene.add(endSign);

  if (!paperRail) {
    const booth = new THREE.Group();
    booth.position.set(2.15, 0, 3.1);
    booth.add(meshBox(makeMat(WOOD), 1.2, 1.1, 0.8, 0, 0.55, 0));
    booth.add(makeSign("AURA’S TILL", GOLD));
    booth.children[1].position.set(0, 1.35, 0.2);
    const poster = new THREE.Mesh(geoBox, new THREE.MeshBasicMaterial({ map: artMap("assets/prepared/welcome-proprietor.webp") }));
    poster.scale.set(0.55, 0.72, 0.03);
    poster.position.set(-0.35, 0.85, 0.42);
    booth.add(poster);
    scene.add(booth);
    solids.push({ x: 2.15, z: 3.1, r: 0.85 });
  }

  player = makePerson({ kind: "guest", cloth: 0xb08a78, scale: 1.05 });
  player.position.set(paperRail ? -0.6 : 0, 0, paperRail ? -18.2 : -16.2);
  scene.add(player);
  camera.position.set(paperRail ? -.12 : 0, paperRail ? 2.0 : 2.45, paperRail ? -21.6 : -22.2);
  camera.lookAt(0, paperRail ? 1.05 : 1.2, paperRail ? -14.6 : -16.2);

  aura = makePerson({ kind: "aura", cloth: DRESS, scale: 1.08, chibi: true });
  dressAura(aura);
  aura.position.set(AURA_DOOR.x, 0, AURA_DOOR.z);
  scene.add(aura);

  barkers = [];
  stalls.forEach((s) => {
    const spec = s.userData.stall;
    const b = makePerson({ cloth: spec.accent, scale: 0.95 });
    dressBarker(b, spec.accent);
    const side = s.userData.side;
    if (paperRail) {
      // Out on the boards like Aura, not tucked into the wall bay.
      b.position.set(side * 1.68, 0, s.position.z - 0.85);
      b.rotation.y = Math.PI;
    } else {
      b.position.set(s.userData.doorX + side * 0.1, 0, s.userData.doorZ);
    }
    b.userData.stallId = spec.id;
    b.userData.vendorHost = spec.hostSlug || "";
    b.userData.crewName = spec.host || spec.name;
    scene.add(b);
    barkers.push(b);
  });

  guests = [];
  const wanderN = paperRail ? 5 : 4;
  const wanderSpan = Math.max(28, hallLen - 22);
  for (let i = 0; i < wanderN; i += 1) {
    const g = makePerson({
      cloth: [0x4a3040, 0x2a3a48, 0x4a3a28, 0x3a2840, 0x3a2848][i % 5],
      scale: 0.9 + Math.random() * 0.12,
    });
    g.userData.patrol = {
      dir: i % 2 === 0 ? 1 : -1,
      speed: paperRail ? 3.2 + (i % 3) * 0.5 : 0.7 + Math.random() * 0.5,
    };
    g.position.set(i % 2 ? 0.42 : -0.42, 0, 12 + (i + 0.3) * (wanderSpan / wanderN));
    scene.add(g);
    guests.push(g);
  }

  fireflies = makeFireflies();
  scene.add(fireflies);
  looseCoins = makeLooseCoins();
  scene.add(looseCoins);
  lamps = [];
  scene.traverse((o) => {
    if (o.isPointLight && o.userData.flicker) lamps.push(o);
  });

  if (paperRail) {
    makeVisibleTicketBooth(scene);
    solids.push({ x: COUNTER.x, z: COUNTER.z - 0.42, r: 0.72 });
    installIndividualVendors(stalls, scene);
    vendorCutouts = installVendorCutouts(barkers);
    stallCutouts = installStallCutouts(stalls);
    papercutRides = installPapercutRides(scene, STALL_Z0, STALL_STEP, lots);
    extendPaperAlley(scene, hallLen);
    wallBackdrops = installWallBackdrops(scene, hallLen, {stallStart: STALL_Z0, stallStep: STALL_STEP, lots});
    installTicketService(player, aura, window.PennyFever);
    curtain.visible = false;
    endSign.visible = false;
  }
  mountRestyle(scene, [player, aura, ...barkers, ...guests]);
  installPaperProprietor(aura);
  installCrewGuest(player);
  installPaperCrew(paperRail ? guests : [...barkers, ...guests]);
  window.addEventListener("resize", onResize);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", onResize);
  const stage = el("pfWorldStage");
  if (stage && typeof ResizeObserver === "function" && !stage._pfLaneRO) {
    stage._pfLaneRO = new ResizeObserver(onResize);
    stage._pfLaneRO.observe(stage);
  }
}

function laneSize() {
  const stage = el("pfWorldStage");
  if (stage) {
    const w = Math.round(stage.clientWidth);
    const h = Math.round(stage.clientHeight);
    if (w > 8 && h > 8) return { w, h };
  }
  return { w: window.innerWidth, h: Math.max(1, window.innerHeight) };
}

function onResize() {
  if (!renderer || !camera) return;
  const { w, h } = laneSize();
  camera.aspect = w / h;
  camera.fov = phoneLane ? 68 : 58;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function pose() {
  if (!player) return null;
  const x = player.position.x;
  const z = player.position.z;
  return {
    x, z,
    yaw: camYaw,
    nearest: nearest && nearest.id,
    nearestDist: nearest && nearest.dist,
    zone: z < FOYER_OUT ? "pier" : "alley",
  };
}

function warp(x, z, yaw) {
  if (!player) return pose();
  player.position.set(x, 0, z);
  if (typeof yaw === "number") camYaw = yaw;
  findNearest();
  return pose();
}

function step(dt, input) {
  if (input) {
    keys.w = !!input.w;
    keys.s = !!input.s;
    keys.a = !!input.a;
    keys.d = !!input.d;
    keys.arrowup = false;
    keys.arrowdown = false;
    keys.arrowleft = false;
    keys.arrowright = false;
  }
  updatePlayer(typeof dt === "number" ? dt : 1 / 60);
  findNearest();
  updateCamera(typeof dt === "number" ? dt : 1 / 60);
  return pose();
}

function hitsSolid(nx, nz) {
  const pad = 0.28;
  for (let i = 0; i < solids.length; i += 1) {
    const s = solids[i];
    const hit = s.r + pad;
    const dx = nx - s.x;
    const dz = nz - s.z;
    if (dx * dx + dz * dz < hit * hit) return true;
  }
  return false;
}

function towardHome(fromX, toX) {
  return Math.abs(toX) < Math.abs(fromX) - 0.001;
}

function unstickPlayer() {
  if (!player) return;
  const x = player.position.x;
  const z = player.position.z;
  if (!hitsSolid(x, z) && Math.abs(x) <= walkLimit(z) + 0.02) return;
  player.position.x = x * 0.72;
  if (Math.abs(player.position.x) < 0.12) player.position.x = 0;
  if (hitsSolid(player.position.x, z) || Math.abs(player.position.x) > walkLimit(z)) player.position.x = 0;
}

function walkLimit(nz) {
  if (paperRail && nz >= FOYER_IN - .4 && nz <= FOYER_OUT + .4) return 0.95;
  if (nz < -8.4) return 4.8;
  if (paperRail && nz > FOYER_OUT + .5) return WALK_X;
  return AISLE;
}



function blocked(nx, nz, home = false) {
  if (!ticketPassed() && nz > GATE_Z) return true;
  if (nz < -34) return true;
  if (!home && hitsSolid(nx, nz)) return true;
  if (nz < 1.2 && Math.abs(nx) < 1.25) return false;
  if (nz > hallLen + 1.2) return true;
  return Math.abs(nx) > walkLimit(nz);
}

function tryMove(dx, dz) {
  const x = player.position.x;
  const z = player.position.z;
  const home = towardHome(x, x + dx);
  if (!blocked(x + dx, z + dz, home)) {
    player.position.x += dx;
    player.position.z += dz;
    return;
  }
  if (!blocked(x, z + dz, home)) {
    player.position.z += dz;
    return;
  }
  if (!ticketPassed() && z + dz > GATE_Z) api.gateBump = true;
  if (!blocked(x + dx, z, home)) player.position.x += dx;
}

function updatePlayer(dt) {
  if (alleyMapOpen || stallCardOpen) return false;
  let ix = joy.x;
  let iy = -joy.y;
  if (keys.w || keys.arrowup) iy += 1;
  if (keys.s || keys.arrowdown) iy -= 1;
  if (keys.a || keys.arrowleft) ix -= 1;
  if (keys.d || keys.arrowright) ix += 1;
  if (Math.abs(iy) > 0.22 && Math.abs(iy) >= Math.abs(ix) * 0.72) ix = 0;
  const strafing = Math.abs(ix) > 0.38;
  moveIntent.ix = ix;
  moveIntent.iy = iy;
  const mag = Math.hypot(ix, iy);
  let moving = false;
  if (mag > 0.08) {
    if (mag > 1) {
      ix /= mag;
      iy /= mag;
    }
    const speed = (paperRail ? (keys.shift ? 11 : 7.4) : (keys.shift ? 6.2 : 3.6)) * dt;
    /* Looking +Z, world +X is screen-left — flip so arrows match the aisle. */
    tryMove(-ix * speed, iy * speed);
    moving = Math.abs(iy) > 0.08 || strafing;
  }
  if (player.position.z > -8) {
    api.facedAlley = true;
    if (!strafing) {
      const pull = (0 - player.position.x) * Math.min(1, 10 * dt);
      if (!blocked(player.position.x + pull, player.position.z, true)) player.position.x += pull;
    }
  }
  unstickPlayer();
  let face = iy < -0.22 ? Math.PI : 0;
  if (nearest && nearest.atCounter && Math.abs(iy) < 0.22) {
    face = Math.atan2(nearest.stallX - player.position.x, nearest.stallZ - player.position.z);
  }
  player.userData.heading = face;
  const spin = face - player.rotation.y;
  const wrap = ((spin + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  player.rotation.y += wrap * Math.min(1, 10 * dt);
  if (!loopingAlley && ticketPassed() && player.position.z > hallLen - 0.15) {
    loopingAlley = true;
    const veil = el("pfWorldLoopVeil");
    if (veil) veil.classList.add("is-closing");
    loopTimer = window.setTimeout(() => {
      const PF = window.PennyFever;
      if (PF && typeof PF.endAlleyLap === "function") PF.endAlleyLap();
      const fromZ = player.position.z;
      const nextZ = paperRail ? LOOP_START.z : 1.55;
      player.position.x = paperRail ? LOOP_START.x : Math.max(-0.8, Math.min(0.8, player.position.x));
      player.position.z = nextZ;
      if (camera) camera.position.z += nextZ - fromZ;
      nearest = null;
      promptTargetSlug = "";
      pendingTillCashIn = true;
      if (paperRail) { tillMessage = "A penny for the next walk, darling."; tillMessageUntil = performance.now() + 7000; }
      if (veil) {
        veil.classList.remove("is-closing");
        veil.classList.add("is-opening");
      }
      loopOpenTimer = window.setTimeout(() => {
        if (veil) veil.classList.remove("is-opening");
        loopingAlley = false;
      }, 520);
    }, 260);
    moving = false;
  }
  animatePerson(player, dt, moving, false);
  return moving;
}

function atAuraGate() {
  return !!(player && aura && player.position.distanceTo(aura.position) < 2.55 && !ticketPassed());
}

function handleGatePrompt() {
  if (ticketPassed()) return false;
  if (!gatePromptActive && !atAuraGate() && !api.gateBump) return false;
  const PF = window.PennyFever;
  const laps = Number(pfState().alleyLaps) || 0;
  const kind = laps === 0 ? "ticket" : "penny";
  if (!PF || typeof PF.admitAlleyLap !== "function" || !PF.admitAlleyLap(kind)) {
    if (kind === "penny") {
      tillMessage = "A penny for the next walk. Cash a booth ticket at Copper Falls for a five-penny stack.";
      tillMessageUntil = performance.now() + 7000;
    }
    return true;
  }
  const prompt = el("pfWorldPrompt");
  if (prompt) prompt.classList.add("is-ticket-given");
  if (navigator.vibrate) navigator.vibrate([35, 45, 70]);
  api.gateBump = false;
  gatePromptActive = false;
  window.setTimeout(() => {
    if (prompt) prompt.classList.remove("is-ticket-given");
  }, 620);
  return true;
}

function updateAura(dt) {
  const pz = player.position.z;
  const target = new THREE.Vector3();
  if (!ticketPassed()) target.set(AURA_DOOR.x, 0, AURA_DOOR.z);
  else target.set(AURA_TILL.x, 0, AURA_TILL.z);
  const dx = target.x - aura.position.x;
  const dz = target.z - aura.position.z;
  const dist = Math.hypot(dx, dz);
  let moving = false;
  if (dist > 0.35) {
    const sp = Math.min(2.8 * dt, dist);
    aura.position.x += (dx / dist) * sp;
    aura.position.z += (dz / dist) * sp;
    moving = true;
  }
  if (paperRail && aura.userData.papercutStand) aura.rotation.y = Math.PI;
  else if (moving) aura.rotation.y = Math.atan2(dx, dz);
  else {
    const lx = player.position.x - aura.position.x;
    const lz = player.position.z - aura.position.z;
    aura.rotation.y = Math.atan2(lx, lz);
  }
  const nearPlayer = player.position.distanceTo(aura.position) < 2.4;
  if (pendingTillCashIn && player.position.distanceTo(aura.position) < 2.85) {
    pendingTillCashIn = false;
    if (!paperRail) {
      const PF = window.PennyFever;
      const paid = PF && typeof PF.cashInCompletedPlays === "function" ? PF.cashInCompletedPlays() : 0;
      tillMessage = paid
        ? `You brought me a proper night. ${paid} fresh ${paid === 1 ? "penny" : "pennies"} for another round.`
        : "Nothing to cash yet, darling. Play a stall, then bring the night back around.";
      tillMessageUntil = performance.now() + 5200;
      if (paid && navigator.vibrate) navigator.vibrate([28, 35, 28, 35, 60]);
    }
  }
  animatePerson(aura, dt, moving, nearPlayer && !moving);
}

function updateCrowd(dt) {
  barkers.forEach((b) => {
    const lx = player.position.x - b.position.x;
    const lz = player.position.z - b.position.z;
    if (paperRail) b.rotation.y = Math.PI;
    else b.rotation.y = Math.atan2(lx, lz);
    const pitching = !!(nearest && nearest.atCounter && nearest.id === b.userData.stallId);
    animatePerson(b, dt, false, pitching || Math.hypot(lx, lz) < 1.6);
  });
  guests.forEach((g) => {
    const p = g.userData.patrol;
    g.position.z += p.dir * p.speed * dt;
    if (g.position.z > hallLen - 5 || g.position.z < FOYER_OUT + 4) p.dir *= -1;
    g.rotation.y = p.dir > 0 ? 0 : Math.PI;
    animatePerson(g, dt, true, false);
  });
}

function inFrontOf(px, pz, x, z, side, reach = 4.4, band = 2.05) {
  const dz = Math.abs(pz - z);
  const d = Math.hypot(px - x, pz - z);
  const onSide = Math.sign(px || side) === side;
  return onSide && Math.abs(px) >= 0.48 && dz < band && d < reach;
}

function pickFocus(px, pz) {
  let passing = null;
  let passingZ = 99;
  function consider(place, dz) {
    if (dz > 2.8) return;
    const onThisSide = Math.sign(px || place.side) === place.side;
    if (passing && Math.abs(dz - passingZ) < 0.7) {
      const passSide = Math.sign(px || passing.side) === passing.side;
      if (onThisSide && !passSide) {
        passing = place;
        passingZ = dz;
      }
      return;
    }
    if (dz >= passingZ) return;
    passingZ = dz;
    passing = place;
  }
  stalls.forEach((s) => {
    const spec = s.userData.stall;
    const host = barkers?.find((b) => b.userData.stallId === spec.id);
    consider({
      id: spec.id,
      kind: "stall",
      name: spec.name,
      host: spec.host || host?.userData.crewName || spec.name,
      hostSlug: spec.hostSlug || host?.userData.vendorHost || "",
      line: spec.line,
      x: s.position.x,
      z: s.position.z,
      stallX: s.position.x,
      stallZ: s.position.z,
      side: s.userData.side,
      dist: Math.hypot(px - s.position.x, pz - s.position.z),
      dz: Math.abs(pz - s.position.z),
    }, Math.abs(pz - s.position.z));
  });
  (papercutRides?.figures || []).forEach((fig) => {
    if (fig.userData.kind !== "ride") return;
    const id = fig.userData.amusementId;
    const art = AMUSEMENT_ART[id];
    const g = paperById[playIdFor(id)];
    consider({
      id,
      kind: "ride",
      name: g?.title || art?.name || (fig.name || id).replace(" · papercut", ""),
      host: g?.host || art?.host || "",
      hostSlug: String(g?.host || art?.host || "").toLowerCase().replace(/[^a-z]+/g, ""),
      line: g?.blurb || "The ride faces the aisle.",
      x: fig.position.x,
      z: fig.position.z,
      stallX: fig.position.x,
      stallZ: fig.position.z,
      side: Math.sign(fig.position.x) || 1,
      dist: Math.hypot(px - fig.position.x, pz - fig.position.z),
      dz: Math.abs(pz - fig.position.z),
    }, Math.abs(pz - fig.position.z));
  });
  if (paperRail) {
    consider({
      id: "aura",
      kind: "aura",
      name: "Ticket booth",
      host: "Aura",
      hostSlug: "",
      line: "Trade pennies for a ticket here. Square is only for buying packs.",
      x: COUNTER.x,
      z: COUNTER.z,
      stallX: COUNTER.x,
      stallZ: COUNTER.z,
      side: -1,
      dist: Math.hypot(px - COUNTER.x, pz - COUNTER.z),
      dz: Math.abs(pz - COUNTER.z),
    }, Math.abs(pz - COUNTER.z));
  }
  if (stallCardOpen && focus) return { passing, passingZ };
  const walkingStraight = Math.abs(moveIntent.iy) > 0.2 && Math.abs(moveIntent.ix) < 0.38;
  const atTill = paperRail && aura && Math.hypot(px - COUNTER.x, pz - COUNTER.z) < 2.7 && px < -0.28;
  if (walkingStraight && !atTill) {
    focus = null;
    return { passing, passingZ };
  }
  if (atTill) {
    focus = {
      id: "aura",
      kind: "aura",
      name: "Ticket booth",
      line: "Trade pennies for a ticket here. Square is only for buying packs.",
      x: aura.position.x,
      z: aura.position.z,
      stallX: COUNTER.x,
      stallZ: COUNTER.z,
      side: -1,
      dist: Math.hypot(px - aura.position.x, pz - aura.position.z),
      host: "Aura",
    };
    return { passing, passingZ };
  }
  let best = null;
  let bestD = 99;
  stalls.forEach((s) => {
    const spec = s.userData.stall;
    if (!inFrontOf(px, pz, s.position.x, s.position.z, s.userData.side)) return;
    const d = Math.hypot(px - s.position.x, pz - s.position.z);
    if (d >= bestD) return;
    const host = barkers?.find((b) => b.userData.stallId === spec.id);
    bestD = d;
    best = {
      id: spec.id,
      kind: "stall",
      name: spec.name,
      line: spec.line,
      host: spec.host || host?.userData.crewName || spec.name,
      hostSlug: spec.hostSlug || host?.userData.vendorHost || "",
      x: s.position.x,
      z: s.position.z,
      stallX: s.position.x,
      stallZ: s.position.z,
      side: s.userData.side,
      dist: d,
    };
  });
  (papercutRides?.figures || []).forEach((fig) => {
    if (fig.userData.kind !== "ride") return;
    const side = Math.sign(fig.position.x) || 1;
    if (!inFrontOf(px, pz, fig.position.x, fig.position.z, side, 6.4, 2.7)) return;
    const d = Math.hypot(px - fig.position.x, pz - fig.position.z);
    if (d >= bestD) return;
    const id = fig.userData.amusementId;
    const art = AMUSEMENT_ART[id];
    const g = paperById[playIdFor(id)];
    bestD = d;
    best = {
      id,
      kind: "ride",
      name: g?.title || art?.name || (fig.name || id).replace(" · papercut", ""),
      host: g?.host || art?.host || "",
      hostSlug: String(g?.host || art?.host || "").toLowerCase().replace(/[^a-z]+/g, ""),
      line: g?.blurb || "The ride faces the aisle.",
      x: fig.position.x,
      z: fig.position.z,
      stallX: fig.position.x,
      stallZ: fig.position.z,
      side,
      dist: d,
    };
  });
  focus = best;
  return { passing, passingZ };
}

function findNearest() {
  const px = player.position.x;
  const pz = player.position.z;
  const picked = paperRail ? pickFocus(px, pz) : { passing: null };
  const passing = picked.passing;
  const passingZ = passing?.dz ?? 99;
  const best = focus;
  if (stallCardPinned && lookCardKind(nearest)) {
    hidePassChip();
  } else if (lookCardKind(best)) {
    nearest = { ...best, atCounter: true };
    hidePassChip();
    syncStallCard(nearest);
  } else {
    nearest = passing && passingZ < 2.2 ? passing : null;
    if (stallCardOpen) closeStallCard();
    if (lookCardKind(nearest)) showPassChip(nearest);
    else hidePassChip();
  }
  const rig = el("pfLookRig");
  if (rig) rig.hidden = true;
  const prompt = el("pfWorldPrompt");
  const enter = el("pfWorldEnter");
  const line = el("pfWorldPromptLine");
  const zone = el("pfWorldZone");
  const nearEl = el("pfWorldNearest");
  const speech = el("pfWorldSpeech");
  const speechName = el("pfWorldSpeechName");
  const speechText = el("pfWorldSpeechText");
  const z = pz;
  if (z < GATE_Z - 1.8) api.gateBump = false;
  if (zone) {
    zone.textContent = z < FOYER_OUT ? "Pier" : `Hall · ${Math.max(0, Math.round(z))}`;
  }
  if (nearEl) {
    if (!ticketPassed() && z < GATE_Z) nearEl.textContent = "Aura holds the door";
    else if (z > hallLen - 6) nearEl.textContent = "End of the walk · a penny to go again";
    else if (best) nearEl.textContent = best.name;
    else if (passing && passingZ < 1.45) {
      nearEl.textContent = passing.name + (passing.side < 0 ? " · left" : " · right");
    } else nearEl.textContent = z < FOYER_OUT ? "Walk through the doorway" : "Walk the boards";
  }
  const nameEl = el("pfWorldPromptName");
  const chatBtn = el("pfWorldChat");
  if (prompt && enter && line) {
    if (!ticketPassed() && (atAuraGate() || api.gateBump)) {
      gatePromptActive = true;
      promptTargetSlug = "";
      prompt.hidden = true;
      if (chatBtn) chatBtn.hidden = true;
      prompt.classList.add("is-ticket-handoff");
    } else if (lookCardKind(best) || lookCardKind(nearest)) {
      gatePromptActive = false;
      promptTargetSlug = (best || nearest).id;
      prompt.hidden = true;
      if (chatBtn) chatBtn.hidden = true;
      prompt.classList.remove("is-ticket-handoff");
    } else if (best) {
      gatePromptActive = false;
      promptTargetSlug = best.kind === "stall" ? best.id : "";
      prompt.hidden = false;
      prompt.classList.remove("is-ticket-handoff");
      if (nameEl) nameEl.textContent = best.kind === "stall" && best.host ? best.name : best.name;
      const playable = best.kind === "stall";
      const chatable = best.kind === "stall" || best.kind === "aura";
      enter.hidden = !playable;
      enter.textContent = stallEnterLabel(best.id);
      if (chatBtn) {
        chatBtn.hidden = !chatable;
        chatBtn.textContent = "Chat";
      }
      line.textContent = best.line || "";
    } else {
      gatePromptActive = false;
      promptTargetSlug = "";
      prompt.hidden = true;
      enter.hidden = false;
      if (chatBtn) chatBtn.hidden = true;
      if (nameEl) nameEl.textContent = "";
      prompt.classList.remove("is-ticket-handoff");
    }
  }
  if (speech && speechText) {
    const dAura = player.position.distanceTo(aura.position);
    speech.classList.remove("is-left", "is-right");
    if (tillMessage && performance.now() < tillMessageUntil) {
      speech.hidden = false;
      if (speechName) speechName.textContent = "Aura";
      speechText.textContent = tillMessage;
    } else if (el("pfPassChip") && !el("pfPassChip").hidden) {
      speech.hidden = true;
    } else if (!ticketPassed() && (dAura < 2.6 || api.gateBump)) {
      speech.hidden = true;
    } else if (best && best.kind === "stall" && performance.now() < vendorChatUntil) {
      speech.hidden = false;
      if (speechName) speechName.textContent = best.host || best.name;
      speech.classList.add(best.side < 0 ? "is-left" : "is-right");
      speechText.textContent = best.line;
    } else if (best && best.kind === "stall") {
      speech.hidden = true;
    } else if (z > hallLen - 6) {
      speech.hidden = false;
      if (speechName) speechName.textContent = "Aura";
      speechText.textContent = "The walk is done. A penny to come round again.";
    } else if (ticketPassed() && dAura < 2.4) {
      speech.hidden = false;
      if (speechName) speechName.textContent = "Aura";
      speechText.textContent = "First fortune is free. Everything else is a pretend penny. Follow the lights.";
    } else if (chatPinned) {
      speech.hidden = false;
      if (speechName) speechName.textContent = "Aura";
      speechText.textContent = "Ask me at any tent. I know which machines lie and which merely cheat.";
    } else {
      speech.hidden = true;
    }
  }
}

function projectWorld(x, y, z) {
  hudAnchor.set(x, y, z);
  hudAnchor.project(camera);
  const canvas = renderer.domElement;
  return {
    x: (hudAnchor.x * 0.5 + 0.5) * canvas.clientWidth,
    y: (-hudAnchor.y * 0.5 + 0.5) * canvas.clientHeight,
  };
}

function updateHudAnchor() {
  if (!player || !camera || !renderer) return;
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const px = player.position.x;
  const pz = player.position.z;
  const head = projectWorld(px, 2.08, pz);
  const feet = projectWorld(px, 0.06, pz);

  const joy = el("pfJoy");
  if (joy) {
    joy.classList.remove("is-anchored");
    joy.style.left = "";
    joy.style.top = "";
    joy.style.bottom = "";
    joy.style.transform = "";
  }

  const speech = el("pfWorldSpeech");
  if (speech && !speech.hidden) {
    speech.classList.add("is-anchored");
    speech.style.left = `${clamp(head.x, 170, w - 170)}px`;
    speech.style.top = `${clamp(head.y - 10, 64, h - 240)}px`;
  }

  const chip = el("pfPassChip");
  if (chip && !chip.hidden) {
    chip.style.left = `${clamp(head.x, 72, w - 72)}px`;
    chip.style.top = `${clamp(head.y - 28, 88, h - 220)}px`;
  }

  const prompt = el("pfWorldPrompt");
  if (!prompt || prompt.hidden) return;
  prompt.classList.add("is-anchored");
  if (phoneLane) {
    prompt.style.left = "50%";
    prompt.style.top = "auto";
    prompt.style.bottom = "10.5rem";
    prompt.style.transform = "translate(-50%, 0)";
    return;
  }
  const atStall = nearest && nearest.atCounter && !prompt.classList.contains("is-ticket-handoff");
  const speechUp = speech && !speech.hidden;
  const p = atStall
    ? projectWorld(nearest.stallX, 1.72, nearest.stallZ)
    : { x: head.x, y: head.y - (speechUp ? 88 : 8) };
  prompt.style.left = `${clamp(p.x, 48, w - 48)}px`;
  prompt.style.top = `${clamp(p.y, 140, h - 200)}px`;
  prompt.style.bottom = "auto";
  prompt.style.transform = "translate(-50%, -100%)";
}

function followPose() {
  const walkingAlley = Math.abs(moveIntent.iy) > 0.2;
  const viewing = !!(nearest && nearest.atCounter && !walkingAlley && nearest.kind !== "stall");
  viewBlend += ((viewing ? 1 : 0) - viewBlend) * (viewing ? 0.16 : 0.28);
  camYaw += ((viewing ? 0 : glanceYaw) - camYaw) * 0.22;
  const onHall = player.position.z > -1;
  const openAlley = Math.max(0, Math.min(1, (player.position.z - FOYER_OUT - 4) / 6));
  const onPier = paperRail && player.position.z < FOYER_IN - 0.8;
  const dist = paperRail ? (onPier ? 4.6 : (phoneLane ? 4.2 : 3.4)) + openAlley * 2.4 : (onHall ? 4.9 : 5.6);
  const height = paperRail ? (onPier ? 2.15 : (phoneLane ? 2.1 : 2.0)) + openAlley * .3 : (onHall ? 2.18 : 2.05);
  const lookY = paperRail ? (onPier ? 1.12 : 1.05) + openAlley * .25 : .95;
  const lookAhead = paperRail ? (onPier ? 4.8 : (phoneLane ? 4.4 : 3.6)) + openAlley * 2.2 : (onHall ? 6.4 : 3.6);
  const followX = 0.2;
  const railX = player.position.x * followX;
  const rawAlleyX = railX - Math.sin(camYaw) * dist;
  const alleyTx = paperRail ? Math.max(-.32, Math.min(.32, rawAlleyX)) : rawAlleyX;
  const alleyTy = player.position.y + height;
  const alleyTz = player.position.z - Math.cos(camYaw) * dist;
  const alleyLx = railX * 0.35;
  const alleyLy = player.position.y + lookY;
  const alleyLz = player.position.z + lookAhead;
  let tx = alleyTx;
  let ty = alleyTy;
  let tz = alleyTz;
  let lx = alleyLx;
  let ly = alleyLy;
  let lz = alleyLz;
  if (viewBlend > 0.01 && nearest) {
    const lookX = nearest.kind === "aura" ? nearest.x : (nearest.stallX || nearest.x) * 0.72;
    const lookZ = nearest.kind === "aura" ? nearest.z : (nearest.stallZ || nearest.z);
    const side = nearest.side || Math.sign(lookX || 1);
    const base = nearest.kind === "ride" ? 7.2 : nearest.kind === "aura" ? 3.8 : 4.3;
    const lookBack = base;
    const stallTx = Math.max(-0.85, Math.min(0.85, side * 0.22));
    const stallTy = nearest.kind === "ride" ? 2.7 : 1.62;
    const stallTz = lookZ - lookBack;
    const stallLx = lookX;
    const stallLy = nearest.kind === "ride" ? 2.9 : 1.45;
    const stallLz = lookZ;
    tx = alleyTx + (stallTx - alleyTx) * viewBlend;
    ty = alleyTy + (stallTy - alleyTy) * viewBlend;
    tz = alleyTz + (stallTz - alleyTz) * viewBlend;
    lx = alleyLx + (stallLx - alleyLx) * viewBlend;
    ly = alleyLy + (stallLy - alleyLy) * viewBlend;
    lz = alleyLz + (stallLz - alleyLz) * viewBlend;
  }
  return { tx, ty, tz, lx, ly, lz };
}

function updateCamera(dt) {
  if (!lookDrag) glanceYaw += (0 - glanceYaw) * 0.14;
  const pose = followPose();
  camera.position.x += (pose.tx - camera.position.x) * 0.16;
  camera.position.y += (pose.ty - camera.position.y) * 0.16;
  camera.position.z += (pose.tz - camera.position.z) * 0.16;
  if (paperRail) {
    camera.position.x = Math.max(-1.02, Math.min(1.02, camera.position.x));
    camera.position.y = Math.max(1.48, camera.position.y);
  }
  camera.lookAt(pose.lx, pose.ly, pose.lz);
}

function updateFx(t) {
  paintPocketHud();
  lamps.forEach((l) => {
    l.intensity = 1.05 + Math.sin(t * 3.1 * l.userData.flicker) * 0.18;
  });
  if (fireflies) {
    const pos = fireflies.geometry.attributes.position;
    const phase = fireflies.userData.phase;
    for (let i = 0; i < phase.length; i += 1) {
      pos.array[i * 3 + 1] += Math.sin(t * 1.4 + phase[i]) * 0.003;
    }
    pos.needsUpdate = true;
    fireflies.material.opacity = 0.55 + Math.sin(t * 2.2) * 0.25;
  }
  if (looseCoins && player) {
    looseCoins.children.forEach((coin) => {
      if (coin.userData.collected) return;
      coin.rotation.y += 0.035;
      coin.position.y = coin.userData.baseY + Math.sin(t * 2.5 + coin.userData.phase) * 0.12;
      const dx = player.position.x - coin.position.x;
      const dz = player.position.z - coin.position.z;
      if (dx * dx + dz * dz < 0.58) {
        coin.userData.collected = true;
        coin.visible = false;
        const PF = window.PennyFever;
        if (PF && typeof PF.addDemoCoins === "function") PF.addDemoCoins(1);
        if (navigator.vibrate) navigator.vibrate(24);
      }
    });
  }
  const warm = player.position.z > 0;
  scene.fog.color.set(warm ? 0x140c0c : 0x0b1018);
  scene.fog.density = warm ? 0.034 : 0.026;
}

function loop() {
  if (!api.started || api.paused) return;
  raf = requestAnimationFrame(loop);
  const dt = Math.min(0.1, clock.getDelta());
  const t = clock.elapsedTime;
  updatePlayer(dt);
  updateAura(dt);
  updateCrowd(dt);
  findNearest();
  if (alleyMapOpen) syncAlleyMapYou();
  updateCamera(dt);
  updatePaperProprietor(aura, player);
  updateCrewGuest(player, camera, dt);
  updatePaperCrew(guests, camera);
  const eye = player;
  if (paperRail) updateTicketBooth(eye);
  if (paperRail && vendorCutouts) vendorCutouts.update(camera, player.position.z, eye);
  if (paperRail && stallCutouts) stallCutouts.update(camera, player.position.z, eye);
  if (paperRail && papercutRides) papercutRides.update(camera, player.position.z, eye);
  if (paperRail && wallBackdrops) wallBackdrops.update(player.position.z, dt);
  updateTicketService();
  if (stallCardOpen) {
    const counter = document.querySelector(".aura-counter-service");
    if (counter) counter.hidden = true;
  }
  updateHudAnchor();
  updateFx(t);
  hintTimer += dt;
  if (hintTimer > 8) {
    const hint = el("pfWorldHint");
    if (hint) hint.dataset.gone = "1";
  }
  renderer.render(scene, camera);
}

let pendingStart = false;
function start() {
  if (pendingStart) return true;
  pendingStart = true;
  // Let the loading screen paint before synchronous scene construction begins.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    pendingStart = false;
    if (!/^#(foyer|arcade|alley|booth)$/.test(location.hash)) return;
    try {
      const opened = startNow();
      window.dispatchEvent(new Event(opened ? 'pf-world-ready' : 'pf-world-error'));
    } catch (err) {
      console.warn('Penny Fever startup', err);
      window.dispatchEvent(new Event('pf-world-error'));
    }
  }));
  return true;
}

function startNow() {
  attachHud();
  if (!canGL()) {
    api.ok = false;
    const fail = el("pfWorldFail");
    if (fail) fail.hidden = false;
    document.body.classList.add("is-in-world");
    return false;
  }
  if (!el("pfWorld")) return false;
  const fresh = !scene;
  if (!scene) {
    try {
      buildWorld();
    } catch (err) {
      console.warn("Penny Fever world", err);
      const fail = el("pfWorldFail");
      if (fail) fail.hidden = false;
      return false;
    }
    bindHud();
  }
  api.ok = true;
  api.started = true;
  api.paused = false;
  document.body.classList.add("is-in-world");
  document.body.classList.remove("is-world-map");
  closeAlleyMap();
  onResize();
  wallBackdrops?.resume();
  papercutRides?.resume();
  vendorCutouts?.resume();
  stallCutouts?.resume();
  clock.getDelta();
  cancelAnimationFrame(raf);
  if (fresh) {
    camYaw = 0;
    glanceYaw = 0;
    viewBlend = 0;
    lookZoom = 1;
    if ((location.hash || "").replace(/^#/, "") === "booth") {
      warp(paperRail ? -0.45 : 0.4, COUNTER.z + 1.15, 0);
    } else {
      restoreAlleySpot();
    }
  }
  loop();
  window.dispatchEvent(new Event("pf-world-ready"));
  return true;
}

function pause() {
  closeAlleyMap();
  api.paused = true;
  keys = {};
  joy.active = false;
  joy.x = joy.y = 0;
  wallBackdrops?.pause();
  papercutRides?.pause();
  vendorCutouts?.pause();
  stallCutouts?.pause();
  cancelAnimationFrame(raf);
  clearTimeout(loopTimer);
  clearTimeout(loopOpenTimer);
  loopingAlley = false;
  const veil = el("pfWorldLoopVeil");
  if (veil) veil.classList.remove("is-closing", "is-opening");
}

function resume() {
  if (!scene) return start();
  if (!api.started) return start();
  api.paused = false;
  document.body.classList.add("is-in-world");
  wallBackdrops?.resume();
  papercutRides?.resume();
  vendorCutouts?.resume();
  stallCutouts?.resume();
  clock.getDelta();
  cancelAnimationFrame(raf);
  loop();
}

function stop() {
  pause();
  api.started = false;
  document.body.classList.remove("is-in-world");
}

function boot() {
  if (window.PennyFever) window.PennyFever.world = api;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (api.started && !api.paused) {
        api.tabPause = true;
        pause();
      }
      return;
    }
    if (!api.tabPause) return;
    api.tabPause = false;
    if (/^#(foyer|arcade|alley|booth)$/.test(location.hash)) resume();
  });
  const hash = (location.hash || "").replace(/^#/, "");
  if (hash === "foyer" || hash === "arcade" || hash === "alley" || hash === "booth") {
    start();
  }
}
boot();
