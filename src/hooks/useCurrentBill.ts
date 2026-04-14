import * as React from 'react';
import type { Session, CafeSettings } from '../types';

export function useCurrentBill(session: Session, settings: CafeSettings | null) {
  const [bill, setBill] = React.useState({
    timeCost: 0,
    extrasTotal: session.extras_total,
    totalAmount: session.extras_total
  });

  const calculate = React.useCallback(() => {
    const start = new Date(session.started_at).getTime();
    const now = Date.now();
    const totalMinutes = Math.max(0, Math.floor((now - start) / 60000));

    let billedMinutes = totalMinutes;
    if (settings) {
      if (settings.billing_increment === '15min') {
        billedMinutes = Math.ceil(totalMinutes / 15) * 15;
      } else if (settings.billing_increment === '30min') {
        billedMinutes = Math.ceil(totalMinutes / 30) * 30;
      } else if (settings.billing_increment === 'hour') {
        billedMinutes = Math.ceil(totalMinutes / 60) * 60;
      }
    }

    const timeCost = (billedMinutes / 60) * session.rate_per_hour;
    const extrasTotal = session.extras.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    setBill({
      timeCost,
      extrasTotal,
      totalAmount: timeCost + extrasTotal
    });
  }, [session.started_at, session.rate_per_hour, session.extras, settings]);

  React.useEffect(() => {
    calculate();
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [calculate]);

  return bill;
}
