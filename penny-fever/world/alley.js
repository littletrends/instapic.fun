/* Penny Fever 3D carnival — PF only. Never booth/port 6000.
 * Imagine files are the art bible (palace, hall, Aura lock). Runtime is code. */
import * as THREE from "./lib/three.module.min.js";

const STALLS = [
  { id: "fortune", name: "Mystic Tent", kind: "tent", art: "assets/game/Free_Fortune_States/Closed.webp", accent: 0x6b3a8a, line: "One theatrical ticket. Don’t skip the wait." },
  { id: "love", name: "Love Tester", kind: "cabinet", art: "assets/prepared/love-thermometer-tease.webp", accent: 0xc43a5a, line: "Hold the pink. Miss it and you die hotter." },
  { id: "curios", name: "Digger’s Vault", kind: "cabinet", art: "assets/game/Cabinet_of_Curios/Empty_Cabinet.webp", accent: 0x8a6230, line: "Cash out or go deeper. Greed is the claw." },
  { id: "lookup", name: "Star-Gazing Tent", kind: "tent", art: "assets/prepared/lookup-wonder.webp", accent: 0x3d6a8a, line: "The sky is a button. Look up, darling." },
  { id: "snap", name: "Flash Booth", kind: "cabinet", art: "assets/prepared/snap-freeze-flash.webp", accent: 0xe8d0a0, line: "Tap the true pop. False flashes eat you." },
  { id: "whisper", name: "Gossip Booth", kind: "tent", art: "assets/game/Whisper_Charm/Idle.webp", accent: 0x8a4a6a, line: "Lean in. One word becomes a charm." },
  { id: "ball-toss", name: "Barely-Fit Toss", kind: "booth", art: "assets/prepared/ball-toss-board.webp", accent: 0xc45a3a, line: "Holes that barely fit. Three misses and the oval wins." },
  { id: "coin-pusher", name: "Coin Pusher Shelf", kind: "cabinet", art: "assets/prepared/coin-pusher-greed.webp", accent: 0xd4a45a, line: "Drop a penny. Walk away or get buried." },
  { id: "pinball", name: "Pinball Alley", kind: "cabinet", art: "assets/prepared/pinball-neon-playfield.webp", accent: 0x3a8a6a, line: "One thumb. Survive the chapters." },
  { id: "water-gun", name: "Water Gun Duel", kind: "booth", art: "assets/prepared/water-gun-duel.webp", accent: 0x3a7aaa, line: "Fill the clown. The other lane is a ghost." },
  { id: "milk-bottles", name: "Weighted Bottles", kind: "booth", art: "assets/prepared/milk-bottle-pyramid.webp", accent: 0xc0c4cc, line: "Bottom row’s lead. You felt it." },
  { id: "cover-the-spot", name: "Cover-the-Spot", kind: "booth", art: "assets/prepared/cover-the-spot.webp", accent: 0xc45a6a, line: "Cover it — or get greedy." },
  { id: "mutoscope", name: "Mutoscope Hood", kind: "cabinet", art: "assets/prepared/mutoscope-peephole-glow.webp", accent: 0x8a3030, line: "Stillness opens the iris." },
  { id: "high-striker", name: "High Striker", kind: "booth", art: "assets/prepared/night-carnival-exterior.webp", accent: 0xd45a3a, line: "Ring the bell. The pegs lie about the weight." },
  { id: "catoptromancy", name: "Catoptromancy", kind: "tent", art: "assets/prepared/doorway-beckon.webp", accent: 0x5a3a8a, line: "Don’t look away from the glass." },
  { id: "bent-rings", name: "Bent Ring Pegs", kind: "booth", art: "assets/prepared/night-carnival-exterior.webp", accent: 0x8a6a3a, line: "The pegs lean. The rings know." },
  { id: "plinko", name: "Plinko Pegboard", kind: "cabinet", art: "assets/prepared/night-carnival-exterior.webp", accent: 0x3a8a8a, line: "Drop with the breath." },
  { id: "fairy-floss", name: "Fairy Floss Wheel", kind: "tent", art: "assets/prepared/fairy-floss-sugar-tent.webp", accent: 0xe8a0c0, line: "Wind it tall. Don’t snap the sugar." },
  { id: "popcorn", name: "Popcorn Kettle", kind: "booth", art: "assets/prepared/night-carnival-exterior.webp", accent: 0xe8c45a, line: "Tap the pop. Steam fakes the beat." },
  { id: "duck-pond", name: "Duck Pond Hook", kind: "booth", art: "assets/prepared/night-carnival-exterior.webp", accent: 0x3a8a5a, line: "Hook the call, not the decoy." },
  { id: "skee-ball", name: "Skee-Ball Alley", kind: "booth", art: "assets/prepared/night-carnival-exterior.webp", accent: 0xc46a3a, line: "Wax lies mid-stage." },
  { id: "penny-pitch", name: "Penny Pitch", kind: "booth", art: "assets/prepared/night-carnival-exterior.webp", accent: 0xd4a45a, line: "Land a colour. The cloth jerks after you let go." },
  { id: "dunk-tank", name: "Dunk the Barker", kind: "booth", art: "assets/prepared/night-carnival-exterior.webp", accent: 0x3a6aaa, line: "Soak the crown. Three balls a seat." },
  { id: "marquee", name: "Boardwalk Lights", kind: "cabinet", art: "assets/prepared/ticket-booth-lean.webp", accent: 0xf0d09a, line: "Repeat the bulb storm." },
  { id: "pack", name: "Night Kit", kind: "booth", art: "assets/game/Cabinet_of_Curios/Pressed_Penny.webp", accent: 0x8a6230, line: "Pack the suitcase before a run." },
  { id: "pass", name: "Backstage Flap", kind: "tent", art: "assets/game/Showmans_Pass/Blank_Ticket.webp", accent: 0x5a2030, line: "Employees only — probably." },
];

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
const STALL_X = 2.62;
const STALL_STEP = 2.68;
const STALL_Z0 = 8;
const AISLE = 1.62;
const FACE_PULL = 1.7;
const DOOR_REACH = 2.6;
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

  const faceZ = spec.kind === "tent" ? 0.76 : spec.kind === "cabinet" ? 0.56 : 0.52;
  root.add(meshBox(dark, 0.09, 1.62, 0.09, -0.64, 1.12, faceZ));
  root.add(meshBox(dark, 0.09, 1.62, 0.09, 0.64, 1.12, faceZ));
  root.add(meshBox(accent, 1.38, 0.1, 0.1, 0, 1.96, faceZ));
  root.add(meshBox(wood, 0.92, 0.07, 0.5, 0, 0.04, faceZ + 0.34));

  root.userData.stall = spec;
  root.userData.worldX = x;
  root.userData.worldZ = z;
  root.userData.faceOff = faceZ + 0.4;
  root.userData.hitR = spec.kind === "tent" ? 1.22 : spec.kind === "cabinet" ? 0.98 : 1.08;
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

  const facadeMap = artMap("assets/prepared/night-carnival-exterior.webp");
  const facade = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6, 11.4),
    new THREE.MeshBasicMaterial({ map: facadeMap, side: THREE.DoubleSide })
  );
  facade.position.set(0.1, 5.65, frontZ);
  facade.rotation.y = Math.PI;
  group.add(facade);
  loadImage("assets/prepared/night-carnival-exterior.webp").then((img) => {
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
    new THREE.PlaneGeometry(8.6, len + 4),
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
  [-1, 1].forEach((side) => {
    group.add(meshBox(wallM, 0.28, 4.6, len, side * 4.25, 2.3, len / 2));
    group.add(meshBox(makeMat(VELVET), 0.12, 1.4, len, side * 4.05, 3.6, len / 2));
  });
  group.add(meshBox(makeMat(0x1c120e), 8.8, 0.2, len, 0, 4.7, len / 2));
  group.add(meshBox(makeMat(WOOD_DARK), 8.6, 3.6, 0.4, 0, 1.8, len + 1.6));

  const lampMat = makeMat(0xffe2a8, { emissive: 0xffd08a, emissiveIntensity: 0.85 });
  const brass = makeMat(BRASS, { metalness: 0.7, roughness: 0.3 });
  for (let z = 8; z < len - 2; z += 8) {
    [-1, 1].forEach((side) => {
      const lx = side * 3.55;
      group.add(meshCyl(brass, 0.05, 0.05, 0.4, lx, 3.7, z));
      group.add(meshSphere(lampMat, 0.12, lx, 3.45, z));
    });
    const lamp = new THREE.PointLight(0xffd090, 1.25, 14, 2);
    lamp.position.set(0, 3.5, z);
    lamp.userData.flicker = 0.8 + Math.random();
    group.add(lamp);
  }

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

function makeSky() {
  const geo = new THREE.SphereGeometry(90, 24, 16);
  const mat = new THREE.MeshBasicMaterial({ map: starTex(), side: THREE.BackSide });
  return new THREE.Mesh(geo, mat);
}

function makeFireflies() {
  const n = 90;
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
  const mat = new THREE.PointsMaterial({
    color: 0xffd080,
    size: 0.16,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.userData.phase = phase;
  return pts;
}

const GATE_Z = -7.52;
const AURA_DOOR = { x: 0.12, z: -7.72 };
const AURA_TILL = { x: 2.15, z: 3.1 };

function pfState() {
  return (window.PennyFever && typeof window.PennyFever.getState === "function" && window.PennyFever.getState()) || {};
}
function ticketPassed() {
  return !!pfState().admitPassed;
}
function hasAdmitTicket() {
  return !!pfState().admitTicket;
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
};

window.PennyFeverWorld = api;

let renderer, scene, camera, clock;
let player, aura, barkers, guests, stalls, fireflies, lamps;
let keys = {};
let joy = { x: 0, y: 0, active: false };
let camYaw = 0;
let lookDrag = false;
let nearest = null;
let promptTargetSlug = "";
let raf = 0;
let hintTimer = 0;
let solids = [];
let loopingAlley = false;
let loopTimer = 0;
let loopOpenTimer = 0;
let gatePromptActive = false;
let chatPinned = false;
const hudAnchor = new THREE.Vector3();

function el(id) {
  return document.getElementById(id);
}

function attachHud() {
  const stage = el("pfWorldStage");
  if (!stage || el("pfWorldPrompt")) return;
  stage.insertAdjacentHTML("beforeend", `
    <div class="pf-world-hud" id="pfWorldHud">
      <div class="pf-world-brand"><small>After dark</small><strong>Penny Fever</strong></div>
      <div class="pf-world-tools">
        <button type="button" id="pfWorldMap">Paper map</button>
        <button type="button" id="pfWorldLeave">Leave alley</button>
      </div>
      <div class="pf-world-compass" id="pfWorldCompass">
        <span id="pfWorldZone">PIER</span>
        <strong id="pfWorldNearest">Heart palace</strong>
      </div>
      <div class="pf-world-speech" id="pfWorldSpeech" hidden>
        <b>Aura</b>
        <p id="pfWorldSpeechText"></p>
      </div>
      <div class="pf-world-prompt" id="pfWorldPrompt" hidden>
        <button type="button" id="pfWorldEnter">Step inside</button>
        <em id="pfWorldPromptLine"></em>
      </div>
      <nav class="pf-world-pocket" aria-label="Your Penny Fever pocket">
        <button type="button" id="pfPocketTicket"><span>🎟</span>Ticket</button>
        <button type="button" id="pfPocketChat"><span>💬</span>Chat</button>
        <button type="button" id="pfPocketChest"><span>🗝</span>Cabinet</button>
      </nav>
      <div class="pf-joy" id="pfJoy" aria-hidden="true"><i class="pf-joy-knob" id="pfJoyKnob"></i></div>
      <p class="pf-world-hint" id="pfWorldHint">Walk the aisle · stalls left and right · tap a door to enter</p>
      <div class="pf-world-loop-veil" id="pfWorldLoopVeil" aria-hidden="true"><span>THE NIGHT BENDS ROUND…</span></div>
    </div>
    <div class="pf-world-fail" id="pfWorldFail" hidden>
      <div>
        <p>This machine won’t spin a 3D alley.</p>
        <button type="button" id="pfWorldFailMap">Open the paper map</button>
      </div>
    </div>
  `);
}

function bindHud() {
  const map = el("pfWorldMap");
  const leave = el("pfWorldLeave");
  const enter = el("pfWorldEnter");
  const pocketTicket = el("pfPocketTicket");
  const pocketChat = el("pfPocketChat");
  const pocketChest = el("pfPocketChest");
  const failMap = el("pfWorldFailMap");
  if (map) {
    map.addEventListener("click", () => {
      document.body.classList.toggle("is-world-map");
      map.textContent = document.body.classList.contains("is-world-map") ? "3D alley" : "Paper map";
      if (document.body.classList.contains("is-world-map")) pause();
      else resume();
    });
  }
  if (leave) leave.addEventListener("click", () => { location.hash = "door"; });
  if (enter) {
    enter.addEventListener("click", (event) => {
      event.preventDefault();
      enterNearest();
    });
  }
  if (pocketTicket) pocketTicket.addEventListener("click", () => {
    const prompt = el("pfWorldPrompt");
    if (prompt && !prompt.hidden) enterNearest();
    else {
      pocketTicket.classList.remove("is-nudging");
      void pocketTicket.offsetWidth;
      pocketTicket.classList.add("is-nudging");
    }
  });
  if (pocketChat) pocketChat.addEventListener("click", () => {
    chatPinned = !chatPinned;
    pocketChat.classList.toggle("is-active", chatPinned);
    pocketChat.setAttribute("aria-pressed", String(chatPinned));
  });
  if (pocketChest) pocketChest.addEventListener("click", () => {
    const PF = window.PennyFever;
    if (PF && typeof PF.enterTent === "function") PF.enterTent("curios");
    else if (PF && typeof PF.enter === "function") PF.enter("curios");
  });
  if (failMap) {
    failMap.addEventListener("click", () => {
      document.body.classList.add("is-in-world", "is-world-map");
      const stage = el("pfWorldStage");
      if (stage) stage.style.display = "none";
    });
  }
  bindJoy();
  bindLook();
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });
}

function onKey(e) {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === "e" || k === "enter") {
    if (gatePromptActive || promptTargetSlug || nearest) {
      e.preventDefault();
      enterNearest();
    }
  }
  if (k === "m") {
    const map = el("pfWorldMap");
    if (map) map.click();
  }
}

function bindLook() {
  const canvas = el("pfWorld");
  if (!canvas) return;
  let dragging = false;
  let lastX = 0;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lookDrag = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    camYaw -= (e.clientX - lastX) * 0.005;
    lastX = e.clientX;
  });
  const end = () => { dragging = false; lookDrag = false; };
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

