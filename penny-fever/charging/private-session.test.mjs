import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {PRIVATE_SESSION_KEY, privateIntent, resolvePrivateSession} from './private-session.mjs';
import {createPilotClient} from './pilot-client.mjs';
import {PILOT_RELEASE_ENABLED} from './flags.mjs';
const locks = {request: async (key, operation) => operation()};

function fixture() {
  const entries = new Map();
  const storage = {getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key)};
  const identity = {playerId: 'a'.repeat(32), token: 'temporary_'.repeat(5)};
  const capabilities = {test_only: true, player_id: identity.playerId, games: ['balloons'], mode: 'validate',
    policy_generation: 'fixture-1', expires_at: new Date(Date.now() + 60000).toISOString()};
  const calls = [];
  const scope = {localStorage: storage, fetch: async (...args) => {
    calls.push(args); return {ok: true, json: async () => capabilities};
  }};
  return {storage, identity, capabilities, calls, scope,
    install() { storage.setItem(PRIVATE_SESSION_KEY, JSON.stringify(identity)); }};
}

test('defaults off, no credential means no handshake', async () => {
  const fixtureData = fixture();
  assert.equal(PILOT_RELEASE_ENABLED, false);
  assert.equal(await resolvePrivateSession('balloons', fixtureData.scope), null);
  assert.equal(fixtureData.calls.length, 0);
});

test('malformed, denied, forged identity and expired sessions never fall back', async () => {
  const fixtureData = fixture();
  fixtureData.storage.setItem(PRIVATE_SESSION_KEY, '{');
  assert.equal(privateIntent(fixtureData.scope), true);
  await assert.rejects(resolvePrivateSession('balloons', fixtureData.scope));
  fixtureData.install();
  fixtureData.capabilities.player_id = 'b'.repeat(32);
  await assert.rejects(resolvePrivateSession('balloons', fixtureData.scope), /capabilities_invalid/);
  fixtureData.capabilities.player_id = fixtureData.identity.playerId;
  fixtureData.capabilities.expires_at = new Date(0).toISOString();
  await assert.rejects(resolvePrivateSession('balloons', fixtureData.scope), /expired/);
  fixtureData.scope.fetch = async () => ({ok: false, json: async () => ({error: 'revoked'})});
  await assert.rejects(resolvePrivateSession('balloons', fixtureData.scope), /revoked/);
});

test('capability checked before commands; credential change fences existing client', async () => {
  const fixtureData = fixture();
  fixtureData.install();
  const session = await resolvePrivateSession('balloons', fixtureData.scope);
  assert.equal(fixtureData.calls[0][1].cache, 'no-store');
  const client = createPilotClient({...session, locks, storage: fixtureData.storage,
    transport: async () => { throw new Error('must not send'); }});
  fixtureData.storage.removeItem(PRIVATE_SESSION_KEY);
  await assert.rejects(client.command({operation: 'pilot_begin'}), /identity_changed/);
  await assert.rejects(client.current(), /identity_changed/);
});

test('practice never contacts wallet and private outbox preserves lost responses', async () => {
  const fixtureData = fixture();
  fixtureData.install();
  const session = await resolvePrivateSession('balloons', fixtureData.scope);
  let requests = 0;
  const transport = async () => { requests++; throw new Error('response_lost'); };
  const practice = createPilotClient({...session, practice: true, transport});
  await practice.command({operation: 'pilot_begin'});
  assert.equal(requests, 0);
  const client = createPilotClient({...session, locks, storage: fixtureData.storage, transport, uuid: () => 'stable-key'});
  await assert.rejects(client.command({operation: 'pilot_begin'}), /response_lost/);
  const key = `pennyFever.privateTest.outbox.v1:${session.playerId}:balloons`;
  assert.equal(JSON.parse(fixtureData.storage.getItem(key)).key, 'stable-key');
  const recovered = createPilotClient({...session, locks, mode: 'reconcile_only', storage: fixtureData.storage,
    transport: async url => {
      assert.ok(url.endsWith('/requests/stable-key'));
      return {ok: true, json: async () => ({recovered: true})};
    }});
  assert.deepEqual(await recovered.recoverRequest(), {recovered: true});
  assert.equal(fixtureData.storage.getItem(key), null);
});

test('changed policy cannot replay uncommitted old command', async () => {
  const fixtureData = fixture();
  fixtureData.install();
  const session = await resolvePrivateSession('balloons', fixtureData.scope);
  fixtureData.storage.setItem(`pennyFever.privateTest.outbox.v1:${session.playerId}:balloons`,
    JSON.stringify({key: 'old-key', command: {operation: 'pilot_begin'}, generation: 'old-policy'}));
  const client = createPilotClient({...session, locks, storage: fixtureData.storage,
    transport: async () => ({ok: false, status: 404, json: async () => ({error: 'private_request_not_found'})})});
  await assert.rejects(client.recoverRequest(), /pending_policy_changed/);
});

