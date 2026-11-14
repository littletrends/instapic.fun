import {tillStateFromStatus} from './aura-till-state.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

let s = tillStateFromStatus(
  {status: 'signed', mint: {status: 'accepted'}},
  {owned: 1, price: '0.0022', canBuyAnother: true},
);
assert(s.phase === 'accepted', 'accepted phase');
assert(s.showOpen === false, 'accepted hides Open in Xaman');
assert(s.message === 'Minted ✓ · You own 1', s.message);
assert(s.showBuyAnother === true, 'buy another when allowed');
assert(s.buyAnotherLabel === 'Buy another · 0.0022 XRP', s.buyAnotherLabel);
assert(s.showClose === true, 'close on success');

s = tillStateFromStatus(
  {status: 'signed', mint: {status: 'accepted'}},
  {owned: 2, price: '0.0001 XRP', canBuyAnother: true},
);
assert(s.message === 'Minted ✓ · You own 2', s.message);
assert(s.buyAnotherLabel === 'Buy another · 0.0001 XRP', s.buyAnotherLabel);

s = tillStateFromStatus(
  {status: 'signed', mint: {status: 'accepted'}},
  {owned: 1, price: '0.0001', canBuyAnother: false},
);
assert(s.showBuyAnother === false, 'hide buy another at cap');

s = tillStateFromStatus({
  status: 'open',
  deep_link: 'https://xumm.app/sign/abc',
  qr: 'https://xumm.app/sign/abc_q.png',
});
assert(s.phase === 'open' && s.showOpen === true, 'open shows Xaman');

s = tillStateFromStatus({status: 'signed', mint: {status: 'queued', message: 'Signed. Minting your card…'}});
assert(s.phase === 'minting' && s.showOpen === false, 'signed hides Open in Xaman');
assert(s.message.includes('Minting'), s.message);

s = tillStateFromStatus({
  status: 'signed',
  mint: {status: 'offer', accept_deep_link: 'https://xumm.app/sign/acc', accept_qr: 'https://xumm.app/sign/acc_q.png'},
});
assert(s.phase === 'accept' && s.showOpen === true, 'accept step still needs Xaman');
assert(s.deepLink.endsWith('/acc'), s.deepLink);

s = tillStateFromStatus({status: 'cancelled'});
assert(s.phase === 'cancelled' && s.showOpen === false, 'cancelled hides Open');
assert(s.message === 'Cancelled · nothing charged', s.message);
assert(s.allowRetry === true, 'cancelled allows retry');

s = tillStateFromStatus({status: 'expired', message: 'This sign request closed.'});
assert(s.phase === 'expired' && s.showOpen === false, 'expired hides Open');
assert(s.allowRetry === true, 'expired allows retry');

console.log('aura-till-state tests ok');
