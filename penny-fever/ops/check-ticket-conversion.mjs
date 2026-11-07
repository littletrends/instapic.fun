import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
function functionSource(name) {
  const start = source.indexOf('  function ' + name + '(');
  assert(start >= 0, name + ' exists');
  const end = source.indexOf('\n  }', start);
  return source.slice(start, end + 4);
}
const functions = ['pennies', 'tickets', 'tradePenniesForTicket', 'cashTicketForPennies'].map(functionSource).join('\n');
for (const showmanPass of [false, true]) {
  for (const balance of [0, 4, 5, 10, '10']) {
    const state = {demoCoins: balance, playTickets: 3, showmanPass, passDay: '2026-09-13', paperInventory: {items: {}}};
    const saves = [];
    const context = vm.createContext({
      localStorage: {getItem: () => null},
      state,
      PENNY_STACK: 5,
      saveState(value) { saves.push(JSON.parse(JSON.stringify(value))); },
      refreshNightBoard() {},
      stampKeepsake() {},
      spendPennies() { throw new Error('Conversion must not use the pass-exempt gameplay debit'); },
      addDemoCoins(amount) { state.demoCoins = Number(state.demoCoins) + amount; return amount; },
    });
    vm.runInContext(functions, context);
    const initialValue = Number(balance) + state.playTickets * 5;
    const expectedTrades = Math.floor(Number(balance) / 5);
    for (let attempt = 0; attempt < expectedTrades; attempt++) {
      assert.equal(context.tradePenniesForTicket(), true);
      assert.equal(state.demoCoins + state.playTickets * 5, initialValue);
      assert.equal(saves.at(-1).demoCoins, Number(balance) - (attempt + 1) * 5);
      assert.equal(saves.at(-1).playTickets, 3 + attempt + 1);
    }
    const before = JSON.stringify(state);
    assert.equal(context.tradePenniesForTicket(), false);
    assert.equal(JSON.stringify(state), before, 'Insufficient funds do not alter the save');
    assert.equal(saves.length, expectedTrades, 'Each trade writes the complete wallet once');
    assert.equal(state.showmanPass, showmanPass, 'Pass ownership is unchanged');
    if (expectedTrades) {
      const remaining = state.demoCoins;
      assert.equal(context.cashTicketForPennies(), 5);
      assert.equal(context.tradePenniesForTicket(), true);
      assert.equal(state.demoCoins, remaining);
      assert.equal(state.demoCoins + state.playTickets * 5, initialValue, 'Round trips cannot create currency');
    }
  }
}
console.log('PASS: pass/no-pass conversion, repeated clicks, insufficient funds, legacy numeric strings, complete wallet saves and value-conserving round trips');
