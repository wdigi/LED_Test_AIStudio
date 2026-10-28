import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, QrCode, Copy, Check, Tablet } from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<'iphone' | 'ipad'>('iphone');

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (appUrl) {
      QRCode.toDataURL(appUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [appUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // If already installed and launched from home screen in standalone mode, suppress button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`flex items-center gap-1.5 font-bold rounded-lg transition-all ${
          variant === 'full'
            ? 'w-full py-2.5 px-4 text-xs justify-center bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-500/20'
            : 'px-3 py-1.5 text-xs text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30'
        }`}
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-1.5 font-bold rounded-lg transition-all ${
          variant === 'full'
            ? 'w-full py-2.5 px-4 text-xs justify-center bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-500/20'
            : 'px-3 py-1.5 text-xs text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30'
        }`}
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Install on iPhone / iPad</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-5 md:p-6 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  Install on iPhone or iPad
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-2 pt-4">
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs w-full">
                <button
                  type="button"
                  onClick={() => setSelectedDevice('iphone')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-semibold transition-colors ${
                    selectedDevice === 'iphone'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>iPhone Guide</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDevice('ipad')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-semibold transition-colors ${
                    selectedDevice === 'ipad'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>iPad Guide</span>
                </button>
              </div>
            </div>

            {/* Interactive QR Code & Guide Split */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-4">
              {/* Left Column: QR Code scanner */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
                {qrDataUrl ? (
                  <div className="p-2 bg-white rounded-lg shadow-md mb-2">
                    <img
                      src={qrDataUrl}
                      alt="Scan with iPhone Camera"
                      className="w-32 h-32 block"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-slate-900 animate-pulse rounded-lg mb-2" />
                )}
                <span className="text-[11px] font-bold text-white flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-cyan-400" />
                  <span>Scan with Camera</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Point your iPhone or iPad camera here to open Safari instantly.
                </span>
              </div>

              {/* Right Column: Step by step instructions */}
              <div className="md:col-span-7 flex flex-col justify-center space-y-3 text-xs text-slate-300 font-sans">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold shrink-0 text-[11px] mt-0.5">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-white">Open in Safari</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Ensure you are using Apple&apos;s native <strong>Safari</strong> browser (Apple does not permit home screen installation from inside 3rd-party in-app webviews).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold shrink-0 text-[11px] mt-0.5">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-white">Tap the Share Icon</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      {selectedDevice === 'iphone' ? (
                        <>
                          Tap the <Share className="w-3.5 h-3.5 inline mx-0.5 text-cyan-400" /> <strong>Share</strong> button located in the <strong>bottom toolbar</strong>.
                        </>
                      ) : (
                        <>
                          Tap the <Share className="w-3.5 h-3.5 inline mx-0.5 text-cyan-400" /> <strong>Share</strong> button located in the <strong>top-right corner</strong> next to the address bar.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold shrink-0 text-[11px] mt-0.5">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-white">Add to Home Screen</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Scroll down in the action sheet and tap <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-cyan-400" /> <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top-right.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy Link URL */}
            <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-500 font-mono text-[11px] truncate flex-1 pl-2">
                {appUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded transition-colors whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Runs standalone without browser address bar
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
