import React from 'react';
import { Download, BookOpen, Smartphone } from 'lucide-react';
import { LibraryType } from '../types/library';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: LibraryType;
  onTabChange: (tab: LibraryType) => void;
  onExportZip: () => void;
  onOpenDocs: () => void;
  onOpenMobileSim: () => void;
  libraryName: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onExportZip,
  onOpenDocs,
  onOpenMobileSim,
  libraryName,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 py-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-cyan-500/20">
          µL
        </div>
        <span className="text-sm md:text-base font-bold tracking-tight text-white whitespace-nowrap">
          Arduino Library Studio
        </span>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links / segmented workspace tabs */}
      <nav className="hidden sm:flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => onTabChange('led_strip')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'led_strip'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          RGB LED Strips
        </button>
        <button
          type="button"
          onClick={() => onTabChange('custom_sensor')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'custom_sensor'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Custom Sensors
        </button>
      </nav>

      {/* Zone 3: PWA Install + Mobile Preview + Guide + Primary Action */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <PWAInstallButton />
        
        <button
          type="button"
          onClick={onOpenMobileSim}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors whitespace-nowrap shrink-0"
          title="Preview Mobile App Interface"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mobile View</span>
        </button>

        <button
          type="button"
          onClick={onOpenDocs}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors whitespace-nowrap shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Arduino 1.5+ Guide</span>
        </button>

        <button
          type="button"
          onClick={onExportZip}
          className="flex items-center gap-2 px-3.5 md:px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 rounded-lg shadow-md shadow-cyan-500/20 active:scale-95 transition-all whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export .ZIP</span>
        </button>
      </div>
    </header>
  );
};
