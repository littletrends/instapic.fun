(function () {
  const status = document.getElementById("contract-status"), content = document.getElementById("contract-content");
  const token = new URLSearchParams(location.search).get("token") || "", api = window.InstapicCore?.API_BASE || "";
  const money = (c) => new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(c||0)/100);
  const esc=(value)=>String(value||"").replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const row = (a,b) => `<div class="contract-row"><span>${a}</span><strong>${b}</strong></div>`;
  const mirrorLabel=(x)=>x.preferred_mirror==="mirror1"?"Mirror 1 — black frame with bauble lights":x.preferred_mirror==="mirror2"?`Mirror 2 — ${x.frame_preference==="white"?"white":"gold"} frame with LED lights`:"Either Magic Mirror — final machine to be confirmed";
  let unattended=false,pendingAcceptance=null;
  async function request(url, options) {
    const response=await fetch(url,options), data=await response.json().catch(()=>({}));
    if(!response.ok||data.ok===false) throw new Error(data.error||`HTTP ${response.status}`); return data;
  }
  async function submitAcceptance(bondAcknowledged) {
    const {accepted_name,acknowledgements}=pendingAcceptance;
    if(unattended) acknowledgements.bond=bondAcknowledged===true;
    document.getElementById("accept-contract").disabled=true;
    try {
      const result=await request(`${api}/api/booking/contracts/${encodeURIComponent(token)}/accept`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accepted_name,acknowledgements})});
      content.hidden=true;
      status.innerHTML=`Agreement accepted. <a class="btn" href="${result.deposit_url||`event-deposit.html?token=${encodeURIComponent(token)}`}">Pay secure booking deposit</a>`;
    } catch(error){status.textContent=`Agreement could not be accepted: ${error.message}`;document.getElementById("accept-contract").disabled=false;}
  }
  function accept() {
    const accepted_name=document.getElementById("accepted-name").value.trim();
    const acknowledgements={quote:document.getElementById("ack-quote").checked,terms:document.getElementById("ack-terms").checked,authority:document.getElementById("ack-authority").checked};
    if(!accepted_name||!Object.values(acknowledgements).every(Boolean)){status.textContent="Enter your full name and complete all acknowledgements.";return;}
    pendingAcceptance={accepted_name,acknowledgements};
    if(unattended){document.getElementById("bond-acknowledgement").showModal();return;}
    if(confirm("Accept this event-hire agreement?")) submitAcceptance(false);
  }
  async function load(){
    if(!token) throw new Error("This agreement link is incomplete.");
    const data=await request(`${api}/api/booking/contracts/${encodeURIComponent(token)}`),e=data.event||{},v=data.venue||{},x=data.equipment||{},q=data.quote||{},c=data.contract||{};
    unattended=x.attendance==="unattended";
    content.innerHTML=`<section class="contract-box"><h2>${e.name||"Your event"}</h2>${row("Date",e.date||"—")}${row("Time",`${e.start_time||"—"}–${e.finish_time||"—"}`)}${row("Venue",[v.venue_name,v.address].filter(Boolean).join(" · ")||"—")}${row("Magic Mirror",mirrorLabel(x))}${row("Service",x.attendance==="unattended"?"Unattended self-service hire":"Attended hire")}${row("Quote total",money(q.total_cents))}${row("Booking deposit",money(q.deposit_cents))}${row("Remaining hire balance",money(q.balance_cents))}</section>
    <section class="contract-box"><h2>Key hire conditions</h2><p>The booking deposit is applied toward the hire total. The booking is secured only when this agreement is accepted and the deposit is successfully paid.</p>${x.attendance==="unattended"?`<p><strong>Unattended hire requires a separate $500 refundable security-bond authorisation.</strong> It is not included in the quote total. The security bond and remaining hire balance must be approved before the Magic Mirror is activated at the event.</p>`:""}<p>Cancellation terms vary according to the notice provided: transfers may be requested 30+ days before the event; the deposit may be retained for cancellations within 29 days; and only reasonable documented costs or losses may be deducted. If Little Trends cannot provide the agreed hire, the hirer may choose a full refund or an agreed rescheduled date.</p><p>The hirer must provide safe setup and collection access, protect the equipment from weather, liquids, movement and interference, and is responsible for loss or damage beyond fair wear and faults not caused by the hirer.</p><p><a href="terms.html">Read the complete Instapic Event Hire Terms (version ${c.terms_version})</a></p></section>
    <section class="contract-box" id="accept-agreement-section"><h2>Accept agreement</h2><label class="contract-check"><input id="ack-quote" type="checkbox"><span>I confirm the event details and accepted quote version ${c.quote_version} are correct.</span></label><label class="contract-check"><input id="ack-terms" type="checkbox"><span>I have read and agree to the complete Instapic event-hire terms.</span></label><label class="contract-check"><input id="ack-authority" type="checkbox"><span>I am authorised to enter this agreement for the event hirer.</span></label><label>Full name<input id="accepted-name" class="contract-name" autocomplete="name"></label><button class="btn" id="accept-contract" style="margin-top:16px">Accept agreement</button></section>`;
    content.hidden=false;
    if(c.status==="ACCEPTED"){
      const acceptedWhen=c.accepted_at?new Date(c.accepted_at).toLocaleString():"";
      status.innerHTML=`<strong>Signed agreement</strong><br>Accepted by ${esc(c.accepted_name||"the event hirer")}${acceptedWhen?` on ${esc(acceptedWhen)}`:""}. <a class="btn" href="event-deposit.html?token=${encodeURIComponent(token)}">Open booking payment</a>`;
      content.querySelector("#accept-agreement-section").hidden=true;
    } else status.textContent="";
    document.getElementById("accept-contract").addEventListener("click",accept);
    document.getElementById("accept-bond-acknowledgement").addEventListener("click",()=>{document.getElementById("bond-acknowledgement").close();submitAcceptance(true);});
    document.getElementById("cancel-bond-acknowledgement").addEventListener("click",()=>document.getElementById("bond-acknowledgement").close());
  }
  load().catch(error=>{status.textContent=error.message||"Agreement could not be loaded.";});
})();
