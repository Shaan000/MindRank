'use client';

import { useEffect, useRef, useState } from 'react';

interface WeightsPlotProps {
  weights: { syn: number; w: number; t: number }[];
  vth: { id: number; Vth: number; t: number }[];
  selectedSynapses: number[];
  timeWindow: number; // in ms
  className?: string;
}

const SYNAPSE_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16'  // lime
];

export default function WeightsPlot({ 
  weights, 
  vth, 
  selectedSynapses, 
  timeWindow = 2000,
  className = ''
}: WeightsPlotProps) {
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

  // Draw weights plot
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

    const padding = 40;
    const plotWidth = dimensions.width - 2 * padding;
    const plotHeight = dimensions.height - 2 * padding;

    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + plotWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + plotHeight);
      ctx.stroke();
    }

    // Draw time labels
    const currentTime = Math.max(
      ...weights.map(w => w.t),
      ...vth.map(v => v.t),
      0
    );
    const timeStart = currentTime - timeWindow;
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * plotWidth;
      const time = timeStart + (i / 5) * timeWindow;
      ctx.fillText(`${(time / 1000).toFixed(1)}s`, x, dimensions.height - 5);
    }

    // Group weights by synapse
    const weightsBySynapse = weights.reduce((acc, weight) => {
      if (!acc[weight.syn]) acc[weight.syn] = [];
      acc[weight.syn].push(weight);
      return acc;
    }, {} as Record<number, typeof weights>);

    // Group vth by neuron
    const vthByNeuron = vth.reduce((acc, v) => {
      if (!acc[v.id]) acc[v.id] = [];
      acc[v.id].push(v);
      return acc;
    }, {} as Record<number, typeof vth>);

    // Draw weight traces
    selectedSynapses.forEach((synapseId, index) => {
      const synapseWeights = weightsBySynapse[synapseId];
      if (!synapseWeights || synapseWeights.length < 2) return;

      const color = SYNAPSE_COLORS[index % SYNAPSE_COLORS.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      // Sort weights by time
      const sortedWeights = synapseWeights
        .filter(w => w.t >= timeStart && w.t <= currentTime)
        .sort((a, b) => a.t - b.t);

      if (sortedWeights.length > 0) {
        const firstWeight = sortedWeights[0];
        const x = padding + ((firstWeight.t - timeStart) / timeWindow) * plotWidth;
        const y = padding + ((2 - firstWeight.w) / 4) * plotHeight; // Map [-2, 2] to [0, 1]
        ctx.moveTo(x, y);

        for (let i = 1; i < sortedWeights.length; i++) {
          const weight = sortedWeights[i];
          const x = padding + ((weight.t - timeStart) / timeWindow) * plotWidth;
          const y = padding + ((2 - weight.w) / 4) * plotHeight;
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    });

    // Draw threshold traces
    const thresholdNeurons = Object.keys(vthByNeuron).map(Number);
    thresholdNeurons.forEach((neuronId, index) => {
      const neuronVth = vthByNeuron[neuronId];
      if (!neuronVth || neuronVth.length < 2) return;

      const color = SYNAPSE_COLORS[(index + selectedSynapses.length) % SYNAPSE_COLORS.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();

      // Sort vth by time
      const sortedVth = neuronVth
        .filter(v => v.t >= timeStart && v.t <= currentTime)
        .sort((a, b) => a.t - b.t);

      if (sortedVth.length > 0) {
        const firstVth = sortedVth[0];
        const x = padding + ((firstVth.t - timeStart) / timeWindow) * plotWidth;
        const y = padding + ((2 - (firstVth.Vth + 50) / 10) / 4) * plotHeight; // Map [-55, -45] to [0, 1]
        ctx.moveTo(x, y);

        for (let i = 1; i < sortedVth.length; i++) {
          const vth = sortedVth[i];
          const x = padding + ((vth.t - timeStart) / timeWindow) * plotWidth;
          const y = padding + ((2 - (vth.Vth + 50) / 10) / 4) * plotHeight;
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Draw value labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    
    // Weight labels
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * plotHeight;
      const value = 2 - (i / 4) * 4; // Map [0, 1] to [2, -2]
      ctx.fillText(`${value.toFixed(1)}`, padding - 5, y + 4);
    }

    // Add legend
    ctx.textAlign = 'left';
    ctx.font = '10px sans-serif';
    let legendY = padding + 20;
    
    selectedSynapses.forEach((synapseId, index) => {
      const color = SYNAPSE_COLORS[index % SYNAPSE_COLORS.length];
      ctx.fillStyle = color;
      ctx.fillRect(padding + 10, legendY - 8, 10, 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`Synapse ${synapseId}`, padding + 25, legendY);
      legendY += 15;
    });

    if (thresholdNeurons.length > 0) {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('Thresholds (dashed)', padding + 10, legendY);
    }

  }, [weights, vth, selectedSynapses, timeWindow, dimensions]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: '#0f172a' }}
      />
      <div className="absolute top-2 left-2 text-sm text-slate-300">
        Weights & Thresholds
      </div>
    </div>
  );
}
