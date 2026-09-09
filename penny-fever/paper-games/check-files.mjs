// Lightweight file/API sanity check only. No DOM, browser, GPU or game simulation.
import {access,readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {games} from './catalogue.js';
const root=new URL('./',import.meta.url),seen=new Set();
let count=0,chapters=0;
for(const g of games){
 if(seen.has(g.id)||!g.ready)throw Error('Duplicate or unfinished registry entry: '+g.id);
 seen.add(g.id);
 if(g.direct){await access(new URL(g.direct+'index.html',root));continue;}
 await access(new URL(g.asset,root));await access(new URL('art-prompts/'+g.id+'.md',root));
 const {default:engine}=await import(new URL(g.module,root));
 for(const fn of ['create','draw','update','readout'])if(typeof engine[fn]!=='function')throw Error(g.id+' missing '+fn);
 if(!engine.instructions||!engine.intro||engine.levels.length!==3)throw Error(g.id+' missing chapter/instructions');
 count++;chapters+=engine.levels.length;
}
const bridge=await readFile(new URL('alley-rooms.js',root),'utf8');
const whitelist=bridge.match(/const ids = new Set\(\[([^\]]+)\]\)/)?.[1].match(/'([^']+)'/g)?.map(x=>x.slice(1,-1));
if(!whitelist||whitelist.length!==count||whitelist.some(id=>!games.some(g=>g.id===id&&!g.direct)))throw Error('Alley bridge does not match the replacement games');
const page=await readFile(new URL('../index.html',root),'utf8');
for(const id of whitelist){if(!page.includes('data-enter="'+id+'"'))throw Error('No alley door for '+id);if(new RegExp('<script[^>]+src="vendors/'+id+'\\.js').test(page))throw Error('Legacy engine still loaded: '+id);}
for(const dir of ['./','./stalls/'])for(const file of await readdir(new URL(dir,root))){if(!file.endsWith('.js'))continue;const url=new URL(dir+file,root),body=await readFile(url,'utf8');for(const m of body.matchAll(/(?:from\s+|import\s*)['"](\.[^'"]+)['"]/g))await access(new URL(m[1],url));}
console.log(`${games.length} registered stalls: ${count} new engines / ${chapters} authored chapters + 2 preserved games.`);
console.log('Artwork, prompts, module imports, entry doors and replacement-router whitelist present.');
console.log('No browser or gameplay tests performed. Root: '+fileURLToPath(root));
