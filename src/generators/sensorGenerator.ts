import { GeneratedLibrary, GeneratedLibraryFile, SensorConfig } from '../types/library';

export function generateSensorLibrary(config: SensorConfig): GeneratedLibrary {
  const {
    libraryName,
    className,
    sensorType,
    targetMcu,
    authorName,
    authorEmail,
    version,
    description,
    i2cAddressHex,
    i2cAlternateAddressHex,
    i2cBusSpeedKhz,
    registers,
    hasWhoAmICheck,
    whoAmIRegisterAddress,
    whoAmIExpectedValue,
    enableSoftReset,
    softResetRegisterAddress,
    softResetCommandValue,
    analogPin,
    adcResolutionBits,
    filterType,
    filterWindowSize,
    filterAlpha,
    enableCalibration,
    calibrationType,
    calibPoint1Raw,
    calibPoint1Unit,
    calibPoint2Raw,
    calibPoint2Unit,
    unitLabel,
    enableEepromStorage,
    eepromAddress,
    interruptPin,
    interruptTrigger,
    pulseUnitConversionFactor,
    debounceMicroseconds,
    timeoutMilliseconds,
    enableThresholdAlarm,
    lowThreshold,
    highThreshold,
    hysteresis,
  } = config;

  const headerGuard = `${className.toUpperCase()}_H`;

  // --- 1. library.properties ---
  const libraryProperties = `name=${libraryName}
version=${version}
author=${authorName} <${authorEmail}>
maintainer=${authorName} <${authorEmail}>
sentence=${description}
paragraph=Production-ready Arduino sensor driver for ${sensorType === 'i2c' ? 'I2C register-based' : sensorType === 'analog' ? 'Analog conditioned' : 'Interrupt-driven pulse'} modules. Features non-blocking acquisition, fault status codes, signal conditioning filters, and calibration persistence.
category=Sensors
url=https://github.com/${authorName.toLowerCase().replace(/[^a-z0-9]/g, '')}/${libraryName}
architectures=*
includes=${className}.h
`;

  // --- 2. Header File (.h) ---
  const isI2C = sensorType === 'i2c';
  const isAnalog = sensorType === 'analog';
  const isInterrupt = sensorType === 'interrupt';

  const headerContent = `/**
 * @file ${className}.h
 * @brief Production-grade Arduino sensor driver for ${sensorType.toUpperCase()} sensor module.
 * @author ${authorName} (${authorEmail})
 * @version ${version}
 *
 * Generated via Arduino Library Studio.
 * Complies with official Arduino Library Specification rev 1.5+.
 */

#ifndef ${headerGuard}
#define ${headerGuard}

#include <Arduino.h>

${isI2C ? `#include <Wire.h>` : ''}
${isAnalog && enableEepromStorage ? `#include <EEPROM.h>` : ''}

/**
 * @brief Standardized status codes returned by sensor operations.
 */
enum SensorStatus {
    SENSOR_OK = 0,
    SENSOR_ERR_NOT_FOUND = 1,
    SENSOR_ERR_I2C_NACK = 2,
    SENSOR_ERR_TIMEOUT = 3,
    SENSOR_ERR_CRC = 4,
    SENSOR_ERR_OUT_OF_BOUNDS = 5
};

${isI2C ? `/**
 * @brief Register addresses and bit-definitions for the sensor IC.
 */
namespace ${className}Regs {
    const uint8_t DEFAULT_I2C_ADDR = ${i2cAddressHex};
    ${i2cAlternateAddressHex ? `const uint8_t ALTERNATE_I2C_ADDR = ${i2cAlternateAddressHex};` : ''}

    ${registers
      .map(
        (reg) =>
          `// ${reg.description}\n    const uint8_t REG_${reg.name} = ${reg.address};`
      )
      .join('\n    ')}
    
    ${hasWhoAmICheck ? `const uint8_t REG_WHO_AM_I = ${whoAmIRegisterAddress};\n    const uint8_t VAL_WHO_AM_I = ${whoAmIExpectedValue};` : ''}
    ${enableSoftReset ? `const uint8_t REG_SOFT_RESET = ${softResetRegisterAddress};\n    const uint8_t VAL_SOFT_RESET = ${softResetCommandValue};` : ''}
}
` : ''}

/**
 * @brief Sensor reading packet with raw and engineering units.
 */
struct ${className}Data {
    ${isI2C ? registers.map(reg => `${reg.isSigned ? 'int32_t' : 'uint32_t'} ${reg.name.toLowerCase()};`).join('\n    ') : ''}
    ${isAnalog ? `uint16_t rawAdc;\n    float filteredAdc;\n    float ${unitLabel.toLowerCase()};` : ''}
    ${isInterrupt ? `uint32_t pulseCount;\n    float frequencyHz;\n    float totalUnits;\n    float flowRate;` : ''}
    uint32_t timestampMs;
    SensorStatus status;
};

/**
 * @class ${className}
 * @brief Sensor controller class providing acquisition, filtering, and calibration.
 */
class ${className} {
public:
    ${isI2C ? `${className}(uint8_t i2cAddress = ${className}Regs::DEFAULT_I2C_ADDR, TwoWire& wire = Wire);` : ''}
    ${isAnalog ? `${className}(uint8_t analogPin = ${analogPin.replace('A', '')});` : ''}
    ${isInterrupt ? `${className}(uint8_t interruptPin = ${interruptPin});` : ''}
    ~${className}();

    // Lifecycle
    SensorStatus begin();
    bool isConnected();
    ${enableSoftReset ? 'SensorStatus reset();' : ''}

    // Data acquisition
    SensorStatus read(${className}Data& outData);
    ${isAnalog ? `float read${unitLabel}();\n    uint16_t readRaw();` : ''}
    ${isInterrupt ? `float getFrequency();\n    float getRate();\n    uint32_t getTotalPulses();\n    void resetTotal();` : ''}

    ${isI2C ? `// Low-level register access
    SensorStatus writeRegister8(uint8_t reg, uint8_t value);
    SensorStatus readRegister8(uint8_t reg, uint8_t& outValue);
    SensorStatus readRegister16(uint8_t reg, uint16_t& outValue, bool isLittleEndian = false);
    SensorStatus readRegisters(uint8_t startReg, uint8_t* buffer, size_t length);` : ''}

    ${isAnalog && enableCalibration ? `// Calibration & Filtering
    void setCalibration(float raw1, float unit1, float raw2, float unit2);
    void tareZero(float rawOffset);
    ${enableEepromStorage ? 'bool saveCalibrationToEeprom();\nbool loadCalibrationFromEeprom();' : ''}
    void setFilterAlpha(float alpha) { _filterAlpha = alpha; }` : ''}

    ${enableThresholdAlarm ? `// Threshold comparator
    void setThresholds(float low, float high, float hysteresis) {
        _lowThreshold = low;
        _highThreshold = high;
        _hysteresis = hysteresis;
    }
    bool isHighAlarmActive() const { return _highAlarmActive; }
    bool isLowAlarmActive() const { return _lowAlarmActive; }` : ''}

private:
    ${isI2C ? `uint8_t _i2cAddress;\n    TwoWire& _wire;\n    uint32_t _i2cTimeoutMs;` : ''}
    ${isAnalog ? `uint8_t _analogPin;\n    float _filteredValue;\n    float _filterAlpha;\n    float _calibSlope;\n    float _calibIntercept;\n    ${filterType === 'sma' ? `uint16_t _smaWindow[${filterWindowSize}];\n    uint8_t _smaIndex;\n    uint32_t _smaSum;` : ''}` : ''}
    ${isInterrupt ? `uint8_t _interruptPin;\n    static volatile uint32_t _isrPulseCount;\n    static volatile uint32_t _isrLastMicros;\n    uint32_t _lastPulseSnapshot;\n    uint32_t _lastSnapshotTimestamp;\n    static void isrHandler();` : ''}

    ${enableThresholdAlarm ? `float _lowThreshold;\n    float _highThreshold;\n    float _hysteresis;\n    bool _lowAlarmActive;\n    bool _highAlarmActive;` : ''}
};

#endif // ${headerGuard}
`;

  // Calculate calibration slope and intercept for analog
  const deltaRaw = calibPoint2Raw - calibPoint1Raw;
  const deltaUnit = calibPoint2Unit - calibPoint1Unit;
  const slope = deltaRaw !== 0 ? deltaUnit / deltaRaw : 1.0;
  const intercept = calibPoint1Unit - slope * calibPoint1Raw;

  // --- 3. Implementation File (.cpp) ---
  const cppContent = `/**
 * @file ${className}.cpp
 * @brief Implementation of ${className} sensor driver.
 * @author ${authorName}
 */

#include "${className}.h"

${isInterrupt ? `// Static members for ISR handler
volatile uint32_t ${className}::_isrPulseCount = 0;
volatile uint32_t ${className}::_isrLastMicros = 0;

