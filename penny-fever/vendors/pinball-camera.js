// Pinball-only framing experiment. No gameplay, currency, input-to-flipper or save rules.
import * as THREE from '../world/lib/three.module.min.js';

export function boxCorners(bounds) {
  const points = [];
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) points.push(new THREE.Vector3(x, y, z));
  return points;
}

export function fitPinballCamera(bounds, {width, height, padding = {}, space = 1.18}) {
  width = Math.max(1, width); height = Math.max(1, height);
  const pad = {left: 16, right: 16, top: 90, bottom: 130, ...padding};
  const centre = bounds.getCenter(new THREE.Vector3());
  const points = boxCorners(bounds);
  const requestedSpace = Math.max(1, space);
  let effectiveSpace = requestedSpace;
  const direction = new THREE.Vector3(.1, .6, -1).normalize();
  // Existing tent: ceiling y=3.4, front wall z=-4.2. Stay on their inside faces.
  const maxDistance = Math.min((3.18 - centre.y) / direction.y, (centre.z + 3.98) / -direction.z);
  const camera = new THREE.PerspectiveCamera(48, width / height, .08, 60);
  const offset = {x: (pad.right - pad.left) / 2, y: (pad.bottom - pad.top) / 2};
  camera.setViewOffset(width, height, offset.x, offset.y, width, height);
  const limits = {left: -1 + 2 * pad.left / width, right: 1 - 2 * pad.right / width,
    bottom: -1 + 2 * pad.bottom / height, top: 1 - 2 * pad.top / height};
  function fits(distance, fov) {
    camera.position.copy(centre).addScaledVector(direction, distance); camera.lookAt(centre);
    camera.fov = fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    return points.every(p => {
      const n = p.clone().project(camera);
      const cx = (limits.left + limits.right) / 2, cy = (limits.bottom + limits.top) / 2;
      const rx = (limits.right - limits.left) / (2 * effectiveSpace), ry = (limits.top - limits.bottom) / (2 * effectiveSpace);
      return n.z > -1 && n.z < 1 && n.x >= cx - rx && n.x <= cx + rx && n.y >= cy - ry && n.y <= cy + ry;
    });
  }
  // Do not turn a request for more breathing room into an extreme fisheye lens.
  // If UI space is tight, stop at the furthest view possible inside this tent.
  if (!fits(maxDistance, 110)) {
    let lo = 1, hi = requestedSpace;
    for (let i = 0; i < 28; i++) {
      effectiveSpace = (lo + hi) / 2;
      if (fits(maxDistance, 110)) lo = effectiveSpace; else hi = effectiveSpace;
    }
    effectiveSpace = lo;
  }
  let distance = maxDistance, fov = 48;
  if (fits(maxDistance, fov)) {
    let lo = .6, hi = maxDistance;
    for (let i = 0; i < 28; i++) { const mid = (lo + hi) / 2; if (fits(mid, fov)) hi = mid; else lo = mid; }
    distance = hi;
  } else {
    // Widen the lens only once more distance would intersect the existing tent.
    let lo = fov, hi = 110;
    for (let i = 0; i < 28; i++) { const mid = (lo + hi) / 2; if (fits(distance, mid)) hi = mid; else lo = mid; }
    fov = hi;
  }
  const ok = fits(distance, fov);
  return {position: camera.position.clone(), look: centre, fov, offset, width, height, limits, fits: ok,
    effectiveSpace, limited: effectiveSpace < requestedSpace - .001};
}

