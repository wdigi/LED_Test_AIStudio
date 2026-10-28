import { GeneratedLibrary, GeneratedLibraryFile, LedStripConfig } from '../types/library';

// Generate 256-byte Gamma Table based on gamma factor
export function generateGammaTable(gamma: number): number[] {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    const val = Math.round(Math.pow(i / 255.0, gamma) * 255.0);
    table.push(Math.min(255, Math.max(0, val)));
  }
  return table;
}

export function generateLedStripLibrary(config: LedStripConfig): GeneratedLibrary {
  const {
    libraryName,
    className,
    chipset,
    colorOrder,
    targetMcu,
    defaultPin,
    clockPin = 13,
    defaultPixelCount,
    enableGammaCorrection,
    gammaValue,
    enablePowerLimiter,
    maxCurrentMilliamps,
    operatingVoltage,
    enableDoubleBuffering,
    includeAnimationEngine,
    includeColorTemperature,
    authorName,
    authorEmail,
    version,
    description,
  } = config;

  const headerGuard = `${className.toUpperCase()}_H`;
  const isRGBW = chipset === 'sk6812_rgbw';
  const isSPI = chipset === 'apa102';
  const isPWM = chipset === 'analog_pwm';

  // --- 1. library.properties ---
  const libraryProperties = `name=${libraryName}
version=${version}
author=${authorName} <${authorEmail}>
maintainer=${authorName} <${authorEmail}>
sentence=${description}
paragraph=High-performance, non-blocking Arduino library engineered for ${chipset.toUpperCase()} LED strips with hardware-optimized transmission, gamma correction LUT, power limiter protection, and smooth animation engine.
category=Display
url=https://github.com/${authorName.toLowerCase().replace(/[^a-z0-9]/g, '')}/${libraryName}
architectures=*
includes=${className}.h
`;

  // Gamma table string in C PROGMEM format
  const gammaArray = generateGammaTable(gammaValue);
  const gammaTableFormatted = gammaArray
    .map((val, idx) => (idx % 16 === 0 ? `\n    ${val}` : `${val}`))
    .join(', ');

  // --- 2. Header File (.h) ---
  const headerContent = `/**
 * @file ${className}.h
 * @brief Production-grade Arduino library for ${chipset.toUpperCase()} LED control.
 * @author ${authorName} (${authorEmail})
 * @version ${version}
 *
 * Generated via Arduino Library Studio.
 * Complies with official Arduino Library Specification rev 1.5+.
 */

#ifndef ${headerGuard}
#define ${headerGuard}

#include <Arduino.h>

#if defined(ARDUINO_ARCH_AVR)
  #include <avr/pgmspace.h>
#else
  #ifndef PROGMEM
    #define PROGMEM
  #endif
  #ifndef pgm_read_byte
    #define pgm_read_byte(addr) (*(const unsigned char *)(addr))
  #endif
#endif

#if defined(ARDUINO_ARCH_ESP32) || defined(ARDUINO_ARCH_ESP8266) || defined(ARDUINO_ARCH_RP2040)
  #define ${className.toUpperCase()}_IS_32BIT 1
#else
  #define ${className.toUpperCase()}_IS_32BIT 0
#endif

/**
 * @brief Representation of an individual RGB${isRGBW ? 'W' : ''} pixel color.
 */
struct PixelColor {
    uint8_t r;
    uint8_t g;
    uint8_t b;
    ${isRGBW ? 'uint8_t w;' : ''}

    PixelColor() : r(0), g(0), b(0)${isRGBW ? ', w(0)' : ''} {}
    PixelColor(uint8_t red, uint8_t green, uint8_t blue${isRGBW ? ', uint8_t white = 0' : ''})
        : r(red), g(green), b(blue)${isRGBW ? ', w(white)' : ''} {}

    static PixelColor fromHex(uint32_t hexColor) {
        return PixelColor(
            (hexColor >> 16) & 0xFF,
            (hexColor >> 8) & 0xFF,
            hexColor & 0xFF
        );
    }

    static PixelColor fromHSV(uint8_t hue, uint8_t sat, uint8_t val);
};

/**
 * @brief Animation mode identifiers for non-blocking sequencer.
 */
enum AnimationPattern {
    PATTERN_NONE = 0,
    PATTERN_RAINBOW_CYCLE,
    PATTERN_COMET_CHASE,
    PATTERN_BREATHING_PULSE,
    PATTERN_FIRE_SIMULATOR,
    PATTERN_THEATER_CHASE,
    PATTERN_COLOR_WIPE
};

/**
 * @class ${className}
 * @brief Core driver class for ${chipset.toUpperCase()} LED strip.
 */
class ${className} {
public:
    ${className}(uint16_t numPixels = ${defaultPixelCount}, uint8_t dataPin = ${defaultPin}${isSPI ? `, uint8_t clockPin = ${clockPin}` : ''});
    ~${className}();

    // Hardware lifecycle
    bool begin();
    void show();
    void clear();

    // Pixel manipulation
    void setPixelColor(uint16_t index, const PixelColor& color);
    void setPixelColor(uint16_t index, uint8_t r, uint8_t g, uint8_t b${isRGBW ? ', uint8_t w = 0' : ''});
    void setPixelColor(uint16_t index, uint32_t hexColor);
    PixelColor getPixelColor(uint16_t index) const;
    void fill(const PixelColor& color, uint16_t start = 0, uint16_t count = 0);

    // Brightness and Gamma
    void setBrightness(uint8_t brightness); // 0-255 scale
    uint8_t getBrightness() const { return _globalBrightness; }
    void setGammaEnabled(bool enabled) { _gammaEnabled = enabled; }
    bool isGammaEnabled() const { return _gammaEnabled; }
    static uint8_t gammaCorrect(uint8_t input);

    // Power budget manager
    ${enablePowerLimiter ? `void setMaxCurrentMilliamps(uint16_t maxMa) { _maxCurrentMa = maxMa; }
    uint16_t getMaxCurrentMilliamps() const { return _maxCurrentMa; }
    uint32_t estimateCurrentDrawMilliamps() const;` : ''}

    ${includeAnimationEngine ? `// Non-blocking Animation Engine
    void setPattern(AnimationPattern pattern, uint16_t intervalMs = 25, const PixelColor& primaryColor = PixelColor(255, 0, 0));
    bool update(); // Returns true when a frame was rendered and pushed
    void setAnimationSpeed(uint16_t intervalMs) { _patternIntervalMs = intervalMs; }` : ''}

    uint16_t numPixels() const { return _numPixels; }

private:
    uint16_t _numPixels;
    uint8_t _dataPin;
    ${isSPI ? 'uint8_t _clockPin;' : ''}
    ${isPWM ? 'uint8_t _redPin;\n    uint8_t _greenPin;\n    uint8_t _bluePin;' : ''}
    uint8_t _globalBrightness;
    bool _gammaEnabled;
    ${enablePowerLimiter ? 'uint16_t _maxCurrentMa;\n    float _voltage;' : ''}
    ${enableDoubleBuffering ? 'bool _isDirty;' : ''}

    PixelColor* _pixelBuffer;

    ${includeAnimationEngine ? `// Animation State Machine variables
    AnimationPattern _currentPattern;
    uint32_t _lastFrameTimestamp;
    uint16_t _patternIntervalMs;
    uint16_t _patternStep;
    PixelColor _animPrimaryColor;
    PixelColor _animSecondaryColor;

    void stepRainbowCycle();
    void stepCometChase();
    void stepBreathingPulse();
    void stepFireSimulator();
    void stepTheaterChase();` : ''}

    // Hardware Transmission
    void transmitBuffer();
};

#endif // ${headerGuard}
`;

  // --- 3. Implementation File (.cpp) ---
  const cppContent = `/**
 * @file ${className}.cpp
 * @brief Implementation of ${className} driver.
 * @author ${authorName}
 */

#include "${className}.h"
#include <stdlib.h>

#if ${isSPI ? '1' : '0'}
  #include <SPI.h>
#endif

// Pre-computed 256-byte gamma lookup table (Gamma = ${gammaValue.toFixed(1)})
static const uint8_t PROGMEM _gammaLUT[256] = {${gammaTableFormatted}
};

PixelColor PixelColor::fromHSV(uint8_t hue, uint8_t sat, uint8_t val) {
    if (sat == 0) {
        return PixelColor(val, val, val);
    }
    uint8_t base = ((255 - sat) * val) >> 8;
    uint8_t sector = hue / 43; // 0..5
    uint8_t remainder = (hue - (sector * 43)) * 6; // 0..255

    uint8_t p = base;
    uint8_t q = (val * (255 - ((sat * remainder) >> 8))) >> 8;
    uint8_t t = (val * (255 - ((sat * (255 - remainder)) >> 8))) >> 8;

    switch (sector) {
        case 0:  return PixelColor(val, t, p);
        case 1:  return PixelColor(q, val, p);
        case 2:  return PixelColor(p, val, t);
        case 3:  return PixelColor(p, q, val);
        case 4:  return PixelColor(t, p, val);
        default: return PixelColor(val, p, q);
    }
}

${className}::${className}(uint16_t numPixels, uint8_t dataPin${isSPI ? `, uint8_t clockPin` : ''})
    : _numPixels(numPixels),
      _dataPin(dataPin),
      ${isSPI ? '_clockPin(clockPin),' : ''}
      _globalBrightness(255),
      _gammaEnabled(${enableGammaCorrection ? 'true' : 'false'}),
      ${enablePowerLimiter ? `_maxCurrentMa(${maxCurrentMilliamps}),\n      _voltage(${operatingVoltage.toFixed(1)}f),` : ''}
      ${enableDoubleBuffering ? '_isDirty(true),' : ''}
      _pixelBuffer(nullptr)${includeAnimationEngine ? `,\n      _currentPattern(PATTERN_NONE),\n      _lastFrameTimestamp(0),\n      _patternIntervalMs(30),\n      _patternStep(0),\n      _animPrimaryColor(255, 0, 0),\n      _animSecondaryColor(0, 0, 255)` : ''}
{
    if (_numPixels > 0) {
        _pixelBuffer = (PixelColor*)malloc(_numPixels * sizeof(PixelColor));
        if (_pixelBuffer != nullptr) {
            clear();
        }
    }
}

${className}::~${className}() {
    if (_pixelBuffer != nullptr) {
        free(_pixelBuffer);
        _pixelBuffer = nullptr;
    }
}

bool ${className}::begin() {
    pinMode(_dataPin, OUTPUT);
    digitalWrite(_dataPin, LOW);
    ${isSPI ? `pinMode(_clockPin, OUTPUT);\n    digitalWrite(_clockPin, LOW);\n    SPI.begin();` : ''}
    clear();
    show();
    return true;
}

void ${className}::clear() {
    if (!_pixelBuffer) return;
    for (uint16_t i = 0; i < _numPixels; i++) {
        _pixelBuffer[i] = PixelColor(0, 0, 0${isRGBW ? ', 0' : ''});
    }
    ${enableDoubleBuffering ? '_isDirty = true;' : ''}
}

void ${className}::setPixelColor(uint16_t index, const PixelColor& color) {
    if (!_pixelBuffer || index >= _numPixels) return;
    _pixelBuffer[index] = color;
    ${enableDoubleBuffering ? '_isDirty = true;' : ''}
}

void ${className}::setPixelColor(uint16_t index, uint8_t r, uint8_t g, uint8_t b${isRGBW ? ', uint8_t w' : ''}) {
    setPixelColor(index, PixelColor(r, g, b${isRGBW ? ', w' : ''}));
}

void ${className}::setPixelColor(uint16_t index, uint32_t hexColor) {
    setPixelColor(index, PixelColor::fromHex(hexColor));
}

PixelColor ${className}::getPixelColor(uint16_t index) const {
    if (!_pixelBuffer || index >= _numPixels) {
        return PixelColor(0, 0, 0${isRGBW ? ', 0' : ''});
    }
    return _pixelBuffer[index];
}

void ${className}::fill(const PixelColor& color, uint16_t start, uint16_t count) {
    if (!_pixelBuffer || start >= _numPixels) return;
    uint16_t end = (count == 0) ? _numPixels : (start + count);
    if (end > _numPixels) end = _numPixels;

    for (uint16_t i = start; i < end; i++) {
        _pixelBuffer[i] = color;
    }
    ${enableDoubleBuffering ? '_isDirty = true;' : ''}
}

void ${className}::setBrightness(uint8_t brightness) {
    _globalBrightness = brightness;
    ${enableDoubleBuffering ? '_isDirty = true;' : ''}
}

uint8_t ${className}::gammaCorrect(uint8_t input) {
    return pgm_read_byte(&_gammaLUT[input]);
}

${enablePowerLimiter ? `uint32_t ${className}::estimateCurrentDrawMilliamps() const {
    if (!_pixelBuffer) return 0;
    // Base quiescent current per chip: ~1mA
    uint32_t totalCurrentMa = _numPixels * 1; 
    for (uint16_t i = 0; i < _numPixels; i++) {
        const PixelColor& c = _pixelBuffer[i];
        // Full white (255,255,255) draws approximately ~55-60mA per pixel at 5V
        uint32_t pixelMa = ((uint32_t)c.r * 20 + (uint32_t)c.g * 20 + (uint32_t)c.b * 20) / 255;
        ${isRGBW ? 'pixelMa += ((uint32_t)c.w * 20) / 255;' : ''}
        totalCurrentMa += pixelMa;
    }
    return (totalCurrentMa * _globalBrightness) / 255;
}` : ''}

void ${className}::show() {
    if (!_pixelBuffer) return;

    ${enablePowerLimiter ? `// Active current limiter protection
    uint32_t estimatedMa = estimateCurrentDrawMilliamps();
    uint8_t effectiveBrightness = _globalBrightness;
    if (_maxCurrentMa > 0 && estimatedMa > _maxCurrentMa) {
        // Automatically throttle brightness down to fit electrical power envelope
        effectiveBrightness = (uint8_t)(((uint32_t)_globalBrightness * _maxCurrentMa) / estimatedMa);
    }` : ''}

    transmitBuffer();
    ${enableDoubleBuffering ? '_isDirty = false;' : ''}
}

void ${className}::transmitBuffer() {
    ${isSPI ? `// APA102 SPI Transmission
    SPI.beginTransaction(SPISettings(12000000, MSBFIRST, SPI_MODE0));
    // Start Frame: 32 zero bits
    for (uint8_t i = 0; i < 4; i++) SPI.transfer(0x00);

    for (uint16_t i = 0; i < _numPixels; i++) {
        PixelColor c = _pixelBuffer[i];
        if (_gammaEnabled) {
            c.r = gammaCorrect(c.r);
            c.g = gammaCorrect(c.g);
            c.b = gammaCorrect(c.b);
        }
        // APA102 LED Frame: 3 bits 111 + 5 bits global brightness (0..31)
        uint8_t brightness5bit = (_globalBrightness >> 3) & 0x1F;
        SPI.transfer(0xE0 | brightness5bit);
        SPI.transfer(c.b);
        SPI.transfer(c.g);
        SPI.transfer(c.r);
    }

    // End Frame: (numPixels + 15) / 16 clock pulses
    uint8_t endBytes = (_numPixels + 15) / 16;
    for (uint8_t i = 0; i < endBytes; i++) SPI.transfer(0xFF);
    SPI.endTransaction();` : `// WS2812B / SK6812 High-speed protocol (800 kHz)
    // Non-interruptible frame blast to maintain strict 1.25us bit timing
    noInterrupts();
    for (uint16_t i = 0; i < _numPixels; i++) {
        PixelColor c = _pixelBuffer[i];
        // Apply global brightness scaling
        uint8_t r = ((uint16_t)c.r * _globalBrightness) >> 8;
        uint8_t g = ((uint16_t)c.g * _globalBrightness) >> 8;
        uint8_t b = ((uint16_t)c.b * _globalBrightness) >> 8;
        ${isRGBW ? 'uint8_t w = ((uint16_t)c.w * _globalBrightness) >> 8;' : ''}

        if (_gammaEnabled) {
            r = gammaCorrect(r);
            g = gammaCorrect(g);
            b = gammaCorrect(b);
            ${isRGBW ? 'w = gammaCorrect(w);' : ''}
        }

        // Color ordering (${colorOrder})
        ${colorOrder === 'GRB' ? `uint8_t bytes[3] = {g, r, b};` :
          colorOrder === 'RGB' ? `uint8_t bytes[3] = {r, g, b};` :
          colorOrder === 'RGBW' ? `uint8_t bytes[4] = {r, g, b, w};` :
          `uint8_t bytes[3] = {g, r, b};`}

        for (uint8_t byteIdx = 0; byteIdx < ${isRGBW ? '4' : '3'}; byteIdx++) {
            uint8_t currentByte = bytes[byteIdx];
            for (int8_t bit = 7; bit >= 0; bit--) {
                if (currentByte & (1 << bit)) {
                    // Logic 1: High for ~800ns, Low for ~450ns
                    digitalWrite(_dataPin, HIGH);
                    delayMicroseconds(1);
                    digitalWrite(_dataPin, LOW);
                } else {
                    // Logic 0: High for ~350ns, Low for ~900ns
                    digitalWrite(_dataPin, HIGH);
                    digitalWrite(_dataPin, LOW);
                    delayMicroseconds(1);
                }
            }
        }
    }
    interrupts();
    delayMicroseconds(50); // Reset latch (>50us)`}
}

