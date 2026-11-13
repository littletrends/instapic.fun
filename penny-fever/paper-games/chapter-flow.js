// Translate the existing engine outcomes into the shared chapter panel.
// This module never awards a prize or changes an engine's saved state.
export function chapterOutcome(id, state, dismissed = false) {
  if (!state) return null;
  if (state.result) return {...state.result, handled: ['milk-bottles', 'pinball'].includes(id)};
  if (dismissed) return null;
  if (id === 'fortune' && state.phase === 'result') {
    return {title: state.caught ? 'The fortune is read' : 'The signs slipped',
      detail: [state.fortune, state.note].filter(Boolean).join(' '),
      won: !!state.caught, prize: null, handled: true};
  }
  // A bumper hit or tray lip is a carry, not a sitting end. Pip commits on drain;
  // Copper keeps when the treasure has gone over the lip and play continues.
  return null;
}
