export type LibraryType = 'led_strip' | 'custom_sensor';

export type LedChipset = 'ws2812b' | 'apa102' | 'sk6812_rgbw' | 'analog_pwm';
export type ColorOrder = 'GRB' | 'RGB' | 'BRG' | 'BGR' | 'RGBW';
export type Microcontroller = 'atmega328p' | 'esp32' | 'rp2040' | 'esp8266' | 'samd21';

export interface LedStripConfig {
  libraryName: string;
  className: string;
  chipset: LedChipset;
  colorOrder: ColorOrder;
  targetMcu: Microcontroller;
  defaultPin: number;
  clockPin?: number; // for APA102 SPI
  defaultPixelCount: number;
  enableGammaCorrection: boolean;
  gammaValue: number;
  enablePowerLimiter: boolean;
  maxCurrentMilliamps: number;
  operatingVoltage: number; // 5.0 or 12.0
  enableDoubleBuffering: boolean;
  includeAnimationEngine: boolean;
  includeColorTemperature: boolean;
  authorName: string;
  authorEmail: string;
  version: string;
  description: string;
}

export type SensorInterface = 'i2c' | 'analog' | 'interrupt';

export interface I2CRegister {
  id: string;
  name: string;
  address: string; // hex string e.g. "0x00"
  description: string;
  isReadOnly: boolean;
  defaultValue: string; // hex string e.g. "0x5A"
  bitWidth: 8 | 16 | 24;
  isSigned?: boolean;
}

export interface SensorConfig {
  libraryName: string;
  className: string;
  sensorType: SensorInterface;
  targetMcu: Microcontroller;
  authorName: string;
  authorEmail: string;
  version: string;
  description: string;
  
  // I2C specific
  i2cAddressHex: string;
  i2cAlternateAddressHex?: string;
  i2cBusSpeedKhz: 100 | 400;
  registers: I2CRegister[];
  hasWhoAmICheck: boolean;
  whoAmIRegisterAddress: string;
  whoAmIExpectedValue: string;
  enableSoftReset: boolean;
  softResetRegisterAddress: string;
  softResetCommandValue: string;

  // Analog specific
  analogPin: string; // e.g. "A0"
  adcResolutionBits: 10 | 12 | 16;
  filterType: 'ema' | 'sma' | 'median' | 'none';
  filterWindowSize: number; // For SMA (e.g., 8, 16)
  filterAlpha: number; // For EMA (e.g., 0.15)
  enableCalibration: boolean;
  calibrationType: 'two_point' | 'polynomial' | 'tare_zero';
  calibPoint1Raw: number;
  calibPoint1Unit: number;
  calibPoint2Raw: number;
  calibPoint2Unit: number;
  unitLabel: string; // e.g. "degC", "hPa", "lux", "mm", "kPa"
  enableEepromStorage: boolean;
  eepromAddress: number;

  // Interrupt / Pulse specific
  interruptPin: number;
  interruptTrigger: 'RISING' | 'FALLING' | 'CHANGE';
  pulseUnitConversionFactor: number; // pulses per unit, e.g. 450 pulses/L
  debounceMicroseconds: number;
  timeoutMilliseconds: number;

  // Alarms
  enableThresholdAlarm: boolean;
  lowThreshold: number;
  highThreshold: number;
  hysteresis: number;
}

export interface GeneratedLibraryFile {
  filename: string;
  path: string;
  language: 'cpp' | 'properties' | 'text' | 'markdown' | 'arduino';
  content: string;
  description: string;
}

export interface GeneratedLibrary {
  name: string;
  type: LibraryType;
  version: string;
  files: GeneratedLibraryFile[];
}
