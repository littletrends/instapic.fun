import {TOKEN_TERMS, EVERYDAY_IDS} from './token-economy.js?v=bank-purse-1';
import {parkLabel, parkSign, parkStatus} from '../paper-games/park-doors.js?v=map-doors-3';
import {stallById, stalls} from './items/midway.js?v=nft-board-1';
import {qrDataUrl} from './qrcode-generator.js?v=nft-host-11';
import {rememberTradeshowReturn} from './tradeshow-navigation.js?v=aura-return-1';
import {tillStateFromStatus} from './aura-till-state.js?v=paid-receipts-1';
import {mountNftBatches} from './aura-nft-batches.js?v=clear-tradeshow-1';
import {mountPaidNftBasket} from './aura-paid-basket.js?v=paid-basket-1';

export const SHOW_ID = 'aura-tradeshow';
const HASH = 'aura-tradeshow';
const VIEWS = ['front', 'left', 'back', 'right'];
const MONEY = new Set(['currency', 'scrip', 'ticket', 'pass']);
const DRIPS = new Set(['star-token', 'rose-penny', 'moon-penny', 'crown-token']);
const FILE = new URL('../aura-stock.json?t=' + Date.now(), import.meta.url);
const NFT_HOST = 'https://motherpc.taild1a44c.ts.net';
const NFT_VER = 'mint-win-1';
const TOKEN_NAMES = {
  'everyday-penny': ['everyday penny', 'everyday pennies'],
  'star-token': ['Star', 'Stars'],
  'moon-penny': ['Moon', 'Moons'],
  'rose-penny': ['Rose', 'Roses'],
  'crown-token': ['Crown', 'Crowns'],
};
const LIMITED = new Set([
  'aura-treasures-collector-book',
  'alley-backgrounds-collector-book',
  'aura-and-carnival-collector-book',
]);

let stock = {groups: {}, sku: {}, ceilings: {}, hold_floor: 111, hold_pct: 0, aura_xrp_address: '', token_claims: {}};
let minted = {};
let mintedReady = false;
let rewardMint = {account: '', enabled: false, items: {}, prices: {}, owned: {}};
let collectionLoad = {account: '', loading: false, failed: false};
const checkoutLinks = new Map();
let nftPlates = new Set();
let overlay = null;
let inspectItem = null;
let inspectMode = 'website';
let inspectFace = 0;
let resumeWorld = false;
let lastFocus = null;
let tillPoll = 0;
let tillRevision = 0;
let tillTick = null;
const pendingCheckouts = new Map();
const ownerMintOperations = new Map();
let collectionQueue = null;
let collectionQueueRevision = 0;
let tradeshowAccount = '';
let vipCheckTimer = 0;
let nftBatchUI = null;
let paidNftBasket = null;
let collectionFeedback = false;
let recoveryListOpen = false;
let recoveryScan = null;
let recoveryScanRevision = 0;
let folder = 'book:penny-collector-book';
let query = '';
let haveFilter = '';
let inspectTurn = null;
let inspectToken = 0;
const openNodes = new Set(['book:penny-collector-book']);

