# Game build requirements

When building or updating a game in this directory, read its row and the shared
requirements in `../SAVE_REQUIREMENTS.md` (created 2026-09-13).

Exact-state persistence is part of the game build, not optional polish. Preserve
existing saves and implement or verify save/restore for the changed gameplay state.
Do not mark a game complete without the listed return/reload checks. If a task is
narrower, document remaining save work accurately rather than changing unrelated games.
Update that game's checklist status with the test date, evidence, and deployment status.

The user is actively editing characters/paper dolls. Do not change those files as
part of persistence work. Work in this live-source checkout; do not start a separate
localhost/workshop build. Publishing remains deferred until the user requests it.

## Bonus status wording

Use **Locked / Collected** for chapter bonus ownership in every game, including new games.
Locked means the bonus has not been collected; Collected means it is in Treasures.
Do not label collected bonuses Kept or Unlocked. This is display wording; preserve
existing save fields, collection receipts and award rules.
