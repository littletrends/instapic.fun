import * as heist from './curios-heist-model.js?v=heist-six-2';
import * as claw from './curios-claw-model.js?v=claw-six-1';
import {base, clamp, copy, validate} from './study-state.js?v=studies-six-1';

export const LEVELS = heist.LEVELS;
export const rules = state => LEVELS[state.level];
const KIND = 'cabinet-heist';
const TURN_STATES = ['aim', 'braking', 'pickup', 'return', 'release', 'park'];
const ALIGN = 'Move right to aim. Click, tap Drop or press Space.';

function setTurn(state, turn) {
  state.turn = turn;
  state.phase = turn === 'aim' ? 'play' : 'moving';
}

function parkClaw(machine) {
  machine.gantry.target = claw.CHUTE.x;
  machine.slow = true;
}

function newClaw(level) {
  const machine = claw.makeState(level);
  machine.gantry.x = claw.CHUTE.x;
  parkClaw(machine);
  return machine;
}

export function makeState(level = 0) {
  return {
    ...base(KIND, 'Find the keys and open the cabinet to reach the claw.', level),
    screen: 'heist',
    heist: heist.makeState(level),
    claw: null,
    turn: 'aim',
  };
}

export function snapshot(state) {
  const {heist: route, claw: machine, saveError, movePointer, dropPointer, dropHeld, ...rest} = state;
  return {
    ...copy(rest),
    heist: heist.snapshot(route),
    claw: machine ? claw.snapshot(machine) : null,
  };
}

export function restore(saved, level = saved?.level) {
  const invalid = validate(saved, KIND);
  if (saved.v !== 2 || saved.level !== level || !LEVELS[level] || !TURN_STATES.includes(saved.turn)) invalid();
  if (!['heist', 'claw'].includes(saved.screen) || (saved.screen === 'claw') !== Boolean(saved.claw)) invalid();
  const route = heist.restore(saved.heist, level);
  const machine = saved.claw ? claw.restore(saved.claw, level) : null;
  if (machine && route.phase !== 'celebrate') invalid();
  if ((saved.phase === 'celebrate' || saved.result?.won) && (!machine || !claw.goal(machine))) invalid();
  return snapshot({...saved, heist: route, claw: machine});
}

export function canAim(state) {
  return state.screen === 'claw' && state.turn === 'aim' && state.phase === 'play' && !state.result && !state.saveError;
}

export function moveRight(state, held) {
  if (!canAim(state)) return false;
  claw.hold(state.claw, 'right', held);
  return true;
}

export function aimRight(state, x) {
  if (!canAim(state) || !Number.isFinite(x)) return false;
  const machine = state.claw;
  const target = clamp(x, claw.CHUTE.x, 730);
  if (target <= Math.max(machine.gantry.x, machine.gantry.target)) return false;
  machine.slow = false;
  state.note = ALIGN;
  return claw.setTarget(machine, target);
}

export function drop(state) {
  if (!canAim(state) || !state.claw.left) return false;
  claw.clearInput(state.claw);
  state.note = 'The claw settles over your aim.';
  state.moves++;
  setTurn(state, 'braking');
  return true;
}

export function releaseInput(state) {
  heist.cancel(state.heist);
  if (state.claw) claw.clearInput(state.claw);
  delete state.movePointer;
  delete state.dropPointer;
  delete state.dropHeld;
}

function stepHeist(state, dt) {
  const route = state.heist;
  heist.step(route, dt);
  if (route.phase === 'celebrate') {
    state.phase = 'moving';
    state.note = 'Cabinet unlocked. The claw is next.';
    if (route.celebrateLeft <= 0) {
      state.screen = 'claw';
      state.claw = newClaw(state.level);
      state.note = ALIGN;
      setTurn(state, 'aim');
    }
    return;
  }
  if (!route.started) return;
  route.houseLeft = Math.max(0, route.houseLeft - dt);
  state.note = route.note;
  if (route.houseLeft > 0) return;
  heist.stop(route);
  state.phase = 'result';
  state.result = {title: 'The cabinet rests', detail: 'Your keys, wound plates and safe dome are saved for your next try.', won: false, prize: null, settle: true};
}

function settled(machine, x) {
  return Math.abs(machine.gantry.x - x) < 1 && Math.abs(machine.gantry.vx) < 4 &&
    Math.abs(machine.theta) < .018 && Math.abs(machine.omega) < .04;
}

function stepClaw(state, dt) {
  const machine = state.claw;
  claw.step(machine, dt);
  if (machine.phase === 'celebrate') {
    state.phase = 'celebrate';
    state.note = 'Your capsule reached the basket. Chapter reward collected.';
    return;
  }
  if (machine.result) {
    state.phase = 'result';
    state.result = {...machine.result, detail: 'Try the claw again. Your cabinet is open, and the pile stays where it landed.'};
    return;
  }

  switch (state.turn) {
    case 'braking':
      if (settled(machine, machine.gantry.target) && claw.lower(machine)) {
        state.note = 'The claw lowers and grips.';
        setTurn(state, 'pickup');
      }
      break;
    case 'pickup':
      if (machine.stage === 'low') claw.close(machine);
      if (machine.stage === 'gripped') claw.lift(machine);
      if (machine.stage === 'carry' || machine.stage === 'aim') {
        machine.slow = true;
        state.note = machine.grip ? 'The claw carries the capsule to the chute.' : 'The claw returns for another try.';
        setTurn(state, 'return');
      }
      break;
    case 'return': {
      const target = clamp(claw.CHUTE.x - (machine.grip?.offset ?? 0), 170, 730);
      claw.setTarget(machine, target);
      if (!settled(machine, target)) break;
      if (machine.stage === 'carry') {
        claw.open(machine);
        state.note = 'The jaws open over the chute.';
        setTurn(state, 'release');
      } else {
        setTurn(state, 'park');
      }
      break;
    }
    case 'release':
      if (machine.stage === 'aim') setTurn(state, 'park');
      break;
    case 'park':
      parkClaw(machine);
      if (settled(machine, claw.CHUTE.x) && machine.objects.every(piece =>
        piece.mode === 'collected' || (piece.mode === 'loose' && piece.sleep))) {
        machine.jaws = 0;
        state.note = ALIGN;
        setTurn(state, 'aim');
      }
      break;
  }
  // The combined cabinet has two controls. The underlying manual practice keeps its own Undo history.
  machine.history.length = 0;
}

export function step(state, dt) {
  if (!Number.isFinite(dt) || dt <= 0 || state.result || state.saveError || state.phase === 'celebrate') return;
  state.t += dt;
  if (state.screen === 'heist') stepHeist(state, dt);
  else stepClaw(state, dt);
}

export function retry(state) {
  if (state.result?.won) return makeState(state.level);
  const next = snapshot(state);
  next.result = null;
  setTurn(next, 'aim');
  if (next.claw) {
    next.claw = claw.retryState(next.claw);
    parkClaw(next.claw);
    setTurn(next, 'park');
    next.note = 'The claw returns for another try.';
  } else {
    next.heist.houseLeft = 100;
  }
  return next;
}
