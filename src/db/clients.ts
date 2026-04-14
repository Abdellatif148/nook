import { getDB } from './database';
import type { ClientAccount } from '../types';

export async function saveClient(client: ClientAccount) {
  const db = await getDB();
  return db.put('client_accounts', client);
}

export async function getClient(id: string) {
  const db = await getDB();
  return db.get('client_accounts', id) as Promise<ClientAccount | undefined>;
}

export async function getClients(cafeId: string) {
  const db = await getDB();
  const tx = db.transaction('client_accounts', 'readonly');
  const index = tx.store.index('cafe_id');
  return index.getAll(cafeId) as Promise<ClientAccount[]>;
}
