#!/usr/bin/env python3
"""Build small, alpha-preserving thumbnails; never edit the doll art masters."""
from pathlib import Path
import re
import subprocess

root = Path(__file__).resolve().parents[1]
module = (root / 'penny-fever/world/paper-dolls.js').read_text()
assets = root / 'penny-fever/assets/restyle/paper-dolls'
source_bytes = output_bytes = count = 0
for export, folder in [('HAIR_STYLES','hair-clean'), ('HATS','hats-clean'), ('OUTFITS','outfits')]:
    section = module.split(f'export const {export} = [',1)[1].split('];',1)[0]
    for name in re.findall(r"id: '([^']+)'", section):
        if name == 'none':
            continue
        source = assets / folder / f'{name}.png'
        output = assets / 'thumbnails' / folder / f'{name}.webp'
        output.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['convert', str(source), '-resize', '384x128!', '-strip',
                        '-define', 'webp:alpha-quality=100', '-quality', '82', str(output)], check=True)
        count += 1
        source_bytes += source.stat().st_size
        output_bytes += output.stat().st_size
print(f'{count} thumbnails: {source_bytes:,} source bytes -> {output_bytes:,} bytes ({100*(1-output_bytes/source_bytes):.1f}% smaller)')
