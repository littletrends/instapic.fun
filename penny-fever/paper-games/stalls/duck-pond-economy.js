// Local-review accounting. Production awards must be verified by the house.
export const TOKEN_IDS=['star-token','moon-penny','rose-penny','crown-token'];
export const DOLLAR_IDS=['everyday-penny','five-penny-stack','ride-ticket'];
// Working chapter allowances; independent of the unique NFT allocation.
export const ALLOWANCES=[
 [50000,1000,0,0],[50000,1500,100,0],[50000,2000,150,5],
 [50000,2200,250,10],[50000,2500,300,15],[53031,2921,412,31],
];
export function createEntitlement(level){
 if(!ALLOWANCES[level])throw Error('Unknown token chapter');
 return {v:1,level,claimed:{},spawned:[],receipts:[],rewardCollected:false,completed:false,
   paidIn:0,paidOut:0,paymentReceipts:[],currencyReceipts:[],currencyGrants:[],currencySpawned:[],currencyCollected:[]};
}
export function packets(ent){
 return TOKEN_IDS.map((id,i)=>({id,key:`duck-pond:${ent.level}:${id}`,
   quantity:Math.max(0,ALLOWANCES[ent.level][i]-(ent.claimed[id]||0))})).filter(p=>p.quantity>0);
}
export function claimToken(ent,drop){
 const packet=packets(ent).find(p=>p.key===drop.key&&p.id===drop.id);
 if(!packet||packet.quantity!==drop.quantity||ent.receipts.includes(drop.key))return false;
 ent.claimed[drop.id]=(ent.claimed[drop.id]||0)+drop.quantity;ent.receipts.push(drop.key);return true;
}
export function claimNFT(ent){
 ent.completed=true;if(ent.rewardCollected)return false;ent.rewardCollected=true;return true;
}
export function recordPaidIn(ent,amount,receipt){
 if(!Number.isSafeInteger(amount)||amount<=0||!receipt||ent.paymentReceipts.includes(receipt))return false;
 ent.paidIn+=amount;ent.paymentReceipts.push(receipt);return true;
}
export function authorizeCurrency(ent,{id,quantity=1,receipt,policy}){
 // A verified house policy must supply the release. No percentage or odds invented here.
 const value={'everyday-penny':1,'five-penny-stack':5,'ride-ticket':5}[id];
 if(!value||!Number.isSafeInteger(quantity)||quantity<1||!receipt||!policy?.id||ent.currencyReceipts.includes(receipt)
   ||ent.paidIn<=0||!Number.isSafeInteger(policy.fundedPennies)||value*quantity>policy.fundedPennies)return null;
 ent.paidOut+=value*quantity;ent.currencyReceipts.push(receipt);
 const grant={id,quantity,key:`currency:${receipt}`,kind:'currency',policy};ent.currencyGrants.push(grant);return grant;
}
export function validateEntitlement(ent,level){
 for(const name of ['currencyGrants','currencySpawned','currencyCollected'])if(ent&&ent[name]===undefined)ent[name]=[];
 if(!ent||ent.v!==1||ent.level!==level||!ent.claimed||!Array.isArray(ent.spawned)||!Array.isArray(ent.receipts)
  ||typeof ent.rewardCollected!=='boolean'||typeof ent.completed!=='boolean'
  ||![ent.paidIn,ent.paidOut].every(n=>Number.isSafeInteger(n)&&n>=0)
  ||!Array.isArray(ent.paymentReceipts)||!Array.isArray(ent.currencyReceipts)||!Array.isArray(ent.currencyGrants)
  ||!Array.isArray(ent.currencySpawned)||!Array.isArray(ent.currencyCollected))throw Error('Invalid chapter entitlement');
 for(const [id,amount] of Object.entries(ent.claimed)){
  const index=TOKEN_IDS.indexOf(id);
  if(index<0||!Number.isSafeInteger(amount)||amount<0||amount>ALLOWANCES[level][index])throw Error('Invalid token allowance');
 }
 for(const list of [ent.spawned,ent.receipts,ent.paymentReceipts,ent.currencyReceipts])if(new Set(list).size!==list.length)throw Error('Duplicate chapter receipt');
 return ent;
}
