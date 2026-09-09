// New paper interiors. A row becomes playable only after its module and art land.
// The two approved studies retain their own saved implementations.
const rows = [
  ['fortune','Iris','Fate’s Loom','Weave a fortune through a moving moon garden.'],
  ['love','Rosalie','Heartstrings','Swing a little heart from ribbon to ribbon.'],
  ['curios','Digby','Clockwork Menagerie','Reconnect tracks for a wandering clockwork beetle.'],
  ['lookup','Celeste','A Little Starlight','Turn brass glasses to wake constellations.','../experiments/celestes-starlight/'],
  ['snap','Felix','Paper Safari','Frame the perfect moment in a moving paper woodland.'],
  ['whisper','Willa','Lost Letter Express','Fly folded letters into their matching letterboxes.'],
  ['ball-toss','Bess','Lantern Toss','Knock the swinging lanterns from a little circus skyline.'],
  ['coin-pusher','Copper','Copper Falls','Time the pusher and move a little tide of pennies.'],
  ['pinball','Pip','Thunder Garden','Keep a silver seed alive among ringing brass flowers.'],
  ['water-gun','Marina','Paper Harbour','Nudge a little sailboat through a paper harbour.','../experiments/brasswater-harbour/'],
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
];
const built = new Set(['fortune','love','curios','snap','whisper','ball-toss','coin-pusher','pinball','milk-bottles','cover-the-spot','mutoscope','high-striker','catoptromancy','bent-rings','plinko','fairy-floss','popcorn','duck-pond','skee-ball']);
export const games = rows.map(([id,host,title,blurb,direct]) => ({id,host,title,blurb,direct,ready: Boolean(direct)||built.has(id),asset:`assets/${id}.png`,module:`./stalls/${id}.js`}));
export const byId = Object.fromEntries(games.map(g=>[g.id,g]));
