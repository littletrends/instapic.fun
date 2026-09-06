/* Aura's Love Tester — one-gesture timing cabinet. PF only. */
function boot(){const PF=window.PennyFever;if(!PF||!PF.registerVendor){requestAnimationFrame(boot);return;}mount(PF);}boot();

function mount(PF){
  "use strict";
  const $=PF.$;
  let raf=0,roundTimer=0,active=false,holding=false,value=0,last=0,round=0,total=0,zoneLo=54,zoneHi=70,speed=31;
  const card=$("loveCard"),machine=$("loveStage"),lever=$("loveLever"),start=$("loveGo");
  const mercury=$("loveMercury"),needle=$("loveNeedle"),zone=$("loveSweetZone"),status=$("loveStatus"),barker=$("loveBarker"),aura=$("loveAuraFace");
  function state(){return PF.getState();}
  function paint(){mercury.style.height=value+"%";needle.style.bottom=value+"%";const readout=$("thermoReadout");if(readout)readout.textContent="♥ "+Math.round(value);}
  function moveZone(){
    const width=Math.max(9,16-round*2);
    zoneLo=38+Math.random()*Math.max(8,48-width);zoneHi=zoneLo+width;
    zone.style.bottom=zoneLo+"%";zone.style.height=width+"%";
  }
  function say(text,kind){
    barker.textContent=text;status.textContent=text;
    aura.className="love-aura-window"+(kind?" is-"+kind:"");
    setTimeout(()=>{if(aura)aura.className="love-aura-window";},900);
  }
  function tick(now){
    if(!active)return;
    const dt=Math.min(.05,(now-last)/1000||0);last=now;
    if(holding){
      value+=speed*dt*(1+.12*Math.sin(now/170));
      if(value>=100){value=100;paint();release(true);return;}
      paint();
    }
    raf=requestAnimationFrame(tick);
  }
  function startRound(){value=0;holding=false;speed=29+round*7+Math.random()*7;moveZone();paint();lever.disabled=false;lever.classList.remove("is-held");say(round?`Heat ${round+1}. The mercury is less polite now.`:"Hold the heart. Let go inside Sweet Heat.");}
  function begin(){
    if(active)return;
    if(!PF.spendDemoCoin("love")){say("The slot wants another penny.","laughing");return;}
    active=true;round=0;total=0;start.disabled=true;card.classList.add("is-playing");card.classList.remove("is-result");$("loveResult").hidden=true;$("loveVerdict").hidden=true;
    startRound();last=performance.now();raf=requestAnimationFrame(tick);
  }
  function press(e){if(!active||lever.disabled)return;e.preventDefault();holding=true;lever.classList.add("is-held");lever.setPointerCapture?.(e.pointerId);say("Easy… easy…","cheering");}
  function release(boiled=false){
    if(!active||(!holding&&!boiled))return;
    holding=false;lever.classList.remove("is-held");lever.disabled=true;
    const centre=(zoneLo+zoneHi)/2,dist=Math.abs(value-centre),inside=value>=zoneLo&&value<=zoneHi;
    const points=inside?Math.max(70,Math.round(100-dist*4)):Math.max(0,Math.round(62-dist*2.2));total+=points;
    if(boiled||value>zoneHi+13){machine.classList.add("is-boiling");say("BOIL OVER! Aura says confidence is not temperature control.","laughing");setTimeout(()=>machine.classList.remove("is-boiling"),800);finish("BOILED",points);return;}
    if(value<zoneLo){say(value<25?"Cold as the other side of the pillow.":"A shy little flutter. Too soon.","laughing");finish("TOO COLD",points);return;}
    if(!inside){say("Hot—but Sweet Heat slipped past you.","laughing");finish("TOO HOT",points);return;}
    round+=1;say(points>92?"DEAD CENTRE! Aura felt that one.":"Sweet Heat! The cabinet approves.","cheering");
    if(round>=3){roundTimer=setTimeout(()=>finish("SWEET HEAT",points),650);}else roundTimer=setTimeout(startRound,700);
  }
  function finish(reason,lastPoints){
    active=false;cancelAnimationFrame(raf);lever.disabled=true;start.disabled=false;start.textContent="TRY MY LUCK AGAIN";card.classList.remove("is-playing");card.classList.add("is-result");
    const score=Math.round(total/Math.max(1,round+(reason!=="SWEET HEAT"?1:0)));
    const depth=Math.max(1,round);const s=state();s.loveBest=Math.max(Number(s.loveBest)||0,score);s.bestDepth=s.bestDepth||{};s.bestDepth.love=Math.max(Number(s.bestDepth.love)||0,depth);PF.saveState();PF.refreshNightBoard();
    $("loveStageDepth").textContent="Heat "+depth;$("loveBestDepth").textContent=s.loveBest+"°";$("loveResultDepth").textContent="HEAT "+depth+" OF 3";$("loveResultScore").textContent=score+"° · "+reason;$("loveResultAura").textContent=score>=85?"Aura: That has singed my fringe.":score>=55?"Aura: There is definitely something there.":"Aura: I have met warmer teaspoons.";$("loveChallengeText").textContent=`I scored ${score}° on Aura's Love Tester. Beat my heat.`;$("loveResult").hidden=false;PF.showBanner(score>=70,score>=90?"SWEET HEAT":reason,score+"°");
  }
  function leave(){active=false;holding=false;cancelAnimationFrame(raf);clearTimeout(roundTimer);lever.classList.remove("is-held");machine.classList.remove("is-boiling");lever.disabled=true;}
  function show(){card.classList.remove("is-playing");lever.disabled=true;start.disabled=false;const s=state();$("loveBestDepth").textContent=s.loveBest?`${s.loveBest}°`:"—";paint();}
  function bind(){start.addEventListener("click",begin);lever.addEventListener("pointerdown",press);["pointerup","pointercancel","lostpointercapture"].forEach(n=>lever.addEventListener(n,()=>release(false)));}
  PF.registerVendor({id:"love",playKey:"love",bind,onShow:show,onLeave:leave,onReset(){leave();value=0;round=0;total=0;paint();}});
}
