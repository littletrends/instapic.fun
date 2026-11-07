# Doll transparency and colour repair — 15 September 2026

The old hair/hat exports contain full dolls or ghost face/body pixels; several also have holes inside the accessories. Do not use a skin-colour knockout to clean them: it removes blonde hair, cream fabric, and highlights too.

`hair-clean/` and `hats-clean/` are transparent repair masters generated with the built-in image tool from the corresponding existing sheets. Originals remain in `hair/` and `hats/` for reference. The composer scales masters to its 1536×512 four-view strip. The witch hat has explicit per-pose registration because its repair master includes additional framing.

Some outfit sheets still include the original skin. The composer now applies skin and iris colour after the outfit and before clean accessories. Skin regions follow the fixed four poses and preserve facial details and brass joints; eye colour is restricted to the original blue irises. Colour operations never modify alpha.

Verification: serve the repository and open `tests/paper-dolls.browser.html`. It checks all 37 outfit choices for skin colour, untouched torso clothing and exact alpha preservation; verifies eye colours stay in iris regions; and checks all 18 repaired accessories for baked blue eyes and lower-body remnants. Visual review also covers all four views and natural, deep and custom pink skin.

## Follow-up: pupils, skin shading and creator loading

Close-up review on a white background revealed that the original body PNG has transparent pupil holes. The composer now restores a dark backing under those holes while preserving the printed iris and highlights. Default blue no longer recolours the source. Skin selection uses the actual facial pixel colours rather than broad eye/mouth cutouts, avoiding pale rings, and retains light/shadow detail on darker shades.

The 54 tray thumbnails are generated with `python3 tools/build-doll-thumbnails.py` using ImageMagick. They are 384×128 WebP strips with alpha, totalling 524,546 bytes instead of 19,300,918 bytes of full-size masters. Only visible thumbnails load; selected full-size layers retain priority. Preview requests coalesce to the latest choice and the composed-image cache is bounded.

Additional checks: `tests/paper-doll-creator.browser.html` exercises the phone-sized creator, deferred thumbnail requests and rapid colour changes. The colour regression checks now verify opaque dark pupils, unchanged default printed pixels/highlights and coloured eyelid skin.

## Follow-up: preview disappearing after phone edits

The editor now draws a single pose onto a fixed 384×512 canvas, retaining the previous frame until the next composition succeeds. This avoids PNG encoding and a second image decode on every edit, plus the oversized CSS sprite image. Selected layers load concurrently, failed requests can retry, and a 12-second timeout prevents an indefinitely stalled render queue. Three rendered sheets are cached; PNG exports remain available for saved portraits and world characters.

The creator regression also checks all four rotations and deliberately delays/fails an accessory request, verifies the old preview survives, and retries successfully. It passes at a 390×844 mobile viewport. A fresh Chromium run of the previous live version did not reproduce the persistent blank reported on the user's phone; this change removes the vulnerable preview replacement path.

## TODO: accessory fit redo — temporarily paused, 2026-09-15

User requested a quick cleanup without spending image-generation usage. No images were generated or edited for this pass. Reviewed all seven hairstyles with all eleven hats in all four poses using the existing browser compositor.

Temporarily hidden from the creator and collection pieces: straw, sailor, rain, cowboy, witchhat, chefhat, piratehat, beret and postiecap. Solid hats fail to cover hair consistently (especially buns, curls and side-view fringes); witchhat also sits too low across the eyes in profile. Its prior scale/offset workaround is insufficient. Waves hair is also paused: side views expose a conspicuous scalp crescent and the fringe projects too far forward. The other six hairstyles, paper crown and flower crown remain available.

Existing PNG masters and thumbnails are retained. Saved choices and renderer inputs fall back to no hat/no hair for paused pieces, retaining clothes, colours and other choices. Restore later by repairing four-pose registration and designing hair-under-hat masks or compatible fitted variants. Check every retained hairstyle against each restored hat, front/left/back/right, with no scalp gaps, hair above solid crowns or brims covering eyes; then remove IDs from PAUSED_HAIR/PAUSED_HATS in world/paper-dolls.js. Do not regenerate art until a later user request allows it.

## Separate clothing slots — 2026-09-15

The creator now offers Tops, Bottoms, Dresses & dungarees, Full outfits, Add-ons, and Shoes & socks. The existing undershirt remains the base top. The registered sailor top can pair with base shorts, navy shorts or the gingham skirt. Selecting a top/bottom switches out of a one-piece outfit; selecting a dress/full outfit clears separates while retaining the cardigan and footwear. Library cardigan is an independent add-on with its cream dress removed at render time; its right view is registered 18px higher to match the base shoulder. No image generation or source asset edits were used.

The compositor reuses bounded, cached layers and loads selected masters concurrently. Saved dolls migrate their original shoes, sailor separates and cardigan choice. The cardigan regression verifies the dress below y=320 is unchanged and the phone test checks independent choices, dress switching and save/load.

TODO: expand individually fitted tops/trousers and dedicated item thumbnails later. Soccer/pyjama trial separations exposed sleeve/cuff/waist registration mismatches, so they remain complete outfits. The UI explicitly labels costumes that stay together. Review all four views before adding more separates; do not blindly crop every sheet into top and bottom. Existing original masters are retained for future repair.

## Original phone display and named doll sets — 2026-09-15

Phones use the original CSS platform with the scenery canvas hidden and no scenery downloads; desktop users can select a background. This is the fallback for the remaining iPhone compositing issue. Keep this cut-out is under the custom preview and remains free. Name this doll set / Save doll set charges 5 pennies through the shared wallet (purchases do not consume the showman pass's free-play exemption). Sets are local snapshots in pf-doll-sets-v1 and appear in the character grid. Selecting an existing set is free. Duplicate names are rejected, double clicks are locked, storage is checked before charging, and failed final writes refund the pennies. Existing current-doll storage remains separate.

Checked: phone creator edit/rotation/retry tests, exact one-time charge, insufficient funds, duplicate names, name text escaping, free selection, storage-failure refund, pass purchase deduction, and saved-card rendering after page reload. No images generated.
