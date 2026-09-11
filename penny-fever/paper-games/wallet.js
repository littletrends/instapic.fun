/* Same-origin alley iframe talks to the live pocket. Workshop play stays free. */
const inPage = typeof window !== 'undefined';
const params = inPage ? new URLSearchParams(window.location.search) : new URLSearchParams();
export const alleyPlay = inPage && window.parent !== window && params.get('room') === 'alley';

function fever() {
  if (!alleyPlay) return null;
  try { return window.parent.PennyFever || null; } catch { return null; }
}

export function owned(id) {
  if (!id) return false;
  try { return !!fever()?.getState?.()?.paperInventory?.items?.[id]; } catch { return false; }
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

export function keep(id, stall = 'coin-pusher') {
  if (!alleyPlay || !id) return false;
  try {
    const PF = fever();
    const model = window.parent.PennyFeverInventoryModel;
    if (PF?.getState && model?.recordPaperPrize) {
      const earned = model.recordPaperPrize(PF.getState(), {item: id, stall});
      if (earned.length) {
        PF.saveState?.();
        window.parent.dispatchEvent(new CustomEvent('pennyfever:inventoryaward', {detail: {ids: earned}}));
        return true;
      }
    }
    window.parent.postMessage({channel: 'pf-paper-world', type: 'prize', item: id, stall}, location.origin);
    return true;
  } catch {
    return false;
  }
}

const MACHINE_KEY = 'pennyFever.cashDrop';

function readLocal() {
  if (typeof localStorage === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(MACHINE_KEY) || 'null'); } catch { return null; }
}

function validTable(blob) {
  return blob && Array.isArray(blob.pieces) && blob.pieces.length > 0;
}

function tableFromStore(store, chapter) {
  if (!store) return null;
  const key = String(chapter);
  if (store.v === 4 && store.tables && validTable(store.tables[key])) return store.tables[key];
  if (store.v < 4 && Number(chapter) === 0 && validTable(store)) return store;
  return null;
}

export function loadMachine(chapter = 0) {
  const a = tableFromStore(fever()?.getState?.()?.cashDrop, chapter);
  const b = tableFromStore(readLocal(), chapter);
  if (a && b) return (Number(a.dropped) || 0) >= (Number(b.dropped) || 0) ? a : b;
  return a || b;
}

export function saveMachine(blob, chapter = 0) {
  if (!blob) return;
  const key = String(chapter);
  const prev = fever()?.getState?.()?.cashDrop;
  const local = readLocal();
  const base = (prev && prev.v === 4 && prev.tables) ? prev : (local && local.v === 4 && local.tables) ? local : {v: 4, tables: {}};
  const store = {v: 4, tables: {...(base.tables || {})}};
  store.tables[key] = blob;
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(MACHINE_KEY, JSON.stringify(store)); } catch { /* quota */ }
  const api = fever();
  const state = api?.getState?.();
  if (!state) return;
  state.cashDrop = store;
  api.saveState?.();
}
