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
  game.append(element('p', 'Game token banking and transfers are not connected yet. Xaman holdings are shown below.'));
  root.append(game);
  if (!economy || economy.revision !== 2) {
    root.append(element('p', 'New token requirements are not available yet. Existing claims are unchanged.')); return;
  }
  const heading = element('h3', 'Special reward requirements'); root.append(heading);
  root.append(element('p', 'Token trading opens when the purse connection is ready. Wallet holdings cannot be spent directly from the game purse.'));
  for (const recipe of economy.recipes || []) {
    const box = element('details', ''); box.dataset.tokenRecipe = recipe.item;
    box.append(element('summary', recipe.name));
    const table = document.createElement('table');
    const caption = element('caption', 'Xaman held / required / missing. Game token banking is not connected yet.'); table.append(caption);
    const head = document.createElement('thead'), hr = document.createElement('tr');
    for (const title of ['Token', 'In Xaman', 'Required', 'Missing']) { const th = element('th', title); th.scope = 'col'; hr.append(th); }
    head.append(hr); table.append(head);
    const body = document.createElement('tbody');
    for (const [item, required] of Object.entries(recipe.cost)) {
      const token = (data.tokens || []).find(row => row.item === item);
      const have = data.wallet && token && Number.isFinite(Number(token.balance)) ? Number(token.balance) : null;
      const row = document.createElement('tr');
      const th = element('th', NAMES[item] || item); th.scope = 'row'; row.append(th);
      for (const value of [have === null ? 'Connect wallet' : count(have), count(required), have === null ? '—' : count(Math.max(0, required-have))]) row.append(element('td', value));
      body.append(row);
    }
    table.append(body); box.append(table); root.append(box);
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
  for (const node of root.querySelectorAll('[data-ledger-have]')) {
    const token = (data?.tokens || []).find(row => row.item === node.dataset.ledgerHave);
    const value = data?.wallet && token && Number.isFinite(Number(token.balance)) ? count(token.balance) : '—';
    if (node.textContent !== value) node.textContent = value;
  }
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
