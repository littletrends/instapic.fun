// Read-only comparisons; these displays never grant or spend a balance.
const NAMES = {'star-token':'Stars', 'moon-penny':'Moons', 'rose-penny':'Roses', 'crown-token':'Crowns'};
const count = value => Number(value).toLocaleString('en-AU', {maximumFractionDigits: 20});
function element(tag, text) {
  const node = document.createElement(tag); node.textContent = text; return node;
}
export function paintEconomy(root, data) {
  root.replaceChildren();
  const game = element('section', ''); game.className = 'aura-token-game-purse';
  game.append(element('h3', 'Game purse'));
  const api = window.PennyFever;
  const essentials = [['Pennies', api?.pennies?.()], ['Tickets', api?.tickets?.()], ['5-packs', api?.pennyPacks?.()]];
  game.append(element('p', essentials.map(([name, amount]) => `${name}: ${Number.isSafeInteger(amount) && amount >= 0 ? count(amount) : 'not loaded'}`).join(' · ')));
  const till = element('button', 'Pennies, tickets & 5-packs · Aura’s entrance booth');
  till.type = 'button'; till.dataset.tokenEntrance = ''; game.append(till);
  const economy = data.economy;
  const bank = data.token_purse?.denomination === 'verified-ledger-units' ? data.token_purse : null;
  game.append(element('p', bank ? 'Game token earnings are not connected yet. Verified wallet deposits are shown separately below.' : 'Game token banking and transfers are not connected yet. Xaman holdings are shown below.'));
  root.append(game);
  if (bank) {
    const section = element('section', ''); section.className = 'aura-token-game-purse';
    section.append(element('h3', 'VIP token purse'));
    section.append(element('p', Object.keys(NAMES).map(item => `${NAMES[item]}: ${count(bank.balances?.[item] || 0)}`).join(' · ')));
    section.append(element('p', 'Deposit tokens from your connected Xaman wallet below. A verified deposit moves tokens into this purse; it does not buy or mint an NFT. Game earnings and withdrawals are not open.'));
    if (bank.claims_check_failed) section.append(element('p', 'Existing reward claims could not be verified. Trading is paused; your balance is preserved.'));
    root.append(section);
  }
  if (!economy || economy.revision !== 2) {
    root.append(element('p', 'New token requirements are not available yet. Existing claims are unchanged.')); return;
  }
  const heading = element('h3', 'Special reward requirements'); root.append(heading);
  root.append(element('p', bank ? 'Rewards spend verified tokens deposited in your VIP token purse. Already collected rewards are preserved.' : 'Token trading opens when the purse connection is ready. Wallet holdings cannot be spent directly from the game purse.'));
  for (const recipe of economy.recipes || []) {
    const box = element('details', ''); box.dataset.tokenRecipe = recipe.item;
    box.append(element('summary', recipe.name));
    const table = document.createElement('table');
    const caption = element('caption', bank ? 'Verified purse / required / missing.' : 'Xaman held / required / missing. Game token banking is not connected yet.'); table.append(caption);
    const head = document.createElement('thead'), hr = document.createElement('tr');
    for (const title of ['Token', bank ? 'In purse' : 'In Xaman', 'Required', 'Missing']) { const th = element('th', title); th.scope = 'col'; hr.append(th); }
    head.append(hr); table.append(head);
    const body = document.createElement('tbody');
    for (const [item, required] of Object.entries(recipe.cost)) {
      const token = (data.tokens || []).find(row => row.item === item);
      const have = bank ? Number(bank.balances?.[item] || 0) : data.wallet && token && Number.isFinite(Number(token.balance)) ? Number(token.balance) : null;
      const row = document.createElement('tr');
      const th = element('th', NAMES[item] || item); th.scope = 'row'; row.append(th);
      for (const value of [have === null ? 'Connect wallet' : count(have), count(required), have === null ? '—' : count(Math.max(0, required-have))]) row.append(element('td', value));
      body.append(row);
    }
    table.append(body); box.append(table);
    if (bank) {
      const receipt = bank.claims?.find(receipt => receipt.item === recipe.item);
      const owned = !!receipt;
      const claim = element('button', owned ? 'Collected ✓' : 'Trade tokens for this reward'); claim.type = 'button';
      claim.dataset.tokenClaim = recipe.item;
      claim.disabled = owned || !data.wallet || bank.claims_check_failed || recipe.enabled !== true || Object.entries(recipe.cost).some(([item, units]) => Number(bank.balances?.[item] || 0) < units);
      box.append(claim);
      if (receipt?.wallet && receipt.wallet !== data.wallet) box.append(element('p', `Mint this collected reward using the wallet you traded with: ${receipt.wallet}`));
    }
    root.append(box);
  }
}

