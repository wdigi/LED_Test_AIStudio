import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { LedStripVisualizer } from './components/LedStripVisualizer';
import { LedStripStudio } from './components/LedStripStudio';
import { SensorOscilloscope } from './components/SensorOscilloscope';
import { SensorStudio } from './components/SensorStudio';
import { RegisterMapEditor } from './components/RegisterMapEditor';
import { WiringDiagram } from './components/WiringDiagram';
import { CodeViewer } from './components/CodeViewer';
import { ArduinoGuideModal } from './components/ArduinoGuideModal';
import { MobileBottomNav, MobileNavDestination } from './components/MobileBottomNav';
import { MobileSimulatorModal } from './components/MobileSimulatorModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { generateLedStripLibrary } from './generators/ledStripGenerator';
import { generateSensorLibrary } from './generators/sensorGenerator';
import { exportLibraryAsZip } from './utils/zipExporter';
import {
  LibraryType,
  LedStripConfig,
  SensorConfig,
  GeneratedLibrary,
} from './types/library';
import { Sparkles, Download, CheckCircle, Smartphone, ExternalLink, Cpu, Terminal } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<LibraryType>('led_strip');
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [isMobileSimOpen, setIsMobileSimOpen] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [mobileNavDest, setMobileNavDest] = useState<MobileNavDestination>('led');

  // Default LED strip configuration
  const [ledConfig, setLedConfig] = useState<LedStripConfig>({
    libraryName: 'FastNeoPixel',
    className: 'FastNeoPixel',
    chipset: 'ws2812b',
    colorOrder: 'GRB',
    targetMcu: 'atmega328p',
    defaultPin: 6,
    clockPin: 13,
    defaultPixelCount: 30,
    enableGammaCorrection: true,
    gammaValue: 2.2,
    enablePowerLimiter: true,
    maxCurrentMilliamps: 500,
    operatingVoltage: 5.0,
    enableDoubleBuffering: true,
    includeAnimationEngine: true,
    includeColorTemperature: true,
    authorName: 'Chen Weineng',
    authorEmail: 'chenweineng@hotmail.com',
    version: '1.0.0',
    description:
      'High-performance, non-blocking Arduino library engineered for WS2812B LED strips with gamma LUT and power management.',
  });

  // Default Custom Sensor configuration
  const [sensorConfig, setSensorConfig] = useState<SensorConfig>({
    libraryName: 'CustomI2C_TempHumid',
    className: 'CustomTempHumid',
    sensorType: 'i2c',
    targetMcu: 'atmega328p',
    authorName: 'Chen Weineng',
    authorEmail: 'chenweineng@hotmail.com',
    version: '1.0.0',
    description:
      'Production-grade I2C environmental sensor driver with soft-reset, fault status codes, and WHO_AM_I device verification.',
    i2cAddressHex: '0x38',
    i2cAlternateAddressHex: '0x39',
    i2cBusSpeedKhz: 400,
    hasWhoAmICheck: true,
    whoAmIRegisterAddress: '0x00',
    whoAmIExpectedValue: '0x38',
    enableSoftReset: true,
    softResetRegisterAddress: '0xBA',
    softResetCommandValue: '0x20',
    registers: [
      {
        id: '1',
        name: 'STATUS',
        address: '0x00',
        description: 'Device ready and measurement flags',
        isReadOnly: true,
        defaultValue: '0x18',
        bitWidth: 8,
        isSigned: false,
      },
      {
        id: '2',
        name: 'HUMIDITY_DATA',
        address: '0x01',
        description: 'Relative humidity raw 16-bit reading',
        isReadOnly: true,
        defaultValue: '0x6C',
        bitWidth: 16,
        isSigned: false,
      },
      {
        id: '3',
        name: 'TEMP_DATA',
        address: '0x03',
        description: 'Ambient temperature raw 16-bit reading',
        isReadOnly: true,
        defaultValue: '0x84',
        bitWidth: 16,
        isSigned: false,
      },
    ],
    analogPin: 'A0',
    adcResolutionBits: 10,
    filterType: 'ema',
    filterWindowSize: 8,
    filterAlpha: 0.15,
    enableCalibration: true,
    calibrationType: 'two_point',
    calibPoint1Raw: 102,
    calibPoint1Unit: 0.0,
    calibPoint2Raw: 921,
    calibPoint2Unit: 100.0,
    unitLabel: 'kPa',
    enableEepromStorage: true,
    eepromAddress: 16,
    interruptPin: 2,
    interruptTrigger: 'FALLING',
    pulseUnitConversionFactor: 450.0,
    debounceMicroseconds: 50,
    timeoutMilliseconds: 100,
    enableThresholdAlarm: true,
    lowThreshold: 10,
    highThreshold: 85,
    hysteresis: 5,
  });

  // Generate Arduino library files dynamically whenever configs change
  const currentLibrary: GeneratedLibrary = useMemo(() => {
    if (activeTab === 'led_strip') {
      return generateLedStripLibrary(ledConfig);
    } else {
      return generateSensorLibrary(sensorConfig);
    }
  }, [activeTab, ledConfig, sensorConfig]);

  const handleUpdateLedConfig = (updated: Partial<LedStripConfig>) => {
    setLedConfig((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateSensorConfig = (updated: Partial<SensorConfig>) => {
    setSensorConfig((prev) => ({ ...prev, ...updated }));
  };

  const handleExportZip = async () => {
    await exportLibraryAsZip(currentLibrary);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handleMobileNavSelect = (dest: MobileNavDestination) => {
    setMobileNavDest(dest);
    if (dest === 'led') {
      setActiveTab('led_strip');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (dest === 'sensor') {
      setActiveTab('custom_sensor');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (dest === 'wiring') {
      const el = document.getElementById('wiring-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setMobileNavDest(tab === 'led_strip' ? 'led' : 'sensor');
        }}
        onExportZip={handleExportZip}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenMobileSim={() => setIsMobileSimOpen(true)}
        libraryName={currentLibrary.name}
      />

      {/* Main Container with generous bottom padding for mobile bottom bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-24 md:pb-8 space-y-6">
        {/* Workspace Title & Context Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
              <span>Architect</span>
              <span>·</span>
              <span className="text-cyan-400 font-semibold">{currentLibrary.name}</span>
              <span>·</span>
              <span>v{currentLibrary.version}</span>
              <span>·</span>
              <span className="text-emerald-400">PWA Ready & Offline Installable</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              {activeTab === 'led_strip'
                ? 'Addressable RGB LED Strip Library Studio'
                : 'Custom Sensor Driver & Signal Conditioning Studio'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {downloadSuccess && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Downloaded {currentLibrary.name}.zip! Ready for Arduino IDE</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleExportZip}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download {currentLibrary.name}.zip</span>
            </button>
          </div>
        </div>

        {/* Mobile PWA Companion Callout Banner */}
        <div className="p-3.5 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 rounded-xl border border-cyan-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Mobile PWA App Installed Support</span>
              <span className="text-slate-400">
                Install directly on your iOS or Android home screen with offline caching. Use on the workbench without tethering!
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSimOpen(true)}
            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Launch Mobile Companion Preview
          </button>
        </div>

        {/* Dynamic Studio Content according to Active Tab */}
        {activeTab === 'led_strip' ? (
          <div className="space-y-6">
            {/* 1. Real-time Interactive LED Strip Visualizer */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  01. Interactive Virtual LED Strip & Photon Simulator
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Live Current & Optical Physics
                </span>
              </div>
              <LedStripVisualizer
                config={ledConfig}
                onUpdateConfig={handleUpdateLedConfig}
              />
            </section>

            {/* 2. Strip Configuration & Power Limiter Settings */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  02. Driver Architecture & Protocol Parameters
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  PROGMEM Gamma · Current Limiter · Non-Blocking Patterns
                </span>
              </div>
              <LedStripStudio
                config={ledConfig}
                onUpdateConfig={handleUpdateLedConfig}
              />
            </section>

            {/* 3. Hardware Interconnect & Inrush Protection Wiring */}
            <section id="wiring-section" className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  03. Electrical Schematic & Inrush Protection Pinout
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  470Ω Data Resistor · 1000µF Buffer Capacitor
                </span>
              </div>
              <WiringDiagram type="led_strip" ledConfig={ledConfig} />
            </section>

            {/* 4. Complete Arduino C++ Code Inspector */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  04. Generated Arduino Library Source Code & Examples
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Header (.h) · Implementation (.cpp) · Sketches (.ino) · Manifest
                </span>
              </div>
              <CodeViewer library={currentLibrary} />
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Real-time Sensor Waveform & Oscilloscope Simulator */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  01. Live Digital Signal Conditioning & Oscilloscope Lab
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Raw ADC · DSP Filter Trace · Calibration Curve · Alarm
                </span>
              </div>
              <SensorOscilloscope
                config={sensorConfig}
                onUpdateConfig={handleUpdateSensorConfig}
              />
            </section>

            {/* 2. Sensor Configuration Studio */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  02. Sensor Module Specifications & Calibration Model
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Interface · Filter Coefficients · 2-Point Linear Math
                </span>
              </div>
              <SensorStudio
                config={sensorConfig}
                onUpdateConfig={handleUpdateSensorConfig}
              />
            </section>

            {/* 3. I2C Register Map Designer if in I2C mode */}
            {sensorConfig.sensorType === 'i2c' && (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    03. I2C Device Register Map & Bitfield Inspector
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Registers · Byte Order · Handshake Signatures
                  </span>
                </div>
                <RegisterMapEditor
                  config={sensorConfig}
                  onUpdateConfig={handleUpdateSensorConfig}
                />
              </section>
            )}

            {/* 4. Hardware Interconnect & Pull-Up Schematic */}
            <section id="wiring-section" className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {sensorConfig.sensorType === 'i2c' ? '04.' : '03.'} Hardware Wiring & Bus Pull-Up Schematic
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  SDA/SCL 4.7kΩ Pull-ups · Decoupling Capacitors
                </span>
              </div>
              <WiringDiagram type="custom_sensor" sensorConfig={sensorConfig} />
            </section>

            {/* 5. Complete Arduino C++ Code Inspector */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {sensorConfig.sensorType === 'i2c' ? '05.' : '04.'} Generated Arduino Library Source Code & Examples
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Non-blocking Acquisition · Status Return Codes · Serial Plotter
                </span>
              </div>
              <CodeViewer library={currentLibrary} />
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800 bg-slate-950 text-xs text-slate-500 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Arduino Library Studio</span>
            <span>·</span>
            <span>Compliant with Arduino IDE 1.5+, PlatformIO & Mobile PWA</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Non-blocking millis() architecture</span>
            <span>·</span>
            <span>PROGMEM Flash optimization</span>
            <span>·</span>
            <span>Installable Mobile App</span>
          </div>
        </div>
      </footer>

      {/* Fixed Bottom Navigation Bar for Mobile Viewports (<= 768px) */}
      <MobileBottomNav
        currentDestination={mobileNavDest}
        onSelectDestination={handleMobileNavSelect}
        onExportZip={handleExportZip}
      />

      {/* PWA Offline Indicator */}
      <OfflineIndicator />

      {/* Arduino 1.5+ Guide Modal */}
      <ArduinoGuideModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      {/* Mobile Device Simulator Modal */}
      <MobileSimulatorModal
        isOpen={isMobileSimOpen}
        onClose={() => setIsMobileSimOpen(false)}
        ledConfig={ledConfig}
        sensorConfig={sensorConfig}
        onExportZip={handleExportZip}
      />
    </div>
  );
}
