import {parkLabel, parkSign, parkStatus} from '../paper-games/park-doors.js?v=map-doors-3';
import {stallById, stalls} from './items/midway.js?v=treasure-design-1';
import {qrDataUrl} from './qrcode-generator.js?v=nft-host-4';

export const SHOW_ID = 'aura-tradeshow';
const HASH = 'aura-tradeshow';
const VIEWS = ['front', 'left', 'back', 'right'];
const MONEY = new Set(['currency', 'scrip', 'ticket', 'pass']);
const DRIPS = new Set(['star-token', 'rose-penny', 'moon-penny', 'crown-token']);
const FILE = new URL('../aura-stock.json?t=' + Date.now(), import.meta.url);
const NFT_HOST = 'https://motherpc.taild1a44c.ts.net';
const NFT_VER = 'nft-host-4';
const XRP_BY_CAP = {
  11111111: '0.0001',
  2222222: '0.0022',
  333333: '0.00333',
  44444: '0.04444',
  5555: '0.55555',
  666: '6.66666',
};

let stock = {default_remaining: 0, items: {}, ceilings: {}, hold_floor: 111, hold_pct: 0, aura_xrp_address: '', xrp_by_ceiling: XRP_BY_CAP, one_per_wallet: true};
let nftPlates = new Set();
let overlay = null;
let resumeWorld = false;
let folder = 'book:penny-collector-book';
let query = '';
const openNodes = new Set(['book:penny-collector-book']);

