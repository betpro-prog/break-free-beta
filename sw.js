const CACHE_NAME = 'break-free-beta-v03';
const ASSETS = ['./','./index.html','./privacy.html','./testing.html','./sw.js'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(names=>Promise.all(
    names.filter(n=>n.startsWith('break-free-') && n!==CACHE_NAME).map(n=>caches.delete(n))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});