import * as THREE from '../../world/lib/three.module.min.js';
import {STEP, spring} from './model.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const material = (color, metalness = 0) => new THREE.MeshStandardMaterial({color, metalness, roughness: metalness ? .38 : .88});

function starShape(radius, inner = .44, points = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const a = Math.PI / 2 + i * Math.PI / points, r = radius * (i % 2 ? inner : 1);
    if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath(); return s;
}
function ringShape(radius, width) {
  const s = new THREE.Shape(); s.absarc(0, 0, radius, 0, TAU, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, radius - width, 0, TAU, true); s.holes.push(hole); return s;
}
function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}

// Scene construction is CPU-testable. No generated images, canvas textures or external assets.
export function buildVault() {
  const root = new THREE.Group(), pickables = [];
  const m = {wood: material(0x214637), edge: material(0x152e26), brass: material(0xb69254, .65), gold: material(0xe2c582, .55),
    paper: material(0xded0a5), velvet: material(0x341f36), dark: material(0x091a17), copper: material(0x94543e, .45),
    crown: material(0xe6b467, .3), star: material(0x82cabe, .3), moon: material(0xdd9dac, .3), wing: material(0x427c6e)};
  const mesh = (geo, mat, parent, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); parent.add(o); return o;
  };
  const box = (p, w, h, d, mat, x = 0, y = 0, z = 0) => mesh(new THREE.BoxGeometry(w, h, d), mat, p, x, y, z);
  const plate = (p, w, h, mat, x = 0, y = 0, z = 0, depth = .045) => mesh(new THREE.ExtrudeGeometry(roundedRect(w, h, .12), {depth, bevelEnabled: true, bevelSize: .025, bevelThickness: .018, bevelSegments: 2, steps: 1, curveSegments: 8}), mat, p, x, y, z);
  const ring = (p, r, width, mat, x = 0, y = 0, z = 0) => mesh(new THREE.ExtrudeGeometry(ringShape(r, width), {depth: .05, bevelEnabled: true, bevelSize: .012, bevelThickness: .008, bevelSegments: 1, curveSegments: 32, steps: 1}), mat, p, x, y, z);
  const markPick = (object, control) => { object.userData.control = control; pickables.push(object); return object; };
  const screw = (p, x, y, z, scale = 1) => {
    const pin = mesh(new THREE.CylinderGeometry(.052 * scale, .052 * scale, .03, 10), m.gold, p, x, y, z); pin.rotation.x = Math.PI / 2;
    const slot = box(p, .06 * scale, .013, .012, m.dark, x, y, z + .02); slot.rotation.z = -.5;
  };
  // Box has a real empty interior. The hinged front is not pasted over a solid cube.
  box(root, 3.65, 4.35, .13, m.wood, 0, 0, -.72);
  box(root, .18, 4.35, 1.55, m.wood, -1.74);
  box(root, .18, 4.35, 1.55, m.wood, 1.74);
  box(root, 3.65, .18, 1.65, m.wood, 0, 2.1);
  box(root, 3.65, .18, 1.65, m.wood, 0, -2.1);
  plate(root, 3.24, 3.92, m.velvet, 0, 0, -.63);
  plate(root, 3.96, .28, m.brass, 0, -2.3, -.8, 1.64);
  plate(root, 3.94, .22, m.brass, 0, 2.3, -.8, 1.64);
  for (const x of [-1.72, 1.72]) {
    box(root, .06, 4.14, .05, m.gold, x, 0, .84);
    for (const y of [-1.87, 1.87]) screw(root, x, y, .88);
  }
  // A folded-paper crown and a tiny decorative, genuinely dimensional scroll.
  const crown = new THREE.Shape(); crown.moveTo(-.42, 0); crown.lineTo(-.5, .37); crown.lineTo(-.23, .2); crown.lineTo(0, .57); crown.lineTo(.23, .2); crown.lineTo(.5, .37); crown.lineTo(.42, 0); crown.closePath();
  mesh(new THREE.ExtrudeGeometry(crown, {depth: .12, bevelEnabled: false}), m.gold, root, 0, 2.37, .25);
  for (const side of [-1, 1]) {
    const points = [];
    for (let i = 0; i < 35; i++) { const a = i / 34 * Math.PI * 2.4, r = .04 + i / 34 * .3; points.push(new THREE.Vector3(side * (.78 + Math.cos(a) * r), 2.4 + Math.sin(a) * r * .5, .35)); }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, .024, 6, false), m.brass, root);
  }
  const hinge = new THREE.Group(); hinge.position.set(-1.64, 0, .82); root.add(hinge);
  const door = plate(hinge, 3.25, 3.99, m.wood, 1.64, 0, -.06, .12);
  for (const y of [-1.45, 1.45]) {
    const knuckle = mesh(new THREE.CylinderGeometry(.075, .075, .5, 12), m.brass, root, -1.64, y, .82);
    screw(hinge, .14, y, .1); knuckle.name = 'door-hinge';
  }
  plate(hinge, 2.99, 3.7, m.brass, 1.64, 0, .08);
  plate(hinge, 2.84, 3.56, m.edge, 1.64, 0, .135);
  for (const x of [.29, 2.99]) for (const y of [-1.65, 1.65]) screw(hinge, x, y, .2);
  // Coaxial dial assembly, with visible bearings and distinct jewel/socket pairs.
  const assembly = new THREE.Group(); assembly.position.set(1.64, .36, .22); hinge.add(assembly);
  const dials = [], sockets = [], radii = [1.29, .94, .59];
  for (let i = 0; i < 3; i++) {
    const r = radii[i], group = new THREE.Group(); assembly.add(group); dials.push(group);
    const face = ring(group, r, .25, i === 1 ? m.copper : m.brass); markPick(face, {type: 'dial', dial: i});
    for (let t = 0; t < 12; t++) {
      const angle = t / 12 * TAU, x = Math.sin(angle) * (r - .125), y = Math.cos(angle) * (r - .125);
      const notch = box(group, .025, .055, .014, m.gold, x, y, .075); notch.rotation.z = -angle;
      const tooth = box(group, .08, .055, .09, m.brass, Math.sin(angle) * (r + .015), Math.cos(angle) * (r + .015)); tooth.rotation.z = -angle;
    }
    const jewel = mesh(new THREE.OctahedronGeometry(.075, 0), [m.crown, m.star, m.moon][i], group, 0, r - .13, .15);
    markPick(jewel, {type: 'dial', dial: i});
    // Sockets sit beyond their ring, on a fixed bridge behind the jewels.
    const socket = ring(assembly, .066, .02, [m.crown, m.star, m.moon][i], 0, r - .13, .19);
    socket.name = `socket-${i}`; sockets.push(socket);
  }
  const bearing = ring(assembly, .22, .06, m.gold, 0, 0, .13);
  const centre = mesh(new THREE.ExtrudeGeometry(starShape(.11), {depth: .035, bevelEnabled: false}), m.gold, assembly, 0, 0, .2);
  bearing.name = 'fixed-bearing'; centre.name = 'bearing-star';
  // Handle is also the key: it turns before either of the two bolts retracts.
  plate(hinge, 1.62, .48, m.brass, 1.64, -1.32, .21);
  const handle = new THREE.Group(); handle.position.set(1.64, -1.32, .29); hinge.add(handle);
  markPick(ring(handle, .17, .055, m.edge), {type: 'handle'});
  markPick(box(handle, .68, .085, .08, m.gold, 0, 0, .07), {type: 'handle'});
  const handleHit = box(handle, .83, .38, .12, new THREE.MeshBasicMaterial({visible: false}), 0, 0, .05); markPick(handleHit, {type: 'handle'});
  const bolts = [-1.3, 1.3].map(y => box(hinge, .35, .11, .11, m.gold, 3.27, y, -.06));
  // Drawer and butterfly are nested groups: they move with the shelf, not through it.
  const drawer = new THREE.Group(); drawer.position.set(0, -1.19, -.12); root.add(drawer);
  box(drawer, 3.09, .13, 1.26, m.paper, 0, -.32);
  for (const x of [-1.48, 1.48]) box(drawer, .1, .64, 1.26, m.wood, x);
  box(drawer, 3.04, .62, .1, m.wood, 0, 0, -.59);
  const drawerFace = plate(drawer, 3.16, .68, m.wood, 0, 0, .6);
  markPick(drawerFace, {type: 'drawer'});
  markPick(ring(drawer, .14, .035, m.gold, 0, .02, .76), {type: 'drawer'});
  const drawerHit = box(drawer, .85, .4, .15, new THREE.MeshBasicMaterial({visible: false}), 0, 0, .79); markPick(drawerHit, {type: 'drawer'});
  // Raised false-bottom pedestal keeps the treasure clear of the drawer front.
  box(drawer, 1.05, .11, .78, m.velvet, 0, -.13, 0);
  const butterfly = new THREE.Group(); butterfly.position.set(0, .32, .1); drawer.add(butterfly);
  mesh(new THREE.SphereGeometry(.085, 12, 8), m.gold, butterfly, 0, .24, 0);
  const body = mesh(new THREE.CapsuleGeometry(.055, .4, 4, 8), m.brass, butterfly);
  const wings = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.x = side * .055; butterfly.add(pivot); wings.push(pivot);
    const shape = new THREE.Shape(); shape.moveTo(0, .1); shape.bezierCurveTo(.31, .65, .86, .57, .64, .06); shape.bezierCurveTo(.85, -.34, .19, -.6, 0, -.12); shape.closePath();
    const wing = mesh(new THREE.ExtrudeGeometry(shape, {depth: .026, bevelEnabled: false, curveSegments: 14}), m.wing, pivot); wing.scale.x = side;
    for (const [x, y, r] of [[.38, .25, .14], [.34, -.15, .085]]) {
      ring(pivot, r, .018, m.gold, side * x, y, .035);
      mesh(new THREE.ExtrudeGeometry(starShape(r * .6), {depth: .01, bevelEnabled: false}), m.paper, pivot, side * x, y, .06);
    }
    const antenna = new THREE.CatmullRomCurve3([new THREE.Vector3(side * .03, .27, 0), new THREE.Vector3(side * .12, .42, .01), new THREE.Vector3(side * .2, .41, .02)]);
    mesh(new THREE.TubeGeometry(antenna, 12, .012, 5, false), m.gold, butterfly);
  }
  const windKey = new THREE.Group(); windKey.position.set(0, -.13, .18); butterfly.add(windKey);
  markPick(ring(windKey, .095, .029, m.gold, -.074, 0, 0), {type: 'wind'});
  markPick(ring(windKey, .095, .029, m.gold, .074, 0, 0), {type: 'wind'});
  const windHit = box(windKey, .55, .36, .1, new THREE.MeshBasicMaterial({visible: false}), 0, 0, .08); markPick(windHit, {type: 'wind'});
  // Paper plinth and concentric inlay give the object a place in the world.
  const plinth = mesh(new THREE.CylinderGeometry(2.45, 2.55, .15, 64), m.edge, root, 0, -2.58, 0);
  const inlay = ring(root, 2.4, .022, m.brass, 0, -2.5, 0); inlay.rotation.x = -Math.PI / 2;
  const setPose = ({angles = [0, 0, 0], door = 0, bolt = 0, pull = 0, wing = .4, key = 0, rise = 0} = {}) => {
    dials.forEach((o, i) => { o.rotation.z = -angles[i] * STEP; });
    handle.rotation.z = -bolt * Math.PI / 2;
    bolts.forEach(o => { o.position.x = 3.27 - bolt * .38; });
    hinge.rotation.y = -door * 1.91;
    drawer.position.z = -.12 + pull * 1.18;
    butterfly.position.y = .32 + rise * .65;
    butterfly.rotation.x = -.12 * rise;
    wings[0].rotation.y = -wing; wings[1].rotation.y = wing;
    windKey.rotation.z = key;
  };
  setPose();
  return {root, pickables, dials, assembly, hinge, drawer, butterfly, windKey, plinth, door, body, sockets, setPose};
}

