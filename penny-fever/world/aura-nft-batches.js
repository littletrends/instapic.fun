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
  let basketProgress = null;
  let lastPrompt = null, approvalWait = null, wentAway = false;
  const bar = document.createElement('div');
  bar.className = 'aura-tradeshow-tools aura-tradeshow-queue';
  bar.hidden = true;
  const receive = document.createElement('button');
  receive.type = 'button'; receive.textContent = 'Receive Batch';
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
  const guide = document.createElement('p'); guide.dataset.nftBasketProgress = ''; guide.hidden = true;
  const steps = document.createElement('ol'); steps.className = 'aura-nft-checkout-steps'; steps.hidden = true;
  for (const [state, text] of [['signin', 'Wallet'], ['pay', 'Payment'], ['prepare', 'Minting'], ['receive', 'Receive']]) {
    const step = document.createElement('li'); step.dataset.checkoutStep = state; step.textContent = text; steps.append(step);
  }
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
  const resumeHere = document.createElement('button'); resumeHere.type = 'button'; resumeHere.textContent = 'Resume checkout'; resumeHere.hidden = true;
  resumeHere.dataset.nftBatchResumeHere = '';
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel checkout'; cancel.hidden = true;
  cancel.dataset.nftBatchCancel = '';
  const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Back to Tradeshow';
  close.dataset.nftBatchClose = '';
  const next = document.createElement('button'); next.type = 'button'; next.textContent = 'Receive next group · up to 8'; next.hidden = true;
  next.dataset.nftBatchNext = '';
  const exit = document.createElement('button'); exit.type = 'button'; exit.textContent = '×'; exit.className = 'aura-xrp-till-close';
  exit.setAttribute('aria-label', 'Back to Tradeshow'); exit.dataset.nftBatchExit = '';
  const navigation = document.createElement('div'); navigation.className = 'aura-checkout-navigation'; navigation.append(resumeHere, close);
  card.append(exit, title, guide, steps, message, warning, loading, label, start, qr, link, check, cancel, next, navigation);
  panel.append(card); overlay.append(panel);

  const valid = (r, account) => r === revision && account === context.account() && !overlay.hidden && !panel.hidden;
  const stop = () => { clearTimeout(timer); timer = 0; revision++; inFlight = false; };
  const unlink = () => { link.hidden = qr.hidden = true; link.removeAttribute('href'); qr.removeAttribute('src'); };
  function waitForApproval() {
    if (!lastPrompt || lastPrompt.operation !== operation) return;
    approvalWait = lastPrompt;
    paintGuide();
    link.hidden = qr.hidden = true;
    loading.hidden = false;
    message.textContent = 'Checking your Xaman approval… Please wait. Tradeshow will continue automatically.';
  }
  link.addEventListener('click', () => {
    // Keep href until the anchor's normal action opens Xaman. Hide its stale
    // controls immediately so the return screen is visibly a confirmation wait.
    waitForApproval();
  });
  function paintGuide() {
    guide.hidden = !basketProgress;
    guide.textContent = basketProgress ? `Basket · NFT type ${basketProgress.position} of ${basketProgress.total} · ${basketProgress.name} × ${basketProgress.quantity} · ${basketProgress.received} received` : '';
    warning.textContent = basketProgress ? 'Approve the current request in Xaman, then return here. Tradeshow checks it and moves on automatically.'
      : 'Keep this Tradeshow page open. Return here after each Xaman approval. Each group needs your signature.';
    if (activeState === 'prepare') warning.textContent = 'Your payment is confirmed. Preparing your NFTs… No wallet action is needed right now.';
    else if (approvalWait) warning.textContent = 'Please wait here for confirmation. The next wallet request will appear when it is ready.';
    close.textContent = 'Back to Tradeshow';
    close.title = 'Keeps your saved order so you can resume it.';
    check.textContent = basketProgress ? 'Check now' : 'Check / continue';
  }
  async function post(path, data, account = owner) {
    const response = await fetch(API + path, {method: 'POST', cache: 'no-store',
      headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email: account, ...data})});
    const result = await response.json();
    if (!response.ok || result?.ok !== true) throw Object.assign(Error(result?.message || 'Grouped checkout could not connect.'), {code: result?.error});
    return result;
  }
  function paintAvailability() {
    const enabled = !!context.account() && context.enabled();
    receive.hidden = !enabled;
    receive.disabled = !enabled || (pendingKnown && !pendingFailed && !(pendingOffers || context.hasPrepared?.() || pendingBatches));
    resume.hidden = !!context.toolbarResume || !enabled;
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
    lastPrompt = approvalWait = null; wentAway = false; resumeHere.hidden = true;
    activeState = ''; steps.hidden = true; paintGuide();
    cancelling = false;
    panel.hidden = false; label.hidden = start.hidden = true;
    next.hidden = cancel.hidden = true; check.hidden = false;
    loading.hidden = true; unlink(); close.focus();
    check.disabled = cancel.disabled = resumeHere.disabled = false;
  }
  function render(data) {
    operation = data.operation;
    activeState = data.state;
    steps.hidden = data.kind !== 'purchase';
    const phase = ['signin', 'pay', 'prepare', 'receive', 'complete'].indexOf(data.state);
    for (const [index, step] of [...steps.children].entries()) {
      step.classList.toggle('is-done', phase > index);
      if (phase === index) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
    }
    title.textContent = data.kind === 'purchase' ? `${data.quantity} NFT ${data.quantity === 1 ? 'copy' : 'copies'} · paid checkout` : `Receive ${data.quantity} prepared NFTs`;
    const labels = {
      signin: 'Use the wallet linked to this VIP email in Xaman. This sign-in does not charge XRP.',
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
      lastPrompt = {operation: data.operation, href: data.deep_link};
      // A fresh status still requiring approval must restore the real action.
      // Confirmed signatures return prepare/no link, or a receipt-pending error.
      const returning = approvalWait?.operation === data.operation && approvalWait.href === data.deep_link;
      approvalWait = null;
      link.href = data.deep_link; link.hidden = false;
      qr.src = qrDataUrl(data.deep_link, 5, 8); qr.hidden = false;
      if (returning) message.textContent = 'Open the original Xaman request if approval is still needed. If you already signed, wait for confirmation.';
      link.textContent = data.state === 'signin' ? 'Sign wallet in Xaman'
        : data.state === 'pay' ? 'Approve grouped purchase in Xaman' : 'Receive group in Xaman';
    }
    else { lastPrompt = approvalWait = null; }
    paintGuide();
    cancel.hidden = !['signin', 'pay', 'receive'].includes(data.state);
    loading.hidden = FINISHED.has(data.state) || data.needs_review || !link.hidden;
    resumeHere.hidden = !data.needs_review;
    check.hidden = data.state === 'complete';
    next.hidden = !!basketProgress || !FINISHED.has(data.state);
    if (FINISHED.has(data.state)) { stop(); pendingKnown = false; context.refresh(); }
    else if (!data.needs_review) timer = setTimeout(tick, 3000);
    context.checkoutChanged?.(data);
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
      if (['use_different_paying_wallet', 'vip_reward_wallet_already_bound', 'wallet_belongs_to_another_vip',
        'price_changed', 'wallet_cap_reached', 'item_not_for_sale'].includes(error.code)) {
        activeState = 'signin'; cancel.hidden = false; cancel.textContent = 'Cancel checkout';
      }
      context.checkoutError?.({operation, code: error.code, message: error.message, phase: 'status'});
      if (['batch_receipt_pending', 'ledger_unavailable', 'xaman_status'].includes(error.code)) {
        if (error.code === 'xaman_status') {
          approvalWait = null;
          if (lastPrompt?.operation === operation) {
            link.href = lastPrompt.href; link.hidden = false;
            qr.src = qrDataUrl(lastPrompt.href, 5, 8); qr.hidden = false;
          }
          resumeHere.hidden = false; loading.hidden = true;
          message.textContent = 'Xaman status is temporarily unavailable. Open the original request only if approval is still needed.';
          warning.textContent = 'Your existing order is kept. Resume here or return to Tradeshow.';
        } else {
          waitForApproval(); unlink(); resumeHere.hidden = true;
          loading.hidden = false;
          message.textContent = 'Waiting for confirmation… This checkout will continue automatically.';
          warning.textContent = 'No need to open Xaman again while this approval is being confirmed.';
        }
        timer = setTimeout(tick, 4000);
      }
      else { loading.hidden = true; unlink(); resumeHere.hidden = false; warning.textContent = 'Your saved order is paused. Resume it here or return to Tradeshow.'; }
    } finally {
      if (valid(r, account)) { inFlight = false; check.disabled = false; }
    }
  }
  async function create(data, savedOperation = '') {
    if (busy) return;
    busy = true; start.disabled = true; loading.hidden = false;
    operation = savedOperation || crypto.randomUUID();
    const r = revision, account = owner;
    message.textContent = 'Preparing your grouped Xaman request…';
    try {
      const result = await post('', {operation, ...data}, account);
      if (valid(r, account)) { choice = null; label.hidden = start.hidden = true; render(result); }
    } catch (error) {
      if (valid(r, account)) {
        message.textContent = error.message; loading.hidden = true; unlink();
        resumeHere.hidden = false;
        context.checkoutError?.({operation, code: error.code, message: error.message, phase: 'create'});
      }
    } finally {
      if (valid(r, account)) { busy = false; start.disabled = false; }
    }
  }
  async function receiveGroup() {
    if (!context.account() || busy) return;
    basketProgress = null; paintGuide(); steps.hidden = true;
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
    basketProgress = null; paintGuide(); steps.hidden = true;
    show(); operation = ''; choice = null; title.textContent = 'Resume grouped checkout';
    message.textContent = 'Checking your saved grouped checkout…';
    const r = revision, account = owner;
    try {
      const data = await post('/pending', {}, account);
      if (!valid(r, account)) return;
      rememberPending(data);
      if (!data.batches?.length) {
        if (context.recover) {
          stop(); panel.hidden = true; unlink();
          await context.recover();
        } else message.textContent = 'No grouped checkout is waiting. Use Receive batch to check existing offers.';
        return;
      }
      operation = data.batches[0].operation; tick();
    } catch (error) { if (valid(r, account)) message.textContent = error.message; }
  }
  function buy(item) {
    if (!context.canBuy(item) || busy) return;
    basketProgress = null; paintGuide(); steps.hidden = true;
    show(); choice = item; operation = '';
    title.textContent = `Buy copies · ${context.name(item)}`;
    const max = context.maxQuantity(item);
    for (const option of quantity.options) option.disabled = Number(option.value) > max;
    quantity.value = '2';
    label.hidden = start.hidden = false; check.hidden = true;
    message.textContent = 'Choose 2–8 copies. The server checks price, available supply and your wallet limit before opening payment. You sign the total in Xaman.';
  }
  function closePanel() {
    context.checkoutPaused?.(operation);
    stop(); busy = false; cancelling = false; panel.hidden = true; unlink(); resumeHere.hidden = true; lastPrompt = approvalWait = null; pendingKnown = false; context.refresh();
  }
  close.addEventListener('click', closePanel);
  exit.addEventListener('click', closePanel);
  resumeHere.addEventListener('click', async () => {
    if (busy || cancelling || inFlight || !operation || owner !== context.account()) return;
    const r = revision, account = owner;
    resumeHere.disabled = true;
    try {
      await context.checkoutContinued?.(operation);
      if (valid(r, account)) { resumeHere.hidden = true; tick(); }
    } catch (error) {
      if (valid(r, account)) { message.textContent = error.message || 'Could not resume the saved checkout. Your order is kept.'; resumeHere.hidden = false; }
    } finally { if (valid(r, account)) resumeHere.disabled = false; }
  });
  start.addEventListener('click', () => { if (choice) create({kind: 'purchase', item: choice, quantity: Number(quantity.value)}); });
  check.addEventListener('click', () => { waitForApproval(); tick(); });
  next.addEventListener('click', receiveGroup);
  receive.addEventListener('click', receiveGroup);
  resume.addEventListener('click', resumeGroup);
  async function cancelRequest() {
    if (cancelling || !operation) return;
    // A click invalidates any older poll immediately. The server serializes
    // cancellation with reconciliation and refuses to undo a paid transaction.
    stop(); cancelling = true;
    resumeHere.hidden = true;
    cancel.disabled = check.disabled = true;
    unlink(); message.textContent = 'Cancelling this signing request… You can return to the Tradeshow while it is checked.';
    const r = revision, account = owner;
    try {
      const data = await post('/cancel', {operation}, account);
      if (!valid(r, account)) return;
      if (['cancelled', 'expired'].includes(data.state)) {
        await context.checkoutChanged?.(data);
        if (valid(r, account)) closePanel();
      }
      else render(data);
    } catch (error) { if (valid(r, account)) { message.textContent = error.message; loading.hidden = true; } }
    finally { if (valid(r, account)) { cancelling = false; cancel.disabled = check.disabled = false; } }
  }
  cancel.addEventListener('click', cancelRequest);
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.click(); }
    if (event.key !== 'Tab') return;
    const controls = [...card.querySelectorAll('button:not(:disabled),a[href],select')].filter(el => !el.hidden && !el.closest('[hidden]'));
    const index = controls.indexOf(document.activeElement);
    event.preventDefault(); event.stopPropagation();
    controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus();
  });
  function wake() {
    if (document.visibilityState === 'hidden') { wentAway = true; return; }
    if (wentAway) { wentAway = false; waitForApproval(); }
    tick();
  }
  window.addEventListener('blur', () => { if (!panel.hidden && !link.hidden) wentAway = true; });
  document.addEventListener('visibilitychange', wake); window.addEventListener('focus', wake);
  return {
    buy, receive: receiveGroup, resume: resumeGroup,
    basketProgress(value) { basketProgress = value; paintGuide(); },
    purchase(item, count, savedOperation) {
      if (!context.canPaidBuy?.(item) || !Number.isInteger(count) || count < 1 || count > 8
          || count > context.maxQuantity(item) || !/^[a-f0-9-]{36}$/i.test(savedOperation)) {
        throw Error('This paid quantity is unavailable. Review your basket.');
      }
      show(); choice = null; operation = '';
      title.textContent = `Paid basket · ${context.name(item)}`;
      create({kind: 'purchase', item, quantity: count}, savedOperation);
    },
    resumeSaved(savedOperation) {
      if (!context.account() || !/^[a-f0-9-]{36}$/i.test(savedOperation)) return;
      show(); choice = null; operation = savedOperation;
      title.textContent = 'Resume saved paid checkout';
      message.textContent = 'Checking the original saved request…';
      tick();
    },
    cancelSaved(savedOperation) {
      if (!context.account() || !/^[a-f0-9-]{36}$/i.test(savedOperation)) return;
      show(); choice = null; operation = savedOperation;
      title.textContent = 'Cancel saved paid checkout';
      cancel.hidden = false;
      context.checkoutPaused?.(operation);
      cancelRequest();
    },
    refreshPending() {
      pendingRevision++; pendingRead = null; pendingKnown = false;
      paintAvailability(); refreshPending();
    },
    isOpen: () => !panel.hidden,
    close: () => {
      basketProgress = null; paintGuide(); steps.hidden = true;
      resumeHere.hidden = true; lastPrompt = approvalWait = null; wentAway = false;
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