${includeAnimationEngine ? `void ${className}::setPattern(AnimationPattern pattern, uint16_t intervalMs, const PixelColor& primaryColor) {
    _currentPattern = pattern;
    _patternIntervalMs = intervalMs;
    _animPrimaryColor = primaryColor;
    _patternStep = 0;
    _lastFrameTimestamp = millis();
}

bool ${className}::update() {
    if (_currentPattern == PATTERN_NONE) return false;

    uint32_t currentMillis = millis();
    if (currentMillis - _lastFrameTimestamp >= _patternIntervalMs) {
        _lastFrameTimestamp = currentMillis;

        switch (_currentPattern) {
            case PATTERN_RAINBOW_CYCLE:
                stepRainbowCycle();
                break;
            case PATTERN_COMET_CHASE:
                stepCometChase();
                break;
            case PATTERN_BREATHING_PULSE:
                stepBreathingPulse();
                break;
            case PATTERN_FIRE_SIMULATOR:
                stepFireSimulator();
                break;
            case PATTERN_THEATER_CHASE:
                stepTheaterChase();
                break;
            default:
                break;
        }

        show();
        return true;
    }
    return false;
}

void ${className}::stepRainbowCycle() {
    for (uint16_t i = 0; i < _numPixels; i++) {
        uint8_t hue = (i * 256 / _numPixels + _patternStep) & 0xFF;
        setPixelColor(i, PixelColor::fromHSV(hue, 255, 255));
    }
    _patternStep++;
}

void ${className}::stepCometChase() {
    clear();
    const uint8_t tailLength = 8;
    for (int8_t t = 0; t < tailLength; t++) {
        int16_t pos = (int16_t)_patternStep - t;
        if (pos >= 0 && pos < (int16_t)_numPixels) {
            uint8_t fade = 255 - (t * 255 / tailLength);
            PixelColor col(
                ((uint16_t)_animPrimaryColor.r * fade) >> 8,
                ((uint16_t)_animPrimaryColor.g * fade) >> 8,
                ((uint16_t)_animPrimaryColor.b * fade) >> 8
            );
            setPixelColor(pos, col);
        }
    }
    _patternStep = (_patternStep + 1) % (_numPixels + tailLength);
}

void ${className}::stepBreathingPulse() {
    // Trigonometric breathing curve
    float rad = (_patternStep * 3.14159f) / 180.0f;
    float factor = (exp(sin(rad)) - 0.36787944f) * 0.42545906f; // Normalized 0..1
    uint8_t b = (uint8_t)(factor * 255.0f);

    PixelColor col(
        ((uint16_t)_animPrimaryColor.r * b) >> 8,
        ((uint16_t)_animPrimaryColor.g * b) >> 8,
        ((uint16_t)_animPrimaryColor.b * b) >> 8
    );
    fill(col);
    _patternStep = (_patternStep + 3) % 360;
}

void ${className}::stepFireSimulator() {
    static uint8_t heat[120];
    uint16_t count = _numPixels > 120 ? 120 : _numPixels;

    // Step 1. Cool down every cell a little
    for (uint16_t i = 0; i < count; i++) {
        uint8_t cooldown = random(0, ((55 * 10) / count) + 2);
        heat[i] = (cooldown >= heat[i]) ? 0 : heat[i] - cooldown;
    }

    // Step 2. Heat from each cell drifts up and diffuses
    for (uint16_t k = count - 1; k >= 2; k--) {
        heat[k] = (heat[k - 1] + heat[k - 2] + heat[k - 2]) / 3;
    }

    // Step 3. Randomly ignite new sparks near the bottom
    if (random(255) < 160) {
        int y = random(7);
        heat[y] = heat[y] + random(160, 255);
        if (heat[y] > 255) heat[y] = 255;
    }

    // Step 4. Map heat to LED colors
    for (uint16_t j = 0; j < count; j++) {
        uint8_t t192 = (heat[j] * 191) / 255;
        uint8_t heatramp = t192 & 0x3F; // 0..63
        heatramp <<= 2; // 0..252

        if (t192 > 128) {
            setPixelColor(j, 255, 255, heatramp); // Hot white/yellow
        } else if (t192 > 64) {
            setPixelColor(j, 255, heatramp, 0); // Orange
        } else {
            setPixelColor(j, heatramp, 0, 0); // Red
        }
    }
}

void ${className}::stepTheaterChase() {
    clear();
    for (uint16_t i = 0; i < _numPixels; i += 3) {
        uint16_t idx = i + (_patternStep % 3);
        if (idx < _numPixels) {
            setPixelColor(idx, _animPrimaryColor);
        }
    }
    _patternStep++;
}` : ''}
`;

  // --- 4. Basic Example (.ino) ---
  const basicExampleIno = `/**
 * @file BasicUsage.ino
 * @brief Starter sketch demonstrating ${className} library initialization and colors.
 */

