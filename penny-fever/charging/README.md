# Disabled ledger transport checkpoint — 13 September 2026

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
