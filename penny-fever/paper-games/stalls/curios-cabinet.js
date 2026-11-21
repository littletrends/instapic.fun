import * as model from './curios-cabinet-model.js?v=cabinet-heist-1';
import * as heist from './curios-heist-model.js?v=heist-six-2';
import {aimHeist, drawHeist, heistArtReady} from './curios-heist.js?v=heist-six-2';
import {drawClaw, loadClawArt} from './curios-claw.js?v=claw-six-1';
import {footer, paper, study, text} from './study-kit.js?v=studies-six-1';
import {withChapterExample} from './chapter-example.js?v=example-1';

const moveButton = {x: 285, y: 1039, width: 332, height: 64};
const dropButton = {x: 615, y: 1039, width: 312, height: 64};
const inButton = (point, box) => Math.abs(point.x - box.x) <= box.width / 2 && Math.abs(point.y - box.y) <= box.height / 2;
const overCabinet = point => point.x >= 112 && point.x <= 788 && point.y >= 325 && point.y <= 820;

function paintButton(context, box, label, enabled, pressed = false) {
  paper(context, box.x, box.y, box.width, box.height, enabled ? (pressed ? '#e2bf77' : '#fff1d9') : '#b9b29e', '#af8652', 12);
  text(context, label, box.x, box.y, 27, enabled ? '#513d2d' : '#4d4c42');
}

function draw(state, drawing) {
  const context = drawing.c;
  if (state.screen === 'heist') {
    drawHeist(state.heist, drawing);
    paper(context, 230, 42, 320, 52, '#17382ef2', '#d1b47a', 12);
    text(context, `1/2 · BEETLE · ${Math.ceil(state.heist.houseLeft)}s`, 230, 42, 24, '#fff0cd');
    if (state.heist.phase === 'celebrate') {
      paper(context, 450, 600, 605, 107, '#17382ef7', '#e2c582');
      text(context, 'CABINET UNLOCKED', 450, 585, 36, '#fff0cd');
      text(context, 'Next: use the claw to win the prize.', 450, 626, 25, '#f0dfb7');
    }
    return;
  }

  drawClaw(state.claw, drawing, {
    title: 'DIGBY’S PRIZE CLAW',
    detail: `Chapter ${state.level + 1} · Screen 2 of 2`,
    aimHint: 'AIM ACROSS THE GLASS',
    controls() {
      const enabled = model.canAim(state);
      paintButton(context, moveButton, 'HOLD RIGHT →', enabled, state.claw.held?.right);
      const cycle = {braking: 'SETTLING…', return: 'RETURNING…', release: 'RELEASING…', park: 'WAIT FOR CHUTE'};
      const pickup = {lower: 'LOWERING…', closing: 'GRIPPING…', lift: 'LIFTING…'};
      const label = enabled ? 'DROP' : pickup[state.claw.stage] ?? cycle[state.turn] ?? 'CYCLE RUNNING';
      paintButton(context, dropButton, label, enabled);
      footer(context, state, true);
    },
  });
}

const instructions = 'Guide the beetle with a tap, drag or arrow key. Hide beneath glass when the watchlights sweep past. Find the winding keys, wind any plates, then reach the lock. At the claw, move the mouse across the glass, drag on touch, or hold Right Arrow to aim. Click the glass, tap Drop, or press Space once. The claw lowers, grips, returns to the chute and opens by itself. Deliver every marked capsule to collect the chapter reward.';
const engine = study({
  id: 'curios',
  mode: 'cabinet-heist',
  title: 'Digby’s Cabinet Heist',
  model,
  draw,
  intro: 'Hide under glass, unlock the cabinet, then use the claw to collect your chapter reward.',
  instructions,
  keys: 'Beetle: tap, drag or arrows · Space stops. Claw: mouse, drag or → aims · click, Drop or Space.',
});

const save = engine.persist;
engine.persist = state => {
  try { return save(state); }
  catch (error) { model.releaseInput(state); throw error; }
};
function checkpoint(state) {
  try { engine.persist(state); }
  catch { /* The existing save guard pauses play and preserves the state in memory. */ }
}

