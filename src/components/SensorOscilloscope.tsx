import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, Zap, Sliders, Activity } from 'lucide-react';
import { SensorConfig } from '../types/library';

interface SensorOscilloscopeProps {
  config: SensorConfig;
  onUpdateConfig: (updated: Partial<SensorConfig>) => void;
}

export const SensorOscilloscope: React.FC<SensorOscilloscopeProps> = ({
  config,
  onUpdateConfig,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [noiseLevel, setNoiseLevel] = useState<number>(18); // ADC counts noise amplitude
  const [waveformType, setWaveformType] = useState<'sine' | 'step' | 'drift'>('sine');
  const [lastAlarmTriggered, setLastAlarmTriggered] = useState<boolean>(false);
  const [currentReadings, setCurrentReadings] = useState({
    raw: 0,
    filtered: 0,
    calibrated: 0,
    unit: config.unitLabel,
    alarm: false,
  });

  const stateRef = useRef({
    t: 0,
    rawHistory: [] as number[],
    filteredHistory: [] as number[],
    calibratedHistory: [] as number[],
    emaVal: 0,
    smaBuffer: [] as number[],
    injectedSpike: 0,
    stepState: false,
    maxPoints: 200,
  });

  // Calculate calibration slope & intercept
  const deltaRaw = config.calibPoint2Raw - config.calibPoint1Raw;
  const deltaUnit = config.calibPoint2Unit - config.calibPoint1Unit;
  const slope = deltaRaw !== 0 ? deltaUnit / deltaRaw : 1.0;
  const intercept = config.calibPoint1Unit - slope * config.calibPoint1Raw;

  // Initialize buffer
  useEffect(() => {
    stateRef.current.rawHistory = new Array(stateRef.current.maxPoints).fill(512);
    stateRef.current.filteredHistory = new Array(stateRef.current.maxPoints).fill(512);
    stateRef.current.calibratedHistory = new Array(stateRef.current.maxPoints).fill(
      slope * 512 + intercept
    );
    stateRef.current.emaVal = 512;
    stateRef.current.smaBuffer = new Array(config.filterWindowSize || 8).fill(512);
  }, [config.filterWindowSize, slope, intercept]);

  // Main Oscilloscope Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTick = performance.now();

    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render);

      // Tick every ~30ms (approx 33Hz sampling rate)
      if (isPlaying && now - lastTick >= 30) {
        lastTick = now;
        const state = stateRef.current;
        state.t += 0.05;

        // Base signal generation
        let base = 512; // Middle of 10-bit ADC (0..1023)
        if (waveformType === 'sine') {
          base = 512 + Math.sin(state.t * 0.8) * 220;
        } else if (waveformType === 'step') {
          if (Math.floor(state.t) % 4 === 0 && !state.stepState) {
            state.stepState = true;
          } else if (Math.floor(state.t) % 4 === 2 && state.stepState) {
            state.stepState = false;
          }
          base = state.stepState ? 750 : 280;
        } else if (waveformType === 'drift') {
          base = 400 + Math.sin(state.t * 0.2) * 350 + Math.cos(state.t * 0.07) * 80;
        }

        // Add gaussian-like noise
        const noise = (Math.random() - 0.5) * noiseLevel * 2;
        let raw = Math.round(base + noise + state.injectedSpike);
        raw = Math.max(0, Math.min(1023, raw));

        // Decay injected spike
        if (state.injectedSpike !== 0) {
          state.injectedSpike = Math.round(state.injectedSpike * 0.7);
          if (Math.abs(state.injectedSpike) < 3) state.injectedSpike = 0;
        }

        // Apply DSP Filtering
        let filtered = raw;
        if (config.filterType === 'ema') {
          const alpha = config.filterAlpha;
          state.emaVal = alpha * raw + (1.0 - alpha) * state.emaVal;
          filtered = state.emaVal;
        } else if (config.filterType === 'sma') {
          state.smaBuffer.push(raw);
          if (state.smaBuffer.length > (config.filterWindowSize || 8)) {
            state.smaBuffer.shift();
          }
          const sum = state.smaBuffer.reduce((a, b) => a + b, 0);
          filtered = sum / state.smaBuffer.length;
        } else if (config.filterType === 'median') {
          state.smaBuffer.push(raw);
          if (state.smaBuffer.length > 5) state.smaBuffer.shift();
          const sorted = [...state.smaBuffer].sort((a, b) => a - b);
          filtered = sorted[Math.floor(sorted.length / 2)] || raw;
        }

        // Apply 2-point calibration
        const calibrated = slope * filtered + intercept;

        // Check alarms with hysteresis
        const isHighAlarm =
          config.enableThresholdAlarm && calibrated >= config.highThreshold;
        if (isHighAlarm !== lastAlarmTriggered) {
          setLastAlarmTriggered(isHighAlarm);
        }

        // Push to ring buffers
        state.rawHistory.push(raw);
        if (state.rawHistory.length > state.maxPoints) state.rawHistory.shift();

        state.filteredHistory.push(filtered);
        if (state.filteredHistory.length > state.maxPoints) state.filteredHistory.shift();

        state.calibratedHistory.push(calibrated);
        if (state.calibratedHistory.length > state.maxPoints) state.calibratedHistory.shift();

        setCurrentReadings({
          raw,
          filtered: Math.round(filtered * 10) / 10,
          calibrated: Math.round(calibrated * 100) / 100,
          unit: config.unitLabel,
          alarm: isHighAlarm,
        });
      }

      // Draw Oscilloscope Canvas
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Oscilloscope Phosphor Graticule Screen
      ctx.fillStyle = '#060d16';
      ctx.fillRect(0, 0, width, height);

      // Grid Graticule (10x8 subdivisions)
      ctx.strokeStyle = '#0e2433';
      ctx.lineWidth = 1;
      const gridCols = 10;
      const gridRows = 8;
      for (let c = 0; c <= gridCols; c++) {
        const x = (c * width) / gridCols;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let r = 0; r <= gridRows; r++) {
        const y = (r * height) / gridRows;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Central crosshair ticks
      ctx.strokeStyle = '#183b54';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      const state = stateRef.current;
      const n = state.rawHistory.length;

      // Draw Raw Signal (Green trace)
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * width;
        const norm = state.rawHistory[i] / 1023; // 0..1
        const y = height - (norm * (height - 30) + 15);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Filtered Signal (Cyan trace with soft glow)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * width;
        const norm = state.filteredHistory[i] / 1023;
        const y = height - (norm * (height - 30) + 15);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset glow

      // Draw Alarm Threshold Line if active
      if (config.enableThresholdAlarm) {
        // Map highThreshold to canvas Y via reverse calibration
        const threshAdc = (config.highThreshold - intercept) / slope;
        const threshNorm = threshAdc / 1023;
        const threshY = height - (threshNorm * (height - 30) + 15);

        if (threshY >= 0 && threshY <= height) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(0, threshY);
          ctx.lineTo(width, threshY);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#ef4444';
          ctx.font = '10px JetBrains Mono';
          ctx.fillText(`ALARM ${config.highThreshold}${config.unitLabel}`, width - 110, threshY - 5);
        }
      }

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    isPlaying,
    noiseLevel,
    waveformType,
    config,
    slope,
    intercept,
    lastAlarmTriggered,
  ]);

  const injectGlitch = () => {
    stateRef.current.injectedSpike = Math.random() > 0.5 ? 380 : -350;
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 rounded transition-colors"
              title={isPlaying ? 'Pause signal stream' : 'Play signal stream'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                stateRef.current.t = 0;
                stateRef.current.emaVal = 512;
              }}
              className="p-1.5 text-xs text-slate-400 hover:text-white rounded transition-colors"
              title="Reset signal generator"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Waveform selection */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            {[
              { id: 'sine', label: 'Sinusoid' },
              { id: 'step', label: 'Step Pulse' },
              { id: 'drift', label: 'Thermal Drift' },
            ].map((wave) => (
              <button
                key={wave.id}
                type="button"
                onClick={() => setWaveformType(wave.id as any)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  waveformType === wave.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {wave.label}
              </button>
            ))}
          </div>
        </div>

        {/* Noise & Glitch Simulator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Noise</span>
            <input
              type="range"
              min="0"
              max="60"
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(Number(e.target.value))}
              className="w-20 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-slate-300 w-10 text-right">±{noiseLevel}</span>
          </div>

          <button
            type="button"
            onClick={injectGlitch}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors whitespace-nowrap"
            title="Inject a large transient electrical spike to test filter resilience"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Inject Spike</span>
          </button>
        </div>
      </div>

      {/* Real-time Oscilloscope Viewport */}
      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Legend Overlay */}
        <div className="absolute top-2.5 left-3 flex items-center gap-3 text-xs font-mono pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-400/80 inline-block" />
            <span className="text-slate-400">Raw ADC ({currentReadings.raw})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
            <span className="text-cyan-300 font-semibold">
              Filtered ({currentReadings.filtered})
            </span>
          </div>
        </div>

        {/* Current Engineering Value Display */}
        <div className="absolute top-2.5 right-3 flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-md border font-mono ${
              currentReadings.alarm
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            {currentReadings.alarm && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
            <span className="text-sm font-bold tabular-nums">
              {currentReadings.calibrated} {currentReadings.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Calibration Telemetry Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Metric 1: Digital Filter Math */}
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Filter Mode</span>
            <span className="text-cyan-400 font-mono font-semibold">
              {config.filterType.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-slate-300 font-mono mt-1">
            {config.filterType === 'ema' && (
              <div className="flex items-center justify-between">
                <span>α = {config.filterAlpha.toFixed(2)}</span>
                <span className="text-slate-500">y[n] = α·x + (1-α)·y[n-1]</span>
              </div>
            )}
            {config.filterType === 'sma' && (
              <div className="flex items-center justify-between">
                <span>Window: {config.filterWindowSize} samples</span>
                <span className="text-slate-500">Circular buffer</span>
              </div>
            )}
            {config.filterType === 'median' && (
              <div className="flex items-center justify-between">
                <span>5-point Median</span>
                <span className="text-slate-500">Spike rejection</span>
              </div>
            )}
          </div>
        </div>

        {/* Metric 2: Linear Calibration Coefficients */}
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Calibration Curve</span>
            <span className="text-slate-400 font-mono">y = mx + b</span>
          </div>
          <div className="text-xs text-slate-300 font-mono mt-1 flex flex-col gap-0.5">
            <div>
              Slope (m): <span className="text-cyan-400 tabular-nums">{slope.toFixed(4)}</span>
            </div>
            <div>
              Offset (b): <span className="text-cyan-400 tabular-nums">{intercept.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Threshold Comparator */}
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Alarm Comparator</span>
            <span
              className={`font-mono text-xs font-semibold ${
                currentReadings.alarm ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {currentReadings.alarm ? 'TRIPPED' : 'NOMINAL'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {config.enableThresholdAlarm ? (
              <span>
                High: {config.highThreshold} {config.unitLabel} (Hyst: {config.hysteresis} {config.unitLabel})
              </span>
            ) : (
              <span className="text-slate-500">Alarms disabled</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
