import * as React from 'react';
import { getSyncQueue, removeFromSyncQueue, updateSyncItem } from '../db/syncQueue';
import { sessionsApi } from '../api/sessions';
import { clientsApi } from '../api/clients';
import { authApi } from '../api/auth';
import { useUIStore } from '../stores/uiStore';

export function useSync() {
  const { addToast } = useUIStore();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [pendingCount, setPendingCount] = React.useState(0);

  const processQueue = React.useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;

    const queue = await getSyncQueue();
    setPendingCount(queue.length);
    if (queue.length === 0) return;

    setIsSyncing(true);

    for (const item of queue) {
      if (item.retry_count > 5) continue;

      try {
        switch (item.type) {
          case 'create_session':
            await sessionsApi.start(item.payload);
            break;
          case 'update_session':
            await sessionsApi.end(item.payload.id, item.payload);
            break;
          case 'create_client':
            await clientsApi.create(item.payload);
            break;
          case 'update_client_balance':
            await clientsApi.updateBalance(item.payload.id, { amount: item.payload.amount });
            break;
          case 'update_settings':
            await authApi.updateProfile(item.payload);
            break;
        }
        await removeFromSyncQueue(item.id);
      } catch (error) {
        console.error('Sync failed for item', item.id, error);
        await updateSyncItem({ ...item, retry_count: item.retry_count + 1 });
      }
    }

    const updatedQueue = await getSyncQueue();
    setPendingCount(updatedQueue.length);
    setIsSyncing(false);

    if (updatedQueue.length === 0) {
      addToast({ type: 'success', message: 'Toutes les données sont synchronisées' });
    }
  }, [isSyncing, addToast]);

  React.useEffect(() => {
    processQueue();

    const interval = setInterval(processQueue, 5 * 60000); // 5 minutes
    window.addEventListener('online', processQueue);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', processQueue);
    };
  }, [processQueue]);

  return { isSyncing, pendingCount, forceSync: processQueue };
}
