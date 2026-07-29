INSTAPIC.FUN ↔ MOTHERPC BRIDGE
Last updated: 2026-07-29

Live site
---------
- Static HTML/JS/CSS on GitHub Pages (this directory is its own git repo).
- Domain: https://instapic.fun  (CNAME → instapic.fun)
- Deploy helper from parent monorepo: tools/push_instapic_fun.sh

Authority (do not re-break this)
--------------------------------
- MotherPC (port 6000 / Tailscale Funnel) is the ONLY ticket and session authority.
- Website never invents or owns 6-digit codes.
- Local Flask app.py / db.py / models.py / instapic_fun.db are LEGACY only
  (not the live ticket path; port 5001 is retired).

Payment + code handoff
----------------------
1. Guest opens pay.html → package → Square / Apple Pay.
2. Website calls MotherPC (pay-and-create-ticket / create-ticket path).
3. MotherPC returns the official 6-digit code.
4. ticket.html (and related handoff) must stress: save the code.
5. Guest uses the code on the kiosk (prepaid) and later on session.html / bonus.html.

Session + bonus
---------------
- session.html looks up the MotherPC 6-digit code.
- bonus.html loads assets from MotherPC session/bonus URLs (+ bonus_patch host tools when applicable).
- Guest area (my-instapic / save / verify) attaches tickets to verified email on MotherPC.

Event hire + host
-----------------
- Marketing: events.html, event-enquiry → quote / contract / deposit pages.
- Host portal: event.html + event_*_runtime.js (payment, chat, guestbook, setup).
- Booking admin on MotherPC desktop / booth admin proxies where configured.

Legacy folders (reference only — do not rebuild as authority)
-------------------------------------------------------------
- LEGACY_static_site/
- templates_old_flask_shell/
- _retired_guest_verify/
- app.py, db.py, models.py, instapic_fun.db

Core JS note
------------
See static/js/README_CORE.txt for shared runtime edit rules.
Many page-specific * _runtime.js files live at the site root as well as under static/js/ —
prefer the scripts each HTML page actually loads (check script tags before editing).

Practical reminders
-------------------
- 6-digit MotherPC code = kiosk key + later digital retrieval key.
- Physical booth Square Terminals are separate from website Square; both mint codes via MotherPC.
- If bonus or verify “fails”, check MotherPC env (SMTP/Square) and that serve_motherpc loaded private/motherpc.env.
