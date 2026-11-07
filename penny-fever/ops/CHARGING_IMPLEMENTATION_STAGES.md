# Charging implementation stages

## Current checkpoint — 13 September 2026

The user subsequently approved a disabled three-pilot candidate without bulk
migration. Migration guards, the actual Balloon/Fortune/Copper engine adapters
and reviewed Square entitlement reconciliation are now implemented. Every release
flag remains off and no publication or production import has occurred. See
`../charging/README.md` and the MotherPC repository's
`motherpc_server/PENNY_PILOT_RELEASE_CANDIDATE.md` for current evidence and required
production validation. The earlier sequencing below is retained as history.

Started 2026-09-13. Follow the accepted live-charge audit and the user's clarified
Fortune reservation, explicit-abandonment and per-action record specification.
Implement and verify one stage at a time; do not tune rewards.

## Stage 1 — pass-safe conversion

Prepared: penny-to-ticket conversion deducts five pennies regardless of Showman
pass status. It saves the deducted pennies and added ticket in the same wallet
snapshot. It does not modify saved balances until a player requests a conversion.
Gameplay pass exemptions, reward quantities, Square and character files are unchanged.

Regression command: `node penny-fever/ops/check-ticket-conversion.mjs`.
Checks pass/no-pass, repeated requests, insufficient funds, numeric-string legacy
balances, complete wallet snapshots and conversion round trips.
Existing `node penny-fever/ops/check-pennies.mjs` also passes.

Pre-stage reference: `565d6b2f4972af6f0912abb5c82ba7ebd9d3d3d7`.
The stage is isolated in its own commit. Reverting it would reopen the known
currency-creation bug; do not use that as an ordinary player-data rollback.
This browser-side fix is not a cross-tab or server-transaction guarantee.

## Revised order — design gates before migration

2. Document each affected engine's actual begin, completion, failure, restart,
   chapter-change and interruption boundaries. The 29 proposed ticket games
   comprise 21 per-action engines and eight shell-entry games today. Do not
   infer their actual mechanics from older descriptions. No charge removal or
   migration is authorized before each boundary is agreed.
3. Then design player identity, the wallet ledger, play_id/action_id state
   transitions, daily Fortune reservation, Square entitlement recovery and
   old-save migration. Design is not permission to change Square processing.
4. Use fresh dedicated shared ledger/charging files and one authoritative
   classification. Agree the design before implementing the foundation.
5. Migrate games individually only after their boundaries are agreed. Preserve
   open paid play across returns and interruptions, keep practice free and
   non-paying, and prove exactly-once charges and settlement for each game.
6. Re-audit all 34 games, including interruptions, two tabs, old saves, failed
   attempts, midnight boundaries and duplicate requests. No reward, payout,
   star, treasure, NFT or scarcity changes in these stages.

## Preservation and release requirements

- Preserve existing balances, collections and chapter state. Migration must be
  explicit, versioned and idempotent; never replay an import to mint more funds.
- Distinguish authoritative server records from unverified historical browser
  balances. Document the testing limitation rather than claiming those old
  balances were server-verified.
- Keep each stage in a separate commit with tests, deployment status and a
  rollback procedure that preserves newer ledger records and player data.
- No Square, NFT, scarcity, reward or costume changes in this workstream.
- Do not mark the system transaction-safe based on Stage 1 or coin-pusher
  snapshot tests. That requires the ledger and interruption tests above.
