/** Almacenamiento local de borradores KYB (IndexedDB); sin envío al backend en esta fase. */

export const KYB_LOCAL_MAX_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const DB_PREFIX = 'pleniu_kyb_docs_';

export interface KybLocalDocumentRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  status: 'pending' | 'processed' | 'rejected';
}

interface StoredRow extends KybLocalDocumentRecord {
  blob: Blob;
}

export function validateKybLocalFile(file: File): string | null {
  if (file.size > KYB_LOCAL_MAX_BYTES) {
    return 'El archivo supera el tamaño máximo permitido (15 MB).';
  }
  const t = file.type || '';
  if (!ALLOWED_MIME.has(t)) {
    return 'Tipo de archivo no permitido. Usa PDF, Word o imagen (JPEG, PNG, WebP).';
  }
  return null;
}

function dbName(enterpriseId: string): string {
  return `${DB_PREFIX}${enterpriseId}`;
}

function openDb(enterpriseId: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName(enterpriseId), 1);
    req.onerror = () => reject(req.error ?? new Error('indexedDB'));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('docs')) {
        db.createObjectStore('docs', { keyPath: 'id' });
      }
    };
  });
}

export async function kybLocalListDocs(enterpriseId: string): Promise<KybLocalDocumentRecord[]> {
  const db = await openDb(enterpriseId);
  try {
    return await new Promise<KybLocalDocumentRecord[]>((resolve, reject) => {
      const tx = db.transaction('docs', 'readonly');
      const r = tx.objectStore('docs').getAll();
      r.onerror = () => reject(r.error);
      r.onsuccess = () => {
        const rows = r.result as StoredRow[];
        resolve(
          rows.map(({ id, fileName, mimeType, sizeBytes, uploadedAt, status }) => ({
            id,
            fileName,
            mimeType,
            sizeBytes,
            uploadedAt,
            status,
          })),
        );
      };
    });
  } finally {
    db.close();
  }
}

export async function kybLocalAddDoc(enterpriseId: string, file: File): Promise<KybLocalDocumentRecord> {
  const msg = validateKybLocalFile(file);
  if (msg) {
    throw new Error(msg);
  }
  const id = globalThis.crypto.randomUUID();
  const row: StoredRow = {
    id,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    status: 'pending',
    blob: file,
  };
  const db = await openDb(enterpriseId);
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('docs', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore('docs').put(row);
    });
  } finally {
    db.close();
  }
  const { blob: _b, ...meta } = row;
  return meta;
}

export async function kybLocalRemoveDoc(enterpriseId: string, id: string): Promise<void> {
  const db = await openDb(enterpriseId);
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('docs', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore('docs').delete(id);
    });
  } finally {
    db.close();
  }
}