void ${className}::isrHandler() {
    uint32_t nowMicros = micros();
    if (nowMicros - _isrLastMicros >= ${debounceMicroseconds}) {
        _isrPulseCount++;
        _isrLastMicros = nowMicros;
    }
}` : ''}

${isI2C ? `${className}::${className}(uint8_t i2cAddress, TwoWire& wire)
    : _i2cAddress(i2cAddress),
      _wire(wire),
      _i2cTimeoutMs(${timeoutMilliseconds || 100})${enableThresholdAlarm ? `,\n      _lowThreshold(${lowThreshold}.0f),\n      _highThreshold(${highThreshold}.0f),\n      _hysteresis(${hysteresis}.0f),\n      _lowAlarmActive(false),\n      _highAlarmActive(false)` : ''}
{
}

${className}::~${className}() {
}

SensorStatus ${className}::begin() {
    _wire.begin();
    #if defined(WIRE_HAS_TIMEOUT)
    _wire.setTimeout(_i2cTimeoutMs);
    #endif

    // Verification check
    if (!isConnected()) {
        return SENSOR_ERR_NOT_FOUND;
    }

    ${hasWhoAmICheck ? `// Verify hardware identification
    uint8_t whoAmI = 0;
    SensorStatus status = readRegister8(${className}Regs::REG_WHO_AM_I, whoAmI);
    if (status != SENSOR_OK || whoAmI != ${className}Regs::VAL_WHO_AM_I) {
        return SENSOR_ERR_NOT_FOUND;
    }` : ''}

    ${enableSoftReset ? `// Perform software reset
    reset();
    delay(10);` : ''}

    return SENSOR_OK;
}

