const API_BASE = 'https://motherpc.taild1a44c.ts.net';
const FALLBACK_PACKS = [
  {id:'PF_STRIP', name:'Ticket strip', blurb:'Five booth tickets from Aura’s roll. One ticket enters a stall.', amount_cents:500, tickets:5, pennies:0},
  {id:'PF_ROLL', name:'Penny pack', blurb:'Ten pennies for another lap and the machines.', amount_cents:500, tickets:0, pennies:10},
  {id:'PF_POCKET', name:'Pocket pack', blurb:'Five tickets and ten pennies — enough for a little wander.', amount_cents:800, tickets:5, pennies:10},
];
const FALLBACK_SQUARE = {
  application_id: 'sq0idp-tUY7HoJ1TvvIAYwpsIh2KQ',
  location_id: '9ZKNKQJ29QF50',
};

let apiRef = null;
let till = null;
let card = null;
let payments = null;
let applePay = null;
let googlePay = null;
let selected = null;
let paying = false;
let walletSeq = 0;
let config = {packs: FALLBACK_PACKS, ...FALLBACK_SQUARE, square_ready: false, currency: 'AUD'};

const money = cents => `$${(Number(cents || 0) / 100).toFixed(2)}`;
const previewHost = () => {
  const host = location.hostname;
  return host === '127.0.0.1' || host === 'localhost';
};
const $ = (id, root = till) => root?.querySelector('#' + id);
function setStatus(text) {
  const el = $('pfTillStatus');
  if (el) el.textContent = text || '';
}

function packLine(pack) {
  const bits = [];
  if (pack.tickets) bits.push(pack.tickets === 1 ? '1 ticket' : pack.tickets + ' tickets');
  if (pack.pennies) bits.push(pack.pennies === 1 ? '1 penny' : pack.pennies + ' pennies');
  return bits.join(' · ') || 'Scrip';
}

function isPreview() {
  return previewHost();
}

export function closeTill() {
  if (!till?.open) return;
  till.close();
}

async function loadSquareSdk() {
  if (window.Square) return window.Square;
  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-pf-square]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Square did not load')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://web.squarecdn.com/v1/square.js';
    script.async = true;
    script.dataset.pfSquare = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Square did not load'));
    document.head.appendChild(script);
  });
  if (!window.Square) throw new Error('Square did not load');
  return window.Square;
}

function paymentRequest() {
  return payments.paymentRequest({
    countryCode: 'AU',
    currencyCode: 'AUD',
    total: {
      amount: (Number(selected?.amount_cents || 0) / 100).toFixed(2),
      label: 'Penny Fever · ' + (selected?.name || 'Aura’s till'),
    },
  });
}

function styleApplePayButton(btn) {
  btn.type = 'button';
  btn.hidden = true;
  btn.style.display = 'none';
  btn.classList.add('apple-pay-button');
  btn.setAttribute('lang', 'en');
  btn.setAttribute('aria-label', 'Pay with Apple Pay');
  btn.style.setProperty('-webkit-appearance', '-apple-pay-button');
  btn.style.setProperty('-apple-pay-button-type', 'pay');
  btn.style.setProperty('-apple-pay-button-style', 'black');
  btn.textContent = '';
  if (!CSS.supports || !CSS.supports('-webkit-appearance', '-apple-pay-button')) {
    btn.classList.add('apple-pay-button-fallback');
    btn.innerHTML =
      '<span class="apple-pay-fallback-label">' +
      '<svg class="apple-pay-mark" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M16.365 12.23c-.03-2.22 1.81-3.29 1.89-3.34-1.03-1.51-2.64-1.72-3.21-1.74-1.37-.14-2.67.8-3.36.8-.7 0-1.77-.78-2.91-.76-1.5.02-2.88.87-3.65 2.21-1.56 2.7-.4 6.7 1.12 8.89.74 1.07 1.62 2.27 2.78 2.23 1.12-.05 1.54-.72 2.89-.72 1.34 0 1.72.72 2.9.7 1.2-.02 1.96-1.09 2.69-2.17.85-1.24 1.2-2.44 1.22-2.5-.03-.01-2.33-.89-2.36-3.6zm-2.2-6.5c.62-.75 1.04-1.79.92-2.83-.89.04-1.97.59-2.61 1.34-.57.66-1.07 1.72-.94 2.73 1 .08 2.02-.51 2.63-1.24z"/>' +
      '</svg>Pay with&nbsp;<strong>Apple&nbsp;Pay</strong></span>';
  }
  return btn;
}

