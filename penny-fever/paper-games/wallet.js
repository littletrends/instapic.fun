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
  if (!alleyPlay || !id) return false;
  try {
    const PF = fever();
    const model = window.parent.PennyFeverInventoryModel;
    if (PF?.getState && model?.recordPaperPrize) {
      const earned = model.recordPaperPrize(PF.getState(), {item: id, stall: 'coin-pusher'});
      if (earned.length) {
        PF.saveState?.();
        window.parent.dispatchEvent(new CustomEvent('pennyfever:inventoryaward', {detail: {ids: earned}}));
        return true;
      }
    }
    window.parent.postMessage({channel: 'pf-paper-world', type: 'prize', item: id, stall: 'coin-pusher'}, location.origin);
    return true;
  } catch {
    return false;
  }
}

const MACHINE_KEY = 'pennyFever.cashDrop';

function readLocal() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const blob = JSON.parse(localStorage.getItem(MACHINE_KEY) || 'null');
    return blob && Array.isArray(blob.pieces) ? blob : null;
  } catch { return null; }
}

function validMachine(blob) {
  return blob && blob.v >= 1 && blob.v <= 3 && Array.isArray(blob.pieces) && blob.pieces.length > 0;
}

export function loadMachine() {
  const parent = fever()?.getState?.()?.cashDrop;
  const local = readLocal();
  const a = validMachine(parent) ? parent : null;
  const b = validMachine(local) ? local : null;
  if (a && b) return (Number(a.dropped) || 0) >= (Number(b.dropped) || 0) ? a : b;
  return a || b;
}

export function saveMachine(blob) {
  if (!blob) return;
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(MACHINE_KEY, JSON.stringify(blob)); } catch { /* quota */ }
  const api = fever();
  const state = api?.getState?.();
  if (!state) return;
  state.cashDrop = blob;
  api.saveState?.();
}
