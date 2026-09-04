# Aura's Penny Fever — isolated prototype

This directory is a deliberately standalone development area for the Penny
Fever concept. It currently contains only a static, mobile-first foyer.

## Safety boundary

- No Square or other payment code.
- No MotherPC, booth, event, booking, guest, VIP, gallery, Bonus or ticket APIs.
- No analytics or third-party network requests.
- No imports from the production website runtimes.
- `index.html` is marked `noindex, nofollow, noarchive`.
- Nothing on the production website links here.

Any future integration with an existing Instapic service must be reviewed and
implemented across an explicit adapter boundary. Aura's creative work remains
inside this directory.

## Local preview

From the website repository root:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open:

`http://127.0.0.1:4173/penny-fever/`

To skip the discovery door during design work:

`http://127.0.0.1:4173/penny-fever/#foyer`

The development branch must be reviewed before merging into the GitHub Pages
production branch. The hidden production doorway is intentionally absent.
