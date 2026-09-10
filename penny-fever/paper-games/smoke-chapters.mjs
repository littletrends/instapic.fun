import {games} from './catalogue.js';
const fail = [];
for (const g of games.filter(x => x.ready && !x.direct)) {
  const eng = (await import(g.module)).default;
  const n = eng.levels?.length || 0;
  if (n < 6) fail.push(g.id + ' only ' + n + ' chapters');
  const rng = () => 0.37;
  for (let i = 0; i < n; i++) {
    try {
      const s = eng.create(i, rng);
      if (!s) fail.push(g.id + ' create(' + i + ') empty');
      else eng.update?.(s, 0.016, {keys: new Set(), actions: new Set()});
    } catch (e) {
      fail.push(g.id + ' create(' + i + ') ' + e.message);
    }
  }
}
if (fail.length) {
  console.error(fail.join('\n'));
  process.exit(1);
}
console.log('ok', games.filter(x => x.ready && !x.direct).length, 'stalls × 6 chapters');
