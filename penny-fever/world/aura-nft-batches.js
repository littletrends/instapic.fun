import {qrDataUrl} from './qrcode-generator.js?v=nft-host-11';

const API = 'https://motherpc.taild1a44c.ts.net/api/penny-fever/verified/nft-batch';
const FINISHED = new Set(['complete', 'cancelled', 'expired']);

// This UI only selects server-held orders. Wallet addresses, prices, paid flags,
// reward proofs and transaction hashes are never supplied as authority.
export function mountNftBatches(overlay, context) {
  let owner = '', operation = '', timer = 0, revision = 0, busy = false;
  let choice = null, inFlight = false, cancelling = false;
  let pendingOwner = '', pendingKnown = false, pendingFailed = false;
  let pendingOffers = 0, pendingBatches = 0, pendingRead = null, pendingRevision = 0;
  let activeState = '';
  const bar = document.createElement('div');
  bar.className = 'aura-tradeshow-tools aura-tradeshow-queue';
  bar.hidden = true;
  const receive = document.createElement('button');
  receive.type = 'button'; receive.textContent = 'Receive NFTs';
  receive.title = 'Receive up to 8 prepared NFTs together';
  receive.dataset.nftBatchReceive = '';
  const resume = document.createElement('button');
  resume.type = 'button'; resume.textContent = 'Resume Checkout';
  resume.dataset.nftBatchResume = '';
  bar.append(receive, resume);
  overlay.querySelector('.aura-collection-actions').append(bar);

  const panel = document.createElement('div');
  panel.className = 'aura-xrp-till'; panel.hidden = true;
  panel.dataset.nftBatchPanel = '';
  const card = document.createElement('div');
  card.className = 'aura-xrp-till-card';
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'auraNftBatchTitle');
  const title = document.createElement('h2'); title.id = 'auraNftBatchTitle';
  const message = document.createElement('p'); message.setAttribute('role', 'status');
  const warning = document.createElement('p');
  warning.textContent = 'Keep this Tradeshow page open. Return here after each Xaman approval. Each group needs your signature.';
  const loading = document.createElement('progress'); loading.setAttribute('aria-label', 'Preparing grouped checkout');
  loading.hidden = true;
  const label = document.createElement('label'); label.textContent = 'Number of copies ';
  const quantity = document.createElement('select'); quantity.setAttribute('aria-label', 'Number of copies');
  for (let n = 2; n <= 8; n++) {
    const option = document.createElement('option'); option.value = String(n); option.textContent = String(n); quantity.append(option);
  }
  label.append(quantity);
  const start = document.createElement('button'); start.type = 'button'; start.textContent = 'Continue to Xaman';
  start.dataset.nftBatchStart = '';
  const qr = document.createElement('img'); qr.width = qr.height = 220; qr.alt = 'Scan with Xaman'; qr.hidden = true;
  const link = document.createElement('a'); link.className = 'aura-xrp-till-open';
  link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Open in Xaman'; link.hidden = true;
  const check = document.createElement('button'); check.type = 'button'; check.textContent = 'Check / continue';
  check.dataset.nftBatchCheck = '';
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel unsigned request'; cancel.hidden = true;
  cancel.dataset.nftBatchCancel = '';
  const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Back to Tradeshow';
  close.dataset.nftBatchClose = '';
  const next = document.createElement('button'); next.type = 'button'; next.textContent = 'Receive next group · up to 8'; next.hidden = true;
  next.dataset.nftBatchNext = '';
  card.append(title, message, warning, loading, label, start, qr, link, check, cancel, next, close);
  panel.append(card); overlay.append(panel);

  const valid = (r, account) => r === revision && account === context.account() && !overlay.hidden && !panel.hidden;
  const stop = () => { clearTimeout(timer); timer = 0; revision++; inFlight = false; };
  const unlink = () => { link.hidden = qr.hidden = true; link.removeAttribute('href'); qr.removeAttribute('src'); };
  async function post(path, data, account = owner) {
    const response = await fetch(API + path, {method: 'POST', cache: 'no-store',
      headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email: account, ...data})});
    const result = await response.json();
    if (!response.ok || result?.ok !== true) throw Object.assign(Error(result?.message || 'Grouped checkout could not connect.'), {code: result?.error});
    return result;
  }
  function paintAvailability() {
    const enabled = !!context.account() && context.enabled();
    receive.hidden = !enabled || !(pendingOffers || context.hasPrepared?.());
    resume.hidden = !enabled || !(pendingBatches || pendingFailed || (operation && activeState && !FINISHED.has(activeState)));
    bar.hidden = !enabled || (receive.hidden && resume.hidden);
  }
  function rememberPending(data) {
    pendingKnown = true; pendingFailed = false;
    pendingOffers = Array.isArray(data.offers) ? data.offers.length : 0;
    pendingBatches = Array.isArray(data.batches) ? data.batches.length : 0;
    paintAvailability();
  }
  function refreshPending() {
    if (pendingKnown || pendingRead || !context.account() || !context.enabled() || overlay.hidden) return;
    const account = context.account(), version = pendingRevision;
    const reading = post('/pending', {}, account).then(data => {
      if (version === pendingRevision && account === context.account() && !overlay.hidden) rememberPending(data);
    }).catch(() => {
      if (version === pendingRevision && account === context.account() && !overlay.hidden) {
        pendingKnown = true; pendingFailed = true; paintAvailability();
      }
    }).finally(() => { if (pendingRead === reading) pendingRead = null; });
    pendingRead = reading;
  }
  function show() {
    stop(); context.pause(); owner = context.account();
    cancelling = false;
    panel.hidden = false; label.hidden = start.hidden = true;
    next.hidden = cancel.hidden = true; check.hidden = false;
    loading.hidden = true; unlink(); close.focus();
    check.disabled = cancel.disabled = false;
  }
  function render(data) {
    operation = data.operation;
    activeState = data.state;
    title.textContent = data.kind === 'purchase' ? `${data.quantity} NFT copies · grouped checkout` : `Receive ${data.quantity} prepared NFTs`;
    const labels = {
      signin: 'Choose and sign into your paying wallet in Xaman. This sign-in does not charge XRP.',
      pay: `Approve ${data.total_xrp} XRP total in Xaman. Network fee is separate.`,
      prepare: `${data.prepared} of ${data.quantity} NFTs prepared. Keep this page open while minting continues.`,
      receive: `Receive ${data.signing_count || data.quantity} NFTs with this Xaman approval. No further purchase price.`,
      complete: `${data.received} NFTs received. Your wallet and Tradeshow will refresh.`,
      cancelled: 'This grouped request was cancelled. Any already purchased NFTs remain available to receive.',
      expired: 'This signing request expired. Check your wallet; already prepared NFTs are available to receive again.',
    };
    message.textContent = data.message || labels[data.state] || 'Checking your existing Xaman request…';
    unlink();
    if (typeof data.deep_link === 'string' && /^https:\/\/(?:xumm|xaman)\.app\//.test(data.deep_link)) {
      link.href = data.deep_link; link.hidden = false;
      qr.src = qrDataUrl(data.deep_link, 5, 8); qr.hidden = false;
      link.textContent = data.state === 'signin' ? 'Sign wallet in Xaman'
        : data.state === 'pay' ? 'Approve grouped purchase in Xaman' : 'Receive group in Xaman';
    }
    cancel.hidden = !['signin', 'pay', 'receive'].includes(data.state);
    loading.hidden = FINISHED.has(data.state) || data.needs_review;
    check.hidden = data.state === 'complete';
    next.hidden = !FINISHED.has(data.state);
    if (FINISHED.has(data.state)) { stop(); pendingKnown = false; context.refresh(); }
    else if (!data.needs_review) timer = setTimeout(tick, 3000);
  }
  async function tick() {
    if (cancelling || inFlight || !operation || panel.hidden || overlay.hidden || owner !== context.account()) return;
    clearTimeout(timer); timer = 0;
    const r = revision, account = owner;
    inFlight = true; check.disabled = true;
    try {
      const result = await post('/status', {operation}, account);
      if (valid(r, account)) render(result);
    } catch (error) {
      if (!valid(r, account)) return;
      message.textContent = error.message;
      if (error.code === 'batch_receipt_pending') timer = setTimeout(tick, 4000);
      else { loading.hidden = true; unlink(); }
    } finally {
      if (valid(r, account)) { inFlight = false; check.disabled = false; }
    }
  }
  async function create(data) {
    if (busy) return;
    busy = true; start.disabled = true; loading.hidden = false;
    operation = crypto.randomUUID();
    const r = revision, account = owner;
    message.textContent = 'Preparing your grouped Xaman request…';
    try {
      const result = await post('', {operation, ...data}, account);
      if (valid(r, account)) { choice = null; label.hidden = start.hidden = true; render(result); }
    } catch (error) {
      if (valid(r, account)) { message.textContent = error.message; loading.hidden = true; unlink(); }
    } finally {
      if (valid(r, account)) { busy = false; start.disabled = false; }
    }
  }
  async function receiveGroup() {
    if (!context.account() || busy) return;
    show(); operation = ''; choice = null;
    title.textContent = 'Receive NFTs · up to 8 together';
    message.textContent = 'Checking existing NFT offers for your VIP account…';
    const r = revision, account = owner;
    try {
      const data = await post('/pending', {}, account);
      if (!valid(r, account)) return;
      rememberPending(data);
      if (data.batches?.length) { operation = data.batches[0].operation; tick(); return; }
      const first = data.offers?.[0];
      if (!first) { message.textContent = 'No prepared NFTs are waiting to be received. Prepare your collected rewards first, or check your wallet.'; return; }
      const orders = data.offers.filter(row => row.wallet === first.wallet).slice(0, 8).map(row => row.order);
      await create({kind: 'receive', orders});
    } catch (error) {
      if (valid(r, account)) message.textContent = error.message;
    }
  }
  async function resumeGroup() {
    show(); operation = ''; choice = null; title.textContent = 'Resume grouped checkout';
    message.textContent = 'Checking your saved grouped checkout…';
    const r = revision, account = owner;
    try {
      const data = await post('/pending', {}, account);
      if (!valid(r, account)) return;
      rememberPending(data);
      if (!data.batches?.length) { message.textContent = 'No grouped checkout is waiting. Use Receive prepared NFTs to check existing offers.'; return; }
      operation = data.batches[0].operation; tick();
    } catch (error) { if (valid(r, account)) message.textContent = error.message; }
  }
  function buy(item) {
    if (!context.canBuy(item) || busy) return;
    show(); choice = item; operation = '';
    title.textContent = `Buy copies · ${context.name(item)}`;
    const max = context.maxQuantity(item);
    for (const option of quantity.options) option.disabled = Number(option.value) > max;
    quantity.value = '2';
    label.hidden = start.hidden = false; check.hidden = true;
    message.textContent = 'Choose 2–8 copies. The server checks price, available supply and your wallet limit before opening payment. You sign the total in Xaman.';
  }
  function closePanel() {
    stop(); busy = false; cancelling = false; panel.hidden = true; unlink(); pendingKnown = false; context.refresh();
  }
  close.addEventListener('click', closePanel);
  start.addEventListener('click', () => { if (choice) create({kind: 'purchase', item: choice, quantity: Number(quantity.value)}); });
  check.addEventListener('click', tick);
  next.addEventListener('click', receiveGroup);
  receive.addEventListener('click', receiveGroup);
  resume.addEventListener('click', resumeGroup);
  cancel.addEventListener('click', async () => {
    if (cancelling || !operation) return;
    // A click invalidates any older poll immediately. The server serializes
    // cancellation with reconciliation and refuses to undo a paid transaction.
    stop(); cancelling = true;
    cancel.disabled = check.disabled = true;
    unlink(); message.textContent = 'Cancelling this signing request… You can return to the Tradeshow while it is checked.';
    const r = revision, account = owner;
    try {
      const data = await post('/cancel', {operation}, account);
      if (!valid(r, account)) return;
      if (['cancelled', 'expired'].includes(data.state)) closePanel();
      else render(data);
    } catch (error) { if (valid(r, account)) { message.textContent = error.message; loading.hidden = true; } }
    finally { if (valid(r, account)) { cancelling = false; cancel.disabled = check.disabled = false; } }
  });
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.click(); }
    if (event.key !== 'Tab') return;
    const controls = [...card.querySelectorAll('button:not(:disabled),a[href],select')].filter(el => !el.hidden && !el.closest('[hidden]'));
    const index = controls.indexOf(document.activeElement);
    event.preventDefault(); event.stopPropagation();
    controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus();
  });
  function wake() { if (document.visibilityState !== 'hidden') tick(); }
  document.addEventListener('visibilitychange', wake); window.addEventListener('focus', wake);
  return {
    buy, receive: receiveGroup,
    isOpen: () => !panel.hidden,
    close: () => {
      stop(); busy = false; cancelling = false; panel.hidden = true; unlink();
      pendingRevision++; pendingRead = null; pendingKnown = pendingFailed = false;
      pendingOwner = ''; pendingOffers = pendingBatches = 0; operation = activeState = '';
    },
    paint() {
      if (pendingOwner !== context.account()) {
        pendingOwner = context.account(); pendingRevision++; pendingRead = null;
        pendingKnown = pendingFailed = false; pendingOffers = pendingBatches = 0; operation = activeState = '';
      }
      paintAvailability();
      refreshPending();
      if (!panel.hidden && owner !== context.account()) { stop(); busy = false; panel.hidden = true; unlink(); }
      // Never start a transaction just because the catalogue was repainted.
    },
  };
}
