import { getDB } from './database';
import type { SyncItem } from '../types';

export async function addToSyncQueue(item: SyncItem) {
  const db = await getDB();
  return db.put('sync_queue', item);
}

export async function getSyncQueue() {
  const db = await getDB();
  return db.getAll('sync_queue') as Promise<SyncItem[]>;
}

export async function removeFromSyncQueue(id: string) {
  const db = await getDB();
  return db.delete('sync_queue', id);
}

export async function updateSyncItem(item: SyncItem) {
  const db = await getDB();
  return db.put('sync_queue', item);
}
