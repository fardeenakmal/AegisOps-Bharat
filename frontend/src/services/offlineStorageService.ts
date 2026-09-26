import { submitCitizenReport, updateResourceStatus } from './api';

export interface OutboxItem {
  id?: number;
  actionType: 'SUBMIT_REPORT' | 'UPDATE_RESPONDER_STATUS' | 'LOG_FIELD_NOTE';
  payload: any;
  timestamp: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  retryCount: number;
}

class OfflineStorageService {
  private dbName = 'aegisops_offline_db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private isSyncing = false;

  constructor() {
    this.initIndexedDb();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[OfflineStorage] Device came online. Triggering auto-sync...');
        this.notifyQueueChanged();
        this.syncOutboxQueue();
      });

      window.addEventListener('offline', () => {
        console.warn('[OfflineStorage] Device went offline. Committing to IndexedDB.');
        this.notifyQueueChanged();
      });
    }
  }

  private async initIndexedDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB not supported in current environment');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('outboxQueue')) {
          db.createObjectStore('outboxQueue', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('cachedIncidents')) {
          db.createObjectStore('cachedIncidents', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cachedResources')) {
          db.createObjectStore('cachedResources', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve(this.db!);
      };

      request.onerror = (event: any) => {
        console.error('[IndexedDB Open Error]', event);
        reject(event.target.error);
      };
    });
  }

  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Enqueues an action into IndexedDB outbox
   */
  public async queueAction(actionType: OutboxItem['actionType'], payload: any): Promise<number> {
    const db = await this.initIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outboxQueue', 'readwrite');
      const store = tx.objectStore('outboxQueue');
      const item: Omit<OutboxItem, 'id'> = {
        actionType,
        payload,
        timestamp: new Date().toISOString(),
        status: 'PENDING',
        retryCount: 0
      };

      const req = store.add(item);
      req.onsuccess = (e: any) => {
        this.notifyQueueChanged();
        resolve(e.target.result as number);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Returns count of pending queued outbox actions
   */
  public async getPendingQueueCount(): Promise<number> {
    try {
      const db = await this.initIndexedDb();
      return new Promise((resolve) => {
        const tx = db.transaction('outboxQueue', 'readonly');
        const store = tx.objectStore('outboxQueue');
        const countReq = store.count();
        countReq.onsuccess = () => resolve(countReq.result);
        countReq.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  /**
   * Flushes and synchronizes outbox actions to the backend
   */
  public async syncOutboxQueue(): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline() || this.isSyncing) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const db = await this.initIndexedDb();
      const items: OutboxItem[] = await new Promise((resolve) => {
        const tx = db.transaction('outboxQueue', 'readonly');
        const store = tx.objectStore('outboxQueue');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      if (items.length === 0) {
        this.isSyncing = false;
        return { synced: 0, failed: 0 };
      }

      console.log(`[OfflineStorage] Flushing ${items.length} outbox items to AegisOps server...`);

      for (const item of items) {
        try {
          if (item.actionType === 'SUBMIT_REPORT') {
            await submitCitizenReport({
              ...item.payload,
              submissionChannel: 'OFFLINE_FIELD_PWA'
            });
          } else if (item.actionType === 'UPDATE_RESPONDER_STATUS') {
            await updateResourceStatus(item.payload.id, item.payload.status);
          }

          // Delete from outbox upon success
          await new Promise<void>((res, rej) => {
            const delTx = db.transaction('outboxQueue', 'readwrite');
            const delStore = delTx.objectStore('outboxQueue');
            const delReq = delStore.delete(item.id!);
            delReq.onsuccess = () => res();
            delReq.onerror = () => rej(delReq.error);
          });

          synced++;
        } catch (err) {
          console.warn(`[OfflineStorage] Failed to sync item ${item.id}:`, err);
          failed++;
        }
      }
    } catch (err) {
      console.error('[OfflineStorage Sync Error]', err);
    } finally {
      this.isSyncing = false;
      this.notifyQueueChanged();
    }

    return { synced, failed };
  }

  /**
   * High-level wrapper: tries live online API first.
   * If network is down or throws network error, queues into IndexedDB and resolves gracefully.
   */
  public async queueOrExecute<T>(
    actionType: OutboxItem['actionType'],
    payload: any,
    apiFn: () => Promise<T>
  ): Promise<{ data?: T; isOfflineQueued: boolean }> {
    if (this.isOnline()) {
      try {
        const result = await apiFn();
        return { data: result, isOfflineQueued: false };
      } catch (err: any) {
        // If it's a network disconnect / fetch failed, queue offline
        if (!navigator.onLine || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          console.warn('[OfflineStorage] Live call failed due to network. Queuing offline item.');
          await this.queueAction(actionType, payload);
          return { isOfflineQueued: true };
        }
        throw err;
      }
    } else {
      // Offline mode
      console.warn('[OfflineStorage] Offline mode active. Queuing action into IndexedDB.');
      await this.queueAction(actionType, payload);
      return { isOfflineQueued: true };
    }
  }

  private notifyQueueChanged() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('offline-queue-changed'));
    }
  }
}

export const offlineStorageService = new OfflineStorageService();

