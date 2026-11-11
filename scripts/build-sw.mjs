import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files=async(path)=>{const out=[];for(const e of await readdir(path,{withFileTypes:true})){if(e.isDirectory())out.push(...await files(path+'/'+e.name));else out.push(path+'/'+e.name);}return out;};
const paths=(await files('dist')).filter(p=>!p.endsWith('/sw.js')).sort();
const hash=createHash('sha256');for(const p of paths)hash.update(await readFile(p));const version=hash.digest('hex').slice(0,16);
const assets=paths.map(p=>'./'+p.slice(5));
await writeFile('dist/sw.js',`const CACHE='guide15-${version}';
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
// The app asks a waiting worker to activate only when no form has unsaved changes.
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('guide15-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(e.request,{ignoreSearch:true});if(hit)return hit;try{return await fetch(e.request);}catch(err){if(e.request.mode==='navigate')return await c.match('./index.html');throw err;}}));});
`);
console.log('Service worker precaches',assets.length,'assets; version',version);
