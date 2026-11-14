// A private-to-the-round prediction purse. Only the server commits its output;
// no method here sends a reported award or balance to the banking API.
const CURRENCIES = new Set(['star-token', 'moon-penny', 'rose-penny', 'crown-token', 'five-penny-stack']);
const amount = n => {
  if (!Number.isSafeInteger(n) || n < 0 || n > 100000) throw Error('invalid_engine_amount');
  return n;
};
export function createVerifiedWallet({purse, inventory, storage}) {
  const effects = {spent: 0, tickets: 0, credited: 0, keeps: []};
  const api = {
    alleyPlay: true,
    pocket: () => purse.pennies, tickets: () => purse.tickets, packs: () => purse.packs,
    spend(n = 1) {amount(n); if (purse.pennies < n) return false; purse.pennies -= n; effects.spent += n; return true;},
    spendTicket() {if (purse.tickets < 1) return false; purse.tickets--; effects.tickets++; return true;},
    credit(n) {amount(n); purse.pennies += n; effects.credited += n; return n;},
    packFive() {if (!api.spend(5)) return false; purse.packs++; return true;},
    unpackFive() {if (!purse.packs) return false; purse.packs--; api.credit(5); return true;},
    owned: id => !!inventory[id],
    keptQty: id => Number(inventory[id]?.qty) || (inventory[id] ? 1 : 0),
    keep(id, stall = 'coin-pusher') {
      if (typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) throw Error('invalid_engine_award');
      if (inventory[id] && !CURRENCIES.has(id)) return false;
      if (id === 'five-penny-stack' && !inventory['penny-purse']) return false;
      const qty = inventory[id] ? Number(inventory[id].qty) || 1 : 0;
      inventory[id] = {...(inventory[id] || {}), qty: qty + 1, at: Date.now(), source: inventory[id]?.source || stall};
      effects.keeps.push(id);
      return true;
    },
    loadMachine(chapter = 0) {
      try {
        const book = JSON.parse(storage.get('pennyFever.cashDrop') || 'null');
        const table = book?.v === 4 ? book.tables?.[String(chapter)] : chapter === 0 && book?.v < 4 ? book : null;
        return Array.isArray(table?.pieces) && table.pieces.length ? table : null;
      } catch {return null;}
    },
    saveMachine(blob, chapter = 0) {
      if (!blob) return;
      let book; try {book = JSON.parse(storage.get('pennyFever.cashDrop') || 'null');} catch {}
      if (!book || book.v !== 4) book = {v: 4, tables: {}};
      book.tables[String(chapter)] = blob;
      storage.set('pennyFever.cashDrop', JSON.stringify(book));
    },
  };
  return {api, purse, inventory, storage, effects};
}
