// New paper interiors. A row becomes playable only after its module and art land.
// The two approved studies retain their own saved implementations.
const rows = [
  ['fortune','Iris','Iris’s Reading','Three cards: past, present, future. A keepsake is hiding in the deck.'],
  ['love','Rosalie','Love Tester','Write two names. Count the loves. Read the heat.'],
  ['curios','Digby','Clockwork Menagerie','Reconnect tracks for a wandering clockwork beetle.'],
  ['lookup','Celeste','A Little Starlight','Turn brass glasses to wake constellations.'],
  ['snap','Felix','Paper Safari','Frame the perfect moment in a moving paper woodland.'],
  ['whisper','Willa','Lost Letter Express','Fly folded letters into their matching letterboxes.'],
  ['ball-toss','Bess','Lantern Toss','Knock the swinging lanterns from a little circus skyline.'],
  ['coin-pusher','Copper','Copper Falls','Time the pusher and move a little tide of pennies.'],
  ['pinball','Pip','Thunder Garden','An old-school pin table. Plunge a penny, tap the flippers, and let the house smile.'],
  ['water-gun','Marina','Paper Harbour','Nudge a little sailboat through a paper harbour.'],
  ['milk-bottles','Mabel','The Topsy Dairy','Topple bottle towers with carefully placed throws.'],
  ['cover-the-spot','Dot','Patchwork Moon','Cover patterned moons with a handful of paper discs.'],
  ['mutoscope','Milo','The Missing Frames','Splice a moving picture back into its proper story.'],
  ['high-striker','Magnus','Bellfoundry','Work a spring hammer to play the tower’s bells.'],
  ['catoptromancy','Opal','Looking-Glass Garden','Move a reflection through two gardens at once.'],
  ['bent-rings','Ringo','The Ring Orchard','Land spinning rings over moving golden branches.'],
  ['plinko','Peggy','Peggy’s Marble Mill','Turn the gates and send marbles through the mill.'],
  ['fairy-floss','Flossie','Cloud Atelier','Wind coloured sugar into a delicate cloud sculpture.'],
  ['popcorn','Poppy','Popcorn Symphony','Catch the popping kernels and keep the kettle singing.'],
  ['duck-pond','Dottie','Duckling Parade','Lead the ducklings home around a winding pond.'],
  ['skee-ball','Skip','Moonbow Alley','Roll a brass ball over a tiny ramp into moonlit bowls.'],
  ['penny-pitch','Penelope','Wishing Wells','Skip pennies across a garden of changing fountains.'],
  ['dunk-tank','Duncan','Splashworks','Aim at the moving bell and release a great paper splash.'],
  ['marquee','Lumi','Light the Night','Conduct a travelling wave of boardwalk lights.'],
  ['pack','Kit','The Impossible Suitcase','Rotate and pack awkward little treasures for a journey.'],
  ['pass','Bea','Backstage Run','Slip through moving scenery to reach the final curtain.'],
  ['carousel','Calliope','Carousel Waltz','Stop the spinning treasures when the matching ride reaches the lantern.'],
  ['balloons','Nell','Balloon Garden','Pop the matching paper balloons as they drift through the garden.'],
  ['ferris','Jasper','Pocket Wheel','Stop the ferris wheel when the matching cabin kisses the crescent.'],
  ['helter','Tilly','Spiral Slide','Catch every gold ring on the way down the paper helter-skelter.'],
  ['swings','Hugo','Chair Waltz','Catch the matching chair as it sweeps over the front mat.'],
  ['funhouse','Juno','Laughing Doorway','Remember the real laugh after the mirrors shuffle.'],
  ['organ','Otto','Calliope Keys','Tap the organ notes as they cross the gold bar.'],
  ['mural','Arlo','Painted Bay','Stamp the fading patches until the alley wall remembers.'],
];
const built = new Set(['fortune','love','curios','snap','whisper','ball-toss','coin-pusher','pinball','lookup','water-gun','milk-bottles','cover-the-spot','mutoscope','high-striker','catoptromancy','bent-rings','plinko','fairy-floss','popcorn','duck-pond','skee-ball','penny-pitch','dunk-tank','marquee','pack','pass','carousel','balloons','ferris','helter','swings','funhouse','organ','mural']);
const restyled = new Set(['coin-pusher','whisper','pack','love','curios','duck-pond','fortune','ball-toss','snap','pinball','lookup','water-gun','milk-bottles','cover-the-spot','mutoscope','high-striker','catoptromancy','bent-rings','plinko','fairy-floss','popcorn','skee-ball','penny-pitch','dunk-tank','marquee','pass','carousel','balloons','ferris','helter','swings','funhouse','organ','mural']);
export const games = rows.map(([id,host,title,blurb,direct,flag]) => ({
  id,host,title,blurb,direct,
  workshop: flag === 'workshop',
  ready: Boolean(direct)||built.has(id),
  restyle: restyled.has(id),
  asset: `./assets/${id}.png`,
  module: `./stalls/${id}.js`,
}));
export const byId = Object.fromEntries(games.map(g=>[g.id,g]));
