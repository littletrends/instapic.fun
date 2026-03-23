INSTAPIC.FUN BRIDGE STATUS

Current active website structure:
- Flask templates in templates/
- Flask static assets in static/
- app.py serves the active bridge site

Authority model:
- MotherPC server on port 6000 is the only ticket/code authority
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
