// Run the existing engines with the shared runtime's chapter/prize lifecycle.
// Both the browser prediction and private verifier use this same driver.
import {bindPrize, takePrize, stepPrize} from './chapter-kit.js?v=align-1';
import {chapterOutcome} from './chapter-flow.js?v=pf-polish-1';
import {seeded} from './draw.js?v=sep17-4';
import {keep} from './wallet.js?v=insights-1';
import {cloneBoard} from './milky-splash.js?v=prize-drop-1';
import {captureSplash,restoreSplash} from './milky-splash-art.js?v=milk-clean-1';

const OWN_RECEIPTS = new Set(['fortune', 'coin-pusher', 'pinball', 'milk-bottles']);
const HOUSE_FALLBACK = {
  love: {seconds: 180, title: 'The tester slept', detail: 'Rosalie blots the page. Another sitting when you are ready.'},
  lookup: {seconds: 100, title: 'The sky went quiet', detail: 'Celeste covers the lantern. Another sitting when you are ready.'},
};
const HOUSE_DEFAULT = {seconds: 45, title: 'The house closes', detail: 'This go is over. Try the chapter again.'};

export function createVerifiedDriver({engine, game, chapter, seed, startedAt = 0, snapshot = null}) {
  let rng = snapshot?.rng ?? (parseInt(seed.slice(0, 8), 16) >>> 0);
  let elapsed = snapshot?.elapsed || 0;
  let state, completion = snapshot?.completion || null, dismissed = snapshot?.dismissed ?? false;
  const saved = snapshot?.input || {};
  const input = {keys: new Set(saved.keys || []), actions: new Set(saved.actions || []),
    down: !!saved.down, pointer: saved.pointer || null};
  const random = () => {rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0; return rng / 4294967296;};
  function invoke(fn) {
    // Synchronous engine calls only. Rendering/audio elsewhere keep the normal
    // browser clock; gameplay random state survives pause and batch boundaries.
    const previousRandom = Math.random, previousNow = Date.now;
    Math.random = random;
    Date.now = () => startedAt + elapsed * 1000;
    try {return fn();} finally {Math.random = previousRandom; Date.now = previousNow;}
  }
  const house = engine.houseSeconds === 0 ? null : engine.houseSeconds
    ? {seconds: engine.houseSeconds, title: engine.houseTitle || HOUSE_DEFAULT.title,
      detail: engine.houseDetail || HOUSE_DEFAULT.detail}
    : HOUSE_FALLBACK[game] || HOUSE_DEFAULT;
  function plant() {
    bindPrize(state, engine.prizes?.[chapter], {field: true});
    if (house && state.houseLeft == null) state.houseLeft = house.seconds;
  }
  invoke(() => {
    state = snapshot?.state || engine.create(chapter, seeded(1703 + chapter * 297));
    if (game === 'milk-bottles' && snapshot && state.board) {
      // Rebind the board's existing RNG closure, retaining its exact cells and
      // RNG state. Calling engine.create() would repair/rearrange the board.
      state.board = cloneBoard(state.board);
      restoreSplash(state,snapshot.milkSplash);
    }
    plant();
  });
  const keySet = values => {
    if (!Array.isArray(values) || values.length > 24 || values.some(k => typeof k !== 'string' || k.length > 20)) throw Error('invalid_keys');
    return new Set(values);
  };
  const validAction = id => (engine.actions || []).some(action => action.id === id);
  function execute(event) {
    return invoke(() => {
      if (!event || typeof event !== 'object') throw Error('invalid_event');
      if (event.type === 'release') {
        input.keys.clear(); input.actions.clear(); input.down = false;
        engine.pointer?.(state, 'cancel', input.pointer || {x: 450, y: 1050}, input);
        input.pointer = null;
        return;
      }
      if (event.type === 'retry') {
        // The existing Help panel also offers an explicit restart mid-round.
        // Let each engine retain its own retry/debit rules for that action.
        completion = null;
        dismissed = ['coin-pusher', 'pinball'].includes(game);
        if (game === 'fortune') engine.action(state, 'gaze');
        else if (engine.retryAttempt) {
          engine.retryAttempt(state);
          state = engine.create(chapter, seeded(1703 + chapter * 297));
          dismissed = false;
        } else if (!['coin-pusher', 'pinball'].includes(game)) {
          state = engine.create(chapter, seeded(1703 + chapter * 297));
          dismissed = false;
        }
        plant();
        return;
      }
      // Result-panel animation may tick, but further game inputs wait for the
      // existing Play again action. Never turn a key into a hidden paid retry.
      if (completion && event.type !== 'tick') throw Error('attempt_finished');
      if (event.type === 'tick') {
        if (!Number.isFinite(event.dt) || event.dt <= 0 || event.dt > .05) throw Error('invalid_tick');
        input.keys = keySet(event.keys || []); input.actions = keySet(event.actions || []);
        if ([...input.actions].some(id => !validAction(id))) throw Error('invalid_action');
        elapsed += event.dt;
        if (!completion) engine.update?.(state, event.dt, input);
        if (!completion && house && !state.result && (engine.clockRuns?.(state) ?? true)) {
          state.houseLeft = Math.max(0, state.houseLeft - event.dt);
          if (!state.houseLeft) {
            if (engine.onTimeout) engine.onTimeout(state);
            else state.result = {title: house.title, detail: house.detail, won: false};
          }
        }
        const outcome = completion || chapterOutcome(game, state, dismissed);
        if (outcome && !completion) {
          completion = {...outcome};
          if (!outcome.handled && !outcome.settle && outcome.won !== false && !state.practice) {
            completion.prize = Object.hasOwn(outcome, 'prize') ? outcome.prize : engine.prizes?.[chapter];
            if (completion.prize) takePrize(state, completion.prize);
          }
        }
        stepPrize(state, event.dt);
        if (state.prizeDeliver) {
          state.prizeDeliver = false;
          if (!OWN_RECEIPTS.has(game) && !completion?.handled && !state.practice && !state.prizePosted) {
            state.prizePosted = true;
            keep(state.chapterPrize?.id || engine.prizes?.[chapter], game);
          }
        }
      } else if (event.type === 'pointer') {
        const p = event.point;
        if (!['down', 'move', 'up', 'cancel'].includes(event.phase) || !p || !Number.isFinite(p.x) || !Number.isFinite(p.y)
            || p.x < 0 || p.x > 900 || p.y < 0 || p.y > 1200) throw Error('invalid_pointer');
        input.pointer = {x: p.x, y: p.y};
        if (event.phase === 'down') input.down = true;
        if (['up', 'cancel'].includes(event.phase)) input.down = false;
        engine.pointer?.(state, event.phase, input.pointer, input);
      } else if (event.type === 'key') {
        if (typeof event.key !== 'string' || event.key.length > 20) throw Error('invalid_key');
        if (event.down !== false) input.keys.add(event.key);
        else {
          input.keys.delete(event.key);
          if (event.key.length === 1) {input.keys.delete(event.key.toLowerCase()); input.keys.delete(event.key.toUpperCase());}
        }
        engine.key?.(state, event.key, event.down !== false, input);
      } else if (event.type === 'action') {
        if (!validAction(event.id)) throw Error('invalid_action');
        engine.action?.(state, event.id, event.down !== false, input);
      } else throw Error('invalid_event');
    });
  }
  return {
    execute,
    persist: () => invoke(() => engine.persist?.(state)),
    get state() {return state;}, get input() {return input;}, get completion() {return completion;},
    get finished() {return !!completion && !['pop', 'spin', 'fly'].includes(state.chapterPrize?.phase);},
    snapshot: () => ({state, rng, elapsed, completion, dismissed,
      ...(game === 'milk-bottles' ? {milkSplash:captureSplash(state)} : {}),
      input: {keys: [...input.keys], actions: [...input.actions], down: input.down, pointer: input.pointer}}),
  };
}