bool ${className}::isConnected() {
    _wire.beginTransmission(_i2cAddress);
    return (_wire.endTransmission() == 0);
}

${enableSoftReset ? `SensorStatus ${className}::reset() {
    return writeRegister8(${className}Regs::REG_SOFT_RESET, ${className}Regs::VAL_SOFT_RESET);
}` : ''}

SensorStatus ${className}::read(${className}Data& outData) {
    outData.timestampMs = millis();
    outData.status = SENSOR_OK;

    ${registers
      .map((reg) => {
        const varName = reg.name.toLowerCase();
        if (reg.bitWidth === 8) {
          return `uint8_t raw_${varName} = 0;
    if (readRegister8(${className}Regs::REG_${reg.name}, raw_${varName}) != SENSOR_OK) {
        outData.status = SENSOR_ERR_I2C_NACK;
        return outData.status;
    }
    outData.${varName} = raw_${varName};`;
        } else if (reg.bitWidth === 16) {
          return `uint16_t raw_${varName} = 0;
    if (readRegister16(${className}Regs::REG_${reg.name}, raw_${varName}) != SENSOR_OK) {
        outData.status = SENSOR_ERR_I2C_NACK;
        return outData.status;
    }
    outData.${varName} = ${reg.isSigned ? `(int16_t)raw_${varName}` : `raw_${varName}`};`;
        } else {
          return `uint8_t buf_${varName}[3] = {0};
    if (readRegisters(${className}Regs::REG_${reg.name}, buf_${varName}, 3) != SENSOR_OK) {
        outData.status = SENSOR_ERR_I2C_NACK;
        return outData.status;
    }
    outData.${varName} = ((uint32_t)buf_${varName}[0] << 16) | ((uint32_t)buf_${varName}[1] << 8) | buf_${varName}[2];`;
        }
      })
      .join('\n\n    ')}

    return SENSOR_OK;
}

SensorStatus ${className}::writeRegister8(uint8_t reg, uint8_t value) {
    _wire.beginTransmission(_i2cAddress);
    _wire.write(reg);
    _wire.write(value);
    if (_wire.endTransmission() != 0) {
        return SENSOR_ERR_I2C_NACK;
    }
    return SENSOR_OK;
}

SensorStatus ${className}::readRegister8(uint8_t reg, uint8_t& outValue) {
    _wire.beginTransmission(_i2cAddress);
    _wire.write(reg);
    if (_wire.endTransmission(false) != 0) {
        return SENSOR_ERR_I2C_NACK;
    }

    uint8_t bytesReceived = _wire.requestFrom((uint8_t)_i2cAddress, (uint8_t)1);
    if (bytesReceived != 1) {
        return SENSOR_ERR_TIMEOUT;
    }
    outValue = _wire.read();
    return SENSOR_OK;
}

