# Doll transparency and colour repair — 15 September 2026

The old hair/hat exports contain full dolls or ghost face/body pixels; several also have holes inside the accessories. Do not use a skin-colour knockout to clean them: it removes blonde hair, cream fabric, and highlights too.

`hair-clean/` and `hats-clean/` are transparent repair masters generated with the built-in image tool from the corresponding existing sheets. Originals remain in `hair/` and `hats/` for reference. The composer scales masters to its 1536×512 four-view strip. The witch hat has explicit per-pose registration because its repair master includes additional framing.

Some outfit sheets still include the original skin. The composer now applies skin and iris colour after the outfit and before clean accessories. Skin regions follow the fixed four poses and preserve facial details and brass joints; eye colour is restricted to the original blue irises. Colour operations never modify alpha.

Verification: serve the repository and open `tests/paper-dolls.browser.html`. It checks all 37 outfit choices for skin colour, untouched torso clothing and exact alpha preservation; verifies eye colours stay in iris regions; and checks all 18 repaired accessories for baked blue eyes and lower-body remnants. Visual review also covers all four views and natural, deep and custom pink skin.

## Follow-up: pupils, skin shading and creator loading

Close-up review on a white background revealed that the original body PNG has transparent pupil holes. The composer now restores a dark backing under those holes while preserving the printed iris and highlights. Default blue no longer recolours the source. Skin selection uses the actual facial pixel colours rather than broad eye/mouth cutouts, avoiding pale rings, and retains light/shadow detail on darker shades.

The 54 tray thumbnails are generated with `python3 tools/build-doll-thumbnails.py` using ImageMagick. They are 384×128 WebP strips with alpha, totalling 524,546 bytes instead of 19,300,918 bytes of full-size masters. Only visible thumbnails load; selected full-size layers retain priority. Preview requests coalesce to the latest choice and the composed-image cache is bounded.

Additional checks: `tests/paper-doll-creator.browser.html` exercises the phone-sized creator, deferred thumbnail requests and rapid colour changes. The colour regression checks now verify opaque dark pupils, unchanged default printed pixels/highlights and coloured eyelid skin.
