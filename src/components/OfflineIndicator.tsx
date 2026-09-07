import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-medium text-white shadow-xl animate-bounce"
    >
      <WifiOff className="w-4 h-4 text-amber-100 flex-shrink-0" />
      <div>
        <span className="font-bold">Offline Mode:</span> You are currently working offline. Cached data and local lesson notes remain accessible.
      </div>
    </div>
  );
};
