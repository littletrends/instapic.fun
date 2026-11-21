// Plain, versioned local-study data. No wallet, server or original-game saves.
export const copy=value=>JSON.parse(JSON.stringify(value));
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ease=t=>t*t*(3-2*t);
export function remember(s){const prior=copy(s);delete prior.history;delete prior.pointerDown;delete prior.saveError;s.history.push(prior);if(s.history.length>36)s.history.shift();}
export function undo(s){if(!s.history.length||s.phase==='celebrate'||s.result)return false;const history=s.history.slice(),prior=history.pop();Object.assign(s,copy(prior),{history});delete s.pointerDown;delete s.saveError;s.note='One decision rewound.';return true;}
export function snapshot(s){const out=copy(s);delete out.pointerDown;delete out.saveError;return out;}
export function base(kind,note,level=0){return {v:2,kind,level,t:0,phase:'play',moves:0,history:[],note,result:null,chapterPrize:null,prizeKept:false,rewardReveal:null,completionRecorded:false,pendingPennies:0,paidPennies:0};}
export function validate(blob,kind){
 const fail=()=>{throw Error('This saved study needs attention; it has not been reset.');};
 if(!blob||![1,2].includes(blob.v)||blob.kind!==kind||!Number.isInteger(blob.level)||blob.level<0||blob.level>5||(blob.v===1&&blob.level!==0)||!['play','moving','celebrate','result'].includes(blob.phase)||!Number.isFinite(blob.t)||blob.t<0||!Number.isSafeInteger(blob.moves)||blob.moves<0||!Array.isArray(blob.history)||blob.history.length>36||blob.history.some(h=>h.history!==undefined)||typeof blob.prizeKept!=='boolean'||typeof blob.completionRecorded!=='boolean')fail();
 if(![blob.pendingPennies,blob.paidPennies].every(v=>Number.isSafeInteger(v)&&v>=0&&v<=10))fail();
 return fail;
}
