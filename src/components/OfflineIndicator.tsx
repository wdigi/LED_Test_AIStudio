import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-lg border border-amber-400 animate-in slide-in-from-bottom duration-300">
      <WifiOff className="w-3.5 h-3.5 text-slate-950" />
      <span>Offline Mode — PWA cache active. Local library generation continues to work without internet.</span>
    </div>
  );
};
