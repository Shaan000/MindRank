'use client';

import { useEffect, useRef, useState } from 'react';

interface TracePlotProps {
  traces: { id: number; V: number; t: number }[];
  selectedNeurons: number[];
  timeWindow: number; // in ms
  className?: string;
}

const NEURON_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16'  // lime
];

export default function TracePlot({ 
  traces, 
  selectedNeurons, 
  timeWindow = 2000,
  className = ''
}: TracePlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        setDimensions({
          width: rect.width * dpr,
          height: rect.height * dpr
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Draw trace plot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    canvas.style.width = `${dimensions.width / (window.devicePixelRatio || 1)}px`;
    canvas.style.height = `${dimensions.height / (window.devicePixelRatio || 1)}px`;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    if (traces.length === 0) return;

    const padding = 40;
    const plotWidth = dimensions.width - 2 * padding;
    const plotHeight = dimensions.height - 2 * padding;

    // Voltage range
    const vMin = -80;
    const vMax = -40;
    const vRange = vMax - vMin;

    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (voltage)
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + plotWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines (time)
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + plotHeight);
      ctx.stroke();
    }

    // Draw voltage labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * plotHeight;
      const voltage = vMax - (i / 4) * vRange;
      ctx.fillText(`${voltage.toFixed(0)}mV`, padding - 5, y + 4);
    }

    // Draw time labels
    const currentTime = Math.max(...traces.map(t => t.t), 0);
    const timeStart = currentTime - timeWindow;
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * plotWidth;
      const time = timeStart + (i / 5) * timeWindow;
      ctx.fillText(`${(time / 1000).toFixed(1)}s`, x, dimensions.height - 5);
    }

    // Group traces by neuron
    const tracesByNeuron = traces.reduce((acc, trace) => {
      if (!acc[trace.id]) acc[trace.id] = [];
      acc[trace.id].push(trace);
      return acc;
    }, {} as Record<number, typeof traces>);

    // Draw traces for each selected neuron
    selectedNeurons.forEach((neuronId, index) => {
      const neuronTraces = tracesByNeuron[neuronId];
      if (!neuronTraces || neuronTraces.length < 2) return;

      const color = NEURON_COLORS[index % NEURON_COLORS.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      // Sort traces by time
      const sortedTraces = neuronTraces
        .filter(t => t.t >= timeStart && t.t <= currentTime)
        .sort((a, b) => a.t - b.t);

      if (sortedTraces.length > 0) {
        const firstTrace = sortedTraces[0];
        const x = padding + ((firstTrace.t - timeStart) / timeWindow) * plotWidth;
        const y = padding + ((vMax - firstTrace.V) / vRange) * plotHeight;
        ctx.moveTo(x, y);

        for (let i = 1; i < sortedTraces.length; i++) {
          const trace = sortedTraces[i];
          const x = padding + ((trace.t - timeStart) / timeWindow) * plotWidth;
          const y = padding + ((vMax - trace.V) / vRange) * plotHeight;
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    });

    // Draw threshold lines
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    selectedNeurons.forEach((neuronId) => {
      const neuronTraces = tracesByNeuron[neuronId];
      if (!neuronTraces || neuronTraces.length === 0) return;

      // Use the most recent threshold (assuming it's constant for now)
      const threshold = -50; // Default threshold
      const y = padding + ((vMax - threshold) / vRange) * plotHeight;
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + plotWidth, y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

  }, [traces, selectedNeurons, timeWindow, dimensions]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: '#0f172a' }}
      />
      <div className="absolute top-2 left-2 text-sm text-slate-300">
        Membrane Traces
      </div>
    </div>
  );
}