function vip() {
  return !!window.InstapicGuestIdentity?.isVerifiedSessionActive?.();
}
// Snap: Mother records which Felix booth portraits this VIP won (proved by the
// saved session on the USB) and whether the photo booth book was claimed.
const SNAP_BOOK = 'felix-vendor-portrait-book';
let snapElig = {portraits: new Set(), book: false};
let eligibilityAccount = '';
let eligibilityRevision = 0;
const claimReceipts = new Map();
function vipEmail() {
  try {
    return vip() ? String(window.InstapicGuestIdentity?.read?.()?.email || '').trim() : '';
  } catch {
    return '';
  }
}
function vipAccount() {
  return vipEmail().toLowerCase();
}
function notifyMintStatus() {
  window.dispatchEvent(new CustomEvent('pennyfever:mintstatuschange'));
}
function collectionStatus(id) {
  if (!vip() || rewardMint.account !== vipAccount() || !rewardMint.checked) return null;
  const phase = rewardMint.items?.[id];
  return {minted: nftOwnedCount(id) > 0,
    ready: rewardMint.enabled && phase === 'ready' && !rewardMint.prices?.[id],
    pending: !!phase && phase !== 'ready' && phase !== 'accepted',
    earned: rewardMint.earnedItems?.includes(id) === true};
}
function refreshMintStatus() {
  const account = vipAccount();
  if (!account) return Promise.resolve(false);
  if (account !== eligibilityAccount) {
    eligibilityRevision += 1;
    clearEligibility(account);
  }
  if (collectionLoad?.loading && collectionLoad.account === account) return Promise.resolve(false);
  return loadRewardMint(account, eligibilityRevision);
}
function clearEligibility(account = '') {
  recoveryScanRevision += 1;
  recoveryScan = null;
  if (account !== eligibilityAccount) collectionFeedback = false;
  eligibilityAccount = account;
  rewardMint = {account, enabled: false, items: {}, prices: {}, owned: {}};
  snapElig = {portraits: new Set(), book: false};
  recoveryListOpen = false;
  const recovery = overlay?.querySelector('#auraCollectionRecovery');
  if (recovery) { recovery.replaceChildren(); recovery.hidden = true; }
  notifyMintStatus();
}
function claimReceiptKey(account, id) {
  return `pennyFever.tradeshowClaimReceipt.v1:${encodeURIComponent(account)}:${id}`;
}
function rememberClaimReceipt(account, id) {
  const key = claimReceiptKey(account, id);
  const receipt = {v: 1, account, id};
  claimReceipts.set(key, receipt);
  try { localStorage.setItem(key, JSON.stringify(receipt)); } catch {}
}
function deliverClaimReceipts() {
  const delivered = new Set();
  const account = vipAccount();
  if (!account) return delivered;
  for (const [id, spec] of Object.entries(stock.token_claims || {})) {
    if (!dripCost(spec.cost)) continue;
    const key = claimReceiptKey(account, id);
    let receipt = claimReceipts.get(key);
    if (!receipt) { try { receipt = JSON.parse(localStorage.getItem(key) || 'null'); } catch {} }
    if (receipt?.v !== 1 || receipt.account !== account || receipt.id !== id) continue;
    if (walletCount(id) > 0 || window.PennyFever?.stampKeepsake?.(id, 'token-claim')) {
      delivered.add(id);
      claimReceipts.delete(key);
      try { localStorage.removeItem(key); } catch {}
    }
  }
  return delivered;
}
function checkVipSession() {
  const account = vipAccount();
  if (eligibilityAccount && account !== eligibilityAccount) {
    eligibilityRevision += 1;
    clearEligibility();
  }
  if (overlay && !overlay.hidden && account !== tradeshowAccount) {
    closeTradeshow({stayInAlley: true});
    if (!account) location.assign(vipJoin());
  }
}
function setSnapElig(data) {
  if (!data || data.ok === false) return;
  snapElig = {
    portraits: new Set((data.portraits || []).filter((r) => r && r.can_mint).map((r) => r.item)),
    book: !!data.book?.can_mint,
  };
}
function postSnap(path, body) {
  return fetch(`${NFT_HOST}/api/penny-fever/snap/${path}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  }).then((res) => (res.ok ? res.json() : null)).catch(() => null);
}
function loadSnap() {
  const email = vipEmail();
  const account = email.toLowerCase();
  const revision = ++eligibilityRevision;
  clearEligibility(account);
  if (!email) return Promise.resolve();
  collectionLoad = {account, loading: true, failed: false};
  paintCollectionQueue();
  return Promise.all([
    postSnap('recheck', {email}).then((data) => {
      if (revision === eligibilityRevision && account === vipAccount()) {
        setSnapElig(data);
        return loadRewardMint(account, revision);
      }
    }),
    loadDrips(email, revision),
  ]).then(deliverClaimReceipts);
}
function loadRewardMint(account, revision) {
  const loading = {account, loading: true, failed: false};
  collectionLoad = loading;
  paintCollectionQueue();
  return fetch(`${NFT_HOST}/api/penny-fever/verified/redeem/eligibility`, {
    method: 'POST', cache: 'no-store', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: account}),
  }).then(async res => {
    const data = await res.json().catch(() => null);
    return res.ok || data?.error === 'test_mint_not_allowed' ? data : null;
  }).then(data => {
    if (data?.error === 'test_mint_not_allowed') return false;
    if (collectionLoad !== loading || revision !== eligibilityRevision || account !== vipAccount() || data?.ok !== true) {
      loading.failed = true;
      return false;
    }
    rewardMint = {account, checked: true, enabled: data.enabled === true, items: data.items || {}, prices: data.prices || {}, owned: data.owned || {}, earnedItems: Array.isArray(data.earned_game_items) ? data.earned_game_items : [], photoItems: Array.isArray(data.photo_reward_items) ? data.photo_reward_items : [], walletCheckFailed: data.wallet_check_failed === true, pending: Array.isArray(data.pending) ? data.pending : [], recovery: Array.isArray(data.recovery) ? data.recovery : [], ownerItems: Array.isArray(data.owner_restock_items) ? data.owner_restock_items : [], tokenClaims: Array.isArray(data.token_claim_items) ? data.token_claim_items : [], batchLimit: data.batch_signing_limit === 8 ? 8 : 0};
    notifyMintStatus();
    paintRecoveryList();
    nftBatchUI?.refreshPending();
    paidNftBasket?.refresh();
    return true;
  }).catch(() => { loading.failed = true; return false; }).finally(() => {
    loading.loading = false;
    if (collectionLoad === loading) paintCollectionQueue();
  });
}

function collectedMintIds() {
  if (!vip() || !mintedReady || !rewardMint.enabled || rewardMint.account !== vipAccount()) return [];
  const ownerCopies = new Set(collectedFelixOwnerIds());
  const pending = id => rewardMint.items[id] !== 'ready';
  return [...new Set([...Object.keys(rewardMint.items), ...ownerCopies])].filter(id => {
    const item = modelItem(id);
    const act = shopAction(id);
    if (ownerCopies.has(id)) return !act.disabled && act.ready && !nftOwnedCount(id);
    return item.id && (!isFelix(item) || rewardMint.photoItems?.includes(id)) && !tokenClaim(id) && !MONEY.has(item.kind)
      && !isEveryday(item) && !rewardMint.prices[id] && !nftOwnedCount(id)
      && !rewardMint.recovery?.some(order => order.item === id && order.kind === 'owner')
      && act.ready && act.reward && !act.purchase && !act.disabled && !act.claim;
  }).sort((a, b) => Number(pending(b)) - Number(pending(a))
    || String(modelItem(a).name || a).localeCompare(String(modelItem(b).name || b)));
}

function collectionOwnsTill(id, account) {
  return !!(collectionQueue?.active && collectionQueue.account === account
    && collectionQueue.current === id && account === vipAccount() && !overlay?.hidden);
}

function collectedFelixOwnerIds() {
  if (!vip() || rewardMint.account !== vipAccount() || !rewardMint.enabled) return [];
  return (rewardMint.ownerItems || []).filter(id => (id === SNAP_BOOK || isFelix(modelItem(id)))
    && walletCount(id) > 0 && !nftOwnedCount(id)
    && !rewardMint.photoItems?.includes(id) && !rewardMint.tokenClaims?.includes(id));
}

function paintCollectionQueue() {
  if (!overlay) return;
  const queue = collectionQueue?.account === vipAccount() ? collectionQueue : null;
  const loading = vip() && collectionLoad.account === vipAccount() && collectionLoad.loading;
  const failed = vip() && collectionLoad.account === vipAccount() && collectionLoad.failed;
  const pendingReceive = rewardMint.account === vipAccount() ? (rewardMint.pending || []).length : 0;
  const till = overlay.querySelector('#auraXrpTill');
  const opening = till?.dataset.loading === 'true' && (!till.hidden || collectionOwnsTill(till.dataset.item, vipAccount()));
  const eligible = collectedMintIds().length;
  const available = vip();
  const toolbar = overlay.querySelector('#auraCollectionMintToolbar');
  if (toolbar) {
    toolbar.hidden = !available;
    toolbar.setAttribute('aria-busy', String(loading || opening));
  }
  const bar = overlay.querySelector('#auraCollectionLoadingBar');
  if (bar) bar.hidden = !(loading || opening);
  const button = overlay.querySelector('[data-collection-mint]');
  if (button) {
    button.hidden = !available;
    button.disabled = loading || opening || !!queue?.active;
    button.textContent = queue?.active ? (queue.phase === 'prepare' ? 'Minting…' : 'Receiving…') : 'Mint Rewards (up to 25)';
    button.title = 'Prepare up to 25 collected rewards, then receive them in Xaman';
  }
  const receive = overlay.querySelector('[data-collection-receive]');
  if (receive) {
    receive.hidden = !available;
    receive.disabled = loading || opening || !!queue?.active;
    receive.textContent = 'Resume Checkout';
  }
  const progress = overlay.querySelector('#auraCollectionMintProgress');
  if (progress) {
    progress.hidden = !available || !(collectionFeedback || loading || opening || queue || failed || pendingReceive);
    progress.textContent = loading ? 'Checking your collected rewards and wallet. Please wait…'
      : opening ? 'Preparing your Xaman request. Please wait…'
      : failed ? 'Collection could not load. Retry when connected and signed in.'
      : !queue ? (pendingReceive ? 'Finish receiving your prepared NFTs before starting another batch.' : eligible ? 'Mint up to 25 collected rewards, then receive them in Xaman.' : 'No collected rewards to mint.') : queue.phase === 'prepare'
      ? `${queue.done} of ${queue.ids.length} prepared${queue.active ? '' : ' · paused. Select Resume Checkout.'}`
      : queue.phase === 'complete' ? `Batch complete · ${queue.ready.length} received`
      : queue.active ? `${queue.receiveIndex} of ${queue.ready.length} received`
      : `Minting finished · ${queue.ready.length - queue.receiveIndex} ready to receive. Select Receive Batch.`;
  }
  overlay.querySelectorAll('[data-collection-pause]').forEach(button => { button.hidden = !queue?.active; });
  const resumeHere = overlay.querySelector('[data-xrp-resume]');
  if (resumeHere) resumeHere.hidden = !queue || queue.active || queue.phase === 'complete';
  const warning = overlay.querySelector('#auraCollectionKeepOpen');
  if (warning) {
    warning.hidden = !queue?.active;
    warning.textContent = queue?.phase === 'prepare'
      ? 'Minting in progress. Keep this Tradeshow page open—do not close or refresh it. Return here after signing in Xaman.'
      : 'Receiving in progress. Keep this Tradeshow page open and return here after each Xaman approval.';
  }
  const current = !!(queue?.active && queue.current === till?.dataset.item);
  const note = overlay.querySelector('#auraCollectionMintStep');
  if (note) {
    note.hidden = !current;
    note.textContent = !current ? '' : queue.phase === 'prepare'
      ? queue.ownerIds?.includes(queue.current)
        ? 'Approve this owner copy in Xaman, then return here. Each owner copy needs a fresh approval.'
        : 'Sign into your wallet once, then return to this Tradeshow tab. Up to 25 NFTs will prepare quietly before you receive them.'
      : `Batch ready · receive ${queue.receiveIndex + 1} of ${queue.ready.length} in Xaman. Return here to check or continue receiving.`;
  }
  if (queue?.active) {
    const again = overlay.querySelector('[data-xrp-buy-another]');
    if (again) again.hidden = true;
  }
  nftBatchUI?.paint();
  paidNftBasket?.paint();
}

async function checkCollectionReceipts() {
  if (!vip() || collectionQueue?.active) return;
  collectionFeedback = true;
  const account = vipAccount();
  const fresh = await loadRewardMint(account, eligibilityRevision);
  if (!fresh || account !== vipAccount() || overlay?.hidden) return;
  paint();
  recoveryListOpen = true;
  paintRecoveryList();
  await reconcileRecoveryReceipts();
}

async function reconcileRecoveryReceipts(payload = '') {
  if (!vip() || recoveryScan?.active || rewardMint.account !== vipAccount()) return;
  const account = vipAccount(), revision = ++recoveryScanRevision;
  const receipts = (rewardMint.recovery || []).filter(row => !payload || row.payload === payload);
  const scan = {account, active: true, checked: 0, total: receipts.length, resolved: 0, failed: 0,
    results: new Map(recoveryScan?.account === account ? recoveryScan.results : [])};
  recoveryScan = scan;
  const current = () => recoveryScan === scan && revision === recoveryScanRevision
    && account === vipAccount() && vip() && !overlay?.hidden;
  let next = 0;
  async function worker() {
    while (current() && next < receipts.length) {
      const receipt = receipts[next++];
      let result;
      try {
        const response = await fetch(`${NFT_HOST}/api/penny-fever/verified/redeem/reconcile`, {
          method: 'POST', cache: 'no-store', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email: account, payload: receipt.payload}),
        });
        result = await response.json();
        if (!response.ok || result?.ok !== true || result.payload !== receipt.payload
            || result.item !== receipt.item) throw Error('Receipt could not be verified.');
      } catch {
        result = {outcome: 'unverified', message: 'Receipt checking is unavailable. This order is preserved.'};
      }
      if (!current()) return;
      scan.results.set(receipt.payload, result);
      scan.checked++;
      if (['received', 'closed'].includes(result.outcome)) scan.resolved++;
      else if (result.outcome === 'unverified') scan.failed++;
      paintRecoveryList();
    }
  }
  paintRecoveryList();
  await Promise.all([worker(), worker()]);
  if (!current()) return;
  scan.active = false;
  await loadRewardMint(account, eligibilityRevision);
  if (current()) paint();
}

async function cancelRecoveryRequest(receipt, button) {
  const account = vipAccount();
  const checked = recoveryScan?.account === account && recoveryScan.results.get(receipt.payload);
  if (!vip() || !checked?.can_cancel || recoveryScan?.active) return;
  button.disabled = true;
  try {
    const response = await fetch(`${NFT_HOST}/api/penny-fever/xaman-checkout/cancel/${encodeURIComponent(receipt.payload)}`, {
      method: 'POST', cache: 'no-store',
    });
    const result = await response.json();
    if (!response.ok || result?.ok !== true) throw Error(result?.message || 'Cancellation could not be confirmed.');
    if (account !== vipAccount() || overlay?.hidden) return;
    if (pendingCheckouts.get(receipt.item)?.uuid === receipt.payload) {
      pendingCheckouts.delete(receipt.item);
      ownerMintOperations.delete(account + ':' + receipt.item);
    }
    await loadRewardMint(account, eligibilityRevision);
    if (account === vipAccount() && !overlay?.hidden) paint();
  } catch (error) {
    if (account === vipAccount() && !overlay?.hidden && recoveryScan?.account === account) {
      recoveryScan.results.set(receipt.payload, {outcome: 'unverified', message: error.message});
      paintRecoveryList();
    }
  }
}

function paintRecoveryList() {
  const panel = overlay?.querySelector('#auraCollectionRecovery');
  if (!panel || !recoveryListOpen || rewardMint.account !== vipAccount()) return;
  const recovery = rewardMint.recovery || [];
  const receiving = rewardMint.pending?.length;
  const paused = collectionQueue?.account === vipAccount() && collectionQueue.phase !== 'complete';
  panel.replaceChildren();
  panel.hidden = false;
  const summary = document.createElement('p');
  const scan = recoveryScan?.account === vipAccount() ? recoveryScan : null;
  summary.dataset.recoverySummary = '';
  summary.setAttribute('role', 'status');
  summary.textContent = scan?.active ? `Checking receipts · ${scan.checked} of ${scan.total}`
    : `${recovery.length} unfinished orders${scan ? ` · ${scan.resolved} resolved · ${scan.failed} could not be verified` : ''}.`;
  if (rewardMint.walletCheckFailed) summary.textContent = 'Wallet verification is incomplete because the ledger could not be reached. The counts are incomplete; retry before relying on them. Existing orders are listed below. No new mint or purchase was started.';
  panel.append(summary);
  const check = document.createElement('button');
  check.type = 'button'; check.textContent = scan?.active ? 'Stop checking' : 'Check all receipts';
  check.dataset.recoveryCheckAll = '';
  check.addEventListener('click', () => {
    if (recoveryScan?.active) { recoveryScanRevision++; recoveryScan.active = false; paintRecoveryList(); }
    else reconcileRecoveryReceipts();
  });
  panel.append(check);
  const close = document.createElement('button');
  close.type = 'button'; close.textContent = 'Hide recovery list';
  close.addEventListener('click', () => { recoveryListOpen = false; panel.hidden = true; });
  panel.append(close);
  if (paused || Object.values(rewardMint.items).some(status => status !== 'ready' && status !== 'accepted')) {
    const resume = document.createElement('button');
    resume.type = 'button'; resume.textContent = 'Resume minting rewards';
    resume.disabled = !!scan?.active;
    resume.dataset.collectionResume = '';
    resume.addEventListener('click', startCollectionQueue);
    panel.append(resume);
  }
  recovery.forEach(receipt => {
    const checked = scan?.results.get(receipt.payload);
    const row = document.createElement('div'); row.className = 'aura-recovery-row';
    row.dataset.recoveryPayload = receipt.payload;
    const label = document.createElement('span');
    label.textContent = `${modelItem(receipt.item).name || receipt.item} · ${checked?.message || 'Waiting for receipt check.'}`;
    row.append(label);
    const button = document.createElement('button');
    button.type = 'button';
    button.disabled = !!scan?.active;
    if (checked?.outcome === 'ready_to_receive' && nftBatchUI && rewardMint.batchLimit === 8) {
      button.dataset.recoverReceive = receipt.payload; button.textContent = 'Receive Batch';
      button.addEventListener('click', () => nftBatchUI.receive());
    } else if (checked?.can_continue) {
      button.dataset.recoverOrder = receipt.payload; button.textContent = 'Continue checkout';
      button.addEventListener('click', () => openXrpTill(receipt.item, {recovery: receipt}));
    } else {
      button.dataset.recoverCheck = receipt.payload; button.textContent = 'Check again';
      button.addEventListener('click', () => reconcileRecoveryReceipts(receipt.payload));
    }
    row.append(button);
    if (checked?.can_cancel) {
      const cancel = document.createElement('button'); cancel.type = 'button';
      cancel.textContent = 'Cancel unsigned request'; cancel.dataset.recoverCancel = receipt.payload;
      cancel.disabled = !!scan?.active;
      cancel.addEventListener('click', () => cancelRecoveryRequest(receipt, cancel));
      row.append(cancel);
    }
    panel.append(row);
  });
  if (receiving) {
    const receive = document.createElement('button');
    receive.type = 'button'; receive.textContent = 'Receive prepared batch';
    receive.dataset.collectionReceivePrepared = '';
    receive.disabled = !!scan?.active;
    receive.addEventListener('click', beginReceivingCollection);
    panel.append(receive);
  }
}

function pauseCollectionQueue() {
  collectionQueueRevision += 1;
  if (collectionQueue) {
    collectionQueue.active = false;
    collectionQueue.busy = false;
  }
  paintCollectionQueue();
}

function continueCollectionSoon(queue) {
  const revision = collectionQueueRevision;
  setTimeout(() => {
    if (collectionQueue === queue && queue.active && revision === collectionQueueRevision) advanceCollectionQueue();
  }, 200);
}

async function advanceCollectionQueue() {
  const queue = collectionQueue;
  if (!queue?.active || queue.busy || queue.retryWaiting) return;
  const account = queue.account;
  const revision = collectionQueueRevision;
  // Each order rechecks proof, stock and the run on the server. Refresh the
  // catalogue on start/resume, not once per item (which rescans the wallet).
  if (collectionQueue !== queue || revision !== collectionQueueRevision || !queue.active) return;
  if (account !== vipAccount() || !vip() || overlay?.hidden || tradeshowBlocked() || !rewardMint.enabled) {
    pauseCollectionQueue();
    return;
  }
  if (queue.phase === 'receive') {
    if (nftBatchUI && rewardMint.batchLimit === 8) {
      queue.active = false;
      queue.current = '';
      paintCollectionQueue();
      nftBatchUI.receive();
      return;
    }
    if (queue.receiveIndex >= queue.ready.length) {
      queue.phase = 'complete';
      queue.active = false;
      queue.current = '';
      closeXrpTill({pauseQueue: false});
      paint();
      return;
    }
    const id = queue.ready[queue.receiveIndex];
    queue.current = id;
    const ownerReceipt = queue.ownerIds?.includes(id) && pendingCheckouts.get(id);
    openXrpTill(id, ownerReceipt ? {recovery: {kind: 'owner', payload: ownerReceipt.uuid}}
      : {receiveOnly: true, background: nftOwnedCount(id) > 0});
    paintCollectionQueue();
    return;
  }
  while (queue.done < queue.ids.length && nftOwnedCount(queue.ids[queue.done])) queue.done += 1;
  if (queue.done >= queue.ids.length) {
    queue.phase = queue.ready.length ? 'receive' : 'complete';
    queue.active = false;
    queue.current = '';
    closeXrpTill({pauseQueue: false});
    paint();
    return;
  }
  const id = queue.ids[queue.done];
  if (!collectedMintIds().includes(id)) {
    pauseCollectionQueue();
    const progress = overlay.querySelector('#auraCollectionMintProgress');
    if (progress) progress.textContent = `${modelItem(id).name || id} needs checking. No next request was opened.`;
    return;
  }
  queue.current = id;
  closeInspect();
  const recovery = queue.ownerIds?.includes(id)
    && rewardMint.recovery?.find(order => order.item === id && order.kind === 'owner');
  openXrpTill(id, {background: !recovery, recovery: recovery || null});
  paintCollectionQueue();
}

async function startCollectionQueue() {
  if (collectionQueue?.active || !vip() || tradeshowBlocked()) return;
  collectionFeedback = true;
  const account = vipAccount();
  const revision = ++collectionQueueRevision;
  const button = overlay?.querySelector('[data-collection-mint]');
  if (button) button.disabled = true;
  const fresh = await loadRewardMint(account, eligibilityRevision);
  if (revision !== collectionQueueRevision || account !== vipAccount() || overlay?.hidden) return;
  if (!fresh) {
    if (button) button.disabled = false;
    const note = overlay?.querySelector('#auraTradeshowNote');
    if (note) note.textContent = 'Could not refresh the collected mint list. No new request was opened. Try again.';
    return;
  }
  if (!collectionQueue || collectionQueue.account !== account || collectionQueue.phase === 'complete') {
    const pending = (rewardMint.pending || []).filter(id => modelItem(id).id);
    const receivingPending = pending.length > 0;
    const ids = receivingPending ? pending.slice(0, 25) : collectedMintIds().slice(0, 25);
    if (!ids.length) {
      paintCollectionQueue();
      overlay.querySelector('#auraCollectionMintProgress').textContent = 'No collected rewards to mint.';
      return;
    }
    collectionQueue = {account, ids, done: receivingPending ? ids.length : 0,
      ownerIds: receivingPending ? [] : ids.filter(id => collectedFelixOwnerIds().includes(id)),
      ready: receivingPending ? [...ids] : [], receiveIndex: 0,
      phase: receivingPending ? 'receive' : 'prepare', current: '', active: false, busy: false, run: null};
  }
  collectionQueue.active = true;
  collectionQueue.retryWaiting = false;
  collectionQueue.readRetries = 0;
  paintCollectionQueue();
  await advanceCollectionQueue();
}

function beginReceivingCollection() {
  if (!collectionQueue?.ready.length || collectionQueue.phase === 'complete') {
    if (rewardMint.account === vipAccount() && rewardMint.pending?.length) startCollectionQueue();
    return;
  }
  if (collectionQueue.account !== vipAccount()) return;
  pauseCollectionQueue();
  stopTillPoll();
  collectionQueue.phase = 'receive';
  collectionQueue.current = '';
  startCollectionQueue();
}

function collectionMintPrepared(id, account, alreadyReceived = false) {
  const queue = collectionQueue;
  if (!collectionOwnsTill(id, account) || queue.phase !== 'prepare') return;
  queue.readRetries = 0;
  if (!alreadyReceived && !queue.ready.includes(id)) queue.ready.push(id);
  queue.done += 1;
  queue.current = '';
  stopTillPoll();
  const till = overlay?.querySelector('#auraXrpTill');
  if (till) till.hidden = true;
  paintCollectionQueue();
  continueCollectionSoon(queue);
}

function collectionMintReceived(id, account) {
  const queue = collectionQueue;
  if (!collectionOwnsTill(id, account)) return;
  queue.readRetries = 0;
  if (queue.phase === 'prepare') {
    collectionMintPrepared(id, account, true);
    return;
  }
  queue.receiveIndex += 1;
  queue.current = '';
  paintCollectionQueue();
  continueCollectionSoon(queue);
}
function loadDrips(email, revision) {
  if (!email) return Promise.resolve();
  return fetch(`${NFT_HOST}/api/penny-fever/drips?email=${encodeURIComponent(email)}`, {cache: 'no-store'})
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (revision !== eligibilityRevision || email.toLowerCase() !== vipAccount()) return;
      if (data?.email && String(data.email).toLowerCase() !== email.toLowerCase()) return;
      // The server retains paid ownership receipts even if a reply was lost
      // or the guest moved to another device. Recovery never spends again.
      for (const receipt of Array.isArray(data.claims) ? data.claims : []) {
        if (receipt && typeof receipt.id === 'string'
            && ['penny-collector-book', SNAP_BOOK, 'aura-keepsake'].includes(receipt.item)
            && (!receipt.email || String(receipt.email).toLowerCase() === email.toLowerCase())) {
          rememberClaimReceipt(email.toLowerCase(), receipt.item);
        }
      }
    })
    .catch(() => {});
}
function tradeshowLookHref() {
  return '/penny-fever/index.html?style=paper&rail=paper&tradeshow=1#aura-tradeshow';
}

function rememberTradeshowLook() {
  const href = tradeshowLookHref();
  try {
    sessionStorage.setItem('pennyFever.tradeshowLook.v1', JSON.stringify({v: 1, href, at: Date.now()}));
    const key = 'instapic.lastScreens.v1';
    const parsed = JSON.parse(sessionStorage.getItem(key) || '[]');
    const stack = Array.isArray(parsed) ? parsed : [];
    if (stack[stack.length - 1] !== href) {
      stack.push(href);
      sessionStorage.setItem(key, JSON.stringify(stack.slice(-12)));
    }
  } catch {}
}

function vipJoin() {
  rememberTradeshowLook();
  const path = '/penny-fever/index.html?style=paper&rail=paper&v=' + NFT_VER + '#aura-tradeshow';
  return '/save.html?return=' + encodeURIComponent(path);
}
export function tradeshowStatus() {
  return parkStatus(SHOW_ID);
}
export function tradeshowBlocked() {
  const status = tradeshowStatus();
  return status === 'closed' || status === 'maintenance';
}
function groupKey(id) {
  return String(stock.sku?.[id] || '');
}
function groupSpec(id) {
  const g = stock.groups?.[groupKey(id)];
  return g && typeof g === 'object' ? g : {};
}
function editionSpec(id) {
  const g = groupSpec(id);
  const n = String(g.current_edition || 1);
  const ed = g.editions?.[n] || g.editions?.[Number(n)];
  return ed && typeof ed === 'object' ? ed : {};
}
function onShelf(id) {
  return !!groupKey(id);
}
function ceilingFor(id) {
  const n = Number(stock.ceilings?.[id] ?? editionSpec(id).ceiling ?? groupSpec(id).ceiling);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
export function remainingFor(id) {
  if (!onShelf(id)) return 0;
  const cap = ceilingFor(id);
  const used = Math.max(0, Math.floor(Number(minted[id]) || 0));
  return Math.max(0, cap - used);
}
function holdFloor(id) {
  if (!groupSpec(id).hold) return 0;
  const cap = ceilingFor(id);
  const floor = Number(stock.hold_floor);
  const pct = Number(stock.hold_pct);
  const fromFloor = Number.isFinite(floor) && floor > 0 ? Math.floor(floor) : 0;
  const fromPct = Number.isFinite(pct) && pct > 0 ? Math.floor(cap * pct) : 0;
  return Math.max(fromFloor, fromPct);
}
function shopHolding(id) {
  if (!onShelf(id) || tokenClaim(id)) return false;
  if (LIMITED.has(id) || String(groupKey(id)).startsWith('le-')) return false;
  const hold = holdFloor(id);
  const left = remainingFor(id);
  return hold > 0 && left > 0 && left <= hold;
}
function xrpPriceFor(id) {
  const raw = editionSpec(id).xrp ?? groupSpec(id).xrp;
  const s = String(raw ?? '').trim();
  return s ? s : '';
}
function formatXrp(id) {
  const p = xrpPriceFor(id);
  return p ? `${p} XRP` : '';
}
function purchaseLabel(item) {
  if (!item?.id) return '';
  if (TOKEN_TERMS[item.id]) { const token = TOKEN_TERMS[item.id]; return `${token.units.toLocaleString('en-AU')} ${token.code} · ${token.xrp} XRP`; }
  if (isEveryday(item)) return item.id === 'admission-ticket' ? 'Entry ticket · Aura’s entrance booth' : 'Game purse · Aura’s entrance booth';
  if (folder !== 'convert' && rewardMint.account === vipAccount() && rewardMint.enabled && rewardMint.ownerItems?.includes(item.id)) return 'Owner copy · no purchase payment';
  if (tokenClaim(item.id)) {
    const cost = formatTokenCost(tokenClaim(item.id).cost);
    return cost ? `Convert · ${cost}` : 'Convert with tokens';
  }
  if (isFelix(item)) return 'Not for sale here';
  if (MONEY.has(item.kind)) return 'Dollar till';
  const redemption = rewardMint.account === vipAccount() && rewardMint.enabled && rewardMint.items[item.id];
  const purchasePrice = rewardMint.prices?.[item.id];
  if (redemption && redemption !== 'accepted' && !purchasePrice) return 'Collected · network fee only';
  return formatXrp(item.id) || (purchasePrice ? `${purchasePrice} XRP` : 'Price pending');
}
function capLine(id) {
  const cap = walletBuyCap(id);
  if (!Number.isFinite(cap)) return 'VIP can hold as many as remain';
  if (cap <= 1) return 'one per wallet';
  return `up to ${cap.toLocaleString('en-AU')} in this wallet`;
}
function walletCount(id) {
  try {
    const row = window.PennyFever?.getState?.()?.paperInventory?.items?.[id];
    if (!row) return 0;
    const qty = Number(row.qty);
    if (Number.isFinite(qty)) return Math.max(0, qty);
    return 1;
  } catch {
    return 0;
  }
}
function tokenClaim(id) {
  const spec = stock.token_claims?.[id];
  return spec && typeof spec === 'object' ? spec : null;
}
function formatTokenCost(cost) {
  return Object.entries(cost || {}).map(([id, n]) => {
    const need = Math.max(0, Math.floor(Number(n) || 0));
    const names = TOKEN_NAMES[id];
    const name = Array.isArray(names) ? names[need === 1 ? 0 : 1] : (names || id);
    return `${need.toLocaleString('en-AU')} ${name}`;
  }).join(' + ');
}
function tankLabel(id) {
  return ({
    'star-token': 'Stars',
    'moon-penny': 'Moons',
    'rose-penny': 'Roses',
    'crown-token': 'Crowns',
    'everyday-penny': 'Pennies',
  })[id] || id;
}
function tankMarkup(item) {
  const claim = tokenClaim(item.id);
  if (!claim?.cost) return '';
  const rows = Object.entries(claim.cost).map(([id, n]) => {
    const need = Math.max(0, Math.floor(Number(n) || 0));
    return `<div class="aura-token-requirement"><strong>${tankLabel(id)}</strong><dl><div><dt>Required</dt><dd>${need.toLocaleString('en-AU')}</dd></div><div><dt>In Xaman</dt><dd data-ledger-have="${id}">—</dd></div><div><dt>Missing</dt><dd data-ledger-missing="${id}" data-required="${need}">—</dd></div></dl></div>`;
  });
  return `<section class="aura-token-recipe-progress" data-current-recipe="${item.id}"><strong>Tokens needed</strong>${rows.join('')}</section>`;
}
function dripCost(cost) {
  const keys = Object.keys(cost || {});
  return keys.length > 0 && keys.every((id) => DRIPS.has(id));
}
function claimWithTokens(id) {
  if (!tokenClaim(id)) return;
  if (overlay?.dataset.tokenBankOwner !== vipAccount()) {
    const note=overlay?.querySelector('#auraTradeshowNote');
    if (note) note.textContent='Token trading opens when the purse connection is ready. No tokens or pennies were spent.';
    return;
  }
  window.dispatchEvent(new CustomEvent('pennyfever:token-shop', {detail: {item: id}}));
}
function walletBuyCap(id) {
  const claim = tokenClaim(id);
  if (claim && Number.isFinite(Number(claim.wallet))) return Math.max(0, Math.floor(Number(claim.wallet)));
  const raw = editionSpec(id).wallet ?? groupSpec(id).wallet;
  if (raw == null || raw === '') return Infinity;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return Infinity;
  return Math.floor(n);
}
function walletAtCap(id) {
  return walletCount(id) >= walletBuyCap(id);
}
function loadStock() {
  return fetch(FILE.href, {cache: 'no-store'})
    .then((res) => (res.ok ? res.json() : {}))
    .then((data) => {
      const recipe = data.recipe && typeof data.recipe === 'object' ? data.recipe : {};
      const claims = (data.token_claims && typeof data.token_claims === 'object' && data.token_claims)
        || (recipe.token_claims && typeof recipe.token_claims === 'object' && recipe.token_claims)
        || {};
      const holdRaw = data.hold_floor ?? recipe.hold_floor;
      const pctRaw = data.hold_pct ?? recipe.hold_pct;
      stock = {
        groups: data.groups && typeof data.groups === 'object' ? data.groups : {},
        sku: data.sku && typeof data.sku === 'object' ? data.sku : {},
        ceilings: data.ceilings && typeof data.ceilings === 'object' ? data.ceilings : {},
        hold_floor: Number.isFinite(Number(holdRaw)) ? Number(holdRaw) : 111,
        hold_pct: Number.isFinite(Number(pctRaw)) ? Number(pctRaw) : 0,
        aura_xrp_address: String(data.aura_xrp_address || '').trim(),
        token_claims: claims,
      };
    })
    .catch(() => {});
}
function loadMinted() {
  return fetch(`${NFT_HOST}/api/penny-fever/minted?v=${NFT_VER}`, {cache: 'no-store'})
    .then((res) => {
      if (!res.ok) throw new Error('Supply unavailable');
      return res.json();
    })
    .then((data) => {
      const counts = data && typeof data === 'object' ? (data.counts || data) : null;
      if (data?.ok === false || !counts || typeof counts !== 'object' || Array.isArray(counts)
          || Object.values(counts).some((n) => !Number.isSafeInteger(n) || n < 0)) {
        throw new Error('Supply unavailable');
      }
      minted = counts;
      mintedReady = true;
    })
    .catch(() => { mintedReady = false; });
}
function nftPlateSrc(id) {
  return `${NFT_HOST}/api/penny-fever/nft-plate/${encodeURIComponent(id)}.webp?v=${NFT_VER}`;
}
function loadPlates() {
  const account = vipAccount();
  if (!account) { nftPlates = new Set(); return Promise.resolve(); }
  return fetch(`${NFT_HOST}/api/penny-fever/verified/nft-plates?email=${encodeURIComponent(account)}&v=${NFT_VER}`, {cache: 'no-store'})
    .then((res) => (res.ok ? res.json() : []))
    .then((list) => {
      if (account === vipAccount()) nftPlates = new Set(Array.isArray(list) ? list : []);
    })
    .catch(() => {});
}
function stallForPrize(item = {}) {
  if (item.id === 'felix-vendor-portrait-book' || item.photoSetId === 'pf-felix') return stallById('snap');
  if (item.photoSetId?.startsWith('pf-')) return stallById(item.photoSetId.slice(3)) || stallById('snap');
  const playStalls = stalls.filter((s) => !s.extra || s.id === 'ticket-booth');
  return playStalls.find((s) => s.prizes.includes(item.id)) || stallById('ticket-booth');
}
function stallDoor(stall) {
  if (!stall || stall.id === 'ticket-booth') {
    return {id: 'ticket-booth', status: 'open', mintable: false, money: true};
  }
  const status = parkStatus(stall.id);
  return {id: stall.id, status, mintable: status === 'open', money: false};
}
function isPlayStall(stall) {
  return !!(stall && !stall.extra && stall.id !== 'snap' && stall.id !== 'ticket-booth');
}
function isOpenPlayStall(stall) {
  return isPlayStall(stall) && stallDoor(stall).mintable;
}
function isClosedPlayStall(stall) {
  return isPlayStall(stall) && !stallDoor(stall).mintable;
}
function openPlayStalls() {
  return stalls.filter(isOpenPlayStall);
}
function closedPlayStalls() {
  return stalls.filter(isClosedPlayStall);
}
function stallFolderKind(id) {
  if (!String(id || '').startsWith('stall:')) return '';
  const stall = stallById(id.slice(6));
  if (isOpenPlayStall(stall)) return 'open';
  if (isClosedPlayStall(stall)) return 'closed';
  return '';
}
function chapterItems(stall) {
  return (stall?.prizes || []).map((id) => modelItem(id)).filter((item) => item.id);
}
function faceSrc(item, view) {
  const asset = String(item.asset || '');
  const ver = (asset.match(/\?[^#]*$/) || [''])[0];
  return asset.replace(/front\.webp(\?.*)?$/, `${view}.webp${ver}`);
}
function poseCard(card, index) {
  if (!card) return;
  const views = VIEWS.filter((view) => card.dataset[view] === '1');
  if (!views.length) return;
  const next = ((index % views.length) + views.length) % views.length;
  const face = views[next];
  card.dataset.face = String(next);
  const img = card.querySelector('.aura-tradeshow-stage img');
  if (img && card.dataset.mode !== 'nft') img.src = faceSrc({asset: card.dataset.asset}, face);
  card.querySelectorAll('[data-face]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.face === face));
  });
}
function formatStock(id) {
  const item = modelItem(id);
  const price = purchaseLabel(item);
  if (isEveryday(item)) return TOKEN_TERMS[id] ? 'Ledger balance and sale stock · Wallet / Tokens' : 'Pennies, tickets and 5-packs · Aura’s entrance booth';
  if (!onShelf(id)) return price ? `Not on the shelf yet · ${price}` : 'Not on the shelf yet';
  if (tokenClaim(id)) {
    const n = remainingFor(id);
    const left = n.toLocaleString('en-AU') + ' remaining';
    if (n <= 0) return left + ' · trade later';
    return price ? `${left} · ${price}` : left + ' · convert with tokens';
  }
  if (!mintedReady) return price ? `Supply unavailable · ${price}` : 'Supply unavailable · reopen to retry';
  const n = remainingFor(id);
  const left = n.toLocaleString('en-AU') + ' remaining';
  if (n <= 0) return price ? `${left} · trade later · ${price}` : left + ' · trade later';
  if (shopHolding(id)) return price ? `${left} · last copies held for play · ${price}` : left + ' · last copies held for play';
  return price ? `${left} · ${price}` : left;
}
function guestRef() {
  try {
    const id = window.InstapicGuestIdentity;
    return String(id?.read?.()?.email || id?.guestId?.() || id?.id?.() || '').trim();
  } catch {
    return '';
  }
}
function tillLink(id) {
  const origin = (location.origin && location.origin.startsWith('http')) ? location.origin : 'https://instapic.fun';
  return `${origin}/penny-fever/index.html?style=paper&rail=paper&v=${NFT_VER}&buy=${encodeURIComponent(id)}#aura-tradeshow`;
}
function auraTillAddress() {
  const addr = String(stock?.aura_xrp_address || stock?.xrpl?.issuer || 'raX62YZbpbmCjRNiajozue1RR51avq3Jdq').trim();
  return addr.startsWith('r') ? addr : 'raX62YZbpbmCjRNiajozue1RR51avq3Jdq';
}
function nftOwnedCount(id) {
  if (rewardMint.account !== vipAccount()) return 0;
  const n = Math.floor(Number(rewardMint.owned?.[id]) || 0);
  if (n > 0) return n;
  return rewardMint.items?.[id] === 'accepted' ? 1 : 0;
}
function guestOwns(id) {
  // Paper stamps are website copies. Show the mint plate after a ledger accept.
  return nftOwnedCount(id) > 0;
}
function xamanScanText(id) {
  if (!onShelf(id) || tokenClaim(id)) return '';
  return tillLink(id);
}
function checkoutUrl(id) {
  if (shopAction(id).reward) return `${NFT_HOST}/api/penny-fever/verified/redeem`;
  const qs = new URLSearchParams({
    item: id,
    guest: guestRef(),
    vip: vipEmail(),
    return: tillLink(id),
  });
  return `${NFT_HOST}/api/penny-fever/xaman-checkout?${qs}`;
}
function buyQrSrc(id) {
  const text = checkoutLinks.get(vipAccount() + ':' + id) || xamanScanText(id);
  if (!text) return '';
  try {
    return qrDataUrl(text, 5, 8);
  } catch {
    return '';
  }
}
function nftViewSrc(id) {
  if (guestOwns(id) && nftPlates.has(id)) return nftPlateSrc(id);
  return buyQrSrc(id);
}
function nftViewAvailable(item, stallInfo) {
  if (isEveryday(item)) return false;
  if (folder === 'convert' && tokenClaim(item.id)) return false;
  if (rewardMint.account === vipAccount() && rewardMint.enabled && rewardMint.ownerItems?.includes(item.id)) return true;
  return isLimited(item) || (!isFelix(item) && !tokenClaim(item.id) && !MONEY.has(item.kind) && !stallInfo.money);
}

function closeTreeDrawer() {
  const drawer = overlay?.querySelector('#auraTradeshowTreeDrawer');
  if (drawer) drawer.checked = false;
}
function revealBook(id) {
  for (const book of window.PennyFeverInventoryModel?.books || []) {
    if (book.id !== id && book.id !== 'penny-collector-book') openNodes.delete('book:' + book.id);
  }
  openNodes.add('book:' + id);
  if (LIMITED.has(id)) openNodes.add('limited');
  else if (id === SNAP_BOOK) openNodes.add('felix');
  else openNodes.add('book:penny-collector-book');
}
function ensureOverlay() {
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'aura-tradeshow';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'auraTradeshowTitle');
  overlay.innerHTML = `
    <div class="aura-tradeshow-bar">
      <div>
        <p class="aura-tradeshow-kicker">Aura’s booth</p>
        <h1 id="auraTradeshowTitle">VIP NFT Tradeshow</h1>
      </div>
      <span class="aura-tradeshow-door" id="auraTradeshowDoor"></span>
      <button type="button" class="aura-tradeshow-back" id="auraTradeshowAlley">← Alley</button>
    </div>
    <div class="aura-tradeshow-account aura-tradeshow-tools">
      <div class="aura-tradeshow-search">
        <input type="checkbox" id="auraTradeshowSearchToggle" class="aura-tradeshow-search-toggle">
        <label for="auraTradeshowSearchToggle" class="aura-tradeshow-search-btn" aria-label="Find a…">Find</label>
        <input type="search" id="auraTradeshowSearch" placeholder="Find a…" aria-label="Search the collection">
      </div>
      <p class="aura-tradeshow-vip" id="auraTradeshowVip"></p>
      <a class="aura-tradeshow-back" id="auraTradeshowSession" href="/save.html">Log in</a>
      <button type="button" class="aura-tradeshow-close" id="auraTradeshowClose" aria-label="Close tradeshow">×</button>
    </div>
    <div class="aura-tradeshow-tools aura-tradeshow-filters">
      <div class="aura-tradeshow-have" role="group" aria-label="Collected or locked">
        <button type="button" data-have="collected">Collected</button>
        <button type="button" data-have="locked">Locked</button>
      </div>
      <div class="aura-tradeshow-quick" role="group" aria-label="Quick links">
        <button type="button" data-folder="open">Open</button>
        <button type="button" data-folder="closed">Closed</button>
        <button type="button" data-folder="minted">Minted</button>
        <button type="button" data-folder="felix">Felix</button>
        <button type="button" class="aura-tradeshow-limited-tab" data-folder="limited">Limited</button>
      </div>
    </div>
    <div class="aura-tradeshow-tools aura-tradeshow-queue" id="auraCollectionMintToolbar" role="group" aria-label="Mint collected rewards" hidden>
      <div class="aura-collection-actions">
      <button type="button" data-collection-mint hidden>Mint Rewards (up to 25)</button>
      <progress id="auraCollectionLoadingBar" aria-label="Loading VIP collection or Xaman request" hidden></progress>
      <button type="button" data-collection-receive hidden>Resume Checkout</button>
      <button type="button" data-collection-pause hidden>Pause batch</button>
      </div>
      <span id="auraCollectionMintProgress" role="status" hidden></span>
      <p id="auraCollectionKeepOpen" class="aura-collection-warning" role="status" hidden></p>
      <div id="auraCollectionRecovery" class="aura-owned-edition-list" hidden></div>
    </div>
    <div class="aura-tradeshow-main">
      <div class="aura-tradeshow-tree-shell">
        <input type="checkbox" id="auraTradeshowTreeDrawer" class="aura-tradeshow-tree-drawer">
        <label for="auraTradeshowTreeDrawer" class="aura-tradeshow-tree-drawer-btn">Browse collection</label>
        <nav class="aura-tradeshow-tree" id="auraTradeshowTree" aria-label="Penny Fever Collection"></nav>
      </div>
      <div class="aura-tradeshow-content"><p class="aura-tradeshow-note" id="auraTradeshowNote" role="status"></p><div class="aura-tradeshow-body" id="auraTradeshowBody"></div></div>
    </div>
    <div class="aura-xrp-till" id="auraXrpTill" hidden>
      <div class="aura-xrp-till-card" role="dialog" aria-modal="true" aria-labelledby="auraXrpTillName">
        <button type="button" class="aura-xrp-till-close" data-xrp-close aria-label="Close XRP till">×</button>
        <div class="aura-xrp-till-media">
          <img id="auraXrpTillImg" alt="" width="220" height="220">
          <div class="aura-xrp-till-qr" id="auraXrpTillQrWrap" hidden>
            <img id="auraXrpTillQr" alt="Xaman signing QR" width="220" height="220">
            <p>Scan with Xaman</p>
          </div>
        </div>
        <h2 id="auraXrpTillName"></h2>
        <p id="auraXrpTillStock"></p>
        <p id="auraXrpTillPrice"></p>
        <p id="auraXrpTillCopy">MotherPC will open a Xaman sign request for this piece. You sign. We never hold guest keys.</p>
        <p id="auraCollectionMintStep" role="status" hidden></p>
        <a class="aura-xrp-till-open" id="auraXrpTillOpen" hidden rel="noopener" target="_blank">Open in Xaman</a>
        <button type="button" class="aura-xrp-till-done" data-xrp-check hidden>Check mint status</button>
        <button type="button" class="aura-xrp-till-again" data-xrp-buy-another hidden></button>
        <button type="button" class="aura-xrp-till-done" data-xrp-done hidden>Close</button>
        <button type="button" class="aura-xrp-till-ready" data-xrp-hold>Notify me</button>
        <button type="button" class="aura-xrp-till-cancel" data-xrp-cancel hidden>Cancel unsigned request</button>
        <button type="button" class="aura-xrp-till-done" data-collection-pause hidden>Pause collection</button>
        <div class="aura-checkout-navigation">
          <button type="button" data-xrp-resume hidden>Resume checkout</button>
          <button type="button" data-xrp-return>Back to Tradeshow</button>
        </div>
      </div>
    </div>`;
  const inspect = document.createElement('div');
  inspect.className = 'aura-tradeshow-inspect';
  inspect.id = 'auraTradeshowInspect';
  inspect.hidden = true;
  inspect.setAttribute('role', 'dialog');
  inspect.setAttribute('aria-modal', 'true');
  inspect.setAttribute('aria-labelledby', 'auraTradeshowInspectName');
  inspect.innerHTML = `
    <div class="aura-tradeshow-inspect-card">
      <button type="button" class="aura-tradeshow-inspect-close" data-inspect-close aria-label="Close item details">×</button>
      <div class="aura-tradeshow-inspect-stage" id="auraTradeshowInspectStage" tabindex="0" role="group" aria-label="Hold and spin this keepsake">
        <img id="auraTradeshowInspectImg" alt="" draggable="false">
      </div>
      <p class="aura-tradeshow-inspect-how" id="auraTradeshowInspectHow">Hold and spin, or tap a side. Arrow keys spin; Home is the front.</p>
      <div class="aura-tradeshow-inspect-turn">
        <button type="button" data-inspect-face="front">Front</button>
        <button type="button" data-inspect-face="left">Left</button>
        <button type="button" data-inspect-face="back">Back</button>
        <button type="button" data-inspect-face="right">Right</button>
        <button type="button" data-inspect-spin="1" aria-label="Rotate">Rotate</button>
      </div>
      <section class="aura-tradeshow-inspect-copy">
        <p class="aura-tradeshow-inspect-kicker" id="auraTradeshowInspectSource"></p>
        <p id="auraTradeshowInspectAvailability" aria-live="polite"></p>
        <h2 id="auraTradeshowInspectName"></h2>
        <p class="aura-tradeshow-inspect-price" id="auraTradeshowInspectPrice"></p>
        <p id="auraTradeshowInspectNote"></p>
        <p id="auraTradeshowInspectStock"></p>
        <button type="button" class="owned aura-owned-editions" id="auraInspectOwned" data-owned-editions="" aria-expanded="false" hidden></button>
        <div class="aura-owned-edition-list" hidden></div>
        <p class="aura-tradeshow-inspect-sample" id="auraTradeshowInspectSample">Offline sample · the original is the NFT token.</p>
        <p id="auraTradeshowInspectNftNote" hidden>Scan in Xaman. This QR opens Aura’s till address. Minting is still on hold.</p>
        <div class="aura-tradeshow-views aura-tradeshow-inspect-views">
          <button type="button" data-inspect-view="website" aria-pressed="true">Website</button>
          <button type="button" data-inspect-view="nft">NFT</button>
        </div>
        <div class="aura-tradeshow-inspect-actions">
          <button type="button" data-inspect-play hidden></button>
          <button type="button" data-inspect-buy hidden></button>
          <button type="button" data-nft-batch-buy hidden>Buy multiple · up to 8</button>
          <button type="button" data-inspect-claim hidden></button>
        </div>
        <button type="button" class="aura-tradeshow-inspect-back" data-inspect-close>← Back to tradeshow</button>
      </section>
    </div>`;
  overlay.append(inspect);
  document.body.append(overlay);
  nftBatchUI = mountNftBatches(overlay, {
    account: vipAccount, canBuy: canBatchBuy, name: id => modelItem(id).name || id,
    enabled: () => rewardMint.account === vipAccount() && rewardMint.batchLimit === 8 && !tradeshowBlocked(),
    toolbarResume: true,
    recover: checkCollectionReceipts,
    canPaidBuy: id => !!paidBasketInfo(id)?.available,
    checkoutChanged: data => paidNftBasket?.checkoutStatus(data),
    checkoutError: error => paidNftBasket?.checkoutError(error),
    checkoutPaused: operation => paidNftBasket?.paused(operation),
    checkoutContinued: operation => paidNftBasket?.continueSaved(operation),
    maxQuantity: id => Math.min(8, remainingFor(id), walletBuyCap(id) - nftOwnedCount(id)),
    hasPrepared: () => rewardMint.account === vipAccount() && (!!rewardMint.pending?.length
      || (collectionQueue?.account === vipAccount() && collectionQueue.ready.some(id => !nftOwnedCount(id)))),
    pause: () => { pauseCollectionQueue(); closeXrpTill(); closeInspect(); },
    refresh: () => {
      const account = vipAccount();
      if (!account) return;
      Promise.all([loadMinted(), loadRewardMint(account, eligibilityRevision)]).then(() => {
        if (account !== vipAccount()) return;
        if (collectionQueue?.account === account && collectionQueue.phase === 'receive') {
          const pending = new Set(rewardMint.pending || []);
          collectionQueue.receiveIndex = collectionQueue.ready.filter(id => !pending.has(id)).length;
          if (collectionQueue.receiveIndex >= collectionQueue.ready.length) collectionQueue.phase = 'complete';
        }
        paint();
      });
    },
  });
  paidNftBasket = mountPaidNftBasket(overlay, {
    account: vipAccount,
    info: paidBasketInfo,
    pause: () => { pauseCollectionQueue(); closeXrpTill(); closeInspect(); },
    refresh: async () => {
      const account = vipAccount();
      await Promise.all([loadStock(), loadMinted(), loadRewardMint(account, eligibilityRevision)]);
      if (account !== vipAccount()) throw Error('Sign in to your own VIP before checking out.');
    },
    purchase: (item, quantity, operation) => nftBatchUI.purchase(item, quantity, operation),
    resume: operation => nftBatchUI.resumeSaved(operation),
    cancel: operation => nftBatchUI.cancelSaved(operation),
    guide: progress => nftBatchUI.basketProgress(progress),
    finish: () => nftBatchUI.close(),
    receipt: async operation => {
      const response = await fetch(`${NFT_HOST}/api/penny-fever/verified/nft-batch/receipt`, {
        method: 'POST', cache: 'no-store', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: vipAccount(), operation}),
      });
      const data = await response.json();
      if (!response.ok || data?.ok !== true) throw Object.assign(Error(data?.message || 'Could not check the saved purchase receipt.'), {code: data?.error});
      return data;
    },
  });
  paidNftBasket.paint();
  paidNftBasket.refresh();
  document.addEventListener('keydown', onOverlayKey, true);
  overlay.querySelector('#auraTradeshowClose').addEventListener('click', closeTradeshow);
  overlay.querySelector('#auraTradeshowAlley').addEventListener('click', () => closeTradeshow());
  overlay.querySelector('#auraTradeshowSearch').addEventListener('input', (e) => {
    query = e.target.value.trim().toLowerCase();
    paint();
  });
  overlay.querySelector('#auraTradeshowSearchToggle')?.addEventListener('change', (e) => {
    if (e.target.checked) overlay.querySelector('#auraTradeshowSearch')?.focus();
  });
  overlay.addEventListener('keydown', (e) => {
    const stage = e.target.closest('[data-inspect]');
    if (!stage || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    const card = stage.closest('.aura-tradeshow-card');
    openInspect(stage.dataset.inspect, card?.dataset.mode);
  });
  overlay.addEventListener('click', (e) => {
    const batchBuy = e.target.closest('[data-nft-batch-buy]');
    if (batchBuy && !batchBuy.disabled && canBatchBuy(batchBuy.dataset.nftBatchBuy)) {
      e.preventDefault();
      nftBatchUI.buy(batchBuy.dataset.nftBatchBuy);
      return;
    }
    if (e.target.closest('#auraTradeshowSession') && window.InstapicGuestIdentity?.read?.()?.session_token) {
      e.preventDefault();
      pauseCollectionQueue();
      closeXrpTill();
      const button = overlay.querySelector('#auraTradeshowSession');
      button.textContent = 'Signing out…';
      import('./vip-spot.js?v=silent-logout-2').then(module => module.signOutVip({stayInGame:true})).catch(() => {
        button.textContent = 'Log out';
        const note = overlay.querySelector('#auraTradeshowNote');
        if (note) note.textContent = 'Could not preserve progress before signing out. Please try again.';
      });
      return;
    }
    if (e.target.closest('[data-collection-receive]')) {
      e.preventDefault();
      const account = vipAccount();
      Promise.resolve(paidNftBasket?.resumeIfPending()).then(resumed => {
        if (resumed || account !== vipAccount() || overlay.hidden) return;
        if (nftBatchUI && rewardMint.batchLimit === 8) nftBatchUI.resume();
        else checkCollectionReceipts();
      }).catch(() => { if (account === vipAccount()) paidNftBasket?.open(); });
      return;
    }
    if (e.target.closest('[data-collection-mint]')) {
      e.preventDefault();
      startCollectionQueue();
      return;
    }
    if (e.target.closest('[data-clear-tradeshow-filters]')) {
      query = ''; haveFilter = '';
      overlay.querySelector('#auraTradeshowSearch').value = '';
      paint();
      overlay.querySelector('#auraTradeshowBody').scrollTop = 0;
      return;
    }
    if (e.target.closest('[data-collection-pause]')) {
      e.preventDefault();
      pauseCollectionQueue();
      closeXrpTill();
      return;
    }
    if (e.target.closest('[data-xrp-check]')) {
      e.preventDefault();
      if (typeof tillTick === 'function') tillTick();
      return;
    }
    const tog = e.target.closest('[data-toggle]');
    if (tog) {
      e.preventDefault();
      const id = tog.dataset.toggle;
      if (openNodes.has(id)) openNodes.delete(id);
      else openNodes.add(id);
      paint();
      return;
    }
    const haveBtn = e.target.closest('[data-have]');
    if (haveBtn) {
      e.preventDefault();
      const next = haveBtn.dataset.have;
      haveFilter = haveFilter === next ? '' : next;
      paint();
      return;
    }
    const openBook = e.target.closest('[data-open-book]');
    if (openBook) {
      e.preventDefault();
      const id = openBook.dataset.openBook;
      folder = 'book:' + id;
      revealBook(id);
      closeTreeDrawer();
      paint();
      overlay.querySelector('#auraTradeshowBody').scrollTop = 0;
      return;
    }
    const fold = e.target.closest('[data-folder]');
    if (fold) {
      folder = fold.dataset.folder;
      if (fold.closest('.aura-tradeshow-section-links')) {
        query = ''; haveFilter = ''; overlay.querySelector('#auraTradeshowSearch').value = '';
      }
      if (folder.startsWith('book:')) revealBook(folder.slice(5));
      if (folder === 'minted' || folder === 'mine') haveFilter = '';
      if (folder === 'limited') {
        for (const id of LIMITED) openNodes.delete('book:' + id);
      }
      if (folder.startsWith('book:') || folder === 'open' || folder === 'closed' || folder === 'everyday' || folder === 'felix' || folder === 'limited' || folder === 'convert') openNodes.add(folder);
      if (folder === 'everyday') openNodes.add('book:penny-collector-book');
      if (folder === 'open' || folder === 'closed' || folder.startsWith('stall:')) openNodes.add('book:penny-collector-book');
      if (folder.startsWith('stall:')) {
        const kind = stallFolderKind(folder);
        if (kind) openNodes.add(kind);
      }
      if (folder.startsWith('book:') && LIMITED.has(folder.slice(5))) openNodes.add('limited');
      if (folder === 'book:' + SNAP_BOOK) openNodes.add('felix');
      if (folder.startsWith('item:')) {
        const item = (window.PennyFeverInventoryModel?.definitions || []).find((it) => it.id === folder.slice(5));
        if (isEveryday(item)) {
          openNodes.add('book:penny-collector-book'); openNodes.add('everyday');
        } else if (item && isLimited(item)) {
          openNodes.add('limited');
        } else if (item?.id === SNAP_BOOK || isFelix(item || {})) {
          openNodes.add('felix');
        } else if (item?.book) {
          openNodes.add('book:penny-collector-book');
          openNodes.add('book:' + item.book);
        }
        if (item && isFelix(item)) openNodes.add('felix');
      }
      closeTreeDrawer();
      paint();
      overlay.querySelector('#auraTradeshowBody').scrollTop = 0;
      return;
    }
    const inspectClose = e.target.closest('[data-inspect-close]');
    if (inspectClose || e.target === overlay.querySelector('#auraTradeshowInspect')) {
      e.preventDefault();
      closeInspect();
      return;
    }
    const ownedEditions = e.target.closest('[data-owned-editions]');
    if (ownedEditions) {
      e.preventDefault();
      showOwnedEditions(ownedEditions);
      return;
    }
    const inspectView = e.target.closest('[data-inspect-view]');
    if (inspectView) {
      e.preventDefault();
      setInspectMode(inspectView.dataset.inspectView);
      return;
    }
    const inspectFaceBtn = e.target.closest('[data-inspect-face]');
    if (inspectFaceBtn) {
      e.preventDefault();
      setInspectFace(inspectFaceBtn.dataset.inspectFace);
      return;
    }
    const inspectSpin = e.target.closest('[data-inspect-spin]');
    if (inspectSpin) {
      e.preventDefault();
      stepInspect(Number(inspectSpin.dataset.inspectSpin || 1));
      return;
    }
    const inspectPlay = e.target.closest('[data-inspect-play]');
    if (inspectPlay && !inspectPlay.disabled) {
      e.preventDefault();
      goPlayAtStall(inspectPlay.dataset.goStall);
      return;
    }
    const inspectBuy = e.target.closest('[data-inspect-buy]');
    if (inspectBuy && !inspectBuy.disabled) {
      e.preventDefault();
      closeInspect();
      openXrpTill(inspectBuy.dataset.buy);
      return;
    }
    const inspectClaim = e.target.closest('[data-inspect-claim]');
    if (inspectClaim && !inspectClaim.disabled) {
      e.preventDefault();
      closeInspect();
      claimWithTokens(inspectClaim.dataset.claim);
      return;
    }
    const inspectStage = e.target.closest('[data-inspect]');
    if (inspectStage) {
      e.preventDefault();
      const card = inspectStage.closest('.aura-tradeshow-card');
      openInspect(inspectStage.dataset.inspect, card?.dataset.mode);
      return;
    }
    const go = e.target.closest('[data-go-stall]');
    if (go) {
      e.preventDefault();
      goPlayAtStall(go.dataset.goStall);
      return;
    }
    const viewBtn = e.target.closest('[data-view]');
    if (viewBtn) {
      e.preventDefault();
      setCardView(viewBtn.closest('.aura-tradeshow-card'), viewBtn.dataset.view);
      return;
    }
    if (e.target.closest('[data-xrp-resume]')) {
      e.preventDefault();
      closeXrpTill({pauseQueue: false});
      startCollectionQueue();
      return;
    }
    if (e.target.id === 'auraXrpTill' || e.target.closest('[data-xrp-close]') || e.target.closest('[data-xrp-done]') || e.target.closest('[data-xrp-return]')) {
      e.preventDefault();
      closeXrpTill();
      return;
    }
    const again = e.target.closest('[data-xrp-buy-another]');
    if (again && again.dataset.item) {
      e.preventDefault();
      const nextId = again.dataset.item;
      pendingCheckouts.delete(nextId);
      closeXrpTill();
      openXrpTill(nextId);
      return;
    }
    const ownerMint = e.target.closest('[data-owner-mint]');
    if (ownerMint) {
      e.preventDefault();
      pauseCollectionQueue();
      openXrpTill(ownerMint.dataset.ownerMint, {ownerMint: true});
      return;
    }
    const hold = e.target.closest('[data-xrp-hold]');
    if (hold && hold.dataset.item) {
      e.preventDefault();
      queueXrpPlace(hold.dataset.item);
      return;
    }
    const cancel = e.target.closest('[data-xrp-cancel]');
    if (cancel) {
      e.preventDefault();
      cancelXrpPurchase();
      return;
    }
    const claimBtn = e.target.closest('[data-claim]');
    if (claimBtn && !claimBtn.disabled) {
      e.preventDefault();
      claimWithTokens(claimBtn.dataset.claim);
      return;
    }
    const buy = e.target.closest('[data-buy]');
    if (buy && !buy.disabled) {
      e.preventDefault();
      openXrpTill(buy.dataset.buy);
      return;
    }
    const faceBtn = e.target.closest('[data-face]');
    const spin = e.target.closest('[data-spin]');
    if (!faceBtn && !spin) return;
    const card = (faceBtn || spin).closest('.aura-tradeshow-card');
    if (!card || card.dataset.mode === 'nft') return;
    const views = VIEWS.filter((view) => card.dataset[view] === '1');
    if (!views.length) return;
    let next = Number(card.dataset.face) || 0;
    if (faceBtn) {
      const named = views.indexOf(faceBtn.dataset.face);
      if (named < 0) return;
      next = named;
    } else {
      if (views.length < 2) return;
      next = (next + Number(spin.dataset.spin || 1) + views.length) % views.length;
    }
    poseCard(card, next);
  });
  return overlay;
}

