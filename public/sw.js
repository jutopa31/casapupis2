// Service Worker for PWA install support + Web Share Target
const CACHE_NAME = 'jj-wedding-v1';

// ---------------------------------------------------------------------------
// IndexedDB helpers (used to pass the shared file to the page)
// ---------------------------------------------------------------------------

const IDB_NAME = 'jj-share-target';
const IDB_STORE = 'shared-files';
const IDB_VERSION = 1;

function openShareDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveSharedFile(file) {
  const db = await openShareDB();
  const arrayBuffer = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    // Keep only the latest shared file
    store.clear();
    const req = store.add({
      name: file.name || 'shared-photo.jpg',
      type: file.type || 'image/jpeg',
      data: arrayBuffer,
      timestamp: Date.now(),
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ---------------------------------------------------------------------------
// Fetch — intercept Web Share Target POST
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname === '/share') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const file = formData.get('photo');
          if (file && file instanceof File) {
            await saveSharedFile(file);
          }
        } catch (err) {
          console.error('[SW] Error procesando share:', err);
        }
        return Response.redirect('/fotos-invitados?fromShare=1', 303);
      })()
    );
    return;
  }

  // Pass through — no caching, just enables PWA installability
  event.respondWith(fetch(event.request));
});
