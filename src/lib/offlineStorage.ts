// src/lib/offlineStorage.ts
'use client';

export interface OfflineMediaRecord {
  key: string; // 'music:123' | 'video:14'
  id: number;
  type: 'music' | 'video';
  title: string;
  subtitle: string;
  coverUrl?: string | null;
  duration?: number | null;
  mimeType: string;
  sizeBytes: number;
  blob: Blob;
  savedAt: string;
  explicitDownload: boolean;
}

const DB_NAME = 'podplay_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'media';

const blobUrlCache = new Map<string, string>();
const inFlightCache = new Set<string>();

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('explicitDownload', 'explicitDownload', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Erro ao abrir IndexedDB'));
  });
}

export async function saveOfflineMedia(record: OfflineMediaRecord): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => {
      blobUrlCache.delete(record.key);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineMedia(
  type: 'music' | 'video',
  id: number
): Promise<OfflineMediaRecord | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(`${type}:${id}`);
      req.onsuccess = () => resolve((req.result as OfflineMediaRecord) || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getOfflineBlobUrl(
  type: 'music' | 'video',
  id: number
): Promise<string | null> {
  const key = `${type}:${id}`;
  const cached = blobUrlCache.get(key);
  if (cached) return cached;

  const record = await getOfflineMedia(type, id);
  if (!record?.blob) return null;

  const url = URL.createObjectURL(record.blob);
  blobUrlCache.set(key, url);
  return url;
}

export async function listOfflineDownloads(
  type?: 'music' | 'video'
): Promise<OfflineMediaRecord[]> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => {
        const all = (req.result as OfflineMediaRecord[]) || [];
        const filtered = all
          .filter((item) => item.explicitDownload && (!type || item.type === type))
          .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        resolve(filtered);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function removeOfflineMedia(type: 'music' | 'video', id: number): Promise<void> {
  const key = `${type}:${id}`;
  const existingUrl = blobUrlCache.get(key);
  if (existingUrl) {
    URL.revokeObjectURL(existingUrl);
    blobUrlCache.delete(key);
  }
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Faz cache silencioso em background da música que o utilizador está a ouvir,
 * para que continue disponível mesmo se ficar offline.
 */
export async function cacheAudioInBackground(
  music: {
    id: number;
    title: string;
    artist: string;
    cover_image?: string | null;
    duration?: number | null;
  },
  srcUrl: string
): Promise<void> {
  const key = `music:${music.id}`;
  if (!srcUrl || srcUrl.startsWith('blob:') || inFlightCache.has(key)) return;

  const existing = await getOfflineMedia('music', music.id);
  if (existing) return;

  inFlightCache.add(key);
  try {
    const res = await fetch(srcUrl);
    if (!res.ok) return;
    const blob = await res.blob();
    if (!blob || blob.size === 0) return;

    await saveOfflineMedia({
      key,
      id: music.id,
      type: 'music',
      title: music.title,
      subtitle: music.artist,
      coverUrl: music.cover_image ?? null,
      duration: music.duration ?? null,
      mimeType: blob.type || 'audio/mpeg',
      sizeBytes: blob.size,
      blob,
      savedAt: new Date().toISOString(),
      explicitDownload: false,
    });
  } catch {
    // Silencioso: se falhar por rede/CORS, não interrompe a reprodução
  } finally {
    inFlightCache.delete(key);
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
  return `${mb.toFixed(1)} MB`;
}