SensorStatus ${className}::readRegister16(uint8_t reg, uint16_t& outValue, bool isLittleEndian) {
    _wire.beginTransmission(_i2cAddress);
    _wire.write(reg);
    if (_wire.endTransmission(false) != 0) {
        return SENSOR_ERR_I2C_NACK;
    }

    uint8_t bytesReceived = _wire.requestFrom((uint8_t)_i2cAddress, (uint8_t)2);
    if (bytesReceived != 2) {
        return SENSOR_ERR_TIMEOUT;
    }

    uint8_t b1 = _wire.read();
    uint8_t b2 = _wire.read();

    if (isLittleEndian) {
        outValue = ((uint16_t)b2 << 8) | b1;
    } else {
        outValue = ((uint16_t)b1 << 8) | b2;
    }
    return SENSOR_OK;
}

SensorStatus ${className}::readRegisters(uint8_t startReg, uint8_t* buffer, size_t length) {
    _wire.beginTransmission(_i2cAddress);
    _wire.write(startReg);
    if (_wire.endTransmission(false) != 0) {
        return SENSOR_ERR_I2C_NACK;
    }

    size_t count = _wire.requestFrom((uint8_t)_i2cAddress, (uint8_t)length);
    if (count != length) {
        return SENSOR_ERR_TIMEOUT;
    }
    for (size_t i = 0; i < length; i++) {
        buffer[i] = _wire.read();
    }
    return SENSOR_OK;
}
` : ''}

${isAnalog ? `${className}::${className}(uint8_t analogPin)
    : _analogPin(analogPin),
      _filteredValue(0.0f),
      _filterAlpha(${filterAlpha.toFixed(2)}f),
      _calibSlope(${slope.toFixed(6)}f),
      _calibIntercept(${intercept.toFixed(4)}f)${filterType === 'sma' ? `,\n      _smaIndex(0),\n      _smaSum(0)` : ''}${enableThresholdAlarm ? `,\n      _lowThreshold(${lowThreshold}.0f),\n      _highThreshold(${highThreshold}.0f),\n      _hysteresis(${hysteresis}.0f),\n      _lowAlarmActive(false),\n      _highAlarmActive(false)` : ''}
{
    ${filterType === 'sma' ? `for (uint8_t i = 0; i < ${filterWindowSize}; i++) _smaWindow[i] = 0;` : ''}
}

${className}::~${className}() {}

SensorStatus ${className}::begin() {
    #if defined(ARDUINO_ARCH_ESP32)
    analogReadResolution(${adcResolutionBits});
    #endif
    // Seed initial reading
    uint16_t seed = analogRead(_analogPin);
    _filteredValue = (float)seed;
    ${filterType === 'sma' ? `for (uint8_t i = 0; i < ${filterWindowSize}; i++) { _smaWindow[i] = seed; }
    _smaSum = (uint32_t)seed * ${filterWindowSize};` : ''}
    ${enableEepromStorage ? 'loadCalibrationFromEeprom();' : ''}
    return SENSOR_OK;
}

bool ${className}::isConnected() {
    return true; // Analog pin always present
}

uint16_t ${className}::readRaw() {
    return analogRead(_analogPin);
}

SensorStatus ${className}::read(${className}Data& outData) {
    uint16_t raw = readRaw();
    outData.rawAdc = raw;

    ${filterType === 'ema' ? `// Exponential Moving Average filter: y = a*x + (1-a)*y_prev
    _filteredValue = (_filterAlpha * (float)raw) + ((1.0f - _filterAlpha) * _filteredValue);
    outData.filteredAdc = _filteredValue;` :
    filterType === 'sma' ? `// Simple Moving Average circular buffer
    _smaSum -= _smaWindow[_smaIndex];
    _smaWindow[_smaIndex] = raw;
    _smaSum += raw;
    _smaIndex = (_smaIndex + 1) % ${filterWindowSize};
    _filteredValue = (float)_smaSum / (float)${filterWindowSize};
    outData.filteredAdc = _filteredValue;` :
    `_filteredValue = (float)raw;
    outData.filteredAdc = _filteredValue;`}

    // Apply linear calibration: y = mx + b
    outData.${unitLabel.toLowerCase()} = (_calibSlope * _filteredValue) + _calibIntercept;
    outData.timestampMs = millis();
    outData.status = SENSOR_OK;

    ${enableThresholdAlarm ? `// Threshold comparator with hysteresis
    float currentVal = outData.${unitLabel.toLowerCase()};
    if (currentVal >= _highThreshold) {
        _highAlarmActive = true;
    } else if (currentVal <= (_highThreshold - _hysteresis)) {
        _highAlarmActive = false;
    }

    if (currentVal <= _lowThreshold) {
        _lowAlarmActive = true;
    } else if (currentVal >= (_lowThreshold + _hysteresis)) {
        _lowAlarmActive = false;
    }` : ''}

    return SENSOR_OK;
}

