import * as THREE from './lib/three.module.min.js';
import { paperRail } from './paper-guest-entrance.js?v=keep-light-1';
import { CREW_IDS, crewArt, getDoll, onDollChange } from './crew-selector.js?v=doll-torso-1';

export const CREW = CREW_IDS.map((id) => id[0].toUpperCase() + id.slice(1));

const loader = new THREE.TextureLoader();
const maps = {};
function crewTex(src) {
  if (!src) return null;
  if (maps[src]) return maps[src];
  const t = loader.load(src);
  t.colorSpace = THREE.SRGBColorSpace;
  maps[src] = t;
  return t;
}

function wandererIds() {
  const play = getDoll().crew;
  return CREW_IDS.filter((id) => id !== play);
}

function crewView(person, camera) {
  const bearing = Math.atan2(camera.position.x - person.position.x, camera.position.z - person.position.z);
  const angle = Math.atan2(Math.sin(bearing - person.rotation.y), Math.cos(bearing - person.rotation.y));
  let view = Math.abs(angle) < Math.PI / 4 ? 0 : Math.abs(angle) > Math.PI * 3 / 4 ? 2 : angle > 0 ? 1 : 3;
  if (person.userData.crewId === 'rowan' && (view === 1 || view === 3)) view = 4 - view;
  return { bearing, view };
}

/** Aisle wanderers only. Stall hosts keep their own vendor portraits. */
export function installPaperCrew(npcs) {
  if (!paperRail) return;

  npcs.forEach((person, index) => {
    const mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.12, side: THREE.DoubleSide });
    const stand = new THREE.Group();
    const views = [];
    for (let side = 0; side < 4; side += 1) {
      const view = new THREE.Group();
      function piece(x0, y0, x1, y1) {
        const g = new THREE.PlaneGeometry((x1 - x0) * 1.2, (y1 - y0) * 1.6);
        const uv = g.attributes.uv;
        for (let i = 0; i < uv.count; i += 1) uv.setXY(i, (side + x0 + uv.getX(i) * (x1 - x0)) / 4, y0 + uv.getY(i) * (y1 - y0));
        return new THREE.Mesh(g, mat);
      }
      const torso = piece(0, 0.26, 1, 1);
      torso.position.y = 1.008;
      view.add(torso);
      const legs = [];
      for (let i = 0; i < 2; i += 1) {
        const pivot = new THREE.Group();
        pivot.position.set((i ? 1 : -1) * 0.3, 0.416, 0);
        const shin = piece(i * 0.5, 0, (i + 1) * 0.5, 0.26);
        shin.position.y = -0.208;
        pivot.add(shin);
        view.add(pivot);
        legs.push(pivot);
      }
      view.userData.legs = legs;
      stand.add(view);
      views.push(view);
    }
    [...person.children].forEach((o) => {
      o.visible = false;
      globalThis.PennyFeverRestyle?.noteLiveBody(o);
    });
    person.add(stand);
    globalThis.PennyFeverRestyle?.notePaperCutout(stand);
    person.userData.paperCrew = {
      stand,
      views,
      mat,
      lastX: person.position.x,
      lastZ: person.position.z,
      phase: index * 0.7,
    };
  });

  function wear() {
    const ids = wandererIds();
    npcs.forEach((person, index) => {
      const id = ids[index % ids.length];
      person.userData.crewId = id;
      person.userData.crewName = id[0].toUpperCase() + id.slice(1);
      const c = person.userData.paperCrew;
      if (!c) return;
      c.wantedArt = crewArt(id);
      c.mat.map = crewTex(c.wantedArt);
      c.mat.needsUpdate = true;
    });
    globalThis.PennyFeverRestyle?.refreshRestyle();
  }
  onDollChange(wear);
  wear();
}

export function updatePaperCrew(npcs, camera) {
  for (const person of npcs) {
    const c = person.userData.paperCrew;
    if (!c || !c.stand.visible) continue;
    if (person.userData.stallId) continue;
    if (!c.mat.map && c.wantedArt) {
      c.mat.map = crewTex(c.wantedArt);
      c.mat.needsUpdate = true;
    }
    if (!camera) continue;
    person.scale.z = person.scale.x;
    const dx = person.position.x - c.lastX;
    const dz = person.position.z - c.lastZ;
    const travel = Math.hypot(dx, dz);
    c.lastX = person.position.x;
    c.lastZ = person.position.z;
    c.phase += travel * 10;
    const { bearing, view } = crewView(person, camera);
    c.views.forEach((v, i) => { v.visible = i === view; });
    c.stand.rotation.y = bearing - person.rotation.y;
    const step = Math.floor(c.phase * 10) / 10;
    const swing = travel > 0.0001 ? Math.sin(step) * 0.12 : 0;
    c.views.forEach((v) => {
      v.userData.legs[0].rotation.z = swing;
      v.userData.legs[1].rotation.z = -swing;
    });
    c.stand.position.y = travel > 0.0001 ? Math.abs(Math.sin(step)) * 0.023 : 0;
  }
}