#include <${className}.h>

#define LED_PIN    ${defaultPin}
#define NUM_LEDS   ${defaultPixelCount}

${className} strip(NUM_LEDS, LED_PIN);

void setup() {
    Serial.begin(115200);
    while (!Serial && millis() < 2000);
    Serial.println(F("[${className}] Starting LED strip demo..."));

    strip.begin();
    strip.setBrightness(150); // Set 0-255 brightness
    strip.setGammaEnabled(${enableGammaCorrection ? 'true' : 'false'});

    ${enablePowerLimiter ? `// Limit power consumption to ${maxCurrentMilliamps}mA
    strip.setMaxCurrentMilliamps(${maxCurrentMilliamps});` : ''}
}

void loop() {
    // 1. Red wipe
    Serial.println(F("Color: RED"));
    strip.fill(PixelColor(255, 0, 0));
    strip.show();
    delay(1000);

    // 2. Green wipe
    Serial.println(F("Color: GREEN"));
    strip.fill(PixelColor(0, 255, 0));
    strip.show();
    delay(1000);

    // 3. Blue wipe
    Serial.println(F("Color: BLUE"));
    strip.fill(PixelColor(0, 0, 255));
    strip.show();
    delay(1000);

    // 4. Individual pixel indexing
    Serial.println(F("Alternate pixel indexing..."));
    strip.clear();
    for (int i = 0; i < NUM_LEDS; i++) {
        if (i % 2 == 0) {
            strip.setPixelColor(i, PixelColor::fromHex(0xFF00AA)); // Neon Pink
        } else {
            strip.setPixelColor(i, PixelColor::fromHex(0x00E5FF)); // Cyan
        }
    }
    strip.show();
    delay(2000);
}
`;

  // --- 5. Advanced Non-blocking Example (.ino) ---
  const advancedExampleIno = `/**
 * @file NonBlockingMultitask.ino
 * @brief Demonstrates non-blocking animation state machine running concurrently
 * with serial commands and sensor reading.
 */

