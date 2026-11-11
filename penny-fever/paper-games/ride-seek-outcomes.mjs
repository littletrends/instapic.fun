import {eligibilityPercent, sealAttempt, settleArrival} from './ride-seek.js';

const fail = [];
function eq(name, got, want) {
  if (JSON.stringify(got) !== JSON.stringify(want)) fail.push(name + ': ' + JSON.stringify(got) + ' != ' + JSON.stringify(want));
}

eq('ch1 percent', eligibilityPercent(0), 50);
eq('ch2 percent', eligibilityPercent(1), 50);
eq('ch3 percent', eligibilityPercent(2), 40);
eq('ch6 percent', eligibilityPercent(5), 30);

const practiceSeal = sealAttempt({rng: () => 0.01, chapter: 0, practice: true, treasureId: 'music-carousel', rideId: 'carousel', spawnIds: ['saddle']});
if (practiceSeal.eligible) fail.push('practice must be ineligible');

const paidSeal = sealAttempt({rng: () => 0.01, chapter: 0, practice: false, treasureId: 'music-carousel', rideId: 'carousel', spawnIds: ['saddle']});
if (!paidSeal.eligible) fail.push('1% roll should be eligible at 50%');
if (paidSeal.spawnId !== 'saddle') fail.push('eligible spawn missing');

const practiceWin = settleArrival({practice: true, collected: [{kind: 'ordinary'}], t: 1}, {rideId: 'carousel', chapter: 0, treasureId: 'music-carousel', challengeOk: true});
eq('practice advances, no prize', {won: practiceWin.won, advance: practiceWin.advance, prize: practiceWin.prize}, {won: true, advance: true, prize: false});

const miss = settleArrival({practice: false, eligible: true, treasureRevealed: true, treasureCollected: null, spawnId: 'canopy', hiddenResult: 12, collected: []}, {rideId: 'carousel', chapter: 0, treasureId: 'music-carousel', challengeOk: true, completionFind: 'star-token'});
if (miss.prize === 'music-carousel') fail.push('missed treasure must not award the unique');
if (!miss.won) fail.push('missed treasure still completes the challenge');
eq('miss ordinary completion', miss.prize, 'star-token');

const collected = settleArrival({practice: false, eligible: true, treasureCollected: 'music-carousel', collected: []}, {rideId: 'carousel', chapter: 0, treasureId: 'music-carousel', challengeOk: true});
eq('treasure prize', collected.prize, 'music-carousel');

const failedTreasure = settleArrival({practice: false, eligible: true, treasureCollected: 'music-carousel', collected: []}, {rideId: 'carousel', chapter: 0, treasureId: 'music-carousel', challengeOk: false});
eq('failed challenge still settles treasure', {won: failedTreasure.won, prize: failedTreasure.prize}, {won: false, prize: 'music-carousel'});

if (fail.length) {
  console.error(fail.join('\n'));
  process.exit(1);
}
console.log('ok ride-seek outcomes');