function enterNearest() {
  if (handleGatePrompt()) return;
  const slug = promptTargetSlug || (nearest && nearest.id);
  if (!slug) return;
  const PF = window.PennyFever;
  if (PF && typeof PF.enterTent === "function") PF.enterTent(slug);
  else if (PF && typeof PF.enter === "function") PF.enter(slug);
  else location.hash = "cabinet/" + slug;
}

function buildWorld() {
  const canvas = el("pfWorld");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: window.devicePixelRatio < 1.6, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 2.05;
  renderer.setClearColor(0x070b16, 1);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b1018, 0.026);
  camera = new THREE.PerspectiveCamera(58, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 140);
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

  scene.add(makeSky());
  makePier(scene);
  makePalace(scene);
  hallLen = STALL_Z0 + STALLS.length * STALL_STEP + 8;
  makeHall(scene, hallLen);

  stalls = [];
  solids = [];
  STALLS.forEach((spec, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * STALL_X;
    const z = STALL_Z0 + i * STALL_STEP;
    const yaw = Math.atan2(-x, -FACE_PULL);
    const s = makeStall(spec, x, z, yaw);
    s.userData.side = side;
    s.userData.doorX = x + Math.sin(yaw) * s.userData.faceOff;
    s.userData.doorZ = z + Math.cos(yaw) * s.userData.faceOff;
    scene.add(s);
    stalls.push(s);
    solids.push({ x, z, r: s.userData.hitR });
  });

  const curtain = meshBox(makeMat(VELVET), 7.6, 3.8, 0.2, 0, 1.9, hallLen + 0.8);
  scene.add(curtain);
  const endSign = makeSign("ROUND AGAIN", 0x8a2030);
  endSign.position.set(0, 3.4, hallLen + 0.6);
  scene.add(endSign);

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

  const vendorNote = makeNoteBoard("VENDOR DESK", [
    "One Grok per doorway — go 3D in the tent.",
    "Full creative reins. Recreate freely.",
    "Do NOT touch world/alley.js",
    "Do NOT touch booth / port 6000",
    "Own vendors/{id}.js + #cabinet/{id}",
    "Read ops/ATTN_VENDOR_AGENTS.md",
  ]);
  vendorNote.position.set(-2.45, 1.45, 4.2);
  vendorNote.rotation.y = Math.PI / 2;
  scene.add(vendorNote);

  player = makePerson({ kind: "guest", cloth: 0xb08a78, scale: 1.05 });
  player.position.set(0, 0, -16.2);
  scene.add(player);
  camera.position.set(0, 2.35, -22.2);
  camera.lookAt(0, 1.15, -16.2);

  aura = makePerson({ kind: "aura", cloth: DRESS, scale: 1.08, chibi: true });
  dressAura(aura);
  aura.position.set(AURA_DOOR.x, 0, AURA_DOOR.z);
  scene.add(aura);

  barkers = [];
  [1, 6, 8, 22].forEach((idx) => {
    if (!stalls[idx]) return;
    const b = makePerson({ cloth: STALLS[idx].accent, scale: 0.95 });
    dressBarker(b, STALLS[idx].accent);
    const s = stalls[idx];
    b.position.set(s.userData.doorX, 0, s.userData.doorZ);
    scene.add(b);
    barkers.push(b);
  });

  guests = [];
  for (let i = 0; i < 4; i += 1) {
    const g = makePerson({
      cloth: [0x4a3040, 0x2a3a48, 0x4a3a28, 0x3a2840][i],
      scale: 0.9 + Math.random() * 0.12,
    });
    g.userData.patrol = {
      dir: Math.random() > 0.5 ? 1 : -1,
      speed: 0.7 + Math.random() * 0.5,
    };
    g.position.set((Math.random() - 0.5) * 1.4, 0, 10 + i * 14);
    scene.add(g);
    guests.push(g);
  }

  fireflies = makeFireflies();
  scene.add(fireflies);
  lamps = [];
  scene.traverse((o) => {
    if (o.isPointLight && o.userData.flicker) lamps.push(o);
  });

  window.addEventListener("resize", onResize);
}

