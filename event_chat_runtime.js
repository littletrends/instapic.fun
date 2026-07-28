(function(){
  const core=window.InstapicCore;
  const panel=document.getElementById("event-host-chat");
  const list=document.getElementById("host-chat-messages");
  const body=document.getElementById("host-chat-body");
  const send=document.getElementById("host-chat-send");
  const status=document.getElementById("host-chat-status");
  let eventCode="",pin="",timer=null,lastSignature="",activeTab="overview";
  const tabs=[...document.querySelectorAll("[data-event-tab]")];
  const tabPanels=[...document.querySelectorAll("[data-event-tab-panel]")];
  function openTab(name){
    activeTab=name;
    tabs.forEach(tab=>tab.setAttribute("aria-selected",String(tab.dataset.eventTab===name)));
    tabPanels.forEach(item=>{item.hidden=item.dataset.eventTabPanel!==name;});
    if(name==="messages")refresh();
  }
  async function readJson(response){
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.ok===false)throw new Error(data.message||data.error||`HTTP ${response.status}`);
    return data;
  }
  function render(messages){
    const signature=(messages||[]).map(x=>x.message_id).join("|");
    if(signature===lastSignature)return;
    lastSignature=signature;list.replaceChildren();
    for(const message of messages||[]){
      const bubble=document.createElement("div");
      bubble.className=`host-chat-message ${message.direction==="INBOUND"?"inbound":"outbound"}`;
      const text=document.createElement("div");text.textContent=message.body||"";
      const meta=document.createElement("span");meta.className="host-chat-meta";
      meta.textContent=`${message.direction==="INBOUND"?"You":"Instapic"} · ${message.created_at?new Date(message.created_at).toLocaleString():""}`;
      bubble.append(text,meta);list.appendChild(bubble);
    }
    list.scrollTop=list.scrollHeight;
  }
  async function refresh(){
    if(!eventCode||!pin)return;
    try{
      const data=await readJson(await fetch(`${core.API_BASE}/api/booking/host-conversation/${encodeURIComponent(eventCode)}?pin=${encodeURIComponent(pin)}`,{cache:"no-store"}));
      panel.hidden=activeTab!=="messages";render(data.messages||[]);status.textContent="";
    }catch(error){status.textContent="Messages are temporarily unavailable.";}
  }
  async function sendMessage(){
    const text=body.value.trim();if(!text||!eventCode||!pin)return;
    send.disabled=true;status.textContent="Sending…";
    try{
      await readJson(await fetch(`${core.API_BASE}/api/booking/host-conversation/${encodeURIComponent(eventCode)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin,body:text})}));
      body.value="";lastSignature="";await refresh();
    }catch(error){status.textContent=`Message could not be sent: ${error.message}`;}
    finally{send.disabled=false;}
  }
  document.addEventListener("instapic:event-portal-loaded",(event)=>{
    eventCode=event.detail?.event?.event_code||"";pin=event.detail?.pin||"";
    openTab(activeTab);refresh();if(timer)clearInterval(timer);timer=setInterval(refresh,30000);
  });
  send?.addEventListener("click",sendMessage);
  body?.addEventListener("keydown",(event)=>{
    if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();sendMessage();}
  });
  tabs.forEach(tab=>tab.addEventListener("click",()=>openTab(tab.dataset.eventTab)));
})();
