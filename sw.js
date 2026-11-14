/* The Moon Tekne Paneli servis çalışanı. Bozulursa: aşağıdaki satırı true yapın; kendini siler, önbellekleri boşaltır. */
const KAPALI=false;
const SURUM='1';
const ONEK='tekne-panel-',AD=ONEK+SURUM;
const HTML_ZAMAN=3000;
const CDN=['cdnjs.cloudflare.com','cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'];
const VERI=/\/(kiyi-[\w-]+|isaretler-istanbul)\.json$/;
const kok=new URL('./',self.registration.scope).href,anaSayfa=kok+'index.html';

self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const ks=await caches.keys();
  await Promise.all(ks.filter(k=>k.startsWith(ONEK)&&(KAPALI||k!==AD)).map(k=>caches.delete(k)));
  if(KAPALI){await self.registration.unregister();return}
  await self.clients.claim()})()));

async function koy(c,key,r){if(r&&(r.ok||r.type==='opaque'))try{await c.put(key,r.clone())}catch(e){}return r}

/* HTML: önce ağ (kısa zaman aşımı), olmazsa önbellek */
function htmlIstegi(e){
  const req=e.request;
  const ag=fetch(req.url,{cache:'no-cache'}).then(async r=>{const c=await caches.open(AD);return koy(c,anaSayfa,r)});
  e.waitUntil(ag.catch(()=>{}));
  return (async()=>{
    const c=await caches.open(AD),eski=()=>c.match(anaSayfa);
    const zaman=new Promise(r=>setTimeout(()=>r(null),HTML_ZAMAN));
    try{const r=await Promise.race([ag,zaman]);if(r)return r}catch(x){}
    const o=await eski();if(o)return o;
    return ag})();
}
/* Betik, yazı tipi, kıyı verisi: önbellekten ver, arkada tazele */
function eskiyiVer(e){
  const req=e.request;
  return (async()=>{
    const c=await caches.open(AD),o=await c.match(req);
    const ag=fetch(req).then(r=>koy(c,req,r));
    if(o){e.waitUntil(ag.catch(()=>{}));return o}
    return ag})();
}

self.addEventListener('fetch',e=>{
  if(KAPALI)return;
  const req=e.request;
  if(req.method!=='GET'||req.headers.has('range'))return;
  let u;try{u=new URL(req.url)}catch(x){return}
  if(u.origin===location.origin){
    if(!u.href.startsWith(kok))return;            /* /Aksi/ betikleri (hesap) hiç dokunulmaz */
    if(req.mode==='navigate'||u.pathname.endsWith('/index.html')||u.href===kok){e.respondWith(htmlIstegi(e));return}
    if(VERI.test(u.pathname)){e.respondWith(eskiyiVer(e));return}
    return}
  if(CDN.includes(u.hostname)){e.respondWith(eskiyiVer(e))}
  /* harita karoları, kamera/HLS, hava durumu, hesap servisi: ağa doğrudan */
});
