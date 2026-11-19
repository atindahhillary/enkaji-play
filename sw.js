// Offline support: the Mara has weak signal, so cache the whole site after the first visit.
// Bump VERSION on every deploy that changes files, so phones pick up the new copy.
const VERSION = 'enkaji-v7';
const FILES = ['./', 'index.html', 'styles.css', 'games.css', 'data.js', 'sound.js', 'art.js', 'games.js', 'app.js', 'manifest.webmanifest', 'icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network first (fresh content when there is signal), cache as the fallback. Fonts: cache first.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const font = /fonts\.(googleapis|gstatic)\.com/.test(req.url);
  if (!font && new URL(req.url).origin !== location.origin) return;
  if (font) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(hit => hit || caches.match('index.html'))));
});
