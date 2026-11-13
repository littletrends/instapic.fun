import {parkLabel, parkSign, parkStatus} from '../paper-games/park-doors.js?v=map-doors-3';
import {stallById, stalls} from './items/midway.js?v=treasure-design-1';
import {qrDataUrl} from './qrcode-generator.js?v=nft-host-11';

export const SHOW_ID = 'aura-tradeshow';
const HASH = 'aura-tradeshow';
const VIEWS = ['front', 'left', 'back', 'right'];
const MONEY = new Set(['currency', 'scrip', 'ticket', 'pass']);
const DRIPS = new Set(['star-token', 'rose-penny', 'moon-penny', 'crown-token']);
const FILE = new URL('../aura-stock.json?t=' + Date.now(), import.meta.url);
const NFT_HOST = 'https://motherpc.taild1a44c.ts.net';
const NFT_VER = 'nft-host-15';
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
  ]).then(deliverClaimReceipts);
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
function vipJoin() {
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
function faceSrc(item, view) {
  const asset = String(item.asset || '');
  const ver = (asset.match(/\?[^#]*$/) || [''])[0];
  return asset.replace(/front\.webp(\?.*)?$/, `${view}.webp${ver}`);
}
function formatStock(id) {
  if (!onShelf(id)) return 'Not on the shelf yet';
  if (!mintedReady) return 'Supply unavailable · reopen to retry';
  const n = remainingFor(id);
  const left = n.toLocaleString('en-AU') + ' remaining';
  if (n <= 0) return left + ' · trade later';
  if (shopHolding(id)) return left + ' · last copies held for play';
  return left;
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
function checkoutUrl(id) {
  const qs = new URLSearchParams({
    item: id,
    guest: guestRef(),
    vip: vipEmail(),
    return: tillLink(id),
  });
  return `${NFT_HOST}/api/penny-fever/xaman-checkout?${qs}`;
}
function buyQrSrc(id) {
  try {
    return qrDataUrl(tillLink(id), 5, 8);
  } catch {
    return '';
  }
}
function nftViewSrc(id) {
  return nftPlates.has(id) ? nftPlateSrc(id) : buyQrSrc(id);
}
function nftViewAvailable(item, stallInfo) {
  return isLimited(item) || (!isFelix(item) && !tokenClaim(item.id) && !MONEY.has(item.kind) && !stallInfo.money);
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
      <p class="aura-tradeshow-vip" id="auraTradeshowVip"></p>
      <button type="button" class="aura-tradeshow-close" id="auraTradeshowClose" aria-label="Close tradeshow">×</button>
    </div>
    <p class="aura-tradeshow-note" id="auraTradeshowNote"></p>
    <div class="aura-tradeshow-tools">
      <input type="search" id="auraTradeshowSearch" placeholder="Find a keepsake or vendor" aria-label="Search the collection">
      <button type="button" data-folder="all">All</button>
      <button type="button" data-folder="open">Open stalls</button>
      <button type="button" data-folder="book:penny-collector-book" aria-pressed="true">Penny collector book</button>
      <button type="button" data-folder="limited">Aura Limited</button>
      <button type="button" data-folder="felix">Felix’s Photo Booth</button>
    </div>
    <div class="aura-tradeshow-main">
      <nav class="aura-tradeshow-tree" id="auraTradeshowTree" aria-label="Penny Fever Collection"></nav>
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
      <div class="aura-tradeshow-inspect-stage" id="auraTradeshowInspectStage">
        <img id="auraTradeshowInspectImg" alt="" draggable="false">
      </div>
      <div class="aura-tradeshow-inspect-turn">
        <button type="button" data-inspect-spin="-1" aria-label="Previous view">←</button>
        <span id="auraTradeshowInspectFace" aria-live="polite">front</span>
        <button type="button" data-inspect-spin="1" aria-label="Rotate">Rotate</button>
      </div>
      <section class="aura-tradeshow-inspect-copy">
        <p class="aura-tradeshow-inspect-kicker" id="auraTradeshowInspectSource"></p>
        <h2 id="auraTradeshowInspectName"></h2>
        <p id="auraTradeshowInspectNote"></p>
        <p id="auraTradeshowInspectStock"></p>
        <p id="auraTradeshowInspectNftNote" hidden>NFT artwork is not previewed here until it has been bought. This view is the Xaman purchase QR.</p>
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
  overlay.querySelector('#auraTradeshowSearch').addEventListener('input', (e) => {
    query = e.target.value.trim().toLowerCase();
    paint();
  });
  overlay.addEventListener('keydown', (e) => {
    const stage = e.target.closest('[data-inspect]');
    if (!stage || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    openInspect(stage.dataset.inspect);
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
    const fold = e.target.closest('[data-folder]');
    if (fold) {
      folder = fold.dataset.folder;
      if (folder.startsWith('book:') || folder === 'open' || folder === 'felix' || folder === 'limited') openNodes.add(folder);
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
      openInspect(inspectStage.dataset.inspect);
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
    const spin = e.target.closest('[data-spin]');
    if (!spin) return;
    const card = spin.closest('.aura-tradeshow-card');
    if (!card || card.dataset.mode === 'nft') return;
    const img = card?.querySelector('img');
    if (!img) return;
    const views = VIEWS.filter((view) => card.dataset[view] === '1');
    if (views.length < 2) return;
    const dir = Number(spin.dataset.spin || 1);
    const i = (Number(card.dataset.face) + dir) % views.length;
    const next = (i + views.length) % views.length;
    card.dataset.face = String(next);
    img.src = faceSrc({asset: card.dataset.asset}, views[next]);
    const label = card.querySelector('[data-face-label]');
    if (label) label.textContent = views[next];
  });
  return overlay;
}

function inspectViews(item) {
  return VIEWS.filter((view) => item?.turnaround || view === 'front');
}

function closeInspect() {
  const panel = overlay?.querySelector('#auraTradeshowInspect');
  if (!panel) return;
  panel.hidden = true;
  inspectItem = null;
  overlay?.querySelector('.aura-tradeshow-card [data-inspect]')?.focus?.();
}

function setInspectMode(mode) {
  if (!inspectItem) return;
  const inspectInfo = stallDoor(stallForPrize(inspectItem));
  const nftAvailable = nftViewAvailable(inspectItem, inspectInfo);
  inspectMode = mode === 'nft' && nftAvailable ? 'nft' : 'website';
  const img = overlay?.querySelector('#auraTradeshowInspectImg');
  const label = overlay?.querySelector('#auraTradeshowInspectFace');
  if (inspectMode === 'nft') {
    const ownedPlate = nftPlates.has(inspectItem.id);
    const preview = nftViewSrc(inspectItem.id);
    if (img) { img.src = preview || faceSrc(inspectItem, 'front'); img.alt = `${inspectItem.name || inspectItem.id} · ${ownedPlate ? 'NFT artwork' : 'Xaman checkout'}`; }
    if (label) label.textContent = ownedPlate ? 'NFT artwork' : 'scan to sign';
  } else {
    const views = inspectViews(inspectItem);
    inspectFace = Math.max(0, Math.min(inspectFace, views.length - 1));
    const face = views[inspectFace] || 'front';
    if (img) { img.src = faceSrc(inspectItem, face); img.alt = inspectItem.name || ''; }
    if (label) label.textContent = face;
  }
  const nftNote = overlay?.querySelector('#auraTradeshowInspectNftNote');
  if (nftNote) {
    nftNote.hidden = inspectMode !== 'nft';
    if (inspectMode === 'nft') nftNote.textContent = nftPlates.has(inspectItem.id)
      ? 'NFT artwork supplied by MotherPC after purchase.'
      : 'NFT artwork is not previewed here until it has been bought. This view is the Xaman purchase QR.';
  }
  overlay?.querySelectorAll('[data-inspect-view]').forEach((button) => {
    button.disabled = button.dataset.inspectView === 'nft' && !nftAvailable;
    button.setAttribute('aria-pressed', String(button.dataset.inspectView === inspectMode));
  });
  overlay?.querySelectorAll('[data-inspect-spin]').forEach((button) => { button.disabled = inspectMode === 'nft'; });
}

function stepInspect(dir) {
  if (!inspectItem || inspectMode === 'nft') return;
  const views = inspectViews(inspectItem);
  if (views.length < 2) return;
  inspectFace = (inspectFace + dir + views.length) % views.length;
  setInspectMode('website');
}

function openInspect(id) {
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
  panel.querySelector('#auraTradeshowInspectSource').textContent = stall ? `${stall.host} · ${stall.title}` : (item.source || 'Aura’s tradeshow');
  panel.querySelector('#auraTradeshowInspectNote').textContent = claimLine(item, info);
  panel.querySelector('#auraTradeshowInspectStock').textContent = isFelix(item) ? 'Supply is earned through Felix’s photo booth.' : formatStock(item.id);
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
  setInspectMode('website');
  panel.querySelector('[data-inspect-close]')?.focus();
}

function snapMint(item) {
  if (!onShelf(item.id)) return null;
  return {label: 'NFT minting unavailable · verified banking in progress', disabled: true, snap: true};
}
function actionFor(item, stallInfo) {
  if (onShelf(item.id) && !tokenClaim(item.id) && !isFelix(item)) {
    return {label: 'NFT minting unavailable · verified banking in progress', disabled: true, limited: isLimited(item)};
  }
  if (onShelf(item.id) && !mintedReady) {
    return {label: 'Supply unavailable · reopen to retry', disabled: true};
  }
  if (isFelix(item)) {
    return snapMint(item) || {label: 'Not for sale · unlock at Felix’s photo booth', disabled: true};
  }
  if (!onShelf(item.id)) {
    return {label: 'Not on the shelf yet', disabled: true};
  }
  const claim = tokenClaim(item.id);
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
  if (claim) return `Token claim · ${act.label}`;
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
  if (isFelix(item)) {
    return {id: 'snap', label: 'Go to Felix’s booth'};
  }
  if (MONEY.has(item.kind) || stallInfo.money || stall?.id === 'ticket-booth') {
    return {id: 'aura', label: 'Go to Aura’s till'};
  }
  return {id: stall.id, label: `Play at ${stall.host || 'this stall'}`};
}
function setCardView(card, mode) {
  if (!card) return;
  const next = mode === 'nft' ? 'nft' : 'website';
  const img = card.querySelector('img');
  const id = card.dataset.item;
  card.dataset.mode = next;
  card.classList.toggle('is-nft', next === 'nft');
  card.querySelectorAll('[data-view]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.view === next));
  });
  const label = card.querySelector('[data-face-label]');
  if (next === 'nft') {
    const name = card.dataset.name || id;
    const ownedPlate = nftPlates.has(id);
    if (img) {
      img.src = nftViewSrc(id) || faceSrc({asset: card.dataset.asset}, 'front');
      img.alt = `${name} · ${ownedPlate ? 'NFT artwork' : 'Xaman checkout'}`;
    }
    if (label) label.textContent = ownedPlate ? 'NFT artwork' : 'scan to sign';
    return;
  }
  const face = VIEWS[Number(card.dataset.face) || 0] || 'front';
  if (img) {
    img.src = faceSrc({asset: card.dataset.asset}, face);
    img.alt = card.dataset.name || '';
  }
  if (label) label.textContent = face;
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
function watchXamanPayload(till, uuid, revision, account) {
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
    fetch(`${NFT_HOST}/api/penny-fever/xaman-checkout/status/${uuid}`, {cache: 'no-store'})
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (pollRevision !== tillRevision || account !== vipAccount() || till.hidden || !copy) return;
        const mint = data?.mint;
        if (mint?.accept_deep_link && mint.status !== 'accepted') {
          showTillQr(img, name, mint.accept_deep_link);
          copy.textContent = mint.message || 'Signed. Scan again in Xaman to receive the card.';
          return;
        }
        if (mint?.status === 'accepted') {
          stopTillPoll();
          copy.textContent = mint.message || 'The card is in your wallet.';
          loadMinted();
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
  showTillQr(img, name, tillLink(id));
  till.querySelector('#auraXrpTillName').textContent = name;
  till.querySelector('#auraXrpTillStock').textContent = formatStock(id);
  till.querySelector('#auraXrpTillPrice').textContent = `${act.label}. Scan in Xaman. We never hold guest keys.`;
  if (copy) copy.textContent = 'Opening a Xaman sign request…';
  if (hold) hold.dataset.item = id;
  till.hidden = false;
  till.querySelector('[data-xrp-close]')?.focus();
  fetch(checkoutUrl(id), {cache: 'no-store'})
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((data) => {
      if (revision !== tillRevision || account !== vipAccount() || till.hidden || !copy) return;
      if (data?.deep_link) {
        showTillQr(img, name, data.deep_link);
        copy.textContent = data.message || 'Sign this Xaman request on your phone. We never hold guest keys.';
        if (data.payload) watchXamanPayload(till, data.payload, revision, account);
        return;
      }
      copy.textContent = data?.message || 'Xaman checkout is next. Nothing leaves a wallet yet.';
    })
    .catch(() => {
      if (revision === tillRevision && account === vipAccount() && copy && !till.hidden) copy.textContent = 'The till could not reach Xaman. Try again in a moment.';
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
  const PF = window.PennyFever;
  if (typeof PF?.enterTent === 'function') PF.enterTent(slug);
  else if (typeof world?.enterStall === 'function') world.enterStall(slug);
  else location.hash = 'cabinet/' + slug;
}

function isFelix(item) {
  return item.collection === 'penny-fever-vendors';
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
    return {
      title: b.title,
      line: b.kicker || 'Aura Limited · optional binder',
      items: [cover, ...pieces].filter(Boolean),
      stall: stallById('ticket-booth'),
    };
  });
}
function albumTitle(model, id) {
  return (model?.albums || []).find((a) => a.id === id)?.title || id;
}
function itemMatches(item, stall, info) {
  if (query && !`${item.name} ${stall.host} ${stall.title} ${item.album || ''} ${item.book || ''} ${item.collection || ''}`.toLowerCase().includes(query)) return false;
  if (folder === 'all') return true;
  if (folder === 'open') return info.mintable && !MONEY.has(item.kind) && !isLimited(item) && !isFelix(item);
  if (folder === 'felix') return isFelix(item);
  if (folder === 'limited') return isLimited(item);
  if (folder === 'book:penny-collector-book') return !isFelix(item) && !isLimited(item);
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
    const nested = books.filter((b) => b.id !== 'penny-collector-book' && !LIMITED.has(b.id));
    for (const book of nested) {
      const bid = 'book:' + book.id;
      bookWrap.append(treeRow(bid, book.title));
      if (openNodes.has(bid)) {
        const itemWrap = treeKids();
        for (const item of (itemsByBook.get(book.id) || [])) {
          itemWrap.append(treeRow('item:' + item.id, item.name, {leaf: true}));
        }
        bookWrap.append(itemWrap);
      }
    }
    const loose = itemsByBook.get('penny-collector-book') || [];
    for (const item of loose) {
      bookWrap.append(treeRow('item:' + item.id, item.name, {leaf: true}));
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
  root.append(treeRow('open', 'Open stalls'));
  if (openNodes.has('open')) {
    const stallWrap = treeKids();
    for (const row of stallRows) {
      if (!stallDoor(row.stall).mintable) continue;
      stallWrap.append(treeRow('stall:' + row.stall.id, row.stall.host, {leaf: true}));
    }
    root.append(stallWrap);
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
    card.className = 'aura-tradeshow-card';
    card.dataset.asset = item.asset;
    card.dataset.item = item.id;
    card.dataset.name = item.name || item.id;
    card.dataset.mode = 'website';
    card.dataset.face = '0';
    VIEWS.forEach((view) => { card.dataset[view] = item.turnaround || view === 'front' ? '1' : '0'; });
    const felix = isFelix(item);
    const claim = tokenClaim(item.id);
    const limited = isLimited(item);
    const showQr = nftViewAvailable(item, info);
    const chipClass = felix ? 'is-felix' : (limited ? 'is-limited' : (claim ? 'is-claim' : (MONEY.has(item.kind) || info.money ? 'is-money' : (info.mintable ? 'is-open' : 'is-coming'))));
    const chipText = felix ? 'Photo booth' : (limited ? 'Limited' : (claim ? 'Token claim' : (MONEY.has(item.kind) || info.money ? 'Dollars' : (info.mintable ? 'Open' : 'Coming'))));
    const act = actionFor(item, info);
    const play = playTap(item, info, stall);
    const canSpin = !!item.turnaround;
    const shopBtn = (felix && !act.snap) ? '' : (act.claim
      ? `<button type="button" class="aura-tradeshow-buy${act.ready ? ' is-ready' : ''}" data-claim="${item.id}" ${act.disabled ? 'disabled' : ''}>${act.label}</button>`
      : `<button type="button" class="aura-tradeshow-buy${act.ready ? ' is-ready' : ''}" data-buy="${item.id}" ${act.disabled ? 'disabled' : ''}>${act.label}</button>`);
    card.innerHTML = `
      <div class="aura-tradeshow-stage" data-inspect="${item.id}" role="button" tabindex="0" aria-label="Inspect ${item.name || item.id}" title="Open details"><img alt="" draggable="false" src="${faceSrc(item, 'front')}"></div>
      ${canSpin ? `<div class="aura-tradeshow-turn">
        <button type="button" data-spin="-1" aria-label="Previous view">←</button>
        <span data-face-label>front</span>
        <button type="button" data-spin="1" aria-label="Rotate">Rotate</button>
      </div>` : ''}
      <div class="aura-tradeshow-views">
        <button type="button" data-view="website" aria-pressed="true">Website</button>
        <button type="button" data-view="nft" ${showQr ? '' : 'disabled'} aria-pressed="false">${showQr ? 'NFT' : 'NFT soon'}</button>
      </div>
      <span class="chip ${chipClass}">${chipText}</span>
      <h3>${item.name}</h3>
      ${felix ? '' : `<p class="stock">${formatStock(item.id)}</p>`}
      <p class="claim">${claimLine(item, info)}</p>
      ${play ? `<button type="button" class="aura-tradeshow-play" data-go-stall="${play.id}">${play.label}</button>` : ''}
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
    vipEl.replaceChildren(a, document.createTextNode(' to open Aura’s tradeshow.'));
  }
  overlay.querySelector('#auraTradeshowNote').textContent = folderIsFelix()
    ? 'Portraits unlock at Felix’s photo booth after a paid session. They are not for sale here.'
    : folderIsLimited()
      ? limitedShelfNote()
      : 'Expand the Penny collector book for books and albums, then their items. Star, moon, rose and crown bank from VIP play — guest finds stay paper and do not unlock books.';
  overlay.querySelectorAll('.aura-tradeshow-tools [data-folder]').forEach((b) => {
    const id = b.dataset.folder;
    const on = folder === id
      || (id === 'open' && folder.startsWith('stall:'))
      || (id === 'felix' && folderIsFelix())
      || (id === 'limited' && folderIsLimited())
      || (id === 'book:penny-collector-book' && (folder.startsWith('book:') || folder.startsWith('item:')) && !folderIsLimited() && !folderIsFelix());
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
  const byStall = folder === 'open' || folder.startsWith('stall:');
  const sections = byStall
    ? stallRows.map((row) => {
      const info = stallDoor(row.stall);
      return {
        title: `${row.stall.host} · ${row.stall.title}`,
        line: info.money ? 'Dollar till' : (info.mintable ? 'Open' : 'Coming'),
        items: row.items,
        stall: row.stall,
      };
    })
    : (folderIsFelix()
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
    if (!shown.length) continue;
    const wrap = document.createElement('section');
    wrap.className = 'aura-tradeshow-stall';
    wrap.innerHTML = `<h2>${section.title}</h2><p>${section.line} · ${shown.length} piece${shown.length === 1 ? '' : 's'}</p>`;
    const grid = document.createElement('div');
    grid.className = 'aura-tradeshow-grid';
    appendCards(grid, shown);
    wrap.append(grid);
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
  if (!vip()) {
    location.assign(vipJoin());
    return false;
  }
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
