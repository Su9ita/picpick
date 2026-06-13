/**
 * 保存済み画像の台帳（重複スキップ用）。
 *
 * chrome.storage.sync は容量が小さい（〜100KB）ため、クリエイター単位で
 * 大量に増える保存済みIDの記録には IndexedDB を使う。
 * キーは `${creatorId}::${imageId}` で、再サブスク時はこの台帳と
 * 突き合わせて未保存の画像だけを抽出する。
 */

const DB_NAME = 'picpick';
const DB_VERSION = 1;
const STORE = 'savedImages';

interface SavedRecord {
  key: string;        // `${creatorId}::${imageId}`
  creatorId: string;
  postId: string;
  imageId: string;
  savedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'key' });
        store.createIndex('creatorId', 'creatorId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function makeKey(creatorId: string, imageId: string): string {
  return `${creatorId}::${imageId}`;
}

/** creatorId について保存済みの imageId 集合を返す。 */
export async function getSavedImageIds(creatorId: string): Promise<Set<string>> {
  const db = await openDb();
  try {
    return await new Promise<Set<string>>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const index = tx.objectStore(STORE).index('creatorId');
      const req = index.getAll(IDBKeyRange.only(creatorId));
      req.onsuccess = () => {
        const set = new Set<string>();
        for (const rec of (req.result as SavedRecord[]) || []) {
          set.add(rec.imageId);
        }
        resolve(set);
      };
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

/** 画像IDを保存済みとして記録する。 */
export async function markImagesSaved(
  creatorId: string,
  postId: string,
  imageIds: string[]
): Promise<void> {
  if (imageIds.length === 0) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const now = Date.now();
      for (const imageId of imageIds) {
        const record: SavedRecord = {
          key: makeKey(creatorId, imageId),
          creatorId,
          postId,
          imageId,
          savedAt: now,
        };
        store.put(record);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** creatorId の保存済み画像数を返す。 */
export async function getSavedCount(creatorId: string): Promise<number> {
  const db = await openDb();
  try {
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const index = tx.objectStore(STORE).index('creatorId');
      const req = index.count(IDBKeyRange.only(creatorId));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}
