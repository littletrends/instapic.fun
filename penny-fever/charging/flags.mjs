import {privateIntent} from './private-session.mjs';
export {resolvePrivateSession as resolvePilotSession} from './private-session.mjs';
export const PILOT_RELEASE_ENABLED = false;
export const PILOT_GAMES = new Set(['balloons', 'fortune', 'coin-pusher']);

export function pilotSession(game, scope = globalThis) {
  return privateIntent(scope);
}