const update = engine.update;
engine.update = (state, dt) => {
  update(state, dt);
  if (state.saveError) model.releaseInput(state);
};
engine.releaseInput = model.releaseInput;
engine.retryAttempt = state => checkpoint(model.retry(state));
engine.artReady = heistArtReady;
engine.instructions = instructions;
engine.reviewCopy.keys = 'Beetle: tap, drag or arrows · Space stops. Claw: mouse, drag or → aims · click, Drop or Space. H for help.';
const create = engine.create;
engine.create = level => {
  loadClawArt();
  return create(level);
};

function heistPointer(state, type, point) {
  const route = state.heist;
  if (type === 'down' && point.y > 1110 && point.x > 620) {
    heist.stop(route);
    checkpoint(state);
    return;
  }
  const {left, right, top, bottom} = heist.FIELD;
  if (type === 'down' && point.y >= top && point.y <= bottom && point.x >= left - 20 && point.x <= right + 20) {
    if (aimHeist(route, point)) {
      route.held = true;
      state.moves++;
    }
  }
  if (type === 'move' && route.held) aimHeist(route, point);
  if (type === 'up') {
    route.held = false;
    checkpoint(state);
  }
}

engine.pointer = (state, type, point) => {
  if (type === 'cancel') {
    model.releaseInput(state);
    return;
  }
  if (state.result || state.saveError || state.phase === 'celebrate') return;
  if (state.screen === 'heist') {
    heistPointer(state, type, point);
    return;
  }

  const id = point.pointerId ?? 0;
  if (type === 'move' && overCabinet(point)) model.aimRight(state, point.x);
  if (type === 'down' && model.canAim(state) && !(point.button > 0)) {
    if (inButton(point, moveButton)) {
      state.movePointer = id;
      model.moveRight(state, true);
    } else if (inButton(point, dropButton)) {
      state.dropPointer = {id, button: true};
    } else if (overCabinet(point)) {
      model.aimRight(state, point.x);
      if (point.pointerType === 'mouse') state.dropPointer = {id, x: point.x, y: point.y};
    }
  }
  if (type !== 'up') return;
  if (state.movePointer === id) {
    delete state.movePointer;
    model.moveRight(state, false);
    checkpoint(state);
  }
  if (state.dropPointer?.id === id) {
    const start = state.dropPointer;
    delete state.dropPointer;
    const clicked = start.button ? inButton(point, dropButton) :
      overCabinet(point) && Math.hypot(start.x - point.x, start.y - point.y) < 25;
    if (clicked && model.drop(state)) checkpoint(state);
  }
};

engine.key = (state, key, down) => {
  if (state.result || state.saveError || state.phase === 'celebrate') return;
  if (state.screen === 'heist') {
    if (key === ' ' && down) heist.stop(state.heist);
    else if (heist.control(state.heist, key, down) && down) state.moves++;
    checkpoint(state);
    return;
  }
  if (key === 'ArrowRight' && model.moveRight(state, down) && !down) checkpoint(state);
  if (key !== ' ') return;
  if (!down) delete state.dropHeld;
  else if (!state.dropHeld && model.drop(state)) {
    state.dropHeld = true;
    checkpoint(state);
  }
};

const glass = heist.COVERS[3];
const openingExample = {
  captionY: 916,
  model: {
    makeState() {
      const route = heist.makeState(0);
      route.beetle = {...route.beetle, x: 640, y: 449};
      route.keys.fill(true);
      return route;
    },
    step: heist.step,
  },
  draw: drawHeist,
  steps: [
    {
      caption: 'With the keys already found, tap the glass dome to hide from the light.',
      point: {x: glass.x, y: glass.y - 42},
      run: route => heist.walkToCover(route, 3),
      done: route => !route.target && heist.coverAt(route.beetle, route) === 3,
      after: .8,
    },
    {
      caption: 'Leave the glass and reach the lock to open the prize cabinet.',
      point: heist.VAULT,
      run: route => heist.walkTo(route, heist.VAULT),
      done: route => route.phase === 'celebrate',
    },
  ],
  finishCaption: 'Cabinet unlocked. In Chapter 1, play the heist, then use the claw to earn the reward.',
  canStart: state => state.screen === 'heist' && state.heist.phase === 'play',
};

export default withChapterExample(engine, openingExample);
