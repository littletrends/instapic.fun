import assert from 'node:assert/strict';
import {createPilotClient} from '../charging/pilot-client.mjs';

const records = new Map();
const storage = {getItem: key => records.get(key) || null,
  setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key)};
const requests = [];
let interrupted = true;
const transport = async (url, options) => {
  requests.push({url, options});
  if (interrupted) { interrupted = false; throw new Error('response_lost'); }
  return {ok: true, json: async () => ({id: 'server-play'})};
};
const options = {enabled: true, practice: false, game: 'balloons', playerId: 'fixture',
  token: 'fixture-token', storage, transport, uuid: () => 'stable-request'};
const command = {operation: 'begin', game: 'balloons', chapter: 0, trigger: 'round_begins'};
await assert.rejects(createPilotClient(options).command(command), /response_lost/);
assert.equal(records.size, 1);
await assert.rejects(createPilotClient(options).command({...command, chapter: 1}), /recover_pending/);
assert.deepEqual(await createPilotClient(options).recoverRequest(), {id: 'server-play'});
assert.equal(records.size, 0);
assert.equal(requests[0].options.headers['Idempotency-Key'], requests[1].options.headers['Idempotency-Key']);
assert.equal(requests[0].options.body, requests[1].options.body);
const count = requests.length;
for (const override of [{practice: true}, {enabled: false}, {game: 'organ'}]) {
  const client = createPilotClient({...options, ...override});
  assert.equal(client.active, false);
  await client.command(command);
  await client.resume('anything');
  await client.recoverRequest();
}
assert.equal(requests.length, count);
console.log('PASS: durable request recovery, matching retries, disabled/practice/non-pilot isolation');
