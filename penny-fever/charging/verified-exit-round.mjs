import {createVerifiedDriver} from '../paper-games/verified-driver.js?v=verified-banking-1';
import {createVerifiedWallet} from '../paper-games/verified-wallet.js?v=verified-banking-1';
import {createVerifiedContext} from './verified-context.mjs';
import {createExitJournal,sendExitJournal,acquireExitWriter} from './exit-journal.mjs';
const ORIGINAL_TOKEN_SOURCE='9d76c47b62fa7a3fe9786a34b83418284035f97e0c6783b1603d7c9d85764ee4';
export async function openExitRound({engine,view,client,owner,scope=globalThis,onCommit=()=>{},assertActive=()=>{}}){
  if(!view.checkpoint || view.checkpoint_protocol!==1)throw Error('checkpoint_open_required');
  let writer=await acquireExitWriter(owner),current=view,journal,shadow,environment,driver,sending=null,opening=null,failed=null;
  const releaseWriter=()=>{const held=writer;writer=null;return held?.();};
  try{journal=await createExitJournal(owner,current);}catch(e){await releaseWriter();throw e;}
  function rebuild(){
    const originalReplay=current.source===ORIGINAL_TOKEN_SOURCE&&!current.snapshot?.edition;
    shadow=createVerifiedWallet({purse:structuredClone(current.wallet),inventory:structuredClone(current.wallet.inventory||{}),storage:new Map(Object.entries(current.storage||{})),allowGameplayTokens:originalReplay});
    environment=createVerifiedContext({wallet:shadow.api,storage:shadow.storage,reducedMotion:current.preferences?.reducedMotion===true,scope});
    driver=environment.run(()=>createVerifiedDriver({engine,game:current.game,chapter:current.chapter,seed:'00000000',startedAt:current.startedAt,snapshot:structuredClone(current.snapshot),legacyReplay:originalReplay}));
    if(journal.meta.state!=='committed')for(const event of journal.events)environment.run(()=>driver.execute(event));
  }
  try{rebuild();}catch(e){await releaseWriter();throw e;}
  async function flush({reason='pause',hidden=scope.document?.hidden===true}={}){
    assertActive();if(sending)return sending;
    if(journal.meta.state==='committed')return current;
    const task=(async()=>{
      try{
        if(journal.meta.state==='recording')environment.run(()=>driver.persist());
        const meta=await journal.freeze(reason);
        const response=await sendExitJournal(meta,journal.events,client,{hidden});
        if(response.id!==current.id||response.source!==current.source||response.revision!==meta.revision+1)throw Error('verified_reply_mismatch');
        await journal.committed(response);current=response;failed=null;for(const key of ['pennies','tickets','packs'])shadow.purse[key]=response.wallet[key];await releaseWriter();await onCommit(response);return current;
      }catch(e){failed=e;throw e;}
    })();
    sending=task.finally(()=>{sending=null;});return sending;
  }
  async function resume(){
    assertActive();if(opening)return opening;
    const task=(async()=>{
      if(sending)await sending;
      if(journal.meta.state!=='committed'){
        if(journal.meta.state==='recording'&&!failed){if(!writer)writer=await acquireExitWriter(owner);return current;}
        await flush();
      }
      if(!writer)writer=await acquireExitWriter(owner);
      const next=await client.command({operation:'begin',game:current.game,chapter:current.chapter,preferences:current.preferences||{},checkpoint_client:journal.meta.checkpoint.client});
      if(next.id!==current.id||next.source!==current.source)throw Error('verified_reply_mismatch');
      current=next;journal=await createExitJournal(owner,current);failed=null;rebuild();
      const released={type:'release'};journal.append(released);environment.run(()=>driver.execute(released));return current;
    })();opening=task.finally(()=>{opening=null;});return opening;
  }
  async function prepareEntry(type='start'){
    if(!['start','retry'].includes(type))throw Error('invalid_entry_checkpoint');
    await resume();assertActive();
    if(journal.events.some(event=>event.type!=='release'))throw Error('checkpoint_pending');
    journal.append({type});
    const meta=await journal.freeze('entry');
    try{
      const response=await sendExitJournal(meta,journal.events,client);
      await journal.committed(response);current=response;await onCommit(response);
      if(!response.checkpoint)throw Error('checkpoint_disabled');
      journal=await createExitJournal(owner,current);failed=null;rebuild();return current;
    }catch(e){failed=e;throw e;}
  }
  return {checkpointMode:true,flush,resume,prepareEntry,
    enqueue(event){
      assertActive();if(event.type==='release'&&journal.meta.state==='committed')return;
      if(failed)throw failed;if(journal.error)throw journal.error;
      journal.append(event);
      try{environment.run(()=>driver.execute(event));}catch(e){failed=e;throw e;}
    },
    render:fn=>environment.run(fn),
    persist:()=>{journal.persist().catch(e=>{failed=e;});},
    get state(){return driver.state;},get input(){return driver.input;},get needsStart(){return driver.needsStart===true;},
    get completion(){return driver.completion;},get finished(){return driver.finished;},get wallet(){return shadow.purse;},
    get pending(){return journal.meta.state==='committed'?0:journal.events.length;},get error(){return failed||journal.error;}
  };
}
