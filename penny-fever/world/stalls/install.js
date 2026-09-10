import {loadStallArt} from './art.js';
import {buildStall,buildHost,buildStallFront,updateHost} from './models.js';
import {STALL_ART} from './catalogue.js';
export {updateHost};
const presentations=new Map();let inspectionId=null;
function showPresentation(id,p){
 const selected=id===inspectionId;p.model.visible=!selected;p.front.visible=selected;
 p.signs.forEach(s=>s.visible=!selected);
}
export function setStallInspection(id){
 if(id===inspectionId)return;inspectionId=id;
 for(const [key,p] of presentations)showPresentation(key,p);
}

export function installStallArt(shell,id){
 if(!STALL_ART[id])return Promise.resolve(null);
 if(shell.userData.turnaroundPromise)return shell.userData.turnaroundPromise;
 shell.userData.turnaroundPromise=loadStallArt(id).then(art=>{
  const model=buildStall(id,art.stall);
  const front=buildStallFront(id,art.stall[0]);
  // The shell's widening belongs to its depth model, not to the original image.
  front.scale.x=1/shell.scale.x;
  // Never move or replace the gameplay door, walking sign, world solids or router.
  shell.children.forEach(child=>{if(!child.name.endsWith(' walking sign'))child.visible=false;});
  shell.add(model,front);shell.userData.turnaroundReady=id;shell.userData.turnaroundModel=model;
  const presentation={model,front,signs:shell.children.filter(c=>c.name.endsWith(' walking sign'))};
  presentations.set(id,presentation);showPresentation(id,presentation);return model;
 }).catch(error=>{
  shell.userData.turnaroundLoadFailed=id;delete shell.userData.turnaroundPromise;
  console.warn(`${id}: keeping fallback stall until artwork can be loaded.`,error);return null;
 });
 return shell.userData.turnaroundPromise;
}
export function installHostArt(person){
 const id=person.userData.stallId;if(!STALL_ART[id])return Promise.resolve(null);
 if(person.userData.turnaroundPromise)return person.userData.turnaroundPromise;
 person.userData.turnaroundPromise=loadStallArt(id).then(art=>{
  const model=buildHost(id,art.host);
  person.children.forEach(child=>{child.visible=false;globalThis.PennyFeverRestyle?.noteLiveBody(child);});
  person.add(model);globalThis.PennyFeverRestyle?.notePaperCutout(model);
  // mountRestyle ran before the asynchronous art arrived and flattened this root.
  // The new artwork is already paper-thin; do not flatten its rotated side views.
  person.scale.z=person.scale.x;
  person.userData.turnaroundFigure=model;person.userData.turnaroundReady=id;
  person.userData.crewName=STALL_ART[id].host;
  person.userData.paperCrew={stand:model,legs:[],lastX:person.position.x,lastZ:person.position.z,phase:STALL_ART[id].index*.7};
  globalThis.PennyFeverRestyle?.refreshRestyle();return model;
 }).catch(error=>{delete person.userData.turnaroundPromise;console.warn(`${id}: keeping fallback host.`,error);return null;});
 return person.userData.turnaroundPromise;
}
