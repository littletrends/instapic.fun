(function () {
  const token=new URLSearchParams(location.search).get("token")||"";
  const api=window.InstapicCore?.API_BASE||"";
  const status=document.getElementById("deposit-status");
  const content=document.getElementById("deposit-content");
  const cardButton=document.getElementById("card-button");
  const appleStatus=document.getElementById("apple-pay-status");
  let busy=false;

  const money=(c)=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(c||0)/100);
  async function request(url,options){
    const response=await fetch(url,options),data=await response.json().catch(()=>({}));
    if(!response.ok||data.ok===false)throw new Error(data.message||data.error||`HTTP ${response.status}`);
    return data;
  }
  async function complete(method){
    if(busy)return;
    busy=true;cardButton.disabled=true;status.textContent="Confirming your secure payment…";
    try{
      const tokenResult=await method.tokenize();
      if(tokenResult.status!=="OK")throw new Error(tokenResult.errors?.[0]?.message||"Payment details could not be tokenised.");
      const result=await request(`${api}/api/booking/deposits/${encodeURIComponent(token)}/pay`,{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source_id:tokenResult.token})
      });
      content.hidden=true;
      status.innerHTML=`<strong>Deposit received — your event is booked.</strong><br>Host portal PIN: <strong>${result.host_pin||"being prepared"}</strong>`;
    }catch(error){
      status.textContent=`Payment was not completed: ${error.message}`;
      busy=false;cardButton.disabled=false;
    }
  }
  async function load(){
    if(!token)throw new Error("This deposit link is incomplete.");
    if(!window.Square)throw new Error("Square secure payments could not be loaded.");
    const config=await request(`${api}/api/booking/deposits/${encodeURIComponent(token)}`);
    document.getElementById("event-name").textContent=config.event_name||"Your event";
    document.getElementById("deposit-total").textContent=money(config.amount_cents);
    if(config.payment_status==="COMPLETED"){
      content.hidden=true;
      status.innerHTML=`<strong>Deposit already received — your event is booked.</strong><br>Host portal PIN: <strong>${config.host_pin||"being prepared"}</strong>`;
      return;
    }
    // The proven photo-strip checkout exposes its payment panel before
    // initializing digital wallets. Safari can then see the real Apple Pay
    // button in the rendered document.
    content.hidden=false;
    const payments=window.Square.payments(config.square_application_id,config.square_location_id);
    const paymentRequest=payments.paymentRequest({
      countryCode:"AU",currencyCode:"AUD",
      total:{amount:(config.amount_cents/100).toFixed(2),label:"Instapic booking deposit"},
    });
    const card=await payments.card();await card.attach("#card-container");
    cardButton.addEventListener("click",()=>complete(card));
    try{
      const googlePay=await payments.googlePay(paymentRequest);
      await googlePay.attach("#google-pay-button");
      document.getElementById("google-pay-button").addEventListener("click",()=>complete(googlePay));
    }catch(_error){document.getElementById("google-pay-button").hidden=true;}
    try{
      const appleButton=document.getElementById("apple-pay-button");
      appleButton.classList.add("apple-pay-button");
      appleButton.setAttribute("lang","en");
      appleButton.setAttribute("aria-label","Pay with Apple Pay");
      appleButton.style.setProperty("-webkit-appearance","-apple-pay-button");
      appleButton.style.setProperty("-apple-pay-button-type","pay");
      appleButton.style.setProperty("-apple-pay-button-style","white");
      const applePay=await payments.applePay(paymentRequest);
      appleButton.hidden=false;
      appleButton.style.display="block";
      appleButton.style.visibility="visible";
      appleButton.style.opacity="1";
      appleButton.addEventListener("click",()=>complete(applePay));
    }catch(error){
      document.getElementById("apple-pay-button").hidden=true;
      appleStatus.hidden=false;
      if(!window.ApplePaySession){
        appleStatus.textContent="Apple Pay is not available in this browser window. On iPhone, open this payment page directly in Safari.";
      }else if(typeof window.ApplePaySession.canMakePayments==="function"&&!window.ApplePaySession.canMakePayments()){
        appleStatus.textContent="Apple Pay is available on this iPhone, but Wallet does not currently report an eligible payment card.";
      }else{
        appleStatus.textContent=`Apple Pay could not start: ${error?.message||error?.name||"Square rejected Apple Pay initialization"}.`;
      }
    }
    status.textContent="";
  }
  load().catch(error=>{status.textContent=error.message||"Secure payment could not be loaded.";});
})();
