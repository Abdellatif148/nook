import * as React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { getClients } from '../db/clients';
import type { Session, ClientAccount } from '../types';

export function useAlerts() {
  const { settings, user } = useAuthStore();
  const { activeSessions } = useSessionStore();
  const [alerts, setAlerts] = React.useState<string[]>([]);

  const checkAlerts = React.useCallback(async () => {
    const newAlerts: string[] = [];

    // Long session check
    if (settings) {
      activeSessions.forEach(s => {
        const start = new Date(s.started_at).getTime();
        const diff = (Date.now() - start) / 3600000;
        if (diff > settings.long_session_alert_hours) {
          newAlerts.push(`Session longue: Place ${s.seat_number} (${s.customer_name})`);
        }
      });
    }

    // Low balance check
    if (user?.cafe_id && settings) {
      const clients = await getClients(user.cafe_id);
      clients.forEach(c => {
        if (c.balance < settings.low_balance_alert) {
          newAlerts.push(`Solde faible: ${c.name} (${c.balance.toFixed(2)} DH)`);
        }
      });
    }

    setAlerts(newAlerts);
  }, [activeSessions, settings, user]);

  React.useEffect(() => {
    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [checkAlerts]);

  return alerts;
}