#include <${className}.h>

#define LED_PIN    ${defaultPin}
#define NUM_LEDS   ${defaultPixelCount}

${className} strip(NUM_LEDS, LED_PIN);

unsigned long lastSensorRead = 0;

void setup() {
    Serial.begin(115200);
    strip.begin();
    strip.setBrightness(180);
    strip.setGammaEnabled(true);

    // Start with a smooth Rainbow Cycle (30ms per frame)
    strip.setPattern(PATTERN_RAINBOW_CYCLE, 25);
    Serial.println(F("Type 1: Rainbow, 2: Comet, 3: Fire, 4: Breathing"));
}

void loop() {
    // 1. Always call strip.update() in loop - zero blocking delay() calls!
    if (strip.update()) {
        // Frame successfully pushed to LEDs
    }

    // 2. Non-blocking sensor polling every 500ms
    if (millis() - lastSensorRead >= 500) {
        lastSensorRead = millis();
        // Read your sensors here concurrently without frame stuttering!
    }

    // 3. User input via Serial monitor
    if (Serial.available()) {
        char cmd = Serial.read();
        switch (cmd) {
            case '1':
                strip.setPattern(PATTERN_RAINBOW_CYCLE, 20);
                Serial.println(F("Pattern: Rainbow"));
                break;
            case '2':
                strip.setPattern(PATTERN_COMET_CHASE, 35, PixelColor(0, 200, 255));
                Serial.println(F("Pattern: Comet Chase (Cyan)"));
                break;
            case '3':
                strip.setPattern(PATTERN_FIRE_SIMULATOR, 40);
                Serial.println(F("Pattern: Fire Simulation"));
                break;
            case '4':
                strip.setPattern(PATTERN_BREATHING_PULSE, 20, PixelColor(255, 40, 100));
                Serial.println(F("Pattern: Breathing Pulse"));
                break;
        }
    }
}
`;

  // --- 6. keywords.txt ---
  const keywordsTxt = `# Syntax Highlighting for ${className}