function vip() {
  return !!window.InstapicGuestIdentity?.isVerifiedSessionActive?.();
}
function vipJoin() {
  const hash = location.hash || '#alley';
  const path = '/penny-fever/index.html?style=paper&rail=paper&v=nft-host-4' + hash;
  return '/save.html?return=' + encodeURIComponent(path);
}
export function tradeshowStatus() {
  return parkStatus(SHOW_ID);
}
export function tradeshowBlocked() {
  const status = tradeshowStatus();
  return status === 'closed' || status === 'maintenance';
}
export function remainingFor(id) {
  const n = stock.items?.[id];
  if (Number.isFinite(Number(n))) return Math.max(0, Math.floor(Number(n)));
  const fallback = Number(stock.default_remaining);
  return Number.isFinite(fallback) ? Math.max(0, Math.floor(fallback)) : 0;
}
function ceilingFor(id) {
  const n = Number(stock.ceilings?.[id]);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  return remainingFor(id);
}
function holdFloor(id) {
  const cap = ceilingFor(id);
  const pct = Number.isFinite(Number(stock.hold_pct)) ? Number(stock.hold_pct) : 0.1;
  const floor = Number.isFinite(Number(stock.hold_floor)) ? Number(stock.hold_floor) : 15;
  return Math.max(floor, Math.ceil(cap * pct));
}
function shopHolding(id) {
  const left = remainingFor(id);
  return left > 0 && left <= holdFloor(id);
}
function xrpPriceFor(id) {
  const cap = ceilingFor(id);
  const fromStock = stock.xrp_by_ceiling?.[String(cap)] ?? stock.xrp_by_ceiling?.[cap];
  if (fromStock != null && String(fromStock).trim()) return String(fromStock).trim();
  return XRP_BY_CAP[cap] || '';
}
function formatXrp(id) {
  const p = xrpPriceFor(id);
  return p ? `${p} XRP` : '';
}
function walletOwns(id) {
  if (stock.one_per_wallet === false) return false;
  try {
    const row = window.PennyFever?.getState?.()?.paperInventory?.items?.[id];
    if (!row) return false;
    const qty = Number(row.qty);
    if (Number.isFinite(qty)) return qty > 0;
    return true;
  } catch {
    return false;
  }
}
function loadStock() {
  return fetch(FILE.href, {cache: 'no-store'})
    .then((res) => (res.ok ? res.json() : {}))
    .then((data) => {
      const fallback = Number(data.default_remaining);
      const items = data.items && typeof data.items === 'object' ? data.items : {};
      const ceilings = data.ceilings && typeof data.ceilings === 'object' ? data.ceilings : items;
      const xrp = data.xrp_by_ceiling && typeof data.xrp_by_ceiling === 'object' ? data.xrp_by_ceiling : XRP_BY_CAP;
      stock = {
        default_remaining: Number.isFinite(fallback) ? fallback : 0,
        items,
        ceilings,
        hold_floor: Number.isFinite(Number(data.hold_floor)) ? Number(data.hold_floor) : 111,
        hold_pct: Number.isFinite(Number(data.hold_pct)) ? Number(data.hold_pct) : 0,
        aura_xrp_address: String(data.aura_xrp_address || '').trim(),
        xrp_by_ceiling: xrp,
        one_per_wallet: data.one_per_wallet !== false,
      };
    })
    .catch(() => {});
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
function stallForPrize(item) {
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
  const n = remainingFor(id);
  const left = n.toLocaleString('en-AU') + ' remaining';
  if (n <= 0) return left + ' · trade later';
  if (shopHolding(id)) return left + ' · last copies held for play';
  return left;
}
function auraWallet() {
  const addr = String(stock.aura_xrp_address || '').trim();
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(addr) ? addr : '';
}
function buyPayload(id) {
  const addr = auraWallet();
  if (addr) return addr;
  const origin = (location.origin && location.origin.startsWith('http')) ? location.origin : 'https://instapic.fun';
  return `${origin}/penny-fever/index.html?style=paper&rail=paper&v=${NFT_VER}&buy=${encodeURIComponent(id)}#aura-tradeshow`;
}
function buyQrSrc(id) {
  try {
    return qrDataUrl(buyPayload(id), 5, 8);
  } catch {
    return '';
  }
}

function ensureOverlay() {
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'aura-tradeshow';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
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
      <button type="button" data-folder="felix">Felix’s Photo Booth</button>
    </div>
    <div class="aura-tradeshow-main">
      <nav class="aura-tradeshow-tree" id="auraTradeshowTree" aria-label="Penny Fever Collection"></nav>
      <div class="aura-tradeshow-body" id="auraTradeshowBody"></div>
    </div>
    <div class="aura-xrp-till" id="auraXrpTill" hidden>
      <div class="aura-xrp-till-card" role="dialog" aria-labelledby="auraXrpTillName">
        <button type="button" class="aura-xrp-till-close" data-xrp-close aria-label="Close XRP till">×</button>
        <img id="auraXrpTillImg" alt="" width="220" height="220">
        <h2 id="auraXrpTillName"></h2>
        <p id="auraXrpTillStock"></p>
        <p id="auraXrpTillPrice"></p>
        <p id="auraXrpTillCopy">Aura takes XRP here next. Play to win stays live. Nothing leaves a wallet yet.</p>
        <button type="button" class="aura-xrp-till-ready" data-xrp-hold>Hold my place</button>
      </div>
    </div>`;
  document.body.append(overlay);
  overlay.querySelector('#auraTradeshowClose').addEventListener('click', closeTradeshow);
  overlay.querySelector('#auraTradeshowSearch').addEventListener('input', (e) => {
    query = e.target.value.trim().toLowerCase();
    paint();
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
      if (folder.startsWith('book:') || folder === 'open' || folder === 'felix') openNodes.add(folder);
      if (folder.startsWith('item:')) {
        const item = (window.PennyFeverInventoryModel?.definitions || []).find((it) => it.id === folder.slice(5));
        if (item?.book) {
          openNodes.add('book:penny-collector-book');
          openNodes.add('book:' + item.book);
        }
        if (item && isFelix(item)) openNodes.add('felix');
      }
      paint();
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
    const buy = e.target.closest('[data-buy]');
    if (buy && !buy.disabled) {
      e.preventDefault();
      openXrpTill(buy.dataset.buy);
      return;
    }
    const spin = e.target.closest('[data-spin], .aura-tradeshow-stage');
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

function actionFor(item, stallInfo) {
  if (isFelix(item)) {
    return {label: 'Not for sale · unlock at Felix’s photo booth', disabled: true};
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
  if (!vip()) {
    return {label: 'Join VIP to buy with XRP', disabled: true};
  }
  if (walletOwns(item.id)) {
    return {label: 'Already in your wallet', disabled: true};
  }
  if (remainingFor(item.id) <= 0) {
    return {label: 'Aura’s pile is gone · trade later', disabled: true};
  }
  if (shopHolding(item.id)) {
    return {label: 'Last copies reserved for play', disabled: true};
  }
  const xrp = formatXrp(item.id);
  return {label: xrp ? `Buy with XRP · ${xrp}` : 'Buy with XRP (get ready)', disabled: false, ready: true};
}
function claimLine(item, stallInfo) {
  if (isFelix(item)) {
    return 'Unlock a session at Felix’s Instapic Photo Booth, run the sitting, then the portrait NFT is yours. Not for sale here.';
  }
  if (MONEY.has(item.kind) || stallInfo.money) return 'Claim at Aura’s dollar till';
  const stall = stallForPrize(item);
  const host = stall?.host || 'Aura';
  const title = stall?.title || 'her booth';
  if (stall?.id === 'ticket-booth') return `Claim at Aura · ${title} · Buy with XRP (get ready)`;
  return `Play for it at ${host} · ${title} · Buy with XRP (get ready)`;
}
function playTap(item, stallInfo, stall) {
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
    const qr = buyQrSrc(id);
    if (img) {
      img.src = qr || faceSrc({asset: card.dataset.asset}, 'front');
      img.alt = auraWallet() ? 'Scan Aura’s XRP wallet to buy' : 'Scan to open Aura’s XRP till';
    }
    if (label) label.textContent = auraWallet() ? 'scan wallet' : 'scan to buy';
    return;
  }
  const face = VIEWS[Number(card.dataset.face) || 0] || 'front';
  if (img) img.src = faceSrc({asset: card.dataset.asset}, face);
  if (label) label.textContent = face;
}
function closeXrpTill() {
  const till = overlay?.querySelector('#auraXrpTill');
  if (till) till.hidden = true;
}
function openXrpTill(id) {
  if (walletOwns(id)) {
    const note = overlay?.querySelector('#auraTradeshowNote');
    if (note) note.textContent = 'Already in your wallet · one copy per guest.';
    return;
  }
  const till = overlay?.querySelector('#auraXrpTill');
  if (!till) return;
  const item = (window.PennyFeverInventoryModel?.definitions || []).find((it) => it.id === id);
  const name = item?.name || id;
  const img = till.querySelector('#auraXrpTillImg');
  const hold = till.querySelector('[data-xrp-hold]');
  const qr = buyQrSrc(id);
  if (img) {
    img.src = qr || faceSrc(item || {asset: ''}, 'front');
    img.alt = 'Buy with XRP QR';
  }
  till.querySelector('#auraXrpTillName').textContent = name;
  till.querySelector('#auraXrpTillStock').textContent = formatStock(id);
  const xrp = formatXrp(id);
  till.querySelector('#auraXrpTillPrice').textContent = auraWallet()
    ? `Scan Aura’s wallet · ${xrp || 'XRP'} · one copy per wallet.`
    : `Scan to hold this piece · ${xrp || 'XRP'} once the till is live · one copy per wallet.`;
  if (hold) hold.dataset.item = id;
  till.hidden = false;
}
function queueXrpPlace(id) {
  const item = (window.PennyFeverInventoryModel?.definitions || []).find((it) => it.id === id);
  const name = item?.name || id;
  const note = overlay?.querySelector('#auraTradeshowNote');
  if (note) {
    note.textContent = `Place held for ${name} · ${formatXrp(id) || 'XRP'} next · one copy per wallet. Play to win stays live.`;
  }
  closeXrpTill();
}
function goPlayAtStall(place) {
  closeTradeshow({stayInAlley: true});
  const world = window.PennyFeverWorld;
  if (!world) return;
  if (world.paused) world.resume();
  if ((location.hash || '').replace(/^#/, '') === HASH) location.hash = 'alley';
  world.walkTo?.(place || 'aura');
}

function isFelix(item) {
  return item.collection === 'penny-fever-vendors' || item.id === 'felix-vendor-portrait-book';
}
function albumTitle(model, id) {
  return (model?.albums || []).find((a) => a.id === id)?.title || id;
}
function itemMatches(item, stall, info) {
  if (query && !`${item.name} ${stall.host} ${stall.title} ${item.album || ''} ${item.book || ''} ${item.collection || ''}`.toLowerCase().includes(query)) return false;
  if (folder === 'all') return true;
  if (folder === 'open') return info.mintable && !MONEY.has(item.kind);
  if (folder === 'felix') return isFelix(item);
  if (folder === 'book:penny-collector-book') return !isFelix(item);
  if (folder.startsWith('stall:')) return stall.id === folder.slice(6);
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
function paintTree(nav, stallRows, books, itemsByBook, felixItems) {
  nav.replaceChildren();
  const root = document.createElement('div');
  root.className = 'aura-tradeshow-tree-root';
  root.append(treeRow('book:penny-collector-book', 'Penny collector book', {root: true}));
  if (openNodes.has('book:penny-collector-book')) {
    const bookWrap = treeKids();
    const nested = books.filter((b) => b.id !== 'penny-collector-book' && b.id !== 'felix-vendor-portrait-book');
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
function appendCards(grid, items, stall) {
  const info = stallDoor(stall);
  for (const item of items) {
    const card = document.createElement('article');
    card.className = 'aura-tradeshow-card';
    card.dataset.asset = item.asset;
    card.dataset.item = item.id;
    card.dataset.mode = 'website';
    card.dataset.face = '0';
    VIEWS.forEach((view) => { card.dataset[view] = item.turnaround || view === 'front' ? '1' : '0'; });
    const felix = isFelix(item);
    const showQr = !felix && !MONEY.has(item.kind) && !info.money;
    const chipClass = felix ? 'is-felix' : (MONEY.has(item.kind) || info.money ? 'is-money' : (info.mintable ? 'is-open' : 'is-coming'));
    const chipText = felix ? 'Photo booth' : (MONEY.has(item.kind) || info.money ? 'Dollars' : (info.mintable ? 'Open' : 'Coming'));
    const act = actionFor(item, info);
    const play = playTap(item, info, stall);
    card.innerHTML = `
      <div class="aura-tradeshow-stage" data-spin="1" title="Tap to spin"><img alt="" draggable="false" src="${faceSrc(item, 'front')}"></div>
      <div class="aura-tradeshow-turn">
        <button type="button" data-spin="-1" aria-label="Previous view">←</button>
        <span data-face-label>front</span>
        <button type="button" data-spin="1" aria-label="Rotate">Rotate</button>
      </div>
      <div class="aura-tradeshow-views">
        <button type="button" data-view="website" aria-pressed="true">Website</button>
        <button type="button" data-view="nft" ${showQr ? '' : 'disabled'} aria-pressed="false">${showQr ? 'NFT' : 'NFT soon'}</button>
      </div>
      <span class="chip ${chipClass}">${chipText}</span>
      <h3>${item.name}</h3>
      ${felix ? '' : `<p class="stock">${formatStock(item.id)}</p>`}
      <p class="claim">${claimLine(item, info)}</p>
      <button type="button" class="aura-tradeshow-play" data-go-stall="${play.id}">${play.label}</button>
      ${felix ? '' : `<button type="button" class="aura-tradeshow-buy${act.ready ? ' is-ready' : ''}" data-buy="${item.id}" ${act.disabled ? 'disabled' : ''}>${act.label}</button>`}`;
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
    vipEl.innerHTML = 'VIP · ' + (email || 'signed in');
  } else {
    vipEl.innerHTML = `<a href="${vipJoin()}">Join VIP</a> to mint and buy. Looking is open.`;
  }
  overlay.querySelector('#auraTradeshowNote').textContent = folder === 'felix' || (folder.startsWith('item:') && isFelix((window.PennyFeverInventoryModel?.definitions || []).find((it) => it.id === folder.slice(5)) || {}))
    ? 'Portraits unlock at Felix’s photo booth after a paid session. They are not for sale here.'
    : 'Expand the Penny collector book for books and albums, then their items. Open stalls and Felix sit underneath.';
  overlay.querySelectorAll('.aura-tradeshow-tools [data-folder]').forEach((b) => {
    const id = b.dataset.folder;
    const on = folder === id
      || (id === 'open' && folder.startsWith('stall:'))
      || (id === 'felix' && folder.startsWith('item:') && isFelix((window.PennyFeverInventoryModel?.definitions || []).find((it) => it.id === folder.slice(5)) || {}))
      || (id === 'book:penny-collector-book' && (folder.startsWith('book:') || folder.startsWith('item:')));
    b.setAttribute('aria-pressed', String(on && !(id === 'book:penny-collector-book' && folder === 'felix')));
  });

  const model = window.PennyFeverInventoryModel;
  const items = model?.definitions || [];
  const books = model?.books || [];
  const bookIds = new Set(books.map((b) => b.id));
  const stallGroups = new Map();
  const itemsByBook = new Map();
  const felixItems = [];
  for (const stall of stalls) {
    if (stall.extra && stall.id !== 'ticket-booth') continue;
    stallGroups.set(stall.id, {stall, items: []});
  }
  for (const item of items) {
    const stall = stallForPrize(item);
    const key = stall?.id || 'ticket-booth';
    if (!stallGroups.has(key)) stallGroups.set(key, {stall: stall || {id: key, host: 'Aura', title: 'Collection'}, items: []});
    stallGroups.get(key).items.push(item);
    if (isFelix(item)) {
      felixItems.push(item);
      continue;
    }
    if (bookIds.has(item.id)) continue;
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

  paintTree(overlay.querySelector('#auraTradeshowTree'), stallRows, books, itemsByBook, felixItems);

  const body = overlay.querySelector('#auraTradeshowBody');
  body.replaceChildren();
  const byStall = folder === 'open' || folder.startsWith('stall:');
  const sections = byStall
    ? stallRows.map((row) => {
      const info = stallDoor(row.stall);
      return {
        title: `${row.stall.host} · ${row.stall.title}`,
        line: info.money ? 'Dollar till' : (info.mintable ? 'Open · mintable' : 'Coming'),
        items: row.items,
        stall: row.stall,
      };
    })
    : (folder === 'felix'
      ? [{title: 'Felix’s Instapic Photo Booth', line: 'Unlock with a photo session', items: felixItems, stall: stallById('snap')}]
      : books
        .filter((b) => b.id !== 'felix-vendor-portrait-book')
        .map((b) => ({
          title: b.title,
          line: b.kicker || 'Book',
          items: itemsByBook.get(b.id) || [],
          stall: stallForPrize((itemsByBook.get(b.id) || [])[0]) || stallById('ticket-booth'),
        })).concat(folder === 'all' ? [{title: 'Felix’s Instapic Photo Booth', line: 'Unlock with a photo session', items: felixItems, stall: stallById('snap')}] : []));
  for (const section of sections) {
    const shown = section.items.filter((item) => itemMatches(item, stallForPrize(item) || section.stall, stallDoor(stallForPrize(item) || section.stall)));
    if (!shown.length) continue;
    const wrap = document.createElement('section');
    wrap.className = 'aura-tradeshow-stall';
    wrap.innerHTML = `<h2>${section.title}</h2><p>${section.line} · ${shown.length} piece${shown.length === 1 ? '' : 's'}</p>`;
    const grid = document.createElement('div');
    grid.className = 'aura-tradeshow-grid';
    appendCards(grid, shown, section.stall);
    wrap.append(grid);
    body.append(wrap);
  }
}

export function openTradeshow() {
  if (tradeshowBlocked()) return false;
  ensureOverlay();
  const world = window.PennyFeverWorld;
  resumeWorld = !!(world?.started && !world.paused && document.body.classList.contains('is-in-world'));
  if (resumeWorld) world.pause();
  document.body.classList.add('aura-tradeshow-open');
  overlay.hidden = false;
  loadStock().then(paint);
  Promise.all([loadStock(), loadPlates()]).then(paint);
  paint();
  overlay.querySelector('#auraTradeshowClose').focus();
  return true;
}

export function closeTradeshow(opts = {}) {
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  closeXrpTill();
  document.body.classList.remove('aura-tradeshow-open');
  if (resumeWorld && document.body.classList.contains('is-in-world')) {
    window.PennyFeverWorld?.resume();
  }
  resumeWorld = false;
  if (!opts.stayInAlley && (location.hash || '').replace(/^#/, '') === HASH) location.hash = 'booth';
}

export function tradeshowSign() {
  return parkSign(SHOW_ID, 'Aura');
}

loadStock();
loadPlates();
window.AuraTradeshow = {open: openTradeshow, close: closeTradeshow, status: tradeshowStatus};

try {
  const q = new URLSearchParams(location.search);
  const fromHash = () => (location.hash || '').replace(/^#/, '') === HASH;
  const buyId = String(q.get('buy') || '').trim();
  if (q.get('tradeshow') === '1' || fromHash() || buyId) {
    const boot = () => {
      if (tradeshowBlocked()) return;
      if (!openTradeshow()) return;
      if (buyId) loadStock().then(() => openXrpTill(buyId));
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 600));
    else setTimeout(boot, 600);
  }
} catch {}
