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
  if (id === 'coin-pusher' && state.tray?.treasureOwned && !state.busy && state.phase === 'idle') {
    return {title: 'Treasure collected', detail: 'Your tray is saved. Visit the next chapter or keep playing here.',
      won: true, prize: null, handled: true};
  }
  if (id === 'pinball' && state.prizeKept) {
    return {title: 'Bonus collected', detail: 'Your ball and unused plays are saved. Visit the next table or keep playing here.',
      won: true, prize: null, handled: true};
  }
  return null;
}
