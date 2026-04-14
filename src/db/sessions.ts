import { getDB } from './database';
import type { Session } from '../types';

export async function saveSession(session: Session) {
  const db = await getDB();
  return db.put('sessions', session);
}

export async function getSession(id: string) {
  const db = await getDB();
  return db.get('sessions', id) as Promise<Session | undefined>;
}

export async function getActiveSessions(cafeId: string) {
  const db = await getDB();
  const tx = db.transaction('sessions', 'readonly');
  const index = tx.store.index('status');
  const sessions = await index.getAll('active');
  return sessions.filter(s => s.cafe_id === cafeId) as Session[];
}

export async function getSessionsByPeriod(cafeId: string, start: string, end: string) {
  const db = await getDB();
  const tx = db.transaction('sessions', 'readonly');
  const index = tx.store.index('started_at');
  const sessions = await index.getAll(IDBKeyRange.bound(start, end));
  return sessions.filter(s => s.cafe_id === cafeId) as Session[];
}

export async function getAllSessions(cafeId: string) {
  const db = await getDB();
  const tx = db.transaction('sessions', 'readonly');
  const index = tx.store.index('cafe_id');
  return index.getAll(cafeId) as Promise<Session[]>;
}
