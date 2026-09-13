const PILOTS = new Set(['coin-pusher', 'balloons', 'fortune']);

export function createPilotClient({enabled = false, practice = true, game, playerId, token,
  privateTest = false, policyGeneration, mode = 'validate', assertAccess = () => {},
  locks = globalThis.navigator?.locks,
  storage = globalThis.localStorage, transport = globalThis.fetch,
  uuid = () => globalThis.crypto.randomUUID(), base = '/api/penny-fever/ledger'}) {
  const active = enabled && !practice && PILOTS.has(game);
  const storageKey = `${privateTest ? 'pennyFever.privateTest.outbox.v1' : 'pennyFever.ledger.outbox.v1'}:${playerId}:${game}`;
  let busy = false;

  async function exclusive(operation) {
    if (!active || !privateTest) return operation();
    if (!locks?.request) throw new Error('private_cross_tab_lock_required');
    return locks.request(storageKey, operation);
  }

  async function send(record) {
    assertAccess(true);
    if (privateTest && record.generation !== policyGeneration) throw new Error('private_pending_policy_changed');
    const response = await transport(`${base}/command`, {
      method: 'POST', cache: 'no-store',
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`,
        'Idempotency-Key': record.key},
      body: JSON.stringify(record.command),
    });
    const result = await response.json();
    if (!response.ok) {
      if (['insufficient_funds', 'stale_or_closed_play', 'resume_frozen_attempt',
        'valid_topic_required', 'raw_ledger_commands_disabled_for_pilots'].includes(result.error)) storage.removeItem(storageKey);
      throw new Error(result.error || `ledger_http_${response.status}`);
    }
    storage.removeItem(storageKey);
    return result;
  }

  async function command(payload) {
    if (!active) return {active: false, practice};
    if (!playerId || !token) throw new Error('ledger_identity_required');
    if (busy) throw new Error('ledger_request_in_progress');
    busy = true;
    try {
      const pending = storage.getItem(storageKey);
      assertAccess(true);
      const record = pending ? JSON.parse(pending) : {key: uuid(), command: payload, ...(privateTest ? {generation: policyGeneration} : {})};
      if (pending && JSON.stringify(record.command) !== JSON.stringify(payload)) {
        throw new Error('recover_pending_request_first');
      }
      storage.setItem(storageKey, JSON.stringify(record));
      return await send(record);
    } finally {
      busy = false;
    }
  }

  return {
    active,
    command: payload => exclusive(() => command(payload)),
    async current() {
      if (!active) return null;
      assertAccess();
      const response = await transport(`${base}/pilots/${encodeURIComponent(game)}`, {
        cache: 'no-store', headers: {Authorization: `Bearer ${token}`},
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `ledger_http_${response.status}`);
      return result;
    },
    recoverRequest: () => exclusive(async () => {
      if (!active) return {active: false, practice};
      const pending = storage.getItem(storageKey);
      if (privateTest && pending) {
        assertAccess();
        const record = JSON.parse(pending);
        const response = await transport(`${base}/requests/${encodeURIComponent(record.key)}`, {
          cache: 'no-store', headers: {Authorization: `Bearer ${token}`},
        });
        const result = await response.json();
        if (response.ok) { storage.removeItem(storageKey); return result; }
        if (response.status !== 404 || mode !== 'validate') throw new Error(result.error || 'private_recovery_failed');
      }
      return pending ? command(JSON.parse(pending).command) : null;
    }),
    async resume(playId) {
      if (!active) return {active: false, practice};
      assertAccess();
      if (!playerId || !token) throw new Error('ledger_identity_required');
      const response = await transport(`${base}/plays/${encodeURIComponent(playId)}`, {
        cache: 'no-store', headers: {Authorization: `Bearer ${token}`},
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `ledger_http_${response.status}`);
      return result;
    },
  };
}
