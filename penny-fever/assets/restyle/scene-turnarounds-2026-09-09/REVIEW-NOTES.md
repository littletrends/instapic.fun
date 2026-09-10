# Complete — transparent scene pack, 9 September 2026

Deliverable: `../../Restyled Original/assets/restyle/scene-turnarounds-2026-09-09/`

76 sets, 304 directional views, 456 RGBA PNGs, approximately 130 MiB. All 76 sets were visually reviewed in `review-01.jpg` through `review-07.jpg` on dark and cream backgrounds. Final automated validation passed with zero errors. Gallery JavaScript passed `node --check`.

35 structures use selected original illustrations with local parchment extraction. 41 character sets use the selected built-in background edits listed in `background-edits/*.json`, followed by cyan matte cleanup. The initial cream character masks damaged pale fabrics and were superseded inside the delivery. The final pack contains only selected exports. `prepare.py` now protects selected character exports from accidental replacement; use `import-edits.py` for character updates.

Some generated edits had thin white cross separators despite the prompt. `import-edits.py` removes long white separator lines and sparse edge-spanning components before finding true transparent gutters. Nell's generated directions retain front/right/back/left; her saved edit record explicitly reorders them to front/left/back/right for final exports.

The complete manifest, source hashes, generation prompts, original design prompts, README, review notes, standalone gallery and Mother PC import instructions are inside the deliverable. The manifest is marked complete and all records are visually reviewed. Running an import/preparation script intentionally resets the aggregate manifest to unfinalized; re-review changes before restoring complete status and rebuilding/validating the gallery.

No game code was modified. No files were transferred to Mother PC. Mother has newer game changes: copy only the art pack, not the full Acer project. No browser/GPU playtest was run under the local rule in `ops/ATTN_NO_HEADLESS_CHROME.md`.

Original design sheets and the completed 160-item transparent pack remain untouched. Raw image-generation files stay under their recorded `.codex/generated_images` paths. Experiments and contact proofs are outside the clean working build.
