import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create public/icon.svg
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="chip" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="100" fill="url(#bg)" />

  <!-- PCB Copper Grid Traces -->
  <path d="M 80 160 L 180 160 L 180 220" stroke="#1e293b" stroke-width="6" fill="none" stroke-linecap="round" />
  <path d="M 80 320 L 160 320 L 200 280" stroke="#1e293b" stroke-width="6" fill="none" stroke-linecap="round" />
  <path d="M 432 180 L 340 180 L 320 220" stroke="#1e293b" stroke-width="6" fill="none" stroke-linecap="round" />
  <path d="M 432 340 L 350 340 L 320 300" stroke="#1e293b" stroke-width="6" fill="none" stroke-linecap="round" />

  <!-- Outer Ring glow -->
  <circle cx="256" cy="256" r="160" stroke="#0e3a59" stroke-width="4" stroke-dasharray="12 8" fill="none" />

  <!-- Central Microcontroller IC -->
  <rect x="156" y="156" width="200" height="200" rx="24" fill="#0b1324" stroke="url(#chip)" stroke-width="8" />

  <!-- IC Pins -->
  <!-- Top Pins -->
  <line x1="196" y1="136" x2="196" y2="156" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />
  <line x1="236" y1="136" x2="236" y2="156" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />
  <line x1="276" y1="136" x2="276" y2="156" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />
  <line x1="316" y1="136" x2="316" y2="156" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />

  <!-- Bottom Pins -->
  <line x1="196" y1="356" x2="196" y2="376" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />
  <line x1="236" y1="356" x2="236" y2="376" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />
  <line x1="276" y1="356" x2="276" y2="376" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />
  <line x1="316" y1="356" x2="316" y2="376" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />

  <!-- Left Pins -->
  <line x1="136" y1="196" x2="156" y2="196" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />
  <line x1="136" y1="236" x2="156" y2="236" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />
  <line x1="136" y1="276" x2="156" y2="276" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />
  <line x1="136" y1="316" x2="156" y2="316" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />

  <!-- Right Pins -->
  <line x1="356" y1="196" x2="376" y2="196" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />
  <line x1="356" y1="236" x2="376" y2="236" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />
  <line x1="356" y1="276" x2="376" y2="276" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />
  <line x1="356" y1="316" x2="376" y2="316" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" />

  <!-- Pin 1 Dot -->
  <circle cx="180" cy="180" r="6" fill="#38bdf8" />

  <!-- Microcontroller Symbol / Text -->
  <text x="256" y="272" fill="#ffffff" font-family="-apple-system, system-ui, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="76" text-anchor="middle" letter-spacing="-2">µL</text>
  <text x="256" y="310" fill="#38bdf8" font-family="monospace" font-weight="bold" font-size="18" text-anchor="middle" letter-spacing="3">ARDUINO</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg, 'utf8');
console.log('Created public/icon.svg');

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createPngBuffer(width, height, isMaskable = false) {
  // Generate RGBA raw pixels
  // Scanline format: [filter_type, r, g, b, a, r, g, b, a, ...]
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const safeRadius = width * (isMaskable ? 0.38 : 0.45);
  const chipSize = width * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background dark slate #0b1120
      let r = 11, g = 17, b = 32, a = 255;

      // Outer glow
      if (dist < safeRadius) {
        // Gradient towards cyan
        const factor = 1 - dist / safeRadius;
        r = Math.min(255, Math.round(11 + factor * 20));
        g = Math.min(255, Math.round(17 + factor * 50));
        b = Math.min(255, Math.round(32 + factor * 90));
      }

      // Chip rectangle
      const inChip =
        Math.abs(dx) <= chipSize / 2 && Math.abs(dy) <= chipSize / 2;
      const onBorder =
        inChip &&
        (Math.abs(Math.abs(dx) - chipSize / 2) < width * 0.025 ||
          Math.abs(Math.abs(dy) - chipSize / 2) < width * 0.025);

      if (onBorder) {
        r = 6; g = 182; b = 212; // Cyan border
      } else if (inChip) {
        r = 15; g = 23; b = 42; // Deep chip fill
      }

      // Center symbol dot / accent
      if (dist < width * 0.08) {
        r = 56; g = 189; b = 248; // Light cyan center
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);

  // Assemble PNG Chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcTarget = chunk.subarray(4, 8 + len);
  const crcVal = crc32(crcTarget);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

// Generate PNG sizes
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPngBuffer(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPngBuffer(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPngBuffer(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPngBuffer(180, 180, false));

console.log('Generated PNG icons in public/: 192x192, 512x512, maskable, and apple-touch-icon');
