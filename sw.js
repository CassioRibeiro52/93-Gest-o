
const CACHE_NAME = 'gestao93-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Não faz cache de requisições de outros domínios (Google APIs, Tailwind CDN, etc)
  // Isso evita o erro de "origin mismatch"
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Apenas faz cache de arquivos estáticos locais bem-sucedidos
          if (event.request.method === 'GET' && fetchRes.status === 200) {
            cache.put(event.request, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    }).catch(() => {
      // Se estiver offline e for uma navegação, retorna a página inicial
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