function inspectViews(item) {
  return VIEWS.filter((view) => item?.turnaround || view === 'front');
}

function destroyInspectTurn() {
  if (inspectTurn) {
    try { inspectTurn.destroy(); } catch {}
    inspectTurn = null;
  }
}
function plateArt(art) {
  if (!art?.faces?.length) return art;
  const faces = art.faces.map((src) => {
    const w = src.width || 1;
    const h = src.height || 1;
    const punched = document.createElement('canvas');
    punched.width = w;
    punched.height = h;
    const ctx = punched.getContext('2d', {willReadFrequently: true});
    ctx.drawImage(src, 0, 0);
    const pixels = ctx.getImageData(0, 0, w, h);
    let left = w, top = h, right = -1, bottom = -1;
    const data = pixels.data;
    const edge = (i) => {
      const p = i * 4;
      const lo = Math.min(data[p], data[p + 1], data[p + 2]);
      const hi = Math.max(data[p], data[p + 1], data[p + 2]);
      return data[p + 3] <= 8 || (lo >= 225 && hi - lo <= 14);
    };
    const seen = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0, tail = 0;
    const visit = (i) => {
      if (i < 0 || i >= w * h || seen[i] || !edge(i)) return;
      seen[i] = 1;
      queue[tail++] = i;
    };
    for (let x = 0; x < w; x++) { visit(x); visit((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { visit(y * w); visit(y * w + w - 1); }
    while (head < tail) {
      const i = queue[head++];
      data[i * 4 + 3] = 0;
      const x = i % w;
      if (x > 0) visit(i - 1);
      if (x < w - 1) visit(i + 1);
      visit(i - w);
      visit(i + w);
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 96) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
    }
    ctx.putImageData(pixels, 0, 0);
    if (right < left) return punched;
    const pad = Math.round(Math.max(right - left, bottom - top) * 0.06);
    const bw = right - left + 1;
    const bh = bottom - top + 1;
    const size = Math.max(bw, bh) + pad * 2;
    const out = document.createElement('canvas');
    out.width = size;
    out.height = size;
    out.getContext('2d').drawImage(punched, left, top, bw, bh, (size - bw) / 2, (size - bh) / 2, bw, bh);
    return out;
  });
  return {...art, faces};
}

function paintInspectFaces(face) {
  overlay?.querySelectorAll('[data-inspect-face]').forEach((button) => {
    const name = button.dataset.inspectFace;
    const on = inspectViews(inspectItem).includes(name);
    button.hidden = !on;
    button.disabled = inspectMode === 'nft' || !on;
    button.setAttribute('aria-pressed', String(on && name === face));
  });
  overlay?.querySelectorAll('[data-inspect-spin]').forEach((button) => {
    button.disabled = inspectMode === 'nft' || inspectViews(inspectItem).length < 2;
  });
  const how = overlay?.querySelector('#auraTradeshowInspectHow');
  if (how) how.hidden = inspectMode === 'nft';
}

function closeInspect() {
  const panel = overlay?.querySelector('#auraTradeshowInspect');
  if (!panel) return;
  inspectToken += 1;
  destroyInspectTurn();
  panel.hidden = true;
  inspectItem = null;
  overlay?.querySelector('.aura-tradeshow-card [data-inspect]')?.focus?.();
}

function setInspectFace(name) {
  if (!inspectItem || inspectMode === 'nft') return;
  const views = inspectViews(inspectItem);
  const i = views.indexOf(name);
  if (i < 0) return;
  inspectFace = i;
  if (inspectTurn) {
    const n = inspectTurn.art?.faces?.length || views.length || 4;
    inspectTurn.angle = (i / n) * Math.PI * 2;
    inspectTurn.vel = 0;
    inspectTurn.draw();
  }
  paintInspectFaces(name);
}

function stepInspect(dir) {
  if (!inspectItem || inspectMode === 'nft') return;
  const views = inspectViews(inspectItem);
  if (views.length < 2) return;
  if (inspectTurn) {
    inspectTurn.step(dir);
    return;
  }
  inspectFace = (inspectFace + dir + views.length) % views.length;
  setInspectMode('website');
}

async function mountInspectTurntable(item, token) {
  const stage = overlay?.querySelector('#auraTradeshowInspectStage');
  if (!stage) return;
  destroyInspectTurn();
  stage.replaceChildren();
  const preview = document.createElement('img');
  preview.id = 'auraTradeshowInspectImg';
  preview.alt = item.name || '';
  preview.draggable = false;
  preview.src = faceSrc(item, inspectViews(item)[inspectFace] || 'front');
  stage.append(preview);
  try {
    const [{loadArt}, {Turntable}] = await Promise.all([
      import('./items/art.js?v=treasure-lite-1'),
      import('./items/turntable.js?v=rotate-3'),
    ]);
    if (token !== inspectToken || inspectMode !== 'website' || inspectItem !== item) return;
    const art = plateArt(await loadArt(item));
    if (token !== inspectToken || inspectMode !== 'website' || inspectItem !== item) return;
    stage.replaceChildren();
    inspectTurn = new Turntable(stage);
    inspectTurn.onView = (name) => {
      const views = inspectViews(item);
      const i = views.indexOf(name);
      if (i >= 0) inspectFace = i;
      paintInspectFaces(name);
    };
    inspectTurn.show(item, art, false);
    if (inspectFace) setInspectFace(inspectViews(item)[inspectFace] || 'front');
  } catch {
    if (token !== inspectToken) return;
  }
}

function setInspectMode(mode) {
  if (!inspectItem) return;
  const inspectInfo = stallDoor(stallForPrize(inspectItem));
  const nftAvailable = nftViewAvailable(inspectItem, inspectInfo);
  inspectMode = mode === 'nft' && nftAvailable ? 'nft' : 'website';
  if (inspectMode === 'nft' && !guestOwns(inspectItem.id) && shopAction(inspectItem.id).ready) {
    const id = inspectItem.id; closeInspect(); openXrpTill(id); return;
  }
  const stage = overlay?.querySelector('#auraTradeshowInspectStage');
  const nftNote = overlay?.querySelector('#auraTradeshowInspectNftNote');
  if (nftNote) {
    nftNote.hidden = inspectMode !== 'nft';
    if (inspectMode === 'nft') nftNote.textContent = guestOwns(inspectItem.id)
      ? 'NFT artwork supplied by MotherPC after purchase.'
      : `Scan in Xaman · ${purchaseLabel(inspectItem) || formatXrp(inspectItem.id) || 'posted price'} to ${auraTillAddress()}.`;
  }
  overlay?.querySelectorAll('[data-inspect-view]').forEach((button) => {
    button.disabled = button.dataset.inspectView === 'nft' && !nftAvailable;
    button.setAttribute('aria-pressed', String(button.dataset.inspectView === inspectMode));
  });
  if (inspectMode === 'nft') {
    inspectToken += 1;
    destroyInspectTurn();
    if (stage) {
      stage.replaceChildren();
      const ownedPlate = guestOwns(inspectItem.id);
      stage.classList.toggle('is-nft-qr', !ownedPlate);
      const img = document.createElement('img');
      img.id = 'auraTradeshowInspectImg';
      img.draggable = false;
      img.src = nftViewSrc(inspectItem.id) || buyQrSrc(inspectItem.id);
      img.alt = `${inspectItem.name || inspectItem.id} · ${ownedPlate ? 'NFT artwork' : 'Xaman till'}`;
      stage.append(img);
    }
    paintInspectFaces(guestOwns(inspectItem.id) ? 'nft' : 'front');
    return;
  }
  overlay?.querySelector('#auraTradeshowInspectStage')?.classList.remove('is-nft-qr');
  paintInspectFaces(inspectViews(inspectItem)[inspectFace] || 'front');
  mountInspectTurntable(inspectItem, ++inspectToken);
}

function openInspect(id, startMode = 'website') {
  const item = modelItem(id);
  if (!item?.id) return;
  inspectItem = item;
  inspectMode = 'website';
  inspectFace = 0;
  const stall = stallForPrize(item);
  const info = stallDoor(stall);
  const act = actionFor(item, info);
  const play = playTap(item, info, stall);
  const panel = overlay?.querySelector('#auraTradeshowInspect');
  if (!panel) return;
  panel.hidden = false;
  panel.querySelector('#auraTradeshowInspectName').textContent = item.name || item.id;
  const inspectPrice = panel.querySelector('#auraTradeshowInspectPrice');
  if (inspectPrice) inspectPrice.textContent = purchaseLabel(item);
  panel.querySelector('#auraTradeshowInspectSource').textContent = tokenClaim(item.id)
    ? 'Aura’s token counter'
    : (isFelix(item)
      ? 'Felix’s photo booth · vendor portraits'
      : (isLimited(item)
        ? 'Aura Limited · optional XRP shelf'
        : (stall && stall.id !== 'ticket-booth' ? `${stall.host} · ${stall.title}` : (item.source || 'Aura’s tradeshow'))));
  const status = panel.querySelector('#auraTradeshowInspectAvailability');
  if (tokenClaim(item.id)) status.textContent = 'The token requirements are shown below. Trading opens when the purse connection is ready.';
  else if (isEveryday(item)) status.textContent = TOKEN_TERMS[item.id] ? 'Fungible XRPL tokens · connected Xaman wallet' : 'Aura’s entrance booth · game purse';
  else if (isLimited(item)) status.textContent = 'Aura Limited · posted XRP price';
  else if (isFelix(item)) status.textContent = `${stallDoor(stallById('snap')).mintable ? 'Photo booth open' : 'Photo booth closed'} · unlock at Felix`;
  else if (info.money) status.textContent = 'Aura’s till';
  else status.textContent = act.reward && !act.disabled ? 'Collected reward · ready to mint'
    : `${info.mintable ? 'Stall open' : 'Stall closed'} · ${onShelf(item.id) ? (act.disabled ? act.label : 'Buy with XRP') : 'Not on the NFT shelf yet'}`;
  panel.querySelector('#auraTradeshowInspectNote').textContent = claimLine(item, info);
  let requirements = panel.querySelector('[data-inspect-requirements]');
  if (!requirements) { requirements = document.createElement('div'); requirements.dataset.inspectRequirements = ''; panel.querySelector('.aura-tradeshow-inspect-actions').before(requirements); }
  requirements.innerHTML = tankMarkup(item);
  const inspectOwned = nftOwnedCount(item.id);
  panel.querySelector('#auraTradeshowInspectStock').textContent = isFelix(item)
    ? 'Supply is earned through Felix’s photo booth.'
    : formatStock(item.id);
  const ownedButton = panel.querySelector('#auraInspectOwned');
  if (ownedButton) {
    ownedButton.hidden = !inspectOwned;
    ownedButton.disabled = false;
    ownedButton.dataset.ownedEditions = item.id;
    ownedButton.setAttribute('aria-expanded', 'false');
    ownedButton.textContent = `You own ${inspectOwned.toLocaleString('en-AU')} · view editions`;
  }
  const ownedList = panel.querySelector('.aura-owned-edition-list');
  if (ownedList) { ownedList.hidden = true; ownedList.replaceChildren(); }
  const sample = overlay.querySelector('#auraTradeshowInspectSample');
  const sampleText = nftSampleNote(item);
  if (sample) {
    sample.hidden = !sampleText;
    sample.textContent = sampleText;
  }
  const playButton = panel.querySelector('[data-inspect-play]');
  playButton.hidden = !play;
  if (play) { playButton.textContent = play.label; playButton.dataset.goStall = play.id; }
  const buyButton = panel.querySelector('[data-inspect-buy]');
  const claimButton = panel.querySelector('[data-inspect-claim]');
  buyButton.hidden = !!act.claim;
  buyButton.disabled = !!act.disabled;
  buyButton.textContent = act.label;
  buyButton.dataset.buy = item.id;
  const batchBuy = panel.querySelector('[data-nft-batch-buy]');
  batchBuy.hidden = !canBatchBuy(item.id);
  batchBuy.dataset.nftBatchBuy = item.id;
  claimButton.hidden = !act.claim;
  claimButton.disabled = !!act.disabled;
  claimButton.textContent = act.label;
  claimButton.dataset.claim = item.id;
  const nftButton = panel.querySelector('[data-inspect-view="nft"]');
  nftButton.hidden = !nftViewAvailable(item, info);
  setInspectMode(startMode === 'nft' ? 'nft' : 'website');
  panel.querySelector('#auraTradeshowInspectStage')?.focus();
}

function snapMint(item) {
  if (!onShelf(item.id)) return null;
  return {label: 'Not for sale · unlock at Felix’s photo booth', disabled: true, snap: true};
}
function actionFor(item, stallInfo) {
  if (isEveryday(item)) return {label: TOKEN_TERMS[item.id] ? `Buy ${TOKEN_TERMS[item.id].code} · Xaman` : 'Go to Aura’s entrance booth', ready: true, currency: true};
  if (pendingCheckouts.has(item.id)) {
    const pending = pendingCheckouts.get(item.id) || {};
    return {
      label: 'Continue checkout',
      disabled: false,
      ready: true,
      reward: !!pending.reward,
      purchase: !pending.reward || !!rewardMint.prices?.[item.id],
    };
  }
  if (folder !== 'convert' && rewardMint.account === vipAccount() && rewardMint.enabled && rewardMint.ownerItems?.includes(item.id)) {
    return {label: 'Mint now · owner copy · no XRP price', ready: true, reward: true, ownerMint: true};
  }
  const claim = tokenClaim(item.id);
  const redemption = rewardMint.account === vipAccount() && rewardMint.enabled && rewardMint.items[item.id];
  const purchasePrice = rewardMint.prices?.[item.id];
  const tradedReward = rewardMint.tokenClaims?.includes(item.id);
  if (redemption && redemption !== 'accepted' && (!claim || tradedReward) && (!isFelix(item) || tradedReward || rewardMint.photoItems?.includes(item.id)) && !MONEY.has(item.kind) && (!purchasePrice || stallInfo.mintable || isLimited(item))) {
    if (!mintedReady) return {label: 'Supply unavailable · reopen to retry', disabled: true};
    if (remainingFor(item.id) <= 0 && redemption === 'ready') return {label: 'No copies remain', disabled: true};
    return {label: redemption === 'ready'
      ? (purchasePrice ? `Buy with XRP · ${purchasePrice} XRP` : 'Mint collected reward · network fee only')
      : 'Continue item checkout',
      disabled: false, ready: true, reward: true, purchase: !!purchasePrice};
  }
  if (onShelf(item.id) && !claim && !mintedReady) {
    return {label: 'Supply unavailable · reopen to retry', disabled: true};
  }
  if (isFelix(item)) {
    return snapMint(item) || {label: 'Not for sale · unlock at Felix’s photo booth', disabled: true};
  }
  if (!onShelf(item.id)) {
    return {label: 'Not on the shelf yet', disabled: true};
  }
  if (claim) return {label: overlay?.dataset.tokenBankOwner === vipAccount() && vip() ? 'Trade tokens · Wallet / Tokens' : 'Trading not open yet', disabled: !vip() || overlay?.dataset.tokenBankOwner !== vipAccount(), claim: true};
  if (isLimited(item)) {
    const xrp = formatXrp(item.id);
    const buy = xrp ? `Buy with XRP · ${xrp}` : 'Buy with XRP (get ready)';
    if (!vip()) return {label: xrp ? `Join VIP to buy · ${xrp}` : 'Join VIP to buy with XRP', disabled: true, limited: true};
    if (walletAtCap(item.id)) return {label: `Already in your wallet · ${capLine(item.id)}`, disabled: true, limited: true};
    if (remainingFor(item.id) <= 0) return {label: 'Aura’s pile is gone · trade later', disabled: true, limited: true};
    return {label: `${buy} · ${capLine(item.id)}`, disabled: false, ready: true, limited: true};
  }
  if (MONEY.has(item.kind) || stallInfo.money) {
    return {label: 'Sold at the dollar till', disabled: true};
  }
  if (!stallInfo.mintable) {
    return {label: 'Coming when this stall opens', disabled: true};
  }
  const xrp = formatXrp(item.id);
  const buy = xrp ? `Buy with XRP · ${xrp}` : 'Buy with XRP (get ready)';
  if (!vip()) {
    return {label: xrp ? `Join VIP to buy · ${xrp}` : 'Join VIP to buy with XRP', disabled: true};
  }
  if (walletAtCap(item.id)) {
    return {label: `Wallet cap reached · ${capLine(item.id)}`, disabled: true};
  }
  if (remainingFor(item.id) <= 0) {
    return {label: 'Aura’s pile is gone · trade later', disabled: true};
  }
  if (shopHolding(item.id)) {
    return {label: 'Last copies reserved for play', disabled: true};
  }
  return {label: `${buy} · ${capLine(item.id)}`, disabled: false, ready: true};
}
function shopAction(id) {
  const item = modelItem(id);
  const stall = stallForPrize(item);
  return actionFor(item, stallDoor(stall));
}
function claimLine(item, stallInfo) {
  if (TOKEN_TERMS[item.id]) return `${TOKEN_TERMS[item.id].name} · fungible XRPL tokens. Buy through the connected Xaman wallet.`;
  if (isEveryday(item)) return item.id === 'five-penny-stack' ? 'Five everyday pennies per pack. Pack or open in your purse; Aura’s entrance booth supplies pennies and tickets.' : 'Visit Aura’s entrance booth for this game-purse item.';
  if (shopAction(item.id).ownerMint) return 'Owner copy · mint to RaX only. Network fees apply.';
  if (isFelix(item)) {
    return 'Unlock a session at Felix’s Instapic Photo Booth, run the sitting, then the portrait NFT is yours. Not for sale here.';
  }
  const act = actionFor(item, stallInfo);
  const claim = tokenClaim(item.id);
  if (claim) return `Convert here · ${act.label}`;
  if (isLimited(item)) return `Limited edition · ${act.label}`;
  if (MONEY.has(item.kind) || stallInfo.money) return 'Claim at Aura’s dollar till';
  const stall = stallForPrize(item);
  const host = stall?.host || 'Aura';
  const title = stall?.title || 'her booth';
  if (stall?.id === 'ticket-booth') return `Claim at Aura · ${title} · ${act.label}`;
  return `Play for it at ${host} · ${title} · ${act.label}`;
}
function playTap(item, stallInfo, stall) {
  if (isEveryday(item)) return null;
  if (isLimited(item)) return null;
  if (tokenClaim(item.id)) return null;
  if (isFelix(item)) {
    return {id: 'snap', label: 'Go to Felix’s booth'};
  }
  if (MONEY.has(item.kind) || stallInfo.money || stall?.id === 'ticket-booth') {
    return {id: 'aura', label: 'Go to Aura’s till'};
  }
  return {id: stall.id, label: `${stallInfo.mintable ? 'Play at' : 'Visit'} ${stall.host || 'this stall'}${stallInfo.mintable ? '' : ' · stall closed'}`};
}
function setCardView(card, mode) {
  if (!card) return;
  const next = mode === 'nft' ? 'nft' : 'website';
  const img = card.querySelector('img');
  const id = card.dataset.item;
  if (next === 'nft' && !guestOwns(id) && shopAction(id).ready) { openXrpTill(id); return; }
  card.dataset.mode = next;
  card.classList.toggle('is-nft', next === 'nft');
  card.querySelectorAll('[data-view]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.view === next));
  });
  const label = card.querySelector('[data-face-label]');
  if (next === 'nft') {
    const name = card.dataset.name || id;
    const ownedPlate = guestOwns(id);
    if (img) {
      img.src = nftViewSrc(id) || buyQrSrc(id);
      img.alt = `${name} · ${ownedPlate ? 'NFT artwork' : 'Xaman till'}`;
    }
    if (label) label.textContent = ownedPlate ? 'NFT artwork' : 'checkout QR';
    return;
  }
  if (img) img.alt = card.dataset.name || '';
  poseCard(card, Number(card.dataset.face) || 0);
}
function stopTillTimer() {
  tillTick = null;
  if (tillPoll) {
    clearInterval(tillPoll);
    tillPoll = 0;
  }
}
function stopTillPoll() {
  // Closing or replacing the till also invalidates replies already in flight.
  tillRevision += 1;
  stopTillTimer();
}
function bindTillWake() {
  if (bindTillWake.bound) return;
  bindTillWake.bound = true;
  const wake = () => {
    if (document.visibilityState === 'hidden') return;
    if (typeof tillTick === 'function') tillTick();
  };
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('focus', wake);
  window.addEventListener('pageshow', wake);
}
function resetTillDom(till) {
  if (!till) return;
  delete till.dataset.loading;
  const qr = till.querySelector('#auraXrpTillQr');
  if (qr) qr.removeAttribute('src');
  const qrWrap = till.querySelector('#auraXrpTillQrWrap');
  if (qrWrap) qrWrap.hidden = true;
  const check = till.querySelector('[data-xrp-check]');
  if (check) { check.hidden = true; check.disabled = false; }
  const open = till.querySelector('#auraXrpTillOpen');
  if (open) {
    open.hidden = true;
    open.removeAttribute('href');
  }
  const again = till.querySelector('[data-xrp-buy-another]');
  if (again) {
    again.hidden = true;
    again.textContent = '';
    again.removeAttribute('data-item');
  }
  const done = till.querySelector('[data-xrp-done]');
  if (done) done.hidden = true;
  const hold = till.querySelector('[data-xrp-hold]');
  if (hold) hold.hidden = false;
  const cancel = till.querySelector('[data-xrp-cancel]');
  if (cancel) {
    cancel.hidden = true;
    cancel.disabled = false;
  }
  const copy = till.querySelector('#auraXrpTillCopy');
  if (copy) copy.textContent = 'MotherPC will open a Xaman sign request for this piece. You sign. We never hold guest keys.';
  const img = till.querySelector('#auraXrpTillImg');
  if (img) {
    img.removeAttribute('src');
    img.alt = '';
  }
}
function closeXrpTill({pauseQueue = true} = {}) {
  if (pauseQueue) pauseCollectionQueue();
  stopTillPoll();
  const till = overlay?.querySelector('#auraXrpTill');
  if (till) {
    resetTillDom(till);
    till.hidden = true;
  }
  paintCollectionQueue();
  overlay?.querySelector('#auraTradeshowClose')?.focus();
}
function showTillQr(img, name, text) {
  if (!img) return;
  try {
    img.src = qrDataUrl(text, 5, 8);
    img.alt = `${name} · Xaman sign`;
  } catch {
    img.alt = `${name} · Xaman`;
  }
}
function retryBusyCollectionRead(till, id, account, error) {
  if (error?.code !== 'ledger_unavailable' || !collectionOwnsTill(id, account)) return false;
  const queue = collectionQueue;
  const retries = queue.readRetries || 0;
  if (retries >= 3) return false;
  queue.readRetries = retries + 1;
  queue.retryWaiting = true;
  const delay = 6000 * (2 ** retries);
  stopTillPoll();
  const revision = tillRevision;
  const queueRevision = collectionQueueRevision;
  resetTillDom(till);
  till.hidden = true;
  paintCollectionQueue();
  const progress = overlay?.querySelector('#auraCollectionMintProgress');
  if (progress) progress.textContent = `Ledger busy · retrying this item in ${delay / 1000} seconds (${retries + 1}/3). Keep this page open.`;
  setTimeout(() => {
    if (collectionQueue !== queue || !queue.active || account !== vipAccount()
        || revision !== tillRevision || queueRevision !== collectionQueueRevision) return;
    queue.retryWaiting = false;
    advanceCollectionQueue();
  }, delay);
  return true;
}
function canBuyAnother(id) {
  const act = shopAction(id);
  return !!(act.ready && !act.disabled && !act.claim && !act.reward);
}
function paidBasketInfo(id) {
  const item = modelItem(id);
  if (!item.id) return null;
  const action = shopAction(id);
  const paid = action.ready && !action.disabled && !action.claim && !action.ownerMint && (!action.reward || action.purchase);
  const existing = rewardMint.recovery?.some(order => order.item === id && order.kind === 'paid');
  const allowed = vip() && mintedReady && rewardMint.account === vipAccount() && rewardMint.batchLimit === 8
    && !tradeshowBlocked() && onShelf(id) && !isEveryday(item) && !isFelix(item) && !tokenClaim(id)
    && !MONEY.has(item.kind) && paid && !shopHolding(id) && !existing;
  const max = Math.max(0, Math.min(8, remainingFor(id), walletBuyCap(id) - nftOwnedCount(id)));
  return {name: item.name || id, price: xrpPriceFor(id), max,
    available: !!allowed && max >= 1,
    reason: existing ? 'An existing paid checkout needs checking. Use Resume Checkout.'
      : remainingFor(id) <= 0 ? 'Sold out. Skipped at checkout.'
      : max < 1 ? 'Wallet limit reached.'
      : !allowed ? 'Not currently available for paid checkout.' : ''};
}
function canBatchBuy(id) {
  const act = shopAction(id);
  return vip() && rewardMint.batchLimit === 8 && !tradeshowBlocked() && !!act.ready && !act.disabled && !act.claim && !act.reward
    && !act.ownerMint && !isEveryday(modelItem(id)) && !isFelix(modelItem(id)) && !MONEY.has(modelItem(id).kind)
    && remainingFor(id) >= 2 && walletBuyCap(id) - nftOwnedCount(id) >= 2;
}
function applyTillState(till, data, ctx) {
  const {img, name, account, id, revision, reward} = ctx;
  const ownerMint = !!pendingCheckouts.get(id)?.ownerMint;
  if (collectionQueue?.active && collectionQueue.account === account && collectionQueue.current === id
      && typeof data?.collection_run === 'string') collectionQueue.run = data.collection_run;
  if (data?.mint?.status === 'offer' && collectionOwnsTill(id, account) && collectionQueue.phase === 'prepare') {
    collectionMintPrepared(id, account);
    return {phase: 'prepared'};
  }
  if (data?.mint?.status === 'accepted') {
    if (ownerMint) ownerMintOperations.delete(account + ':' + id);
    pendingCheckouts.delete(id);
    const owned = Math.max(nftOwnedCount(id), 1);
    if (rewardMint.account === account) {
      rewardMint.owned = rewardMint.owned && typeof rewardMint.owned === 'object' ? rewardMint.owned : {};
      rewardMint.owned[id] = owned;
      notifyMintStatus();
    }
  }
  const state = tillStateFromStatus(data, {
    openDeepLink: till.querySelector('#auraXrpTillOpen')?.getAttribute('href'),
    owned: Math.max(nftOwnedCount(id), data?.mint?.status === 'accepted' ? 1 : 0),
    price: xrpPriceFor(id) || formatXrp(id),
    canBuyAnother: data?.mint?.status === 'accepted' && canBuyAnother(id),
  });
  const qrWrap = till.querySelector('#auraXrpTillQrWrap');
  const qrImage = till.querySelector('#auraXrpTillQr');
  if (qrWrap) qrWrap.hidden = !state.showOpen;
  const copy = till.querySelector('#auraXrpTillCopy');
  const open = till.querySelector('#auraXrpTillOpen');
  const again = till.querySelector('[data-xrp-buy-another]');
  const done = till.querySelector('[data-xrp-done]');
  const hold = till.querySelector('[data-xrp-hold]');
  if (copy) copy.textContent = state.message;
  if (open) {
    if (state.showOpen && state.deepLink) {
      open.hidden = false;
      open.href = state.deepLink;
      open.textContent = state.phase === 'accept' ? 'Receive NFT in Xaman'
        : (!reward || Number(data?.amount) > 0 ? 'Approve purchase in Xaman' : 'Sign wallet in Xaman');
      checkoutLinks.set(account + ':' + id, state.deepLink);
    } else {
      open.hidden = true;
      open.removeAttribute('href');
    }
  }
  if (again) {
    again.hidden = !state.showBuyAnother;
    again.textContent = state.buyAnotherLabel || '';
    if (id) again.dataset.item = id;
  }
  if (done) done.hidden = !state.showClose;
  const check = till.querySelector('[data-xrp-check]');
  if (check) check.hidden = state.phase === 'accepted' || !pendingCheckouts.get(id)?.uuid;
  if (hold) hold.hidden = state.phase !== 'open';
  const cancel = till.querySelector('[data-xrp-cancel]');
  if (cancel) {
    cancel.hidden = state.phase !== 'open' || !pendingCheckouts.get(id)?.uuid;
    if (state.phase !== 'open') cancel.disabled = false;
  }
  if (state.phase === 'accepted') {
    collectionMintReceived(id, account);
    const item = modelItem(id);
    if (img) {
      const art = (nftPlates.has(id) && nftPlateSrc(id))
        || (item?.asset && faceSrc(item, 'front'))
        || item?.asset
        || '';
      if (art) img.src = art;
      img.alt = `${name} · minted`;
    }
    const stockLine = till.querySelector('#auraXrpTillStock');
    if (stockLine) stockLine.textContent = formatStock(id);
    stopTillTimer();
    loadMinted();
    if (reward) {
      loadRewardMint(account, eligibilityRevision).then(() => {
        if (revision === tillRevision && !till.hidden) {
          applyTillState(till, data, {...ctx, reward: false});
        }
        paint();
      });
    } else {
      loadRewardMint(account, eligibilityRevision).then(() => paint());
    }
    return state;
  }
  if (state.showOpen && collectionOwnsTill(id, account) && collectionQueue.phase === 'prepare') till.hidden = false;
  if (state.showOpen && qrImage) {
    const qr = state.qr || '';
    if (state.deepLink) {
      // Draw the signing QR locally: remote xumm.app QR images are blocked
      // by the page's image policy, while data images are already allowed.
      showTillQr(qrImage, name, state.deepLink);
    } else if (/^https:\/\/xumm\.app\//i.test(qr)) {
      qrImage.src = qr;
      qrImage.alt = `${name} · Xaman sign`;
    }
  }
  if (state.allowRetry) {
    if (ownerMint) ownerMintOperations.delete(account + ':' + id);
    const hadPending = pendingCheckouts.delete(id);
    if (hadPending) loadRewardMint(account, eligibilityRevision).then(() => paint());
  }
  if (['cancelled', 'expired'].includes(state.phase)) stopTillTimer();
  if (['cancelled', 'expired'].includes(state.phase)
      || ['review_required', 'blocked', 'failed', 'sold_out', 'needs_minter', 'needs_regular_key', 'needs_minter_funding'].includes(data?.mint?.status)) pauseCollectionQueue();
  paintCollectionQueue();
  return state;
}
function showTillPayload(till, img, name, data, account, id) {
  applyTillState(till, {
    status: 'open',
    deep_link: data?.deep_link,
    qr: data?.qr,
    message: data?.message,
    mint: data?.mint,
  }, {img, name, account, id, revision: tillRevision, reward: false});
}
function watchXamanPayload(till, uuid, revision, account, reward, id, ownerMint = false) {
  if (revision !== tillRevision || account !== vipAccount()) return;
  stopTillPoll();
  const pollRevision = tillRevision;
  const img = till.querySelector('#auraXrpTillImg');
  const name = till.querySelector('#auraXrpTillName')?.textContent || 'card';
  const itemId = id || till.dataset.item || '';
  let inFlight = false;
  let refreshRequested = false;
  const tick = (wake = false) => {
    if (pollRevision !== tillRevision) return;
    if ((till.hidden && !collectionOwnsTill(itemId, account)) || account !== vipAccount()) {
      stopTillPoll();
      return;
    }
    if (inFlight) {
      if (wake) refreshRequested = true;
      return;
    }
    inFlight = true;
    const check = till.querySelector('[data-xrp-check]');
    if (check) check.disabled = true;
    fetch(reward ? `${NFT_HOST}/api/penny-fever/verified/${ownerMint ? 'owner-mint' : 'redeem'}/status`
      : `${NFT_HOST}/api/penny-fever/xaman-checkout/status/${uuid}`, reward ? {
        method: 'POST', cache: 'no-store', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: account, payload: uuid}),
      } : {cache: 'no-store'})
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw Object.assign(Error(data?.message || 'Could not confirm this mint. Resume the collection when connected and signed in.'), {code: data?.error});
        return data;
      })
      .then((data) => {
        if (pollRevision !== tillRevision || account !== vipAccount() || (till.hidden && !collectionOwnsTill(itemId, account))) return;
        applyTillState(till, data, {
          img, name, account, id: itemId, revision: pollRevision, reward,
        });
      })
      .catch(error => {
        if (pollRevision !== tillRevision || account !== vipAccount() || (till.hidden && !collectionOwnsTill(itemId, account))) return;
        if (retryBusyCollectionRead(till, itemId, account, error)) return;
        if (['ledger_unavailable', 'receipt_confirmation_required', 'receive_offer_mismatch'].includes(error?.code)) {
          const open = till.querySelector('#auraXrpTillOpen');
          if (open) { open.hidden = true; open.removeAttribute('href'); }
          const qr = till.querySelector('#auraXrpTillQrWrap');
          if (qr) qr.hidden = true;
          stopTillTimer();
        }
        if (ownerMint) {
          stopTillTimer();
          const copy = till.querySelector('#auraXrpTillCopy');
          if (copy) copy.textContent = error?.message || 'Owner mint could not be verified. No next copy was requested.';
          return;
        }
        if (collectionQueue?.active && collectionQueue.current === itemId) {
          till.hidden = false;
          if (['collection_run_expired', 'collection_run_invalid'].includes(error?.code)) {
            collectionQueue.run = null;
            stopTillTimer();
          }
          pauseCollectionQueue();
          const copy = till.querySelector('#auraXrpTillCopy');
          if (copy) copy.textContent = error?.message || 'Collection paused. Resume when connected.';
        }
      }).finally(() => {
        inFlight = false;
        if (pollRevision !== tillRevision || account !== vipAccount() || (till.hidden && !collectionOwnsTill(itemId, account))) return;
        if (check) check.disabled = false;
        if (refreshRequested) { refreshRequested = false; tick(); }
      });
  };
  bindTillWake();
  tillTick = () => tick(true);
  tillPoll = setInterval(tick, 2500);
  tick();
}
function cancelXrpPurchase() {
  pauseCollectionQueue();
  const till = overlay?.querySelector('#auraXrpTill');
  if (!till || till.hidden) return;
  const id = till.dataset.item || '';
  const pending = pendingCheckouts.get(id);
  const uuid = pending?.uuid;
  const copy = till.querySelector('#auraXrpTillCopy');
  const btn = till.querySelector('[data-xrp-cancel]');
  const revision = tillRevision;
  const account = vipAccount();
  const reward = !!pending?.reward;
  if (!uuid) {
    pendingCheckouts.delete(id);
    closeXrpTill();
    loadMinted().then(() => paint());
    return;
  }
  if (btn) btn.disabled = true;
  if (copy) copy.textContent = 'Cancelling this request…';
  fetch(`${NFT_HOST}/api/penny-fever/xaman-checkout/cancel/${encodeURIComponent(uuid)}`, {
    method: 'POST', cache: 'no-store',
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (revision !== tillRevision || account !== vipAccount() || (till.hidden && !collectionOwnsTill(id, account))) return;
    if (!res.ok || data?.ok === false) {
      if (btn) btn.disabled = false;
      if (copy) copy.textContent = data?.message || 'This purchase could not be cancelled.';
      return;
    }
    if (pending?.ownerMint) ownerMintOperations.delete(account + ':' + id);
    pendingCheckouts.delete(id);
    closeXrpTill();
    const refresh = [loadMinted()];
    if (reward) refresh.push(loadRewardMint(account, eligibilityRevision));
    Promise.all(refresh).then(() => paint());
  }).catch(() => {
    if (revision === tillRevision && account === vipAccount() && copy && !till.hidden) {
      if (btn) btn.disabled = false;
      copy.textContent = 'Cancel could not reach MotherPC. Try again in a moment.';
    }
  });
}
function openXrpTill(id, {receiveOnly = false, background = false, ownerMint = false, recovery = null} = {}) {
  if (isEveryday(modelItem(id))) {
    closeInspect();
    if (TOKEN_TERMS[id]) window.dispatchEvent(new CustomEvent('pennyfever:token-shop', {detail: {item: id}}));
    else { closeTradeshow({stayInAlley: true}); const entrance = document.getElementById('pfWorldLeave'); if (entrance) entrance.click(); else window.PennyFeverWorld?.walkTo?.('aura'); }
    return;
  }
  if (collectionQueue?.active && collectionQueue.current !== id) pauseCollectionQueue();
  const batchReward = collectionOwnsTill(id, vipAccount());
  const queuedOwner = batchReward && collectionQueue.ownerIds?.includes(id);
  ownerMint = recovery ? recovery.kind === 'owner' : !receiveOnly && (queuedOwner || !batchReward && (ownerMint || !!pendingCheckouts.get(id)?.ownerMint || !!shopAction(id).ownerMint));
  if (ownerMint && (!vip() || !rewardMint.enabled || rewardMint.account !== vipAccount() || !rewardMint.ownerItems?.includes(id))) return;
  const act = recovery ? {ready: true, reward: recovery.kind !== 'paid', label: 'Check existing NFT order'}
    : ownerMint ? {ready: true, reward: true, purchase: false, label: 'Owner copy to RaX · no purchase payment'}
    : receiveOnly || batchReward ? {ready: true, reward: true, purchase: false, label: 'Mint or receive collected reward'} : shopAction(id);
  if (act.disabled || act.claim || !act.ready) {
    const note = overlay?.querySelector('#auraTradeshowNote');
    if (note) note.textContent = act.label || 'This card is not for XRP yet.';
    return;
  }
  if (!recovery && (!act.reward || act.purchase)) {
    const local = pendingCheckouts.get(id);
    const saved = local?.uuid ? {kind: local.reward ? 'reward' : 'paid', payload: local.uuid}
      : rewardMint.recovery?.find(row => row.item === id && (row.kind === 'paid' || act.purchase && row.kind === 'reward'));
    if (saved) return openXrpTill(id, {recovery: saved});
    closeInspect();
    if (paidNftBasket && paidBasketInfo(id)?.available) paidNftBasket.select(id);
    else {
      const note = overlay?.querySelector('#auraTradeshowNote');
      if (note) note.textContent = 'Paid checkout is not ready. Reopen Tradeshow and use Paid basket.';
    }
    return;
  }
  const till = overlay?.querySelector('#auraXrpTill');
  if (!till) return;
  stopTillPoll();
  resetTillDom(till);
  const revision = tillRevision;
  const account = vipAccount();
  const item = modelItem(id);
  const name = item?.name || id;
  const img = till.querySelector('#auraXrpTillImg');
  const hold = till.querySelector('[data-xrp-hold]');
  const copy = till.querySelector('#auraXrpTillCopy');
  if (img) {
    const art = (nftPlates.has(id) && nftPlateSrc(id)) || (item?.asset && faceSrc(item, 'front')) || item?.asset || '';
    if (art) img.src = art;
    else img.removeAttribute('src');
    img.alt = `${name} · NFT artwork`;
  }
  till.dataset.item = id;
  till.querySelector('#auraXrpTillName').textContent = name;
  till.querySelector('#auraXrpTillStock').textContent = formatStock(id);
  till.querySelector('#auraXrpTillPrice').textContent = act.reward && !act.purchase
    ? `${act.label}. Open Xaman on this phone, or scan the QR from another device. Network fee only. We never hold guest keys.`
    : `${purchaseLabel(item) || act.label}. Open Xaman on this phone, or scan the QR from another device. We never hold guest keys.`;
  if (copy) copy.textContent = 'Opening a Xaman sign request…';
  if (hold) {
    hold.dataset.item = id;
    hold.hidden = true;
  }
  till.hidden = background;
  till.dataset.loading = 'true';
  paintCollectionQueue();
  if (!background) till.querySelector('[data-xrp-close]')?.focus();
  const operationKey = account + ':' + id;
  if (ownerMint && !recovery && !ownerMintOperations.has(operationKey)) ownerMintOperations.set(operationKey, crypto.randomUUID());
  const requestUrl = recovery ? (act.reward ? `${NFT_HOST}/api/penny-fever/verified/${ownerMint ? 'owner-mint' : 'redeem'}/status` : `${NFT_HOST}/api/penny-fever/xaman-checkout/status/${encodeURIComponent(recovery.payload)}`)
    : ownerMint ? `${NFT_HOST}/api/penny-fever/verified/owner-mint` : receiveOnly || batchReward ? `${NFT_HOST}/api/penny-fever/verified/redeem` : checkoutUrl(id);
  fetch(requestUrl, act.reward ? {
    method: 'POST', cache: 'no-store', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(recovery ? {email: account, payload: recovery.payload} : ownerMint ? {email: account, item: id, operation: ownerMintOperations.get(operationKey)} : {email: account, item: id, purchase: !!act.purchase,
      ...(receiveOnly ? {receive: true} : {}),
      ...(!receiveOnly && collectionQueue?.active && collectionQueue.current === id && !act.purchase
        ? (collectionQueue.run ? {collection_run: collectionQueue.run} : {collection_start: true}) : {})}),
  } : {cache: 'no-store'})
    .then(async res => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(Error(data?.message || data?.error || 'Checkout unavailable'), {code: data?.error});
      return data;
    })
    .then((data) => {
      if (revision !== tillRevision || account !== vipAccount() || (till.hidden && !collectionOwnsTill(id, account)) || !copy) return;
      delete till.dataset.loading;
      if (recovery && ['open', 'payload'].includes(data.status) && data.mint?.status === 'waiting_sign') {
        data.deep_link ||= recovery.deep_link;
        data.qr ||= recovery.qr;
      }
      if (data?.payload) {
        pendingCheckouts.set(id, {uuid: data.payload, reward: !!act.reward, ownerMint});
      }
      const state = applyTillState(till, data, {
        img, name, account, id, revision, reward: !!act.reward,
      });
      if (data?.payload && state?.phase !== 'accepted' && state?.phase !== 'cancelled' && state?.phase !== 'expired' && state?.phase !== 'prepared') {
        watchXamanPayload(till, data.payload, revision, account, !!act.reward, id, ownerMint);
      }
    })
    .catch(error => {
      if (revision === tillRevision && account === vipAccount() && copy && (!till.hidden || collectionOwnsTill(id, account))) {
        if (retryBusyCollectionRead(till, id, account, error)) return;
        if (error?.code === 'collection_batch_full' && collectionQueue?.ready.length) {
          collectionQueue.phase = 'receive';
          collectionQueue.active = false;
          collectionQueue.current = '';
          closeXrpTill({pauseQueue: false});
          paint();
          return;
        }
        till.hidden = false;
        if (['collection_run_expired', 'collection_run_invalid'].includes(error?.code) && collectionQueue) collectionQueue.run = null;
        pauseCollectionQueue();
        const raw = error?.message || 'connection unavailable';
        copy.textContent = /already has its free/.test(raw)
          ? raw
          : `Checkout did not open: ${raw}. No NFT purchase was completed here.`;
      }
    }).finally(() => {
      if (revision === tillRevision) {
        delete till.dataset.loading;
        paintCollectionQueue();
      }
    });
}
function queueXrpPlace(id) {
  const item = modelItem(id);
  const name = item?.name || id;
  const note = overlay?.querySelector('#auraTradeshowNote');
  if (note) {
    note.textContent = `We’ll tell you when ${name} can be bought · ${formatXrp(id) || 'XRP'}. Nothing is reserved yet.`;
  }
  closeXrpTill();
}
function goPlayAtStall(place) {
  closeTradeshow({stayInAlley: true});
  const world = window.PennyFeverWorld;
  if (world?.paused) world.resume();
  if (place === 'aura') {
    if ((location.hash || '').replace(/^#/, '') === HASH) location.hash = 'alley';
    world?.walkTo?.('aura');
    return;
  }
  const slug = place || 'fortune';
  rememberTradeshowReturn(slug);
  const PF = window.PennyFever;
  if (typeof PF?.enterTent === 'function') PF.enterTent(slug);
  else if (typeof world?.enterStall === 'function') world.enterStall(slug);
  else location.hash = 'cabinet/' + slug;
}

function isFelix(item) {
  return item.collection === 'penny-fever-vendors';
}
function isEveryday(item) {
  return !!item && EVERYDAY_IDS.includes(item.id);
}
function nftSampleNote(item) {
  if (!item?.id || isEveryday(item) || MONEY.has(item.kind)) return '';
  return 'Offline sample · the original is the NFT token.';
}
function playBinders(books) {
  return (books || []).filter((b) => b.id !== 'penny-collector-book' && !LIMITED.has(b.id) && b.id !== SNAP_BOOK);
}
function isLimited(item) {
  return item.collection === 'aura-limited' || LIMITED.has(item.id);
}
function modelItem(id) {
  return (window.PennyFeverInventoryModel?.definitions || []).find((it) => it.id === id) || {};
}
function folderIsLimited() {
  if (folder === 'limited') return true;
  if (folder.startsWith('book:') && LIMITED.has(folder.slice(5))) return true;
  if (folder.startsWith('item:') && isLimited(modelItem(folder.slice(5)))) return true;
  return false;
}
function folderIsFelix() {
  if (folder === 'felix' || folder === 'book:' + SNAP_BOOK) return true;
  if (folder.startsWith('item:') && (folder.slice(5) === SNAP_BOOK || isFelix(modelItem(folder.slice(5))))) return true;
  return false;
}
function bookTitle(id) {
  return (window.PennyFeverInventoryModel?.books || []).find((b) => b.id === id)?.title || 'folder';
}
function folderUp() {
  if (folder === 'book:' + SNAP_BOOK) return {id: 'felix', label: 'Felix'};
  if (folder.startsWith('book:') && LIMITED.has(folder.slice(5))) {
    return {id: 'limited', label: 'Limited'};
  }
  if (folder.startsWith('stall:')) {
    const kind = stallFolderKind(folder);
    return {id: kind || 'open', label: kind === 'closed' ? 'Closed' : 'Open'};
  }
  if (folder.startsWith('item:')) {
    const item = modelItem(folder.slice(5));
    if (isLimited(item)) {
      const bid = LIMITED.has(item.id) ? item.id : item.book;
      if (bid && LIMITED.has(bid)) return {id: 'book:' + bid, label: bookTitle(bid)};
      return {id: 'limited', label: 'Limited'};
    }
    if (isEveryday(item)) return {id: 'everyday', label: 'Everyday items'};
    if (isFelix(item) || item.id === SNAP_BOOK) return {id: 'felix', label: 'Felix'};
    if (item.book && item.book !== 'penny-collector-book') return {id: 'book:' + item.book, label: bookTitle(item.book)};
    return {id: 'book:penny-collector-book', label: 'Collector book'};
  }
  if (folder === 'everyday' || (folder.startsWith('book:') && folder !== 'book:penny-collector-book' && !LIMITED.has(folder.slice(5)))) {
    return {id: 'book:penny-collector-book', label: 'Collector book'};
  }
  return null;
}
function limitedBookSections(books, itemsByBook, limitedItems) {
  let list = books.filter((b) => LIMITED.has(b.id));
  if (folder.startsWith('book:') && LIMITED.has(folder.slice(5))) {
    list = list.filter((b) => b.id === folder.slice(5));
  } else if (folder.startsWith('item:')) {
    const it = modelItem(folder.slice(5));
    const bid = LIMITED.has(it.id) ? it.id : it.book;
    if (bid) list = list.filter((b) => b.id === bid);
  }
  return list.map((b) => {
    const grouped = itemsByBook.get(b.id) || [];
    const cover = limitedItems.find((it) => it.id === b.id) || grouped.find((it) => it.id === b.id);
    const pieces = grouped.filter((it) => it.id !== b.id);
    const foldId = 'book:' + b.id;
    const folded = !openNodes.has(foldId);
    return {
      title: b.title,
      line: b.kicker || 'Aura Limited · optional binder',
      items: [cover, ...(folded ? [] : pieces)].filter(Boolean),
      stall: stallById('ticket-booth'),
      fold: foldId,
      folded,
      inside: pieces.length,
    };
  });
}
function albumTitle(model, id) {
  return (model?.albums || []).find((a) => a.id === id)?.title || id;
}
function itemMatches(item, stall, info) {
  if (query && !`${item.name} ${stall.host} ${stall.title} ${item.album || ''} ${item.book || ''} ${item.collection || ''}`.toLowerCase().includes(query)) return false;
  if (folder === 'minted') return nftOwnedCount(item.id) > 0;
  if (folder === 'mine') return !isEveryday(item) && (walletCount(item.id) > 0 || nftOwnedCount(item.id) > 0 || rewardMint.pending?.includes(item.id));
  if (!isEveryday(item) && haveFilter === 'collected' && walletCount(item.id) <= 0) return false;
  if (!isEveryday(item) && haveFilter === 'locked' && walletCount(item.id) > 0) return false;
  if (folder === 'all') return true;
  if (folder === 'open') {
    return isOpenPlayStall(stall) && (stall.prizes || []).includes(item.id) && !MONEY.has(item.kind) && !isLimited(item) && !isFelix(item);
  }
  if (folder === 'closed') {
    return isClosedPlayStall(stall) && (stall.prizes || []).includes(item.id) && !MONEY.has(item.kind) && !isLimited(item) && !isFelix(item);
  }
  if (folder === 'felix') return isFelix(item) || item.id === SNAP_BOOK;
  if (folder === 'limited') return isLimited(item);
  if (folder === 'convert') return !!tokenClaim(item.id);
  if (folder === 'everyday') return isEveryday(item);
  if (folder === 'book:penny-collector-book') {
    if (item.id === 'penny-collector-book') return true;
    if (isEveryday(item)) return true;
    return playBinders(window.PennyFeverInventoryModel?.books || []).some((b) => b.id === item.id);
  }
  if (folder.startsWith('stall:')) return stall.id === folder.slice(6) && !isLimited(item);
  if (folder.startsWith('book:')) return item.book === folder.slice(5) || item.id === folder.slice(5);
  if (folder.startsWith('item:')) return item.id === folder.slice(5);
  return true;
}
function treeRow(id, label, {leaf = false, root = false, book = null} = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'aura-tradeshow-tree-row';
  if (leaf) {
    const spacer = document.createElement('span');
    spacer.className = 'aura-tradeshow-tree-spacer';
    wrap.append(spacer);
  } else {
    const tog = document.createElement('button');
    tog.type = 'button';
    tog.className = 'aura-tradeshow-tree-toggle';
    tog.dataset.toggle = id;
    const opened = openNodes.has(id);
    tog.setAttribute('aria-expanded', String(opened));
    tog.setAttribute('aria-label', opened ? 'Minimise' : 'Expand');
    tog.textContent = opened ? '−' : '+';
    wrap.append(tog);
  }
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'aura-tradeshow-tree-btn' + (root ? ' is-root' : '') + (leaf ? ' is-leaf' : '') + (folder === id ? ' is-on' : '');
  btn.dataset.folder = id;
  if (book?.cover) {
    btn.classList.add('is-book');
    const cover = document.createElement('img');
    cover.src = book.cover; cover.alt = ''; cover.loading = 'lazy';
    const title = document.createElement('span');
    title.textContent = label;
    btn.append(cover, title);
    btn.title = 'View ' + label + ' and its collection';
  } else btn.textContent = label;
  wrap.append(btn);
  return wrap;
}
function treeKids() {
  const d = document.createElement('div');
  d.className = 'aura-tradeshow-tree-kids';
  return d;
}
function paintTree(nav, stallRows, books, itemsByBook, felixItems, limitedItems) {
  nav.replaceChildren();
  const sections = document.createElement('div');
  sections.className = 'aura-tradeshow-section-links';
  sections.setAttribute('aria-label', 'Choose what to see');
  for (const [id, title] of [['book:penny-collector-book', 'Browse collections'], ['mine', 'My collection']]) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.folder = id; button.textContent = title;
    button.setAttribute('aria-pressed', String(folder === id)); sections.append(button);
  }
  nav.append(sections);
  const root = document.createElement('div');
  root.className = 'aura-tradeshow-tree-root';
  root.append(treeRow('book:penny-collector-book', 'Penny collector book', {root: true, book: books.find(b => b.id === 'penny-collector-book')}));
  if (openNodes.has('book:penny-collector-book')) {
    const bookWrap = treeKids();
    bookWrap.append(treeRow('item:penny-collector-book', 'View collector book', {leaf: true}));
    for (const book of playBinders(books)) {
      const bid = 'book:' + book.id;
      bookWrap.append(treeRow(bid, book.title, {book}));
      if (openNodes.has(bid)) {
        const itemWrap = treeKids();
        itemWrap.append(treeRow('item:' + book.id, 'View book', {leaf: true}));
        for (const item of (itemsByBook.get(book.id) || []).filter((it) => it.id !== book.id && !isEveryday(it))) {
          itemWrap.append(treeRow('item:' + item.id, item.name, {leaf: true}));
        }
        bookWrap.append(itemWrap);
      }
    }
    bookWrap.append(treeRow('everyday', 'Everyday items'));
    if (openNodes.has('everyday')) {
      const itemWrap = treeKids();
      for (const item of EVERYDAY_IDS.map(modelItem).filter(item => item.id)) {
        itemWrap.append(treeRow('item:' + item.id, item.name, {leaf: true}));
      }
      bookWrap.append(itemWrap);
    }
    bookWrap.append(treeRow('open', 'Open stalls'));
    if (openNodes.has('open')) {
      const stallWrap = treeKids();
      for (const stall of openPlayStalls()) {
        stallWrap.append(treeRow('stall:' + stall.id, stall.host, {leaf: true}));
      }
      bookWrap.append(stallWrap);
    }
    bookWrap.append(treeRow('closed', 'Closed stalls'));
    if (openNodes.has('closed')) {
      const stallWrap = treeKids();
      for (const stall of closedPlayStalls()) {
        stallWrap.append(treeRow('stall:' + stall.id, stall.host, {leaf: true}));
      }
      bookWrap.append(stallWrap);
    }
    root.append(bookWrap);
  }
  root.append(treeRow('limited', 'Aura Limited', {root: true}));
  if (openNodes.has('limited')) {
    const limWrap = treeKids();
    for (const item of limitedItems) {
      const bid = 'book:' + item.id;
      limWrap.append(treeRow(bid, item.name, {book: books.find(b => b.id === item.id)}));
      if (openNodes.has(bid)) {
        const itemWrap = treeKids();
        itemWrap.append(treeRow('item:' + item.id, 'View book', {leaf: true}));
        for (const piece of (itemsByBook.get(item.id) || []).filter((it) => it.id !== item.id)) {
          itemWrap.append(treeRow('item:' + piece.id, piece.name, {leaf: true}));
        }
        limWrap.append(itemWrap);
      }
    }
    root.append(limWrap);
  }
  root.append(treeRow('felix', 'Felix’s Photo Booth'));
  if (openNodes.has('felix')) {
    const felixWrap = treeKids();
    felixWrap.append(treeRow('item:' + SNAP_BOOK, 'Felix’s portrait book', {leaf: true, book: books.find(b => b.id === SNAP_BOOK)}));
    for (const item of felixItems) {
      felixWrap.append(treeRow('item:' + item.id, item.name, {leaf: true}));
    }
    root.append(felixWrap);
  }
  root.append(treeRow('convert', 'Aura’s token counter', {leaf: true}));
  root.append(treeRow('minted', 'Minted', {leaf: true}));
  nav.append(root);
}
async function showOwnedEditions(button) {
  const id = button.dataset.ownedEditions;
  const account = vipAccount();
  const list = button.parentElement?.querySelector('.aura-owned-edition-list');
  if (!list || !id || !vip()) return;
  if (button.getAttribute('aria-expanded') === 'true') {
    list.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.textContent = button.textContent.replace('· hide editions', '· view editions');
    return;
  }
  button.setAttribute('aria-expanded', 'true');
  button.disabled = true;
  list.hidden = false;
  list.textContent = 'Checking edition numbers in your wallet…';
  try {
    const response = await fetch(`${NFT_HOST}/api/penny-fever/verified/redeem/owned-editions`, {
      method: 'POST', cache: 'no-store', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: account, item: id}),
    });
    const data = await response.json();
    if (!response.ok || data?.ok !== true) throw Error(data?.message || 'Could not check your wallet editions. Try again shortly.');
    if (account !== vipAccount() || !button.isConnected || button.dataset.ownedEditions !== id) return;
    if (!Number.isSafeInteger(data.owned_count) || data.owned_count < 0 || !Array.isArray(data.editions)) throw Error('Edition details are unavailable.');
    button.textContent = `You own ${data.owned_count.toLocaleString('en-AU')} · hide editions`;
    list.replaceChildren();
    if (!data.owned_count) { list.textContent = 'No copies currently found in this wallet.'; return; }
    const entries = document.createElement('ul');
    for (const edition of data.editions) {
      const li = document.createElement('li');
      li.textContent = edition.serial === null ? 'Original issue · unnumbered'
        : `Edition #${Number(edition.serial).toLocaleString('en-AU')}`;
      entries.append(li);
    }
    list.append(entries);
    if (data.truncated) {
      const note = document.createElement('p');
      note.textContent = `Showing the first ${data.editions.length} of ${data.owned_count.toLocaleString('en-AU')} copies.`;
      list.append(note);
    }
  } catch (error) {
    if (account === vipAccount() && button.isConnected && button.dataset.ownedEditions === id) list.textContent = error?.message || 'Edition details could not load.';
  } finally {
    if (account === vipAccount() && button.isConnected && button.dataset.ownedEditions === id) button.disabled = false;
  }
}

