Instapic public frontend cleanup

This folder is now the single website-facing frontend set:
- index.html
- pay.html
- session.html
- ticket.html
- bonus.html

Archived into the dated _archive folder:
- local Flask/Jinja templates
- app.py and local backend glue
- db/models/config files
- backups and junk

Important:
The public pages currently point to:
  http://127.0.0.1:6000

That works for local/dev on MotherPC only.
Before public live use, change window.INSTAPIC_API_BASE in pay.html and session.html
to your real public MotherPC endpoint or proxy.
