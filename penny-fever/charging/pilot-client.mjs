const PILOTS = new Set(['coin-pusher', 'balloons', 'fortune']);

export function createPilotClient({enabled = false, practice = true, game, playerId, token,
  storage = globalThis.localStorage, transport = globalThis.fetch,
  uuid = () => globalThis.crypto.randomUUID(), base = '/api/penny-fever/ledger'}) {
  const active = enabled && !practice && PILOTS.has(game);
  const storageKey = `pennyFever.ledger.outbox.v1:${playerId}:${game}`;
  let busy = false;

  async function send(record) {
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
      const record = pending ? JSON.parse(pending) : {key: uuid(), command: payload};
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
    command,
    async current() {
      if (!active) return null;
      const response = await transport(`${base}/pilots/${encodeURIComponent(game)}`, {
        cache: 'no-store', headers: {Authorization: `Bearer ${token}`},
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `ledger_http_${response.status}`);
      return result;
    },
    async recoverRequest() {
      if (!active) return {active: false, practice};
      const pending = storage.getItem(storageKey);
      return pending ? command(JSON.parse(pending).command) : null;
    },
    async resume(playId) {
      if (!active) return {active: false, practice};
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
