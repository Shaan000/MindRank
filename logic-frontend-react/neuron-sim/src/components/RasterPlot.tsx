'use client';

import { useEffect, useRef, useState } from 'react';

interface RasterPlotProps {
  spikes: [number, number][];
  neuronCount: number;
  timeWindow: number; // in ms
  className?: string;
}

export default function RasterPlot({ 
  spikes, 
  neuronCount, 
  timeWindow = 2000,
  className = ''
}: RasterPlotProps) {
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

  // Draw raster plot
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

    if (neuronCount === 0) return;

    const padding = 20;
    const plotWidth = dimensions.width - 2 * padding;
    const plotHeight = dimensions.height - 2 * padding;
    const neuronHeight = plotHeight / neuronCount;

    // Draw grid lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 0; i <= neuronCount; i++) {
      const y = padding + i * neuronHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + plotWidth, y);
      ctx.stroke();
    }

    // Draw time grid
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + plotHeight);
      ctx.stroke();
    }

    // Draw spikes
    const currentTime = Math.max(...spikes.map(([, t]) => t), 0);
    const timeStart = currentTime - timeWindow;

    ctx.fillStyle = '#10b981'; // Green for spikes
    spikes.forEach(([neuronId, time]) => {
      if (time >= timeStart && time <= currentTime) {
        const x = padding + ((time - timeStart) / timeWindow) * plotWidth;
        const y = padding + neuronId * neuronHeight + neuronHeight / 2;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw neuron labels
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i < neuronCount; i++) {
      const y = padding + i * neuronHeight + neuronHeight / 2;
      const label = i === 0 ? 'x1' : i === 1 ? 'x2' : 
                   i === neuronCount - 1 ? 'O' : 
                   i === 2 ? 'H_OR' : i === 3 ? 'H_AND' : `N${i}`;
      ctx.fillText(label, padding - 5, y + 4);
    }

    // Draw time labels
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * plotWidth;
      const time = timeStart + (i / 5) * timeWindow;
      ctx.fillText(`${(time / 1000).toFixed(1)}s`, x, dimensions.height - 5);
    }

  }, [spikes, neuronCount, timeWindow, dimensions]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: '#0f172a' }}
      />
      <div className="absolute top-2 left-2 text-sm text-slate-300">
        Raster Plot
      </div>
    </div>
  );
}