float ${className}::read${unitLabel}() {
    ${className}Data data;
    read(data);
    return data.${unitLabel.toLowerCase()};
}

void ${className}::setCalibration(float raw1, float unit1, float raw2, float unit2) {
    if (raw2 != raw1) {
        _calibSlope = (unit2 - unit1) / (raw2 - raw1);
        _calibIntercept = unit1 - (_calibSlope * raw1);
    }
}

void ${className}::tareZero(float rawOffset) {
    _calibIntercept = -(_calibSlope * rawOffset);
}

${enableEepromStorage ? `bool ${className}::saveCalibrationToEeprom() {
    int addr = ${eepromAddress};
    EEPROM.put(addr, _calibSlope);
    EEPROM.put(addr + sizeof(float), _calibIntercept);
    #if defined(ARDUINO_ARCH_ESP8266) || defined(ARDUINO_ARCH_ESP32)
    EEPROM.commit();
    #endif
    return true;
}

bool ${className}::loadCalibrationFromEeprom() {
    int addr = ${eepromAddress};
    float s = 0.0f, c = 0.0f;
    EEPROM.get(addr, s);
    EEPROM.get(addr + sizeof(float), c);
    // Sanity check valid float
    if (!isnan(s) && !isinf(s) && s != 0.0f) {
        _calibSlope = s;
        _calibIntercept = c;
        return true;
    }
    return false;
}` : ''}
` : ''}

${isInterrupt ? `${className}::${className}(uint8_t interruptPin)
    : _interruptPin(interruptPin),
      _lastPulseSnapshot(0),
      _lastSnapshotTimestamp(0)${enableThresholdAlarm ? `,\n      _lowThreshold(${lowThreshold}.0f),\n      _highThreshold(${highThreshold}.0f),\n      _hysteresis(${hysteresis}.0f),\n      _lowAlarmActive(false),\n      _highAlarmActive(false)` : ''}
{
}

${className}::~${className}() {
    detachInterrupt(digitalPinToInterrupt(_interruptPin));
}

SensorStatus ${className}::begin() {
    pinMode(_interruptPin, INPUT_PULLUP);
    _isrPulseCount = 0;
    _isrLastMicros = micros();
    _lastPulseSnapshot = 0;
    _lastSnapshotTimestamp = millis();

    attachInterrupt(digitalPinToInterrupt(_interruptPin), ${className}::isrHandler, ${interruptTrigger});
    return SENSOR_OK;
}

bool ${className}::isConnected() {
    return true;
}

SensorStatus ${className}::read(${className}Data& outData) {
    uint32_t now = millis();
    uint32_t dt = now - _lastSnapshotTimestamp;
    if (dt == 0) dt = 1;

    // Atomic read of pulse count from ISR
    noInterrupts();
    uint32_t currentPulses = _isrPulseCount;
    interrupts();

    uint32_t pulsesInWindow = currentPulses - _lastPulseSnapshot;
    _lastPulseSnapshot = currentPulses;
    _lastSnapshotTimestamp = now;

    // Frequency = pulses / seconds
    float freq = ((float)pulsesInWindow * 1000.0f) / (float)dt;
    outData.pulseCount = currentPulses;
    outData.frequencyHz = freq;
    outData.totalUnits = (float)currentPulses / ${pulseUnitConversionFactor.toFixed(2)}f;
    outData.flowRate = freq / ${pulseUnitConversionFactor.toFixed(2)}f;
    outData.timestampMs = now;
    outData.status = SENSOR_OK;

    return SENSOR_OK;
}

float ${className}::getFrequency() {
    ${className}Data d;
    read(d);
    return d.frequencyHz;
}

