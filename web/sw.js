const CACHE = 'wareboss-local-v2';
const ASSETS = [
  './', './index.html', './app.js', './local-store.js', './local-shell.js', './excel-template.js',
  './vendor/vue.js', './vendor/xlsx.mjs', './vendor/xlsx-style.js',
  './styles.css', './refined.css', './mobile-ui.css', './form-safety.css', './local-mode.css', './h5-polish.css',
  './logo.svg', './manifest.webmanifest'
];

self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
));

self.addEventListener('activate', event => event.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('wareboss-local-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
