import {createVerifiedClient} from './verified-client.mjs';
import {createVerifiedPurse} from './verified-purse.mjs';

const BASE = 'https://motherpc.taild1a44c.ts.net/api/penny-fever/verified';
const GUEST_KEY = 'pennyFever.verified.guest.v1';
const ADOPTION_KEY = 'pennyFever.verified.adoption.v1';
export const VERIFIED_BANKING_RELEASE = true;

export function createVerifiedBanking({api, identity, storage = globalThis.localStorage,
  transport = globalThis.fetch, locks = globalThis.navigator?.locks, scope = globalThis,
  loan = () => ({enabled: false}), uuid = () => globalThis.crypto.randomUUID(), onError = () => {}}) {
  let account = null, purse = null, generation = 0, work = null, lastBank = 0;
  let resolveFirst, rejectFirst;
  const first = new Promise((resolve, reject) => {resolveFirst = resolve; rejectFirst = reject;});
  first.catch(() => {});
  const rounds = new Set();
  const adoption = () => JSON.parse(storage.getItem(ADOPTION_KEY) || 'null');
  const moving = selected => !selected.email && adoption()?.guest_id === selected.id;
  function vip() {
    const value = identity?.read?.();
    return identity?.isVerifiedSessionActive?.() && value?.email && value?.session_token
      ? {id: 'vip:' + value.email.trim().toLowerCase(), email: value.email.trim().toLowerCase(), token: value.session_token} : null;
  }
  function guest() {
    const value = JSON.parse(storage.getItem(GUEST_KEY) || 'null');
    return value?.guest_id && value?.guest_token ? {id: value.guest_id, token: value.guest_token} : null;
  }
  function clientFor(selected, epoch) {
    return createVerifiedClient({storage, transport, locks, uuid, base: BASE, identity: () => {
      if (epoch != null && epoch !== generation) throw Error('verified_identity_changed');
      if (epoch != null && moving(selected)) throw Error('verified_guest_moving');
      if (selected.email) {
        const current = vip();
        if (!current || current.email !== selected.email) throw Error('verification_required');
        return current;
      }
      const current = guest();
      if (!current || current.id !== selected.id || current.token !== selected.token) throw Error('verified_identity_changed');
      return current;
    }});
  }
  async function bind(selected, prepare) {
    const epoch = ++generation;
    rounds.clear();
    const client = clientFor(selected, epoch);
    work = (async () => {
      try {
        await client.recover();
        if (prepare) await prepare(client);
        await recoverAccount(selected);
        const initial = await client.state();
        let displayed = initial.wallet, installed = false;
        const next = createVerifiedPurse({owner: selected.id, wallet: initial.wallet, client,
          storage, uuid, loan, onError, assertActive: () => {
            if(epoch!==generation||moving(selected)
                ||(selected.email?vip()?.email!==selected.email:guest()?.id!==selected.id)) throw Error('verified_identity_changed');
          }, apply: wallet => {
            displayed = wallet;
            if (installed && epoch === generation) api.applyVerifiedPurse(wallet);
          }});
        await next.flush();
        if (epoch !== generation) throw Error('verified_identity_changed');
        account = selected; purse = next; installed = true;
        scope.PennyFeverVerifiedPurse = next;
        api.applyVerifiedPurse(displayed);
        resolveFirst();
        return next;
      } catch (error) {rejectFirst(error); onError(error); throw error;}
    })();
    return work;
  }
  async function flush() {
    await (work || first);
    for (const callback of rounds) await callback();
    return purse.flush();
  }
  async function bank() {
    await flush();
    if (!account?.email) return null;
    const result = await clientFor(account, generation).bank();
    lastBank = Date.now();
    return result;
  }
  async function recoverAccount(selected) {
    const client = clientFor(selected);
    await client.recover();
    const state = await client.state();
    const heldPurse = createVerifiedPurse({owner: selected.id, wallet: state.wallet, client,
      storage, uuid, loan, apply() {}});
    await heldPurse.flush();
    const prefix = 'pennyFever.verified.round.v1:' + encodeURIComponent(selected.id) + ':';
    const keys = Array.from({length: storage.length}, (_, index) => storage.key(index)).filter(key => key?.startsWith(prefix));
    for (const key of keys) {
      let record = JSON.parse(storage.getItem(key));
      if (record?.owner !== selected.id || !Array.isArray(record.events) || record.events.length > 120) throw Error('verified_round_recovery_required');
      while (record.batch || record.events.length) {
        if (!record.batch) {
          let count = 0, seconds = 0;
          for (const event of record.events.slice(0, 120)) {
            if (event.type === 'tick' && seconds + event.dt > 1 + 1e-9) break;
            count++; seconds += event.type === 'tick' ? event.dt : 0;
          }
          if (!count) throw Error('verified_round_recovery_required');
          record.batch = {key: uuid(), count, command: {operation: 'events', play: record.play,
            revision: record.revision, events: record.events.slice(0, count)}};
          storage.setItem(key, JSON.stringify(record));
        }
        const response = await client.command(record.batch.command, {key: record.batch.key});
        if (response.id !== record.play || response.revision !== record.batch.command.revision + 1
            || response.source !== record.source) throw Error('verified_reply_mismatch');
        const committed = {...record, revision: response.revision, events: record.events.slice(record.batch.count)};
        delete committed.batch;
        storage.setItem(key, JSON.stringify(committed));
        record = committed;
      }
    }
  }
  const service = {
    required: true,
    async useGuest() {
      if (!locks?.request) throw Error('verified_cross_tab_lock_required');
      return locks.request(GUEST_KEY + ':creation', async () => {
        let selected = guest();
        if (!selected) {
          const response = await transport(BASE + '/guest', {method: 'POST', cache: 'no-store',
            headers: {'Content-Type': 'application/json'}, body: '{}'});
          const created = await response.json();
          if (!response.ok || created.ok !== true || !created.guest_id || !created.guest_token) throw Error(created.error || 'guest_creation_failed');
          storage.setItem(GUEST_KEY, JSON.stringify({guest_id: created.guest_id, guest_token: created.guest_token,
            player_id: storage.getItem('pf-player-id-v1')}));
          selected = guest();
        }
        const device = JSON.parse(storage.getItem(GUEST_KEY));
        if (device.player_id) storage.setItem('pf-player-id-v1', device.player_id);
        return bind(selected);
      });
    },
    async useVip(choice = 'vip') {
      const selected = vip();
      if (!selected) throw Error('verification_required');
      if (choice !== 'vip' && choice !== 'guest') throw Error('collection_choice_required');
      const held = guest();
      const connect = async () => {
        if (vip()?.email !== selected.email) throw Error('verified_identity_changed');
        const pending = adoption();
        if (pending?.email === selected.email && guest()?.id === pending.guest_id) choice = 'guest';
        const source = choice === 'guest' ? guest() : null;
        if (choice === 'guest' && !source) throw Error('verified_guest_required');
        if (source && pending && (pending.email !== selected.email || pending.guest_id !== source.id)) {
          throw Error('verified_guest_adoption_pending');
        }
        // Flush the guest's durable inputs and purse before moving ownership.
        if (source && account?.id === source.id && !moving(source)) await flush();
        if (source) {
          storage.setItem(ADOPTION_KEY, JSON.stringify({email: selected.email, guest_id: source.id}));
          try {await recoverAccount(source);}
          catch (error) {
            // A previous adoption may have committed before its reply was lost.
            // Only the authenticated destination can recover that adoption.
            if (error.status !== 401 || pending?.email !== selected.email || pending.guest_id !== source.id) throw error;
          }
        }
        return bind(selected, async client => {
          await client.session(choice, source?.token);
          if (source) storage.removeItem(GUEST_KEY);
          if (adoption()?.email === selected.email) storage.removeItem(ADOPTION_KEY);
        });
      };
      if (!held) return connect();
      if (!locks?.request) throw Error('verified_cross_tab_lock_required');
      // Serialize the complete transfer, including its marker, across tabs.
      // The shorter per-request lock alone cannot protect this sequence.
      return locks.request('pennyFever.verified.adoption-lock.v1:' + held.id, connect);
    },
    flush, bank,
    async startRound(game, chapter, preferences) {
      await flush();
      const epoch = generation, selected = account;
      const client = clientFor(selected, epoch);
      await client.recover();
      const view = await client.command({operation: 'begin', game, chapter, preferences});
      if (epoch !== generation) throw Error('verified_identity_changed');
      purse.accept(view.wallet);
      return {view, client, owner: selected.id, assertActive: () => {
        if (epoch !== generation || account?.id !== selected.id || moving(selected)) throw Error('verified_identity_changed');
        if (selected.email && vip()?.email !== selected.email) throw Error('verification_required');
        if (!selected.email && guest()?.id !== selected.id) throw Error('verified_identity_changed');
      }, onCommit: response => {
        if (epoch !== generation) return;
        purse.accept(response.wallet);
        if (selected.email && Date.now() - lastBank > 10000) {
          lastBank = Date.now();
          // Banking is independent of rendering; its receipts recover later
          // if USB storage or the connection is temporarily unavailable.
          clientFor(selected, epoch).bank().catch(onError);
        }
      }};
    },
    async selectedChapter(game) {
      await (work || first);
      const result = await clientFor(account, generation).state(game);
      return result.selectedChapter || 0;
    },
    registerRound(callback) {rounds.add(callback); return () => rounds.delete(callback);},
    async testCollection() {
      await flush();
      const epoch = generation, selected = account;
      if (!selected?.email || !vip()) throw Error('verification_required');
      if (!purse.wallet().test_collection_allowed) throw Error('test_collection_not_allowed');
      if (!loan().enabled) throw Error('bank_loan_disabled');
      const client = clientFor(selected, epoch);
      await client.recover();
      const result = await client.command({operation: 'wallet', action: 'test_collection'});
      if (epoch !== generation || vip()?.email !== selected.email) throw Error('verified_identity_changed');
      purse.accept(result);
      return result.collection_grant;
    },
    async purchase(payload) {
      await flush();
      const epoch = generation;
      const result = await clientFor(account, epoch).purchase(payload);
      if (epoch !== generation) throw Error('verified_identity_changed');
      purse.accept(result.wallet);
      return result;
    },
    get owner() {return account?.id || null;},
    get hasGuest() {
      const saved = JSON.parse(storage.getItem(GUEST_KEY) || 'null');
      return !!saved?.guest_token && saved.player_id === storage.getItem('pf-player-id-v1');
    },
    fail(error) {rejectFirst(error); onError(error);},
    get ready() {return work || first;},
    get active() {return !!purse;},
  };
  return service;
}
