import React, { useState } from 'react';
import { Cpu, ShieldCheck, AlertCircle, Zap } from 'lucide-react';
import { LedStripConfig, SensorConfig, Microcontroller } from '../types/library';

interface WiringDiagramProps {
  type: 'led_strip' | 'custom_sensor';
  ledConfig?: LedStripConfig;
  sensorConfig?: SensorConfig;
}

export const WiringDiagram: React.FC<WiringDiagramProps> = ({
  type,
  ledConfig,
  sensorConfig,
}) => {
  const [selectedMcu, setSelectedMcu] = useState<Microcontroller>('atmega328p');

  const mcuPinMap = {
    atmega328p: {
      name: 'Arduino Uno / Nano (ATmega328P)',
      vccPin: '5V',
      gndPin: 'GND',
      sdaPin: 'A4',
      sclPin: 'A5',
      defaultLedPin: 'D6',
      intPin: 'D2 / D3',
      operatingVoltage: '5.0V',
    },
    esp32: {
      name: 'ESP32 Dev Module',
      vccPin: '3V3 / VIN',
      gndPin: 'GND',
      sdaPin: 'GPIO 21',
      sclPin: 'GPIO 22',
      defaultLedPin: 'GPIO 16',
      intPin: 'Any GPIO',
      operatingVoltage: '3.3V',
    },
    rp2040: {
      name: 'Raspberry Pi Pico (RP2040)',
      vccPin: '3V3 (Pin 36)',
      gndPin: 'GND (Pin 38)',
      sdaPin: 'GP4 (Pin 6)',
      sclPin: 'GP5 (Pin 7)',
      defaultLedPin: 'GP2',
      intPin: 'Any GP',
      operatingVoltage: '3.3V',
    },
    esp8266: {
      name: 'NodeMCU (ESP8266)',
      vccPin: '3V3 / VIN',
      gndPin: 'GND',
      sdaPin: 'D2 (GPIO 4)',
      sclPin: 'D1 (GPIO 5)',
      defaultLedPin: 'D4 (GPIO 2)',
      intPin: 'D1 / D2 / D5..',
      operatingVoltage: '3.3V',
    },
    samd21: {
      name: 'Arduino Zero / MKR (SAMD21)',
      vccPin: 'VCC 3.3V',
      gndPin: 'GND',
      sdaPin: 'SDA (Pin 11)',
      sclPin: 'SCL (Pin 12)',
      defaultLedPin: 'Pin 6',
      intPin: 'Pins 0..13',
      operatingVoltage: '3.3V',
    },
  }[selectedMcu];

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900 rounded-xl border border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            Hardware Wiring & Protection Circuitry
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Interconnect schematics with inrush protection capacitors and data line damping resistors.
          </p>
        </div>

        {/* MCU Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Target MCU:</span>
          <select
            value={selectedMcu}
            onChange={(e) => setSelectedMcu(e.target.value as Microcontroller)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-cyan-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="atmega328p">Arduino Uno / Nano (ATmega328P)</option>
            <option value="esp32">ESP32 (3.3V Logic)</option>
            <option value="rp2040">RP2040 (Raspberry Pi Pico)</option>
            <option value="esp8266">NodeMCU / ESP8266</option>
            <option value="samd21">Arduino MKR / SAMD21</option>
          </select>
        </div>
      </div>

      {/* SVG Wiring Schematic */}
      <div className="relative w-full rounded-lg bg-slate-950 p-4 border border-slate-800 flex items-center justify-center overflow-x-auto">
        <svg
          viewBox="0 0 760 260"
          className="w-full max-w-3xl h-auto"
          style={{ minWidth: '600px' }}
        >
          {/* Microcontroller Body */}
          <rect
            x="40"
            y="30"
            width="220"
            height="200"
            rx="8"
            fill="#0f172a"
            stroke="#0284c7"
            strokeWidth="2"
          />
          <rect x="55" y="45" width="40" height="25" rx="3" fill="#334155" />
          <text x="75" y="61" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
            USB
          </text>
          <text x="150" y="55" fill="#f8fafc" fontSize="12" fontWeight="bold">
            {selectedMcu === 'atmega328p' ? 'Arduino Uno' : selectedMcu.toUpperCase()}
          </text>
          <text x="150" y="72" fill="#64748b" fontSize="10" fontFamily="monospace">
            Logic: {mcuPinMap.operatingVoltage}
          </text>

          {/* MCU Pins on right edge */}
          <g fontFamily="monospace" fontSize="10">
            {/* VCC Pin */}
            <circle cx="260" cy="90" r="5" fill="#ef4444" />
            <text x="245" y="93" fill="#fca5a5" textAnchor="end">
              {mcuPinMap.vccPin}
            </text>

            {/* GND Pin */}
            <circle cx="260" cy="120" r="5" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
            <text x="245" y="123" fill="#94a3b8" textAnchor="end">
              {mcuPinMap.gndPin}
            </text>

            {type === 'led_strip' ? (
              <>
                {/* Data Pin */}
                <circle cx="260" cy="160" r="5" fill="#06b6d4" />
                <text x="245" y="163" fill="#67e8f9" textAnchor="end">
                  Pin {ledConfig?.defaultPin ?? 6}
                </text>
                {ledConfig?.chipset === 'apa102' && (
                  <>
                    <circle cx="260" cy="190" r="5" fill="#f59e0b" />
                    <text x="245" y="193" fill="#fcd34d" textAnchor="end">
                      CLK (Pin {ledConfig?.clockPin ?? 13})
                    </text>
                  </>
                )}
              </>
            ) : (
              <>
                {sensorConfig?.sensorType === 'i2c' && (
                  <>
                    <circle cx="260" cy="150" r="5" fill="#06b6d4" />
                    <text x="245" y="153" fill="#67e8f9" textAnchor="end">
                      SDA ({mcuPinMap.sdaPin})
                    </text>
                    <circle cx="260" cy="180" r="5" fill="#f59e0b" />
                    <text x="245" y="183" fill="#fcd34d" textAnchor="end">
                      SCL ({mcuPinMap.sclPin})
                    </text>
                  </>
                )}
                {sensorConfig?.sensorType === 'analog' && (
                  <>
                    <circle cx="260" cy="160" r="5" fill="#10b981" />
                    <text x="245" y="163" fill="#6ee7b7" textAnchor="end">
                      {sensorConfig.analogPin} (Analog)
                    </text>
                  </>
                )}
                {sensorConfig?.sensorType === 'interrupt' && (
                  <>
                    <circle cx="260" cy="160" r="5" fill="#ec4899" />
                    <text x="245" y="163" fill="#f472b6" textAnchor="end">
                      INT ({mcuPinMap.intPin})
                    </text>
                  </>
                )}
              </>
            )}
          </g>

          {/* Module / Peripheral Body on right */}
          <rect
            x="510"
            y="30"
            width="210"
            height="200"
            rx="8"
            fill="#0f172a"
            stroke="#10b981"
            strokeWidth="2"
          />
          <text x="615" y="55" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
            {type === 'led_strip'
              ? `${ledConfig?.chipset.toUpperCase() || 'WS2812B'} Strip`
              : `${sensorConfig?.sensorType.toUpperCase() || 'I2C'} Sensor Module`}
          </text>
          <text
            x="615"
            y="72"
            fill="#6ee7b7"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {type === 'led_strip'
              ? `${ledConfig?.defaultPixelCount || 30} addressable pixels`
              : sensorConfig?.libraryName || 'Custom Module'}
          </text>

          {/* Module Pins on left edge */}
          <g fontFamily="monospace" fontSize="10">
            <circle cx="510" cy="90" r="5" fill="#ef4444" />
            <text x="525" y="93" fill="#fca5a5">
              VCC / 5V
            </text>

            <circle cx="510" cy="120" r="5" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
            <text x="525" y="123" fill="#94a3b8">
              GND
            </text>

            {type === 'led_strip' ? (
              <>
                <circle cx="510" cy="160" r="5" fill="#06b6d4" />
                <text x="525" y="163" fill="#67e8f9">
                  DIN (Data)
                </text>
                {ledConfig?.chipset === 'apa102' && (
                  <>
                    <circle cx="510" cy="190" r="5" fill="#f59e0b" />
                    <text x="525" y="193" fill="#fcd34d">
                      CLK (Clock)
                    </text>
                  </>
                )}
              </>
            ) : (
              <>
                {sensorConfig?.sensorType === 'i2c' && (
                  <>
                    <circle cx="510" cy="150" r="5" fill="#06b6d4" />
                    <text x="525" y="153" fill="#67e8f9">
                      SDA
                    </text>
                    <circle cx="510" cy="180" r="5" fill="#f59e0b" />
                    <text x="525" y="183" fill="#fcd34d">
                      SCL
                    </text>
                  </>
                )}
                {sensorConfig?.sensorType === 'analog' && (
                  <>
                    <circle cx="510" cy="160" r="5" fill="#10b981" />
                    <text x="525" y="163" fill="#6ee7b7">
                      V_OUT
                    </text>
                  </>
                )}
                {sensorConfig?.sensorType === 'interrupt' && (
                  <>
                    <circle cx="510" cy="160" r="5" fill="#ec4899" />
                    <text x="525" y="163" fill="#f472b6">
                      PULSE / SIG
                    </text>
                  </>
                )}
              </>
            )}
          </g>

          {/* Wire Connections & In-Line Protection Components */}
          {/* Wire 1: VCC Red Wire */}
          <path d="M 260 90 L 510 90" stroke="#ef4444" strokeWidth="2.5" fill="none" />

          {/* Wire 2: GND Black Wire */}
          <path d="M 260 120 L 510 120" stroke="#64748b" strokeWidth="2.5" fill="none" />

          {type === 'led_strip' ? (
            <>
              {/* Capacitor across VCC & GND */}
              <line x1="320" y1="90" x2="320" y2="120" stroke="#0ea5e9" strokeWidth="2" />
              <rect x="312" y="98" width="16" height="14" rx="2" fill="#0284c7" />
              <text x="320" y="108" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                C
              </text>
              <text x="320" y="80" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                1000 µF
              </text>

              {/* Data Wire with 470 ohm resistor */}
              <path d="M 260 160 L 370 160" stroke="#06b6d4" strokeWidth="2.5" fill="none" />
              {/* Resistor symbol */}
              <rect x="370" y="154" width="30" height="12" rx="2" fill="#b45309" stroke="#d97706" />
              <text x="385" y="163" fill="#fef3c7" fontSize="8" fontWeight="bold" textAnchor="middle">
                470Ω
              </text>
              <path d="M 400 160 L 510 160" stroke="#06b6d4" strokeWidth="2.5" fill="none" />

              {ledConfig?.chipset === 'apa102' && (
                <path d="M 260 190 L 510 190" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
              )}
            </>
          ) : (
            <>
              {sensorConfig?.sensorType === 'i2c' && (
                <>
                  {/* SDA line */}
                  <path d="M 260 150 L 510 150" stroke="#06b6d4" strokeWidth="2.5" fill="none" />
                  {/* SCL line */}
                  <path d="M 260 180 L 510 180" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
                  {/* 4.7k Pullups to VCC */}
                  <line x1="420" y1="90" x2="420" y2="150" stroke="#06b6d4" strokeWidth="1.5" />
                  <rect x="413" y="110" width="14" height="20" rx="2" fill="#78350f" stroke="#b45309" />
                  <text x="420" y="123" fill="#fde68a" fontSize="8" textAnchor="middle">4.7k</text>

                  <line x1="450" y1="90" x2="450" y2="180" stroke="#f59e0b" strokeWidth="1.5" />
                  <rect x="443" y="125" width="14" height="20" rx="2" fill="#78350f" stroke="#b45309" />
                  <text x="450" y="138" fill="#fde68a" fontSize="8" textAnchor="middle">4.7k</text>
                </>
              )}
              {sensorConfig?.sensorType === 'analog' && (
                <>
                  <path d="M 260 160 L 510 160" stroke="#10b981" strokeWidth="2.5" fill="none" />
                  {/* 100nF bypass capacitor to GND */}
                  <line x1="410" y1="120" x2="410" y2="160" stroke="#10b981" strokeWidth="1.5" />
                  <rect x="403" y="132" width="14" height="14" rx="2" fill="#065f46" stroke="#059669" />
                  <text x="410" y="142" fill="#a7f3d0" fontSize="8" textAnchor="middle">100n</text>
                </>
              )}
              {sensorConfig?.sensorType === 'interrupt' && (
                <path d="M 260 160 L 510 160" stroke="#ec4899" strokeWidth="2.5" fill="none" />
              )}
            </>
          )}
        </svg>
      </div>

      {/* Practical Hardware Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-bold text-slate-200">Hardware Protection Invariants</span>
            <span className="text-slate-400 leading-relaxed">
              Always bridge a 1000 µF capacitor across positive and negative rails near the strip to absorb power-on inrush current spikes that can permanently destroy the first pixel.
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex gap-2.5">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-bold text-slate-200">Logic Level Matching (3.3V vs 5V)</span>
            <span className="text-slate-400 leading-relaxed">
              If running an ESP32 (3.3V) with WS2812B (5V logic threshold ~3.5V), use a 74AHCT125 level shifter or feed the first pixel with 4.5V via a diode to ensure 100% reliable frame latching.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
