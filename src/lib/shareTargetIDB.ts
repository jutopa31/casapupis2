/**
 * Helpers para leer el archivo que el Service Worker guardó en IndexedDB
 * cuando el usuario compartió una foto desde el menú nativo de Android.
 *
 * La función `popSharedFile` lee el archivo más reciente y limpia el store,
 * de modo que no quede basura si el usuario navega de vuelta.
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
 * Lee el archivo guardado por el SW, lo elimina del store y lo devuelve como File.
 * Devuelve null si no hay nada guardado o si ocurre algún error.
 */
export async function popSharedFile(): Promise<File | null> {
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

    if (records.length === 0) return null;

    const latest = records[records.length - 1];
    return new File([latest.data], latest.name, { type: latest.type });
  } catch {
    return null;
  }
}
