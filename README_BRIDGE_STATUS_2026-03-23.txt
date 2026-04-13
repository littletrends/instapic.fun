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
