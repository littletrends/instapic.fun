import {createVerifiedDriver} from '../paper-games/verified-driver.js?v=verified-banking-1';
import {createVerifiedWallet} from '../paper-games/verified-wallet.js?v=verified-banking-1';
import {createVerifiedContext} from './verified-context.mjs';

// Predict inputs immediately. Persist the inputs before prediction and commit
// batches to the existing verifier; predicted rewards never reach the bank.
export async function openVerifiedRound({engine, view, client, owner, scope = globalThis,
  storage = globalThis.localStorage, uuid = () => globalThis.crypto.randomUUID(), onCommit = () => {}, assertActive = () => {}}) {
  const key = 'pennyFever.verified.round.v1:' + encodeURIComponent(owner) + ':' + view.game + ':' + view.chapter;
  const previous = storage.getItem(key);
  let record = previous ? JSON.parse(previous) : {v: 1, owner, play: view.id, revision: view.revision, source: view.source, events: []};
  if (record.v !== 1 || record.owner !== owner || record.play !== view.id || record.source !== view.source || !Array.isArray(record.events)) {
    throw Error('verified_round_recovery_required');
  }
  let current = view, shadow, environment, driver, sending = null, failed = null;
  const save = () => storage.setItem(key, JSON.stringify(record));
  function rebuild() {
    shadow = createVerifiedWallet({purse: structuredClone(current.wallet), inventory: structuredClone(current.wallet.inventory || {}),
      storage: new Map(Object.entries(current.storage || {}))});
    environment = createVerifiedContext({wallet: shadow.api, storage: shadow.storage,
      reducedMotion: current.preferences?.reducedMotion === true, scope});
    driver = environment.run(() => createVerifiedDriver({engine, game: current.game, chapter: current.chapter,
      seed: '00000000', startedAt: current.startedAt, snapshot: structuredClone(current.snapshot)}));
    for (const event of record.events) environment.run(() => driver.execute(event));
  }
  async function deliver() {
    if (!record.batch) {
      if (!record.events.length) return;
      let count = 0, seconds = 0;
      for (const event of record.events.slice(0, 120)) {
        if (event.type === 'tick' && seconds + event.dt > 1.0 + 1e-9) break;
        count++; seconds += event.type === 'tick' ? event.dt : 0;
      }
      record.batch = {key: uuid(), count, command: {operation: 'events', play: record.play,
        revision: record.revision, events: record.events.slice(0, count)}};
      save();
    }
    const response = await client.command(record.batch.command, {key: record.batch.key});
    if (response.id !== record.play || response.revision !== record.batch.command.revision + 1 || response.source !== record.source) {
      throw Error('verified_reply_mismatch');
    }
    // If this write fails after the server committed, the saved batch key
    // recovers that exact response next time rather than charging again.
    const committed = {...record, events: record.events.slice(record.batch.count), revision: response.revision};
    delete committed.batch;
    storage.setItem(key, JSON.stringify(committed));
    record = committed;
    current = response;
    onCommit(response);
  }
  if (record.batch) await deliver();
  const latest = await client.state(view.game, view.chapter);
  if (latest.play && latest.play.revision !== record.revision) throw Error('stale_play');
  if (latest.play) current = latest.play;
  if (record.revision !== current.revision) throw Error('stale_play');
  save(); rebuild();
  async function flush() {
    assertActive();
    if (sending) return sending;
    const task = (async () => {
      try {
        while (record.events.length || record.batch) await deliver();
        rebuild(); failed = null;
        return current;
      } catch (error) {failed = error; throw error;}
    })();
    sending = task.finally(() => {sending = null;});
    return sending;
  }
  return {
    flush,
    enqueue(event) {
      assertActive();
      if (failed) throw failed;
      if (record.events.length >= 120) throw Error('verified_sync_required');
      if (event.type === 'tick' && record.events.reduce((seconds, entry) => seconds + (entry.type === 'tick' ? entry.dt : 0), 0) + event.dt > 1.5 + 1e-9) {
        throw Error('verified_sync_required');
      }
      const next = structuredClone(event);
      record.events.push(next);
      try {save();} catch (error) {record.events.pop(); failed = error; throw error;}
      try {environment.run(() => driver.execute(next));}
      catch (error) {failed = error; throw error;}
    },
    render: fn => environment.run(fn),
    persist: () => {environment.run(() => driver.persist()); save();},
    get state() {return driver.state;}, get input() {return driver.input;},
    get completion() {return driver.completion;}, get finished() {return driver.finished;},
    get wallet() {return shadow.purse;}, get pending() {return record.events.length;},
    get error() {return failed;},
  };
}
