import { getDB } from './database';
import type { AuditLog } from '../types';

export async function addAuditLog(cafe_id: string, staff_id: string, action: string, details: string) {
  const db = await getDB();
  const log: AuditLog = {
    id: crypto.randomUUID(),
    cafe_id,
    staff_id,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  return db.put('audit_log', log);
}

export async function getAuditLogs(cafeId: string) {
  const db = await getDB();
  const tx = db.transaction('audit_log', 'readonly');
  const index = tx.store.index('cafe_id');
  return index.getAll(cafeId) as Promise<AuditLog[]>;
}
