// Juntada 9º GBM — funciona sem internet depois da primeira abertura.
const VERSAO = "juntada-v15";
const APP = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Página: tenta a rede (para receber atualizações), cai no cache sem internet.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSAO).then(x => x.put("index.html", c)); } return r; })
      .catch(() => caches.match("index.html").then(h => h || caches.match("./"))));
    return;
  }
  // Arquivos do app (ícones, manifesto): cache primeiro, atualiza em segundo plano.
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSAO).then(x => x.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
