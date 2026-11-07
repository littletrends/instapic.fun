export const PRIVATE_SESSION_KEY = 'pennyFever.privateTest.session.v1';
const BASE = 'https://motherpc.taild1a44c.ts.net/api/penny-fever/ledger';
const GAMES = new Set(['balloons', 'fortune', 'coin-pusher']);

export function privateIntent(scope = globalThis) {
  return scope.localStorage.getItem(PRIVATE_SESSION_KEY) !== null;
}

export async function resolvePrivateSession(game, scope = globalThis) {
  const original = scope.localStorage.getItem(PRIVATE_SESSION_KEY);
  if (original === null) return null;
  const identity = JSON.parse(original);
  if (!GAMES.has(game) || !/^[a-f0-9]{32}$/.test(identity?.playerId || '') ||
      !/^[A-Za-z0-9_-]{40,128}$/.test(identity?.token || '')) throw new Error('private_identity_invalid');
  const transport = (scope.parent || scope).fetch.bind(scope.parent || scope);
  const response = await transport(`${BASE}/capabilities`, {
    cache: 'no-store', headers: {Authorization: `Bearer ${identity.token}`},
  });
  const capabilities = await response.json();
  if (!response.ok) throw new Error(capabilities.error || 'private_access_denied');
  if (capabilities.test_only !== true || capabilities.player_id !== identity.playerId ||
      !Array.isArray(capabilities.games) || !capabilities.games.includes(game) ||
      !capabilities.games.every(value => GAMES.has(value)) ||
      !['validate', 'reconcile_only'].includes(capabilities.mode) ||
      typeof capabilities.policy_generation !== 'string' || !capabilities.policy_generation ||
      !Number.isFinite(Date.parse(capabilities.expires_at))) throw new Error('private_capabilities_invalid');
  function assertAccess(write = false) {
    if (scope.localStorage.getItem(PRIVATE_SESSION_KEY) !== original) throw new Error('private_identity_changed');
    if (Date.parse(capabilities.expires_at) <= Date.now()) throw new Error('private_capability_expired');
    if (write && capabilities.mode !== 'validate') throw new Error('private_reconcile_only');
  }
  assertAccess();
  return {enabled: true, practice: false, privateTest: true, game, playerId: identity.playerId,
    token: identity.token, base: BASE, mode: capabilities.mode,
    policyGeneration: capabilities.policy_generation, assertAccess};
}
