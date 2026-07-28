(function(){
  const core=window.InstapicCore;
  const panel=document.getElementById("event-host-setup-panel");
  const imageInput=document.getElementById("host-setup-image");
  const imagePreview=document.getElementById("host-setup-preview-image");
  const templatePreview=document.getElementById("host-setup-template");
  const line1=document.getElementById("host-setup-line1");
  const line2=document.getElementById("host-setup-line2");
  const line3=document.getElementById("host-setup-line3");
  const font=document.getElementById("host-setup-font");
  const textSize=document.getElementById("host-setup-text-size");
  const imageScale=document.getElementById("host-setup-image-scale");
  const copyPreview=document.querySelector(".strip-setup-copy");
  const save=document.getElementById("host-setup-save");
  const status=document.getElementById("host-setup-status");
  const preview=document.getElementById("host-setup-preview");
  let eventCode="",pin="",objectUrl="";
  let setupLocked=false;
  let loadedFont="";
  const offsets={text:{x:0,y:0},image:{x:0,y:0}};
  async function json(response){
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.ok===false)throw new Error(data.message||data.error||`HTTP ${response.status}`);
    return data;
  }
  function paint(){
    document.getElementById("host-setup-preview-line1").textContent=line1.value;
    document.getElementById("host-setup-preview-line2").textContent=line2.value;
    document.getElementById("host-setup-preview-line3").textContent=line3.value;
    const size=Math.max(10,Math.min(22,Number(textSize.value)||16));
    const factor=preview.clientWidth/392||.5;
    copyPreview.style.transform=`translate(${offsets.text.x*factor}px,${offsets.text.y*factor}px)`;
    imagePreview.style.transform=`translate(${offsets.image.x*factor}px,${offsets.image.y*factor}px) scale(${Math.max(60,Math.min(140,Number(imageScale.value)||100))/100})`;
    document.getElementById("host-setup-preview-line1").style.fontSize=`${size*factor}px`;
    document.getElementById("host-setup-preview-line2").style.fontSize=`${size*.72*factor}px`;
    document.getElementById("host-setup-preview-line3").style.fontSize=`${size*.72*factor}px`;
    if(font.value&&font.value!==loadedFont){
      loadedFont=font.value;
      const family=`HostPreview_${font.value.replace(/[^a-z0-9]/gi,"_")}`;
      const url=`${core.API_BASE}/api/event-host-setup/${encodeURIComponent(eventCode)}/font/${encodeURIComponent(font.value)}?pin=${encodeURIComponent(pin)}`;
      new FontFace(family,`url("${url}")`).load().then(face=>{
        document.fonts.add(face);preview.style.fontFamily=`"${family}",sans-serif`;
      }).catch(()=>{preview.style.fontFamily="sans-serif";});
    }
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
      const selected=setup.brand_label_font||"Concrete.ttf";
      font.replaceChildren();
      for(const item of setup.fonts||[]){
        const option=document.createElement("option");
        option.value=item.file;option.textContent=item.label||item.file;
        option.selected=item.file===selected;font.appendChild(option);
      }
      if(!font.options.length){
        const option=document.createElement("option");
        option.value="Concrete.ttf";option.textContent="Bold modern";font.appendChild(option);
      }
      line1.value=setup.brand_line1||"";
      line2.value=setup.brand_line2||"";
      line3.value=setup.brand_line3||"";
      font.value=selected;loadedFont="";
      textSize.value=setup.brand_label_size||16;
      imageScale.value=setup.host_mark_scale||100;
      setupLocked=!!setup.locked;
      offsets.text.x=Number(setup.plaque_text_offset_x||0);
      offsets.text.y=Number(setup.plaque_text_offset_y||0);
      offsets.image.x=Number(setup.host_mark_offset_x||0);
      offsets.image.y=Number(setup.host_mark_offset_y||0);
      showImage(setup.image_url?`${core.API_BASE}${setup.image_url}&v=${Date.now()}`:"");
      if(setup.template_url){
        templatePreview.src=`${core.API_BASE}${setup.template_url}&v=${Date.now()}`;
      }else{
        templatePreview.removeAttribute("src");
        templatePreview.alt="Selected strip preview is not available";
      }
      paint();
      [imageInput,line1,line2,line3,font,textSize,imageScale,save].forEach(control=>{
        if(control)control.disabled=setupLocked;
      });
      document.querySelectorAll("[data-setup-nudge]").forEach(button=>{
        button.disabled=setupLocked;
      });
      status.textContent=setupLocked
        ?"Your event design has been approved and locked by Instapic."
        :(setup.status==="HOST_SAVED"?"Your saved setup is loaded.":"Choose your image and wording, then save.");
    }catch(error){status.textContent="Event setup is temporarily unavailable.";}
  }
  imageInput?.addEventListener("change",()=>{
    if(objectUrl)URL.revokeObjectURL(objectUrl);
    const file=imageInput.files?.[0];
    objectUrl=file?URL.createObjectURL(file):"";
    showImage(objectUrl);paint();
  });
  [line1,line2,line3,font,textSize,imageScale].forEach(input=>input?.addEventListener("input",paint));
  document.querySelectorAll("[data-setup-nudge]").forEach(button=>{
    button.addEventListener("click",()=>{
      const target=button.dataset.setupNudge;
      const axis=button.dataset.axis;
      const limit=axis==="x"?(target==="text"?40:30):20;
      offsets[target][axis]=Math.max(-limit,Math.min(limit,
        offsets[target][axis]+Number(button.dataset.delta||0)));
      paint();
    });
  });
  save?.addEventListener("click",async()=>{
    if(!eventCode||!pin||setupLocked)return;
    save.disabled=true;status.textContent="Saving…";
    try{
      await json(await fetch(`${core.API_BASE}/api/event-host-setup/${encodeURIComponent(eventCode)}`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          pin,brand_line1:line1.value,brand_line2:line2.value,
          brand_line3:line3.value,brand_label_font:font.value,
          brand_label_size:Number(textSize.value)||16,
          plaque_text_offset_x:offsets.text.x,plaque_text_offset_y:offsets.text.y,
          host_mark_offset_x:offsets.image.x,host_mark_offset_y:offsets.image.y,
          host_mark_scale:Number(imageScale.value)||100
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
