import React from 'react';
import { Sliders, Zap, Shield, Sparkles, Layers, Cpu, HelpCircle } from 'lucide-react';
import { LedStripConfig, LedChipset, ColorOrder, Microcontroller } from '../types/library';

interface LedStripStudioProps {
  config: LedStripConfig;
  onUpdateConfig: (updated: Partial<LedStripConfig>) => void;
}

export const LedStripStudio: React.FC<LedStripStudioProps> = ({
  config,
  onUpdateConfig,
}) => {
  // Preset templates
  const presets: { name: string; desc: string; config: Partial<LedStripConfig> }[] = [
    {
      name: 'WS2812B NeoPixel Essentials',
      desc: 'Single-wire 800kHz bitbang driver with gamma LUT and 500mA USB safe limiter',
      config: {
        libraryName: 'FastNeoPixel',
        className: 'FastNeoPixel',
        chipset: 'ws2812b',
        colorOrder: 'GRB',
        defaultPin: 6,
        defaultPixelCount: 30,
        enableGammaCorrection: true,
        gammaValue: 2.2,
        enablePowerLimiter: true,
        maxCurrentMilliamps: 500,
        operatingVoltage: 5.0,
        includeAnimationEngine: true,
        description: 'Lightweight, non-blocking WS2812B LED strip driver with gamma lookup and current budgeting.',
      },
    },
    {
      name: 'APA102 DotStar High-Speed SPI',
      desc: 'Two-wire SPI clock + data for persistence of vision (POV) with 12MHz hardware SPI',
      config: {
        libraryName: 'DotStarPro',
        className: 'DotStarPro',
        chipset: 'apa102',
        colorOrder: 'BGR',
        defaultPin: 11, // MOSI
        clockPin: 13,   // SCK
        defaultPixelCount: 60,
        enableGammaCorrection: true,
        gammaValue: 2.5,
        enablePowerLimiter: true,
        maxCurrentMilliamps: 1500,
        operatingVoltage: 5.0,
        includeAnimationEngine: true,
        description: 'High-speed APA102 / SK9822 DotStar SPI LED driver for high frame-rate animations and POV.',
      },
    },
    {
      name: 'SK6812 RGBW Natural Ambient',
      desc: '4-channel RGBW driver with independent warm/neutral white diode management',
      config: {
        libraryName: 'SK6812_RGBW',
        className: 'SK6812RGBW',
        chipset: 'sk6812_rgbw',
        colorOrder: 'RGBW',
        defaultPin: 6,
        defaultPixelCount: 40,
        enableGammaCorrection: true,
        gammaValue: 2.4,
        enablePowerLimiter: true,
        maxCurrentMilliamps: 1200,
        operatingVoltage: 5.0,
        includeAnimationEngine: true,
        description: 'Full 4-channel SK6812 RGBW driver with dedicated white channel and natural color temperature.',
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-5 bg-slate-900 rounded-xl border border-slate-800">
      {/* Presets Bar */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Recommended Architecture Presets
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {presets.map((p) => {
            const isMatch = config.chipset === p.config.chipset;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => onUpdateConfig(p.config)}
                className={`p-3 text-left rounded-lg border transition-all ${
                  isMatch
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-white mb-0.5">{p.name}</div>
                <div className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Configuration Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
        {/* Field 1: Library & Class Name */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1">
            Library Name
          </label>
          <input
            type="text"
            value={config.libraryName}
            onChange={(e) => onUpdateConfig({ libraryName: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            placeholder="FastNeoPixel"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Sets folder name in Arduino IDE <code className="text-slate-400">libraries/</code>
          </span>
        </div>

        {/* Field 2: C++ Class Name */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1">
            C++ Driver Class Name
          </label>
          <input
            type="text"
            value={config.className}
            onChange={(e) => onUpdateConfig({ className: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            placeholder="FastNeoPixel"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Used as <code className="text-slate-400">class {config.className}</code>
          </span>
        </div>

        {/* Field 3: Target Chipset */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1">
            LED Chipset & Protocol
          </label>
          <select
            value={config.chipset}
            onChange={(e) =>
              onUpdateConfig({
                chipset: e.target.value as LedChipset,
                colorOrder: e.target.value === 'sk6812_rgbw' ? 'RGBW' : 'GRB',
              })
            }
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ws2812b">WS2812B / NeoPixel (1-Wire 800kHz)</option>
            <option value="apa102">APA102 / DotStar (2-Wire Hardware SPI)</option>
            <option value="sk6812_rgbw">SK6812 RGBW (4-Channel 32-bit)</option>
            <option value="analog_pwm">Analog 12V MOSFET (3/4-Pin PWM)</option>
          </select>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Selects physical protocol timing and register format
          </span>
        </div>

        {/* Field 4: Color Order */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1">
            Diode Color Order
          </label>
          <select
            value={config.colorOrder}
            onChange={(e) => onUpdateConfig({ colorOrder: e.target.value as ColorOrder })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="GRB">GRB (Standard WS2812B)</option>
            <option value="RGB">RGB (Standard Adafruit / WS2811)</option>
            <option value="BGR">BGR (Standard APA102 DotStar)</option>
            <option value="BRG">BRG</option>
            {config.chipset === 'sk6812_rgbw' && <option value="RGBW">RGBW (4-Channel)</option>}
          </select>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Matches physical silicon wire bonding
          </span>
        </div>

        {/* Field 5: Default Data Pin */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1">
            Default Data Pin (DIN)
          </label>
          <input
            type="number"
            min="0"
            max="40"
            value={config.defaultPin}
            onChange={(e) => onUpdateConfig({ defaultPin: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Digital output pin on microcontroller
          </span>
        </div>

        {/* Field 6: Clock Pin if SPI */}
        {config.chipset === 'apa102' && (
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              SPI Clock Pin (CLK)
            </label>
            <input
              type="number"
              min="0"
              max="40"
              value={config.clockPin || 13}
              onChange={(e) => onUpdateConfig({ clockPin: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Hardware SPI SCK pin (e.g. Pin 13 on Uno)
            </span>
          </div>
        )}

        {/* Field 7: Default Pixel Count */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-300">Default Pixel Count</label>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {config.defaultPixelCount} LEDs
            </span>
          </div>
          <input
            type="range"
            min="8"
            max="120"
            value={config.defaultPixelCount}
            onChange={(e) => onUpdateConfig({ defaultPixelCount: Number(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Allocates ~{config.defaultPixelCount * 3} bytes of RAM in SRAM buffer
          </span>
        </div>
      </div>

      {/* Advanced Features & Signal Conditioning */}
      <div className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gamma Correction Section */}
        <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">PROGMEM Gamma Correction LUT</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableGammaCorrection}
                onChange={(e) => onUpdateConfig({ enableGammaCorrection: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Human eyes perceive brightness logarithmically rather than linearly. Storing a 256-byte precomputed gamma curve in Flash (PROGMEM) gives rich, silky color fading without wasting scarce SRAM or executing slow floating-point pow() calls during frames.
          </p>
          {config.enableGammaCorrection && (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-slate-400">Gamma Factor:</span>
              <input
                type="range"
                min="1.8"
                max="2.8"
                step="0.1"
                value={config.gammaValue}
                onChange={(e) => onUpdateConfig({ gammaValue: Number(e.target.value) })}
                className="flex-1 accent-cyan-400 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-cyan-300 w-10 text-right">
                {config.gammaValue.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Current & Power Limiter Section */}
        <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Active Current / Power Limiter</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enablePowerLimiter}
                onChange={(e) => onUpdateConfig({ enablePowerLimiter: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Protects your Arduino regulator or laptop USB port from brownouts. Dynamically calculates active pixel draw before pushing data and automatically scales down brightness if current exceeds your set envelope.
          </p>
          {config.enablePowerLimiter && (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-slate-400">Max Budget:</span>
              <input
                type="range"
                min="200"
                max="3000"
                step="50"
                value={config.maxCurrentMilliamps}
                onChange={(e) => onUpdateConfig({ maxCurrentMilliamps: Number(e.target.value) })}
                className="flex-1 accent-emerald-400 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-emerald-300 w-16 text-right">
                {config.maxCurrentMilliamps} mA
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