function appendCards(grid, items) {
  for (const item of items) {
    // Books mix vendors. Resolve each card from its own chapter/portrait ID,
    // just as filters and checkout do, rather than inheriting the book's host.
    const stall = stallForPrize(item);
    const info = stallDoor(stall);
    const card = document.createElement('article');
    card.className = 'aura-tradeshow-card' + (isEveryday(item) || walletCount(item.id) > 0 ? '' : ' is-locked');
    card.dataset.asset = item.asset;
    card.dataset.item = item.id;
    card.dataset.name = item.name || item.id;
    card.dataset.mode = 'website';
    card.dataset.face = '0';
    VIEWS.forEach((view) => { card.dataset[view] = item.turnaround || view === 'front' ? '1' : '0'; });
    const felix = isFelix(item);
    const claim = tokenClaim(item.id);
    const limited = isLimited(item);
    const nestedBook = (window.PennyFeverInventoryModel?.books || []).some((b) => b.id === item.id);
    const showQr = nftViewAvailable(item, info);
    const chipClass = felix ? 'is-felix' : (limited ? 'is-limited' : (claim ? 'is-claim' : (MONEY.has(item.kind) || info.money ? 'is-money' : (info.mintable ? 'is-open' : 'is-coming'))));
    const chipText = TOKEN_TERMS[item.id] ? 'XRPL token' : isEveryday(item) ? 'Game purse' : felix ? 'Photo booth' : (limited ? 'Limited' : (claim ? 'Token claim' : (MONEY.has(item.kind) || info.money ? 'Dollars' : (info.mintable ? 'Open' : 'Coming'))));
    const act = actionFor(item, info);
    const play = playTap(item, info, stall);
    const canSpin = !!item.turnaround;
    const sample = nftSampleNote(item);
    const owned = nftOwnedCount(item.id);
    const basketControls = paidNftBasket?.controls(item.id);
    const shopBtn = basketControls || (felix && !act.snap && !act.claim && !act.ownerMint && !act.reward) ? '' : (act.claim
      ? `<button type="button" class="aura-tradeshow-buy${act.ready ? ' is-ready' : ''}" data-claim="${item.id}" ${act.disabled ? 'disabled' : ''}>${act.label}</button>`
      : `<button type="button" class="aura-tradeshow-buy${act.ready ? ' is-ready' : ''}" data-buy="${item.id}" ${act.disabled ? 'disabled' : ''}>${act.label}</button>`);
    card.innerHTML = `
      <div class="aura-tradeshow-stage" data-inspect="${item.id}" role="button" tabindex="0" aria-label="Inspect ${item.name || item.id}" title="Open details"><img alt="" draggable="false" loading="lazy" decoding="async" src="${faceSrc(item, 'front')}"></div>
      <span class="chip ${chipClass}">${chipText}</span>
      ${owned ? '<span class="chip is-minted">Minted</span>' : ''}
      <h3>${item.name}</h3>
      ${claim ? `<button type="button" class="aura-tradeshow-up aura-requirements-link" data-inspect="${item.id}">View token requirements</button>` : `<p class="price">${purchaseLabel(item)}</p>`}
      ${owned ? `<button type="button" class="owned aura-owned-editions" data-owned-editions="${item.id}" aria-expanded="false">You own ${owned.toLocaleString('en-AU')} · view editions</button><div class="aura-owned-edition-list" data-owned-list="${item.id}" hidden></div>` : ''}
      ${felix ? '' : `<p class="stock">${claim ? remainingFor(item.id).toLocaleString('en-AU') + ' editions remaining' : formatStock(item.id).replace(' · ' + purchaseLabel(item), '')}</p>`}
      ${nestedBook && item.id !== 'penny-collector-book' && folder !== 'book:' + item.id ? `<button type="button" class="aura-tradeshow-play" data-open-book="${item.id}">View collection</button>` : ''}
      ${shopBtn}
      <details class="aura-tradeshow-card-details"><summary>More options</summary>
      ${canSpin ? `<div class="aura-tradeshow-turn">
        ${VIEWS.map((view) => `<button type="button" data-face="${view}"${view === 'front' ? ' aria-pressed="true"' : ''}>${view[0].toUpperCase()}${view.slice(1)}</button>`).join('')}
        <button type="button" data-spin="1">Rotate</button>
      </div>` : ''}
      <div class="aura-tradeshow-views">
        <button type="button" data-view="website" aria-pressed="true">Website</button>
        ${isEveryday(item) ? '' : `<button type="button" data-view="nft" ${showQr ? '' : 'disabled'} aria-pressed="false">${showQr ? 'NFT' : 'NFT soon'}</button>`}
      </div>
      ${sample && !claim ? `<p class="sample">${sample}</p>` : ''}
      ${claim ? (act.ownerMint ? '<p class="aura-token-trade-note">Token trades are not open yet.</p>' : '') : `<p class="claim">${claimLine(item, info)}</p>`}
      ${play ? `<button type="button" class="aura-tradeshow-play" data-go-stall="${play.id}">${play.label}</button>` : ''}
      ${canBatchBuy(item.id) ? `<button type="button" class="aura-tradeshow-buy" data-nft-batch-buy="${item.id}">Buy multiple · up to 8</button>` : ''}
      ${owned && rewardMint.enabled && rewardMint.account === vipAccount() && rewardMint.ownerItems?.includes(item.id)
        ? `<button type="button" class="aura-tradeshow-buy" data-owner-mint="${item.id}">Owner mint another · to RaX</button>` : ''}</details>`;
    const pic = card.querySelector('img');
    if (pic) pic.alt = item.name || '';
    if (basketControls) card.querySelector('.aura-tradeshow-card-details').before(basketControls);
    grid.append(card);
  }
}

