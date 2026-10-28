import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Smartphone,
  Wifi,
  Battery,
  Lightbulb,
  Activity,
  Cpu,
  Download,
  Share2,
  Sliders,
  CheckCircle,
  Zap,
  QrCode,
} from 'lucide-react';
import { LedStripConfig, SensorConfig } from '../types/library';

interface MobileSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledConfig: LedStripConfig;
  sensorConfig: SensorConfig;
  onExportZip: () => void;
}

export const MobileSimulatorModal: React.FC<MobileSimulatorModalProps> = ({
  isOpen,
  onClose,
  ledConfig,
  sensorConfig,
  onExportZip,
}) => {
  const [activeMobileTab, setActiveMobileTab] = useState<'led' | 'sensor' | 'install'>('led');
  const [selectedColor, setSelectedColor] = useState<string>('#06b6d4');
  const [mobileBrightness, setMobileBrightness] = useState<number>(180);
  const [mobileSpeed, setMobileSpeed] = useState<number>(30);
  const [selectedAnim, setSelectedAnim] = useState<string>('Rainbow');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [qrUrl, setQrUrl] = useState<string>('');

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrUrl(url))
        .catch(() => {});
    }
  }, [currentUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col items-center">
        {/* Close Button on Top Right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 md:-right-10 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
          title="Close Mobile Simulator"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Smartphone Shell Frame (390px x 780px) */}
        <div className="w-[360px] sm:w-[390px] h-[740px] bg-slate-950 rounded-[44px] border-[6px] border-slate-700/80 shadow-2xl shadow-cyan-500/10 flex flex-col overflow-hidden relative">
          {/* Hardware Notch / Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full z-30 flex items-center justify-end px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800" />
          </div>

          {/* Mobile Status Bar */}
          <div className="pt-3 px-6 pb-1 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none z-20">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Mobile Top Bar */}
          <div className="px-5 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xs">
                µL
              </div>
              <span className="text-xs font-bold text-white tracking-tight">ArduinoLib Companion</span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Share app link"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Screen Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeMobileTab === 'led' && (
              <div className="space-y-4">
                {/* Visualizer Mini-Canvas */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{ledConfig.chipset.toUpperCase()} Strip</span>
                    <span className="font-mono text-cyan-400 text-[11px]">{ledConfig.defaultPixelCount} LEDs · Pin {ledConfig.defaultPin}</span>
                  </div>

                  {/* Simulated LED dot ring */}
                  <div className="h-24 bg-slate-950 rounded-lg flex items-center justify-center overflow-hidden border border-slate-800 relative">
                    <div className="flex items-center justify-center gap-1.5 px-2 overflow-x-auto w-full">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm transition-all duration-300"
                          style={{
                            backgroundColor: selectedColor,
                            boxShadow: `0 0 10px ${selectedColor}`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Quick Telemetry */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                    <span>Power: ~{Math.round((ledConfig.defaultPixelCount * 55 * mobileBrightness) / (255 * 3) + 30)} mA</span>
                    <span className="text-emerald-400 font-semibold">USB Safe</span>
                  </div>
                </div>

                {/* Touch Color Swatches */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-white block">Touch Palette</span>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      '#06b6d4', // Cyan
                      '#10b981', // Emerald
                      '#f59e0b', // Amber
                      '#ef4444', // Red
                      '#a855f7', // Purple
                      '#ec4899', // Pink
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`h-9 rounded-lg border-2 transition-transform active:scale-90 ${
                          selectedColor === color ? 'border-white scale-105' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Animation Patterns */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-white block">Animation Mode</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Rainbow', 'Comet', 'Fire', 'Breathing', 'Theater', 'Static'].map((anim) => (
                      <button
                        key={anim}
                        type="button"
                        onClick={() => setSelectedAnim(anim)}
                        className={`py-2 px-1 text-xs font-medium rounded-lg text-center transition-colors ${
                          selectedAnim === anim
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {anim}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thumb Sliders */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Brightness</span>
                      <span className="font-mono text-cyan-300">{mobileBrightness}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="255"
                      value={mobileBrightness}
                      onChange={(e) => setMobileBrightness(Number(e.target.value))}
                      className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Animation Interval</span>
                      <span className="font-mono text-cyan-300">{mobileSpeed}ms</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={mobileSpeed}
                      onChange={(e) => setMobileSpeed(Number(e.target.value))}
                      className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeMobileTab === 'sensor' && (
              <div className="space-y-4">
                {/* Mobile Sensor Waveform */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{sensorConfig.libraryName}</span>
                    <span className="font-mono text-cyan-400 text-[11px]">{sensorConfig.sensorType.toUpperCase()}</span>
                  </div>

                  <div className="h-28 bg-slate-950 rounded-lg p-2 border border-slate-800 flex flex-col justify-between">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>10-Bit ADC</span>
                      <span className="text-cyan-400 font-bold">52.4 {sensorConfig.unitLabel}</span>
                    </div>
                    {/* Simulated Waveform Line */}
                    <svg viewBox="0 0 100 30" className="w-full h-14 stroke-cyan-400 fill-none">
                      <path
                        d="M 0 15 Q 10 5, 20 15 T 40 15 T 60 15 T 80 15 T 100 15"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    </svg>
                    <div className="flex justify-between text-[10px] font-mono text-emerald-400">
                      <span>Status: SENSOR_OK</span>
                      <span>EMA α: {sensorConfig.filterAlpha}</span>
                    </div>
                  </div>
                </div>

                {/* Filter and Calibration Summary */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-white">Signal Conditioning</span>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                    <div>Filter: <span className="text-cyan-300">{sensorConfig.filterType.toUpperCase()}</span></div>
                    <div>Slope: <span className="text-cyan-300">y = mx + b</span></div>
                    <div>Hysteresis: <span className="text-cyan-300">±{sensorConfig.hysteresis} {sensorConfig.unitLabel}</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeMobileTab === 'install' && (
              <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                <div className="p-4 bg-gradient-to-br from-cyan-950/40 to-slate-900 rounded-2xl border border-cyan-800/40 text-center space-y-2">
                  <Smartphone className="w-8 h-8 text-cyan-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Install on Your iPhone / iPad</h4>
                  <p className="text-[11px] text-slate-400">
                    This application is fully PWA-enabled with offline caching, fast standalone launch, and zero App Store friction.
                  </p>
                </div>

                {/* QR Code Scanner */}
                {qrUrl && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center text-center">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm mb-1.5">
                      <img src={qrUrl} alt="Scan with iOS camera" className="w-28 h-28 block" />
                    </div>
                    <span className="text-[11px] font-bold text-white flex items-center gap-1">
                      <QrCode className="w-3 h-3 text-cyan-400" />
                      <span>Point iPhone/iPad Camera to Open</span>
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="font-bold text-white">3 Simple Steps in Safari:</div>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-400 text-[11px]">
                    <li>Open this link in <strong className="text-white">Safari</strong></li>
                    <li>Tap the <strong className="text-white">Share</strong> icon (square with upward arrow)</li>
                    <li>Tap <strong className="text-white">Add to Home Screen</strong>, then tap Add</li>
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Mobile Link'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Bottom Action: Export .ZIP */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md">
            <button
              type="button"
              onClick={onExportZip}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export {ledConfig.libraryName}.zip</span>
            </button>
          </div>

          {/* Smartphone Fixed Bottom Tab Bar */}
          <div className="bg-slate-950 border-t border-slate-800 grid grid-cols-3 h-14 items-center px-4">
            <button
              type="button"
              onClick={() => setActiveMobileTab('led')}
              className={`flex flex-col items-center justify-center min-h-[44px] ${
                activeMobileTab === 'led' ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">LED Strip</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMobileTab('sensor')}
              className={`flex flex-col items-center justify-center min-h-[44px] ${
                activeMobileTab === 'sensor' ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Sensors</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMobileTab('install')}
              className={`flex flex-col items-center justify-center min-h-[44px] ${
                activeMobileTab === 'install' ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">Install App</span>
            </button>
          </div>

          {/* Home Indicator Bar */}
          <div className="h-4 bg-slate-950 flex items-center justify-center pb-1">
            <div className="w-32 h-1 bg-slate-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
