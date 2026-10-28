import React from 'react';
import { X, CheckCircle, AlertTriangle, BookOpen, Cpu, Shield, Zap } from 'lucide-react';

interface ArduinoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArduinoGuideModal: React.FC<ArduinoGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Official Arduino 1.5+ Library Architecture & Best Practices
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Section 1 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>1. Strict Folder Structure (Arduino Spec 1.5+)</span>
            </h4>
            <p className="text-slate-400">
              Modern Arduino libraries (IDE 1.5 and newer, PlatformIO, and Arduino CLI) require your source code to reside inside a dedicated <code className="text-cyan-400 font-mono">src/</code> subdirectory rather than root. This prevents namespace pollution and enables recursive multi-file compilation.
            </p>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 space-y-0.5">
              <div>MyLibrary/</div>
              <div className="pl-4">├── library.properties  <span className="text-slate-600">// Official manifest</span></div>
              <div className="pl-4">├── keywords.txt        <span className="text-slate-600">// IDE syntax coloring</span></div>
              <div className="pl-4">├── README.md           <span className="text-slate-600">// Documentation & pinouts</span></div>
              <div className="pl-4">├── src/</div>
              <div className="pl-8">├── MyLibrary.h    <span className="text-slate-600">// Header guards & declarations</span></div>
              <div className="pl-8">└── MyLibrary.cpp  <span className="text-slate-600">// Implementation code</span></div>
              <div className="pl-4">└── examples/</div>
              <div className="pl-8">└── BasicUsage/</div>
              <div className="pl-12">└── BasicUsage.ino <span className="text-slate-600">// Sketch named matching parent folder</span></div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>2. 8-Bit Microcontroller SRAM Constraints (PROGMEM)</span>
            </h4>
            <p className="text-slate-400">
              An Arduino Uno (ATmega328P) has only <strong>2,048 bytes of SRAM</strong>. A 60-LED WS2812B strip buffer uses 180 bytes, and adding precomputed gamma correction tables (256 bytes) directly into RAM exhausts 25% of your available memory before code even starts!
            </p>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-semibold">Solution: </span>
              Always store constant LUTs in Flash memory using <code className="text-cyan-300 font-mono">PROGMEM</code> and read them with <code className="text-cyan-300 font-mono">pgm_read_byte()</code>. This leaves SRAM completely free for user sketch variables.
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>3. Non-Blocking State Machines (No delay())</span>
            </h4>
            <p className="text-slate-400">
              Never use <code className="text-rose-400 font-mono">delay()</code> inside your library methods! Blocking halts the microcontroller core, causing it to miss button clicks, drop I2C transactions, and skip incoming Serial data.
            </p>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-cyan-400 font-semibold">Solution: </span>
              Implement an <code className="text-cyan-300 font-mono">update()</code> method that checks <code className="text-cyan-300 font-mono">millis() - _lastTick &gt;= _interval</code> and returns immediately if no new frame is needed.
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>4. I2C Bus Hang Protection & Hardware Reset</span>
            </h4>
            <p className="text-slate-400">
              If an I2C sensor experiences power brownout or disconnects, <code className="text-slate-300 font-mono">Wire.endTransmission()</code> can hang indefinitely on older Arduino cores.
            </p>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-semibold">Solution: </span>
              Configure <code className="text-cyan-300 font-mono">Wire.setTimeout()</code> in your <code className="text-cyan-300 font-mono">begin()</code> routine, verify WHO_AM_I device signatures, and implement return error enums (<code className="text-cyan-300 font-mono">SENSOR_ERR_TIMEOUT</code>, <code className="text-cyan-300 font-mono">SENSOR_ERR_I2C_NACK</code>) so the calling application never locks up.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
