const DB = 'penny-fever-paid-nft-basket-v1';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const ID = /^[a-z0-9-]+$/;

export function xrpToBasketDrops(value) {
  const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(String(value));
  if (!match) return null;
  const drops = BigInt(match[1]) * 1000000n + BigInt((match[2] || '').padEnd(6, '0'));
  return drops > 0n ? drops : null;
}
export function basketXrp(drops) {
  const amount = BigInt(drops), fraction = String(amount % 1000000n).padStart(6, '0').replace(/0+$/, '');
  return String(amount / 1000000n) + (fraction ? '.' + fraction : '');
}

function cleanCart(value, account) {
  const rows = new Map();
  if (value?.account === account && Array.isArray(value.rows)) {
    for (const row of value.rows.slice(0, 50)) {
      if (ID.test(row?.item) && Number.isInteger(row.quantity) && row.quantity >= 1 && row.quantity <= 8) rows.set(row.item, {item: row.item, quantity: row.quantity});
    }
  }
  const pending = value?.account === account && value.pending;
  return {account, rows: [...rows.values()], revision: Number.isSafeInteger(value?.revision) ? value.revision : 0,
    pending: pending && UUID.test(pending.operation) && ID.test(pending.item)
      && Number.isInteger(pending.quantity) && pending.quantity >= 1 && pending.quantity <= 8
      ? {operation: pending.operation, item: pending.item, quantity: pending.quantity} : null};
}

// These are account-scoped purchase intentions. Only Mother authorises payment,
// stock, wallet limits, minting and receipt completion.
function cartStore() {
  let opening;
  const database = () => opening ||= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('carts', {keyPath: 'account'});
    request.onsuccess = () => resolve(request.result);
    request.onerror = request.onblocked = () => reject(Error('Your basket could not be saved. Try again before paying.'));
  });
  return async (account, change = null) => {
    const db = await database();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('carts', change ? 'readwrite' : 'readonly');
      const store = transaction.objectStore('carts');
      const request = store.get(account);
      let result, failure;
      request.onsuccess = () => {
        try {
          result = cleanCart(request.result, account);
          if (change) { result = cleanCart(change(result), account); result.revision++; store.put(result); }
        } catch (error) { failure = error; transaction.abort(); }
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = transaction.onabort = () => reject(failure || Error('Your basket could not be saved. Try again before paying.'));
    });
  };
}