function paint() {
  if (!overlay || overlay.hidden) return;
  paintCollectionQueue();
  const status = tradeshowStatus();
  const door = overlay.querySelector('#auraTradeshowDoor');
  door.textContent = parkLabel(SHOW_ID);
  door.className = 'aura-tradeshow-door is-' + status;
  const vipEl = overlay.querySelector('#auraTradeshowVip');
  if (vip()) {
    const email = String(window.InstapicGuestIdentity?.read?.()?.email || '');
    vipEl.replaceChildren();
    vipEl.textContent = 'VIP · ' + (email || 'signed in');
    vipEl.title = email;
  } else {
    const a = document.createElement('a');
    a.href = vipJoin();
    a.textContent = 'Join VIP';
    a.addEventListener('click', rememberTradeshowLook);
    vipEl.replaceChildren(a, document.createTextNode(' to buy and keep.'));
  }
  const session = overlay.querySelector('#auraTradeshowSession');
  session.href = vipJoin();
  session.textContent = window.InstapicGuestIdentity?.read?.()?.session_token ? 'Log out' : 'Log in';
  session.setAttribute('aria-label', window.InstapicGuestIdentity?.read?.()?.session_token ? `Log out ${vipEmail()}` : 'Log in to VIP');
  overlay.querySelector('#auraTradeshowNote').textContent = folderIsFelix()
    ? 'Mint your collected photo rewards with Mint Rewards. Locked portraits unlock at Felix’s photo booth.'
    : folder === 'minted'
      ? 'Your received NFTs. Items still waiting for wallet acceptance appear after receipt is confirmed.'
    : folder === 'mine'
      ? 'Your collected rewards and received NFTs. Tap a piece for its details; use Mint Rewards for collected pieces.'
    : folder === 'convert'
      ? 'Aura’s token counter lists the current Star, Moon, Rose and Crown requirements. Token trading opens when the purse connection is ready. Everyday pennies remain game currency.'
    : folder === 'open' || stallFolderKind(folder) === 'open'
      ? 'Open tents · six chapter bonuses each. Felix portraits are under Felix.'
    : folder === 'closed' || stallFolderKind(folder) === 'closed'
      ? 'Closed tents · six chapter bonuses each. Look now. Play when the stall opens.'
    : folder === 'everyday'
      ? 'Pennies, tickets and 5-packs go to Aura’s entrance booth. PENNYS, PENNYM, PENNYR and PENNYC go to the ledger token shop.'
    : folder === 'book:penny-collector-book'
      ? 'The collector book, everyday items, then journals, albums and cases. Expand a book in the tree to see its pieces.'
    : folderIsLimited()
      ? limitedShelfNote()
      : 'Tap a figure to hold and spin it. Collected is in your book; Locked still waits on the shelf.';
  overlay.querySelectorAll('[data-have]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.have === haveFilter));
  });
  overlay.querySelectorAll('.aura-tradeshow-tools [data-folder]').forEach((b) => {
    const id = b.dataset.folder;
    const on = folder === id
      || (id === 'open' && stallFolderKind(folder) === 'open')
      || (id === 'closed' && stallFolderKind(folder) === 'closed')
      || (id === 'felix' && folderIsFelix())
      || (id === 'limited' && folderIsLimited())
      || (id === 'minted' && folder === 'minted')
      || (id === 'book:penny-collector-book' && (folder.startsWith('book:') || folder.startsWith('item:')) && !folderIsLimited() && !folderIsFelix() && folder !== 'convert');
    b.setAttribute('aria-pressed', String(on));
  });

  const model = window.PennyFeverInventoryModel;
  const items = model?.definitions || [];
  const books = model?.books || [];
  const stallGroups = new Map();
  const itemsByBook = new Map();
  const felixItems = [];
  const limitedItems = [];
  for (const stall of stalls) {
    if (stall.extra && stall.id !== 'ticket-booth') continue;
    stallGroups.set(stall.id, {stall, items: []});
  }
  for (const item of items) {
    if (isLimited(item)) {
      if (LIMITED.has(item.id)) limitedItems.push(item);
      const book = item.book || 'penny-collector-book';
      if (!itemsByBook.has(book)) itemsByBook.set(book, []);
      itemsByBook.get(book).push(item);
      continue;
    }
    const stall = stallForPrize(item);
    const key = stall?.id || 'ticket-booth';
    if (!stallGroups.has(key)) stallGroups.set(key, {stall: stall || {id: key, host: 'Aura', title: 'Collection'}, items: []});
    stallGroups.get(key).items.push(item);
    if (isFelix(item)) {
      felixItems.push(item);
      continue;
    }
    const book = item.book || 'penny-collector-book';
    if (!itemsByBook.has(book)) itemsByBook.set(book, []);
    itemsByBook.get(book).push(item);
  }

  const stallRows = [...stallGroups.values()].filter((row) => row.items.length);
  stallRows.sort((a, b) => {
    const ao = stallDoor(a.stall).mintable ? 0 : 1;
    const bo = stallDoor(b.stall).mintable ? 0 : 1;
    if (ao !== bo) return ao - bo;
    return String(a.stall.host).localeCompare(String(b.stall.host));
  });

  paintTree(overlay.querySelector('#auraTradeshowTree'), stallRows, books, itemsByBook, felixItems, limitedItems);

  const body = overlay.querySelector('#auraTradeshowBody');
  body.replaceChildren();
  const up = folderUp();
  if (up) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'aura-tradeshow-up';
    back.dataset.folder = up.id;
    back.textContent = '← ' + up.label;
    body.append(back);
  }
  const byStall = folder === 'open' || folder === 'closed' || folder.startsWith('stall:');
  const sections = byStall
    ? (folder === 'open' ? openPlayStalls() : folder === 'closed' ? closedPlayStalls() : stallRows.map((row) => row.stall).filter((stall) => folder === 'stall:' + stall.id)).map((stall) => {
      const info = stallDoor(stall);
      const six = folder === 'open' || folder === 'closed' || isPlayStall(stall);
      return {
        title: `${stall.host} · ${stall.title}`,
        line: six ? (info.mintable ? 'Chapter 1–6' : 'Chapter 1–6 · stall closed') : (info.money ? 'Dollar till' : (info.mintable ? 'Open' : 'Coming')),
        items: six ? chapterItems(stall) : (stallGroups.get(stall.id)?.items || []),
        stall,
      };
    })
    : (folder === 'mine'
      ? [{title: 'My collection', line: 'Collected rewards, received NFTs and pieces waiting to receive',
          items: items.filter(item => !isEveryday(item)), stall: stallById('ticket-booth')}]
      : folder === 'minted'
      ? [{
        title: 'Minted',
        line: 'NFTs received into your wallet',
        items: items.filter((item) => nftOwnedCount(item.id) > 0),
        stall: stallById('ticket-booth'),
      }]
      : folder === 'convert'
      ? [{
        title: 'Aura’s token counter',
        line: 'PENNYS · PENNYM · PENNYR · PENNYC',
        items: Object.keys(stock.token_claims || {}).map((id) => modelItem(id)).filter((item) => item.id),
        stall: stallById('ticket-booth'),
      }]
      : folder === 'everyday'
      ? [{
        title: 'Everyday items',
        line: 'Game pennies, tickets and 5-packs · ledger Stars, Moons, Roses and Crowns',
        items: items.filter(isEveryday),
        stall: stallById('ticket-booth'),
      }]
      : folder === 'book:penny-collector-book'
      ? [
        {
          title: 'Penny collector book',
          line: 'The keepsake for the whole midway · claim with tokens',
          items: [modelItem('penny-collector-book')].filter((item) => item.id),
          stall: stallById('ticket-booth'),
        },
        {
          title: 'Books, journals, cases and albums',
          line: 'Choose a book here or in the tree to view its collection',
          items: playBinders(books).map((b) => modelItem(b.id)).filter((item) => item.id),
          stall: stallById('ticket-booth'),
        },
        {
          title: 'Everyday items',
          line: 'Game pennies, tickets and 5-packs · ledger Stars, Moons, Roses and Crowns',
          items: items.filter(isEveryday),
          stall: stallById('ticket-booth'),
        },
      ]
      : folderIsFelix()
      ? [{title: 'Felix’s Instapic Photo Booth', line: 'Portrait book and photo-session collection', items: [modelItem(SNAP_BOOK), ...felixItems].filter(item => item.id), stall: stallById('snap')}]
      : folderIsLimited()
        ? limitedBookSections(books, itemsByBook, limitedItems)
      : books
        .filter((b) => !LIMITED.has(b.id))
        .map((b) => ({
          title: b.title,
          line: b.kicker || 'Book',
          items: [modelItem(b.id), ...(itemsByBook.get(b.id) || []).filter(item => item.id !== b.id)].filter(item => item.id),
          stall: stallForPrize((itemsByBook.get(b.id) || [])[0]) || stallById('ticket-booth'),
        })).concat(folder === 'all' ? [
          ...limitedBookSections(books, itemsByBook, limitedItems),
          {title: 'Felix’s Instapic Photo Booth', line: 'Unlock with a photo session', items: felixItems, stall: stallById('snap')},
        ] : []));
  for (const section of sections) {
    const shown = section.items.filter((item) => itemMatches(item, stallForPrize(item) || section.stall, stallDoor(stallForPrize(item) || section.stall)));
    if (!shown.length && !section.fold) continue;
    const wrap = document.createElement('section');
    wrap.className = 'aura-tradeshow-stall' + (section.folded ? ' is-folded' : '');
    const count = section.fold
      ? (section.folded ? `${section.inside} inside` : `${shown.length} piece${shown.length === 1 ? '' : 's'}`)
      : `${shown.length} piece${shown.length === 1 ? '' : 's'}`;
    wrap.innerHTML = section.fold
      ? `<h2><button type="button" class="aura-tradeshow-fold" data-toggle="${section.fold}" aria-expanded="${section.folded ? 'false' : 'true'}">${section.folded ? '+' : '−'}</button> ${section.title}</h2><p>${section.line} · ${count}</p>`
      : `<h2>${section.title}</h2><p>${section.line} · ${count}</p>`;
    if (shown.length) {
      const grid = document.createElement('div');
      grid.className = 'aura-tradeshow-grid';
      appendCards(grid, shown);
      wrap.append(grid);
    }
    body.append(wrap);
  }
  if (!body.querySelector('.aura-tradeshow-card')) {
    const empty = document.createElement('p');
    empty.textContent = query || haveFilter ? 'No items match these filters in this collection.'
      : folder === 'mine' ? 'Your collection will appear here as you collect rewards or receive NFTs.'
      : folder === 'minted' ? 'No received NFTs to show yet. Return here after receiving them in Xaman.'
      : 'No items to show in this collection yet.';
    body.append(empty);
    if (query || haveFilter) {
      const clear = document.createElement('button');
      clear.type = 'button'; clear.className = 'aura-tradeshow-up';
      clear.dataset.clearTradeshowFilters = ''; clear.textContent = 'Clear filters';
      body.append(clear);
    }
  }
}