float ${className}::getRate() {
    ${className}Data d;
    read(d);
    return d.flowRate;
}

uint32_t ${className}::getTotalPulses() {
    noInterrupts();
    uint32_t count = _isrPulseCount;
    interrupts();
    return count;
}

void ${className}::resetTotal() {
    noInterrupts();
    _isrPulseCount = 0;
    interrupts();
    _lastPulseSnapshot = 0;
}
` : ''}
`;

  // --- 4. Basic Example (.ino) ---
  const basicExampleIno = `/**
 * @file BasicSensorReading.ino
 * @brief Starter sketch for reading data from ${className}.
 */

#include <${className}.h>

${isI2C ? `${className} sensor(${className}Regs::DEFAULT_I2C_ADDR);` : ''}
${isAnalog ? `${className} sensor(${analogPin.replace('A', '')});` : ''}
${isInterrupt ? `${className} sensor(${interruptPin});` : ''}

void setup() {
    Serial.begin(115200);
    while (!Serial && millis() < 2000);
    Serial.println(F("[${className}] Initializing sensor..."));

    SensorStatus status = sensor.begin();
    if (status != SENSOR_OK) {
        Serial.print(F("Initialization failed! Error code: "));
        Serial.println((int)status);
        while (1) delay(100);
    }

    Serial.println(F("Sensor connected successfully!"));
}

void loop() {
    ${className}Data data;
    SensorStatus status = sensor.read(data);

    if (status == SENSOR_OK) {
        Serial.print(F("Time: "));
        Serial.print(data.timestampMs);
        Serial.print(F(" ms | "));
        
        ${isI2C ? registers.map(r => `Serial.print(F("${r.name}: ")); Serial.print(data.${r.name.toLowerCase()}); Serial.print(F(" | "));`).join('\n        ') : ''}
        ${isAnalog ? `Serial.print(F("Raw ADC: "));
        Serial.print(data.rawAdc);
        Serial.print(F(" | Filtered: "));
        Serial.print(data.filteredAdc);
        Serial.print(F(" | Value: "));
        Serial.print(data.${unitLabel.toLowerCase()});
        Serial.println(F(" ${unitLabel}"));` : ''}
        ${isInterrupt ? `Serial.print(F("Freq: "));
        Serial.print(data.frequencyHz);
        Serial.print(F(" Hz | Rate: "));
        Serial.print(data.flowRate);
        Serial.print(F(" | Total: "));
        Serial.println(data.totalUnits);` : ''}
    } else {
        Serial.print(F("Read error: "));
        Serial.println((int)status);
    }

    delay(250);
}
`;

  // --- 5. Advanced Example (.ino) ---
  const advancedExampleIno = `/**
 * @file NonBlockingSensorMonitor.ino
 * @brief High-reliability sensor monitoring sketch with timeout detection and alarm thresholds.
 */

#include <${className}.h>

${isI2C ? `${className} sensor(${className}Regs::DEFAULT_I2C_ADDR);` : ''}
${isAnalog ? `${className} sensor(${analogPin.replace('A', '')});` : ''}
${isInterrupt ? `${className} sensor(${interruptPin});` : ''}

unsigned long lastSampleTime = 0;
const unsigned long SAMPLE_INTERVAL_MS = 100; // 10 Hz sampling rate

void setup() {
    Serial.begin(115200);
    sensor.begin();

    ${enableThresholdAlarm ? `// Configure threshold alarms
    sensor.setThresholds(${lowThreshold}.0f, ${highThreshold}.0f, ${hysteresis}.0f);` : ''}
    Serial.println(F("Starting high-speed non-blocking sensor acquisition..."));
}

void loop() {
    unsigned long now = millis();

    // Non-blocking timer tick
    if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
        lastSampleTime = now;

        ${className}Data sample;
        SensorStatus err = sensor.read(sample);

        if (err == SENSOR_OK) {
            ${isAnalog ? `// Plotter friendly output format: Raw, Filtered, Calibrated
            Serial.print(sample.rawAdc);
            Serial.print(F(","));
            Serial.print(sample.filteredAdc);
            Serial.print(F(","));
            Serial.println(sample.${unitLabel.toLowerCase()});` : ''}
            ${isI2C ? `Serial.print(F("OK: [${registers[0]?.name || 'DATA'}] = "));
            Serial.println(sample.${registers[0]?.name.toLowerCase() || 'reg'});` : ''}
            ${isInterrupt ? `Serial.print(sample.frequencyHz);
            Serial.print(F(","));
            Serial.println(sample.flowRate);` : ''}

            ${enableThresholdAlarm ? `if (sensor.isHighAlarmActive()) {
                // Trigger warning alert
            }` : ''}
        } else {
            // Bus recovery or reconnection handling
            Serial.print(F("FAULT: Code "));
            Serial.println((int)err);
        }
    }
}
`;

  // --- 6. keywords.txt ---
  const keywordsTxt = `# Syntax Highlighting for ${className}
${className}	KEYWORD1
SensorStatus	KEYWORD1
${className}Data	KEYWORD1

begin	KEYWORD2
isConnected	KEYWORD2
read	KEYWORD2
${isI2C ? 'writeRegister8\tKEYWORD2\nreadRegister8\tKEYWORD2\nreadRegister16\tKEYWORD2\nreset\tKEYWORD2' : ''}
${isAnalog ? `read${unitLabel}\tKEYWORD2\nreadRaw\tKEYWORD2\nsetCalibration\tKEYWORD2\ntareZero\tKEYWORD2\nsaveCalibrationToEeprom\tKEYWORD2\nloadCalibrationFromEeprom\tKEYWORD2` : ''}
${isInterrupt ? 'getFrequency\tKEYWORD2\ngetRate\tKEYWORD2\ngetTotalPulses\tKEYWORD2\nresetTotal\tKEYWORD2' : ''}

SENSOR_OK	LITERAL1
SENSOR_ERR_NOT_FOUND	LITERAL1
SENSOR_ERR_I2C_NACK	LITERAL1
SENSOR_ERR_TIMEOUT	LITERAL1
`;

  // --- 7. README.md ---
  const readmeMd = `# ${libraryName}

${description}

Engineered according to the **Arduino 1.5+ Library Specification** with non-blocking acquisition, fault status codes, and robust error handling.

---

## ⚡ Specifications

| Parameter | Specification |
| :--- | :--- |
| **Interface** | \`${sensorType.toUpperCase()}\` |
${isI2C ? `| **Default I2C Address** | \`${i2cAddressHex}\` |
| **Bus Speed** | \`${i2cBusSpeedKhz} kHz\` |
| **Registers Declared** | \`${registers.length}\` registers |` : ''}
${isAnalog ? `| **Analog Pin** | \`${analogPin}\` |
| **ADC Resolution** | \`${adcResolutionBits}-bit\` |
| **Digital Filter** | \`${filterType.toUpperCase()}\` (Alpha: \`${filterAlpha}\`) |
| **Calibration** | 2-Point Linear (\`${calibPoint1Raw} -> ${calibPoint1Unit}${unitLabel}\`, \`${calibPoint2Raw} -> ${calibPoint2Unit}${unitLabel}\`) |` : ''}
${isInterrupt ? `| **Interrupt Pin** | Digital Pin \`${interruptPin}\` |
| **Trigger Mode** | \`${interruptTrigger}\` |
| **Debounce Window** | \`${debounceMicroseconds} µs\` |` : ''}

