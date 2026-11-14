import {parkLabel, parkSign, parkStatus} from '../paper-games/park-doors.js?v=map-doors-3';
import {stallById, stalls} from './items/midway.js?v=nft-board-1';
import {qrDataUrl} from './qrcode-generator.js?v=nft-host-11';
import {rememberTradeshowReturn} from './tradeshow-navigation.js?v=aura-return-1';

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
  'star-token': ['star token', 'star tokens'],
  'moon-penny': ['moon penny', 'moon pennies'],
  'rose-penny': ['rose penny', 'rose pennies'],
  'crown-token': ['crown token', 'crown tokens'],
};
const LIMITED = new Set([
  'aura-treasures-collector-book',
  'alley-backgrounds-collector-book',
  'aura-and-carnival-collector-book',
]);

let stock = {groups: {}, sku: {}, ceilings: {}, hold_floor: 111, hold_pct: 0, aura_xrp_address: '', token_claims: {}};
let minted = {};
let mintedReady = false;
let rewardMint = {account: '', enabled: false, items: {}, prices: {}};
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
let tradeshowAccount = '';
let vipCheckTimer = 0;
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
let dripPurse = { 'star-token': 0, 'moon-penny': 0, 'rose-penny': 0, 'crown-token': 0 };
let dripReady = false;
let eligibilityAccount = '';
let eligibilityRevision = 0;
const claimReceipts = new Map();
const tokenClaimsInFlight = new Set();
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
function clearEligibility(account = '') {
  eligibilityAccount = account;
  rewardMint = {account, enabled: false, items: {}, prices: {}};
  snapElig = {portraits: new Set(), book: false};
  dripPurse = { 'star-token': 0, 'moon-penny': 0, 'rose-penny': 0, 'crown-token': 0 };
  dripReady = false;
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
  return Promise.all([
    postSnap('recheck', {email}).then((data) => {
      if (revision === eligibilityRevision && account === vipAccount()) setSnapElig(data);
    }),
    loadDrips(email, revision),
    loadRewardMint(account, revision),
  ]).then(deliverClaimReceipts);
}
function loadRewardMint(account, revision) {
  return fetch(`${NFT_HOST}/api/penny-fever/verified/redeem/eligibility`, {
    method: 'POST', cache: 'no-store', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: account}),
  }).then(res => res.ok ? res.json() : null).then(data => {
    if (revision !== eligibilityRevision || account !== vipAccount() || data?.ok !== true) return;
    rewardMint = {account, enabled: data.enabled === true, items: data.items || {}, prices: data.prices || {}};
  }).catch(() => {});
}
function loadDrips(email, revision) {
  if (!email) return Promise.resolve();
  return fetch(`${NFT_HOST}/api/penny-fever/drips?email=${encodeURIComponent(email)}`, {cache: 'no-store'})
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (revision !== eligibilityRevision || email.toLowerCase() !== vipAccount()) return;
      if (data?.email && String(data.email).toLowerCase() !== email.toLowerCase()) return;
      const purse = data?.purse;
      if (!purse || typeof purse !== 'object') return;
      dripReady = true;
      DRIPS.forEach((id) => {
        const n = Math.floor(Number(purse[id]) || 0);
        dripPurse[id] = n > 0 ? n : 0;
      });
      // The server retains paid ownership receipts even if a reply was lost
      // or the guest moved to another device. Recovery never spends again.
      for (const receipt of Array.isArray(data.claims) ? data.claims : []) {
        if (receipt && typeof receipt.id === 'string'
            && ['penny-collector-book', SNAP_BOOK].includes(receipt.item)
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
  if (tokenClaim(item.id)) {
    const cost = formatTokenCost(tokenClaim(item.id).cost);
    return cost ? `Convert · ${cost}` : 'Convert with tokens';
  }
  if (isFelix(item)) return 'Not for sale here';
  if (MONEY.has(item.kind)) return 'Dollar till';
  const redemption = rewardMint.account === vipAccount() && rewardMint.enabled && rewardMint.items[item.id];
  const purchasePrice = rewardMint.prices?.[item.id];
  if (redemption && !purchasePrice) return 'Collected · network fee only';
  return formatXrp(item.id) || 'Price pending';
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
function tokenHave(id) {
  if (id === 'everyday-penny') return Math.max(0, Math.floor(Number(window.PennyFever?.pennies?.()) || 0));
  return walletCount(id);
}
function formatTokenCost(cost) {
  return Object.entries(cost || {}).map(([id, n]) => {
    const need = Math.max(0, Math.floor(Number(n) || 0));
    const names = TOKEN_NAMES[id];
    const name = Array.isArray(names) ? names[need === 1 ? 0 : 1] : (names || id);
    return `${need} ${name}`;
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
function tokenHaveForTank(id) {
  if (DRIPS.has(id)) return dripPurse[id] || 0;
  return tokenHave(id);
}
function tankMarkup(item) {
  const claim = tokenClaim(item.id);
  if (!claim?.cost) return '';
  const bits = Object.entries(claim.cost).map(([id, n]) => {
    const need = Math.max(0, Math.floor(Number(n) || 0));
    const have = tokenHaveForTank(id);
    return `<span class="aura-tradeshow-tank${have >= need ? ' is-ready' : ''}"><b>${have}</b>/${need} ${tankLabel(id)}</span>`;
  });
  return `<p class="aura-tradeshow-tanks">${bits.join('')}</p>`;
}
function tokenAfford(cost) {
  return Object.entries(cost || {}).every(([id, n]) => {
    const need = Math.max(0, Math.floor(Number(n) || 0));
    if (DRIPS.has(id)) return eligibilityAccount === vipAccount() && !!eligibilityAccount && (dripPurse[id] || 0) >= need;
    return tokenHave(id) >= need;
  });
}
function spendTokenCost(cost) {
  const PF = window.PennyFever;
  const state = PF?.getState?.();
  if (!state) return false;
  const rows = Object.entries(cost || {}).map(([id, n]) => [id, Math.max(0, Math.floor(Number(n) || 0))]).filter(([, n]) => n > 0);
  for (const [id, need] of rows) {
    if (tokenHave(id) < need) return false;
  }
  if (!state.paperInventory || typeof state.paperInventory !== 'object') state.paperInventory = {version: 1, items: {}};
  if (!state.paperInventory.items || typeof state.paperInventory.items !== 'object') state.paperInventory.items = {};
  const items = state.paperInventory.items;
  let penniesNeed = 0;
  for (const [id, need] of rows) {
    if (id === 'everyday-penny') penniesNeed += need;
  }
  if (penniesNeed && !PF.spendPennies?.(penniesNeed, {allowPass: false})) return false;
  for (const [id, need] of rows) {
    if (id === 'everyday-penny') continue;
    const row = items[id];
    const have = Number.isFinite(Number(row?.qty)) ? Math.max(0, Number(row.qty)) : (row ? 1 : 0);
    const left = have - need;
    if (left <= 0) delete items[id];
    else row.qty = left;
  }
  PF.saveState?.();
  return true;
}
function dripCost(cost) {
  const keys = Object.keys(cost || {});
  return keys.length > 0 && keys.every((id) => DRIPS.has(id));
}
function claimWithTokens(id) {
  const spec = tokenClaim(id);
  const note = overlay?.querySelector('#auraTradeshowNote');
  const say = (text) => { if (note) note.textContent = text; };
  if (!spec) return;
  if (!vip()) {
    say('Join VIP to unlock this book with tokens.');
    return;
  }
  const action = shopAction(id);
  if (action.disabled) {
    say(action.label);
    return;
  }
  if (walletAtCap(id)) {
    say('Already in your wallet.');
    return;
  }
  if (remainingFor(id) <= 0) {
    say('Aura’s pile is gone · trade later.');
    return;
  }
  if (dripCost(spec.cost)) {
    const account = vipAccount();
    const receiptKey = claimReceiptKey(account, id);
    if (tokenClaimsInFlight.has(receiptKey)) {
      say('Claim in progress.');
      return;
    }
    if (!tokenAfford(spec.cost)) {
      say(`Need ${formatTokenCost(spec.cost)} banked from VIP play.`);
      return;
    }
    const email = vipEmail();
    const revision = eligibilityRevision;
    tokenClaimsInFlight.add(receiptKey);
    fetch(`${NFT_HOST}/api/penny-fever/drips/claim`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, item: id}),
    }).then((res) => res.json().then((data) => ({ok: res.ok, data})))
      .then(({ok, data}) => {
        if (ok && data?.ok && (String(data.email || email).toLowerCase() !== account || (data.item && data.item !== id))) {
          if (account === vipAccount()) say('The claim reply did not match this account and item. Nothing was added here.');
          return;
        }
        if (ok && data?.ok && String(data.email || email).toLowerCase() === account) {
          // Keep an already committed receipt for its owner even if they leave.
          rememberClaimReceipt(account, id);
        }
        if (account !== vipAccount()) return;
        if (!ok || !data?.ok) {
          say(data?.error === 'need_tokens'
            ? `Need ${formatTokenCost(spec.cost)} banked from VIP play.`
            : 'Claim did not land. Play as VIP to bank tokens.');
          if (revision === eligibilityRevision && data?.purse) {
            DRIPS.forEach((key) => { dripPurse[key] = Math.max(0, Math.floor(Number(data.purse[key]) || 0)); });
          }
          return;
        }
        if (revision === eligibilityRevision && data.purse) {
          DRIPS.forEach((key) => { dripPurse[key] = Math.max(0, Math.floor(Number(data.purse[key]) || 0)); });
        }
        if (revision === eligibilityRevision) setSnapElig(data);
        const delivered = deliverClaimReceipts();
        const name = (window.PennyFeverInventoryModel?.definitions || []).find((it) => it.id === id)?.name || id;
        say(delivered.has(id)
          ? (data.charged === false ? `${name} is already claimed · added to Treasures.`
            : `Claimed ${name} · ${formatTokenCost(spec.cost)}.`)
          : 'Your claim is recorded. Reopen the tradeshow to add it to Treasures.');
      })
      .catch(() => { if (account === vipAccount()) say('Claim did not land.'); })
      .finally(() => {
        tokenClaimsInFlight.delete(receiptKey);
        if (account === vipAccount()) {
          const message = note?.textContent;
          paint();
          if (message) say(message);
        }
      });
    paint();
    return;
  }
  if (!tokenAfford(spec.cost)) {
    say(`Need ${formatTokenCost(spec.cost)}.`);
    return;
  }
  const PF = window.PennyFever;
  if (!PF?.stampKeepsake?.(id, 'token-claim')) {
    say(walletAtCap(id) ? 'Already in your wallet.' : 'Claim did not land.');
    paint();
    return;
  }
  if (!spendTokenCost(spec.cost)) {
    say('Keepsake stamped · tokens did not spend. Tell Aura.');
    paint();
    return;
  }
  const name = (window.PennyFeverInventoryModel?.definitions || []).find((it) => it.id === id)?.name || id;
  say(`Claimed ${name} · ${formatTokenCost(spec.cost)}.`);
  paint();
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
  return fetch(`${NFT_HOST}/api/penny-fever/nft-plates?v=${NFT_VER}`, {cache: 'no-store'})
    .then((res) => (res.ok ? res.json() : []))
    .then((list) => {
      nftPlates = new Set(Array.isArray(list) ? list : []);
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
  const addr = String(stock?.aura_xrp_address || stock?.xrpl?.issuer || 'rPSUyQBP4CZa6fYmn2jkPggiYpueW8p5hL').trim();
  return addr.startsWith('r') ? addr : 'rPSUyQBP4CZa6fYmn2jkPggiYpueW8p5hL';
}
function guestOwns(id) {
  // Paper stamps are website copies. Show the mint plate only after a ledger accept.
  return rewardMint.account === vipAccount() && rewardMint.items?.[id] === 'accepted';
}
function xamanScanText(id) {
  const to = auraTillAddress();
  const xrp = String(xrpPriceFor(id) || '').trim();
  if (!to || !xrp || !(Number(xrp) > 0) || tokenClaim(id)) return '';
  return `https://xumm.app/detect/xrp:${to}:${xrp}`;
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
  return isLimited(item) || (!isFelix(item) && !tokenClaim(item.id) && !MONEY.has(item.kind) && !stallInfo.money);
}

function closeTreeDrawer() {
  const drawer = overlay?.querySelector('#auraTradeshowTreeDrawer');
  if (drawer) drawer.checked = false;
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
      <p class="aura-tradeshow-vip" id="auraTradeshowVip"></p>
      <button type="button" class="aura-tradeshow-close" id="auraTradeshowClose" aria-label="Close tradeshow">×</button>
    </div>
    <p class="aura-tradeshow-note" id="auraTradeshowNote"></p>
    <div class="aura-tradeshow-tools">
      <div class="aura-tradeshow-search">
        <input type="checkbox" id="auraTradeshowSearchToggle" class="aura-tradeshow-search-toggle">
        <label for="auraTradeshowSearchToggle" class="aura-tradeshow-search-btn" aria-label="Find a…">Find</label>
        <input type="search" id="auraTradeshowSearch" placeholder="Find a…" aria-label="Search the collection">
      </div>
      <div class="aura-tradeshow-have" role="group" aria-label="Collected or locked">
        <button type="button" data-have="collected">Collected</button>
        <button type="button" data-have="locked">Locked</button>
      </div>
      <div class="aura-tradeshow-quick" role="group" aria-label="Quick links">
        <button type="button" data-folder="open">Open</button>
        <button type="button" data-folder="closed">Closed</button>
        <button type="button" data-folder="convert">Convert</button>
        <button type="button" data-folder="felix">Felix</button>
        <button type="button" class="aura-tradeshow-limited-tab" data-folder="limited">Limited</button>
      </div>
    </div>
    <div class="aura-tradeshow-main">
      <div class="aura-tradeshow-tree-shell">
        <input type="checkbox" id="auraTradeshowTreeDrawer" class="aura-tradeshow-tree-drawer">
        <label for="auraTradeshowTreeDrawer" class="aura-tradeshow-tree-drawer-btn">Browse collection</label>
        <nav class="aura-tradeshow-tree" id="auraTradeshowTree" aria-label="Penny Fever Collection"></nav>
      </div>
      <div class="aura-tradeshow-body" id="auraTradeshowBody"></div>
    </div>
    <div class="aura-xrp-till" id="auraXrpTill" hidden>
      <div class="aura-xrp-till-card" role="dialog" aria-modal="true" aria-labelledby="auraXrpTillName">
        <button type="button" class="aura-xrp-till-close" data-xrp-close aria-label="Close XRP till">×</button>
        <img id="auraXrpTillImg" alt="" width="220" height="220">
        <h2 id="auraXrpTillName"></h2>
        <p id="auraXrpTillStock"></p>
        <p id="auraXrpTillPrice"></p>
        <p id="auraXrpTillCopy">MotherPC will open a Xaman sign request for this piece. You sign. We never hold guest keys.</p>
        <a class="aura-xrp-till-open" id="auraXrpTillOpen" hidden rel="noopener" target="_blank">Open in Xaman</a>
        <button type="button" class="aura-xrp-till-ready" data-xrp-hold>Notify me</button>
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
        <p class="aura-tradeshow-inspect-sample" id="auraTradeshowInspectSample">Offline sample · the original is the NFT token.</p>
        <p id="auraTradeshowInspectNftNote" hidden>Scan in Xaman. This QR opens Aura’s till address. Minting is still on hold.</p>
        <div class="aura-tradeshow-views aura-tradeshow-inspect-views">
          <button type="button" data-inspect-view="website" aria-pressed="true">Website</button>
          <button type="button" data-inspect-view="nft">NFT</button>
        </div>
        <div class="aura-tradeshow-inspect-actions">
          <button type="button" data-inspect-play hidden></button>
          <button type="button" data-inspect-buy hidden></button>
          <button type="button" data-inspect-claim hidden></button>
        </div>
        <button type="button" class="aura-tradeshow-inspect-back" data-inspect-close>← Back to tradeshow</button>
      </section>
    </div>`;
  overlay.append(inspect);
  document.body.append(overlay);
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
      if (LIMITED.has(id)) {
        openNodes.add('limited');
        openNodes.add(folder);
      } else {
        openNodes.add('book:penny-collector-book');
        openNodes.add(folder);
      }
      closeTreeDrawer();
      paint();
      return;
    }
    const fold = e.target.closest('[data-folder]');
    if (fold) {
      folder = fold.dataset.folder;
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
      if (folder.startsWith('item:')) {
        const item = (window.PennyFeverInventoryModel?.definitions || []).find((it) => it.id === folder.slice(5));
        if (item && isLimited(item)) {
          openNodes.add('limited');
        } else if (item?.book) {
          openNodes.add('book:penny-collector-book');
          openNodes.add('book:' + item.book);
        }
        if (item && isFelix(item)) openNodes.add('felix');
      }
      closeTreeDrawer();
      paint();
      return;
    }
    const inspectClose = e.target.closest('[data-inspect-close]');
    if (inspectClose || e.target === overlay.querySelector('#auraTradeshowInspect')) {
      e.preventDefault();
      closeInspect();
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
    if (e.target.id === 'auraXrpTill' || e.target.closest('[data-xrp-close]')) {
      e.preventDefault();
      closeXrpTill();
      return;
    }
    const hold = e.target.closest('[data-xrp-hold]');
    if (hold && hold.dataset.item) {
      e.preventDefault();
      queueXrpPlace(hold.dataset.item);
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
    ? 'Convert · token counter'
    : (isFelix(item)
      ? 'Felix’s photo booth · vendor portraits'
      : (isLimited(item)
        ? 'Aura Limited · optional XRP shelf'
        : (stall && stall.id !== 'ticket-booth' ? `${stall.host} · ${stall.title}` : (item.source || 'Aura’s tradeshow'))));
  const status = panel.querySelector('#auraTradeshowInspectAvailability');
  if (tokenClaim(item.id)) status.textContent = 'Convert here with tokens. The dollar till is not used.';
  else if (isLimited(item)) status.textContent = 'Aura Limited · posted XRP price';
  else if (isFelix(item)) status.textContent = `${stallDoor(stallById('snap')).mintable ? 'Photo booth open' : 'Photo booth closed'} · unlock at Felix`;
  else if (info.money) status.textContent = 'Aura’s till';
  else status.textContent = act.reward && !act.disabled ? 'Collected reward · ready to mint'
    : `${info.mintable ? 'Stall open' : 'Stall closed'} · ${onShelf(item.id) ? (act.disabled ? act.label : 'Buy with XRP') : 'Not on the NFT shelf yet'}`;
  panel.querySelector('#auraTradeshowInspectNote').textContent = claimLine(item, info);
  panel.querySelector('#auraTradeshowInspectStock').textContent = isFelix(item) ? 'Supply is earned through Felix’s photo booth.' : formatStock(item.id);
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
  const claim = tokenClaim(item.id);
  const redemption = rewardMint.account === vipAccount() && rewardMint.enabled && rewardMint.items[item.id];
  const purchasePrice = rewardMint.prices?.[item.id];
  if (redemption && !claim && !isFelix(item) && !MONEY.has(item.kind) && (!purchasePrice || stallInfo.mintable || isLimited(item))) {
    if (!mintedReady) return {label: 'Supply unavailable · reopen to retry', disabled: true};
    if (redemption === 'accepted') return {label: 'Reward NFT received', disabled: true, reward: true};
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
  if (claim && item.id === SNAP_BOOK && walletAtCap(item.id) && snapMint(item)) {
    return snapMint(item);
  }
  if (claim) {
    const cost = formatTokenCost(claim.cost);
    if (!vip()) return {label: `Join VIP to unlock · ${cost}`, disabled: true, claim: true};
    if (tokenClaimsInFlight.has(claimReceiptKey(vipAccount(), item.id))) return {label: 'Claim in progress.', disabled: true, claim: true};
    if (walletAtCap(item.id)) return {label: `Already in your wallet · ${capLine(item.id)}`, disabled: true, claim: true};
    if (dripCost(claim.cost) && !dripReady) return {label: 'Token bank unavailable · reopen to retry', disabled: true, claim: true};
    if (remainingFor(item.id) <= 0) return {label: 'Aura’s pile is gone · trade later', disabled: true, claim: true};
    if (!tokenAfford(claim.cost)) return {label: `Need ${cost}`, disabled: true, claim: true};
    return {label: `Claim · ${cost}`, disabled: false, ready: true, claim: true};
  }
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
  if (DRIPS.has(item.id)) {
    return {label: 'Won in the games · cap later', disabled: true};
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
    if (label) label.textContent = ownedPlate ? 'NFT artwork' : 'scan in Xaman';
    return;
  }
  if (img) img.alt = card.dataset.name || '';
  poseCard(card, Number(card.dataset.face) || 0);
}
function stopTillPoll() {
  // Closing or replacing the till also invalidates replies already in flight.
  tillRevision += 1;
  if (tillPoll) {
    clearInterval(tillPoll);
    tillPoll = 0;
  }
}
function closeXrpTill() {
  stopTillPoll();
  const till = overlay?.querySelector('#auraXrpTill');
  if (till) till.hidden = true;
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
function showTillPayload(till, img, name, data, account, id) {
  const link = String(data?.deep_link || '').trim();
  const qr = String(data?.qr || '').trim();
  const open = till.querySelector('#auraXrpTillOpen');
  if (link) checkoutLinks.set(account + ':' + id, link);
  if (open) {
    if (link) {
      open.hidden = false;
      open.href = link;
    } else {
      open.hidden = true;
      open.removeAttribute('href');
    }
  }
  if (img && /^https:\/\/xumm\.app\//i.test(qr)) {
    img.src = qr;
    img.alt = `${name} · Xaman sign`;
    return;
  }
  if (link) showTillQr(img, name, link);
}
function watchXamanPayload(till, uuid, revision, account, reward = false) {
  if (revision !== tillRevision || account !== vipAccount()) return;
  stopTillPoll();
  const pollRevision = tillRevision;
  const copy = till.querySelector('#auraXrpTillCopy');
  const img = till.querySelector('#auraXrpTillImg');
  const name = till.querySelector('#auraXrpTillName')?.textContent || 'card';
  const tick = () => {
    if (pollRevision !== tillRevision) return;
    if (till.hidden || account !== vipAccount()) {
      stopTillPoll();
      return;
    }
    fetch(reward ? `${NFT_HOST}/api/penny-fever/verified/redeem/status`
      : `${NFT_HOST}/api/penny-fever/xaman-checkout/status/${uuid}`, reward ? {
        method: 'POST', cache: 'no-store', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: account, payload: uuid}),
      } : {cache: 'no-store'})
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (pollRevision !== tillRevision || account !== vipAccount() || till.hidden || !copy) return;
        const mint = data?.mint;
        if (mint?.accept_deep_link && mint.status !== 'accepted') {
          showTillPayload(till, img, name, {
            deep_link: mint.accept_deep_link,
            qr: mint.accept_qr,
          }, account, uuid);
          copy.textContent = mint.message || 'Signed. Open Xaman again to receive the card.';
          return;
        }
        if (mint?.status === 'accepted') {
          stopTillPoll();
          copy.textContent = mint.message || 'The card is in your wallet.';
          loadMinted();
          if (reward) loadRewardMint(account, eligibilityRevision).then(paint);
          return;
        }
        if (data?.status === 'signed') {
          copy.textContent = (mint && mint.message) || data.message || 'Signed. Minting your card…';
          return;
        }
        if (data?.status && data.status !== 'open') {
          stopTillPoll();
          copy.textContent = data.message || 'This sign request closed.';
        }
      })
      .catch(() => {});
  };
  tillPoll = setInterval(tick, 2500);
  tick();
}
function openXrpTill(id) {
  const act = shopAction(id);
  if (act.disabled || act.claim || !act.ready) {
    const note = overlay?.querySelector('#auraTradeshowNote');
    if (note) note.textContent = act.label || 'This card is not for XRP yet.';
    return;
  }
  const till = overlay?.querySelector('#auraXrpTill');
  if (!till) return;
  stopTillPoll();
  const revision = tillRevision;
  const account = vipAccount();
  const item = modelItem(id);
  const name = item?.name || id;
  const img = till.querySelector('#auraXrpTillImg');
  const hold = till.querySelector('[data-xrp-hold]');
  const copy = till.querySelector('#auraXrpTillCopy');
  if (img) {
    img.removeAttribute('src');
    img.alt = `${name} · waiting for Xaman`;
  }
  till.querySelector('#auraXrpTillName').textContent = name;
  till.querySelector('#auraXrpTillStock').textContent = formatStock(id);
  till.querySelector('#auraXrpTillPrice').textContent = act.reward && !act.purchase
    ? `${act.label}. Open Xaman on this phone, or scan the QR from another device. Network fee only. We never hold guest keys.`
    : `${purchaseLabel(item) || act.label}. Open Xaman on this phone, or scan the QR from another device. We never hold guest keys.`;
  if (copy) copy.textContent = 'Opening a Xaman sign request…';
  const open = till.querySelector('#auraXrpTillOpen');
  if (open) {
    open.hidden = true;
    open.removeAttribute('href');
  }
  if (hold) hold.dataset.item = id;
  till.hidden = false;
  till.querySelector('[data-xrp-close]')?.focus();
  fetch(checkoutUrl(id), act.reward ? {
    method: 'POST', cache: 'no-store', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: account, item: id, purchase: !!act.purchase}),
  } : {cache: 'no-store'})
    .then(async res => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Error(data?.message || data?.error || 'Checkout unavailable');
      return data;
    })
    .then((data) => {
      if (revision !== tillRevision || account !== vipAccount() || till.hidden || !copy) return;
      if (data?.deep_link || data?.qr) {
        showTillPayload(till, img, name, data, account, id);
        copy.textContent = data.message || (act.reward && !act.purchase
          ? 'Tap Open in Xaman. This collected piece has no tradeshow price.'
          : 'Tap Open in Xaman on this phone, or scan the QR. We never hold guest keys.');
        if (data.payload) watchXamanPayload(till, data.payload, revision, account, !!act.reward);
        return;
      }
      copy.textContent = data?.message || 'Xaman checkout is next. Nothing leaves a wallet yet.';
    })
    .catch(error => {
      if (revision === tillRevision && account === vipAccount() && copy && !till.hidden) copy.textContent = `Checkout did not open: ${error?.message || 'connection unavailable'}. No NFT purchase was completed here.`;
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
  return !!(item && (item.id === 'everyday-penny' || item.id === 'five-penny-stack' || DRIPS.has(item.id)));
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
  if (folder === 'felix') return true;
  if (folder.startsWith('item:') && isFelix(modelItem(folder.slice(5)))) return true;
  return false;
}
function bookTitle(id) {
  return (window.PennyFeverInventoryModel?.books || []).find((b) => b.id === id)?.title || 'folder';
}
function folderUp() {
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
    if (isFelix(item)) return {id: 'felix', label: 'Felix'};
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
  if (haveFilter === 'collected' && walletCount(item.id) <= 0) return false;
  if (haveFilter === 'locked' && walletCount(item.id) > 0) return false;
  if (folder === 'all') return true;
  if (folder === 'open') {
    return isOpenPlayStall(stall) && (stall.prizes || []).includes(item.id) && !MONEY.has(item.kind) && !isLimited(item) && !isFelix(item);
  }
  if (folder === 'closed') {
    return isClosedPlayStall(stall) && (stall.prizes || []).includes(item.id) && !MONEY.has(item.kind) && !isLimited(item) && !isFelix(item);
  }
  if (folder === 'felix') return isFelix(item);
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
function treeRow(id, label, {leaf = false, root = false} = {}) {
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
  btn.textContent = label;
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
  const root = document.createElement('div');
  root.className = 'aura-tradeshow-tree-root';
  root.append(treeRow('book:penny-collector-book', 'Penny collector book', {root: true}));
  if (openNodes.has('book:penny-collector-book')) {
    const bookWrap = treeKids();
    bookWrap.append(treeRow('everyday', 'Everyday items'));
    if (openNodes.has('everyday')) {
      const itemWrap = treeKids();
      for (const item of (itemsByBook.get('penny-collector-book') || []).filter(isEveryday)) {
        itemWrap.append(treeRow('item:' + item.id, item.name, {leaf: true}));
      }
      bookWrap.append(itemWrap);
    }
    for (const book of playBinders(books)) {
      const bid = 'book:' + book.id;
      bookWrap.append(treeRow(bid, book.title));
      if (openNodes.has(bid)) {
        const itemWrap = treeKids();
        for (const item of (itemsByBook.get(book.id) || []).filter((it) => it.id !== book.id && !isEveryday(it))) {
          itemWrap.append(treeRow('item:' + item.id, item.name, {leaf: true}));
        }
        bookWrap.append(itemWrap);
      }
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
      limWrap.append(treeRow(bid, item.name));
      if (openNodes.has(bid)) {
        const itemWrap = treeKids();
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
    for (const item of felixItems) {
      felixWrap.append(treeRow('item:' + item.id, item.name, {leaf: true}));
    }
    root.append(felixWrap);
  }
  nav.append(root);
}
function appendCards(grid, items) {
  for (const item of items) {
    // Books mix vendors. Resolve each card from its own chapter/portrait ID,
    // just as filters and checkout do, rather than inheriting the book's host.
    const stall = stallForPrize(item);
    const info = stallDoor(stall);
    const card = document.createElement('article');
    card.className = 'aura-tradeshow-card' + (walletCount(item.id) > 0 ? '' : ' is-locked');
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
    const chipText = felix ? 'Photo booth' : (limited ? 'Limited' : (claim ? 'Token claim' : (MONEY.has(item.kind) || info.money ? 'Dollars' : (info.mintable ? 'Open' : 'Coming'))));
    const act = actionFor(item, info);
    const play = playTap(item, info, stall);
    const canSpin = !!item.turnaround;
    const sample = nftSampleNote(item);
    const shopBtn = (felix && !act.snap) ? '' : (act.claim
      ? `<button type="button" class="aura-tradeshow-buy${act.ready ? ' is-ready' : ''}" data-claim="${item.id}" ${act.disabled ? 'disabled' : ''}>${act.label}</button>`
      : `<button type="button" class="aura-tradeshow-buy${act.ready ? ' is-ready' : ''}" data-buy="${item.id}" ${act.disabled ? 'disabled' : ''}>${act.label}</button>`);
    card.innerHTML = `
      <div class="aura-tradeshow-stage" data-inspect="${item.id}" role="button" tabindex="0" aria-label="Inspect ${item.name || item.id}" title="Open details"><img alt="" draggable="false" loading="lazy" decoding="async" src="${faceSrc(item, 'front')}"></div>
      ${canSpin ? `<div class="aura-tradeshow-turn">
        ${VIEWS.map((view) => `<button type="button" data-face="${view}"${view === 'front' ? ' aria-pressed="true"' : ''}>${view[0].toUpperCase()}${view.slice(1)}</button>`).join('')}
        <button type="button" data-spin="1">Rotate</button>
      </div>` : ''}
      <div class="aura-tradeshow-views">
        <button type="button" data-view="website" aria-pressed="true">Website</button>
        <button type="button" data-view="nft" ${showQr ? '' : 'disabled'} aria-pressed="false">${showQr ? 'NFT' : 'NFT soon'}</button>
      </div>
      <span class="chip ${chipClass}">${chipText}</span>
      <h3>${item.name}</h3>
      ${sample ? `<p class="sample">${sample}</p>` : ''}
      <p class="price">${purchaseLabel(item)}</p>
      ${felix ? '' : `<p class="stock">${formatStock(item.id)}</p>`}
      ${tankMarkup(item)}
      <p class="claim">${claimLine(item, info)}</p>
      ${play ? `<button type="button" class="aura-tradeshow-play" data-go-stall="${play.id}">${play.label}</button>` : ''}
      ${nestedBook && item.id !== 'penny-collector-book' ? `<button type="button" class="aura-tradeshow-play" data-open-book="${item.id}">Open folder</button>` : ''}
      ${shopBtn}`;
    const pic = card.querySelector('img');
    if (pic) pic.alt = item.name || '';
    grid.append(card);
  }
}

function paint() {
  if (!overlay || overlay.hidden) return;
  const status = tradeshowStatus();
  const door = overlay.querySelector('#auraTradeshowDoor');
  door.textContent = parkLabel(SHOW_ID);
  door.className = 'aura-tradeshow-door is-' + status;
  const vipEl = overlay.querySelector('#auraTradeshowVip');
  if (vip()) {
    const email = String(window.InstapicGuestIdentity?.read?.()?.email || '').split('@')[0];
    vipEl.replaceChildren();
    vipEl.textContent = 'VIP · ' + (email || 'signed in');
  } else {
    const a = document.createElement('a');
    a.href = vipJoin();
    a.textContent = 'Join VIP';
    a.addEventListener('click', rememberTradeshowLook);
    vipEl.replaceChildren(a, document.createTextNode(' to buy and keep.'));
  }
  overlay.querySelector('#auraTradeshowNote').textContent = folderIsFelix()
    ? 'Portraits unlock at Felix’s photo booth after a paid session. They are not for sale here.'
    : folder === 'convert'
      ? 'Convert is Aura’s token counter. Spend stars, moons, roses, crowns, or pennies from play. A full tank becomes the collector book, Felix photo book, or Aura keepsake. Limited stays XRP.'
    : folder === 'open' || stallFolderKind(folder) === 'open'
      ? 'Open tents · six chapter bonuses each. Felix portraits are under Felix.'
    : folder === 'closed' || stallFolderKind(folder) === 'closed'
      ? 'Closed tents · six chapter bonuses each. Look now. Play when the stall opens.'
    : folder === 'everyday'
      ? 'Everyday pennies, 5-packs, stars, moons, roses and crowns. Convert uses these tanks.'
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
      || (id === 'convert' && folder === 'convert')
      || (id === 'book:penny-collector-book' && (folder.startsWith('book:') || folder.startsWith('item:')) && !folderIsLimited() && !folderIsFelix() && folder !== 'convert');
    b.setAttribute('aria-pressed', String(on));
  });

  const model = window.PennyFeverInventoryModel;
  const items = model?.definitions || [];
  const books = model?.books || [];
  const bookIds = new Set(books.map((b) => b.id));
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
    if (bookIds.has(item.id) && !tokenClaim(item.id)) continue;
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
    : (folder === 'convert'
      ? [{
        title: 'Aura converts tokens',
        line: 'Stars, moons, roses, crowns, or pennies · not XRP',
        items: Object.keys(stock.token_claims || {}).map((id) => modelItem(id)).filter((item) => item.id),
        stall: stallById('ticket-booth'),
      }]
      : folder === 'everyday'
      ? [{
        title: 'Everyday items',
        line: 'Pennies, 5-packs and drip tokens',
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
          title: 'Everyday items',
          line: 'Pennies, 5-packs and drip tokens',
          items: items.filter(isEveryday),
          stall: stallById('ticket-booth'),
        },
        {
          title: 'Books, journals, cases and albums',
          line: 'Expand a book in the tree to open its pages',
          items: playBinders(books).map((b) => modelItem(b.id)).filter((item) => item.id),
          stall: stallById('ticket-booth'),
        },
      ]
      : folderIsFelix()
      ? [{title: 'Felix’s Instapic Photo Booth', line: 'Unlock with a photo session', items: felixItems, stall: stallById('snap')}]
      : folderIsLimited()
        ? limitedBookSections(books, itemsByBook, limitedItems)
      : books
        .filter((b) => !LIMITED.has(b.id))
        .map((b) => ({
          title: b.title,
          line: b.kicker || 'Book',
          items: itemsByBook.get(b.id) || [],
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

export function openTradeshow() {
  if (tradeshowBlocked()) return false;
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
  });
  paint();
  overlay.querySelector('#auraTradeshowClose').focus();
  return true;
}

export function closeTradeshow(opts = {}) {
  if (!overlay || overlay.hidden) return;
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
window.AuraTradeshow = {open: openTradeshow, close: closeTradeshow, status: tradeshowStatus};

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
