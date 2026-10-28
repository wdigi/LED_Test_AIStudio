import React from 'react';
import { Sliders, Cpu, Activity, Disc, Layers, HardDrive, ShieldAlert } from 'lucide-react';
import { SensorConfig, SensorInterface, Microcontroller } from '../types/library';

interface SensorStudioProps {
  config: SensorConfig;
  onUpdateConfig: (updated: Partial<SensorConfig>) => void;
}

export const SensorStudio: React.FC<SensorStudioProps> = ({
  config,
  onUpdateConfig,
}) => {
  // Preset sensor architectures
  const presets: { name: string; desc: string; config: Partial<SensorConfig> }[] = [
    {
      name: 'Custom I2C Environmental (Temp & Humidity)',
      desc: 'I2C multi-register sensor with WHO_AM_I verification, soft reset, and error status codes',
      config: {
        libraryName: 'CustomI2C_TempHumid',
        className: 'CustomTempHumid',
        sensorType: 'i2c',
        i2cAddressHex: '0x38',
        i2cBusSpeedKhz: 400,
        hasWhoAmICheck: true,
        whoAmIRegisterAddress: '0x00',
        whoAmIExpectedValue: '0x38',
        enableSoftReset: true,
        softResetRegisterAddress: '0xBA',
        softResetCommandValue: '0x20',
        registers: [
          { id: '1', name: 'STATUS', address: '0x00', description: 'Device ready and measurement flags', isReadOnly: true, defaultValue: '0x18', bitWidth: 8, isSigned: false },
          { id: '2', name: 'HUMIDITY_DATA', address: '0x01', description: 'Relative humidity raw 20-bit reading', isReadOnly: true, defaultValue: '0x6C', bitWidth: 16, isSigned: false },
          { id: '3', name: 'TEMP_DATA', address: '0x03', description: 'Ambient temperature raw 20-bit reading', isReadOnly: true, defaultValue: '0x84', bitWidth: 16, isSigned: false },
        ],
        description: 'Industrial-grade I2C environmental sensor driver with soft-reset and fault codes.',
      },
    },
    {
      name: 'Precision Analog Pressure / Transducer',
      desc: 'Analog front-end with Exponential Moving Average filter, 2-point calibration, and EEPROM tare',
      config: {
        libraryName: 'PrecisionAnalogPressure',
        className: 'PrecisionPressure',
        sensorType: 'analog',
        analogPin: 'A0',
        adcResolutionBits: 10,
        filterType: 'ema',
        filterAlpha: 0.15,
        enableCalibration: true,
        calibrationType: 'two_point',
        calibPoint1Raw: 102,  // 0.5V
        calibPoint1Unit: 0.0, // 0 kPa
        calibPoint2Raw: 921,  // 4.5V
        calibPoint2Unit: 100.0, // 100 kPa
        unitLabel: 'kPa',
        enableEepromStorage: true,
        eepromAddress: 16,
        enableThresholdAlarm: true,
        lowThreshold: 10,
        highThreshold: 85,
        hysteresis: 5,
        description: 'Low-noise analog pressure transducer library with EMA filtering and non-volatile calibration.',
      },
    },
    {
      name: 'Hall Effect Flowmeter / Tachometer',
      desc: 'Microsecond interrupt counter for liquid flow meters, wind anemometers, and motor encoders',
      config: {
        libraryName: 'HallFlowMeter',
        className: 'HallFlowMeter',
        sensorType: 'interrupt',
        interruptPin: 2,
        interruptTrigger: 'FALLING',
        pulseUnitConversionFactor: 450.0, // 450 pulses per Liter
        debounceMicroseconds: 50,
        timeoutMilliseconds: 2000,
        enableThresholdAlarm: true,
        lowThreshold: 0.5,
        highThreshold: 25.0,
        hysteresis: 1.0,
        description: 'Interrupt-driven liquid flow meter library with debouncing, volumetric totalizer, and rate calculations.',
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-5 bg-slate-900 rounded-xl border border-slate-800">
      {/* Presets Bar */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Curated Sensor Presets
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {presets.map((p) => {
            const isMatch = config.sensorType === p.config.sensorType;
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
        {/* Field 1: Library Name */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1">
            Library Name
          </label>
          <input
            type="text"
            value={config.libraryName}
            onChange={(e) => onUpdateConfig({ libraryName: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            placeholder="CustomI2C_Sensor"
          />
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
            placeholder="CustomSensor"
          />
        </div>

        {/* Field 3: Interface Type */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1">
            Hardware Sensor Interface
          </label>
          <select
            value={config.sensorType}
            onChange={(e) =>
              onUpdateConfig({ sensorType: e.target.value as SensorInterface })
            }
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="i2c">I2C Register-Based (Wire bus)</option>
            <option value="analog">Analog with DSP Conditioning</option>
            <option value="interrupt">Digital Interrupt / Pulse Frequency</option>
          </select>
        </div>
      </div>

      {/* Interface Specific Subsections */}
      {config.sensorType === 'analog' && (
        <div className="flex flex-col gap-4 pt-3 border-t border-slate-800">
          <h4 className="text-xs font-bold text-white tracking-wide uppercase text-slate-400">
            Analog Signal Conditioning & Calibration
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Analog Input Pin</label>
              <select
                value={config.analogPin}
                onChange={(e) => onUpdateConfig({ analogPin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="A0">A0 (Pin 14 / ADC0)</option>
                <option value="A1">A1 (Pin 15 / ADC1)</option>
                <option value="A2">A2 (Pin 16 / ADC2)</option>
                <option value="A3">A3 (Pin 17 / ADC3)</option>
                <option value="A6">A6 (Analog only)</option>
                <option value="A7">A7 (Analog only)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Digital Filter Algorithm</label>
              <select
                value={config.filterType}
                onChange={(e) =>
                  onUpdateConfig({ filterType: e.target.value as 'ema' | 'sma' | 'median' | 'none' })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ema">Exponential Moving Average (EMA IIR)</option>
                <option value="sma">Simple Moving Average (SMA Window)</option>
                <option value="median">5-Point Median Filter (Spike Rejection)</option>
                <option value="none">Raw Pass-Through (No Filter)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Engineering Unit Label
              </label>
              <input
                type="text"
                value={config.unitLabel}
                onChange={(e) => onUpdateConfig({ unitLabel: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                placeholder="kPa, degC, hPa, lux, mm"
              />
            </div>
          </div>

          {/* 2-Point Linear Calibration Settings */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">2-Point Linear Calibration Curve</span>
              <span className="text-xs font-mono text-cyan-400">y = mx + b</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-16">Point 1:</span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="number"
                    value={config.calibPoint1Raw}
                    onChange={(e) => onUpdateConfig({ calibPoint1Raw: Number(e.target.value) })}
                    placeholder="Raw ADC"
                    className="w-24 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200"
                  />
                  <span className="text-slate-500 text-xs">counts →</span>
                  <input
                    type="number"
                    value={config.calibPoint1Unit}
                    onChange={(e) => onUpdateConfig({ calibPoint1Unit: Number(e.target.value) })}
                    placeholder="Unit"
                    className="w-24 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-cyan-300"
                  />
                  <span className="text-xs text-slate-400 font-mono">{config.unitLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-16">Point 2:</span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="number"
                    value={config.calibPoint2Raw}
                    onChange={(e) => onUpdateConfig({ calibPoint2Raw: Number(e.target.value) })}
                    placeholder="Raw ADC"
                    className="w-24 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200"
                  />
                  <span className="text-slate-500 text-xs">counts →</span>
                  <input
                    type="number"
                    value={config.calibPoint2Unit}
                    onChange={(e) => onUpdateConfig({ calibPoint2Unit: Number(e.target.value) })}
                    placeholder="Unit"
                    className="w-24 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-cyan-300"
                  />
                  <span className="text-xs text-slate-400 font-mono">{config.unitLabel}</span>
                </div>
              </div>
            </div>

            {/* Non-volatile EEPROM option */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableEepromStorage}
                  onChange={(e) => onUpdateConfig({ enableEepromStorage: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
                <span>Enable persistent EEPROM storage for tare and calibration coefficients</span>
              </label>
              {config.enableEepromStorage && (
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>EEPROM Byte Offset:</span>
                  <input
                    type="number"
                    value={config.eepromAddress}
                    onChange={(e) => onUpdateConfig({ eepromAddress: Number(e.target.value) })}
                    className="w-16 px-1.5 py-1 bg-slate-900 border border-slate-800 rounded text-cyan-300"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {config.sensorType === 'interrupt' && (
        <div className="flex flex-col gap-4 pt-3 border-t border-slate-800">
          <h4 className="text-xs font-bold text-white tracking-wide uppercase text-slate-400">
            Interrupt Pin & Pulse Timing Specifications
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Hardware Interrupt Pin
              </label>
              <input
                type="number"
                value={config.interruptPin}
                onChange={(e) => onUpdateConfig({ interruptPin: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Digital Pin 2 or 3 on Uno/Nano (INT0/INT1)
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Trigger Edge
              </label>
              <select
                value={config.interruptTrigger}
                onChange={(e) =>
                  onUpdateConfig({ interruptTrigger: e.target.value as 'RISING' | 'FALLING' | 'CHANGE' })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="FALLING">FALLING (Active-Low Open Collector)</option>
                <option value="RISING">RISING (Active-High)</option>
                <option value="CHANGE">CHANGE (Quadrature Encoder)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Pulses Per Engineering Unit
              </label>
              <input
                type="number"
                step="0.1"
                value={config.pulseUnitConversionFactor}
                onChange={(e) =>
                  onUpdateConfig({ pulseUnitConversionFactor: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                e.g. 450 pulses = 1 Liter or 60 pulses = 1 Revolution
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Alarms & Hysteresis */}
      <div className="pt-3 border-t border-slate-800 p-4 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-white">Threshold Comparator with Schmitt-Trigger Hysteresis</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableThresholdAlarm}
              onChange={(e) => onUpdateConfig({ enableThresholdAlarm: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
          </label>
        </div>

        {config.enableThresholdAlarm && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Low Threshold Alarm</label>
              <input
                type="number"
                value={config.lowThreshold}
                onChange={(e) => onUpdateConfig({ lowThreshold: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">High Threshold Alarm</label>
              <input
                type="number"
                value={config.highThreshold}
                onChange={(e) => onUpdateConfig({ highThreshold: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Hysteresis Band</label>
              <input
                type="number"
                value={config.hysteresis}
                onChange={(e) => onUpdateConfig({ hysteresis: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
