/* Shared inventory rules. Existing currency, ticket and curio saves stay authoritative. */
(() => {
  'use strict';
  const rows = [
    ['everyday-penny','Everyday penny','Essentials','currency',null,'Aura’s ticket booth','Your spendable demo pennies.',.07],
    ['admission-ticket','Admission ticket','Essentials','ticket',null,'Aura’s ticket booth','Take a ticket from Aura. Its punched heart remembers your entry.',.025],
    ['showman-pass','Showman pass','Essentials','pass',null,'Backstage · Bea','The demo Showman pass lasts until midnight in Darwin.',.06],
    ['ticket-stub','Ticket stub','Alley Ephemera','curio','ticket_stub','Mystic · Iris','Draw a fortune at the Mystic Tent.',.035],
    ['pressed-heart','Pressed heart','Alley Ephemera','curio','pressed_heart','Night Kit · Kit','Mint a pressed penny pack.',.08],
    ['lucky-match','Lucky match','Alley Ephemera','curio','lucky_match','Mystic · Iris','A kraft-gold fortune leaves a little spark.',.07],
    ['whisper-charm','Whisper charm','Alley Ephemera','curio','whisper_charm','Whisper · Willa','Seal a kind word at the Whisper booth.',.09],
    ['mirror-shard','Mirror shard','Alley Ephemera','curio','mirror_shard','Mystic · Iris','A cream-ticket fortune catches the light.',.06],
    ['showman-ribbon','Showman ribbon','Alley Ephemera','curio','showman_ribbon','Backstage · Bea','Complete a backstage stage, or try the demo Showman pass.',.065],
    ['mercury-bead','Mercury bead','Machine Guts','curio','mercury_bead','Love Tester · Rosalie','Find a little Sweet Heat.',.17],
    ['gyro-ghost','Gyro ghost','Machine Guts','curio','gyro_ghost','Star-Gazing · Celeste','Look up, darling.',.16],
    ['shutter-click','Shutter click','Machine Guts','curio','shutter_click','Flash Booth · Felix','Catch a moment at SNAP.',.09],
    ['sweet-heat','Sweet heat','Machine Guts','curio','sweet_heat','Love Tester · Rosalie','Reach depth three or take home a Love Tester souvenir.',.15],
    ['coin-slot','Coin slot','Machine Guts','curio','coin_slot','Backstage · Bea','Complete a backstage stage, or try the demo Showman pass.',.085],
    ['marquee-bulb','Marquee bulb','Machine Guts','curio','marquee_bulb','Boardwalk Lights · Lumi','Light the marquee, or find an olive-lamp fortune.',.14],
    ['night-suitcase','Night suitcase','Collection rewards','reward',null,'Aura’s welcome','Yours after handing Aura your admission ticket.',.24],
    ['moonlight-wardrobe','Moonlight wardrobe','Collection rewards','reward',null,'Alley collection','Collect all six Alley Ephemera to receive this costume keepsake book.',.12],
    ['coin-sleeve','Coin sleeve','Workshop prizes','prize',null,'Copper Falls · Copper','Catch pennies at Copper Falls.',.08,'gift-wrapping'],
    ['copper-cascade','Copper cascade','Workshop prizes','prize',null,'Copper Falls · Copper','Finish the moon mint at Copper Falls.',.12,'game-prizes'],
    ['penny-tree','Penny tree','Workshop prizes','prize',null,'Copper Falls · Copper','Settle the crowded mint at Copper Falls.',.14,'game-prizes'],
    ['charm-pouch','Charm pouch','Workshop prizes','prize',null,'Lost Letter Express · Willa','Cross the winds at Lost Letter Express.',.08,'gift-wrapping'],
    ['secret-keeper','Secret keeper','Workshop prizes','prize',null,'Lost Letter Express · Willa','Finish the late-night express.',.12,'parlour-prizes'],
    ['penny-purse','Penny purse','Workshop prizes','prize',null,'Impossible Suitcase · Kit','Pack just one more thing.',.1,'pennies'],
    ['penny-collector-book','Penny collector book','Workshop prizes','prize',null,'Impossible Suitcase · Kit','Close the midnight expedition.',.12,'collector-books'],
    ['rose-hair-bow','Rose hair bow','Workshop prizes','prize',null,'Heartstrings · Rosalie','A first flutter at Rosalie’s theatre.',.08,'wearables'],
    ['rose-press','Rose press','Workshop prizes','prize',null,'Heartstrings · Rosalie','A change of heart.',.1,'parlour-prizes'],
    ['rose-lockbox','Rose lockbox','Workshop prizes','prize',null,'Heartstrings · Rosalie','Three keepsakes in the breeze.',.12,'parlour-prizes'],
    ['clockwork-key','Clockwork key','Workshop prizes','prize',null,'Clockwork Menagerie · Digby','Reconnect the runaway beetle’s track.',.1,'machine-curios'],
    ['display-dome','Display dome','Workshop prizes','prize',null,'Clockwork Menagerie · Digby','A curious detour, safely under glass.',.12,'gift-wrapping'],
    ['clockwork-butterfly','Clockwork butterfly','Workshop prizes','prize',null,'Clockwork Menagerie · Digby','Bring the butterfly home.',.16,'future-curios'],
    ['brave-try-ribbon','Brave-try ribbon','Workshop prizes','prize',null,'Duckling Parade · Dottie','Bring the first little wanderers home.',.07,'awards'],
    ['lucky-dish','Lucky dish','Workshop prizes','prize',null,'Duckling Parade · Dottie','Lead them to the willow house.',.1,'garden-prizes'],
    ['crowned-duck','Crowned duck','Workshop prizes','prize',null,'Duckling Parade · Dottie','Finish the grand duck parade.',.12,'garden-prizes'],
  ];
  const hingedIds = ['admission-ticket','night-suitcase','moonlight-wardrobe'];
  const definitions = Object.freeze(rows.map(([id,name,category,kind,key,source,hint,depth,collection]) => Object.freeze({
    id,name,category,kind,key,source,hint,depth,
    alpha: Boolean(collection),
    asset: collection
      ? `assets/restyle/game-sprites/${collection}/${id}/front.png`
      : `assets/restyle/items/${id}.png`,
    columns: collection ? 1 : 2,
    rows: collection ? 1 : (hingedIds.includes(id) ? 2 : 1),
    hinged: hingedIds.includes(id) && !collection,
  })));
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const count = value => Number.isFinite(Number(value)) ? Math.max(0,Math.floor(Number(value))) : 0;
  const day = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Darwin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function reconcile(state, now=Date.now()) {
    if (!object(state)) return false;
    let changed=false;
    if (!object(state.paperInventory)) { state.paperInventory={version:1,items:{}}; changed=true; }
    if (!object(state.paperInventory.items)) { state.paperInventory.items={}; changed=true; }
    if (state.paperInventory.version==null) { state.paperInventory.version=1; changed=true; }
    const give=(id,source)=>{
      if (state.paperInventory.items[id]) return;
      state.paperInventory.items[id]={at:now,source};changed=true;
    };
    if (state.admitPassed) give('night-suitcase','admission');
    if (definitions.filter(d=>d.category==='Alley Ephemera').every(d=>!!state.curios?.[d.key])) give('moonlight-wardrobe','alley-complete');
    return changed;
  }
  function entries(state={},today=day()) {
    return definitions.map(d=>{
      let owned=false,quantity=0,status='Not collected yet',at=null;
      if (d.kind==='currency') { owned=true; quantity=count(state.demoCoins); status=`${quantity} demo ${quantity===1?'penny':'pennies'}`; }
      if (d.kind==='ticket') { owned=!!(state.admitTicket||state.admitPassed||state.alleyLaps); quantity=owned?1:0; status=state.admitPassed?'Punched · this lap':state.admitTicket?'Ready to show Aura':state.alleyLaps?'Used · first walk':'Take a ticket at the door'; }
      if (d.kind==='pass') { owned=!!state.showmanPass && state.passDay===today; quantity=owned?1:0; status=owned?'Active until midnight Darwin':'No active Showman pass'; }
      if (d.kind==='curio') { owned=!!state.curios?.[d.key];quantity=owned?1:0;at=state.curios?.[d.key]?.at||null;status=owned?'Collected':status; }
      if (d.kind==='reward') { owned=!!state.paperInventory?.items?.[d.id];quantity=owned?1:0;at=state.paperInventory?.items?.[d.id]?.at||null;status=owned?'Collection keepsake':status; }
      if (d.kind==='prize') { owned=!!state.paperInventory?.items?.[d.id];quantity=owned?1:0;at=state.paperInventory?.items?.[d.id]?.at||null;status=owned?'Won in a paper world':status; }
      return {...d,owned,quantity,status,at,punched:d.kind==='ticket'&&!!state.admitPassed};
    });
  }
  function resolve(id) { return definitions.find(d=>d.id===id||d.key===id)?.id||null; }
  function recordResult(state,result) {
    if(!object(state)||!object(result))return [];
    const reason=String(result.deathReason||'');
    if(['leave','abandon','cancel','unknown'].includes(reason))return [];
    const depth=count(result.depth),score=count(result.score);
    if(!result.cashedOut&&!(depth>0&&score>0))return [];
    const game=result.gameId||result.game,keys=[];
    if(game==='fortune'){
      keys.push('ticket_stub');
      const extra={'oxblood':'pressed_heart','kraft gold':'lucky_match','olive lamp':'marquee_bulb','cream ticket':'mirror_shard','lantern rose':'pressed_heart'}[result.meta?.colour];
      if(extra)keys.push(extra);
    }
    if(game==='love'){keys.push('mercury_bead');if(depth>=3||result.cashedOut)keys.push('sweet_heat');}
    const fixed={lookup:['gyro_ghost'],snap:['shutter_click'],whisper:['whisper_charm'],pack:['pressed_heart'],pass:['showman_ribbon','coin_slot'],marquee:['marquee_bulb']}[game];
    if(fixed)keys.push(...fixed);
    if(!keys.length)return [];
    if(!object(state.curios))state.curios={};
    const earned=[];
    for(const key of keys){
      if(state.curios[key])continue;
      const d=definitions.find(i=>i.key===key);
      state.curios[key]={shelf:d.category==='Alley Ephemera'?'alley':'guts',at:result.at||Date.now(),source:game};earned.push(d.id);
    }
    reconcile(state);return earned;
  }
  function recordPaperPrize(state, result) {
    if (!object(state) || !object(result)) return [];
    const id = result.item;
    const d = definitions.find(i => i.id === id);
    if (!d) return [];
    reconcile(state);
    const now = result.at || Date.now();
    if (d.kind === 'curio') {
      if (!object(state.curios)) state.curios = {};
      if (state.curios[d.key]) return [];
      state.curios[d.key] = {shelf: d.category === 'Alley Ephemera' ? 'alley' : 'guts', at: now, source: result.stall || 'paper-world'};
      reconcile(state);
      return [d.id];
    }
    if (state.paperInventory.items[d.id]) return [];
    state.paperInventory.items[d.id] = {at: now, source: result.stall || 'paper-world', chapter: result.chapter};
    return [d.id];
  }
  globalThis.PennyFeverInventoryModel=Object.freeze({definitions,reconcile,entries,resolve,day,recordResult,recordPaperPrize});
})();
