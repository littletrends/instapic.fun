/* Same-origin alley iframe talks to the live pocket. Workshop play stays free. */
const inPage = typeof window !== 'undefined';
const params = inPage ? new URLSearchParams(window.location.search) : new URLSearchParams();
export const alleyPlay = inPage && window.parent !== window && params.get('room') === 'alley';

function fever() {
  if (!alleyPlay) return null;
  try { return window.parent.PennyFever || null; } catch { return null; }
}

export function pocket() {
  if (!alleyPlay) return null;
  const n = Number(fever()?.getState?.()?.demoCoins);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function spend(amount = 1) {
  if (!alleyPlay) return true;
  const api = fever();
  if (!api?.spendPennies) return false;
  return !!api.spendPennies(amount);
}

export function credit(amount) {
  if (!alleyPlay) return 0;
  const api = fever();
  if (!api?.addDemoCoins) return 0;
  return api.addDemoCoins(amount) || 0;
}

export function keep(id) {
  if (!alleyPlay || !id) return;
  try {
    window.parent.postMessage({channel: 'pf-paper-world', type: 'prize', item: id, stall: 'coin-pusher'}, location.origin);
  } catch { /* workshop or cross-origin */ }
}

export function loadMachine() {
  if (!alleyPlay) return null;
  const blob = fever()?.getState?.()?.cashDrop;
  return blob && blob.v >= 1 && blob.v <= 3 && Array.isArray(blob.pieces) ? blob : null;
}

export function saveMachine(blob) {
  if (!alleyPlay || !blob) return;
  const api = fever();
  const state = api?.getState?.();
  if (!state) return;
  state.cashDrop = blob;
  api.saveState?.();
}