function limitedShelfNote() {
  const g = stock.groups || {};
  const xrp = (key) => String(g[key]?.xrp || '').trim();
  const books = xrp('le-books') || '5';
  const charms = xrp('le-charms') || '2';
  const rest = xrp('le-alley') || xrp('le-carnival') || '0.55555';
  return `Aura Limited · optional ${books} XRP books. Charms ${charms} XRP · alley and carnival ${rest} XRP. One per wallet. You can collect the set without the book.`;
}
function focusables(root) {
  if (!root) return [];
  return [...root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((el) => el.offsetParent !== null && !el.closest('[hidden]'));
}
function tillOpen() {
  const till = overlay?.querySelector('#auraXrpTill');
  return !!(till && !till.hidden);
}
function inspectOpen() {
  const panel = overlay?.querySelector('#auraTradeshowInspect');
  return !!(panel && !panel.hidden);
}
function onOverlayKey(e) {
  if (!overlay || overlay.hidden) return;
  if (nftBatchUI?.isOpen() || paidNftBasket?.isOpen()) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    if (inspectOpen()) closeInspect();
    else if (tillOpen()) closeXrpTill();
    else closeTradeshow();
    return;
  }
  if (e.key !== 'Tab') return;
  const root = inspectOpen()
    ? overlay.querySelector('.aura-tradeshow-inspect-card')
    : (tillOpen() ? overlay.querySelector('.aura-xrp-till-card') : overlay);
  const list = focusables(root);
  if (!list.length) return;
  const first = list[0];
  const last = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  } else if (!root.contains(document.activeElement)) {
    e.preventDefault();
    first.focus();
  }
}

