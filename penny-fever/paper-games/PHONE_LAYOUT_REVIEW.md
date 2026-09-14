# Phone gameplay layout — 14 September 2026

Implemented in the shared shell for all paper games (33 open; Snap remains closed):

- Illustrated stage fills the available phone viewport; canvas occupies a dedicated row between status and controls. Pointer coordinates use that canvas's actual bounds.
- Compact internal status; ride progress moved out of the duplicate canvas HUD.
- Bottom gameplay buttons are at least 48 CSS pixels high. Replay and hints live in the menu. Existing action handlers and charging methods are retained.
- Mobile information panel becomes a separate menu. Opening it pauses play; returning resumes a previously running game. Chapter changes/restarts dismiss it without resuming stale state.
- The embedded alley uses its outer compact menu, with no second game header. Opening the alley menu pauses the iframe.
- Short entry prompts with one Start button; larger canvas labels and small collectible art; narrower desktop notebook.
- Dynamic viewport height, safe-area padding, and no document scrolling during play.
- Broad ride covers and redundant drawn hold-control panels removed; each catalogue backdrop remains authoritative.

Validation: disposable Chromium, local files intercepted on the public origin, no production wallet. All 33 open games opened and rendered without runtime exceptions. All 99 size checks (320×520, 390×748, 1440×850) passed document-overflow, canvas/control separation, and 44×44 minimum action-button checks. Menu opening/closing checked at each size. Earlier pass also checked reload readiness for all 33. Evidence: /tmp/pf-phone-final.txt, /tmp/pf-phone-review.txt; screenshots /tmp/pf-phone-*.png. Embedded same-origin fixture passed: 676px playable height, hidden inner header, no document scroll, menu pauses and return resumes. Evidence: /tmp/pf-phone-embed-final.txt. The shared runtime was restored after a concurrent overwrite; its canvas sizing, controls and menu handlers match the tested pass.

These checks are not physical iPhone Safari testing, full chapter playthroughs, paid-outcome validation, or exact-state persistence certification. Game-specific canvas hit regions retain engine semantics; the button measurements do not certify every drawn target. Difficulty and economy were not tuned.

Deployment: user authorized publication on 14 September 2026. Publishing the complete shared shell, runtime, styling and backdrop cleanup together; concurrent Florence artwork changes are preserved. Physical Safari and exact-state persistence checks remain outstanding as noted above.
