// New paper interiors. A row becomes playable only after its module and art land.
// The two approved studies retain their own saved implementations.
const rows = [
  ['fortune','Iris','Catch the Fortune','The globe flashes a sign. Brake the rings before it fades.'],
  ['love','Rosalie','Love Tester','Write the names. Count the letters. Add them down.'],
  ['curios','Digby','Digger’s Vault','Aim the claw. Drop on a glass capsule. Catch Digby’s curios.'],
  ['lookup','Celeste','A Little Starlight','Turn brass glasses to wake constellations.'],
  ['snap','Felix','Instapic Penny Fever Photo Booth','Webcam Try, then the website bonus preview. Game-only. Not the Darwin machines.', 'workshop/felix-booth.html?v=carnival-43'],
  ['whisper','Willa','Whisper Run','Under construction. A new game is on its way.'],
  ['ball-toss','Bess','Impossible Plates','Under construction. A new game is on its way.'],
  ['coin-pusher','Copper','Copper Falls','Every penny leaves its mark. Push the unique over the edge.'],
  ['pinball','Pip','Pinball Alley','Six tables. Three balls a penny. Loosen the unique on the glass.'],
  ['water-gun','Marina','Water-Gun Fleet','Under construction. A new game is on its way.'],
  ['milk-bottles','Mabel','Milky Splash!','Match the dairy bottles. Drop the unique into the crate.'],
  ['cover-the-spot','Dot','Vanishing Spot','Under construction. A new game is on its way.'],
  ['mutoscope','Milo','Flicker Reel','Under construction. A new game is on its way.'],
  ['high-striker','Magnus','Perfect Strike','Under construction. A new game is on its way.'],
  ['catoptromancy','Opal','Shattered Fate','Under construction. A new game is on its way.'],
  ['bent-rings','Ringo','Ring Raiders','Under construction. A new game is on its way.'],
  ['plinko','Peggy','Marble Mill','Under construction. A new game is on its way.'],
  ['fairy-floss','Flossie','Sugar Cyclone','Under construction. A new game is on its way.'],
  ['popcorn','Poppy','Kernel Run','Under construction. A new game is on its way.'],
  ['duck-pond','Dottie','Duckling Parade','Under construction. A new game is on its way.'],
  ['skee-ball','Skip','Moonbow Skee-Ball','Under construction. A new game is on its way.'],
  ['penny-pitch','Penelope','Dish Garden','Under construction. A new game is on its way.'],
  ['dunk-tank','Duncan','Pressure Drop','Under construction. A new game is on its way.'],
  ['marquee','Lumi','Marquee Glowball','Under construction. A new game is on its way.'],
  ['pack','Kit','The Impossible Suitcase','Under construction. A new game is on its way.'],
  ['pass','Bea','Opening Night','Under construction. A new game is on its way.'],
  ['carousel','Florence','Carousel Waltz','Under construction. A new game is on its way.'],
  ['balloons','Nell','Balloon Garden','Under construction. A new game is on its way.'],
  ['ferris','Jasper','Pocket Wheel','Under construction. A new game is on its way.'],
  ['helter','Tilly','Spiral Slide','→ climb · JUMP cushions · clear slides.'],
  ['swings','Hugo','Skyward Swings','Under construction. A new game is on its way.'],
  ['funhouse','Juno','Laughing Doorway','Shut the punchline — Pac-Man chase through doors.'],
  ['organ','Otto','Calliope Keys','Under construction. A new game is on its way.'],
  ['mural','Arlo','Painted Bay','Under construction. A new game is on its way.'],
];
const built = new Set(['fortune','love','curios','snap','whisper','ball-toss','coin-pusher','pinball','lookup','water-gun','milk-bottles','cover-the-spot','mutoscope','high-striker','catoptromancy','bent-rings','plinko','fairy-floss','popcorn','duck-pond','skee-ball','penny-pitch','dunk-tank','marquee','pack','pass','carousel','balloons','ferris','helter','swings','funhouse','organ','mural']);
const restyled = new Set(['coin-pusher','whisper','pack','love','curios','duck-pond','fortune','ball-toss','snap','pinball','lookup','water-gun','milk-bottles','cover-the-spot','mutoscope','high-striker','catoptromancy','bent-rings','plinko','fairy-floss','popcorn','skee-ball','penny-pitch','dunk-tank','marquee','pass','carousel','balloons','ferris','helter','swings','funhouse','organ','mural']);
export const games = rows.map(([id,host,title,blurb,direct,flag]) => ({
  id,host,title,blurb,direct,
  workshop: flag === 'workshop',
  ready: Boolean(direct)||built.has(id),
  restyle: restyled.has(id),
  asset: id==='fortune' ? './assets/fortune.webp?v=iris-globe-1'
    : id==='coin-pusher' ? './assets/coin-pusher.webp?v=iris-globe-1'
    : id==='milk-bottles' ? './assets/milk-bottles.webp?v=milk-props-1'
    : `./assets/${id}.webp?v=game-webp-1`,
  module: `./stalls/${id}.js`,
}));
export const byId = Object.fromEntries(games.map(g=>[g.id,g]));
