const CACHE='hn-exam-v2-6-persistent-notes';
const CORE=[
  './','./index.html','./manifest.json',
  './icon-180.png','./icon-192.png','./icon-512.png',
  './style.css?v=2.6.0','./questions.js?v=2.6.0','./remediation.js?v=2.6.0',
  './deep_remediation.js?v=2.6.0','./deep_items_112.js?v=2.6.0','./deep_items_113.js?v=2.6.0',
  './deep_items_114.js?v=2.6.0','./deep_items_115.js?v=2.6.0','./deep_items_all_remaining.js?v=2.6.0',
  './app.js?v=2.6.0'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 if(u.origin!==location.origin)return;
 const isCode=/\.(?:js|css|html)$/.test(u.pathname)||u.pathname.endsWith('/');
 if(isCode){
   e.respondWith(fetch(e.request,{cache:'no-store'}).then(resp=>{
     const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return resp;
   }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
 }else{
   e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
     const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return resp;
   })));
 }
});