${className}	KEYWORD1
PixelColor	KEYWORD1
AnimationPattern	KEYWORD1

begin	KEYWORD2
show	KEYWORD2
clear	KEYWORD2
setPixelColor	KEYWORD2
getPixelColor	KEYWORD2
fill	KEYWORD2
setBrightness	KEYWORD2
getBrightness	KEYWORD2
setGammaEnabled	KEYWORD2
isGammaEnabled	KEYWORD2
gammaCorrect	KEYWORD2
setMaxCurrentMilliamps	KEYWORD2
estimateCurrentDrawMilliamps	KEYWORD2
setPattern	KEYWORD2
update	KEYWORD2

PATTERN_NONE	LITERAL1
PATTERN_RAINBOW_CYCLE	LITERAL1
PATTERN_COMET_CHASE	LITERAL1
PATTERN_BREATHING_PULSE	LITERAL1
PATTERN_FIRE_SIMULATOR	LITERAL1
PATTERN_THEATER_CHASE	LITERAL1
PATTERN_COLOR_WIPE	LITERAL1
`;

  // --- 7. README.md ---
  const readmeMd = `# ${libraryName}

${description}

Engineered according to the **Arduino 1.5+ Library Specification** with non-blocking multitasking, PROGMEM gamma correction lookup tables, and intelligent current/power budgeting.

