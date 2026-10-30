const CACHE = 'wareboss-local-v1';
const ASSETS = ['./', './index.html', './app.js', './local-store.js', './vendor/vue.js', './styles.css', './refined.css', './mobile-ui.css', './form-safety.css', './local-mode.css', './logo.svg', './manifest.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response; })));
});
