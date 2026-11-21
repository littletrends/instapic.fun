// Select the approved engine while retaining a saved round's original rules.
export const PAPER_EDITION = 'paper33-v1';

export function withReleasedEngine(engine, {game, module, legacy = null}) {
  const released = Object.defineProperties({}, Object.getOwnPropertyDescriptors(engine));
  released.releaseEdition = PAPER_EDITION;
  released.releaseModule = module;
  released.releaseGame = game;
  released.legacyEngine = legacy;
  const create = engine.create.bind(engine);
  released.create = (...args) => {
    const state = create(...args);
    state.gameEdition = PAPER_EDITION;
    return state;
  };
  if (engine.retryAttempt) released.retryAttempt = (...args) => {
    const next = engine.retryAttempt(...args);
    if (next) next.gameEdition = PAPER_EDITION;
    return next;
  };
  released.forSnapshot = snapshot => {
    if (!snapshot || snapshot.edition === PAPER_EDITION) return released;
    if (snapshot.edition == null && legacy) return legacy;
    throw Error('saved_engine_edition_unavailable');
  };
  // A restored original round uses its original renderer as well as its rules.
  if (legacy) {
    released.images = {...legacy.images, ...engine.images};
    released.sprites = [...new Set([...(legacy.sprites || []), ...(engine.sprites || [])])];
    for (const name of ['draw', 'readout', 'prizeClock', 'secondsNote', 'winningSeconds']) {
      if (!engine[name] && !legacy[name]) continue;
      released[name] = (state, ...args) => {
        const selected = state?.gameEdition === PAPER_EDITION ? engine : legacy;
        return selected[name]?.call(selected, state, ...args);
      };
    }
  }
  return released;
}
