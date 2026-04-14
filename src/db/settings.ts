import { getDB } from './database';
import type { CafeSettings } from '../types';

export async function saveSettings(settings: CafeSettings) {
  const db = await getDB();
  return db.put('settings', settings);
}

export async function getSettings(cafeId: string) {
  const db = await getDB();
  return db.get('settings', cafeId) as Promise<CafeSettings | undefined>;
}
