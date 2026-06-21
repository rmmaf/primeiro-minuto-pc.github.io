// Service worker do PWA "1º Minuto"
// Precisa ser um arquivo real servido pelo mesmo domínio (HTTPS) — o Chrome
// recusa service workers criados a partir de blob:/data: URLs, e sem um SW
// válido o navegador não oferece a opção de instalar o app.

const CACHE_NAME = 'primeiro-minuto-v1';

// Caminhos relativos: este SW vive na raiz publicada
// (https://rmmaf.github.io/primeiro-minuto-pc.github.io/), então o escopo já
// fica correto e os assets resolvem a partir daqui.
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/android-chrome-192x192.png',
  './icons/android-chrome-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32x32.png',
  './icons/favicon-16x16.png',
  './icons/favicon.ico',
];

// Instala e pré-armazena os assets. allSettled garante que um eventual 404
// em um ícone não derrube a instalação inteira do service worker.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// Limpa caches antigos quando uma nova versão assume.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Estratégia cache-first com fallback de rede; para navegações offline,
// devolve o index.html em cache (app funciona sem internet depois de instalado).
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).catch(() => {
        if (request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