export function mountPaidNftBasket(overlay, context) {
  const store = cartStore();
  let account = '', cart = {rows: [], pending: null}, generation = 0, busy = false, active = false;
  let approvedChoices = new Map(), skipped = new Map(), lastQuote = '', message = '';
  let retryAllowed = false;
  let journey = null;
  const button = document.createElement('button');
  button.type = 'button'; button.dataset.nftPaidBasket = ''; button.textContent = 'Paid basket (0)';
  overlay.querySelector('.aura-collection-actions').append(button);
  const panel = document.createElement('div'); panel.className = 'aura-xrp-till'; panel.hidden = true;
  panel.dataset.nftPaidBasketPanel = '';
  const card = document.createElement('section'); card.className = 'aura-xrp-till-card aura-paid-basket-card';
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-labelledby', 'auraPaidBasketTitle');
  const title = document.createElement('h2'); title.id = 'auraPaidBasketTitle'; title.textContent = 'Paid NFT basket';
  const note = document.createElement('p'); note.textContent = 'Use this VIP’s linked wallet. Adding to this basket reserves no stock. You approve each NFT type in Xaman. Earned rewards stay in Mint Rewards.';
  const rows = document.createElement('div'); rows.dataset.nftPaidBasketRows = '';
  const total = document.createElement('p'); total.dataset.nftPaidBasketTotal = '';
  const status = document.createElement('p'); status.dataset.nftPaidBasketStatus = ''; status.setAttribute('role', 'status');
  const checkout = document.createElement('button'); checkout.type = 'button'; checkout.dataset.nftPaidBasketCheckout = '';
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel checkout'; cancel.dataset.nftPaidBasketCancel = ''; cancel.hidden = true;
  const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Back to Tradeshow'; close.dataset.nftPaidBasketClose = '';
  card.append(title, note, rows, total, status, checkout, cancel, close); panel.append(card); overlay.append(panel);
  const valid = (owner, revision) => owner === context.account() && owner === account && revision === generation && !overlay.hidden;
  const errorMessage = error => error?.message || 'Paid checkout is paused. Your basket is saved.';

  function quote(state = cart) {
    return state.rows.map(row => {
      const info = context.info(row.item) || {};
      const drops = xrpToBasketDrops(info.price);
      const available = !!info.available && !!drops && row.quantity <= Math.min(8, Number(info.max) || 0);
      return {...row, info, drops, available, reason: skipped.get(row.item) || info.reason || (!available ? 'Quantity is unavailable at checkout.' : '')};
    });
  }
  const fingerprint = lines => JSON.stringify(lines.map(row => [row.item, row.quantity, row.drops?.toString(), row.available]));
  async function load() {
    const owner = context.account(), revision = generation;
    if (!owner) return false;
    const state = await store(owner);
    if (!valid(owner, revision)) return false;
    cart = state; return true;
  }
  async function update(owner, revision, change) {
    const state = await store(owner, change);
    if (!valid(owner, revision)) return false;
    cart = state; return true;
  }
  function paint() {
    button.hidden = !context.account();
    button.textContent = `Paid basket (${cart.rows.reduce((sum, row) => sum + row.quantity, 0)})`;
    button.disabled = busy;
    if (panel.hidden) return;
    const lines = quote(); rows.replaceChildren();
    for (const row of lines) {
      const entry = document.createElement('div'); entry.className = 'aura-paid-basket-row'; entry.dataset.basketItem = row.item;
      const label = document.createElement('strong'); label.textContent = row.info.name || row.item;
      const price = document.createElement('span'); price.textContent = row.drops ? `${basketXrp(row.drops)} XRP each` : 'Price unavailable';
      const quantity = document.createElement('input'); quantity.type = 'number'; quantity.min = '1'; quantity.max = '8'; quantity.step = '1'; quantity.value = String(row.quantity);
      quantity.setAttribute('aria-label', `Quantity for ${row.info.name || row.item}`); quantity.dataset.basketQuantity = row.item;
      quantity.disabled = busy || !!cart.pending;
      quantity.addEventListener('change', () => edit(row.item, Number(quantity.value)));
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove'; remove.dataset.basketRemove = row.item;
      remove.disabled = busy || !!cart.pending; remove.addEventListener('click', () => edit(row.item, 0));
      const availability = document.createElement('small'); availability.textContent = row.reason || (row.available ? 'Stock checked again at purchase.' : 'Unavailable');
      entry.append(label, price, quantity, remove, availability); rows.append(entry);
    }
    if (!lines.length) { const empty = document.createElement('p'); empty.textContent = journey?.finished ? 'Your purchased NFTs are in your linked wallet.' : 'Choose a quantity and add paid NFTs from the shelf.'; rows.append(empty); }
    const sum = lines.filter(row => row.available && !skipped.has(row.item)).reduce((amount, row) => amount + row.drops * BigInt(row.quantity), 0n);
    total.textContent = `Paid total: ${basketXrp(sum)} XRP + network fees`;
    status.textContent = message;
    checkout.textContent = cart.pending ? (retryAllowed ? 'Retry saved checkout' : 'Resume Checkout') : 'Checkout paid NFTs';
    checkout.title = cart.pending ? 'Resume the saved purchase, then continue the remaining reviewed basket.' : 'Continue through the reviewed basket automatically after each receipt.';
    checkout.disabled = busy || (!cart.pending && !lines.some(row => row.available && !skipped.has(row.item)));
    cancel.hidden = !cart.pending;
    cancel.disabled = busy;
    lastQuote = fingerprint(lines);
  }
  async function edit(item, quantity, adding = false) {
    const owner = context.account(), revision = generation;
    if (!owner) return;
    if (busy || cart.pending) { panel.hidden = false; message = 'Finish or resume your existing paid checkout first.'; paint(); return; }
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 8) { panel.hidden = false; message = 'Choose a whole quantity from 1 to 8.'; paint(); return; }
    try {
      if (!await update(owner, revision, state => {
        if (state.pending) throw Error('Finish the existing paid checkout before changing the basket.');
        const found = state.rows.find(row => row.item === item);
        if (adding) {
          const info = context.info(item);
          if (!info?.available || quantity < 1 || quantity > info.max) throw Error('That quantity is not available for paid checkout.');
        }
        if (!quantity) state.rows = state.rows.filter(row => row.item !== item);
        else if (found) found.quantity = quantity;
        else if (state.rows.length < 50) state.rows.push({item, quantity});
        else throw Error('The basket is full. Finish or remove an item first.');
        return state;
      })) return;
      journey = null; skipped.delete(item); message = adding ? 'Added to paid basket. Stock is not reserved.' : 'Basket updated.'; paint();
    } catch (error) { if (valid(owner, revision)) { panel.hidden = false; message = errorMessage(error); paint(); } }
  }
  async function open() {
    const owner = context.account(); if (!owner) return;
    context.pause(); active = false; skipped.clear(); panel.hidden = false; message = 'Checking prices and availability…';
    busy = true; paint(); const revision = generation;
    try { await context.refresh(); if (valid(owner, revision)) await load(); }
    catch (error) { if (valid(owner, revision)) message = errorMessage(error); }
    finally { if (valid(owner, revision)) { busy = false; if (message === 'Checking prices and availability…') message = cart.pending ? 'Resume the saved purchase, then continue the remaining basket shown here. Completed payments will not be charged again.' : 'Tradeshow will guide you through each NFT type automatically. Approve the requests in Xaman and return here.'; paint(); close.focus(); } }
  }
  function showProgress(item) {
    if (!journey) return;
    const index = journey.items.findIndex(row => row.item === item);
    const row = journey.items[index];
    if (row) context.guide?.({name: row.name, quantity: row.quantity, position: index + 1,
      total: journey.items.length, received: journey.received});
  }
  async function advance() {
    if (!active || busy || !context.account() || overlay.hidden) return;
    const owner = account, revision = generation;
    busy = true; paint();
    try {
      await context.refresh(); if (!valid(owner, revision)) return;
      if (!await load()) return;
      if (cart.pending) { active = false; panel.hidden = false; context.finish?.(); message = 'Resume your existing paid checkout first.'; return; }
      const lines = quote();
      for (const row of lines) {
        if (!row.available) skipped.set(row.item, row.reason || 'Unavailable at checkout. Skipped.');
        if (row.available && approvedChoices.get(row.item) !== `${row.drops}:${row.quantity}`) {
          active = false; panel.hidden = false; context.finish?.(); message = 'A price or basket selection changed. Review the total before checking out again.'; return;
        }
      }
      const next = lines.find(row => row.available && !skipped.has(row.item));
      if (!next) {
        active = false; panel.hidden = false;
        if (journey) journey.finished = true;
        context.finish?.();
        message = `Basket finished · ${journey?.received || 0} NFTs received.`
          + (skipped.size ? ' Unavailable items remain in the basket for review.' : '');
        return;
      }
      const operation = crypto.randomUUID();
      if (!await update(owner, revision, state => {
        if (state.pending) return state;
        const saved = state.rows.find(row => row.item === next.item);
        if (!saved || saved.quantity !== next.quantity) throw Error('The basket changed. Review it before paying.');
        state.pending = {operation, item: next.item, quantity: next.quantity}; return state;
      })) return;
      if (cart.pending.operation !== operation) { active = false; panel.hidden = false; message = 'Another paid checkout is waiting. Resume that original request.'; return; }
      panel.hidden = true; retryAllowed = false;
      showProgress(next.item);
      context.purchase(next.item, next.quantity, operation);
    } catch (error) { if (valid(owner, revision)) { active = false; panel.hidden = false; message = errorMessage(error); } }
    finally { if (valid(owner, revision)) { busy = false; paint(); } }
  }
  async function start() {
    if (busy) return;
    const owner = context.account(), revision = generation;
    if (!owner) return;
    busy = true; paint(); const previous = lastQuote;
    try {
      await context.refresh(); if (!valid(owner, revision) || !await load()) return;
      const lines = quote();
      if (lines.some(row => row.available && skipped.has(row.item))) {
        for (const row of lines) if (row.available) skipped.delete(row.item);
        message = 'Availability changed. Review the updated total before paying.'; return;
      }
      if (previous !== fingerprint(lines)) { message = 'Availability or prices changed. Review the updated basket and total.'; return; }
      approvedChoices = new Map(lines.filter(row => row.available).map(row => [row.item, `${row.drops}:${row.quantity}`]));
      skipped = new Map(lines.filter(row => !row.available).map(row => [row.item, row.reason || 'Unavailable. Skipped.']));
      const choices = lines.filter(row => row.available || row.item === cart.pending?.item);
      if (cart.pending) choices.sort((a, b) => Number(b.item === cart.pending.item) - Number(a.item === cart.pending.item));
      journey = {items: choices.map(row => ({item: row.item, quantity: row.quantity, name: row.info.name || row.item})), received: 0, operations: new Set(), finished: false};
      active = true; message = '';
      if (cart.pending) {
        if (retryAllowed) {
          const info = context.info(cart.pending.item);
          if (!info?.available || cart.pending.quantity > info.max) {
            const operation = cart.pending.operation;
            if (!await update(owner, revision, state => { if (state.pending?.operation === operation) state.pending = null; return state; })) return;
            active = false; retryAllowed = false; message = 'That saved selection is unavailable. Review the basket before paying.'; return;
          }
        }
        panel.hidden = true; showProgress(cart.pending.item);
        if (retryAllowed) context.purchase(cart.pending.item, cart.pending.quantity, cart.pending.operation);
        else context.resume(cart.pending.operation);
      }
    } catch (error) { if (valid(owner, revision)) { active = false; panel.hidden = false; message = errorMessage(error); } }
    finally { if (valid(owner, revision)) { busy = false; paint(); if (active && !cart.pending) advance(); } }
  }
  async function checkoutStatus(data) {
    const owner = context.account(), revision = generation;
    if (!owner || data.kind !== 'purchase') return;
    try {
      const current = await store(owner);
      if (!valid(owner, revision) || current.pending?.operation !== data.operation || current.pending.quantity !== data.quantity) return;
      cart = current;
      if (data.received >= current.pending.quantity) {
        const completedItem = current.pending.item;
        let applied = false;
        if (!await update(owner, revision, state => {
          if (state.pending?.operation !== data.operation) return state;
          applied = true;
          const row = state.rows.find(row => row.item === state.pending.item);
          if (row) row.quantity = Math.max(0, row.quantity - state.pending.quantity);
          state.rows = state.rows.filter(row => row.quantity > 0); state.pending = null; return state;
        })) return;
        if (!applied) return;
        skipped.delete(completedItem);
        if (journey && !journey.operations.has(data.operation)) { journey.operations.add(data.operation); journey.received += data.quantity; }
        message = `${data.quantity} paid NFTs received.`; retryAllowed = false; paint();
        if (active) setTimeout(advance, 0);
      } else if (['cancelled', 'expired'].includes(data.state)) {
        active = false;
        if (data.can_restart === true) {
          if (!await update(owner, revision, state => { if (state.pending?.operation === data.operation) state.pending = null; return state; })) return;
          message = 'Unsigned checkout closed. Your basket is kept for another attempt.';
        } else if (!data.prepared && !data.received) {
          message = 'This paid checkout closed. Use Resume Checkout to check its receipts before buying again.';
        } else message = 'Purchased NFTs still need receiving. Resume the original checkout.';
        paint();
      }
    } catch (error) { if (valid(owner, revision)) { active = false; message = errorMessage(error); paint(); } }
  }
  async function checkoutError(error) {
    if (error.operation !== cart.pending?.operation || account !== context.account()) return;
    if (['status', 'receipt'].includes(error.phase)
      && ['batch_receipt_pending', 'ledger_unavailable', 'xaman_status'].includes(error.code)) {
      message = 'Waiting for confirmation. Tradeshow will continue this basket automatically.'; paint(); return;
    }
    if (error.phase === 'create' && error.code === 'batch_already_pending') {
      const owner = account, revision = generation;
      active = false;
      try {
        if (!await update(owner, revision, state => { if (state.pending?.operation === error.operation) state.pending = null; return state; })) return;
        panel.hidden = false; message = 'An existing checkout needs finishing. Use Resume Checkout before buying again.'; paint();
      } catch (failure) { if (valid(owner, revision)) { panel.hidden = false; message = errorMessage(failure); paint(); } }
      return;
    }
    if (error.phase === 'create' && ['sold_out', 'item_not_for_sale', 'wallet_cap_reached'].includes(error.code)) {
      const owner = account, revision = generation, item = cart.pending.item;
      try {
        if (!await update(owner, revision, state => { if (state.pending?.operation === error.operation) state.pending = null; return state; })) return;
        skipped.set(item, error.message || 'Unavailable at checkout. Skipped.'); paint();
        if (active) setTimeout(advance, 0);
      } catch (failure) { if (valid(owner, revision)) { active = false; message = errorMessage(failure); paint(); } }
      return;
    }
    active = false; retryAllowed = error.code === 'batch_order_not_found'; message = error.message || 'Checkout paused. Resume the original request.'; paint();
  }
  function closePanel() { panel.hidden = true; active = false; paint(); button.focus(); }
  button.addEventListener('click', open); checkout.addEventListener('click', start); close.addEventListener('click', closePanel);
  cancel.addEventListener('click', () => {
    if (busy || panel.hidden || !cart.pending || account !== context.account()) return;
    active = false; panel.hidden = true;
    context.cancel(cart.pending.operation);
  });
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closePanel(); }
    if (event.key !== 'Tab') return;
    const controls = [...card.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
    const index = controls.indexOf(document.activeElement); event.preventDefault(); event.stopPropagation();
    controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus();
  });
  return {
    open, checkoutStatus, checkoutError,
    async continueSaved(operation) {
      const owner = context.account(), revision = generation;
      if (!await load() || !valid(owner, revision) || !journey || journey.finished || !approvedChoices.size) return;
      if (cart.pending && cart.pending.operation !== operation) return;
      if (!cart.pending && !journey.operations.has(operation)) return;
      active = true;
      if (!cart.pending) setTimeout(advance, 0);
    },
    async select(item) {
      const owner = context.account(), revision = generation;
      await open();
      if (valid(owner, revision) && !busy && !cart.pending && !cart.rows.some(row => row.item === item)) {
        await edit(item, 1, true);
      }
    },
    async resumeIfPending() {
      try {
        if (!await load() || !cart.pending) return false;
        await open(); return true;
      } catch { return false; }
    },
    paused() { active = false; },
    isOpen: () => !panel.hidden,
    close() { panel.hidden = true; active = false; generation++; busy = false; },
    controls(item) {
      const info = context.info(item);
      if (!info?.available) return null;
      const wrapper = document.createElement('div'); wrapper.className = 'aura-paid-basket-add';
      const label = document.createElement('label'); label.textContent = 'Qty ';
      const quantity = document.createElement('input'); quantity.type = 'number'; quantity.min = '1'; quantity.max = String(Math.min(8, info.max)); quantity.step = '1'; quantity.value = '1'; quantity.dataset.nftPaidQuantity = item;
      quantity.setAttribute('aria-label', `Paid quantity for ${info.name}`);
      const add = document.createElement('button'); add.type = 'button'; add.textContent = 'Add to basket'; add.dataset.nftPaidAdd = item;
      add.addEventListener('click', () => edit(item, Number(quantity.value), true));
      label.append(quantity); wrapper.append(label, add); return wrapper;
    },
    paint() {
      const owner = context.account();
      if (owner !== account) { account = owner; generation++; active = false; busy = false; cart = {rows: [], pending: null}; panel.hidden = true; skipped.clear(); approvedChoices.clear(); message = ''; retryAllowed = false; journey = null; }
      paint();
    },
    refresh() {
      const owner = context.account(), revision = generation;
      if (!owner) return;
      load().then(async loaded => {
        if (!loaded || !valid(owner, revision)) return;
        paint();
        const pending = cart.pending;
        if (!pending) return;
        try {
          const receipt = await context.receipt(pending.operation);
          if (valid(owner, revision)) await checkoutStatus(receipt);
        } catch (error) {
          if (valid(owner, revision)) checkoutError({operation: pending.operation, code: error.code, message: errorMessage(error), phase: 'receipt'});
        }
      }).catch(error => { if (valid(owner, revision)) { message = errorMessage(error); paint(); } });
    },
  };
}
