import {qrDataUrl} from './qrcode-generator.js?v=nft-host-11';

const HOST = 'https://motherpc.taild1a44c.ts.net';
const API = HOST + '/api/penny-fever/verified/token-pennies';
const NAMES = {'star-token':'Stars','moon-penny':'Moons','rose-penny':'Roses','crown-token':'Crowns'};
const ERRORS = {
  penny_rate_unavailable: 'A fresh XRP/AUD rate is unavailable. No conversion was started.',
  penny_quote_expired: 'That quote expired. Check the latest price before confirming.',
  penny_exchange_busy: 'Your original conversion is being checked. Please wait and check again.',
  resume_penny_exchange: 'Finish the saved conversion below before starting another.',
  insufficient_verified_tokens: 'There are not enough tokens in your VIP purse. You can choose Pay from Xaman instead.',
  insufficient_wallet_tokens: 'Your connected Xaman wallet does not hold the required tokens.',
  token_pennies_not_open: 'Token conversion is not open yet.',
  connect_wallet_first: 'Connect your assigned Xaman wallet using Wallet / Tokens first.',
  vip_signin_required: 'Please sign into VIP again. Your conversion receipt is preserved.',
  token_wallet_changed: 'Reconnect the wallet used for this quote, then request a fresh quote.',
  penny_payment_source_fixed: 'This conversion already has a payment source. Resume it rather than starting another payment.',
  token_status_busy: 'Xaman payment is already being checked. Please wait a moment.',
  resume_existing_token_request: 'Finish or cancel your pending Wallet / Tokens request first.',
  penny_exchange_not_found: 'That saved conversion is no longer available. Check your current balance and pending conversions below.',
};
const count = value => Number(value).toLocaleString('en-AU');
const identity = () => {
  const provider = window.InstapicGuestIdentity;
  if (!provider?.isVerifiedSessionActive?.()) return null;
  const value = provider.read();
  return {email: String(value.email || '').trim().toLowerCase(), token: String(value.session_token || '')};
};
const savedKey = email => 'pennyFever.tokenPennies.v1:' + email;
let dialog, owner, controller, revision = 0, timer = 0, busy = false, current = null, catalogue = null, resumeWorld = false;
const sameOwner = () => owner && owner.email === identity()?.email && owner.token === identity()?.token;
const find = selector => dialog.querySelector(selector);