export function openTradeshow({tokenCounter = false, item = ''} = {}) {
  if (tradeshowBlocked()) return false;
  if (!vip()) {
    if ((location.hash || '').replace(/^#/, '') === HASH) location.hash = 'alley';
    return false;
  }
  if (tokenCounter) { folder = 'convert'; query = ''; haveFilter = ''; }
  rememberTradeshowLook();
  const account = vipAccount();
  if (tradeshowAccount && tradeshowAccount !== account) closeTradeshow({stayInAlley: true});
  ensureOverlay();
  const world = window.PennyFeverWorld;
  resumeWorld = !!(world?.started && !world.paused && document.body.classList.contains('is-in-world'));
  if (resumeWorld) world.pause();
  lastFocus = document.activeElement;
  document.body.classList.add('aura-tradeshow-open');
  overlay.hidden = false;
  tradeshowAccount = account;
  if (!vipCheckTimer) vipCheckTimer = setInterval(checkVipSession, 1000);
  Promise.all([loadStock(), loadMinted(), loadPlates(), loadSnap()]).then(() => {
    checkVipSession();
    deliverClaimReceipts();
    paint();
    // Treasures "Send to mint" opens straight onto that keepsake's shelf card.
    if (item && onShelf(item) && !overlay.hidden) openInspect(item);
  });
  paint();
  overlay.querySelector('#auraTradeshowClose').focus();
  return true;
}

export function closeTradeshow(opts = {}) {
  if (!overlay || overlay.hidden) return;
  paidNftBasket?.close();
  nftBatchUI?.close();
  pauseCollectionQueue();
  closeInspect();
  stopTillPoll();
  if (vipCheckTimer) clearInterval(vipCheckTimer);
  vipCheckTimer = 0;
  tradeshowAccount = '';
  const inspect = overlay.querySelector('#auraTradeshowInspect');
  if (inspect) inspect.hidden = true;
  inspectItem = null;
  const till = overlay.querySelector('#auraXrpTill');
  if (till) till.hidden = true;
  overlay.hidden = true;
  document.body.classList.remove('aura-tradeshow-open');
  if (resumeWorld && document.body.classList.contains('is-in-world')) {
    window.PennyFeverWorld?.resume();
  }
  resumeWorld = false;
  if (lastFocus && typeof lastFocus.focus === 'function') {
    try { lastFocus.focus(); } catch {}
  }
  lastFocus = null;
  if (!opts.stayInAlley && (location.hash || '').replace(/^#/, '') === HASH) location.hash = 'booth';
}

export function tradeshowSign() {
  return parkSign(SHOW_ID, 'Aura');
}

loadStock();
loadMinted();
loadPlates();
window.addEventListener('storage', (event) => {
  if (event.key === null || event.key === 'instapic_guest_identity') checkVipSession();
});
window.addEventListener('pennyfever:tokenclaim', event => {
  const receipt = event.detail?.receipt;
  const account = vipAccount();
  if (!account || receipt?.email !== account || !tokenClaim(receipt.item) || typeof receipt.id !== 'string') return;
  rememberClaimReceipt(account, receipt.item);
  const revision = eligibilityRevision;
  loadRewardMint(account, revision).then(() => {
    if (revision !== eligibilityRevision || account !== vipAccount()) return;
    deliverClaimReceipts(); paint();
  });
});
window.addEventListener('pennyfever:tokenbankready', () => {
  if (overlay && !overlay.hidden) paint();
});
window.AuraTradeshow = {open: openTradeshow, close: closeTradeshow, status: tradeshowStatus, onShelf: id => onShelf(String(id || '')), collectionStatus: id => collectionStatus(String(id || '')), refreshMintStatus};

try {
  const q = new URLSearchParams(location.search);
  const fromHash = () => (location.hash || '').replace(/^#/, '') === HASH;
  const buyId = String(q.get('buy') || '').trim();
  if (q.get('tradeshow') === '1' || fromHash() || buyId) {
    const boot = () => {
      if (tradeshowBlocked()) return;
      if (!openTradeshow()) return;
      if (buyId) Promise.all([loadStock(), loadMinted(), loadSnap()]).then(() => openXrpTill(buyId));
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 600));
    else setTimeout(boot, 600);
  }
} catch {}