export const TOKEN_TERMS = Object.freeze({
  'star-token': {name: 'Stars', code: 'PENNYS', units: 1000000, xrp: 2},
  'moon-penny': {name: 'Moons', code: 'PENNYM', units: 100000, xrp: 5},
  'rose-penny': {name: 'Roses', code: 'PENNYR', units: 10000, xrp: 10},
  'crown-token': {name: 'Crowns', code: 'PENNYC', units: 1000, xrp: 25},
});
export const EVERYDAY_IDS = Object.freeze(['everyday-penny', 'five-penny-stack', 'ticket-roll', 'admission-ticket', ...Object.keys(TOKEN_TERMS)]);
export function paintLedgerRequirements(root, data) {
  for (const node of root.querySelectorAll('[data-ledger-have],[data-ledger-missing]')) {
    const item = node.dataset.ledgerHave || node.dataset.ledgerMissing;
    const token = (data?.tokens || []).find(row => row.item === item);
    const bank = data?.token_purse?.denomination === 'verified-ledger-units' ? data.token_purse : null;
    const have = bank ? Number(bank.balances?.[item] || 0) : data?.wallet && token && Number.isFinite(Number(token.balance)) ? Number(token.balance) : null;
    if (node.hasAttribute('data-ledger-have')) {
      const label = node.parentElement?.querySelector('dt');
      const text = bank ? 'In purse' : 'In Xaman';
      if (label && label.textContent !== text) label.textContent = text;
    }
    const amount = have === null ? null : node.hasAttribute('data-ledger-missing') ? Math.max(0, Number(node.dataset.required) - have) : have;
    const value = amount === null ? '—' : count(amount);
    if (node.textContent !== value) node.textContent = value;
  }
}
export function paintTradeshowPurse(root, data, signedIn) {
  const api = window.PennyFever;
  const values = [['Pennies', api?.pennies?.()], ['Tickets', api?.tickets?.()], ['5-packs', api?.pennyPacks?.()]];
  const game = signedIn ? values.map(([name, value]) => `${name}: ${Number.isSafeInteger(value) && value >= 0 ? count(value) : '—'}`).join(' · ') : 'Sign into VIP to view your purse';
  const ledger = signedIn && data?.wallet ? 'Xaman · ' + Object.keys(TOKEN_TERMS).map(item => {
    const token = (data.tokens || []).find(row => row.item === item);
    return `${TOKEN_TERMS[item].name}: ${token ? count(token.balance) : '—'}`;
  }).join(' · ') : 'Connect Xaman to view ledger tokens';
  const signature = JSON.stringify([game, ledger]);
  if (root._purseSignature === signature) return;
  root._purseSignature = signature; root.replaceChildren();
  const gameLine = element('span', game); gameLine.dataset.tradeshowGamePurse = '';
  const ledgerLine = element('span', ledger); ledgerLine.dataset.tradeshowLedgerPurse = '';
  root.append(gameLine, ledgerLine);
}

// Keep already-cached wallet modules loadable during the website cache rollover.
export function paintRecipeProgress(root, data, item) {
  const recipe = data?.economy?.recipes?.find(row => row.item === item);
  const signature = JSON.stringify([item, recipe]);
  if (root._tokenProgressSignature === signature) return;
  root._tokenProgressSignature = signature; root.replaceChildren();
  root.append(element('strong', 'Token requirements'));
  if (recipe) for (const [token, required] of Object.entries(recipe.cost)) root.append(element('p', `${count(required)} ${NAMES[token] || token}`));
}
