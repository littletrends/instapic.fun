import {paintEconomy, paintLedgerRequirements, paintTradeshowPurse} from './token-economy.js?v=bank-purse-1';
import {qrDataUrl} from './qrcode-generator.js?v=nft-host-11';

const API = 'https://motherpc.taild1a44c.ts.net/api/penny-fever/verified/tokens';
const FINISHED = new Set(['complete', 'verified', 'rejected', 'expired', 'not_filled', 'preflight_failed']);
const MESSAGES = {
  token_checkout_not_open: 'Wallet connection is not open yet. Please try again later.',
  token_sales_not_open: 'Token purchases are not open yet.',
  token_bundle_unavailable: 'That bundle is not available from Aura’s stock right now.',
  vip_signin_required: 'Please sign into VIP again.',
  resume_existing_token_request: 'Finish or check your existing token request first.',
  token_request_needs_review: 'This request needs checking. No replacement payment has been started.',
  token_receipt_pending: 'Waiting for the ledger to confirm. Keep this request and check again.',
  token_status_busy: 'Your request is already being checked. Please wait a moment.',
  token_request_rate_limited: 'Please wait a moment before checking again.',
  different_paying_wallet: 'Use the wallet connected to this VIP account.',
  mainnet_wallet_required: 'Choose XRPL Mainnet in Xaman.',
  insufficient_xrp_after_reserve: 'The wallet needs enough XRP for the purchase, network fee and wallet reserve.',
  finish_token_request_before_disconnect: 'Finish or check the pending request before disconnecting.',
  wallet_signin_session_changed: 'That wallet sign-in belongs to an earlier VIP login. Wait for it to expire, then connect again.',
  invalid_token_quantity: 'Enter a whole-token quantity greater than zero.',
  token_batch_needs_review: 'The grouped trade needs checking. No replacement purchase has been started.',
  token_backing_needs_review: 'Token custody needs checking. Your signed request is saved; no duplicate deposit has been started.',
  insufficient_verified_tokens: 'Your VIP token purse does not yet contain the required tokens.',
  token_redemption_not_open: 'Token trading is not open yet. Nothing was spent.',
  insufficient_wallet_tokens: 'Your connected Xaman wallet does not contain that many tokens.',
  token_treasury_line_full: 'Aura cannot receive that token quantity right now. No deposit request was created.',
  token_transfer_fee_not_supported: 'This token’s transfer settings need checking before deposits can open.',
  wallet_already_has_reward: 'That wallet already has this reward or has used its reward mint. No tokens were spent.',
  token_reward_supply_unavailable: 'No unreserved copy of this reward is available. No tokens were spent.',
};

function identity() {
  const provider = window.InstapicGuestIdentity;
  if (!provider?.isVerifiedSessionActive?.()) return null;
  const record = provider.read();
  return {email: String(record.email || '').trim().toLowerCase(), token: String(record.session_token || '')};
}

