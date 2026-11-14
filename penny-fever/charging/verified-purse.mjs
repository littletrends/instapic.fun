// Keep the existing synchronous purse controls responsive while committing
// their finite conversions/grants to the account's server journal.
export function createVerifiedPurse({owner, wallet, client, apply, storage = globalThis.localStorage,
  uuid = () => globalThis.crypto.randomUUID(), loan = () => ({enabled: false}),
  assertActive = () => {}, onError = () => {}}) {
  const key = 'pennyFever.verified.purse.v1:' + encodeURIComponent(owner);
  const saved = storage.getItem(key);
  let queue = saved ? JSON.parse(saved) : [], canonical = structuredClone(wallet), predicted, sending = null, failure = null;
  let cancellable = null, sentKey = null;
  if (!Array.isArray(queue) || queue.some(item => !item || typeof item.key !== 'string' || !item.command)) throw Error('verified_purse_recovery_required');
  let recovering = queue.length > 0;
  const persist = next => storage.setItem(key, JSON.stringify(next));
  function predict(command, target) {
    const {action, amount} = command;
    if (action === 'pack') {target.pennies -= 5; target.packs++;}
    else if (action === 'unpack') {target.packs--; target.pennies += 5;}
    else if (action === 'ticket') {target.pennies -= 5; target.tickets++;}
    else if (action === 'cash_ticket') {target.tickets--; target.pennies += 5;}
    else if (action === 'spend_pennies') target.pennies -= amount;
    else if (action === 'spend_ticket') target.tickets--;
    else if (action === 'collect_coin') target.pennies++;
    else if (action === 'loan') {
      const config = loan();
      if (!config.enabled || !Number.isSafeInteger(config.pennies) || config.pennies < 1) return false;
      target.pennies += config.pennies;
    } else return false;
    return ['pennies', 'tickets', 'packs'].every(name => Number.isSafeInteger(target[name]) && target[name] >= 0);
  }
  function repaint() {
    predicted = structuredClone(canonical);
    for (const item of queue) if (!predict(item.command, predicted)) throw Error('verified_purse_conflict');
    apply(structuredClone(predicted));
  }
  function accept(next) {
    if (!next || !Number.isSafeInteger(next.revision)) throw Error('verified_wallet_invalid');
    if (next.revision >= canonical.revision) canonical = {...canonical, ...structuredClone(next)};
    repaint();
  }
  async function flush() {
    if (sending) return sending;
    const task = (async () => {
      try {
        while (queue.length) {
          const first = queue[0];
          sentKey = first.key;
          const response = await client.command(first.command, {key: first.key});
          const remaining = queue.slice(1);
          persist(remaining);
          queue = remaining;
          sentKey = null;
          accept(response);
        }
        failure = null;
        recovering = false;
        return structuredClone(canonical);
      } catch (error) {failure = error; onError(error); throw error;}
    })();
    sending = task.finally(() => {sending = null;});
    return sending;
  }
  function operate(action, fields = {}) {
    try {assertActive();} catch (error) {onError(error); return false;}
    if (recovering || failure || queue.length >= 32) return false;
    const command = {operation: 'wallet', action, ...fields};
    const trial = structuredClone(predicted);
    if (!predict(command, trial)) return false;
    // A locally repeated coin claim should not briefly inflate the purse.
    if (action === 'collect_coin' && queue.some(item => item.command.action === action && item.command.index === fields.index)) return false;
    const next = [...queue, {key: uuid(), command}];
    try {persist(next);} catch (error) {failure = error; onError(error); return false;}
    queue = next; predicted = trial; apply(structuredClone(predicted));
    const last = next[next.length - 1];
    cancellable = action === 'spend_pennies' ? {key: last.key, amount: fields.amount} : null;
    queueMicrotask(() => {if (cancellable?.key === last.key) cancellable = null; flush().catch(() => {});});
    return true;
  }
  // On reload the server may already include the first queued debit. Recover
  // its key before predicting it again, including a purse spent down to zero.
  if (recovering) {predicted = structuredClone(canonical); apply(structuredClone(predicted));}
  else repaint();
  return {
    accept, flush,
    pennies: () => predicted.pennies, tickets: () => predicted.tickets, packs: () => predicted.packs,
    spendPennies(amount) {
      const count = Math.max(0, Math.floor(Number(amount) || 0));
      return !count || operate('spend_pennies', {amount: count});
    },
    spendTicket: () => operate('spend_ticket'),
    packFive: () => operate('pack'), unpackFive: () => operate('unpack'),
    tradeTicket: () => operate('ticket'), cashTicket: () => operate('cash_ticket') ? 5 : 0,
    collectCoin: index => Number.isInteger(index) && index >= 0 && index < 7 && operate('collect_coin', {index}),
    bankLoan: () => operate('loan'),
    rollbackPendingSpend(amount) {
      // Existing doll saving refunds synchronously if its final local write
      // fails. Cancel that still-unsent debit; never issue a browser credit.
      if (!cancellable || cancellable.amount !== amount || cancellable.key === sentKey) return 0;
      const next = queue.filter(item => item.key !== cancellable.key);
      if (next.length === queue.length) return 0;
      try {persist(next);} catch (error) {failure = error; onError(error); return 0;}
      queue = next; cancellable = null; repaint();
      return amount;
    },
    // Browser-reported credits are deliberately absent. Square purchases and
    // verified engine replies supply their server-confirmed wallet instead.
    get error() {return failure;}, get pending() {return queue.length;},
    wallet: () => structuredClone(predicted),
  };
}
