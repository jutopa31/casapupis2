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

async function saveSharedFiles(files) {
  const db = await openShareDB();
  // Convertir a ArrayBuffer de forma secuencial para evitar cargar N fotos
  // de alta resolución en memoria simultáneamente.
  const normalized = [];
  for (const file of files) {
    normalized.push({
      name: file.name || 'shared-photo.jpg',
      type: file.type || 'image/jpeg',
      data: await file.arrayBuffer(),
      timestamp: Date.now(),
    });
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    // Limpiar lote anterior y guardar todos los nuevos en la misma transacción
    store.clear();
    normalized.forEach((item) => store.add(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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
          const files = formData.getAll('photo').filter((f) => f instanceof File);
          if (files.length) {
            await saveSharedFiles(files);
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
