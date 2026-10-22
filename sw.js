const CACHE_NAME = 'break-free-beta-v08';
const ASSETS = ['./','./index.html','./analytics.js','./urges.js','./icon.svg','./manifest.webmanifest','./privacy.html','./testing.html','./install.html','./sw.js'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(names=>Promise.all(
    names.filter(n=>n.startsWith('break-free-') && n!==CACHE_NAME).map(n=>caches.delete(n))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  if(req.mode==='navigate') {
    event.respondWith(fetch(req).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy)).catch(()=>{});}
      return response;
    }).catch(()=>caches.match(req).then(cached=>cached||caches.match('./index.html'))));
  } else {
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy)).catch(()=>{});}
      return response;
    })));
  }
});