function readyPurse() {
  return sameOwner() && window.PennyFeverVerified?.owner === 'vip:' + owner.email && !!window.PennyFeverVerifiedPurse?.accept;
}
async function post(path, data = {}, version = revision) {
  if (!sameOwner()) throw Error('Please reopen the current VIP counter.');
  const response = await fetch(API + path, {method:'POST', cache:'no-store', redirect:'error', signal:controller.signal,
    headers:{'Content-Type':'application/json',Authorization:'Bearer ' + owner.token}, body:JSON.stringify({email:owner.email,...data})});
  const result = await response.json();
  if (version !== revision || !sameOwner()) throw Error('VIP account changed. Reopen the counter.');
  if (!response.ok || result?.ok !== true) throw Object.assign(Error(ERRORS[result?.error] || 'Could not check the conversion. Your saved request is preserved; please try again.'), {code:result?.error});
  return result;
}
function clearSigning() {
  find('[data-exchange-signing]').hidden = true;
  find('[data-exchange-qr]').removeAttribute('src');
  find('[data-exchange-link]').removeAttribute('href');
}
function close() {
  clearTimeout(timer); controller?.abort(); revision++; busy = false; clearSigning();
  if (dialog.open) dialog.close();
  owner = null; current = null;
  if (resumeWorld) window.PennyFeverWorld?.resume?.();
  resumeWorld = false;
}
function controls() {
  const pending = current && !['quoted','complete','cancelled'].includes(current.state);
  find('[data-exchange-token]').disabled = busy || !!pending;
  find('[data-exchange-packs]').disabled = busy || !!pending;
  find('[data-exchange-price]').disabled = busy || !!pending || !catalogue?.enabled || !catalogue.wallet || !readyPurse();
  const quoted = current?.state === 'quoted' && Date.now()/1000 < current.expires_at;
  const walletToken = catalogue?.tokens?.find(token => token.item === current?.item);
  find('[data-exchange-purse]').disabled = busy || !quoted || !readyPurse() || Number(catalogue?.purse?.[current?.item] || 0) < (current?.units || 0);
  find('[data-exchange-xaman]').disabled = busy || !quoted || !readyPurse() || Number(walletToken?.balance || 0) < (current?.units || 0);
  find('[data-exchange-check]').hidden = !pending;
  find('[data-exchange-cancel]').hidden = !current || ['complete','cancelled'].includes(current.state);
  find('[data-exchange-check]').disabled = find('[data-exchange-cancel]').disabled = busy;
}
function balances() {
  const item = find('[data-exchange-token]').value;
  const token = catalogue?.tokens?.find(token => token.item === item);
  find('[data-exchange-balances]').textContent = `${NAMES[item]} · VIP purse: ${count(catalogue?.purse?.[item] || 0)} · Connected Xaman: ${token ? count(token.balance) : 'not connected'}`;
}
async function refresh() {
  catalogue = await post('/catalogue'); balances();
  const pending = catalogue.pending || [];
  const list = find('[data-exchange-pending]'); list.replaceChildren();
  for (const row of pending) {
    const button = document.createElement('button'); button.type = 'button';
    button.textContent = `Resume ${count(row.pennies)} pennies conversion`;
    button.onclick = () => {current = row; localStorage.setItem(savedKey(owner.email),row.id); run('/status');};
    list.append(button);
  }
  controls();
}
function display(row) {
  current = row; clearSigning();
  if (row.item) find('[data-exchange-token]').value = row.item;
  if (row.packs) find('[data-exchange-packs]').value = row.packs;
  balances();
  find('[data-exchange-quote]').textContent = `${count(row.units)} ${NAMES[row.item]} → ${count(row.pennies)} pennies · A$${(row.amount_cents/100).toFixed(2)}. XRP/AUD ${row.xrp_aud}.`;
  const output = find('[data-exchange-message]');
  if (row.state === 'quoted') {
    find('[data-exchange-quote]').textContent = `${count(row.units)} ${NAMES[row.item]} → ${count(row.pennies)} pennies · A$${(row.amount_cents/100).toFixed(2)}. XRP/AUD ${row.xrp_aud}; quote valid until ${new Date(row.expires_at*1000).toLocaleTimeString()}.`;
    output.textContent = 'Choose where to pay from. The same token amount applies to both options.';
  } else if (row.state === 'complete') {
    localStorage.removeItem(savedKey(owner.email));
    if (readyPurse()) window.PennyFeverVerifiedPurse.accept(row.wallet);
    output.textContent = `${count(row.pennies)} pennies added to your VIP game purse. This conversion is complete.`;
    window.dispatchEvent(new Event('pennyfever:statechange'));
    refresh().catch(error => {if (sameOwner()) output.textContent += ' Wallet refresh is waiting; the completed receipt is saved.';});
  } else if (row.state === 'cancelled') {
    localStorage.removeItem(savedKey(owner.email));
    output.textContent = 'Conversion closed without a penny credit. No replacement payment was started.';
    refresh().catch(() => {});
  } else {
    output.textContent = row.state === 'credit_pending'
      ? 'Payment is recorded. Checking your penny credit—do not start another conversion.'
      : row.payment?.cancel_refused
        ? 'Xaman could not cancel this opened request. Reject it in Xaman, then check again. A signed payment will be completed instead.'
        : 'Approve the exact token payment in Xaman, then return here. It converts automatically into pennies after ledger verification. Network fee only; no additional XRP purchase price.';
    const link = row.payment?.deep_link;
    if (typeof link === 'string' && /^https:\/\/(?:xumm|xaman)\.app\/sign\/[0-9a-f-]{36}$/.test(link)) {
      find('[data-exchange-signing]').hidden = false;
      find('[data-exchange-link]').href = link;
      find('[data-exchange-qr]').src = qrDataUrl(link,5,8);
    }
    timer = setTimeout(() => run('/status'),4000);
  }
  controls();
}
async function run(path, mode) {
  if (busy || !current || !sameOwner()) return;
  const version = revision, before = current; clearTimeout(timer); busy = true; controls();
  find('[data-exchange-message]').textContent = path === '/cancel' ? 'Checking before cancelling…' : 'Checking your original conversion…';
  try {
    // Persist the original reference before any spending request. Storage
    // failure stops here; a later retry must recover the same conversion.
    localStorage.setItem(savedKey(owner.email),current.id);
    if (path === '/convert') {
      if (!readyPurse()) throw Error('Choose your VIP player and connect its purse before converting.');
      await window.PennyFeverVerified.flush();
      if (version !== revision || !sameOwner()) return;
      current = {...current, state:'submitting', mode};
      controls();
    }
    const row = await post(path,{exchange:current.id,...(mode ? {mode} : {})},version);
    if (version === revision && sameOwner()) display(row);
  } catch (error) {
    if (version === revision && sameOwner()) {
      find('[data-exchange-message]').textContent = error.message;
      if (path === '/convert' && ['penny_quote_expired','insufficient_verified_tokens','penny_pack_changed'].includes(error.code)) current = before;
      if (error.code === 'penny_exchange_not_found') {
        localStorage.removeItem(savedKey(owner.email));current = null;clearSigning();refresh().catch(() => {});
      } else if (error.code !== 'vip_signin_required' && (path !== '/convert' || !['penny_quote_expired','insufficient_verified_tokens','penny_pack_changed'].includes(error.code))) {
        timer = setTimeout(() => run('/status'),5000);
      }
    }
  } finally {if (version === revision && sameOwner()) {busy = false; controls();}}
}
function mount() {
  if (dialog) return;
  dialog = document.createElement('dialog'); dialog.className = 'pf-token-pennies';
  dialog.setAttribute('aria-labelledby','pfTokenPenniesTitle');
  dialog.innerHTML = `<button type="button" data-exchange-close aria-label="Back to Aura">×</button><h2 id="pfTokenPenniesTitle">Convert tokens for Pennies</h2>
    <p>Spend deposited VIP tokens or pay from your connected Xaman wallet.</p>
    <label>Token <select data-exchange-token>${Object.entries(NAMES).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label>
    <p data-exchange-balances></p><label>Penny packs <input data-exchange-packs type="number" inputmode="numeric" min="1" max="100" value="1"></label>
    <small data-exchange-pack>Each pack follows Aura’s current AUD penny price.</small>
    <button type="button" data-exchange-price>Get conversion quote</button><button type="button" data-exchange-wallet>Connect / check Xaman</button>
    <p data-exchange-quote></p><button type="button" data-exchange-purse disabled>Use VIP purse</button><button type="button" data-exchange-xaman disabled>Pay from Xaman</button>
    <p data-exchange-message role="status" aria-live="polite"></p><div data-exchange-signing hidden><img data-exchange-qr alt="Scan payment with Xaman" width="220" height="220"><a data-exchange-link target="_blank" rel="noopener noreferrer">Open in Xaman</a></div>
    <button type="button" data-exchange-check hidden>Check conversion</button><button type="button" data-exchange-cancel hidden>Cancel conversion</button><div data-exchange-pending></div>
    <small>Aura’s token rates are converted using a fresh XRP/AUD market reference. Pennies are game credit; conversion does not mint artwork or reset earned rewards.</small>`;
  document.body.append(dialog);
  find('[data-exchange-close]').onclick = close;
  dialog.addEventListener('cancel',event => {event.preventDefault();close();});
  window.addEventListener('keydown',event => {if (dialog.open && event.key === 'Escape') {event.preventDefault();event.stopImmediatePropagation();close();}},true);
  for (const selector of ['[data-exchange-token]','[data-exchange-packs]']) find(selector).addEventListener('change',() => {
    if (current?.state === 'quoted') {current = null; find('[data-exchange-quote]').textContent = '';}
    balances();controls();
  });
  find('[data-exchange-price]').onclick = async () => {
    if (busy || !sameOwner()) return;
    const version = revision;busy = true;controls();
    try {
      const text = find('[data-exchange-packs]').value;
      if (!/^[0-9]{1,3}$/.test(text) || Number(text)<1 || Number(text)>100) throw Error('Choose 1 to 100 penny packs.');
      const row = await post('/quote',{item:find('[data-exchange-token]').value,packs:Number(text)},version);
      if (version === revision && sameOwner()) display(row);
    } catch (error) {if (version === revision && sameOwner()) find('[data-exchange-message]').textContent = error.message;}
    finally {if (version === revision && sameOwner()) {busy = false;controls();}}
  };
  find('[data-exchange-purse]').onclick = () => run('/convert','purse');
  find('[data-exchange-xaman]').onclick = () => run('/convert','xaman');
  find('[data-exchange-check]').onclick = () => run('/status');
  find('[data-exchange-cancel]').onclick = () => run('/cancel');
  find('[data-exchange-wallet]').onclick = () => {close();window.dispatchEvent(new CustomEvent('pennyfever:token-shop',{detail:{item:'star-token'}}));};
}
async function open() {
  if (dialog?.open) return;
  mount();owner = identity();if (!owner) return;
  controller?.abort();controller = new AbortController();revision++;busy = false;current = null;catalogue = null;
  const version = revision;clearSigning();find('[data-exchange-quote]').textContent = '';
  find('[data-exchange-message]').textContent = 'Checking your VIP purse and connected Xaman wallet…';
  const world = window.PennyFeverWorld;resumeWorld = !!(world?.started && !world.paused);if (resumeWorld) world.pause();
  dialog.showModal();controls();
  try {
    await refresh();if (version !== revision || !sameOwner()) return;
    find('[data-exchange-pack]').textContent = `${count(catalogue.pack.pennies)} pennies per pack · A$${(catalogue.pack.amount_cents/100).toFixed(2)}.`;
    find('[data-exchange-message]').textContent = !catalogue.enabled ? 'Token conversion is not open yet.'
      : !readyPurse() ? 'Choose your VIP player and connect its game purse before converting.' : 'Choose a token and request a quote. Nothing is spent until you confirm.';
    const saved = localStorage.getItem(savedKey(owner.email));
    if (saved) {current = {id:saved,state:'awaiting_payment'};await run('/status');}
  } catch (error) {if (version === revision && sameOwner()) find('[data-exchange-message]').textContent = error.message;}
}
function discover() {
  for (const id of ['auraCounterLoan','pfTillLoan']) {
    const anchor = document.getElementById(id);if (!anchor || document.getElementById(id+'TokenPennies')) continue;
    const button = document.createElement('button');button.type = 'button';button.id = id+'TokenPennies';button.dataset.tokenPenniesOpen = '';
    button.className = anchor.className;button.textContent = identity() ? 'Convert tokens for Pennies' : 'Join VIP to convert tokens';button.disabled = !identity();
    button.onclick = open;anchor.insertAdjacentElement('beforebegin',button);
  }
}
new MutationObserver(records => {if (records.some(record => [...record.addedNodes].some(node => node.nodeType===1 &&
  (['auraCounterLoan','pfTillLoan'].includes(node.id) || node.querySelector?.('#auraCounterLoan,#pfTillLoan'))))) discover();}).observe(document.body,{childList:true,subtree:true});
function wake() {
  if (dialog?.open && !sameOwner()) close();
  for (const button of document.querySelectorAll('[data-token-pennies-open]')) {button.disabled = !identity();button.textContent = identity() ? 'Convert tokens for Pennies' : 'Join VIP to convert tokens';}
  if (dialog?.open && !busy && current && !['quoted','complete','cancelled'].includes(current.state)) run('/status');
}
window.addEventListener('focus',wake);window.addEventListener('storage',wake);
window.addEventListener('pennyfever:statechange',wake);
document.addEventListener('visibilitychange',() => {if (!document.hidden) wake();});
setInterval(() => {if (dialog?.open && !sameOwner()) close();if (dialog?.open) controls();},1000);
discover();
