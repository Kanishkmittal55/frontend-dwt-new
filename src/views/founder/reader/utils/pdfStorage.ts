/**
 * PDF Storage Utility
 * Uses IndexedDB for storing large PDF files client-side
 */

const DB_NAME = 'clrs-reader';
const STORE_NAME = 'pdfs';
const PDF_KEY = 'clrs-pdf';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Save PDF file to IndexedDB
 */
export async function savePDF(file: File): Promise<void> {
  const db = await openDB();
  const arrayBuffer = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(arrayBuffer, PDF_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Load PDF from IndexedDB
 */
export async function loadPDF(): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(PDF_KEY);
      request.onsuccess = () => {
        const data = request.result;
        resolve(data ? new Blob([data], { type: 'application/pdf' }) : null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Check if PDF exists in storage
 */
export async function hasPDF(): Promise<boolean> {
  const pdf = await loadPDF();
  return pdf !== null;
}

/**
 * Delete PDF from storage
 */
export async function deletePDF(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(PDF_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

