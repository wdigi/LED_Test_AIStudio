import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Zap, Eye, Sliders, Activity, Info } from 'lucide-react';
import { LedStripConfig } from '../types/library';

interface LedStripVisualizerProps {
  config: LedStripConfig;
  onUpdateConfig: (updated: Partial<LedStripConfig>) => void;
}

export const LedStripVisualizer: React.FC<LedStripVisualizerProps> = ({
  config,
  onUpdateConfig,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [selectedPattern, setSelectedPattern] = useState<string>('rainbow');
  const [stripLayout, setStripLayout] = useState<'linear' | 'ring'>('linear');
  const [simulationSpeed, setSimulationSpeed] = useState<number>(30); // ms per step
  const [selectedLedIndex, setSelectedLedIndex] = useState<number | null>(null);
  const [telemetry, setTelemetry] = useState({
    fps: 0,
    currentMa: 0,
    wattage: 0,
    maxMa: config.maxCurrentMilliamps,
  });

  const stateRef = useRef({
    step: 0,
    lastFrameTime: performance.now(),
    frameCount: 0,
    lastFpsUpdate: performance.now(),
    pixels: [] as { r: number; g: number; b: number; w?: number }[],
    fireHeat: [] as number[],
  });

  // Keep pixel buffer initialized
  useEffect(() => {
    const count = config.defaultPixelCount;
    stateRef.current.pixels = Array.from({ length: count }, () => ({
      r: 0,
      g: 0,
      b: 0,
      w: 0,
    }));
    stateRef.current.fireHeat = Array.from({ length: count }, () => 0);
  }, [config.defaultPixelCount]);

  // Main Canvas Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render);

      const state = stateRef.current;
      const count = config.defaultPixelCount;

      // Handle timing
      if (isPlaying && now - state.lastFrameTime >= simulationSpeed) {
        state.lastFrameTime = now;
        state.step++;

        // Calculate pattern colors
        const brightness = config.enablePowerLimiter ? config.gammaValue : 1;
        const bScale = (config.enablePowerLimiter ? 180 : 255) / 255;

        for (let i = 0; i < count; i++) {
          let r = 0;
          let g = 0;
          let b = 0;
          let w = 0;

          if (selectedPattern === 'rainbow') {
            const hue = ((i * 256) / count + state.step * 2) % 256;
            const rgb = hsvToRgb(hue / 256, 1, 1);
            r = rgb.r;
            g = rgb.g;
            b = rgb.b;
          } else if (selectedPattern === 'comet') {
            const tail = 8;
            const head = state.step % (count + tail);
            const dist = head - i;
            if (dist >= 0 && dist < tail) {
              const fade = 1 - dist / tail;
              r = Math.round(0 * fade);
              g = Math.round(220 * fade);
              b = Math.round(255 * fade);
            }
          } else if (selectedPattern === 'breathing') {
            const rad = ((state.step * 4) % 360) * (Math.PI / 180);
            const factor = (Math.exp(Math.sin(rad)) - 0.36787944) * 0.42545906;
            r = Math.round(255 * factor);
            g = Math.round(40 * factor);
            b = Math.round(130 * factor);
          } else if (selectedPattern === 'fire') {
            // Cool down
            const cooldown = Math.floor(Math.random() * ((55 * 10) / count + 2));
            state.fireHeat[i] = Math.max(0, (state.fireHeat[i] || 0) - cooldown);

            // Diffusion
            if (i >= 2) {
              state.fireHeat[i] = Math.floor(
                ((state.fireHeat[i - 1] || 0) +
                  (state.fireHeat[i - 2] || 0) +
                  (state.fireHeat[i - 2] || 0)) /
                  3
              );
            }
            // Spark
            if (i < 3 && Math.random() < 0.3) {
              state.fireHeat[i] = Math.min(255, (state.fireHeat[i] || 0) + 180 + Math.floor(Math.random() * 75));
            }

            const h = state.fireHeat[i] || 0;
            if (h > 128) {
              r = 255;
              g = 255;
              b = (h - 128) * 2;
            } else if (h > 64) {
              r = 255;
              g = (h - 64) * 4;
              b = 0;
            } else {
              r = h * 4;
              g = 0;
              b = 0;
            }
          } else if (selectedPattern === 'theater') {
            if ((i + state.step) % 3 === 0) {
              r = 255;
              g = 200;
              b = 0;
            }
          } else if (selectedPattern === 'static') {
            // Subtle amber glow
            r = 255;
            g = 140;
            b = 20;
          }

          // Apply gamma correction if enabled
          if (config.enableGammaCorrection) {
            r = Math.round(Math.pow(r / 255, config.gammaValue) * 255);
            g = Math.round(Math.pow(g / 255, config.gammaValue) * 255);
            b = Math.round(Math.pow(b / 255, config.gammaValue) * 255);
          }

          state.pixels[i] = { r, g, b, w };
        }

        // Calculate power consumption
        let totalMa = count * 1; // 1mA quiescent per IC
        for (let i = 0; i < count; i++) {
          const p = state.pixels[i];
          if (p) {
            totalMa += ((p.r + p.g + p.b) / (255 * 3)) * 55;
          }
        }
        totalMa = Math.round(totalMa);
        const wattage = Number(((totalMa / 1000) * config.operatingVoltage).toFixed(2));

        // FPS counter
        state.frameCount++;
        if (now - state.lastFpsUpdate >= 500) {
          const fps = Math.round((state.frameCount * 1000) / (now - state.lastFpsUpdate));
          state.frameCount = 0;
          state.lastFpsUpdate = now;
          setTelemetry({
            fps,
            currentMa: totalMa,
            wattage,
            maxMa: config.maxCurrentMilliamps,
          });
        }
      }

      // --- Canvas Drawing ---
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.save();
      ctx.scale(dpr, dpr);

      // Background: PCB black matte finish
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Draw PCB copper traces / subtle grid
      ctx.strokeStyle = '#151e2e';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      if (stripLayout === 'linear') {
        renderLinearStrip(ctx, width, height, count, state.pixels);
      } else {
        renderRingStrip(ctx, width, height, count, state.pixels);
      }

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, selectedPattern, stripLayout, simulationSpeed, config]);

  // Render Linear LED strip on breadboard/flexible PCB
  const renderLinearStrip = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    count: number,
    pixels: { r: number; g: number; b: number; w?: number }[]
  ) => {
    const paddingX = 40;
    const stripY = height / 2;
    const stripHeight = 36;
    const availableWidth = width - paddingX * 2;
    const ledSpacing = availableWidth / Math.max(count - 1, 1);

    // Strip substrate (flexible PCB band)
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(paddingX - 18, stripY - stripHeight / 2, availableWidth + 36, stripHeight, 4);
    } else {
      // Cross-browser iOS Safari fallback
      const rx = paddingX - 18;
      const ry = stripY - stripHeight / 2;
      const rw = availableWidth + 36;
      const rh = stripHeight;
      const rad = 4;
      ctx.moveTo(rx + rad, ry);
      ctx.lineTo(rx + rw - rad, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad);
      ctx.lineTo(rx + rw, ry + rh - rad);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh);
      ctx.lineTo(rx + rad, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad);
      ctx.lineTo(rx, ry + rad);
      ctx.quadraticCurveTo(rx, ry, rx + rad, ry);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    // 5V and GND copper rails along top and bottom
    ctx.fillStyle = '#b45309';
    ctx.fillRect(paddingX - 16, stripY - stripHeight / 2 + 2, availableWidth + 32, 2);
    ctx.fillRect(paddingX - 16, stripY + stripHeight / 2 - 4, availableWidth + 32, 2);

    // Render individual LEDs
    const ledSize = Math.max(6, Math.min(20, ledSpacing * 0.75));

    for (let i = 0; i < count; i++) {
      const x = paddingX + i * ledSpacing;
      const y = stripY;
      const p = pixels[i] || { r: 0, g: 0, b: 0 };
      const isSelected = selectedLedIndex === i;

      // LED SMD package (White 5050 package)
      ctx.fillStyle = '#1f2937';
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#374151';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.fillRect(x - ledSize / 2, y - ledSize / 2, ledSize, ledSize);
      ctx.strokeRect(x - ledSize / 2, y - ledSize / 2, ledSize, ledSize);

      // Gold pins on top & bottom
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x - ledSize / 2 + 2, y - ledSize / 2 - 2, 3, 2);
      ctx.fillRect(x + ledSize / 2 - 5, y - ledSize / 2 - 2, 3, 2);
      ctx.fillRect(x - ledSize / 2 + 2, y + ledSize / 2, 3, 2);
      ctx.fillRect(x + ledSize / 2 - 5, y + ledSize / 2, 3, 2);

      // Optical circular lens
      const radius = ledSize * 0.38;
      const colorStr = `rgb(${p.r}, ${p.g}, ${p.b})`;

      // Photon light bloom glow
      if (p.r > 20 || p.g > 20 || p.b > 20) {
        const glowRadius = ledSize * 1.8;
        const radial = ctx.createRadialGradient(x, y, radius * 0.5, x, y, glowRadius);
        radial.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, 0.5)`);
        radial.addColorStop(0.5, `rgba(${p.r}, ${p.g}, ${p.b}, 0.15)`);
        radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Phosphor emitter die inside
      ctx.fillStyle = colorStr;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Render Circular Ring Layout
  const renderRingStrip = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    count: number,
    pixels: { r: number; g: number; b: number; w?: number }[]
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.38;
    const ringThickness = 32;

    // Ring PCB track
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = ringThickness;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Concentric copper power rings
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - ringThickness / 2 + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + ringThickness / 2 - 3, 0, Math.PI * 2);
    ctx.stroke();

    // Render LEDs along circumference
    const ledSize = Math.max(8, Math.min(18, (2 * Math.PI * radius) / count * 0.65));

    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const p = pixels[i] || { r: 0, g: 0, b: 0 };
      const isSelected = selectedLedIndex === i;

      // Glow
      if (p.r > 20 || p.g > 20 || p.b > 20) {
        const glowRad = ledSize * 1.6;
        const radial = ctx.createRadialGradient(x, y, ledSize * 0.3, x, y, glowRad);
        radial.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, 0.5)`);
        radial.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(x, y, glowRad, 0, Math.PI * 2);
        ctx.fill();
      }

      // Emitter die
      ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`;
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#334155';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.beginPath();
      ctx.arc(x, y, ledSize * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const count = config.defaultPixelCount;

    if (stripLayout === 'linear') {
      const paddingX = 40;
      const availableWidth = rect.width - paddingX * 2;
      const ledSpacing = availableWidth / Math.max(count - 1, 1);
      const approxIndex = Math.round((clickX - paddingX) / ledSpacing);
      if (approxIndex >= 0 && approxIndex < count) {
        setSelectedLedIndex(approxIndex);
      }
    }
  };

  const isPowerExceeded = telemetry.currentMa > config.maxCurrentMilliamps;

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800">
      {/* Visualizer Top Bar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 rounded transition-colors"
              title={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                stateRef.current.step = 0;
                setSelectedLedIndex(null);
              }}
              className="p-1.5 text-xs text-slate-400 hover:text-white rounded transition-colors"
              title="Reset step counter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pattern selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            {[
              { id: 'rainbow', label: 'Rainbow' },
              { id: 'comet', label: 'Comet' },
              { id: 'fire', label: 'Fire' },
              { id: 'breathing', label: 'Pulse' },
              { id: 'theater', label: 'Theater' },
              { id: 'static', label: 'Static' },
            ].map((pattern) => (
              <button
                key={pattern.id}
                type="button"
                onClick={() => setSelectedPattern(pattern.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  selectedPattern === pattern.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {pattern.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Switcher & Speed slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Interval</span>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(Number(e.target.value))}
              className="w-20 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-slate-300 w-10 text-right">{simulationSpeed}ms</span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setStripLayout('linear')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                stripLayout === 'linear'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Linear
            </button>
            <button
              type="button"
              onClick={() => setStripLayout('ring')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                stripLayout === 'ring'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ring
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Canvas */}
      <div className="relative w-full h-44 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 cursor-crosshair">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full block"
        />

        {/* Overlay Badges */}
        <div className="absolute top-2.5 left-3 flex items-center gap-2 text-xs text-slate-400 font-mono pointer-events-none">
          <span className="text-cyan-400 font-semibold">{config.chipset.toUpperCase()}</span>
          <span>·</span>
          <span>{config.defaultPixelCount} LEDs</span>
          <span>·</span>
          <span>Pin {config.defaultPin}</span>
        </div>

        <div className="absolute top-2.5 right-3 flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 text-slate-300">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>{telemetry.fps} FPS</span>
          </div>
        </div>
      </div>

      {/* Electrical Telemetry & Power Limiter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Metric 1: Current Draw */}
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Estimated Current Draw</span>
            <span className="font-mono text-slate-500">
              Budget: {config.maxCurrentMilliamps} mA
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-lg font-bold font-mono tabular-nums ${
                isPowerExceeded ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {telemetry.currentMa} mA
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({telemetry.wattage} W @ {config.operatingVoltage}V)
            </span>
          </div>
          {/* Progress bar toward budget */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full transition-all duration-300 ${
                isPowerExceeded ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (telemetry.currentMa / config.maxCurrentMilliamps) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 2: Power Supply Recommendation */}
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400">Power Envelope Advice</div>
          <div className="text-xs text-slate-300 mt-1 leading-relaxed">
            {telemetry.currentMa <= 450 ? (
              <span className="text-emerald-400 font-medium">
                USB 2.0 Port Safe (under 500mA limit). Direct 5V rail OK.
              </span>
            ) : telemetry.currentMa <= 900 ? (
              <span className="text-cyan-400 font-medium">
                USB 3.0 / 1A Adapter recommended. Add 1000µF capacitor across VCC/GND.
              </span>
            ) : (
              <span className="text-amber-400 font-medium">
                External 5V {Math.ceil(telemetry.currentMa / 1000) + 1}A DC power supply required! Connect external GND to Arduino GND.
              </span>
            )}
          </div>
        </div>

        {/* Metric 3: Gamma & Pixel Inspector */}
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Selected Pixel Inspector</span>
            {selectedLedIndex !== null && (
              <span className="text-cyan-400 font-mono">LED #{selectedLedIndex}</span>
            )}
          </div>
          <div className="text-xs text-slate-300 mt-1 font-mono">
            {selectedLedIndex !== null ? (
              (() => {
                const p = stateRef.current.pixels[selectedLedIndex] || { r: 0, g: 0, b: 0 };
                return (
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3.5 h-3.5 rounded border border-slate-600"
                      style={{ backgroundColor: `rgb(${p.r}, ${p.g}, ${p.b})` }}
                    />
                    <span>
                      R:{p.r} G:{p.g} B:{p.b}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span>~{Math.round(((p.r + p.g + p.b) / (255 * 3)) * 55 + 1)}mA</span>
                  </div>
                );
              })()
            ) : (
              <span className="text-slate-500 italic">Click an LED on the strip above to inspect color & current</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper HSV to RGB function
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  let r = 0,
    g = 0,
    b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}
