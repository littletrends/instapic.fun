# Aura's Penny Fever wardrobe

This is Aura's optional creative library from the complete Grok Imagine export. It is separate from `../game/`, so merely storing these files does not make a visitor download them.

## Browse

- `catalog/stills-contact.jpg` — contact sheet for 79 additional stills
- `catalog/videos-contact.jpg` — representative frame from 66 additional videos
- `catalog.tsv` — exact asset id, type, dimensions, duration and website-relative path
- `stills/<asset-id>.webp` — mobile-ready stills
- `loops/<asset-id>.mp4` — muted H.264 video assets with fast-start metadata

The eight-character label on each contact-sheet tile is the beginning of its full filename. Search `catalog.tsv` for that label to obtain the exact path.

## Video inventory

- 34 six-second loops
- 22 ten-second scenes
- 9 fifteen-second scenes
- 1 forty-six-second sequence

Use six-second files for idle cabinet motion. Use 10–15 second files for entrances, reveals and reward moments. The 46-second sequence should be tap-to-play and must never autoplay on page load.

## Boundaries

- Nothing in this directory is connected to Square, Instapic APIs or booth software.
- Wardrobe assets are not loaded unless Aura explicitly references their path.
- Full-quality originals and master archives remain outside this repository under `~/Downloads/Aura's Penny Fever/`.
- Prefer the named, reviewed files in `../game/` for existing cabinet states; use this wardrobe to dress new rooms and future attractions.
