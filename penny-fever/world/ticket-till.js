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
let selected = null;
let paying = false;
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

async function attachCard() {
  await card?.destroy?.().catch(() => {});
  card = null;
  payments = null;
  const mount = $('pfTillCard');
  if (mount) mount.replaceChildren();
  if (isPreview()) {
    setStatus('This preview till does not charge. Live Square is on instapic.fun.');
    $('pfTillPay').disabled = false;
    $('pfTillPay').textContent = 'Fill this pack · preview only';
    return;
  }
  if (!config.application_id || !config.location_id) {
    setStatus('The till is not connected yet.');
    $('pfTillPay').disabled = true;
    return;
  }
  try {
    setStatus('Opening the card till…');
    const Square = await loadSquareSdk();
    payments = Square.payments(config.application_id, config.location_id);
    card = await payments.card();
    await card.attach('#pfTillCard');
    $('pfTillPay').disabled = !selected;
    $('pfTillPay').textContent = selected ? `Pay ${money(selected.amount_cents)}` : 'Pay with Square';
    setStatus('Card, Apple Pay and Google Pay go through Square. AUD.');
  } catch (err) {
    setStatus(err?.message || 'Square could not open on this device.');
    $('pfTillPay').disabled = true;
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
  pay.textContent = selected ? `Pay ${money(selected.amount_cents)}` : 'Pay with Square';
}

function creditPack(pack, paymentId) {
  if (pack.tickets && apiRef?.addTickets) apiRef.addTickets(pack.tickets);
  if (pack.pennies && apiRef?.addDemoCoins) apiRef.addDemoCoins(pack.pennies);
  apiRef?.stampKeepsake?.('ticket-roll', 'aura-till');
  if (paymentId) {
    try { localStorage.setItem('pf-last-till-payment', paymentId); } catch {}
  }
}

async function pay() {
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
    const tokenResult = await card.tokenize();
    if (tokenResult.status !== 'OK') {
      const msg = tokenResult.errors?.map(e => e.message).filter(Boolean).join('; ') || tokenResult.status;
      throw new Error(msg || 'Card was not accepted.');
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
  } catch (err) {
    setStatus(err?.message || 'The till could not take that payment.');
  } finally {
    paying = false;
    if (till?.open) {
      $('pfTillPay').disabled = !selected || (!isPreview() && !card);
    }
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
    <p class="pf-till-lead">Real money through Square. First walk on the boards is still free.</p>
    <div class="pf-till-packs" id="pfTillPacks"></div>
    <div class="pf-till-pay">
      <div id="pfTillCard"></div>
      <button type="button" class="pf-till-go" id="pfTillPay" disabled>Choose a pack</button>
      <p id="pfTillStatus" role="status"></p>
    </div>`;
  document.body.append(till);
  till.addEventListener('click', e => {
    const pack = e.target.closest('[data-pack]');
    if (pack) choosePack(pack.dataset.pack);
  });
  $('pfTillPay').addEventListener('click', pay);
  till.addEventListener('close', () => { selected = null; paying = false; });
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
