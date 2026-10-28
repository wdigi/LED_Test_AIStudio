import React from 'react';
import { Lightbulb, Activity, Cpu, Download } from 'lucide-react';
import { LibraryType } from '../types/library';

export type MobileNavDestination = 'led' | 'sensor' | 'wiring' | 'export';

interface MobileBottomNavProps {
  currentDestination: MobileNavDestination;
  onSelectDestination: (dest: MobileNavDestination) => void;
  onExportZip: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentDestination,
  onSelectDestination,
  onExportZip,
}) => {
  const tabs = [
    {
      id: 'led' as MobileNavDestination,
      label: 'LED Strip',
      icon: Lightbulb,
    },
    {
      id: 'sensor' as MobileNavDestination,
      label: 'Sensors',
      icon: Activity,
    },
    {
      id: 'wiring' as MobileNavDestination,
      label: 'Wiring',
      icon: Cpu,
    },
    {
      id: 'export' as MobileNavDestination,
      label: 'Export .ZIP',
      icon: Download,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1 safe-area-bottom">
      <div className="grid grid-cols-4 items-center h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentDestination === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'export') {
                  onExportZip();
                } else {
                  onSelectDestination(tab.id);
                }
              }}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] rounded-lg transition-colors ${
                isActive && tab.id !== 'export'
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive && tab.id !== 'export' ? 'scale-110 text-cyan-400' : ''
                }`}
              />
              <span className="text-[10px] font-medium tracking-tight mt-1 truncate">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