function attach(overlay) {
  if (overlay.dataset.tokenWalletMounted) return;
  overlay.dataset.tokenWalletMounted = 'true';
  const entry = document.createElement('button');
  entry.type = 'button'; entry.textContent = 'Wallet / Tokens'; entry.dataset.tokenWalletOpen = '';
  const purseSummary = document.createElement('div'); purseSummary.className = 'aura-tradeshow-purse-summary';
  purseSummary.setAttribute('role', 'region'); purseSummary.setAttribute('aria-label', 'Your game purse');
  overlay.querySelector('.aura-tradeshow-bar')?.append(purseSummary);
  const actions = overlay.querySelector('.aura-collection-actions');
  if (actions) actions.prepend(entry); else overlay.querySelector('.aura-tradeshow-tools')?.prepend(entry);
  const panel = document.createElement('div');
  panel.className = 'aura-xrp-till aura-token-panel'; panel.hidden = true;
  panel.dataset.tokenWalletPanel = '';
  panel.innerHTML = `<section class="aura-xrp-till-card aura-token-wallet-card" role="dialog" aria-modal="true" aria-labelledby="auraTokenWalletTitle">
    <button type="button" class="aura-xrp-till-close" data-token-close aria-label="Back to Tradeshow">×</button>
    <h2 id="auraTokenWalletTitle">Wallet &amp; tokens</h2>
    <p data-token-address></p>
    <div class="aura-token-actions"><button type="button" data-token-connect>Connect Xaman</button><button type="button" data-token-refresh>Check wallet</button><button type="button" data-token-disconnect hidden>Disconnect</button></div>
    <p data-token-message role="status" aria-live="polite"></p>
    <progress data-token-loading aria-label="Checking wallet or preparing Xaman" hidden></progress>
    <div data-token-signing hidden><img data-token-qr alt="Scan with Xaman" width="220" height="220"><a class="aura-xrp-till-open" data-token-link target="_blank" rel="noopener noreferrer">Open in Xaman</a><button type="button" data-token-check>Check / continue</button></div>
    <div class="aura-token-pending" data-token-pending></div>
    <div class="aura-token-economy" data-token-economy></div>
    <div class="aura-token-basket" role="group" aria-label="Buy selected tokens"><button type="button" data-token-pack disabled>Select starter bundles · 42 XRP</button><button type="button" data-token-selected disabled>Buy selected</button><p data-token-total>Tick the tokens you want to buy together.</p></div>
    <p class="aura-token-wallet-note">The four starter bundles cost 42 XRP. The three special reward recipes together require 200 XRP worth of tokens at Aura’s rates. Buying tokens does not claim a reward.</p>
    <div class="aura-token-grid" data-token-grid></div>
    <p class="aura-token-wallet-note" data-token-transfer-note>These are tokens held in your XRPL wallet. Game purse transfers are not open yet. Purchases exchange XRP for tokens on the XRPL, up to the displayed price; network fees and wallet reserves are separate.</p>
    <button type="button" data-token-close>← Back to Tradeshow</button>
  </section>`;
  overlay.append(panel);
  const find = selector => panel.querySelector(selector);
  const message = find('[data-token-message]'), loading = find('[data-token-loading]');
  const grid = find('[data-token-grid]'), signing = find('[data-token-signing]');
  let owner = null, revision = 0, busy = false, operation = '', timer = 0, controller = null;
  let checking = false;
  const choices = new Map();
  let catalogue = [];
  let requestedItem = '';
  let overviewData = null, overviewOwner = null, overviewController = null, overviewAttempted = false;
  const sameOwner = other => !!other && other.email === identity()?.email && other.token === identity()?.token;
  function addShortcuts() {
    const data = sameOwner(overviewOwner) ? overviewData : null;
    const ready = data?.token_purse?.deposits_enabled === true && !data.token_purse.claims_check_failed;
    const bankSignature = `${ready}:${identity()?.email || ''}`;
    if (overlay.dataset.tokenBankSignature !== bankSignature) {
      overlay.dataset.tokenBankSignature = bankSignature;
      overlay.dataset.tokenBankOwner = ready ? identity().email : '';
      window.dispatchEvent(new Event('pennyfever:tokenbankready'));
    }
    paintLedgerRequirements(overlay, data);
    paintTradeshowPurse(purseSummary, data, !!identity());
  }
  async function refreshOverview() {
    const account = identity();
    if (overlay.hidden || !account || (sameOwner(overviewOwner) && overviewAttempted)) return;
    overviewController?.abort(); overviewOwner = account; overviewData = null; overviewAttempted = true;
    const requestController = overviewController = new AbortController();
    addShortcuts();
    try {
      const response = await fetch(API + '/catalogue', {method: 'POST', cache: 'no-store', redirect: 'error',
        signal: requestController.signal, headers: {'Content-Type': 'application/json', Authorization: `Bearer ${account.token}`},
        body: JSON.stringify({email: account.email})});
      const data = await response.json();
      if (response.ok && data?.ok === true && !overlay.hidden && sameOwner(account) && requestController === overviewController) {
        overviewData = data; addShortcuts();
      }
    } catch { /* Existing claims remain usable if the ledger cannot be reached. */ }
    if (!overviewData && !overlay.hidden && sameOwner(account) && requestController === overviewController) { overviewData = {unavailable: true}; addShortcuts(); }
  }
  overlay.addEventListener('click', event => {
    const button = event.target.closest('[data-economy-shortcut]');
    if (!button) return;
    event.preventDefault(); requestedItem = button.dataset.economyShortcut; entry.click();
  });
  new MutationObserver(addShortcuts).observe(overlay, {childList: true, subtree: true});
  addShortcuts();
  window.addEventListener('pennyfever:statechange', addShortcuts);
  panel.addEventListener('click', event => {
    if (!event.target.closest('[data-token-entrance]')) return;
    const entrance = document.getElementById('pfWorldLeave');
    if (!entrance) { message.textContent = 'Return to the alley to visit Aura’s entrance booth.'; return; }
    close(); window.AuraTradeshow?.close?.({stayInAlley: true}); entrance.click();
  });
  function xrp(drops) {
    const amount = BigInt(drops);
    const fraction = String(amount % 1000000n).padStart(6, '0').replace(/0+$/, '');
    return String(amount / 1000000n) + (fraction ? '.' + fraction : '');
  }
  function selectedItems() {
    return catalogue.filter(token => choices.get(token.item)?.checked).map(token => {
      const text = choices.get(token.item).quantity;
      if (!/^[0-9]{1,15}$/.test(text)) throw Error('Enter a whole-token quantity greater than zero.');
      const units = Number(text);
      if (!Number.isSafeInteger(units) || units < 1 || units > token.quantity_limit) throw Error('Enter a valid whole-token quantity.');
      if (units > token.available_units) throw Error(`${token.name}: that quantity is not available right now.`);
      return {item: token.item, units};
    });
  }
  function paintBasket() {
    const buy = find('[data-token-selected]'), total = find('[data-token-total]');
    try {
      const items = selectedItems();
      const drops = items.reduce((sum, row) => sum + BigInt(row.units) * BigInt(catalogue.find(token => token.item === row.item).drops_per_unit), 0n);
      buy.disabled = busy || !!operation || !items.length;
      buy.textContent = items.length ? `Buy selected (${items.length})` : 'Buy selected';
      total.textContent = items.length ? `Maximum ${xrp(drops)} XRP + network fee. One grouped approval; receiving lines are included if needed.` : 'Tick the tokens you want to buy together.';
    } catch (error) { buy.disabled = true; total.textContent = error.message; }
  }
  const valid = version => version === revision && !panel.hidden && !overlay.hidden
    && owner?.email === identity()?.email && owner?.token === identity()?.token;
  function unlink() {
    signing.hidden = true;
    const link = find('[data-token-link]'), qr = find('[data-token-qr]');
    link.removeAttribute('href'); qr.removeAttribute('src');
    link.hidden = qr.hidden = true;
  }
  function close() {
    clearTimeout(timer); controller?.abort(); revision++; busy = checking = false;
    panel.hidden = true; operation = ''; owner = null; requestedItem = ''; unlink(); entry.focus();
  }
  function fail(error) { message.textContent = error.message; loading.hidden = true; }
  async function post(path, body, version) {
    if (!valid(version)) throw Error('Please open your current VIP wallet again.');
    const response = await fetch(API + path, {method: 'POST', cache: 'no-store', redirect: 'error',
      signal: controller.signal, headers: {'Content-Type': 'application/json', Authorization: `Bearer ${owner.token}`},
      body: JSON.stringify({email: owner.email, ...body})});
    const data = await response.json();
    if (!response.ok || data?.ok !== true) throw Object.assign(Error(MESSAGES[data?.error] || 'Could not check this token request. Please try Check / continue.'), {code: data?.error});
    return data;
  }
  function showRequest(data) {
    clearTimeout(timer);
    operation = data.id;
    unlink();
    signing.hidden = false; // Check / continue remains usable while the original request is recovered.
    if (typeof data.deep_link === 'string' && /^https:\/\/(?:xumm|xaman)\.app\/sign\/[0-9a-f-]{36}$/.test(data.deep_link)) {
      find('[data-token-link]').href = data.deep_link;
      find('[data-token-qr]').src = qrDataUrl(data.deep_link, 5, 8);
      find('[data-token-link]').hidden = find('[data-token-qr]').hidden = false;
    }
    loading.hidden = true;
    message.textContent = data.kind === 'connect' ? 'Choose your wallet on XRPL Mainnet and approve SignIn. This costs no XRP.'
      : data.kind === 'deposit' ? 'Review this token transfer to your VIP token purse in Xaman. Withdrawals are closed. Network fee only. Return here after approval; the purse updates after ledger verification.'
      : data.kind === 'trust' ? 'Approve the receiving line in Xaman. A network fee applies and XRP is held as wallet reserve; no tokens are purchased.'
      : 'Review the token quantity and maximum XRP price in Xaman. Tokens and payment exchange together. Return here after approval.';
    if (['preparing', 'creating_payload', 'recovering'].includes(data.state)) {
      message.textContent = 'Checking your original Xaman request. No replacement purchase will be started. Please wait or press Check / continue.';
    }
    if (FINISHED.has(data.state)) {
      clearTimeout(timer); unlink(); operation = '';
      message.textContent = data.state === 'verified' ? 'Wallet connected.' : data.state === 'complete'
        ? data.kind === 'deposit' ? `${Number(data.banked_units).toLocaleString('en-AU')} tokens added to your VIP token purse.`
        : data.kind === 'basket' ? 'Received ' + (data.received || []).map(row => `${Number(row.units).toLocaleString('en-AU')} ${catalogue.find(token => token.item === row.item)?.name || row.item}`).join(', ') + '.'
        : data.kind === 'buy' ? `${Number(data.received_units).toLocaleString('en-AU')} tokens received in your wallet.` : 'Receiving line ready.'
        : data.state === 'not_filled' ? (data.kind === 'deposit' ? 'The deposit did not complete. No tokens were added to your VIP purse; the ledger network fee may still apply.' : 'The trade was not filled. No token purchase completed; the ledger network fee may still apply.')
        : data.state === 'preflight_failed' ? 'This request did not reach Xaman. Check your wallet or stock before trying again.'
        : 'The signing request was declined or expired. Check your wallet before retrying.';
      if (data.state === 'complete' && ['buy', 'basket'].includes(data.kind)) choices.clear();
      refresh(false); return;
    }
    timer = setTimeout(check, 4000);
  }
  async function check() {
    if (!operation || checking || !valid(revision)) return;
    clearTimeout(timer); const version = revision; checking = true; loading.hidden = false;
    try {
      const data = await post('/status', {operation}, version);
      if (valid(version)) showRequest(data);
    } catch (error) {
      if (!valid(version)) return;
      fail(error);
      if (['token_receipt_pending', 'token_status_busy', 'token_request_rate_limited', 'xaman_unavailable', 'token_checkout_unavailable', 'token_ledger_unavailable', 'fresh_mainnet_required'].includes(error.code)) timer = setTimeout(check, 5000);
    } finally { if (valid(version)) { checking = false; loading.hidden = true; } }
  }
  async function start(kind, item = '', bundles = 1, items = null, units = null) {
    if (busy || !valid(revision)) return;
    busy = true; const version = revision; loading.hidden = false; unlink();
    operation = crypto.randomUUID();
    message.textContent = 'Preparing your Xaman request. Please wait…';
    panel.querySelectorAll('[data-token-buy],[data-token-deposit],[data-token-claim],[data-token-trust],[data-token-connect],[data-token-selected],[data-token-pack]').forEach(button => { button.disabled = true; });
    try {
      const data = await post('/create', {operation, kind, ...(items ? {items} : units !== null ? {item, units} : item ? {item, bundles} : {})}, version);
      if (valid(version)) showRequest(data);
    } catch (error) {
      if (valid(version)) { busy = false; fail(error); await refresh(false); }
    } finally { if (valid(version)) { busy = false; paintBasket(); } }
  }
  async function refresh(announce = true) {
    const version = revision;
    if (!valid(version)) return;
    if (announce) { loading.hidden = false; message.textContent = 'Checking your connected wallet and token stock…'; }
    try {
      const data = await post('/catalogue', {}, version);
      if (!valid(version)) return;
      find('[data-token-address]').textContent = data.wallet || 'Connect the Xaman wallet you want to use for tokens.';
      find('[data-token-connect]').hidden = !!data.wallet;
      find('[data-token-connect]').disabled = false;
      find('[data-token-disconnect]').hidden = !data.wallet;
      find('.aura-token-basket').hidden = !data.wallet;
      catalogue = data.tokens || [];
      paintEconomy(find('[data-token-economy]'), data);
      find('[data-token-transfer-note]').textContent = data.token_purse
        ? 'Deposits transfer the selected token quantity into your VIP token purse for rewards. Withdrawals are closed: deposited tokens cannot currently be sent back to Xaman. A deposit costs the XRPL network fee; the XRP purchase price does not apply.'
        : 'These are tokens held in your XRPL wallet. Game purse transfers are not open yet. Purchases exchange XRP for tokens on the XRPL, up to the displayed price; network fees and wallet reserves are separate.';
      overviewController?.abort(); overviewController = null;
      overviewData = data; overviewOwner = {...owner}; overviewAttempted = true; addShortcuts();
      operation = (data.pending || []).find(row => row.id === operation)?.id || data.pending?.[0]?.id || '';
      grid.replaceChildren(); find('[data-token-pending]').replaceChildren();
      for (const pending of data.pending || []) {
        const resume = document.createElement('button'); resume.type = 'button';
        resume.textContent = 'Resume ' + (pending.kind === 'connect' ? 'wallet sign-in' : pending.kind === 'trust' ? 'receiving line' : pending.kind === 'deposit' ? 'token deposit' : 'token purchase');
        resume.addEventListener('click', () => { operation = pending.id; showRequest(pending); check(); });
        find('[data-token-pending]').append(resume);
      }
      for (const token of catalogue) {
        const card = document.createElement('article'); card.className = 'aura-token-item'; card.dataset.tokenItem = token.item;
        const image = document.createElement('img');
        if (['star-token','moon-penny','rose-penny','crown-token'].includes(token.item)) image.src = `./assets/restyle/game-sprites/pennies/${token.item}/front.webp`;
        image.alt = token.name; image.width = image.height = 96;
        const name = document.createElement('h3'); name.textContent = `${token.name} · ${token.code}`;
        const balance = document.createElement('p'); balance.textContent = `In wallet: ${Number(token.balance).toLocaleString('en-AU')}`;
        const price = document.createElement('p'); price.textContent = `${Number(token.bundle_units).toLocaleString('en-AU')} for up to ${token.bundle_xrp} XRP`;
        const stock = document.createElement('p'); stock.textContent = `Available: ${Number(token.available_units).toLocaleString('en-AU')}`;
        const choice = choices.get(token.item) || {checked: false, quantity: String(token.bundle_units)};
        choices.set(token.item, choice);
        const label = document.createElement('label'); label.className = 'aura-token-select';
        const include = document.createElement('input'); include.type = 'checkbox'; include.dataset.tokenInclude = token.item;
        include.checked = choice.checked; include.disabled = !data.sales_enabled || !token.available_units || !!data.pending?.length;
        label.append(include, document.createTextNode(' Include in basket'));
        const quantityLabel = document.createElement('label'); quantityLabel.textContent = 'Tokens ';
        const quantity = document.createElement('input'); quantity.type = 'text'; quantity.inputMode = 'numeric'; quantity.pattern = '[0-9]*';
        quantity.value = choice.quantity; quantity.maxLength = 15; quantity.dataset.tokenQuantity = token.item;
        quantity.setAttribute('aria-label', `${token.name} token quantity`); quantityLabel.append(quantity);
        const full = document.createElement('button'); full.type = 'button'; full.textContent = 'Standard bundle'; full.dataset.tokenFull = token.item;
        const cost = document.createElement('p'); cost.className = 'aura-token-cost';
        const update = () => {
          choice.quantity = quantity.value.trim(); choice.checked = include.checked;
          const validQuantity = /^[0-9]{1,15}$/.test(choice.quantity) && Number(choice.quantity) > 0 && Number(choice.quantity) <= token.quantity_limit;
          const available = validQuantity && Number(choice.quantity) <= token.available_units;
          cost.textContent = validQuantity ? `Maximum ${xrp(BigInt(choice.quantity) * BigInt(token.drops_per_unit))} XRP` : 'Enter a whole-token quantity.';
          buy.disabled = busy || !!operation || !!data.pending?.length || !data.sales_enabled || !available;
          deposit.disabled = busy || !!operation || !!data.pending?.length || data.token_purse?.deposits_enabled !== true
            || !validQuantity || Number(choice.quantity) > Number(token.balance);
          paintBasket();
        };
        const buy = document.createElement('button'); buy.type = 'button';
        buy.textContent = !data.sales_enabled ? 'Sales not open' : !token.available_units ? 'Stock unavailable' : 'Buy with XRP';
        buy.dataset.tokenBuy = token.item;
        const deposit = document.createElement('button'); deposit.type = 'button'; deposit.textContent = 'Deposit to VIP purse';
        deposit.dataset.tokenDeposit = token.item; deposit.hidden = !data.token_purse;
        deposit.addEventListener('click', () => start('deposit', token.item, 1, null, Number(choice.quantity)));
        quantity.addEventListener('input', update); include.addEventListener('change', update);
        full.addEventListener('click', () => { quantity.value = String(token.bundle_units); update(); });
        buy.addEventListener('click', () => start('basket', '', 1, [{item: token.item, units: Number(choice.quantity)}]));
        card.append(image, name, balance, price, stock, quantityLabel, full, cost, label, buy, deposit); grid.append(card); update();
      }
      find('[data-token-pack]').disabled = busy || !!data.pending?.length || !data.sales_enabled || catalogue.length !== 4 || catalogue.some(token => token.available_units < token.bundle_units);
      paintBasket();
      if (requestedItem) {
        const target = [...panel.querySelectorAll('[data-token-item],[data-token-recipe]')].find(node => (node.dataset.tokenItem || node.dataset.tokenRecipe) === requestedItem);
        if (target) {
          if (target.tagName === 'DETAILS') target.open = true;
          target.scrollIntoView({block: 'nearest'});
          target.querySelector('input,summary')?.focus({preventScroll: true});
          requestedItem = '';
        }
      }
      if (announce) message.textContent = data.wallet ? 'Wallet balances checked. Choose a token bundle below.' : 'Connect your wallet to see your tokens.';
    } catch (error) { if (valid(version)) fail(error); }
    finally { if (valid(version)) loading.hidden = true; }
  }
  entry.addEventListener('click', () => {
    clearTimeout(timer); controller?.abort(); revision++;
    owner = identity(); if (!owner) return;
    choices.clear(); catalogue = [];
    controller = new AbortController(); panel.hidden = false; operation = ''; busy = checking = false; unlink();
    grid.replaceChildren(); find('[data-token-pending]').replaceChildren(); find('[data-token-economy]').replaceChildren();
    find('[data-token-address]').textContent = '';
    find('.aura-token-basket').hidden = true; find('[data-token-pack]').disabled = true; paintBasket();
    find('[data-token-close]').focus(); refresh();
  });
  window.addEventListener('pennyfever:token-shop-ready', event => {
    requestedItem = String(event.detail?.item || ''); entry.click();
  });
  panel.querySelectorAll('[data-token-close]').forEach(button => button.addEventListener('click', close));
  find('[data-token-connect]').addEventListener('click', () => start('connect'));
  find('[data-token-selected]').addEventListener('click', () => {
    try { start('basket', '', 1, selectedItems()); } catch (error) { fail(error); }
  });
  find('[data-token-pack]').addEventListener('click', () => {
    catalogue.forEach(token => choices.set(token.item, {checked: true, quantity: String(token.bundle_units)}));
    refresh(false);
  });
  find('[data-token-refresh]').addEventListener('click', () => operation ? check() : refresh());
  find('[data-token-check]').addEventListener('click', check);
  find('[data-token-disconnect]').addEventListener('click', async () => {
    const version = revision;
    try { await post('/disconnect', {}, version); if (valid(version)) refresh(); }
    catch (error) { if (valid(version)) fail(error); }
  });
  panel.addEventListener('click', async event => {
    const button = event.target.closest('[data-token-claim]');
    if (!button || button.disabled || busy || operation || !valid(revision)) return;
    busy = true; button.disabled = true; const version = revision;
    message.textContent = 'Checking your existing claim and token purse…';
    try {
      const result = await post('/claim', {operation: crypto.randomUUID(), item: button.dataset.tokenClaim}, version);
      if (!valid(version)) return;
      message.textContent = result.charged ? 'Reward collected for your connected wallet. Your token purse has been updated; open the reward in the Tradeshow to mint it.' : 'Already collected. No tokens were spent again.';
      window.dispatchEvent(new CustomEvent('pennyfever:tokenclaim', {detail: {receipt: result.receipt}}));
      busy = false;
      await refresh(false);
    } catch (error) { if (valid(version)) { busy = false; fail(error); await refresh(false); } }
    finally { if (valid(version)) { busy = false; paintBasket(); } }
  });
  // Window capture precedes the existing NFT dialog's document capture. Handle
  // only this panel's navigation keys and leave all existing handlers intact.
  window.addEventListener('keydown', event => {
    if (panel.hidden || !['Escape','Tab'].includes(event.key)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.key === 'Escape') { close(); return; }
    const controls = [...panel.querySelectorAll('button:not(:disabled),a[href],select,input:not(:disabled)')].filter(el => !el.closest('[hidden]'));
    const index = controls.indexOf(document.activeElement);
    controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus();
  }, true);
  new MutationObserver(() => {
    if (overlay.hidden) {
      if (!panel.hidden) close();
      overviewController?.abort(); overviewData = null; overviewOwner = null; overviewAttempted = false; addShortcuts();
    } else refreshOverview();
  }).observe(overlay, {attributes: true, attributeFilter: ['hidden']});
  refreshOverview();
  function wake() {
    if (overviewOwner && !sameOwner(overviewOwner)) { overviewController?.abort(); overviewData = null; overviewOwner = null; overviewAttempted = false; addShortcuts(); }
    if (!panel.hidden && !valid(revision)) close(); else if (!panel.hidden && operation && document.visibilityState !== 'hidden') check(); }
  window.addEventListener('focus', wake); window.addEventListener('storage', wake);
  document.addEventListener('visibilitychange', wake);
  setInterval(() => {
    if (overviewOwner && !sameOwner(overviewOwner)) { overviewController?.abort(); overviewData = null; overviewOwner = null; overviewAttempted = false; addShortcuts(); }
    if (!panel.hidden && !valid(revision)) close();
  }, 1000);
}

function discover() {
  const overlay = document.querySelector('.aura-tradeshow');
  if (overlay) { attach(overlay); observer.disconnect(); }
}
const observer = new MutationObserver(discover);
observer.observe(document.body, {childList: true});
discover();

window.addEventListener('pennyfever:token-shop', async event => {
  if (!identity()) return;
  const item = String(event.detail?.item || '');
  try {
    const show = window.AuraTradeshow || await import('./aura-tradeshow.js?v=tradeshow-cancel-1').then(module => ({open: module.openTradeshow}));
    if (!show.open()) return;
    discover();
    window.dispatchEvent(new CustomEvent('pennyfever:token-shop-ready', {detail: {item}}));
  } catch {
    window.PennyFeverInventory?.open?.(item);
  }
});
