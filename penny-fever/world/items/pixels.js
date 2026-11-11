// Small CPU helpers shared by the runtime renderer and geometry checks.
export function removeBackground(data,w,h,clearCheckerHoles=false) {
  const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
  const visit=i=>{
    if(i<0||i>=w*h||seen[i])return;
    const p=i*4,lo=Math.min(data[p],data[p+1],data[p+2]),hi=Math.max(data[p],data[p+1],data[p+2]);
    if(data[p+3]>8&&(lo<225||hi-lo>14))return;
    seen[i]=1;queue[tail++]=i;
  };
  for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}
  for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
  while(head<tail){const i=queue[head++],x=i%w;data[i*4+3]=0;if(x>0)visit(i-1);if(x<w-1)visit(i+1);visit(i-w);visit(i+w);}
  let removed=tail;
  if(clearCheckerHoles){
    // The generated ring/shutter textures have checker patches inside enclosed openings.
    // Remove only neutral regions containing both checker shades; solid white highlights stay.
    for(let seed=0;seed<w*h;seed++){
      if(seen[seed])continue;
      head=tail=0;visit(seed);let light=0,grey=0;
      while(head<tail){
        const i=queue[head++],p=i*4,x=i%w;
        if(data[p]>=250&&data[p+1]>=250&&data[p+2]>=250)light++;
        if(data[p]>=230&&data[p]<=245&&Math.abs(data[p]-data[p+1])<3&&Math.abs(data[p]-data[p+2])<3)grey++;
        if(x>0)visit(i-1);if(x<w-1)visit(i+1);visit(i-w);visit(i+w);
      }
      if(tail>64&&light>8&&grey>8){removed+=tail;for(let n=0;n<tail;n++)data[queue[n]*4+3]=0;}
    }
  }
  return removed;
}
export function alphaBounds(data,w,h) {
  let left=w,top=h,right=-1,bottom=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>96){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  return right<left?null:{x:left,y:top,width:right-left+1,height:bottom-top+1};
}
// Trace every boundary, including holes, from a tiny binary silhouette.
export function contours(mask,w,h) {
  const edges=new Map(),stride=w+1;
  const on=(x,y)=>x>=0&&x<w&&y>=0&&y<h&&mask[y*w+x];
  const add=(x,y,u,v)=>{const key=y*stride+x,list=edges.get(key)||[];list.push(v*stride+u);edges.set(key,list);};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(on(x,y)){
    if(!on(x,y-1))add(x,y,x+1,y);
    if(!on(x+1,y))add(x+1,y,x+1,y+1);
    if(!on(x,y+1))add(x+1,y+1,x,y+1);
    if(!on(x-1,y))add(x,y+1,x,y);
  }
  const loops=[];
  while(edges.size){
    const start=edges.keys().next().value;let at=start;const points=[];
    do{
      points.push([at%stride,Math.floor(at/stride)]);
      const list=edges.get(at);if(!list?.length)break;
      const next=list.pop();if(!list.length)edges.delete(at);at=next;
    }while(at!==start&&points.length<=w*h*4);
    if(at===start&&points.length>=4)loops.push(points.filter((p,i,a)=>{
      const prev=a[(i+a.length-1)%a.length],next=a[(i+1)%a.length];
      return (p[0]-prev[0])*(next[1]-p[1])!==(p[1]-prev[1])*(next[0]-p[0]);
    }));
  }
  return loops;
}
export function signedArea(points){return points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2;}