function onResize() {
  if (!renderer || !camera) return;
  const w = window.innerWidth;
  const h = Math.max(1, window.innerHeight);
  camera.aspect = w / h;
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
    zone: z < -3 ? "pier" : "alley",
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
  updateCamera();
  return pose();
}

function hitsSolid(nx, nz) {
  const pad = 0.34;
  for (let i = 0; i < solids.length; i += 1) {
    const s = solids[i];
    const hit = s.r + pad;
    const dx = nx - s.x;
    const dz = nz - s.z;
    if (dx * dx + dz * dz < hit * hit) return true;
  }
  return false;
}

function blocked(nx, nz) {
  if (!ticketPassed() && nz > GATE_Z) return true;
  if (nz < -8.4) {
    if (nz < -34) return true;
    return Math.abs(nx) > 4.8;
  }
  if (hitsSolid(nx, nz)) return true;
  if (nz < 1.2 && Math.abs(nx) < 1.25) return false;
  if (nz > hallLen + 1.2) return true;
  return Math.abs(nx) > AISLE;
}

function tryMove(dx, dz) {
  const x = player.position.x;
  const z = player.position.z;
  if (!blocked(x + dx, z + dz)) {
    player.position.x += dx;
    player.position.z += dz;
    return;
  }
  if (!blocked(x + dx, z)) player.position.x += dx;
  if (!blocked(x, z + dz)) player.position.z += dz;
  else if (!ticketPassed() && z + dz > GATE_Z) api.gateBump = true;
}

