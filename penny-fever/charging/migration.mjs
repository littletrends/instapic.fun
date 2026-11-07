export const MIGRATION_KEY = 'pennyFever.ledger.migration.v1';

export function assertLegacyWalletWritable(storage, next) {
  const raw = storage.getItem(MIGRATION_KEY);
  if (!raw) return;
  const migration = JSON.parse(raw);
  if (!['prepared', 'imported'].includes(migration.status)) throw new Error('Unknown wallet migration status');
  const original = JSON.parse(migration.original);
  if (next.demoCoins !== original.demoCoins || next.playTickets !== original.playTickets) {
    throw new Error('This wallet is reserved for the disabled ledger pilot. Legacy spending is locked.');
  }
}

export async function migrateBrowser({enabled = false, storage = globalThis.localStorage,
  locks = globalThis.navigator?.locks, readOriginal, prepare, commit, uuid = () => crypto.randomUUID()}) {
  if (!enabled) return null;
  if (!locks) throw new Error('Migration requires cross-tab Web Locks; nothing imported');
  return locks.request(MIGRATION_KEY, async () => {
    let record = JSON.parse(storage.getItem(MIGRATION_KEY) || 'null');
    if (!record) {
      const original = readOriginal();
      JSON.parse(original);
      const localSaves = {};
      const copper = storage.getItem('pennyFever.cashDrop');
      if (copper !== null) localSaves['pennyFever.cashDrop'] = copper;
      record = {status: 'prepared', key: uuid(), token: `${uuid()}.${uuid()}`, original, localSaves};
      storage.setItem(MIGRATION_KEY, JSON.stringify(record));
    }
    if (record.status === 'imported') return record;
    const receipt = await prepare(record.key, JSON.parse(record.original), record.token, record.localSaves || {});
    record.receipt = receipt;
    storage.setItem(MIGRATION_KEY, JSON.stringify(record));
    const imported = await commit(receipt.player, receipt.receipt, receipt.digest, record.token);
    if (imported.status !== 'imported') throw new Error('Migration not confirmed');
    record.status = 'imported';
    storage.setItem(MIGRATION_KEY, JSON.stringify(record));
    return record;
  });
}