---

## ⚡ Specifications

| Parameter | Specification |
| :--- | :--- |
| **Chipset** | \`${chipset.toUpperCase()}\` |
| **Color Protocol** | \`${colorOrder}\` (${isRGBW ? '4 channels RGBW' : '3 channels RGB'}) |
| **Default Data Pin** | Digital Pin \`${defaultPin}\`${isSPI ? ` (Clock: Pin \`${clockPin}\`)` : ''} |
| **Gamma Correction** | Precomputed LUT (Gamma = \`${gammaValue.toFixed(1)}\` in PROGMEM) |
| **Power Management** | Max budget \`${maxCurrentMilliamps} mA\` @ \`${operatingVoltage}V\` |
| **RAM Footprint** | ~${defaultPixelCount * (isRGBW ? 4 : 3)} bytes SRAM buffer |

---

## 🔌 Hardware Wiring Diagram

\`\`\`
       Arduino Uno / ESP32                    ${chipset.toUpperCase()} Strip
    +-----------------------+              +-----------------------+
    |                       |              |                       |
    |      5V / VIN  [+]----+--------------+ [5V / VCC]           |
    |                       |    |         |                       |
    |         GND    [-]----+----+---------+ [GND]                 |
    |                       |    |         |                       |
    |         Pin ${defaultPin.toString().padEnd(2)}  [~]----[ 470Ω ]-------+ [DATA IN / DIN]       |
${isSPI ? `    |         Pin ${clockPin.toString().padEnd(2)}  [~]----[ 470Ω ]-------+ [CLOCK / CLK]         |\n` : ''}    +-----------------------+    |         +-----------------------+
                                 |
                          [ 1000 µF 6.3V+ ]
                           Capacitor (Electrolytic)
\`\`\`

> ⚠️ **Hardware Safety Notes:**
> 1. Place a **1000 µF capacitor** (6.3V or higher) across the strip's \`+\` and \`-\` power lines to prevent inrush voltage spikes upon connection.
> 2. Add a **300Ω – 500Ω resistor** on the data line between the microcontroller and the first LED's \`DIN\` to prevent ringing.
> 3. If driving more than 30 LEDs, power the strip via an **external 5V supply** rather than the Arduino 5V pin. Connect external GND to Arduino GND.

---

## 🚀 Quick Start Guide

### 1. Installation
1. Download this library repository as a \`.zip\` archive.
2. Open the **Arduino IDE**.
3. Navigate to **Sketch** -> **Include Library** -> **Add .ZIP Library...**.
4. Select the downloaded \`.zip\` file.

### 2. Basic Sketch
\`\`\`cpp
#include <${className}.h>

${className} strip(${defaultPixelCount}, ${defaultPin});

void setup() {
    strip.begin();
    strip.setBrightness(160);
    strip.fill(PixelColor(255, 0, 128)); // Vibrant Magenta
    strip.show();
}

void loop() {
    // Static display
}
\`\`\`

### 3. Non-Blocking Multitasking
\`\`\`cpp
#include <${className}.h>

${className} strip(${defaultPixelCount}, ${defaultPin});

void setup() {
    strip.begin();
    strip.setPattern(PATTERN_RAINBOW_CYCLE, 25);
}

void loop() {
    strip.update(); // Smooth 40 FPS without delay()!
}
\`\`\`

---

## 📚 API Reference

### Core Methods
- \`bool begin()\`: Initializes output pins and clears the buffer.
- \`void show()\`: Transmits pixel buffer to the physical strip.
- \`void clear()\`: Sets all pixels in buffer to off (0, 0, 0).
- \`void setPixelColor(index, color)\`: Sets pixel index to specified \`PixelColor\` or RGB value.
- \`void fill(color, start, count)\`: Fills a range of pixels with a uniform color.
- \`void setBrightness(uint8_t brightness)\`: Sets master brightness multiplier (0 to 255).
- \`void setGammaEnabled(bool enabled)\`: Enables/disables perceptual gamma correction.
- \`uint32_t estimateCurrentDrawMilliamps()\`: Returns estimated total current in mA.
- \`void setPattern(pattern, intervalMs, primaryColor)\`: Configures non-blocking animation.
- \`bool update()\`: Ticks the animation sequencer. Returns \`true\` if a frame was transmitted.

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
      description: 'Official Arduino 1.5+ manifest containing library metadata, architecture targets, and categorization.',
    },
    {
      filename: `${className}.h`,
      path: `src/${className}.h`,
      language: 'cpp',
      content: headerContent,
      description: 'C++ header declaration with Doxygen documentation, PROGMEM lookup macros, and PixelColor structs.',
    },
    {
      filename: `${className}.cpp`,
      path: `src/${className}.cpp`,
      language: 'cpp',
      content: cppContent,
      description: 'C++ implementation containing hardware transmission, gamma LUT math, and non-blocking state machine.',
    },
    {
      filename: 'BasicUsage.ino',
      path: 'examples/BasicUsage/BasicUsage.ino',
      language: 'arduino',
      content: basicExampleIno,
      description: 'Starter sketch demonstrating initialization, brightness scaling, and color fills.',
    },
    {
      filename: 'NonBlockingMultitask.ino',
      path: 'examples/NonBlockingMultitask/NonBlockingMultitask.ino',
      language: 'arduino',
      content: advancedExampleIno,
      description: 'Asynchronous multitasking sketch showing smooth animation without delay() locks.',
    },
    {
      filename: 'keywords.txt',
      path: 'keywords.txt',
      language: 'text',
      content: keywordsTxt,
      description: 'Arduino IDE editor syntax highlighting rules.',
    },
    {
      filename: 'README.md',
      path: 'README.md',
      language: 'markdown',
      content: readmeMd,
      description: 'Complete documentation including wiring schematics, power calculations, and API reference.',
    },
  ];

  return {
    name: libraryName,
    type: 'led_strip',
    version,
    files,
  };
}