function updatePlayer(dt) {
  let ix = joy.x;
  let iy = -joy.y;
  if (keys.w || keys.arrowup) iy += 1;
  if (keys.s || keys.arrowdown) iy -= 1;
  if (keys.a || keys.arrowleft) ix -= 1;
  if (keys.d || keys.arrowright) ix += 1;
  const mag = Math.hypot(ix, iy);
  let moving = false;
  if (mag > 0.08) {
    ix /= mag;
    iy /= mag;
    const speed = (keys.shift ? 6.2 : 3.6) * dt;
    const fx = Math.sin(camYaw);
    const fz = Math.cos(camYaw);
    /* Looking +Z, Three.js +X is screen-left. Flip strafe so arrows match the screen. */
    const rx = -Math.cos(camYaw);
    const rz = Math.sin(camYaw);
    const dx = (iy * fx + ix * rx) * speed;
    const dz = (iy * fz + ix * rz) * speed;
    tryMove(dx, dz);
    player.userData.heading = Math.atan2(dx, dz);
    player.rotation.y = player.userData.heading;
    moving = true;
  }
  if (!loopingAlley && ticketPassed() && player.position.z > hallLen - 0.15) {
    loopingAlley = true;
    const veil = el("pfWorldLoopVeil");
    if (veil) veil.classList.add("is-closing");
    loopTimer = window.setTimeout(() => {
      const fromZ = player.position.z;
      const nextZ = 5.25;
      player.position.x = Math.max(-0.8, Math.min(0.8, player.position.x));
      player.position.z = nextZ;
      if (camera) camera.position.z += nextZ - fromZ;
      nearest = null;
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
  if (!hasAdmitTicket()) {
    if (PF && typeof PF.takeAdmitTicket === "function") PF.takeAdmitTicket();
    if (navigator.vibrate) navigator.vibrate(30);
    return true;
  }
  const prompt = el("pfWorldPrompt");
  if (prompt) prompt.classList.add("is-ticket-given");
  if (PF && typeof PF.passAdmitTicket === "function") PF.passAdmitTicket();
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
  if (moving) aura.rotation.y = Math.atan2(dx, dz);
  else {
    const lx = player.position.x - aura.position.x;
    const lz = player.position.z - aura.position.z;
    aura.rotation.y = Math.atan2(lx, lz);
  }
  const nearPlayer = player.position.distanceTo(aura.position) < 2.4;
  animatePerson(aura, dt, moving, nearPlayer && !moving);
}

function updateCrowd(dt) {
  barkers.forEach((b) => {
    const lx = player.position.x - b.position.x;
    const lz = player.position.z - b.position.z;
    b.rotation.y = Math.atan2(lx, lz);
    animatePerson(b, dt, false, Math.hypot(lx, lz) < 3.2);
  });
  guests.forEach((g) => {
    const p = g.userData.patrol;
    g.position.z += p.dir * p.speed * dt;
    if (g.position.z > hallLen - 4 || g.position.z < 6) p.dir *= -1;
    g.rotation.y = p.dir > 0 ? 0 : Math.PI;
    animatePerson(g, dt, true, false);
  });
}

function findNearest() {
  let best = null;
  let bestD = DOOR_REACH;
  stalls.forEach((s) => {
    const spec = s.userData.stall;
    const dx = player.position.x - s.userData.doorX;
    const dz = player.position.z - s.userData.doorZ;
    const d = Math.hypot(dx, dz);
    if (d < bestD) {
      bestD = d;
      best = {
        id: spec.id,
        name: spec.name,
        line: spec.line,
        worldX: s.userData.doorX,
        worldZ: s.userData.doorZ,
        dist: d,
      };
    }
  });
  nearest = best;
  const prompt = el("pfWorldPrompt");
  const enter = el("pfWorldEnter");
  const line = el("pfWorldPromptLine");
  const zone = el("pfWorldZone");
  const nearEl = el("pfWorldNearest");
  const speech = el("pfWorldSpeech");
  const speechText = el("pfWorldSpeechText");
  const z = player.position.z;
  if (z < GATE_Z - 1.8) api.gateBump = false;
  if (zone) {
    zone.textContent = z < -3 ? "PIER · HEART PALACE" : `HALL · ${Math.max(0, Math.round(z))} PACES`;
  }
  if (nearEl) {
    if (!ticketPassed() && z < 0) nearEl.textContent = "Aura holds the door";
    else if (z > hallLen - 6) nearEl.textContent = "The alley bends around";
    else nearEl.textContent = best ? best.name : (z < -3 ? "Walk through the doorway" : "Walk up to a door");
  }
  if (prompt && enter && line) {
    if (!ticketPassed() && (atAuraGate() || api.gateBump)) {
      gatePromptActive = true;
      promptTargetSlug = "";
      prompt.hidden = false;
      prompt.classList.add("is-ticket-handoff");
      if (!hasAdmitTicket()) {
        enter.textContent = "Take a ticket · free tonight";
        line.textContent = "She won’t step aside without a stub.";
      } else {
        enter.textContent = "Give the ticket to Aura";
        line.textContent = "Hand it over. Then the doorway opens.";
      }
    } else if (best) {
      gatePromptActive = false;
      promptTargetSlug = best.id;
      prompt.hidden = false;
      prompt.classList.remove("is-ticket-handoff");
      enter.textContent = "Present a ticket · " + best.name;
      line.textContent = best.line;
    } else {
      gatePromptActive = false;
      promptTargetSlug = "";
      prompt.hidden = true;
      prompt.classList.remove("is-ticket-handoff");
    }
  }
  if (speech && speechText) {
    const dAura = player.position.distanceTo(aura.position);
    if (!ticketPassed() && (dAura < 2.6 || api.gateBump)) {
      speech.hidden = false;
      speechText.textContent = hasAdmitTicket()
        ? "That’s far enough. Ticket, please."
        : "Ticket first, darling. You don’t get past me without it.";
    } else if (best && best.dist < 2.1) {
      speech.hidden = false;
      speechText.textContent = best.line;
    } else if (z > hallLen - 6) {
      speech.hidden = false;
      speechText.textContent = "Keep walking. My midway refuses to end neatly.";
    } else if (ticketPassed() && dAura < 2.4) {
      speech.hidden = false;
      speechText.textContent = "First fortune is free. Everything else is a pretend penny. Follow the lights.";
    } else if (chatPinned) {
      speech.hidden = false;
      speechText.textContent = "Ask me at any tent. I know which machines lie and which merely cheat.";
    } else {
      speech.hidden = true;
    }
  }
}

function updateHudAnchor() {
  const prompt = el("pfWorldPrompt");
  if (!prompt || prompt.hidden || !player || !camera || !renderer) return;
  hudAnchor.copy(player.position);
  hudAnchor.y += 2.15;
  hudAnchor.project(camera);
  const rect = renderer.domElement.getBoundingClientRect();
  const x = Math.max(170, Math.min(rect.width - 170, (hudAnchor.x * 0.5 + 0.5) * rect.width));
  const y = Math.max(145, Math.min(rect.height - 210, (-hudAnchor.y * 0.5 + 0.5) * rect.height - 12));
  prompt.style.left = `${x}px`;
  prompt.style.top = `${y}px`;
  prompt.style.bottom = "auto";
}

function updateCamera() {
  const dist = player.position.z > -1 ? 4.6 : 5.6;
  const height = 2.05;
  const lookY = 0.95;
  const tx = player.position.x - Math.sin(camYaw) * dist;
  const tz = player.position.z - Math.cos(camYaw) * dist;
  camera.position.x += (tx - camera.position.x) * 0.12;
  camera.position.y += (player.position.y + height - camera.position.y) * 0.12;
  camera.position.z += (tz - camera.position.z) * 0.12;
  camera.lookAt(player.position.x, player.position.y + lookY, player.position.z);
}

function updateFx(t) {
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
  const warm = player.position.z > 0;
  scene.fog.color.set(warm ? 0x140c0c : 0x0b1018);
  scene.fog.density = warm ? 0.034 : 0.026;
}

function loop() {
  if (!api.started || api.paused) return;
  raf = requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;
  updatePlayer(dt);
  updateAura(dt);
  updateCrowd(dt);
  findNearest();
  updateCamera();
  updateHudAnchor();
  updateFx(t);
  hintTimer += dt;
  if (hintTimer > 8) {
    const hint = el("pfWorldHint");
    if (hint) hint.dataset.gone = "1";
  }
  renderer.render(scene, camera);
}

function start() {
  attachHud();
  if (!canGL()) {
    api.ok = false;
    const fail = el("pfWorldFail");
    if (fail) fail.hidden = false;
    document.body.classList.add("is-in-world", "is-world-map");
    return false;
  }
  if (!el("pfWorld")) return false;
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
  onResize();
  clock.getDelta();
  cancelAnimationFrame(raf);
  loop();
  return true;
}

function pause() {
  api.paused = true;
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
  const hash = (location.hash || "").replace(/^#/, "");
  if (hash === "foyer" || hash === "arcade" || hash === "alley") {
    start();
  }
}
boot();
