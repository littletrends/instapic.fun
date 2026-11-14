// Transport only. The current engines keep their rules; the server owns purse
// changes and receipts. This module does not enable the disabled pilot release.
export function createVerifiedClient({identity, transport = globalThis.fetch,
  storage = globalThis.localStorage, locks = globalThis.navigator?.locks,
  uuid = () => globalThis.crypto.randomUUID(), base = 'https://motherpc.taild1a44c.ts.net/api/penny-fever/verified'}) {
  if (typeof identity !== 'function') throw Error('verified_identity_required');
  let busy = false;
  const account = () => {
    const value = identity();
    if (!value || typeof value.id !== 'string' || !value.id || typeof value.token !== 'string' || !value.token) {
      throw Error('verified_identity_required');
    }
    return {...value};
  };
  const unchanged = initial => {
    const current = account();
    if (current.id !== initial.id || current.email !== initial.email || current.token !== initial.token) {
      throw Error('verified_identity_changed');
    }
  };
  const storageKey = value => 'pennyFever.verified.outbox.v1:' + encodeURIComponent(value.id);
  async function request(path, payload, initial) {
    unchanged(initial);
    const response = await transport(base + path, {
      method: 'POST', cache: 'no-store', redirect: 'error',
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + initial.token},
      body: JSON.stringify({...payload, ...(initial.email ? {email: initial.email} : {})}),
    });
    const result = await response.json();
    unchanged(initial);
    if (!response.ok || result.ok !== true) {
      const error = Error(result.error || 'verified_http_' + response.status);
      error.status = response.status;
      throw error;
    }
    return result;
  }
  async function exclusive(fn) {
    if (busy) throw Error('verified_request_in_progress');
    busy = true;
    try {
      const initial = account();
      if (!locks?.request) throw Error('verified_cross_tab_lock_required');
      return await locks.request(storageKey(initial), async () => {
        unchanged(initial);
        return fn(initial);
      });
    } finally {busy = false;}
  }
  const read = initial => {
    const text = storage.getItem(storageKey(initial));
    if (!text) return null;
    const value = JSON.parse(text);
    if (value?.owner !== initial.id || typeof value.key !== 'string'
        || Number(!!value.command) + Number(!!value.purchase) !== 1) {
      throw Error('verified_pending_request_invalid');
    }
    return value;
  };
  async function send(record, initial) {
    const result = record.purchase
      ? await request('/purchase', record.purchase, initial)
      : await request('/command', {key: record.key, command: record.command}, initial);
    // A lost reply keeps the same key and inputs for recovery. Never replace a
    // pending paid action with the next action, or delete it on a server error.
    storage.removeItem(storageKey(initial));
    return record.purchase ? result : result.result;
  }
  return {
    command(command, {key} = {}) {
      return exclusive(async initial => {
        if (key != null && (typeof key !== 'string' || !key.length || key.length > 128)) throw Error('idempotency_key_required');
        const pending = read(initial);
        if (pending && (!pending.command || JSON.stringify(pending.command) !== JSON.stringify(command) || (key && key !== pending.key))) {
          throw Error('recover_pending_request_first');
        }
        const record = pending || {owner: initial.id, key: key || uuid(), command};
        // Save before sending: storage failure must not create an unrecoverable
        // debit. The account lock serializes different games and tabs together.
        storage.setItem(storageKey(initial), JSON.stringify(record));
        return send(record, initial);
      });
    },
    recover() {return exclusive(async initial => {
      const pending = read(initial);
      return pending ? send(pending, initial) : null;
    });},
    purchase(payload) {
      return exclusive(async initial => {
        const pending = read(initial);
        if (pending && (!pending.purchase || JSON.stringify(pending.purchase) !== JSON.stringify(payload))) {
          throw Error('recover_pending_request_first');
        }
        const key = payload.idempotency_key;
        if (typeof key !== 'string' || !key.length || key.length > 128) throw Error('idempotency_key_required');
        const record = pending || {owner: initial.id, key, purchase: payload};
        storage.setItem(storageKey(initial), JSON.stringify(record));
        return send(record, initial);
      });
    },
    state(game, chapter) {
      return exclusive(initial => request('/state', game == null ? {} : {game, chapter}, initial));
    },
    bank() {return exclusive(initial => request('/bank', {}, initial));},
    session(choice, guestToken) {
      return exclusive(initial => request('/session', {choice, ...(guestToken ? {guest_token: guestToken} : {})}, initial));
    },
  };
}
