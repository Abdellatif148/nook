import * as React from 'react';

export function useLiveTimer(startedAt: string) {
  const [elapsed, setElapsed] = React.useState(0);

  const calculate = React.useCallback(() => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
  }, [startedAt]);

  React.useEffect(() => {
    calculate();
    const interval = setInterval(calculate, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        calculate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [calculate]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const display = [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');

  return {
    hours,
    minutes,
    seconds,
    totalMinutes: Math.floor(elapsed / 60),
    totalSeconds: elapsed,
    display
  };
}
