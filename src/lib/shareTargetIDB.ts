/**
 * Helpers para leer los archivos que el Service Worker guardó en IndexedDB
 * cuando el usuario compartió fotos desde el menú nativo de Android.
 *
 * La función `popSharedFiles` lee todos los registros, limpia el store,
 * y devuelve un array de File (puede ser vacío si no hay nada).
 */

const IDB_NAME = 'jj-share-target';
const IDB_STORE = 'shared-files';
const IDB_VERSION = 1;

interface SharedFileRecord {
  id: number;
  name: string;
  type: string;
  data: ArrayBuffer;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Lee todos los archivos guardados por el SW, limpia el store y los devuelve
 * como array de File. Devuelve [] si no hay nada o si ocurre algún error.
 */
export async function popSharedFiles(): Promise<File[]> {
  try {
    const db = await openDB();
    const records = await new Promise<SharedFileRecord[]>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const all = store.getAll();
      all.onsuccess = () => {
        store.clear();
        resolve(all.result as SharedFileRecord[]);
      };
      all.onerror = () => reject(all.error);
    });

    return records.map((r) => new File([r.data], r.name, { type: r.type }));
  } catch {
    return [];
  }
}
