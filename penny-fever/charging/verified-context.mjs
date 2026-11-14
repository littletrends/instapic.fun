// Keep verified round saves out of old browser saves and the parent purse.
// This swaps only the current iframe's synchronous engine-call environment.
export function createVerifiedContext({wallet, storage, reducedMotion = false, scope = globalThis}) {
  const local = {
    getItem: key => storage.get(String(key)) ?? null,
    setItem: (key, value) => storage.set(String(key), String(value)),
    removeItem: key => storage.delete(String(key)),
    clear: () => storage.clear(),
    key: index => [...storage.keys()][index] ?? null,
    get length() {return storage.size;},
  };
  function run(fn) {
    const descriptor = Object.getOwnPropertyDescriptor(scope, 'localStorage');
    const target = scope.window || scope;
    const priorWallet = Object.getOwnPropertyDescriptor(target, 'PennyFeverVerifiedWallet');
    const priorMedia = target.matchMedia;
    try {
      Object.defineProperty(scope, 'localStorage', {value: local, configurable: true});
      Object.defineProperty(target, 'PennyFeverVerifiedWallet', {value: wallet, configurable: true});
      target.matchMedia = query => String(query).includes('prefers-reduced-motion')
        ? {matches: reducedMotion} : priorMedia?.call(target, query);
      return fn();
    } finally {
      if (descriptor) Object.defineProperty(scope, 'localStorage', descriptor); else delete scope.localStorage;
      if (priorWallet) Object.defineProperty(target, 'PennyFeverVerifiedWallet', priorWallet); else delete target.PennyFeverVerifiedWallet;
      target.matchMedia = priorMedia;
    }
  }
  return {run};
}