---

## 🔌 Hardware Wiring Diagram

${isI2C ? `\`\`\`
       Arduino Uno / ESP32                    I2C Sensor Module
    +-----------------------+              +-----------------------+
    |                       |              |                       |
    |      3.3V / 5V [+]----+--------------+ [VCC]                 |
    |                       |    |    |    |                       |
    |         GND    [-]----+----+----+----+ [GND]                 |
    |                       |    |    |    |                       |
    |         SDA    [A4]---+-[ 4.7kΩ ]----+ [SDA]                 |
    |                       |    |         |                       |
    |         SCL    [A5]--------+-[ 4.7kΩ ] [SCL]                 |
    +-----------------------+              +-----------------------+
\`\`\`

> ⚠️ **I2C Pull-Up Resistors:** Ensure 4.7kΩ pull-up resistors are installed between SDA/SCL and VCC (many breakout boards include these built-in).` : ''}
${isAnalog ? `\`\`\`
       Arduino Uno / ESP32                    Analog Sensor Module
    +-----------------------+              +-----------------------+
    |                       |              |                       |
    |         5V     [+]----+--------------+ [VCC]                 |
    |                       |              |                       |
    |         GND    [-]----+--------------+ [GND]                 |
    |                       |    |         |                       |
    |         Pin ${analogPin.padEnd(2)}  [~]----+--[ 100nF ]---+ [ANALOG OUT]          |
    +-----------------------+    |         +-----------------------+
                                 |
                               [GND] (Bypass capacitor for noise reduction)
\`\`\`` : ''}
${isInterrupt ? `\`\`\`
       Arduino Uno / ESP32                    Pulse / Flow Sensor
    +-----------------------+              +-----------------------+
    |                       |              |                       |
    |         5V     [+]----+--------------+ [VCC / Red]           |
    |                       |              |                       |
    |         GND    [-]----+--------------+ [GND / Black]         |
    |                       |    |         |                       |
    |         Pin ${interruptPin.toString().padEnd(2)}  [~]----+--[ 10kΩ ]----+ [SIGNAL / Yellow]      |
    +-----------------------+    |         +-----------------------+
                                 |
                               [5V] (Pull-up resistor for open-collector)
\`\`\`` : ''}

