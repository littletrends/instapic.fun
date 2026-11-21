const JUMP_SECONDS = 0.56;
const BRAKE_FACTOR = 0.32;
const courses = [
  {speed: 0.125, time: 24, gates: [[0.74, 'jump'], [0.34, 'jump']]},
  {speed: 0.145, time: 21, gates: [[0.83, 'brake'], [0.55, 'jump'], [0.23, 'jump']]},
  {speed: 0.155, time: 19, gates: [[0.86, 'jump'], [0.64, 'brake'], [0.45, 'jump'], [0.19, 'brake']]},
  {speed: 0.17, time: 17, gates: [[0.88, 'jump'], [0.71, 'brake'], [0.47, 'jump'], [0.40, 'jump'], [0.17, 'brake']]},
  {speed: 0.183, time: 15, gates: [[0.90, 'brake'], [0.74, 'jump'], [0.56, 'brake'], [0.46, 'jump'], [0.29, 'brake'], [0.12, 'jump']]},
  {speed: 0.195, time: 13.5, gates: [[0.92, 'jump'], [0.78, 'brake'], [0.61, 'jump'], [0.54, 'jump'], [0.37, 'brake'], [0.26, 'jump'], [0.11, 'brake']]},
];

export const descentCourse = level => courses[level];

export function makeDescent(level) {
  return {
    active: false, u: 1, remaining: courses[level].time,
    gateIndex: 0, braking: false, jumpAge: null, bumps: 0,
    note: 'Keepsake aboard. Ride the mat to the bottom exit.',
  };
}

export function matLift(run) {
  return run.jumpAge === null ? 0 : Math.sin(Math.PI * run.jumpAge / JUMP_SECONDS) * 65;
}

export function controlDescent(run, input) {
  if (!run.active) {
    if (input !== 'jump') return false;
    run.active = true;
    run.note = 'Red bars: jump. Blue bends: brake, then coast again.';
    return true;
  }
  if (input === 'left') run.braking = !run.braking;
  else if (input === 'right') run.braking = false;
  else if (input === 'jump') {
    if (run.jumpAge !== null) return false;
    run.jumpAge = 0;
  } else return false;
  return true;
}

export function advanceDescent(run, level, dt) {
  if (!run.active || dt <= 0) return null;
  const course = courses[level];
  const start = run.u;
  const speed = course.speed * (run.braking ? BRAKE_FACTOR : 1);
  run.remaining = Math.max(0, run.remaining - dt);
  run.u = Math.max(0, run.u - speed * dt);
  const [gateU, kind] = course.gates[run.gateIndex] || [];
  if (start > gateU && run.u <= gateU) {
    const crossTime = (start - gateU) / speed;
    const age = run.jumpAge === null ? null : run.jumpAge + crossTime;
    const lift = age !== null && age < JUMP_SECONDS ? matLift({jumpAge: age}) : 0;
    const cleared = kind === 'jump' ? lift >= 22 : run.braking && lift < 22;
    if (cleared) {
      run.gateIndex++;
      run.note = run.gateIndex === course.gates.length ? 'Clear track. Coast out through the bottom exit.' : 'Gate clear.';
    } else {
      run.u = Math.min(1, gateU + 0.042);
      run.jumpAge = null;
      run.braking = true;
      run.bumps++;
      run.remaining = Math.max(0, run.remaining - 0.6);
      run.note = kind === 'jump' ? 'Bumped the bar. Jump as the mat reaches it.' : 'Wide on the bend. Brake and keep the mat down.';
    }
  }
  if (run.jumpAge !== null) {
    run.jumpAge += dt;
    if (run.jumpAge >= JUMP_SECONDS) run.jumpAge = null;
  }
  if (run.remaining <= 0) return 'timeout';
  if (run.u === 0 && run.gateIndex === course.gates.length) return 'exit';
  return null;
}
