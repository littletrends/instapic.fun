// Append small records locally. This module performs no network requests.
const DB_NAME = 'pennyFever.verified.exit.v1';
const MAX_EVENTS = 120000, MAX_BYTES = 4 * 1024 * 1024, MAX_SECONDS = 1200;
let database;
export async function acquireExitWriter(owner) {
  if(!navigator.locks?.request)throw Error('verified_cross_tab_lock_required');
  let release,ready,fail;
  const held=new Promise(resolve=>{release=resolve;}),acquired=new Promise((resolve,reject)=>{ready=resolve;fail=reject;});
  const task=navigator.locks.request('pennyFever.verified.exitWriter.v1:'+encodeURIComponent(owner),{ifAvailable:true},async lock=>{
    if(!lock){fail(Error('checkpoint_pending'));return;}
    ready(()=>{release();return task;});await held;
  }).catch(fail);
  return acquired;
}
const request = task => new Promise((resolve,reject) => {
  task.onsuccess = () => resolve(task.result); task.onerror = () => reject(task.error || Error('journal_storage_failed'));
});
async function db() {
  if (!globalThis.indexedDB) throw Error('journal_storage_unavailable');
  if (!database) database = new Promise((resolve,reject) => {
    const open = indexedDB.open(DB_NAME,1);
    open.onupgradeneeded = () => {
      const d = open.result;
      d.createObjectStore('journals',{keyPath:'id'});
      d.createObjectStore('events',{keyPath:['journal','seq']}).createIndex('journal','journal');
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error || Error('journal_storage_failed'));
    open.onblocked = () => reject(Error('journal_storage_blocked'));
  });
  try { return await database; } catch (e) {database = null; throw e;}
}
export async function ensureExitStorage() {await db();}
async function transaction(stores,mode,fn) {
  const d = await db();
  return new Promise((resolve,reject) => {
    const tx = d.transaction(stores,mode);let value;
    tx.oncomplete = () => resolve(value);tx.onabort = tx.onerror = () => reject(tx.error || Error('journal_storage_failed'));
    try {value=fn(tx);} catch(e){tx.abort();reject(e);}
  });
}
export async function journalList(owner) {
  const d=await db(),all=await request(d.transaction('journals','readonly').objectStore('journals').getAll());
  return all.filter(item => item.owner===owner && item.state!=='committed');
}
export async function journalEvents(id) {
  const d=await db(),rows=await request(d.transaction('events','readonly').objectStore('events').index('journal').getAll(IDBKeyRange.only(id)));
  rows.sort((a,b)=>a.seq-b.seq);
  if(rows.some((row,i)=>row.seq!==i))throw Error('journal_sequence_gap');
  return rows.map(row=>row.event);
}
export async function journalMeta(value) {
  await transaction(['journals'],'readwrite',tx=>tx.objectStore('journals').put(value));return value;
}
export async function createExitJournal(owner,view) {
  await db();
  const id=owner+':'+view.checkpoint.id;
  const d=await db();let meta=await request(d.transaction('journals','readonly').objectStore('journals').get(id));
  if(meta && (meta.owner!==owner || meta.play!==view.id || meta.source!==view.source || meta.revision!==view.revision))throw Error('journal_view_mismatch');
  if(!meta)meta=await journalMeta({id,owner,play:view.id,source:view.source,revision:view.revision,view,checkpoint:view.checkpoint,state:'recording'});
  const events=await journalEvents(id);let bytes=events.reduce((n,e)=>n+JSON.stringify(e).length+1,2);
  let seconds=events.reduce((n,e)=>n+(e.type==='tick'?e.dt:0),0),saved=events.length,writing=Promise.resolve(),timer=null,failure=null;
  function persist() {
    if(timer){clearTimeout(timer);timer=null;}
    const through=events.length;
    writing=writing.catch(()=>{}).then(async()=>{
      if(saved>=through)return;
      const from=saved;
      await transaction(['events'],'readwrite',tx=>{
        const store=tx.objectStore('events');
        for(let i=from;i<through;i++)store.put({journal:id,seq:i,event:events[i]});
      });
      saved=through;failure=null;
    }).catch(e=>{failure=e;throw e;});
    // The consumer checks failure before taking another input. Retain the
    // original rejected promise for the boundary flush to report as well.
    writing.catch(()=>{});return writing;
  }
  return {get meta(){return meta;},events,
    append(event){
      if(failure)throw failure;
      if(meta.state!=='recording')throw Error('journal_frozen');
      const copy=structuredClone(event),size=JSON.stringify(copy).length+1;
      if(events.length>=MAX_EVENTS || bytes+size>MAX_BYTES || seconds+(copy.type==='tick'?copy.dt:0)>MAX_SECONDS)throw Error('exit_checkpoint_limit');
      events.push(copy);bytes+=size;if(copy.type==='tick')seconds+=copy.dt;
      if(!timer)timer=setTimeout(()=>{persist().catch(()=>{});},150);
    },persist,
    async freeze(reason='exit'){
      await persist();
      if(meta.state==='recording')meta=await journalMeta({...meta,state:'pending',reason,count:events.length});
      if(meta.count!==events.length)throw Error('journal_frozen');return meta;
    },
    async committed(result){
      await persist();
      const {id,owner,play,source,revision,checkpoint}=meta;
      meta=await journalMeta({id,owner,play,source,revision,checkpoint,state:'committed',result:{id:result.id,source:result.source,revision:result.revision}});
      // Consume acknowledged inputs only after their exact receipt is durable.
      // Mother retains the complete verified checkpoint and uploaded log.
      try{await transaction(['events'],'readwrite',tx=>{
        const store=tx.objectStore('events'),cursor=store.index('journal').openKeyCursor(IDBKeyRange.only(id));
        cursor.onsuccess=()=>{const row=cursor.result;if(row){store.delete(row.primaryKey);row.continue();}};
      });}catch{}
    },
    get error(){return failure;},get durable(){return saved===events.length;}
  };
}
export async function sendExitJournal(meta,events,client,{hidden=false}={}) {
  const receipt=result=>{
    if(result?.id!==meta.play || result.source!==meta.source || result.revision!==meta.revision+1)throw Error('verified_reply_mismatch');
    return result;
  };
  const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
  const parts=[];let batch=[],size=2;
  for(const event of events){
    const item=JSON.stringify(event);
    if(batch.length && (batch.length>=1500 || size+item.length+1>32000)){parts.push('['+batch.join(',')+']');batch=[];size=2;}
    batch.push(item);size+=item.length+1;
  }
  if(batch.length || !parts.length)parts.push('['+batch.join(',')+']');
  const context={checkpoint:meta.checkpoint.id,client:meta.checkpoint.client};
  if(meta.reason==='entry'){const state=await client.checkpoint({...context,action:'entry',events},{keepalive:hidden});if(state.state!=='committed')throw Error('exit_save_pending');return receipt(state.result);}
  // An acknowledged result also recovers a lost final browser write.
  let state=await client.checkpoint({...context,action:'status'},{keepalive:hidden});
  if(state.state==='committed')return receipt(state.result);
  const digests=await Promise.all(parts.map(hash));
  if(state.state==='recording'){
    for(let i=0;i<parts.length;i++)await client.checkpoint({...context,action:'chunk',part:i,digest:digests[i],data:parts[i]},{keepalive:hidden});
    state=await client.checkpoint({...context,action:'seal',parts:parts.length,root:await hash(digests.join('')),reason:meta.reason||'exit'},{keepalive:hidden});
  }
  if(hidden && state.state!=='committed')throw Error('exit_save_pending');
  const until=Date.now()+90000;
  while(state.state!=='committed'){
    if(state.state==='failed')throw Error(state.error||'exit_save_failed');
    if(Date.now()>until)throw Error('exit_save_pending');
    await new Promise(resolve=>setTimeout(resolve,500));
    state=await client.checkpoint({...context,action:'status'});
  }
  return receipt(state.result);
}
export async function recoverExitJournals(owner,client,{clientId}={}) {
  const release=await acquireExitWriter(owner);
  try{
  if(clientId){
    const active=await client.checkpoint({action:'recover',client:clientId});
    if(active.state==='other_device')throw Error('checkpoint_pending');
    if(active.view){
      // Recover the begin-ack gap, including any orphaned durable event rows.
      // The baseline is Mother's, never a replacement state supplied by us.
      await createExitJournal(owner,active.view);
    }
  }
  for(let count=0;;count++){
    const [original]=(await journalList(owner)).sort((a,b)=>a.revision-b.revision);
    if(!original)break;
    if(count>=64)throw Error('journal_recovery_required');
    const events=await journalEvents(original.id);
    const meta=original.state==='recording'?await journalMeta({...original,state:'pending',reason:'exit',count:events.length}):original;
    if(meta.count!==events.length)throw Error('journal_sequence_gap');
    const result=await sendExitJournal(meta,events,client);
    const journal=await createExitJournal(owner,meta.view);
    await journal.committed(result);
    if(result.checkpoint){
      const next=await createExitJournal(owner,result),frozen=await next.freeze('exit');
      await next.committed(await sendExitJournal(frozen,next.events,client));
    }
  }
  }finally{await release();}
}
