INSTAPIC.FUN BRIDGE STATUS

Current active website structure:
- Flask templates in templates/
- Flask static assets in static/
- app.py remains source/edit history only unless explicitly wired back in

Authority model:
- MotherPC server on port 6000 is the only ticket/code authority
- Funnel/live traffic goes to the 6000-side system
- Website local DB ticket create/validate/redeem/session-complete routes are retired/disabled
- bonus page is JS-driven and should use MotherPC lookup
- website Square checkout is NOT active yet
- physical booth Square payments are separate and not part of this website bridge

Legacy items kept only for reference:
- LEGACY_static_site/
- db.py
- models.py
- instapic_fun.db
- debug_tickets route may show old local DB data and is not source of truth

Bridge goal:
- keep old shell where useful
- use new MotherPC logic
- finish visual revamp later after bridge is stable


UPDATE — 2026-04-04

Major change since this note:
- website Square payment is now working
- Apple Pay is now working on the live website
- pay flow is connected through the website bridge and MotherPC remains the only ticket/code authority

Current live payment/code flow:
- guest opens pay.html
- chooses package
- pays by Square / Apple Pay
- payment approved
- MotherPC generates the official 6-digit session/ticket code
- website shows that code on the handoff/ticket flow
- guest must keep that code safe for kiosk use and later session lookup

Authority model remains unchanged:
- MotherPC is still the single source of truth
- website does not invent or own session codes
- website only triggers payment/code creation and later asks MotherPC yes/no on existing codes

Session retrieval model:
- session.html uses the MotherPC 6-digit code lookup path
- guest-area ticket access should use that same exact MotherPC code/session path underneath
- bonus/session availability still depends on MotherPC response

Current site direction:
- no more rebuilding old 5001/local-ticket architecture
- no new ticket authority on website side
- website overhaul now focuses on clear public flow, ticket handoff, guest area, and polished bonus section
- priority is to rebuild the live site cleanly around the already-working payment and MotherPC bridge

Practical reminder:
- the 6-digit MotherPC code is the important guest-facing code
- guests need it at the physical kiosk
- guests may also need it later to retrieve their session/bonus content
- ticket/code handoff page must strongly tell guests to save the code before leaving