test('capability expiry after shell handshake blocks Begin without a request', async () => {
  const fixtureData = fixture();
  fixtureData.install();
  const session = await resolvePrivateSession('balloons', fixtureData.scope);
  const originalNow = Date.now;
  try {
    Date.now = () => Date.parse(fixtureData.capabilities.expires_at) + 1;
    const client = createPilotClient({...session, locks, storage: fixtureData.storage,
      transport: async () => { assert.fail('Expired capability must not send'); }});
    await assert.rejects(client.command({operation: 'pilot_begin'}), /capability_expired/);
  } finally { Date.now = originalNow; }
});

test('two tabs serialize a lost-response outbox; second identity has separate state', async () => {
  const fixtureData = fixture();
  fixtureData.install();
  const session = await resolvePrivateSession('balloons', fixtureData.scope);
  let queue = Promise.resolve();
  const tabLocks = {request: (key, operation) => {
    const next = queue.then(operation); queue = next.catch(() => {}); return next;
  }};
  const sent = [];
  const settings = {...session, locks: tabLocks, storage: fixtureData.storage, uuid: () => 'first-key',
    transport: async (url, options) => { sent.push(options.headers['Idempotency-Key']); throw new Error('lost'); }};
  const command = {operation: 'pilot_begin'};
  await Promise.all([createPilotClient(settings), createPilotClient({...settings, uuid: () => 'second-key'})]
    .map(client => assert.rejects(client.command(command), /lost/)));
  assert.deepEqual(sent, ['first-key', 'first-key']);
  const other = createPilotClient({...settings, playerId: 'b'.repeat(32)});
  assert.equal(await other.recoverRequest(), null);
  await assert.rejects(createPilotClient({...settings, locks: null}).command(command), /cross_tab_lock_required/);
});

test('shell waits for authorization, denial never charges, leaving cancels late approval', async () => {
  const source = readFileSync(new URL('../world/paper-game-booths.js', import.meta.url), 'utf8');
  const vendorSource = source.slice(source.indexOf('export function createPaperGameVendor'), source.indexOf('\nfunction flyToTreasure'))
    .replace('export function', 'function').replaceAll('import.meta.url', JSON.stringify(import.meta.url));
  const elements = [];
  function element() {
    const node = {classList: {add() {}}, setAttribute() {}, removeAttribute() {}, append() {},
      addEventListener() {}, getAttribute(key) { return this[key]; }};
    elements.push(node); return node;
  }
  let resolveAccess, debits = 0;
  const context = vm.createContext({URL, setTimeout, clearTimeout,
    window: {PennyFever: {spendPennies() { debits++; return true; }}, addEventListener() {}},
    pilotSession: () => true, isPennyTable: () => false,
    resolvePilotSession: () => new Promise(resolve => { resolveAccess = resolve; }),
    document: {getElementById: element, createElement: element}, location: {}});
  vm.runInContext(vendorSource, context);
  const vendor = context.createPaperGameVendor({id: 'balloons', host: 'fixture', title: 'fixture', src: 'fixture-game'});
  const pending = vendor.onShow();
  assert.equal(debits, 0);
  vendor.onLeave();
  resolveAccess({enabled: true});
  await pending;
  assert.equal(elements.find(node => node.className === 'paper-game-frame').src, 'about:blank');
  context.resolvePilotSession = async () => { throw new Error('revoked'); };
  await vendor.onShow();
  assert.equal(debits, 0);
  assert.equal(elements.find(node => node.className === 'paper-game-frame').src, 'about:blank');
});

test('private legacy guards block pass-exempt spending and conversion before mutation', () => {
  const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const state = {demoCoins: 10, playTickets: 4, showmanPass: true};
  const context = vm.createContext({state, localStorage: {getItem: () => '{}'}});
  for (const name of ['spendDemoCoin', 'spendPennies', 'spendTicket', 'addDemoCoins', 'addTickets',
    'cashTicketForPennies', 'tradePenniesForTicket']) {
    const start = source.indexOf('  function ' + name + '(');
    vm.runInContext(source.slice(start, source.indexOf('\n  }', start) + 4), context);
    assert.ok(!context[name](1));
  }
  assert.deepEqual(state, {demoCoins: 10, playTickets: 4, showmanPass: true});
});

test('private award receipts never touch the real inventory or companion save', () => {
  const source = readFileSync(new URL('./pilot-runtime.mjs', import.meta.url), 'utf8');
  const fixtureData = fixture();
  const context = vm.createContext({session: {privateTest: true, playerId: 'fixture-player'},
    localStorage: fixtureData.storage});
  const start = source.indexOf('  function deliverAwards(');
  vm.runInContext(source.slice(start, source.indexOf('\n  function apply(', start)), context);
  const award = {receipt: 'fixture-receipt', item: 'fixture-prize'};
  context.deliverAwards([award]);
  context.deliverAwards([award]);
  assert.deepEqual(JSON.parse(fixtureData.storage.getItem('pennyFever.privateTest.awards.v1:fixture-player')),
    {'fixture-receipt': award});
  assert.equal(fixtureData.storage.getItem('pennyFever.restyle.v1'), null);
  assert.equal(fixtureData.storage.getItem('pennyFever.cashDrop'), null);
  assert.equal(fixtureData.storage.getItem('pennyFever.ledger.migration.v1'), null);
});