---

## 🚀 Quick Start Guide

### 1. Installation
1. Download this library repository as a \`.zip\` archive.
2. In **Arduino IDE**, click **Sketch** -> **Include Library** -> **Add .ZIP Library...**.
3. Select the downloaded \`.zip\` file.

### 2. Basic Sketch
\`\`\`cpp
#include <${className}.h>

${isI2C ? `${className} sensor;` : ''}
${isAnalog ? `${className} sensor(${analogPin.replace('A', '')});` : ''}
${isInterrupt ? `${className} sensor(${interruptPin});` : ''}

void setup() {
    Serial.begin(115200);
    sensor.begin();
}

void loop() {
    ${className}Data data;
    if (sensor.read(data) == SENSOR_OK) {
        ${isAnalog ? `Serial.println(data.${unitLabel.toLowerCase()});` : ''}
        ${isI2C ? `Serial.println(data.${registers[0]?.name.toLowerCase() || 'val'});` : ''}
        ${isInterrupt ? `Serial.println(data.flowRate);` : ''}
    }
    delay(100);
}
\`\`\`

---

## 📚 Return Codes
- \`SENSOR_OK (0)\`: Operation completed successfully.
- \`SENSOR_ERR_NOT_FOUND (1)\`: Device failed handshake or WHO_AM_I mismatch.
- \`SENSOR_ERR_I2C_NACK (2)\`: Device did not acknowledge address or register byte.
- \`SENSOR_ERR_TIMEOUT (3)\`: Bus transaction timed out.
- \`SENSOR_ERR_OUT_OF_BOUNDS (5)\`: Measurement exceeded physical limits.

---

## 📄 License
This library is distributed under the Apache-2.0 License.
`;

  const files: GeneratedLibraryFile[] = [
    {
      filename: 'library.properties',
      path: 'library.properties',
      language: 'properties',
      content: libraryProperties,
      description: 'Official Arduino 1.5+ manifest describing sensor category, targets, and dependencies.',
    },
    {
      filename: `${className}.h`,
      path: `src/${className}.h`,
      language: 'cpp',
      content: headerContent,
      description: 'C++ header file with register definitions, SensorStatus return enums, and class declaration.',
    },
    {
      filename: `${className}.cpp`,
      path: `src/${className}.cpp`,
      language: 'cpp',
      content: cppContent,
      description: 'C++ driver implementation including signal filtering, calibration equations, and register I/O.',
    },
    {
      filename: 'BasicSensorReading.ino',
      path: 'examples/BasicSensorReading/BasicSensorReading.ino',
      language: 'arduino',
      content: basicExampleIno,
      description: 'Ready-to-upload starter sketch demonstrating initial handshake and data output.',
    },
    {
      filename: 'NonBlockingSensorMonitor.ino',
      path: 'examples/NonBlockingSensorMonitor/NonBlockingSensorMonitor.ino',
      language: 'arduino',
      content: advancedExampleIno,
      description: 'Industrial-grade non-blocking acquisition sketch with fault handling and serial plotting.',
    },
    {
      filename: 'keywords.txt',
      path: 'keywords.txt',
      language: 'text',
      content: keywordsTxt,
      description: 'Arduino IDE syntax highlighting keywords.',
    },
    {
      filename: 'README.md',
      path: 'README.md',
      language: 'markdown',
      content: readmeMd,
      description: 'Wiring schematics, pinout recommendations, pull-up notes, and API documentation.',
    },
  ];

  return {
    name: libraryName,
    type: 'custom_sensor',
    version,
    files,
  };
}
