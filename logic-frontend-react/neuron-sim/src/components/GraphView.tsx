'use client';

import { useEffect, useRef, useState } from 'react';

interface GraphViewProps {
  spikes: [number, number][];
  network: {
    neurons: { V: number; refUntilMs: number; lastSpikeMs: number }[];
    sParams: { pre: number; post: number; w: number; delayMs: number; tauSyn: number; jump: number; inhibitory?: boolean }[];
    fanOut: number[][];
    fanIn: number[][];
  };
  timeWindow: number; // in ms
  className?: string;
}

interface Node {
  id: number;
  x: number;
  y: number;
  label: string;
  color: string;
  isSpiking: boolean;
}

interface Edge {
  from: number;
  to: number;
  weight: number;
  delay: number;
  isInhibitory: boolean;
  spikeParticles: Array<{
    progress: number;
    startTime: number;
  }>;
}

export default function GraphView({ 
  spikes, 
  network, 
  timeWindow = 2000,
  className = ''
}: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

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

  // Initialize nodes and edges
  useEffect(() => {
    if (network.neurons.length === 0) return;

    const nodeCount = network.neurons.length;
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      const label = i === 0 ? 'x1' : i === 1 ? 'x2' : 
                   i === nodeCount - 1 ? 'O' : 
                   i === 2 ? 'H_OR' : i === 3 ? 'H_AND' : `N${i}`;
      
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
      const color = colors[i % colors.length];

      newNodes.push({
        id: i,
        x: 0, // Will be set in layout
        y: 0,
        label,
        color,
        isSpiking: false
      });
    }

    // Create edges
    for (let i = 0; i < network.sParams.length; i++) {
      const syn = network.sParams[i];
      newEdges.push({
        from: syn.pre,
        to: syn.post,
        weight: syn.w,
        delay: syn.delayMs,
        isInhibitory: syn.inhibitory || false,
        spikeParticles: []
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [network]);

  // Update spike particles
  useEffect(() => {
    if (spikes.length === 0) return;

    const currentTime = Math.max(...spikes.map(([, t]) => t), 0);
    const timeStart = currentTime - timeWindow;

    // Update spike particles
    setEdges(prevEdges => {
      return prevEdges.map(edge => {
        const newParticles = [...edge.spikeParticles];
        
        // Add new particles for recent spikes
        const recentSpikes = spikes.filter(([neuronId, time]) => 
          neuronId === edge.from && time >= timeStart
        );
        
        recentSpikes.forEach(([, time]) => {
          newParticles.push({
            progress: 0,
            startTime: time
          });
        });

        // Update existing particles
        const updatedParticles = newParticles
          .map(particle => ({
            ...particle,
            progress: Math.min(1, (currentTime - particle.startTime) / edge.delay)
          }))
          .filter(particle => particle.progress < 1);

        return { ...edge, spikeParticles: updatedParticles };
      });
    });
  }, [spikes, timeWindow]);

  // Layout nodes
  useEffect(() => {
    if (nodes.length === 0 || dimensions.width === 0) return;

    const padding = 60;
    const availableWidth = dimensions.width - 2 * padding;
    const availableHeight = dimensions.height - 2 * padding;

    // Simple layered layout
    const layers = [
      [0, 1], // Input layer
      [2, 3], // Hidden layer (if exists)
      [4]     // Output layer
    ].filter(layer => layer.some(id => id < nodes.length));

    const updatedNodes = nodes.map(node => {
      let layer = 0;
      let position = 0;
      
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].includes(node.id)) {
          layer = i;
          position = layers[i].indexOf(node.id);
          break;
        }
      }

      const x = padding + (layer / Math.max(1, layers.length - 1)) * availableWidth;
      const y = padding + (position / Math.max(1, layers[layer].length - 1)) * availableHeight;

      return { ...node, x, y };
    });

    setNodes(updatedNodes);
  }, [nodes, dimensions]);

  // Draw graph
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

    if (nodes.length === 0) return;

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (!fromNode || !toNode) return;

      // Edge color based on weight and type
      const weight = Math.abs(edge.weight);
      const alpha = Math.min(1, weight / 2);
      
      if (edge.isInhibitory) {
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`; // Red for inhibitory
      } else {
        ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`; // Green for excitatory
      }
      
      ctx.lineWidth = Math.max(1, weight * 3);
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();

      // Draw spike particles
      edge.spikeParticles.forEach(particle => {
        const x = fromNode.x + (toNode.x - fromNode.x) * particle.progress;
        const y = fromNode.y + (toNode.y - fromNode.y) * particle.progress;
        
        ctx.fillStyle = edge.isInhibitory ? '#ef4444' : '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    // Draw nodes
    nodes.forEach(node => {
      // Node background
      ctx.fillStyle = node.isSpiking ? '#fbbf24' : '#1e293b';
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
      ctx.fill();

      // Node border
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });

  }, [nodes, edges, dimensions]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: '#0f172a' }}
      />
      <div className="absolute top-2 left-2 text-sm text-slate-300">
        Network Graph
      </div>
      <div className="absolute top-2 right-2 text-xs text-slate-400">
        Green: Excitatory • Red: Inhibitory
      </div>
    </div>
  );
}
