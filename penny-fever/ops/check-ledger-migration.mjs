import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {migrateBrowser, assertLegacyWalletWritable, MIGRATION_KEY} from '../charging/migration.mjs';

const values = new Map();
const storage = {getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value)};
let queue = Promise.resolve();
const locks = {request: (key, operation) => {
  const result = queue.then(operation);
  queue = result.catch(() => {});
  return result;
}};
const original = '{"demoCoins":13,"playTickets":7,"cashDrop":{"v":4,"tables":{}},"unknown":"retained"}';
let imports = 0, lost = true;
const options = {enabled: true, storage, locks, readOriginal: () => original,
  uuid: () => 'fixture-browser-unique-identity-1234567890',
  prepare: async () => ({player: 'fixture-player', receipt: 'receipt', digest: 'digest'}),
  commit: async () => {
    if (!imports) imports++;
    if (lost) { lost = false; throw new Error('response_lost_after_import'); }
    return {status: 'imported'};
  }};
await assert.rejects(migrateBrowser(options), /response_lost/);
assert.equal(JSON.parse(values.get(MIGRATION_KEY)).original, original);
assert.equal(JSON.parse(values.get(MIGRATION_KEY)).status, 'prepared');
assert.throws(() => assertLegacyWalletWritable(storage, {demoCoins: 12, playTickets: 7}), /locked/);
assertLegacyWalletWritable(storage, {demoCoins: 13, playTickets: 7});
const results = await Promise.all([migrateBrowser(options), migrateBrowser(options)]);
assert.deepEqual(results[0], results[1]);
assert.equal(imports, 1);
assert.equal(results[0].original, original);
assert.equal(results[0].status, 'imported');
await assert.rejects(migrateBrowser({...options, locks: null}), /Web Locks/);
assert.equal(await migrateBrowser({...options, enabled: false}), null);
const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const save = source.match(/function saveState\(s\) \{[\s\S]*?\n  \}/)[0];
const context = vm.createContext({localStorage: storage, window: {}, STORAGE_KEY: 'legacy'});
vm.runInContext(save, context);
const attempted = {demoCoins: 12, playTickets: 8};
assert.throws(() => context.saveState(attempted), /locked/);
assert.deepEqual(attempted, {demoCoins: 13, playTickets: 7});
assert.equal(values.has('legacy'), false);
console.log('PASS: original snapshot, durable fence, interrupted migration recovery, two tabs, disabled default');
