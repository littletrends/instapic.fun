import {PAPERCUT_VIEWS} from './amusements/catalogue.js?v=florence-1';
import {AURA_WELCOMING_FRAMES} from './papercut-frames.js';
import {loadFramedPng,buildPapercut,setPapercutFace,papercutViewIndex,showPapercutView} from './amusements/cutouts.js?v=florence-1';

const active = new URLSearchParams(location.search).get('rail') === 'paper';
const ROOT='assets/restyle/scene-turnarounds-2026-09-09/aura/welcoming/';

/** Presentation only: never replaces the player or alters the rail/gate rules. */
export function installPaperProprietor(aura) {
  if (!active) return;
  const originalChildren = [...aura.children];
  originalChildren.forEach(child=>{child.visible=false;globalThis.PennyFeverRestyle?.noteLiveBody(child);});
  const opts={height:1.7,maxWidth:1.2,sideWidth:.55,layout:'stand'};
  loadFramedPng(ROOT+'front.webp',AURA_WELCOMING_FRAMES.front,{urgent:true}).then(async front=>{
    const cut=buildPapercut({front},opts);
    aura.add(cut);
    aura.userData.paperProprietor=cut;
    aura.userData.papercutViews=cut.userData.papercutViews;
    aura.userData.papercutStand=cut;
    aura.rotation.y=Math.PI;
    globalThis.PennyFeverRestyle?.refreshRestyle();
    for(const view of PAPERCUT_VIEWS){
      if(view==='front')continue;
      const face=await loadFramedPng(ROOT+view+'.webp',AURA_WELCOMING_FRAMES[view],{urgent:true});
      if(!cut.parent){face.texture?.dispose();return;}
      setPapercutFace(cut,view,face,opts);
      aura.userData.papercutViews=cut.userData.papercutViews;
    }
  }).catch(()=>console.warn('Paper Aura could not load; retaining the original proprietor figure.'));
}
export function updatePaperProprietor(aura,eye) {
  const stand=aura.userData.paperProprietor;
  if(!stand||!stand.visible||!eye)return;
  aura.scale.z=aura.scale.x;
  showPapercutView(aura, Number.isInteger(aura.userData.pinView)?aura.userData.pinView:0);
}
