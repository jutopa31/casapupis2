// Service Worker for PWA install support
// Minimal SW that enables the beforeinstallprompt event

const CACHE_NAME = 'jj-wedding-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through — no caching, just enables PWA installability
  event.respondWith(fetch(event.request));
});