function hideApplePay() {
  const btn = $('pfApplePay');
  applePay = null;
  if (!btn) return;
  btn.hidden = true;
  btn.style.display = 'none';
}

async function destroyGooglePay() {
  const wrap = $('pfGooglePayWrap');
  const mount = $('pfGooglePay');
  if (googlePay && typeof googlePay.destroy === 'function') {
    try { await googlePay.destroy(); } catch {}
  }
  googlePay = null;
  if (mount) mount.replaceChildren();
  if (wrap) wrap.hidden = true;
}

function updateWalletChrome() {
  const appleBtn = $('pfApplePay');
  const googleWrap = $('pfGooglePayWrap');
  const divider = $('pfTillOr');
  const appleOn = !!(appleBtn && !appleBtn.hidden && appleBtn.style.display !== 'none');
  const googleOn = !!(googleWrap && !googleWrap.hidden);
  if (divider) divider.hidden = !(appleOn || googleOn);
  const parts = [];
  if (appleOn) parts.push('Apple Pay');
  if (googleOn) parts.push('Google Pay');
  if (parts.length) setStatus(parts.join(' and ') + ' available on this device. Desktop Apple Pay may show a phone QR.');
  else if (selected) setStatus('Pay securely by card below. AUD.');
}

async function refreshApplePay() {
  const btn = $('pfApplePay');
  if (!btn || !payments || !selected) return false;
  hideApplePay();
  styleApplePayButton(btn);
  try {
    applePay = await payments.applePay(paymentRequest());
    btn.hidden = false;
    btn.style.display = btn.classList.contains('apple-pay-button-fallback') ? 'flex' : 'block';
    btn.style.visibility = 'visible';
    btn.style.opacity = '1';
    return true;
  } catch (err) {
    applePay = null;
    hideApplePay();
    console.warn('Apple Pay availability', err);
    return false;
  }
}

async function refreshGooglePay() {
  const wrap = $('pfGooglePayWrap');
  const mount = $('pfGooglePay');
  if (!wrap || !mount || !payments || !selected) return false;
  await destroyGooglePay();
  try {
    googlePay = await payments.googlePay(paymentRequest());
    await googlePay.attach('#pfGooglePay', {
      buttonColor: 'black',
      buttonType: 'long',
      buttonSizeMode: 'fill',
    });
    wrap.hidden = false;
    return true;
  } catch (err) {
    googlePay = null;
    wrap.hidden = true;
    if (mount) mount.replaceChildren();
    console.warn('Google Pay availability', err);
    return false;
  }
}

async function refreshWallets() {
  if (isPreview() || !payments || !selected) {
    updateWalletChrome();
    return;
  }
  const seq = ++walletSeq;
  setStatus('Checking Apple Pay and Google Pay…');
  await refreshApplePay();
  if (seq !== walletSeq) return;
  await refreshGooglePay();
  if (seq !== walletSeq) return;
  updateWalletChrome();
}

