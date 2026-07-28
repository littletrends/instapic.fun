(function(){
  const core=window.InstapicCore;
  const panel=document.getElementById("event-host-setup-panel");
  const imageInput=document.getElementById("host-setup-image");
  const imagePreview=document.getElementById("host-setup-preview-image");
  const line1=document.getElementById("host-setup-line1");
  const line2=document.getElementById("host-setup-line2");
  const line3=document.getElementById("host-setup-line3");
  const font=document.getElementById("host-setup-font");
  const save=document.getElementById("host-setup-save");
  const status=document.getElementById("host-setup-status");
  const preview=document.getElementById("host-setup-preview");
  let eventCode="",pin="",objectUrl="";
  async function json(response){
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.ok===false)throw new Error(data.message||data.error||`HTTP ${response.status}`);
    return data;
  }
  function paint(){
    document.getElementById("host-setup-preview-line1").textContent=line1.value;
    document.getElementById("host-setup-preview-line2").textContent=line2.value;
    document.getElementById("host-setup-preview-line3").textContent=line3.value;
    preview.style.fontFamily=font.value==="Piazzolla-Bold.otf"
      ?"Georgia,serif":font.value==="IndieFlower.ttf"
        ?"Comic Sans MS,cursive":"Impact,Arial Black,sans-serif";
  }
  function showImage(url){
    imagePreview.hidden=!url;
    if(url)imagePreview.src=url;
    else imagePreview.removeAttribute("src");
  }
  async function load(){
    if(!eventCode||!pin)return;
    try{
      const result=await json(await fetch(
        `${core.API_BASE}/api/event-host-setup/${encodeURIComponent(eventCode)}?pin=${encodeURIComponent(pin)}`,
        {cache:"no-store"}
      ));
      const setup=result.setup||{};
      line1.value=setup.brand_line1||"";
      line2.value=setup.brand_line2||"";
      line3.value=setup.brand_line3||"";
      font.value=setup.brand_label_font||"Concrete.ttf";
      showImage(setup.image_url?`${core.API_BASE}${setup.image_url}&v=${Date.now()}`:"");
      paint();
      status.textContent=setup.status==="HOST_SAVED"?"Your saved setup is loaded.":"Choose your image and wording, then save.";
    }catch(error){status.textContent="Event setup is temporarily unavailable.";}
  }
  imageInput?.addEventListener("change",()=>{
    if(objectUrl)URL.revokeObjectURL(objectUrl);
    const file=imageInput.files?.[0];
    objectUrl=file?URL.createObjectURL(file):"";
    showImage(objectUrl);paint();
  });
  [line1,line2,line3,font].forEach(input=>input?.addEventListener("input",paint));
  save?.addEventListener("click",async()=>{
    if(!eventCode||!pin)return;
    save.disabled=true;status.textContent="Saving…";
    try{
      await json(await fetch(`${core.API_BASE}/api/event-host-setup/${encodeURIComponent(eventCode)}`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          pin,brand_line1:line1.value,brand_line2:line2.value,
          brand_line3:line3.value,brand_label_font:font.value
        })
      }));
      const file=imageInput.files?.[0];
      if(file){
        const form=new FormData();form.append("pin",pin);form.append("file",file);
        await json(await fetch(
          `${core.API_BASE}/api/event-host-setup/${encodeURIComponent(eventCode)}/image`,
          {method:"POST",body:form}
        ));
        imageInput.value="";
      }
      status.textContent="Event setup saved ✅";
      await load();
    }catch(error){status.textContent=`Setup could not be saved: ${error.message}`;}
    finally{save.disabled=false;}
  });
  document.addEventListener("instapic:event-portal-loaded",(event)=>{
    eventCode=event.detail?.event?.event_code||"";pin=event.detail?.pin||"";load();
  });
})();
