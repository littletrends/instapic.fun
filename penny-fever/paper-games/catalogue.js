// New paper interiors. A row becomes playable only after its module and art land.
// The two approved studies retain their own saved implementations.
const rows = [
  ["fortune","Iris","Catch the Fortune","Remember the sign, then stop the rings in the glow."],
  ["love","Rosalie","Heart on the Breeze","Guide the heart through the gates and land it in the rose basket."],
  ["curios","Digby","Cabinet Heist","Open the clockwork vault, then deliver the marked capsules with the claw."],
  ["lookup","Celeste","Orbit Hop","Hop between the lights and land in the lantern."],
  ['snap','Felix','Instapic Penny Fever Photo Booth','Webcam Try, then the website bonus preview. Game-only. Not the Darwin machines.', 'workshop/felix-booth.html?v=carnival-43'],
  ["whisper","Willa","Whisper Weave","Loop matching seals and deliver the folded secrets."],
  ["ball-toss","Bess","Paper Plate Parade","Read the moving stands and bring every plate into the trough."],
  ["coin-pusher","Copper","Copper Falls","Time each drop and push the chapter treasure into the collection cup."],
  ["pinball","Pip","Pinball Alley","Six pinball worlds, three balls and a chapter treasure to win."],
  ["water-gun","Marina","Water-Gun Fleet","Build your rhythm and bring the paper boats home."],
  ["milk-bottles","Mabel","Milk Match","Match the milk bottles and fill the waiting crates."],
  ["cover-the-spot","Dot","Paper Veil","Fit the papers around the tacks and hide every ink speck."],
  ["mutoscope","Milo","Flicker Reel","Arrange the little scenes and run the finished reel."],
  ["high-striker","Magnus","Bellworks","Clear the braces and send the weight up to the bell."],
  ["catoptromancy","Opal","Lantern Theatre","Turn the mirrors and wake all three blooms."],
  ["bent-rings","Ringo","Streamer Knots","Make room, pull the ribbons and thread each matching clasp."],
  ["plinko","Peggy","Marble Mill","Turn the mills and guide every marble into its catcher."],
  ["fairy-floss","Flossie","Sugar Unspool","Unwind the sugar layers and serve the right flavours."],
  ["popcorn","Poppy","Paper Popcorn","Start the kettle, catch the pops and pour the waiting orders."],
  ["duck-pond","Dottie","Ripple Rumble","Choose where to splash and guide the ducks around the pond."],
  ["skee-ball","Skip","Moonbow Skee-Ball","Flick up the cabinet and land the required pocket shots."],
  ["penny-pitch","Penelope","Wishing Waters","Use ripples to collect the ribbon wishes and reach the arch."],
  ["dunk-tank","Duncan","Pressure Drop","Seal the pipes, catch the pressure and dunk the clockwork duck."],
  ["marquee","Lumi","Light Parade","Send the right sparks through the curtains and light the marquee."],
  ["pack","Kit","The Impossible Suitcase","Fit every odd parcel and close the brass-latched case."],
  ["pass","Bea","Opening Night","Deliver the invitation seals and climb to the top curtain."],
  ["carousel","Florence","Carousel Waltz","Guide the miniature ride through its ribbons and bring the horses home."],
  ["balloons","Nell","Balloon Garden","Match the colours and let every loose balloon settle into its basket."],
  ["ferris","Jasper","Last Boarding","Seat the waiting guests and take everyone on a full turn."],
  ["helter","Tilly","Spiral Slide","Climb with the keepsake, then jump and brake down the spiral."],
  ["swings","Hugo","Skyward Swings","Time each release and guide the rider to the exit."],
  ["funhouse","Juno","Turning Funhouse","Turn the rooms, find the bell and key, then reach the exit."],
  ["organ","Otto","Calliope Keys","Join the score and play its lantern notes on the organ."],
  ["mural","Arlo","Fold Trail","Fold the paper route and carry the letter to its destination."],
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
  module: `./stalls/${id}.js?v=paper33-v1`,
}));
export const byId = Object.fromEntries(games.map(g=>[g.id,g]));