export function disposeVault(root) {
  const geometries = new Set(), materials = new Set();
  root.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}

export class VaultView {
  constructor(host, {fail = () => {}, motionDone = () => {}, reduced = false} = {}) {
    this.host = host; this.fail = fail; this.motionDone = motionDone; this.reduced = reduced;
    this.scene = new THREE.Scene(); this.scene.add(new THREE.HemisphereLight(0xfff0ce, 0x1c342c, 2.4));
    const keyLight = new THREE.DirectionalLight(0xffe1a9, 3); keyLight.position.set(-3, 6, 7); this.scene.add(keyLight);
    const fill = new THREE.DirectionalLight(0x81bbb6, 1.2); fill.position.set(4, 1, 2); this.scene.add(fill);
    this.object = buildVault(); this.scene.add(this.object.root);
    this.camera = new THREE.OrthographicCamera(-3.5, 3.5, 3.5, -3.5, .1, 40);
    this.camera.position.set(.9, .8, 10); this.camera.lookAt(0, .05, 0);
    this.targets = {angles: [0, 0, 0], door: 0, bolt: 0, pull: 0, rise: 0};
    this.values = {...this.targets, angles: [0, 0, 0]};
    this.velocities = {angles: [0, 0, 0], door: 0, bolt: 0, pull: 0, rise: 0};
    this.energy = 0; this.wingTime = 0; this.keyTurn = 0; this.dead = false; this.opening = false;
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2();
    try {
      this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'low-power'});
      this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.5));
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.2;
      this.renderer.domElement.setAttribute('aria-hidden', 'true'); host.append(this.renderer.domElement);
    } catch (error) { this.destroy(); throw error; }
    this.abort = new AbortController();
    this.renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); this.destroy(); this.fail('Graphics were interrupted. Reload to reopen this separate experiment.'); }, {signal: this.abort.signal});
    document.addEventListener('visibilitychange', () => {
      this.lastTime = 0;
      if (document.hidden) { cancelAnimationFrame(this.frame); this.frame = 0; this.winding = false; }
      else this.wake();
    }, {signal: this.abort.signal});
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host); this.resize();
  }
  resize() {
    if (this.dead) return;
    this.width = Math.max(1, this.host.clientWidth); this.height = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(this.width, this.height); this.wake();
  }
  setPositions(positions, instant = false) {
    this.targets.angles = [...positions];
    if (instant) { this.values.angles = [...positions]; this.velocities.angles.fill(0); }
    this.wake();
  }
  reset(positions) {
    this.opening = false; this.reported = false; this.energy = 0; this.winding = false;
    for (const prop of ['door', 'bolt', 'pull', 'rise']) this.targets[prop] = this.values[prop] = this.velocities[prop] = 0;
    this.setPositions(positions, true);
  }
  open() { this.opening = true; this.reported = false; this.targets.bolt = 1; this.wake(); }
  pull(amount) { this.targets.pull = clamp(amount, 0, 1); this.wake(); }
  reveal() { this.targets.pull = 1; this.targets.rise = 1; this.wake(); }
  wind(active) { this.winding = active; this.wake(); }
  pick(x, y) {
    if (this.dead) return null;
    const rect = this.host.getBoundingClientRect();
    this.pointer.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2);
    this.scene.updateMatrixWorld(true); this.camera.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(this.object.pickables, false)[0]?.object.userData.control || null;
  }
  dialPoint(x, y) {
    const rect = this.host.getBoundingClientRect();
    this.pointer.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2);
    this.scene.updateMatrixWorld(true); this.camera.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const origin = this.object.assembly.getWorldPosition(new THREE.Vector3());
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(this.object.assembly.getWorldQuaternion(new THREE.Quaternion()));
    const point = this.raycaster.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(normal, origin), new THREE.Vector3());
    if (!point) return null;
    const local = this.object.assembly.worldToLocal(point);
    return Math.atan2(local.x, local.y); // positive clockwise, zero at twelve o'clock
  }
  wake() {
    if (this.dead || this.frame || document.hidden) return;
    this.frame = requestAnimationFrame(t => this.tick(t));
  }
  tick(time) {
    this.frame = 0; if (this.dead || document.hidden) return;
    const dt = this.lastTime ? Math.min(.05, (time - this.lastTime) / 1000) : 1 / 60; this.lastTime = time;
    let moving = false;
    const update = (value, velocity, target) => {
      const next = this.reduced ? [target, 0] : spring(value, velocity, target, dt);
      if (next[0] !== target || next[1] !== 0) moving = true; return next;
    };
    for (let i = 0; i < 3; i++) [this.values.angles[i], this.velocities.angles[i]] = update(this.values.angles[i], this.velocities.angles[i], this.targets.angles[i]);
    for (const prop of ['bolt', 'door', 'pull', 'rise']) [this.values[prop], this.velocities[prop]] = update(this.values[prop], this.velocities[prop], this.targets[prop]);
    if (this.opening && this.values.bolt > .97) { this.targets.door = 1; if (this.values.door !== 1) moving = true; }
    if (this.opening && this.values.door > .99 && !this.reported) { this.reported = true; this.motionDone('door'); }
    if (this.winding) { this.energy = Math.min(5, this.energy + dt * 2.6); this.keyTurn -= dt * 9; moving = true; }
    else this.energy = Math.max(0, this.energy - dt);
    if (this.energy > 0 && !this.reduced) { this.wingTime += dt * (5 + this.energy * 1.3); moving = true; }
    const wing = .35 + (this.reduced ? 0 : Math.sin(this.wingTime) * .58 * Math.min(1, this.energy));
    this.object.setPose({...this.values, wing, key: this.keyTurn});
    // A short camera rail reveals the interior. It does not create another room or renderer.
    const opened = this.values.door;
    const aspect = this.width / this.height, vertical = Math.max(6.9 + opened * 1.3, (5.95 + opened * 1.7) / aspect);
    this.camera.left = -vertical * aspect / 2; this.camera.right = vertical * aspect / 2;
    this.camera.top = vertical / 2; this.camera.bottom = -vertical / 2;
    this.camera.position.set(.9 + opened * 2.5, .8 + opened * 2.3, 10);
    this.camera.lookAt(-opened * .12, .05, opened * .5); this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    if (moving) this.wake(); else this.lastTime = 0;
  }
  destroy() {
    if (this.dead) return;
    this.dead = true; cancelAnimationFrame(this.frame); this.frame = 0;
    this.abort?.abort(); this.observer?.disconnect(); disposeVault(this.object.root);
    if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove(); }
  }
}
