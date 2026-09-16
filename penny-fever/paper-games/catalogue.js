// New paper interiors. A row becomes playable only after its module and art land.
// The two approved studies retain their own saved implementations.
const rows = [
  ['fortune','Iris','Catch the Fortune','The globe flashes a sign. Brake the rings before it fades.'],
  ['love','Rosalie','Love Tester','Write the names. Count the letters. Add them down.'],
  ['curios','Digby','The Cabinet That Lies','Several drawers. Several clues. Something is lying.'],
  ['lookup','Celeste','A Little Starlight','Turn brass glasses to wake constellations.'],
  ['snap','Felix','Instapic Photo Booth','Closed for maintenance. The paper booth will open later.'],
  ['whisper','Willa','Whisper Run','Read the secret. Cross the board. Pick the phrase you remember.'],
  ['ball-toss','Bess','Impossible Plates','Three balls, a barely-fit plate. Pull back and throw clean through.'],
  ['coin-pusher','Copper','Copper Falls','Every penny leaves its mark. Push the unique over the edge.'],
  ['pinball','Pip','Pinball Alley','Six tables. Three balls a penny. Loosen the unique on the glass.'],
  ['water-gun','Marina','Water-Gun Fleet','Five brass guns. Lead the boats. One tank of bursts.'],
  ['milk-bottles','Mabel','Milky Splash!','Match the dairy bottles. Drop the unique into the crate.'],
  ['cover-the-spot','Dot','Vanishing Spot','Watch the gold spot. Tap the right cover when the shuffle ends.'],
  ['mutoscope','Milo','Flicker Reel','Brake the reel when the unique frame sits in the window.'],
  ['high-striker','Magnus','Perfect Strike','Hard isn’t enough. Ring the called bell with the right power.'],
  ['catoptromancy','Opal','Shattered Fate','Rebuild the looking-glass. The sealed image is the reward.'],
  ['bent-rings','Ringo','Ring Raiders','Loop the advancing pegs. The unique is strapped to one of them.'],
  ['plinko','Peggy','Marble Mill','Drop a marble. Strike the hanging unique before the drain.'],
  ['fairy-floss','Flossie','Sugar Cyclone','Grow a sugar trail in the bowl. Don’t tangle the recipe.'],
  ['popcorn','Poppy','Kernel Run','Harvest, mill, kettle, fair. Deliver the load.'],
  ['duck-pond','Dottie','Duckling Parade','Rotate the pads. The ducklings paddle themselves home.'],
  ['skee-ball','Skip','Moonbow Skee-Ball','Five balls. Land one in the marked moon.'],
  ['penny-pitch','Penelope','Dish Garden','Pitch, then one tablecloth tug. Land in the marked bowl.'],
  ['dunk-tank','Duncan','Pressure Drop','Turn the pipes, pump, drop the chair. Unique in the tank.'],
  ['marquee','Lumi','Marquee Glowball','Paddle a star-ball. Light the board. Hit the prize lantern.'],
  ['pack','Kit','The Impossible Suitcase','Pack the list. Strap the layers. Unique in the tag.'],
  ['pass','Bea','Opening Night','Guide the key through the wings to the portrait door.'],
  ['carousel','Florence','Carousel Waltz','Tap the crest when it lines up — Mario circle, horse locked.'],
  ['balloons','Nell','Balloon Garden','Pop the glowing balloons to clear the path.'],
  ['ferris','Jasper','Pocket Wheel','Snap in the glow as you climb the wheel.'],
  ['helter','Tilly','Spiral Slide','→ climb · JUMP cushions · clear slides.'],
  ['swings','Hugo','Skyward Swings','Hold until green lined-up, then pop.'],
  ['funhouse','Juno','Laughing Doorway','Shut the punchline — Pac-Man chase through doors.'],
  ['organ','Otto','Calliope Keys','Tap the glowing pipe mouth — no Simon.'],
  ['mural','Arlo','Painted Bay','Splash faded patches until the flood fills.'],
];
const built = new Set(['fortune','love','curios','snap','whisper','ball-toss','coin-pusher','pinball','lookup','water-gun','milk-bottles','cover-the-spot','mutoscope','high-striker','catoptromancy','bent-rings','plinko','fairy-floss','popcorn','duck-pond','skee-ball','penny-pitch','dunk-tank','marquee','pack','pass','carousel','balloons','ferris','helter','swings','funhouse','organ','mural']);
const restyled = new Set(['coin-pusher','whisper','pack','love','curios','duck-pond','fortune','ball-toss','snap','pinball','lookup','water-gun','milk-bottles','cover-the-spot','mutoscope','high-striker','catoptromancy','bent-rings','plinko','fairy-floss','popcorn','skee-ball','penny-pitch','dunk-tank','marquee','pass','carousel','balloons','ferris','helter','swings','funhouse','organ','mural']);
export const games = rows.map(([id,host,title,blurb,direct,flag]) => ({
  id,host,title,blurb,direct,
  workshop: flag === 'workshop',
  ready: Boolean(direct)||built.has(id),
  restyle: restyled.has(id),
  asset: `./assets/${id}.png?v=unique-courts-1`,
  module: `./stalls/${id}.js`,
}));
export const byId = Object.fromEntries(games.map(g=>[g.id,g]));