async function attachCard() {
  await card?.destroy?.().catch(() => {});
  card = null;
  const mount = $('pfTillCard');
  if (mount) mount.replaceChildren();
  const pay = $('pfTillPay');
  if (isPreview()) {
    setStatus('This preview till does not charge. Live Square is on instapic.fun.');
    pay.disabled = !selected;
    pay.textContent = selected ? 'Fill this pack · preview only' : 'Choose a pack';
    $('pfTillOr').hidden = true;
    hideApplePay();
    await destroyGooglePay();
    return;
  }
  if (!config.application_id || !config.location_id) {
    setStatus('The till is not connected yet.');
    pay.disabled = true;
    return;
  }
  try {
    setStatus('Opening the card till…');
    const Square = await loadSquareSdk();
    payments = Square.payments(config.application_id, config.location_id);
    card = await payments.card();
    await card.attach('#pfTillCard');
    pay.disabled = !selected;
    pay.textContent = selected ? `Pay ${money(selected.amount_cents)} by card` : 'Pay with card';
    await refreshWallets();
  } catch (err) {
    setStatus(err?.message || 'Square could not open on this device.');
    pay.disabled = true;
  }
}

function paintPacks() {
  const list = $('pfTillPacks');
  if (!list) return;
  list.replaceChildren();
  for (const pack of config.packs) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pf-till-pack';
    button.dataset.pack = pack.id;
    button.setAttribute('aria-pressed', String(selected?.id === pack.id));
    button.innerHTML = `<strong>${pack.name}</strong><em>${money(pack.amount_cents)} AUD</em><span>${packLine(pack)}</span><small>${pack.blurb}</small>`;
    list.append(button);
  }
}

function choosePack(id) {
  selected = config.packs.find(p => p.id === id) || null;
  till.querySelectorAll('[data-pack]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pack === selected?.id)));
  const pay = $('pfTillPay');
  if (isPreview()) {
    pay.disabled = !selected;
    pay.textContent = selected ? 'Fill this pack · preview only' : 'Choose a pack';
    setStatus('Preview till — no charge. Live Square is on instapic.fun.');
    return;
  }
  pay.disabled = !selected || !card;
  pay.textContent = selected ? `Pay ${money(selected.amount_cents)} by card` : 'Pay with card';
  if (payments && selected) refreshWallets();
}

function creditPack(pack, paymentId) {
  if (pack.tickets && apiRef?.addTickets) apiRef.addTickets(pack.tickets);
  if (pack.pennies && apiRef?.addDemoCoins) apiRef.addDemoCoins(pack.pennies);
  apiRef?.stampKeepsake?.('ticket-roll', 'aura-till');
  if (paymentId) {
    try { localStorage.setItem('pf-last-till-payment', paymentId); } catch {}
  }
}

async function chargeToken(tokenResult, label) {
  if (tokenResult.status !== 'OK') {
    const msg = tokenResult.errors?.map(e => e.message).filter(Boolean).join('; ') || tokenResult.status;
    throw new Error(msg || label + ' was not accepted.');
  }
  const res = await fetch(`${API_BASE}/api/penny-fever/pay-pack`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      package_id: selected.id,
      amount_cents: selected.amount_cents,
      source_id: tokenResult.token,
      verification_token: tokenResult.verificationToken || null,
      idempotency_key: crypto.randomUUID?.() || String(Date.now()),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || data.details || `Payment failed (${res.status})`);
  }
  creditPack({
    tickets: Number(data.tickets) || selected.tickets,
    pennies: Number(data.pennies) || selected.pennies,
  }, data.payment_id);
  setStatus(`Paid. ${packLine(selected)} in your pocket.`);
  closeTill();
}

async function payWithCard() {
  if (paying || !selected) return;
  paying = true;
  $('pfTillPay').disabled = true;
  try {
    if (isPreview()) {
      creditPack(selected, 'preview');
      setStatus(`Preview fill. ${packLine(selected)} in your pocket.`);
      closeTill();
      return;
    }
    if (!card) throw new Error('The card till is not ready.');
    setStatus('Talking to Square…');
    await chargeToken(await card.tokenize(), 'Card');
  } catch (err) {
    setStatus(err?.message || 'The till could not take that payment.');
  } finally {
    paying = false;
    if (till?.open) $('pfTillPay').disabled = !selected || (!isPreview() && !card);
  }
}

