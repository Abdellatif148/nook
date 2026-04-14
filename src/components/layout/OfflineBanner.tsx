import * as React from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="w-full h-9 bg-yellow-dim border-b border-yellow/30 flex items-center justify-center gap-2">
      <WifiOff className="w-3.5 h-3.5 text-yellow" />
      <span className="text-[13px] font-medium text-yellow">Mode hors ligne — données locales</span>
    </div>
  );
};
