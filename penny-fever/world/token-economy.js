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
  const purse = economy?.legacy_purse;
  game.append(element('p', purse?.available
    ? 'Legacy game tokens: ' + Object.keys(NAMES).map(item => `${count(purse.balances[item])} ${NAMES[item]}`).join(' · ')
    : 'Legacy game token balance is unavailable.'));
  game.append(element('p', 'Legacy game tokens have not been converted to ledger units. Game purse and Xaman holdings are shown separately.'));
  root.append(game);
  if (!economy || economy.revision !== 2) {
    root.append(element('p', 'New token requirements are not available yet. Existing claims are unchanged.')); return;
  }
  const heading = element('h3', 'Special rewards · new token requirements'); root.append(heading);
  root.append(element('p', 'Preview: these new recipes are not active yet. Wallet holdings cannot be spent directly from the game purse.'));
  for (const recipe of economy.recipes || []) {
    const box = element('details', ''); box.dataset.tokenRecipe = recipe.item;
    box.append(element('summary', recipe.name));
    const table = document.createElement('table');
    const caption = element('caption', 'Xaman holdings compared with the planned recipe; excludes legacy game tokens.'); table.append(caption);
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

export function paintRecipeProgress(root, data, item) {
  const recipe = data?.economy?.recipes?.find(row => row.item === item);
  const signature = JSON.stringify([item, recipe, data?.wallet, (data?.tokens || []).map(row => [row.item,row.balance])]);
  if (root._tokenProgressSignature === signature) return;
  root._tokenProgressSignature = signature;
  root.replaceChildren();
  root.append(element('strong', 'New token recipe · preview'));
  if (!recipe) {
    root.append(element('p', data?.unavailable ? 'New requirements unavailable · open Wallet / Tokens to retry.' : 'Checking the new requirements…')); return;
  }
  for (const [token, required] of Object.entries(recipe.cost)) {
    const balance = (data.tokens || []).find(row => row.item === token)?.balance;
    const have = data.wallet && balance !== undefined && Number.isFinite(Number(balance)) ? count(balance) : '—';
    root.append(element('p', `${have} / ${count(required)} ${NAMES[token] || token}`));
  }
  root.append(element('small', 'Xaman held / required. New token trading is not open yet.'));
}
