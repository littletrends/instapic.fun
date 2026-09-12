// Selected, visually reviewed 8 September sheets. Never use the old vendor cast.
const row=(xs,t,b)=>xs.map(([l,r])=>[l,t,r,b]);
const xs=[[28,388],[411,755],[783,1137],[1152,1507]];
const definition=(id,name,host,file,top,bottom,extra={})=>({
 id,name,host,file,
 source:'assets/restyle/scene-turnarounds-2026-09-09/amusements/'+id+'/front.webp',
 hostRects:row(xs,...top),stallRects:row(xs,...bottom),height:3.5,depth:1.7,
 body:'#374333',trim:'#b78b48',opening:[.23,.35,.77,.79],flip:true,treatment:'parlour',...extra
});
const boothRects=[[16,25,524,810],[545,25,895,810],[916,25,1372,810],[1382,25,1745,810]]
 .map(r=>r.map((v,i)=>v*(i%2?1024/887:1536/1774)));
export const AMUSEMENT_ART={
 'aura-ticket-booth':definition('aura-ticket-booth','Aura’s ticket booth','Aura','aura-ticket-booth-turnaround.png',[0,1],[0,1],{
  height:3.25,depth:1.5,opening:[.25,.46,.75,.735],treatment:'awning',
  source:'assets/restyle/scene-turnarounds-2026-09-09/aura/ticket-booth/front.webp',
  stallRects:boothRects,hostSource:'assets/restyle/scene-turnarounds-2026-09-09/aura/welcoming/front.webp',
  hostRects:[[0,98,450,910],[450,105,747,910],[748,103,1188,910],[1188,100,1520,910]]
 }),
 'horse-carousel':definition('horse-carousel','Carousel Waltz','Florence','01-horse-carousel-turnaround.png',[105,468],[554,940]),
 'ferris-wheel':definition('ferris-wheel','Pocket Wheel','Jasper','02-ferris-wheel-turnaround.png',[65,445],[546,942],{height:5.25}),
 'helter-skelter':definition('helter-skelter','Spiral Slide','Tilly','03-helter-skelter-turnaround-v2.png',[123,462],[546,951],{
  height:4.65,stallRects:[[35,548,372,951],[412,526,751,951],[788,526,1135,951],[1154,526,1506,951]]
 }),
 'chair-swings':definition('chair-swings','Flying Chairs','Hugo','04-chair-swings-turnaround-v2.png',[60,431],[529,939]),
 'funhouse':definition('funhouse','Laughing Doorway','Juno','05-funhouse-turnaround.png',[100,498],[591,970],{
  height:3.9,depth:2,opening:[.40,.55,.67,.9],treatment:'parlour',
  stallRects:row([[25,371],[412,743],[779,1122],[1144,1506]],591,970)
 }),
 'fairground-organ':definition('fairground-organ','Fairground Organ','Otto','06-fairground-organ-turnaround.png',[106,481],[548,938],{
  height:3.1,depth:1.35,opening:[.22,.28,.80,.55],treatment:'parlour'
 }),
 'balloon-tree':definition('balloon-tree','Balloon Garden','Nell','07-balloon-tree-turnaround-v4.png',[139,504],[549,946],{
  height:3.0,
  // Nell's sheet reverses the profile columns; the attraction row does not.
  hostRects:row([[46,378],[1140,1490],[781,1125],[410,751]],139,504)
 }),
 'alley-wall-bay':definition('alley-wall-bay','Painted Bay','Arlo','08-alley-wall-bay-turnaround.png',[107,488],[567,949],{
  height:3.5,depth:.65,opening:[.27,.47,.63,.81],treatment:'awning',
  stallRects:row([[42,388],[420,754],[785,1130],[1148,1501]],567,949)
 })
};
// Midpoint of the walkable aisle (1.62) and the illustrated walls (4.86), so
// stalls sit in front of their wall instead of hugging the path.
export const BAY_X=3.24;
// Rides sit deeper in the wall bay and a fraction of a stall-step along the
// boards, so they zigzag like the tents instead of standing face-to-face.
export const RIDE_X=3.74;
export const AMUSEMENT_PLACES=[
 ['horse-carousel',RIDE_X,0.4],['fairground-organ',-RIDE_X,1.4],['helter-skelter',-RIDE_X,3.4],
 ['ferris-wheel',RIDE_X,6.4],['chair-swings',-RIDE_X,9.4],['funhouse',RIDE_X,12.4],
 ['balloon-tree',-RIDE_X,15.4],['alley-wall-bay',RIDE_X,18.4]
];
// One lot per attraction. Rides are not parked in a tent bay — they get their
// own Z and their own wall, inserted after stall floor(bay).
export function midwayLots(stallIds){
 const rides=AMUSEMENT_PLACES.map(([id,x,bay])=>({id,side:Math.sign(x)||1,after:Math.floor(bay),bay}))
  .sort((a,b)=>a.bay-b.bay||a.id.localeCompare(b.id));
 const lots=[];
 let ri=0;
 stallIds.forEach((id,i)=>{
  lots.push({kind:'stall',id,side:i%2===0?-1:1});
  while(ri<rides.length&&rides[ri].after===i){
   lots.push({kind:'ride',id:rides[ri].id,side:rides[ri].side});
   ri++;
  }
 });
 while(ri<rides.length){
  lots.push({kind:'ride',id:rides[ri].id,side:rides[ri].side});
  ri++;
 }
 return lots;
}
export const PAPERCUT_ROOT='assets/restyle/scene-turnarounds-2026-09-09';
export const PAPERCUT_VIEWS=['front','left','back','right'];
export const PAPERCUT_SHEET=512;
export const PAPERCUT_FRAMES={
 'horse-carousel':{ride:{front:[58,34,396,446],left:[66,36,380,444],back:[67,32,377,448],right:[57,30,397,450]},
  host:{front:[112,30,288,450],left:[124,30,263,450],back:[141,30,229,450],right:[119,30,274,450]}},
 'fairground-organ':{ride:{front:[67,30,377,450],left:[111,43,289,436],back:[82,38,347,442],right:[121,44,270,436]},
  host:{front:[113,30,285,450],left:[151,30,210,450],back:[125,30,262,450],right:[147,30,217,450]}},
 'helter-skelter':{ride:{front:[133,57,245,423],left:[128,30,255,450],back:[143,34,226,446],right:[125,30,262,450]},
  host:{front:[142,30,228,450],left:[153,30,205,450],back:[146,30,220,450],right:[166,30,179,450]}},
 'ferris-wheel':{ride:{front:[85,30,342,450],left:[94,42,324,438],back:[85,44,342,436],right:[81,39,350,441]},
  host:{front:[120,30,271,450],left:[155,30,202,450],back:[143,30,226,450],right:[139,30,234,450]}},
 'chair-swings':{ride:{front:[65,30,381,450],left:[67,42,377,438],back:[71,42,369,438],right:[66,32,380,448]},
  host:{front:[143,30,225,450],left:[139,30,234,450],back:[145,30,222,450],right:[142,30,228,450]}},
 'funhouse':{ride:{front:[53,35,405,445],left:[70,37,372,443],back:[65,31,382,449],right:[40,35,432,445]},
  host:{front:[104,30,303,450],left:[146,30,219,450],back:[109,30,294,450],right:[130,30,252,450]}},
 'balloon-tree':{ride:{front:[110,31,291,449],left:[130,31,251,449],back:[109,31,293,449],right:[124,31,263,449]},
  host:{front:[97,30,318,450],left:[88,30,336,450],back:[98,30,315,450],right:[90,30,332,450]}},
 'alley-wall-bay':{ride:{front:[71,44,370,436],left:[76,35,359,445],back:[95,54,322,426],right:[73,30,365,450]},
  host:{front:[96,30,319,450],left:[129,30,253,450],back:[100,30,311,450],right:[128,30,255,450]}}
};
export function papercutRideSrc(id,view){return `${PAPERCUT_ROOT}/amusements/${id}/${view}.webp`;}
// Display names can change; the attendant folders stay the original art ids.
const HOST_ART_FOLDER={calliope:'florence',florence:'florence'};
export function papercutHostSrc(host,view){
 const slug=String(host||'').toLowerCase().replace(/[^a-z]+/g,'');
 if(!slug)return '';
 const folder=HOST_ART_FOLDER[slug]||slug;
 return `${PAPERCUT_ROOT}/attendants/${folder}/${view}.webp`;
}
