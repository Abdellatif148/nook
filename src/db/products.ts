import { getDB } from './database';
import type { Product } from '../types';

export async function saveProduct(product: Product) {
  const db = await getDB();
  return db.put('products', product);
}

export async function getProducts(cafeId: string) {
  const db = await getDB();
  const tx = db.transaction('products', 'readonly');
  const index = tx.store.index('cafe_id');
  return index.getAll(cafeId) as Promise<Product[]>;
}

export async function deleteProduct(id: string) {
  const db = await getDB();
  return db.delete('products', id);
}
