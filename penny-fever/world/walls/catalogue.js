import {VENDOR_DESIGNS} from '../vendor-designs.js';
import {AMUSEMENT_PLACES} from '../amusements/catalogue.js';

const rows=[
 {
  "id": "fortune",
  "name": "Mystic Tent · Iris",
  "group": "vendor",
  "theme": "plum and antique gold, crescent moons and star fretwork",
  "secret": "a moon-locked tall door and tiny tunnel hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/fortune-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/fortune-wall-turnaround.png"
 },
 {
  "id": "love",
  "name": "Love Tester · Rosalie",
  "group": "vendor",
  "theme": "dusty rose, burgundy and antique gold; layered hearts and roses",
  "secret": "a heart-key lock on a tall secret door and a rose-covered low hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/love-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/love-wall-turnaround.png"
 },
 {
  "id": "curios",
  "name": "Curios · Digby",
  "group": "vendor",
  "theme": "forest green and aged brass; keys, lock escutcheons and tiny cabinet reliefs",
  "secret": "an oversized keyhole door and disguised little cupboard tunnel",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/curios-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/curios-wall-turnaround.png"
 },
 {
  "id": "lookup",
  "name": "Look Up · Celeste",
  "group": "vendor",
  "theme": "midnight blue and gold with silver accents; constellations and celestial circles",
  "secret": "a star-lock observatory door and crescent crawl hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/lookup-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/lookup-wall-turnaround.png"
 },
 {
  "id": "snap",
  "name": "SNAP · Felix",
  "group": "vendor",
  "theme": "deep teal and brass; Art Nouveau camera iris, flash and film-edge relief motifs",
  "secret": "a shutter-pattern darkroom door and small film-canister hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/snap-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/snap-wall-turnaround.png"
 },
 {
  "id": "whisper",
  "name": "Whisper · Willa",
  "group": "vendor",
  "theme": "lavender, plum and faded brass; envelopes, wings and heart seals",
  "secret": "a letter-slot secret door and sealed envelope cupboard",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/whisper-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/whisper-wall-turnaround.png"
 },
 {
  "id": "ball-toss",
  "name": "Ball Toss · Bess",
  "group": "vendor",
  "theme": "rust red and cream with gilt trim; circus scallops and three-ball motifs",
  "secret": "a brass ball-lock door and striped low trapdoor",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/ball-toss-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/ball-toss-wall-turnaround.png"
 },
 {
  "id": "coin-pusher",
  "name": "Coin Pusher · Copper",
  "group": "vendor",
  "theme": "dark walnut and burnished copper; pressed pennies and coin channels",
  "secret": "a round coin-lock vault door and little counting-room hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/coin-pusher-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/coin-pusher-wall-turnaround.png"
 },
 {
  "id": "pinball",
  "name": "Pinball · Pip",
  "group": "vendor",
  "theme": "indigo and dusty pink with brass relief; lightning bolts and silver pinball tracks",
  "secret": "a lightning-locked service door and small silver-ball hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/pinball-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/pinball-wall-turnaround.png"
 },
 {
  "id": "water-gun",
  "name": "Water Gun · Marina",
  "group": "vendor",
  "theme": "petrol blue, teal and aged gold; curling paper waves and droplets",
  "secret": "a wave-wheel lock door and low porthole tunnel",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/water-gun-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/water-gun-wall-turnaround.png"
 },
 {
  "id": "milk-bottles",
  "name": "Milk Bottles · Mabel",
  "group": "vendor",
  "theme": "sage green, aged ivory and gold; milk-bottle silhouettes and dairy scallops",
  "secret": "a milk-churn latch door and tiny delivery hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/milk-bottles-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/milk-bottles-wall-turnaround.png"
 },
 {
  "id": "cover-the-spot",
  "name": "Cover the Spot · Dot",
  "group": "vendor",
  "theme": "dusty brick red, cream and gold; overlapping circle medallions",
  "secret": "a three-disc puzzle-lock door and dotted crawl hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/cover-the-spot-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/cover-the-spot-wall-turnaround.png"
 },
 {
  "id": "mutoscope",
  "name": "Mutoscope · Milo",
  "group": "vendor",
  "theme": "dark tobacco brown and antique brass; film reels and picture frames",
  "secret": "a film-reel lock door and projection-room tunnel hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/mutoscope-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/mutoscope-wall-turnaround.png"
 },
 {
  "id": "high-striker",
  "name": "High Striker · Magnus",
  "group": "vendor",
  "theme": "oxblood and brass; bell reliefs and rising scale marks",
  "secret": "a hammer-and-bell lock door and strength-tester service hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/high-striker-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/high-striker-wall-turnaround.png"
 },
 {
  "id": "catoptromancy",
  "name": "Looking Glass · Opal",
  "group": "vendor",
  "theme": "smoky violet and tarnished silver-gold; ornate mirrors and reflected moons",
  "secret": "a mirror-shaped secret door and little silver-framed hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/catoptromancy-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/catoptromancy-wall-turnaround.png"
 },
 {
  "id": "bent-rings",
  "name": "Bent Rings · Ringo",
  "group": "vendor",
  "theme": "olive green and gold; interlocking ring reliefs and pagoda curls",
  "secret": "a ring puzzle lock door and circular crawl hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/bent-rings-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/bent-rings-wall-turnaround.png"
 },
 {
  "id": "plinko",
  "name": "Plinko · Peggy",
  "group": "vendor",
  "theme": "deep jade and gold; decorative rows of pegs and falling discs",
  "secret": "a pegboard-pattern hidden door and low disc hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/plinko-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/plinko-wall-turnaround.png"
 },
 {
  "id": "fairy-floss",
  "name": "Fairy Floss · Flossie",
  "group": "vendor",
  "theme": "muted mauve-pink, faded cream and brass; layered spun-sugar clouds",
  "secret": "a cloud-shaped lock door and sweet-shop tunnel hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/fairy-floss-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/fairy-floss-wall-turnaround.png"
 },
 {
  "id": "popcorn",
  "name": "Popcorn · Poppy",
  "group": "vendor",
  "theme": "warm caramel, cream and gold with restrained burgundy accents; kernels and scallops",
  "secret": "a popcorn-box patterned secret door and corn-kernel hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/popcorn-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/popcorn-wall-turnaround.png"
 },
 {
  "id": "duck-pond",
  "name": "Duck Pond · Dottie",
  "group": "vendor",
  "theme": "pond green, pale gold and soft blue; reeds, ripples and tiny duck reliefs",
  "secret": "a duck-key garden door and low ripple-shaped tunnel",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/duck-pond-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/duck-pond-wall-turnaround.png"
 },
 {
  "id": "skee-ball",
  "name": "Skee Ball · Skip",
  "group": "vendor",
  "theme": "slate blue, warm timber and gold; concentric score rings",
  "secret": "a target-lock door and round ball-return hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/skee-ball-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/skee-ball-wall-turnaround.png"
 },
 {
  "id": "penny-pitch",
  "name": "Penny Pitch · Penelope",
  "group": "vendor",
  "theme": "terracotta, peach and brass; scalloped plates, leaves and pressed pennies",
  "secret": "a penny-slot garden door and dish-shaped low hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/penny-pitch-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/penny-pitch-wall-turnaround.png"
 },
 {
  "id": "dunk-tank",
  "name": "Dunk Tank · Duncan",
  "group": "vendor",
  "theme": "turquoise, weathered cream and brass; waves and life-ring motifs",
  "secret": "a life-ring lock door and storm-drain style tunnel hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/dunk-tank-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/dunk-tank-wall-turnaround.png"
 },
 {
  "id": "marquee",
  "name": "Marquee · Lumi",
  "group": "vendor",
  "theme": "antique olive-gold and dark wood; tiny warm bulb housings and starburst reliefs",
  "secret": "a star-key backstage door and electrician cupboard hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/marquee-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/marquee-wall-turnaround.png"
 },
 {
  "id": "pack",
  "name": "Pack · Kit",
  "group": "vendor",
  "theme": "sage green, leather-brown and antique brass; travel trunks and luggage tags",
  "secret": "a suitcase-clasp door and luggage-room tunnel hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/pack-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/pack-wall-turnaround.png"
 },
 {
  "id": "pass",
  "name": "Showman’s Pass · Bea",
  "group": "vendor",
  "theme": "wine-red and old gold; layered velvet-paper curtain swags and tickets",
  "secret": "a ticket-slot locked backstage door and curtain-hidden low hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/pass-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/pass-wall-turnaround.png"
 },
 {
  "id": "horse-carousel",
  "name": "Horse Carousel · Florence",
  "group": "amusement",
  "theme": "deep burgundy, evergreen and gold; carved-paper horses and carousel canopy scallops",
  "secret": "a horse-key stable door and small gilded service hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/horse-carousel-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/horse-carousel-wall-turnaround.png"
 },
 {
  "id": "ferris-wheel",
  "name": "Ferris Wheel · Jasper",
  "group": "amusement",
  "theme": "forest green, ochre and gold; wheel spokes and little gondola reliefs",
  "secret": "a spoke-wheel locked door and low machinery hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/ferris-wheel-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/ferris-wheel-wall-turnaround.png"
 },
 {
  "id": "helter-skelter",
  "name": "Helter-skelter · Tilly",
  "group": "amusement",
  "theme": "faded vermilion, plum and gold; spiral ribbons and tower crenellations",
  "secret": "a spiral-latch tower door and round tunnel hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/helter-skelter-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/helter-skelter-wall-turnaround.png"
 },
 {
  "id": "chair-swings",
  "name": "Chair Swings · Hugo",
  "group": "amusement",
  "theme": "burgundy, green and gold; hanging chains, hearts and chair silhouettes",
  "secret": "a chain-and-heart locked service door and low hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/chair-swings-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/chair-swings-wall-turnaround.png"
 },
 {
  "id": "funhouse",
  "name": "Funhouse · Juno",
  "group": "amusement",
  "theme": "dark green, burgundy and aged gold; theatrical mask reliefs and wavy framing",
  "secret": "a sly smiling mask door and skewed small secret hatch; charming not horror",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/funhouse-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/funhouse-wall-turnaround.png"
 },
 {
  "id": "fairground-organ",
  "name": "Fairground Organ · Otto",
  "group": "amusement",
  "theme": "walnut, dark green and brass; pipe-organ reliefs and music scrolls",
  "secret": "a treble-key organ-service door and small music-box tunnel hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/fairground-organ-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/fairground-organ-wall-turnaround.png"
 },
 {
  "id": "balloon-tree",
  "name": "Balloon Tree · Nell",
  "group": "amusement",
  "theme": "plum, emerald and burgundy with antique gold; raised balloon clusters and tied ribbons",
  "secret": "a ribbon-lock garden door and little balloon-shaped hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/balloon-tree-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/balloon-tree-wall-turnaround.png"
 },
 {
  "id": "alley-wall-bay",
  "name": "Painted Alley Bay · Arlo",
  "group": "amusement",
  "theme": "deep green, rust-red awnings and gilt trim; theatrical window panels",
  "secret": "a key-locked mural door and discreet tunnel behind a low panel",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/alley-wall-bay-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/alley-wall-bay-wall-turnaround.png"
 },
 {
  "id": "foyer",
  "name": "Foyer · first paper passage",
  "group": "entrance",
  "theme": "aged cream, deep evergreen and gold; little yellow crown reliefs and heart scrollwork",
  "secret": "a closed crown-locked side door and tiny curiosity hatch; wall segment not a gateway across the path",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/foyer-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/foyer-wall-turnaround.png"
 },
 {
  "id": "aura-ticket-booth",
  "name": "Aura · ticket counter backdrop",
  "group": "entrance",
  "theme": "evergreen, burgundy and gold; yellow crown medallion and torn-ticket reliefs",
  "secret": "a heart-and-crown private door and ticket-shaped locked hatch",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/aura-ticket-booth-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/aura-ticket-booth-wall-turnaround.png"
 },
 {
  "id": "end-curtain",
  "name": "End Curtain · behind the show",
  "group": "entrance",
  "theme": "deep burgundy velvet-paper and gold; layered curtain swags and heart-crown crest",
  "secret": "a closed curtain-framed backstage door and hidden little panel tunnel; no readable signs",
  "width": 6.4,
  "height": 4.2,
  "depth": 0.22,
  "source": "assets/restyle/walls/runtime/end-curtain-wall-turnaround.webp",
  "sheet": "assets/restyle/walls/sheets/end-curtain-wall-turnaround.png"
 }
];
export const WALL_ART=Object.fromEntries(rows.map(d=>[d.id,d]));
// Sit behind Acer stalls (x=±2.62) and the old paper trim (~4.2).
export const WALL_RADIAL=4.86;
export const WALL_VIEWS=['front','back','left-three-quarter','right-three-quarter'];
export function wallPlacements(len,{
 stallStart=14,stallStep=5.2,wallX=WALL_RADIAL,overlap=.18,foyerStart=1.2
}={}){
 const sites=Object.values(VENDOR_DESIGNS).map(d=>({
  id:d.id,side:d.index%2===0?-1:1,z:stallStart+d.index*stallStep
 }));
 for(const [id,x,bay] of AMUSEMENT_PLACES)sites.push({id,side:Math.sign(x),z:stallStart+bay*stallStep});
 sites.push({id:'foyer',side:-1,z:4},{id:'foyer',side:1,z:4},
  {id:'aura-ticket-booth',side:-1,z:6.2});
 const result=[];
 for(const side of [-1,1]){
  const line=sites.filter(p=>p.side===side).sort((a,b)=>a.z-b.z);
  line.forEach((site,i)=>{
   const lo=i?(line[i-1].z+site.z)/2:foyerStart;
   const hi=i<line.length-1?(site.z+line[i+1].z)/2:len+1.6;
   const span=hi-lo,width=span*(1+overlap),z=(lo+hi)/2;
   result.push({...site,z,attractionZ:site.z,width,height:5.4,fit:'width',
    x:side*wallX,yaw:-side*Math.PI/2,side,
    bounds:[z-width/2,z+width/2],key:site.id+'-'+side+'-'+site.z});
  });
 }
 result.push({id:'end-curtain',key:'end-curtain',side:0,x:0,z:len+1.5,width:wallX*2.15,height:6.2,fit:'width',yaw:Math.PI});
 return result;
}
export function plannedSecrets(id){
 return [{id:id+':hidden-door',kind:'locked-door',enabled:false,local:[0,1,.14]},
  {id:id+':tunnel',kind:'tunnel-hatch',enabled:false,local:[1.6,.35,.14]},
  {id:id+':backstage',kind:'future-hideaway',enabled:false,local:[0,0,-1.2]}];
}
