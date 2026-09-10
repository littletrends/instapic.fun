// Individually reviewed 8 September turnaround sheets. Rectangles use a 1536x1024
// reference grid, independent of the actual image resolution. Never crop by quarters:
// the front views are often wider, and headers/labels occur at different heights.
import { VENDOR_DESIGNS } from '../vendor-designs.js?v=roomier-6';
const rows=[
// id, selected sheet, x boundaries, host y, stall y, height/depth, opening, side flip, treatment
['fortune','01-fortune',[20,398,738,1120,1510],[100,458],[507,943],3.7,1.85,[.23,.53,.76,.94],true,'parlour'],
['love','02-love-v2',[25,463,773,1120,1510],[90,450],[500,946],3.5,1.65,[.25,.46,.77,.95],false,'parlour'],
['curios',null,null,null,null,3.5,1.85,null,true,'digby'],
['lookup','04-lookup',[20,430,756,1130,1530],[108,445],[509,929],3.8,1.90,[.22,.49,.76,.94],true,'parlour'],
['snap','05-snap',[30,466,750,1142,1518],[102,476],[529,925],3.4,1.70,[.23,.39,.74,.94],false,'camera'],
['whisper','06-whisper',[25,467,742,1145,1505],[88,457],[506,946],3.5,1.65,[.27,.43,.80,.76],true,'counter'],
['ball-toss','07-ball-toss-v2',[25,448,747,1148,1495],[48,411],[495,930],3.4,1.85,[.21,.44,.78,.76],true,'awning'],
['coin-pusher','08-coin-pusher',[25,466,741,1130,1490],[91,490],[529,960],3.3,1.85,[.23,.46,.78,.79],false,'slope'],
['pinball','09-pinball',[20,420,744,1125,1480],[109,464],[505,947],3.5,1.95,[.24,.40,.78,.80],false,'slope'],
['water-gun','10-water-gun',[10,475,741,1180,1520],[101,482],[514,958],3.3,1.85,[.24,.40,.82,.78],false,'counter'],
['milk-bottles','11-milk-bottles-v2',[20,510,740,1168,1500],[105,448],[498,919],3.15,1.8,[.25,.44,.82,.78],false,'awning'],
['cover-the-spot','12-cover-the-spot',[28,436,736,1150,1490],[86,478],[538,948],3.25,1.85,[.20,.39,.78,.79],false,'slope'],
['mutoscope','13-mutoscope-v3',[30,438,766,1125,1485],[111,449],[503,931],3.55,1.65,[.25,.46,.76,.88],true,'parlour'],
['high-striker','14-high-striker',[30,417,749,1115,1490],[56,421],[484,921],4.05,1.75,[.38,.26,.60,.79],true,'tower'],
['catoptromancy','15-catoptromancy',[23,461,750,1168,1490],[51,424],[532,953],3.4,1.75,[.25,.40,.75,.93],false,'parlour'],
['bent-rings','16-bent-rings',[35,472,739,1115,1487],[35,428],[512,950],3.4,1.65,[.25,.47,.77,.78],false,'pagoda'],
['plinko','17-plinko-v2',[30,409,749,1138,1495],[70,437],[484,936],3.6,1.85,[.25,.36,.75,.86],true,'slope'],
['fairy-floss','18-fairy-floss',[40,469,746,1130,1480],[48,420],[492,934],3.05,1.50,[.22,.45,.85,.73],true,'cart'],
['popcorn','19-popcorn-v2',[40,450,736,1138,1485],[87,459],[512,944],3.15,1.5,[.24,.45,.77,.74],false,'cart'],
['duck-pond','20-duck-pond-v2',[50,433,742,1140,1490],[107,458],[512,931],3.2,1.8,[.20,.38,.80,.77],false,'pond'],
['skee-ball','21-skee-ball-v2',[35,404,751,1090,1490],[112,442],[511,946],3.5,1.98,[.27,.42,.80,.90],false,'ramp'],
['penny-pitch','22-penny-pitch-v2',[26,429,746,1145,1490],[111,435],[484,913],3.4,1.8,[.23,.42,.78,.78],false,'counter'],
['dunk-tank','23-dunk-tank-v3',[44,474,758,1110,1465],[21,404],[481,938],3.55,1.8,[.23,.39,.82,.77],false,'tank'],
['marquee','24-marquee',[32,456,765,1145,1490],[125,477],[532,951],3.4,1.6,[.20,.48,.78,.79],false,'lights'],
['pack','25-pack-v2',[24,455,741,1135,1490],[104,484],[538,948],3.05,1.5,[.18,.45,.85,.73],true,'cart'],
['pass','26-pass',[35,456,744,1135,1485],[103,458],[520,932],3.6,1.5,[.25,.40,.76,.95],true,'parlour']
];
export const STALL_ART=Object.fromEntries(rows.map(([id,file,columns,hostY,stallY,height,depth,opening,flip,treatment])=>{
 const rects=y=>columns?.slice(0,4).map((x,i)=>[x,y[0],columns[i+1],y[1]]);
 return [id,{...VENDOR_DESIGNS[id],file,source:file?`assets/restyle/stalls/sheets/${file}.webp`:null,hostRects:hostY?rects(hostY):null,stallRects:stallY?rects(stallY):null,height,depth,opening,flip,treatment}];
}));
// Exclude decorative cell separator lines in Felix's otherwise tightly packed sheet.
STALL_ART.snap.hostRects=[[110,102,420,476],[475,102,725,476],[800,102,1090,476],[1150,102,1470,476]];
STALL_ART.snap.stallRects=[[30,529,464,925],[480,529,740,925],[762,529,1138,925],[1180,529,1518,925]];
STALL_ART.catoptromancy.stallRects[0][3]=963;
// Bess/Opal/Flossie/Ringo have titles BETWEEN rows; per-cell tops keep those titles
// out without losing the taller front finial. Same source art, no redesign.
for(let i=1;i<4;i++)STALL_ART['ball-toss'].stallRects[i][1]=508;
for(let i=1;i<4;i++)STALL_ART['fairy-floss'].stallRects[i][1]=530;
for(let i=1;i<4;i++)STALL_ART['bent-rings'].stallRects[i][1]=522;
// Skin-coloured background is keyed only when connected to a crop edge.
export const ART_VERSION='stalls-26-1';
const names=['Mystic Tent','Love Tester','Digger’s Vault','Star-Gazing Tent','Flash Booth','Gossip Booth','Barely-Fit Toss','Coin Pusher Shelf','Pinball Alley','Water Gun Duel','Weighted Bottles','Cover-the-Spot','Mutoscope Hood','High Striker','Catoptromancy','Bent Ring Pegs','Plinko Pegboard','Fairy Floss Wheel','Popcorn Kettle','Duck Pond Hook','Skee-Ball Alley','Penny Pitch','Dunk the Barker','Boardwalk Lights','Night Kit','Backstage Flap'];
Object.values(STALL_ART).forEach((d,i)=>d.name=names[i]);
