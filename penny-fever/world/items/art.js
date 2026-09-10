import {removeBackground,alphaBounds} from './pixels.js?v=treasures-1';
const cache=new Map();
function canvas(w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('The item picture could not be loaded.'));im.src=src;});}
export async function loadArt(item) {
  if(cache.has(item.id))return cache.get(item.id);
  const pending=(async()=>{
    const im=await loadImage(item.asset),parts=[];
    const sw=im.naturalWidth/item.columns,sh=im.naturalHeight/item.rows;
    for(let row=0;row<item.rows;row++)for(let col=0;col<item.columns;col++){
      const c=canvas(),ctx=c.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(im,col*sw,row*sh,sw,sh,0,0,512,512);
      const pixels=ctx.getImageData(0,0,512,512);
      if(!item.alpha)removeBackground(pixels.data,512,512,['whisper-charm','gyro-ghost','shutter-click'].includes(item.id));
      ctx.putImageData(pixels,0,0);
      const bounds=alphaBounds(pixels.data,512,512);if(!bounds)throw new Error('The item picture is empty.');
      parts.push({canvas:c,bounds});
    }
    // Match each reverse/state to the first face's footprint, preventing a jump on turning.
    const first=parts[0].bounds,scale=460/Math.max(first.width,first.height);
    const width=first.width*scale,height=first.height*scale;
    const faces=parts.map(({canvas:source,bounds})=>{
      const c=canvas(),ctx=c.getContext('2d');
      ctx.drawImage(source,bounds.x,bounds.y,bounds.width,bounds.height,(512-width)/2,(512-height)/2,width,height);
      return c;
    });
    return {faces,width:width/512*3,height:height/512*3};
  })();
  cache.set(item.id,pending);
  // Keep at most four decoded objects. GPU textures belong to the active viewer only.
  while(cache.size>4)cache.delete(cache.keys().next().value);
  try{return await pending;}catch(error){cache.delete(item.id);throw error;}
}
export function paintIcon(target,art,face=0){target.width=128;target.height=128;target.getContext('2d').drawImage(art.faces[face],0,0,128,128);}