export class PinballFraming {
  constructor(camera, cabinet, host) {
    this.camera = camera; this.host = host;
    // Capture before ball trails/sparks are added at their hidden parking coordinates.
    cabinet.updateWorldMatrix(true, true);
    this.bounds = new THREE.Box3().setFromObject(cabinet);
    this.step = 2; this.legacy = false; this.live = false; this.snap = true;
    this.abort = new AbortController(); this.controls = document.createElement('div');
    this.controls.className = 'pf-pin-camera';
    this.controls.setAttribute('role', 'group'); this.controls.setAttribute('aria-label', 'Pinball viewing distance');
    this.controls.innerHTML = `<span class="pf-pin-camera-label" role="status">Whole table</span>
      <button type="button" data-view="out" aria-label="Move the view further from the pinball table">− Further</button>
      <button type="button" data-view="reset">Wide view</button>
      <button type="button" data-view="in" aria-label="Move the view closer to the pinball table">+ Closer</button>
      <button type="button" data-view="compare" aria-pressed="false">Compare old</button>
      <details><summary>Help</summary><p>Hold to charge the spring; let go to plunge. Tap to flip. There is no left flipper: keep the ball on the right paddle. Lit toys clear chapters. Drain ends the current game.</p><p>Wide view keeps the whole machine visible. Closer stops at a whole-table view. Compare old switches only the camera, during the same game.</p></details>`;
    host.append(this.controls); host.classList.add('pf-pin-framing-test');
    for (const event of ['pointerdown', 'pointerup', 'pointercancel', 'keydown', 'keyup']) this.controls.addEventListener(event, e => e.stopPropagation(), {signal: this.abort.signal});
    this.controls.addEventListener('click', e => {
      e.stopPropagation();
      const action = e.target.closest('[data-view]')?.dataset.view;
      if (!action) return;
      if (action === 'compare') this.legacy = !this.legacy;
      else {
        this.legacy = false;
        this.step = action === 'reset' ? 2 : Math.max(0, Math.min(7, this.step + (action === 'out' ? 1 : -1)));
      }
      this.snap = true; this.refreshControls(); this.resize(this.width, this.height);
    }, {signal: this.abort.signal});
    this.refreshControls();
  }
  refreshControls() {
    this.controls.querySelector('.pf-pin-camera-label').textContent = this.legacy ? 'Old close camera' : this.pose?.limited ? 'Whole table · furthest safe view' : this.step === 0 ? 'Whole table · closest' : this.step === 2 ? 'Whole table · wide' : `Whole table · ${Math.round((1 + this.step * .09) * 100)}% space`;
    this.controls.querySelector('[data-view="compare"]').setAttribute('aria-pressed', String(this.legacy));
    this.controls.querySelector('[data-view="compare"]').textContent = this.legacy ? 'Return to wide' : 'Compare old';
    this.controls.querySelector('[data-view="in"]').disabled = !this.legacy && this.step === 0;
    this.controls.querySelector('[data-view="out"]').disabled = !this.legacy && (this.step === 7 || !!this.pose?.limited);
  }
  resize(width, height) {
    this.width = Math.max(2, width || this.host.clientWidth || 960);
    this.height = Math.max(2, height || this.host.clientHeight || 720);
    const rect = this.host.getBoundingClientRect();
    const header = this.host.querySelector('.pf-pin-header')?.getBoundingClientRect();
    const headerBottom = Math.max(48, (header?.bottom || rect.top + 55) - rect.top);
    this.host.style.setProperty('--pf-pin-head-bottom', `${headerBottom + 6}px`);
    const controls = this.controls.getBoundingClientRect();
    const controlBottom = Math.max(headerBottom + 48, controls.bottom - rect.top);
    this.host.style.setProperty('--pf-pin-controls-bottom', `${controlBottom + 4}px`);
    const score = this.host.querySelector('.pf-pin-playhud')?.getBoundingClientRect();
    const top = Math.min(this.height * .38, this.live && score?.height ? score.bottom - rect.top + 14 : controlBottom + 14);
    const bottom = this.live ? (this.height < 500 ? 80 : 110) : Math.min(this.height * .33, 220);
    this.pose = fitPinballCamera(this.bounds, {width: this.width, height: this.height,
      padding: {top, bottom, left: 18, right: 18}, space: 1 + this.step * .09});
    this.refreshControls();
    this.snap = true;
  }
  update(dt, mode) {
    const live = ['plunger', 'play', 'drain'].includes(mode);
    if (live !== this.live) { this.live = live; this.resize(this.width, this.height); }
    if (this.legacy) { this.camera.clearViewOffset(); return false; }
    if (!this.pose) this.resize(this.width, this.height);
    const p = this.pose, k = this.snap ? 1 : 1 - Math.exp(-9 * Math.max(0, dt));
    this.camera.position.lerp(p.position, k); this.camera.lookAt(p.look);
    this.camera.fov = p.fov; this.camera.aspect = p.width / p.height;
    this.camera.setViewOffset(p.width, p.height, p.offset.x, p.offset.y, p.width, p.height);
    this.camera.updateProjectionMatrix(); this.snap = false;
    return true;
  }
  destroy() { this.abort.abort(); this.controls.remove(); this.host.classList.remove('pf-pin-framing-test'); }
}
