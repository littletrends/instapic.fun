# Disabled three-pilot candidate — 13 September 2026

Private-gate implementation checkpoint: the frontend now resolves authenticated
capabilities for explicitly configured test identities, with isolated outbox and
award receipts and no legacy-wallet fallback. Defaults remain off. See MotherPC
`motherpc_server/PENNY_PRIVATE_GATE_IMPLEMENTATION.md` for the current integration,
test evidence and future deployment steps. The older checkpoint notes below are
historical, not a statement that this gate has been deployed or browser-validated.

The original transport checkpoint below is retained as history. The three actual
engine adapters, guarded runtime/shell integration, migration receipts and Square
log reconciliation are now implemented and tested in isolated fixtures.

All release flags remain OFF. No publication, running-server registration, real
payment or production wallet import has occurred. Do not activate this candidate.

Current design, evidence and production-validation gates are documented in the
MotherPC repository at `motherpc_server/PENNY_PILOT_RELEASE_CANDIDATE.md`.
The worker reuses existing engine code with seeded replay; it does not retune
prototype gameplay, rewards, stars or treasure rates.

Current tests: 30 backend scenarios, one intercepted Chromium smoke scenario,
plus migration/client/pennies/conversion Node checks. The browser scenario uses
fixture-only traffic, not a local workshop build or the running live service.

## Original foundation checkpoint

`pilot-client.mjs` is not imported by gameplay. It is a transport foundation, not
a completed game adapter. It defaults to disabled and practice mode; only explicit
non-practice opt-in for coin-pusher, balloons or fortune permits requests.

No production wallet, saved game, shell charge, reward or payment path changes.
Pending command keys survive reload and response loss. The server owns identity,
balances, charging configuration and transaction effects. This client must never
be used to optimistically grant credits or overwrite an active legacy wallet.

Test: `node penny-fever/ops/check-ledger-client.mjs` from repository root.

Backend foundation checkpoint: MotherPC repository
`/home/magic_mirror1/Desktop/instapic`, commit `733d4e2`.
Full design, test evidence, limitations and remaining pilot work:
`motherpc_server/PENNY_LEDGER_DESIGN.md` in that repository.

The backend has 15 isolated passing tests. Model fixtures are not actual engine
pilots: deterministic Copper replay, Balloon/Fortune engine adapters, authenticated
enrolment, legacy wallet fencing and verified Square ownership recovery remain.
Do not enable real-wallet pilots until these are implemented and tested.

Rollback before activation: revert this isolated transport commit. No player data
was changed. After future activation, disable new transactions but retain ledger
records and reconciliation; never fall back to a second spendable legacy wallet.
