import { openDB, IDBPDatabase } from 'idb';
import type { Session, ClientAccount, Product, CafeSettings, SyncItem, AuditLog } from '../types';

const DB_NAME = 'nookos_db';
const DB_VERSION = 1;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Sessions
      if (!db.objectStoreNames.contains('sessions')) {
        const store = db.createObjectStore('sessions', { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('cafe_id', 'cafe_id');
        store.createIndex('started_at', 'started_at');
        store.createIndex('synced', 'synced');
      }

      // Client Accounts
      if (!db.objectStoreNames.contains('client_accounts')) {
        const store = db.createObjectStore('client_accounts', { keyPath: 'id' });
        store.createIndex('cafe_id', 'cafe_id');
        store.createIndex('name', 'name');
        store.createIndex('synced', 'synced');
      }

      // Products
      if (!db.objectStoreNames.contains('products')) {
        const store = db.createObjectStore('products', { keyPath: 'id' });
        store.createIndex('cafe_id', 'cafe_id');
        store.createIndex('category', 'category');
      }

      // Settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'cafe_id' });
      }

      // Sync Queue
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      }

      // Audit Log
      if (!db.objectStoreNames.contains('audit_log')) {
        const store = db.createObjectStore('audit_log', { keyPath: 'id' });
        store.createIndex('cafe_id', 'cafe_id');
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = initDB();
  }
  return dbPromise;
}