async function payWithApple() {
  if (paying || !selected || !applePay) return;
  paying = true;
  try {
    setStatus('Apple Pay… scan the QR on a phone if this is a laptop.');
    await chargeToken(await applePay.tokenize(), 'Apple Pay');
  } catch (err) {
    setStatus(err?.message || 'Apple Pay did not finish.');
  } finally {
    paying = false;
  }
}

async function payWithGoogle() {
  if (paying || !selected || !googlePay) return;
  paying = true;
  try {
    setStatus('Google Pay…');
    await chargeToken(await googlePay.tokenize(), 'Google Pay');
  } catch (err) {
    setStatus(err?.message || 'Google Pay did not finish.');
  } finally {
    paying = false;
  }
}

async function refreshConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/penny-fever/till`, {headers: {'Accept': 'application/json'}});
    const data = await res.json();
    if (!res.ok || data.ok === false) throw new Error(data.error || 'till');
    config = {
      packs: Array.isArray(data.packs) && data.packs.length ? data.packs : FALLBACK_PACKS,
      application_id: data.application_id || FALLBACK_SQUARE.application_id,
      location_id: data.location_id || FALLBACK_SQUARE.location_id,
      square_ready: !!data.square_ready,
      currency: data.currency || 'AUD',
    };
  } catch {
    config = {packs: FALLBACK_PACKS, ...FALLBACK_SQUARE, square_ready: false, currency: 'AUD'};
  }
  paintPacks();
  if (selected) choosePack(selected.id);
}

export function mountTill(api) {
  apiRef = api;
  if (document.querySelector('dialog.aura-till')) {
    till = document.querySelector('dialog.aura-till');
    return;
  }
  till = document.createElement('dialog');
  till.className = 'aura-till';
  till.setAttribute('aria-labelledby', 'pfTillTitle');
  till.innerHTML = `
    <form method="dialog"><button class="pf-till-close" aria-label="Close the till">×</button></form>
    <p class="pf-till-kicker">Aura’s ticket booth</p>
    <h2 id="pfTillTitle">Tickets and pennies</h2>
    <p class="pf-till-lead">Real money through Square — Apple Pay, Google Pay or card. First walk on the boards is still free.</p>
    <div class="pf-till-packs" id="pfTillPacks"></div>
    <div class="pf-till-pay">
      <div class="pf-till-wallets" id="pfTillWallets">
        <div class="pf-apple-wrap">
          <button id="pfApplePay" type="button" hidden style="display:none"></button>
        </div>
        <div class="pf-google-wrap" id="pfGooglePayWrap" hidden>
          <div id="pfGooglePay"></div>
        </div>
      </div>
      <p class="pf-till-or" id="pfTillOr" hidden>or pay by card</p>
      <div id="pfTillCard"></div>
      <button type="button" class="pf-till-go" id="pfTillPay" disabled>Choose a pack</button>
      <p id="pfTillStatus" role="status"></p>
    </div>`;
  document.body.append(till);
  till.addEventListener('click', e => {
    const pack = e.target.closest('[data-pack]');
    if (pack) choosePack(pack.dataset.pack);
  });
  $('pfTillPay').addEventListener('click', payWithCard);
  $('pfApplePay').addEventListener('click', e => {
    e.preventDefault();
    payWithApple();
  });
  $('pfGooglePay').addEventListener('click', e => {
    if (!googlePay) return;
    e.preventDefault();
    payWithGoogle();
  }, true);
  till.addEventListener('close', () => {
    selected = null;
    paying = false;
    walletSeq += 1;
  });
  paintPacks();
}

export async function openTill() {
  if (!till) mountTill(apiRef);
  await refreshConfig();
  if (!till.open) {
    try { till.showModal(); }
    catch { till.setAttribute('open', ''); }
  }
  if (config.packs[0] && !selected) choosePack(config.packs[0].id);
  await attachCard();
}
