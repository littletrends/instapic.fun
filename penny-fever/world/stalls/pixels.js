// Pale parchment, not a white/chroma-key sprite atlas. Remove only edge-connected
// background; interior eye highlights, cream aprons and paper lettering stay intact.
export function clearParchment(data,w,h) {
 const n=w*h,seen=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0;
 const bg=i=>{const p=i*4,r=data[p],g=data[p+1],b=data[p+2];
  return data[p+3]<8||(r>=209&&g>=193&&b>=159&&r-g>=-5&&r-g<38&&g-b>=-5&&g-b<43);
 };
 const visit=i=>{if(i<0||i>=n||seen[i]||!bg(i))return;seen[i]=1;queue[tail++]=i;};
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
 while(head<tail){const i=queue[head++],x=i%w;data[i*4+3]=0;if(x)visit(i-1);if(x<w-1)visit(i+1);visit(i-w);visit(i+w);}
 // Discard only tiny encoding flecks and slender divider lines. Keep disconnected
// lanterns, juggling balls, held props and the original pavement signs.
 const marked=new Uint8Array(n);
 for(let start=0;start<n;start++){
  if(marked[start]||data[start*4+3]<96)continue;
  head=tail=0;let x0=w,x1=0,y0=h,y1=0;queue[tail++]=start;marked[start]=1;
  while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   const add=j=>{if(j>=0&&j<n&&!marked[j]&&data[j*4+3]>=96){marked[j]=1;queue[tail++]=j;}};
   if(x)add(i-1);if(x<w-1)add(i+1);add(i-w);add(i+w);
  }
  if(tail<12||(x1-x0<3&&y1-y0>h*.6)||(y1-y0<3&&x1-x0>w*.6))for(let j=0;j<tail;j++)data[queue[j]*4+3]=0;
 }
 return data;
}
export function bounds(data,w,h) {
 let l=w,t=h,r=-1,b=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=96){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 return r<l?null:{x:l,y:t,width:r-l+1,height:b-t+1};
}
