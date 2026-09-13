export const PILOT_RELEASE_ENABLED = false;
export const PILOT_GAMES = new Set(['balloons', 'fortune', 'coin-pusher']);

export function pilotSession(game, scope = globalThis) {
  if (!PILOT_RELEASE_ENABLED || !PILOT_GAMES.has(game)) return null;
  const migration = JSON.parse(scope.localStorage.getItem('pennyFever.ledger.migration.v1') || 'null');
  if (migration?.status !== 'imported' || !migration.receipt?.player || !migration.token) return null;
  return {enabled: true, practice: false, game, playerId: migration.receipt.player, token: migration.token,
    base: 'https://motherpc.taild1a44c.ts.net/api/penny-fever/ledger'};
}
